# ntfy

[ntfy](https://ntfy.sh/) 是一个简单的基于 HTTP 的发布-订阅通知服务。它可与免费的公共服务器 `ntfy.sh` 或任何自托管实例配合使用，并支持任何能够发起 HTTP 请求的客户端——手机、浏览器、脚本、手表。

ntfy 是 Hermes 的出色轻量级推送通道：通过 [ntfy 移动应用](https://ntfy.sh/docs/subscribe/phone/) 订阅一个主题，向该主题发送消息即可与智能体对话，并在手机上收到回复。

> 运行 `hermes gateway setup` 并选择 **ntfy** 以获得引导式设置流程。

## 先决条件

- 一个主题名称（任何唯一字符串——`hermes-myname-2026` 即可）
- 安装并已订阅该主题的 [ntfy 移动应用](https://ntfy.sh/docs/subscribe/phone/)
- 可选：一个自托管的 ntfy 服务器，或者用于私有/保留主题的 `ntfy.sh` 账户令牌

就这些。无需 SDK、守护进程或 Node.js。适配器使用 `httpx`，它已经是 Hermes 的依赖项。

## 配置 Hermes

### 通过设置向导

```bash
hermes setup gateway
```

选择 **ntfy** 并按照提示操作。

### 通过环境变量

将以下内容添加到 `~/.hermes/.env`：

```
NTFY_TOPIC=hermes-myname-2026
NTFY_ALLOWED_USERS=hermes-myname-2026
NTFY_HOME_CHANNEL=hermes-myname-2026
```

| 变量 | 必需 | 描述 |
|---|---|---|
| `NTFY_TOPIC` | 是 | 订阅的主题（接收传入消息） |
| `NTFY_SERVER_URL` | 可选 | 服务器 URL（默认：`https://ntfy.sh`）——指向自托管的 ntfy 以保护隐私 |
| `NTFY_TOKEN` | 可选 | 持有者令牌（例如 `tk_xyz`）或用于基本认证的 `user:pass` |
| `NTFY_PUBLISH_TOPIC` | 可选 | 用于发送回复的不同主题（默认为 `NTFY_TOPIC`） |
| `NTFY_MARKDOWN` | 可选 | 设置为 `true` 以在回复中发送 `X-Markdown: true` 头 |
| `NTFY_ALLOWED_USERS` | 推荐 | 允许的逗号分隔主题名称（被视为用户 ID；见下文） |
| `NTFY_ALLOW_ALL_USERS` | 可选 | 设置为 `true` 以允许所有发布者——仅对使用读取令牌的私有主题安全 |
| `NTFY_HOME_CHANNEL` | 可选 | cron / 通知投递的默认主题 |
| `NTFY_HOME_CHANNEL_NAME` | 可选 | 主页通道的人类可读标签 |

## 身份模型 — 部署前请先阅读

ntfy 没有原生的经过身份验证的用户身份。发布消息的 `title` 字段是**由发布者控制的**，可以是发送者想要的任何内容。Hermes 适配器**不**使用 `title` 进行授权——那会让任何知道该主题的发布者冒充允许的用户。

相反，**主题名称本身就是身份**。发布到该主题的每条消息都被视为来自同一个逻辑用户（该主题）。因此，`NTFY_ALLOWED_USERS` 通常只是主题名称本身——一个控制整个通道的单一允许列表条目。

这意味着**任何知道该主题的人都可以与智能体对话**。为了使其成为一个真正的信任边界：

- **自托管 ntfy** 并使用[访问控制](https://docs.ntfy.sh/config/#access-control)锁定该主题。只有具有读/写令牌的授权客户端才能发布。
- 或者**在 ntfy.sh 上使用私有主题**（[保留主题](https://docs.ntfy.sh/publish/#reserved-topics)需要账户）并使用 `NTFY_TOKEN` 进行保护。
- 或者**选择一个长且难以猜测的主题名称**（`hermes-7d4f9c8b-2026`），并将其视为共享密钥。这是最轻量级的设置，但主题名称会通过任何日志或截图泄露。

在所有情况下，除非底层主题受到访问控制，否则不要通过 ntfy 传输敏感数据。

## 快速开始 — 从手机与你的智能体对话

1.  选择一个主题名称：`hermes-myname-2026`
2.  在你的手机上：安装 [ntfy 应用](https://ntfy.sh/docs/subscribe/phone/)，点击 **+**，输入 `hermes-myname-2026`
3.  在主机上：
    ```bash
    echo 'NTFY_TOPIC=hermes-myname-2026' >> ~/.hermes/.env
    echo 'NTFY_ALLOWED_USERS=hermes-myname-2026' >> ~/.hermes/.env
    hermes gateway restart
    ```
4.  从 ntfy 应用向该主题发送一条消息。智能体的回复会作为推送通知到达。

## 将 ntfy 与 cron 作业配合使用

一旦设置了 `NTFY_HOME_CHANNEL`，cron 作业即可投递到 ntfy：

```python
cronjob(
    action="create",
    schedule="every 1h",
    deliver="ntfy",          # 使用 NTFY_HOME_CHANNEL
    prompt="Check for alerts and summarise."
)
```

或者显式指定一个特定主题：

```python
send_message(target="ntfy:alerts-channel", message="Done!")
```

即使 cron 在与网关不同的进程中运行，这也有效——插件注册了一个 `standalone_sender_fn`，它会打开自己的 HTTP 连接。

## 自托管 ntfy

如果你想要完全控制：

```bash
# Docker
docker run -p 80:80 -it binwiederhier/ntfy serve

# 原生安装
go install heckel.io/ntfy/v2@latest
ntfy serve
```

然后将 Hermes 指向它：

```
NTFY_SERVER_URL=https://ntfy.mydomain.com
NTFY_TOPIC=hermes
NTFY_TOKEN=tk_abc123  # 如果你设置了访问控制
```

自托管为你提供主题访问控制、消息持久化策略、附件和表情符号标签。请参阅 [ntfy 服务器文档](https://docs.ntfy.sh/install/)。

## Markdown 格式

当发布者设置 `X-Markdown: true` 头时，ntfy 客户端会渲染 Markdown。要为传出的 Hermes 回复启用此功能：

```
NTFY_MARKDOWN=true
```

或在 `config.yaml` 中：

```yaml
platforms:
  ntfy:
    extra:
      markdown: true
```

移动应用支持 CommonMark 的一个子集——粗体、斜体、列表、链接、带围栏的代码块。确切支持的格式请参阅 [ntfy 的 Markdown 文档](https://docs.ntfy.sh/publish/#markdown-formatting)。

## 仅出站设置（无入站的通知）

如果你只希望 Hermes 向 ntfy *推送*通知（cron 摘要、警报），并且永远不接受回传消息，请将 `NTFY_TOPIC` 和 `NTFY_PUBLISH_TOPIC` 设置为相同的值，并完全跳过 `NTFY_ALLOWED_USERS`。没有允许列表，智能体就永远不会响应入站消息——你的手机会收到推送，但对话是单向的。

## 限制

- **消息大小**：ntfy 将消息正文限制在 4096 个字符。当超出此限制时，Hermes 会截断并发出警告。
- **没有输入指示器**：该协议不提供此功能；`send_typing` 是一个空操作。
- **没有线程或附件**：ntfy 是纯推送通知。长回复保留在消息正文中，没有线程展开。
- **没有原生用户身份**：请参阅上面的身份模型章节。

## 故障排除

**认证失败 / 401** — `NTFY_TOKEN` 错误，或者令牌在此主题上没有发布/订阅权限。适配器会在 401 错误时停止其重连循环，网关运行时状态将显示 `fatal: ntfy_unauthorized`。修正令牌并重启网关。

**主题未找到 / 404** — 配置的服务器上不存在 `NTFY_TOPIC`。对于 ntfy.sh，主题在首次发布时自动创建，因此 404 表示你指向的是一个未预置该主题的自托管服务器。适配器将以 `fatal: ntfy_topic_not_found` 停止其重连循环。

**已连接但没有消息** — 检查 `NTFY_ALLOWED_USERS` 是否包含主题名称本身。根据 ntfy 的身份模型，主题就是用户；保留空的允许列表会拒绝所有消息。

**每 60 秒重连一次** — 流保活默认时间是 55 秒；ntfy 可能存在间歇性网络问题。适配器应用指数退避（2 → 5 → 10 → 30 → 60 秒），并且当一个流保持存活 ≥60 秒后会重置为 0。