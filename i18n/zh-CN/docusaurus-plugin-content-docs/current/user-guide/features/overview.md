---
title: "功能概览"
sidebar_label: "概览"
sidebar_position: 1
---

# 功能概览

Hermes 智能体包含一系列丰富的功能，远不止基础的聊天。从持久记忆和文件感知上下文，到浏览器自动化和语音对话，这些功能协同工作，使 Hermes 成为一个强大的自主助手。

:::tip 不知道从哪里开始？
`hermes setup --portal` 命令可以一次性配置模型提供商，并集成所有四个工具网关工具（网页搜索、图片生成、文字转语音、浏览器）。详见 [Nous Portal](/integrations/nous-portal)。
:::

## 核心功能

- **[工具与工具集](tools.md)** — 工具是扩展智能体能力的函数。它们被组织成逻辑工具集，可以针对每个平台启用或禁用，涵盖网页搜索、终端执行、文件编辑、记忆、任务委派等。
- **[技能系统](skills.md)** — 智能体可在需要时加载的按需知识文档。技能遵循渐进式披露模式以最小化令牌使用量，并兼容 [agentskills.io](https://agentskills.io/specification) 开放标准。
- **[持久记忆](memory.md)** — 跨会话持久保存的有界限、精选的记忆。Hermes 通过 `MEMORY.md` 和 `USER.md` 记住你的偏好、项目、环境以及它学到的东西。
- **[上下文文件](context-files.md)** — Hermes 自动发现并加载项目上下文文件（`.hermes.md`、`AGENTS.md`、`CLAUDE.md`、`SOUL.md`、`.cursorrules`），这些文件决定了它在你的项目中如何运作。
- **[上下文引用](context-references.md)** — 输入 `@` 后跟一个引用，可以将文件、文件夹、git 差异和 URL 直接注入你的消息中。Hermes 会内联展开引用并自动附加内容。
- **[检查点](../checkpoints-and-rollback.md)** — Hermes 在对文件进行更改前会自动快照你的工作目录，如果出现问题，可以使用 `/rollback` 回滚，为你提供安全网。

## 自动化

- **[定时任务（Cron）](cron.md)** — 使用自然语言或 cron 表达式安排任务自动运行。作业可以附加技能、将结果发送到任何平台，并支持暂停/恢复/编辑操作。
- **[子智能体委派](delegation.md)** — `delegate_task` 工具可以生成具有隔离上下文、受限工具集和独立终端会话的子智能体实例。默认可运行 3 个并发子智能体（可配置），用于并行工作流。
- **[代码执行](code-execution.md)** — `execute_code` 工具允许智能体编写 Python 脚本，通过编程方式调用 Hermes 工具，通过沙盒 RPC 执行将多步工作流压缩为单次 LLM 转换。
- **[事件钩子](hooks.md)** — 在关键生命周期点运行自定义代码。网关钩子处理日志记录、警报和 webhook；插件钩子处理工具拦截、指标和防护栏。
- **[批处理](batch-processing.md)** — 并行运行 Hermes 智能体处理成百上千个提示，生成结构化的 ShareGPT 格式轨迹数据，用于训练数据生成或评估。

## 媒体与网络

- **[语音模式](voice-mode.md)** — 在 CLI 和消息平台上的全面语音交互。使用麦克风与智能体交谈，听取语音回复，并在 Discord 语音频道中进行实时语音对话。
- **[浏览器自动化](browser.md)** — 多后端的全面浏览器自动化：Browserbase 云、Browser Use 云、通过 CDP 的本地 Chrome/Brave/Chromium/Edge，或本地 Chromium。浏览网站、填写表单并提取信息。
- **[视觉与图片粘贴](vision.md)** — 多模态视觉支持。将剪贴板中的图片粘贴到 CLI，并让智能体使用任何具备视觉能力的模型进行分析、描述或处理。
- **[图片生成](image-generation.md)** — 使用 FAL.ai 从文本提示生成图片。支持九个模型（FLUX 2 Klein/Pro、GPT-Image 1.5/2、Nano Banana Pro、Ideogram V3、Recraft V4 Pro、Qwen、Z-Image Turbo）；通过 `hermes tools` 选择。
- **[语音与文字转语音](tts.md)** — 跨所有消息平台的文字转语音输出和语音消息转录，提供十个原生提供商选项：Edge TTS（免费）、ElevenLabs、OpenAI TTS、MiniMax、Mistral Voxtral、Google Gemini、xAI、NeuTTS、KittenTTS 和 Piper — 还可为任何本地 TTS CLI 添加自定义命令提供商。

## 集成

- **[MCP 集成](mcp.md)** — 通过 stdio 或 HTTP 传输连接到任何 MCP 服务器。无需编写原生 Hermes 工具即可访问来自 GitHub、数据库、文件系统和内部 API 的外部工具。包含按服务器的工具过滤和采样支持。
- **[提供商路由](provider-routing.md)** — 精细控制由哪个 AI 提供商处理你的请求。通过排序、白名单、黑名单和优先级排序优化成本、速度或质量。
- **[备用提供商](fallback-providers.md)** — 当主模型遇到错误时，自动故障转移到备用 LLM 提供商，包括为视觉和压缩等辅助任务提供独立的备用方案。
- **[凭证池](credential-pools.md)** — 在同一提供商的多个密钥之间分配 API 调用。在达到速率限制或失败时自动轮换。
- **[提示缓存](../configuration#prompt-caching)** — 内置跨会话一小时前缀缓存，适用于原生 Anthropic、OpenRouter 和 Nous Portal 上的 Claude。始终启用；无需配置。
- **[记忆提供商](memory-providers.md)** — 接入外部记忆后端（Honcho、OpenViking、Mem0、Hindsight、Holographic、RetainDB、ByteRover、Supermemory），用于超越内置记忆系统的跨会话用户建模和个性化。
- **[API 服务器](api-server.md)** — 将 Hermes 暴露为兼容 OpenAI 的 HTTP 端点。连接任何支持 OpenAI 格式的前端——Open WebUI、LobeChat、LibreChat 等。
- **[IDE 集成（ACP）](acp.md)** — 在 ACP 兼容的编辑器（如 VS Code、Zed 和 JetBrains）中使用 Hermes。聊天、工具活动、文件差异和终端命令在你的编辑器内渲染。
- **[批处理](batch-processing.md)** — 从 CLI 并行运行智能体处理多个提示或任务，生成结构化输出和轨迹捕获，适用于评估或下游训练管道。

## 自定义

- **[个性与 SOUL.md](personality.md)** — 完全可定制的智能体个性。`SOUL.md` 是主要的身份文件——系统提示的第一项内容——你可以在每个会话中更换内置或自定义的 `/personality` 预设。
- **[皮肤与主题](skins.md)** — 自定义 CLI 的视觉呈现：横幅颜色、旋转器表情和动词、响应框标签、品牌文字以及工具活动前缀。
- **[插件](plugins.md)** — 无需修改核心代码即可添加自定义工具、钩子和集成。三种插件类型：通用插件（工具/钩子）、记忆提供商（跨会话知识）和上下文引擎（替代上下文管理）。通过统一的 `hermes plugins` 交互式 UI 进行管理。