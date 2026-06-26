title: "Grok — 将编码委托给 xAI Grok Build CLI (功能，PR)"
sidebar_label: "Grok"
description: "将编码委托给 xAI Grok Build CLI (功能，PR)"
---

{/* 此页面由网站/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Grok

将编码委托给 xAI Grok Build CLI (功能，PR)。

## 技能元数据

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/autonomous-ai-agents/grok` 安装 |
| Path | `optional-skills/autonomous-ai-agents/grok` |
| Version | `0.1.0` |
| Author | Matt Maximo (MattMaximo)，Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `编码智能体`, `Grok`, `xAI`, `代码审查`, `重构`, `自动化` |
| Related skills | [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## Key Paths & Config

```
~/.hermes/config.yaml       Main configuration
~/.hermes/.env              API keys and secrets (under $HERMES_HOME if set)
$HERMES_HOME
```

# Grok Build CLI — Hermes 编排指南

通过 Hermes 终端将编码任务委托给 [Grok Build](https://docs.x.ai/build/overview)（xAI 的自主编码智能体 CLI，即 `grok` 命令）。Grok 可以读取文件、编写代码、运行 Shell 命令、生成子智能体和管理 Git 工作流。它有三种运行方式：交互式 TUI、**无头模式 (headless)** (`-p`) 以及作为 JSON-RPC 上的 **ACP 智能体**。

这是 `codex` 和 `claude-code` 的第三个兄弟项目。编排模式几乎相同——**对于一次性任务，请优先使用无头模式 `-p`**；而对于交互式会话，则使用 PTY。

## 何时使用

- 构建功能
- 重构
- PR 审查
- 批量问题修复
- 任何你原本会选择 Codex / Claude Code 但想用 Grok 的任务

## 前提条件

- **安装（推荐）：** `npm install -g @xai-official/grok`
  - 官方安装程序 `curl -fsSL https://x.ai/cli/install.sh | bash` 也可以使用，但某些环境中 `x.ai` 主机是 Cloudflare 防御的。npm 路径完全避免了这一依赖。
- **认证 — SuperGrok / X Premium+ 订阅（主要路径）：**
  - 运行 `grok login` 一次 → 会打开浏览器进行 OAuth → token 缓存到 `~/.grok/auth.json` 中。这使用了您的 **SuperGrok 或 X Premium+** 订阅（不涉及按 token 计费的 API）。
  - 通过查找 `~/.grok/auth.json` 来检查登录状态，或者运行一个廉价的无头烟雾测试：`grok --no-auto-update -p "Say ok."`
  - 在 TUI 中，`/logout` 用于登出，`/login`（或重新启动）用于登录。
- **无需 Git 仓库** — 与 Codex 不同，Grok 可以在非 Git 目录中正常运行（适用于临时/一次性任务）。
- **与 Claude Code / AGENTS.md 兼容，零配置即可使用** — Grok 会自动读取 `CLAUDE.md`、`.claude/` (技能、智能体、MCPs、钩子、规则) 和 `AGENTS.md` 系列文件。现有项目上下文即可直接使用。

> **API-key 回退方案（非此用户的默认设置）：** Grok 也支持设置 `XAI_API_KEY` 环境变量，通过 `api.x.ai` 进行按量付费。仅当 `grok login` / SuperGrok 认证不可用时才使用此方法。订阅路径（`grok login`）是此处预期的设置方式。

## 两种编排模式

### 模式 1：无头模式 (`-p`) — 非交互式（首选）

运行一次性任务，打印结果并退出。没有 PTY，没有需要导航的交互对话框。这是最干净的集成路径——类似于 `claude -p` 和 `codex exec`。

```
terminal(command="grok --no-auto-update -p 'Add a dark mode toggle to settings'", workdir="/path/to/project", timeout=180)
```

在自动化中始终传递 `--no-auto-update` 以跳过后台更新检查。

**何时使用无头模式：**
- 一次性编码任务（修复 Bug、添加功能、重构）
- CI/CD 自动化和脚本编写
- 使用 `--output-format json` 进行结构化输出解析
- 不需要多轮对话的任何任务

### 模式 2：交互式 PTY — 多轮 TUI 会话

TUI 是一个全屏、鼠标交互式的应用。使用 `pty=true` 来驱动它。对于稳健的监控/输入，请使用 tmux（与 `claude-code` 技能相同的模式）。

```
# 在 tmux 会话中启动以进行捕获面板监控
terminal(command="tmux new-session -d -s grok-work -x 140 -y 40")
terminal(command="tmux send-keys -t grok-work 'cd /path/to/project && grok' Enter")

# 等待启动，然后发送任务
terminal(command="sleep 5 && tmux send-keys -t grok-work 'Refactor the auth module to use JWT' Enter")

# 监控进度
terminal(command="sleep 15 && tmux capture-pane -t grok-work -p -S -50")

# 完成后退出
terminal(command="tmux send-keys -t grok-work '/quit' Enter && sleep 1 && tmux kill-session -t grok-work")
```

**关于无头但内联输出的提示：** 如果您想获得 TUI 风格的输出，但又不想被全屏替代屏幕接管（例如，为了更清晰的日志），请添加 `--no-alt-screen`。对于纯自动化，无头模式 `-p` 仍然比 TUI 更干净。

## 无头深度解析 (Headless Deep Dive)

### 常用标志

| 标志 | 效果 |
|------|--------|
| `-p, --single <PROMPT>` | 发送一个提示，以无头模式运行并退出 |
| `-m, --model <MODEL>` | 选择一个模型 |
| `-s, --session-id <ID>` | 创建或恢复一个命名的无头会话 |
| `-r, --resume <ID>` | 恢复一个现有会话 |
| `-c, --continue` | 在当前目录中继续最近的会话 |
| `--cwd <PATH>` | 设置工作目录 |
| `--output-format <FMT>` | `plain`（默认）、`json` 或 `streaming-json` |
| `--always-approve` | 自动批准所有工具执行（等同于 `--full-auto` / `--yolo`） |
| `--no-alt-screen` | 内联运行，不进行全屏 TUI 接管 |
| `--no-auto-update` | 跳过后台更新检查（在所有自动化中都应使用） |

### 输出格式

- `plain` — 人类可读的文本（默认）
- `json` — 运行结束时的一个 JSON 对象（干净地解析结果）
- `streaming-json` — 事件流式传输，以换行符分隔的 JSON

```
# 用于解析的结构化结果
terminal(command="grok --no-auto-update -p 'List all TODO comments in src/' --output-format json", workdir="/project", timeout=120)

# 自动批准用于自主构建
terminal(command="grok --no-auto-update --always-approve -p 'Refactor the database layer and run the tests'", workdir="/project", timeout=300)
```

### 后台模式（长任务）

```
# 在后台启动无头模式
terminal(command="grok --no-auto-update --always-approve -p 'Refactor the auth module'", workdir="/project", background=true, notify_on_complete=true)
# 返回 session_id

# 监控
process(action="poll", session_id="<id>")
process(action="log", session_id="<id>")

# 如果需要，则终止
process(action="kill", session_id="<id>")
```

对于交互式（TUI）后台会话，请使用 `pty=true` + tmux，并像 `claude-code` / `codex` 技能一样使用 `tmux capture-pane` 进行监控。

### 会话继续

```
# 启动一个命名会话
terminal(command="grok --no-auto-update -s refactor-db -p 'Start refactoring the database layer' --always-approve", workdir="/project", timeout=240)

# 稍后恢复它
terminal(command="grok --no-auto-update -r refactor-db -p 'Now add connection pooling' --always-approve", workdir="/project", timeout=180)

# 或者继续当前目录中最近的会话
terminal(command="grok --no-auto-update -c -p 'What did you change last time?'", workdir="/project", timeout=60)
```

## 只读审计 → Markdown 文档模式

要让 Grok 审查本地工件并返回一份干净的 markdown 文档（用于 Obsidian 或仓库），而不会修改任何内容：

1. 首先使用 Hermes 工具（`read_file`、`write_file`）准备稳定的输入文件。将相关上下文快照到一个临时文件中，而不是倾倒原始路径。
2. 在 Grok 中运行无头模式 **不带** `--always-approve`，使其无法自动写入，并要求 `markdown only, no preamble`（仅 markdown，无前言）。
3. 使用 `write_file()` 将 Grok 的 stdout 直接保存到目标文档中。

```
grok --no-auto-update -p "Read /tmp/current.md and /tmp/inventory.md. Produce markdown only, no preamble. Output a clean note titled 'Cleanup Review'." --output-format plain
```

**陷阱（与 Claude Code 相同）：** 对于文档重写，一个宽松的“请重写这个”提示可能会返回一个更改摘要，而不是完整的文档。正确的做法是：将文件作为输入提供，并要求 `Return ONLY the full revised markdown document. No intro, no explanation, no code fences. Start immediately with '# Title'.`（仅返回完整的修订版 markdown 文档。不要介绍、解释或代码围栏。立即从“# 标题”开始）。在覆盖目标文件之前，使用 `read_file()` 验证前几行内容。

## PR 审查模式

### 快速审查（无头模式）

```
terminal(command="cd /path/to/repo && git diff main...feature-branch | grok --no-auto-update -p 'Review this diff for bugs, security issues, and style problems. Be thorough.'", timeout=120)
```

### 克隆到临时目录审查（安全，不修改仓库）

```
terminal(command="REVIEW=$(mktemp -d) && git clone https://github.com/user/repo.git $REVIEW && cd $REVIEW && gh pr checkout 42 && grok --no-auto-update -p 'Review the changes vs origin/main. Check bugs, security, race conditions, missing tests.'", pty=true, timeout=300)
```

### 发布审查结果

```
terminal(command="gh pr comment 42 --body '<review text>'", workdir="/path/to/repo")
```

## 使用工作树进行并行问题修复

```
# 创建工作树
terminal(command="git worktree add -b fix/issue-78 /tmp/issue-78 main", workdir="~/project")
terminal(command="git worktree add -b fix/issue-99 /tmp/issue-99 main", workdir="~/project")

# 在每个工作树中启动 Grok（后台）
terminal(command="grok --no-auto-update --always-approve -p 'Fix issue #78: <description>. Commit when done.'", workdir="/tmp/issue-78", background=true, notify_on_complete=true)
terminal(command="grok --no-auto-update --always-approve -p 'Fix issue #99: <description>. Commit when done.'", workdir="/tmp/issue-99", background=true, notify_on_complete=true)

# 监控
process(action="list")

# 完成后：推送并创建 PR
terminal(command="cd /tmp/issue-78 && git push -u origin fix/issue-78")
terminal(command="gh pr create --repo user/repo --head fix/issue-78 --title 'fix: ...' --body '...'")

# 清理
terminal(command="git worktree remove /tmp/issue-78", workdir="~/project")
```

## 有用的子命令和 TUI 命令

| 命令 | 目的 |
|---------|---------|
| `grok` | 启动交互式 TUI |
| `grok -p "query"` | 无头一次性查询 |
| `grok login` / `grok logout` | 登录 / 登出（SuperGrok / X Premium+ OAuth） |
| `grok inspect` | 显示 Grok 在 cwd 中发现的内容：配置源、指令、技能、插件、钩子、MCP 服务器 |
| `grok agent stdio` | 作为 JSON-RPC 上的 ACP 智能体运行（用于 IDE/工具集成） |
| `grok update` | 更新 CLI（需要 `x.ai` 主机；自动化中跳过） |

TUI 斜杠命令（仅限交互式）：`/model <name>`、`/always-approve`、`/plan`、`/context`、`/compact`、`/resume`、`/sessions`、`/fork`、`/usage`、`/quit`。`Shift+Tab` 用于循环会话模式（包括计划模式，该模式会阻止写入工具，除非是会话计划文件）。

## 配置 (`~/.grok/config.toml`)

```toml
[cli]
auto_update = false          # 持续跳过后台更新检查

[ui]
permission_mode = "ask"      # 或设置为 "always-approve" 以默认跳过工具提示

[models]
default = "grok-build-0.1"
```

将全局偏好设置放在 `~/.grok/config.toml` 中（而不是项目范围的 `.grok/config.toml`）。`permission_mode` 凌驾于旧的 `approval_mode` / `yolo = true` 键之上。

## 陷阱和注意事项

1. **认证受订阅限制。** `grok login` 需要 SuperGrok 或 X Premium+ 订阅。如果登录失败或没有 `~/.grok/auth.json`，请在回退到 `XAI_API_KEY` 之前确认订阅是否激活。
2. **不要混淆 Hermes 的 xAI 认证和 `grok` CLI 的认证。** Hermes 的 `x_search` 是在其自己的 xAI OAuth 上运行的；独立的 `grok` CLI 在 `~/.grok/auth.json` 中有单独的 token。一个可用的 `x_search` **不代表** `grok` 已经登录。
3. **在自动化中始终传递 `--no-auto-update`** — 否则 Grok 会呼叫家（phone home）进行更新检查（而 `x.ai`/`storage.googleapis.com` 可能无法访问）。
4. **优先使用 npm install 而非 curl 安装程序** — `npm install -g @xai-official/grok` 可以避免 Cloudflare 防御的 `x.ai` 主机。
5. **`--always-approve` 是自主构建开关。** 没有它，无头运行可能会停滞等待工具批准提示。故意省略它来进行只读审查/审计工作，以确保 Grok 不会修改文件。
6. **无头模式 `-p` 会跳过 TUI 对话框**；TUI 需要 `pty=true`（+ tmux 进行监控），这与 Claude Code 相同。
7. **如果以内联方式运行 TUI，并且全屏替代屏幕接管导致捕获输出混乱，请使用 `--no-alt-screen`。**
8. **不需要 Git 仓库**，但对于 PR/提交工作流您可能仍需要一个——请使用 `mktemp -d && git init` 来进行临时提交任务。
9. **完成后请清理 tmux 会话**，使用 `tmux kill-session -t <name>`。

## Hermes 智能体规则

1. **对于单次任务，优先使用无头模式 (-p)** — 这是最干净的集成方式，可以通过 `--output-format json` 实现结构化输出。
2. **始终设置工作目录** (或 --cwd)，以确保 Grok 针对正确的项目。
3. **在每次自动化调用中传递 --no-auto-update。**
4. **仅当 Grok 需要自主编写时，才使用 --always-approve**；对于只读审查和审计，请省略此选项。
5. **将长时间任务放入后台**，设置 background=true, notify_on_complete=true，并通过进程工具进行监控。
6. **使用 tmux 进行多轮交互式工作**，并使用 `tmux capture-pane -t <session> -p -S -50` 进行监控。
7. **在使用身份验证之前进行验证** — 检查 `~/.grok/auth.json` 或运行一个廉价的 `grok -p "Say ok."` 烟雾测试；不要假设 Hermes 的 xAI 身份验证是可继承的。
8. **向用户报告结果** — 总结 Grok 更改了什么以及还剩下什么。