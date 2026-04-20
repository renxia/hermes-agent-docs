---
sidebar_position: 3
title: "Discord"
description: "将 Hermes Agent 设置为 Discord 机器人"
---

# Discord 设置

Hermes Agent 作为机器人在 Discord 上运行，允许您通过私信或服务器频道与 AI 助手聊天。该机器人接收您的消息，通过 Hermes Agent 管道（包括工具使用、记忆和推理）进行处理，并实时响应。它支持文本、语音消息、文件附件和斜杠命令。

在开始设置之前，这里解答大多数人都想问的问题：一旦 Hermes 加入您的服务器，它的行为是怎样的。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| **私信 (DMs)** | Hermes 会回复每一条消息。无需 `@提及`。每条私信都有独立的会话。 |
| **服务器频道** | 默认情况下，Hermes 仅在您 `@提及` 它时才会回复。如果您在频道中发布消息但未提及它，Hermes 会忽略该消息。 |
| **自由响应频道** | 您可以使用 `DISCORD_FREE_RESPONSE_CHANNELS` 使特定频道无需提及即可响应，或使用 `DISCORD_REQUIRE_MENTION=false` 全局禁用提及。这些频道中的消息会得到内联回答——跳过自动线程创建，保持频道作为轻量级聊天的状态。 |
| **线程** | Hermes 会在同一线程中回复。除非该线程或其父频道配置为自由响应，否则提及规则仍然适用。线程与其父频道之间保持隔离，以维护会话历史。 |
| **多用户共享频道** | 默认情况下，Hermes 会在频道内按用户隔离会话历史记录，以确保安全性和清晰性。除非您明确禁用此功能，否则同一频道中的两个人不会共享一个对话记录。 |
| **提及其他用户的消息** | 当 `DISCORD_IGNORE_NO_MENTION` 为 `true`（默认值）时，如果消息 `@提及` 了其他用户但没有提及机器人，Hermes 会保持沉默。这可以防止机器人介入针对其他人的对话。将其设置为 `false` 可以让机器人无视提及对象而回复所有消息。此功能仅适用于服务器频道，不适用于私信。 |

:::tip
如果您想要一个正常的帮助频道，人们可以在其中与 Hermes 交流而无需每次都标记它，请将该频道添加到 `DISCORD_FREE_RESPONSE_CHANNELS`。
:::

### Discord Gateway 模型

Hermes 在 Discord 上的运行方式不是简单的无状态 webhook。它通过完整的消息网关运行，这意味着每条传入的消息都会经过以下流程：

1. 授权 (`DISCORD_ALLOWED_USERS`)
2. 提及/自由响应检查
3. 会话查找
4. 会话记录加载
5. 正常的 Hermes 代理执行，包括工具、记忆和斜杠命令
6. 将响应发送回 Discord

这一点很重要，因为繁忙服务器中的行为取决于 Discord 路由和 Hermes 会话策略。

### Discord 中的会话模型

默认情况下：

- 每条私信都有独立的会话
- 每个服务器线程都有独立的命名空间
- 共享频道中的每个用户在该频道内有独立的会话

因此，如果 Alice 和 Bob 都在 `#research` 中与 Hermes 交谈，即使他们使用的是同一个可见的 Discord 频道，Hermes 也会默认将它们视为单独的对话。

这由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您明确希望整个房间共享一个对话时才设置为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话可能对协作房间有用，但也意味着：

- 用户共享上下文增长和 token 成本
- 一个人的复杂工具密集型任务可能会增加其他所有人的上下文负担
- 一个人在同一房间中的后续操作可能会中断另一个人的正在进行的操作

### 中断和并发

Hermes 按会话键跟踪正在运行的代理。

使用默认的 `group_sessions_per_user: true`：

- Alice 中断她自己的正在进行的请求只会影响她在该频道中的会话
- Bob 可以在同一频道中继续交谈，而不会继承 Alice 的历史记录或中断 Alice 的操作

使用 `group_sessions_per_user: false`：

- 整个房间共享该频道/线程的一个正在运行的代理槽位
- 不同人的后续消息可能会相互中断或排队等待

本指南将引导您完成完整的设置过程——从在 Discord 开发者门户创建机器人到发送第一条消息。

## 第 1 步：创建 Discord 应用程序

1. 访问 [Discord 开发者门户](https://discord.com/developers/applications) 并使用您的 Discord 账户登录。
2. 点击右上角的 **新建应用程序**。
3. 为您的应用程序输入名称（例如 "Hermes Agent"），并接受开发者服务条款。
4. 点击 **创建**。

您将进入 **基本信息** 页面。记下 **应用程序 ID**——稍后需要用它来构建邀请链接。

## 第 2 步：创建机器人

1. 在左侧边栏中点击 **机器人**。
2. Discord 会自动为您的应用程序创建一个机器人用户。您会看到机器人的用户名，您可以自定义它。
3. 在 **授权流** 部分：
   - 将 **公共机器人** 设置为 **开启**——这是使用 Discord 提供的邀请链接所必需的（推荐）。这允许安装选项卡生成默认的授权 URL。
   - 将 **需要 OAuth2 代码授权** 保持为 **关闭**。

:::tip
您可以在这个页面上为机器人设置自定义头像和横幅。这就是用户在 Discord 中看到的形象。
:::

:::info[私有机器人替代方案]
如果您希望保持机器人私密（公共机器人 = 关闭），您**必须**在第 5 步中使用 **手动 URL** 方法而不是安装选项卡。Discord 提供的链接要求启用公共机器人。
:::

## 第 3 步：启用特权网关意图

这是整个设置中最关键的一步。如果没有正确启用意图，您的机器人将连接到 Discord 但**无法读取消息内容**。

在 **机器人** 页面中，向下滚动到 **特权网关意图**。您会看到三个开关：

| 意图 | 用途 | 必需？ |
|--------|---------|-----------|
| **Presence Intent** | 查看用户的在线/离线状态 | 可选 |
| **Server Members Intent** | 访问成员列表，解析用户名 | **必需** |
| **Message Content Intent** | 读取消息的文本内容 | **必需** |

**启用 Server Members Intent 和 Message Content Intent**，将它们切换为 **开启**。

- 没有 **Message Content Intent**，您的机器人会收到消息事件但消息文本为空——机器人实际上无法看到您输入的内容。
- 没有 **Server Members Intent**，机器人无法解析允许的用户列表中的用户名，可能无法识别谁在向其发送消息。

:::warning[这是 Discord 机器人无法工作的首要原因]
如果您的机器人在线但从不响应消息，几乎可以肯定是 **Message Content Intent** 被禁用了。请返回 [开发者门户](https://discord.com/developers/applications)，选择您的应用程序 → 机器人 → 特权网关意图，确保 **Message Content Intent** 已切换为 ON。点击 **保存更改**。
:::

**关于服务器数量：**
- 如果您的机器人在**少于 100 个服务器**中，可以自由地随意切换意图。
- 如果您的机器人在**100 个或更多服务器**中，Discord 要求您提交验证申请才能使用特权意图。对于个人使用，这不是问题。

点击页面底部的 **保存更改**。

## 第 4 步：获取机器人令牌

机器人令牌是 Hermes Agent 用来以您的机器人身份登录的凭据。仍在 **机器人** 页面：

1. 在 **令牌** 部分，点击 **重置令牌**。
2. 如果您的 Discord 账户启用了双因素认证，请输入您的 2FA 代码。
3. Discord 将显示您的新令牌。**立即复制它**。

:::warning[令牌只显示一次]
令牌只显示一次。如果您丢失它，需要重置并生成一个新的。切勿公开分享您的令牌或将它提交到 Git——拥有此令牌的人可以完全控制您的机器人。
:::

将令牌保存在安全的地方（例如密码管理器）。在第 8 步中您需要它。

## 第 5 步：生成邀请链接

您需要一个 OAuth2 URL 来邀请机器人到您的服务器。有两种方法可以做到：

### 选项 A：使用安装选项卡（推荐）

:::note[需要公共机器人]
此方法要求在第 2 步中将 **公共机器人** 设置为 **开启**。如果您将公共机器人设置为 OFF，请使用下面的手动 URL 方法。
:::

1. 在左侧边栏中点击 **安装**。
2. 在 **安装上下文** 下，启用 **服务器安装**。
3. 对于 **安装链接**，选择 **Discord 提供链接**。
4. 在 **服务器安装的默认安装设置** 下：
   - **范围**：选择 `bot` 和 `applications.commands`
   - **权限**：选择下面列出的权限。

### 选项 B：手动 URL

您可以直接使用此格式构造邀请 URL：

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=274878286912
```

将 `YOUR_APP_ID` 替换为第 1 步中的应用程序 ID。

### 所需权限

这些是机器人需要的最低权限：

- **查看频道**——查看其有权访问的频道
- **发送消息**——回复您的消息
- **嵌入链接**——格式化丰富的响应
- **附加文件**——发送图像、音频和文件输出
- **阅读消息历史**——维护对话上下文

### 推荐的额外权限

- **在主题中发送消息**——在主题对话中回复
- **添加反应**——对消息进行反应以示确认

### 权限整数

| 级别 | 权限整数 | 包含内容 |
|-------|-------------------|-----------------|
| 最小 | `117760` | 查看频道、发送消息、阅读消息历史、附加文件 |
| 推荐 | `274878286912` | 以上所有内容加上嵌入链接、在主题中发送消息、添加反应 |

## 第 6 步：邀请到您的服务器

1. 在浏览器中打开邀请 URL（来自安装选项卡或您构建的手动 URL）。
2. 在 **添加到服务器** 下拉菜单中选择您的服务器。
3. 点击 **继续**，然后点击 **授权**。
4. 如有提示，完成验证码。

:::info
您需要在 Discord 服务器上具有 **管理服务器** 权限才能邀请机器人。如果在下拉菜单中没有看到您的服务器，请让服务器管理员使用邀请链接。
:::

授权后，机器人将出现在您服务器的成员列表中（在您启动 Hermes gateway 之前它将显示为离线）。

## 第 7 步：查找您的 Discord 用户 ID

Hermes Agent 使用您的 Discord 用户 ID 来控制谁可以与机器人交互。要找到它：

1. 打开 Discord（桌面版或网页版应用）。
2. 转到 **设置** → **高级** → 将 **开发者模式** 切换为 **开启**。
3. 关闭设置。
4. 右键单击您自己的用户名（在消息中、成员列表或个人资料中）→ **复制用户 ID**。

您的用户 ID 是一个长数字，如 `284102345871466496`。

:::tip
开发者模式还可以让您以相同方式复制 **频道 ID** 和 **服务器 ID**——右键单击频道或服务器名称并选择复制 ID。如果您想手动设置主频道，需要一个频道 ID。
:::

## 第 8 步：配置 Hermes Agent

### 选项 A：交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

当被询问时选择 **Discord**，然后在被要求时粘贴您的机器人令牌和用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# 必需
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_ALLOWED_USERS=284102345871466496

# 多个允许的用户（逗号分隔）
# DISCORD_ALLOWED_USERS=284102345871466496,198765432109876543
```

然后启动 gateway：

```bash
hermes gateway
```

机器人应在几秒钟内在 Discord 上线。发送一条消息给它进行测试——无论是私信还是在它可以看到的频道中。

:::tip
您可以将 `hermes gateway` 作为后台进程或 systemd 服务运行以实现持久化操作。有关详细信息，请参阅部署文档。
:::

## 配置参考

Discord 行为通过两个文件控制：**`~/.hermes/.env`** 用于凭据和环境级切换，以及 **`~/.hermes/config.yaml`** 用于结构化设置。当两者都设置时，环境变量始终优先于 config.yaml 值。

### 环境变量 (.env)

| 变量 | 必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `DISCORD_BOT_TOKEN` | **是** | — | 来自 [Discord 开发者门户](https://discord.com/developers/applications) 的机器人令牌。 |
| `DISCORD_ALLOWED_USERS` | **是** | — | 允许与机器人交互的 Discord 用户 ID 列表（逗号分隔）。如果没有设置此变量或 `DISCORD_ALLOWED_ROLES`，gateway 会拒绝所有用户。 |
| `DISCORD_ALLOWED_ROLES` | 否 | — | Discord 角色 ID 列表（逗号分隔）。拥有其中一个角色的任何成员都被授权——与 `DISCORD_ALLOWED_USERS` 采用 OR 语义。连接时会自动启用 **Server Members Intent**。适用于管理团队变动的情况：新版主获得角色后立即获得访问权限，无需推送配置更改。 |
| `DISCORD_HOME_CHANNEL` | 否 | — | 机器人发送主动消息（cron 输出、提醒、通知）的频道 ID。 |
| `DISCORD_HOME_CHANNEL_NAME` | 否 | `"Home"` | 日志和状态输出中主频道的显示名称。 |
| `DISCORD_REQUIRE_MENTION` | 否 | `true` | 当为 `true` 时，机器人在服务器频道中仅在 `@提及` 时才会响应。设置为 `false` 可在每个频道中响应所有消息。 |
| `DISCORD_FREE_RESPONSE_CHANNELS` | 否 | — | 即使 `DISCORD_REQUIRE_MENTION` 为 `true`，机器人在这些频道中也无需 `@提及` 即可响应的频道 ID 列表（逗号分隔）。 |
| `DISCORD_IGNORE_NO_MENTION` | 否 | `true` | 当为 `true` 时，如果消息 `@提及` 了其他用户但没有提及机器人，机器人会保持沉默。防止机器人介入针对其他人的对话。仅适用于服务器频道，不适用于私信。 |
| `DISCORD_AUTO_THREAD` | 否 | `true` | 当为 `true` 时，在文本频道中对每个 `@提及` 自动创建新的线程，使每个对话相互隔离（类似于 Slack 行为）。已在主题或私信中的消息不受此设置影响。 |
| `DISCORD_ALLOW_BOTS` | 否 | `"none"` | 控制机器人如何处理来自其他 Discord 机器人的消息。`"none"` - 忽略所有其他机器人；`"mentions"` - 仅接受提及 Hermes 的机器人消息；`"all"` - 接受所有机器人消息。 |
| `DISCORD_REACTIONS` | 否 | `true` | 当为 `true` 时，机器人在处理过程中向消息添加表情符号反应（👀 开始时，✅ 成功时，❌ 出错时）。设置为 `false` 可完全禁用反应。 |
| `DISCORD_IGNORED_CHANNELS` | 否 | — | 机器人**永远不会**响应的频道 ID 列表（逗号分隔）。优先级最高——如果频道在此列表中，无论其他设置如何，机器人都会静默忽略其中的所有消息。 |
| `DISCORD_ALLOWED_CHANNELS` | 否 | — | 机器人**仅**在这些频道（加上允许的私信）中响应的频道 ID 列表（逗号分隔）。覆盖 `config.yaml` 中的 `discord.allowed_channels`。可与 `DISCORD_IGNORED_CHANNELS` 结合使用来表达允许/拒绝规则。 |
| `DISCORD_NO_THREAD_CHANNELS` | 否 | — | 当 `DISCORD_AUTO_THREAD` 为 `true` 时，机器人在这些频道中直接响应而不是创建线程的频道 ID 列表（逗号分隔）。 |
| `DISCORD_REPLY_TO_MODE` | 否 | `"first"` | 控制回复引用行为：`"off"` - 从不回复原始消息，`"first"` - 仅在第一个消息块上回复引用（默认），`"all"` - 在每个消息块上都回复引用。 |
| `DISCORD_ALLOW_MENTION_EVERYONE` | 否 | `false` | 当为 `false`（默认值）时，即使响应包含这些标记，机器人也无法 ping `@everyone` 或 `@here`。设置为 `true` 可重新启用。见下面的[提及控制](#mention-control)。 |
| `DISCORD_ALLOW_MENTION_ROLES` | 否 | `false` | 当为 `false`（默认值）时，机器人无法 ping `@role` 提及。设置为 `true` 可允许。 |
| `DISCORD_ALLOW_MENTION_USERS` | 否 | `true` | 当为 `true`（默认值）时，机器人可以通过 ID 向个人用户 ping。 |
| `DISCORD_ALLOW_MENTION_REPLIED_USER` | 否 | `true` | 当为 `true`（默认值）时，回复消息会 ping 原始作者。 |
| `DISCORD_PROXY` | 否 | — | Discord 连接（HTTP、WebSocket、REST）的代理 URL。覆盖 `HTTPS_PROXY`/`ALL_PROXY`。支持 `http://`、`https://` 和 `socks5://` 方案。 |
| `HERMES_DISCORD_TEXT_BATCH_DELAY_SECONDS` | 否 | `0.6` | 适配器在刷新排队文本块前等待的宽限期。有助于平滑流式输出。 |
| `HERMES_DISCORD_TEXT_BATCH_SPLIT_DELAY_SECONDS` | 否 | `0.1` | 单个消息超过 Discord 长度限制时分块之间的延迟。 |

### 配置文件 (config.yaml)

`~/.hermes/config.yaml` 中的 `discord` 部分镜像了上述环境变量。config.yaml 设置作为默认值应用——如果等效的环境变量已设置，则环境变量优先。

```yaml
# Discord 特定设置
discord:
  require_mention: true           # 在服务器频道中需要 @提及
  free_response_channels: ""      # 逗号分隔的频道 ID（或 YAML 列表）
  auto_thread: true               # 在 @提及 时自动创建线程
  reactions: true                 # 处理过程中添加表情符号反应
  ignored_channels: []            # 机器人永不响应的频道 ID
  no_thread_channels: []          # 机器人不创建线程而直接响应的频道 ID
  channel_prompts: {}             # 每个频道的临时系统提示
  allow_mentions:                 # 机器人被允许 ping 的内容（安全默认值）
    everyone: false               # @everyone / @here pings（默认：false）
    roles: false                  # @role pings（默认：false）
    users: true                   # @user pings（默认：true）
    replied_user: true            # 回复引用 ping 作者（默认：true）

# 会话隔离（适用于所有网关平台，不仅限于 Discord）
group_sessions_per_user: true     # 在共享频道中按用户隔离会话
```

#### `discord.require_mention`

**类型：** 布尔值 — **默认值：** `true`

启用时，机器人在服务器频道中仅在直接 `@提及` 时才会响应。私信总是会得到响应，无论此设置如何。

#### `discord.free_response_channels`

**类型：** 字符串或列表 — **默认值：** `""`

机器人无需 `@提及` 即可响应所有消息的频道 ID。接受逗号分隔的字符串或 YAML 列表：

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

如果线程的父频道在此列表中，该线程也会变为无需提及。

自由响应频道还会**跳过自动线程创建**——机器人会内联回复而不是为每条消息创建新线程。这使频道保持可用作轻量级聊天界面。如果您希望线程行为，不要将此频道列为自由响应（使用正常的 `@提及` 流程）。

#### `discord.auto_thread`

**类型：** 布尔值 — **默认值：** `true`

启用时，文本频道中的每个 `@提及` 都会自动为该对话创建新线程。这使主频道保持整洁，并为每个对话提供独立的会话历史记录。创建线程后，该线程中的后续消息不需要 `@提及`——机器人知道它已经参与对话。

已在现有线程或私信中的消息不受此设置影响。列在 `discord.free_response_channels` 或 `discord.no_thread_channels` 中的频道也会绕过自动线程创建，而是获得内联回复。

#### `discord.reactions`

**类型：** 布尔值 — **默认值：** `true`

控制机器人是否向消息添加表情符号反应作为视觉反馈：
- 👀 处理开始时添加
- ✅ 响应成功送达时添加
- ❌ 处理过程中出错时添加

如果觉得反应分散注意力或机器人的角色没有 **添加反应** 权限，请禁用此功能。

#### `discord.ignored_channels`

**类型：** 字符串或列表 — **默认值：** `[]`

机器人**永不**响应的频道 ID。即使直接 `@提及` 也不会响应。这是最高优先级——如果频道在此列表中，无论 `require_mention`、`free_response_channels` 或其他任何设置如何，机器人都会静默忽略其中的所有消息。

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

如果线程的父频道在此列表中，该线程中的消息也会被忽略。

#### `discord.no_thread_channels`

**类型：** 字符串或列表 — **默认值：** `[]`

当 `auto_thread` 为 `true`（默认值）时，机器人在这些频道中直接响应而不是自动创建线程的频道 ID。在这些频道中，机器人像普通消息一样内联响应，而不是创建新线程。

```yaml
discord:
  no_thread_channels:
    - 1234567890  # 在此频道中机器人直接响应
```

适用于专门用于机器人交互的频道，线程会增加不必要的噪音。

#### `discord.channel_prompts`

**类型：** 映射 — **默认值：** `{}`

每个频道的临时系统提示，会在匹配的 Discord 频道或线程的每次交互中注入，但不会持久化到对话历史中。

```yaml
discord:
  channel_prompts:
    "1234567890": |
      此频道用于研究任务。偏好深度比较、引用和简洁的综合分析。
    "9876543210": |
      此论坛用于心理支持。要温暖、 grounded 和非评判性的。
```

行为：
- 精确的线程/频道 ID 匹配优先。
- 如果消息到达线程或论坛帖子且该线程没有显式条目，Hermes 会回退到父频道/论坛 ID。
- 提示在运行时临时应用，因此更改会立即影响未来的交互，无需重写过去的会话历史。

#### `group_sessions_per_user`

**类型：** 布尔值 — **默认值：** `true`

这是一个全局网关设置（非 Discord 特有），控制同一频道中的用户是否获得隔离的会话历史记录。

当为 `true` 时：Alice 和 Bob 在 `#research` 中的对话在 Hermes 看来是各自独立的。当为 `false` 时：整个频道共享一个对话记录和一个正在运行的代理槽位。

```yaml
group_sessions_per_user: true
```

见上面的[会话模型](#session-model-in-discord)部分了解每种模式的全部含义。

#### `display.tool_progress`

**类型：** 字符串 — **默认值：** `"all"` — **值：** `off`、`new`、`all`、`verbose`

控制在处理过程中是否在聊天中发送进度消息（例如 "Reading file..."、"Running terminal command..."）。这是一个全局网关设置，适用于所有平台。

```yaml
display:
  tool_progress: "all"    # off | new | all | verbose
```

- `off` - 无进度消息
- `new` - 仅显示每次交互的第一个工具调用
- `all` - 显示所有工具调用（网关消息中截断至 40 个字符）
- `verbose` - 显示完整的工具调用详情（可能产生长消息）

#### `display.tool_progress_command`

**类型：** 布尔值 — **默认值：** `false`

启用时，会使 `/verbose` 斜杠命令可用于 gateway，让您在不编辑 config.yaml 的情况下循环切换工具进度模式（`off → new → all → verbose → off`）。

```yaml
display:
  tool_progress_command: true
```

## 交互式模型选择器

在 Discord 频道中发送 `/model`（不带参数）以打开基于下拉菜单的模型选择器：

1. **提供商选择** - 显示可用提供商的 Select 下拉菜单（最多 25 个）。
2. **模型选择** - 所选提供商的模型 Second Select 下拉菜单（最多 25 个）。

选择器在 120 秒后超时。只有授权用户（在 `DISCORD_ALLOWED_USERS` 中）可以与之交互。如果您知道模型名称，可以直接输入 `/model <name>`。

## 技能的本地斜杠命令

Hermes 自动将已安装的技能注册为 **本地 Discord 应用程序命令**。这意味着技能会出现在 Discord 的自动完成 `/` 菜单中，与内置命令并列。

- 每个技能成为一个 Discord 斜杠命令（例如 `/code-review`、`/ascii-art`）
- 技能接受可选的 `args` 字符串参数
- Discord 对每个机器人有 100 个应用程序命令的限制——如果您有超过可用插槽的技能数量，额外的技能会被跳过并在日志中发出警告
- 技能在启动时与 `/model`、`/reset` 和 `/background` 等内置命令一起注册

无需额外配置——通过 `hermes skills install` 安装的任何技能都会在下次 gateway 重启时自动注册为 Discord 斜杠命令。

## 主频道

您可以指定一个"主频道"，机器人会向其中发送主动消息（如 cron 作业输出、提醒和通知）。有两种设置方法：

### 使用斜杠命令

在任何机器人存在的 Discord 频道中输入 `/sethome`。该频道将成为主频道。

### 手动配置

将以下内容添加到您的 `~/.hermes/.env`：

```bash
DISCORD_HOME_CHANNEL=123456789012345678
DISCORD_HOME_CHANNEL_NAME="#bot-updates"
```

将 ID 替换为实际的频道 ID（启用开发者模式后右键单击 → 复制频道 ID）。

## 语音消息

Hermes Agent 支持 Discord 语音消息：

- **传入的语音消息** 会自动使用配置的 STT 提供商进行转录：本地 `faster-whisper`（无需密钥）、Groq Whisper（`GROQ_API_KEY`）或 OpenAI Whisper（`VOICE_TOOLS_OPENAI_KEY`）。
- **文本转语音**：使用 `/voice tts` 让机器人在文本回复的同时发送语音回复。
- **Discord 语音频道**：Hermes 还可以加入语音频道，监听用户说话，并在频道中说话。

完整的设置和操作指南，请参见：
- [语音模式](/docs/user-guide/features/voice-mode)
- [在 Hermes 中使用语音模式](/docs/guides/use-voice-mode-with-hermes)

## 论坛频道

Discord 论坛频道（类型 15）不接受直接消息——论坛中的每个帖子必须是线程。Hermes 会自动检测论坛频道，并在需要发送消息时创建新线程，因此 `send_message`、TTS、图像、语音消息和文件附件都能正常工作，无需代理的特殊处理。

- **线程名称** 从消息的第一行派生（剥离 markdown 标题前缀，上限 100 字符）。如果消息仅为附件，则使用文件名作为备用线程名称。
- **附件** 与新线程的起始消息同行——无需单独上传步骤，无需部分发送。
- **一次调用，一个线程**：每次论坛发送都会创建新线程。因此对同一论坛的连续发送会产生单独的线程。
- **检测是三层级的**：首先是频道目录缓存，其次是进程本地的探测缓存，最后是作为最后手段的实时 `GET /channels/{id}` 探测（其结果会在进程生命周期内被记忆）。

刷新目录（在暴露 `/channels refresh` 的平台或通过 gateway 重启）会填充启动后创建的论坛频道的缓存。

## 故障排除

### 机器人在线但不响应消息

**原因**：Message Content Intent 被禁用。

**修复**：前往 [开发者门户](https://discord.com/developers/applications) → 您的应用程序 → 机器人 → 特权网关意图 → 启用 **Message Content Intent** → 保存更改。重启 gateway。

### 启动时的 "Disallowed Intents" 错误

**原因**：您的代码请求了在开发者门户中未启用的意图。

**修复**：在 Bot 设置中启用所有三个特权网关意图（Presence、Server Members、Message Content），然后重启。

### 机器人无法在特定频道中看到消息

**原因**：机器人的角色没有权限查看该频道。

**修复**：在 Discord 中，转到频道设置 → 权限 → 添加机器人的角色并启用 **查看频道** 和 **阅读消息历史**。

### 403 禁止错误

**原因**：机器人缺少所需的权限。

**修复**：使用第 5 步中的 URL 重新邀请机器人，或手动调整服务器设置 → 角色中机器人的角色权限。

### 机器人离线

**原因**：Hermes gateway 未运行，或令牌不正确。

**修复**：检查 `hermes gateway` 是否正在运行。验证 `.env` 文件中的 `DISCORD_BOT_TOKEN`。如果您最近重置了令牌，请更新它。

### "User not allowed" / 机器人忽略您

**原因**：您的用户 ID 不在 `DISCORD_ALLOWED_USERS` 中。

**修复**：将您的用户 ID 添加到 `~/.hermes/.env` 中的 `DISCORD_ALLOWED_USERS` 并重启 gateway。

### 同一频道中的人意外共享上下文

**原因**：`group_sessions_per_user` 被禁用，或平台无法为该上下文提供用户 ID。

**修复**：在 `~/.hermes/config.yaml` 中设置此选项并重启 gateway：

```yaml
group_sessions_per_user: true
```

如果您确实想要共享的房间对话，请保持关闭——只需注意共享的对话历史和共享的中断行为。

## 安全性

:::warning
始终设置 `DISCORD_ALLOWED_USERS`（或 `DISCORD_ALLOWED_ROLES`）来限制可以与机器人交互的人员。如果没有这两个设置，gateway 会默认拒绝所有用户作为安全措施。仅授权您信任的人员——授权用户可以完全访问代理的功能，包括工具使用和系统访问。
:::

### 基于角色的访问控制

对于通过角色而非个人用户列表管理访问的服务器（版主团队、支持人员、内部工具），请使用 `DISCORD_ALLOWED_ROLES`——逗号分隔的角色 ID 列表。拥有其中一个角色的任何成员都被授权。

```bash
# ~/.hermes/.env - 可与 DISCORD_ALLOWED_USERS 同时或替代使用
DISCORD_ALLOWED_ROLES=987654321098765432,876543210987654321
```

语义：

- **与用户白名单 OR 关系**。如果用户的 ID 在 `DISCORD_ALLOWED_USERS` 中**或**他们有 `DISCORD_ALLOWED_ROLES` 中的任何角色，则该用户被授权。
- **自动启用 Server Members Intent**。当设置 `DISCORD_ALLOWED_ROLES` 时，机器人在连接时启用 Members intent——Discord 需要此功能来发送成员记录中的角色信息。
- **角色 ID，而非名称**。从 Discord 获取：**用户设置 → 高级 → 启用开发者模式**，然后右键单击任何角色 → **复制角色 ID**。
- **DM 回退**。在私信中，角色检查会扫描共同服务器；在任何共享服务器中有允许角色的用户在私信中也被授权。

这是管理团队变动的首选模式——新版主在获得角色时立即获得访问权限，无需编辑 `.env` 或重启 gateway。

### 提及控制

默认情况下，Hermes 阻止机器人 ping `@everyone`、`@here` 和角色提及，即使其回复包含这些标记也是如此。这可以防止措辞不当的提示或回声的用户内容淹没整个服务器。个人 `@user` ping 和回复引用 ping（小的"回复…"芯片）保持启用，以便正常对话仍能工作。

您可以通过环境变量或 `config.yaml` 放松这些默认设置：

```yaml
# ~/.hermes/config.yaml
discord:
  allow_mentions:
    everyone: false      # 允许机器人 ping @everyone / @here
    roles: false         # 允许机器人 ping @role 提及
    users: true          # 允许机器人 ping 个人 @users
    replied_user: true   # 回复时 ping 作者
```

```bash
# ~/.hermes/.env - 环境变量优先于 config.yaml
DISCORD_ALLOW_MENTION_EVERYONE=false
DISCORD_ALLOW_MENTION_ROLES=false
DISCORD_ALLOW_MENTION_USERS=true
DISCORD_ALLOW_MENTION_REPLIED_USER=true
```

:::tip
除非您确切知道为什么需要它们，否则请将 `everyone` 和 `roles` 保持为 `false`。LLM 很容易在正常外观的响应中产生 `@everyone` 字符串；如果没有此保护，这将通知您服务器的每个成员。
:::

有关保护 Hermes Agent 部署的更多信息，请参见 [安全指南](../security.md)。