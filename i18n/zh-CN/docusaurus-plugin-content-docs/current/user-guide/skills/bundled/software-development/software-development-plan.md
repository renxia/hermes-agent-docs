---
title: "计划 — 计划模式：将 markdown 计划写入"
sidebar_label: "计划"
description: "计划模式：将 markdown 计划写入"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页。 */}

# 计划

计划模式：将 markdown 计划写入 `.hermes/plans/`，不执行。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/software-development/plan` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `planning`, `plan-mode`, `implementation`, `workflow` |
| 相关技能 | [`writing-plans`](/user-guide/skills/bundled/software-development/software-development-writing-plans), [`subagent-driven-development`](/user-guide/skills/bundled/software-development/software-development-subagent-driven-development) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是技能激活时智能体所看到的说明。
:::

# 计划模式

当用户想要计划而不是执行时使用此技能。

## 核心行为

在本次交互中，你只进行规划。

- 不要实现代码。
- 不要编辑项目文件，除了计划 markdown 文件。
- 不要运行会改变状态的终端命令、提交、推送或执行外部操作。
- 你可以根据需要使用只读命令/工具检查代码仓库或其他上下文。
- 你的交付物是保存在活动工作区 `.hermes/plans/` 目录下的一个 markdown 计划。

## 输出要求

编写一份具体且可操作的 markdown 计划。

在相关情况下包含：
- 目标
- 当前上下文 / 假设
- 建议的方法
- 分步计划
- 可能更改的文件
- 测试 / 验证
- 风险、权衡和待解决问题

如果任务与代码相关，请包含确切的文件路径、可能的测试目标和验证步骤。

## 保存位置

使用 `write_file` 将计划保存到：
- `.hermes/plans/YYYY-MM-DD_HHMMSS-<slug>.md`

将此路径视为相对于活动工作目录 / 后端工作区。Hermes 文件工具具有后端感知能力，因此使用此相对路径可确保计划在本地、Docker、SSH、Modal 和 Daytona 后端都与工作区关联。

如果运行时提供了特定的目标路径，请使用该确切路径。
如果没有，请在 `.hermes/plans/` 下自行创建一个合理的带时间戳的文件名。

## 交互风格

- 如果请求足够明确，直接编写计划。
- 如果 `/plan` 没有伴随明确的指令，请从当前对话上下文中推断任务。
- 如果确实描述不足，与其猜测，不如提出一个简短的澄清问题。
- 保存计划后，简要回复你计划了什么以及保存的路径。