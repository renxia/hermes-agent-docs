---
sidebar_position: 14
title: "WeCom (企业微信)"
description: "将Hermes智能体连接到WeCom，通过AI Bot WebSocket网关进行通信"
---

# WeCom (企业微信)

Connect Hermes 到 [WeCom](https://work.weixin.qq.com/) (企业微信)，这是腾讯的企业消息平台。该适配器使用WeCom的AI Bot WebSocket网关来实现实时双向通信——无需公共端点或Webhook。

另请参阅：[WeCom Callback](./wecom-callback.md) 以了解入站Webhook设置。

## 先决条件

- 一个WeCom组织账号
- 在WeCom管理控制台中创建的AI Bot
- 来自Bot凭证页面的Bot ID和Secret
- Python包：`aiohttp` 和 `httpx`

## 设置

### 第 1 步：创建 AI Bot

#### 推荐：扫描创建（一键式）

```bash
hermes gateway setup
```

选择 **WeCom**，然后使用您的 WeCom 移动应用程序扫描二维码。Hermes 将自动创建一个具有正确权限的机器人应用并保存凭据。

设置向导将执行以下操作：
1. 在终端中显示一个二维码
2. 等待您使用 WeCom 移动应用程序进行扫描
3. 自动检索 Bot ID 和 Secret
4. 指导您完成访问控制配置

#### 备选方案：手动设置

如果无法扫描创建，向导将回退到手动输入模式：

1. 登录 [WeCom 管理控制台](https://work.weixin.qq.com/wework_admin/frame)
2. 导航至 **应用** → **创建应用** → **AI Bot**
3. 配置机器人名称和描述
4. 从凭据页面复制 **Bot ID** 和 **Secret**
5. 运行 `hermes gateway setup`，选择 **WeCom**，并在提示时输入凭据

:::warning
请务必保密 Bot Secret。拥有它的人可以冒充您的机器人。
:::

### 第 2 步：配置 Hermes

#### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

选择 **WeCom** 并遵循提示。向导将引导您完成以下内容：
- Bot 凭据（通过二维码扫描或手动输入）
- 访问控制设置（白名单、配对模式或开放访问）
- 通知用的主频道

#### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env`：

```bash
WECOM_BOT_ID=your-bot-id
WECOM_SECRET=your-secret

# 可选：限制访问权限
WECOM_ALLOWED_USERS=user_id_1,user_id_2

# 可选：用于 cron/通知的主频道
WECOM_HOME_CHANNEL=chat_id
```

### 第 3 步：启动网关

```bash
hermes gateway
```

## 功能特性

- **WebSocket 传输** — 持久连接，无需公共端点
- **私聊和群消息** — 可配置的访问策略
- **按群体的发送者白名单** — 对每个群内谁可以互动进行细粒度控制
- **媒体支持** — 图片、文件、语音、视频上传和下载
- **AES 加密的媒体** — 自动解密入站附件
- **引用上下文** — 保留回复线程
- **Markdown 渲染** — 富文本响应
- **回复关联** — 将响应与入站消息的上下文相关联
- **自动重连** — 连接中断时进行指数退避

:::note 流媒体和输入指示器
WeCom 适配器将每个响应作为一个完整的消息交付——它**不**逐个令牌流式传输响应，并且它**不会**显示输入指示。 “回复关联”（如下）只是将响应与入站请求进行线程化；它不是实时流。
:::

## 配置选项

在 `config.yaml` 的 `platforms.wecom.extra` 下设置这些内容：

| Key | Default | Description |
|-----|---------|-------------|
| `bot_id` | — | WeCom AI Bot ID（必需） |
| `secret` | — | WeCom AI Bot Secret（必需） |
| `websocket_url` | `wss://openws.work.weixin.qq.com` | WebSocket 网关 URL |
| `dm_policy` | `open` | 私聊访问权限：`open`、`allowlist`、`disabled`、`pairing` |
| `group_policy` | `open` | 群组访问权限：`open`、`allowlist`、`disabled` |
| `allow_from` | `[]` | 允许进行私聊的用户 ID（当 `dm_policy=allowlist` 时） |
| `group_allow_from` | `[]` | 允许的群组 ID（当 `group_policy=allowlist` 时） |
| `groups` | `{}` | 按群体的配置（见下文） |

## 访问策略

### 私聊策略 (DM Policy)

控制谁可以向机器人发送私信：

| Value | Behavior |
|-------|----------|
| `open` | 任何人都可以 DM 机器人（默认） |
| `allowlist` | 只有 `allow_from` 中列出的用户 ID 才能 DM |
| `disabled` | 所有 DM 都被忽略 |
| `pairing` | 配对模式（用于初始设置） |

```bash
WECOM_DM_POLICY=allowlist
```

### 群组策略 (Group Policy)

控制机器人回复哪些群组：

| Value | Behavior |
|-------|----------|
| `open` | 机器人回复所有群组（默认） |
| `allowlist` | 机器人只在 `group_allow_from` 中列出的群组中回复 |
| `disabled` | 所有群消息都被忽略 |

```bash
WECOM_GROUP_POLICY=allowlist
```

### 按群体的发送者白名单 (Per-Group Sender Allowlists)

为了实现细粒度控制，您可以限制哪些用户被允许在特定群组内与机器人互动。这需要在 `config.yaml` 中配置：

```yaml
platforms:
  wecom:
    enabled: true
    extra:
      bot_id: "your-bot-id"
      secret: "your-secret"
      group_policy: "allowlist"
      group_allow_from:
        - "group_id_1"
        - "group_id_2"
      groups:
        group_id_1:
          allow_from:
            - "user_alice"
            - "user_bob"
        group_id_2:
          allow_from:
            - "user_charlie"
        "*":
          allow_from:
            - "user_admin"
```

**工作原理：**

1. `group_policy` 和 `group_allow_from` 控制是否允许一个群组存在。
2. 如果一个群组通过了顶层检查，则 `groups.<group_id>.allow_from` 列表（如果存在）将进一步限制该群内哪些发送者可以与机器人互动。
3. 通配符 `"*"` 的群组条目充当未显式列出的群组的默认值。
4. 白名单条目支持 `*` 通配符以允许所有用户，并且条目是不区分大小写的。
5. 条目可以选择使用 `wecom:user:` 或 `wecom:group:` 前缀格式——该前缀会被自动剥离。

如果未为某个群组配置 `allow_from`，则该群组内的所有用户都将被允许（前提是该群组本身通过了顶层策略检查）。

## 媒体支持 (Media Support)

### 入站消息（接收）

适配器会从用户那里接收媒体附件，并将其本地缓存起来供**智能体**处理：

| Type | How it's handled |
|------|-----------------|
| **Images** | 下载并本地缓存。支持基于 URL 和 base64 编码的图片。 |
| **Files** | 下载并缓存。保留原始消息中的文件名。 |
| **Voice** | 如果可用，会提取语音消息的文本转录内容。 |
| **Mixed messages** | WeCom 的混合类型消息（文本 + 图片）会被解析，所有组件都会被提取出来。 |

**引用消息：** 媒体来自引用的（回复的）消息也会被提取，这样**智能体**就能了解用户正在回复什么内容。

### AES 加密的媒体解密

WeCom 使用 AES-256-CBC 对某些入站媒体附件进行加密。适配器会自动处理此过程：

- 当入站媒体项包含 `aeskey` 字段时，适配器会下载加密字节并使用 AES-256-CBC 和 PKCS#7 填充进行解密。
- AES 密钥是 `aeskey` 字段的 base64 解码值（必须正好是 32 字节）。
- IV 是从密钥的前 16 个字节派生的。
- 这需要 `cryptography` Python 包（`pip install cryptography`）。

无需配置——当接收到加密媒体时，解密过程会透明地进行。

### 出站消息（发送）

| Method | What it sends | Size limit |
|--------|--------------|------------|
| `send` | Markdown 文本消息 | 4000 chars |
| `send_image` / `send_image_file` | 原生图片消息 | 10 MB |
| `send_document` | 文件附件 | 20 MB |
| `send_voice` | 语音消息（原生语音仅支持 AMR 格式） | 2 MB |
| `send_video` | 视频消息 | 10 MB |

**分块上传：** 文件通过三步协议（初始化 → 分块 → 完成）以 512 KB 的块进行上传。适配器会自动处理此过程。

**自动降级：** 当媒体超过原生类型的尺寸限制，但仍低于绝对的 20 MB 文件限制时，它会被自动作为通用文件附件发送：

- 图片 > 10 MB → 作为文件发送
- 视频 > 10 MB → 作为文件发送
- 语音 > 2 MB → 作为文件发送
- 非 AMR 音频 → 作为文件发送（WeCom 只支持 AMR 原生语音）

超过绝对 20 MB 限制的文件将被拒绝，并向聊天发送一条信息。

## 回复式响应 (Reply-Mode Responses)

当机器人通过 WeCom 回调函数接收到消息时，适配器会记住入站请求 ID。如果在请求上下文仍然活跃的情况下发送响应，适配器将使用 WeCom 的回复模式 (`aibot_respond_msg`) 将响应直接与入站消息相关联。这在 WeCom 客户端提供了更自然的对话体验。

完整的响应以单个消息的形式交付——适配器不会增量地流式传输令牌。如果入站请求上下文已过期或不可用，适配器将回退到通过 `aibot_send_msg` 进行主动消息发送。

回复模式也适用于媒体：上传的媒体可以作为对原始消息的回复进行发送。

## 连接和重连 (Connection and Reconnection)

适配器与 WeCom 网关（`wss://openws.work.weixin.qq.com`）保持持久的 WebSocket 连接。

### 连接生命周期

1. **连接：** 打开 WebSocket 连接，并使用 bot_id 和 secret 发送 `aibot_subscribe` 认证帧。
2. **心跳：** 每 30 秒发送一次应用级别的 ping 帧以保持连接存活。
3. **监听：** 不断读取入站帧并分派消息回调。

### 重连行为

发生连接丢失时，适配器使用指数退避进行重连：

| Attempt | Delay |
|---------|-------|
| 1st retry | 2 seconds |
| 2nd retry | 5 seconds |
| 3rd retry | 10 seconds |
| 4th retry | 30 seconds |
| 5th+ retry | 60 seconds |

每次成功重连后，退避计数器都会重置为零。所有待定的请求未来（futures）在断开连接时都会失败，以防调用者无限期挂起。

### 去重 (Deduplication)

入站消息使用消息 ID 进行去重，窗口期为 5 分钟，最大缓存条目数为 1000 个。这可以防止在重连或网络故障期间消息被重复处理。

## 所有环境变量

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WECOM_BOT_ID` | ✅ | — | WeCom AI Bot ID |
| `WECOM_SECRET` | ✅ | — | WeCom AI Bot Secret |
| `WECOM_ALLOWED_USERS` | — | _(empty)_ | 网关级别的白名单所允许的逗号分隔的用户 ID |
| `WECOM_HOME_CHANNEL` | — | — | 用于 cron/通知输出的聊天 ID |
| `WECOM_WEBSOCKET_URL` | — | `wss://openws.work.weixin.qq.com` | WebSocket 网关 URL |
| `WECOM_DM_POLICY` | — | `open` | DM 访问策略 |
| `WECOM_GROUP_POLICY` | — | `open` | 群组访问策略 |

## 故障排除 (Troubleshooting)

| Problem | Fix |
|---------|-----|
| `WECOM_BOT_ID and WECOM_SECRET are required` | 设置这两个环境变量，或在设置向导中配置 |
| `WeCom startup failed: aiohttp not installed` | 安装 aiohttp：`pip install aiohttp` |
| `WeCom startup failed: httpx not installed` | 安装 httpx：`pip install httpx` |
| `invalid secret (errcode=40013)` | 验证 Secret 是否与您的机器人凭据匹配 |
| `Timed out waiting for subscribe acknowledgement` | 检查到 `openws.work.weixin.qq.com` 的网络连接性 |
| Bot doesn't respond in groups | 检查 `group_policy` 设置，并确保群组 ID 在 `group_allow_from` 中 |
| Bot ignores certain users in a group | 检查 `groups` 配置部分中的按群体的 `allow_from` 列表 |
| Media decryption fails | 安装 `cryptography`：`pip install cryptography` |
| `cryptography is required for WeCom media decryption` | 入站媒体是 AES 加密的。请安装：`pip install cryptography` |
| Voice messages sent as files | WeCom 只支持 AMR 格式的原生语音。其他格式都会自动降级为文件。 |
| `File too large` error | WeCom 对所有文件上传都有 20 MB 的绝对限制。压缩或分割文件。 |
| Images sent as files | 图片 > 10 MB 超出了原生图片限制，会被自动降级为文件附件。 |
| `Timeout sending message to WeCom` | WebSocket 可能已断开连接。请检查日志以获取重连消息。 |
| `WeCom websocket closed during authentication` | 网络问题或凭据不正确。验证 bot_id 和 secret。 |