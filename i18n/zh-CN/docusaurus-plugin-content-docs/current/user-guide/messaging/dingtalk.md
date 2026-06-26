---
sidebar_position: 10
title: "DingTalk"
description: "Set up Hermes Agent as a DingTalk chatbot"
---

# DingTalk 设置

Hermes 智能体以聊天机器人的形式与钉钉集成，让你可以通过私信或群聊与 AI 助手进行对话。该机器人通过钉钉的 Stream 模式（一种长连接 WebSocket，无需公网 URL 或 Webhook 服务器）进行连接，并通过钉钉的会话 Webhook API 以 Markdown 格式回复消息。

在设置之前，以下是大多数人最关心的问题：Hermes 加入钉钉工作区后会如何表现。

## Hermes 的行为方式

| 场景 | 行为 |
|---------|----------|
| **私信（1:1 聊天）** | Hermes 回复每一条消息。无需 @提及。每个私信都有独立的会话。 |
| **群聊** | Hermes 在被 @提及 时回复。如果没有 @提及，Hermes 会忽略该消息。 |
| **多人共享群聊** | 默认情况下，Hermes 在群聊中按用户隔离会话历史。同一群聊中的两个人不会共享对话记录，除非你显式禁用该功能。 |

### 钉钉中的会话模型

默认情况下：

- 每个私信获得独立的会话
- 共享群聊中的每个用户在该群内获得独立的会话

这由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当你明确希望整个群共享一个对话时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

本指南将带你完成完整的设置流程——从创建钉钉机器人到发送第一条消息。

## 前置条件

安装所需的 Python 包：

```bash
cd ~/.hermes/hermes-agent && uv pip install -e ".[dingtalk]"
```

或者分别安装：

```bash
pip install dingtalk-stream httpx alibabacloud-dingtalk
```

- `dingtalk-stream` — 钉钉官方的 Stream 模式 SDK（基于 WebSocket 的实时消息）
- `httpx` — 用于通过会话 Webhook 发送回复的异步 HTTP 客户端
- `alibabacloud-dingtalk` — 钉钉 OpenAPI SDK，用于 AI 卡片、表情回复和媒体下载

## 第 1 步：创建钉钉应用

1. 进入[钉钉开放平台](https://open-dev.dingtalk.com/)。
2. 使用钉钉管理员账号登录。
3. 点击 **应用开发** → **企业内部应用** → **通过 H5 微应用创建应用**（或根据控制台版本选择 **机器人**）。
4. 填写：
   - **应用名称**：例如 `Hermes Agent`
   - **描述**：可选
5. 创建后，进入 **凭证与基础信息** 页面，找到你的 **Client ID**（AppKey）和 **Client Secret**（AppSecret）。将两者复制。

:::warning[凭证仅显示一次]
Client Secret 仅在创建应用时显示一次。如果丢失，你需要重新生成。切勿公开分享这些凭证或将其提交到 Git。
:::

## 第 2 步：启用机器人能力

1. 在应用设置页面，进入 **添加应用能力** → **机器人**。
2. 启用机器人能力。
3. 在 **消息接收模式** 下，选择 **Stream 模式**（推荐——无需公网 URL）。

:::tip
Stream 模式是推荐的设置方式。它使用从你的机器发起的长连接 WebSocket，因此不需要公网 IP、域名或 Webhook 端点。适用于 NAT、防火墙和本地机器。
:::

## 第 3 步：查找你的钉钉用户 ID

Hermes 智能体使用你的钉钉用户 ID 来控制谁可以与机器人交互。钉钉用户 ID 是由你组织的管理员设置的字母数字字符串。

查找方法：

1. 询问你的钉钉组织管理员——用户 ID 在钉钉管理后台的 **通讯录** → **成员** 中配置。
2. 或者，机器人会记录每条传入消息的 `sender_id`。启动网关，给机器人发一条消息，然后在日志中查找你的 ID。

## 第 4 步：配置 Hermes 智能体

### 选项 A：交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

提示时选择 **DingTalk**。设置向导可以通过以下两种路径之一进行授权：

- **二维码设备流程（推荐）**。使用钉钉手机应用扫描终端中打印的二维码——你的 Client ID 和 Client Secret 会自动返回并写入 `~/.hermes/.env`。无需访问开发者控制台。
- **手动粘贴**。如果你已有凭证（或不方便扫描二维码），在提示时粘贴你的 Client ID、Client Secret 和允许的用户 ID。

:::note openClaw 品牌披露
由于钉钉的 `verification_uri_complete` 在 API 层硬编码为 openClaw 身份，QR 码目前以 `openClaw` 来源字符串进行授权，直到阿里巴巴 / DingTalk-Real-AI 注册了 Hermes 专用的模板服务器端。这仅是钉钉展示授权屏幕的方式——你创建的机器人完全归你所有，且为你的租户私有。
:::

### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env` 文件中：

```bash
# 必需
DINGTALK_CLIENT_ID=your-app-key
DINGTALK_CLIENT_SECRET=your-app-secret

# 安全：限制谁可以与机器人交互
DINGTALK_ALLOWED_USERS=user-id-1

# 多个允许的用户（逗号分隔）
# DINGTALK_ALLOWED_USERS=user-id-1,user-id-2

# 可选：群聊门控（与 Slack/Telegram/Discord/WhatsApp 保持一致）
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
        # 在群聊中要求 @提及 机器人才回复（与 Slack/Telegram/Discord 保持一致）。
        # 私信忽略此设置——机器人始终在 1:1 聊天中回复。
        require_mention: true

        # 按平台允许列表。设置后，只有这些钉钉用户 ID 可以与机器人交互
        # （与 DINGTALK_ALLOWED_USERS 语义相同，但作用域在此处而非 .env）。
        allowed_users:
          - user-id-1
          - user-id-2
```

- `group_sessions_per_user: true` 在共享群聊中保持每个参与者的上下文隔离
- `require_mention: true` 防止机器人回复群聊中的每条消息——只有当有人 @提及 时才回复
- `dingtalk.extra` 下的 `allowed_users` 是 `DINGTALK_ALLOWED_USERS` 的替代方案；如果两者都设置，则合并

### 启动网关

配置完成后，启动钉钉网关：

```bash
hermes gateway
```

机器人应在几秒内连接到钉钉的 Stream 模式。给它发送一条消息——私信或在已加入的群聊中——进行测试。

:::tip
你可以在后台运行 `hermes gateway` 或将其作为 systemd 服务运行以持久运行。详情请参阅部署文档。
:::

## 功能

### AI 卡片

Hermes 可以使用钉钉 AI 卡片而非纯 Markdown 消息进行回复。卡片提供更丰富、更有结构化的显示效果，并支持在智能体生成响应时进行流式更新。

要启用 AI 卡片，在 `config.yaml` 中配置卡片模板 ID：

```yaml
platforms:
  dingtalk:
    enabled: true
    extra:
      card_template_id: "your-card-template-id"
```

你可以在钉钉开放平台中应用的 AI 卡片设置下找到卡片模板 ID。启用 AI 卡片后，所有回复都以卡片形式发送，支持文本流式更新。

### 表情回复

Hermes 会自动为你的消息添加表情回复以显示处理状态：

- 🤔思考中 — 机器人开始处理你的消息时添加
- 🥳完成 — 响应完成时添加（替换思考中回复）

这些表情回复在私信和群聊中均可使用。

### 显示设置

你可以独立于其他平台自定义钉钉的显示行为：

```yaml
display:
  platforms:
    dingtalk:
      show_reasoning: false   # 在回复中显示模型推理/思考过程
      streaming: true         # 启用流式响应（与 AI 卡片配合使用）
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

**原因**：机器人能力未启用，或 `DINGTALK_ALLOWED_USERS` 中不包含你的用户 ID。

**修复**：确认在应用设置中已启用机器人能力并选择了 Stream 模式。检查你的用户 ID 是否在 `DINGTALK_ALLOWED_USERS` 中。重启网关。

### "dingtalk-stream not installed" 错误

**原因**：未安装 `dingtalk-stream` Python 包。

**修复**：安装它：

```bash
pip install dingtalk-stream httpx
```

### "DINGTALK_CLIENT_ID and DINGTALK_CLIENT_SECRET required"

**原因**：凭证未在环境或 `.env` 文件中设置。

**修复**：确认 `DINGTALK_CLIENT_ID` 和 `DINGTALK_CLIENT_SECRET` 在 `~/.hermes/.env` 中正确设置。Client ID 是你的 AppKey，Client Secret 是钉钉开放平台中的 AppSecret。

### 流断开 / 重连循环

**原因**：网络不稳定、钉钉平台维护或凭证问题。

**修复**：适配器会自动以指数退避（2s → 5s → 10s → 30s → 60s）重新连接。确认你的凭证有效且应用未被停用。验证你的网络允许出站 WebSocket 连接。

### 机器人离线

**原因**：Hermes 网关未运行，或连接失败。

**修复**：检查 `hermes gateway` 是否正在运行。查看终端输出中的错误信息。常见问题：凭证错误、应用已停用、`dingtalk-stream` 或 `httpx` 未安装。

### "No session_webhook available"

**原因**：机器人尝试回复但没有会话 Webhook URL。这通常发生在 Webhook 过期或机器人在接收消息和发送回复之间重启的情况下。

**修复**：向机器人发送一条新消息——每条传入消息都会为回复提供新的会话 Webhook。这是钉钉的正常限制；机器人只能回复最近收到的消息。

## 安全

:::warning
始终设置 `DINGTALK_ALLOWED_USERS` 以限制谁可以与机器人交互。未设置时，网关默认拒绝所有用户作为安全措施。仅添加你信任的人员的用户 ID——授权用户拥有对智能体功能的完全访问权限，包括工具使用和系统访问。
:::

有关保护 Hermes 智能体部署的更多信息，请参阅[安全指南](../security.md)。

## 注意事项

- **Stream 模式**：无需公网 URL、域名或 Webhook 服务器。连接通过 WebSocket 从你的机器发起，因此可在 NAT 和防火墙后正常工作。
- **AI 卡片**：可选择以丰富的 AI 卡片而非纯 Markdown 回复。通过 `card_template_id` 配置。
- **表情回复**：自动 🤔思考中/🥳完成 表情回复，用于显示处理状态。
- **Markdown 回复**：回复以钉钉的 Markdown 格式排版，支持富文本显示。
- **媒体支持**：传入消息中的图片和文件会自动解析，并可由视觉工具处理。
- **消息去重**：适配器以 5 分钟窗口对消息进行去重，防止重复处理同一条消息。
- **自动重连**：如果流连接断开，适配器会自动以指数退避重新连接。
- **消息长度限制**：每条回复最多 20,000 个字符。更长的回复会被截断。