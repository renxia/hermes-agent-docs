---
title: "Opencode — 将编码工作委托给 OpenCode CLI（功能开发、PR 审查）"
sidebar_label: "Opencode"
description: "将编码工作委托给 OpenCode CLI（功能开发、PR 审查）"
---

{/* 本页面由网站脚本 `website/scripts/generate-skill-docs.py` 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# Opencode

将编码工作委托给 OpenCode CLI（功能开发、PR 审查）。

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
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# OpenCode CLI

使用 [OpenCode](https://opencode.ai) 作为由 Hermes 终端/进程工具编排的自主编码工作者。OpenCode 是一个提供者无关的、开源的 AI 编码智能体，具有 TUI 和 CLI。

## 何时使用

- 用户明确要求使用 OpenCode
- 你需要一个外部编码智能体来实现/重构/审查代码
- 你需要带进度检查的长时运行编码会话
- 你想要在隔离的工作目录/工作树中并行执行任务

## 前置条件

- 已安装 OpenCode：`npm i -g opencode-ai@latest` 或 `brew install anomalyco/tap/opencode`
- 已配置认证：`opencode auth login` 或设置提供者环境变量（如 OPENROUTER_API_KEY 等）
- 验证：`opencode auth list` 应至少显示一个提供者
- 用于代码任务的 Git 仓库（推荐）
- 交互式 TUI 会话需要 `pty=true`

## 二进制解析（重要）

Shell 环境可能解析到不同的 OpenCode 二进制文件。如果你的终端和 Hermes 的行为不一致，请检查：

```
terminal(command="which -a opencode")
terminal(command="opencode --version")
```

如果需要，指定一个显式的二进制路径：

```
terminal(command="$HOME/.opencode/bin/opencode run '...'", workdir="~/project", pty=true)
```

## 单次任务

对于有限的、非交互式任务，使用 `opencode run`：

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

对于需要多次交流的迭代工作，在后台启动 TUI：

```
terminal(command="opencode", workdir="~/project", background=true, pty=true)
# 返回 session_id

# 发送一个提示
process(action="submit", session_id="<id>", data="Implement OAuth refresh flow and add tests")

# 监控进度
process(action="poll", session_id="<id>")
process(action="log", session_id="<id>")

# 发送后续输入
process(action="submit", session_id="<id>", data="Now add error handling for token expiry")

# 干净地退出 — Ctrl+C
process(action="write", session_id="<id>", data="\x03")
# 或者直接终止进程
process(action="kill", session_id="<id>")
```

**重要：** 不要使用 `/exit` — 这不是一个有效的 OpenCode 命令，它会打开一个智能体选择对话框。请使用 Ctrl+C (`\x03`) 或 `process(action="kill")` 来退出。

### TUI 按键绑定

| 按键 | 操作 |
|-----|------|
| `Enter` | 提交消息（如需要可按两次） |
| `Tab` | 在智能体（构建/规划）之间切换 |
| `Ctrl+P` | 打开命令面板 |
| `Ctrl+X L` | 切换会话 |
| `Ctrl+X M` | 切换模型 |
| `Ctrl+X N` | 新建会话 |
| `Ctrl+X E` | 打开编辑器 |
| `Ctrl+C` | 退出 OpenCode |

### 恢复会话

退出后，OpenCode 会打印一个会话 ID。使用以下方式恢复：

```
terminal(command="opencode -c", workdir="~/project", background=true, pty=true)  # 继续上一个会话
terminal(command="opencode -s ses_abc123", workdir="~/project", background=true, pty=true)  # 特定会话
```

## 常用标志

| 标志 | 用途 |
|------|------|
| `run '提示'` | 单次执行并退出 |
| `--continue` / `-c` | 继续上一个 OpenCode 会话 |
| `--session <id>` / `-s` | 继续特定会话 |
| `--agent <name>` | 选择 OpenCode 智能体（build 或 plan） |
| `--model provider/model` | 强制使用特定模型 |
| `--format json` | 机器可读的输出/事件 |
| `--file <path>` / `-f` | 将文件附加到消息中 |
| `--thinking` | 显示模型思考块 |
| `--variant <level>` | 推理努力程度（high, max, minimal） |
| `--title <name>` | 为会话命名 |
| `--attach <url>` | 连接到正在运行的 opencode 服务器 |

## 流程

1.  验证工具就绪：
    -   `terminal(command="opencode --version")`
    -   `terminal(command="opencode auth list")`
2.  对于有限的任务，使用 `opencode run '...'`（不需要 pty）。
3.  对于迭代任务，使用 `background=true, pty=true` 启动 `opencode`。
4.  使用 `process(action="poll"|"log")` 监控长时间任务。
5.  如果 OpenCode 要求输入，通过 `process(action="submit", ...)` 响应。
6.  使用 `process(action="write", data="\x03")` 或 `process(action="kill")` 退出。
7.  向用户总结文件更改、测试结果和后续步骤。

## PR 审查工作流

OpenCode 有一个内置的 PR 命令：

```
terminal(command="opencode pr 42", workdir="~/project", pty=true)
```

或者在临时克隆中进行隔离审查：

```
terminal(command="REVIEW=$(mktemp -d) && git clone https://github.com/user/repo.git $REVIEW && cd $REVIEW && opencode run 'Review this PR vs main. Report bugs, security risks, test gaps, and style issues.' -f $(git diff origin/main --name-only | head -20 | tr '\n' ' ')", pty=true)
```

## 并行工作模式

使用独立的工作目录/工作树以避免冲突：

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

## 陷阱

-   交互式 `opencode`（TUI）会话需要 `pty=true`。`opencode run` 命令**不**需要 pty。
-   `/exit` **不是**有效命令 — 它会打开智能体选择器。使用 Ctrl+C 退出 TUI。
-   PATH 不匹配可能导致选择了错误的 OpenCode 二进制文件/模型配置。
-   如果 OpenCode 看起来卡住了，请在终止前检查日志：
    -   `process(action="log", session_id="<id>")`
-   避免在并行 OpenCode 会话中共享同一个工作目录。
-   在 TUI 中提交消息可能需要按两次 Enter（一次确认文本，一次发送）。

## 验证

冒烟测试：

```
terminal(command="opencode run 'Respond with exactly: OPENCODE_SMOKE_OK'")
```

成功标准：
-   输出包含 `OPENCODE_SMOKE_OK`
-   命令退出时没有提供者/模型错误
-   对于代码任务：预期的文件已更改并且测试通过

## 规则

1.  优先使用 `opencode run` 进行单次自动化 — 它更简单且不需要 pty。
2.  仅在需要迭代时使用交互式后台模式。
3.  始终将 OpenCode 会话限定在单个仓库/工作目录。
4.  对于长时间任务，根据 `process` 日志提供进度更新。
5.  报告具体结果（更改的文件、测试、剩余风险）。
6.  使用 Ctrl+C 或 kill 退出交互式会话，永远不要使用 `/exit`。