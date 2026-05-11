---
sidebar_position: 15
title: "自动化模板"
description: "即用型自动化方案——定时任务、GitHub 事件触发器、API 网络钩子及多技能工作流"
---

# 自动化模板

复制粘贴常见自动化模式的方案。每个模板都使用 Hermes 内置的 [定时调度器](/docs/user-guide/features/cron) 进行基于时间的触发，使用 [网络钩子平台](/docs/user-guide/messaging/webhooks) 进行基于事件的触发。

每个模板都适用于 **任何模型** —— 不局限于单一提供商。

:::tip 三种触发类型
| 触发类型 | 如何实现 | 工具 |
|---------|-----|------|
| **定时调度** | 按周期运行（每小时、每晚、每周） | `cronjob` 工具或 `/cron` 斜杠命令 |
| **GitHub 事件** | 在 PR 开启、推送、议题、CI 结果时触发 | 网络钩子平台 (`hermes webhook subscribe`) |
| **API 调用** | 外部服务将 JSON 发布到您的端点 | 网络钩子平台（config.yaml 路由或 `hermes webhook subscribe`) |

这三种类型都支持将信息推送到 Telegram、Discord、Slack、短信、电子邮件、GitHub 评论或本地文件。
:::

---

## 开发工作流

### 每夜待办事项梳理

每晚为新的议题进行标注、优先级排序和总结。将摘要推送到您的团队频道。

**触发类型：** 定时调度（每晚）

```bash
hermes cron create "0 2 * * *" \
  "您是一名项目经理，负责梳理 NousResearch/hermes-agent GitHub 仓库。

1. 运行: gh issue list --repo NousResearch/hermes-agent --state open --json number,title,labels,author,createdAt --limit 30
2. 识别过去 24 小时内开启的议题
3. 对于每个新议题：
   - 建议一个优先级标签（P0-关键, P1-高, P2-中, P3-低）
   - 建议一个类别标签（bug, feature, docs, security）
   - 编写一行梳理说明
4. 总结：总待处理议题数、今日新增数、按优先级分类情况

格式化为一份整洁的摘要。如果没有新议题，请回复 [SILENT]。" \
  --name "每夜待办事项梳理" \
  --deliver telegram
```

### 自动拉取请求代码审查

在每次开启拉取请求时自动进行审查。直接将审查评论发布到 PR 上。

**触发类型：** GitHub 网络钩子

**选项 A —— 动态订阅（CLI）：**

```bash
hermes webhook subscribe github-pr-review \
  --events "pull_request" \
  --prompt "审查此拉取请求：
仓库: {repository.full_name}
PR #{pull_request.number}: {pull_request.title}
作者: {pull_request.user.login}
操作: {action}
差异链接: {pull_request.diff_url}

使用以下命令获取差异: curl -sL {pull_request.diff_url}

审查以下方面：
- 安全问题（注入、认证绕过、代码中的密钥）
- 性能问题（N+1 查询、无限循环、内存泄漏）
- 代码质量（命名、重复、错误处理）
- 新行为是否缺少测试

发布一份简洁的审查。如果 PR 是一个简单的文档/拼写错误更改，请简要说明。" \
  --skill github-code-review \
  --deliver github_comment
```

**选项 B —— 静态路由（config.yaml）：**

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
            审查 PR #{pull_request.number}: {pull_request.title}
            仓库: {repository.full_name}
            作者: {pull_request.user.login}
            差异链接: {pull_request.diff_url}
            审查安全性、性能和代码质量。
          skills: ["github-code-review"]
          deliver: "github_comment"
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{pull_request.number}"
```

然后在 GitHub 中：**Settings → Webhooks → Add webhook** → 载荷 URL: `http://your-server:8644/webhooks/github-pr-review`，内容类型: `application/json`，密钥: `github-webhook-secret`，事件: **Pull requests**。

### 文档差异检测

每周扫描已合并的 PR，以发现需要更新文档的 API 变更。

**触发类型：** 定时调度（每周）

```bash
hermes cron create "0 9 * * 1" \
  "扫描 NousResearch/hermes-agent 仓库的文档差异。

1. 运行: gh pr list --repo NousResearch/hermes-agent --state merged --json number,title,files,mergedAt --limit 30
2. 筛选过去 7 天内合并的 PR
3. 对于每个已合并的 PR，检查它是否修改了：
   - 工具模式（tools/*.py） —— 可能需要更新 docs/reference/tools-reference.md
   - CLI 命令（hermes_cli/commands.py, hermes_cli/main.py） —— 可能需要更新 docs/reference/cli-commands.md
   - 配置选项（hermes_cli/config.py） —— 可能需要更新 docs/user-guide/configuration.md
   - 环境变量 —— 可能需要更新 docs/reference/environment-variables.md
4. 交叉检查：对于每个代码更改，检查相应的文档页面是否也在同一个 PR 中更新了。

报告代码已更改但文档未更新的所有差异。如果一切同步，请回复 [SILENT]。" \
  --name "文档差异检测" \
  --deliver telegram
```

### 依赖安全审计

每日扫描项目依赖项中的已知漏洞。

**触发类型：** 定时调度（每日）

```bash
hermes cron create "0 6 * * *" \
  "对 hermes-agent 项目运行依赖项安全审计。

1. cd ~/.hermes/hermes-agent && source .venv/bin/activate
2. 运行: pip audit --format json 2>/dev/null || pip audit 2>&1
3. 运行: npm audit --json 2>/dev/null（如果存在 website/ 目录）
4. 检查任何 CVSS 分数 >= 7.0 的 CVE

如果发现漏洞：
- 列出每个漏洞的包名、版本、CVE ID、严重性
- 检查是否有可用的升级
- 注明它是直接依赖项还是传递依赖项

如果没有漏洞，请回复 [SILENT]。" \
  --name "依赖项审计" \
  --deliver telegram
```

---

## DevOps & Monitoring

### 部署验证

每次部署后触发冒烟测试。你的 CI/CD 管道在部署完成时向 webhook 发送 POST 请求。

**触发方式:** API 调用 (webhook)

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

你的 CI/CD 管道触发它：

```bash
curl -X POST http://your-server:8644/webhooks/deploy-verify \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$(echo -n '{"service":"api","environment":"prod","version":"2.1.0","deployer":"ci","health_url":"https://api.example.com/health"}' | openssl dgst -sha256 -hmac 'your-secret' | cut -d' ' -f2)" \
  -d '{"service":"api","environment":"prod","version":"2.1.0","deployer":"ci","health_url":"https://api.example.com/health"}'
```

### 告警分流

将监控告警与近期变更相关联，以起草响应。支持 Datadog、PagerDuty、Grafana 或任何可以发送 JSON 的告警系统。

**触发方式:** API 调用 (webhook)

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

### 正常运行时间监控

每 30 分钟检查一次端点。仅在出现故障时通知。

**触发方式:** 定时任务（每 30 分钟）

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

## Research & Intelligence

### 竞争对手代码库侦察

监控竞争对手代码库中有趣的 PR、功能特性和架构决策。

**触发方式:** 定时任务（每日）

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

AI/ML 领域进展的每周总结。

**触发方式:** 定时任务（每周）

```bash
hermes cron create "0 9 * * 1" \
  "Generate a weekly AI news digest covering the past 7 days:

1. Search the web for major AI announcements, model releases, and research breakthroughs
2. Search for trending ML repositories on GitHub
3. Check arXiv for highly-cited papers on language models and agents

Structure:
```

## 头条资讯（3-5条主要新闻）

## 重要论文（2-3篇论文，附一句话摘要）

## 开源项目（有趣的新仓库或重大发布）

## 行业动态（融资、收购、发布）

每条内容保持1-2句话。包含链接。总计不超过600字。" \
  --name "每周AI文摘" \
  --deliver telegram
```

### 附笔记的论文摘要

每日扫描arXiv，将摘要保存到你的笔记系统。

**触发方式：** 定时计划（每日）

```bash
hermes cron create "0 8 * * *" \
  "搜索arXiv，查找过去一天内关于'语言模型推理'或'工具使用智能体'最有趣的3篇论文。为每篇论文创建一条Obsidian笔记，包括标题、作者、摘要概要、关键贡献点，以及与Hermes Agent开发的潜在关联性。" \
  --skill arxiv --skill obsidian \
  --name "论文摘要" \
  --deliver local
```

---

## GitHub事件自动化

### 问题自动标记

自动为新问题添加标签并回复。

**触发方式：** GitHub网络钩子

```bash
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "收到新GitHub问题：
仓库：{repository.full_name}
问题 #{issue.number}: {issue.title}
作者：{issue.user.login}
动作：{action}
正文：{issue.body}
标签：{issue.labels}

如果这是一个新问题（动作=opened）：
1. 仔细阅读问题标题和正文
2. 建议适当的标签（bug, feature, docs, security, question）
3. 如果是错误报告，尝试从描述中识别受影响的组件
4. 发布一条有用的初始回复，确认收到问题

如果是标签或指派变更，请回复 [SILENT]。" \
  --deliver github_comment
```

### CI失败分析

分析CI失败并在PR上发布诊断信息。

**触发方式：** GitHub网络钩子

```yaml
# config.yaml 路由配置
platforms:
  webhook:
    enabled: true
    extra:
      routes:
        ci-failure:
          events: ["check_run"]
          secret: "ci-secret"
          prompt: |
            CI检查失败：
            仓库：{repository.full_name}
            检查：{check_run.name}
            状态：{check_run.conclusion}
            PR: #{check_run.pull_requests.0.number}
            详情URL：{check_run.details_url}

            如果结论是"failure"：
            1. 如果可访问，从详情URL获取日志
            2. 识别失败的可能原因
            3. 建议修复方案
            如果结论是"success"，请回复 [SILENT]。
          deliver: "github_comment"
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{check_run.pull_requests.0.number}"
```

### 跨仓库自动移植变更

当一个仓库的PR合并后，自动将等效变更移植到另一个仓库。

**触发方式：** GitHub网络钩子

```bash
hermes webhook subscribe auto-port \
  --events "pull_request" \
  --prompt "源仓库中PR已合并：
仓库：{repository.full_name}
PR #{pull_request.number}: {pull_request.title}
作者：{pull_request.user.login}
动作：{action}
合并提交：{pull_request.merge_commit_sha}

如果动作是'closed'且pull_request.merged为true：
1. 获取差异：curl -sL {pull_request.diff_url}
2. 分析变更内容
3. 确定此变更是否需要移植到Go SDK等效版本
4. 如果需要，创建分支，应用等效变更，并在目标仓库打开PR
5. 在新PR描述中引用原始PR

如果动作不是'closed'或未合并，请回复 [SILENT]。" \
  --skill github-pr-workflow \
  --deliver log
```

---

## 业务运营

### Stripe支付监控

跟踪支付事件并获取失败摘要。

**触发方式：** API调用（网络钩子）

```bash
hermes webhook subscribe stripe-payments \
  --events "payment_intent.succeeded,payment_intent.payment_failed,charge.dispute.created" \
  --prompt "收到Stripe事件：
事件类型：{type}
金额：{data.object.amount} 分 ({data.object.currency})
客户：{data.object.customer}
状态：{data.object.status}

对于payment_intent.payment_failed：
- 从{data.object.last_payment_error}识别失败原因
- 建议这是临时问题（重试）还是永久问题（联系客户）

对于charge.dispute.created：
- 标记为紧急
- 总结争议详情

对于payment_intent.succeeded：
- 仅作简要确认

回复请简洁，用于运营频道。" \
  --deliver slack
```

### 每日营收摘要

每天早上汇编关键业务指标。

**触发方式：** 定时计划（每日）

```bash
hermes cron create "0 8 * * *" \
  "生成一份晨间业务指标摘要。

搜索网络获取：
1. 当前比特币和以太坊价格
2. 标普500指数状态（盘前或上一收盘价）
3. 过去12小时内任何重大的科技/AI行业新闻

格式为简洁的晨间简报，最多3-4个要点。
以清晰、易于浏览的信息形式呈现。" \
  --name "晨间简报" \
  --deliver telegram
```

---

## 多技能工作流

### 安全审计管道

结合多个技能进行每周的综合安全审查。

**触发方式：** 定时计划（每周）

```bash
hermes cron create "0 3 * * 0" \
  "对hermes-agent代码库运行综合安全审计。

1. 检查依赖项漏洞（pip audit, npm audit）
2. 搜索代码库中常见的安全反模式：
   - 硬编码的密钥或API密钥
   - SQL注入风险（查询中使用字符串格式化）
   - 路径遍历风险（用户输入用于文件路径而未验证）
   - 不安全的反序列化（pickle.loads, yaml.load未使用SafeLoader）
3. 审查最近的提交（过去7天）中与安全相关的变更
4. 检查是否有新增的环境变量未被记录

撰写一份安全报告，按严重程度（关键、高、中、低）分类发现的问题。
如果未发现任何问题，则报告健康状况良好。" \
  --skill codebase-security-audit \
  --name "每周安全审计" \
  --deliver telegram
```

### 内容管道

按计划研究、起草并准备内容。

**触发方式：** 定时计划（每周）

```bash
hermes cron create "0 10 * * 3" \
  "研究并起草一篇关于AI智能体热门话题的技术博文大纲。

1. 搜索网络，了解本周讨论最多的AI智能体话题
2. 选择一个与开源AI智能体最相关的有趣话题
3. 创建一个大纲，包括：
   - 引言/开篇角度
   - 3-4个关键部分
   - 适合开发者的专业深度
   - 附有可操作建议的结论
4. 将大纲保存到 ~/drafts/blog-$(date +%Y%m%d).md

大纲约300字。这是起点，非成稿。" \
  --name "博文大纲" \
  --deliver local
```

---

## 快速参考

### 定时计划语法

| 表达式 | 含义 |
|-----------|---------|
| `every 30m` | 每30分钟 |
| `every 2h` | 每2小时 |
| `0 2 * * *` | 每天凌晨2:00 |
| `0 9 * * 1` | 每周一上午9:00 |
| `0 9 * * 1-5` | 工作日上午9:00 |
| `0 3 * * 0` | 每周日凌晨3:00 |
| `0 */6 * * *` | 每6小时 |

### 投递目标

| 目标 | 标志 | 说明 |
|--------|------|-------|
| 同一聊天 | `--deliver origin` | 默认 — 投递至任务创建处 |
| 本地文件 | `--deliver local` | 保存输出，无通知 |
| Telegram | `--deliver telegram` | 主频道，或使用 `telegram:CHAT_ID` 指定特定聊天 |
| Discord | `--deliver discord` | 主频道，或使用 `discord:CHANNEL_ID` |
| Slack | `--deliver slack` | 主频道 |
| 短信 | `--deliver sms:+15551234567` | 直接发送至电话号码 |
| 特定主题帖 | `--deliver telegram:-100123:456` | Telegram论坛主题 |

### 网络钩子模板变量

| 变量 | 描述 |
|----------|-------------|
| `{pull_request.title}` | PR标题 |
| `{issue.number}` | 问题编号 |
| `{repository.full_name}` | `所有者/仓库名` |
| `{action}` | 事件动作（opened, closed等） |
| `{__raw__}` | 完整的JSON载荷（在4000字符处截断） |
| `{sender.login}` | 触发事件的GitHub用户 |

### [SILENT] 模式

当定时任务的响应中包含 `[SILENT]` 时，投递将被抑制。这可用于避免在运行平稳时收到通知：

```
如果没有值得注意的事情发生，请回复 [SILENT]。
```

这意味着你只会在智能体有内容需要报告时收到通知。