---
sidebar_position: 1
title: "Telegram"
description: "将 Hermes 智能体设置为 Telegram 机器人"
---

# Telegram 设置

Hermes 智能体可作为功能齐全的会话机器人与 Telegram 集成。连接后，您可以从任何设备与您的智能体聊天，发送语音备忘录并自动转录，接收定时任务结果，以及在群聊中使用该智能体。此集成基于 [python-telegram-bot](https://python-telegram-bot.org/) 构建，支持文本、语音、图片和文件附件。

## 步骤一：通过 BotFather 创建机器人

每个 Telegram 机器人都需要一个由 Telegram 官方机器人管理工具 [@BotFather](https://t.me/BotFather) 签发的 API 令牌。

1.  打开 Telegram 并搜索 **@BotFather**，或访问 [t.me/BotFather](https://t.me/BotFather)
2.  发送 `/newbot`
3.  选择一个**显示名称**（例如，“Hermes Agent”）——可以是任何名称
4.  选择一个**用户名**——此用户名必须唯一，并且以 `bot` 结尾（例如，`my_hermes_bot`）
5.  BotFather 会回复您的 **API 令牌**。它看起来像这样：

```
123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
```

:::warning
请妥善保管您的机器人令牌。任何拥有此令牌的人都可以控制您的机器人。如果泄露，请立即通过 BotFather 中的 `/revoke` 命令撤销它。
:::

## 步骤 2：自定义你的机器人（可选）

以下 BotFather 命令可以提升用户体验。向 @BotFather 发送消息并使用：

| 命令 | 用途 |
|---------|---------|
| `/setdescription` | 用户开始与机器人聊天前显示的“此机器人能做什么？”文本 |
| `/setabouttext` | 机器人资料页上的简短文本 |
| `/setuserpic` | 为你的机器人上传头像 |
| `/setcommands` | 定义命令菜单（聊天中的 `/` 按钮） |
| `/setprivacy` | 控制机器人是否能看到所有群组消息（参见步骤 3） |

:::tip
对于 `/setcommands`，以下是一个实用的起始命令集：

```
help - 显示帮助信息
new - 开始一个新对话
sethome - 将此聊天设为主频道
```
:::

## 步骤 3：隐私模式（对群组至关重要）

Telegram 机器人有一个默认**开启**的**隐私模式**。这是在群组中使用机器人时最常见的困惑来源。

**当隐私模式开启时**，你的机器人只能看到：
- 以 `/` 命令开头的消息
- 直接回复机器人自身消息的消息
- 服务消息（成员加入/退出、置顶消息等）
- 机器人是管理员的频道中的消息

**当隐私模式关闭时**，机器人会接收到群组中的每条消息。

### 如何关闭隐私模式

1. 向 **@BotFather** 发送消息
2. 发送 `/mybots`
3. 选择你的机器人
4. 进入 **Bot Settings（机器人设置）→ Group Privacy（群组隐私）→ Turn off（关闭）**

:::warning
**在更改隐私设置后，你必须将机器人从任何群组中移除并重新添加。** 当机器人加入群组时，Telegram 会缓存其隐私状态，并且在机器人被移除并重新添加之前不会更新。
:::

:::tip
关闭隐私模式的替代方法：将机器人提升为**群组管理员**。管理员机器人无论隐私设置如何都会接收所有消息，这避免了需要切换全局隐私模式。
:::

### 观察群组聊天而不自动回复

要实现类似 OpenClaw/元宝的群组行为，可以配置 Telegram 使机器人能够**看到**普通群组消息，但只在被直接触发时**响应**：

```yaml
telegram:
  allowed_chats:
    - "-1001234567890"
  group_allowed_chats:
    - "-1001234567890"
  require_mention: true
  observe_unmentioned_group_messages: true
```

启用此模式后，来自明确允许的聊天/主题的、未提及机器人的群组消息将作为观察到的上下文追加到共享的聊天/主题会话记录中，但它们不会触发智能体运行。`allowed_chats` 控制机器人在哪里响应；`group_allowed_chats` 授权用于观察上下文的共享群组会话，因此在此模式下请使用相同的聊天 ID。之后在同一允许列表中的聊天/主题中，一条 `@botname` 提及、回复机器人或配置的提及模式可以使用该观察到的上下文。被触发的消息也会被标记为 `[昵称|用户_id]`，并获得每轮安全提示，因此模型会将先前观察到的行视为上下文，而不是对机器人的指令。

等效的环境变量：

```bash
TELEGRAM_ALLOWED_CHATS=-1001234567890
TELEGRAM_GROUP_ALLOWED_CHATS=-1001234567890
TELEGRAM_OBSERVE_UNMENTIONED_GROUP_MESSAGES=true
```

这要求 Telegram 将普通群组消息传递给网关，因此请如上所述关闭 BotFather 隐私模式或将机器人提升为群组管理员。

## 步骤 4：查找你的用户 ID

Hermes 智能体使用数字 Telegram 用户 ID 来控制访问。你的用户 ID **不是**你的用户名——它是一个像 `123456789` 这样的数字。

**方法 1（推荐）：** 向 [@userinfobot](https://t.me/userinfobot) 发送消息 —— 它会立即回复你的用户 ID。

**方法 2：** 向 [@get_id_bot](https://t.me/get_id_bot) 发送消息 —— 另一个可靠的选项。

保存这个数字；下一步你会用到它。

## 步骤 5：配置 Hermes

### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

当提示时选择 **Telegram**。向导会要求你输入机器人令牌和允许的用户 ID，然后为你写入配置。

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

机器人应该会在几秒钟内上线。在 Telegram 上给它发条消息来验证。

## 从 Docker 支持的终端发送生成的文件

如果你的终端后端是 `docker`，请记住 Telegram 附件是由**网关进程**发送的，而不是从容器内部发送的。这意味着最终的 `MEDIA:/...` 路径必须在网关运行的主机上可读。

常见陷阱：

- 智能体在 Docker 内部将文件写入 `/workspace/report.txt`
- 模型输出 `MEDIA:/workspace/report.txt`
- Telegram 投递失败，因为 `/workspace/report.txt` 只存在于容器内部，而不是在主机上

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

如果你已经有了 `docker_volumes:` 部分，将新的挂载添加到同一列表中。YAML 重复的键会静默覆盖前面的值。

### 支持的 `MEDIA:` 文件扩展名

网关从智能体回复中提取 `MEDIA:/path/to/file` 标签，并将引用的文件作为平台原生附件发送。所有网关平台支持的扩展名：

| 类别 | 扩展名 |
|---|---|
| 图片 | `png`, `jpg`, `jpeg`, `gif`, `webp`, `bmp`, `tiff`, `svg` |
| 音频 | `mp3`, `wav`, `ogg`, `m4a`, `opus`, `flac`, `aac` |
| 视频 | `mp4`, `mov`, `webm`, `mkv`, `avi` |
| **文档** | `pdf`, `txt`, `md`, `csv`, `json`, `xml`, `html`, `yaml`, `yml`, `log` |
| **Office** | `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp` |
| **压缩包** | `zip`, `rar`, `7z`, `tar`, `gz`, `bz2` |
| **电子书/包** | `epub`, `apk`, `ipa` |

此列表上的任何文件在支持原生附件的平台（Telegram, Discord, Signal, Slack, WhatsApp, Feishu, Matrix 等）上都作为原生附件投递；在不支持原生附件的平台上，它会回退为链接或纯文本指示器。**加粗**的类别是在最近几个版本中添加的——如果你之前依赖模型说 `here is the file: /path/to/report.docx`，请改为使用 `MEDIA:/path/to/report.docx` 以获得原生投递。

## Webhook 模式

默认情况下，Hermes 使用**长轮询**连接到 Telegram——网关向 Telegram 的服务器发出出站请求以获取新的更新。这对于本地和始终在线的部署效果很好。

对于**云部署**（Fly.io、Railway、Render 等），**Webhook 模式**更具成本效益。这些平台可以自动唤醒因入站 HTTP 流量而暂停的机器，但不能在出站连接时唤醒。由于轮询是出站的，轮询机器人永远无法休眠。Webhook 模式改变了方向——Telegram 将更新推送到你机器人的 HTTPS URL，从而实现空闲时休眠的部署。

| | 轮询（默认） | Webhook |
|---|---|---|
| 方向 | 网关 → Telegram（出站） | Telegram → 网关（入站） |
| 最适合 | 本地、始终在线的服务器 | 具有自动唤醒功能的云平台 |
| 设置 | 无需额外配置 | 设置 `TELEGRAM_WEBHOOK_URL` |
| 空闲成本 | 机器必须保持运行 | 机器可以在消息间隔休眠 |

### 配置

将以下内容添加到 `~/.hermes/.env`：

```bash
TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
TELEGRAM_WEBHOOK_SECRET="$(openssl rand -hex 32)"  # 必需
# TELEGRAM_WEBHOOK_PORT=8443        # 可选，默认 8443
```

| 变量 | 是否必需 | 描述 |
|----------|----------|-------------|
| `TELEGRAM_WEBHOOK_URL` | 是 | Telegram 将发送更新的公共 HTTPS URL。URL 路径会被自动提取（例如，从上面的示例中提取 `/telegram`）。 |
| `TELEGRAM_WEBHOOK_SECRET` | **是**（当设置了 `TELEGRAM_WEBHOOK_URL` 时） | 秘密令牌，Telegram 在每个 webhook 请求中回显以进行验证。网关在没有此令牌的情况下拒绝启动——参见 [GHSA-3vpc-7q5r-276h](https://github.com/NousResearch/hermes-agent/security/advisories/GHSA-3vpc-7q5r-276h)。使用 `openssl rand -hex 32` 生成。 |
| `TELEGRAM_WEBHOOK_PORT` | 否 | Webhook 服务器监听的本地端口（默认：`8443`）。 |

当设置了 `TELEGRAM_WEBHOOK_URL` 时，网关会启动一个 HTTP webhook 服务器而不是轮询。当未设置时，将使用轮询模式——与以前版本的行为没有变化。

### 云部署示例 (Fly.io)

1. 将环境变量添加到你的 Fly.io 应用密钥：

```bash
fly secrets set TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
fly secrets set TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

2. 在你的 `fly.toml` 中暴露 webhook 端口：

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

如果 Telegram 的 API 被封锁，或者你需要通过代理路由流量，请设置一个特定于 Telegram 的代理 URL。此设置优先于通用的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量。

**方案一：config.yaml（推荐）**

```yaml
telegram:
  proxy_url: "socks5://127.0.0.1:1080"
```

**方案二：环境变量**

```bash
TELEGRAM_PROXY=socks5://127.0.0.1:1080
```

支持的协议：`http://`、`https://`、`socks5://`。

此代理同时适用于主要的 Telegram 连接和备用的 IP 传输。如果没有设置特定于 Telegram 的代理，网关会回退到 `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`（或 macOS 系统代理的自动检测）。

## 主频道

在任何 Telegram 聊天（私聊或群组）中使用 `/sethome` 命令，将其设为**主频道**。定时任务（cron 作业）的结果将发送至此频道。

你也可以在 `~/.hermes/.env` 文件中手动设置：

```bash
TELEGRAM_HOME_CHANNEL=-1001234567890
TELEGRAM_HOME_CHANNEL_NAME="My Notes"
```

:::tip
群聊的 ID 是负数（例如 `-1001234567890`）。你个人私聊的 ID 与你的用户 ID 相同。
:::

### 主题模式下的定时投递

如果你的机器人私聊中启用了主题模式，发送到主聊天的定时消息会进入仅系统使用的“大厅”——在那里回复不会开启会话，并且你会看到“主聊天保留用于系统命令”的提示。请创建一个专用的论坛主题（例如 `Cron`），并设置：

```bash
TELEGRAM_CRON_THREAD_ID=<topic_thread_id>
```

`TELEGRAM_CRON_THREAD_ID` 仅针对定时投递覆盖 `TELEGRAM_HOME_CHANNEL_THREAD_ID`。在该主题中的回复将继续该主题已有的会话。

## 语音消息

### 传入语音（语音转文字）

您在 Telegram 上发送的语音消息会由 Hermes 配置的 STT 提供商自动转录，并作为文本注入到对话中。

- `local` 使用运行 Hermes 的机器上的 `faster-whisper`——无需 API 密钥
- `groq` 使用 Groq Whisper，需要 `GROQ_API_KEY`
- `openai` 使用 OpenAI Whisper，需要 `VOICE_TOOLS_OPENAI_KEY`

#### 跳过 STT：将原始音频文件传递给智能体

如果您希望**智能体本身**处理音频——用于说话人分离、自定义转录工具，或仅仅是为了存档录音——请在 `~/.hermes/config.yaml` 中设置 `stt.enabled: false`：

```yaml
stt:
  enabled: false
```

禁用 STT 后，网关仍会将语音/音频附件下载到 Hermes 的音频缓存中，但**不会进行转录**。智能体收到的消息带有如下标记：

```
[The user sent a voice message: /home/<user>/.hermes/cache/audio/<hash>.ogg]
```

您的工具或技能可以直接读取该路径（例如，将其交给本地说话人分离管道、更丰富的转录模型，或上传到长期存储）。文件扩展名反映了 Telegram 传送的原始格式（语音备忘为 `.ogg`，音频附件为 `.mp3`/`.m4a` 等）。

这与下方的[本地 Bot API 服务器](#large-files-20mb-via-local-bot-api-server)部分自然配合，后者将 Telegram 的 20MB getFile 上限提升至 2GB——当您要处理的录音超过几分钟时非常有用。

### 传出语音（文字转语音）

当智能体通过 TTS 生成音频时，它会以原生 Telegram **语音气泡**的形式发送——即那种圆形、可内联播放的形式。

- **OpenAI 和 ElevenLabs** 原生生成 Opus——无需额外设置
- **Edge TTS**（默认的免费提供商）输出 MP3，需要 **ffmpeg** 将其转换为 Opus：

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

没有 ffmpeg 时，Edge TTS 音频会作为普通音频文件发送（仍然可播放，但使用矩形播放器而非语音气泡）。

在 `config.yaml` 的 `tts.provider` 键下配置 TTS 提供商。

## 通过本地 Bot API 服务器传输大文件（>20MB）

Telegram 的**公共** Bot API 将 `getFile` 下载上限设定为 **20 MB**，因此任何超过此大小的语音备忘、音频文件、视频或文档都会被 Hermes 以"过大"的回复静默拒绝。文档中记载的解决方案是运行一个**本地** [telegram-bot-api](https://github.com/tdlib/telegram-bot-api) 守护进程——与 Telegram 使用的服务器软件相同，但运行在您的网络中。本地服务器将文件上限提升至 **2 GB**，当 Hermes 检测到配置了自定义 `base_url` 时，会自动解除其自身的内部限制。

这使得以下工作流程成为可能：

- 将长语音备忘（45 分钟的会议、播客）发送给机器人
- 上传大型视频用于视觉工具处理
- 存档原始音频用于离线处理流程，如说话人分离、对齐或训练数据

### 第 1 步：获取 Telegram API 凭证

本地服务器直接与 Telegram 的 MTProto 层（而非公共 Bot API）通信，因此需要 **MTProto 凭证**：

1. 访问 [my.telegram.org/apps](https://my.telegram.org/apps) 并使用您的 Telegram 账户登录。
2. 创建一个新应用（任何名称和简短描述即可）。
3. 复制 `api_id` 和 `api_hash`——两者都是必需的。

### 第 2 步：运行 telegram-bot-api 服务器

社区维护的 [`aiogram/telegram-bot-api`](https://hub.docker.com/r/aiogram/telegram-bot-api) Docker 镜像是最简单的途径。一个最小的 `docker-compose.yaml`（使用 `--local` 模式启用更高的限制）：

```yaml
services:
  tg-bot-api:
    image: aiogram/telegram-bot-api:latest
    container_name: tg-bot-api
    restart: unless-stopped
    ports:
      - "127.0.0.1:8081:8081"   # 仅绑定回环地址；参见安全说明
    environment:
      TELEGRAM_API_ID: "12345"           # 您在第 1 步中获取的 api_id
      TELEGRAM_API_HASH: "abcdef..."     # 您在第 1 步中获取的 api_hash
      TELEGRAM_LOCAL: "1"                # 启用 --local 模式（将 20MB 提升至 2GB）
    volumes:
      - ./tg-bot-api-data:/var/lib/telegram-bot-api
```

启动服务：

```bash
docker compose up -d tg-bot-api
docker logs --tail 20 tg-bot-api
```

:::warning 安全
本地 Bot API 服务器在 URL 路径中使用您的机器人令牌（例如 `/bot<TOKEN>/getMe`），**无需额外认证**。任何能访问该端口的人都可以完全控制您的机器人——读取它能看到的所有消息、以它的身份发送消息等。将容器绑定到 `127.0.0.1`，并/或在私有网络上使用反向代理进行前置。**切勿将端口 8081 暴露到公共互联网。**
:::

### 第 3 步：将机器人从公共 API 注销（一次性操作）

一个机器人同时只能在**一个** Bot API 服务器上活跃。如果您的机器人已经在 `api.telegram.org` 上运行（几乎可以肯定如此），您必须先将其从那里显式注销，本地服务器才会接受它：

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/logOut"
# 期望响应: {"ok":true,"result":true}
```

这是一次性迁移步骤——您无需在每次重启时重复执行。Telegram 会将 `logOut` 之后接收到的所有消息通过新服务器传送。

验证本地服务器能否代表机器人与 Telegram 通信：

```bash
curl "http://127.0.0.1:8081/bot<YOUR_BOT_TOKEN>/getMe"
# 期望响应: {"ok":true,"result":{"id":...,"is_bot":true,...}}
```

### 第 4 步：将 Hermes 指向本地服务器

在 `~/.hermes/config.yaml` 的 `platforms.telegram.extra` 下添加 URL：

```yaml
platforms:
  telegram:
    extra:
      base_url: "http://127.0.0.1:8081/bot"
      base_file_url: "http://127.0.0.1:8081/file/bot"
      local_mode: true        # 参见下方第 5 步——仅在机器人的数据目录
                              # 对 Hermes 进程可读时才设置此项
```

:::caution 使用 `platforms.telegram.extra`，而非 `telegram.extra`
目前只有 `platforms.<name>.extra` 形式会被深度合并到平台配置中。直接放在顶层 `telegram.extra` 块下的键会被静默丢弃。
:::

当设置 `base_url` 后，Hermes 会：

- 针对本地服务器构建 python-telegram-bot 客户端
- 自动将其内部文档/音频大小上限从 20 MB 提升至 2 GB
- 在"过大"错误消息中报告当前生效的限制（`Maximum: 2048 MB.`），以便您清楚当前处于哪种模式

重启网关并查找确认日志行：

```bash
hermes gateway restart
grep -E "Using custom Telegram base_url|Using Telegram local_mode" ~/.hermes/logs/gateway.log | tail
```

### 第 5 步：`local_mode`——磁盘上的文件访问

本地服务器有**两种方式**传送文件：

1. **不使用 `--local`**（默认）：文件通过 HTTP 在 `/file/bot<TOKEN>/<path>` 提供服务，与公共 Bot API 相同。20MB 上限仍然生效。仅作为网络修复方案有用（例如当 `api.telegram.org` 不可达但您可以自托管时）；不是您想要的提升大小限制的方式。
2. **使用 `--local`**（通过上述 `TELEGRAM_LOCAL=1` 设置）：文件写入服务器的文件系统，`getFile` 响应返回**绝对路径**而非 HTTP URL。20MB 上限被解除。Hermes 必须从**磁盘**读取字节，而非通过 HTTP。

要使磁盘读取路径正常工作，请在上述配置中设置 `local_mode: true`，**并**确保 Hermes 进程能够读取服务器返回的路径。两种场景：

- **同一台机器** — telegram-bot-api 和 Hermes 运行在同一台主机上。将数据卷绑定挂载到 Hermes 可以读取的目录（例如 `/var/lib/telegram-bot-api`），并确保文件所有权匹配。容器会降权到其内部的 `telegram-bot-api` 用户（uid 因镜像而异）；最简单的解决方法是在 compose 服务中添加 `user: "<UID>:<GID>"`，使文件归 Hermes 已运行的 uid 所有。
- **不同机器** — 机器人服务器运行在一台主机上（例如 NAS、单独的虚拟机），Hermes 运行在另一台上。服务器的数据目录必须以服务器报告的**相同绝对路径**（通常为 `/var/lib/telegram-bot-api`）与 Hermes 机器共享。NFS 适合此场景；如果不想处理文件系统级别的 uid 不匹配，CIFS/SMB 配合 `uid=` 挂载重映射更友好。

如果设置了 `local_mode: true` 但 Hermes 无法对返回的文件路径执行 `stat`（权限问题或挂载错误），python-telegram-bot 会静默回退到对本地服务器的 HTTP `getFile` 请求——而本地服务器在 `--local` 模式下会返回 `404 Not Found`。此症状在 `gateway.log` 中显示为：

```
[Telegram] Failed to cache voice: Not Found
telegram.error.InvalidToken: Not Found
```

如果您看到此错误，说明上限提升正常工作，但文件共享不正常。以网关运行用户的身份从 Hermes 主机验证 `ls -la /var/lib/telegram-bot-api/<TOKEN>/voice/`，并确认单个文件可以 `cat` 读取而无权限错误。

### 第 6 步：测试

向机器人发送一个大于 20 MB 的语音备忘或音频文件。查看网关日志：

```bash
tail -f ~/.hermes/logs/gateway.log | grep -iE "telegram|cache"
```

您应该看到 `[Telegram] Cached user voice at /home/<user>/.hermes/cache/audio/...` 这一行，且**没有**"过大"的拒绝消息。结合上述 `stt.enabled: false` 设置，原始音频文件的路径将进入智能体的入站消息中，供下游处理使用。

## 群组聊天使用

Hermes 智能体在 Telegram 群组中工作需考虑以下几点：

- **隐私模式**决定了机器人能看到哪些消息（参见[步骤 3](#step-3-privacy-mode-critical-for-groups)）
- `TELEGRAM_ALLOWED_USERS` 同样适用——即使在群组中，也只有被授权用户才能触发机器人
- 您可以通过 `telegram.require_mention: true` 阻止机器人回应群组中的普通聊天
- 当 `telegram.require_mention: true` 时，群组消息在以下情况会被接受：
  - 回复机器人的一条消息
  - `@botusername` 提及
  - `/command@botusername`（Telegram 的机器人菜单命令形式，包含机器人名称）
  - 与您在 `telegram.mention_patterns` 中配置的某个正则表达式唤醒词匹配
- 在包含多个 Hermes 机器人的群组中，`telegram.exclusive_bot_mentions` 可保持路由的确定性。当消息明确提及一个或多个 Telegram 机器人用户名时，只有被提及的机器人配置会处理它；其他 Hermes 机器人会在回复和唤醒词回退运行前忽略该消息。此功能默认启用。
- 使用 `telegram.ignored_threads` 可让 Hermes 在特定的 Telegram 论坛主题中保持静默，即使群组在其他情况下允许自由回复或提及触发的回复
- 如果 `telegram.require_mention` 未设置或为 false，Hermes 将保持之前的开放群组行为，并对其能看到的正常群组消息做出回应

### 在一个群组中运行多个 Hermes 机器人

如果您在同一个 Telegram 群组中运行多个 Hermes 配置文件，请为每个配置文件创建一个 Telegram 机器人令牌，并为每个配置文件启动一个网关。不要在多个运行中的网关中重复使用相同的机器人令牌；Telegram 将拒绝同一令牌的并发轮询。

推荐的群组配置：

```yaml
telegram:
  require_mention: true
  exclusive_bot_mentions: true
  mention_patterns: []
```

在此设置下，类似 `@research_bot @ops_bot summarize this` 的群组消息仅由 `research_bot` 和 `ops_bot` 处理。群组中的其他 Hermes 机器人将保持静默，即使该消息是回复它们早期的消息，或者原本会匹配共享的唤醒词。

仅当对于旧版群组，明确提及不应覆盖回复和唤醒词触发器时，才将 `exclusive_bot_mentions` 设为 `false`。

要操作多个配置文件，需为每个配置文件运行一次网关命令。例如：

```bash
# 默认配置文件
hermes gateway start
hermes gateway status
hermes gateway stop

# 具名配置文件
hermes -p research gateway start
hermes -p research gateway status
hermes -p research gateway stop
```

对于一个小型固定集群，可使用 shell 循环或脚本，为默认配置文件调用 `hermes gateway <action>`，为每个具名配置文件调用 `hermes -p <profile> gateway <action>`。这比假设单个进程级命令能控制每个服务管理器上的每个具名配置文件更可靠。

### 故障排除：在私聊中有效但在群组中无效

如果机器人在私聊中能回应但在群组中保持静默，请按顺序检查这些关卡：

1.  **Telegram 消息传递：** 关闭 BotFather 隐私模式，将机器人提升为管理员，或直接提及机器人。Hermes 无法回应 Telegram 从未传递给机器人的群组消息。
2.  **更改隐私设置后重新加入：** 在更改 BotFather 隐私设置后，将机器人从群组中移除并重新添加。Telegram 对现有成员身份可能仍保持旧的传递行为。
3.  **Hermes 授权：** 确保发送者已列在 `TELEGRAM_ALLOWED_USERS` 或 `TELEGRAM_GROUP_ALLOWED_USERS` 中，或通过 `TELEGRAM_GROUP_ALLOWED_CHATS` 允许该群聊。
4.  **提及过滤器：** 如果设置了 `telegram.require_mention: true`，除非消息是斜杠命令、回复机器人、`@botusername` 提及或匹配配置的 `mention_patterns`，否则普通群组聊天将被忽略。
5.  **多机器人路由：** 如果群组包含多个机器人，请确保每个 Hermes 配置文件使用唯一的机器人令牌，并保持 `exclusive_bot_mentions` 启用，除非您有意想要旧的共享触发行为。

Telegram 群组和超级群组的聊天 ID 为负数是正常的。如果您使用聊天范围的授权，请将这些 ID 放在 `TELEGRAM_GROUP_ALLOWED_CHATS` 中，而不是发送者用户允许列表中。

### 群组触发配置示例

将以下内容添加到 `~/.hermes/config.yaml`：

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

此示例允许所有常见的直接触发，以及以 `chompy` 开头的消息，即使它们不使用 `@提及`。
在 Telegram 主题 `31` 和 `42` 中的消息，在提及和自由响应检查运行前将始终被忽略。

### 关于 `mention_patterns` 的说明

- 模式使用 Python 正则表达式
- 匹配不区分大小写
- 模式会针对文本消息和媒体标题进行检查
- 无效的正则表达式模式会被忽略，并在网关日志中发出警告，而不会使机器人崩溃
- 如果您希望模式仅在消息开头匹配，请用 `^` 锚定它

## 私有聊天话题（机器人 API 9.4）

Telegram 机器人 API 9.4（2026 年 2 月）引入了**私有聊天话题** —— 机器人可以直接在 1 对 1 私聊中创建论坛式的话题帖子，无需超级群组。这让你能够在与 Hermes 的现有私聊中运行多个隔离的工作空间。

### 使用场景

如果你同时进行多个长期项目，话题能保持各自上下文独立：

- **话题 "网站"** —— 处理你的生产环境网络服务
- **话题 "研究"** —— 文献综述与论文探索
- **话题 "通用"** —— 杂项任务与快速提问

每个话题拥有独立的对话会话、历史记录和上下文 —— 彼此完全隔离。

### 配置

:::caution 前提条件
在向配置中添加话题之前，用户必须在与机器人的私聊中**启用话题模式**：

1. 在 Telegram 中打开与 Hermes 机器人的私聊
2. 点击顶部的机器人名称以打开聊天信息
3. 启用 **话题**（将聊天转变为论坛的开关）

若不启用此设置，Hermes 将在启动时记录 `The chat is not a forum` 并跳过话题创建。这是 Telegram 客户端设置 —— 机器人无法通过编程方式启用。
:::

在 `~/.hermes/config.yaml` 的 `platforms.telegram.extra.dm_topics` 下添加话题：

```yaml
platforms:
  telegram:
    extra:
      dm_topics:
      - chat_id: 123456789        # 你的 Telegram 用户 ID
        topics:
        - name: 通用
          icon_color: 7322096
        - name: 网站
          icon_color: 9367192
        - name: 研究
          icon_color: 16766590
          skill: arxiv              # 在此话题中自动加载一项技能
```

**字段：**

| 字段 | 必填 | 描述 |
|-------|----------|-------------|
| `name` | 是 | 话题显示名称 |
| `icon_color` | 否 | Telegram 图标颜色代码（整数） |
| `icon_custom_emoji_id` | 否 | 话题图标的自定义表情符号 ID |
| `skill` | 否 | 在该话题新会话开始时自动加载的技能 |
| `thread_id` | 否 | 话题创建后自动填充 —— 请勿手动设置 |

### 工作原理

1.  网关启动时，Hermes 会为每个尚未拥有 `thread_id` 的话题调用 `createForumTopic`。
2.  `thread_id` 会自动保存回 `config.yaml` —— 后续重启将跳过 API 调用。
3.  每个话题映射到一个独立的会话键：`agent:main:telegram:dm:{chat_id}:{thread_id}`。
4.  每个话题中的消息拥有独立的对话历史、记忆刷新和上下文窗口。

### 根私聊处理

默认情况下，发送到根私聊（任何话题之外）的消息会正常处理。设置 `ignore_root_dm: true` 可将根私聊变为大厅 —— 对于已配置私聊话题的用户，普通消息将被静默忽略，而系统命令（`/start`、`/help`、`/status` 等）仍然有效。

```yaml
platforms:
  telegram:
    extra:
      ignore_root_dm: true
      dm_topics:
        - chat_id: 123456789
          topics:
            - name: 通用
```

此检查**按聊天进行**：只有 `dm_topics` 中至少有一个条目的用户，其根私聊才会受到影响。未配置话题的用户不受影响。

### 技能绑定

带有 `skill` 字段的话题会在该话题中开始新会话时自动加载该技能。这就像在对话开始时输入 `/skill-name` —— 技能内容被注入第一条消息，后续消息会在对话历史中看到它。

例如，一个 `skill: arxiv` 的话题，无论何时其会话重置（由于空闲超时、每日重置或手动 `/reset`），都会预加载 arxiv 技能。

:::tip
在配置之外创建的话题（例如，通过手动调用 Telegram API）会在收到 `forum_topic_created` 服务消息时被自动发现。你也可以在网关运行时向配置中添加话题 —— 它们会在下次缓存未命中时被拾取。
:::

## 多会话私聊模式（`/topic`）

一种 ChatGPT 风格的多会话私聊 —— 一个机器人，多个并行对话。与上面操作员精心配置的 `extra.dm_topics` 不同，此模式是**用户驱动的**：无需配置，无需预先声明的话题名称。终端用户通过 `/topic` 开启它，然后点击 Telegram 的 **+** 按钮即可创建任意数量的话题，每个话题都是一个完全独立的 Hermes 会话。

### `/topic` 子命令

| 形式 | 上下文 | 效果 |
|------|---------|--------|
| `/topic` | 根私聊，尚未启用 | 检查 BotFather 能力，启用多会话模式，创建置顶的系统话题 |
| `/topic` | 根私聊，已启用 | 显示状态：可用于恢复的未关联会话 |
| `/topic` | 在话题内 | 显示当前话题的会话绑定 |
| `/topic help` | 任何位置 | 行内用法说明 |
| `/topic off` | 根私聊 | 禁用多会话模式，并清除此聊天的所有话题绑定 |
| `/topic <会话 ID>` | 在话题内 | 将先前的 Telegram 会话恢复到当前话题 |

只有授权用户（通过 `TELEGRAM_ALLOWED_USERS` / 平台认证配置进行允许列表控制）才能运行 `/topic`。未授权的发送者会收到拒绝信息而非激活响应。

### 私聊话题 vs 多会话私聊模式

| | `extra.dm_topics`（配置驱动） | `/topic`（用户驱动） |
|---|---|---|
| 谁激活它 | 操作员，在 `config.yaml` 中 | 终端用户，通过发送 `/topic` |
| 话题列表 | 配置中声明的固定集合 | 用户自由创建/删除话题 |
| 话题名称 | 由操作员选择 | 由用户选择；自动重命名为匹配 Hermes 会话标题 |
| 根私聊行为 | 普通聊天（若 `ignore_root_dm: true` 则为大厅） | 变为系统大厅（非命令消息会被拒绝） |
| 主要用例 | 带可选技能绑定的永久工作空间 | 临时并行会话 |
| 持久化 | 配置中的 `extra.dm_topics` | `telegram_dm_topic_mode` + `telegram_dm_topic_bindings` SQLite 表 |

这两个功能可以在同一个机器人上共存 —— 你可以从用户的私聊运行 `/topic`，而 `extra.dm_topics` 继续管理其他聊天的操作员声明话题。

### 前提条件

在 **@BotFather** 中，打开你的机器人 → **机器人设置 → 线程设置**：

1.  打开**线程模式**（启用 `has_topics_enabled`）
2.  **不要**禁用用户创建话题（保持 `allows_users_to_create_topics` 为开启状态）

当用户首次运行 `/topic` 时，Hermes 会调用 `getMe` 来验证这两个标志。如果任一关闭，Hermes 会发送 BotFather 线程设置页面的截图并解释需要切换什么 —— 在满足前提条件之前不会进行激活。

### 激活流程

从根私聊发送：

```
/topic
```

Hermes 将：

1.  检查 `getMe().has_topics_enabled` 和 `allows_users_to_create_topics`
2.  如果两者都为 true，则为此私聊启用多会话话题模式
3.  创建并置顶一个**系统**话题用于状态/命令（尽力而为）
4.  回复一个列表，显示用户可以恢复的先前未关联的 Telegram 会话

激活后，**根私聊成为大厅**：普通提示会被拒绝，并引导指向**所有消息**。系统命令（`/status`、`/sessions`、`/usage`、`/help` 等）在根私聊中仍然有效。

### 创建新话题（终端用户流程）

1.  在 Telegram 中打开机器人私聊
2.  点击机器人界面顶部的**所有消息**，然后发送任意消息
3.  Telegram 会为该消息创建一个新话题
4.  Hermes 在该话题内回复 —— 该话题现在是一个独立的会话

每个话题拥有独立的对话历史、模型状态、工具执行和会话 ID。隔离键是 `agent:main:telegram:dm:{chat_id}:{thread_id}` —— 与配置驱动的私聊话题隔离方式相同。

### 自动重命名话题

当 Hermes 为话题生成会话标题时（通过自动标题流水线，在首次交互后），Telegram 话题本身会被重命名为匹配 —— 例如，“新话题”变成“数据库迁移计划”。重命名是尽力而为：失败会被记录但不会中断会话。

要禁用此功能并保留你手动选择的话题名称不变，请设置：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        disable_topic_auto_rename: true
```

当此标志为 on 时，Hermes 仍然生成内部会话标题（用于 `hermes sessions`、TUI 等），但从不编辑 Telegram 话题名称。当你在 BotFather 线程模式下手动组织话题，并且不希望每次第一个回复都覆盖标题时，这很有用。

### 话题内使用 `/new`

重置当前话题的会话（新会话 ID，全新历史），不影响其他话题。Hermes 会回复提醒，对于并行工作，创建另一个话题（通过**所有消息**）通常是更好的选择。

### 恢复先前会话

在话题内发送：

```
/topic <会话 ID>
```

这将把当前话题绑定到一个现有的 Hermes 会话，而不是开始新会话。适用于继续在话题模式启用前开始的对话。限制：

-   目标会话必须属于同一个 Telegram 用户
-   目标会话不能已经绑定到另一个话题

Hermes 会确认会话标题并重放最后一条助手消息以提供上下文。

要发现会话 ID，请在根私聊中发送 `/topic`（无参数）— Hermes 会列出用户的未关联 Telegram 会话。

### 话题内使用 `/topic`（无参数）

显示当前话题的绑定情况：会话标题、会话 ID，以及关于 `/new` 与创建另一个话题的提示。

### 内部机制

-   激活状态持久化到 `state.db` 中的 `telegram_dm_topic_mode(chat_id, user_id, enabled, ...)`。
-   每个话题绑定持久化到 `telegram_dm_topic_bindings(chat_id, thread_id, session_id, ...)`，`session_id` 上设置了 `ON DELETE CASCADE` —— 修剪会话会自动清除其话题绑定。
-   话题模式的 SQLite 迁移是**可选的**：它在首次调用 `/topic` 时运行，绝不在网关启动时运行。在此配置文件中，直到用户运行 `/topic`，`state.db` 都不会改变。
-   每个传入的私聊消息都会查找其 `(chat_id, thread_id)` 绑定。如果存在，查找会通过 `SessionStore.switch_session()` 将消息路由到绑定的会话，从而保持磁盘上会话键到会话 ID 映射的一致性。
-   话题内使用 `/new` 会将绑定行重写为指向新的会话 ID，因此下一条消息会保持在新会话上。
-   在 `extra.dm_topics` 中声明的话题**永远不会自动重命名** —— 即使启用了多会话模式，操作员选择的名称也会被保留。
-   设置 `extra.disable_topic_auto_rename: true` 可为聊天中的**所有**话题关闭自动重命名（包括通过线程模式创建的临时话题）。
-   在启用论坛的私聊中，置顶顶部的通用（General）话题被视为根大厅，无论 Telegram 是否通过 `message_thread_id=1` 或没有 thread_id 来传递其消息。
-   根大厅的提醒被限速为每个聊天每 30 秒一条消息 —— 如果用户忘记话题模式已开启，并在根私聊中输入了十个提示，也不会收到十个回复。
-   BotFather 设置截图被限速为每个聊天每 5 分钟发送一次 —— 在线程设置仍然禁用的情况下重复尝试 `/topic` 不会重新上传相同的图片。
-   在话题内开始的 `/background <prompt>` 会将其结果传回同一话题；后台会话不会触发所属话题的自动重命名。
-   `/topic` 本身受机器人用户授权检查限制 —— 未授权的私聊会收到拒绝信息而非激活响应。

### 禁用多会话模式

在根私聊中发送 `/topic off`。Hermes 会将该行设为关闭，清除聊天的 `(thread_id → session_id)` 绑定，根私聊恢复为普通的 Hermes 聊天。Telegram 中的现有话题不会被删除 —— 它们只是不再作为独立会话被受控。稍后重新运行 `/topic` 可以重新开启它。

如果你需要手动清理（例如，跨多个聊天进行批量重置），可以直接删除行：

```bash
sqlite3 ~/.hermes/state.db \
  "UPDATE telegram_dm_topic_mode SET enabled = 0 WHERE chat_id = '<你的_chat_id>'; \
   DELETE FROM telegram_dm_topic_bindings WHERE chat_id = '<你的_chat_id>';"
```

### 降级 Hermes

如果你降级到早于 `/topic` 的 Hermes 版本，该功能将简单地停止工作 —— `telegram_dm_topic_mode` 和 `telegram_dm_topic_bindings` 表仍留在 `state.db` 中，但会被旧代码忽略。私聊恢复到原生的按线程隔离（每个 `message_thread_id` 仍然通过 `build_session_key` 获得自己的会话），因此你现有的 Telegram 话题会继续作为并行会话工作。根私聊不再是大厅 —— 那里的消息会像以前一样进入智能体。重新升级会在原来的位置重新激活多会话模式。

## 群组论坛话题技能绑定

启用了 **话题模式**（也称为"论坛话题"）的超级群组已经为每个话题提供了会话隔离——每个 `thread_id` 对应独立的对话。但您可能希望当消息到达特定群组话题时，能像私聊话题技能绑定那样**自动加载某个技能**。

### 使用场景

一个拥有不同工作组论坛话题的团队超级群组：

- **Engineering** 话题 → 自动加载 `software-development` 技能
- **Research** 话题 → 自动加载 `arxiv` 技能
- **General** 话题 → 无技能，通用助手

### 配置

在 `~/.hermes/config.yaml` 文件的 `platforms.telegram.extra.group_topics` 下添加话题绑定：

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
| `name` | 否 | 话题的可读标签（仅用于说明） |
| `thread_id` | 是 | Telegram 论坛话题 ID — 在 `t.me/c/<group_id>/<thread_id>` 链接中可见 |
| `skill` | 否 | 在此话题的新会话中要自动加载的技能 |

### 工作原理

1. 当消息到达一个已映射的群组话题时，Hermes 会在 `group_topics` 配置中查找 `chat_id` 和 `thread_id`
2. 如果匹配的条目包含 `skill` 字段，则该技能会为该会话自动加载——与私聊话题技能绑定完全相同
3. 没有 `skill` 键的话题仅获得会话隔离（现有行为，未改变）
4. 未映射的 `thread_id` 或 `chat_id` 值会静默跳过——不会报错，也不会加载技能

### 与私聊话题的区别

| | 私聊话题 | 群组话题 |
|---|---|---|
| 配置键 | `extra.dm_topics` | `extra.group_topics` |
| 话题创建 | 若缺少 `thread_id`，Hermes 通过 API 创建话题 | 管理员在 Telegram 界面中创建话题 |
| `thread_id` | 创建后自动填充 | 必须手动设置 |
| `icon_color` / `icon_custom_emoji_id` | 支持 | 不适用（外观由管理员控制） |
| 技能绑定 | ✓ | ✓ |
| 会话隔离 | ✓ | ✓（论坛话题已内置） |

:::tip
要查找话题的 `thread_id`，请在 Telegram 网页版或桌面版中打开该话题，查看 URL：`https://t.me/c/1234567890/5` — 最后一个数字（`5`）就是 `thread_id`。超级群组的 `chat_id` 是群组 ID 前面加上 `-100`（例如，群组 `1234567890` 变为 `-1001234567890`）。
:::

## 近期 Bot API 功能

- **Bot API 9.4 (2026 年 2 月)：私聊话题** — 机器人可以通过 `createForumTopic` 在一对一私聊中创建论坛话题。Hermes 利用此功能实现了两个不同的特性：由运营人员策划的[私聊话题](#private-chat-topics-bot-api-94)（配置驱动，固定话题列表）和用户驱动的[多会话私聊模式](#multi-session-dm-mode-topic)（通过 `/topic` 激活，用户可无限创建话题）。
- **隐私政策：** Telegram 现在要求机器人设置隐私政策。请通过 BotFather 的 `/setprivacy_policy` 命令设置，否则 Telegram 可能会自动生成一个占位符。如果您的机器人面向公众，这一点尤其重要。
- **Bot API 9.5 (2026 年 3 月)：通过 `sendMessageDraft` 实现原生流式传输。** Hermes 支持 Telegram 的原生流式草稿 API 作为私聊的可选传输方式。默认方式仍是传统的 `editMessageText` 路径，因为草稿预览在某些 Telegram 客户端上可能会明显地折叠和重新渲染。

### 流式传输方式 (`gateway.streaming.transport`)

当流式传输已启用（`gateway.streaming.enabled: true`）时，Hermes 会选择以下四种传输方式之一：

| 值 | 行为 |
|---|---|
| `auto` | 在支持的聊天（目前是 Telegram 私聊）上使用原生草稿流式传输；否则使用传统的基于编辑的路径。如果草稿帧失败，会优雅地回退。 |
| `draft` | 强制使用原生草稿。如果聊天不支持草稿（例如群组/话题），会记录降级并回退到编辑模式。 |
| `edit` (默认) | 传统的渐进式 `editMessageText` 轮询，适用于所有聊天类型。 |
| `off` | 完全禁用流式传输（仅发送最终回复，无渐进更新）。 |

在 `~/.hermes/config.yaml` 中：

```yaml
gateway:
  streaming:
    enabled: true
    transport: edit    # edit | auto | draft | off
```

**使用 `edit`（默认）在私聊中的效果** — 网关发送一条正常的预览消息，并通过 `editMessageText` 进行渐进式更新，避免了 Telegram 草稿预览的折叠/回滚效果。

**使用 `auto` 或 `draft` 在私聊中的效果** — Telegram 会显示一个动画的草稿预览，并逐个 token 更新。当回复完成后，它会作为常规消息发送，草稿预览会在客户端自然清除。草稿没有消息 ID，因此保留在您聊天记录中的是最终答案。

**群组、超级群组、论坛话题呢？** Telegram 将 `sendMessageDraft` 限制在私聊（DM）中使用。网关会透明地为其他所有情况回退到基于编辑的路径——用户体验与之前相同。

**如果草稿帧失败怎么办？** 任何失败（瞬时网络错误、服务端拒绝、旧版 python-telegram-bot 安装）都会使该响应在剩余的流式传输期间回退到基于编辑的路径。下一个响应会重新尝试。

## 渲染：表格与链接预览

Telegram 的 MarkdownV2 原生没有表格语法——如果直接传递管道表格，它们会显示为反斜杠转义的乱码。Hermes 会自动规范化 Markdown 表格：

- **小型表格** 会被扁平化为 **行组项目符号列表** —— 每一行在列标题下都会变成一个可读的项目符号列表。适用于2-4列且单元格内容较短的表格。
- **更大或更宽的表格** 会回退为 **带对齐列的围栏代码块**，这样内容就不会塌陷。会添加一行提示语，以便智能体知道在 Telegram 上更倾向于使用散文式回答，而不是更多表格。

无需任何配置——适配器会根据每条消息选择合适的回退方案。如果您想使用传统的“始终使用代码块”行为，可以在 `config.yaml` 中设置 `telegram.pretty_tables: false` 来禁用表格规范化（默认为 `true`）。

**链接预览**。Telegram 会自动为机器人消息中的 URL 生成链接预览。如果您想禁用此功能（例如在较长的 `/tools` 输出、提到了十个链接的智能体回复等情况下）：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        disable_link_previews: true
```

启用后，Hermes 会为每条发出的消息附加 Telegram 的 `LinkPreviewOptions(is_disabled=True)`，并在旧版 `python-telegram-bot` 版本上回退到传统的 `disable_web_page_preview` 参数。

## 群组白名单

Telegram 群组和论坛聊天有两个正交的入口可以配置：

- **发送者用户 ID** (`group_allow_from` / `TELEGRAM_GROUP_ALLOWED_USERS`) —— 仅适用于群组/论坛消息的、按发送者设定的白名单。当您希望特定用户能在群组中调用机器人，而又不想将他们添加到 `TELEGRAM_ALLOWED_USERS`（这也会授予他们私信访问权限）时，可以使用此功能。
- **聊天 ID** (`group_allowed_chats` / `TELEGRAM_GROUP_ALLOWED_CHATS`) —— 按聊天设定的白名单。这些群组/论坛的任何成员都可以与机器人交互。适用于成员身份本身即为访问权限信号的团队/支持类机器人。

```yaml
gateway:
  platforms:
    telegram:
      extra:
        # 全局访问权限（私信 + 群组）。此处的用户始终可以调用机器人。
        allow_from:
          - "123456789"
        # 仅在群组/论坛中被允许的发送者 ID。**不**授予私信访问权限。
        group_allow_from:
          - "987654321"
        # 整个群组/论坛 —— 任何成员均已授权。
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
- `TELEGRAM_GROUP_ALLOWED_USERS` 仅授权列表中的发送者在群组/论坛中的权限。除非他们也被列入 `TELEGRAM_ALLOWED_USERS`，否则仍然无法私信机器人。
- `TELEGRAM_GROUP_ALLOWED_CHATS` 中的聊天授权该聊天的所有成员，无论发送者是谁。
- 在这些配置中使用 `*` 可以允许任何发送者/聊天。
- 此配置层叠在现有的提及/模式触发器以及 `group_topics` + `ignored_threads` 之上。

### 从 PR #17686 之前的版本迁移

在此拆分之前，`TELEGRAM_GROUP_ALLOWED_USERS` 是唯一的控制选项，用户将 **聊天 ID** 放入其中。为了向后兼容，`TELEGRAM_GROUP_ALLOWED_USERS` 中符合聊天 ID 格式（以 `-` 开头）的值仍会被视为聊天 ID，并记录一次弃用警告。迁移步骤：

```bash
# 旧版（仍然有效，但已弃用）
TELEGRAM_GROUP_ALLOWED_USERS="-1001234567890"

# 新版
TELEGRAM_GROUP_ALLOWED_CHATS="-1001234567890"
```

### 访客 @提及绕过 (`guest_mode`)

在典型设置中，`group_allowed_chats` 是一道硬性门槛：来自列表外群组的消息会被静默丢弃，即使成员明确 @提及了机器人。这对于支持/团队类机器人是正确的默认行为。

对于更随意的设置——例如朋友圈聊天，您希望机器人 **大部分时间保持安静**，但 **偶尔在被明确提及（ping）时可用**——可以启用 `guest_mode`：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        group_allowed_chats:
          - "-1001234567890"   # 您的主要白名单群组
        guest_mode: true       # 非白名单群组：仅允许在 @提及时响应
```

等效的环境变量：

```bash
TELEGRAM_GUEST_MODE=true
```

默认值：`false`。

当 `guest_mode: true` 时，来自非白名单群组的消息 **仅** 在消息中明确 @提及了机器人时才会被处理。每次交互都需要提及——访客交互没有会话粘性，因此机器人永远不会主动参与一个它未被提及进入的朋友群组线程。

私信和白名单群组的行为与之前完全相同。

## 斜杠命令访问控制

默认情况下，每位被允许的用户都可以运行所有斜杠命令。要将您的允许列表拆分为**管理员**（完全斜杠命令访问权限）和**普通用户**（仅限您明确启用的命令），请在平台的 `extra` 块中添加 `allow_admin_from` 和 `user_allowed_commands`：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        # 现有允许列表（保持不变）
        allow_from:
          - "123456789"     # 管理员
          - "555555555"     # 普通用户
          - "777777777"     # 普通用户

        # 新增 — 管理员拥有所有斜杠命令权限（内置 + 插件）
        allow_admin_from:
          - "123456789"

        # 新增 — 非管理员的被允许用户只能运行以下斜杠命令。
        # /help 和 /whoami 始终允许，以便用户查看其访问权限。
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

- 对于某个作用域（私信或群组），列在 `allow_admin_from` 中的用户可以运行**所有**已注册的斜杠命令——包括内置命令和插件注册的命令——通过实时注册表。
- 列在 `allow_from` 中但**未**在 `allow_admin_from` 中的用户，只能运行 `user_allowed_commands` 中列出的命令，加上始终允许的基准命令：`/help` 和 `/whoami`。
- 普通聊天（非斜杠消息）不受影响。非管理员用户仍然可以正常与智能体对话，只是无法触发任意命令。
- **向后兼容：** 如果某个作用域未设置 `allow_admin_from`，则该作用域的斜杠命令门控功能被禁用。现有安装无需任何更改即可继续正常工作。
- 私信管理员状态不等于群组管理员状态。每个作用域都有自己的管理员列表。
- 如果仅设置了 `group_allow_admin_from`，则私信作用域保持在不受限制（向后兼容）模式。

使用 `/whoami` 查看当前作用域、您的层级（管理员 / 用户 / 不受限制）以及您可以运行哪些斜杠命令。

## 交互式模型选择器

当您在 Telegram 聊天中发送不带参数的 `/model` 时，Hermes 会显示一个用于切换模型的交互式内联键盘：

1.  **选择提供商** — 显示每个可用提供商及其模型数量的按钮（例如 "OpenAI (15)"，对于当前提供商显示 "✓ Anthropic (12)"）。
2.  **选择模型** — 带有**上一页**/**下一页**导航的分页模型列表、用于返回到提供商的**返回**按钮以及**取消**按钮。

当前模型和提供商显示在顶部。所有导航都通过原地编辑同一条消息完成（不会造成聊天混乱）。

:::tip
如果您知道确切的模型名称，请直接输入 `/model <name>` 以跳过选择器。您也可以输入 `/model <name> --global` 以在会话之间持久化此更改。
:::

## 基于HTTPS的DNS故障转移IP

在某些受限网络中，`api.telegram.org` 可能解析到一个不可达的IP。Telegram适配器包含一个**故障转移IP**机制，可以透明地尝试连接备用IP，同时保留正确的TLS主机名和SNI。

### 工作原理

1. 如果设置了 `TELEGRAM_FALLBACK_IPS`，则直接使用这些IP。
2. 否则，适配器会自动通过基于HTTPS的DNS（DoH）查询 **Google DNS** 和 **Cloudflare DNS**，以发现 `api.telegram.org` 的备用IP。
3. DoH返回的、与系统DNS结果不同的IP将被用作故障转移地址。
4. 如果DoH也被阻止，则使用一个硬编码的种子IP（`149.154.167.220`）作为最后手段。
5. 一旦某个故障转移IP成功，它就会变得“粘滞”——后续请求将直接使用它，而无需先重试主路径。

### 配置

```bash
# 显式故障转移IP（逗号分隔）
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
通常您不需要手动配置此选项。通过DoH的自动发现可以处理大多数受限网络场景。`TELEGRAM_FALLBACK_IPS` 环境变量仅在网络上的DoH也被阻止时才需要。
:::

## 代理支持

如果您的网络需要HTTP代理才能访问互联网（常见于企业环境），Telegram适配器会自动读取标准代理环境变量，并通过代理路由所有连接。

### 支持的变量

适配器按顺序检查以下环境变量，使用第一个被设置的变量：

1. `HTTPS_PROXY`
2. `HTTP_PROXY`
3. `ALL_PROXY`
4. `https_proxy` / `http_proxy` / `all_proxy`（小写变体）

### 配置

在启动网关前，在环境中设置代理：

```bash
export HTTPS_PROXY=http://proxy.example.com:8080
hermes gateway
```

或将其添加到 `~/.hermes/.env`：

```bash
HTTPS_PROXY=http://proxy.example.com:8080
```

代理适用于主传输和所有故障转移IP传输。无需额外的Hermes配置——如果设置了环境变量，它会自动被使用。

:::note
这涵盖了Hermes用于Telegram连接的自定义故障转移传输层。其他地方使用的标准 `httpx` 客户端原生就支持代理环境变量。
:::

## 消息反应

机器人可以对消息添加表情符号反应，作为视觉处理反馈：

- 👀 当机器人开始处理您的消息时
- ✅ 当响应成功送达时
- ❌ 如果在处理过程中发生错误

反应默认是**禁用**的。在 `config.yaml` 中启用它们：

```yaml
telegram:
  reactions: true
```

或通过环境变量：

```bash
TELEGRAM_REACTIONS=true
```

:::note
与Discord（反应是累加的）不同，Telegram的Bot API会在单个调用中替换所有机器人反应。从 👀 到 ✅/❌ 的转换是原子性的——您不会同时看到两者。
:::

:::tip
如果机器人在群组中没有添加反应的权限，反应调用会静默失败，消息处理正常继续。
:::

## 针对特定频道的提示词

为特定的Telegram群组或论坛主题分配临时系统提示词。提示词在运行时的每一轮对话中注入——永远不会持久化到对话历史中——因此更改会立即生效。

```yaml
telegram:
  channel_prompts:
    "-1001234567890": |
      You are a research assistant. Focus on academic sources,
      citations, and concise synthesis.
    "42":  |
      This topic is for creative writing feedback. Be warm and
      constructive.
```

键是聊天ID（群组/超级群组）或论坛主题ID。对于论坛群组，主题级别的提示词会覆盖群组级别的提示词：

- 在群组 `-1001234567890` 内的主题 `42` 中发送消息 → 使用主题 `42` 的提示词
- 在主题 `99`（没有显式条目）中发送消息 → 回退到群组 `-1001234567890` 的提示词
- 在没有条目的群组中发送消息 → 不应用频道提示词

数字YAML键会自动规范化为字符串。

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| 机器人完全无响应 | 验证 `TELEGRAM_BOT_TOKEN` 是否正确。检查 `hermes gateway` 日志以查找错误。 |
| 机器人响应"unauthorized" | 您的用户ID不在 `TELEGRAM_ALLOWED_USERS` 中。使用 @userinfobot 再次检查。 |
| 机器人忽略群组消息 | 隐私模式可能已开启。禁用它（步骤3）或将机器人设为群组管理员。**记得在更改隐私设置后，将机器人移除并重新添加。** |
| 语音消息未被转录 | 验证STT是否可用：安装 `faster-whisper` 进行本地转录，或在 `~/.hermes/.env` 中设置 `GROQ_API_KEY` / `VOICE_TOOLS_OPENAI_KEY`。 |
| 语音回复是文件，而非气泡 | 安装 `ffmpeg`（Edge TTS Opus转换需要）。 |
| 机器人令牌被撤销/无效 | 通过BotFather中的 `/revoke` 然后 `/newbot` 或 `/token` 生成新令牌。更新您的 `.env` 文件。 |
| Webhook未收到更新 | 验证 `TELEGRAM_WEBHOOK_URL` 是否可公开访问（使用 `curl` 测试）。确保您的平台/反向代理将来自该URL端口的入站HTTPS流量路由到由 `TELEGRAM_WEBHOOK_PORT` 配置的本地监听端口（它们不必是相同的数字）。确保SSL/TLS处于活动状态——Telegram仅发送到HTTPS URL。检查防火墙规则。 |

## 执行批准

当智能体尝试运行可能具有危险性的命令时，它会在聊天中请求您的批准：

> ⚠️ 此命令可能具有危险性（递归删除）。回复“yes”以批准。

回复"yes"/"y"以批准，或回复"no"/"n"以拒绝。

## 交互式提示（澄清）

当智能体调用 `clarify` 工具——询问您偏好哪种方法、获取任务后反馈或在做出非琐碎决定前进行检查——时，Telegram会使用**内联键盘按钮**呈现问题：

> ❓ 对于仪表盘，我应该使用哪个框架？
>
> [1. Next.js] [2. Remix] [3. Astro]
> [✏️ 其他（输入答案）]

点击一个按钮来回答，或点击**其他**来输入自由格式的回复（您发送的下一条消息将成为答案）。开放式 `clarify` 调用（无预设选项）会跳过按钮，直接捕获您的下一条消息。

通过 `~/.hermes/config.yaml` 中的 `agent.clarify_timeout` 配置响应超时（默认 `600` 秒）。如果您未在超时时间内响应，智能体会使用哨兵消息解除阻塞并进行适应，而不是挂起。

## 推送通知音量

Telegram会在机器人发送的每条消息上触发推送通知。对于长时间的智能体轮次，会发出工具进度气泡、流式更新和状态回调，这很快会变得嘈杂。Telegram适配器有两种通知模式：

| 模式 | 行为 |
|------|----------|
| `important`（默认） | 只有**最终响应**、**批准提示**和**斜杠命令确认**会响铃。工具进度、流式分片和状态消息以 `disable_notification=true` 传递。 |
| `all` | 每条外发消息都会触发推送通知。旧版行为；如果您确实想了解每个工具调用，请选择此选项。 |

在 `~/.hermes/config.yaml` 中配置：

```yaml
display:
  platforms:
    telegram:
      notifications: important   # 或 "all"
```

环境覆盖（便于快速A/B测试）：

```bash
HERMES_TELEGRAM_NOTIFICATIONS=all
```

未知值会记录警告并回退到 `important`。
## 状态消息就地编辑

Telegram适配器通过 `send_or_update_status()` 路由循环的智能体状态回调（例如“压缩上下文……”、“调用工具……”），该函数维护一个 `{(chat_id, status_key) → message_id}` 缓存，并在后续发出时**编辑现有气泡**，而不是每次都附加新消息。不同的 `status_key` 值会获得各自的消息；不同的聊天永远不会冲突。如果编辑失败（例如用户删除了消息，或消息太旧而无法编辑），则缓存条目会被丢弃，下次发出会发布新消息并重新缓存其ID。无需配置——这是默认的Telegram行为。其他未实现 `send_or_update_status` 的适配器会原样回退到普通的 `send()`。

## 在智能体轮次期间固定传入的用户消息

当用户发送一条触发智能体轮次的消息时，Telegram适配器会在该轮次期间固定该传入消息，并在响应完成后解除固定——这是一个轻量级的视觉指示器，表明机器人正在积极处理该消息，而不是忽略它。固定操作使用 `disable_notification=true` 以避免额外的提示音。无需配置。

## 安全

:::warning
务必设置 `TELEGRAM_ALLOWED_USERS` 以限制谁可以与您的机器人交互。如果没有设置，作为安全措施，网关默认会拒绝所有用户。
:::

切勿公开分享您的机器人令牌。如果泄露，请立即通过BotFather的 `/revoke` 命令撤销它。

有关更多详细信息，请参阅[安全文档](/user-guide/security)。您还可以使用[DM配对](/user-guide/messaging#dm-pairing-alternative-to-allowlists)作为更动态的用户授权方法。