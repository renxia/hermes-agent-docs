---
sidebar_position: 3
title: "Discord"
description: "将 Hermes 智能体设置为 Discord 机器人"
---

# Discord 设置

Hermes 智能体与 Discord 集成，充当一个机器人（bot），允许您通过私聊或服务器频道与您的 AI 助手聊天。该机器人会接收您的消息，通过 Hermes 智能体管道进行处理（包括工具使用、记忆和推理），并实时响应。它支持文本、语音消息、文件附件和斜杠命令。

在设置之前，这是大多数人想知道的部分：一旦 Hermes 进入您的服务器，它的行为是怎样的。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| **私聊 (DMs)** | Hermes 会回复每一条消息。无需 @提及。每个私聊都有自己独立的会话。 |
| **服务器频道** | 默认情况下，只有当您 @提及它时，Hermes 才会响应。如果您在未提及它的频道中发帖，Hermes 将忽略该消息。 |
| **自由回复频道** | 您可以使用 `DISCORD_FREE_RESPONSE_CHANNELS` 来创建特定的免@提及频道，或者使用 `DISCORD_REQUIRE_MENTION=false` 全局禁用 @提及。这些频道中的消息会内联回答——跳过自动串流，以保持频道轻量级的聊天状态。 |
| **话题 (Threads)** | Hermes 会在同一话题中回复。除非该话题或其父频道被配置为自由回复，否则 @提及规则仍然适用。为了会话历史记录，话题与父频道是隔离的。 |
| **包含多个用户的共享频道** | 默认情况下，Hermes 会在每个用户内部隔离会话历史记录，以确保安全和清晰度。如果两个人在一个频道中聊天，除非您明确禁用，否则他们不会共享同一份转录记录。 |
| **提及其他用户的消息** | 当 `DISCORD_IGNORE_NO_MENTION` 为 `true`（默认设置）时，如果一条消息 @提及了其他用户但没有 @提及机器人本身，Hermes 将保持沉默。这可以防止机器人跳入针对其他人的对话中。如果您希望机器人响应所有消息，而不管谁被提及，请将其设置为 `false`。这仅适用于服务器频道，不适用于私聊。 |

:::tip
如果您想要一个正常的“机器人帮助”频道，让人们可以在不每次都标记它的情况下与 Hermes 对话，请将该频道添加到 `DISCORD_FREE_RESPONSE_CHANNELS` 中。
:::

### Discord 网关模型 (Gateway Model)

Hermes 在 Discord 上不是一个进行无状态回复的 Webhook。它会通过完整的消息网关运行，这意味着每条传入的消息都会经过：

1.  授权 (`DISCORD_ALLOWED_USERS`)
2.  @提及/自由回复检查
3.  会话查找
4.  会话转录加载
5.  正常的 Hermes 智能体执行，包括工具、记忆和斜杠命令
6.  响应交付回 Discord

这很重要，因为在一个繁忙的服务器中的行为取决于 Discord 的路由和 Hermes 的会话策略。

### Discord 中的会话模型 (Session Model)

默认情况下：

*   每个私聊都有自己的会话
*   每个服务器话题都有自己独立的会话命名空间
*   共享频道中的每个用户都有该频道内的独立会话

因此，如果 Alice 和 Bob 都与 Hermes 在 `#research` 中交流，Hermes 默认会将它们视为单独的对话，即使他们使用的是同一个可见 Discord 频道。

这由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您明确希望整个房间有一个共享对话时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话对于协作型房间可能很有用，但这同时也意味着：

*   用户们共享上下文增长和代币成本
*   一个人的长时间、重度使用工具的任务可能会使其他所有人的上下文膨胀
*   一个人正在进行中的任务可能会打断同一房间内另一个人后续的对话

### 中断与并发 (Interrupts and Concurrency)

Hermes 通过会话密钥来跟踪正在运行的智能体。

在使用默认设置 `group_sessions_per_user: true` 时：

*   Alice 打断自己的正在进行中的请求，只会影响 Alice 在该频道中的会话
*   Bob 可以在同一频道中继续聊天，而不会继承 Alice 的历史记录或打断 Alice 的运行

使用 `group_sessions_per_user: false` 时：

*   整个房间共享一个针对该频道/话题的运行智能体槽位
*   来自不同人士的后续消息可能会相互中断或排队等待

本指南将带您完成完整的设置流程——从在 Discord 开发者门户创建您的机器人，到发送您的第一条消息。

## 步骤 1: 创建 Discord 应用

1.  前往 [Discord Developer Portal](https://discord.com/developers/applications) 并使用您的 Discord 帐户登录。
2.  点击右上角的 **New Application**（新建应用）。
3.  为您的应用输入一个名称（例如：“Hermes Agent”）并接受开发者服务条款。
4.  点击 **Create**（创建）。

您将被导向到 **General Information**（通用信息）页面。请记下 **Application ID**（应用 ID）——稍后您需要它来构建邀请 URL。

## 步骤 2: 创建机器人 (Bot)

1.  在左侧边栏中，点击 **Bot**（机器人）。
2.  Discord 会自动为您的应用创建一个机器人用户。您会看到机器人的用户名，您可以对其进行自定义。
3.  在 **Authorization Flow**（授权流程）下：
    *   将 **Public Bot**（公共机器人）设置为 **ON**（开启）——这是使用 Discord 提供的邀请链接所必需的（推荐）。这允许安装（Installation）标签页生成默认的授权 URL。
    *   保持 **Require OAuth2 Code Grant**（需要 OAuth2 代码授权）设置为 **OFF**（关闭）。

:::tip
您可以在此页面为您的机器人设置自定义头像和横幅。这是用户在 Discord 中将看到的。
:::

:::info[私有机器人替代方案]
如果您希望保持机器人私有（Public Bot = OFF），则**必须**在步骤 5 中使用 **Manual URL**（手动 URL）方法，而不是使用安装标签页。Discord 提供的链接要求启用公共机器人。
:::

## 步骤 3: 启用特权网关意图 (Privileged Gateway Intents)

这是整个设置中最关键的一步。如果没有正确启用的意图（Intents），您的机器人将连接到 Discord，但**将无法读取消息内容**。

在 **Bot**（机器人）页面上，向下滚动至 **Privileged Gateway Intents**（特权网关意图）。您会看到三个开关：

| Intent (意图) | Purpose (用途) | Required? (是否必需?) |
|--------|---------|-----------| 
| **Presence Intent** (存在意图) | 查看用户在线/离线状态 | 可选 |
| **Server Members Intent** (服务器成员意图) | 访问成员列表，解析用户名 | **必需** |
| **Message Content Intent** (消息内容意图) | 读取消息的文本内容 | **必需** |

通过将它们切换到 **ON**（开启），启用 **Server Members Intent** 和 **Message Content Intent**。

-   如果没有 **Message Content Intent**，您的机器人会接收到消息事件，但消息文本是空的——它根本看不到您输入了什么。
-   如果没有 **Server Members Intent**，机器人无法解析允许用户列表的用户名，并且可能无法识别谁在给它发送消息。

:::warning[这是 Discord 机器人不工作的第 1 大原因]
如果您的机器人处于在线状态但从不回复消息，那么 **Message Content Intent** 几乎肯定是未启用的。请返回 [Developer Portal](https://discord.com/developers/applications)，选择您的应用 → Bot → Privileged Gateway Intents，并确保 **Message Content Intent** 已切换到 ON。点击 **Save Changes**（保存更改）。
:::

**关于服务器数量：**
-   如果您的机器人位于**少于 100 个服务器**中，您可以随意开启和关闭意图。
-   如果您的机器人位于**100 个或更多服务器**中，Discord 要求您提交一个验证申请才能使用特权意图。对于个人使用来说，这不是一个问题。

点击页面底部的 **Save Changes**（保存更改）。

## 步骤 4: 获取机器人令牌 (Bot Token)

机器人令牌是 Hermes Agent 用来以您的机器人身份登录的凭证。仍停留在 **Bot**（机器人）页面：

1.  在 **Token**（令牌）部分下，点击 **Reset Token**（重置令牌）。
2.  如果您已在 Discord 帐户上启用两步验证 (2FA)，请输入您的 2FA 代码。
3.  Discord 将显示您的新令牌。**立即复制它。**

:::warning[令牌仅显示一次]
令牌只显示一次。如果丢失，您将需要重置并生成一个新的。切勿公开分享您的令牌或将其提交到 Git——拥有此令牌的任何人都可以完全控制您的机器人。
:::

将令牌保存在安全的地方（例如密码管理器）。您将在步骤 8 中需要它。

## 步骤 5: 生成邀请 URL

您需要一个 OAuth2 URL 来邀请机器人加入您的服务器。有两种方法可以做到这一点：

### 选项 A: 使用安装标签页（推荐）

:::note[需要公共机器人]
此方法要求在步骤 2 中将 **Public Bot** 设置为 **ON**（开启）。如果您将其设置为 OFF，请使用下面的手动 URL 方法。
:::

1.  在左侧边栏中，点击 **Installation**（安装）。
2.  在 **Installation Contexts**（安装上下文）下，启用 **Guild Install**（公会安装）。
3.  对于 **Install Link**（安装链接），选择 **Discord Provided Link**（Discord 提供的链接）。
4.  在 Guild Install 的 **Default Install Settings**（默认安装设置）下：
    *   **Scopes**（作用域）：选择 `bot` 和 `applications.commands`
    *   **Permissions**（权限）：选择下面的权限。

### 选项 B: 手动 URL

您可以使用以下格式直接构建邀请 URL：

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=274878286912
```

将 `YOUR_APP_ID` 替换为步骤 1 中的应用 ID。

### 所需权限 (Required Permissions)

这些是您的机器人所需的最低权限：

-   **View Channels**（查看频道）— 查看它有权限访问的频道
-   **Send Messages**（发送消息）— 回复您的消息
-   **Embed Links**（嵌入链接）— 格式化富媒体回复
-   **Attach Files**（附加文件）— 发送图片、音频和文件输出
-   **Read Message History**（读取消息历史记录）— 维护对话上下文

### 推荐的额外权限 (Recommended Additional Permissions)

-   **Send Messages in Threads**（在线程中发送消息）— 在线程对话中回复
-   **Add Reactions**（添加反应）— 对消息进行反应以示确认

### 权限整数 (Permission Integers)

| Level (级别) | Permissions Integer (权限整数) | What's Included (包含内容) |
|-------|-------------------|-----------------|
| Minimal (最低) | `117760` | View Channels, Send Messages, Read Message History, Attach Files |
| Recommended (推荐) | `274878286912` | All of the above plus Embed Links, Send Messages in Threads, Add Reactions |

## 步骤 6: 邀请到您的服务器

1.  在浏览器中打开邀请 URL（来自安装标签页或您构建的手动 URL）。
2.  在 **Add to Server**（添加到服务器）下拉菜单中，选择您的服务器。
3.  点击 **Continue**（继续），然后点击 **Authorize**（授权）。
4.  如果提示，请完成 CAPTCHA 验证。

:::info
您需要在 Discord 服务器上拥有 **Manage Server**（管理服务器）权限才能邀请机器人。如果您在下拉菜单中看不到您的服务器，请要求一个服务器管理员使用邀请链接。
:::

授权后，该机器人将出现在您的服务器成员列表中（直到您启动 Hermes gateway 为止，它会显示为离线状态）。

## 步骤 7: 查找您的 Discord 用户 ID

Hermes Agent 使用您的 Discord User ID 来控制谁可以与机器人互动。要找到它：

1.  打开 Discord（桌面版或网页应用）。
2.  前往 **Settings**（设置）→ **Advanced**（高级）→ 将 **Developer Mode**（开发者模式）切换到 **ON**（开启）。
3.  关闭设置。
4.  右键单击您自己的用户名（在消息、成员列表或个人资料中）→ **Copy User ID**（复制用户 ID）。

您的用户 ID 是一个长数字，例如 `284102345871466496`。

:::tip
开发者模式还允许您以同样的方式复制 **Channel IDs**（频道 ID）和 **Server IDs**（服务器 ID）——右键单击频道或服务器名称并选择 Copy ID。如果您想手动设置一个主频道，则需要频道 ID。
:::

## 步骤 8: 配置 Hermes Agent

### 选项 A: 交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

当提示时，选择 **Discord**，然后根据提示粘贴您的机器人令牌和用户 ID。

### 选项 B: 手动配置

将以下内容添加到 `~/.hermes/.env` 文件中：

```bash
# Required (必需)
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_ALLOWED_USERS=284102345871466496

# Multiple allowed users (comma-separated) (多个允许用户，逗号分隔)
# DISCORD_ALLOWED_USERS=284102345871466496,198765432109876543
```

然后启动网关：

```bash
hermes gateway
```

机器人应该在几秒内在线。给它发送一条消息——无论是私信还是在它可以看到的频道中发送——进行测试。

:::tip
您可以将 `hermes gateway` 作为后台进程或 systemd 服务运行以实现持久化操作。请参阅部署文档以获取详细信息。
:::

## 配置参考 (Configuration Reference)

Discord 的行为由两个文件控制：**`~/.hermes/.env`** 用于凭证和环境级别的开关，以及 **`~/.hermes/config.yaml`** 用于结构化设置。当两者都设置时，环境变量始终优先于 config.yaml 中的值。

### 环境变量（.env）

| Variable (变量) | Required (必需?) | Default (默认值) | Description (描述) |
|----------|----------|---------|-------------|
| `DISCORD_BOT_TOKEN` | **Yes** | — | 来自 [Discord Developer Portal](https://discord.com/developers/applications) 的机器人令牌。 |
| `DISCORD_ALLOWED_USERS` | **Yes** | — | 允许与机器人互动的逗号分隔的 Discord 用户 ID。如果没有此项或 `DISCORD_ALLOWED_ROLES`，网关将拒绝所有用户。 |
| `DISCORD_ALLOWED_ROLES` | No | — | 逗号分隔的 Discord 角色 ID。拥有这些角色的任何成员都将被授权——与 `DISCORD_ALLOWED_USERS` 具有 OR 语义。在连接时自动启用 **Server Members Intent**（服务器成员意图）。当审核团队人员流动性大时特别有用：新版主导员一旦获得该角色，即可立即获得访问权限，无需配置推送。 |
| `DISCORD_HOME_CHANNEL` | No | — | 机器人发送主动消息（cron 输出、提醒、通知）的频道 ID。 |
| `DISCORD_HOME_CHANNEL_NAME` | No | `"Home"` | 日志和状态输出中主频道的显示名称。 |
| `DISCORD_COMMAND_SYNC_POLICY` | No | `"safe"` | 控制原生斜杠命令（slash-command）启动同步。`"safe"` 会差异化现有全局命令，并且仅更新已更改的内容，当 Discord 元数据变化无法通过补丁应用时会重新创建命令。`"bulk"` 保留旧的 `tree.sync()` 行为。`"off"` 完全跳过启动同步。 |
| `DISCORD_REQUIRE_MENTION` | No | `true` | 当为 `true` 时，机器人仅在服务器频道中响应 `@mentioned`（@提及）时才响应。设置为 `false` 可使其对每个频道中的所有消息进行回复。 |
| `DISCORD_THREAD_REQUIRE_MENTION` | No | `false` | 当为 `true` 时，禁用线程内的提及快捷方式——线程的限制与频道相同，即使机器人已经参与，也需要 `@mention`。 |
| `DISCORD_FREE_RESPONSE_CHANNELS` | No | — | 机器人无需 `@mention` 即可回复消息的逗号分隔频道 ID。 |
| `DISCORD_IGNORE_NO_MENTION` | No | `true` | 当为 `true` 时，如果一条消息 `@mentions`（@提及）其他用户但**没有**提及机器人，则机器人保持沉默。这可以防止机器人跳入针对他人的对话中。仅适用于服务器频道，不适用于私信 (DM)。 |
| `DISCORD_AUTO_THREAD` | No | `true` | 当为 `true` 时，对于文本频道中的每个 `@mention` 都会自动创建一个新线程，从而使每次对话都保持独立（类似于 Slack 的行为）。已在线程中或私信中的消息不受影响。 |
| `DISCORD_ALLOW_BOTS` | No | `"none"` | 控制机器人如何处理来自其他 Discord 机器人的消息。`"none"` — 忽略所有其他机器人。`"mentions"` — 仅接受 `@mention` Hermes 的机器人消息。`"all"` — 接受所有机器人消息。 |
| `DISCORD_REACTIONS` | No | `true` | 当为 `true` 时，机器人会在处理过程中向消息添加表情符号反应（👀 表示开始，✅ 表示成功，❌ 表示错误）。设置为 `false` 可完全禁用反应。 |
| `DISCORD_IGNORED_CHANNELS` | No | — | 机器人**绝不**回复的逗号分隔频道 ID，即使被 `@mentioned`。它具有最高的优先级，凌驾于所有其他频道设置之上。 |
| `DISCORD_ALLOWED_CHANNELS` | No | — | 逗号分隔的频道 ID。设置为此项后，机器人**只**在这些频道中回复（如果允许则包括私信）。覆盖 `config.yaml` 中的 `discord.allowed_channels`。可与 `DISCORD_IGNORED_CHANNELS` 结合使用以表达允许/拒绝规则。 |
| `DISCORD_NO_THREAD_CHANNELS` | No | — | 机器人直接在频道中回复而不是创建线程的逗号分隔频道 ID。仅当 `DISCORD_AUTO_THREAD` 为 `true` 时才相关。 |
| `DISCORD_HISTORY_BACKFILL` | No | `true` | 当为 `true` 时，当机器人被提及时，会向用户消息前添加最近的频道回溯（scrollback）。这可以恢复机器人本应获得的上下文。在私信和自由回复频道中跳过。设置为 `false` 可禁用。 |
| `DISCORD_HISTORY_BACKFILL_LIMIT` | No | `50` | 汇集回填块时要扫描的最多消息数。实际上，扫描通常会更早停止——在机器人自己在该频道中的最后一条消息处。 |
| `DISCORD_REPLY_TO_MODE` | No | `"first"` | 控制回复引用行为：`"off"` — 从不回复原始消息，`"first"` — 仅对第一块消息进行回复引用（默认），`"all"` — 对每个块都进行回复引用。 |
| `DISCORD_ALLOW_MENTION_EVERYONE` | No | `false` | 当为 `false` (默认) 时，即使其响应包含这些令牌，机器人也不能 ping `@everyone` 或 `@here`。设置为 `true` 可选择重新启用。参见下文 [Mention Control](#mention-control)。 |
| `DISCORD_ALLOW_MENTION_ROLES` | No | `false` | 当为 `false` (默认) 时，机器人不能 ping `@role` 提及。设置为 `true` 可允许。 |
| `DISCORD_ALLOW_MENTION_USERS` | No | `true` | 当为 `true` (默认) 时，机器人可以按 ID ping 个别用户。 |
| `DISCORD_ALLOW_MENTION_REPLIED_USER` | No | `true` | 当为 `true` (默认) 时，回复一条消息会 ping 原始作者。 |
| `DISCORD_PROXY` | No | — | Discord 连接的代理 URL（HTTP、WebSocket、REST）。覆盖 `HTTPS_PROXY`/`ALL_PROXY`。支持 `http://`、`https://` 和 `socks5://` 方案。 |
| `DISCORD_ALLOW_ANY_ATTACHMENT` | No | `false` | 当为 `true` 时，机器人接受任何文件类型的附件（而不仅仅是内置的 PDF/文本/zip/office 白名单）。未知类型会被缓存到磁盘上，并以带有 `application/octet-stream` MIME 的本地路径呈现给智能体，以便它可以使用 `terminal` / `read_file` / `ffprobe` / 等进行检查。 |
| `DISCORD_MAX_ATTACHMENT_BYTES` | No | `33554432` | 网关将下载和缓存的每个附件的最大字节数。默认 32 MiB。设置为 `0` 表示没有上限（附件在写入过程中保存在内存中，因此无限容量会带来真实的内存成本）。 |
| `HERMES_DISCORD_TEXT_BATCH_DELAY_SECONDS` | No | `0.6` | 适配器在刷新排队的文本块之前等待的容忍窗口。有助于平滑流式输出。 |
| `HERMES_DISCORD_TEXT_BATCH_SPLIT_DELAY_SECONDS` | No | `2.0` | 单条消息超过 Discord 长度限制时的分割块之间延迟。 |

### 配置文件（config.yaml）

`~/.hermes/config.yaml` 中的 `discord` 部分反映了上述环境变量。Config.yaml 的设置作为默认值应用——如果已经设置了等效的环境变量，则以环境变量为准。

```yaml
# Discord-specific settings (Discord 特定设置)
discord:
  require_mention: true           # Require @mention in server channels (@提及要求在服务器频道中)
  thread_require_mention: false   # If true, require @mention in threads too (multi-bot threads) (如果为真，也需要在线程中@提及)
  free_response_channels: ""      # Comma-separated channel IDs (or YAML list) (逗号分隔的频道 ID 或 YAML 列表)
  auto_thread: true               # Auto-create threads on @mention (@提及自动创建线程)
  reactions: true                 # Add emoji reactions during processing (处理过程中添加表情符号反应)
  ignored_channels: []            # Channel IDs where bot never responds (机器人绝不回复的频道 ID)
  no_thread_channels: []          # Channel IDs where bot responds without threading (机器人无需创建线程即可回复的频道 ID)
  history_backfill: true          # Prepend recent channel scrollback on mention (default: true) (@提及时添加最近的频道回溯，默认值：true)
  history_backfill_limit: 50      # Max messages to scan backwards (default: 50) (要扫描的最大消息数，默认值：50)
  channel_prompts: {}             # Per-channel ephemeral system prompts (每个频道的临时系统提示)
  allow_mentions:                 # What the bot is allowed to ping (safe defaults) (机器人被允许 ping 的内容，安全默认设置)
    everyone: false               # @everyone / @here pings (default: false) (@everyone / @here 提及，默认值：false)
    roles: false                  # @role pings (default: false) (@role 提及，默认值：false)
    users: true                   # @user pings (default: true) (@user 提及，默认值：true)
    replied_user: true            # reply-reference pings the author (default: true) (回复引用会 ping 作者，默认值：true)

# Session isolation (applies to all gateway platforms, not just Discord) (会话隔离，适用于所有网关平台，而不仅仅是 Discord)
group_sessions_per_user: true     # Isolate sessions per user in shared channels (在共享频道中按用户隔离会话)
```

#### `discord.require_mention`

**Type:** boolean — **Default:** `true`

启用后，机器人仅在被直接 `@mentioned` 的服务器频道中响应。私信 (DM) 总是会得到回复，无论此设置如何。

#### `discord.thread_require_mention`

**Type:** boolean — **Default:** `false`

默认情况下，一旦机器人参与了一个线程（通过 `@mention` 自动创建或一次回复），它就会继续对该线程中的每条后续消息进行响应，而无需再次被 `@mentioned`。这是一对一对话的正确默认设置。

在**多机器人线程 (multi-bot threads)** 中，如果用户轮流地向每个机器人提问，这个默认值就可能成为一个陷阱——线程中的其他每个机器人都会对每条消息进行响应，消耗信用点并发送垃圾信息。请将 `thread_require_mention: true` 设置为真，以禁用线程内的快捷方式，使线程的限制与频道相同。显式的 `@mentions` 仍然有效。

```yaml
discord:
  require_mention: true
  thread_require_mention: true    # multi-bot setup (多机器人设置)
```

#### `discord.free_response_channels`

**Type:** string or list — **Default:** `""`

机器人无需 `@mention` 即可回复所有消息的频道 ID。接受逗号分隔的字符串或 YAML 列表：

```yaml
# String format (字符串格式)
discord:
  free_response_channels: "1234567890,9876543210"

# List format (列表格式)
discord:
  free_response_channels:
    - 1234567890
    - 9876543210
```

如果一个线程的父频道在此列表中，则该线程也无需提及。

自由回复频道还会**跳过自动创建线程**——机器人会内联回复，而不是为每条消息都开启一个新的线程。这使得该频道可用作轻量级的聊天界面。如果您需要线程功能，请不要将此频道列为自由回复频道（而是使用正常的 `@mention` 流程）。

#### `discord.auto_thread`

**Type:** boolean — **Default:** `true`

启用后，每个常规文本频道中的 `@mention` 都会自动创建一个新线程来承载对话。这使得主频道保持整洁，并使每次对话都拥有自己独立的会话历史记录。一旦创建了线程，该线程中的后续消息就不需要 `@mention`——机器人知道它已经在参与中。请将 [`discord.thread_require_mention`](#discordthread_require_mention) 设置为 `true` 以禁用多机器人设置中的此内线程快捷方式。

发送到现有线程或私信中的消息不受此设置的影响。在 `discord.free_response_channels` 或 `discord.no_thread_channels` 中列出的频道也会绕过自动创建线程，而是获得内联回复。

#### `discord.reactions`

**Type:** boolean — **Default:** `true`

控制机器人是否会在处理消息时添加表情符号反应以提供视觉反馈：
-   当机器人开始处理您的消息时会添加 👀
-   当响应成功送达时会添加 ✅
-   如果处理过程中发生错误，则会添加 ❌

如果您觉得这些反应分散注意力，或者机器人的角色没有 **Add Reactions**（添加反应）权限，请将其禁用。

#### `discord.ignored_channels`

**Type:** string or list — **Default:** `[]`

机器人**绝不**回复的频道 ID。它具有最高的优先级——如果一个频道在此列表中，则无论是否设置了 `require_mention`、`free_response_channels` 或任何其他设置，机器人都会静默忽略其中的所有消息。

```yaml
# String format (字符串格式)
discord:
  ignored_channels: "1234567890,9876543210"

# List format (列表格式)
discord:
  ignored_channels:
    - 1234567890
    - 9876543210
```

如果一个线程的父频道在此列表中，则该线程中的消息也会被忽略。

#### `discord.no_thread_channels`

**Type:** string or list — **Default:** `[]`

机器人直接在频道中回复而不是自动创建线程的频道 ID。这仅在 `auto_thread` 为 `true` 时有效（默认值）。在这些频道中，机器人会像普通消息一样内联回复，而不是生成一个新的线程。

```yaml
discord:
  no_thread_channels:
    - 1234567890  # Bot responds inline here (机器人在此处内联回复)
```

这对于专门用于机器人交互的频道特别有用，可以避免不必要的噪音。

#### `discord.channel_prompts`

**Type:** mapping — **Default:** `{}`

在匹配的 Discord 频道或线程中的每一次轮次中注入、但不会保存在转录历史记录中的每个频道的临时系统提示。

```yaml
discord:
  channel_prompts:
    "1234567890": |
      This channel is for research tasks. Prefer deep comparisons,
      citations, and concise synthesis.
    "9876543210": |
      This forum is for therapy-style support. Be warm, grounded,
      and non-judgmental.
```

行为：
-   精确的线程/频道 ID 匹配优先。
-   如果一条消息出现在一个没有显式条目的线程或论坛帖子中，而该线程本身没有明确设置，Hermes 将回退到父频道/论坛 ID。
-   提示是临时应用在运行时，因此更改它们会立即影响未来的轮次，而无需重写过去的会话历史记录。

#### `discord.history_backfill`

**Type:** boolean — **Default:** `true`

启用后，机器人会在每次 `@mention` 时恢复丢失的频道消息。当 `require_mention: true` 时，机器人只处理直接标记它的消息——频道中的其他所有内容对会话转录都是不可见的。历史回填在触发时向后扫描最近的频道历史记录，收集机器人上次回复和当前提及之间的消息，并将其作为上下文包含进来。

按表面（Surface）划分的行为：

-   **Server channels** (with `require_mention: true`)：回填会扫描自机器人上次回复以来的频道内容。当其他参与者在机器人未被提及时发布消息时特别有用。
-   **Threads**：回填只扫描线程——Discord 对线程的 `channel.history()` 只返回该线程的消息，而不是父频道。这是正确的范围，因为线程通常是自包含的对话。
-   **DMs**：跳过。每条私信都会触发机器人，因此会话转录已经完整——没有需要填补的提及差距。
-   **Free-response channels** 和 **bot's own auto-created threads**：原因相同，跳过——没有提及限制意味着没有差距。

按用户（`group_sessions_per_user: true`，默认值）进行的会话也受益：用户的会话缺少其他频道参与者和用户自己在他标记机器人之前的消息所提供的上下文。回填都弥补了这两个差距。

```yaml
discord:
  history_backfill: true   # default (默认)
```

要关闭它：

```yaml
discord:
  history_backfill: false
```

> **注意：** 在机器人处理过程中（在触发和其响应之间）到达的消息不会被捕获。这是一个可接受的简化——用户可以重新发送或再次标记。

#### `discord.history_backfill_limit`

**Type:** integer — **Default:** `50`

恢复频道上下文时要扫描的最大消息数。实际上，扫描通常会更早停止——在机器人自己在该频道中的最后一条消息处，这是轮次之间的自然边界。此限制是针对冷启动和没有先前机器人消息的长时间间隔的安全上限。

```yaml
discord:
  history_backfill: true
  history_backfill_limit: 50
```

#### `group_sessions_per_user`

**Type:** boolean — **Default:** `true`

这是一个全局网关设置（不特定于 Discord），控制同一频道中的用户是否拥有隔离的会话历史记录。

当为 `true` 时：Alice 和 Bob 在 `#research` 中聊天，他们都与 Hermes 拥有自己独立的对话。当为 `false` 时：整个频道共享一个对话转录和一个运行中的智能体槽位。

```yaml
group_sessions_per_user: true
```

请参阅上面的 [Session Model](#session-model-in-discord) 部分以了解每种模式的全部含义。

#### `display.tool_progress`

**Type:** string — **Default:** `"all"` — **Values:** `off`, `new`, `all`, `verbose`

控制机器人是否在处理过程中向聊天发送进度消息（例如，“Reading file...” “Running terminal command...”）。这是一个适用于所有平台的全局网关设置。

```yaml
display:
  tool_progress: "all"    # off | new | all | verbose (关闭 | 新 | 全部 | 详细)
```

-   `off` — 无进度消息
-   `new` — 仅显示每个轮次的第一次工具调用
-   `all` — 显示所有工具调用（在网关消息中截断为 40 个字符）
-   `verbose` — 显示完整的工具调用细节（可能会生成长消息）

#### `display.tool_progress_command`

**Type:** boolean — **Default:** `false`

启用后，可在网关中提供 `/verbose` 斜杠命令，让您在不编辑 config.yaml 的情况下循环切换工具进度模式（`off → new → all → verbose → off`）。

```yaml
display:
  tool_progress_command: true
```

## 斜杠命令访问控制

默认情况下，所有被允许的用户都可以运行所有的斜杠命令。要将您的白名单划分为**管理员**（拥有完整的斜杠命令权限）和**普通用户**（只能运行您明确启用的命令），请将 `allow_admin_from` 和 `user_allowed_commands` 添加到 Discord 平台的 `extra` 块中：

```yaml
gateway:
  platforms:
    discord:
      extra:
        # Existing user allowlist (unchanged)
        allow_from:
          - "123456789012345678"  # admin user ID
          - "999888777666555444"  # regular user ID

        # NEW — admins get all slash commands (built-in + plugin)
        allow_admin_from:
          - "123456789012345678"

        # NEW — non-admin allowed users can only run these slash commands.
        # /help and /whoami are always allowed so users can see their access.
        user_allowed_commands:
          - status
          - model
          - history

        # Optional: separate admin / command lists for server channels
        group_allow_admin_from:
          - "123456789012345678"
        group_user_allowed_commands:
          - status
```

**行为：**

*   属于特定范围（私信或服务器频道）中 `allow_admin_from` 的用户，可以通过实时命令注册表运行**所有**已注册的斜杠命令——包括内置和插件注册的。
*   不在 `allow_admin_from` 中的用户只能运行 `user_allowed_commands` 中列出的命令，以及始终允许的命令：`/help` 和 `/whoami`。
*   普通聊天（非斜杠消息）不受影响。非管理员用户仍然可以正常与智能体交流；他们只是无法触发任意命令。
*   **向后兼容性：** 如果某个范围没有设置 `allow_admin_from`，则该范围的斜杠命令限制功能将被禁用。现有安装无需更改即可继续工作。
*   私信管理员状态不意味着服务器频道管理员状态。每个范围都有自己的管理员列表。

使用 `/whoami` 查看活动的范围、您的级别（管理员/用户/无限制）以及您可以运行哪些斜杠命令。

## 交互式模型选择器

在 Discord 频道中发送不带参数的 `/model` 命令，即可打开基于下拉菜单的模型选择器：

1.  **提供商选择** — 一个显示可用提供商（最多 25 个）的选择下拉菜单。
2.  **模型选择** — 第二个下拉菜单，包含针对所选提供商的模型（最多 25 个）。

选择器在 120 秒后超时。只有授权用户（`DISCORD_ALLOWED_USERS` 中的用户）才能与其互动。如果您知道模型名称，请直接输入 `/model <name>`。

## Skills 的原生斜杠命令

Hermes 会自动将已安装的技能注册为 **Discord 原生应用命令**。这意味着这些技能会出现在 Discord 的自动补全 `/` 菜单中，与内置命令并列显示。

- 每个技能都成为一个 Discord 斜杠命令（例如 `/code-review`、`/ascii-art`）
- 技能接受一个可选的 `args` 字符串参数
- Discord 对每个机器人有 100 个应用命令的限制——如果您的技能数量超过可用槽位，额外的技能将被跳过，并在日志中发出警告
- 在机器人启动时，技能会与 `/model`、`/reset` 和 `/background` 等内置命令一起注册

无需额外配置——任何通过 `hermes skills install` 安装的技能都会在下次网关重启时自动注册为 Discord 斜杠命令。

### 禁用斜杠命令注册

如果您针对同一个 Discord 应用运行多个 Hermes 网关（例如：预生产和生产环境），则只有一个网关应该拥有全局斜杠命令的注册权——否则，最后启动的那个将获胜，导致注册状态不稳定。请在“跟随者”（follower）网关上关闭斜杠注册：

```yaml
gateway:
  platforms:
    discord:
      extra:
        slash_commands: false   # default: true
```

在“主”网关（primary）上保持此项为 `true`，即可保持正常行为——即内置命令和已安装技能的全局 `/` 菜单命令。

## 发送媒体（`send_message` + `MEDIA:` 标签）

Discord 适配器通过 `send_message` 工具和由智能体发出的内联 `MEDIA:/path/to/file` 标签，支持所有常见媒体类型的原生文件上传：

| 类型 | 如何交付 |
|---|---|
| 图片 (PNG/JPG/WebP) | 带内联预览的原生 Discord 图片附件 |
| 动画 GIF | `send_animation` 作为 `animation.gif` 上传，以便 Discord 进行内联播放（而不是作为静态缩略图） |
| 视频 (MP4/MOV) | `send_video` — 原生的视频播放器 |
| 音频 / 语音 | `send_voice` — 在可能的情况下为原生语音消息，否则为文件附件 |
| 文档 (PDF/ZIP/docx/etc.) | `send_document` — 带下载按钮的原生附件 |

Discord 的每次上传大小限制取决于服务器的增益（boost）等级（免费 25 MB，最高可达 500 MB）。如果 Hermes 收到 HTTP 413 错误，适配器将回退到指向本地缓存路径的链接，而不是静默失败。

## 接收任意文件类型

任何用户上传的文件类型都将被接受。限制在于授权消息给智能体，而不是文件扩展名。每次上传都会被下载，并保存在 `~/.hermes/cache/documents/` 下，然后以 `DOCUMENT` 类型的消息事件呈现给智能体，以便它可以使用 `terminal` (`ffprobe`、`unzip`、`file`、`strings` 等) 或 `read_file` 来检查文件。

- 已知类型（PDF、docx/xlsx/pptx、zip、图片/音频/视频等）将保留其精确的 MIME 类型。
- 未知类型将回退到上传报告的内容类型，如果未提供则为 `application/octet-stream`。
- 小型的 UTF-8 可解码文件（文本、代码、配置文件、HTML、CSS、JSON、YAML 等）的内容会被自动注入到提示中，上限为 100 KiB。无法解码的二进制文件将仅作为指向路径的上下文注释呈现（通过 `to_agent_visible_cache_path` 为 Docker/Modal 沙箱终端自动翻译），因此不会撑爆上下文窗口。

唯一的入站限制是每个文件的最大大小限制（默认为 32 MiB）：

```yaml
discord:
  # 可选 — 提高/禁用每个文件的最大大小限制。默认值为 32 MiB。
  # 整个文件在缓存过程中都会保留在内存中，因此无限上传会带来真实的内存成本。
  max_attachment_bytes: 33554432   # bytes; 0 = 无限制
```

等效的环境变量：`DISCORD_MAX_ATTACHMENT_BYTES=33554432`（或 `0` 表示无限制）。

遗留的 `discord.allow_any_attachment` 标志现在已失效——任何文件类型始终都被接受——它被保留下来，以防止现有配置出错。

:::warning 无限制的内存成本
禁用大小限制（`max_attachment_bytes: 0`）意味着用户可以将一个多 GB 的文件扔给机器人，网关会 dutifully 地通过内存进行缓冲，然后缓存到磁盘上。仅在可信赖的单用户安装中设置此项。对于共享机器人，请保持默认的 32 MiB 或保守地提高限制。
:::

## 交互式提示（clarify）

当智能体调用 `clarify` 工具——以询问您偏好的方法、获取任务后的反馈或在做出非显而易见的决定之前进行检查时——Discord 会带着 **每个选择一个按钮** 来渲染该问题：

> 我应该为仪表板使用哪个框架？
>
> [1. Next.js] [2. Remix] [3. Astro] [其他（输入答案）]

点击编号的按钮进行回答，或者点击 **其他** 来输入自由形式的回复（您在该频道中发送的下一条消息将成为答案）。开放式的 `clarify` 调用（没有预设选项）会跳过按钮，只捕获您的下一条消息。

一旦做出选择，这些按钮就会禁用自身，以防止重复点击导致提示被多次解析。通过 `~/.hermes/config.yaml` 中的 `agent.clarify_timeout` 配置响应超时时间（默认 `600` 秒）。如果您在超时时间内没有回复，智能体将发出一个哨兵消息并进行调整，而不是挂起。

## 主频道 (Home Channel)

您可以指定一个“主频道”，机器人会在该频道发送主动消息（例如定时任务输出、提醒和通知）。有两种设置方法：

### 使用斜杠命令

在机器人存在的任何 Discord 频道中输入 `/sethome`。该频道即成为主频道。

### 手动配置

将以下内容添加到您的 `~/.hermes/.env` 中：

```bash
DISCORD_HOME_CHANNEL=123456789012345678
DISCORD_HOME_CHANNEL_NAME="#bot-updates"
```

请用实际的频道 ID 替换此处的 ID（右键单击 → 使用开发者模式复制频道 ID）。

## 语音消息

Hermes Agent 支持 Discord 语音消息：

- **传入的语音消息** 会使用配置的 STT 提供商自动转录：本地 `faster-whisper`（无需密钥）、Groq Whisper (`GROQ_API_KEY`) 或 OpenAI Whisper (`VOICE_TOOLS_OPENAI_KEY`)。
- **文本转语音 (Text-to-speech)**：使用 `/voice tts` 让机器人发送带语音回复的文本消息。
- **Discord 语音频道**：Hermes 还可以加入语音频道，收听用户的发言，并在频道中进行回应。

有关完整的设置和操作指南，请参阅：
- [Voice Mode](/user-guide/features/voice-mode)
- [Use Voice Mode with Hermes](/guides/use-voice-mode-with-hermes)

### 语音频道音频效果（环境音 + 口头确认）

当机器人处于语音频道中时，您可以赋予它更具对话性的感觉：在开始工作之前先进行简短的口头确认（例如：“让我研究一下”），以及一个微妙的环境“思考”背景音轨，在工具运行时持续播放——这种声音会降低环境音并使其在完成时恢复，类似于 Grok 的语音模式。

discord.py 对每个连接只播放一个音频流，因此 Hermes 在出站流上安装了一个软件混音器，将环境循环、口头确认和 TTS 回复到这单个流中——它们是重叠而不是相互打断的。

这**默认是关闭的**。请在 `config.yaml` 中启用它：

```yaml
discord:
  voice_fx:
    enabled: true          # 主开关
    ambient_enabled: true  # 工具运行时闲置“思考”背景音轨
    ambient_path: ""       # 自定义循环文件（任何音频格式）；"" = 内置合成垫
    ambient_gain: 0.18     # 闲置背景音的响度 (0.0–1.0)
    duck_gain: 0.06        # 机器人说话时的环境音响度
    speech_gain: 1.0       # TTS / 口头确认的响度
    ack_enabled: true      # 在回合开始前的第一次工具调用前说一句短语
    ack_phrases:           # 从中随机选择；设置为 [] 可禁用口头确认
      - "Let me look into that."
      - "One moment."
      - "Checking on that now."
```

注意事项：
- 口头确认最多在每个回合触发一次，仅当机器人处于语音频道且混音器激活时才会触发。它使用您配置的 TTS 提供商。
- `ambient_path` 接受任何 `ffmpeg` 可以解码的文件；它会无缝循环。留空则使用内置合成垫（无需素材）。
- 所有设置都保存在 `config.yaml` 中（而不是 `.env`）——它们是行为性的，不是秘密。
- 当 `voice_fx.enabled` 为 `false` 时，语音播放将使用原始的一次性路径，不会有任何变化。

## 论坛频道 (Forum Channels)

Discord 论坛频道（类型 15）不接受直接消息——论坛中的每一篇帖子都必须是一个线程。Hermes 会自动检测论坛频道，并在需要发送消息时创建新线程，因此 `send_message`、TTS、图片、语音消息和文件附件都可以正常工作，无需智能体进行特殊处理。

- **线程名称** 是从消息的第一行推导出来的（去除 Markdown 标题前缀，限制为 100 个字符）。如果消息仅包含附件，则使用文件名作为备用线程名称。
- **附件** 会随新线程的起始消息一起发送——无需单独上传步骤，也无需分批发送。
- **一次调用，一个线程**：每次论坛发送都会创建一个新线程。因此，对同一论坛的连续发送将产生独立的线程。
- **检测是三层的**：首先是频道目录缓存，其次是进程本地探查缓存，最后是实时的 `GET /channels/{id}` 探查（其结果随后会被保存在进程生命周期内）。

刷新目录（在支持此功能的平台上使用 `/channels refresh`，或网关重启）会用任何在机器人启动后创建的论坛频道来填充缓存。

## 故障排除

### 机器人在线但未响应消息

**原因**：消息内容意图 (Message Content Intent) 已禁用。

**修复**：前往 [开发者门户](https://discord.com/developers/applications) → 您的应用 → Bot → 特权网关意图 (Privileged Gateway Intents) → 启用 **消息内容意图** → 保存更改。重启网关。

### 启动时出现“Disallowed Intents”（不允许的意图）错误

**原因**：您的代码请求了在开发者门户中未启用的意图。

**修复**：在 Bot 设置中启用所有三个特权网关意图（Presence, Server Members, Message Content），然后重启。

### 机器人看不到特定频道中的消息

**原因**：机器人的角色没有查看该频道的权限。

**修复**：在 Discord 中，进入该频道的设置 → 权限 → 添加机器人的角色，并启用 **View Channel** 和 **Read Message History**。

### 403 Forbidden（禁止）错误

**原因**：机器人缺少必需的权限。

**修复**：使用步骤 5 中的 URL 重新邀请机器人，并授予正确的权限，或手动调整服务器设置中的机器人角色权限。

### 机器人离线

**原因**：Hermes 网关未运行，或者令牌不正确。

**修复**：检查 `hermes gateway` 是否正在运行。验证 `.env` 文件中的 `DISCORD_BOT_TOKEN`。如果您最近重置了令牌，请更新它。

### “User not allowed”（用户不允许）/ 机器人忽略您

**原因**：您的用户 ID 不在 `DISCORD_ALLOWED_USERS` 中。

**修复**：将您的用户 ID 添加到 `~/.hermes/.env` 中的 `DISCORD_ALLOWED_USERS`，然后重启网关。

### 同一频道中的人们意外共享上下文

**原因**：`group_sessions_per_user` 已禁用，或者平台无法为该上下文中的消息提供用户 ID。

**修复**：在 `~/.hermes/config.yaml` 中设置此项并重启网关：

```yaml
group_sessions_per_user: true
```

如果您故意想要一个共享的房间对话，请保持关闭——只需接受共享的转录历史和共享的打断行为即可。

## 安全性 (Security)

:::warning
始终设置 `DISCORD_ALLOWED_USERS`（或 `DISCORD_ALLOWED_ROLES`）以限制谁可以与机器人进行交互。如果没有设置其中一项，网关将默认拒绝所有用户，这是一种安全措施。只授权您信任的人——授权用户拥有对智能体能力的完全访问权限，包括工具使用和系统访问。
:::

### 基于角色的访问控制 (Role-Based Access Control)

对于通过角色而不是单个用户列表来管理访问的服务器（例如：版主团队、支持人员、内部工具），请使用 `DISCORD_ALLOWED_ROLES`——这是一个逗号分隔的角色 ID 列表。拥有其中任何一个角色的成员都将被授权。

```bash
# ~/.hermes/.env — 可与 DISCORD_ALLOWED_USERS 并存或替代它
DISCORD_ALLOWED_ROLES=987654321098765432,876543210987654321
```

语义说明：

- **与用户白名单 OR 结合使用。** 如果用户的 ID 在 `DISCORD_ALLOWED_USERS` 中，**或者**他们拥有 `DISCORD_ALLOWED_ROLES` 中的任何一个角色，则该用户被授权。
- **自动启用服务器成员意图 (Server Members Intent)。** 当设置了 `DISCORD_ALLOWED_ROLES` 时，机器人会在连接时启用“成员”意图——这是 Discord 发送成员记录中角色信息的必要条件。
- **使用角色 ID，而非名称。** 从 Discord 中获取它们：**用户设置 → 高级 → 开启开发者模式**，然后右键单击任何一个角色 → **复制角色 ID**。
- **私信 (DM) 回退机制。** 在私信中，角色检查会扫描双方的服务器；在任何共享服务器中拥有允许角色的用户，在私信中也将被授权。

当审核团队人员流动频繁时，这是首选模式——新版主可以立即获得权限，无需编辑 `.env` 或重启网关。

### 提及控制 (Mention Control)

默认情况下，Hermes 会阻止机器人@everyone、@here 以及角色提及，即使其回复中包含这些标记。这可以防止措辞不当的提示或回显的用户内容对整个服务器造成垃圾信息轰炸。单个 `@user` 提及和回复引用提及（那个小的“回复…”芯片）仍然启用，以确保正常对话功能正常。

您可以通过环境变量或 `config.yaml` 来放宽这些默认设置：

```yaml
# ~/.hermes/config.yaml
discord:
  allow_mentions:
    everyone: false      # 允许机器人ping @everyone / @here
    roles: false         # 允许机器人ping @role 提及
    users: true          # 允许机器人ping 单个 @user
    replied_user: true   # 回复消息时ping作者
```

```bash
# ~/.hermes/.env — 环境变量覆盖 config.yaml
DISCORD_ALLOW_MENTION_EVERYONE=false
DISCORD_ALLOW_MENTION_ROLES=false
DISCORD_ALLOW_MENTION_USERS=true
DISCORD_ALLOW_MENTION_REPLIED_USER=true
```

:::tip
除非您确切知道需要它们，否则请将 `everyone` 和 `roles` 设置为 `false`。LLM 很容易在看起来正常的回复中生成 `@everyone` 字符串；如果没有此保护，这将通知您服务器上的每个成员。
:::

有关如何保护您的 Hermes 智能体部署的更多信息，请参阅 [安全指南](../security.md)。