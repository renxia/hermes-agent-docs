---
title: "AI 提供商"
sidebar_label: "AI 提供商"
sidebar_position: 1
---

# AI 提供商

此页面介绍如何为 Hermes 智能体设置推理提供商，包括 OpenRouter 和 Anthropic 等云端 API，Ollama 和 vLLM 等自托管端点，以及高级路由和故障转移配置。使用 Hermes 至少需要配置一个提供商。

## 推理服务提供商

您需要至少一种连接大语言模型（LLM）的方式。使用 `hermes model` 命令以交互方式切换服务提供商和模型，或直接进行配置：

| 服务提供商 | 配置方式 |
|------------|----------|
| **Nous Portal** | `hermes model`（OAuth，基于订阅） |
| **OpenAI Codex** | `hermes model`（ChatGPT OAuth，使用 Codex 模型） |
| **GitHub Copilot** | `hermes model`（OAuth 设备码流程，`COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 或 `gh auth token`） |
| **GitHub Copilot ACP** | `hermes model`（启动本地 `copilot --acp --stdio`） |
| **Anthropic** | `hermes model`（Claude Max + 通过 OAuth 获取额外使用额度；也支持 Anthropic API 密钥或手动设置令牌 —— 见下方说明） |
| **OpenRouter** | 在 `~/.hermes/.env` 中设置 `OPENROUTER_API_KEY` |
| **AI Gateway** | 在 `~/.hermes/.env` 中设置 `AI_GATEWAY_API_KEY`（服务提供商：`ai-gateway`） |
| **z.ai / GLM** | 在 `~/.hermes/.env` 中设置 `GLM_API_KEY`（服务提供商：`zai`） |
| **Kimi / Moonshot** | 在 `~/.hermes/.env` 中设置 `KIMI_API_KEY`（服务提供商：`kimi-coding`） |
| **Kimi / Moonshot（中国）** | 在 `~/.hermes/.env` 中设置 `KIMI_CN_API_KEY`（服务提供商：`kimi-coding-cn`；别名：`kimi-cn`、`moonshot-cn`） |
| **Arcee AI** | 在 `~/.hermes/.env` 中设置 `ARCEEAI_API_KEY`（服务提供商：`arcee`；别名：`arcee-ai`、`arceeai`） |
| **GMI Cloud** | 在 `~/.hermes/.env` 中设置 `GMI_API_KEY`（服务提供商：`gmi`；别名：`gmi-cloud`、`gmicloud`） |
| **MiniMax** | 在 `~/.hermes/.env` 中设置 `MINIMAX_API_KEY`（服务提供商：`minimax`） |
| **MiniMax（中国）** | 在 `~/.hermes/.env` 中设置 `MINIMAX_CN_API_KEY`（服务提供商：`minimax-cn`） |
| **阿里云** | 在 `~/.hermes/.env` 中设置 `DASHSCOPE_API_KEY`（服务提供商：`alibaba`） |
| **阿里编程计划** | `DASHSCOPE_API_KEY`（服务提供商：`alibaba-coding-plan`，别名：`alibaba_coding`）—— 独立计费 SKU，不同端点 |
| **Kilo Code** | 在 `~/.hermes/.env` 中设置 `KILOCODE_API_KEY`（服务提供商：`kilocode`） |
| **小米 MiMo** | 在 `~/.hermes/.env` 中设置 `XIAOMI_API_KEY`（服务提供商：`xiaomi`；别名：`mimo`、`xiaomi-mimo`） |
| **腾讯 TokenHub** | 在 `~/.hermes/.env` 中设置 `TOKENHUB_API_KEY`（服务提供商：`tencent-tokenhub`；别名：`tencent`、`tokenhub`、`tencentmaas`） |
| **OpenCode Zen** | 在 `~/.hermes/.env` 中设置 `OPENCODE_ZEN_API_KEY`（服务提供商：`opencode-zen`） |
| **OpenCode Go** | 在 `~/.hermes/.env` 中设置 `OPENCODE_GO_API_KEY`（服务提供商：`opencode-go`） |
| **DeepSeek** | 在 `~/.hermes/.env` 中设置 `DEEPSEEK_API_KEY`（服务提供商：`deepseek`） |
| **Hugging Face** | 在 `~/.hermes/.env` 中设置 `HF_TOKEN`（服务提供商：`huggingface`；别名：`hf`） |
| **Google / Gemini** | 在 `~/.hermes/.env` 中设置 `GOOGLE_API_KEY`（或 `GEMINI_API_KEY`）（服务提供商：`gemini`） |
| **Google Gemini（OAuth）** | `hermes model` → “Google Gemini（OAuth）”（服务提供商：`google-gemini-cli`，支持免费层级，浏览器 PKCE 登录） |
| **LM Studio** | `hermes model` → “LM Studio”（服务提供商：`lmstudio`，可选 `LM_API_KEY`） |
| **自定义端点** | `hermes model` → 选择“自定义端点”（保存在 `config.yaml` 中） |

有关官方 API 密钥路径，请参阅专门的 [Google Gemini 指南](/docs/guides/google-gemini)。

:::tip 模型键别名
在 `model:` 配置部分中，您可以使用 `default:` 或 `model:` 作为模型 ID 的键名。`model: { default: my-model }` 和 `model: { model: my-model }` 均可正常工作。
:::

### 通过 OAuth 使用 Google Gemini（`google-gemini-cli`）

`google-gemini-cli` 服务提供商使用 Google 的 Cloud Code Assist 后端 —— 与 Google 自己的 `gemini-cli` 工具使用的 API 相同。这既支持**免费层级**（个人账户享有慷慨的每日配额），也支持**付费层级**（通过 GCP 项目使用 Standard/Enterprise）。

**快速开始：**

```bash
hermes model
# → 选择“Google Gemini（OAuth）”
# → 查看策略警告，确认
# → 浏览器打开 accounts.google.com，登录
# → 完成 —— Hermes 在首次请求时自动为您配置免费层级
```

Hermes 默认附带 Google 的**公开** `gemini-cli` 桌面 OAuth 客户端 —— 与 Google 在其开源 `gemini-cli` 中包含的凭据相同。桌面 OAuth 客户端并非机密（PKCE 提供安全保障）。您无需安装 `gemini-cli` 或注册自己的 GCP OAuth 客户端。

**认证工作原理：**
- 针对 `accounts.google.com` 的 PKCE 授权码流程
- 浏览器回调地址为 `http://127.0.0.1:8085/oauth2callback`（如果端口繁忙则回退到临时端口）
- 令牌存储在 `~/.hermes/auth/google_oauth.json`（chmod 0600，原子写入，跨进程 `fcntl` 锁）
- 在到期前 60 秒自动刷新
- 无头环境（SSH、`HERMES_HEADLESS=1`）→ 回退到粘贴模式
- 飞行中刷新去重 —— 两个并发请求不会重复刷新
- `invalid_grant`（撤销刷新）→ 凭据文件被清除，提示用户重新登录

**推理工作原理：**
- 流量发送至 `https://cloudcode-pa.googleapis.com/v1internal:generateContent`（或用于流式传输的 `:streamGenerateContent?alt=sse`），而非付费的 `v1beta/openai` 端点
- 请求体包装为 `{project, model, user_prompt_id, request}`
- 类 OpenAI 格式的 `messages[]`、`tools[]`、`tool_choice` 被转换为 Gemini 原生的 `contents[]`、`tools[].functionDeclarations`、`toolConfig` 格式
- 响应被转换回 OpenAI 格式，以便 Hermes 其余部分无需更改即可工作

**层级与项目 ID：**

| 您的情况 | 操作 |
|---|---|
| 个人 Google 账户，希望使用免费层级 | 无需操作 —— 登录，开始聊天 |
| 工作区 / Standard / Enterprise 账户 | 将 `HERMES_GEMINI_PROJECT_ID` 或 `GOOGLE_CLOUD_PROJECT` 设置为您的 GCP 项目 ID |
| 受 VPC-SC 保护的组织 | Hermes 检测到 `SECURITY_POLICY_VIOLATED` 并自动强制使用 `standard-tier` |

免费层级在首次使用时自动配置由 Google 管理的项目。无需进行 GCP 设置。

**配额监控：**

```
/gquota
```

显示每个模型的剩余 Code Assist 配额，并带有进度条：

```
Gemini Code Assist 配额  (项目: 123-abc)

  gemini-2.5-pro                      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░   85%
  gemini-2.5-flash [输入]              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░   92%
```

:::warning 策略风险
Google 认为将 Gemini CLI OAuth 客户端与第三方软件一起使用属于策略违规。一些用户报告了账户限制。为了获得最低风险体验，请改用您自己的 API 密钥并通过 `gemini` 服务提供商。Hermes 在 OAuth 开始前会显示前置警告并要求明确确认。
:::

**自定义 OAuth 客户端（可选）：**

如果您更愿意注册自己的 Google OAuth 客户端 —— 例如，将配额和同意范围限定到您自己的 GCP 项目 —— 请设置：

```bash
HERMES_GEMINI_CLIENT_ID=your-client.apps.googleusercontent.com
HERMES_GEMINI_CLIENT_SECRET=...   # 桌面客户端可选
```

在 [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) 注册一个**桌面应用** OAuth 客户端，并启用生成式语言 API。

:::info Codex 说明
OpenAI Codex 服务提供商通过设备码进行认证（打开 URL，输入代码）。Hermes 将生成的凭据存储在其自己的认证存储中，路径为 `~/.hermes/auth.json`，并且当 `~/.codex/auth.json` 存在时，可以导入现有的 Codex CLI 凭据。无需安装 Codex CLI。
:::

:::warning
即使使用 Nous Portal、Codex 或自定义端点，某些工具（视觉、网页摘要、MoA）也会使用单独的“辅助”模型。默认情况下（`auxiliary.*.provider: "auto"`），Hermes 将这些任务路由到您的**主聊天模型** —— 即您在 `hermes model` 中选择的同一个模型。您可以单独覆盖每项任务，将其路由到更便宜/更快的模型（例如在 OpenRouter 上的 Gemini Flash）—— 请参阅 [辅助模型](/docs/user-guide/configuration#auxiliary-models)。
:::

:::tip Nous 工具网关
付费 Nous Portal 订阅者还可以访问**[工具网关](/docs/user-guide/features/tool-gateway)** —— 网络搜索、图像生成、TTS 和浏览器自动化均通过您的订阅路由。无需额外的 API 密钥。它会在 `hermes model` 设置期间自动提供，或者您可以稍后使用 `hermes tools` 启用它。
:::

### 用于模型管理的两个命令

Hermes 有**两个**模型命令，用途不同：

| 命令 | 运行位置 | 功能 |
|---------|-------------|--------------|
| **`hermes model`** | 您的终端（在任何会话之外） | 完整设置向导 —— 添加服务提供商、运行 OAuth、输入 API 密钥、配置端点 |
| **`/model`** | 在 Hermes 聊天会话内部 | 在**已配置**的服务提供商和模型之间快速切换 |

如果您试图切换到一个尚未设置的服务提供商（例如，您只配置了 OpenRouter，但想使用 Anthropic），您需要使用 `hermes model`，而不是 `/model`。请先退出会话（`Ctrl+C` 或 `/quit`），运行 `hermes model`，完成服务提供商设置，然后启动新会话。

### Anthropic（原生）

直接通过 Anthropic API 使用 Claude 模型 —— 无需 OpenRouter 代理。支持三种认证方式：

:::caution 需要 Claude Max “额外使用”额度
当您通过 `hermes model` → Anthropic OAuth（或通过 `hermes auth add anthropic --type oauth`）进行认证时，Hermes 会以 Claude Code 的形式路由到您的 Anthropic 账户。**仅当您处于 Claude Max 计划并购买了额外使用额度时，此方式才有效。** 基础 Max 计划额度（Claude Code 默认包含的使用量）不会被 Hermes 消耗 —— 只有您额外添加的额度才会被消耗。Claude Pro 订阅者无法使用此路径。

如果您没有 Max + 额外额度，请改用 `ANTHROPIC_API_KEY` —— 请求将按令牌付费，针对该密钥所属的组织计费（标准 API 定价，独立于任何 Claude 订阅）。
:::

```bash
# 使用 API 密钥（按令牌付费）
export ANTHROPIC_API_KEY=***
hermes chat --provider anthropic --model claude-sonnet-4-6

# 推荐：通过 `hermes model` 进行认证
# 当可用时，Hermes 将直接使用 Claude Code 的凭据存储
hermes model

# 使用设置令牌手动覆盖（回退 / 传统方式）
export ANTHROPIC_TOKEN=***  # 设置令牌或手动 OAuth 令牌
hermes chat --provider anthropic

# 自动检测 Claude Code 凭据（如果您已使用 Claude Code）
hermes chat --provider anthropic  # 自动读取 Claude Code 凭据文件
```

当您通过 `hermes model` 选择 Anthropic OAuth 时，Hermes 优先使用 Claude Code 自己的凭据存储，而不是将令牌复制到 `~/.hermes/.env`。这样可以保持可刷新的 Claude 凭据的可刷新性。

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

Hermes 将 GitHub Copilot 作为一流的服务提供商支持，提供两种模式：

**`copilot` —— 直接 Copilot API**（推荐）。使用您的 GitHub Copilot 订阅通过 Copilot API 访问 GPT-5.x、Claude、Gemini 和其他模型。

```bash
hermes chat --provider copilot --model gpt-5.4
```

**认证选项**（按此顺序检查）：

1. `COPILOT_GITHUB_TOKEN` 环境变量
2. `GH_TOKEN` 环境变量
3. `GITHUB_TOKEN` 环境变量
4. `gh auth token` CLI 回退

如果未找到令牌，`hermes model` 会提供一个 **OAuth 设备码登录** —— 与 Copilot CLI 和 opencode 使用的流程相同。

:::warning 令牌类型
Copilot API **不**支持经典个人访问令牌（`ghp_*`）。支持的令牌类型：

| 类型 | 前缀 | 如何获取 |
|------|--------|------------|
| OAuth 令牌 | `gho_` | `hermes model` → GitHub Copilot → 使用 GitHub 登录 |
| 细粒度 PAT | `github_pat_` | GitHub 设置 → 开发者设置 → 细粒度令牌（需要**Copilot 请求**权限） |
| GitHub 应用令牌 | `ghu_` | 通过 GitHub 应用安装 |

如果您的 `gh auth token` 返回 `ghp_*` 令牌，请使用 `hermes model` 通过 OAuth 进行认证。
:::

:::info Hermes 中的 Copilot 认证行为
Hermes 将支持的 GitHub 令牌（`gho_*`、`github_pat_*` 或 `ghu_*`）直接发送到 `api.githubcopilot.com`，并包含 Copilot 特定的标头（`Editor-Version`、`Copilot-Integration-Id`、`Openai-Intent`、`x-initiator`）。

在收到 HTTP 401 时，Hermes 现在会在回退之前执行一次性的凭据恢复：

1. 通过正常的优先级链重新解析令牌（`COPILOT_GITHUB_TOKEN` → `GH_TOKEN` → `GITHUB_TOKEN` → `gh auth token`）
2. 使用刷新的标头重建共享的 OpenAI 客户端
3. 重试请求一次

一些较旧的社区代理使用 `api.github.com/copilot_internal/v2/token` 交换流程。该端点可能对某些账户类型不可用（返回 404）。因此，Hermes 将直接令牌认证作为主要路径，并依赖运行时凭据刷新 + 重试来保证鲁棒性。
:::

**API 路由**：GPT-5+ 模型（除了 `gpt-5-mini`）自动使用 Responses API。所有其他模型（GPT-4o、Claude、Gemini 等）使用 Chat Completions。模型会从实时的 Copilot 目录中自动检测。

**`copilot-acp` —— Copilot ACP 智能体后端**。将本地 Copilot CLI 作为子进程启动：

```bash
hermes chat --provider copilot-acp --model copilot-acp
# 需要 PATH 中有 GitHub Copilot CLI 并且存在 `copilot login` 会话
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

### 一流 API 密钥服务提供商

这些服务提供商具有内置支持，并拥有专用的服务提供商 ID。设置 API 密钥并使用 `--provider` 进行选择：

```bash
# z.ai / 智谱 AI GLM
hermes chat --provider zai --model glm-5
# 需要：在 ~/.hermes/.env 中设置 GLM_API_KEY

# Kimi / Moonshot AI（国际：api.moonshot.ai）
hermes chat --provider kimi-coding --model kimi-for-coding
# 需要：在 ~/.hermes/.env 中设置 KIMI_API_KEY

# Kimi / Moonshot AI（中国：api.moonshot.cn）
hermes chat --provider kimi-coding-cn --model kimi-k2.5
# 需要：在 ~/.hermes/.env 中设置 KIMI_CN_API_KEY

# MiniMax（全球端点）
hermes chat --provider minimax --model MiniMax-M2.7
# 需要：在 ~/.hermes/.env 中设置 MINIMAX_API_KEY

# MiniMax（中国端点）
hermes chat --provider minimax-cn --model MiniMax-M2.7
# 需要：在 ~/.hermes/.env 中设置 MINIMAX_CN_API_KEY

# 阿里云 / DashScope（Qwen 模型）
hermes chat --provider alibaba --model qwen3.5-plus
# 需要：在 ~/.hermes/.env 中设置 DASHSCOPE_API_KEY

# 小米 MiMo
hermes chat --provider xiaomi --model mimo-v2-pro
# 需要：在 ~/.hermes/.env 中设置 XIAOMI_API_KEY

# 腾讯 TokenHub（Hy3 预览）
hermes chat --provider tencent-tokenhub --model hy3-preview
# 需要：在 ~/.hermes/.env 中设置 TOKENHUB_API_KEY

# Arcee AI（Trinity 模型）
hermes chat --provider arcee --model trinity-large-thinking
# 需要：在 ~/.hermes/.env 中设置 ARCEEAI_API_KEY

# GMI Cloud
# 使用 GMI 的 /v1/models 端点返回的确切模型 ID。
hermes chat --provider gmi --model zai-org/GLM-5.1-FP8
# 需要：在 ~/.hermes/.env 中设置 GMI_API_KEY
```

或者在 `config.yaml` 中永久设置服务提供商：
```yaml
model:
  provider: "gmi"
  default: "zai-org/GLM-5.1-FP8"
```

可以使用 `GLM_BASE_URL`、`KIMI_BASE_URL`、`MINIMAX_BASE_URL`、`MINIMAX_CN_BASE_URL`、`DASHSCOPE_BASE_URL`、`XIAOMI_BASE_URL`、`GMI_BASE_URL` 或 `TOKENHUB_BASE_URL` 环境变量覆盖基础 URL。

:::note Z.AI 端点自动检测
使用 Z.AI / GLM 服务提供商时，Hermes 会自动探测多个端点（全球、中国、编程变体）以找到接受您 API 密钥的端点。您无需手动设置 `GLM_BASE_URL` —— 工作端点会被自动检测并缓存。
:::

### xAI（Grok）—— Responses API + 提示缓存

xAI 通过 Responses API（`codex_responses` 传输）连接，以便在 Grok 4 模型上自动支持推理 —— 无需 `reasoning_effort` 参数，服务器默认进行推理。在 `~/.hermes/.env` 中设置 `XAI_API_KEY` 并在 `hermes model` 中选择 xAI，或者在 `/model` 中使用 `grok` 作为快捷方式，例如 `/model grok-4-1-fast-reasoning`。

当使用 xAI 作为服务提供商（任何包含 `x.ai` 的基础 URL）时，Hermes 会自动启用提示缓存，通过在每个 API 请求中发送 `x-grok-conv-id` 标头。这会将请求路由到同一会话中的同一服务器，允许 xAI 的基础设施重用缓存的系统提示和对话历史记录。

无需配置 —— 当检测到 xAI 端点并且会话 ID 可用时，缓存会自动激活。这降低了多轮对话的延迟和成本。

xAI 还提供专用的 TTS 端点（`/v1/tts`）。在 `hermes tools` → 语音 & TTS 中选择 **xAI TTS**，或参阅 [语音 & TTS](../user-guide/features/tts.md#text-to-speech) 页面进行配置。

### Ollama Cloud —— 托管 Ollama 模型，OAuth + API 密钥

[Ollama Cloud](https://ollama.com/cloud) 托管与本地 Ollama 相同的开源权重目录，但无需 GPU 要求。在 `hermes model` 中选择 **Ollama Cloud**，从 [ollama.com/settings/keys](https://ollama.com/settings/keys) 粘贴您的 API 密钥，Hermes 会自动发现可用模型。

```bash
hermes model
# → 选择“Ollama Cloud”
# → 粘贴您的 OLLAMA_API_KEY
# → 从发现的模型中选择（gpt-oss:120b、glm-4.6:cloud、qwen3-coder:480b-cloud 等）
```

或者直接在 `config.yaml` 中配置：
```yaml
model:
  provider: "ollama-cloud"
  default: "gpt-oss:120b"
```

模型目录会从 `ollama.com/v1/models` 动态获取并缓存一小时。`model:tag` 表示法（例如 `qwen3-coder:480b-cloud`）在规范化过程中会被保留 —— 不要使用连字符。

:::tip Ollama Cloud 与本地 Ollama
两者都使用相同的 OpenAI 兼容 API。Cloud 是一流的服务提供商（`--provider ollama-cloud`，`OLLAMA_API_KEY`）；本地 Ollama 通过自定义端点流程访问（基础 URL `http://localhost:11434/v1`，无需密钥）。对于无法在本地运行的大型模型，请使用 cloud；对于隐私或离线工作，请使用本地。
:::

### AWS Bedrock

通过 AWS Bedrock 使用 Anthropic Claude、Amazon Nova、DeepSeek v3.2、Meta Llama 4 和其他模型。使用 AWS SDK（`boto3`）凭据链 —— 无需 API 密钥，只需标准 AWS 认证。

```bash
# 最简单 —— ~/.aws/credentials 中的命名配置文件
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
  # guardrail:                 # 可选 Bedrock Guardrails
  #   id: "your-guardrail-id"
  #   version: "DRAFT"
```

认证使用标准的 boto3 链：显式 `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`、来自 `~/.aws/credentials` 的 `AWS_PROFILE`、EC2/ECS/Lambda 上的 IAM 角色、IMDS 或 SSO。如果您已经通过 AWS CLI 认证，则无需设置环境变量。

Bedrock 底层使用 **Converse API** —— 请求被转换为 Bedrock 的与模型无关的格式，因此相同的配置适用于 Claude、Nova、DeepSeek 和 Llama 模型。仅当您调用非默认区域端点时，才设置 `BEDROCK_BASE_URL`。

请参阅 [AWS Bedrock 指南](/docs/guides/aws-bedrock) 了解 IAM 设置、区域选择和跨区域推理的演练。

### Qwen Portal（OAuth）

阿里云的 Qwen Portal，支持基于浏览器的 OAuth 登录。在 `hermes model` 中选择 **Qwen OAuth（Portal）**，通过浏览器登录，Hermes 会保存刷新令牌。

```bash
hermes model
# → 选择“Qwen OAuth（Portal）”
# → 浏览器打开；使用您的阿里云账户登录
# → 确认 —— 凭据保存到 ~/.hermes/auth.json

hermes chat   # 使用 portal.qwen.ai/v1 端点
```

或者配置 `config.yaml`：
```yaml
model:
  provider: "qwen-oauth"
  default: "qwen3-coder-plus"
```

仅当门户端点迁移时，才设置 `HERMES_QWEN_BASE_URL`（默认：`https://portal.qwen.ai/v1`）。

:::tip Qwen OAuth 与 DashScope（阿里云）
`qwen-oauth` 使用面向消费者的 Qwen Portal 和 OAuth 登录 —— 适合个人用户。`alibaba` 服务提供商使用 DashScope 的企业 API 和 `DASHSCOPE_API_KEY` —— 适合编程 / 生产工作负载。两者都路由到 Qwen 系列模型，但位于不同的端点。
:::

### 阿里编程计划

如果您订阅了阿里云的**编程计划**（一个与标准 DashScope API 访问分开的定价 SKU），Hermes 将其作为自己的一流服务提供商公开：`alibaba-coding-plan`。端点：`https://coding-intl.dashscope.aliyuncs.com/v1`。它与常规的 `alibaba` 服务提供商一样兼容 OpenAI，但具有不同的基础 URL 和计费表面。

```yaml
model:
  provider: alibaba_coding     # alibaba-coding-plan 的别名
  model: qwen3-coder-plus
```

或者从 CLI：

```bash
hermes chat --provider alibaba_coding --model qwen3-coder-plus
```

`alibaba_coding` 使用您的 `alibaba` 条目已经使用的相同 `DASHSCOPE_API_KEY` —— 无需单独的密钥，只需不同的路由目标。在此服务提供商注册之前，在 `config.yaml` 中设置 `provider: alibaba_coding` 的用户会静默地回退到 OpenRouter 路由。

### MiniMax（OAuth）

通过浏览器 OAuth 登录使用 MiniMax-M2.7 —— 无需 API 密钥。在 `hermes model` 中选择 **MiniMax（OAuth）**，通过浏览器登录，Hermes 会保存访问令牌 + 刷新令牌。底层使用 Anthropic Messages 兼容端点（`/anthropic`）。

```bash
hermes model
# → 选择“MiniMax（OAuth）”
# → 浏览器打开；使用您的 MiniMax 账户登录（全球或 CN 区域）
# → 确认 —— 凭据保存到 ~/.hermes/auth.json

hermes chat   # 使用 api.minimax.io/anthropic 端点
```

或者配置 `config.yaml`：
```yaml
model:
  provider: "minimax-oauth"
  default: "MiniMax-M2.7"
```

支持的模型：`MiniMax-M2.7`（主要）和 `MiniMax-M2.7-highspeed`（作为默认辅助模型连接）。OAuth 路径忽略 `MINIMAX_API_KEY` / `MINIMAX_BASE_URL`。

:::tip MiniMax OAuth 与 API 密钥
`minimax-oauth` 使用 MiniMax 的面向消费者的门户和 OAuth 登录 —— 无需计费设置。`minimax` 和 `minimax-cn` 服务提供商使用 `MINIMAX_API_KEY` / `MINIMAX_CN_API_KEY` —— 用于编程访问。请参阅 [MiniMax OAuth 指南](/docs/guides/minimax-oauth) 了解完整演练。
:::

### NVIDIA NIM

通过 [build.nvidia.com](https://build.nvidia.com)（免费 API 密钥）或本地 NIM 端点使用 Nemotron 和其他开源模型。

```bash
# 云（build.nvidia.com）
hermes chat --provider nvidia --model nvidia/nemotron-3-super-120b-a12b
# 需要：在 ~/.hermes/.env 中设置 NVIDIA_API_KEY

# 本地 NIM 端点 —— 覆盖基础 URL
NVIDIA_BASE_URL=http://localhost:8000/v1 hermes chat --provider nvidia --model nvidia/nemotron-3-super-120b-a12b
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "nvidia"
  default: "nvidia/nemotron-3-super-120b-a12b"
```

:::tip 本地 NIM
对于本地部署（DGX Spark、本地 GPU），设置 `NVIDIA_BASE_URL=http://localhost:8000/v1`。NIM 暴露与 build.nvidia.com 相同的 OpenAI 兼容聊天完成 API，因此云和本地之间的切换只需更改一行环境变量。
:::

### GMI Cloud

通过 [GMI Cloud](https://inference.gmi.ai) 使用开源和推理模型 —— OpenAI 兼容 API，API 密钥认证。

```bash
# GMI Cloud
hermes chat --provider gmi --model deepseek-ai/DeepSeek-R1
# 需要：在 ~/.hermes/.env 中设置 GMI_API_KEY
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "gmi"
  default: "deepseek-ai/DeepSeek-R1"
```

可以使用 `GMI_BASE_URL` 覆盖基础 URL（默认：`https://api.gmi.ai/v1`）。

### StepFun

通过 [StepFun](https://platform.stepfun.com) 使用 Step 系列模型 —— OpenAI 兼容 API，API 密钥认证。

```bash
# StepFun
hermes chat --provider stepfun --model step-3-mini
# 需要：在 ~/.hermes/.env 中设置 STEPFUN_API_KEY
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "stepfun"
  default: "step-3-mini"
```

可以使用 `STEPFUN_BASE_URL` 覆盖基础 URL（默认：`https://api.stepfun.com/v1`）。

### Hugging Face 推理服务提供商

[Hugging Face 推理服务提供商](https://huggingface.co/docs/inference-providers) 通过统一的 OpenAI 兼容端点（`router.huggingface.co/v1`）路由到 20 多个开源模型。请求会自动路由到最快可用的后端（Groq、Together、SambaNova 等），并带有自动故障转移。

```bash
# 使用任何可用模型
hermes chat --provider huggingface --model Qwen/Qwen3-235B-A22B-Thinking-2507
# 需要：在 ~/.hermes/.env 中设置 HF_TOKEN

# 短别名
hermes chat --provider hf --model deepseek-ai/DeepSeek-V3.2
```

或者在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "huggingface"
  default: "Qwen/Qwen3-235B-A22B-Thinking-2507"
```

在 [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) 获取您的令牌 —— 确保启用“调用推理服务提供商”权限。包含免费层级（每月 $0.10 信用额度，服务提供商费率无加价）。

您可以将路由后缀附加到模型名称：`:fastest`（默认）、`:cheapest` 或 `:provider_name` 以强制使用特定后端。

可以使用 `HF_BASE_URL` 覆盖基础 URL。

## 自定义与自托管 LLM 提供商

Hermes Agent 支持**任何兼容 OpenAI 的 API 端点**。只要服务器实现了 `/v1/chat/completions` 接口，您就可以将 Hermes 指向该服务器。这意味着您可以使用本地模型、GPU 推理服务器、多提供商路由或任何第三方 API。

### 通用设置

配置自定义端点的三种方式：

**交互式设置（推荐）：**
```bash
hermes model
# 选择“自定义端点（自托管 / VLLM / 等）”
# 输入：API 基础 URL、API 密钥、模型名称
```

**手动配置（`config.yaml`）：**
```yaml
# 在 ~/.hermes/config.yaml 中
model:
  default: your-model-name
  provider: custom
  base_url: http://localhost:8000/v1
  api_key: your-key-or-leave-empty-for-local
```

:::warning 旧环境变量已弃用
`.env` 中的 `OPENAI_BASE_URL` 和 `LLM_MODEL` **已被移除**。Hermes 的任何部分都不会读取这两个变量——`config.yaml` 是模型与端点配置的唯一可信来源。如果您的 `.env` 文件中有陈旧条目，它们将在下次执行 `hermes setup` 或配置迁移时自动清除。请使用 `hermes model` 或直接编辑 `config.yaml`。
:::

两种方式都会将配置持久化到 `config.yaml`，该文件是模型、提供商和基础 URL 的唯一可信来源。

### 使用 `/model` 切换模型

:::warning hermes model 与 /model 的区别
**`hermes model`**（在终端中运行，不在任何聊天会话内）是**完整的提供商设置向导**。用于添加新提供商、执行 OAuth 流程、输入 API 密钥以及配置自定义端点。

**`/model`**（在活跃的 Hermes 聊天会话中输入）只能**在您已设置的提供商和模型之间切换**。它无法添加新提供商、执行 OAuth 或提示输入 API 密钥。如果您只配置了一个提供商（例如 OpenRouter），`/model` 将仅显示该提供商下的模型。

**添加新提供商：**退出当前会话（`Ctrl+C` 或 `/quit`），运行 `hermes model`，设置新提供商，然后启动新会话。
:::

一旦您配置了至少一个自定义端点，就可以在会话中途切换模型：

```
/model custom:qwen-2.5          # 切换到自定义端点上的模型
/model custom                    # 从端点自动检测模型
/model openrouter:claude-sonnet-4 # 切换回云提供商
```

如果您配置了**命名的自定义提供商**（见下文），请使用三重语法：

```
/model custom:local:qwen-2.5    # 使用名为 "local" 的自定义提供商及 qwen-2.5 模型
/model custom:work:llama3       # 使用名为 "work" 的自定义提供商及 llama3 模型
```

切换提供商时，Hermes 会将基础 URL 和提供商信息持久化到配置中，确保更改在重启后依然有效。当从自定义端点切换回内置提供商时，陈旧的基础 URL 会自动清除。

:::tip
`/model custom`（无模型名称）会查询端点的 `/models` API，并在仅加载一个模型时自动选择该模型。适用于运行单一模型的本地服务器。
:::

以下内容均遵循相同模式——只需更改 URL、密钥和模型名称即可。

---

### Ollama —— 本地模型，零配置

[Ollama](https://ollama.com/) 只需一条命令即可在本地运行开源权重模型。适用场景：快速本地实验、隐私敏感工作、离线使用。通过兼容 OpenAI 的 API 支持工具调用。

```bash
# 安装并运行模型
ollama pull qwen2.5-coder:32b
ollama serve   # 启动于端口 11434
```

然后配置 Hermes：

```bash
hermes model
# 选择“自定义端点（自托管 / VLLM / 等）”
# 输入 URL: http://localhost:11434/v1
# 跳过 API 密钥（Ollama 不需要）
# 输入模型名称（例如 qwen2.5-coder:32b）
```

或直接配置 `config.yaml`：

```yaml
model:
  default: qwen2.5-coder:32b
  provider: custom
  base_url: http://localhost:11434/v1
  context_length: 32768   # 见下方警告
```

:::caution Ollama 默认上下文长度极低
Ollama 默认**不会**使用模型的完整上下文窗口。根据您的显存大小，默认值为：

| 可用显存 | 默认上下文长度 |
|----------------|----------------|
| 小于 24 GB | **4,096 个 token** |
| 24–48 GB | 32,768 个 token |
| 48+ GB | 256,000 个 token |

对于使用工具的**智能体**，**您需要至少 16k–32k 的上下文长度**。若仅为 4k，系统提示词 + 工具 schema 就可能占满窗口，导致对话无空间可用。

**如何增加上下文长度**（任选其一）：

```bash
# 选项 1：通过环境变量全局设置（推荐）
OLLAMA_CONTEXT_LENGTH=32768 ollama serve

# 选项 2：针对 systemd 管理的 Ollama
sudo systemctl edit ollama.service
# 添加：Environment="OLLAMA_CONTEXT_LENGTH=32768"
# 然后：sudo systemctl daemon-reload && sudo systemctl restart ollama

# 选项 3：将其固化到自定义模型中（按模型持久化）
echo -e "FROM qwen2.5-coder:32b\nPARAMETER num_ctx 32768" > Modelfile
ollama create qwen2.5-coder-32k -f Modelfile
```

**您无法通过兼容 OpenAI 的 API（`/v1/chat/completions`）设置上下文长度**。必须在服务端或通过 Modelfile 配置。这是将 Ollama 与 Hermes 等工具集成时最易混淆的问题。
:::

**验证上下文是否设置正确：**

```bash
ollama ps
# 查看 CONTEXT 列——应显示您配置的值
```

:::tip
使用 `ollama list` 列出可用模型。使用 `ollama pull <model>` 从 [Ollama 库](https://ollama.com/library) 拉取任意模型。Ollama 自动处理 GPU 卸载——大多数设置无需额外配置。
:::

---

### vLLM —— 高性能 GPU 推理

[vLLM](https://docs.vllm.ai/) 是生产级 LLM 服务的标准。适用场景：在 GPU 硬件上实现最大吞吐量、服务大型模型、连续批处理。

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
# 选择“自定义端点（自托管 / VLLM / 等）”
# 输入 URL: http://localhost:8000/v1
# 跳过 API 密钥（或输入您为 vLLM 配置的 --api-key）
# 输入模型名称：meta-llama/Llama-3.1-70B-Instruct
```

**上下文长度：**vLLM 默认读取模型的 `max_position_embeddings`。若该值超出 GPU 内存，则会报错并要求您降低 `--max-model-len`。也可使用 `--max-model-len auto` 自动找到可容纳的最大值。设置 `--gpu-memory-utilization 0.95`（默认 0.9）可在显存中容纳更多上下文。

**工具调用需显式启用标志：**

| 标志 | 用途 |
|------|---------|
| `--enable-auto-tool-choice` | 必需，用于 `tool_choice: "auto"`（Hermes 默认） |
| `--tool-call-parser <name>` | 解析模型的工具调用格式 |

支持的解析器：`hermes`（Qwen 2.5, Hermes 2/3）、`llama3_json`（Llama 3.x）、`mistral`、`deepseek_v3`、`deepseek_v31`、`xlam`、`pythonic`。若无这些标志，工具调用将失效——模型会以文本形式输出工具调用。

:::tip
vLLM 支持人类可读尺寸：`--max-model-len 64k`（小写 k = 1000，大写 K = 1024）。
:::

---

### SGLang —— 基于 RadixAttention 的快速服务

[SGLang](https://github.com/sgl-project/sglang) 是 vLLM 的替代方案，采用 RadixAttention 实现 KV 缓存复用。适用场景：多轮对话（前缀缓存）、约束解码、结构化输出。

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
# 选择“自定义端点（自托管 / VLLM / 等）”
# 输入 URL: http://localhost:30000/v1
# 输入模型名称：meta-llama/Llama-3.1-70B-Instruct
```

**上下文长度：**SGLang 默认从模型配置中读取。使用 `--context-length` 覆盖。若需超过模型声明的最大值，请设置 `SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1`。

**工具调用：**使用 `--tool-call-parser` 并指定适合您模型家族的解析器：`qwen`（Qwen 2.5）、`llama3`、`llama4`、`deepseekv3`、`mistral`、`glm`。若无此标志，工具调用将以纯文本形式返回。

:::caution SGLang 默认最大输出 token 数为 128
若响应被截断，请在请求中添加 `max_tokens` 或在服务端设置 `--default-max-tokens`。若请求中未指定，SGLang 默认每响应仅生成 128 个 token。
:::

---

### llama.cpp / llama-server —— CPU 与 Metal 推理

[llama.cpp](https://github.com/ggml-org/llama.cpp) 可在 CPU、Apple Silicon（Metal）及消费级 GPU 上运行量化模型。适用场景：无数据中心 GPU 时运行模型、Mac 用户、边缘部署。

```bash
# 编译并启动 llama-server
cmake -B build && cmake --build build --config Release
./build/bin/llama-server \
  --jinja -fa \
  -c 32768 \
  -ngl 99 \
  -m models/qwen2.5-coder-32b-instruct-Q4_K_M.gguf \
  --port 8080 --host 0.0.0.0
```

**上下文长度（`-c`）：**近期版本默认值为 `0`，表示从 GGUF 元数据中读取模型的训练上下文。对于训练上下文达 128k+ 的模型，尝试分配完整 KV 缓存可能导致内存不足（OOM）。请显式设置 `-c` 为您所需值（智能体使用建议 32k–64k）。若使用并行槽位（`-np`），总上下文将被分配到各槽位——例如 `-c 32768 -np 4` 时，每个槽位仅获得 8k。

然后将 Hermes 指向该服务：

```bash
hermes model
# 选择“自定义端点（自托管 / VLLM / 等）”
# 输入 URL: http://localhost:8080/v1
# 跳过 API 密钥（本地服务器不需要）
# 输入模型名称——或留空以在仅加载一个模型时自动检测
```

此操作会将端点保存至 `config.yaml`，确保跨会话持久化。

:::caution `--jinja` 是实现工具调用功能的必要条件
如果没有 `--jinja`，llama-server 将完全忽略 `tools` 参数。模型会尝试通过在响应文本中写入 JSON 来调用工具，但 Hermes 不会将其识别为工具调用——你会看到类似 `{"name": "web_search", ...}` 的原始 JSON 作为消息打印出来，而不是实际执行搜索。

原生工具调用支持（性能最佳）：Llama 3.x、Qwen 2.5（包括 Coder）、Hermes 2/3、Mistral、DeepSeek、Functionary。其他所有模型均使用通用处理程序，虽然可用但效率可能较低。完整列表请参见 [llama.cpp 函数调用文档](https://github.com/ggml-org/llama.cpp/blob/master/docs/function-calling.md)。

你可以通过检查 `http://localhost:8080/props` 来验证工具调用是否已激活——`chat_template` 字段应该存在。
:::

:::tip
从 [Hugging Face](https://huggingface.co/models?library=gguf) 下载 GGUF 模型。Q4_K_M 量化在质量与内存使用之间提供了最佳平衡。
::}

---

### LM Studio —— 带本地模型的桌面应用

[LM Studio](https://lmstudio.ai/) 是一个用于运行本地模型的桌面应用，提供图形用户界面。最适合：偏好可视化界面的用户、快速测试模型、macOS/Windows/Linux 开发者。

从 LM Studio 应用启动服务器（开发者选项卡 → 启动服务器），或使用 CLI：

```bash
lms server start                        # 在端口 1234 启动
lms load qwen2.5-coder --context-length 32768
```

然后配置 Hermes：

```bash
hermes model
# 选择 "LM Studio"
# 按回车使用 http://localhost:1234/v1
# 选择一个发现的模型
# 如果 LM Studio 服务器启用了身份验证，请在提示时输入 LM_API_KEY
```

Hermes 将自动加载一个上下文长度为 64K 的 LM Studio 模型

要在 LM Studio 中更改上下文长度：

1. 点击模型选择器旁边的齿轮图标
2. 将“上下文长度”设置为至少 64000 以获得流畅体验
3. 重新加载模型以使更改生效
4. 如果你的机器无法容纳 64000，请考虑使用具有更大上下文长度的小型模型。

或者，使用 CLI：`lms load model-name --context-length 64000`

你可以使用 CLI 来估算模型是否适合：`lms load model-name --context-length 64000 --estimate-only`

要设置持久的每个模型默认值：我的模型选项卡 → 模型上的齿轮图标 → 设置上下文大小。
:::

**工具调用：** 自 LM Studio 0.3.6 起支持。具有原生工具调用训练的模型（Qwen 2.5、Llama 3.x、Mistral、Hermes）会被自动检测并显示工具徽章。其他模型使用通用回退方案，可能不太可靠。

---

### WSL2 网络（Windows 用户）

由于 Hermes 智能体需要 Unix 环境，Windows 用户需在 WSL2 中运行它。如果你的模型服务器（Ollama、LM Studio 等）运行在 **Windows 主机**上，你需要桥接网络间隙——WSL2 使用带有自己子网的虚拟网络适配器，因此 WSL2 中的 `localhost` 指的是 Linux 虚拟机，**而不是** Windows 主机。

:::tip 都在 WSL2 中？没问题。
如果你的模型服务器也运行在 WSL2 中（vLLM、SGLang 和 llama-server 的常见情况），`localhost` 按预期工作——它们共享相同的网络命名空间。跳过本节。
:::

#### 选项 1：镜像网络模式（推荐）

适用于 **Windows 11 22H2+**，镜像模式使 `localhost` 在 Windows 和 WSL2 之间双向工作——最简单的解决方案。

1. 创建或编辑 `%USERPROFILE%\.wslconfig`（例如 `C:\Users\YourName\.wslconfig`）：
   ```ini
   [wsl2]
   networkingMode=mirrored
   ```

2. 从 PowerShell 重启 WSL：
   ```powershell
   wsl --shutdown
   ```

3. 重新打开你的 WSL2 终端。`localhost` 现在可以访问 Windows 服务：
   ```bash
   curl http://localhost:11434/v1/models   # Windows 上的 Ollama —— 可行
   ```

:::note Hyper-V 防火墙
在某些 Windows 11 版本中，Hyper-V 防火墙默认阻止镜像连接。如果在启用镜像模式后 `localhost` 仍然无法工作，请在**管理员 PowerShell**中运行以下命令：
```powershell
Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow
```
:::

#### 选项 2：使用 Windows 主机 IP（Windows 10 / 旧版本）

如果你无法使用镜像模式，请从 WSL2 内部查找 Windows 主机 IP 并使用它而不是 `localhost`：

```bash
# 获取 Windows 主机 IP（WSL2 虚拟网络的默认网关）
ip route show | grep -i default | awk '{ print $3 }'
# 示例输出：172.29.192.1
```

在你的 Hermes 配置中使用该 IP：

```yaml
model:
  default: qwen2.5-coder:32b
  provider: custom
  base_url: http://172.29.192.1:11434/v1   # Windows 主机 IP，而非 localhost
```

:::tip 动态辅助
主机 IP 可能在 WSL2 重启时发生变化。你可以在 shell 中动态获取它：
```bash
export WSL_HOST=$(ip route show | grep -i default | awk '{ print $3 }')
echo "Windows 主机位于：$WSL_HOST"
curl http://$WSL_HOST:11434/v1/models   # 测试 Ollama
```

或者使用你的机器的 mDNS 名称（需要在 WSL2 中安装 `libnss-mdns`）：
```bash
sudo apt install libnss-mdns
curl http://$(hostname).local:11434/v1/models
```
:::

#### 服务器绑定地址（NAT 模式必需）

如果你使用**选项 2**（使用主机 IP 的 NAT 模式），Windows 上的模型服务器必须接受来自 `127.0.0.1` 外部的连接。默认情况下，大多数服务器仅监听 localhost —— NAT 模式下的 WSL2 连接来自不同的虚拟子网，将被拒绝。在镜像模式下，`localhost` 直接映射，因此默认的 `127.0.0.1` 绑定可以正常工作。

| 服务器 | 默认绑定 | 如何修复 |
|--------|-------------|------------|
| **Ollama** | `127.0.0.1` | 在启动 Ollama 前设置环境变量 `OLLAMA_HOST=0.0.0.0`（Windows 系统设置 → 环境变量，或编辑 Ollama 服务） |
| **LM Studio** | `127.0.0.1` | 在开发者选项卡 → 服务器设置中启用**“在网络上提供服务”** |
| **llama-server** | `127.0.0.1` | 在启动命令中添加 `--host 0.0.0.0` |
| **vLLM** | `0.0.0.0` | 默认已绑定到所有接口 |
| **SGLang** | `127.0.0.1` | 在启动命令中添加 `--host 0.0.0.0` |

**Windows 上的 Ollama（详细说明）：** Ollama 作为 Windows 服务运行。要设置 `OLLAMA_HOST`：
1. 打开**系统属性** → **环境变量**
2. 添加新的**系统变量**：`OLLAMA_HOST` = `0.0.0.0`
3. 重启 Ollama 服务（或重启系统）

#### Windows 防火墙

Windows 防火墙将 WSL2 视为单独的网络（在 NAT 和镜像模式下均如此）。如果在上述步骤后连接仍然失败，请为模型服务器的端口添加防火墙规则：

```powershell
# 在管理员 PowerShell 中运行 —— 将 PORT 替换为你的服务器端口
New-NetFirewallRule -DisplayName "允许 WSL2 访问模型服务器" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 11434
```

常见端口：Ollama `11434`、vLLM `8000`、SGLang `30000`、llama-server `8080`、LM Studio `1234`。

#### 快速验证

从 WSL2 内部测试是否可以访问你的模型服务器：

```bash
# 将 URL 替换为你的服务器地址和端口
curl http://localhost:11434/v1/models          # 镜像模式
curl http://172.29.192.1:11434/v1/models       # NAT 模式（使用你的实际主机 IP）
```

如果你收到列出模型的 JSON 响应，说明一切正常。在 Hermes 配置中将该 URL 用作 `base_url`。

---

### 本地模型故障排除

这些问题影响与 Hermes 一起使用的**所有**本地推理服务器。

#### 从 WSL2 到 Windows 托管的模型服务器出现“连接被拒绝”

如果你在 WSL2 中运行 Hermes 而在 Windows 主机上运行模型服务器，在 WSL2 默认的 NAT 网络模式下 `http://localhost:<port>` 将无法工作。请参见上面的 [WSL2 网络](#wsl2-networking-windows-users) 以获取解决方案。

#### 工具调用显示为文本而非执行

模型输出类似 `{"name": "web_search", "arguments": {...}}` 的消息，而不是实际调用工具。

**原因：** 你的服务器未启用工具调用，或模型不支持通过服务器的工具调用实现。

| 服务器 | 修复 |
|--------|-----|
| **llama.cpp** | 在启动命令中添加 `--jinja` |
| **vLLM** | 添加 `--enable-auto-tool-choice --tool-call-parser hermes` |
| **SGLang** | 添加 `--tool-call-parser qwen`（或适当的解析器） |
| **Ollama** | 工具调用默认已启用 —— 确保你的模型支持它（使用 `ollama show model-name` 检查） |
| **LM Studio** | 更新到 0.3.6+ 并使用具有原生工具支持的模型 |

#### 模型似乎忘记了上下文或给出不连贯的响应

**原因：** 上下文窗口太小。当对话超过上下文限制时，大多数服务器会静默丢弃旧消息。仅 Hermes 的系统提示 + 工具架构就可能使用 4k–8k 个 token。

**诊断：**

```bash
# 检查 Hermes 认为的上下文
# 查看启动行：“Context limit: X tokens”

# 检查你的服务器的实际上下文
# Ollama: ollama ps（CONTEXT 列）
# llama.cpp: curl http://localhost:8080/props | jq '.default_generation_settings.n_ctx'
# vLLM: 检查启动参数中的 --max-model-len
```

**修复：** 将上下文设置为至少 **32,768 个 token** 以用于智能体。请参见上面每个服务器的部分以获取特定标志。

#### 启动时显示“Context limit: 2048 tokens”

Hermes 会从服务器的 `/v1/models` 端点自动检测上下文长度。如果服务器报告的值较低（或根本不报告），Hermes 将使用模型声明的限制，这可能是不正确的。

**修复：** 在 `config.yaml` 中明确设置：

```yaml
model:
  default: your-model
  provider: custom
  base_url: http://localhost:11434/v1
  context_length: 32768
```

#### 响应在句子中间被截断

**可能的原因：**
1. **服务器输出上限（`max_tokens`）设置过低** —— SGLang 默认每次响应生成 128 个 token。请在服务器端设置 `--default-max-tokens`，或在 Hermes 的 config.yaml 中配置 `model.max_tokens`。注意：`max_tokens` 仅控制响应长度，与对话历史长度无关（后者由 `context_length` 控制）。
2. **上下文耗尽** —— 模型已填满其上下文窗口。请增加 `model.context_length`，或在 Hermes 中启用[上下文压缩](/docs/user-guide/configuration#context-compression)。

---

### LiteLLM 代理 —— 多提供商网关

[LiteLLM](https://docs.litellm.ai/) 是一个兼容 OpenAI 的代理，可将 100 多个大语言模型（LLM）提供商统一到单个 API 接口之后。适用场景：无需修改配置即可切换提供商、负载均衡、备用链路、预算控制。

```bash
# 安装并启动
pip install "litellm[proxy]"
litellm --model anthropic/claude-sonnet-4 --port 4000

# 或使用配置文件管理多个模型：
litellm --config litellm_config.yaml --port 4000
```

然后在 Hermes 中配置：`hermes model` → 自定义端点 → `http://localhost:4000/v1`。

带备用链路的 `litellm_config.yaml` 示例：
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

### ClawRouter —— 成本优化路由

[ClawRouter](https://github.com/BlockRunAI/ClawRouter) 由 BlockRunAI 开发，是一个本地路由代理，可根据查询复杂度自动选择模型。它从 14 个维度对请求进行分类，并将其路由至能够处理该任务的最便宜模型。支付通过 USDC 加密货币完成（无需 API 密钥）。

```bash
# 安装并启动
npx @blockrun/clawrouter    # 默认监听端口 8402
```

然后在 Hermes 中配置：`hermes model` → 自定义端点 → `http://localhost:8402/v1` → 模型名称填写 `blockrun/auto`。

路由策略配置：
| 策略 | 说明 | 节省比例 |
|---------|----------|---------|
| `blockrun/auto` | 质量与成本平衡 | 74-100% |
| `blockrun/eco` | 尽可能最便宜 | 95-100% |
| `blockrun/premium` | 最高质量模型 | 0% |
| `blockrun/free` | 仅限免费模型 | 100% |
| `blockrun/agentic` | 针对工具调用优化 | 视情况而定 |

:::note
ClawRouter 需要在 Base 或 Solana 链上拥有一个已充值 USDC 的钱包用于支付。所有请求均通过 BlockRun 的后端 API 路由。运行 `npx @blockrun/clawrouter doctor` 可检查钱包状态。
:::

---

### 其他兼容提供商

任何提供 OpenAI 兼容 API 的服务均可使用。以下是一些常用选项：

| 提供商 | 基础 URL | 说明 |
|----------|----------|-------|
| [Together AI](https://together.ai) | `https://api.together.xyz/v1` | 托管开源模型 |
| [Groq](https://groq.com) | `https://api.groq.com/openai/v1` | 超高速推理 |
| [DeepSeek](https://deepseek.com) | `https://api.deepseek.com/v1` | DeepSeek 系列模型 |
| [Fireworks AI](https://fireworks.ai) | `https://api.fireworks.ai/inference/v1` | 快速托管开源模型 |
| [GMI Cloud](https://www.gmicloud.ai/) | `https://api.gmi-serving.com/v1` | 托管 OpenAI 兼容推理服务 |
| [Cerebras](https://cerebras.ai) | `https://api.cerebras.ai/v1` | 晶圆级芯片推理 |
| [Mistral AI](https://mistral.ai) | `https://api.mistral.ai/v1` | Mistral 系列模型 |
| [OpenAI](https://openai.com) | `https://api.openai.com/v1` | 直接使用 OpenAI |
| [Azure OpenAI](https://azure.microsoft.com) | `https://YOUR.openai.azure.com/` | 企业级 OpenAI |
| [LocalAI](https://localai.io) | `http://localhost:8080/v1` | 自托管，支持多模型 |
| [Jan](https://jan.ai) | `http://localhost:1337/v1` | 桌面应用，支持本地模型 |

可通过 `hermes model` → 自定义端点，或在 `config.yaml` 中配置上述任意提供商：

```yaml
model:
  default: meta-llama/Llama-3.1-70B-Instruct-Turbo
  provider: custom
  base_url: https://api.together.xyz/v1
  api_key: your-together-key
```

---

### 上下文长度检测

:::note 两个易混淆的设置
**`context_length`** 表示**总上下文窗口大小** —— 即输入 *和* 输出 token 的总预算（例如 Claude Opus 4.6 为 200,000）。Hermes 据此决定何时压缩历史记录，并验证 API 请求是否合法。

**`model.max_tokens`** 表示**输出上限** —— 模型在*单次响应*中最多可生成的 token 数量。它与对话历史长度无关。行业标准术语 `max_tokens` 常引起混淆；Anthropic 的原生 API 已将其更名为 `max_output_tokens` 以提高清晰度。

当自动检测错误时，请手动设置 `context_length`。
仅当需要限制单次响应长度时，才设置 `model.max_tokens`。
:::

Hermes 采用多源解析链来检测您所用模型及提供商的正确上下文窗口：

1. **配置覆盖** —— config.yaml 中的 `model.context_length`（最高优先级）
2. **自定义提供商按模型设置** —— `custom_providers[].models.<id>.context_length`
3. **持久化缓存** —— 先前已发现的值（重启后仍有效）
4. **端点 `/models`** —— 查询您的服务器 API（本地/自定义端点）
5. **Anthropic `/v1/models`** —— 查询 Anthropic API 获取 `max_input_tokens`（仅限 API 密钥用户）
6. **OpenRouter API** —— 从 OpenRouter 获取实时模型元数据
7. **Nous Portal** —— 将 Nous 模型 ID 后缀与 OpenRouter 元数据匹配
8. **[models.dev](https://models.dev)** —— 社区维护的注册表，包含 100 多个提供商下 3800 多个模型的提供商特定上下文长度
9. **回退默认值** —— 广泛的模型家族模式（默认 128K）

对于大多数配置，此机制开箱即用。系统具备提供商感知能力 —— 同一模型在不同提供商处可能有不同的上下文限制（例如，`claude-opus-4.6` 在 Anthropic 直接访问时为 1M，但在 GitHub Copilot 上仅为 128K）。

如需显式设置上下文长度，请在模型配置中添加 `context_length`：

```yaml
model:
  default: "qwen3.5:9b"
  base_url: "http://localhost:8080/v1"
  context_length: 131072  # token 数量
```

对于自定义端点，也可按模型设置上下文长度：

```yaml
custom_providers:
  - name: "My Local LLM"
    base_url: "http://localhost:11434/v1"
    models:
      qwen3.5:27b:
        context_length: 32768
      deepseek-r1:70b:
        context_length: 65536
```

配置自定义端点时，`hermes model` 会提示输入上下文长度。留空则启用自动检测。

:::tip 何时需手动设置
- 您正在使用 Ollama，并设置了低于模型最大值的 `num_ctx`
- 您希望将上下文限制在低于模型最大值（例如在 128k 模型上设为 8k 以节省显存）
- 您运行在无法暴露 `/v1/models` 的代理之后
:::

---

### 命名自定义提供商

如果您需同时使用多个自定义端点（例如本地开发服务器和远程 GPU 服务器），可在 `config.yaml` 中将它们定义为命名的自定义提供商：

```yaml
custom_providers:
  - name: local
    base_url: http://localhost:8080/v1
    # api_key 省略 — Hermes 对无密钥本地服务器使用 "no-key-required"
  - name: work
    base_url: https://gpu-server.internal.corp/v1
    key_env: CORP_API_KEY
    api_mode: chat_completions   # 可选，通常从 URL 自动检测
  - name: anthropic-proxy
    base_url: https://proxy.example.com/anthropic
    key_env: ANTHROPIC_PROXY_KEY
    api_mode: anthropic_messages  # 适用于 Anthropic 兼容代理
```

可在会话中通过三重语法切换：

```
/model custom:local:qwen-2.5       # 使用 "local" 端点及 qwen-2.5 模型
/model custom:work:llama3-70b      # 使用 "work" 端点及 llama3-70b 模型
/model custom:anthropic-proxy:claude-sonnet-4  # 使用代理
```

也可从交互式 `hermes model` 菜单中选择命名的自定义提供商。

---

### 实践指南：Together AI、Groq、Perplexity

[其他兼容提供商](#other-compatible-providers) 中列出的云服务商均使用 OpenAI 的 REST 方言，因此均可通过 `custom_providers:` 统一接入。以下是三个已验证的配置示例。每个配置均放入 `~/.hermes/config.yaml`，对应的 API 密钥放入 `~/.hermes/.env`。

#### Together AI

托管开源权重模型（Llama、MiniMax、Gemma、DeepSeek、Qwen），价格显著低于官方 API。是多模型集群的良好默认选择。

```yaml
# ~/.hermes/config.yaml
custom_providers:
  - name: together
    base_url: https://api.together.xyz/v1
    key_env: TOGETHER_API_KEY
    # api_mode: chat_completions  # 默认值，无需显式设置

model:
  default: MiniMaxAI/MiniMax-M2.7   # 或 together.ai/models 中任意模型
  provider: custom:together
```

```bash
# ~/.hermes/.env
TOGETHER_API_KEY=your-together-key
```

会话中切换模型：

```
/model custom:together:meta-llama/Llama-3.3-70B-Instruct-Turbo
/model custom:together:google/gemma-4-31b-it
/model custom:together:deepseek-ai/DeepSeek-V3
```

Together 的 `/v1/models` 端点可用，因此 `hermes model` 可自动发现可用模型。

#### Groq

超高速推理（Llama-3.3-70B 可达约 500 tok/s）。模型目录较小，但对延迟敏感的交互场景表现优异。

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

当您希望模型自动执行实时网页搜索并生成引用时非常有用。对可用模型有严格限制 —— 请查看 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 获取最新列表。

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

#### 一个配置中包含多个提供商

这三个配方可以组合使用 —— 将它们全部一起使用，并通过 `/model custom:<名称>:<模型>` 每轮切换：

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

:::提示 故障排除
- 在 CLI 验证器修复（#15083）之后，`hermes doctor` 不应针对这些名称中的任何一个打印“未知提供商”警告。
- 如果某个提供商的 `/v1/models` 端点无法访问（Perplexity 是常见情况），`hermes model` 将保留该模型并发出警告，而不是硬性拒绝 —— 参见 #15136。
- 要完全跳过 `custom_providers:` 并使用裸 `provider: custom` 配合 `CUSTOM_BASE_URL` 环境变量，请参见 #15103。
:::

---

### 选择合适的配置

| 使用场景 | 推荐 |
|----------|-------------|
| **只想让它工作** | OpenRouter（默认）或 Nous Portal |
| **本地模型，易于设置** | Ollama |
| **生产级 GPU 服务** | vLLM 或 SGLang |
| **Mac / 无 GPU** | Ollama 或 llama.cpp |
| **多提供商路由** | LiteLLM 代理或 OpenRouter |
| **成本优化** | ClawRouter 或 OpenRouter（使用 `sort: "price"`） |
| **最高隐私性** | Ollama、vLLM 或 llama.cpp（完全本地） |
| **企业 / Azure** | Azure OpenAI（自定义端点） |
| **中文 AI 模型** | z.ai（GLM）、Kimi/Moonshot（`kimi-coding` 或 `kimi-coding-cn`）、MiniMax、小米 MiMo 或腾讯 TokenHub（一级提供商） |

:::提示
您可以随时使用 `hermes model` 在提供商之间切换 —— 无需重启。无论您使用哪个提供商，您的对话历史、记忆和技能都会保留。
:::
## 可选 API 密钥

| 功能 | 提供商 | 环境变量 |
|---------|----------|--------------|
| 网页抓取 | [Firecrawl](https://firecrawl.dev/) | `FIRECRAWL_API_KEY`、`FIRECRAWL_API_URL` |
| 浏览器自动化 | [Browserbase](https://browserbase.com/) | `BROWSERBASE_API_KEY`、`BROWSERBASE_PROJECT_ID` |
| 图像生成 | [FAL](https://fal.ai/) | `FAL_KEY` |
| 高级 TTS 语音 | [ElevenLabs](https://elevenlabs.io/) | `ELEVENLABS_API_KEY` |
| OpenAI TTS + 语音转录 | [OpenAI](https://platform.openai.com/api-keys) | `VOICE_TOOLS_OPENAI_KEY` |
| Mistral TTS + 语音转录 | [Mistral](https://console.mistral.ai/) | `MISTRAL_API_KEY` |
| 强化学习训练 | [Tinker](https://tinker-console.thinkingmachines.ai/) + [WandB](https://wandb.ai/) | `TINKER_API_KEY`、`WANDB_API_KEY` |
| 跨会话用户建模 | [Honcho](https://honcho.dev/) | `HONCHO_API_KEY` |
| 语义长期记忆 | [Supermemory](https://supermemory.ai) | `SUPERMEMORY_API_KEY` |

### 自托管 Firecrawl

默认情况下，Hermes 使用 [Firecrawl 云 API](https://firecrawl.dev/) 进行网页搜索和抓取。如果您更愿意在本地运行 Firecrawl，您可以将 Hermes 指向一个自托管实例。请参见 Firecrawl 的 [SELF_HOST.md](https://github.com/firecrawl/firecrawl/blob/main/SELF_HOST.md) 以获取完整的设置说明。

**您将获得：** 无需 API 密钥，无限速，无每页成本，完全的数据主权。

**您将失去：** 云版本使用 Firecrawl 专有的“Fire-engine”进行高级反机器人绕过（Cloudflare、验证码、IP 轮换）。自托管版本使用基本的 fetch + Playwright，因此某些受保护的网站可能会失败。搜索使用 DuckDuckGo 而不是 Google。

**设置：**

1. 克隆并启动 Firecrawl Docker 栈（5 个容器：API、Playwright、Redis、RabbitMQ、PostgreSQL —— 需要约 4-8 GB 内存）：
   ```bash
   git clone https://github.com/firecrawl/firecrawl
   cd firecrawl
   # 在 .env 中设置：USE_DB_AUTHENTICATION=false, HOST=0.0.0.0, PORT=3002
   docker compose up -d
   ```

2. 将 Hermes 指向您的实例（无需 API 密钥）：
   ```bash
   hermes config set FIRECRAWL_API_URL http://localhost:3002
   ```

如果您的自托管实例启用了身份验证，您也可以同时设置 `FIRECRAWL_API_KEY` 和 `FIRECRAWL_API_URL`。

## OpenRouter 提供商路由

使用 OpenRouter 时，您可以控制请求如何在提供商之间路由。在 `~/.hermes/config.yaml` 中添加一个 `provider_routing` 部分：

```yaml
provider_routing:
  sort: "throughput"          # "price"（默认）、"throughput" 或 "latency"
  # only: ["anthropic"]      # 仅使用这些提供商
  # ignore: ["deepinfra"]    # 跳过这些提供商
  # order: ["anthropic", "google"]  # 按此顺序尝试提供商
  # require_parameters: true  # 仅使用支持所有请求参数的提供商
  # data_collection: "deny"   # 排除可能存储/训练数据的提供商
```

**快捷方式：** 在任何模型名称后附加 `:nitro` 以实现吞吐量排序（例如，`anthropic/claude-sonnet-4:nitro`），或附加 `:floor` 以实现价格排序。

## 备用模型

配置一个备份 提供商:模型，当您的主模型失败时（速率限制、服务器错误、身份验证失败），Hermes 会自动切换到该备用模型：

```yaml
fallback_model:
  provider: openrouter                    # 必需
  model: anthropic/claude-sonnet-4        # 必需
  # base_url: http://localhost:8000/v1    # 可选，用于自定义端点
  # key_env: MY_CUSTOM_KEY               # 可选，自定义端点 API 密钥的环境变量名称
```

激活时，备用模型会在会话中途交换模型和提供商，而不会丢失您的对话。每个会话最多触发**一次**。

支持的提供商：`openrouter`、`nous`、`openai-codex`、`copilot`、`copilot-acp`、`anthropic`、`gemini`、`google-gemini-cli`、`qwen-oauth`、`huggingface`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`minimax-oauth`、`deepseek`、`nvidia`、`xai`、`ollama-cloud`、`bedrock`、`ai-gateway`、`opencode-zen`、`opencode-go`、`kilocode`、`xiaomi`、`arcee`、`gmi`、`stepfun`、`alibaba`、`tencent-tokenhub`、`custom`。

:::提示
备用模型仅通过 `config.yaml` 配置 —— 没有对应的环境变量。有关其触发时机、支持的提供商以及它如何与辅助任务和委派交互的详细信息，请参见 [备用提供商](/docs/user-guide/features/fallback-providers)。
:::

---

## 另见

- [配置](/docs/user-guide/configuration) —— 常规配置（目录结构、配置优先级、终端后端、记忆、压缩等）
- [环境变量](/docs/reference/environment-variables) —— 所有环境变量的完整参考