---
sidebar_position: 15
title: "自动化模板"
description: "即用型自动化配方——定时任务、GitHub事件触发器、API Webhook和多技能工作流"
---

# 自动化模板

为常见的自动化模式提供可复制粘贴的配方。每个模板使用 Hermes 内置的 [cron 调度器](/docs/user-guide/features/cron) 进行基于时间的触发，并使用 [Webhook 平台](/docs/user-guide/messaging/webhooks) 进行事件驱动的触发。

所有模板均可与**任何模型**配合使用，不局限于单一提供商。

:::tip 三种触发器类型
| 触发器 | 方式 | 工具 |
|---------|-----|------|
| **定时任务** | 按周期运行（每小时、每晚、每周） | `cronjob` 工具或 `/cron` 斜杠命令 |
| **GitHub事件** | 在 PR 打开、推送、Issue、CI 结果时触发 | Webhook 平台 (`hermes webhook subscribe`) |
| **API 调用** | 外部服务向您的端点 POST JSON 数据 | Webhook 平台 (config.yaml 路由或 `hermes webhook subscribe`) |

所有三种触发器都支持发送到 Telegram、Discord、Slack、SMS、电子邮件、GitHub 注释或本地文件。
:::

---

## 开发工作流

### 夜间积压任务分类

每晚对新 Issue 进行标签化、优先级排序和总结。并将摘要发送到您的团队频道。

**触发器:** 定时任务（每日）

```bash
hermes cron create "0 2 * * *" \
  "您是一名正在处理 NousResearch/hermes-agent GitHub 仓库的项目经理。

1. 运行: gh issue list --repo NousResearch/hermes-agent --state open --json number,title,labels,author,createdAt --limit 30
2. 识别过去 24 小时打开的 Issue
3. 对于每个新 Issue:
   - 建议一个优先级标签（P0-关键、P1-高、P2-中、P3-低）
   - 建议一个类别标签（bug, feature, docs, security）
   - 写一条单行分类备注
4. 总结：总开放 Issue 数、今日新增数、按优先级分布

格式化为干净的摘要。如果没有新 Issue，则回复 [SILENT]。" \
  --name "夜间积压任务分类" \
  --deliver telegram
```

### 自动 PR 代码审查

在每次拉取请求（PR）打开时自动进行审查。直接在 PR 上发布审查评论。

**触发器:** GitHub Webhook

**选项 A — 动态订阅 (CLI):**

```bash
hermes webhook subscribe github-pr-review \
  --events "pull_request" \
  --prompt "审查此拉取请求：
仓库: {repository.full_name}
PR #{pull_request.number}: {pull_request.title}
作者: {pull_request.user.login}
操作: {action}
差异 URL: {pull_request.diff_url}

使用以下命令获取差异：curl -sL {pull_request.diff_url}

审查内容：
- 安全问题（注入、认证绕过、代码中的密钥）
- 性能问题（N+1 查询、无限循环、内存泄漏）
- 代码质量（命名、重复、错误处理）
- 新行为的缺失测试

发布简洁的审查意见。如果 PR 是微不足道的文档/拼写错误修改，请简要说明。" \
  --skills "github-code-review" \
  --deliver github_comment
```

**选项 B — 静态路由 (config.yaml):**

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
            差异 URL: {pull_request.diff_url}
            请审查安全、性能和代码质量。
          skills: ["github-code-review"]
          deliver: "github_comment"
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{pull_request.number}"
```

然后在 GitHub 中：**设置 → Webhooks → 添加 Webhook** → Payload URL: `http://your-server:8644/webhooks/github-pr-review`，内容类型: `application/json`，Secret: `github-webhook-secret`，事件: **拉取请求**。

### 文档漂移检测

每周扫描已合并的 PR，查找需要更新文档的 API 变更。

**触发器:** 定时任务（每周）

```bash
hermes cron create "0 9 * * 1" \
  "扫描 NousResearch/hermes-agent 仓库，查找文档漂移。

1. 运行: gh pr list --repo NousResearch/hermes-agent --state merged --json number,title,files,mergedAt --limit 30
2. 筛选过去 7 天合并的 PR
3. 对于每个已合并的 PR，检查它是否修改了：
   - 工具模式（tools/*.py）— 可能需要更新 docs/reference/tools-reference.md
   - CLI 命令（hermes_cli/commands.py, hermes_cli/main.py）— 可能需要更新 docs/reference/cli-commands.md
   - 配置选项（hermes_cli/config.py）— 可能需要更新 docs/user-guide/configuration.md
   - 环境变量 — 可能需要更新 docs/reference/environment-variables.md
4. 交叉引用：对于每个代码更改，检查相应的文档页面是否也在同一个 PR 中更新了

报告任何代码已更改但文档未同步的差距。如果一切同步，则回复 [SILENT]。" \
  --name "文档漂移检测" \
  --deliver telegram
```

### 依赖安全审计

每日扫描项目依赖中的已知漏洞。

**触发器:** 定时任务（每日）

```bash
hermes cron create "0 6 * * *" \
  "对 hermes-agent 项目运行依赖安全审计。

1. cd ~/.hermes/hermes-agent && source .venv/bin/activate
2. 运行: pip audit --format json 2>/dev/null || pip audit 2>&1
3. 运行: npm audit --json 2>/dev/null (如果存在 website/ 目录)
4. 检查是否有 CVSS 分数 >= 7.0 的 CVE

如果发现漏洞：
- 列出每个漏洞，包括包名、版本、CVE ID、严重性
- 检查是否可用升级
- 记录是直接依赖还是传递依赖

如果没有漏洞，则回复 [SILENT]。" \
  --name "依赖审计" \
  --deliver telegram
```

---

## DevOps与监控

### 部署验证

每次部署后触发烟雾测试。您的 CI/CD 管道在部署完成后会向 Webhook POST 数据。

**触发器:** API 调用 (Webhook)

```bash
hermes webhook subscribe deploy-verify \
  --events "deployment" \
  --prompt "部署刚刚完成：
服务: {service}
环境: {environment}
版本: {version}
部署者: {deployer}

运行以下验证步骤：
1. 检查服务是否响应: curl -s -o /dev/null -w '%{http_code}' {health_url}
2. 搜索最近的日志以查找错误：检查部署载荷中是否有任何错误指标
3. 验证版本是否匹配: curl -s {health_url}/version

报告：部署状态（健康/降级/失败）、响应时间、发现的任何错误。
如果健康，请保持简洁。如果降级或失败，请提供详细诊断信息。" \
  --deliver telegram
```

您的 CI/CD 管道触发它：

```bash
curl -X POST http://your-server:8644/webhooks/deploy-verify \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$(echo -n '{"service":"api","environment":"prod","version":"2.1.0","deployer":"ci","health_url":"https://api.example.com/health"}' | openssl dgst -sha256 -hmac 'your-secret' | cut -d' ' -f2)" \
  -d '{"service":"api","environment":"prod","version":"2.1.0","deployer":"ci","health_url":"https://api.example.com/health"}'
```

### 告警分类

将监控告警与最近的变更关联，以起草回复。兼容 Datadog、PagerDuty、Grafana 或任何可以 POST JSON 的告警系统。

**触发器:** API 调用 (Webhook)

```bash
hermes webhook subscribe alert-triage \
  --prompt "收到监控告警：
告警: {alert.name}
严重性: {alert.severity}
服务: {alert.service}
消息: {alert.message}
时间戳: {alert.timestamp}

调查内容：
1. 在网络上搜索此错误模式的已知问题
2. 检查这是否与任何最近的部署或配置更改相关
3. 起草分类摘要，包含：
   - 可能的根本原因
   - 建议的初步响应步骤
   - 升级建议（P1-P4）

保持简洁。此消息发送到值班频道。" \
  --deliver slack
```

### 正常运行时间监控

每 30 分钟检查一次端点。只有在出现故障时才发送通知。

**触发器:** 定时任务（每 30 分钟）

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
    print(f"\n所有结果: {json.dumps(results, indent=2)}")
else:
    print("NO_ISSUES")
```

```bash
hermes cron create "every 30m" \
  "如果脚本报告 OUTAGE DETECTED，请总结哪些服务宕机，并提出可能的原因。如果 NO_ISSUES，则回复 [SILENT]。" \
  --script ~/.hermes/scripts/check-uptime.py \
  --name "正常运行时间监控" \
  --deliver telegram
```

---

## 研究与情报

### 竞争对手仓库侦察

监控竞争对手的仓库，查找有趣的 PR、功能和架构决策。

**触发器:** 定时任务（每日）

```bash
hermes cron create "0 8 * * *" \
  "侦察这些 AI 代理仓库，查找过去 24 小时内值得注意的活动：

需要检查的仓库：
- anthropics/claude-code
- openai/codex
- All-Hands-AI/OpenHands
- Aider-AI/aider

对于每个仓库：
1. gh pr list --repo <repo> --state all --json number,title,author,createdAt,mergedAt --limit 15
2. gh issue list --repo <repo> --state open --json number,title,labels,createdAt --limit 10

关注点：
- 开发的新功能
- 架构变更
- 我们可以学习的集成模式
- 可能也会影响我们的安全修复

跳过常规的依赖升级和 CI 修复。如果没有值得注意的发现，则回复 [SILENT]。
如果有发现，则按仓库组织，并对每个项目进行简要分析。" \
  --skills "competitive-pr-scout" \
  --name "竞争对手侦察" \
  --deliver telegram
```

### AI 新闻摘要

每周总结 AI/ML 发展。

**触发器:** 定时任务（每周）

```bash
hermes cron create "0 9 * * 1" \
  "生成一份涵盖过去 7 天的周 AI 新闻摘要：

1. 在网络上搜索主要的 AI 宣布、模型发布和研究突破
2. 搜索 GitHub 上热门的 ML 仓库
3. 检查 arXiv 上关于语言模型和代理的高引用论文

结构：
## 重点新闻 (3-5 条主要报道)
## 值得关注的论文 (2-3 篇，附单句摘要)
## 开源项目 (有趣的新仓库或重大发布)
## 行业动态 (融资、收购、发布)

每项内容控制在 1-2 句话。包含链接。总字数少于 600 字。" \
  --name "周 AI 摘要" \
  --deliver telegram
```

### 带注释的论文摘要

每日 arXiv 扫描，并将摘要保存到您的笔记系统中。

**触发器:** 定时任务（每日）

```bash
hermes cron create "0 8 * * *" \
  "搜索过去一天内关于“语言模型推理”或“工具使用代理”最有趣的 3 篇论文。对于每篇论文，创建一个包含标题、作者、摘要、关键贡献和对 Hermes Agent 开发潜在相关性的 Obsidian 笔记。" \
  --skills "arxiv,obsidian" \
  --name "论文摘要" \
  --deliver local
```

---

## GitHub 事件自动化

### Issue 自动标签化

自动为新 Issue 添加标签并回复。

**触发器:** GitHub Webhook

```bash
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "收到新的 GitHub Issue：
仓库: {repository.full_name}
Issue #{issue.number}: {issue.title}
作者: {issue.user.login}
操作: {action}
正文: {issue.body}
标签: {issue.labels}

如果这是一个新 Issue (action=opened)：
1. 仔细阅读 Issue 标题和正文
2. 建议合适的标签（bug, feature, docs, security, question）
3. 如果是 bug 报告，检查是否能从描述中识别出受影响的组件
4. 发布一个有帮助的初步回复，确认 Issue 已收到

如果只是标签或分配变更，则回复 [SILENT]。" \
  --deliver github_comment
```

### CI 失败分析

分析 CI 失败，并在 PR 上发布诊断报告。

**触发器:** GitHub Webhook

```yaml
# config.yaml 路由
platforms:
  webhook:
    enabled: true
    extra:
      routes:
        ci-failure:
          events: ["check_run"]
          secret: "ci-secret"
          prompt: |
            CI 检查失败：
            仓库: {repository.full_name}
            检查: {check_run.name}
            状态: {check_run.conclusion}
            PR: #{check_run.pull_requests.0.number}
            详情 URL: {check_run.details_url}

            如果结论是 "failure":
            1. 如果可访问，获取详情 URL 的日志
            2. 识别失败的可能原因
            3. 建议修复方法
            如果结论是 "success"，则回复 [SILENT]。
          deliver: "github_comment"
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{check_run.pull_requests.0.number}"
```

### 跨仓库自动端口变更

当一个仓库的 PR 合并后，自动将等效的变更移植到另一个仓库。

**触发器:** GitHub Webhook

```bash
hermes webhook subscribe auto-port \
  --events "pull_request" \
  --prompt "PR 在源仓库合并：
仓库: {repository.full_name}
PR #{pull_request.number}: {pull_request.title}
作者: {pull_request.user.login}
操作: {action}
合并提交: {pull_request.merge_commit_sha}

如果 action 是 'closed' 且 pull_request.merged 为 true：
1. 获取差异：curl -sL {pull_request.diff_url}
2. 分析发生了什么变化
3. 判断此变更是否需要移植到 Go SDK 等效版本
4. 如果是，创建分支，应用等效变更，并在目标仓库打开一个 PR
5. 在新 PR 描述中引用原始 PR

如果 action 不是 'closed' 或未合并，则回复 [SILENT]。" \
  --skills "github-pr-workflow" \
  --deliver log
```

---

## 业务运营

### Stripe 付款监控

跟踪支付事件，并获取失败的摘要。

**触发器:** API 调用 (Webhook)

```bash
hermes webhook subscribe stripe-payments \
  --events "payment_intent.succeeded,payment_intent.payment_failed,charge.dispute.created" \
  --prompt "收到 Stripe 事件：
事件类型: {type}
金额: {data.object.amount} 美分 ({data.object.currency})
客户: {data.object.customer}
状态: {data.object.status}

对于 payment_intent.payment_failed：
- 从 {data.object.last_payment_error} 识别失败原因
- 建议这是否是瞬时问题（重试）还是永久问题（联系客户）

对于 charge.dispute.created：
- 标记为紧急
- 总结争议详情

对于 payment_intent.succeeded：
- 仅提供简短确认

为运营频道保持回复简洁。" \
  --deliver slack
```

### 日收入摘要

每天早上汇总关键业务指标。

**触发器:** 定时任务（每日）

```bash
hermes cron create "0 8 * * *" \
  "生成一份早间业务指标摘要。

在网络上搜索：
1. 当前比特币和以太坊价格
2. 标准普尔 500 指数状态（盘前或前一个收盘价）
3. 过去 12 小时内任何主要的科技/AI 行业新闻

格式化为简短的早间简报，最多 3-4 个要点。
作为干净、易读的消息发送。" \
  --name "早间简报" \
  --deliver telegram
```

---

## 多技能工作流

### 安全审计管道

结合多个技能，进行全面的每周安全审查。

**触发器:** 定时任务（每周）

```bash
hermes cron create "0 3 * * 0" \
  "对 hermes-agent 代码库运行全面的安全审计。

1. 检查依赖漏洞（pip audit, npm audit）
2. 搜索代码库中常见的安全反模式：
   - 硬编码的密钥或 API 密钥
   - SQL 注入向量（查询中的字符串格式化）
   - 路径遍历风险（未经验证的用户输入文件路径）
   - 不安全的反序列化（pickle.loads, yaml.load without SafeLoader）
3. 审查最近的提交（过去 7 天）中与安全相关的变更
4. 检查是否新增了未记录的环境变量

撰写一份安全报告，按严重性（关键、高、中、低）分类发现。
如果没有发现，则报告安全无虞。" \
  --skills "codebase-security-audit" \
  --name "每周安全审计" \
  --deliver telegram
```

### 内容管道

按计划研究、起草和准备内容。

**触发器:** 定时任务（每周）

```bash
hermes cron create "0 10 * * 3" \
  "研究并起草一篇关于 AI 代理领域热门话题的技术博客大纲。

1. 在网络上搜索本周讨论最多的 AI 代理话题
2. 选择一个与开源 AI 代理相关的最有趣的话题
3. 创建大纲，包含：
   - 吸引人的引言/角度
   - 3-4 个关键章节
   - 适合开发人员的技术深度
   - 包含可操作建议的结论
4. 将大纲保存到 ~/drafts/blog-$(date +%Y%m%d).md

大纲控制在约 300 字。这是一个起点，而非最终文章。" \
  --name "博客大纲" \
  --deliver local
```

---

## 快速参考

### Cron 调度语法

| 表达式 | 含义 |
|-----------|---------|
| `every 30m` | 每 30 分钟 |
| `every 2h` | 每 2 小时 |
| `0 2 * * *` | 每天凌晨 2:00 |
| `0 9 * * 1` | 每周一上午 9:00 |
| `0 9 * * 1-5` | 工作日上午 9:00 |
| `0 3 * * 0` | 每周日凌晨 3:00 |
| `0 */6 * * *` | 每 6 小时 |

### 交付目标

| 目标 | 标志 | 说明 |
|--------|------|-------|
| 同一聊天 | `--deliver origin` | 默认 — 发送到创建任务的源头 |
| 本地文件 | `--deliver local` | 保存输出，不发送通知 |
| Telegram | `--deliver telegram` | 主频道，或 `telegram:CHAT_ID` 指定频道 |
| Discord | `--deliver discord` | 主频道，或 `discord:CHANNEL_ID` |
| Slack | `--deliver slack` | 主频道 |
| SMS | `--deliver sms:+15551234567` | 直接发送到电话号码 |
| 特定主题 | `--deliver telegram:-100123:456` | Telegram 论坛主题 |

### Webhook 模板变量

| 变量 | 描述 |
|----------|-------------|
| `{pull_request.title}` | PR 标题 |
| `{issue.number}` | Issue 号码 |
| `{repository.full_name}` | `owner/repo` |
| `{action}` | 事件操作（opened, closed 等） |
| `{__raw__}` | 完整的 JSON 载荷（截断至 4000 字符） |
| `{sender.login}` | 触发事件的 GitHub 用户 |

### [SILENT] 模式

当 cron 任务的回复包含 `[SILENT]` 时，将抑制交付。使用此模式可避免在无事发生时接收到通知垃圾信息：

```
如果没有任何值得注意的发现，则回复 [SILENT]。
```

这意味着只有当代理有报告内容时，您才会收到通知。