---
sidebar_position: 7
title: "网关内部机制"
description: "消息网关如何启动、授权用户、路由会话及传递消息"
---

# 网关内部机制

消息网关是一个持续运行的进程，通过统一架构将 Hermes 连接到 20 多个外部消息平台。

## 核心文件

| 文件 | 用途 |
|------|---------|
| `gateway/run.py` | `GatewayRunner` — 主循环、斜杠命令、消息分发（大型文件；请通过 git 查看当前代码行数） |
| `gateway/session.py` | `SessionStore` — 会话持久化与会话密钥构建 |
| `gateway/delivery.py` | 向目标平台/频道进行消息出站传递 |
| `gateway/pairing.py` | 用户授权的私信配对流程 |
| `gateway/channel_directory.py` | 将聊天 ID 映射为人类可读名称以支持定时任务投递 |
| `gateway/hooks.py` | 钩子的发现、加载与生命周期事件分发 |
| `gateway/mirror.py` | 针对 `send_message` 的跨会话消息镜像 |
| `gateway/status.py` | 配置文件作用域网关实例的令牌锁管理 |
| `gateway/builtin_hooks/` | 用于始终注册钩子的扩展点（当前无内置钩子） |
| `gateway/platforms/` | 平台适配器（每个消息平台对应一个适配器） |

## 架构概述

```text
┌─────────────────────────────────────────────────┐
│                  GatewayRunner                  │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Telegram │  │ Discord  │  │  Slack   │       │
│  │ Adapter  │  │ Adapter  │  │ Adapter  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │
│       └─────────────┼─────────────┘             │
│                     ▼                           │
│              _handle_message()                  │
│                     │                           │
│         ┌───────────┼───────────┐               │
│         ▼           ▼           ▼               │
│  Slash command   AIAgent    Queue/BG            │
│    dispatch      creation   sessions            │
│                     │                           │
│                     ▼                           │
│                 SessionStore                    │
│              (SQLite 持久化)                     │
└───────┴─────────────┴─────────────┴─────────────┘
```

## 消息流

当消息从任何平台到达时：

1.  **平台适配器**接收原始事件，将其标准化为 `MessageEvent`
2.  **基础适配器**检查活跃会话守卫：
    -   如果该会话正在运行智能体 → 将消息加入队列，设置中断事件
    -   如果是 `/approve`、`/deny`、`/stop` → 绕过守卫（内联派发）
3.  **GatewayRunner._handle_message()** 接收事件：
    -   通过 `_session_key_for_source()` 解析会话键（格式：`agent:main:{platform}:{chat_type}:{chat_id}`）
    -   检查授权（参见下文授权部分）
    -   检查是否为斜杠命令 → 派发给命令处理器
    -   检查智能体是否已在运行 → 拦截 `/stop`、`/status` 等命令
    -   否则 → 创建 `AIAgent` 实例并运行对话
4.  **响应**通过平台适配器发回

### 会话键格式

会话键编码完整的路由上下文：

```
agent:main:{platform}:{chat_type}:{chat_id}
```

例如：`agent:main:telegram:private:123456789`

线程感知平台（Telegram论坛主题、Discord线程、Slack线程）可能在 chat_id 部分包含线程ID。**切勿手动构建会话键** —— 始终使用 `gateway/session.py` 中的 `build_session_key()`。

### 两级消息守卫

当智能体正在运行时，传入的消息会经过两个连续的守卫：

1.  **第一级 — 基础适配器** (`gateway/platforms/base.py`)：检查 `_active_sessions`。如果会话活跃，将消息加入 `_pending_messages` 队列并设置中断事件。这会在消息到达网关运行器之前捕获它们。
2.  **第二级 — 网关运行器** (`gateway/run.py`)：检查 `_running_agents`。拦截特定命令（`/stop`、`/new`、`/queue`、`/status`、`/approve`、`/deny`）并进行相应路由。其他所有消息都会触发 `running_agent.interrupt()`。

必须在智能体阻塞时到达运行器的命令（如 `/approve`）通过 `await self._message_handler(event)` **内联**派发——它们绕过后台任务系统以避免竞争条件。

## 授权

网关使用多层授权检查，按顺序评估：

1.  **每平台允许所有标志**（例如 `TELEGRAM_ALLOW_ALL_USERS`）—— 如果设置，则该平台上的所有用户均被授权
2.  **平台白名单**（例如 `TELEGRAM_ALLOWED_USERS`）—— 逗号分隔的用户ID列表
3.  **私聊配对** —— 已认证用户可以通过配对码配对新用户
4.  **全局允许所有** (`GATEWAY_ALLOW_ALL_USERS`) —— 如果设置，则所有平台上的所有用户均被授权
5.  **默认：拒绝** —— 未授权用户被拒绝

### 私聊配对流程

```text
管理员：/pair
网关：“配对码：ABC123。请与用户分享。”
新用户：ABC123
网关：“配对成功！您现在已被授权。”
```

配对状态持久化在 `gateway/pairing.py` 中，并且在重启后依然有效。

## 斜杠命令派发

网关中的所有斜杠命令都经过相同的解析管道：

1.  `hermes_cli/commands.py` 中的 `resolve_command()` 将输入映射到规范名称（处理别名、前缀匹配）
2.  规范名称与 `GATEWAY_KNOWN_COMMANDS` 进行检查
3.  `_handle_message()` 中的处理器根据规范名称进行派发
4.  一些命令受到配置门控（`CommandDef` 上的 `gateway_config_gate`）

### 运行中智能体守卫

在智能体处理期间不得执行的命令会被提前拒绝：

```python
if _quick_key in self._running_agents:
    if canonical == "model":
        return "⏳ Agent is running — wait for it to finish or /stop first."
```

绕过命令（`/stop`、`/new`、`/approve`、`/deny`、`/queue`、`/status`）有特殊处理。

## 配置源

网关从多个源读取配置：

| 源 | 提供内容 |
|---|---|
| `~/.hermes/.env` | API 密钥、机器人令牌、平台凭证 |
| `~/.hermes/config.yaml` | 模型设置、工具配置、显示选项 |
| 环境变量 | 覆盖上述任何配置 |

与CLI（使用带有硬编码默认值的 `load_cli_config()`）不同，网关通过YAML加载器直接读取 `config.yaml`。这意味着存在于CLI默认值字典中但不存在于用户配置文件中的配置键，在CLI和网关之间可能表现不同。

## 平台适配器

每个消息平台在 `gateway/platforms/` 中都有一个适配器：

```text
gateway/platforms/
├── base.py              # BaseAdapter — 所有平台的共享逻辑
├── telegram.py          # Telegram Bot API（长轮询或Webhook）
├── discord.py           # 通过discord.py实现的Discord机器人
├── slack.py             # Slack Socket模式
├── whatsapp.py          # WhatsApp Business Cloud API
├── signal.py            # 通过signal-cli REST API实现的Signal
├── matrix.py            # 通过mautrix实现的Matrix（可选端到端加密）
├── mattermost.py        # Mattermost WebSocket API
├── email.py             # 通过IMAP/SMTP实现的电子邮件
├── sms.py               # 通过Twilio实现的短信
├── dingtalk.py          # 钉钉WebSocket
├── feishu.py            # 飞书/Lark WebSocket或Webhook
├── wecom.py             # 企业微信回调
├── weixin.py            # 微信（个人）通过iLink Bot API实现
├── bluebubbles.py       # 通过BlueBubbles macOS服务器实现的Apple iMessage
├── qqbot/               # QQ机器人（腾讯QQ）通过官方API v2实现（子包：adapter.py, crypto.py, keyboards.py, …）
├── yuanbao.py           # 元宝（腾讯）私聊/群组适配器
├── feishu_comment.py    # 飞书文档/云盘评论回复处理器
├── msgraph_webhook.py   # Microsoft Graph变更通知Webhook（Teams、Outlook等）
├── webhook.py           # 入站/出站Webhook适配器
├── api_server.py        # REST API服务器适配器
└── homeassistant.py     # Home Assistant会话集成
```

适配器实现了一个通用接口：
-   `connect()` / `disconnect()` — 生命周期管理
-   `send_message()` — 出站消息传递
-   `on_message()` — 入站消息标准化 → `MessageEvent`

### 令牌锁

使用唯一凭证连接的适配器在 `connect()` 中调用 `acquire_scoped_lock()`，并在 `disconnect()` 中调用 `release_scoped_lock()`。这可以防止两个配置文件同时使用相同的机器人令牌。

## 传递路径

出站传递 (`gateway/delivery.py`) 处理：

-   **直接回复** — 将响应发送回原始聊天
-   **主渠道传递** — 将定时任务输出和后台结果路由到配置的主渠道
-   **显式目标传递** — `send_message` 工具指定 `telegram:-1001234567890`
-   **跨平台传递** — 将消息传递到与原始消息不同的平台

定时任务传递不会镜像到网关会话历史记录中——它们只存在于自己的定时任务会话中。这是一个刻意的设计选择，以避免消息交替违规。

## 钩子

网关钩子是响应生命周期事件的Python模块：

### 网关钩子事件

| 事件 | 触发时机 |
|---|---|
| `gateway:startup` | 网关进程启动时 |
| `session:start` | 新对话会话开始时 |
| `session:end` | 会话完成或超时时 |
| `session:reset` | 用户使用 `/new` 重置会话时 |
| `agent:start` | 智能体开始处理消息时 |
| `agent:step` | 智能体完成一次工具调用迭代时 |
| `agent:end` | 智能体完成并返回响应时 |
| `command:*` | 执行任何斜杠命令时 |

钩子从 `gateway/builtin_hooks/`（一个扩展点——在分发的当前版本中为空；`_register_builtin_hooks()` 是一个无操作存根）和 `~/.hermes/hooks/`（用户安装）发现。每个钩子是一个包含 `HOOK.yaml` 清单和 `handler.py` 的目录。

## 内存提供商集成

当启用内存提供商插件（例如 Honcho）时：

1.  网关为每条消息创建一个带会话ID的 `AIAgent`
2.  `MemoryManager` 使用会话上下文初始化提供商
3.  提供商工具（例如 `honcho_profile`、`viking_search`）通过以下路径路由：

```text
AIAgent._invoke_tool()
  → self._memory_manager.handle_tool_call(name, args)
    → provider.handle_tool_call(name, args)
```

4.  在会话结束/重置时，触发 `on_session_end()` 以进行清理和最终数据刷新

### 内存刷新生命周期

当会话被重置、恢复或过期时：
1.  内置内存被刷新到磁盘
2.  内存提供商的 `on_session_end()` 钩子被触发
3.  一个临时的 `AIAgent` 运行一次仅内存相关的对话轮次
4.  随后，上下文被丢弃或归档

## 后台维护

网关在处理消息的同时运行定期维护：

-   **定时任务执行** — 检查任务计划并触发到期任务
-   **会话过期** — 在超时后清理废弃的会话
-   **内存刷新** — 在会话过期前主动刷新内存
-   **缓存刷新** — 刷新模型列表和提供商状态

## 进程管理

网关作为一个长期运行的进程，通过以下方式管理：

-   `hermes gateway start` / `hermes gateway stop` — 手动控制
-   `systemctl`（Linux）或 `launchctl`（macOS）— 服务管理
-   PID 文件位于 `~/.hermes/gateway.pid` — 基于配置文件的进程跟踪

**基于配置文件与全局**：`start_gateway()` 使用基于配置文件的PID文件。`hermes gateway stop` 仅停止当前配置文件的网关。`hermes gateway stop --all` 使用全局 `ps aux` 扫描来终止所有网关进程（用于更新期间）。

## 相关文档

-   [会话存储](./session-storage.md)
-   [定时任务内部机制](./cron-internals.md)
-   [ACP 内部机制](./acp-internals.md)
-   [智能体循环内部机制](./agent-loop.md)
-   [消息网关（用户指南）](/docs/user-guide/messaging)