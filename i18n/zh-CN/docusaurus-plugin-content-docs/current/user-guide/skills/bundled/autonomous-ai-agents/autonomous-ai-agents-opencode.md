---
title: "Opencode — 将编码任务委托给 OpenCode CLI（功能、PR 审查）"
sidebar_label: "Opencode"
description: "将编码任务委托给 OpenCode CLI（功能、PR 审查）"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。 */}

# Opencode

将编码任务委托给 OpenCode CLI（功能、PR 审查）。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/autonomous-ai-agents/opencode` |
| 版本 | `1.2.0` |
| 作者 | Hermes Agent |
| 许可 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Coding-Agent`, `OpenCode`, `Autonomous`, `Refactoring`, `Code-Review` |
| 相关技能 | [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 加载此技能时触发的完整技能定义。这是技能激活时智能体看到的指令。
:::

# OpenCode CLI

将 [OpenCode](https://opencode.ai) 用作由 Hermes 终端/进程工具编排的自主编码工作者。OpenCode 是一个提供者无关、开源的 AI 编码智能体，具有 TUI 和 CLI。

## 何时使用

- 用户明确要求使用 OpenCode
- 您希望一个外部编码智能体来实现/重构/审查代码
- 您需要带有进度检查的长时间运行编码会话
- 您希望在隔离的工作目录/工作树中并行执行任务

## 前提条件

- 已安装 OpenCode: `npm i -g opencode-ai@latest` 或 `brew install anomalyco/tap/opencode`
- 已配置认证：`opencode auth login` 或设置提供者环境变量 (OPENROUTER_API_KEY, 等)
- 验证：`opencode auth list` 应至少显示一个提供者
- 用于代码任务的 Git 仓库（推荐）
- 用于交互式 TUI 会话的 `pty=true`

## 二进制解析（重要）

Shell 环境可能会解析不同的 OpenCode 二进制文件。如果您的终端和 Hermes 之间行为不同，请检查：

```
terminal(command="which -a opencode")
terminal(command="opencode --version")
```

如果需要，固定一个显式的二进制文件路径：

```
terminal(command="$HOME/.opencode/bin/opencode run '...'", workdir="~/project", pty=true)
```

## 单次任务

使用 `opencode run` 处理有界的、非交互式任务：

```
terminal(command="opencode run 'Add retry logic to API calls and update tests'", workdir="~/project")
```

使用 `-f` 附加上下文文件：

```
terminal(command="opencode run 'Review this config for security issues' -f config.yaml -f .env.example", workdir="~/project")
```

使用 `--thinking` 显示模型思考过程：

```
terminal(command="opencode run 'Debug why tests fail in CI' --thinking", workdir="~/project")
```

强制使用特定模型：

```
terminal(command="opencode run 'Refactor auth module' --model openrouter/anthropic/claude-sonnet-4", workdir="~/project")
```

## 交互式会话（后台）

对于需要多次交换的迭代工作，在后台启动 TUI：

```
terminal(command="opencode", workdir="~/project", background=true, pty=true)
# 返回 session_id

# 发送提示
process(action="submit", session_id="<id>", data="Implement OAuth refresh flow and add tests")

# 监控进度
process(action="poll", session_id="<id>")
process(action="log", session_id="<id>")

# 发送后续输入
process(action="submit", session_id="<id>", data="Now add error handling for token expiry")

# 正常退出 — Ctrl+C
process(action="write", session_id="<id>", data="\x03")
# 或直接终止进程
process(action="kill", session_id="<id>")
```

**重要：** 不要使用 `/exit` — 它不是有效的 OpenCode 命令，并将打开一个智能体选择器对话框。使用 Ctrl+C (`\x03`) 或 `process(action="kill")` 退出。

### TUI 快捷键

| 按键 | 操作 |
|-----|--------|
| `Enter` | 提交消息（如有需要可按两次） |
| `Tab` | 在智能体间切换（build/plan） |
| `Ctrl+P` | 打开命令面板 |
| `Ctrl+X L` | 切换会话 |
| `Ctrl+X M` | 切换模型 |
| `Ctrl+X N` | 新建会话 |
| `Ctrl+X E` | 打开编辑器 |
| `Ctrl+C` | 退出 OpenCode |

### 恢复会话

退出后，OpenCode 会打印一个会话 ID。通过以下方式恢复：

```
terminal(command="opencode -c", workdir="~/project", background=true, pty=true)  # 继续上一个会话
terminal(command="opencode -s ses_abc123", workdir="~/project", background=true, pty=true)  # 特定会话
```

## 常用标志

| 标志 | 用途 |
|------|-----|
| `run 'prompt'` | 单次执行并退出 |
| `--continue` / `-c` | 继续上一个 OpenCode 会话 |
| `--session <id>` / `-s` | 继续特定会话 |
| `--agent <name>` | 选择 OpenCode 智能体（build 或 plan） |
| `--model provider/model` | 强制使用特定模型 |
| `--format json` | 机器可读的输出/事件 |
| `--file <path>` / `-f` | 将文件附加到消息 |
| `--thinking` | 显示模型思考块 |
| `--variant <level>` | 推理努力程度（high, max, minimal） |
| `--title <name>` | 命名会话 |
| `--attach <url>` | 连接到正在运行的 opencode 服务器 |

## 流程

1. 验证工具就绪性：
   - `terminal(command="opencode --version")`
   - `terminal(command="opencode auth list")`
2. 对于有界任务，使用 `opencode run '...'`（不需要 pty）。
3. 对于迭代任务，使用 `background=true, pty=true` 启动 `opencode`。
4. 使用 `process(action="poll"|"log")` 监控长时间任务。
5. 如果 OpenCode 请求输入，通过 `process(action="submit", ...)` 响应。
6. 使用 `process(action="write", data="\x03")` 或 `process(action="kill")` 退出。
7. 将文件更改、测试结果和后续步骤总结反馈给用户。

## PR 审查工作流

OpenCode 有一个内置的 PR 命令：

```
terminal(command="opencode pr 42", workdir="~/project", pty=true)
```

或者在临时克隆中进行审查以实现隔离：

```
terminal(command="REVIEW=$(mktemp -d) && git clone https://github.com/user/repo.git $REVIEW && cd $REVIEW && opencode run 'Review this PR vs main. Report bugs, security risks, test gaps, and style issues.' -f $(git diff origin/main --name-only | head -20 | tr '\n' ' ')", pty=true)
```

## 并行工作模式

使用单独的工作目录/工作树以避免冲突：

```
terminal(command="opencode run 'Fix issue #101 and commit'", workdir="/tmp/issue-101", background=true, pty=true)
terminal(command="opencode run 'Add parser regression tests and commit'", workdir="/tmp/issue-102", background=true, pty=true)
process(action="list")
```

## 会话与成本管理

列出过去的会话：

```
terminal(command="opencode session list")
```

检查 token 使用情况和成本：

```
terminal(command="opencode stats")
terminal(command="opencode stats --days 7 --models anthropic/claude-sonnet-4")
```

## 常见陷阱

- 交互式 `opencode` (TUI) 会话需要 `pty=true`。`opencode run` 命令不需要 pty。
- `/exit` 不是有效命令 — 它会打开智能体选择器。使用 Ctrl+C 退出 TUI。
- PATH 不匹配可能导致选择了错误的 OpenCode 二进制文件/模型配置。
- 如果 OpenCode 看起来卡住，在终止前请先检查日志：
  - `process(action="log", session_id="<id>")`
- 避免在并行 OpenCode 会话间共享同一个工作目录。
- 在 TUI 中提交消息可能需要按两次 Enter 键（一次用于最终确定文本，一次用于发送）。

## 验证

冒烟测试：

```
terminal(command="opencode run 'Respond with exactly: OPENCODE_SMOKE_OK'")
```

成功标准：
- 输出包含 `OPENCODE_SMOKE_OK`
- 命令退出时没有提供者/模型错误
- 对于代码任务：预期的文件已更改且测试通过

## 规则

1. 对于单次自动化，优先使用 `opencode run` — 它更简单且不需要 pty。
2. 仅在需要迭代时才使用交互式后台模式。
3. 始终将 OpenCode 会话限定在单个仓库/工作目录内。
4. 对于长时间任务，提供来自 `process` 日志的进度更新。
5. 报告具体结果（更改的文件、测试、剩余风险）。
6. 使用 Ctrl+C 或终止退出交互式会话，切勿使用 `/exit`。