---
sidebar_position: 4
title: "Slack"
description: "使用 Socket Mode 将 Hermes 智能体设置为 Slack Bot"
---

# Slack 设置

将 Hermes 智能体连接到 Slack，使用 Socket Mode 作为机器人。Socket Mode 使用 WebSockets 而不是公共 HTTP 端点，因此您的 Hermes 实例不需要公开可访问——它可以在防火墙后、在笔记本电脑上或在私有服务器上运行。

:::warning 经典 Slack 应用已弃用
经典的 Slack 应用（使用 RTM API）已于 **2025 年 3 月完全弃用**。Hermes 使用带有 Socket Mode 的现代 Bolt SDK。如果您有旧的经典应用，您必须按照以下步骤创建一个新的应用。
:::

## 概览

| Component | Value |
|-----------|-------|
| **Library** | `slack-bolt` / `slack_sdk` for Python (Socket Mode) |
| **Connection** | WebSocket — 无需公共 URL |
| **Auth tokens needed** | Bot Token (`xoxb-`) + App-Level Token (`xapp-`) |
| **User identification** | Slack Member IDs (例如 `U01ABC2DEF3`) |

## 第 1 步：创建 Slack 应用

最快的方法是粘贴 Hermes 为您生成的清单（manifest）。它一次性声明了所有内置的斜杠命令（`/btw`、`/stop`、`/model` 等）、所有必需的 OAuth 范围、所有事件订阅，并启用了 Socket Mode。

### 选项 A：来自 Hermes 生成的清单（推荐）

1.  生成清单：
    ```bash
hermes slack manifest --write
    ```
    这会写入 `~/.hermes/slack-manifest.json` 并打印粘贴说明。
2.  转到 [https://api.slack.com/apps](https://api.slack.com/apps) →
    **创建新应用 (Create New App)** → **从应用清单创建 (From an app manifest)**
3.  选择您的工作区，粘贴 JSON 内容，进行审核，点击 **下一步 (Next)** → **创建 (Create)**
4.  跳到 **第 6 步：将应用安装到工作区**。清单已经为您处理了范围、事件和斜杠命令。

### 选项 B：从零开始（手动）

1.  转到 [https://api.slack.com/apps](https://api.slack.com/apps)
2.  点击 **创建新应用 (Create New App)**
3.  选择 **从零开始 (From scratch)**
4.  输入一个应用名称（例如：“Hermes 智能体”）并选择您的工作区
5.  点击 **创建应用 (Create App)**

您将进入该应用的**基本信息 (Basic Information)** 页面。请继续完成下面的第 2-6 步。

---

## 第 2 步：配置 Bot Token 范围

导航到侧边栏的 **功能 (Features) → OAuth 和权限 (OAuth & Permissions)**。滚动到 **范围 (Scopes) → Bot Token 范围 (Bot Token Scopes)** 并添加以下内容：

| Scope | 用途 |
|-------|---------|
| `chat:write` | 作为机器人发送消息 |
| `app_mentions:read` | 检测在频道中被 @提及的情况 |
| `channels:history` | 读取机器人所在的公共频道中的消息 |
| `channels:read` | 列出和获取关于公共频道的信息 |
| `groups:history` | 读取机器人被邀请到的私有频道中的消息 |
| `im:history` | 读取直接消息历史记录 |
| `im:read` | 查看基本的 DM 信息 |
| `im:write` | 打开和管理 DM |
| `users:read` | 查找用户信息 |
| `files:read` | 读取和下载附件文件，包括语音备忘录/音频 |
| `files:write` | 上传文件（图像、音频、文档） |

:::caution 缺少范围 = 功能缺失
如果没有 `channels:history` 和 `groups:history`，机器人**将不会接收频道中的消息**——它只能在 DM 中工作。如果没有 `files:read`，Hermes 可以聊天，但**无法可靠地读取用户上传的附件**。这些是最常被遗漏的范围。
:::

**可选范围：**

| Scope | 用途 |
|-------|---------|
| `groups:read` | 列出和获取私有频道的信息 |

---

## 第 3 步：启用 Socket Mode

Socket Mode 允许机器人通过 WebSocket 连接，而不是要求一个公共 URL。

1.  在侧边栏中，转到 **设置 (Settings) → Socket Mode**
2.  将 **启用 Socket Mode (Enable Socket Mode)** 开关切换为 ON
3.  系统会提示您创建一个**应用级令牌 (App-Level Token)**：
    -   将其命名为类似 `hermes-socket`（名称不重要）
    -   添加 **`connections:write`** 范围
    -   点击 **生成 (Generate)**
4.  **复制该令牌**——它以 `xapp-` 开头。这就是您的 `SLACK_APP_TOKEN`

:::tip
您始终可以在 **设置 (Settings) → 基本信息 (Basic Information) → 应用级令牌 (App-Level Tokens)** 下找到或重新生成应用级令牌。
:::

---

## 第 4 步：订阅事件

这一步至关重要——它决定了机器人可以看到哪些消息。


1.  在侧边栏中，转到 **功能 (Features) → 事件订阅 (Event Subscriptions)**
2.  将 **启用事件 (Enable Events)** 开关切换为 ON
3.  展开 **订阅机器人事件 (Subscribe to bot events)** 并添加：

| Event | Required? | 用途 |
|-------|-----------|---------|
| `message.im` | **是** | 机器人接收直接消息 |
| `message.channels` | **是** | 机器人接收其加入的**公共**频道中的消息 |
| `message.groups` | **推荐** | 机器人接收其被邀请到的**私有**频道中的消息 |
| `app_mention` | **是** | 防止机器人被 @提及时的 Bolt SDK 错误 |

4.  点击页面底部的 **保存更改 (Save Changes)**

:::danger 缺少事件订阅是 #1 设置问题
如果机器人可以在 DM 中工作但**不能在频道中工作**，那么您几乎肯定忘记添加 `message.channels`（用于公共频道）和/或 `message.groups`（用于私有频道）。如果没有这些事件，Slack 根本不会向机器人交付频道消息。
:::


---

## 第 5 步：启用消息标签页

此步骤启用了直接消息功能。否则，用户尝试 DM 机器人时会看到 **“已关闭向此应用发送消息”** 的提示。

1.  在侧边栏中，转到 **功能 (Features) → 应用主页 (App Home)**
2.  滚动到 **显示标签页 (Show Tabs)**
3.  将 **消息标签页 (Messages Tab)** 开关切换为 ON
4.  勾选 **“允许用户从消息标签页发送斜杠命令和消息”**

:::danger 缺少此步骤，DM 将被完全阻止
即使拥有所有正确的范围和事件订阅，如果没有启用消息标签页，Slack 也不会允许用户向机器人发送直接消息。这是一个 Slack 平台要求，而不是 Hermes 的配置问题。
:::

---

## 第 6 步：将应用安装到工作区

1.  在侧边栏中，转到 **设置 (Settings) → 安装应用 (Install App)**
2.  点击 **安装到工作区 (Install to Workspace)**
3.  审核权限并点击 **允许 (Allow)**
4.  授权后，您将看到一个以 `xoxb-` 开头的**机器人用户 OAuth 令牌 (Bot User OAuth Token)**
5.  **复制此令牌**——这就是您的 `SLACK_BOT_TOKEN`

:::tip
如果您稍后更改了范围或事件订阅，**必须重新安装应用**才能使更改生效。安装应用页面会显示一个提示您进行操作的横幅信息。
:::

---

## 第 7 步：查找允许列表的用户 ID

Hermes 使用 Slack **成员 ID (Member IDs)**（而不是用户名或显示名称）来创建允许列表。

要查找成员 ID：

1.  在 Slack 中，点击该用户的姓名或头像
2.  点击 **查看完整资料 (View full profile)**
3.  点击 **⋮**（更多）按钮
4.  选择 **复制成员 ID (Copy member ID)**

成员 ID 看起来像 `U01ABC2DEF3`。您至少需要自己的成员 ID。

---

## 第 8 步：配置 Hermes

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# Required
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_APP_TOKEN=xapp-your-app-token-here
SLACK_ALLOWED_USERS=U01ABC2DEF3              # 用逗号分隔的成员 ID

# Optional
SLACK_HOME_CHANNEL=C01234567890              # 用于 cron/定时消息的默认频道
SLACK_HOME_CHANNEL_NAME=general              # 首页频道的易读名称（可选）
```

或者运行交互式设置：

```bash
hermes gateway setup    # 提示时选择 Slack
```

然后启动网关：

```bash
hermes gateway              # 前台模式
hermes gateway install      # 作为用户服务安装
sudo hermes gateway install --system   # 仅限 Linux：系统启动服务
```

---

## 第 9 步：将机器人邀请到频道

启动网关后，您需要**邀请机器人**到所有希望它响应的频道中：

```
/invite @Hermes Agent
```

机器人**不会**自动加入频道。您必须逐个地将其邀请到每个频道中。

---

## 斜杠命令 (Slash Commands)

每一个 Hermes 命令（`/btw`、`/stop`、`/new`、`/model`、`/help` 等）都是一个原生的 Slack 斜杠命令——这与它们在 Telegram 和 Discord 中的工作方式完全一样。在 Slack 中输入 `/`，自动完成选择器就会列出所有带有描述的 Hermes 命令。

底层原理：Hermes 附带有一个生成的 Slack 应用清单（参见第 1 步，选项 A），它将每个命令声明为斜杠命令。在 Socket Mode 中，Slack 会通过 WebSocket 将命令事件路由过去，而与清单中的 `url` 字段无关。

### 更新后的斜杠命令刷新

当 Hermes 添加新命令（例如，运行 `hermes update` 后）时，请重新生成清单并更新您的 Slack 应用：

```bash
hermes slack manifest --write
```

然后在 Slack 中：
1.  打开 [https://api.slack.com/apps](https://api.slack.com/apps) →
    您的 Hermes 应用
2.  **功能 (Features) → 应用清单 (App Manifest) → 编辑 (Edit)**
3.  粘贴 `~/.hermes/slack-manifest.json` 的新内容
4.  **保存 (Save)**。如果范围或斜杠命令发生变化，Slack 将提示重新安装应用。

### 遗留的 `/hermes <子命令>` 仍然有效

为了与旧清单保持向后兼容性，您仍然可以输入 `/hermes btw run the tests`——Hermes 会以与 `/btw run the tests` 相同的方式路由它。自由形式的问题也有效：`/hermes what's the weather?` 会被视为一条常规消息。

### 在线程中使用的命令（`!cmd` 前缀）

Slack 本身会阻止在线程回复中使用原生的斜杠命令——尝试在一个线程中输入 `/queue`，Slack 就会回复 *“/queue 不支持在线程中使用。抱歉！”* 没有应用端的设置可以重新启用它们；Slack 从未将它们交付给 Hermes。

作为一种变通方法，Hermes 识别开头的 `!` 为一个可替代的命令前缀，它可以在线程中（以及其他任何地方）使用。输入 `!queue`、`!stop`、`!model gpt-5.4` 等，作为常规的线程回复——Hermes 会将其视为与斜杠形式完全相同地处理并回复在同一个线程中。

只有第一个令牌会与已知命令列表进行比对，因此像 `!nice work` 这样的随意消息会原封不动地传递给智能体。

审批提示（危险命令 `/execute_code` 的批准）通常显示为交互式按钮。当按钮无法交付而 Hermes 回退到文本提示时，该提示会指示您回复 `!approve` / `!deny`——这是在线程中可用的形式。

### 高级：仅发出斜杠命令数组

如果您手动维护 Slack 清单并只想获取斜杠命令列表：

```bash
hermes slack manifest --slashes-only > /tmp/slashes.json
```

将该数组粘贴到现有清单的 `features.slash_commands` 键中。

---

## 机器人如何响应 (How the Bot Responds)

了解 Hermes 在不同上下文中的行为：

| Context | Behavior |
|---------|----------|
| **DM** | 对每条消息都做出回应——无需 @提及 |
| **Channels** | 机器人**仅在被 @提及时才响应**（例如，`@Hermes Agent what time is it?`）。在频道中，Hermes 会在一个附加到该消息的线程中回复。 |
| **Threads** | 如果您在现有线程中 @提及 Hermes，它就会在该同一线程中回复。一旦机器人在一个线程中拥有活动会话，**后续在该线程中的回复就不需要 @提及**——机器人会自然地跟进对话。 |

:::tip
在频道中，始终@提及机器人以开始对话。一旦机器人在一个线程中处于活动状态，您就可以在不提及它的情况下回复该线程。在非线程环境中，未被 @提及的消息将被忽略，以防止繁忙的频道产生噪音。
:::

---

## 配置选项 (Configuration Options)

除了第 8 步所需的环境变量之外，您还可以通过 `~/.hermes/config.yaml` 自定义 Slack 机器人的行为。

### 线程和回复行为

```yaml
platforms:
  slack:
    # 控制多部分回复如何进行线程化
    # "off"   — 从不将回复与原始消息进行线程化
    # "first" — 第一个块（chunk）会与用户的消息进行线程化（默认）
    # "all"   — 所有块都将与用户的消息进行线程化
    reply_to_mode: "first"

    extra:
      # 是否在线程中回复（默认：true）。
      # 如果为 false，则频道消息会直接获得频道回复，而不是线程。
      # 现有线程中的消息仍然会在线程中回复。
      reply_in_thread: true

      # 是否也向主频道发布线程回复
      # (Slack 的“Also send to channel”功能)。
      # 只有第一个块（chunk）会被广播。
      reply_broadcast: false
```

| Key | Default | Description |
|-----|---------|-------------|
| `platforms.slack.reply_to_mode` | `"first"` | 多部分消息的线程模式：“"off"”、“"first"”或“"all"” |
| `platforms.slack.extra.reply_in_thread` | `true` | 如果为 `false`，则频道消息会获得直接回复而不是线程。现有线程中的消息仍然会在线程中回复。 |
| `platforms.slack.extra.reply_broadcast` | `false` | 如果为 `true`，则线程回复也会发布到主频道。只有第一个块会被广播。 |

### 会话隔离 (Session Isolation)

```yaml
# 全局设置 — 适用于 Slack 和所有其他平台
group_sessions_per_user: true
```

当设置为 `true`（默认值）时，共享频道中的每个用户都会获得自己独立的对话会话。在 `#general` 中与 Hermes 对话的两个人将拥有不同的历史记录和上下文。

如果希望实现整个频道共享一个对话会话的协作模式，则将其设置为 `false`。请注意，这意味着用户共享上下文增长和令牌成本，并且一个用户的 `/reset` 就可以清除所有人的会话。

### 提及和触发行为 (Mention & Trigger Behavior)

```yaml
slack:
  # 要求在频道中 @提及（这是默认行为；
  # Slack 适配器无论如何都会强制执行频道中的 @mention 限制，
  # 但您可以显式地将其设置为其他平台的一致性设置）
  require_mention: true

  # 防止线程自动参与：只回复包含明确 @mention 的频道消息。
  # 如果此项关闭（默认），Slack 可以“自动参与”——记住线程中的过去提及并跟进机器人消息的回复，并在没有新的提及的情况下恢复活动会话。
  # 如果 strict_mention 开启，则每条新的频道消息都必须@提及机器人，Hermes 才会响应。
  strict_mention: false

  # 触发机器人的自定义提及模式
  # (除了默认的 @mention 检测)
  mention_patterns:
    - "hey hermes"
    - "hermes,"

  # 添加到每条发送消息前的文本
  reply_prefix: ""
```

:::tip 何时使用 `strict_mention`
在繁忙的工作区中，请将其设置为 `true`。因为 Slack 的默认“机器人记得这个线程”行为可能会让用户感到意外——例如，一个长期的技术支持线程，机器人一开始提供了帮助，而您希望它保持沉默，除非再次被明确提醒。DM 和活动的交互式会话不受影响。
:::

:::info
Slack 支持这两种模式：默认情况下需要 `@mention` 来开始对话，但您可以通过 `SLACK_FREE_RESPONSE_CHANNELS`（逗号分隔的频道 ID）或 `config.yaml` 中的 `slack.free_response_channels` 从特定频道中排除此限制。一旦机器人在一个线程中拥有活动会话，后续的线程回复就不需要提及。在 DM 中，机器人总是可以响应而无需提及。
:::

### 频道允许列表（`allowed_channels`）

将机器人限制在固定的一组 Slack 频道中——当机器人被邀请到许多频道但只需要在一个少数几个频道中响应时，这非常有用。一旦设置，来自不在此列表中的频道的消息将被**静默忽略**，即使机器人被 `@mention` 了。

**DM 是豁免该过滤的**，因此授权用户总是可以通过直接消息联系到机器人。

```yaml
slack:
  allowed_channels:
    - "C0123456789"   # #ops
    - "C0987654321"   # #incident-response
```

或者通过环境变量（逗号分隔）：

```bash
SLACK_ALLOWED_CHANNELS="C0123456789,C0987654321"
```

行为：

- 空 / 未设置 → 无限制（完全向后兼容）。
- 非空 → 频道 ID 必须在列表中，否则消息会在任何其他门控（提及要求、`free_response_channels` 等）运行之前被丢弃。
- Slack 频道 ID 以 `C`（公共）、`G`（私有）或 `D`（DM）开头。您可以通过 Slack UI 的“打开频道详情”→“关于”面板，或通过 API 查找它们。

另请参阅：[admin/user slash command split](../../reference/slash-commands.md#permissions-and-adminuser-split)。

### 未授权用户处理 (Unauthorized User Handling)

```yaml
slack:
  # 当一个未授权的用户（不在 SLACK_ALLOWED_USERS 中）DM 机器人时会发生什么
  # "pair"   — 要求他们提供配对代码（默认）
  # "ignore" — 静默丢弃消息
  unauthorized_dm_behavior: "pair"
```

您也可以为所有平台全局设置此项：

```yaml
unauthorized_dm_behavior: "pair"
```

`slack:` 下的特定于平台的设置优先于全局设置。

### 语音转录 (Voice Transcription)

```yaml
# 全局设置 — 启用/禁用传入语音消息的自动转录
stt_enabled: true
```

当设置为 `true`（默认值）时，传入的音频消息会在被智能体处理之前，自动使用配置的 STT 提供商进行转录。

### 完整示例 (Full Example)

```yaml
# 网关全局设置
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

## Home Channel

将 `SLACK_HOME_CHANNEL` 设置为一个通道 ID，Hermes 将在此通道中交付排定的消息、cron 作业结果和其他主动通知。要查找通道 ID：

1. 在 Slack 中右键单击通道名称
2. 点击 **查看通道详情**
3. 向下滚动 — 即可看到通道 ID

```bash
SLACK_HOME_CHANNEL=C01234567890
```

请确保机器人已**被邀请到该通道**（`/invite @Hermes Agent`）。

---

## Multi-Workspace Support

Hermes 可以使用单个网关实例同时连接到**多个 Slack 工作区**。每个工作区都独立地通过自己的机器人用户 ID 进行身份验证。

### Configuration (配置)

将多个机器人令牌作为 `SLACK_BOT_TOKEN` 中的**逗号分隔列表**提供：

```bash
# 多个机器人令牌 — 每个工作区一个
SLACK_BOT_TOKEN=xoxb-workspace1-token,xoxb-workspace2-token,xoxb-workspace3-token

# 单个应用级别的令牌仍用于 Socket Mode
SLACK_APP_TOKEN=xapp-your-app-token
```

或者在 `~/.hermes/config.yaml` 中：

```yaml
platforms:
  slack:
    token: "xoxb-workspace1-token,xoxb-workspace2-token"
```

### OAuth Token File (OAuth 令牌文件)

除了环境变量或配置中的令牌外，Hermes 还从以下位置加载**OAuth 令牌文件**中的令牌：

```
~/.hermes/slack_tokens.json
```

该文件是一个将团队 ID 映射到令牌条目的 JSON 对象：

```json
{
  "T01ABC2DEF3": {
    "token": "xoxb-workspace-token-here",
    "team_name": "My Workspace"
  }
}
```

来自此文件的令牌会与通过 `SLACK_BOT_TOKEN` 指定的任何令牌合并。重复的令牌都会自动去重。

### How it works (工作原理)

- 列表中**第一个令牌**是主令牌，用于 Socket Mode 连接（AsyncApp）。
- 每个令牌在启动时都通过 `auth.test` 进行身份验证。网关将每个 `team_id` 映射到其自己的 `WebClient` 和 `bot_user_id`。
- 当消息到达时，Hermes 使用正确的、特定于工作区的客户端进行回复。
- 主 `bot_user_id`（来自第一个令牌）用于与期望单个机器人身份的特性保持向后兼容性。

---

## Voice Messages (语音消息)

Hermes 支持 Slack 的语音功能：

- **Incoming (接收)：** 语音/音频消息会使用配置的 STT 提供商自动转录：本地 `faster-whisper`、Groq Whisper (`GROQ_API_KEY`) 或 OpenAI Whisper (`VOICE_TOOLS_OPENAI_KEY`)
- **Outgoing (发送)：** TTS 回复函件作为音频文件附件发送

---

## Per-Channel Prompts (按通道提示)

为特定的 Slack 通道分配临时的系统提示。该提示在每次交互运行时注入——不会保存在转录历史记录中——因此更改会立即生效。

```yaml
slack:
  channel_prompts:
    "C01RESEARCH": |
      你是一名研究助理。重点关注学术资料、引用和简洁的综合分析。
    "C02ENGINEERING": |
      代码审查模式。精确地说明边缘情况和性能影响。
```

键是 Slack 通道 ID（通过通道详情 → “关于” → 向下滚动查找）。匹配通道中的所有消息都会被注入为临时的系统指令。

## Per-Channel Skill Bindings (按通道技能绑定)

每当特定通道或私聊开始新会话时，自动加载一个技能。与按通道提示（在每次交互中注入）不同，技能绑定会在**会话开始时**将技能内容作为用户消息注入——它成为对话历史的一部分，无需在后续的交互中重新加载。

这对于具有特定目的的私聊或通道（例如：闪卡、某个领域的问答机器人、支持分流通道等）是理想的，因为您不希望模型自身的技能选择器决定是否在每次简短回复时都进行加载。

```yaml
slack:
  channel_skill_bindings:
    # 私聊通道 — 始终以 "german-flashcards" 模式运行
    - id: "D0ATH9TQ0G6"
      skills:
        - german-flashcards
    # 研究通道 — 按顺序预加载多个技能
    - id: "C01RESEARCH"
      skills:
        - arxiv
        - writing-plans
    # 简写形式：单个字符串技能
    - id: "C02SUPPORT"
      skill: hubspot-on-demand
```

注意事项：
- 绑定是根据通道 ID 进行匹配的。对于已绑定的通道中的线程消息，该线程会继承父通道的绑定。
- 技能仅在会话开始时加载（新会话或在自动重置后）。如果您更改了绑定，请运行 `/new` 或等待会话自动重置以使其生效。
- 可与 `channel_prompts` 结合使用，为技能指令之上增加按通道的语气/约束。

## Troubleshooting (故障排除)

| Problem (问题) | Solution (解决方案) |
|---------|----------|
| Bot doesn't respond to DMs (机器人不回复私聊) | 验证您的事件订阅中包含 `message.im`，并重新安装应用 |
| Bot works in DMs but not in channels (机器人可以在私聊中工作但在公共通道中不行) | **最常见的问题。** 向事件订阅添加 `message.channels` 和 `message.groups`，重新安装应用，并通过 `/invite @Hermes Agent` 将机器人邀请到该通道 |
| Bot doesn't respond to @mentions in channels (机器人不回复通道中的@提及) | 1) 检查是否订阅了 `message.channels` 事件。2) 机器人必须被邀请到该通道。3) 确保添加了 `channels:history` 范围。4) 在更改范围/事件后重新安装应用 |
| Bot ignores messages in private channels (机器人忽略私有通道中的消息) | 添加 `message.groups` 事件订阅和 `groups:history` 范围，然后重新安装应用并 `/invite` 机器人 |
| "Sending messages to this app has been turned off" in DMs (私聊中出现“已关闭向此应用发送消息”) | 在应用主页面的**消息选项卡**中启用（参见第 5 步） |
| "not_authed" 或 "invalid_auth" errors ("not_authed" 或 "invalid_auth" 错误) | 重新生成您的机器人令牌和应用令牌，更新 `.env` 文件 |
| Bot responds but can't post in a channel (机器人回复了但无法在通道中发布) | 使用 `/invite @Hermes Agent` 将机器人邀请到该通道 |
| Bot can chat but can't read uploaded images/files (机器人可以聊天但无法读取上传的图片/文件) | 添加 `files:read`，然后**重新安装**应用。当 Slack 返回范围/身份验证/权限故障时，Hermes 会在聊天中显示附件访问诊断信息。 |
| `missing_scope` error (`missing_scope` 错误) | 在 OAuth & Permissions 中添加所需的范围，然后**重新安装**应用 |
| Socket disconnects frequently (Socket 频繁断开连接) | 检查您的网络；Bolt 会自动重连，但不稳定的连接会导致延迟 |
| Changed scopes/events but nothing changed (更改了范围/事件但没有任何变化) | 您**必须**在任何更改范围或事件订阅后重新安装应用到您的工作区 |

### Quick Checklist (快速核对清单)

如果机器人无法在通道中正常工作，请验证以下**所有**项目：

1. ✅ 订阅了 `message.channels` 事件（针对公共通道）
2. ✅ 订阅了 `message.groups` 事件（针对私有通道）
3. ✅ 订阅了 `app_mention` 事件
4. ✅ 添加了 `channels:history` 范围（针对公共通道）
5. ✅ 添加了 `groups:history` 范围（针对私有通道）
6. ✅ 在添加范围/事件后**重新安装**了应用
7. ✅ **邀请**了机器人到该通道（`/invite @Hermes Agent`）
8. ✅ 您正在消息中**@提及**机器人

---

## Security (安全)

:::warning
**始终设置 `SLACK_ALLOWED_USERS`**，包含授权用户的成员 ID。如果没有此设置，网关将默认**拒绝所有消息**作为一项安全措施。切勿分享您的机器人令牌——请像对待密码一样对待它们。
:::

- 令牌应存储在 `~/.hermes/.env` 中（文件权限 `600`）
- 定期通过 Slack 应用设置轮换令牌
- 审计谁有权访问您的 Hermes 配置目录
- Socket Mode 意味着没有公共端点暴露——攻击面减少了一个。