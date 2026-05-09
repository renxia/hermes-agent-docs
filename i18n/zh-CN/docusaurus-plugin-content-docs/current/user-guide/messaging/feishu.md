---
sidebar_position: 11
title: "飞书 / Lark"
description: "将 Hermes 智能体设置为飞书或 Lark 机器人"
---

# 飞书 / Lark 设置

Hermes 智能体可以作为功能齐全的机器人集成到飞书和 Lark 中。连接后，您可以在私信或群聊中与智能体聊天，在主页聊天中接收定时任务结果，并通过正常的网关流程发送文本、图像、音频和文件附件。

该集成支持两种连接模式：

- `websocket` —— 推荐；Hermes 打开出站连接，您无需公共 Webhook 端点
- `webhook` —— 当您希望飞书/Lark 通过 HTTP 将事件推送到您的网关时非常有用

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| 私信 | Hermes 会回复每条消息。 |
| 群聊 | Hermes 仅在机器人被群聊中 @提及 时才会回复。 |
| 共享群聊 | 默认情况下，会话历史记录在共享聊天中按用户隔离。 |

此共享聊天行为由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您明确希望每个聊天只有一个共享对话时，才将其设置为 `false`。

## 步骤 1：创建飞书 / Lark 应用

### 推荐：扫码创建（一条命令）

```bash
hermes gateway setup
```

选择 **飞书 / Lark**，并使用飞书或 Lark 手机应用扫描二维码。Hermes 将自动创建一个具有正确权限的机器人应用，并保存凭据。

### 备选：手动设置

如果无法使用扫码创建，向导将回退到手动输入：

1. 打开飞书或 Lark 开发者控制台：
   - 飞书：[https://open.feishu.cn/](https://open.feishu.cn/)
   - Lark：[https://open.larksuite.com/](https://open.larksuite.com/)
2. 创建一个新应用。
3. 在 **凭据与基本信息** 中，复制 **应用 ID** 和 **应用密钥**。
4. 为该应用启用 **机器人** 能力。
5. 运行 `hermes gateway setup`，选择 **飞书 / Lark**，并在提示时输入凭据。

:::warning
请妥善保管应用密钥。任何拥有它的人都可以冒充你的应用。
:::

## 步骤 2：选择连接模式

### 推荐：WebSocket 模式

当 Hermes 运行在你的笔记本电脑、工作站或私有服务器上时，请使用 WebSocket 模式。无需公共 URL。官方 Lark SDK 会打开并维护一个持久的出站 WebSocket 连接，并支持自动重连。

```bash
FEISHU_CONNECTION_MODE=websocket
```

**要求：** 必须安装 `websockets` Python 包。SDK 内部处理连接生命周期、心跳和自动重连。

**工作原理：** 适配器在后台执行器线程中运行 Lark SDK 的 WebSocket 客户端。入站事件（消息、反应、卡片操作）将被分发到主 asyncio 循环。断开连接时，SDK 将尝试自动重连。

### 可选：Webhook 模式

仅当你已将 Hermes 部署在可访问的 HTTP 端点后方时，才使用 webhook 模式。

```bash
FEISHU_CONNECTION_MODE=webhook
```

在 webhook 模式下，Hermes 启动一个 HTTP 服务器（通过 `aiohttp`），并在以下路径提供飞书端点：

```text
/feishu/webhook
```

**要求：** 必须安装 `aiohttp` Python 包。

你可以自定义 webhook 服务器的绑定地址和路径：

```bash
FEISHU_WEBHOOK_HOST=127.0.0.1   # 默认：127.0.0.1
FEISHU_WEBHOOK_PORT=8765         # 默认：8765
FEISHU_WEBHOOK_PATH=/feishu/webhook  # 默认：/feishu/webhook
```

当飞书发送 URL 验证挑战（`type: url_verification`）时，webhook 会自动响应，以便你可以在飞书开发者控制台中完成订阅设置。

## 步骤 3：配置 Hermes

### 选项 A：交互式设置

```bash
hermes gateway setup
```

选择 **飞书 / Lark** 并填写提示信息。

### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env`：

```bash
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=secret_xxx
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket

# 可选但强烈建议
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
FEISHU_HOME_CHANNEL=oc_xxx
```

`FEISHU_DOMAIN` 可接受：

- `feishu` 表示飞书中国
- `lark` 表示 Lark 国际版

## 步骤 4：启动网关

```bash
hermes gateway
```

然后从飞书/Lark 向机器人发送消息，以确认连接处于活动状态。

## 主页聊天

在飞书/Lark 聊天中使用 `/set-home` 将其标记为定时任务结果和跨平台通知的主页频道。

你也可以预先配置它：

```bash
FEISHU_HOME_CHANNEL=oc_xxx
```

## 安全

### 用户白名单

在生产环境中，请设置飞书 Open ID 的白名单：

```bash
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
```

如果将白名单留空，任何能够访问机器人的人都可能使用它。在群聊中，消息处理前会检查发送者的 open_id 是否在白名单中。

### Webhook 加密密钥

在 webhook 模式下运行时，请设置加密密钥以启用对入站 webhook 载荷的签名验证：

```bash
FEISHU_ENCRYPT_KEY=your-encrypt-key
```

此密钥可在飞书应用配置的 **事件订阅** 部分找到。设置后，适配器将使用以下签名算法验证每个 webhook 请求：

```
SHA256(timestamp + nonce + encrypt_key + body)
```

计算出的哈希值将与 `x-lark-signature` 标头进行时序安全比较。签名无效或缺失的请求将被拒绝，并返回 HTTP 401。

:::tip
在 WebSocket 模式下，签名验证由 SDK 自身处理，因此 `FEISHU_ENCRYPT_KEY` 是可选的。在 webhook 模式下，强烈建议在生产环境中使用。
:::

### 验证令牌

额外的一层身份验证，用于检查 webhook 载荷中的 `token` 字段：

```bash
FEISHU_VERIFICATION_TOKEN=your-verification-token
```

此令牌也可在飞书应用的 **事件订阅** 部分找到。设置后，每个入站 webhook 载荷必须在其 `header` 对象中包含匹配的 `token`。不匹配的令牌将被拒绝，并返回 HTTP 401。

`FEISHU_ENCRYPT_KEY` 和 `FEISHU_VERIFICATION_TOKEN` 可以一起使用，以实现纵深防御。

## 群聊消息策略

`FEISHU_GROUP_POLICY` 环境变量控制 Hermes 是否在群聊中响应以及响应方式：

```bash
FEISHU_GROUP_POLICY=allowlist   # 默认
```

| 值 | 行为 |
|-------|----------|
| `open` | Hermes 响应任何群组中任何用户的 @提及。 |
| `allowlist` | Hermes 仅响应 `FEISHU_ALLOWED_USERS` 中列出的用户的 @提及。 |
| `disabled` | Hermes 完全忽略所有群聊消息。 |

在所有模式下，机器人必须被明确 @提及（或 @全体成员）后，消息才会被处理。私信始终绕过此限制。

设置 `FEISHU_REQUIRE_MENTION=false` 可让 Hermes 读取所有群聊流量，而无需 @提及：

```bash
FEISHU_REQUIRE_MENTION=false
```

如需按聊天控制，请在 `group_rules` 条目上设置 `require_mention` —— 参见下面的 [按群组访问控制](#per-group-access-control)。

### 机器人身份

Hermes 在启动时自动检测机器人的 `open_id` 和显示名称。仅当自动检测无法访问飞书 API，或你的应用使用租户范围的用户 ID 时，才需要手动设置这些值：

```bash
FEISHU_BOT_OPEN_ID=ou_xxx     # 仅在自动检测失败时
FEISHU_BOT_USER_ID=xxx        # 如果你的应用使用 sender_id_type=user_id，则为必需
FEISHU_BOT_NAME=MyBot         # 仅在自动检测失败时
```

## 机器人到机器人消息传递

默认情况下，Hermes 忽略其他机器人发送的消息。当你希望 Hermes 参与 A2A 编排或接收同一群组中其他机器人的通知时，请启用机器人到机器人消息传递。

```bash
FEISHU_ALLOW_BOTS=mentions   # 默认：none
```

| 值 | 行为 |
|-------|----------|
| `none` | 忽略所有来自其他机器人的消息（默认）。 |
| `mentions` | 仅当对手机器人 @提及 Hermes 时接受。 |
| `all` | 接受所有对手机器人的消息。 |

也可在 `config.yaml` 中配置为 `feishu.allow_bots`（当两者都设置时，环境变量优先）。

对手机器人无需添加到 `FEISHU_ALLOWED_USERS` —— 该白名单仅适用于人类发送者。

授予 `application:bot.basic_info:read` 权限以显示对手机器人名称；否则，对手机器人仍能正确路由，但显示为其 `open_id`。

## 交互式卡片操作

当用户点击按钮或与机器人发送的交互式卡片交互时，适配器会将这些操作路由为合成的 `/card` 命令事件：

- 按钮点击变为：`/card button {"key": "value", ...}`
- 卡片定义中的操作 `value` 载荷以 JSON 形式包含在内。
- 卡片操作在 15 分钟窗口内去重，以防止重复处理。

卡片操作事件以 `MessageType.COMMAND` 分发，因此它们会通过正常的命令处理流水线。

这也是 **命令审批** 的工作方式 —— 当智能体需要运行危险命令时，它会发送一个包含“允许一次 / 会话 / 始终 / 拒绝”按钮的交互式卡片。用户点击按钮后，卡片操作回调会将审批决定返回给智能体。

### 必需的飞书应用配置

交互式卡片需要在飞书开发者控制台中完成 **三个** 配置步骤。缺少其中任何一步都会导致用户点击卡片按钮时出现错误 **200340**。

1. **订阅卡片操作事件：**
   在 **事件订阅** 中，将 `card.action.trigger` 添加到你的订阅事件中。

2. **启用交互式卡片能力：**
   在 **应用功能 > 机器人** 中，确保启用 **交互式卡片** 开关。这告知飞书你的应用可以接收卡片操作回调。

3. **配置卡片请求 URL（仅限 webhook 模式）：**
   在 **应用功能 > 机器人 > 消息卡片请求 URL** 中，将 URL 设置为与你的事件 webhook 相同的端点（例如 `https://your-server:8765/feishu/webhook`）。在 WebSocket 模式下，SDK 会自动处理此设置。

:::warning
如果没有完成所有三个步骤，飞书将成功 *发送* 交互式卡片（发送仅需 `im:message:send` 权限），但点击任何按钮都会返回错误 200340。卡片看起来可以工作 —— 只有在用户与之交互时才会出现错误。
:::

## 文档评论智能回复

除了聊天功能，适配器还可以回复在 **飞书/Lark 文档** 上留下的 `@` 提及。当用户在文档上评论（选择局部文本或评论整个文档）并 @ 提及机器人时，Hermes 会读取文档内容及相关的评论线程，并在该线程中内联发布一个 LLM 回复。

由 `drive.notice.comment_add_v1` 事件驱动，该处理程序：

- 并行获取文档内容和评论时间线（整个文档线程获取 20 条消息，局部选择线程获取 12 条消息）。
- 在该评论会话范围内，使用 `feishu_doc` + `feishu_drive` 工具集运行智能体。
- 将回复按 4000 字符分块，并以线程回复的形式发回。
- 对每个文档会话缓存 1 小时，最多缓存 50 条消息，以便在同一文档上的后续评论能够保持上下文。

### 三层访问控制

文档评论回复采用**显式授权**模式，没有隐式的“全部允许”模式。权限按以下顺序解析（首次匹配生效，每个字段独立判断）：

1. **精确文档** — 规则限定于特定文档 token。
2. **通配符** — 规则匹配一类文档模式。
3. **顶级规则** — 工作区的默认规则。

每条规则支持两种策略：

- **`allowlist`** — 用户 / 租户的静态列表。
- **`pairing`** — 静态列表 ∪ 运行时批准的存储。适用于需要管理员实时授权访问的灰度发布场景。

规则存储在 `~/.hermes/feishu_comment_rules.json` 文件中（配对授权存储在 `~/.hermes/feishu_comment_pairing.json` 中），支持基于 mtime 的缓存热重载 — 编辑后无需重启网关，下一次评论事件即可生效。

CLI：

```bash
# 查看当前规则和配对状态
python -m gateway.platforms.feishu_comment_rules status

# 模拟针对特定文档 + 用户的访问检查
python -m gateway.platforms.feishu_comment_rules check <fileType:fileToken> <user_open_id>

# 运行时管理配对授权
python -m gateway.platforms.feishu_comment_rules pairing list
python -m gateway.platforms.feishu_comment_rules pairing add <user_open_id>
python -m gateway.platforms.feishu_comment_rules pairing remove <user_open_id>
```

### 必需的飞书应用配置

除了已授予的聊天/卡片权限外，还需添加文档评论事件：

- 在**事件订阅**中订阅 `drive.notice.comment_add_v1`。
- 授予 `docs:doc:readonly` 和 `drive:drive:readonly` 权限范围，以便处理程序能够读取文档内容。

## 媒体支持

### 入站（接收）

适配器接收并缓存用户发送的以下媒体类型：

| 类型 | 扩展名 | 处理方式 |
|------|--------|----------|
| **图像** | .jpg, .jpeg, .png, .gif, .webp, .bmp | 通过飞书 API 下载并本地缓存 |
| **音频** | .ogg, .mp3, .wav, .m4a, .aac, .flac, .opus, .webm | 下载并缓存；小型文本文件会自动提取 |
| **视频** | .mp4, .mov, .avi, .mkv, .webm, .m4v, .3gp | 下载并作为文档缓存 |
| **文件** | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx 等 | 下载并作为文档缓存 |

富文本（帖子）消息中的媒体，包括内联图像和文件附件，也会被提取并缓存。

对于小型基于文本的文档（.txt, .md），文件内容会自动注入到消息文本中，以便智能体无需使用工具即可直接读取。

### 出站（发送）

| 方法 | 发送内容 |
|------|----------|
| `send` | 文本或富文本帖子消息（根据 Markdown 内容自动检测） |
| `send_image` / `send_image_file` | 上传图像到飞书，然后以原生图像气泡形式发送（可选标题） |
| `send_document` | 上传文件到飞书 API，然后以文件附件形式发送 |
| `send_voice` | 上传音频文件作为飞书文件附件 |
| `send_video` | 上传视频并以原生媒体消息形式发送 |
| `send_animation` | GIF 会被降级为文件附件（飞书没有原生 GIF 气泡） |

文件上传路由根据扩展名自动进行：

- `.ogg`, `.opus` → 作为 `opus` 音频上传
- `.mp4`, `.mov`, `.avi`, `.m4v` → 作为 `mp4` 媒体上传
- `.pdf`, `.doc(x)`, `.xls(x)`, `.ppt(x)` → 以其文档类型上传
- 其他所有文件 → 作为通用流文件上传

## Markdown 渲染与 Post 消息降级

当出站文本包含 Markdown 格式（标题、粗体、列表、代码块、链接等）时，适配器会自动将其作为飞书 **post** 消息发送，并嵌入 `md` 标签，而不是纯文本。这使得飞书客户端能够进行富文本渲染。

如果飞书 API 拒绝了 post 消息负载（例如，由于不支持的 Markdown 结构），适配器会自动降级为发送去除 Markdown 格式的纯文本。这种两阶段降级机制确保消息始终能够送达。

纯文本消息（未检测到 Markdown）将作为简单的 `text` 消息类型发送。

## 处理状态反应

当智能体正在工作时，机器人会在您的消息上显示一个 `Typing`（正在输入）反应。当回复到达时，该反应会被清除；如果处理失败，则会替换为 `CrossMark`（叉号标记）。

设置 `FEISHU_REACTIONS=false` 可关闭此功能。

## 突发消息保护与批处理

适配器包含对快速消息突发的防抖机制，以避免压垮智能体：

### 文本批处理

当用户在短时间内发送多条文本消息时，这些消息会在发送前合并为一个事件：

| 设置项 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | 0.6 秒 |
| 每批最大消息数 | `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | 8 |
| 每批最大字符数 | `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | 4000 |

### 媒体批处理

在短时间内发送的多个媒体附件（例如，拖拽多张图片）会被合并为一个事件：

| 设置项 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 0.8 秒 |

### 每聊天串行化处理

同一聊天中的消息会串行处理（一次一条），以保持对话的连贯性。每个聊天都有其独立的锁，因此不同聊天中的消息可以并发处理。

## 速率限制（Webhook 模式）

在 Webhook 模式下，适配器会强制执行基于 IP 的速率限制，以防止滥用：

- **时间窗口：** 60 秒滑动窗口
- **限制：** 每个 (app_id, path, IP) 三元组每窗口 120 个请求
- **跟踪上限：** 最多跟踪 4096 个唯一键（防止内存无限增长）

超过限制的请求将收到 HTTP 429（请求过多）响应。

### Webhook 异常跟踪

适配器会跟踪每个 IP 地址的连续错误响应。如果在 6 小时窗口内，同一 IP 连续出现 25 次错误，则会记录一条警告。这有助于检测配置错误的客户端或探测尝试。

其他 Webhook 保护机制：
- **正文大小限制：** 最大 1 MB
- **正文读取超时：** 30 秒
- **Content-Type 强制要求：** 仅接受 `application/json`

## WebSocket 调优

使用 `websocket` 模式时，您可以自定义重连和心跳行为：

```yaml
platforms:
  feishu:
    extra:
      ws_reconnect_interval: 120   # 重连尝试间隔（秒）（默认：120）
      ws_ping_interval: 30         # WebSocket 心跳间隔（秒）（可选；未设置时使用 SDK 默认值）
```

| 设置项 | 配置键 | 默认值 | 描述 |
|---------|-----------|---------|-------------|
| 重连间隔 | `ws_reconnect_interval` | 120 秒 | 重连尝试之间的等待时间 |
| 心跳间隔 | `ws_ping_interval` | _（SDK 默认值）_ | WebSocket 保活心跳的频率 |

## 每群组访问控制

除了全局的 `FEISHU_GROUP_POLICY` 外，您还可以在 `config.yaml` 中使用 `group_rules` 为每个群组聊天设置细粒度规则：

```yaml
platforms:
  feishu:
    extra:
      default_group_policy: "open"     # 未在 group_rules 中的群组的默认策略
      admins:                          # 可管理机器人设置的用户
        - "ou_admin_open_id"
      group_rules:
        "oc_group_chat_id_1":
          policy: "allowlist"          # open | allowlist | blacklist | admin_only | disabled
          allowlist:
            - "ou_user_open_id_1"
            - "ou_user_open_id_2"
        "oc_group_chat_id_2":
          policy: "admin_only"
        "oc_group_chat_id_3":
          policy: "blacklist"
          blacklist:
            - "ou_blocked_user"
        "oc_free_chat":
          policy: "open"
          require_mention: false       # 覆盖此聊天的 FEISHU_REQUIRE_MENTION 设置
```

| 策略 | 描述 |
|--------|-------------|
| `open` | 群组中任何人都可以使用机器人 |
| `allowlist` | 只有群组 `allowlist`（白名单）中的用户才能使用机器人 |
| `blacklist` | 除了群组 `blacklist`（黑名单）中的用户外，其他人都可以使用机器人 |
| `admin_only` | 只有全局 `admins` 列表中的用户才能在此群组中使用机器人 |
| `disabled` | 机器人忽略此群组中的所有消息 |

在 `group_rules` 条目上设置 `require_mention: false` 可跳过该特定聊天的 @提及 要求。如果省略，则该聊天继承全局 `FEISHU_REQUIRE_MENTION` 的值。

未在 `group_rules` 中列出的群组将回退到 `default_group_policy`（默认为 `FEISHU_GROUP_POLICY` 的值）。

## 去重

入站消息会使用消息 ID 进行去重，并设置 24 小时的 TTL（生存时间）。去重状态会在重启后持久化到 `~/.hermes/feishu_seen_message_ids.json`。

| 设置项 | 环境变量 | 默认值 |
|---------|---------|---------|
| 缓存大小 | `HERMES_FEISHU_DEDUP_CACHE_SIZE` | 2048 个条目 |

## 所有环境变量

| 变量 | 必填 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `FEISHU_APP_ID` | ✅ | — | 飞书/Lark 应用 ID |
| `FEISHU_APP_SECRET` | ✅ | — | 飞书/Lark 应用密钥 |
| `FEISHU_DOMAIN` | — | `feishu` | `feishu`（中国）或 `lark`（国际） |
| `FEISHU_CONNECTION_MODE` | — | `websocket` | `websocket` 或 `webhook` |
| `FEISHU_ALLOWED_USERS` | — | _（空）_ | 用户白名单的 open_id 列表，以逗号分隔 |
| `FEISHU_ALLOW_BOTS` | — | `none` | 是否接受来自其他机器人的消息：`none`、`mentions` 或 `all` |
| `FEISHU_REQUIRE_MENTION` | — | `true` | 群组消息是否必须 @提及 机器人 |
| `FEISHU_HOME_CHANNEL` | — | — | 用于 cron/通知输出的聊天 ID |
| `FEISHU_ENCRYPT_KEY` | — | _（空）_ | Webhook 签名验证的加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | — | _（空）_ | Webhook 负载认证的验证令牌 |
| `FEISHU_GROUP_POLICY` | — | `allowlist` | 群组消息策略：`open`、`allowlist`、`disabled` |
| `FEISHU_BOT_OPEN_ID` | — | _（空）_ | 机器人的 open_id（用于 @提及 检测） |
| `FEISHU_BOT_USER_ID` | — | _（空）_ | 机器人的 user_id（用于 @提及 检测） |
| `FEISHU_BOT_NAME` | — | _（空）_ | 机器人的显示名称（用于 @提及 检测） |
| `FEISHU_WEBHOOK_HOST` | — | `127.0.0.1` | Webhook 服务器绑定地址 |
| `FEISHU_WEBHOOK_PORT` | — | `8765` | Webhook 服务器端口 |
| `FEISHU_WEBHOOK_PATH` | — | `/feishu/webhook` | Webhook 端点路径 |
| `HERMES_FEISHU_DEDUP_CACHE_SIZE` | — | `2048` | 最多跟踪的去重消息 ID 数量 |
| `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | — | `0.6` | 文本突发防抖静默期 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | — | `8` | 每批文本合并的最大消息数 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | — | `4000` | 每批文本合并的最大字符数 |
| `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | — | `0.8` | 媒体突发防抖静默期 |

WebSocket 和每群组 ACL 设置通过 `config.yaml` 中的 `platforms.feishu.extra` 配置（参见上文的 [WebSocket 调优](#websocket-tuning) 和 [每群组访问控制](#per-group-access-control)）。

## 故障排除

| 问题 | 解决方案 |
|---------|-----|
| `lark-oapi 未安装` | 安装 SDK：`pip install lark-oapi` |
| `websockets 未安装；websocket 模式不可用` | 安装 websockets：`pip install websockets` |
| `aiohttp 未安装；webhook 模式不可用` | 安装 aiohttp：`pip install aiohttp` |
| `FEISHU_APP_ID 或 FEISHU_APP_SECRET 未设置` | 设置这两个环境变量，或通过 `hermes gateway setup` 配置 |
| `另一个本地 Hermes 网关已在使用此 Feishu app_id` | 同一时间只能有一个 Hermes 实例使用相同的 app_id。请先停止其他网关。 |
| 机器人在群组中无响应 | 确保机器人被 @提及，检查 `FEISHU_GROUP_POLICY`，并验证发送者是否在 `FEISHU_ALLOWED_USERS` 中（如果策略为 `allowlist`） |
| `Webhook 被拒绝：无效的验证令牌` | 确保 `FEISHU_VERIFICATION_TOKEN` 与飞书应用“事件订阅”配置中的令牌匹配 |
| `Webhook 被拒绝：无效的签名` | 确保 `FEISHU_ENCRYPT_KEY` 与飞书应用配置中的加密密钥匹配 |
| Post 消息显示为纯文本 | 飞书 API 拒绝了 post 消息负载；这是正常的降级行为。请检查日志以获取详细信息。 |
| 机器人未收到图片/文件 | 为您的飞书应用授予 `im:message` 和 `im:resource` 权限范围 |
| 机器人身份未自动检测 | 通常是访问飞书机器人信息端点的临时网络问题。请手动设置 `FEISHU_BOT_OPEN_ID` 和 `FEISHU_BOT_NAME` 作为临时解决方案。 |
| 启用 `FEISHU_ALLOW_BOTS` 后，仍忽略对等机器人消息 | Hermes 尚无法识别自身 — 请设置 `FEISHU_BOT_OPEN_ID`（如果您的应用使用 `sender_id_type=user_id`，则还需设置 `FEISHU_BOT_USER_ID`）。 |
| 对等机器人显示为 `ou_xxxxxx` 而不是名称 | 授予 `application:bot.basic_info:read` 权限范围。 |
| 点击审批按钮时出现错误 200340 | 在飞书开发者控制台中启用 **Interactive Card**（交互式卡片）功能并配置 **Card Request URL**（卡片请求 URL）。参见上文的 [必需的飞书应用配置](#required-feishu-app-configuration)。 |
| `Webhook 速率限制 exceeded` | 来自同一 IP 的请求超过每分钟 120 个。这通常是配置错误或循环导致的。 |

## 工具集

飞书 / Lark 使用 `hermes-feishu` 平台预设，其中包含与 Telegram 和其他基于网关的 messaging 平台相同的核心工具。