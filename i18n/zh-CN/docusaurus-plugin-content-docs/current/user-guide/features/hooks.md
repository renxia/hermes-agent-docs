---
sidebar_position: 6
title: "事件钩子"
description: "在关键生命周期点运行自定义代码 — 记录活动、发送警报、发布到 Webhook"
---

# 事件钩子

Hermes 拥有三个钩子系统，可在关键生命周期点运行自定义代码：

| 系统 | 注册方式 | 运行环境 | 使用场景 |
|--------|---------------|---------|----------|
| **[网关钩子](#gateway-event-hooks)** | `~/.hermes/hooks/` 目录下的 `HOOK.yaml` + `handler.py` | 仅网关 | 日志记录、警报、Webhook |
| **[插件钩子](#plugin-hooks)** | 在[插件](/docs/user-guide/features/plugins)中通过 `ctx.register_hook()` 注册 | CLI + 网关 | 工具拦截、指标收集、防护措施 |
| **[Shell 钩子](#shell-hooks)** | `~/.hermes/config.yaml` 中的 `hooks:` 块，指向 Shell 脚本 | CLI + 网关 | 用于阻塞、自动格式化、上下文注入的即插即用脚本 |

所有三个系统均为非阻塞式 — 任何钩子中的错误都会被捕捉并记录，绝不会导致智能体崩溃。

## 网关事件钩子

网关钩子在网关运行期间（Telegram、Discord、Slack、WhatsApp）自动触发，不会阻塞主智能体流水线。

### 创建钩子

每个钩子都是 `~/.hermes/hooks/` 下的一个目录，包含两个文件：

```text
~/.hermes/hooks/
└── my-hook/
    ├── HOOK.yaml      # 声明要监听哪些事件
    └── handler.py     # Python 处理函数
```

#### HOOK.yaml

```yaml
name: my-hook
description: 将所有智能体活动记录到文件
events:
  - agent:start
  - agent:end
  - agent:step
```

`events` 列表决定了哪些事件会触发你的处理函数。你可以订阅任意组合的事件，包括通配符如 `command:*`。

#### handler.py

```python
import json
from datetime import datetime
from pathlib import Path

LOG_FILE = Path.home() / ".hermes" / "hooks" / "my-hook" / "activity.log"

async def handle(event_type: str, context: dict):
    """为每个订阅的事件调用。必须命名为 'handle'。"""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "event": event_type,
        **context,
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
```

**处理函数规则：**
- 必须命名为 `handle`
- 接收 `event_type`（字符串）和 `context`（字典）
- 可以是 `async def` 或普通 `def` —— 两者都支持
- 错误会被捕获并记录，绝不会导致智能体崩溃

### 可用事件

| 事件 | 触发时机 | 上下文键 |
|------|----------|----------|
| `gateway:startup` | 网关进程启动时 | `platforms`（活跃平台名称列表） |
| `session:start` | 创建新消息会话时 | `platform`, `user_id`, `session_id`, `session_key` |
| `session:end` | 会话结束（重置前） | `platform`, `user_id`, `session_key` |
| `session:reset` | 用户执行 `/new` 或 `/reset` 时 | `platform`, `user_id`, `session_key` |
| `agent:start` | 智能体开始处理消息时 | `platform`, `user_id`, `session_id`, `message` |
| `agent:step` | 工具调用循环的每次迭代 | `platform`, `user_id`, `session_id`, `iteration`, `tool_names` |
| `agent:end` | 智能体完成处理时 | `platform`, `user_id`, `session_id`, `message`, `response` |
| `command:*` | 执行任意斜杠命令时 | `platform`, `user_id`, `command`, `args` |

#### 通配符匹配

注册为 `command:*` 的处理函数会对任意 `command:` 事件（如 `command:model`、`command:reset` 等）触发。通过一次订阅即可监控所有斜杠命令。

### 示例

#### 长时间任务 Telegram 提醒

当智能体执行超过 10 步时给自己发送消息：

```yaml
# ~/.hermes/hooks/long-task-alert/HOOK.yaml
name: long-task-alert
description: 智能体执行步数过多时发出提醒
events:
  - agent:step
```

```python
# ~/.hermes/hooks/long-task-alert/handler.py
import os
import httpx

THRESHOLD = 10
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_HOME_CHANNEL")

async def handle(event_type: str, context: dict):
    iteration = context.get("iteration", 0)
    if iteration == THRESHOLD and BOT_TOKEN and CHAT_ID:
        tools = ", ".join(context.get("tool_names", []))
        text = f"⚠️ 智能体已运行 {iteration} 步。最后使用的工具：{tools}"
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                json={"chat_id": CHAT_ID, "text": text},
            )
```

#### 命令使用记录器

跟踪哪些斜杠命令被使用：

```yaml
# ~/.hermes/hooks/command-logger/HOOK.yaml
name: command-logger
description: 记录斜杠命令使用情况
events:
  - command:*
```

```python
# ~/.hermes/hooks/command-logger/handler.py
import json
from datetime import datetime
from pathlib import Path

LOG = Path.home() / ".hermes" / "logs" / "command_usage.jsonl"

def handle(event_type: str, context: dict):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": datetime.now().isoformat(),
        "command": context.get("command"),
        "args": context.get("args"),
        "platform": context.get("platform"),
        "user": context.get("user_id"),
    }
    with open(LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")
```

#### 会话启动 Webhook

在新会话时向外部服务发送 POST 请求：

```yaml
# ~/.hermes/hooks/session-webhook/HOOK.yaml
name: session-webhook
description: 新会话时通知外部服务
events:
  - session:start
  - session:reset
```

```python
# ~/.hermes/hooks/session-webhook/handler.py
import httpx

WEBHOOK_URL = "https://your-service.example.com/hermes-events"

async def handle(event_type: str, context: dict):
    async with httpx.AsyncClient() as client:
        await client.post(WEBHOOK_URL, json={
            "event": event_type,
            **context,
        }, timeout=5)
```

### 教程：BOOT.md —— 每次网关启动时运行启动检查清单

社区中一种流行模式：在 `~/.hermes/BOOT.md` 放置一个 Markdown 检查清单，让智能体每次网关启动时运行一次。适用于“每次启动时检查 overnight cron 任务是否失败，如有失败则在 Discord 上通知我”，或“总结过去 24 小时的 deploy.log 并发布到 Slack #ops”。

本教程展示如何将其构建为用户自定义钩子。Hermes 不内置 BOOT.md 钩子 —— 你可以完全自定义所需行为。

#### 我们要构建的内容

1. 在 `~/.hermes/BOOT.md` 中放置一个自然语言编写的启动指令文件。
2. 一个在 `gateway:startup` 时触发的网关钩子，它会使用网关解析好的模型/凭据启动一个一次性智能体，并运行 BOOT.md 中的指令。
3. `[SILENT]` 约定，使得智能体在无内容可报告时可选择不发送消息。

#### 步骤 1：编写你的检查清单

创建 `~/.hermes/BOOT.md`。像给人类助手下达指令一样编写：

```markdown
# 启动检查清单

1. 运行 `hermes cron list` 并检查是否有 overnight 定时任务失败。
2. 如果有失败，使用 `send_message` 工具将摘要发送到 Discord #ops。
3. 检查 `/opt/app/deploy.log` 在过去 24 小时内是否有 ERROR 行。如果有，将其摘要包含在同一 Discord 消息中。
4. 如果一切正常，仅回复 `[SILENT]`，这样就不会发送消息。
```

智能体会将此作为提示的一部分，因此任何你能用自然语言描述的内容都可行 —— 工具调用、Shell 命令、发送消息、总结文件等。

#### 步骤 2：创建钩子

```text
~/.hermes/hooks/boot-md/
├── HOOK.yaml
└── handler.py
```

**`~/.hermes/hooks/boot-md/HOOK.yaml`**

```yaml
name: boot-md
description: 在网关启动时运行 ~/.hermes/BOOT.md
events:
  - gateway:startup
```

**`~/.hermes/hooks/boot-md/handler.py`**

```python
"""在每次网关启动时运行 ~/.hermes/BOOT.md。"""

import logging
import threading
from pathlib import Path

logger = logging.getLogger("hooks.boot-md")

BOOT_FILE = Path.home() / ".hermes" / "BOOT.md"


def _build_prompt(content: str) -> str:
    return (
        "你正在运行一个启动检查清单。请严格按照以下指令执行。\n\n"
        "---\n"
        f"{content}\n"
        "---\n\n"
        "执行每一条指令。使用 send_message 工具向 Discord 或 Slack 等平台发送消息。\n"
        "如果无需关注且无内容可报告，请仅回复：[SILENT]"
    )


def _run_boot_agent(content: str) -> None:
    """启动一个一次性智能体并执行检查清单。

    使用网关解析好的模型和运行时凭据，因此它适用于自定义端点、聚合器以及基于 OAuth 的提供商。
    """
    try:
        from gateway.run import _resolve_gateway_model, _resolve_runtime_agent_kwargs
        from run_agent import AIAgent

        agent = AIAgent(
            model=_resolve_gateway_model(),
            **_resolve_runtime_agent_kwargs(),
            platform="gateway",
            quiet_mode=True,
            skip_context_files=True,
            skip_memory=True,
            max_iterations=20,
        )
        result = agent.run_conversation(_build_prompt(content))
        response = result.get("final_response", "")
        if response and "[SILENT]" not in response:
            logger.info("boot-md 完成：%s", response[:200])
        else:
            logger.info("boot-md 完成（无内容可报告）")
    except Exception as e:
        logger.error("boot-md 智能体失败：%s", e)


async def handle(event_type: str, context: dict) -> None:
    if not BOOT_FILE.exists():
        return
    content = BOOT_FILE.read_text(encoding="utf-8").strip()
    if not content:
        return

    logger.info("正在运行 BOOT.md（%d 字符）", len(content))

    # 后台线程，避免网关启动被完整的智能体回合阻塞。
    thread = threading.Thread(
        target=_run_boot_agent,
        args=(content,),
        name="boot-md",
        daemon=True,
    )
    thread.start()
```

关键两行：

- `_resolve_gateway_model()` 读取网关当前配置的模型。
- `_resolve_runtime_agent_kwargs()` 以与普通网关回合相同的方式解析提供商凭据 —— 包括 API 密钥、基础 URL、OAuth 令牌和凭据池。

如果没有这两行，裸 `AIAgent()` 会回退到内置默认值，并对任何非默认端点返回 401 错误。

#### 步骤 3：测试

重启网关：

```bash
hermes gateway restart
```

查看日志：

```bash
hermes logs --follow --level INFO | grep boot-md
```

你应该看到 `Running BOOT.md (N chars)`，随后是 `boot-md completed: ...`（智能体所做操作的摘要）或 `boot-md completed (nothing to report)`（当智能体回复 `[SILENT]` 时）。

删除 `~/.hermes/BOOT.md` 可禁用检查清单 —— 钩子仍会加载，但文件不存在时会静默跳过。

#### 扩展该模式

- **基于调度的检查清单：** 在 BOOT.md 指令中使用 `datetime.now().weekday()`（“如果是周一，还需检查每周部署日志”）。指令是自由格式文本，因此只要智能体能推理的内容都适用。
- **多个检查清单：** 将钩子指向不同文件（`STARTUP.md`、`MORNING.md` 等），并为每个文件注册单独的钩子目录。
- **非智能体变体：** 如果你不需要完整的智能体循环，完全可以跳过 `AIAgent`，直接通过 `httpx` 让处理函数发送固定通知。成本更低、速度更快，且无提供商依赖。

#### 为何这不是内置功能

Hermes 的早期版本将此作为内置钩子，并在每次网关启动时静默使用裸默认值启动智能体。这让使用自定义端点的用户感到意外，且对不知道该功能正在运行的用户不可见。将其保留为文档化模式 —— 由你在钩子目录中自行构建 —— 意味着你能清楚看到其行为，并通过编写文件来选择启用。

### 工作原理

1. 网关启动时，`HookRegistry.discover_and_load()` 扫描 `~/.hermes/hooks/`
2. 每个包含 `HOOK.yaml` + `handler.py` 的子目录会被动态加载
3. 处理函数会为其声明的事件注册
4. 在每个生命周期点，`hooks.emit()` 会触发所有匹配的处理函数
5. 任何处理函数中的错误都会被捕获并记录 —— 损坏的钩子绝不会导致智能体崩溃

:::info
网关钩子仅在 **网关**（Telegram、Discord、Slack、WhatsApp）中触发。CLI 不会加载网关钩子。若需在所有地方生效的钩子，请使用 [插件钩子](#plugin-hooks)。
:::

## 插件钩子

[插件](/docs/user-guide/features/plugins) 可以注册在 **CLI 和网关** 会话中均会触发的钩子。这些钩子通过插件的 `register()` 函数中的 `ctx.register_hook()` 以编程方式注册。

```python
def register(ctx):
    ctx.register_hook("pre_tool_call", my_tool_observer)
    ctx.register_hook("post_tool_call", my_tool_logger)
    ctx.register_hook("pre_llm_call", my_memory_callback)
    ctx.register_hook("post_llm_call", my_sync_callback)
    ctx.register_hook("on_session_start", my_init_callback)
    ctx.register_hook("on_session_end", my_cleanup_callback)
```

**所有钩子的一般规则：**

- 回调函数接收 **关键字参数**。始终接受 `**kwargs` 以保证向前兼容性 —— 未来版本可能会添加新参数，而不会破坏您的插件。
- 如果回调函数**崩溃**，会被记录并跳过。其他钩子和智能体继续正常运行。行为异常的插件绝不能破坏智能体。
- 有两个钩子的返回值会影响行为：[`pre_tool_call`](#pre_tool_call) 可以**阻止**工具调用，而 [`pre_llm_call`](#pre_llm_call) 可以向 LLM 调用中**注入上下文**。所有其他钩子均为“触发即忘”的观察者。

### 快速参考

| 钩子 | 触发时机 | 返回值 |
|------|-----------|---------|
| [`pre_tool_call`](#pre_tool_call) | 在任何工具执行之前 | `{"action": "block", "message": str}` 以否决该调用 |
| [`post_tool_call`](#post_tool_call) | 在任何工具返回之后 | 忽略 |
| [`pre_llm_call`](#pre_llm_call) | 每轮一次，在工具调用循环之前 | `{"context": str}` 以将上下文预置到用户消息 |
| [`post_llm_call`](#post_llm_call) | 每轮一次，在工具调用循环之后 | 忽略 |
| [`on_session_start`](#on_session_start) | 创建新会话时（仅第一轮） | 忽略 |
| [`on_session_end`](#on_session_end) | 会话结束时 | 忽略 |
| [`on_session_finalize`](#on_session_finalize) | CLI/网关关闭一个活跃会话时（刷新、保存、统计） | 忽略 |
| [`on_session_reset`](#on_session_reset) | 网关切换到一个新的会话密钥时（例如 `/new`、`/reset`） | 忽略 |
| [`subagent_stop`](#subagent_stop) | 一个 `delegate_task` 子任务已退出 | 忽略 |
| [`pre_gateway_dispatch`](#pre_gateway_dispatch) | 网关接收到用户消息后，在认证和分发之前 | `{"action": "skip" \| "rewrite" \| "allow", ...}` 以影响流程 |
| [`pre_approval_request`](#pre_approval_request) | 危险命令需要用户批准，在提示/通知发送之前 | 忽略 |
| [`post_approval_response`](#post_approval_response) | 用户响应了批准提示（或超时） | 忽略 |

---

### `pre_tool_call`

在每次工具执行**之前立即**触发 —— 包括内置工具和插件工具。

**回调函数签名：**

```python
def my_callback(tool_name: str, args: dict, task_id: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `tool_name` | `str` | 即将执行的工具名称（例如 `"terminal"`、`"web_search"`、`"read_file"`） |
| `args` | `dict` | 模型传递给工具的参数 |
| `task_id` | `str` | 会话/任务标识符。如果未设置，则为空字符串。 |

**触发位置：** 在 `model_tools.py` 的 `handle_function_call()` 内部，在工具的处理程序运行之前触发。每次工具调用触发一次 —— 如果模型并行调用 3 个工具，则此钩子触发 3 次。

**返回值 —— 否决调用：**

```python
return {"action": "block", "message": "工具调用被阻止的原因"}
```

智能体将使用 `message` 作为错误信息短路该工具调用并返回给模型。第一个匹配的阻止指令生效（Python 插件优先注册，然后是 shell 钩子）。任何其他返回值均被忽略，因此现有的仅观察回调函数可以继续正常工作而无需更改。

**使用场景：** 日志记录、审计跟踪、工具调用计数器、阻止危险操作、速率限制、按用户策略执行。

**示例 —— 工具调用审计日志：**

```python
import json, logging
from datetime import datetime

logger = logging.getLogger(__name__)

def audit_tool_call(tool_name, args, task_id, **kwargs):
    logger.info("TOOL_CALL session=%s tool=%s args=%s",
                task_id, tool_name, json.dumps(args)[:200])

def register(ctx):
    ctx.register_hook("pre_tool_call", audit_tool_call)
```

**示例 —— 对危险工具发出警告：**

```python
DANGEROUS = {"terminal", "write_file", "patch"}

def warn_dangerous(tool_name, **kwargs):
    if tool_name in DANGEROUS:
        print(f"⚠ 正在执行潜在危险的工具：{tool_name}")

def register(ctx):
    ctx.register_hook("pre_tool_call", warn_dangerous)
```

---

### `post_tool_call`

在每次工具执行返回**之后立即**触发。

**回调函数签名：**

```python
def my_callback(tool_name: str, args: dict, result: str, task_id: str,
                duration_ms: int, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `tool_name` | `str` | 刚刚执行的工具名称 |
| `args` | `dict` | 模型传递给工具的参数 |
| `result` | `str` | 工具的返回值（始终为 JSON 字符串） |
| `task_id` | `str` | 会话/任务标识符。如果未设置，则为空字符串。 |
| `duration_ms` | `int` | 工具分发所花费的时间，以毫秒为单位（通过在 `registry.dispatch()` 周围使用 `time.monotonic()` 测量）。 |

**触发位置：** 在 `model_tools.py` 的 `handle_function_call()` 内部，在工具的处理程序返回之后触发。每次工具调用触发一次。如果工具抛出未处理的异常，则**不会**触发（错误被捕获并作为错误 JSON 字符串返回，而 `post_tool_call` 会以该错误字符串作为 `result` 触发）。

**返回值：** 忽略。

**使用场景：** 记录工具结果、指标收集、跟踪工具成功/失败率、延迟仪表板、按工具预算警报、特定工具完成时发送通知。

**示例 —— 跟踪工具使用指标：**

```python
from collections import Counter, defaultdict
import json

_tool_counts = Counter()
_error_counts = Counter()
_latency_ms = defaultdict(list)

def track_metrics(tool_name, result, duration_ms=0, **kwargs):
    _tool_counts[tool_name] += 1
    _latency_ms[tool_name].append(duration_ms)
    try:
        parsed = json.loads(result)
        if "error" in parsed:
            _error_counts[tool_name] += 1
    except (json.JSONDecodeError, TypeError):
        pass

def register(ctx):
    ctx.register_hook("post_tool_call", track_metrics)
```

---

### `pre_llm_call`

**每轮一次**，在工具调用循环开始之前触发。这是**唯一一个其返回值会被使用**的钩子 —— 它可以将上下文注入到当前轮次的用户消息中。

**回调函数签名：**

```python
def my_callback(session_id: str, user_message: str, conversation_history: list,
                is_first_turn: bool, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 当前会话的唯一标识符 |
| `user_message` | `str` | 用户本轮的原始消息（在任何技能注入之前） |
| `conversation_history` | `list` | 完整消息列表的副本（OpenAI 格式：`[{"role": "user", "content": "..."}]`） |
| `is_first_turn` | `bool` | 如果是新会话的第一轮，则为 `True`；在后续轮次中为 `False` |
| `model` | `str` | 模型标识符（例如 `"anthropic/claude-sonnet-4.6"`） |
| `platform` | `str` | 会话运行的平台：`"cli"`、`"telegram"`、`"discord"` 等。 |

**触发位置：** 在 `run_agent.py` 的 `run_conversation()` 内部，在上下文压缩之后但在主 `while` 循环之前触发。每次调用 `run_conversation()` 触发一次（即每轮用户交互一次），而不是在工具循环内的每次 API 调用时触发。

**返回值：** 如果回调函数返回一个包含 `"context"` 键的字典，或一个普通的非空字符串，则该文本会被追加到当前轮次的用户消息中。返回 `None` 表示不注入。

```python
# 注入上下文
return {"context": "回忆起的记忆：\n- 用户喜欢 Python\n- 正在开发 hermes-agent"}

# 普通字符串（等效）
return "回忆起的记忆：\n- 用户喜欢 Python"

# 不注入
return None
```

**上下文注入位置：** 始终是**用户消息**，而不是系统提示。这可以保留提示缓存 —— 系统提示在轮次之间保持不变，因此缓存的 token 会被重用。系统提示是 Hermes 的领域（模型指导、工具执行、个性、技能）。插件的上下文贡献与用户的输入并列。

所有注入的上下文都是**临时的** —— 仅在 API 调用时添加。会话历史中的原始用户消息永远不会被修改，也不会有任何内容持久化到会话数据库中。

当**多个插件**返回上下文时，它们的输出会按照插件发现顺序（按目录名称字母顺序）用双换行符连接。

**使用场景：** 记忆召回、RAG 上下文注入、防护栏、每轮分析。

**示例 —— 记忆召回：**

```python
import httpx

MEMORY_API = "https://your-memory-api.example.com"

def recall(session_id, user_message, is_first_turn, **kwargs):
    try:
        resp = httpx.post(f"{MEMORY_API}/recall", json={
            "session_id": session_id,
            "query": user_message,
        }, timeout=3)
        memories = resp.json().get("results", [])
        if not memories:
            return None
        text = "回忆起的上下文：\n" + "\n".join(f"- {m['text']}" for m in memories)
        return {"context": text}
    except Exception:
        return None

def register(ctx):
    ctx.register_hook("pre_llm_call", recall)
```

**示例 —— 防护栏：**

```python
POLICY = "在没有明确用户确认的情况下，绝不要执行删除文件的命令。"

def guardrails(**kwargs):
    return {"context": POLICY}

def register(ctx):
    ctx.register_hook("pre_llm_call", guardrails)
```

---

### `post_llm_call`

每**回合触发一次**，在工具调用循环完成且智能体生成最终回复之后触发。仅在**成功**回合触发——如果回合被中断，则不会触发。

**回调函数签名：**

```python
def my_callback(session_id: str, user_message: str, assistant_response: str,
                conversation_history: list, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 当前会话的唯一标识符 |
| `user_message` | `str` | 用户在此回合发送的原始消息 |
| `assistant_response` | `str` | 智能体在此回合的最终文本回复 |
| `conversation_history` | `list` | 回合完成后完整消息列表的副本 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的平台 |

**触发时机：** 在 `run_agent.py` 的 `run_conversation()` 函数中，工具循环退出并生成最终回复之后触发。受 `if final_response and not interrupted` 条件保护——因此当用户中途打断或智能体达到迭代限制但未生成回复时，**不会**触发。

**返回值：** 被忽略。

**使用场景：** 将会话数据同步到外部记忆系统、计算回复质量指标、记录回合摘要、触发后续操作。

**示例 —— 同步到外部记忆：**

```python
import httpx

MEMORY_API = "https://your-memory-api.example.com"

def sync_memory(session_id, user_message, assistant_response, **kwargs):
    try:
        httpx.post(f"{MEMORY_API}/store", json={
            "session_id": session_id,
            "user": user_message,
            "assistant": assistant_response,
        }, timeout=5)
    except Exception:
        pass  # 尽力而为

def register(ctx):
    ctx.register_hook("post_llm_call", sync_memory)
```

**示例 —— 跟踪回复长度：**

```python
import logging
logger = logging.getLogger(__name__)

def log_response_length(session_id, assistant_response, model, **kwargs):
    logger.info("RESPONSE session=%s model=%s chars=%d",
                session_id, model, len(assistant_response or ""))

def register(ctx):
    ctx.register_hook("post_llm_call", log_response_length)
```

---

### `on_session_start`

在创建全新会话时**仅触发一次**。在会话继续时（用户在现有会话中发送第二条消息）**不会**触发。

**回调函数签名：**

```python
def my_callback(session_id: str, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 新会话的唯一标识符 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的平台 |

**触发时机：** 在 `run_agent.py` 的 `run_conversation()` 函数中，新会话的第一个回合期间——具体是在系统提示构建完成后、工具循环开始前。判断条件为 `if not conversation_history`（无先前消息 = 新会话）。

**返回值：** 被忽略。

**使用场景：** 初始化会话作用域状态、预热缓存、向外部服务注册会话、记录会话开始。

**示例 —— 初始化会话缓存：**

```python
_session_caches = {}

def init_session(session_id, model, platform, **kwargs):
    _session_caches[session_id] = {
        "model": model,
        "platform": platform,
        "tool_calls": 0,
        "started": __import__("datetime").datetime.now().isoformat(),
    }

def register(ctx):
    ctx.register_hook("on_session_start", init_session)
```

---

### `on_session_end`

在每次 `run_conversation()` 调用**结束时**触发，无论结果如何。如果用户在智能体处理中途退出，也会从 CLI 的退出处理程序中触发。

**回调函数签名：**

```python
def my_callback(session_id: str, completed: bool, interrupted: bool,
                model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 会话的唯一标识符 |
| `completed` | `bool` | 如果智能体生成了最终回复则为 `True`，否则为 `False` |
| `interrupted` | `bool` | 如果回合被中断（用户发送新消息、`/stop` 或退出）则为 `True` |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的平台 |

**触发时机：** 在两个位置：
1. **`run_agent.py`** —— 每次 `run_conversation()` 调用结束时，在所有清理操作之后触发。即使回合出错也会触发。
2. **`cli.py`** —— 在 CLI 的 atexit 处理程序中，但**仅**当智能体在处理中途（`_agent_running=True`）时发生退出。这会捕获处理过程中的 Ctrl+C 和 `/exit`。此时，`completed=False` 且 `interrupted=True`。

**返回值：** 被忽略。

**使用场景：** 刷新缓冲区、关闭连接、持久化会话状态、记录会话持续时间、清理在 `on_session_start` 中初始化的资源。

**示例 —— 刷新并清理：**

```python
_session_caches = {}

def cleanup_session(session_id, completed, interrupted, **kwargs):
    cache = _session_caches.pop(session_id, None)
    if cache:
        # 将累积数据刷新到磁盘或外部服务
        status = "completed" if completed else ("interrupted" if interrupted else "failed")
        print(f"Session {session_id} ended: {status}, {cache['tool_calls']} tool calls")

def register(ctx):
    ctx.register_hook("on_session_end", cleanup_session)
```

**示例 —— 会话持续时间跟踪：**

```python
import time, logging
logger = logging.getLogger(__name__)

_start_times = {}

def on_start(session_id, **kwargs):
    _start_times[session_id] = time.time()

def on_end(session_id, completed, interrupted, **kwargs):
    start = _start_times.pop(session_id, None)
    if start:
        duration = time.time() - start
        logger.info("SESSION_DURATION session=%s seconds=%.1f completed=%s interrupted=%s",
                     session_id, duration, completed, interrupted)

def register(ctx):
    ctx.register_hook("on_session_start", on_start)
    ctx.register_hook("on_session_end", on_end)
```

---

### `on_session_finalize`

当 CLI 或网关**拆除**一个活跃会话时触发——例如，用户运行 `/new`，网关回收了一个空闲会话，或 CLI 退出时智能体仍在运行。这是在会话身份消失前刷新与该会话关联状态的最后一次机会。

**回调函数签名：**

```python
def my_callback(session_id: str | None, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` 或 `None` | 即将退出的会话 ID。如果不存在活跃会话，则可能为 `None`。 |
| `platform` | `str` | `"cli"` 或消息平台名称（`"telegram"`、`"discord"` 等）。 |

**触发时机：** 在 `cli.py`（`/new` / CLI 退出时）和 `gateway/run.py`（会话被重置或回收时）。在网关端，总是与 `on_session_reset` 配对使用。

**返回值：** 被忽略。

**使用场景：** 在会话 ID 被丢弃前持久化最终会话指标、关闭每个会话的资源、发出最终遥测事件、排空排队的写入。

---

### `on_session_reset`

当网关为活跃聊天**交换新的会话密钥**时触发——用户调用了 `/new`、`/reset`、`/clear`，或适配器在空闲窗口后选择了一个新会话。这使得插件无需等待下一个 `on_session_start` 即可对会话状态被清除的事实做出反应。

**回调函数签名：**

```python
def my_callback(session_id: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 新会话的 ID（已轮换为新值）。 |
| `platform` | `str` | 消息平台名称。 |

**触发时机：** 在 `gateway/run.py` 中，新会话密钥分配后、下一个入站消息处理前立即触发。在网关端，顺序为：`on_session_finalize(old_id)` → 交换 → `on_session_reset(new_id)` → 第一个入站回合的 `on_session_start(new_id)`。

**返回值：** 被忽略。

**使用场景：** 重置以 `session_id` 为键的每个会话缓存、发出“会话已轮换”分析、准备新的状态桶。

---

请参阅 **[构建插件指南](/docs/guides/build-a-hermes-plugin)** 以获取完整教程，包括工具模式、处理程序和高级钩子模式。

---

### `subagent_stop`

在 `delegate_task` 完成后，**每个子智能体触发一次**。无论您委托的是单个任务还是三个任务批次，此钩子都会为每个子智能体触发一次，并在父线程上串行化。

**回调函数签名：**

```python
def my_callback(parent_session_id: str, child_role: str | None,
                child_summary: str | None, child_status: str,
                duration_ms: int, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `parent_session_id` | `str` | 委托父智能体的会话 ID |
| `child_role` | `str \| None` | 设置在子智能体上的编排器角色标签（如果该功能未启用则为 `None`） |
| `child_summary` | `str \| None` | 子智能体返回给父智能体的最终回复 |
| `child_status` | `str` | `"completed"`、`"failed"`、`"interrupted"` 或 `"error"` |
| `duration_ms` | `int` | 运行子智能体所花费的挂钟时间，以毫秒为单位 |

**触发时机：** 在 `tools/delegate_tool.py` 中，`ThreadPoolExecutor.as_completed()` 排空所有子任务 future 之后触发。触发被编组到父线程，因此钩子作者无需考虑并发回调执行。

**返回值：** 被忽略。

**使用场景：** 记录编排活动、累积子任务持续时间以用于计费、写入委托后审计记录。

**示例 —— 记录编排器活动：**

```python
import logging
logger = logging.getLogger(__name__)
```

def log_subagent(parent_session_id, child_role, child_status, duration_ms, **kwargs):
    logger.info(
        "SUBAGENT parent=%s role=%s status=%s duration_ms=%d",
        parent_session_id, child_role, child_status, duration_ms,
    )

def register(ctx):
    ctx.register_hook("subagent_stop", log_subagent)
```

:::info
在高强度委派场景下（例如：协调器角色 × 5个叶子 × 嵌套深度），`subagent_stop` 每轮会触发多次。请保持回调函数快速执行；将耗时操作推送到后台队列中处理。
:::

---

### `pre_gateway_dispatch`

在网关中**每个传入的 `MessageEvent` 触发一次**，位于内部事件守卫之后，但在认证/配对和智能体分发**之前**。这是网关级消息流策略（仅监听窗口、人工接管、按会话路由等）的拦截点，这些策略无法清晰地归入任何单一平台适配器。

**回调函数签名：**

```python
def my_callback(event, gateway, session_store, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `event` | `MessageEvent` | 标准化后的入站消息（包含 `.text`、`.source`、`.message_id`、`.internal` 等字段）。 |
| `gateway` | `GatewayRunner` | 当前活跃的网关运行器，插件可调用 `gateway.adapters[platform].send(...)` 发送旁路回复（如所有者通知等）。 |
| `session_store` | `SessionStore` | 用于通过 `session_store.append_to_transcript(...)` 静默摄取对话记录。 |

**触发时机：** 在 `gateway/run.py` 的 `GatewayRunner._handle_message()` 方法中，紧接在 `is_internal` 计算完成之后。**内部事件会完全跳过该钩子**（它们由系统生成，例如后台进程完成等，不应被面向用户的策略拦截）。

**返回值：** `None` 或一个字典。首个被识别的动作字典生效；其余插件的结果将被忽略。插件回调中的异常会被捕获并记录；网关在出错时总会回退到正常分发流程。

| 返回值 | 效果 |
|--------|--------|
| `{"action": "skip", "reason": "..."}` | 丢弃消息 — 无智能体回复，无配对流程，无认证。假定插件已处理该消息（例如静默摄取到对话记录中）。 |
| `{"action": "rewrite", "text": "new text"}` | 替换 `event.text`，然后使用修改后的事件继续正常分发。适用于将缓冲的周边消息合并为单个提示。 |
| `{"action": "allow"}` / `None` | 正常分发 — 运行完整的认证 / 配对 / 智能体循环链。 |

**使用场景：** 仅监听群聊（仅在被@时响应；将周边消息缓冲到上下文中）；人工接管（在主人手动处理聊天时静默摄取客户消息）；按配置文件限流；基于策略的路由。

**示例 — 静默丢弃未经授权的私聊消息，不触发配对代码：**

```python
def deny_unauthorized_dms(event, **kwargs):
    src = event.source
    if src.chat_type == "dm" and not _is_approved_user(src.user_id):
        return {"action": "skip", "reason": "unauthorized-dm"}
    return None

def register(ctx):
    ctx.register_hook("pre_gateway_dispatch", deny_unauthorized_dms)
```

**示例 — 在提及机器人时将周边消息缓冲区重写为单个提示：**

```python
_buffers = {}

def buffer_or_rewrite(event, **kwargs):
    key = (event.source.platform, event.source.chat_id)
    buf = _buffers.setdefault(key, [])
    if _bot_mentioned(event.text):
        combined = "\n".join(buf + [event.text])
        buf.clear()
        return {"action": "rewrite", "text": combined}
    buf.append(event.text)
    return {"action": "skip", "reason": "ambient-buffered"}

def register(ctx):
    ctx.register_hook("pre_gateway_dispatch", buffer_or_rewrite)
```

---

### `pre_approval_request`

在将审批请求呈现给用户**之前立即触发** — 涵盖所有界面：交互式 CLI、Ink TUI、网关平台（Telegram、Discord、Slack、WhatsApp、Matrix 等）以及 ACP 客户端（VS Code、Zed、JetBrains）。

这是接入自定义通知器的正确位置 — 例如，一个弹出允许/拒绝通知的 macOS 菜单栏应用，或记录每个带上下文的审批请求的审计日志。

**回调函数签名：**

```python
def my_callback(
    command: str,
    description: str,
    pattern_key: str,
    pattern_keys: list[str],
    session_key: str,
    surface: str,
    **kwargs,
):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `command` | `str` | 等待审批的 shell 命令 |
| `description` | `str` | 命令被标记的人类可读原因（当多个模式匹配时合并） |
| `pattern_key` | `str` | 触发审批的主要模式键（例如 `"rm_rf"`、`"sudo"`） |
| `pattern_keys` | `list[str]` | 所有匹配的模式键 |
| `session_key` | `str` | 会话标识符，有助于按会话限定通知范围 |
| `surface` | `str` | `"cli"` 表示交互式 CLI/TUI 提示，`"gateway"` 表示异步平台审批 |

**返回值：** 被忽略。此处的钩子仅为观察者；它们不能否决或预先回答审批。使用 [`pre_tool_call`](#pre_tool_call) 在工具到达审批系统之前阻止它。

**使用场景：** 桌面通知、推送警报、审计日志记录、Slack Webhook、升级路由、指标统计。

**示例 — macOS 上的桌面通知：**

```python
import subprocess

def notify_approval(command, description, session_key, **kwargs):
    title = "Hermes 需要审批"
    body = f"{description}: {command[:80]}"
    subprocess.Popen([
        "osascript", "-e",
        f'display notification "{body}" with title "{title}"',
    ])

def register(ctx):
    ctx.register_hook("pre_approval_request", notify_approval)
```

---

### `post_approval_response`

在用户响应审批提示（或提示超时）**之后触发**。

**回调函数签名：**

```python
def my_callback(
    command: str,
    description: str,
    pattern_key: str,
    pattern_keys: list[str],
    session_key: str,
    surface: str,
    choice: str,
    **kwargs,
):
```

与 `pre_approval_request` 相同的 kwargs，外加：

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `choice` | `str` | `"once"`、`"session"`、`"always"`、`"deny"` 或 `"timeout"` 之一 |

**返回值：** 被忽略。

**使用场景：** 关闭匹配的桌面通知，在审计日志中记录最终决定，更新指标，推进限流器。

```python
def log_decision(command, choice, session_key, **kwargs):
    logger.info("approval %s: %s for session %s", choice, command[:60], session_key)

def register(ctx):
    ctx.register_hook("post_approval_response", log_decision)
```

## Shell Hooks

在 `cli-config.yaml` 中声明 shell 脚本钩子，Hermes 将在对应的插件钩子事件触发时（无论是在 CLI 还是网关会话中）将其作为子进程运行。无需编写 Python 插件。

当您希望使用一个即插即用的单文件脚本（Bash、Python 或任何带有 shebang 的脚本）时，可以使用 shell 钩子：

- **阻止工具调用** —— 拒绝危险的 `terminal` 命令，强制执行每目录策略，对破坏性的 `write_file` / `patch` 操作要求审批。
- **在工具调用后运行** —— 自动格式化智能体刚写入的 Python 或 TypeScript 文件，记录 API 调用，触发 CI 工作流。
- **向下一轮 LLM 调用注入上下文** —— 将 `git status` 输出、当前星期几或检索到的文档前置到用户消息中（参见 [`pre_llm_call`](#pre_llm_call)）。
- **观察生命周期事件** —— 当子智能体完成时（`subagent_stop`）或会话启动时（`on_session_start`）写入日志行。

Shell 钩子通过在 CLI 启动时（`hermes_cli/main.py`）和网关启动时（`gateway/run.py`）调用 `agent.shell_hooks.register_from_config(cfg)` 来注册。它们与 Python 插件钩子自然组合 —— 两者都通过同一个调度器流转。

### 快速对比

| 维度 | Shell 钩子 | [插件钩子](#plugin-hooks) | [网关钩子](#gateway-event-hooks) |
|-----------|-------------|-------------------------------|---------------------------------------|
| 声明位置 | `~/.hermes/config.yaml` 中的 `hooks:` 块 | `plugin.yaml` 插件中的 `register()` | `HOOK.yaml` + `handler.py` 目录 |
| 存放位置 | `~/.hermes/agent-hooks/`（按惯例） | `~/.hermes/plugins/<name>/` | `~/.hermes/hooks/<name>/` |
| 语言 | 任意（Bash、Python、Go 二进制文件等） | 仅 Python | 仅 Python |
| 运行环境 | CLI + 网关 | CLI + 网关 | 仅网关 |
| 事件 | `VALID_HOOKS`（包括 `subagent_stop`） | `VALID_HOOKS` | 网关生命周期（`gateway:startup`、`agent:*`、`command:*`） |
| 能否阻止工具调用 | 是（`pre_tool_call`） | 是（`pre_tool_call`） | 否 |
| 能否注入 LLM 上下文 | 是（`pre_llm_call`） | 是（`pre_llm_call`） | 否 |
| 许可机制 | 首次使用时对每个 `(event, command)` 对进行提示 | 隐式（信任 Python 插件） | 隐式（信任目录） |
| 进程间隔离 | 是（子进程） | 否（进程内） | 否（进程内） |

### 配置模式

```yaml
hooks:
  <event_name>:                  # 必须是 VALID_HOOKS 中的事件
    - matcher: "<regex>"         # 可选；仅用于 pre/post_tool_call
      command: "<shell command>" # 必需；通过 shlex.split 运行，shell=False
      timeout: <seconds>         # 可选；默认 60，上限为 300

hooks_auto_accept: false         # 参见下面的“许可模型”
```

事件名称必须是 [插件钩子事件](#plugin-hooks) 之一；拼写错误会产生“您是指 X 吗？”警告并被跳过。单个条目中的未知键会被忽略；缺少 `command` 会跳过并发出警告。`timeout > 300` 会被截断并发出警告。

### JSON 线路协议

每次事件触发时，Hermes 会为每个匹配的钩子（允许匹配器）生成一个子进程，将 JSON 负载通过 **stdin** 管道传输，并将 **stdout** 作为 JSON 读回。

**stdin —— 脚本接收的负载：**

```json
{
  "hook_event_name": "pre_tool_call",
  "tool_name":       "terminal",
  "tool_input":      {"command": "rm -rf /"},
  "session_id":      "sess_abc123",
  "cwd":             "/home/user/project",
  "extra":           {"task_id": "...", "tool_call_id": "..."}
}
```

对于非工具事件（`pre_llm_call`、`subagent_stop`、会话生命周期），`tool_name` 和 `tool_input` 为 `null`。`extra` 字典携带所有事件特定的关键字参数（`user_message`、`conversation_history`、`child_role`、`duration_ms` 等）。不可序列化的值会被字符串化而不是省略。

**stdout —— 可选响应：**

```jsonc
// 阻止 pre_tool_call（接受两种格式；内部会标准化）：
{"decision": "block", "reason":  "Forbidden: rm -rf"}   // Claude-Code 风格
{"action":   "block", "message": "Forbidden: rm -rf"}   // Hermes 规范格式

// 为 pre_llm_call 注入上下文：
{"context": "Today is Friday, 2026-04-17"}

// 静默无操作 —— 任何空输出或不匹配的输出都可以：
```

格式错误的 JSON、非零退出码和超时都会记录警告，但绝不会中止智能体循环。

### 实际示例

#### 1. 每次写入后自动格式化 Python 文件

```yaml
# ~/.hermes/config.yaml
hooks:
  post_tool_call:
    - matcher: "write_file|patch"
      command: "~/.hermes/agent-hooks/auto-format.sh"
```

```bash
#!/usr/bin/env bash
# ~/.hermes/agent-hooks/auto-format.sh
payload="$(cat -)"
path=$(echo "$payload" | jq -r '.tool_input.path // empty')
[[ "$path" == *.py ]] && command -v black >/dev/null && black "$path" 2>/dev/null
printf '{}\n'
```

智能体的上下文视图中的文件**不会**自动重新读取 —— 重新格式化仅影响磁盘上的文件。后续的 `read_file` 调用将获取格式化后的版本。

#### 2. 阻止破坏性的 `terminal` 命令

```yaml
hooks:
  pre_tool_call:
    - matcher: "terminal"
      command: "~/.hermes/agent-hooks/block-rm-rf.sh"
      timeout: 5
```

```bash
#!/usr/bin/env bash
# ~/.hermes/agent-hooks/block-rm-rf.sh
payload="$(cat -)"
cmd=$(echo "$payload" | jq -r '.tool_input.command // empty')
if echo "$cmd" | grep -qE 'rm[[:space:]]+-rf?[[:space:]]+/'; then
  printf '{"decision": "block", "reason": "blocked: rm -rf / is not permitted"}\n'
else
  printf '{}\n'
fi
```

#### 3. 在每轮调用中注入 `git status`（等效于 Claude-Code 的 `UserPromptSubmit`）

```yaml
hooks:
  pre_llm_call:
    - command: "~/.hermes/agent-hooks/inject-cwd-context.sh"
```

```bash
#!/usr/bin/env bash
# ~/.hermes/agent-hooks/inject-cwd-context.sh
cat - >/dev/null   # 丢弃 stdin 负载
if status=$(git status --porcelain 2>/dev/null) && [[ -n "$status" ]]; then
  jq --null-input --arg s "$status" \
     '{context: ("Uncommitted changes in cwd:\n" + $s)}'
else
  printf '{}\n'
fi
```

Claude Code 的 `UserPromptSubmit` 事件 intentionally 不是 Hermes 的独立事件 —— `pre_llm_call` 在相同位置触发，并且已经支持上下文注入。请在此处使用它。

#### 4. 记录每个子智能体完成事件

```yaml
hooks:
  subagent_stop:
    - command: "~/.hermes/agent-hooks/log-orchestration.sh"
```

```bash
#!/usr/bin/env bash
# ~/.hermes/agent-hooks/log-orchestration.sh
log=~/.hermes/logs/orchestration.log
jq -c '{ts: now, parent: .session_id, extra: .extra}' < /dev/stdin >> "$log"
printf '{}\n'
```

### 许可模型

每个唯一的 `(event, command)` 对在 Hermes 首次遇到时会提示用户批准，然后将决定持久化到 `~/.hermes/shell-hooks-allowlist.json`。后续运行（CLI 或网关）会跳过提示。

有三种方式可以绕过交互式提示 —— 满足其中任意一种即可：

1. CLI 上的 `--accept-hooks` 标志（例如 `hermes --accept-hooks chat`）
2. `HERMES_ACCEPT_HOOKS=1` 环境变量
3. `cli-config.yaml` 中的 `hooks_auto_accept: true`

非 TTY 运行（网关、cron、CI）需要上述三种方式之一 —— 否则任何新添加的钩子将保持未注册状态并记录警告。

**脚本编辑会被静默信任。** 许可列表基于确切的命令字符串，而不是脚本的哈希值，因此编辑磁盘上的脚本不会使许可失效。`hermes hooks doctor` 会标记 mtime 漂移，以便您发现编辑并决定是否重新批准。

### `hermes hooks` CLI

| 命令 | 功能 |
|---------|--------------|
| `hermes hooks list` | 转储配置的钩子，包括匹配器、超时和许可状态 |
| `hermes hooks test <event> [--for-tool X] [--payload-file F]` | 针对合成负载触发每个匹配的钩子，并打印解析后的响应 |
| `hermes hooks revoke <command>` | 移除每个与 `<command>` 匹配的许可列表条目（下次重启时生效） |
| `hermes hooks doctor` | 对每个配置的钩子检查：可执行位、许可列表状态、mtime 漂移、JSON 输出有效性和大致执行时间 |

### 安全性

Shell 钩子以**您的完整用户凭据**运行 —— 与 cron 条目或 shell 别名具有相同的信任边界。将 `config.yaml` 中的 `hooks:` 块视为特权配置：

- 仅引用您编写或完全审查过的脚本。
- 将脚本保留在 `~/.hermes/agent-hooks/` 内，以便轻松审计路径。
- 在拉取共享配置后重新运行 `hermes hooks doctor`，以便在钩子注册之前发现新添加的钩子。
- 如果您的 config.yaml 在团队中进行版本控制，请像审查 CI 配置一样审查更改 `hooks:` 部分的 PR。

### 排序和优先级

Python 插件钩子和 shell 钩子都通过同一个 `invoke_hook()` 调度器流转。Python 插件首先注册（`discover_and_load()`），shell 钩子其次注册（`register_from_config()`），因此在平局情况下，Python 的 `pre_tool_call` 阻止决策优先。第一个有效的阻止将获胜 —— 一旦任何回调产生带有非空消息的 `{"action": "block", "message": str}`，聚合器就会立即返回。