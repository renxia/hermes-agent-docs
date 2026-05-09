---
sidebar_position: 15
title: "微信（WeChat）"
description: "通过 iLink Bot API 将 Hermes 智能体连接到个人微信账号"
---

# 微信（WeChat）

将 Hermes 连接到 [微信](https://weixin.qq.com/)，即腾讯的个人消息平台。该适配器使用腾讯的 **iLink Bot API** 来连接个人微信账号——这与企微（企业微信）不同。消息通过长轮询方式传递，因此无需公共端点或 webhook。

:::info
此适配器适用于**个人微信账号**（微信）。如果您需要企业/公司微信，请参见 [企微适配器](./wecom.md)。
:::

:::warning iLink 机器人身份 — 普通微信群可能无法使用
二维码登录将 Hermes 连接到一个 **iLink 机器人身份**（例如 `a5ace6fd482e@im.bot`），**而不是**一个完全可编程的普通个人微信账号。后果如下：

- iLink 机器人身份通常**无法像普通联系人一样被邀请加入普通微信群**。
- 对于大多数机器人类型的账号，iLink 通常**不会将普通微信群事件**（包括对用于二维码登录的个人账号的 `@` 提及）传递给网关。
- 对用于扫描二维码的个人微信账号进行 `@` 提及**并不等同于**对 iLink 机器人进行 `@` 提及 — 机器人是一个独立的身份。
- 下面的 `WEIXIN_GROUP_POLICY` / `WEIXIN_GROUP_ALLOWED_USERS` 设置仅在 iLink 实际为您的账号类型返回群组事件时生效。如果 iLink 不返回，则无论策略如何，群组消息都将无法到达 Hermes。

在实践中，大多数部署只能可靠地实现向 iLink 机器人发送私信。如果在配置后群组消息传递仍不工作，则限制在于 iLink 端，而非 Hermes。每当 `WEIXIN_GROUP_POLICY` 设置为 `disabled` 以外的任何值时，网关都会在启动时记录一条 `WARNING` 日志。
:::

## 先决条件

- 一个个人微信账号
- Python 包：`aiohttp` 和 `cryptography`
- 当 Hermes 安装了 `messaging` 扩展时，包含终端二维码渲染功能

安装所需的依赖项：

```bash
pip install aiohttp cryptography
# 可选：用于在终端显示二维码
pip install hermes-agent[messaging]
```

## 设置

### 1. 运行设置向导

连接您的微信账号最简单的方法是通过交互式设置：

```bash
hermes gateway setup
```

出现提示时选择 **Weixin**。向导将：

1. 从 iLink 智能体 API 请求一个二维码
2. 在您的终端中显示二维码（或提供一个 URL）
3. 等待您使用微信移动应用扫描二维码
4. 提示您在手机上确认登录
5. 自动将账号凭据保存到 `~/.hermes/weixin/accounts/`

确认后，您将看到如下消息：

```
微信连接成功，account_id=your-account-id
```

向导会存储 `account_id`、`token` 和 `base_url`，因此您无需手动配置它们。

### 2. 配置环境变量

初始二维码登录后，至少在 `~/.hermes/.env` 中设置账号 ID：

```bash
WEIXIN_ACCOUNT_ID=your-account-id

# 可选：覆盖 token（通常从二维码登录自动保存）
# WEIXIN_TOKEN=your-bot-token

# 可选：限制访问
WEIXIN_DM_POLICY=open
WEIXIN_ALLOWED_USERS=user_id_1,user_id_2

# 可选：恢复旧版多行分割行为
# WEIXIN_SPLIT_MULTILINE_MESSAGES=true

# 可选：用于 cron/通知的主频道
WEIXIN_HOME_CHANNEL=chat_id
WEIXIN_HOME_CHANNEL_NAME=Home
```

### 3. 启动网关

```bash
hermes gateway
```

适配器将恢复已保存的凭据，连接到 iLink API，并开始长轮询消息。

## 功能特性

- **长轮询传输** — 无需公共端点、Webhook 或 WebSocket
- **二维码登录** — 通过 `hermes gateway setup` 扫码连接设置
- **私信（DM）消息** — 可配置的访问策略；群消息取决于 iLink 是否实际为连接的标识传递群事件（对于 iLink 智能体账号通常不会发生 — 请参阅上文警告）
- **媒体支持** — 图片、视频、文件和语音消息
- **AES-128-ECB 加密 CDN** — 所有媒体传输自动加密/解密
- **上下文令牌持久化** — 基于磁盘的回复连续性，重启后仍有效
- **Markdown 格式化** — 保留 Markdown（包括标题、表格和代码块），因此支持 Markdown 的微信客户端可以原生渲染
- **智能消息分块** — 消息在限制范围内保持为单个气泡；仅当负载过大时才在逻辑边界处分割
- **输入指示器** — 智能体处理时，微信客户端显示“正在输入…”状态
- **SSRF 防护** — 下载前验证出站媒体 URL
- **消息去重** — 5 分钟滑动窗口防止重复处理
- **自动退避重试** — 从瞬态 API 错误中恢复

## 配置选项

在 `config.yaml` 的 `platforms.weixin.extra` 下设置这些选项：

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `account_id` | — | iLink 智能体账号 ID（必需） |
| `token` | — | iLink 智能体 token（必需，从二维码登录自动保存） |
| `base_url` | `https://ilinkai.weixin.qq.com` | iLink API 基础 URL |
| `cdn_base_url` | `https://novac2c.cdn.weixin.qq.com/c2c` | 用于媒体传输的 CDN 基础 URL |
| `dm_policy` | `open` | 私信访问：`open`、`allowlist`、`disabled`、`pairing` |
| `group_policy` | `disabled` | 群访问：`open`、`allowlist`、`disabled` |
| `allow_from` | `[]` | 允许发送私信的用户 ID（当 dm_policy=allowlist 时） |
| `group_allow_from` | `[]` | 允许的群 ID（当 group_policy=allowlist 时） |
| `split_multiline_messages` | `false` | 当为 `true` 时，将多行回复分割为多个聊天消息（旧版行为）。当为 `false` 时，除非超过长度限制，否则将多行回复保留为一条消息。 |

## 访问策略

### 私信（DM）策略

控制谁可以向智能体发送私信：

| 值 | 行为 |
|-------|----------|
| `open` | 任何人都可以向智能体发送私信（默认） |
| `allowlist` | 仅 `allow_from` 中的用户 ID 可以发送私信 |
| `disabled` | 忽略所有私信 |
| `pairing` | 配对模式（用于初始设置） |

```bash
WEIXIN_DM_POLICY=allowlist
WEIXIN_ALLOWED_USERS=user_id_1,user_id_2
```

### 群策略

控制智能体在哪些群中响应 **当 iLink 为连接的标识传递群事件时**。对于二维码登录的 iLink 智能体标识（例如 `...@im.bot`），通常根本不会传递群事件，因此此策略可能无效 — 请参阅页面顶部的 iLink 智能体限制警告。

| 值 | 行为 |
|-------|----------|
| `open` | 智能体在所有群中响应（如果事件被传递） |
| `allowlist` | 智能体仅在 `group_allow_from` 中列出的群 ID 中响应（如果事件被传递） |
| `disabled` | 忽略所有群消息（默认） |

```bash
WEIXIN_GROUP_POLICY=allowlist
# 注意：这是一个以逗号分隔的群聊 ID 列表，而不是成员用户 ID，
# 尽管变量名包含“USERS”。配置时请牢记这一点。
WEIXIN_GROUP_ALLOWED_USERS=group_id_1,group_id_2
```

:::note
微信的默认群策略为 `disabled`（不同于企业微信，其默认为 `open`）。这是有意为之 — 个人微信账号可能加入了许多群，而 iLink 智能体标识通常根本无法接收普通微信群消息。如果您将 `WEIXIN_GROUP_POLICY` 设置为 `disabled` 以外的任何值，网关将在启动时记录一条 `WARNING`。
:::

## 媒体支持

### 入站（接收）

适配器接收来自用户的媒体附件，从微信 CDN 下载它们，解密它们，并将其缓存在本地以供智能体处理：

| 类型 | 处理方式 |
|------|-----------------| 
| **图片** | 下载、AES 解密并缓存为 JPEG。 |
| **视频** | 下载、AES 解密并缓存为 MP4。 |
| **文件** | 下载、AES 解密并缓存。保留原始文件名。 |
| **语音** | 如果文本转录可用，则提取为文本。否则下载并缓存音频（SILK 格式）。 |

**引用消息：** 也会提取引用（回复）消息中的媒体，因此智能体可以了解用户正在回复的内容。

### AES-128-ECB 加密 CDN

微信媒体文件通过加密 CDN 传输。适配器透明地处理此问题：

- **入站：** 使用 `encrypted_query_param` URL 从 CDN 下载加密媒体，然后使用消息负载中提供的每个文件的密钥通过 AES-128-ECB 解密。
- **出站：** 文件使用随机 AES-128-ECB 密钥在本地加密，上传到 CDN，并在出站消息中包含加密引用。
- AES 密钥为 16 字节（128 位）。密钥可能以原始 base64 或十六进制编码形式到达 — 适配器处理这两种格式。
- 这需要 `cryptography` Python 包。

无需配置 — 加密和解密自动进行。

### 出站（发送）

| 方法 | 发送内容 |
|--------|--------------|
| `send` | 带有 Markdown 格式的文本消息 | 
| `send_image` / `send_image_file` | 原生图片消息（通过 CDN 上传） |
| `send_document` | 文件附件（通过 CDN 上传） |
| `send_video` | 视频消息（通过 CDN 上传） |

所有出站媒体都通过加密 CDN 上传流程：

1. 生成随机 AES-128 密钥
2. 使用 AES-128-ECB + PKCS#7 填充加密文件
3. 从 iLink API 请求上传 URL（`getuploadurl`）
4. 将密文上传到 CDN
5. 发送带有加密媒体引用的消息

## 上下文令牌持久化

iLink 智能体 API 要求在每个出站消息中回显 `context_token` 以对应特定的对等方。适配器维护一个基于磁盘的上下文令牌存储：

- 令牌按账号+对等方保存到 `~/.hermes/weixin/accounts/<account_id>.context-tokens.json`
- 启动时，恢复先前保存的令牌
- 每个入站消息都会更新该发送者的存储令牌
- 出站消息自动包含最新的上下文令牌

这确保了即使在网关重启后也能保持回复的连续性。

## Markdown 格式化

通过 iLink Bot API 连接的微信客户端可以直接渲染 Markdown，因此适配器会保留 Markdown 格式，而不是重写它：

- **标题** 保持为 Markdown 标题（`#`、`##`、...）
- **表格** 保持为 Markdown 表格
- **代码围栏** 保持为围栏代码块
- **过多的空行** 在围栏代码块外部会被折叠为双换行符

## 消息分块

只要消息内容在平台限制范围内，就会作为单条聊天消息发送。只有超大的消息负载才会被拆分发送：

- 最大消息长度：**4000 个字符**
- 即使包含多个段落或换行符，只要未超过限制，消息都会保持完整
- 超大消息会在逻辑边界处拆分（段落、空行、代码围栏）
- 代码围栏会尽可能保持完整（除非围栏本身超过限制，否则不会在块中间拆分）
- 超大的单个块会回退到基础适配器的截断逻辑
- 0.3 秒的块间延迟可防止在发送多个块时触发微信的速率限制

## 输入指示器

适配器会在微信客户端中显示输入状态：

1. 当消息到达时，适配器通过 `getconfig` API 获取 `typing_ticket`
2. 每个用户的输入票据会缓存 10 分钟
3. `send_typing` 发送开始输入信号；`stop_typing` 发送停止输入信号
4. 当智能体处理消息时，网关会自动触发输入指示器

## 长轮询连接

适配器使用 HTTP 长轮询（而非 WebSocket）来接收消息：

### 工作原理

1. **连接：** 验证凭据并启动轮询循环
2. **轮询：** 调用 `getupdates`，超时时间为 35 秒；服务器会保持请求，直到消息到达或超时
3. **分发：** 入站消息通过 `asyncio.create_task` 并发分发
4. **同步缓冲区：** 持久化的同步游标（`get_updates_buf`）会保存到磁盘，以便适配器在重启后从正确的位置恢复

### 重试行为

当 API 出现错误时，适配器会使用简单的重试策略：

| 条件 | 行为 |
|-----------|----------|
| 瞬时错误（第 1–2 次） | 2 秒后重试 |
| 重复错误（3 次及以上） | 退避 30 秒，然后重置计数器 |
| 会话过期（`errcode=-14`） | 暂停 10 分钟（可能需要重新登录） |
| 超时 | 立即重新轮询（正常的长轮询行为） |

### 去重

入站消息会使用消息 ID 在 5 分钟窗口内进行去重。这可以防止在网络波动或轮询响应重叠期间重复处理消息。

### Token 锁

同一时间只能有一个微信网关实例使用给定的 token。适配器在启动时会获取一个作用域锁，并在关闭时释放它。如果另一个网关已经在使用相同的 token，启动将失败，并显示一条信息性错误消息。

## 所有环境变量

| 变量 | 必填 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `WEIXIN_ACCOUNT_ID` | ✅ | — | iLink Bot 账户 ID（来自扫码登录） |
| `WEIXIN_TOKEN` | ✅ | — | iLink Bot token（扫码登录后自动保存） |
| `WEIXIN_BASE_URL` | — | `https://ilinkai.weixin.qq.com` | iLink API 基础 URL |
| `WEIXIN_CDN_BASE_URL` | — | `https://novac2c.cdn.weixin.qq.com/c2c` | 媒体传输的 CDN 基础 URL |
| `WEIXIN_DM_POLICY` | — | `open` | 私信访问策略：`open`、`allowlist`、`disabled`、`pairing` |
| `WEIXIN_GROUP_POLICY` | — | `disabled` | 群聊访问策略：`open`、`allowlist`、`disabled` |
| `WEIXIN_ALLOWED_USERS` | — | _(空)_ | 私信白名单的用户 ID（逗号分隔） |
| `WEIXIN_GROUP_ALLOWED_USERS` | — | _(空)_ | 群聊白名单的**群聊 ID**（非成员用户 ID，逗号分隔）。该变量名称是历史遗留问题——它期望的是群聊 ID，而不是用户 ID。 |
| `WEIXIN_HOME_CHANNEL` | — | — | 定时任务/通知输出的聊天 ID |
| `WEIXIN_HOME_CHANNEL_NAME` | — | `Home` | 主频道的显示名称 |
| `WEIXIN_ALLOW_ALL_USERS` | — | — | 网关级标志，允许所有用户（由设置向导使用） |

## 故障排除

| 问题 | 解决方法 |
|---------|-----|
| `Weixin 启动失败：需要 aiohttp 和 cryptography` | 安装两者：`pip install aiohttp cryptography` |
| `Weixin 启动失败：WEIXIN_TOKEN 是必需的` | 运行 `hermes gateway setup` 完成扫码登录，或手动设置 `WEIXIN_TOKEN` |
| `Weixin 启动失败：WEIXIN_ACCOUNT_ID 是必需的` | 在 `.env` 中设置 `WEIXIN_ACCOUNT_ID`，或运行 `hermes gateway setup` |
| `另一个本地 Hermes 网关已经在使用此 Weixin token` | 请先停止其他网关实例——每个 token 只允许一个轮询器 |
| 会话过期（`errcode=-14`） | 您的登录会话已过期。请重新运行 `hermes gateway setup` 扫描新的二维码 |
| 设置期间二维码过期 | 二维码最多会自动刷新 3 次。如果持续过期，请检查您的网络连接 |
| 机器人不响应私信 | 检查 `WEIXIN_DM_POLICY` —— 如果设置为 `allowlist`，则发送者必须在 `WEIXIN_ALLOWED_USERS` 中 |
| 机器人忽略群聊消息 | 群聊策略默认为 `disabled`。请设置 `WEIXIN_GROUP_POLICY=open` 或 `allowlist` —— 但请注意，扫码登录的 iLink 机器人身份（`...@im.bot`）通常根本无法接收普通微信群聊消息。如果网关日志中未显示群聊消息的原始入站事件，则限制在于 iLink 端，而非 Hermes。 |
| 媒体下载/上传失败 | 确保已安装 `cryptography`。检查到 `novac2c.cdn.weixin.qq.com` 的网络访问权限 |
| `阻止了不安全的 URL（SSRF 保护）` | 出站媒体 URL 指向私有/内部地址。仅允许公共 URL |
| 语音消息显示为文本 | 如果微信提供了转录文本，适配器会使用文本。这是预期行为 |
| 消息出现重复 | 适配器会根据消息 ID 进行去重。如果您看到重复消息，请检查是否有多个网关实例正在运行 |
| `iLink POST ... HTTP 4xx/5xx` | iLink 服务的 API 错误。请检查您的 token 有效性和网络连接 |
| 终端二维码无法渲染 | 请使用 messaging 额外组件重新安装：`pip install hermes-agent[messaging]`。或者，打开二维码上方打印的 URL |