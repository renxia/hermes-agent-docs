---
sidebar_position: 10
title: "钉钉"
description: "将 Hermes Agent 设置为钉钉聊天机器人"
---

# 钉钉设置

Hermes Agent 集成了钉钉（DingTalk）作为聊天机器人，允许您通过私信或群聊直接与 AI 助手对话。该机器人通过钉钉的 Stream Mode（流式模式）连接——一种无需公开 URL 或 webhook 服务器的持久 WebSocket 连接——并通过钉钉的会话 webhook API 以 markdown 格式回复消息。

在开始设置之前，这里先解答大多数人最关心的问题：一旦 Hermes 被添加到您的钉钉工作区后，它的行为是怎样的。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| **私信（1:1 聊天）** | Hermes 会回复每一条消息。无需 `@提及`。每条私信都有独立的会话。 |
| **群聊** | 只有当您 `@提及` 它时，Hermes 才会回复。未提及时，Hermes 会忽略消息。 |
| **多人共享群聊** | 默认情况下，Hermes 会在群聊中为每个用户隔离会话历史记录。同一群聊中两个人之间的对话不会共享同一个记录，除非您明确关闭此功能。 |

### 钉钉中的会话模型

默认情况下：

- 每条私信都会创建独立会话
- 在共享群聊中，每位用户拥有各自的独立会话

此行为由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您需要整个群聊共享一个统一对话时才设为 `false`：

```yaml
group_sessions_per_user: false
```

本指南将逐步引导您完成完整设置流程——从创建钉钉机器人到发送第一条消息。

## 前提条件

安装所需的 Python 包：

```bash
pip install "hermes-agent[dingtalk]"
```

或者单独安装：

```bash
pip install dingtalk-stream httpx alibabacloud-dingtalk
```

- `dingtalk-stream` — 钉钉官方 SDK，支持 Stream Mode（基于 WebSocket 的实时消息）
- `httpx` — 用于通过会话 webhook 发送回复的异步 HTTP 客户端
- `alibabacloud-dingtalk` — 钉钉开放平台 SDK，支持 AI 卡片、表情反应和媒体下载

## 步骤 1：创建钉钉应用

1. 访问 [钉钉开发者后台](https://open-dev.dingtalk.com/)。
2. 使用您的钉钉管理员账号登录。
3. 点击 **应用开发** → **自定义应用** → **通过 H5 微应用创建**（或根据控制台版本选择 **机器人**）。
4. 填写以下信息：
   - **应用名称**：例如 `Hermes Agent`
   - **描述**：（可选）
5. 创建完成后，进入 **凭证与基础信息** 页面，找到您的 **Client ID**（AppKey）和 **Client Secret**（AppSecret），并复制保存。

:::warning[凭证仅显示一次]
Client Secret 仅在创建应用时显示一次。如果丢失，需重新生成。切勿公开分享这些凭据或将它们提交至 Git 仓库。
:::

## 步骤 2：启用机器人能力

1. 在应用设置页面，进入 **添加能力** → **机器人**。
2. 启用机器人能力。
3. 在 **消息接收模式** 中选择 **Stream Mode**（推荐——无需公网 URL）。

:::tip
Stream Mode 是推荐的配置方式。它通过从您的机器发起的长连接 WebSocket 实现，因此不需要公网 IP、域名或 webhook 端点。即使在 NAT、防火墙之后或本地机器上也能正常工作。
:::

## 步骤 3：获取您的钉钉 User ID

Hermes Agent 使用您的钉钉 User ID 来控制谁可以与机器人交互。钉钉 User ID 是由组织管理员设置的字母数字字符串。

获取方法如下：

1. 向您的钉钉组织管理员咨询——User ID 可在钉钉管理后台 **通讯录** → **成员** 中查看。
2. 或者，机器人会在每条收到的消息日志中记录 `sender_id`。启动网关后，向机器人发送一条消息，然后查看日志即可看到您的 ID。

## 步骤 4：配置 Hermes Agent

### 选项 A：交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

按提示选择 **DingTalk**。设置向导可通过以下两种方式授权：

- **二维码设备流（推荐）**。使用钉钉移动应用扫描终端打印的二维码——系统会自动返回 Client ID 和 Client Secret，并写入 `~/.hermes/.env` 文件。无需再次访问开发者控制台。
- **手动粘贴**。如果您已有凭据（或二维码扫描不便），按提示粘贴 Client ID、Client Secret 和允许的用户 ID。

:::note openClaw 品牌披露说明
由于钉钉 API 层将 `verification_uri_complete` 硬编码为 openClaw 身份标识，当前 QR 码会显示为 `openClaw` 来源，直到阿里巴巴/钉钉真实 AI 注册 Hermes 专用模板服务端。这仅是钉钉展示同意页面的方式——您创建的机器人完全属于您，仅对您所在租户私有。
:::

### 选项 B：手动配置

在 `~/.hermes/.env` 文件中添加以下内容：

```bash
# 必需项
DINGTALK_CLIENT_ID=your-app-key
DINGTALK_CLIENT_SECRET=your-app-secret

# 安全限制：限定可交互的用户
DINGTALK_ALLOWED_USERS=user-id-1

# 多个允许用户（逗号分隔）
# DINGTALK_ALLOWED_USERS=user-id-1,user-id-2
```

在 `~/.hermes/config.yaml` 中添加可选行为设置：

```yaml
group_sessions_per_user: true
```

- `group_sessions_per_user: true` 表示在共享群聊中保持各参与者的上下文隔离

### 启动网关

配置完成后，启动钉钉网关：

```bash
hermes gateway
```

机器人应在几秒内连接到钉钉的 Stream Mode。发送一条消息（私信或在已添加机器人的群聊中）进行测试。

:::tip
您可以将 `hermes gateway` 作为后台进程或 systemd 服务运行以实现持久化操作。详见部署文档。
:::

## 功能特性

### AI 卡片

Hermes 可使用钉钉 AI 卡片替代纯文本 markdown 消息进行回复。卡片提供更丰富的结构化展示，并支持流式更新（随着代理生成响应而动态更新内容）。

要启用 AI 卡片，请在 `config.yaml` 中配置卡片模板 ID：

```yaml
platforms:
  dingtalk:
    enabled: true
    extra:
      card_template_id: "your-card-template-id"
```

您可以在钉钉开发者后台的应用 AI 卡片设置中找到模板 ID。启用后，所有回复将以带流式文本更新的卡片形式发送。

### 表情反应

Hermes 会自动为您的消息添加表情反应以显示处理状态：

- 🤔思考中 — 机器人开始处理消息时添加
- 🥳已完成 — 响应完成后添加（替换思考中表情）

这些反应在私信和群聊中均有效。

### 显示设置

您可以独立定制钉钉的显示行为：

```yaml
display:
  platforms:
    dingtalk:
      show_reasoning: false   # 是否在回复中显示模型推理/思考过程
      streaming: true         # 启用流式响应（兼容 AI 卡片）
      tool_progress: all      # 显示工具执行进度（all/new/off）
      interim_assistant_messages: true  # 显示中间评论消息
```

如需更简洁的体验，可关闭工具和中间消息：

```yaml
display:
  platforms:
    dingtalk:
      tool_progress: off
      interim_assistant_messages: false
```

## 故障排除

### 机器人无响应

**原因**：未启用机器人能力，或 `DINGTALK_ALLOWED_USERS` 未包含您的 User ID。

**解决方法**：确认应用设置中启用了机器人能力并选择了 Stream Mode。检查您的 User ID 是否已在 `DINGTALK_ALLOWED_USERS` 中。重启网关。

### "dingtalk-stream not installed" 错误

**原因**：未安装 `dingtalk-stream` Python 包。

**解决方法**：安装该包：

```bash
pip install dingtalk-stream httpx
```

### "DINGTALK_CLIENT_ID and DINGTALK_CLIENT_SECRET required" 错误

**原因**：环境变量或 `.env` 文件中未正确设置凭据。

**解决方法**：确认 `~/.hermes/.env` 中正确设置了 `DINGTALK_CLIENT_ID`（AppKey）和 `DINGTALK_CLIENT_SECRET`（AppSecret）。

### 流断开 / 重连循环

**原因**：网络不稳定、钉钉平台维护或凭据问题。

**解决方法**：适配器会自动使用指数退避策略重连（2s → 5s → 10s → 30s → 60s）。请确保凭据有效且应用未被禁用。验证网络是否允许出站 WebSocket 连接。

### 机器人离线

**原因**：Hermes 网关未运行或连接失败。

**解决方法**：确认 `hermes gateway` 正在运行。查看终端输出中的错误信息。常见问题：凭据错误、应用被禁用、未安装 `dingtalk-stream` 或 `httpx`。

### "No session_webhook available"

**原因**：机器人尝试回复但缺少会话 webhook URL。通常发生在 webhook 过期或机器人在收到消息与发送回复之间重启时。

**解决方法**：向机器人发送新消息——每条收到的消息都会提供新的会话 webhook 用于回复。这是钉钉的正常限制；机器人只能回复最近收到的消息。

## 安全须知

:::warning
务必设置 `DINGTALK_ALLOWED_USERS` 来限制可交互的用户。默认情况下网关会拒绝所有用户以确保安全。仅添加您信任用户的 User ID——授权用户拥有完整的代理能力访问权限，包括工具使用和系统访问。
:::

有关保护 Hermes Agent 部署的更多信息，请参见 [安全指南](../security.md)。

## 备注

- **Stream Mode**：无需公网 URL、域名或 webhook 服务器。连接通过 WebSocket 从您的机器发起，因此在 NAT 和防火墙后仍可工作。
- **AI 卡片**：可选择性地使用富 AI 卡片而非纯 markdown 回复。通过 `card_template_id` 配置。
- **表情反应**：自动添加 🤔思考中/🥳已完成 反应以显示处理状态。
- **Markdown 回复**：回复采用钉钉支持的 markdown 格式以实现富文本显示。
- **媒体支持**：收到的图片和文件会被自动解析，可由视觉工具处理。
- **消息去重**：适配器使用 5 分钟窗口对消息进行去重，防止重复处理。
- **自动重连**：若流连接中断，适配器会自动使用指数退避策略重连。
- **消息长度限制**：每条回复最多 20,000 字符，超长部分将被截断。