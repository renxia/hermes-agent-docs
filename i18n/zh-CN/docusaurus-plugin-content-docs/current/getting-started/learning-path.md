---
sidebar_position: 3
title: '学习路径'
description: '根据您的经验水平和目标，通过 Hermes Agent 文档选择您的学习路径。'
---

# 学习路径

Hermes Agent 功能强大——它可以充当 CLI 助手、Telegram/Discord 机器人、任务自动化、强化学习训练等等。本页面旨在帮助您根据当前的经验水平和想要完成的任务，确定从何处开始学习以及阅读哪些内容。

:::tip 从这里开始
如果您尚未安装 Hermes Agent，请先阅读[安装指南](/docs/getting-started/installation)，然后运行[快速入门](/docs/getting-started/quickstart)。页面下方所有内容均假设您已成功完成安装。
:::

## 如何使用本页面

- **了解您的水平？** 跳转到[经验水平表](#by-experience-level)，并按照您所在层级的阅读顺序进行学习。
- **有特定的目标？** 跳到[按用例](#by-use-case)，找到符合您需求的场景。
- **只是浏览？** 查看[关键功能一览](#key-features-at-a-glance)表，快速了解 Hermes Agent 的所有功能。

## 按经验水平划分

| 水平 | 目标 | 推荐阅读 | 时间预估 |
|---|---|---|---|
| **初级** | 上手使用，进行基本对话，使用内置工具 | [安装](/docs/getting-started/installation) → [快速入门](/docs/getting-started/quickstart) → [CLI 使用](/docs/user-guide/cli) → [配置](/docs/user-guide/configuration) | 约 1 小时 |
| **中级** | 设置消息机器人，使用内存、定时任务和技能等高级功能 | [会话](/docs/user-guide/sessions) → [消息](/docs/user-guide/messaging) → [工具](/docs/user-guide/features/tools) → [技能](/docs/user-guide/features/skills) → [内存](/docs/user-guide/features/memory) → [定时任务](/docs/user-guide/features/cron) | 约 2–3 小时 |
| **高级** | 构建自定义工具，创建技能，使用 RL 训练模型，为项目贡献代码 | [架构](/docs/developer-guide/architecture) → [添加工具](/docs/developer-guide/adding-tools) → [创建技能](/docs/developer-guide/creating-skills) → [RL 训练](/docs/user-guide/features/rl-training) → [贡献](/docs/developer-guide/contributing) | 约 4–6 小时 |

## 按用例划分

选择与您目标匹配的场景。每个场景都会引导您阅读相关文档，并按照推荐的顺序排列。

### “我想要一个 CLI 编程助手”

将 Hermes Agent 用作交互式终端助手，用于编写、审查和运行代码。

1. [安装](/docs/getting-started/installation)
2. [快速入门](/docs/getting-started/quickstart)
3. [CLI 使用](/docs/user-guide/cli)
4. [代码执行](/docs/user-guide/features/code-execution)
5. [上下文文件](/docs/user-guide/features/context-files)
6. [技巧与窍门](/docs/guides/tips)

:::tip
将文件直接作为上下文文件传递给您的对话。Hermes Agent 可以在您的项目中读取、编辑和运行代码。
:::

### “我想要一个 Telegram/Discord 机器人”

将 Hermes Agent 部署为您喜欢的消息平台上的机器人。

1. [安装](/docs/getting-started/installation)
2. [配置](/docs/user-guide/configuration)
3. [消息概览](/docs/user-guide/messaging)
4. [Telegram 设置](/docs/user-guide/messaging/telegram)
5. [Discord 设置](/docs/user-guide/messaging/discord)
6. [语音模式](/docs/user-guide/features/voice-mode)
7. [使用 Hermes 的语音模式](/docs/guides/use-voice-mode-with-hermes)
8. [安全](/docs/user-guide/security)

完整的项目示例，请参阅：
- [每日简报机器人](/docs/guides/daily-briefing-bot)
- [团队 Telegram 助手](/docs/guides/team-telegram-assistant)

### “我想要自动化任务”

设置定期任务、运行批量作业，或将多个 Agent 操作链接起来。

1. [快速入门](/docs/getting-started/quickstart)
2. [定时任务调度](/docs/user-guide/features/cron)
3. [批量处理](/docs/user-guide/features/batch-processing)
4. [委托/委派](/docs/user-guide/features/delegation)
5. [钩子/挂钩](/docs/user-guide/features/hooks)

:::tip
定时任务（Cron jobs）允许 Hermes Agent 在您不在场的情况下运行任务——例如每日摘要、定期检查、自动化报告。
:::

### “我想要构建自定义工具/技能”

使用您自己的工具和可重用技能包扩展 Hermes Agent。

1. [工具概览](/docs/user-guide/features/tools)
2. [技能概览](/docs/user-guide/features/skills)
3. [MCP (模型上下文协议)](/docs/user-guide/features/mcp)
4. [架构](/docs/developer-guide/architecture)
5. [添加工具](/docs/developer-guide/adding-tools)
6. [创建技能](/docs/developer-guide/creating-skills)

:::tip
工具是 Agent 可以调用的单个函数。技能是打包在一起的工具、提示和配置的集合。建议从工具开始，逐步进阶到技能。
:::

### “我想要训练模型”

使用强化学习（RL）来微调模型行为，利用 Hermes Agent 内置的 RL 训练流程。

1. [快速入门](/docs/getting-started/quickstart)
2. [配置](/docs/user-guide/configuration)
3. [RL 训练](/docs/user-guide/features/rl-training)
4. [提供商路由](/docs/user-guide/features/provider-routing)
5. [架构](/docs/developer-guide/architecture)

:::tip
当您已经了解 Hermes Agent 如何处理对话和工具调用基础知识时，进行 RL 训练效果最佳。如果您是新手，请先从初级路径开始。
:::

### “我想要将其用作 Python 库”

通过编程方式将 Hermes Agent 集成到您自己的 Python 应用程序中。

1. [安装](/docs/getting-started/installation)
2. [快速入门](/docs/getting-started/quickstart)
3. [Python 库指南](/docs/guides/python-library)
4. [架构](/docs/developer-guide/architecture)
5. [工具](/docs/user-guide/features/tools)
6. [会话](/docs/user-guide/sessions)

## 关键功能一览

不确定有哪些功能？这里是主要功能的快速目录：

| 功能 | 功能描述 | 链接 |
|---|---|---|
| **工具 (Tools)** | Agent 可调用的内置工具（文件 I/O、搜索、Shell 等） | [工具](/docs/user-guide/features/tools) |
| **技能 (Skills)** | 可安装的插件包，用于增加新功能 | [技能](/docs/user-guide/features/skills) |
| **内存 (Memory)** | 跨会话的持久化记忆 | [内存](/docs/user-guide/features/memory) |
| **上下文文件 (Context Files)** | 将文件和目录作为上下文输入对话 | [上下文文件](/docs/user-guide/features/context-files) |
| **MCP** | 通过模型上下文协议连接外部工具服务器 | [MCP](/docs/user-guide/features/mcp) |
| **定时任务 (Cron)** | 调度定期的 Agent 任务 | [定时任务](/docs/user-guide/features/cron) |
| **委托/委派 (Delegation)** | 启动子 Agent 进行并行工作 | [委托/委派](/docs/user-guide/features/delegation) |
| **代码执行 (Code Execution)** | 在沙箱环境中运行代码 | [代码执行](/docs/user-guide/features/code-execution) |
| **浏览器 (Browser)** | 网页浏览和爬取 | [浏览器](/docs/user-guide/features/browser) |
| **钩子 (Hooks)** | 事件驱动的回调和中间件 | [钩子](/docs/user-guide/features/hooks) |
| **批量处理 (Batch Processing)** | 批量处理多个输入 | [批量处理](/docs/user-guide/features/batch-processing) |
| **RL 训练 (RL Training)** | 使用强化学习微调模型 | [RL 训练](/docs/user-guide/features/rl-training) |
| **提供商路由 (Provider Routing)** | 将请求路由到多个 LLM 提供商 | [提供商路由](/docs/user-guide/features/provider-routing) |

## 下一步阅读建议

根据您目前的学习进度：

- **刚完成安装？** → 前往[快速入门](/docs/getting-started/quickstart)运行您的第一次对话。
- **完成了快速入门？** → 阅读[CLI 使用](/docs/user-guide/cli)和[配置](/docs/user-guide/configuration)来定制您的环境。
- **对基础知识感到熟悉？** → 探索[工具](/docs/user-guide/features/tools)、[技能](/docs/user-guide/features/skills)和[内存](/docs/user-guide/features/memory)以释放 Agent 的全部潜力。
- **为团队设置？** → 阅读[安全](/docs/user-guide/security)和[会话](/docs/user-guide/sessions)以了解访问控制和对话管理。
- **准备构建了？** → 跳转到[开发者指南](/docs/developer-guide/architecture)了解内部机制并开始贡献代码。
- **想要实际示例？** → 查看[指南](/docs/guides/tips)部分，了解真实世界的项目和技巧。

:::tip
您不需要阅读所有内容。请选择与您的目标匹配的路径，按顺序遵循链接，您将很快变得高效。您随时可以返回本页面来找到下一步的指引。
:::