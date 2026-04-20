---
sidebar_position: 15
title: "微信（WeChat）"
description: "通过 iLink Bot API 将 Hermes Agent 连接到个人微信账号"
---

# 微信（WeChat）

将 Hermes 连接到 [微信](https://weixin.qq.com/)（微信），腾讯的个人消息平台。该适配器使用腾讯的 **iLink Bot API** 对接个人微信账号——这与企业微信（WeCom）不同。消息通过长轮询方式投递，因此无需公网端点或 Webhook。

:::info
此适配器适用于**个人微信账号**（微信）。如需企业/公司微信，请改用 [WeCom 适配器](./wecom.md)。
:::

## 前提条件

- 个人微信账号
- Python 包：`aiohttp` 和 `cryptography`
- 当 Hermes 安装时包含 `messaging` 扩展，终端 QR 码渲染功能将被自动启用

安装所需依赖项：

```bash
pip install aiohttp cryptography
# 可选：用于终端二维码显示
pip install hermes-agent[messaging]
```

## 设置

### 1. 运行设置向导

连接微信账号最简单的方法是使用交互式设置向导：

```bash
hermes gateway setup
```

在提示时选择 **Weixin**。向导将：

1. 从 iLink Bot API 请求二维码
2. 在终端中显示二维码（或提供一个 URL）
3. 等待您使用微信移动应用扫描二维码
4. 提示您在手机上确认登录
5. 自动将账户凭据保存到 `~/.hermes/weixin/accounts/`

确认后，您将看到如下消息：

```
微信连接成功，account_id=your-account-id
```

向导会存储 `account_id`、`token` 和 `base_url`，因此您无需手动配置它们。

### 2. 配置环境变量

完成初始二维码登录后，至少在 `~/.hermes/.env` 中设置 account ID：

```bash
WEIXIN_ACCOUNT_ID=your-account-id

# 可选：覆盖 token（通常从二维码登录自动保存）
# WEIXIN_TOKEN=your-bot-token

# 可选：限制访问权限
WEIXIN_DM_POLICY=open
WEIXIN_ALLOWED_USERS=user_id_1,user_id_2

# 可选：恢复旧版多行拆分行为
# WEIXIN_SPLIT_MULTILINE_MESSAGES=true

# 可选：用于 cron/通知的主频道
WEIXIN_HOME_CHANNEL=chat_id
WEIXIN_HOME_CHANNEL_NAME=Home
```

### 3. 启动网关

```bash
hermes gateway
```

适配器将恢复已保存的凭据，连接到 iLink API，并开始长轮询接收消息。

## 功能特性

- **长轮询传输** — 无需公网端点、Webhook 或 WebSocket
- **二维码登录** — 通过 `hermes gateway setup` 实现扫码连接
- **私信和群聊支持** — 可配置的访问策略
- **媒体支持** — 图片、视频、文件和语音消息
- **AES-128-ECB 加密 CDN** — 所有媒体传输自动加解密
- **上下文令牌持久化** — 重启后仍保持回复连续性（基于磁盘存储）
- **Markdown 格式化保留** — 保留 Markdown（包括标题、表格和代码块），以便支持 Markdown 的微信客户端原生渲染
- **智能消息分块** — 未超限时保持为单条消息；仅对超长内容在逻辑边界处拆分
- **输入状态指示器** — 代理处理消息时在微信客户端显示“正在输入…”
- **SSRF 防护** — 下载前验证出站媒体 URL
- **消息去重** — 5 分钟滑动窗口防止重复处理
- **自动重试与退避** — 从临时 API 错误中恢复

## 配置选项

在 `config.yaml` 的 `platforms.weixin.extra` 下设置以下参数：

| 键 | 默认值 | 说明 |
|-----|---------|-------------|
| `account_id` | — | iLink Bot 账号 ID（必填） |
| `token` | — | iLink Bot 令牌（必填，从二维码登录自动保存） |
| `base_url` | `https://ilinkai.weixin.qq.com` | iLink API 基础 URL |
| `cdn_base_url` | `https://novac2c.cdn.weixin.qq.com/c2c` | 媒体传输 CDN 基础 URL |
| `dm_policy` | `open` | 私信访问策略：`open`、`allowlist`、`disabled`、`pairing` |
| `group_policy` | `disabled` | 群聊访问策略：`open`、`allowlist`、`disabled` |
| `allow_from` | `[]` | 允许私信的用户 ID 列表（当 dm_policy=allowlist） |
| `group_allow_from` | `[]` | 允许参与的群组 ID 列表（当 group_policy=allowlist） |
| `split_multiline_messages` | `false` | 当为 `true` 时，将多行回复拆分为多条聊天消息（旧版行为）；当为 `false` 时，除非超过长度限制，否则将多行回复合并为一条消息 |

## 访问策略

### 私信策略

控制谁可以向机器人发送私信：

| 值 | 行为 |
|-------|----------|
| `open` | 任何人都可以私信机器人（默认） |
| `allowlist` | 仅 `allow_from` 中的用户 ID 可以私信 |
| `disabled` | 忽略所有私信 |
| `pairing` | 配对模式（用于初始设置） |

```bash
WEIXIN_DM_POLICY=allowlist
WEIXIN_ALLOWED_USERS=user_id_1,user_id_2
```

### 群聊策略

控制在哪些群中机器人会响应：

| 值 | 行为 |
|-------|----------|
| `open` | 机器人在所有群中响应 |
| `allowlist` | 机器人仅在 `group_allow_from` 列出的群组 ID 中响应 |
| `disabled` | 忽略所有群消息（默认） |

```bash
WEIXIN_GROUP_POLICY=allowlist
WEIXIN_GROUP_ALLOWED_USERS=group_id_1,group_id_2
```

:::note
微信（Weixin）的默认群聊策略是 `disabled`（与企业微信默认 `open` 不同），这是为了适配个人账号可能加入大量群组的情况。
:::

## 媒体支持

### 入站（接收）

适配器从用户接收媒体附件，从微信 CDN 下载并解密，然后本地缓存供代理处理：

| 类型 | 处理方式 |
|------|-----------------| 
| **图片** | 下载后 AES 解密并缓存为 JPEG。 |
| **视频** | 下载后 AES 解密并缓存为 MP4。 |
| **文件** | 下载后 AES 解密并缓存，保留原始文件名。 |
| **语音** | 如果提供文本转录，则提取为文本；否则下载 SILK 格式音频并缓存。 |

**引用消息：** 也会提取引用（回复）消息中的媒体，使代理能了解用户的回复上下文。

### AES-128-ECB 加密 CDN

微信媒体文件通过加密 CDN 传输。适配器对此透明处理：

- **入站：** 从 CDN 下载加密媒体时使用带 `encrypted_query_param` 的 URL，然后用消息负载中提供的每文件密钥进行 AES-128-ECB 解密。
- **出站：** 文件在本地用随机 AES-128-ECB 密钥加密，上传至 CDN，并在出站消息中包含加密引用。
- AES 密钥为 16 字节（128 位）。密钥可能以 base64 或十六进制编码形式到达——适配器可处理两种格式。
- 这需要安装 `cryptography` Python 包。

无需额外配置——加解密自动完成。

### 出站（发送）

| 方法 | 发送内容 |
|--------|--------------|
| `send` | 带 Markdown 格式的文本消息 | 
| `send_image` / `send_image_file` | 原生图片消息（通过 CDN 上传） |
| `send_document` | 文件附件（通过 CDN 上传） |
| `send_video` | 视频消息（通过 CDN 上传） |

所有出站媒体均通过加密 CDN 上传流程：

1. 生成随机 AES-128 密钥
2. 使用 AES-128-ECB + PKCS#7 填充加密文件
3. 向 iLink API 请求上传 URL（`getuploadurl`）
4. 将密文上传至 CDN
5. 发送包含加密媒体引用的消息

## 上下文令牌持久化

iLink Bot API 要求每条出站消息回显一个 `context_token`。适配器维护一个基于磁盘的上下文令牌存储：

- 每个账号+对等方的令牌保存到 `~/.hermes/weixin/accounts/<account_id>.context-tokens.json`
- 启动时恢复之前保存的令牌
- 每条入站消息都会更新该发件人的存储令牌
- 出站消息自动包含最新上下文令牌

这确保即使网关重启也能维持回复连续性。

## Markdown 格式化

通过 iLink Bot API 连接的微信客户端可直接渲染 Markdown，因此适配器保留原始 Markdown 而非改写：

- **标题** 保持为 Markdown 标题（`#`、`##` 等）
- **表格** 保持为 Markdown 表格
- **代码围栏** 保持为围栏代码块
- **多余空行** 在围栏代码块外压缩为双换行

## 消息分块

只要消息不超过平台限制，就会作为单条聊天消息发送。仅对超长内容进行拆分：

- 最大消息长度：**4000 字符**
- 未超限的消息即使包含多个段落或换行也保持完整
- 超长消息在逻辑边界（段落、空行、代码围栏）处拆分
- 尽可能保持代码围栏完整（除非围栏本身超限才拆分）
- 单个超大区块回退到基础适配器的截断逻辑
- 分块间插入 0.3 秒延迟，避免因连续发送多条分块触发微信速率限制

## 输入状态指示器

适配器在微信客户端显示输入状态：

1. 收到消息后，适配器通过 `getconfig` API 获取 `typing_ticket`
2. 每个用户的 typing ticket 缓存 10 分钟
3. `send_typing` 发送开始输入信号；`stop_typing` 发送停止输入信号
4. 网关在代理处理消息期间自动触发输入指示器

## 长轮询连接

适配器使用 HTTP 长轮询（非 WebSocket）接收消息：

### 工作原理

1. **连接：** 验证凭据并启动轮询循环
2. **轮询：** 调用 `getupdates`，超时时间为 35 秒；服务器会保持请求直到有消息到达或超时
3. **分发：** 入站消息通过 `asyncio.create_task` 并发分发
4. **同步缓冲区：** 持久化同步游标（`get_updates_buf`）保存到磁盘，确保适配器重启后能从正确位置恢复

### 重试行为

遇到 API 错误时，适配器采用简单重试策略：

| 条件 | 行为 |
|-----------|----------|
| 临时错误（第 1–2 次） | 2 秒后重试 |
| 重复错误（第 3 次及以上） | 退避 30 秒后重置计数器 |
| 会话过期（`errcode=-14`） | 暂停 10 分钟（可能需要重新登录） |
| 超时 | 立即重新轮询（正常长轮询行为） |

### 去重

入站消息按消息 ID 在 5 分钟窗口期内去重，防止网络波动或重叠轮询响应导致重复处理。

### 令牌锁

同一时间只能有一个 Weixin 网关实例使用特定令牌。适配器启动时获取作用域锁，关闭时释放。若另一网关已使用该令牌，启动将失败并显示明确错误信息。

## 全部环境变量

| 变量 | 必需 | 默认值 | 说明 |
|----------|----------|---------|-------------|
| `WEIXIN_ACCOUNT_ID` | ✅ | — | iLink Bot 账号 ID（来自二维码登录） |
| `WEIXIN_TOKEN` | ✅ | — | iLink Bot 令牌（从二维码登录自动保存） |
| `WEIXIN_BASE_URL` | — | `https://ilinkai.weixin.qq.com` | iLink API 基础 URL |
| `WEIXIN_CDN_BASE_URL` | — | `https://novac2c.cdn.weixin.qq.com/c2c` | 媒体传输 CDN 基础 URL |
| `WEIXIN_DM_POLICY` | — | `open` | 私信访问策略：`open`、`allowlist`、`disabled`、`pairing` |
| `WEIXIN_GROUP_POLICY` | — | `disabled` | 群聊访问策略：`open`、`allowlist`、`disabled` |
| `WEIXIN_ALLOWED_USERS` | — | _(空)_ | 逗号分隔的 DM 白名单用户 ID |
| `WEIXIN_GROUP_ALLOWED_USERS` | — | _(空)_ | 逗号分隔的群聊白名单群组 ID |
| `WEIXIN_HOME_CHANNEL` | — | — | cron/通知输出的聊天 ID |
| `WEIXIN_HOME_CHANNEL_NAME` | — | `Home` | 主频道显示名称 |
| `WEIXIN_ALLOW_ALL_USERS` | — | — | 网关级标志，允许所有用户（由设置向导使用） |

## 故障排除

| 问题 | 解决方法 |
|---------|-----|
| `Weixin startup failed: aiohttp and cryptography are required` | 安装两者：`pip install aiohttp cryptography` |
| `Weixin startup failed: WEIXIN_TOKEN is required` | 运行 `hermes gateway setup` 完成二维码登录，或手动设置 `WEIXIN_TOKEN` |
| `Weixin startup failed: WEIXIN_ACCOUNT_ID is required` | 在 `.env` 中设置 `WEIXIN_ACCOUNT_ID` 或运行 `hermes gateway setup` |
| `Another local Hermes gateway is already using this Weixin token` | 先停止其他网关实例——每个令牌只允许一个轮询器 |
| Session expired (`errcode=-14`) | 您的登录会话已过期。重新运行 `hermes gateway setup` 扫描新二维码 |
| QR code expired during setup | 二维码最多自动刷新 3 次。若持续过期，请检查网络连接 |
| Bot doesn't respond to DMs | 检查 `WEIXIN_DM_POLICY` — 若设为 `allowlist`，则发件人必须在 `WEIXIN_ALLOWED_USERS` 中 |
| Bot ignores group messages | 群聊策略默认为 `disabled`。设置 `WEIXIN_GROUP_POLICY=open` 或 `allowlist` |
| Media download/upload fails | 确保安装了 `cryptography`。检查对 `novac2c.cdn.weixin.qq.com` 的网络访问 |
| `Blocked unsafe URL (SSRF protection)` | 出站媒体 URL 指向私有/内部地址。仅允许公共 URL |
| Voice messages show as text | 若微信提供转录文本，适配器会使用文本。这是预期行为 |
| Messages appear duplicated | 适配器按消息 ID 去重。若见重复，请检查是否运行了多个网关实例 |
| `iLink POST ... HTTP 4xx/5xx` | iLink 服务 API 错误。检查令牌有效性和网络连通性 |
| Terminal QR code doesn't render | 重新安装 messaging 扩展：`pip install hermes-agent[messaging]`。或打开上方打印的 URL |
---