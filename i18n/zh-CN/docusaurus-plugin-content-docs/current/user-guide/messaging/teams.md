---
sidebar_position: 5
title: "Microsoft Teams"
description: "将 Hermes 智能体设置为 Microsoft Teams 机器人"
---

# Microsoft Teams 设置

将 Hermes 智能体作为机器人连接到 Microsoft Teams。与 Slack 的 Socket 模式不同，Teams 通过调用 **公共 HTTPS Webhook** 来传递消息，因此您的实例需要一个可从公网访问的端点 —— 可以是开发隧道（本地开发）或真实域名（生产环境）。

需要从 Microsoft Graph 事件中获取会议摘要，而不是普通的机器人对话？请使用专用设置页面：[Teams 会议](/docs/user-guide/messaging/teams-meetings)。

## 机器人如何响应

| 上下文 | 行为 |
|---------|----------|
| **个人聊天（私信）** | 机器人会回复每条消息。无需 @提及。 |
| **群聊** | 机器人仅在 @提及 时回复。 |
| **频道** | 机器人仅在 @提及 时回复。 |

Teams 将 @提及 作为带有 `<at>机器人名称</at>` 标签的普通消息传递，Hermes 会在处理前自动剥离这些标签。

---

## 步骤 1：安装 Teams CLI

`@microsoft/teams.cli` 可自动完成机器人注册 —— 无需使用 Azure 门户。

```bash
npm install -g @microsoft/teams.cli@preview
teams login
```

要验证登录状态并查找您自己的 AAD 对象 ID（`TEAMS_ALLOWED_USERS` 所需）：

```bash
teams status --verbose
```

---

## 步骤 2：暴露 Webhook 端口

Teams 无法将消息传递到 `localhost`。对于本地开发，请使用任意隧道工具获取一个公共 HTTPS URL。默认端口为 `3978` —— 如有需要，可通过 `TEAMS_PORT` 更改。

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

从输出中复制 `https://` URL —— 您将在下一步中使用它。开发期间请保持隧道运行。

对于生产环境，请将机器人的端点指向您服务器的公共域名（参见 [生产环境部署](#production-deployment)）。

---

## 步骤 3：创建机器人

```bash
teams app create \
  --name "Hermes" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

CLI 会输出您的 `CLIENT_ID`、`CLIENT_SECRET` 和 `TENANT_ID`，以及步骤 6 的安装链接。请保存客户端密钥 —— 它不会再显示。

---

## 步骤 4：配置环境变量

添加到 `~/.hermes/.env`：

```bash
# 必需
TEAMS_CLIENT_ID=<your-client-id>
TEAMS_CLIENT_SECRET=<your-client-secret>
TEAMS_TENANT_ID=<your-tenant-id>

# 限制特定用户的访问权限（推荐）
# 使用来自 `teams status --verbose` 的 AAD 对象 ID
TEAMS_ALLOWED_USERS=<your-aad-object-id>
```

---

## 步骤 5：启动网关

```bash
HERMES_UID=$(id -u) HERMES_GID=$(id -g) docker compose up -d gateway
```

这将启动网关。默认 Webhook 端口为 `3978`（可通过 `TEAMS_PORT` 覆盖）。检查其是否正在运行：

```bash
curl http://localhost:3978/health   # 应返回：ok
docker logs -f hermes
```

查找以下内容：
```
[teams] Webhook server listening on 0.0.0.0:3978/api/messages
```

---

## 步骤 6：在 Teams 中安装应用

```bash
teams app get <teamsAppId> --install-link
```

在浏览器中打开打印出的链接 —— 它将直接在 Teams 客户端中打开。安装完成后，向您的机器人发送一条私信 —— 它已准备就绪。

---

## 配置参考

### 环境变量

| 变量 | 描述 |
|----------|-------------|
| `TEAMS_CLIENT_ID` | Azure AD 应用（客户端）ID |
| `TEAMS_CLIENT_SECRET` | Azure AD 客户端密钥 |
| `TEAMS_TENANT_ID` | Azure AD 租户 ID |
| `TEAMS_ALLOWED_USERS` | 允许使用机器人的逗号分隔的 AAD 对象 ID 列表 |
| `TEAMS_ALLOW_ALL_USERS` | 设为 `true` 以跳过允许列表并允许任何人使用 |
| `TEAMS_HOME_CHANNEL` | 用于定时/主动消息传递的对话 ID |
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

当智能体需要运行潜在危险命令时，它会发送一张包含四个按钮的自适应卡片，而不是要求您输入 `/approve`：

- **允许一次** —— 批准此特定命令
- **允许会话** —— 批准此模式在本会话剩余时间内有效
- **始终允许** —— 永久批准此模式
- **拒绝** —— 拒绝该命令

点击按钮将内联解决审批，并将卡片替换为决定结果。

### 会议摘要传递（Teams 会议管道）

当启用 [Teams 会议管道插件](/docs/user-guide/messaging/msgraph-webhook) 时，此适配器还处理会议摘要的外发传递 —— 一个 Teams 集成界面，而非两个。会议转录内容被总结后，撰写器会将摘要发布到您选择的 Teams 目标。

管道摘要传递在 `teams` 平台条目下与机器人配置一起配置：

```yaml
platforms:
  teams:
    enabled: true
    extra:
      # 现有机器人配置（client_id, client_secret, tenant_id, port）...

      # 会议摘要传递（仅在启用 teams_pipeline 插件时使用）
      delivery_mode: "graph"       # 或 "incoming_webhook"
      # 对于 delivery_mode: graph —— 选择以下之一：
      chat_id: "19:meeting_..."    # 发布到 Teams 聊天
      # team_id: "..."             # 或发布到频道
      # channel_id: "..."
      # access_token: "..."        # 可选；回退到 MSGRAPH_* 应用凭据
      # 对于 delivery_mode: incoming_webhook：
      # incoming_webhook_url: "https://outlook.office.com/webhook/..."
```

| 模式 | 使用场景 | 权衡 |
|------|----------|-----------|
| `incoming_webhook` | 使用静态 Teams 生成的 URL 简单“将摘要发布到此频道”。 | 无回复线程，无反应，显示为 Webhook 配置的标识。 |
| `graph` | 通过 Microsoft Graph 以机器人身份发布带线程的频道帖子或 1:1/群聊帖子。 | 需要 [Graph 应用注册](/docs/guides/microsoft-graph-app-registration)，并授予 `ChannelMessage.Send`（频道）或 `Chat.ReadWrite.All`（聊天）应用程序权限。 |

如果 **未** 启用 `teams_pipeline` 插件，这些设置无效 —— 它们仅在管道运行时绑定到 Graph Webhook 入口时才会生效。

---

## 生产环境部署

对于永久服务器，请跳过 devtunnel 并使用您服务器的公共 HTTPS 端点注册机器人：

```bash
teams app create \
  --name "Hermes" \
  --endpoint "https://your-domain.com/api/messages"
```

如果您已创建机器人，只需更新端点：

```bash
teams app update --id <teamsAppId> --endpoint "https://your-domain.com/api/messages"
```

确保您配置的端口（`TEAMS_PORT`，默认 `3978`）可从互联网访问，并且您的 TLS 证书有效 —— Teams 会拒绝自签名证书。

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| `health` 端点工作但机器人无响应 | 检查您的隧道是否仍在运行，且机器人的消息端点与隧道 URL 匹配 |
| 日志中出现 `KeyError: 'teams'` | 重启容器 —— 当前版本已修复此问题 |
| 机器人回复身份验证错误 | 验证 `TEAMS_CLIENT_ID`、`TEAMS_CLIENT_SECRET` 和 `TEAMS_TENANT_ID` 是否全部正确设置 |
| `No inference provider configured` | 检查 `ANTHROPIC_API_KEY`（或其他提供商密钥）是否在 `~/.hermes/.env` 中设置 |
| 机器人收到消息但忽略它们 | 您的 AAD 对象 ID 可能不在 `TEAMS_ALLOWED_USERS` 中。运行 `teams status --verbose` 查找它 |
| 隧道 URL 在重启时更改 | 如果使用命名隧道（`devtunnel create hermes-bot`），devtunnel URL 是持久的。ngrok 和 cloudflared 每次运行都会生成新 URL，除非您有付费计划 —— 更改时请使用 `teams app update` 更新机器人端点 |
| Teams 显示“此机器人无响应” | Webhook 返回了错误。检查 `docker logs hermes` 中的堆栈跟踪 |
| 日志中出现 `[teams] Failed to connect` | SDK 身份验证失败。请仔细检查您的凭据，并确保租户 ID 与您在 `teams login` 中使用的账户匹配 |

---

## 安全

:::warning
**始终设置 `TEAMS_ALLOWED_USERS`**，使用授权用户的 AAD 对象 ID。否则，任何能找到或安装您机器人的人都可以与其交互。

将 `TEAMS_CLIENT_SECRET` 视为密码 —— 定期通过 Azure 门户或 Teams CLI 轮换它。
:::

- 将凭据存储在权限为 `600` 的 `~/.hermes/.env` 中（`chmod 600 ~/.hermes/.env`）
- 机器人仅接受来自 `TEAMS_ALLOWED_USERS` 中用户的消息；未经授权的消息将被静默丢弃
- 您的公共端点（`/api/messages`）由 Teams 机器人框架进行身份验证 —— 没有有效 JWT 的请求将被拒绝

## 相关文档

- [Teams 会议](/docs/user-guide/messaging/teams-meetings)
- [操作 Teams 会议管道](/docs/guides/operate-teams-meeting-pipeline)