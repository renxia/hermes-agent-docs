---
sidebar_position: 12
title: "Google Chat"
description: "通过 Cloud Pub/Sub 将赫尔墨斯智能体设置为 Google Chat 机器人"
---

# Google Chat 设置

将赫尔墨斯智能体连接到 Google Chat 作为机器人。此集成使用 Cloud Pub/Sub 拉取订阅来处理入站事件，并使用 Chat REST API 发送出站消息。其工作方式与 Slack Socket 模式或 Telegram 长轮询类似：你的赫尔墨斯进程不需要公开的 URL、隧道或 TLS 证书。它只需连接、认证并监听订阅——就像 Telegram 机器人通过令牌监听一样。

> 运行 `hermes gateway setup` 命令并选择 **Google Chat** 以获取引导式操作流程。

:::note Workspace 版本
Google Chat 是 Google Workspace 的一部分。你可以将此集成用于个人 Workspace（通过 Google 注册的 `@yourdomain.com`）或你拥有发布应用管理员权限的工作 Workspace。仅使用 Gmail 的帐户无法托管 Chat 应用。
:::

## 概述

| 组件 | 值 |
|-----------|-------|
| **库** | `google-cloud-pubsub`, `google-api-python-client`, `google-auth` |
| **入站传输** | Cloud Pub/Sub 拉取订阅（无需公开端点） |
| **出站传输** | Chat REST API (`chat.googleapis.com`) |
| **认证** | 对订阅具有 `roles/pubsub.subscriber` 权限的服务账号 JSON 文件 |
| **用户标识** | Chat 资源名称 (`users/{id}`) + 电子邮件 |

---

## 第 1 步：创建或选择一个 GCP 项目

您需要一个 Google Cloud 项目来托管 Pub/Sub 主题。如果还没有，请前往 [console.cloud.google.com](https://console.cloud.google.com) 创建 ——
个人账户拥有免费层，足以轻松应对机器人流量。

记下项目 ID（例如 `my-chat-bot-123`）。您将在所有后续步骤中使用它。

---

## 第 2 步：启用两个 API

在控制台中，前往 **API 和服务 → 库** 并启用：

- **Google Chat API**
- **Cloud Pub/Sub API**

对于个人机器人产生的用量，这两者都是免费的。

---

## 第 3 步：创建服务账户

**IAM 和管理 → 服务账户 → 创建服务账户。**

- 名称：`hermes-chat-bot`
- 跳过“授予此服务账户访问项目的权限”步骤。针对特定订阅的 IAM 权限就足够了 —— **不要**授予项目级的 Pub/Sub 角色。

创建后，打开该服务账户，前往 **密钥 → 添加密钥 → 创建新密钥 → JSON**，然后下载文件。将其保存在只有 Hermes 能读取的位置（例如 `~/.hermes/google-chat-sa.json`，`chmod 600`）。

:::caution 没有“Chat Bot Caller”角色
一个常见的错误是搜索 Chat 特定的 IAM 角色并在项目级别授予它。该角色不存在。Chat 机器人的权限来源于其在空间中的安装，而不是来自 IAM。您的服务账户只需要拥有您在下一步中创建的订阅上的 Pub/Sub 订阅者权限。
:::

---

## 第 4 步：创建 Pub/Sub 主题和订阅

**Pub/Sub → 主题 → 创建主题。**

- 主题 ID：`hermes-chat-events`
- 其余所有设置保持默认。

创建后，主题的详细信息页面有一个 **订阅** 选项卡。创建一个：

- 订阅 ID：`hermes-chat-events-sub`
- 投递类型：**拉取**
- 消息保留：**7 天**（以便积压任务能在 Hermes 重启后保留）
- 其余保持默认。

---

## 第 5 步：主题上的 IAM 绑定（关键）

在**主题**（不是订阅）上，添加一个 IAM 主体：

- 主体：`chat-api-push@system.gserviceaccount.com`
- 角色：`Pub/Sub Publisher`

没有此设置，Google Chat 将无法向您的主题发布事件，您的机器人将永远接收不到任何内容。

---

## 第 6 步：订阅上的 IAM 绑定

在**订阅**上，将您自己的服务账户添加为主体：

- 主体：`hermes-chat-bot@<your-project>.iam.gserviceaccount.com`
- 角色：`Pub/Sub Subscriber`

同时在同一订阅上授予 `Pub/Sub Viewer` 权限 —— Hermes 在启动时会调用 `subscription.get()` 作为可达性检查。

---

## 第 7 步：配置 Chat 应用

前往 **API 和服务 → Google Chat API → 配置**。

- **应用名称**：您希望用户看到的任何名称（“Hermes” 是个不错的选择）。
- **头像 URL**：任何公开的 PNG 图片（Google 提供了一些默认选项）。
- **描述**：在应用目录中显示的简短句子。
- **功能**：启用**接收一对一消息**和**加入空间和群组对话**。
- **连接设置**：选择 **Cloud Pub/Sub**，输入主题名称 `projects/<your-project>/topics/hermes-chat-events`。
- **可见性**：限制为您的工作区（或特定用户） —— 在测试期间不要向所有人发布。

保存。

---

## 第 8 步：在测试空间中安装机器人

在浏览器中打开 Google Chat。通过 **+ 新聊天** 菜单搜索应用名称，与其开始私信。当您首次向其发送消息时，Google 会发送一个 `ADDED_TO_SPACE` 事件，Hermes 会使用此事件缓存机器人自身的 `users/{id}` 以进行自身消息过滤。

---

## 第 9 步：配置 Hermes

将 Google Chat 部分添加到 `~/.hermes/.env`：

```bash
# 必需
GOOGLE_CHAT_PROJECT_ID=my-chat-bot-123
GOOGLE_CHAT_SUBSCRIPTION_NAME=projects/my-chat-bot-123/subscriptions/hermes-chat-events-sub
GOOGLE_CHAT_SERVICE_ACCOUNT_JSON=/home/you/.hermes/google-chat-sa.json

# 授权 —— 粘贴允许与机器人对话的人员邮箱
GOOGLE_CHAT_ALLOWED_USERS=you@yourdomain.com,coworker@yourdomain.com

# 可选
GOOGLE_CHAT_HOME_CHANNEL=spaces/AAAA...         # 定时任务的默认投递目标
GOOGLE_CHAT_MAX_MESSAGES=1                      # Pub/Sub 流控制；1 表示每个会话串行处理命令
GOOGLE_CHAT_MAX_BYTES=16777216                  # 16 MiB —— 进行中消息字节数上限
```

项目 ID 也会回退到 `GOOGLE_CLOUD_PROJECT`，服务账户路径也会回退到 `GOOGLE_APPLICATION_CREDENTIALS` —— 使用您偏好的约定即可。

安装 Google Chat 适配器所需的依赖项（目前没有发布 Hermes 额外包 —— 直接安装）：

```bash
pip install google-cloud-pubsub google-api-python-client google-auth google-auth-oauthlib
```

启动网关：

```bash
hermes gateway
```

您应该会看到类似以下日志行：

```
[GoogleChat] Connected; project=my-chat-bot-123, subscription=<redacted>,
             bot_user_id=users/XXXX, flow_control(msgs=1, bytes=16777216)
```

在测试私信中发送 "hola"。机器人会发布一个 "Hermes is thinking..." 标记，然后使用真实响应原地编辑同一条消息 —— 没有 "消息已删除" 的墓碑标记。

---

## 格式和功能

Google Chat 支持有限的 Markdown 子集：

| 支持的格式 | 不支持的格式 |
|------------|--------------|
| `*粗体*`、`_斜体_`、`~删除线~`、`` `代码` `` | 标题、列表 |
| 通过 URL 的内联图片 | 交互式卡片 v2 按钮（此网关的 v1 版本） |
| 原生文件附件（执行 `/setup-files` 后 —— 参见步骤 10） | 原生语音备忘录 / 环形视频备忘录 |

智能体的系统提示中包含一个 Google Chat 特定的提示，以便它了解这些限制并避免使用无法渲染的格式。

消息大小限制：每条消息 4000 个字符。较长的智能体响应会自动拆分为多条消息。

线程支持：当用户在线程内回复时，Hermes 会检测到 `thread.name` 并在同一线程中发布其回复，因此每个线程会获得一个独立的 Hermes 会话。

---

## 第 10 步：原生附件投递（可选）

开箱即用，机器人可以发布文本、通过 URL 的内联图片以及音频/视频/文档的下载卡片。要投递**原生** Chat 附件 —— 与人类拖放文件时获得的相同文件小部件 —— 每个用户需要通过一次每用户 OAuth 流程授权机器人。

### 为何需要单独的流程

Google Chat 的 `media.upload` 端点严格拒绝服务账户身份验证：

> 此方法不支持使用服务账户的应用身份验证。
> 请使用用户账户进行身份验证。

没有任何 IAM 角色或范围可以解决此问题。该端点仅接受用户凭据。因此，机器人在上传文件时必须*作为用户* —— 具体来说，是请求该文件的用户的用户身份。

### 一次性主机设置

1.  在同一个 GCP 项目中，前往 **API 和服务 → 凭据**。
2.  **创建凭据 → OAuth 客户端 ID → 桌面应用**。
3.  下载 JSON 文件。将其移至运行 Hermes 的主机上。
4.  在主机上，向 Hermes 注册该客户端：

```bash
python -m plugins.platforms.google_chat.oauth \
    --client-secret /path/to/client_secret.json
```

这会写入 `~/.hermes/google_chat_user_client_secret.json`。这是共享基础设施 —— 它标识的是 OAuth *应用*，而不是任何特定用户。无论之后有多少用户授权，每个主机一个文件就足够了。

### 每用户授权（在聊天中）

每个用户在其与机器人的私信中运行一次流程：

1.  他们向机器人发送 `/setup-files`。机器人会回复状态和下一步操作。
2.  他们发送 `/setup-files start`。机器人会回复一个 OAuth URL。
3.  他们打开该 URL，点击**允许**，然后看着浏览器加载 `http://localhost:1/?...&code=...` 失败。这个失败是预期的 —— 授权码在地址栏中。
4.  他们复制失败的 URL（或仅复制 `code=...` 部分）并将其粘贴回聊天中，作为 `/setup-files <粘贴的URL>`。机器人将其交换为刷新令牌。

令牌存储在 `~/.hermes/google_chat_user_tokens/<sanitized_email>.json`。后续在该用户私信中的文件请求将使用*他们的*令牌，因此机器人代表他们上传，消息将出现在他们的空间中。

要稍后撤销：`/setup-files revoke` 仅删除该用户的令牌。其他用户的令牌不受影响。

### 范围

该流程仅请求一个范围：`chat.messages.create`。这涵盖了 `media.upload` 和引用已上传 `attachmentDataRef` 的 `messages.create`。没有 Drive 权限，也没有更广泛的 Chat 范围 —— 这是出于最小权限原则。

### 多用户行为

当请求者还没有每用户令牌时，机器人会回退到 `~/.hermes/google_chat_user_token.json`（如果存在，来自多用户安装之前的旧安装）的单用户令牌。当两者都不可用时，机器人会发布清晰的文本通知，告知请求者运行 `/setup-files`。

用户撤销只会清除自己的令牌槽位。某个用户的令牌收到 401/403 响应只会驱逐该用户的缓存。用户之间互不干扰。

---

## 故障排除

**发送"hola"后机器人保持静默**

1.  检查控制台中的 Pub/Sub 订阅是否有未传递的消息。
    如果有，说明 Hermes 未通过身份验证——请验证 `GOOGLE_CHAT_SERVICE_ACCOUNT_JSON`
    以及服务账号是否已作为 `Pub/Sub Subscriber` 列在订阅中。
2.  如果订阅消息数为零，说明 Google Chat 未发布消息。
    仔细检查 **主题** 上的 IAM 绑定：
    `chat-api-push@system.gserviceaccount.com` 必须拥有 `Pub/Sub Publisher` 权限。
3.  检查 `hermes gateway` 日志中是否有 `[GoogleChat] Connected`。如果你看到
    `[GoogleChat] Config validation failed`，错误消息会告知你需要修复哪个环境变量。

**机器人有回复，但显示错误消息而非智能体的回答。**

检查日志中的 `[GoogleChat] Pub/Sub stream died` —— 如果这些错误重复出现，你的服务账号凭据可能已被轮换或订阅已被删除。在尝试 10 次后，适配器会将自身标记为致命错误。

**每条出站消息都显示"403 Forbidden"。**

机器人已从空间中移除，或者你在 Chat API 控制台中撤销了它。
在空间中重新安装它（下一个 `ADDED_TO_SPACE` 事件将自动重新启用消息传递）。

**出现太多"Rate limit hit"警告。**

Chat API 的默认配额允许每个空间每分钟 60 条消息。如果你的
智能体产生超过此限制的长时间流式响应，适配器会以指数退避重试——但你仍然会看到用户可见的延迟。考虑使用简洁的回复或在 GCP 控制台中提高配额。

**机器人持续发布"/setup-files"通知而非文件。**

请求者没有每用户 OAuth 令牌，也没有旧版回退。在其私信中运行
`/setup-files` 并执行步骤 10。交换完成后，下一次文件请求将原生上传，无需重启网关。

**`/setup-files start` 提示"No client credentials stored on the host."**

未执行一次性主机设置。在运行 Hermes 的主机终端上执行：

```bash
python -m plugins.platforms.google_chat.oauth \
    --client-secret /path/to/client_secret.json
```

然后再次发送 `/setup-files start`。

**`/setup-files <PASTED_URL>` 提示"Token exchange failed."**

授权码是一次性使用且有时效性（通常几分钟）。发送
`/setup-files start` 获取新 URL 并重试。

---

## 安全说明

-   **服务账号权限范围**：适配器请求 `chat.bot` 和 `pubsub` 权限范围。
    IAM 应是实际的执行机制——授予你的服务账号最小权限
    （在订阅上授予 `roles/pubsub.subscriber` + `roles/pubsub.viewer`），而非
    项目级别或组织级别的 Pub/Sub 角色。
-   **附件下载保护**：Hermes 仅会将服务账号承载令牌附加到
    主机匹配 Google 拥有的域名短允许列表的 URL（
    `googleapis.com`、`drive.google.com`、`lh[3-6].googleusercontent.com` 以及
    少数其他域名）。任何其他主机在 HTTP 请求前都会被拒绝，以
    防止 SSRF 场景，即精心构造的事件可能将承载令牌重定向到 GCE 元数据服务。
-   **脱敏处理**：服务账号邮箱、订阅路径和主题路径
    会通过 `agent/redact.py` 从日志输出中去除。调试信息转储
    （`GOOGLE_CHAT_DEBUG_RAW=1`）通过相同的脱敏过滤器路由，并
    在 DEBUG 级别记录。
-   **合规性**：如果你计划将此机器人连接到受监管的工作空间
    （任何具有数据驻留或 AI 治理策略的环境），请在首次安装前获得批准。
-   **用户 OAuth 权限范围**：每用户附件流程仅请求
    `chat.messages.create` —— 这是覆盖 `media.upload` 加上后续
    `messages.create` 的最小权限。令牌以纯 JSON 形式持久化存储在
    `~/.hermes/google_chat_user_tokens/<sanitized_email>.json`（文件系统
    权限是保护措施——与服务账号密钥文件模型相同）。每个
    令牌仅属于一个用户；撤销操作仅针对该用户。