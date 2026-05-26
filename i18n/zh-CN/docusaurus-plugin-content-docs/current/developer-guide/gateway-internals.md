---
sidebar_position: 7
title: "网关内部机制"
description: "消息网关如何启动、授权用户、路由会话并传递消息"
---

# 网关内部机制

消息网关是一个长期运行的进程，通过统一架构将 Hermes 连接到 20 多个外部消息平台。

## 核心文件

| 文件 | 用途 |
|------|---------|
| `gateway/run.py` | `GatewayRunner` — 主循环、斜杠命令、消息分发（文件较大；请通过 git 查看当前代码行数） |
| `gateway/session.py` | `SessionStore` — 会话持久化与会话密钥构建 |
| `gateway/delivery.py` | 向目标平台/频道发送出站消息 |
| `gateway/pairing.py` | 用于用户授权的直接消息配对流程 |
| `gateway/channel_directory.py` | 将聊天 ID 映射为人类可读的名称，用于定时任务投递 |
| `gateway/hooks.py` | 钩子的发现、加载与生命周期事件分发 |
| `gateway/mirror.py` | 用于 `send_message` 的跨会话消息镜像 |
| `gateway/status.py` | 针对配置文件作用域的网关实例进行令牌锁管理 |
| `gateway/builtin_hooks/` | 始终注册的钩子扩展点（当前未附带任何钩子） |
| `gateway/platforms/` | 平台适配器（每个消息平台一个） |

## 架构概览

```text
┌─────────────────────────────────────────────────┐
│                  GatewayRunner                  │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Telegram │  │ Discord  │  │  Slack   │       │
│  │ 适配器   │  │ 适配器   │  │ 适配器   │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │
│       └─────────────┼─────────────┘             │
│                     ▼                           │
│              _handle_message()                  │
│                     │                           │
│         ┌───────────┼───────────┐               │
│         ▼           ▼           ▼               │
│   斜杠命令      智能体创建     队列/后台          │
│    分发           流程         会话               │
│                     │                           │
│                     ▼                           │
│                 SessionStore                    │
│              （SQLite 持久化）                    │
└───────┴─────────────┴─────────────┴─────────────┘
```

## 消息流程

当消息从任意平台到达时：

1. **平台适配器**接收原始事件，将其规范化为 `MessageEvent`
2. **基础适配器**检查活跃会话守卫：
   - 如果该会话有智能体正在运行 → 将消息入队，设置中断事件
   - 如果是 `/approve`、`/deny`、`/stop` → 绕过守卫（内联分发）
3. **GatewayRunner._handle_message()** 接收事件：
   - 通过 `_session_key_for_source()` 解析会话键（格式：`agent:main:{platform}:{chat_type}:{chat_id}`）
   - 检查授权（参见下方授权章节）
   - 检查是否为斜杠命令 → 分发到命令处理器
   - 检查智能体是否正在运行 → 拦截 `/stop`、`/status` 等命令
   - 否则 → 创建 `AIAgent` 实例并运行对话
4. **响应**通过平台适配器发回

### 会话键格式

会话键编码了完整的路由上下文：

```
agent:main:{platform}:{chat_type}:{chat_id}
```

例如：`agent:main:telegram:private:123456789`

支持线程的平台（Telegram 论坛话题、Discord 线程、Slack 线程）可以在 chat_id 部分包含线程 ID。**切勿手动构建会话键** —— 始终使用 `gateway/session.py` 中的 `build_session_key()`。

### 两级消息守卫

当智能体正在活跃运行时，传入消息会经过两级顺序守卫：

1. **第一级 — 基础适配器**（`gateway/platforms/base.py`）：检查 `_active_sessions`。如果会话处于活跃状态，将消息排队到 `_pending_messages` 并设置中断事件。这会在消息到达网关运行器之前捕获它们。

2. **第二级 — 网关运行器**（`gateway/run.py`）：检查 `_running_agents`。拦截特定命令（`/stop`、`/new`、`/queue`、`/status`、`/approve`、`/deny`）并进行相应路由。其他所有命令触发 `running_agent.interrupt()`。

当智能体被阻塞时必须到达运行器的命令（如 `/approve`）通过 `await self._message_handler(event)` **内联分发** —— 它们绕过后台任务系统以避免竞态条件。

## 授权

网关使用多层授权检查，按顺序评估：

1. **每平台全允许标志**（如 `TELEGRAM_ALLOW_ALL_USERS`）—— 如果设置，该平台上所有用户均被授权
2. **平台白名单**（如 `TELEGRAM_ALLOWED_USERS`）—— 逗号分隔的用户 ID
3. **私信配对** —— 已认证用户可以通过配对码配对新用户
4. **全局全允许**（`GATEWAY_ALLOW_ALL_USERS`）—— 如果设置，所有平台上所有用户均被授权
5. **默认：拒绝** —— 未授权用户被拒绝

### 私信配对流程

```text
管理员：/pair
网关："配对码：ABC123。请分享给该用户。"
新用户：ABC123
网关："配对成功！您现在已获授权。"
```

配对状态持久化在 `gateway/pairing.py` 中，重启后仍然有效。

## 斜杠命令分发

网关中的所有斜杠命令都经过相同的解析管道：

1. `hermes_cli/commands.py` 中的 `resolve_command()` 将输入映射到规范名称（处理别名、前缀匹配）
2. 规范名称与 `GATEWAY_KNOWN_COMMANDS` 进行比对检查
3. `_handle_message()` 中的处理器根据规范名称进行分发
4. 部分命令受配置限制（`CommandDef` 上的 `gateway_config_gate`）

### 运行中智能体守卫

在智能体处理期间不得执行的命令会被提前拒绝：

```python
if _quick_key in self._running_agents:
    if canonical == "model":
        return "⏳ Agent is running — wait for it to finish or /stop first."
```

绕过命令（`/stop`、`/new`、`/approve`、`/deny`、`/queue`、`/status`）有特殊处理逻辑。

## 配置来源

网关从多个来源读取配置：

| 来源 | 提供内容 |
|------|---------|
| `~/.hermes/.env` | API 密钥、机器人令牌、平台凭证 |
| `~/.hermes/config.yaml` | 模型设置、工具配置、显示选项 |
| 环境变量 | 覆盖以上任何配置 |

与 CLI（使用带有硬编码默认值的 `load_cli_config()`）不同，网关通过 YAML 加载器直接读取 `config.yaml`。这意味着在 CLI 的默认字典中存在但不在用户配置文件中的配置键在 CLI 和网关之间可能表现不同。

## 平台适配器

每个消息平台在 `gateway/platforms/` 中都有一个适配器：

```text
gateway/platforms/
├── base.py              # BaseAdapter — 所有平台的共享逻辑
├── telegram.py          # Telegram Bot API（长轮询或 Webhook）
├── discord.py           # Discord 机器人，基于 discord.py
├── slack.py             # Slack Socket 模式
├── whatsapp.py          # WhatsApp Business Cloud API
├── signal.py            # Signal，通过 signal-cli REST API
├── matrix.py            # Matrix，通过 mautrix（可选端到端加密）
├── mattermost.py        # Mattermost WebSocket API
├── email.py             # 邮件，通过 IMAP/SMTP
├── sms.py               # 短信，通过 Twilio
├── dingtalk.py          # 钉钉 WebSocket
├── feishu.py            # 飞书/Lark WebSocket 或 Webhook
├── wecom.py             # 企业微信回调
├── weixin.py            # 微信（个人），通过 iLink Bot API
├── bluebubbles.py       # Apple iMessage，通过 BlueBubbles macOS 服务器
├── qqbot/               # QQ 机器人（腾讯 QQ），通过官方 API v2（子包：adapter.py、crypto.py、keyboards.py 等）
├── yuanbao.py           # 元宝（腾讯）私信/群组适配器
├── feishu_comment.py    # 飞书文档/云盘评论回复处理器
├── msgraph_webhook.py   # Microsoft Graph 变更通知 Webhook（Teams、Outlook 等）
├── webhook.py           # 入站/出站 Webhook 适配器
├── api_server.py        # REST API 服务器适配器
└── homeassistant.py     # Home Assistant 对话集成
```

适配器实现统一接口：
- `connect()` / `disconnect()` —— 生命周期管理
- `send_message()` —— 出站消息投递
- `on_message()` —— 入站消息规范化 → `MessageEvent`

### 令牌锁

使用唯一凭证连接的适配器在 `connect()` 中调用 `acquire_scoped_lock()` 并在 `disconnect()` 中调用 `release_scoped_lock()`。这可以防止两个配置文件同时使用同一个机器人令牌。

## 投递路径

出站投递（`gateway/delivery.py`）处理：

- **直接回复** —— 将响应发送回来源聊天
- **主频道投递** —— 将定时任务输出和后台结果路由到配置的主频道
- **显式目标投递** —— `send_message` 工具指定 `telegram:-1001234567890`，或 [`hermes send` CLI](/guides/pipe-script-output) 为 Shell 脚本封装相同的工具
- **跨平台投递** —— 投递到与来源消息不同的平台

定时任务投递**不会**镜像到网关会话历史中 —— 它们仅存在于自己的定时会话中。这是一个刻意的设计选择，以避免消息交替违规。

## 钩子

网关钩子是响应生命周期事件的 Python 模块：

### 网关钩子事件

| 事件 | 触发时机 |
|------|---------|
| `gateway:startup` | 网关进程启动 |
| `session:start` | 新对话会话开始 |
| `session:end` | 会话完成或超时 |
| `session:reset` | 用户使用 `/new` 重置会话 |
| `agent:start` | 智能体开始处理消息 |
| `agent:step` | 智能体完成一次工具调用迭代 |
| `agent:end` | 智能体完成并返回响应 |
| `command:*` | 执行任何斜杠命令 |

钩子从 `gateway/builtin_hooks/`（扩展点 —— 在发布版本中当前为空；`_register_builtin_hooks()` 是一个空操作存根）和 `~/.hermes/hooks/`（用户安装）中发现。每个钩子是一个包含 `HOOK.yaml` 清单和 `handler.py` 的目录。

# 内存提供程序集成

当启用内存提供程序插件（例如 Honcho）时：

1.  网关为每个消息创建一个带有会话 ID 的 `AIAgent`
2.  `MemoryManager` 使用会话上下文初始化提供程序
3.  提供程序工具（例如 `honcho_profile`、`viking_search`）通过以下路径调用：

```text
AIAgent._invoke_tool()
  → self._memory_manager.handle_tool_call(name, args)
    → provider.handle_tool_call(name, args)
```

4.  在会话结束/重置时，触发 `on_session_end()` 进行清理和最终数据刷新

### 内存刷新生命周期

当会话被重置、恢复或过期时：
1.  内置内存被刷新到磁盘
2.  内存提供程序的 `on_session_end()` 钩子触发
3.  一个临时的 `AIAgent` 运行一个仅涉及内存的对话轮次
4.  上下文随后被丢弃或归档

## 后台维护

网关在消息处理的同时运行周期性维护：

-   **定时任务触发** — 检查作业调度并触发到期的作业
-   **会话过期清理** — 在超时后清理被遗弃的会话
-   **内存刷新** — 在会话过期前主动刷新内存
-   **缓存刷新** — 刷新模型列表和提供程序状态

## 进程管理

网关作为一个长时间运行的进程，通过以下方式管理：

-   `hermes gateway start` / `hermes gateway stop` — 手动控制
-   `systemctl` (Linux) 或 `launchctl` (macOS) — 服务管理
-   PID 文件位于 `~/.hermes/gateway.pid` — 用于作用域配置文件的进程跟踪

**作用域配置文件 vs 全局**: `start_gateway()` 使用作用域配置文件的 PID 文件。`hermes gateway stop` 仅停止当前配置文件的网关。`hermes gateway stop --all` 使用全局 `ps aux` 扫描来终止所有网关进程（用于更新期间）。

## 相关文档

-   [会话存储](./session-storage.md)
-   [定时任务内部机制](./cron-internals.md)
-   [ACP 内部机制](./acp-internals.md)
-   [智能体循环内部机制](./agent-loop.md)
-   [消息网关（用户指南）](/user-guide/messaging)