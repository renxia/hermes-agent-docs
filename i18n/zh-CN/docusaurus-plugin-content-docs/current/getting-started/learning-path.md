---
sidebar_position: 3
title: '学习路径'
description: '根据您的经验水平和目标，在 Hermes Agent 文档中选择适合您的学习路径。'
---

# 学习路径

Hermes Agent 功能丰富——CLI 助手、Telegram/Discord 机器人、任务自动化、强化学习训练等等。本页面将帮助您确定从哪里开始阅读，以及根据您的经验水平和目标选择哪些内容。

:::tip 从这里开始
如果您尚未安装 Hermes Agent，请首先阅读 [安装指南](/docs/getting-started/installation)，然后完成 [快速入门](/docs/getting-started/quickstart)。以下内容均假设您已有一个可用的安装环境。
:::

## 如何使用此页面

- **知道自己的水平？** 跳转到[按经验水平分类](#by-experience-level)表格，并按照对应层级的推荐阅读顺序进行学习。
- **有特定目标？** 直接前往[按使用场景分类](#by-use-case)，找到与您需求匹配的场景。
- **只是浏览？** 查看[关键功能一览](#key-features-at-a-glance)表格，快速了解 Hermes Agent 的所有能力。

## 按经验水平分类

| 级别 | 目标 | 推荐阅读 | 预计耗时 |
|---|---|---|---|
| **初学者** | 快速上手，进行基础对话，使用内置工具 | [安装](/docs/getting-started/installation) → [快速入门](/docs/getting-started/quickstart) → [CLI 使用](/docs/user-guide/cli) → [配置](/docs/user-guide/configuration) | ~1 小时 |
| **中级用户** | 搭建消息机器人，使用高级功能如记忆、定时任务和技能 | [会话管理](/docs/user-guide/sessions) → [消息系统](/docs/user-guide/messaging) → [工具](/docs/user-guide/features/tools) → [技能](/docs/user-guide/features/skills) → [记忆](/docs/user-guide/features/memory) → [定时任务（Cron）](/docs/user-guide/features/cron) | ~2–3 小时 |
| **高级用户** | 构建自定义工具，创建技能包，使用强化学习训练模型，参与项目开发 | [架构设计](/docs/developer-guide/architecture) → [添加工具](/docs/developer-guide/adding-tools) → [创建技能](/docs/developer-guide/creating-skills) → [强化学习训练](/docs/user-guide/features/rl-training) → [贡献代码](/docs/developer-guide/contributing) | ~4–6 小时 |

## 按使用场景分类

选择与您目标匹配的使用场景，每个场景都会链接到相关文档，并按推荐顺序列出。

### "我想要一个 CLI 编程助手"

将 Hermes Agent 用作交互式终端助手，用于编写、审查和运行代码。

1. [安装](/docs/getting-started/installation)
2. [快速入门](/docs/getting-started/quickstart)
3. [CLI 使用](/docs/user-guide/cli)
4. [代码执行](/docs/user-guide/features/code-execution)
5. [上下文文件](/docs/user-guide/features/context-files)
6. [技巧与窍门](/docs/guides/tips)

:::tip
通过上下文文件将文件直接传入对话中。Hermes Agent 可以读取、编辑并在您的项目中运行代码。
:::

### "我想要一个 Telegram/Discord 机器人"

将 Hermes Agent 部署到您喜爱的消息平台上的机器人。

1. [安装](/docs/getting-started/installation)
2. [配置](/docs/user-guide/configuration)
3. [消息系统概览](/docs/user-guide/messaging)
4. [Telegram 设置](/docs/user-guide/messaging/telegram)
5. [Discord 设置](/docs/user-guide/messaging/discord)
6. [语音模式](/docs/user-guide/features/voice-mode)
7. [在 Hermes 中使用语音模式](/docs/guides/use-voice-mode-with-hermes)
8. [安全设置](/docs/user-guide/security)

完整项目示例请参见：
- [每日简报机器人](/docs/guides/daily-briefing-bot)
- [团队 Telegram 助手](/docs/guides/team-telegram-assistant)

### "我想要自动化任务"

安排周期性任务、批量处理作业或串联多个智能体操作。

1. [快速入门](/docs/getting-started/quickstart)
2. [定时任务（Cron）调度](/docs/user-guide/features/cron)
3. [批量处理](/docs/user-guide/features/batch-processing)
4. [委托](/docs/user-guide/features/delegation)
5. [钩子函数（Hooks）](/docs/user-guide/features/hooks)

:::tip
定时任务让 Hermes Agent 可以在预定时间自动执行任务——例如每日摘要、定期检查、自动生成报告等，无需人工干预。
:::

### "我想要构建自定义工具/技能"

使用您自己的工具和可复用的技能包扩展 Hermes Agent。

1. [工具概览](/docs/user-guide/features/tools)
2. [技能概览](/docs/user-guide/features/skills)
3. [MCP（模型上下文协议）](/docs/user-guide/features/mcp)
4. [架构设计](/docs/developer-guide/architecture)
5. [添加工具](/docs/developer-guide/adding-tools)
6. [创建技能](/docs/developer-guide/creating-skills)

:::tip
工具是智能体可以调用的独立函数；技能则是包含工具、提示词和配置的打包插件。从工具入手，逐步过渡到技能。
:::

### "我想要训练模型"

使用强化学习微调模型行为，借助 Hermes Agent 内置的 RL 训练流水线。

1. [快速入门](/docs/getting-started/quickstart)
2. [配置](/docs/user-guide/configuration)
3. [强化学习训练](/docs/user-guide/features/rl-training)
4. [提供商路由](/docs/user-guide/features/provider-routing)
5. [架构设计](/docs/developer-guide/architecture)

:::tip
RL 训练最好在您已经理解 Hermes Agent 如何处理对话和工具调用的基础上进行。如果是新手，请先完成初学者路径。
:::

### "我想将其作为 Python 库使用"

以编程方式将 Hermes Agent 集成到您的 Python 应用程序中。

1. [安装](/docs/getting-started/installation)
2. [快速入门](/docs/getting-started/quickstart)
3. [Python 库指南](/docs/guides/python-library)
4. [架构设计](/docs/developer-guide/architecture)
5. [工具](/docs/user-guide/features/tools)
6. [会话管理](/docs/user-guide/sessions)

## 关键功能一览

不确定有哪些可用功能？以下是主要功能的快速目录：

| 功能 | 作用 | 链接 |
|---|---|---|
| **工具** | 智能体可调用的内置工具（文件 I/O、搜索、Shell 等） | [工具](/docs/user-guide/features/tools) |
| **技能** | 可安装的插件包，用于添加新能力 | [技能](/docs/user-guide/features/skills) |
| **记忆** | 跨会话持久化记忆 | [记忆](/docs/user-guide/features/memory) |
| **上下文文件** | 将文件和目录传入对话 | [上下文文件](/docs/user-guide/features/context-files) |
| **MCP** | 通过模型上下文协议连接外部工具服务器 | [MCP](/docs/user-guide/features/mcp) |
| **定时任务（Cron）** | 安排周期性智能体任务 | [定时任务（Cron）](/docs/user-guide/features/cron) |
| **委托** | 启动子智能体实现并行工作 | [委托](/docs/user-guide/features/delegation) |
| **代码执行** | 运行可调用 Hermes 工具的 Python 脚本 | [代码执行](/docs/user-guide/features/code-execution) |
| **浏览器** | 网页浏览与抓取 | [浏览器](/docs/user-guide/features/browser) |
| **钩子函数（Hooks）** | 事件驱动的回调和中件介 | [钩子函数（Hooks）](/docs/user-guide/features/hooks) |
| **批量处理** | 批量处理多个输入 | [批量处理](/docs/user-guide/features/batch-processing) |
| **强化学习训练** | 使用强化学习微调模型 | [强化学习训练](/docs/user-guide/features/rl-training) |
| **提供商路由** | 在多 LLM 提供商间路由请求 | [提供商路由](/docs/user-guide/features/provider-routing) |

## 接下来该读什么

根据您当前所处阶段：

- **刚完成安装？** → 前往 [快速入门](/docs/getting-started/quickstart) 运行第一次对话。
- **已完成快速入门？** → 阅读 [CLI 使用](/docs/user-guide/cli) 和 [配置](/docs/user-guide/configuration) 来自定义您的设置。
- **熟悉基本操作？** → 探索 [工具](/docs/user-guide/features/tools)、[技能](/docs/user-guide/features/skills) 和 [记忆](/docs/user-guide/features/memory)，解锁智能体的全部潜力。
- **准备团队协作？** → 阅读 [安全设置](/docs/user-guide/security) 和 [会话管理](/docs/user-guide/sessions)，了解访问控制和对话管理机制。
- **准备开发？** → 进入 [开发者指南](/docs/developer-guide/architecture)，了解内部原理并开始贡献代码。
- **想要实用示例？** → 查看 [指南](/docs/guides/tips) 部分，获取真实项目案例和技巧。

:::tip
您无需通读所有内容。选择与您的目标匹配的路径，按顺序点击链接，即可快速上手。随时可以回到本页面寻找下一步指引。
:::