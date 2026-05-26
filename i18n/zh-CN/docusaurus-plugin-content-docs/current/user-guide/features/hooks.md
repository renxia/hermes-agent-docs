---
sidebar_position: 6
title: "事件钩子"
description: "在关键生命周期点运行自定义代码 — 记录活动、发送警报、发布到 Webhook"
---

# 事件钩子

赫尔墨斯拥有三套钩子系统，可在关键生命周期点运行自定义代码：

| 系统                     | 注册方式                                                                 | 运行环境        | 使用场景                               |
|------------------------|------------------------------------------------------------------------|----------------|--------------------------------------|
| **[网关钩子](#网关事件钩子)**   | 通过位于 `~/.hermes/hooks/` 目录下的 `HOOK.yaml` 和 `handler.py` 文件注册     | 仅限网关         | 日志记录、警报、Webhook                |
| **[插件钩子](#插件钩子)**     | 在[插件](/user-guide/features/plugins)中通过 `ctx.register_hook()` 方法注册 | CLI + 网关     | 工具拦截、指标收集、防护规则              |
| **[Shell 钩子](#shell钩子)** | 在 `~/.hermes/config.yaml` 中通过 `hooks:` 配置块指向 Shell 脚本            | CLI + 网关     | 用于阻断、自动格式化、上下文注入的脚本       |

所有三套系统均为非阻塞式 —— 任何钩子中的错误都会被捕获并记录日志，永远不会导致智能体崩溃。

## 网关事件钩子

网关钩子在网关运行期间（Telegram、Discord、Slack、WhatsApp、Teams）自动触发，且不会阻塞主智能体管道。

### 创建钩子

每个钩子是 `~/.hermes/hooks/` 目录下的一个文件夹，包含两个文件：

```text
~/.hermes/hooks/
└── my-hook/
    ├── HOOK.yaml      # 声明要监听哪些事件
    └── handler.py     # Python 处理函数
```

#### HOOK.yaml

```yaml
name: my-hook
description: Log all agent activity to a file
events:
  - agent:start
  - agent:end
  - agent:step
```

`events` 列表决定了哪些事件会触发你的处理程序。你可以订阅任何事件组合，包括像 `command:*` 这样的通配符。

#### handler.py

```python
import json
from datetime import datetime
from pathlib import Path

LOG_FILE = Path.home() / ".hermes" / "hooks" / "my-hook" / "activity.log"

async def handle(event_type: str, context: dict):
    """Called for each subscribed event. Must be named 'handle'."""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "event": event_type,
        **context,
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
```

**处理程序规则：**
- 必须命名为 `handle`
- 接收 `event_type`（字符串）和 `context`（字典）参数
- 可以是 `async def` 或普通 `def` —— 两者均有效
- 错误会被捕获并记录，绝不会导致智能体崩溃

### 可用事件

| 事件 | 触发时机 | 上下文键 |
|------|----------|----------|
| `gateway:startup` | 网关进程启动时 | `platforms`（活跃平台名称列表） |
| `session:start` | 新建消息会话时 | `platform`, `user_id`, `session_id`, `session_key` |
| `session:end` | 会话结束时（重置前） | `platform`, `user_id`, `session_key` |
| `session:reset` | 用户执行 `/new` 或 `/reset` 命令时 | `platform`, `user_id`, `session_key` |
| `agent:start` | 智能体开始处理消息时 | `platform`, `user_id`, `session_id`, `message` |
| `agent:step` | 工具调用循环的每次迭代时 | `platform`, `user_id`, `session_id`, `iteration`, `tool_names` |
| `agent:end` | 智能体完成处理时 | `platform`, `user_id`, `session_id`, `message`, `response` |
| `command:*` | 任何斜杠命令执行时 | `platform`, `user_id`, `command`, `args` |

#### 通配符匹配

注册了 `command:*` 的处理程序会在任何 `command:` 事件（`command:model`、`command:reset` 等）触发时执行。通过单个订阅即可监控所有斜杠命令。

### 示例

#### 长任务 Telegram 警报

当智能体执行超过 10 步时给自己发送消息：

```yaml
# ~/.hermes/hooks/long-task-alert/HOOK.yaml
name: long-task-alert
description: Alert when agent is taking many steps
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
        text = f"⚠️ Agent has been running for {iteration} steps. Last tools: {tools}"
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
description: Log slash command usage
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
description: Notify external service on new sessions
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

### 教程：BOOT.md — 在每次网关启动时运行启动检查清单

社区中的一个流行模式：在 `~/.hermes/BOOT.md` 放置一个 Markdown 检查清单，并让智能体在每次网关启动时运行它。适用于“每次启动时检查夜间 cron 作业是否失败，如果失败则通过 Discord 通知我”，或“总结过去 24 小时的 deploy.log 并将其发布到 Slack #ops 频道”等场景。

本教程展示如何通过用户自定义钩子自行构建此功能。Hermes 不提供内置的 BOOT.md 钩子 —— 你完全可以定义自己想要的行为。

#### 我们要构建什么

1. 一个位于 `~/.hermes/BOOT.md` 的文件，包含自然语言的启动指令。
2. 一个在 `gateway:startup` 事件触发的网关钩子，它会使用你网关已解析的模型/凭据启动一个一次性智能体，并运行 BOOT.md 中的指令。
3. 一个 `[SILENT]` 约定，让智能体在没有需要报告的内容时可以选择不发送消息。

#### 第 1 步：编写你的检查清单

创建 `~/.hermes/BOOT.md`。像你给一位人类助手下达指令一样编写它：

```markdown
# 启动检查清单

1. 运行 `hermes cron list` 并检查是否有任何计划任务在夜间失败。
2. 如果有任何失败，使用 `send_message` 工具向 Discord #ops 频道发送摘要。
3. 检查 `/opt/app/deploy.log` 在过去 24 小时内是否有任何 ERROR 行。如果有，总结它们并包含在同一条 Discord 消息中。
4. 如果一切正常，请仅回复 `[SILENT]`，这样就不会发送任何消息。
```

智能体会将其视为其提示的一部分，因此任何你能用通俗语言描述的内容都可以 —— 工具调用、shell 命令、发送消息、总结文件。

#### 第 2 步：创建钩子

```text
~/.hermes/hooks/boot-md/
├── HOOK.yaml
└── handler.py
```

**`~/.hermes/hooks/boot-md/HOOK.yaml`**

```yaml
name: boot-md
description: Run ~/.hermes/BOOT.md on gateway startup
events:
  - gateway:startup
```

**`~/.hermes/hooks/boot-md/handler.py`**

```python
"""Run ~/.hermes/BOOT.md on every gateway startup."""

import logging
import threading
from pathlib import Path

logger = logging.getLogger("hooks.boot-md")

BOOT_FILE = Path.home() / ".hermes" / "BOOT.md"


def _build_prompt(content: str) -> str:
    return (
        "You are running a startup boot checklist. Follow the instructions "
        "below exactly.\n\n"
        "---\n"
        f"{content}\n"
        "---\n\n"
        "Execute each instruction. Use the send_message tool to deliver any "
        "messages to platforms like Discord or Slack.\n"
        "If nothing needs attention and there is nothing to report, reply "
        "with ONLY: [SILENT]"
    )


def _run_boot_agent(content: str) -> None:
    """Spawn a one-shot agent and execute the checklist.

    Uses the gateway's resolved model and runtime credentials so this works
    against custom endpoints, aggregators, and OAuth-based providers alike.
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
            logger.info("boot-md completed: %s", response[:200])
        else:
            logger.info("boot-md completed (nothing to report)")
    except Exception as e:
        logger.error("boot-md agent failed: %s", e)


async def handle(event_type: str, context: dict) -> None:
    if not BOOT_FILE.exists():
        return
    content = BOOT_FILE.read_text(encoding="utf-8").strip()
    if not content:
        return

    logger.info("Running BOOT.md (%d chars)", len(content))

    # 在后台线程中运行，避免阻塞网关启动。
    thread = threading.Thread(
        target=_run_boot_agent,
        args=(content,),
        name="boot-md",
        daemon=True,
    )
    thread.start()
```

两行关键代码：
- `_resolve_gateway_model()` 读取网关当前配置的模型。
- `_resolve_runtime_agent_kwargs()` 以与正常网关回合相同的方式解析提供者凭据 —— 包括 API 密钥、基础 URL、OAuth 令牌和凭据池。

如果没有这些，一个裸的 `AIAgent()` 会回退到内置默认值，并且在任何非默认端点上都会遇到 401 错误。

#### 第 3 步：测试

重启网关：

```bash
hermes gateway restart
```

查看日志：

```bash
hermes logs --follow --level INFO | grep boot-md
```

你应该会看到 `Running BOOT.md (N chars)`，随后是 `boot-md completed: ...`（智能体所做操作的摘要），或者当智能体回复 `[SILENT]` 时显示 `boot-md completed (nothing to report)`。

删除 `~/.hermes/BOOT.md` 即可禁用此检查清单 —— 钩子仍保持加载状态，但在文件不存在时会静默跳过。

#### 扩展此模式

- **感知调度的检查清单：** 在 BOOT.md 的指令中使用 `datetime.now().weekday()` 进行判断（例如“如果是周一，同时检查每周部署日志”）。指令是自由格式的文本，因此任何智能体能够推理的内容都适用。
- **多个检查清单：** 将钩子指向不同的文件（`STARTUP.md`、`MORNING.md` 等），并为每个文件注册独立的钩子目录。
- **非智能体变体：** 如果你不需要完整的智能体循环，可以完全跳过 `AIAgent`，让处理程序直接通过 `httpx` 发送固定通知。更便宜、更快，且无提供者依赖。

#### 为什么这不是内置功能

Hermes 的早期版本将其作为内置钩子提供，并在每次网关启动时使用裸默认值静默生成一个智能体。这让使用自定义端点的用户感到惊讶，并且对于不知道它正在运行的用户来说，这个功能是不可见的。将其作为一个有文档记录的模式 —— 由你构建，放在你的钩子目录中 —— 意味着你可以清楚地看到它的作用，并通过创建文件来选择启用。

### 工作原理

1. 网关启动时，`HookRegistry.discover_and_load()` 会扫描 `~/.hermes/hooks/`。
2. 包含 `HOOK.yaml` + `handler.py` 的每个子目录都会被动态加载。
3. 处理程序会为其声明的事件注册。
4. 在每个生命周期点，`hooks.emit()` 会触发所有匹配的处理程序。
5. 任何处理程序中的错误都会被捕获并记录 —— 一个损坏的钩子永远不会导致智能体崩溃。

:::info
网关钩子仅在 **网关**（Telegram、Discord、Slack、WhatsApp、Teams）中触发。CLI 不会加载网关钩子。若需要能在任何地方工作的钩子，请使用[插件钩子](#plugin-hooks)。
:::

## 插件钩子

[插件](/user-guide/features/plugins) 可以注册钩子，这些钩子在 **CLI 和网关会话中都会触发**。它们通过插件 `register()` 函数中的 `ctx.register_hook()` 进行编程式注册。

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

- 回调接收**关键字参数**。请始终接受 `**kwargs` 以保持前向兼容性——新参数可能会在未来版本中添加，而不会破坏你的插件。
- 如果回调**崩溃**，会被记录并跳过。其他钩子和智能体会继续正常运行。行为异常的插件永远不会中断智能体。
- 两个钩子的返回值会影响行为：[`pre_tool_call`](#pre_tool_call) 可以**阻止**工具执行，而 [`pre_llm_call`](#pre_llm_call) 可以**向 LLM 调用注入上下文**。所有其他钩子都是“触发即忘”的观察者。

### 快速参考

| 钩子 | 触发时机 | 返回值 |
|------|-----------|---------|
| [`pre_tool_call`](#pre_tool_call) | 任何工具执行前 | `{"action": "block", "message": str}` 以否决调用 |
| [`post_tool_call`](#post_tool_call) | 任何工具返回后 | 忽略 |
| [`pre_llm_call`](#pre_llm_call) | 每轮一次，在工具调用循环开始前 | `{"context": str}` 以在用户消息前添加上下文 |
| [`post_llm_call`](#post_llm_call) | 每轮一次，在工具调用循环结束后 | 忽略 |
| [`on_session_start`](#on_session_start) | 新会话创建时（仅第一轮） | 忽略 |
| [`on_session_end`](#on_session_end) | 会话结束时 | 忽略 |
| [`on_session_finalize`](#on_session_finalize) | CLI/网关终止活动会话时（刷新、保存、统计） | 忽略 |
| [`on_session_reset`](#on_session_reset) | 网关切换到新的会话密钥时（例如 `/new`、`/reset`） | 忽略 |
| [`subagent_stop`](#subagent_stop) | 一个 `delegate_task` 子任务退出时 | 忽略 |
| [`pre_gateway_dispatch`](#pre_gateway_dispatch) | 网关收到用户消息后，在认证和调度前 | `{"action": "skip" \| "rewrite" \| "allow", ...}` 以影响流程 |
| [`pre_approval_request`](#pre_approval_request) | 危险命令需要用户批准，在提示/通知发送前 | 忽略 |
| [`post_approval_response`](#post_approval_response) | 用户响应批准提示（或超时）后 | 忽略 |
| [`transform_tool_result`](#transform_tool_result) | 任何工具返回后，在结果交回模型前 | `str` 以替换结果，`None` 保持不变 |
| [`transform_terminal_output`](#transform_terminal_output) | 在 `terminal` 工具内部，在截断/ANSI清除/过滤前 | `str` 以替换原始输出，`None` 保持不变 |
| [`transform_llm_output`](#transform_llm_output) | 工具调用循环完成后，在最终响应交付前 | `str` 以替换响应文本，`None`/空值 保持不变 |

---

### `pre_tool_call`

在每次工具执行**紧接之前**触发——无论是内置工具还是插件工具。

**回调签名：**

```python
def my_callback(tool_name: str, args: dict, task_id: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `tool_name` | `str` | 即将执行的工具名称（例如 `"terminal"`, `"web_search"`, `"read_file"`） |
| `args` | `dict` | 模型传递给工具的参数 |
| `task_id` | `str` | 会话/任务标识符。如果未设置则为空字符串。 |

**触发位置：** 在 `model_tools.py` 的 `handle_function_call()` 内部，在工具处理器运行前触发。每次工具调用触发一次——如果模型并行调用 3 个工具，则会触发 3 次。

**返回值 — 否决调用：**

```python
return {"action": "block", "message": "工具调用被阻止的原因"}
```

智能体会使用 `message` 作为返回给模型的错误来短路该工具。第一个匹配的阻止指令生效（Python 插件按注册顺序优先，然后是 shell 钩子）。任何其他返回值都会被忽略，因此现有的仅观察回调可以继续不变地工作。

**使用场景：** 日志记录、审计跟踪、工具调用计数器、阻止危险操作、速率限制、基于用户的策略执行。

**示例 — 工具调用审计日志：**

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

**示例 — 对危险工具发出警告：**

```python
DANGEROUS = {"terminal", "write_file", "patch"}

def warn_dangerous(tool_name, **kwargs):
    if tool_name in DANGEROUS:
        print(f"⚠ 正在执行可能有危险的工具：{tool_name}")

def register(ctx):
    ctx.register_hook("pre_tool_call", warn_dangerous)
```

---

### `post_tool_call`

在每次工具执行返回后**紧接之后**触发。

**回调签名：**

```python
def my_callback(tool_name: str, args: dict, result: str, task_id: str,
                duration_ms: int, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `tool_name` | `str` | 刚刚执行的工具名称 |
| `args` | `dict` | 模型传递给工具的参数 |
| `result` | `str` | 工具的返回值（始终是 JSON 字符串） |
| `task_id` | `str` | 会话/任务标识符。如果未设置则为空字符串。 |
| `duration_ms` | `int` | 工具调度所花费的时间，以毫秒为单位（使用 `time.monotonic()` 在 `registry.dispatch()` 前后测量）。 |

**触发位置：** 在 `model_tools.py` 的 `handle_function_call()` 内部，在工具处理器返回后触发。每次工具调用触发一次。如果工具引发了未处理的异常，则**不会**触发（错误被捕获并作为错误 JSON 字符串返回，并且 `post_tool_call` 会以该错误字符串作为 `result` 触发）。

**返回值：** 忽略。

**使用场景：** 记录工具结果、收集指标、跟踪工具成功/失败率、延迟仪表板、基于工具的预算警报、特定工具完成时发送通知。

**示例 — 跟踪工具使用指标：**

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

**每轮触发一次**，在工具调用循环开始之前。这是**唯一使用其返回值的钩子**——它可以将上下文注入当前轮次的用户消息中。

**回调签名：**

```python
def my_callback(session_id: str, user_message: str, conversation_history: list,
                is_first_turn: bool, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 当前会话的唯一标识符 |
| `user_message` | `str` | 本轮用户的原始消息（在任何技能注入之前） |
| `conversation_history` | `list` | 完整消息列表的副本（OpenAI 格式：`[{"role": "user", "content": "..."}]`） |
| `is_first_turn` | `bool` | 如果是新会话的第一轮，则为 `True`；后续轮次为 `False` |
| `model` | `str` | 模型标识符（例如 `"anthropic/claude-sonnet-4.6"`） |
| `platform` | `str` | 会话运行位置：`"cli"`、`"telegram"`、`"discord"` 等 |

**触发位置：** 在 `run_agent.py` 的 `run_conversation()` 内部，在上下文压缩之后、主 `while` 循环之前触发。每次 `run_conversation()` 调用触发一次（即每个用户轮次一次），而不是工具循环内的每次 API 调用一次。

**返回值：** 如果回调返回一个包含 `"context"` 键的字典，或一个非空的普通字符串，则该文本会被附加到当前轮次的用户消息中。返回 `None` 表示不注入。

```python
# 注入上下文
return {"context": "已回忆的记忆：\n- 用户喜欢 Python\n- 正在开发 hermes-agent"}

# 普通字符串（等效）
return "已回忆的记忆：\n- 用户喜欢 Python"

# 不注入
return None
```

**上下文注入位置：** 始终是**用户消息**，而不是系统提示。这保留了提示缓存——系统提示在各轮之间保持不变，因此缓存的令牌会被重用。系统提示是 Hermes 的领域（模型引导、工具强制、个性、技能）。插件在用户输入旁边贡献上下文。

所有注入的上下文都是**临时的**——仅在 API 调用时添加。对话历史中的原始用户消息永远不会被修改，并且不会持久化到会话数据库。

当**多个插件**返回上下文时，它们的输出会按插件发现顺序（按目录名字母顺序）用双换行符连接。

**使用场景：** 记忆回忆、RAG 上下文注入、防护栏、基于轮次的分析。

**示例 — 记忆回忆：**

```python
import httpx

MEMORY_API = "https://your-memory-api.example.com"
```

```python
def recall(session_id, user_message, is_first_turn, **kwargs):
    try:
        resp = httpx.post(f"{MEMORY_API}/recall", json={
            "session_id": session_id,
            "query": user_message,
        }, timeout=3)
        memories = resp.json().get("results", [])
        if not memories:
            return None
        text = "召回的上下文：\n" + "\n".join(f"- {m['text']}" for m in memories)
        return {"context": text}
    except Exception:
        return None

def register(ctx):
    ctx.register_hook("pre_llm_call", recall)
```

**示例 — 守护栏：**

```python
POLICY = "未经用户明确确认，绝不执行删除文件的命令。"

def guardrails(**kwargs):
    return {"context": POLICY}

def register(ctx):
    ctx.register_hook("pre_llm_call", guardrails)
```

---

### `post_llm_call`

**每次对话轮次触发一次**，在工具调用循环完成且智能体已生成最终响应后触发。仅在**成功**的轮次上触发 — 如果轮次被中断则不会触发。

**回调签名：**

```python
def my_callback(session_id: str, user_message: str, assistant_response: str,
                conversation_history: list, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 当前会话的唯一标识符 |
| `user_message` | `str` | 用户在此轮次的原始消息 |
| `assistant_response` | `str` | 智能体在此轮次的最终文本响应 |
| `conversation_history` | `list` | 轮次完成后完整消息列表的副本 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的位置 |

**触发：** 在 `run_agent.py` 的 `run_conversation()` 函数内，工具循环退出并得到最终响应后。受 `if final_response and not interrupted` 条件保护 — 因此当用户在轮次中途中断或智能体在未产生响应的情况下达到迭代限制时，**不会**触发。

**返回值：** 被忽略。

**用例：** 将对话数据同步到外部内存系统、计算响应质量指标、记录轮次摘要、触发后续操作。

**示例 — 同步到外部内存：**

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

**示例 — 跟踪响应长度：**

```python
import logging
logger = logging.getLogger(__name__)

def log_response_length(session_id, assistant_response, model, **kwargs):
    logger.info("响应 会话=%s 模型=%s 字符数=%d",
                session_id, model, len(assistant_response or ""))

def register(ctx):
    ctx.register_hook("post_llm_call", log_response_length)
```

---

### `on_session_start`

**触发一次**，当一个全新的会话被创建时。在会话继续时（即用户在现有会话中发送第二条消息时）**不会**触发。

**回调签名：**

```python
def my_callback(session_id: str, model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 新会话的唯一标识符 |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的位置 |

**触发：** 在 `run_agent.py` 的 `run_conversation()` 函数内，在新会话的第一轮期间 — 具体是在系统提示构建之后、工具循环开始之前。检查条件是 `if not conversation_history`（无先前消息 = 新会话）。

**返回值：** 被忽略。

**用例：** 初始化会话作用域的状态、预热缓存、将会话注册到外部服务、记录会话开始。

**示例 — 初始化会话缓存：**

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

在每次 `run_conversation()` 调用的**最后**触发，无论结果如何。如果智能体在用户退出时仍在处理中，也会从 CLI 的退出处理程序触发。

**回调签名：**

```python
def my_callback(session_id: str, completed: bool, interrupted: bool,
                model: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 会话的唯一标识符 |
| `completed` | `bool` | 如果智能体产生了最终响应，则为 `True`，否则为 `False` |
| `interrupted` | `bool` | 如果轮次被中断（用户发送了新消息、执行了 `/stop` 或退出），则为 `True` |
| `model` | `str` | 模型标识符 |
| `platform` | `str` | 会话运行的位置 |

**触发：** 两个地方：
1.  **`run_agent.py`** — 在每次 `run_conversation()` 调用结束时，所有清理操作之后。即使轮次出错也会触发。
2.  **`cli.py`** — 在 CLI 的 atexit 处理程序中，但**仅当**退出发生时智能体正在处理中（`_agent_running=True`）。这用于捕获处理过程中的 Ctrl+C 和 `/exit`。在这种情况下，`completed=False` 且 `interrupted=True`。

**返回值：** 被忽略。

**用例：** 刷新缓冲区、关闭连接、持久化会话状态、记录会话持续时间、清理在 `on_session_start` 中初始化的资源。

**示例 — 刷新和清理：**

```python
_session_caches = {}

def cleanup_session(session_id, completed, interrupted, **kwargs):
    cache = _session_caches.pop(session_id, None)
    if cache:
        # 将累积的数据刷新到磁盘或外部服务
        status = "已完成" if completed else ("已中断" if interrupted else "失败")
        print(f"会话 {session_id} 结束：{status}，进行了 {cache['tool_calls']} 次工具调用")

def register(ctx):
    ctx.register_hook("on_session_end", cleanup_session)
```

**示例 — 会话持续时间跟踪：**

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
        logger.info("会话持续时间 会话=%s 秒数=%.1f 完成=%s 中断=%s",
                     session_id, duration, completed, interrupted)

def register(ctx):
    ctx.register_hook("on_session_start", on_start)
    ctx.register_hook("on_session_end", on_end)
```

---

### `on_session_finalize`

当 CLI 或网关**拆解**一个活动会话时触发 — 例如，当用户运行 `/new`、网关垃圾回收了一个空闲会话、或者 CLI 在活动智能体存在时退出。这是在会话标识符消失之前刷新与即将退出的会话关联的状态的最后机会。

**回调签名：**

```python
def my_callback(session_id: str | None, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` 或 `None` | 即将退出的会话 ID。如果不存在活动会话，可能为 `None`。 |
| `platform` | `str` | `"cli"` 或消息平台名称（`"telegram"`、`"discord"` 等）。 |

**触发：** 在 `cli.py`（执行 `/new` / CLI 退出时）和 `gateway/run.py`（会话被重置或垃圾回收时）。在网关端，总是与 `on_session_reset` 配对。

**返回值：** 被忽略。

**用例：** 在会话 ID 被丢弃前持久化最终会话指标、关闭每个会话的资源、发出最终遥测事件、排空已排队的写入。

---

### `on_session_reset`

当网关**为活动聊天换入新的会话密钥**时触发 — 用户调用了 `/new`、`/reset`、`/clear`，或者适配器在空闲窗口后选择了一个新的会话。这允许插件在不等待下一个 `on_session_start` 的情况下响应对话状态已被清除这一事实。

**回调签名：**

```python
def my_callback(session_id: str, platform: str, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `session_id` | `str` | 新会话的 ID（已轮换为新值）。 |
| `platform` | `str` | 消息平台名称。 |

**触发：** 在 `gateway/run.py` 中，在新会话密钥分配后、处理下一个入站消息之前立即触发。在网关上，顺序是：`on_session_finalize(old_id)` → 换入 → `on_session_reset(new_id)` → 第一个入站轮次触发 `on_session_start(new_id)`。

**返回值：** 被忽略。

**用例：** 重置以 `session_id` 为键的每个会话缓存、发出“会话已轮换”分析事件、预热一个新的状态桶。

---

参见 **[构建插件指南](/guides/build-a-hermes-plugin)** 以获取完整的演练，包括工具模式、处理器和高级钩子模式。

---

### `subagent_stop`

在 `delegate_task` 完成后，**每个子智能体触发一次**。无论你是委托了一个任务还是三个任务的一批，这个钩子都会为每个子智能体触发一次，在父线程上序列化。

**回调签名：**

```python
def my_callback(parent_session_id: str, child_role: str | None,
                child_summary: str | None, child_status: str,
                duration_ms: int, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `parent_session_id` | `str` | 委派父智能体的会话 ID |
| `child_role` | `str \| None` | 设置在子智能体上的编排器角色标签（如果未启用该功能则为 `None`） |
| `child_summary` | `str \| None` | 子智能体返回给父智能体的最终响应 |
| `child_status` | `str` | `"completed"`、`"failed"`、`"interrupted"` 或 `"error"` |
| `duration_ms` | `int` | 运行子智能体消耗的壁钟时间，单位为毫秒 |

**触发时机：** 在 `tools/delegate_tool.py` 中，`ThreadPoolExecutor.as_completed()` 清空所有子任务后触发。触发操作被编排到父线程中，因此钩子作者无需处理并发回调执行。

**返回值：** 忽略。

**使用场景：** 记录编排活动、累加子任务时长用于计费、编写委派后的审计记录。

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
在重度委派场景下（例如编排器角色 × 5 个叶节点 × 嵌套深度），`subagent_stop` 每个轮次会触发多次。请保持您的回调函数快速执行；将耗时操作推送到后台队列。
:::

---

### `pre_gateway_dispatch`

在网关中，**每收到一个 `MessageEvent`** 时触发一次，在内部事件守卫之后、认证/配对和智能体分派**之前**。这是网关级别消息流策略（只监听窗口、人工接管、每聊天路由等）的拦截点，这些策略无法干净地归入任何单一平台适配器。

**回调签名：**

```python
def my_callback(event, gateway, session_store, **kwargs):
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `event` | `MessageEvent` | 规范化的入站消息（具有 `.text`、`.source`、`.message_id`、`.internal` 等属性）。 |
| `gateway` | `GatewayRunner` | 活跃的网关运行器，以便插件可以调用 `gateway.adapters[platform].send(...)` 进行侧信道回复（所有者通知等）。 |
| `session_store` | `SessionStore` | 用于通过 `session_store.append_to_transcript(...)` 进行静默记录转录。 |

**触发时机：** 在 `gateway/run.py` 中的 `GatewayRunner._handle_message()` 内部，在计算 `is_internal` 之后立即触发。**内部事件会完全跳过此钩子**（它们是系统生成的——后台进程完成等——不应被面向用户的策略所限制）。

**返回值：** `None` 或一个字典。第一个被识别的动作字典生效；其余插件结果将被忽略。插件回调中的异常会被捕获并记录；网关在发生错误时总是会回退到正常分派流程。

| 返回值 | 效果 |
|--------|------|
| `{"action": "skip", "reason": "..."}` | 丢弃消息——不回复智能体，不进行配对流程，不进行认证。假定插件已处理该消息（例如，静默记录到转录中）。 |
| `{"action": "rewrite", "text": "new text"}` | 替换 `event.text`，然后使用修改后的事件继续正常分派。适用于将缓冲的环境消息折叠成单个提示。 |
| `{"action": "allow"}` / `None` | 正常分派——运行完整的认证/配对/智能体循环链。 |

**使用场景：** 只监听的群聊（仅在被@时回复；将环境消息缓冲到上下文中）；人工接管（当所有者手动处理聊天时静默记录客户消息）；按配置文件限速；策略驱动的路由。

**示例 —— 静默拒绝未经授权的私信，不触发配对代码：**

```python
def deny_unauthorized_dms(event, **kwargs):
    src = event.source
    if src.chat_type == "dm" and not _is_approved_user(src.user_id):
        return {"action": "skip", "reason": "unauthorized-dm"}
    return None

def register(ctx):
    ctx.register_hook("pre_gateway_dispatch", deny_unauthorized_dms)
```

**示例 —— 在提及时将环境消息缓冲重写为单个提示：**

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

在批准请求显示给用户**之前**立即触发——覆盖所有界面：交互式 CLI、Ink TUI、网关平台（Telegram、Discord、Slack、WhatsApp、Matrix 等）以及 ACP 客户端（VS Code、Zed、JetBrains）。

这里是接入自定义通知器的合适位置——例如，一个弹出允许/拒绝通知的 macOS 菜单栏应用，或者一个记录每个批准请求及上下文的审计日志。

**回调签名：**

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
| `command` | `str` | 等待批准的 Shell 命令 |
| `description` | `str` | 命令被标记的人类可读原因（多个模式匹配时合并） |
| `pattern_key` | `str` | 触发批准的主要模式键（例如 `"rm_rf"`、`"sudo"`） |
| `pattern_keys` | `list[str]` | 所有匹配的模式键 |
| `session_key` | `str` | 会话标识符，可用于按聊天范围限制通知 |
| `surface` | `str` | `"cli"` 表示交互式 CLI/TUI 提示，`"gateway"` 表示异步平台批准 |

**返回值：** 忽略。此处的钩子仅是观察性的；它们不能否决或预先回答批准请求。使用 [`pre_tool_call`](#pre_tool_call) 来阻止工具进入批准系统。

**使用场景：** 桌面通知、推送警报、审计日志、Slack Webhook、升级路由、指标统计。

**示例 —— macOS 桌面通知：**

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

在用户响应批准提示（或提示超时）**之后**触发。

**回调签名：**

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

与 `pre_approval_request` 相同的关键字参数，加上：

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `choice` | `str` | `"once"`、`"session"`、`"always"`、`"deny"` 或 `"timeout"` 之一 |

**返回值：** 忽略。

**使用场景：** 关闭匹配的桌面通知、在审计日志中记录最终决策、更新指标、推进限速器。

```python
def log_decision(command, choice, session_key, **kwargs):
    logger.info("approval %s: %s for session %s", choice, command[:60], session_key)

def register(ctx):
    ctx.register_hook("post_approval_response", log_decision)
```

---

### `transform_tool_result`

在工具返回**之后**、结果附加到对话**之前**触发。允许插件重写**任何**工具的结果字符串——而不仅仅是终端输出——在模型看到它之前。

**回调签名：**

```python
def my_callback(
    tool_name: str,
    arguments: dict,
    result: str,
    task_id: str | None,
    **kwargs,
) -> str | None:
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `tool_name` | `str` | 产生结果的工具（`read_file`、`web_extract`、`delegate_task` 等）。 |
| `arguments` | `dict` | 模型调用该工具时使用的参数。 |
| `result` | `str` | 工具的原始结果字符串，经过截断和 ANSI 清除处理后。 |
| `task_id` | `str \| None` | 在 RL/基准测试环境中运行时的任务/会话 ID。 |

**返回值：** `str` 用于替换结果（返回的字符串就是模型看到的内容），`None` 表示保持不变。

**使用场景：** 从 `web_extract` 输出中编辑组织特定的 PII；在冗长的 JSON 工具响应中添加摘要头；在 `read_file` 结果中注入检索增强提示；将 `delegate_task` 子智能体报告重写为项目特定的 schema。

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

适用于每个工具。如需仅重写终端输出，请参见下面的 `transform_terminal_output` —— 它范围更窄，且在管道中更早执行（在截断和编辑之前）。

---

### `transform_terminal_output`

在 `terminal` 工具的前台输出管道中触发，在默认的 50 KB 截断、ANSI 清除和密钥编辑**之前**。允许插件在任何下游处理接触它之前，重写 Shell 命令的原始 stdout/stderr。

**回调签名：**

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

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `command` | `str` | 生成输出的 shell 命令。 |
| `output` | `str` | 原始合并的 stdout/stderr 输出（可能非常大 —— 截断在钩子之后发生）。 |
| `exit_code` | `int` | 进程退出码。 |
| `cwd` | `str` | 命令运行时的工作目录。 |

**返回值：** `str` 用于替换输出，`None` 表示保持不变。

**使用场景：** 为产生大量输出的命令（`du -ah`、`find`、`tree`）注入摘要，使用项目特定标记标记输出以便下游钩子知道如何处理，剥离在不同运行间波动且破坏提示缓存的计时噪声。

```python
def summarize_find(command, output, **kwargs):
    if command.startswith("find ") and len(output) > 50_000:
        lines = output.count("\n")
        head = "\n".join(output.splitlines()[:40])
        return f"{head}\n\n[摘要：共 {lines} 个路径，显示前 40 个]"
    return None

def register(ctx):
    ctx.register_hook("transform_terminal_output", summarize_find)
```

与 `transform_tool_result` 配合良好（后者覆盖所有其他工具）。

---

### `transform_llm_output`

在工具调用循环完成且模型生成最终响应**之后**、该响应发送给用户（CLI、网关或编程调用者）**之前**，**每次对话轮次触发一次**。允许插件使用经典编程方法重写助手的最终文本 —— 无需消耗额外的推理 token 来生成 SOUL 风格文本或技能驱动的转换。

**回调签名：**

```python
def my_callback(
    response_text: str,
    session_id: str,
    model: str,
    platform: str,
    **kwargs,
) -> str | None:
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `response_text` | `str` | 该轮次助手的最终响应文本。 |
| `session_id` | `str` | 本次对话的会话 ID（一次性运行时可能为空）。 |
| `model` | `str` | 生成响应的模型名称（例如 `anthropic/claude-sonnet-4.6`）。 |
| `platform` | `str` | 传递平台（`cli`、`telegram`、`discord` 等；未设置时为空）。 |

**返回值：** 非空 `str` 用于替换响应文本，`None` 或空字符串表示保持不变。**当多个插件注册时，第一个非空字符串获胜** —— 与 `transform_tool_result` 类似。

**使用场景：** 应用个性/词汇转换（海盗语、海绵宝宝风格），从最终文本中编辑用户特定标识符，附加项目特定的签名页脚，在不消耗 SOUL 指令 token 的情况下强制执行内部风格指南。

```python
import os, re

def spongebob(response_text, **kwargs):
    if os.environ.get("SPONGEBOB_MODE") != "on":
        return None  # 原样通过
    return re.sub(r"!", "!! 塔塔酱!", response_text)

def register(ctx):
    ctx.register_hook("transform_llm_output", spongebob)
```

该钩子在非空、非中断的响应上进行保护 —— 在停止按钮中断或空轮次时不会触发。异常被记录为警告，不会中断智能体执行。

---

## Shell Hooks

在 `cli-config.yaml` 中声明 shell 脚本钩子，Hermes 会在对应的插件钩子事件触发时，将它们作为子进程运行——无论是在 CLI 还是网关会话中。无需编写 Python 插件。

当你想要一个即插即用的单文件脚本（Bash、Python 或任何带 shebang 的脚本）时，可以使用 shell 钩子来：

- **阻止工具调用** — 拒绝危险的 `terminal` 命令，强制执行每目录策略，要求对破坏性的 `write_file` / `patch` 操作进行审批。
- **在工具调用后运行** — 自动格式化智能体刚刚写入的 Python 或 TypeScript 文件，记录 API 调用，触发 CI 工作流。
- **为下一次 LLM 轮次注入上下文** — 将 `git status` 输出、当前星期几或检索到的文档预置到用户消息前（参见 [`pre_llm_call`](#pre_llm_call)）。
- **观察生命周期事件** — 当子智能体完成 (`subagent_stop`) 或会话开始 (`on_session_start`) 时写入日志行。

Shell 钩子通过在 CLI 启动 (`hermes_cli/main.py`) 和网关启动 (`gateway/run.py`) 时调用 `agent.shell_hooks.register_from_config(cfg)` 进行注册。它们与 Python 插件钩子自然组合——两者都通过相同的调度器流程处理。

### 一览式比较

| 维度 | Shell 钩子 | [插件钩子](#plugin-hooks) | [网关钩子](#gateway-event-hooks) |
|-----------|-------------|-------------------------------|---------------------------------------|
| 声明于 | `~/.hermes/config.yaml` 中的 `hooks:` 代码块 | `plugin.yaml` 插件中的 `register()` | `HOOK.yaml` + `handler.py` 目录 |
| 存放在 | `~/.hermes/agent-hooks/` (按惯例) | `~/.hermes/plugins/<name>/` | `~/.hermes/hooks/<name>/` |
| 语言 | 任意 (Bash, Python, Go 二进制文件, …) | 仅 Python | 仅 Python |
| 运行于 | CLI + 网关 | CLI + 网关 | 仅网关 |
| 事件 | `VALID_HOOKS` (包括 `subagent_stop`) | `VALID_HOOKS` | 网关生命周期 (`gateway:startup`, `agent:*`, `command:*`) |
| 能阻止工具调用 | 是 (`pre_tool_call`) | 是 (`pre_tool_call`) | 否 |
| 能注入 LLM 上下文 | 是 (`pre_llm_call`) | 是 (`pre_llm_call`) | 否 |
| 同意方式 | 首次使用时针对每个 `(事件, 命令)` 对进行提示 | 隐式 (信任 Python 插件) | 隐式 (信任目录) |
| 进程间隔离 | 是 (子进程) | 否 (进程内) | 否 (进程内) |

### 配置 schema

```yaml
hooks:
  <event_name>:                  # 必须在 VALID_HOOKS 中
    - matcher: "<regex>"         # 可选；仅用于 pre/post_tool_call
      command: "<shell command>" # 必需；通过 shlex.split 运行，shell=False
      timeout: <seconds>         # 可选；默认 60，上限 300

hooks_auto_accept: false         # 参见下面的“同意模型”
```

事件名称必须是 [插件钩子事件](#plugin-hooks) 之一；拼写错误会产生“您是指 X 吗？”的警告并被跳过。单个条目内的未知键会被忽略；缺少 `command` 会产生警告并跳过。`timeout > 300` 会被限制并发出警告。

### JSON 传输协议

每次事件触发时，Hermes 为每个匹配的钩子（如果匹配器存在）生成一个子进程，将 JSON 有效载荷通过管道传给 **stdin**，并将 **stdout** 读回作为 JSON。

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

对于非工具事件（`pre_llm_call`, `subagent_stop`, 会话生命周期），`tool_name` 和 `tool_input` 为 `null`。`extra` 字典包含所有事件特定的 kwargs（`user_message`, `conversation_history`, `child_role`, `duration_ms`, …）。无法序列化的值会被字符串化而非省略。

**stdout — 可选响应：**

```jsonc
// 阻止 pre_tool_call (两种形式都接受；内部标准化):
{"decision": "block", "reason":  "Forbidden: rm -rf"}   // Claude-Code 风格
{"action":   "block", "message": "Forbidden: rm -rf"}   // Hermes 规范

// 为 pre_llm_call 注入上下文:
{"context": "Today is Friday, 2026-04-17"}

// 静默空操作 — 任何空/不匹配的输出都可以：
```

格式错误的 JSON、非零退出代码和超时会记录警告，但绝不会中止智能体循环。

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

智能体对文件的上下文视图**不会**自动重新读取——重新格式化仅影响磁盘上的文件。后续的 `read_file` 调用会获取格式化后的版本。

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

#### 3. 为每次轮次注入 `git status` (等同于 Claude-Code 的 `UserPromptSubmit`)

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

Claude Code 的 `UserPromptSubmit` 事件有意不作为一个单独的 Hermes 事件——`pre_llm_call` 在相同位置触发，并且已经支持上下文注入。在此处使用它。

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

### 同意模型

每个唯一的 `(事件, 命令)` 对在 Hermes 首次看到时会提示用户批准，然后将决定持久化到 `~/.hermes/shell-hooks-allowlist.json`。后续运行（CLI 或网关）会跳过提示。

有三种逃生通道可以绕过交互式提示——任何一种都足够：

1.  CLI 上的 `--accept-hooks` 标志（例如 `hermes --accept-hooks chat`）
2.  `HERMES_ACCEPT_HOOKS=1` 环境变量
3.  `cli-config.yaml` 中的 `hooks_auto_accept: true`

非 TTY 运行（网关、cron、CI）需要这三种方式之一——否则任何新添加的钩子都会保持未注册状态并记录警告。

**脚本编辑会被静默信任。** 允许列表键基于确切的命令字符串，而不是脚本的哈希，因此在磁盘上编辑脚本不会使同意失效。`hermes hooks doctor` 会标记 mtime 漂移，以便您可以发现编辑并决定是否重新批准。

### `hermes hooks` CLI 命令

| 命令 | 作用 |
|---------|--------------|
| `hermes hooks list` | 转储已配置的钩子，包括匹配器、超时和同意状态 |
| `hermes hooks test <event> [--for-tool X] [--payload-file F]` | 对合成有效载荷触发每个匹配的钩子，并打印解析后的响应 |
| `hermes hooks revoke <command>` | 移除匹配 `<command>` 的每个允许列表条目（下次重启后生效） |
| `hermes hooks doctor` | 对于每个已配置的钩子：检查执行位、允许列表状态、mtime 漂移、JSON 输出有效性和大致执行时间 |

### 安全

Shell 钩子以**您完整的用户凭据**运行——与 cron 条目或 shell 别名具有相同的信任边界。将 `config.yaml` 中的 `hooks:` 代码块视为特权配置：

-   仅引用您编写或完全审查过的脚本。
-   将脚本保存在 `~/.hermes/agent-hooks/` 中，以便于审计路径。
-   在拉取共享配置后重新运行 `hermes hooks doctor`，以便在它们注册之前发现新添加的钩子。
-   如果您的 config.yaml 在团队中进行版本控制，请像审查 CI 配置一样审查更改 `hooks:` 部分的 PR。

### 顺序和优先级

Python 插件钩子和 shell 钩子都通过相同的 `invoke_hook()` 调度器。Python 插件首先注册 (`discover_and_load()`)，shell 钩子其次 (`register_from_config()`)，因此在平局情况下，Python `pre_tool_call` 阻止决策具有优先权。第一个有效的阻止获胜——一旦任何回调产生 `{"action": "block", "message": str}` 且消息非空，聚合器就会立即返回。