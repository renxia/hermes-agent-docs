---
title: Antigravity Cli — 操作 Antigravity CLI (agy)：插件、认证、沙箱
sidebar_label: Antigravity Cli
description: 操作 Antigravity CLI (agy)：插件、认证、沙箱
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Antigravity Cli

操作 Antigravity CLI (agy)：插件、认证、沙箱。

## Skill metadata

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/autonomous-ai-agents/antigravity-cli` 安装 |
| Path | `optional-skills/autonomous-ai-agents/antigravity-cli` |
| Version | `0.1.0` |
| Author | Tony Simons (asimons81)，Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `Coding-智能体`, `Antigravity`, `CLI`, `Auth`, `Plugins`, `Sandbox` |
| Related skills | [`grok`](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-grok), [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## Reference: full SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Antigravity CLI (`agy`)

Antigravity CLI (agy) 的操作指南。所有 `agy` 命令都应通过 Hermes 的 `terminal` 工具运行；使用 `read_file` 检查其配置和日志。此技能是参考+流程，它不封装网络 API，因此不需要从 Hermes 本身进行认证。

## When to Use

- 安装、更新或烟雾测试 `agy` 二进制文件
- 运行非交互式的 `agy --print` / `agy -p` 单次任务
- 调试 Antigravity 的认证、沙箱、权限或插件状态
- 读取 Antigravity 的设置、键位绑定、对话或日志

## Mental model

Antigravity 有两个层次——保持它们清晰，否则指导将是错误的：

1. **Shell 包装器命令** — `agy help`、`agy install`、`agy plugin`、`agy update`、`agy changelog`。这些命令应通过 `terminal` 工具运行。
2. **交互式会话中的斜杠命令** — `/config`、`/permissions`、`/skills`、`/agents` 等。这些只存在于正在运行的 `agy` TUI 会话中，而不是在 Shell 包装器上。

`agy help` 显示的是 Shell 包装器的界面，而不是会话中的斜杠命令。

## Prerequisites

- `agy` 二进制文件位于 PATH 中。通过 `terminal` 工具验证：
  `command -v agy && agy --version`。
- 此技能不需要环境变量或 API 密钥——Antigravity 通过操作系统钥匙环/浏览器登录来管理其自身的认证（参见下方的“认证”）。

## How to Run

通过 `terminal` 工具调用每个 `agy` 命令。示例：

```
terminal(command="agy --version")
terminal(command="agy help")
terminal(command="agy plugin list")
terminal(command="agy --print 'Summarize the repo in 3 bullets'", workdir="/path/to/project")
```

对于交互式多轮次的 TUI 会话，请使用 `pty=true` 启动 `agy`（并使用 tmux 进行捕获/监控），这与 `codex` / `claude-code` 技能所使用的模式相同。对于单次任务烟雾测试和脚本化提示，请优先使用 `agy --print`（非交互式）。

要检查 Antigravity 自己的文件，请对 Core paths 下方的路径使用 `read_file`——不要通过终端使用 `cat` 命令查看它们。

## Core paths

- 二进制文件 / 入口点：`agy`
- 应用数据目录：`~/.gemini/antigravity-cli/`
- 设置文件：`~/.gemini/antigravity-cli/settings.json`
- 键位绑定文件：`~/.gemini/antigravity-cli/keybindings.json`
- 日志：`~/.gemini/antigravity-cli/log/cli-*.log`
- 对话：`~/.gemini/antigravity-cli/conversations/`
- 脑部产物：`~/.gemini/antigravity-cli/brain/`
- 历史记录：`~/.gemini/antigravity-cli/history.jsonl`
- 插件暂存区：`~/.gemini/antigravity-cli/plugins/<plugin_name>/`

## Quick Reference

### Wrapper commands
- `agy changelog`
- `agy help`
- `agy install`
- `agy plugin` / `agy plugins`
- `agy update`

### Useful flags
- `--add-dir`
- `--continue` / `-c`
- `--conversation`
- `--dangerously-skip-permissions`
- `--print` / `-p`
- `--print-timeout`
- `--prompt`
- `--prompt-interactive` / `-i`
- `--sandbox`
- `--log-file`
- `--version`

### Plugin subcommands (`agy plugin --help`)
- `list`, `import [source]`，`install <target>`，`uninstall <name>`，`enable <name>`，`disable <name>`，`validate [path]`，`link <mp> <target>`，`help`

### Install flags (`agy install --help`)
- `--dir`，`--skip-aliases`，`--skip-path`

### In-session slash commands
- **Conversation control:** `/resume` (`/switch`)，`/rewind` (`/undo`)，`/rename <name>`，`/clear`，`/fork`，`/reset`，`/new`
- **Settings & tools:** `/config`，`/settings`，`/permissions`，`/model`，`/keybindings`，`/statusline`，`/tasks`，`/skills`，`/mcp`，`/open <path>`，`/usage`，`/logout`，`/agents`
- **Prompt helpers:** `@` 路径自动补全，`esc esc` 清除提示（当不进行流式传输时），`!` 直接运行终端命令，`?` 打开帮助

## Settings and permissions

### Common settings keys (`settings.json`)
- `allowNonWorkspaceAccess`
- `colorScheme`
- `permissions.allow`
- `trustedWorkspaces`

### Permission modes
`request-review`，`always-proceed`，`strict`，`proceed-in-sandbox`。

### Sandbox behavior
- `enableTerminalSandbox` 是 `settings.json` 中的一个布尔值；默认值为 `false`。
- 启动时的覆盖设置（`--sandbox`、`--dangerously-skip-permissions`）可以凌驾于当前会话的持久性设置之上。

## Authentication behavior

- CLI 首先尝试操作系统安全钥匙环。
- 如果没有保存的会话，它将回退到基于浏览器的 Google 登录。
- 在本地，它会打开默认浏览器；通过 SSH 时，它会打印一个授权 URL，并期望粘贴回认证代码。
- `/logout` 会移除已保存的凭证。

## Plugins

- 插件位于 `~/.gemini/antigravity-cli/plugins/<plugin_name>/` 下。
- 它们可以打包技能、智能体、规则、MCP 服务器和钩子。
- `agy plugin list` 返回没有导入的插件是一个有效的空状态。

## Pitfalls

- `agy help` 显示的是包装器命令，而不是交互式斜杠命令。
- `agy --version` 是安全的非交互式版本检查；`agy version` 是交互式的，在没有真正的 TTY 时可能会失败。
- 查找故障的首要位置：`~/.gemini/antigravity-cli/log/cli-*.log`（使用 `read_file` 读取）。
- 不要将持久性 JSON 设置与启动时的覆盖设置混淆。
- `~/.gemini/antigravity-cli/bin/agentapi` 是 `agy agentapi` 的一个薄封装。
- 在 WSL 上，令牌存储是基于文件的，因此认证问题通常是本地文件/会话状态的问题，而不是仅浏览器的问题。
- 工作区身份可能取决于启动目录和 `.antigravitycli` 项目标记。

## Verification

确认安装是真实且可用的，所有操作均通过 `terminal` 工具进行（使用 `read_file` 读取文件）：

1. `terminal(command="command -v agy")`
2. `terminal(command="agy --version")`
3. `terminal(command="agy help")`
4. `terminal(command="agy plugin list")`
5. 对 `~/.gemini/antigravity-cli/settings.json` 使用 `read_file`
6. 对最新的 `~/.gemini/antigravity-cli/log/cli-*.log` 使用 `read_file`
7. 如果需要，对 `~/.gemini/antigravity-cli/keybindings.json` 使用 `read_file`

## Support files

- `references/cli-docs.md` — 包含入门、使用和功能文档的精简笔记。