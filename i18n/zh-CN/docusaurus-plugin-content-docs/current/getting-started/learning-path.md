---
sidebar_position: 3
title: '学习路径'
description: '根据您的经验水平和目标，选择在Hermes智能体文档中的学习路径。'
---

# 学习路径

Hermes智能体功能丰富——CLI助手、Telegram/Discord机器人、任务自动化、强化学习训练等等。本页旨在帮助您根据经验水平和目标，确定从何处开始以及阅读哪些内容。

:::tip 从这里开始
如果您尚未安装Hermes智能体，请先阅读[安装指南](/getting-started/installation)，然后完成[快速入门](/getting-started/quickstart)。以下内容均假设您已完成安装并可运行。
:::

## 如何使用本页

- **清楚自己的水平？** 跳转到[按经验水平划分](#by-experience-level)的表格，按您所在层级的推荐顺序阅读。
- **有特定目标？** 跳转到[按使用场景划分](#by-use-case)，找到匹配的场景。
- **只是随便看看？** 查看[关键功能概览](#key-features-at-a-glance)表格，快速了解Hermes智能体的所有能力。

## 按经验水平划分

| 水平 | 目标 | 推荐阅读 | 预计时间 |
|---|---|---|---|
| **新手** | 快速上手运行，进行基本对话，使用内置工具 | [安装](/getting-started/installation) → [快速入门](/getting-started/quickstart) → [CLI用法](/user-guide/cli) → [配置](/user-guide/configuration) | ~1小时 |
| **进阶** | 设置消息机器人，使用高级功能如记忆、定时任务和技能 | [会话](/user-guide/sessions) → [消息](/user-guide/messaging) → [工具](/user-guide/features/tools) → [技能](/user-guide/features/skills) → [记忆](/user-guide/features/memory) → [定时任务](/user-guide/features/cron) | ~2-3小时 |
| **高级** | 构建自定义工具，创建技能，使用强化学习训练模型，为项目做贡献 | [架构](/developer-guide/architecture) → [添加工具](/developer-guide/adding-tools) → [创建技能](/developer-guide/creating-skills) → [强化学习训练](/user-guide/features/rl-training) → [贡献指南](/developer-guide/contributing) | ~4-6小时 |

## 按使用场景划分

选择匹配您目标的场景。每个场景都按推荐阅读顺序链接到相关文档。

### "我想要一个CLI编码助手"

将Hermes智能体用作交互式终端助手，用于编写、审查和运行代码。

1. [安装](/getting-started/installation)
2. [快速入门](/getting-started/quickstart)
3. [CLI用法](/user-guide/cli)
4. [代码执行](/user-guide/features/code-execution)
5. [上下文文件](/user-guide/features/context-files)
6. [技巧与窍门](/guides/tips)

:::tip
通过上下文文件直接将文件传递到对话中。Hermes智能体可以读取、编辑并运行您项目中的代码。
:::

### "我想要一个Telegram/Discord机器人"

在您喜爱的消息平台上部署Hermes智能体作为机器人。

1. [安装](/getting-started/installation)
2. [配置](/user-guide/configuration)
3. [消息概述](/user-guide/messaging)
4. [Telegram设置](/user-guide/messaging/telegram)
5. [Discord设置](/user-guide/messaging/discord)
6. [语音模式](/user-guide/features/voice-mode)
7. [将语音模式与Hermes结合使用](/guides/use-voice-mode-with-hermes)
8. [安全](/user-guide/security)

完整的项目示例请参见：
- [每日简报机器人](/guides/daily-briefing-bot)
- [团队Telegram助手](/guides/team-telegram-assistant)

### "我想要自动化任务"

安排定期任务，运行批量作业，或将多个智能体操作链接在一起。

1. [快速入门](/getting-started/quickstart)
2. [定时任务调度](/user-guide/features/cron)
3. [批处理](/user-guide/features/batch-processing)
4. [委派](/user-guide/features/delegation)
5. [钩子](/user-guide/features/hooks)

:::tip
定时任务允许Hermes智能体按计划运行任务——每日总结、定期检查、自动生成报告——无需您在场。
:::

### "我想要构建自定义工具/技能"

使用您自己的工具和可复用的技能包扩展Hermes智能体。

1. [插件](/user-guide/features/plugins)
2. [构建Hermes插件](/guides/build-a-hermes-plugin)
3. [工具概述](/user-guide/features/tools)
4. [技能概述](/user-guide/features/skills)
5. [MCP (模型上下文协议)](/user-guide/features/mcp)
6. [架构](/developer-guide/architecture)
7. [添加工具](/developer-guide/adding-tools)
8. [创建技能](/developer-guide/creating-skills)

:::tip
对于大多数自定义工具创建，从插件开始。[添加工具](/developer-guide/adding-tools)页面是针对Hermes内置核心开发，而非常规的用户/自定义工具路径。
:::

### "我想要训练模型"

使用强化学习，通过Hermes智能体内置的RL训练流程微调模型行为。

1. [快速入门](/getting-started/quickstart)
2. [配置](/user-guide/configuration)
3. [强化学习训练](/user-guide/features/rl-training)
4. [提供商路由](/user-guide/features/provider-routing)
5. [架构](/developer-guide/architecture)

:::tip
强化学习训练在您已了解Hermes智能体处理对话和工具调用的基本原理时效果最佳。如果您是新手，请先完成新手路径。
:::

### "我想要将其用作Python库"

以编程方式将Hermes智能体集成到您自己的Python应用程序中。

1. [安装](/getting-started/installation)
2. [快速入门](/getting-started/quickstart)
3. [Python库指南](/guides/python-library)
4. [架构](/developer-guide/architecture)
5. [工具](/user-guide/features/tools)
6. [会话](/user-guide/sessions)

## 关键功能概览

不确定有哪些可用功能？这里是主要功能的快速指南：

| 功能 | 作用 | 链接 |
|---|---|---|
| **工具** | 智能体可调用的内置工具（文件I/O、搜索、Shell等） | [工具](/user-guide/features/tools) |
| **技能** | 可安装的插件包，增加新功能 | [技能](/user-guide/features/skills) |
| **记忆** | 跨会话的持久化记忆 | [记忆](/user-guide/features/memory) |
| **上下文文件** | 将文件和目录导入对话 | [上下文文件](/user-guide/features/context-files) |
| **MCP** | 通过模型上下文协议连接到外部工具服务器 | [MCP](/user-guide/features/mcp) |
| **定时任务** | 安排定期执行的智能体任务 | [定时任务](/user-guide/features/cron) |
| **委派** | 生成子智能体进行并行工作 | [委派](/user-guide/features/delegation) |
| **代码执行** | 运行可编程调用Hermes工具的Python脚本 | [代码执行](/user-guide/features/code-execution) |
| **浏览器** | 网页浏览和抓取 | [浏览器](/user-guide/features/browser) |
| **钩子** | 事件驱动的回调和中间件 | [钩子](/user-guide/features/hooks) |
| **批处理** | 批量处理多个输入 | [批处理](/user-guide/features/batch-processing) |
| **强化学习训练** | 使用强化学习微调模型 | [强化学习训练](/user-guide/features/rl-training) |
| **提供商路由** | 跨多个大语言模型提供商路由请求 | [提供商路由](/user-guide/features/provider-routing) |

## 接下来阅读什么

根据您目前的位置：

- **刚刚完成安装？** → 前往[快速入门](/getting-started/quickstart)进行您的第一次对话。
- **完成了快速入门？** → 阅读[CLI用法](/user-guide/cli)和[配置](/user-guide/configuration)以自定义您的设置。
- **熟悉基础内容？** → 探索[工具](/user-guide/features/tools)、[技能](/user-guide/features/skills)和[记忆](/user-guide/features/memory)，释放智能体的全部潜力。
- **为团队设置？** → 阅读[安全](/user-guide/security)和[会话](/user-guide/sessions)，了解访问控制和会话管理。
- **准备好构建？** → 跳入[开发者指南](/developer-guide/architecture)，了解内部原理并开始贡献。
- **需要实际示例？** → 查看[指南](/guides/tips)部分，获取真实项目和技巧。

:::tip
您不需要阅读所有内容。选择匹配您目标的学习路径，按顺序跟随链接，您很快就能上手。您可以随时返回此页面查找下一步。
:::