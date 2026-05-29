---
sidebar_position: 5
title: "Microsoft Teams"
description: "将 Hermes 智能体设置为 Microsoft Teams 机器人"
---

# Microsoft Teams 设置

将 Hermes 智能体连接到 Microsoft Teams 并作为机器人。与 Slack 的 Socket 模式不同，Teams 通过调用一个 **公共 HTTPS webhook** 来传递消息，因此您的实例需要一个可公开访问的端点——可以是开发隧道（本地开发）或一个真实的域名（生产环境）。

需要从 Microsoft Graph 事件获取会议摘要而不是普通的机器人对话？请使用专门的设置页面：[Teams 会议](/user-guide/messaging/teams-meetings)。

> 运行 `hermes gateway setup` 并选择 **Microsoft Teams** 以获取引导式设置流程。

## 机器人响应方式

| 上下文 | 行为 |
|---------|----------|
| **个人聊天（DM）** | 机器人会响应每一条消息。无需 @提及。 |
| **群聊** | 机器人仅在被 @提及时才会响应。 |
| **频道** | 机器人仅在被 @提及时才会响应。 |

Teams 会将 @提及作为带有 `<at>BotName</at>` 标签的普通消息传递，Hermes 会在处理前自动剥离这些标签。

---

## 步骤 1：安装 Teams CLI

`@microsoft/teams.cli` 可以自动完成机器人注册——无需使用 Azure 门户。

```bash
npm install -g @microsoft/teams.cli@preview
teams login
```

要验证登录状态并查找您自己的 AAD 对象 ID（`TEAMS_ALLOWED_USERS` 需要此信息）：

```bash
teams status --verbose
```

---

## 步骤 2：暴露 Webhook 端口

Teams 无法将消息发送到 `localhost`。对于本地开发，请使用任何隧道工具来获取一个公共的 HTTPS URL。默认端口是 `3978`——如果需要，可通过 `TEAMS_PORT` 更改。

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

从输出中复制 `https://` URL——您将在下一步中使用它。开发期间请保持隧道运行。

对于生产环境，请将机器人的端点指向您服务器的公共域名（请参阅[生产部署](#production-deployment)）。

---

## 步骤 3：创建机器人

```bash
teams app create \
  --name "Hermes" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

CLI 会输出您的 `CLIENT_ID`、`CLIENT_SECRET` 和 `TENANT_ID`，以及用于步骤 6 的安装链接。请保存客户端密钥——它不会再次显示。

---

## 步骤 4：配置环境变量

添加到 `~/.hermes/.env`：

```bash
# 必需项
TEAMS_CLIENT_ID=<your-client-id>
TEAMS_CLIENT_SECRET=<your-client-secret>
TEAMS_TENANT_ID=<your-tenant-id>

# 限制特定用户访问（推荐）
# 使用 `teams status --verbose` 获取的 AAD 对象 ID
TEAMS_ALLOWED_USERS=<your-aad-object-id>
```

---

## 步骤 5：启动网关

```bash
HERMES_UID=$(id -u) HERMES_GID=$(id -g) docker compose up -d gateway
```

这将启动网关。默认的 webhook 端口是 `3978`（可通过 `TEAMS_PORT` 覆盖）。检查其是否正在运行：

```bash
curl http://localhost:3978/health   # 应返回: ok
docker logs -f hermes
```

查找如下内容：
```
[teams] Webhook server listening on 0.0.0.0:3978/api/messages
```

---

## 步骤 6：在 Teams 中安装应用

```bash
teams app get <teamsAppId> --install-link
```

在浏览器中打开打印的链接——它会直接在 Teams 客户端中打开。安装后，向您的机器人发送一条私信——它已准备就绪。

---

## 配置参考

### 环境变量

| 变量 | 描述 |
|----------|-------------|
| `TEAMS_CLIENT_ID` | Azure AD 应用（客户端）ID |
| `TEAMS_CLIENT_SECRET` | Azure AD 客户端密钥 |
| `TEAMS_TENANT_ID` | Azure AD 租户 ID |
| `TEAMS_ALLOWED_USERS` | 允许使用机器人的 AAD 对象 ID（逗号分隔） |
| `TEAMS_ALLOW_ALL_USERS` | 设置为 `true` 以跳过允许列表，允许任何人使用 |
| `TEAMS_HOME_CHANNEL` | 用于定时/主动消息传递的会话 ID |
| `TEAMS_HOME_CHANNEL_NAME` | 主页频道的显示名称 |
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

## 功能

### 交互式审批卡片

当智能体需要运行一个潜在危险的命令时，它会发送一个带有四个按钮的自适应卡片，而不是要求您输入 `/approve`：

- **允许一次** —— 批准此特定命令
- **允许会话** —— 在本次会话剩余时间内批准此模式
- **始终允许** —— 永久批准此模式
- **拒绝** —— 拒绝该命令

单击按钮会内联解决审批并用决策替换该卡片。

### 会议摘要传递（Teams 会议流水线）

当 [Teams 会议流水线插件](/user-guide/messaging/msgraph-webhook) 启用时，此适配器也处理会议摘要的出站传递——一个 Teams 集成界面，而不是两个。会议记录被摘要后，写入器会将摘要发布到您选择的 Teams 目标。

流水线摘要传递在 `teams` 平台条目下与机器人配置一起进行配置：

```yaml
platforms:
  teams:
    enabled: true
    extra:
      # 现有的机器人配置 (client_id, client_secret, tenant_id, port) ...

      # 会议摘要传递（仅在 teams_pipeline 插件启用时使用）
      delivery_mode: "graph"       # 或 "incoming_webhook"
      # 对于 delivery_mode: graph —— 选择其中一个：
      chat_id: "19:meeting_..."    # 发布到 Teams 聊天中
      # team_id: "..."             # 或发布到频道中
      # channel_id: "..."
      # access_token: "..."        # 可选；如果未设置则回退到 MSGRAPH_* 应用凭据
      # 对于 delivery_mode: incoming_webhook:
      # incoming_webhook_url: "https://outlook.office.com/webhook/..."
```

| 模式 | 使用场景 | 权衡 |
|------|----------|-----------|
| `incoming_webhook` | 使用 Teams 生成的静态 URL 简单地“将摘要发布到此频道”。 | 无线程回复、无反应、显示为 webhook 配置的身份。 |
| `graph` | 通过 Microsoft Graph 以机器人身份发布带线程的频道帖子或 1:1/群聊消息。 | 需要 [Graph 应用注册](/guides/microsoft-graph-app-registration)，并具有 `ChannelMessage.Send`（频道）或 `Chat.ReadWrite.All`（聊天）的应用程序权限。 |

如果 `teams_pipeline` 插件**未**启用，这些设置将不起作用——它们仅在流水线运行时绑定到 Graph webhook 入口时才生效。

---

## 生产部署

对于永久服务器，请跳过开发隧道，并使用您服务器的公共 HTTPS 端点注册机器人：

```bash
teams app create \
  --name "Hermes" \
  --endpoint "https://your-domain.com/api/messages"
```

如果您已经创建了机器人，只需更新端点：

```bash
teams app update --id <teamsAppId> --endpoint "https://your-domain.com/api/messages"
```

确保您配置的端口（`TEAMS_PORT`，默认为 `3978`）可以从互联网访问，并且您的 TLS 证书有效——Teams 会拒绝自签名证书。

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| `health` 端点正常工作但机器人不响应 | 检查您的隧道是否仍在运行，并且机器人的消息传递端点与隧道 URL 匹配 |
| 日志中出现 `KeyError: 'teams'` | 重启容器——此问题在当前版本中已修复 |
| 机器人响应认证错误 | 验证 `TEAMS_CLIENT_ID`、`TEAMS_CLIENT_SECRET` 和 `TEAMS_TENANT_ID` 是否都设置正确 |
| `No inference provider configured` | 检查 `~/.hermes/.env` 中是否设置了 `ANTHROPIC_API_KEY`（或其他提供商密钥） |
| 机器人收到消息但忽略它们 | 您的 AAD 对象 ID 可能不在 `TEAMS_ALLOWED_USERS` 中。运行 `teams status --verbose` 来查找它 |
| 隧道 URL 在重启后更改 | 如果使用命名隧道（`devtunnel create hermes-bot`），devtunnel URL 是持久的。ngrok 和 cloudflared 每次运行都会生成一个新的 URL，除非您有付费计划——当 URL 更改时，使用 `teams app update` 更新机器人端点 |
| Teams 显示“此机器人无响应” | Webhook 返回了错误。检查 `docker logs hermes` 以查看追溯信息 |
| 日志中出现 `[teams] Failed to connect` | SDK 认证失败。请仔细检查您的凭据以及租户 ID 是否与您在 `teams login` 中使用的帐户匹配 |

---

## 安全性

:::warning
**务必设置 `TEAMS_ALLOWED_USERS`**，填入授权用户的 AAD 对象 ID。如果没有此设置，任何能找到或安装您机器人都可以与之交互。

将 `TEAMS_CLIENT_SECRET` 视为密码——定期通过 Azure 门户或 Teams CLI 轮换它。
:::

- 将凭据存储在 `~/.hermes/.env` 中，权限设置为 `600`（`chmod 600 ~/.hermes/.env`）
- 机器人仅接受来自 `TEAMS_ALLOWED_USERS` 中用户的消息；未授权的消息会被静默丢弃
- 您的公共端点（`/api/messages`）由 Teams 机器人框架进行身份验证——没有有效 JWT 的请求将被拒绝

## 相关文档

- [Teams 会议](/user-guide/messaging/teams-meetings)
- [操作 Teams 会议流水线](/guides/operate-teams-meeting-pipeline)