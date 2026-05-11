---
sidebar_position: 12
title: "Google Chat"
description: "使用 Cloud Pub/Sub 将 Hermes 智能体设置为 Google Chat 机器人"
---

# Google Chat 设置

将 Hermes 智能体连接到 Google Chat 作为机器人。此集成使用 Cloud Pub/Sub 拉取订阅处理入站事件，并使用 Chat REST API 发送出站消息。其便捷性与 Slack Socket Mode 或 Telegram 长轮询相当：您的 Hermes 进程无需公网 URL、隧道或 TLS 证书。它连接、认证并监听订阅——就像 Telegram 机器人监听令牌一样。

:::note 工作区版本
Google Chat 是 Google Workspace 的一部分。您可以通过个人 Workspace（通过 Google 注册的 `@yourdomain.com`）或拥有发布应用管理权限的工作 Workspace 来使用此集成。仅有 Gmail 账户无法托管 Chat 应用。
:::

## 概览

| 组件 | 值 |
|-----------|-------|
| **依赖库** | `google-cloud-pubsub`, `google-api-python-client`, `google-auth` |
| **入站传输** | Cloud Pub/Sub 拉取订阅（无公共端点） |
| **出站传输** | Chat REST API (`chat.googleapis.com`) |
| **认证方式** | 服务账户 JSON 文件，订阅上具有 `roles/pubsub.subscriber` 角色 |
| **用户标识** | Chat 资源名称 (`users/{id}`) + 电子邮箱 |

## 步骤 1：创建或选择 GCP 项目

你需要一个 Google Cloud 项目来托管 Pub/Sub 主题。如果没有，请在 [console.cloud.google.com](https://console.cloud.google.com) 创建一个——个人账户获得的免费配额足以覆盖机器人的流量。

记下项目 ID（例如 `my-chat-bot-123`）。你将在后续每个步骤中使用它。

---

## 步骤 2：启用两个 API

在控制台中，前往 **API 和服务 → 库** 并启用：

- **Google Chat API**
- **Cloud Pub/Sub API**

对于个人机器人产生的数据量，两者都是免费的。

---

## 步骤 3：创建服务账户

**IAM 和管理 → 服务账户 → 创建服务账户。**

- 名称：`hermes-chat-bot`
- 跳过“为此服务账户授予项目访问权限”步骤。IAM 只需作用于你将在下一步创建的具体订阅——**不要**授予项目级别的 Pub/Sub 角色。

创建后，打开该服务账户，转到 **密钥 → 添加密钥 → 创建新密钥 → JSON** 并下载该文件。将其保存在只有 Hermes 可以读取的位置（例如 `~/.hermes/google-chat-sa.json`，并设置 `chmod 600`）。

:::caution 不存在 "Chat Bot Caller" 角色
一个常见的错误是搜索特定于聊天的 IAM 角色并在项目级别授予它。该角色并不存在。聊天机器人的权限来源于在空间中安装，而不是来自 IAM。你的服务账户唯一需要的是你在下一步创建的订阅上的 `Pub/Sub Subscriber` 角色。
:::

---

## 步骤 4：创建 Pub/Sub 主题和订阅

**Pub/Sub → 主题 → 创建主题。**

- 主题 ID：`hermes-chat-events`
- 其他所有选项保持默认。

创建后，主题的详细信息页面会有一个 **订阅** 标签页。创建一个订阅：

- 订阅 ID：`hermes-chat-events-sub`
- 投递类型：**拉取**
- 消息保留：**7 天**（这样积压的消息在 Hermes 重启后仍然存在）
- 其余选项保持默认。

---

## 步骤 5：在主题上设置 IAM 绑定（关键）

在**主题**（不是订阅）上，添加一个 IAM 主体：

- 主体：`chat-api-push@system.gserviceaccount.com`
- 角色：`Pub/Sub Publisher`

没有这一步，Google Chat 将无法向你的主题发布事件，你的机器人将永远收不到任何消息。

---

## 步骤 6：在订阅上设置 IAM 绑定

在**订阅**上，添加你自己的服务账户作为主体：

- 主体：`hermes-chat-bot@<your-project>.iam.gserviceaccount.com`
- 角色：`Pub/Sub Subscriber`

同时在同一订阅上授予 `Pub/Sub Viewer` 角色——Hermes 在启动时会调用 `subscription.get()` 作为可达性检查。

---

## 步骤 7：配置 Chat 应用

前往 **API 和服务 → Google Chat API → 配置**。

- **应用名称**：用户将看到的任何名称（“Hermes” 是个合理的选择）。
- **头像 URL**：任何公开的 PNG 图片（Google 有一些默认选项）。
- **描述**：在应用目录中显示的简短句子。
- **功能**：启用 **接收 1:1 消息** 和 **加入空间和群聊对话**。
- **连接设置**：选择 **Cloud Pub/Sub**，输入主题名称 `projects/<your-project>/topics/hermes-chat-events`。
- **可见性**：限制为你的工作区（或特定用户）——在测试期间不要对所有人发布。

保存。

---

## 步骤 8：在测试空间中安装机器人

在浏览器中打开 Google Chat。通过 **+ 新聊天** 菜单搜索其名称来开始与你的应用的私聊。第一次发消息时，Google 会发送一个 `ADDED_TO_SPACE` 事件，Hermes 用它来缓存机器人自身的 `users/{id}`，用于过滤自身消息。

---

## 步骤 9：配置 Hermes

将 Google Chat 部分添加到 `~/.hermes/.env`：

```bash
# 必填
GOOGLE_CHAT_PROJECT_ID=my-chat-bot-123
GOOGLE_CHAT_SUBSCRIPTION_NAME=projects/my-chat-bot-123/subscriptions/hermes-chat-events-sub
GOOGLE_CHAT_SERVICE_ACCOUNT_JSON=/home/you/.hermes/google-chat-sa.json

# 授权 — 粘贴允许与机器人交谈的人员的电子邮件
GOOGLE_CHAT_ALLOWED_USERS=you@yourdomain.com,coworker@yourdomain.com

# 可选
GOOGLE_CHAT_HOME_CHANNEL=spaces/AAAA...         # 定时任务的默认投递目标
GOOGLE_CHAT_MAX_MESSAGES=1                      # Pub/Sub FlowControl；1 表示每个会话串行处理命令
GOOGLE_CHAT_MAX_BYTES=16777216                  # 16 MiB — 限制在途消息的字节数
```

项目 ID 也可以回退到 `GOOGLE_CLOUD_PROJECT`，服务账户路径可以回退到 `GOOGLE_APPLICATION_CREDENTIALS`——使用你喜欢的约定即可。

安装 Google Chat 适配器所需的依赖项（目前没有发布 Hermes 额外包——直接安装）：

```bash
pip install google-cloud-pubsub google-api-python-client google-auth google-auth-oauthlib
```

启动网关：

```bash
hermes gateway
```

你应该会看到类似这样的日志行：

```
[GoogleChat] Connected; project=my-chat-bot-123, subscription=<redacted>,
             bot_user_id=users/XXXX, flow_control(msgs=1, bytes=16777216)
```

在测试私聊中发送 "hola"。机器人会发布一个 "Hermes is thinking…" 标记，然后就地编辑同一条消息，替换为真正的回复——没有 "message deleted" 的墓碑记录。

---

## 格式化和功能

Google Chat 渲染一个有限的 Markdown 子集：

| 支持 | 不支持 |
|-----------|---------------|
| `*bold*`, `_italic_`, `~strike~`, `` `code` `` | 标题，列表 |
| 通过 URL 的内联图片 | 交互式卡片 v2 按钮（此网关为 v1） |
| 原生文件附件（在 `/setup-files` 之后——参见步骤 10） | 原生语音备忘录 / 循环视频备忘录 |

智能体的系统提示包含一个特定于 Google Chat 的提示，以便它了解这些限制并避免使用无法渲染的格式。

消息大小限制：每条消息 4000 个字符。较长的智能体会自动拆分为多条消息。

线程支持：当用户在线程内回复时，Hermes 会检测 `thread.name` 并在同一线程中发布其回复，因此每个线程都有一个独立的 Hermes 会话。

---

## 步骤 10：原生附件投递（可选）

开箱即用，机器人可以发布文本、通过 URL 的内联图片以及音频/视频/文档的下载卡片。要投递**原生** Chat 附件——即人类拖放文件时获得的那种相同的文件小部件——每个用户需要通过用户级的 OAuth 流程对机器人授权一次。

### 为什么需要单独的流程

Google Chat 的 `media.upload` 端点会严格拒绝服务账户认证：

> 此方法不支持使用服务账户进行应用认证。请使用用户账户进行认证。

没有 IAM 角色或范围可以解决此问题。该端点只接受用户凭据。因此，机器人在上传文件时必须*作为用户*行事——具体来说，就是作为请求文件的用户。

### 一次性主机设置

1.  前往同一 GCP 项目中的 **API 和服务 → 凭据**。
2.  **创建凭据 → OAuth 客户端 ID → 桌面应用**。
3.  下载 JSON 文件。将其移动到运行 Hermes 的主机上。
4.  在主机上，向 Hermes 注册该客户端：

```bash
python -m gateway.platforms.google_chat_user_oauth \
    --client-secret /path/to/client_secret.json
```

这会将配置写入 `~/.hermes/google_chat_user_client_secret.json`。这是共享基础设施——它标识的是 OAuth *应用*，而不是任何特定用户。无论之后有多少用户授权，每个主机只需一个文件。

### 每用户授权（在聊天中）

每个用户在自己与机器人的私聊中执行一次流程：

1.  他们向机器人发送 `/setup-files`。机器人回复状态和下一步操作。
2.  他们发送 `/setup-files start`。机器人回复一个 OAuth URL。
3.  他们打开 URL，点击 **允许**，然后看着浏览器加载 `http://localhost:1/?...&code=...` 失败。这个失败是预期的——授权码在 URL 栏中。
4.  他们复制失败的 URL（或仅复制 `code=...` 的值），并将其粘贴回聊天中，格式为 `/setup-files <粘贴的URL>`。机器人用它交换刷新令牌。

令牌保存在 `~/.hermes/google_chat_user_tokens/<sanitized_email>.json`。该用户私聊中的后续文件请求将使用*他们的*令牌，因此机器人以他们的身份上传，消息也会出现在他们的空间中。

要撤销：`/setup-files revoke` 仅删除该用户的令牌。其他用户的令牌不受影响。

### 范围

该流程仅请求一个范围：`chat.messages.create`。这涵盖了 `media.upload` 和引用已上传 `attachmentDataRef` 的 `messages.create`。没有 Drive 权限，没有更广泛的 Chat 范围——这是有意为之的最小权限原则。

### 多用户行为

当请求者还没有每用户令牌时，机器人会回退到旧版的单用户令牌，位于 `~/.hermes/google_chat_user_token.json`（如果在多用户安装之前存在）。当两者都不可用时，机器人会发布一条清晰的文本通知，告知请求者运行 `/setup-files`。

一个用户的撤销操作只会清除他们自己的令牌槽位。来自某个用户令牌的 401/403 错误只会驱逐该用户的缓存。用户之间互不干扰。

## 故障排除

**发送"hola"后机器人保持沉默。**

1. 检查控制台中 Pub/Sub 订阅是否存在未送达的消息。
   如果存在，说明 Hermes 未通过身份验证 — 请验证 `GOOGLE_CHAT_SERVICE_ACCOUNT_JSON` 环境变量，并确认该服务账号已被列为订阅的 `Pub/Sub Subscriber`。
2. 如果订阅的消息数为零，则表明 Google Chat 未发布消息。
   请仔细检查**主题**上的 IAM 绑定：
   `chat-api-push@system.gserviceaccount.com` 必须拥有 `Pub/Sub Publisher` 权限。
3. 检查 `hermes gateway` 日志中是否有 `[GoogleChat] Connected`。如果你看到
   `[GoogleChat] Config validation failed`，错误消息会提示你需要修复哪个环境变量。

**机器人有回复，但出现的是错误消息而不是智能体的回答。**

检查日志中是否有 `[GoogleChat] Pub/Sub stream died` — 如果这些错误重复出现，你的服务账号凭据可能已被轮换或订阅已被删除。在 10 次尝试后，适配器会将自身标记为致命错误。

**每条出站消息都返回"403 Forbidden"。**

机器人已从空间中移除，或你在 Chat API 控制台中撤销了它。
在空间中重新安装它（下一个 `ADDED_TO_SPACE` 事件将自动重新启用消息功能）。

**出现过多的"Rate limit hit"警告。**

Chat API 的默认配额允许每个空间每分钟发送 60 条消息。如果你的智能体产生的长流式响应超出了这个限制，适配器会进行指数退避重试 — 但你仍然会看到用户可见的延迟。考虑使用简洁的回复或在 GCP 控制台中提高配额。

**机器人持续发布"/setup-files"通知而不是文件。**

询问者没有每用户 OAuth 令牌，也没有遗留的备用方案。在他们的私信中运行 `/setup-files` 并执行步骤 10。交互完成后，下一次文件请求将无需重启网关即可直接上传。

**`/setup-files start` 提示"No client credentials stored on the host."。**

未执行一次性的主机设置。在运行 Hermes 的主机终端上执行：

```bash
python -m gateway.platforms.google_chat_user_oauth \
    --client-secret /path/to/client_secret.json
```

然后再次发送 `/setup-files start`。

**`/setup-files <PASTED_URL>` 提示"Token exchange failed."。**

授权码是一次性且有时效性的（通常为几分钟）。发送
`/setup-files start` 以获取新的 URL 并重试。

---

## 安全说明

- **服务账号作用域**：该适配器请求 `chat.bot` 和 `pubsub` 作用域。
  IAM 应作为实际的强制执行层 — 授予你的服务账号最小权限
  （`roles/pubsub.subscriber` + 对订阅的 `roles/pubsub.viewer`），而非
  项目级或组织级的 Pub/Sub 角色。
- **附件下载保护**：Hermes 仅会将服务账号的承载令牌附加到主机与 Google 拥有的域名
  简短允许列表（`googleapis.com`、`drive.google.com`、`lh[3-6].googleusercontent.com` 等）匹配的 URL。
  任何其他主机都会在发出 HTTP 请求之前被拒绝，以防止 SSRF 场景，即恶意事件可能将
  承载令牌重定向到 GCE 元数据服务。
- **信息脱敏**：服务账号邮箱、订阅路径和主题路径会通过 `agent/redact.py` 从日志输出中剥离。
  调试信封转储（`GOOGLE_CHAT_DEBUG_RAW=1`）通过相同的脱敏过滤器，并以 DEBUG 级别记录日志。
- **合规性**：如果你计划将此机器人连接到受监管的工作区（任何具有数据驻留或 AI 治理策略的环境），
  请在首次安装前获得相关批准。
- **用户 OAuth 作用域**：每用户附件流程*仅*请求 `chat.messages.create` — 这是涵盖 `media.upload`
  以及后续 `messages.create` 的最小权限。令牌以纯 JSON 格式持久化存储在
  `~/.hermes/google_chat_user_tokens/<sanitized_email>.json`（文件系统权限是保护措施 — 与服务账号密钥文件模型相同）。
  每个令牌仅属于一个用户；撤销操作仅针对该用户生效。