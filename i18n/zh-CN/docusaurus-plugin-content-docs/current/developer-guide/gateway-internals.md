---
sidebar_position: 7
title: "Gateway Internals"
description: "How the messaging gateway boots, authorizes users, routes sessions, and delivers messages"
---

# 网关内部机制

消息网关是一个长期运行的进程，通过统一的架构将 Hermes 连接到 20 多个外部消息平台。

## 关键文件

| 文件 | 用途 |
|------|---------|
| `gateway/run.py` | `GatewayRunner` — 主循环、斜杠命令、消息分发（大型文件；请查看 git 获取当前代码行数） |
| `gateway/session.py` | `SessionStore` — 会话持久化和会话密钥构建 |
| `gateway/delivery.py` | 向目标平台/频道发送出站消息 |
| `gateway/ping.py` | 用于用户授权的 DM 配对流程 |
| `gateway/channel_directory.py` | 将聊天 ID 映射为可读名称，用于 cron 投递 |
| `gateway/hooks.py` | Hook 发现、加载和生命周期事件分发 |
| `gateway/mirror.py` | 跨会话消息镜像，用于 `send_message` |
| `gateway/status.py` | 作用域为配置文件的网关实例的令牌锁管理 |
| `gateway/builtin_hooks/` | 用于始终注册的 Hook 的扩展点（未附带任何内置 Hook） |
| `gateway/platforms/` | 平台适配器（每个消息平台一个） |

## 架构概览

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
│              (SQLite persistence)               │
└───────┴─────────────┴─────────────┴─────────────┘
```

## 消息流转

当消息从任意平台到达时：

1. **平台适配器**接收原始事件，将其标准化为 `MessageEvent`
2. **基础适配器**检查活跃会话守卫：
   - 如果该会话有智能体正在运行 → 将消息入队，设置中断事件
   - 如果是 `/approve`、`/deny`、`/stop` → 绕过守卫（内联调度）
3. **GatewayRunner._handle_message()** 接收事件：
   - 通过 `_session_key_for_source()` 解析会话键（格式：`agent:main:{platform}:{chat_type}:{chat_id}`）
   - 检查授权（见下文授权章节）
   - 检查是否为斜杠命令 → 调度到命令处理器
   - 检查智能体是否已在运行 → 拦截 `/stop`、`/status` 等命令
   - 否则 → 创建 `AIAgent` 实例并运行对话
4. **响应**通过平台适配器发回

### 会话键格式

会话键编码了完整的路由上下文：

```
agent:main:{platform}:{chat_type}:{chat_id}
```

例如：`agent:main:telegram:private:123456789`

支持线程感知的平台（Telegram 论坛话题、Discord 线程、Slack 线程）可能会在 chat_id 部分包含线程 ID。**永远不要手动构造会话键** — 始终使用 `gateway/session.py` 中的 `build_session_key()`。

### 两级消息守卫

当智能体正在运行时，传入消息需要通过两个顺序守卫：

1. **第 1 级 — 基础适配器**（`gateway/platforms/base.py`）：检查 `_active_sessions`。如果会话处于活跃状态，将消息放入 `_pending_messages` 队列并设置中断事件。这在消息到达网关运行器*之前*将其拦截。

2. **第 2 级 — 网关运行器**（`gateway/run.py`）：检查 `_running_agents`。拦截特定命令（`/stop`、`/new`、`/queue`、`/status`、`/approve`、`/deny`）并适当路由。其他所有情况触发 `running_agent.interrupt()`。

必须在智能体阻塞时到达运行器的命令（如 `/approve`）通过 `await self._message_handler(event)` **内联**调度 — 它们绕过后台任务系统以避免竞态条件。

## 授权

网关使用多层授权检查，按顺序评估：

1. **每平台允许所有用户标志**（如 `TELEGRAM_ALLOW_ALL_USERS`）— 如果设置，该平台的所有用户都被授权
2. **平台允许列表**（如 `TELEGRAM_ALLOWED_USERS`）— 逗号分隔的用户 ID
3. **DM 配对** — 已认证用户可以通过配对码配对新用户
4. **全局允许所有用户**（`GATEWAY_ALLOW_ALL_USERS`）— 如果设置，所有平台的所有用户都被授权
5. **默认：拒绝** — 未授权用户被拒绝

### DM 配对流程

```text
管理员：/pair
网关："配对码：ABC123。与用户分享。"
新用户：ABC123
网关："配对成功！你已获得授权。"
```

配对状态持久化存储在 `gateway/pairing.py` 中，重启后仍然保留。

## 斜杠命令调度

网关中的所有斜杠命令都流经相同的解析管道：

1. `hermes_cli/commands.py` 中的 `resolve_command()` 将输入映射到规范名称（处理别名、前缀匹配）
2. 对照 `GATEWAY_KNOWN_COMMANDS` 检查规范名称
3. `_handle_message()` 中的处理器根据规范名称调度
4. 部分命令受配置限制（`CommandDef` 上的 `gateway_config_gate`）

### 运行中智能体守卫

智能体处理期间**不得执行**的命令会被提前拒绝：

```python
if _quick_key in self._running_agents:
    if canonical == "model":
        return "⏳ 智能体正在运行 — 等待其完成或先执行 /stop。"
```

绕过命令（`/stop`、`/new`、`/approve`、`/deny`、`/queue`、`/status`）有特殊处理。

## 配置来源

网关从多个来源读取配置：

| 来源 | 提供内容 |
|--------|---------|
| `~/.hermes/.env` | API 密钥、机器人令牌、平台凭证 |
| `~/.hermes/config.yaml` | 模型设置、工具配置、显示选项 |
| 环境变量 | 覆盖以上任何内容 |

与 CLI（使用带有硬编码默认值的 `load_cli_config()`）不同，网关直接通过 YAML 加载器读取 `config.yaml`。这意味着存在于 CLI 默认字典中但不在用户配置文件中的配置键，在 CLI 和网关之间可能表现不同。

## 平台适配器

大多数消息平台作为 `plugins/platforms/<name>/adapter.py` 下的插件适配器发布；少数旧版适配器仍直接位于 `gateway/platforms/` 中。所有适配器都扩展自 `gateway/platforms/base.py` 中的 `BasePlatformAdapter`：

```text
plugins/platforms/                  # 插件打包的适配器（各一个目录）
├── telegram/adapter.py     # Telegram Bot API（长轮询或 webhook）
├── discord/adapter.py      # 通过 discord.py 的 Discord 机器人
├── slack/adapter.py        # Slack Socket Mode
├── whatsapp/adapter.py     # WhatsApp Business Cloud API
├── matrix/adapter.py       # 通过 mautrix 的 Matrix（可选 E2EE）
├── mattermost/adapter.py   # Mattermost WebSocket API
├── email/adapter.py        # 通过 IMAP/SMTP 的电子邮件
├── sms/adapter.py          # 通过 Twilio 的 SMS
├── dingtalk/adapter.py     # 钉钉 WebSocket
├── feishu/adapter.py       # 飞书/Lark WebSocket 或 webhook
├── wecom/adapter.py        # 企业微信回调
├── line/adapter.py         # LINE Messaging API
├── teams/adapter.py        # 微软 Teams
├── irc/adapter.py          # IRC（典型作用域锁示例）
├── homeassistant/adapter.py # Home Assistant 对话集成
└── …                       # google_chat, ntfy, photon, raft, simplex, …

gateway/platforms/                  # 核心基础 + 旧版直接适配器
├── base.py              # BasePlatformAdapter — 所有平台的共享逻辑
├── signal.py            # 通过 signal-cli REST API 的 Signal
├── weixin.py            # 通过 iLink Bot API 的微信（个人微信）
├── bluebubbles.py       # 通过 BlueBubbles macOS 服务器的 Apple iMessage
├── qqbot/               # 通过官方 API v2 的 QQ 机器人（腾讯 QQ）（子包）
├── yuanbao.py           # 腾讯元宝 DM/群组适配器
├── msgraph_webhook.py   # Microsoft Graph 变更通知 webhook（Teams、Outlook 等）
├── webhook.py           # 入站/出站 webhook 适配器
└── api_server.py        # REST API 服务器适配器
```

实验性连接器支持的平台使用 `gateway/relay/` 中的通用中继适配器，而非直接的平台模块。当配置了 `GATEWAY_RELAY_URL` 或 `gateway.relay_url` 时，网关注册 `relay` 平台，通过出站 WebSocket 拨号连接连接器，并在同一套接字上接收 `descriptor`、`inbound` 和 `interrupt_inbound` 帧。连接器通告 `CapabilityDescriptor`；Hermes 可以通过中继正常发送出站回复、无令牌的 `follow_up` 操作和中断帧。源接地的线框协议定义在 [`docs/relay-connector-contract.md`](https://github.com/NousResearch/hermes-agent/blob/main/docs/relay-connector-contract.md) 中。

适配器实现通用接口：
- `connect()` / `disconnect()` — 生命周期管理
- `send_message()` — 出站消息传递
- `on_message()` — 入站消息标准化 → `MessageEvent`

### 令牌锁

使用唯一凭证连接的适配器在 `connect()` 中调用 `acquire_scoped_lock()`，在 `disconnect()` 中调用 `release_scoped_lock()`。这可以防止两个配置文件同时使用相同的机器人令牌。

## 传递路径

出站传递（`gateway/delivery.py`）处理：

- **直接回复** — 将响应发回来源聊天
- **主频道传递** — 将 cron 任务输出和后台结果路由到配置的主频道
- **显式目标传递** — `send_message` 工具指定 `telegram:-1001234567890`，或包装同一工具供 shell 脚本使用的 [`hermes send` CLI](/guides/pipe-script-output)
- **跨平台传递** — 传递到与来源消息不同的平台

cron 任务传递**不会**镜像到网关会话历史中 — 它们仅存在于自己的 cron 会话中。这是为了避免消息交替违规而做出的刻意设计选择。

## 钩子

网关钩子是响应生命周期事件的 Python 模块：

### 网关钩子事件

| 事件 | 触发时机 |
|-------|-----------|
| `gateway:startup` | 网关进程启动 |
| `session:start` | 新对话会话开始 |
| `session:end` | 会话完成或超时 |
| `session:reset` | 用户通过 `/new` 重置会话 |
| `agent:start` | 智能体开始处理消息 |
| `agent:step` | 智能体完成一次工具调用迭代 |
| `agent:end` | 智能体完成并返回响应 |
| `command:*` | 执行任何斜杠命令 |

钩子从 `gateway/builtin_hooks/`（扩展点 — 当前发布版本中为空；`_register_builtin_hooks()` 是空桩函数）和 `~/.hermes/hooks/`（用户安装）中发现。每个钩子是一个包含 `HOOK.yaml` 清单和 `handler.py` 的目录。

## 记忆提供者集成

当记忆提供者插件（如 Honcho）启用时：

1. 网关为每条消息创建一个带会话 ID 的 `AIAgent`
2. `MemoryManager` 用会话上下文初始化提供者
3. 提供者工具（如 `honcho_profile`、`viking_search`）通过以下路径路由：

```text
AIAgent._invoke_tool()
  → self._memory_manager.handle_tool_call(name, args)
    → provider.handle_tool_call(name, args)
```

4. 会话结束/重置时，触发 `on_session_end()` 进行清理和最终数据刷新

### 记忆刷新生命周期

当会话被重置、恢复或过期时：
1. 内置记忆刷新到磁盘
2. 触发记忆提供者的 `on_session_end()` 钩子
3. 临时 `AIAgent` 运行一轮纯记忆对话
4. 然后丢弃或归档上下文

## 后台维护

网关在处理消息的同时运行定期维护任务：

- **Cron 定时触发** — 检查作业计划并触发到期作业
- **会话过期** — 在超时后清理废弃的会话
- **内存刷新** — 在会话过期前主动刷新内存
- **缓存刷新** — 刷新模型列表和提供商状态

## 进程管理

网关以长驻进程方式运行，通过以下方式进行管理：

- `hermes gateway start` / `hermes gateway stop` — 手动控制
- `systemctl`（Linux）或 `launchctl`（macOS）— 服务管理
- 位于 `~/.hermes/gateway.pid` 的 PID 文件 — 按配置文件进行进程追踪

**按配置文件作用域与全局作用域**：`start_gateway()` 使用按配置文件作用域的 PID 文件。`hermes gateway stop` 仅停止当前配置文件的网关。`hermes gateway stop --all` 使用全局 `ps aux` 扫描来终止所有网关进程（在更新时使用）。

## 相关文档

- [会话存储](./session-storage.md)
- [Cron 内部机制](./cron-internals.md)
- [ACP 内部机制](./acp-internals.md)
- [智能体循环内部机制](./agent-loop.md)
- [消息网关（用户指南）](/user-guide/messaging)