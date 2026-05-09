---
sidebar_position: 10
title: "钉钉"
description: "将 Hermes 智能体设置为钉钉聊天机器人"
---

# 钉钉设置

Hermes 智能体可作为聊天机器人集成到钉钉中，让你能够通过私信或群聊与你的 AI 助手对话。该机器人通过钉钉的流式模式（Stream Mode）连接——这是一种持久化的 WebSocket 连接，无需公共 URL 或 Webhook 服务器——并通过钉钉的会话 Webhook API 以 Markdown 格式的消息进行回复。

在开始设置之前，先回答大多数人最关心的问题：Hermes 智能体进入你的钉钉工作区后会如何表现。

## Hermes 智能体的行为方式

| 场景 | 行为 |
|---------|----------|
| **私信（1:1 聊天）** | Hermes 智能体会回复每一条消息。无需 `@提及`。每条私信都有其独立的会话。 |
| **群聊** | 当你 `@提及` Hermes 智能体时，它才会回复。如果没有提及，Hermes 智能体会忽略该消息。 |
| **多人共享群组** | 默认情况下，Hermes 智能体会在群组内为每个用户隔离会话历史。同一群组中的两个人不会共享同一份对话记录，除非你明确禁用此功能。 |

### 钉钉中的会话模型

默认情况下：

- 每条私信都会获得其独立的会话
- 共享群聊中的每个用户在该群组内都会获得其独立的会话

此行为由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当你明确希望整个群组共享一个对话时才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

本指南将引导你完成整个设置流程——从创建钉钉机器人到发送你的第一条消息。

## 先决条件

安装所需的 Python 包：

```bash
pip install "hermes-agent[dingtalk]"
```

或者分别安装：

```bash
pip install dingtalk-stream httpx alibabacloud-dingtalk
```

- `dingtalk-stream` — 钉钉 Stream 模式（基于 WebSocket 的实时消息传递）的官方 SDK
- `httpx` — 用于通过会话 Webhook 发送回复的异步 HTTP 客户端
- `alibabacloud-dingtalk` — 钉钉 OpenAPI SDK，用于 AI 卡片、表情反应和媒体下载

## 步骤 1：创建钉钉应用

1. 访问 [钉钉开发者控制台](https://open-dev.dingtalk.com/)。
2. 使用您的钉钉管理员账户登录。
3. 点击 **应用开发** → **自定义应用** → **通过 H5 微应用创建应用**（或根据您的控制台版本选择 **机器人**）。
4. 填写：
   - **应用名称**：例如 `Hermes 智能体`
   - **描述**：可选
5. 创建完成后，进入 **凭证与基本信息** 页面，找到您的 **客户端 ID**（AppKey）和 **客户端密钥**（AppSecret）。请复制这两个值。

:::warning[凭证仅显示一次]
客户端密钥仅在创建应用时显示一次。如果丢失，您需要重新生成。切勿公开分享这些凭证或将它们提交到 Git。
:::

## 步骤 2：启用机器人能力

1. 在您的应用设置页面中，进入 **添加能力** → **机器人**。
2. 启用机器人能力。
3. 在 **消息接收模式** 下，选择 **Stream 模式**（推荐 — 无需公网 URL）。

:::tip
Stream 模式是推荐设置。它使用从您的机器发起的持久 WebSocket 连接，因此您不需要公网 IP、域名或 Webhook 端点。此模式可在 NAT、防火墙和本地机器后工作。
:::

## 步骤 3：查找您的钉钉用户 ID

Hermes 智能体使用您的钉钉用户 ID 来控制谁可以与机器人交互。钉钉用户 ID 是由您的组织管理员设置的字母数字字符串。

要查找您的用户 ID：

1. 向您的钉钉组织管理员询问 — 用户 ID 在钉钉管理控制台的 **通讯录** → **成员** 中配置。
2. 或者，机器人会记录每条传入消息的 `sender_id`。启动网关，向机器人发送一条消息，然后检查日志以获取您的 ID。

## 步骤 4：配置 Hermes 智能体

### 选项 A：交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

当提示时选择 **钉钉**。设置向导可以通过以下两种方式之一进行授权：

- **二维码设备流（推荐）。** 使用钉钉移动应用扫描终端中打印的二维码 — 您的客户端 ID 和客户端密钥将自动返回并写入 `~/.hermes/.env`。无需访问开发者控制台。
- **手动粘贴。** 如果您已有凭证（或二维码扫描不方便），请在提示时粘贴您的客户端 ID、客户端密钥和允许的用户 ID。

:::note openClaw 品牌披露
由于钉钉的 `verification_uri_complete` 在 API 层硬编码为 openClaw 身份，因此二维码目前会在 `openClaw` 源字符串下进行授权，直到阿里巴巴 / 钉钉-真实-AI 在服务器端注册一个 Hermes 专用模板。这纯粹是钉钉如何呈现同意屏幕 — 您创建的机器人完全属于您，并且对您的租户是私有的。
:::

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# 必需
DINGTALK_CLIENT_ID=your-app-key
DINGTALK_CLIENT_SECRET=your-app-secret

# 安全：限制谁可以与机器人交互
DINGTALK_ALLOWED_USERS=user-id-1

# 多个允许的用户（逗号分隔）
# DINGTALK_ALLOWED_USERS=user-id-1,user-id-2

# 可选：群聊门控（与 Slack/Telegram/Discord/WhatsApp 类似）
# DINGTALK_REQUIRE_MENTION=true
# DINGTALK_FREE_RESPONSE_CHATS=cidABC==,cidDEF==
# DINGTALK_MENTION_PATTERNS=^小马
# DINGTALK_HOME_CHANNEL=cidXXXX==
# DINGTALK_ALLOW_ALL_USERS=true
```

`~/.hermes/config.yaml` 中的可选行为设置：

```yaml
group_sessions_per_user: true

gateway:
  platforms:
    dingtalk:
      extra:
        # 在群组中回复前需要 @提及（与 Slack/Telegram/Discord 保持一致）。
        # 私聊忽略此设置 — 机器人始终在 1:1 聊天中回复。
        require_mention: true

        # 按平台白名单。设置后，只有这些钉钉用户 ID 可以与机器人交互
        # （与 DINGTALK_ALLOWED_USERS 语义相同，但作用域在此处而非 .env 中）。
        allowed_users:
          - user-id-1
          - user-id-2
```

- `group_sessions_per_user: true` 在共享群聊中保持每个参与者的上下文隔离
- `require_mention: true` 防止机器人回复每条群消息 — 它仅在有人 @提及它时才回答
- `allowed_users` 在 `dingtalk.extra` 下是 `DINGTALK_ALLOWED_USERS` 的替代方案；如果两者都设置，它们将被合并

### 启动网关

配置完成后，启动钉钉网关：

```bash
hermes gateway
```

机器人应在几秒钟内连接到钉钉的 Stream 模式。向它发送一条消息 — 可以是私聊，也可以是已添加机器人的群组 — 以进行测试。

:::tip
您可以将 `hermes gateway` 作为后台进程或 systemd 服务运行，以实现持久运行。有关详细信息，请参阅部署文档。
:::

## 功能

### AI 卡片

Hermes 可以使用钉钉 AI 卡片而不是纯 Markdown 消息进行回复。卡片提供更丰富、更结构化的显示，并支持在智能体生成回复时进行流式更新。

要启用 AI 卡片，请在 `config.yaml` 中配置卡片模板 ID：

```yaml
platforms:
  dingtalk:
    enabled: true
    extra:
      card_template_id: "your-card-template-id"
```

您可以在钉钉开发者控制台中您的应用 AI 卡片设置下找到您的卡片模板 ID。启用 AI 卡片后，所有回复都将作为带有流式文本更新的卡片发送。

### 表情反应

Hermes 会自动为您的消息添加表情反应以显示处理状态：

- 🤔思考中 — 当机器人开始处理您的消息时添加
- 🥳完成 — 当回复完成时添加（替换“思考中”反应）

这些反应在私聊和群聊中都有效。

### 显示设置

您可以独立于其他平台自定义钉钉的显示行为：

```yaml
display:
  platforms:
    dingtalk:
      show_reasoning: false   # 在回复中显示模型推理/思考
      streaming: true         # 启用流式回复（与 AI 卡片配合使用）
      tool_progress: all      # 显示工具执行进度（all/new/off）
      interim_assistant_messages: true  # 显示中间评论消息
```

要禁用工具进度和中间消息以获得更简洁的体验：

```yaml
display:
  platforms:
    dingtalk:
      tool_progress: off
      interim_assistant_messages: false
```

## 故障排除

### 机器人不响应消息

**原因**：机器人能力未启用，或 `DINGTALK_ALLOWED_USERS` 不包含您的用户 ID。

**解决方法**：验证您的应用设置中已启用机器人能力，并选择了 Stream 模式。检查您的用户 ID 是否在 `DINGTALK_ALLOWED_USERS` 中。重启网关。

### “dingtalk-stream 未安装”错误

**原因**：未安装 `dingtalk-stream` Python 包。

**解决方法**：安装它：

```bash
pip install dingtalk-stream httpx
```

### “DINGTALK_CLIENT_ID 和 DINGTALK_CLIENT_SECRET 必需”

**原因**：凭证未在您的环境或 `.env` 文件中设置。

**解决方法**：验证 `DINGTALK_CLIENT_ID` 和 `DINGTALK_CLIENT_SECRET` 在 `~/.hermes/.env` 中设置正确。客户端 ID 是您的 AppKey，客户端密钥是您的 AppSecret（来自钉钉开发者控制台）。

### 流断开连接 / 重连循环

**原因**：网络不稳定、钉钉平台维护或凭证问题。

**解决方法**：适配器会自动以指数退避方式重新连接（2秒 → 5秒 → 10秒 → 30秒 → 60秒）。检查您的凭证是否有效，以及您的应用是否未被停用。验证您的网络是否允许出站 WebSocket 连接。

### 机器人离线

**原因**：Hermes 网关未运行，或连接失败。

**解决方法**：检查 `hermes gateway` 是否正在运行。查看终端输出中的错误消息。常见问题：凭证错误、应用被停用、`dingtalk-stream` 或 `httpx` 未安装。

### “无可用 session_webhook”

**原因**：机器人尝试回复但没有会话 Webhook URL。这通常发生在 Webhook 过期或机器人在接收消息和发送回复之间重启时。

**解决方法**：向机器人发送一条新消息 — 每条传入消息都会提供一个用于回复的新会话 Webhook。这是钉钉的正常限制；机器人只能回复最近接收到的消息。

## 安全

:::warning
始终设置 `DINGTALK_ALLOWED_USERS` 以限制可与机器人交互的人员。若不设置，网关默认拒绝所有用户以确保安全。仅添加您信任人员的用户 ID —— 授权用户可完全访问智能体的功能，包括工具使用和系统访问权限。
:::

有关保护您的 Hermes 智能体部署的更多信息，请参阅[安全指南](../security.md)。

## 注意事项

- **流式模式**：无需公共 URL、域名或 Webhook 服务器。连接通过 WebSocket 从您的机器发起，因此可在 NAT 和防火墙后运行。
- **AI 卡片**：可选择使用丰富的 AI 卡片而非纯 Markdown 回复。通过 `card_template_id` 进行配置。
- **表情符号反应**：自动添加 🤔思考中/🥳已完成 反应以表示处理状态。
- **Markdown 回复**：回复采用钉钉的 Markdown 格式，以支持富文本显示。
- **媒体支持**：传入消息中的图片和文件会被自动解析，并可通过视觉工具进行处理。
- **消息去重**：适配器在 5 分钟窗口内对消息进行去重，以防止重复处理同一消息。
- **自动重连**：如果流式连接断开，适配器会自动以指数退避方式重新连接。
- **消息长度限制**：每条消息的回复限制为 20,000 个字符。超出长度的回复将被截断。