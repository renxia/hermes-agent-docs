---
title: "Codex — 将编码任务委托给 OpenAI Codex CLI 智能体"
sidebar_label: "Codex"
description: "将编码任务委托给 OpenAI Codex CLI 智能体"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Codex

将编码任务委托给 OpenAI Codex CLI 智能体。用于构建功能、重构、PR 审查以及批量修复问题。需要安装 codex CLI 并处于 git 仓库中。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/autonomous-ai-agents/codex` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 标签 | `Coding-Agent`, `Codex`, `OpenAI`, `Code-Review`, `Refactoring` |
| 相关技能 | [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Codex CLI

通过 Hermes 终端将编码任务委托给 [Codex](https://github.com/openai/codex)。Codex 是 OpenAI 的自主编码智能体 CLI。

## 先决条件

- 已安装 Codex：`npm install -g @openai/codex`
- 已配置 OpenAI API 密钥
- **必须在 git 仓库中运行** — Codex 拒绝在 git 仓库外运行
- 在终端调用中使用 `pty=true` — Codex 是一个交互式终端应用

## 一次性任务

```
terminal(command="codex exec '在设置中添加深色模式切换'", workdir="~/project", pty=true)
```

对于临时工作（Codex 需要 git 仓库）：
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

# 如果 Codex 提问，发送输入
process(action="submit", session_id="<id>", data="yes")

# 如果需要，终止进程
process(action="kill", session_id="<id>")
```

## 关键标志

| 标志 | 效果 |
|------|--------|
| `exec "prompt"` | 一次性执行，完成后退出 |
| `--full-auto` | 沙盒环境但自动批准工作区中的文件更改 |
| `--yolo` | 无沙盒，无需批准（最快，最危险） |

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
terminal(command="gh pr create --repo user/repo --head fix/issue-78 --title 'fix: ...' --body '...'")

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
terminal(command="gh pr comment 86 --body '<review>'", workdir="~/project")
```

## 规则

1. **始终使用 `pty=true`** — Codex 是一个交互式终端应用，没有 PTY 会挂起
2. **需要 git 仓库** — Codex 不会在 git 目录外运行。临时工作请使用 `mktemp -d && git init`
3. **一次性任务使用 `exec`** — `codex exec "prompt"` 运行后干净退出
4. **构建时使用 `--full-auto`** — 自动批准沙盒内的更改
5. **长时间任务使用后台模式** — 使用 `background=true` 并通过 `process` 工具监控
6. **不要干扰** — 使用 `poll`/`log` 监控，对长时间运行的任务保持耐心
7. **并行运行无妨** — 可同时运行多个 Codex 进程以进行批量工作