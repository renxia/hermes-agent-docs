---
sidebar_position: 6
title: "Event Hooks"
description: "Run custom code at key lifecycle points — log activity, send alerts, post to webhooks"
---

# Event Hooks

Hermes 拥有三个钩子系统，可在关键生命周期节点运行自定义代码：

| 系统 | 注册方式 | 运行环境 | 使用场景 |
|------|----------|----------|----------|
| **[Gateway 钩子](#gateway-event-hooks)** | `~/.hermes/hooks/` 中的 `HOOK.yaml` + `handler.py` | 仅 Gateway | 日志记录、告警、Webhook |
| **[插件钩子](#plugin-hooks)** | 在[插件](/user-guide/features/plugins)中使用 `ctx.register_hook()` | CLI + Gateway | 工具拦截、指标统计、护栏机制 |
| **[Shell 钩子](#shell-hooks)** | `~/.hermes/config.yaml` 中的 `hooks:` 块指向 shell 脚本 | CLI + Gateway | 用于拦截、自动格式化、上下文注入的即插即用脚本 |

这三个系统均为非阻塞模式——任何钩子中的错误都会被捕获并记录日志，绝不会导致智能体崩溃。

## 网关事件钩子

网关钩子在网关运行期间自动触发（Telegram、Discord、Slack、WhatsApp、Teams），不会阻塞主智能体管道。

### 创建钩子

每个钩子是位于 `~/.hermes/hooks/` 下的一个目录，包含两个文件：

```text
~/.hermes/hooks/
└── my-hook/
    ├── HOOK.yaml      # 声明要监听的事件
    └── handler.py     # Python 处理函数
```

#### HOOK.yaml

```yaml
name: my-hook
description: 记录所有智能体活动到文件
events:
  - agent:start
  - agent:end
  - agent:step
```

`events` 列表决定了哪些事件会触发你的处理函数。你可以订阅任意事件组合，包括 `command:*` 这样的通配符。

#### handler.py

```python
import json
from datetime import datetime
from pathlib import Path

LOG_FILE = Path.home() / ".hermes" / "hooks" / "my-hook" / "activity.log"

async def handle(event_type: str, context: dict):
    """对每个已订阅的事件调用。必须命名为 'handle'。"""
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
- 可以是 `async def` 或普通 `def` —— 两者都可用
- 错误会被捕获并记录日志，绝不会导致智能体崩溃

### 可用事件

| 事件 | 触发时机 | 上下文键 |
|-------|---------------|--------------|
| `gateway:startup` | 网关进程启动 | `platforms`（活跃平台名称列表） |
| `session:start` | 创建新消息会话 | `platform`、`user_id`、`session_id`、`session_key` |
| `session:end` | 会话结束（重置前） | `platform`、`user_id`、`session_key` |
| `session:reset` | 用户执行了 `/new` 或 `/reset` | `platform`、`user_id`、`session_key` |
| `agent:start` | 智能体开始处理消息 | `platform`、`user_id`、`session_id`、`message` |
| `agent:step` | 工具调用循环的每次迭代 | `platform`、`user_id`、`session_id`、`iteration`、`tool_names` |
| `agent:end` | 智能体完成处理 | `platform`、`user_id`、`session_id`、`message`、`response` |
| `command:*` | 执行了任意斜杠命令 | `platform`、`user_id`、`command`、`args` |

#### 通配符匹配

注册了 `command:*` 的处理函数会在任意 `command:` 事件（`command:model`、`command:reset` 等）时触发。通过单个订阅监控所有斜杠命令。

### 示例

#### 长任务 Telegram 告警

当智能体执行超过 10 步时给自己发送消息：

```yaml
# ~/.hermes/hooks/long-task-alert/HOOK.yaml
name: long-task-alert
description: 当智能体执行多步时发出告警
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
        text = f"⚠️ 智能体已运行 {iteration} 步。最近工具: {tools}"
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                json={"chat_id": CHAT_ID, "text": text},
            )
```

#### 命令使用记录器

追踪哪些斜杠命令被使用：

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

在新会话时 POST 到外部服务：

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

### 教程：BOOT.md —— 每次网关启动时运行启动清单

一个来自社区的流行模式：在 `~/.hermes/BOOT.md` 放置一个 Markdown 清单，让智能体在网关每次启动时执行一次。适用于"每次启动时检查隔夜定时任务是否有失败，如果有则在 Discord 上通知我"或"汇总过去 24 小时的 deploy.log 并发布到 Slack #ops"等场景。

本教程展示如何将其构建为用户自定义钩子。Hermes 不附带内置的 BOOT.md 钩子 —— 你可以完全按自己的需求配置行为。

#### 我们要构建的内容

1. 在 `~/.hermes/BOOT.md` 的一个包含自然语言启动指令的文件。
2. 一个在 `gateway:startup` 时触发的网关钩子，使用网关已解析的模型/凭证创建一个一次性智能体，并执行 BOOT.md 中的指令。
3. 一个 `[SILENT]` 约定，让智能体在没有需要报告的内容时可以选择不发送消息。

#### 第 1 步：编写你的清单

创建 `~/.hermes/BOOT.md`。像给人类助手下达指令一样编写：

```markdown
# 启动清单

1. 运行 `hermes cron list` 并检查是否有定时任务在夜间失败。
2. 如有失败，使用 `send_message` 工具发送摘要到 Discord #ops。
3. 检查 `/opt/app/deploy.log` 是否有过去 24 小时的 ERROR 行。如有，将其摘要并包含在同一条 Discord 消息中。
4. 如果没有异常，只回复 `[SILENT]`，这样不会发送任何消息。
```

智能体会在提示中看到这些内容，因此任何可以用自然语言描述的操作都可行 —— 工具调用、shell 命令、发送消息、汇总文件。

#### 第 2 步：创建钩子

```text
~/.hermes/hooks/boot-md/
├── HOOK.yaml
└── handler.py
```

**`~/.hermes/hooks/boot-md/HOOK.yaml`**

```yaml
name: boot-md
description: 网关启动时执行 ~/.hermes/BOOT.md
events:
  - gateway:startup
```

**`~/.hermes/hooks/boot-md/handler.py`**

```python
"""在每次网关启动时执行 ~/.hermes/BOOT.md。"""

import logging
import threading
from pathlib import Path

logger = logging.getLogger("hooks.boot-md")

BOOT_FILE = Path.home() / ".hermes" / "BOOT.md"


def _build_prompt(content: str) -> str:
    return (
        "你正在执行启动清单。完全按照以下指令操作。\n\n"
        "---\n"
        f"{content}\n"
        "---\n\n"
        "执行每条指令。使用 send_message 工具将消息发送到 Discord 或 Slack 等平台。\n"
        "如果无需关注且没有需要报告的内容，只回复: [SILENT]"
    )


def _run_boot_agent(content: str) -> None:
    """创建一个一次性智能体并执行清单。

    使用网关已解析的模型时运行凭证，因此适用于自定义端点、聚合器和基于 OAuth 的提供商。
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
        response = (result.get("final_response", "") or "").strip()
        if response.upper() not in {"[SILENT]", "SILENT", "NO_REPLY", "NO REPLY"}:
            logger.info("boot-md 完成: %s", response[:200])
        else:
            logger.info("boot-md 完成（无内容需报告）")
    except Exception as e:
        logger.error("boot-md 智能体失败: %s", e)


async def handle(event_type: str, context: dict) -> None:
    if not BOOT_FILE.exists():
        return
    content = BOOT_FILE.read_text(encoding="utf-8").strip()
    if not content:
        return

    logger.info("正在执行 BOOT.md (%d 字符)", len(content))

    # 使用后台线程，避免网关启动被完整的智能体轮次阻塞。
    thread = threading.Thread(
        target=_run_boot_agent,
        args=(content,),
        name="boot-md",
        daemon=True,
    )
    thread.start()
```

两个关键行：

- `_resolve_gateway_model()` 读取网关当前配置的模型。
- `_resolve_runtime_agent_kwargs()` 以与普通网关轮次相同的方式解析提供商凭证 —— 包括 API 密钥、base URL、OAuth 令牌和凭证池。

缺少这两行时，裸 `AIAgent()` 会回退到内置默认值，对任何非默认端点都会报 401 错误。

#### 第 3 步：测试

重启网关：

```bash
hermes gateway restart
```

观察日志：

```bash
hermes logs --follow --level INFO | grep boot-md
```

你应该看到 `正在执行 BOOT.md (N 字符)`，然后是 `boot-md 完成: ...`（智能体执行内容的摘要）或当智能体回复了精确的无声标记如 `[SILENT]` 时的 `boot-md 完成（无内容需报告）`。

删除 `~/.hermes/BOOT.md` 即可禁用清单 —— 钩子保持加载状态，但文件不存在时会静默跳过。

#### 扩展该模式

- **时间感知清单：** 在 BOOT.md 的指令中以 `datetime.now().weekday()` 为条件（"如果是周一，还需检查每周部署日志"）。指令是自由文本，因此任何智能体可以推理的内容都可行。
- **多清单：** 让钩子指向不同文件（`STARTUP.md`、`MORNING.md` 等），并为每个注册独立的钩子目录。
- **非智能体变体：** 如果不需要完整的智能体循环，可以完全跳过 `AIAgent`，让处理函数通过 `httpx` 直接发送固定通知。更便宜、更快、无提供商依赖。

#### 为什么这不是内置功能

Hermes 的早期版本将其作为内置钩子发布，在每次网关启动时以裸默认值静默创建智能体。这让使用自定义端点的用户感到意外，并使不知道该功能在运行的用户看不到它。将其保留为文档化模式 —— 由你构建，放在你的钩子目录中 —— 意味着你可以完全看到它的行为，并通过编写文件来选择启用。

### 工作原理

1. 网关启动时，`HookRegistry.discover_and_load()` 扫描 `~/.hermes/hooks/`
2. 每个包含 `HOOK.yaml` + `handler.py` 的子目录都会被动态加载
3. 处理函数按其声明的事件注册
4. 在每个生命周期节点，`hooks.emit()` 触发所有匹配的处理函数
5. 任何处理函数中的错误都会被捕获并记录日志 —— 损坏的钩子绝不会导致智能体崩溃

:::info
网关钩子仅在**网关**（Telegram、Discord、Slack、WhatsApp、Teams）中触发。CLI 不加载网关钩子。如需在所有地方都能工作的钩子，请使用[插件钩子](#plugin-hooks)。
:::

## 插件钩子

[插件](/user-guide/features/plugins) 可以注册在 **CLI 和网关** 会话中触发的钩子。这些钩子通过插件 `register()` 函数中的 `ctx.register_hook()` 以编程方式注册。

有关插件打包和注册的详细信息，请参阅
[插件指南](/docs/user-guide/features/plugins)。

```python
def register(ctx):
    ctx.register_hook("pre_tool_call", my_tool_observer)
    ctx.register_hook("post_tool_call", my_tool_logger)
    ctx.register_hook("pre_llm_call", my_memory_callback)
    ctx.register_hook("post_llm_call", my_sync_callback)
    ctx.register_hook("on_session_start", my_init_callback)
    ctx.register_hook("on_session_end", my_cleanup_callback)
```

**所有钩子的通用规则：**

- 回调函数接收 **关键字参数**。始终接受 `**kwargs` 以确保向前兼容——未来版本可能添加新参数而不会破坏你的插件。
- 如果回调函数 **崩溃**，它会被记录并跳过。其他钩子和智能体继续正常运行。行为异常的插件永远不会导致智能体崩溃。
- 有两个钩子的返回值会影响行为：[`pre_tool_call`](#pre_tool_call) 可以 **阻止** 工具调用，[`pre_llm_call`](#pre_llm_call) 可以 **注入上下文** 到 LLM 调用中。所有其他钩子都是触发后即忘的观察者。
- 观察者回调函数会自动接收 `telemetry_schema_version`。当该字段存在时，`turn_id`、`api_request_id`、`task_id`、`session_id` 和 `api_call_count` 是独立的关联字段。将 `api_request_id` 视为不透明标识符；不要解析其字符串格式。

### 快速参考

| 钩子 | 触发时机 | 返回值 |
|------|-----------|---------|
| [`pre_tool_call`](#pre_tool_call) | 任何工具执行之前 | `{"action": "block", "message": str}` 以否决调用 |
| [`post_tool_call`](#post_tool_call) | 任何工具返回之后 | 被忽略 |
| [`pre_llm_call`](#pre_llm_call)  | 每轮一次，工具调用循环之前 | `{"context": str}` 将上下文前置到用户消息中 |
| [`post_llm_call`](#post_llm_call) | 每轮一次，工具调用循环之后 | 被忽略 |
| [`on_session_start`](#on_session_start) | 创建新会话时（仅首轮） | 被忽略 |
| [`on_session_end`](#on_session_end) | 会话结束时 | 被忽略 |
| [`on_session_finalize`](#on_session_finalize) | CLI/网关拆除活动会话时（刷新、保存、统计） | 被忽略 |
| [`on_session_reset`](#on_session_reset) | 网关换入新的会话密钥时（如 `/new`、`/reset`） | 被忽略 |
| [`subagent_start`](#subagent_start) | `delegate_task` 子智能体已构建并即将运行时 | 被忽略 |
| [`subagent_stop`](#subagent_stop) | `delegate_task` 子智能体已退出时 | 被忽略 |
| [`pre_gateway_dispatch`](#pre_gateway_dispatch) | 网关收到用户消息后，认证和分发之前 | `{"action": "skip" \| "rewrite" \| "allow", ...}` 以影响流程 |
| [`pre_approval_request`](#pre_approval_request) | 危险命令需要用户确认，在提示/通知发送之前 | 被忽略 |
| [`post_approval_response`](#post_approval_response) | 用户响应了批准提示（或超时）后 | 被忽略 |
| [`transform_tool_result`](#transform_tool_result) | 任何工具返回之后，结果交还给模型之前 | `str` 替换结果，`None` 保持不变 |
| [`transform_terminal_output`](#transform_terminal_output) | 在 `terminal` 工具内部，截断/去 ANSI/脱敏之前 | `str` 替换原始输出，`None` 保持不变 |
| [`transform_llm_output`](#transform_llm_output) | 工具调用循环完成后，最终响应交付之前 | `str` 替换响应文本，`None`/空值保持不变 |

---

### `pre_tool_call`

在每次工具执行 **之前立即** 触发——内置工具和插件工具均会触发。

**回调函数签名：**

```python
def my_callback(tool_name: str, args: dict, task_id: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `tool_name` | `str` | 即将执行的工具名称（如 `"terminal"`、`"web_search"`、`"read_file"`） |
| `args` | `dict` | 模型传递给工具的参数 |
| `task_id` | `str` | 会话/任务标识符。如未设置则为空字符串。 |

**触发位置：** 在 `model_tools.py` 的 `handle_function_call()` 内部，工具处理程序运行之前。每次工具调用触发一次——如果模型并行调用 3 个工具，则触发 3 次。

**返回值——否决调用：**

```python
return {"action": "block", "message": "工具调用被阻止的原因"}
```

智能体将使用该 `message` 作为错误返回给模型，从而短路该工具调用。第一个匹配的阻止指令生效（先注册的 Python 插件，然后是 shell 钩子）。任何其他返回值都会被忽略，因此现有的仅观察者模式的回调函数可继续正常工作。

**使用场景：** 日志记录、审计追踪、工具调用计数器、阻止危险操作、速率限制、按用户策略执行。

**示例——工具调用审计日志：**

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

**示例——危险工具警告：**

```python
DANGEROUS = {"terminal", "write_file", "patch"}

def warn_dangerous(tool_name, **kwargs):
    if tool_name in DANGEROUS:
        print(f"⚠ 正在执行潜在危险工具: {tool_name}")

def register(ctx):
    ctx.register_hook("pre_tool_call", warn_dangerous)
```

---

### `post_tool_call`

在每次工具执行返回后 **立即** 触发。

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
| `task_id` | `str` | 会话/任务标识符。如未设置则为空字符串。 |
| `duration_ms` | `int` | 工具分发耗时，以毫秒为单位（通过 `time.monotonic()` 在 `registry.dispatch()` 周围测量）。 |

**触发位置：** 在 `model_tools.py` 的 `handle_function_call()` 内部，工具处理程序返回之后。每次工具调用触发一次。如果工具引发了未处理的异常，则 **不会** 触发（异常被捕获并作为错误 JSON 字符串返回，`post_tool_call` 会以该错误字符串作为 `result` 触发）。

**返回值：** 被忽略。

**使用场景：** 记录工具结果、指标收集、追踪工具成功率/失败率、延迟仪表盘、按工具预算提醒、特定工具完成时发送通知。

**示例——追踪工具使用指标：**

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

**每轮触发一次**，在工具调用循环开始之前。这是 **唯一一个返回值会被使用的钩子** ——它可以将上下文注入当前轮次的用户消息中。

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
| `is_first_turn` | `bool` | 如果是新会话的首轮则为 `True`，后续轮次为 `False` |
| `model` | `str` | 模型标识符（如 `"anthropic/claude-sonnet-4.6"`） |
| `platform` | `str` | 会话运行的位置：`"cli"`、`"telegram"`、`"discord"` 等 |

**触发位置：** 在 `run_agent.py` 的 `run_conversation()` 内部，上下文压缩之后、主 `while` 循环之前。每次 `run_conversation()` 调用触发一次（即每用户轮次一次），而不是工具循环内每次 API 调用都触发。

**返回值：** 如果回调函数返回包含 `"context"` 键的字典，或纯非空字符串，则该文本会被追加到当前轮次的用户消息中。返回 `None` 表示不注入。

```python
# 注入上下文
return {"context": "回忆起的记忆：\n- 用户喜欢 Python\n- 正在开发 hermes-agent"}

# 纯字符串（等效）
return "回忆起的记忆：\n- 用户喜欢 Python"

# 不注入
return None
```

**上下文注入位置：** 始终注入到 **用户消息** 中，而非系统提示词。这保留了提示缓存——系统提示词在各轮之间保持一致，因此缓存的 token 可被复用。系统提示词是 Hermes 的领域（模型引导、工具执行、个性、技能）。插件在用户输入旁边贡献上下文。

所有注入的上下文都是 **临时的** ——仅在 API 调用时添加。对话历史中的原始用户消息永远不会被修改，也不会持久化到会话数据库中。

当 **多个插件** 返回上下文时，它们的输出会以双换行符按插件发现顺序（按目录名字母顺序）连接。

**使用场景：** 记忆召回、RAG 上下文注入、护栏、每轮分析。

**示例——记忆召回：**

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
        text = "回忆起的上下文：" + "\n".join(f"- {m['text']}" for m in memories)
        return {"context": text}
    except Exception:
        return None

def register(ctx):
    ctx.register_hook("pre_llm_call", recall)
```

**示例——护栏：**

```python
POLICY = "未经用户明确确认，切勿执行删除文件的命令。"

def guardrails(**kwargs):
    return {"context": POLICY}

def register(ctx):
    ctx.register_hook("pre_llm_call", guardrails)
```

---

### `post_llm_call`

**每轮触发一次**，在工具调用循环完成且智能体产生最终响应之后。仅在 **成功** 的轮次触发——如果轮次被中断则不触发。

**回调函数签名：**

```python
def my_callback(session_id: str, user_message: str, assistant_response: str,
                conversation_history: list, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 当前会话的唯一标识符 |
| `user_message` | `str` | 用户本轮的原始消息 |
| `assistant_response` | `str` | 智能体本轮的最终文本响应 |
| `conversation_history` | `list` | 轮次完成后完整消息列表的副本 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的位置 |

**触发时机：** 在 `run_agent.py` 中的 `run_conversation()` 里，工具循环以最终响应退出之后。受 `if final_response and not interrupted` 保护——因此当用户在中间打断或智能体达到迭代限制但未产生响应时，**不会**触发。

**返回值：** 被忽略。

**使用场景：** 将对话数据同步到外部记忆系统、计算响应质量指标、记录轮次摘要、触发后续操作。

**示例——同步到外部记忆：**

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

**示例——跟踪响应长度：**

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

在创建全新会话时**触发一次**。在会话继续时（用户在已有会话中发送第二条消息）**不会**触发。

**回调签名：**

```python
def my_callback(session_id: str, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 说明 |
|--------|------|-------------|
| `session_id` | `str` | 新会话的唯一标识符 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的位置 |

**触发时机：** 在 `run_agent.py` 中的 `run_conversation()` 里，新会话的第一轮期间——具体是在系统提示词构建完成之后、工具循环开始之前。检查条件为 `if not conversation_history`（无先前消息 = 新会话）。

**返回值：** 被忽略。

**使用场景：** 初始化会话范围内的状态、预热缓存、向外部服务注册会话、记录会话开始。

**示例——初始化会话缓存：**

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

在每次 `run_conversation()` 调用**最末尾**触发，无论结果如何。如果智能体在用户退出时正处于处理中，也会从 CLI 的退出处理器中触发。

**回调签名：**

```python
def my_callback(session_id: str, completed: bool, interrupted: bool,
                model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 说明 |
|--------|------|-------------|
| `session_id` | `str` | 会话的唯一标识符 |
| `completed` | `bool` | 如果智能体产生了最终响应则为 `True`，否则为 `False` |
| `interrupted` | `bool` | 如果轮次被中断（用户发送新消息、`/stop` 或退出）则为 `True` |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的位置 |

**触发时机：** 在两个位置：
1. **`run_agent.py`** — 在每次 `run_conversation()` 调用的末尾，所有清理工作之后。始终触发，即使轮次出错也会触发。
2. **`cli.py`** — 在 CLI 的 atexit 处理器中，但**仅在**退出时智能体正在处理中（`_agent_running=True`）时触发。这捕获了在处理期间的 Ctrl+C 和 `/exit`。在这种情况下，`completed=False` 且 `interrupted=True`。

**返回值：** 被忽略。

**使用场景：** 刷新缓冲区、关闭连接、持久化会话状态、记录会话持续时间、清理在 `on_session_start` 中初始化的资源。

**示例——刷新并清理：**

```python
_session_caches = {}

def cleanup_session(session_id, completed, interrupted, **kwargs):
    cache = _session_caches.pop(session_id, None)
    if cache:
        # 将累积的数据刷新到磁盘或外部服务
        status = "completed" if completed else ("interrupted" if interrupted else "failed")
        print(f"Session {session_id} ended: {status}, {cache['tool_calls']} tool calls")

def register(ctx):
    ctx.register_hook("on_session_end", cleanup_session)
```

**示例——会话持续时间跟踪：**

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

当 CLI 或网关**拆除**活动会话时触发——例如，当用户执行 `/new`、网关 GC 了空闲会话，或 CLI 带着活动智能体退出时。这是在会话身份消失之前刷新与传出会话相关状态的最后一次机会。

**回调签名：**

```python
def my_callback(session_id: str | None, platform: str, **kwargs):
```

| 参数 | 类型 | 说明 |
|--------|------|-------------|
| `session_id` | `str` 或 `None` | 传出的会话 ID。如果不存在活动会话，可能为 `None`。 |
| `platform` | `str` | `"cli"` 或消息平台名称（`"telegram"`、`"discord"` 等）。 |

**触发时机：** 在 `cli.py`（执行 `/new` / CLI 退出时）和 `gateway/run.py`（当会话被重置或 GC 时）。在网关端始终与 `on_session_reset` 配对。

**返回值：** 被忽略。

**使用场景：** 在会话 ID 被丢弃前持久化最终会话指标、关闭每会话资源、发送最终遥测事件、排空排队的写入。

---

### `on_session_reset`

当网关为活动聊天**交换新会话密钥**时触发——用户调用了 `/new`、`/reset`、`/clear`，或适配器在空闲窗口后选择了新会话。这使插件能够在对话状态被清除时做出反应，而无需等待下一个 `on_session_start`。

**回调签名：**

```python
def my_callback(session_id: str, platform: str, **kwargs):
```

| 参数 | 类型 | 说明 |
|--------|------|-------------|
| `session_id` | `str` | 新会话的 ID（已轮换为新值）。 |
| `platform` | `str` | 消息平台名称。 |

**触发时机：** 在 `gateway/run.py` 中，在新会话密钥分配之后、下一条入站消息处理之前立即触发。在网关上，顺序为：`on_session_finalize(old_id)` → 交换 → `on_session_reset(new_id)` → 在第一轮入站时触发 `on_session_start(new_id)`。

**返回值：** 被忽略。

**使用场景：** 重置以 `session_id` 为键的每会话缓存、发送"会话轮换"分析事件、初始化新的状态桶。

---

请参阅**[构建插件指南](/guides/build-a-hermes-plugin)**，获取包括工具架构、处理器和高级钩子模式的完整教程。

---

### `subagent_start`

在 `delegate_task` 构建了子 `AIAgent` 之后、该子智能体运行之前，**每个子智能体触发一次**。无论你委派单个任务还是批量三个任务，此钩子为每个子智能体触发一次。

此钩子特定于委派/子智能体生命周期。它不是网关、CLI、定时任务、批量、MoA 或其他运行器发起的智能体执行的通用"任何智能体调用前"门控。

**回调签名：**

```python
def my_callback(parent_session_id: str | None,
                parent_turn_id: str,
                parent_subagent_id: str | None,
                child_session_id: str | None,
                child_subagent_id: str,
                child_role: str,
                child_goal: str,
                **kwargs):
```

| 参数 | 类型 | 说明 |
|--------|------|-------------|
| `parent_session_id` | `str \| None` | 委派父智能体的会话 ID。 |
| `parent_turn_id` | `str` | 请求委派的父智能体轮次的轮次 ID（如有）。 |
| `parent_subagent_id` | `str \| None` | 当此子智能体由另一个子智能体生成时，父智能体的子智能体 ID；顶层父智能体为 `None`。 |
| `child_session_id` | `str \| None` | 为子智能体分配的会话 ID。 |
| `child_subagent_id` | `str` | 用于委派可观测性和控制的稳定子智能体 ID。 |
| `child_role` | `str` | 应用委派策略后的有效子角色，例如 `"leaf"` 或 `"orchestrator"`。 |
| `child_goal` | `str` | 子智能体将执行的目标/提示词。 |

**触发时机：** 在 `tools/delegate_tool.py` 中的 `_build_child_agent()` 内部，子 `AIAgent` 已构建并标注了子智能体身份元数据之后，在 `_run_single_child()` 运行子智能体之前。

**返回值：** 被忽略。这仅是一个观察器钩子；返回值不会阻止或改变子智能体的运行。

**使用场景：** 记录子智能体创建、映射父子会话关系、跟踪嵌套委派树、发送预运行审计记录、为每个子智能体预分配可观测性资源。

**示例——记录子智能体创建：**

```python
import logging

logger = logging.getLogger(__name__)

def log_subagent_start(
    parent_session_id,
    parent_turn_id,
    child_session_id,
    child_subagent_id,
    child_role,
    child_goal,
    **kwargs,
):
    logger.info(
        "SUBAGENT_START parent=%s turn=%s child_session=%s child=%s role=%s goal=%r",
        parent_session_id,
        parent_turn_id,
        child_session_id,
        child_subagent_id,
        child_role,
        child_goal[:200],
    )

def register(ctx):
    ctx.register_hook("subagent_start", log_subagent_start)
```

:::info
`subagent_start` 对委派可观测性很有用，但它不是阻塞策略钩子。要在子智能体构建之前阻止委派，请使用 [`pre_tool_call`](#pre_tool_call) 来阻止 `delegate_task` 工具调用。
:::

---

### `subagent_stop`

在 `delegate_task` 完成后，**每个子智能体触发一次**。无论你委派单个任务还是批量三个任务，此钩子为每个子智能体触发一次，在父线程上串行触发。

**回调签名：**

```python
def my_callback(parent_session_id: str, child_role: str | None,
                child_summary: str | None, child_status: str,
                duration_ms: int, **kwargs):
```

| 参数 | 类型 | 说明 |
|--------|------|-------------|
| `parent_session_id` | `str` | 委派父智能体的会话 ID |
| `child_role` | `str \| None` | 子智能体上设置的编排器角色标签（如果未启用该功能则为 `None`） |
| `child_summary` | `str \| None` | 子智能体返回给父智能体的最终响应 |
| `child_status` | `str` | `"completed"`、`"failed"`、`"interrupted"` 或 `"error"` |
| `duration_ms` | `int` | 运行子智能体的挂钟时间，以毫秒为单位 |

**触发时机：** 在 `tools/delegate_tool.py` 中，`ThreadPoolExecutor.as_completed()` 排空所有子未来之后。触发被编排到父线程上，因此钩子作者无需考虑并发回调执行。

**返回值：** 被忽略。

**使用场景：** 记录编排活动、累计子智能体持续时间用于计费、编写委派后审计记录。

**示例——记录编排器活动：**

```python
import logging
logger = logging.getLogger(__name__)

def log_subagent(parent_session_id, child_role, child_status, duration_ms, **kwargs):
    logger.info(
        "SUBAGENT parent=%s role=%s status=%s duration_ms=%d",
        parent_session_id, child_role, child_status, duration_ms,
    )

def register(ctx):
    ctx.register_hook("subagent_stop", log_subagent)
```

:::info
With heavy delegation (e.g. orchestrator roles × 5 leaves × nested depth), `subagent_stop` fires many times per turn. Keep your callback fast; push expensive work to a background queue.
:::

---

### `pre_gateway_dispatch`

Fires **once per incoming `MessageEvent`** in the gateway, after the internal-event guard but **before** auth/pairing and agent dispatch. This is the interception point for gateway-level message-flow policies (listen-only windows, human handover, per-chat routing, etc.) that don't fit cleanly into any single platform adapter.

**Callback signature:**

```python
def my_callback(event, gateway, session_store, **kwargs):
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `MessageEvent` | The normalized inbound message (has `.text`, `.source`, `.message_id`, `.internal`, etc.). |
| `gateway` | `GatewayRunner` | The active gateway runner, so plugins can call `gateway.adapters[platform].send(...)` for side-channel replies (owner notifications, etc.). |
| `session_store` | `SessionStore` | For silent transcript ingestion via `session_store.append_to_transcript(...)`. |

**Fires:** In `gateway/run.py`, inside `GatewayRunner._handle_message()`, immediately after `is_internal` is computed. **Internal events skip the hook entirely** (they are system-generated — background-process completions, etc. — and must not be gate-kept by user-facing policy).

**Return value:** `None` or a dict. The first recognized action dict wins; remaining plugin results are ignored. Exceptions in plugin callbacks are caught and logged; the gateway always falls through to normal dispatch on error.

| Return | Effect |
|--------|--------|
| `{"action": "skip", "reason": "..."}` | Drop the message — no agent reply, no pairing flow, no auth. Plugin is assumed to have handled it (e.g. silent-ingested into the transcript). |
| `{"action": "rewrite", "text": "new text"}` | Replace `event.text`, then continue normal dispatch with the modified event. Useful for collapsing buffered ambient messages into a single prompt. |
| `{"action": "allow"}` / `None` | Normal dispatch — runs the full auth / pairing / agent-loop chain. |

**Use cases:** Listen-only group chats (only respond when tagged; buffer ambient messages into context); human handover (silent-ingest customer messages while owner handles the chat manually); per-profile rate limiting; policy-driven routing.

**Example — drop unauthorized DMs silently without triggering the pairing code:**

```python
def deny_unauthorized_dms(event, **kwargs):
    src = event.source
    if src.chat_type == "dm" and not _is_approved_user(src.user_id):
        return {"action": "skip", "reason": "unauthorized-dm"}
    return None

def register(ctx):
    ctx.register_hook("pre_gateway_dispatch", deny_unauthorized_dms)
```

**Example — rewrite an ambient-message buffer into a single prompt on mention:**

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

Fires **immediately before** an approval request is shown to the user — covers every surface: interactive CLI, the Ink TUI, gateway platforms (Telegram, Discord, Slack, WhatsApp, Matrix, etc.), and ACP clients (VS Code, Zed, JetBrains).

This is the right place to wire a custom notifier — for example, a macOS menu-bar app that pops an allow/deny notification, or an audit log that records every approval request with context.

**Callback signature:**

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

| Parameter | Type | Description |
|-----------|------|-------------|
| `command` | `str` | The shell command awaiting approval |
| `description` | `str` | Human-readable reason(s) the command is flagged (combined when multiple patterns match) |
| `pattern_key` | `str` | Primary pattern key that triggered the approval (e.g. `"rm_rf"`, `"sudo"`) |
| `pattern_keys` | `list[str]` | All pattern keys that matched |
| `session_key` | `str` | Session identifier, useful for scoping notifications per-chat |
| `surface` | `str` | `"cli"` for interactive CLI/TUI prompts, `"gateway"` for async platform approvals |

**Return value:** ignored. Hooks here are observer-only; they cannot veto or pre-answer the approval. Use [`pre_tool_call`](#pre_tool_call) to block a tool before it reaches the approval system.

**Use cases:** Desktop notifications, push alerts, audit logging, Slack webhooks, escalation routing, metrics.

**Example — desktop notification on macOS:**

```python
import subprocess

def notify_approval(command, description, session_key, **kwargs):
    title = "Hermes needs approval"
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

Fires **after** the user responds to an approval prompt (or the prompt times out).

**Callback signature:**

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

Same kwargs as `pre_approval_request`, plus:

| Parameter | Type | Description |
|-----------|------|-------------|
| `choice` | `str` | One of `"once"`, `"session"`, `"always"`, `"deny"`, or `"timeout"` |

**Return value:** ignored.

**Use cases:** Close the matching desktop notification, record the final decision in an audit log, update metrics, roll forward a rate limiter.

```python
def log_decision(command, choice, session_key, **kwargs):
    logger.info("approval %s: %s for session %s", choice, command[:60], session_key)

def register(ctx):
    ctx.register_hook("post_approval_response", log_decision)
```

---

### `transform_tool_result`

Fires **after** a tool returns and **before** the result is appended to the conversation. Lets a plugin rewrite ANY tool's result string — not just terminal output — before the model sees it.

**Callback signature:**

```python
def my_callback(
    tool_name: str,
    arguments: dict,
    result: str,
    task_id: str | None,
    **kwargs,
) -> str | None:
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `tool_name` | `str` | Tool that produced the result (`read_file`, `web_extract`, `delegate_task`, …). |
| `arguments` | `dict` | Arguments the model called the tool with. |
| `result` | `str` | The tool's raw result string, post-truncation and post-ANSI-strip. |
| `task_id` | `str \| None` | Task/session ID when running inside RL/benchmark environments. |

**Return value:** `str` to replace the result (the returned string is what the model sees), `None` to leave it unchanged.

**Use cases:** Redact organization-specific PII from `web_extract` output, wrap long JSON tool responses in a summary header, inject retrieval-augmented hints into `read_file` results, rewrite `delegate_task` subagent reports into a project-specific schema.

```python
import re
SECRET = re.compile(r"sk-[A-Za-z0-9]{32,}")

def redact_secrets(tool_name, result, **kwargs):
    if SECRET.search(result):
        return SECRET.sub("[REDACTED]", result)
    return None

def register(ctx):
    ctx.register_hook("transform_tool_result", redact_secrets)
```

Applies to every tool. For terminal-only rewriting see `transform_terminal_output` below — it's narrower and runs earlier in the pipeline (pre-truncation, pre-redaction).

---

### `transform_terminal_output`

Fires inside the `terminal` tool's foreground-output pipeline, **before** the default 50 KB truncation, ANSI strip, and secret redaction. Lets plugins rewrite the raw stdout/stderr of a shell command before any downstream processing touches it.

**Callback signature:**

```python
def my_callback(
    command: str,
    output: str,
    exit_code: int,
    cwd: str,
    task_id: str | None,
    **kwargs,
) -> str | None:
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `command` | `str` | The shell command that produced the output. |
| `output` | `str` | Raw combined stdout/stderr (may be very large — truncation happens after the hook). |
| `exit_code` | `int` | Process exit code. |
| `cwd` | `str` | Working directory the command ran in. |

**Return value:** `str` to replace the output, `None` to leave it unchanged.

**Use cases:** Inject summaries for commands that produce massive output (`du -ah`, `find`, `tree`), tag output with a project-specific marker so downstream hooks know how to handle it, strip timing noise that flaps between runs and defeats prompt caching.

```python
def summarize_find(command, output, **kwargs):
    if command.startswith("find ") and len(output) > 50_000:
        lines = output.count("\n")
        head = "\n".join(output.splitlines()[:40])
        return f"{head}\n\n[summary: {lines} paths total, showing first 40]"
    return None

def register(ctx):
    ctx.register_hook("transform_terminal_output", summarize_find)
```

Pairs well with `transform_tool_result` (which covers every other tool).

---

### `transform_llm_output`

Fires **once per turn** after the tool-calling loop completes and the model has produced a final response, **before** that response is delivered to the user (CLI, gateway, or programmatic caller). Lets a plugin rewrite the assistant's final text using classical-programming methods — no extra inference tokens burned on SOUL flavor text or a skill-driven transform.

**Callback signature:**

```python
def my_callback(
    response_text: str,
    session_id: str,
    model: str,
    platform: str,
    **kwargs,
) -> str | None:
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `response_text` | `str` | The assistant's final response text for this turn. |
| `session_id` | `str` | Session ID for this conversation (may be empty for one-shot runs). |
| `model` | `str` | Model name that produced the response (e.g. `anthropic/claude-sonnet-4.6`). |
| `platform` | `str` | Delivery platform (`cli`, `telegram`, `discord`, …; empty when unset). |

**Return value:** Non-empty `str` to replace the response text, `None` or empty string to leave it unchanged. **First non-empty string wins** when multiple plugins register — mirroring `transform_tool_result`.

**Use cases:** Apply a personality/vocabulary transform (pirate-speak, Spongebob), redact user-specific identifiers from the final text, append a project-specific signature footer, enforce a house style guide without burning tokens on SOUL instructions.

```python
import os, re

def spongebob(response_text, **kwargs):
    if os.environ.get("SPONGEBOB_MODE") != "on":
        return None  # pass through unchanged
    return re.sub(r"!", "!! Tartar sauce!", response_text)

def register(ctx):
    ctx.register_hook("transform_llm_output", spongebob)
```

该钩子仅在非空、未被中断的响应上触发——它不会在停止按钮中断或空轮次时触发。异常会作为警告记录，不会中断智能体执行。

---
## Shell 钩子

在你的 `cli-config.yaml` 中声明 shell 脚本钩子，Hermes 将在相应的插件钩子事件触发时将其作为子进程运行——在 CLI 和网关会话中均适用。无需编写 Python 插件。

当你希望用一个即插即用的单文件脚本（Bash、Python、任何带有 shebang 的脚本）来执行以下操作时，使用 shell 钩子：

- **阻止工具调用**——拒绝危险的 `terminal` 命令、强制执行基于目录的策略、要求对破坏性的 `write_file` / `patch` 操作进行审批。
- **在工具调用之后运行**——自动格式化智能体刚刚写入的 Python 或 TypeScript 文件、记录 API 调用、触发 CI 工作流。
- **向下一轮 LLM 注入上下文**——将 `git status` 输出、当前星期或检索到的文档前置到用户消息中（参见 [`pre_llm_call`](#pre_llm_call)）。
- **观察生命周期事件**——在子智能体完成时（`subagent_stop`）或会话开始时（`on_session_start`）写入日志行。

Shell 钩子通过在 CLI 启动（`hermes_cli/main.py`）和网关启动（`gateway/run.py`）时调用 `agent.shell_hooks.register_from_config(cfg)` 来注册。它们与 Python 插件钩子自然协作——两者都通过同一个调度器流转。

### 快速对比

| 维度 | Shell 钩子 | [插件钩子](#plugin-hooks) | [网关钩子](#gateway-event-hooks) |
|------|-----------|-------------------------------|---------------------------------------|
| 声明位置 | `~/.hermes/config.yaml` 中的 `hooks:` 块 | `plugin.yaml` 插件中的 `register()` | `HOOK.yaml` + `handler.py` 目录 |
| 存放路径 | `~/.hermes/agent-hooks/`（约定） | `~/.hermes/plugins/<name>/` | `~/.hermes/hooks/<name>/` |
| 语言 | 任意（Bash、Python、Go 二进制等） | 仅 Python | 仅 Python |
| 运行于 | CLI + 网关 | CLI + 网关 | 仅网关 |
| 事件 | `VALID_HOOKS`（包括 `subagent_stop`） | `VALID_HOOKS` | 网关生命周期（`gateway:startup`、`agent:*`、`command:*`） |
| 可阻止工具调用 | 是（`pre_tool_call`） | 是（`pre_tool_call`） | 否 |
| 可注入 LLM 上下文 | 是（`pre_llm_call`） | 是（`pre_llm_call`） | 否 |
| 同意机制 | 每个 `(event, command)` 对首次使用时提示 | 隐式（Python 插件信任） | 隐式（目录信任） |
| 进程间隔离 | 是（子进程） | 否（进程内） | 否（进程内） |

### 配置模式

```yaml
hooks:
  <event_name>:                  # 必须是 VALID_HOOKS 中的值
    - matcher: "<regex>"         # 可选；仅用于 pre/post_tool_call
      command: "<shell command>" # 必需；通过 shlex.split 运行，shell=False
      timeout: <seconds>         # 可选；默认 60，上限 300

hooks_auto_accept: false         # 见下文"同意模型"
```

事件名称必须是[插件钩子事件](#plugin-hooks)之一；拼写错误会产生"你是否是指 X？"的警告并被跳过。单个条目内未知键会被忽略；缺少 `command` 会触发跳过并附带警告。`timeout > 300` 会被限制并附带警告。

### JSON 通信协议

每次事件触发时，Hermes 为每个匹配的钩子（在 matcher 允许的情况下）生成一个子进程，将 JSON 有效载荷通过 **stdin** 传入，并从 **stdout** 读回 JSON。

**stdin — 脚本接收的有效载荷：**

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

对于非工具事件（`pre_llm_call`、`subagent_stop`、会话生命周期），`tool_name` 和 `tool_input` 为 `null`。`extra` 字典携带所有事件特定的关键字参数（`user_message`、`conversation_history`、`child_role`、`duration_ms` 等）。无法序列化的值会被转为字符串而非丢弃。

**stdout — 可选响应：**

```jsonc
// 阻止 pre_tool_call（两种格式均被接受；内部标准化）：
{"decision": "block", "reason":  "Forbidden: rm -rf"}   // Claude Code 风格
{"action":   "block", "message": "Forbidden: rm -rf"}   // Hermes 标准风格

// 为 pre_llm_call 注入上下文：
{"context": "Today is Friday, 2026-04-17"}

// 静默无操作——任何空输出或匹配的输出均可：
```

格式错误的 JSON、非零退出码和超时仅记录警告，永远不会中断智能体循环。

### 完整示例

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

智能体在上下文中对该文件的视图**不会**被自动重新读取——重新格式化仅影响磁盘上的文件。后续的 `read_file` 调用会获取格式化后的版本。

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

#### 3. 向每一轮注入 `git status`（Claude Code `UserPromptSubmit` 等价物）

```yaml
hooks:
  pre_llm_call:
    - command: "~/.hermes/agent-hooks/inject-cwd-context.sh"
```

```bash
#!/usr/bin/env bash
# ~/.hermes/agent-hooks/inject-cwd-context.sh
cat - >/dev/null   # 丢弃 stdin 有效载荷
if status=$(git status --porcelain 2>/dev/null) && [[ -n "$status" ]]; then
  jq --null-input --arg s "$status" \
     '{context: ("Uncommitted changes in cwd:\n" + $s)}'
else
  printf '{}\n'
fi
```

Claude Code 的 `UserPromptSubmit` 事件在 Hermes 中故意不作为单独的事件存在——`pre_llm_call` 在相同的位置触发，并且已经支持上下文注入。请在此处使用它。

#### 4. 记录每个子智能体的完成

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

### 同意模型

每个唯一的 `(event, command)` 对在 Hermes 首次遇到时会提示用户审批，然后将决定持久化到 `~/.hermes/shell-hooks-allowlist.json`。后续运行（CLI 或网关）将跳过提示。

三种方式可以绕过交互式提示——满足其一即可：

1. CLI 上的 `--accept-hooks` 标志（例如 `hermes --accept-hooks chat`）
2. `HERMES_ACCEPT_HOOKS=1` 环境变量
3. `cli-config.yaml` 中的 `hooks_auto_accept: true`

非 TTY 运行（网关、cron、CI）需要这三种之一——否则任何新添加的钩子将静默地保持未注册状态并记录警告。

**脚本编辑被静默信任。** 白名单以精确的命令字符串为键，而非脚本的哈希值，因此编辑磁盘上的脚本不会使同意失效。`hermes hooks doctor` 会标记 mtime 漂移，以便你可以发现编辑并决定是否重新审批。

#### 手动白名单

手动白名单适用于操作员无法交互式回答首次使用提示的非 TTY 或服务账户部署场景。白名单文件为 `~/.hermes/shell-hooks-allowlist.json`，预期格式为 `approvals` 数组。每个审批记录钩子的 `event` 和精确的 `command` 字符串：

```json
{
  "approvals": [
    {
      "event": "post_llm_call",
      "command": "/home/hermes/.hermes/hooks/my-hook.py"
    }
  ]
}
```

命令字符串必须与配置的钩子命令完全匹配。以路径为键且带有 `sha256` 字段的对象不是预期格式，不会批准该钩子。使用 `hermes hooks list` 验证手动条目。

### `hermes hooks` CLI

| 命令 | 功能 |
|---------|--------------|
| `hermes hooks list` | 输出已配置的钩子及其 matcher、超时和同意状态 |
| `hermes hooks test <event> [--for-tool X] [--payload-file F]` | 针对合成有效载荷触发每个匹配的钩子并打印解析后的响应 |
| `hermes hooks revoke <command>` | 删除所有匹配 `<command>` 的白名单条目（下次重启生效） |
| `hermes hooks doctor` | 对每个已配置的钩子：检查执行权限、白名单状态、mtime 漂移、JSON 输出有效性和大致执行时间 |

### 安全性

Shell 钩子以**你的完整用户凭证**运行——与 cron 条目或 shell 别名处于相同信任边界。将 `config.yaml` 中的 `hooks:` 块视为特权配置：

- 仅引用你编写或完全审查过的脚本。
- 将脚本保持在 `~/.hermes/agent-hooks/` 内，以便路径易于审计。
- 在拉取共享配置后重新运行 `hermes hooks doctor`，在钩子注册之前发现新添加的钩子。
- 如果你的 config.yaml 在团队间进行版本控制，请像审查 CI 配置一样审查更改 `hooks:` 部分的 PR。

### 顺序与优先级

Python 插件钩子和 shell 钩子都流经同一个 `invoke_hook()` 调度器。Python 插件先注册（`discover_and_load()`），shell 钩子后注册（`register_from_config()`），因此在平局情况下 Python `pre_tool_call` 阻止决定具有优先权。第一个有效的阻止生效——聚合器在任何回调产生带有非空消息的 `{"action": "block", "message": str}` 时立即返回。