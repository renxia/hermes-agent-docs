---
sidebar_position: 3
title: "Discord"
description: "设置 Hermes 智能体作为 Discord 机器人"
---

# Discord 设置

Hermes 智能体通过机器人形式与 Discord 集成，让您可以直接通过私信或服务器频道与您的 AI 助手聊天。机器人接收您的消息，通过 Hermes 智能体管道（包括工具使用、记忆和推理）进行处理，并实时做出响应。它支持文本、语音消息、文件附件和斜杠命令。

在设置之前，这里是大多数人想知道的部分：Hermes 进入您的服务器后的行为方式。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| **私信** | Hermes 会回复每条消息。无需 `@提及`。每个私信都有自己的会话。 |
| **服务器频道** | 默认情况下，Hermes 仅在您 `@提及` 它时才回复。如果您在频道中发布消息但没有提及它，Hermes 会忽略该消息。 |
| **自由回复频道** | 您可以通过 `DISCORD_FREE_RESPONSE_CHANNELS` 使特定频道免提及，或者通过 `DISCORD_REQUIRE_MENTION=false` 全局禁用提及要求。这些频道中的消息会内联回复——自动创建线程功能将被跳过，因此频道保持轻量级聊天状态。 |
| **线程** | Hermes 在同一线程中回复。除非该线程或其父频道被配置为自由回复，否则提及规则仍然适用。线程在会话历史记录方面与父频道保持隔离。 |
| **多个用户共享的频道** | 默认情况下，出于安全和清晰度的考虑，Hermes 会在频道内按用户隔离会话历史记录。除非您明确禁用该功能，否则在同一个频道中交谈的两个人不会共享一份对话记录。 |
| **提及他用户的消息** | 当 `DISCORD_IGNORE_NO_MENTION` 为 `true`（默认值）时，如果一条消息 @提及了其他用户但**没有**提及机器人，Hermes 会保持沉默。这可以防止机器人介入针对他人的对话。如果您希望机器人响应所有消息，无论提及了谁，请设置为 `false`。此设置仅适用于服务器频道，不适用于私信。 |

:::tip
如果您想要一个普通的机器人帮助频道，让人们可以在不需要每次都标记 Hermes 的情况下与其交谈，请将该频道添加到 `DISCORD_FREE_RESPONSE_CHANNELS`。
:::

### Discord 网关模型

Hermes 在 Discord 上不是一个无状态回复的 Webhook。它通过完整的消息网关运行，这意味着每条传入消息都会经过：

1. 授权（`DISCORD_ALLOWED_USERS`）
2. 提及/自由回复检查
3. 会话查找
4. 会话历史记录加载
5. 常规 Hermes 智能体执行，包括工具、记忆和斜杠命令
6. 将响应传回 Discord

这一点很重要，因为在繁忙服务器中的行为取决于 Discord 路由和 Hermes 会话策略。

### Discord 中的会话模型

默认情况下：

- 每个私信有其自己的会话
- 每个服务器线程有其自己的会话命名空间
- 共享频道中的每个用户在该频道内有其自己的会话

因此，如果 Alice 和 Bob 都在 `#research` 频道中与 Hermes 交谈，默认情况下，Hermes 会将这些视为独立的对话，即使他们使用的是同一个可见的 Discord 频道。

这由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您明确希望整个房间共享一个对话时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话对于协作房间很有用，但它们也意味着：

- 用户共享上下文增长和令牌成本
- 一个人的长耗时工具密集型任务可能会使其他所有人的上下文变得臃肿
- 一个人正在进行的运行可能会打断同房间中其他人的后续操作

### 中断与并发

Hermes 通过会话键跟踪正在运行的智能体。

使用默认的 `group_sessions_per_user: true` 时：

- Alice 中断她自己正在进行的请求仅影响她自己在该频道中的会话
- Bob 可以继续在同一个频道中交谈，而不会继承 Alice 的历史记录或中断 Alice 的运行

使用 `group_sessions_per_user: false` 时：

- 整个房间共享该频道/线程的一个正在运行的智能体插槽
- 来自不同人的后续消息可能会相互中断或排队

本指南将引导您完成整个设置过程——从在 Discord 开发者门户创建您的机器人到发送您的第一条消息。

## 步骤 1：创建 Discord 应用程序

1.  访问 [Discord 开发者门户](https://discord.com/developers/applications)，并使用你的 Discord 账户登录。
2.  点击右上角的 **新建应用程序**。
3.  为你的应用程序输入一个名称（例如“Hermes Agent”），并接受开发者服务条款。
4.  点击 **创建**。

你将进入 **常规信息** 页面。记下 **应用程序 ID** —— 你稍后构建邀请链接时需要用到它。

## 步骤 2：创建机器人

1.  在左侧边栏中，点击 **机器人**。
2.  Discord 会自动为你的应用程序创建一个机器人用户。你会看到机器人的用户名，可以自定义。
3.  在 **授权流程** 下：
    *   将 **公开机器人** 设置为 **开启** —— 使用 Discord 提供的邀请链接时需要此设置（推荐）。这允许“安装”选项卡生成默认授权 URL。
    *   将 **需要 OAuth2 代码授权** 设置为 **关闭**。

:::tip
你可以在此页面为你的机器人设置自定义头像和横幅。这是用户将在 Discord 中看到的形象。
:::

:::info[私有机器人替代方案]
如果你希望保持机器人私有（公开机器人 = 关闭），则**必须**使用步骤 5 中的**手动 URL** 方法，而不是“安装”选项卡。Discord 提供的链接需要启用“公开机器人”。
:::

## 步骤 3：启用特权网关意图

这是整个设置过程中最关键的一步。如果没有启用正确的意图，你的机器人将连接到 Discord，但**无法读取消息内容**。

在 **机器人** 页面，向下滚动到 **特权网关意图**。你会看到三个开关：

| 意图 | 目的 | 是否必需？ |
|------|------|------------|
| **在线状态意图** | 查看用户在线/离线状态 | 可选 |
| **服务器成员意图** | 访问成员列表，解析用户名 | **必需** |
| **消息内容意图** | 读取消息的文本内容 | **必需** |

将 **服务器成员意图** 和 **消息内容意图** 都**开启**。

*   如果没有 **消息内容意图**，你的机器人会收到消息事件，但消息文本是空的——机器人完全无法看到你输入的内容。
*   如果没有 **服务器成员意图**，机器人无法为允许的用户列表解析用户名，并且可能无法识别谁在给它发消息。

:::warning[这是 Discord 机器人不工作的首要原因]
如果你的机器人在线但从未响应消息，几乎可以肯定 **消息内容意图** 被禁用了。返回 [开发者门户](https://discord.com/developers/applications)，选择你的应用程序 → 机器人 → 特特权网关意图，确保 **消息内容意图** 已开启。点击 **保存更改**。
:::

**关于服务器数量：**
*   如果你的机器人加入的**服务器少于 100 个**，你可以自由开关意图。
*   如果你的机器人加入的**服务器达到或超过 100 个**，Discord 会要求你提交验证申请才能使用特权意图。对于个人使用，这通常不构成问题。

点击页面底部的 **保存更改**。

## 步骤 4：获取机器人令牌

机器人令牌是 Hermes Agent 用来以你的机器人身份登录的凭据。仍在 **机器人** 页面：

1.  在 **令牌** 部分，点击 **重置令牌**。
2.  如果你的 Discord 账户启用了双重身份验证，请输入你的 2FA 代码。
3.  Discord 将显示你的新令牌。**立即复制它。**

:::warning[令牌仅显示一次]
令牌只会显示一次。如果你丢失了它，你需要重置并生成一个新的。切勿公开分享你的令牌或将其提交到 Git——任何拥有此令牌的人都可以完全控制你的机器人。
:::

将令牌存储在安全的地方（例如密码管理器）。你需要在步骤 8 中使用它。

## 步骤 5：生成邀请 URL

你需要一个 OAuth2 URL 来将机器人邀请到你的服务器。有两种方法可以做到：

### 选项 A：使用安装选项卡（推荐）

:::note[需要公开机器人]
此方法要求在步骤 2 中将 **公开机器人** 设置为 **开启**。如果你将公开机器人设置为关闭，请改用手动 URL 方法。
:::

1.  在左侧边栏中，点击 **安装**。
2.  在 **安装上下文** 下，启用 **服务器安装**。
3.  对于 **安装链接**，选择 **Discord 提供的链接**。
4.  在 **服务器安装** 的 **默认安装设置** 下：
    *   **范围**：选择 `bot` 和 `applications.commands`
    *   **权限**：选择下面列出的权限。

### 选项 B：手动 URL

你可以使用此格式直接构建邀请 URL：

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=274878286912
```

将 `YOUR_APP_ID` 替换为步骤 1 中的应用程序 ID。

### 所需权限

以下是你的机器人所需的最低权限：

*   **查看频道** —— 查看它有权访问的频道
*   **发送消息** —— 响应你的消息
*   **嵌入链接** —— 格式化富文本响应
*   **附加文件** —— 发送图像、音频和文件输出
*   **阅读消息历史** —— 维护对话上下文

### 推荐的附加权限

*   **在帖子中发送消息** —— 在帖子对话中响应
*   **添加反应** —— 对消息做出反应以确认

### 权限整数

| 级别 | 权限整数 | 包含内容 |
|------|----------|----------|
| 最小 | `117760` | 查看频道、发送消息、阅读消息历史、附加文件 |
| 推荐 | `274878286912` | 以上所有，加上嵌入链接、在帖子中发送消息、添加反应 |

## 步骤 6：邀请到你的服务器

1.  在浏览器中打开邀请 URL（来自安装选项卡或你构建的手动 URL）。
2.  在 **添加到服务器** 下拉菜单中，选择你的服务器。
3.  点击 **继续**，然后 **授权**。
4.  如果提示，完成验证码。

:::info
你需要在 Discord 服务器上拥有 **管理服务器** 权限才能邀请机器人。如果你在下拉菜单中没有看到你的服务器，请让服务器管理员使用邀请链接代替。
:::

授权后，机器人将出现在你服务器的成员列表中（在你启动 Hermes 网关之前，它将显示为离线状态）。

## 第 7 步：查找您的 Discord 用户 ID

Hermes 智能体使用您的 Discord 用户 ID 来控制谁可以与机器人互动。查找步骤如下：

1.  打开 Discord（桌面或网页应用）。
2.  进入 **设置** → **高级** → 将 **开发者模式** 切换为 **开启**。
3.  关闭设置。
4.  右键单击您自己的用户名（在消息中、成员列表中或个人资料中） → **复制用户 ID**。

您的用户 ID 是一长串数字，例如 `284102345871466496`。

:::tip
开发者模式也让您可以采用相同方式复制 **频道 ID** 和 **服务器 ID** — 右键单击频道或服务器名称并选择复制 ID。如果您想手动设置主频道，您将需要频道 ID。
:::

## 第 8 步：配置 Hermes 智能体

### 选项 A：交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

当提示时选择 **Discord**，然后在询问时粘贴您的机器人令牌和用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# 必需项
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_ALLOWED_USERS=284102345871466496

# 多个允许的用户（用逗号分隔）
# DISCORD_ALLOWED_USERS=284102345871466496,198765432109876543
```

然后启动网关：

```bash
hermes gateway
```

机器人应在几秒钟内在 Discord 上线。向它发送一条消息 — 无论是私信还是在它可见的频道中 — 进行测试。

:::tip
您可以在后台或作为 systemd 服务运行 `hermes gateway` 以实现持久化操作。详情请参阅部署文档。
:::

## 配置参考

Discord 行为通过两个文件控制：**`~/.hermes/.env`** 用于凭证和环境级开关，以及 **`~/.hermes/config.yaml`** 用于结构化设置。当两者都设置时，环境变量始终优先于 `config.yaml` 中的值。

### 环境变量 (`.env`)

| 变量 | 是否必须 | 默认值 | 描述 |
|------|----------|--------|------|
| `DISCORD_BOT_TOKEN` | **是** | — | 来自 [Discord开发者门户](https://discord.com/developers/applications) 的机器人令牌。 |
| `DISCORD_ALLOWED_USERS` | **是** | — | 逗号分隔的允许与机器人交互的Discord用户ID。如果没有设置此项**或** `DISCORD_ALLOWED_ROLES`，网关将拒绝所有用户。 |
| `DISCORD_ALLOWED_ROLES` | 否 | — | 逗号分隔的Discord角色ID。拥有其中任一角色的成员即被授权——与 `DISCORD_ALLOWED_USERS` 是"或"语义。连接时会自动启用**服务器成员意图**。当管理团队变动时很有用：一旦授予角色，新管理员即可获得访问权限，无需推送配置。 |
| `DISCORD_HOME_CHANNEL` | 否 | — | 机器人发送主动消息（定时输出、提醒、通知）的频道ID。 |
| `DISCORD_HOME_CHANNEL_NAME` | 否 | `"Home"` | 日志和状态输出中主频道的显示名称。 |
| `DISCORD_COMMAND_SYNC_POLICY` | 否 | `"safe"` | 控制原生斜杠命令的启动同步策略。`"safe"` 会对比现有的全局命令，仅更新已更改的部分，当Discord元数据无法通过补丁应用时则重建命令。`"bulk"` 保留旧的 `tree.sync()` 行为。`"off"` 完全跳过启动同步。 |
| `DISCORD_REQUIRE_MENTION` | 否 | `true` | 当为 `true` 时，机器人仅在服务器频道被 `@提及` 时才响应。设为 `false` 则响应每个频道的所有消息。 |
| `DISCORD_THREAD_REQUIRE_MENTION` | 否 | `false` | 当为 `true` 时，线程内的提及快捷方式将被禁用——线程与频道一样受到限制，即使机器人已参与对话，也需要 `@提及`。当多个机器人共享一个线程且你希望每个机器人仅在明确 `@提及` 时触发时使用此设置。 |
| `DISCORD_FREE_RESPONSE_CHANNELS` | 否 | — | 逗号分隔的频道ID，在这些频道中，即使 `DISCORD_REQUIRE_MENTION` 为 `true`，机器人也无需 `@提及` 即会响应。 |
| `DISCORD_IGNORE_NO_MENTION` | 否 | `true` | 当为 `true` 时，如果消息 `@提及` 了其他用户但**没有**提及机器人，机器人将保持沉默。防止机器人跳入指向其他人的对话。仅适用于服务器频道，不适用于私信。 |
| `DISCORD_AUTO_THREAD` | 否 | `true` | 当为 `true` 时，会在文本频道中为每条 `@提及` 自动创建新线程，使每次对话隔离（类似于Slack行为）。已在线程或私信中的消息不受影响。 |
| `DISCORD_ALLOW_BOTS` | 否 | `"none"` | 控制机器人如何处理来自其他Discord机器人的消息。`"none"` — 忽略所有其他机器人。`"mentions"` — 仅接受 `@提及` Hermes 的机器人消息。`"all"` — 接受所有机器人消息。 |
| `DISCORD_REACTIONS` | 否 | `true` | 当为 `true` 时，机器人会在处理消息期间添加表情符号反应（开始处理时添加 👀，成功时添加 ✅，出错时添加 ❌）。设为 `false` 可完全禁用反应。 |
| `DISCORD_IGNORED_CHANNELS` | 否 | — | 逗号分隔的频道ID，在这些频道中机器人**永不**响应，即使被 `@提及`。此设置优先于所有其他频道设置。 |
| `DISCORD_ALLOWED_CHANNELS` | 否 | — | 逗号分隔的频道ID。设置后，机器人**仅**在这些频道（以及允许的私信）中响应。覆盖 `config.yaml` 中的 `discord.allowed_channels`。可与 `DISCORD_IGNORED_CHANNELS` 结合以表达允许/拒绝规则。 |
| `DISCORD_NO_THREAD_CHANNELS` | 否 | — | 逗号分隔的频道ID，在这些频道中机器人直接在频道中响应，而不是创建线程。仅在 `DISCORD_AUTO_THREAD` 为 `true` 时相关。 |
| `DISCORD_HISTORY_BACKFILL` | 否 | `true` | 当为 `true` 时，在机器人被提及时，将最近的频道回溯（自机器人上次响应以来）预先添加到用户消息中。恢复了由于 `require_mention` 设置机器人原本会错过的上下文。在私信和自由响应频道中跳过。设为 `false` 可禁用。 |
| `DISCORD_HISTORY_BACKFILL_LIMIT` | 否 | `50` | 在组装回填块时，向后扫描消息的最大数量。实际上，扫描通常会更早停止——停在频道中机器人自己的最后一条消息处。 |
| `DISCORD_REPLY_TO_MODE` | 否 | `"first"` | 控制回复引用行为：`"off"` — 永不回复原始消息，`"first"` — 仅对第一个消息块进行回复引用（默认），`"all"` — 对每个消息块都进行回复引用。 |
| `DISCORD_ALLOW_MENTION_EVERYONE` | 否 | `false` | 当为 `false`（默认）时，即使机器人响应中包含 `@everyone` 或 `@here` 标记，也无法提及它们。设为 `true` 可重新启用。参见下方 [提及控制](#mention-control)。 |
| `DISCORD_ALLOW_MENTION_ROLES` | 否 | `false` | 当为 `false`（默认）时，机器人无法提及 `@角色`。设为 `true` 允许提及。 |
| `DISCORD_ALLOW_MENTION_USERS` | 否 | `true` | 当为 `true`（默认）时，机器人可以通过ID提及单个用户。 |
| `DISCORD_ALLOW_MENTION_REPLIED_USER` | 否 | `true` | 当为 `true`（默认）时，回复一条消息会提及原作者。 |
| `DISCORD_PROXY` | 否 | — | 用于Discord连接的代理URL（HTTP、WebSocket、REST）。覆盖 `HTTPS_PROXY`/`ALL_PROXY`。支持 `http://`、`https://` 和 `socks5://` 协议。 |
| `DISCORD_ALLOW_ANY_ATTACHMENT` | 否 | `false` | 当为 `true` 时，机器人接受任何文件类型的附件（而不仅仅是内置的PDF/文本/zip/office允许列表）。未知类型会被缓存到磁盘，并以 `application/octet-stream` MIME类型作为本地路径提供给智能体，以便其使用 `终端` / `读取文件` / `ffprobe` 等工具检查。 |
| `DISCORD_MAX_ATTACHMENT_BYTES` | 否 | `33554432` | 网关将下载并缓存的每个附件的最大字节数。默认32 MiB。设为 `0` 表示无上限（附件在写入时保存在内存中，因此无上限会产生实际内存开销）。 |
| `HERMES_DISCORD_TEXT_BATCH_DELAY_SECONDS` | 否 | `0.6` | 适配器在刷新排队的文本块之前等待的宽限窗口。用于平滑流式输出。 |
| `HERMES_DISCORD_TEXT_BATCH_SPLIT_DELAY_SECONDS` | 否 | `2.0` | 当单条消息超过Discord长度限制时，拆分块之间的延迟。 |

### 配置文件 (`config.yaml`)

`~/.hermes/config.yaml` 中的 `discord` 部分反映了上述环境变量。`config.yaml` 设置作为默认值应用——如果设置了等效的环境变量，则环境变量优先。

```yaml
# Discord特定设置
discord:
  require_mention: true           # 在服务器频道中需要@提及
  thread_require_mention: false   # 如果为true，则在线程中也需要@提及（多机器人线程）
  free_response_channels: ""      # 逗号分隔的频道ID（或YAML列表）
  auto_thread: true               # 在@提及时自动创建线程
  reactions: true                 # 在处理期间添加表情符号反应
  ignored_channels: []            # 机器人永不响应的频道ID
  no_thread_channels: []          # 机器人直接响应而不创建线程的频道ID
  history_backfill: true          # 在提及时预先添加最近的频道回溯（默认：true）
  history_backfill_limit: 50      # 向后扫描的最大消息数（默认：50）
  channel_prompts: {}             # 每个频道的临时系统提示
  allow_mentions:                 # 机器人允许提及的内容（安全默认值）
    everyone: false               # @everyone / @here 提及（默认：false）
    roles: false                  # @role 提及（默认：false）
    users: true                   # @user 提及（默认：true）
    replied_user: true            # 回复引用会提及作者（默认：true）

# 会话隔离（适用于所有网关平台，不仅仅是Discord）
group_sessions_per_user: true     # 在共享频道中为每个用户隔离会话
```

#### `discord.require_mention`

**类型：** 布尔值 — **默认值：** `true`

启用后，机器人仅在服务器频道中被直接 `@提及` 时才响应。无论此设置如何，私信总是会得到响应。

#### `discord.thread_require_mention`

**类型：** 布尔值 — **默认值：** `false`

默认情况下，一旦机器人参与了一个线程（通过 `@提及` 自动创建或回复过一次），它就会继续响应该线程中的每条后续消息，无需再次被 `@提及`。这是一对一对话的正确默认设置。

在**多机器人线程**中，用户每轮只针对一个机器人说话，这个默认设置会成为一个陷阱——线程中的每个其他机器人也会在每条消息上触发，消耗额度并刷屏。设置 `thread_require_mention: true` 可禁用线程内快捷方式，并像限制频道一样限制线程。显式的 `@提及` 仍像以前一样有效。

```yaml
discord:
  require_mention: true
  thread_require_mention: true    # 多机器人设置
```

#### `discord.free_response_channels`

**类型：** 字符串或列表 — **默认值：** `""`

在这些频道ID中，机器人对所有消息响应，无需 `@提及`。接受逗号分隔的字符串或YAML列表：

```yaml
# 字符串格式
discord:
  free_response_channels: "1234567890,9876543210"

# 列表格式
discord:
  free_response_channels:
    - 1234567890
    - 9876543210
```

如果一个线程的父频道在此列表中，则该线程也变为无需提及。

自由响应频道也会**跳过自动线程创建** — 机器人会内联回复，而不是为每条消息启动一个新线程。这使频道可以作为轻量级聊天界面使用。如果你想要线程行为，请不要将该频道列为自由响应（改用正常的 `@提及` 流程）。

#### `discord.auto_thread`

**类型：** 布尔值 — **默认值：** `true`

启用后，常规文本频道中的每条 `@提及` 都会自动创建一个新线程进行对话。这使主频道保持整洁，并为每次对话提供独立的会话历史记录。一旦线程创建，该线程中的后续消息不需要 `@提及` — 机器人知道它已经参与其中。对于多机器人设置，将 [`thread_require_mention`](#discordthread_require_mention) 设为 `true` 可禁用此线程内快捷方式。

在现有线程或私信中发送的消息不受此设置影响。`discord.free_response_channels` 或 `discord.no_thread_channels` 中列出的频道也会绕过自动线程创建，而是获得内联回复。

#### `discord.reactions`

**类型：** 布尔值 — **默认值：** `true`

控制机器人是否在处理消息时添加表情符号反应作为视觉反馈：
- 当机器人开始处理你的消息时添加 👀
- 当响应成功送达时添加 ✅
- 如果在处理过程中发生错误则添加 ❌

如果你觉得反应分散注意力，或者机器人的角色没有**添加反应**权限，请禁用此功能。

#### `discord.ignored_channels`

**类型：** 字符串或列表 — **默认值：** `[]`

在这些频道ID中，机器人**永不**响应，即使被直接 `@提及`。此设置优先级最高——如果频道在此列表中，机器人会静默忽略其中的所有消息，无论 `require_mention`、`free_response_channels` 或其他任何设置如何。

```yaml
# 字符串格式
discord:
  ignored_channels: "1234567890,9876543210"

# 列表格式
discord:
  ignored_channels:
    - 1234567890
    - 9876543210
```

如果线程的父频道在此列表中，则该线程中的消息也会被忽略。

#### `discord.no_thread_channels`

**类型：** 字符串或列表 — **默认值：** `[]`

在这些频道ID中，机器人直接在频道中响应，而不是自动创建线程。仅当 `auto_thread` 为 `true`（默认值）时才有效。在这些频道中，机器人会像普通消息一样内联响应，而不是生成新线程。

```yaml
discord:
  no_thread_channels:
    - 1234567890  # 机器人在此处内联响应
```

适用于专门用于机器人交互的频道，在这些频道中线程会增加不必要的噪音。

#### `discord.channel_prompts`

**类型：** 映射 — **默认值：** `{}`

每个频道的临时系统提示，会在匹配的Discord频道或线程的每一轮对话中注入，而不会被持久化到对话历史中。

```yaml
discord:
  channel_prompts:
    "1234567890": |
      此频道用于研究任务。优先进行深度比较、
      引用和简洁的综合。
    "9876543210": |
      此论坛用于类似治疗的支持。保持温暖、踏实，
      不带评判。
```

行为：
- 精确的线程/频道ID匹配优先。
- 如果消息到达线程或论坛帖子内，且该线程没有明确条目，Hermes会回退到父频道/论坛ID。
- 提示在运行时临时应用，因此更改会立即影响未来的对话轮次，而无需重写过去的会话历史。

#### `discord.history_backfill`

**类型：** 布尔值 — **默认值：** `true`

启用后，机器人会在每次 `@提及` 时恢复错过的频道消息。当 `require_mention: true` 时，机器人仅处理直接标记它的消息——频道中的其他内容对会话记录不可见。历史回填在触发时会向后扫描最近的频道历史，收集机器人上次响应与当前提及之间的消息，并将其作为上下文包含进来。

按界面划分的行为：

- **服务器频道**（当 `require_mention: true` 时）：回填扫描自机器人上次响应以来的频道内容。当其他参与者在没有被提及机器人期间发布消息时很有用。
- **线程**：回填仅扫描该线程 — Discord对线程的 `channel.history()` 只返回该线程的消息，不包括父频道。这是正确的范围，因为线程通常是自包含的对话。
- **私信**：跳过。每条私信消息都会触发机器人，因此会话记录已经完整——没有提及间隙需要填补。
- **自由响应频道**和**机器人自动创建的线程**：基于相同原因跳过——没有提及限制意味着没有间隙。

每用户会话（`group_sessions_per_user: true`，默认值）也受益：用户的会话缺少其他频道参与者发布的上下文，以及用户自己标记机器人之前的消息。回填填补了这两个空白。

```yaml
discord:
  history_backfill: true   # 默认
```

要关闭它：

```yaml
discord:
  history_backfill: false
```

> **注意：** 在机器人处理*期间*到达的消息（在触发和其响应之间）不会被捕捉。这是一个可接受的简化——用户可以重新发送或再次标记。

#### `discord.history_backfill_limit`

**类型：** 整数 — **默认值：** `50`

在恢复频道上下文时，向后扫描的最大消息数。实际上，扫描通常会更早停止——停在频道中机器人自己的最后一条消息处，这是轮次之间的自然边界。此限制是针对冷启动和长时间间隔（近期历史中没有先前的机器人消息）的安全上限。

```yaml
discord:
  history_backfill: true
  history_backfill_limit: 50
```

#### `group_sessions_per_user`

**类型：** 布尔值 — **默认值：** `true`

这是一个全局网关设置（非Discord特定），控制同一频道中的用户是否获得独立的会话历史。

当为 `true` 时：Alice和Bob在 `#research` 频道中各自与Hermes进行独立的对话。当为 `false` 时：整个频道共享一个对话记录和一个运行中的智能体槽位。

```yaml
group_sessions_per_user: true
```

每种模式的完整影响请参见上方的 [会话模型](#session-model-in-discord) 部分。

#### `display.tool_progress`

**类型：** 字符串 — **默认值：** `"all"` — **取值：** `off`, `new`, `all`, `verbose`

控制机器人在处理期间是否在聊天中发送进度消息（例如，“正在读取文件...”、“正在运行终端命令...”）。这是一个适用于所有平台的全局网关设置。

```yaml
display:
  tool_progress: "all"    # off | new | all | verbose
```

- `off` — 无进度消息
- `new` — 仅显示每轮对话的第一个工具调用
- `all` — 显示所有工具调用（在网关消息中截断为40个字符）
- `verbose` — 显示完整的工具调用详情（可能产生长消息）

#### `display.tool_progress_command`

**类型：** 布尔值 — **默认值：** `false`

启用后，会在网关中提供 `/verbose` 斜杠命令，允许你循环切换工具进度模式（`off → new → all → verbose → off`），而无需编辑 `config.yaml`。

```yaml
display:
  tool_progress_command: true
```

## 斜杠命令访问控制

默认情况下，每位允许的用户都可以运行所有斜杠命令。要将您的允许列表拆分为**管理员**（拥有完整的斜杠命令访问权限）和**普通用户**（仅限您明确启用的命令），请在 Discord 平台的 `extra` 块中添加 `allow_admin_from` 和 `user_allowed_commands`：

```yaml
gateway:
  platforms:
    discord:
      extra:
        # 现有用户允许列表（保持不变）
        allow_from:
          - "123456789012345678"  # 管理员用户 ID
          - "999888777666555444"  # 普通用户 ID

        # 新增 — 管理员可使用所有斜杠命令（内置 + 插件注册的）
        allow_admin_from:
          - "123456789012345678"

        # 新增 — 非管理员允许用户只能运行以下斜杠命令。
        # /help 和 /whoami 始终允许，以便用户查看其访问权限。
        user_allowed_commands:
          - status
          - model
          - history

        # 可选：为服务器频道设置单独的管理员/命令列表
        group_allow_admin_from:
          - "123456789012345678"
        group_user_allowed_commands:
          - status
```

**行为说明：**

- 对于某个作用域（私信或服务器频道），在 `allow_admin_from` 列表中的用户可以通过实时命令注册表运行**每一个**已注册的斜杠命令——无论是内置的还是插件注册的。
- 不在 `allow_admin_from` 列表中的用户只能运行 `user_allowed_commands` 中列出的命令，以及始终允许的基本命令：`/help` 和 `/whoami`。
- 普通聊天（非斜杠消息）不受影响。非管理员用户仍然可以正常与智能体对话；只是他们无法触发任意命令。
- **向后兼容：** 如果某个作用域未设置 `allow_admin_from`，则该作用域禁用斜杠命令门控。现有安装无需任何更改即可继续工作。
- 私信的管理员状态不表示服务器频道的管理员状态。每个作用域有其独立的管理员列表。

使用 `/whoami` 可查看当前活动作用域、您的层级（管理员/用户/无限制）以及您可以运行的斜杠命令。

## 交互式模型选择器

在 Discord 频道中发送不带参数的 `/model` 可打开基于下拉菜单的模型选择器：

1.  **提供商选择** — 一个显示可用提供商的下拉选择菜单（最多 25 个）。
2.  **模型选择** — 第二个下拉菜单，包含所选提供商的模型（最多 25 个）。

选择器会在 120 秒后超时。只有授权用户（在 `DISCORD_ALLOWED_USERS` 列表中的用户）才能与之交互。如果您知道模型名称，请直接输入 `/model <名称>`。

## 技能的原生斜杠命令

Hermes 会自动将已安装的技能注册为 **原生的 Discord 应用命令**。这意味着技能会出现在 Discord 的自动补全 `/` 菜单中，与内置命令并列。

- 每个技能都会成为一个 Discord 斜杠命令（例如 `/code-review`、`/ascii-art`）
- 技能接受一个可选的 `args` 字符串参数
- Discord 对每个机器人最多限制 100 个应用命令——如果你的技能数量超过可用槽位，多余的技能会被跳过，并在日志中显示警告
- 技能在机器人启动时与 `/model`、`/reset` 和 `/background` 等内置命令一起注册

无需额外配置——任何通过 `hermes skills install` 安装的技能都会在下次网关重启时自动注册为 Discord 斜杠命令。

### 禁用斜杠命令注册

如果你让多个 Hermes 网关连接到同一个 Discord 应用（例如预发布 + 生产环境），那么只有其中一个网关应该拥有全局斜杠命令的注册权——否则最后启动的网关会覆盖注册，导致注册来回切换。在“跟随者”网关上关闭斜杠注册：

```yaml
gateway:
  platforms:
    discord:
      extra:
        slash_commands: false   # 默认值: true
```

在“主”网关上保留此设置为 `true` 可以保持正常行为——为内置命令和已安装的技能提供全局 `/` 菜单命令。

## 发送媒体（`send_message` + `MEDIA:` 标签）

Discord 适配器支持为每种常见媒体类型通过 `send_message` 工具和智能体发出的内联 `MEDIA:/path/to/file` 标签进行原生文件上传：

| 类型 | 交付方式 |
|---|---|
| 图片 (PNG/JPG/WebP) | 原生 Discord 图片附件，带内联预览 |
| 动画 GIF | `send_animation` 以 `animation.gif` 形式上传，以便 Discord 在线播放（而非静态缩略图） |
| 视频 (MP4/MOV) | `send_video` — 原生视频播放器 |
| 音频 / 语音 | `send_voice` — 尽可能使用原生语音消息，否则作为文件附件 |
| 文档 (PDF/ZIP/docx 等) | `send_document` — 原生附件，带下载按钮 |

Discord 的单次上传大小限制取决于服务器的助力等级（免费 25 MB，最高可达 500 MB）。如果 Hermes 收到 HTTP 413 错误，适配器会回退到指向本地缓存路径的链接，而不是静默失败。

## 接收任意文件类型

默认情况下，机器人会缓存与内置允许列表匹配的上传文件——图片、音频、视频、PDF、文本/markdown/csv/log、JSON/XML/YAML/TOML、zip、docx/xlsx/pptx。其他任何文件（如 `.wav`、`.bin`、自定义扩展名的转储文件）都会记录为 `Unsupported document type` 并在智能体看到之前被丢弃。

要接受任意文件类型，请启用 `discord.allow_any_attachment`：

```yaml
discord:
  allow_any_attachment: true
  # 可选 — 提高/禁用单个文件大小上限。默认为 32 MiB。
  # 缓存期间整个文件会保存在内存中，因此无限制上传会带来实际的内存开销。
  max_attachment_bytes: 33554432   # 字节; 0 = 无限制
```

当此标志开启时，任何上传的文件都会被下载、缓存到 `~/.hermes/cache/documents/` 目录下，并作为 `DOCUMENT` 类型的消息事件（MIME 为 `application/octet-stream`）呈现给智能体。智能体会收到一个指向本地路径的上下文注释（通过 `to_agent_visible_cache_path` 为 Docker/Modal 沙盒终端自动转换路径），并可以使用 `terminal`（`ffprobe`、`unzip`、`file`、`strings` 等）或 `read_file` 检查文件。文件内容**不会**内联到提示中——只有路径——因此二进制上传不会导致上下文窗口膨胀。

已知文本格式已在允许列表中（`.txt`、`.md`、`.log`）的文件，其内容仍然会自动注入，最高 100 KiB；此行为在标志开启时保持不变。

等效的环境变量：`DISCORD_ALLOW_ANY_ATTACHMENT=true` 和 `DISCORD_MAX_ATTACHMENT_BYTES=33554432`（或 `0` 表示无上限）。

:::warning 无限制的内存成本
禁用大小上限 (`max_attachment_bytes: 0`) 意味着用户可以将一个多 GB 的文件拖给机器人，而网关会尽职地将其缓冲到内存中，同时缓存到磁盘。仅在受信任的单用户安装中设置此项。对于共享机器人，请保持默认的 32 MiB 或谨慎提高。
:::

## 交互式提示（澄清）

当智能体调用 `clarify` 工具——询问您偏好哪种方法、获取任务后反馈或在进行非微不足道的决策前检查时——Discord 会为每个选项呈现一个**按钮**：

> 我应该为仪表板使用哪个框架？
>
> [1. Next.js] [2. Remix] [3. Astro] [其他（输入答案）]

点击编号按钮回答，或点击**其他**输入自由格式的回复（您在该频道发送的下一条消息将成为答案）。开放式的 `clarify` 调用（无预设选项）会跳过按钮，直接捕获您的下一条消息。

按钮在做出选择后会自行禁用，这样重复点击不会导致提示重复解析。通过 `~/.hermes/config.yaml` 中的 `agent.clarify_timeout` 配置响应超时（默认 `600` 秒）。如果您未在超时时间内响应，智能体会使用一个哨兵消息解除阻塞并进行适应，而不是挂起。

## 主频道

您可以指定一个“主频道”，机器人会在其中发送主动消息（如定时任务输出、提醒和通知）。有两种设置方式：

### 使用斜杠命令

在机器人所在的任何 Discord 频道中输入 `/sethome`。该频道即成为主频道。

### 手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
DISCORD_HOME_CHANNEL=123456789012345678
DISCORD_HOME_CHANNEL_NAME="#bot-updates"
```

将 ID 替换为实际的频道 ID（在开发者模式下右键单击 → 复制频道 ID）。

## 语音消息

Hermes 智能体支持 Discord 语音消息：

- **传入语音消息**会自动使用配置的 STT 提供商进行转录：本地的 `faster-whisper`（无需密钥）、Groq Whisper（`GROQ_API_KEY`）或 OpenAI Whisper（`VOICE_TOOLS_OPENAI_KEY`）。
- **文本转语音**：使用 `/voice tts` 让机器人在文本回复的同时发送语音音频回复。
- **Discord 语音频道**：Hermes 还可以加入语音频道，监听用户说话，并在频道中回复。

完整的设置和操作指南，请参见：
- [语音模式](/user-guide/features/voice-mode)
- [在 Hermes 中使用语音模式](/guides/use-voice-mode-with-hermes)

## 论坛频道

Discord 论坛频道（类型 15）不接受直接消息——论坛中的每个帖子都必须是线程。Hermes 会自动检测论坛频道，并在需要向该处发送消息时创建一个新的线程帖子，因此 `send_message`、TTS、图片、语音消息和文件附件无需智能体进行特殊处理即可正常工作。

- **线程名称**取自消息的第一行（去除 markdown 标题前缀，最多 100 个字符）。当消息仅包含附件时，文件名将用作备用线程名称。
- **附件**会附在新线程的起始消息上——无需单独上传步骤，不会发生部分发送。
- **一次调用，一个线程**：每次论坛发送都会创建一个新线程。因此，连续向同一论坛发送消息会产生独立的线程。
- **检测分三层**：首先是频道目录缓存，其次是进程本地的探测缓存，最后是实时的 `GET /channels/{id}` 探测作为后备（其结果在进程生命周期内会被记忆）。

刷新目录（在暴露此功能的平台上执行 `/channels refresh`，或重启网关）会用机器人启动后创建的任何论坛频道填充缓存。

## 故障排除

### 智能体在线但不回复消息

**原因**：消息内容意图已被禁用。

**修复**：前往 [开发者门户](https://discord.com/developers/applications) → 你的应用 → 智能体 → 特权网关意图 → 启用 **消息内容意图** → 保存更改。重启网关。

### 启动时出现“被禁止的意图”错误

**原因**：你的代码请求了开发者门户中未启用的意图。

**修复**：在智能体设置中启用全部三个特权网关意图（在线状态、服务器成员、消息内容），然后重启。

### 智能体无法在特定频道看到消息

**原因**：智能体的角色没有查看该频道的权限。

**修复**：在 Discord 中，前往该频道的设置 → 权限 → 添加智能体的角色，并启用 **查看频道** 和 **读取消息历史**。

### 403 禁止访问错误

**原因**：智能体缺少必要的权限。

**修复**：使用步骤 5 中的 URL 重新邀请智能体并赋予正确权限，或在服务器设置 → 角色中手动调整智能体的角色权限。

### 智能体离线

**原因**：Hermes 网关未运行，或令牌不正确。

**修复**：检查 `hermes gateway` 是否正在运行。验证你的 `.env` 文件中的 `DISCORD_BOT_TOKEN`。如果你最近重置了令牌，请更新它。

### “用户不允许” / 智能体忽略你

**原因**：你的用户 ID 不在 `DISCORD_ALLOWED_USERS` 列表中。

**修复**：将你的用户 ID 添加到 `~/.hermes/.env` 中的 `DISCORD_ALLOWED_USERS`，然后重启网关。

### 同一频道中的人意外地共享上下文

**原因**：`group_sessions_per_user` 被禁用，或者平台无法为该上下文中的消息提供用户 ID。

**修复**：在 `~/.hermes/config.yaml` 中进行如下设置，然后重启网关：

```yaml
group_sessions_per_user: true
```

如果你有意想要一个共享的房间对话，请保持关闭状态——但要做好共享记录历史和共享中断行为的准备。

## 安全

:::warning
务必设置 `DISCORD_ALLOWED_USERS`（或 `DISCORD_ALLOWED_ROLES`）以限制谁能与智能体互动。若两者都未设置，网关默认会拒绝所有用户，这是安全措施。只授权你信任的人员——授权用户拥有对智能体能力的完全访问权限，包括工具使用和系统访问。
:::

### 基于角色的访问控制

对于通过角色而非单独用户列表来管理访问权限的服务器（审核团队、支持人员、内部工具），请使用 `DISCORD_ALLOWED_ROLES`——这是一个以逗号分隔的角色 ID 列表。任何拥有其中任一角色的成员都被授权。

```bash
# ~/.hermes/.env — 可与 DISCORD_ALLOWED_USERS 同时使用，或替代它
DISCORD_ALLOWED_ROLES=987654321098765432,876543210987654321
```

语义说明：

- **与用户允许列表是“或”的关系。** 如果用户的 ID 在 `DISCORD_ALLOWED_USERS` 中 **或** 他们拥有 `DISCORD_ALLOWED_ROLES` 中的任何角色，则该用户被授权。
- **服务器成员意图自动启用。** 当设置了 `DISCORD_ALLOWED_ROLES` 时，智能体在连接时会启用成员意图——这是 Discord 在成员记录中发送角色信息所必需的。
- **使用角色 ID，而非名称。** 从 Discord 获取：**用户设置 → 高级 → 开发者模式开启**，然后右键点击任何角色 → **复制角色 ID**。
- **私信回退。** 在私信中，角色检查会扫描共同的服务器；如果用户在任何共享服务器中拥有允许的角色，在私信中也会被授权。

当审核团队人员变动时，这是首选模式——新审核员一旦被授予角色，即可获得访问权限，无需编辑 `.env` 文件或重启网关。

### 提及控制

默认情况下，Hermes 会阻止智能体提及 `@everyone`、`@here` 和角色提及，即使其回复中包含这些令牌。这可以防止措辞不当的提示或回显的用户内容对整个服务器造成垃圾信息。单个 `@user` 提及和回复引用提及（小小的“正在回复...”标签）保持启用，以便正常对话仍然有效。

你可以通过环境变量或 `config.yaml` 来放宽这些默认设置：

```yaml
# ~/.hermes/config.yaml
discord:
  allow_mentions:
    everyone: false      # 允许智能体提及 @everyone / @here
    roles: false         # 允许智能体提及 @角色
    users: true          # 允许智能体提及单个 @用户
    replied_user: true   # 回复消息时提及作者
```

```bash
# ~/.hermes/.env — 环境变量优先于 config.yaml
DISCORD_ALLOW_MENTION_EVERYONE=false
DISCORD_ALLOW_MENTION_ROLES=false
DISCORD_ALLOW_MENTION_USERS=true
DISCORD_ALLOW_MENTION_REPLIED_USER=true
```

:::tip
除非你确切知道需要它们的原因，否则请将 `everyone` 和 `roles` 保持为 `false`。大型语言模型很容易在看似正常的回复中产生 `@everyone` 字符串；没有此保护，那将通知你服务器中的每个成员。
:::

有关保护你的 Hermes 智能体部署的更多信息，请参阅[安全指南](../security.md)。