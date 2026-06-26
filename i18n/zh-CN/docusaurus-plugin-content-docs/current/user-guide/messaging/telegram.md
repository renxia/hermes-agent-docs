---
sidebar_position: 1
title: "Telegram"
description: "将 Hermes 智能体设置为 Telegram 机器人"
---

# Telegram 设置

Hermes 智能体与 Telegram 集成，成为一个功能齐全的对话机器人。连接后，您可以在任何设备上与您的智能体聊天，发送可自动转录的语音备忘录，接收任务计划结果，并在群聊中使用该智能体。此集成基于 [python-telegram-bot](https://python-telegram-bot.org/) 构建，支持文本、语音、图像和文件附件。

## 第 1 步：通过 BotFather 创建机器人

每个 Telegram 机器人都需要由 [@BotFather](https://t.me/BotFather)——Telegram 的官方机器人管理工具——颁发的 API 令牌。

1. 打开 Telegram 并搜索 **@BotFather**，或访问 [t.me/BotFather](https://t.me/BotFather)
2. 发送 `/newbot`
3. 选择一个**显示名称**（例如 "Hermes Agent"）——这可以是任何内容。
4. 选择一个**用户名**——它必须是唯一的，并且以 `bot` 结尾（例如 `my_hermes_bot`）。
5. BotFather 会回复您的**API 令牌**。它看起来像这样：

```
123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
```

:::warning
保持您的机器人令牌机密。拥有此令牌的任何人都可以控制您的机器人。如果它泄露，请立即通过 BotFather 中的 `/revoke` 进行撤销。
:::

## 第 2 步：自定义您的智能体（可选）

这些 BotFather 命令可以改善用户体验。请消息 @BotFather 并使用以下命令：

| Command | Purpose |
|---------|---------|
| `/setdescription` | 在用户开始聊天之前显示的“这个机器人能做什么？”文本 |
| `/setabouttext` | 机器人的个人资料页面上的简短文本 |
| `/setuserpic` | 上传机器人的头像 |
| `/setcommands` | 定义命令菜单（聊天中的 `/` 按钮） |
| `/setprivacy` | 控制机器人是否能看到所有群组消息（参见第 3 步） |

:::tip
对于 `/setcommands`，一个有用的起始集：

```
help - 显示帮助信息
new - 开始新的对话
sethome - 将此聊天设置为主频道
```
:::

### 在线/离线状态指示器（可选）

Telegram 机器人没有真实的在线/离线状态点——那个绿色的点是*用户账户*功能，而不是 Bot API 为机器人提供的。最接近的功能是机器人的**简短描述**（显示在其名称下方的行）。

启用 `status_indicator`，Hermes 会在网关连接时将该简短描述设置为 **Online**，并在干净关闭时设置为 **Offline**：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        status_indicator: true
        # 可选的自定义字符串（默认值："🟢 Online" / "🔴 Offline"）：
        status_online: "🟢 Online"
        status_offline: "🔴 Offline"
```

注意事项：

- 简短描述是机器人**全局**性的（对所有用户可见），而不是针对每个聊天。用户在机器人的个人资料页面上看到它，而不是在一个打开的聊天中看到一个实时徽章。
- 只有**干净**的网关关闭（`/stop`、`disconnect`）才会写入“Offline”。硬崩溃会保留上次已知的状态——这是个人资料文本指示器的固有局限性。
- 默认是关闭的，因为它会修改机器人的全局资料。

### 命令菜单优先级和上限（可选）

当 Telegram 网关启动时，Hermes 会自动注册其命令菜单。该菜单由中央斜杠命令注册表以及合格的插件/技能命令构建而成，然后进行限制，以确保 Telegram 能够可靠地接受负载。默认上限是 60 个命令——这足以显示所有内置命令和常见的技能命令。

如果您有应该在 Telegram 的 `/` 选择器中保持可见的本地或插件命令，请在 `~/.hermes/config.yaml` 中设置它们的优先级：

```yaml
platforms:
  telegram:
    extra:
      command_menu:
        max_commands: 60
        priority_mode: prepend  # prepend | append | replace
        priority:
          - my_plugin_command
```

`priority_mode` 控制您的列表如何与 Hermes 的内置优先级列表结合：

- `prepend`: 将您的命令放在最前面，然后是 Hermes 的默认设置
- `append`: 保留 Hermes 默认设置在前，然后是您的命令
- `replace`: 只使用您的列表进行优先级排序

Telegram 允许最多 100 个 BotCommands，但大型命令负载可能会失败。Hermes 默认为 60 以确保可靠性，并将配置值限制在 `1..100`；请使用 `/commands` 查看完整的命令列表。

## 第 3 步：隐私模式（群组的关键）

Telegram 机器人具有**隐私模式**，该模式**默认启用**。这是在使用机器人进行群聊时最常见的困惑来源。

**开启隐私模式后**，您的机器人只能看到：
- 以 `/` 命令开头的消息
- 直接回复机器人自己消息的消息
- 服务消息（成员加入/离开、置顶消息等）
- 机器人为管理员的频道中的消息

**关闭隐私模式后**，机器人会收到群组中的每条消息。

### 如何禁用隐私模式

1. 消息 **@BotFather**
2. 发送 `/mybots`
3. 选择您的机器人
4. 进入 **Bot Settings → Group Privacy → Turn off**

:::warning
**您必须在更改隐私设置后将机器人从任何群组中移除并重新添加。** Telegram 会缓存机器人在加入群组时的隐私状态，直到机器人被移除并重新添加才会更新。
:::

:::tip
禁用隐私模式的另一种方法：将机器人提升为**群组管理员**。管理员机器人始终会收到所有消息，而无需切换全局隐私模式。
:::

### 在不自动回复的情况下观察群聊

对于 OpenClaw/Yuanbao 风格的群组行为，配置 Telegram 以便机器人可以**看到**普通的群组消息，但仅在被直接触发时才**响应**：

```yaml
telegram:
  allowed_chats:
    - "-1001234567890"
  group_allowed_chats:
    - "-1001234567890"
  require_mention: true
  observe_unmentioned_group_messages: true
```

启用此模式后，来自明确允许的聊天/话题的未被提及群组消息会被追加到共享聊天/话题会话转录本中作为观察到的上下文，但它们不会调度智能体。`allowed_chats` 决定了机器人何时响应；`group_allowed_chats` 授权用于观察上下文的共享群组会话，因此请使用相同的聊天 ID 来配置此模式。稍后的 `@botname` 提及、回复机器人或在同一允许聊天/话题中配置的提及模式都可以使用该观察到的上下文。被触发的消息还会被标记上 `[nickname|user_id]`，并获得一个每次轮次的安全提示，以便模型将先前的观察行视为上下文，而不是针对机器人的指令。

等效的环境变量：

```bash
TELEGRAM_ALLOWED_CHATS=-1001234567890
TELEGRAM_GROUP_ALLOWED_CHATS=-1001234567890
TELEGRAM_OBSERVE_UNMENTIONED_GROUP_MESSAGES=true
```

这要求 Telegram 将普通群组消息传递给网关，因此请禁用 BotFather 隐私模式或按照上述说明将机器人提升为群组管理员。

## 第 4 步：查找您的用户 ID

Hermes Agent 使用数字化的 Telegram 用户 ID 来控制访问权限。您的用户 ID **不是**您的用户名——它是一个像 `123456789` 这样的数字。

**方法 1（推荐）：** 消息 [@userinfobot](https://t.me/userinfobot) — 它会立即回复您的用户 ID。

**方法 2：** 消息 [@get_id_bot](https://t.me/get_id_bot) — 另一种可靠的选项。

保存此数字；您将在下一步需要它。

## 第 5 步：配置 Hermes

### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

当提示时，选择 **Telegram**。向导会询问您的机器人令牌和允许的用户 ID，然后为您编写配置文件。

### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env`：

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_ALLOWED_USERS=123456789    # 多个用户的逗号分隔列表
```

### 启动网关

```bash
hermes gateway
```

机器人应在几秒内上线。发送一条消息给它进行验证。

## 从基于 Docker 的终端发送生成的文件

如果您的终端后端是 `docker`，请记住 Telegram 附件是由**网关进程**而不是容器内部发送的。这意味着最终的 `MEDIA:/...` 路径必须在运行网关的主机上可读。

常见陷阱：

- 智能体将文件写入 Docker 中的 `/workspace/report.txt`
- 模型发出 `MEDIA:/workspace/report.txt`
- Telegram 发送失败，因为 `/workspace/report.txt` 只存在于容器内部，而不在主机上

推荐模式：

```yaml
terminal:
  backend: docker
  docker_volumes:
    - "/home/user/.hermes/cache/documents:/output"
```

然后：

- 将文件写入 Docker 中的 `/output/...`
- 发出**主机可见**的 `MEDIA:` 路径，例如：
  `MEDIA:/home/user/.hermes/cache/documents/report.txt`

如果您已经有 `docker_volumes:` 部分，请将新的挂载项添加到同一列表中。YAML 会静默地覆盖重复的键。

### 支持的 `MEDIA:` 文件扩展名

网关会从智能体回复中提取 `MEDIA:/path/to/file` 标签，并将引用的文件作为平台原生的附件发送。所有网关平台的支持扩展名：

| Category | Extensions |
|---|---|
| Images | `png`, `jpg`, `jpeg`, `gif`, `webp`, `bmp`, `tiff`, `svg` |
| Audio | `mp3`, `wav`, `ogg`, `m4a`, `opus`, `flac`, `aac` |
| Video | `mp4`, `mov`, `webm`, `mkv`, `avi` |
| **Documents** | `pdf`, `txt`, `md`, `csv`, `json`, `xml`, `html`, `yaml`, `yml`, `log` |
| **Office** | `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp` |
| **Archives** | `zip`, `rar`, `7z`, `tar`, `gz`, `bz2` |
| **Books / packages** | `epub`, `apk`, `ipa` |

这些列表中的任何文件都会作为原生附件发送到支持它的平台（Telegram, Discord, Signal, Slack, WhatsApp, Feishu, Matrix 等）；在不支持原生的平台上，它将退化为链接或纯文本指示器。**粗体**分类是在最近几次发布中添加的——如果您之前依赖模型说 `here is the file: /path/to/report.docx` 而不是使用 `MEDIA:/path/to/report.docx`，请切换到后者以实现原生交付。

## Webhook 模式

默认情况下，Hermes 使用**长轮询 (long polling)** 连接到 Telegram——网关会向 Telegram 的服务器发起出站请求以获取新的更新。这对于本地和始终在线的部署非常有效。

对于**云部署**（Fly.io, Railway, Render 等），**Webhook 模式**更具成本效益。这些平台可以对入站 HTTP 流量自动唤醒休眠机器，但不能对出站连接进行操作。由于轮询是出站的，因此一个轮询机器人永远无法睡眠。Webhook 模式颠倒了方向——Telegram 将更新推送到您的机器人 HTTPS URL，从而支持“空闲时睡眠”的部署。

| | Polling (默认) | Webhook |
|---|---|---|
| Direction | Gateway → Telegram (出站) | Telegram → Gateway (入站) |
| Best for | 本地、始终在线的服务器 | 支持自动唤醒的云平台 |
| Setup | 无需额外配置 | 设置 `TELEGRAM_WEBHOOK_URL` |
| Idle cost | 机器必须保持运行 | 机器可以在消息之间睡眠 |

### 配置

将以下内容添加到 `~/.hermes/.env`：

```bash
TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
TELEGRAM_WEBHOOK_SECRET="$(openssl rand -hex 32)"  # 必需
# TELEGRAM_WEBHOOK_PORT=8443        # 可选，默认 8443
```

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_WEBHOOK_URL` | Yes | Telegram 将发送更新到的公共 HTTPS URL。URL 路径会自动提取（例如，从上述示例中的 `/telegram`）。 |
| `TELEGRAM_WEBHOOK_SECRET` | **Yes** (当设置了 `TELEGRAM_WEBHOOK_URL` 时) | Telegram 在每次 Webhook 请求中用于验证的秘密令牌。网关在没有它的情况下拒绝启动——请参阅 [GHSA-3vpc-7q5r-276h](https://github.com/NousResearch/hermes-agent/security/advisories/GHSA-3vpc-7q5r-276h)。使用 `openssl rand -hex 32` 生成。 |
| `TELEGRAM_WEBHOOK_PORT` | No | Webhook 服务器监听的本地端口（默认：`8443`）。 |

当设置了 `TELEGRAM_WEBHOOK_URL` 时，网关会启动一个 HTTP webhook 服务器而不是进行轮询。如果未设置，则使用轮询模式——这与以前的版本没有行为上的区别。

### 云部署示例 (Fly.io)

1. 将环境变量添加到您的 Fly.io 应用密钥：

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

如果 Telegram 的 API 被阻止，或者您需要通过代理路由流量，请设置一个特定的 Telegram 代理 URL。这优先于通用的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量。

**选项 1：config.yaml（推荐）**

```yaml
telegram:
  proxy_url: "socks5://127.0.0.1:1080"
```

**选项 2：环境变量**

```bash
TELEGRAM_PROXY=socks5://127.0.0.1:1080
```

支持的方案：`http://`, `https://`, `socks5://`。

该代理适用于主 Telegram 连接和备用 IP 传输。如果未设置特定的 Telegram 代理，网关将回退到 `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`（或 macOS 系统代理自动检测）。

## 主频道

在任何 Telegram 聊天（私信或群组）中使用 `/sethome` 命令将其指定为**主频道**。定时任务（cron jobs）会将结果发送到此频道。

您也可以在 `~/.hermes/.env` 中手动设置它：

```bash
TELEGRAM_HOME_CHANNEL=-1001234567890
TELEGRAM_HOME_CHANNEL_NAME="My Notes"
```

:::tip
群组聊天 ID 是负数（例如 `-1001234567890`）。您的个人私信聊天 ID 与您的用户 ID 相同。
:::

### 主题模式下的定时交付

如果您的机器人私信中启用了主题模式，发送到根聊天的定时消息将进入系统专用大厅——在那里回复不会开启会话，您会看到“主聊天保留给系统命令”的通知。请创建一个专用的论坛主题（例如 `Cron`）并设置：

```bash
TELEGRAM_CRON_THREAD_ID=<topic_thread_id>
```

`TELEGRAM_CRON_THREAD_ID` 只对定时交付起作用，它会覆盖 `TELEGRAM_HOME_CHANNEL_THREAD_ID`。在该主题中的回复将继续该主题现有的会话。

## 语音消息

### 入站语音（语音转文本）

您在 Telegram 上发送的语音消息会由 Hermes 配置的 STT 提供商自动转录，并作为文本注入到对话中。

- `local` 使用运行 Hermes 的机器上的 `faster-whisper` — 无需 API 密钥
- `groq` 使用 Groq Whisper，需要 `GROQ_API_KEY`
- `openai` 使用 OpenAI Whisper，需要 `VOICE_TOOLS_OPENAI_KEY`

#### 跳过 STT：将原始音频文件传递给智能体

如果您更希望**智能体本身**处理音频（例如进行说话人分离、自定义转录工具或仅仅是归档录音），请在 `~/.hermes/config.yaml` 中设置 `stt.enabled: false`：

```yaml
stt:
  enabled: false
```

当禁用 STT 时，网关仍会将语音/音频附件下载到 Hermes 的音频缓存中，但**不会进行转录**。智能体会收到带有标记的消息，例如：

```
[The user sent a voice message: /home/<user>/.hermes/cache/audio/<hash>.ogg]
```

您的工具或技能随后可以直接读取该路径（例如将其交给本地说话人分离管道、更高级的转录模型或上传到长期存储）。文件扩展名反映了 Telegram 提供的原始格式（语音消息为 `.ogg`，音频附件为 `.mp3`/`.m4a`/等）。

这与下方的 [本地 Bot API 服务器](#large-files-20mb-via-local-bot-api-server) 部分自然结合，该部分将 Telegram 的 20MB `getFile` 上限提高到 2GB — 当您想要处理的录音时长超过几分钟时非常有用。

### 出站语音（文本转语音）

当智能体通过 TTS 生成音频时，它会以原生的 Telegram **语音气泡**的形式交付——即圆形、可内联播放的类型。

- **OpenAI 和 ElevenLabs** 原生生成 Opus — 无需额外设置
- **Edge TTS**（默认免费提供商）输出 MP3，需要 **ffmpeg** 转换为 Opus：

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

如果没有 ffmpeg，Edge TTS 音频将作为常规音频文件发送（仍然可播放，但使用的是矩形播放器而不是语音气泡）。

请在 `config.yaml` 的 `tts.provider` 键下配置 TTS 提供商。

## 通过本地 Bot API 服务器处理大文件（>20MB）

Telegram **公共** Bot API 将 `getFile` 下载限制在 **20 MB**，因此任何大于此限制的语音消息、音频文件、视频或文档都会被 Hermes 静默拒绝，并返回“文件太大”的回复。解决此问题的文档化方法是运行一个**本地** [telegram-bot-api](https://github.com/tdlib/telegram-bot-api) 守护进程——这是 Telegram 使用的相同服务器软件，但它运行在您的网络上。本地服务器将文件上限提高到 **2 GB**，当 Hermes 看到配置了自定义 `base_url` 时，也会自动解除其内部限制。

这解锁了诸如：

- 将长语音备忘录（45 分钟的会议、播客）发送给机器人
- 上传大型视频进行视觉工具处理
- 对说话人分离、对齐或训练数据等离线管道归档原始音频

### 第 1 步：获取 Telegram API 凭证

本地服务器直接与 Telegram 的 MTProto 层（而不是公共 Bot API）通信，因此它需要 **MTProto 凭证**：

1. 访问 [my.telegram.org/apps](https://my.telegram.org/apps) 并使用您的 Telegram 帐户登录。
2. 创建一个新的应用程序（任何名称和简短描述都可以）。
3. 复制 `api_id` 和 `api_hash` — 两者都需要。

### 第 2 步：运行 telegram-bot-api 服务器

社区维护的 [`aiogram/telegram-bot-api`](https://hub.docker.com/r/aiogram/telegram-bot-api) Docker 镜像是最简单的路径。一个最小的 `docker-compose.yaml`（使用 `--local` 模式以启用更高的限制）：

```yaml
services:
  tg-bot-api:
    image: aiogram/telegram-bot-api:latest
    container_name: tg-bot-api
    restart: unless-stopped
    ports:
      - "127.0.0.1:8081:8081"   # 仅绑定到本地回环地址；请参阅安全说明
    environment:
      TELEGRAM_API_ID: "12345"           # 第 1 步中的 api_id
      TELEGRAM_API_HASH: "abcdef..."     # 第 1 步中的 api_hash
      TELEGRAM_LOCAL: "1"                # 启用 --local 模式（将 20MB 提升到 2GB）
    volumes:
      - ./tg-bot-api-data:/var/lib/telegram-bot-api
```

启动它：

```bash
docker compose up -d tg-bot-api
docker logs --tail 20 tg-bot-api
```

:::warning 安全警告
本地 Bot API 服务器通过 URL 路径（例如 `/bot<TOKEN>/getMe`）接收您的机器人令牌，**没有任何额外的身份验证**。任何能够访问该端口的人都可以完全控制您的机器人——读取它能看到的每一条消息、以它的名义发送消息等。请将容器绑定到 `127.0.0.1` 和/或 在私有网络上使用反向代理进行保护。**切勿将 8081 端口暴露给公共互联网。**
:::

### 第 3 步：从公共 API 中注销机器人（一次性操作）

一个机器人同时只能在一个 Bot API 服务器上活动。如果您的机器人之前已经在 `api.telegram.org` 上运行（这几乎是肯定的），您必须显式地在本地服务器接受它之前先将其注销：

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/logOut"
# 预期响应: {"ok":true,"result":true}
```

这是一个一次性的迁移步骤——您不需要在每次重启时都重复此操作。Telegram 会通过新服务器来传递 `logOut` 之后收到的任何消息。

验证本地服务器是否可以代表机器人与 Telegram 通信：

```bash
curl "http://127.0.0.1:8081/bot<YOUR_BOT_TOKEN>/getMe"
# 预期响应: {"ok":true,"result":{"id":...,"is_bot":true,...}}
```

### 第 4 步：将 Hermes 指向本地服务器

在 `~/.hermes/config.yaml` 中添加 `platforms.telegram.extra` 下的 URL：

```yaml
platforms:
  telegram:
    extra:
      base_url: "http://127.0.0.1:8081/bot"
      base_file_url: "http://127.0.0.1:8081/file/bot"
      local_mode: true        # 参见下面的第 5 步 — 仅当机器的智能体数据目录可被 Hermes 进程读取时才设置此项
```

:::caution 注意：使用 `platforms.telegram.extra`，而不是 `telegram.extra`
目前只有 `platforms.<name>.extra` 格式会被深度合并到平台配置中。直接放置在顶层 `telegram.extra` 下的键值会被静默忽略。
:::

当设置了 `base_url` 后，Hermes 会：

- 根据本地服务器构建 python-telegram-bot 客户端
- 自动解除其内部文档/音频大小限制（从 20 MB 提升到 2 GB）
- 在“文件太大”的错误消息中报告活动的限制（`Maximum: 2048 MB.`），使其清楚地知道您处于哪种模式下

重启网关，并查找确认日志行：

```bash
hermes gateway restart
grep -E "Using custom Telegram base_url|Using Telegram local_mode" ~/.hermes/logs/gateway.log | tail
```

### 第 5 步：`local_mode` — 磁盘文件访问

本地服务器有**两种方式**交付文件：

1. **不使用 `--local`**（默认）：文件通过 HTTP 在 `/file/bot<TOKEN>/<path>` 上提供服务，与公共 Bot API 相同。20MB 的上限仍然有效。这只适用于网络修复（例如 `api.telegram.org` 不可达但您可以自托管）的情况；这不是您实现大小提升所需要的。
2. **使用 `--local`**（通过上面的 `TELEGRAM_LOCAL=1` 设置）：文件被写入服务器的文件系统，而 `getFile` 响应则返回一个**绝对路径**而不是 HTTP URL。20MB 的上限被解除。Hermes 随后必须从**磁盘**读取字节，而不是通过 HTTP 读取。

要使磁盘读取路径正常工作，请在上面的配置中设置 `local_mode: true` **并且**确保 Hermes 进程可以读取服务器返回的路径。有两种场景：

- **同一台机器** — telegram-bot-api 和 Hermes 在同一主机上运行。将数据卷绑定挂载到 Hermes 可读的目录（例如 `/var/lib/telegram-bot-api`），并确保文件所有权匹配。容器会将权限降级给其内部 `telegram-bot-api` 用户（UID 因镜像而异）；最简单的修复方法是向 compose 服务添加 `user: "<UID>:<GID>"`，以便文件由 Hermes 已经运行的 UID 所拥有。
- **不同机器** — 机器人服务器在一台主机上运行（例如 NAS、单独的 VM），Hermes 在另一台主机上运行。服务器的数据目录必须与 Hermes 主机上的路径保持一致（即服务器报告的**相同绝对路径**，通常是 `/var/lib/telegram-bot-api`）。NFS 对此非常有效；如果不想处理文件系统级别的 UID 不匹配，则可以使用 CIFS/SMB 配合 `uid=` 挂载重映射。

如果设置了 `local_mode: true` 但 Hermes 无法对返回的文件路径执行 `stat`（权限问题或挂载错误），python-telegram-bot 会静默地回退到针对本地服务器的 HTTP `getFile` — 而在 `--local` 模式下，这会响应 `404 Not Found`。症状体现在 `gateway.log` 中为：

```
[Telegram] Failed to cache voice: Not Found
telegram.error.InvalidToken: Not Found
```

如果看到此信息，说明上限提升是有效的，但文件共享功能无效。请从 Hermes 主机上以网关运行的用户身份验证 `/var/lib/telegram-bot-api/<TOKEN>/voice/` 的 `ls -la`，并确认单个文件可以被 `cat` 而没有权限错误。

### 第 6 步：测试它

向机器人发送一个大于 20 MB 的语音消息或音频文件。查看网关日志的尾部：

```bash
tail -f ~/.hermes/logs/gateway.log | grep -iE "telegram|cache"
```

您应该看到一条 `[Telegram] Cached user voice at /home/<user>/.hermes/cache/audio/...` 消息，并且**没有**“文件太大”的拒绝。结合使用 `stt.enabled: false`（上方设置），原始音频文件的路径随后会进入智能体的入站消息，供下游处理。

## 群聊使用

Hermes Agent 在 Telegram 群聊中工作，但需要注意以下几点：

- **隐私模式**决定了机器人能看到哪些消息（参见 [第 3 步](#step-3-privacy-mode-critical-for-groups)）
- `TELEGRAM_ALLOWED_USERS` 仍然适用 — 只有授权用户才能触发机器人，即使在群组中也是如此。
- 您可以使用 `telegram.require_mention: true` 防止机器人对普通的群聊消息做出回应。
- 当设置了 `telegram.require_mention: true` 时，以下类型的群消息会被接受：
  - 对机器人某条消息的回复
  - `@botusername` 提及
  - `/command@botusername`（包含机器人名称的 Telegram 机器人菜单命令形式）
  - 匹配 `telegram.mention_patterns` 中配置的一个正则表达式唤醒词汇
- 在具有多个 Hermes 机器人的群组中，`telegram.exclusive_bot_mentions` 保持路由确定性。当消息明确提及一个或多个 Telegram 机器人用户名时，只有被提及的机器人档案会处理它；其他 Hermes 机器人会在回复和唤醒词回退运行之前忽略它。这是默认启用的。
- 使用 `telegram.ignored_threads` 来让 Hermes 在特定的 Telegram 论坛话题中保持沉默，即使群组本身允许自由回复或提及触发的回复。
- 如果 `telegram.require_mention` 未设置或为 false，Hermes 将保持以前的开放式群聊行为，并对它能看到的正常群消息做出回应。

### 一个群组中的多个 Hermes 机器人

如果您在同一个 Telegram 群组中运行多个 Hermes 配置，请为每个配置创建一套 Telegram 机器人令牌，并为每个配置启动一个网关。**不要重复使用相同的机器人令牌在多个正在运行的网关中**；Telegram 会拒绝对同一令牌进行并发轮询。

推荐的群组配置：

```yaml
telegram:
  require_mention: true
  exclusive_bot_mentions: true
  mention_patterns: []
```

有了这个设置，像 `@research_bot @ops_bot summarize this` 这样的群消息将仅由 `research_bot` 和 `ops_bot` 处理。群组中的其他 Hermes 机器人保持沉默，即使该消息是它们早期消息的回复或本应匹配共享唤醒词汇。

仅当针对旧版群组（明确提及不应该覆盖回复和唤醒词触发器）时才设置 `exclusive_bot_mentions: false`。

要操作多个配置，请为每个配置运行一次网关命令。例如：

```bash
# 默认配置
hermes gateway start
hermes gateway status
hermes gateway stop

# 有命名配置的机器人
hermes -p research gateway start
hermes -p research gateway status
hermes -p research gateway stop
```

对于小型固定集群，请使用一个调用 `hermes gateway <action>` 的 shell 循环或脚本来操作默认配置，并使用 `hermes -p <profile> gateway <action>` 来操作每个命名配置。这比假设单个进程级别的命令控制着所有服务管理器上的每个命名配置要可靠得多。

### 故障排除：在私聊中有效但在群组中无效

如果机器人回复了私聊消息，但在群组中保持沉默，请按顺序检查以下几点：

1. **Telegram 交付：** 关闭 BotFather 的隐私模式，将机器人提升为管理员，或直接提及该机器人。Hermes 无法对 Telegram 从未交付给机器人的群消息做出回应。
2. **更改隐私后的重新加入：** 将机器人从群组中移除，然后在更改 BotFather 隐私设置后再次添加它。Telegram 可能会保留现有成员的旧交付行为。
3. **Hermes 授权：** 确保发送者列在 `TELEGRAM_ALLOWED_USERS` 或 `TELEGRAM_GROUP_ALLOWED_USERS` 中，或者使用 `TELEGRAM_GROUP_ALLOWED_CHATS` 允许该群聊。
4. **提及过滤器：** 如果设置了 `telegram.require_mention: true`，则忽略普通的群聊消息，除非该消息是一个斜杠命令、对机器人的回复、`@botusername` 提及或匹配配置的 `mention_patterns`。
5. **多机器人路由：** 如果一个群组包含多个机器人，请确保每个 Hermes 配置都使用唯一的机器人令牌，并且保持 `exclusive_bot_mentions` 启用状态，除非您故意想要旧版的共享触发器行为。

负聊天 ID 对于 Telegram 群组和超级群组是正常的。如果您使用聊天范围的授权，请将这些 ID 放入 `TELEGRAM_GROUP_ALLOWED_CHATS` 中，而不是发送者用户白名单中。

### 群组触发配置示例

将其添加到 `~/.hermes/config.yaml`：

```yaml
telegram:
  require_mention: true
  exclusive_bot_mentions: true
  mention_patterns:
    - "^\\s*chompy\\b"
  ignored_threads:
    - 31
    - "42"
```

此示例允许所有常规的直接触发器，以及以 `chompy` 开头的消息，即使它们没有使用 `@mention`。Telegram 中的话题 `31` 和 `42` 中的消息在提及和自由回复检查运行之前始终被忽略。

### 关于 `mention_patterns` 的注意事项

- 模式使用 Python 正则表达式
- 匹配是大小不敏感的
- 模式会针对文本消息和媒体标题进行检查
- 无效的正则表达式模式会被警告而不是导致机器人崩溃，并记录在网关日志中
- 如果您希望模式仅在消息开头匹配，请用 `^` 进行锚定

## 私聊话题 (Bot API 9.4)

Telegram Bot API 9.4 (2026年2月) 引入了**私聊话题**——机器人可以直接在一对一的私聊中创建论坛风格的话题串，无需超级群组。这允许你在与 Hermes 的现有私聊中运行多个隔离的工作空间。

### 用例

如果你正在处理多个长期项目，话题可以保持其上下文分离：

- **话题 “网站”** — 处理你的生产网页服务
- **话题 “研究”** — 文献综述和论文探索
- **话题 “通用”** — 杂项任务和快速提问

每个话题都有自己的对话会话、历史记录和上下文——与其它话题完全隔离。

### 配置

:::caution 先决条件
在将话题添加到配置之前，用户必须在与机器人进行的私聊中**启用话题模式**：

1. 打开你在 Telegram 中与 Hermes 机器人的私聊。
2. 点击顶部的机器人名称以打开聊天信息。
3. 启用**话题**（将聊天转换为论坛的开关）。

如果没有此功能，Hermes 在启动时会记录 `The chat is not a forum`，并跳过话题创建。这是一个 Telegram 客户端设置——机器人无法通过程序启用它。
:::

在 `~/.hermes/config.yaml` 中，在 `platforms.telegram.extra.dm_topics` 下添加话题：

```yaml
platforms:
  telegram:
    extra:
      dm_topics:
      - chat_id: 123456789        # Your Telegram user ID
        topics:
        - name: General
          icon_color: 7322096
        - name: Website
          icon_color: 9367192
        - name: Research
          icon_color: 16766590
          skill: arxiv              # Auto-load a skill in this topic
```

**字段说明：**

| 字段 | 是否必需 | 说明 |
|-------|----------|-------------|
| `name` | 是 | 话题显示名称 |
| `icon_color` | 否 | Telegram 图标颜色代码（整数） |
| `icon_custom_emoji_id` | 否 | 话题图标的自定义表情符号 ID |
| `skill` | 否 | 在此话题的新会话中自动加载的技能 |
| `thread_id` | 否 | 话题创建后自动填充——请勿手动设置 |

### 工作原理

1. 在网关启动时，Hermes 会为所有尚未拥有 `thread_id` 的话题调用 `createForumTopic`。
2. `thread_id` 会自动保存回 `config.yaml`——后续重启将跳过 API 调用。
3. 每个话题都映射到一个隔离的会话键：`智能体:main:telegram:dm:{chat_id}:{thread_id}`
4. 每个话题中的消息都有自己的对话历史、内存刷新和上下文窗口。

### 根私聊处理

默认情况下，发送到根私聊（即不在任何话题中的消息）会正常处理。设置 `ignore_root_dm: true` 可以将根私聊设置为一个大厅——对于配置了 DM 话题的用户，普通消息会被静默忽略，而系统命令（`/start`、`/help`、`/status` 等）仍然有效。

```yaml
platforms:
  telegram:
    extra:
      ignore_root_dm: true
      dm_topics:
        - chat_id: 123456789
          topics:
            - name: General
```

检查是**针对每个聊天**的：只有在 `dm_topics` 中至少有一个条目的用户，其根私聊才会被影响。没有配置话题的用户不受影响。

### 技能绑定

带有 `skill` 字段的话题会在新会话开始时自动加载该技能。这与在对话开始时输入 `/skill-name` 完全相同——技能内容会被注入到第一条消息中，后续的消息也会在聊天历史记录中看到它。

例如，一个带有 `skill: arxiv` 的话题会在其会话重置时（由于空闲超时、每日重置或手动 `/reset`）预加载 arxiv 技能。

:::tip
在配置之外创建的话题（例如通过手动调用 Telegram API 创建的）会在收到 `forum_topic_created` 服务消息时自动发现。你也可以在网关运行时向配置中添加话题——它们将在下一次缓存未命中时被拾取。
:::

## 多会话 DM 模式（`/topic`）

这是一种 ChatGPT 式的多会话 DM — 一个机器人，多个并行对话。与上述由操作员策划的 `extra.dm_topics` 不同，此模式是**用户驱动**的：无需配置，没有预先声明的主题名称。最终用户通过 `/topic` 开启它，然后点击 Telegram **+** 按钮创建任意数量的主题，每个主题都是一个完全独立的 Hermes 会话。

### `/topic` 子命令

| 形式 | 上下文 | 效果 |
| :--- | :--- | :--- |
| `/topic` | 根 DM，尚未启用 | 检查 BotFather 功能，启用多会话模式，创建固定的系统主题 |
| `/topic` | 根 DM，已启用 | 显示状态：可供恢复的未链接会话 |
| `/topic` | 在一个主题内 | 显示当前主题的会话绑定信息 |
| `/topic help` | 任何 | 内联用法说明 |
| `/topic off` | 根 DM | 禁用多会话模式并清除此聊天中的所有主题绑定 |
| `/topic <session-id>` | 在一个主题内 | 将以前的 Telegram 会话恢复到当前主题中 |

只有授权用户（通过 `TELEGRAM_ALLOWED_USERS` / 平台认证配置）才能运行 `/topic`。未经授权的发送者会收到拒绝，而不是激活。

### DM 主题 vs 多会话 DM 模式

| | `extra.dm_topics` (配置驱动) | `/topic` (用户驱动) |
| :--- | :--- | :--- |
| 谁激活它 | 操作员，在 `config.yaml` 中 | 最终用户，通过发送 `/topic` |
| 主题列表 | 配置中固定的集合 | 用户可以自由创建/删除主题 |
| 主题名称 | 由操作员选择 | 由用户选择；自动重命名以匹配 Hermes 会话标题 |
| 根 DM 行为 | 普通聊天（如果 `ignore_root_dm: true` 则为大厅） | 成为一个系统大厅（非命令消息将被拒绝） |
| 主要用例 | 带可选技能绑定的永久工作区 | 即时并行会话 |
| 持久性 | 配置中的 `extra.dm_topics` | SQLite 表 `telegram_dm_topic_mode` + `telegram_dm_topic_bindings` |

这两个功能可以共存于同一个机器人中 — 你可以从用户的 DM 中运行 `/topic`，而 `extra.dm_topics` 则继续管理操作员为其他聊天声明的主题。

### 先决条件

在 **@BotFather** 中，打开你的机器人 → **Bot Settings (机器人设置) → Threads Settings (线程设置)**：

1.  开启 **Threaded Mode (线程模式)**（启用 `has_topics_enabled`）
2.  **不要**禁用用户创建主题（保持 `allows_users_to_create_topics` 开启）

当用户首次运行 `/topic` 时，Hermes 会调用 `getMe` 来验证这两个标志。如果任一标志关闭，Hermes 将发送 BotFather 线程设置页面的截图，并解释需要切换哪些选项 — 直到满足先决条件，都不会进行激活。

### 激活流程

从根 DM 发送：

```
/topic
```

Hermes 将会：

1.  检查 `getMe().has_topics_enabled` 和 `allows_users_to_create_topics`
2.  如果两者都为真，则为该 DM 启用多会话主题模式
3.  创建并固定一个**系统**主题用于状态/命令（尽力而为）
4.  回复一份用户可以恢复的以前未链接 Telegram 会话列表

激活后，**根 DM 将成为一个大厅**：普通提示消息将被拒绝，并提供指向 **All Messages (所有消息)** 的指导。系统命令（`/status`、`/sessions`、`/usage`、`/help` 等）在根目录中仍然有效。

### 创建新主题（最终用户流程）

1.  打开 Telegram 中的机器人 DM
2.  点击机器人界面的顶部 **All Messages (所有消息)**，然后发送任何消息
3.  Telegram 为该消息创建一个新主题
4.  Hermes 在该主题内回复 — 该主题现在是一个独立的会话

每个主题都有自己的对话历史、模型状态、工具执行和会话 ID。隔离密钥是 `agent:main:telegram:dm:{chat_id}:{thread_id}` — 与配置驱动的 DM 主题隔离保持一致。

### 自动重命名主题

当 Hermes 为一个主题生成会话标题时（通过自动标题流程，在第一次交流之后），Telegram 主题本身也会被重命名以匹配 — 例如，“New Topic”将变为“Database migration plan”。这个重命名是尽力而为的：失败会被记录下来，但不会中断会话。

要禁用此功能并保持手动选择的主题名称不变，请设置：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        disable_topic_auto_rename: true
```

当此标志开启时，Hermes 仍然会生成一个内部会话标题（用于 `hermes sessions`、TUI 等），但绝不会编辑 Telegram 主题名称。这在您通过 BotFather 线程模式手动组织主题，不希望每次回复都覆盖标题时特别有用。

### 在主题内使用 `/new`

重置当前主题的会话（新的会话 ID，全新的历史记录），而不会影响其他主题。Hermes 会回复一条提醒，指出对于并行工作而言，通常应该通过 **All Messages (所有消息)** 创建另一个主题。

### 恢复以前的会话

在主题内发送：

```
/topic <session-id>
```

这会将当前主题绑定到一个现有的 Hermes 会话上，而不是从零开始。这对于继续一个在启用主题模式之前开始的对话非常有用。限制条件：

*   目标会话必须属于同一个 Telegram 用户
*   目标会话不得已绑定到另一个主题

Hermes 将通过会话标题进行确认，并重播最后一条助手的消息以提供上下文。

要发现会话 ID，请在根 DM 中发送 `/topic`（不带参数）— Hermes 会列出用户的未链接 Telegram 会话。

### 主题内使用 `/topic`（不带参数）

显示当前主题的绑定信息：会话标题、会话 ID 以及关于使用 `/new` 还是创建另一个主题的提示。

### 底层机制 (Under the hood)

*   激活状态持久化到 `state.db` 中的 `telegram_dm_topic_mode(chat_id, user_id, enabled, ...)`
*   每个主题绑定都持久化到 `telegram_dm_topic_bindings(chat_id, thread_id, session_id, ...)`，并且在 `session_id` 上设置了 `ON DELETE CASCADE` — 剪除一个会话会自动清除其主题绑定。
*   主题模式的 SQLite 迁移是**可选的**：它在第一次调用 `/topic` 时运行，而不是在网关启动时运行。除非用户在此配置中运行 `/topic`，否则 `state.db` 将保持不变。
*   每个传入的 DM 消息都会查找其 `(chat_id, thread_id)` 绑定。如果存在，则该查找会将消息路由到绑定的会话，通过 `SessionStore.switch_session()` 实现，从而使磁盘上的会话键到会话 ID 的映射保持一致。
*   主题内的 `/new` 会重写绑定行以指向新的会话 ID，因此下一条消息将停留在新的会话上。
*   在 `extra.dm_topics` 中声明的主题**绝不会自动重命名** — 即使启用了多会话模式，操作员选择的名称也会被保留。
*   设置 `extra.disable_topic_auto_rename: true` 可关闭聊天中所有主题（包括通过线程模式创建的即时主题）的自动重命名功能。
*   在支持论坛功能的 DM 中，通用（固定的顶部）主题被视为根大厅，无论 Telegram 是使用 `message_thread_id=1` 还是不带 thread_id 来投递其消息。
*   根大厅提醒限制为每个聊天每 30 秒一条消息 — 一个忘记了主题模式的用户在根目录中输入十个提示，也不会得到十条回复。
*   BotFather 设置截图的发送频率限制为每 5 分钟一个聊天 — 在线程设置仍未禁用时重复 `/topic` 尝试不会重新上传相同的图片。
*   在主题内启动的 `/background <prompt>` 会将其结果返回到同一个主题；后台会话不会触发拥有主题的自动重命名。
*   `/topic` 本身受到机器人的用户授权检查限制 — 未授权的 DM 将收到拒绝，而不是激活。

### 禁用多会话模式

在根 DM 中发送 `/topic off`。Hermes 会关闭该行记录，清除聊天的 `(thread_id → session_id)` 绑定，而根 DM 则恢复为正常的 Hermes 聊天。Telegram 中的现有主题不会被删除 — 它们只是不再被限制为独立的会话。稍后重新运行 `/topic` 即可将其重新开启。

如果你需要手动清理（例如跨多个聊天的批量重置），请直接移除这些行：

```bash
sqlite3 ~/.hermes/state.db \
  "UPDATE telegram_dm_topic_mode SET enabled = 0 WHERE chat_id = '<your_chat_id>'; \
   DELETE FROM telegram_dm_topic_bindings WHERE chat_id = '<your_chat_id>';"
```

### 降级 Hermes

如果你降级到早于 `/topic` 的 Hermes 版本，该功能将停止工作 — `telegram_dm_topic_mode` 和 `telegram_dm_topic_bindings` 表仍然存在于 `state.db` 中，但会被旧代码忽略。DM 会恢复到原生的每个线程隔离（每个 `message_thread_id` 仍然通过 `build_session_key` 获得自己的会话），因此你现有的 Telegram 主题仍可作为并行会话继续使用。根 DM 不再是大厅 — 那里的消息将像以前一样进入智能体。重新升级后，多会话模式将完全恢复到原来的状态。

## 群组论坛主题技能绑定

启用了**主题模式**（也称为“论坛主题”）的超级群组，本身就具备了按主题进行会话隔离的功能——每个`thread_id`都对应着自己的对话。但您可能希望在消息到达特定群组主题时自动加载一个技能，就像私聊主题技能绑定一样。

### 使用场景

一个为不同工作流设置了论坛主题的团队超级群组：

- **工程**主题 → 自动加载 `software-development` 技能
- **研究**主题 → 自动加载 `arxiv` 技能
- **通用**主题 → 无特定技能，提供通用助手功能

### 配置

在 `~/.hermes/config.yaml` 中，在 `platforms.telegram.extra.group_topics` 下添加主题绑定：

```yaml
platforms:
  telegram:
    extra:
      group_topics:
      - chat_id: -1001234567890       # 超级群组ID
        topics:
        - name: Engineering
          thread_id: 5
          skill: software-development
        - name: Research
          thread_id: 12
          skill: arxiv
        - name: General
          thread_id: 1
          # 无特定技能 — 通用功能
```

**字段说明：**

| 字段 | 是否必需 | 描述 |
|-------|----------|-------------|
| `chat_id` | 是 | 超级群组的数字ID（以 `-100` 开头的负数） |
| `name` | 否 | 主题的人类可读标签（仅供参考） |
| `thread_id` | 是 | Telegram 论坛主题 ID — 可在 `t.me/c/<group_id>/<thread_id>` 链接中看到 |
| `skill` | 否 | 在此主题的新会话中自动加载的技能 |

### 工作原理

1. 当消息到达已绑定的群组主题时，Hermes 会查找 `group_topics` 配置中的 `chat_id` 和 `thread_id`。
2. 如果匹配的条目包含 `skill` 字段，则该技能会被自动加载到会话中——这与私聊主题的技能绑定功能是相同的。
3. 没有 `skill` 键的主题只获得会话隔离（现有行为，保持不变）。
4. 未绑定的 `thread_id` 或 `chat_id` 值将静默忽略 — 不报错，不加载技能。

### 与私聊主题的区别

| | 私聊主题 (DM Topics) | 群组主题 (Group Topics) |
|---|---|---|
| 配置键 | `extra.dm_topics` | `extra.group_topics` |
| 主题创建 | 如果缺少 `thread_id`，Hermes 会通过 API 创建主题 | 管理员在 Telegram UI 中创建主题 |
| `thread_id` | 创建后自动填充 | 必须手动设置 |
| `icon_color` / `icon_custom_emoji_id` | 支持 | 不适用（管理员控制外观） |
| 技能绑定 | ✓ | ✓ |
| 会话隔离 | ✓ | ✓ (论坛主题本身就内置此功能) |

:::tip
要查找一个主题的 `thread_id`，请在 Telegram Web 或桌面版中打开该主题并查看 URL：`https://t.me/c/1234567890/5` — 最后一个数字（`5`）就是 `thread_id`。超级群组的 `chat_id` 是以 `-100` 开头的群组 ID（例如，群组 `1234567890` 应为 `-1001234567890`）。
:::

## 最近的Bot API功能

- **Bot API 9.4 (2026年2月):** 私聊主题 — 机器人可以通过 `createForumTopic` 在一对一私聊中创建论坛主题。Hermes 利用此功能实现了两个不同的特性：由操作员策划的[私聊主题](#private-chat-topics-bot-api-94)（配置驱动，固定主题列表）和用户驱动的[多会话DM模式](#multi-session-dm-mode-topic)（通过 `/topic` 激活，无限的用户创建主题）。
- **隐私政策:** Telegram 现在要求机器人必须有隐私政策。您可以通过 BotFather 使用 `/setprivacy_policy` 设置一个，否则 Telegram 可能会自动生成一个占位符。如果您的机器人面向公众，这一点尤为重要。
- **Bot API 9.5 (2026年3月): `sendMessageDraft` 的原生流式传输功能。** Hermes 支持 Telegram 的原生流式草稿 API 作为私聊的可选传输方式。默认仍使用传统的 `editMessageText` 路径，因为在某些 Telegram 客户端上，草稿预览可能会可见地收缩和重新渲染。

### 流传输方式 (`gateway.streaming.transport`)

当启用流式传输（`gateway.streaming.enabled: true`）时，Hermes 会选择以下四种传输方式之一：

| 值 | 行为 |
|---|---|
| `auto` (默认) | 在支持的聊天中进行原生草稿流式传输（目前是 Telegram DM）；否则使用传统的基于编辑的路径。如果草稿框架失败，则优雅地回退。 |
| `draft` | 强制使用原生草稿。会记录一次降级日志，如果聊天不支持草稿（例如群组/主题），则回退到编辑模式。 |
| `edit` | 对所有聊天类型进行传统的渐进式 `editMessageText` 轮询。 |
| `off` | 完全禁用流式传输（仅最终回复，不提供渐进更新）。 |

在 `~/.hermes/config.yaml` 中：

```yaml
gateway:
  streaming:
    enabled: true
    transport: auto    # auto | draft | edit | off
```

**使用 `edit` (默认) 时的 DM 体验** — 网关会发送一个正常的预览消息，并通过 `editMessageText` 进行渐进式更新，从而避免 Telegram 的草稿预览收缩/回滚效果。

**使用 `auto` 或 `draft` 时的 DM 体验** — Telegram 会显示一个逐字更新的动画草稿预览。当回复完成时，它会作为一条常规消息交付，草稿预览会在客户端自然消失。草稿没有消息 ID，因此最终定稿的内容才是保留在聊天历史记录中的内容。

**那群组、超级群组和论坛主题呢？** Telegram 将 `sendMessageDraft` 限制于私聊（DM）。网关会透明地为其他所有情况回退到基于编辑的路径 — UX 与以前相同。

**如果草稿框架失败了怎么办？** 任何故障（瞬态网络错误、服务器端拒绝、旧版 python-telegram-bot 安装）都会将该响应翻转回基于编辑的路径，直到流传输完成。下一个响应会进行一次新的尝试。

## 渲染：富消息、表格和链接预览

**富消息（Bot API 10.1）。** 包含建构了旧版 MarkdownV2 路径会降级的结构——表格、任务列表、可折叠的 `<details>` 和块数学——的最终回复，是通过使用智能体的 **原始 markdown** 调用 Telegram 原生的 [`sendRichMessage`](https://core.telegram.org/bots/api#sendrichmessage) 发送的，因此它们以原生方式渲染，无需客户端扁平化。在流式传输过程中，最终答案通过 `editMessageText` 的 `rich_message` 参数**原地编辑现有预览**来交付——没有第二个消息，不需要删除，因此在一次交互结束时不会出现重复交付闪烁。在私聊（DMs）中，实时流媒体预览也使用 `sendRichMessageDraft`，因此动画草稿与最终富消息相匹配。普通的回复（纯文本、粗体/斜体、简单列表）则保持在 MarkdownV2 路径上，以确保客户端之间字体重量和间距的一致性。

当内容超过 32,768 个字符的富文本限制时，会自动跳过富消息路径，任何来自 Telegram 的拒绝（旧版 `python-telegram-bot` 上不支持的端点、解析器错误、超大块/列）都会**透明地回退**到 MarkdownV2 路径——您的消息永远不会丢失。瞬态/网络错误*不会*被静默重发（没有重复的最终消息）。

**MarkdownV2 回退。** 当消息无法使用富消息路径时，Hermes 会将 markdown 转换为 MarkdownV2。由于 MarkdownV2 没有原生的表格语法，因此管道表格会被标准化：

- **小型表格**会被扁平化为**行组项目符号**——每一行都成为列标题下的一个可读项目列表。适用于 2–4 列和短单元格的情况。
- **更大或更宽的表格**会回退到带有对齐列的**围栏代码块**，以确保内容不会崩溃。

富消息是**可选启用**的。默认设置保持在旧版的 MarkdownV2 路径上，因为当前的 Telegram 客户端很难将 Bot API 富消息复制为纯文本，这对命令片段和移动端操作尤为痛苦。要启用对表格/任务列表/详情/数学的原生渲染：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        rich_messages: true
        rich_drafts: false
```

此设置用于客户端渲染/复制兼容性；当 Telegram 拒绝富 API 调用时，Hermes 会自动回退。`rich_drafts` 控制着 Telegram DM 流式传输期间实验性的富草稿预览路径，默认保持关闭，因为 Telegram Desktop/macOS 会在聊天重绘之前视觉上叠加富草稿框架。如果您只想启用富消息，但同时禁用表格标准化，请设置 `telegram.pretty_tables: false`（默认值：`true`），以获得旧的“始终使用代码块”表格行为。

**链接预览。** Telegram 会自动为机器人消息中的 URL 生成链接预览。如果您想抑制这些预览（例如，长篇 `/tools` 输出、提及十个链接的智能体回复等）：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        disable_link_previews: true
```

启用后，Hermes 会将 Telegram 的 `LinkPreviewOptions(is_disabled=True)` 附加到每个发送的消息上，并回退到旧版 `python-telegram-bot` 中的 `disable_web_page_preview` 参数。

## 群组白名单

Telegram 群组和论坛聊天具有两个可以配置的正交（orthogonal）门控机制：

- **发送者用户 ID** (`group_allow_from` / `TELEGRAM_GROUP_ALLOWED_USERS`) — 仅适用于群组/论坛消息的发送者范围白名单。当您希望特定用户能够在群组中调用机器人，而无需将他们添加到 `TELEGRAM_ALLOWED_USERS`（这也会授予他们私聊权限）时，请使用此项。
- **聊天 ID** (`group_allowed_chats` / `TELEGRAM_GROUP_ALLOWED_CHATS`) — 聊天范围白名单。这些群组/论坛的任何成员都可以与机器人互动。这对团队/支持机器人特别有用，因为群组成员身份本身就是访问信号。

```yaml
gateway:
  platforms:
    telegram:
      extra:
        # 全局访问（私聊 + 群组）。此处的用户始终可以调用机器人。
        allow_from:
          - "123456789"
        # 仅允许在群组/论坛中发送的发送者 ID。不授予私聊权限。
        group_allow_from:
          - "987654321"
        # 整个群组/论坛——任何成员都获得授权。
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
- `TELEGRAM_GROUP_ALLOWED_USERS` 仅授权列出的发送者在群组/论坛中的身份。除非他们被列入 `TELEGRAM_ALLOWED_USERS`，否则他们仍然无法私聊机器人。
- `TELEGRAM_GROUP_ALLOWED_CHATS` 中的聊天会授权该聊天中的每个成员，而与发送者无关。
- 在任何一项中使用 `*` 均可允许任何发送者/聊天。
- 这层机制叠加在现有的提及/模式触发器和 `group_topics` + `ignored_threads` 之上。

### 从 PR #17686 之前的版本迁移

在此分割之前，`TELEGRAM_GROUP_ALLOWED_USERS` 是唯一的控制项，用户们将**聊天 ID**放入其中。为了向后兼容性，`TELEGRAM_GROUP_ALLOWED_USERS` 中以 `-` 开头的聊天 ID 格式值仍然被视为聊天 ID，并且只会记录一次弃用警告。迁移方法：

```bash
# 旧版本（仍可用，但已弃用）
TELEGRAM_GROUP_ALLOWED_USERS="-1001234567890"

# 新版本
TELEGRAM_GROUP_ALLOWED_CHATS="-1001234567890"
```

### 访客 @提及绕过（`guest_mode`）

在典型的设置中，`group_allowed_chats` 是一个硬性门控：来自列表之外的群组消息会被静默丢弃，即使成员明确地 `@mention` 了机器人。这是支持/团队机器人的正确默认设置。

对于更随意的设置——您希望机器人**大部分保持沉默**但**偶尔可以响应显式呼叫**的朋友群聊——请启用 `guest_mode`：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        group_allowed_chats:
          - "-1001234567890"   # 您的主白名单群组
        guest_mode: true       # 非白名单群组：仅在 @mention 时允许响应
```

等效的环境变量：

```bash
TELEGRAM_GUEST_MODE=true
```

默认值：`false`。

当 `guest_mode: true` 时，来自非白名单群组的消息**只有**在其明确 `@mention` 机器人时才会被处理。每次交互都必须进行提及——访客互动没有会话粘性（session stickiness），因此机器人不会自动参与到一个它未被呼叫的朋友群聊线程中。

私聊和白名单群组的行为保持不变。

## 斜杠命令访问控制

默认情况下，所有被允许的用户都可以运行所有的斜杠命令。要将您的白名单划分为**管理员**（拥有完整的斜杠命令权限）和**普通用户**（只能使用您明确启用的命令），请在平台的 `extra` 块中添加 `allow_admin_from` 和 `user_allowed_commands`：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        # Existing allowlists (unchanged)
        allow_from:
          - "123456789"     # admin
          - "555555555"     # regular user
          - "777777777"     # regular user

        # NEW — admins get all slash commands (built-in + plugin)
        allow_admin_from:
          - "123456789"

        # NEW — non-admin allowed users can only run these slash commands.
        # /help and /whoami are always allowed so users can see their access.
        user_allowed_commands:
          - status
          - model
          - history

        # Optional: separate admin/command lists for groups
        group_allow_admin_from:
          - "123456789"
        group_user_allowed_commands:
          - status
```

**行为说明：**

*   在特定范围（私聊或群组）中列于 `allow_admin_from` 的用户可以通过实时注册表运行**所有**已注册的斜杠命令——包括内置命令和插件注册的命令。
*   在 `allow_from` 中但不在 `allow_admin_from` 中的用户只能运行 `user_allowed_commands` 中列出的命令，以及始终允许的基础命令：`/help` 和 `/whoami`。
*   普通聊天（非斜杠消息）不受影响。非管理员用户仍然可以正常与智能体交流，只是不能触发任意命令。
*   **向后兼容性：** 如果某个范围没有设置 `allow_admin_from`，则禁用该范围的斜杠命令限制。现有安装无需更改即可继续工作。
*   私聊管理员状态不代表群组管理员状态。每个范围都有自己的管理员列表。
*   如果只设置了 `group_allow_admin_from`，则私聊范围保持不受限制（向后兼容）模式。

使用 `/whoami` 查看活动范围、您的层级（管理员/用户/无限制）以及您可以运行哪些斜杠命令。

## 交互式模型选择器

当您在 Telegram 聊天中发送 `/model` 但不带任何参数时，Hermes 会显示一个用于切换模型的交互式内联键盘：

1.  **提供商选择** — 显示每个可用提供商及其模型数量的按钮（例如，“OpenAI (15)”，“✓ Anthropic (12)”表示当前提供商）。
2.  **模型选择** — 带有 **上一页/下一页** 导航、一个返回到提供商的 **返回** 按钮和 **取消** 按钮的分页式模型列表。

当前的模型和提供商会显示在顶部。所有导航都通过原地编辑同一条消息来完成（不会造成聊天混乱）。

:::tip
如果您知道确切的模型名称，请直接输入 `/model <名称>` 以跳过选择器。您也可以输入 `/model <名称> --global` 来跨会话持久化更改。
:::

## DNS-over-HTTPS 故障转移 IP

在某些受限网络中，`api.telegram.org` 可能解析到一个无法访问的 IP 地址。Telegram 适配器包含一个**故障转移 IP**机制，它可以在保持正确的 TLS 主机名和 SNI 的同时，透明地尝试连接到替代 IP。

### 工作原理

1.  如果设置了 `TELEGRAM_FALLBACK_IPS`，则直接使用这些 IP。
2.  否则，适配器会自动通过 DNS-over-HTTPS (DoH) 查询**Google DNS**和**Cloudflare DNS**，以发现 `api.telegram.org` 的替代 IP。
3.  由 DoH 返回且与系统 DNS 结果不同的 IP 将被用作故障转移 IP。
4.  如果 DoH 也被阻止，则使用硬编码的种子 IP（`149.154.167.220`）作为最后的手段。
5.  一旦某个故障转移 IP 成功，它就会变得“粘性”——后续请求会直接使用它，而不会先尝试主路径。

### 配置

```bash
# 显式故障转移 IP（逗号分隔）
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
您通常不需要手动配置此项。通过 DoH 的自动发现功能可以处理大多数受限网络场景。只有当您的网络上层也阻止了 DoH 时，才需要设置 `TELEGRAM_FALLBACK_IPS` 环境变量。
:::

## 代理支持

如果您的网络要求使用 HTTP 代理才能访问互联网（企业环境中常见），Telegram 适配器会自动读取标准的代理环境变量，并通过该代理路由所有连接。

### 支持的变量

适配器会按顺序检查这些环境变量，并使用第一个设置了的：

1.  `HTTPS_PROXY`
2.  `HTTP_PROXY`
3.  `ALL_PROXY`
4.  `https_proxy` / `http_proxy` / `all_proxy`（小写变体）

### 配置

在启动网关之前，请在环境中设置代理：

```bash
export HTTPS_PROXY=http://proxy.example.com:8080
hermes gateway
```

或者将其添加到 `~/.hermes/.env`：

```bash
HTTPS_PROXY=http://proxy.example.com:8080
```

代理适用于主传输和所有故障转移 IP 传输。无需额外的 Hermes 配置——如果设置了环境变量，它就会被自动使用。

:::note
这涵盖了 Hermes 用于 Telegram 连接的自定义故障转移传输层。其他地方使用的标准 `httpx` 客户端原生就支持代理环境变量。
:::

## 消息反应 (Reactions)

机器人可以对消息添加表情符号反应作为视觉处理反馈：

*   👀 当机器人开始处理您的消息时
*   ✅ 当响应成功送达时
*   ❌ 如果处理过程中发生错误时

反应功能**默认禁用**。请在 `config.yaml` 中启用它们：

```yaml
telegram:
  reactions: true
```

或者通过环境变量：

```bash
TELEGRAM_REACTIONS=true
```

:::note
与 Discord（反应是累加的）不同，Telegram 的 Bot API 会在一个调用中替换所有机器人反应。从 👀 到 ✅/❌ 的转换是原子的——您不会同时看到两者。
:::

:::tip
如果机器人没有权限在群组中添加反应，反应调用会静默失败，消息处理仍将正常进行。
:::

## 频道级提示 (Per-Channel Prompts)

为特定的 Telegram 群组或论坛话题分配临时的系统提示。该提示会在每一次交互运行时注入——不会持久化到转录历史记录中——因此更改立即生效。

```yaml
telegram:
  channel_prompts:
    "-1001234567890": |
      你是一名研究助理。专注于学术来源、引用和简洁的综合分析。
    "42":  |
      这个话题是用于创意写作反馈的。请保持友好和建设性。
```

键是聊天 ID（群组/超级群组）或论坛话题 ID。对于论坛群组，话题级别的提示会覆盖群组级别的提示：

*   在群组 `-1001234567890` 内的 `42` 话题中的消息 → 使用 `42` 的话题提示
*   在没有明确条目的 `99` 话题中的消息 → 回退到群组 `-1001234567890` 的提示
*   在没有对应条目的群组中的消息 → 不应用频道提示

数值 YAML 键会自动转换为字符串。

## 故障排除 (Troubleshooting)

| 问题 | 解决方案 |
|---------|----------|
| 机器人完全无响应 | 验证 `TELEGRAM_BOT_TOKEN` 是否正确。检查 `hermes gateway` 日志中的错误。 |
| 机器人回复“unauthorized” | 您的用户 ID 不在 `TELEGRAM_ALLOWED_USERS` 中。请使用 @userinfobot 进行二次检查。 |
| 机器人忽略群组消息 | 很可能是隐私模式开启了。禁用它（第 3 步）或将机器人设为群管理员。**请记住更改隐私设置后移除并重新添加机器人。** |
| 语音消息未转录 | 验证 STT 是否可用：安装 `faster-whisper` 进行本地转录，或者在 `~/.hermes/.env` 中设置 `GROQ_API_KEY` / `VOICE_TOOLS_OPENAI_KEY`。 |
| 语音回复是文件而不是气泡 | 安装 `ffmpeg`（Edge TTS Opus 转换所需的）。 |
| 机器人令牌被撤销/无效 | 通过 BotFather 中的 `/revoke` 然后 `/newbot` 或 `/token` 生成新令牌。更新您的 `.env` 文件。 |
| Webhook 未接收更新 | 验证 `TELEGRAM_WEBHOOK_URL` 是否可公开访问（使用 `curl` 进行测试）。确保您的平台/反向代理将来自 URL 端口的入站 HTTPS 流量路由到由 `TELEGRAM_WEBHOOK_PORT` 配置的本地监听端口（它们不需要是相同的数字）。确保 SSL/TLS 已激活——Telegram 只发送到 HTTPS URL。检查防火墙规则。 |

## 执行批准 (Exec Approval)

当智能体尝试运行一个潜在危险的命令时，它会在聊天中请求您的批准：

> ⚠️ 此命令具有潜在危险性（递归删除）。回复“yes”以批准。

回复 "yes"/"y" 以批准，回复 "no"/"n" 以拒绝。

## 交互式提示 (Interactive Prompts) (澄清)

当智能体调用 `clarify` 工具——以询问您偏好的方法、获取任务后的反馈或在进行非琐碎决策前检查时——Telegram 会使用**内联键盘按钮**渲染该问题：

> ❓ 我应该为仪表板使用哪个框架？
>
> [1. Next.js] [2. Remix] [3. Astro]
> [✏️ 其他 (输入答案)]

点击按钮进行回答，或者点击 **其他** 以输入自由形式的回复（您发送的下一条消息将成为答案）。开放式的 `clarify` 调用（没有预设选项）会跳过按钮，只捕获您的下一条消息。

通过 `~/.hermes/config.yaml` 中的 `agent.clarify_timeout` 配置响应超时时间（默认 600 秒）。如果在超时内没有回复，智能体将不会挂起，而是发出一个哨兵消息并进行调整。

## 推送通知音量 (Push notification volume)

Telegram 会对机器人发送的每条消息触发一次推送通知。对于会发出工具进度气泡、流式更新和状态回调的长时间智能体回合来说，这很快就会变得嘈杂。Telegram 适配器有两种通知模式：

| 模式 | 行为 |
|------|----------|
| `important` (默认) | 仅**最终响应**、**批准提示**和**斜杠命令确认**会触发通知。工具进度、流式块和状态消息会以 `disable_notification=true` 发送。 |
| `all` | 每条发出的消息都会触发一次推送通知。这是旧行为；如果您真的想知道每一次工具调用，可以选择此项。 |

在 `~/.hermes/config.yaml` 中配置：

```yaml
display:
  platforms:
    telegram:
      notifications: important   # 或 "all"
```

环境变量覆盖（便于快速 A/B 测试）：

```bash
HERMES_TELEGRAM_NOTIFICATIONS=all
```

未知值会记录警告并回退到 `important`。

## 原地编辑的状态消息 (Status messages edited in place)

Telegram 适配器通过 `send_or_update_status()` 来路由重复的智能体状态回调（例如，“正在压缩上下文…”，“正在调用工具…”），该函数维护一个 `{(chat_id, status_key) → message_id}` 缓存，并在后续发出时**编辑现有气泡**而不是每次都追加一个新的。不同的 `status_key` 值会获得自己的消息；不同的聊天不会相互冲突。如果编辑失败（例如用户删除了消息，或者它比 Telegram 允许的编辑时间更早），则丢弃缓存条目，下一次发送将发布一条新的消息并重新缓存其 ID。无需配置——这是默认的 Telegram 行为。其他不实现 `send_or_update_status` 的适配器将保持不变地通过 `send()` 发送。

## 钉住智能体回合中的传入用户消息 (Pin incoming user message during agent turn)

当用户发送一条触发智能体回合的消息时，Telegram 适配器会针对该传入消息将其“钉住”，并在响应完成后解除钉住——这是一个轻量级的视觉指示，表明机器人正在积极处理该消息而不是忽略它。此钉住功能使用 `disable_notification=true` 以避免额外的提示音。无需配置。

## 安全性 (Security)

:::warning
始终设置 `TELEGRAM_ALLOWED_USERS` 以限制谁可以与您的机器人进行交互。如果没有设置，网关将默认拒绝所有用户，以起到安全保障作用。
:::

切勿公开分享您的机器人令牌。如果泄露，请立即通过 BotFather 的 `/revoke` 命令撤销它。

有关更多详情，请参阅 [安全文档](/user-guide/security)。您还可以使用 [DM 配对](/user-guide/messaging#dm-pairing-alternative-to-allowlists) 来实现更动态的用户授权方法。