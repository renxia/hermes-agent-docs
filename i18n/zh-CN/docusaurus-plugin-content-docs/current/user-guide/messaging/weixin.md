---
sidebar_position: 15
title: "Weixin (WeChat)"
description: "将 Hermes 智能体连接到个人微信账户，通过 iLink Bot API 实现"
---

# Weixin (WeChat)

将 Hermes 连接到 [WeChat](https://weixin.qq.com/)（微信），腾讯的个人通讯平台。该适配器使用腾讯的**iLink Bot API**来管理个人微信账户——这与企业微信（WeCom）是不同的。消息是通过长轮询（long-polling）交付的，因此不需要公共端点或 Webhook。

:::info
此适配器适用于**个人微信账户**。如果需要企业/公司微信，请参考 [WeCom 适配器](./wecom.md)。
:::

:::warning iLink bot identity — 普通微信群组可能无法使用
QR 登录将 Hermes 连接到一个**iLink Bot 身份**（例如 `a5ace6fd482e@im.bot`），而不是一个完全可脚本化的普通个人微信账户。后果包括：

- iLink Bot 身份通常**不能像普通联系人一样被邀请进普通的微信群组**。
- 对于大多数 Bot 类型账户，iLink 通常**不会将普通的微信群组事件**（包括用于 QR 登录的个人账户的 `@` 提及）传递给网关。
- 用于扫描二维码的个人微信账户和 iLink Bot 的 `@` 提及是**不一样的**——Bot 是一个独立的身份。
- 下面的 `WEIXIN_GROUP_POLICY` / `WEIXIN_GROUP_ALLOWED_USERS` 设置只有在 iLink 实际为您的账户类型返回群组事件时才会生效。如果它没有返回，无论策略如何设置，群消息都无法到达 Hermes。网关会在 `WEIXIN_GROUP_POLICY` 设置为除 `disabled` 以外的任何值时，在启动时记录一个 `WARNING`（警告）。
:::

## 先决条件 (Prerequisites)

- 一个个人微信账户
- Python 包：`aiohttp` 和 `cryptography`
- 当 Hermes 随 `messaging` 额外安装时，将包含终端 QR 代码渲染功能。

安装所需的依赖项：

```bash
pip install aiohttp cryptography
# 可选：用于终端 QR 代码显示
cd ~/.hermes/hermes-agent && uv pip install -e ".[messaging]"
```

## Proxy Support

### 1. Run the Setup Wizard

The easiest way to connect your WeChat account is through the interactive setup:

```bash
hermes gateway setup
```

Select **Weixin** when prompted. The wizard will:

1. Request a QR code from the iLink Bot API
2. Display the QR code in your terminal (or provide a URL)
3. Wait for you to scan the QR code with the WeChat mobile app
4. Prompt you to confirm the login on your phone
5. Save the account credentials automatically to `~/.hermes/weixin/accounts/`

Once confirmed, you'll see a message like:

```
微信连接成功，account_id=your-account-id
```

The wizard stores the `account_id`, `token`, and `base_url` so you don't need to configure them manually.

### 2. Configure Environment Variables

After initial QR login, set at minimum the account ID in `~/.hermes/.env`:

```bash
WEIXIN_ACCOUNT_ID=your-account-id

# Optional: override the token (normally auto-saved from QR login)
# WEIXIN_TOKEN=your-bot-token

# Optional: restrict access
WEIXIN_DM_POLICY=open
WEIXIN_ALLOWED_USERS=user_id_1,user_id_2

# Optional: restore legacy multiline splitting behavior
# WEIXIN_SPLIT_MULTILINE_MESSAGES=true

# Optional: home channel for cron/notifications
WEIXIN_HOME_CHANNEL=chat_id
WEIXIN_HOME_CHANNEL_NAME=Home
```

### 3. Start the Gateway

```bash
hermes gateway
```

The adapter will restore saved credentials, connect to the iLink API, and begin long-polling for messages.

## Features

- **Long-poll transport** — no public endpoint, webhook, or WebSocket needed
- **QR code login** — scan-to-connect setup via `hermes gateway setup`
- **DM messaging** — configurable access policies; group messaging depends on iLink actually delivering group events for the connected identity (often not the case for iLink bot accounts — see the warning above)
- **Media support** — images, video, files, and voice messages
- **AES-128-ECB encrypted CDN** — automatic encryption/decryption for all media transfers
- **Context token persistence** — disk-backed reply continuity across restarts
- **Markdown formatting** — preserves Markdown, including headers, tables, and code blocks, so WeChat clients that support Markdown can render it natively
- **Smart message chunking** — messages stay as a single bubble when under the limit; only oversized payloads split at logical boundaries
- **Typing indicators** — shows "typing…" status in the WeChat client while the 智能体 processes
- **SSRF protection** — outbound media URLs are validated before download
- **Message deduplication** — 5-minute sliding window prevents double-processing
- **Automatic retry with backoff** — recovers from transient API errors

## Configuration Options

Set these in `config.yaml` under `platforms.weixin.extra`:

| Key | Default | Description |
|-----|---------|-------------|
| `account_id` | — | iLink Bot account ID (required) |
| `token` | — | iLink Bot token (required, auto-saved from QR login) |
| `base_url` | `https://ilinkai.weixin.qq.com` | iLink API base URL |
| `cdn_base_url` | `https://novac2c.cdn.weixin.qq.com/c2c` | CDN base URL for media transfer |
| `dm_policy` | `open` | DM access: `open`, `allowlist`, `disabled`, `pairing` |
| `group_policy` | `disabled` | Group access: `open`, `allowlist`, `disabled` |
| `allow_from` | `[]` | User IDs allowed for DMs (when dm_policy=allowlist) |
| `group_allow_from` | `[]` | Group IDs allowed (when group_policy=allowlist) |
| `split_multiline_messages` | `false` | When `true`, split multi-line replies into multiple chat messages (legacy behavior). When `false`, keep multi-line replies as one message unless they exceed the length limit. |
| `text_batch_delay_seconds` | `3.0` | Quiet period (seconds) before a buffered burst of rapid text messages is flushed as one combined request. iLink delivers messages individually, so this debounce avoids one 智能体 invocation per fragment. Set `0` to dispatch each message immediately. |
| `text_batch_split_delay_seconds` | `5.0` | Extended flush delay used when the latest fragment is near the split threshold (long messages iLink may have chunked). |

## Access Policies

### DM Policy

Controls who can send direct messages to the bot:

| Value | Behavior |
|-------|----------|
| `open` | Anyone can DM the bot (default) |
| `allowlist` | Only user IDs in `allow_from` can DM |
| `disabled` | All DMs are ignored |
| `pairing` | Pairing mode (for initial setup) |

```bash
WEIXIN_DM_POLICY=allowlist
WEIXIN_ALLOWED_USERS=user_id_1,user_id_2
```

`WEIXIN_ALLOWED_USERS` is an **inbound filter**, not an invitation system. QR login connects one iLink bot identity to Hermes. Other people do not scan the Hermes QR code with their own accounts; they must message the connected iLink bot/contact through WeChat, and Hermes will process the DM only if the sender's Weixin user ID is present in `WEIXIN_ALLOWED_USERS`.

A practical setup flow is:

1. Pair Hermes once with `hermes gateway setup` and note the connected iLink bot account.
2. Have each allowed user send a direct message to that bot/contact.
3. Read the sender/user ID from the gateway logs or the inbound event payload.
4. Add those IDs to `WEIXIN_ALLOWED_USERS`, then restart the gateway.

If only the account that scanned the QR code can talk to Hermes, verify that the other users are messaging the iLink bot identity itself, not the personal WeChat account that performed the QR login. The iLink bot is a separate identity, and ordinary WeChat contact/group routing can be limited by Tencent's iLink behavior.

### Group Policy

Controls which groups the bot responds in **when iLink delivers group events for the connected identity**. For QR-login iLink bot identities (e.g. `...@im.bot`), group events are typically not delivered at all, so this policy may have no effect — see the iLink bot limitation warning at the top of the page.

| Value | Behavior |
|-------|----------|
| `open` | Bot responds in all groups (if events are delivered) |
| `allowlist` | Bot only responds in group IDs listed in `group_allow_from` (if events are delivered) |
| `disabled` | All group messages are ignored (default) |

```bash
WEIXIN_GROUP_POLICY=allowlist
# NOTE: this is a comma-separated list of group chat IDs, NOT member user IDs,
# despite the variable name containing "USERS". Keep this in mind when configuring.
WEIXIN_GROUP_ALLOWED_USERS=group_id_1,group_id_2
```

:::note
The default group policy is `disabled` for Weixin (unlike WeCom where it defaults to `open`). This is intentional — personal WeChat accounts may be in many groups, and iLink bot identities typically can't receive ordinary WeChat group messages at all. The gateway logs a `WARNING` at startup if you set `WEIXIN_GROUP_POLICY` to anything other than `disabled`.
:::

## Media Support

### Inbound (receiving)

The adapter receives media attachments from users, downloads them from the WeChat CDN, decrypts them, and caches them locally for 智能体 processing:

| Type | How it's handled |
|------|-----------------|
| **Images** | Downloaded, AES-encrypted, and cached as JPEG. |
| **Video** | Downloaded, AES-encrypted, and cached as MP4. |
| **Files** | Downloaded, AES-encrypted, and cached. Original filename is preserved. |
| **Voice** | If a text transcription is available, it's extracted as text. Otherwise the audio (SILK format) is downloaded and cached. |

**Quoted messages:** Media from quoted (replied-to) messages is also extracted, so the 智能体 has context about what the user is replying to.

### AES-128-ECB Encrypted CDN

WeChat media files are transferred through an encrypted CDN. The adapter handles this transparently:

- **Inbound:** Encrypted media is downloaded from the CDN using `encrypted_query_param` URLs, then decrypted with AES-128-ECB using the per-file key provided in the message payload.
- **Outbound:** Files are encrypted locally with a random AES-128-ECB key, uploaded to the CDN, and the encrypted reference is included in the outbound message.
- The AES key is 16 bytes (128-bit). Keys may arrive as raw base64 or hex-encoded — the adapter handles both formats.
- This requires the `cryptography` Python package.

No configuration is needed — encryption and decryption happen automatically.

### Outbound (sending)

| Method | What it sends |
|--------|--------------|
| `send` | Text messages with Markdown formatting | 
| `send_image` / `send_image_file` | Native image messages (via CDN upload) |
| `send_document` | File attachments (via CDN upload) |
| `send_video` | Video messages (via CDN upload) |

All outbound media goes through the encrypted CDN upload flow:

1. Generate a random AES-128 key
2. Encrypt the file with AES-128-ECB + PKCS#7 padding
3. Request an upload URL from the iLink API (`getuploadurl`)
4. Upload the ciphertext to the CDN
5. Send the message with the encrypted media reference

## Context Token Persistence

The iLink Bot API requires a `context_token` to be echoed back with each outbound message for a given peer. The adapter maintains a disk-backed context token store:

- Tokens are saved per account+peer to `~/.hermes/weixin/accounts/<account_id>.context-tokens.json`
- On startup, previously saved tokens are restored
- Every inbound message updates the stored token for that sender
- Outbound messages automatically include the latest context token

This ensures reply continuity even after gateway restarts.

## Markdown Formatting

WeChat clients connected through the iLink Bot API can render Markdown directly, so the adapter preserves Markdown instead of rewriting it:

- **Headers** stay as Markdown headings (`#`, `##`, ...)
- **Tables** stay as Markdown tables
- **Code fences** stay as fenced code blocks
- **Excessive blank lines** are collapsed to double newlines outside fenced code blocks

## Message Chunking

Messages are delivered as a single chat message whenever they fit within the platform limit. Only oversized payloads are split for delivery:

- Maximum message length: **4000 characters**
- Messages under the limit stay intact even when they contain multiple paragraphs or line breaks
- Oversized messages split at logical boundaries (paragraphs, blank lines, code fences)
- Code fences are kept intact whenever possible (never split mid-block unless the fence itself exceeds the limit)
- Oversized individual blocks fall back to the base adapter's truncation logic
- A 0.3 s inter-chunk delay prevents WeChat rate-limit drops when multiple chunks are sent

## 打字指示器 (Typing Indicators)

适配器在微信客户端显示打字状态：

1. 当收到消息时，适配器通过 `getconfig` API 获取一个 `typing_ticket`
2. 打字票据会为每个用户缓存 10 分钟
3. `send_typing` 发送打字开始信号；`stop_typing` 发送打字停止信号
4. 网关在智能体处理消息时会自动触发打字指示器

## 长轮询连接 (Long-Poll Connection)

适配器使用 HTTP 长轮询（而非 WebSocket）来接收消息：

### 工作原理 (How It Works)

1. **连接 (Connect):** 验证凭据并启动轮询循环
2. **轮询 (Poll):** 调用 `getupdates`，设置 35 秒的超时时间；服务器会一直保持请求状态，直到收到消息或超时。
3. **分派 (Dispatch):** 入站消息通过 `asyncio.create_task` 并发地分派
4. **同步缓冲区 (Sync buffer):** 将持久化的同步游标（`get_updates_buf`）保存到磁盘上，以便适配器在重启后能从正确的位置恢复

### 重试行为 (Retry Behavior)

当发生 API 错误时，适配器采用简单的重试策略：

| 条件 (Condition) | 行为 (Behavior) |
|-----------|----------|
| 短暂错误（第 1–2 次）(Transient error (1st–2nd)) | 间隔 2 秒后重试 |
| 重复性错误（3 次及以上）(Repeated errors (3+)) | 暂停 30 秒，然后重置计数器 |
| 会话过期（`errcode=-14`）(Session expired (`errcode=-14`)) | 暂停 10 分钟（可能需要重新登录） |
| 超时 (Timeout) | 立即重新轮询（正常的长轮询行为） |

### 去重 (Deduplication)

入站消息使用消息 ID 进行去重，时间窗口为 5 分钟。这可以防止在网络抖动或轮询响应重叠期间发生重复处理。

### 令牌锁定 (Token Lock)

同一时间只能有一个微信网关实例使用给定的令牌。适配器在启动时获取一个作用域锁（scoped lock），并在关闭时释放它。如果另一个网关已经在使用了相同的令牌，则启动会失败并返回一条信息性的错误消息。

## 所有环境变量 (All Environment Variables)

| 变量 (Variable) | 是否必需 (Required) | 默认值 (Default) | 描述 (Description) |
|----------|----------|---------|-------------|
| `WEIXIN_ACCOUNT_ID` | ✅ | — | iLink Bot 账号 ID（来自二维码登录） |
| `WEIXIN_TOKEN` | ✅ | — | iLink Bot 令牌（从二维码登录自动保存） |
| `WEIXIN_BASE_URL` | — | `https://ilinkai.weixin.qq.com` | iLink API 基础 URL |
| `WEIXIN_CDN_BASE_URL` | — | `https://novac2c.cdn.weixin.qq.com/c2c` | 用于媒体传输的 CDN 基础 URL |
| `WEIXIN_DM_POLICY` | — | `open` | 私聊 (DM) 访问策略：`open`（开放）, `allowlist`（白名单）, `disabled`（禁用）, `pairing`（配对） |
| `WEIXIN_GROUP_POLICY` | — | `disabled` | 群组访问策略：`open`, `allowlist`, `disabled` |
| `WEIXIN_ALLOWED_USERS` | — | _(empty)_ | 用于私聊白名单的逗号分隔用户 ID |
| `WEIXIN_GROUP_ALLOWED_USERS` | — | _(empty)_ | 用于群组白名单的逗号分隔**群聊 ID**（而非成员用户 ID）。该变量名是遗留的——它期望的是群 ID，而不是用户 ID。 |
| `WEIXIN_HOME_CHANNEL` | — | — | 守恒/通知输出的聊天 ID |
| `WEIXIN_HOME_CHANNEL_NAME` | — | `Home` | 首页频道的显示名称 |
| `WEIXIN_ALLOW_ALL_USERS` | — | — | 网关级别的允许所有用户标志（由设置向导使用） |

## 故障排除 (Troubleshooting)

| 问题 (Problem) | 修复方法 (Fix) |
|---------|-----|
| `Weixin startup failed: aiohttp and cryptography are required` | 安装两者：`pip install aiohttp cryptography` |
| `Weixin startup failed: WEIXIN_TOKEN is required` | 运行 `hermes gateway setup` 以完成二维码登录，或手动设置 `WEIXIN_TOKEN` |
| `Weixin startup failed: WEIXIN_ACCOUNT_ID is required` | 在 `.env` 中设置 `WEIXIN_ACCOUNT_ID` 或运行 `hermes gateway setup` |
| `Another local Hermes gateway is already using this Weixin token` | 先停止另一个网关实例——每个令牌只允许一个轮询器 (poller) |
| Session expired (`errcode=-14`) | 您的登录会话已过期。重新运行 `hermes gateway setup` 以扫描新的二维码 |
| QR code expired during setup | 二维码会自动刷新多达 3 次。如果它持续过期，请检查网络连接 |
| Bot doesn't respond to DMs | 检查 `WEIXIN_DM_POLICY`——如果设置为 `allowlist`，发送者必须在 `WEIXIN_ALLOWED_USERS` 中 |
| Bot ignores group messages | 群组策略默认为 `disabled`。设置 `WEIXIN_GROUP_POLICY=open` 或 `allowlist`——但请注意，二维码登录的 iLink bot 身份（`...@im.bot`）通常无法接收普通的微信群消息。如果网关日志中没有显示任何原始入站群消息事件，则限制在于 iLink 端，而非 Hermes。 |
| Media download/upload fails | 确保安装了 `cryptography`。检查对 `novac2c.cdn.weixin.qq.com` 的网络访问权限 |
| `Blocked unsafe URL (SSRF protection)` | 出站媒体 URL 指向私有/内部地址。只允许公共 URL |
| Voice messages show as text | 如果微信提供了转录文本，适配器就会使用该文本。这是预期的行为 |
| Messages appear duplicated | 适配器通过消息 ID 进行去重。如果看到重复消息，请检查是否运行了多个网关实例 |
| `iLink POST ... HTTP 4xx/5xx` | 来自 iLink 服务的 API 错误。请检查您的令牌有效性和网络连接性 |
| Terminal QR code doesn't render | 使用消息扩展重新安装：`cd ~/.hermes/hermes-agent && uv pip install -e ".[messaging]"`. 或者，打开二维码上方的 URL |