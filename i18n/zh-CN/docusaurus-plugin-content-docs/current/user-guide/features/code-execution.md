---
sidebar_position: 8
title: "Code Execution"
description: "Programmatic Python execution with RPC tool access — collapse multi-step workflows into a single turn"
---

# Code Execution（程序化工具调用）

`execute_code` 工具允许智能体编写 Python 脚本，以程序化方式调用 Hermes 工具，将多步工作流压缩为单个 LLM 轮次。该脚本在智能体宿主机上的子进程中运行，通过 Unix 域套接字 RPC 与 Hermes 通信。

## 工作原理

1. 智能体使用 `from hermes_tools import ...` 编写 Python 脚本
2. Hermes 生成一个包含 RPC 函数的存根模块 `hermes_tools.py`
3. Hermes 打开一个 Unix 域套接字并启动 RPC 监听线程
4. 脚本在子进程中运行——工具调用通过套接字传回 Hermes
5. 只有脚本的 `print()` 输出会返回给 LLM；中间工具结果永远不会进入上下文窗口

```python
# 智能体可以编写如下脚本：
from hermes_tools import web_search, web_extract

results = web_search("Python 3.13 features", limit=5)
for r in results["data"]["web"]:
    content = web_extract([r["url"]])
    # ... 过滤和处理 ...
print(summary)
```

**脚本内可用的工具：** `web_search`、`web_extract`、`read_file`、`write_file`、`search_files`、`patch`、`terminal`（仅限前台）。

## 智能体何时使用此功能

智能体在以下情况下使用 `execute_code`：

- **3个以上工具调用** 之间存在处理逻辑
- 批量数据过滤或条件分支
- 对结果进行循环遍历

核心优势：中间工具结果永远不会进入上下文窗口——只有最终的 `print()` 输出才会返回，从而大幅减少 token 使用量。

## 实际示例

### 数据处理管道

```python
from hermes_tools import search_files, read_file
import json

# 查找所有配置文件并提取数据库设置
matches = search_files("database", path=".", file_glob="*.yaml", limit=20)
configs = []
for match in matches.get("matches", []):
    content = read_file(match["path"])
    configs.append({"file": match["path"], "preview": content["content"][:200]})

print(json.dumps(configs, indent=2))
```

### 多步骤网络调研

```python
from hermes_tools import web_search, web_extract
import json

# 在单轮中完成搜索、提取和摘要
results = web_search("Rust async runtime comparison 2025", limit=5)
summaries = []
for r in results["data"]["web"]:
    page = web_extract([r["url"]])
    for p in page.get("results", []):
        if p.get("content"):
            summaries.append({
                "title": r["title"],
                "url": r["url"],
                "excerpt": p["content"][:500]
            })

print(json.dumps(summaries, indent=2))
```

### 批量文件重构

```python
from hermes_tools import search_files, read_file, patch

# 查找所有使用已弃用 API 的 Python 文件并修复
matches = search_files("old_api_call", path="src/", file_glob="*.py")
fixed = 0
for match in matches.get("matches", []):
    result = patch(
        path=match["path"],
        old_string="old_api_call(",
        new_string="new_api_call(",
        replace_all=True
    )
    if "error" not in str(result):
        fixed += 1

print(f"Fixed {fixed} files out of {len(matches.get('matches', []))} matches")
```

### 构建与测试管道

```python
from hermes_tools import terminal, read_file
import json

# 运行测试、解析结果并生成报告
result = terminal("cd /project && python -m pytest --tb=short -q 2>&1", timeout=120)
output = result.get("output", "")

# 解析测试输出
passed = output.count(" passed")
failed = output.count(" failed")
errors = output.count(" error")

report = {
    "passed": passed,
    "failed": failed,
    "errors": errors,
    "exit_code": result.get("exit_code", -1),
    "summary": output[-500:] if len(output) > 500 else output
}

print(json.dumps(report, indent=2))
```

## 执行模式

`execute_code` 有两种执行模式，由 `~/.hermes/config.yaml` 中的 `code_execution.mode` 控制：

| 模式 | 工作目录 | Python 解释器 |
|------|----------|---------------|
| **`project`**（默认） | 会话的工作目录（与 `terminal()` 相同） | 当前激活的 `VIRTUAL_ENV` / `CONDA_PREFIX` python，回退到 Hermes 自带的 python |
| `strict` | 与用户项目隔离的临时暂存目录 | `sys.executable`（Hermes 自带的 python） |

**何时保持 `project` 模式：** 你希望 `import pandas`、`from my_project import foo` 或 `open(".env")` 等相对路径的用法与 `terminal()` 中的行为一致。绝大多数情况下都应使用此模式。

**何时切换到 `strict` 模式：** 你需要最大程度的可复现性——希望每次会话使用相同的解释器，无论用户激活了哪个 venv，并且希望脚本与项目树隔离（不存在通过相对路径意外读取项目文件的风险）。

```yaml
# ~/.hermes/config.yaml
code_execution:
  mode: project   # 或 "strict"
```

`project` 模式下的回退行为：如果 `VIRTUAL_ENV` / `CONDA_PREFIX` 未设置、损坏或指向低于 3.8 的 Python 版本，解析器将干净地回退到 `sys.executable`——绝不会让智能体缺少可用的解释器。

两种模式的安全关键不变量完全相同：

- 环境清理（API 密钥、token、凭证被清除）
- 工具白名单（脚本不能递归调用 `execute_code`、`delegate_task` 或 MCP 工具）
- 资源限制（超时、stdout 上限、工具调用上限）

切换模式只会改变脚本的运行位置和使用的解释器，不会改变脚本能访问的凭证或能调用的工具。

## 资源限制

| 资源 | 限制 | 说明 |
|------|------|------|
| **超时** | 5 分钟（300 秒） | 脚本被 SIGTERM 终止，5 秒宽限期后 SIGKILL |
| **Stdout** | 50 KB | 输出被截断并附带 `[output truncated at 50KB]` 提示 |
| **Stderr** | 10 KB | 非零退出时包含在输出中以便调试 |
| **工具调用** | 每次执行 50 次 | 达到限制时返回错误 |

所有限制都可通过 `config.yaml` 配置：

```yaml
# 在 ~/.hermes/config.yaml 中
code_execution:
  mode: project      # project（默认）| strict
  timeout: 300       # 每次脚本最长秒数（默认：300）
  max_tool_calls: 50 # 每次执行最大工具调用次数（默认：50）
```

## 脚本内工具调用的工作原理

当脚本调用如 `web_search("query")` 之类的函数时：

1. 调用被序列化为 JSON 并通过 Unix 域套接字发送到父进程
2. 父进程通过标准的 `handle_function_call` 处理器进行分发
3. 结果通过套接字发回
4. 函数返回解析后的结果

这意味着脚本内的工具调用行为与正常工具调用完全一致——相同的速率限制、相同的错误处理、相同的能力。唯一的限制是 `terminal()` 仅支持前台模式（无 `background` 或 `pty` 参数）。

## 错误处理

当脚本失败时，智能体会收到结构化的错误信息：

- **非零退出码**：stderr 包含在输出中，智能体可以看到完整的回溯信息
- **超时**：脚本被终止，智能体会看到 `"Script timed out after 300s and was killed."`
- **中断**：如果用户在执行过程中发送了新消息，脚本会被终止，智能体会看到 `[execution interrupted — user sent a new message]`
- **工具调用限制**：当达到 50 次调用限制时，后续工具调用会返回错误消息

响应始终包含 `status`（success/error/timeout/interrupted）、`output`、`tool_calls_made` 和 `duration_seconds`。

## 安全

:::danger 安全模型
子进程在**最小化环境**中运行。API 密钥、token 和凭证默认被清除。脚本仅通过 RPC 通道访问工具——除非明确允许，否则无法从环境变量中读取密钥。
:::

名称中包含 `KEY`、`TOKEN`、`SECRET`、`PASSWORD`、`CREDENTIAL`、`PASSWD` 或 `AUTH` 的环境变量会被排除。仅传递安全的系统变量（`PATH`、`HOME`、`LANG`、`SHELL`、`PYTHONPATH`、`VIRTUAL_ENV` 等）。

### 技能环境变量透传

当技能在其 frontmatter 中声明了 `required_environment_variables` 时，这些变量在技能加载后会被**自动透传**到 `execute_code` 和 `terminal` 子进程。这使得技能可以使用其声明的 API 密钥，而不会削弱任意代码的安全态势。

对于非技能用例，你可以在 `config.yaml` 中明确设置允许列表：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_KEY
    - ANOTHER_TOKEN
```

详情请参阅[安全指南](/user-guide/security#environment-variable-passthrough)。

### 子进程中的 `HERMES_*` 变量

子进程仅接收一组少量、固定的操作性 `HERMES_*` 变量（按精确名称）：

- `HERMES_HOME`
- `HERMES_PROFILE`
- `HERMES_CONFIG`
- `HERMES_ENV`

（加上 `HERMES_RPC_DIR` / `HERMES_RPC_SOCKET` / `TZ` / `HOME`，由 Hermes 显式注入以使 RPC 通道正常工作）。

:::note 行为变更
早期版本将**任何**以 `HERMES_` 开头的变量透传到子进程。该宽泛的前缀已被移除以加固安全：它可能将不匹配密钥子串的 `HERMES_*` 命名配置（例如 `HERMES_BASE_URL`、`HERMES_KANBAN_DB` 或 `HERMES_*_WEBHOOK` 端点）泄露到任意沙箱代码中。

如果 `execute_code` 脚本——或其导入时加载的仓库/插件模块——依赖上述四个操作性名称之外的 `HERMES_*` 变量，现在该变量在子进程中会是**未设置**状态。此降级是有意为之，并非 bug。
:::

**解决方法——显式重新允许该变量。** 两种途径都会将变量透传到 `execute_code` *和* `terminal` 子进程，且都不会削弱密钥清除保证（Hermes 管理的提供商凭证无法通过此方式重新允许）：

1. **每台机器上，在 `config.yaml` 中**——将精确的变量名称添加到透传允许列表：

   ```yaml
   terminal:
     env_passthrough:
       - HERMES_KANBAN_DB
       - HERMES_BASE_URL
   ```

2. **每个技能中，在技能的 frontmatter 中**——声明它，以便在加载该技能时自动注册：

   ```yaml
   required_environment_variables:
     - HERMES_KANBAN_DB
   ```

**诊断方法。** 当子进程丢弃一个或多个非允许列表中的 `HERMES_*` 变量时，Hermes 会输出一行 `debug` 日志，命名这些变量并指向 `env_passthrough` 逃生通道。使用调试日志运行（`hermes logs --level DEBUG`，或查看 `~/.hermes/logs/agent.log`）并查找 `execute_code: dropped N non-allowlisted HERMES_* var(s)`，如果脚本表现得好像某个 `HERMES_*` 变量缺失。

Hermes 始终将脚本和自动生成的 `hermes_tools.py` RPC 存根写入执行后清理的临时暂存目录。在 `strict` 模式下脚本也在该目录中*运行*；在 `project` 模式下脚本在会话的工作目录中运行（暂存目录保留在 `PYTHONPATH` 上以便导入仍然解析）。子进程在其自身的进程组中运行，以便在超时或中断时被干净地终止。

## execute_code 与 terminal 对比

| 使用场景 | execute_code | terminal |
|----------|-------------|----------|
| 步骤间含工具调用的多步工作流 | ✅ | ❌ |
| 简单 shell 命令 | ❌ | ✅ |
| 过滤/处理大量工具输出 | ✅ | ❌ |
| 运行构建或测试套件 | ❌ | ✅ |
| 循环遍历搜索结果 | ✅ | ❌ |
| 交互式/后台进程 | ❌ | ✅ |
| 需要环境中的 API 密钥 | ⚠️ 仅通过[透传](/user-guide/security#environment-variable-passthrough) | ✅（大多数会透传） |

**经验法则：** 当你需要以编程方式调用 Hermes 工具并在调用之间加入逻辑时，使用 `execute_code`。当你需要运行 shell 命令、构建和进程时，使用 `terminal`。

## 平台支持

代码执行需要 Unix 域套接字，仅在 **Linux 和 macOS 上可用**。在 Windows 上会自动禁用——智能体回退到常规的顺序工具调用。