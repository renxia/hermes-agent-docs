---
title: "规划 — 规划模式：将markdown计划写入"
sidebar_label: "规划"
description: "规划模式：将markdown计划写入"
---

{/* 此页面由网站脚本`generate-skill-docs.py`从技能的`SKILL.md`文件自动生成。请编辑源文件`SKILL.md`，而非本页面。 */}

# 规划

规划模式：将markdown计划写入`.hermes/plans/`，不执行。

## 技能元数据

| | |
|---|---|
| 源 | 内置（默认安装） |
| 路径 | `skills/software-development/plan` |
| 版本 | `1.0.0` |
| 作者 | 赫尔墨斯智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `planning`, `plan-mode`, `implementation`, `workflow` |
| 相关技能 | [`writing-plans`](/docs/user-guide/skills/bundled/software-development/software-development-writing-plans), [`subagent-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-subagent-driven-development) |

## 参考：完整的SKILL.md

:::info
以下是赫尔墨斯在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指示。
:::

# 规划模式

当用户需要计划而非执行时，使用此技能。

## 核心行为

在此轮对话中，你只负责规划。

- 不要实现代码。
- 除了计划的markdown文件外，不要编辑项目文件。
- 不要运行会改变状态的终端命令、提交、推送或执行外部操作。
- 你可以在需要时使用只读命令/工具检查仓库或其他上下文。
- 你的交付物是一个保存在活动工作区`.hermes/plans/`下的markdown计划。

## 输出要求

编写一个具体、可操作的markdown计划。

相关时应包含：
- 目标
- 当前上下文 / 假设
- 建议的方法
- 分步计划
- 可能更改的文件
- 测试 / 验证
- 风险、权衡和待解决问题

如果任务与代码相关，请包含确切的文件路径、可能的测试目标和验证步骤。

## 保存位置

使用`write_file`将计划保存到：
- `.hermes/plans/YYYY-MM-DD_HHMMSS-<slug>.md`

将其视为相对于活动工作目录/后端工作区。赫尔墨斯的文件工具是后端感知的，因此使用此相对路径可将计划保存在本地、docker、ssh、modal和daytona后端的工作区中。

如果运行时提供了特定的目标路径，请使用该确切路径。
如果没有，请在`.hermes/plans/`下自行创建一个带时间戳的合理文件名。

## 交互风格

- 如果请求足够清晰，直接编写计划。
- 如果`/plan`没有伴随明确指令，从当前对话上下文中推断任务。
- 如果任务确实定义不清，提出一个简短的澄清问题，而不是猜测。
- 保存计划后，简要回复你计划了什么以及保存的路径。