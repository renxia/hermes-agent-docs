---
sidebar_position: 11
sidebar_label: "通过 Webhook 进行 GitHub PR 审查"
title: "通过 Webhooks 自动化 GitHub PR 评论"
description: "将 Hermes 连接到 GitHub，使其自动获取 PR 差异、审查代码更改并发布评论 —— 由 Webhook 触发，无需手动提示"
---

# 通过 Webhooks 自动化 GitHub PR 评论

本指南将引导您将 Hermes 智能体连接到 GitHub，使其自动获取拉取请求的差异、分析代码更改并发布评论 —— 由 Webhook 事件触发，无需任何手动提示。

当拉取请求被创建或更新时，GitHub 会向您的 Hermes 实例发送一个 webhook POST 请求。Hermes 会运行智能体，并使用一个提示指令其通过 `gh` CLI 检索差异，然后将响应发布回 PR 的讨论线程中。

:::tip 想要更简单的设置且无需公开端点？
如果您没有公开 URL，或者只是想快速开始，可以查看[构建 GitHub PR 审查智能体](./github-pr-review-agent.md) —— 它使用定时任务定期轮询 PR，可在 NAT 和防火墙后面工作。
:::

:::info 参考文档
有关完整的 webhook 平台参考（所有配置选项、投递类型、动态订阅、安全模型），请参见 [Webhooks](/user-guide/messaging/webhooks)。
:::

:::warning 提示注入风险
Webhook 载荷包含攻击者可控的数据 —— PR 标题、提交消息和描述可能包含恶意指令。当您的 webhook 端点暴露在互联网上时，请在沙盒环境（Docker、SSH 后端）中运行网关。请参阅下方的[安全说明](#安全说明)。
:::

---

## 前提条件

- 已安装并运行 Hermes 智能体（`hermes gateway`）
- 在网关主机上已安装并认证 [`gh` CLI](https://cli.github.com/)（`gh auth login`）
- 您的 Hermes 实例拥有一个公开可达的 URL（如果在本地运行，请参阅[使用 ngrok 进行本地测试](#使用-ngrok-进行本地测试)）
- 拥有 GitHub 仓库的管理员权限（用于管理 webhooks）

---
(安全说明)
### 安全说明
当您的 webhook 端点对外部互联网开放时，请务必注意潜在的风险。恶意用户可能会尝试在 PR 标题、提交消息或描述中注入恶意指令，试图劫持您的智能体或执行非预期操作。

为了降低风险，我们强烈建议在沙盒环境中运行 Hermes 网关。这可以限制智能体对其主机环境的访问能力。您可以使用以下技术来隔离网关：
- **Docker 容器**：将网关运行在容器内，并限制其网络和文件系统权限。
- **SSH 后端**：在独立的服务器或虚拟机上运行网关，仅通过 SSH 进行访问和操作。

始终遵循最小权限原则，确保网关和智能体仅拥有完成其任务所必需的权限。

(使用-ngrok-进行本地测试)
### 使用 ngrok 进行本地测试
如果您想在本地机器上测试此设置，但需要一个公开可达的 URL 来接收 GitHub 的 webhook 调用，可以使用 [ngrok](https://ngrok.com/) 这样的隧道服务。

1.  安装 ngrok。
2.  在终端中运行 `ngrok http <HERMES_GATEWAY_PORT>`（将 `<HERMES_GATEWAY_PORT>` 替换为您的 Hermes 网关实际监听的端口，例如 8000）。
3.  ngrok 会为您提供一个公开的 HTTPS URL（例如 `https://xxxx.ngrok-free.app`）。这就是您需要在 GitHub 仓库 webhook 设置中填写的 **有效负载 URL**。

请注意，ngrok 生成的免费 URL 会在一段时间后更改。对于长期测试或生产环境，请考虑使用稳定的 URL 或部署方案。

## 步骤一 — 启用 Webhook 平台

在你的 `~/.hermes/config.yaml` 中添加以下内容：

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      port: 8644          # 默认值；如果其他服务占用了此端口，请修改
      rate_limit: 30      # 每条路由每分钟最大请求数（非全局限制）

      routes:
        github-pr-review:
          secret: "your-webhook-secret-here"   # 必须与 GitHub Webhook 的密钥完全匹配
          events:
            - pull_request

          # 智能体被指示在审查前获取实际的差异。
          # {number} 和 {repository.full_name} 从 GitHub 载荷中解析。
          prompt: |
            收到了一个 Pull Request 事件 (动作: {action})。

            PR #{number}: {pull_request.title}
            作者: {pull_request.user.login}
            分支: {pull_request.head.ref} → {pull_request.base.ref}
            描述: {pull_request.body}
            URL: {pull_request.html_url}

            如果动作是 "closed" 或 "labeled"，请在此停止，不要发布评论。

            否则：
            1. 运行：gh pr diff {number} --repo {repository.full_name}
            2. 审查代码变更的正确性、安全问题和清晰度。
            3. 撰写简洁、可操作的审查评论并发布。

          deliver: github_comment
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{number}"
```

**关键字段：**

| 字段 | 描述 |
|---|---|
| `secret` (路由级别) | 用于此路由的 HMAC 密钥。如果省略，则回退到全局的 `extra.secret`。 |
| `events` | 要接受的 `X-GitHub-Event` 头部值列表。空列表 = 接受所有。 |
| `prompt` | 模板；`{field}` 和 `{nested.field}` 从 GitHub 载荷中解析。 |
| `deliver` | `github_comment` 通过 `gh pr comment` 发布。`log` 仅写入网关日志。 |
| `deliver_extra.repo` | 从载荷中解析，例如 `org/repo`。 |
| `deliver_extra.pr_number` | 从载荷中解析 PR 编号。 |

:::note 载荷不包含代码
GitHub Webhook 载荷包含 PR 元数据（标题、描述、分支名称、URL），但**不包含差异**。上面的提示指示智能体运行 `gh pr diff` 以获取实际变更。`terminal` 工具包含在默认的 `hermes-webhook` 工具集中，因此无需额外配置。
:::

---

## 步骤二 — 启动网关

```bash
hermes gateway
```

你应该会看到：

```
[webhook] Listening on 0.0.0.0:8644 — routes: github-pr-review
```

验证其正在运行：

```bash
curl http://localhost:8644/health
# {"status": "ok", "platform": "webhook"}
```

---

## 步骤三 — 在 GitHub 上注册 Webhook

1. 前往你的仓库 → **Settings** → **Webhooks** → **Add webhook**
2. 填写：
   - **Payload URL：** `https://your-public-url.example.com/webhooks/github-pr-review`
   - **Content type：** `application/json`
   - **Secret：** 与你在路由配置中设置的 `secret` 值相同
   - **Which events?** → 选择 **Let me select individual events** → 勾选 **Pull requests**
3. 点击 **Add webhook**

GitHub 会立即发送一个 `ping` 事件以确认连接。它被安全地忽略了 —— `ping` 不在你的 `events` 列表中 —— 并返回 `{"status": "ignored", "event": "ping"}`。它只在 DEBUG 级别被记录，所以在默认日志级别下不会出现在控制台中。

---

## 步骤四 — 打开一个测试 PR

创建一个分支，推送一个更改，并打开一个 PR。在 30-90 秒内（取决于 PR 大小和模型），Hermes 应该会发布一条审查评论。

要实时跟踪智能体的进展：

```bash
tail -f "${HERMES_HOME:-$HOME/.hermes}/logs/gateway.log"
```

---

## 使用 ngrok 进行本地测试

如果 Hermes 在你的笔记本电脑上运行，可以使用 [ngrok](https://ngrok.com/) 来暴露它：

```bash
ngrok http 8644
```

复制 `https://...ngrok-free.app` 的 URL，并将其用作你的 GitHub Payload URL。在免费的 ngrok 层级中，URL 每次 ngrok 重启时都会变化 —— 请在每个会话中更新你的 GitHub Webhook。付费 ngrok 账户可以获得一个静态域名。

你可以直接用 `curl` 对静态路由进行冒烟测试 —— 无需 GitHub 账户或真实的 PR。

:::tip 本地测试时使用 `deliver: log`
在测试时，将配置中的 `deliver: github_comment` 改为 `deliver: log`。否则，智能体会尝试向测试载荷中虚假的 `org/repo#99` 仓库发布评论，这将会失败。一旦你对提示输出满意，再切换回 `deliver: github_comment`。
:::

```bash
SECRET="your-webhook-secret-here"
BODY='{"action":"opened","number":99,"pull_request":{"title":"Test PR","body":"Adds a feature.","user":{"login":"testuser"},"head":{"ref":"feat/x"},"base":{"ref":"main"},"html_url":"https://github.com/org/repo/pull/99"},"repository":{"full_name":"org/repo"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print "sha256="$2}')

curl -s -X POST http://localhost:8644/webhooks/github-pr-review \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-Hub-Signature-256: $SIG" \
  -d "$BODY"
# 预期输出: {"status":"accepted","route":"github-pr-review","event":"pull_request","delivery_id":"..."}
```

然后观察智能体运行：
```bash
tail -f "${HERMES_HOME:-$HOME/.hermes}/logs/gateway.log"
```

:::note
`hermes webhook test <name>` 仅适用于使用 `hermes webhook subscribe` 创建的**动态订阅**。它不会从 `config.yaml` 读取路由。
:::

---

## 过滤特定操作

GitHub 会为多种操作发送 `pull_request` 事件：`opened`、`synchronize`、`reopened`、`closed`、`labeled` 等。`events` 列表仅根据 `X-GitHub-Event` 头部值进行过滤 —— 它无法在路由级别按操作子类型过滤。

步骤 1 中的提示已经通过指示智能体对 `closed` 和 `labeled` 事件提前停止来处理这个问题。

:::warning 智能体仍会运行并消耗代币
“在此停止”的指示阻止了有意义的审查，但智能体仍然会为每个 `pull_request` 事件（无论操作如何）运行到完成。GitHub Webhook 只能按事件类型（`pull_request`、`push`、`issues` 等）过滤 —— 不能按操作子类型（`opened`、`closed`、`labeled`）过滤。没有针对子操作的路由级过滤器。对于高流量仓库，请接受这个成本，或者使用 GitHub Actions 工作流有条件地调用你的 Webhook URL 来进行上游过滤。
:::

> 没有 Jinja2 或条件模板语法。`{field}` 和 `{nested.field}` 是唯一支持的替换。其他任何内容都按原样传递给智能体。

---

## 使用技能以保持一致的审查风格

加载一个 [Hermes 技能](/user-guide/features/skills) 以赋予智能体一致的审查角色。在 `config.yaml` 中的 `platforms.webhook.extra.routes` 内的路由中添加 `skills`：

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      routes:
        github-pr-review:
          secret: "your-webhook-secret-here"
          events: [pull_request]
          prompt: |
            收到了一个 Pull Request 事件 (动作: {action})。
            PR #{number}: {pull_request.title}，作者 {pull_request.user.login}
            URL: {pull_request.html_url}

            如果动作是 "closed" 或 "labeled"，请在此停止，不要发布评论。

            否则：
            1. 运行：gh pr diff {number} --repo {repository.full_name}
            2. 使用你的审查指南审查差异。
            3. 撰写简洁、可操作的审查评论并发布。
          skills:
            - review
          deliver: github_comment
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{number}"
```

> **注意：** 仅加载列表中找到的第一个技能。Hermes 不会叠加多个技能 —— 后续条目将被忽略。

---

## 将响应发送到 Slack 或 Discord

将路由内的 `deliver` 和 `deliver_extra` 字段替换为目标平台：

```yaml
# 位于 platforms.webhook.extra.routes.<route-name> 内：

# Slack
deliver: slack
deliver_extra:
  chat_id: "C0123456789"   # Slack 频道 ID（省略则使用配置的主频道）

# Discord
deliver: discord
deliver_extra:
  chat_id: "987654321012345678"  # Discord 频道 ID（省略则使用主频道）
```

目标平台也必须在网关中启用和连接。如果省略 `chat_id`，则响应将发送到该平台配置的主频道。

有效的 `deliver` 值：`log` · `github_comment` · `telegram` · `discord` · `slack` · `signal` · `sms`

---

## GitLab 支持

相同的适配器也适用于 GitLab。GitLab 使用 `X-Gitlab-Token` 进行身份验证（纯字符串匹配，而非 HMAC）——Hermes 会自动处理两者。

对于事件过滤，GitLab 将 `X-GitLab-Event` 设置为类似 `Merge Request Hook`、`Push Hook`、`Pipeline Hook` 的值。请在 `events` 中使用精确的标头值：

```yaml
events:
  - Merge Request Hook
```

GitLab 的负载字段与 GitHub 不同——例如，使用 `{object_attributes.title}` 获取 MR 标题，使用 `{object_attributes.iid}` 获取 MR 编号。发现完整负载结构最简单的方法是使用 GitLab webhook 设置中的 **Test** 按钮，并结合 **Recent Deliveries** 日志。或者，在路由配置中省略 `prompt` —— Hermes 将会直接把完整的负载作为格式化的 JSON 传递给智能体，智能体的响应（在网关日志中通过 `deliver: log` 可见）将会描述其结构。

---

## 安全注意事项

- **切勿在生产环境中使用 `INSECURE_NO_AUTH`** —— 它会完全禁用签名验证。仅适用于本地开发。
- **定期轮换你的 webhook secret**，并同时在 GitHub（webhook 设置）和你的 `config.yaml` 中进行更新。
- **速率限制**默认为每路由每分钟 30 个请求（可通过 `extra.rate_limit` 配置）。超出限制将返回 `429`。
- **重复交付**（webhook 重试）通过 1 小时的幂等缓存进行去重。缓存键依次是 `X-GitHub-Delivery`（如果存在）、`X-Request-ID` 和毫秒时间戳。当两个交付 ID 标头都未设置时，重试**不会**被去重。
- **提示注入：** PR 标题、描述和提交消息是攻击者可控的。恶意 PR 可能会试图操纵智能体的行为。当暴露于公共互联网时，请在沙盒环境（Docker、VM）中运行网关。

---

## 故障排除

| 症状 | 检查 |
|---|---|
| `401 Invalid signature` | config.yaml 中的 secret 与 GitHub webhook secret 不匹配 |
| `404 Unknown route` | URL 中的路由名称与 `routes:` 中的键不匹配 |
| `429 Rate limit exceeded` | 每路由每分钟 30 个请求的限制被超出——常见于从 GitHub UI 重新交付测试事件时；等待一分钟或提高 `extra.rate_limit` |
| 没有发布评论 | `gh` 未安装、不在 PATH 中，或未通过身份验证 (`gh auth login`) |
| 智能体运行但未发布评论 | 检查网关日志——如果智能体输出为空或仅为 "SKIP"，交付仍会被尝试 |
| 端口已被占用 | 在 config.yaml 中更改 `extra.port` |
| 智能体运行但仅审阅 PR 描述 | 提示未包含 `gh pr diff` 指令——diff 不在 webhook 负载中 |
| 看不到 ping 事件 | 被忽略的事件仅在 DEBUG 日志级别返回 `{"status":"ignored","event":"ping"}` —— 检查 GitHub 的交付日志（仓库 → Settings → Webhooks → 你的 webhook → Recent Deliveries） |

**GitHub 的 Recent Deliveries 选项卡**（仓库 → Settings → Webhooks → 你的 webhook）显示了每个交付的确切请求标头、负载、HTTP 状态和响应正文。这是在不查看服务器日志的情况下诊断故障的最快方法。

---

## 完整配置参考

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      host: "0.0.0.0"         # 绑定地址（默认：0.0.0.0）
      port: 8644               # 监听端口（默认：8644）
      secret: ""               # 可选的全局回退 secret
      rate_limit: 30           # 每路由每分钟请求数
      max_body_bytes: 1048576  # 负载大小限制（字节）（默认：1 MB）

      routes:
        <route-name>:
          secret: "required-per-route"
          events: []            # [] = 接受所有；否则列出 X-GitHub-Event 值
          prompt: ""            # {field} / {nested.field} 从负载解析
          skills: []            # 加载第一个匹配的技能（仅一个）
          deliver: "log"        # log | github_comment | telegram | discord | slack | signal | sms
          deliver_extra: {}     # github_comment 需要 repo + pr_number；其他需要 chat_id
```

---

## 下一步？

- **[基于 Cron 的 PR 审阅](./github-pr-review-agent.md)** —— 按计划轮询 PR，无需公开端点
- **[Webhook 参考](/user-guide/messaging/webhooks)** —— webhook 平台的完整配置参考
- **[构建插件](/guides/build-a-hermes-plugin)** —— 将审阅逻辑打包成可共享的插件
- **[配置文件](/user-guide/profiles)** —— 运行一个具有自身记忆和配置的专用审阅器配置文件