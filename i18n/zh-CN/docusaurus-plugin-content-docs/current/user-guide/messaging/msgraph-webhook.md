---
sidebar_position: 23
title: "Microsoft Graph Webhook Listener"
description: "在 Hermes 中接收 Microsoft Graph 变更通知（会议、日历、聊天等）"
---

# Microsoft Graph Webhook Listener

`msgraph_webhook` 网关平台是一个入站事件监听器。它是 Hermes 接收来自 Microsoft Graph **变更通知** 的途径——"一个 Teams 会议结束了"、"一条新消息到达了此聊天"、"此日历事件已更新"。与 `teams` 平台（用户可向其输入消息的聊天机器人）不同——此平台是 M365 告知 Hermes 发生了某事，而非某个人。

目前主要的消费方是 Teams 会议摘要流水线：Graph 在会议生成转录时通知，流水线获取转录内容，然后 Hermes 将摘要发布回 Teams。其他 Graph 资源（`/chats/.../messages`、`/users/.../events`）使用相同的监听器——流水线消费方通过各自的 PR 来实现。

## 前置条件

- Microsoft Graph 应用程序凭据 — [注册 Microsoft Graph 应用程序](/guides/microsoft-graph-app-registration)
- 一个 Microsoft Graph 可访问的 **公共 HTTPS URL**（Graph 不会调用私有端点）。开发隧道可用于测试；生产环境需要具有有效证书的真实域名。
- 用作 `clientState` 值的强共享密钥。使用 `openssl rand -hex 32` 生成，并放入 `~/.hermes/.env` 作为 `MSGRAPH_WEBHOOK_CLIENT_STATE`。

## 快速开始

最小化 `~/.hermes/config.yaml`：

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

或通过 `~/.hermes/.env` 中的环境变量（启动时自动合并）：

```bash
MSGRAPH_WEBHOOK_ENABLED=true
MSGRAPH_WEBHOOK_PORT=8646
MSGRAPH_WEBHOOK_CLIENT_STATE=<generate-with-openssl-rand-hex-32>
MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES=communications/onlineMeetings
```

注意：绑定主机从 `config.yaml` 中的 `extra.host` 读取（参见上面的示例）；没有 `MSGRAPH_WEBHOOK_HOST` 环境变量覆盖。

启动网关：`hermes gateway run`。监听器暴露以下端点：

- `POST /msgraph/webhook` — 来自 Graph 的变更通知
- `GET /msgraph/webhook?validationToken=...` — Graph 订阅验证握手
- `GET /health` — 就绪探针，包含接受/重复计数器

公开暴露监听器（反向代理、开发隧道、入口）。Graph 订阅的通知 URL 是你的公共 HTTPS 源后跟 `/msgraph/webhook`：

```
https://ops.example.com/msgraph/webhook
```

## 配置

所有设置放在 `platforms.msgraph_webhook.extra` 下：

| 设置 | 默认值 | 说明 |
|---------|---------|-------------|
| `host` | `0.0.0.0` | HTTP 监听器的绑定地址。非回环绑定需要 `allowed_source_cidrs`；回环（`127.0.0.1` / `::1`）是最简单的开发隧道/反向代理配置。 |
| `port` | `8646` | 绑定端口。 |
| `webhook_path` | `/msgraph/webhook` | Graph POST 的 URL 路径。 |
| `health_path` | `/health` | 就绪端点。 |
| `client_state` | — | Graph 在每个通知中回显的共享密钥。使用 `hmac.compare_digest` 比较——使用 `openssl rand -hex 32` 生成。 |
| `accepted_resources` | `[]`（接受全部） | Graph 资源路径/模式的白名单。尾部 `*` 作为前缀匹配。容忍前导 `/`。示例：`["communications/onlineMeetings", "chats/*/messages"]`。 |
| `max_seen_receipts` | `5000` | 通知 ID 的去重缓存大小。达到上限时驱逐最旧的条目。 |
| `allowed_source_cidrs` | `[]` | 非回环绑定所必需。仅当监听器绑定在回环地址且由本地隧道/反向代理前置时才留空。 |

大多数设置也有等价的环境变量（`MSGRAPH_WEBHOOK_*`），在网关启动时合并到配置中（例外的是 `host`，仅通过配置设置——参见上面的注释）——参见[环境变量参考](/reference/environment-variables#microsoft-graph-teams-meetings)。

## 安全加固

### clientState 是主要身份验证检查

每个 Graph 通知都包含你的订阅注册时使用的 `clientState` 字符串。监听器使用定时安全比较拒绝任何 `clientState` 不匹配的通知。这是 Microsoft 文档中记录的机制——将该值视为强共享密钥。

如果未设置 `client_state`，监听器将拒绝启动。

### 源 IP 白名单（生产部署）

对于生产环境，将监听器限制在 Microsoft 发布的 Graph webhook 源 IP 范围内。Microsoft 在 [Office 365 IP 地址和 URL Web 服务](https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges)下记录了出口范围。配置如下：

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
        # ...添加当前 Microsoft 365 "Common" + "Teams" 类别的出口范围
```

或作为环境变量：

```bash
MSGRAPH_WEBHOOK_ALLOWED_SOURCE_CIDRS="52.96.0.0/14,52.104.0.0/14"
```

绑定非回环主机（如 `0.0.0.0`、`::` 或 LAN IP）但未设置 `allowed_source_cidrs` 将在启动时被拒绝。如果你使用开发隧道或同一台机器上的反向代理，将 Hermes 绑定到 `127.0.0.1` 或 `::`。

绑定非回环主机（如 `0.0.0.0`、`::` 或 LAN IP）但未设置 `allowed_source_cidrs` 将在启动时被拒绝。如果你使用开发隧道或同一台机器上的反向代理，将 Hermes 绑定到 `127.0.0.1` 或 `::1` 并在那里留空白名单。无效的 CIDR 字符串会记录警告并被忽略。**每季度审查 Microsoft IP 列表**——它会变化。

### HTTPS 终止

监听器使用纯 HTTP。在你的反向代理（Caddy、Nginx、Cloudflare Tunnel、AWS ALB）处终止 TLS，并通过本地网络代理到监听器。Graph 拒绝向非 HTTPS 端点传递，因此不存在来自 Graph 本身的未加密流量到达你的路径。

### 响应规范

成功时监听器返回 `202 Accepted` 且响应体为空——内部计数器不会出现在网络响应中。操作员可通过 `/health` 观察计数，该端点与 webhook 路径受相同的源 IP 规则保护。

状态码表：

| 结果 | 状态码 |
|---------|--------|
| 通知被接受或去重 | 202 |
| 验证握手（带 `validationToken` 的 GET） | 200（回显令牌） |
| 批量中所有项目的 clientState 验证失败 | 403 |
| 格式错误的 JSON / 缺少 `value` 数组 / 未知资源 | 400 |
| 源 IP 不在白名单中 | 403 |
| 不带 `validationToken` 的裸 GET | 400 |

## 故障排除

| 问题 | 检查事项 |
|---------|---------------|
| Graph 订阅验证失败 | 公共 URL 可访问，`/msgraph/webhook` 路径匹配，带 `validationToken` 的 GET 在 10 秒内逐字回显令牌为 `text/plain`。 |
| 通知 POST 但无内容消费 | `client_state` 与注册订阅时使用的值匹配。如果值漂移，重新运行 `openssl rand -hex 32` 并创建新订阅。检查 `accepted_resources` 是否包含 Graph 发送的资源路径。 |
| 每个通知都 403 | `clientState` 不匹配（伪造，或使用不同值注册的订阅）。使用 `hermes teams-pipeline subscribe --client-state "$MSGRAPH_WEBHOOK_CLIENT_STATE" ...` 重新创建订阅（随流水线运行时 PR 一起提供）。 |
| 监听器在 `0.0.0.0` 上拒绝启动 | 将 `allowed_source_cidrs` 设置为 Microsoft 当前的 webhook 出口范围，或将 Hermes 绑定到 `127.0.0.1` / `::1`，置于你的隧道或反向代理之后。 |
| 监听器启动但 `curl http://localhost:8646/health` 挂起 | 端口绑定冲突。检查 `ss -tlnp \| grep 8646` 并根据需要更改 `port:`。 |
| 来自 Microsoft 的真实 Graph 请求被 403 拒绝 | 源 IP 白名单过窄。扩大列表以包含当前的 Microsoft 出口范围。如果你仍在验证隧道路径，将 Hermes 绑定到回环地址，让隧道处理公共暴露。 |

## 相关文档

- [注册 Microsoft Graph 应用程序](/guides/microsoft-graph-app-registration) — Azure 应用程序注册前置条件
- [环境变量 → Microsoft Graph](/reference/environment-variables#microsoft-graph-teams-meetings) — 完整环境变量列表
- [Microsoft Teams 机器人设置](/user-guide/messaging/teams) — 允许用户在 Teams 中与 Hermes 聊天的不同平台