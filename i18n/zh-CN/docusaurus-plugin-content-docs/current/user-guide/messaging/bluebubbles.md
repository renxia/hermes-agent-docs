# BlueBubbles (iMessage)

通过 [BlueBubbles](https://bluebubbles.app/) 将 Hermes 连接到 Apple iMessage——这是一个免费的开源 macOS 服务器，可将 iMessage 桥接到任何设备。

## 前置条件

- 一台**Mac**（保持开机）运行 [BlueBubbles Server](https://bluebubbles.app/)
- 在该 Mac 上登录 Apple ID 到"信息"应用
- BlueBubbles Server v1.0.0+（webhook 需要此版本）
- Hermes 与 BlueBubbles 服务器之间的网络连接

## 设置

### 1. 安装 BlueBubbles Server

从 [bluebubbles.app](https://bluebubbles.app/) 下载并安装。完成设置向导——使用您的 Apple ID 登录并配置连接方法（本地网络、Ngrok、Cloudflare 或动态 DNS）。

### 2. 获取服务器 URL 和密码

在 BlueBubbles Server → **设置 → API** 中，记录：
- **服务器 URL**（例如 `http://192.168.1.10:1234`）
- **服务器密码**

### 3. 配置 Hermes

运行设置向导：

```bash
hermes gateway setup
```

选择 **BlueBubbles (iMessage)** 并输入您的服务器 URL 和密码。

或在 `~/.hermes/.env` 中直接设置环境变量：

```bash
BLUEBUBBLES_SERVER_URL=http://192.168.1.10:1234
BLUEBUBBLES_PASSWORD=your-server-password
```

#### 可选：在群聊中需要 @提及

默认情况下，Hermes 会响应每个授权的 BlueBubbles/iMessage 私信或群聊消息。要使群聊变为按需开启，请启用提及门控：

```yaml
platforms:
  bluebubbles:
    enabled: true
    extra:
      require_mention: true
```

启用 `require_mention: true` 后，私信仍然正常工作，但群聊消息将被忽略，除非匹配到提及模式。如果您未配置自定义模式，Hermes 将使用 `Hermes` 和 `@Hermes agent` 变体的保守默认值。

要使用自定义智能体名称，请设置正则表达式模式：

```yaml
platforms:
  bluebubbles:
    extra:
      require_mention: true
      mention_patterns:
        - '(?<![\w@])@?amos\b[,:\-]?'
```

### 4. 授权用户

选择一种方法：

**私信配对（推荐）：**
当有人通过 iMessage 给您发消息时，Hermes 会自动向他们发送配对码。使用以下命令批准：
```bash
hermes pairing approve bluebubbles <CODE>
```
使用 `hermes pairing list` 查看待处理的配对码和已授权用户。

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

Hermes 将连接到您的 BlueBubbles 服务器，注册 webhook，并开始监听 iMessage 消息。

## 工作原理

```
iMessage → 信息应用 → BlueBubbles Server → Webhook → Hermes
Hermes → BlueBubbles REST API → 信息应用 → iMessage
```

- **入站：** 当新消息到达时，BlueBubbles 向本地监听器发送 webhook 事件。无需轮询——即时送达。
- **出站：** Hermes 通过 BlueBubbles REST API 发送消息。
- **媒体：** 图片、语音消息、视频和文档均支持双向传输。入站附件会被下载并缓存到本地，供智能体处理。

## 环境变量

| 变量 | 必需 | 默认值 | 说明 |
|----------|------|---------|------|
| `BLUEBUBBLES_SERVER_URL` | 是 | — | BlueBubbles 服务器 URL |
| `BLUEBUBBLES_PASSWORD` | 是 | — | 服务器密码 |
| `BLUEBUBBLES_WEBHOOK_HOST` | 否 | `127.0.0.1` | Webhook 监听器绑定地址 |
| `BLUEBUBBLES_WEBHOOK_PORT` | 否 | `8645` | Webhook 监听器端口 |
| `BLUEBUBBLES_WEBHOOK_PATH` | 否 | `/bluebubbles-webhook` | Webhook URL 路径 |
| `BLUEBUBBLES_HOME_CHANNEL` | 否 | — | 用于定时任务投递的电话/邮箱 |
| `BLUEBUBBLES_ALLOWED_USERS` | 否 | — | 逗号分隔的授权用户 |
| `BLUEBUBBLES_ALLOW_ALL_USERS` | 否 | `false` | 允许所有用户 |
| `BLUEBUBBLES_REQUIRE_MENTION` | 否 | `false` | 在群聊中响应前需要提及模式 |
| `BLUEBUBBLES_MENTION_PATTERNS` | 否 | Hermes 唤醒词 | JSON 数组、换行分隔或逗号分隔的正则表达式模式，用于群聊提及匹配 |

自动标记消息为已读由 `~/.hermes/config.yaml` 中 `platforms.bluebubbles.extra` 下的 `send_read_receipts` 键控制（默认值：`true`）。没有对应的环境变量。

## 功能

### 文本消息
发送和接收 iMessage。Markdown 会自动去除，以纯文本形式干净传递。

### 富媒体
- **图片：** 照片以原生形式显示在 iMessage 对话中
- **语音消息：** 音频文件以 iMessage 语音消息形式发送
- **视频：** 视频附件
- **文档：** 文件以 iMessage 附件形式发送

### 点按回应
爱心、喜欢、不喜欢、大笑、强调和疑问回应。需要 BlueBubbles [私有 API 助手](https://docs.bluebubbles.app/helper-bundle/installation)。

### 输入指示器
智能体处理时，在 iMessage 对话中显示"正在输入..."。需要私有 API。

### 已读回执
处理完成后自动将消息标记为已读。需要私有 API。

### 对话寻址
您可以通过邮箱或电话号码来指定对话——Hermes 会自动将其解析为 BlueBubbles 的对话 GUID。无需使用原始 GUID 格式。

## 私有 API

某些功能需要 BlueBubbles [私有 API 助手](https://docs.bluebubbles.app/helper-bundle/installation)：
- 点按回应
- 输入指示器
- 已读回执
- 通过地址创建新对话

没有私有 API 的情况下，基本文本消息和媒体仍然可用。

## 故障排除

### "无法连接服务器"
- 验证服务器 URL 是否正确且 Mac 已开机
- 检查 BlueBubbles Server 是否正在运行
- 确保网络连接（防火墙、端口转发）

### 消息未到达
- 检查 webhook 是否在 BlueBubbles Server → 设置 → API → Webhooks 中注册
- 验证 webhook URL 是否可从 Mac 访问
- 检查 `hermes logs gateway` 中的 webhook 错误（或使用 `hermes logs -f` 实时跟踪）

### "未连接私有 API 助手"
- 安装私有 API 助手：[docs.bluebubbles.app](https://docs.bluebubbles.app/helper-bundle/installation)
- 没有它基本消息功能仍然可用——只有回应、输入指示器和已读回执需要它