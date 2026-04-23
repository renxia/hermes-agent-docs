---
sidebar_position: 10
title: "教程：GitHub PR 审查智能体"
description: "构建一个自动化的 AI 代码审查工具，监控您的代码仓库，审查拉取请求，并全自动交付反馈"
---

# 教程：构建 GitHub PR 审查智能体

**问题：** 您的团队提交 PR 的速度远超人工审阅的速度。PR 堆积数天无人查看。初级开发者因无人复核而合并了 bug。您早晨的时间都花在追赶代码差异上，而不是进行开发。

**解决方案：** 一个 AI 智能体全天候监控您的代码仓库，审查每个新 PR 的 bug、安全问题和代码质量，并发送摘要——让您只需将时间花在真正需要人工判断的 PR 上。

**您将构建：**

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                    │
│   定时任务计时器  ──▶  Hermes 智能体  ──▶  GitHub API  ──▶  审查结果交付  │
│    (每 2 小时)        + gh CLI            (PR 代码差异)       (Telegram, │
│                     + 技能                              Discord,    │
│                     + 记忆                            local)      │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

本教程使用 **定时任务** 按固定频率轮询 PR——无需服务器或公网端点。支持在 NAT 和防火墙后方运行。

:::tip 想要实时审查？
如果您有可用的公网端点，请查看 [使用 Webhook 自动评论 GitHub PR](./webhook-github-pr-review.md)——当 PR 被创建或更新时，GitHub 会立即将事件推送给 Hermes。
:::

---

## 前置条件

- **已安装 Hermes 智能体**——请参阅 [安装指南](/docs/getting-started/installation)
- **运行网关**以执行定时任务：
   ```bash
  hermes gateway install    # 安装为系统服务
   # 或
  hermes gateway            # 前台运行
   ```
- **已安装并配置 GitHub CLI (`gh`) 认证**：
   ```bash
   # 安装
  brew install gh         # macOS
  sudo apt install gh     # Ubuntu/Debian

   # 认证
  gh auth login
   ```
- **已配置消息通知**（可选）——[Telegram](/docs/user-guide/messaging/telegram) 或 [Discord](/docs/user-guide/messaging/discord)

:::tip 没有配置消息通知？没问题
使用 `deliver: "local"` 将审查结果保存至 `~/.hermes/cron/output/`。在配置通知服务前，非常适合用于测试。
:::

---

## 步骤 1：验证环境配置

确保 Hermes 能够访问 GitHub。启动聊天会话：

```bash
hermes
```

使用一条简单命令进行测试：

```
Run: gh pr list --repo NousResearch/hermes-agent --state open --limit 3
```

您应该能看到一个开放 PR 的列表。如果运行正常，说明环境已就绪。

---

## 步骤 2：尝试手动审查

在聊天界面中，让 Hermes 审查一个真实的 PR：

```
Review this pull request. Read the diff, check for bugs, security issues,
and code quality. Be specific about line numbers and quote problematic code.

Run: gh pr diff 3888 --repo NousResearch/hermes-agent
```

Hermes 将：
1. 执行 `gh pr diff` 获取代码变更
2. 通读整个代码差异
3. 生成结构化的审查报告并列出具体发现

如果您对审查质量满意，接下来就可以将其自动化。

---

## 步骤 3：创建审查技能

技能为 Hermes 提供了一致的审查规范，这些规范会在不同会话和定时任务中持续生效。没有技能的话，审查质量会参差不齐。

```bash
mkdir -p ~/.hermes/skills/code-review
```

创建 `~/.hermes/skills/code-review/SKILL.md`：

```markdown
---
name: code-review
description: Review pull requests for bugs, security issues, and code quality
---

# 代码审查规范

审查拉取请求时：

## 检查项
1. **Bug**——逻辑错误、差一错误、空值/未定义处理
2. **安全**——注入攻击、认证绕过、代码中的密钥泄露、SSRF
3. **性能**——N+1 查询、无界循环、内存泄漏
4. **规范**——命名约定、死代码、缺失的错误处理
5. **测试**——变更是否经过测试？测试是否覆盖了边界情况？

## 输出格式
针对每一项发现：
- **文件:行号**——精确位置
- **严重程度**——Critical（严重）/ Warning（警告）/ Suggestion（建议）
- **问题描述**——一句话说明
- **修复建议**——如何修复

## 规则
- 保持具体。引用有问题的代码。
- 除非影响可读性，否则不要标记风格上的细枝末节。
- 如果 PR 没问题，请明确说明。不要凭空捏造问题。
- 结尾需包含：APPROVE / REQUEST_CHANGES / COMMENT
```

验证是否加载成功——启动 `hermes`，您应该在启动时的技能列表中看到 `code-review`。

---

## 步骤 4：传授团队规范

这正是让审查工具真正发挥作用的关键。开启一个会话，向 Hermes 传授您团队的标准：

```
Remember: In our backend repo, we use Python with FastAPI.
All endpoints must have type annotations and Pydantic models.
We don't allow raw SQL — only SQLAlchemy ORM.
Test files go in tests/ and must use pytest fixtures.
```

```
Remember: In our frontend repo, we use TypeScript with React.
No `any` types allowed. All components must have props interfaces.
We use React Query for data fetching, never useEffect for API calls.
```

这些记忆将永久保存——审查智能体将自动执行您的规范，无需每次重复告知。

---

## 步骤 5：创建自动化定时任务

现在将所有组件串联起来。创建一个每 2 小时运行的定时任务：

```bash
hermes cron create "0 */2 * * *" \
   "Check for new open PRs and review them.

Repos to monitor:
- myorg/backend-api
- myorg/frontend-app

Steps:
1. Run: gh pr list --repo REPO --state open --limit 5 --json number,title,author,createdAt
2. For each PR created or updated in the last 4 hours:
    - Run: gh pr diff NUMBER --repo REPO
    - Review the diff using the code-review guidelines
3. Format output as:

## PR Reviews — today

### [repo] #[number]: [title]
**Author:** [name] | **Verdict:** APPROVE/REQUEST_CHANGES/COMMENT
[findings]

If no new PRs found, say: No new PRs to review." \
   --name "pr-review" \
   --deliver telegram \
   --skill code-review
```

验证定时任务是否已设置：

```bash
hermes cron list
```

### 其他常用时间表达式

| 时间表达式 | 执行时间 |
|----------|------|
| `0 */2 * * *` | 每 2 小时 |
| `0 9,13,17 * * 1-5` | 每天三次，仅限工作日 |
| `0 9 * * 1` | 每周一早上的汇总 |
| `30m` | 每 30 分钟（适用于高活跃度仓库） |

---

## 步骤 6：按需手动运行

不想等待定时任务？可以手动触发：

```bash
hermes cron run pr-review
```

或在聊天会话中：

```
/cron run pr-review
```

---

## 进阶玩法

### 将审查结果直接发布到 GitHub

除了发送到 Telegram，还可以让智能体直接在 PR 上发表评论：

在您的 cron 提示词中添加以下内容：

```
After reviewing, post your review:
- For issues: gh pr review NUMBER --repo REPO --comment --body "YOUR_REVIEW"
- For critical issues: gh pr review NUMBER --repo REPO --request-changes --body "YOUR_REVIEW"
- For clean PRs: gh pr review NUMBER --repo REPO --approve --body "Looks good"
```

:::caution
确保 `gh` 配置了具有 `repo` 范围的令牌。审查结果将以 `gh` 当前登录的身份发布。
:::

### 每周 PR 仪表盘

创建一个每周一早上的全仓库概览：

```bash
hermes cron create "0 9 * * 1" \
   "Generate a weekly PR dashboard:
- myorg/backend-api
- myorg/frontend-app
- myorg/infra

For each repo show:
1. Open PR count and oldest PR age
2. PRs merged this week
3. Stale PRs (older than 5 days)
4. PRs with no reviewer assigned

Format as a clean summary." \
   --name "weekly-dashboard" \
   --deliver telegram
```

### 多仓库监控

通过在提示词中添加更多仓库来扩展规模。智能体会按顺序处理它们——无需额外配置。

---

## 故障排除

### "gh: command not found"
网关运行在极简环境中。请确保 `gh` 位于系统 PATH 中，并重启网关。

### 审查结果过于笼统
1. 添加 `code-review` 技能（步骤 3）
2. 通过记忆功能向 Hermes 传授您的规范（步骤 4）
3. 它掌握的关于您技术栈的上下文越多，审查质量越高

### 定时任务未执行
```bash
hermes gateway status     # 网关是否在运行？
hermes cron list          # 任务是否已启用？
```

### 速率限制
GitHub 允许认证用户每小时发起 5,000 次 API 请求。每次 PR 审查大约消耗 3-5 次请求（列表 + 差异 + 可选评论）。即使每天审查 100 个 PR，也完全在限制范围内。

---

## 后续步骤？

- **[基于 Webhook 的 PR 审查](./webhook-github-pr-review.md)**——在 PR 创建时获取即时审查（需要公网端点）
- **[每日简报机器人](/docs/guides/daily-briefing-bot)**——将 PR 审查与每日新闻摘要结合
- **[构建插件](/docs/guides/build-a-hermes-plugin)**——将审查逻辑封装为可共享的插件
- **[配置文件](/docs/user-guide/profiles)**——运行专用的审查员配置文件，拥有独立的记忆和配置
- **[备用提供商](/docs/user-guide/features/fallback-providers)**——确保即使某个提供商宕机，审查任务仍能正常运行