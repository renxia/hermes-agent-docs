---
title: "集成"
sidebar_label: "概览"
sidebar_position: 0
---

# 集成

Hermes 智能体连接到外部系统，用于 AI 推理、工具服务器、IDE 工作流、编程访问等。这些集成扩展了 Hermes 的功能和运行场景。

## AI 提供商与路由

Hermes 开箱即支持多个 AI 推理提供商。使用 `hermes model` 进行交互式配置，或在 `config.yaml` 中设置。

- **[AI 提供商](/docs/user-guide/features/provider-routing)** — OpenRouter、Anthropic、OpenAI、Google 以及任何兼容 OpenAI 的端点。Hermes 会自动检测每个提供商的视觉、流式传输和工具使用等功能。
- **[提供商路由](/docs/user-guide/features/provider-routing)** — 精细控制哪些底层提供商处理您的 OpenRouter 请求。通过排序、白名单、黑名单和显式优先级排序，针对成本、速度或质量进行优化。
- **[备用提供商](/docs/user-guide/features/fallback-providers)** — 当您的主模型遇到错误时，自动故障转移到备用 LLM 提供商。包括主模型回退和针对视觉、压缩和网页提取的独立辅助任务回退。

## 工具服务器（MCP）

- **[MCP 服务器](/docs/user-guide/features/mcp)** — 通过模型上下文协议将 Hermes 连接到外部工具服务器。无需编写原生 Hermes 工具，即可访问来自 GitHub、数据库、文件系统、浏览器堆栈、内部 API 等的工具。支持 stdio 和 SSE 传输、按服务器过滤工具以及感知能力的资源/提示注册。

## 网页搜索后端

`web_search` 和 `web_extract` 工具支持四种后端提供商，通过 `config.yaml` 或 `hermes tools` 配置：

| 后端 | 环境变量 | 搜索 | 提取 | 爬取 |
|---------|---------|--------|---------|-------|
| **Firecrawl**（默认） | `FIRECRAWL_API_KEY` | ✔ | ✔ | ✔ |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ | — |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ | ✔ |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ | — |

快速设置示例：

```yaml
web:
  backend: firecrawl    # firecrawl | parallel | tavily | exa
```

如果未设置 `web.backend`，则后端会根据可用的 API 密钥自动检测。也支持通过 `FIRECRAWL_API_URL` 自托管 Firecrawl。

## 浏览器自动化

Hermes 包含完整的浏览器自动化功能，提供多种后端选项用于导航网站、填写表单和提取信息：

- **Browserbase** — 托管云浏览器，具备反机器人工具、验证码解决和住宅代理
- **Browser Use** — 替代云浏览器提供商
- **本地 Chrome（通过 CDP）** — 使用 `/browser connect` 连接到您正在运行的 Chrome 实例
- **本地 Chromium** — 通过 `agent-browser` CLI 运行的无头本地浏览器

请参阅 [浏览器自动化](/docs/user-guide/features/browser) 以了解设置和使用方法。

## 语音与 TTS 提供商

所有消息平台均支持文本转语音和语音转文本：

| 提供商 | 质量 | 成本 | API 密钥 |
||----------|---------|------|---------|
|| **Edge TTS**（默认） | 良好 | 免费 | 无需 |
|| **ElevenLabs** | 优秀 | 付费 | `ELEVENLABS_API_KEY` |
|| **OpenAI TTS** | 良好 | 付费 | `VOICE_TOOLS_OPENAI_KEY` |
|| **MiniMax** | 良好 | 付费 | `MINIMAX_API_KEY` |
|| **NeuTTS** | 良好 | 免费 | 无需 |

语音转文本支持六种提供商：本地 faster-whisper（免费，设备端运行）、本地命令包装器、Groq、OpenAI Whisper API、Mistral 和 xAI。语音消息转录功能适用于 Telegram、Discord、WhatsApp 和其他消息平台。详情请参阅 [语音与 TTS](/docs/user-guide/features/tts) 和 [语音模式](/docs/user-guide/features/voice-mode)。

## IDE 与编辑器集成

- **[IDE 集成（ACP）](/docs/user-guide/features/acp)** — 在兼容 ACP 的编辑器（如 VS Code、Zed 和 JetBrains）中使用 Hermes 智能体。Hermes 作为 ACP 服务器运行，在编辑器内渲染聊天消息、工具活动、文件差异和终端命令。

## 编程访问

- **[API 服务器](/docs/user-guide/features/api-server)** — 将 Hermes 暴露为兼容 OpenAI 的 HTTP 端点。任何支持 OpenAI 格式的前端（如 Open WebUI、LobeChat、LibreChat、NextChat、ChatBox）均可连接并使用 Hermes 作为后端，享受其完整的工具集。

## 记忆与个性化

- **[内置记忆](/docs/user-guide/features/memory)** — 通过 `MEMORY.md` 和 `USER.md` 文件实现持久化、精选的记忆。智能体维护有界存储的个人笔记和用户配置文件数据，这些数据在会话之间保持不变。
- **[记忆提供商](/docs/user-guide/features/memory-providers)** — 接入外部记忆后端以实现更深层次的个性化。支持八种提供商：Honcho（辩证推理）、OpenViking（分层检索）、Mem0（云端提取）、Hindsight（知识图谱）、Holographic（本地 SQLite）、RetainDB（混合搜索）、ByteRover（基于 CLI）和 Supermemory。

## 消息平台

Hermes 作为网关机器人在 19+ 个消息平台上运行，全部通过相同的 `gateway` 子系统配置：

- **[Telegram](/docs/user-guide/messaging/telegram)**、**[Discord](/docs/user-guide/messaging/discord)**、**[Slack](/docs/user-guide/messaging/slack)**、**[WhatsApp](/docs/user-guide/messaging/whatsapp)**、**[Signal](/docs/user-guide/messaging/signal)**、**[Matrix](/docs/user-guide/messaging/matrix)**、**[Mattermost](/docs/user-guide/messaging/mattermost)**、**[Email](/docs/user-guide/messaging/email)**、**[SMS](/docs/user-guide/messaging/sms)**、**[DingTalk](/docs/user-guide/messaging/dingtalk)**、**[Feishu/Lark](/docs/user-guide/messaging/feishu)**、**[WeCom](/docs/user-guide/messaging/wecom)**、**[WeCom Callback](/docs/user-guide/messaging/wecom-callback)**、**[Weixin](/docs/user-guide/messaging/weixin)**、**[BlueBubbles](/docs/user-guide/messaging/bluebubbles)**、**[QQ Bot](/docs/user-guide/messaging/qqbot)**、**[Yuanbao](/docs/user-guide/messaging/yuanbao)**、**[Home Assistant](/docs/user-guide/messaging/homeassistant)**、**[Microsoft Teams](/docs/user-guide/messaging/teams)**、**[Webhooks](/docs/user-guide/messaging/webhooks)**

请参阅 [消息网关概览](/docs/user-guide/messaging) 以查看平台对比表和设置指南。

## 家庭自动化

- **[Home Assistant](/docs/user-guide/messaging/homeassistant)** — 通过四个专用工具（`ha_list_entities`、`ha_get_state`、`ha_list_services`、`ha_call_service`）控制智能家居设备。当配置了 `HASS_TOKEN` 时，Home Assistant 工具集会自动激活。

## 插件

- **[插件系统](/docs/user-guide/features/plugins)** — 无需修改核心代码，即可通过自定义工具、生命周期钩子和 CLI 命令扩展 Hermes。插件可从 `~/.hermes/plugins/`、项目本地的 `.hermes/plugins/` 以及 pip 安装入口点发现。
- **[构建插件](/docs/guides/build-a-hermes-plugin)** — 包含工具、钩子和 CLI 命令的 Hermes 插件创建分步指南。

## 训练与评估

- **[强化学习训练](/docs/user-guide/features/rl-training)** — 从智能体会话生成轨迹数据，用于强化学习和模型微调。支持 Atropos 环境及可自定义的奖励函数。
- **[批处理](/docs/user-guide/features/batch-processing)** — 并行运行智能体处理数百个提示，生成结构化的 ShareGPT 格式轨迹数据，用于训练数据生成或评估。