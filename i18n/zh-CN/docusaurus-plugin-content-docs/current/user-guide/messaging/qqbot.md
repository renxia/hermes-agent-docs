# QQ Bot

通过 **官方QQ机器人API (v2)** 将Hermes连接到QQ——支持私信（C2C）、群@提及、频道和语音消息转文字的直接消息。

## 概述

QQ机器人适配器使用[官方QQ机器人API](https://bot.q.qq.com/wiki/develop/api-v2/)实现以下功能：

- 通过QQ网关的**WebSocket**连接接收消息
- 通过**REST API**发送文本和markdown回复
- 下载并处理图片、语音消息和文件附件
- 使用腾讯内置ASR或可配置的STT提供商转录语音消息

## 前提条件

1. **QQ机器人应用**——在[q.qq.com](https://q.qq.com)注册：
   - 创建新应用并记录您的**App ID**和**App Secret**
   - 启用所需权限：私信、群@消息、频道消息
   - 测试时配置机器人在沙箱模式，生产环境请发布

2. **依赖项**——该适配器需要`aiohttp`和`httpx`：
   ```bash
   pip install aiohttp httpx
   ```

## 配置

### 交互式设置

```bash
hermes gateway setup
```

从平台列表中选择**QQ Bot**并按照提示操作。

### 手动配置

在`~/.hermes/.env`中设置必需的环境变量：

```bash
QQ_APP_ID=your-app-id
QQ_CLIENT_SECRET=your-app-secret
```

## 环境变量

| 变量 | 描述 | 默认值 |
|---|---|---|
| `QQ_APP_ID` | QQ机器人App ID（必需） | — |
| `QQ_CLIENT_SECRET` | QQ机器人App Secret（必需） | — |
| `QQBOT_HOME_CHANNEL` | cron/通知推送的OpenID | — |
| `QQBOT_HOME_CHANNEL_NAME` | 主频道显示名称 | `Home` |
| `QQ_ALLOWED_USERS` | 允许私信访问的用户OpenID逗号分隔列表 | open（所有用户） |
| `QQ_ALLOW_ALL_USERS` | 设为`true`以允许所有私信 | `false` |
| `QQ_SANDBOX` | 开发测试时将请求路由到QQ沙箱网关 | `false` |
| `QQ_STT_API_KEY` | 语音转文字提供商的API密钥 | — |
| `QQ_STT_BASE_URL` | STT提供商基础URL | `https://open.bigmodel.cn/api/coding/paas/v4` |
| `QQ_STT_MODEL` | STT模型名称 | `glm-asr` |

## 高级配置

如需精细控制，请在`~/.hermes/config.yaml`中添加平台设置：

```yaml
platforms:
  qq:
    enabled: true
    extra:
      app_id: "your-app-id"
      client_secret: "your-secret"
      markdown_support: true       # 启用QQ markdown（msg_type 2）。仅配置生效；无对应环境变量。
      dm_policy: "open"          # open | allowlist | disabled
      allow_from:
        - "user_openid_1"
      group_policy: "open"       # open | allowlist | disabled
      group_allow_from:
        - "group_openid_1"
      stt:
        provider: "zai"          # zai (GLM-ASR)、openai (Whisper)等
        baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4"
        apiKey: "your-stt-key"
        model: "glm-asr"
```

## 语音消息（STT）

语音转录分两个阶段进行：

1. **QQ内置ASR**（免费，始终优先尝试）——QQ在语音消息附件中提供`asr_refer_text`，使用腾讯自己的语音识别技术
2. **可配置STT提供商**（备用）——如果QQ的ASR未返回文本，适配器将调用OpenAI兼容的STT API：

   - **智谱/GLM (zai)**：默认提供商，使用`glm-asr`模型
   - **OpenAI Whisper**：设置`QQ_STT_BASE_URL`和`QQ_STT_MODEL`
   - 任何OpenAI兼容的STT端点

## 故障排除

### 机器人立即断开连接（快速断开）

这通常意味着：
- **无效的App ID / Secret**——请仔细检查您在q.qq.com的凭据
- **缺少权限**——确保机器人已启用所需权限
- **仅限沙箱的机器人**——如果机器人在沙箱模式下，只能接收QQ沙箱测试频道的消息

### 语音消息未被转录

1. 检查QQ内置的`asr_refer_text`是否存在于附件数据中
2. 如果使用自定义STT提供商，请验证`QQ_STT_API_KEY`是否正确设置
3. 查看网关日志中的STT错误信息

### 消息未送达

- 验证机器人在q.qq.com的**权限**是否已启用
- 如果限制私信访问，请检查`QQ_ALLOWED_USERS`
- 对于群消息，请确保机器人被**@提及**（群策略可能需要加入白名单）
- 检查`QQBOT_HOME_CHANNEL`用于cron/通知推送

### 连接错误

- 确保已安装`aiohttp`和`httpx`：`pip install aiohttp httpx`
- 检查到`api.sgroup.qq.com`和WebSocket网关的网络连接
- 查看网关日志获取详细的错误信息和重连行为