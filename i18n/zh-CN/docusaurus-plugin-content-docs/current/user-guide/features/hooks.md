---
sidebar_position: 6
title: "事件钩子"
description: "在关键生命周期节点运行自定义代码 — 记录活动、发送警报、向 Webhook 发送数据"
---

# 事件钩子

Hermes 提供三种钩子系统，可在关键生命周期节点运行自定义代码：

| 系统 | 注册方式 | 运行位置 | 使用场景 |
|------|----------|----------|----------|
| **[网关钩子](#网关事件钩子)** | `~/.hermes/hooks/` 目录下的 `HOOK.yaml` + `handler.py` | 仅网关 | 日志记录、警报、Webhook |
| **[插件钩子](#插件钩子)** | 在[插件](/docs/user-guide/features/plugins)中调用 `ctx.register_hook()` | CLI + 网关 | 工具拦截、指标统计、防护措施 |
| **[Shell 钩子](#shell-钩子)** | `~/.hermes/config.yaml` 中的 `hooks:` 块，指向 Shell 脚本 | CLI + 网关 | 用于阻塞、自动格式化、上下文注入的即插即用脚本 |

所有三种系统均为非阻塞式 — 任何钩子中的错误都会被捕捉并记录，绝不会导致智能体崩溃。

## 网关事件钩子

网关钩子在网关运行期间（Telegram、Discord、Slack、WhatsApp）自动触发，不会阻塞主智能体处理流程。

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

`events` 列表决定了哪些事件会触发你的处理函数。你可以订阅任意组合的事件，包括像 `command:*` 这样的通配符。

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
- 可以是 `async def` 或普通 `def` — 两者均可
- 错误会被捕捉并记录，绝不会导致智能体崩溃

### 可用事件

| 事件 | 触发时机 | 上下文键 |
|------|----------|----------|
| `gateway:startup` | 网关进程启动 | `platforms`（活跃平台名称列表） |
| `session:start` | 创建新的消息会话 | `platform`, `user_id`, `session_id`, `session_key` |
| `session:end` | 会话结束（重置前） | `platform`, `user_id`, `session_key` |
| `session:reset` | 用户执行 `/new` 或 `/reset` | `platform`, `user_id`, `session_key` |
| `agent:start` | 智能体开始处理消息 | `platform`, `user_id`, `session_id`, `message` |
| `agent:step` | 工具调用循环的每次迭代 | `platform`, `user_id`, `session_id`, `iteration`, `tool_names` |
| `agent:end` | 智能体完成处理 | `platform`, `user_id`, `session_id`, `message`, `response` |
| `command:*` | 执行任意斜杠命令 | `platform`, `user_id`, `command`, `args` |

#### 通配符匹配

注册为 `command:*` 的处理函数会为任意 `command:` 事件（如 `command:model`、`command:reset` 等）触发。通过单个订阅即可监控所有斜杠命令。

### 示例

#### 启动清单（BOOT.md）— 内置

网关自带一个名为 `boot-md` 的内置钩子，每次启动时都会查找 `~/.hermes/BOOT.md` 文件。如果文件存在，智能体将在后台会话中执行其指令。无需安装 — 只需创建该文件即可。

**创建 `~/.hermes/BOOT.md`：**

```markdown
# 启动清单

1. 检查是否有任何定时任务整夜失败 — 运行 `hermes cron list`
2. 向 Discord #general 发送消息“网关已重启，所有系统运行正常”
3. 检查 /opt/app/deploy.log 在过去 24 小时内是否有任何错误
```

智能体在后台线程中运行这些指令，因此不会阻塞网关启动。如果无需关注任何事项，智能体会回复 `[SILENT]`，且不会发送任何消息。

:::tip
没有 BOOT.md？钩子会静默跳过 — 零开销。需要启动自动化时创建该文件，不需要时删除即可。
:::

#### 长任务 Telegram 警报

当智能体执行超过 10 步时，向自己发送消息：

```yaml
# ~/.hermes/hooks/long-task-alert/HOOK.yaml
name: long-task-alert
description: 智能体执行步骤过多时发出警报
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

#### 会话启动 Webhook

在新会话创建时向外部服务发送 POST 请求：

```yaml
# ~/.hermes/hooks/session-webhook/HOOK.yaml
name: session-webhook
description: 新会话创建时通知外部服务
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

1. 网关启动时，`HookRegistry.discover_and_load()` 会扫描 `~/.hermes/hooks/`
2. 每个包含 `HOOK.yaml` + `handler.py` 的子目录都会被动态加载
3. 处理函数会为其声明的事件注册
4. 在每个生命周期节点，`hooks.emit()` 会触发所有匹配的处理函数
5. 任何处理函数中的错误都会被捕捉并记录 — 损坏的钩子绝不会导致智能体崩溃

:::info
网关钩子仅在**网关**（Telegram、Discord、Slack、WhatsApp）中触发。CLI 不会加载网关钩子。若需在所有环境中生效的钩子，请使用[插件钩子](#插件钩子)。
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

**所有钩子的通用规则：**

- 回调函数接收 **关键字参数**。始终接受 `**kwargs` 以确保向前兼容性 —— 未来版本可能会添加新参数，而不会破坏你的插件。
- 如果回调函数**崩溃**，它会被记录并跳过。其他钩子和智能体将继续正常运行。行为异常的插件绝不能破坏智能体。
- 有两个钩子的返回值会影响行为：[`pre_tool_call`](#pre_tool_call) 可以**阻止**工具调用，而 [`pre_llm_call`](#pre_llm_call) 可以向 LLM 调用**注入上下文**。所有其他钩子均为“触发即忘”的观察者。

### 快速参考

| 钩子 | 触发时机 | 返回值 |
|------|-----------|---------|
| [`pre_tool_call`](#pre_tool_call) | 在任何工具执行之前 | 返回 `{"action": "block", "message": str}` 以否决该调用 |
| [`post_tool_call`](#post_tool_call) | 在任何工具返回之后 | 忽略 |
| [`pre_llm_call`](#pre_llm_call) | 每轮一次，在工具调用循环之前 | 返回 `{"context": str}` 以将上下文预置到用户消息中 |
| [`post_llm_call`](#post_llm_call) | 每轮一次，在工具调用循环之后 | 忽略 |
| [`on_session_start`](#on_session_start) | 创建新会话时（仅第一轮） | 忽略 |
| [`on_session_end`](#on_session_end) | 会话结束时 | 忽略 |
| [`on_session_finalize`](#on_session_finalize) | CLI/网关拆除一个活跃会话（刷新、保存、统计） | 忽略 |
| [`on_session_reset`](#on_session_reset) | 网关切换到一个新的会话密钥（例如 `/new`、`/reset`） | 忽略 |
| [`subagent_stop`](#subagent_stop) | 一个 `delegate_task` 子任务已退出 | 忽略 |
| [`pre_gateway_dispatch`](#pre_gateway_dispatch) | 网关收到用户消息，在认证 + 分发之前 | 返回 `{"action": "skip" \| "rewrite" \| "allow", ...}` 以影响流程 |

---

### `pre_tool_call`

在**每次工具执行之前立即**触发 —— 包括内置工具和插件工具。

**回调函数签名：**

```python
def my_callback(tool_name: str, args: dict, task_id: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `tool_name` | `str` | 即将执行的工具名称（例如 `"terminal"`、`"web_search"`、`"read_file"`） |
| `args` | `dict` | 模型传递给工具的参数 |
| `task_id` | `str` | 会话/任务标识符。如果未设置，则为空字符串。 |

**触发位置：** 在 `model_tools.py` 的 `handle_function_call()` 内部，在工具的处理程序运行之前触发。每次工具调用触发一次 —— 如果模型并行调用 3 个工具，则此钩子会触发 3 次。

**返回值 —— 否决调用：**

```python
return {"action": "block", "message": "工具调用被阻止的原因"}
```

智能体将使用 `message` 作为错误信息短路该工具调用并返回给模型。第一个匹配的阻止指令生效（Python 插件优先注册，然后是 Shell 钩子）。任何其他返回值都会被忽略，因此仅用于观察的现有回调函数可以继续正常工作。

**使用场景：** 日志记录、审计跟踪、工具调用计数器、阻止危险操作、速率限制、按用户策略强制执行。

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

在**每次工具执行返回之后立即**触发。

**回调函数签名：**

```python
def my_callback(tool_name: str, args: dict, result: str, task_id: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `tool_name` | `str` | 刚刚执行的工具名称 |
| `args` | `dict` | 模型传递给工具的参数 |
| `result` | `str` | 工具的返回值（始终为 JSON 字符串） |
| `task_id` | `str` | 会话/任务标识符。如果未设置，则为空字符串。 |

**触发位置：** 在 `model_tools.py` 的 `handle_function_call()` 内部，在工具的处理程序返回之后触发。每次工具调用触发一次。如果工具抛出未处理的异常，则**不会**触发此钩子（错误会被捕获并作为错误 JSON 字符串返回，此时 `post_tool_call` 会以该错误字符串作为 `result` 触发）。

**返回值：** 忽略。

**使用场景：** 记录工具结果、收集指标、跟踪工具成功/失败率、在特定工具完成时发送通知。

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

**每轮触发一次**，在工具调用循环开始之前。这是**唯一一个其返回值会被使用的钩子** —— 它可以向当前轮次的用户消息中注入上下文。

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
| `is_first_turn` | `bool` | 如果是新会话的第一轮，则为 `True`；后续轮次为 `False` |
| `model` | `str` | 模型标识符（例如 `"anthropic/claude-sonnet-4.6"`） |
| `platform` | `str` | 会话运行的平台：`"cli"`、`"telegram"`、`"discord"` 等。 |

**触发位置：** 在 `run_agent.py` 的 `run_conversation()` 内部，在上下文压缩之后但在主 `while` 循环之前触发。每次调用 `run_conversation()` 触发一次（即每轮用户交互触发一次），而不是在工具循环内的每次 API 调用时触发。

**返回值：** 如果回调函数返回一个包含 `"context"` 键的字典，或一个非空的普通字符串，则该文本会被追加到当前轮次的用户消息中。返回 `None` 表示不注入。

```python
# 注入上下文
return {"context": "回忆起的记忆：\n- 用户喜欢 Python\n- 正在开发 hermes-agent"}

# 普通字符串（等效）
return "回忆起的记忆：\n- 用户喜欢 Python"

# 不注入
return None
```

**上下文注入位置：** 始终是**用户消息**，而不是系统提示。这可以保留提示缓存 —— 系统提示在轮次之间保持不变，因此缓存的 token 会被重用。系统提示是 Hermes 的领域（模型指导、工具执行、个性、技能）。插件贡献的上下文与用户的输入并列。

所有注入的上下文都是**临时的** —— 仅在 API 调用时添加。对话历史中的原始用户消息永远不会被修改，也不会有任何内容持久化到会话数据库中。

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
POLICY = "除非用户明确确认，否则绝不执行删除文件的命令。"

def guardrails(**kwargs):
    return {"context": POLICY}

def register(ctx):
    ctx.register_hook("pre_llm_call", guardrails)
```

---

### `post_llm_call`

**每轮触发一次**，在工具调用循环完成且智能体已生成最终响应之后。仅在**成功**的轮次中触发 —— 如果轮次被中断，则不会触发。

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
| `conversation_history` | `list` | 轮次完成后的完整消息列表副本 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的平台 |

**触发位置：** 在 `run_agent.py` 的 `run_conversation()` 内部，在工具循环以最终响应退出之后触发。受 `if final_response and not interrupted` 保护 —— 因此当用户中途中断轮次或智能体达到迭代限制但未生成响应时，**不会**触发。

**返回值：** 忽略。

**使用场景：** 将对话数据同步到外部记忆系统、计算响应质量指标、记录轮次摘要、触发后续操作。

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

在创建**全新会话时触发一次**。在会话继续时（用户在现有会话中发送第二条消息）**不会**触发。

**回调函数签名：**

```python
def my_callback(session_id: str, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 新会话的唯一标识符 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的平台 |

**触发位置：** 在 `run_agent.py` 的 `run_conversation()` 内部，在新会话的第一轮期间 —— 具体是在系统提示构建之后但在工具循环开始之前。判断条件是 `if not conversation_history`（无先前消息 = 新会话）。

**返回值：** 忽略。

**使用场景：** 初始化会话范围内的状态、预热缓存、向外部服务注册会话、记录会话开始。

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

在每次 `run_conversation()` 调用**结束时触发**，无论结果如何。如果用户在智能体处理过程中退出，也会从 CLI 的退出处理程序中触发。

**回调函数签名：**

```python
def my_callback(session_id: str, completed: bool, interrupted: bool,
                model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 会话的唯一标识符 |
| `completed` | `bool` | 如果智能体生成了最终响应，则为 `True`；否则为 `False` |
| `interrupted` | `bool` | 如果轮次被中断（用户发送了新消息、`/stop` 或退出），则为 `True` |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的平台 |

**触发位置：** 两个地方：
1. **`run_agent.py`** —— 在每次 `run_conversation()` 调用结束时，在所有清理操作之后触发。即使轮次出错，也始终触发。
2. **`cli.py`** —— 在 CLI 的 `atexit` 处理程序中，但**仅**当退出发生时智能体正在处理轮次（`_agent_running=True`）。这会捕获处理过程中的 Ctrl+C 和 `/exit`。在这种情况下，`completed=False` 且 `interrupted=True`。

**返回值：** 忽略。

**使用场景：** 刷新缓冲区、关闭连接、持久化会话状态、记录会话持续时间、清理在 `on_session_start` 中初始化的资源。

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

当 CLI 或网关**拆除**一个活跃会话时触发 —— 例如，用户运行 `/new`、网关 GC 了一个空闲会话，或 CLI 退出时智能体处于活跃状态。这是在会话身份消失之前刷新与该传出会话关联的状态的最后机会。

**回调函数签名：**

```python
def my_callback(session_id: str | None, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` 或 `None` | 传出的会话 ID。如果不存在活跃会话，则可能为 `None`。 |
| `platform` | `str` | `"cli"` 或消息平台名称（`"telegram"`、`"discord"` 等）。 |

**触发位置：** 在 `cli.py`（`/new` / CLI 退出时）和 `gateway/run.py`（会话重置或 GC 时）。在网关端，始终与 `on_session_reset` 配对。

**返回值：** 忽略。

**使用场景：** 在会话 ID 被丢弃之前持久化最终会话指标、关闭每会话资源、发出最终遥测事件、排空排队的写入。

---

### `on_session_reset`

当网关为活跃聊天**切换到一个新的会话密钥**时触发 —— 用户调用了 `/new`、`/reset`、`/clear`，或适配器在空闲窗口后选择了一个新会话。这允许插件对对话状态已被清除的事实做出反应，而无需等待下一个 `on_session_start`。

**回调函数签名：**

```python
def my_callback(session_id: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 新会话的 ID（已切换到新值）。 |
| `platform` | `str` | 消息平台名称。 |

**触发位置：** 在 `gateway/run.py` 中，在新会话密钥分配之后但在处理下一个入站消息之前立即触发。在网关上，顺序为：`on_session_finalize(old_id)` → 切换 → `on_session_reset(new_id)` → 在第一轮入站时触发 `on_session_start(new_id)`。

**返回值：** 忽略。

**使用场景：** 重置以 `session_id` 为键的每会话缓存、发出“会话已轮换”分析、准备一个新的状态桶。

---

请参阅 **[构建插件指南](/docs/guides/build-a-hermes-plugin)**，了解包括工具模式、处理程序和高级钩子模式的完整演练。

---

### `subagent_stop`

在 `delegate_task` 完成后，**每个子智能体触发一次**。无论你委托的是单个任务还是三个任务的批次，此钩子都会为每个子任务触发一次，并在父线程上串行化。

**回调函数签名：**

```python
def my_callback(parent_session_id: str, child_role: str | None,
                child_summary: str | None, child_status: str,
                duration_ms: int, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `parent_session_id` | `str` | 委托父智能体的会话 ID |
| `child_role` | `str \| None` | 设置在子智能体上的编排器角色标签（如果该功能未启用，则为 `None`） |
| `child_summary` | `str \| None` | 子智能体返回给父智能体的最终响应 |
| `child_status` | `str` | `"completed"`、`"failed"`、`"interrupted"` 或 `"error"` |
| `duration_ms` | `int` | 运行子智能体所花费的挂钟时间（毫秒） |

**触发位置：** 在 `tools/delegate_tool.py` 中，在 `ThreadPoolExecutor.as_completed()` 排空所有子任务 future 之后触发。触发被编组到父线程，因此钩子作者无需考虑并发回调执行。

**返回值：** 忽略。

**使用场景：** 记录编排活动、累积子任务持续时间以用于计费、编写委托后审计记录。

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
在重度委托的情况下（例如 编排器角色 × 5 个叶子 × 嵌套深度），`subagent_stop` 每轮会触发多次。请保持你的回调函数快速；将耗时的工作推送到后台队列。
:::

---

### `pre_gateway_dispatch`

在网关中**每次收到 `MessageEvent` 时触发一次**，在内部事件守卫之后但在认证/配对和智能体分发**之前**。这是网关级消息流策略（仅监听窗口、人工接管、每聊天路由等）的拦截点，这些策略无法清晰地归入任何单个平台适配器。

**回调函数签名：**

```python
def my_callback(event, gateway, session_store, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `event` | `MessageEvent` | 规范化的入站消息（具有 `.text`、`.source`、`.message_id`、`.internal` 等属性）。 |
| `gateway` | `GatewayRunner` | 活跃的网关运行器，因此插件可以调用 `gateway.adapters[platform].send(...)` 进行旁路回复（所有者通知等）。 |
| `session_store` | `SessionStore` | 用于通过 `session_store.append_to_transcript(...)` 进行静默转录摄取。 |

**触发位置：** 在 `gateway/run.py` 的 `GatewayRunner._handle_message()` 内部，在计算出 `is_internal` 之后立即触发。**内部事件完全跳过此钩子**（它们是系统生成的 —— 后台进程完成等 —— 绝不能由面向用户的策略进行门控）。

**返回值：** `None` 或一个字典。第一个被识别的动作字典生效；其余插件结果被忽略。插件回调中的异常会被捕获并记录；网关在出错时总是回退到正常分发。

| 返回值 | 效果 |
|--------|--------|
| `{"action": "skip", "reason": "..."}` | 丢弃消息 —— 无智能体回复，无配对流程，无认证。假定插件已处理它（例如静默摄取到转录中）。 |
| `{"action": "rewrite", "text": "new text"}` | 替换 `event.text`，然后使用修改后的事件继续正常分发。适用于将缓冲的环境消息折叠为单个提示。 |
| `{"action": "allow"}` / `None` | 正常分发 —— 运行完整的认证 / 配对 / 智能体循环链。 |

**使用场景：** 仅监听群聊（仅在被提及时响应；将环境消息缓冲到上下文中）；人工接管（在 owner 手动处理聊天时静默摄取客户消息）；每配置文件速率限制；策略驱动的路由。

**示例 —— 静默丢弃未经授权的 DM，而不触发配对代码：**

```python
def deny_unauthorized_dms(event, **kwargs):
    src = event.source
    if src.chat_type == "dm" and not _is_approved_user(src.user_id):
        return {"action": "skip", "reason": "unauthorized-dm"}
    return None

def register(ctx):
    ctx.register_hook("pre_gateway_dispatch", deny_unauthorized_dms)
```

**示例 —— 在提及时将环境消息缓冲区重写为单个提示：**

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

## Shell Hooks

在 `cli-config.yaml` 中声明 shell 脚本钩子，Hermes 将在对应的插件钩子事件触发时（在 CLI 和网关会话中均会）将其作为子进程运行。无需编写 Python 插件。

当您希望一个即插即用的单文件脚本（Bash、Python 或任何带有 shebang 的脚本）执行以下操作时，请使用 shell 钩子：

- **阻止工具调用** — 拒绝危险的 `terminal` 命令，强制执行每目录策略，对破坏性的 `write_file` / `patch` 操作要求审批。
- **在工具调用后运行** — 自动格式化智能体刚写入的 Python 或 TypeScript 文件，记录 API 调用，触发 CI 工作流。
- **向下一轮 LLM 调用注入上下文** — 将 `git status` 输出、当前星期几或检索到的文档前置到用户消息中（参见 [`pre_llm_call`](#pre_llm_call)）。
- **观察生命周期事件** — 当子智能体完成时（`subagent_stop`）或会话启动时（`on_session_start`）写入日志行。

Shell 钩子通过在 CLI 启动时（`hermes_cli/main.py`）和网关启动时（`gateway/run.py`）调用 `agent.shell_hooks.register_from_config(cfg)` 来注册。它们与 Python 插件钩子自然组合 — 两者都通过同一个调度器流转。

### 一目了然对比

| 维度 | Shell 钩子 | [插件钩子](#plugin-hooks) | [网关钩子](#gateway-event-hooks) |
|-----------|-------------|-------------------------------|---------------------------------------|
| 声明位置 | `~/.hermes/config.yaml` 中的 `hooks:` 块 | `plugin.yaml` 插件中的 `register()` | `HOOK.yaml` + `handler.py` 目录 |
| 存放位置 | `~/.hermes/agent-hooks/`（按约定） | `~/.hermes/plugins/<name>/` | `~/.hermes/hooks/<name>/` |
| 语言 | 任意（Bash、Python、Go 二进制文件等） | 仅 Python | 仅 Python |
| 运行于 | CLI + 网关 | CLI + 网关 | 仅网关 |
| 事件 | `VALID_HOOKS`（包括 `subagent_stop`） | `VALID_HOOKS` | 网关生命周期（`gateway:startup`、`agent:*`、`command:*`） |
| 能否阻止工具调用 | 是（`pre_tool_call`） | 是（`pre_tool_call`） | 否 |
| 能否注入 LLM 上下文 | 是（`pre_llm_call`） | 是（`pre_llm_call`） | 否 |
| 同意机制 | 每个 `(事件, 命令)` 对首次使用时提示 | 隐式（信任 Python 插件） | 隐式（信任目录） |
| 进程间隔离 | 是（子进程） | 否（进程内） | 否（进程内） |

### 配置模式

```yaml
hooks:
  <event_name>:                  # 必须是 VALID_HOOKS 中的事件
    - matcher: "<regex>"         # 可选；仅用于 pre/post_tool_call
      command: "<shell command>" # 必需；通过 shlex.split 运行，shell=False
      timeout: <seconds>         # 可选；默认 60，上限 300

hooks_auto_accept: false         # 参见下文“同意机制”
```

事件名称必须是 [插件钩子事件](#plugin-hooks) 之一；拼写错误会产生“您是指 X 吗？”警告并被跳过。单个条目内的未知键会被忽略；缺少 `command` 会跳过并发出警告。`timeout > 300` 会被限制并发出警告。

### JSON 线协议

每次事件触发时，Hermes 会为每个匹配的钩子（matcher 允许的情况下）生成一个子进程，将 JSON 负载通过 **stdin** 管道传递，并将 **stdout** 作为 JSON 读回。

**stdin — 脚本接收的负载：**

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

对于非工具事件（`pre_llm_call`、`subagent_stop`、会话生命周期），`tool_name` 和 `tool_input` 为 `null`。`extra` 字典携带所有事件特定的关键字参数（`user_message`、`conversation_history`、`child_role`、`duration_ms` 等）。不可序列化的值会被字符串化而非省略。

**stdout — 可选响应：**

```jsonc
// 阻止 pre_tool_call（两种格式均可接受；内部会标准化）：
{"decision": "block", "reason":  "Forbidden: rm -rf"}   // Claude-Code 风格
{"action":   "block", "message": "Forbidden: rm -rf"}   // Hermes 规范

// 为 pre_llm_call 注入上下文：
{"context": "Today is Friday, 2026-04-17"}

// 静默无操作 — 任何空/不匹配的输出均可：
```

格式错误的 JSON、非零退出码和超时都会记录警告，但绝不会中止智能体循环。

### 工作示例

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

智能体的上下文中文件视图**不会**自动重新读取 — 重新格式化仅影响磁盘上的文件。后续的 `read_file` 调用会获取格式化后的版本。

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

#### 3. 每轮注入 `git status`（等效于 Claude-Code 的 `UserPromptSubmit`）

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

Claude Code 的 `UserPromptSubmit` 事件 intentionally 不是 Hermes 的独立事件 — `pre_llm_call` 在同一位置触发，并且已经支持上下文注入。请在此处使用它。

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

### 同意机制

Hermes 首次遇到每个唯一的 `(事件, 命令)` 对时，会提示用户批准，然后将决定持久化到 `~/.hermes/shell-hooks-allowlist.json`。后续运行（CLI 或网关）会跳过提示。

有三种方式可以绕过交互式提示 — 任意一种都足够：

1. CLI 上的 `--accept-hooks` 标志（例如 `hermes --accept-hooks chat`）
2. `HERMES_ACCEPT_HOOKS=1` 环境变量
3. `cli-config.yaml` 中的 `hooks_auto_accept: true`

非 TTY 运行（网关、cron、CI）需要上述三种方式之一 — 否则任何新添加的钩子会静默保持未注册状态并记录警告。

**脚本编辑会被静默信任。** 允许列表基于确切的命令字符串，而非脚本的哈希值，因此编辑磁盘上的脚本不会使同意失效。`hermes hooks doctor` 会标记 mtime 漂移，以便您发现编辑并决定是否重新批准。

### `hermes hooks` CLI

| 命令 | 功能 |
|---------|--------------|
| `hermes hooks list` | 转储配置的钩子，包括 matcher、超时和同意状态 |
| `hermes hooks test <event> [--for-tool X] [--payload-file F]` | 针对合成负载触发每个匹配的钩子，并打印解析后的响应 |
| `hermes hooks revoke <command>` | 移除每个匹配 `<command>` 的允许列表条目（下次重启时生效） |
| `hermes hooks doctor` | 对每个配置的钩子：检查可执行位、允许列表状态、mtime 漂移、JSON 输出有效性和大致执行时间 |

### 安全性

Shell 钩子以**您的完整用户凭据**运行 — 与 cron 条目或 shell 别名具有相同的信任边界。将 `config.yaml` 中的 `hooks:` 块视为特权配置：

- 仅引用您编写或完全审查过的脚本。
- 将脚本保留在 `~/.hermes/agent-hooks/` 内，以便路径易于审计。
- 拉取共享配置后，重新运行 `hermes hooks doctor`，以便在钩子注册前发现新添加的钩子。
- 如果您的 config.yaml 在团队中受版本控制，请像审查 CI 配置一样审查更改 `hooks:` 部分的 PR。

### 顺序和优先级

Python 插件钩子和 shell 钩子都通过同一个 `invoke_hook()` 调度器流转。Python 插件首先注册（`discover_and_load()`），shell 钩子其次注册（`register_from_config()`），因此在平局情况下，Python 的 `pre_tool_call` 阻止决定优先。第一个有效的阻止决定获胜 — 一旦任何回调产生带有非空消息的 `{"action": "block", "message": str}`，聚合器就会立即返回。