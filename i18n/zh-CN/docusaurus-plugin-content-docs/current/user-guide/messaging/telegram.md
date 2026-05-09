---
sidebar_position: 1
title: "Telegram"
description: "将 Hermes 智能体设置为 Telegram 机器人"
---

# Telegram 设置

Hermes 智能体可以与 Telegram 集成，成为一个功能齐全的对话机器人。连接后，您可以从任何设备与您的智能体聊天，发送语音备忘录并自动转录，接收定时任务结果，并在群聊中使用该智能体。该集成基于 [python-telegram-bot](https://python-telegram-bot.org/)，支持文本、语音、图像和文件附件。

## 步骤 1：通过 BotFather 创建一个机器人

每个 Telegram 机器人都需要一个由 [@BotFather](https://t.me/BotFather)（Telegram 官方机器人管理工具）颁发的 API 令牌。

1. 打开 Telegram 并搜索 **@BotFather**，或访问 [t.me/BotFather](https://t.me/BotFather)
2. 发送 `/newbot`
3. 选择一个**显示名称**（例如：“Hermes 智能体”）——可以是任何名称
4. 选择一个**用户名**——必须是唯一的，并以 `bot` 结尾（例如：`my_hermes_bot`）
5. BotFather 会回复您的 **API 令牌**。它看起来像这样：

```
123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
```

:::warning
请保管好您的机器人令牌。任何人拥有此令牌都可以控制您的机器人。如果泄露，请立即通过 BotFather 中的 `/revoke` 命令撤销它。
:::

## 步骤 2：自定义你的机器人（可选）

这些 BotFather 命令可以改善用户体验。向 @BotFather 发送消息并使用：

| 命令 | 用途 |
|---------|---------|
| `/setdescription` | 用户开始聊天前显示的“这个机器人能做什么？”文本 |
| `/setabouttext` | 机器人个人资料页面上的简短文本 |
| `/setuserpic` | 为你的机器人上传头像 |
| `/setcommands` | 定义命令菜单（聊天中的 `/` 按钮） |
| `/setprivacy` | 控制机器人是否能看到所有群组消息（参见步骤 3） |

:::提示
对于 `/setcommands`，一个有用的初始命令集：

```
help - 显示帮助信息
new - 开始新的对话
sethome - 将此聊天设置为家庭频道
```
:::

## 步骤 3：隐私模式（对群组至关重要）

Telegram 机器人有一个**隐私模式**，**默认启用**。这是在群组中使用机器人时最常见的困惑来源。

**隐私模式开启时**，你的机器人只能看到：
- 以 `/` 命令开头的消息
- 直接回复机器人自己消息的消息
- 服务消息（成员加入/离开、置顶消息等）
- 机器人是管理员的频道中的消息

**隐私模式关闭时**，机器人会收到群组中的每条消息。

### 如何禁用隐私模式

1. 向 **@BotFather** 发送消息  
2. 发送 `/mybots`  
3. 选择你的机器人  
4. 进入 **机器人设置 → 群组隐私 → 关闭**

:::警告
**更改隐私设置后，你必须从任何群组中移除并重新添加机器人**。Telegram 在机器人加入群组时会缓存隐私状态，只有在机器人被移除并重新添加后才会更新。
:::

:::提示
禁用隐私模式的替代方案：将机器人提升为**群组管理员**。管理员机器人无论隐私设置如何都会收到所有消息，这样可以避免切换全局隐私模式。
:::

## 步骤 4：查找你的用户 ID

Hermes 智能体使用数字 Telegram 用户 ID 来控制访问。你的用户 ID **不是**你的用户名，而是一个像 `123456789` 这样的数字。

**方法 1（推荐）：** 向 [@userinfobot](https://t.me/userinfobot) 发送消息，它会立即回复你的用户 ID。

**方法 2：** 向 [@get_id_bot](https://t.me/get_id_bot) 发送消息，这是另一个可靠的选择。

保存这个数字，下一步会用到它。

## 步骤 5：配置 Hermes

### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

提示时选择 **Telegram**。向导会询问你的机器人令牌和允许的用户 ID，然后为你写入配置。

### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env`：

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_ALLOWED_USERS=123456789    # 多个用户用逗号分隔
```

### 启动网关

```bash
hermes gateway
```

机器人应该在几秒钟内上线。在 Telegram 上向它发送一条消息以验证。

## 从 Docker 支持的终端发送生成的文件

如果你的终端后端是 `docker`，请注意 Telegram 附件是由**网关进程**发送的，而不是从容器内部发送的。这意味着最终的 `MEDIA:/...` 路径必须在网关运行的宿主机上可读。

常见陷阱：

- 智能体在 Docker 内部将文件写入 `/workspace/report.txt`  
- 模型输出 `MEDIA:/workspace/report.txt`  
- Telegram 发送失败，因为 `/workspace/report.txt` 只存在于容器中，而不在宿主机上

推荐模式：

```yaml
terminal:
  backend: docker
  docker_volumes:
    - "/home/user/.hermes/cache/documents:/output"
```

然后：

- 在 Docker 内部将文件写入 `/output/...`  
- 在 `MEDIA:` 中输出**宿主机可见**的路径，例如：  
  `MEDIA:/home/user/.hermes/cache/documents/report.txt`

如果你已经有 `docker_volumes:` 部分，请将新的挂载添加到同一个列表中。YAML 中的重复键会静默覆盖之前的键。

### 支持的 `MEDIA:` 文件扩展名

网关从智能体回复中提取 `MEDIA:/path/to/file` 标签，并将引用的文件作为平台原生附件发送。所有网关平台支持的扩展名：

| 类别 | 扩展名 |
|---|---|
| 图像 | `png`, `jpg`, `jpeg`, `gif`, `webp`, `bmp`, `tiff`, `svg` |
| 音频 | `mp3`, `wav`, `ogg`, `m4a`, `opus`, `flac`, `aac` |
| 视频 | `mp4`, `mov`, `webm`, `mkv`, `avi` |
| **文档** | `pdf`, `txt`, `md`, `csv`, `json`, `xml`, `html`, `yaml`, `yml`, `log` |
| **办公** | `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp` |
| **压缩包** | `zip`, `rar`, `7z`, `tar`, `gz`, `bz2` |
| **书籍 / 包** | `epub`, `apk`, `ipa` |

此列表中的任何内容都会作为原生附件在支持的平台（Telegram、Discord、Signal、Slack、WhatsApp、飞书、Matrix 等）上发送；在不支持原生附件的平台上，会回退到链接或纯文本指示符。**加粗**的类别是在最近几个版本中新增的 —— 如果你之前依赖模型输出 `here is the file: /path/to/report.docx`，请改用 `MEDIA:/path/to/report.docx` 以实现原生发送。

## Webhook 模式

默认情况下，Hermes 使用**长轮询**连接到 Telegram —— 网关向 Telegram 的服务器发出出站请求以获取新的更新。这对于本地和始终在线的部署效果很好。

对于**云端部署**（Fly.io、Railway、Render 等），**Webhook 模式**更节省成本。这些平台可以在入站 HTTP 流量时自动唤醒暂停的机器，但不能在出站连接时唤醒。由于轮询是出站的，轮询机器人永远无法休眠。Webhook 模式会反转方向 —— Telegram 将更新推送到你的机器人的 HTTPS URL，从而实现空闲时休眠的部署。

| | 轮询（默认） | Webhook |
|---|---|---|
| 方向 | 网关 → Telegram（出站） | Telegram → 网关（入站） |
| 最适合 | 本地、始终在线的服务器 | 支持自动唤醒的云平台 |
| 设置 | 无需额外配置 | 设置 `TELEGRAM_WEBHOOK_URL` |
| 空闲成本 | 机器必须保持运行 | 机器可以在消息之间休眠 |

### 配置

将以下内容添加到 `~/.hermes/.env`：

```bash
TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
TELEGRAM_WEBHOOK_SECRET="$(openssl rand -hex 32)"  # 必需
# TELEGRAM_WEBHOOK_PORT=8443        # 可选，默认为 8443
```

| 变量 | 必需 | 描述 |
|----------|----------|-------------|
| `TELEGRAM_WEBHOOK_URL` | 是 | Telegram 将发送更新的公共 HTTPS URL。URL 路径会自动提取（例如，上面示例中的 `/telegram`）。 |
| `TELEGRAM_WEBHOOK_SECRET` | **是**（当设置了 `TELEGRAM_WEBHOOK_URL` 时） | Telegram 在每个 webhook 请求中回显的密钥，用于验证。网关没有它就无法启动 —— 参见 [GHSA-3vpc-7q5r-276h](https://github.com/NousResearch/hermes-agent/security/advisories/GHSA-3vpc-7q5r-276h)。使用 `openssl rand -hex 32` 生成。 |
| `TELEGRAM_WEBHOOK_PORT` | 否 | Webhook 服务器监听的本地端口（默认：`8443`）。 |

当设置了 `TELEGRAM_WEBHOOK_URL` 时，网关会启动一个 HTTP webhook 服务器而不是轮询。当未设置时，使用轮询模式 —— 与以前版本的行为没有变化。

### 云端部署示例（Fly.io）

1. 将环境变量添加到你的 Fly.io 应用密钥中：

```bash
fly secrets set TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
fly secrets set TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

2. 在 `fly.toml` 中暴露 webhook 端口：

```toml
[[services]]
  internal_port = 8443
  protocol = "tcp"

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

3. 部署：

```bash
fly deploy
```

网关日志应显示：`[telegram] Connected to Telegram (webhook mode)`。

## 代理支持

如果 Telegram 的 API 被阻止，或者你需要通过代理路由流量，请设置一个 Telegram 特定的代理 URL。这优先于通用的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量。

**选项 1：config.yaml（推荐）**

```yaml
telegram:
  proxy_url: "socks5://127.0.0.1:1080"
```

**选项 2：环境变量**

```bash
TELEGRAM_PROXY=socks5://127.0.0.1:1080
```

支持的协议：`http://`、`https://`、`socks5://`。

代理适用于主 Telegram 连接和回退 IP 传输。如果未设置 Telegram 特定的代理，网关会回退到 `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`（或 macOS 系统代理自动检测）。

## 家庭频道

在任何 Telegram 聊天（私信或群组）中使用 `/sethome` 命令，将其指定为**家庭频道**。计划任务（cron 作业）会将结果发送到此频道。

你也可以在 `~/.hermes/.env` 中手动设置：

```bash
TELEGRAM_HOME_CHANNEL=-1001234567890
TELEGRAM_HOME_CHANNEL_NAME="My Notes"
```

:::提示
群组聊天 ID 是负数（例如，`-1001234567890`）。你的个人私信聊天 ID 与你的用户 ID 相同。
:::

## 语音消息

### 传入语音（语音转文本）

你在 Telegram 上发送的语音消息会自动由 Hermes 配置的 STT 提供程序转录，并作为文本注入对话中。

- `local` 使用运行 Hermes 的机器上的 `faster-whisper` —— 无需 API 密钥  
- `groq` 使用 Groq Whisper，需要 `GROQ_API_KEY`  
- `openai` 使用 OpenAI Whisper，需要 `VOICE_TOOLS_OPENAI_KEY`

### 传出语音（文本转语音）

当智能体通过 TTS 生成音频时，它会作为 Telegram 原生的**语音气泡**发送 —— 即那种圆形的、可内联播放的类型。

- **OpenAI 和 ElevenLabs** 原生生成 Opus —— 无需额外设置  
- **Edge TTS**（默认免费提供程序）输出 MP3，需要 **ffmpeg** 转换为 Opus：

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

如果没有 ffmpeg，Edge TTS 音频会作为常规音频文件发送（仍然可播放，但使用矩形播放器而不是语音气泡）。

在 `config.yaml` 的 `tts.provider` 键下配置 TTS 提供程序。

## 群聊使用

Hermes 智能体可以在 Telegram 群聊中使用，但需要注意以下几点：

- **隐私模式**决定了机器人能看到哪些消息（参见[第 3 步](#step-3-privacy-mode-critical-for-groups)）
- `TELEGRAM_ALLOWED_USERS` 仍然有效——即使在群聊中，也只有授权用户才能触发机器人
- 您可以使用 `telegram.require_mention: true` 防止机器人响应普通的群聊消息
- 当 `telegram.require_mention: true` 时，群聊消息在以下情况下会被接受：
  - 回复机器人某条消息的消息
  - `@botusername` 提及
  - `/command@botusername`（Telegram 的机器人菜单命令形式，包含机器人名称）
  - 匹配您在 `telegram.mention_patterns` 中配置的某个正则唤醒词
- 使用 `telegram.ignored_threads` 可以让 Hermes 在特定的 Telegram 论坛主题中保持沉默，即使群聊允许自由回复或提及触发回复
- 如果 `telegram.require_mention` 未设置或为 false，Hermes 将保持之前的开放群聊行为，并响应它能看到的普通群聊消息

### 故障排除：在私聊中工作，但在群聊中不工作

如果机器人在私聊中响应，但在群聊中保持沉默，请按顺序检查以下关卡：

1. **Telegram 投递：**关闭 BotFather 隐私模式，将机器人提升为管理员，或直接提及机器人。Hermes 无法响应 Telegram 从未投递给机器人的群聊消息。
2. **更改隐私后重新加入：**在更改 BotFather 隐私设置后，将机器人从群聊中移除，然后再次添加。Telegram 可能会对现有成员资格保持旧的投递行为。
3. **Hermes 授权：**确保发送者在 `TELEGRAM_ALLOWED_USERS` 或 `TELEGRAM_GROUP_ALLOWED_USERS` 中列出，或者使用 `TELEGRAM_GROUP_ALLOWED_CHATS` 允许该群聊。
4. **提及过滤器：**如果设置了 `telegram.require_mention: true`，则除非消息是斜杠命令、回复机器人、`@botusername` 提及或配置的 `mention_patterns` 匹配，否则普通群聊消息将被忽略。

负数的聊天 ID 对于 Telegram 群聊和超级群聊是正常的。如果使用基于聊天的授权，请将这些 ID 放入 `TELEGRAM_GROUP_ALLOWED_CHATS`，而不是发送者用户白名单。

### 群聊触发器配置示例

将此内容添加到 `~/.hermes/config.yaml`：

```yaml
telegram:
  require_mention: true
  mention_patterns:
    - "^\\s*chompy\\b"
  ignored_threads:
    - 31
    - "42"
```

此示例允许所有通常的直接触发器，以及以 `chompy` 开头的消息，即使它们不使用 `@提及`。
在 Telegram 主题 `31` 和 `42` 中的消息在提及和自由回复检查运行之前总是被忽略。

### 关于 `mention_patterns` 的说明

- 模式使用 Python 正则表达式
- 匹配不区分大小写
- 模式会针对文本消息和媒体说明进行检查
- 无效的正则表达式模式会被忽略，并在网关日志中发出警告，而不是导致机器人崩溃
- 如果您希望模式仅在消息开头匹配，请使用 `^` 锚定它

## 私聊主题（Bot API 9.4）

Telegram Bot API 9.4（2026 年 2 月）引入了**私聊主题**——机器人可以直接在 1 对 1 私聊中创建类似论坛的主题线程，无需超级群聊。这让您可以在现有的与 Hermes 的私聊中运行多个隔离的工作区。

### 用例

如果您有几个长期运行的项目，主题可以保持它们的上下文分离：

- **主题“网站”** —— 处理您的生产 Web 服务
- **主题“研究”** —— 文献综述和论文探索
- **主题“常规”** —— 杂项任务和快速问题

每个主题都有自己的对话会话、历史和上下文——完全与其他主题隔离。

### 配置

:::caution 先决条件
在向配置添加主题之前，用户必须在与机器人的私聊中**启用主题模式**：

1. 在 Telegram 中打开您与 Hermes 机器人的私聊
2. 点击顶部的机器人名称以打开聊天信息
3. 启用**主题**（将聊天切换为论坛的开关）

如果没有此设置，Hermes 将在启动时记录 `The chat is not a forum` 并跳过主题创建。这是一个 Telegram 客户端设置——机器人无法以编程方式启用它。
:::

在 `~/.hermes/config.yaml` 的 `platforms.telegram.extra.dm_topics` 下添加主题：

```yaml
platforms:
  telegram:
    extra:
      dm_topics:
      - chat_id: 123456789        # 您的 Telegram 用户 ID
        topics:
        - name: General
          icon_color: 7322096
        - name: Website
          icon_color: 9367192
        - name: Research
          icon_color: 16766590
          skill: arxiv              # 在此主题中自动加载一个技能
```

**字段：**

| 字段 | 必填 | 描述 |
|-------|----------|-------------|
| `name` | 是 | 主题显示名称 |
| `icon_color` | 否 | Telegram 图标颜色代码（整数） |
| `icon_custom_emoji_id` | 否 | 主题图标的自定义表情符号 ID |
| `skill` | 否 | 在此主题的新会话中自动加载的技能 |
| `thread_id` | 否 | 主题创建后自动填充——不要手动设置 |

### 工作原理

1. 在网关启动时，Hermes 为每个尚未拥有 `thread_id` 的主题调用 `createForumTopic`
2. `thread_id` 会自动保存回 `config.yaml`——后续重启将跳过 API 调用
3. 每个主题映射到一个隔离的会话键：`agent:main:telegram:dm:{chat_id}:{thread_id}`
4. 每个主题中的消息都有自己独立的对话历史、内存刷新和上下文窗口

### 技能绑定

带有 `skill` 字段的主题在新会话开始时会自动加载该技能。这就像在对话开始时输入 `/skill-name` 一样——技能内容被注入到第一条消息中，后续消息会在对话历史中看到它。

例如，一个带有 `skill: arxiv` 的主题，每当其会话重置时（由于空闲超时、每日重置或手动 `/reset`），都会预加载 arxiv 技能。

:::tip
在配置之外创建的主题（例如，通过手动调用 Telegram API）会在 `forum_topic_created` 服务消息到达时自动被发现。您也可以在网关运行时向配置添加主题——它们将在下一次缓存未命中时被拾取。
:::

## 多会话 DM 模式 (`/topic`)

一种类似 ChatGPT 的多会话 DM —— 一个机器人，多个并行对话。与上述由操作员管理的 `extra.dm_topics` 不同，此模式是**用户驱动的**：无需配置，也无需预先声明话题名称。最终用户通过 `/topic` 开启该模式，然后点击 Telegram 的 **+** 按钮创建任意数量的话题，每个话题都是一个完全独立的 Hermes 会话。

### `/topic` 子命令

| 形式 | 上下文 | 效果 |
|------|---------|--------|
| `/topic` | 根 DM，尚未启用 | 检查 BotFather 功能，启用多会话模式，创建置顶的 System 话题 |
| `/topic` | 根 DM，已启用 | 显示状态：可恢复的未关联会话 |
| `/topic` | 在某个话题内 | 显示当前话题的会话绑定 |
| `/topic help` | 任意位置 | 内联使用说明 |
| `/topic off` | 根 DM | 禁用多会话模式并清除此聊天中的所有话题绑定 |
| `/topic <session-id>` | 在某个话题内 | 将之前的 Telegram 会话恢复到当前话题 |

只有授权用户（通过 `TELEGRAM_ALLOWED_USERS` / 平台认证配置的白名单）才能运行 `/topic`。未经授权的发送者会收到拒绝响应，而不是激活提示。

### DM 话题 vs 多会话 DM 模式

| | `extra.dm_topics`（配置驱动） | `/topic`（用户驱动） |
|---|---|---|
| 谁激活 | 操作员，在 `config.yaml` 中 | 最终用户，通过发送 `/topic` |
| 话题列表 | 配置中声明的固定集合 | 用户自由创建/删除话题 |
| 话题名称 | 由操作员选择 | 由用户选择；自动重命名以匹配 Hermes 会话标题 |
| 根 DM 行为 | 保持不变 —— 正常聊天 | 变为系统大厅（非命令消息会被拒绝） |
| 主要用途 | 可选技能绑定的永久工作区 | 临时并行会话 |
| 持久性 | `extra.dm_topics` 配置项 | `telegram_dm_topic_mode` + `telegram_dm_topic_bindings` SQLite 表 |

这两个功能可以在同一个机器人上共存 —— 你可以从用户的 DM 中运行 `/topic`，而 `extra.dm_topics` 继续管理其他聊天中由操作员声明的话题。

### 先决条件

在 **@BotFather** 中，打开你的机器人 → **机器人设置 → 话题设置**：

1. 开启 **话题模式**（启用 `has_topics_enabled`）
2. **不要**禁用用户创建话题（保持 `allows_users_to_create_topics` 开启）

当用户首次运行 `/topic` 时，Hermes 会调用 `getMe` 来验证这两个标志。如果任一标志为关闭状态，Hermes 会发送 BotFather 话题设置页面的截图，并说明需要切换哪些设置 —— 在满足先决条件之前不会进行激活。

### 激活流程

从根 DM 发送：

```
/topic
```

Hermes 将：

1. 检查 `getMe().has_topics_enabled` 和 `allows_users_to_create_topics`
2. 如果两者均为 true，则为此 DM 启用多会话话题模式
3. 创建并置顶一个 **System** 话题用于状态/命令（尽力而为）
4. 回复一个列表，列出用户可以恢复的之前未关联的 Telegram 会话

激活后，**根 DM 变为大厅**：普通提示会被拒绝，并引导用户前往 **All Messages**。系统命令（`/status`、`/sessions`、`/usage`、`/help` 等）仍然可以在根 DM 中使用。

### 创建新话题（最终用户流程）

1. 在 Telegram 中打开机器人 DM
2. 点击机器人界面顶部的 **All Messages**，然后发送任意消息
3. Telegram 会为该消息创建一个新话题
4. Hermes 在该话题内回复 —— 该话题现在成为一个独立会话

每个话题都有自己的对话历史、模型状态、工具执行和会话 ID。隔离键为 `agent:main:telegram:dm:{chat_id}:{thread_id}` —— 与配置驱动的 DM 话题隔离方式相同。

### 自动重命名话题

当 Hermes 为某个话题生成会话标题时（通过自动标题流水线，在首次交互后），Telegram 话题本身也会被重命名以匹配 —— 例如，“New Topic” 变为 “Database migration plan”。重命名是尽力而为的：失败会被记录，但不会破坏会话。

### 话题内的 `/new`

重置当前话题的会话（新会话 ID，全新历史），而不影响其他话题。Hermes 会提醒你，对于并行工作，通常你更希望创建另一个话题（通过 **All Messages**）。

### 恢复之前的会话

在某个话题内发送：

```
/topic <session-id>
```

这会将当前话题绑定到现有的 Hermes 会话，而不是重新开始。适用于继续一个在话题模式启用之前开始的对话。限制条件：

- 目标会话必须属于同一个 Telegram 用户
- 目标会话不能已经绑定到其他话题

Hermes 会通过会话标题确认，并重播上一条助手消息以提供上下文。

要发现会话 ID，请在根 DM 中发送 `/topic`（无参数）—— Hermes 会列出用户的未关联 Telegram 会话。

### 话题内的 `/topic`（无参数）

显示当前话题的绑定信息：会话标题、会话 ID，以及 `/new` 与创建另一个话题的提示。

### 底层实现

- 激活状态会持久化到 `state.db` 中的 `telegram_dm_topic_mode(chat_id, user_id, enabled, ...)` 表
- 每个话题绑定会持久化到 `telegram_dm_topic_bindings(chat_id, thread_id, session_id, ...)` 表，并在 `session_id` 上设置 `ON DELETE CASCADE` —— 删除会话时会自动清除其话题绑定
- 话题模式的 SQLite 迁移是**可选的**：它只在首次调用 `/topic` 时运行，永远不会在网关启动时运行。在该配置文件中用户运行 `/topic` 之前，`state.db` 不会发生变化
- 每个入站 DM 消息都会查找其 `(chat_id, thread_id)` 绑定。如果存在，查找会通过 `SessionStore.switch_session()` 将消息路由到绑定的会话，从而确保磁盘上的会话键到会话 ID 的映射保持一致
- 话题内的 `/new` 会重写绑定行，使其指向新的会话 ID，因此下一条消息会保持在新的会话上
- 在 `extra.dm_topics` 中声明的话题**永远不会被自动重命名** —— 即使启用了多会话模式，操作员选择的名称也会被保留
- 在启用论坛功能的 DM 中，General（置顶顶部）话题被视为根大厅，无论 Telegram 是否使用 `message_thread_id=1` 或不使用 thread_id 传递其消息
- 根大厅提醒会被限流，每 30 秒每条聊天最多一条消息 —— 即使用户忘记话题模式已开启并在根 DM 中输入十条提示，也不会收到十条回复
- BotFather 设置截图会被限流，每 5 分钟每条聊天最多发送一次 —— 如果话题设置仍处于禁用状态，重复尝试 `/topic` 不会重新上传同一张图片
- 在话题内启动的 `/background <prompt>` 会将其结果返回到同一话题；后台会话不会触发所属话题的自动重命名
- `/topic` 本身受机器人的用户授权检查限制 —— 未经授权的 DM 会收到拒绝响应，而不是激活提示

### 禁用多会话模式

在根 DM 中发送 `/topic off`。Hermes 会将对应行设为关闭状态，清除聊天的 `(thread_id → session_id)` 绑定，根 DM 将恢复为正常的 Hermes 聊天。Telegram 中现有的话题不会被删除 —— 它们只是不再作为独立会话进行隔离。稍后重新运行 `/topic` 可以再次开启该模式。

如果你需要手动清理（例如，跨多个聊天进行批量重置），请直接删除这些行：

```bash
sqlite3 ~/.hermes/state.db \
  "UPDATE telegram_dm_topic_mode SET enabled = 0 WHERE chat_id = '<your_chat_id>'; \
   DELETE FROM telegram_dm_topic_bindings WHERE chat_id = '<your_chat_id>';"
```

### 降级 Hermes

如果你降级到早于 `/topic` 功能的 Hermes 版本，该功能将 simply 停止工作 —— `telegram_dm_topic_mode` 和 `telegram_dm_topic_bindings` 表仍会保留在 `state.db` 中，但旧代码会忽略它们。DM 将恢复为原生的每线程隔离（每个 `message_thread_id` 仍通过 `build_session_key` 获得自己的会话），因此你现有的 Telegram 话题仍会作为并行会话继续工作。根 DM 不再是 大厅 —— 那里的消息会像以前一样进入智能体。重新升级会 exactly 在你之前的位置重新激活多会话模式。

## 群组论坛主题技能绑定

启用了**主题模式**（也称为“论坛主题”）的超级群组已经实现了每个主题下的会话隔离——每个 `thread_id` 都映射到其独立的对话。但是，您可能希望在特定群组主题中收到消息时**自动加载某个技能**，就像私聊主题技能绑定一样。

### 使用场景

一个团队超级群组，其论坛主题对应不同的工作流：

- **工程**主题 → 自动加载 `software-development` 技能
- **研究**主题 → 自动加载 `arxiv` 技能
- **常规**主题 → 无技能，通用助手

### 配置

在 `~/.hermes/config.yaml` 的 `platforms.telegram.extra.group_topics` 下添加主题绑定：

```yaml
platforms:
  telegram:
    extra:
      group_topics:
      - chat_id: -1001234567890       # 超级群组 ID
        topics:
        - name: Engineering
          thread_id: 5
          skill: software-development
        - name: Research
          thread_id: 12
          skill: arxiv
        - name: General
          thread_id: 1
          # 无技能 — 通用用途
```

**字段说明：**

| 字段 | 是否必需 | 描述 |
|-------|----------|-------------|
| `chat_id` | 是 | 超级群组的数字 ID（以 `-100` 开头的负数） |
| `name` | 否 | 主题的人类可读标签（仅用于信息展示） |
| `thread_id` | 是 | Telegram 论坛主题 ID — 在 `t.me/c/<group_id>/<thread_id>` 链接中可见 |
| `skill` | 否 | 在此主题的新会话中自动加载的技能 |

### 工作原理

1. 当消息到达已映射的群组主题时，Hermes 会在 `group_topics` 配置中查找 `chat_id` 和 `thread_id`
2. 如果匹配的条目包含 `skill` 字段，则该技能会被自动加载到会话中 — 与私聊主题技能绑定完全相同
3. 没有 `skill` 键的主题仅获得会话隔离（现有行为，未改变）
4. 未映射的 `thread_id` 值或 `chat_id` 值会静默跳过 — 无错误，无技能加载

### 与私聊主题的区别

| | 私聊主题 | 群组主题 |
|---|---|---|
| 配置键 | `extra.dm_topics` | `extra.group_topics` |
| 主题创建 | 如果缺少 `thread_id`，Hermes 会通过 API 创建主题 | 管理员在 Telegram UI 中创建主题 |
| `thread_id` | 创建后自动填充 | 必须手动设置 |
| `icon_color` / `icon_custom_emoji_id` | 支持 | 不适用（外观由管理员控制） |
| 技能绑定 | ✓ | ✓ |
| 会话隔离 | ✓ | ✓（论坛主题已内置此功能） |

:::提示
要查找主题的 `thread_id`，请在 Telegram 网页版或桌面版中打开该主题，并查看 URL：`https://t.me/c/1234567890/5` — 最后一个数字（`5`）即为 `thread_id`。超级群组的 `chat_id` 是群组 ID 前加上 `-100`（例如，群组 `1234567890` 变为 `-1001234567890`）。
:::

## 近期 Bot API 功能

- **Bot API 9.4（2026 年 2 月）：** 私聊主题 — 机器人现在可以通过 `createForumTopic` 在 1 对 1 私聊中创建论坛主题。Hermes 将此功能用于两个不同的特性：由操作员策划的[私聊主题](#private-chat-topics-bot-api-94)（配置驱动，固定主题列表）和由用户驱动的[多会话私聊模式](#multi-session-dm-mode-topic)（通过 `/topic` 激活，用户可创建无限数量的主题）。
- **隐私政策：** Telegram 现在要求机器人必须拥有隐私政策。请通过 BotFather 使用 `/setprivacy_policy` 命令设置，否则 Telegram 可能会自动生成一个占位符。如果您的机器人是面向公众的，这一点尤为重要。
- **消息流式传输：** Bot API 9.x 增加了对长响应流式传输的支持，这可以改善智能体回复较长时的感知延迟。

## 渲染：表格与链接预览

Telegram 的 MarkdownV2 没有原生表格语法——如果直接传递管道表格，它们会渲染成转义后的乱码。Hermes 会自动规范化 Markdown 表格：

- **小型表格**会被展平为**行组项目符号**——每一行在列标题下变成一个可读的项目符号列表。适用于 2–4 列且单元格内容较短的情况。
- **较大或较宽的表格**则回退到**围栏代码块**，并保持列对齐，以避免内容坍塌。同时会添加一行提示，让智能体知道在 Telegram 上应优先使用文本回复，而不是继续输出更多表格。

无需任何配置——适配器会根据每条消息自动选择合适的回退方式。如果你希望使用传统的“始终使用代码块”行为，请在 `config.yaml` 中设置 `telegram.pretty_tables: false` 来禁用表格规范化（默认值为 `true`）。

**链接预览。** Telegram 会自动为机器人消息中的 URL 生成链接预览。如果你希望禁用此功能（例如 `/tools` 输出过长、智能体回复中提及十个链接等情况）：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        disable_link_previews: true
```

启用后，Hermes 会在每条外发消息中附加 Telegram 的 `LinkPreviewOptions(is_disabled=True)`，并在较旧版本的 `python-telegram-bot` 上回退到传统的 `disable_web_page_preview` 参数。

## 群组白名单

Telegram 群组和论坛聊天有两个相互独立的访问控制项可供配置：

- **发送者用户 ID**（`group_allow_from` / `TELEGRAM_GROUP_ALLOWED_USERS`）——仅适用于群组/论坛消息的发送者范围白名单。当你希望特定用户能够在群组中调用机器人，但不想将他们添加到 `TELEGRAM_ALLOWED_USERS`（这也会赋予他们私聊访问权限）时，请使用此选项。
- **聊天 ID**（`group_allowed_chats` / `TELEGRAM_GROUP_ALLOWED_CHATS`）——聊天范围白名单。这些群组/论坛的任何成员都可以与机器人交互。适用于团队/支持类机器人，其中群组 membership 本身就是访问信号。

```yaml
gateway:
  platforms:
    telegram:
      extra:
        # 全局访问（私聊 + 群组）。此处列出的用户始终可以调用机器人。
        allow_from:
          - "123456789"
        # 仅在群组/论坛中允许的发送者 ID。不会授予私聊访问权限。
        group_allow_from:
          - "987654321"
        # 整个群组/论坛——任何成员均被授权。
        group_allowed_chats:
          - "-1001234567890"
```

等效的环境变量：

```bash
TELEGRAM_ALLOWED_USERS="123456789"
TELEGRAM_GROUP_ALLOWED_USERS="987654321"
TELEGRAM_GROUP_ALLOWED_CHATS="-1001234567890"
```

行为说明：

- `TELEGRAM_ALLOWED_USERS` 涵盖所有聊天类型（私聊、群组、论坛）。
- `TELEGRAM_GROUP_ALLOWED_USERS` 仅授权在群组/论坛中列出的发送者。除非他们也被列入 `TELEGRAM_ALLOWED_USERS`，否则仍无法与机器人进行私聊。
- 列入 `TELEGRAM_GROUP_ALLOWED_CHATS` 的聊天会授权该聊天的所有成员，无论发送者是谁。
- 在这些变量中的任意一个使用 `*` 可以允许任何发送者/聊天。
- 此功能叠加在现有的提及/模式触发器之上，也叠加在 `group_topics` + `ignored_threads` 之上。

### 从 PR #17686 之前的版本迁移

在此次拆分之前，`TELEGRAM_GROUP_ALLOWED_USERS` 是唯一的配置项，用户将**聊天 ID**放入其中。为了保持向后兼容性，`TELEGRAM_GROUP_ALLOWED_USERS` 中形似聊天 ID 的值（以 `-` 开头）仍会被视为聊天 ID，并记录一次弃用警告。迁移方法如下：

```bash
# 旧方式（仍有效，但已弃用）
TELEGRAM_GROUP_ALLOWED_USERS="-1001234567890"

# 新方式
TELEGRAM_GROUP_ALLOWED_CHATS="-1001234567890"
```

## 交互式模型选择器

当你在 Telegram 聊天中发送不带参数的 `/model` 命令时，Hermes 会显示一个用于切换模型的交互式内联键盘：

1. **提供商选择**——显示每个可用提供商的按钮，并附带模型数量（例如，“OpenAI (15)”、“✓ Anthropic (12)”表示当前提供商）。
2. **模型选择**——分页的模型列表，带有**上一页**/**下一页**导航、一个**返回**按钮以回到提供商列表，以及**取消**按钮。

当前模型和提供商会显示在顶部。所有导航操作都是通过就地编辑同一条消息完成的（不会造成聊天界面混乱）。

:::tip
如果你知道确切的模型名称，可以直接输入 `/model <名称>` 以跳过选择器。你也可以输入 `/model <名称> --global` 来跨会话持久化此更改。
:::

## DNS-over-HTTPS 回退 IP

在某些受限网络中，`api.telegram.org` 可能会解析为一个无法访问的 IP。Telegram 适配器包含一种**回退 IP**机制，该机制在保留正确 TLS 主机名和 SNI 的同时，透明地尝试连接其他 IP。

### 工作原理

1. 如果设置了 `TELEGRAM_FALLBACK_IPS`，则直接使用这些 IP。
2. 否则，适配器会自动通过 DNS-over-HTTPS (DoH) 查询 **Google DNS** 和 **Cloudflare DNS**，以发现 `api.telegram.org` 的其他 IP。
3. DoH 返回的、与系统 DNS 结果不同的 IP 会被用作回退 IP。
4. 如果 DoH 也被阻止，则会使用一个硬编码的种子 IP（`149.154.167.220`）作为最后手段。
5. 一旦某个回退 IP 连接成功，它就会变为“粘性”——后续请求会直接使用它，而不再首先尝试主路径。

### 配置

```bash
# 显式指定回退 IP（逗号分隔）
TELEGRAM_FALLBACK_IPS=149.154.167.220,149.154.167.221
```

或者在 `~/.hermes/config.yaml` 中：

```yaml
platforms:
  telegram:
    extra:
      fallback_ips:
        - "149.154.167.220"
```

:::tip
通常你不需要手动配置此功能。通过 DoH 的自动发现机制可以处理大多数受限网络场景。只有当你的网络也阻止了 DoH 时，才需要设置 `TELEGRAM_FALLBACK_IPS` 环境变量。
:::

## 代理支持

如果你的网络需要通过 HTTP 代理才能访问互联网（常见于企业环境），Telegram 适配器会自动读取标准的代理环境变量，并通过代理路由所有连接。

### 支持的变量

适配器按以下顺序检查这些环境变量，使用第一个已设置的变量：

1. `HTTPS_PROXY`
2. `HTTP_PROXY`
3. `ALL_PROXY`
4. `https_proxy` / `http_proxy` / `all_proxy`（小写变体）

### 配置

在启动网关之前，在环境中设置代理：

```bash
export HTTPS_PROXY=http://proxy.example.com:8080
hermes gateway
```

或者将其添加到 `~/.hermes/.env`：

```bash
HTTPS_PROXY=http://proxy.example.com:8080
```

代理适用于主传输和所有回退 IP 传输。无需额外的 Hermes 配置——只要环境变量已设置，就会自动使用。

:::note
这涵盖了 Hermes 用于 Telegram 连接的自定义回退传输层。其他地方使用的标准 `httpx` 客户端本身就已原生支持代理环境变量。
:::

## 消息反应

机器人可以为消息添加表情符号反应，作为视觉处理反馈：

- 👀 当机器人开始处理您的消息时
- ✅ 当响应成功发送时
- ❌ 如果在处理过程中发生错误

反应**默认禁用**。请在 `config.yaml` 中启用它们：

```yaml
telegram:
  reactions: true
```

或通过环境变量：

```bash
TELEGRAM_REACTIONS=true
```

:::note
与 Discord（反应是叠加的）不同，Telegram 的 Bot API 在一次调用中替换所有机器人反应。从 👀 到 ✅/❌ 的转换是原子性的——您不会同时看到两者。
:::

:::tip
如果机器人在群组中没有添加反应的权限，反应调用会静默失败，消息处理会正常继续。
:::

## 按频道提示

为特定的 Telegram 群组或论坛主题分配临时系统提示。提示在每次运行时注入——不会持久化到对话历史中——因此更改会立即生效。

```yaml
telegram:
  channel_prompts:
    "-1001234567890": |
      你是一个研究助理。专注于学术来源、引用和简洁的综合。
    "42":  |
      此主题用于创意写作反馈。请保持热情和建设性。
```

键是聊天 ID（群组/超级群组）或论坛主题 ID。对于论坛群组，主题级提示会覆盖群组级提示：

- 在群组 `-1001234567890` 的主题 `42` 中发送的消息 → 使用主题 `42` 的提示
- 在主题 `99`（无显式条目）中发送的消息 → 回退到群组 `-1001234567890` 的提示
- 在没有条目的群组中发送的消息 → 不应用频道提示

数值 YAML 键会自动标准化为字符串。

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| 机器人完全没有响应 | 验证 `TELEGRAM_BOT_TOKEN` 是否正确。检查 `hermes gateway` 日志中的错误。 |
| 机器人响应“未授权” | 您的用户 ID 不在 `TELEGRAM_ALLOWED_USERS` 中。请使用 @userinfobot 再次检查。 |
| 机器人忽略群组消息 | 隐私模式可能已开启。请禁用它（第 3 步）或将机器人设为群组管理员。**更改隐私设置后，请记住移除并重新添加机器人。** |
| 语音消息未被转录 | 验证 STT 是否可用：安装 `faster-whisper` 以进行本地转录，或在 `~/.hermes/.env` 中设置 `GROQ_API_KEY` / `VOICE_TOOLS_OPENAI_KEY`。 |
| 语音回复是文件，而不是气泡 | 安装 `ffmpeg`（Edge TTS Opus 转换所需）。 |
| 机器人令牌已撤销/无效 | 通过 BotFather 的 `/revoke` 然后 `/newbot` 或 `/token` 生成新令牌。更新您的 `.env` 文件。 |
| Webhook 未收到更新 | 验证 `TELEGRAM_WEBHOOK_URL` 是否可从公共网络访问（使用 `curl` 测试）。确保您的平台/反向代理将来自 URL 端口入站 HTTPS 流量路由到 `TELEGRAM_WEBHOOK_PORT` 配置的本地监听端口（它们不需要是相同的数字）。确保 SSL/TLS 处于活动状态——Telegram 只发送到 HTTPS URL。检查防火墙规则。 |

## 执行审批

当智能体尝试运行潜在危险的命令时，它会在聊天中请求您的批准：

> ⚠️ 此命令可能很危险（递归删除）。回复“yes”以批准。

回复“yes”/“y”以批准，或“no”/“n”以拒绝。

## 安全

:::warning
始终设置 `TELEGRAM_ALLOWED_USERS` 以限制谁可以与您的机器人交互。如果没有它，网关默认会拒绝所有用户，作为一种安全措施。
:::

切勿公开分享您的机器人令牌。如果泄露，请立即通过 BotFather 的 `/revoke` 命令撤销它。

有关更多详细信息，请参阅[安全文档](/user-guide/security)。您也可以使用[私信配对](/user-guide/messaging#dm-pairing-alternative-to-allowlists)来实现更动态的用户授权方法。