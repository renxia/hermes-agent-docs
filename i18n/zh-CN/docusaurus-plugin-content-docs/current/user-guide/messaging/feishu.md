---
sidebar_position: 11
title: "飞书 / Lark"
description: "将 Hermes 智能体设置为飞书或 Lark 机器人"
---

# 飞书 / Lark 设置

Hermes 智能体可以作为功能完整的机器人集成到飞书和 Lark 中。连接后，你可以在私信或群聊中与智能体对话，在首页聊天中接收定时任务结果，并通过常规网关流程发送文本、图像、音频和文件附件。

该集成支持两种连接模式：

- `websocket` —— 推荐；Hermes 建立出站连接，你无需公共 Webhook 端点
- `webhook` —— 当你希望飞书/Lark 通过 HTTP 将事件推送到你的网关时有用

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| 私信 | Hermes 回复每条消息。 |
| 群聊 | Hermes 仅在机器人被 @提及 时回复。 |
| 共享群聊 | 默认情况下，会话历史在共享聊天中按用户隔离。 |

此共享聊天行为由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当你明确希望每个聊天只有一个共享对话时，才将其设置为 `false`。

## 步骤 1：创建飞书 / Lark 应用

### 推荐：扫码创建（一条命令）

```bash
hermes gateway setup
```

选择 **飞书 / Lark**，并使用飞书或 Lark 移动应用扫描二维码。Hermes 将自动创建一个具有正确权限的机器人应用，并保存凭据。

### 替代方案：手动设置

如果无法扫码创建，向导将回退到手动输入：

1. 打开飞书或 Lark 开发者控制台：
   - 飞书: [https://open.feishu.cn/](https://open.feishu.cn/)
   - Lark: [https://open.larksuite.com/](https://open.larksuite.com/)
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

**工作原理：** 适配器在后台执行器线程中运行 Lark SDK 的 WebSocket 客户端。入站事件（消息、反应、卡片操作）被分发到主 asyncio 循环。断开连接时，SDK 将尝试自动重连。

### 可选：Webhook 模式

仅当你已在可访问的 HTTP 端点后运行 Hermes 时，才使用 Webhook 模式。

```bash
FEISHU_CONNECTION_MODE=webhook
```

在 Webhook 模式下，Hermes 启动一个 HTTP 服务器（通过 `aiohttp`），并在以下路径提供飞书端点：

```text
/feishu/webhook
```

**要求：** 必须安装 `aiohttp` Python 包。

你可以自定义 Webhook 服务器绑定地址和路径：

```bash
FEISHU_WEBHOOK_HOST=127.0.0.1   # 默认: 127.0.0.1
FEISHU_WEBHOOK_PORT=8765         # 默认: 8765
FEISHU_WEBHOOK_PATH=/feishu/webhook  # 默认: /feishu/webhook
```

当飞书发送 URL 验证挑战（`type: url_verification`）时，Webhook 会自动响应，以便你可以在飞书开发者控制台中完成订阅设置。

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

## 首页聊天

在飞书/Lark 聊天中使用 `/set-home` 将其标记为定时任务结果和跨平台通知的首页频道。

你也可以预先配置：

```bash
FEISHU_HOME_CHANNEL=oc_xxx
```

## 安全

### 用户白名单

在生产环境中，请设置飞书 Open ID 的白名单：

```bash
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
```

如果白名单为空，任何可以访问机器人的人都可以使用它。在群聊中，消息处理前会检查发送者的 open_id 是否在白名单中。

### Webhook 加密密钥

在 Webhook 模式下运行时，请设置加密密钥以启用入站 Webhook 载荷的签名验证：

```bash
FEISHU_ENCRYPT_KEY=your-encrypt-key
```

此密钥可在飞书应用配置的 **事件订阅** 部分找到。设置后，适配器将使用以下签名算法验证每个 Webhook 请求：

```
SHA256(timestamp + nonce + encrypt_key + body)
```

计算出的哈希值将与 `x-lark-signature` 标头进行时序安全比较。签名无效或缺失的请求将被拒绝，并返回 HTTP 401。

:::tip
在 WebSocket 模式下，签名验证由 SDK 本身处理，因此 `FEISHU_ENCRYPT_KEY` 是可选的。在 Webhook 模式下，强烈建议在生产环境中使用。
:::

### 验证令牌

额外的身份验证层，用于检查 Webhook 载荷中的 `token` 字段：

```bash
FEISHU_VERIFICATION_TOKEN=your-verification-token
```

此令牌也可在飞书应用的 **事件订阅** 部分找到。设置后，每个入站 Webhook 载荷必须在其 `header` 对象中包含匹配的 `token`。不匹配的令牌将被拒绝，并返回 HTTP 401。

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

在所有模式下，机器人必须被明确 @提及（或 @全体成员）后，消息才会被处理。私信绕过此限制。

### 机器人身份用于 @提及 门控

为了在群组中精确检测 @提及，适配器需要知道机器人的身份。可以显式提供：

```bash
FEISHU_BOT_OPEN_ID=ou_xxx
FEISHU_BOT_USER_ID=xxx
FEISHU_BOT_NAME=MyBot
```

如果这些均未设置，适配器将在启动时尝试通过应用信息 API 自动发现机器人名称。为此，请授予 `admin:app.info:readonly` 或 `application:application:self_manage` 权限范围。

## 交互式卡片操作

当用户点击按钮或与机器人发送的交互式卡片交互时，适配器会将这些操作路由为合成的 `/card` 命令事件：

- 按钮点击变为：`/card button {"key": "value", ...}`
- 卡片定义中的操作 `value` 载荷以 JSON 形式包含在内。
- 卡片操作在 15 分钟窗口内去重，以防止重复处理。

卡片操作事件以 `MessageType.COMMAND` 分发，因此它们会通过常规命令处理管道。

这也是 **命令审批** 的工作方式 —— 当智能体需要运行危险命令时，它会发送一个带有“允许一次/会话/始终/拒绝”按钮的交互式卡片。用户点击按钮后，卡片操作回调会将审批决定返回给智能体。

### 必需的飞书应用配置

交互式卡片需要在飞书开发者控制台中完成 **三个** 配置步骤。缺少任何一项都会导致用户点击卡片按钮时出现错误 **200340**。

1. **订阅卡片操作事件：**
   在 **事件订阅** 中，将 `card.action.trigger` 添加到你的订阅事件中。

2. **启用交互式卡片能力：**
   在 **应用功能 > 机器人** 中，确保启用 **交互式卡片** 开关。这告诉飞书你的应用可以接收卡片操作回调。

3. **配置卡片请求 URL（仅 Webhook 模式）：**
   在 **应用功能 > 机器人 > 消息卡片请求 URL** 中，将 URL 设置为与你的事件 Webhook 相同的端点（例如 `https://your-server:8765/feishu/webhook`）。在 WebSocket 模式下，SDK 会自动处理此问题。

:::warning
如果没有完成所有三个步骤，飞书将成功 *发送* 交互式卡片（发送仅需 `im:message:send` 权限），但点击任何按钮都会返回错误 200340。卡片看起来可以正常工作 —— 只有在用户与之交互时才会出现错误。
:::

## 文档评论智能回复

除了聊天，适配器还可以回复 **飞书/Lark 文档** 上的 `@` 提及。当用户在文档上评论（本地文本选择或全文评论）并 @提及 机器人时，Hermes 会读取文档内容及周围的评论线程，并在该线程中内联发布 LLM 回复。

由 `drive.notice.comment_add_v1` 事件提供支持，处理程序：

- 并行获取文档内容和评论时间线（全文线程 20 条消息，本地选择线程 12 条消息）。
- 在该单条评论会话范围内，使用 `feishu_doc` + `feishu_drive` 工具集运行智能体。
- 将回复分块为 4000 字符，并将其作为线程回复发回。
- 按文档缓存会话 1 小时，最多 50 条消息，以便同一文档上的后续评论保持上下文。

### 三级访问控制

文档评论回复为 **显式授权** —— 没有隐式的“全部允许”模式。权限按以下顺序解析（首次匹配生效，按字段）：

1. **精确文档** —— 规则限定于特定文档令牌。
2. **通配符** —— 规则匹配文档模式。
3. **顶级** —— 工作区的默认规则。

每条规则有两种策略可用：

- **`allowlist`** —— 用户/租户的静态列表。
- **`pairing`** —— 静态列表 ∪ 运行时批准的存储。适用于审核员可以实时授予访问权限的部署场景。

规则位于 `~/.hermes/feishu_comment_rules.json`（配对授权位于 `~/.hermes/feishu_comment_pairing.json`），支持 mtime 缓存的热重载 —— 编辑将在下一次评论事件时生效，无需重启网关。

CLI：

```bash
# 查看当前规则和配对状态
python -m gateway.platforms.feishu_comment_rules status

# 模拟特定文档 + 用户的访问检查
python -m gateway.platforms.feishu_comment_rules check <fileType:fileToken> <user_open_id>

# 运行时管理配对授权
python -m gateway.platforms.feishu_comment_rules pairing list
python -m gateway.platforms.feishu_comment_rules pairing add <user_open_id>
python -m gateway.platforms.feishu_comment_rules pairing remove <user_open_id>
```

### 必需的飞书应用配置

除了已授予的聊天/卡片权限外，请添加 drive 评论事件：

- 在 **事件订阅** 中订阅 `drive.notice.comment_add_v1`。
- 授予 `docs:doc:readonly` 和 `drive:drive:readonly` 范围，以便处理程序可以读取文档内容。

## 媒体支持

### 入站（接收）

适配器接收并缓存用户发送的以下媒体类型：

| 类型 | 扩展名 | 处理方式 |
|------|-----------|-------------------|
| **图像** | .jpg, .jpeg, .png, .gif, .webp, .bmp | 通过飞书 API 下载并本地缓存 |
| **音频** | .ogg, .mp3, .wav, .m4a, .aac, .flac, .opus, .webm | 下载并缓存；小型文本文件会自动提取 |
| **视频** | .mp4, .mov, .avi, .mkv, .webm, .m4v, .3gp | 下载并缓存为文档 |
| **文件** | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx 等 | 下载并缓存为文档 |

富文本（帖子）消息中的媒体（包括内联图像和文件附件）也会被提取并缓存。

对于小型基于文本的文档（.txt, .md），文件内容会自动注入消息文本中，以便智能体无需工具即可直接读取。

### 出站（发送）

| 方法 | 发送内容 |
|--------|--------------|
| `send` | 文本或富帖子消息（根据 Markdown 内容自动检测） |
| `send_image` / `send_image_file` | 上传图像到飞书，然后作为原生图像气泡发送（可选标题） |
| `send_document` | 上传文件到飞书 API，然后作为文件附件发送 |
| `send_voice` | 上传音频文件作为飞书文件附件 |
| `send_video` | 上传视频并作为原生媒体消息发送 |
| `send_animation` | GIF 被降级为文件附件（飞书没有原生 GIF 气泡） |

文件上传路由根据扩展名自动进行：

- `.ogg`, `.opus` → 上传为 `opus` 音频
- `.mp4`, `.mov`, `.avi`, .m4v` → 上传为 `mp4` 媒体
- `.pdf`, `.doc(x)`, `.xls(x)`, `.ppt(x)` → 以其文档类型上传
- 其他所有文件 → 作为通用流文件上传

## Markdown 渲染和帖子回退

当出站文本包含 Markdown 格式（标题、粗体、列表、代码块、链接等）时，适配器会自动将其作为带有嵌入式 `md` 标签的飞书 **帖子** 消息发送，而不是纯文本。这使得飞书客户端可以呈现富文本。

如果飞书 API 拒绝帖子载荷（例如，由于不支持的 Markdown 结构），适配器会自动回退到发送去除 Markdown 的纯文本。这种两阶段回退确保消息始终可以送达。

纯文本消息（未检测到 Markdown）将作为简单的 `text` 消息类型发送。

## 处理状态反应

当智能体工作时，机器人会在你的消息上显示 `正在输入` 反应。当回复到达时，该反应会被清除；如果处理失败，则会替换为 `叉号`。

设置 `FEISHU_REACTIONS=false` 可将其关闭。

## 突发保护和批处理

适配器包含对快速消息突发的去抖动功能，以避免压垮智能体：

### 文本批处理

当用户在短时间内发送多条文本消息时，它们会在分发前合并为单个事件：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | 0.6 秒 |
| 每批最大消息数 | `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | 8 |
| 每批最大字符数 | `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | 4000 |

### 媒体批处理

在短时间内发送的多个媒体附件（例如，拖放多张图像）会被合并为单个事件：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 0.8 秒 |

### 每聊天串行化

同一聊天中的消息按顺序处理（一次一条），以保持对话连贯性。每个聊天都有其自己的锁，因此不同聊天中的消息可以并发处理。

## 速率限制（Webhook 模式）

在 Webhook 模式下，适配器强制执行每 IP 速率限制，以防止滥用：

- **窗口：** 60 秒滑动窗口
- **限制：** 每（app_id, 路径, IP）三元组每窗口 120 个请求
- **跟踪上限：** 最多跟踪 4096 个唯一键（防止内存无限增长）

超过限制的请求将收到 HTTP 429（请求过多）。

### Webhook 异常跟踪

适配器跟踪每个 IP 地址的连续错误响应。在 6 小时窗口内，如果同一 IP 连续出现 25 次错误，则会记录警告。这有助于检测配置错误的客户端或探测尝试。

额外的 Webhook 保护：
- **正文大小限制：** 最大 1 MB
- **正文读取超时：** 30 秒
- **Content-Type 强制：** 仅接受 `application/json`

## WebSocket 调优

使用 `websocket` 模式时，你可以自定义重连和 Ping 行为：

```yaml
platforms:
  feishu:
    extra:
      ws_reconnect_interval: 120   # 重连尝试之间的秒数（默认: 120）
      ws_ping_interval: 30         # WebSocket Ping 之间的秒数（可选；未设置时使用 SDK 默认值）
```

| 设置 | 配置键 | 默认值 | 描述 |
|---------|-----------|---------|-------------|
| 重连间隔 | `ws_reconnect_interval` | 120 秒 | 重连尝试之间的等待时间 |
| Ping 间隔 | `ws_ping_interval` | _（SDK 默认值）_ | WebSocket 保活 Ping 的频率 |

## 每群组访问控制

除了全局 `FEISHU_GROUP_POLICY`，你还可以使用 config.yaml 中的 `group_rules` 为每个群聊设置细粒度规则：

```yaml
platforms:
  feishu:
    extra:
      default_group_policy: "open"     # 未在 group_rules 中的群组的默认策略
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

| 策略 | 描述 |
|--------|-------------|
| `open` | 群组中任何人都可以使用机器人 |
| `allowlist` | 只有群组 `allowlist` 中的用户可以使用机器人 |
| `blacklist` | 除了群组 `blacklist` 中的用户外，其他人都可以使用机器人 |
| `admin_only` | 只有全局 `admins` 列表中的用户才能在该群组中使用机器人 |
| `disabled` | 机器人忽略该群组中的所有消息 |

未在 `group_rules` 中列出的群组将回退到 `default_group_policy`（默认为 `FEISHU_GROUP_POLICY` 的值）。

## 去重

入站消息使用消息 ID 进行去重，TTL 为 24 小时。去重状态在重启之间持久化到 `~/.hermes/feishu_seen_message_ids.json`。

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 缓存大小 | `HERMES_FEISHU_DEDUP_CACHE_SIZE` | 2048 个条目 |

## 所有环境变量

| 变量 | 必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `FEISHU_APP_ID` | ✅ | — | 飞书/Lark 应用 ID |
| `FEISHU_APP_SECRET` | ✅ | — | 飞书/Lark 应用密钥 |
| `FEISHU_DOMAIN` | — | `feishu` | `feishu`（中国）或 `lark`（国际版） |
| `FEISHU_CONNECTION_MODE` | — | `websocket` | `websocket` 或 `webhook` |
| `FEISHU_ALLOWED_USERS` | — | _（空）_ | 用户白名单的逗号分隔 open_id 列表 |
| `FEISHU_HOME_CHANNEL` | — | — | 定时任务/通知输出的聊天 ID |
| `FEISHU_ENCRYPT_KEY` | — | _（空）_ | Webhook 签名验证的加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | — | _（空）_ | Webhook 载荷身份验证的验证令牌 |
| `FEISHU_GROUP_POLICY` | — | `allowlist` | 群聊消息策略：`open`、`allowlist`、`disabled` |
| `FEISHU_BOT_OPEN_ID` | — | _（空）_ | 机器人的 open_id（用于 @提及 检测） |
| `FEISHU_BOT_USER_ID` | — | _（空）_ | 机器人的 user_id（用于 @提及 检测） |
| `FEISHU_BOT_NAME` | — | _（空）_ | 机器人的显示名称（用于 @提及 检测） |
| `FEISHU_WEBHOOK_HOST` | — | `127.0.0.1` | Webhook 服务器绑定地址 |
| `FEISHU_WEBHOOK_PORT` | — | `8765` | Webhook 服务器端口 |
| `FEISHU_WEBHOOK_PATH` | — | `/feishu/webhook` | Webhook 端点路径 |
| `HERMES_FEISHU_DEDUP_CACHE_SIZE` | — | `2048` | 要跟踪的去重消息 ID 的最大数量 |
| `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | — | `0.6` | 文本突发去抖动静默期 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | — | `8` | 每批文本合并的最大消息数 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | — | `4000` | 每批文本合并的最大字符数 |
| `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | — | `0.8` | 媒体突发去抖动静默期 |

WebSocket 和每群组 ACL 设置通过 `config.yaml` 中的 `platforms.feishu.extra` 配置（参见上面的 [WebSocket 调优](#websocket-tuning) 和 [每群组访问控制](#per-group-access-control)）。

## 故障排除

| 问题 | 修复 |
|---------|-----|
| `lark-oapi 未安装` | 安装 SDK：`pip install lark-oapi` |
| `websockets 未安装；WebSocket 模式不可用` | 安装 websockets：`pip install websockets` |
| `aiohttp 未安装；Webhook 模式不可用` | 安装 aiohttp：`pip install aiohttp` |
| `FEISHU_APP_ID 或 FEISHU_APP_SECRET 未设置` | 设置两个环境变量或通过 `hermes gateway setup` 配置 |
| `另一个本地 Hermes 网关已在使用此飞书 app_id` | 一次只能有一个 Hermes 实例使用相同的 app_id。请先停止另一个网关。 |
| 机器人在群组中不响应 | 确保机器人被 @提及，检查 `FEISHU_GROUP_POLICY`，并验证发送者是否在 `FEISHU_ALLOWED_USERS` 中（如果策略为 `allowlist`） |
| `Webhook 被拒绝：无效的验证令牌` | 确保 `FEISHU_VERIFICATION_TOKEN` 与飞书应用的事件订阅配置中的令牌匹配 |
| `Webhook 被拒绝：无效的签名` | 确保 `FEISHU_ENCRYPT_KEY` 与飞书应用配置中的加密密钥匹配 |
| 帖子消息显示为纯文本 | 飞书 API 拒绝了帖子载荷；这是正常的回退行为。请检查日志以获取详细信息。 |
| 机器人未接收到图像/文件 | 向你的飞书应用授予 `im:message` 和 `im:resource` 权限范围 |
| 机器人身份未自动检测 | 授予 `admin:app.info:readonly` 范围，或手动设置 `FEISHU_BOT_OPEN_ID` / `FEISHU_BOT_NAME` |
| 点击审批按钮时出现错误 200340 | 在飞书开发者控制台中启用 **交互式卡片** 能力并配置 **卡片请求 URL**。参见上面的 [必需的飞书应用配置](#required-feishu-app-configuration)。 |
| `Webhook 速率限制超出` | 同一 IP 每分钟超过 120 个请求。这通常是配置错误或循环导致的。 |

## 工具集

飞书 / Lark 使用 `hermes-feishu` 平台预设，其中包括与 Telegram 和其他基于网关的 messaging 平台相同的核心工具。