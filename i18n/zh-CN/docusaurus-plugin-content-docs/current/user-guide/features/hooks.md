---
sidebar_position: 6
title: "事件钩子"
description: "在关键生命周期节点运行自定义代码 —— 记录活动、发送警报、发布到 Webhook"
---

# 事件钩子

Hermes 有两个钩子系统，可在关键生命周期节点运行自定义代码：

| 系统 | 注册方式 | 运行位置 | 用例 |
|--------|---------------|---------|----------|
| **[网关钩子](#gateway-event-hooks)** | `~/.hermes/hooks/` 下的 `HOOK.yaml` + `handler.py` | 仅网关 | 日志记录、警报、Webhook |
| **[插件钩子](#plugin-hooks)** | [插件](/docs/user-guide/features/plugins) 中的 `ctx.register_hook()` | CLI + 网关 | 工具拦截、指标、护栏 |

两个系统都是非阻塞的 —— 任何钩子中的错误都会被捕捉并记录，绝不会导致代理崩溃。

## 网关事件钩子

网关钩子在网关操作期间（Telegram、Discord、Slack、WhatsApp）自动触发，不会阻塞主代理管道。

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
description: 将所有代理活动记录到文件
events:
  - agent:start
  - agent:end
  - agent:step
```

`events` 列表决定了哪些事件会触发你的处理函数。你可以订阅任何组合的事件，包括通配符如 `command:*`。

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
- 接收 `event_type` (字符串) 和 `context` (字典)
- 可以是 `async def` 或普通 `def` —— 两者都有效
- 错误会被捕捉并记录，绝不会导致代理崩溃

### 可用事件

| 事件 | 触发时机 | 上下文键 |
|-------|---------------|--------------|
| `gateway:startup` | 网关进程启动时 | `platforms` (活跃平台名称列表) |
| `session:start` | 创建新的消息会话时 | `platform`, `user_id`, `session_id`, `session_key` |
| `session:end` | 会话结束（重置前） | `platform`, `user_id`, `session_key` |
| `session:reset` | 用户运行 `/new` 或 `/reset` 时 | `platform`, `user_id`, `session_key` |
| `agent:start` | 代理开始处理消息时 | `platform`, `user_id`, `session_id`, `message` |
| `agent:step` | 工具调用循环的每次迭代 | `platform`, `user_id`, `session_id`, `iteration`, `tool_names` |
| `agent:end` | 代理完成处理时 | `platform`, `user_id`, `session_id`, `message`, `response` |
| `command:*` | 执行任何斜杠命令时 | `platform`, `user_id`, `command`, `args` |

#### 通配符匹配

注册为 `command:*` 的处理函数会对任何 `command:` 事件触发（如 `command:model`、`command:reset` 等）。只需一次订阅即可监控所有斜杠命令。

### 示例

#### 启动检查清单 (BOOT.md) — 内置功能

网关自带一个内置的 `boot-md` 钩子，每次启动时都会查找 `~/.hermes/BOOT.md` 文件。如果文件存在，代理会在后台会话中执行其指令。无需安装 —— 只需创建该文件。

**创建 `~/.hermes/BOOT.md`:**

```markdown
# 启动检查清单

1. 检查是否有任何定时任务在前一晚失败 —— 运行 `hermes cron list`
2. 向 Discord #general 频道发送消息说 "网关已重启，所有系统正常运行"
3. 检查 /opt/app/deploy.log 在过去 24 小时内是否有任何错误
```

代理会在后台线程中运行这些指令，因此不会阻塞网关启动。如果没有需要关注的事项，代理会回复 `[SILENT]` 且不会发送任何消息。

:::tip
没有 BOOT.md？钩子会静默跳过 —— 零开销。需要启动自动化时创建该文件，不需要时删除它。
:::

#### 长时间任务的 Telegram 警报

当代理执行超过 10 步时给自己发送消息：

```yaml
# ~/.hermes/hooks/long-task-alert/HOOK.yaml
name: long-task-alert
description: 当代理执行多步时发出警报
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
        text = f"⚠️ 代理已运行 {iteration} 步。最后使用的工具：{tools}"
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

### 工作原理

1. 网关启动时，`HookRegistry.discover_and_load()` 扫描 `~/.hermes/hooks/`
2. 每个包含 `HOOK.yaml` + `handler.py` 的子目录都会被动态加载
3. 处理函数为其声明的事件注册
4. 在每个生命周期点，`hooks.emit()` 触发所有匹配的处理函数
5. 任何处理函数中的错误都会被捕捉并记录 —— 有问题的钩子绝不会导致代理崩溃

:::info
网关钩子仅在 **网关**（Telegram、Discord、Slack、WhatsApp）中触发。CLI 不加载网关钩子。需要在所有地方使用的钩子，请使用 [插件钩子](#plugin-hooks)。
:::

## 插件钩子

[插件](/docs/user-guide/features/plugins) 可以注册在 **CLI 和网关** 会话中都触发的钩子。这些通过插件的 `register()` 函数中的 `ctx.register_hook()` 以编程方式注册。

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

- 回调函数接收 **关键字参数**。始终接受 `**kwargs` 以保持向前兼容性 —— 未来版本可能会添加新参数而不会破坏你的插件。
- 如果回调函数 **崩溃**，它会记录并跳过。其他钩子和代理继续正常运行。行为不当的插件绝不能破坏代理。
- 所有钩子都是 **即发即忘观察者**，其返回值被忽略 —— 除了 `pre_llm_call`，它可以 [注入上下文](#pre_llm_call)。

### 快速参考

| 钩子 | 触发时机 | 返回值 |
|------|-----------|---------|
| [`pre_tool_call`](#pre_tool_call) | 任何工具执行前 | 忽略 |
| [`post_tool_call`](#post_tool_call) | 任何工具返回后 | 忽略 |
| [`pre_llm_call`](#pre_llm_call) | 每轮一次，工具调用循环开始前 | 上下文注入 |
| [`post_llm_call`](#post_llm_call) | 每轮一次，工具调用循环结束后 | 忽略 |
| [`on_session_start`](#on_session_start) | 创建新会话时（仅第一轮） | 忽略 |
| [`on_session_end`](#on_session_end) | 会话结束时 | 忽略 |
| [`on_session_finalize`](#on_session_finalize) | CLI/网关关闭活跃会话时（刷新、保存、统计） | 忽略 |
| [`on_session_reset`](#on_session_reset) | 网关交换新会话密钥时（如 `/new`、`/reset`） | 忽略 |

---

### `pre_tool_call`

在每次工具执行 **之前** 立即触发 —— 内置工具和插件工具都会触发。

**回调签名：**

```python
def my_callback(tool_name: str, args: dict, task_id: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `tool_name` | `str` | 即将执行的工具名称（如 `"terminal"`、`"web_search"`、`"read_file"`） |
| `args` | `dict` | 模型传递给工具的参数 |
| `task_id` | `str` | 会话/任务标识符。未设置时为空字符串。 |

**触发时机：** 在 `model_tools.py` 的 `handle_function_call()` 内部，工具处理程序运行前。每次工具调用触发一次 —— 如果模型并行调用 3 个工具，此函数会触发 3 次。

**返回值：** 忽略。

**用例：** 日志记录、审计跟踪、工具调用计数器、阻止危险操作（显示警告）、速率限制。

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

在每次工具执行 **之后** 立即触发。

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

**触发时机：** 在 `model_tools.py` 的 `handle_function_call()` 内部，工具处理程序返回后。每次工具调用触发一次。如果工具抛出未处理的异常，则不会触发（错误被捕获并以错误 JSON 字符串形式返回，`post_tool_call` 仍会触发并将该错误字符串作为 `result`）。

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

在每轮 **一次** 触发，在工具调用循环开始前。这是 **唯一返回值被使用的钩子** —— 它可以将上下文注入当前轮次的用户消息中。

**回调签名：**

```python
def my_callback(session_id: str, user_message: str, conversation_history: list,
                is_first_turn: bool, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 当前会话的唯一标识符 |
| `user_message` | `str` | 本轮用户的原始消息（技能注入前） |
| `conversation_history` | `list` | 完整消息列表的副本（OpenAI 格式：`[{"role": "user", "content": "..."}]`） |
| `is_first_turn` | `bool` | `True` 如果是新会话的第一轮，后续轮次为 `False` |
| `model` | `str` | 模型标识符（如 `"anthropic/claude-sonnet-4.6"`） |
| `platform` | `str` | 会话运行的地点：`"cli"`、`"telegram"`、`"discord"` 等 |

**触发时机：** 在 `run_agent.py` 的 `run_conversation()` 内部，上下文压缩后但在主 `while` 循环前。每轮 `run_conversation()` 调用触发一次（即每轮用户输入一次），而不是工具循环内的每次 API 调用。

**返回值：** 如果回调返回包含 `"context"` 键的字典，或普通非空字符串，文本将被追加到当前轮次的用户消息中。返回 `None` 表示无注入。

```python
# 注入上下文
return {"context": "回忆的记忆：\n- 用户喜欢 Python\n- 正在开发 hermes-agent"}

# 普通字符串（等效）
return "回忆的记忆：\n- 用户喜欢 Python"

# 无注入
return None
```

**上下文注入位置：** 始终是 **用户消息**，而非系统提示。这保留了提示缓存 —— 系统提示在所有轮次中保持不变，因此可以重用缓存的令牌。系统提示是 Hermes 的领域（模型指导、工具执行、个性、技能）。插件在用户输入旁边贡献上下文。

所有注入的上下文都是 **临时** 的 —— 仅在 API 调用时间添加。对话历史中的原始用户消息永远不会被修改，且不会持久化到会话数据库中。

当 **多个插件** 返回上下文时，它们的输出会按插件发现顺序（按目录名字母顺序）用双换行符连接。

**用例：** 记忆回忆、RAG 上下文注入、护栏、每轮分析。

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

**示例 —— 护栏：**

```python
POLICY = "未经用户明确确认，切勿执行删除文件的命令。"

def guardrails(**kwargs):
    return {"context": POLICY}

def register(ctx):
    ctx.register_hook("pre_llm_call", guardrails)
```

---

### `post_llm_call`

在每轮 **一次** 触发，在工具调用循环完成且代理产生最终响应后。仅在 **成功** 的轮次触发 —— 中断的轮次不会触发。

**回调签名：**

```python
def my_callback(session_id: str, user_message: str, assistant_response: str,
                conversation_history: list, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 当前会话的唯一标识符 |
| `user_message` | `str` | 本轮用户的原始消息 |
| `assistant_response` | `str` | 代理为本轮产生的最终文本响应 |
| `conversation_history` | `list` | 本轮完成后完整消息列表的副本 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的地点 |

**触发时机：** 在 `run_agent.py` 的 `run_conversation()` 内部，工具循环退出且有最终响应后。受 `if final_response and not interrupted` 保护 —— 因此当用户在中间轮次中断或代理达到迭代限制而未产生响应时，**不会**触发。

**返回值：** 忽略。

**用例：** 将对话数据同步到外部记忆系统、计算响应质量指标、记录轮次摘要、触发后续操作。

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

在全新会话创建时 **一次** 触发。会话续订（用户在现有会话中发送第二条消息）时 **不会** 触发。

**回调签名：**

```python
def my_callback(session_id: str, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 新会话的唯一标识符 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的地点 |

**触发时机：** 在 `run_agent.py` 的 `run_conversation()` 内部，新会话的第一轮期间 —— 具体是在构建系统提示后但在工具循环开始前。检查条件是 `if not conversation_history`（无先前消息 = 新会话）。

**返回值：** 忽略。

**用例：** 初始化会话范围状态、预热缓存、向外部服务注册会话、记录会话开始。

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

在每个 `run_conversation()` 调用的 **最后** 触发，无论结果如何。如果代理在处理中途退出，CLI 的退出处理程序也会触发。

**回调签名：**

```python
def my_callback(session_id: str, completed: bool, interrupted: bool,
                model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 会话的唯一标识符 |
| `completed` | `bool` | `True` 如果代理产生了最终响应，否则为 `False` |
| `interrupted` | `bool` | `True` 如果轮次被中断（用户发送新消息、`/stop` 或退出） |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的地点 |

**触发时机：** 两个位置：
1. **`run_agent.py`** —— 每个 `run_conversation()` 调用结束后，所有清理工作完成后。总是触发，即使轮次出错。
2. **`cli.py`** —— 在 CLI 的 atexit 处理程序中，但 **仅当** 退出发生时代理正在处理中（`_agent_running=True`）。这会捕获 Ctrl+C 和 `/exit` 处理期间的中断。此时 `completed=False` 且 `interrupted=True`。

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

当 CLI 或网关 **关闭** 活跃会话时触发 —— 例如用户运行 `/new`、网关 GC 了空闲会话，或 CLI 退出时有活跃的代理。这是在会话身份消失前最后一次刷新与传出会话绑定的状态的机会。

**回调签名：**

```python
def my_callback(session_id: str | None, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` 或 `None` | 传出会话 ID。可能为 `None` 如果没有活跃会话。 |
| `platform` | `str` | `"cli"` 或消息平台名称（`"telegram"`、`"discord"` 等）。 |

**触发时机：** 在 `cli.py`（`/new` / CLI 退出时）和 `gateway/run.py`（会话重置或被 GC 时）。在网关端总是与 `on_session_reset` 配对。

**返回值：** 忽略。

**用例：** 在会话 ID 被丢弃前持久化最终会话指标、关闭每会话资源、发出最终遥测事件、排空排队写入。

---

### `on_session_reset`

当网关 **为活跃聊天交换新会话密钥** 时触发 —— 用户调用了 `/new`、`/reset`、`/clear`，或适配器在空闲窗口后选择了新会话。这让插件能在等待下一个 `on_session_start` 之前对对话状态已被清除的事实做出反应。

**回调签名：**

```python
def my_callback(session_id: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 新会话的 ID（已轮换为新值）。 |
| `platform` | `str` | 消息平台名称。 |

**触发时机：** 在 `gateway/run.py` 中，新会话密钥分配后但在下一个传入消息处理前。在网关上，顺序是：`on_session_finalize(old_id)` → 交换 → `on_session_reset(new_id)` → 第一个传入轮次的 `on_session_start(new_id)`。

**返回值：** 忽略。

**用例：** 重置以 `session_id` 为键的每会话缓存、发出 "会话轮换" 分析、预热新鲜状态存储桶。

---

有关完整演练，包括工具模式、处理程序和高级钩子模式的详细信息，请参见 **[构建插件指南](/docs/guides/build-a-hermes-plugin)**。