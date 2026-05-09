---
sidebar_position: 3
title: '学习路径'
description: '根据您的经验水平和目标，选择通过 Hermes 智能体文档的学习路径。'
---

# 学习路径

Hermes 智能体可以做很多事情——CLI 助手、Telegram/Discord 机器人、任务自动化、强化学习训练等等。本页面帮助您根据您的经验水平和想要实现的目标，确定从哪里开始以及阅读哪些内容。

:::tip 从这里开始
如果您还没有安装 Hermes 智能体，请先阅读[安装指南](/docs/getting-started/installation)，然后完成[快速入门](/docs/getting-started/quickstart)。以下内容均假设您已完成安装并能正常运行。
:::

## 如何使用本页面

- **清楚自己的水平？** 跳转到[经验水平表格](#by-experience-level)，并按照您所在层级的阅读顺序进行学习。
- **有特定目标？** 跳到[按使用场景](#by-use-case)，找到匹配的场景。
- **只是随便看看？** 查看[核心功能一览](#key-features-at-a-glance)表格，快速了解 Hermes 智能体的全部功能。

## 按经验水平

| 水平 | 目标 | 推荐阅读 | 时间预估 |
|---|---|---|---|
| **初学者** | 快速上手，进行基本对话，使用内置工具 | [安装](/docs/getting-started/installation) → [快速入门](/docs/getting-started/quickstart) → [CLI 使用](/docs/user-guide/cli) → [配置](/docs/user-guide/configuration) | 约 1 小时 |
| **中级** | 搭建消息机器人，使用高级功能如记忆、定时任务和技能 | [会话](/docs/user-guide/sessions) → [消息传递](/docs/user-guide/messaging) → [工具](/docs/user-guide/features/tools) → [技能](/docs/user-guide/features/skills) → [记忆](/docs/user-guide/features/memory) → [定时任务](/docs/user-guide/features/cron) | 约 2–3 小时 |
| **高级** | 构建自定义工具，创建技能，使用强化学习训练模型，为项目贡献代码 | [架构](/docs/developer-guide/architecture) → [添加工具](/docs/developer-guide/adding-tools) → [创建技能](/docs/developer-guide/creating-skills) → [强化学习训练](/docs/user-guide/features/rl-training) → [贡献指南](/docs/developer-guide/contributing) | 约 4–6 小时 |

## 按使用场景

选择与您想要实现的目标相匹配的场景。每个场景都会按照建议的阅读顺序链接到相关文档。

### “我想要一个 CLI 编码助手”

将 Hermes 智能体用作交互式终端助手，用于编写、审查和运行代码。

1. [安装](/docs/getting-started/installation)
2. [快速入门](/docs/getting-started/quickstart)
3. [CLI 使用](/docs/user-guide/cli)
4. [代码执行](/docs/user-guide/features/code-execution)
5. [上下文文件](/docs/user-guide/features/context-files)
6. [技巧与窍门](/docs/guides/tips)

:::tip
通过上下文文件直接将文件传入对话中。Hermes 智能体可以读取、编辑并运行您项目中的代码。
:::

### “我想要一个 Telegram/Discord 机器人”

将 Hermes 智能体部署到您喜欢的消息平台上作为机器人。

1. [安装](/docs/getting-started/installation)
2. [配置](/docs/user-guide/configuration)
3. [消息传递概览](/docs/user-guide/messaging)
4. [Telegram 设置](/docs/user-guide/messaging/telegram)
5. [Discord 设置](/docs/user-guide/messaging/discord)
6. [语音模式](/docs/user-guide/features/voice-mode)
7. [与 Hermes 一起使用语音模式](/docs/guides/use-voice-mode-with-hermes)
8. [安全](/docs/user-guide/security)

完整项目示例，请参阅：
- [每日简报机器人](/docs/guides/daily-briefing-bot)
- [团队 Telegram 助手](/docs/guides/team-telegram-assistant)

### “我想要自动化任务”

安排重复性任务、运行批处理作业，或将多个智能体操作串联起来。

1. [快速入门](/docs/getting-started/quickstart)
2. [定时任务调度](/docs/user-guide/features/cron)
3. [批处理](/docs/user-guide/features/batch-processing)
4. [委派](/docs/user-guide/features/delegation)
5. [钩子](/docs/user-guide/features/hooks)

:::tip
定时任务允许 Hermes 智能体按计划运行任务——每日摘要、定期检查、自动报告——无需您在场。
:::

### “我想要构建自定义工具/技能”

通过您自己的工具和可复用的技能包扩展 Hermes 智能体。

1. [插件](/docs/user-guide/features/plugins)
2. [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)
3. [工具概览](/docs/user-guide/features/tools)
4. [技能概览](/docs/user-guide/features/skills)
5. [MCP（模型上下文协议）](/docs/user-guide/features/mcp)
6. [架构](/docs/developer-guide/architecture)
7. [添加工具](/docs/developer-guide/adding-tools)
8. [创建技能](/docs/developer-guide/creating-skills)

:::tip
对于大多数自定义工具创建，请从插件开始。[添加工具](/docs/developer-guide/adding-tools)页面是针对 Hermes 核心内置功能的开发，而非普通用户/自定义工具的常规路径。
:::

### “我想要训练模型”

使用强化学习，通过 Hermes 智能体内置的强化学习训练管道微调模型行为。

1. [快速入门](/docs/getting-started/quickstart)
2. [配置](/docs/user-guide/configuration)
3. [强化学习训练](/docs/user-guide/features/rl-training)
4. [提供商路由](/docs/user-guide/features/provider-routing)
5. [架构](/docs/developer-guide/architecture)

:::tip
当您已经了解 Hermes 智能体如何处理对话和工具调用时，强化学习训练效果最佳。如果您是新手，请先完成初学者路径。
:::

### “我想要将其作为 Python 库使用”

以编程方式将 Hermes 智能体集成到您自己的 Python 应用程序中。

1. [安装](/docs/getting-started/installation)
2. [快速入门](/docs/getting-started/quickstart)
3. [Python 库指南](/docs/guides/python-library)
4. [架构](/docs/developer-guide/architecture)
5. [工具](/docs/user-guide/features/tools)
6. [会话](/docs/user-guide/sessions)

## 核心功能一览

不确定有哪些功能可用？以下是主要功能的快速目录：

| 功能 | 功能说明 | 链接 |
|---|---|---|
| **工具** | 智能体可调用的内置工具（文件 I/O、搜索、Shell 等） | [工具](/docs/user-guide/features/tools) |
| **技能** | 可安装插件包，用于添加新功能 | [技能](/docs/user-guide/features/skills) |
| **记忆** | 跨会话持久化记忆 | [记忆](/docs/user-guide/features/memory) |
| **上下文文件** | 将文件和目录引入对话中 | [上下文文件](/docs/user-guide/features/context-files) |
| **MCP** | 通过模型上下文协议连接外部工具服务器 | [MCP](/docs/user-guide/features/mcp) |
| **定时任务** | 安排重复性智能体任务 | [定时任务](/docs/user-guide/features/cron) |
| **委派** | 创建子智能体以并行工作 | [委派](/docs/user-guide/features/delegation) |
| **代码执行** | 以编程方式运行调用 Hermes 工具的 Python 脚本 | [代码执行](/docs/user-guide/features/code-execution) |
| **浏览器** | 网页浏览和抓取 | [浏览器](/docs/user-guide/features/browser) |
| **钩子** | 事件驱动回调和中间件 | [钩子](/docs/user-guide/features/hooks) |
| **批处理** | 批量处理多个输入 | [批处理](/docs/user-guide/features/batch-processing) |
| **强化学习训练** | 使用强化学习微调模型 | [强化学习训练](/docs/user-guide/features/rl-training) |
| **提供商路由** | 在多个 LLM 提供商之间路由请求 | [提供商路由](/docs/user-guide/features/provider-routing) |

## 接下来阅读什么

根据您当前的情况：

- **刚刚完成安装？** → 前往[快速入门](/docs/getting-started/quickstart)进行首次对话。
- **已完成快速入门？** → 阅读[CLI 使用](/docs/user-guide/cli)和[配置](/docs/user-guide/configuration)以自定义您的设置。
- **对基础操作已熟悉？** → 探索[工具](/docs/user-guide/features/tools)、[技能](/docs/user-guide/features/skills)和[记忆](/docs/user-guide/features/memory)，释放智能体的全部潜力。
- **正在为团队搭建？** → 阅读[安全](/docs/user-guide/security)和[会话](/docs/user-guide/sessions)，了解访问控制和对话管理。
- **准备开始开发？** → 跳转到[开发者指南](/docs/developer-guide/architecture)，了解内部原理并开始贡献代码。
- **想要实际示例？** → 查看[指南](/docs/guides/tips)部分，获取真实项目案例和技巧。

:::tip
您无需阅读所有内容。选择与您的目标匹配的路径，按顺序跟随链接，即可快速上手。您随时可以返回此页面，找到下一步该做什么。
:::