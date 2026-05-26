---
title: "Blackbox — 将编码任务委托给 Blackbox AI CLI 智能体"
sidebar_label: "Blackbox"
description: "将编码任务委托给 Blackbox AI CLI 智能体"
---

{/* 此页面由网站脚本 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Blackbox

将编码任务委托给 Blackbox AI CLI 智能体。这是一个多模型智能体，内置评判功能，通过多个大语言模型运行任务并选择最佳结果。需要安装 blackbox CLI 和拥有 Blackbox AI API 密钥。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/autonomous-ai-agents/blackbox` 安装 |
| 路径 | `optional-skills/autonomous-ai-agents/blackbox` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent (Nous Research) |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `编码智能体`, `Blackbox`, `多智能体`, `评判`, `多模型` |
| 相关技能 | [`claude-code`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`codex`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`hermes-agent`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Blackbox CLI

通过 Hermes 终端将编码任务委托给 [Blackbox AI](https://www.blackbox.ai/)。Blackbox 是一个 CLI 多模型编码智能体，它将任务分派给多个大语言模型（Claude、Codex、Gemini、Blackbox Pro），并使用评判器来选择最佳实现。

该 CLI 是 [开源的](https://github.com/blackboxaicode/cli)（GPL-3.0，TypeScript，从 Gemini CLI 分叉而来），支持交互式会话、非交互式单次执行、检查点、MCP 和视觉模型切换。

## 先决条件

- 已安装 Node.js 20+
- 已安装 Blackbox CLI：`npm install -g @blackboxai/cli`
- 或者从源码安装：
  ```
  git clone https://github.com/blackboxaicode/cli.git
  cd cli && npm install && npm install -g .
  ```
- 来自 [app.blackbox.ai/dashboard](https://app.blackbox.ai/dashboard) 的 API 密钥
- 已配置：运行 `blackbox configure` 并输入您的 API 密钥
- 在终端调用中使用 `pty=true` — Blackbox CLI 是一个交互式终端应用程序

## 单次任务

```
terminal(command="blackbox --prompt 'Add JWT authentication with refresh tokens to the Express API'", workdir="/path/to/project", pty=true)
```

用于快速临时工作：
```
terminal(command="cd $(mktemp -d) && git init && blackbox --prompt 'Build a REST API for todos with SQLite'", pty=true)
```

## 后台模式（长时间任务）

对于需要数分钟的任务，使用后台模式以便监控进度：

```
# 使用 PTY 在后台启动
terminal(command="blackbox --prompt 'Refactor the auth module to use OAuth 2.0'", workdir="~/project", background=true, pty=true)
# 返回 session_id

# 监控进度
process(action="poll", session_id="<id>")
process(action="log", session_id="<id>")

# 如果 Blackbox 询问问题，则发送输入
process(action="submit", session_id="<id>", data="yes")

# 如有需要，终止进程
process(action="kill", session_id="<id>")
```

## 检查点与恢复

Blackbox CLI 内置检查点支持，用于暂停和恢复任务：

```
# 任务完成后，Blackbox 会显示一个检查点标签
# 使用后续任务恢复：
terminal(command="blackbox --resume-checkpoint 'task-abc123-2026-03-06' --prompt 'Now add rate limiting to the endpoints'", workdir="~/project", pty=true)
```

## 会话命令

在交互式会话期间，使用以下命令：

| 命令 | 效果 |
|---------|--------|
| `/compress` | 压缩对话历史以节省 token |
| `/clear` | 清除历史记录并重新开始 |
| `/stats` | 查看当前 token 使用情况 |
| `Ctrl+C` | 取消当前操作 |

## PR 审查

克隆到临时目录以避免修改工作树：

```
terminal(command="REVIEW=$(mktemp -d) && git clone https://github.com/user/repo.git $REVIEW && cd $REVIEW && gh pr checkout 42 && blackbox --prompt 'Review this PR against main. Check for bugs, security issues, and code quality.'", pty=true)
```

## 并行工作

为独立任务启动多个 Blackbox 实例：

```
terminal(command="blackbox --prompt 'Fix the login bug'", workdir="/tmp/issue-1", background=true, pty=true)
terminal(command="blackbox --prompt 'Add unit tests for auth'", workdir="/tmp/issue-2", background=true, pty=true)

# 监控所有实例
process(action="list")
```

## 多模型模式

Blackbox 的独特功能是通过多个模型运行同一任务并对结果进行评判。通过 `blackbox configure` 配置要使用的模型 — 选择多个提供商以启用主席/评判工作流，CLI 会评估来自不同模型的输出并选择最佳的一个。

## 关键标志

| 标志 | 效果 |
|------|--------|
| `--prompt "task"` | 非交互式单次执行 |
| `--resume-checkpoint "tag"` | 从保存的检查点恢复 |
| `--yolo` | 自动批准所有操作和模型切换 |
| `blackbox session` | 开始交互式聊天会话 |
| `blackbox configure` | 更改设置、提供商、模型 |
| `blackbox info` | 显示系统信息 |

## 视觉支持

Blackbox 会自动检测输入中的图像，并可切换到多模态分析。VLM 模式：
- `"once"` — 仅为当前查询切换模型
- `"session"` — 为整个会话切换
- `"persist"` — 保持当前模型（不切换）

## Token 限制

通过 `.blackboxcli/settings.json` 控制 token 使用量：
```json
{
  "sessionTokenLimit": 32000
}
```

## 规则

1. **始终使用 `pty=true`** — Blackbox CLI 是一个交互式终端应用程序，没有 PTY 会挂起
2. **使用 `workdir`** — 让智能体专注于正确的目录
3. **长时间任务使用后台模式** — 使用 `background=true` 并通过 `process` 工具监控
4. **不要干扰** — 使用 `poll`/`log` 监控，不要因为会话运行慢就终止它们
5. **报告结果** — 完成后，检查更改内容并向用户总结
6. **积分消耗资金** — Blackbox 使用基于积分的系统；多模型模式消耗积分更快
7. **检查先决条件** — 在尝试委托之前，验证 `blackbox` CLI 是否已安装