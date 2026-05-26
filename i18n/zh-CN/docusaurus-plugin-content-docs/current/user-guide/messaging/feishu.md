---
sidebar_position: 11
title: "飞书 / Lark"
description: "将 Hermes 智能体设置为飞书或 Lark 机器人"
---

# 飞书 / Lark 设置

Hermes 智能体作为一个功能齐全的机器人，可与飞书和 Lark 集成。连接成功后，您可以在私聊或群聊中与智能体对话，在家庭聊天中接收定时任务的结果，并通过常规网关流程发送文本、图片、音频和文件附件。

此集成支持两种连接模式：

- `websocket` — 推荐；Hermes 建立出站连接，您无需公共 webhook 端点
- `webhook` — 适用于您希望飞书/Lark 通过 HTTP 将事件推送到您的网关的情况

## Hermes 的行为方式

| 上下文 | 行为 |
|--------|------|
| 私聊 | Hermes 会回复每一条消息。 |
| 群聊 | Hermes 仅在聊天中被 @提及 机器人时才会回复。 |
| 共享群聊 | 默认情况下，在共享聊天中，会话历史记录按用户隔离。 |

此共享聊天行为由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```
仅当您明确希望每个聊天有一个共享对话时，才将其设置为 `false`。

## 步骤一：创建飞书/Lark 应用

### 推荐方式：扫码创建（一条命令）

```bash
hermes gateway setup
```

选择 **飞书/Lark**，然后使用飞书或 Lark 移动应用扫描二维码。Hermes 将自动创建一个具有正确权限的机器人应用并保存凭证。

### 备选方式：手动设置

如果扫码创建不可用，向导将回退到手动输入：

1.  打开飞书或 Lark 开发者控制台：
    -   飞书：[https://open.feishu.cn/](https://open.feishu.cn/)
    -   Lark：[https://open.larksuite.com/](https://open.larksuite.com/)
2.  创建一个新应用。
3.  在 **凭证与基础信息** 中，复制 **App ID** 和 **App Secret**。
4.  为应用启用 **机器人** 能力。
5.  运行 `hermes gateway setup`，选择 **飞书/Lark**，并在提示时输入凭证。

:::warning
请妥善保管 App Secret。任何拥有它的人都可以冒充您的应用。
:::

## 步骤二：选择连接模式

### 推荐：WebSocket 模式

当 Hermes 运行在您的笔记本、工作站或私有服务器上时，请使用 WebSocket 模式。无需公网 URL。官方 Lark SDK 会打开并维护一个持久的出站 WebSocket 连接，并自动重连。

```bash
FEISHU_CONNECTION_MODE=websocket
```

**要求：** 必须安装 `websockets` Python 包。SDK 在内部处理连接生命周期、心跳和自动重连。

**工作原理：** 适配器在后台执行器线程中运行 Lark SDK 的 WebSocket 客户端。传入事件（消息、回应、卡片操作）被分派到主 asyncio 循环。断开连接时，SDK 会自动尝试重新连接。

### 可选：Webhook 模式

仅当您已将 Hermes 运行在可访问的 HTTP 端点后方时才使用 webhook 模式。

```bash
FEISHU_CONNECTION_MODE=webhook
```

在 webhook 模式下，Hermes 通过 `aiohttp` 启动一个 HTTP 服务器，并在以下端点提供飞书服务：

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

当飞书发送 URL 验证挑战（`type: url_verification`）时，webhook 会自动响应，以便您完成飞书开发者控制台中的订阅设置。当设置了 `FEISHU_VERIFICATION_TOKEN` 时，挑战响应会受到此令牌的门控——缺少或不匹配令牌的挑战请求将被拒绝，这样未经认证的远端无法通过回显攻击者控制的挑战数据来证明对端点的控制权。

## 步骤三：配置 Hermes

### 选项 A：交互式设置

```bash
hermes gateway setup
```

选择 **飞书/Lark** 并根据提示填写信息。

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

`FEISHU_DOMAIN` 接受以下值：

-   `feishu` 用于中国版飞书
-   `lark` 用于国际版 Lark

## 步骤四：启动网关

```bash
hermes gateway
```

然后从飞书/Lark 向机器人发送消息以确认连接已激活。

## 主聊天

在飞书/Lark 聊天中使用 `/set-home` 将其标记为主频道，用于接收定时任务结果和跨平台通知。

您也可以预先配置：

```bash
FEISHU_HOME_CHANNEL=oc_xxx
```

## 安全

### 用户允许列表

对于生产环境，请设置飞书 Open ID 的允许列表：

```bash
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
```

如果您将允许列表留空，任何能接触到机器人的人都可能使用它。在群聊中，消息处理前会检查发送者的 open_id 是否在允许列表中。

### Webhook 加密密钥

在 webhook 模式下运行时，设置加密密钥以启用入站 webhook 载荷的签名验证：

```bash
FEISHU_ENCRYPT_KEY=your-encrypt-key
```

此密钥可在您飞书应用配置的 **事件订阅** 部分找到。设置后，适配器将使用以下签名算法验证每个 webhook 请求：

```
SHA256(timestamp + nonce + encrypt_key + body)
```

计算出的哈希值将与 `x-lark-signature` 头使用计时安全比较进行比对。无效或缺失签名的请求将被拒绝，并返回 HTTP 401。

:::tip
在 WebSocket 模式下，签名验证由 SDK 本身处理，因此 `FEISHU_ENCRYPT_KEY` 是可选的。在 webhook 模式下，强烈建议在生产环境中使用。
:::

### 验证令牌

额外一层身份验证，用于检查 webhook 载荷内部的 `token` 字段：

```bash
FEISHU_VERIFICATION_TOKEN=your-verification-token
```

此令牌同样可在您飞书应用的 **事件订阅** 部分找到。设置后，每个入站 webhook 载荷必须在其 `header` 对象中包含匹配的 `token`。不匹配的令牌将被拒绝，并返回 HTTP 401。

`FEISHU_ENCRYPT_KEY` 和 `FEISHU_VERIFICATION_TOKEN` 可以同时使用，以实现纵深防御。

## 群消息策略

`FEISHU_GROUP_POLICY` 环境变量控制 Hermes 是否以及如何在群聊中响应：

```bash
FEISHU_GROUP_POLICY=allowlist   # 默认值
```

| 值 | 行为 |
|---|---|
| `open` | Hermes 响应来自任何群中任何用户的 @提及。 |
| `allowlist` | Hermes 仅响应来自 `FEISHU_ALLOWED_USERS` 中列出用户的 @提及。 |
| `disabled` | Hermes 完全忽略所有群消息。 |

在所有模式下，机器人必须在群中被显式 @提及（或 @所有人）才会处理消息。私聊消息始终绕过此门控。

设置 `FEISHU_REQUIRE_MENTION=false` 以让 Hermes 读取所有群流量而无需 @提及：

```bash
FEISHU_REQUIRE_MENTION=false
```

如需按聊天控制，请在 `group_rules` 条目上设置 `require_mention` — 参见下方 [按群访问控制](#按群访问控制)。

### 机器人身份

Hermes 在启动时自动检测机器人的 `open_id` 和显示名称。仅当自动检测无法访问飞书 API，或您的应用使用租户范围的用户 ID 时，才需要手动设置：

```bash
FEISHU_BOT_OPEN_ID=ou_xxx     # 仅在自动检测失败时使用
FEISHU_BOT_USER_ID=xxx        # 如果您的应用使用 sender_id_type=user_id 则必需
FEISHU_BOT_NAME=MyBot         # 仅在自动检测失败时使用
```

## 机器人间消息传递

默认情况下，Hermes 会忽略其他机器人发送的消息。当您希望 Hermes 参与 A2A 协调或接收同一群组中其他机器人的通知时，请启用机器人间消息传递。

```bash
FEISHU_ALLOW_BOTS=mentions   # 默认值：none
```

| 值 | 行为 |
|---|---|
| `none` | 忽略来自其他机器人的所有消息（默认）。 |
| `mentions` | 仅当对方机器人 @提及 Hermes 时接受。 |
| `all` | 接受每个对方机器人的消息。 |

也可在 `config.yaml` 中配置为 `feishu.allow_bots`（两者都设置时，环境变量优先）。

对等机器人无需添加到 `FEISHU_ALLOWED_USERS` — 该允许列表仅适用于人类发送者。

授予 `application:bot.basic_info:read` 权限范围以显示对等机器人名称；没有此权限，对等机器人仍然能正确路由，但会显示为其 `open_id`。

## 交互式卡片操作

当用户点击机器人发送的交互式卡片上的按钮或与之交互时，适配器会将其作为合成的 `/card` 命令事件路由：

-   按钮点击变为：`/card button {"key": "value", ...}`
-   卡片定义中操作的 `value` 载荷会作为 JSON 包含在内。
-   卡片操作会在 15 分钟的窗口内去重，以防止重复处理。

网关驱动的更新提示使用原生飞书 `是` / `否` 卡片，而不是回退到纯文本回复。当 `hermes update --gateway` 需要确认时，适配器会将选定的答案记录在 Hermes 的 `.update_response` 文件中，并用已解决状态内联替换卡片。

卡片操作事件以 `MessageType.COMMAND` 分派，因此它们流经正常的命令处理管道。

这也是 **命令审批** 的工作方式 — 当智能体需要运行危险命令时，它会发送一个带有“允许一次”/“会话”/“始终”/“拒绝”按钮的交互式卡片。用户点击按钮，卡片操作回调会将审批决策传回给智能体。

### 必需的飞书应用配置

交互式卡片需要在飞书开发者控制台中进行 **三项** 配置。缺少任何一项都会导致用户在点击卡片按钮时出现错误 **200340**。

1.  **订阅卡片操作事件：**
    在 **事件订阅** 中，将 `card.action.trigger` 添加到您的订阅事件中。

2.  **启用交互式卡片能力：**
    在 **应用功能 > 机器人** 中，确保 **交互式卡片** 开关已启用。这告知飞书您的应用可以接收卡片操作回调。

3.  **配置卡片请求 URL（仅 webhook 模式）：**
    在 **应用功能 > 机器人 > 消息卡片请求 URL** 中，将 URL 设置为与您的事件 webhook 相同的端点（例如 `https://your-server:8765/feishu/webhook`）。在 WebSocket 模式下，此步骤由 SDK 自动处理。

:::warning
缺少这三个步骤，飞书仍能成功 *发送* 交互式卡片（发送仅需 `im:message:send` 权限），但点击任何按钮将返回错误 200340。卡片看起来可以工作 — 错误仅在用户与之交互时才会出现。
:::

**按群访问控制**

## 文档评论智能回复

除聊天功能外，适配器还能回复**飞书/Lark 文档**中的 `@`-提及。当用户对文档进行评论（选择本地文本或整篇文档评论）并@提及机器人时，Hermes 会读取文档内容和相关评论线程，并在线程中内联发布 LLM 回复。

由 `drive.notice.comment_add_v1` 事件驱动，处理器会：

- 并行获取文档内容和评论时间线（整篇文档线程获取 20 条消息，本地选择线程获取 12 条）。
- 使用限定于该单一评论会话的 `feishu_doc` + `feishu_drive` 工具集运行智能体。
- 将回复分块为 4000 字符，并以线程回复形式回发。
- 为每文档会话缓存 1 小时，并设置 50 条消息上限，以便同一文档的后续评论能保持上下文。

### 三级访问控制

文档评论回复**仅限显式授权** — 不存在隐式的全允许模式。权限按此顺序解析（每个字段，首次匹配生效）：

1. **精确文档** — 针对特定文档令牌限定的规则。
2. **通配符** — 匹配文档模式的规则。
3. **顶层** — 工作区的默认规则。

每条规则可用的两种策略：

- **`allowlist`** — 静态的用户/租户列表。
- **`pairing`** — 静态列表 ∪ 运行时批准的存储。适用于需要主持人实时授予访问权限的灰度发布。

规则存储在 `~/.hermes/feishu_comment_rules.json`（配对授权存储在 `~/.hermes/feishu_comment_pairing.json`），支持修改时间缓存热重载 — 修改将在下一次评论事件时生效，无需重启网关。

CLI 命令：

```bash
# 检查当前规则和配对状态
python -m gateway.platforms.feishu_comment_rules status

# 模拟对特定文档 + 用户的访问检查
python -m gateway.platforms.feishu_comment_rules check <fileType:fileToken> <user_open_id>

# 运行时管理配对授权
python -m gateway.platforms.feishu_comment_rules pairing list
python -m gateway.platforms.feishu_comment_rules pairing add <user_open_id>
python -m gateway.platforms.feishu_comment_rules pairing remove <user_open_id>
```

### 所需的飞书应用配置

除了已授予的聊天/卡片权限外，还需添加驱动器评论事件：

- 在**事件订阅**中订阅 `drive.notice.comment_add_v1`。
- 授予 `docs:doc:readonly` 和 `drive:drive:readonly` 权限范围，以便处理器能读取文档内容。

## 媒体支持

### 入站（接收）

适配器从用户处接收并缓存以下媒体类型：

| 类型 | 扩展名 | 处理方式 |
|------|--------|----------|
| **图片** | .jpg, .jpeg, .png, .gif, .webp, .bmp | 通过飞书 API 下载并本地缓存 |
| **音频** | .ogg, .mp3, .wav, .m4a, .aac, .flac, .opus, .webm | 下载并缓存；小文本文件会自动提取 |
| **视频** | .mp4, .mov, .avi, .mkv, .webm, .m4v, .3gp | 下载并作为文档缓存 |
| **文件** | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx 等 | 下载并作为文档缓存 |

来自富文本（post）消息的媒体，包括内联图片和文件附件，也会被提取和缓存。

对于小的基于文本文档（.txt, .md），文件内容会自动注入消息文本，以便智能体无需工具即可直接读取。

### 出站（发送）

| 方法 | 发送内容 |
|------|----------|
| `send` | 文本或富 post 消息（基于 markdown 内容自动检测） |
| `send_image` / `send_image_file` | 将图片上传至飞书，然后作为原生气泡发送（可选附带标题） |
| `send_document` | 将文件上传至飞书 API，然后作为文件附件发送 |
| `send_voice` | 将音频文件作为飞书文件附件上传 |
| `send_video` | 上传视频并作为原生媒体消息发送 |
| `send_animation` | GIF 会降级为文件附件（飞书没有原生 GIF 气泡） |

文件上传路由根据扩展名自动选择：

- `.ogg`, `.opus` → 作为 `opus` 音频上传
- `.mp4`, `.mov`, `.avi`, `.m4v` → 作为 `mp4` 媒体上传
- `.pdf`, `.doc(x)`, `.xls(x)`, `.ppt(x)` → 以其文档类型上传
- 其他所有文件 → 作为通用流文件上传

## Markdown 渲染与帖子回退机制

当出站文本包含 markdown 格式（标题、粗体、列表、代码块、链接等）时，适配器会自动将其作为飞书 **帖子（post）** 消息发送，并嵌入 `md` 标签，而非作为纯文本发送。这使得消息能在飞书客户端中实现富文本渲染。

如果飞书 API 拒绝了帖子消息体（例如，由于不支持的 markdown 构造），适配器会自动回退为纯文本发送，并去除 markdown 格式。这种两阶段回退机制确保了消息始终能被送达。

纯文本消息（未检测到 markdown）会以简单的 `text` 消息类型发送。

## 处理状态回应

在智能体处理消息时，机器人会在你的消息上显示一个 `Typing` 回应。当回复到达时，该回应会被清除；如果处理失败，则会替换为 `CrossMark` 回应。

设置 `FEISHU_REACTIONS=false` 可关闭此功能。

## 突发消息保护与批处理

适配器包含针对快速消息突发的防抖机制，以避免对智能体造成过载：

### 文本批处理

当用户快速连续发送多条文本消息时，它们会被合并为一个单一事件后再进行分发：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | 0.6秒 |
| 每批最大消息数 | `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | 8 |
| 每批最大字符数 | `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | 4000 |

### 媒体批处理

快速连续发送的多个媒体附件（例如，拖入多张图片）会被合并为一个单一事件：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 0.8秒 |

### 按聊天串行处理

同一聊天内的消息会被串行处理（一次处理一条），以维持对话的连贯性。每个聊天都有自己的锁，因此不同聊天中的消息是并行处理的。

## 速率限制（Webhook 模式）

在 webhook 模式下，适配器会强制执行基于 IP 的速率限制，以防止滥用：

- **时间窗口：** 60 秒滑动窗口
- **限制：** 每个（应用ID，路径，IP）三元组每窗口 120 个请求
- **跟踪上限：** 最多跟踪 4096 个唯一键（防止内存无限增长）

超过限制的请求会收到 HTTP 429（请求过多）响应。

### Webhook 异常跟踪

适配器会跟踪每个 IP 地址的连续错误响应次数。如果同一个 IP 在 6 小时窗口内连续出现 25 次错误，系统会记录一条警告。这有助于检测配置错误的客户端或探测尝试。

其他 Webhook 保护措施：
- **请求体大小限制：** 最大 1 MB
- **请求体读取超时：** 30 秒
- **Content-Type 强制检查：** 仅接受 `application/json`

## WebSocket 调优

使用 `websocket` 模式时，你可以自定义重连和 ping 行为：

```yaml
platforms:
  feishu:
    extra:
      ws_reconnect_interval: 120   # 重连尝试之间的秒数（默认：120）
      ws_ping_interval: 30         # WebSocket ping 之间的秒数（可选；未设置则使用 SDK 默认值）
```

| 设置 | 配置键 | 默认值 | 描述 |
|---------|-----------|---------|-------------|
| 重连间隔 | `ws_reconnect_interval` | 120秒 | 两次重连尝试之间的等待时间 |
| Ping 间隔 | `ws_ping_interval` | _(SDK 默认值)_ | WebSocket 保活 ping 的频率 |

## 群组访问控制

除了全局的 `FEISHU_GROUP_POLICY`，你还可以使用 config.yaml 中的 `group_rules` 为每个群聊设置细粒度规则：

```yaml
platforms:
  feishu:
    extra:
      default_group_policy: "open"     # 不在 group_rules 中的群聊的默认策略
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
          require_mention: false       # 覆盖此聊天的 FEISHU_REQUIRE_MENTION 设置
```

| 策略 | 描述 |
|--------|-------------|
| `open` | 群聊中的任何人都可以使用机器人 |
| `allowlist` | 只有群聊 `allowlist` 中的用户可以使用机器人 |
| `blacklist` | 除了群聊 `blacklist` 中的用户外，所有人都可以使用机器人 |
| `admin_only` | 只有全局 `admins` 列表中的用户可以在此群聊中使用机器人 |
| `disabled` | 机器人忽略此群聊中的所有消息 |

在 `group_rules` 条目中设置 `require_mention: false` 可跳过该特定聊天的 @提及要求。如果省略，该聊天将继承全局的 `FEISHU_REQUIRE_MENTION` 值。

未在 `group_rules` 中列出的群聊将回退到 `default_group_policy`（默认为 `FEISHU_GROUP_POLICY` 的值）。

## 消息去重

入站消息通过消息 ID 进行去重，TTL 为 24 小时。去重状态在重启后会持久化到 `~/.hermes/feishu_seen_message_ids.json`。

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 缓存大小 | `HERMES_FEISHU_DEDUP_CACHE_SIZE` | 2048 条目 |

## 所有环境变量

| 变量 | 必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `FEISHU_APP_ID` | ✅ | — | 飞书/Lark 应用 ID |
| `FEISHU_APP_SECRET` | ✅ | — | 飞书/Lark 应用密钥 |
| `FEISHU_DOMAIN` | — | `feishu` | `feishu`（中国）或 `lark`（国际） |
| `FEISHU_CONNECTION_MODE` | — | `websocket` | `websocket` 或 `webhook` |
| `FEISHU_ALLOWED_USERS` | — | _(空)_ | 逗号分隔的 open_id 列表，用作用户白名单 |
| `FEISHU_ALLOW_BOTS` | — | `none` | 接受来自其他机器人的消息：`none`、`mentions` 或 `all` |
| `FEISHU_REQUIRE_MENTION` | — | `true` | 群聊消息是否必须 @提及机器人 |
| `FEISHU_HOME_CHANNEL` | — | — | 用于定时任务/通知输出的聊天 ID |
| `FEISHU_ENCRYPT_KEY` | — | _(空)_ | 用于 webhook 签名验证的加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | — | _(空)_ | 用于 webhook 请求体认证的验证令牌 |
| `FEISHU_GROUP_POLICY` | — | `allowlist` | 群聊消息策略：`open`、`allowlist`、`disabled` |
| `FEISHU_BOT_OPEN_ID` | — | _(空)_ | 机器人的 open_id（用于 @提及检测） |
| `FEISHU_BOT_USER_ID` | — | _(空)_ | 机器人的 user_id（用于 @提及检测） |
| `FEISHU_BOT_NAME` | — | _(空)_ | 机器人的显示名称（用于 @提及检测） |
| `FEISHU_WEBHOOK_HOST` | — | `127.0.0.1` | Webhook 服务器绑定地址 |
| `FEISHU_WEBHOOK_PORT` | — | `8765` | Webhook 服务器端口 |
| `FEISHU_WEBHOOK_PATH` | — | `/feishu/webhook` | Webhook 端点路径 |
| `HERMES_FEISHU_DEDUP_CACHE_SIZE` | — | `2048` | 要跟踪的最大去重消息 ID 数 |
| `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | — | `0.6` | 文本突发防抖静默期 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | — | `8` | 每批合并的最大消息数 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | — | `4000` | 每批合并的最大字符数 |
| `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | — | `0.8` | 媒体突发防抖静默期 |

WebSocket 和群组 ACL 设置通过 `config.yaml` 中的 `platforms.feishu.extra` 进行配置（参见上面的 [WebSocket 调优](#websocket-调优) 和 [群组访问控制](#群组访问控制)）。

## 故障排除

| 问题 | 解决方法 |
|---------|-----|
| `lark-oapi not installed` | 安装 SDK：`pip install lark-oapi` |
| `websockets not installed; websocket mode unavailable` | 安装 websockets：`pip install websockets` |
| `aiohttp not installed; webhook mode unavailable` | 安装 aiohttp：`pip install aiohttp` |
| `FEISHU_APP_ID or FEISHU_APP_SECRET not set` | 设置两个环境变量，或通过 `hermes gateway setup` 进行配置 |
| `Another local Hermes gateway is already using this Feishu app_id` | 同一时间只能有一个 Hermes 实例使用同一个 app_id。请先停止另一个网关。 |
| 机器人在群聊中无响应 | 确保机器人被 @提及，检查 `FEISHU_GROUP_POLICY`，如果策略是 `allowlist`，请验证发送者是否在 `FEISHU_ALLOWED_USERS` 中 |
| `Webhook rejected: invalid verification token` | 确保 `FEISHU_VERIFICATION_TOKEN` 与你的飞书应用事件订阅配置中的令牌匹配 |
| `Webhook rejected: invalid signature` | 确保 `FEISHU_ENCRYPT_KEY` 与你飞书应用配置中的加密密钥匹配 |
| 帖子消息显示为纯文本 | 飞书 API 拒绝了帖子消息体；这是正常的回退行为。请检查日志了解详情。 |
| 图片/文件未被机器人接收 | 为你的飞书应用授予 `im:message` 和 `im:resource` 权限范围 |
| 机器人身份未自动检测 | 通常是访问飞书机器人信息端点时出现的暂时性网络问题。作为解决方案，可以手动设置 `FEISHU_BOT_OPEN_ID` 和 `FEISHU_BOT_NAME`。 |
| 启用 `FEISHU_ALLOW_BOTS` 后，其他机器人消息仍被忽略 | Hermes 尚无法识别自身身份——请设置 `FEISHU_BOT_OPEN_ID`（如果你的应用使用 `sender_id_type=user_id`，还需设置 `FEISHU_BOT_USER_ID`）。 |
| 其他机器人显示为 `ou_xxxxxx` 而非名称 | 授予 `application:bot.basic_info:read` 权限范围。 |
| 点击审批按钮时出现错误 200340 | 在飞书开发者控制台中启用**交互式卡片**能力并配置**卡片请求 URL**。参见上面的 [必需的飞书应用配置](#必需的飞书应用配置)。 |
| `Webhook rate limit exceeded` | 来自同一 IP 的请求超过 120 次/分钟。这通常是配置错误或循环。 |

## 工具集

飞书/Lark 使用 `hermes-feishu` 平台预设，其中包含与 Telegram 和其他基于网关的消息平台相同的核心工具。