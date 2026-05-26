---
sidebar_position: 23
title: "Microsoft Graph Webhook 监听器"
description: "在 Hermes 中接收 Microsoft Graph 变更通知（会议、日历、聊天等）"
---

# Microsoft Graph Webhook 监听器

`msgraph_webhook` 网关平台是一个入站事件监听器。它是 Hermes 接收来自 Microsoft Graph **变更通知**的方式——"一个 Teams 会议结束了"，"此聊天中有一条新消息"，"此日历事件已更新"。与 `teams` 平台（用户与之交互的聊天机器人）不同——这个是 M365 告诉 Hermes 发生了某些事情，而不是个人。

目前主要使用者是 Teams 会议摘要流程：当会议产生转录记录时 Graph 会发送通知，流程会获取该记录，然后 Hermes 将摘要发布回 Teams。其他 Graph 资源（`/chats/.../messages`、`/users/.../events`）使用相同的监听器——各流程消费者会通过他们自己的 PR 进行对接。

## 前置条件

- Microsoft Graph 应用凭据 — [注册 Microsoft Graph 应用](/guides/microsoft-graph-app-registration)
- 一个 Microsoft Graph 可以访问的**公共 HTTPS URL**（Graph 不会调用私有端点）。开发时可以使用开发隧道进行测试；生产环境需要拥有有效证书的真实域名。
- 一个强共享密钥，用作 `clientState` 的值。使用 `openssl rand -hex 32` 生成，并将其放入 `~/.hermes/.env` 文件中，变量名为 `MSGRAPH_WEBHOOK_CLIENT_STATE`。

## 快速开始

最简 `~/.hermes/config.yaml` 配置：

```yaml
platforms:
  msgraph_webhook:
    enabled: true
    extra:
      port: 8646
      client_state: "replace-with-a-strong-secret"
      accepted_resources:
        - "communications/onlineMeetings"
```

或者通过 `~/.hermes/.env` 文件中的环境变量设置（启动时自动合并）：

```bash
MSGRAPH_WEBHOOK_ENABLED=true
MSGRAPH_WEBHOOK_PORT=8646
MSGRAPH_WEBHOOK_CLIENT_STATE=<generate-with-openssl-rand-hex-32>
MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES=communications/onlineMeetings
```

启动网关：`hermes gateway run`。监听器暴露以下端点：

- `POST /msgraph/webhook` — 接收来自 Graph 的变更通知
- `GET /msgraph/webhook?validationToken=...` — Graph 订阅验证握手
- `GET /health` — 就绪探针，包含接受/重复计数器

将监听器公开暴露（通过反向代理、开发隧道、Ingress）。您为 Graph 订阅设置的通知 URL 是您的公共 HTTPS 源地址后接 `/msgraph/webhook`：

```
https://ops.example.com/msgraph/webhook
```

## 配置

所有设置均位于 `platforms.msgraph_webhook.extra` 下：

| 设置项 | 默认值 | 描述 |
|--------|--------|------|
| `host` | `0.0.0.0` | HTTP 监听器的绑定地址。 |
| `port` | `8646` | 绑定端口。 |
| `webhook_path` | `/msgraph/webhook` | Graph 发送 POST 请求的 URL 路径。 |
| `health_path` | `/health` | 就绪端点。 |
| `client_state` | — | Graph 在每条通知中回显的共享密钥。使用 `hmac.compare_digest` 进行比较——通过 `openssl rand -hex 32` 生成。 |
| `accepted_resources` | `[]` (接受所有) | Graph 资源路径/模式的允许列表。末尾的 `*` 作为前缀匹配。允许前导 `/`。例如：`["communications/onlineMeetings", "chats/*/messages"]`。 |
| `max_seen_receipts` | `5000` | 通知 ID 的去重缓存大小。达到上限时，最旧的条目将被清除。 |
| `allowed_source_cidrs` | `[]` (允许所有) | 可选的源 IP 允许列表。详见下文。 |

每个设置都有一个等效的环境变量（`MSGRAPH_WEBHOOK_*`），在网关启动时合并到配置中——详见[环境变量参考](/reference/environment-variables#microsoft-graph-teams-meetings)。

## 安全加固

### clientState 是主要的身份验证检查

每条 Graph 通知都包含您的订阅注册时使用的 `clientState` 字符串。监听器会拒绝任何 `clientState` 不匹配的通知，使用定时安全的比较方法。这是微软文档化的工作机制——请将该值视为强共享密钥。

如果 `client_state` 未设置，监听器将接受所有格式良好的 POST 请求。**在生产环境中请勿在没有它的情况下运行。**

### 源 IP 允许列表（生产部署）

对于生产环境，请将监听器限制在微软公布的 Graph Webhook 源 IP 范围内。微软在 [Office 365 IP 地址和 URL Web 服务](https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges) 中文档化了出口范围。将其配置为：

```yaml
platforms:
  msgraph_webhook:
    enabled: true
    extra:
      client_state: "..."
      allowed_source_cidrs:
        - "52.96.0.0/14"
        - "52.104.0.0/14"
        # ...添加当前 Microsoft 365 "Common" 和 "Teams" 类别的出口范围
```

或作为环境变量：

```bash
MSGRAPH_WEBHOOK_ALLOWED_SOURCE_CIDRS="52.96.0.0/14,52.104.0.0/14"
```

空的允许列表 = 接受来自任何地方的连接（默认；保留开发隧道工作流）。无效的 CIDR 字符串会记录警告并被忽略。**请每季度审查一次微软的 IP 列表**——它会发生变化。

### HTTPS 终止

监听器使用纯 HTTP 通信。在您的反向代理（Caddy, Nginx, Cloudflare Tunnel, AWS ALB）处终止 TLS，并通过本地网络代理到监听器。Graph 拒绝向非 HTTPS 端点发送通知，因此从 Graph 本身到您的通信路径不存在未加密流量。

### 响应卫生

成功时，监听器返回 `202 Accepted` 且响应体为空——内部计数器不会出现在网络响应中。运维人员可以通过 `/health` 观测计数。

状态码表：

| 结果 | 状态码 |
|------|--------|
| 通知被接受或去重 | 202 |
| 验证握手（带 `validationToken` 的 GET 请求） | 200 (回显令牌) |
| 批次中的每个项都因 clientState 失败 | 403 |
| JSON 格式错误 / 缺少 `value` 数组 / 未知资源 | 400 |
| 源 IP 不在允许列表中 | 403 |
| 不带 `validationToken` 的裸 GET 请求 | 400 |

## 故障排查

| 问题 | 检查项 |
|------|--------|
| Graph 订阅验证失败 | 公共 URL 是否可达，`/msgraph/webhook` 路径是否匹配，带 `validationToken` 的 GET 请求是否在 10 秒内以 `text/plain` 形式原样回显该令牌。 |
| 通知已 POST 但未被摄入 | `client_state` 是否与您注册订阅时使用的值匹配。如果值已更改，请重新运行 `openssl rand -hex 32` 并创建新订阅。检查 `accepted_resources` 是否包含 Graph 正在发送的资源路径。 |
| 每条通知都返回 403 | `clientState` 不匹配（伪造，或订阅使用了不同的值注册）。使用 `hermes teams-pipeline subscribe --client-state "$MSGRAPH_WEBHOOK_CLIENT_STATE" ...` 重新创建订阅（随流程运行时 PR 一起提供）。 |
| 监听器已启动，但 `curl http://localhost:8646/health` 挂起 | 端口绑定冲突。检查 `ss -tlnp \| grep 8646`，如果需要，请更改 `port:`。 |
| 来自微软的真实 Graph 请求被 403 拒绝 | 源 IP 允许列表范围过窄。暂时移除 `allowed_source_cidrs`，确认流量畅通，然后将列表扩大以包含当前的微软出口范围。 |

## 相关文档

- [注册 Microsoft Graph 应用](/guides/microsoft-graph-app-registration) — Azure 应用注册前置条件
- [环境变量 → Microsoft Graph](/reference/environment-variables#microsoft-graph-teams-meetings) — 完整的环境变量列表
- [Microsoft Teams 机器人设置](/user-guide/messaging/teams) — 允许用户在 Teams 中与 Hermes 聊天的不同平台