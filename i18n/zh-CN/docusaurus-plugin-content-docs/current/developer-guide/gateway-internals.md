---
sidebar_position: 7
title: "网关内部机制"
description: "消息网关如何启动、授权用户、路由会话和发送消息"
---

# 网关内部机制

消息网关是一个长期运行的进程，它通过统一的架构将 Hermes 连接到 14 个以上的外部消息平台。

## 关键文件

| 文件 | 用途 |
|------|---------|
| `gateway/run.py` | `GatewayRunner` — 主循环、斜杠命令、消息分发（约 9,000 行） |
| `gateway/session.py` | `SessionStore` — 对话持久化和会话密钥构建 |
| `gateway/delivery.py` | 向目标平台/频道发送传出消息 |
| `gateway/pairing.py` | 用于用户授权的私信配对流程 |
| `gateway/channel_directory.py` | 将聊天 ID 映射到人类可读名称，用于定时任务发送 |
| `gateway/hooks.py` | Hook 发现、加载和生命周期事件分发 |
| `gateway/mirror.py` | `send_message` 的跨会话消息镜像功能 |
| `gateway/status.py` | 用于基于配置范围的网关实例的令牌锁定管理 |
| `gateway/builtin_hooks/` | 始终注册的 Hook（例如，BOOT.md 系统提示 Hook） |
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
│  斜杠命令   AIAgent    队列/后台            │
│    分发      创建   会话            │
│                     │                           │
│                     ▼                           │
│                 SessionStore                    │
│              (SQLite 持久化)               │
└─────────────────────────────────────────────────┘
```

## 消息流

当从任何平台收到消息时：

1. **平台适配器** 接收原始事件，并将其标准化为 `MessageEvent`。
2. **基础适配器** 检查活动会话保护机制：
   - 如果该会话正在运行 Agent → 将消息放入队列，设置中断事件
   - 如果是 `/approve`、`/deny`、`/stop` → 绕过保护机制（内联分发）
3. **GatewayRunner._handle_message()** 接收事件：
   - 通过 `_session_key_for_source()` 解析会话密钥（格式：`agent:main:{platform}:{chat_type}:{chat_id}`）
   - 检查授权（详见授权部分）
   - 检查是否为斜杠命令 → 分发给命令处理器
   - 检查 Agent 是否已运行 → 拦截 `/stop`、`/status` 等命令
   - 否则 → 创建 `AIAgent` 实例并运行对话
4. **响应** 通过平台适配器发送回去。

### 会话密钥格式

会话密钥编码了完整的路由上下文：

```
agent:main:{platform}:{chat_type}:{chat_id}
```

例如：`agent:main:telegram:private:123456789`

线程感知平台（Telegram 论坛主题、Discord 线程、Slack 线程）可能会在 `chat_id` 部分包含线程 ID。**切勿手动构建会话密钥** — 始终使用 `gateway/session.py` 中的 `build_session_key()`。

### 两级消息保护机制

当 Agent 处于活动运行状态时，传入的消息会经过两个顺序保护层：

1. **第一级 — 基础适配器** (`gateway/platforms/base.py`)：检查 `_active_sessions`。如果会话处于活动状态，则将消息放入 `_pending_messages` 队列并设置中断事件。这在消息到达网关运行器*之前*捕获了消息。

2. **第二级 — 网关运行器** (`gateway/run.py`)：检查 `_running_agents`。拦截特定命令（`/stop`、`/new`、`/queue`、`/status`、`/approve`、`/deny`）并适当路由。所有其他消息都会触发 `running_agent.interrupt()`。

必须在 Agent 被阻塞时也能到达运行器的命令（如 `/approve`）是通过 `await self._message_handler(event)` **内联**分发的——它们绕过了后台任务系统，以避免竞态条件。

## 授权

网关使用多层授权检查，按顺序评估：

1. **平台级允许所有标志**（例如 `TELEGRAM_ALLOW_ALL_USERS`）— 如果设置，该平台上的所有用户均被授权
2. **平台白名单**（例如 `TELEGRAM_ALLOWED_USERS`）— 逗号分隔的用户 ID
3. **私信配对** — 已认证用户可以通过配对代码为新用户配对
4. **全局允许所有** (`GATEWAY_ALLOW_ALL_USERS`) — 如果设置，所有平台的任何用户均被授权
5. **默认：拒绝** — 未授权用户将被拒绝

### 私信配对流程

```text
管理员: /pair
网关: "配对代码：ABC123。请分享给用户。"
新用户: ABC123
网关: "配对成功！您现在已获得授权。"
```

配对状态持久化在 `gateway/pairing.py` 中，并且在重启后仍然有效。

## 斜杠命令分发

网关中的所有斜杠命令都经过相同的解析流程：

1. `hermes_cli/commands.py` 中的 `resolve_command()` 将输入映射到规范名称（处理别名、前缀匹配）
2. 将规范名称与 `GATEWAY_KNOWN_COMMANDS` 进行比对
3. `_handle_message()` 中的处理器根据规范名称进行分发
4. 有些命令的执行受配置限制（`CommandDef` 上的 `gateway_config_gate`）

### 运行 Agent 保护机制

在 Agent 处理过程中必须不执行的命令会被提前拒绝：

```python
if _quick_key in self._running_agents:
    if canonical == "model":
        return "⏳ Agent 正在运行 — 请等待其完成或先使用 /stop。"
```

绕过命令（`/stop`、`/new`、`/approve`、`/deny`、`/queue`、`/status`）有特殊的处理逻辑。

## 配置源

网关从多个来源读取配置：

| 源 | 提供内容 |
|--------|-----------------|
| `~/.hermes/.env` | API 密钥、机器人令牌、平台凭证 |
| `~/.hermes/config.yaml` | 模型设置、工具配置、显示选项 |
| 环境变量 | 覆盖上述任何配置 |

与 CLI（使用 `load_cli_config()` 并带有硬编码默认值）不同，网关通过 YAML 加载器直接读取 `config.yaml`。这意味着在 CLI 的默认字典中存在但在用户配置文件中不存在的配置键，在 CLI 和网关之间可能表现出不同的行为。

## 平台适配器

每个消息平台在 `gateway/platforms/` 中都有一个适配器：

```text
gateway/platforms/
├── base.py              # BaseAdapter — 所有平台的共享逻辑
├── telegram.py          # Telegram Bot API（长轮询或 Webhook）
├── discord.py           # 通过 discord.py 的 Discord 机器人
├── slack.py             # Slack Socket Mode
├── whatsapp.py          # WhatsApp Business Cloud API
├── signal.py            # 通过 signal-cli REST API 的 Signal
├── matrix.py            # 通过 mautrix 的 Matrix（可选 E2EE）
├── mattermost.py        # Mattermost WebSocket API
├── email.py             # 通过 IMAP/SMTP 的邮件
├── sms.py               # 通过 Twilio 的短信
├── dingtalk.py          # 钉钉 WebSocket
├── feishu.py            # 飞书/Lark WebSocket 或 Webhook
├── wecom.py             # 飞书工作台 (WeChat Work) 回调
├── weixin.py            # 微信 (个人微信) 通过 iLink Bot API
├── bluebubbles.py       # 通过 BlueBubbles macOS 服务器的 Apple iMessage
├── qqbot.py             # QQ Bot (腾讯 QQ) 通过官方 API v2
├── webhook.py           # 入站/出站 Webhook 适配器
├── api_server.py        # REST API 服务器适配器
└── homeassistant.py     # Home Assistant 对话集成
```

适配器实现了一个通用接口：
- `connect()` / `disconnect()` — 生命周期管理
- `send_message()` — 传出消息发送
- `on_message()` — 入站消息标准化 → `MessageEvent`

### 令牌锁定

使用唯一凭证连接的适配器在 `connect()` 中调用 `acquire_scoped_lock()`，并在 `disconnect()` 中调用 `release_scoped_lock()`。这可以防止两个配置文件同时使用相同的机器人令牌。

## 交付路径

传出交付（`gateway/delivery.py`）处理以下情况：

- **直接回复** — 将响应发送回原始聊天
- **主频道交付** — 将定时任务输出和后台结果路由到配置的主频道
- **明确目标交付** — 指定 `telegram:-1001234567890` 的 `send_message` 工具
- **跨平台交付** — 向与原始消息不同的平台发送消息

定时任务交付不会镜像到网关会话历史记录中——它们只存在于自己的定时任务会话中。这是一个故意的设计选择，目的是避免消息交替违规。

## Hooks（钩子）

网关 Hook 是响应生命周期事件的 Python 模块：

### 网关 Hook 事件

| 事件 | 触发时机 |
|-------|-----------|
| `gateway:startup` | 网关进程启动 |
| `session:start` | 新对话会话开始 |
| `session:end` | 会话完成或超时 |
| `session:reset` | 用户使用 `/new` 重置会话 |
| `agent:start` | Agent 开始处理消息 |
| `agent:step` | Agent 完成一次工具调用迭代 |
| `agent:end` | Agent 完成并返回响应 |
| `command:*` | 任何斜杠命令执行 |

Hook 从 `gateway/builtin_hooks/`（始终活动）和 `~/.hermes/hooks/`（用户安装）发现。每个 Hook 都是一个包含 `HOOK.yaml` 清单和 `handler.py` 的目录。

## 内存提供者集成

当启用内存提供者插件（例如 Honcho）时：

1. 网关为每条消息创建一个带有会话 ID 的 `AIAgent`。
2. `MemoryManager` 使用会话上下文初始化提供者。
3. 提供者工具（例如 `honcho_profile`、`viking_search`）通过以下路径路由：

```text
AIAgent._invoke_tool()
  → self._memory_manager.handle_tool_call(name, args)
    → provider.handle_tool_call(name, args)
```

4. 在会话结束/重置时，会触发 `on_session_end()` 进行清理和最终数据刷新。

### 内存刷新生命周期

当会话被重置、恢复或过期时：
1. 内置记忆被刷新到磁盘。
2. 内存提供者的 `on_session_end()` Hook 触发。
3. 一个临时的 `AIAgent` 运行一个仅包含记忆的对话回合。
4. 随后上下文被丢弃或归档。

## 后台维护

网关在处理消息的同时运行周期性维护任务：

- **定时任务滴答** — 检查任务计划并触发到期的任务。
- **会话过期** — 在超时后清理废弃的会话。
- **内存刷新** — 在会话过期前主动刷新内存。
- **缓存刷新** — 刷新模型列表和提供者状态。

## 进程管理

网关作为一个长期运行的进程运行，通过以下方式进行管理：

- `hermes gateway start` / `hermes gateway stop` — 手动控制
- `systemctl` (Linux) 或 `launchctl` (macOS) — 服务管理
- PID 文件位于 `~/.hermes/gateway.pid` — 配置文件范围的进程跟踪

**配置文件范围 vs 全局**: `start_gateway()` 使用配置文件范围的 PID 文件。`hermes gateway stop` 只停止当前配置文件的网关。`hermes gateway stop --all` 使用全局 `ps aux` 扫描来杀死所有网关进程（在更新期间使用）。

## 相关文档

- [会话存储](./session-storage.md)
- [定时任务内部机制](./cron-internals.md)
- [ACP 内部机制](./acp-internals.md)
- [Agent 循环内部机制](./agent-loop.md)
- [消息网关（用户指南）](/docs/user-guide/messaging)