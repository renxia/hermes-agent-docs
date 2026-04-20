---
sidebar_position: 8
title: "代码执行"
description: "通过 RPC 工具访问进行编程式 Python 执行 — 将多步骤工作流压缩为一次 LLM 调用"
---

# 代码执行（编程式工具调用）

`execute_code` 工具允许智能体编写调用 Hermes 工具的 Python 脚本，将多步骤工作流压缩为一次 LLM 调用。该脚本在智能体主机上的子进程中运行，并通过 Unix 域套接字与 Hermes 进行 RPC 通信。

## 工作原理

1. 智能体使用 `from hermes_tools import ...` 编写 Python 脚本
2. Hermes 生成一个包含 RPC 函数的 `hermes_tools.py` 存根模块
3. Hermes 打开一个 Unix 域套接字并启动 RPC 监听线程
4. 脚本在子进程中运行 — 工具调用通过套接字传回 Hermes
5. 仅脚本的 `print()` 输出会返回给 LLM；中间工具结果不会进入上下文窗口

```python
# 智能体可以编写如下脚本：
from hermes_tools import web_search, web_extract

results = web_search("Python 3.13 features", limit=5)
for r in results["data"]["web"]:
    content = web_extract([r["url"]])
    # ... 过滤和处理 ...
print(summary)
```

**脚本中可用的工具：** `web_search`, `web_extract`, `read_file`, `write_file`, `search_files`, `patch`, `terminal`（仅前台模式）。

## 智能体何时使用此功能

当出现以下情况时，智能体会使用 `execute_code`：

- **3次以上**工具调用，且调用之间有处理逻辑
- 批量数据过滤或条件分支
- 对搜索结果进行循环处理

关键优势：中间工具结果不会进入上下文窗口 — 只有最终的 `print()` 输出会返回，显著减少 token 使用量。

## 实用示例

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

### 多步骤网络研究

```python
from hermes_tools import web_search, web_extract
import json

# 一次调用完成搜索、提取和总结
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

# 查找所有使用已弃用 API 的 Python 文件并进行修复
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

print(f"修复了 {fixed} 个文件，共找到 {len(matches.get('matches', []))} 个匹配项")
```

### 构建和测试管道

```python
from hermes_tools import terminal, read_file
import json

# 运行测试，解析结果并报告
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
| **`project`**（默认） | 会话的工作目录（与 `terminal()` 相同） | 活动的 `VIRTUAL_ENV` / `CONDA_PREFIX` python，失败时回退到 Hermes 自身的 python |
| `strict` | 与用户项目隔离的临时暂存目录 | `sys.executable`（Hermes 自身的 python） |

**何时保持 `project` 模式：** 当你希望 `import pandas`、`from my_project import foo` 或相对路径如 `open(".env")` 与 `terminal()` 中工作方式一致时。这通常是您想要的效果。

**何时切换到 `strict` 模式：** 当你需要最大程度的复现性 — 无论用户激活了哪个 venv，你希望每次会话使用相同的解释器，并且希望脚本与项目树隔离（避免通过相对路径意外读取项目文件的风险）。

```yaml
# ~/.hermes/config.yaml
code_execution:
  mode: project   # 或 "strict"
```

`project` 模式下的回退行为：如果 `VIRTUAL_ENV` / `CONDA_PREFIX` 未设置、损坏或指向低于 3.8 版本的 Python，解析器会干净地回退到 `sys.executable` — 它永远不会在没有有效解释器的情况下离开智能体。

两种模式下安全关键不变量完全相同：

- 环境清理（API 密钥、令牌、凭据被剥离）
- 工具白名单（脚本不能递归调用 `execute_code`、`delegate_task` 或 MCP 工具）
- 资源限制（超时、stdout 上限、工具调用上限）

切换模式只会改变脚本的运行位置和运行它们的解释器，而不会改变它们能看到的凭据或能调用的工具。

## 资源限制

| 资源 | 限制 | 说明 |
|------|------|-------|
| **超时** | 5 分钟（300 秒） | 脚本先用 SIGTERM 终止，5 秒宽限期后使用 SIGKILL |
| **Stdout** | 50 KB | 输出被截断，并显示 `[output truncated at 50KB]` 提示 |
| **Stderr** | 10 KB | 非零退出时包含在输出中以便调试 |
| **工具调用** | 每次执行 50 次 | 达到限制时返回错误 |

所有限制均可通过 `config.yaml` 配置：

```yaml
# 在 ~/.hermes/config.yaml 中
code_execution:
  mode: project      # project (默认) | strict
  timeout: 300       # 每次脚本的最大秒数（默认：300）
  max_tool_calls: 50 # 每次执行的最大工具调用次数（默认：50）
```

## 脚本内部工具调用的工作原理

当您的脚本调用类似 `web_search("query")` 的函数时：

1. 调用被序列化为 JSON 并通过 Unix 域套接字发送到父进程
2. 父进程通过标准的 `handle_function_call` 处理器进行分派
3. 结果通过套接字发回
4. 函数返回解析后的结果

这意味着脚本内部的工具调用与正常工具调用行为完全一致 — 相同的速率限制、相同的错误处理和相同的功能。唯一限制是 `terminal()` 仅支持前台模式（不支持 `background` 或 `pty` 参数）。

## 错误处理

当脚本失败时，智能体会收到结构化的错误信息：

- **非零退出代码**：stderr 包含在输出中，因此智能体能看到完整的堆栈跟踪
- **超时**：脚本被终止，智能体看到 `"Script timed out after 300s and was killed."`
- **中断**：如果用户在执行期间发送新消息，脚本将被终止，智能体看到 `[execution interrupted — user sent a new message]`
- **工具调用限制**：达到 50 次调用限制后，后续工具调用将返回错误消息

响应始终包含 `status`（成功/错误/超时/中断）、`output`、`tool_calls_made` 和 `duration_seconds`。

## 安全性

:::danger 安全模型
子进程以**最小化环境**运行。默认情况下会剥离 API 密钥、令牌和凭据。脚本只能通过 RPC 通道访问工具 — 除非明确允许，否则无法从环境变量中读取机密信息。
:::

名称中包含 `KEY`、`TOKEN`、`SECRET`、`PASSWORD`、`CREDENTIAL`、`PASSWD` 或 `AUTH` 的环境变量会被排除。只有安全的系统变量（`PATH`、`HOME`、`LANG`、`SHELL`、`PYTHONPATH`、`VIRTUAL_ENV` 等）会被传递。

### 技能环境变量透传

当技能在前言中声明 `required_environment_variables` 时，这些变量会在技能加载后**自动透传**给 `execute_code` 和 `terminal` 子进程。这使得技能可以使用其声明的 API 密钥，而不会削弱任意代码的安全态势。

对于非技能用例，您可以在 `config.yaml` 中显式允许列表变量：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_KEY
    - ANOTHER_TOKEN
```

有关完整详情，请参阅 [安全指南](/docs/user-guide/security#environment-variable-passthrough)。

Hermes 总是将脚本和自动生成的 `hermes_tools.py` RPC 存根写入临时暂存目录，并在执行后清理。在 `strict` 模式下脚本也在那里运行；在 `project` 模式下它在会话的工作目录中运行（暂存目录保持在 `PYTHONPATH` 上，因此导入仍然可以解析）。子进程在其自己的进程组中运行，因此可以在超时或中断时被干净地终止。

## execute_code vs terminal

| 使用场景 | execute_code | terminal |
|----------|-------------|----------|
| 需要在工具调用之间进行多步骤工作流 | ✅ | ❌ |
| 简单 shell 命令 | ❌ | ✅ |
| 过滤/处理大型工具输出 | ✅ | ❌ |
| 运行构建或测试套件 | ❌ | ✅ |
| 对搜索结果进行循环处理 | ✅ | ❌ |
| 交互式/后台进程 | ❌ | ✅ |
| 需要在环境中使用 API 密钥 | ⚠️ 仅通过[透传](/docs/user-guide/security#environment-variable-passthrough) | ✅（大多数会自动透传） |

**经验法则：** 当您需要以编程方式调用 Hermes 工具并在调用之间添加逻辑时使用 `execute_code`。当您需要运行 shell 命令、构建和进程时使用 `terminal`。

## 平台支持

代码执行需要 Unix 域套接字，仅在 **Linux 和 macOS** 上可用。在 Windows 上会自动禁用 — 智能体会回退到常规顺序工具调用。