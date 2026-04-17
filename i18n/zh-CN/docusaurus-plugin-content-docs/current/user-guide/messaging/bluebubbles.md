# BlueBubbles (iMessage)

通过 [BlueBubbles](https://bluebubbles.app/) 将 Hermes 连接到 Apple iMessage — 这是一款免费的开源 macOS 服务器，可将 iMessage 连接到任何设备。

## 前提条件

- 一台运行着 [BlueBubbles Server](https://bluebubbles.app/) 的 **Mac**（必须保持开机状态）
- 在该 Mac 上登录了 Messages.app 的 Apple ID
- BlueBubbles Server v1.0.0+（Webhooks 需要此版本）
- Hermes 与 BlueBubbles 服务器之间的网络连接

## 设置

### 1. 安装 BlueBubbles Server

从 [bluebubbles.app](https://bluebubbles.app/) 下载并安装。完成设置向导——使用您的 Apple ID 登录并配置连接方式（本地网络、Ngrok、Cloudflare 或动态 DNS）。

### 2. 获取服务器 URL 和密码

在 BlueBubbles Server → **设置 → API** 中记下：
- **服务器 URL**（例如：`http://192.168.1.10:1234`）
- **服务器密码**

### 3. 配置 Hermes

运行设置向导：

```bash
hermes gateway setup
```

选择 **BlueBubbles (iMessage)** 并输入您的服务器 URL 和密码。

或者直接在 `~/.hermes/.env` 中设置环境变量：

```bash
BLUEBUBBLES_SERVER_URL=http://192.168.1.10:1234
BLUEBUBBLES_PASSWORD=your-server-password
```

### 4. 授权用户

选择以下任一方法：

**DM 配对（推荐）：**
当有人给您的 iMessage 发送消息时，Hermes 会自动向他们发送一个配对代码。使用以下命令批准它：
```bash
hermes pairing approve bluebubbles <CODE>
```
使用 `hermes pairing list` 查看待处理代码和已批准用户。

**预先授权特定用户**（在 `~/.hermes/.env` 中）：
```bash
BLUEBUBBLES_ALLOWED_USERS=user@icloud.com,+15551234567
```

**开放访问**（在 `~/.hermes/.env` 中）：
```bash
BLUEBUBBLES_ALLOW_ALL_USERS=true
```

### 5. 启动网关

```bash
hermes gateway run
```

Hermes 将连接到您的 BlueBubbles 服务器，注册一个 webhook，并开始监听 iMessage 消息。

## 工作原理

```
iMessage → Messages.app → BlueBubbles Server → Webhook → Hermes
Hermes → BlueBubbles REST API → Messages.app → iMessage
```

- **入站 (Inbound)：** 当收到新消息时，BlueBubbles 会向本地监听器发送 webhook 事件。无轮询——即时投递。
- **出站 (Outbound)：** Hermes 通过 BlueBubbles REST API 发送消息。
- **媒体 (Media)：** 图片、语音消息、视频和文档在这两个方向都得到支持。入站附件会被下载并本地缓存，供代理处理。

## 环境变量

| 变量 | 是否必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `BLUEBUBBLES_SERVER_URL` | 是 | — | BlueBubbles 服务器 URL |
| `BLUEBUBBLES_PASSWORD` | 是 | — | 服务器密码 |
| `BLUEBUBBLES_WEBHOOK_HOST` | 否 | `127.0.0.1` | Webhook 监听地址 |
| `BLUEBUBBLES_WEBHOOK_PORT` | 否 | `8645` | Webhook 监听端口 |
| `BLUEBUBBLES_WEBHOOK_PATH` | 否 | `/bluebubbles-webhook` | Webhook URL 路径 |
| `BLUEBUBBLES_HOME_CHANNEL` | 否 | — | 用于 cron 投递的电话/电子邮件 |
| `BLUEBUBBLES_ALLOWED_USERS` | 否 | — | 逗号分隔的授权用户 |
| `BLUEBUBBLES_ALLOW_ALL_USERS` | 否 | `false` | 是否允许所有用户 |
| `BLUEBUBBLES_SEND_READ_RECEIPTS` | 否 | `true` | 是否自动标记消息为已读 |

## 功能特性

### 文字消息
发送和接收 iMessage。Markdown 会自动剥离，以实现干净的纯文本投递。

### 富媒体
- **图片：** 照片原生显示在 iMessage 聊天中
- **语音消息：** 音频文件作为 iMessage 语音消息发送
- **视频：** 视频附件
- **文档：** 作为 iMessage 附件发送的文件

### 回复反应 (Tapback Reactions)
爱心、点赞、不喜欢、笑、强调和疑问等反应。需要 BlueBubbles 的 [私有 API 助手](https://docs.bluebubbles.app/helper-bundle/installation)。

### 输入指示器 (Typing Indicators)
当代理正在处理消息时，在 iMessage 聊天中显示“正在输入...”。需要私有 API。

### 已读回执 (Read Receipts)
处理后自动将消息标记为已读。需要私有 API。

### 聊天寻址 (Chat Addressing)
您可以通过电子邮件或电话号码寻址聊天——Hermes 会自动将它们解析为 BlueBubbles 的聊天 GUID。无需使用原始 GUID 格式。

## 私有 API

某些功能需要 BlueBubbles 的 [私有 API 助手](https://docs.bluebubbles.app/helper-bundle/installation)：
- 回复反应
- 输入指示器
- 已读回执
- 通过地址创建新聊天

没有私有 API，基本的文字消息和媒体功能仍然可用。

## 故障排除

### “无法连接到服务器”
- 验证服务器 URL 是否正确，以及 Mac 是否开机
- 检查 BlueBubbles Server 是否正在运行
- 确保网络连接（防火墙、端口转发）

### 消息未到达
- 检查 BlueBubbles Server → 设置 → API → Webhooks 中是否注册了 webhook
- 验证 webhook URL 是否可以从 Mac 访问
- 检查 `hermes logs gateway` 查看 webhook 错误（或使用 `hermes logs -f` 实时跟踪）

### “私有 API 助手未连接”
- 安装私有 API 助手：[docs.bluebubbles.app](https://docs.bluebubbles.app/helper-bundle/installation)
- 没有它也能使用基本消息功能——只有反应、输入指示器和已读回执需要它。