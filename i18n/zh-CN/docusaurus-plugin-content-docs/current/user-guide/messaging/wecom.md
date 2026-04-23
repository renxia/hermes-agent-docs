---
sidebar_position: 14
title: "企业微信（WeCom）"
description: "通过 AI Bot WebSocket 网关将 Hermes 智能体连接到企业微信"
---

# 企业微信（WeCom）

将 Hermes 连接到[企业微信](https://work.weixin.qq.com/)（WeCom），即腾讯的企业级消息平台。该适配器使用企业微信的 AI Bot WebSocket 网关实现实时双向通信——无需公共端点或 Webhook。

## 先决条件

- 一个企业微信组织账号
- 在企业微信管理控制台中创建的 AI Bot
- 从机器人凭据页面获取的 Bot ID 和 Secret
- Python 包：`aiohttp` 和 `httpx`

## 设置

### 步骤 1：创建 AI Bot

#### 推荐：扫码创建（一条命令）

```bash
hermes gateway setup
```

选择 **企业微信** 并使用企业微信移动应用扫描二维码。Hermes 将自动创建一个具有正确权限的机器人应用，并保存凭据。

设置向导将：
1. 在终端中显示一个二维码
2. 等待您使用企业微信移动应用扫描
3. 自动获取 Bot ID 和 Secret
4. 引导您完成访问控制配置

#### 替代方案：手动设置

如果无法使用扫码创建，向导将回退到手动输入：

1. 登录[企业微信管理控制台](https://work.weixin.qq.com/wework_admin/frame)
2. 导航至 **应用** → **创建应用** → **AI Bot**
3. 配置机器人名称和描述
4. 从凭据页面复制 **Bot ID** 和 **Secret**
5. 运行 `hermes gateway setup`，选择 **企业微信**，并在提示时输入凭据

:::warning
请妥善保管 Bot Secret。任何拥有它的人都可以冒充您的机器人。
:::

### 步骤 2：配置 Hermes

#### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

选择 **企业微信** 并按照提示操作。向导将引导您完成：
- 机器人凭据（通过扫码或手动输入）
- 访问控制设置（允许列表、配对模式或开放访问）
- 通知的主频道

#### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env`：

```bash
WECOM_BOT_ID=your-bot-id
WECOM_SECRET=your-secret

# 可选：限制访问
WECOM_ALLOWED_USERS=user_id_1,user_id_2

# 可选：用于 cron/通知的主频道
WECOM_HOME_CHANNEL=chat_id
```

### 步骤 3：启动网关

```bash
hermes gateway
```

## 功能特性

- **WebSocket 传输** — 持久连接，无需公共端点
- **私信和群聊消息** — 可配置的访问策略
- **每个群组的发送者允许列表** — 精细控制每个群组中可与智能体交互的用户
- **媒体支持** — 图片、文件、语音、视频的上传和下载
- **AES 加密媒体** — 对入站附件自动解密
- **引用上下文** — 保留回复线程
- **Markdown 渲染** — 富文本响应
- **回复模式流式传输** — 将响应与入站消息上下文关联
- **自动重连** — 连接断开时采用指数退避策略

## 配置选项

在 `config.yaml` 的 `platforms.wecom.extra` 下设置以下选项：

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `bot_id` | — | 企业微信 AI Bot ID（必需） |
| `secret` | — | 企业微信 AI Bot Secret（必需） |
| `websocket_url` | `wss://openws.work.weixin.qq.com` | WebSocket 网关 URL |
| `dm_policy` | `open` | 私信访问策略：`open`、`allowlist`、`disabled`、`pairing` |
| `group_policy` | `open` | 群组访问策略：`open`、`allowlist`、`disabled` |
| `allow_from` | `[]` | 允许发送私信的用户 ID 列表（当 dm_policy=allowlist 时） |
| `group_allow_from` | `[]` | 允许的群组 ID 列表（当 group_policy=allowlist 时） |
| `groups` | `{}` | 每个群组的配置（见下文） |

## 访问策略

### 私信策略

控制谁可以向机器人发送私信：

| 值 | 行为 |
|-------|----------|
| `open` | 任何人都可以向机器人发送私信（默认） |
| `allowlist` | 仅 `allow_from` 中的用户 ID 可以发送私信 |
| `disabled` | 忽略所有私信 |
| `pairing` | 配对模式（用于初始设置） |

```bash
WECOM_DM_POLICY=allowlist
```

### 群组策略

控制机器人在哪些群组中响应：

| 值 | 行为 |
|-------|----------|
| `open` | 机器人在所有群组中响应（默认） |
| `allowlist` | 机器人仅在 `group_allow_from` 列出的群组 ID 中响应 |
| `disabled` | 忽略所有群组消息 |

```bash
WECOM_GROUP_POLICY=allowlist
```

### 每个群组的发送者允许列表

为了实现精细控制，您可以限制在特定群组中允许与机器人交互的用户。这在 `config.yaml` 中配置：

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

1. `group_policy` 和 `group_allow_from` 控制某个群组是否被允许。
2. 如果某个群组通过了顶级检查，则 `groups.<group_id>.allow_from` 列表（如果存在）将进一步限制该群组内可与机器人交互的发送者。
3. 通配符 `"*"` 群组条目作为未明确列出群组的默认值。
4. 允许列表条目支持 `*` 通配符以允许所有用户，且条目不区分大小写。
5. 条目可以选择使用 `wecom:user:` 或 `wecom:group:` 前缀格式——前缀会被自动去除。

如果某个群组未配置 `allow_from`，则该群组中的所有用户都被允许（假设该群组本身通过了顶级策略检查）。

## 媒体支持

### 入站（接收）

适配器接收用户发送的媒体附件，并将其缓存在本地以供智能体处理：

| 类型 | 处理方式 |
|------|-----------------|
| **图片** | 下载并缓存在本地。支持基于 URL 和 base64 编码的图片。 |
| **文件** | 下载并缓存。保留原始消息中的文件名。 |
| **语音** | 如果可用，将提取语音消息的文本转录。 |
| **混合消息** | 解析企业微信混合类型消息（文本 + 图片），并提取所有组件。 |

**引用消息：** 也会提取引用（回复）消息中的媒体，以便智能体了解用户正在回复的内容。

### AES 加密媒体解密

企业微信使用 AES-256-CBC 加密某些入站媒体附件。适配器会自动处理此问题：

- 当入站媒体项包含 `aeskey` 字段时，适配器会下载加密字节，并使用 AES-256-CBC 和 PKCS#7 填充进行解密。
- AES 密钥是 `aeskey` 字段的 base64 解码值（必须恰好为 32 字节）。
- IV 由密钥的前 16 字节派生。
- 这需要 `cryptography` Python 包（`pip install cryptography`）。

无需配置——收到加密媒体时，解密会自动透明地进行。

### 出站（发送）

| 方法 | 发送内容 | 大小限制 |
|--------|--------------|------------|
| `send` | Markdown 文本消息 | 4000 字符 |
| `send_image` / `send_image_file` | 原生图片消息 | 10 MB |
| `send_document` | 文件附件 | 20 MB |
| `send_voice` | 语音消息（仅 AMR 格式适用于原生语音） | 2 MB |
| `send_video` | 视频消息 | 10 MB |

**分块上传：** 文件通过三步协议（初始化 → 分块 → 完成）以 512 KB 的块上传。适配器会自动处理此过程。

**自动降级：** 当媒体超过原生类型的大小限制但低于绝对的 20 MB 文件限制时，会自动作为通用文件附件发送：

- 图片 > 10 MB → 作为文件发送
- 视频 > 10 MB → 作为文件发送
- 语音 > 2 MB → 作为文件发送
- 非 AMR 音频 → 作为文件发送（企业微信仅支持 AMR 作为原生语音）

超过绝对 20 MB 限制的文件将被拒绝，并向聊天发送一条信息性消息。

## 回复模式流式响应

当机器人通过企业微信回调收到消息时，适配器会记住入站请求 ID。如果在请求上下文仍处于活动状态时发送响应，适配器将使用企业微信的回复模式（`aibot_respond_msg`）和流式传输，将响应直接关联到入站消息。这为企业微信客户端提供了更自然的对话体验。

如果入站请求上下文已过期或不可用，适配器将回退到通过 `aibot_send_msg` 主动发送消息。

回复模式也适用于媒体：上传的媒体可以作为对原始消息的回复发送。

## 连接与重连

适配器维护与企业微信网关 `wss://openws.work.weixin.qq.com` 的持久 WebSocket 连接。

### 连接生命周期

1. **连接：** 打开 WebSocket 连接，并发送带有 bot_id 和 secret 的 `aibot_subscribe` 认证帧。
2. **心跳：** 每 30 秒发送应用级 ping 帧以保持连接活跃。
3. **监听：** 持续读取入站帧并分发消息回调。

### 重连行为

连接丢失时，适配器使用指数退避策略进行重连：

| 尝试次数 | 延迟 |
|---------|-------|
| 第 1 次重试 | 2 秒 |
| 第 2 次重试 | 5 秒 |
| 第 3 次重试 | 10 秒 |
| 第 4 次重试 | 30 秒 |
| 第 5 次及以后重试 | 60 秒 |

每次成功重连后，退避计数器重置为零。断开连接时，所有待处理的请求 Future 都会失败，因此调用者不会无限期挂起。

### 去重

使用消息 ID 对入站消息进行去重，窗口为 5 分钟，最大缓存 1000 个条目。这可防止在重连或网络波动期间重复处理消息。

## 所有环境变量

| 变量 | 必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `WECOM_BOT_ID` | ✅ | — | 企业微信 AI Bot ID |
| `WECOM_SECRET` | ✅ | — | 企业微信 AI Bot Secret |
| `WECOM_ALLOWED_USERS` | — | _(空)_ | 网关级允许列表的逗号分隔用户 ID |
| `WECOM_HOME_CHANNEL` | — | — | 用于 cron/通知输出的聊天 ID |
| `WECOM_WEBSOCKET_URL` | — | `wss://openws.work.weixin.qq.com` | WebSocket 网关 URL |
| `WECOM_DM_POLICY` | — | `open` | 私信访问策略 |
| `WECOM_GROUP_POLICY` | — | `open` | 群组访问策略 |

## 故障排除

| 问题 | 解决方案 |
|---------|-----|
| `WECOM_BOT_ID 和 WECOM_SECRET 是必需的` | 设置两个环境变量或在设置向导中配置 |
| `企业微信启动失败：未安装 aiohttp` | 安装 aiohttp：`pip install aiohttp` |
| `企业微信启动失败：未安装 httpx` | 安装 httpx：`pip install httpx` |
| `无效的 secret (errcode=40013)` | 验证 secret 是否与您的机器人凭据匹配 |
| `等待订阅确认超时` | 检查与 `openws.work.weixin.qq.com` 的网络连接 |
| 机器人在群组中无响应 | 检查 `group_policy` 设置，并确保群组 ID 在 `group_allow_from` 中 |
| 机器人在群组中忽略某些用户 | 检查 `groups` 配置部分中的每个群组 `allow_from` 列表 |
| 媒体解密失败 | 安装 `cryptography`：`pip install cryptography` |
| `企业微信媒体解密需要 cryptography` | 入站媒体是 AES 加密的。安装：`pip install cryptography` |
| 语音消息作为文件发送 | 企业微信仅支持 AMR 格式作为原生语音。其他格式会自动降级为文件。 |
| `文件过大` 错误 | 企业微信对所有文件上传有 20 MB 的绝对限制。请压缩或拆分文件。 |
| 图片作为文件发送 | 图片 > 10 MB 超过原生图片限制，会自动降级为文件附件。 |
| `向企业微信发送消息超时` | WebSocket 可能已断开连接。检查日志中的重连消息。 |
| `企业微信 WebSocket 在认证期间关闭` | 网络问题或凭据不正确。验证 bot_id 和 secret。 |