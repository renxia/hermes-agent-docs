---
sidebar_position: 1
title: "Telegram"
description: "将 Hermes 智能体设置为 Telegram 机器人"
---

# Telegram 设置

Hermes 智能体可以作为功能齐全的对话机器人集成到 Telegram 中。连接后，您可以在任何设备上与您的智能体聊天，发送会自动转录的语音备忘录，接收计划任务的结果，并在群聊中使用该智能体。该集成基于 [python-telegram-bot](https://python-telegram-bot.org/) 构建，支持文本、语音、图片和文件附件。

## 步骤 1：通过 BotFather 创建机器人

每个 Telegram 机器人都需要一个由 Telegram 官方机器人管理工具 [@BotFather](https://t.me/BotFather) 颁发的 API 令牌。

1. 打开 Telegram 并搜索 **@BotFather**，或访问 [t.me/BotFather](https://t.me/BotFather)
2. 发送 `/newbot`
3. 选择一个**显示名称**（例如 "Hermes Agent"）—— 这可以是任何名称
4. 选择一个**用户名** —— 这必须是唯一的，并以 `bot` 结尾（例如 `my_hermes_bot`）
5. BotFather 会回复你的 **API 令牌**。它看起来像这样：

```
123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
```

:::warning
请妥善保管你的机器人令牌。任何拥有此令牌的人都可以控制你的机器人。如果泄露，请立即在 BotFather 中通过 `/revoke` 撤销它。
:::

## 步骤 2：自定义您的机器人（可选）

这些 BotFather 命令可以改善用户体验。请向 @BotFather 发送消息并使用：

| 命令 | 用途 |
|---------|---------|
| `/setdescription` | 在用户开始聊天前显示的“这个机器人能做什么？”文本 |
| `/setabouttext` | 机器人个人资料页面上的简短描述 |
| `/setuserpic` | 为您的机器人上传头像 |
| `/setcommands` | 定义命令菜单（聊天中的 `/` 按钮） |
| `/setprivacy` | 控制机器人是否可以看到所有群组消息（见步骤 3） |

:::tip
对于 `/setcommands`，一个有用的初始命令集：

```
help - 显示帮助信息
new - 开始新对话
sethome - 将此聊天设为主频道
```
:::

## 步骤 3：隐私模式（群组使用的关键）

Telegram 机器人有一个**隐私模式**，该模式**默认开启**。这是在群组中使用机器人时最常引起困惑的地方。

**隐私模式开启时**，您的机器人只能看到：
- 以 `/` 命令开头的消息
- 直接回复机器人自身消息的消息
- 服务消息（成员加入/离开、置顶消息等）
- 机器人作为管理员的频道中的消息

**隐私模式关闭时**，机器人将收到群组中的每一条消息。

### 如何禁用隐私模式

1. 向 **@BotFather** 发送消息
2. 发送 `/mybots`
3. 选择您的机器人
4. 进入 **Bot Settings → Group Privacy → Turn off**

:::warning
更改隐私设置后，**您必须将机器人从任何群组中移除并重新添加**。Telegram 会在机器人加入群组时缓存其隐私状态，直到机器人被移除并重新添加后才会更新。
:::

:::tip
禁用隐私模式的一个替代方案是：将机器人提升为**群组管理员**。管理员机器人无论隐私设置如何都能接收所有消息，这样就不需要切换全局隐私模式。
:::

### 在群组中观察聊天记录而不自动回复

要实现类似 OpenClaw/元宝的群组行为，请配置 Telegram 使机器人能够**看到**普通群组消息，但仅在被直接触发时**回复**：

```yaml
telegram:
  allowed_chats:
    - "-1001234567890"
  group_allowed_chats:
    - "-1001234567890"
  require_mention: true
  observe_unmentioned_group_messages: true
```

启用此模式后，来自明确允许列表中聊天/主题的未提及群组消息将作为观察上下文追加到共享聊天/主题会话记录中，但不会调度智能体。`allowed_chats` 控制机器人响应的范围；`group_allowed_chats` 授权用于观察上下文的共享群组会话，因此请为此模式使用相同的聊天 ID。稍后在同一允许的聊天/主题中对机器人的 `@botname` 提及、回复或配置的提及模式可以使用该观察上下文。触发的消息还会被标记为 `[昵称|用户 ID]`，并获得一个每轮安全提示，以便模型将之前的观察行视为上下文，而不是发送给机器人的指令。

等效的环境变量：

```bash
TELEGRAM_ALLOWED_CHATS=-1001234567890
TELEGRAM_GROUP_ALLOWED_CHATS=-1001234567890
TELEGRAM_OBSERVE_UNMENTIONED_GROUP_MESSAGES=true
```

这需要 Telegram 将普通群组消息传递给网关，因此请禁用 BotFather 隐私模式或将机器人提升为群组管理员，如上所述。

## 步骤 4：查找您的用户 ID

Hermes 智能体使用数字 Telegram 用户 ID 来控制访问权限。您的用户 ID **不是**您的用户名——它是一个类似 `123456789` 的数字。

**方法 1（推荐）：** 向 [@userinfobot](https://t.me/userinfobot) 发送消息——它会立即回复您的用户 ID。

**方法 2：** 向 [@get_id_bot](https://t.me/get_id_bot) 发送消息——另一个可靠的选择。

保存这个数字；下一步将需要用到它。

## 步骤 5：配置 Hermes

### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

在提示时选择 **Telegram**。向导会询问您的机器人令牌和允许的用户 ID，然后为您编写配置。

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

机器人应在几秒钟内上线。在 Telegram 上向它发送一条消息以进行验证。

## 从 Docker 支持的终端发送生成的文件

如果您的终端后端是 `docker`，请记住 Telegram 附件是由**网关进程**发送的，而不是从容器内部发送。这意味着最终的 `MEDIA:/...` 路径必须在运行网关的主机上可读。

常见陷阱：
- 智能体在 Docker 内部将文件写入 `/workspace/report.txt`
- 模型发出 `MEDIA:/workspace/report.txt`
- Telegram 发送失败，因为 `/workspace/report.txt` 只存在于容器内部，而不存在于主机上

推荐模式：

```yaml
terminal:
  backend: docker
  docker_volumes:
    - "/home/user/.hermes/cache/documents:/output"
```

然后：
- 在 Docker 内部将文件写入 `/output/...`
- 在 `MEDIA:` 中发出**主机可见**的路径，例如：
  `MEDIA:/home/user/.hermes/cache/documents/report.txt`

如果您已经有 `docker_volumes:` 部分，请将新挂载点添加到同一列表中。YAML 重复键会静默覆盖先前的键。

### 支持的 `MEDIA:` 文件扩展名

网关从智能体回复中提取 `MEDIA:/path/to/file` 标签，并将引用的文件作为平台原生附件发送。支持的所有网关平台扩展名：

| 类别 | 扩展名 |
|---|---|
| 图片 | `png`, `jpg`, `jpeg`, `gif`, `webp`, `bmp`, `tiff`, `svg` |
| 音频 | `mp3`, `wav`, `ogg`, `m4a`, `opus`, `flac`, `aac` |
| 视频 | `mp4`, `mov`, `webm`, `mkv`, `avi` |
| **文档** | `pdf`, `txt`, `md`, `csv`, `json`, `xml`, `html`, `yaml`, `yml`, `log` |
| **Office** | `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp` |
| **压缩包** | `zip`, `rar`, `7z`, `tar`, `gz`, `bz2` |
| **书籍/软件包** | `epub`, `apk`, `ipa` |

此列表上的任何文件在支持原生附件的平台（Telegram、Discord、Signal、Slack、WhatsApp、飞书、Matrix 等）上都作为原生附件传递；在不支持原生附件的平台上，它会回退为链接或纯文本指示器。**加粗**的类别是在最近几个版本中添加的——如果您之前依赖模型说“这是文件：/path/to/report.docx”，请改为使用 `MEDIA:/path/to/report.docx` 进行原生传递。

## Webhook 模式

默认情况下，Hermes 使用**长轮询**连接到 Telegram——网关向 Telegram 的服务器发出出站请求以获取新的更新。这对于本地和始终在线的部署效果很好。

对于**云部署**（Fly.io、Railway、Render 等），**Webhook 模式**更具成本效益。这些平台可以在入站 HTTP 流量时自动唤醒挂起的机器，但不能在出站连接时唤醒。由于轮询是出站的，轮询机器人永远无法休眠。Webhook 模式改变了方向——Telegram 将更新推送到您机器人的 HTTPS URL，从而实现空闲时休眠的部署。

| | 轮询（默认） | Webhook |
|---|---|---|
| 方向 | 网关 → Telegram（出站） | Telegram → 网关（入站） |
| 最适合 | 本地、始终在线的服务器 | 具有自动唤醒功能的云平台 |
| 设置 | 无需额外配置 | 设置 `TELEGRAM_WEBHOOK_URL` |
| 空闲成本 | 机器必须保持运行 | 机器可以在消息之间休眠 |

### 配置

将以下内容添加到 `~/.hermes/.env`：

```bash
TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
TELEGRAM_WEBHOOK_SECRET="$(openssl rand -hex 32)"  # 必需
# TELEGRAM_WEBHOOK_PORT=8443        # 可选，默认 8443
```

| 变量 | 必需 | 描述 |
|----------|----------|-------------|
| `TELEGRAM_WEBHOOK_URL` | 是 | Telegram 将发送更新的公共 HTTPS URL。URL 路径会自动提取（例如，从上面的示例中提取 `/telegram`）。 |
| `TELEGRAM_WEBHOOK_SECRET` | **是**（当设置了 `TELEGRAM_WEBHOOK_URL` 时） | Telegram 在每个 Webhook 请求中回显以进行验证的密钥令牌。没有它网关将拒绝启动——参见 [GHSA-3vpc-7q5r-276h](https://github.com/NousResearch/hermes-agent/security/advisories/GHSA-3vpc-7q5r-276h)。使用 `openssl rand -hex 32` 生成。 |
| `TELEGRAM_WEBHOOK_PORT` | 否 | Webhook 服务器监听的本地端口（默认：`8443`）。 |

设置了 `TELEGRAM_WEBHOOK_URL` 后，网关会启动 HTTP Webhook 服务器而不是轮询。未设置时，将使用轮询模式——与之前版本的行为无变化。

### 云部署示例 (Fly.io)

1. 将环境变量添加到您的 Fly.io 应用密钥中：

```bash
fly secrets set TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
fly secrets set TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

2. 在 `fly.toml` 中暴露 Webhook 端口：

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

如果 Telegram 的 API 被封锁，或者您需要通过代理路由流量，请设置 Telegram 专用的代理 URL。这将优先于通用的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量。

**选项一：config.yaml（推荐）**

```yaml
telegram:
  proxy_url: "socks5://127.0.0.1:1080"
```

**选项二：环境变量**

```bash
TELEGRAM_PROXY=socks5://127.0.0.1:1080
```

支持的协议：`http://`、`https://`、`socks5://`。

代理同时作用于主 Telegram 连接和备用 IP 传输。如果未设置 Telegram 专用代理，网关会回退到 `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`（或 macOS 系统代理自动检测）。

## 主频道

在任意 Telegram 聊天（私信或群组）中使用 `/sethome` 命令可将其指定为**主频道**。定时任务（cron 作业）会将结果投递到此频道。

您也可以在 `~/.hermes/.env` 中手动设置：

```bash
TELEGRAM_HOME_CHANNEL=-1001234567890
TELEGRAM_HOME_CHANNEL_NAME="My Notes"
```

:::tip
群组聊天 ID 为负数（例如 `-1001234567890`）。您的个人私信聊天 ID 与您的用户 ID 相同。
:::

### 主题模式下的 Cron 投递

如果您在机器人私信中启用了主题模式，发送到根聊天的 cron 消息会进入系统专用大厅——在那里回复不会开启会话，您会看到"主聊天保留用于系统命令"的提示。请创建一个专用论坛主题（例如 `Cron`）并设置：

```bash
TELEGRAM_CRON_THREAD_ID=<topic_thread_id>
```

`TELEGRAM_CRON_THREAD_ID` 仅针对 cron 投递覆盖 `TELEGRAM_HOME_CHANNEL_THREAD_ID`。在该主题中的回复会继续该主题的现有会话。

## 语音消息

### 接收语音（语音转文字）

您在 Telegram 上发送的语音消息将由 Hermes 配置的 STT 提供商自动转录为文本，并注入到对话中。

- `local` 模式在运行 Hermes 的机器上使用 `faster-whisper` — 无需 API 密钥
- `groq` 模式使用 Groq Whisper，需要 `GROQ_API_KEY`
- `openai` 模式使用 OpenAI Whisper，需要 `VOICE_TOOLS_OPENAI_KEY`

#### 跳过 STT：将原始音频文件传递给智能体

如果您更希望让**智能体本身**处理音频 — 例如进行说话人分离、使用自定义转录工具，或者只是为了存档录音 — 请在 `~/.hermes/config.yaml` 中设置 `stt.enabled: false`：

```yaml
stt:
  enabled: false
```

禁用 STT 后，网关仍然会将语音/音频附件下载到 Hermes 的音频缓存中，但**不会进行转录**。智能体会收到带如下标记的消息：

```
[用户发送了一条语音消息: /home/<用户>/.hermes/cache/audio/<哈希值>.ogg]
```

然后，您的工具或技能可以直接读取该路径（例如，将其传递给本地的说话人分离流程、更强大的转录模型，或上传到长期存储）。文件扩展名反映了 Telegram 传递的原始格式（`.ogg` 用于语音备忘录，`.mp3`/`.m4a` 等用于音频附件）。

这与下文 [本地 Bot API 服务器](#large-files-20mb--via-local-bot-api-server) 部分自然配合，后者将 Telegram 的 20MB `getFile` 限制提升至 2GB — 当您要处理的录音长度超过几分钟时非常有用。

### 发送语音（文字转语音）

当智能体通过 TTS 生成音频时，它将以原生 Telegram **语音气泡** 的形式发送 — 即那种圆形的、可内联播放的样式。

- **OpenAI 和 ElevenLabs** 原生生成 Opus 格式 — 无需额外设置
- **Edge TTS**（默认的免费提供商）输出 MP3 格式，并需要 **ffmpeg** 转换为 Opus：

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

如果没有 ffmpeg，Edge TTS 的音频将作为普通音频文件发送（仍然可播放，但使用的是矩形播放器而非语音气泡）。

请在您的 `config.yaml` 中，于 `tts.provider` 键下配置 TTS 提供商。

## 通过本地 Bot API 服务器处理大文件 (>20MB)

Telegram 的**公共** Bot API 将 `getFile` 下载限制在 **20 MB**，因此任何大于此限制的语音、音频、视频或文档都会被 Hermes 静默拒绝，并回复“文件过大”。文档记载的解决方法是运行一个**本地** [telegram-bot-api](https://github.com/tdlib/telegram-bot-api) 守护进程 — 即 Telegram 使用的相同服务器软件，但在您的网络上运行。本地服务器将文件上限提高到 **2 GB**，并且当 Hermes 检测到配置了自定义的 `base_url` 时，会自动解除其自身的内部限制。

这可以解锁如下工作流程：

- 向机器人发送长语音备忘录（45 分钟的会议、播客）
- 上传大型视频用于视觉工具处理
- 存档原始音频，用于说话人分离、对齐或训练数据等离线流程

### 第一步：获取 Telegram API 凭据

本地服务器直接与 Telegram 的 MTProto 层（而非公共 Bot API）通信，因此需要 **MTProto 凭据**：

1.  访问 [my.telegram.org/apps](https://my.telegram.org/apps) 并使用您的 Telegram 账户登录。
2.  创建一个新的应用程序（任何名称和简短描述即可）。
3.  复制 `api_id` 和 `api_hash` — 两者都是必需的。

### 第二步：运行 telegram-bot-api 服务器

社区维护的 [`aiogram/telegram-bot-api`](https://hub.docker.com/r/aiogram/telegram-bot-api) Docker 镜像是最简单的途径。一个最小的 `docker-compose.yaml`（使用 `--local` 模式以启用更高限制）：

```yaml
services:
  tg-bot-api:
    image: aiogram/telegram-bot-api:latest
    container_name: tg-bot-api
    restart: unless-stopped
    ports:
      - "127.0.0.1:8081:8081"   # 仅绑定到回环地址；参见安全注意事项
    environment:
      TELEGRAM_API_ID: "12345"           # 您的 api_id，来自第一步
      TELEGRAM_API_HASH: "abcdef..."     # 您的 api_hash，来自第一步
      TELEGRAM_LOCAL: "1"                # 启用 --local 模式（将 20MB → 2GB）
    volumes:
      - ./tg-bot-api-data:/var/lib/telegram-bot-api
```

启动服务：

```bash
docker compose up -d tg-bot-api
docker logs --tail 20 tg-bot-api
```

:::warning 安全警告
本地 Bot API 服务器在 URL 路径中接收您的 bot token（例如 `/bot<TOKEN>/getMe`），**没有其他身份验证**。任何能够访问该端口的人都可以完全控制您的机器人 — 读取它能看到的所有消息、以它的身份发送消息，等等。将容器绑定到 `127.0.0.1` 并/或在其前面配置一个位于私有网络上的反向代理。**切勿将端口 8081 暴露在公共互联网上。**
:::

### 第三步：将机器人从公共 API 注销（一次性操作）

一个机器人一次只能在**一个** Bot API 服务器上处于活动状态。如果您的机器人此前已经在 `api.telegram.org` 上运行（几乎肯定如此），您必须在本地服务器接受它之前，显式地将其从那里注销：

```bash
curl "https://api.telegram.org/bot<你的机器人TOKEN>/logOut"
# 期望响应: {"ok":true,"result":true}
```

这是一次性的迁移步骤 — 无需在每次重启时重复。`logOut` 之后收到的任何消息将通过新服务器传递。

验证本地服务器可以代表机器人与 Telegram 通信：

```bash
curl "http://127.0.0.1:8081/bot<你的机器人TOKEN>/getMe"
# 期望响应: {"ok":true,"result":{"id":...,"is_bot":true,...}}
```

### 第四步：将 Hermes 指向本地服务器

在 `~/.hermes/config.yaml` 的 `platforms.telegram.extra` 下添加 URL：

```yaml
platforms:
  telegram:
    extra:
      base_url: "http://127.0.0.1:8081/bot"
      base_file_url: "http://127.0.0.1:8081/file/bot"
      local_mode: true        # 参见下面的第五步 — 仅当机器人的数据目录
                              # 可被 Hermes 进程读取时才设置此项
```

:::caution 请使用 `platforms.telegram.extra`，而非 `telegram.extra`
目前只有 `platforms.<name>.extra` 形式的配置会被深度合并到平台配置中。直接放置在顶层 `telegram.extra` 块下的键会被静默忽略。
:::

当设置了 `base_url` 时，Hermes 会：

- 针对本地服务器构建 python-telegram-bot 客户端
- 自动将其内部的文档/音频大小限制从 20 MB 提升至 2 GB
- 在“文件过大”的错误消息中报告当前生效的限制（`Maximum: 2048 MB.`），以便清楚您所处的模式

重启网关并查看确认日志行：

```bash
hermes gateway restart
grep -E "Using custom Telegram base_url|Using Telegram local_mode" ~/.hermes/logs/gateway.log | tail
```

### 第五步：`local_mode` — 磁盘上的文件访问

本地服务器有**两种方式**来传递文件：

1.  **不带 `--local`**（默认方式）：文件通过 HTTP 在 `/file/bot<TOKEN>/<path>` 路径提供，与公共 Bot API 相同。20MB 的限制仍然有效。仅适用于作为网络修复（例如当 `api.telegram.org` 不可达但您可以自托管时）；不是您想要用于提升大小限制的方式。
2.  **带 `--local`**（通过上方的 `TELEGRAM_LOCAL=1` 设置）：文件被写入服务器的文件系统，`getFile` 响应返回一个**绝对路径**而非 HTTP URL。20MB 的限制被解除。然后 Hermes 必须从**磁盘**读取字节，而不是通过 HTTP。

为了使磁盘读取路径工作，需在上面的配置中设置 `local_mode: true`，**并且**确保 Hermes 进程能够读取服务器返回的路径。有两种场景：

- **同一机器** — telegram-bot-api 和 Hermes 运行在同一台主机上。将数据卷挂载绑定到 Hermes 可以读取的目录（例如 `/var/lib/telegram-bot-api`），并确保文件所有权匹配。容器会降级到其内部的 `telegram-bot-api` 用户运行（uid 因镜像而异）；最简单的解决方法是在 compose 服务中添加 `user: "<UID>:<GID>"`，使文件由 Hermes 已经运行的 uid 拥有。
- **不同机器** — 机器人服务器运行在一台主机上（例如 NAS、单独的虚拟机），而 Hermes 在另一台上。服务器的数据目录必须以与服务器报告的**相同绝对路径**（通常是 `/var/lib/telegram-bot-api`）共享给 Hermes 机器。NFS 适用于此；如果您不想处理文件系统级别的 uid 不匹配问题，使用 `uid=` 挂载重映射的 CIFS/SMB 更友好。

如果设置了 `local_mode: true` 但 Hermes 无法 `stat` 返回的文件路径（权限或错误的挂载），python-telegram-bot 会静默回退到针对本地服务器的 HTTP `getFile` 请求 — 而在 `--local` 模式下，服务器会返回 `404 Not Found`。此症状在 `gateway.log` 中显示为：

```
[Telegram] Failed to cache voice: Not Found
telegram.error.InvalidToken: Not Found
```

如果您看到此错误，说明大小提升生效了，但文件共享有问题。请以网关运行的用户身份，从 Hermes 主机执行 `ls -la /var/lib/telegram-bot-api/<TOKEN>/voice/` 验证，并确认单个文件可以通过 `cat` 读取且没有权限错误。

### 第六步：测试

向机器人发送一个大于 20 MB 的语音或音频文件。跟踪网关日志：

```bash
tail -f ~/.hermes/logs/gateway.log | grep -iE "telegram|cache"
```

您应该看到一行 `[Telegram] Cached user voice at /home/<user>/.hermes/cache/audio/...`，并且**没有**“文件过大”的拒绝消息。结合上方的 `stt.enabled: false`，原始音频文件的路径随后将被传递到智能体的接收消息中，供下游处理。

## 群组聊天用法

Hermes 智能体在 Telegram 群组中工作时需注意以下几点：

- **隐私模式**决定了机器人能看到哪些消息（参见[步骤 3](#step-3-隐私模式-对群组至关重要)）
- `TELEGRAM_ALLOWED_USERS` 仍然适用——只有授权用户才能在群组中触发机器人
- 您可以通过 `telegram.require_mention: true` 阻止机器人响应普通的群组闲聊
- 当 `telegram.require_mention: true` 时，群组消息在以下情况下会被接受：
  - 对机器人某条消息的回复
  - `@botusername` 提及
  - `/command@botusername`（Telegram 的包含机器人名称的机器人菜单命令形式）
  - 与您在 `telegram.mention_patterns` 中配置的唤醒词正则表达式匹配
- 在包含多个 Hermes 机器人的群组中，`telegram.exclusive_bot_mentions` 可确保路由的确定性。当一条消息明确提到了一个或多个 Telegram 机器人用户名时，只有被提及的机器人配置文件会处理它；其他 Hermes 机器人会在回复和唤醒词匹配阶段忽略它。此功能默认启用。
- 使用 `telegram.ignored_threads` 可让 Hermes 在特定的 Telegram 论坛主题中保持静默，即使群组在其他情况下允许自由响应或提及触发回复
- 如果 `telegram.require_mention` 未设置或为 false，Hermes 将保持之前的开放群组行为，并响应它能看到的普通群组消息

### 一个群组中有多个 Hermes 机器人

如果您在同一个 Telegram 群组中运行多个 Hermes 配置文件，请为每个配置文件创建一个 Telegram 机器人令牌，并为每个配置文件启动一个网关。不要在多个运行的网关中重复使用同一个机器人令牌；Telegram 会拒绝使用同一令牌的并发轮询。

推荐的群组配置：

```yaml
telegram:
  require_mention: true
  exclusive_bot_mentions: true
  mention_patterns: []
```

通过此设置，像 `@research_bot @ops_bot summarize this` 这样的群组消息只会由 `research_bot` 和 `ops_bot` 处理。群组中的其他 Hermes 机器人会保持静默，即使消息是对它们先前某条消息的回复，或者匹配了共享的唤醒词。

仅当出于向后兼容考虑（即明确提及不应覆盖回复和唤醒词触发），才将 `exclusive_bot_mentions` 设置为 `false`。

要运行多个配置文件，请为每个配置文件运行一次网关命令。例如：

```bash
# 默认配置文件
hermes gateway start
hermes gateway status
hermes gateway stop

# 命名配置文件
hermes -p research gateway start
hermes -p research gateway status
hermes -p research gateway stop
```

对于小型固定集群，可以使用 shell 循环或脚本，分别为默认配置文件调用 `hermes gateway <action>`，为每个命名配置文件调用 `hermes -p <profile> gateway <action>`。这比假设单个进程级命令能控制所有服务管理器上的每个命名配置文件更可靠。

### 故障排除：私聊有效但群组无效

如果机器人在私聊中响应但在群组中保持静默，请按顺序检查这些**门控条件**：

1.  **Telegram 消息传递：** 关闭 BotFather 的隐私模式，将机器人提升为管理员，或直接提及机器人。Hermes 无法响应 Telegram 从未传递给机器人的群组消息。
2.  **更改隐私后重新加入：** 在更改 BotFather 隐私设置后，将机器人移出群组并重新添加。Telegram 对于现有成员资格可能保留旧的传递行为。
3.  **Hermes 授权：** 确保发送者已列在 `TELEGRAM_ALLOWED_USERS` 或 `TELEGRAM_GROUP_ALLOWED_USERS` 中，或者使用 `TELEGRAM_GROUP_ALLOWED_CHATS` 允许该群聊。
4.  **提及过滤器：** 如果设置了 `telegram.require_mention: true`，普通的群组闲聊将被忽略，除非消息是斜杠命令、对机器人的回复、`@botusername` 提及，或匹配了配置的 `mention_patterns`。
5.  **多机器人路由：** 如果群组包含多个机器人，请确保每个 Hermes 配置文件使用唯一的机器人令牌，并保持 `exclusive_bot_mentions` 启用，除非您故意想要旧的共享触发行为。

Telegram 群组和超级群组的聊天 ID 为负数是正常的。如果您使用基于聊天范围的授权，请将这些 ID 放在 `TELEGRAM_GROUP_ALLOWED_CHATS` 中，而不是发送者用户允许列表中。

### 群组触发配置示例

将此内容添加到 `~/.hermes/config.yaml`：

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

此示例允许所有常规的直接触发，以及以 `chompy` 开头的消息，即使它们没有使用 `@mention`。
在提及和自由响应检查运行之前，Telegram 主题 `31` 和 `42` 中的消息将始终被忽略。

### 关于 `mention_patterns` 的说明

- 模式使用 Python 正则表达式
- 匹配不区分大小写
- 模式会同时针对文本消息和媒体标题进行检查
- 无效的正则表达式模式会在网关日志中显示警告而被忽略，不会导致机器人崩溃
- 如果您希望模式仅在消息开头匹配，请使用 `^` 进行锚定

## 私有聊天话题 (Bot API 9.4)

Telegram Bot API 9.4 (2026年2月) 引入了 **私有聊天话题** —— 机器人可以直接在一对一对话 (DM) 中创建论坛风格的话题线程，无需超级群组。这允许你在现有的与 Hermes 的私聊中运行多个隔离的工作空间。

### 用例

如果你同时进行多个长期项目，话题可以将它们的上下文彼此分离：

- **话题 "网站"** —— 处理你的生产 Web 服务
- **话题 "研究"** —— 进行文献综述和论文探索
- **话题 "通用"** —— 处理杂项任务和快速提问

每个话题都有自己独立的对话会话、历史记录和上下文——与其他话题完全隔离。

### 配置

:::caution 前提条件
在将话题添加到你的配置之前，用户必须在与机器人的私聊中**启用话题模式**：

1. 在 Telegram 中打开你与 Hermes 机器人的私聊
2. 点击顶部的机器人名称以打开聊天信息
3. 启用 **话题**（将聊天转换为论坛的开关）

如果未执行此操作，Hermes 在启动时会记录 `The chat is not a forum` 并跳过话题创建。这是一个 Telegram 客户端设置——机器人无法通过程序启用它。
:::

在 `~/.hermes/config.yaml` 的 `platforms.telegram.extra.dm_topics` 下添加话题：

```yaml
platforms:
  telegram:
    extra:
      dm_topics:
      - chat_id: 123456789        # 你的 Telegram 用户 ID
        topics:
        - name: General
          icon_color: 7322096
        - name: Website
          icon_color: 9367192
        - name: Research
          icon_color: 16766590
          skill: arxiv              # 在此话题中自动加载一个技能
```

**字段说明：**

| 字段 | 必填 | 描述 |
|-------|----------|-------------|
| `name` | 是 | 话题显示名称 |
| `icon_color` | 否 | Telegram 图标颜色代码（整数） |
| `icon_custom_emoji_id` | 否 | 用于话题图标的自定义表情符号 ID |
| `skill` | 否 | 在此话题的新会话中自动加载的技能 |
| `thread_id` | 否 | 话题创建后自动填充——无需手动设置 |

### 工作原理

1.  在网关启动时，Hermes 会为每个尚未拥有 `thread_id` 的话题调用 `createForumTopic`。
2.  `thread_id` 会自动保存回 `config.yaml` —— 后续重启将跳过该 API 调用。
3.  每个话题映射到一个隔离的会话键：`agent:main:telegram:dm:{chat_id}:{thread_id}`。
4.  每个话题中的消息拥有自己独立的对话历史记录、记忆刷新和上下文窗口。

### 根私聊处理

默认情况下，发送到根私聊（任何话题之外）的消息会被正常处理。设置 `ignore_root_dm: true` 可将根私聊转变为一个大厅——对于配置了私聊话题的用户，普通消息将被静默忽略，而系统命令（`/start`、`/help`、`/status` 等）仍然有效。

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

检查是**按聊天进行**的：只有 `dm_topics` 中至少有一个条目的用户，其根私聊才会受到影响。没有配置话题的用户不受影响。

### 技能绑定

带有 `skill` 字段的话题会在该话题的新会话开始时自动加载该技能。这就像在对话开始时输入 `/skill-name` —— 技能内容会被注入到第一条消息中，后续消息会在对话历史记录中看到它。

例如，一个设置为 `skill: arxiv` 的话题，每当其会话重置时（由于空闲超时、每日重置或手动 `/reset`），都会预加载 arxiv 技能。

:::tip
在配置之外创建的话题（例如，通过手动调用 Telegram API）会在 `forum_topic_created` 服务消息到达时被自动发现。你也可以在网关运行时向配置中添加话题——它们将在下一次缓存未命中时被获取。
:::

## 多会话私聊模式 (`/topic`)

一种类似 ChatGPT 的多会话私聊模式——一个机器人，多个并行对话。与上面由运营者策划的 `extra.dm_topics` 不同，此模式是**用户驱动**的：无需配置，无需预声明话题名称。最终用户通过 `/topic` 开启它，然后点击 Telegram 的 **+** 按钮来创建任意数量的话题，每个话题都是一个完全独立的 Hermes 会话。

### `/topic` 子命令

| 形式 | 上下文 | 效果 |
|------|---------|--------|
| `/topic` | 根私聊，尚未启用 | 检查 BotFather 能力，启用多会话模式，创建置顶的 "系统" 话题 |
| `/topic` | 根私聊，已启用 | 显示状态：可用于恢复的未链接会话 |
| `/topic` | 话题内部 | 显示当前话题的会话绑定 |
| `/topic help` | 任意 | 内联用法说明 |
| `/topic off` | 根私聊 | 禁用多会话模式并清除此聊天的所有话题绑定 |
| `/topic <会话ID>` | 话题内部 | 将一个之前的 Telegram 会话恢复到当前话题中 |

只有授权用户（通过 `TELEGRAM_ALLOWED_USERS` / 平台认证配置允许列表）才能运行 `/topic`。未授权的发送者会收到拒绝信息，而不是激活。

### 私聊话题 vs 多会话私聊模式

| | `extra.dm_topics` (配置驱动) | `/topic` (用户驱动) |
|---|---|---|
| 谁来激活 | 运营者，在 `config.yaml` 中 | 最终用户，通过发送 `/topic` |
| 话题列表 | 配置中声明的固定集合 | 用户自由创建/删除话题 |
| 话题名称 | 由运营者选择 | 由用户选择；自动重命名为匹配 Hermes 会话标题 |
| 根私聊行为 | 普通聊天（如果设置了 `ignore_root_dm: true` 则为大厅） | 变为系统大厅（非命令消息被拒绝） |
| 主要用例 | 具有可选技能绑定的永久工作空间 | 临时并行会话 |
| 持久化 | 配置中的 `extra.dm_topics` | `telegram_dm_topic_mode` + `telegram_dm_topic_bindings` SQLite 表 |

这两个功能可以在同一个机器人上共存——你可以从用户的私聊中运行 `/topic`，而 `extra.dm_topics` 继续管理其他聊天中运营者声明的话题。

### 前提条件

在 **@BotFather** 中，打开你的机器人 → **机器人设置 → 线程设置**：

1.  开启 **线程模式** (启用 `has_topics_enabled`)
2.  **不要**禁用用户创建话题（保持 `allows_users_to_create_topics` 开启）

当用户首次运行 `/topic` 时，Hermes 会调用 `getMe` 来验证这两个标志。如果任一关闭，Hermes 会发送 BotFather 线程设置页面的截图并解释需要切换哪些选项——在前提条件满足之前不会进行激活。

### 激活流程

从根私聊发送：

```
/topic
```

Hermes 将会：

1.  检查 `getMe().has_topics_enabled` 和 `allows_users_to_create_topics`
2.  如果两者都为真，则为此私聊启用多会话话题模式
3.  创建并置顶一个 **系统** 话题用于状态/命令（尽力而为）
4.  回复一个用户可恢复的、之前未链接的 Telegram 会话列表

激活后，**根私聊成为一个大厅**：普通提示词会被拒绝，并引导指向 **所有消息**。系统命令（`/status`、`/sessions`、`/usage`、`/help` 等）仍然在根私聊中有效。

### 创建新话题（最终用户流程）

1.  在 Telegram 中打开机器人私聊
2.  点击机器人界面顶部的 **所有消息**，然后发送任何消息
3.  Telegram 会为该消息创建一个新话题
4.  Hermes 在该话题内回复——该话题现在是一个独立的会话

每个话题都有自己独立的对话历史记录、模型状态、工具执行和会话 ID。隔离键是 `agent:main:telegram:dm:{chat_id}:{thread_id}`——与配置驱动的私聊话题隔离方式相同。

### 自动重命名话题

当 Hermes 为一个话题生成会话标题时（通过自动标题流程，在第一次交互之后），Telegram 话题本身也会被重命名以匹配——例如，“新话题” 会变成 “数据库迁移计划”。重命名是尽力而为的：失败会被记录但不会破坏会话。

要禁用此功能并保持你手动选择的话题名称不变，请设置：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        disable_topic_auto_rename: true
```

当此标志开启时，Hermes 仍会生成内部会话标题（用于 `hermes sessions`、TUI 等），但永远不会编辑 Telegram 话题名称。当你手动在 BotFather 线程模式下组织话题，并且不希望每次第一次回复都覆盖标题时，这很有用。

### 在话题中使用 `/new`

重置当前话题的会话（新的会话 ID，新的历史记录），而不影响其他话题。Hermes 会回复一个提示：对于并行工作，创建另一个话题（通过 **所有消息**）通常是你想要的。

### 恢复之前的会话

在话题内部，发送：

```
/topic <会话ID>
```

这会将当前话题绑定到一个现有的 Hermes 会话，而不是开始一个新会话。这对于继续在话题模式启用之前开始的对话很有用。限制：

-   目标会话必须属于同一个 Telegram 用户
-   目标会话不能已经绑定到另一个话题

Hermes 会确认会话标题并回放最后一条助手消息以提供上下文。

要发现会话 ID，在根私聊中发送 `/topic`（不带参数）——Hermes 会列出用户的未链接 Telegram 会话。

### 在话题中使用 `/topic`（不带参数）

显示当前话题的绑定：会话标题、会话 ID，以及关于使用 `/new` 与创建另一个话题的提示。

### 底层实现

-   激活状态会持久化到 `state.db` 的 `telegram_dm_topic_mode(chat_id, user_id, enabled, ...)` 表中
-   每个话题绑定会持久化到 `telegram_dm_topic_bindings(chat_id, thread_id, session_id, ...)` 表中，其中 `session_id` 字段设置了 `ON DELETE CASCADE`——修剪一个会话会自动清除其话题绑定
-   话题模式的 SQLite 迁移是**可选执行**的：它在第一次 `/topic` 调用时运行，绝不在网关启动时运行。在此配置文件中，直到用户运行 `/topic`，`state.db` 才会改变
-   每条传入的私聊消息都会查找其 `(chat_id, thread_id)` 绑定。如果存在，查找会通过 `SessionStore.switch_session()` 将消息路由到绑定的会话，从而确保会话键到会话 ID 的映射在磁盘上保持一致
-   在话题中使用 `/new` 会将绑定行重写以指向新的会话 ID，这样下一条消息就会保留在新会话上
-   在 `extra.dm_topics` 中声明的话题**永远不会被自动重命名**——即使启用了多会话模式，运营者选择的名称也会被保留
-   设置 `extra.disable_topic_auto_rename: true` 可为聊天中的**所有**话题（包括通过线程模式创建的临时话题）关闭自动重命名
-   在一个启用了论坛的私聊中，置顶顶部的 "通用" 话题被视为根大厅，无论 Telegram 的消息是携带 `message_thread_id=1` 还是没有 thread_id
-   根大厅提醒被限制为每聊天每 30 秒一条消息——如果用户忘记话题模式已开启并在根私聊中输入了十个提示词，不会收到十条回复
-   BotFather 设置截图被限制为每聊天每 5 分钟发送一次——在线程设置仍被禁用时反复尝试 `/topic` 不会重新上传相同的图片
-   在话题内启动的 `/background <prompt>` 会将结果返回到同一个话题；后台会话不会触发其所属话题的自动重命名
-   `/topic` 本身受机器人用户授权检查限制——未授权的私聊会收到拒绝信息，而不是激活

### 禁用多会话模式

在根私聊中发送 `/topic off`。Hermes 会将该行设为关闭，清除该聊天的 `(thread_id → session_id)` 绑定，根私聊将恢复为普通的 Hermes 聊天。Telegram 中的现有话题不会被删除——它们只是不再作为独立会话被网关管理。稍后重新运行 `/topic` 可以重新开启。

如果你需要手动清理（例如，跨多个聊天的批量重置），可以直接删除这些行：

```bash
sqlite3 ~/.hermes/state.db \
  "UPDATE telegram_dm_topic_mode SET enabled = 0 WHERE chat_id = '<your_chat_id>'; \
   DELETE FROM telegram_dm_topic_bindings WHERE chat_id = '<your_chat_id>';"
```

### 降级 Hermes

如果你降级到不支持 `/topic` 的 Hermes 版本，该功能将停止工作——`telegram_dm_topic_mode` 和 `telegram_dm_topic_bindings` 表会保留在 `state.db` 中，但会被旧代码忽略。私聊将恢复为原生的按线程隔离（每个 `message_thread_id` 仍然通过 `build_session_key` 获得自己的会话），因此你现有的 Telegram 话题将继续作为并行会话工作。根私聊将不再是大厅——那里的消息会像以前一样进入智能体。重新升级会精确地在之前的位置重新激活多会话模式。

## 群组论坛主题技能绑定

启用了**主题模式**的超级群组（也称为"论坛主题"）已经实现了每个主题的会话隔离——每个 `thread_id` 映射到独立的对话。但你可能希望在特定群组主题收到消息时**自动加载技能**，就像私聊主题技能绑定那样工作。

### 用例

一个拥有针对不同工作流的论坛主题的团队超级群组：

- **工程**主题 → 自动加载 `software-development` 技能
- **研究**主题 → 自动加载 `arxiv` 技能
- **通用**主题 → 不加载技能，通用助手

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
          # 无技能 — 通用助手
```

**字段说明：**

| 字段 | 必填 | 描述 |
|-------|----------|-------------|
| `chat_id` | 是 | 超级群组的数字 ID（以 `-100` 开头的负数） |
| `name` | 否 | 主题的可读标签（仅供参考） |
| `thread_id` | 是 | Telegram 论坛主题 ID — 可在 `t.me/c/<group_id>/<thread_id>` 链接中看到 |
| `skill` | 否 | 在该主题新会话中自动加载的技能 |

### 工作原理

1. 当消息到达已映射的群组主题时，Hermes 会在 `group_topics` 配置中查找 `chat_id` 和 `thread_id`
2. 如果匹配的条目包含 `skill` 字段，则该技能会为会话自动加载——与私聊主题技能绑定完全相同
3. 没有 `skill` 键的主题仅获得会话隔离（现有行为，未改变）
4. 未映射的 `thread_id` 值或 `chat_id` 值会被静默忽略——不报错，也不加载技能

### 与私聊主题的区别

| | 私聊主题 | 群组主题 |
|---|---|---|
| 配置键 | `extra.dm_topics` | `extra.group_topics` |
| 主题创建 | 如果缺少 `thread_id`，Hermes 会通过 API 创建主题 | 管理员在 Telegram 界面中创建主题 |
| `thread_id` | 创建后自动填充 | 必须手动设置 |
| `icon_color` / `icon_custom_emoji_id` | 支持 | 不适用（管理员控制外观） |
| 技能绑定 | ✓ | ✓ |
| 会话隔离 | ✓ | ✓（论坛主题已内置） |

:::tip
要查找主题的 `thread_id`，请在 Telegram 网页版或桌面版中打开该主题并查看 URL：`https://t.me/c/1234567890/5` — 最后一个数字（`5`）就是 `thread_id`。超级群组的 `chat_id` 是群组 ID 前加 `-100`（例如，群组 `1234567890` 变为 `-1001234567890`）。
:::

## 近期 Bot API 功能

- **Bot API 9.4 (2026年2月)：私聊主题** — 机器人可以通过 `createForumTopic` 在一对一私聊中创建论坛主题。Hermes 将此用于两个不同的功能：运营策划的[私聊主题](#private-chat-topics-bot-api-94)（配置驱动，固定主题列表）和用户驱动的[多会话私聊模式](#multi-session-dm-mode-topic)（通过 `/topic` 激活，用户创建的主题数量不限）。
- **隐私政策：** Telegram 现在要求机器人必须有隐私政策。通过 BotFather 使用 `/setprivacy_policy` 设置，否则 Telegram 可能会自动生成一个占位符。如果你的机器人是面向公众的，这一点尤为重要。
- **Bot API 9.5 (2026年3月)：通过 `sendMessageDraft` 实现原生流式传输。** Hermes 支持 Telegram 的原生流式草稿 API，作为私聊的可选传输方式。默认传输方式仍是传统的 `editMessageText` 路径，因为在某些 Telegram 客户端上，草稿预览可能会明显折叠和重新渲染。

### 流式传输方式 (`gateway.streaming.transport`)

当流式传输启用时（`gateway.streaming.enabled: true`），Hermes 会选择以下四种传输方式之一：

| 值 | 行为 |
|---|---|
| `auto` | 在支持的聊天（目前为 Telegram 私聊）上使用原生草稿流式传输；否则使用基于编辑的传统路径。如果草稿帧失败，会优雅地回退。 |
| `draft` | 强制使用原生草稿。如果聊天不支持草稿（例如群组/主题），则记录降级并回退到编辑方式。 |
| `edit` (默认) | 针对每种聊天类型的传统渐进式 `editMessageText` 轮询。 |
| `off` | 完全禁用流式传输（仅最终回复，无渐进更新）。 |

在 `~/.hermes/config.yaml` 中：

```yaml
gateway:
  streaming:
    enabled: true
    transport: edit    # edit | auto | draft | off
```

**使用 `edit`（默认）在私聊中的表现** — 网关发送一条普通预览消息，并通过 `editMessageText` 渐进更新，避免 Telegram 的草稿预览折叠/回滚效应。

**使用 `auto` 或 `draft` 在私聊中的表现** — Telegram 会显示一个逐 token 更新的动画草稿预览。当回复完成时，它会作为普通消息发送，草稿预览在客户端自然清除。草稿没有消息 ID，因此最终答案会保留在你的聊天记录中。

**群组、超级群组、论坛主题呢？** Telegram 将 `sendMessageDraft` 限制为私聊。网关会透明地为其他所有情况回退到基于编辑的路径——用户体验与之前相同。

**如果草稿帧失败怎么办？** 任何失败（瞬时网络错误、服务端拒绝、较旧的 python-telegram-bot 安装）都会使该响应在剩余流式传输中回退到基于编辑的路径。下一次响应会获得一次新的尝试。

## 渲染：表格与链接预览

Telegram 的 MarkdownV2 没有原生表格语法——管道表格如果直接传递会渲染为反斜杠转义的乱码。Hermes 会自动规范化 markdown 表格：

- **小型表格**会被**展平为行组项目符号**——每一列标题下，每行变为一个可读的项目符号列表。适用于 2-4 列和短单元格的情况。
- **较大型或较宽的表格**则会**退回到带对齐列的受保护代码块**，以防止结构崩溃。会添加一行提示，以便智能体知道在 Telegram 上更倾向于使用散文后续内容而非更多表格。

无需任何配置——适配器会根据每条消息选择合适的回退方案。如果您想要旧版的“始终使用代码块”行为，可以在 `config.yaml` 中禁用表格规范化（设置 `telegram.pretty_tables: false`，默认为 `true`）。

**链接预览。** Telegram 会为机器人消息中的 URL 自动生成链接预览。如果您想抑制这些预览（例如长 `/tools` 输出、提及多个链接的智能体回复等）：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        disable_link_previews: true
```

启用后，Hermes 会将 Telegram 的 `LinkPreviewOptions(is_disabled=True)` 附加到每条发出的消息上，并在较旧的 `python-telegram-bot` 版本上回退到旧版的 `disable_web_page_preview` 参数。

## 群组白名单

Telegram 群组和论坛聊天有两个正交的配置门控：

- **发送者用户 ID** (`group_allow_from` / `TELEGRAM_GROUP_ALLOWED_USERS`) —— 仅应用于群组/论坛消息的、按发送者范围划分的白名单。当您希望特定用户能在群组中调用机器人而不必将他们添加到 `TELEGRAM_ALLOWED_USERS`（这也会授予他们私信访问权限）时，请使用此选项。
- **聊天 ID** (`group_allowed_chats` / `TELEGRAM_GROUP_ALLOWED_CHATS`) —— 按聊天范围划分的白名单。这些群组/论坛中的任何成员都可以与机器人交互。适用于团队/支持机器人，其中群组成员身份本身就是访问信号。

```yaml
gateway:
  platforms:
    telegram:
      extra:
        # 全局访问（私信 + 群组）。此处的用户始终可以调用机器人。
        allow_from:
          - "123456789"
        # 仅在群组/论坛中允许的发送者 ID。不授予私信访问权限。
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

- `TELEGRAM_ALLOWED_USERS` 涵盖所有聊天类型（私信、群组、论坛）。
- `TELEGRAM_GROUP_ALLOWED_USERS` 仅授权所列发送者在群组/论坛中操作。除非他们也被列在 `TELEGRAM_ALLOWED_USERS` 中，否则仍然无法私信机器人。
- `TELEGRAM_GROUP_ALLOWED_CHATS` 中的聊天会授权该聊天中的每位成员，无论发送者是谁。
- 在这些变量中使用 `*` 可允许任何发送者/聊天。
- 此配置叠加在现有的提及/模式触发器以及 `group_topics` + `ignored_threads` 之上。

### 从 PR #17686 之前的迁移

在此拆分之前，`TELEGRAM_GROUP_ALLOWED_USERS` 是唯一的控制项，用户将**聊天 ID** 放入其中。为了向后兼容，`TELEGRAM_GROUP_ALLOWED_USERS` 中符合聊天 ID 格式的值（以 `-` 开头）仍被识别为聊天 ID，并会记录一次弃用警告。迁移方法：

```bash
# 旧版（仍然有效，但已弃用）
TELEGRAM_GROUP_ALLOWED_USERS="-1001234567890"

# 新版
TELEGRAM_GROUP_ALLOWED_CHATS="-1001234567890"
```

### 访客 @提及绕过 (`guest_mode`)

在典型设置中，`group_allowed_chats` 是一个硬性门控：来自列表外群组的消息会被静默丢弃，即使成员明确 @提及了机器人。对于支持/团队机器人来说，这是正确的默认行为。

对于更随意的设置——例如朋友群聊，您希望机器人**大多保持沉默**但**偶尔可通过显式 ping 调用**——请启用 `guest_mode`：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        group_allowed_chats:
          - "-1001234567890"   # 您的主要白名单群组
        guest_mode: true       # 非白名单群组：仅在 @提及时允许
```

环境变量等效：

```bash
TELEGRAM_GUEST_MODE=true
```

默认值：`false`。

当 `guest_mode: true` 时，来自非白名单群组的消息**仅**在明确 @提及了机器人时才会被处理。每次交互都需要提及——访客交互没有会话粘性，因此机器人永远不会自动介入未被 ping 进入的朋友群组线程。

私信和白名单群组的行为与之前完全相同。

# 斜杠命令访问控制

默认情况下，每个被允许的用户都可以执行所有斜杠命令。要将您的允许列表拆分为**管理员**（拥有完整的斜杠命令访问权限）和**普通用户**（仅可使用您明确启用的命令），请将 `allow_admin_from` 和 `user_allowed_commands` 添加到平台的 `extra` 块中：

```yaml
gateway:
  platforms:
    telegram:
      extra:
        # 现有的允许列表（保持不变）
        allow_from:
          - "123456789"     # 管理员
          - "555555555"     # 普通用户
          - "777777777"     # 普通用户

        # 新增 — 管理员可获得所有斜杠命令权限（内置 + 插件）
        allow_admin_from:
          - "123456789"

        # 新增 — 非管理员允许用户仅可运行这些斜杠命令。
        # /help 和 /whoami 始终可用，以便用户查看其访问权限。
        user_allowed_commands:
          - status
          - model
          - history

        # 可选：为群组设置独立的管理员/命令列表
        group_allow_admin_from:
          - "123456789"
        group_user_allowed_commands:
          - status
```

**行为说明：**

- 对于某个作用域（私信或群组），列在 `allow_admin_from` 中的用户可以运行**所有**注册的斜杠命令——包括内置命令和通过实时注册表注册的插件命令。
- 列在 `allow_from` 中但**未**在 `allow_admin_from` 中的用户，只能运行 `user_allowed_commands` 中列出的命令，以及始终允许的基础命令：`/help` 和 `/whoami`。
- 普通聊天（非斜杠消息）不受影响。非管理员用户仍可正常与智能体对话，只是无法触发任意命令。
- **向后兼容：** 如果某个作用域未设置 `allow_admin_from`，则该作用域的斜杠命令门控将被禁用。现有安装无需任何更改即可继续正常工作。
- 私信的管理员状态并不等同于群组的管理员状态。每个作用域都有自己的管理员列表。
- 如果仅设置了 `group_allow_admin_from`，私信作用域将保持不受限制（向后兼容）模式。

使用 `/whoami` 可以查看当前作用域、您的权限层级（管理员/用户/不受限制）以及您可以运行哪些斜杠命令。

## 交互式模型选择器

当您在 Telegram 聊天中发送不带参数的 `/model` 时，Hermes 会显示一个交互式内联键盘，用于切换模型：

1.  **提供商选择** — 按钮显示每个可用的提供商及其模型数量（例如，"OpenAI (15)"，"✓ Anthropic (12)" 表示当前提供商）。
2.  **模型选择** — 分页的模型列表，带有**上一页**/**下一页**导航，一个**返回**按钮用于返回提供商列表，以及**取消**按钮。

当前模型和提供商显示在顶部。所有导航都通过原地编辑同一条消息完成（不会使聊天变得杂乱）。

:::tip
如果您知道确切的模型名称，直接输入 `/model <name>` 可以跳过选择器。您也可以输入 `/model <name> --global` 来在所有会话中持久保留此更改。
:::

## DNS-over-HTTPS 回退IP

在某些受限网络中，`api.telegram.org` 可能解析到一个无法访问的IP地址。Telegram适配器包含一个**回退IP**机制，它会透明地尝试使用替代IP进行连接，同时保留正确的TLS主机名和SNI。

### 工作原理

1.  如果设置了 `TELEGRAM_FALLBACK_IPS`，则直接使用这些IP。
2.  否则，适配器会自动通过DNS-over-HTTPS (DoH) 查询 **Google DNS** 和 **Cloudflare DNS**，以发现 `api.telegram.org` 的替代IP。
3.  DoH返回的与系统DNS结果不同的IP将被用作回退。
4.  如果DoH也被阻止，则使用硬编码的种子IP (`149.154.167.220`) 作为最后手段。
5.  一旦某个回退IP连接成功，它就会变得“粘滞”——后续请求将直接使用它，不再首先重试主路径。

### 配置

```bash
# 显式设置回退IP（逗号分隔）
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
通常你不需要手动配置这个。通过DoH的自动发现机制可以处理大多数受限网络场景。只有当你网络中的DoH也被阻止时，才需要设置 `TELEGRAM_FALLBACK_IPS` 环境变量。
:::

## 代理支持

如果你的网络需要通过HTTP代理才能访问互联网（这在企业环境中很常见），Telegram适配器会自动读取标准的代理环境变量，并将所有连接通过代理路由出去。

### 支持的变量

适配器会按顺序检查以下环境变量，使用第一个被设置的：

1.  `HTTPS_PROXY`
2.  `HTTP_PROXY`
3.  `ALL_PROXY`
4.  `https_proxy` / `http_proxy` / `all_proxy` (小写变体)

### 配置

在启动网关之前，在你的环境中设置代理：

```bash
export HTTPS_PROXY=http://proxy.example.com:8080
hermes gateway
```

或者将其添加到 `~/.hermes/.env`：

```bash
HTTPS_PROXY=http://proxy.example.com:8080
```

代理会应用于主要传输层和所有回退IP传输层。无需额外的Hermes配置——如果环境变量已设置，它将自动被使用。

:::note
这涵盖了Hermes用于Telegram连接的自定义回退传输层。在其他地方使用的标准 `httpx` 客户端本身已经原生支持代理环境变量。
:::

## 消息表情反应

机器人可以向消息添加表情符号作为视觉处理反馈：

- 当机器人开始处理你的消息时：👀
- 当响应成功送达时：✅
- 如果在处理过程中发生错误：❌

表情反应**默认是禁用的**。在 `config.yaml` 中启用它们：

```yaml
telegram:
  reactions: true
```

或者通过环境变量：

```bash
TELEGRAM_REACTIONS=true
```

:::note
与Discord（表情反应是累加的）不同，Telegram的Bot API会在单次调用中替换所有机器人的表情反应。从 👀 到 ✅/❌ 的转变是原子性的——你不会同时看到两者。
:::

:::tip
如果机器人没有在群组中添加表情反应的权限，表情反应调用会静默失败，消息处理将正常继续。
:::

## 每频道提示词

为特定的Telegram群组或论坛话题分配临时系统提示词。该提示词在每次对话轮次时动态注入——永远不会被保存到对话历史中——因此更改会立即生效。

```yaml
telegram:
  channel_prompts:
    "-1001234567890": |
      你是一个研究助手。专注于学术来源、
      引用和简洁的综合。
    "42":  |
      此话题用于创意写作反馈。请保持热情
      和建设性。
```

键是聊天ID（群组/超级群组）或论坛话题ID。对于论坛群组，话题级提示词会覆盖群组级提示词：

- 在群组 `-1001234567890` 中的话题 `42` 内发送消息 → 使用话题 `42` 的提示词
- 在话题 `99`（无显式条目）中发送消息 → 回退到群组 `-1001234567890` 的提示词
- 在没有条目的群组中发送消息 → 不应用任何频道提示词

数字型YAML键会自动规范化为字符串。

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 机器人完全没有响应 | 验证 `TELEGRAM_BOT_TOKEN` 是否正确。检查 `hermes gateway` 日志中的错误。 |
| 机器人响应“未授权” | 你的用户ID不在 `TELEGRAM_ALLOWED_USERS` 中。请使用 @userinfobot 进行双重检查。 |
| 机器人忽略群组消息 | 隐私模式可能已开启。禁用它（步骤3）或将机器人设为群组管理员。**更改隐私设置后，请记住移除并重新添加机器人。** |
| 语音消息未被转录 | 验证语音转文字功能可用：安装 `faster-whisper` 用于本地转录，或在 `~/.hermes/.env` 中设置 `GROQ_API_KEY` / `VOICE_TOOLS_OPENAI_KEY`。 |
| 语音回复是文件而非语音气泡 | 安装 `ffmpeg`（Edge TTS Opus转换所需）。 |
| 机器人令牌被撤销/无效 | 在BotFather中使用 `/revoke` 然后 `/newbot` 或 `/token` 生成新令牌。更新你的 `.env` 文件。 |
| Webhook未收到更新 | 验证 `TELEGRAM_WEBHOOK_URL` 是否可公开访问（使用 `curl` 测试）。确保你的平台/反向代理将来自该URL端口的入站HTTPS流量路由到 `TELEGRAM_WEBHOOK_PORT` 配置的本地监听端口（它们不需要是相同的端口号）。确保SSL/TLS处于活动状态——Telegram仅向HTTPS URL发送数据。检查防火墙规则。 |

## 执行审批

当智能体尝试运行一个可能危险的命令时，它会在聊天中询问你的批准：

> ⚠️ 此命令可能具有危险性（递归删除）。回复 "yes" 批准。

回复 "yes"/"y" 批准或 "no"/"n" 拒绝。

## 交互式提示（澄清）

当智能体调用 `clarify` 工具时——用于询问你偏好哪种方法、获取任务后反馈或在非平凡决策前进行确认——Telegram会使用**内联键盘按钮**渲染问题：

> ❓ 我应该为仪表板使用哪个框架？
>
> [1. Next.js] [2. Remix] [3. Astro]
> [✏️ 其他（输入答案）]

点击按钮回答，或点击 **其他** 输入自由格式的回复（你发送的下一条消息将成为答案）。开放式的 `clarify` 调用（无预设选项）会跳过按钮，直接捕获你的下一条消息。

在 `~/.hermes/config.yaml` 中通过 `agent.clarify_timeout` 配置响应超时（默认 `600` 秒）。如果你没有在超时时间内响应，智能体会使用哨兵消息解除阻塞并进行适应，而不是挂起。

## 推送通知音量

Telegram会在机器人发送的每条消息上触发推送通知。对于发出工具进度气泡、流式更新和状态回调的长时间智能体轮次，这很快会变得很吵。Telegram适配器有两种通知模式：

| 模式 | 行为 |
|------|------|
| `important`（默认） | 仅**最终响应**、**审批提示**和**斜杠命令确认**会响铃。工具进度、流式数据块和状态消息会以 `disable_notification=true` 发送。 |
| `all` | 每条发出的消息都会触发推送通知。旧版行为；如果你确实想了解每个工具调用，请选择加入。 |

在 `~/.hermes/config.yaml` 中配置：

```yaml
display:
  platforms:
    telegram:
      notifications: important   # 或 "all"
```

环境变量覆盖（便于快速A/B测试）：

```bash
HERMES_TELEGRAM_NOTIFICATIONS=all
```

未知值会记录警告并回退到 `important`。
## 安全性

:::warning
请务必设置 `TELEGRAM_ALLOWED_USERS` 以限制谁可以与你的机器人互动。如果不设置，出于安全考虑，网关默认会拒绝所有用户。
:::

切勿公开分享你的机器人令牌。如果泄露，请立即通过BotFather的 `/revoke` 命令撤销它。

更多详情，请参阅[安全文档](/user-guide/security)。你也可以使用[私信配对](/user-guide/messaging#dm-pairing-alternative-to-allowlists)作为更动态的用户授权方法。