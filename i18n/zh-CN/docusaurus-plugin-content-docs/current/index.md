---
slug: /
sidebar_position: 0
title: "Hermes 智能体文档"
description: "由 Nous Research 构建的自我改进型 AI 智能体。内置学习循环，能够从经验中创建技能，在使用过程中改进技能，并在会话之间记住信息。"
hide_table_of_contents: true
displayed_sidebar: docs
---

# Hermes 智能体

由 [Nous Research](https://nousresearch.com) 构建的自我改进型 AI 智能体。唯一内置学习循环的智能体——它能够从经验中创建技能，在使用过程中改进技能，推动自身持续积累知识，并在多个会话中构建关于您的深入模型。

<div style={{display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap'}}>
  <a href="/docs/getting-started/installation" style={{display: 'inline-block', padding: '0.6rem 1.2rem', backgroundColor: '#FFD700', color: '#07070d', borderRadius: '8px', fontWeight: 600, textDecoration: 'none'}}>开始使用 →</a>
  <a href="https://github.com/NousResearch/hermes-agent" style={{display: 'inline-block', padding: '0.6rem 1.2rem', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '8px', textDecoration: 'none'}}>在 GitHub 上查看</a>
</div>

## 安装

**Linux / macOS / WSL2**

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

**Windows（原生，PowerShell）** — *早期测试版，[详情 →](/docs/user-guide/windows-native)*

```powershell
irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1 | iex
```

**Android（Termux）** — 与 Linux 相同的 curl 单行命令；安装程序会自动检测 Termux。

请参阅完整的 **[安装指南](/docs/getting-started/installation)**，了解安装程序的功能、每用户与 root 布局的区别，以及 Windows 特定的注意事项。

## Hermes 智能体是什么？

它不是绑定在 IDE 上的代码辅助工具，也不是围绕单个 API 的聊天机器人包装器。它是一个**自主智能体**，运行时间越长，能力越强。它存在于您放置的任何地方——5 美元的 VPS、GPU 集群，或闲置时几乎不花钱的无服务器基础设施（Daytona、Modal）。当它在您从未亲自 SSH 登录的云虚拟机上工作时，您可以通过 Telegram 与其对话。它不依赖于您的笔记本电脑。

## 快速链接

| | |
|---|---|
| 🚀 **[安装](/docs/getting-started/installation)** | 在 Linux、macOS、WSL2 或原生 Windows（早期测试版）上 60 秒完成安装 |
| 📖 **[快速入门教程](/docs/getting-started/quickstart)** | 您的首次对话以及要尝试的关键功能 |
| 🗺️ **[学习路径](/docs/getting-started/learning-path)** | 根据您的经验水平找到合适的文档 |
| ⚙️ **[配置](/docs/user-guide/configuration)** | 配置文件、提供商、模型和选项 |
| 💬 **[消息网关](/docs/user-guide/messaging)** | 设置 Telegram、Discord、Slack、WhatsApp、Teams 等 |
| 🔧 **[工具与工具集](/docs/user-guide/features/tools)** | 68 个内置工具及其配置方法 |
| 🧠 **[记忆系统](/docs/user-guide/features/memory)** | 跨会话增长的持久记忆 |
| 📚 **[技能系统](/docs/user-guide/features/skills)** | 智能体创建并重复使用的程序性记忆 |
| 🔌 **[MCP 集成](/docs/user-guide/features/mcp)** | 连接 MCP 服务器，过滤其工具，并安全地扩展 Hermes |
| 🧭 **[在 Hermes 中使用 MCP](/docs/guides/use-mcp-with-hermes)** | 实用的 MCP 设置模式、示例和教程 |
| 🎙️ **[语音模式](/docs/user-guide/features/voice-mode)** | 在 CLI、Telegram、Discord 和 Discord VC 中进行实时语音交互 |
| 🗣️ **[在 Hermes 中使用语音模式](/docs/guides/use-voice-mode-with-hermes)** | Hermes 语音工作流的手动设置和使用模式 |
| 🎭 **[人格与 SOUL.md](/docs/user-guide/features/personality)** | 使用全局 SOUL.md 定义 Hermes 的默认声音 |
| 📄 **[上下文文件](/docs/user-guide/features/context-files)** | 塑造每次对话的项目上下文文件 |
| 🔒 **[安全性](/docs/user-guide/security)** | 命令审批、授权、容器隔离 |
| 💡 **[提示与最佳实践](/docs/guides/tips)** | 快速提升 Hermes 使用效果的技巧 |
| 🏗️ **[架构](/docs/developer-guide/architecture)** | 其底层工作原理 |
| ❓ **[常见问题与故障排除](/docs/reference/faq)** | 常见问题及解决方案 |

## 关键特性

- **闭环学习** — 智能体策划的记忆，定期推动，自主技能创建，使用过程中的技能自我改进，FTS5 跨会话回忆结合 LLM 摘要，以及 [Honcho](https://github.com/plastic-labs/honcho) 辩证用户建模
- **随处运行，不限于您的笔记本电脑** — 6 种终端后端：本地、Docker、SSH、Daytona、Singularity、Modal。Daytona 和 Modal 提供无服务器持久性——您的环境在闲置时进入休眠状态，几乎不花钱
- **与您同在** — CLI、Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost、Email、SMS、钉钉、飞书、企业微信、BlueBubbles、Home Assistant、Microsoft Teams — 一个网关支持 15 多个平台
- **由模型训练者构建** — 由 [Nous Research](https://nousresearch.com) 创建，Hermes、Nomos 和 Psyche 背后的实验室。兼容 [Nous Portal](https://portal.nousresearch.com)、[OpenRouter](https://openrouter.ai)、OpenAI 或任何端点
- **计划自动化** — 内置 cron，可投递到任何平台
- **委派与并行化** — 为并行工作流生成隔离的子智能体。通过 `execute_code` 进行编程式工具调用，将多步流水线折叠为单次推理调用
- **开放标准技能** — 兼容 [agentskills.io](https://agentskills.io)。技能可移植、可共享，并通过技能中心由社区贡献
- **完整的网页控制** — 搜索、提取、浏览、视觉、图像生成、TTS
- **MCP 支持** — 连接任何 MCP 服务器以扩展工具能力
- **研究就绪** — 批处理、轨迹导出、使用 Atropos 进行 RL 训练。由 [Nous Research](https://nousresearch.com) 构建 — Hermes、Nomos 和 Psyche 模型背后的实验室

## 针对 LLM 和编码智能体

本文档的机器可读入口点：

- **[`/llms.txt`](/llms.txt)** — 每个文档页面的精选索引，带有简短描述。约 17 KB，可安全加载到 LLM 上下文中。
- **[`/llms-full.txt`](/llms-full.txt)** — 每个文档页面连接成单个 Markdown 文件，便于一次性摄取。约 1.8 MB。

这两个文件也可通过 `/docs/llms.txt` 和 `/docs/llms-full.txt` 访问。每次部署时都会重新生成。