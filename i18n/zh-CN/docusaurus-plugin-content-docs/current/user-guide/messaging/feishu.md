---
sidebar_position: 11
title: "Feishu / Lark"
description: "Set up Hermes Agent as a Feishu or Lark bot"
---

# 飞书 / Lark 设置

Hermes 智能体可作为功能完备的机器人集成到飞书和 Lark 中。连接完成后，您可以在私信或群聊中与智能体对话，在主会话中接收定时任务结果，并通过常规网关流程发送文本、图片、音频和文件附件。

该集成支持两种连接模式：

- `websocket` — 推荐；Hermes 建立出站连接，您无需提供公共 webhook 端点
- `webhook` — 适用于希望飞书/Lark 通过 HTTP 将事件推送到您的网关的场景

## Hermes 的行为

| 上下文 | 行为 |
|---------|----------|
| 私信 | Hermes 会回复每一条消息。 |
| 群聊 | Hermes 仅在群聊中被 @提及 时才会回复。 |
| 共享群聊 | 默认情况下，共享群聊中每个用户的会话历史是隔离的。 |

此共享群聊行为由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您明确希望每个群聊共享一个对话时，才将其设置为 `false`。

## 步骤 1：创建飞书 / Lark 应用

### 推荐方式：扫码创建（一条命令）

```bash
hermes gateway setup
```

选择 **Feishu / Lark**，然后使用飞书或 Lark 手机应用扫描二维码。Hermes 将自动创建具有正确权限的机器人应用并保存凭证。

### 替代方式：手动设置

如果扫码创建不可用，向导将回退到手动输入：

1. 打开飞书或 Lark 开发者控制台：
   - 飞书：[https://open.feishu.cn/](https://open.feishu.cn/)
   - Lark：[https://open.larksuite.com/](https://open.larksuite.com/)
2. 创建一个新应用。
3. 在 **凭证与基础信息** 中，复制 **App ID** 和 **App Secret**。
4. 为应用启用 **机器人** 能力。
5. 运行 `hermes gateway setup`，选择 **Feishu / Lark**，并在提示时输入凭证。

:::warning
请妥善保管 App Secret。任何拥有它的人都可以冒充您的应用。
:::

### 配置权限

在飞书开发者控制台中，前往 **权限管理** 并添加以下作用域。您可以在权限页面中批量导入。

**必需权限：**

| 作用域 | 用途 |
|-------|---------|
| `im:message` | 接收和读取消息 |
| `im:message:send_as_bot` | 以机器人身份发送消息 |
| `im:resource` | 访问用户发送的图片、文件和音频 |
| `im:chat` | 访问聊天/群组元数据 |
| `im:chat:readonly` | 读取聊天列表和成员信息 |

**推荐权限（用于完整功能）：**

| 作用域 | 用途 |
|-------|---------|
| `im:message.reactions:readonly` | 接收表情回应事件 |
| `admin:app.info:readonly` | 自动检测机器人身份以进行 @提及 门控 |
| `contact:user.id:readonly` | 解析用户 ID 以进行允许列表匹配 |

### 配置事件

在 **事件与回调** 中：

1. 将连接模式设置为 **长连接 (WebSocket)**（推荐）或配置一个 Webhook URL
2. 在 **事件配置** 部分，订阅以下事件：
   - `im.message.receive_v1` — 接收消息所必需

### 发布应用

配置完权限和事件后，前往 **版本管理** 并发布应用的新版本。在版本发布并获得批准之前，权限不会生效（对于企业应用，这可能需要管理员审批）。

## 步骤 2：选择连接模式

### 推荐：WebSocket 模式

当 Hermes 运行在您的笔记本电脑、工作站或私有服务器上时，请使用 WebSocket 模式。无需公开 URL。官方 Lark SDK 会自动打开并维护一个持久的外带 WebSocket 连接，支持自动重连。

```bash
FEISHU_CONNECTION_MODE=websocket
```

**要求：** 必须安装 `websockets` Python 包。SDK 在内部处理连接生命周期、心跳和自动重连。

**工作原理：** 适配器在后台执行器线程中运行 Lark SDK 的 WebSocket 客户端。入站事件（消息、回应、卡片操作）被分发到主 asyncio 循环。断开连接时，SDK 会自动尝试重连。

### 可选：Webhook 模式

仅当您已经在可访问的 HTTP 端点后方运行 Hermes 时，才使用 Webhook 模式。

```bash
FEISHU_CONNECTION_MODE=webhook
```

在 Webhook 模式下，Hermes 启动一个 HTTP 服务器（通过 `aiohttp`）并在以下地址提供飞书端点：

```text
/feishu/webhook
```

**要求：** 必须安装 `aiohttp` Python 包。

您可以自定义 Webhook 服务器绑定地址和路径：

```bash
FEISHU_WEBHOOK_HOST=127.0.0.1   # 默认值：127.0.0.1
FEISHU_WEBHOOK_PORT=8765         # 默认值：8765
FEISHU_WEBHOOK_PATH=/feishu/webhook  # 默认值：/feishu/webhook
```

当飞书发送 URL 验证挑战（`type: url_verification`）时，Webhook 会自动响应，以便您在飞书开发者控制台中完成订阅设置。当设置了 `FEISHU_VERIFICATION_TOKEN` 时，挑战响应会受到门控——缺少令牌或令牌不匹配的挑战请求将被拒绝，以防止未认证的远程方通过回显攻击者控制的挑战数据来证明端点控制权。

## 步骤 3：配置 Hermes

### 选项 A：交互式设置

```bash
hermes gateway setup
```

选择 **Feishu / Lark** 并填写提示。

### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env`：

```bash
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=secret_xxx
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket

# 可选但强烈建议设置
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
FEISHU_HOME_CHANNEL=oc_xxx
```

`FEISHU_DOMAIN` 接受以下值：

- `feishu` 用于飞书中国版
- `lark` 用于 Lark 国际版

## 步骤 4：启动网关

```bash
hermes gateway
```

然后从飞书/Lark 向机器人发送消息，确认连接已激活。

## 家庭聊天

在飞书/Lark 聊天中使用 `/set-home` 将其标记为 cron 任务结果和跨平台通知的主频道。

您也可以预先配置：

```bash
FEISHU_HOME_CHANNEL=oc_xxx
```

## 安全

### 用户允许列表

对于生产用途，请设置飞书 Open ID 的允许列表：

```bash
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
```

如果将允许列表留空，任何能接触到机器人的人都可能可以使用它。在群组聊天中，允许列表会在消息处理前对照发送者的 open_id 进行检查。

### Webhook 加密密钥

在 Webhook 模式下运行时，设置一个加密密钥以启用入站 Webhook 有效负载的签名验证：

```bash
FEISHU_ENCRYPT_KEY=your-encrypt-key
```

此密钥可在飞书应用配置的 **事件订阅** 部分找到。设置后，适配器使用以下签名算法验证每个 Webhook 请求：

```
SHA256(timestamp + nonce + encrypt_key + body)
```

计算出的哈希值会与 `x-lark-signature` 头进行时序安全比较。签名无效或缺失的请求将被拒绝，返回 HTTP 401。

:::tip
在 WebSocket 模式下，签名验证由 SDK 自身处理，因此 `FEISHU_ENCRYPT_KEY` 是可选的。在 Webhook 模式下，强烈建议在生产环境中使用。
:::

### 验证令牌

通过在 Webhook 有效负载内检查 `token` 字段来实现额外的认证层：

```bash
FEISHU_VERIFICATION_TOKEN=your-verification-token
```

此令牌同样可在飞书应用的 **事件订阅** 部分找到。设置后，每个入站 Webhook 有效负载必须在其 `header` 对象中包含匹配的 `token`。令牌不匹配的请求将被拒绝，返回 HTTP 401。

`FEISHU_ENCRYPT_KEY` 和 `FEISHU_VERIFICATION_TOKEN` 可以同时使用，实现纵深防御。

## 群组消息策略

`FEISHU_GROUP_POLICY` 环境变量控制 Hermes 在群组聊天中是否以及如何响应：

```bash
FEISHU_GROUP_POLICY=allowlist   # 默认值
```

| 值 | 行为 |
|-------|----------|
| `open` | Hermes 响应任何群组中任何用户的 @提及。 |
| `allowlist` | Hermes 仅响应 `FEISHU_ALLOWED_USERS` 中列出的用户的 @提及。 |
| `disabled` | Hermes 完全忽略所有群组消息。 |

在所有模式下，机器人在群组中必须被明确 @提及（或 @所有成员）后，消息才会被处理。私信始终绕过此门控。

设置 `FEISHU_REQUIRE_MENTION=false` 以允许 Hermes 读取所有群组流量而无需 @提及：

```bash
FEISHU_REQUIRE_MENTION=false
```

如需按聊天进行控制，请在 `group_rules` 条目上设置 `require_mention` — 参见下文[按群组访问控制](#per-group-access-control)。

### 机器人身份

Hermes 在启动时自动检测机器人的 `open_id` 和显示名称。仅当自动检测无法访问飞书 API，或您的应用使用租户范围的用户 ID 时，才需要手动设置：

```bash
FEISHU_BOT_OPEN_ID=ou_xxx     # 仅在自动检测失败时使用
FEISHU_BOT_USER_ID=xxx        # 如果您的应用使用 sender_id_type=user_id 则必需
FEISHU_BOT_NAME=MyBot         # 仅在自动检测失败时使用
```

## 机器人间消息传递

默认情况下，Hermes 忽略其他机器人发送的消息。当您希望 Hermes 参与 A2A 编排或接收来自同一群组中其他机器人的通知时，启用机器人间消息传递。

```bash
FEISHU_ALLOW_BOTS=mentions   # 默认值：none
```

| 值 | 行为 |
|-------|----------|
| `none` | 忽略所有来自其他机器人的消息（默认）。 |
| `mentions` | 仅在对等机器人 @提及 Hermes 时接受。 |
| `all` | 接受所有对等机器人的消息。 |

也可以在 `config.yaml` 中配置为 `feishu.allow_bots`（当两者都设置时，环境变量优先）。

对等机器人无需添加到 `FEISHU_ALLOWED_USERS` — 该允许列表仅适用于人类发送者。

授予 `application:bot.basic_info:read` 作用域以显示对等机器人的名称；如果没有此作用域，对等机器人仍会正确路由，但会显示其 `open_id`。

## 交互式卡片操作

当用户点击按钮或与机器人发送的交互式卡片交互时，适配器将这些操作作为合成的 `/card` 命令事件进行路由：

- 按钮点击变为：`/card button {"key": "value", ...}`
- 卡片定义中操作的 `value` 有效负载作为 JSON 包含在内。
- 卡片操作在 15 分钟窗口内进行去重，以防止重复处理。

网关驱动的更新提示使用飞书原生的 `是` / `否` 卡片，而不是回退到纯文本回复。当 `hermes update --gateway` 需要确认时，适配器将记录 Hermes 的 `.update_response` 文件中的选定答案，并将卡片内联替换为已解决状态。

卡片操作事件以 `MessageType.COMMAND` 分发，因此它们通过正常的命令处理管道流转。

这也是**命令审批**的工作方式 — 当智能体需要运行危险命令时，它会发送一个包含"仅允许一次"/"本次会话"/"始终允许"/"拒绝"按钮的交互式卡片。用户点击按钮，卡片操作回调将审批决定返回给智能体。

### 必需的飞书应用配置

交互式卡片需要在飞书开发者控制台完成**三项**配置步骤。缺少任何一项都会导致用户点击卡片按钮时出现 **200340** 错误。

1. **订阅卡片操作事件：**
   在 **事件订阅** 中，将 `card.action.trigger` 添加到您已订阅的事件中。

2. **启用交互式卡片能力：**
   在 **应用功能 > 机器人** 中，确保已启用 **交互式卡片** 开关。这会告知飞书您的应用可以接收卡片操作回调。

3. **配置卡片请求 URL（仅限 Webhook 模式）：**
   在 **应用功能 > 机器人 > 消息卡片请求 URL** 中，将 URL 设置为与您的事件 Webhook 端点相同（例如 `https://your-server:8765/feishu/webhook`）。在 WebSocket 模式下，这由 SDK 自动处理。

:::warning
如果未完成全部三个步骤，飞书将能够成功*发送*交互式卡片（发送仅需 `im:message:send` 权限），但点击任何按钮都会返回错误 200340。卡片看起来可以正常工作 — 只有当用户与卡片交互时才会出现错误。
:::

## 文档评论智能回复

除了聊天之外，适配器还可以回复留在**飞书/Lark 文档**上的 `@` 提及。当用户在文档上评论（本地文本选择或整文档评论）并 @机器人时，Hermes 会读取文档及周围的评论线程，并在该线程中以行内方式发布 LLM 回复。

由 `drive.notice.comment_add_v1` 事件驱动，处理器的执行流程如下：

- 并行获取文档内容和评论时间线（整文档线程获取 20 条消息，本地选择线程获取 12 条）。
- 在该评论会话范围内，使用限定作用域的 `feishu_doc` + `feishu_drive` 工具集运行智能体。
- 以 4000 字符为分块限制，将回复作为线程回复发布回去。
- 按文档缓存会话 1 小时，上限 50 条消息，以便对同一文档的后续评论保持上下文。

### 三级访问控制

文档评论回复**仅限显式授权**——不存在隐式允许所有模式。权限按以下顺序解析（每个字段以首次匹配为准）：

1. **精确文档**——作用于特定文档令牌的规则。
2. **通配符**——匹配一系列文档模式的规则。
3. **顶层**——工作区的默认规则。

每个规则可使用两种策略：

- **`allowlist`**——静态的用户/租户列表。
- **`pairing`**——静态列表 ∪ 运行时审批的存储区。适用于审核人员可以实时授予访问权限的渐进式推出场景。

规则存储在 `~/.hermes/feishu_comment_rules.json` 中（配对授权存储在 `~/.hermes/feishu_comment_pairing.json` 中），支持 mtime 缓存热重载——编辑在下一个评论事件时生效，无需重启网关。

命令行：

```bash
# 查看当前规则和配对状态
python -m gateway.platforms.feishu_comment_rules status

# 模拟对特定文档 + 用户的访问检查
python -m gateway.platforms.feishu_comment_rules check <fileType:fileToken> <user_open_id>

# 运行时管理配对授权
python -m gateway.platforms.feishu_comment_rules pairing list
python -m gateway.platforms.feishu_comment_rules pairing add <user_open_id>
python -m gateway.platforms.feishu_comment_rules pairing remove <user_open_id>
```

### 所需的飞书应用配置

在已授予的聊天/卡片权限基础上，添加 drive 评论事件：

- 在**事件订阅**中订阅 `drive.notice.comment_add_v1`。
- 授予 `docs:doc:readonly` 和 `drive:drive:readonly` 权限范围，以便处理器读取文档内容。

## 会议邀请事件

您可以像邀请人类参与者一样，邀请 Hermes 飞书/Lark 机器人加入视频会议。当机器人收到会议邀请事件时，Hermes 可以自动启动一个智能体轮次，尝试加入会议。

由 `vc.bot.meeting_invited_v1` 事件驱动，流程如下：

- 用户邀请机器人加入飞书/Lark 视频会议。
- 飞书/Lark 向 Hermes 发送会议邀请事件。
- Hermes 提取邀请人、会议主题和会议号。
- 如果邀请人已被网关普通允许列表或配对策略授权，智能体将接收会议号并尝试自动加入。
- 如果邀请格式不正确，或智能体无法加入，Hermes 将丢弃该事件，或向邀请人回复简要说明。

未同时包含邀请人和 `meeting_no` 的格式不正确邀请将被忽略。

### 所需的飞书应用配置

在已授予的聊天/卡片权限基础上，添加视频会议邀请事件：

- 在**事件订阅**中订阅 `vc.bot.meeting_invited_v1`。
- 启用飞书/Lark 开发者控制台针对该事件提示的视频会议权限范围。
- 保持启用 `im:message` 和 `im:message:send_as_bot`，以便 Hermes 可以回复邀请人。
- 确保网关用户允许列表或配对策略已授权邀请人。会议邀请不会绕过正常的网关访问检查。

## 媒体支持

### 入站（接收）

适配器接收并缓存以下来自用户的媒体类型：

| 类型 | 扩展名 | 处理方式 |
|------|-----------|-------------------|
| **图片** | .jpg, .jpeg, .png, .gif, .webp, .bmp | 通过飞书 API 下载并本地缓存 |
| **音频** | .ogg, .mp3, .wav, .m4a, .aac, .flac, .opus, .webm | 下载并缓存；小型文本文件自动提取 |
| **视频** | .mp4, .mov, .avi, .mkv, .webm, .m4v, .3gp | 下载并缓存为文档 |
| **文件** | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx 等 | 下载并缓存为文档 |

富文本（post）消息中的媒体（包括内联图片和文件附件）也会被提取并缓存。

对于小型文本文件（.txt, .md），文件内容会自动注入到消息文本中，以便智能体无需使用工具即可直接读取。

### 出站（发送）

| 方法 | 发送内容 |
|--------|--------------|
| `send` | 文本或富文本 post 消息（根据 markdown 内容自动检测） |
| `send_image` / `send_image_file` | 上传图片到飞书，然后以原生图片气泡发送（可选标题） |
| `send_document` | 上传文件到飞书 API，然后以文件附件形式发送 |
| `send_voice` | 上传音频文件为飞书文件附件 |
| `send_video` | 上传视频并以原生媒体消息形式发送 |
| `send_animation` | GIF 降级为文件附件发送（飞书无原生 GIF 气泡） |

文件上传路由根据扩展名自动进行：

- `.ogg`, `.opus` → 上传为 `opus` 音频
- `.mp4`, `.mov`, `.avi`, `.m4v` → 上传为 `mp4` 媒体
- `.pdf`, `.doc(x)`, `.xls(x)`, `.ppt(x)` → 按其文档类型上传
- 其他所有文件 → 上传为通用 stream 文件

## Markdown 渲染与 Post 回退

当出站文本包含 markdown 格式（标题、加粗、列表、代码块、链接等）时，适配器会自动将其作为飞书 **post** 消息发送，内嵌 `md` 标签，而非纯文本。这样可以在飞书客户端中实现丰富的渲染效果。

如果飞书 API 拒绝 post 负载（例如由于不支持的 markdown 结构），适配器会自动回退为发送去除 markdown 后的纯文本。这种两级回退机制确保消息始终能够送达。

纯文本消息（未检测到 markdown）以简单的 `text` 消息类型发送。

## 处理状态表情反应

当智能体正在工作时，机器人会在您的消息上显示 `Typing` 表情反应。回复到达时清除，如果处理失败则替换为 `CrossMark`。

设置 `FEISHU_REACTIONS=false` 可关闭此功能。

## 突发保护与批处理

适配器包含针对快速消息突发的防抖机制，以避免让智能体过载：

### 文本批处理

当用户快速连续发送多条文本消息时，它们会在派发前合并为单个事件：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | 0.6s |
| 每批最大消息数 | `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | 8 |
| 每批最大字符数 | `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | 4000 |

### 媒体批处理

快速连续发送的多个媒体附件（例如拖拽多张图片）会合并为单个事件：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 0.8s |

### 逐会话串行化

同一会话中的消息按串行方式处理（一次一条），以保持对话连贯性。每个会话有自己的锁，因此不同会话中的消息并发处理。

## 速率限制（Webhook 模式）

在 webhook 模式下，适配器强制执行每 IP 速率限制以防止滥用：

- **窗口：** 60 秒滑动窗口
- **限制：** 每个（app_id, path, IP）三元组每窗口 120 次请求
- **跟踪上限：** 最多跟踪 4096 个唯一键（防止无限制的内存增长）

超出限制的请求将收到 HTTP 429（Too Many Requests）。

### Webhook 异常跟踪

适配器按 IP 地址跟踪连续错误响应。当同一 IP 在 6 小时内连续产生 25 次错误时，会记录警告。这有助于检测配置错误的客户端或探测尝试。

额外的 webhook 保护措施：
- **请求体大小限制：** 最大 1 MB
- **请求体读取超时：** 30 秒
- **Content-Type 强制：** 仅接受 `application/json`

## WebSocket 调优

使用 `websocket` 模式时，您可以自定义重连和 ping 行为：

```yaml
platforms:
  feishu:
    extra:
      ws_reconnect_interval: 120   # 重连间隔秒数（默认：120）
      ws_ping_interval: 30         # WebSocket ping 间隔秒数（可选；未设置时使用 SDK 默认值）
```

| 设置 | 配置键 | 默认值 | 说明 |
|---------|-----------|---------|-------------|
| 重连间隔 | `ws_reconnect_interval` | 120s | 重连尝试之间的等待时间 |
| Ping 间隔 | `ws_ping_interval` | _(SDK 默认)_ | WebSocket 保活 ping 频率 |

## 逐群组访问控制

除了全局 `FEISHU_GROUP_POLICY` 之外，您还可以使用 config.yaml 中的 `group_rules` 为每个群组聊天设置细粒度规则：

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
        "oc_free_chat":
          policy: "open"
          require_mention: false       # 覆盖此聊天的 FEISHU_REQUIRE_MENTION
```

| 策略 | 说明 |
|--------|-------------|
| `open` | 群组中任何人都可以使用机器人 |
| `allowlist` | 仅群组 `allowlist` 中的用户可以使用机器人 |
| `blacklist` | 除群组 `blacklist` 中的用户外，所有人都可以使用机器人 |
| `admin_only` | 仅全局 `admins` 列表中的用户可以在该群组中使用机器人 |
| `disabled` | 机器人忽略该群组中的所有消息 |

在 `group_rules` 条目上设置 `require_mention: false` 可跳过该特定聊天的 @提及 要求。省略时，该聊天继承全局 `FEISHU_REQUIRE_MENTION` 值。

未在 `group_rules` 中列出的群组回退到 `default_group_policy`（默认值为 `FEISHU_GROUP_POLICY` 的值）。

## 去重

入站消息使用消息 ID 和 24 小时 TTL 进行去重。去重状态跨重启持久化到 `~/.hermes/feishu_seen_message_ids.json`。

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 缓存大小 | `HERMES_FEISHU_DEDUP_CACHE_SIZE` | 2048 条目 |

## 所有环境变量

| 变量 | 必填 | 默认值 | 说明 |
|----------|----------|---------|-------------|
| `FEISHU_APP_ID` | ✅ | — | 飞书/Lark 应用 ID |
| `FEISHU_APP_SECRET` | ✅ | — | 飞书/Lark 应用密钥 |
| `FEISHU_DOMAIN` | — | `feishu` | `feishu`（中国）或 `lark`（国际） |
| `FEISHU_CONNECTION_MODE` | — | `websocket` | `websocket` 或 `webhook` |
| `FEISHU_ALLOWED_USERS` | — | _(空)_ | 逗号分隔的 open_id 列表，用于用户允许列表 |
| `FEISHU_ALLOW_BOTS` | — | `none` | 接受来自其他机器人的消息：`none`、`mentions` 或 `all` |
| `FEISHU_REQUIRE_MENTION` | — | `true` | 群组消息是否需要 @提及机器人 |
| `FEISHU_HOME_CHANNEL` | — | — | 定时任务/通知输出的聊天 ID |
| `FEISHU_ENCRYPT_KEY` | — | _(空)_ | 用于 webhook 签名验证的加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | — | _(空)_ | 用于 webhook 负载认证的验证令牌 |
| `FEISHU_GROUP_POLICY` | — | `allowlist` | 群组消息策略：`open`、`allowlist`、`disabled` |
| `FEISHU_BOT_OPEN_ID` | — | _(空)_ | 机器人的 open_id（用于 @提及检测） |
| `FEISHU_BOT_USER_ID` | — | _(空)_ | 机器人的 user_id（用于 @提及检测） |
| `FEISHU_BOT_NAME` | — | _(空)_ | 机器人的显示名称（用于 @提及检测） |
| `FEISHU_WEBHOOK_HOST` | — | `127.0.0.1` | Webhook 服务器绑定地址 |
| `FEISHU_WEBHOOK_PORT` | — | `8765` | Webhook 服务器端口 |
| `FEISHU_WEBHOOK_PATH` | — | `/feishu/webhook` | Webhook 端点路径 |
| `HERMES_FEISHU_DEDUP_CACHE_SIZE` | — | `2048` | 跟踪的去重消息 ID 最大数量 |
| `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | — | `0.6` | 文本突发防抖静默期 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | — | `8` | 每批文本合并的最大消息数 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | — | `4000` | 每批文本合并的最大字符数 |
| `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | — | `0.8` | 媒体突发防抖静默期 |

WebSocket 和逐群组 ACL 设置通过 `platforms.feishu.extra` 下的 `config.yaml` 配置（参见上方的 [WebSocket 调优](#websocket-调优) 和 [逐群组访问控制](#逐群组访问控制)）。

## 故障排除

| 问题 | 解决方法 |
|---------|-----|
| `lark-oapi not installed` | 安装 SDK：`pip install lark-oapi` |
| `websockets not installed; websocket mode unavailable` | 安装 websockets：`pip install websockets` |
| `aiohttp not installed; webhook mode unavailable` | 安装 aiohttp：`pip install aiohttp` |
| `FEISHU_APP_ID or FEISHU_APP_SECRET not set` | 设置两个环境变量或通过 `hermes gateway setup` 配置 |
| `Another local Hermes gateway is already using this Feishu app_id` | 同一时间只有一个 Hermes 实例可以使用同一 app_id。请先停止另一个网关。 |
| 机器人在群组中无响应 | 确保已 @提及机器人，检查 `FEISHU_GROUP_POLICY`，如果策略为 `allowlist`，请验证发送者在 `FEISHU_ALLOWED_USERS` 中 |
| `Webhook rejected: invalid verification token` | 确保 `FEISHU_VERIFICATION_TOKEN` 与飞书应用的事件订阅配置中的令牌匹配 |
| `Webhook rejected: invalid signature` | 确保 `FEISHU_ENCRYPT_KEY` 与飞书应用配置中的加密密钥匹配 |
| Post 消息显示为纯文本 | 飞书 API 拒绝了 post 负载；这是正常的回退行为。请查看日志了解详情。 |
| 机器人收不到图片/文件 | 为飞书应用授予 `im:message` 和 `im:resource` 权限范围 |
| 机器人身份未自动检测到 | 通常是由于访问飞书机器人信息端点时的临时网络问题。手动设置 `FEISHU_BOT_OPEN_ID` 和 `FEISHU_BOT_NAME` 作为临时解决方案。 |
| 启用 `FEISHU_ALLOW_BOTS` 后仍忽略对等机器人消息 | Hermes 尚无法识别自身 — 设置 `FEISHU_BOT_OPEN_ID`（如果应用使用 `sender_id_type=user_id`，还需设置 `FEISHU_BOT_USER_ID`）。 |
| 对等机器人显示为 `ou_xxxxxx` 而非名称 | 授予 `application:bot.basic_info:read` 权限范围。 |
| 点击审批按钮时出现错误 200340 | 在飞书开发者控制台启用 **交互式卡片** 能力并配置 **卡片请求 URL**。参见上方 [所需飞书应用配置](#required-feishu-app-configuration)。 |
| `Webhook rate limit exceeded` | 同一 IP 每分钟超过 120 次请求。这通常是配置错误或循环导致的。 |

## 工具集

飞书 / Lark 使用 `hermes-feishu` 平台预设，包含与 Telegram 和其他基于网关的消息平台相同的核心工具。