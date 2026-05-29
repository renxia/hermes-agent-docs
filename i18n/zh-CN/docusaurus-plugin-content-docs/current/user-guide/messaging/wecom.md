---
sidebar_position: 14
title: "企业微信"
description: "通过 AI Bot WebSocket 网关将 Hermes 智能体连接至企业微信"
---

# 企业微信

将 Hermes 连接至 [企业微信](https://work.weixin.qq.com/)（腾讯的企业级即时通讯平台）。该适配器利用企业微信的 AI Bot WebSocket 网关实现实时双向通信——无需公网端点或 webhook。

另请参见：[企业微信回调](./wecom-callback.md) 以了解入站 webhook 设置。

## 前提条件

- 一个企业微信组织账号
- 在企业微信管理后台创建的 AI Bot
- 该 Bot 凭证页面上的 Bot ID 和 Secret
- Python 包：`aiohttp` 和 `httpx`

# 设置

### 步骤 1：创建一个 AI 机器人

#### 推荐方式：扫码创建（一条命令）

```bash
hermes gateway setup
```

选择 **WeCom**，然后使用企业微信移动应用扫描二维码。Hermes 将自动创建具有正确权限的机器人应用程序并保存凭据。

设置向导将：
1. 在您的终端中显示一个二维码
2. 等待您使用企业微信移动应用扫描它
3. 自动检索机器人 ID 和密钥
4. 指导您完成访问控制配置

#### 备选方案：手动设置

如果扫码创建不可用，向导将回退到手动输入：

1. 登录 [企业微信管理后台](https://work.weixin.qq.com/wework_admin/frame)
2. 导航至 **应用管理** → **创建应用** → **AI 机器人**
3. 配置机器人名称和描述
4. 从凭据页面复制 **机器人 ID** 和 **密钥**
5. 运行 `hermes gateway setup`，选择 **WeCom**，并在提示时输入凭据

:::warning
请妥善保管机器人密钥。任何获得它的人都可以冒充您的机器人。
:::

### 步骤 2：配置 Hermes

#### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

选择 **WeCom** 并按照提示操作。向导将指导您完成：
- 机器人凭据（通过扫码或手动输入）
- 访问控制设置（白名单、配对模式或开放访问）
- 用于通知的主频道

#### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env` 文件中：

```bash
WECOM_BOT_ID=your-bot-id
WECOM_SECRET=your-secret

# 可选：限制访问
WECOM_ALLOWED_USERS=user_id_1,user_id_2

# 可选：用于定时任务/通知的主频道
WECOM_HOME_CHANNEL=chat_id
```

### 步骤 3：启动网关

```bash
hermes gateway
```

## 功能

- **WebSocket 传输** — 持久连接，无需公共端点
- **私聊和群组消息** — 可配置的访问策略
- **每个群组的发送者白名单** — 精细控制谁可以在每个群组中与机器人交互
- **媒体支持** — 图片、文件、语音、视频上传和下载
- **AES 加密媒体** — 自动解密入站附件
- **引用上下文** — 保留回复线索
- **Markdown 渲染** — 富文本响应
- **回复模式流式响应** — 将响应关联到入站消息上下文
- **自动重连** — 连接中断时指数退避

## 配置选项

在 `config.yaml` 的 `platforms.wecom.extra` 下设置：

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `bot_id` | — | 企业微信 AI 机器人 ID（必填） |
| `secret` | — | 企业微信 AI 机器人密钥（必填） |
| `websocket_url` | `wss://openws.work.weixin.qq.com` | WebSocket 网关 URL |
| `dm_policy` | `open` | 私聊访问策略：`open`、`allowlist`、`disabled`、`pairing` |
| `group_policy` | `open` | 群组访问策略：`open`、`allowlist`、`disabled` |
| `allow_from` | `[]` | 允许私聊的用户 ID（当 dm_policy=allowlist 时） |
| `group_allow_from` | `[]` | 允许的群组 ID（当 group_policy=allowlist 时） |
| `groups` | `{}` | 每个群组的配置（见下文） |

## 访问策略

### 私聊策略

控制谁可以向机器人发送私信：

| 值 | 行为 |
|-------|----------|
| `open` | 任何人都可以给机器人发私信（默认） |
| `allowlist` | 只有 `allow_from` 中的用户 ID 可以发私信 |
| `disabled` | 所有私信都被忽略 |
| `pairing` | 配对模式（用于初始设置） |

```bash
WECOM_DM_POLICY=allowlist
```

### 群组策略

控制机器人在哪些群组中响应：

| 值 | 行为 |
|-------|----------|
| `open` | 机器人在所有群组中响应（默认） |
| `allowlist` | 机器人仅在 `group_allow_from` 中列出的群组 ID 中响应 |
| `disabled` | 所有群组消息都被忽略 |

```bash
WECOM_GROUP_POLICY=allowlist
```

### 每个群组的发送者白名单

为了进行精细控制，您可以限制哪些用户可以在特定群组中与机器人交互。这在 `config.yaml` 中配置：

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

1. `group_policy` 和 `group_allow_from` 控制决定一个群组是否被允许。
2. 如果一个群组通过了顶级检查，`groups.<group_id>.allow_from` 列表（如果存在）将进一步限制该群组中哪些发送者可以与机器人交互。
3. 通配符 `"*"` 群组条目作为未明确列出群组的默认设置。
4. 白名单条目支持 `*` 通配符以允许所有用户，且条目不区分大小写。
5. 条目可以选择性地使用 `wecom:user:` 或 `wecom:group:` 前缀格式——前缀会被自动剥离。

如果某个群组没有配置 `allow_from`，则该群组中的所有用户都被允许（假设该群组本身通过了顶级策略检查）。

## 媒体支持

### 入站（接收）

适配器接收来自用户的媒体附件，并在本地缓存以供智能体处理：

| 类型 | 处理方式 |
|------|-----------------|
| **图片** | 下载并在本地缓存。支持基于 URL 和 base64 编码的图片。 |
| **文件** | 下载并缓存。文件名从原始消息中保留。 |
| **语音** | 如果可用，会提取语音消息的文本转录。 |
| **混合消息** | 企业微信的混合类型消息（文本 + 图片）会被解析并提取所有组成部分。 |

**引用的消息：** 来自引用（回复）消息的媒体也会被提取，因此智能体知道用户正在回复什么。

### AES 加密媒体解密

企业微信使用 AES-256-CBC 对一些入站媒体附件进行加密。适配器会自动处理：

- 当入站媒体项包含 `aeskey` 字段时，适配器会下载加密字节，并使用 AES-256-CBC 和 PKCS#7 填充进行解密。
- AES 密钥是 `aeskey` 字段的 base64 解码值（必须正好是 32 字节）。
- IV（初始化向量）从密钥的前 16 个字节派生。
- 这需要 `cryptography` Python 包 (`pip install cryptography`)。

无需配置——接收到加密媒体时会透明地进行解密。

### 出站（发送）

| 方法 | 发送内容 | 大小限制 |
|--------|--------------|------------|
| `send` | Markdown 文本消息 | 4000 字符 |
| `send_image` / `send_image_file` | 原生图片消息 | 10 MB |
| `send_document` | 文件附件 | 20 MB |
| `send_voice` | 语音消息（原生语音仅支持 AMR 格式） | 2 MB |
| `send_video` | 视频消息 | 10 MB |

**分块上传：** 文件通过三步协议（初始化 → 分块 → 完成）以 512 KB 的块大小上传。适配器会自动处理此过程。

**自动降级：** 当媒体超过原生类型的大小限制但低于绝对的 20 MB 文件限制时，它会自动作为通用文件附件发送：

- 图片 > 10 MB → 作为文件发送
- 视频 > 10 MB → 作为文件发送
- 语音 > 2 MB → 作为文件发送
- 非 AMR 音频 → 作为文件发送（企业微信原生语音仅支持 AMR）

超过绝对 20 MB 限制的文件将被拒绝，并在聊天中发送一条信息性消息。

## 回复模式流式响应

当机器人通过企业微信回调收到消息时，适配器会记住入站请求 ID。如果在请求上下文仍然活动时发送响应，适配器会使用企业微信的回复模式（`aibot_respond_msg`）和流式传输，将响应直接关联到入站消息。这为企业微信客户端提供了更自然的对话体验。

如果入站请求上下文已过期或不可用，适配器将通过 `aibot_send_msg` 回退到主动消息发送。

回复模式也适用于媒体：上传的媒体可以作为对原始消息的回复发送。

## 连接和重连

适配器维护与企业微信网关 `wss://openws.work.weixin.qq.com` 的持久 WebSocket 连接。

### 连接生命周期

1. **连接：** 打开一个 WebSocket 连接，并发送一个包含 bot_id 和 secret 的 `aibot_subscribe` 认证帧。
2. **心跳：** 每 30 秒发送应用级 ping 帧以保持连接活动。
3. **监听：** 持续读取入站帧并分派消息回调。

### 重连行为

连接丢失时，适配器使用指数退避进行重连：

| 尝试次数 | 延迟 |
|---------|-------|
| 第 1 次重试 | 2 秒 |
| 第 2 次重试 | 5 秒 |
| 第 3 次重试 | 10 秒 |
| 第 4 次重试 | 30 秒 |
| 第 5 次及以上重试 | 60 秒 |

每次成功重连后，退避计数器重置为零。所有待处理的请求未来对象在断开时都会失败，因此调用方不会无限期挂起。

### 去重

入站消息使用消息 ID 进行去重，时间窗口为 5 分钟，最大缓存条目数为 1000。这可以防止在重连或网络中断期间重复处理消息。

## 所有环境变量

| 变量 | 是否必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `WECOM_BOT_ID` | ✅ | — | 企业微信 AI 机器人 ID |
| `WECOM_SECRET` | ✅ | — | 企业微信 AI 机器人密钥 |
| `WECOM_ALLOWED_USERS` | — | _(空)_ | 网关级别白名单的逗号分隔用户 ID |
| `WECOM_HOME_CHANNEL` | — | — | 用于定时任务/通知输出的聊天 ID |
| `WECOM_WEBSOCKET_URL` | — | `wss://openws.work.weixin.qq.com` | WebSocket 网关 URL |
| `WECOM_DM_POLICY` | — | `open` | 私聊访问策略 |
| `WECOM_GROUP_POLICY` | — | `open` | 群组访问策略 |

## 故障排除

| 问题 | 解决方法 |
|---------|-----|
| `需要 WECOM_BOT_ID 和 WECOM_SECRET` | 设置两个环境变量或通过设置向导配置 |
| `企业微信启动失败：未安装 aiohttp` | 安装 aiohttp：`pip install aiohttp` |
| `企业微信启动失败：未安装 httpx` | 安装 httpx：`pip install httpx` |
| `无效的 secret（错误代码 40013）` | 验证 secret 是否与您机器人的凭证匹配 |
| `等待订阅确认超时` | 检查到 `openws.work.weixin.qq.com` 的网络连接 |
| 机器人在群聊中无响应 | 检查 `group_policy` 设置并确保群组 ID 包含在 `group_allow_from` 中 |
| 机器人忽略群组中的特定用户 | 检查 `groups` 配置部分中每个群组的 `allow_from` 列表 |
| 媒体解密失败 | 安装 `cryptography`：`pip install cryptography` |
| `企业微信媒体解密需要 cryptography` | 入站媒体经过 AES 加密。安装：`pip install cryptography` |
| 语音消息作为文件发送 | 企业微信仅原生支持 AMR 格式的语音。其他格式会自动降级为文件。 |
| `文件过大` 错误 | 企业微信对所有文件上传有 20 MB 的绝对限制。请压缩或分割文件。 |
| 图片作为文件发送 | 超过 10 MB 的图片会超过原生图片限制，并自动降级为文件附件。 |
| `向企业微信发送消息超时` | WebSocket 可能已断开连接。检查日志中的重连消息。 |
| `企业微信 WebSocket 在认证期间关闭` | 网络问题或凭证错误。验证 bot_id 和 secret。 |