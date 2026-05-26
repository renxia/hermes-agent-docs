---
sidebar_position: 8
title: "代码执行"
description: "通过 RPC 工具访问进行程序化 Python 执行 — 将多步工作流程折叠为单次交互"
---

# 代码执行（程序化工具调用）

`execute_code` 工具允许智能体编写 Python 脚本，以程序化方式调用 Hermes 工具，将多步工作流程折叠为单次 LLM 交互。脚本在智能体主机的子进程中运行，通过 Unix 域套接字 RPC 与 Hermes 通信。

## 工作原理

1. 智能体使用 `from hermes_tools import ...` 编写 Python 脚本
2. Hermes 生成带有 RPC 函数的 `hermes_tools.py` 桩模块
3. Hermes 打开一个 Unix 域套接字并启动 RPC 监听线程
4. 脚本在子进程中运行 — 工具调用通过套接字传输回 Hermes
5. 仅脚本的 `print()` 输出返回给 LLM；中间工具结果不会进入上下文窗口

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

- 存在**3个以上工具调用**，且调用间需要处理逻辑
- 进行批量数据过滤或条件分支
- 遍历结果的循环

主要优势：中间工具调用结果不会进入上下文窗口——只有最终的 `print()` 输出会返回，从而大幅减少token消耗。

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

# 在一轮对话中搜索、提取并总结
results = web_search("Rust 异步运行时对比 2025", limit=5)
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

# 查找所有使用已弃用API的Python文件并修复它们
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

print(f"修复了 {fixed} 个文件，匹配项共 {len(matches.get('matches', []))} 个")
```

### 构建与测试管道

```python
from hermes_tools import terminal, read_file
import json

# 运行测试、解析结果并报告
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

`execute_code` 有两种执行模式，通过 `~/.hermes/config.yaml` 中的 `code_execution.mode` 控制：

| 模式 | 工作目录 | Python 解释器 |
|------|----------|---------------|
| **`project`**（默认） | 会话的工作目录（与 `terminal()` 相同） | 活动的 `VIRTUAL_ENV` / `CONDA_PREFIX` Python，回退到 Hermes 自身的 Python |
| `strict` | 与用户项目隔离的临时暂存目录 | `sys.executable`（Hermes 自身的 Python） |

**何时保留 `project` 模式：** 当你需要 `import pandas`、`from my_project import foo` 或相对路径如 `open(".env")` 的行为与在 `terminal()` 中完全相同时。这几乎总是你需要的。

**何时切换到 `strict` 模式：** 当你需要最大可复现性时——无论用户激活了哪个虚拟环境，你都希望每次会话使用相同的解释器，并希望脚本与项目目录隔离（没有通过相对路径意外读取项目文件的风险）。

```yaml
# ~/.hermes/config.yaml
code_execution:
  mode: project   # 或 "strict"
```

`project` 模式的回退行为：如果 `VIRTUAL_ENV` / `CONDA_PREFIX` 未设置、已损坏或指向低于 3.8 版本的 Python，解析器会干净地回退到 `sys.executable`——它永远不会让智能体没有可用的解释器。

两种模式下的安全关键不变量相同：

- 环境清理（剥离 API 密钥、令牌、凭证）
- 工具白名单（脚本不能递归调用 `execute_code`、`delegate_task` 或 MCP 工具）
- 资源限制（超时、标准输出上限、工具调用上限）

切换模式改变的是脚本运行的位置和由哪个解释器运行它们，而不是它们能看到哪些凭证或可以调用哪些工具。

## 资源限制

| 资源 | 限制 | 备注 |
|------|------|------|
| **超时** | 5 分钟 (300s) | 脚本被 SIGTERM 终止，5 秒宽限期后被 SIGKILL 终止 |
| **标准输出** | 50 KB | 输出截断并附带 `[输出在 50KB 处截断]` 通知 |
| **标准错误** | 10 KB | 非零退出码时包含在输出中用于调试 |
| **工具调用** | 每次执行 50 次 | 达到限制时返回错误 |

所有限制均可通过 `config.yaml` 配置：

```yaml
# 位于 ~/.hermes/config.yaml
code_execution:
  mode: project      # project (默认) | strict
  timeout: 300       # 每个脚本最大秒数 (默认: 300)
  max_tool_calls: 50 # 每次执行最大工具调用次数 (默认: 50)
```

## 脚本内部的工具调用工作方式

当你的脚本调用 `web_search("query")` 这样的函数时：

1. 调用被序列化为 JSON 并通过 Unix 域套接字发送到父进程
2. 父进程通过标准的 `handle_function_call` 处理程序进行分发
3. 结果通过套接字发送回来
4. 函数返回解析后的结果

这意味着脚本内部的工具调用行为与正常的工具调用完全相同——相同的速率限制、相同的错误处理、相同的能力。唯一的限制是 `terminal()` 仅支持前台运行（没有 `background` 或 `pty` 参数）。

## 错误处理

当脚本失败时，智能体会收到结构化的错误信息：

- **非零退出码**：标准错误被包含在输出中，以便智能体看到完整的回溯信息
- **超时**：脚本被终止，智能体看到 `"脚本在 300 秒后超时并被终止。"`
- **中断**：如果用户在执行期间发送了新消息，脚本将被终止，智能体看到 `[执行已中断——用户发送了新消息]`
- **工具调用限制**：当达到 50 次调用限制时，后续工具调用将返回错误消息

响应始终包含 `status`（success/error/timeout/interrupted）、`output`、`tool_calls_made` 和 `duration_seconds`。

## 安全性

:::danger 安全模型
子进程运行在**最小化环境**中。默认情况下，API 密钥、令牌和凭证会被剥离。脚本通过 RPC 通道专门访问工具——除非明确允许，否则无法从环境变量读取密钥。
:::

名称中包含 `KEY`、`TOKEN`、`SECRET`、`PASSWORD`、`CREDENTIAL`、`PASSWD` 或 `AUTH` 的环境变量会被排除。只有安全的系统变量（`PATH`、`HOME`、`LANG`、`SHELL`、`PYTHONPATH`、`VIRTUAL_ENV` 等）会被传递。

### 技能环境变量透传

当技能在其前置元数据中声明 `required_environment_variables` 时，在技能加载后，这些变量会**自动透传**到 `execute_code` 和 `terminal` 子进程。这使得技能可以使用其声明的 API 密钥，而不会削弱任意代码的安全态势。

对于非技能用例，你可以在 `config.yaml` 中显式允许列出变量：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_KEY
    - ANOTHER_TOKEN
```

完整详情请参见[安全指南](/用户指南/安全#环境变量透传)。

Hermes 总是将脚本和自动生成的 `hermes_tools.py` RPC 存根写入临时暂存目录，该目录在执行后会被清理。在 `strict` 模式下，脚本也*运行*在那里；在 `project` 模式下，它运行在会话的工作目录中（暂存目录保留在 `PYTHONPATH` 上，因此导入仍然有效）。子进程在自己的进程组中运行，以便在超时或中断时可以干净地终止。

## execute_code 与 terminal 对比

| 用例 | execute_code | terminal |
|------|-------------|----------|
| 调用间需要逻辑的多步骤工作流 | ✅ | ❌ |
| 简单的 shell 命令 | ❌ | ✅ |
| 过滤/处理大量工具输出 | ✅ | ❌ |
| 运行构建或测试套件 | ❌ | ✅ |
| 遍历搜索结果 | ✅ | ❌ |
| 交互式/后台进程 | ❌ | ✅ |
| 需要环境中的 API 密钥 | ⚠️ 仅通过[透传](/用户指南/安全#环境变量透传) | ✅（大多数会透传） |

**经验法则：** 当你需要以编程方式调用 Hermes 工具且调用间需要逻辑时，使用 `execute_code`。对于运行 shell 命令、构建和进程，使用 `terminal`。

## 平台支持

代码执行需要 Unix 域套接字，**仅在 Linux 和 macOS 上可用**。在 Windows 上会自动禁用——智能体会回退到常规的顺序工具调用。