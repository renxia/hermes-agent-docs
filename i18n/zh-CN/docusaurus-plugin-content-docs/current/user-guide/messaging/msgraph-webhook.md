---
sidebar_position: 23
title: "Microsoft Graph Webhook 监听器"
description: "在 Hermes 中接收 Microsoft Graph 变更通知（会议、日历、聊天等）"
---

# Microsoft Graph Webhook 监听器

`msgraph_webhook` 网关平台是一个入站事件监听器。Hermes 通过它接收来自 Microsoft Graph 的**变更通知**——例如“一个 Teams 会议已结束”、“一条新消息到达此聊天”、“此日历事件已更新”。与 `teams` 平台（用户向其输入消息的聊天机器人）不同，此平台是 M365 主动告知 Hermes 某事已发生，而非用户主动触发。

目前主要的使用场景是 Teams 会议摘要流水线：当会议生成转录文本时，Graph 会通知该流水线，流水线获取转录文本后，Hermes 会将摘要发布回 Teams。其他 Graph 资源（如 `/chats/.../messages`、`/users/.../events`）也使用相同的监听器——不同的流水线消费者会通过各自的 PR 实现。

## 先决条件

- Microsoft Graph 应用程序凭据 — [注册 Microsoft Graph 应用程序](/docs/guides/microsoft-graph-app-registration)
- 一个 Microsoft Graph 可访问的**公共 HTTPS URL**（Graph 不会调用私有端点）。开发测试时可使用开发隧道；生产环境需要一个具有有效证书的真实域名。
- 一个强共享密钥，用作 `clientState` 值。使用 `openssl rand -hex 32` 生成，并将其放入 `~/.hermes/.env` 文件中，变量名为 `MSGRAPH_WEBHOOK_CLIENT_STATE`。

## 快速开始

`~/.hermes/config.yaml` 的最小配置：

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

或通过 `~/.hermes/.env` 中的环境变量（启动时自动合并）：

```bash
MSGRAPH_WEBHOOK_ENABLED=true
MSGRAPH_WEBHOOK_PORT=8646
MSGRAPH_WEBHOOK_CLIENT_STATE=<generate-with-openssl-rand-hex-32>
MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES=communications/onlineMeetings
```

启动网关：`hermes gateway run`。监听器暴露以下端点：

- `POST /msgraph/webhook` — 来自 Graph 的变更通知
- `GET /msgraph/webhook?validationToken=...` — Graph 订阅验证握手
- `GET /health` — 就绪性探测，包含接受/重复计数

将监听器公开暴露（通过反向代理、开发隧道或入口）。用于 Graph 订阅的通知 URL 是您的公共 HTTPS 源地址后跟 `/msgraph/webhook`：

```
https://ops.example.com/msgraph/webhook
```

## 配置

所有设置均位于 `platforms.msgraph_webhook.extra` 下：

| 设置项 | 默认值 | 说明 |
|---------|---------|-------------|
| `host` | `0.0.0.0` | HTTP 监听器的绑定地址。 |
| `port` | `8646` | 绑定端口。 |
| `webhook_path` | `/msgraph/webhook` | Graph 发送 POST 请求的 URL 路径。 |
| `health_path` | `/health` | 就绪性端点。 |
| `client_state` | — | 共享密钥，Graph 会在每个通知中原样返回。使用 `hmac.compare_digest` 进行比较 — 使用 `openssl rand -hex 32` 生成。 |
| `accepted_resources` | `[]`（接受所有） | Graph 资源路径/模式的允许列表。末尾的 `*` 表示前缀匹配。开头的 `/` 会被忽略。例如：`["communications/onlineMeetings", "chats/*/messages"]`。 |
| `max_seen_receipts` | `5000` | 通知 ID 的去重缓存大小。达到上限时，最旧的条目会被逐出。 |
| `allowed_source_cidrs` | `[]`（允许所有） | 可选的源 IP 允许列表。见下文。 |

每个设置项都有一个等效的环境变量（`MSGRAPH_WEBHOOK_*`），在网关启动时会合并到配置中 — 参见[环境变量参考](/docs/reference/environment-variables#microsoft-graph-teams-meetings)。

## 安全加固

### clientState 是主要身份验证检查

每个 Graph 通知都包含您注册订阅时使用的 `clientState` 字符串。监听器会拒绝任何 `clientState` 不匹配的通知，并使用时序安全的比较方式。这是 Microsoft 文档中描述的官方机制 — 请将该值视为强共享密钥。

如果未设置 `client_state`，监听器将接受所有格式正确的 POST 请求。**请勿在生产环境中无此配置运行。**

### 源 IP 允许列表（生产部署）

对于生产环境，请将监听器限制为 Microsoft 发布的 Graph Webhook 源 IP 范围。Microsoft 在 [Office 365 IP 地址和 URL Web 服务](https://learn.microsoft.com/zh-cn/microsoft-365/enterprise/urls-and-ip-address-ranges) 下记录了出口 IP 范围。配置方式如下：

```yaml
platforms:
  msgraph_webhook:
    enabled: true
    extra:
      client_state: "..."
      allowed_source_cidrs:
        - "52.96.0.0/14"
        - "52.104.0.0/14"
        # ...添加当前 Microsoft 365 “Common” + “Teams” 类别的出口范围
```

或作为环境变量：

```bash
MSGRAPH_WEBHOOK_ALLOWED_SOURCE_CIDRS="52.96.0.0/14,52.104.0.0/14"
```

空的允许列表 = 接受来自任何地址的请求（默认值；保留开发隧道工作流）。无效的 CIDR 字符串会记录警告并被忽略。**请每季度审查 Microsoft IP 列表** — 它会发生变化。

### HTTPS 终止

监听器使用纯 HTTP。请在反向代理（Caddy、Nginx、Cloudflare Tunnel、AWS ALB）处终止 TLS，并通过本地网络将请求代理到监听器。Graph 拒绝向非 HTTPS 端点发送数据，因此无法通过未加密流量从 Graph 本身到达您。

### 响应规范

成功时，监听器返回 `202 Accepted` 和一个空响应体 — 内部计数器不会出现在响应中。操作员可通过 `/health` 观察计数。

状态码表：

| 结果 | 状态码 |
|---------|--------|
| 通知被接受或已去重 | 202 |
| 验证握手（带有 `validationToken` 的 GET 请求） | 200（原样返回令牌） |
| 批次中每个项目的 clientState 均失败 | 403 |
| JSON 格式错误 / 缺少 `value` 数组 / 未知资源 | 400 |
| 源 IP 不在允许列表中 | 403 |
| 无 `validationToken` 的普通 GET 请求 | 400 |

## 故障排除

| 问题 | 检查项 |
|---------|---------------|
| Graph 订阅验证失败 | 公共 URL 是否可达，`/msgraph/webhook` 路径是否匹配，带有 `validationToken` 的 GET 请求是否在 10 秒内原样返回令牌（`text/plain` 格式）。 |
| 通知 POST 成功但未被摄取 | `client_state` 是否与您注册订阅时使用的值匹配。如果值已漂移，请重新运行 `openssl rand -hex 32` 并创建新订阅。检查 `accepted_resources` 是否包含 Graph 发送的资源路径。 |
| 所有通知均返回 403 | `clientState` 不匹配（伪造，或订阅注册时使用了不同的值）。使用 `hermes teams-pipeline subscribe --client-state "$MSGRAPH_WEBHOOK_CLIENT_STATE" ...` 重新创建订阅（随流水线运行时 PR 提供）。 |
| 监听器启动但 `curl http://localhost:8646/health` 挂起 | 端口绑定冲突。检查 `ss -tlnp \| grep 8646` 并根据需要更改 `port:`。 |
| 来自 Microsoft 的真实 Graph 请求被 403 拒绝 | 源 IP 允许列表过窄。暂时移除 `allowed_source_cidrs`，确认流量正常后，再扩大列表以包含当前的 Microsoft 出口范围。 |

## 相关文档

- [注册 Microsoft Graph 应用程序](/docs/guides/microsoft-graph-app-registration) — Azure 应用注册先决条件
- [环境变量 → Microsoft Graph](/docs/reference/environment-variables#microsoft-graph-teams-meetings) — 完整环境变量列表
- [Microsoft Teams 机器人设置](/docs/user-guide/messaging/teams) — 允许用户在 Teams 中与 Hermes 聊天的不同平台