---
sidebar_position: 4
title: "Slack"
description: "通过Socket模式将Hermes智能体设置为Slack机器人"
---

# Slack 设置

通过Socket模式将Hermes智能体连接为Slack机器人。Socket模式使用WebSocket而非
公共HTTP端点，因此您的Hermes实例无需公开访问——它可以在防火墙后面、在您的笔记本电脑上或私有服务器上运行。

:::warning 经典Slack应用已弃用
经典Slack应用（使用RTM API）已于**2025年3月完全弃用**。Hermes使用现代的
Bolt SDK和Socket模式。如果您有旧的经典应用，必须按照以下步骤创建新应用。
:::

## 概述

| 组件 | 值 |
|-----------|-------|
| **库** | 用于Python的`slack-bolt` / `slack_sdk`（Socket模式） |
| **连接** | WebSocket — 无需公共URL |
| **所需认证令牌** | 机器人令牌 (`xoxb-`) + 应用级令牌 (`xapp-`) |
| **用户标识** | Slack成员ID（例如 `U01ABC2DEF3`）

---

## 步骤一：创建 Slack 应用

最快的方式是粘贴 Hermes 为你生成的配置清单。它一次性声明了所有内置的斜杠命令（`/btw`、`/stop`、`/model` 等）、所有必需的 OAuth 权限范围、所有事件订阅，并启用 Socket 模式。

### 方案 A：使用 Hermes 生成的配置清单（推荐）

1.  生成配置清单：
    ```bash
    hermes slack manifest --write
    ```
    此命令将生成 `~/.hermes/slack-manifest.json` 文件并打印粘贴说明。
2.  前往 [https://api.slack.com/apps](https://api.slack.com/apps) → **创建新应用** → **从应用配置清单创建**
3.  选择你的工作区，粘贴 JSON 内容，审阅后点击 **下一步** → **创建**
4.  直接跳转到 **步骤六：将应用安装到工作区**。配置清单已为你处理了权限范围、事件和斜杠命令。

### 方案 B：从头开始（手动）

1.  前往 [https://api.slack.com/apps](https://api.slack.com/apps)
2.  点击 **创建新应用**
3.  选择 **从头开始**
4.  输入应用名称（例如 "Hermes Agent"）并选择你的工作区
5.  点击 **创建应用**

你将进入应用的 **基本信息** 页面。请继续执行下面的步骤 2-6。

---

## 步骤二：配置机器人令牌权限范围

在侧边栏导航到 **功能 → OAuth 和权限**。滚动到 **权限范围 → 机器人令牌权限范围** 并添加以下内容：

| 权限范围 | 用途 |
|-------|---------|
| `chat:write` | 以机器人身份发送消息 |
| `app_mentions:read` | 检测在频道中被 @提及 |
| `channels:history` | 读取机器人所在公开频道的消息 |
| `channels:read` | 列出并获取公开频道信息 |
| `groups:history` | 读取机器人被邀请加入的私有频道的消息 |
| `im:history` | 读取私信历史记录 |
| `im:read` | 查看基本私信信息 |
| `im:write` | 打开和管理私信 |
| `users:read` | 查询用户信息 |
| `files:read` | 读取和下载附件，包括语音备忘录/音频 |
| `files:write` | 上传文件（图像、音频、文档） |

:::caution 权限范围缺失 = 功能缺失
如果没有 `channels:history` 和 `groups:history`，机器人 **将无法接收频道中的消息**——它只能在私信中工作。如果没有 `files:read`，Hermes 可以聊天但 **无法可靠地读取用户上传的附件**。这些是最常被遗漏的权限范围。
:::

**可选权限范围：**

| 权限范围 | 用途 |
|-------|---------|
| `groups:read` | 列出并获取私有频道信息 |

---

## 步骤三：启用 Socket 模式

Socket 模式允许机器人通过 WebSocket 连接，而无需公共 URL。

1.  在侧边栏，前往 **设置 → Socket 模式**
2.  将 **启用 Socket 模式** 切换为开启
3.  系统会提示你创建一个 **应用级别令牌**：
    -   将其命名为类似 `hermes-socket` 的名称（名称不重要）
    -   添加 **`connections:write`** 权限范围
    -   点击 **生成**
4.  **复制该令牌** —— 它以 `xapp-` 开头。这就是你的 `SLACK_APP_TOKEN`

:::tip
你随时可以在 **设置 → 基本信息 → 应用级别令牌** 下找到或重新生成应用级别令牌。
:::

---

## 步骤四：订阅事件

此步骤至关重要 —— 它控制机器人可以看到哪些消息。

1.  在侧边栏，前往 **功能 → 事件订阅**
2.  将 **启用事件** 切换为开启
3.  展开 **订阅机器人事件** 并添加：

| 事件 | 是否必需？ | 用途 |
|-------|-----------|---------|
| `message.im` | **是** | 机器人接收私信 |
| `message.channels` | **是** | 机器人接收已加入的 **公开** 频道中的消息 |
| `message.groups` | **推荐** | 机器人接收被邀请加入的 **私有** 频道中的消息 |
| `app_mention` | **是** | 防止机器人被 @提及时出现 Bolt SDK 错误 |

4.  点击页面底部的 **保存更改**

:::danger 未订阅事件是头号设置问题
如果机器人能在私信中工作但 **在频道中不行**，你几乎肯定是忘记了添加 `message.channels`（用于公开频道）和/或 `message.groups`（用于私有频道）。没有这些事件，Slack 根本不会将频道消息投递给机器人。
:::

---

## 步骤五：启用消息选项卡

此步骤允许向机器人发送私信。如果没有启用，用户尝试向机器人发送私信时会看到 **"已关闭向此应用发送消息的功能"**。

1.  在侧边栏，前往 **功能 → 应用主页**
2.  滚动到 **显示选项卡**
3.  将 **消息选项卡** 切换为开启
4.  勾选 **"允许用户从消息选项卡发送斜杠命令和消息"**

:::danger 未执行此步骤，私信将被完全阻止
即使拥有所有正确的权限范围和事件订阅，除非启用消息选项卡，否则 Slack 不允许用户向机器人发送私信。这是 Slack 平台的要求，而不是 Hermes 的配置问题。
:::

---

## 步骤六：将应用安装到工作区

1.  在侧边栏，前往 **设置 → 安装应用**
2.  点击 **安装到工作区**
3.  审阅权限并点击 **允许**
4.  授权后，你将看到一个以 `xoxb-` 开头的 **机器人用户 OAuth 令牌**
5.  **复制此令牌** —— 这就是你的 `SLACK_BOT_TOKEN`

:::tip
如果你稍后更改了权限范围或事件订阅，你 **必须重新安装应用** 才能使更改生效。安装应用页面会显示一个横幅提示你这样做。
:::

---

## 步骤七：为允许列表查找用户 ID

Hermes 使用 Slack **成员 ID**（而不是用户名或显示名称）作为允许列表。

要查找成员 ID：

1.  在 Slack 中，点击用户的姓名或头像
2.  点击 **查看完整个人资料**
3.  点击 **⋮**（更多）按钮
4.  选择 **复制成员 ID**

成员 ID 的格式类似于 `U01ABC2DEF3`。你至少需要自己的成员 ID。

---

## 步骤八：配置 Hermes

将以下内容添加到你的 `~/.hermes/.env` 文件：

```bash
# 必需
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_APP_TOKEN=xapp-your-app-token-here
SLACK_ALLOWED_USERS=U01ABC2DEF3              # 逗号分隔的成员 ID

# 可选
SLACK_HOME_CHANNEL=C01234567890              # 用于 cron/计划消息的默认频道
SLACK_HOME_CHANNEL_NAME=general              # 主频道的人类可读名称（可选）
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

## 步骤九：将机器人邀请到频道

启动网关后，你需要将机器人 **邀请** 到任何你希望它响应的频道：

```
/invite @Hermes Agent
```

机器人 **不会** 自动加入频道。你必须逐个邀请它加入每个频道。

---

## 斜杠命令

每个 Hermes 命令（`/btw`、`/stop`、`/new`、`/model`、`/help` 等）都是原生的 Slack 斜杠命令——其工作方式与 Telegram 和 Discord 上完全相同。在 Slack 中输入 `/`，自动完成选择器会列出每个 Hermes 命令及其描述。

底层原理：Hermes 附带一个生成的 Slack 应用配置清单（见步骤一，方案 A），它将 [`COMMAND_REGISTRY`](https://github.com/NousResearch/hermes-agent/blob/main/hermes_cli/commands.py) 中的每个命令声明为斜杠命令。在 Socket 模式下，无论配置清单的 `url` 字段如何，Slack 都会通过 WebSocket 路由命令事件。

### 更新后刷新斜杠命令

当 Hermes 添加新命令时（例如，在 `hermes update` 之后），重新生成配置清单并更新你的 Slack 应用：

```bash
hermes slack manifest --write
```

然后在 Slack 中：
1.  打开 [https://api.slack.com/apps](https://api.slack.com/apps) → 你的 Hermes 应用
2.  **功能 → 应用配置清单 → 编辑**
3.  粘贴 `~/.hermes/slack-manifest.json` 的新内容
4.  **保存**。如果权限范围或斜杠命令发生更改，Slack 会提示重新安装应用。

### 旧版 `/hermes <子命令>` 仍然有效

为了向后兼容旧的配置清单，你仍然可以输入 `/hermes btw run the tests` —— Hermes 将其路由到与 `/btw run the tests` 相同的位置。自由格式问题也有效：`/hermes what's the weather?` 会被视为常规消息。

### 在话题线程内使用命令（`!cmd` 前缀）

Slack 本身会阻止在话题回复中使用原生斜杠命令——尝试在话题中输入 `/queue`，Slack 会响应 *"/queue 在线程中不受支持。抱歉！"*。没有应用端设置可以重新启用它们；Slack 根本不会将它们传递给 Hermes。

作为变通方案，Hermes 将前导 `!` 识别为备用命令前缀，可在话题内（及任何其他地方）使用。将 `!queue`、`!stop`、`!model gpt-5.4` 等作为常规话题回复输入——Hermes 会将其视为与斜杠形式完全相同，并在同一话题中回复。

仅第一个词会与已知命令列表进行检查，因此像 `!nice work` 这样的随意消息会原样传递给智能体。

### 高级：仅输出斜杠命令数组

如果你手动维护 Slack 配置清单，且只需要斜杠命令列表：

```bash
hermes slack manifest --slashes-only > /tmp/slashes.json
```

将该数组粘贴到现有配置清单的 `features.slash_commands` 键中。

---

## 机器人如何回应

了解 Hermes 在不同场景下的行为：

| 场景 | 行为 |
|---------|----------|
| **私信** | 机器人会回复每条消息——无需 @提及 |
| **频道** | 机器人**仅在被 @提及时回应**（例如，`@Hermes Agent 现在几点了？`）。在频道中，Hermes 会以附加在该消息下的线程形式回复。 |
| **线程** | 如果你在现有线程内 @提及 Hermes，它会在同一个线程中回复。一旦机器人在线程中有了活动会话，**该线程中的后续回复无需 @提及**——机器人会自然地跟随对话。 |

:::tip
在频道中，请始终 @提及机器人以开始对话。一旦机器人在线程中活跃，你可以在该线程中回复而无需提及它。在线程之外，未 @提及的消息将被忽略，以避免在繁忙频道中产生干扰。
:::

---

## 配置选项

除了第 8 步所需的环境变量外，你可以通过 `~/.hermes/config.yaml` 自定义 Slack 机器人的行为。

### 线程与回复行为

```yaml
platforms:
  slack:
    # 控制多部分回复如何使用线程
    # "off"   — 从不将回复线程化到原始消息
    # "first" — 第一个回复块会线程化到用户消息（默认）
    # "all"   — 所有回复块都会线程化到用户消息
    reply_to_mode: "first"

    extra:
      # 是否在线程中回复（默认：true）。
      # 设为 false 时，频道消息会直接回复到频道，
      # 而不是线程。现有线程内的消息仍然在线程内回复。
      reply_in_thread: true

      # 同时将线程回复发布到主频道
      # （Slack 的“同时发送到频道”功能）。
      # 仅广播第一个回复的第一个块。
      reply_broadcast: false
```

| 键名 | 默认值 | 描述 |
|-----|---------|----------|
| `platforms.slack.reply_to_mode` | `"first"` | 多部分消息的线程模式：`"off"`、`"first"` 或 `"all"` |
| `platforms.slack.extra.reply_in_thread` | `true` | 设为 `false` 时，频道消息会获得直接回复而非线程。现有线程内的消息仍在线程内回复。 |
| `platforms.slack.extra.reply_broadcast` | `false` | 设为 `true` 时，线程回复也会发布到主频道。仅广播第一个块。 |

### 会话隔离

```yaml
# 全局设置——适用于 Slack 和所有其他平台
group_sessions_per_user: true
```

设为 `true`（默认）时，共享频道中的每个用户都会获得自己独立的对话会话。两个人在 `#general` 中与 Hermes 交流将拥有独立的历史和上下文。

如果你希望整个频道共享一个对话会话（协作模式），请设为 `false`。请注意，这意味着用户共享上下文增长和代币成本，并且一个用户的 `/reset` 会为所有人清除会话。

### 提及与触发行为

```yaml
slack:
  # 在频道中需要 @提及（这是默认行为；
  # Slack 适配器无论如何都会在频道中强制执行 @提及门控，
  # 但你可以显式设置此项以与其他平台保持一致）
  require_mention: true

  # 防止线程自动参与：只回复包含明确 @提及的频道消息。
  # 关闭此项（默认）时，Slack 可以“自动参与”——
  # 记住线程中的过往提及，并跟进机器人消息的回复，
  # 无需新的 @提及即可恢复活动会话。
  # 开启 strict_mention 后，每条新的频道消息都必须
  # @提及机器人才能让 Hermes 回应。
  strict_mention: false

  # 触发机器人的自定义提及模式
  # （除了默认的 @提及检测之外）
  mention_patterns:
    - "hey hermes"
    - "hermes,"

  # 添加到每条发出消息前的文本
  reply_prefix: ""
```

:::tip 何时使用 `strict_mention`
在繁忙的工作区中，将此项设为 `true`，当 Slack 默认的“机器人记住此线程”行为让用户感到意外时——例如，在一个长技术支持线程中，机器人在开始时提供了帮助，而你希望它在没有被明确再次提及前保持沉默。私信和活动的交互会话不受影响。
:::

:::info
Slack 支持两种模式：默认需要 `@提及` 来开始对话，但你可以通过 `SLACK_FREE_RESPONSE_CHANNELS`（逗号分隔的频道 ID）或 `config.yaml` 中的 `slack.free_response_channels` 为特定频道选择退出。一旦机器人在线程中有了活动会话，该线程中的后续回复不需要提及。在私信中，机器人始终回应，无需提及。
:::

### 频道允许列表 (`allowed_channels`)

将机器人限制在固定的 Slack 频道集合中——当机器人被邀请到多个频道但应仅在少数几个频道回应时很有用。设置后，来自**未在此列表中**的频道的消息将被**静默忽略**，即使机器人被 `@提及`。

**私信不受此过滤器限制**，因此授权用户始终可以通过私信联系到机器人。

```yaml
slack:
  allowed_channels:
    - "C0123456789"   # #ops
    - "C0987654321"   # #incident-response
```

或通过环境变量（逗号分隔）设置：

```bash
SLACK_ALLOWED_CHANNELS="C0123456789,C0987654321"
```

行为：

- 为空 / 未设置 → 无限制（完全向后兼容）。
- 非空 → 频道 ID 必须在此列表上，否则消息会在任何其他门控（提及要求、`free_response_channels` 等）运行之前被丢弃。
- Slack 频道 ID 以 `C`（公开）、`G`（私有）或 `D`（私信）开头。可以通过 Slack UI 的“打开频道详细信息”→“关于”面板，或通过 API 查找。

另请参阅：[管理员/用户斜杠命令划分](../../reference/slash-commands.md#permissions-and-adminuser-split)。

### 未授权用户处理

```yaml
slack:
  # 当未授权用户（不在 SLACK_ALLOWED_USERS 中）给机器人发私信时
  # "pair"   — 提示他们输入配对代码（默认）
  # "ignore" — 静默丢弃消息
  unauthorized_dm_behavior: "pair"
```

你也可以为所有平台全局设置此项：

```yaml
unauthorized_dm_behavior: "pair"
```

`slack:` 下的平台特定设置优先于全局设置。

### 语音转录

```yaml
# 全局设置——启用/禁用对传入语音消息的自动转录
stt_enabled: true
```

设为 `true`（默认）时，传入的音频消息会在由智能体处理之前，使用配置的 STT 提供程序自动转录。

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

将 `SLACK_HOME_CHANNEL` 设置为 Hermes 将投递定时消息、计划任务结果及其他主动通知的频道 ID。查找频道 ID 的方法：

1. 在 Slack 中右键点击频道名称
2. 点击 **查看频道详情**
3. 滚动至底部 — 频道 ID 就在那里显示

```bash
SLACK_HOME_CHANNEL=C01234567890
```

确保机器人已被**邀请至该频道**（`/invite @Hermes Agent`）。

---

## 多工作区支持

Hermes 可以使用单个网关实例**同时连接多个 Slack 工作区**。每个工作区都使用其自己的机器人用户 ID 进行独立身份验证。

### 配置

在 `SLACK_BOT_TOKEN` 中以**逗号分隔列表**的形式提供多个机器人令牌：

```bash
# 多个机器人令牌 — 每个工作区一个
SLACK_BOT_TOKEN=xoxb-workspace1-token,xoxb-workspace2-token,xoxb-workspace3-token

# 仍然使用单个应用级令牌用于 Socket Mode
SLACK_APP_TOKEN=xapp-your-app-token
```

或者在 `~/.hermes/config.yaml` 中：

```yaml
platforms:
  slack:
    token: "xoxb-workspace1-token,xoxb-workspace2-token"
```

### OAuth 令牌文件

除了环境变量或配置中的令牌外，Hermes 还会从位于以下路径的 **OAuth 令牌文件**加载令牌：

```
~/.hermes/slack_tokens.json
```

此文件是一个 JSON 对象，将团队 ID 映射到令牌条目：

```json
{
  "T01ABC2DEF3": {
    "token": "xoxb-workspace-token-here",
    "team_name": "我的工作区"
  }
}
```

此文件中的令牌会与通过 `SLACK_BOT_TOKEN` 指定的任何令牌合并。重复的令牌将自动去重。

### 工作原理

- 列表中的**第一个令牌**是主令牌，用于 Socket Mode 连接（AsyncApp）。
- 每个令牌在启动时通过 `auth.test` 进行身份验证。网关将每个 `team_id` 映射到其自己的 `WebClient` 和 `bot_user_id`。
- 当消息到达时，Hermes 使用正确的工作区专用客户端进行响应。
- 主 `bot_user_id`（来自第一个令牌）用于向后兼容那些期望单一机器人身份的功能。

---

## 语音消息

Hermes 支持 Slack 上的语音功能：

- **接收：** 语音/音频消息会使用配置的 STT 提供商自动转录：本地 `faster-whisper`、Groq Whisper（`GROQ_API_KEY`）或 OpenAI Whisper（`VOICE_TOOLS_OPENAI_KEY`）
- **发送：** TTS 响应作为音频文件附件发送

---

## 每频道提示词

为特定的 Slack 频道分配临时系统提示词。该提示词在运行时的每一轮对话中注入 — 永远不会持久化到转录历史中 — 因此更改会立即生效。

```yaml
slack:
  channel_prompts:
    "C01RESEARCH": |
      你是一位研究助手。专注于学术来源、引用和简洁的综合。
    "C02ENGINEERING": |
      代码审查模式。请精确处理边界情况和性能影响。
```

键是 Slack 频道 ID（通过频道详情 → “关于” → 滚动到底部查找）。匹配频道中的所有消息都会将提示词作为临时系统指令注入。

## 每频道技能绑定

在特定频道或私信中开始新会话时自动加载技能。与每频道提示词（在每一轮对话注入）不同，技能绑定在**会话开始时**将技能内容作为用户消息注入 — 它成为对话历史的一部分，无需在后续轮次重新加载。

这对于有特定用途的私信或频道（闪卡、领域特定问答机器人、支持分流频道等）非常理想，在这些地方您不希望模型自己的技能选择器在每次简短回复时都决定是否加载。

```yaml
slack:
  channel_skill_bindings:
    # 私信频道 — 始终以 "german-flashcards" 模式运行
    - id: "D0ATH9TQ0G6"
      skills:
        - german-flashcards
    # 研究频道 — 按顺序预加载多个技能
    - id: "C01RESEARCH"
      skills:
        - arxiv
        - writing-plans
    # 简写形式：单个技能作为字符串
    - id: "C02SUPPORT"
      skill: hubspot-on-demand
```

注意：
- 绑定按频道 ID 匹配。对于绑定频道中的线程消息，该线程继承父频道的绑定。
- 技能仅在会话开始时加载（新会话或自动重置后）。如果您更改了绑定，请运行 `/new` 或等待会话自动重置以使其生效。
- 结合 `channel_prompts` 使用，可在技能指令之上添加每频道的语气/约束。
## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| 机器人不响应私信 | 检查 `message.im` 是否在您的事件订阅中，并且应用已重新安装 |
| 机器人在私信中工作但频道中不行 | **最常见的问题。** 在事件订阅中添加 `message.channels` 和 `message.groups`，重新安装应用，并使用 `/invite @Hermes Agent` 邀请机器人进入频道 |
| 机器人在频道中不响应 @提及 | 1) 检查已订阅 `message.channels` 事件。2) 机器人必须被邀请至频道。3) 确保已添加 `channels:history` 范围。4) 在范围/事件更改后重新安装应用 |
| 机器人忽略私有频道中的消息 | 添加 `message.groups` 事件订阅和 `groups:history` 范围，然后重新安装应用并 `/invite` 机器人 |
| 私信中显示“已关闭向此应用发送消息” | 在应用首页设置中启用 **消息选项卡**（参见步骤 5） |
| "not_authed" 或 "invalid_auth" 错误 | 重新生成您的机器人令牌和应用令牌，更新 `.env` 文件 |
| 机器人可以响应但无法在频道发布消息 | 使用 `/invite @Hermes Agent` 邀请机器人进入频道 |
| 机器人可以聊天但无法读取上传的图片/文件 | 添加 `files:read`，然后**重新安装**应用。当 Slack 返回范围/身份验证/权限失败时，Hermes 现在会在聊天中显示附件访问诊断信息 |
| `missing_scope` 错误 | 在 OAuth 和权限中添加所需范围，然后**重新安装**应用 |
| Socket 频繁断开连接 | 检查您的网络；Bolt 会自动重连，但不稳定的连接会导致延迟 |
| 更改了范围/事件但没有任何变化 | 在任何范围或事件订阅更改后，您**必须**将应用重新安装到您的工作区 |

### 快速检查清单

如果机器人在频道中无法工作，请验证**所有**以下内容：

1. ✅ 已订阅 `message.channels` 事件（用于公共频道）
2. ✅ 已订阅 `message.groups` 事件（用于私有频道）
3. ✅ 已订阅 `app_mention` 事件
4. ✅ 已添加 `channels:history` 范围（用于公共频道）
5. ✅ 已添加 `groups:history` 范围（用于私有频道）
6. ✅ 添加范围/事件后应用已**重新安装**
7. ✅ 机器人已被**邀请**至频道（`/invite @Hermes Agent`）
8. ✅ 您正在消息中**@提及**机器人

---

## 安全

:::warning
**始终设置 `SLACK_ALLOWED_USERS`** 并填入授权用户的成员 ID。如果没有此设置，
网关将**拒绝所有消息**作为默认安全措施。切勿共享您的机器人令牌 —
像对待密码一样对待它们。
:::

- 令牌应存储在 `~/.hermes/.env` 中（文件权限 `600`）
- 定期通过 Slack 应用设置轮换令牌
- 审计谁有权访问您的 Hermes 配置目录
- Socket Mode 意味着不暴露公共端点 — 减少一个攻击面