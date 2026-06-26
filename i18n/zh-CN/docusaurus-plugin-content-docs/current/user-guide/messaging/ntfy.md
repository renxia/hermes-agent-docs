# ntfy

[ntfy](https://ntfy.sh/) 是一个基于 HTTP 的简单发布订阅通知服务。它与 `ntfy.sh` 上的免费公共服务器或任何自托管实例配合使用，支持任何可以发起 HTTP 请求的客户端——手机、浏览器、脚本、手表等。

ntfy 为 Hermes 提供了一个出色的轻量级推送通道：从 [ntfy 移动应用](https://ntfy.sh/docs/subscribe/phone/) 订阅一个主题，向该主题发送消息以与智能体（agent）对话，然后在手机上接收回复。

> 运行 `hermes gateway setup` 并选择 **ntfy** 以获得引导式操作流程。

## 先决条件 (Prerequisites)

- 一个主题名称（任何唯一的字符串——`hermes-myname-2026` 都可以）
- 已安装 [ntfy 移动应用](https://ntfy.sh/docs/subscribe/phone/) 并订阅该主题
- 可选：自托管的 ntfy 服务器，或用于私有/保留主题的 `ntfy.sh` 账户令牌

就是这些。不需要 SDK、不需要守护进程（daemon）、也不需要 Node.js。适配器使用 `httpx`，而 `httpx` 本身就是 Hermes 的一个依赖项。

## 配置 Hermes

### 通过设置向导 (Via setup wizard)

```bash
hermes gateway setup
```

选择 **ntfy** 并按照提示操作。

### 通过环境变量 (Via environment variables)

将这些变量添加到 `~/.hermes/.env`：

```
NTFY_TOPIC=hermes-myname-2026
NTFY_ALLOWED_USERS=hermes-myname-2026
NTFY_HOME_CHANNEL=hermes-myname-2026
```

| 变量 (Variable) | 是否必需 (Required) | 描述 (Description) |
|---|---|---|
| `NTFY_TOPIC` | 是 (Yes) | 订阅的主题（接收消息） |
| `NTFY_SERVER_URL` | 可选 (Optional) | 服务器 URL（默认：`https://ntfy.sh`）— 指向自托管的 ntfy 以确保隐私 |
| `NTFY_TOKEN` | 可选 (Optional) | Bearer 令牌（例如 `tk_xyz`）或用于基本身份验证的 `user:pass` |
| `NTFY_PUBLISH_TOPIC` | 可选 (Optional) | 用于发送回复的不同主题（默认为 `NTFY_TOPIC`） |
| `NTFY_MARKDOWN` | 可选 (Optional) | 设置为 `true` 以使用 `X-Markdown: true` 标头发送回复 |
| `NTFY_ALLOWED_USERS` | 推荐 (Recommended) | 允许的逗号分隔主题名称（被视为用户 ID；参见下文） |
| `NTFY_ALLOW_ALL_USERS` | 可选 (Optional) | 设置为 `true` 以允许所有发布者——仅适用于带有读取令牌的私有主题 |
| `NTFY_HOME_CHANNEL` | 可选 (Optional) | 用于定时任务/通知交付的默认主题 |
| `NTFY_HOME_CHANNEL_NAME` | 可选 (Optional) | 主题的人类标签 |

## 身份模型（Identity model）—部署前请阅读

ntfy 没有原生的经过身份验证的用户身份。发布消息时的 `title` 字段是**由发布者控制的**，可以是什么发送者想要的。Hermes 适配器不会使用 `title` 进行授权——它会允许任何知道该主题的发布者冒充一个被允许的用户。

相反，**主题名称本身就是身份**。所有发布到该主题的消息都被视为来自同一个逻辑用户（即该主题）。因此，`NTFY_ALLOWED_USERS` 通常就是主题名称本身——一个限制整个通道的单项白名单。

这意味着**任何知道该主题的人都可以与智能体对话**。要使其成为真正的信任边界：

- **自托管 ntfy** 并使用 [访问控制](https://docs.ntfy.sh/config/#access-control) 锁定该主题。只有拥有读取/写入令牌的授权客户端才能发布消息。
- 或者在 ntfy.sh 上**使用私有主题**（[保留主题](https://docs.ntfy.sh/publish/#reserved-topics) 需要账户）并使用 `NTFY_TOKEN` 进行保护。
- 或者**选择一个长且不可猜测的主题名称**（例如 `hermes-7d4f9c8b-2026`），并将其视为共享密钥。这是最轻量级的设置，但主题名称可能会通过任何日志或截图泄露。

在所有情况下，除非底层主题是受访问控制的，否则请勿将敏感数据通过 ntfy 传输。

## 快速入门 (Quick start) —从手机与智能体对话

1. 选择一个主题名称：`hermes-myname-2026`
2. 在您的手机上：安装 [ntfy 应用](https://ntfy.sh/docs/subscribe/phone/)，点击 **+**，输入 `hermes-myname-2026`
3. 在主机上：
   ```bash
   echo 'NTFY_TOPIC=hermes-myname-2026' >> ~/.hermes/.env
   echo 'NTFY_ALLOWED_USERS=hermes-myname-2026' >> ~/.hermes/.env
   hermes gateway restart
   ```
4. 从 ntfy 应用发送消息到该主题。智能体的回复将以推送通知的形式送达。

## 与定时任务 (cron jobs) 配合使用 ntfy

一旦设置了 `NTFY_HOME_CHANNEL`，定时任务就可以向 ntfy 发送交付：

```python
cronjob(
    action="create",
    schedule="every 1h",
    deliver="ntfy",          # 使用 NTFY_HOME_CHANNEL
    prompt="Check for alerts and summarise."
)
```

或者明确指定一个主题：

```python
send_message(target="ntfy:alerts-channel", message="Done!")
```

即使定时任务是从网关（gateway）进程外部运行的，这仍然有效——该插件会注册一个 `standalone_sender_fn` 来打开自己的 HTTP 连接。

## 自托管 ntfy (Self-hosting ntfy)

如果您需要完全控制：

```bash
# Docker
docker run -p 80:80 -it binwiederhier/ntfy serve

# 原生安装 (Native)
go install heckel.io/ntfy/v2@latest
ntfy serve
```

然后将 Hermes 指向它：

```
NTFY_SERVER_URL=https://ntfy.mydomain.com
NTFY_TOPIC=hermes
NTFY_TOKEN=tk_abc123  # 如果您已设置访问控制
```

自托管可以为您提供主题访问控制、消息持久化策略、附件和表情符号标签。请参阅 [ntfy 服务器文档](https://docs.ntfy.sh/install/)。

## Markdown 格式化 (Markdown formatting)

当发布者设置了 `X-Markdown: true` 标头时，ntfy 客户端会渲染 markdown。要为发送的 Hermes 回复信启用此功能：

```
NTFY_MARKDOWN=true
```

或者在 `config.yaml` 中：

```yaml
platforms:
  ntfy:
    extra:
      markdown: true
```

移动应用支持 CommonMark 的一部分——粗体、斜体、列表、链接、代码块。请参阅 [ntfy 的 markdown 文档](https://docs.ntfy.sh/publish/#markdown-formatting) 以获取确切的集合。

## 仅发送通知 (Outgoing-only setup)（无入站消息）

如果您只想让 Hermes 将通知*推送*到 ntfy（例如定时摘要、警报），而绝不接受回复，请将 `NTFY_TOPIC` 和 `NTFY_PUBLISH_TOPIC` 设置为相同的值，并完全跳过 `NTFY_ALLOWED_USERS`。如果没有白名单，智能体将不会对入站消息做出回应——您的手机会收到推送，但对话是单向的。

## 限制 (Limits)

- **消息大小**：ntfy 将消息体限制在 4096 个字符。超出此限制时，Hermes 会发出警告并截断。
- **无输入指示器**：协议中没有提供此功能；`send_typing` 是一个空操作（no-op）。
- **无线程或附件**：ntfy 是纯粹的推送通知。长回复会保留在消息体中，不会进行主题分发（thread fanout）。
- **无原生用户身份**：请参阅上面的身份模型部分。

## 故障排除 (Troubleshooting)

**认证失败 / 401** — `NTFY_TOKEN` 不正确，或者该令牌对该主题没有发布/订阅权限。适配器会在收到 401 时停止重连循环，网关运行时状态将显示 `fatal: ntfy_unauthorized`。请修复令牌并重启网关。

**未找到主题 / 404** — `NTFY_TOPIC` 在配置的服务器上不存在。对于 ntfy.sh，主题会在首次发布时自动创建，因此 404 表示您指向了一个没有预置该主题的自托管服务器。适配器会以 `fatal: ntfy_topic_not_found` 停止重连循环。

**已连接但无消息** — 请检查 `NTFY_ALLOWED_USERS` 是否包含主题名称本身。根据 ntfy 的身份模型，主题就是用户；如果白名单为空，则所有内容都会被拒绝。

**每 60 秒重连一次** — 流保持活动（stream keepalive）的默认时间是 55 秒；ntfy 可能存在间歇性的网络问题。适配器会应用指数退避（2 → 5 → 10 → 30 → 60s），并且一旦流保持活动 ≥60 秒，就会重置为 0。