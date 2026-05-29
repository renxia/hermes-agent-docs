---
sidebar_position: 23
title: "Microsoft Graph Webhook 监听器"
description: "在 Hermes 中接收 Microsoft Graph 的更改通知（会议、日历、聊天等）"
---

# Microsoft Graph Webhook 监听器

`msgraph_webhook` 网关平台是一个入站事件监听器。Hermes 通过它来接收来自 Microsoft Graph 的**更改通知**——"一个 Teams 会议结束了"、"此聊天中有一条新消息"、"此日历事件已更新"。它不同于 `teams` 平台（用户与之聊天的机器人）——这是 M365 告知 Hermes 发生了某些事情，而不是人。

目前的主要使用者是 Teams 会议摘要流程：Graph 通知会议生成了记录稿，流程获取它，然后 Hermes 将摘要发布回 Teams。其他 Graph 资源（`/chats/.../messages`、`/users/.../events`）使用相同的监听器——流程使用者随着他们各自的 PR 推出。

## 前提条件

- Microsoft Graph 应用程序凭据 — [注册一个 Microsoft Graph 应用程序](/guides/microsoft-graph-app-registration)
- 一个 Microsoft Graph 可以访问的 **公共 HTTPS URL**（Graph 不调用私有端点）。开发隧道可用于测试；生产环境需要一个带有有效证书的真实域名。
- 一个强共享密钥，用作 `clientState` 值。使用 `openssl rand -hex 32` 生成，并将其放入 `~/.hermes/.env` 中作为 `MSGRAPH_WEBHOOK_CLIENT_STATE`。

## 快速开始

最小化的 `~/.hermes/config.yaml`：

```yaml
platforms:
  msgraph_webhook:
    enabled: true
    extra:
      host: 127.0.0.1
      port: 8646
      client_state: "replace-with-a-strong-secret"
      accepted_resources:
        - "communications/onlineMeetings"
```

或者通过 `~/.hermes/.env` 中的环境变量（启动时自动合并）：

```bash
MSGRAPH_WEBHOOK_ENABLED=true
MSGRAPH_WEBHOOK_PORT=8646
MSGRAPH_WEBHOOK_CLIENT_STATE=<generate-with-openssl-rand-hex-32>
MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES=communications/onlineMeetings
```

注意：绑定主机从 `config.yaml` 的 `extra.host` 读取（见上面的示例）；没有 `MSGRAPH_WEBHOOK_HOST` 环境变量覆盖。

启动网关：`hermes gateway run`。该监听器暴露：

- `POST /msgraph/webhook` — 来自 Graph 的更改通知
- `GET /msgraph/webhook?validationToken=...` — Graph 订阅验证握手
- `GET /health` — 就绪探针，包含接受/重复计数器

公开暴露该监听器（通过反向代理、开发隧道、入口控制器）。您用于 Graph 订阅的通知 URL 是您的公共 HTTPS 源后接 `/msgraph/webhook`：

```
https://ops.example.com/msgraph/webhook
```

## 配置

所有设置都位于 `platforms.msgraph_webhook.extra` 下：

| 设置 | 默认值 | 描述 |
|---------|---------|-------------|
| `host` | `0.0.0.0` | HTTP 监听器的绑定地址。非回环绑定需要 `allowed_source_cidrs`；回环 (`127.0.0.1` / `::1`) 是最简单的开发隧道/反向代理设置。 |
| `port` | `8646` | 绑定端口。 |
| `webhook_path` | `/msgraph/webhook` | Graph POST 请求的 URL 路径。 |
| `health_path` | `/health` | 就绪端点。 |
| `client_state` | — | Graph 在每个通知中回显的共享密钥。使用 `hmac.compare_digest` 进行比较——使用 `openssl rand -hex 32` 生成。 |
| `accepted_resources` | `[]`（接受所有） | Graph 资源路径/模式的允许列表。尾部的 `*` 作为前缀匹配。前导的 `/` 被容忍。示例：`["communications/onlineMeetings", "chats/*/messages"]`。 |
| `max_seen_receipts` | `5000` | 用于通知 ID 的去重缓存大小。达到上限时，最旧的条目将被逐出。 |
| `allowed_source_cidrs` | `[]` | 非回环绑定时必需。仅当监听器绑定到回环地址并位于本地隧道/反向代理前端时，才留空。 |

每个设置还有一个等效的环境变量 (`MSGRAPH_WEBHOOK_*`)，在网关启动时会合并到配置中——参见[环境变量参考](/reference/environment-variables#microsoft-graph-teams-meetings)。

## 安全加固

### clientState 是主要的身份验证检查

每个 Graph 通知都包含您的订阅注册时使用的 `clientState` 字符串。监听器会拒绝任何 `clientState` 不匹配的通知，使用时间安全的比较方式。这是 Microsoft 的文档机制——将该值视为强共享密钥。

如果 `client_state` 未设置，监听器将拒绝启动。

### 源 IP 允许列表（生产部署）

对于生产环境，请将监听器限制在 Microsoft 公布的 Graph webhook 源 IP 范围内。Microsoft 在 [Office 365 IP 地址和 URL Web 服务](https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges)下记录了出站范围。将它们配置为：

```yaml
platforms:
  msgraph_webhook:
    enabled: true
    extra:
      host: 0.0.0.0
      client_state: "..."
      allowed_source_cidrs:
        - "52.96.0.0/14"
        - "52.104.0.0/14"
        # ...添加当前的 Microsoft 365 "通用" + "Teams" 类别出站范围
```

或者作为环境变量：

```bash
MSGRAPH_WEBHOOK_ALLOWED_SOURCE_CIDRS="52.96.0.0/14,52.104.0.0/14"
```

在没有 `allowed_source_cidrs` 的情况下绑定非回环主机（如 `0.0.0.0`、`::` 或局域网 IP）会在启动时被拒绝。如果您在同一台机器上使用开发隧道或反向代理，请将 Hermes 绑定到 `127.0.0.1` 或 `::1`，并将允许列表留空。无效的 CIDR 字符串会记录警告并被忽略。**请每季度审查一次 Microsoft IP 列表**——它会变化。

### HTTPS 终止

监听器使用纯 HTTP 协议。在您的反向代理（Caddy、Nginx、Cloudflare Tunnel、AWS ALB）处终止 TLS，并通过本地网络将流量代理到监听器。Graph 拒绝向非 HTTPS 端点发送，因此没有路径让未加密的流量从 Graph 本身到达您这里。

### 响应卫生

成功时，监听器返回 `202 Accepted`，响应体为空——内部计数器不会出现在网络响应中。运维人员可以通过 `/health` 观察计数，该端点与 webhook 路径受相同的源 IP 规则保护。

状态码表：

| 结果 | 状态 |
|---------|--------|
| 通知被接受或去重 | 202 |
| 验证握手（带 `validationToken` 的 GET 请求） | 200（原样回显令牌） |
| 批次中的每个项目都未通过 clientState 检查 | 403 |
| 格式错误的 JSON / 缺少 `value` 数组 / 未知资源 | 400 |
| 源 IP 不在允许列表中 | 403 |
| 不带 `validationToken` 的裸 GET 请求 | 400 |

## 故障排查

| 问题 | 检查什么 |
|---------|---------------|
| Graph 订阅验证失败 | 公共 URL 可访问，`/msgraph/webhook` 路径匹配，带 `validationToken` 的 GET 请求在 10 秒内原样回显令牌，内容类型为 `text/plain`。 |
| 通知 POST 成功但未被摄取 | `client_state` 与您注册订阅时使用的值匹配。如果值发生漂移，请重新运行 `openssl rand -hex 32` 并创建一个新订阅。检查 `accepted_resources` 是否包含 Graph 发送的资源路径。 |
| 每个通知都返回 403 | `clientState` 不匹配（伪造，或订阅时使用了不同的值注册）。使用 `hermes teams-pipeline subscribe --client-state "$MSGRAPH_WEBHOOK_CLIENT_STATE" ...` 重新创建订阅（随流程运行时 PR 提供）。 |
| 监听器拒绝在 `0.0.0.0` 上启动 | 将 `allowed_source_cidrs` 设置为 Microsoft 当前的 webhook 出站范围，或者将 Hermes 绑定到 `127.0.0.1` / `::1`，置于您的隧道或反向代理之后。 |
| 监听器启动，但 `curl http://localhost:8646/health` 挂起 | 端口绑定冲突。使用 `ss -tlnp \| grep 8646` 检查，如果需要，更改 `port:`。 |
| 来自 Microsoft 的真实 Graph 请求被 403 拒绝 | 源 IP 允许列表范围太窄。扩大列表以包含当前的 Microsoft 出站范围。如果您仍在验证隧道路径，请将 Hermes 绑定到回环地址，让隧道处理公共暴露。 |

## 相关文档

- [注册一个 Microsoft Graph 应用程序](/guides/microsoft-graph-app-registration) — Azure 应用程序注册前提条件
- [环境变量 → Microsoft Graph](/reference/environment-variables#microsoft-graph-teams-meetings) — 完整的环境变量列表
- [Microsoft Teams 机器人设置](/user-guide/messaging/teams) — 允许用户在 Teams 中与 Hermes 聊天的不同平台