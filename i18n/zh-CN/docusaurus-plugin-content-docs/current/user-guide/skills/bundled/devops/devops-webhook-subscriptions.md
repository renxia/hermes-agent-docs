---
标题: "Webhook 订阅 — Webhook 订阅：事件驱动的智能体运行"
侧边栏标签: "Webhook 订阅"
描述: "Webhook 订阅：事件驱动的智能体运行"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Webhook 订阅

Webhook 订阅：事件驱动的智能体运行。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/devops/webhook-subscriptions` |
| 版本 | `1.1.0` |
| 标签 | `webhook`, `events`, `automation`, `integrations`, `notifications`, `push` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Webhook 订阅

创建动态 Webhook 订阅，以便外部服务（GitHub、GitLab、Stripe、CI/CD、物联网传感器、监控工具）可以通过向 URL POST 事件来触发 Hermes 智能体运行。

## 设置（必需的第一步）

必须先启用 Webhook 平台，才能创建订阅。使用以下命令检查：
```bash
hermes webhook list
```

如果提示“Webhook 平台未启用”，请进行设置：

### 选项 1：设置向导
```bash
hermes gateway setup
```
按照提示启用 Webhook、设置端口并设置全局 HMAC 密钥。

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
# 或者如果使用 systemd：
systemctl --user restart hermes-gateway
```

验证其是否正在运行：
```bash
curl http://localhost:8644/health
```

## 命令

所有管理均通过 `hermes webhook` CLI 命令进行：

### 创建订阅
```bash
hermes webhook subscribe <名称> \
  --prompt "包含 {payload.fields} 的提示模板" \
  --events "事件1,事件2" \
  --description "此订阅的作用" \
  --skills "技能1,技能2" \
  --deliver telegram \
  --deliver-chat-id "12345" \
  --secret "可选-自定义密钥"
```

返回 Webhook URL 和 HMAC 密钥。用户配置其服务向该 URL POST 数据。

### 列出订阅
```bash
hermes webhook list
```

### 删除订阅
```bash
hermes webhook remove <名称>
```

### 测试订阅
```bash
hermes webhook test <名称>
hermes webhook test <名称> --payload '{"key": "value"}'
```

## 提示模板

提示支持 `{点.表示法}` 以访问嵌套的负载字段：

- `{issue.title}` — GitHub 议题标题
- `{pull_request.user.login}` — PR 作者
- `{data.object.amount}` — Stripe 支付金额
- `{sensor.temperature}` — 物联网传感器读数

如果未指定提示，则会将完整的 JSON 负载转储到智能体提示中。

## 常见模式

### GitHub：新议题
```bash
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "新的 GitHub 议题 #{issue.number}：{issue.title}\n\n操作：{action}\n作者：{issue.user.login}\n正文：\n{issue.body}\n\n请对此议题进行分类。" \
  --deliver telegram \
  --deliver-chat-id "-100123456789"
```

然后在 GitHub 仓库设置 → Webhook → 添加 Webhook 中：
- 负载 URL：返回的 webhook_url
- 内容类型：application/json
- 密钥：返回的密钥
- 事件：“Issues”

### GitHub：PR 审查
```bash
hermes webhook subscribe github-prs \
  --events "pull_request" \
  --prompt "PR #{pull_request.number} {action}：{pull_request.title}\n由：{pull_request.user.login}\n分支：{pull_request.head.ref}\n\n{pull_request.body}" \
  --skills "github-code-review" \
  --deliver github_comment
```

### Stripe：支付事件
```bash
hermes webhook subscribe stripe-payments \
  --events "payment_intent.succeeded,payment_intent.payment_failed" \
  --prompt "支付 {data.object.status}：{data.object.amount} 美分，来自 {data.object.receipt_email}" \
  --deliver telegram \
  --deliver-chat-id "-100123456789"
```

### CI/CD：构建通知
```bash
hermes webhook subscribe ci-builds \
  --events "pipeline" \
  --prompt "构建 {object_attributes.status}，在 {project.name} 仓库的分支 {object_attributes.ref} 上\n提交信息：{commit.message}" \
  --deliver discord \
  --deliver-chat-id "1234567890"
```

### 通用监控告警
```bash
hermes webhook subscribe alerts \
  --prompt "告警：{alert.name}\n严重性：{alert.severity}\n消息：{alert.message}\n\n请调查并提出修复建议。" \
  --deliver origin
```

### 直接投递（无智能体，零 LLM 成本）

对于仅需将通知推送到用户聊天（无需推理、无需智能体循环）的用例，请添加 `--deliver-only`。渲染后的 `--prompt` 模板将成为字面消息正文，并直接分派到目标适配器。

适用于：
- 外部服务推送通知（Supabase/Firebase Webhook → Telegram）
- 应原样转发的监控告警
- 智能体间 Ping，其中一个智能体告知另一个智能体的用户某些信息
- 任何 Webhook，其中 LLM 往返将是浪费精力

```bash
hermes webhook subscribe antenna-matches \
  --deliver telegram \
  --deliver-chat-id "123456789" \
  --deliver-only \
  --prompt "🎉 新匹配：{match.user_name} 与您匹配！" \
  --description "Antenna 匹配通知"
```

POST 请求在成功投递时返回 `200 OK`，在目标失败时返回 `502` —— 因此上游服务可以智能地重试。HMAC 认证、速率限制和幂等性仍然适用。

要求 `--deliver` 必须是一个真实的目标（telegram、discord、slack、github_comment 等）—— `--deliver log` 会被拒绝，因为仅记录日志的直接投递毫无意义。

## 安全

- 每个订阅都会获得一个自动生成的 HMAC-SHA256 密钥（或使用 `--secret` 提供您自己的密钥）
- Webhook 适配器会验证每个传入 POST 请求的签名
- 来自 config.yaml 的静态路由无法被动态订阅覆盖
- 订阅会持久化保存到 `~/.hermes/webhook_subscriptions.json`

## 工作原理

1. `hermes webhook subscribe` 写入 `~/.hermes/webhook_subscriptions.json`
2. Webhook 适配器会在每次传入请求时热重载此文件（基于 mtime，开销可忽略）
3. 当到达与路由匹配的 POST 请求时，适配器会格式化提示并触发智能体运行
4. 智能体的响应会被投递到配置的目标（Telegram、Discord、GitHub 评论等）

## 故障排除

如果 Webhook 不工作：

1. **网关是否在运行？** 使用 `systemctl --user status hermes-gateway` 或 `ps aux | grep gateway` 检查
2. **Webhook 服务器是否在监听？** `curl http://localhost:8644/health` 应返回 `{"status": "ok"}`
3. **检查网关日志：** `grep webhook ~/.hermes/logs/gateway.log | tail -20`
4. **签名不匹配？** 验证您服务中的密钥是否与 `hermes webhook list` 中的密钥匹配。GitHub 发送 `X-Hub-Signature-256`，GitLab 发送 `X-Gitlab-Token`。
5. **防火墙/NAT？** Webhook URL 必须可从服务访问。对于本地开发，请使用隧道（ngrok、cloudflared）。
6. **事件类型错误？** 检查 `--events` 过滤器是否与服务发送的内容匹配。使用 `hermes webhook test <名称>` 验证路由是否工作。