---
sidebar_position: 12
title: "Google Chat"
description: "Set up Hermes Agent as a Google Chat bot using Cloud Pub/Sub"
---

# Google Chat 设置

将 Hermes 智能体作为机器人连接到 Google Chat。该集成使用 Cloud Pub/Sub 拉取订阅来处理入站事件，并使用 Chat REST API 来发送出站消息。其使用体验与 Slack Socket Mode 或 Telegram 长轮询相当：你的 Hermes 进程不需要公网 URL、隧道或 TLS 证书。它只需连接、认证并在订阅上监听——就像 Telegram 机器人通过令牌监听一样。

> 运行 `hermes gateway setup` 并选择 **Google Chat** 以获取引导式操作指引。

:::note Workspace 版本版
Google Chat 是 Google Workspace 的一部分。你可以将此集成用于个人 Workspace（通过 Google 注册的 `@yourdomain.com`）或拥有管理员权限来发布应用的工作 Workspace。仅含 Gmail 的账号无法托管 Chat 应用。
:::

## 概览

| 组件 | 值 |
|-----------|-------|
| **库** | `google-cloud-pubsub`、`google-api-python-client`、`google-auth` |
| **入站传输** | Cloud Pub/Sub 拉取订阅（无公网端点） |
| **出站传输** | Chat REST API（`chat.googleapis.com`） |
| **认证** | 服务账号 JSON，需对订阅具有 `roles/pubsub.subscriber` 权限 |
| **用户识别** | Chat 资源名称（`users/{id}`）+ 邮箱 |

---

## 第 1 步：创建或选择一个 GCP 项目

你需要一个 Google Cloud 项目来托管 Pub/Sub 主题。如果没有，
在 [console.cloud.google.com](https://console.cloud.google.com) 创建一个——
个人账户可获得免费套餐，轻松覆盖机器人流量。

记下项目 ID（例如 `my-chat-bot-123`）。你将在后续每个步骤中使用它。

---

## 第 2 步：启用两个 API

在控制台中，前往 **API 和服务 → 库** 并启用：

- **Google Chat API**
- **Cloud Pub/Sub API**

对于个人机器人产生的流量，两者都是免费的。

---

## 第 3 步：创建服务账号

**IAM 和管理 → 服务账号 → 创建服务账号。**

- 名称：`hermes-chat-bot`
- 跳过"授予此服务账号访问项目权限"步骤。你只需要在特定订阅上进行 IAM 配置——**不要**授予项目级别的 Pub/Sub 角色。

创建完成后，打开该服务账号，前往 **密钥 → 添加密钥 → 创建新密钥 → JSON** 并下载文件。将其保存在只有 Hermes 可以读取的位置（例如
`~/.hermes/google-chat-sa.json`，`chmod 600`）。

:::caution 不存在"Chat Bot Caller"角色
一个常见的错误是搜索 Chat 特定的 IAM 角色并在项目级别授予它。该角色不存在。Chat 机器人的权限来自在空间中的安装，而非 IAM。你的服务账号所需的一切就是在下一步创建的订阅上的 Pub/Sub 订阅者权限。
:::

---

## 第 4 步：创建 Pub/Sub 主题和订阅

**Pub/Sub → 主题 → 创建主题。**

- 主题 ID：`hermes-chat-events`
- 其他设置保持默认值。

创建完成后，主题的详情页面有一个 **订阅** 标签。创建一个订阅：

- 订阅 ID：`hermes-chat-events-sub`
- 投递类型：**Pull**
- 消息保留期：**7 天**（以便在 hermes 重启后积压消息仍能保留）
- 其余设置保持默认。

---

## 第 5 步：在主题上绑定 IAM（关键步骤）

在**主题**（而非订阅）上，添加一个 IAM 主体：

- 主体：`chat-api-push@system.gserviceaccount.com`
- 角色：`Pub/Sub Publisher`

没有这个绑定，Google Chat 无法向你的主题发布事件，你的机器人将永远收不到任何消息。

---

## 第 6 步：在订阅上绑定 IAM

在**订阅**上，添加你自己的服务账号作为主体：

- 主体：`hermes-chat-bot@<your-project>.iam.gserviceaccount.com`
- 角色：`Pub/Sub Subscriber`

同时在同一订阅上授予 `Pub/Sub Viewer`——Hermes 在启动时会调用
`subscription.get()` 作为可达性检查。

---

## 第 7 步：配置 Chat 应用

前往 **API 和服务 → Google Chat API → 配置**。

- **应用名称**：用户将看到的名称（"Hermes" 是合理的）。
- **头像 URL**：任意公开 PNG（Google 有一些默认选项）。
- **描述**：在应用目录中显示的简短句子。
- **功能**：启用 **接收 1:1 消息** 和 **加入空间和群组对话**。
- **连接设置**：选择 **Cloud Pub/Sub**，输入主题名称
  `projects/<your-project>/topics/hermes-chat-events`。
- **可见性**：限制为你的工作空间（或特定用户）——在测试期间不要向所有人发布。

保存。

---

## 第 8 步：在测试空间中安装机器人

在浏览器中打开 Google Chat。通过在 **+ 新建聊天** 菜单中搜索其名称，与你的应用开始私信。首次向其发送消息时，Google 会发送一个 `ADDED_TO_SPACE` 事件，Hermes 使用该事件缓存机器人自身的 `users/{id}` 以进行自消息过滤。

---

## 第 9 步：配置 Hermes

将 Google Chat 部分添加到 `~/.hermes/.env`：

```bash
# 必需
GOOGLE_CHAT_PROJECT_ID=my-chat-bot-123
GOOGLE_CHAT_SUBSCRIPTION_NAME=projects/my-chat-bot-123/subscriptions/hermes-chat-events-sub
GOOGLE_CHAT_SERVICE_ACCOUNT_JSON=/home/you/.hermes/google-chat-sa.json

# 授权——粘贴允许与机器人通信的人员的邮箱
GOOGLE_CHAT_ALLOWED_USERS=you@yourdomain.com,coworker@yourdomain.com

# 可选
GOOGLE_CHAT_HOME_CHANNEL=spaces/AAAA...         # cron 任务的默认投递目标
GOOGLE_CHAT_MAX_MESSAGES=1                      # Pub/Sub FlowControl；每个会话序列化命令
GOOGLE_CHAT_MAX_BYTES=16777216                  # 16 MiB——在途消息字节数上限
```

项目 ID 也会回退到 `GOOGLE_CLOUD_PROJECT`，服务账号路径会回退到 `GOOGLE_APPLICATION_CREDENTIALS`——使用你偏好的任何约定。

安装 Google Chat 适配器所需的依赖项（目前没有发布 Hermes 扩展——直接安装）：

```bash
pip install google-cloud-pubsub google-api-python-client google-auth google-auth-oauthlib
```

启动网关：

```bash
hermes gateway
```

你应该看到类似以下的日志行：

```
[GoogleChat] Connected; project=my-chat-bot-123, subscription=<redacted>,
             bot_user_id=users/XXXX, flow_control(msgs=1, bytes=16777216)
```

在测试私信中发送 "hola"。机器人会发布一个"Hermes is thinking…"标记，然后用实际回复原地编辑同一条消息——不会出现"消息已删除"的墓碑。

---

## 格式和能力

Google Chat 渲染有限的 markdown 子集：

| 支持 | 不支持 |
|------|--------|
| `*bold*`、`_italic_`、`~strike~`、`` `code` `` | 标题、列表 |
| 通过 URL 的内联图片 | 交互式 Card v2 按钮（此网关的 v1 版本） |
| 原生文件附件（执行 `/setup-files` 后——见第 10 步） | 原生语音消息/圆形视频消息 |

智能体的系统提示包含针对 Google Chat 的特定提示，使其了解这些限制并避免使用无法渲染的格式。

消息大小限制：每条消息 4000 个字符。较长的智能体回复会自动拆分到多条消息中。

线程支持：当用户在线程内回复时，Hermes 会检测到 `thread.name` 并在同一线程中发布回复，因此每个线程获得独立的 Hermes 会话。

---

## 第 10 步：原生附件投递（可选）

开箱即用时，机器人可以发布文本、通过 URL 的内联图片，以及音频/视频/文档的下载卡片。要投递**原生** Chat 附件——人类拖放文件时获得的相同文件小部件——每个用户通过每用户 OAuth 流程授权机器人一次。

### 为什么需要单独的流程

Google Chat 的 `media.upload` 端点硬性拒绝服务账号认证：

> 此方法不支持使用服务账号的应用认证。
> 请使用用户账号进行认证。

没有任何 IAM 角色或作用域可以解决这个问题。该端点只接受用户凭据。因此，机器人必须在每次上传文件时*以用户身份*操作——具体来说，是以请求该文件的用户身份。

### 一次性设置（每个配置文件）

1. 在同一个 GCP 项目中前往 **API 和服务 → 凭据**。
2. **创建凭据 → OAuth 客户端 ID → 桌面应用**。
3. 下载 JSON。将其移动到运行 Hermes 的主机上。
4. 向 Hermes 注册客户端（在你希望其作用域的配置文件下运行）：

```bash
# 默认配置文件：
python -m plugins.platforms.google_chat.oauth \
    --client-secret /path/to/client_secret.json

# 命名配置文件获得自己独立的注册：
hermes -p <profile> python -m plugins.platforms.google_chat.oauth \
    --client-secret /path/to/client_secret.json
```

这会将客户端密钥写入活动配置文件的 Hermes 主目录（例如默认配置文件的
`~/.hermes/google_chat_user_client_secret.json`）。客户端密钥是**配置文件作用域的，不在配置文件间共享**——每个配置文件注册自己的。这是有意为之：配置文件是隔离的认证边界，因此两个配置文件可以指向不同的 Google OAuth 应用/账户。每个需要 Google Chat 附件投递的配置文件注册一次。

### 每用户授权（在聊天中）

每个用户在自己的私信中运行一次流程：

1. 他们向机器人发送 `/setup-files`。机器人回复状态和下一步。
2. 他们发送 `/setup-files start`。机器人回复一个 OAuth URL。
3. 他们打开 URL，点击 **允许**，然后看到浏览器无法加载
   `http://localhost:1/?...&code=...`。该失败是预期的——授权码
   在 URL 栏中。
4. 他们复制失败的 URL（或仅 `code=...` 值）并将其作为 `/setup-files <PASTED_URL>` 粘贴回聊天中。机器人将其交换为刷新令牌。

令牌存储在 `~/.hermes/google_chat_user_tokens/<sanitized_email>.json`。
该用户私信中后续的文件请求使用*他们*的令牌，因此机器人以他们的身份上传，消息投递到他们的空间。

要稍后撤销：`/setup-files revoke` 仅删除该用户的令牌。其他用户的令牌不受影响。

### 作用域

该流程仅请求一个作用域：`chat.messages.create`。这涵盖了 `media.upload`
和引用已上传 `attachmentDataRef` 的 `messages.create`。不涉及 Drive，
不涉及更广泛的 Chat 作用域——这是出于最小权限原则的设计。

### 多用户行为

当请求者还没有每用户令牌时，机器人会回退到旧版单用户令牌
`~/.hermes/google_chat_user_token.json`（如果存在，来自多用户安装之前）。
如果两者都不可用，机器人会发布清晰的文本通知，告诉请求者运行 `/setup-files`。

用户撤销仅清除自己的位置。一个用户令牌的 401/403 仅驱逐该用户的缓存。用户之间不会互相干扰。

---

## 故障排除

**发送"hola"后机器人保持沉默。**

1. 检查 Pub/Sub 订阅在控制台中是否有未投递的消息。
   如果有，Hermes 未通过身份验证——验证 `GOOGLE_CHAT_SERVICE_ACCOUNT_JSON`
   以及该服务账号是否在订阅上列为 `Pub/Sub Subscriber`。
2. 如果订阅中没有消息，Google Chat 没有发布。
   仔细检查**主题**上的 IAM 绑定：
   `chat-api-push@system.gserviceaccount.com` 必须具有 `Pub/Sub Publisher`。
3. 检查 `hermes gateway` 日志中是否有 `[GoogleChat] Connected`。如果你看到
   `[GoogleChat] Config validation failed`，错误消息会告诉你修复哪个
   环境变量。

**机器人回复但出现错误消息而非智能体的答案。**

检查日志中是否有 `[GoogleChat] Pub/Sub stream died`——如果重复出现，你的服务账号凭据可能已被轮换或订阅已被删除。10 次尝试后，适配器将自身标记为致命错误。

**每条出站消息都出现"403 Forbidden"。**

机器人已从空间中被移除，或者你在 Chat API 控制台中撤销了它。
在空间中重新安装它（下一个 `ADDED_TO_SPACE` 事件将自动重新启用消息功能）。

**出现太多"Rate limit hit"警告。**

Chat API 的默认配额允许每分钟每个空间 60 条消息。如果你的智能体产生较长的流式响应并超出此限制，适配器会以指数退避重试——但你仍会看到用户可见的延迟。考虑使用简洁的响应或在 GCP 控制台中提高配额。

**机器人持续发布"/setup-files"通知而非文件。**

请求者没有每用户 OAuth 令牌，也没有旧版回退方案。在他们的私信中运行 `/setup-files` 并遵循第 10 步。交换完成后，下一次文件请求将原生上传，无需重启网关。

**`/setup-files start` 提示"No client credentials stored."**

该配置文件*未完成*一次性设置（客户端密钥是配置文件作用域的，因此在一个配置文件下注册不会被另一个看到）。从终端在网关使用的配置文件下运行：

```bash
# 默认配置文件：
python -m plugins.platforms.google_chat.oauth \
    --client-secret /path/to/client_secret.json

# 命名配置文件：
hermes -p <profile> python -m plugins.platforms.google_chat.oauth \
    --client-secret /path/to/client_secret.json
```

然后再次发送 `/setup-files start`。

**`/setup-files <PASTED_URL>` 提示"Token exchange failed."**

授权码是一次性的且短暂的（通常几分钟）。发送 `/setup-files start` 获取新的 URL 并重试。

---

## 安全注意事项

- **服务账号作用域**：适配器请求 `chat.bot` 和 `pubsub` 作用域。
  IAM 应是实际的执行机制 — 授予您的 SA 最小权限
  （订阅级别的 `roles/pubsub.subscriber` + `roles/pubsub.viewer`），而非
  项目级别或组织级别的 Pub/Sub 角色。
- **附件下载保护**：Hermes 仅对主机名与 Google 拥有的短白名单域名
  （`googleapis.com`、`drive.google.com`、`lh[3-6].googleusercontent.com` 等）匹配的 URL 附加 SA Bearer 令牌。
  任何其他主机在 HTTP 请求发出前即被拒绝，
  以防范 SSRF 场景——即精心构造的事件可能将
  Bearer 令牌重定向至 GCE 元数据服务。
- **脱敏处理**：服务账号邮箱、订阅路径和主题路径
  通过 `agent/redact.py` 从日志输出中剥离。调试信封转储
  （`GOOGLE_CHAT_DEBUG_RAW=1`）同样经过相同的脱敏过滤器，
  并以 DEBUG 级别记录。
- **合规性**：如果您计划将此机器人接入受监管的工作区
  （任何具有数据驻留或 AI 治理策略的环境），请在首次安装前
  获得相关审批。
- **用户 OAuth 作用域**：每个用户的附件流程*仅*请求
  `chat.messages.create` — 涵盖 `media.upload` 及后续
  `messages.create` 所需的最小权限。令牌以纯 JSON 格式持久化存储于
  `~/.hermes/google_chat_user_tokens/<sanitized_email>.json`（文件系统
  权限即为保护机制 — 与 SA 密钥文件模型相同）。每个
  令牌仅属于一个用户；吊销操作限定于该用户。