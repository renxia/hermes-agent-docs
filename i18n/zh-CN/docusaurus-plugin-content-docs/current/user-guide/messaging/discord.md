---
sidebar_position: 3
title: "Discord"
description: "设置 Hermes Agent 为 Discord 机器人"
---

# Discord 设置

Hermes Agent 作为机器人集成到 Discord 中，允许您通过私信或服务器频道与您的 AI 助手聊天。机器人接收您的消息，通过 Hermes Agent 流程（包括工具使用、记忆和推理）进行处理，并实时回复。它支持文本、语音消息、文件附件和斜杠命令。

在设置之前，这是大多数人想知道的部分：一旦 Hermes 进入您的服务器，它会如何表现。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| **私信 (DMs)** | Hermes 会回复每一条消息。无需 `@提及`。每条私信都有独立的会话。 |
| **服务器频道** | 默认情况下，只有当您 `@提及` 它时，Hermes 才会回复。如果您在没有提及它的情况下发布消息，Hermes 会忽略该消息。 |
| **自由回复频道** | 您可以使用 `DISCORD_FREE_RESPONSE_CHANNELS` 使特定频道无需提及即可使用，或者使用 `DISCORD_REQUIRE_MENTION=false` 全局禁用提及要求。 |
| **线程** | Hermes 会在同一线程中回复。除非该线程或其父频道被配置为自由回复，否则提及规则仍然适用。为了会话历史记录，线程与父频道保持隔离。 |
| **包含多个用户的共享频道** | 默认情况下，Hermes 为了安全和清晰度，会在频道内为每位用户隔离会话历史记录。同一频道中交谈的两个人，除非您明确禁用，否则不会共享一个完整的聊天记录。 |
| **提及其他用户的消息** | 当 `DISCORD_IGNORE_NO_MENTION` 为 `true`（默认值）时，如果一条消息 `@提及` 了其他用户但**没有**提及机器人，Hermes 将保持沉默。这可以防止机器人跳入针对其他人的对话。如果希望机器人无论谁被提及都能回复，请将其设置为 `false`。这仅适用于服务器频道，不适用于私信。 |

:::tip
如果您希望有一个正常的“机器人帮助频道”，让人们可以随时与 Hermes 交流而无需每次都标记它，请将该频道添加到 `DISCORD_FREE_RESPONSE_CHANNELS`。
:::

### Discord 网关模型

Hermes 在 Discord 上不是一个无状态回复的 Webhook。它通过完整的消息网关运行，这意味着每条传入的消息都会经过以下步骤：

1. 授权 (`DISCORD_ALLOWED_USERS`)
2. 提及/自由回复检查
3. 会话查找
4. 会话记录加载
5. 正常的 Hermes 代理执行，包括工具、记忆和斜杠命令
6. 将回复发送回 Discord

这一点很重要，因为在繁忙的服务器中，行为取决于 Discord 路由和 Hermes 会话策略。

### Discord 中的会话模型

默认情况下：

- 每个私信都有自己的会话
- 每个服务器线程都有自己的会话命名空间
- 共享频道中的每位用户都在该频道内拥有自己的会话

因此，即使 Alice 和 Bob 在 `#research` 中与 Hermes 交谈，Hermes 默认也会将它们视为独立的对话。

这由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

只有当您明确希望整个房间共享一个对话时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话对于协作房间很有用，但也意味着：

- 用户共享了上下文增长和 token 成本
- 一个人的长时间、工具密集型任务可能会使其他所有人的上下文膨胀
- 一个人的进行中的运行可能会打断同一房间内另一个人后续的跟进

### 中断与并发

Hermes 通过会话键跟踪正在运行的代理。

使用默认的 `group_sessions_per_user: true`：

- Alice 中断自己正在进行的请求，只会影响 Alice 在该频道中的会话。
- Bob 可以在同一频道继续交谈，而不会继承 Alice 的历史记录或打断 Alice 的运行。

使用 `group_sessions_per_user: false`：

- 整个房间共享该频道/线程的一个运行代理槽位。
- 不同人的后续消息可能会相互中断或排队。

本指南将引导您完成完整的设置过程——从在 Discord 开发者门户创建机器人到发送您的第一条消息。

## 步骤 1：创建 Discord 应用

1. 访问 [Discord 开发者门户](https://discord.com/developers/applications)，并使用您的 Discord 账户登录。
2. 点击右上角的 **New Application**（新应用）。
3. 为您的应用输入名称（例如：“Hermes Agent”）并接受开发者服务条款。
4. 点击 **Create**（创建）。

您将进入 **General Information**（一般信息）页面。请记下 **Application ID**（应用 ID）——您稍后需要它来构建邀请 URL。

## 步骤 2：创建机器人

1. 在左侧边栏，点击 **Bot**（机器人）。
2. Discord 会自动为您的应用创建一个机器人用户。您会看到机器人的用户名，您可以自定义它。
3. 在 **Authorization Flow**（授权流程）下：
   - 将 **Public Bot**（公开机器人）设置为 **ON**（开启）——这是使用 Discord 提供的邀请链接所必需的（推荐）。这允许“安装”选项卡生成默认的授权 URL。
   - 将 **Require OAuth2 Code Grant**（需要 OAuth2 代码授权）保持设置为 **OFF**（关闭）。

:::tip
您可以在此页面为您的机器人设置自定义头像和横幅。这是用户在 Discord 中看到的内容。
:::

:::info[私有机器人替代方案]
如果您更喜欢将机器人设置为私有（Public Bot = OFF），则在步骤 5 中**必须**使用 **Manual URL**（手动 URL）方法，而不是“安装”选项卡。Discord 提供的链接要求开启 Public Bot。
:::

## 步骤 3：启用特权网关意图 (Privileged Gateway Intents)

这是整个设置中最关键的一步。如果没有启用正确的意图，您的机器人将连接到 Discord，但**将无法读取消息内容**。

在 **Bot** 页面，向下滚动到 **Privileged Gateway Intents**（特权网关意图）。您会看到三个开关：

| 意图 (Intent) | 用途 | 是否必需？ |
|--------|---------|-----------| 
| **Presence Intent** | 查看用户在线/离线状态 | 可选 |
| **Server Members Intent** | 访问成员列表，解析用户名 | **必需** |
| **Message Content Intent** | 读取消息文本内容 | **必需** |

**通过将 Server Members Intent 和 Message Content Intent 都切换到 ON（开启）来启用它们。**

- 没有 **Message Content Intent**，您的机器人会接收到消息事件，但消息文本是空的——机器人根本看不到您输入了什么。
- 没有 **Server Members Intent**，机器人无法解析允许用户列表中的用户名，可能会无法识别谁正在给它发送消息。

:::warning[这是 Discord 机器人无法工作的 #1 原因]
如果您的机器人在线但从未回复消息，几乎可以确定是 **Message Content Intent** 未启用。请返回 [开发者门户](https://discord.com/developers/applications)，选择您的应用 → Bot → Privileged Gateway Intents，并确保 **Message Content Intent** 已切换到 ON。点击 **Save Changes**（保存更改）。
:::

**关于服务器数量：**
- 如果您的机器人位于**少于 100 个服务器**，您可以自由地切换意图的开启和关闭。
- 如果您的机器人位于**100 个或更多服务器**，Discord 要求您提交验证申请才能使用特权意图。对于个人使用，这不是问题。

点击页面底部的 **Save Changes**（保存更改）。

## 步骤 4：获取机器人 Token

机器人 Token 是 Hermes Agent 用于以机器人身份登录的凭证。仍然在 **Bot** 页面：

1. 在 **Token**（令牌）部分，点击 **Reset Token**（重置令牌）。
2. 如果您的 Discord 账户启用了双重认证，请输入您的 2FA 代码。
3. Discord 将显示您的新 Token。**立即复制它。**

:::warning[Token 只显示一次]
Token 只会显示一次。如果您丢失了它，您需要重置它并生成一个新的。切勿公开分享您的 Token 或将其提交到 Git——任何拥有此 Token 的人都可以完全控制您的机器人。
:::

将 Token 存储在安全的地方（例如密码管理器）。您将在步骤 8 中需要它。

## 步骤 5：生成邀请 URL

您需要一个 OAuth2 URL 将机器人邀请到您的服务器。有两种方法可以做到这一点：

### 选项 A：使用安装选项卡（推荐）

:::note[需要公开机器人]
此方法要求在步骤 2 中将 **Public Bot** 设置为 **ON**。如果将 Public Bot 设置为 OFF，请使用下面的手动 URL 方法。
:::

1. 在左侧边栏，点击 **Installation**（安装）。
2. 在 **Installation Contexts**（安装上下文）下，启用 **Guild Install**（公会安装）。
3. 对于 **Install Link**（安装链接），选择 **Discord Provided Link**（Discord 提供链接）。
4. 在 Guild Install 的 **Default Install Settings**（默认安装设置）下：
   - **Scopes**（范围）：选择 `bot` 和 `applications.commands`
   - **Permissions**（权限）：选择下面列出的权限。

### 选项 B：手动 URL

您可以使用以下格式直接构建邀请 URL：

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=274878286912
```

将 `YOUR_APP_ID` 替换为步骤 1 中的应用 ID。

### 所需权限

这些是您的机器人所需的最低权限：

- **View Channels**（查看频道）— 查看它有权限访问的频道
- **Send Messages**（发送消息）— 回复您的消息
- **Embed Links**（嵌入链接）— 格式化富文本回复
- **Attach Files**（附加文件）— 发送图片、音频和文件输出
- **Read Message History**（读取消息历史记录）— 维护对话上下文

### 推荐的附加权限

- **Send Messages in Threads**（在线程中发送消息）— 在线程对话中回复
- **Add Reactions**（添加反应）— 对消息进行反应以确认

### 权限整数

| 等级 | 权限整数 | 包括内容 |
|-------|-------------------|----------|
| 最小 | `117760` | 查看频道、发送消息、读取消息历史记录、附加文件 |
| 推荐 | `274878286912` | 以上所有内容，外加嵌入链接、在线程中发送消息、添加反应 |

## 步骤 6：邀请到您的服务器

1. 在浏览器中打开邀请 URL（来自“安装”选项卡或您手动构建的 URL）。
2. 在 **Add to Server**（添加到服务器）下拉菜单中，选择您的服务器。
3. 点击 **Continue**（继续），然后 **Authorize**（授权）。
4. 如果提示，完成 CAPTCHA。

:::info
您需要在 Discord 服务器上拥有 **Manage Server**（管理服务器）权限才能邀请机器人。如果下拉菜单中看不到您的服务器，请要求服务器管理员使用邀请链接。
:::

授权后，机器人将出现在您服务器的成员列表中（直到您启动 Hermes 网关，它会显示为离线）。

## 步骤 7：查找您的 Discord 用户 ID

Hermes Agent 使用您的 Discord 用户 ID 来控制谁可以与机器人互动。要查找它：

1. 打开 Discord（桌面或网页应用）。
2. 转到 **Settings**（设置）→ **Advanced**（高级）→ 将 **Developer Mode**（开发者模式）切换到 **ON**（开启）。
3. 关闭设置。
4. 右键单击您自己的用户名（在消息、成员列表或个人资料中）→ **Copy User ID**（复制用户 ID）。

您的用户 ID 是一个很长的数字，例如 `284102345871466496`。

:::tip
开发者模式还可以以相同的方式复制 **Channel IDs**（频道 ID）和 **Server IDs**（服务器 ID）——右键单击频道或服务器名称并选择“复制 ID”。如果您想手动设置一个主频道，您需要一个频道 ID。
:::

## 步骤 8：配置 Hermes Agent

### 选项 A：交互式设置（推荐）

运行引导设置命令：

```bash
hermes gateway setup
```

当提示时，选择 **Discord**，然后按要求粘贴您的机器人 Token 和用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# 必需
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_ALLOWED_USERS=284102345871466496

# 多个允许用户（逗号分隔）
# DISCORD_ALLOWED_USERS=284102345871466496,198765432109876543
```

然后启动网关：

```bash
hermes gateway
```

机器人应在几秒钟内在线。发送一条消息——无论是私信还是它可见的频道中的消息——进行测试。

:::tip
您可以将 `hermes gateway` 作为后台进程或 systemd 服务运行以实现持久运行。有关详细信息，请参阅部署文档。
:::

## 配置参考

Discord 的行为由两个文件控制：**`~/.hermes/.env`** 用于凭证和环境级开关，和 **`~/.hermes/config.yaml`** 用于结构化设置。当两者都设置时，环境变量始终优先于 config.yaml 的值。

### 环境变量（.env）

| 变量 | 是否必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `DISCORD_BOT_TOKEN` | **是** | — | 来自 [Discord 开发者门户](https://discord.com/developers/applications) 的机器人 Token。 |
| `DISCORD_ALLOWED_USERS` | **是** | — | 允许与机器人互动的逗号分隔的 Discord 用户 ID。没有此项，网关将拒绝所有用户。 |
| `DISCORD_HOME_CHANNEL` | 否 | — | 机器人发送主动消息（定时任务输出、提醒、通知）的频道 ID。 |
| `DISCORD_HOME_CHANNEL_NAME` | 否 | `"Home"` | 日志和状态输出中主频道的显示名称。 |
| `DISCORD_REQUIRE_MENTION` | 否 | `true` | 当为 `true` 时，机器人仅在服务器频道中被 `@提及` 时才回复。设置为 `false` 可在所有频道回复所有消息。 |
| `DISCORD_FREE_RESPONSE_CHANNELS` | 否 | — | 逗号分隔的频道 ID，在 `DISCORD_REQUIRE_MENTION` 为 `true` 时，机器人无需 `@提及` 即可回复。 |
| `DISCORD_IGNORE_NO_MENTION` | 否 | `true` | 当为 `true` 时，如果消息 `@提及` 了其他用户但**没有**提及机器人，机器人将保持沉默。可防止机器人跳入针对其他人的对话。仅适用于服务器频道，不适用于私信。 |
| `DISCORD_AUTO_THREAD` | 否 | `true` | 当为 `true` 时，在文本频道中每个 `@提及` 都会自动创建一个新线程，从而使每个对话保持隔离（类似于 Slack 的行为）。消息已经在线程或私信中不受影响。 |
| `DISCORD_ALLOW_BOTS` | 否 | `"none"` | 控制机器人如何处理来自其他 Discord 机器人的消息。`"none"` — 忽略所有其他机器人。`"mentions"` — 只接受 `@提及` Hermes 的机器人消息。`"all"` — 接受所有机器人消息。 |
| `DISCORD_REACTIONS` | 否 | `true` | 当为 `true` 时，机器人会在处理消息过程中向消息添加表情符号反应（👀 开始，✅ 成功，❌ 错误）。设置为 `false` 可完全禁用反应。 |
| `DISCORD_IGNORED_CHANNELS` | 否 | — | 逗号分隔的频道 ID，机器人**永远不会**回复，即使被 `@提及`。具有最高优先级——如果一个频道在此列表中，无论 `require_mention`、`free_response_channels` 或任何其他设置如何，机器人都会静默忽略该频道的所有消息。 |
| `DISCORD_NO_THREAD_CHANNELS` | 否 | — | 逗号分隔的频道 ID，机器人直接在频道中回复，而不是创建线程。仅当 `DISCORD_AUTO_THREAD` 为 `true` 时相关。 |
| `DISCORD_REPLY_TO_MODE` | 否 | `"first"` | 控制回复引用行为：`"off"` — 从不回复原始消息，`"first"` — 仅在第一个消息块上进行回复引用（默认），`"all"` — 在每个块上进行回复引用。 |

### 配置文件（config.yaml）

`~/.hermes/config.yaml` 中的 `discord` 部分镜像了上述环境变量。Config.yaml 的设置作为默认值应用——如果等效的环境变量已设置，则环境变量胜出。

```yaml
# Discord 特定设置
discord:
  require_mention: true           # 在服务器频道中需要 @提及
  free_response_channels: ""      # 逗号分隔的频道 ID (或 YAML 列表)
  auto_thread: true               # @提及时自动创建线程
  reactions: true                 # 处理过程中添加表情符号反应
  ignored_channels: []            # 机器人永不回复的频道 ID
  no_thread_channels: []          # 机器人不创建线程的频道 ID
  channel_prompts: {}             # 每个频道的临时系统提示

# 会话隔离（适用于所有网关平台，不限于 Discord）
group_sessions_per_user: true     # 在共享频道中按用户隔离会话
```

#### `discord.require_mention`

**类型:** 布尔值 — **默认值:** `true`

启用后，机器人仅在服务器频道中被直接 `@提及` 时才回复。私信始终会回复，无论此设置如何。

#### `discord.free_response_channels`

**类型:** 字符串或列表 — **默认值:** `""`

机器人无需 `@提及` 即可回复所有消息的频道 ID。接受逗号分隔的字符串或 YAML 列表：

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

如果一个线程的父频道在此列表中，该线程也会成为无需提及的频道。

#### `discord.auto_thread`

**类型:** 布尔值 — **默认值:** `true`

启用后，常规文本频道中的每个 `@提及` 都会自动为对话创建一个新线程。这保持了主频道整洁，并为每个对话提供独立的会话历史记录。一旦创建了线程，该线程中的后续消息就不再需要 `@提及`——机器人知道它已经在参与了。

发送在现有线程或私信中的消息不受此设置影响。

#### `discord.reactions`

**类型:** 布尔值 — **默认值:** `true`

控制机器人是否会在消息中添加表情符号反应作为视觉反馈：
- 👀 在机器人开始处理您的消息时添加
- ✅ 在回复成功发送时添加
- ❌ 如果处理过程中发生错误，则添加

如果您觉得反应分散注意力，或者机器人的角色没有 **Add Reactions** 权限，请禁用此功能。

#### `discord.ignored_channels`

**类型:** 字符串或列表 — **默认值:** `[]`

机器人**永远不会**回复的频道 ID，即使被直接 `@提及`。这具有最高优先级——如果一个频道在此列表中，无论 `require_mention`、`free_response_channels` 还是任何其他设置如何，机器人都会静默忽略该频道的所有消息。

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

如果一个线程的父频道在此列表中，该线程中的消息也会被忽略。

#### `discord.no_thread_channels`

**类型:** 字符串或列表 — **默认值:** `[]`

机器人直接在频道中回复，而不是自动创建线程的频道 ID。这仅在 `auto_thread` 为 `true` 时生效。在这些频道中，机器人像普通消息一样内联回复，而不是生成新线程。

```yaml
discord:
  no_thread_channels:
    - 1234567890  # 机器人在此处内联回复
```

对于专门用于机器人交互的频道很有用，因为线程会增加不必要的噪音。

#### `discord.channel_prompts`

**类型:** 映射 — **默认值:** `{}`

每个频道的临时系统提示，这些提示在匹配的 Discord 频道或线程的每个回合中注入，但不会持久化到聊天记录历史中。

```yaml
discord:
  channel_prompts:
    "1234567890": |
      本频道用于研究任务。偏好深度比较、
      引用和简洁的综合。
    "9876543210": |
      此论坛用于疗愈式支持。保持温暖、接地气，
      并且不带评判性。
```

行为：
- 精确的线程/频道 ID 匹配优先。
- 如果消息出现在线程或论坛帖子中，而该线程没有明确的条目，Hermes 将回退到父频道/论坛 ID。
- 提示是在运行时临时应用的，因此更改它们会立即影响未来的回合，而无需重写过去的会话历史记录。

#### `group_sessions_per_user`

**类型:** 布尔值 — **默认值:** `true`

这是一个全局网关设置（不限于 Discord），控制同一频道中的用户是否获得隔离的会话历史记录。

当为 `true` 时：Alice 和 Bob 在 `#research` 中交谈，他们各自与 Hermes 拥有独立的对话。当为 `false` 时：整个频道共享一个对话记录和一个运行代理槽位。

```yaml
group_sessions_per_user: true
```

有关每种模式的完整影响，请参阅上面的 [会话模型在 Discord 中](#session-model-in-discord) 部分。

#### `display.tool_progress`

**类型:** 字符串 — **默认值:** `"all"` — **值:** `off`, `new`, `all`, `verbose`

控制机器人是否在处理过程中发送聊天进度消息（例如：“正在读取文件...”，“正在运行终端命令...”）。这是一个全局网关设置，适用于所有平台。

```yaml
display:
  tool_progress: "all"    # off | new | all | verbose
```

- `off` — 无进度消息
- `new` — 仅显示每个回合的第一个工具调用
- `all` — 显示所有工具调用（在网关消息中截断到 40 个字符）
- `verbose` — 显示完整的工具调用详细信息（可能会产生长消息）

#### `display.tool_progress_command`

**类型:** 布尔值 — **默认值:** `false`

启用后，使 `/verbose` 斜杠命令在网关中可用，让您无需编辑 config.yaml 即可循环切换工具进度模式（`off → new → all → verbose → off`）。

```yaml
display:
  tool_progress_command: true
```

## 交互式模型选择器

在 Discord 频道中发送 `/model` 且不带参数，即可打开基于下拉菜单的模型选择器：

1. **提供商选择** — 显示可用提供商的下拉选择器（最多 25 个）。
2. **模型选择** — 显示所选提供商的模型下拉选择器（最多 25 个）。

选择器在 120 秒后超时。只有授权用户（`DISCORD_ALLOWED_USERS` 中的用户）才能与之互动。如果您知道模型名称，请直接输入 `/model <名称>`。

## 技能的原生斜杠命令

Hermes 会自动将已安装的技能注册为**原生的 Discord 应用命令**。这意味着技能会出现在 Discord 的自动补全 `/` 菜单中，与内置命令并列。

- 每个技能都会成为一个 Discord 斜杠命令（例如，`/code-review`、`/ascii-art`）
- 技能接受可选的 `args` 字符串参数
- Discord 对每个机器人的应用命令有限制，为 100 个——如果您拥有的技能超过可用槽位，额外的技能将跳过，并在日志中发出警告
- 技能在机器人启动时与内置命令（如 `/model`、`/reset` 和 `/background`）一起注册

无需额外的配置——任何通过 `hermes skills install` 安装的技能都会在下次网关重启时自动注册为 Discord 斜杠命令。

## 主频道

您可以指定一个“主频道”，机器人会向该频道发送主动消息（例如定时任务输出、提醒和通知）。有两种方法设置它：

### 使用斜杠命令

在机器人存在的任何 Discord 频道中输入 `/sethome`。该频道将成为主频道。

### 手动配置

将以下内容添加到您的 `~/.hermes/.env`：

```bash
DISCORD_HOME_CHANNEL=123456789012345678
DISCORD_HOME_CHANNEL_NAME="#bot-updates"
```

将 ID 替换为实际的频道 ID（右键单击 → 使用开发者模式复制频道 ID）。

## 语音消息

Hermes Agent 支持 Discord 语音消息：

- **传入语音消息**：使用配置的 STT 提供商自动转录：本地 `faster-whisper`（无密钥）、Groq Whisper (`GROQ_API_KEY`) 或 OpenAI Whisper (`VOICE_TOOLS_OPENAI_KEY`)。
- **文本转语音**：使用 `/voice tts` 让机器人发送语音回复，同时发送文本回复。
- **Discord 语音频道**：Hermes 还可以加入语音频道，收听用户说话，并在频道中进行回复。

有关完整的设置和操作指南，请参阅：
- [语音模式](/docs/user-guide/features/voice-mode)
- [使用 Hermes 的语音模式](/docs/guides/use-voice-mode-with-hermes)

## 故障排除

### 机器人在线但未回复消息

**原因**：Message Content Intent 未启用。

**修复**：转到 [开发者门户](https://discord.com/developers/applications) → 您的应用 → Bot → Privileged Gateway Intents → 启用 **Message Content Intent** → 保存更改。重启网关。

### 启动时出现“不允许的意图”错误

**原因**：您的代码请求了在开发者门户中未启用的意图。

**修复**：在 Bot 设置中启用所有三个特权网关意图（Presence, Server Members, Message Content），然后重启。

### 机器人无法看到特定频道的消息

**原因**：机器人的角色没有查看该频道的权限。

**修复**：在 Discord 中，转到频道设置 → 权限 → 添加机器人的角色，并启用 **View Channel** 和 **Read Message History**。

### 403 Forbidden 错误

**原因**：机器人缺少必需的权限。

**修复**：使用步骤 5 中的 URL 重新邀请机器人并使用正确的权限，或者手动调整服务器设置 → 角色中机器人的角色权限。

### 机器人离线

**原因**：Hermes 网关未运行，或 Token 不正确。

**修复**：检查 `hermes gateway` 是否正在运行。验证您的 `.env` 文件中的 `DISCORD_BOT_TOKEN`。如果您最近重置了 Token，请更新它。

### “用户不允许”/机器人忽略您

**原因**：您的用户 ID 不在 `DISCORD_ALLOWED_USERS` 中。

**修复**：将您的用户 ID 添加到 `~/.hermes/.env` 的 `DISCORD_ALLOWED_USERS` 中，然后重启网关。

### 同一频道中的用户意外共享上下文

**原因**：`group_sessions_per_user` 已禁用，或者平台无法为该上下文中的消息提供用户 ID。

**修复**：在 `~/.hermes/config.yaml` 中设置此项，然后重启网关：

```yaml
group_sessions_per_user: true
```

如果您确实希望共享房间对话，请保持其关闭——只需预期共享的聊天记录和共享的干扰行为即可。

## 安全性

:::warning
始终设置 `DISCORD_ALLOWED_USERS` 以限制谁可以与机器人互动。没有它，网关默认会拒绝所有用户作为安全措施。只添加您信任的人的用户 ID——授权用户对代理的功能拥有完全访问权限，包括工具使用和系统访问。
:::

有关保护您的 Hermes Agent 部署的更多信息，请参阅 [安全指南](../security.md)。