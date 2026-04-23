---
sidebar_position: 6
title: "事件钩子"
description: "在关键生命周期节点运行自定义代码 —— 记录活动、发送警报、发布到 Webhook"
---

# 事件钩子

Hermes 拥有三个钩子系统，可在关键生命周期节点运行自定义代码：

| 系统 | 注册方式 | 运行位置 | 用例 |
|--------|---------------|---------|----------|
| **[网关钩子](#gateway-event-hooks)** | `~/.hermes/hooks/` 下的 `HOOK.yaml` + `handler.py` | 仅网关 | 日志记录、警报、Webhook |
| **[插件钩子](#plugin-hooks)** | [插件](/docs/user-guide/features/plugins) 中的 `ctx.register_hook()` | CLI + 网关 | 工具拦截、指标、防护栏 |
| **[Shell 钩子](#shell-hooks)** | `~/.hermes/config.yaml` 中的 `hooks:` 块指向 Shell 脚本 | CLI + 网关 | 阻塞、自动格式化、上下文注入的即插即用脚本 |

这三个系统都是非阻塞的 —— 任何钩子中的错误都会被捕捉并记录，永远不会导致智能体崩溃。

## 网关事件钩子

网关钩子在网关操作期间（Telegram、Discord、Slack、WhatsApp）自动触发，不会阻塞主智能体管道。

### 创建钩子

每个钩子都是 `~/.hermes/hooks/` 下的一个目录，包含两个文件：

```text
~/.hermes/hooks/
└── my-hook/
    ├── HOOK.yaml      # 声明要监听的事件
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

`events` 列表决定了哪些事件会触发你的处理函数。你可以订阅任何事件的组合，包括通配符如 `command:*`。

#### handler.py

```python
import json
from datetime import datetime
from pathlib import Path

LOG_FILE = Path.home() / ".hermes" / "hooks" / "my-hook" / "activity.log"

async def handle(event_type: str, context: dict):
    """对每个订阅的事件调用。必须命名为 'handle'。"""
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
- 可以是 `async def` 或普通 `def` —— 两者都有效
- 错误会被捕捉并记录，永远不会导致智能体崩溃

### 可用事件

| 事件 | 触发时机 | 上下文键 |
|-------|---------------|--------------|
| `gateway:startup` | 网关进程启动时 | `platforms`（活动平台名称列表） |
| `session:start` | 创建新的消息会话时 | `platform`, `user_id`, `session_id`, `session_key` |
| `session:end` | 会话结束（重置前） | `platform`, `user_id`, `session_key` |
| `session:reset` | 用户运行 `/new` 或 `/reset` 时 | `platform`, `user_id`, `session_key` |
| `agent:start` | 智能体开始处理消息时 | `platform`, `user_id`, `session_id`, `message` |
| `agent:step` | 工具调用循环的每次迭代 | `platform`, `user_id`, `session_id`, `iteration`, `tool_names` |
| `agent:end` | 智能体完成处理时 | `platform`, `user_id`, `session_id`, `message`, `response` |
| `command:*` | 执行任何斜杠命令时 | `platform`, `user_id`, `command`, `args` |

#### 通配符匹配

注册为 `command:*` 的处理函数会对任何 `command:` 事件触发（`command:model`、`command:reset` 等）。使用单个订阅监控所有斜杠命令。

### 示例

#### 启动清单 (BOOT.md) — 内置

网关附带一个内置的 `boot-md` 钩子，每次启动时查找 `~/.hermes/BOOT.md`。如果文件存在，智能体会在后台会话中运行其指令。无需安装 —— 只需创建文件。

**创建 `~/.hermes/BOOT.md`：**

```markdown
# 启动检查清单

1. 检查是否有任何 cron 作业在前夜失败 —— 运行 `hermes cron list`
2. 向 Discord #general 发送消息说 "网关已重启，所有系统正常"
3. 检查 /opt/app/deploy.log 在过去 24 小时内是否有任何错误
```

智能体会在后台线程中运行这些指令，因此不会阻塞网关启动。如果没有需要关注的内容，智能体会回复 `[SILENT]` 且不会发送任何消息。

:::tip
没有 BOOT.md？钩子会静默跳过 —— 零开销。需要启动自动化时创建文件，不需要时删除它。
:::

#### 长时间任务 Telegram 警报

当智能体运行时间超过 10 步时给自己发送消息：

```yaml
# ~/.hermes/hooks/long-task-alert/HOOK.yaml
name: long-task-alert
description: 当智能体需要很多步骤时发出警报
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

跟踪使用了哪些斜杠命令：

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

#### 会话开始 Webhook

新会话时 POST 到外部服务：

```yaml
# ~/.hermes/hooks/session-webhook/HOOK.yaml
name: session-webhook
description: 在新会话时通知外部服务
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

### 工作原理

1. 网关启动时，`HookRegistry.discover_and_load()` 扫描 `~/.hermes/hooks/`
2. 每个包含 `HOOK.yaml` + `handler.py` 的子目录都会被动态加载
3. 处理函数为其声明的事件注册
4. 在每个生命周期点，`hooks.emit()` 触发所有匹配的处理函数
5. 任何处理函数中的错误都会被捕捉并记录 —— 损坏的钩子永远不会导致智能体崩溃

:::info
网关钩子仅在 **网关**（Telegram、Discord、Slack、WhatsApp）中触发。CLI 不加载网关钩子。要在所有地方使用钩子，请使用 [插件钩子](#plugin-hooks)。
:::

## 插件钩子

[插件](/docs/user-guide/features/plugins) 可以注册在 **CLI 和网关** 会话中触发的钩子。这些通过在你的插件的 `register()` 函数中编程式地调用 `ctx.register_hook()` 来注册。

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

- 回调函数接收 **关键字参数**。始终接受 `**kwargs` 以保持向前兼容性 —— 未来版本可能会在不破坏你的插件的情况下添加新参数。
- 如果回调函数 **崩溃**，它会被记录并跳过。其他钩子和智能体继续正常运行。行为不当的插件永远无法破坏智能体。
- 两个钩子的返回值会影响行为：[`pre_tool_call`](#pre_tool_call) 可以 **阻止** 工具，而 [`pre_llm_call`](#pre_llm_call) 可以向 LLM 调用 **注入上下文**。所有其他钩子都是即发即忘的观察者。

### 快速参考

| 钩子 | 触发时机 | 返回值 |
|------|-----------|---------|
| [`pre_tool_call`](#pre_tool_call) | 任何工具执行前 | `{"action": "block", "message": str}` 否决调用 |
| [`post_tool_call`](#post_tool_call) | 任何工具返回后 | 忽略 |
| [`pre_llm_call`](#pre_llm_call) | 每回合一次，在工具调用循环前 | `{"context": str}` 将上下文附加到用户消息 |
| [`post_llm_call`](#post_llm_call) | 每回合一次，在工具调用循环后 | 忽略 |
| [`on_session_start`](#on_session_start) | 创建新会话时（仅第一回合） | 忽略 |
| [`on_session_end`](#on_session_end) | 会话结束时 | 忽略 |
| [`on_session_finalize`](#on_session_finalize) | CLI/网关关闭活跃会话时（刷新、保存、统计） | 忽略 |
| [`on_session_reset`](#on_session_reset) | 网关交换新会话密钥时（例如 `/new`、`/reset`） | 忽略 |
| [`subagent_stop`](#subagent_stop) | `delegate_task` 子进程退出时 | 忽略 |

---

### `pre_tool_call`

在每个工具执行 **之前** 立即触发 —— 内置工具和插件工具都会触发。

**回调签名：**

```python
def my_callback(tool_name: str, args: dict, task_id: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `tool_name` | `str` | 即将执行的工具名称（例如 `"terminal"`、`"web_search"`、`"read_file"`） |
| `args` | `dict` | 模型传递给工具的参数 |
| `task_id` | `str` | 会话/任务标识符。未设置时为空字符串。 |

**触发时机：** 在 `model_tools.py` 的 `handle_function_call()` 内部，在工具的处理函数运行之前。每次工具调用触发一次 —— 如果模型并行调用 3 个工具，此函数会触发 3 次。

**返回值 —— 否决调用：**

```python
return {"action": "block", "message": "阻止工具调用的原因"}
```

智能体用 `message` 作为错误返回给模型，短路工具调用。第一个匹配的阻止指令获胜（Python 插件先注册，然后是 shell 钩子）。任何其他返回值都被忽略，因此现有的仅观察者回调继续正常工作不变。

**用例：** 日志记录、审计跟踪、工具调用计数器、阻止危险操作、速率限制、按用户策略执行。

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
        print(f"⚠ 正在执行潜在危险工具：{tool_name}")

def register(ctx):
    ctx.register_hook("pre_tool_call", warn_dangerous)
```

---

### `post_tool_call`

在每个工具执行 **之后** 立即触发。

**回调签名：**

```python
def my_callback(tool_name: str, args: dict, result: str, task_id: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `tool_name` | `str` | 刚执行的工具名称 |
| `args` | `dict` | 模型传递给工具的参数 |
| `result` | `str` | 工具的返回值（始终是 JSON 字符串） |
| `task_id` | `str` | 会话/任务标识符。未设置时为空字符串。 |

**触发时机：** 在 `model_tools.py` 的 `handle_function_call()` 内部，在工具的处理函数返回之后。每次工具调用触发一次。如果工具抛出未处理的异常，则不会触发（错误被捕获并以错误 JSON 字符串返回，`post_tool_call` 以该错误字符串作为 `result` 触发）。

**返回值：** 忽略。

**用例：** 记录工具结果、指标收集、跟踪工具成功/失败率、在特定工具完成时发送通知。

**示例 —— 跟踪工具使用指标：**

```python
from collections import Counter
import json

_tool_counts = Counter()
_error_counts = Counter()

def track_metrics(tool_name, result, **kwargs):
    _tool_counts[tool_name] += 1
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

**每回合一次**，在工具调用循环开始前触发。这是 **唯一返回值被使用的钩子** —— 它可以将上下文注入当前回合的用户消息。

**回调签名：**

```python
def my_callback(session_id: str, user_message: str, conversation_history: list,
                is_first_turn: bool, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 当前会话的唯一标识符 |
| `user_message` | `str` | 此回合用户的原始消息（在任何技能注入之前） |
| `conversation_history` | `list` | 完整消息列表的副本（OpenAI 格式：`[{"role": "user", "content": "..."}]`） |
| `is_first_turn` | `bool` | 如果是新会话的第一回合则为 `True`，后续回合为 `False` |
| `model` | `str` | 模型标识符（例如 `"anthropic/claude-sonnet-4.6"`） |
| `platform` | `str` | 会话运行的位置：`"cli"`、`"telegram"`、`"discord"` 等 |

**触发时机：** 在 `run_agent.py` 的 `run_conversation()` 内部，在上下文压缩之后但在主 `while` 循环之前。每调用一次 `run_conversation()`（即每用户回合）触发一次，而不是在工具循环内的每次 API 调用。

**返回值：** 如果回调返回带有 `"context"` 键的字典，或普通非空字符串，文本将被附加到此回合的用户消息。返回 `None` 表示无注入。

```python
# 注入上下文
return {"context": "回忆的记忆：\n- 用户喜欢 Python\n- 正在开发 hermes-agent"}

# 普通字符串（等效）
return "回忆的记忆：\n- 用户喜欢 Python"

# 无注入
return None
```

**上下文注入位置：** 始终是 **用户消息**，而不是系统提示。这保留了提示缓存 —— 系统提示在所有回合中保持相同，因此可以重用缓存的标记。系统提示是 Hermes 的领域（模型指导、工具执行、个性、技能）。插件在与用户输入一起贡献上下文。

所有注入的上下文都是 **暂时的** —— 仅在 API 调用时间添加。对话历史中的原始用户消息从未被修改，会话数据库中也没有任何内容被持久化。

当 **多个插件** 返回上下文时，它们的输出按插件发现顺序（按目录名称字母顺序）用双换行符连接。

**用例：** 记忆回忆、RAG 上下文注入、防护栏、每回合分析。

**示例 —— 记忆回忆：**

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
        text = "回忆的上下文：\n" + "\n".join(f"- {m['text']}" for m in memories)
        return {"context": text}
    except Exception:
        return None

def register(ctx):
    ctx.register_hook("pre_llm_call", recall)
```

**示例 —— 防护栏：**

```python
POLICY = "绝不在没有明确用户确认的情况下执行删除文件的命令。"

def guardrails(**kwargs):
    return {"context": POLICY}

def register(ctx):
    ctx.register_hook("pre_llm_call", guardrails)
```

---

### `post_llm_call`

**每回合一次**，在工具调用循环完成且智能体产生最终响应后触发。仅在 **成功** 的回合触发 —— 如果回合被中断则不会触发。

**回调签名：**

```python
def my_callback(session_id: str, user_message: str, assistant_response: str,
                conversation_history: list, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 当前会话的唯一标识符 |
| `user_message` | `str` | 此回合用户的原始消息 |
| `assistant_response` | `str` | 此回合智能体的最终文本响应 |
| `conversation_history` | `list` | 回合完成后完整消息列表的副本 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的位置 |

**触发时机：** 在 `run_agent.py` 的 `run_conversation()` 内部，在工具循环退出并产生最终响应后。由 `if final_response and not interrupted` 保护 —— 因此当用户在回合中途中断或智能体在未产生响应的情况下达到迭代限制时，它 **不会** 触发。

**返回值：** 忽略。

**用例：** 将对话数据同步到外部记忆系统、计算响应质量指标、记录回合摘要、触发后续操作。

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

**示例 —— 跟踪响应长度：**

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

**一次** 在新会话创建时触发。在会话继续时（用户在现有会话中发送第二条消息）**不会** 触发。

**回调签名：**

```python
def my_callback(session_id: str, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 新会话的唯一标识符 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的位置 |

**触发时机：** 在 `run_agent.py` 的 `run_conversation()` 内部，新会话的第一回合期间 —— 具体是在构建系统提示之后但在工具循环开始之前。检查是 `if not conversation_history`（无先前消息 = 新会话）。

**返回值：** 忽略。

**用例：** 初始化会话范围状态、预热缓存、将会话注册到外部服务、记录会话开始。

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

在每个 `run_conversation()` 调用的 **最后** 触发，无论结果如何。如果用户在处理中途退出，CLI 的退出处理程序也会触发。

**回调签名：**

```python
def my_callback(session_id: str, completed: bool, interrupted: bool,
                model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 会话的唯一标识符 |
| `completed` | `bool` | 如果智能体产生了最终响应则为 `True`，否则为 `False` |
| `interrupted` | `bool` | 如果回合被中断（用户发送新消息、`/stop` 或退出）则为 `True` |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的位置 |

**触发时机：** 在两个位置：
1. **`run_agent.py`** —— 在每个 `run_conversation()` 调用的末尾，在所有清理之后。总是触发，即使回合出错。
2. **`cli.py`** —— 在 CLI 的 atexit 处理程序中，但 **仅当** 用户在退出时智能体正在处理中间回合（`_agent_running=True`）。这会捕获 Ctrl+C 和 `/exit` 在处理期间。在这种情况下，`completed=False` 且 `interrupted=True`。

**返回值：** 忽略。

**用例：** 刷新缓冲区、关闭连接、持久化会话状态、记录会话持续时间、清理在 `on_session_start` 中初始化的资源。

**示例 —— 刷新和清理：**

```python
_session_caches = {}

def cleanup_session(session_id, completed, interrupted, **kwargs):
    cache = _session_caches.pop(session_id, None)
    if cache:
        # 将累积的数据刷新到磁盘或外部服务
        status = "completed" if completed else ("interrupted" if interrupted else "failed")
        print(f"会话 {session_id} 结束：{status}，{cache['tool_calls']} 次工具调用")

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

当 CLI 或网关 **关闭** 活跃会话时触发 —— 例如，用户运行 `/new`、网关 GC 了一个空闲会话，或 CLI 退出了活跃的智能体。这是在传出会话的身份消失之前的最后一次机会来刷新与该会话绑定的状态。

**回调签名：**

```python
def my_callback(session_id: str | None, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` 或 `None` | 传出会话 ID。可能为 `None` 如果没有活跃会话存在。 |
| `platform` | `str` | `"cli"` 或消息平台名称（`"telegram"`、`"discord"` 等）。 |

**触发时机：** 在 `cli.py`（`/new` / CLI 退出）和 `gateway/run.py`（会话重置或被 GC 时）。在网关端总是与 `on_session_reset` 配对。

**返回值：** 忽略。

**用例：** 在会话 ID 被丢弃之前持久化最终会话指标、关闭会话范围资源、发出最终遥测事件、排空队列写入。

---

### `on_session_reset`

当网关 **为新会话密钥** 交换活跃聊天的会话密钥时触发 —— 用户调用了 `/new`、`/reset`、`/clear`，或适配器在空闲窗口后选择了新会话。这让插件可以在等待下一个 `on_session_start` 之前对对话状态已被清空的事实做出反应。

**回调签名：**

```python
def my_callback(session_id: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 新会话的 ID（已旋转到新值）。 |
| `platform` | `str` | 消息平台名称。 |

**触发时机：** 在 `gateway/run.py` 中，在新会话密钥分配之后但在下一个传入消息处理之前。在网关上，顺序是：`on_session_finalize(old_id)` → 交换 → `on_session_reset(new_id)` → 第一个传入回合的 `on_session_start(new_id)`。

**返回值：** 忽略。

**用例：** 重置以 `session_id` 为键的会话范围缓存、发出 "会话轮换" 分析、预热新鲜状态存储桶。

---

有关完整演练，包括工具模式、处理程序和高级钩子模式的详细信息，请参见 **[构建插件指南](/docs/guides/build-a-hermes-plugin)**。

---

### `subagent_stop`

在 `delegate_task` 完成后 **每个子智能体** 触发一次。无论你委派了单个任务还是三个任务的批次，此钩子都会为每个子进程触发一次，并在父线程上序列化。

**回调签名：**

```python
def my_callback(parent_session_id: str, child_role: str | None,
                child_summary: str | None, child_status: str,
                duration_ms: int, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `parent_session_id` | `str` | 委派父智能体的会话 ID |
| `child_role` | `str \| None` | 子进程上的编排角色标签（如果功能未启用则为 `None`） |
| `child_summary` | `str \| None` | 子进程返回给父进程的最终响应 |
| `child_status` | `str` | `"completed"`、`"failed"`、`"interrupted"` 或 `"error"` |
| `duration_ms` | `int` | 运行子进程花费的墙上时钟时间，以毫秒为单位 |

**触发时机：** 在 `tools/delegate_tool.py` 中，在 `ThreadPoolExecutor.as_completed()` 耗尽所有子进程 futures 之后。触发被编组到父线程，因此钩子作者不必考虑并发回调执行。

**返回值：** 忽略。

**用例：** 记录编排活动、累计子进程持续时间用于计费、写入委派后审核记录。

**示例 —— 记录编排器活动：**

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
在大量委派（例如编排器角色 × 5 叶节点 × 嵌套深度）的情况下，`subagent_stop` 每回合会触发多次。保持你的回调快速；将繁重的工作推送到后台队列。
:::

---

## Shell 钩子

在 `cli-config.yaml` 中声明 shell 脚本钩子，Hermes 会在相应的插件钩子事件触发时在 CLI 和网关会话中将其作为子进程运行 —— 无需 Python 插件编写。

当你想要一个即插即用的单文件脚本（Bash、Python 或任何有 shebang 的程序）时，使用 shell 钩子：

- **阻止工具调用** —— 拒绝危险的 `terminal` 命令、强制执行按目录策略、需要破坏性 `write_file` / `patch` 操作的批准。
- **在工具调用后运行** —— 自动格式化智能体刚刚编写的 Python 或 TypeScript 文件、记录 API 调用、触发 CI 工作流。
- **将上下文注入下一个 LLM 回合** —— 在用户消息前附加 `git status` 输出、当前星期几或检索到的文档（参见 [`pre_llm_call`](#pre_llm_call)）。
- **观察生命周期事件** —— 在子智能体完成（`subagent_stop`）或会话开始（`on_session_start`）时写入日志行。

Shell 钩子在 CLI 启动（`hermes_cli/main.py`）和网关启动（`gateway/run.py`）时通过调用 `agent.shell_hooks.register_from_config(cfg)` 注册。它们自然地与 Python 插件钩子组合 —— 两者都通过同一个调度程序流动。

### 快速比较

| 维度 | Shell 钩子 | [插件钩子](#plugin-hooks) | [网关钩子](#gateway-event-hooks) |
|-----------|-------------|-------------------------------|---------------------------------------|
| 声明位置 | `~/.hermes/config.yaml` 中的 `hooks:` 块 | `plugin.yaml` 插件中的 `register()` | `HOOK.yaml` + `handler.py` 目录 |
| 位于 | `~/.hermes/agent-hooks/`（约定） | `~/.hermes/plugins/<name>/` | `~/.hermes/hooks/<name>/` |
| 语言 | 任何（Bash、Python、Go 二进制文件...） | 仅 Python | 仅 Python |
| 运行位置 | CLI + 网关 | CLI + 网关 | 仅网关 |
| 事件 | `VALID_HOOKS`（包括 `subagent_stop`） | `VALID_HOOKS` | 网关生命周期（`gateway:startup`、`agent:*`、`command:*`） |
| 可阻止工具调用 | 是（`pre_tool_call`） | 是（`pre_tool_call`） | 否 |
| 可向 LLM 注入上下文 | 是（`pre_llm_call`） | 是（`pre_llm_call`） | 否 |
| 同意 | 每个 `(event, command)` 对的首次使用提示 | 隐式（Python 插件信任） | 隐式（目录信任） |
| 进程间隔离 | 是（子进程） | 否（进程中） | 否（进程中） |

### 配置模式

```yaml
hooks:
  <event_name>:                  # 必须在 VALID_HOOKS 中
    - matcher: "<regex>"         # 可选；仅用于 pre/post_tool_call
      command: "<shell command>" # 必需；通过 shlex.split 运行，shell=False
      timeout: <seconds>         # 可选；默认 60，上限为 300

hooks_auto_accept: false         # 参见 "同意模型" 部分
```

事件名称必须是 [插件钩子事件](#plugin-hooks) 之一；拼写错误会产生 "Did you mean X?" 警告并被跳过。单个条目中未知的关键字被忽略；缺少 `command` 会跳过并显示警告。`timeout > 300` 会被警告并截断。

### JSON 通信协议

每次事件触发时，Hermes 会为每个匹配的钩子（允许匹配器）启动一个子进程，通过 **stdin** 管道传输 JSON 负载，并从 **stdout** 读取 JSON 作为响应。

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

对于非工具事件（`pre_llm_call`、`subagent_stop`、会话生命周期），`tool_name` 和 `tool_input` 为 `null`。`extra` 字典携带所有事件特定的 kwargs（`user_message`、`conversation_history`、`child_role`、`duration_ms` 等）。不可序列化的值会被字符串化而不是省略。

**stdout —— 可选响应：**

```jsonc
// 阻止 pre_tool_call（两种格式都可接受；内部标准化）：
{"decision": "block", "reason":  "Forbidden: rm -rf"}   // Claude-Code 风格
{"action":   "block", "message": "Forbidden: rm -rf"}   // Hermes-标准

// 为 pre_llm_call 注入上下文：
{"context": "今天是星期五，2026-04-17"}

// 静默无操作 —— 任何空/不匹配的输出都可以：
```

格式错误的 JSON、非零退出代码和超时会话会记录警告，但绝不会中止智能体循环。

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

智能体的上下文视图中的文件 **不会** 自动重新读取 —— 重新格式化只影响磁盘上的文件。后续的 `read_file` 调用会获取格式化后的版本。

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

#### 3. 将 `git status` 注入每个回合（Claude-Code 的 `UserPromptSubmit` 等价物）

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

Claude Code 的 `UserPromptSubmit` 事件故意不作为单独的 Hermes 事件 —— `pre_llm_call` 在同一位置触发并支持上下文注入。在这里使用它。

#### 4. 记录每个子智能体完成

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

每个唯一的 `(event, command)` 对首次使用 Hermes 时会提示用户批准，然后将决定持久化到 `~/.hermes/shell-hooks-allowlist.json`。后续运行（CLI 或网关）会跳过提示。

有三个绕过交互式提示的逃生舱口 —— 满足任何一个就足够：

1. CLI 上的 `--accept-hooks` 标志（例如 `hermes --accept-hooks chat`）
2. `HERMES_ACCEPT_HOOKS=1` 环境变量
3. `cli-config.yaml` 中的 `hooks_auto_accept: true`

非 TTY 运行（网关、cron、CI）需要这三个之一 —— 否则任何新添加的钩子会静默保持未注册状态并记录警告。

**脚本编辑被静默信任。** 白名单键基于确切的命令字符串，而不是脚本的哈希值，因此编辑磁盘上的脚本不会使同意失效。`hermes hooks doctor` 会标记 mtime 漂移，让你可以发现编辑并决定是否重新批准。

### `hermes hooks` CLI

| 命令 | 作用 |
|---------|--------------|
| `hermes hooks list` | 转储配置的钩子及其匹配器、超时和同意状态 |
| `hermes hooks test <event> [--for-tool X] [--payload-file F]` | 对合成负载触发每个匹配的钩子并打印解析的响应 |
| `hermes hooks revoke <command>` | 移除与 `<command>` 匹配的每个白名单条目（下次重启时生效） |
| `hermes hooks doctor` | 对每个配置的钩子：检查执行位、白名单状态、mtime 漂移、JSON 输出有效性以及粗略执行时间 |

### 安全

Shell 钩子以 **你的完整用户凭据** 运行 —— 与 cron 条目或 shell 别名相同的信任边界。将 `config.yaml` 中的 `hooks:` 块视为特权配置：

- 只引用你编写或完全审查过的脚本。
- 将脚本保留在 `~/.hermes/agent-hooks/` 中以便于审计路径。
- 拉取共享配置后重新运行 `hermes hooks doctor` 以在注册前发现新添加的钩子。
- 如果你的 config.yaml 在团队间版本控制，请以审查 CI 配置的方式审查更改 `hooks:` 部分的 PR。

### 排序和优先级

Python 插件钩子和 shell 钩子都通过同一个 `invoke_hook()` 调度程序流动。Python 插件首先注册（`discover_and_load()`），shell 钩子其次（`register_from_config()`），因此在平局情况下 Python `pre_tool_call` 阻止决策优先。第一个有效的阻止获胜 —— 聚合器在有任何回调产生 `{"action": "block", "message": str}` 且消息非空时立即返回。