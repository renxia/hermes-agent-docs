---
sidebar_position: 3
title: '学习路径'
description: '根据您的经验水平和目标，选择适合您的 Hermes 智能体文档学习路径。'
---

# 学习路径

Hermes 智能体功能丰富——CLI 助手、Telegram/Discord 机器人、任务自动化、RL 训练等。本页帮助您根据自己的经验水平和目标，确定从哪里开始以及阅读哪些内容。

:::tip 从这里开始
如果您尚未安装 Hermes 智能体，请先查阅[安装指南](/getting-started/installation)，然后运行[快速入门](/getting-started/quickstart)。以下内容均假定您已完成安装。
:::

:::tip 首次设置提供商
首次使用者几乎都需要运行 `hermes setup --portal` —— 一次 OAuth 即可覆盖一个模型加上四个工具网关工具（搜索/图像/TTS/浏览器）。详见 [Nous Portal](/integrations/nous-portal)。
:::

## 如何使用本页

- **知道自己的水平？** 跳转到[经验水平表格](#by-experience-level)，并按照您所在层级的阅读顺序操作。
- **有特定目标？** 跳到[按用例查找](#by-use-case)，找到匹配的场景。
- **只是随便看看？** 查看[核心功能一览](#key-features-at-a-glance)表，快速了解 Hermes 智能体的所有功能。

## 按经验水平

| 级别 | 目标 | 推荐阅读 | 预计时间 |
|---|---|---|---|
| **初学者** | 能够上手运行，进行基础对话，使用内置工具 | [安装](/getting-started/installation) → [快速入门](/getting-started/quickstart) → [CLI 使用](/user-guide/cli) → [配置](/user-guide/configuration) | ~1 小时 |
| **中级** | 设置消息机器人，使用高级功能如记忆、定时任务和技能 | [会话](/user-guide/sessions) → [消息集成](/user-guide/messaging) → [工具](/user-guide/features/tools) → [技能](/user-guide/features/skills) → [记忆](/user-guide/features/memory) → [定时任务](/user-guide/features/cron) | ~2–3 小时 |
| **高级** | 构建自定义工具、创建技能、用 RL 训练模型、为项目做贡献 | [架构](/developer-guide/architecture) → [添加工具](/developer-guide/adding-tools) → [创建技能](/developer-guide/creating-skills) → [贡献指南](/developer-guide/contributing) | ~4–6 小时 |

## 按用例查找

选择与您目标匹配的场景。每个场景都按阅读顺序链接到相关文档。

### “我想要一个 CLI 编码助手”

将 Hermes 智能体用作交互式终端助手，用于编写、审查和运行代码。

1. [安装](/getting-started/installation)
2. [快速入门](/getting-started/quickstart)
3. [CLI 使用](/user-guide/cli)
4. [代码执行](/user-guide/features/code-execution)
5. [上下文文件](/user-guide/features/context-files)
6. [提示与技巧](/guides/tips)

:::tip
通过上下文文件将文件直接传入对话。Hermes 智能体可以读取、编辑并运行您项目中的代码。
:::

### “我想要一个 Telegram/Discord 机器人”

将 Hermes 智能体部署为您喜欢的消息平台上的机器人。

1. [安装](/getting-started/installation)
2. [配置](/user-guide/configuration)
3. [消息集成概述](/user-guide/messaging)
4. [Telegram 设置](/user-guide/messaging/telegram)
5. [Discord 设置](/user-guide/messaging/discord)
6. [语音模式](/user-guide/features/voice-mode)
7. [将语音模式与 Hermes 结合使用](/guides/use-voice-mode-with-hermes)
8. [安全](/user-guide/security)

完整项目示例请见：
- [每日简报机器人](/guides/daily-briefing-bot)
- [团队 Telegram 助手](/guides/team-telegram-assistant)

### “我想要自动化任务”

安排定期任务、运行批处理作业或将智能体操作串联起来。

1. [快速入门](/getting-started/quickstart)
2. [定时任务](/user-guide/features/cron)
3. [批处理](/user-guide/features/batch-processing)
4. [委托](/user-guide/features/delegation)
5. [钩子](/user-guide/features/hooks)

:::tip
定时任务允许 Hermes 智能体按计划运行任务——每日摘要、定期检查、自动化报告——无需您在场。
:::

### “我想要构建自定义工具/技能”

用您自己的工具和可复用的技能包来扩展 Hermes 智能体。

1. [插件](/user-guide/features/plugins)
2. [构建一个 Hermes 插件](/guides/build-a-hermes-plugin)
3. [工具概述](/user-guide/features/tools)
4. [技能概述](/user-guide/features/skills)
5. [MCP (模型上下文协议)](/user-guide/features/mcp)
6. [架构](/developer-guide/architecture)
7. [添加工具](/developer-guide/adding-tools)
8. [创建技能](/developer-guide/creating-skills)

:::tip
对于大多数自定义工具创建，请从插件开始。[添加工具](/developer-guide/adding-tools)页面是针对内置 Hermes 核心开发的，并非通常的用户/自定义工具路径。
:::

### “我想要训练模型”

使用强化学习，通过 Hermes 智能体的 RL 训练流水线（由 [Atropos](https://github.com/NousResearch/atropos) 提供支持）来微调模型行为。

1. [快速入门](/getting-started/quickstart)
2. [配置](/user-guide/configuration)
3. [Atropos RL 环境](https://github.com/NousResearch/atropos) (外部链接)
4. [提供商路由](/user-guide/features/provider-routing)
5. [架构](/developer-guide/architecture)

:::tip
当您已理解 Hermes 智能体处理对话和工具调用的基本原理后，RL 训练效果最佳。如果您是新手，请先完成初学者路径。
:::

### “我想要将它用作 Python 库”

以编程方式将 Hermes 智能体集成到您自己的 Python 应用程序中。

1. [安装](/getting-started/installation)
2. [快速入门](/getting-started/quickstart)
3. [Python 库指南](/guides/python-library)
4. [架构](/developer-guide/architecture)
5. [工具](/user-guide/features/tools)
6. [会话](/user-guide/sessions)

## 核心功能一览

不确定有哪些功能？以下是主要功能的快速目录：

| 功能 | 作用 | 链接 |
|---|---|---|
| **工具** | 智能体可调用的内置工具（文件 I/O、搜索、Shell 等） | [工具](/user-guide/features/tools) |
| **技能** | 可安装的插件包，用于添加新功能 | [技能](/user-guide/features/skills) |
| **记忆** | 跨会话的持久记忆 | [记忆](/user-guide/features/memory) |
| **上下文文件** | 将文件和目录导入对话 | [上下文文件](/user-guide/features/context-files) |
| **MCP** | 通过模型上下文协议连接外部工具服务器 | [MCP](/user-guide/features/mcp) |
| **定时任务** | 安排定期智能体任务 | [定时任务](/user-guide/features/cron) |
| **委托** | 生成子智能体以进行并行工作 | [委托](/user-guide/features/delegation) |
| **代码执行** | 运行可编程调用 Hermes 工具的 Python 脚本 | [代码执行](/user-guide/features/code-execution) |
| **浏览器** | 网页浏览和抓取 | [浏览器](/user-guide/features/browser) |
| **钩子** | 事件驱动的回调和中间件 | [钩子](/user-guide/features/hooks) |
| **批处理** | 批量处理多个输入 | [批处理](/user-guide/features/batch-processing) |
| **提供商路由** | 在多个 LLM 提供商之间路由请求 | [提供商路由](/user-guide/features/provider-routing) |

## 接下来读什么

根据您当前的位置：

- **刚刚安装完？** → 前往[快速入门](/getting-started/quickstart)运行您的第一次对话。
- **完成了快速入门？** → 阅读 [CLI 使用](/user-guide/cli)和[配置](/user-guide/configuration)来定制您的设置。
- **熟悉基础操作？** → 探索[工具](/user-guide/features/tools)、[技能](/user-guide/features/skills)和[记忆](/user-guide/features/memory)以释放智能体的全部潜力。
- **为团队设置？** → 阅读[安全](/user-guide/security)和[会话](/user-guide/sessions)以了解访问控制和对话管理。
- **准备好开发？** → 跳入[开发者指南](/developer-guide/architecture)了解内部原理并开始贡献。
- **想要实际示例？** → 查看[指南](/guides/tips)部分了解真实项目和技巧。

:::tip
您无需阅读所有内容。选择与您目标匹配的路径，按顺序跟随链接，您将很快变得高效。您可以随时返回本页查找下一步。
:::