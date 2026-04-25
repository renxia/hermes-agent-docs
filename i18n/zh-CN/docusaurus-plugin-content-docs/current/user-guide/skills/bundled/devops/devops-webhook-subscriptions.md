---
title: "Webhook 订阅"
sidebar_label: "Webhook 订阅"
description: "创建并管理 Webhook 订阅，用于事件驱动的智能体激活，或直接推送通知（零 LLM 成本）"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能包的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Webhook 订阅

创建并管理 Webhook 订阅，用于事件驱动的智能体激活，或直接推送通知（零 LLM 成本）。当用户希望外部服务触发智能体运行，或向聊天推送通知时使用。

## 技能包元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/devops/webhook-subscriptions` |
| 版本 | `1.1.0` |
| 标签 | `webhook`, `events`, `automation`, `integrations`, `notifications`, `push` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能包时加载的完整技能定义。这是智能体在技能包激活时看到的指令。
:::

# Webhook 订阅

创建动态 Webhook 订阅，使外部服务（GitHub、GitLab、Stripe、CI/CD、IoT 传感器、监控工具）能够通过向 URL 发送 POST 事件来触发 Hermes 智能体运行。

## 设置（必需的第一步）

在创建订阅之前，必须启用 Webhook 平台。请运行以下命令检查：
```bash
hermes webhook list
```

如果提示“Webhook platform is not enabled”，请进行设置：

### 选项 1：设置向导
```bash
hermes gateway setup
```
按照提示启用 Webhook，设置端口，并设置全局 HMAC 密钥。

### 选项 2：手动配置
添加到 `~/.hermes/config.yaml`：
```yaml
platforms:
  webhook:
    enabled: true
    extra:
      host: "0.0.0.0"
      port: 8644
      secret: "generate-a-strong-secret-here"
```

### 选项 3：环境变量
添加到 `~/.hermes/.env`：
```bash
WEBHOOK_ENABLED=true
WEBHOOK_PORT=8644
WEBHOOK_SECRET=generate-a-strong-secret-here
```

配置完成后，启动（或重启）网关：
```bash
hermes gateway run
# 或使用 systemd：
systemctl --user restart hermes-gateway
```

验证是否正在运行：
```bash
curl http://localhost:8644/health
```

## 命令

所有管理均通过 `hermes webhook` CLI 命令进行：

### 创建订阅
```bash
hermes webhook subscribe <name> \
  --prompt "Prompt template with {payload.fields}" \
  --events "event1,event2" \
  --description "What this does" \
  --skills "skill1,skill2" \
  --deliver telegram \
  --deliver-chat-id "12345" \
  --secret "optional-custom-secret"
```

返回 Webhook URL 和 HMAC 密钥。用户需将其服务配置为向该 URL 发送 POST 请求。

### 列出订阅
```bash
hermes webhook list
```

### 删除订阅
```bash
hermes webhook remove <name>
```

### 测试订阅
```bash
hermes webhook test <name>
hermes webhook test <name> --payload '{"key": "value"}'
```

## 提示模板

提示支持 `{dot.notation}` 以访问嵌套的有效载荷字段：

- `{issue.title}` — GitHub 问题标题
- `{pull_request.user.login}` — PR 作者
- `{data.object.amount}` — Stripe 支付金额
- `{sensor.temperature}` — IoT 传感器读数

如果未指定提示，则整个 JSON 有效载荷将被转储到智能体提示中。

## 常见模式

### GitHub：新问题
```bash
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "New GitHub issue #{issue.number}: {issue.title}\n\nAction: {action}\nAuthor: {issue.user.login}\nBody:\n{issue.body}\n\nPlease triage this issue." \
  --deliver telegram \
  --deliver-chat-id "-100123456789"
```

然后在 GitHub 仓库设置 → Webhooks → 添加 Webhook：
- 有效载荷 URL：返回的 webhook_url
- 内容类型：application/json
- 密钥：返回的 secret
- 事件：“Issues”

### GitHub：PR 审查
```bash
hermes webhook subscribe github-prs \
  --events "pull_request" \
  --prompt "PR #{pull_request.number} {action}: {pull_request.title}\nBy: {pull_request.user.login}\nBranch: {pull_request.head.ref}\n\n{pull_request.body}" \
  --skills "github-code-review" \
  --deliver github_comment
```

### Stripe：支付事件
```bash
hermes webhook subscribe stripe-payments \
  --events "payment_intent.succeeded,payment_intent.payment_failed" \
  --prompt "Payment {data.object.status}: {data.object.amount} cents from {data.object.receipt_email}" \
  --deliver telegram \
  --deliver-chat-id "-100123456789"
```

### CI/CD：构建通知
```bash
hermes webhook subscribe ci-builds \
  --events "pipeline" \
  --prompt "Build {object_attributes.status} on {project.name} branch {object_attributes.ref}\nCommit: {commit.message}" \
  --deliver discord \
  --deliver-chat-id "1234567890"
```

### 通用监控警报
```bash
hermes webhook subscribe alerts \
  --prompt "Alert: {alert.name}\nSeverity: {alert.severity}\nMessage: {alert.message}\n\nPlease investigate and suggest remediation." \
  --deliver origin
```

### 直接推送（无智能体，零 LLM 成本）

对于仅需将通知推送到用户聊天的情况 —— 无需推理，无需智能体循环 —— 请添加 `--deliver-only`。渲染后的 `--prompt` 模板将成为字面消息正文，并直接发送到目标适配器。

适用于以下场景：
- 外部服务推送通知（Supabase/Firebase Webhook → Telegram）
- 应原样转发的监控警报
- 智能体间通信，其中一个智能体向另一个智能体的用户发送消息
- 任何 LLM 往返通信属于浪费资源的 Webhook

```bash
hermes webhook subscribe antenna-matches \
  --deliver telegram \
  --deliver-chat-id "123456789" \
  --deliver-only \
  --prompt "🎉 New match: {match.user_name} matched with you!" \
  --description "Antenna match notifications"
```

POST 请求在成功推送时返回 `200 OK`，在目标失败时返回 `502` —— 以便上游服务智能重试。HMAC 认证、速率限制和幂等性仍然适用。

要求 `--deliver` 必须是一个真实的目标（telegram、discord、slack、github_comment 等）—— `--deliver log` 会被拒绝，因为仅记录日志的直接推送毫无意义。

## 安全

- 每个订阅都会获得一个自动生成的 HMAC-SHA256 密钥（或使用 `--secret` 提供自定义密钥）
- Webhook 适配器会验证每个传入 POST 请求的签名
- 来自 config.yaml 的静态路由无法被动态订阅覆盖
- 订阅信息会持久化保存到 `~/.hermes/webhook_subscriptions.json`

## 工作原理

1. `hermes webhook subscribe` 将信息写入 `~/.hermes/webhook_subscriptions.json`
2. Webhook 适配器会在每次收到请求时热重载此文件（基于 mtime，开销可忽略）
3. 当收到匹配某路由的 POST 请求时，适配器会格式化提示并触发智能体运行
4. 智能体的响应会被发送到配置的目标（Telegram、Discord、GitHub 评论等）

## 故障排除

如果 Webhook 不工作：

1. **网关是否在运行？** 使用 `systemctl --user status hermes-gateway` 或 `ps aux | grep gateway` 检查
2. **Webhook 服务器是否在监听？** `curl http://localhost:8644/health` 应返回 `{"status": "ok"}`
3. **检查网关日志：** `grep webhook ~/.hermes/logs/gateway.log | tail -20`
4. **签名不匹配？** 验证服务中的密钥是否与 `hermes webhook list` 返回的一致。GitHub 发送 `X-Hub-Signature-256`，GitLab 发送 `X-Gitlab-Token`。
5. **防火墙/NAT？** Webhook URL 必须可从服务访问。本地开发时，请使用隧道（ngrok、cloudflared）。
6. **事件类型错误？** 检查 `--events` 过滤器是否匹配服务发送的内容。使用 `hermes webhook test <name>` 验证路由是否有效。