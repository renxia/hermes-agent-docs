---
sidebar_position: 12
title: "Google Chat"
description: "使用 Cloud Pub/Sub 将 Hermes 智能体设置为 Google Chat 机器人"
---

# Google Chat 设置

将 Hermes 智能体连接为 Google Chat 机器人。该集成使用 Cloud Pub/Sub 拉取订阅来接收入站事件，并使用 Chat REST API 发送出站消息。其使用体验与 Slack Socket 模式或 Telegram 长轮询相当：您的 Hermes 进程无需公共 URL、隧道或 TLS 证书。它会连接、进行身份验证，并监听订阅——就像 Telegram 机器人监听令牌一样。

:::note 工作区版本
Google Chat 是 Google Workspace 的一部分。您可以将此集成用于个人工作区（通过 Google 注册的 `@yourdomain.com`）或您拥有发布应用的管理员权限的工作工作区。仅 Gmail 账户无法托管 Chat 应用。
:::

## 概览

| 组件 | 值 |
|-----------|-------|
| **库** | `google-cloud-pubsub`、`google-api-python-client`、`google-auth` |
| **入站传输** | Cloud Pub/Sub 拉取订阅（无公共端点） |
| **出站传输** | Chat REST API (`chat.googleapis.com`) |
| **身份验证** | 服务账号 JSON，订阅具有 `roles/pubsub.subscriber` 角色 |
| **用户标识** | Chat 资源名称 (`users/{id}`) + 邮箱 |

---

## 步骤 1：创建或选择一个 GCP 项目

您需要一个 Google Cloud 项目来托管 Pub/Sub 主题。如果您还没有项目，请在 [console.cloud.google.com](https://console.cloud.google.com) 上创建一个——个人账号享有免费层级，足以轻松应对机器人流量。

请记下项目 ID（例如 `my-chat-bot-123`）。后续每一步都会用到它。

---

## 步骤 2：启用两个 API

在控制台中，前往 **API 和服务 → 库** 并启用以下两个 API：

- **Google Chat API**
- **Cloud Pub/Sub API**

对于个人机器人产生的流量，这两个 API 都是免费的。

---

## 步骤 3：创建服务账号

**IAM 与管理 → 服务账号 → 创建服务账号。**

- 名称：`hermes-chat-bot`
- 跳过“为此服务账号授予对项目的访问权限”步骤。您只需要在特定订阅上配置 IAM 权限——**切勿**授予项目级别的 Pub/Sub 角色。

创建完成后，打开该服务账号，进入 **密钥 → 添加密钥 → 创建新密钥 → JSON**，然后下载文件。将其保存在只有 Hermes 可读的位置（例如 `~/.hermes/google-chat-sa.json`，并执行 `chmod 600`）。

:::caution 不存在“Chat Bot Caller”角色
常见错误是搜索 Chat 专用的 IAM 角色并将其授予项目级别。但该角色并不存在。Chat 机器人的权限来源于被安装到某个空间，而非来自 IAM。您的服务账号只需要在下一步创建的订阅上拥有 Pub/Sub 订阅者权限即可。
:::

---

## 步骤 4：创建 Pub/Sub 主题和订阅

**Pub/Sub → 主题 → 创建主题。**

- 主题 ID：`hermes-chat-events`
- 其他选项保持默认。

创建完成后，在主题的详情页面中有一个 **订阅** 标签页。创建一个订阅：

- 订阅 ID：`hermes-chat-events-sub`
- 传递类型：**拉取**
- 消息保留期：**7 天**（以便在 Hermes 重启后仍能处理积压消息）
- 其他选项保持默认。

---

## 步骤 5：为主题绑定 IAM 权限（关键步骤）

在**主题**（而非订阅）上添加一个 IAM 主体：

- 主体：`chat-api-push@system.gserviceaccount.com`
- 角色：`Pub/Sub 发布者`

如果没有此配置，Google Chat 将无法向您的主题发布事件，您的机器人也将永远收不到任何消息。

---

## 步骤 6：为订阅绑定 IAM 权限

在**订阅**上，将您自己的服务账号添加为主体：

- 主体：`hermes-chat-bot@<your-project>.iam.gserviceaccount.com`
- 角色：`Pub/Sub 订阅者`

同时，在同一订阅上授予 `Pub/Sub 查看者` 权限——Hermes 在启动时会调用 `subscription.get()` 进行可达性检查。

---

## 步骤 7：配置 Chat 应用

前往 **API 和服务 → Google Chat API → 配置**。

- **应用名称**：用户看到的名字（例如“Hermes”是合理的选择）。
- **头像 URL**：任意公开 PNG 图片（Google 提供了一些默认选项）。
- **描述**：在应用目录中显示的一句话简介。
- **功能**：启用**接收 1:1 消息**和**加入空间及群聊**。
- **连接设置**：选择 **Cloud Pub/Sub**，输入主题名称 `projects/<your-project>/topics/hermes-chat-events`。
- **可见性**：限制为您的 Workspace（或特定用户）——测试期间请勿向所有人发布。

保存配置。

---

## 步骤 8：在测试空间中安装机器人

在浏览器中打开 Google Chat。通过在 **+ 新建聊天** 菜单中搜索应用名称，与您的应用开始一个私信对话。第一次向其发送消息时，Google 会发送一个 `ADDED_TO_SPACE` 事件，Hermes 会利用该事件缓存机器人自身的 `users/{id}`，用于自我消息过滤。

---

## 步骤 9：配置 Hermes

将 Google Chat 配置节添加到 `~/.hermes/.env`：

```bash
# 必需
GOOGLE_CHAT_PROJECT_ID=my-chat-bot-123
GOOGLE_CHAT_SUBSCRIPTION_NAME=projects/my-chat-bot-123/subscriptions/hermes-chat-events-sub
GOOGLE_CHAT_SERVICE_ACCOUNT_JSON=/home/you/.hermes/google-chat-sa.json

# 授权 — 粘贴允许与机器人对话的用户邮箱
GOOGLE_CHAT_ALLOWED_USERS=you@yourdomain.com,coworker@yourdomain.com

# 可选
GOOGLE_CHAT_HOME_CHANNEL=spaces/AAAA...         # cron 作业的默认投递目标
GOOGLE_CHAT_MAX_MESSAGES=1                      # Pub/Sub 流量控制；1 表示每个会话串行执行命令
GOOGLE_CHAT_MAX_BYTES=16777216                  # 16 MiB — 飞行中消息字节的限制
```

项目 ID 也会回退到 `GOOGLE_CLOUD_PROJECT`，服务账号路径会回退到 `GOOGLE_APPLICATION_CREDENTIALS`——您可以使用任意一种约定。

使用可选依赖安装 Hermes：

```bash
pip install 'hermes-agent[google_chat]'
```

启动网关：

```bash
hermes gateway
```

您应该会看到类似以下的日志行：

```
[GoogleChat] 已连接；project=my-chat-bot-123, subscription=<已脱敏>,
             bot_user_id=users/XXXX, flow_control(msgs=1, bytes=16777216)
```

在测试私信中发送“hola”。机器人会先发布一个“Hermes 正在思考…”标记，然后原地编辑该消息为真实回复——不会出现“消息已删除”的痕迹。

---

## 格式化与能力

Google Chat 仅渲染有限的 Markdown 子集：

| 支持 | 不支持 |
|------|--------|
| `*粗体*`、`_斜体_`、`~删除线~`、`` `代码` `` | 标题、列表 |
| 通过 URL 插入图片 | 交互式卡片 v2 按钮（当前网关版本为 v1） |
| 原生文件附件（执行 `/setup-files` 后 — 参见步骤 10） | 原生语音笔记 / 圆形视频笔记 |

智能体的系统提示包含针对 Google Chat 的特定提示，使其了解这些限制，并避免使用无法渲染的格式。

消息大小限制：每条消息最多 4000 个字符。较长的智能体回复会自动拆分为多条消息。

线程支持：当用户在某个线程内回复时，Hermes 会检测到 `thread.name` 并将回复发布到同一线程，因此每个线程都会获得一个独立的 Hermes 会话。

---

## 步骤 10：原生附件投递（可选）

默认情况下，机器人可以发布文本、通过 URL 插入图片，以及为音频/视频/文档生成下载卡片。若要投递**原生** Chat 附件——即人类拖放文件时看到的相同文件组件——每位用户需通过一次针对个人的 OAuth 流程授权机器人。

### 为何需要单独流程

Google Chat 的 `media.upload` 端点会硬性拒绝服务账号认证：

> 此方法不支持使用服务账号进行应用认证。请使用用户账号进行认证。

没有任何 IAM 角色或范围可以解决此问题。该端点仅接受用户凭据。因此，每当机器人上传文件时，必须*以用户身份*操作——具体来说，就是请求该文件的用户。

### 一次性主机设置

1. 在同一 GCP 项目中，前往 **API 和服务 → 凭据**。
2. **创建凭据 → OAuth 客户端 ID → 桌面应用**。
3. 下载 JSON 文件。将其移动到运行 Hermes 的主机上。
4. 在主机上，使用以下命令向 Hermes 注册客户端：

```bash
python -m gateway.platforms.google_chat_user_oauth \
    --client-secret /path/to/client_secret.json
```

这会将 `~/.hermes/google_chat_user_client_secret.json` 写入磁盘。这是共享基础设施——它标识的是 OAuth *应用*，而非任何特定用户。无论后续有多少用户授权，每台主机只需一个文件。

### 针对个人的授权（在聊天中）

每位用户在与其机器人的私信中运行一次此流程：

1. 向机器人发送 `/setup-files`。机器人会回复状态及下一步操作。
2. 发送 `/setup-files start`。机器人会回复一个 OAuth URL。
3. 打开该 URL，点击**允许**，然后观察浏览器加载失败 `http://localhost:1/?...&code=...`。此失败是预期的——授权码就在 URL 栏中。
4. 复制失败的 URL（或仅复制 `code=...` 值），并将其粘贴回聊天中，格式为 `/setup-files <粘贴的URL>`。机器人会将其交换为刷新令牌。

令牌将保存至 `~/.hermes/google_chat_user_tokens/<已清理邮箱>.json`。此后，在该用户的私信中请求文件时，将使用*其*令牌，因此机器人会以该用户身份上传文件，消息也会出现在其空间中。

稍后撤销：`/setup-files revoke` 只会删除该用户的令牌，其他用户的令牌不受影响。

### 权限范围

此流程仅请求一个权限范围：`chat.messages.create`。该范围涵盖 `media.upload` 和引用已上传 `attachmentDataRef` 的 `messages.create`。不涉及 Drive，也不使用更宽泛的 Chat 范围——这是出于最小权限原则。

### 多用户行为

当请求者尚无针对个人的令牌时，机器人会回退到位于 `~/.hermes/google_chat_user_token.json` 的旧版单用户令牌（如果之前的多用户安装已存在）。如果两者均不可用，机器人会发布一条清晰的文本通知，告知请求者运行 `/setup-files`。

用户撤销授权只会清除其自身的槽位。某个用户令牌返回 401/403 错误时，只会清除该用户的缓存。用户之间不会相互干扰。

---

## 故障排查

**发送“hola”后机器人始终沉默。**

1. 检查 Pub/Sub 订阅在控制台中是否有未送达的消息。如果有，说明 Hermes 未通过身份验证——请验证 `GOOGLE_CHAT_SERVICE_ACCOUNT_JSON` 是否正确，并确认服务账号在订阅中被列为 `Pub/Sub 订阅者`。
2. 如果订阅的消息数为零，说明 Google Chat 未发布消息。请再次检查**主题**上的 IAM 绑定：`chat-api-push@system.gserviceaccount.com` 必须拥有 `Pub/Sub 发布者` 角色。
3. 检查 `hermes gateway` 日志中是否有 `[GoogleChat] 已连接`。如果看到 `[GoogleChat] 配置验证失败`，错误消息会告诉您应修复哪个环境变量。

**机器人回复了，但显示的是错误消息而非智能体的答案。**

检查日志中是否有 `[GoogleChat] Pub/Sub 流已终止` —— 如果此类日志重复出现，可能是您的服务账号凭据已轮换或订阅已被删除。尝试 10 次后，适配器会将自己标记为致命错误。

**每条出站消息都返回“403 禁止访问”。**

机器人已被从空间中移除，或您在 Chat API 控制台中撤销了其权限。请在空间中重新安装它（下一次 `ADDED_TO_SPACE` 事件将自动重新启用消息功能）。

**出现过多“触发速率限制”警告。**

Chat API 的默认配额允许每分钟每个空间发送 60 条消息。如果您的智能体生成长流式回复并超出此限制，适配器会使用指数退避重试——但用户仍会感受到明显延迟。请考虑使用更简洁的回复，或在 GCP 控制台中提高配额。

**机器人不断发布“/setup-files”通知而非文件。**

请求者没有针对个人的 OAuth 令牌，且无旧版回退可用。请在其私信中运行 `/setup-files` 并按照步骤 10 操作。交换完成后，下一次文件请求将原生上传，无需重启网关。

**`/setup-files start` 提示“主机上未存储客户端凭据”。**

未完成一次性主机设置。请在运行 Hermes 的主机上执行以下命令：

```bash
python -m gateway.platforms.google_chat_user_oauth \
    --client-secret /path/to/client_secret.json
```

然后再次发送 `/setup-files start`。

**`/setup-files <粘贴的URL>` 提示“令牌交换失败”。**

授权码为一次性且有效期很短（通常为几分钟）。请发送 `/setup-files start` 获取新的 URL 并重试。

## 安全说明

- **服务账号范围**：该适配器请求 `chat.bot` 和 `pubsub` 范围。
  IAM 应作为实际执行机制 — 为您的服务账号授予最低权限
  （订阅上的 `roles/pubsub.subscriber` + `roles/pubsub.viewer`），而非
  项目级或组织级的 Pub/Sub 角色。
- **附件下载保护**：Hermes 仅会将服务账号的持有者令牌附加到主机名与 Google 拥有的域名短白名单
  （`googleapis.com`、`drive.google.com`、`lh[3-6].googleusercontent.com` 以及
  少数其他域名）匹配的 URL。任何其他主机在 HTTP 请求发出前即被拒绝，
  以防止精心构造的事件将持有者令牌重定向到 GCE 元数据服务的 SSRF 场景。
- **脱敏处理**：服务账号电子邮件、订阅路径和主题路径会被 `智能体/redact.py` 从日志输出中剥离。
  调试信封转储（`GOOGLE_CHAT_DEBUG_RAW=1`）会通过相同的脱敏过滤器，并以 DEBUG 级别记录。
- **合规性**：如果您计划将此机器人连接到受监管的工作区
  （任何具有数据驻留或 AI 治理策略的工作区），请在首次安装前获得批准。
- **用户 OAuth 范围**：每个用户的附件流程*仅*请求 `chat.messages.create` —
  覆盖 `media.upload` 以及后续 `messages.create` 的最低范围。令牌以纯 JSON 格式持久化存储在
  `~/.hermes/google_chat_user_tokens/<已清理的电子邮件>.json`（文件系统权限即为保护措施 — 与 SA 密钥文件模型相同）。
  每个令牌仅由一个用户拥有；撤销操作范围限定为该用户。