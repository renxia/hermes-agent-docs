---
sidebar_position: 15
title: "Automation Blueprints"
description: "Ready-to-use automation blueprints — scheduled tasks, GitHub event triggers, API webhooks, and multi-skill workflows"
---

# Automation Blueprints

即插即用的自动化蓝图，涵盖常见自动化模式。每个蓝图均使用 Hermes 内置的 [cron 调度器](/user-guide/features/cron) 实现基于时间的触发，并使用 [Webhook 平台](/user-guide/messaging/webhooks) 实现事件驱动触发。

每个蓝图均可配合**任意模型**使用——不绑定单一供应商。

如需使用表单参数化蓝图而非 cron 语法，请参阅 [自动化蓝图目录](/reference/automation-blueprints-catalog)。

:::tip 三种触发类型
| 触发方式 | 机制 | 工具 |
|---------|-----|------|
| **定时调度** | 按频率运行（每小时、每晚、每周） | `cronjob` 工具或 `/cron` 斜杠命令 |
| **GitHub 事件** | 在 PR 提交、推送、Issue、CI 结果时触发 | Webhook 平台（`hermes webhook subscribe`） |
| **API 调用** | 外部服务向你的端点 POST JSON | Webhook 平台（config.yaml 路由或 `hermes webhook subscribe`） |

这三种触发方式均支持投递到 Telegram、Discord、Slack、短信、邮件、GitHub 评论或本地文件。
:::

---

## 开发工作流

### 每晚待办梳理

每晚自动标记、排序和总结新 Issue。将摘要推送到团队频道。

**触发方式：** 定时调度（每晚）

```bash
hermes cron create "0 2 * * *" \
  "你是一个项目管理员，正在梳理 NousResearch/hermes-agent GitHub 仓库。

1. 运行：gh issue list --repo NousResearch/hermes-agent --state open --json number,title,labels,author,createdAt --limit 30
2. 找出过去 24 小时内创建的 Issue
3. 对每个新 Issue：
   - 建议优先级标签（P0-紧急、P1-高、P2-中、P3-低）
   - 建议分类标签（bug、feature、docs、security）
   - 撰写一行梳理备注
4. 汇总：总开放 Issue 数、今日新增数、按优先级分类统计

格式化为简洁的摘要。如果没有新 Issue，回复 [SILENT]。" \
  --name "每晚待办梳理" \
  --deliver telegram
```

### 自动 PR 代码审查

当每个 Pull Request 创建时自动进行审查。直接在 PR 上发布审查评论。

**触发方式：** GitHub Webhook

**选项 A — 动态订阅（CLI）：**

```bash
hermes webhook subscribe github-pr-review \
  --events "pull_request" \
  --prompt "审查这个 Pull Request：
仓库：{repository.full_name}
PR #{pull_request.number}：{pull_request.title}
作者：{pull_request.user.login}
操作：{action}
Diff URL：{pull_request.diff_url}

使用以下命令获取 diff：curl -sL {pull_request.diff_url}

审查要点：
- 安全问题（注入、认证绕过、代码中的敏感信息）
- 性能隐患（N+1 查询、无界循环、内存泄漏）
- 代码质量（命名、重复代码、错误处理）
- 新增行为是否缺少测试

发布简洁的审查意见。如果 PR 是无关紧要的文档/拼写修改，简要说明即可。" \
  --skill github-code-review \
  --deliver github_comment
```

**选项 B — 静态路由（config.yaml）：**

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      port: 8644
      secret: "your-global-secret"
      routes:
        github-pr-review:
          events: ["pull_request"]
          secret: "github-webhook-secret"
          prompt: |
            审查 PR #{pull_request.number}：{pull_request.title}
            仓库：{repository.full_name}
            作者：{pull_request.user.login}
            Diff URL：{pull_request.diff_url}
            审查安全性、性能和代码质量。
          skills: ["github-code-review"]
          deliver: "github_comment"
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{pull_request.number}"
```

然后在 GitHub 中操作：**设置 → Webhooks → 添加 Webhook** → 有效载荷 URL：`http://your-server:8644/webhooks/github-pr-review`，内容类型：`application/json`，密钥：`github-webhook-secret`，事件：**Pull requests**。

### 文档漂移检测

每周扫描已合并的 PR，找出需要更新文档的 API 变更。

**触发方式：** 定时调度（每周）

```bash
hermes cron create "0 9 * * 1" \
  "扫描 NousResearch/hermes-agent 仓库中的文档漂移。

1. 运行：gh pr list --repo NousResearch/hermes-agent --state merged --json number,title,files,mergedAt --limit 30
2. 筛选过去 7 天内合并的 PR
3. 对每个已合并的 PR，检查是否修改了：
   - 工具 Schema（tools/*.py）—— 可能需要更新 docs/reference/tools-reference.md
   - CLI 命令（hermes_cli/commands.py, hermes_cli/main.py）—— 可能需要更新 docs/reference/cli-commands.md
   - 配置选项（hermes_cli/config.py）—— 可能需要更新 docs/user-guide/configuration.md
   - 环境变量 —— 可能需要更新 docs/reference/environment-variables.md
4. 交叉验证：对每项代码变更，检查同一 PR 中是否也更新了对应的文档页面

报告代码已变更但文档未更新的任何遗漏情况。如果一切同步，回复 [SILENT]。" \
  --name "文档漂移检测" \
  --deliver telegram
```

### 依赖安全审计

每日扫描项目依赖中的已知漏洞。

**触发方式：** 定时调度（每日）

```bash
hermes cron create "0 6 * * *" \
  "对 hermes-agent 项目运行依赖安全审计。

1. cd ~/.hermes/hermes-agent && source .venv/bin/activate
2. 运行：pip audit --format json 2>/dev/null || pip audit 2>&1
3. 运行：npm audit --json 2>/dev/null（在 website/ 目录下，如果存在）
4. 检查是否存在 CVSS 评分 >= 7.0 的 CVE

如果发现漏洞：
- 列出每个漏洞的软件包名称、版本、CVE 编号、严重程度
- 检查是否有可用的新版本
- 注明是直接依赖还是传递依赖

如果没有漏洞，回复 [SILENT]。" \
  --name "依赖审计" \
  --deliver telegram
```

---

## DevOps 与监控

### 部署验证

在每次部署后触发冒烟测试。当部署完成时，你的 CI/CD 流水线会向 webhook 发起 POST 请求。

**触发方式：** API 调用（webhook）

```bash
hermes webhook subscribe deploy-verify \
  --events "deployment" \
  --prompt "A deployment just completed:
Service: {service}
Environment: {environment}
Version: {version}
Deployed by: {deployer}

Run these verification steps:
1. Check if the service is responding: curl -s -o /dev/null -w '%{http_code}' {health_url}
2. Search recent logs for errors: check the deployment payload for any error indicators
3. Verify the version matches: curl -s {health_url}/version

Report: deployment status (healthy/degraded/failed), response time, any errors found.
If healthy, keep it brief. If degraded or failed, provide detailed diagnostics." \
  --deliver telegram
```

你的 CI/CD 流水线触发它：

```bash
curl -X POST http://your-server:8644/webhooks/deploy-verify \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$(echo -n '{"service":"api","environment":"prod","version":"2.1.0","deployer":"ci","health_url":"https://api.example.com/health"}' | openssl dgst -sha256 -hmac 'your-secret' | cut -d' ' -f2)" \
  -d '{"service":"api","environment":"prod","version":"2.1.0","deployer":"ci","health_url":"https://api.example.com/health"}'
```

### 告警分诊

将监控告警与最近的变更关联起来，起草响应方案。兼容 Datadog、PagerDuty、Grafana 或任何能 POST JSON 的告警系统。

**触发方式：** API 调用（webhook）

```bash
hermes webhook subscribe alert-triage \
  --prompt "Monitoring alert received:
Alert: {alert.name}
Severity: {alert.severity}
Service: {alert.service}
Message: {alert.message}
Timestamp: {alert.timestamp}

Investigate:
1. Search the web for known issues with this error pattern
2. Check if this correlates with any recent deployments or config changes
3. Draft a triage summary with:
   - Likely root cause
   - Suggested first response steps
   - Escalation recommendation (P1-P4)

Be concise. This goes to the on-call channel." \
  --deliver slack
```

### 在线监控

每 30 分钟检查一次端点。仅在服务宕机时通知。

**触发方式：** 定时计划（每 30 分钟）

```python title="~/.hermes/scripts/check-uptime.py"
import urllib.request, json, time

ENDPOINTS = [
    {"name": "API", "url": "https://api.example.com/health"},
    {"name": "Web", "url": "https://www.example.com"},
    {"name": "Docs", "url": "https://docs.example.com"},
]

results = []
for ep in ENDPOINTS:
    try:
        start = time.time()
        req = urllib.request.Request(ep["url"], headers={"User-Agent": "Hermes-Monitor/1.0"})
        resp = urllib.request.urlopen(req, timeout=10)
        elapsed = round((time.time() - start) * 1000)
        results.append({"name": ep["name"], "status": resp.getcode(), "ms": elapsed})
    except Exception as e:
        results.append({"name": ep["name"], "status": "DOWN", "error": str(e)})

down = [r for r in results if r.get("status") == "DOWN" or (isinstance(r.get("status"), int) and r["status"] >= 500)]
if down:
    print("OUTAGE DETECTED")
    for r in down:
        print(f"  {r['name']}: {r.get('error', f'HTTP {r[\"status\"]}')} ")
    print(f"\nAll results: {json.dumps(results, indent=2)}")
else:
    print("NO_ISSUES")
```

```bash
hermes cron create "every 30m" \
  "If the script reports OUTAGE DETECTED, summarize which services are down and suggest likely causes. If NO_ISSUES, respond with [SILENT]." \
  --script ~/.hermes/scripts/check-uptime.py \
  --name "Uptime monitor" \
  --deliver telegram
```

---

## 研究与情报

### 竞品仓库侦察

监控竞品仓库中有价值的 PR、功能和架构决策。

**触发方式：** 定时计划（每日）

```bash
hermes cron create "0 8 * * *" \
  "Scout these AI agent repositories for notable activity in the last 24 hours:

Repos to check:
- anthropics/claude-code
- openai/codex
- All-Hands-AI/OpenHands
- Aider-AI/aider

For each repo:
1. gh pr list --repo <repo> --state all --json number,title,author,createdAt,mergedAt --limit 15
2. gh issue list --repo <repo> --state open --json number,title,labels,createdAt --limit 10

Focus on:
- New features being developed
- Architectural changes
- Integration patterns we could learn from
- Security fixes that might affect us too

Skip routine dependency bumps and CI fixes. If nothing notable, respond with [SILENT].
If there are findings, organize by repo with brief analysis of each item." \
  --skill competitive-pr-scout \
  --name "Competitor scout" \
  --deliver telegram
```

### AI 新闻摘要

每周汇总 AI/ML 领域的发展动态。

**触发方式：** 定时计划（每周）

```bash
hermes cron create "0 9 * * 1" \
  "Generate a weekly AI news digest covering the past 7 days:

1. Search the web for major AI announcements, model releases, and research breakthroughs
2. Search for trending ML repositories on GitHub
3. Check arXiv for highly-cited papers on language models and agents

Structure:
## Headlines (3-5 major stories)
## Notable Papers (2-3 papers with one-sentence summaries)
## Open Source (interesting new repos or major releases)
## Industry Moves (funding, acquisitions, launches)

Keep each item to 1-2 sentences. Include links. Total under 600 words." \
  --name "Weekly AI digest" \
  --deliver telegram
```

### 论文精读与笔记

每日 arXiv 扫描，将摘要保存到你的笔记系统中。

**触发方式：** 定时计划（每日）

```bash
hermes cron create "0 8 * * *" \
  "Search arXiv for the 3 most interesting papers on 'language model reasoning' OR 'tool-use agents' from the past day. For each paper, create an Obsidian note with the title, authors, abstract summary, key contribution, and potential relevance to Hermes Agent development." \
  --skill arxiv --skill obsidian \
  --name "Paper digest" \
  --deliver local
```

---

## GitHub 事件自动化

### 议题自动标记

自动标记和回复新议题。

**触发方式：** GitHub webhook

```bash
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "New GitHub issue received:
Repository: {repository.full_name}
Issue #{issue.number}: {issue.title}
Author: {issue.user.login}
Action: {action}
Body: {issue.body}
Labels: {issue.labels}

If this is a new issue (action=opened):
1. Read the issue title and body carefully
2. Suggest appropriate labels (bug, feature, docs, security, question)
3. If it's a bug report, check if you can identify the affected component from the description
4. Post a helpful initial response acknowledging the issue

If this is a label or assignment change, respond with [SILENT]." \
  --deliver github_comment
```

### CI 失败分析

分析 CI 失败并在 PR 上发布诊断信息。

**触发方式：** GitHub webhook

```yaml
# config.yaml route
platforms:
  webhook:
    enabled: true
    extra:
      routes:
        ci-failure:
          events: ["check_run"]
          secret: "ci-secret"
          prompt: |
            CI check failed:
            Repository: {repository.full_name}
            Check: {check_run.name}
            Status: {check_run.conclusion}
            PR: #{check_run.pull_requests.0.number}
            Details URL: {check_run.details_url}

            If conclusion is "failure":
            1. Fetch the log from the details URL if accessible
            2. Identify the likely cause of failure
            3. Suggest a fix
            If conclusion is "success", respond with [SILENT].
          deliver: "github_comment"
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{check_run.pull_requests.0.number}"
```

### 跨仓库自动移植变更

当一个仓库中的 PR 合并时，自动将等效变更移植到另一个仓库。

**触发方式：** GitHub webhook

```bash
hermes webhook subscribe auto-port \
  --events "pull_request" \
  --prompt "PR merged in the source repository:
Repository: {repository.full_name}
PR #{pull_request.number}: {pull_request.title}
Author: {pull_request.user.login}
Action: {action}
Merge commit: {pull_request.merge_commit_sha}

If action is 'closed' and pull_request.merged is true:
1. Fetch the diff: curl -sL {pull_request.diff_url}
2. Analyze what changed
3. Determine if this change needs to be ported to the Go SDK equivalent
4. If yes, create a branch, apply the equivalent changes, and open a PR on the target repo
5. Reference the original PR in the new PR description

If action is not 'closed' or not merged, respond with [SILENT]." \
  --skill github-pr-workflow \
  --deliver log
```

---

## 业务运营

### Stripe 支付监控

追踪支付事件并获取失败摘要。

**触发器：** API 调用（webhook）

```bash
hermes webhook subscribe stripe-payments \
  --events "payment_intent.succeeded,payment_intent.payment_failed,charge.dispute.created" \
  --prompt "Stripe event received:
Event type: {type}
Amount: {data.object.amount} cents ({data.object.currency})
Customer: {data.object.customer}
Status: {data.object.status}

For payment_intent.payment_failed:
- Identify the failure reason from {data.object.last_payment_error}
- Suggest whether this is a transient issue (retry) or permanent (contact customer)

For charge.dispute.created:
- Flag as urgent
- Summarize the dispute details

For payment_intent.succeeded:
- Brief confirmation only

Keep responses concise for the ops channel." \
  --deliver slack
```

### 每日营收摘要

每天早上编译关键业务指标。

**触发器：** 定时任务（每日）

```bash
hermes cron create "0 8 * * *" \
  "Generate a morning business metrics summary.

Search the web for:
1. Current Bitcoin and Ethereum prices
2. S&P 500 status (pre-market or previous close)
3. Any major tech/AI industry news from the last 12 hours

Format as a brief morning briefing, 3-4 bullet points max.
Deliver as a clean, scannable message." \
  --name "Morning briefing" \
  --deliver telegram
```

---

## 多技能工作流

### 安全审计流水线

结合多个技能进行全面每周安全审查。

**触发器：** 定时任务（每周）

```bash
hermes cron create "0 3 * * 0" \
  "Run a comprehensive security audit of the hermes-agent codebase.

1. Check for dependency vulnerabilities (pip audit, npm audit)
2. Search the codebase for common security anti-patterns:
   - Hardcoded secrets or API keys
   - SQL injection vectors (string formatting in queries)
   - Path traversal risks (user input in file paths without validation)
   - Unsafe deserialization (pickle.loads, yaml.load without SafeLoader)
3. Review recent commits (last 7 days) for security-relevant changes
4. Check if any new environment variables were added without being documented

Write a security report with findings categorized by severity (Critical, High, Medium, Low).
If nothing found, report a clean bill of health." \
  --skill codebase-security-audit \
  --name "Weekly security audit" \
  --deliver telegram
```

### 内容流水线

按计划研究、起草和准备内容。

**触发器：** 定时任务（每周）

```bash
hermes cron create "0 10 * * 3" \
  "Research and draft a technical blog post outline about a trending topic in AI agents.

1. Search the web for the most discussed AI agent topics this week
2. Pick the most interesting one that's relevant to open-source AI agents
3. Create an outline with:
   - Hook/intro angle
   - 3-4 key sections
   - Technical depth appropriate for developers
   - Conclusion with actionable takeaway
4. Save the outline to ~/drafts/blog-$(date +%Y%m%d).md

Keep the outline to ~300 words. This is a starting point, not a finished post." \
  --name "Blog outline" \
  --deliver local
```

---

## 快速参考

### Cron 定时语法

| 表达式 | 含义 |
|-----------|---------|
| `every 30m` | 每 30 分钟 |
| `every 2h` | 每 2 小时 |
| `0 2 * * *` | 每天凌晨 2:00 |
| `0 9 * * 1` | 每周一上午 9:00 |
| `0 9 * * 1-5` | 工作日上午 9:00 |
| `0 3 * * 0` | 每周日凌晨 3:00 |
| `0 */6 * * *` | 每 6 小时 |

### 投递目标

| 目标 | 标志 | 说明 |
|--------|------|-------|
| 当前对话 | `--deliver origin` | 默认——投递到任务创建的位置 |
| 本地文件 | `--deliver local` | 保存输出，不发送通知 |
| Telegram | `--deliver telegram` | 主频道，或使用 `telegram:CHAT_ID` 指定 |
| Discord | `--deliver discord` | 主频道，或使用 `discord:CHANNEL_ID` |
| Slack | `--deliver slack` | 主频道 |
| 短信 | `--deliver sms:+15551234567` | 直接发送到手机号码 |
| 特定帖子 | `--deliver telegram:-100123:456` | Telegram 论坛主题 |

### Webhook 模板变量

| 变量 | 描述 |
|----------|-------------|
| `{pull_request.title}` | PR 标题 |
| `{issue.issue_number}` | Issue 编号 |
| `{repository.full_name}` | `owner/repo` |
| `{action}` | 事件动作（opened, closed 等） |
| `{__raw__}` | 完整 JSON 载荷（截断至 4000 字符） |
| `{sender.login}` | 触发事件的 GitHub 用户 |

### [SILENT] 模式

当定时任务的响应包含 `[SILENT]` 时，投递将被抑制。在安静运行时使用此模式避免通知轰炸：

```
If nothing noteworthy happened, respond with [SILENT].
```

这意味着只有当智能体有内容需要报告时，你才会收到通知。