---
title: "AI 服务商"
sidebar_label: "AI 服务商"
sidebar_position: 1
---

# AI 服务商

本页内容涵盖如何为 Hermes 智能体设置推理服务商——从 OpenRouter 和 Anthropic 等云端 API，到 Ollama 和 vLLM 等自托管端点，以及高级路由和故障转移配置。您需要至少配置一个服务商才能使用 Hermes。

## 推理提供商

您至少需要一种连接到大语言模型的方式。使用 `hermes model` 命令交互式切换提供商和模型，或直接进行配置：

| 提供商 | 设置 |
|----------|-------|
| **Nous Portal** | `hermes model` (基于 OAuth，订阅制) |
| **OpenAI Codex** | `hermes model` (使用 ChatGPT OAuth，采用 Codex 模型) |
| **GitHub Copilot** | `hermes model` (OAuth 设备码流程，`COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 或 `gh auth token`) |
| **GitHub Copilot ACP** | `hermes model` (启动本地 `copilot --acp --stdio`) |
| **Anthropic** | `hermes model` (通过 OAuth 使用 Claude Max 及额外额度；也支持 Anthropic API 密钥或手动设置令牌——参见下方说明) |
| **OpenRouter** | 在 `~/.hermes/.env` 中设置 `OPENROUTER_API_KEY` |
| **NovitaAI** | 在 `~/.hermes/.env` 中设置 `NOVITA_API_KEY` (提供商：`novita`，200+ 模型，模型 API，智能体沙箱，GPU 云) |
| **AI Gateway** | 在 `~/.hermes/.env` 中设置 `AI_GATEWAY_API_KEY` (提供商：`ai-gateway`) |
| **z.ai / GLM** | 在 `~/.hermes/.env` 中设置 `GLM_API_KEY` (提供商：`zai`) |
| **Kimi / Moonshot** | 在 `~/.hermes/.env` 中设置 `KIMI_API_KEY` (提供商：`kimi-coding`) |
| **Kimi / Moonshot (中国)** | 在 `~/.hermes/.env` 中设置 `KIMI_CN_API_KEY` (提供商：`kimi-coding-cn`；别名：`kimi-cn`、`moonshot-cn`) |
| **Arcee AI** | 在 `~/.hermes/.env` 中设置 `ARCEEAI_API_KEY` (提供商：`arcee`；别名：`arcee-ai`、`arceeai`) |
| **GMI Cloud** | 在 `~/.hermes/.env` 中设置 `GMI_API_KEY` (提供商：`gmi`；别名：`gmi-cloud`、`gmicloud`) |
| **MiniMax** | 在 `~/.hermes/.env` 中设置 `MINIMAX_API_KEY` (提供商：`minimax`) |
| **MiniMax 中国** | 在 `~/.hermes/.env` 中设置 `MINIMAX_CN_API_KEY` (提供商：`minimax-cn`) |
| **xAI (Grok) — 响应式 API** | 在 `~/.hermes/.env` 中设置 `XAI_API_KEY` (提供商：`xai`) |
| **xAI Grok OAuth (SuperGrok)** | `hermes model` → “xAI Grok OAuth (SuperGrok / Premium+)”——浏览器登录，无需 API 密钥。参见[指南](../guides/xai-grok-oauth.md) |
| **通义千问云 (阿里云 DashScope)** | 在 `~/.hermes/.env` 中设置 `DASHSCOPE_API_KEY` (提供商：`alibaba`) |
| **阿里云 (编程版)** | `DASHSCOPE_API_KEY` (提供商：`alibaba-coding-plan`，别名：`alibaba_coding`)——独立的计费 SKU，不同端点 |
| **Kilo Code** | 在 `~/.hermes/.env` 中设置 `KILOCODE_API_KEY` (提供商：`kilocode`) |
| **小米 MiMo** | 在 `~/.hermes/.env` 中设置 `XIAOMI_API_KEY` (提供商：`xiaomi`，别名：`mimo`、`xiaomi-mimo`) |
| **腾讯 TokenHub** | 在 `~/.hermes/.env` 中设置 `TOKENHUB_API_KEY` (提供商：`tencent-tokenhub`，别名：`tencent`、`tokenhub`、`tencentmaas`) |
| **OpenCode Zen** | 在 `~/.hermes/.env` 中设置 `OPENCODE_ZEN_API_KEY` (提供商：`opencode-zen`) |
| **OpenCode Go** | 在 `~/.hermes/.env` 中设置 `OPENCODE_GO_API_KEY` (提供商：`opencode-go`) |
| **DeepSeek** | 在 `~/.hermes/.env` 中设置 `DEEPSEEK_API_KEY` (提供商：`deepseek`) |
| **Hugging Face** | 在 `~/.hermes/.env` 中设置 `HF_TOKEN` (提供商：`huggingface`，别名：`hf`) |
| **Google / Gemini** | 在 `~/.hermes/.env` 中设置 `GOOGLE_API_KEY` (或 `GEMINI_API_KEY`) (提供商：`gemini`) |
| **Google Gemini (OAuth)** | `hermes model` → “Google Gemini (OAuth)” (提供商：`google-gemini-cli`，支持免费层级，浏览器 PKCE 登录) |
| **LM Studio** | `hermes model` → “LM Studio” (提供商：`lmstudio`，可选 `LM_API_KEY`) |
| **自定义端点** | `hermes model` → 选择 “自定义端点” (保存在 `config.yaml` 中) |

关于官方 API 密钥路径，请参阅专门的 [Google Gemini 指南](/guides/google-gemini)。

:::tip 模型密钥别名
在 `model:` 配置节中，您可以使用 `default:` 或 `model:` 作为模型 ID 的键名。`model: { default: my-model }` 和 `model: { model: my-model }` 两者效果完全相同。
:::


### Nous Portal

[Nous Portal](https://portal.nousresearch.com) 是 Nous Research 的统一订阅门户，也是**运行 Hermes 智能体的推荐方式**。一次 OAuth 登录即可涵盖 300+ 前沿智能体模型（Claude、GPT、Gemini、DeepSeek、Qwen、Kimi、GLM、MiniMax、Grok...），外加 [工具网关](/user-guide/features/tool-gateway)（网络搜索、图像生成、TTS、浏览器自动化）以及 [Nous Chat](https://chat.nousresearch.com)——所有费用从您的 Nous 订阅中扣除，无需为各个提供商单独计费。

```bash
hermes setup --portal     # 全新安装——一条命令完成 OAuth + 提供商 + 网关设置
hermes model              # 已有安装——从列表中选择 “Nous Portal”
hermes portal status      # 随时检查登录状态和路由信息
```

还没有订阅？请在 [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription) 获取。

**完整详情：** 请参阅专门的 [Nous Portal 集成页面](/integrations/nous-portal)（订阅包含内容、模型目录、故障排除）以及分步指南 [使用 Nous Portal 运行 Hermes 智能体](/guides/run-hermes-with-nous-portal)。


:::info Codex 注意事项
OpenAI Codex 提供商通过设备码进行身份验证（打开一个 URL，输入一个代码）。Hermes 将生成的凭据存储在自己的认证存储中，路径为 `~/.hermes/auth.json`，并且可以在存在时从 `~/.codex/auth.json` 导入现有的 Codex CLI 凭据。无需安装 Codex CLI。

如果令牌刷新出现终端错误（HTTP 4xx、`invalid_grant`、授权被撤销等），Hermes 会将刷新令牌标记为失效，并停止重放它，这样您就不会看到一连串相同的认证失败消息。下一次请求会显示一条类型化的重新认证消息。运行 `hermes auth add codex-oauth`（或 `hermes model` → OpenAI Codex）以启动新的设备码登录；隔离状态会在下一次成功交换后清除。
:::

:::warning
即使使用 Nous Portal、Codex 或自定义端点，某些工具（视觉、网页摘要、MoA）仍使用单独的“辅助”模型。默认情况下（`auxiliary.*.provider: “auto”`），Hermes 会将这些任务路由到您的**主聊天模型**——即您在 `hermes model` 中选择的模型。您可以单独覆盖每个任务，将其路由到更便宜/更快的模型（例如 OpenRouter 上的 Gemini Flash）——参见[辅助模型](/user-guide/configuration#auxiliary-models)。
:::

:::tip Nous 工具网关
付费的 Nous Portal 订阅者还可以访问 **[工具网关](/user-guide/features/tool-gateway)**——通过您的订阅路由网络搜索、图像生成、TTS 和浏览器自动化。无需额外 API 密钥。对于全新安装，`hermes setup --portal` 会一次性完成登录、设置 Nous 为提供商并启用网关。现有用户可以从 `hermes model` 或通过 `hermes tools` 单独启用。随时使用 `hermes portal status` 检查路由状态。
:::


### 模型管理的两条命令

Hermes 有**两条**用途不同的模型命令：

| 命令 | 运行位置 | 功能 |
|---------|-------------|--------------|
| **`hermes model`** | 您的终端（在任何会话之外） | 完整的设置向导——添加提供商、运行 OAuth、输入 API 密钥、配置端点 |
| **`/model`** | 在 Hermes 聊天会话内 | 在**已配置的**提供商和模型之间快速切换 |

如果您尝试切换到尚未设置的提供商（例如您只配置了 OpenRouter 想使用 Anthropic），则需要使用 `hermes model`，而不是 `/model`。首先退出您的会话（`Ctrl+C` 或 `/quit`），运行 `hermes model`，完成提供商设置，然后开始新的会话。


### Anthropic (原生)

直接通过 Anthropic API 使用 Claude 模型——无需 OpenRouter 代理。支持三种认证方式：

:::caution 需要 Claude Max 的“额外使用额度”
当您通过 `hermes model` → Anthropic OAuth（或通过 `hermes auth add anthropic --type oauth`）进行身份验证时，Hermes 会将请求作为 Claude Code 路由到您的 Anthropic 账户。**仅当您拥有 Claude Max 套餐并已购买额外使用额度时才有效。** 基础 Max 套餐配额（默认包含在 Claude Code 中的使用量）不会被 Hermes 消耗——只有您额外添加的额外/超额额度才会被消耗。Claude Pro 订阅用户无法使用此路径。

如果您没有 Max + 额外额度，请改用 `ANTHROPIC_API_KEY`——请求将按令牌计费，从该密钥所属组织扣除（标准 API 定价，独立于任何 Claude 订阅）。
:::

```bash
# 使用 API 密钥 (按令牌计费)
export ANTHROPIC_API_KEY=***
hermes chat --provider anthropic --model claude-sonnet-4-6

# 推荐方式：通过 `hermes model` 进行身份验证
# 当可用时，Hermes 会直接使用 Claude Code 的凭据存储
hermes model

# 使用设置令牌进行手动覆盖（后备 / 旧版方式）
export ANTHROPIC_TOKEN=***  # 设置令牌或手动 OAuth 令牌
hermes chat --provider anthropic

# 自动检测 Claude Code 凭据（如果您已在使用 Claude Code）
hermes chat --provider anthropic  # 自动读取 Claude Code 凭据文件
```

当您通过 `hermes model` 选择 Anthropic OAuth 时，Hermes 会优先使用 Claude Code 自己的凭据存储，而不是将令牌复制到 `~/.hermes/.env`。这样可以保持可刷新的 Claude 凭据处于可刷新状态。

或者永久设置：
```yaml
model:
  provider: "anthropic"
  default: "claude-sonnet-4-6"
```

:::tip 别名
`--provider claude` 和 `--provider claude-code` 也可以作为 `--provider anthropic` 的简写形式。
:::


### GitHub Copilot

Hermes 将 GitHub Copilot 作为一等提供商，并支持两种模式：

**`copilot` —— 直接 Copilot API**（推荐）。使用您的 GitHub Copilot 订阅，通过 Copilot API 访问 GPT-5.x、Claude、Gemini 和其他模型。

```bash
hermes chat --provider copilot --model gpt-5.4
```

**认证选项**（按此顺序检查）：

1. `COPILOT_GITHUB_TOKEN` 环境变量
2. `GH_TOKEN` 环境变量
3. `GITHUB_TOKEN` 环境变量
4. `gh auth token` CLI 回退

如果未找到令牌，`hermes model` 会提供**OAuth 设备码登录**——与 Copilot CLI 和 opencode 使用的流程相同。

:::warning 令牌类型
Copilot API **不**支持经典个人访问令牌 (`ghp_*`)。支持的令牌类型：

| 类型 | 前缀 | 如何获取 |
|------|--------|------------|
| OAuth 令牌 | `gho_` | `hermes model` → GitHub Copilot → 使用 GitHub 登录 |
| 细粒度 PAT | `github_pat_` | GitHub 设置 → 开发者设置 → 细粒度令牌（需要 **Copilot Requests** 权限） |
| GitHub 应用令牌 | `ghu_` | 通过 GitHub 应用安装获取 |

如果您的 `gh auth token` 返回 `ghp_*` 令牌，请改用 `hermes model` 通过 OAuth 进行身份验证。
:::

:::info Hermes 中的 Copilot 认证行为
Hermes 将支持的 GitHub 令牌（`gho_*`、`github_pat_*` 或 `ghu_*`）直接发送到 `api.githubcopilot.com`，并包含 Copilot 特定的头信息（`Editor-Version`、`Copilot-Integration-Id`、`Openai-Intent`、`x-initiator`）。

当收到 HTTP 401 错误时，Hermes 现在会执行一次性的凭据恢复，然后再回退：

1. 通过正常的优先级链重新解析令牌（`COPILOT_GITHUB_TOKEN` → `GH_TOKEN` → `GITHUB_TOKEN` → `gh auth token`）
2. 使用刷新的头信息重建共享的 OpenAI 客户端
3. 重试请求一次

一些较旧的社区代理使用 `api.github.com/copilot_internal/v2/token` 交换流程。该端点对于某些账户类型可能不可用（返回 404）。因此，Hermes 保持直接令牌认证作为主要路径，并依赖运行时凭据刷新 + 重试来保证稳健性。
:::

**API 路由**：GPT-5+ 模型（除了 `gpt-5-mini`）自动使用响应式 API。所有其他模型（GPT-4o、Claude、Gemini 等）使用聊天补全 API。模型从实时的 Copilot 目录中自动检测。

**`copilot-acp` —— Copilot ACP 智能体后端**。将本地 Copilot CLI 作为子进程启动：

```bash
hermes chat --provider copilot-acp --model copilot-acp
# 需要 PATH 中有 GitHub Copilot CLI，并且存在一个现有的 `copilot login` 会话
```

**永久配置：**
```yaml
model:
  provider: "copilot"
  default: "gpt-5.4"
```

| 环境变量 | 描述 |
|---------------------|-------------|
| `COPILOT_GITHUB_TOKEN` | 用于 Copilot API 的 GitHub 令牌（最高优先级） |
| `HERMES_COPILOT_ACP_COMMAND` | 覆盖 Copilot CLI 二进制文件路径（默认：`copilot`） |
| `HERMES_COPILOT_ACP_ARGS` | 覆盖 ACP 参数（默认：`--acp --stdio`） |


### 一等 API 密钥提供商

这些提供商具有内置支持，拥有专用的提供商 ID。设置 API 密钥并使用 `--provider` 来选择：

```bash
# NovitaAI 模型 API
hermes chat --provider novita --model moonshotai/kimi-k2.5
# 需要：在 ~/.hermes/.env 中设置 NOVITA_API_KEY

# z.ai / 智谱 AI GLM
hermes chat --provider zai --model glm-5
# 需要：在 ~/.hermes/.env 中设置 GLM_API_KEY

# Kimi / Moonshot AI (国际版: api.moonshot.ai)
hermes chat --provider kimi-coding --model kimi-for-coding
# 需要：在 ~/.hermes/.env 中设置 KIMI_API_KEY

# Kimi / Moonshot AI (中国版: api.moonshot.cn)
hermes chat --provider kimi-coding-cn --model kimi-k2.5
# 需要：在 ~/.hermes/.env 中设置 KIMI_CN_API_KEY

# MiniMax (全球端点)
hermes chat --provider minimax --model MiniMax-M2.7
# 需要：在 ~/.hermes/.env 中设置 MINIMAX_API_KEY

# MiniMax (中国端点)
hermes chat --provider minimax-cn --model MiniMax-M2.7
# 需要：在 ~/.hermes/.env 中设置 MINIMAX_CN_API_KEY

# 通义千问云 / DashScope (通义千问模型)
hermes chat --provider alibaba --model qwen3.5-plus
# 需要：在 ~/.hermes/.env 中设置 DASHSCOPE_API_KEY

# 小米 MiMo
hermes chat --provider xiaomi --model mimo-v2-pro
# 需要：在 ~/.hermes/.env 中设置 XIAOMI_API_KEY

# 腾讯 TokenHub (Hy3 预览版)
hermes chat --provider tencent-tokenhub --model hy3-preview
# 需要：在 ~/.hermes/.env 中设置 TOKENHUB_API_KEY

# Arcee AI (Trinity 模型)
hermes chat --provider arcee --model trinity-large-thinking
# 需要：在 ~/.hermes/.env 中设置 ARCEEAI_API_KEY

# GMI Cloud
# 使用 GMI 的 /v1/models 端点返回的精确模型 ID。
hermes chat --provider gmi --model zai-org/GLM-5.1-FP8
# 需要：在 ~/.hermes/.env 中设置 GMI_API_KEY
```

或者在 `config.yaml` 中永久设置提供商：
```yaml
model:
  provider: "gmi"
  default: "zai-org/GLM-5.1-FP8"
```

基础 URL 可以通过 `NOVITA_BASE_URL`、`GLM_BASE_URL`、`KIMI_BASE_URL`、`MINIMAX_BASE_URL`、`MINIMAX_CN_BASE_URL`、`DASHSCOPE_BASE_URL`、`XIAOMI_BASE_URL`、`GMI_BASE_URL` 或 `TOKENHUB_BASE_URL` 环境变量进行覆盖。

:::note Z.AI 端点自动检测
当使用 Z.AI / GLM 提供商时，Hermes 会自动探测多个端点（全球、中国、编码变体），以找到一个接受您 API 密钥的端点。您无需手动设置 `GLM_BASE_URL`——有效的端点会被自动检测并缓存。
:::


### xAI (Grok) — 响应式 API + 提示缓存

xAI 通过响应式 API（`codex_responses` 传输方式）接入，以支持 Grok 4 模型的自动推理功能——无需 `reasoning_effort` 参数，默认启用服务器端推理。在 `~/.hermes/.env` 中设置 `XAI_API_KEY` 并在 `hermes model` 中选择 xAI，或者将 `grok` 作为快捷方式放入 `/model grok-4-fast-reasoning`。

SuperGrok 和 X Premium+ 订阅者可以使用浏览器 OAuth 登录，而不是使用 API 密钥——在 `hermes model` 中选择 **xAI Grok OAuth (SuperGrok / Premium+)**，或运行 `hermes auth add xai-oauth`。相同的 OAuth 承载令牌会被直接调用 xAI 的工具（TTS、图像生成、视频生成、转录）自动复用。参见 [xAI Grok OAuth 指南](../guides/xai-grok-oauth.md) 了解完整流程——如果 Hermes 运行在远程主机上，还需参见 [SSH / 远程主机上的 OAuth](../guides/oauth-over-ssh.md) 以设置所需的 `ssh -L` 隧道。

当使用 xAI 作为提供商（任何包含 `x.ai` 的基础 URL）时，Hermes 会自动启用提示缓存，在每次 API 请求中发送 `x-grok-conv-id` 头。这会将请求路由到同一对话会话内的同一服务器，允许 xAI 的基础架构重用缓存的系统提示和对话历史。

无需配置——当检测到 xAI 端点且会话 ID 可用时，缓存自动激活。这降低了多轮对话的延迟和成本。

xAI 还提供专用的 TTS 端点 (`/v1/tts`)。在 `hermes tools` → 语音与 TTS 中选择 **xAI TTS**，或参见[语音与 TTS](../user-guide/features/tts.md#text-to-speech) 页面进行配置。


### NovitaAI

[NovitaAI](https://novita.ai) 是面向构建者和智能体的 AI 原生云。其三条产品线是：用于 200+ 模型的模型 API，用于构建和运行 AI 智能体的智能体沙箱，以及用于可扩展计算的 GPU 云，所有服务均来自同一平台。

```bash
# 使用任何可用的模型
hermes chat --provider novita --model moonshotai/kimi-k2.5
# 需要：在 ~/.hermes/.env 中设置 NOVITA_API_KEY

# 短别名
hermes chat --provider novita-ai --model deepseek/deepseek-v3-0324
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "novita"
  default: "moonshotai/kimi-k2.5"
  base_url: "https://api.novita.ai/openai/v1"
```

在 [novita.ai/settings/key-management](https://novita.ai/settings/key-management) 获取您的 API 密钥。基础 URL 可以通过 `NOVITA_BASE_URL` 覆盖。


### Ollama Cloud — 托管 Ollama 模型，OAuth + API 密钥

[Ollama Cloud](https://ollama.com/cloud) 托管与本地 Ollama 相同的开源模型目录，但无需 GPU 要求。在 `hermes model` 中选择它作为 **Ollama Cloud**，粘贴您从 [ollama.com/settings/keys](https://ollama.com/settings/keys) 获取的 API 密钥，Hermes 会自动发现可用的模型。

```bash
hermes model
# → 选择 “Ollama Cloud”
# → 粘贴您的 OLLAMA_API_KEY
# → 从发现的模型中选择 (gpt-oss:120b, glm-4.6:cloud, qwen3-coder:480b-cloud, 等)
```

或者直接编辑 `config.yaml`：
```yaml
model:
  provider: "ollama-cloud"
  default: "gpt-oss:120b"
```

模型目录从 `ollama.com/v1/models` 动态获取，并缓存一小时。`model:tag` 标记法（例如 `qwen3-coder:480b-cloud`）在标准化过程中会保留——请勿使用连字符。

:::tip Ollama Cloud 与本地 Ollama
两者都使用相同的 OpenAI 兼容 API。云是一等提供商（`--provider ollama-cloud`，`OLLAMA_API_KEY`）；本地 Ollama 通过自定义端点流程访问（基础 URL `http://localhost:11434/v1`，无密钥）。对于本地无法运行的大型模型使用云；为隐私或离线工作使用本地。
:::


### AWS Bedrock

通过 AWS Bedrock 访问 Anthropic Claude、Amazon Nova、DeepSeek v3.2、Meta Llama 4 和其他模型。使用 AWS SDK (`boto3`) 凭据链——无需 API 密钥，只需标准的 AWS 认证。

```bash
# 最简单——使用 ~/.aws/credentials 中的命名配置文件
hermes chat --provider bedrock --model us.anthropic.claude-sonnet-4-6

# 或使用显式环境变量
AWS_PROFILE=myprofile AWS_REGION=us-east-1 hermes chat --provider bedrock --model us.anthropic.claude-sonnet-4-6
```

或在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "bedrock"
  default: "us.anthropic.claude-sonnet-4-6"
bedrock:
  region: "us-east-1"          # 或设置 AWS_REGION
  # profile: "myprofile"       # 或设置 AWS_PROFILE
  # discovery: true            # 从 IAM 自动发现区域
  # guardrail:                 # 可选的 Bedrock 护栏
  #   guardrail_identifier: "your-guardrail-id"
  #   guardrail_version: "DRAFT"
```

认证使用标准的 boto3 链：显式的 `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`、来自 `~/.aws/credentials` 的 `AWS_PROFILE`、EC2/ECS/Lambda 上的 IAM 角色、IMDS 或 SSO。如果您已使用 AWS CLI 进行了认证，则无需设置任何环境变量。

Bedrock 底层使用 **Converse API**——请求被转换为 Bedrock 与模型无关的格式，因此相同的配置适用于 Claude、Nova、DeepSeek 和 Llama 模型。仅当您调用非默认的区域端点时才需要设置 `BEDROCK_BASE_URL`。

参见 [AWS Bedrock 指南](/guides/aws-bedrock)，了解 IAM 设置、区域选择和跨区域推理的演练。


### 通义千问门户 (OAuth)

阿里巴巴的通义千问门户支持基于浏览器的 OAuth 登录。在 `hermes model` 中选择 **Qwen OAuth (Portal)**，通过浏览器登录，Hermes 会保存刷新令牌。

```bash
hermes model
# → 选择 “Qwen OAuth (Portal)”
# → 浏览器打开；使用您的阿里巴巴账户登录
# → 确认——凭据保存到 ~/.hermes/auth.json

hermes chat   # 使用 portal.qwen.ai/v1 端点
```

或配置 `config.yaml`：
```yaml
model:
  provider: "qwen-oauth"
  default: "qwen3-coder-plus"
```

仅当门户端点迁移时才需要设置 `HERMES_QWEN_BASE_URL`（默认：`https://portal.qwen.ai/v1`）。

:::tip Qwen OAuth 与 Qwen Cloud (阿里云 DashScope)
`qwen-oauth` 使用面向消费者的通义千问门户，通过 OAuth 登录——适合个人用户。`alibaba` 提供商使用 Qwen Cloud (阿里云 DashScope) 和 `DASHSCOPE_API_KEY`——适合编程/生产工作负载。两者都路由到通义千问系列模型，但位于不同的端点。
:::


### 阿里云 (编程版)

如果您订阅了阿里巴巴的**编程版**（独立于标准 DashScope API 访问的定价 SKU），Hermes 将其作为独立的一等提供商暴露：`alibaba-coding-plan`。端点：`https://coding-intl.dashscope.aliyuncs.com/v1`。它与常规 `alibaba` 提供商一样是 OpenAI 兼容的，但具有不同的基础 URL 和计费面。

```yaml
model:
  provider: alibaba_coding     # alibaba-coding-plan 的别名
  model: qwen3-coder-plus
```

或从 CLI：

```bash
hermes chat --provider alibaba_coding --model qwen3-coder-plus
```

`alibaba_coding` 使用您的 `alibaba` 条目已经使用的相同 `DASHSCOPE_API_KEY`——无需单独的密钥，只是路由目标不同。在此提供商注册之前，在 `config.yaml` 中设置 `provider: alibaba_coding` 的用户会静默地回退到 OpenRouter 路由。


### MiniMax (OAuth)

通过浏览器 OAuth 登录使用 MiniMax-M2.7——无需 API 密钥。在 `hermes model` 中选择 **MiniMax (OAuth)**，通过浏览器登录，Hermes 会保存访问令牌和刷新令牌。底层使用 Anthropic Messages 兼容端点 (`/anthropic`)。

```bash
hermes model
# → 选择 “MiniMax (OAuth)”
# → 浏览器打开；使用您的 MiniMax 账户登录（全球或中国区域）
# → 确认——凭据保存到 ~/.hermes/auth.json

hermes chat   # 使用 api.minimax.io/anthropic 端点
```

或配置 `config.yaml`：
```yaml
model:
  provider: "minimax-oauth"
  default: "MiniMax-M2.7"
```

支持的模型：`MiniMax-M2.7`（主模型）和 `MiniMax-M2.7-highspeed`（作为默认辅助模型接入）。OAuth 路径会忽略 `MINIMAX_API_KEY` / `MINIMAX_BASE_URL`。

:::tip MiniMax OAuth 与 API 密钥
`minimax-oauth` 使用 MiniMax 面向消费者的门户，通过 OAuth 登录——无需计费设置。`minimax` 和 `minimax-cn` 提供商使用 `MINIMAX_API_KEY` / `MINIMAX_CN_API_KEY`——用于编程访问。参见 [MiniMax OAuth 指南](/guides/minimax-oauth) 了解完整流程。
:::


### NVIDIA NIM

通过 [build.nvidia.com](https://build.nvidia.com)（免费 API 密钥）或本地 NIM 端点访问 Nemotron 和其他开源模型。

```bash
# 云 (build.nvidia.com)
hermes chat --provider nvidia --model nvidia/nemotron-3-super-120b-a12b
# 需要：在 ~/.hermes/.env 中设置 NVIDIA_API_KEY

# 本地 NIM 端点——覆盖基础 URL
NVIDIA_BASE_URL=http://localhost:8000/v1 hermes chat --provider nvidia --model nvidia/nemotron-3-super-120b-a12b
```

或在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "nvidia"
  default: "nvidia/nemotron-3-super-120b-a12b"
```

:::tip 本地 NIM
对于本地部署（DGX Spark、本地 GPU），设置 `NVIDIA_BASE_URL=http://localhost:8000/v1`。NIM 暴露与 build.nvidia.com 相同的 OpenAI 兼容聊天补全 API，因此在云和本地之间切换只需更改一行环境变量。
:::

Hermes 会自动在向 `build.nvidia.com` 发出的每个请求中附加 NIM 计费来源头——无需配置。这会将消耗量路由到 NVIDIA 计费仪表板中正确的来源。


### GMI Cloud

通过 [GMI Cloud](https://www.gmicloud.ai/) 访问开源和推理模型——OpenAI 兼容 API，API 密钥认证。

```bash
# GMI Cloud
hermes chat --provider gmi --model deepseek-ai/DeepSeek-R1
# 需要：在 ~/.hermes/.env 中设置 GMI_API_KEY
```

或在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "gmi"
  default: "deepseek-ai/DeepSeek-R1"
```

基础 URL 可以通过 `GMI_BASE_URL` 覆盖（默认：`https://api.gmi-serving.com/v1`）。


### StepFun

通过 [StepFun](https://platform.stepfun.com) 访问 Step 系列模型——OpenAI 兼容 API，API 密钥认证。

```bash
# StepFun
hermes chat --provider stepfun --model step-3-mini
# 需要：在 ~/.hermes/.env 中设置 STEPFUN_API_KEY
```

或在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "stepfun"
  default: "step-3-mini"
```

基础 URL 可以通过 `STEPFUN_BASE_URL` 覆盖（默认：`https://api.stepfun.com/v1`）。


### Hugging Face 推理提供商

[Hugging Face 推理提供商](https://huggingface.co/docs/inference-providers) 通过统一的 OpenAI 兼容端点 (`router.huggingface.co/v1`) 路由到 20+ 个开源模型。请求会自动路由到最快可用的后端（Groq、Together、SambaNova 等），并支持自动故障转移。

```bash
# 使用任何可用的模型
hermes chat --provider huggingface --model Qwen/Qwen3-235B-A22B-Thinking-2507
# 需要：在 ~/.hermes/.env 中设置 HF_TOKEN

# 短别名
hermes chat --provider hf --model deepseek-ai/DeepSeek-V3.2
```

或在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "huggingface"
  default: "Qwen/Qwen3-235B-A22B-Thinking-2507"
```

在 [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) 获取您的令牌——确保启用 “Make calls to Inference Providers” 权限。免费层级包含在内（每月 $0.10 额度，提供商费率无加价）。

您可以在模型名称后附加路由后缀：`:fastest`（默认）、`:cheapest` 或 `:provider_name` 以强制使用特定后端。

基础 URL 可以通过 `HF_BASE_URL` 覆盖。


### 通过 OAuth 使用 Google Gemini (`google-gemini-cli`)

`google-gemini-cli` 提供商使用 Google 的 Cloud Code Assist 后端——与 Google 自己的 `gemini-cli` 工具使用的 API 相同。这支持**免费层级**（个人账户的慷慨每日配额）和**付费层级**（通过 GCP 项目的标准版/企业版）。

**快速开始：**

```bash
hermes model
# → 选择 “Google Gemini (OAuth)”
# → 看到策略警告，确认
# → 浏览器打开至 accounts.google.com，登录
# → 完成——Hermes 在首次请求时自动配置您的免费层级
```

Hermes 默认附带 Google 的**公共** `gemini-cli` 桌面 OAuth 客户端——与 Google 在其开源 `gemini-cli` 中包含的凭据相同。桌面 OAuth 客户端不是机密的（PKCE 提供安全性）。您无需安装 `gemini-cli` 或注册自己的 GCP OAuth 客户端。

**认证工作原理：**
- 针对 `accounts.google.com` 的 PKCE 授权码流程
- 浏览器回调地址为 `http://127.0.0.1:8085/oauth2callback`（如果端口繁忙，则回退到临时端口）
- 令牌存储在 `~/.hermes/auth/google_oauth.json`（权限 0600，原子写入，跨进程 `fcntl` 锁）
- 到期前 60 秒自动刷新
- 无头环境（SSH、`HERMES_HEADLESS=1`）→ 回退到粘贴模式
- 飞行中刷新去重——两个并发请求不会触发双重刷新
- `invalid_grant`（刷新令牌被撤销）→ 凭据文件被清除，提示用户重新登录

**推理工作原理：**
- 流量指向 `https://cloudcode-pa.googleapis.com/v1internal:generateContent`
  （或用于流式传输的 `:streamGenerateContent?alt=sse`），而非付费的 `v1beta/openai` 端点
- 请求体包装为 `{project, model, user_prompt_id, request}`
- OpenAI 格式的 `messages[]`、`tools[]`、`tool_choice` 被转换为 Gemini 原生的
  `contents[]`、`tools[].functionDeclarations`、`toolConfig` 格式
- 响应被转换回 OpenAI 格式，以便 Hermes 其余部分正常工作

**层级与项目 ID：**

| 您的情况 | 需要做什么 |
|---|---|
| 个人 Google 账户，想用免费层级 | 无需操作——登录，开始聊天 |
| Workspace / 标准版 / 企业版账户 | 将 `HERMES_GEMINI_PROJECT_ID` 或 `GOOGLE_CLOUD_PROJECT` 设置为您的 GCP 项目 ID |
| VPC-SC 保护的组织 | Hermes 检测到 `SECURITY_POLICY_VIOLATED` 并自动强制使用 `standard-tier` |

免费层级在首次使用时会自动配置一个 Google 管理的项目。无需 GCP 设置。

**配额监控：**

```
/gquota
```

显示每个模型的剩余 Code Assist 配额及进度条：

```
Gemini Code Assist 配额  (项目: 123-abc)

  gemini-2.5-pro                      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░   85%
  gemini-2.5-flash [输入]            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░   92%
```

:::warning 策略风险
Google 认为将 Gemini CLI OAuth 客户端用于第三方软件是违反策略的。一些用户报告了账户限制。为获得最低风险的体验，请通过 `gemini` 提供商使用您自己的 API 密钥。Hermes 会显示预先警告，并在 OAuth 开始前要求明确确认。
:::

**自定义 OAuth 客户端（可选）：**

如果您希望注册自己的 Google OAuth 客户端——例如，将配额和同意范围限定在您自己的 GCP 项目内——请设置：

```bash
HERMES_GEMINI_CLIENT_ID=your-client.apps.googleusercontent.com
HERMES_GEMINI_CLIENT_SECRET=...   # 对于桌面客户端是可选的
```

在 [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) 注册一个**桌面应用** OAuth 客户端，并启用 Generative Language API。

## 自定义与自托管 LLM 提供商

Hermes 智能体可与**任何 OpenAI 兼容的 API 端点**协同工作。如果一个服务器实现了 `/v1/chat/completions` 接口，你就可以将 Hermes 指向它。这意味着你可以使用本地模型、GPU 推理服务器、多提供商路由或任何第三方 API。

### 通用设置

有三种方式来配置自定义端点：

**交互式设置（推荐）：**
```bash
hermes model
# 选择 "Custom endpoint (self-hosted / VLLM / etc.)"
# 输入：API 基础 URL、API 密钥、模型名称
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

:::warning 已弃用的环境变量
`.env` 中的 `OPENAI_BASE_URL` 和 `LLM_MODEL` **已被移除**。Hermes 的任何部分都不会读取它们 — `config.yaml` 是模型和端点配置的唯一真实来源。如果你的 `.env` 中有陈旧的条目，它们会在下次 `hermes setup` 或配置迁移时自动清除。请直接使用 `hermes model` 或编辑 `config.yaml`。
:::

两种方法都会持久化到 `config.yaml`，这是模型、提供商和基础 URL 的真实来源。

### 使用 `/model` 切换模型

:::warning hermes model 与 /model
**`hermes model`**（在你的终端运行，在任何聊天会话之外）是**完整的提供商设置向导**。用它来添加新提供商、运行 OAuth 流程、输入 API 密钥和配置自定义端点。

**`/model`**（在活跃的 Hermes 聊天会话内输入）只能**在你已设置的提供商和模型之间进行切换**。它无法添加新提供商、运行 OAuth 或提示输入 API 密钥。如果你只配置了一个提供商（例如 OpenRouter），`/model` 将只显示该提供商的模型。

**要添加新提供商：** 退出你的会话（`Ctrl+C` 或 `/quit`），运行 `hermes model`，设置新提供商，然后启动一个新会话。
:::

一旦你至少配置了一个自定义端点，就可以在会话中途切换模型：

```
/model custom:qwen-2.5          # 切换到你的自定义端点上的模型
/model custom                    # 从端点自动检测模型
/model openrouter:claude-sonnet-4 # 切换回云提供商
```

如果你配置了**命名的自定义提供商**（见下文），请使用三重语法：

```
/model custom:local:qwen-2.5    # 使用名为 "local" 的自定义提供商和 qwen-2.5 模型
/model custom:work:llama3       # 使用名为 "work" 的自定义提供商和 llama3 模型
```

切换提供商时，Hermes 会将基础 URL 和提供商持久化到配置中，这样更改在重启后依然保留。当从自定义端点切换回内置提供商时，陈旧的基础 URL 会被自动清除。

:::tip
`/model custom`（仅此，不带模型名）会查询你端点的 `/models` API，如果恰好加载了一个模型，则会自动选择它。适用于运行单个模型的本地服务器。
:::

以下内容都遵循相同模式 — 只需更改 URL、密钥和模型名称。

---

### Ollama — 本地模型，零配置

[Ollama](https://ollama.com/) 只需一个命令即可在本地运行开源权重模型。最适合：快速本地实验、隐私敏感工作、离线使用。通过 OpenAI 兼容的 API 支持工具调用。

```bash
# 安装并运行一个模型
ollama pull qwen2.5-coder:32b
ollama serve   # 在端口 11434 启动
```

然后配置 Hermes：

```bash
hermes model
# 选择 "Custom endpoint (self-hosted / VLLM / etc.)"
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
  context_length: 64000   # 参见下面的警告
```

:::caution Ollama 默认上下文长度非常短
Ollama 默认**不**使用你模型的完整上下文窗口。取决于你的 VRAM，默认值为：

| 可用 VRAM | 默认上下文 |
|----------------|----------------|
| 少于 24 GB | **4,096 tokens** |
| 24-48 GB | 32,768 tokens |
| 48+ GB | 256,000 tokens |

Hermes 智能体在使用工具时要求至少 **64,000 tokens** 的上下文。较小的窗口在启动时会被拒绝，因为系统提示、工具模式和工作会话状态需要足够的空间来支持可靠的多步工作流。

**如何增加它**（选择一种方式）：

```bash
# 选项 1：通过环境变量设置服务器范围（推荐）
OLLAMA_CONTEXT_LENGTH=64000 ollama serve

# 选项 2：对于 systemd 管理的 Ollama
sudo systemctl edit ollama.service
# 添加: Environment="OLLAMA_CONTEXT_LENGTH=64000"
# 然后: sudo systemctl daemon-reload && sudo systemctl restart ollama

# 选项 3：将其烘焙到自定义模型中（按模型持久化）
echo -e "FROM qwen2.5-coder:32b\nPARAMETER num_ctx 64000" > Modelfile
ollama create qwen2.5-coder-64k -f Modelfile
```

**你无法通过 OpenAI 兼容的 API 设置上下文长度**（`/v1/chat/completions`）。它必须在服务器端或通过 Modelfile 进行配置。这是将 Ollama 与 Hermes 等工具集成时最大的困惑来源。
:::

**验证你的上下文设置是否正确：**

```bash
ollama ps
# 查看 CONTEXT 列 — 它应该显示你配置的值
```

:::tip
使用 `ollama list` 列出可用模型。使用 `ollama pull <model>` 从 [Ollama 库](https://ollama.com/library) 拉取任何模型。Ollama 会自动处理 GPU 卸载 — 大多数配置无需任何额外设置。
:::

---

### vLLM — 高性能 GPU 推理

[vLLM](https://docs.vllm.ai/) 是生产级 LLM 服务的标准。最适合：在 GPU 硬件上实现最大吞吐量、服务大型模型、连续批处理。

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
# 选择 "Custom endpoint (self-hosted / VLLM / etc.)"
# 输入 URL: http://localhost:8000/v1
# 跳过 API 密钥（或者如果你为 vLLM 配置了 --api-key，则输入密钥）
# 输入模型名称: meta-llama/Llama-3.1-70B-Instruct
```

**上下文长度：** vLLM 默认读取模型的 `max_position_embeddings`。如果该值超出了你的 GPU 内存，它会报错并要求你设置更低的 `--max-model-len`。你也可以使用 `--max-model-len auto` 来自动查找可用的最大值。设置 `--gpu-memory-utilization 0.95`（默认为 0.9）以将更多上下文压缩到 VRAM 中。

**工具调用需要显式标志：**

| 标志 | 目的 |
|------|---------|
| `--enable-auto-tool-choice` | `tool_choice: "auto"` 所必需（Hermes 中的默认值） |
| `--tool-call-parser <name>` | 模型工具调用格式的解析器 |

支持的解析器：`hermes`（Qwen 2.5, Hermes 2/3），`llama3_json`（Llama 3.x），`mistral`，`deepseek_v3`，`deepseek_v31`，`xlam`，`pythonic`。没有这些标志，工具调用将无法工作 — 模型会将工具调用输出为文本。

:::tip
vLLM 支持可读的大小格式：`--max-model-len 64k`（小写 k = 1000，大写 K = 1024）。
:::

---

### SGLang — 带有 RadixAttention 的快速服务

[SGLang](https://github.com/sgl-project/sglang) 是 vLLM 的替代方案，利用 RadixAttention 实现 KV 缓存重用。最适合：多轮对话（前缀缓存）、受限解码、结构化输出。

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
# 选择 "Custom endpoint (self-hosted / VLLM / etc.)"
# 输入 URL: http://localhost:30000/v1
# 输入模型名称: meta-llama/Llama-3.1-70B-Instruct
```

**上下文长度：** SGLang 默认从模型的配置中读取。使用 `--context-length` 进行覆盖。如果你需要超出模型声明的最大值，请设置 `SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1`。

**工具调用：** 使用 `--tool-call-parser` 并为你模型家族选择适当的解析器：`qwen`（Qwen 2.5），`llama3`，`llama4`，`deepseekv3`，`mistral`，`glm`。没有此标志，工具调用将以纯文本形式返回。

:::caution SGLang 默认最大输出 token 为 128
如果响应似乎被截断，请在请求中添加 `max_tokens` 或在服务器上设置 `--default-max-tokens`。如果未在请求中指定，SGLang 的默认响应 token 数仅为 128。
:::

---

### llama.cpp / llama-server — CPU 与 Metal 推理

[llama.cpp](https://github.com/ggml-org/llama.cpp) 可在 CPU、Apple Silicon (Metal) 和消费级 GPU 上运行量化模型。最适合：在没有数据中心 GPU 的情况下运行模型、Mac 用户、边缘部署。

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

**上下文长度 (`-c`)：** 最近的构建默认为 `0`，它会从 GGUF 元数据中读取模型的训练上下文。对于具有 128k+ 训练上下文的模型，尝试分配完整的 KV 缓存可能会导致内存不足。请为 Hermes 显式设置 `-c` 至少为 64,000 tokens。如果使用并行插槽 (`-np`)，总上下文将在插槽间分配 — 使用 `-c 64000 -np 4` 时，每个插槽只有 16k，这低于 Hermes 每个活跃会话的最低要求。

然后配置 Hermes 指向它：

```bash
hermes model
# 选择 "Custom endpoint (self-hosted / VLLM / etc.)"
# 输入 URL: http://localhost:8080/v1
# 跳过 API 密钥（本地服务器不需要）
# 输入模型名称 — 或者留空，如果只加载了一个模型则自动检测
```

这会将端点保存到 `config.yaml`，使其在会话间持久化。

:::caution `--jinja` 是工具调用所必需的
若不使用 `--jinja`，llama-server 会完全忽略 `tools` 参数。模型会尝试通过在响应文本中编写 JSON 来调用工具，但 Hermes 不会将其识别为工具调用——你会看到类似 `{"name": "web_search", ...}` 的原始 JSON 作为消息打印出来，而不是一个实际的搜索操作。

原生工具调用支持（最佳性能）：Llama 3.x、Qwen 2.5（包括 Coder）、Hermes 2/3、Mistral、DeepSeek、Functionary。所有其他模型将使用一个通用处理器，虽然也能工作，但效率可能较低。完整列表请参阅 [llama.cpp 函数调用文档](https://github.com/ggml-org/llama.cpp/blob/master/docs/function-calling.md)。

你可以通过检查 `http://localhost:8080/props` 来验证工具支持是否已激活——其中的 `chat_template` 字段应当存在。
:::

:::tip
从 [Hugging Face](https://huggingface.co/models?library=gguf) 下载 GGUF 模型。Q4_K_M 量化在质量与内存使用之间提供了最佳平衡。
:::

---

### LM Studio — 使用本地模型的桌面应用

[LM Studio](https://lmstudio.ai/) 是一个通过图形用户界面运行本地模型的桌面应用。最适合：偏好可视化界面、快速测试模型的用户，以及使用 macOS/Windows/Linux 的开发者。

从 LM Studio 应用（开发者标签页 → 启动服务器）启动服务器，或使用命令行：

```bash
lms server start                        # 在端口 1234 启动
lms load qwen2.5-coder --context-length 64000
```

然后配置 Hermes：

```bash
hermes model
# 选择 "LM Studio"
# 按回车使用 http://localhost:1234/v1
# 从发现的模型中选择一个
# 如果启用了 LM Studio 服务器认证，请在提示时输入 LM_API_KEY
```

Hermes 将自动加载一个具有 64K 上下文长度的 LM Studio 模型。

要在 LM Studio 中更改上下文长度：

1. 点击模型选择器旁边的齿轮图标。
2. 将 "Context Length"（上下文长度）设置为至少 64000 以获得流畅体验。
3. 重新加载模型以使更改生效。
4. 如果你的机器无法容纳 64000，考虑使用具有更大上下文长度的较小模型。

或者，使用命令行：`lms load model-name --context-length 64000`

你可以使用命令行来估算模型是否放得下：`lms load model-name --context-length 64000 --estimate-only`

要设置持久化的单模型默认值：我的模型标签页 → 模型上的齿轮图标 → 设置上下文大小。
:::

**工具调用：** 自 LM Studio 0.3.6 起支持。具有原生工具调用训练的模型（Qwen 2.5、Llama 3.x、Mistral、Hermes）会被自动检测，并显示工具徽章。其他模型使用通用的后备方案，可靠性可能较低。

---

### WSL2 网络（Windows 用户）

由于 Hermes 智能体需要 Unix 环境，Windows 用户需要在 WSL2 内运行它。如果你的模型服务器（Ollama、LM Studio 等）运行在 **Windows 宿主机** 上，你需要桥接网络间隙——WSL2 使用一个具有自己子网的虚拟网络适配器，因此 WSL2 内部的 `localhost` 指的是 Linux 虚拟机，**而不是** Windows 宿主机。

:::tip 都在 WSL2 内？没问题。
如果你的模型服务器也运行在 WSL2 内（vLLM、SGLang 和 llama-server 常见），`localhost` 会按预期工作——它们共享相同的网络命名空间。可以跳过此部分。
:::

#### 选项 1：镜像网络模式（推荐）

在 **Windows 11 22H2+** 上可用，镜像模式使 `localhost` 能在 Windows 和 WSL2 之间双向工作——这是最简单的修复方案。

1.  创建或编辑 `%USERPROFILE%\.wslconfig`（例如，`C:\Users\YourName\.wslconfig`）：
    ```ini
    [wsl2]
    networkingMode=mirrored
    ```

2.  从 PowerShell 重启 WSL：
    ```powershell
    wsl --shutdown
    ```

3.  重新打开你的 WSL2 终端。`localhost` 现在可以访问 Windows 服务了：
    ```bash
    curl http://localhost:11434/v1/models   # Windows 上的 Ollama — 可以工作
    ```

:::note Hyper-V 防火墙
在某些 Windows 11 版本上，Hyper-V 防火墙默认阻止镜像连接。如果启用镜像模式后 `localhost` 仍然无效，请在 **管理员 PowerShell** 中运行：
```powershell
Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow
```
:::

#### 选项 2：使用 Windows 宿主机 IP（Windows 10 / 旧版本）

如果无法使用镜像模式，可以在 WSL2 内部找到 Windows 宿主机 IP，并用它代替 `localhost`：

```bash
# 获取 Windows 宿主机 IP（WSL2 虚拟网络的默认网关）
ip route show | grep -i default | awk '{ print $3 }'
# 示例输出：172.29.192.1
```

在你的 Hermes 配置中使用该 IP：

```yaml
model:
  default: qwen2.5-coder:32b
  provider: custom
  base_url: http://172.29.192.1:11434/v1   # Windows 宿主机 IP，而非 localhost
```

:::tip 动态辅助脚本
宿主机 IP 可能在 WSL2 重启时改变。你可以在 shell 中动态获取它：
```bash
export WSL_HOST=$(ip route show | grep -i default | awk '{ print $3 }')
echo "Windows 主机位于: $WSL_HOST"
curl http://$WSL_HOST:11434/v1/models   # 测试 Ollama
```

或者使用你机器的 mDNS 名称（需要在 WSL2 中安装 `libnss-mdns`）：
```bash
sudo apt install libnss-mdns
curl http://$(hostname).local:11434/v1/models
```
:::

#### 服务器绑定地址（NAT 模式下必需）

如果你正在使用**选项 2**（使用宿主机 IP 的 NAT 模式），Windows 上的模型服务器必须接受来自 `127.0.0.1` 之外的连接。默认情况下，大多数服务器只监听 localhost——NAT 模式下来自 WSL2 的连接来自不同的虚拟子网，将被拒绝。在镜像模式下，`localhost` 直接映射，因此默认的 `127.0.0.1` 绑定工作正常。

| 服务器 | 默认绑定 | 如何修复 |
|--------|----------|----------|
| **Ollama** | `127.0.0.1` | 启动 Ollama 前设置环境变量 `OLLAMA_HOST=0.0.0.0`（Windows 上：系统设置 → 环境变量，或编辑 Ollama 服务） |
| **LM Studio** | `127.0.0.1` | 在开发者标签页 → 服务器设置中启用 **“在网络上提供服务”** |
| **llama-server** | `127.0.0.1` | 在启动命令中添加 `--host 0.0.0.0` |
| **vLLM** | `0.0.0.0` | 默认已绑定到所有网络接口 |
| **SGLang** | `127.0.0.1` | 在启动命令中添加 `--host 0.0.0.0` |

**Windows 上的 Ollama（详细说明）：** Ollama 作为 Windows 服务运行。要设置 `OLLAMA_HOST`：
1. 打开 **系统属性** → **环境变量**
2. 添加一个新的**系统变量**：`OLLAMA_HOST` = `0.0.0.0`
3. 重启 Ollama 服务（或重启电脑）

#### Windows 防火墙

Windows 防火墙将 WSL2 视为一个单独的网络（在 NAT 和镜像模式下都是如此）。如果执行上述步骤后连接仍然失败，请为模型服务器的端口添加防火墙规则：

```powershell
# 在管理员 PowerShell 中运行 — 将 PORT 替换为你的服务器端口
New-NetFirewallRule -DisplayName "允许 WSL2 访问模型服务器" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 11434
```

常见端口：Ollama `11434`、vLLM `8000`、SGLang `30000`、llama-server `8080`、LM Studio `1234`。

#### 快速验证

从 WSL2 内部，测试你是否能访问模型服务器：

```bash
# 将 URL 替换为你的服务器地址和端口
curl http://localhost:11434/v1/models          # 镜像模式
curl http://172.29.192.1:11434/v1/models       # NAT 模式（使用你的实际宿主机 IP）
```

如果你收到了一个列出模型的 JSON 响应，那就没问题了。将相同的 URL 用作 Hermes 配置中的 `base_url`。

---

### 本地模型故障排除

这些问题影响**所有**与 Hermes 配合使用的本地推理服务器。

#### 从 WSL2 连接到 Windows 托管的模型服务器出现 "Connection refused"

如果你在 WSL2 内运行 Hermes，而模型服务器在 Windows 宿主机上，`http://localhost:<port>` 在 WSL2 默认的 NAT 网络模式下将无法工作。修复方法请参见上面的 [WSL2 网络](#wsl2-网络-windows-users)部分。

#### 工具调用显示为文本而非执行

模型输出类似 `{"name": "web_search", "arguments": {...}}` 的内容作为消息，而不是实际调用工具。

**原因：** 你的服务器没有启用工具调用，或者该模型不支持服务器的工具调用实现。

| 服务器 | 修复方法 |
|--------|----------|
| **llama.cpp** | 在启动命令中添加 `--jinja` |
| **vLLM** | 添加 `--enable-auto-tool-choice --tool-call-parser hermes` |
| **SGLang** | 添加 `--tool-call-parser qwen`（或相应的解析器） |
| **Ollama** | 工具调用默认启用——确保你的模型支持它（通过 `ollama show model-name` 检查） |
| **LM Studio** | 更新到 0.3.6+ 并使用具有原生工具支持的模型 |

#### 模型似乎忘记上下文或给出不连贯的响应

**原因：** 上下文窗口太小。当对话超过上下文限制时，大多数服务器会静默丢弃较旧的消息。仅 Hermes 的系统提示 + 工具模式就可能使用 4k–8k 个 token。

**诊断：**

```bash
# 检查 Hermes 认为的上下文长度
# 查看启动行："Context limit: X tokens"（上下文限制：X 个 token）

# 检查服务器的实际上下文
# Ollama: ollama ps（CONTEXT 列）
# llama.cpp: curl http://localhost:8080/props | jq '.default_generation_settings.n_ctx'
# vLLM: 检查启动参数中的 --max-model-len
```

**修复：** 将上下文设置为至少 **64,000 个 token** 以供智能体使用。具体标志请参见上面各服务器章节。

#### 启动时出现 "Context limit: 2048 tokens"（上下文限制：2048 个 token）

Hermes 从服务器的 `/v1/models` 端点自动检测上下文长度。如果服务器报告了一个较低的值（或根本没有报告），Hermes 会使用模型声明的限制，这可能是错误的。

**修复：** 在 `config.yaml` 中显式设置：

```yaml
model:
  default: your-model
  provider: custom
  base_url: http://localhost:11434/v1
  context_length: 64000
```

#### 响应在句子中途被截断

**可能的原因：**
1.  **服务器输出上限（`max_tokens`）过低** — SGLang 默认每个回复限制 128 个 token。请在服务器上设置 `--default-max-tokens` 或在 Hermes 的 config.yaml 中配置 `model.max_tokens`。注意：`max_tokens` 仅控制回复长度，与对话历史长度无关（后者由 `context_length` 决定）。
2.  **上下文耗尽** — 模型填满了其上下文窗口。请增加 `model.context_length` 或在 Hermes 中启用[上下文压缩](/user-guide/configuration#context-compression)。

---

### LiteLLM Proxy — 多提供商网关

[LiteLLM](https://docs.litellm.ai/) 是一个兼容 OpenAI 的代理，它将 100 多个 LLM 提供商统一在一个 API 背后。最适合：在不更改配置的情况下切换提供商、负载均衡、备用链、预算控制。

```bash
# 安装并启动
pip install "litellm[proxy]"
litellm --model anthropic/claude-sonnet-4 --port 4000

# 或者使用配置文件配置多个模型：
litellm --config litellm_config.yaml --port 4000
```

然后通过 `hermes model` → 自定义端点 → `http://localhost:4000/v1` 配置 Hermes。

带有备用的 `litellm_config.yaml` 示例：
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

### ClawRouter — 成本优化路由

[ClawRouter](https://github.com/BlockRunAI/ClawRouter) 由 BlockRunAI 开发，是一个本地路由代理，它根据查询复杂度自动选择模型。它跨 14 个维度对请求进行分类，并路由到能够处理任务的最便宜模型。通过 USDC 加密货币支付（无需 API 密钥）。

```bash
# 安装并启动
npx @blockrun/clawrouter    # 在端口 8402 启动
```

然后通过 `hermes model` → 自定义端点 → `http://localhost:8402/v1` → 模型名称 `blockrun/auto` 配置 Hermes。

路由配置文件：
| 配置文件 | 策略 | 节省比例 |
|---------|----------|---------|
| `blockrun/auto` | 平衡质量/成本 | 74-100% |
| `blockrun/eco` | 最便宜可行方案 | 95-100% |
| `blockrun/premium` | 最佳质量模型 | 0% |
| `blockrun/free` | 仅限免费模型 | 100% |
| `blockrun/agentic` | 针对工具使用优化 | 视情况而定 |

:::note
ClawRouter 需要在 Base 或 Solana 上有一个注资 USDC 的钱包用于支付。所有请求都通过 BlockRun 的后端 API 路由。运行 `npx @blockrun/clawrouter doctor` 检查钱包状态。
:::

---

### 其他兼容提供商

任何具有 OpenAI 兼容 API 的服务都可以使用。一些流行的选项：

| 提供商 | 基础 URL | 备注 |
|----------|----------|-------|
| [Together AI](https://together.ai) | `https://api.together.xyz/v1` | 云托管开放模型 |
| [Groq](https://groq.com) | `https://api.groq.com/openai/v1` | 超快推理 |
| [DeepSeek](https://deepseek.com) | `https://api.deepseek.com/v1` | DeepSeek 模型 |
| [Fireworks AI](https://fireworks.ai) | `https://api.fireworks.ai/inference/v1` | 快速开放模型托管 |
| [GMI Cloud](https://www.gmicloud.ai/) | `https://api.gmi-serving.com/v1` | 托管式 OpenAI 兼容推理 |
| [Cerebras](https://cerebras.ai) | `https://api.cerebras.ai/v1` | 晶圆级芯片推理 |
| [Mistral AI](https://mistral.ai) | `https://api.mistral.ai/v1` | Mistral 模型 |
| [OpenAI](https://openai.com) | `https://api.openai.com/v1` | 直接 OpenAI 访问 |
| [Azure OpenAI](https://azure.microsoft.com) | `https://YOUR.openai.azure.com/` | 企业级 OpenAI |
| [LocalAI](https://localai.io) | `http://localhost:8080/v1` | 自托管，多模型 |
| [Jan](https://jan.ai) | `http://localhost:1337/v1` | 带有本地模型的桌面应用 |

通过 `hermes model` → 自定义端点或在 `config.yaml` 中配置这些提供商中的任何一个：

```yaml
model:
  default: meta-llama/Llama-3.1-70B-Instruct-Turbo
  provider: custom
  base_url: https://api.together.xyz/v1
  api_key: your-together-key
```

---

### 上下文长度检测

:::note 两个设置，容易混淆
**`context_length`** 是**总上下文窗口** — 输入*和*输出 token 的组合预算（例如，Claude Opus 4.6 为 200,000）。Hermes 用它来决定何时压缩历史记录以及验证 API 请求。

**`model.max_tokens`** 是**输出上限** — 模型在*单次响应*中可以生成的最大 token 数。它与你的对话历史可以有多长无关。行业标准名称 `max_tokens` 是一个常见的混淆来源；Anthropic 的原生 API 后来将其重命名为 `max_output_tokens` 以更清晰。

当自动检测获取窗口大小错误时设置 `context_length`。
仅当需要限制单个响应长度时设置 `model.max_tokens`。
:::

Hermes 使用多源解析链来检测你的模型和提供商的正确上下文窗口：

1.  **配置覆盖** — config.yaml 中的 `model.context_length`（最高优先级）
2.  **自定义提供商按模型** — `custom_providers[].models.<id>.context_length`
3.  **持久缓存** — 之前发现的值（重启后仍然保留）
4.  **端点 `/models`** — 查询你的服务器 API（本地/自定义端点）
5.  **Anthropic `/v1/models`** — 查询 Anthropic 的 API 获取 `max_input_tokens`（仅 API 密钥用户）
6.  **OpenRouter API** — 来自 OpenRouter 的实时模型元数据
7.  **Nous Portal** — 将 Nous 模型 ID 与 OpenRouter 元数据进行后缀匹配
8.  **[models.dev](https://models.dev)** — 社区维护的注册表，包含 100 多个提供商中 3800 多个模型的提供商特定上下文长度
9.  **后备默认值** — 广泛的模型系列模式（默认 128K）

对于大多数设置，这开箱即用。该系统具有提供商感知能力 — 同一个模型可能有不同的上下文限制，具体取决于谁提供服务（例如，`claude-opus-4.6` 在 Anthropic 直接访问时为 1M，但在 GitHub Copilot 上为 128K）。

要显式设置上下文长度，请在你的模型配置中添加 `context_length`：

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

`hermes model` 在配置自定义端点时会提示输入上下文长度。留空以进行自动检测。

:::tip 何时手动设置此项
- 你正在使用 Ollama，并且自定义 `num_ctx` 低于模型的最大值
- 你希望将上下文限制在模型最大值以下（例如，在 128k 模型上限制为 8k 以节省显存）
- 你运行在不公开 `/v1/models` 的代理后面
:::

---

### 命名自定义提供商

如果你使用多个自定义端点（例如，本地开发服务器和远程 GPU 服务器），你可以在 `config.yaml` 中将它们定义为命名自定义提供商：

```yaml
custom_providers:
  - name: local
    base_url: http://localhost:8080/v1
    # api_key 省略 — Hermes 对无需密钥的本地服务器使用 "no-key-required"
  - name: work
    base_url: https://gpu-server.internal.corp/v1
    key_env: CORP_API_KEY
    api_mode: chat_completions   # 由 `hermes model` → 自定义端点向导明确设置；自动检测仍作为后备发生
  - name: anthropic-proxy
    base_url: https://proxy.example.com/anthropic
    key_env: ANTHROPIC_PROXY_KEY
    api_mode: anthropic_messages  # 用于 Anthropic 兼容代理
```

一些 OpenAI 兼容端点需要特定于提供商的请求体字段。向匹配的自定义提供商添加一个 `extra_body` 映射，Hermes 将为该端点的每个 chat-completions 请求合并它：

```yaml
custom_providers:
  - name: gemma-local
    base_url: http://localhost:8080/v1
    model: google/gemma-4-31b-it
    extra_body:
      enable_thinking: true
      reasoning_effort: high
```

使用你的服务器文档中描述的格式。例如，vLLM Gemma 部署和一些 NVIDIA NIM 端点期望 `enable_thinking` 位于 `chat_template_kwargs` 下，而不是作为顶级 `extra_body` 字段：

```yaml
extra_body:
  chat_template_kwargs:
    enable_thinking: true
```

`hermes model` → 自定义端点向导现在会明确提示输入 `api_mode`，并将你的答案持久保存到 `config.yaml`。当该字段留空时，基于 URL 的自动检测（例如 `/anthropic` 路径 → `anthropic_messages`）仍会作为后备发生。

使用三元语法在会话中切换它们：

```
/model custom:local:qwen-2.5       # 使用 "local" 端点和 qwen-2.5
/model custom:work:llama3-70b      # 使用 "work" 端点和 llama3-70b
/model custom:anthropic-proxy:claude-sonnet-4  # 使用代理
```

你也可以从交互式 `hermes model` 菜单中选择命名自定义提供商。

---

### 实战手册：Together AI, Groq, Perplexity

[其他兼容提供商](#other兼容提供商)中列出的云提供商都讲 OpenAI 的 REST 方言，因此它们在 `custom_providers:` 下的设置方式相同。以下是三个经过验证的配方。每个都可以放入 `~/.hermes/config.yaml`，并将对应的 API 密钥放在 `~/.hermes/.env` 中。

#### Together AI

以远低于第一方 API 的价格托管开放权重模型（Llama, MiniMax, Gemma, DeepSeek, Qwen）。对于多模型集群是不错的默认选择。

```yaml
# ~/.hermes/config.yaml
custom_providers:
  - name: together
    base_url: https://api.together.xyz/v1
    key_env: TOGETHER_API_KEY
    # api_mode: chat_completions  # 默认 — 无需设置

model:
  default: MiniMaxAI/MiniMax-M2.7   # 或 together.ai/models 上的任何模型
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

Together 的 `/v1/models` 端点正常工作，因此 `hermes model` 可以自动发现可用模型。

#### Groq

超快推理速度（在 Llama-3.3-70B 上约 500 tok/s）。模型目录较小，但非常适合对延迟敏感的交互式使用。

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

当你希望使用能自动进行实时网络搜索并引用的模型时很有用。对可用模型有严格限制 — 请查看 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 获取当前列表。

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

这三个配方可以组合使用 — 将它们全部一起使用，并通过 `/model custom:<name>:<model>` 在每个对话回合中切换：

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
  provider: custom:together      # 启动时使用 Together；之后可自由切换
```

:::tip 故障排除
- 在 #15083 的 CLI 验证器修复后，`hermes doctor` 应该不会打印任何关于这些名称的 `Unknown provider` 警告。
- 如果某个提供商的 `/v1/models` 端点不可达（Perplexity 是常见情况），`hermes model` 将在给出警告后继续使用该模型，而不是硬性拒绝 — 参见 #15136。
- 若要完全跳过 `custom_providers:` 并使用带有 `CUSTOM_BASE_URL` 环境变量的裸 `provider: custom`，请参见 #15103。
:::

---

### 选择正确的配置

| 使用场景 | 推荐选项 |
|----------|----------|
| **只想顺利运行** | OpenRouter（默认）或 Nous Portal |
| **本地模型，设置简单** | Ollama |
| **生产环境 GPU 服务** | vLLM 或 SGLang |
| **Mac / 无 GPU** | Ollama 或 llama.cpp |
| **多提供商路由** | LiteLLM Proxy 或 OpenRouter |
| **成本优化** | ClawRouter 或使用 `sort: "price"` 的 OpenRouter |
| **最大隐私性** | Ollama、vLLM 或 llama.cpp（完全本地） |
| **企业级 / Azure** | Azure OpenAI（自定义端点） |
| **中文 AI 模型** | z.ai (GLM)、Kimi/Moonshot (`kimi-coding` 或 `kimi-coding-cn`)、MiniMax、小米 MiMo 或腾讯 TokenHub（首选提供商） |

:::tip
你可以随时使用 `hermes model` 切换提供商 — 无需重启。无论使用哪个提供商，你的对话历史、记忆和技能都会保留。
:::

## 可选 API 密钥

| 功能 | 提供商 | 环境变量 |
|------|--------|----------|
| 网页抓取 | [Firecrawl](https://firecrawl.dev/) | `FIRECRAWL_API_KEY`, `FIRECRAWL_API_URL` |
| 浏览器自动化 | [Browserbase](https://browserbase.com/) | `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` |
| 图像生成 | [FAL](https://fal.ai/) | `FAL_KEY` |
| 高级 TTS 语音 | [ElevenLabs](https://elevenlabs.io/) | `ELEVENLABS_API_KEY` |
| OpenAI TTS + 语音转录 | [OpenAI](https://platform.openai.com/api-keys) | `VOICE_TOOLS_OPENAI_KEY` |
| Mistral TTS + 语音转录 | [Mistral](https://console.mistral.ai/) | `MISTRAL_API_KEY` |
| 跨会话用户建模 | [Honcho](https://honcho.dev/) | `HONCHO_API_KEY` |
| 语义长期记忆 | [Supermemory](https://supermemory.ai) | `SUPERMEMORY_API_KEY` |

### 自托管 Firecrawl

默认情况下，Hermes 使用 [Firecrawl 云 API](https://firecrawl.dev/) 进行网页搜索和抓取。如果你更喜欢在本地运行 Firecrawl，可以将 Hermes 指向一个自托管的实例。完整的设置说明请参见 Firecrawl 的 [SELF_HOST.md](https://github.com/firecrawl/firecrawl/blob/main/SELF_HOST.md)。

**你将获得什么：** 无需 API 密钥，无速率限制，无按页收费，完全的数据主权。

**你将失去什么：** 云版本使用 Firecrawl 专有的 "Fire-engine" 来实现高级反爬虫绕过（Cloudflare、验证码、IP 轮换）。自托管版本使用基本的 fetch + Playwright，因此一些受保护的网站可能会失败。搜索使用 DuckDuckGo 而不是 Google。

**设置：**

1. 克隆并启动 Firecrawl Docker 堆栈（5 个容器：API、Playwright、Redis、RabbitMQ、PostgreSQL — 需要约 4-8 GB 内存）：
   ```bash
   git clone https://github.com/firecrawl/firecrawl
   cd firecrawl
   # 在 .env 中设置：USE_DB_AUTHENTICATION=false, HOST=0.0.0.0, PORT=3002
   docker compose up -d
   ```

2. 将 Hermes 指向你的实例（无需 API 密钥）：
   ```bash
   hermes config set FIRECRAWL_API_URL http://localhost:3002
   ```

如果你的自托管实例启用了身份验证，你也可以同时设置 `FIRECRAWL_API_KEY` 和 `FIRECRAWL_API_URL`。

## OpenRouter 提供商路由

使用 OpenRouter 时，你可以控制请求如何路由到不同提供商。在 `~/.hermes/config.yaml` 中添加一个 `provider_routing` 部分：

```yaml
provider_routing:
  sort: "throughput"          # "price" (默认), "throughput"，或 "latency"
  # only: ["anthropic"]      # 仅使用这些提供商
  # ignore: ["deepinfra"]    # 跳过这些提供商
  # order: ["anthropic", "google"]  # 按此顺序尝试提供商
  # require_parameters: true  # 仅使用支持所有请求参数的提供商
  # data_collection: "deny"   # 排除可能存储/训练数据的提供商
```

**快捷方式：** 在任何模型名称后附加 `:nitro` 进行吞吐量排序（例如，`anthropic/claude-sonnet-4:nitro`），或附加 `:floor` 进行价格排序。

## OpenRouter Pareto 代码路由器

OpenRouter 在 `openrouter/pareto-code` 提供了一个实验性的编码模型路由器，它会自动将请求路由到满足编码质量标准（由 [Artificial Analysis](https://artificialanalysis.ai/) 排名）的最便宜模型。选择此模型并在 `~/.hermes/config.yaml` 中调整 `min_coding_score` 旋钮：

```yaml
model:
  provider: openrouter
  model: openrouter/pareto-code

openrouter:
  min_coding_score: 0.65   # 0.0–1.0；越高 = 更强大（更昂贵）的编码器。默认 0.65。
```

注意事项：

- `min_coding_score` **仅在** `model.model` 为 `openrouter/pareto-code` 时发送。在其他任何模型上，该值无效。
- 设置为空字符串（或移除该行）可让 OpenRouter 选择最强的可用编码器 — 这是省略插件块时文档记录的行为。
- 选择对于给定日期的给定分数是确定性的，但随着 Pareto 前沿的移动（新模型、基准更新），实际选择的模型可能会发生变化。
- 有关完整的路由器行为，请参阅 OpenRouter 的 [Pareto 路由器文档](https://openrouter.ai/docs/guides/routing/routers/pareto-router)。
- 要将 Pareto 代码路由器用于特定的**辅助任务**（压缩、视觉等）而不是主智能体，请在该任务下设置 `extra_body.plugins` — 参见 [辅助模型 → OpenRouter 路由与辅助任务的 Pareto 代码](/user-guide/configuration#openrouter-routing--pareto-code-for-auxiliary-tasks)。

## 备用提供商

配置一个备用提供商链，当主模型失败（速率限制、服务器错误、身份验证失败）时，Hermes 会按顺序尝试。规范格式是一个顶层的 `fallback_providers:` 列表：

```yaml
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
  - provider: anthropic
    model: claude-sonnet-4
    # base_url: http://localhost:8000/v1    # 可选，用于自定义端点
    # api_mode: chat_completions           # 可选覆盖
```

旧版的单对 `fallback_model:` 字典仍可用于向后兼容：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

激活时，备用机制会在会话中途更换模型和提供商，而不会丢失你的对话内容。链会逐条尝试；每个会话仅激活一次。

支持的提供商：`openrouter`、`nous`、`openai-codex`、`copilot`、`copilot-acp`、`anthropic`、`gemini`、`google-gemini-cli`、`qwen-oauth`、`huggingface`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`minimax-oauth`、`deepseek`、`nvidia`、`xai`、`xai-oauth`、`ollama-cloud`、`bedrock`、`ai-gateway`、`azure-foundry`、`opencode-zen`、`opencode-go`、`kilocode`、`xiaomi`、`arcee`、`gmi`、`stepfun`、`lmstudio`、`alibaba`、`alibaba-coding-plan`、`tencent-tokenhub`、`custom`。

:::tip
备用机制完全通过 `config.yaml` 配置 — 或通过 `hermes fallback` 交互式设置。有关触发条件、链推进方式以及如何与辅助任务和委派交互的完整详情，请参阅 [备用提供商](/user-guide/features/fallback-providers)。
:::

---

## 另请参阅

- [配置](/user-guide/configuration) — 通用配置（目录结构、配置优先级、终端后端、记忆、压缩等）
- [环境变量](/reference/environment-variables) — 所有环境变量的完整参考