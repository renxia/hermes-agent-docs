---
title: "AI 提供商"
sidebar_label: "AI 提供商"
sidebar_position: 1
---

# AI 提供商

本页面涵盖了为 Hermes 智能体设置推理提供商的方法，包括来自 OpenRouter 和 Anthropic 等云 API、Ollama 和 vLLM 等自托管端点，以及高级路由和回退配置。要使用 Hermes，您至少需要配置一个提供商。

## 推理提供商

您至少需要一种方式来连接到 LLM。使用 `hermes model` 来交互式地切换提供商和模型，或者直接配置：

| 提供商 | 设置 |
|----------|-------|
| **Nous Portal** | `hermes model` (OAuth，基于订阅) |
| **OpenAI Codex** | `hermes model` (ChatGPT OAuth，使用 Codex 模型) |
| **GitHub Copilot** | `hermes model` (OAuth 设备码流程, `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, 或 `gh auth token`) |
| **GitHub Copilot ACP** | `hermes model` (启动本地 `copilot --acp --stdio`) |
| **Anthropic** | `hermes model` (Claude Max + 通过 OAuth 获得的额外使用额度；也支持 Anthropic API key 或手动设置-token — 请参阅下方的说明) |
| **OpenRouter** | 在 `~/.hermes/.env` 中设置 `OPENROUTER_API_KEY` |
| **NovitaAI** | 在 `~/.hermes/.env` 中设置 `NOVITA_API_KEY` (提供商: `novita`, 200+ 模型, Model API, Agent Sandbox, GPU Cloud) |
| **z.ai / GLM** | 在 `~/.hermes/.env` 中设置 `GLM_API_KEY` (提供商: `zai`) |
| **Kimi / Moonshot** | 在 `~/.hermes/.env` 中设置 `KIMI_API_KEY` (提供商: `kimi-coding`) |
| **Kimi / Moonshot (China)** | 在 `~/.hermes/.env` 中设置 `KIMI_CN_API_KEY` (提供商: `kimi-coding-cn`; 别名: `kimi-cn`, `moonshot-cn`) |
| **Arcee AI** | 在 `~/.hermes/.env` 中设置 `ARCEEAI_API_KEY` (提供商: `arcee`; 别名: `arcee-ai`, `arceeai`) |
| **GMI Cloud** | 在 `~/.hermes/.env` 中设置 `GMI_API_KEY` (提供商: `gmi`; 别名: `gmi-cloud`, `gmicloud`) |
| **MiniMax** | 在 `~/.hermes/.env` 中设置 `MINIMAX_API_KEY` (提供商: `minimax`) |
| **MiniMax China** | 在 `~/.hermes/.env` 中设置 `MINIMAX_CN_API_KEY` (提供商: `minimax-cn`) |
| **xAI (Grok) — Responses API** | 在 `~/.hermes/.env` 中设置 `XAI_API_KEY` (提供商: `xai`) |
| **xAI Grok OAuth (SuperGrok)** | `hermes model` → "xAI Grok OAuth (SuperGrok / Premium+)" — 浏览器登录，无需 API key。请参阅 [指南](../guides/xai-grok-oauth.md) |
| **Qwen Cloud (Alibaba DashScope)** | 在 `~/.hermes/.env` 中设置 `DASHSCOPE_API_KEY` (提供商: `alibaba`) |
| **Alibaba Cloud (Coding Plan)** | `DASHSCOPE_API_KEY` (提供商: `alibaba-coding-plan`, 别名: `alibaba_coding`) — 独立的计费 SKU，不同的端点 |
| **Kilo Code** | 在 `~/.hermes/.env` 中设置 `KILOCODE_API_KEY` (提供商: `kilocode`) |
| **Xiaomi MiMo** | 在 `~/.hermes/.env` 中设置 `XIAOMI_API_KEY` (提供商: `xiaomi`, 别名: `mimo`, `xiaomi-mimo`) |
| **Tencent TokenHub** | 在 `~/.hermes/.env` 中设置 `TOKENHUB_API_KEY` (提供商: `tencent-tokenhub`, 别名: `tencent`, `tokenhub`, `tencentmaas`) |
| **OpenCode Zen** | 在 `~/.hermes/.env` 中设置 `OPENCODE_ZEN_API_KEY` (提供商: `opencode-zen`) |
| **OpenCode Go** | 在 `~/.hermes/.env` 中设置 `OPENCODE_GO_API_KEY` (提供商: `opencode-go`) |
| **DeepSeek** | 在 `~/.hermes/.env` 中设置 `DEEPSEEK_API_KEY` (提供商: `deepseek`) |
| **Hugging Face** | 在 `~/.hermes/.env` 中设置 `HF_TOKEN` (提供商: `huggingface`, 别名: `hf`) |
| **Google / Gemini** | 在 `~/.hermes/.env` 中设置 `GOOGLE_API_KEY` (或 `GEMINI_API_KEY`) (提供商: `gemini`) |
| **OpenAI API (direct)** | 在 `~/.hermes/.env` 中设置 `OPENAI_API_KEY` (提供商: `openai-api`, 可选的 `OPENAI_BASE_URL`) |
| **Azure AI Foundry** | `hermes model` → "Azure AI Foundry" (提供商: `azure-foundry`; 使用 Azure OpenAI / Foundry 端点和密钥) |
| **AWS Bedrock** | `hermes model` → "AWS Bedrock" (提供商: `bedrock`; 通过 boto3 标准 AWS 凭证链) |
| **NVIDIA Build** | 在 `~/.hermes/.env` 中设置 `NVIDIA_API_KEY` (提供商: `nvidia`; NIM-hosted models on build.nvidia.com) |
| **Ollama Cloud** | `hermes model` → "Ollama Cloud" (提供商: `ollama-cloud`; 云托管的 Ollama API) |
| **Qwen OAuth** | `hermes model` → "Qwen OAuth" (提供商: `qwen-oauth`; 浏览器 PKCE 登录) |
| **MiniMax OAuth** | `hermes model` → "MiniMax (OAuth)" (提供商: `minimax-oauth`; 浏览器 PKCE 登录) |
| **StepFun** | 在 `~/.hermes/.env` 中设置 `STEPFUN_API_KEY` (提供商: `stepfun`) |
| **LM Studio** | `hermes model` → "LM Studio" (提供商: `lmstudio`, 可选的 `LM_API_KEY`) |
| **Custom Endpoint** | `hermes model` → 选择 "Custom endpoint" (保存在 `config.yaml` 中) |

有关官方 API-key 路径，请参阅专门的 [Google Gemini 指南](/guides/google-gemini)。

:::tip 模型密钥别名
在 `model:` 配置部分中，您可以使用 `default:` 或 `model:` 作为模型 ID 的键名。`model: { default: my-model }` 和 `model: { model: my-model }` 功能完全相同。
:::


### Nous Portal

[Nous Portal](https://portal.nousresearch.com) 是 Nous Research 的统一订阅网关，**运行 Hermes 智能体推荐的方式**。一次 OAuth 登录即可涵盖 300+ 前沿的智能体模型（Claude, GPT, Gemini, DeepSeek, Qwen, Kimi, GLM, MiniMax, Grok, ...）以及 [工具网关](/user-guide/features/tool-gateway) (网络搜索、图像生成、TTS、浏览器自动化) 以及 [Nous Chat](https://chat.nousresearch.com) — 而不是针对每个提供商单独计费。

```bash
hermes setup --portal     # 新安装 — 一键完成 OAuth + 提供商 + 网关
hermes model              # 已安装 — 从列表中选择 "Nous Portal"
hermes portal info        # 随时检查登录和路由情况
```

还没有订阅？请在 [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription) 获取。

**完整详情：** 请参阅专门的 [Nous Portal 集成页面](/integrations/nous-portal) (订阅内容、模型目录、故障排除) 和分步指南 [使用 Nous Portal 运行 Hermes 智能体指南](/guides/run-hermes-with-nous-portal)。

**客户端识别。** 从 Hermes Agent 发出的每个 Portal 请求都带有 `client=hermes-client-v<version>` 标签（例如 `client=hermes-client-v0.13.0`），该标签会自动与您安装的版本对齐。它会发送到所有 Portal 路径——主聊天循环、辅助调用、压缩摘要器、网页提取 — 使 Portal 端的遥测数据能够区分 Hermes 流量和其他客户端。无需配置；当您运行 `hermes update` 时，此标签会自动更新。

**JWT 认证 (自动)。** Hermes 优先使用带有 `inference:invoke` 作用域的 JWTs 来处理 Portal 请求，并将遗留的不透明会话密钥路径作为后备方案。无需任何配置——凭证由 OAuth 流程管理并透明地轮换。撤销的刷新令牌会被隔离，以避免重放循环。


:::info Codex 注意事项
OpenAI Codex 提供商通过设备码进行身份验证（打开一个 URL，输入一个代码）。Hermes 将结果凭证存储在其自己的认证存储 `~/.hermes/auth.json` 中，并且可以在存在时从 `~/.codex/auth.json` 导入现有的 Codex CLI 凭证。无需安装 Codex CLI。

如果令牌刷新失败并出现终端错误（HTTP 4xx, `invalid_grant`, 已撤销的授权等），Hermes 会将刷新令牌标记为无效，从而停止重放它，这样您就不会看到一连串相同的身份验证失败。下一个请求会显示一个指定的重新认证消息。运行 `hermes auth add codex-oauth` (或 `hermes model` → OpenAI Codex) 以开始新的设备码登录；在下次成功的交换后，隔离状态就会清除。
:::

:::warning
即使在使用 Nous Portal、Codex 或自定义端点时，某些工具（视觉、网页摘要、MoA）也会使用单独的“辅助”模型。默认情况下 (`auxiliary.*.provider: "auto"`)，Hermes 会将这些任务路由到您的**主聊天模型**——即您在 `hermes model` 中选择的同一个模型。您可以单独覆盖每个任务，将其路由到一个更便宜/更快的模型（例如 OpenRouter 上的 Gemini Flash）— 请参阅 [辅助模型](/user-guide/configuration#auxiliary-models)。
:::

:::tip Nous 工具网关
付费的 Nous Portal 订阅者还可以使用 **[工具网关](/user-guide/features/tool-gateway)** — 包括网络搜索、图像生成、TTS 和浏览器自动化，这些功能都通过您的订阅进行路由。无需额外的 API 密钥。在新安装中，`hermes setup --portal` 会登录您，将 Nous 设置为提供商，并在一个命令中开启网关。现有用户可以从 `hermes model` 或从 `hermes tools` 中针对每个工具启用它。使用 `hermes portal info` 随时检查路由情况。
:::

### 模型管理的两条命令

Hermes 有**两条**模型命令，它们服务于不同的目的：

| 命令 | 在哪里运行 | 它做什么 |
|---------|-------------|--------------|
| **`hermes model`** | 您的终端（不在任何会话内） | 全面的设置向导 — 添加提供商、运行 OAuth、输入 API 密钥、配置端点 |
| **`/model`** | 在 Hermes 聊天会话中 | 在**已配置好**的提供商和模型之间快速切换 |

如果您尝试切换到一个尚未设置好的提供商（例如，您只配置了 OpenRouter 但想使用 Anthropic），则需要 `hermes model`，而不是 `/model`。请先退出您的会话（`Ctrl+C` 或 `/quit`），运行 `hermes model`，完成提供商的设置，然后开始一个新的会话。


### Anthropic (原生)

通过 Anthropic API 直接使用 Claude 模型——无需 OpenRouter 代理。支持三种身份验证方法：

:::caution 需要 Claude Max "额外使用"额度
当您通过 `hermes model` → Anthropic OAuth（或通过 `hermes auth add anthropic --type oauth`）进行身份验证时，Hermes 会作为 Claude Code 对您的 Anthropic 账户进行路由。**只有在您拥有 Claude Max 计划并购买了额外使用额度的情况下才有效。** 基本的 Max 计划配额（Claude Code 默认包含的使用量）不会被 Hermes 消耗——只有您额外添加的/超额的额度会被消耗。Claude Pro 订阅者不能使用此路径。

如果您没有 Max + 额外额度，请改用 `ANTHROPIC_API_KEY` — 请求将根据该密钥的组织进行按令牌计费（标准 API 定价，独立于任何 Claude 订阅）。
:::

```bash
# 使用 API key (按令牌付费)
export ANTHROPIC_API_KEY=***
hermes chat --provider anthropic --model claude-sonnet-4-6

# 首选：通过 `hermes model` 进行身份验证
# 如果可用，Hermes 将直接使用 Claude Code 的凭证存储
hermes model

# 使用设置令牌的手动覆盖 (后备/遗留)
export ANTHROPIC_TOKEN=***  # setup-token 或手动 OAuth token
hermes chat --provider anthropic

# 自动检测 Claude Code 凭证 (如果您已经使用 Claude Code)
hermes chat --provider anthropic  # 自动读取 Claude Code 凭证文件
```

当您通过 `hermes model` 选择 Anthropic OAuth 时，Hermes 优先使用 Claude Code 自己的凭证存储，而不是将令牌复制到 `~/.hermes/.env` 中。这确保了可刷新性。

或者永久设置：
```yaml
model:
  provider: "anthropic"
  default: "claude-sonnet-4-6"
```

:::tip 别名
`--provider claude` 和 `--provider claude-code` 也可以作为 `--provider anthropic` 的简写。
:::

### GitHub Copilot

Hermes 支持 GitHub Copilot 作为一流的提供商，有两种模式：

**`copilot` — 直接 Copilot API** (推荐)。使用您的 GitHub Copilot 订阅来通过 Copilot API 访问 GPT-5.x、Claude、Gemini 和其他模型。

```bash
hermes chat --provider copilot --model gpt-5.4
```

**身份验证选项** (按此顺序检查)：

1. `COPILOT_GITHUB_TOKEN` 环境变量
2. `GH_TOKEN` 环境变量
3. `GITHUB_TOKEN` 环境变量
4. `gh auth token` CLI 后备

如果未找到任何令牌，`hermes model` 会提供**OAuth 设备码登录**——与 Copilot CLI 和 opencode 使用的流程相同。

:::warning 令牌类型
Copilot API **不支持**经典的个人访问令牌（`ghp_*`）。支持的令牌类型：

| 类型 | 前缀 | 如何获取 |
|------|--------|------------|
| OAuth token | `gho_` | `hermes model` → GitHub Copilot → 使用 GitHub 登录 |
| Fine-grained PAT | `github_pat_` | GitHub 设置 → 开发者设置 → 精细粒度令牌 (需要 **Copilot Requests** 权限) |
| GitHub App token | `ghu_` | 通过 GitHub App 安装 |

如果您的 `gh auth token` 返回一个 `ghp_*` 令牌，请使用 `hermes model` 通过 OAuth 进行身份验证。
:::

:::info Hermes 中的 Copilot 认证行为
Hermes 会将支持的 GitHub 令牌（`gho_*`, `github_pat_*`, 或 `ghu_*`）直接发送到 `api.githubcopilot.com`，并包含 Copilot 特定的头部信息（`Editor-Version`, `Copilot-Integration-Id`, `Openai-Intent`, `x-initiator`）。

当收到 HTTP 401 时，Hermes 会在回退之前执行一次性凭证恢复：

1. 通过正常的优先级链重新解析令牌 (`COPILOT_GITHUB_TOKEN` → `GH_TOKEN` → `GITHUB_TOKEN` → `gh auth token`)
2. 使用刷新后的头部信息重建共享的 OpenAI 客户端
3. 重试请求一次

一些较旧的社区代理使用 `api.github.com/copilot_internal/v2/token` 交换流程。该端点可能对某些账户类型不可用（返回 404）。因此，Hermes 将直接令牌认证作为主要路径，并依赖运行时凭证刷新 + 重试以确保稳健性。
:::

**API 路由：** GPT-5+ 模型（除了 `gpt-5-mini`）会自动使用 Responses API。所有其他模型（GPT-4o, Claude, Gemini 等）都使用 Chat Completions。模型是从实时 Copilot 目录中自动检测到的。

**`copilot-acp` — Copilot ACP 智能体后端**。将本地 Copilot CLI 作为子进程启动：

```bash
hermes chat --provider copilot-acp --model copilot-acp
# 需要 PATH 中有 GitHub Copilot CLI 和一个现有的 `copilot login` 会话
```

**永久配置：**
```yaml
model:
  provider: "copilot"
  default: "gpt-5.4"
```

| 环境变量 | 描述 |
|---------------------|-------------|
| `COPILOT_GITHUB_TOKEN` | 用于 Copilot API 的 GitHub 令牌 (最高优先级) |
| `HERMES_COPILOT_ACP_COMMAND` | 覆盖 Copilot CLI 二进制文件路径 (默认: `copilot`) |
| `HERMES_COPILOT_ACP_ARGS` | 覆盖 ACP 参数 (默认: `--acp --stdio`) |

### 一流 API-Key 提供商

这些提供商具有内置支持和专用的提供商 ID。设置 API key 并使用 `--provider` 进行选择：

```bash
# NovitaAI Model API
hermes chat --provider novita --model moonshotai/kimi-k2.5
# 需要: ~/.hermes/.env 中的 NOVITA_API_KEY

# z.ai / ZhipuAI GLM
hermes chat --provider zai --model glm-5
# 需要: ~/.hermes/.env 中的 GLM_API_KEY

# Kimi / Moonshot AI (国际版: api.moonshot.ai)
hermes chat --provider kimi-coding --model kimi-for-coding
# 需要: ~/.hermes/.env 中的 KIMI_API_KEY

# Kimi / Moonshot AI (中国版: api.moonshot.cn)
hermes chat --provider kimi-coding-cn --model kimi-k2.5
# 需要: ~/.hermes/.env 中的 KIMI_CN_API_KEY

# MiniMax (全局端点)
hermes chat --provider minimax --model MiniMax-M2.7
# 需要: ~/.hermes/.env 中的 MINIMAX_API_KEY

# MiniMax (中国端点)
hermes chat --provider minimax-cn --model MiniMax-M2.7
# 需要: ~/.hermes/.env 中的 MINIMAX_CN_API_KEY

# Qwen Cloud / DashScope (Qwen 模型)
hermes chat --provider alibaba --model qwen3.5-plus
# 需要: ~/.hermes/.env 中的 DASHSCOPE_API_KEY

# Xiaomi MiMo
hermes chat --provider xiaomi --model mimo-v2-pro
# 需要: ~/.hermes/.env 中的 XIAOMI_API_KEY

# Tencent TokenHub (Hy3 Preview)
hermes chat --provider tencent-tokenhub --model hy3-preview
# 需要: ~/.hermes/.env 中的 TOKENHUB_API_KEY

# Arcee AI (Trinity 模型)
hermes chat --provider arcee --model trinity-large-thinking
# 需要: ~/.hermes/.env 中的 ARCEEAI_API_KEY

# GMI Cloud
# 使用 GMI 的 /v1/models 端点返回的精确模型 ID。
hermes chat --provider gmi --model zai-org/GLM-5.1-FP8
# 需要: ~/.hermes/.env 中的 GMI_API_KEY
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "gmi"
  default: "zai-org/GLM-5.1-FP8"
```

可以通过 `NOVITA_BASE_URL`, `GLM_BASE_URL`, `KIMI_BASE_URL`, `MINIMAX_BASE_URL`, `MINIMAX_CN_BASE_URL`, `DASHSCOPE_BASE_URL`, `XIAOMI_BASE_URL`, `GMI_BASE_URL` 或 `TOKENHUB_BASE_URL` 环境变量覆盖基础 URL。

:::note Z.AI 端点自动检测
在使用 Z.AI / GLM 提供商时，Hermes 会自动探测多个端点（全局、中国、编码变体）以找到接受您 API key 的一个。您无需手动设置 `GLM_BASE_URL` — 可用的端点会被自动检测和缓存。
:::

### xAI (Grok) — Responses API + 提示缓存

xAI 通过 Responses API (`codex_responses` 传输) 实现 Grok 4 模型自动推理支持——不需要 `reasoning_effort` 参数，服务器默认会进行推理。在 `~/.hermes/.env` 中设置 `XAI_API_KEY` 并使用 `hermes model` 选择 xAI，或者将 `grok` 作为快捷方式输入到 `/model grok-4-fast-reasoning`。

SuperGrok 和 X Premium+ 订阅者可以通过浏览器 OAuth 而不是使用 API key 进行登录——在 `hermes model` 中选择 **xAI Grok OAuth (SuperGrok / Premium+)**，或运行 `hermes auth add xai-oauth`。相同的 OAuth bearer token 会被直接到 xAI 的工具（TTS、图像生成、视频生成、转录）自动重用。有关完整流程，请参阅 [xAI Grok OAuth 指南](../guides/xai-grok-oauth.md) — 如果 Hermes 在远程主机上运行，也请参阅 [SSH / 远程主机的 OAuth](../guides/oauth-over-ssh.md) 以了解所需的 `ssh -L` 隧道。

当使用 xAI 作为提供商（任何包含 `x.ai` 的基础 URL）时，Hermes 会自动启用提示缓存，在每次 API 请求中发送 `x-grok-conv-id` 头部信息。这会将请求路由到对话会话中的同一服务器，允许 xAI 的基础设施重用缓存的系统提示和对话历史记录。

无需配置——当检测到 xAI 端点并有可用会话 ID 时，缓存会自动激活。这降低了多轮对话的延迟和成本。

xAI 还提供了一个专用的 TTS 端点（`/v1/tts`）。请在 `hermes tools` 中选择 **xAI TTS** → Voice & TTS，或参阅 [Voice & TTS](../user-guide/features/tts.md#text-to-speech) 页面进行配置。

**退休的 xAI 模型迁移 (2026 年 5 月 15 日)：** xAI 将在 2026-05-15 淘汰 `grok-4*`, `grok-3`, `grok-code-fast-1` 和 `grok-imagine-image-pro`。`hermes doctor` 和 `hermes chat` 启动时都会检测任何仍指向已退休引用的配置，并打印推荐的替代方案。使用 `hermes migrate xai` 进行一次性配置重写——默认进行干运行，添加 `--apply` 以写入更改（会自动创建一个带时间戳的 `config.yaml.bak-pre-migrate-xai-*` 备份）。

```bash
hermes migrate xai          # 预览替代方案
hermes migrate xai --apply  # 原地重写 ~/.hermes/config.yaml
```

**xAI 网页搜索后端。** 当 [Web Search](../user-guide/features/web-search.md) 工具集启用时，`web.backend: xai` 会通过 xAI 的托管搜索端点进行搜索，使用相同的 `XAI_API_KEY` / OAuth 凭证。如果 xAI 已配置为提供商，则无需额外的设置。

### NovitaAI

[NovitaAI](https://novita.ai) 是为构建者和智能体提供的 AI 原生云平台。它的三条产品线包括模型 API（200+ 模型）、Agent Sandbox（用于构建和运行 AI 智能体）和 GPU Cloud（可扩展计算），所有功能均在一个平台上提供。

```bash
# 使用任何可用模型
hermes chat --provider novita --model moonshotai/kimi-k2.5
# 需要: ~/.hermes/.env 中的 NOVITA_API_KEY

# 简短别名
hermes chat --provider novita-ai --model deepseek/deepseek-v3-0324
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "novita"
  default: "moonshotai/kimi-k2.5"
  base_url: "https://api.novita.ai/openai/v1"
```

请在 [novita.ai/settings/key-management](https://novita.ai/settings/key-management) 获取您的 API key。基础 URL 可以通过 `NOVITA_BASE_URL` 环境变量覆盖。

### Ollama Cloud — 管理的 Ollama 模型, OAuth + API Key

[Ollama Cloud](https://ollama.com/cloud) 托管了与本地 Ollama 相同的开源模型目录，但无需 GPU。在 `hermes model` 中选择 **Ollama Cloud**，粘贴您从 [ollama.com/settings/keys](https://ollama.com/settings/keys) 获取的 API key，Hermes 将自动发现可用模型。

```bash
hermes model
# → 选择 "Ollama Cloud"
# → 粘贴您的 OLLAMA_API_KEY
# → 从已发现的模型中选择 (gpt-oss:120b, glm-4.6:cloud, qwen3-coder:480b-cloud 等)
```

或者直接在 `config.yaml` 中设置：
```yaml
model:
  provider: "ollama-cloud"
  default: "gpt-oss:120b"
```

模型目录是从 `ollama.com/v1/models` 动态获取并缓存一小时。`model:tag` 符号（例如 `qwen3-coder:480b-cloud`）会通过标准化保留下来——请勿使用连字符。

:::tip Ollama Cloud 与本地 Ollama
两者都支持相同的 OpenAI 兼容 API。Cloud 是一个一流的提供商 (`--provider ollama-cloud`, `OLLAMA_API_KEY`)；本地 Ollama 通过自定义端点流程（基础 URL `http://localhost:11434/v1`，无需密钥）进行访问。使用云服务来运行您无法在本地运行的大型模型；使用本地服务来进行隐私或离线工作。
:::

### AWS Bedrock

通过 AWS Bedrock 使用 Anthropic Claude、Amazon Nova、DeepSeek v3.2、Meta Llama 4 和其他模型。使用 AWS SDK (`boto3`) 凭证链——无需 API key，只需标准的 AWS 身份验证。

```bash
# 最简单的方式 — 在 ~/.aws/credentials 中命名配置文件
hermes chat --provider bedrock --model us.anthropic.claude-sonnet-4-6

# 或使用显式环境变量
AWS_PROFILE=myprofile AWS_REGION=us-east-1 hermes chat --provider bedrock --model us.anthropic.claude-sonnet-4-6
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "bedrock"
  default: "us.anthropic.claude-sonnet-4-6"
bedrock:
  region: "us-east-1"          # 或设置 AWS_REGION
  # profile: "myprofile"       # 或设置 AWS_PROFILE
  # discovery: true            # 从 IAM 自动发现区域
  # guardrail:                 # 可选的 Bedrock Guardrails
  #   guardrail_identifier: "your-guardrail-id"
  #   guardrail_version: "DRAFT"
```

身份验证使用标准的 boto3 链：显式的 `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`、来自 `~/.aws/credentials` 的 `AWS_PROFILE`、EC2/ECS/Lambda 上的 IAM 角色、IMDS 或 SSO。如果您已经使用 AWS CLI 进行身份验证，则无需任何环境变量。

Bedrock 在底层使用了**Converse API**——请求会被翻译成 Bedrock 模型无关的形状，因此相同的配置适用于 Claude、Nova、DeepSeek 和 Llama 模型。仅当您调用非默认区域端点时，才需要设置 `BEDROCK_BASE_URL`。

请参阅 [AWS Bedrock 指南](/guides/aws-bedrock) 以了解 IAM 设置、区域选择和跨区域推理的完整流程。

### Qwen Portal (OAuth)

Alibaba 的 Qwen Portal 带有基于浏览器的 OAuth 登录。在 `hermes model` 中选择 **Qwen OAuth (Portal)**，通过浏览器登录，Hermes 将持久化刷新令牌。

```bash
hermes model
# → 选择 "Qwen OAuth (Portal)"
# → 浏览器打开；使用您的 Alibaba 账户登录
# → 确认 — 凭证保存在 ~/.hermes/auth.json 中

hermes chat   # 使用 portal.qwen.ai/v1 端点
```

或者配置 `config.yaml`：
```yaml
model:
  provider: "qwen-oauth"
  default: "qwen3-coder-plus"
```

仅当门户端点发生迁移时，才需要设置 `HERMES_QWEN_BASE_URL` (默认: `https://portal.qwen.ai/v1`)。

:::tip Qwen OAuth 与 Qwen Cloud (Alibaba DashScope) 的区别
`qwen-oauth` 使用带有 OAuth 登录的面向消费者的 Qwen Portal — 非常适合个人用户。`alibaba` 提供商使用 Qwen Cloud (Alibaba DashScope) 和 `DASHSCOPE_API_KEY` — 非常适合程序化/生产工作负载。两者都路由到 Qwen 系列模型，但位于不同的端点上。
:::

### Alibaba Cloud (Coding Plan)

如果您订阅了阿里巴巴的**Coding Plan**（一个与标准 DashScope API 访问分开的定价 SKU），Hermes 将其作为自己的一流提供商暴露：`alibaba-coding-plan`。端点: `https://coding-intl.dashscope.aliyuncs.com/v1`。它与常规的 `alibaba` 提供商一样是 OpenAI 兼容的，但具有不同的基础 URL 和计费表面。

```yaml
model:
  provider: alibaba_coding     # alibaba-coding-plan 的别名
  model: qwen3-coder-plus
```

或者通过 CLI：

```bash
hermes chat --provider alibaba_coding --model qwen3-coder-plus
```

`alibaba_coding` 使用与您的 `alibaba` 条目相同的 `DASHSCOPE_API_KEY` — 无需单独的密钥，只需不同的路由目标。在此提供商注册之前，设置了 `provider: alibaba_coding` 的用户会静默地流向 OpenRouter 路由。

### MiniMax (OAuth)

MiniMax-M2.7 通过浏览器 OAuth 登录——无需 API key。在 `hermes model` 中选择 **MiniMax (OAuth)**，通过浏览器登录，Hermes 将持久化访问+刷新令牌。底层使用 Anthropic Messages 兼容的端点 (`/anthropic`)。

```bash
hermes model
# → 选择 "MiniMax (OAuth)"
# → 浏览器打开；使用您的 MiniMax 账户登录 (全球或 CN 地区)
# → 确认 — 凭证保存在 ~/.hermes/auth.json 中

hermes chat   # 使用 api.minimax.io/anthropic 端点
```

或者配置 `config.yaml`：
```yaml
model:
  provider: "minimax-oauth"
  default: "MiniMax-M2.7"
```

支持的模型：`MiniMax-M2.7` (主模型) 和 `MiniMax-M2.7-highspeed` (作为默认辅助模型)。OAuth 路径会忽略 `MINIMAX_API_KEY` / `MINIMAX_BASE_URL`。

:::tip MiniMax OAuth 与 API key 的区别
`minimax-oauth` 使用 MiniMax 的面向消费者的门户和 OAuth 登录 — 无需进行计费设置。`minimax` 和 `minimax-cn` 提供商使用 `MINIMAX_API_KEY` / `MINIMAX_CN_API_KEY` — 用于程序化访问。请参阅 [MiniMax OAuth 指南](/guides/minimax-oauth) 以获取完整的操作指南。
:::

### NVIDIA NIM

通过 [build.nvidia.com](https://build.nvidia.com) (免费 API key) 或本地 NIM 端点使用 Nemotron 和其他开源模型。

```bash
# 云端 (build.nvidia.com)
hermes chat --provider nvidia --model nvidia/nemotron-3-super-120b-a12b
# 需要: ~/.hermes/.env 中的 NVIDIA_API_KEY

# 本地 NIM 端点 — 覆盖基础 URL
NVIDIA_BASE_URL=http://localhost:8000/v1 hermes chat --provider nvidia --model nvidia/nemotron-3-super-120b-a12b
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "nvidia"
  default: "nvidia/nemotron-3-super-120b-a12b"
```

:::tip 本地 NIM
对于本地部署（DGX Spark, 本地 GPU），请设置 `NVIDIA_BASE_URL=http://localhost:8000/v1`。NIM 提供了与 build.nvidia.com 相同的 OpenAI 兼容聊天完成 API，因此在云端和本地之间切换只需一行环境变量更改。
:::

Hermes 会自动在每次请求到 `build.nvidia.com` 时附加 NIM 计费来源（billing-origin）头部信息——无需配置。这会将消耗量路由到 NVIDIA 计费仪表板中的正确来源。

### GMI Cloud

通过 [GMI Cloud](https://www.gmicloud.ai/) 使用开放和推理模型 — OpenAI 兼容 API，API key 身份验证。

```bash
# GMI Cloud
hermes chat --provider gmi --model deepseek-ai/DeepSeek-V3.2
# 需要: ~/.hermes/.env 中的 GMI_API_KEY
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "gmi"
  default: "deepseek-ai/DeepSeek-V3.2"
```

基础 URL 可以通过 `GMI_BASE_URL` 环境变量覆盖 (默认: `https://api.gmi-serving.com/v1`)。

### StepFun

通过 [StepFun](https://platform.stepfun.com) 使用 Step 系列模型 — OpenAI 兼容 API，API key 身份验证。

```bash
# StepFun
hermes chat --provider stepfun --model step-3.5-flash
# 需要: ~/.hermes/.env 中的 STEPFUN_API_KEY
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "stepfun"
  default: "step-3.5-flash"
```

基础 URL 可以通过 `STEPFUN_BASE_URL` 环境变量覆盖 (默认: `https://api.stepfun.com/v1`)。

### Hugging Face 推理提供商

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) 通过统一的 OpenAI 兼容端点 (`router.huggingface.co/v1`) 路由到 20+ 个开源模型。请求会自动路由到最快的可用后端（Groq, Together, SambaNova 等），并具有自动故障转移功能。

```bash
# 使用任何可用模型
hermes chat --provider huggingface --model Qwen/Qwen3.5-397B-A17B
# 需要: ~/.hermes/.env 中的 HF_TOKEN

# 简短别名
hermes chat --provider hf --model deepseek-ai/DeepSeek-V3.2
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "huggingface"
  default: "Qwen/Qwen3.5-397B-A17B"
```

请在 [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) 获取您的令牌 — 请确保启用了“Make calls to Inference Providers”权限。免费套餐包含（每月 0.10 美元信用，不收取提供商费率的加价）。

您可以向模型名称附加路由后缀：`:fastest` (默认)，`:cheapest` 或 `:provider_name` 来强制使用特定的后端。

基础 URL 可以通过 `HF_BASE_URL` 环境变量覆盖。

## 自托管和自定义 LLM 提供商

Hermes Agent 可与**任何 OpenAI 兼容的 API 端点**配合使用。如果一个服务器实现了 `/v1/chat/completions`，您就可以将 Hermes 指向它。这意味着您可以利用本地模型、GPU 推理服务器、多提供商路由器或任何第三方 API。

### 通用设置

配置自定义端点的三种方式：

**交互式设置（推荐）：**
```bash
hermes model
# 选择“自定义端点 (自托管 / VLLM / 等)”
# 输入：API 基础 URL, API 密钥, 模型名称
```

**手动配置 (`config.yaml`)：**
```yaml
# 在 ~/.hermes/config.yaml 中
model:
  default: your-model-name
  provider: custom
  base_url: http://localhost:8000/v1
  api_key: your-key-or-leave-empty-for-local
```

:::warning 遗留环境变量
`.env` 中的 `LLM_MODEL` 已**移除**——`config.yaml` 是模型和端点配置的唯一真相来源。`OPENAI_BASE_URL` 仍然有效，但**仅**对 `openai-api` 提供商有效（它会覆盖用于直接 API 密钥访问的 OpenAI 端点）。对于其他提供商和自定义端点，请使用 `hermes model` 或直接在 `config.yaml` 中设置 `model.base_url`。如果您的 `.env` 文件中有过时的条目，它们将在下次运行 `hermes setup` 或配置迁移时自动清除。
:::

这两种方法都会持久化到 `config.yaml`，该文件是模型、提供商和基础 URL 的真相来源。

### 使用 `/model` 切换模型

:::warning hermes model 与 /model
**`hermes model`**（在终端中运行，不属于任何聊天会话）是**完整的提供商设置向导**。使用它来添加新的提供商、运行 OAuth 流程、输入 API 密钥和配置自定义端点。

**`/model`**（在活动的 Hermes 聊天会话中输入）只能**切换您已设置好的提供商和模型**。它不能添加新提供商、运行 OAuth 或提示输入 API 密钥。如果您只配置了一个提供商（例如 OpenRouter），`/model` 只会显示该提供商的模型。

**要添加新的提供商：** 退出您的会话（`Ctrl+C` 或 `/quit`），运行 `hermes model`，设置新提供商，然后开始一个新的会话。
:::

一旦配置了一个自定义端点，您就可以在会话中途切换模型：

```
/model custom:qwen-2.5          # 切换到您的自定义端点上的一个模型
/model custom                    # 从端点自动检测模型
/model openrouter:claude-sonnet-4 # 切回云提供商
```

如果您配置了**命名自定义提供商**（见下文），请使用三段式语法：

```
/model custom:local:qwen-2.5    # 使用带有 qwen-2.5 模型的“local”自定义提供商
/model custom:work:llama3       # 使用带有 llama3 模型的“work”自定义提供商
```

当切换提供商时，Hermes 会将基础 URL 和提供商保留到配置中，以确保更改在重启后仍然有效。当从自定义端点切换回内置提供商时，过时的基础 URL 会自动清除。

:::tip
`/model custom`（裸形式，不带模型名称）会查询您的端点的 `/models` API 并自动选择一个模型，如果正好加载了一个模型。这对于运行单个模型的本地服务器特别有用。
:::

所有内容都遵循相同的模式——只需更改 URL、密钥和模型名称。

---

### Ollama — 本地模型，零配置

[Ollama](https://ollama.com/) 允许您通过一个命令在本地运行开源模型。最适合：快速本地实验、注重隐私的工作、离线使用。支持通过 OpenAI 兼容的 API 进行工具调用。

```bash
# 安装并运行一个模型
ollama pull qwen2.5-coder:32b
ollama serve   # 在 11434 端口启动
```

然后配置 Hermes：

```bash
hermes model
# 选择“自定义端点 (自托管 / VLLM / 等)”
# 输入 URL: http://localhost:11434/v1
# 跳过 API 密钥（Ollama 不需要）
# 输入模型名称（例如 qwen2.5-coder:32b）
```

或者直接配置 `config.yaml`：

```yaml
model:
  default: qwen2.5-coder:32b
  provider: custom
  base_url: http://localhost:11434/v1
  context_length: 64000   # 查看下方的警告
```

:::caution Ollama 默认的上下文长度非常低
Ollama **不会**默认使用您模型的完整上下文窗口。根据您的 VRAM，默认值如下：

| 可用 VRAM | 默认上下文 |
|---|---|
| 少于 24 GB | **4,096 个 token** |
| 24–48 GB | 32,768 个 tokens |
| 48 GB 以上 | 256,000 个 tokens |

Hermes Agent 要求至少 **64,000 个 token** 的上下文才能与工具一起使用。较小的窗口会在启动时被拒绝，因为系统提示、工具模式和正在进行的对话状态需要足够的空间来支持可靠的多步工作流程。

**如何增加它**（选择一个）：

```bash
# 选项 1: 通过环境变量设置服务器级别（推荐）
OLLAMA_CONTEXT_LENGTH=64000 ollama serve

# 选项 2: 对于 systemd 管理的 Ollama
sudo systemctl edit ollama.service
# 添加：Environment="OLLAMA_CONTEXT_LENGTH=64000"
# 然后：sudo systemctl daemon-reload && sudo systemctl restart ollama

# 选项 3: 将其烘焙到自定义模型中（每个模型的持久化设置）
echo -e "FROM qwen2.5-coder:32b\nPARAMETER num_ctx 64000" > Modelfile
ollama create qwen2.5-coder-64k -f Modelfile
```

**您无法通过 OpenAI 兼容的 API (`/v1/chat/completions`) 设置上下文长度。** 它必须在服务器端或通过 Modelfile 配置。这是将 Ollama 与 Hermes 等工具集成时最容易混淆的地方。
:::

**验证您的上下文是否设置正确：**

```bash
ollama ps
# 查看 CONTEXT 列——它应该显示您配置的值
```

:::tip
使用 `ollama list` 列出可用模型。使用 `ollama pull <model>` 从 [Ollama 库](https://ollama.com/library) 拉取任何模型。Ollama 会自动处理 GPU 卸载——对于大多数设置来说，无需配置。
:::

---

### vLLM — 高性能 GPU 推理

[vLLM](https://docs.vllm.ai/) 是生产 LLM 服务的事实标准。最适合：GPU 硬件上的最大吞吐量、服务大型模型、连续批处理。

```bash
pip install vllm
vllm serve meta-llama/Llama-3.1-70B-Instruct \
  --port 8000 \
  --max-model-len 65536 \
  --tensor-parallel-size 2 \
  --enable-auto-tool-choice \
  --tool-call-parser hermes
```

然后配置 Hermes：

```bash
hermes model
# 选择“自定义端点 (自托管 / VLLM / 等)”
# 输入 URL: http://localhost:8000/v1
# 跳过 API 密钥（或输入一个，如果您使用 --api-key 配置了 vLLM）
# 输入模型名称: meta-llama/Llama-3.1-70B-Instruct
```

**上下文长度：** vLLM 默认读取模型的 `max_position_embeddings`。如果这超出了您的 GPU 内存，它会报错并要求您设置一个较低的 `--max-model-len`。您也可以使用 `--max-model-len auto` 来自动找到合适的上限。设置 `--gpu-memory-utilization 0.95`（默认值 0.9）可以挤入更多的上下文到 VRAM 中。

**工具调用需要显式标志：**

| 标志 | 用途 |
|---|---|
| `--enable-auto-tool-choice` | 对于 `tool_choice: "auto"` 所必需的设置（Hermes 的默认值） |
| `--tool-call-parser <name>` | 用于模型的工具调用格式解析器 |

支持的解析器：`hermes` (Qwen 2.5, Hermes 2/3), `llama3_json` (Llama 3.x), `mistral`, `deepseek_v3`, `deepseek_v31`, `xlam`, `pythonic`。如果没有这些标志，工具调用将无法工作——模型会以文本形式输出工具调用。

**Qwen 推理解析器：** Hermes 会保留结构化的推理元数据，例如 `reasoning`、`reasoning_content` 和流式推理增量，当 OpenAI 兼容的服务器返回它们时。该元数据被视为推理/思考跟踪数据，而不是助手可见答案的替代品。对于由 vLLM 服务运行的 Qwen 推理模型，请确保最终用户可见的响应仍然出现在 `content` 中。如果 `--reasoning-parser qwen3` 在您的部署中使 `content` 为空，请禁用该解析器或通过 `extra_body` 传递一个服务器支持的请求选项，例如 `chat_template_kwargs.enable_thinking: false`。

:::tip
vLLM 支持人类可读的大小：`--max-model-len 64k`（小写 k = 1000，大写 K = 1024）。
:::

---

### SGLang — 带 RadixAttention 的快速服务

[SGLang](https://github.com/sgl-project/sglang) 是 vLLM 的一种替代方案，它使用 RadixAttention 来实现 KV 缓存重用。最适合：多轮对话（前缀缓存）、受限解码、结构化输出。

```bash
pip install "sglang[all]"
python -m sglang.launch_server \
  --model meta-llama/Llama-3.1-70B-Instruct \
  --port 30000 \
  --context-length 65536 \
  --tp 2 \
  --tool-call-parser qwen
```

然后配置 Hermes：

```bash
hermes model
# 选择“自定义端点 (自托管 / VLLM / 等)”
# 输入 URL: http://localhost:30000/v1
# 输入模型名称: meta-llama/Llama-3.1-70B-Instruct
```

**上下文长度：** SGLang 默认从模型的配置中读取。使用 `--context-length` 进行覆盖。如果您需要超出模型声明的最大限制，请设置 `SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1`。

**工具调用：** 使用 `--tool-call-parser` 并指定适合您模型系列的解析器：`qwen` (Qwen 2.5), `llama3`, `llama4`, `deepseekv3`, `mistral`, `glm`。如果没有此标志，工具调用将以纯文本形式返回。

:::caution SGLang 默认的最大输出 token 为 128
如果响应被截断，请在请求中添加 `max_tokens` 或在服务器上设置 `--default-max-tokens`。SGLang 的默认值是每个响应 128 个 token，除非在请求中指定。
:::

---

### llama.cpp / llama-server — CPU 和 Metal 推理

[llama.cpp](https://github.com/ggml-org/llama.cpp) 在 CPU、Apple Silicon (Metal) 和消费级 GPU 上运行量化模型。最适合：在没有数据中心 GPU 的情况下运行模型、Mac 用户、边缘部署。

```bash
# 构建并启动 llama-server
cmake -B build && cmake --build build --config Release
./build/bin/llama-server \
  --jinja -fa \
  -c 64000 \
  -ngl 99 \
  -m models/qwen2.5-coder-32b-instruct-Q4_K_M.gguf \
  --port 8080 --host 0.0.0.0
```

**上下文长度 (`-c`)：** 最近的构建默认值为 `0`，它会从 GGUF 元数据中读取模型的训练上下文。对于具有 128k+ 训练上下文的模型，这可能会尝试分配完整的 KV 缓存而导致 OOM（内存不足）。请显式设置 `-c` 为至少 64,000 个 token 以供 Hermes 使用。如果使用并行槽位 (`-np`)，则总上下文会被分配到各个槽位中——例如，`-c 64000 -np 4`，每个槽位只得到 16k，这低于 Hermes 的活动会话最低要求。

然后配置 Hermes 指向它：

```bash
hermes model
# 选择“自定义端点 (自托管 / VLLM / 等)”
# 输入 URL: http://localhost:8080/v1
# 跳过 API 密钥（本地服务器不需要）
# 输入模型名称——或者留空以自动检测，如果只加载了一个模型
```

这会将端点保存到 `config.yaml` 中，使其在会话之间保持持久。

:::caution `--jinja` 对于工具调用是必需的
如果没有 `--jinja`，llama-server 将完全忽略 `tools` 参数。模型会尝试通过在其响应文本中写入 JSON 来调用工具，但 Hermes 不会将其识别为工具调用——您将看到原始 JSON，例如 `{"name": "web_search", ...}` 作为消息打印出来，而不是实际的搜索结果。

原生工具调用支持（最佳性能）：Llama 3.x, Qwen 2.5 (包括 Coder), Hermes 2/3, Mistral, DeepSeek, Functionary。所有其他模型都使用一个通用的处理程序，它有效但效率可能较低。请参阅 [llama.cpp 函数调用文档](https://github.com/ggml-org/llama.cpp/blob/master/docs/function-calling.md) 以获取完整列表。

您可以通过检查 `http://localhost:8080/props` 来验证工具支持是否激活——`chat_template` 字段应该存在。
:::

:::tip
从 [Hugging Face](https://huggingface.co/models?library=gguf) 下载 GGUF 模型。Q4_K_M 量化提供了质量与内存使用之间的最佳平衡。
:::

---

### LM Studio — 带本地模型的桌面应用

[LM Studio](https://lmstudio.ai/) 是一款带有 GUI 的桌面应用程序，用于运行本地模型。最适合：喜欢视觉界面的用户、快速模型测试者、macOS/Windows/Linux 开发者。

从 LM Studio 应用（开发者选项卡 → 启动服务器）开始服务器，或使用 CLI：

```bash
lms server start                        # Starts on port 1234
lms load qwen2.5-coder --context-length 64000
```

然后配置 Hermes：

```bash
hermes model
# Select "LM Studio"
# Press Enter to use http://localhost:1234/v1
# Pick one of the discovered models
# If LM Studio server auth is enabled, enter LM_API_KEY when prompted
```

Hermes 将自动加载一个具有 64K 上下文长度的 LM Studio 模型。

要更改 LM Studio 中的上下文长度：

1. 点击模型选择器旁边的齿轮图标。
2. 将“Context Length”（上下文长度）设置为至少 64000，以获得流畅的体验。
3. 重新加载模型以使更改生效。
4. 如果您的机器无法容纳 64000，请考虑使用具有更大上下文长度的较小模型。

或者，使用 CLI：`lms load model-name --context-length 64000`

您可以使用 CLI 来估算模型是否能容纳：`lms load model-name --context-length 64000 --estimate-only`

要设置持久的每模型默认值：进入 My Models（我的模型）选项卡 → 点击模型上的齿轮图标 → 设置上下文大小。
:::

**工具调用 (Tool calling)：** 自 LM Studio 0.3.6 版本以来已支持。具有原生工具调用训练的模型（Qwen 2.5、Llama 3.x、Mistral、Hermes）会被自动检测到，并显示工具徽章。其他模型使用通用回退机制，可靠性可能较低。

---

### WSL2 网络配置 (Windows 用户)

由于 Hermes 智能体需要 Unix 环境，因此 Windows 用户需要在 WSL2 中运行它。如果您的模型服务器（Ollama、LM Studio 等）在**Windows 主机**上运行，您就需要弥补网络差距——WSL2 使用具有自己子网的虚拟网络适配器，因此 WSL2 内部的 `localhost` 指的是 Linux VM，**而不是** Windows 主机。

:::tip 如果两者都在 WSL2 中？没问题。
如果您的模型服务器也在 WSL2 中运行（vLLM、SGLang 和 llama-server 都常见），那么 `localhost` 会按预期工作——它们共享相同的网络命名空间。请跳过此部分。
:::

#### 选项 1：镜像网络模式 (推荐)

适用于**Windows 11 22H2+**，镜像模式使 Windows 和 WSL2 之间 `localhost` 能够双向工作——这是最简单的解决方案。

1. 创建或编辑 `%USERPROFILE%\.wslconfig`（例如：`C:\Users\YourName\.wslconfig`）：
   ```ini
   [wsl2]
   networkingMode=mirrored
   ```

2. 从 PowerShell 重新启动 WSL：
   ```powershell
   wsl --shutdown
   ```

3. 重新打开您的 WSL2 终端。此时 `localhost` 就可以访问 Windows 服务了：
   ```bash
   curl http://localhost:11434/v1/models   # Ollama 在 Windows 上运行 — 可用
   ```

:::note Hyper-V 防火墙
在某些 Windows 11 版本中，Hyper-V 防火墙默认会阻止镜像连接。如果启用镜像模式后 `localhost` 仍然无效，请在**管理员 PowerShell** 中运行此命令：
```powershell
Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow
```
:::

#### 选项 2：使用 Windows 主机 IP (Windows 10 / 旧版本)

如果您无法使用镜像模式，请在 WSL2 内部找到 Windows 主机的 IP 地址，并使用该地址而不是 `localhost`：

```bash
# 获取 Windows 主机 IP（WSL2 虚拟网络的默认网关）
ip route show | grep -i default | awk '{ print $3 }'
# 示例输出: 172.29.192.1
```

在您的 Hermes 配置中使用该 IP：

```yaml
model:
  default: qwen2.5-coder:32b
  provider: custom
  base_url: http://172.29.192.1:11434/v1   # Windows 主机 IP，而不是 localhost
```

:::tip 动态助手
主机 IP 在 WSL2 重启后可能会改变。您可以在 shell 中动态获取它：
```bash
export WSL_HOST=$(ip route show | grep -i default | awk '{ print $3 }')
echo "Windows 主机地址为: $WSL_HOST"
curl http://$WSL_HOST:11434/v1/models   # 测试 Ollama
```

或者使用您机器的 mDNS 名称（需要 WSL2 中的 `libnss-mdns`）：
```bash
sudo apt install libnss-mdns
curl http://$(hostname).local:11434/v1/models
```
:::

#### 服务器绑定地址 (NAT 模式必需)

如果您使用的是**选项 2**（使用主机 IP 的 NAT 模式），那么 Windows 上的模型服务器必须接受来自 `127.0.0.1` 以外的连接。默认情况下，大多数服务器只监听 `localhost`——而 NAT 模式下的 WSL2 连接来自不同的虚拟子网，因此会被拒绝。在镜像模式下，`localhost` 直接映射，所以默认的 `127.0.0.1` 绑定是完全可行的。

| 服务器 | 默认绑定 | 如何修复 |
|--------|-------------|------------|
| **Ollama** | `127.0.0.1` | 在启动 Ollama 之前设置 `OLLAMA_HOST=0.0.0.0` 环境变量（在 Windows 的系统设置 → 环境变量中，或编辑 Ollama 服务） |
| **LM Studio** | `127.0.0.1` | 在开发者选项卡 → 服务器设置中启用**“Serve on Network”（在网络上提供服务）** |
| **llama-server** | `127.0.0.1` | 将 `--host 0.0.0.0` 添加到启动命令中 |
| **vLLM** | `0.0.0.0` | 默认已绑定到所有接口 |
| **SGLang** | `127.0.0.1` | 将 `--host 0.0.0.0` 添加到启动命令中 |

**Windows 上的 Ollama (详细说明)：** Ollama 作为 Windows 服务运行。要设置 `OLLAMA_HOST`：
1. 打开**系统属性** → **环境变量**
2. 添加一个新的**系统变量**: `OLLAMA_HOST` = `0.0.0.0`
3. 重新启动 Ollama 服务（或重启）

#### Windows 防火墙

Windows 防火墙将 WSL2 视为一个独立的网络（无论是 NAT 模式还是镜像模式）。如果执行了上述步骤后连接仍然失败，请为您的模型服务器端口添加防火墙规则：

```powershell
# 在管理员 PowerShell 中运行 — 将 PORT 替换为您服务器的端口
New-NetFirewallRule -DisplayName "Allow WSL2 to Model Server" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 11434
```

常见端口：Ollama `11434`，vLLM `8000`，SGLang `30000`，llama-server `8080`，LM Studio `1234`。

#### 快速验证

在 WSL2 内部测试是否可以访问您的模型服务器：

```bash
# 将 URL 替换为您的服务器地址和端口
curl http://localhost:11434/v1/models          # 镜像模式
curl http://172.29.192.1:11434/v1/models       # NAT 模式（使用实际的主机 IP）
```

如果您收到一个列出您模型的 JSON 响应，则表示成功。请将相同的 URL 作为 Hermes 配置中的 `base_url`。

---

### 本地模型故障排除 (Troubleshooting Local Models)

这些问题会影响在使用 Hermes 时**所有**本地推理服务器。

#### 从 WSL2 到 Windows 主机托管的模型服务器出现“Connection refused”（连接被拒绝）

如果您在 WSL2 中运行 Hermes，而您的模型服务器在 Windows 主机上运行，那么在 WSL2 的默认 NAT 网络模式下，`http://localhost:<port>` 是无效的。请参考上面的 [WSL2 网络配置](#wsl2-networking-windows-users) 以获取解决方案。

#### 工具调用显示为文本而不是实际执行

模型输出类似 `{"name": "web_search", "arguments": {...}}` 的消息，而没有真正调用工具。

**原因：** 您的服务器未启用工具调用，或者模型不支持通过服务器的工具调用实现来使用它。

| 服务器 | 修复方法 |
|--------|-----|
| **llama.cpp** | 在启动命令中添加 `--jinja` |
| **vLLM** | 添加 `--enable-auto-tool-choice --tool-call-parser hermes` |
| **SGLang** | 添加 `--tool-call-parser qwen`（或适当的解析器） |
| **Ollama** | 工具调用默认已启用 — 请确保您的模型支持它（使用 `ollama show model-name` 检查） |
| **LM Studio** | 更新到 0.3.6+ 并使用具有原生工具支持的模型 |

#### 模型似乎忘记了上下文或给出不连贯的回复

**原因：** 上下文窗口太小。当对话超出上下文限制时，大多数服务器会静默地丢弃旧消息。Hermes 的系统提示 + 工具模式本身就可能消耗 4k–8k tokens。

**诊断：**

```bash
# 检查 Hermes 所认为的上下文是什么
# 查看启动行：“Context limit: X tokens”

# 检查您服务器的实际上下文
# Ollama: ollama ps (CONTEXT 列)
# llama.cpp: curl http://localhost:8080/props | jq '.default_generation_settings.n_ctx'
# vLLM: 检查启动参数中的 --max-model-len
```

**修复：** 将上下文设置为至少 **64,000 tokens** 以供智能体使用。请参考每个服务器的相应部分以获取特定标志。

#### 启动时显示“Context limit: 2048 tokens”

Hermes 会从您服务器的 `/v1/models` 端点自动检测上下文长度。如果服务器报告了一个较低的值（或根本不报告），Hermes 将使用模型声明的限制，而该限制可能是错误的。

**修复：** 在 `config.yaml` 中显式设置它：

```yaml
model:
  default: your-model
  provider: custom
  base_url: http://localhost:11434/v1
  context_length: 64000
```

#### 回复言语中途被截断

**可能的原因：**
1. **服务器上的低输出上限（`max_tokens`）** — SGLang 默认每个回复限制为 128 个 tokens。请在服务器上设置 `--default-max-tokens`，或在 `config.yaml` 中使用 `model.max_tokens` 配置 Hermes。注意：`max_tokens` 只控制回复的长度——它与您的对话历史记录有多长是无关的（那是 `context_length`）。
2. **上下文耗尽** — 模型填满了其上下文窗口。增加 `model.context_length` 或在 Hermes 中启用 [上下文压缩](/user-guide/configuration#context-compression)。

---

### LiteLLM 代理 — 多提供商网关 (Multi-Provider Gateway)

[LiteLLM](https://docs.litellm.ai/) 是一个与 OpenAI 兼容的代理，它将 100+ 个 LLM 提供商统一到一个 API 后端。最适合：在不更改配置的情况下切换提供商、负载均衡、回退链（fallback chains）、预算控制。

```bash
# 安装并启动
pip install "litellm[proxy]"
litellm --model anthropic/claude-sonnet-4 --port 4000

# 或使用包含多个模型的配置文件：
litellm --config litellm_config.yaml --port 4000
```

然后使用 `hermes model` 配置 Hermes，选择 → 自定义端点 (Custom endpoint) → `http://localhost:4000/v1`。

带有回退机制的示例 `litellm_config.yaml`:
```yaml
model_list:
  - model_name: "best"
    litellm_params:
      model: anthropic/claude-sonnet-4
      api_key: sk-ant-...
  - model_name: "best"
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-...
router_settings:
  routing_strategy: "latency-based-routing"
```

---

### ClawRouter — 成本优化路由 (Cost-Optimized Routing)

[ClawRouter](https://github.com/BlockRunAI/ClawRouter) 由 BlockRunAI 开发，是一个本地路由代理，它根据查询的复杂性自动选择模型。它在 14 个维度上对请求进行分类，并将其路由到能够处理该任务的最便宜模型。支付方式为 USDC 加密货币（无需 API 密钥）。

```bash
# 安装并启动
npx @blockrun/clawrouter    # 在端口 8402 上启动
```

然后使用 `hermes model` 配置 Hermes，选择 → 自定义端点 (Custom endpoint) → `http://localhost:8402/v1` → 模型名称 `blockrun/auto`。

路由配置文件：
| Profile | Strategy | Savings |
|---------|----------|---------|
| `blockrun/auto` | 平衡质量/成本 | 74-100% |
| `blockrun/eco` | 最便宜的 | 95-100% |
| `blockrun/premium` | 最佳质量模型 | 0% |
| `blockrun/free` | 仅限免费模型 | 100% |
| `blockrun/agentic` | 针对工具使用的优化 | 可变 |

:::note
ClawRouter 需要在 Base 或 Solana 上有 USDC 资金的钱包。所有请求都通过 BlockRun 的后端 API 进行路由。运行 `npx @blockrun/clawrouter doctor` 来检查钱包状态。
:::

---

### 其他兼容提供商 (Other Compatible Providers)

任何具有与 OpenAI 兼容 API 的服务都可以使用。一些流行的选项：

| Provider | Base URL | Notes |
|----------|----------|-------|
| [Together AI](https://together.ai) | `https://api.together.xyz/v1` | 云托管的开源模型 |
| [Groq](https://groq.com) | `https://api.groq.com/openai/v1` | 超快速推理 |
| [DeepSeek](https://deepseek.com) | `https://api.deepseek.com/v1` | DeepSeek 模型 |
| [Fireworks AI](https://fireworks.ai) | `https://api.fireworks.ai/inference/v1` | 快速开源模型托管 |
| [GMI Cloud](https://www.gmicloud.ai/) | `https://api.gmi-serving.com/v1` | 受管理的 OpenAI 兼容推理服务 |
| [Cerebras](https://cerebras.ai) | `https://api.cerebras.ai/v1` | Wafer 级芯片推理 |
| [Mistral AI](https://mistral.ai) | `https://api.mistral.ai/v1` | Mistral 模型 |
| [OpenAI](https://openai.com) | `https://api.openai.com/v1` | 直接 OpenAI 访问 |
| [Azure OpenAI](https://azure.microsoft.com) | `https://YOUR.openai.azure.com/` | 企业版 OpenAI |
| [LocalAI](https://localai.io) | `http://localhost:8080/v1` | 自托管、多模型支持 |
| [Jan](https://jan.ai) | `http://localhost:1337/v1` | 带有本地模型的桌面应用 |

使用 `hermes model` → 自定义端点，或在 `config.yaml` 中配置这些提供商之一：

```yaml
model:
  default: meta-llama/Llama-3.1-70B-Instruct-Turbo
  provider: custom
  base_url: https://api.together.xyz/v1
  api_key: your-together-key
```

---

### 上下文长度检测 (Context Length Detection)

:::note 两个设置，容易混淆
**`context_length`** 是 **总上下文窗口** — 指输入和输出令牌的组合预算（例如，Claude Opus 4.6 为 200,000）。Hermes 使用此值来决定何时压缩历史记录以及验证 API 请求。

**`model.max_tokens`** 是 **输出上限** — 模型在*单个响应*中可以生成的最大令牌数。它与你的对话历史有多长无关。行业标准名称 `max_tokens` 是常见的混淆来源；Anthropic 的原生 API 后来将其重命名为 `max_output_tokens` 以提高清晰度。

当自动检测出错时，请设置 `context_length`。
仅当你需要限制单个响应的长度时，才设置 `model.max_tokens`。
:::

Hermes 使用多源解析链来检测模型和提供商正确的上下文窗口：

1. **配置覆盖** — config.yaml 中的 `model.context_length` (最高优先级)
2. **自定义模型提供商** — `custom_providers[].models.<id>.context_length`
3. **持久缓存** — 以前发现的值（重启后仍保留）
4. **`/models` 端点** — 查询你的服务器 API（本地/自定义端点）
5. **Anthropic `/v1/models`** — 查询 Anthropic 的 API 以获取 `max_input_tokens` (仅限 API 密钥用户)
6. **OpenRouter API** — 来自 OpenRouter 的实时模型元数据
7. **Nous Portal** — 将 Nous 模型 ID 与 OpenRouter 元数据进行后缀匹配
8. **[models.dev](https://models.dev)** — 一个社区维护的注册表，包含 100+ 个提供商中针对 3800+ 个模型的特定上下文长度
9. **回退默认值** — 广泛的模型家族模式（128K 默认）

对于大多数设置，它开箱即用。该系统是感知提供商的——同一个模型可以根据谁来服务它而具有不同的上下文限制（例如，`claude-opus-4.6` 在 Anthropic 直接访问中为 1M，但在 GitHub Copilot 中为 128K）。

要显式设置上下文长度，请将 `context_length` 添加到模型配置中：

```yaml
model:
  default: "qwen3.5:9b"
  base_url: "http://localhost:8080/v1"
  context_length: 131072  # tokens
```

对于自定义端点，你也可以按模型设置上下文长度：

```yaml
custom_providers:
  - name: "My Local LLM"
    base_url: "http://localhost:11434/v1"
    models:
      qwen3.5:27b:
        context_length: 64000
      deepseek-r1:70b:
        context_length: 65536
```

`hermes model` 会在配置自定义端点时提示上下文长度。如果留空，则进行自动检测。

:::tip 何时手动设置此项
- 你正在使用 Ollama 并使用了低于模型最大值的自定义 `num_ctx`
- 你想将上下文限制在模型的最大值之下（例如，对于 128k 模型设置为 8k 以节省 VRAM）
- 你运行在一个不暴露 `/v1/models` 的代理后面
:::

---

### 命名自定义提供商 (Named Custom Providers)

如果你处理多个自定义端点（例如，本地开发服务器和远程 GPU 服务器），你可以在 `config.yaml` 中将它们定义为命名自定义提供商：

```yaml
custom_providers:
  - name: local
    base_url: http://localhost:8080/v1
    # 忽略 api_key — Hermes 对无需密钥的本地服务器使用 "no-key-required"
  - name: work
    base_url: https://gpu-server.internal.corp/v1
    key_env: CORP_API_KEY
    api_mode: chat_completions   # 由 `hermes model` → 自定义端点向导设置；自动检测仍作为回退选项进行
  - name: anthropic-proxy
    base_url: https://proxy.example.com/anthropic
    key_env: ANTHROPIC_PROXY_KEY
    api_mode: anthropic_messages  # 适用于 Anthropic 兼容的代理
```

某些 OpenAI 兼容的端点需要提供商特定的请求体字段。向匹配的自定义提供商添加一个 `extra_body` 地图，Hermes 将将其合并到该端点的每个聊天完成请求中：

```yaml
custom_providers:
  - name: gemma-local
    base_url: http://localhost:8080/v1
    model: google/gemma-4-31b-it
    extra_body:
      enable_thinking: true
      reasoning_effort: high
```

请使用你的服务器文档中描述的结构。例如，vLLM Gemma 部署和某些 NVIDIA NIM 端点期望 `chat_template_kwargs` 下的 `enable_thinking`，而不是作为顶层的 `extra_body` 字段：

```yaml
extra_body:
  chat_template_kwargs:
    enable_thinking: true
```

对于由 vLLM 提供的 Qwen 推理模型，可以使用相同的结构来禁用思考功能，当推理解析器将所有生成的文本分离到推理字段中并使助手 `content` 为空时：

```yaml
extra_body:
  chat_template_kwargs:
    enable_thinking: false
```

`hermes model` → 自定义端点向导现在会显式提示 `api_mode`，并将你的答案持久化到 `config.yaml` 中。当该字段留空时，URL 基础的自动检测（例如 `/anthropic` 路径 → `anthropic_messages`）仍作为回退选项进行。

**自定义提供商模型的原生视觉功能。** 如果你的自定义端点提供了一个未在 models.dev 中的视觉能力模型，请设置 `model.supports_vision: true`，这样 Hermes 就可以原生路由附加的图像（作为 `image_url` 部分）而不是通过 `vision_analyze` 进行预处理。只需一个开关——无需同时设置 `agent.image_input_mode: native`。

```yaml
model:
  provider: custom
  base_url: http://localhost:8080/v1
  default: qwen3.6-35b-a3b
  supports_vision: true   # 原生发送图像；否则，它们将通过 vision_analyze 进行预描述
```

同一键也适用于按命名提供商的模型（`custom_providers[*].models[*].supports_vision`），并且接受标准的 YAML 布尔值（`true/false/yes/no/on/off/1/0`）。

使用三元语法在会话中切换它们：

```
/model custom:local:qwen-2.5       # 使用带有 qwen-2.5 的 "local" 端点
/model custom:work:llama3-70b      # 使用带有 llama3-70b 的 "work" 端点
/model custom:anthropic-proxy:claude-sonnet-4  # 使用代理
```

你也可以从交互式的 `hermes model` 菜单中选择命名自定义提供商。

---

### 食谱：Together AI, Groq, Perplexity

[其他兼容的提供商](#other-compatible-providers) 中列出的云提供商都遵循 OpenAI 的 REST 方言，因此它们在 `custom_providers:` 下以相同的方式配置。以下是三个可用的配方。每个配方都放入 `~/.hermes/config.yaml`，对应的 API 密钥放入 `~/.hermes/.env`。

#### Together AI

以远低于第一方 API 的价格托管开源模型（Llama, MiniMax, Gemma, DeepSeek, Qwen）。对于多模型集群来说是一个好的默认选择。

```yaml
# ~/.hermes/config.yaml
custom_providers:
  - name: together
    base_url: https://api.together.xyz/v1
    key_env: TOGETHER_API_KEY
    # api_mode: chat_completions  # 默认设置 — 无需设置

model:
  default: MiniMaxAI/MiniMax-M2.7   # 或来自 together.ai/models 的任何模型
  provider: custom:together
```

```bash
# ~/.hermes/.env
TOGETHER_API_KEY=your-together-key
```

在会话中切换模型：

```
/model custom:together:meta-llama/Llama-3.3-70B-Instruct-Turbo
/model custom:together:google/gemma-4-31b-it
/model custom:together:deepseek-ai/DeepSeek-V3
```

Together 的 `/v1/models` 端点是可用的，因此 `hermes model` 可以自动发现可用模型。

#### Groq

超快速推理（Llama-3.3-70B 上约 500 tok/s）。虽然目录较小，但对于对延迟敏感的交互式使用非常强大。

```yaml
# ~/.hermes/config.yaml
custom_providers:
  - name: groq
    base_url: https://api.groq.com/openai/v1
    key_env: GROQ_API_KEY

model:
  default: llama-3.3-70b-versatile
  provider: custom:groq
```

```bash
# ~/.hermes/.env
GROQ_API_KEY=your-groq-key
```

#### Perplexity

当你需要一个可以自动进行实时网络搜索和引用的模型时，它非常有用。它对可用模型有严格要求——请查看 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 以获取当前列表。

```yaml
# ~/.hermes/config.yaml
custom_providers:
  - name: perplexity
    base_url: https://api.perplexity.ai
    key_env: PERPLEXITY_API_KEY

model:
  default: sonar
  provider: custom:perplexity
```

```bash
# ~/.hermes/.env
PERPLEXITY_API_KEY=your-perplexity-key
```

#### 一个配置中的多个提供商

这三个食谱可以组合使用——将它们全部一起使用，并使用 `/model custom:<name>:<model>` 在每次轮次中切换：

```yaml
custom_providers:
  - name: together
    base_url: https://api.together.xyz/v1
    key_env: TOGETHER_API_KEY
  - name: groq
    base_url: https://api.groq.com/openai/v1
    key_env: GROQ_API_KEY
  - name: perplexity
    base_url: https://api.perplexity.ai
    key_env: PERPLEXITY_API_KEY

model:
  default: MiniMaxAI/MiniMax-M2.7
  provider: custom:together      # 启动时使用 Together；之后可以自由切换
```

:::tip 故障排除
- 在 #15083 CLI 验证器修复后，`hermes doctor` 不应该对这些名称中的任何一个打印 `Unknown provider` 警告。
- 如果某个提供商的 `/v1/models` 端点无法访问（Perplexity 是常见情况），`hermes model` 会带着警告保留该模型，而不是硬性拒绝 — 参考 #15136。
- 要完全跳过 `custom_providers:` 并使用 `CUSTOM_BASE_URL` 环境变量与裸的 `provider: custom` 一起使用，请参考 #15103。
:::

---

### 选择正确的设置 (Choosing the Right Setup)

| 用途场景 | 推荐选项 |
|----------|-------------|
| **只要能用** | OpenRouter (默认) 或 Nous Portal |
| **本地模型，简单设置** | Ollama |
| **生产 GPU 服务** | vLLM 或 SGLang |
| **Mac / 无 GPU** | Ollama 或 llama.cpp |
| **多提供商路由** | LiteLLM Proxy 或 OpenRouter |
| **成本优化** | ClawRouter 或使用 `sort: "price"` 的 OpenRouter |
| **最大隐私性** | Ollama, vLLM 或 llama.cpp (完全本地) |
| **企业/Azure** | 使用自定义端点的 Azure OpenAI |
| **中文 AI 模型** | z.ai (GLM), Kimi/Moonshot (`kimi-coding` 或 `kimi-coding-cn`), MiniMax, Xiaomi MiMo, 或 Tencent TokenHub (一流的提供商) |

:::tip
你可以随时使用 `hermes model` 切换提供商——无需重启。无论你使用哪个提供商，你的对话历史、记忆和技能都会保留下来。
:::

## 可选 API 密钥

| Feature | Provider | Env Variable |
|---------|----------|--------------|
| Web scraping | [Firecrawl](https://firecrawl.dev/) | `FIRECRAWL_API_KEY`, `FIRECRAWL_API_URL` |
| Browser automation | [Browserbase](https://browserbase.com/) | `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` |
| Image generation | [FAL](https://fal.ai/) | `FAL_KEY` |
| Premium TTS voices | [ElevenLabs](https://elevenlabs.io/) | `ELEVENLABS_API_KEY` |
| OpenAI TTS + voice transcription | [OpenAI](https://platform.openai.com/api-keys) | `VOICE_TOOLS_OPENAI_KEY` |
| Mistral TTS + voice transcription | [Mistral](https://console.mistral.ai/) | `MISTRAL_API_KEY` |
| Cross-session user modeling | [Honcho](https://honcho.dev/) | `HONCHO_API_KEY` |
| Semantic long-term memory | [Supermemory](https://supermemory.ai) | `SUPERMEMORY_API_KEY` |

### 自托管 Firecrawl

默认情况下，Hermes 使用 [Firecrawl cloud API](https://firecrawl.dev/) 进行网络搜索和爬取。如果您希望本地运行 Firecrawl，可以将其指向一个自托管实例。请参阅 Firecrawl 的 [SELF_HOST.md](https://github.com/firecrawl/firecrawl/blob/main/SELF_HOST.md) 以获取完整的设置说明。

**您获得的是：** 无需 API 密钥，无速率限制，无按页面收费，完全的数据主权。

**您失去的是：** 云版本使用 Firecrawl 的专有“Fire-engine”来进行高级反机器人绕过（Cloudflare、CAPTCHA、IP 轮换）。自托管版使用基础的 fetch + Playwright，因此某些受保护的网站可能会失败。搜索使用的是 DuckDuckGo 而不是 Google。

**设置：**

1. 克隆并启动 Firecrawl Docker 堆栈（5 个容器：API, Playwright, Redis, RabbitMQ, PostgreSQL — 需要约 4-8 GB RAM）：
   ```bash
   git clone https://github.com/firecrawl/firecrawl
   cd firecrawl
   # 在 .env 中设置: USE_DB_AUTHENTICATION=false, HOST=0.0.0.0, PORT=3002
   docker compose up -d
   ```

2. 将 Hermes 指向您的实例（无需 API 密钥）：
   ```bash
   hermes config set FIRECRAWL_API_URL http://localhost:3002
   ```

如果您的自托管实例启用了身份验证，您也可以同时设置 `FIRECRAWL_API_KEY` 和 `FIRECRAWL_API_URL`。

## OpenRouter 提供商路由

在使用 OpenRouter 时，您可以控制请求如何在各个提供商之间进行路由。向 `~/.hermes/config.yaml` 添加一个 `provider_routing` 部分：

```yaml
provider_routing:
  sort: "throughput"          # "price" (默认), "throughput", 或 "latency"
  # only: ["anthropic"]      # 只使用这些提供商
  # ignore: ["deepinfra"]    # 跳过这些提供商
  # order: ["anthropic", "google"]  # 按此顺序尝试提供商
  # require_parameters: true  # 只使用支持所有请求参数的提供商
  # data_collection: "deny"   # 排除可能存储/训练数据的提供商
```

**快捷方式：** 在任何模型名称后追加 `:nitro` 以进行吞吐量排序（例如 `anthropic/claude-sonnet-4:nitro`），或追加 `:floor` 进行价格排序。

## OpenRouter Pareto 代码路由器

OpenRouter 提供了一个实验性的代码模型路由器 `openrouter/pareto-code`，它可以自动将请求路由到满足特定代码质量标准（由 [Artificial Analysis](https://artificialanalysis.ai/) 排名）的最便宜模型。选择此模型并调整 `~/.hermes/config.yaml` 中的 `min_coding_score` 滑钮：

```yaml
model:
  provider: openrouter
  model: openrouter/pareto-code

openrouter:
  min_coding_score: 0.65   # 0.0–1.0；越高 = 代码能力越强（成本更高）。默认值 0.65。
```

注意事项：

- `min_coding_score` **仅**在 `model.model` 为 `openrouter/pareto-code` 时才发送。对于其他模型，该值无效。
- 设置为空字符串（或删除此行）以允许 OpenRouter 选择最强大的可用代码智能体——这是当插件块被省略时的文档化行为。
- 评分的选择是每日固定的，但实际选择的模型可能会随着 Pareto 前沿的移动而发生变化（新模型、基准更新）。
- 请参阅 OpenRouter 的 [Pareto Router 文档](https://openrouter.ai/docs/guides/routing/routers/pareto-router) 以了解完整的路由器行为。
- 如果您想将 Pareto Code 路由器用于特定的**辅助任务**（压缩、视觉等）而不是主智能体，请在相应任务下设置 `extra_body.plugins` — 请参阅 [Auxiliary Models → OpenRouter routing & Pareto Code for auxiliary tasks](/user-guide/configuration#openrouter-routing--pareto-code-for-auxiliary-tasks)。

## 回退提供商 (Fallback Providers)

配置一个备用提供商链，当主模型失败时（速率限制、服务器错误、身份验证失败），Hermes 将按顺序尝试这些提供商。规范格式是顶层的 `fallback_providers:` 列表：

```yaml
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
  - provider: anthropic
    model: claude-sonnet-4
    # base_url: http://localhost:8000/v1    # 可选，用于自定义端点
    # api_mode: chat_completions           # 可选覆盖设置
```

遗留的单对 `fallback_model:` 字典仍然被接受以保持向后兼容性：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

当激活时，回退机制会在会话中途更换模型和提供商，而不会丢失您的对话。链条是逐项尝试的；激活是每次会话的一次性操作。

支持的提供商包括：`openrouter`, `nous`, `novita`, `openai-codex`, `copilot`, `copilot-acp`, `anthropic`, `gemini`, `qwen-oauth`, `huggingface`, `zai`, `kimi-coding`, `kimi-coding-cn`, `minimax`, `minimax-cn`, `minimax-oauth`, `deepseek`, `nvidia`, `xai`, `xai-oauth`, `ollama-cloud`, `bedrock`, `azure-foundry`, `opencode-zen`, `opencode-go`, `kilocode`, `xiaomi`, `arcee`, `gmi`, `stepfun`, `lmstudio`, `alibaba`, `alibaba-coding-plan`, `tencent-tokenhub`, `custom`。

:::tip
回退功能只能通过 `config.yaml` 配置——或通过 `hermes fallback` 交互式配置。有关何时触发、链条如何推进以及它如何与辅助任务和委托交互的完整细节，请参阅 [Fallback Providers](/user-guide/features/fallback-providers)。
:::

---

## 参见

- [Configuration](/user-guide/configuration) — 通用配置（目录结构、配置优先级、终端后端、内存、压缩等）
- [Environment Variables](/reference/environment-variables) — 所有环境变量的完整参考