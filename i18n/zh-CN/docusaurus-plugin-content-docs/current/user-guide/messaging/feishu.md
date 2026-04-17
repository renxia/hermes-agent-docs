---
sidebar_position: 11
title: "飞书 / Lark"
description: "将 Hermes Agent 设置为飞书或 Lark 机器人"
---

# 飞书 / Lark 设置

Hermes Agent 集成飞书和 Lark，作为一个功能齐全的机器人。连接后，您可以在私聊或群聊中与该机器人聊天，在群聊中接收定时任务（cron job）结果，并通过正常的网关流程发送文本、图片、音频和文件附件。

该集成支持两种连接模式：

- `websocket` — 推荐；Hermes 会建立出站连接，您无需公共 Webhook 端点。
- `webhook` — 当您希望飞书/Lark 通过 HTTP 将事件推送到您的网关时非常有用。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| 私聊 | Hermes 会响应每一条消息。 |
| 群聊 | 只有当机器人被 @提及时，Hermes 才会响应。 |
| 共享群聊 | 默认情况下，会话历史记录在共享群聊内按用户隔离。 |

此共享群聊行为由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您明确希望每个群聊拥有一个共享对话时，才将其设置为 `false`。

## 步骤 1：创建飞书 / Lark 应用

### 推荐：扫码创建（一键式）

```bash
hermes gateway setup
```

选择 **飞书 / Lark**，然后使用您的飞书或 Lark 移动应用扫描二维码。Hermes 将自动使用正确的权限创建一个机器人应用，并保存凭据。

### 备选：手动设置

如果扫码创建不可用，向导将回退到手动输入：

1. 打开飞书或 Lark 开发者控制台：
   - 飞书：[https://open.feishu.cn/](https://open.feishu.cn/)
   - Lark：[https://open.larksuite.com/](https://open.larksuite.com/)
2. 创建一个新的应用。
3. 在 **凭证与基本信息** 中，复制 **应用 ID** 和 **应用密钥**。
4. 为应用启用 **机器人** 功能。
5. 运行 `hermes gateway setup`，选择 **飞书 / Lark**，并在提示时输入凭据。

:::warning
请保护好应用密钥。任何拥有它的人都可以冒充您的应用。
:::

## 步骤 2：选择连接模式

### 推荐：WebSocket 模式

当 Hermes 运行在您的笔记本电脑、工作站或私有服务器上时，请使用 WebSocket 模式。无需公共 URL。官方 Lark SDK 会建立并维护一个持久的出站 WebSocket 连接，并支持自动重连。

```bash
FEISHU_CONNECTION_MODE=websocket
```

**要求：** 必须安装 `websockets` Python 包。SDK 会在内部处理连接生命周期、心跳和自动重连。

**工作原理：** 适配器在后台执行器线程中运行 Lark SDK 的 WebSocket 客户端。传入事件（消息、反应、卡片操作）会被分派到主 asyncio 循环。断开连接时，SDK 将尝试自动重新连接。

### 可选：Webhook 模式

仅当您已经在可访问的 HTTP 端点后运行 Hermes 时，才使用 Webhook 模式。

```bash
FEISHU_CONNECTION_MODE=webhook
```

在 Webhook 模式下，Hermes 会启动一个 HTTP 服务器（通过 `aiohttp`），并在以下地址提供飞书端点：

```text
/feishu/webhook
```

**要求：** 必须安装 `aiohttp` Python 包。

您可以自定义 Webhook 服务器的绑定地址和路径：

```bash
FEISHU_WEBHOOK_HOST=127.0.0.1   # 默认值: 127.0.0.1
FEISHU_WEBHOOK_PORT=8765         # 默认值: 8765
FEISHU_WEBHOOK_PATH=/feishu/webhook  # 默认值: /feishu/webhook
```

当飞书发送 URL 验证挑战（`type: url_verification`）时，Webhook 会自动响应，以便您可以在飞书开发者控制台中完成订阅设置。

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

# 可选但强烈推荐
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
FEISHU_HOME_CHANNEL=oc_xxx
```

`FEISHU_DOMAIN` 可接受：

- `feishu` 用于飞书中国
- `lark` 用于 Lark 国际版

## 步骤 4：启动网关

```bash
hermes gateway
```

然后从飞书/Lark 向机器人发送消息，以确认连接已激活。

## 首页聊天

在飞书/Lark 聊天中使用 `/set-home` 将其标记为定时任务结果和跨平台通知的首页频道。

您也可以预先配置它：

```bash
FEISHU_HOME_CHANNEL=oc_xxx
```

## 安全性

### 用户白名单

在生产环境中使用时，设置飞书 Open ID 白名单：

```bash
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
```

如果留空白名单，任何能够接触到机器人的人都可能使用它。在群聊中，系统会在处理消息前，根据发送者的 `open_id` 检查白名单。

### Webhook 加密密钥

在 Webhook 模式下运行时，设置加密密钥以启用传入 Webhook 有效载荷的签名验证：

```bash
FEISHU_ENCRYPT_KEY=your-encrypt-key
```

此密钥可以在飞书应用配置的 **事件订阅** 部分找到。设置后，适配器使用签名算法验证每个 Webhook 请求：

```
SHA256(timestamp + nonce + encrypt_key + body)
```

计算出的哈希值将与 `x-lark-signature` 头部进行时序安全比较。带有无效或缺失签名的请求将以 HTTP 401 拒绝。

:::tip
在 WebSocket 模式下，签名验证由 SDK 本身处理，因此 `FEISHU_ENCRYPT_KEY` 是可选的。在 Webhook 模式下，强烈建议用于生产环境。
:::

### 验证令牌

这是一个额外的身份验证层，用于检查 Webhook 有效载荷中的 `token` 字段：

```bash
FEISHU_VERIFICATION_TOKEN=your-verification-token
```

此令牌也可以在飞书应用的 **事件订阅** 部分找到。设置后，每个传入的 Webhook 有效载荷的 `header` 对象必须包含匹配的 `token`。令牌不匹配的请求将以 HTTP 401 拒绝。

`FEISHU_ENCRYPT_KEY` 和 `FEISHU_VERIFICATION_TOKEN` 都可以结合使用，以实现纵深防御。

## 群消息策略

`FEISHU_GROUP_POLICY` 环境变量控制 Hermes 在群聊中响应的条件和方式：

```bash
FEISHU_GROUP_POLICY=allowlist   # 默认值
```

| 值 | 行为 |
|-------|----------|
| `open` | Hermes 对任何用户在任何群组的 @提及都会响应。 |
| `allowlist` | Hermes 只对 `FEISHU_ALLOWED_USERS` 中列出的用户发送的 @提及做出响应。 |
| `disabled` | Hermes 完全忽略所有群消息。 |

在所有模式下，消息处理前，机器人必须在群组中被明确 @提及（或 @all）。私聊消息绕过了此门控。

### @提及门控的机器人身份

为了在群组中进行精确的 @提及检测，适配器需要知道机器人的身份。可以显式提供：

```bash
FEISHU_BOT_OPEN_ID=ou_xxx
FEISHU_BOT_USER_ID=xxx
FEISHU_BOT_NAME=MyBot
```

如果未设置这些变量，适配器将在启动时尝试通过应用信息 API 自动发现机器人名称。要使此功能正常工作，请授予 `admin:app.info:readonly` 或 `application:application:self_manage` 权限范围。

## 交互式卡片操作

当用户点击机器人发送的按钮或与交互式卡片互动时，适配器会将这些操作路由为合成的 `/card` 命令事件：

- 按钮点击变为：`/card button {"key": "value", ...}`
- 卡片定义的动作 `value` 有效载荷将作为 JSON 包含进来。
- 卡片操作会进行去重处理，时间窗口为 15 分钟，以防止重复处理。

卡片操作事件会使用 `MessageType.COMMAND` 分派，因此它们会流经正常的命令处理流程。

这也是 **命令审批** 的工作方式——当代理需要运行危险命令时，它会发送一个包含“允许一次 / 会话 / 始终 / 拒绝”按钮的交互式卡片。用户点击按钮，卡片操作回调将审批决定返回给代理。

### 必需的飞书应用配置

交互式卡片需要在飞书开发者控制台中完成 **三个** 配置步骤。缺少任何一步，当用户点击卡片按钮时，都会导致错误 **200340**。

1. **订阅卡片操作事件：**
   在 **事件订阅** 中，将 `card.action.trigger` 添加到您订阅的事件中。

2. **启用交互式卡片功能：**
   在 **应用功能 > 机器人** 中，确保 **交互式卡片** 开关已启用。这告诉飞书您的应用可以接收卡片操作回调。

3. **配置卡片请求 URL（仅 Webhook 模式）：**
   在 **应用功能 > 机器人 > 消息卡片请求 URL** 中，将 URL 设置为您事件 Webhook 的相同端点（例如 `https://your-server:8765/feishu/webhook`）。在 WebSocket 模式下，SDK 会自动处理此项。

:::warning
如果没有完成所有三个步骤，飞书仍能成功*发送*交互式卡片（发送本身只需要 `im:message:send` 权限），但点击任何按钮都会返回 200340 错误。卡片看起来是工作的——只有当用户与它互动时，错误才会暴露出来。
:::

## 媒体支持

### 传入（接收）

适配器接收并缓存以下媒体类型：

| 类型 | 扩展名 | 处理方式 |
|------|-----------|-------------------|
| **图片** | .jpg, .jpeg, .png, .gif, .webp, .bmp | 通过飞书 API 下载并本地缓存 |
| **音频** | .ogg, .mp3, .wav, .m4a, .aac, .flac, .opus, .webm | 下载并缓存；小型文本文件会自动提取 |
| **视频** | .mp4, .mov, .avi, .mkv, .webm, .m4v, .3gp | 下载并缓存为文档 |
| **文件** | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx 等 | 下载并缓存为文档 |

来自富文本（post）消息的媒体，包括内联图片和文件附件，也会被提取和缓存。

对于小型文本文档（.txt, .md），文件内容会自动注入到消息文本中，以便代理无需工具即可直接读取。

### 出口（发送）

| 方法 | 发送内容 |
|--------|--------------|
| `send` | 文本或富文本消息（根据 markdown 内容自动检测） |
| `send_image` / `send_image_file` | 上传图片到飞书，然后作为原生图片气泡发送（可选配图） |
| `send_document` | 上传文件到飞书 API，然后作为文件附件发送 |
| `send_voice` | 将音频文件作为飞书文件附件上传 |
| `send_video` | 上传视频并作为原生媒体消息发送 |
| `send_animation` | GIF 会降级为文件附件（飞书没有原生的 GIF 气泡） |

文件上传路由根据扩展名自动进行：

- `.ogg`, `.opus` → 作为 `opus` 音频上传
- `.mp4`, `.mov`, `.avi`, `.m4v` → 作为 `mp4` 媒体上传
- `.pdf`, `.doc(x)`, `.xls(x)`, `.ppt(x)` → 作为其文档类型上传
- 其他所有类型 → 作为通用流文件上传

## Markdown 渲染和消息回退

当出口文本包含 Markdown 格式（标题、粗体、列表、代码块、链接等）时，适配器会自动将其作为带有嵌入 `md` 标签的飞书 **帖子** 消息发送，而不是纯文本。这使得飞书客户端能够进行富文本渲染。

如果飞书 API 拒绝了帖子载荷（例如，由于不支持的 Markdown 结构），适配器会自动回退到以纯文本形式发送，并剥离 Markdown 标记。这种两阶段回退机制确保消息始终能够送达。

纯文本消息（未检测到 Markdown）作为简单的 `text` 消息类型发送。

## ACK 表情反应

当适配器接收到传入消息时，会立即添加一个 ✅ (OK) 表情反应，以表明消息已收到并正在处理。这在代理完成响应之前提供了视觉反馈。

此反应是持久的——在发送响应后仍然保留在消息上，充当接收凭证。

用户对机器人消息的反应也会被跟踪。如果用户在一个由机器人发送的消息上添加或删除了表情反应，它将作为合成文本事件（`reaction:added:EMOJI_TYPE` 或 `reaction:removed:EMOJI_TYPE`）路由，以便代理可以响应反馈。

## 突发保护和批处理

适配器包含消息突发（rapid message bursts）的去抖动机制，以避免给代理造成过大负担：

### 文本批处理

当用户快速发送多条文本消息时，它们会被合并成一个事件再分派：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | 0.6s |
| 每批最大消息数 | `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | 8 |
| 每批最大字符数 | `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | 4000 |

### 媒体批处理

快速发送的多个媒体附件（例如拖动多张图片）会被合并成一个事件：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 0.8s |

### 每群聊序列化

同一聊天中的消息是按顺序处理的（一次处理一条），以保持对话的连贯性。每个聊天都有自己的锁，因此不同聊天中的消息是并发处理的。

## 限流（Webhook 模式）

在 Webhook 模式下，适配器强制执行每 IP 的限流，以防止滥用：

- **窗口：** 60 秒滑动窗口
- **限制：** 每个 (app_id, path, IP) 三元组每窗口 120 个请求
- **跟踪上限：** 最多跟踪 4096 个唯一键（防止无界内存增长）

超出限制的请求将收到 HTTP 429（请求过多）。

### Webhook 异常跟踪

适配器跟踪每个 IP 地址的连续错误响应。如果在 6 小时窗口内从同一 IP 发出 25 次连续错误，将记录警告。这有助于检测配置错误的客户端或探测尝试。

额外的 Webhook 保护措施：
- **Body 大小限制：** 最大 1 MB
- **Body 读取超时：** 30 秒
- **Content-Type 强制执行：** 只接受 `application/json`

## WebSocket 调优

在使用 `websocket` 模式时，您可以自定义重连和心跳行为：

```yaml
platforms:
  feishu:
    extra:
      ws_reconnect_interval: 120   # 重连间隔（秒）（默认值：120）
      ws_ping_interval: 30         # WebSocket 心跳间隔（秒）（可选；未设置时 SDK 默认值）
```

| 设置 | 配置键 | 默认值 | 描述 |
|---------|-----------|---------|-------------|
| 重连间隔 | `ws_reconnect_interval` | 120s | 重连尝试之间的等待时间 |
| 心跳间隔 | `ws_ping_interval` | _(SDK 默认)_ | WebSocket 心跳包的发送频率 |

## 每群聊访问控制

除了全局的 `FEISHU_GROUP_POLICY` 外，您还可以使用 `config.yaml` 中的 `group_rules` 为每个群聊设置精细的规则：

```yaml
platforms:
  feishu:
    extra:
      default_group_policy: "open"     # group_rules 中未列出的群组默认策略
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
| `open` | 群组中的任何人都可以使用机器人 |
| `allowlist` | 只有群组 `allowlist` 中的用户可以使用机器人 |
| `blacklist` | 除群组 `blacklist` 中的用户外，其他人都可以使用机器人 |
| `admin_only` | 只有全局 `admins` 列表中的用户才能在此群组中使用机器人 |
| `disabled` | 机器人忽略此群组中的所有消息 |

未列在 `group_rules` 中的群组将回退到 `default_group_policy`（默认为 `FEISHU_GROUP_POLICY` 的值）。

## 去重

传入的消息使用消息 ID 进行去重，有效期为 24 小时。去重状态会持久化到 `~/.hermes/feishu_seen_message_ids.json`，以跨重启保留。

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 缓存大小 | `HERMES_FEISHU_DEDUP_CACHE_SIZE` | 2048 条目 |

## 所有环境变量

| 变量 | 是否必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `FEISHU_APP_ID` | ✅ | — | 飞书/Lark 应用 ID |
| `FEISHU_APP_SECRET` | ✅ | — | 飞书/Lark 应用密钥 |
| `FEISHU_DOMAIN` | — | `feishu` | `feishu` (中国) 或 `lark` (国际版) |
| `FEISHU_CONNECTION_MODE` | — | `websocket` | `websocket` 或 `webhook` |
| `FEISHU_ALLOWED_USERS` | — | _(空)_ | 用户白名单的逗号分隔 open_id 列表 |
| `FEISHU_HOME_CHANNEL` | — | — | 定时任务/通知输出的聊天 ID |
| `FEISHU_ENCRYPT_KEY` | — | _(空)_ | Webhook 签名验证的加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | — | _(空)_ | Webhook 有效载荷认证的验证令牌 |
| `FEISHU_GROUP_POLICY` | — | `allowlist` | 群消息策略：`open`、`allowlist`、`disabled` |
| `FEISHU_BOT_OPEN_ID` | — | _(空)_ | 机器人的 open_id（用于 @提及检测） |
| `FEISHU_BOT_USER_ID` | — | _(空)_ | 机器人的 user_id（用于 @提及检测） |
| `FEISHU_BOT_NAME` | — | _(空)_ | 机器人的显示名称（用于 @提及检测） |
| `FEISHU_WEBHOOK_HOST` | — | `127.0.0.1` | Webhook 服务器绑定地址 |
| `FEISHU_WEBHOOK_PORT` | — | `8765` | Webhook 服务器端口 |
| `FEISHU_WEBHOOK_PATH` | — | `/feishu/webhook` | Webhook 端点路径 |
| `HERMES_FEISHU_DEDUP_CACHE_SIZE` | — | `2048` | 要跟踪的最大去重消息 ID 数量 |
| `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | — | `0.6` | 文本突发去抖静默期 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | — | `8` | 每个文本批次合并的最大消息数 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | — | `4000` | 每个文本批次合并的最大字符数 |
| `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | — | `0.8` | 媒体突发去抖静默期 |

WebSocket 和每群聊 ACL 设置通过 `config.yaml` 中的 `platforms.feishu.extra` 配置（参见上方的 [WebSocket 调优](#websocket-tuning) 和 [每群聊访问控制](#per-group-access-control)）。

## 故障排除

| 问题 | 修复方法 |
|---------|-----|
| `lark-oapi not installed` | 安装 SDK：`pip install lark-oapi` |
| `websockets not installed; websocket mode unavailable` | 安装 websockets：`pip install websockets` |
| `aiohttp not installed; webhook mode unavailable` | 安装 aiohttp：`pip install aiohttp` |
| `FEISHU_APP_ID 或 FEISHU_APP_SECRET 未设置` | 设置两个环境变量，或通过 `hermes gateway setup` 配置 |
| `另一个本地 Hermes 网关已使用此 Feishu app_id` | 每次只能有一个 Hermes 实例使用相同的 app_id。请先停止其他网关。 |
| 群聊中机器人不响应 | 确保机器人被 @提及，检查 `FEISHU_GROUP_POLICY`，如果策略为 `allowlist`，请验证发送者是否在 `FEISHU_ALLOWED_USERS` 中 |
| `Webhook rejected: invalid verification token` | 确保 `FEISHU_VERIFICATION_TOKEN` 与飞书应用事件订阅配置中的令牌匹配 |
| `Webhook rejected: invalid signature` | 确保 `FEISHU_ENCRYPT_KEY` 与飞书应用配置中的加密密钥匹配 |
| 帖子消息显示为纯文本 | 飞书 API 拒绝了帖子载荷；这是正常的回退行为。请检查日志了解详情。 |
| 机器人未收到图片/文件 | 为您的飞书应用授予 `im:message` 和 `im:resource` 权限范围 |
| 机器人身份未自动检测到 | 授予 `admin:app.info:readonly` 范围，或手动设置 `FEISHU_BOT_OPEN_ID` / `FEISHU_BOT_NAME` |
| 点击审批按钮时出现错误 200340 | 在飞书开发者控制台中启用 **交互式卡片** 功能并配置 **卡片请求 URL**。参见上方的 [必需的飞书应用配置](#required-feishu-app-configuration)。 |
| `Webhook rate limit exceeded` | 来自同一 IP 的请求超过 120 次/分钟。这通常是配置错误或循环导致的。 |

## 工具集

飞书 / Lark 使用 `hermes-feishu` 平台预设，它包含了与 Telegram 和其他基于网关的消息平台相同的核心工具。