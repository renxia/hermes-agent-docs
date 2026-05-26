---
sidebar_position: 15
title: "自动化模板"
description: "开箱即用的自动化方案 —— 定时任务、GitHub 事件触发器、API 网络钩子和多技能工作流"
---

# 自动化模板

常见自动化模式的即用方案。每个模板都使用 Hermes 内置的 [cron 调度器](/user-guide/features/cron) 进行基于时间的触发，以及 [网络钩子平台](/user-guide/messaging/webhooks) 进行基于事件的触发。

每个模板都适用于**任何模型** —— 不局限于单一提供商。

:::tip 三种触发器类型
| 触发器 | 方式 | 工具 |
|---------|-----|------|
| **计划任务** | 按周期运行（每小时、每晚、每周） | `cronjob` 工具或 `/cron` 斜杠命令 |
| **GitHub 事件** | 在 PR 创建、推送、议题、CI 结果时触发 | 网络钩子平台 (`hermes webhook subscribe`) |
| **API 调用** | 外部服务向您的端点发送 JSON 数据 | 网络钩子平台 (config.yaml 路由或 `hermes webhook subscribe`) |

所有三种都支持发送到 Telegram、Discord、Slack、短信、邮箱、GitHub 评论或本地文件。
:::

---

## 开发工作流

### 每晚待办事项分流

每晚自动标记、优先排序并总结新议题。将摘要发送到您的团队频道。

**触发器：** 计划任务 (每晚)

```bash
hermes cron create "0 2 * * *" \
  "您是一名项目经理，负责 NousResearch/hermes-agent GitHub 仓库的议题分流。

1. 运行：gh issue list --repo NousResearch/hermes-agent --state open --json number,title,labels,author,createdAt --limit 30
2. 识别过去 24 小时内打开的议题
3. 对于每个新议题：
   - 建议一个优先级标签（P0-严重，P1-高，P2-中，P3-低）
   - 建议一个类别标签（bug，功能，文档，安全）
   - 写一行分流说明
4. 总结：打开的议题总数、今天新增的、按优先级分类的情况

格式化为清晰的摘要。如果没有新议题，请回复 [SILENT]。" \
  --name "每晚待办事项分流" \
  --deliver telegram
```

### 自动化 PR 代码审查

每个拉取请求在创建时都会被自动审查。审查评论会直接发布在 PR 上。

**触发器：** GitHub 网络钩子

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

审查要点：
- 安全问题（注入、绕过身份验证、代码中的密钥）
- 性能问题（N+1 查询、无界循环、内存泄漏）
- 代码质量（命名、重复、错误处理）
- 新行为缺少测试

发布简洁的审查。如果 PR 是简单的文档/拼写修正，请简要说明。" \
  --skill github-code-review \
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
            审查安全性、性能和代码质量。
          skills: ["github-code-review"]
          deliver: "github_comment"
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{pull_request.number}"
```

然后在 GitHub 中：**Settings → Webhooks → Add webhook** → Payload URL: `http://your-server:8644/webhooks/github-pr-review`, Content type: `application/json`, Secret: `github-webhook-secret`, Events: **Pull requests**。

### 文档同步检测

每周扫描已合并的 PR，查找需要文档更新的 API 变更。

**触发器：** 计划任务 (每周)

```bash
hermes cron create "0 9 * * 1" \
  "扫描 NousResearch/hermes-agent 仓库的文档同步情况。

1. 运行：gh pr list --repo NousResearch/hermes-agent --state merged --json number,title,files,mergedAt --limit 30
2. 筛选出过去 7 天内合并的 PR
3. 对于每个已合并的 PR，检查它是否修改了：
   - 工具模式 (tools/*.py) — 可能需要更新 docs/reference/tools-reference.md
   - CLI 命令 (hermes_cli/commands.py, hermes_cli/main.py) — 可能需要更新 docs/reference/cli-commands.md
   - 配置选项 (hermes_cli/config.py) — 可能需要更新 docs/user-guide/configuration.md
   - 环境变量 — 可能需要更新 docs/reference/environment-variables.md
4. 交叉引用：对于每个代码变更，检查相应的文档页面是否也在同一个 PR 中被更新

报告任何代码已更改但文档未更新的情况。如果一切同步，请回复 [SILENT]。" \
  --name "文档同步检测" \
  --deliver telegram
```

### 依赖安全审计

每日扫描项目依赖中的已知漏洞。

**触发器：** 计划任务 (每天)

```bash
hermes cron create "0 6 * * *" \
  "对 hermes-agent 项目运行依赖安全审计。

1. cd ~/.hermes/hermes-agent && source .venv/bin/activate
2. 运行：pip audit --format json 2>/dev/null || pip audit 2>&1
3. 运行：npm audit --json 2>/dev/null (如果存在 website/ 目录)
4. 检查任何 CVSS 评分 >= 7.0 的 CVE

如果发现漏洞：
- 列出每一个，包括包名、版本、CVE ID、严重性
- 检查是否有可用的升级版本
- 注意它是直接依赖还是传递性依赖

如果没有漏洞，请回复 [SILENT]。" \
  --name "依赖审计" \
  --deliver telegram
```

---

## DevOps 与监控

### 部署验证

每次部署后触发冒烟测试。您的 CI/CD 管道在部署完成时会向网络钩子发送 POST 请求。

**触发方式：** API 调用（网络钩子）

```bash
hermes webhook subscribe deploy-verify \
  --events "deployment" \
  --prompt "刚刚完成了一次部署：
服务: {service}
环境: {environment}
版本: {version}
部署者: {deployer}

请执行以下验证步骤：
1. 检查服务是否响应: curl -s -o /dev/null -w '%{http_code}' {health_url}
2. 搜索最近的日志中是否有错误：检查部署负载中是否有任何错误指示
3. 验证版本是否匹配: curl -s {health_url}/version

报告：部署状态（健康/降级/失败）、响应时间、发现的任何错误。
如果状态健康，请保持简洁。如果降级或失败，请提供详细的诊断信息。" \
  --deliver telegram
```

您的 CI/CD 管道可以这样触发它：

```bash
curl -X POST http://your-server:8644/webhooks/deploy-verify \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$(echo -n '{"service":"api","environment":"prod","version":"2.1.0","deployer":"ci","health_url":"https://api.example.com/health"}' | openssl dgst -sha256 -hmac 'your-secret' | cut -d' ' -f2)" \
  -d '{"service":"api","environment":"prod","version":"2.1.0","deployer":"ci","health_url":"https://api.example.com/health"}'
```

### 告警分类

将监控告警与近期变更关联起来，以草拟响应。适用于 Datadog、PagerDuty、Grafana 或任何可以 POST JSON 的告警系统。

**触发方式：** API 调用（网络钩子）

```bash
hermes webhook subscribe alert-triage \
  --prompt "收到监控告警：
告警: {alert.name}
严重级别: {alert.severity}
服务: {alert.service}
消息: {alert.message}
时间戳: {alert.timestamp}

请调查：
1. 在网上搜索此错误模式的已知问题
2. 检查此告警是否与任何近期部署或配置变更相关
3. 草拟分类摘要，包括：
   - 可能的根本原因
   - 建议的初步响应步骤
   - 上报建议 (P1-P4)

请保持简洁。此信息将发送到值班频道。" \
  --deliver slack
```

### 正常运行时间监控

每 30 分钟检查一次端点。仅当有服务宕机时才发送通知。

**触发方式：** 定时任务（每 30 分钟）

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
  "如果脚本报告'OUTAGE DETECTED'，请总结哪些服务宕机并推测可能原因。如果报告'NO_ISSUES'，请回复[SILENT]。" \
  --script ~/.hermes/scripts/check-uptime.py \
  --name "Uptime monitor" \
  --deliver telegram
```

---

## 研究与情报

### 竞争对手代码库侦察

监控竞争对手代码库中有趣的 PR、功能和架构决策。

**触发方式：** 定时任务（每日）

```bash
hermes cron create "0 8 * * *" \
  "侦察以下 AI 智能体代码库在过去 24 小时内的显著活动：

要检查的代码库:
- anthropics/claude-code
- openai/codex
- All-Hands-AI/OpenHands
- Aider-AI/aider

对于每个代码库：
1. gh pr list --repo <repo> --state all --json number,title,author,createdAt,mergedAt --limit 15
2. gh issue list --repo <repo> --state open --json number,title,labels,createdAt --limit 10

重点关注：
- 正在开发的新功能
- 架构变更
- 我们可以借鉴的集成模式
- 可能影响我们的安全修复

跳过常规的依赖项更新和 CI 修复。如果没有值得注意的内容，请回复[SILENT]。
如果有发现，请按代码库组织，并对每个条目进行简要分析。" \
  --skill competitive-pr-scout \
  --name "Competitor scout" \
  --deliver telegram
```

### AI 新闻摘要

AI/ML 领域发展的每周综述。

**触发方式：** 定时任务（每周）

```bash
hermes cron create "0 9 * * 1" \
  "生成一份过去 7 天的每周 AI 新闻摘要：

1. 在网上搜索主要的 AI 公告、模型发布和研究突破
2. 在 GitHub 上搜索热门的 ML 代码库
3. 在 arXiv 上搜索关于语言模型和智能体的高引用论文

结构：
```

```
## 头条新闻（3-5则重要报道）
## 值得关注的论文（2-3篇论文附一句话摘要）
## 开源动态（有趣的新仓库或重大版本发布）
## 行业动向（融资、收购、产品发布）

每条1-2句话。包含链接。总计不超过600字。" \
  --name "每周AI摘要" \
  --deliver telegram
```

### 带注释的论文摘要

每日扫描arXiv论文并将摘要保存到笔记系统。

**触发器：** 计划任务（每日）

```bash
hermes cron create "0 8 * * *" \
  "搜索arXiv，找出过去一天内关于“语言模型推理”或“工具使用智能体”的3篇最有趣的论文。为每篇论文创建一个Obsidian笔记，包含标题、作者、摘要总结、关键贡献以及对Hermes智能体开发的潜在相关性。" \
  --skill arxiv --skill obsidian \
  --name "论文摘要" \
  --deliver local
```

---

## GitHub 事件自动化

### 问题自动标记

自动为新问题添加标签并回复。

**触发器：** GitHub 网络钩子

```bash
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "收到新的GitHub问题：
仓库：{repository.full_name}
问题 #{issue.number}：{issue.title}
作者：{issue.user.login}
操作：{action}
正文：{issue.body}
标签：{issue.labels}

如果是新问题（action=opened）：
1. 仔细阅读问题标题和正文
2. 建议合适的标签（bug, feature, docs, security, question）
3. 如果是错误报告，尝试从描述中识别受影响的组件
4. 发布一条有帮助的初始回复以确认收到问题

如果是标签或分配变更，请回复 [SILENT]。" \
  --deliver github_comment
```

### CI 失败分析

分析CI失败并在PR上发布诊断信息。

**触发器：** GitHub 网络钩子

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
            PR：#{check_run.pull_requests.0.number}
            详情URL：{check_run.details_url}

            如果结论是“failure”：
            1. 如果可以访问，请从详情URL获取日志
            2. 识别失败的可能原因
            3. 建议修复方案
            如果结论是“success”，请回复 [SILENT]。
          deliver: "github_comment"
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{check_run.pull_requests.0.number}"
```

### 跨仓库自动同步更改

当一个仓库的PR合并时，自动将相应的更改同步到另一个仓库。

**触发器：** GitHub 网络钩子

```bash
hermes webhook subscribe auto-port \
  --events "pull_request" \
  --prompt "源仓库中有PR已合并：
仓库：{repository.full_name}
PR #{pull_request.number}：{pull_request.title}
作者：{pull_request.user.login}
操作：{action}
合并提交：{pull_request.merge_commit_sha}

如果操作是‘closed’并且 pull_request.merged 为 true：
1. 获取差异：curl -sL {pull_request.diff_url}
2. 分析更改内容
3. 判断此更改是否需要同步到Go SDK的对应位置
4. 如果是，创建一个分支，应用等效更改，并在目标仓库开启一个新的PR
5. 在新PR描述中引用原始PR

如果操作不是‘closed’或未合并，请回复 [SILENT]。" \
  --skill github-pr-workflow \
  --deliver log
```

---

## 业务运营

### Stripe 支付监控

跟踪支付事件并获取失败摘要。

**触发器：** API 调用（网络钩子）

```bash
hermes webhook subscribe stripe-payments \
  --events "payment_intent.succeeded,payment_intent.payment_failed,charge.dispute.created" \
  --prompt "收到Stripe事件：
事件类型：{type}
金额：{data.object.amount} 美分 ({data.object.currency})
客户：{data.object.customer}
状态：{data.object.status}

对于 payment_intent.payment_failed：
- 从 {data.object.last_payment_error} 识别失败原因
- 建议这是临时性问题（可重试）还是永久性问题（需联系客户）

对于 charge.dispute.created：
- 标记为紧急
- 总结争议详情

对于 payment_intent.succeeded：
- 仅作简要确认

回复请保持简洁，以便在运营频道查看。" \
  --deliver slack
```

### 每日营收摘要

每天早上汇编关键业务指标。

**触发器：** 计划任务（每日）

```bash
hermes cron create "0 8 * * *" \
  "生成一份晨间业务指标摘要。

搜索以下信息：
1. 当前比特币和以太坊价格
2. 标普500指数状态（盘前或前一收盘价）
3. 过去12小时内任何重大的科技/人工智能行业新闻

格式为简洁的晨间简报，最多3-4个要点。
以清晰、可快速浏览的消息形式发送。" \
  --name "晨间简报" \
  --deliver telegram
```

---

## 多技能工作流

### 安全审计流水线

结合多项技能进行全面的每周安全审查。

**触发器：** 计划任务（每周）

```bash
hermes cron create "0 3 * * 0" \
  "对hermes-agent代码库运行全面的安全审计。

1. 检查依赖项漏洞（pip audit, npm audit）
2. 在代码库中搜索常见的安全反模式：
   - 硬编码的密钥或API密钥
   - SQL注入风险（查询中的字符串格式化）
   - 路径遍历风险（文件路径中使用未验证的用户输入）
   - 不安全的反序列化（pickle.loads, yaml.load未使用SafeLoader）
3. 审查最近的提交（过去7天），查看与安全相关的更改
4. 检查是否有新增的环境变量未记录

撰写一份安全报告，按严重程度（严重、高、中、低）分类列出发现的问题。
如果没有发现任何问题，请报告一切正常。" \
  --skill codebase-security-audit \
  --name "每周安全审计" \
  --deliver telegram
```

### 内容流水线

按计划研究、起草和准备内容。

**触发器：** 计划任务（每周）

```bash
hermes cron create "0 10 * * 3" \
  "研究并起草一篇关于AI智能体热门主题的技术博客文章大纲。

1. 搜索网络，查找本周讨论最多的AI智能体主题
2. 选择一个与开源AI智能体最相关且最有趣的主题
3. 创建一个大纲，包含：
   - 引人入胜的开头角度
   - 3-4个关键章节
   - 适合开发者的技术深度
   - 带有可操作要点的结论
4. 将大纲保存至 ~/drafts/blog-$(date +%Y%m%d).md

大纲控制在约300字。这是起点，不是完成的文章。" \
  --name "博客大纲" \
  --deliver local
```

---

## 快速参考

### 计划任务时间语法

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

| 目标 | 标志 | 备注 |
|--------|------|-------|
| 同一对话 | `--deliver origin` | 默认 — 投递到任务创建的对话 |
| 本地文件 | `--deliver local` | 保存输出，无通知 |
| Telegram | `--deliver telegram` | 主频道，或用 `telegram:CHAT_ID` 指定特定聊天 |
| Discord | `--deliver discord` | 主频道，或用 `discord:CHANNEL_ID` 指定特定频道 |
| Slack | `--deliver slack` | 主频道 |
| 短信 | `--deliver sms:+15551234567` | 直接发送到手机号 |
| 特定话题/帖子 | `--deliver telegram:-100123:456` | Telegram 论坛话题 |

### 网络钩子模板变量

| 变量 | 描述 |
|----------|-------------|
| `{pull_request.title}` | PR 标题 |
| `{issue.number}` | 问题编号 |
| `{repository.full_name}` | `所有者/仓库` |
| `{action}` | 事件操作（opened, closed 等） |
| `{__raw__}` | 完整的 JSON 负载（截断至4000字符） |
| `{sender.login}` | 触发事件的 GitHub 用户 |

### [SILENT] 模式

当计划任务的响应包含 `[SILENT]` 时，将抑制投递。这用于避免在无事发生时产生通知垃圾信息：

```
如果没有值得注意的事情发生，请回复 [SILENT]。
```

这意味着你只有在智能体有内容需要报告时才会收到通知。