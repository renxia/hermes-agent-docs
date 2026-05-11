---
sidebar_position: 3
title: "Discord"
description: "设置 Hermes 智能体作为 Discord 机器人"
---

# Discord 设置

Hermes 智能体以机器人的形式与 Discord 集成，允许您通过私信或服务器频道与您的 AI 助手聊天。机器人接收您的消息，通过 Hermes 智能体流程（包括工具使用、记忆和推理）进行处理，并实时做出回应。它支持文本、语音消息、文件附件和斜杠命令。

在设置之前，这里有一段大多数人想知道的内容：Hermes 进入您的服务器后会如何表现。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| **私信** | Hermes 会回复每条消息。无需 `@提及`。每个私信都有独立的会话。 |
| **服务器频道** | 默认情况下，Hermes 只有在您 `@提及` 它时才会回复。如果您在频道中发消息但未提及它，Hermes 会忽略该消息。 |
| **自由回复频道** | 您可以通过 `DISCORD_FREE_RESPONSE_CHANNELS` 让特定频道无需提及，或通过 `DISCORD_REQUIRE_MENTION=false` 全局禁用提及要求。这些频道中的消息会直接回复——不会自动创建线程，以保持频道的轻量级聊天属性。 |
| **线程** | Hermes 在同一个线程中回复。提及规则仍然适用，除非该线程或其父频道被配置为自由回复。线程会话历史与父频道隔离。 |
| **多用户共享频道** | 默认情况下，出于安全和清晰度考虑，Hermes 会在频道内为每个用户隔离会话历史。即使两个人在同一个频道对话，默认情况下他们也不会共享同一份对话记录，除非您明确禁用该功能。 |
| **消息中提及其他用户** | 当 `DISCORD_IGNORE_NO_MENTION` 为 `true`（默认值）时，如果消息中 @提及其他用户但**未提及**机器人，Hermes 会保持沉默。这可以防止机器人插入到指向其他人的对话中。如果您希望机器人响应所有消息而不考虑提及谁，请将其设置为 `false`。这仅适用于服务器频道，不适用于私信。 |

:::tip
如果您希望设置一个普通的机器人帮助频道，让人们可以与 Hermes 交流而无需每次都标记它，请将该频道添加到 `DISCORD_FREE_RESPONSE_CHANNELS` 中。
:::

### Discord 网关模型

Discord 上的 Hermes 不是一个无状态回复的 webhook。它通过完整的消息网关运行，这意味着每条传入消息都会经过：

1.  授权 (`DISCORD_ALLOWED_USERS`)
2.  提及/自由回复检查
3.  会话查找
4.  会话记录加载
5.  普通的 Hermes 智能体执行，包括工具、记忆和斜杠命令
6.  将响应发送回 Discord

这很重要，因为在繁忙服务器中的行为取决于 Discord 的路由和 Hermes 的会话策略。

### Discord 中的会话模型

默认情况下：

- 每个私信都有自己的会话
- 每个服务器线程都有自己的会话命名空间
- 共享频道中的每个用户在该频道内都有自己的会话

因此，如果 Alice 和 Bob 都在 `#research` 频道与 Hermes 对话，Hermes 默认会将它们视为独立的对话，即使他们使用的是同一个可见的 Discord 频道。

这由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

只有当您明确希望整个房间共享一个对话时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话对于协作房间很有用，但它们也意味着：

- 用户共享上下文增长和 token 成本
- 一个人的长时间、工具密集型任务可能会使其他所有人的上下文膨胀
- 一个人正在进行的运行可能会在同一房间内中断另一个人的后续对话

### 中断与并发

Hermes 通过会话密钥跟踪正在运行的智能体。

在默认的 `group_sessions_per_user: true` 设置下：

- Alice 中断她自己正在进行的请求只会影响该频道中 Alice 的会话
- Bob 可以在同一个频道继续对话，而不会继承 Alice 的历史记录或中断 Alice 的运行

在 `group_sessions_per_user: false` 设置下：

- 整个房间为该频道/线程共享一个运行中的智能体槽位
- 来自不同人的后续消息可能会相互中断或排队等待

本指南将引导您完成整个设置过程——从在 Discord 开发者门户创建您的机器人到发送您的第一条消息。

## 步骤 1: 创建 Discord 应用

1.  访问 [Discord 开发者门户](https://discord.com/developers/applications)，使用您的 Discord 账户登录。
2.  点击右上角的 **New Application**。
3.  为您的应用输入一个名称（例如，“Hermes Agent”），并接受开发者服务条款。
4.  点击 **Create**。

您将进入 **General Information** 页面。记下 **Application ID** — 稍后构建邀请链接时需要用到它。

## 步骤 2: 创建机器人

1.  在左侧边栏，点击 **Bot**。
2.  Discord 会自动为您的应用创建一个机器人用户。您将看到机器人的用户名，可以自定义。
3.  在 **Authorization Flow** 下：
    *   将 **Public Bot** 设置为 **ON** — 要使用 Discord 提供的邀请链接（推荐）需要此项。这允许“安装”标签页生成默认授权 URL。
    *   保持 **Require OAuth2 Code Grant** 设置为 **OFF**。

:::tip
您可以在此页面为您的机器人设置自定义头像和横幅。这是用户将在 Discord 中看到的形象。
:::

:::info[私有机器人替代方案]
如果您希望保持机器人私有（Public Bot = OFF），则**必须**在步骤 5 中使用 **Manual URL** 方法，而不是使用“安装”标签页。Discord 提供的链接需要启用 Public Bot。
:::

## 步骤 3: 启用特权网关意图

这是整个设置过程中最关键的一步。如果未启用正确的意图，您的机器人将能够连接到 Discord，但**将无法读取消息内容**。

在 **Bot** 页面，向下滚动到 **Privileged Gateway Intents**。您会看到三个开关：

| 意图 | 用途 | 必需吗？ |
|--------|---------|-----------| 
| **Presence Intent** | 查看用户在线/离线状态 | 可选 |
| **Server Members Intent** | 访问成员列表，解析用户名 | **必需** |
| **Message Content Intent** | 读取消息的文本内容 | **必需** |

**启用 Server Members Intent 和 Message Content Intent**，将它们切换为 **ON**。

*   如果没有 **Message Content Intent**，您的机器人会收到消息事件，但消息文本是空的 — 机器人根本看不到您输入的内容。
*   如果没有 **Server Members Intent**，机器人无法为允许的用户列表解析用户名，可能无法识别谁在向它发送消息。

:::warning[这是 Discord 机器人不工作的头号原因]
如果您的机器人在线但从不回复消息，**Message Content Intent** 几乎肯定被禁用了。请返回[开发者门户](https://discord.com/developers/applications)，选择您的应用 → Bot → Privileged Gateway Intents，确保 **Message Content Intent** 已切换为 ON。点击 **Save Changes**。
:::

**关于服务器数量：**
*   如果您的机器人**加入的服务器少于 100 个**，您可以自由地开关意图。
*   如果您的机器人**加入了 100 个或更多服务器**，Discord 要求您提交验证申请才能使用特权意图。对于个人使用，这通常不是问题。

点击页面底部的 **Save Changes**。

## 步骤 4: 获取机器人令牌

机器人令牌是 Hermes Agent 用来以您的机器人身份登录的凭证。仍然在 **Bot** 页面：

1.  在 **Token** 部分，点击 **Reset Token**。
2.  如果您的 Discord 账户启用了两步验证，请输入您的 2FA 代码。
3.  Discord 将显示您的新令牌。**立即复制它。**

:::warning[令牌仅显示一次]
令牌只显示一次。如果丢失，您需要重置并生成一个新的。切勿公开分享您的令牌或将其提交到 Git — 任何拥有此令牌的人都可以完全控制您的机器人。
:::

将令牌存储在安全的地方（例如密码管理器）。您将在步骤 8 中需要它。

## 步骤 5: 生成邀请链接

您需要一个 OAuth2 链接来邀请机器人加入您的服务器。有两种方法：

### 选项 A: 使用安装标签页（推荐）

:::note[需要 Public Bot]
此方法要求步骤 2 中的 **Public Bot** 设置为 **ON**。如果您将 Public Bot 设为 OFF，请改用下面的手动 URL 方法。
:::

1.  在左侧边栏，点击 **Installation**。
2.  在 **Installation Contexts** 下，启用 **Guild Install**。
3.  对于 **Install Link**，选择 **Discord Provided Link**。
4.  在 **Default Install Settings** 的 **Guild Install** 下：
    *   **Scopes**: 选择 `bot` 和 `applications.commands`
    *   **Permissions**: 选择下面列出的权限。

### 选项 B: 手动 URL

您可以直接使用以下格式构建邀请 URL：

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=274878286912
```

将 `YOUR_APP_ID` 替换为步骤 1 中的 Application ID。

### 所需权限

这些是您的机器人需要的最低权限：

*   **View Channels** — 查看它有权访问的频道
*   **Send Messages** — 回复您的消息
*   **Embed Links** — 格式化富文本回复
*   **Attach Files** — 发送图片、音频和文件输出
*   **Read Message History** — 维护对话上下文

### 推荐的附加权限

*   **Send Messages in Threads** — 在话题中回复
*   **Add Reactions** — 对消息做出反应以表示确认

### 权限整数值

| 级别 | 权限整数 | 包含内容 |
|-------|-------------------|-----------------|
| 最小 | `117760` | View Channels, Send Messages, Read Message History, Attach Files |
| 推荐 | `274878286912` | 以上所有权限加上 Embed Links, Send Messages in Threads, Add Reactions |

## 步骤 6: 邀请到您的服务器

1.  在浏览器中打开邀请链接（来自安装标签页或您构建的手动 URL）。
2.  在 **Add to Server** 下拉菜单中，选择您的服务器。
3.  点击 **Continue**，然后点击 **Authorize**。
4.  如果提示，完成验证码。

:::info
您需要在 Discord 服务器上拥有 **Manage Server** 权限才能邀请机器人。如果您在下拉菜单中没有看到您的服务器，请让服务器管理员使用邀请链接。
:::

授权后，机器人将出现在您服务器的成员列表中（在您启动 Hermes 网关之前，它会显示为离线状态）。

## 步骤 7：查找您的 Discord 用户 ID

Hermes 智能体使用您的 Discord 用户 ID 来控制哪些人可以与机器人交互。查找方法如下：

1. 打开 Discord（桌面或网页应用）。
2. 前往 **设置** → **高级设置** → 将 **开发者模式** 开关切换为 **开**。
3. 关闭设置。
4. 右键单击您自己的用户名（在消息中、成员列表中或您的个人资料中）→ **复制用户 ID**。

您的用户 ID 是一串类似 `284102345871466496` 的长数字。

:::tip
开发者模式还允许您以同样的方式复制 **频道 ID** 和 **服务器 ID** —— 右键单击频道或服务器名称，然后选择“复制 ID”。如果您想手动设置主频道，将需要一个频道 ID。
:::

## 步骤 8：配置 Hermes 智能体

### 选项 A：交互式设置（推荐）

运行引导设置命令：

```bash
hermes gateway setup
```

当提示时选择 **Discord**，然后在要求时粘贴您的机器人令牌和用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# 必需
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_ALLOWED_USERS=284102345871466496

# 允许的多个用户（用逗号分隔）
# DISCORD_ALLOWED_USERS=284102345871466496,198765432109876543
```

然后启动网关：

```bash
hermes gateway
```

机器人应该会在几秒钟内上线。给它发送一条消息——无论是私信还是在它能看到的频道中——以进行测试。

:::tip
您可以在后台或作为 systemd 服务运行 `hermes gateway` 以实现持久化操作。详见部署文档。
:::

## 配置参考

Discord 行为通过两个文件进行控制：**`~/.hermes/.env`** 用于凭证和环境级开关，**`~/.hermes/config.yaml`** 用于结构化设置。当两者同时设置时，环境变量始终优先于 config.yaml 的值。

### 环境变量 (`.env`)

| 变量 | 是否必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `DISCORD_BOT_TOKEN` | **是** | — | 来自 [Discord 开发者门户](https://discord.com/developers/applications) 的机器人令牌。 |
| `DISCORD_ALLOWED_USERS` | **是** | — | 逗号分隔的允许与机器人交互的 Discord 用户 ID。如果未设置此变量**或** `DISCORD_ALLOWED_ROLES`，网关将拒绝所有用户。 |
| `DISCORD_ALLOWED_ROLES` | 否 | — | 逗号分隔的 Discord 角色 ID。拥有其中一个角色的任何成员都将被授权——与 `DISCORD_ALLOWED_USERS` 构成或逻辑语义。连接时自动启用 **服务器成员意图**。当版主团队人员变动时很有用：新授予角色后，新管理员即刻获得访问权限，无需推送配置。 |
| `DISCORD_HOME_CHANNEL` | 否 | — | 机器人发送主动消息（定时任务输出、提醒、通知）的频道 ID。 |
| `DISCORD_HOME_CHANNEL_NAME` | 否 | `"Home"` | 在日志和状态输出中主频道的显示名称。 |
| `DISCORD_COMMAND_SYNC_POLICY` | 否 | `"safe"` | 控制原生斜杠命令的启动同步。`"safe"` 会对比现有全局命令并只更新发生变化的部分，当 Discord 元数据无法通过修补应用时，会重新创建命令。`"bulk"` 保留旧的 `tree.sync()` 行为。`"off"` 完全跳过启动同步。 |
| `DISCORD_REQUIRE_MENTION` | 否 | `true` | 为 `true` 时，机器人仅在服务器频道中被 `@提及` 时才回复。设为 `false` 可回复每个频道中的所有消息。 |
| `DISCORD_FREE_RESPONSE_CHANNELS` | 否 | — | 逗号分隔的频道 ID 列表。在这些频道中，即使 `DISCORD_REQUIRE_MENTION` 为 `true`，机器人也无需 `@提及` 即可回复。 |
| `DISCORD_IGNORE_NO_MENTION` | 否 | `true` | 为 `true` 时，如果消息 `@提及` 了其他用户但**未**提及机器人，机器人将保持静默。这可防止机器人介入指向其他人的对话。仅适用于服务器频道，不适用于私信。 |
| `DISCORD_AUTO_THREAD` | 否 | `true` | 为 `true` 时，会在文本频道中为每个 `@提及` 自动创建一个新线程，使每个对话彼此隔离（类似 Slack 行为）。已在线程或私信中的消息不受影响。 |
| `DISCORD_ALLOW_BOTS` | 否 | `"none"` | 控制机器人如何处理来自其他 Discord 机器人的消息。`"none"` — 忽略所有其他机器人。`"mentions"` — 仅接受 `@提及` 了 Hermes 的机器人消息。`"all"` — 接受所有机器人消息。 |
| `DISCORD_REACTIONS` | 否 | `true` | 为 `true` 时，机器人会在处理过程中向消息添加表情符号回应（开始处理时添加 👀，成功时添加 ✅，出错时添加 ❌）。设为 `false` 可完全禁用回应。 |
| `DISCORD_IGNORED_CHANNELS` | 否 | — | 逗号分隔的频道 ID 列表。机器人**从不**回复这些频道中的消息，即使被 `@提及`。此设置优先级高于所有其他频道设置。 |
| `DISCORD_ALLOWED_CHANNELS` | 否 | — | 逗号分隔的频道 ID 列表。设置后，机器人**仅**在这些频道（以及允许的私信）中回复。覆盖 `config.yaml` 中的 `discord.allowed_channels`。可与 `DISCORD_IGNORED_CHANNELS` 结合使用以表达允许/拒绝规则。 |
| `DISCORD_NO_THREAD_CHANNELS` | 否 | — | 逗号分隔的频道 ID 列表。机器人在这些频道中直接回复，而不是创建线程。仅当 `DISCORD_AUTO_THREAD` 为 `true` 时相关。 |
| `DISCORD_REPLY_TO_MODE` | 否 | `"first"` | 控制回复引用行为：`"off"` — 从不回复原始消息；`"first"` — 仅在第一个消息块上进行回复引用（默认）；`"all"` — 在每个块上都进行回复引用。 |
| `DISCORD_ALLOW_MENTION_EVERYONE` | 否 | `false` | 为 `false`（默认）时，即使其响应包含这些令牌，机器人也无法 `@everyone` 或 `@here`。设为 `true` 可重新启用。参见下方的[提及控制](#mention-control)。 |
| `DISCORD_ALLOW_MENTION_ROLES` | 否 | `false` | 为 `false`（默认）时，机器人无法 `@角色` 提及。设为 `true` 以允许。 |
| `DISCORD_ALLOW_MENTION_USERS` | 否 | `true` | 为 `true`（默认）时，机器人可以通过 ID 提及单个用户。 |
| `DISCORD_ALLOW_MENTION_REPLIED_USER` | 否 | `true` | 为 `true`（默认）时，回复消息会通知原作者。 |
| `DISCORD_PROXY` | 否 | — | 用于 Discord 连接（HTTP、WebSocket、REST）的代理 URL。覆盖 `HTTPS_PROXY`/`ALL_PROXY`。支持 `http://`、`https://` 和 `socks5://` 协议。 |
| `HERMES_DISCORD_TEXT_BATCH_DELAY_SECONDS` | 否 | `0.6` | 适配器在刷新排队的文本块之前等待的宽限期（秒）。有助于平滑流式输出。 |
| `HERMES_DISCORD_TEXT_BATCH_SPLIT_DELAY_SECONDS` | 否 | `2.0` | 当单条消息超过 Discord 长度限制时，拆分块之间的延迟（秒）。 |

### 配置文件 (`config.yaml`)

`~/.hermes/config.yaml` 中的 `discord` 部分映射了上述环境变量。config.yaml 设置作为默认值应用——如果等效的环境变量已设置，则环境变量胜出。

```yaml
# Discord 特定设置
discord:
  require_mention: true           # 在服务器频道中需要 @提及
  free_response_channels: ""      # 逗号分隔的频道 ID（或 YAML 列表）
  auto_thread: true               # 收到 @提及时自动创建线程
  reactions: true                 # 处理过程中添加表情符号回应
  ignored_channels: []            # 机器人从不回复的频道 ID
  no_thread_channels: []          # 机器人直接回复而不创建线程的频道 ID
  channel_prompts: {}             # 每个频道的临时系统提示
  allow_mentions:                 # 允许机器人提及的内容（安全默认值）
    everyone: false               # @everyone / @here 提及（默认：false）
    roles: false                  # @role 提及（默认：false）
    users: true                   # @user 提及（默认：true）
    replied_user: true            # 回复引用会通知作者（默认：true）

# 会话隔离（适用于所有网关平台，不仅仅是 Discord）
group_sessions_per_user: true     # 在共享频道中按用户隔离会话
```

#### `discord.require_mention`

**类型：** 布尔值 — **默认值：** `true`

启用时，机器人仅在服务器频道中被直接 `@提及` 时才回复。无论此设置如何，私信总会得到回复。

#### `discord.free_response_channels`

**类型：** 字符串或列表 — **默认值：** `""`

机器人回复所有消息而无需 `@提及` 的频道 ID。接受逗号分隔的字符串或 YAML 列表：

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

如果某个线程的父频道在此列表中，该线程也变为无需提及。

自由响应频道还会**跳过自动线程创建** — 机器人会内联回复，而不是为每条消息启动新线程。这使该频道可用作轻量级聊天界面。如果您想要线程行为，请不要将该频道列为自由响应（改用正常的 `@提及` 流程）。

#### `discord.auto_thread`

**类型：** 布尔值 — **默认值：** `true`

启用时，常规文本频道中的每个 `@提及` 都会自动为对话创建一个新线程。这使主频道保持整洁，并为每个对话提供独立的会话历史。一旦创建了线程，该线程中的后续消息不需要 `@提及` — 机器人知道它已经在参与其中。

在线程或私信中发送的消息不受此设置影响。`discord.free_response_channels` 或 `discord.no_thread_channels` 中列出的频道也会绕过自动线程创建，并获得内联回复。

#### `discord.reactions`

**类型：** 布尔值 — **默认值：** `true`

控制机器人是否在消息中添加表情符号回应作为视觉反馈：
- 👀 当机器人开始处理您的消息时添加
- ✅ 当响应成功传递时添加
- ❌ 如果处理过程中发生错误时添加

如果您觉得回应分散注意力，或者机器人的角色没有**添加回应**权限，请禁用此功能。

#### `discord.ignored_channels`

**类型：** 字符串或列表 — **默认值：** `[]`

机器人**从不**回复的频道 ID，即使被直接 `@提及`。此设置具有最高优先级 — 如果频道在此列表中，机器人会静默忽略其中的所有消息，无论 `require_mention`、`free_response_channels` 或任何其他设置如何。

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

如果某个线程的父频道在此列表中，该线程中的消息也会被忽略。

#### `discord.no_thread_channels`

**类型：** 字符串或列表 — **默认值：** `[]`

机器人直接在频道中回复，而不是自动创建线程的频道 ID。这仅在 `auto_thread` 为 `true`（默认值）时有效。在这些频道中，机器人像普通消息一样内联回复，而不是生成新线程。

```yaml
discord:
  no_thread_channels:
    - 1234567890  # 机器人在此内联回复
```

适用于专门用于机器人交互的频道，在这些频道中线程会带来不必要的干扰。

#### `discord.channel_prompts`

**类型：** 映射 — **默认值：** `{}`

每个频道的临时系统提示，会在匹配的 Discord 频道或线程的每一轮对话中注入，但不会持久化到对话历史中。

```yaml
discord:
  channel_prompts:
    "1234567890": |
      此频道用于研究任务。倾向于进行深度比较、
      引用，并提供简洁的综合分析。
    "9876543210": |
      此论坛用于治疗式支持。请保持温暖、踏实、
      且不带评判。
```

行为：
- 精确的线程/频道 ID 匹配优先。
- 如果消息到达线程或论坛帖子内部，且该线程没有明确条目，Hermes 会回退到父频道/论坛 ID。
- 提示在运行时临时应用，因此更改它们会立即影响后续轮次，无需重写过去的会话历史。

#### `group_sessions_per_user`

**类型：** 布尔值 — **默认值：** `true`

这是一个全局网关设置（非 Discord 专属），控制同一频道中的用户是否获得隔离的会话历史。

为 `true` 时：Alice 和 Bob 在 `#research` 频道中与 Hermes 的对话是各自分开的。为 `false` 时：整个频道共享一个对话记录和一个运行智能体插槽。

```yaml
group_sessions_per_user: true
```

有关每种模式的完整影响，请参阅上文的[会话模型](#session-model-in-discord)部分。

#### `display.tool_progress`

**类型：** 字符串 — **默认值：** `"all"` — **值：** `off`、`new`、`all`、`verbose`

控制机器人是否在聊天中发送处理进度消息（例如，“正在读取文件...”、“正在运行终端命令...”）。这是一个适用于所有平台的全局网关设置。

```yaml
display:
  tool_progress: "all"    # off | new | all | verbose
```

- `off` — 无进度消息
- `new` — 每轮只显示第一个工具调用
- `all` — 显示所有工具调用（在网关消息中截断为 40 个字符）
- `verbose` — 显示完整的工具调用详细信息（可能产生长消息）

#### `display.tool_progress_command`

**类型：** 布尔值 — **默认值：** `false`

启用时，会在网关中提供 `/verbose` 斜杠命令，让您无需编辑 config.yaml 即可循环切换工具进度模式 (`off → new → all → verbose → off`)。

```yaml
display:
  tool_progress_command: true
```

## 斜杠命令访问控制

默认情况下，每位允许的用户都可以运行所有斜杠命令。要将允许列表拆分为**管理员**（拥有完整的斜杠命令访问权限）和**普通用户**（仅可使用您显式启用的命令），请在 Discord 平台的 `extra` 块中添加 `allow_admin_from` 和 `user_allowed_commands`：

```yaml
gateway:
  platforms:
    discord:
      extra:
        # 现有用户允许列表（保持不变）
        allow_from:
          - "123456789012345678"  # 管理员用户 ID
          - "999888777666555444"  # 普通用户 ID

        # 新增 — 管理员可访问所有斜杠命令（内置 + 插件注册）
        allow_admin_from:
          - "123456789012345678"

        # 新增 — 非管理员允许的用户只能运行以下斜杠命令。
        # /help 和 /whoami 始终允许，以便用户查看其访问权限。
        user_allowed_commands:
          - status
          - model
          - history

        # 可选：服务器频道单独的管理员/命令列表
        group_allow_admin_from:
          - "123456789012345678"
        group_user_allowed_commands:
          - status
```

**行为说明：**

- 对于某个作用域（DM 或服务器频道），位于 `allow_admin_from` 列表中的用户可以通过实时命令注册表运行**所有**已注册的斜杠命令——包括内置命令和插件注册的命令。
- 不在 `allow_admin_from` 列表中的用户只能运行 `user_allowed_commands` 中列出的命令，以及始终允许的基础命令：`/help` 和 `/whoami`。
- 普通聊天（非斜杠消息）不受影响。非管理员用户仍可正常与智能体交谈；他们只是无法触发任意命令。
- **向后兼容：** 如果某个作用域未设置 `allow_admin_from`，则该作用域的斜杠命令访问控制将被禁用。现有安装无需任何更改即可继续正常运行。
- DM 管理员状态并不意味着服务器频道管理员状态。每个作用域都有其独立的管理员列表。

使用 `/whoami` 可以查看当前作用域、您的权限级别（管理员/用户/无限制）以及您可以运行的斜杠命令。

## 交互式模型选择器

在 Discord 频道中发送不带参数的 `/model` 可以打开一个基于下拉菜单的模型选择器：

1.  **提供商选择** — 一个下拉选择菜单，显示可用的提供商（最多 25 个）。
2.  **模型选择** — 一个二级下拉菜单，包含所选提供商对应的模型（最多 25 个）。

选择器在 120 秒后超时。只有授权用户（位于 `DISCORD_ALLOWED_USERS` 列表中的用户）才能与其交互。如果您知道模型名称，可以直接输入 `/model <名称>`。

## 技能的原生斜杠命令

Hermes 会自动将已安装的技能注册为**原生 Discord 应用命令**。这意味着技能会出现在 Discord 的自动补全 `/` 菜单中，与内置命令并列。

- 每个技能都会成为一个 Discord 斜杠命令（例如 `/code-review`、`/ascii-art`）
- 技能接受一个可选的 `args` 字符串参数
- Discord 对每个机器人限制最多 100 个应用命令 — 如果你拥有的技能超过可用槽位，多余的技能将被跳过，并在日志中显示警告
- 技能在机器人启动时与 `/model`、`/reset` 和 `/background` 等内置命令一起注册

无需额外配置 — 通过 `hermes skills install` 安装的任何技能都会在下次网关重启时自动注册为 Discord 斜杠命令。

### 禁用斜杠命令注册

如果你针对同一个 Discord 应用运行多个 Hermes 网关（例如预发布 + 生产环境），则只有一个网关应拥有全局斜杠命令注册权 — 否则最后启动的网关会覆盖注册，导致注册状态反复切换。在“从属”网关上关闭斜杠注册：

```yaml
gateway:
  platforms:
    discord:
      extra:
        slash_commands: false   # 默认：true
```

在“主”网关上保持此值为 `true` 可维持正常行为 — 内置命令和已安装技能的全局 `/` 菜单命令。

## 发送媒体（`send_message` + `MEDIA:` 标签）

Discord 适配器通过 `send_message` 工具和智能体发出的内联 `MEDIA:/path/to/file` 标签，支持对所有常见媒体类型进行原生文件上传：

| 类型 | 传递方式 |
|---|---|
| 图片 (PNG/JPG/WebP) | 原生 Discord 图片附件，带内联预览 |
| 动图 GIF | `send_animation` 以 `animation.gif` 上传，使 Discord 内联播放（而非作为静态缩略图） |
| 视频 (MP4/MOV) | `send_video` — 原生视频播放器 |
| 音频 / 语音 | `send_voice` — 尽可能使用原生语音消息，否则作为文件附件 |
| 文档 (PDF/ZIP/docx 等) | `send_document` — 原生附件，带下载按钮 |

Discord 的单次上传大小限制取决于服务器的助力等级（免费 25 MB，最高 500 MB）。如果 Hermes 收到 HTTP 413 错误，适配器会回退到指向本地缓存路径的链接，而不是静默失败。

## 主频道

你可以指定一个“主频道”，机器人会在此频道发送主动消息（例如定时任务输出、提醒和通知）。有两种设置方式：

### 使用斜杠命令

在机器人所在的任何 Discord 频道中输入 `/sethome`。该频道即成为主频道。

### 手动配置

将以下内容添加到你的 `~/.hermes/.env` 文件中：

```bash
DISCORD_HOME_CHANNEL=123456789012345678
DISCORD_HOME_CHANNEL_NAME="#bot-updates"
```

将 ID 替换为实际的频道 ID（在开发者模式下右键单击 → 复制频道 ID）。

## 语音消息

Hermes 智能体支持 Discord 语音消息：

- **传入的语音消息**会自动转录，使用配置的 STT 提供商：本地 `faster-whisper`（无需密钥）、Groq Whisper（`GROQ_API_KEY`）或 OpenAI Whisper（`VOICE_TOOLS_OPENAI_KEY`）。
- **文本转语音**：使用 `/voice tts` 让机器人在文本回复旁发送语音音频响应。
- **Discord 语音频道**：Hermes 还可以加入语音频道，监听用户说话，并在频道中回话。

有关完整设置和操作指南，请参阅：
- [语音模式](/docs/user-guide/features/voice-mode)
- [在 Hermes 中使用语音模式](/docs/guides/use-voice-mode-with-hermes)

## 论坛频道

Discord 论坛频道（类型 15）不接受直接消息 — 论坛中的每个帖子都必须是一个线程。Hermes 会自动检测论坛频道，并在需要向论坛发送消息时自动创建新的线程帖子，因此 `send_message`、TTS、图片、语音消息和文件附件无需智能体进行特殊处理即可正常工作。

- **线程名称**源自消息的第一行（去除 markdown 标题前缀，长度上限为 100 个字符）。当消息仅为附件时，文件名将作为备用线程名称。
- **附件**附在新线程的起始消息上 — 无需单独的上传步骤，也不会出现部分发送的情况。
- **一次调用，一个线程**：每次向论坛发送都会创建一个新线程。因此，连续向同一论坛发送消息会产生多个独立的线程。
- **检测是三层的**：首先查询频道目录缓存，其次查询进程本地的探测缓存，最后手段是实时的 `GET /channels/{id}` 探测（其结果随后会被缓存到进程生命周期结束）。

刷新目录（在提供此功能的平台上执行 `/channels refresh`，或重启网关）会将机器人启动后创建的任何论坛频道填充到缓存中。

## 故障排除

### 机器人在线但不响应消息

**原因**：消息内容意图（Message Content Intent）被禁用。

**修复**：前往[开发者门户](https://discord.com/developers/applications) → 你的应用 → Bot → 特权网关意图 → 启用 **Message Content Intent** → 保存更改。重启网关。

### 启动时出现 "Disallowed Intents" 错误

**原因**：你的代码请求了在开发者门户中未启用的意图。

**修复**：在 Bot 设置中启用所有三个特权网关意图（Presence、Server Members、Message Content），然后重启。

### 机器人无法看到特定频道中的消息

**原因**：机器人的角色没有查看该频道的权限。

**修复**：在 Discord 中，进入该频道的设置 → 权限 → 添加机器人的角色并启用 **View Channel** 和 **Read Message History**。

### 403 禁止访问错误

**原因**：机器人缺少所需权限。

**修复**：使用步骤 5 中的 URL 以正确权限重新邀请机器人，或在服务器设置 → 角色中手动调整机器人角色的权限。

### 机器人离线

**原因**：Hermes 网关未运行，或令牌不正确。

**修复**：检查 `hermes gateway` 是否正在运行。验证 `.env` 文件中的 `DISCORD_BOT_TOKEN`。如果你最近重置了令牌，请更新它。

### "User not allowed" / 机器人忽略你

**原因**：你的用户 ID 不在 `DISCORD_ALLOWED_USERS` 中。

**修复**：将你的用户 ID 添加到 `~/.hermes/.env` 文件中的 `DISCORD_ALLOWED_USERS`，然后重启网关。

### 同一频道中的人意外共享上下文

**原因**：`group_sessions_per_user` 被禁用，或者平台无法为该上下文中的消息提供用户 ID。

**修复**：在 `~/.hermes/config.yaml` 中设置此项并重启网关：

```yaml
group_sessions_per_user: true
```

如果你有意想要共享的房间对话，则保持关闭状态 — 只需预期会有共享的对话历史记录和共享的中断行为。

## 安全

:::warning
务必设置 `DISCORD_ALLOWED_USERS`（或 `DISCORD_ALLOWED_ROLES`）以限制谁可以与机器人交互。若两者均未设置，网关默认拒绝所有用户作为安全措施。只授权你信任的人 — 授权用户可以完全访问智能体的功能，包括工具使用和系统访问。
:::

### 基于角色的访问控制

对于通过角色而非个人用户列表管理访问权限的服务器（版主团队、支持人员、内部工具），请使用 `DISCORD_ALLOWED_ROLES` — 一个用逗号分隔的角色 ID 列表。任何拥有其中一个角色的成员都被授权。

```bash
# ~/.hermes/.env — 可与 DISCORD_ALLOWED_USERS 并存或替代它
DISCORD_ALLOWED_ROLES=987654321098765432,876543210987654321
```

语义：

- **与用户允许列表进行 OR 逻辑。** 如果用户的 ID 在 `DISCORD_ALLOWED_USERS` 中**或**他们拥有 `DISCORD_ALLOWED_ROLES` 中的任何角色，则该用户被授权。
- **自动启用服务器成员意图。** 当设置了 `DISCORD_ALLOWED_ROLES` 时，机器人会在连接时启用成员意图 — 这是 Discord 在成员记录中发送角色信息所必需的。
- **使用角色 ID，而非名称。** 从 Discord 获取它们：**用户设置 → 高级 → 开发者模式开启**，然后右键单击任何角色 → **复制角色 ID**。
- **私信回退。** 在私信中，角色检查会扫描共同的服务器；在任何共享服务器中拥有允许角色的用户，在私信中也会被授权。

这是版主团队更替时的首选模式 — 新版主在获得角色的那一刻即可获得访问权限，无需编辑 `.env` 或重启网关。

### 提及控制

默认情况下，Hermes 会阻止机器人提及 `@everyone`、`@here` 和角色提及，即使其回复中包含这些标记。这可以防止措辞不当的提示或回显的用户内容向整个服务器发送垃圾消息。单个 `@user` 提及和回复引用提及（小的“正在回复...”芯片）保持启用，以便正常对话仍然有效。

你可以通过环境变量或 `config.yaml` 放宽这些默认设置：

```yaml
# ~/.hermes/config.yaml
discord:
  allow_mentions:
    everyone: false      # 允许机器人提及 @everyone / @here
    roles: false         # 允许机器人提及 @role
    users: true          # 允许机器人提及单个 @users
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
除非你确切知道为什么需要，否则请将 `everyone` 和 `roles` 保持为 `false`。大型语言模型很容易在看起来正常的回复中产生字符串 `@everyone`；没有此保护，这将通知你服务器的每个成员。
:::

有关保护你的 Hermes 智能体部署的更多信息，请参阅[安全指南](../security.md)。