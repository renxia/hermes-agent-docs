---
sidebar_position: 13
title: "Webhooks"
description: "从 GitHub、GitLab 和其他服务接收事件以触发 Hermes 代理运行"
---

# Webhooks

从外部服务（如 GitHub、GitLab、JIRA、Stripe 等）接收事件，并自动触发 Hermes 代理运行。Webhook 适配器会运行一个 HTTP 服务器，接受 POST 请求，验证 HMAC 签名，将有效载荷转换为代理提示，并将响应路由回原始来源或另一个已配置的平台。

代理处理该事件后，可以通过在 PR 上发布评论、向 Telegram/Discord 发送消息或记录结果来做出响应。

---

## 快速开始

1. 通过 `hermes gateway setup` 或环境变量启用
2. 在 `config.yaml` 中**定义路由**，或使用 `hermes webhook subscribe` 动态创建
3. 将你的服务指向 `http://your-server:8644/webhooks/<route-name>`

---

## 设置

有两种方式可以启用 webhook 适配器。

### 通过设置向导

```bash
hermes gateway setup
```

按照提示启用 webhooks，设置端口和全局 HMAC 密钥。

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

路由定义如何处理不同的 webhook 来源。每个路由是 `config.yaml` 中 `platforms.webhook.extra.routes` 下的命名条目。

### 路由属性

| 属性 | 必需 | 描述 |
|----------|----------|-------------|
| `events` | 否 | 要接受的事件类型列表（例如 `["pull_request"]`）。如果为空，则接受所有事件。事件类型从 `X-GitHub-Event`、`X-GitLab-Event` 或载荷中的 `event_type` 读取。 |
| `secret` | **是** | 用于签名验证的 HMAC 密钥。如果未在路由上设置，则回退到全局 `secret`。仅用于测试时设置为 `"INSECURE_NO_AUTH"`（跳过验证）。 |
| `prompt` | 否 | 使用点符号访问载荷的模板字符串（例如 `{pull_request.title}`）。如果省略，则将完整的 JSON 载荷 dump 到提示中。 |
| `skills` | 否 | 加载到代理运行的技能名称列表。 |
| `deliver` | 否 | 响应发送的目标：`github_comment`、`telegram`、`discord`、`slack`、`signal`、`sms`、`whatsapp`、`matrix`、`mattermost`、`homeassistant`、`email`、`dingtalk`、`feishu`、`wecom`、`weixin`、`bluebubbles` 或 `qqbot`（默认 `log`）。 |
| `deliver_extra` | 否 | 额外的交付配置——键取决于 `deliver` 类型（例如 `repo`、`pr_number`、`chat_id`）。值支持与 `prompt` 相同的 `{dot.notation}` 模板。 |
| `deliver_only` | 否 | 如果为 `true`，则完全跳过代理——渲染后的 `prompt` 模板成为要传递的纯文本消息。零 LLM 成本，亚秒级交付。参见 [直接交付模式](#direct-delivery-mode) 的使用场景。要求 `deliver` 是一个真实目标（不能是 `log`）。 |

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
            Review this pull request:
            Repository: {repository.full_name}
            PR #{number}: {pull_request.title}
            Author: {pull_request.user.login}
            URL: {pull_request.html_url}
            Diff URL: {pull_request.diff_url}
            Action: {action}
          skills: ["github-code-review"]
          deliver: "github_comment"
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{number}"
        deploy-notify:
          events: ["push"]
          secret: "deploy-secret"
          prompt: "New push to {repository.full_name} branch {ref}: {head_commit.message}"
          deliver: "telegram"
```

### Prompt 模板

提示使用点符号访问 webhook 载荷中的嵌套字段：

- `{pull_request.title}` 解析为 `payload["pull_request"]["title"]`
- `{repository.full_name}` 解析为 `payload["repository"]["full_name"]`
- `{__raw__}` — 特殊标记，将**整个载荷**作为缩进 JSON dump（截断至 4000 字符）。适用于监控警报或通用 webhook，其中代理需要完整上下文。
- 缺失的键保留为字面量 `{key}` 字符串（不报错）
- 嵌套字典和列表被 JSON 序列化并在 2000 字符处截断

你可以混合使用 `{__raw__}` 和常规模板变量：

```yaml
prompt: "PR #{pull_request.number} by {pull_request.user.login}: {__raw__}"
```

如果没有为路由配置 `prompt` 模板，则整个载荷会被 dump 为缩进 JSON（截断至 4000 字符）。

相同的点符号模板也适用于 `deliver_extra` 值。

### 论坛主题交付

当将 webhook 响应交付给 Telegram 时，可以通过在 `deliver_extra` 中包含 `message_thread_id`（或 `thread_id`）来指定特定论坛主题：

```yaml
webhooks:
  routes:
    alerts:
      events: ["alert"]
      prompt: "Alert: {__raw__}"
      deliver: "telegram"
      deliver_extra:
        chat_id: "-1001234567890"
        message_thread_id: "42"
```

如果在 `deliver_extra` 中没有提供 `chat_id`，则交付会回退到目标平台配置的 home 频道。

---

## GitHub PR 审查（分步指南） {#github-pr-review}

本指南设置每次拉取请求时的自动代码审查。

### 1. 在 GitHub 中创建 webhook

1. 进入你的仓库 → **Settings** → **Webhooks** → **Add webhook**
2. 设置 **Payload URL** 为 `http://your-server:8644/webhooks/github-pr`
3. 设置 **Content type** 为 `application/json`
4. 设置 **Secret** 匹配你的路由配置（例如 `github-webhook-secret`）
5. 在 **Which events?** 下，选择 **Let me select individual events** 并勾选 **Pull requests**
6. 点击 **Add webhook**

### 2. 添加路由配置

将上面示例中的 `github-pr` 路由添加到你的 `~/.hermes/config.yaml`。

### 3. 确保 `gh` CLI 已认证

`github_comment` 交付类型使用 GitHub CLI 发布评论：

```bash
gh auth login
```

### 4. 测试

在仓库中打开一个拉取请求。webhook 触发，Hermes 处理事件，并在 PR 上发布审查评论。

---

## GitLab Webhook 设置 {#gitlab-webhook-setup}

GitLab webhook 工作方式类似，但使用不同的身份验证机制。GitLab 将密钥作为纯文本 `X-Gitlab-Token` 头发送（精确字符串匹配，非 HMAC）。

### 1. 在 GitLab 中创建 webhook

1. 进入你的项目 → **Settings** → **Webhooks**
2. 设置 **URL** 为 `http://your-server:8644/webhooks/gitlab-mr`
3. 输入你的 **Secret token**
4. 选择 **Merge request events**（以及你想要的任何其他事件）
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
            Review this merge request:
            Project: {project.path_with_namespace}
            MR !{object_attributes.iid}: {object_attributes.title}
            Author: {object_attributes.last_commit.author.name}
            URL: {object_attributes.url}
            Action: {object_attributes.action}
          deliver: "log"
```

---

## 交付选项 {#delivery-options}

`deliver` 字段控制代理处理完 webhook 事件后的响应去向。

| 交付类型 | 描述 |
|-------------|-------------|
| `log` | 将响应记录到网关日志输出。这是默认值，适用于测试。 |
| `github_comment` | 通过 `gh` CLI 将响应作为 PR/issue 评论发布。需要 `deliver_extra.repo` 和 `deliver_extra.pr_number`。必须在网关主机上安装并认证 `gh` CLI（`gh auth login`）。 |
| `telegram` | 将响应路由到 Telegram。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `discord` | 将响应路由到 Discord。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `slack` | 将响应路由到 Slack。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `signal` | 将响应路由到 Signal。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `sms` | 通过 Twilio 将响应路由到 SMS。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `whatsapp` | 将响应路由到 WhatsApp。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `matrix` | 将响应路由到 Matrix。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `mattermost` | 将响应路由到 Mattermost。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `homeassistant` | 将响应路由到 Home Assistant。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `email` | 将响应路由到 Email。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `dingtalk` | 将响应路由到 DingTalk。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `feishu` | 将响应路由到 Feishu/Lark。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `wecom` | 将响应路由到 WeCom。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `weixin` | 将响应路由到 Weixin（微信）。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `bluebubbles` | 将响应路由到 BlueBubbles（iMessage）。使用 home 频道，或在 `deliver_extra` 中指定 `chat_id`。 |

对于跨平台交付，目标平台也必须启用并连接到网关。如果在 `deliver_extra` 中没有提供 `chat_id`，则响应会发送到该平台配置的 home 频道。

---

## 直接交付模式 {#direct-delivery-mode}

默认情况下，每个 webhook POST 都会触发代理运行——载荷成为提示，代理处理它，然后代理的响应被交付。这会在每个事件上消耗 LLM tokens。

对于你只想**推送纯通知**的用例——无需推理，无需代理循环，只需传递消息——请在路由上设置 `deliver_only: true`。渲染后的 `prompt` 模板成为纯文本消息体，适配器会直接将其分派到配置的交付目标。

### 何时使用直接交付

- **外部服务推送** — Supabase/Firebase webhook 在数据库更改时触发 → 立即通知 Telegram 用户
- **监控警报** — Datadog/Grafana 警报 webhook → 推送到 Discord 频道
- **代理间 ping** — 代理 A 通知代理 B 的用户某个长时间运行的任务已完成
- **后台作业完成** — Cron 作业完成 → 在 Slack 上发布结果

优点：

- **零 LLM tokens** — 从不调用代理
- **亚秒级交付** — 单次适配器调用，无推理循环
- **与代理模式相同的安全性** — HMAC 认证、速率限制、幂等性和 body-size 限制仍然适用
- **同步响应** — POST 在交付成功后返回 `200 OK`，或在目标拒绝时返回 `502`，因此上游服务可以智能重试

### 示例：从 Supabase 推送到 Telegram

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
          prompt: "🎉 New match: {match.user_name} matched with you!"
          deliver_extra:
            chat_id: "{match.telegram_chat_id}"
```

你的 Supabase edge function 使用 HMAC-SHA256 对载荷签名，并 POST 到 `https://your-server:8644/webhooks/antenna-matches`。webhook 适配器验证签名，从载荷渲染模板，交付到 Telegram，并返回 `200 OK`。

### 示例：通过 CLI 动态订阅

```bash
hermes webhook subscribe antenna-matches \
  --deliver telegram \
  --deliver-chat-id "123456789" \
  --deliver-only \
  --prompt "🎉 New match: {match.user_name} matched with you!" \
  --description "Antenna match notifications"
```

### 响应码

| 状态 | 含义 |
|--------|---------|
| `200 OK` | 成功交付。Body: `{"status": "delivered", "route": "...", "target": "...", "delivery_id": "..."}` |
| `200 OK` (status=duplicate) | 在幂等性 TTL（1 小时）内的重复 `X-GitHub-Delivery` ID。不会重新交付。 |
| `401 Unauthorized` | HMAC 签名无效或缺失。 |
| `400 Bad Request` | 格式错误的 JSON body。 |
| `404 Not Found` | 未知路由名称。 |
| `413 Payload Too Large` | Body 超过 `max_body_bytes`。 |
| `429 Too Many Requests` | 路由速率限制超出。 |
| `502 Bad Gateway` | 目标适配器拒绝了消息或引发错误。错误在服务器端记录；响应体是通用的 `Delivery failed`，以避免泄露适配器内部信息。 |

### 配置注意事项

- `deliver_only: true` 要求 `deliver` 是一个真实目标。`deliver: log`（或省略 `deliver`）会在启动时被拒绝——适配器如果发现配置错误的路由会拒绝启动。
- 直接交付模式下忽略 `skills` 字段（无代理运行，因此无法注入技能）。
- 模板渲染使用与代理模式相同的 `{dot.notation}` 语法，包括 `{__raw__}` 标记。
- 幂等性使用相同的 `X-GitHub-Delivery` / `X-Request-ID` 头——使用相同 ID 的重试返回 `status=duplicate` 且不会重新交付。

---

## 动态订阅（CLI） {#dynamic-subscriptions}

除了 `config.yaml` 中的静态路由外，你可以使用 `hermes webhook` CLI 命令动态创建 webhook 订阅。这在代理本身需要设置事件驱动触发器时特别有用。

### 创建订阅

```bash
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "New issue #{issue.number}: {issue.title}\nBy: {issue.user.login}\n\n{issue.body}" \
  --deliver telegram \
  --deliver-chat-id "-100123456789" \
  --description "Triage new GitHub issues"
```

这将返回 webhook URL 和一个自动生成的 HMAC 密钥。配置你的服务向该 URL POST。

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

### 动态订阅如何工作

- 订阅存储在 `~/.hermes/webhook_subscriptions.json`
- webhook 适配器在每个传入请求时热重载此文件（基于 mtime，开销可忽略）
- 具有相同名称的静态路由始终优先于动态路由
- 动态订阅使用与静态路由相同的路由格式和功能（事件、提示模板、技能、交付）
- 无需重启网关——订阅后立即可用

### 代理驱动的订阅

当通过 `webhook-subscriptions` 技能引导时，代理可以通过终端工具创建订阅。请代理“为 GitHub issues 设置 webhook”，它将运行适当的 `hermes webhook subscribe` 命令。

---

## 安全 {#security}

webhook 适配器包含多层安全防护：

### HMAC 签名验证

适配器根据每个来源使用适当的方法验证传入 webhook 签名：

- **GitHub**: `X-Hub-Signature-256` 头 — 带 `sha256=` 前缀的 HMAC-SHA256 hex digest
- **GitLab**: `X-Gitlab-Token` 头 — 纯文本密钥匹配
- **通用**: `X-Webhook-Signature` 头 — 原始 HMAC-SHA256 hex digest

如果配置了密钥但未识别到签名头，请求将被拒绝。

### 密钥是必需的

每个路由必须有密钥——要么直接在路由上设置，要么继承自全局 `secret`。没有密钥的路由会导致适配器启动失败并报错。仅用于开发/测试，可以将密钥设置为 `"INSECURE_NO_AUTH"` 以完全跳过验证。

### 速率限制

每个路由默认限制为 **每分钟 30 个请求**（固定窗口）。可全局配置：

```yaml
platforms:
  webhook:
    extra:
      rate_limit: 60  # 每分钟请求数
```

超出限制的请求会收到 `429 Too Many Requests` 响应。

### 幂等性

交付 ID（来自 `X-GitHub-Delivery`、`X-Request-ID` 或时间戳回退）缓存 **1 小时**。重复交付（例如 webhook 重试）会静默跳过并返回 `200`，防止重复代理运行。

### Body 大小限制

超过 **1 MB** 的载荷会被拒绝，在读取 body 之前。可配置：

```yaml
platforms:
  webhook:
    extra:
      max_body_bytes: 2097152  # 2 MB
```

### Prompt 注入风险

:::warning
webhook 载荷包含攻击者控制的数据——PR 标题、提交消息、issue 描述等都可能包含恶意指令。暴露在公网时应将网关运行在沙箱环境中（Docker、VM）。考虑使用 Docker 或 SSH terminal backend 进行隔离。
:::

---

## 故障排除 {#troubleshooting}

### Webhook 未到达

- 确认端口已暴露并可从 webhook 来源访问
- 检查防火墙规则——端口 `8644`（或你配置的端口）必须开放
- 确认 URL 路径匹配：`http://your-server:8644/webhooks/<route-name>`
- 使用 `/health` 端点确认服务器正在运行

### 签名验证失败

- 确保路由配置中的密钥与 webhook 源中配置的密钥完全匹配
- 对于 GitHub，密钥是基于 HMAC 的——检查 `X-Hub-Signature-256`
- 对于 GitLab，密钥是纯文本令牌匹配——检查 `X-Gitlab-Token`
- 查看网关日志中的 `Invalid signature` 警告

### 事件被忽略

- 检查事件类型是否在路由的 `events` 列表中
- GitHub 事件使用诸如 `pull_request`、`push`、`issues` 的值（`X-GitHub-Event` 头值）
- GitLab 事件使用诸如 `merge_request`、`push` 的值（`X-GitLab-Event` 头值）
- 如果 `events` 为空或未设置，则接受所有事件

### 代理无响应

- 在前台运行网关查看日志：`hermes gateway run`
- 检查提示模板是否正确渲染
- 确认交付目标是配置并连接的

### 重复响应

- 幂等性缓存应防止此问题——确认 webhook 源正在发送交付 ID 头（`X-GitHub-Delivery` 或 `X-Request-ID`）
- 交付 ID 缓存 1 小时

### `gh` CLI 错误（GitHub 评论交付）

- 在网关主机上运行 `gh auth login`
- 确保认证的 GitHub 用户对该仓库有写入权限
- 确认 `gh` 已安装并在 PATH 中

---

## 环境变量 {#environment-variables}

| 变量 | 描述 | 默认值 |
|----------|-------------|---------|
| `WEBHOOK_ENABLED` | 启用 webhook 平台适配器 | `false` |
| `WEBHOOK_PORT` | 接收 webhook 的 HTTP 服务器端口 | `8644` |
| `WEBHOOK_SECRET` | 全局 HMAC 密钥（用作路由未指定自己密钥时的回退） | _(none)_ |