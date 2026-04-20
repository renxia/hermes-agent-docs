---
sidebar_position: 11
sidebar_label: "通过 Webhook 实现 GitHub PR 审查"
title: "使用 Webhook 实现自动化的 GitHub PR 评论"
description: "将 Hermes 连接到 GitHub，使其自动获取 PR 差异、审查代码更改并发布评论 —— 由 Webhook 触发，无需手动提示"
---

# 使用 Webhook 实现自动化的 GitHub PR 评论

本指南将引导您将 Hermes Agent 连接到 GitHub，使其自动获取拉取请求的差异、分析代码更改并发布评论 —— 由 Webhook 事件触发，无需手动提示。

当 PR 被打开或更新时，GitHub 会向您的 Hermes 实例发送一个 Webhook POST 请求。Hermes 会使用一个提示运行代理，指示其通过 `gh` CLI 获取差异，并将响应发布回 PR 线程。

:::tip 想要一个无需公开端点的更简单设置？
如果您没有公开 URL 或只是想快速开始，请查看[构建 GitHub PR 审查代理](./github-pr-review-agent.md) —— 使用 cron 作业按计划轮询 PR，可在 NAT 和防火墙后工作。
:::

:::info 参考文档
有关完整的 Webhook 平台参考（所有配置选项、交付类型、动态订阅、安全模型），请参阅 [Webhooks](/docs/user-guide/messaging/webhooks)。
:::

:::warning 提示注入风险
Webhook 负载包含攻击者控制的数据 —— PR 标题、提交消息和描述可能包含恶意指令。当您的 Webhook 端点暴露在互联网上时，请在沙盒环境（Docker、SSH 后端）中运行网关。请参阅下面的[安全说明](#security-notes)。
:::

---

## 先决条件

- 已安装并运行 Hermes Agent（`hermes gateway`）
- 在网关主机上安装并认证了 [`gh` CLI](https://cli.github.com/)（`gh auth login`）
- 您的 Hermes 实例具有可公开访问的 URL（如果在本地运行，请参阅[使用 ngrok 进行本地测试](#local-testing-with-ngrok)）
- 对 GitHub 仓库的管理员访问权限（用于管理 Webhook）

---

## 步骤 1 —— 启用 Webhook 平台

将以下内容添加到您的 `~/.hermes/config.yaml`：

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      port: 8644          # 默认值；如果其他服务占用此端口，请更改
      rate_limit: 30      # 每分钟每路由最大请求数（非全局上限）

      routes:
        github-pr-review:
          secret: "your-webhook-secret-here"   # 必须与 GitHub Webhook 密钥完全匹配
          events:
            - pull_request

          # 代理被指示在审查前获取实际差异。
          # {number} 和 {repository.full_name} 将从 GitHub 负载中解析。
          prompt: |
            收到一个拉取请求事件（操作：{action}）。

            PR #{number}：{pull_request.title}
            作者：{pull_request.user.login}
            分支：{pull_request.head.ref} → {pull_request.base.ref}
            描述：{pull_request.body}
            URL：{pull_request.html_url}

            如果操作是 "closed" 或 "labeled"，请在此停止，不要发布评论。

            否则：
            1. 运行：gh pr diff {number} --repo {repository.full_name}
            2. 审查代码更改的正确性、安全问题和清晰度。
            3. 编写简洁、可操作的审查评论并发布。

          deliver: github_comment
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{number}"
```

**关键字段：**

| 字段 | 描述 |
|---|---|
| `secret`（路由级） | 此路由的 HMAC 密钥。如果省略，则回退到 `extra.secret` 全局密钥。 |
| `events` | 要接受的 `X-GitHub-Event` 标头值列表。空列表 = 接受所有。 |
| `prompt` | 模板；`{field}` 和 `{nested.field}` 将从 GitHub 负载中解析。 |
| `deliver` | `github_comment` 通过 `gh pr comment` 发布。`log` 仅写入网关日志。 |
| `deliver_extra.repo` | 从负载中解析为例如 `org/repo`。 |
| `deliver_extra.pr_number` | 从负载中解析为 PR 编号。 |

:::note 负载不包含代码
GitHub Webhook 负载包括 PR 元数据（标题、描述、分支名称、URL），但**不包含差异**。上述提示指示代理运行 `gh pr diff` 以获取实际更改。`terminal` 工具包含在默认的 `hermes-webhook` 工具集中，因此无需额外配置。
:::

---

## 步骤 2 —— 启动网关

```bash
hermes gateway
```

您应该会看到：

```
[webhook] 监听 0.0.0.0:8644 — 路由：github-pr-review
```

验证其是否正在运行：

```bash
curl http://localhost:8644/health
# {"status": "ok", "platform": "webhook"}
```

---

## 步骤 3 —— 在 GitHub 上注册 Webhook

1. 转到您的仓库 → **Settings** → **Webhooks** → **Add webhook**
2. 填写：
   - **Payload URL：** `https://your-public-url.example.com/webhooks/github-pr-review`
   - **Content type：** `application/json`
   - **Secret：** 与您在路由配置中设置的 `secret` 相同的值
   - **Which events？** → 选择单个事件 → 勾选 **Pull requests**
3. 点击 **Add webhook**

GitHub 将立即发送一个 `ping` 事件以确认连接。它会被安全地忽略 —— `ping` 不在您的 `events` 列表中 —— 并返回 `{"status": "ignored", "event": "ping"}`。它仅在 DEBUG 级别记录，因此在默认日志级别下不会出现在控制台中。

---

## 步骤 4 —— 打开测试 PR

创建一个分支，推送更改，并打开一个 PR。在 30-90 秒内（取决于 PR 大小和模型），Hermes 应发布一条审查评论。

要实时跟踪代理的进度：

```bash
tail -f "${HERMES_HOME:-$HOME/.hermes}/logs/gateway.log"
```

---

## 使用 ngrok 进行本地测试

如果 Hermes 运行在您的笔记本电脑上，请使用 [ngrok](https://ngrok.com/) 将其暴露：

```bash
ngrok http 8644
```

复制 `https://...ngrok-free.app` URL 并将其用作您的 GitHub Payload URL。在免费的 ngrok 层级中，每次 ngrok 重启时 URL 都会更改 —— 每次会话更新您的 GitHub Webhook。付费 ngrok 账户可获得静态域名。

您可以直接使用 `curl` 对静态路由进行冒烟测试 —— 无需 GitHub 账户或真实 PR。

:::tip 在本地测试时使用 `deliver: log`
在测试时将配置中的 `deliver: github_comment` 更改为 `deliver: log`。否则，代理将尝试向测试负载中的虚假 `org/repo#99` 仓库发布评论，这将失败。一旦您对提示输出满意，请切换回 `deliver: github_comment`。
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
# 预期：{"status":"accepted","route":"github-pr-review","event":"pull_request","delivery_id":"..."}
```

然后观察代理运行：
```bash
tail -f "${HERMES_HOME:-$HOME/.hermes}/logs/gateway.log"
```

:::note
`hermes webhook test <name>` 仅适用于使用 `hermes webhook subscribe` 创建的**动态订阅**。它不从 `config.yaml` 读取路由。
:::

---

## 过滤特定操作

GitHub 为许多操作发送 `pull_request` 事件：`opened`、`synchronize`、`reopened`、`closed`、`labeled` 等。`events` 列表仅按 `X-GitHub-Event` 标头值过滤 —— 它无法在路由级别按操作子类型过滤。

步骤 1 中的提示已通过指示代理对 `closed` 和 `labeled` 事件提前停止来处理此问题。

:::warning 代理仍会运行并消耗令牌
“在此停止”指令可防止有意义的审查，但代理仍会为每个 `pull_request` 事件运行至完成，无论操作如何。GitHub Webhook 只能按事件类型（`pull_request`、`push`、`issues` 等）过滤 —— 不能按操作子类型（`opened`、`closed`、`labeled`）过滤。没有针对子操作的路由级过滤器。对于高流量仓库，请接受此成本或使用 GitHub Actions 工作流在上游有条件地调用您的 Webhook URL 进行过滤。
:::

> 没有 Jinja2 或条件模板语法。仅支持 `{field}` 和 `{nested.field}` 替换。任何其他内容都会原样传递给代理。

---

## 使用技能实现一致的审查风格

加载 [Hermes 技能](/docs/user-guide/features/skills) 以赋予代理一致的审查角色。在 `config.yaml` 中的 `platforms.webhook.extra.routes` 内为您的路由添加 `skills`：

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
            收到一个拉取请求事件（操作：{action}）。
            PR #{number}：{pull_request.title}，作者：{pull_request.user.login}
            URL：{pull_request.html_url}

            如果操作是 "closed" 或 "labeled"，请在此停止，不要发布评论。

            否则：
            1. 运行：gh pr diff {number} --repo {repository.full_name}
            2. 使用您的审查指南审查差异。
            3. 编写简洁、可操作的审查评论并发布。
          skills:
            - review
          deliver: github_comment
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{number}"
```

> **注意：** 仅加载找到的第一个技能。Hermes 不会堆叠多个技能 —— 后续条目将被忽略。

---

## 改为向 Slack 或 Discord 发送响应

将路由内的 `deliver` 和 `deliver_extra` 字段替换为您的目标平台：

```yaml
# 在 platforms.webhook.extra.routes.<route-name> 内：

# Slack
deliver: slack
deliver_extra:
  chat_id: "C0123456789"   # Slack 频道 ID（省略以使用配置的首页频道）

# Discord
deliver: discord
deliver_extra:
  chat_id: "987654321012345678"  # Discord 频道 ID（省略以使用首页频道）
```

目标平台也必须在网关中启用并连接。如果省略 `chat_id`，响应将发送到该平台的配置首页频道。

有效的 `deliver` 值：`log` · `github_comment` · `telegram` · `discord` · `slack` · `signal` · `sms`

---

## GitLab 支持

相同的适配器也适用于 GitLab。GitLab 使用 `X-Gitlab-Token` 进行身份验证（纯字符串匹配，非 HMAC）—— Hermes 会自动处理两者。

对于事件过滤，GitLab 将 `X-GitLab-Event` 设置为类似 `Merge Request Hook`、`Push Hook`、`Pipeline Hook` 的值。在 `events` 中使用确切的标头值：

```yaml
events:
  - Merge Request Hook
```

GitLab 负载字段与 GitHub 不同 —— 例如，MR 标题使用 `{object_attributes.title}`，MR 编号使用 `{object_attributes.iid}`。发现完整负载结构的最简单方法是结合 GitLab 的 Webhook 设置中的**测试**按钮和**最近交付**日志。或者，从您的路由配置中省略 `prompt` —— Hermes 然后将完整负载作为格式化的 JSON 直接传递给代理，代理的响应（在网关日志中使用 `deliver: log` 可见）将描述其结构。

---

## 安全说明

- **切勿在生产中使用 `INSECURE_NO_AUTH`** —— 它会完全禁用签名验证。仅用于本地开发。
- **定期轮换您的 Webhook 密钥**，并在 GitHub（Webhook 设置）和您的 `config.yaml` 中更新它。
- **速率限制** 默认每路由每分钟 30 个请求（可通过 `extra.rate_limit` 配置）。超过它将返回 `429`。
- **重复交付**（Webhook 重试）通过 1 小时幂等性缓存进行去重。缓存键为 `X-GitHub-Delivery`（如果存在），然后是 `X-Request-ID`，然后是毫秒时间戳。当未设置任何交付 ID 标头时，重试**不会**被去重。
- **提示注入：** PR 标题、描述和提交消息由攻击者控制。恶意 PR 可能试图操纵代理的操作。当暴露在互联网上时，请在沙盒环境（Docker、VM）中运行网关。

---

## 故障排除

| 症状 | 检查 |
|---|---|
| `401 无效签名` | config.yaml 中的密钥与 GitHub Webhook 密钥不匹配 |
| `404 未知路由` | URL 中的路由名称与 `routes:` 中的键不匹配 |
| `429 速率限制超出` | 每路由每分钟 30 个请求超出 —— 在从 GitHub UI 重新交付测试事件时常见；等待一分钟或提高 `extra.rate_limit` |
| 未发布评论 | `gh` 未安装、不在 PATH 中，或未认证（`gh auth login`） |
| 代理运行但无评论 | 检查网关日志 —— 如果代理输出为空或仅为 "SKIP"，仍会尝试交付 |
| 端口已被占用 | 更改 config.yaml 中的 `extra.port` |
| 代理运行但仅审查 PR 描述 | 提示未包含 `gh pr diff` 指令 —— 差异不在 Webhook 负载中 |
| 看不到 ping 事件 | 忽略的事件仅在 DEBUG 日志级别返回 `{"status":"ignored","event":"ping"}` —— 检查 GitHub 的交付日志（仓库 → Settings → Webhooks → 您的 Webhook → Recent Deliveries） |

**GitHub 的“最近交付”选项卡**（仓库 → Settings → Webhooks → 您的 Webhook）显示每次交付的确切请求标头、负载、HTTP 状态和响应正文。这是无需接触服务器日志即可诊断失败的最快方法。

---

## 完整配置参考

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      host: "0.0.0.0"         # 绑定地址（默认：0.0.0.0）
      port: 8644               # 监听端口（默认：8644）
      secret: ""               # 可选的全局回退密钥
      rate_limit: 30           # 每分钟每路由请求数
      max_body_bytes: 1048576  # 负载大小限制（字节）（默认：1 MB）

      routes:
        <route-name>:
          secret: "required-per-route"
          events: []            # [] = 接受所有；否则列出 X-GitHub-Event 值
          prompt: ""            # {field} / {nested.field} 从负载中解析
          skills: []            # 加载第一个匹配的技能（仅一个）
          deliver: "log"        # log | github_comment | telegram | discord | slack | signal | sms
          deliver_extra: {}     # github_comment 的 repo + pr_number；其他的 chat_id
```

---

## 下一步？

- **[基于 Cron 的 PR 审查](./github-pr-review-agent.md)** —— 按计划轮询 PR，无需公开端点
- **[Webhook 参考](/docs/user-guide/messaging/webhooks)** —— Webhook 平台的完整配置参考
- **[构建插件](/docs/guides/build-a-hermes-plugin)** —— 将审查逻辑打包成可共享的插件
- **[配置文件](/docs/user-guide/profiles)** —— 运行具有其自身内存和配置的专用审查者配置文件