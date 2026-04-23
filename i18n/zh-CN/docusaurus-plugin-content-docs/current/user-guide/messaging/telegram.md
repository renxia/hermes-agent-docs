---
sidebar_position: 1
title: "Telegram"
description: "将 Hermes 智能体设置为 Telegram 机器人"
---

# Telegram 设置

Hermes 智能体可以集成到 Telegram 中，成为一个功能完整的对话机器人。连接后，您可以从任何设备与智能体聊天，发送语音备忘录并自动转录，接收定时任务结果，并在群聊中使用智能体。该集成基于 [python-telegram-bot](https://python-telegram-bot.org/)，支持文本、语音、图像和文件附件。

## 步骤 1：通过 BotFather 创建机器人

每个 Telegram 机器人都需要一个由 [@BotFather](https://t.me/BotFather)（Telegram 官方机器人管理工具）颁发的 API 令牌。

1. 打开 Telegram 并搜索 **@BotFather**，或访问 [t.me/BotFather](https://t.me/BotFather)
2. 发送 `/newbot`
3. 选择一个**显示名称**（例如：“Hermes 智能体”）——可以是任意名称
4. 选择一个**用户名**——必须是唯一的，并以 `bot` 结尾（例如：`my_hermes_bot`）
5. BotFather 会回复您的 **API 令牌**。它看起来像这样：

```
123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
```

:::warning
请保管好您的机器人令牌。任何人拥有此令牌都可以控制您的机器人。如果泄露，请立即通过 BotFather 中的 `/revoke` 命令撤销。
:::

## 步骤 2：自定义您的机器人（可选）

这些 BotFather 命令可以改善用户体验。向 @BotFather 发送消息并使用：

| 命令 | 用途 |
|---------|---------|
| `/setdescription` | 用户开始聊天前显示的“这个机器人能做什么？”文本 |
| `/setabouttext` | 机器人个人资料页面上的简短文本 |
| `/setuserpic` | 为您的机器人上传头像 |
| `/setcommands` | 定义命令菜单（聊天中的 `/` 按钮） |
| `/setprivacy` | 控制机器人是否能看到所有群组消息（参见步骤 3） |

:::tip
对于 `/setcommands`，一个有用的起始命令集：

```
help - 显示帮助信息
new - 开始新的对话
sethome - 将此聊天设置为主频道
```
:::

## 步骤 3：隐私模式（群组关键设置）

Telegram 机器人有一个**隐私模式**，**默认启用**。这是在群组中使用机器人时最常见的困惑来源。

**隐私模式开启时**，您的机器人只能看到：
- 以 `/` 命令开头的消息
- 直接回复机器人自己消息的消息
- 服务消息（成员加入/离开、置顶消息等）
- 机器人是管理员的频道中的消息

**隐私模式关闭时**，机器人会收到群组中的每条消息。

### 如何关闭隐私模式

1. 向 **@BotFather** 发送消息
2. 发送 `/mybots`
3. 选择您的机器人
4. 进入 **机器人设置 → 群组隐私 → 关闭**

:::warning
**更改隐私设置后，您必须从任何群组中移除并重新添加机器人。** Telegram 在机器人加入群组时会缓存隐私状态，直到机器人被移除并重新添加后才会更新。
:::

:::tip
关闭隐私模式的替代方案：将机器人提升为**群组管理员**。管理员机器人无论隐私设置如何，都会收到所有消息，这样可以避免切换全局隐私模式。
:::

## 步骤 4：查找您的用户 ID

Hermes 智能体使用数字 Telegram 用户 ID 来控制访问。您的用户 ID **不是**您的用户名——它是一个像 `123456789` 这样的数字。

**方法 1（推荐）：** 向 [@userinfobot](https://t.me/userinfobot) 发送消息——它会立即回复您的用户 ID。

**方法 2：** 向 [@get_id_bot](https://t.me/get_id_bot) 发送消息——另一个可靠的选择。

保存这个数字；您将在下一步中需要它。

## 步骤 5：配置 Hermes

### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

提示时选择 **Telegram**。向导会询问您的机器人令牌和允许的用户 ID，然后为您写入配置。

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

机器人应在几秒钟内上线。在 Telegram 上向它发送消息以验证。

## 从 Docker 支持的终端发送生成的文件

如果您的终端后端是 `docker`，请注意 Telegram 附件是由**网关进程**发送的，而不是从容器内部发送的。这意味着最终的 `MEDIA:/...` 路径必须在运行网关的主机上可读。

常见陷阱：

- 智能体在 Docker 内部将文件写入 `/workspace/report.txt`
- 模型输出 `MEDIA:/workspace/report.txt`
- Telegram 发送失败，因为 `/workspace/report.txt` 只存在于容器内部，而不在主机上

推荐模式：

```yaml
terminal:
  backend: docker
  docker_volumes:
    - "/home/user/.hermes/cache/documents:/output"
```

然后：

- 在 Docker 内部将文件写入 `/output/...`
- 在 `MEDIA:` 中输出**主机可见**的路径，例如：
  `MEDIA:/home/user/.hermes/cache/documents/report.txt`

如果您已经有 `docker_volumes:` 部分，请将新的挂载添加到同一列表中。YAML 重复键会静默覆盖之前的键。

## Webhook 模式

默认情况下，Hermes 使用**长轮询**连接到 Telegram——网关向 Telegram 的服务器发出出站请求以获取新的更新。这对于本地和始终在线的部署效果很好。

对于**云部署**（Fly.io、Railway、Render 等），**Webhook 模式**更具成本效益。这些平台可以在入站 HTTP 流量时自动唤醒挂起的机器，但不能在出站连接时唤醒。由于轮询是出站的，轮询机器人永远无法休眠。Webhook 模式反转了方向——Telegram 将更新推送到您机器人的 HTTPS URL，从而实现空闲时休眠的部署。

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
# TELEGRAM_WEBHOOK_SECRET=mysecret  # 可选，推荐
```

| 变量 | 必需 | 描述 |
|----------|----------|-------------|
| `TELEGRAM_WEBHOOK_URL` | 是 | Telegram 将发送更新的公共 HTTPS URL。URL 路径是自动提取的（例如，上面示例中的 `/telegram`）。 |
| `TELEGRAM_WEBHOOK_PORT` | 否 | Webhook 服务器监听的本地端口（默认：`8443`）。 |
| `TELEGRAM_WEBHOOK_SECRET` | 否 | 用于验证更新确实来自 Telegram 的密钥。**强烈建议**在生产部署中使用。 |

当设置了 `TELEGRAM_WEBHOOK_URL` 时，网关会启动一个 HTTP Webhook 服务器，而不是轮询。当未设置时，使用轮询模式——与以前版本的行为没有变化。

### 云部署示例（Fly.io）

1. 将环境变量添加到您的 Fly.io 应用机密中：

```bash
fly secrets set TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
fly secrets set TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

2. 在您的 `fly.toml` 中暴露 Webhook 端口：

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

如果 Telegram 的 API 被阻止，或者您需要通过代理路由流量，请设置一个特定于 Telegram 的代理 URL。这优先于通用的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量。

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

代理适用于主 Telegram 连接和回退 IP 传输。如果未设置特定于 Telegram 的代理，网关将回退到 `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`（或 macOS 系统代理自动检测）。

## 主频道

在任何 Telegram 聊天（私信或群组）中使用 `/sethome` 命令将其指定为**主频道**。定时任务（cron 作业）将其结果发送到此频道。

您也可以在 `~/.hermes/.env` 中手动设置：

```bash
TELEGRAM_HOME_CHANNEL=-1001234567890
TELEGRAM_HOME_CHANNEL_NAME="My Notes"
```

:::tip
群组聊天 ID 是负数（例如：`-1001234567890`）。您的个人私信聊天 ID 与您的用户 ID 相同。
:::

## 语音消息

### 传入语音（语音转文本）

您在 Telegram 上发送的语音消息会由 Hermes 配置的 STT 提供程序自动转录，并作为文本注入到对话中。

- `local` 使用运行 Hermes 的机器上的 `faster-whisper`——无需 API 密钥
- `groq` 使用 Groq Whisper，需要 `GROQ_API_KEY`
- `openai` 使用 OpenAI Whisper，需要 `VOICE_TOOLS_OPENAI_KEY`

### 传出语音（文本转语音）

当智能体通过 TTS 生成音频时，它会以原生的 Telegram **语音气泡**形式发送——即圆形、可内联播放的类型。

- **OpenAI 和 ElevenLabs** 原生生成 Opus——无需额外设置
- **Edge TTS**（默认免费提供程序）输出 MP3，需要 **ffmpeg** 转换为 Opus：

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

如果没有 ffmpeg，Edge TTS 音频将作为常规音频文件发送（仍然可播放，但使用矩形播放器而不是语音气泡）。

在您的 `config.yaml` 中的 `tts.provider` 键下配置 TTS 提供程序。

## 群组聊天使用

Hermes 智能体可以在 Telegram 群组聊天中工作，但需要考虑以下几点：

- **隐私模式**决定了机器人能看到哪些消息（参见[步骤 3](#step-3-privacy-mode-critical-for-groups)）
- `TELEGRAM_ALLOWED_USERS` 仍然适用——只有授权用户才能触发机器人，即使在群组中也是如此
- 您可以使用 `telegram.require_mention: true` 防止机器人响应普通的群组闲聊
- 使用 `telegram.require_mention: true` 时，当群组消息是以下情况时会被接受：
  - 斜杠命令
  - 回复机器人消息之一
  - `@botusername` 提及
  - 匹配您在 `telegram.mention_patterns` 中配置的某个正则表达式唤醒词
- 使用 `telegram.ignored_threads` 可以让 Hermes 在特定的 Telegram 论坛主题中保持沉默，即使群组允许自由响应或提及触发的回复
- 如果 `telegram.require_mention` 未设置或为 false，Hermes 将保持之前的开放群组行为，并响应它能看到的普通群组消息

### 群组触发配置示例

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
在 Telegram 主题 `31` 和 `42` 中的消息在提及和自由响应检查运行之前总是被忽略。

### 关于 `mention_patterns` 的说明

- 模式使用 Python 正则表达式
- 匹配不区分大小写
- 模式会针对文本消息和媒体标题进行检查
- 无效的正则表达式模式会被忽略，并在网关日志中发出警告，而不会导致机器人崩溃
- 如果您希望模式仅在消息开头匹配，请使用 `^` 锚定它

## 私人聊天主题（Bot API 9.4）

Telegram Bot API 9.4（2026 年 2 月）引入了**私人聊天主题**——机器人可以直接在 1 对 1 私信聊天中创建类似论坛的主题线程，无需超级群组。这让您可以在现有的与 Hermes 的私信中运行多个隔离的工作空间。

### 使用案例

如果您正在进行多个长期项目，主题可以将它们的上下文分开：

- **主题“网站”** —— 处理您的生产 Web 服务
- **主题“研究”** —— 文献综述和论文探索
- **主题“常规”** —— 杂项任务和快速问题

每个主题都有自己的对话会话、历史和上下文——完全与其他主题隔离。

### 配置

:::caution 先决条件
在向您的配置添加主题之前，用户必须在与机器人的私信聊天中**启用主题模式**：

1. 在 Telegram 中打开您与 Hermes 机器人的私人聊天
2. 点击顶部的机器人名称以打开聊天信息
3. 启用**主题**（将聊天转换为论坛的开关）

如果没有此设置，Hermes 将在启动时记录 `The chat is not a forum` 并跳过主题创建。这是 Telegram 客户端的设置——机器人无法以编程方式启用它。
:::

在 `~/.hermes/config.yaml` 中的 `platforms.telegram.extra.dm_topics` 下添加主题：

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
| `name` | 是 | 主题显示名称 |
| `icon_color` | 否 | Telegram 图标颜色代码（整数） |
| `icon_custom_emoji_id` | 否 | 主题图标的自定义表情符号 ID |
| `skill` | 否 | 在此主题的新会话中自动加载的技能 |
| `thread_id` | 否 | 主题创建后自动填充——不要手动设置 |

### 工作原理

1. 在网关启动时，Hermes 会为每个还没有 `thread_id` 的主题调用 `createForumTopic`
2. `thread_id` 会自动保存回 `config.yaml`——后续重启会跳过 API 调用
3. 每个主题映射到一个隔离的会话键：`agent:main:telegram:dm:{chat_id}:{thread_id}`
4. 每个主题中的消息都有自己的对话历史、内存刷新和上下文窗口

### 技能绑定

带有 `skill` 字段的主题会在主题中开始新会话时自动加载该技能。这就像在对话开始时输入 `/skill-name` 一样——技能内容会注入到第一条消息中，后续消息会在对话历史中看到它。

例如，带有 `skill: arxiv` 的主题在其会话重置时（由于空闲超时、每日重置或手动 `/reset`）会预加载 arxiv 技能。

:::tip
在配置之外创建的主题（例如，通过手动调用 Telegram API）会在 `forum_topic_created` 服务消息到达时自动发现。您也可以在网关运行时将主题添加到配置中——它们将在下次缓存未命中时被获取。
:::

## 群组论坛主题技能绑定

启用了**主题模式**的超级群组（也称为“论坛主题”）已经为每个主题提供了会话隔离——每个 `thread_id` 映射到其自己的对话。但您可能希望在特定群组主题中的消息到达时**自动加载技能**，就像私信主题技能绑定一样。

### 使用案例

一个团队超级群组，为不同的工作流设置了论坛主题：

- **工程**主题 → 自动加载 `software-development` 技能
- **研究**主题 → 自动加载 `arxiv` 技能
- **常规**主题 → 无技能，通用助手

### 配置

在 `~/.hermes/config.yaml` 中的 `platforms.telegram.extra.group_topics` 下添加主题绑定：

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
          # 无技能 — 通用
```

**字段：**

| 字段 | 必需 | 描述 |
|-------|----------|-------------|
| `chat_id` | 是 | 超级群组的数字 ID（以 `-100` 开头的负数） |
| `name` | 否 | 主题的人类可读标签（仅用于信息） |
| `thread_id` | 是 | Telegram 论坛主题 ID —— 在 `t.me/c/<group_id>/<thread_id>` 链接中可见 |
| `skill` | 否 | 在此主题的新会话中自动加载的技能 |

### 工作原理

1. 当消息到达映射的群组主题时，Hermes 会在 `group_topics` 配置中查找 `chat_id` 和 `thread_id`
2. 如果匹配的条目有 `skill` 字段，则该技能会为会话自动加载——与私信主题技能绑定相同
3. 没有 `skill` 键的主题仅获得会话隔离（现有行为，未更改）
4. 未映射的 `thread_id` 值或 `chat_id` 值会静默通过——无错误，无技能

### 与私信主题的区别

| | 私信主题 | 群组主题 |
|---|---|---|
| 配置键 | `extra.dm_topics` | `extra.group_topics` |
| 主题创建 | 如果缺少 `thread_id`，Hermes 会通过 API 创建主题 | 管理员在 Telegram UI 中创建主题 |
| `thread_id` | 创建后自动填充 | 必须手动设置 |
| `icon_color` / `icon_custom_emoji_id` | 支持 | 不适用（管理员控制外观） |
| 技能绑定 | ✓ | ✓ |
| 会话隔离 | ✓ | ✓（论坛主题已内置） |

:::tip
要查找主题的 `thread_id`，请在 Telegram Web 或 Desktop 中打开主题并查看 URL：`https://t.me/c/1234567890/5` —— 最后一个数字 (`5`) 就是 `thread_id`。超级群组的 `chat_id` 是群组 ID 加上 `-100` 前缀（例如，群组 `1234567890` 变成 `-1001234567890`）。
:::

## 最近的 Bot API 功能

- **Bot API 9.4（2026 年 2 月）：** 私人聊天主题 —— 机器人可以通过 `createForumTopic` 在 1 对 1 私信聊天中创建论坛主题。参见上面的[私人聊天主题](#private-chat-topics-bot-api-94)。
- **隐私政策：** Telegram 现在要求机器人拥有隐私政策。通过 BotFather 的 `/setprivacy_policy` 设置一个，否则 Telegram 可能会自动生成一个占位符。如果您的机器人是面向公众的，这一点尤其重要。
- **消息流：** Bot API 9.x 添加了对流式传输长响应的支持，这可以改善智能体长回复的感知延迟。

## 交互式模型选择器

当您在 Telegram 聊天中发送不带参数的 `/model` 时，Hermes 会显示一个用于切换模型的交互式内联键盘：

1. **提供程序选择** —— 显示每个可用提供程序及其模型数量的按钮（例如，“OpenAI (15)”、“✓ Anthropic (12)”表示当前提供程序）。
2. **模型选择** —— 分页的模型列表，带有 **上一页**/**下一页** 导航、**返回**按钮以返回到提供程序，以及 **取消**。

当前模型和提供程序显示在顶部。所有导航都通过就地编辑同一条消息完成（不会造成聊天混乱）。

:::tip
如果您知道确切的模型名称，请直接输入 `/model <name>` 以跳过选择器。您也可以输入 `/model <name> --global` 以在会话之间保持更改。
:::

## DNS-over-HTTPS 回退 IP

在某些受限网络中，`api.telegram.org` 可能会解析为一个无法访问的 IP。Telegram 适配器包含一个**回退 IP** 机制，该机制在保留正确的 TLS 主机名和 SNI 的同时，透明地针对替代 IP 重试连接。

### 工作原理

1. 如果设置了 `TELEGRAM_FALLBACK_IPS`，则直接使用这些 IP。
2. 否则，适配器会自动通过 DNS-over-HTTPS (DoH) 查询 **Google DNS** 和 **Cloudflare DNS**，以发现 `api.telegram.org` 的替代 IP。
3. DoH 返回的与系统 DNS 结果不同的 IP 被用作回退。
4. 如果 DoH 也被阻止，则使用硬编码的种子 IP (`149.154.167.220`) 作为最后的手段。
5. 一旦回退 IP 成功，它就会变得“粘性”——后续请求会直接使用它，而不会首先重试主路径。

### 配置

```bash
# 显式回退 IP（逗号分隔）
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
您通常不需要手动配置此功能。通过 DoH 的自动发现功能可以处理大多数受限网络场景。只有在您的网络上 DoH 也被阻止时，才需要 `TELEGRAM_FALLBACK_IPS` 环境变量。
:::

## 代理支持

如果您的网络需要通过 HTTP 代理才能访问互联网（在企业环境中很常见），Telegram 适配器会自动读取标准代理环境变量，并通过代理路由所有连接。

### 支持的变量

适配器按顺序检查这些环境变量，使用第一个设置的变量：

1. `HTTPS_PROXY`
2. `HTTP_PROXY`
3. `ALL_PROXY`
4. `https_proxy` / `http_proxy` / `all_proxy`（小写变体）

### 配置

在启动网关之前在您的环境中设置代理：

```bash
export HTTPS_PROXY=http://proxy.example.com:8080
hermes gateway
```

或者将其添加到 `~/.hermes/.env`：

```bash
HTTPS_PROXY=http://proxy.example.com:8080
```

代理适用于主传输和所有回退 IP 传输。无需额外的 Hermes 配置——如果设置了环境变量，它会自动使用。

:::note
这涵盖了 Hermes 用于 Telegram 连接的自定义回退传输层。其他地方使用的标准 `httpx` 客户端已经原生支持代理环境变量。
:::

## 消息反应

机器人可以向消息添加表情符号反应，作为视觉处理反馈：

- 👀 当机器人开始处理您的消息时
- ✅ 当响应成功发送时
- ❌ 如果在处理过程中发生错误

反应**默认禁用**。在 `config.yaml` 中启用它们：

```yaml
telegram:
  reactions: true
```

或通过环境变量：

```bash
TELEGRAM_REACTIONS=true
```

:::note
与 Discord（反应是叠加的）不同，Telegram 的 Bot API 在一次调用中替换所有机器人反应。从 👀 到 ✅/❌ 的转换是原子的——您不会同时看到两者。
:::

:::tip
如果机器人在群组中没有添加反应的权限，反应调用会静默失败，消息处理会继续正常进行。
:::

## 每频道提示

为特定的 Telegram 群组或论坛主题分配临时系统提示。提示在每次轮转时在运行时注入——永远不会持久化到对话历史中——因此更改会立即生效。

```yaml
telegram:
  channel_prompts:
    "-1001234567890": |
      您是一个研究助理。专注于学术来源、
      引用和简洁的综合。
    "42":  |
      此主题用于创意写作反馈。请保持温暖和
      建设性。
```

键是聊天 ID（群组/超级群组）或论坛主题 ID。对于论坛群组，主题级别的提示会覆盖群组级别的提示：

- 在群组 `-1001234567890` 的主题 `42` 中的消息 → 使用主题 `42` 的提示
- 在主题 `99`（无显式条目）中的消息 → 回退到群组 `-1001234567890` 的提示
- 在没有条目的群组中的消息 → 不应用频道提示

数字 YAML 键会自动标准化为字符串。

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| 机器人完全没有响应 | 验证 `TELEGRAM_BOT_TOKEN` 是否正确。检查 `hermes gateway` 日志中的错误。 |
| 机器人回复“未授权” | 您的用户 ID 不在 `TELEGRAM_ALLOWED_USERS` 中。请与 @userinfobot 再次确认。 |
| 机器人忽略群组消息 | 隐私模式可能已开启。请将其关闭（步骤 3）或将机器人设为群组管理员。**更改隐私后，请记住移除并重新添加机器人。** |
| 语音消息未转录 | 验证 STT 是否可用：为本地转录安装 `faster-whisper`，或在 `~/.hermes/.env` 中设置 `GROQ_API_KEY` / `VOICE_TOOLS_OPENAI_KEY`。 |
| 语音回复是文件，而不是气泡 | 安装 `ffmpeg`（Edge TTS Opus 转换所需）。 |
| 机器人令牌已撤销/无效 | 通过 BotFather 中的 `/revoke` 然后 `/newbot` 或 `/token` 生成新令牌。更新您的 `.env` 文件。 |
| Webhook 未收到更新 | 验证 `TELEGRAM_WEBHOOK_URL` 是否可从公共访问（使用 `curl` 测试）。确保您的平台/反向代理将来自 URL 端口的入站 HTTPS 流量路由到由 `TELEGRAM_WEBHOOK_PORT` 配置的本地监听端口（它们不需要是相同的数字）。确保 SSL/TLS 处于活动状态——Telegram 只发送到 HTTPS URL。检查防火墙规则。 |

## 执行批准

当智能体尝试运行潜在危险的命令时，它会在聊天中请求您的批准：

> ⚠️ 此命令可能很危险（递归删除）。回复“yes”以批准。

回复“yes”/“y”以批准，或“no”/“n”以拒绝。

## 安全

:::warning
始终设置 `TELEGRAM_ALLOWED_USERS` 以限制谁可以与您的机器人交互。如果没有它，网关默认会拒绝所有用户，作为一种安全措施。
:::

切勿公开分享您的机器人令牌。如果泄露，请立即通过 BotFather 的 `/revoke` 命令撤销。

有关更多详细信息，请参阅[安全文档](/user-guide/security)。您也可以使用 [DM 配对](/user-guide/messaging#dm-pairing-alternative-to-allowlists) 来实现更动态的用户授权方法。