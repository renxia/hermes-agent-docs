---
slug: /
sidebar_position: 0
title: "Hermes Agent 文档"
description: "由 Nous Research 构建的自改进 AI 代理。内置学习循环，从经验中创建技能，在使用过程中改进技能，并跨会话记忆。"
hide_table_of_contents: true
displayed_sidebar: docs
---

# Hermes Agent

由 [Nous Research](https://nousresearch.com) 构建的自改进 AI 代理。这是唯一拥有内置学习循环的代理——它从经验中创建技能，在使用过程中改进它们，促使自己持久化知识，并在跨会话中构建对您身份认知的深化模型。

<div style={{display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap'}}>
  <a href="/docs/getting-started/installation" style={{display: 'inline-block', padding: '0.6rem 1.2rem', backgroundColor: '#FFD700', color: '#07070d', borderRadius: '8px', fontWeight: 600, textDecoration: 'none'}}>开始使用 →</a>
  <a href="https://github.com/NousResearch/hermes-agent" style={{display: 'inline-block', padding: '0.6rem 1.2rem', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '8px', textDecoration: 'none'}}>在 GitHub 上查看</a>
</div>

## 什么是 Hermes Agent？

它不是绑定在 IDE 上的编程助手，也不是围绕单一 API 的聊天机器人包装器。它是一个**自主代理**，运行时间越长，能力越强。它存在于您放置它的任何地方——无论是 5 美元的 VPS、GPU 集群，还是闲置时几乎零成本的无服务器基础设施（Daytona, Modal）。您可以在 Telegram 上与它交谈，同时它在您从未 SSH 连接的云 VM 上工作。它并不绑定于您的笔记本电脑。

## 快速链接

| | |
|---|---|
| 🚀 **[安装](/docs/getting-started/installation)** | 在 Linux、macOS 或 WSL2 上 60 秒内安装 |
| 📖 **[快速入门教程](/docs/getting-started/quickstart)** | 您的第一次对话和可尝试的关键功能 |
| 🗺️ **[学习路径](/docs/getting-started/learning-path)** | 根据您的经验水平找到合适的文档 |
| ⚙️ **[配置](/docs/user-guide/configuration)** | 配置文件、提供商、模型和选项 |
| 💬 **[消息网关](/docs/user-guide/messaging)** | 设置 Telegram、Discord、Slack 或 WhatsApp |
| 🔧 **[工具与工具集](/docs/user-guide/features/tools)** | 47 个内置工具及其配置方法 |
| 🧠 **[记忆系统](/docs/user-guide/features/memory)** | 跨会话增长的持久化记忆 |
| 📚 **[技能系统](/docs/user-guide/features/skills)** | 代理创建和复用的过程记忆 |
| 🔌 **[MCP 集成](/docs/user-guide/features/mcp)** | 连接 MCP 服务器，过滤其工具，并安全地扩展 Hermes |
| 🧭 **[使用 MCP 与 Hermes](/docs/guides/use-mcp-with-hermes)** | 实用的 MCP 设置模式、示例和教程 |
| 🎙️ **[语音模式](/docs/user-guide/features/voice-mode)** | 在 CLI、Telegram、Discord 和 Discord VC 中的实时语音交互 |
| 🗣️ **[使用语音模式与 Hermes](/docs/guides/use-voice-mode-with-hermes)** | Hermes 语音工作流的手动设置和使用模式 |
| 🎭 **[人格与 SOUL.md](/docs/user-guide/features/personality)** | 通过全局 SOUL.md 定义 Hermes 的默认声音 |
| 📄 **[上下文文件](/docs/user-guide/features/context-files)** | 塑造每次对话的项目上下文文件 |
| 🔒 **[安全](/docs/user-guide/security)** | 命令批准、授权、容器隔离 |
| 💡 **[技巧与最佳实践](/docs/guides/tips)** | 快速上手以充分利用 Hermes 的技巧 |
| 🏗️ **[架构](/docs/developer-guide/architecture)** | 底层工作原理 |
| ❓ **[常见问题与故障排除](/docs/reference/faq)** | 常见问题和解决方案 |

## 主要功能

- **一个封闭的学习循环** — 代理策划的记忆，定期提示，自主技能创建，使用过程中的技能自我改进，FTS5 跨会话回忆结合 LLM 摘要，以及 [Honcho](https://github.com/plastic-labs/honcho) 辩证用户建模
- **随处运行，不仅限于您的笔记本电脑** — 6 个终端后端：本地、Docker、SSH、Daytona、Singularity、Modal。Daytona 和 Modal 提供无服务器持久化——您的环境在闲置时休眠，成本几乎为零
- **与您同在** — CLI、Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost、邮件、短信、钉钉、飞书、企业微信、BlueBubbles、Home Assistant——通过一个网关连接 15+ 个平台
- **由模型训练师构建** — 由 [Nous Research](https://nousresearch.com) 创建，Hermes、Nomos 和 Psyche 背后的实验室。与 [Nous Portal](https://portal.nousresearch.com)、[OpenRouter](https://openrouter.ai)、OpenAI 或任何端点配合使用
- **定时自动化** — 内置 cron，可交付到任何平台
- **委派与并行化** — 生成隔离的子代理以进行并行工作流。通过 `execute_code` 的程序化工具调用将多步骤管道合并为单次推理调用
- **开放标准技能** — 兼容 [agentskills.io](https://agentskills.io)。技能可移植、可共享，并通过技能中心由社区贡献
- **完整的 Web 控制** — 搜索、提取、浏览、视觉、图像生成、TTS
- **MCP 支持** — 连接到任何 MCP 服务器以扩展工具能力
- **研究就绪** — 批量处理、轨迹导出、使用 Atropos 进行 RL 训练。由 [Nous Research](https://nousresearch.com) 构建——Hermes、Nomos 和 Psyche 模型背后的实验室