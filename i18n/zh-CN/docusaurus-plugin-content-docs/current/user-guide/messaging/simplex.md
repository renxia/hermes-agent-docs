# SimpleX Chat

[SimpleX Chat](https://simplex.chat/) 是一个私密的去中心化消息平台，用户可以在其中拥有自己的联系人和群组。与其他平台不同，SimpleX 不会分配持久的用户 ID——每个联系人都是通过在连接时生成的、不透明的内部 ID 来识别的，这使其成为最私密的消息传递工具之一。

> 运行 `hermes gateway setup` 并选择 **SimpleX** 以获得引导式操作流程。

## 先决条件 (Prerequisites)

- 已安装并作为守护进程运行的 **simplex-chat** CLI
- Python 包 **websockets** (`pip install websockets`)

## 安装 simplex-chat

从 [simplex-chat GitHub releases](https://github.com/simplex-chat/simplex-chat/releases) 页面下载最新版本：

```bash
# Linux / macOS 二进制文件
curl -L https://github.com/simplex-chat/simplex-chat/releases/latest/download/simplex-chat-ubuntu-22_04-x86_64 -o simplex-chat
chmod +x simplex-chat
```

SimpleX Chat 项目没有发布聊天客户端的预构建 Docker 镜像；如需在 Docker 中运行，请从 [simplex-chat 仓库](https://github.com/simplex-chat/simplex-chat) 构建源码。

## 启动守护进程 (Start the daemon)

```bash
simplex-chat -p 5225
```

该守护进程默认监听 WebSocket 协议的 `ws://127.0.0.1:5225`。

## 配置 Hermes

### 通过设置向导 (Via setup wizard)

```bash
hermes gateway setup
```

选择 **SimpleX Chat** 并遵循提示进行操作。

### 通过环境变量 (Via environment variables)

将这些变量添加到 `~/.hermes/.env`：

```
SIMPLEX_WS_URL=ws://127.0.0.1:5225
SIMPLEX_ALLOWED_USERS=<contact-id-1>,<contact-id-2>
SIMPLEX_HOME_CHANNEL=<contact-id>
```

| 变量 | 是否必需 (Required) | 描述 |
|---|---|---|
| `SIMPLEX_WS_URL` | 是 (Yes) | simplex-chat 守护进程的 WebSocket URL |
| `SIMPLEX_ALLOWED_USERS` | 推荐 (Recommended) | 用逗号分隔的允许列表。每个条目可以是数字 `contactId` **或** 显示名称——两种形式均可使用。 |
| `SIMPLEX_ALLOW_ALL_USERS` | 可选 (Optional) | 设置为 `true` 以允许所有联系人（请谨慎使用） |
| `SIMPLEX_AUTO_ACCEPT` | 可选 (Optional) | 自动接受传入的联系请求（默认值：`true`） |
| `SIMPLEX_GROUP_ALLOWED` | 可选 (Optional) | 机器人参与的群组 ID 列表，或 `*` 表示所有群组。如果省略则完全忽略群消息 |
| `SIMPLEX_HOME_CHANNEL` | 可选 (Optional) | 用于定时任务投递的默认联系人/群组 ID |
| `SIMPLEX_HOME_CHANNEL_NAME` | 可选 (Optional) | 首页通道的人类标签 |
| `HERMES_SIMPLEX_TEXT_BATCH_DELAY` | 可选 (Optional) | （默认值：`0.8`）用于将快速发送的传入文本消息合并为一个事件的静默期秒数 |

## 查找联系人 ID 或显示名称

启动守护进程后，与你的智能体联系人开启对话。数字 `contactId` 会出现在会话日志中，或者通过 `hermes send_message action=list` 查看。如果你更愿意使用 SimpleX UI 中显示的显示名称，那也是可以的——`SIMPLEX_ALLOWED_USERS` 都接受这两种形式。

## 授权 (Authorization)

默认情况下，**所有联系人都被拒绝**。你必须：

1. 将 `SIMPLEX_ALLOWED_USERS` 设置为逗号分隔的 `contactId` 和/或显示名称列表（例如，`SIMPLEX_ALLOWED_USERS=4,alice` 同时匹配 ID 为 4 的联系人或显示名称为 "alice" 的联系人），或者
2. 使用 **DM 配对**——向机器人发送任何消息，它将回复一个配对代码。通过 `hermes pairing approve simplex <CODE>` 输入该代码。

## 群聊 (Group chats)

默认情况下，适配器会忽略群组消息——否则，机器人会在群组中处理每个成员的流量。显式选择加入：

```
SIMPLEX_GROUP_ALLOWED=12,34          # 特定群组 ID
# 或
SIMPLEX_GROUP_ALLOWED=*              # 机器人所在的任何群组
```

通过在聊天 ID 前缀上 `group:` 来指定群组，例如在 `send_message` 中使用 `simplex:group:12` 或作为 cron 的 `deliver=` 目标。

## 附件 (Attachments)

适配器支持双向的原生 SimpleX 附件：

- **传入 (Inbound)** — 传入的图片、语音笔记和文件通过守护进程的 XFTP 流程（`rcvFileDescrReady` → `/freceive` → 等待 `rcvFileComplete`）被接受，并作为带有适当 `MessageType` (`PHOTO`, `VOICE`, `TEXT` + 文档) 的 `MessageEvent.media_urls` 显示。
- **传出 (Outbound)** — `send_image_file`、`send_voice`、`send_document` 和 `send_video` 都使用带有 `filePath` 的结构化 `/_send` 表单，因此接收的 SimpleX 客户端会内联渲染图片并播放语音笔记，而不是将它们提供为下载。

智能体回复中也可以嵌入纯文本中的 `MEDIA:/path/to/file` 标签——适配器会从正文中剥离该标签，并将文件作为语音笔记（音频扩展名）或文档发送。

## 使用 SimpleX 进行定时任务 (Using SimpleX with cron jobs)

```python
cronjob(
    action="create",
    schedule="every 1h",
    deliver="simplex",          # 使用 SIMPLEX_HOME_CHANNEL
    prompt="Check for alerts and summarise."
)
```

或者针对特定的联系人：

```python
send_message(target="simplex:<contact-id>", message="Done!")
```

## 隐私说明 (Privacy notes)

- SimpleX 从不透露电话号码或电子邮件地址——联系人使用的是不透明的 ID。
- Hermes 和守护进程之间的连接是本地 WebSocket (`ws://127.0.0.1:5225`)——没有数据会离开你的机器。
- 消息在到达守护进程之前，就已经通过 SimpleX 协议进行了端到端加密。

## 故障排除 (Troubleshooting)

**“Cannot reach daemon”（无法连接到守护进程）** — 请确保 `simplex-chat -p 5225` 正在运行，并且端口与 `SIMPLEX_WS_URL` 匹配。

**“websockets not installed”（未安装 websockets）** — 运行 `pip install websockets`。

**消息未收到 (Messages not received)** — 检查联系人的 ID 是否在 `SIMPLEX_ALLOWED_USERS` 中，或者通过 DM 配对进行批准。