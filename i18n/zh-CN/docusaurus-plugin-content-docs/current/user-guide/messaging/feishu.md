---
sidebar_position: 11
title: "飞书 / Lark"
description: "将 Hermes Agent 设置为飞书或 Lark 机器人"
---

# 飞书 / Lark 配置

Hermes Agent 与飞书和 Lark 深度集成，作为一个功能完整的机器人。连接后，您可以在私信或群聊中与代理对话，在主页聊天中接收定时任务结果，并通过常规网关流程发送文本、图片、音频和文件附件。

该集成支持两种连接方式：

- `websocket` — 推荐使用；Hermes 主动建立出站连接，无需公开 webhook 端点
- `webhook` — 当您希望飞书/Lark 通过 HTTP 向您的网关推送事件时适用

## Hermes 的行为模式

| 上下文 | 行为 |
|---------|----------|
| 私信 | Hermes 会回复每一条消息。 |
| 群聊 | Hermes 仅在机器人被 @ 提及时才回复。 |
| 共享群聊 | 默认情况下，每个用户在共享群聊中的会话历史是隔离的。 |

此共享群聊行为由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您需要为每个群聊设置一个共享对话时才将其设为 `false`。

## 步骤 1：创建飞书 / Lark 应用

### 推荐方式：扫码创建（一条命令）

```bash
hermes gateway setup
```

选择 **飞书 / Lark** 并使用飞书或 Lark 移动应用扫描 QR 码。Hermes 会自动创建一个具有正确权限的机器人应用并保存凭据。

### 备选方式：手动配置

如果无法使用扫码创建，向导将回退到手动输入：

1. 打开飞书或 Lark 开发者控制台：
   - 飞书：[https://open.feishu.cn/](https://open.feishu.cn/)
   - Lark：[https://open.larksuite.com/](https://open.larksuite.com/)
2. 创建一个新的应用。
3. 在 **凭据与基本信息** 中，复制 **App ID** 和 **App Secret**。
4. 为该应用启用 **机器人** 能力。
5. 运行 `hermes gateway setup`，选择 **飞书 / Lark**，并在提示时输入凭据。

:::warning
请妥善保管 App Secret。任何拥有它的人都可以冒充您的应用。
:::

## 步骤 2：选择连接方式

### 推荐方式：WebSocket 模式

当 Hermes 运行在笔记本、工作站或私有服务器上时使用 WebSocket 模式。不需要公网 URL。官方 Lark SDK 会打开并保持持久的出站 WebSocket 连接，并支持自动重连。

```bash
FEISHU_CONNECTION_MODE=websocket
```

**要求：** 必须安装 `websockets` Python 包。SDK 内部处理连接生命周期、心跳检测和自动重连。

**工作原理：** 适配器会在后台执行线程中运行 Lark SDK 的 WebSocket 客户端。入站事件（消息、反应、卡片操作）会被分发到主 asyncio 循环。断开连接时，SDK 会自动尝试重新连接。

### 可选方式：Webhook 模式

仅当您已在可访问的 HTTP 端点后运行 Hermes 时才使用 Webhook 模式。

```bash
FEISHU_CONNECTION_MODE=webhook
```

在 Webhook 模式下，Hermes 会启动一个 HTTP 服务器（通过 `aiohttp`），并提供以下飞书端点：

```text
/feishu/webhook
```

**要求：** 必须安装 `aiohttp` Python 包。

您可以自定义 webhook 服务器的绑定地址和路径：

```bash
FEISHU_WEBHOOK_HOST=127.0.0.1   # 默认值：127.0.0.1
FEISHU_WEBHOOK_PORT=8765         # 默认值：8765
FEISHU_WEBHOOK_PATH=/feishu/webhook  # 默认值：/feishu/webhook
```

当飞书发送 URL 验证挑战（`type: url_verification`）时，webhook 会自动响应，以便您能在飞书开发者控制台中完成订阅设置。

## 步骤 3：配置 Hermes

### 选项 A：交互式设置

```bash
hermes gateway setup
```

选择 **飞书 / Lark** 并按提示填写信息。

### 选项 B：手动配置

在 `~/.hermes/.env` 中添加以下内容：

```bash
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=secret_xxx
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket

# 可选但强烈推荐
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
FEISHU_HOME_CHANNEL=oc_xxx
```

`FEISHU_DOMAIN` 接受以下值：

- `feishu` 表示飞书中国版
- `lark` 表示 Lark 国际版

## 步骤 4：启动网关

```bash
hermes gateway
```

然后从飞书/Lark 向机器人发送消息以确认连接已建立。

## 主页聊天

在飞书/Lark 聊天中使用 `/set-home` 命令将其标记为定时任务和跨平台通知的主频道。

您也可以预先配置它：

```bash
FEISHU_HOME_CHANNEL=oc_xxx
```

## 安全性

### 用户白名单

在生产环境中，请设置飞书 Open ID 的白名单：

```bash
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
```

如果您留空白名单，任何能够访问机器人的用户都可能使用它。在群聊中，系统会在处理消息前检查发送者的 open_id 是否在白名单中。

### Webhook 加密密钥

在 webhook 模式下运行时，请设置一个加密密钥以启用对入站 webhook 载荷的签名验证：

```bash
FEISHU_ENCRYPT_KEY=your-encrypt-key
```

此密钥可在飞书应用的 **事件订阅** 部分找到。设置后，适配器会使用以下算法验证每个 webhook 请求：

```
SHA256(timestamp + nonce + encrypt_key + body)
```

计算出的哈希值将与 `x-lark-signature` 头进行时序安全的比较。无效或缺失签名的请求将被拒绝并返回 HTTP 401。

:::tip
在 WebSocket 模式下，签名验证由 SDK 自身处理，因此 `FEISHU_ENCRYPT_KEY` 是可选的。在 webhook 模式下，强烈建议用于生产环境。
:::

### 验证令牌

额外的身份验证层，用于检查 webhook 载荷中的 `token` 字段：

```bash
FEISHU_VERIFICATION_TOKEN=your-verification-token
```

此令牌同样可在飞书应用的 **事件订阅** 部分找到。设置后，每个入站 webhook 载荷必须在 `header` 对象中包含匹配的 `token`。不匹配的令牌将被拒绝并返回 HTTP 401。

可以同时使用 `FEISHU_ENCRYPT_KEY` 和 `FEISHU_VERIFICATION_TOKEN` 实现纵深防御。

## 群消息策略

环境变量 `FEISHU_GROUP_POLICY` 控制 Hermes 是否在群聊中以及如何响应：

```bash
FEISHU_GROUP_POLICY=allowlist   # 默认值
```

| 值 | 行为 |
|-------|----------|
| `open` | Hermes 会对任何群聊中用户的 @ 提及做出响应。 |
| `allowlist` | Hermes 只对 `FEISHU_ALLOWED_USERS` 列表中列出的用户的 @ 提及做出响应。 |
| `disabled` | Hermes 完全忽略所有群消息。 |

在所有模式下，机器人都必须被明确 @ 提及（或 @all）才能处理消息。私信绕过此限制。

### 机器人身份用于 @ 提及检测

为了精确检测群聊中的 @ 提及，适配器需要知道机器人的身份。可以显式提供：

```bash
FEISHU_BOT_OPEN_ID=ou_xxx
FEISHU_BOT_USER_ID=xxx
FEISHU_BOT_NAME=MyBot
```

如果均未设置，适配器会在启动时尝试通过应用信息 API 自动发现机器人名称。为此，请授予 `admin:app.info:readonly` 或 `application:application:self_manage` 权限范围。

## 交互式卡片操作

当用户点击机器人发送的按钮或与交互式卡片交互时，适配器会将这些操作路由为合成的 `/card` 命令事件：

- 按钮点击变为：`/card button {"key": "value", ...}`
- 卡片定义中的 `value` 载荷作为 JSON 包含在内。
- 卡片操作会在 15 分钟窗口内去重，防止重复处理。

卡片操作事件以 `MessageType.COMMAND` 分发，因此它们会通过正常的命令处理管道。

这也是 **命令审批** 的工作原理——当代理需要运行危险命令时，它会发送一个带有允许一次/会话/总是/拒绝按钮的交互式卡片。用户点击按钮后，卡片操作回调会将审批决定传回给代理。

### 必需的飞书应用配置

交互式卡片需要在飞书开发者控制台中完成 **三步** 配置。缺少其中任何一步都会导致用户点击卡片按钮时出现错误 **200340**。

1. **订阅卡片操作事件：**
   在 **事件订阅** 中，添加 `card.action.trigger` 到您的订阅事件中。

2. **启用交互式卡片能力：**
   在 **应用功能 > 机器人** 中，确保 **交互式卡片** 开关已启用。这告诉飞书您的应用可以接收卡片操作回调。

3. **配置卡片请求 URL（仅限 webhook 模式）：**
   在 **应用功能 > 机器人 > 消息卡片请求 URL** 中，将此 URL 设置为与您的事件 webhook 相同的端点（例如 `https://your-server:8765/feishu/webhook`）。在 WebSocket 模式下此由 SDK 自动处理。

:::warning
如果未完成以上三步，飞书仍能成功 *发送* 交互式卡片（发送只需 `im:message:send` 权限），但点击任何按钮都会返回错误 200340。卡片看起来能工作——错误只在用户与之交互时才显现。
:::

## 文档评论智能回复

除了聊天，适配器还能回答在 **飞书/Lark 文档** 中留下的 `@` 提及。当用户对文档发表评论（局部文本选择或全文评论）并 @ 提及机器人时，Hermes 会读取文档内容以及周围的评论线程，并在该线程中发布 LLM 回复。

基于 `drive.notice.comment_add_v1` 事件，处理器：

- 并行获取文档内容和评论时间线（全文线程最多 20 条消息，局部选择线程最多 12 条）。
- 使用 `feishu_doc` + `feishu_drive` 工具集运行代理，范围限定为该单条评论会话。
- 将回复分块至 4000 字符并作为嵌套回复发布。
- 为每个文档缓存会话 1 小时，最多 50 条消息，以便同一文档上的后续评论保持上下文。

### 三级访问控制

文档评论回复是 **显式授权** 的——没有隐式允许所有模式。权限按以下顺序解析（每个字段取第一个匹配项）：

1. **精确文档** — 针对特定文档 token 的规则。
2. **通配符** — 匹配文档模式的规则。
3. **顶级** — 工作区的默认规则。

每条规则有两种策略：

- **`allowlist`** — 静态用户/租户列表。
- **`pairing`** — 静态列表 ∪ 运行时批准的存储。适用于试点阶段，管理员可实时授予访问权限。

规则位于 `~/.hermes/feishu_comment_rules.json`（配对授权在 `~/.hermes/feishu_comment_pairing.json`）中，支持 mtime 缓存热重载——编辑后下次评论事件生效而无需重启网关。

CLI：

```bash
# 查看当前规则和配对状态
python -m gateway.platforms.feishu_comment_rules status

# 模拟检查特定文档 + 用户的访问权限
python -m gateway.platforms.feishu_comment_rules check <fileType:fileToken> <user_open_id>

# 管理运行时配对授权
python -m gateway.platforms.feishu_comment_rules pairing list
python -m gateway.platforms.feishu_comment_rules pairing add <user_open_id>
python -m gateway.platforms.feishu_comment_rules pairing remove <user_open_id>
```

### 必需的飞书应用配置

除了已授予的聊天/卡片权限外，还需添加驱动评论事件：

- 在 **事件订阅** 中订阅 `drive.notice.comment_add_v1`。
- 授予 `docs:doc:readonly` 和 `drive:drive:readonly` 范围，以便处理器读取文档内容。

## 媒体支持

### 入站（接收）

适配器从用户处接收并缓存以下媒体类型：

| 类型 | 扩展名 | 处理方式 |
|------|-----------|-------------------|
| **图片** | .jpg, .jpeg, .png, .gif, .webp, .bmp | 通过飞书 API 下载并本地缓存 |
| **音频** | .ogg, .mp3, .wav, .m4a, .aac, .flac, .opus, .webm | 下载并缓存；小文本文件会自动提取 |
| **视频** | .mp4, .mov, .avi, .mkv, .webm, .m4v, .3gp | 作为文档下载并缓存 |
| **文件** | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx 等 | 作为文档下载并缓存 |

富文本（帖子）消息中的内联图片和文件附件也会被提取和缓存。

对于小型文本文档（.txt, .md），文件内容会自动注入到消息文本中，以便代理直接读取而无需工具。

### 出站（发送）

| 方法 | 发送内容 |
|--------|--------------|
| `send` | 文本或富帖子消息（根据 markdown 内容自动检测） |
| `send_image` / `send_image_file` | 上传图片到飞书，然后作为原生图片气泡发送（可选标题） |
| `send_document` | 上传到飞书 API，然后作为文件附件发送 |
| `send_voice` | 上传音频文件作为飞书文件附件 |
| `send_video` | 上传视频并作为原生媒体消息发送 |
| `send_animation` | GIF 降级为文件附件（飞书无原生 GIF 气泡） |

文件上传路由基于扩展名自动判断：

- `.ogg`, `.opus` → 作为 `opus` 音频上传
- `.mp4`, `.mov`, `.avi`, `.m4v` → 作为 `mp4` 媒体上传
- `.pdf`, `.doc(x)`, `.xls(x)`, `.ppt(x)` → 以其文档类型上传
- 其他 → 作为通用流文件上传

## Markdown 渲染与帖子回退

当出站文本包含 markdown 格式化（标题、粗体、列表、代码块、链接等）时，适配器会自动将其作为飞书的 **帖子** 消息发送，并嵌入 `md` 标签，而不是纯文本。这使得飞书客户端能够进行丰富的渲染。

如果飞书 API 拒绝了帖子载荷（例如由于不支持的 markdown 构造），适配器会自动回退为发送剥离了 markdown 的纯文本。这种两阶段回退确保消息总能送达。

未检测到 markdown 的纯文本消息会作为简单的 `text` 消息类型发送。

## ACK 表情反应

当适配器接收到入站消息时，会立即添加一个 ✅（OK）表情反应，以表明消息已被接收并正在处理。这提供了代理完成响应前的视觉反馈。

该反应是持久的——响应发送后仍保留在消息上，作为收据标记。

用户对机器人消息的表情反应也会被跟踪。如果用户在机器人发送的消息上添加或移除了表情反应，它会被路由为合成的文本事件（`reaction:added:EMOJI_TYPE` 或 `reaction:removed:EMOJI_TYPE`），以便代理能响应用户反馈。

## 突发保护与批处理

适配器包含对快速消息突发的防抖处理，以避免压垮代理：

### 文本批处理

当用户快速连续发送多条文本消息时，它们会被合并为一个事件后再分发：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | 0.6秒 |
| 每批最大消息数 | `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | 8 |
| 每批最大字符数 | `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | 4000 |

### 媒体批处理

快速连续发送的多媒体附件（例如拖拽多个图片）会被合并为单个事件：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 0.8秒 |

### 按聊天串行化

同一聊天中的消息会串行处理（一次一条）以保持对话连贯性。每个聊天都有自己的锁，因此不同聊天的消息可以并发处理。

## 速率限制（Webhook 模式）

在 webhook 模式下，适配器会对每个 IP 实施速率限制以防止滥用：

- **窗口：** 60 秒滑动窗口
- **限制：** 每个 (app_id, path, IP) 三元组每分钟最多 120 次请求
- **跟踪上限：** 最多跟踪 4096 个唯一键（防止内存无限增长）

超出限制的请求会收到 HTTP 429（Too Many Requests）。

### Webhook 异常跟踪

适配器会跟踪每个 IP 地址的连续错误响应。如果在 6 小时内同一 IP 出现 25 次连续错误，则会记录警告。这有助于检测配置错误的客户端或探测尝试。

额外的 webhook 保护措施：
- **载荷大小限制：** 最大 1 MB
- **载荷读取超时：** 30 秒
- **Content-Type 强制：** 仅接受 `application/json`

## WebSocket 调优

在使用 `websocket` 模式时，您可以自定义重连和 ping 行为：

```yaml
platforms:
  feishu:
    extra:
      ws_reconnect_interval: 120   # 重连尝试间隔（秒）（默认值：120）
      ws_ping_interval: 30         # WebSocket ping 间隔（可选；未设置时使用 SDK 默认值）
```

| 设置 | 配置键 | 默认值 | 说明 |
|---------|-----------|---------|-------------|
| 重连间隔 | `ws_reconnect_interval` | 120秒 | 两次重连尝试之间的等待时间 |
| Ping 间隔 | `ws_ping_interval` | _(SDK 默认值)_ | WebSocket 保活 ping 频率 |

## 按群组访问控制

除了全局的 `FEISHU_GROUP_POLICY` 外，您还可以在 config.yaml 中使用 `group_rules` 为每个群聊设置细粒度规则：

```yaml
platforms:
  feishu:
    extra:
      default_group_policy: "open"     # 不在 group_rules 中的群组的默认策略
      admins:                          # 可以管理机器人设置的用户
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
```

| 策略 | 说明 |
|--------|-------------|
| `open` | 群聊中任何人都可以使用机器人 |
| `allowlist` | 只有群聊中 `allowlist` 里的用户可以使用机器人 |
| `blacklist` | 除了群聊中 `blacklist` 里的用户外，其他人都可以使用机器人 |
| `admin_only` | 只有全局 `admins` 列表中的用户可以在这个群聊中使用机器人 |
| `disabled` | 机器人在此群聊中忽略所有消息 |

未在 `group_rules` 中列出的群聊会回退到 `default_group_policy`（默认为 `FEISHU_GROUP_POLICY` 的值）。

## 去重

入站消息会使用消息 ID 进行去重，TTL 为 24 小时。去重状态会跨重启持久化到 `~/.hermes/feishu_seen_message_ids.json`。

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 缓存大小 | `HERMES_FEISHU_DEDUP_CACHE_SIZE` | 2048 条目 |

## 所有环境变量

| 变量 | 必需 | 默认值 | 说明 |
|----------|----------|---------|-------------|
| `FEISHU_APP_ID` | ✅ | — | 飞书/Lark App ID |
| `FEISHU_APP_SECRET` | ✅ | — | 飞书/Lark App Secret |
| `FEISHU_DOMAIN` | — | `feishu` | `feishu`（中国版）或 `lark`（国际版） |
| `FEISHU_CONNECTION_MODE` | — | `websocket` | `websocket` 或 `webhook` |
| `FEISHU_ALLOWED_USERS` | — | _(空)_ | 逗号分隔的 open_id 列表，用于用户白名单 |
| `FEISHU_HOME_CHANNEL` | — | — | 定时/通知输出的聊天 ID |
| `FEISHU_ENCRYPT_KEY` | — | _(空)_ | Webhook 签名验证的加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | — | _(空)_ | Webhook 载荷认证的验证令牌 |
| `FEISHU_GROUP_POLICY` | — | `allowlist` | 群消息策略：`open`、`allowlist`、`disabled` |
| `FEISHU_BOT_OPEN_ID` | — | _(空)_ | 机器人的 open_id（用于 @ 提及检测） |
| `FEISHU_BOT_USER_ID` | — | _(空)_ | 机器人的 user_id（用于 @ 提及检测） |
| `FEISHU_BOT_NAME` | — | _(空)_ | 机器人的显示名称（用于 @ 提及检测） |
| `FEISHU_WEBHOOK_HOST` | — | `127.0.0.1` | Webhook 服务器绑定地址 |
| `FEISHU_WEBHOOK_PORT` | — | `8765` | Webhook 服务器端口 |
| `FEISHU_WEBHOOK_PATH` | — | `/feishu/webhook` | Webhook 端点路径 |
| `HERMES_FEISHU_DEDUP_CACHE_SIZE` | — | `2048` | 要跟踪的最大去重消息 ID 数量 |
| `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | — | `0.6` | 文本突发防抖静默期 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | — | `8` | 每批合并的最大文本消息数 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | — | `4000` | 每批合并的最大文本字符数 |
| `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | — | `0.8` | 媒体突发防抖静默期 |

WebSocket 和按群组 ACL 设置通过 `config.yaml` 下的 `platforms.feishu.extra` 配置（参见上文 [WebSocket 调优](#websocket-tuning) 和 [按群组访问控制](#per-group-access-control)）。

## 故障排除

| 问题 | 修复 |
|---------|-----|
| `lark-oapi not installed` | 安装 SDK：`pip install lark-oapi` |
| `websockets not installed; websocket mode unavailable` | 安装 websockets：`pip install websockets` |
| `aiohttp not installed; webhook mode unavailable` | 安装 aiohttp：`pip install aiohttp` |
| `FEISHU_APP_ID or FEISHU_APP_SECRET not set` | 设置两个环境变量或通过 `hermes gateway setup` 配置 |
| `Another local Hermes gateway is already using this Feishu app_id` | 同一时间只能有一个 Hermes 实例使用相同的 app_id。请先停止另一个网关。 |
| 机器人在群聊中不响应 | 确保机器人被 @ 提及，检查 `FEISHU_GROUP_POLICY`，并验证发送者是否在 `FEISHU_ALLOWED_USERS` 中（如果策略是 `allowlist`） |
| `Webhook rejected: invalid verification token` | 确保 `FEISHU_VERIFICATION_TOKEN` 与飞书应用中事件订阅配置的令牌匹配 |
| `Webhook rejected: invalid signature` | 确保 `FEISHU_ENCRYPT_KEY` 与飞书应用配置中的加密密钥匹配 |
| 帖子消息显示为纯文本 | 飞书 API 拒绝了帖子载荷；这是正常回退行为。请查看日志了解详情。 |
| 图片/文件未被机器人接收 | 为您的飞书应用授予 `im:message` 和 `im:resource` 权限范围 |
| 机器人身份未自动检测 | 授予 `admin:app.info:readonly` 范围，或手动设置 `FEISHU_BOT_OPEN_ID` / `FEISHU_BOT_NAME` |
| 点击审批按钮时报错 200340 | 在飞书开发者控制台中启用 **交互式卡片** 能力并配置 **卡片请求 URL**。参见上文 [必需的飞书应用配置](#required-feishu-app-configuration)。 |
| `Webhook rate limit exceeded` | 同一 IP 每分钟超过 120 次请求。这通常是配置错误或循环导致的。 |

## 工具集

飞书 / Lark 使用 `hermes-feishu` 平台预设，其中包含与 Telegram 和其他基于网关的消息平台相同的核心工具。