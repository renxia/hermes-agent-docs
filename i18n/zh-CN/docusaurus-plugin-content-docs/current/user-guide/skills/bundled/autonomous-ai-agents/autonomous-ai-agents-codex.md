title: "Codex — Delegate coding to OpenAI Codex CLI (features, PRs)"
sidebar_label: "Codex"
description: "Delegate coding to OpenAI Codex CLI (features, PRs)"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Codex

将编码任务委托给 OpenAI Codex CLI（功能、PR）。

## 技能元数据 (Skill metadata)

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/autonomous-ai-agents/codex` |
| Version | `1.0.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `Coding-Agent`, `Codex`, `OpenAI`, `Code-Review`, `Refactoring` |
| Related skills | [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Codex CLI

通过 Hermes 终端将编码任务委托给 [Codex](https://github.com/openai/codex)。Codex 是 OpenAI 的自主编码智能体 CLI。

## 何时使用 (When to use)

- 构建功能
- 重构
- PR 审查
- 批量问题修复

需要 Codex CLI 和一个 Git 仓库。

## 先决条件 (Prerequisites)

- 已安装 Codex: `npm install -g @openai/codex`
- 配置了 OpenAI 认证：使用 `OPENAI_API_KEY` 或来自 Codex CLI 登录流程的 Codex OAuth 凭证
- **必须在 Git 仓库内部运行** — Codex 不允许在外部运行
- 在终端调用中使用 `pty=true` — Codex 是一个交互式终端应用

对于 Hermes 本身，`model.provider: openai-codex` 使用的是从 `~/.hermes/auth.json` 获取的、由 Hermes 管理的 Codex OAuth，该文件是在运行 `hermes auth add openai-codex` 后生成的。对于独立的 Codex CLI，有效的 CLI OAuth 会话可能存储在 `~/.codex/auth.json` 下；不要仅凭此判断缺少 `OPENAI_API_KEY` 就意味着 Codex 认证缺失。

## 一次性任务 (One-Shot Tasks)

```
terminal(command="codex exec 'Add dark mode toggle to settings'", workdir="~/project", pty=true)
```

对于临时工作（Codex 需要一个 Git 仓库）：
```
terminal(command="cd $(mktemp -d) && git init && codex exec 'Build a snake game in Python'", pty=true)
```

## 后台模式（长时间任务）(Background Mode (Long Tasks))

```
# 在后台启动并使用 PTY
terminal(command="codex exec --full-auto 'Refactor the auth module'", workdir="~/project", background=true, pty=true)
# 返回 session_id

# 监控进度
process(action="poll", session_id="<id>")
process(action="log", session_id="<id>")

# 如果 Codex 提问，则发送输入
process(action="submit", session_id="<id>", data="yes")

# 需要时进行终止
process(action="kill", session_id="<id>")
```

## 关键标志 (Key Flags)

| Flag | 效果 |
|------|--------|
| `exec "prompt"` | 一次性执行，完成后退出 |
| `--full-auto` | 沙箱化但会自动批准工作区中的文件更改 |
| `--yolo` | 无沙箱、无审批（最快、风险最高） |
| `--sandbox danger-full-access` | 无 Codex 沙箱；当宿主服务上下文破坏 bubblewrap 时有用 |

## Hermes 网关注意事项 (Hermes Gateway Caveat)

当从 Hermes 网关/服务上下文调用 Codex CLI 时（例如，Telegram 驱动的智能体会话），即使相同的命令在用户的交互式 shell 中有效，Codex 的 `workspace-write` 沙箱也可能失败。典型的症状是 bubblewrap/用户命名空间错误，例如 `setting up uid map: Permission denied` 或 `loopback: Failed RTM_NEWADDR: Operation not permitted`。

在这种情况下，请优先使用：

```
codex exec --sandbox danger-full-access "<task>"
```

转而将过程边界作为安全层：明确的 `workdir`、在启动前的 Git 状态清理、狭窄的任务提示、`git diff` 审查、有针对性的测试以及在提交重大更改之前的人工/智能体确认。

## PR 审查 (PR Reviews)

克隆到临时目录进行安全审查：

```
terminal(command="REVIEW=$(mktemp -d) && git clone https://github.com/user/repo.git $REVIEW && cd $REVIEW && gh pr checkout 42 && codex review --base origin/main", pty=true)
```

## 使用工作树进行并行问题修复 (Parallel Issue Fixing with Worktrees)

```
# 创建工作树
terminal(command="git worktree add -b fix/issue-78 /tmp/issue-78 main", workdir="~/project")
terminal(command="git worktree add -b fix/issue-99 /tmp/issue-99 main", workdir="~/project")

# 在每个工作树中启动 Codex
terminal(command="codex --yolo exec 'Fix issue #78: <description>. Commit when done.'", workdir="/tmp/issue-78", background=true, pty=true)
terminal(command="codex --yolo exec 'Fix issue #99: <description>. Commit when done.'", workdir="/tmp/issue-99", background=true, pty=true)

# 监控
process(action="list")

# 完成后，推送并创建 PR
terminal(command="cd /tmp/issue-78 && git push -u origin fix/issue-78")
terminal(command="gh pr create --repo user/repo --head fix/issue-78 --title 'fix: ...' --body '...'")

# 清理
terminal(command="git worktree remove /tmp/issue-78", workdir="~/project")
```

## 批量 PR 审查 (Batch PR Reviews)

```
# 获取所有 PR refs
terminal(command="git fetch origin '+refs/pull/*/head:refs/remotes/origin/pr/*'", workdir="~/project")

# 并行审查多个 PR
terminal(command="codex exec 'Review PR #86. git diff origin/main...origin/pr/86'", workdir="~/project", background=true, pty=true)
terminal(command="codex exec 'Review PR #87. git diff origin/main...origin/pr/87'", workdir="~/project", background=true, pty=true)

# 发布结果
terminal(command="gh pr comment 86 --body '<review>'", workdir="~/project")
```

## 规则 (Rules)

1. **始终使用 `pty=true`** — Codex 是一个交互式终端应用，没有 PTY 会挂起。
2. **需要 Git 仓库** — Codex 不会在非 Git 目录中运行。对于临时工作，请使用 `mktemp -d && git init`。
3. **使用 `exec` 进行一次性任务** — `codex exec "prompt"` 会运行并干净退出。
4. **使用 `--full-auto` 进行构建** — 在沙箱内自动批准更改。
5. **长时间任务使用后台模式** — 使用 `background=true` 并通过 `process` 工具进行监控。
6. **不要干扰** — 使用 `poll`/`log` 监控，耐心等待长时间运行的任务。
7. **并行是可行的** — 同时运行多个 Codex 进程以完成批量工作。