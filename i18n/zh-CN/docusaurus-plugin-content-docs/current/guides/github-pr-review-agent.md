---
sidebar_position: 10
title: "教程：GitHub PR 审核智能体"
description: "构建一个自动化AI代码审查器，它能监控您的仓库、审查拉取请求并提供反馈——全程无需动手"
---

# 教程：构建一个 GitHub PR 审核智能体

**问题所在：** 您的团队开启PR的速度快于您审查的速度。PR被搁置数日等待审阅。初级开发者合并了有缺陷的代码，因为无人有时间检查。您每天上午都在追赶差异，而不是进行构建。

**解决方案：** 一个全天候监控您仓库的AI智能体，它审查每个新PR的缺陷、安全问题和代码质量，并向您发送摘要——这样您只需将时间花在那些真正需要人工判断的PR上。

**您将构建什么：**

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   定时器      ──▶  Hermes 智能体 ──▶  GitHub API ──▶  审查         │
│   (每2小时)       + gh CLI          (PR 差异)        结果         │
│                   + 技能                           发送           │
│                   + 记忆                          (Telegram,       │
│                                                   Discord,        │
│                                                   本地)           │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

本指南使用 **cron 作业** 按计划轮询 PR——无需服务器或公网端点。在 NAT 和防火墙后也能工作。

:::tip 想要实时审查？
如果您有公网端点可用，请查看 [使用 Webhooks 的自动化 GitHub PR 评论](./webhook-github-pr-review.md) —— GitHub 会在 PR 被打开或更新时立即推送事件给 Hermes。
:::

---

## 前提条件

- **已安装 Hermes 智能体** —— 参见 [安装指南](/getting-started/installation)
- **为 cron 作业运行网关**：
  ```bash
  hermes gateway install   # 作为服务安装
  # 或
  hermes gateway           # 在前台运行
  ```
- **已安装并认证 GitHub CLI (`gh`)**：
  ```bash
  # 安装
  brew install gh        # macOS
  sudo apt install gh    # Ubuntu/Debian

  # 认证
  gh auth login
  ```
- **已配置消息推送**（可选） —— [Telegram](/user-guide/messaging/telegram) 或 [Discord](/user-guide/messaging/discord)

:::tip 没有消息推送？没问题
使用 `deliver: "local"` 将审查结果保存到 `~/.hermes/cron/output/`。在连接通知之前非常适合用于测试。
:::

---

## 步骤 1：验证设置

确保 Hermes 可以访问 GitHub。开始一个聊天：

```bash
hermes
```

用一个简单的命令测试：

```
运行: gh pr list --repo NousResearch/hermes-agent --state open --limit 3
```

您应该会看到一个打开的 PR 列表。如果这一步成功，您就准备好了。

---

## 步骤 2：尝试一次手动审查

仍在聊天中，让 Hermes 审查一个真实的 PR：

```
审查这个拉取请求。阅读差异，检查缺陷、安全问题和代码质量。请具体指出行号并引用有问题的代码。

运行: gh pr diff 3888 --repo NousResearch/hermes-agent
```

Hermes 将：
1. 执行 `gh pr diff` 来获取代码变更
2. 阅读整个差异
3. 生成一份包含具体发现的结构化审查结果

如果您对质量满意，就可以开始自动化了。

---

## 步骤 3：创建审查技能

技能可以为 Hermes 提供一致的审查指南，这些指南会在不同会话和 cron 运行中持久化。没有它，审查质量会参差不齐。

```bash
mkdir -p ~/.hermes/skills/code-review
```

创建 `~/.hermes/skills/code-review/SKILL.md`：

```markdown
---
name: code-review
description: Review pull requests for bugs, security issues, and code quality
---

# 代码审查指南

审查拉取请求时：

## 检查要点
1. **缺陷** —— 逻辑错误、差一错误、空值/未定义处理
2. **安全** —— 注入、认证绕过、代码中的密钥、SSRF
3. **性能** —— N+1 查询、无界循环、内存泄漏
4. **风格** —— 命名约定、死代码、缺失错误处理
5. **测试** —— 变更是否经过测试？测试是否覆盖边界情况？

## 输出格式
对于每个发现：
- **文件:行号** —— 准确位置
- **严重性** —— 严重 / 警告 / 建议
- **问题所在** —— 一句话描述
- **修复方法** —— 如何修复

## 规则
- 具体明确。引用有问题的代码。
- 除非影响可读性，否则不要标记风格上的吹毛求疵。
- 如果 PR 看起来没问题，就这样说。不要无中生有。
- 结尾注明：APPROVE / REQUEST_CHANGES / COMMENT
```

验证它已加载 —— 启动 `hermes`，您应该会在启动时的技能列表中看到 `code-review`。

---

## 步骤 4：教会它您的规范

这是让审查器真正有用的关键。开始一个会话，教 Hermes 您团队的标准：

```
记住：在我们的后端仓库中，我们使用 Python 和 FastAPI。
所有端点必须有类型注解和 Pydantic 模型。
我们不允许原始 SQL —— 只能使用 SQLAlchemy ORM。
测试文件放在 tests/ 目录下，必须使用 pytest fixtures。
```

```
记住：在我们的前端仓库中，我们使用 TypeScript 和 React。
不允许使用 `any` 类型。所有组件必须有 props 接口。
我们使用 React Query 进行数据获取，绝不为 API 调用使用 useEffect。
```

这些记忆会永久保存 —— 审查器会在无需每次告知的情况下强制执行您的规范。

---

## 步骤 5：创建自动化 Cron 作业

现在将所有部分串联起来。创建一个每 2 小时运行一次的 cron 作业：

```bash
hermes cron create "0 */2 * * *" \
  "检查是否有新的打开的 PR 并进行审查。

要监控的仓库：
- myorg/backend-api
- myorg/frontend-app

步骤：
1. 运行：gh pr list --repo REPO --state open --limit 5 --json number,title,author,createdAt
2. 对于每个在过去 4 小时内创建或更新的 PR：
   - 运行：gh pr diff NUMBER --repo REPO
   - 使用代码审查指南审查差异
3. 格式化输出为：

## PR 审查 —— 今日

### [仓库] #[编号]: [标题]
**作者:** [姓名] | **判定:** APPROVE/REQUEST_CHANGES/COMMENT
[发现]

如果未找到新的 PR，则说：暂无新 PR 需要审查。" \
  --name "pr-review" \
  --deliver telegram \
  --skill code-review
```

验证它已调度：

```bash
hermes cron list
```

### 其他实用的调度时间表

| 调度时间 | 何时运行 |
|----------|----------|
| `0 */2 * * *` | 每 2 小时 |
| `0 9,13,17 * * 1-5` | 工作日每天三次 |
| `0 9 * * 1` | 每周一早上总结 |
| `30m` | 每 30 分钟（高流量仓库） |

---

## 步骤 6：按需运行

不想等待计划？手动触发：

```bash
hermes cron run pr-review
```

或在聊天会话中：

```
/cron run pr-review
```

---

## 进阶用法

### 将审查结果直接发布到 GitHub

除了发送到 Telegram，还可以让智能体直接在 PR 上评论：

在您的 cron 提示中添加以下内容：

```
审查后，发布您的审查：
- 对于问题：gh pr review NUMBER --repo REPO --comment --body "YOUR_REVIEW"
- 对于严重问题：gh pr review NUMBER --repo REPO --request-changes --body "YOUR_REVIEW"
- 对于干净的 PR：gh pr review NUMBER --repo REPO --approve --body "Looks good"
```

:::caution
确保 `gh` 拥有 `repo` 作用域的令牌。审查结果将以 `gh` 认证身份发布。
:::

### 每周 PR 仪表板

创建一个周一早上的所有仓库概览：

```bash
hermes cron create "0 9 * * 1" \
  "生成每周 PR 仪表板：
- myorg/backend-api
- myorg/frontend-app
- myorg/infra

对于每个仓库，显示：
1. 打开的 PR 数量和最旧 PR 的存在时间
2. 本周合并的 PR
3. 陈旧 PR（超过 5 天）
4. 未分配审查者的 PR

格式为清晰的摘要。" \
  --name "weekly-dashboard" \
  --deliver telegram
```

### 多仓库监控

通过向提示中添加更多仓库来扩展。智能体会按顺序处理它们——无需额外设置。

---

## 故障排除

### "gh: 命令未找到"
网关在最小环境中运行。确保 `gh` 在系统 PATH 中，然后重启网关。

### 审查结果过于笼统
1. 添加 `code-review` 技能（步骤 3）
2. 通过记忆教会 Hermes 您的规范（步骤 4）
3. 您提供的技术栈上下文越多，审查结果越好

### Cron 作业未运行
```bash
hermes gateway status    # 网关是否在运行？
hermes cron list         # 作业是否启用？
```

### 速率限制
GitHub 对认证用户允许每小时 5,000 次 API 请求。每个 PR 审查大约使用 3-5 次请求（列表 + 差异 + 可选评论）。即使每天审查 100 个 PR，也远低于限额。

---

## 下一步是什么？

- **[基于 Webhook 的 PR 审查](./webhook-github-pr-review.md)** —— 在 PR 被打开时即时获得审查（需要公网端点）
- **[每日简报机器人](/guides/daily-briefing-bot)** —— 将 PR 审查与您的晨间新闻摘要相结合
- **[构建插件](/guides/build-a-hermes-plugin)** —— 将审查逻辑封装成可共享的插件
- **[配置文件](/user-guide/profiles)** —— 使用独立的记忆和配置运行专用审查器配置文件
- **[备用提供商](/user-guide/features/fallback-providers)** —— 确保即使在一个提供商宕机时审查也能运行