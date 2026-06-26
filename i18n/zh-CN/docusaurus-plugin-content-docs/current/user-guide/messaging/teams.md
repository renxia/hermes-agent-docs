---
sidebar_position: 5
title: "Microsoft Teams"
description: "将 Hermes 智能体设置为 Microsoft Teams 机器人"
---

# Microsoft Teams 设置

将 Hermes 智能体连接到 Microsoft Teams，作为机器人使用。与 Slack 的 Socket Mode 不同，Teams 通过调用一个**公共 HTTPS webhook** 来传递消息，因此您的实例需要一个可公开访问的端点——要么是开发隧道（本地开发），要么是一个真实域名（生产环境）。

如果需要 Microsoft Graph 事件而不是普通机器人对话的会议摘要？请使用专用设置页面：[Teams 会议](/user-guide/messaging/teams-meetings)。

> 运行 `hermes gateway setup` 并选择**Microsoft Teams**以进行引导式操作。

## 机器人的响应方式

| 上下文 | 行为 |
|---------|----------|
| **私人聊天（DM）** | 机器人会回复每一条消息。无需 @提及。 |
| **群聊** | 只有在被 @提及时，机器人才会响应。 |
| **频道** | 只有在被 @提及时，机器人才会响应。 |

Teams 将 @提及作为带有 `<at>BotName</at>` 标签的常规消息传递给机器人，Hermes 会在处理之前自动剥离这些标签。

---

对于源代码或本地安装，请包含 Teams 扩展，以便捆绑的适配器可以导入 Microsoft Teams SDK：

```bash
uv sync --extra teams
# 或者，对于可编辑安装：
uv pip install -e ".[teams]"
```

## 第 1 步：安装 Teams CLI

`@microsoft/teams.cli` 会自动化机器人注册——无需 Azure portal。

```bash
npm install -g @microsoft/teams.cli@preview
teams login
```

要验证您的登录状态并找到自己的 AAD 对象 ID（用于 `TEAMS_ALLOWED_USERS`）：

```bash
teams status --verbose
```

---

## 第 2 步：暴露 Webhook 端口

Teams 无法将消息传递到 `localhost`。对于本地开发，请使用任何隧道工具来获取一个公共 HTTPS URL。默认端口是 `3978`——如果需要，可以使用 `TEAMS_PORT` 进行更改。

```bash
# devtunnel (Microsoft)
devtunnel create hermes-bot --allow-anonymous
devtunnel port create hermes-bot -p 3978 --protocol https  # 如果更改了端口，请将 3978 替换为 TEAMS_PORT
devtunnel host hermes-bot

# ngrok
ngrok http 3978  # 如果更改了端口，请将 3978 替换为 TEAMS_PORT

# cloudflared
cloudflared tunnel --url http://localhost:3978  # 如果更改了端口，请将 3978 替换为 TEAMS_PORT
```

从输出中复制 `https://` URL——您将在下一步中使用它。在开发过程中保持隧道运行。

对于生产环境，请将机器人的端点指向您的服务器公共域名（参见 [生产部署](#production-deployment)）。

---

## 第 3 步：创建机器人

```bash
teams app create \
  --name "Hermes" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

CLI 会输出您的 `CLIENT_ID`、`CLIENT_SECRET` 和 `TENANT_ID`，以及用于第 6 步的安装链接。请保存客户端密钥——它不会再次显示。

---

## 第 4 步：配置环境变量

添加到 `~/.hermes/.env`：

```bash
# 必需项
TEAMS_CLIENT_ID=<your-client-id>
TEAMS_CLIENT_SECRET=<your-client-secret>
TEAMS_TENANT_ID=<your-tenant-id>

# 限制特定用户的访问权限（推荐）
# 使用 `teams status --verbose` 中的 AAD 对象 ID
TEAMS_ALLOWED_USERS=<your-aad-object-id>
```

---

## 第 5 步：启动 Gateway

```bash
HERMES_UID=$(id -u) HERMES_GID=$(id -g) docker compose up -d gateway
```

这会启动网关。默认 Webhook 端口是 `3978`（可使用 `TEAMS_PORT` 覆盖）。检查它是否正在运行：

```bash
curl http://localhost:3978/health   # 应返回: ok
docker logs -f hermes
```

查找以下内容：
```
[teams] Webhook server listening on 0.0.0.0:3978/api/messages
```

---

## 第 6 步：在 Teams 中安装应用

```bash
teams app get <teamsAppId> --install-link
```

在浏览器中打开打印的链接——它将直接在 Teams 客户端中打开。安装后，向您的机器人发送一条私信——它就准备好了。

---

## 配置参考

### 环境变量

| 变量 | 描述 |
|----------|-------------|
| `TEAMS_CLIENT_ID` | Azure AD 应用（客户端）ID |
| `TEAMS_CLIENT_SECRET` | Azure AD 客户端密钥 |
| `TEAMS_TENANT_ID` | Azure AD 租户 ID |
| `TEAMS_ALLOWED_USERS` | 允许使用机器人的逗号分隔的 AAD 对象 ID |
| `TEAMS_ALLOW_ALL_USERS` | 设置为 `true` 以跳过白名单限制，允许任何人访问 |
| `TEAMS_HOME_CHANNEL` | 用于定时任务/主动消息传递的对话 ID |
| `TEAMS_HOME_CHANNEL_NAME` | 主频道的显示名称 |
| `TEAMS_PORT` | Webhook 端口（默认：`3978`） |

### config.yaml

或者，通过 `~/.hermes/config.yaml` 进行配置：

```yaml
platforms:
  teams:
    enabled: true
    extra:
      client_id: "your-client-id"
      client_secret: "your-secret"
      tenant_id: "your-tenant-id"
      port: 3978
```

---

## 功能特性

### 交互式审批卡片

当智能体需要执行一个潜在危险的命令时，它会发送一个包含四个按钮的适应性卡片，而不是要求您输入 `/approve`：

- **Allow Once** — 批准此特定命令
- **Allow Session** — 批准本次会话中的该模式
- **Always Allow** — 永久批准此模式
- **Deny** — 拒绝该命令

点击按钮将解决审批，并将卡片替换为决策。

### 会议摘要交付（Teams 会议管道）

当 [Teams 会议管道插件](/user-guide/messaging/msgraph-webhook) 被启用时，此适配器也负责会议摘要的出站交付——一个 Teams 集成表面，而不是两个。在会议记录被总结后，撰写者会将摘要发布到您选择的 Teams 目标中。

管道摘要交付配置在 `teams` 平台条目下，与机器人配置一起进行：

```yaml
platforms:
  teams:
    enabled: true
    extra:
      # 现有机器人配置（client_id, client_secret, tenant_id, port）...

      # 会议摘要交付（仅在启用了 teams_pipeline 插件时使用）
      delivery_mode: "graph"       # 或 "incoming_webhook"
      # 对于 delivery_mode: graph — 选择以下之一：
      chat_id: "19:meeting_..."    # 发布到 Teams 聊天中
      # team_id: "..."             # 或者发布到频道中
      # channel_id: "..."
      # access_token: "..."        # 可选；将回退到 MSGRAPH_* 应用凭据
      # 对于 delivery_mode: incoming_webhook:
      # incoming_webhook_url: "https://outlook.office.com/webhook/..."
```

| 模式 | 何时使用 | 权衡点 |
|------|----------|-----------|
| `incoming_webhook` | 使用静态 Teams 生成的 URL 进行简单的“将摘要发布到此频道中”。 | 不支持回复串，不支持反应（reactions），显示为 webhook 配置的身份。 |
| `graph` | 通过 Microsoft Graph 在机器人身份下进行线程化频道帖子或 1:1/群聊帖子。 | 需要使用具有 `ChannelMessage.Send` (频道) 或 `Chat.ReadWrite.All` (聊天) 应用权限的 [Graph 应用注册](/guides/microsoft-graph-app-registration)。 |

如果 `teams_pipeline` 插件**未**启用，这些设置是惰性的——只有当管道运行时绑定到 Graph webhook 入口时，它们才会生效。

---

## 生产部署

对于永久服务器，跳过 devtunnel 并使用您的服务器公共 HTTPS 端点注册机器人：

```bash
teams app create \
  --name "Hermes" \
  --endpoint "https://your-domain.com/api/messages"
```

如果您已经创建了机器人，只需要更新端点：

```bash
teams app update --id <teamsAppId> --endpoint "https://your-domain.com/api/messages"
```

请确保配置的端口（`TEAMS_PORT`，默认 `3978`）可以从互联网访问，并且您的 TLS 证书有效——Teams 会拒绝自签名证书。

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| `health` 端点正常但机器人不响应 | 检查隧道是否仍在运行，以及机器人的消息端点是否与隧道 URL 匹配 |
| 日志中出现 `KeyError: 'teams'` | 重启容器——这已在当前版本中修复 |
| 机器人以身份验证错误响应 | 验证 `TEAMS_CLIENT_ID`、`TEAMS_CLIENT_SECRET` 和 `TEAMS_TENANT_ID` 是否都设置正确 |
| `No inference provider configured` | 检查 `~/.hermes/.env` 中是否设置了 `ANTHROPIC_API_KEY`（或其他提供商密钥） |
| 机器人接收消息但忽略它们 | 您的 AAD 对象 ID 可能不在 `TEAMS_ALLOWED_USERS` 中。运行 `teams status --verbose` 以查找它 |
| 重启后隧道 URL 更改 | 如果您使用命名隧道（`devtunnel create hermes-bot`），则 devtunnel URL 是持久的。ngrok 和 cloudflared 在每次运行时都会生成一个新的 URL，除非您有付费计划——当 URL 更改时，请使用 `teams app update` 更新机器人端点 |
| Teams 显示“此机器人没有响应” | Webhook 返回了错误。检查 `docker logs hermes` 以获取回溯信息 |
| 日志中出现 `[teams] Failed to connect` | SDK 未能成功进行身份验证。请仔细检查您的凭据，并确保租户 ID 与您在 `teams login` 中使用的帐户匹配 |

---

## 安全性

:::warning
**始终设置 `TEAMS_ALLOWED_USERS`**，包含授权用户的 AAD 对象 ID。如果没有此项，任何人只要能找到或安装您的机器人就可以与之交互。

将 `TEAMS_CLIENT_SECRET` 视为密码——定期通过 Azure portal 或 Teams CLI 进行轮换。
:::

- 在 `~/.hermes/.env` 中以 `600` 权限（`chmod 600 ~/.hermes/.env`）存储凭据
- 机器人只接受 `TEAMS_ALLOWED_USERS` 中用户的消息；未经授权的消息将被静默丢弃
- 您的公共端点（`/api/messages`）由 Teams Bot Framework 进行身份验证——没有有效 JWT 的请求将被拒绝

## 相关文档

- [Teams 会议](/user-guide/messaging/teams-meetings)
- [操作 Teams 会议管道](/guides/operate-teams-meeting-pipeline)