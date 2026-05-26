---
title: "集成"
sidebar_label: "概览"
sidebar_position: 0
---

# 集成

Hermes 智能体连接到外部系统以进行 AI 推理、工具服务器、IDE 工作流、编程访问等。这些集成扩展了 Hermes 的能力及其运行场景。

## AI 供应商与路由

Hermes 开箱即用地支持多种 AI 推理供应商。使用 `hermes model` 进行交互式配置，或在 `config.yaml` 中进行设置。

- **[AI 供应商](/user-guide/features/provider-routing)** — OpenRouter、Anthropic、OpenAI、Google 以及任何兼容 OpenAI 的端点。Hermes 会自动检测每个供应商的能力，如视觉、流式传输和工具使用。
- **[供应商路由](/user-guide/features/provider-routing)** — 细粒度控制哪些底层供应商处理您的 OpenRouter 请求。通过排序、白名单、黑名单和明确的优先级排序，针对成本、速度或质量进行优化。
- **[后备供应商](/user-guide/features/fallback-providers)** — 当您的主要模型遇到错误时，自动故障转移到备用 LLM 供应商。包括主模型回退以及用于视觉、压缩和网页提取的独立辅助任务回退。

## 工具服务器 (MCP)

- **[MCP 服务器](/user-guide/features/mcp)** — 通过模型上下文协议将 Hermes 连接到外部工具服务器。访问来自 GitHub、数据库、文件系统、浏览器堆栈、内部 API 等的工具，无需编写原生 Hermes 工具。支持 stdio 和 SSE 传输，每个服务器的工具过滤，以及能力感知的资源/提示注册。

## 网页搜索后端

`web_search` 和 `web_extract` 工具支持四种后端供应商，通过 `config.yaml` 或 `hermes tools` 配置：

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

如果未设置 `web.backend`，后端将从可用的 API 密钥自动检测。自托管的 Firecrawl 也通过 `FIRECRAWL_API_URL` 支持。

## 浏览器自动化

Hermes 包含完整的浏览器自动化功能，具有多个后端选项，可用于导航网站、填写表单和提取信息：

- **Browserbase** — 托管云浏览器，配备反机器人工具、验证码解决和住宅代理。
- **Browser Use** — 替代的云浏览器供应商。
- **本地 Chromium 系列 CDP** — 使用 `/browser connect` 连接到您正在运行的 Chrome、Brave、Chromium 或 Edge 浏览器。
- **本地 Chromium** — 通过 `agent-browser` CLI 运行的无头本地浏览器。

详情请参见 [浏览器自动化](/user-guide/features/browser)。

## 语音与 TTS 供应商

跨所有消息平台的文本转语音和语音转文本功能：

| 供应商 | 质量 | 成本 | API 密钥 |
|----------|---------|------|---------|
| **Edge TTS**（默认） | 良好 | 免费 | 无需 |
| **ElevenLabs** | 优秀 | 付费 | `ELEVENLABS_API_KEY` |
| **OpenAI TTS** | 良好 | 付费 | `VOICE_TOOLS_OPENAI_KEY` |
| **MiniMax** | 良好 | 付费 | `MINIMAX_API_KEY` |
| **NeuTTS** | 良好 | 免费 | 无需 |

语音转文本支持六种供应商：本地 faster-whisper（免费，在设备上运行）、本地命令包装器、Groq、OpenAI Whisper API、Mistral 和 xAI。语音消息转录适用于 Telegram、Discord、WhatsApp 和其他消息平台。详情请参见 [语音与 TTS](/user-guide/features/tts) 和 [语音模式](/user-guide/features/voice-mode)。

## IDE 与编辑器集成

- **[IDE 集成 (ACP)](/user-guide/features/acp)** — 在 ACP 兼容的编辑器（如 VS Code、Zed 和 JetBrains）内使用 Hermes 智能体。Hermes 作为 ACP 服务器运行，在您的编辑器内渲染聊天消息、工具活动、文件差异和终端命令。

## 编程访问

- **[API 服务器](/user-guide/features/api-server)** — 将 Hermes 暴露为一个兼容 OpenAI 的 HTTP 端点。任何支持 OpenAI 格式的前端——Open WebUI、LobeChat、LibreChat、NextChat、ChatBox——都可以连接并使用 Hermes 作为具有完整工具集的后端。

## 记忆与个性化

- **[内置记忆](/user-guide/features/memory)** — 通过 `MEMORY.md` 和 `USER.md` 文件实现持久化、精心策划的记忆。智能体维护跨会话保留的、有限的个人笔记和用户配置数据存储。
- **[记忆供应商](/user-guide/features/memory-providers)** — 接入外部记忆后端以实现更深入的个性化。支持八种供应商：Honcho（辩证推理）、OpenViking（分层检索）、Mem0（云端提取）、Hindsight（知识图谱）、Holographic（本地 SQLite）、RetainDB（混合搜索）、ByteRover（基于 CLI）和 Supermemory。

## 消息平台

Hermes 作为网关机器人运行于 19 多个消息平台，全部通过相同的 `gateway` 子系统配置：

- **[Telegram](/user-guide/messaging/telegram)**, **[Discord](/user-guide/messaging/discord)**, **[Slack](/user-guide/messaging/slack)**, **[WhatsApp](/user-guide/messaging/whatsapp)**, **[Signal](/user-guide/messaging/signal)**, **[Matrix](/user-guide/messaging/matrix)**, **[Mattermost](/user-guide/messaging/mattermost)**, **[Email](/user-guide/messaging/email)**, **[短信](/user-guide/messaging/sms)**, **[钉钉](/user-guide/messaging/dingtalk)**, **[飞书](/user-guide/messaging/feishu)**, **[企业微信](/user-guide/messaging/wecom)**, **[企业微信回调](/user-guide/messaging/wecom-callback)**, **[微信](/user-guide/messaging/weixin)**, **[BlueBubbles](/user-guide/messaging/bluebubbles)**, **[QQ 机器人](/user-guide/messaging/qqbot)**, **[元宝](/user-guide/messaging/yuanbao)**, **[Home Assistant](/user-guide/messaging/homeassistant)**, **[Microsoft Teams](/user-guide/messaging/teams)**, **[Webhooks](/user-guide/messaging/webhooks)**

详情请参见 [消息网关概览](/user-guide/messaging) 中的平台对比表和设置指南。

## 家庭自动化

- **[Home Assistant](/user-guide/messaging/homeassistant)** — 通过四个专用工具（`ha_list_entities`、`ha_get_state`、`ha_list_services`、`ha_call_service`）控制智能家居设备。当配置了 `HASS_TOKEN` 时，Home Assistant 工具集会自动激活。

## 插件

- **[插件系统](/user-guide/features/plugins)** — 无需修改核心代码，即可使用自定义工具、生命周期钩子和 CLI 命令扩展 Hermes。插件从 `~/.hermes/plugins/`、项目本地的 `.hermes/plugins/` 和 pip 安装的入口点中发现。
- **[构建插件](/guides/build-a-hermes-plugin)** — 关于如何创建包含工具、钩子和 CLI 命令的 Hermes 插件的分步指南。

## 训练与评估

- **[批处理](/user-guide/features/batch-processing)** — 跨数百个提示并行运行智能体，生成结构化的 ShareGPT 格式轨迹数据，用于训练数据生成或评估。