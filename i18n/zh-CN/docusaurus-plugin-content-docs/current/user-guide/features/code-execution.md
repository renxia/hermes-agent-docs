---
sidebar_position: 8
title: "代码执行"
description: "带沙箱的 Python 执行和 RPC 工具访问 — 将多步骤工作流合并为单次调用"
---

# 代码执行（程序化工具调用）

`execute_code` 工具允许智能体编写调用 Hermes 工具的 Python 脚本，从而将多步骤工作流合并为单次 LLM 调用。脚本在智能体主机的沙箱子进程中运行，通过 Unix 域套接字 RPC 进行通信。

## 工作原理

1. 智能体使用 `from hermes_tools import ...` 编写 Python 脚本。
2. Hermes 生成一个带有 RPC 函数的 `hermes_tools.py` 存根模块。
3. Hermes 打开一个 Unix 域套接字并启动一个 RPC 监听线程。
4. 脚本在子进程中运行 — 工具调用通过套接字返回给 Hermes。
5. 只有脚本的 `print()` 输出返回给 LLM；中间的工具结果绝不会进入上下文窗口。

```python
# 智能体可以编写类似以下脚本：
from hermes_tools import web_search, web_extract

results = web_search("Python 3.13 features", limit=5)
for r in results["data"]["web"]:
    content = web_extract([r["url"]])
    # ... 过滤和处理 ...
print(summary)
```

**沙箱中可用的工具:** `web_search`, `web_extract`, `read_file`, `write_file`, `search_files`, `patch`, `terminal`（仅前台）。

## 智能体何时使用此功能

当出现以下情况时，智能体会使用 `execute_code`：

- **3 个或更多工具调用**，并且调用之间包含处理逻辑。
- 大规模数据过滤或条件分支。
- 对结果进行循环处理。

关键优势：中间工具结果绝不会进入上下文窗口 — 只有最终的 `print()` 输出返回，极大地减少了 token 使用量。

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

# 在一次调用中搜索、提取和总结
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

### 大规模文件重构

```python
from hermes_tools import search_files, read_file, patch

# 查找所有使用弃用 API 的 Python 文件并修复它们
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

print(f"修复了 {fixed} 个文件，共 {len(matches.get('matches', []))} 个匹配项")
```

### 构建和测试管道

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

## 资源限制

| 资源 | 限制 | 说明 |
|----------|-------|-------|
| **超时时间** | 5 分钟 (300秒) | 脚本将收到 SIGTERM 信号，随后在 5 秒内收到 SIGKILL 信号 |
| **Stdout** | 50 KB | 输出会在达到 50KB 时被截断，并显示 `[output truncated at 50KB]` 通知 |
| **Stderr** | 10 KB | 在非零退出代码时包含在输出中，用于调试 |
| **工具调用** | 每次执行 50 次 | 达到限制时返回错误 |

所有限制都可通过 `config.yaml` 进行配置：

```yaml
# 在 ~/.hermes/config.yaml 中
code_execution:
  timeout: 300       # 每个脚本的最大秒数 (默认: 300)
  max_tool_calls: 50 # 每个执行的最大工具调用次数 (默认: 50)
```

## 脚本内部工具调用工作原理

当您的脚本调用像 `web_search("query")` 这样的函数时：

1. 该调用被序列化为 JSON，并通过 Unix 域套接字发送给父进程。
2. 父进程通过标准的 `handle_function_call` 处理程序进行分派。
3. 结果通过套接字传回。
4. 函数返回解析后的结果。

这意味着脚本内部的工具调用与正常的工具调用行为完全相同 — 相同的速率限制、相同的错误处理、相同的能力。唯一的限制是 `terminal()` 仅支持前台模式（不支持 `background` 或 `pty` 参数）。

## 错误处理

当脚本失败时，智能体会收到结构化的错误信息：

- **非零退出代码**: `stderr` 会包含在输出中，因此智能体可以看到完整的堆栈跟踪。
- **超时**: 脚本被终止，智能体看到 `"Script timed out after 300s and was killed."`。
- **中断**: 如果用户在执行过程中发送了新消息，脚本将被终止，智能体看到 `[execution interrupted — user sent a new message]`。
- **工具调用限制**: 当达到 50 次调用限制时，后续的工具调用将返回错误消息。

响应始终包含 `status`（成功/错误/超时/中断）、`output`、`tool_calls_made` 和 `duration_seconds`。

## 安全性

:::danger 安全模型
子进程在一个**最小化的环境**中运行。API 密钥、令牌和凭证默认会被剥离。脚本只能通过 RPC 通道访问工具 — 除非明确允许，否则它无法从环境变量中读取密钥。
:::

名称包含 `KEY`、`TOKEN`、`SECRET`、`PASSWORD`、`CREDENTIAL`、`PASSWD` 或 `AUTH` 的环境变量将被排除。只传递安全的系统变量（如 `PATH`、`HOME`、`LANG`、`SHELL`、`PYTHONPATH`、`VIRTUAL_ENV` 等）。

### 技能环境传递

当一个技能在其前置元数据中声明了 `required_environment_variables` 时，这些变量在技能加载后会**自动传递**给 `execute_code` 和 `terminal` 沙箱。这允许技能在不削弱任意代码安全态势的情况下使用其声明的 API 密钥。

对于非技能用例，您可以在 `config.yaml` 中显式白名单变量：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_KEY
    - ANOTHER_TOKEN
```

有关完整详情，请参阅 [安全指南](/docs/user-guide/security#environment-variable-passthrough)。

脚本在一个临时目录中运行，并在执行后清理该目录。子进程在其自己的进程组中运行，因此可以在超时或中断时被干净地终止。

## execute_code 与 terminal 的区别

| 用例 | execute_code | terminal |
|----------|-------------|----------|
| 包含工具调用的多步骤工作流 | ✅ | ❌ |
| 简单的 Shell 命令 | ❌ | ✅ |
| 过滤/处理大型工具输出 | ✅ | ❌ |
| 运行构建或测试套件 | ❌ | ✅ |
| 对搜索结果进行循环 | ✅ | ❌ |
| 交互式/后台进程 | ❌ | ✅ |
| 需要环境变量中的 API 密钥 | ⚠️ 仅通过 [传递机制](/docs/user-guide/security#environment-variable-passthrough) | ✅ (大多数都会传递) |

**经验法则：** 当您需要通过逻辑调用 Hermes 工具时，请使用 `execute_code`。当您需要运行 Shell 命令、构建或进程时，请使用 `terminal`。

## 平台支持

代码执行需要 Unix 域套接字，仅在 **Linux 和 macOS** 上可用。在 Windows 上会自动禁用 — 智能体将回退到常规的顺序工具调用。