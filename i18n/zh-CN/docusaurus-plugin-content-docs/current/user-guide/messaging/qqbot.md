# QQ 机器人

通过 **官方 QQ 机器人 API (v2)** 将 Hermes 连接到 QQ —— 支持私聊（C2C）、群聊 @ 提及、频道和私信，并提供语音转写功能。

## 概览

QQ 机器人适配器使用[官方 QQ 机器人 API](https://bot.q.qq.com/wiki/develop/api-v2/) 实现以下功能：

- 通过持久的 **WebSocket** 连接接收来自 QQ 网关的消息
- 通过 **REST API** 发送文本和 Markdown 回复
- 下载并处理图片、语音消息和文件附件
- 使用腾讯内置的 ASR 或可配置的 STT 提供商对语音消息进行转写

## 先决条件

1. **QQ 机器人应用** —— 在 [q.qq.com](https://q.qq.com) 注册：
   - 创建一个新应用，并记录你的 **App ID** 和 **App Secret**
   - 启用所需意图：C2C 消息、群聊 @ 消息、频道消息
   - 在沙箱模式下配置你的机器人以进行测试，或发布到生产环境

2. **依赖项** —— 适配器需要 `aiohttp` 和 `httpx`：
   ```bash
   pip install aiohttp httpx
   ```

## 配置

### 交互式设置

```bash
hermes gateway setup
```

从平台列表中选择 **QQ 机器人**，并按照提示操作。

### 手动配置

在 `~/.hermes/.env` 中设置所需的环境变量：

```bash
QQ_APP_ID=your-app-id
QQ_CLIENT_SECRET=your-app-secret
```

## 环境变量

| 变量 | 描述 | 默认值 |
|---|---|---|
| `QQ_APP_ID` | QQ 机器人应用 ID（必需） | — |
| `QQ_CLIENT_SECRET` | QQ 机器人应用密钥（必需） | — |
| `QQBOT_HOME_CHANNEL` | 用于定时任务/通知投递的 OpenID | — |
| `QQBOT_HOME_CHANNEL_NAME` | 主频道显示名称 | `Home` |
| `QQ_ALLOWED_USERS` | 允许私信访问的用户 OpenID（逗号分隔） | open（所有用户） |
| `QQ_GROUP_ALLOWED_USERS` | 允许群聊访问的群组 OpenID（逗号分隔） | — |
| `QQ_ALLOW_ALL_USERS` | 设为 `true` 以允许所有私信 | `false` |
| `QQ_PORTAL_HOST` | 覆盖 QQ 门户主机（沙箱路由请设为 `sandbox.q.qq.com`） | `q.qq.com` |
| `QQ_STT_API_KEY` | 语音转文本提供商的 API 密钥 | — |
| `QQ_STT_BASE_URL` | STT 提供商的基 URL | `https://open.bigmodel.cn/api/coding/paas/v4` |
| `QQ_STT_MODEL` | STT 模型名称 | `glm-asr` |

## 高级配置

如需更精细的控制，请在 `~/.hermes/config.yaml` 中添加平台设置：

```yaml
platforms:
  qq:
    enabled: true
    extra:
      app_id: "your-app-id"
      client_secret: "your-secret"
      markdown_support: true       # 启用 QQ Markdown（msg_type 2）。仅支持配置文件设置，无等效环境变量。
      dm_policy: "open"          # open | allowlist | disabled
      allow_from:
        - "user_openid_1"
      group_policy: "open"       # open | allowlist | disabled
      group_allow_from:
        - "group_openid_1"
      stt:
        provider: "zai"          # zai (GLM-ASR), openai (Whisper) 等
        baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4"
        apiKey: "your-stt-key"
        model: "glm-asr"
```

## 语音消息（STT）

语音转写分两个阶段进行：

1. **QQ 内置 ASR**（免费，始终优先尝试）—— QQ 在语音消息附件中提供 `asr_refer_text`，使用腾讯自己的语音识别技术
2. **配置的 STT 提供商**（备用方案）—— 如果 QQ 的 ASR 未返回文本，适配器将调用兼容 OpenAI 的 STT API：

   - **智谱/GLM (zai)**：默认提供商，使用 `glm-asr` 模型
   - **OpenAI Whisper**：设置 `QQ_STT_BASE_URL` 和 `QQ_STT_MODEL`
   - 任何兼容 OpenAI 的 STT 端点

## 故障排除

### 机器人立即断开连接（快速断开）

这通常意味着：
- **无效的 App ID / 密钥** —— 请再次在 q.qq.com 检查你的凭据
- **缺少权限** —— 确保机器人已启用所需意图
- **仅限沙箱的机器人** —— 如果机器人处于沙箱模式，则只能接收来自 QQ 沙箱测试频道的消息

### 语音消息未转写

1. 检查附件数据中是否存在 QQ 内置的 `asr_refer_text`
2. 如果使用自定义 STT 提供商，请验证 `QQ_STT_API_KEY` 是否设置正确
3. 检查网关日志中的 STT 错误消息

### 消息未送达

- 验证机器人在 q.qq.com 上是否已启用 **意图**
- 如果私信访问受限，请检查 `QQ_ALLOWED_USERS`
- 对于群聊消息，请确保机器人被 **@提及**（群聊策略可能需要白名单）
- 检查 `QQBOT_HOME_CHANNEL` 以确认定时任务/通知投递

### 连接错误

- 确保已安装 `aiohttp` 和 `httpx`：`pip install aiohttp httpx`
- 检查与 `api.sgroup.qq.com` 和 WebSocket 网关的网络连接
- 查看网关日志以获取详细的错误消息和重连行为