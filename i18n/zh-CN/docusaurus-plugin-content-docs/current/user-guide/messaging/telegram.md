---
sidebar_position: 1
title: "Telegram"
description: "将 Hermes Agent 设置为 Telegram 机器人"
---

# Telegram 设置

Hermes Agent 与 Telegram 集成，作为一个功能齐全的对话式机器人。连接后，您可以从任何设备与代理聊天，发送语音备忘录并自动转录，接收计划任务的结果，并在群组聊天中使用代理。该集成基于 [python-telegram-bot](https://python-telegram-bot.org/)，并支持文本、语音、图像和文件附件。

## 第 1 步：通过 BotFather 创建机器人

每个 Telegram 机器人都需要一个由 [@BotFather](https://t.me/BotFather) 颁发的 API 令牌，这是 Telegram 的官方机器人管理工具。

1. 打开 Telegram 并搜索 **@BotFather**，或访问 [t.me/BotFather](https://t.me/BotFather)
2. 发送 `/newbot`
3. 选择一个**显示名称**（例如，“Hermes Agent”）——这可以是任何内容
4. 选择一个**用户名**——必须唯一且以 `bot` 结尾（例如，`my_hermes_bot`）
5. BotFather 会回复您的**API 令牌**。它看起来像这样：

```
123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
```

:::warning
请妥善保管您的机器人令牌。拥有此令牌的人可以控制您的机器人。如果泄露，请立即通过 BotFather 中的 `/revoke` 命令撤销。
:::

## 第 2 步：自定义您的机器人（可选）

这些 BotFather 命令可以改善用户体验。向 @BotFather 发送消息并使用：

| 命令 | 用途 |
|---------|---------|
| `/setdescription` | 用户在开始聊天前看到的“此机器人能做什么？”的文本 |
| `/setabouttext` | 机器人个人资料页面上的简短文本 |
| `/setuserpic` | 为您的机器人上传头像 |
| `/setcommands` | 定义命令菜单（聊天中的 `/` 按钮） |
| `/setprivacy` | 控制机器人是否查看所有群组消息（参见第 3 步） |

:::tip
对于 `/setcommands`，一个有用的起始命令集：

```
help - 显示帮助信息
new - 开始新对话
sethome - 将此聊天设为家庭频道
```
:::

## 第 3 步：隐私模式（对群组至关重要）

Telegram 机器人具有**隐私模式**，默认**启用**。这是使用机器人在群组中最常见的混淆来源。

**启用隐私模式时**，您的机器人只能看到：
- 以 `/` 命令开头的消息
- 直接回复机器人自身消息的消息
- 服务消息（成员加入/离开、置顶消息等）
- 机器人是管理员的频道中的消息

**关闭隐私模式时**，机器人会接收群组中的所有消息。

### 如何禁用隐私模式

1. 向 **@BotFather** 发送消息
2. 发送 `/mybots`
3. 选择您的机器人
4. 进入 **机器人设置 → 群组隐私 → 关闭**

:::warning
**更改隐私设置后，您必须将机器人从任何群组中移除并重新添加**。当机器人加入群组时，Telegram 会缓存隐私状态，并且直到机器人被移除并重新添加之前都不会更新。
:::

:::tip
禁用隐私模式的替代方案：将机器人提升为**群组管理员**。管理员机器人始终会收到所有消息，无论隐私设置如何，这可以避免需要切换全局隐私模式。
:::

## 第 4 步：查找您的用户 ID

Hermes Agent 使用数字 Telegram 用户 ID 来控制访问权限。您的用户 ID **不是**您的用户名——它是一个像 `123456789` 这样的数字。

**方法 1（推荐）：** 向 [@userinfobot](https://t.me/userinfobot) 发送消息——它会立即回复您的用户 ID。

**方法 2：** 向 [@get_id_bot](https://t.me/get_id_bot) 发送消息——另一个可靠选项。

保存这个数字；您将在下一步中需要它。

## 第 5 步：配置 Hermes

### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

在提示时选择 **Telegram**。向导会要求您提供机器人令牌和允许的用户 ID，然后为您写入配置。

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

机器人应在几秒钟内上线。向其发送 Telegram 消息以验证。

## 从 Docker 支持的终端发送生成的文件

如果您的终端后端是 `docker`，请注意 Telegram 附件是由**网关进程**发送的，而不是从容器内部发送的。这意味着最终的 `MEDIA:/...` 路径必须在网关运行的宿主机上可读。

常见错误：

- 代理在 Docker 内部写入文件到 `/workspace/report.txt`
- 模型输出 `MEDIA:/workspace/report.txt`
- Telegram 交付失败，因为 `/workspace/report.txt` 只存在于容器内部，而不是宿主机上

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

如果您已经有 `docker_volumes:` 部分，请将新的挂载添加到同一列表中。YAML 重复键会静默覆盖较早的键。

## Webhook 模式

默认情况下，Hermes 通过**长轮询**连接到 Telegram——网关向 Telegram 服务器发出出站请求以获取新更新。这对于本地和始终在线的部署效果很好。

对于**云部署**（Fly.io、Railway、Render 等），**Webhook 模式**更具成本效益。这些平台可以通过入站 HTTP 流量自动唤醒挂起的机器，但不能通过出站连接唤醒。由于轮询是出站的，轮询机器人永远无法休眠。Webhook 模式翻转了方向——Telegram 将更新推送到您的机器人的 HTTPS URL，从而实现睡眠时的空闲部署。

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
# TELEGRAM_WEBHOOK_PORT=8443        # 可选，默认 8443
# TELEGRAM_WEBHOOK_SECRET=mysecret  # 可选，建议启用
```

| 变量 | 必需 | 描述 |
|----------|----------|-------------|
| `TELEGRAM_WEBHOOK_URL` | 是 | Telegram 将向其发送更新的公共 HTTPS URL。URL 路径会自动提取（例如，上面的示例中为 `/telegram`）。 |
| `TELEGRAM_WEBHOOK_PORT` | 否 | Webhook 服务器监听的本地端口（默认：`8443`）。 |
| `TELEGRAM_WEBHOOK_SECRET` | 否 | 用于验证更新确实来自 Telegram 的秘密令牌。**强烈建议**在生产环境中使用。 |

当设置了 `TELEGRAM_WEBHOOK_URL` 时，网关会启动 HTTP webhook 服务器而不是轮询。未设置时使用轮询模式——与以前版本的行为没有变化。

### 云部署示例（Fly.io）

1. 将环境变量添加到您的 Fly.io 应用密钥中：

```bash
fly secrets set TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
fly secrets set TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

2. 在 `fly.toml` 中公开 webhook 端口：

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

如果 Telegram API 被阻止或您需要通过代理路由流量，请设置 Telegram 特定的代理 URL。这会优先于通用的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量。

**选项 1：config.yaml（推荐）**

```yaml
telegram:
  proxy_url: "socks5://127.0.0.1:1080"
```

**选项 2：环境变量**

```bash
TELEGRAM_PROXY=socks5://127.0.0.1:1080
```

支持的方案：`http://`、`https://`、`socks5://`。

代理适用于主要的 Telegram 连接和备用 IP 传输。如果未设置 Telegram 特定的代理，网关会回退到 `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`（或 macOS 系统代理自动检测）。

## 家庭频道

在任何 Telegram 聊天（私信或群组）中使用 `/sethome` 命令将其指定为**家庭频道**。计划任务（cron 作业）会将结果发送到该频道。

您也可以在 `~/.hermes/.env` 中手动设置：

```bash
TELEGRAM_HOME_CHANNEL=-1001234567890
TELEGRAM_HOME_CHANNEL_NAME="我的笔记"
```

:::tip
群组聊天 ID 是负数（例如，`-1001234567890`）。您的个人私信聊天 ID 与您的用户 ID 相同。
:::

## 语音消息

### 传入语音（语音转文本）

您在 Telegram 上发送的语音消息会自动由 Hermes 配置的 STT 提供商转录，并作为文本注入对话中。

- `local` 使用运行 Hermes 的机器上的 `faster-whisper`——无需 API 密钥
- `groq` 使用 Groq Whisper 并需要 `GROQ_API_KEY`
- `openai` 使用 OpenAI Whisper 并需要 `VOICE_TOOLS_OPENAI_KEY`

### 传出语音（文本转语音）

当代理通过 TTS 生成音频时，它会作为原生的 Telegram **语音气泡**发送——圆形、可内联播放的类型。

- **OpenAI 和 ElevenLabs** 原生生成 Opus——无需额外设置
- **Edge TTS**（默认免费提供商）输出 MP3 并需要 **ffmpeg** 转换为 Opus：

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

如果没有 ffmpeg，Edge TTS 音频将作为常规音频文件发送（仍然可播放，但使用矩形播放器而不是语音气泡）。

在 `config.yaml` 的 `tts.provider` 键下配置 TTS 提供商。

## 群组聊天使用

Hermes Agent 在 Telegram 群组聊天中可以工作，但需要考虑以下几点：

- **隐私模式**决定了机器人可以看到哪些消息（参见[第 3 步](#step-3-privacy-mode-critical-for-groups)）
- `TELEGRAM_ALLOWED_USERS` 仍然适用——即使在群组中，也只有授权用户可以触发机器人
- 您可以使用 `telegram.require_mention: true` 防止机器人响应普通的群组闲聊
- 当 `telegram.require_mention: true` 时，群组消息会被接受，如果它们是：
  - 斜杠命令
  - 回复机器人的一条消息
  - `@botusername` 提及
  - 匹配您在 `telegram.mention_patterns` 中配置的唤醒词的正则表达式
- 使用 `telegram.ignored_threads` 可以在特定 Telegram 论坛主题中保持 Hermes 静音，即使群组通常允许自由响应或提及触发的回复
- 如果 `telegram.require_mention` 未设置或为 false，Hermes 保持之前的开放群组行为，并对它可以看到的普通群组消息做出响应

### 示例群组触发配置

将以下内容添加到 `~/.hermes/config.yaml`：

```yaml
telegram:
  require_mention: true
  mention_patterns:
    - "^\\s*chompy\\b"
  ignored_threads:
    - 31
    - "42"
```

此示例允许所有通常的直接触发，以及以 `chompy` 开头的消息，即使它们不使用 `@mention`。
在 Telegram 主题 `31` 和 `42` 中的消息将被忽略，在执行提及和自由响应检查之前。

### 关于 `mention_patterns` 的说明

- 模式使用 Python 正则表达式
- 匹配不区分大小写
- 模式同时应用于文本消息和媒体标题
- 无效的正则表达式模式会被忽略，并在网关日志中显示警告，而不会导致机器人崩溃
- 如果您希望模式仅匹配消息开头，请使用 `^` 锚定它

## 私人聊天主题（Bot API 9.4）

Telegram Bot API 9.4（2026 年 2 月）引入了**私人聊天主题**——机器人可以直接在 1 对 1 私信聊天中创建论坛风格的主题线程，无需超级群组。这允许您在现有的私信中与 Hermes 运行多个隔离的工作区。

### 用例

如果您处理多个长期项目，主题可以保持其上下文分离：

- **“网站”主题**——处理您的生产网络服务
- **“研究”主题**——文献综述和论文探索
- **“通用”主题**——杂项任务和快速问题

每个主题都有自己的对话会话、历史记录和上下文窗口——完全与其他主题隔离。

### 配置

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
          skill: arxiv              # 在此主题中自动加载技能
```

**字段：**

| 字段 | 必需 | 描述 |
|-------|----------|-------------|
| `name` | 是 | 主题的显示名称 |
| `icon_color` | 否 | Telegram 图标颜色代码（整数） |
| `icon_custom_emoji_id` | 否 | 主题图标的自定义表情符号 ID |
| `skill` | 否 | 在此主题的新会话中自动加载的技能 |
| `thread_id` | 否 | 主题创建后自动填充——不要手动设置 |

### 工作原理

1. 在网关启动时，Hermes 会为尚未有 `thread_id` 的每个主题调用 `createForumTopic`
2. `thread_id` 会自动保存回 `config.yaml`——后续重启会跳过 API 调用
3. 每个主题映射到一个隔离的会话密钥：`agent:main:telegram:dm:{chat_id}:{thread_id}`
4. 每个主题中的消息都有自己的对话历史、内存刷新和上下文窗口

### 技能绑定

具有 `skill` 字段的主题会在主题的新会话开始时自动加载该技能。这与在对话开始时输入 `/skill-name` 完全相同——技能内容被注入第一条消息，后续消息会在对话历史中看到它。

例如，具有 `skill: arxiv` 的主题每次其会话重置（由于空闲超时、每日重置或手动 `/reset`）时都会预加载 arXiv 技能。

:::tip
在配置之外创建的主题（例如，通过手动调用 Telegram API）会在收到 `forum_topic_created` 服务消息时自动发现。您也可以在网关运行时向配置中添加主题——它们会在下次缓存未命中时被拾取。
:::

## 群组论坛主题技能绑定

启用了**主题模式**的超群组（也称为“论坛主题”）已经按主题获得会话隔离——每个 `thread_id` 都映射到其自己的对话。但您可能希望在特定群组主题中**自动加载技能**，就像 DM 主题技能绑定一样。

### 用例

具有不同工作流主题的团队超级群组：

- **工程**主题 → 自动加载 `software-development` 技能
- **研究**主题 → 自动加载 `arxiv` 技能
- **通用**主题 → 无技能，通用助手

### 配置

在 `~/.hermes/config.yaml` 的 `platforms.telegram.extra.group_topics` 下添