---
title: "Codex — 将编码任务委托给 OpenAI Codex CLI（功能开发、PR 合并请求）"
sidebar_label: "Codex"
description: "将编码任务委托给 OpenAI Codex CLI（功能开发、PR 合并请求）"
---

{/* 本页面由网站脚本 generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Codex

将编码任务委托给 OpenAI Codex CLI（功能开发、PR 合并请求）。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认已安装） |
| 路径 | `skills/autonomous-ai-agents/codex` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Coding-Agent`, `Codex`, `OpenAI`, `Code-Review`, `Refactoring` |
| 相关技能 | [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Codex CLI

通过 Hermes 终端将编码任务委托给 [Codex](https://github.com/openai/codex)。Codex 是 OpenAI 的自主编码智能体 CLI。

## 何时使用

- 构建功能
- 重构代码
- PR 审查
- 批量修复问题

需要安装 Codex CLI 和一个 git 仓库。

## 前提条件

- 已安装 Codex：`npm install -g @openai/codex`
- 已配置 OpenAI 认证：可以是 `OPENAI_API_KEY`，或通过 Codex CLI 登录流程获得的 Codex OAuth 凭证
- **必须在 git 仓库内运行** — Codex 拒绝在仓库外运行
- 在终端调用中使用 `pty=true` — Codex 是一个交互式终端应用程序

对于 Hermes 本身，在 `hermes auth add openai-codex` 后，`model.provider: openai-codex` 会使用从 `~/.hermes/auth.json` 管理的 Hermes Codex OAuth。对于独立的 Codex CLI，有效的 CLI OAuth 会话可能存储在 `~/.codex/auth.json` 下；不能仅因为缺少 `OPENAI_API_KEY` 就断定 Codex 认证缺失。

## 单次任务

```
terminal(command="codex exec '为设置添加深色模式切换'", workdir="~/project", pty=true)
```

对于临时工作（Codex 需要一个 git 仓库）：
```
terminal(command="cd $(mktemp -d) && git init && codex exec '用 Python 构建一个贪吃蛇游戏'", pty=true)
```

## 后台模式（长时间任务）

```
# 使用 PTY 在后台启动
terminal(command="codex exec --full-auto '重构认证模块'", workdir="~/project", background=true, pty=true)
# 返回 session_id

# 监控进度
process(action="poll", session_id="<id>")
process(action="log", session_id="<id>")

# 如果 Codex 提出问题，则发送输入
process(action="submit", session_id="<id>", data="yes")

# 需要时终止
process(action="kill", session_id="<id>")
```

## 关键标志

| 标志 | 效果 |
|------|--------|
| `exec "提示语"` | 单次执行，完成后退出 |
| `--full-auto` | 在沙箱中运行，但自动批准工作区内的文件更改 |
| `--yolo` | 无沙箱，无批准（最快，最危险） |

## PR 审查

克隆到临时目录以进行安全审查：

```
terminal(command="REVIEW=$(mktemp -d) && git clone https://github.com/user/repo.git $REVIEW && cd $REVIEW && gh pr checkout 42 && codex review --base origin/main", pty=true)
```

## 使用工作树并行修复问题

```
# 创建工作树
terminal(command="git worktree add -b fix/issue-78 /tmp/issue-78 main", workdir="~/project")
terminal(command="git worktree add -b fix/issue-99 /tmp/issue-99 main", workdir="~/project")

# 在每个工作树中启动 Codex
terminal(command="codex --yolo exec '修复问题 #78：<描述>。完成后提交。'", workdir="/tmp/issue-78", background=true, pty=true)
terminal(command="codex --yolo exec '修复问题 #99：<描述>。完成后提交。'", workdir="/tmp/issue-99", background=true, pty=true)

# 监控
process(action="list")

# 完成后，推送并创建 PR
terminal(command="cd /tmp/issue-78 && git push -u origin fix/issue-78")
terminal(command="gh pr create --repo user/repo --head fix/issue-78 --title '修复: ...' --body '...'")

# 清理
terminal(command="git worktree remove /tmp/issue-78", workdir="~/project")
```

## 批量 PR 审查

```
# 获取所有 PR 引用
terminal(command="git fetch origin '+refs/pull/*/head:refs/remotes/origin/pr/*'", workdir="~/project")

# 并行审查多个 PR
terminal(command="codex exec '审查 PR #86。git diff origin/main...origin/pr/86'", workdir="~/project", background=true, pty=true)
terminal(command="codex exec '审查 PR #87。git diff origin/main...origin/pr/87'", workdir="~/project", background=true, pty=true)

# 发布结果
terminal(command="gh pr comment 86 --body '<审查意见>'", workdir="~/project")
```

## 规则

1. **始终使用 `pty=true`** — Codex 是一个交互式终端应用程序，没有 PTY 会挂起
2. **需要 Git 仓库** — Codex 不会在 git 目录外运行。对于临时工作，使用 `mktemp -d && git init`
3. **单次任务使用 `exec`** — `codex exec "提示语"` 会运行并正常退出
4. **构建使用 `--full-auto`** — 在沙箱内自动批准更改
5. **长时间任务使用后台模式** — 使用 `background=true` 并用 `process` 工具监控
6. **不要干扰** — 使用 `poll`/`log` 监控，对长时间运行的任务保持耐心
7. **可以并行** — 对于批量工作，可以同时运行多个 Codex 进程