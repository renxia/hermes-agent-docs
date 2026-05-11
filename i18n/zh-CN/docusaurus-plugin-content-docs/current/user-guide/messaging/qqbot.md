# QQ 机器人

通过 **官方 QQ Bot API (v2)** 将 Hermes 连接到 QQ —— 支持私聊 (C2C)、群组 @ 提及、频道以及直接消息，并具备语音转文字功能。

## 概述

QQ Bot 适配器使用 [官方 QQ Bot API](https://bot.q.qq.com/wiki/develop/api-v2/) 来：

- 通过持久化的 **WebSocket** 连接至 QQ 网关来接收消息
- 通过 **REST API** 发送文本和 Markdown 回复
- 下载并处理图片、语音消息和文件附件
- 使用腾讯内置的 ASR 或可配置的 STT 提供商来转录语音消息

## 前置条件

1.  **QQ 机器人应用** —— 在 [q.qq.com](https://q.qq.com) 注册：
    *   创建一个新应用，并记下你的 **App ID** 和 **App Secret**
    *   启用所需的意图：C2C 消息、群组 @ 消息、频道消息
    *   为测试配置你的机器人为沙箱模式，或为生产环境发布

2.  **依赖** —— 该适配器需要 `aiohttp` 和 `httpx`：
    ```bash
    pip install aiohttp httpx
    ```

## 配置

### 交互式设置

```bash
hermes gateway setup
```

从平台列表中选择 **QQ Bot** 并按照提示操作。

### 手动配置

在 `~/.hermes/.env` 中设置所需的环境变量：

```bash
QQ_APP_ID=your-app-id
QQ_CLIENT_SECRET=your-app-secret
```

## 环境变量

| 变量 | 描述 | 默认值 |
|---|---|---|
| `QQ_APP_ID` | QQ Bot App ID (必填) | — |
| `QQ_CLIENT_SECRET` | QQ Bot App Secret (必填) | — |
| `QQBOT_HOME_CHANNEL` | 用于定时/通知投递的 OpenID | — |
| `QQBOT_HOME_CHANNEL_NAME` | 主频道的显示名称 | `Home` |
| `QQ_ALLOWED_USERS` | 用于私聊访问的、以逗号分隔的用户 OpenID 列表 | open (所有用户) |
| `QQ_GROUP_ALLOWED_USERS` | 用于群组访问的、以逗号分隔的群组 OpenID 列表 | — |
| `QQ_ALLOW_ALL_USERS` | 设置为 `true` 以允许所有私聊 | `false` |
| `QQ_PORTAL_HOST` | 覆盖 QQ 门户主机 (设置为 `sandbox.q.qq.com` 以使用沙箱路由) | `q.qq.com` |
| `QQ_STT_API_KEY` | 语音转文字提供商的 API 密钥 | — |
| `QQ_STT_BASE_URL` | (不直接读取 — 改为在 `config.yaml` 中设置 `platforms.qqbot.extra.stt.baseUrl`) | n/a |
| `QQ_STT_MODEL` | STT 模型名称 | `glm-asr` |

## 高级配置

要进行细粒度控制，请在 `~/.hermes/config.yaml` 中添加平台设置：

```yaml
platforms:
  qqbot:
    enabled: true
    extra:
      app_id: "your-app-id"
      client_secret: "your-secret"
      markdown_support: true       # 启用 QQ Markdown (消息类型 2)。仅限配置文件；无环境变量等效项。
      dm_policy: "open"          # open | allowlist | disabled
      allow_from:
        - "user_openid_1"
      group_policy: "open"       # open | allowlist | disabled
      group_allow_from:
        - "group_openid_1"
      stt:
        provider: "zai"          # zai (GLM-ASR), openai (Whisper) 等。
        baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4"
        apiKey: "your-stt-key"
        model: "glm-asr"
```

## 语音消息 (STT)

语音转文字分两个阶段工作：

1.  **QQ 内置 ASR** (免费，始终首先尝试) —— QQ 在语音消息附件中提供 `asr_refer_text`，这使用腾讯自己的语音识别。
2.  **配置的 STT 提供商** (后备) —— 如果 QQ 的 ASR 没有返回文本，适配器会调用一个兼容 OpenAI 的 STT API：

    *   **智谱/GLM (zai)**：默认提供商，使用 `glm-asr` 模型
    *   **OpenAI Whisper**：设置 `QQ_STT_BASE_URL` 和 `QQ_STT_MODEL`
    *   任何兼容 OpenAI 的 STT 端点

## 故障排除

### 机器人立即断开连接 (快速断开)

这通常意味着：
*   **无效的 App ID / Secret** —— 在 q.qq.com 上仔细检查你的凭据。
*   **缺少权限** —— 确保机器人已启用所需的意图。
*   **仅限沙箱的机器人** —— 如果机器人处于沙箱模式，它只能接收来自 QQ 沙箱测试频道的消息。

### 语音消息未被转录

1.  检查附件数据中是否存在 QQ 内置的 `asr_refer_text`。
2.  如果使用自定义 STT 提供商，请验证 `QQ_STT_API_KEY` 设置正确。
3.  检查网关日志以查找 STT 错误消息。

### 消息未送达

*   在 q.qq.com 上验证机器人的 **意图** 已启用。
*   如果私聊访问受限，请检查 `QQ_ALLOWED_USERS`。
*   对于群组消息，确保机器人被 **@提及** (群组策略可能需要加入白名单)。
*   检查 `QQBOT_HOME_CHANNEL` 以确认定时/通知投递设置。

### 连接错误

*   确保已安装 `aiohttp` 和 `httpx`：`pip install aiohttp httpx`
*   检查到 `api.sgroup.qq.com` 和 WebSocket 网关的网络连接。
*   查看网关日志以获取详细的错误消息和重连行为信息。