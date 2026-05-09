---
sidebar_position: 4
title: "Slack"
description: "使用 Socket 模式将 Hermes 智能体设置为 Slack 机器人"
---

# Slack 设置

使用 Socket 模式将 Hermes 智能体连接到 Slack 作为机器人。Socket 模式使用 WebSocket 而不是公共 HTTP 端点，因此您的 Hermes 实例无需公开访问 — 它可以在防火墙后、您的笔记本电脑或私有服务器上运行。

:::warning 经典 Slack 应用已弃用
经典 Slack 应用（使用 RTM API）已于 **2025 年 3 月完全弃用**。Hermes 使用现代的 Bolt SDK 和 Socket 模式。如果您有旧的经典应用，则必须按照以下步骤创建一个新应用。
:::

## 概览

| 组件 | 值 |
|-----------|-------|
| **库** | Python 的 `slack-bolt` / `slack_sdk`（Socket 模式） |
| **连接** | WebSocket — 无需公共 URL |
| **所需认证令牌** | 机器人令牌 (`xoxb-`) + 应用级令牌 (`xapp-`) |
| **用户标识** | Slack 成员 ID（例如 `U01ABC2DEF3`） |

---

## 步骤 1：创建一个 Slack 应用

最快的方法是粘贴 Hermes 为你生成的清单（manifest）。该清单一次性声明了所有内置斜杠命令（`/btw`、`/stop`、`/model`……）、所有必需的 OAuth 权限范围、所有事件订阅，并启用了 Socket 模式。

### 选项 A：使用 Hermes 生成的清单（推荐）

1. 生成清单：
   ```bash
   hermes slack manifest --write
   ```
   这会将 `~/.hermes/slack-manifest.json` 写入磁盘，并打印出粘贴说明。
2. 访问 [https://api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From an app manifest**
3. 选择你的工作区，粘贴 JSON 内容，检查无误后点击 **Next** → **Create**
4. 跳至 **步骤 6：将应用安装到工作区**。清单已为你处理了权限范围、事件和斜杠命令。

### 选项 B：从头开始（手动）

1. 访问 [https://api.slack.com/apps](https://api.slack.com/apps)
2. 点击 **Create New App**
3. 选择 **From scratch**
4. 输入应用名称（例如“Hermes Agent”）并选择你的工作区
5. 点击 **Create App**

你将进入应用的 **Basic Information** 页面。继续执行下面的步骤 2–6。

---

## 步骤 2：配置 Bot Token 权限范围

在侧边栏中导航至 **Features → OAuth & Permissions**。滚动到 **Scopes → Bot Token Scopes** 并添加以下范围：

| 权限范围 | 用途 |
|---------|------|
| `chat:write` | 以机器人身份发送消息 |
| `app_mentions:read` | 检测在频道中被 @提及 的情况 |
| `channels:history` | 读取机器人所在公共频道中的消息 |
| `channels:read` | 列出并获取公共频道信息 |
| `groups:history` | 读取机器人被邀请加入的私有频道中的消息 |
| `im:history` | 读取私信历史记录 |
| `im:read` | 查看基本的私信信息 |
| `im:write` | 打开和管理私信 |
| `users:read` | 查询用户信息 |
| `files:read` | 读取和下载附件，包括语音笔记/音频 |
| `files:write` | 上传文件（图片、音频、文档） |

:::caution 缺少权限范围 = 功能缺失
如果没有 `channels:history` 和 `groups:history`，机器人**将无法接收频道中的消息**——它只能在私信中工作。如果没有 `files:read`，Hermes 可以聊天，但**无法可靠地读取用户上传的附件**。
这些是最常被遗漏的权限范围。
:::

**可选权限范围：**

| 权限范围 | 用途 |
|---------|------|
| `groups:read` | 列出并获取私有频道信息 |

---

## 步骤 3：启用 Socket 模式

Socket 模式允许机器人通过 WebSocket 连接，而无需提供公共 URL。

1. 在侧边栏中，进入 **Settings → Socket Mode**
2. 将 **Enable Socket Mode** 切换为 ON
3. 系统会提示你创建一个**应用级令牌**：
   - 将其命名为类似 `hermes-socket` 的名称（名称无关紧要）
   - 添加 **`connections:write`** 权限范围
   - 点击 **Generate**
4. **复制该令牌**——它以 `xapp-` 开头。这就是你的 `SLACK_APP_TOKEN`

:::tip
你随时可以在 **Settings → Basic Information → App-Level Tokens** 下找到或重新生成应用级令牌。
:::

---

## 步骤 4：订阅事件

此步骤至关重要——它控制机器人可以看到哪些消息。

1. 在侧边栏中，进入 **Features → Event Subscriptions**
2. 将 **Enable Events** 切换为 ON
3. 展开 **Subscribe to bot events** 并添加：

| 事件 | 是否必需 | 用途 |
|------|----------|------|
| `message.im` | **是** | 机器人接收私信 |
| `message.channels` | **是** | 机器人接收其被添加到的**公共**频道中的消息 |
| `message.groups` | **推荐** | 机器人接收其被邀请加入的**私有**频道中的消息 |
| `app_mention` | **是** | 防止当机器人被 @提及 时 Bolt SDK 报错 |

4. 点击页面底部的 **Save Changes**

:::danger 缺少事件订阅是排名第一的配置问题
如果机器人在私信中可以工作，但在**频道中不行**，那么你几乎肯定忘记添加 `message.channels`（用于公共频道）和/或 `message.groups`（用于私有频道）。
如果没有这些事件，Slack 根本不会向机器人传递频道消息。
:::

---

## 步骤 5：启用“消息”标签页

此步骤启用对机器人的私信。如果没有此步骤，用户在尝试向机器人发送私信时会看到**“向此应用发送消息的功能已被关闭”**。

1. 在侧边栏中，进入 **Features → App Home**
2. 滚动到 **Show Tabs**
3. 将 **Messages Tab** 切换为 ON
4. 勾选**“允许用户从消息标签页发送斜杠命令和消息”**

:::danger 如果没有此步骤，私信将被完全阻止
即使拥有所有正确的权限范围和事件订阅，除非启用了“消息”标签页，否则 Slack 不允许用户向机器人发送私信。这是 Slack 平台的要求，而不是 Hermes 的配置问题。
:::

---

## 步骤 6：将应用安装到工作区

1. 在侧边栏中，进入 **Settings → Install App**
2. 点击 **Install to Workspace**
3. 检查权限并点击 **Allow**
4. 授权后，你将看到一个以 `xoxb-` 开头的 **Bot User OAuth Token**
5. **复制此令牌**——这就是你的 `SLACK_BOT_TOKEN`

:::tip
如果你稍后更改了权限范围或事件订阅，则**必须重新安装应用**才能使更改生效。安装应用页面会显示横幅提示你执行此操作。
:::

---

## 步骤 7：查找白名单用户的用户 ID

Hermes 使用 Slack 的**成员 ID**（而非用户名或显示名称）作为白名单。

要查找成员 ID：

1. 在 Slack 中，点击用户的姓名或头像
2. 点击 **View full profile**
3. 点击 **⋮**（更多）按钮
4. 选择 **Copy member ID**

成员 ID 的格式类似于 `U01ABC2DEF3`。你至少需要自己的成员 ID。

---

## 步骤 8：配置 Hermes

将以下内容添加到你的 `~/.hermes/.env` 文件中：

```bash
# 必需
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_APP_TOKEN=xapp-your-app-token-here
SLACK_ALLOWED_USERS=U01ABC2DEF3              # 以逗号分隔的成员 ID

# 可选
SLACK_HOME_CHANNEL=C01234567890              # cron/定时消息的默认频道
SLACK_HOME_CHANNEL_NAME=general              # 主频道的人类可读名称（可选）
```

或运行交互式设置：

```bash
hermes gateway setup    # 提示时选择 Slack
```

然后启动网关：

```bash
hermes gateway              # 前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅限 Linux：开机自启系统服务
```

---

## 步骤 9：邀请机器人加入频道

启动网关后，你需要**邀请机器人**加入任何希望它响应的频道：

```
/invite @Hermes Agent
```

机器人**不会**自动加入频道。你必须逐个邀请它加入每个频道。

---

## 斜杠命令

每个 Hermes 命令（`/btw`、`/stop`、`/new`、`/model`、`/help`……）都是一个原生的 Slack 斜杠命令——其工作方式与在 Telegram 和 Discord 上完全相同。在 Slack 中输入 `/`，自动完成选择器会列出每个 Hermes 命令及其描述。

底层原理：Hermes 附带一个生成的 Slack 应用清单（参见步骤 1，选项 A），该清单将 [`COMMAND_REGISTRY`](https://github.com/NousResearch/hermes-agent/blob/main/hermes_cli/commands.py) 中的每个命令都声明为斜杠命令。在 Socket 模式下，无论清单中的 `url` 字段如何，Slack 都会通过 WebSocket 路由命令事件。

### 更新后刷新斜杠命令

当 Hermes 添加新命令时（例如在 `hermes update` 之后），请重新生成清单并更新你的 Slack 应用：

```bash
hermes slack manifest --write
```

然后在 Slack 中：
1. 打开 [https://api.slack.com/apps](https://api.slack.com/apps) → 你的 Hermes 应用
2. **Features → App Manifest → Edit**
3. 粘贴 `~/.hermes/slack-manifest.json` 的新内容
4. **保存**。如果权限范围或斜杠命令发生更改，Slack 会提示你重新安装应用。

### 旧版 `/hermes <子命令>` 仍然有效

为了与旧版清单保持向后兼容性，你仍然可以输入 `/hermes btw run the tests`——Hermes 会将其路由为与 `/btw run the tests` 相同的方式。自由格式的问题也适用：`/hermes what's the weather?` 被视为普通消息。

### 高级：仅输出斜杠命令数组

如果你手动维护 Slack 清单，并且只需要斜杠命令列表：

```bash
hermes slack manifest --slashes-only > /tmp/slashes.json
```

将该数组粘贴到你现有清单的 `features.slash_commands` 键中。

---

## 机器人如何响应

了解 Hermes 在不同上下文中的行为：

| 上下文 | 行为 |
|--------|------|
| **私信** | 机器人响应每条消息——无需 @提及 |
| **频道** | 机器人**仅在 @提及 时响应**（例如 `@Hermes Agent what time is it?`）。在频道中，Hermes 会在附加到该消息的线程中回复。 |
| **线程** | 如果你在现有线程中 @提及 Hermes，它会在同一线程中回复。一旦机器人在线程中拥有活跃会话，**该线程中的后续回复就无需 @提及**——机器人会自然地跟进对话。 |

:::tip
在频道中，始终 @提及 机器人以开始对话。一旦机器人在线程中处于活跃状态，你就可以在该线程中回复而无需提及它。在线程之外，没有 @提及 的消息将被忽略，以防止在繁忙的频道中产生噪音。
:::

## 配置选项

除了第 8 步中必需的环境变量外，您还可以通过 `~/.hermes/config.yaml` 自定义 Slack 机器人的行为。

### 线程与回复行为

```yaml
platforms:
  slack:
    # 控制多部分回复的线程行为
    # "off"   — 从不将回复线程化到原始消息
    # "first" — 第一个片段线程化到用户的消息（默认）
    # "all"   — 所有片段线程化到用户的消息
    reply_to_mode: "first"

    extra:
      # 是否在某个线程中回复（默认：true）。
      # 当为 false 时，频道消息将直接回复到频道，而不是线程。
      # 已有线程内的消息仍将在该线程中回复。
      reply_in_thread: true

      # 同时将线程回复发布到主频道
      # （Slack 的“也发送到频道”功能）。
      # 仅广播第一个回复的第一个片段。
      reply_broadcast: false
```

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `platforms.slack.reply_to_mode` | `"first"` | 多部分消息的线程模式：`"off"`、`"first"` 或 `"all"` |
| `platforms.slack.extra.reply_in_thread` | `true` | 当为 `false` 时，频道消息将直接回复到频道，而不是线程。已有线程内的消息仍将在该线程中回复。 |
| `platforms.slack.extra.reply_broadcast` | `false` | 当为 `true` 时，线程回复也会发布到主频道。仅广播第一个片段。 |

### 会话隔离

```yaml
# 全局设置 — 适用于 Slack 和所有其他平台
group_sessions_per_user: true
```

当为 `true`（默认值）时，共享频道中的每个用户都会获得自己独立的对话会话。在 `#general` 中与 Hermes 交谈的两个人将拥有独立的历史记录和上下文。

如果您希望进入协作模式，即整个频道共享一个对话会话，请将其设置为 `false`。请注意，这意味着用户将共享上下文增长和 token 成本，并且一个用户的 `/reset` 会清除所有人的会话。

### 提及与触发行为

```yaml
slack:
  # 在频道中要求 @提及（这是默认行为；
  # Slack 适配器无论如何都会在频道中强制执行 @提及门控，
  # 但您可以显式设置此项以保持与其他平台的一致性）
  require_mention: true

  # 防止线程自动参与：仅回复包含显式 @提及的频道消息。
  # 当此项为 OFF（默认）时，Slack 可以“自动参与”——
  # 记住线程中的过往提及并跟进机器人消息的回复，
  # 以及在没有新提及的情况下恢复活跃会话。
  # 当 strict_mention 为 ON 时，每条新的频道消息
  # 都必须 @提及机器人才能让 Hermes 响应。
  strict_mention: false

  # 触发机器人的自定义提及模式
  # （除了默认的 @提及检测之外）
  mention_patterns:
    - "hey hermes"
    - "hermes,"

  # 附加到每条传出消息的文本前缀
  reply_prefix: ""
```

:::tip 何时使用 `strict_mention`
在繁忙的工作区中，当 Slack 默认的“机器人记住此线程”行为让用户感到意外时，请将其设置为 `true` —— 例如，在一个长期的技术支持线程中，机器人一开始提供了帮助，而您更希望它在没有再次被显式提及的情况下保持沉默。私信和活跃的交互会话不受影响。
:::

:::info
Slack 支持两种模式：默认情况下需要 `@提及` 才能开始对话，但您可以通过 `SLACK_FREE_RESPONSE_CHANNELS`（以逗号分隔的频道 ID）或 `config.yaml` 中的 `slack.free_response_channels` 选择退出特定频道。一旦机器人在某个线程中拥有活跃会话，后续的线程回复就不需要提及。在私信中，机器人始终会响应，无需提及。
:::

### 未授权用户处理

```yaml
slack:
  # 当未授权用户（不在 SLACK_ALLOWED_USERS 中）向机器人发送私信时会发生什么
  # "pair"   — 提示他们输入配对码（默认）
  # "ignore" — 静默丢弃消息
  unauthorized_dm_behavior: "pair"
```

您也可以为所有平台全局设置此项：

```yaml
unauthorized_dm_behavior: "pair"
```

`slack:` 下的平台特定设置优先于全局设置。

### 语音转录

```yaml
# 全局设置 — 启用/禁用对传入语音消息的自动转录
stt_enabled: true
```

当为 `true`（默认值）时，传入的音频消息会在被智能体处理之前，使用配置的 STT 提供程序自动进行转录。

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

## 首页频道

将 `SLACK_HOME_CHANNEL` 设置为一个频道 ID，Hermes 将在此频道中发送定时消息、定时任务结果和其他主动通知。查找频道 ID 的方法如下：

1. 在 Slack 中右键点击频道名称
2. 点击**查看频道详情**
3. 滚动到底部 — 频道 ID 会显示在那里

```bash
SLACK_HOME_CHANNEL=C01234567890
```

确保机器人已被**邀请到该频道**（`/invite @Hermes 智能体`）。

---

## 多工作区支持

Hermes 可以使用单个网关实例同时连接到**多个 Slack 工作区**。每个工作区都使用其自己的机器人用户 ID 独立进行身份验证。

### 配置

在 `SLACK_BOT_TOKEN` 中以**逗号分隔的列表**形式提供多个机器人令牌：

```bash
# 多个机器人令牌 — 每个工作区一个
SLACK_BOT_TOKEN=xoxb-workspace1-token,xoxb-workspace2-token,xoxb-workspace3-token

# 仍使用单个应用级令牌用于 Socket 模式
SLACK_APP_TOKEN=xapp-your-app-token
```

或者在 `~/.hermes/config.yaml` 中：

```yaml
platforms:
  slack:
    token: "xoxb-workspace1-token,xoxb-workspace2-token"
```

### OAuth 令牌文件

除了环境变量或配置中的令牌外，Hermes 还会从以下位置的 **OAuth 令牌文件**加载令牌：

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

- 列表中的**第一个令牌**是主令牌，用于 Socket 模式连接（AsyncApp）。
- 每个令牌在启动时都会通过 `auth.test` 进行身份验证。网关将每个 `team_id` 映射到其自己的 `WebClient` 和 `bot_user_id`。
- 当消息到达时，Hermes 使用正确的工作区特定客户端进行响应。
- 主 `bot_user_id`（来自第一个令牌）用于向后兼容那些期望单个机器人身份的功能。

---

## 语音消息

Hermes 支持 Slack 上的语音功能：

- **接收：** 语音/音频消息会自动使用配置的 STT 提供程序进行转录：本地 `faster-whisper`、Groq Whisper（`GROQ_API_KEY`）或 OpenAI Whisper（`VOICE_TOOLS_OPENAI_KEY`）
- **发送：** TTS 响应将作为音频文件附件发送

---

## 每频道提示

为特定 Slack 频道分配临时系统提示。提示在每次轮转时运行时注入 — 永远不会持久化到对话历史记录中 — 因此更改会立即生效。

```yaml
slack:
  channel_prompts:
    "C01RESEARCH": |
      你是一名研究助理。专注于学术来源、
      引用和简洁的综合。
    "C02ENGINEERING": |
      代码审查模式。对边缘情况和性能影响要精确。
```

键是 Slack 频道 ID（通过频道详情 → “关于” → 滚动到底部查找）。匹配频道中的所有消息都会将提示作为临时系统指令注入。

## 每频道技能绑定

每当在特定频道或私信中开始新会话时，自动加载技能。与每频道提示（每次轮转时注入）不同，技能绑定会在**会话开始时**将技能内容作为用户消息注入 — 它成为对话历史记录的一部分，无需在后续轮转中重新加载。

这对于私信或具有专门用途的频道（如闪卡、特定领域的问答机器人、支持分类频道等）非常理想，在这些情况下，你不想让模型自己的技能选择器决定是否在每次简短回复时加载技能。

```yaml
slack:
  channel_skill_bindings:
    # 私信频道 — 始终以“german-flashcards”模式运行
    - id: "D0ATH9TQ0G6"
      skills:
        - german-flashcards
    # 研究频道 — 按顺序预加载多个技能
    - id: "C01RESEARCH"
      skills:
        - arxiv
        - writing-plans
    # 简短形式：单个技能作为字符串
    - id: "C02SUPPORT"
      skill: hubspot-on-demand
```

注意：
- 绑定通过频道 ID 匹配。在绑定频道中的线程消息，该线程会继承父频道的绑定。
- 技能仅在会话开始时加载（新会话或自动重置后）。如果更改了绑定，请运行 `/new` 或等待会话自动重置以使其生效。
- 可与 `channel_prompts` 结合使用，在技能指令之上添加每频道的语气/约束。

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| 机器人不响应私信 | 验证 `message.im` 是否在你的事件订阅中，并重新安装应用 |
| 机器人在私信中工作，但在频道中不工作 | **最常见的问题。** 将 `message.channels` 和 `message.groups` 添加到事件订阅，重新安装应用，并使用 `/invite @Hermes 智能体` 邀请机器人到频道 |
| 机器人在频道中不响应 @提及 | 1) 检查是否订阅了 `message.channels` 事件。2) 机器人必须被邀请到频道。3) 确保添加了 `channels:history` 范围。4) 在范围/事件更改后重新安装应用 |
| 机器人忽略私有频道中的消息 | 添加 `message.groups` 事件订阅和 `groups:history` 范围，然后重新安装应用并使用 `/invite` 邀请机器人 |
| 私信中显示“向此应用发送消息已关闭” | 在应用主页设置中启用**消息标签**（参见步骤 5） |
| “not_authed”或“invalid_auth”错误 | 重新生成你的机器人令牌和应用令牌，更新 `.env` |
| 机器人响应但无法在频道中发布 | 使用 `/invite @Hermes 智能体` 邀请机器人到频道 |
| 机器人可以聊天但无法读取上传的图像/文件 | 添加 `files:read`，然后**重新安装**应用。当 Slack 返回范围/身份验证/权限失败时，Hermes 现在会在聊天中显示附件访问诊断信息。 |
| `missing_scope` 错误 | 在 OAuth 和权限中添加所需范围，然后**重新安装**应用 |
| Socket 频繁断开连接 | 检查你的网络；Bolt 会自动重新连接，但不稳定的连接会导致延迟 |
| 更改了范围/事件但没有任何变化 | 在更改任何范围或事件订阅后，你**必须重新安装**应用到你的工作区 |

### 快速检查清单

如果机器人在频道中不工作，请验证**所有**以下内容：

1. ✅ 已订阅 `message.channels` 事件（用于公共频道）
2. ✅ 已订阅 `message.groups` 事件（用于私有频道）
3. ✅ 已订阅 `app_mention` 事件
4. ✅ 已添加 `channels:history` 范围（用于公共频道）
5. ✅ 已添加 `groups:history` 范围（用于私有频道）
6. ✅ 添加范围/事件后已**重新安装**应用
7. ✅ 机器人已被**邀请**到频道（`/invite @Hermes 智能体`）
8. ✅ 你在消息中**@提及**了机器人

---
## 安全

:::warning
**始终设置 `SLACK_ALLOWED_USERS`**，包含授权用户的成员 ID。如果没有此设置，
网关将默认**拒绝所有消息**作为安全措施。切勿分享你的机器人令牌 —
请将它们视为密码。
:::

- 令牌应存储在 `~/.hermes/.env` 中（文件权限 `600`）
- 定期通过 Slack 应用设置轮换令牌
- 审计谁有权访问你的 Hermes 配置目录
- Socket 模式意味着不会暴露公共端点 — 减少一个攻击面