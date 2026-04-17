---
sidebar_position: 4
title: "Slack"
description: "使用 Socket Mode 将 Hermes Agent 设置为 Slack 机器人"
---

# Slack 设置

使用 Socket Mode 将 Hermes Agent 连接到 Slack 作为机器人。Socket Mode 使用 WebSockets 而不是公共 HTTP 端点，因此您的 Hermes 实例不需要公开可访问——它可以在防火墙后、您的笔记本电脑上或私有服务器上运行。

:::warning 经典 Slack 应用已弃用
经典 Slack 应用（使用 RTM API）已于 **2025 年 3 月**完全弃用。Hermes 使用现代的 Bolt SDK 和 Socket Mode。如果您有旧的经典应用，您必须遵循以下步骤创建一个新的应用。
:::

## 概览

| 组件 | 值 |
|-----------|-------|
| **库** | `slack-bolt` / `slack_sdk` 用于 Python (Socket Mode) |
| **连接** | WebSocket — 无需公共 URL |
| **所需认证令牌** | 机器人令牌 (`xoxb-`) + 应用级别令牌 (`xapp-`) |
| **用户识别** | Slack 成员 ID (例如：`U01ABC2DEF3`) |

---

## 步骤 1：创建 Slack 应用

1. 访问 [https://api.slack.com/apps](https://api.slack.com/apps)
2. 点击 **创建新应用**
3. 选择 **从零开始**
4. 输入应用名称（例如：“Hermes Agent”）并选择您的工作区
5. 点击 **创建应用**

您将进入应用的 **基本信息** 页面。

---

## 步骤 2：配置机器人令牌权限范围 (Scopes)

在侧边栏中导航到 **功能 → OAuth 和权限 (Features → OAuth & Permissions)**。滚动到 **权限范围 (Scopes) → 机器人令牌权限范围 (Bot Token Scopes)** 并添加以下权限：

| 权限范围 | 用途 |
|-------|---------|
| `chat:write` | 作为机器人发送消息 |
| `app_mentions:read` | 检测在频道中被 @提及的情况 |
| `channels:history` | 读取机器人所在的公共频道消息历史记录 |
| `channels:read` | 列出和获取公共频道信息 |
| `groups:history` | 读取机器人被邀请的私有频道消息历史记录 |
| `im:history` | 读取私信历史记录 |
| `im:read` | 查看基本的私信信息 |
| `im:write` | 打开和管理私信 |
| `users:read` | 查询用户信息 |
| `files:read` | 读取和下载附件文件，包括语音笔记/音频 |
| `files:write` | 上传文件（图像、音频、文档） |

:::caution 缺少权限范围 = 缺少功能
如果没有 `channels:history` 和 `groups:history`，机器人**将无法接收频道消息**——
它只能在私信中工作。这些是最常遗漏的权限范围。
:::

**可选权限范围：**

| 权限范围 | 用途 |
|-------|---------|
| `groups:read` | 列出和获取私有频道信息 |

---

## 步骤 3：启用 Socket Mode

Socket Mode 允许机器人通过 WebSocket 连接，而无需公共 URL。

1. 在侧边栏中，转到 **设置 → Socket Mode (Settings → Socket Mode)**
2. 将 **启用 Socket Mode (Enable Socket Mode)** 开关切换到 ON
3. 系统会提示您创建一个 **应用级别令牌 (App-Level Token)**：
   - 将其命名为类似 `hermes-socket`（名称不重要）
   - 添加 **`connections:write`** 权限范围
   - 点击 **生成 (Generate)**
4. **复制此令牌** — 它以 `xapp-` 开头。这就是您的 `SLACK_APP_TOKEN`

:::tip
您始终可以在 **设置 → 基本信息 → 应用级别令牌 (Settings → Basic Information → App-Level Tokens)** 下找到或重新生成应用级别令牌。
:::

---

## 步骤 4：订阅事件 (Events)

此步骤至关重要——它控制了机器人可以看到哪些消息。


1. 在侧边栏中，转到 **功能 → 事件订阅 (Features → Event Subscriptions)**
2. 将 **启用事件 (Enable Events)** 开关切换到 ON
3. 展开 **订阅机器人事件 (Subscribe to bot events)** 并添加：

| 事件 | 是否必需？ | 用途 |
|-------|-----------|---------|
| `message.im` | **是** | 机器人接收私信 |
| `message.channels` | **是** | 机器人接收其所在的**公共**频道消息 |
| `message.groups` | **推荐** | 机器人接收其被邀请的**私有**频道消息 |
| `app_mention` | **是** | 防止机器人被 @提及时出现 Bolt SDK 错误 |

4. 点击页面底部的 **保存更改 (Save Changes)**

:::danger 缺少事件订阅是 #1 设置问题
如果机器人可以在私信中工作，但在频道中**无法工作**，您几乎肯定忘记添加了
`message.channels`（用于公共频道）和/或 `message.groups`（用于私有频道）。
没有这些事件，Slack根本不会将频道消息发送给机器人。
:::


---

## 步骤 5：启用消息标签页 (Messages Tab)

此步骤为机器人启用私信功能。如果没有它，用户尝试私信机器人时会看到 **“已关闭向此应用发送消息”** 的提示。

1. 在侧边栏中，转到 **功能 → 应用主页 (Features → App Home)**
2. 滚动到 **显示标签页 (Show Tabs)**
3. 将 **消息标签页 (Messages Tab)** 开关切换到 ON
4. 勾选 **“允许用户从消息标签页发送斜杠命令和消息”**

:::danger 没有此步骤，私信将完全被阻止
即使拥有所有正确的权限范围和事件订阅，如果没有启用消息标签页，Slack也不会允许用户向机器人发送私信。这是 Slack 平台的要求，而不是 Hermes 的配置问题。
:::

---

## 步骤 6：将应用安装到工作区 (Workspace)

1. 在侧边栏中，转到 **设置 → 安装应用 (Settings → Install App)**
2. 点击 **安装到工作区 (Install to Workspace)**
3. 审核权限并点击 **允许 (Allow)**
4. 授权后，您将看到一个以 `xoxb-` 开头的 **机器人用户 OAuth 令牌 (Bot User OAuth Token)**
5. **复制此令牌** — 这是您的 `SLACK_BOT_TOKEN`

:::tip
如果您稍后更改了权限范围或事件订阅，**必须重新安装应用**才能使更改生效。安装应用页面将显示提示您执行此操作的横幅。
:::

---

## 步骤 7：查找允许列表的用户 ID

Hermes 使用 Slack **成员 ID**（而非用户名或显示名称）作为允许列表。

查找成员 ID 的方法：

1. 在 Slack 中，点击用户的名称或头像
2. 点击 **查看完整资料 (View full profile)**
3. 点击 **⋮**（更多）按钮
4. 选择 **复制成员 ID (Copy member ID)**

成员 ID 看起来像 `U01ABC2DEF3`。您至少需要自己的成员 ID。

---

## 步骤 8：配置 Hermes

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# 必需
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_APP_TOKEN=xapp-your-app-token-here
SLACK_ALLOWED_USERS=U01ABC2DEF3              # 以逗号分隔的成员 ID

# 可选
SLACK_HOME_CHANNEL=C01234567890              # cron/定时消息的默认频道
SLACK_HOME_CHANNEL_NAME=general              # 主题频道的易读名称（可选）
```

或者运行交互式设置：

```bash
hermes gateway setup    # 提示时选择 Slack
```

然后启动网关：

```bash
hermes gateway              # 前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅限 Linux：开机系统服务
```

---

## 步骤 9：将机器人邀请到频道

启动网关后，您需要将机器人**邀请**到任何您希望它响应的频道中：

```
/invite @Hermes Agent
```

机器人**不会**自动加入频道。您必须单独将其邀请到每个频道。

---

## 机器人如何响应

了解 Hermes 在不同上下文中的行为：

| 上下文 | 行为 |
|---------|----------|
| **私信 (DMs)** | 对每条消息都做出响应 — 无需 @提及 |
| **频道 (Channels)** | 机器人**仅在被 @提及时响应**（例如：`@Hermes Agent 现在几点了？`）。在频道中，Hermes 会在一个附加到该消息的线程中回复。 |
| **线程 (Threads)** | 如果您在现有线程中 @提及 Hermes，它会在该线程中回复。一旦机器人在一个线程中处于活动会话状态，**后续回复无需 @提及**——机器人会自然地跟进对话。 |

:::tip
在频道中，始终 @提及机器人以开始对话。一旦机器人在一个线程中处于活动状态，您可以在该线程中回复而无需提及它。在线程之外，未 @提及的消息会被忽略，以防止在繁忙的频道中产生噪音。
:::

---

## 配置选项

除了步骤 8 中必需的环境变量外，您还可以通过 `~/.hermes/config.yaml` 自定义 Slack 机器人的行为。

### 线程和回复行为

```yaml
platforms:
  slack:
    # 控制多部分回复如何进行线程化
    # "off"   — 永不将回复线程到原始消息
    # "first" — 第一个块将线程到用户的消息（默认）
    # "all"   — 所有块都将线程到用户的消息
    reply_to_mode: "first"

    extra:
      # 是否在线程中回复（默认：true）。
      # 当为 false 时，频道消息将获得直接频道回复，而不是线程。
      # 现有线程中的消息仍然在线程中回复。
      reply_in_thread: true

      # 是否也将线程回复发布到主频道
      # (Slack 的 "Also send to channel" 功能)。
      # 仅第一个回复的第一个块会被广播。
      reply_broadcast: false
```

| Key | 默认值 | 描述 |
|-----|---------|-------------|
| `platforms.slack.reply_to_mode` | `"first"` | 多部分消息的线程模式：`"off"`、`"first"` 或 `"all"` |
| `platforms.slack.extra.reply_in_thread` | `true` | 当为 `false` 时，频道消息将获得直接回复而不是线程。现有线程中的消息仍然在线程中回复。 |
| `platforms.slack.extra.reply_broadcast` | `false` | 当为 `true` 时，线程回复也会发布到主频道。仅广播第一个块。 |

### 会话隔离 (Session Isolation)

```yaml
# 全局设置 — 适用于 Slack 和所有其他平台
group_sessions_per_user: true
```

当为 `true`（默认值）时，共享频道中的每个用户都会获得自己独立的对话会话。在 `#general` 中与 Hermes 交谈的两个人将拥有独立的历史记录和上下文。

如果希望实现整个频道共享一个对话会话的协作模式，请将其设置为 `false`。请注意，这意味着用户共享上下文增长和令牌成本，并且一个用户的 `/reset` 会清除所有人的会话。

### 提及和触发行为

```yaml
slack:
  # 频道中是否需要 @提及（这是默认行为；
  # Slack 适配器无论如何都会在频道中强制执行 @提及 限制，
  # 但您可以为此设置明确的配置以保持与其他平台的同步）
  require_mention: true

  # 触发机器人的自定义提及模式
  # (除了默认的 @提及 检测外)
  mention_patterns:
    - "hey hermes"
    - "hermes,"

  # 附加到每条发送消息的前缀文本
  reply_prefix: ""
```

:::info
与 Discord 和 Telegram 不同，Slack 没有 `free_response_channels` 的等效功能。Slack 适配器要求在频道中必须使用 `@mention` 来开始对话。但是，一旦机器人在一个线程中处于活动会话状态，后续的线程回复就不需要提及了。在私信中，机器人总是无需提及即可响应。
:::

### 未授权用户处理

```yaml
slack:
  # 当未授权用户（不在 SLACK_ALLOWED_USERS 中）私信机器人时会发生什么
  # "pair"   — 提示他们配对代码（默认）
  # "ignore" — 静默丢弃消息
  unauthorized_dm_behavior: "pair"
```

您也可以将其设置为全局：

```yaml
unauthorized_dm_behavior: "pair"
```

`slack:` 下的平台特定设置具有优先权，高于全局设置。

### 语音转录 (Voice Transcription)

```yaml
# 全局设置 — 启用/禁用传入语音消息的自动转录
stt_enabled: true
```

当为 `true`（默认值）时，传入的音频消息会使用配置的 STT 提供商自动转录，然后再由代理处理。

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


## 主题频道 (Home Channel)

将 `SLACK_HOME_CHANNEL` 设置为频道 ID，Hermes 将向该频道发送定时消息、cron 任务结果和其他主动通知。查找频道 ID 的方法：

1. 在 Slack 中右键单击频道名称
2. 点击 **查看频道详情 (View channel details)**
3. 滚动到底部 — 频道 ID 会显示在那里

```bash
SLACK_HOME_CHANNEL=C01234567890
```

请确保机器人已**被邀请到该频道**（`/invite @Hermes Agent`）。

---

## 多工作区支持 (Multi-Workspace Support)

Hermes 可以使用单个网关实例同时连接到**多个 Slack 工作区**。每个工作区都独立地使用其自己的机器人用户 ID 进行认证。

### 配置

将多个机器人令牌作为**逗号分隔列表**提供给 `SLACK_BOT_TOKEN`：

```bash
# 多个机器人令牌 — 每个工作区一个
SLACK_BOT_TOKEN=xoxb-workspace1-token,xoxb-workspace2-token,xoxb-workspace3-token

# Socket Mode 仍然使用单个应用级别令牌
SLACK_APP_TOKEN=xapp-your-app-token
```

或者在 `~/.hermes/config.yaml` 中：

```yaml
platforms:
  slack:
    token: "xoxb-workspace1-token,xoxb-workspace2-token"
```

### OAuth 令牌文件

除了环境变量或配置中的令牌外，Hermes 还从以下位置加载**OAuth 令牌文件**：

```
~/.hermes/slack_tokens.json
```

该文件是一个 JSON 对象，将团队 ID 映射到令牌条目：

```json
{
  "T01ABC2DEF3": {
    "token": "xoxb-workspace-token-here",
    "team_name": "我的工作区"
  }
}
```

此文件中的令牌将与通过 `SLACK_BOT_TOKEN` 指定的任何令牌合并。重复的令牌会自动去重。

### 工作原理

- 列表中**第一个令牌**是主要令牌，用于 Socket Mode 连接（AsyncApp）。
- 每个令牌在启动时都会通过 `auth.test` 进行认证。网关将每个 `team_id` 映射到其自己的 `WebClient` 和 `bot_user_id`。
- 当收到消息时，Hermes 使用正确的特定工作区客户端进行响应。
- 主要的 `bot_user_id`（来自第一个令牌）用于向后兼容那些期望单一机器人身份的功能。

---

## 语音消息 (Voice Messages)

Hermes 支持 Slack 的语音功能：

- **传入：** 语音/音频消息使用配置的 STT 提供商自动转录：本地 `faster-whisper`、Groq Whisper (`GROQ_API_KEY`) 或 OpenAI Whisper (`VOICE_TOOLS_OPENAI_KEY`)
- **传出：** TTS 回复作为音频文件附件发送

---

## 频道级提示 (Per-Channel Prompts)

为特定的 Slack 频道分配临时的系统提示。该提示在运行时注入到每个回合——不会持久化到转录历史记录中——因此更改会立即生效。

```yaml
slack:
  channel_prompts:
    "C01RESEARCH": |
      你是一名研究助理。重点关注学术来源、
      引用和简洁的综合。
    "C02ENGINEERING": |
      代码审查模式。对边缘情况和
      性能影响要精确。
```

键是 Slack 频道 ID（通过频道详情 → "关于" → 滚动到底部查找）。匹配频道的每条消息都会被注入临时的系统指令提示。

## 故障排除 (Troubleshooting)

| 问题 | 解决方案 |
|---------|----------|
| 机器人不响应私信 | 验证 `message.im` 是否在您的事件订阅中，并且应用是否已重新安装 |
| 机器人私信正常但频道不正常 | **最常见问题。** 向事件订阅添加 `message.channels` 和 `message.groups`，重新安装应用，并通过 `/invite @Hermes Agent` 将机器人邀请到频道 |
| 机器人不响应频道 @提及 | 1) 检查是否订阅了 `message.channels` 事件。 2) 机器人必须被邀请到频道。 3) 确保添加了 `channels:history` 权限范围。 4) 在更改权限范围/事件后重新安装应用 |
| 机器人忽略私有频道消息 | 添加 `message.groups` 事件订阅和 `groups:history` 权限范围，然后重新安装应用并 `/invite` 机器人 |
| 私信中出现“已关闭向此应用发送消息” | 在应用主页设置中启用 **消息标签页** (参见步骤 5) |
| "not_authed" 或 "invalid_auth" 错误 | 重新生成您的机器人令牌和应用令牌，更新 `.env` |
| 机器人响应但无法在频道发布消息 | 使用 `/invite @Hermes Agent` 将机器人邀请到频道 |
| "missing_scope" 错误 | 在 OAuth & Permissions 中添加所需的权限范围，然后**重新安装**应用 |
| Socket 频繁断开连接 | 检查您的网络；Bolt 会自动重连，但连接不稳定会导致延迟 |
| 更改了权限范围/事件但无任何变化 | 您**必须**在更改任何权限范围或事件订阅后，将应用重新安装到您的工作区 |

### 快速检查清单

如果机器人无法在频道中工作，请验证以下**所有**项：

1. ✅ 订阅了 `message.channels` 事件（用于公共频道）
2. ✅ 订阅了 `message.groups` 事件（用于私有频道）
3. ✅ 订阅了 `app_mention` 事件
4. ✅ 添加了 `channels:history` 权限范围（用于公共频道）
5. ✅ 添加了 `groups:history` 权限范围（用于私有频道）
6. ✅ 在添加权限范围/事件后**重新安装**了应用
7. ✅ 机器人已通过 `/invite @Hermes Agent` **邀请**到频道
8. ✅ 您在消息中**@提及**了机器人

---

## 安全性 (Security)

:::warning
**始终设置 `SLACK_ALLOWED_USERS`**，使用授权用户的成员 ID。如果没有此设置，
网关将默认**拒绝所有消息**作为安全措施。切勿分享您的机器人令牌——
将其视为密码处理。
:::

- 令牌应存储在 `~/.hermes/.env` 中（文件权限 `600`）
- 定期通过 Slack 应用设置轮换令牌
- 审计谁可以访问您的 Hermes 配置目录
- Socket Mode 意味着没有暴露公共端点——攻击面减少了一个。