---
title: "Blackbox — 将编码任务委托给 Blackbox AI CLI 智能体"
sidebar_label: "Blackbox"
description: "将编码任务委托给 Blackbox AI CLI 智能体"
---

{/* 本页面由网站脚本 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Blackbox

将编码任务委托给 Blackbox AI CLI 智能体。这是一个内置评估器的多模型智能体，可通过多个大语言模型执行任务并选择最佳结果。需要安装 blackbox CLI 和一个 Blackbox AI API 密钥。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/autonomous-ai-agents/blackbox` 安装 |
| 路径 | `optional-skills/autonomous-ai-agents/blackbox` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent (Nous Research) |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Coding-Agent`, `Blackbox`, `Multi-Agent`, `Judge`, `Multi-Model` |
| 相关技能 | [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。当技能激活时，这是智能体看到的指令。
:::

# Blackbox CLI

通过 Hermes 终端将编码任务委托给 [Blackbox AI](https://www.blackbox.ai/)。Blackbox 是一个多模型编码智能体 CLI，它将任务分派给多个大语言模型（Claude、Codex、Gemini、Blackbox Pro），并使用一个评估器来选择最佳实现。

该 CLI 是[开源](https://github.com/blackboxaicode/cli)的（GPL-3.0, TypeScript，从 Gemini CLI 分叉而来），支持交互式会话、非交互式单次执行、检查点、MCP 和视觉模型切换。

## 先决条件

- 已安装 Node.js 20+
- 已安装 Blackbox CLI：`npm install -g @blackboxai/cli`
- 或从源码安装：
  ```
  git clone https://github.com/blackboxaicode/cli.git
  cd cli && npm install && npm install -g .
  ```
- 从 [app.blackbox.ai/dashboard](https://app.blackbox.ai/dashboard) 获取 API 密钥
- 已配置：运行 `blackbox configure` 并输入您的 API 密钥
- 在终端调用中使用 `pty=true` — Blackbox CLI 是一个交互式终端应用

## 单次任务

```
terminal(command="blackbox --prompt '为 Express API 添加带有刷新令牌的 JWT 认证'", workdir="/path/to/project", pty=true)
```

用于快速临时工作：
```
terminal(command="cd $(mktemp -d) && git init && blackbox --prompt '使用 SQLite 构建一个待办事项的 REST API'", pty=true)
```

## 后台模式（长时间任务）

对于需要几分钟的任务，请使用后台模式以便您可以监控进度：

```
# 使用 PTY 在后台启动
terminal(command="blackbox --prompt '将认证模块重构为使用 OAuth 2.0'", workdir="~/project", background=true, pty=true)
# 返回 session_id

# 监控进度
process(action="poll", session_id="<id>")
process(action="log", session_id="<id>")

# 如果 Blackbox 提问则发送输入
process(action="submit", session_id="<id>", data="yes")

# 必要时终止
process(action="kill", session_id="<id>")
```

## 检查点与恢复

Blackbox CLI 内置了检查点支持，用于暂停和恢复任务：

```
# 任务完成后，Blackbox 会显示一个检查点标签
# 使用后续任务恢复：
terminal(command="blackbox --resume-checkpoint 'task-abc123-2026-03-06' --prompt '现在为端点添加速率限制'", workdir="~/project", pty=true)
```

## 会话命令

在交互式会话期间，使用以下命令：

| 命令 | 效果 |
|---------|--------|
| `/compress` | 压缩对话历史以节省令牌 |
| `/clear` | 清除历史并重新开始 |
| `/stats` | 查看当前令牌使用情况 |
| `Ctrl+C` | 取消当前操作 |

## PR 审查

克隆到临时目录以避免修改工作树：

```
terminal(command="REVIEW=$(mktemp -d) && git clone https://github.com/user/repo.git $REVIEW && cd $REVIEW && gh pr checkout 42 && blackbox --prompt '对照 main 分支审查此 PR。检查错误、安全问题和代码质量。'", pty=true)
```

## 并行工作

为独立的任务启动多个 Blackbox 实例：

```
terminal(command="blackbox --prompt '修复登录错误'", workdir="/tmp/issue-1", background=true, pty=true)
terminal(command="blackbox --prompt '为认证添加单元测试'", workdir="/tmp/issue-2", background=true, pty=true)

# 监控所有实例
process(action="list")
```

## 多模型模式

Blackbox 的独特功能是通过多个模型运行同一任务并评估结果。通过 `blackbox configure` 配置要使用的模型 — 选择多个提供商以启用主席/评估器工作流，其中 CLI 评估来自不同模型的输出并选择最佳的一个。

## 关键标志

| 标志 | 效果 |
|------|--------|
| `--prompt "task"` | 非交互式单次执行 |
| `--resume-checkpoint "tag"` | 从保存的检查点恢复 |
| `--yolo` | 自动批准所有操作和模型切换 |
| `blackbox session` | 启动交互式聊天会话 |
| `blackbox configure` | 更改设置、提供商、模型 |
| `blackbox info` | 显示系统信息 |

## 视觉支持

Blackbox 会自动检测输入中的图像，并可切换到多模态分析。VLM 模式：
- `"once"` — 仅为当前查询切换模型
- `"session"` — 为整个会话切换
- `"persist"` — 保持使用当前模型（不切换）

## 令牌限制

通过 `.blackboxcli/settings.json` 控制令牌使用：
```json
{
  "sessionTokenLimit": 32000
}
```

## 规则

1.  **始终使用 `pty=true`** — Blackbox CLI 是一个交互式终端应用，没有 PTY 会挂起。
2.  **使用 `workdir`** — 让智能体专注于正确的目录。
3.  **对长时间任务使用后台模式** — 使用 `background=true` 并通过 `process` 工具监控。
4.  **不要干扰** — 使用 `poll`/`log` 监控，不要因为会话慢就终止它们。
5.  **报告结果** — 完成后，检查更改内容并为用户总结。
6.  **信用额度消耗资金** — Blackbox 使用基于信用的系统；多模型模式消耗信用更快。
7.  **检查先决条件** — 在尝试委托之前，验证 `blackbox` CLI 已安装。