# QQ Bot

通过 **官方 QQ Bot API (v2)** 将 Hermes 连接到 QQ，支持私聊 (C2C)、群组 @提及、群组和带语音转录的私信。

## 概述

QQ Bot 适配器使用 [官方 QQ Bot API](https://bot.q.qq.com/wiki/develop/api-v2/) 来：

- 通过持久化的 **WebSocket** 连接接收来自 QQ Gateway 的消息
- 通过 **REST API** 发送文本和 Markdown 回复
- 下载和处理图片、语音消息和文件附件
- 使用腾讯内置的 ASR 或可配置的 STT 提供商转录语音消息

## 前置条件

1. **QQ Bot 应用** — 在 [q.qq.com](https://q.qq.com) 注册：
   - 创建新应用并记录您的 **App ID** 和 **App Secret**
   - 启用所需的权限：C2C 消息、群组 @消息、群组消息
   - 配置您的机器人进入沙盒模式进行测试，或发布用于生产环境

2. **依赖项** — 适配器需要 `aiohttp` 和 `httpx`：
   ```bash
   pip install aiohttp httpx
   ```

## 配置

### 交互式设置

```bash
hermes setup gateway
```

从平台列表中选择 **QQ Bot** 并遵循提示。

### 手动配置

在 `~/.hermes/.env` 中设置所需的环境变量：

```bash
QQ_APP_ID=your-app-id
QQ_CLIENT_SECRET=your-app-secret
```

## 环境变量

| Variable | Description | Default |
|---|---|---|
| `QQ_APP_ID` | QQ Bot App ID (必需) | — |
| `QQ_CLIENT_SECRET` | QQ Bot App Secret (必需) | — |
| `QQ_HOME_CHANNEL` | 定时任务/通知交付的 OpenID | — |
| `QQ_HOME_CHANNEL_NAME` | 首页频道显示名称 | `Home` |
| `QQ_ALLOWED_USERS` | 逗号分隔的用于私信访问的用户 OpenID | open (所有用户) |
| `QQ_ALLOW_ALL_USERS` | 设置为 `true` 以允许所有私信 | `false` |
| `QQ_MARKDOWN_SUPPORT` | 启用 QQ markdown (msg_type 2) | `true` |
| `QQ_STT_API_KEY` | 语音转文本提供商的 API 密钥 | — |
| `QQ_STT_BASE_URL` | STT 提供商的基础 URL | `https://open.bigmodel.cn/api/coding/paas/v4` |
| `QQ_STT_MODEL` | STT 模型名称 | `glm-asr` |

## 高级配置

如需精细控制，请将平台设置添加到 `~/.hermes/config.yaml`：

```yaml
platforms:
  qq:
    enabled: true
    extra:
      app_id: "your-app-id"
      client_secret: "your-secret"
      markdown_support: true
      dm_policy: "open"          # open | allowlist | disabled
      allow_from:
        - "user_openid_1"
      group_policy: "open"       # open | allowlist | disabled
      group_allow_from:
        - "group_openid_1"
      stt:
        provider: "zai"          # zai (GLM-ASR), openai (Whisper), etc.
        baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4"
        apiKey: "your-stt-key"
        model: "glm-asr"
```

## 语音消息 (STT)

语音转录分为两个阶段：

1. **QQ 内置 ASR** (免费，始终优先尝试) — QQ 在语音消息附件中提供 `asr_refer_text`，使用腾讯自身的语音识别功能。
2. **配置的 STT 提供商** (备用) — 如果 QQ 的 ASR 未返回文本，适配器将调用兼容 OpenAI 的 STT API：

   - **智谱/GLM (zai)**：默认提供商，使用 `glm-asr` 模型
   - **OpenAI Whisper**：设置 `QQ_STT_BASE_URL` 和 `QQ_STT_MODEL`
   - 任何兼容 OpenAI 的 STT 端点

## 故障排除

### 机器人立即断开连接 (快速断开)

这通常意味着：
- **App ID / Secret 无效** — 请在 q.qq.com 仔细检查您的凭证
- **缺少权限** — 确保机器人已启用所需的权限
- **仅沙盒模式的机器人** — 如果机器人处于沙盒模式，它只能接收来自 QQ 沙盒测试频道的消息

### 语音消息未转录

1. 检查附件数据中是否包含 QQ 内置的 `asr_refer_text`
2. 如果使用自定义 STT 提供商，请验证 `QQ_STT_API_KEY` 是否设置正确
3. 检查网关日志中是否有 STT 错误消息

### 消息未送达

- 验证机器人的 **权限** 是否在 q.qq.com 启用
- 如果限制私信访问，请检查 `QQ_ALLOWED_USERS`
- 对于群消息，确保机器人被 **@提及** (群组策略可能需要白名单)
- 检查 `QQ_HOME_CHANNEL` 以确认定时任务/通知交付

### 连接错误

- 确保已安装 `aiohttp` 和 `httpx`：`pip install aiohttp httpx`
- 检查到 `api.sgroup.qq.com` 和 WebSocket 网关的网络连接性
- 查阅网关日志以获取详细的错误消息和重连行为