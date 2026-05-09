---
title: "计划 — 计划模式：编写 Markdown 计划到"
sidebar_label: "计划"
description: "计划模式：编写 Markdown 计划到"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 计划

计划模式：编写 Markdown 计划到 .hermes/plans/，不执行。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/software-development/plan` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 标签 | `planning`, `plan-mode`, `implementation`, `workflow` |
| 相关技能 | [`writing-plans`](/docs/user-guide/skills/bundled/software-development/software-development-writing-plans), [`subagent-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-subagent-driven-development) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 计划模式

当用户想要一个计划而不是执行时，使用此技能。

## 核心行为

本轮中，您仅进行规划。

- 不要实现代码。
- 不要编辑项目文件，除非是计划 Markdown 文件。
- 不要运行会改变状态的终端命令、提交、推送或执行外部操作。
- 在需要时，您可以使用只读命令/工具检查仓库或其他上下文。
- 您的交付物是一个 Markdown 计划，保存在活动工作区下的 `.hermes/plans/` 中。

## 输出要求

编写一个具体且可执行的 Markdown 计划。

在相关时包括：
- 目标
- 当前上下文 / 假设
- 建议的方法
- 分步计划
- 可能更改的文件
- 测试 / 验证
- 风险、权衡和未决问题

如果任务是代码相关的，请包括确切的文件路径、可能的测试目标和验证步骤。

## 保存位置

使用 `write_file` 将计划保存到：
- `.hermes/plans/YYYY-MM-DD_HHMMSS-<slug>.md`

将此路径视为相对于活动工作目录 / 后端工作区。Hermes 文件工具是后端感知的，因此使用此相对路径可将计划保存在本地、Docker、SSH、Modal 和 Daytona 后端的工作区中。

如果运行时提供了特定的目标路径，请使用该确切路径。
如果没有，请在 `.hermes/plans/` 下自行创建一个合理的时间戳文件名。

## 交互风格

- 如果请求足够清晰，请直接编写计划。
- 如果 `/plan` 没有附带明确的指令，请从当前对话上下文中推断任务。
- 如果确实未明确指定，请提出简短的澄清问题，而不是猜测。
- 保存计划后，简要回复您计划的内容以及保存的路径。