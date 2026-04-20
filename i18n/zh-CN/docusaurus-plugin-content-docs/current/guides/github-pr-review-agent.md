---
sidebar_position: 10
title: "教程：GitHub PR 审查代理"
description: "构建一个自动化的 AI 代码审查器，监控你的仓库、审查拉取请求并提交反馈——无需人工干预"
---

# 教程：构建 GitHub PR 审查代理

**问题所在：** 你的团队提交 PR 的速度比你审查它们的速度还快。PR 积压数日无人问津。初级开发人员因为没人有时间检查而合入了 bug。你每天早上都在追赶代码差异，而不是专注于开发。

**解决方案：** 一个全天候监控你仓库的 AI 代理，审查每个新 PR 中的 bug、安全问题和代码质量，并向你发送摘要——这样你只需花时间在真正需要人工判断的 PR 上。

**你将构建的内容：**

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐     ┌──────────────┐
│  定时器      │────▶│  Hermes 代理  │────▶│  GitHub API  │────▶│  发送至      │
│  (每 2 小时) │     │  + gh CLI     │     │  (PR 差异)   │     │  Telegram/   │
│              │     │  + 技能       │     │              │     │  Discord/    │
│              │     │  + 记忆       │     │              │     │  本地文件    │
└──────────────┘     └───────────────┘     └──────────────┘     └──────────────┘
```

本指南使用 **cron 作业**按计划轮询 PR —— 无需服务器或公共端点。可在 NAT 和防火墙后运行。

:::tip 想要实时审查？
如果你有可用的公共端点，请查看[使用 Webhook 的自动化 GitHub PR 评论](./webhook-github-pr-review.md) —— 当 PR 被打开或更新时，GitHub 会立即将事件推送到 Hermes。
:::

---

## 先决条件

- **已安装 Hermes 代理** —— 参见[安装指南](/docs/getting-started/installation)
- **运行网关**以支持 cron 作业：
  ```bash
  hermes gateway install   # 安装为服务
  # 或
  hermes gateway           # 前台运行
  ```
- **已安装并认证 GitHub CLI (`gh`)**：
  ```bash
  # 安装
  brew install gh        # macOS
  sudo apt install gh    # Ubuntu/Debian

  # 认证
  gh auth login
  ```
- **已配置消息通知**（可选）—— [Telegram](/docs/user-guide/messaging/telegram) 或 [Discord](/docs/user-guide/messaging/discord)

:::tip 没有消息通知？没问题
使用 `deliver: "local"` 将审查结果保存到 `~/.hermes/cron/output/`。在连接通知之前非常适合测试。
:::

---

## 步骤 1：验证设置

确保 Hermes 可以访问 GitHub。启动一个聊天会话：

```bash
hermes
```

用一个简单命令测试：

```
运行：gh pr list --repo NousResearch/hermes-agent --state open --limit 3
```

你应该能看到一个开放 PR 的列表。如果成功了，就可以继续下一步。

---

## 步骤 2：尝试手动审查

仍在聊天中，让 Hermes 审查一个真实的 PR：

```
审查这个拉取请求。阅读差异，检查 bug、安全问题以及代码质量。
具体指出行号并引用有问题的代码。

运行：gh pr diff 3888 --repo NousResearch/hermes-agent
```

Hermes 将：
1. 执行 `gh pr diff` 获取代码变更
2. 通读整个差异
3. 生成包含具体发现的结构化审查报告

如果你对审查质量满意，就可以将其自动化了。

---

## 步骤 3：创建审查技能

技能为 Hermes 提供一致的审查准则，这些准则在会话和 cron 作业运行期间持续有效。没有技能的话，审查质量会参差不齐。

```bash
mkdir -p ~/.hermes/skills/code-review
```

创建 `~/.hermes/skills/code-review/SKILL.md`：

```markdown
---
name: code-review
description: 审查拉取请求中的 bug、安全问题和代码质量
---

# 代码审查准则

审查拉取请求时：

## 检查内容
1. **Bug** —— 逻辑错误、差一错误、空值/未定义处理
2. **安全** —— 注入、身份验证绕过、代码中的密钥、SSRF
3. **性能** —— N+1 查询、无限循环、内存泄漏
4. **风格** —— 命名规范、死代码、缺少错误处理
5. **测试** —— 变更是否经过测试？测试是否覆盖边界情况？

## 输出格式
每个发现项：
- **文件:行号** —— 精确位置
- **严重性** —— 严重 / 警告 / 建议
- **问题描述** —— 一句话说明
- **修复方案** —— 如何修复

## 规则
- 要具体。引用有问题的代码。
- 除非影响可读性，否则不要标记风格上的吹毛求疵。
- 如果 PR 看起来不错，就如实说明。不要编造问题。
- 以：APPROVE / REQUEST_CHANGES / COMMENT 结尾
```

验证技能是否加载 —— 启动 `hermes`，你应该能在启动时的技能列表中看到 `code-review`。

---

## 步骤 4：教它你的规范

这才是让审查器真正有用的关键。开始一个会话并教 Hermes 你团队的标准：

```
记住：在我们的后端仓库中，我们使用 Python 和 FastAPI。
所有端点必须有类型注解和 Pydantic 模型。
我们不允许使用原始 SQL —— 只能使用 SQLAlchemy ORM。
测试文件放在 tests/ 中，必须使用 pytest 夹具。
```

```
记住：在我们的前端仓库中，我们使用 TypeScript 和 React。
不允许使用 `any` 类型。所有组件必须有 props 接口。
我们使用 React Query 获取数据，绝不用 useEffect 进行 API 调用。
```

这些记忆将永久保存 —— 审查器会在每次审查时强制执行你的规范，无需每次都告知。

---

## 步骤 5：创建自动化 Cron 作业

现在将所有内容连接起来。创建一个每 2 小时运行一次的 cron 作业：

```bash
hermes cron create "0 */2 * * *" \
  "检查新的开放 PR 并审查它们。

要监控的仓库：
- myorg/backend-api
- myorg/frontend-app

步骤：
1. 运行：gh pr list --repo REPO --state open --limit 5 --json number,title,author,createdAt
2. 对过去 4 小时内创建或更新的每个 PR：
   - 运行：gh pr diff NUMBER --repo REPO
   - 使用 code-review 准则审查差异
3. 格式化输出为：

## PR 审查 —— 今天

### [仓库] #[编号]: [标题]
**作者：** [姓名] | **结论：** APPROVE/REQUEST_CHANGES/COMMENT
[发现的问题]

如果未发现新 PR，请说明：没有需要审查的新 PR。" \
  --name "pr-review" \
  --deliver telegram \
  --skill code-review
```

验证是否已计划：

```bash
hermes cron list
```

### 其他有用的计划

| 计划 | 时间 |
|----------|------|
| `0 */2 * * *` | 每 2 小时 |
| `0 9,13,17 * * 1-5` | 每天三次，仅工作日 |
| `0 9 * * 1` | 每周一早上汇总 |
| `30m` | 每 30 分钟（高流量仓库） |

---

## 步骤 6：按需运行

不想等待计划？手动触发它：

```bash
hermes cron run pr-review
```

或在聊天会话中：

```
/cron run pr-review
```

---

## 更进一步

### 直接将审查结果发布到 GitHub

不要发送到 Telegram，而是让代理直接在 PR 上评论：

在你的 cron 提示中添加：

```
审查后，发布你的审查结果：
- 对于问题：gh pr review NUMBER --repo REPO --comment --body "YOUR_REVIEW"
- 对于严重问题：gh pr review NUMBER --repo REPO --request-changes --body "YOUR_REVIEW"
- 对于干净的 PR：gh pr review NUMBER --repo REPO --approve --body "看起来不错"
```

:::caution
确保 `gh` 拥有具有 `repo` 范围的令牌。评论将以 `gh` 认证的身份发布。
:::

### 每周 PR 仪表板

创建一个周一早上所有仓库的概览：

```bash
hermes cron create "0 9 * * 1" \
  "生成每周 PR 仪表板：
- myorg/backend-api
- myorg/frontend-app
- myorg/infra

每个仓库显示：
1. 开放 PR 数量和最旧 PR 的年龄
2. 本周合并的 PR
3. 陈旧的 PR（超过 5 天）
4. 未分配审查者的 PR

格式化为简洁的摘要。" \
  --name "weekly-dashboard" \
  --deliver telegram
```

### 多仓库监控

通过在提示中添加更多仓库来扩展。代理会按顺序处理它们 —— 无需额外设置。

---

## 故障排除

### "gh: command not found"
网关运行在最小化环境中。确保 `gh` 在系统 PATH 中并重启网关。

### 审查结果过于泛泛
1. 添加 `code-review` 技能（步骤 3）
2. 通过记忆教 Hermes 你的规范（步骤 4）
3. 它对你的技术栈了解得越多，审查结果就越好

### Cron 作业未运行
```bash
hermes gateway status    # 网关是否在运行？
hermes cron list         # 作业是否已启用？
```

### 速率限制
GitHub 允许认证用户每小时 5,000 次 API 请求。每次 PR 审查使用约 3-5 次请求（列表 + 差异 + 可选评论）。即使每天审查 100 个 PR 也远低于限制。

---

## 下一步是什么？

- **[基于 Webhook 的 PR 审查](./webhook-github-pr-review.md)** —— 在 PR 打开时立即获得审查（需要公共端点）
- **[每日简报机器人](/docs/guides/daily-briefing-bot)** —— 将 PR 审查与你的晨间新闻摘要结合
- **[构建插件](/docs/guides/build-a-hermes-plugin)** —— 将审查逻辑封装为可共享的插件
- **[配置文件](/docs/user-guide/profiles)** —— 运行一个专用的审查者配置文件，拥有独立的记忆和配置
- **[备用提供商](/docs/user-guide/features/fallback-providers)** —— 确保即使一个提供商宕机，审查也能继续运行