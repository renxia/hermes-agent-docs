---
slug: /
sidebar_position: 0
title: "Hermes 智能体文档"
description: "由 Nous Research 构建的自我改进型 AI 智能体。内建一个学习循环，可从经验中创建技能，在使用过程中改进技能，并跨会话记忆。"
hide_table_of_contents: true
displayed_sidebar: docs
---

# Hermes 智能体

由 [Nous Research](https://nousresearch.com) 构建的自我改进型 AI 智能体。这是唯一内建学习循环的智能体——它能从经验中创建技能，在使用过程中改进技能，主动推动自身保存知识，并在跨会话的过程中构建对您日益深入的理解模型。

<div style={{display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap'}}>
  <a href="/docs/getting-started/installation" style={{display: 'inline-block', padding: '0.6rem 1.2rem', backgroundColor: '#FFD700', color: '#07070d', borderRadius: '8px', fontWeight: 600, textDecoration: 'none'}}>开始使用 →</a>
  <a href="https://github.com/NousResearch/hermes-agent" style={{display: 'inline-block', padding: '0.6rem 1.2rem', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '8px', textDecoration: 'none'}}>在 GitHub 上查看</a>
</div>

## 安装

**Linux / macOS / WSL2**

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

**Windows (原生，PowerShell)** — *早期测试版，[详情 →](/docs/user-guide/windows-native)*

```powershell
irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1 | iex
```

**Android (Termux)** — 使用与 Linux 相同的 curl 命令；安装程序会自动检测 Termux。

请查阅完整的 **[安装指南](/docs/getting-started/installation)**，了解安装程序的具体功能、每用户与 root 的安装布局，以及 Windows 特定说明。

## 什么是 Hermes 智能体？

它不是绑定在 IDE 上的代码助手，也不是围绕单个 API 的聊天机器人外壳。它是一个**自主智能体**，运行时间越长，能力就越强。它可以在你放置的任何地方运行——一台 5 美元的 VPS、一个 GPU 集群，或闲置时成本几乎为零的无服务器基础设施（如 Daytona, Modal）。你可以通过 Telegram 与它对话，而它却工作在一台你从未 SSH 登录过的云端虚拟机上。它不依赖于你的笔记本电脑。

## 快速链接

| | |
|---|---|
| 🚀 **[安装](/docs/getting-started/installation)** | 在 Linux, macOS, WSL2 或原生 Windows (早期测试版) 上 60 秒完成安装 |
| 📖 **[快速入门教程](/docs/getting-started/quickstart)** | 你的第一次对话和关键功能体验 |
| 🗺️ **[学习路径](/docs/getting-started/learning-path)** | 根据你的经验水平找到合适的文档 |
| ⚙️ **[配置](/docs/user-guide/configuration)** | 配置文件、服务商、模型和选项 |
| 💬 **[消息网关](/docs/user-guide/messaging)** | 设置 Telegram, Discord, Slack, WhatsApp, Teams 或更多平台 |
| 🔧 **[工具与工具集](/docs/user-guide/features/tools)** | 70+ 内建工具及其配置方法 |
| 🧠 **[记忆系统](/docs/user-guide/features/memory)** | 跨会话持续增长的持久记忆 |
| 📚 **[技能系统](/docs/user-guide/features/skills)** | 智能体创建并可重用的程序性记忆 |
| 🔌 **[MCP 集成](/docs/user-guide/features/mcp)** | 连接 MCP 服务器，过滤其工具，并安全地扩展 Hermes |
| 🧭 **[在 Hermes 中使用 MCP](/docs/guides/use-mcp-with-hermes)** | 实用的 MCP 设置模式、示例和教程 |
| 🎙️ **[语音模式](/docs/user-guide/features/voice-mode)** | 在 CLI, Telegram, Discord 和 Discord 语音频道中进行实时语音交互 |
| 🗣️ **[在 Hermes 中使用语音模式](/docs/guides/use-voice-mode-with-hermes)** | Hermes 语音工作流的实践设置和使用模式 |
| 🎭 **[个性与 SOUL.md](/docs/user-guide/features/personality)** | 使用全局 SOUL.md 定义 Hermes 的默认声音 |
| 📄 **[上下文文件](/docs/user-guide/features/context-files)** | 塑造每次对话的项目上下文文件 |
| 🔒 **[安全](/docs/user-guide/security)** | 命令批准、授权、容器隔离 |
| 💡 **[提示与最佳实践](/docs/guides/tips)** | 快速获得最大收益的技巧 |
| 🏗️ **[架构](/docs/developer-guide/architecture)** | 底层工作原理 |
| ❓ **[常见问题与故障排除](/docs/reference/faq)** | 常见问题及解决方案 |

## 核心特性

- **闭环学习循环** —— 由智能体策划的记忆与定期推动机制，自主创建技能，技能在使用中自我改进，使用 LLM 摘要进行 FTS5 跨会话召回，以及 [Honcho](https://github.com/plastic-labs/honcho) 辩证式用户建模
- **随处运行，不限于你的笔记本电脑** —— 6 种终端后端：本地、Docker、SSH、Daytona、Singularity、Modal。Daytona 和 Modal 提供无服务器持久化——你的环境在闲置时休眠，成本几乎为零
- **与你同在** —— CLI, Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Mattermost, Email, SMS, 钉钉，飞书，企业微信，微信，QQ 机器人，元宝，BlueBubbles, Home Assistant, Microsoft Teams, Google Chat 等——一个网关接入 20+ 平台
- **由模型训练者构建** —— 由 [Nous Research](https://nousresearch.com) 创建，Hermes, Nomos 和 Psyche 模型背后的实验室。可与 [Nous Portal](https://portal.nousresearch.com), [OpenRouter](https://openrouter.ai), OpenAI 或任何端点配合使用
- **定时自动化** —— 内建 cron，可将任务结果推送到任何平台
- **委派与并行** —— 生成隔离的子智能体进行并行工作流。通过 `execute_code` 进行程序化工具调用，将多步骤流水线折叠为单次推理调用
- **开放标准技能** —— 兼容 [agentskills.io](https://agentskills.io)。技能可移植、可共享，并通过技能中心进行社区贡献
- **全面的网页控制** —— 搜索、提取、浏览、视觉、图像生成、文本转语音
- **MCP 支持** —— 连接任何 MCP 服务器以扩展工具能力
- **研究就绪** —— 批量处理、轨迹导出、使用 Atropos 进行强化学习训练。由 [Nous Research](https://nousresearch.com) 构建——Hermes, Nomos 和 Psyche 模型背后的实验室

## 面向 LLM 和编码智能体

本文档的机器可读入口点：

- **[`/llms.txt`](/llms.txt)** —— 每个文档页面的精选索引，附带简短描述。约 17 KB，可安全加载到 LLM 上下文中。
- **[`/llms-full.txt`](/llms-full.txt)** —— 将每个文档页面连接成单个 markdown 文件，用于一次性摄取。约 1.8 MB。

这两个文件也可在 `/docs/llms.txt` 和 `/docs/llms-full.txt` 访问。每次部署时都会重新生成。