---
sidebar_position: 10
title: "钉钉"
description: "设置 Hermes Agent 为钉钉聊天机器人"
---

# 钉钉设置

Hermes Agent 集成了钉钉 (DingTalk) 作为聊天机器人，让您可以通过私聊或群聊与您的 AI 助手聊天。该机器人通过钉钉的流模式（Stream Mode）连接——这是一种无需公共 URL 或 Webhook 服务器的长期 WebSocket 连接——并通过钉钉的会话 Webhook API 使用 markdown 格式的消息进行回复。

在设置之前，这是大多数人想知道的部分：当 Hermes 进入您的钉钉工作区后，它会如何运行。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| **私聊 (1:1)** | Hermes 会回复每一条消息。无需 `@提及`。每条私聊都有独立的会话。 |
| **群聊** | 只有当您 `@提及` 它时，Hermes 才会回复。如果没有提及，Hermes 会忽略该消息。 |
| **包含多个用户的共享群组** | 默认情况下，Hermes 会在群组内为每个用户隔离会话历史记录。除非您明确禁用，否则群组中交谈的两个人不会共享同一份聊天记录。 |

### 钉钉中的会话模型

默认情况下：

- 每条私聊都有其独立的会话
- 共享群聊中的每个用户都在该群组内拥有自己的会话

这由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

只有当您明确希望整个群组共享一个对话记录时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

本指南将引导您完成完整的设置流程——从创建钉钉机器人到发送您的第一条消息。

## 先决条件

安装所需的 Python 包：

```bash
pip install dingtalk-stream httpx
```

- `dingtalk-stream` — 钉钉的官方 SDK，用于流模式（基于 WebSocket 的实时消息传递）
- `httpx` — 用于通过会话 Webhook 发送回复的异步 HTTP 客户端

## 步骤 1：创建钉钉应用

1. 访问 [钉钉开发者控制台](https://open-dev.dingtalk.com/)。
2. 使用您的钉钉管理员账号登录。
3. 点击 **应用开发** → **自定义应用** → **通过 H5 小程序创建应用**（或根据您的控制台版本选择 **机器人**）。
4. 填写以下信息：
   - **应用名称**: 例如 `Hermes Agent`
   - **描述**: 可选
5. 创建后，导航到 **凭证与基础信息** 查找您的 **客户端 ID** (AppKey) 和 **客户端密钥** (AppSecret)。复制两者。

:::warning[凭证仅显示一次]
客户端密钥在创建应用时只显示一次。如果您丢失了它，您需要重新生成。切勿公开分享这些凭证或将它们提交到 Git。
:::

## 步骤 2：启用机器人能力

1. 在您的应用设置页面，转到 **添加能力** → **机器人**。
2. 启用机器人能力。
3. 在 **消息接收模式** 下，选择 **流模式**（推荐——无需公共 URL）。

:::tip
流模式是推荐的设置。它使用从您的机器发起的长期 WebSocket 连接，因此您不需要公共 IP、域名或 Webhook 端点。这可以在 NAT、防火墙和本地机器后工作。
:::

## 步骤 3：查找您的钉钉用户 ID

Hermes Agent 使用您的钉钉用户 ID 来控制谁可以与机器人互动。钉钉用户 ID 是由您组织管理员设置的字母数字字符串。

查找方法：

1. 询问您的钉钉组织管理员——用户 ID 在钉钉管理员控制台的 **联系人** → **成员** 下配置。
2. 或者，机器人会在每条传入消息中记录 `sender_id`。启动网关，向机器人发送一条消息，然后检查日志以获取您的 ID。

## 步骤 4：配置 Hermes Agent

### 选项 A：交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

当提示时选择 **钉钉**，然后按照提示粘贴您的客户端 ID、客户端密钥和允许的用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# 必需
DINGTALK_CLIENT_ID=your-app-key
DINGTALK_CLIENT_SECRET=your-app-secret

# 安全：限制谁可以与机器人互动
DINGTALK_ALLOWED_USERS=user-id-1

# 多个允许用户（逗号分隔）
# DINGTALK_ALLOWED_USERS=user-id-1,user-id-2
```

在 `~/.hermes/config.yaml` 中的可选行为设置：

```yaml
group_sessions_per_user: true
```

- `group_sessions_per_user: true` 在共享群聊中保持每个参与者的上下文隔离

### 启动网关

配置完成后，启动钉钉网关：

```bash
hermes gateway
```

机器人应在几秒内连接到钉钉的流模式。发送一条消息——无论是私聊还是在已添加的群聊中——进行测试。

:::tip
您可以将 `hermes gateway` 作为后台进程或 systemd 服务运行，以实现持久运行。有关详细信息，请参阅部署文档。
:::

## 故障排除

### 机器人没有响应消息

**原因**: 机器人能力未启用，或 `DINGTALK_ALLOWED_USERS` 中不包含您的用户 ID。

**修复**: 验证应用设置中是否启用了机器人能力，并确认选择了流模式。检查您的用户 ID 是否包含在 `DINGTALK_ALLOWED_USERS` 中。重启网关。

### "dingtalk-stream not installed" 错误

**原因**: 未安装 `dingtalk-stream` Python 包。

**修复**: 安装它：

```bash
pip install dingtalk-stream httpx
```

### "DINGTALK_CLIENT_ID and DINGTALK_CLIENT_SECRET required"

**原因**: 凭证未在您的环境或 `.env` 文件中设置。

**修复**: 验证 `DINGTALK_CLIENT_ID` 和 `DINGTALK_CLIENT_SECRET` 是否已在 `~/.hermes/.env` 中正确设置。客户端 ID 是您的 AppKey，客户端密钥是您在钉钉开发者控制台中的 AppSecret。

### 流断开/重连循环

**原因**: 网络不稳定、钉钉平台维护或凭证问题。

**修复**: 适配器会自动使用指数退避（2秒 → 5秒 → 10秒 → 30秒 → 60秒）重新连接。请检查您的凭证是否有效，以及您的应用是否被停用。验证您的网络是否允许出站 WebSocket 连接。

### 机器人离线

**原因**: Hermes 网关未运行，或连接失败。

**修复**: 检查 `hermes gateway` 是否正在运行。查看终端输出中的错误消息。常见问题：凭证错误、应用停用、未安装 `dingtalk-stream` 或 `httpx`。

### "No session_webhook available"

**原因**: 机器人尝试回复但没有会话 Webhook URL。这通常发生在 Webhook 过期，或者在接收消息和发送回复之间重启了机器人。

**修复**: 向机器人发送一条新消息——每条传入消息都会提供用于回复的新会话 Webhook。这是一个正常的钉钉限制；机器人只能回复最近收到的消息。

## 安全性

:::warning
始终设置 `DINGTALK_ALLOWED_USERS` 以限制谁可以与机器人互动。如果没有设置，网关默认会拒绝所有用户作为安全措施。只添加您信任的人的 User ID——授权用户对代理的所有功能（包括工具使用和系统访问）都拥有完全访问权限。
:::

有关保护您的 Hermes Agent 部署的更多信息，请参阅 [安全指南](../security.md)。

## 备注

- **流模式**: 无需公共 URL、域名或 Webhook 服务器。连接通过 WebSocket 从您的机器发起，因此它可以在 NAT 和防火墙后工作。
- **Markdown 回复**: 回复使用钉钉的 markdown 格式进行富文本显示。
- **消息去重**: 适配器使用 5 分钟窗口对消息进行去重，以防止重复处理同一条消息。
- **自动重连**: 如果流连接中断，适配器会自动使用指数退避进行重连。
- **消息长度限制**: 每条消息的回复限制为 20,000 个字符。更长的回复将被截断。