---
sidebar_position: 13
title: "Webhooks"
description: "接收来自 GitHub、GitLab 和其他服务的事件，以触发 Hermes 智能体运行"
---

# Webhooks

接收来自外部服务（GitHub、GitLab、JIRA、Stripe 等）的事件，并自动触发 Hermes 智能体运行。Webhook 适配器运行一个 HTTP 服务器，该服务器接受 POST 请求，验证 HMAC 签名，将有效负载转换为智能体提示，并将响应路由回源或另一个配置的平台。

智能体处理事件后，可以通过在 PR 上发布评论、向 Telegram/Discord 发送消息或记录结果来进行响应。

## 视频教程

<div style={{position: 'relative', width: '100%', aspectRatio: '16 / 9', marginBottom: '1.5rem'}}>
  <iframe
    src="https://www.youtube.com/embed/WNYe5mD4fY8"
    title="Hermes 智能体 — Webhooks 教程"
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0}}
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

---

## 快速入门

1. 通过 `hermes gateway setup` 或环境变量启用
2. 在 `config.yaml` 中定义路由，**或** 使用 `hermes webhook subscribe` 动态创建路由
3. 将您的服务指向 `http://your-server:8644/webhooks/<route-name>`

---

## 设置

启用 Webhook 适配器有两种方式。

### 通过设置向导

```bash
hermes gateway setup
```

按照提示启用 Webhook、设置端口并设置全局 HMAC 密钥。

### 通过环境变量

添加到 `~/.hermes/.env`：

```bash
WEBHOOK_ENABLED=true
WEBHOOK_PORT=8644        # 默认值
WEBHOOK_SECRET=your-global-secret
```

### 验证服务器

网关运行后：

```bash
curl http://localhost:8644/health
```

预期响应：

```json
{"status": "ok", "platform": "webhook"}
```

---

## 配置路由 {#configuring-routes}

路由定义了如何处理不同的 Webhook 源。每个路由都是 `config.yaml` 中 `platforms.webhook.extra.routes` 下的一个命名条目。

### 路由属性

| 属性 | 必填 | 描述 |
|----------|----------|-------------|
| `events` | 否 | 要接受的事件类型列表（例如 `["pull_request"]`）。如果为空，则接受所有事件。事件类型从 `X-GitHub-Event`、`X-GitLab-Event` 或 payload 中的 `event_type` 读取。 |
| `secret` | **是** | 用于签名验证的 HMAC 密钥。如果路由上未设置，则回退到全局 `secret`。仅用于测试时可设置为 `"INSECURE_NO_AUTH"`（跳过验证）。 |
| `prompt` | 否 | 使用点符号访问 payload 的模板字符串（例如 `{pull_request.title}`）。如果省略，则将完整的 JSON payload 转储到提示中。 |
| `skills` | 否 | 要为智能体运行加载的技能名称列表。 |
| `deliver` | 否 | 发送响应的位置：`github_comment`、`telegram`、`discord`、`slack`、`signal`、`sms`、`whatsapp`、`matrix`、`mattermost`、`homeassistant`、`email`、`dingtalk`、`feishu`、`wecom`、`weixin`、`bluebubbles`、`qqbot` 或 `log`（默认）。 |
| `deliver_extra` | 否 | 额外的传递配置 — 键取决于 `deliver` 类型（例如 `repo`、`pr_number`、`chat_id`）。值支持与 `prompt` 相同的 `{dot.notation}` 模板。 |
| `deliver_only` | 否 | 如果为 `true`，则完全跳过智能体 — 渲染后的 `prompt` 模板将成为要发送的字面消息。零 LLM 成本，亚秒级传递。请参阅[直接传递模式](#direct-delivery-mode)了解使用场景。要求 `deliver` 是一个真实目标（不能是 `log`）。 |

### 完整示例

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      port: 8644
      secret: "global-fallback-secret"
      routes:
        github-pr:
          events: ["pull_request"]
          secret: "github-webhook-secret"
          prompt: |
            审查此拉取请求：
            仓库：{repository.full_name}
            PR #{number}：{pull_request.title}
            作者：{pull_request.user.login}
            URL：{pull_request.html_url}
            差异 URL：{pull_request.diff_url}
            操作：{action}
          skills: ["github-code-review"]
          deliver: "github_comment"
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{number}"
        deploy-notify:
          events: ["push"]
          secret: "deploy-secret"
          prompt: "新推送至 {repository.full_name} 分支 {ref}：{head_commit.message}"
          deliver: "telegram"
```

### 提示模板

提示使用点符号访问 Webhook payload 中的嵌套字段：

- `{pull_request.title}` 解析为 `payload["pull_request"]["title"]`
- `{repository.full_name}` 解析为 `payload["repository"]["full_name"]`
- `{__raw__}` — 特殊标记，将**整个 payload** 以缩进 JSON 格式转储（截断至 4000 个字符）。适用于监控警报或通用 Webhook，智能体需要完整上下文的情况。
- 缺失的键保留为字面字符串 `{key}`（无错误）
- 嵌套字典和列表会被 JSON 序列化并截断至 2000 个字符

您可以将 `{__raw__}` 与常规模板变量混合使用：

```yaml
prompt: "PR #{pull_request.number} 由 {pull_request.user.login} 提交：{__raw__}"
```

如果路由未配置 `prompt` 模板，则整个 payload 将以缩进 JSON 格式转储（截断至 4000 个字符）。

相同的点符号模板也适用于 `deliver_extra` 值。

### 论坛主题传递

当将 Webhook 响应传递到 Telegram 时，您可以通过在 `deliver_extra` 中包含 `message_thread_id`（或 `thread_id`）来定位特定论坛主题：

```yaml
webhooks:
  routes:
    alerts:
      events: ["alert"]
      prompt: "警报：{__raw__}"
      deliver: "telegram"
      deliver_extra:
        chat_id: "-1001234567890"
        message_thread_id: "42"
```

如果在 `deliver_extra` 中未提供 `chat_id`，则传递将回退到目标平台配置的主频道。

---

## GitHub PR 审查（逐步指南） {#github-pr-review}

此演练设置每次拉取请求的自动代码审查。

### 1. 在 GitHub 中创建 Webhook

1. 进入您的仓库 → **设置** → **Webhooks** → **添加 Webhook**
2. 将 **Payload URL** 设置为 `http://your-server:8644/webhooks/github-pr`
3. 将 **Content type** 设置为 `application/json`
4. 将 **Secret** 设置为与您的路由配置匹配（例如 `github-webhook-secret`）
5. 在 **Which events?** 下，选择 **Let me select individual events** 并勾选 **Pull requests**
6. 点击 **Add webhook**

### 2. 添加路由配置

将上述示例中的 `github-pr` 路由添加到您的 `~/.hermes/config.yaml`。

### 3. 确保 `gh` CLI 已通过身份验证

`github_comment` 传递类型使用 GitHub CLI 发布评论：

```bash
gh auth login
```

### 4. 测试

在仓库中打开一个拉取请求。Webhook 触发，Hermes 处理事件，并在 PR 上发布审查评论。

---

## GitLab Webhook 设置 {#gitlab-webhook-setup}

GitLab Webhook 的工作方式类似，但使用不同的身份验证机制。GitLab 将密钥作为普通 `X-Gitlab-Token` 头发送（精确字符串匹配，而非 HMAC）。

### 1. 在 GitLab 中创建 Webhook

1. 进入您的项目 → **设置** → **Webhooks**
2. 将 **URL** 设置为 `http://your-server:8644/webhooks/gitlab-mr`
3. 输入您的 **Secret token**
4. 选择 **Merge request events**（以及您想要的任何其他事件）
5. 点击 **Add webhook**

### 2. 添加路由配置

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      routes:
        gitlab-mr:
          events: ["merge_request"]
          secret: "your-gitlab-secret-token"
          prompt: |
            审查此合并请求：
            项目：{project.path_with_namespace}
            MR !{object_attributes.iid}：{object_attributes.title}
            作者：{object_attributes.last_commit.author.name}
            URL：{object_attributes.url}
            操作：{object_attributes.action}
          deliver: "log"
```

---

## 传递选项 {#delivery-options}

`deliver` 字段控制智能体处理 Webhook 事件后响应的发送位置。

| 传递类型 | 描述 |
|-------------|-------------|
| `log` | 将响应记录到网关日志输出。这是默认值，适用于测试。 |
| `github_comment` | 通过 `gh` CLI 将响应发布为 PR/议题评论。需要 `deliver_extra.repo` 和 `deliver_extra.pr_number`。必须在网关主机上安装并认证 `gh` CLI（`gh auth login`）。 |
| `telegram` | 将响应路由到 Telegram。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `discord` | 将响应路由到 Discord。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `slack` | 将响应路由到 Slack。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `signal` | 将响应路由到 Signal。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `sms` | 通过 Twilio 将响应路由到短信。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `whatsapp` | 将响应路由到 WhatsApp。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `matrix` | 将响应路由到 Matrix。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `mattermost` | 将响应路由到 Mattermost。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `homeassistant` | 将响应路由到 Home Assistant。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `email` | 将响应路由到电子邮件。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `dingtalk` | 将响应路由到钉钉。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `feishu` | 将响应路由到飞书/Lark。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `wecom` | 将响应路由到企业微信。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `weixin` | 将响应路由到微信。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `bluebubbles` | 将响应路由到 BlueBubbles（iMessage）。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |

对于跨平台传递，目标平台也必须在网关中启用并连接。如果在 `deliver_extra` 中未提供 `chat_id`，则响应将发送到该平台配置的主频道。

---

## 直接投递模式 {#direct-delivery-mode}

默认情况下，每个 webhook POST 都会触发一个智能体运行 —— 载荷成为提示词，智能体处理它，并将智能体的响应投递出去。每次事件都会消耗 LLM 令牌。

对于仅需**推送纯通知**（无需推理、无需智能体循环，只需投递消息）的使用场景，请在路由上设置 `deliver_only: true`。此时，渲染后的 `prompt` 模板将成为字面消息正文，适配器会直接将其投递到配置的目标。

### 何时使用直接投递

- **外部服务推送** —— Supabase/Firebase webhook 在数据库变更时触发 → 立即通过 Telegram 通知用户
- **监控告警** —— Datadog/Grafana 告警 webhook → 推送到 Discord 频道
- **智能体间通信** —— 智能体 A 通知智能体 B 的用户某个长时间运行的任务已完成
- **后台作业完成** —— Cron 作业完成 → 将结果发布到 Slack

优势：

- **零 LLM 令牌消耗** —— 智能体永远不会被调用
- **亚秒级投递** —— 单次适配器调用，无推理循环
- **与智能体模式相同的安全性** —— HMAC 认证、速率限制、幂等性以及正文大小限制均仍然生效
- **同步响应** —— POST 请求在投递成功时返回 `200 OK`，若目标拒绝则返回 `502`，因此上游服务可以智能地重试

### 示例：从 Supabase 推送至 Telegram

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      port: 8644
      secret: "global-secret"
      routes:
        antenna-matches:
          secret: "antenna-webhook-secret"
          deliver: "telegram"
          deliver_only: true
          prompt: "🎉 新匹配：{match.user_name} 与您匹配成功！"
          deliver_extra:
            chat_id: "{match.telegram_chat_id}"
```

您的 Supabase 边缘函数使用 HMAC-SHA256 对载荷签名，并 POST 到 `https://your-server:8644/webhooks/antenna-matches`。Webhook 适配器验证签名，从载荷中渲染模板，投递至 Telegram，并返回 `200 OK`。

### 示例：通过 CLI 动态订阅

```bash
hermes webhook subscribe antenna-matches \
  --deliver telegram \
  --deliver-chat-id "123456789" \
  --deliver-only \
  --prompt "🎉 新匹配：{match.user_name} 与您匹配成功！" \
  --description "Antenna 匹配通知"
```

### 响应码

| 状态码 | 含义 |
|--------|------|
| `200 OK` | 投递成功。正文：`{"status": "delivered", "route": "...", "target": "...", "delivery_id": "..."}` |
| `200 OK` (status=duplicate) | 在幂等性 TTL（1 小时）内出现重复的 `X-GitHub-Delivery` ID。不会重新投递。 |
| `401 Unauthorized` | HMAC 签名无效或缺失。 |
| `400 Bad Request` | JSON 正文格式错误。 |
| `404 Not Found` | 未知的路由名称。 |
| `413 Payload Too Large` | 正文超过 `max_body_bytes`。 |
| `429 Too Many Requests` | 路由速率限制超限。 |
| `502 Bad Gateway` | 目标适配器拒绝消息或抛出异常。错误会在服务端记录；响应正文为通用的 `Delivery failed`，以避免泄露适配器内部信息。 |

### 配置注意事项

- `deliver_only: true` 要求 `deliver` 必须是一个真实的目标。`deliver: log`（或省略 `deliver`）会在启动时被拒绝 —— 如果适配器发现配置错误的路由，它将拒绝启动。
- 在直接投递模式下，`skills` 字段会被忽略（因为没有智能体运行，也就无需注入技能）。
- 模板渲染使用与智能体模式相同的 `{dot.notation}` 语法，包括 `{__raw__}` 标记。
- 幂等性使用相同的 `X-GitHub-Delivery` / `X-Request-ID` 头部 —— 使用相同 ID 的重试会返回 `status=duplicate`，且**不会**重新投递。

---

## 动态订阅（CLI） {#dynamic-subscriptions}

除了 `config.yaml` 中的静态路由外，您还可以使用 `hermes webhook` CLI 命令动态创建 webhook 订阅。当智能体本身需要设置事件驱动触发器时，这特别有用。

### 创建订阅

```bash
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "新 Issue #{issue.number}：{issue.title}\n作者：{issue.user.login}\n\n{issue.body}" \
  --deliver telegram \
  --deliver-chat-id "-100123456789" \
  --description "整理新的 GitHub Issue"
```

这将返回 webhook URL 和一个自动生成的 HMAC 密钥。请配置您的服务向该 URL 发送 POST 请求。

### 列出订阅

```bash
hermes webhook list
```

### 删除订阅

```bash
hermes webhook remove github-issues
```

### 测试订阅

```bash
hermes webhook test github-issues
hermes webhook test github-issues --payload '{"issue": {"number": 42, "title": "Test"}}'
```

### 动态订阅的工作原理

- 订阅存储在 `~/.hermes/webhook_subscriptions.json` 中
- Webhook 适配器会在每次收到请求时热重载此文件（基于 mtime，开销可忽略）
- `config.yaml` 中的静态路由始终优先于同名的动态路由
- 动态订阅使用与静态路由相同的路由格式和功能（事件、提示模板、技能、投递）
- 无需重启网关 —— 订阅后立即生效

### 由智能体驱动的订阅

智能体可以通过终端工具，在 `webhook-subscriptions` 技能的引导下创建订阅。只需让智能体“为 GitHub Issue 设置一个 webhook”，它就会执行相应的 `hermes webhook subscribe` 命令。

---

## 安全性 {#security}

Webhook 适配器包含多层安全防护：

### HMAC 签名验证

适配器使用每种来源的适当方法来验证传入的 webhook 签名：

- **GitHub**：`X-Hub-Signature-256` 头部 —— 以 `sha256=` 为前缀的 HMAC-SHA256 十六进制摘要
- **GitLab**：`X-Gitlab-Token` 头部 —— 明文密钥字符串匹配
- **通用**：`X-Webhook-Signature` 头部 —— 原始 HMAC-SHA256 十六进制摘要

如果配置了密钥但未出现可识别的签名头部，请求将被拒绝。

### 密钥是必需的

每个路由都必须有一个密钥 —— 可以直接在路由上设置，也可以从全局 `secret` 继承。没有密钥的路由会导致适配器在启动时失败并报错。仅用于开发/测试时，您可以将密钥设置为 `"INSECURE_NO_AUTH"` 以完全跳过验证。

`INSECURE_NO_AUTH` 仅在网关绑定到环回主机（`127.0.0.1`、`localhost`、`::1`）时才被接受。如果将其与非环回绑定（如 `0.0.0.0` 或局域网 IP）结合使用，适配器将拒绝启动 —— 这可以防止意外在公共接口上暴露未经认证的端点。

### 速率限制

默认情况下，每个路由的速率限制为**每分钟 30 个请求**（固定窗口）。全局配置如下：

```yaml
platforms:
  webhook:
    extra:
      rate_limit: 60  # 每分钟请求数
```

超过限制的请求将收到 `429 Too Many Requests` 响应。

### 幂等性

投递 ID（来自 `X-GitHub-Delivery`、`X-Request-ID` 或时间戳回退）会被缓存 **1 小时**。重复投递（例如 webhook 重试）会被静默跳过并返回 `200` 响应，从而避免重复触发智能体运行。

### 正文大小限制

超过 **1 MB** 的载荷会在读取正文之前被拒绝。配置如下：

```yaml
platforms:
  webhook:
    extra:
      max_body_bytes: 2097152  # 2 MB
```

### 提示注入风险

:::warning
Webhook 载荷包含攻击者可控的数据 —— PR 标题、提交消息、Issue 描述等都可能包含恶意指令。当暴露在互联网上时，请在沙箱环境（Docker、VM）中运行网关。考虑使用 Docker 或 SSH 终端后端以实现隔离。
:::

---

## 故障排查 {#troubleshooting}

### Webhook 未到达

- 确认端口已暴露且可从 webhook 源访问
- 检查防火墙规则 —— 端口 `8644`（或您配置的端口）必须开放
- 确认 URL 路径匹配：`http://your-server:8644/webhooks/<route-name>`
- 使用 `/health` 端点确认服务器正在运行

### 签名验证失败

- 确保路由配置中的密钥与 webhook 源中配置的密钥完全一致
- 对于 GitHub，密钥基于 HMAC —— 检查 `X-Hub-Signature-256`
- 对于 GitLab，密钥是明文令牌匹配 —— 检查 `X-Gitlab-Token`
- 检查网关日志中的 `Invalid signature` 警告

### 事件被忽略

- 检查事件类型是否在路由的 `events` 列表中
- GitHub 事件使用如 `pull_request`、`push`、`issues` 等值（即 `X-GitHub-Event` 头部的值）
- GitLab 事件使用如 `merge_request`、`push` 等值（即 `X-GitLab-Event` 头部的值）
- 如果 `events` 为空或未设置，则接受所有事件

### 智能体无响应

- 在前台运行网关以查看日志：`hermes gateway run`
- 检查提示模板是否正确渲染
- 确认投递目标已配置并连接

### 重复响应

- 幂等性缓存应能防止此问题 —— 检查 webhook 源是否发送了投递 ID 头部（`X-GitHub-Delivery` 或 `X-Request-ID`）
- 投递 ID 会被缓存 1 小时

### `gh` CLI 错误（GitHub 评论投递）

- 在网关主机上运行 `gh auth login`
- 确保已认证的 GitHub 用户对仓库具有写入权限
- 确认 `gh` 已安装并在 PATH 中

---

## 环境变量 {#environment-variables}

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `WEBHOOK_ENABLED` | 启用 webhook 平台适配器 | `false` |
| `WEBHOOK_PORT` | 接收 webhook 的 HTTP 服务器端口 | `8644` |
| `WEBHOOK_SECRET` | 全局 HMAC 密钥（当路由未指定自身密钥时用作回退） | _（无）_ |