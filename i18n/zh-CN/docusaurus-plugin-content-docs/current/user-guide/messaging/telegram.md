---
sidebar_position: 1
title: "Telegram"
description: "将 Hermes 智能体设置为 Telegram 机器人"
---

# Telegram 设置

Hermes 智能体可作为功能齐全的对话式机器人与 Telegram 集成。连接后，您可以在任何设备上与您的智能体聊天、发送语音备忘录并自动转录、接收计划任务结果，以及在群聊中使用智能体。该集成基于 [python-telegram-bot](https://python-telegram-bot.org/) 构建，支持文本、语音、图片和文件附件。

## 第一步：通过 BotFather 创建机器人

每个 Telegram 机器人都需要一个由 Telegram 官方机器人管理工具 [@BotFather](https://t.me/BotFather) 颁发的 API 令牌。

1.  打开 Telegram 并搜索 **@BotFather**，或访问 [t.me/BotFather](https://t.me/BotFather)
2.  发送 `/newbot`
3.  选择一个**显示名称**（例如 "Hermes Agent"）——可以是任意名称
4.  选择一个**用户名**——这必须是唯一的，并且以 `bot` 结尾（例如 `my_hermes_bot`）
5.  BotFather 会回复你的 **API 令牌**。它看起来像这样：

```
123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
```

:::warning
请保管好你的机器人令牌。任何拥有此令牌的人都可以控制你的机器人。如果泄露，请立即通过 BotFather 中的 `/revoke` 吊销它。
:::

## 第 2 步：定制您的机器人（可选）

这些 BotFather 命令可以改善用户体验。向 @BotFather 发送消息并使用：

| 命令 | 用途 |
|---------|---------|
| `/setdescription` | 用户开始聊天前显示的“此机器人能做什么？”文本 |
| `/setabouttext` | 机器人资料页上的简短文本 |
| `/setuserpic` | 为机器人上传头像 |
| `/setcommands` | 定义命令菜单（聊天中的 `/` 按钮） |
| `/setprivacy` | 控制机器人是否看到所有群组消息（见第 3 步） |

:::tip
对于 `/setcommands`，一个实用的初始命令集：

```
help - 显示帮助信息
new - 开始新对话
sethome - 将此聊天设为主频道
```
:::

## 第 3 步：隐私模式（群组关键设置）

Telegram 机器人有一个默认**启用**的**隐私模式**。这是在群组中使用机器人时最常见的困惑来源。

**隐私模式开启时**，您的机器人只能看到：
- 以 `/` 命令开头的消息
- 直接回复机器人自身消息的消息
- 服务消息（成员加入/离开、置顶消息等）
- 机器人作为管理员的频道中的消息

**隐私模式关闭时**，机器人会收到群组中的每一条消息。

### 如何禁用隐私模式

1. 向 **@BotFather** 发送消息
2. 发送 `/mybots`
3. 选择您的机器人
4. 进入 **Bot Settings → Group Privacy → Turn off**

:::warning
更改隐私设置后，**您必须从任何群组中移除并重新添加机器人**。Telegram 会在机器人加入群组时缓存隐私状态，除非移除并重新添加机器人，否则不会更新。
:::

:::tip
禁用隐私模式的替代方案：将机器人提升为**群组管理员**。管理员机器人无论隐私设置如何，总是接收所有消息，这样就避免了切换全局隐私模式的需要。
:::

## 第 4 步：获取您的用户 ID

Hermes 智能体使用数字 Telegram 用户 ID 来控制访问权限。您的用户 ID **不是**您的用户名——它是一个像 `123456789` 这样的数字。

**方法 1（推荐）：** 向 [@userinfobot](https://t.me/userinfobot) 发送消息——它会立即回复您的用户 ID。

**方法 2：** 向 [@get_id_bot](https://t.me/get_id_bot) 发送消息——另一个可靠选项。

保存这个数字；下一步您会用到它。

## 第 5 步：配置 Hermes

### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```
出现提示时选择 **Telegram**。向导会询问您的机器人令牌和允许的用户 ID，然后为您编写配置。

### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env`：

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_ALLOWED_USERS=123456789    # 多个用户请用逗号分隔
```

### 启动网关

```bash
hermes gateway
```
机器人应该会在几秒钟内上线。在 Telegram 上给它发条消息以验证。

## 从 Docker 后端终端发送生成的文件

如果您的终端后端是 `docker`，请记住 Telegram 附件是由**网关进程**发送的，而不是从容器内部发送的。这意味着最终的 `MEDIA:/...` 路径必须在运行网关的主机上可读。

常见陷阱：

- 智能体在 Docker 内部将文件写入 `/workspace/report.txt`
- 模型发出 `MEDIA:/workspace/report.txt`
- Telegram 传递失败，因为 `/workspace/report.txt` 只存在于容器内部，不在主机上

推荐模式：

```yaml
terminal:
  backend: docker
  docker_volumes:
    - "/home/user/.hermes/cache/documents:/output"
```
然后：

- 在 Docker 内部将文件写入 `/output/...`
- 在 `MEDIA:` 中使用**主机可见**的路径，例如：
  `MEDIA:/home/user/.hermes/cache/documents/report.txt`

如果您已经有 `docker_volumes:` 部分，请将新的挂载添加到同一列表中。YAML 重复键会静默覆盖前面的键。

### 支持的 `MEDIA:` 文件扩展名

网关会从智能体的回复中提取 `MEDIA:/path/to/file` 标签，并将引用的文件作为平台原生附件发送。所有网关平台支持的扩展名如下：

| 类别 | 扩展名 |
|---|---|
| 图像 | `png`, `jpg`, `jpeg`, `gif`, `webp`, `bmp`, `tiff`, `svg` |
| 音频 | `mp3`, `wav`, `ogg`, `m4a`, `opus`, `flac`, `aac` |
| 视频 | `mp4`, `mov`, `webm`, `mkv`, `avi` |
| **文档** | `pdf`, `txt`, `md`, `csv`, `json`, `xml`, `html`, `yaml`, `yml`, `log` |
| **办公** | `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp` |
| **压缩包** | `zip`, `rar`, `7z`, `tar`, `gz`, `bz2` |
| **书籍/包** | `epub`, `apk`, `ipa` |

在此列表上的任何文件，在支持原生附件的平台（Telegram、Discord、Signal、Slack、WhatsApp、飞书、Matrix 等）上都会作为原生附件传递；在不支持原生附件的平台上，会回退为链接或纯文本指示器。**加粗**的类别是在最近几次更新中添加的——如果您之前依赖模型说 `here is the file: /path/to/report.docx`，请改用 `MEDIA:/path/to/report.docx` 以实现原生传递。

## Webhook 模式

默认情况下，Hermes 使用**长轮询**连接 Telegram——网关向 Telegram 服务器发送出站请求以获取新的更新。这适用于本地和始终在线的部署。

对于**云部署**（Fly.io、Railway、Render 等），**webhook 模式**更具成本效益。这些平台可以在入站 HTTP 流量上自动唤醒暂停的机器，但不能在出站连接上唤醒。由于轮询是出站的，轮询机器人永远无法休眠。Webhook 模式翻转了方向——Telegram 将更新推送到您机器人的 HTTPS URL，实现了空闲时休眠的部署。

| | 轮询（默认） | Webhook |
|---|---|---|
| 方向 | 网关 → Telegram（出站） | Telegram → 网关（入站） |
| 最佳场景 | 本地、始终在线的服务器 | 支持自动唤醒的云平台 |
| 设置 | 无需额外配置 | 设置 `TELEGRAM_WEBHOOK_URL` |
| 空闲成本 | 机器必须持续运行 | 机器可以在消息之间休眠 |

### 配置

将以下内容添加到 `~/.hermes/.env`：

```bash
TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
TELEGRAM_WEBHOOK_SECRET="$(openssl rand -hex 32)"  # 必需
# TELEGRAM_WEBHOOK_PORT=8443        # 可选，默认 8443
```

| 变量 | 必需 | 描述 |
|----------|----------|-------------|
| `TELEGRAM_WEBHOOK_URL` | 是 | Telegram 将发送更新的公共 HTTPS URL。URL 路径会被自动提取（例如，从上面的例子中提取 `/telegram`）。 |
| `TELEGRAM_WEBHOOK_SECRET` | **是**（当设置了 `TELEGRAM_WEBHOOK_URL` 时） | Telegram 在每个 webhook 请求中回显的密钥令牌，用于验证。没有它网关将拒绝启动——参见 [GHSA-3vpc-7q5r-276h](https://github.com/NousResearch/hermes-agent/security/advisories/GHSA-3vpc-7q5r-276h)。使用 `openssl rand -hex 32` 生成。 |
| `TELEGRAM_WEBHOOK_PORT` | 否 | webhook 服务器监听的本地端口（默认：`8443`）。 |

当设置了 `TELEGRAM_WEBHOOK_URL` 时，网关会启动一个 HTTP webhook 服务器而不是轮询。未设置时，使用轮询模式——与以前版本的行为无变化。

### 云部署示例（Fly.io）

1. 将环境变量添加到您的 Fly.io 应用密钥中：

```bash
fly secrets set TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
fly secrets set TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

2. 在您的 `fly.toml` 中公开 webhook 端口：

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

如果 Telegram 的 API 被屏蔽或者您需要通过代理路由流量，请设置一个 Telegram 专用的代理 URL。这优先于通用的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量。

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

代理同时适用于主要的 Telegram 连接和备用 IP 传输。如果没有设置 Telegram 专用代理，网关会回退到 `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`（或 macOS 系统代理自动检测）。

## 主频道

在任何 Telegram 聊天（私聊或群组）中使用 `/sethome` 命令将其指定为**主频道**。定时任务（cron 作业）会将其结果发送到此频道。

您也可以在 `~/.hermes/.env` 中手动设置：

```bash
TELEGRAM_HOME_CHANNEL=-1001234567890
TELEGRAM_HOME_CHANNEL_NAME="My Notes"
```

:::tip
群聊 ID 是负数（例如 `-1001234567890`）。您个人的私聊 ID 与您的用户 ID 相同。
:::

## 语音消息

### 传入语音（语音转文本）

您在 Telegram 上发送的语音消息会自动由 Hermes 配置的 STT 提供商转录，并作为文本注入到对话中。

- `local` 使用在运行 Hermes 的机器上的 `faster-whisper`——无需 API 密钥
- `groq` 使用 Groq Whisper，需要 `GROQ_API_KEY`
- `openai` 使用 OpenAI Whisper，需要 `VOICE_TOOLS_OPENAI_KEY`

### 传出语音（文本转语音）

当智能体通过 TTS 生成音频时，会作为原生 Telegram **语音气泡**传递——那种圆形的、可内联播放的样式。

- **OpenAI 和 ElevenLabs** 原生生成 Opus——无需额外设置
- **Edge TTS**（默认免费提供商）输出 MP3，需要 **ffmpeg** 将其转换为 Opus：

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

如果没有 ffmpeg，Edge TTS 音频将作为常规音频文件发送（仍然可播放，但使用矩形播放器而不是语音气泡）。

在您的 `config.yaml` 的 `tts.provider` 键下配置 TTS 提供商。

## 群聊使用

Hermes智能体在Telegram群聊中工作时需要注意以下几点：

- **隐私模式**决定了机器人能看到哪些消息（参见[步骤3](#步骤3-隐私模式-群聊关键)）
- `TELEGRAM_ALLOWED_USERS`仍然适用——即使在群组中，也只有授权用户才能触发机器人
- 您可以通过 `telegram.require_mention: true` 来阻止机器人回应普通群聊内容
- 当设置 `telegram.require_mention: true` 时，群消息在以下情况下会被接受：
  - 回复机器人发送的消息
  - `@botusername`提及
  - `/command@botusername`（Telegram机器人菜单命令格式，包含机器人名称）
  - 与您在 `telegram.mention_patterns` 中配置的正则唤醒词匹配的消息
- 使用 `telegram.ignored_threads` 可以让Hermes在特定的Telegram论坛主题中保持静默，即使该群组在其他情况下允许自由回复或提及触发回复
- 如果未设置 `telegram.require_mention` 或其值为false，Hermes将保持之前的开放群组行为，回应它能看到的普通群消息

### 故障排除：私聊有效但群聊无效

如果机器人在私聊中有回应，但在群组中保持沉默，请按顺序检查以下关卡：

1. **Telegram消息投递：** 关闭BotFather隐私模式，将机器人提升为管理员，或直接提及机器人。如果Telegram从未将群消息投递给机器人，Hermes就无法回应。
2. **更改隐私设置后重新加入：** 在更改BotFather隐私设置后，将机器人从群组中移除并重新添加。Telegram可能会为现有成员保持旧的投递行为。
3. **Hermes授权：** 确保发送者已列在 `TELEGRAM_ALLOWED_USERS` 或 `TELEGRAM_GROUP_ALLOWED_USERS` 中，或通过 `TELEGRAM_GROUP_ALLOWED_CHATS` 允许该群聊。
4. **提及过滤器：** 如果设置了 `telegram.require_mention: true`，普通群聊内容将被忽略，除非消息是斜杠命令、对机器人的回复、`@botusername` 提及或匹配已配置的 `mention_patterns`。

Telegram群组和超级群组的聊天ID为负数是正常现象。如果您使用基于聊天ID的授权，请将这些ID放在 `TELEGRAM_GROUP_ALLOWED_CHATS` 中，而不是发送者用户允许列表中。

### 群聊触发配置示例

将此添加到 `~/.hermes/config.yaml` 中：

```yaml
telegram:
  require_mention: true
  mention_patterns:
    - "^\\s*chompy\\b"
  ignored_threads:
    - 31
    - "42"
```

此示例允许所有常规直接触发方式，以及以 `chompy` 开头的消息，即使它们没有使用 `@mention`。
在执行提及和自由回复检查之前，Telegram主题 `31` 和 `42` 中的消息将始终被忽略。

### 关于 `mention_patterns` 的说明

- 模式使用Python正则表达式
- 匹配不区分大小写
- 模式会同时检查文本消息和媒体标题
- 无效的正则表达式模式会被忽略，并在网关日志中发出警告，而不会导致机器人崩溃
- 如果您希望模式仅在消息开头匹配，请使用 `^` 锚定

## 私聊主题 (Bot API 9.4)

Telegram Bot API 9.4（2026年2月）引入了**私聊主题**功能——机器人可以直接在1对1的私聊中创建论坛式的话题线程，无需超级群组。这使您可以在与Hermes的现有私聊中运行多个隔离的工作空间。

### 使用场景

如果您同时进行多个长期项目，主题可以帮助保持上下文分离：

- **主题"网站"** — 用于处理您的生产网络服务
- **主题"研究"** — 用于文献综述和论文探索
- **主题"通用"** — 用于杂项任务和快速提问

每个主题都有自己的对话会话、历史记录和上下文——与其他主题完全隔离。

### 配置

:::caution 前提条件
在将主题添加到配置之前，用户必须**在与机器人的私聊中启用主题模式**：

1. 在Telegram中打开与Hermes机器人的私聊
2. 点击顶部的机器人名称以打开聊天信息
3. 启用**主题**（将聊天转换为论坛的开关）

如果没有执行此操作，Hermes将在启动时记录 `The chat is not a forum` 并跳过主题创建。这是Telegram的客户端设置——机器人无法以编程方式启用它。
:::

在 `~/.hermes/config.yaml` 的 `platforms.telegram.extra.dm_topics` 下添加主题：

```yaml
platforms:
  telegram:
    extra:
      dm_topics:
      - chat_id: 123456789        # 您的Telegram用户ID
        topics:
        - name: General
          icon_color: 7322096
        - name: Website
          icon_color: 9367192
        - name: Research
          icon_color: 16766590
          skill: arxiv              # 在此主题中自动加载技能
```

**字段说明：**

| 字段 | 必需 | 描述 |
|-------|----------|-------------|
| `name` | 是 | 主题显示名称 |
| `icon_color` | 否 | Telegram图标颜色代码（整数） |
| `icon_custom_emoji_id` | 否 | 用于主题图标的自定义表情符号ID |
| `skill` | 否 | 在此主题的新会话中自动加载的技能 |
| `thread_id` | 否 | 主题创建后自动填充——请勿手动设置 |

### 工作原理

1. 网关启动时，Hermes会为每个尚无 `thread_id` 的主题调用 `createForumTopic`
2. `thread_id` 会自动保存回 `config.yaml`——后续的重启将跳过API调用
3. 每个主题映射到一个隔离的会话密钥：`agent:main:telegram:dm:{chat_id}:{thread_id}`
4. 每个主题中的消息都有自己的对话历史、记忆刷新和上下文窗口

### 技能绑定

带有 `skill` 字段的主题会在新会话开始时自动加载该技能。这与在对话开始时输入 `/skill-name` 的效果完全相同——技能内容会被注入到第一条消息中，后续消息在对话历史中都能看到它。

例如，带有 `skill: arxiv` 的主题将在其会话重置时（由于空闲超时、每日重置或手动 `/reset`）自动预加载arxiv技能。

:::tip
在配置外部创建的主题（例如通过手动调用Telegram API）会在收到 `forum_topic_created` 服务消息时自动发现。您也可以在网关运行时将主题添加到配置中——它们将在下次缓存未命中时被拾取。
:::

## 多会话 DM 模式（`/topic`）

一个类似 ChatGPT 的多会话 DM —— 一个机器人，多个并行对话。与上面由运营者策划的 `extra.dm_topics` 不同，此模式是**用户驱动**的：无需配置，无需预先声明主题名称。最终用户通过 `/topic` 开启它，然后点击 Telegram 的 **+** 按钮创建任意数量的主题，每个主题都是一个完全独立的 Hermes 会话。

### `/topic` 子命令

| 格式 | 上下文 | 效果 |
|------|---------|------|
| `/topic` | 根 DM，尚未启用 | 检查 BotFather 能力，启用多会话模式，创建置顶的系统主题 |
| `/topic` | 根 DM，已启用 | 显示状态：可恢复的未链接会话 |
| `/topic` | 在主题内 | 显示当前主题的会话绑定 |
| `/topic help` | 任何 | 内联用法说明 |
| `/topic off` | 根 DM | 禁用多会话模式并清除此聊天的所有主题绑定 |
| `/topic <session-id>` | 在主题内 | 将之前的 Telegram 会话恢复到当前主题中 |

只有授权用户（通过 `TELEGRAM_ALLOWED_USERS` / 平台认证配置的白名单）才能运行 `/topic`。未授权的发送者将收到拒绝信息而非激活提示。

### DM 主题与多会话 DM 模式对比

| | `extra.dm_topics`（配置驱动） | `/topic`（用户驱动） |
|---|---|---|
| 谁激活它 | 运营者，在 `config.yaml` 中 | 最终用户，通过发送 `/topic` |
| 主题列表 | 配置中声明的固定集合 | 用户自由创建/删除主题 |
| 主题名称 | 由运营者选择 | 由用户选择；自动重命名以匹配 Hermes 会话标题 |
| 根 DM 行为 | 不变——普通聊天 | 变为系统大厅（非命令消息被拒绝） |
| 主要使用场景 | 带可选技能绑定的永久工作区 | 临时并行会话 |
| 持久化 | 配置中的 `extra.dm_topics` | `telegram_dm_topic_mode` + `telegram_dm_topic_bindings` SQLite 表 |

这两个功能可以在同一个机器人上共存——你可以在用户的 DM 中运行 `/topic`，而 `extra.dm_topics` 继续为其他聊天管理运营者声明的主题。

### 先决条件

在 **@BotFather** 中，打开你的机器人 → **Bot Settings → Threads Settings**：

1.  开启 **Threaded Mode**（启用 `has_topics_enabled`）
2.  **不要**禁用用户创建主题（保持 `allows_users_to_create_topics` 开启）

当用户首次运行 `/topic` 时，Hermes 会调用 `getMe` 来验证这两个标志。如果其中任何一个关闭，Hermes 会发送 BotFather Threads Settings 页面的截图并解释需要切换什么——在满足先决条件之前不会进行激活。

### 激活流程

从根 DM 发送：

```
/topic
```

Hermes 将：

1.  检查 `getMe().has_topics_enabled` 和 `allows_users_to_create_topics`
2.  如果两者都为真，则为该 DM 启用多会话主题模式
3.  为状态/命令创建并置顶一个 **System** 主题（尽力而为）
4.  回复一个列表，显示用户可以恢复的先前未链接的 Telegram 会话

激活后，**根 DM 变为大厅**：普通提示被拒绝，并引导用户前往 **All Messages**。系统命令（`/status`、`/sessions`、`/usage`、`/help` 等）在根 DM 中仍然有效。

### 创建新主题（最终用户流程）

1.  在 Telegram 中打开机器人 DM
2.  点击机器人界面顶部的 **All Messages**，然后发送任何消息
3.  Telegram 会为该消息创建一个新主题
4.  Hermes 在该主题内回复——该主题现在是一个独立会话

每个主题都有自己独立的对话历史、模型状态、工具执行和会话 ID。隔离键是 `agent:main:telegram:dm:{chat_id}:{thread_id}`——与配置驱动的 DM 主题隔离相同。

### 自动重命名主题

当 Hermes 为某个主题生成会话标题时（通过自动标题流水线，在首次交换后），Telegram 主题本身也会被重命名以匹配——例如，“New Topic” 变为 “Database migration plan”。重命名是尽力而为的：失败会被记录但不会中断会话。

### 主题内的 `/new`

重置当前主题的会话（新的会话 ID，全新的历史记录），而不影响其他主题。Hermes 会回复提醒，通常如果需要并行工作，创建另一个主题（通过 **All Messages**）是你想要的操作。

### 恢复之前的会话

在主题内，发送：

```
/topic <session-id>
```

这会将当前主题绑定到现有的 Hermes 会话，而不是从头开始。适用于在主题模式启用之前开始的对话。限制：

- 目标会话必须属于同一个 Telegram 用户
- 目标会话不能已经绑定到另一个主题

Hermes 会用会话标题确认，并重放最后一条助手消息作为上下文。

要发现会话 ID，请在根 DM 中发送 `/topic`（无参数）——Hermes 会列出用户的未链接 Telegram 会话。

### 主题内的 `/topic`（无参数）

显示当前主题的绑定：会话标题、会话 ID，以及关于 `/new` 与创建另一个主题的提示。

### 底层实现

- 激活状态持久化到 `state.db` 中的 `telegram_dm_topic_mode(chat_id, user_id, enabled, ...)` 表
- 每个主题绑定持久化到 `telegram_dm_topic_bindings(chat_id, thread_id, session_id, ...)` 表，其中 `session_id` 上设置了 `ON DELETE CASCADE`——修剪会话会自动清除其主题绑定
- 主题模式的 SQLite 迁移是**可选加入的**：它仅在第一次 `/topic` 调用时运行，不会在网关启动时运行。在此配置中用户运行 `/topic` 之前，`state.db` 保持不变
- 每条入站 DM 消息都会查找其 `(chat_id, thread_id)` 绑定。如果存在，查找会通过 `SessionStore.switch_session()` 将消息路由到绑定的会话，从而保持磁盘上的会话键到会话 ID 映射一致
- 主题内的 `/new` 会重写绑定行以指向新的会话 ID，因此下条消息会保持在新会话上
- 在 `extra.dm_topics` 中声明的主题**永远不会被自动重命名**——即使启用了多会话模式，运营者选择的名称也会被保留
- 在启用了论坛功能的 DM 中，置顶顶部的 General 主题被视为根大厅，无论 Telegram 是以 `message_thread_id=1` 还是不带 thread_id 的形式传递其消息
- 根大厅提醒被限制为每个聊天每 30 秒一条消息——用户如果忘记主题模式已开启并在根 DM 中输入了十个提示，不会收到十条回复
- BotFather 设置截图被限制为每个聊天每 5 分钟发送一次——在 Threads Settings 仍被禁用时重复尝试 `/topic` 不会重新上传相同的图片
- 在主题内启动的 `/background <prompt>` 会将其结果返回到同一主题；后台会话不会触发其所属主题的自动重命名
- `/topic` 本身受机器人用户授权检查的限制——未授权的 DM 会收到拒绝信息而非激活提示

### 禁用多会话模式

在根 DM 中发送 `/topic off`。Hermes 会将行状态设为关闭，清除该聊天的 `(thread_id → session_id)` 绑定，根 DM 恢复为普通的 Hermes 聊天。Telegram 中现有的主题不会被删除——它们只是不再作为独立会话被隔离。稍后重新运行 `/topic` 可将其重新开启。

如果你需要手动清理（例如跨多个聊天进行批量重置），直接删除相关行：

```bash
sqlite3 ~/.hermes/state.db \
  "UPDATE telegram_dm_topic_mode SET enabled = 0 WHERE chat_id = '<your_chat_id>'; \
   DELETE FROM telegram_dm_topic_bindings WHERE chat_id = '<your_chat_id>';"
```

### 降级 Hermes

如果你降级到早于 `/topic` 功能的 Hermes 版本，该功能将简单地停止工作——`telegram_dm_topic_mode` 和 `telegram_dm_topic_bindings` 表仍保留在 `state.db` 中，但会被旧代码忽略。DM 会恢复到原生的每线程隔离（每个 `message_thread_id` 仍通过 `build_session_key` 获得自己的会话），因此你现有的 Telegram 主题将继续作为并行会话工作。根 DM 不再是大厅——其中的消息将像以前一样进入智能体。重新升级会精确地在原位置重新激活多会话模式。

# 群组论坛主题技能绑定

启用了**主题模式**的超级群组（也称为“论坛主题”）已经为每个主题提供了会话隔离——每个 `thread_id` 都映射到其自己的对话。但您可能希望当消息到达特定群组主题时**自动加载技能**，这与私信主题技能绑定的工作方式相同。

### 用例

一个包含不同工作流论坛主题的团队超级群组：

- **工程**主题 → 自动加载 `software-development` 技能
- **研究**主题 → 自动加载 `arxiv` 技能
- **通用**主题 → 无技能，通用助手

### 配置

在 `~/.hermes/config.yaml` 文件的 `platforms.telegram.extra.group_topics` 下添加主题绑定：

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
          # 无技能 — 通用助手
```

**字段说明：**

| 字段 | 必填 | 描述 |
|-------|----------|-------------|
| `chat_id` | 是 | 超级群组的数字 ID（以 `-100` 开头的负数） |
| `name` | 否 | 主题的人类可读标签（仅供参考） |
| `thread_id` | 是 | Telegram 论坛主题 ID — 在 `t.me/c/<group_id>/<thread_id>` 链接中可见 |
| `skill` | 否 | 要在此主题的新会话中自动加载的技能 |

### 工作原理

1. 当消息到达已映射的群组主题时，Hermes 会在 `group_topics` 配置中查找 `chat_id` 和 `thread_id`。
2. 如果匹配的条目包含 `skill` 字段，则该技能将自动为会话加载——与私信主题技能绑定相同。
3. 没有 `skill` 键的主题仅获得会话隔离（现有行为，保持不变）。
4. 未映射的 `thread_id` 值或 `chat_id` 值将被静默忽略——无错误，无技能。

### 与私信主题的区别

| | 私信主题 | 群组主题 |
|---|---|---|
| 配置键 | `extra.dm_topics` | `extra.group_topics` |
| 主题创建 | 如果缺少 `thread_id`，Hermes 通过 API 创建主题 | 管理员在 Telegram 界面创建主题 |
| `thread_id` | 创建后自动填充 | 必须手动设置 |
| `icon_color` / `icon_custom_emoji_id` | 支持 | 不适用（由管理员控制外观） |
| 技能绑定 | ✓ | ✓ |
| 会话隔离 | ✓ | ✓（论坛主题已内置） |

:::tip
要查找主题的 `thread_id`，请在 Telegram 网页版或桌面版中打开该主题，并查看 URL：`https://t.me/c/1234567890/5` — 最后一个数字（`5`）就是 `thread_id`。超级群组的 `chat_id` 是群组 ID 前加 `-100`（例如，群组 `1234567890` 变为 `-1001234567890`）。
:::

## 最新的 Bot API 功能

- **Bot API 9.4（2026 年 2 月）：** 私聊主题 — 机器人可以通过 `createForumTopic` 在一对一私信聊天中创建论坛主题。Hermes 将此用于两个不同的功能：运营者策划的[私聊主题](#private-chat-topics-bot-api-94)（配置驱动，固定主题列表）和用户驱动的[多会话私信模式](#multi-session-dm-mode-topic)（通过 `/topic` 激活，用户创建的主题无限制）。
- **隐私政策：** Telegram 现在要求机器人具备隐私政策。通过 BotFather 使用 `/setprivacy_policy` 设置一个，否则 Telegram 可能会自动生成一个占位符。如果您的机器人是面向公众的，这一点尤其重要。
- **Bot API 9.5（2026 年 3 月）：通过 `sendMessageDraft` 进行原生流式传输。** Hermes 使用 Telegram 的原生流式传输草稿 API，在私聊中智能体的回复令牌到达时呈现动画预览。消除了您以前在使用旧版 `editMessageText` 轮询路径处理慢速模型时看到的每次编辑抖动。

### 流式传输方式 (`gateway.streaming.transport`)

当启用流式传输（`gateway.streaming.enabled: true`）时，Hermes 会从以下四种传输方式中选择一种：

| 值 | 行为 |
|---|---|
| `auto`（默认） | 在支持的聊天（目前是 Telegram 私信）上使用原生草稿流式传输；否则使用旧的基于编辑的路径。如果草稿帧失败，会优雅地回退。 |
| `draft` | 强制使用原生草稿。如果聊天不支持草稿（例如群组/主题），会记录降级并回退到编辑方式。 |
| `edit` | 对所有聊天类型使用旧的逐步 `editMessageText` 轮询。 |
| `off` | 完全禁用流式传输（仅最终回复，无逐步更新）。 |

在 `~/.hermes/config.yaml` 文件中：

```yaml
gateway:
  streaming:
    enabled: true
    transport: auto    # auto | draft | edit | off
```

**使用 `auto`（默认）时在私信中的体验** — 当智能体生成回复时，Telegram 会显示一个动画草稿预览，并逐个令牌更新。当回复完成时，它会作为普通消息发送，并且草稿预览会在客户端自然清除。草稿没有消息 ID，因此保留在您聊天记录中的是最终答案。

**那么群组、超级群组、论坛主题呢？** Telegram 将 `sendMessageDraft` 限制在私聊中。对于其他所有情况，网关会透明地回退到基于编辑的路径——与之前的用户体验相同。

**如果草稿帧失败怎么办？** 任何失败（瞬态网络错误、服务器端拒绝、较旧的 python-telegram-bot 安装）都会将该响应切换回基于编辑的路径，直到流结束。下一个响应将获得一次新的尝试。

# 渲染：表格和链接预览

Telegram 的 MarkdownV2 没有原生表格语法——管道表格如果未经处理直接通过，会渲染成反斜杠转义的乱码。Hermes 会自动标准化 Markdown 表格：

- **小型表格**会被展平为**行组项目符号列表**——每行在列标题下变成一个易读的项目符号列表。适用于 2-4 列和较短的单元格内容。
- **较大或较宽的表格**则会回退为一个**带对齐列的围栏代码块**，确保内容不会坍塌。系统会添加一行提示，让智能体知道在 Telegram 上应优先使用散文式后续内容而非更多表格。

无需任何配置——适配器会根据每条消息自动选择合适的回退方式。如果你想恢复旧版的"始终使用代码块"行为，可以在 `config.yaml` 中设置 `telegram.pretty_tables: false` 来禁用表格标准化（默认为 `true`）。

**链接预览。** Telegram 会自动为机器人消息中的 URL 生成链接预览。如果你想抑制此行为（例如长篇 `/tools` 输出、提及了十个链接的智能体回复等）：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        disable_link_previews: true
```

启用后，Hermes 会为每条发出的消息附加 Telegram 的 `LinkPreviewOptions(is_disabled=True)`，并在旧版 `python-telegram-bot` 库上回退使用旧的 `disable_web_page_preview` 参数。

## 群组白名单

Telegram 群组和论坛聊天有两个可配置的独立访问控制层级：

- **发送者用户 ID** (`group_allow_from` / `TELEGRAM_GROUP_ALLOWED_USERS`) — 仅适用于群组/论坛消息的发送者作用域白名单。当你希望特定用户能在群组中调用机器人，而不必将他们添加到 `TELEGRAM_ALLOWED_USERS`（这会同时授予他们私信访问权限）时，使用此选项。
- **聊天 ID** (`group_allowed_chats` / `TELEGRAM_GROUP_ALLOWED_CHATS`) — 聊天作用域白名单。这些群组/论坛的任何成员都可以与机器人交互。适用于团队/客服机器人，此时群组成员身份本身就是访问信号。

```yaml
gateway:
  platforms:
    telegram:
      extra:
        # 全局访问（私信 + 群组）。此处的用户始终可以调用机器人。
        allow_from:
          - "123456789"
        # 仅允许在群组/论坛中发送消息的发送者 ID。不授予私信访问权限。
        group_allow_from:
          - "987654321"
        # 完整的群组/论坛——任何成员都被授权。
        group_allowed_chats:
          - "-1001234567890"
```

等效的环境变量：

```bash
TELEGRAM_ALLOWED_USERS="123456789"
TELEGRAM_GROUP_ALLOWED_USERS="987654321"
TELEGRAM_GROUP_ALLOWED_CHATS="-1001234567890"
```

行为：

- `TELEGRAM_ALLOWED_USERS` 覆盖所有聊天类型（私信、群组、论坛）。
- `TELEGRAM_GROUP_ALLOWED_USERS` 仅授权列出的发送者在群组/论坛中发送消息。除非他们在 `TELEGRAM_ALLOWED_USERS` 中列出，否则他们仍然无法通过私信与机器人交互。
- `TELEGRAM_GROUP_ALLOWED_CHATS` 中的聊天会授权该聊天的每个成员，无论发送者是谁。
- 在这些变量中使用 `*` 可以允许任何发送者/聊天。
- 此配置层叠在现有的提及/模式触发器以及 `group_topics` + `ignored_threads` 之上。

### 从 PR #17686 之前迁移

在此拆分之前，`TELEGRAM_GROUP_ALLOWED_USERS` 是唯一的配置项，用户将 **聊天 ID** 放入其中。为了向后兼容，`TELEGRAM_GROUP_ALLOWED_USERS` 中以 `-` 开头的聊天 ID 格式的值仍会被视为聊天 ID 处理，并会记录一次弃用警告。迁移方法：

```bash
# 旧版（仍然有效，但已弃用）
TELEGRAM_GROUP_ALLOWED_USERS="-1001234567890"

# 新版
TELEGRAM_GROUP_ALLOWED_CHATS="-1001234567890"
```

## 斜杠命令访问控制

默认情况下，每个被允许的用户都可以运行所有斜杠命令。要将你的白名单划分为**管理员**（拥有完整斜杠命令访问权限）和**普通用户**（只能使用你明确启用的命令），请在平台的 `extra` 块中添加 `allow_admin_from` 和 `user_allowed_commands`：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        # 现有白名单（不变）
        allow_from:
          - "123456789"     # 管理员
          - "555555555"     # 普通用户
          - "777777777"     # 普通用户

        # 新增——管理员获得所有斜杠命令权限（内置 + 插件）
        allow_admin_from:
          - "123456789"

        # 新增——非管理员被允许的用户只能运行以下斜杠命令。
        # /help 和 /whoami 始终被允许，以便用户查看其访问权限。
        user_allowed_commands:
          - status
          - model
          - history

        # 可选：为群组设置单独的管理员/命令列表
        group_allow_admin_from:
          - "123456789"
        group_user_allowed_commands:
          - status
```

**行为：**

- 在某个作用域（私信或群组）中被列在 `allow_admin_from` 的用户可以运行**每个**已注册的斜杠命令——包括内置命令和插件注册的命令——通过实时注册表。
- 被列在 `allow_from` 但**未**列在 `allow_admin_from` 中的用户只能运行 `user_allowed_commands` 中列出的命令，以及始终被允许的基础命令：`/help` 和 `/whoami`。
- 普通聊天（非斜杠消息）不受影响。非管理员用户仍然可以正常与智能体对话，只是他们无法触发任意命令。
- **向后兼容：** 如果某个作用域未设置 `allow_admin_from`，则该作用域的斜杠命令访问控制将被禁用。现有安装无需任何更改即可继续工作。
- 私信中的管理员状态并不意味着群组中的管理员状态。每个作用域都有其独立的管理员列表。
- 如果只设置了 `group_allow_admin_from`，私信作用域将保持无限制（向后兼容）模式。

使用 `/whoami` 可查看当前作用域、你的层级（管理员 / 用户 / 无限制）以及你可以运行的斜杠命令。

## 交互式模型选择器

在Telegram聊天中发送 `/model` 且不带参数时，Hermes会显示一个交互式内联键盘用于切换模型：

1.  **选择提供商** — 按钮显示每个可用的提供商及其模型数量（例如，"OpenAI (15)"，当前提供商显示为"✓ Anthropic (12)"）。
2.  **选择模型** — 带分页的模型列表，包含 **上一页**/**下一页** 导航，一个 **返回** 按钮用于回到提供商列表，以及 **取消**。

当前模型和提供商显示在顶部。所有导航都是通过原地编辑同一条消息来完成的（不会造成聊天记录杂乱）。

:::tip
如果你知道确切的模型名称，可以直接输入 `/model <名称>` 来跳过选择器。你也可以输入 `/model <名称> --global` 来使更改跨会话持久生效。
:::

## DNS-over-HTTPS 回退IP

在某些受限网络中，`api.telegram.org` 可能解析到一个无法访问的IP地址。Telegram适配器包含一个 **回退IP** 机制，该机制会透明地尝试使用备用IP重新连接，同时保留正确的TLS主机名和SNI。

### 工作原理

1.  如果设置了 `TELEGRAM_FALLBACK_IPS`，则直接使用这些IP。
2.  否则，适配器会自动通过DNS-over-HTTPS (DoH) 查询 **Google DNS** 和 **Cloudflare DNS**，以发现 `api.telegram.org` 的备用IP。
3.  由DoH返回的、与系统DNS结果不同的IP将被用作回退。
4.  如果DoH也被阻断，则使用一个硬编码的种子IP（`149.154.167.220`）作为最后手段。
5.  一旦某个回退IP成功，它将变得"粘性" — 后续请求将直接使用它，而不会首先重试主路径。

### 配置

```bash
# 显式设置回退IP（逗号分隔）
TELEGRAM_FALLBACK_IPS=149.154.167.220,149.154.167.221
```

或在 `~/.hermes/config.yaml` 中：

```yaml
platforms:
  telegram:
    extra:
      fallback_ips:
        - "149.154.167.220"
```

:::tip
通常你不需要手动配置此项。通过DoH的自动发现可以处理大多数受限网络场景。只有在你的网络上DoH也被阻断时，才需要设置 `TELEGRAM_FALLBACK_IPS` 环境变量。
:::

## 代理支持

如果你的网络需要HTTP代理才能访问互联网（在企业环境中很常见），Telegram适配器会自动读取标准代理环境变量，并通过该代理路由所有连接。

### 支持的变量

适配器按顺序检查以下环境变量，使用第一个被设置的：

1.  `HTTPS_PROXY`
2.  `HTTP_PROXY`
3.  `ALL_PROXY`
4.  `https_proxy` / `http_proxy` / `all_proxy`（小写变体）

### 配置

在启动网关前，在你的环境中设置代理：

```bash
export HTTPS_PROXY=http://proxy.example.com:8080
hermes gateway
```

或将其添加到 `~/.hermes/.env`：

```bash
HTTPS_PROXY=http://proxy.example.com:8080
```

该代理适用于主传输和所有回退IP传输。无需额外的Hermes配置 — 如果设置了环境变量，它将自动被使用。

:::note
此处涵盖的是Hermes用于Telegram连接的自定义回退传输层。其他地方使用的标准 `httpx` 客户端本身已支持代理环境变量。
:::

## 消息表情回应

机器人可以为消息添加表情符号回应，作为视觉上的处理反馈：

-   当机器人开始处理你的消息时添加 👀
-   当响应成功送达时添加 ✅
-   如果处理过程中发生错误则添加 ❌

默认情况下，**表情回应处于禁用状态**。在 `config.yaml` 中启用它们：

```yaml
telegram:
  reactions: true
```

或通过环境变量：

```bash
TELEGRAM_REACTIONS=true
```

:::note
与Discord（表情回应是累加的）不同，Telegram的Bot API在单次调用中会替换所有机器人的表情回应。从 👀 到 ✅/❌ 的转换是原子性的 — 你不会同时看到两者。
:::

:::tip
如果机器人没有在群组中添加表情回应的权限，表情回应的调用会静默失败，消息处理会正常继续。
:::

## 频道专属提示词

为特定的Telegram群组或论坛主题分配临时的系统提示词。提示词在每轮对话时被注入运行 — 永远不会持久化到对话历史中 — 因此更改会立即生效。

```yaml
telegram:
  channel_prompts:
    "-1001234567890": |
      你是一位研究助手。专注于学术来源、
      引文和简洁的综合分析。
    "42":  |
      这个主题用于创意写作反馈。请保持热情和
      建设性。
```

键是聊天ID（群组/超级群组）或论坛主题ID。对于论坛群组，主题级提示词会覆盖群组级提示词：

-   在群组 `-1001234567890` 内的主题 `42` 中发送的消息 → 使用主题 `42` 的提示词
-   在主题 `99`（无显式条目）中发送的消息 → 回退到群组 `-1001234567890` 的提示词
-   在没有条目的群组中发送的消息 → 不应用频道提示词

数字型的YAML键会被自动规范化为字符串。

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 机器人完全没有响应 | 验证 `TELEGRAM_BOT_TOKEN` 是否正确。检查 `hermes gateway` 日志中的错误。 |
| 机器人响应"未授权" | 你的用户ID不在 `TELEGRAM_ALLOWED_USERS` 中。请通过 @userinfobot 双重检查。 |
| 机器人忽略群组消息 | 隐私模式可能已开启。将其禁用（步骤3）或将机器人设为群组管理员。**请记住在更改隐私设置后移除并重新添加机器人。** |
| 语音消息未被转录 | 验证STT是否可用：为本地转录安装 `faster-whisper`，或在 `~/.hermes/.env` 中设置 `GROQ_API_KEY` / `VOICE_TOOLS_OPENAI_KEY`。 |
| 语音回复是文件，而非气泡 | 安装 `ffmpeg`（Edge TTS Opus转换所需）。 |
| 机器人令牌被吊销/无效 | 通过BotFather的 `/revoke` 然后 `/newbot` 或 `/token` 生成新令牌。更新你的 `.env` 文件。 |
| Webhook未接收更新 | 验证 `TELEGRAM_WEBHOOK_URL` 可公开访问（使用 `curl` 测试）。确保你的平台/反向代理将来自该URL端口的入站HTTPS流量，路由到 `TELEGRAM_WEBHOOK_PORT` 所配置的本地监听端口（两者不需要相同）。确保SSL/TLS已激活 — Telegram仅向HTTPS URL发送。检查防火墙规则。 |

## 执行审批

当智能体尝试运行可能具有危险性的命令时，它会在聊天中请求你的批准：

> ⚠️ 此命令可能具有危险性（递归删除）。回复 "yes" 以批准。

回复 "yes"/"y" 批准，或回复 "no"/"n" 拒绝。

## 安全性

:::warning
务必设置 `TELEGRAM_ALLOWED_USERS` 以限制谁可以与你的机器人交互。如果没有设置，作为安全措施，网关默认会拒绝所有用户。
:::

切勿公开分享你的机器人令牌。如果令牌泄露，请立即通过BotFather的 `/revoke` 命令将其吊销。

更多详情，请参阅[安全文档](/user-guide/security)。你也可以使用[DM配对](/user-guide/messaging#dm-pairing-alternative-to-allowlists)来获得更动态的用户授权方法。