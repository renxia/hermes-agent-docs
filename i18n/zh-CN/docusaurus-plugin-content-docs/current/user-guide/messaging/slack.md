---
sidebar_position: 4
title: "Slack"
description: "使用 Socket Mode 将 Hermes Agent 设置为 Slack 机器人"
---

# Slack 设置

通过 Socket Mode 将 Hermes Agent 连接到 Slack 作为机器人。Socket Mode 使用 WebSocket 而不是公共 HTTP 端点，因此您的 Hermes 实例无需公开访问即可工作 —— 它可以在防火墙后、笔记本电脑或私有服务器上运行。

:::warning 经典 Slack 应用已弃用
经典 Slack 应用（使用 RTM API）**已于 2025 年 3 月完全弃用**。Hermes 使用 Bolt SDK 和现代 Socket Mode。如果您有旧版经典应用，必须按照以下步骤创建新应用。
:::

## 概览

| 组件 | 值 |
|-----------|-------|
| **库** | `slack-bolt` / `slack_sdk` for Python (Socket Mode) |
| **连接** | WebSocket — 无需公共 URL |
| **所需认证令牌** | Bot Token (`xoxb-`) + App-Level Token (`xapp-`) |
| **用户识别** | Slack 成员 ID（例如 `U01ABC2DEF3`） |

---

## 第 1 步：创建 Slack 应用

1. 前往 [https://api.slack.com/apps](https://api.slack.com/apps)
2. 点击 **Create New App**
3. 选择 **From scratch**
4. 输入应用名称（例如 "Hermes Agent"）并选择您的团队空间
5. 点击 **Create App**

您会进入应用的 **基本信息** 页面。

---

## 第 2 步：配置 Bot Token 作用域

在侧边栏导航到 **Features → OAuth & Permissions**。滚动到 **Scopes → Bot Token Scopes** 并添加以下内容：

| 作用域 | 用途 |
|-------|---------|
| `chat:write` | 以机器人身份发送消息 |
| `app_mentions:read` | 检测何时 @提及机器人 |
| `channels:history` | 读取机器人在其中的公共频道的消息 |
| `channels:read` | 列出和获取公共频道的信息 |
| `groups:history` | 读取机器人在其中的私有频道的消息 |
| `im:history` | 读取直接消息历史 |
| `im:read` | 查看基本 DM 信息 |
| `im:write` | 打开和管理 DMs |
| `users:read` | 查找用户信息 |
| `files:read` | 读取和下载附件文件，包括语音笔记/音频 |
| `files:write` | 上传文件（图片、音频、文档） |

:::caution 缺少作用域 = 功能缺失
如果没有 `channels:history` 和 `groups:history`，机器人**将无法接收频道消息** ——
它只能在 DMs 中工作。这些是最常被遗漏的作用域。
:::

**可选作用域：**

| 作用域 | 用途 |
|-------|---------|
| `groups:read` | 列出和获取私有频道的信息 |

---

## 第 3 步：启用 Socket Mode

Socket Mode 允许机器人通过 WebSocket 连接，而无需公共 URL。

1. 在侧边栏中，转到 **Settings → Socket Mode**
2. 将 **Enable Socket Mode** 切换为 ON
3. 系统会提示您创建一个 **App-Level Token**：
   - 命名如 `hermes-socket`（名称无关紧要）
   - 添加 **`connections:write`** 作用域
   - 点击 **Generate**
4. **复制令牌** —— 它以 `xapp-` 开头。这是您的 `SLACK_APP_TOKEN`

:::tip
您始终可以在 **Settings → Basic Information → App-Level Tokens** 下找到或重新生成应用级令牌。
:::

---

## 第 4 步：订阅事件

此步骤至关重要 —— 它控制机器人可以看到哪些消息。

1. 在侧边栏中，转到 **Features → Event Subscriptions**
2. 将 **Enable Events** 切换为 ON
3. 展开 **Subscribe to bot events** 并添加：

| 事件 | 必需？ | 用途 |
|-------|-----------|---------|
| `message.im` | **是** | 机器人接收直接消息 |
| `message.channels` | **是** | 机器人接收其被加入的**公共**频道中的消息 |
| `message.groups` | **推荐** | 机器人接收其被邀请的**私有**频道中的消息 |
| `app_mention` | **是** | 防止在 @提及机器人时出现 Bolt SDK 错误 |

4. 点击页面底部的 **Save Changes**

:::danger 缺少事件订阅是第 1 大设置问题
如果机器人在 DMs 中工作但**不在频道中工作**，您几乎肯定忘记添加
`message.channels`（用于公共频道）和/或 `message.groups`（用于私有频道）。
没有这些事件，Slack 根本不会向机器人传递频道消息。
:::

---

## 第 5 步：启用 Messages Tab

此步骤启用对机器人的直接消息。如果没有它，当用户尝试向机器人发送 DM 时，他们会看到 **"Sending messages to this app has been turned off"**。

1. 在侧边栏中，转到 **Features → App Home**
2. 滚动到 **Show Tabs**
3. 将 **Messages Tab** 切换为 ON
4. 勾选 **"Allow users to send Slash commands and messages from the messages tab"**

:::danger 没有这一步，DM 将被完全阻止
即使拥有所有正确的权限和作用域以及事件订阅，Slack 也不会允许用户向机器人发送直接消息，除非启用了 Messages Tab。这是 Slack 平台的要求，而不是 Hermes 配置问题。
:::

---

## 第 6 步：将应用安装到团队空间

1. 在侧边栏中，转到 **Settings → Install App**
2. 点击 **Install to Workspace**
3. 审查权限并点击 **Allow**
4. 授权后，您将看到一个以 `xoxb-` 开头的 **Bot User OAuth Token**
5. **复制此令牌** —— 这是您的 `SLACK_BOT_TOKEN`

:::tip
如果您稍后更改作用域或事件订阅，**必须重新安装应用**才能使更改生效。
Install App 页面会显示横幅提示您这样做。
:::

---

## 第 7 步：查找白名单的用户 ID

Hermes 使用 Slack **成员 ID**（不是用户名或显示名称）进行白名单。

要查找成员 ID：

1. 在 Slack 中，点击用户的姓名或头像
2. 点击 **View full profile**
3. 点击 **⋮**（更多）按钮
4. 选择 **Copy member ID**

成员 ID 看起来像 `U01ABC2DEF3`。至少您需要自己的成员 ID。

---

## 第 8 步：配置 Hermes

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# 必需
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_APP_TOKEN=xapp-your-app-token-here
SLACK_ALLOWED_USERS=U01ABC2DEF3              # 逗号分隔的成员 ID

# 可选
SLACK_HOME_CHANNEL=C01234567890              # cron/计划消息的默认频道
SLACK_HOME_CHANNEL_NAME=general              # 主页面的可读名称（可选）
```

或者运行交互式设置：

```bash
hermes gateway setup    # 按提示选择 Slack
```

然后启动网关：

```bash
hermes gateway              # 前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # Linux 仅：开机自启系统服务
```

---

## 第 9 步：将机器人邀请到频道

启动网关后，您需要**邀请机器人**到您希望它响应的任何频道：

```
/invite @Hermes Agent
```

机器人**不会**自动加入频道。您必须单独邀请它到每个频道。

---

## 机器人如何响应

了解 Hermes 在不同上下文中的行为：

| 上下文 | 行为 |
|---------|----------|
| **DMs** | 机器人响应每条消息 —— 无需 @提及 |
| **频道** | 机器人**仅在 @提及时才响应**（例如 `@Hermes Agent what time is it?`）。在频道中，Hermes 回复到该消息的线程中。 |
| **线程** | 如果您在现有线程中 @提及 Hermes，它会在同一线程中回复。一旦机器人在线程中有活跃会话，**该线程中的后续回复不需要 @提及** —— 机器人自然地跟进对话。 |

:::tip
在频道中，始终 @提及机器人以开始对话。一旦机器人在线程中活跃，您可以在该线程中回复而无需提及它。在线程外，没有 @提及的消息会被忽略，以防止繁忙频道中的噪音。
:::

---

## 配置选项

除了第 8 步中的必需环境变量外，您还可以通过 `~/.hermes/config.yaml` 自定义 Slack 机器人行为。

### 线程和回复行为

```yaml
platforms:
  slack:
    # 控制多部分响应如何形成线程
    # "off"   — 从不将回复线程化到原始消息
    # "first" — 第一部分线程化到用户消息（默认）
    # "all"   — 所有部分线程化到用户消息
    reply_to_mode: "first"

    extra:
      # 是否在线程中回复（默认：true）。
      # 当为 false 时，频道消息获得直接频道回复而不是线程。
      # 现有线程内的消息仍在线程中回复。
      reply_in_thread: true

      # 也将线程回复发布到主频道
      # （Slack 的 "Also send to channel" 功能）。
      # 只有第一个回复的第一部分会被广播。
      reply_broadcast: false
```

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `platforms.slack.reply_to_mode` | `"first"` | 多部分消息的线程模式：`"off"`、`"first"` 或 `"all"` |
| `platforms.slack.extra.reply_in_thread` | `true` | 当 `false` 时，频道消息获得直接回复而不是线程。现有线程内的消息仍在线程中回复。 |
| `platforms.slack.extra.reply_broadcast` | `false` | 当 `true` 时，线程回复也会发布到主频道。只有第一部分会被广播。 |

### 会话隔离

```yaml
# 全局设置 — 适用于 Slack 和所有其他平台
group_sessions_per_user: true
```

当 `true`（默认值）时，共享频道中的每个用户都有自己的隔离对话会话。两个人在 `#general` 中与 Hermes 交谈会有独立的历史记录和上下文。

设置为 `false` 可启用协作模式，整个频道共享一个对话会话。请注意这意味着用户共享上下文增长和 token 成本，且一个用户的 `/reset` 会清除所有人的会话。

### 提及和触发行为

```yaml
slack:
  # 在频道中要求 @提及（这是默认行为；
  # Slack 适配器无论如何都会强制执行频道中的 @提及限制，
  # 但您可以显式设置此选项以保持与其他平台的一致性）
  require_mention: true

  # 触发机器人的自定义提及模式
  # （除了默认的 @提及检测之外）
  mention_patterns:
    - "hey hermes"
    - "hermes,"

  # 每条传出消息前缀的文本
  reply_prefix: ""
```

:::info
Slack 支持两种模式：默认情况下需要 `@提及` 来开始对话，但您可以通过 `SLACK_FREE_RESPONSE_CHANNELS`（逗号分隔的频道 ID）或 `slack.free_response_channels` in `config.yaml` 选择特定频道排除此限制。一旦机器人在线程中有活跃会话，线程中的后续回复不需要提及。在 DMs 中机器人总是响应而无需提及。
:::

### 未授权用户处理

```yaml
slack:
  # 当未授权用户（不在 SLACK_ALLOWED_USERS 中）向机器人发送 DM 时会发生什么
  # "pair"   — 提示他们输入配对码（默认）
  # "ignore" — 静默丢弃消息
  unauthorized_dm_behavior: "pair"
```

您也可以为所有平台全局设置此选项：

```yaml
unauthorized_dm_behavior: "pair"
```

在 `slack:` 下的平台特定设置优先于全局设置。

### 语音转录

```yaml
# 全局设置 — 启用/禁用自动转录传入的语音消息
stt_enabled: true
```

当 `true`（默认值）时，传入的音频消息会使用配置的 STT 提供程序自动转录，然后再由代理处理。

### 完整示例

```yaml
# 全局网关设置
group_sessions_per_user: true
unauthorized_dm_behavior: "pair"
stt_enabled: true

# Slack 特定设置
slack:
  require_mention: true
  unauthorized_dm_behavior: "pair"

# 平台配置
platforms:
  slack:
    reply_to_mode: "first"
    extra:
      reply_in_thread: true
      reply_broadcast: false
```

---

## 主页频道

设置 `SLACK_HOME_CHANNEL` 为一个频道 ID，Hermes 将在其中传递计划消息、cron 作业结果和其他主动通知。要查找频道 ID：

1. 在 Slack 中右键点击频道名称
2. 点击 **View channel details**
3. 滚动到底部 —— 频道 ID 会显示在那里

```bash
SLACK_HOME_CHANNEL=C01234567890
```

确保机器人已被**邀请到频道**（`/invite @Hermes Agent`）。

---

## 多团队空间支持

Hermes 可以使用单个网关实例同时连接到**多个 Slack 团队空间**。每个团队空间都使用自己的 bot 用户 ID 独立认证。

### 配置

在 `SLACK_BOT_TOKEN` 中将多个 bot 令牌作为**逗号分隔列表**提供：

```bash
# 多个 bot 令牌 — 每个团队空间一个
SLACK_BOT_TOKEN=xoxb-workspace1-token,xoxb-workspace2-token,xoxb-workspace3-token

# Socket Mode 仍使用单个应用级令牌
SLACK_APP_TOKEN=xapp-your-app-token
```

或在 `~/.hermes/config.yaml` 中：

```yaml
platforms:
  slack:
    token: "xoxb-workspace1-token,xoxb-workspace2-token"
```

### OAuth 令牌文件

除了通过环境或配置中的令牌外，Hermes 还会从以下位置加载令牌：

```
~/.hermes/slack_tokens.json
```

此文件是一个 JSON 对象，将团队 ID 映射到令牌条目：

```json
{
  "T01ABC2DEF3": {
    "token": "xoxb-workspace-token-here",
    "team_name": "My Workspace"
  }
}
```

从此文件加载的令牌与通过 `SLACK_BOT_TOKEN` 指定的任何令牌合并。重复令牌会自动去重。

### 工作原理

- 列表中的**第一个令牌**是主令牌，用于 Socket Mode 连接（AsyncApp）。
- 每个令牌在启动时通过 `auth.test` 进行认证。网关将每个 `team_id` 映射到自己的 `WebClient` 和 `bot_user_id`。
- 当消息到达时，Hermes 使用正确的团队特定客户端进行响应。
- 主 `bot_user_id`（来自第一个令牌）用于向后兼容期望单个 bot 身份的某些功能。

---

## 语音消息

Hermes 支持 Slack 上的语音：

- **传入：** 语音/音频消息会使用配置的 STT 提供程序自动转录：本地 `faster-whisper`、Groq Whisper（`GROQ_API_KEY`）或 OpenAI Whisper（`VOICE_TOOLS_OPENAI_KEY`）
- **传出：** TTS 响应作为音频文件附件发送

---

## 每频道提示

为特定的 Slack 频道分配临时系统提示。提示在每次运行时注入 —— 永远不会保存到转录历史记录中 —— 因此更改会立即生效。

```yaml
slack:
  channel_prompts:
    "C01RESEARCH": |
      您是研究助理。专注于学术来源、引用和简洁的综合。
    "C02ENGINEERING": |
      代码审查模式。精确讨论边缘情况和性能影响。
```

键是 Slack 频道 ID（通过频道详情 → "About" → 滚动到底部找到）。匹配频道中的所有消息都会获得作为临时系统指令注入的提示。

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| 机器人不响应 DMs | 验证 `message.im` 是否在您的事件订阅中，并且应用已重新安装 |
| 机器人在 DMs 中工作但在频道中不工作 | **最常见问题。** 向事件订阅添加 `message.channels` 和 `message.groups`，重新安装应用，并使用 `/invite @Hermes Agent` 邀请机器人到频道 |
| 机器人在频道中不响应 @提及 | 1) 检查是否订阅了 `message.channels` 事件。2) 机器人必须被邀请到频道。3) 确保添加了 `channels:history` 作用域。4) 在更改作用域/事件后重新安装应用 |
| 机器人在私有频道中忽略消息 | 添加 `message.groups` 事件订阅和 `groups:history` 作用域，然后重新安装应用并使用 `/invite` 邀请机器人 |
| 在 DMs 中看到 "Sending messages to this app has been turned off" | 在 App Home 设置中启用 **Messages Tab**（见第 5 步） |
| "not_authed" 或 "invalid_auth" 错误 | 重新生成您的 Bot Token 和 App Token，更新 `.env` |
| 机器人响应但不能在频道中发帖 | 使用 `/invite @Hermes Agent` 邀请机器人到频道 |
| "missing_scope" 错误 | 在 OAuth & Permissions 中添加所需作用域，然后**重新安装**应用 |
| Socket 频繁断开连接 | 检查您的网络；Bolt 自动重连但不稳定的连接会导致延迟 |
| 更改了作用域/事件但没有任何变化 | 您在任何作用域或事件订阅更改后**必须重新安装**应用到团队空间 |

### 快速检查清单

如果机器人在频道中不工作，请验证以下所有项目：

1. ✅ `message.channels` 事件已订阅（用于公共频道）
2. ✅ `message.groups` 事件已订阅（用于私有频道）
3. ✅ `app_mention` 事件已订阅
4. ✅ `channels:history` 作用域已添加（用于公共频道）
5. ✅ `groups:history` 作用域已添加（用于私有频道）
6. ✅ 添加作用域/事件后应用已**重新安装**
7. ✅ 机器人已**被邀请**到频道（`/invite @Hermes Agent`）
8. ✅ 您在消息中**@提及**了机器人

---

## 安全

:::warning
**始终设置 `SLACK_ALLOWED_USERS`** 包含授权用户的成员 ID。没有此设置，网关将**拒绝所有消息**作为安全措施。切勿分享您的 bot 令牌 —— 将它们视为密码。
:::

- 令牌应存储在 `~/.hermes/.env` 中（文件权限 `600`）
- 定期通过 Slack 应用设置轮换令牌
- 审核谁可以访问您的 Hermes 配置目录
- Socket Mode 意味着没有暴露的公共端点 —— 攻击面更少