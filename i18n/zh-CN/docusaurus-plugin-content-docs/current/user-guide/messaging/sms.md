sidebar_position: 8
sidebar_label: "SMS (Twilio)"
title: "SMS (Twilio)"
description: "通过 Twilio 将 Hermes Agent 设置为 SMS 聊天机器人"
---

# SMS 设置 (Twilio)

Hermes 通过 [Twilio](https://www.twilio.com/) API 连接到 SMS。用户通过文本消息向您的 Twilio 电话号码发送消息，然后收到 AI 回复——这与 Telegram 或 Discord 上的对话体验相同，但使用的是标准文本消息。

:::info 共享凭证
SMS 网关与可选的 [电话技能](/docs/reference/skills-catalog) 共享凭证。如果您已经为语音通话或一次性 SMS 设置了 Twilio，那么该网关将使用相同的 `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_PHONE_NUMBER`。
:::

---

## 前提条件

- **Twilio 账户** — [访问 twilio.com 注册](https://www.twilio.com/try-twilio) (提供免费试用)
- **具有 SMS 功能的 Twilio 电话号码**
- **可公开访问的服务器** — 当收到 SMS 时，Twilio 会向您的服务器发送 Webhook
- **aiohttp** — `pip install 'hermes-agent[sms]'`

---

## 步骤 1：获取 Twilio 凭证

1. 访问 [Twilio 控制台](https://console.twilio.com/)
2. 从仪表板复制您的 **Account SID** 和 **Auth Token**
3. 导航到 **电话号码 → 管理 → 活动号码** — 记下您的电话号码（E.164 格式，例如：`+15551234567`）

---

## 步骤 2：配置 Hermes

### 交互式设置（推荐）

```bash
hermes gateway setup
```

从平台列表中选择 **SMS (Twilio)**。向导将提示您输入凭证。

### 手动设置

添加到 `~/.hermes/.env`：

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567

# 安全性：限制到特定的电话号码（推荐）
SMS_ALLOWED_USERS=+15559876543,+15551112222

# 可选：设置用于定时任务交付的家庭频道
SMS_HOME_CHANNEL=+15559876543
```

---

## 步骤 3：配置 Twilio Webhook

Twilio 需要知道将传入消息发送到哪里。在 [Twilio 控制台](https://console.twilio.com/)：

1. 导航到 **电话号码 → 管理 → 活动号码**
2. 点击您的电话号码
3. 在 **消息传递 → 收到消息时** 下，设置：
   - **Webhook**: `https://your-server:8080/webhooks/twilio`
   - **HTTP 方法**: `POST`

:::tip 暴露 Webhook
如果您在本地运行 Hermes，请使用隧道来暴露 Webhook：

```bash
# 使用 cloudflared
cloudflared tunnel --url http://localhost:8080

# 使用 ngrok
ngrok http 8080
```

将生成的公共 URL 设置为您的 Twilio Webhook。
:::

**将 `SMS_WEBHOOK_URL` 设置为您在 Twilio 中配置的相同 URL。** 这对于 Twilio 签名验证是必需的——没有它，适配器将拒绝启动：

```bash
# 必须与您 Twilio 控制台中的 Webhook URL 匹配
SMS_WEBHOOK_URL=https://your-server:8080/webhooks/twilio
```

Webhook 端口默认为 `8080`。如果需要覆盖，请使用：

```bash
SMS_WEBHOOK_PORT=3000
```

---

## 步骤 4：启动网关

```bash
hermes gateway
```

您应该看到：

```
[sms] Twilio webhook server listening on 0.0.0.0:8080, from: +1555***4567
```

如果看到 `Refusing to start: SMS_WEBHOOK_URL is required`，请将 `SMS_WEBHOOK_URL` 设置为您在 Twilio 控制台中配置的公共 URL（参见步骤 3）。

发送消息到您的 Twilio 号码——Hermes 将通过 SMS 回复。

---

## 环境变量

| 变量 | 是否必需 | 描述 |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | 是 | Twilio 账户 SID (以 `AC` 开头) |
| `TWILIO_AUTH_TOKEN` | 是 | Twilio Auth Token (也用于 Webhook 签名验证) |
| `TWILIO_PHONE_NUMBER` | 是 | 您的 Twilio 电话号码 (E.164 格式) |
| `SMS_WEBHOOK_URL` | 是 | Twilio 签名验证的公共 URL — 必须与您 Twilio 控制台中的 Webhook URL 匹配 |
| `SMS_WEBHOOK_PORT` | 否 | Webhook 监听端口 (默认: `8080`) |
| `SMS_WEBHOOK_HOST` | 否 | Webhook 绑定地址 (默认: `0.0.0.0`) |
| `SMS_INSECURE_NO_SIGNATURE` | 否 | 设置为 `true` 禁用签名验证（仅限本地开发 — **不适用于生产环境**） |
| `SMS_ALLOWED_USERS` | 否 | 允许聊天的一系列逗号分隔的 E.164 电话号码 |
| `SMS_ALLOW_ALL_USERS` | 否 | 设置为 `true` 以允许任何人 (不推荐) |
| `SMS_HOME_CHANNEL` | 否 | 定时任务/通知交付的电话号码 |
| `SMS_HOME_CHANNEL_NAME` | 否 | 家庭频道的显示名称 (默认: `Home`) |

---

## SMS 特有行为

- **仅限纯文本** — 由于 SMS 将其渲染为字面字符，Markdown 会自动剥离
- **1600 字符限制** — 更长的回复会在自然边界（换行符，然后是空格）处分割成多条消息
- **防止回显** — 忽略来自您自己 Twilio 号码的消息，以防止循环
- **电话号码脱敏** — 出于隐私考虑，日志中会脱敏电话号码

---

## 安全性

### Webhook 签名验证

Hermes 通过验证 `X-Twilio-Signature` 头部（HMAC-SHA1）来验证传入的 Webhook 是否确实来自 Twilio。这可以防止攻击者注入伪造的消息。

**`SMS_WEBHOOK_URL` 是必需的。** 请将其设置为您在 Twilio 控制台配置的公共 URL。没有它，适配器将拒绝启动。

对于没有公共 URL 的本地开发，您可以禁用验证：

```bash
# 仅限本地开发 — 不适用于生产环境
SMS_INSECURE_NO_SIGNATURE=true
```

### 用户白名单

**网关默认拒绝所有用户。** 配置白名单：

```bash
# 推荐：限制到特定的电话号码
SMS_ALLOWED_USERS=+15559876543,+15551112222

# 或允许所有用户（不推荐用于具有终端访问权限的机器人）
SMS_ALLOW_ALL_USERS=true
```

:::warning
SMS 没有内置的加密功能。除非您了解安全影响，否则不要将 SMS 用于敏感操作。对于敏感用例，请优先考虑 Signal 或 Telegram。
:::

---

## 故障排除

### 消息未到达

1. 检查您的 Twilio Webhook URL 是否正确且可公开访问
2. 验证 `TWILIO_ACCOUNT_SID` 和 `TWILIO_AUTH_TOKEN` 是否正确
3. 检查 Twilio 控制台 → **监控 → 日志 → 消息传递** 以查找交付错误
4. 确保您的电话号码包含在 `SMS_ALLOWED_USERS` 中（或 `SMS_ALLOW_ALL_USERS=true`）

### 回复未发送

1. 检查 `TWILIO_PHONE_NUMBER` 是否设置正确（包含 `+` 的 E.164 格式）
2. 验证您的 Twilio 账户是否具有支持 SMS 的号码
3. 检查 Hermes 网关日志中是否有 Twilio API 错误

### Webhook 端口冲突

如果端口 8080 已在使用，请更改它：

```bash
SMS_WEBHOOK_PORT=3001
```

更新 Twilio 控制台中的 Webhook URL 以匹配。