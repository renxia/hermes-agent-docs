---
title: "AI 提供商"
sidebar_label: "AI 提供商"
sidebar_position: 1
---

# AI 提供商

本页面涵盖了为 Hermes 智能体配置推理提供商的相关内容——从 OpenRouter 和 Anthropic 等云端 API，到 Ollama 和 vLLM 等自托管端点，再到高级路由与回退配置。您需要至少配置一个提供商才能使用 Hermes。

## 推理提供商

你至少需要一种方式来连接大语言模型。使用 `hermes model` 来交互式地切换提供商和模型，或直接进行配置：

| 提供商 | 设置 |
|----------|-------|
| **Nous Portal** | `hermes model`（OAuth，基于订阅） |
| **OpenAI Codex** | `hermes model`（ChatGPT OAuth，使用 Codex 模型） |
| **GitHub Copilot** | `hermes model`（OAuth 设备码流程，`COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 或 `gh auth token`） |
| **GitHub Copilot ACP** | `hermes model`（在本地启动 `copilot --acp --stdio`） |
| **Anthropic** | `hermes model`（Claude Max + 额外使用额度，通过 OAuth；也支持 Anthropic API 密钥或手动 setup-token —— 参见下方说明） |
| **OpenRouter** | 在 `~/.hermes/.env` 中设置 `OPENROUTER_API_KEY` |
| **NovitaAI** | 在 `~/.hermes/.env` 中设置 `NOVITA_API_KEY`（provider: `novita`，200+ 模型，Model API，Agent Sandbox，GPU Cloud） |
| **z.ai / GLM** | 在 `~/.hermes/.env` 中设置 `GLM_API_KEY`（provider: `zai`） |
| **Kimi / Moonshot** | 在 `~/.hermes/.env` 中设置 `KIMI_API_KEY`（provider: `kimi-coding`） |
| **Kimi / Moonshot（中国）** | 在 `~/.hermes/.env` 中设置 `KIMI_CN_API_KEY`（provider: `kimi-coding-cn`；别名：`kimi-cn`、`moonshot-cn`） |
| **Arcee AI** | 在 `~/.hermes/.env` 中设置 `ARCEEAI_API_KEY`（provider: `arcee`；别名：`arcee-ai`、`arceeai`） |
| **GMI Cloud** | 在 `~/.hermes/.env` 中设置 `GMI_API_KEY`（provider: `gmi`；别名：`gmi-cloud`、`gmicloud`） |
| **MiniMax** | 在 `~/.hermes/.env` 中设置 `MINIMAX_API_KEY`（provider: `minimax`） |
| **MiniMax 中国** | 在 `~/.hermes/.env` 中设置 `MINIMAX_CN_API_KEY`（provider: `minimax-cn`） |
| **xAI (Grok) — Responses API** | 在 `~/.hermes/.env` 中设置 `XAI_API_KEY`（provider: `xai`） |
| **xAI Grok OAuth (SuperGrok)** | `hermes model` → "xAI Grok OAuth (SuperGrok / Premium+)" —— 浏览器登录，无需 API 密钥。参见[指南](../guides/xai-grok-oauth.md) |
| **通义千问云（阿里 DashScope）** | 在 `~/.hermes/.env` 中设置 `DASHSCOPE_API_KEY`（provider: `alibaba`） |
| **阿里云（Coding 计划）** | `DASHSCOPE_API_KEY`（provider: `alibaba-coding-plan`，别名：`alibaba_coding`）—— 独立计费 SKU，不同端点 |
| **Kilo Code** | 在 `~/.hermes/.env` 中设置 `KILOCODE_API_KEY`（provider: `kilocode`） |
| **小米 MiMo** | 在 `~/.hermes/.env` 中设置 `XIAOMI_API_KEY`（provider: `xiaomi`，别名：`mimo`、`xiaomi-mimo`） |
| **腾讯 TokenHub** | 在 `~/.hermes/.env` 中设置 `TOKENHUB_API_KEY`（provider: `tencent-tokenhub`，别名：`tencent`、`tokenhub`、`tencentmaas`） |
| **OpenCode Zen** | 在 `~/.hermes/.env` 中设置 `OPENCODE_ZEN_API_KEY`（provider: `opencode-zen`） |
| **OpenCode Go** | 在 `~/.hermes/.env` 中设置 `OPENCODE_GO_API_KEY`（provider: `opencode-go`） |
| **DeepSeek** | 在 `~/.hermes/.env` 中设置 `DEEPSEEK_API_KEY`（provider: `deepseek`） |
| **Hugging Face** | 在 `~/.hermes/.env` 中设置 `HF_TOKEN`（provider: `huggingface`，别名：`hf`） |
| **Google / Gemini** | 在 `~/.hermes/.env` 中设置 `GOOGLE_API_KEY`（或 `GEMINI_API_KEY`）（provider: `gemini`） |
| **Google Gemini (OAuth)** | `hermes model` → "Google Gemini (OAuth)"（provider: `google-gemini-cli`，支持免费层级，浏览器 PKCE 登录） |
| **OpenAI API（直接）** | 在 `~/.hermes/.env` 中设置 `OPENAI_API_KEY`（provider: `openai-api`，可选 `OPENAI_BASE_URL`） |
| **Azure AI Foundry** | `hermes model` → "Azure AI Foundry"（provider: `azure-foundry`；使用 Azure OpenAI / Foundry 端点和密钥） |
| **AWS Bedrock** | `hermes model` → "AWS Bedrock"（provider: `bedrock`；通过 boto3 使用标准 AWS 凭据链） |
| **NVIDIA Build** | 在 `~/.hermes/.env` 中设置 `NVIDIA_API_KEY`（provider: `nvidia`；在 build.nvidia.com 上通过 NIM 托管的模型） |
| **Ollama Cloud** | `hermes model` → "Ollama Cloud"（provider: `ollama-cloud`；云端托管的 Ollama API） |
| **通义千问 OAuth** | `hermes model` → "Qwen OAuth"（provider: `qwen-oauth`；浏览器 PKCE 登录） |
| **MiniMax OAuth** | `hermes model` → "MiniMax (OAuth)"（provider: `minimax-oauth`；浏览器 PKCE 登录） |
| **StepFun** | 在 `~/.hermes/.env` 中设置 `STEPFUN_API_KEY`（provider: `stepfun`） |
| **LM Studio** | `hermes model` → "LM Studio"（provider: `lmstudio`，可选 `LM_API_KEY`） |
| **自定义端点** | `hermes model` → 选择 "Custom endpoint"（保存在 `config.yaml` 中） |

关于官方 API 密钥路径，请参阅专门的 [Google Gemini 指南](/guides/google-gemini)。

:::tip 模型键别名
在 `model:` 配置部分中，你可以使用 `default:` 或 `model:` 作为模型 ID 的键名。`model: { default: my-model }` 和 `model: { model: my-model }` 的效果完全相同。
:::


### Nous Portal

[Nous Portal](https://portal.nousresearch.com) 是 Nous Research 的统一订阅网关，也是**运行 Hermes 智能体的推荐方式**。一次 OAuth 登录即可覆盖 300+ 前沿智能体模型（Claude、GPT、Gemini、DeepSeek、Qwen、Kimi、GLM、MiniMax、Grok 等），加上 [工具网关](/user-guide/features/tool-gateway)（网页搜索、图像生成、TTS、浏览器自动化），再加上 [Nous Chat](https://chat.nousresearch.com) —— 费用通过你的 Nous 订阅计费，而非各提供商的独立账户。

```bash
hermes setup --portal     # 全新安装 —— 一个命令完成 OAuth + 提供商 + 网关配置
hermes model              # 已有安装 —— 从列表中选择 "Nous Portal"
hermes portal status      # 随时查看登录和路由状态
```

还没有订阅？前往 [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription) 获取。

**完整详情：** 请参阅专门的 [Nous Portal 集成页面](/integrations/nous-portal)（订阅包含的内容、模型目录、故障排除）以及分步指南 [使用 Nous Portal 运行 Hermes 智能体](/guides/run-hermes-with-nous-portal)。

**客户端标识。** Hermes 智能体的每个 Portal 请求都带有 `client=hermes-client-v&lt;version&gt;` 标签（例如 `client=hermes-client-v0.13.0`），自动与你安装的版本对齐。该标签在所有 Portal 通道上发送 —— 主聊天循环、辅助调用、压缩摘要器、网页提取 —— 使 Portal 端的遥测能够区分 Hermes 流量和其他客户端。无需配置；当你执行 `hermes update` 时标签会自动更新。

**JWT 认证（自动）。** Hermes 优先为 Portal 请求使用带作用域的 `inference:invoke` JWT，以传统的不透明会话密钥路径作为回退。无需配置 —— 凭据由 OAuth 流程管理并透明轮换。被撤销的刷新令牌会被隔离以避免重放循环。


:::info Codex 说明
OpenAI Codex 提供商通过设备码认证（打开一个 URL，输入一个代码）。Hermes 将生成的凭据存储在 `~/.hermes/auth.json` 的自有认证存储中，并可在存在 `~/.codex/auth.json` 时导入现有的 Codex CLI 凭据。不需要安装 Codex CLI。

如果令牌刷新以终端错误失败（HTTP 4xx、`invalid_grant`、已撤销的授权等），Hermes 会将刷新令牌标记为失效并停止重放它，这样你就不会看到大量重复的认证失败信息。下一个请求会显示一个有类型的重新认证消息。运行 `hermes auth add codex-oauth`（或 `hermes model` → OpenAI Codex）来启动一次新的设备码登录；隔离状态会在下次成功交换后清除。
:::

:::warning
即使使用 Nous Portal、Codex 或自定义端点，某些工具（视觉、网页摘要、MoA）使用独立的"辅助"模型。默认情况下（`auxiliary.*.provider: "auto"`），Hermes 将这些任务路由到你的**主聊天模型** —— 即你在 `hermes model` 中选择的同一模型。你可以单独覆盖每个任务，将其路由到更便宜/更快的模型（例如 OpenRouter 上的 Gemini Flash）—— 参见[辅助模型](/user-guide/configuration#auxiliary-models)。
:::

:::tip Nous 工具网关
付费 Nous Portal 订阅者还可以访问**[工具网关](/user-guide/features/tool-gateway)** —— 网页搜索、图像生成、TTS 和浏览器自动化，通过你的订阅路由。无需额外的 API 密钥。在全新安装时，`hermes setup --portal` 一个命令即可完成登录、将 Nous 设置为提供商并启用网关。现有用户可以从 `hermes model` 或通过 `hermes tools` 按工具启用。随时使用 `hermes portal status` 查看路由状态。
:::

### 模型管理的两个命令

Hermes 有**两个**模型命令，用途各不相同：

| 命令 | 运行位置 | 功能 |
|---------|-------------|--------------|
| **`hermes model`** | 你的终端（在任何会话之外） | 完整设置向导 —— 添加提供商、运行 OAuth、输入 API 密钥、配置端点 |
| **`/model`** | 在 Hermes 聊天会话内 | 在**已配置的**提供商和模型之间快速切换 |

如果你要切换到尚未设置的提供商（例如你只配置了 OpenRouter 但想使用 Anthropic），你需要 `hermes model`，而不是 `/model`。先退出你的会话（`Ctrl+C` 或 `/quit`），运行 `hermes model`，完成提供商设置，然后启动新会话。


### Anthropic（原生）

通过 Anthropic API 直接使用 Claude 模型 —— 无需 OpenRouter 代理。支持三种认证方式：

:::caution 需要 Claude Max "额外使用"额度
当你通过 `hermes model` → Anthropic OAuth 认证（或通过 `hermes auth add anthropic --type oauth`），Hermes 会以 Claude Code 身份路由请求到你的 Anthropic 账户。**仅当你订阅了 Claude Max 计划并购买了额外使用额度时才有效。** 基础 Max 计划配额（Claude Code 默认包含的使用量）不会被 Hermes 消耗 —— 只消耗你额外添加的超额额度。Claude Pro 订阅者无法使用此路径。

如果你没有 Max + 额外额度，请改用 `ANTHROPIC_API_KEY` —— 请求按该密钥所属组织的 Token 用量计费（标准 API 定价，独立于任何 Claude 订阅）。
:::

```bash
# 使用 API 密钥（按 Token 付费）
export ANTHROPIC_API_KEY=***
hermes chat --provider anthropic --model claude-sonnet-4-6

# 推荐：通过 `hermes model` 认证
# 可用时 Hermes 会直接使用 Claude Code 的凭据存储
hermes model

# 使用 setup-token 手动覆盖（回退 / 旧版方式）
export ANTHROPIC_TOKEN=***  # setup-token 或手动 OAuth 令牌
hermes chat --provider anthropic

# 自动检测 Claude Code 凭据（如果你已经在使用 Claude Code）
hermes chat --provider anthropic  # 自动读取 Claude Code 凭据文件
```

当你通过 `hermes model` 选择 Anthropic OAuth 时，Hermes 优先使用 Claude Code 自有的凭据存储，而非将令牌复制到 `~/.hermes/.env`。这确保了可刷新的 Claude 凭据保持可刷新状态。

或者永久设置：
```yaml
model:
  provider: "anthropic"
  default: "claude-sonnet-4-6"
```

:::tip 别名
`--provider claude` 和 `--provider claude-code` 也可作为 `--provider anthropic` 的简写使用。
:::

### GitHub Copilot

Hermes 将 GitHub Copilot 作为一等提供商支持，提供两种模式：

**`copilot` —— 直接 Copilot API**（推荐）。使用你的 GitHub Copilot 订阅通过 Copilot API 访问 GPT-5.x、Claude、Gemini 和其他模型。

```bash
hermes chat --provider copilot --model gpt-5.4
```

**认证选项**（按以下顺序检查）：

1. `COPILOT_GITHUB_TOKEN` 环境变量
2. `GH_TOKEN` 环境变量
3. `GITHUB_TOKEN` 环境变量
4. `gh auth token` CLI 回退

如果未找到令牌，`hermes model` 会提供 **OAuth 设备码登录** —— 与 Copilot CLI 和 opencode 使用的流程相同。

:::warning 令牌类型
Copilot API **不支持**经典个人访问令牌（`ghp_*`）。支持的令牌类型：

| 类型 | 前缀 | 获取方式 |
|------|--------|------------|
| OAuth 令牌 | `gho_` | `hermes model` → GitHub Copilot → Login with GitHub |
| 细粒度 PAT | `github_pat_` | GitHub Settings → Developer settings → Fine-grained tokens（需要 **Copilot Requests** 权限） |
| GitHub App 令牌 | `ghu_` | 通过 GitHub App 安装获取 |

如果你的 `gh auth token` 返回 `ghp_*` 令牌，请改用 `hermes model` 通过 OAuth 认证。
:::

:::info Hermes 中的 Copilot 认证行为
Hermes 将支持的 GitHub 令牌（`gho_*`、`github_pat_*` 或 `ghu_*`）直接发送到 `api.githubcopilot.com`，并包含 Copilot 特定的请求头（`Editor-Version`、`Copilot-Integration-Id`、`Openai-Intent`、`x-initiator`）。

在 HTTP 401 时，Hermes 现在会执行一次性凭据恢复后再回退：

1. 通过正常优先级链重新解析令牌（`COPILOT_GITHUB_TOKEN` → `GH_TOKEN` → `GITHUB_TOKEN` → `gh auth token`）
2. 使用刷新后的请求头重建共享的 OpenAI 客户端
3. 重试一次请求

一些较早的社区代理使用 `api.github.com/copilot_internal/v2/token` 交换流程。该端点对某些账户类型可能不可用（返回 404）。因此，Hermes 保持直接令牌认证作为主要路径，并依赖运行时凭据刷新 + 重试来保证健壮性。
:::

**API 路由**：GPT-5+ 模型（除 `gpt-5-mini` 外）自动使用 Responses API。所有其他模型（GPT-4o、Claude、Gemini 等）使用 Chat Completions。模型从实时 Copilot 目录自动检测。

**`copilot-acp` —— Copilot ACP 智能体后端**。将本地 Copilot CLI 作为子进程启动：

```bash
hermes chat --provider copilot-acp --model copilot-acp
# 需要 PATH 中有 GitHub Copilot CLI 且已有 `copilot login` 会话
```

**永久配置：**
```yaml
model:
  provider: "copilot"
  default: "gpt-5.4"
```

| 环境变量 | 说明 |
|---------------------|-------------|
| `COPILOT_GITHUB_TOKEN` | Copilot API 的 GitHub 令牌（最高优先级） |
| `HERMES_COPILOT_ACP_COMMAND` | 覆盖 Copilot CLI 二进制文件路径（默认：`copilot`） |
| `HERMES_COPILOT_ACP_ARGS` | 覆盖 ACP 参数（默认：`--acp --stdio`） |

### 一等 API 密钥提供商

这些提供商具有内置支持和专用的提供商 ID。设置 API 密钥后使用 `--provider` 选择：

```bash
# NovitaAI Model API
hermes chat --provider novita --model moonshotai/kimi-k2.5
# 需要：~/.hermes/.env 中的 NOVITA_API_KEY

# z.ai / 智谱 GLM
hermes chat --provider zai --model glm-5
# 需要：~/.hermes/.env 中的 GLM_API_KEY

# Kimi / Moonshot AI（国际版：api.moonshot.ai）
hermes chat --provider kimi-coding --model kimi-for-coding
# 需要：~/.hermes/.env 中的 KIMI_API_KEY

# Kimi / Moonshot AI（中国版：api.moonshot.cn）
hermes chat --provider kimi-coding-cn --model kimi-k2.5
# 需要：~/.hermes/.env 中的 KIMI_CN_API_KEY

# MiniMax（全球端点）
hermes chat --provider minimax --model MiniMax-M2.7
# 需要：~/.hermes/.env 中的 MINIMAX_API_KEY

# MiniMax（中国端点）
hermes chat --provider minimax-cn --model MiniMax-M2.7
# 需要：~/.hermes/.env 中的 MINIMAX_CN_API_KEY

# 通义千问云 / DashScope（Qwen 模型）
hermes chat --provider alibaba --model qwen3.5-plus
# 需要：~/.hermes/.env 中的 DASHSCOPE_API_KEY

# 小米 MiMo
hermes chat --provider xiaomi --model mimo-v2-pro
# 需要：~/.hermes/.env 中的 XIAOMI_API_KEY

# 腾讯 TokenHub（Hy3 Preview）
hermes chat --provider tencent-tokenhub --model hy3-preview
# 需要：~/.hermes/.env 中的 TOKENHUB_API_KEY

# Arcee AI（Trinity 模型）
hermes chat --provider arcee --model trinity-large-thinking
# 需要：~/.hermes/.env 中的 ARCEEAI_API_KEY

# GMI Cloud
# 请使用 GMI 的 /v1/models 端点返回的确切模型 ID。
hermes chat --provider gmi --model zai-org/GLM-5.1-FP8
# 需要：~/.hermes/.env 中的 GMI_API_KEY
```

或在 `config.yaml` 中永久设置提供商：
```yaml
model:
  provider: "gmi"
  default: "zai-org/GLM-5.1-FP8"
```

基础 URL 可通过 `NOVITA_BASE_URL`、`GLM_BASE_URL`、`KIMI_BASE_URL`、`MINIMAX_BASE_URL`、`MINIMAX_CN_BASE_URL`、`DASHSCOPE_BASE_URL`、`XIAOMI_BASE_URL`、`GMI_BASE_URL` 或 `TOKENHUB_BASE_URL` 环境变量覆盖。

:::note Z.AI 端点自动检测
使用 Z.AI / GLM 提供商时，Hermes 会自动探测多个端点（全球、中国、编程变体）以找到接受你 API 密钥的端点。你无需手动设置 `GLM_BASE_URL` —— 有效的端点会被自动检测并缓存。
:::

### xAI (Grok) — Responses API + 提示缓存

xAI 通过 Responses API（`codex_responses` 传输）接入，为 Grok 4 模型提供自动推理支持 —— 无需 `reasoning_effort` 参数，服务器默认进行推理。在 `~/.hermes/.env` 中设置 `XAI_API_KEY` 并在 `hermes model` 中选择 xAI，或直接在 `/model` 中使用 `grok` 作为快捷方式输入 `grok-4-fast-reasoning`。

SuperGrok 和 X Premium+ 订阅者可以使用浏览器 OAuth 登录而无需 API 密钥 —— 在 `hermes model` 中选择 **xAI Grok OAuth (SuperGrok / Premium+)**，或运行 `hermes auth add xai-oauth`。相同的 OAuth Bearer 令牌会被直接调用 xAI 的工具（TTS、图像生成、视频生成、转录）自动复用。参见 [xAI Grok OAuth 指南](../guides/xai-grok-oauth.md) 了解完整流程 —— 如果 Hermes 运行在远程主机上，还需参见 [SSH / 远程主机上的 OAuth](../guides/oauth-over-ssh.md) 了解所需的 `ssh -L` 隧道。

当使用 xAI 作为提供商时（任何包含 `x.ai` 的基础 URL），Hermes 会在每个 API 请求中发送 `x-grok-conv-id` 请求头，自动启用提示缓存。这将请求路由到对话会话内的同一服务器，允许 xAI 的基础设施复用缓存的系统提示和对话历史。

无需配置 —— 当检测到 xAI 端点且会话 ID 可用时，缓存自动激活。这降低了多轮对话的延迟和成本。

xAI 还提供了专用的 TTS 端点（`/v1/tts`）。在 `hermes tools` → Voice & TTS 中选择 **xAI TTS**，或参阅 [语音 & TTS](../user-guide/features/tts.md#text-to-speech) 页面了解配置。

**已退役的 xAI 模型迁移（2026 年 5 月 15 日）：** xAI 将于 2026-05-15 退役 `grok-4*`、`grok-3`、`grok-code-fast-1` 和 `grok-imagine-image-pro`。`hermes doctor` 和 `hermes chat` 启动时都会检测任何仍指向已退役模型的配置，并打印推荐的替代模型。使用 `hermes migrate xai` 进行一次性配置重写 —— 默认为试运行，添加 `--apply` 以写入更改（会自动创建带时间戳的 `config.yaml.bak-pre-migrate-xai-*` 备份）。

```bash
hermes migrate xai          # 预览替换
hermes migrate xai --apply  # 就地重写 ~/.hermes/config.yaml
```

**xAI 网页搜索后端。** 当启用[网页搜索](../user-guide/features/web-search.md)工具集时，`web.backend: xai` 通过 xAI 的托管搜索端点路由搜索，使用相同的 `XAI_API_KEY` / OAuth 凭据。如果 xAI 已配置为提供商，则无需额外设置。

### NovitaAI

[NovitaAI](https://novita.ai) 是面向构建者和智能体的 AI 原生云平台。其三大产品线包括：支持 200+ 模型的 Model API、用于构建和运行 AI 智能体的 Agent Sandbox，以及用于可扩展计算的 GPU Cloud，全部来自一个平台。

```bash
# 使用任何可用模型
hermes chat --provider novita --model moonshotai/kimi-k2.5
# 需要：~/.hermes/.env 中的 NOVITA_API_KEY

# 简写别名
hermes chat --provider novita-ai --model deepseek/deepseek-v3-0324
```

或在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "novita"
  default: "moonshotai/kimi-k2.5"
  base_url: "https://api.novita.ai/openai/v1"
```

在 [novita.ai/settings/key-management](https://novita.ai/settings/key-management) 获取你的 API 密钥。基础 URL 可通过 `NOVITA_BASE_URL` 覆盖。

### Ollama Cloud —— 托管的 Ollama 模型，OAuth + API 密钥

[Ollama Cloud](https://ollama.com/cloud) 托管与本地 Ollama 相同的开源权重模型目录，但无需 GPU。在 `hermes model` 中选择 **Ollama Cloud**，粘贴你从 [ollama.com/settings/keys](https://ollama.com/settings/keys) 获取的 API 密钥，Hermes 会自动发现可用模型。

```bash
hermes model
# → 选择 "Ollama Cloud"
# → 粘贴你的 OLLAMA_API_KEY
# → 从发现的模型中选择（gpt-oss:120b、glm-4.6:cloud、qwen3-coder:480b-cloud 等）
```

或直接编辑 `config.yaml`：
```yaml
model:
  provider: "ollama-cloud"
  default: "gpt-oss:120b"
```

模型目录从 `ollama.com/v1/models` 动态获取并缓存一小时。`model:tag` 记法（例如 `qwen3-coder:480b-cloud`）在规范化过程中被保留 —— 不要使用连字符。

:::tip Ollama Cloud 与本地 Ollama
两者使用相同的 OpenAI 兼容 API。Cloud 是一等提供商（`--provider ollama-cloud`，`OLLAMA_API_KEY`）；本地 Ollama 通过自定义端点流程访问（基础 URL `http://localhost:11434/v1`，无需密钥）。对本地无法运行的大型模型使用云版本；对隐私或离线工作使用本地版本。
:::

### AWS Bedrock

通过 AWS Bedrock 使用 Anthropic Claude、Amazon Nova、DeepSeek v3.2、Meta Llama 4 和其他模型。使用 AWS SDK（`boto3`）凭据链 —— 无需 API 密钥，只需标准 AWS 认证。

```bash
# 最简单 —— ~/.aws/credentials 中的命名配置文件
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
  # guardrail:                 # 可选的 Bedrock Guardrails
  #   guardrail_identifier: "your-guardrail-id"
  #   guardrail_version: "DRAFT"
```

认证使用标准 boto3 链：显式 `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`、`~/.aws/credentials` 中的 `AWS_PROFILE`、EC2/ECS/Lambda 上的 IAM 角色、IMDS 或 SSO。如果你已经通过 AWS CLI 认证，则无需设置环境变量。

Bedrock 底层使用 **Converse API** —— 请求被翻译为 Bedrock 的模型无关格式，因此同一配置适用于 Claude、Nova、DeepSeek 和 Llama 模型。仅在调用非默认区域端点时设置 `BEDROCK_BASE_URL`。

参阅 [AWS Bedrock 指南](/guides/aws-bedrock) 了解 IAM 设置、区域选择和跨区域推理的详细步骤。

### 通义千问 Portal (OAuth)

阿里巴巴的通义千问 Portal，支持基于浏览器的 OAuth 登录。在 `hermes model` 中选择 **Qwen OAuth (Portal)**，通过浏览器登录，Hermes 会持久化刷新令牌。

```bash
hermes model
# → 选择 "Qwen OAuth (Portal)"
# → 浏览器打开；使用你的阿里巴巴账户登录
# → 确认 —— 凭据保存到 ~/.hermes/auth.json

hermes chat   # 使用 portal.qwen.ai/v1 端点
```

或配置 `config.yaml`：
```yaml
model:
  provider: "qwen-oauth"
  default: "qwen3-coder-plus"
```

仅在门户端点迁移时设置 `HERMES_QWEN_BASE_URL`（默认：`https://portal.qwen.ai/v1`）。

:::tip 通义千问 OAuth 与通义千问云（阿里 DashScope）
`qwen-oauth` 使用面向消费者的通义千问 Portal，支持 OAuth 登录 —— 适合个人用户。`alibaba` 提供商使用通义千问云（阿里 DashScope）配合 `DASHSCOPE_API_KEY` —— 适合编程化/生产工作负载。两者都路由到通义千问系列模型，但位于不同端点。
:::

### 阿里云（Coding 计划）

如果你订阅了阿里巴巴的 **Coding 计划**（一个独立于标准 DashScope API 访问的定价 SKU），Hermes 将其作为独立的一等提供商暴露：`alibaba-coding-plan`。端点：`https://coding-intl.dashscope.aliyuncs.com/v1`。它与常规 `alibaba` 提供商一样是 OpenAI 兼容的，但基础 URL 和计费面不同。

```yaml
model:
  provider: alibaba_coding     # alibaba-coding-plan 的别名
  model: qwen3-coder-plus
```

或从 CLI：

```bash
hermes chat --provider alibaba_coding --model qwen3-coder-plus
```

`alibaba_coding` 使用与 `alibaba` 条目相同的 `DASHSCOPE_API_KEY` —— 无需单独的密钥，只是不同的路由目标。在此提供商注册之前，在 `config.yaml` 中设置 `provider: alibaba_coding` 的用户会静默回退到 OpenRouter 路由。

### MiniMax (OAuth)

通过浏览器 OAuth 登录使用 MiniMax-M2.7 —— 无需 API 密钥。在 `hermes model` 中选择 **MiniMax (OAuth)**，通过浏览器登录，Hermes 会持久化访问令牌和刷新令牌。底层使用 Anthropic Messages 兼容端点（`/anthropic`）。

```bash
hermes model
# → 选择 "MiniMax (OAuth)"
# → 浏览器打开；使用你的 MiniMax 账户登录（全球或中国区域）
# → 确认 —— 凭据保存到 ~/.hermes/auth.json

hermes chat   # 使用 api.minimax.io/anthropic 端点
```

或配置 `config.yaml`：
```yaml
model:
  provider: "minimax-oauth"
  default: "MiniMax-M2.7"
```

支持的模型：`MiniMax-M2.7`（主模型）和 `MiniMax-M2.7-highspeed`（作为默认辅助模型接入）。OAuth 路径忽略 `MINIMAX_API_KEY` / `MINIMAX_BASE_URL`。

:::tip MiniMax OAuth 与 API 密钥
`minimax-oauth` 使用 MiniMax 的面向消费者门户，支持 OAuth 登录 —— 无需计费设置。`minimax` 和 `minimax-cn` 提供商使用 `MINIMAX_API_KEY` / `MINIMAX_CN_API_KEY` —— 用于编程化访问。参阅 [MiniMax OAuth 指南](/guides/minimax-oauth) 了解完整流程。
:::

### NVIDIA NIM

通过 [build.nvidia.com](https://build.nvidia.com)（免费 API 密钥）或本地 NIM 端点使用 Nemotron 和其他开源模型。

```bash
# 云端（build.nvidia.com）
hermes chat --provider nvidia --model nvidia/nemotron-3-super-120b-a12b
# 需要：~/.hermes/.env 中的 NVIDIA_API_KEY

# 本地 NIM 端点 —— 覆盖基础 URL
NVIDIA_BASE_URL=http://localhost:8000/v1 hermes chat --provider nvidia --model nvidia/nemotron-3-super-120b-a12b
```

或在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "nvidia"
  default: "nvidia/nemotron-3-super-120b-a12b"
```

:::tip 本地 NIM
对于本地部署（DGX Spark、本地 GPU），设置 `NVIDIA_BASE_URL=http://localhost:8000/v1`。NIM 暴露与 build.nvidia.com 相同的 OpenAI 兼容聊天补全 API，因此在云端和本地之间切换只需更改一行环境变量。
:::

Hermes 会在每个发往 `build.nvidia.com` 的请求中自动附加 NIM 计费来源请求头 —— 无需配置。这会在 NVIDIA 的计费仪表盘中将消耗路由到正确的来源。

### GMI Cloud

通过 [GMI Cloud](https://www.gmicloud.ai/) 使用开源和推理模型 —— OpenAI 兼容 API，API 密钥认证。

```bash
# GMI Cloud
hermes chat --provider gmi --model deepseek-ai/DeepSeek-V3.2
# 需要：~/.hermes/.env 中的 GMI_API_KEY
```

或在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "gmi"
  default: "deepseek-ai/DeepSeek-V3.2"
```

基础 URL 可通过 `GMI_BASE_URL` 覆盖（默认：`https://api.gmi-serving.com/v1`）。

### StepFun

通过 [StepFun](https://platform.stepfun.com) 使用 Step 系列模型 —— OpenAI 兼容 API，API 密钥认证。

```bash
# StepFun
hermes chat --provider stepfun --model step-3-mini
# 需要：~/.hermes/.env 中的 STEPFUN_API_KEY
```

或在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "stepfun"
  default: "step-3-mini"
```

基础 URL 可通过 `STEPFUN_BASE_URL` 覆盖（默认：`https://api.stepfun.com/v1`）。

### Hugging Face 推理提供商

[Hugging Face 推理提供商](https://huggingface.co/docs/inference-providers)通过统一的 OpenAI 兼容端点（`router.huggingface.co/v1`）路由到 20+ 个开源模型。请求会自动路由到最快的可用后端（Groq、Together、SambaNova 等），并支持自动故障转移。

```bash
# 使用任何可用模型
hermes chat --provider huggingface --model Qwen/Qwen3.5-397B-A17B
# 需要：~/.hermes/.env 中的 HF_TOKEN

# 简写别名
hermes chat --provider hf --model deepseek-ai/DeepSeek-V3.2
```

或在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "huggingface"
  default: "Qwen/Qwen3.5-397B-A17B"
```

在 [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) 获取你的令牌 —— 确保启用 "Make calls to Inference Providers" 权限。包含免费层级（每月 $0.10 额度，提供商费率无加价）。

你可以在模型名称后追加路由后缀：`:fastest`（默认）、`:cheapest` 或 `:provider_name` 以强制使用特定后端。

基础 URL 可通过 `HF_BASE_URL` 覆盖。

### Google Gemini via OAuth (`google-gemini-cli`)

`google-gemini-cli` 提供商使用 Google 的 Cloud Code Assist 后端 —— 与 Google 自己的 `gemini-cli` 工具使用的相同 API。这支持**免费层级**（个人账户有充足的每日配额）和**付费层级**（通过 GCP 项目的 Standard/Enterprise）。

**快速开始：**

```bash
hermes model
# → 选择 "Google Gemini (OAuth)"
# → 查看策略警告，确认
# → 浏览器打开 accounts.google.com，登录
# → 完成 —— Hermes 在首次请求时自动配置你的免费层级
```

Hermes 默认附带 Google 的**公开** `gemini-cli` 桌面 OAuth 客户端 —— 与 Google 在其开源 `gemini-cli` 中包含的凭据相同。桌面 OAuth 客户端不是机密的（PKCE 提供安全性）。你无需安装 `gemini-cli` 或注册自己的 GCP OAuth 客户端。

**认证工作原理：**
- 对 `accounts.google.com` 使用 PKCE 授权码流程
- 浏览器回调地址 `http://127.0.0.1:8085/oauth2callback`（端口繁忙时有临时端点回退）
- 令牌存储在 `~/.hermes/auth/google_oauth.json`（chmod 0600，原子写入，跨进程 `fcntl` 锁）
- 到期前 60 秒自动刷新
- 无头环境（SSH、`HERMES_HEADLESS=1`）→ 粘贴模式回退
- 飞行中刷新去重 —— 两个并发请求不会双重刷新
- `invalid_grant`（已撤销的刷新令牌）→ 凭据文件被清除，提示用户重新登录

**推理工作原理：**
- 流量发送到 `https://cloudcode-pa.googleapis.com/v1internal:generateContent`
  （流式传输时使用 `:streamGenerateContent?alt=sse`），**非**付费的 `v1beta/openai` 端点
- 请求体封装为 `{project, model, user_prompt_id, request}`
- OpenAI 格式的 `messages[]`、`tools[]`、`tool_choice` 被翻译为 Gemini 的原生
  `contents[]`、`tools[].functionDeclarations`、`toolConfig` 格式
- 响应被翻译回 OpenAI 格式，使 Hermes 的其余部分无需更改

**层级与项目 ID：**

| 你的场景 | 操作 |
|---|---|
| 个人 Google 账户，想使用免费层级 | 无需操作 —— 登录，开始聊天 |
| Workspace / Standard / Enterprise 账户 | 设置 `HERMES_GEMINI_PROJECT_ID` 或 `GOOGLE_CLOUD_PROJECT` 为你的 GCP 项目 ID |
| 受 VPC-SC 保护的组织 | Hermes 检测到 `SECURITY_POLICY_VIOLATED` 后自动强制使用 `standard-tier` |

免费层级在首次使用时自动配置一个 Google 托管的项目。无需 GCP 设置。

**配额监控：**

```
/gquota
```

显示每个模型的剩余 Code Assist 配额及进度条：

```
Gemini Code Assist quota  (project: 123-abc)

  gemini-2.5-pro                      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░   85%
  gemini-2.5-flash [input]            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░   92%
```

:::warning 策略风险
Google 认为将 Gemini CLI OAuth 客户端用于第三方软件是一种策略违规行为。部分用户已报告账户限制。如需最低风险体验，请改用 `gemini` 提供商通过自己的 API 密钥。Hermes 在 OAuth 开始前会显示前置警告并要求明确确认。
:::

**自定义 OAuth 客户端（可选）：**

如果你想注册自己的 Google OAuth 客户端 —— 例如，将配额和同意范围限定在你自己的 GCP 项目内 —— 请设置：

```bash
HERMES_GEMINI_CLIENT_ID=your-client.apps.googleusercontent.com
HERMES_GEMINI_CLIENT_SECRET=...   # 桌面客户端可选
```

在 [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) 注册一个 **Desktop app** OAuth 客户端，并启用 Generative Language API。

## 自定义与自托管 LLM 提供商

Hermes 智能体兼容**任何符合 OpenAI API 规范的端点**。如果服务器实现了 `/v1/chat/completions`，您可以将 Hermes 指向它。这意味着您可以使用本地模型、GPU 推理服务器、多供应商路由器或任何第三方 API。

### 常规设置

有三种方式配置自定义端点：

**交互式设置（推荐）：**
```bash
hermes model
# 选择 “自定义端点（自托管 / VLLM / 等）"
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

:::warning 旧版环境变量
`.env` 中的 `LLM_MODEL` 已**移除** — `config.yaml` 是模型和端点配置的唯一事实来源。`OPENAI_BASE_URL` 仍然有效，但**仅**适用于 `openai-api` 提供商（它覆盖了直接 API 密钥访问的 OpenAI 端点）。对于其他提供商和自定义端点，请直接使用 `hermes model` 或在 `config.yaml` 中设置 `model.base_url`。如果您在 `.env` 中有过时的条目，它们将在下次 `hermes setup` 或配置迁移时自动清除。
:::

两种方法都会持久化到 `config.yaml`，这是模型、提供商和基础 URL 的事实来源。

### 使用 `/model` 切换模型

:::warning hermes model 与 /model
**`hermes model`**（从您的终端运行，在任何聊天会话之外）是**完整的提供商设置向导**。用于添加新提供商、运行 OAuth 流程、输入 API 密钥和配置自定义端点。

**`/model`**（在活动的 Hermes 聊天会话内输入）**只能切换您已设置的提供商和模型**。它无法添加新提供商、运行 OAuth 或提示输入 API 密钥。如果您只配置了一个提供商（例如 OpenRouter），`/model` 将仅显示该提供商的模型。

**要添加新提供商：** 退出当前会话（`Ctrl+C` 或 `/quit`），运行 `hermes model`，设置新提供商，然后开始新会话。
:::

配置了至少一个自定义端点后，您可以在会话中切换模型：

```
/model custom:qwen-2.5          # 切换到自定义端点上的模型
/model custom                    # 从端点自动检测模型
/model openrouter:claude-sonnet-4 # 切换回云提供商
```

如果您配置了**命名自定义提供商**（见下文），请使用三重语法：

```
/model custom:local:qwen-2.5    # 使用名为 “local” 的自定义提供商和模型 qwen-2.5
/model custom:work:llama3       # 使用名为 “work” 的自定义提供商和模型 llama3
```

切换提供商时，Hermes 会将基础 URL 和提供商持久化到配置中，因此更改在重启后仍然有效。当从自定义端点切换回内置提供商时，过时的基础 URL 会自动清除。

:::tip
裸的 `/model custom`（不带模型名称）会查询端点的 `/models` API，如果恰好加载了一个模型，则会自动选择它。对于运行单个模型的本地服务器很有用。
:::

以下内容遵循相同模式 — 只需更改 URL、密钥和模型名称。

---

### Ollama — 本地模型，零配置

[Ollama](https://ollama.com/) 只需一个命令即可在本地运行开源模型。最适合：快速本地实验、隐私敏感工作、离线使用。通过兼容 OpenAI 的 API 支持工具调用。

```bash
# 安装并运行模型
ollama pull qwen2.5-coder:32b
ollama serve   # 在端口 11434 上启动
```

然后配置 Hermes：

```bash
hermes model
# 选择 “自定义端点（自托管 / VLLM / 等）"
# 输入 URL：http://localhost:11434/v1
# 跳过 API 密钥（Ollama 不需要）
# 输入模型名称（例如 qwen2.5-coder:32b）
```

或直接配置 `config.yaml`：

```yaml
model:
  default: qwen2.5-coder:32b
  provider: custom
  base_url: http://localhost:11434/v1
  context_length: 64000   # 请参阅下面的警告
```

:::caution Ollama 默认上下文长度很低
Ollama 默认**不**使用模型的完整上下文窗口。默认值取决于您的 VRAM：

| 可用 VRAM | 默认上下文 |
|----------------|----------------|
| 少于 24 GB | **4,096 个令牌** |
| 24–48 GB | 32,768 个令牌 |
| 48+ GB | 256,000 个令牌 |

Hermes 智能体在使用工具进行代理工作时至少需要 **64,000 个令牌**的上下文。较小的窗口在启动时会被拒绝，因为系统提示、工具模式和工作会话状态需要足够的空间才能实现可靠的多步骤工作流。

**如何增加它**（选择一种）：

```bash
# 选项 1：通过环境变量在服务器范围内设置（推荐）
OLLAMA_CONTEXT_LENGTH=64000 ollama serve

# 选项 2：对于 systemd 管理的 Ollama
sudo systemctl edit ollama.service
# 添加：Environment="OLLAMA_CONTEXT_LENGTH=64000"
# 然后：sudo systemctl daemon-reload && sudo systemctl restart ollama

# 选项 3：将其烘焙到自定义模型中（每个模型持久化）
echo -e "FROM qwen2.5-coder:32b\nPARAMETER num_ctx 64000" > Modelfile
ollama create qwen2.5-coder-64k -f Modelfile
```

**您无法通过兼容 OpenAI 的 API 设置上下文长度**（`/v1/chat/completions`）。必须在服务器端或通过 Modelfile 进行配置。这是将 Ollama 与 Hermes 等工具集成时最常见的困惑点。
:::

**验证上下文是否设置正确：**

```bash
ollama ps
# 查看 CONTEXT 列 — 它应显示您配置的值
```

:::tip
使用 `ollama list` 列出可用模型。使用 `ollama pull <model>` 从 [Ollama 库](https://ollama.com/library) 拉取任何模型。Ollama 会自动处理 GPU 卸载 — 大多数设置无需配置。
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
# 选择 “自定义端点（自托管 / VLLM / 等）"
# 输入 URL：http://localhost:8000/v1
# 跳过 API 密钥（或如果您使用 --api-key 配置了 vLLM，则输入）
# 输入模型名称：meta-llama/Llama-3.1-70B-Instruct
```

**上下文长度：** vLLM 默认读取模型的 `max_position_embeddings`。如果这超出了您的 GPU 内存，它会报错并要求您设置更低的 `--max-model-len`。您也可以使用 `--max-model-len auto` 来自动查找适合的最大值。设置 `--gpu-memory-utilization 0.95`（默认 0.9）以在 VRAM 中挤入更多上下文。

**工具调用需要显式标志：**

| 标志 | 用途 |
|------|---------|
| `--enable-auto-tool-choice` | `tool_choice: "auto"` 所必需（Hermes 中的默认值） |
| `--tool-call-parser <name>` | 解析模型工具调用格式的解析器 |

支持的解析器：`hermes`（Qwen 2.5、Hermes 2/3）、`llama3_json`（Llama 3.x）、`mistral`、`deepseek_v3`、`deepseek_v31`、`xlam`、`pythonic`。没有这些标志，工具调用将无法工作 — 模型将输出工具调用为文本。

:::tip
vLLM 支持人类可读的大小：`--max-model-len 64k`（小写 k = 1000，大写 K = 1024）。
:::

---

### SGLang — 带有 RadixAttention 的快速推理服务

[SGLang](https://github.com/sgl-project/sglang) 是 vLLM 的替代方案，具有用于 KV 缓存复用的 RadixAttention。最适合：多轮对话（前缀缓存）、约束解码、结构化输出。

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
# 选择 “自定义端点（自托管 / VLLM / 等）"
# 输入 URL：http://localhost:30000/v1
# 输入模型名称：meta-llama/Llama-3.1-70B-Instruct
```

**上下文长度：** SGLang 默认从模型的配置中读取。使用 `--context-length` 进行覆盖。如果您需要超过模型声明的最大值，请设置 `SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1`。

**工具调用：** 使用 `--tool-call-parser` 并为您的模型系列选择适当的解析器：`qwen`（Qwen 2.5）、`llama3`、`llama4`、`deepseekv3`、`mistral`、`glm`。没有此标志，工具调用将作为纯文本返回。

:::caution SGLang 默认最大输出令牌为 128
如果响应看起来被截断，请在您的请求中添加 `max_tokens` 或在服务器上设置 `--default-max-tokens`。如果请求中未指定，SGLang 的默认值仅为每响应 128 个令牌。
:::

---

### llama.cpp / llama-server — CPU 与 Metal 推理

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

**上下文长度 (`-c`)：** 最近的构建默认为 `0`，它会从 GGUF 元数据读取模型的训练上下文。对于具有 128k+ 训练上下文的模型，尝试分配完整的 KV 缓存可能会导致 OOM。请将 `-c` 显式设置为至少 64,000 个令牌以供 Hermes 使用。如果使用并行槽位 (`-np`)，总上下文将在槽位之间分配 — 使用 `-c 64000 -np 4`，每个槽位仅获得 16k，低于 Hermes 每个活动会话的最小值。

然后配置 Hermes 指向它：

```bash
hermes model
# 选择 “自定义端点（自托管 / VLLM / 等）"
# 输入 URL：http://localhost:8080/v1
# 跳过 API 密钥（本地服务器不需要）
# 输入模型名称 — 或留空以自动检测（如果只加载了一个模型）
```

这会将端点保存到 `config.yaml`，使其在会话间保持持久。

---
title: "本地模型的桌面应用"
description: "在本地环境中运行大语言模型，配合 Hermes 智能体使用。"
slug: local-models
---

:::caution 使用工具调用必须指定 `--jinja`
如果不使用 `--jinja`，llama-server 会完全忽略 `tools` 参数。模型会尝试通过在响应文本中书写 JSON 来调用工具，但 Hermes 不会将其识别为工具调用 —— 你将看到原始 JSON（如 `{"name": "web_search", ...}`）作为消息被打印出来，而不是执行一次实际的搜索。

原生工具调用支持（最佳性能）：Llama 3.x、Qwen 2.5（包括 Coder）、Hermes 2/3、Mistral、DeepSeek、Functionary。所有其他模型使用通用处理器，虽然能用，但效率可能较低。完整列表请参见 [llama.cpp 函数调用文档](https://github.com/ggml-org/llama.cpp/blob/master/docs/function-calling.md)。

你可以通过检查 `http://localhost:8080/props` 来验证工具支持是否激活 —— `chat_template` 字段应该存在。
:::

:::tip
从 [Hugging Face](https://huggingface.co/models?library=gguf) 下载 GGUF 模型。Q4_K_M 量化在质量与内存占用方面提供了最佳平衡。
:::

---

### LM Studio —— 运行本地模型的桌面应用

[LM Studio](https://lmstudio.ai/) 是一个带有图形用户界面的桌面应用，用于运行本地模型。最适用于：偏好可视化界面的用户、需要快速测试模型的开发者、macOS/Windows/Linux 平台的开发者。

从 LM Studio 应用中启动服务器（开发者标签页 → 启动服务器），或使用命令行：

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
# 如果启用了 LM Studio 服务器认证，按提示输入 LM_API_KEY
```

Hermes 会自动加载一个具有 64K 上下文长度的 LM Studio 模型。

要在 LM Studio 中更改上下文长度：

1.  点击模型选择器旁边的齿轮图标。
2.  将 "Context Length" 设置为至少 64000 以获得流畅体验。
3.  重新加载模型以使更改生效。
4.  如果你的机器无法容纳 64000，考虑使用上下文长度更大的较小模型。

或者，使用命令行：`lms load model-name --context-length 64000`

你可以使用命令行来估算模型是否放得下：`lms load model-name --context-length 64000 --estimate-only`

要设置每个模型的持久默认值：我的模型标签页 → 模型上的齿轮图标 → 设置上下文大小。
:::

**工具调用：** 自 LM Studio 0.3.6 起支持。具有原生工具调用训练的模型（Qwen 2.5、Llama 3.x、Mistral、Hermes）会被自动检测并显示工具徽章。其他模型使用通用回退机制，可靠性可能稍低。

---

### WSL2 网络配置（Windows 用户）

由于 Hermes 智能体需要 Unix 环境，Windows 用户需要在 WSL2 内运行它。如果你的模型服务器（Ollama、LM Studio 等）运行在 **Windows 主机**上，则需要桥接网络差异 —— WSL2 使用一个拥有独立子网的虚拟网络适配器，因此 WSL2 内部的 `localhost` 指的是 Linux 虚拟机，**而非** Windows 主机。

:::tip 如果双方都在 WSL2 内？没问题。
如果你的模型服务器也运行在 WSL2 内部（对于 vLLM、SGLang 和 llama-server 很常见），`localhost` 会按预期工作 —— 它们共享相同的网络命名空间。可以跳过本节。
:::

#### 选项 1：镜像网络模式（推荐）

适用于 **Windows 11 22H2 及更高版本**，镜像模式使得 `localhost` 在 Windows 和 WSL2 之间可以双向工作 —— 是最简单的解决方案。

1.  创建或编辑 `%USERPROFILE%\.wslconfig`（例如 `C:\Users\YourName\.wslconfig`）：
    ```ini
    [wsl2]
    networkingMode=mirrored
    ```

2.  从 PowerShell 重启 WSL：
    ```powershell
    wsl --shutdown
    ```

3.  重新打开你的 WSL2 终端。现在 `localhost` 可以访问 Windows 服务了：
    ```bash
    curl http://localhost:11434/v1/models   # Ollama 在 Windows 上 —— 可用
    ```

:::note Hyper-V 防火墙
在某些 Windows 11 版本上，Hyper-V 防火墙默认会阻止镜像连接。如果在启用镜像模式后 `localhost` 仍然无法工作，请在 **管理员 PowerShell** 中运行：
```powershell
Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow
```
:::

#### 选项 2：使用 Windows 主机 IP（Windows 10 / 旧版）

如果无法使用镜像模式，从 WSL2 内部获取 Windows 主机 IP，并用它代替 `localhost`：

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
  base_url: http://172.29.192.1:11434/v1   # Windows 主机 IP，不是 localhost
```

:::tip 动态助手
主机 IP 可能在 WSL2 重启后改变。你可以在 shell 中动态获取它：
```bash
export WSL_HOST=$(ip route show | grep -i default | awk '{ print $3 }')
echo "Windows host at: $WSL_HOST"
curl http://$WSL_HOST:11434/v1/models   # 测试 Ollama
```

或者使用你机器的 mDNS 名称（需要在 WSL2 中安装 `libnss-mdns`）：
```bash
sudo apt install libnss-mdns
curl http://$(hostname).local:11434/v1/models
```
:::

#### 服务器绑定地址（NAT 模式必需）

如果你使用**选项 2**（使用主机 IP 的 NAT 模式），Windows 上的模型服务器必须接受来自 `127.0.0.1` 以外地址的连接。默认情况下，大多数服务器只监听 localhost —— NAT 模式下 WSL2 的连接来自一个不同的虚拟子网，会被拒绝。在镜像模式下，`localhost` 直接映射，因此默认的 `127.0.0.1` 绑定可以正常工作。

| 服务器 | 默认绑定 | 如何修复 |
|--------|----------|----------|
| **Ollama** | `127.0.0.1` | 在启动 Ollama 前设置环境变量 `OLLAMA_HOST=0.0.0.0`（Windows 上：系统设置 → 环境变量，或编辑 Ollama 服务） |
| **LM Studio** | `127.0.0.1` | 在开发者标签页 → 服务器设置中启用 **"Serve on Network"** |
| **llama-server** | `127.0.0.1` | 在启动命令中添加 `--host 0.0.0.0` |
| **vLLM** | `0.0.0.0` | 默认已绑定到所有网络接口 |
| **SGLang** | `127.0.0.1` | 在启动命令中添加 `--host 0.0.0.0` |

**Windows 上的 Ollama（详细步骤）：** Ollama 作为 Windows 服务运行。要设置 `OLLAMA_HOST`：
1.  打开**系统属性** → **环境变量**
2.  添加一个新的**系统变量**：`OLLAMA_HOST` = `0.0.0.0`
3.  重启 Ollama 服务（或重启电脑）

#### Windows 防火墙

Windows 防火墙将 WSL2 视为一个独立的网络（在 NAT 和镜像模式下都是如此）。如果执行上述步骤后连接仍然失败，请为你的模型服务器端口添加防火墙规则：

```powershell
# 在管理员 PowerShell 中运行 —— 将 PORT 替换为你的服务器端口
New-NetFirewallRule -DisplayName "Allow WSL2 to Model Server" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 11434
```

常见端口：Ollama `11434`，vLLM `8000`，SGLang `30000`，llama-server `8080`，LM Studio `1234`。

#### 快速验证

从 WSL2 内部，测试你是否能访问模型服务器：

```bash
# 将 URL 替换为你服务器的实际地址和端口
curl http://localhost:11434/v1/models          # 镜像模式
curl http://172.29.192.1:11434/v1/models       # NAT 模式（使用你的实际主机 IP）
```

如果收到列出你的模型的 JSON 响应，说明一切正常。将同样的 URL 用作你 Hermes 配置中的 `base_url`。

---

### 本地模型故障排除

这些问题在使用 Hermes 时会影响**所有**本地推理服务器。

#### WSL2 连接 Windows 主机上的模型服务器时出现 "Connection refused"

如果你在 WSL2 内运行 Hermes，而模型服务器在 Windows 主机上，在 WSL2 默认的 NAT 网络模式下，`http://localhost:<port>` 是无法工作的。修复方法请参见上面的 [WSL2 网络配置](#wsl2-网络配置windows-用户)。

#### 工具调用以文本形式出现，而不是执行

模型输出类似 `{"name": "web_search", "arguments": {...}}` 的内容作为消息，而不是实际调用工具。

**原因：** 你的服务器未启用工具调用，或者该模型不支持你服务器所实现的工具调用。

| 服务器 | 修复方法 |
|--------|----------|
| **llama.cpp** | 在启动命令中添加 `--jinja` |
| **vLLM** | 添加 `--enable-auto-tool-choice --tool-call-parser hermes` |
| **SGLang** | 添加 `--tool-call-parser qwen`（或适当的解析器） |
| **Ollama** | 默认已启用工具调用 —— 确保你的模型支持它（使用 `ollama show model-name` 检查） |
| **LM Studio** | 更新到 0.3.6+ 并使用具有原生工具支持的模型 |

#### 模型似乎会忘记上下文或给出不连贯的回复

**原因：** 上下文窗口太小。当对话超过上下文限制时，大多数服务器会静默丢弃较早的消息。仅 Hermes 的系统提示 + 工具模式可能就会占用 4k–8k 个 token。

**诊断：**

```bash
# 检查 Hermes 认为的上下文是多少
# 查看启动行："Context limit: X tokens"

# 检查你服务器的实际上下文
# Ollama: ollama ps (CONTEXT 列)
# llama.cpp: curl http://localhost:8080/props | jq '.default_generation_settings.n_ctx'
# vLLM: 检查启动参数中的 --max-model-len
```

**修复：** 对于智能体使用，将上下文设置为至少 **64,000 个 token**。具体标志请参见上面各个服务器的章节。

#### 启动时显示 "Context limit: 2048 tokens"

Hermes 会从你服务器的 `/v1/models` 端点自动检测上下文长度。如果服务器报告了一个较低的值（或根本未报告），Hermes 会使用模型声明的限制，但这可能是错误的。

**修复：** 在 `config.yaml` 中显式设置：

```yaml
model:
  default: your-model
  provider: custom
  base_url: http://localhost:11434/v1
  context_length: 64000
```

#### 回复在句子中途被截断

**可能的原因：**
1.  **服务器输出上限过低（`max_tokens`）** — SGLang 默认每个响应只返回 128 个标记。在服务器上设置 `--default-max-tokens`，或在 config.yaml 中通过 `model.max_tokens` 配置 Hermes。注意：`max_tokens` 仅控制响应长度，与对话历史长度无关（那是 `context_length`）。
2.  **上下文耗尽** — 模型已填满其上下文窗口。增加 `model.context_length` 或在 Hermes 中启用[上下文压缩](/user-guide/configuration#context-compression)。

---

### LiteLLM 代理 — 多提供商网关

[LiteLLM](https://docs.litellm.ai/) 是一个兼容 OpenAI 的代理，将 100 多个 LLM 提供商统一到单一 API 后端。适用于：无需更改配置即可在提供商间切换、负载均衡、故障转移链、预算控制。

```bash
# 安装并启动
pip install "litellm[proxy]"
litellm --model anthropic/claude-sonnet-4 --port 4000

# 或者使用包含多个模型的配置文件：
litellm --config litellm_config.yaml --port 4000
```

然后通过 `hermes model` → 自定义端点 → `http://localhost:4000/v1` 配置 Hermes。

带故障转移的 `litellm_config.yaml` 示例：
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
  routing_strategy: "基于延迟的路由"
```

---

### ClawRouter — 成本优化路由

[ClawRouter](https://github.com/BlockRunAI/ClawRouter) 是由 BlockRunAI 开发的本地路由代理，它根据查询复杂度自动选择模型。它将请求在 14 个维度上进行分类，并路由到能处理该任务的最便宜模型。通过 USDC 加密货币支付（无需 API 密钥）。

```bash
# 安装并启动
npx @blockrun/clawrouter    # 在端口 8402 启动
```

然后通过 `hermes model` → 自定义端点 → `http://localhost:8402/v1` → 模型名称 `blockrun/auto` 配置 Hermes。

路由配置文件：
| 配置文件 | 策略 | 节省比例 |
|---------|----------|---------|
| `blockrun/auto` | 平衡质量与成本 | 74-100% |
| `blockrun/eco` | 最低成本优先 | 95-100% |
| `blockrun/premium` | 最佳质量模型 | 0% |
| `blockrun/free` | 仅免费模型 | 100% |
| `blockrun/agentic` | 针对工具使用优化 | 视情况而定 |

:::note
ClawRouter 需要一个在 Base 或 Solana 上有 USDC 余额的钱包来支付。所有请求都通过 BlockRun 的后端 API 路由。运行 `npx @blockrun/clawrouter doctor` 可检查钱包状态。
:::

---

### 其他兼容提供商

任何提供兼容 OpenAI API 的服务均可使用。一些流行选项：

| 提供商 | 基础 URL | 备注 |
|----------|----------|-------|
| [Together AI](https://together.ai) | `https://api.together.xyz/v1` | 云托管的开源模型 |
| [Groq](https://groq.com) | `https://api.groq.com/openai/v1` | 超快推理 |
| [DeepSeek](https://deepseek.com) | `https://api.deepseek.com/v1` | DeepSeek 模型 |
| [Fireworks AI](https://fireworks.ai) | `https://api.fireworks.ai/inference/v1` | 快速开源模型托管 |
| [GMI Cloud](https://www.gmicloud.ai/) | `https://api.gmi-serving.com/v1` | 托管式 OpenAI 兼容推理 |
| [Cerebras](https://cerebras.ai) | `https://api.cerebras.ai/v1` | 晶圆级芯片推理 |
| [Mistral AI](https://mistral.ai) | `https://api.mistral.ai/v1` | Mistral 模型 |
| [OpenAI](https://openai.com) | `https://api.openai.com/v1` | 直接 OpenAI 访问 |
| [Azure OpenAI](https://azure.microsoft.com) | `https://YOUR.openai.azure.com/` | 企业级 OpenAI |
| [LocalAI](https://localai.io) | `http://localhost:8080/v1` | 自托管，多模型 |
| [Jan](https://jan.ai) | `http://localhost:1337/v1` | 桌面应用，支持本地模型 |

通过 `hermes model` → 自定义端点，或在 `config.yaml` 中配置其中任意一个：

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
**`context_length`** 是**总上下文窗口** — 输入*和*输出标记的组合预算（例如，Claude Opus 4.6 为 200,000）。Hermes 使用它来决定何时压缩历史记录并验证 API 请求。

**`model.max_tokens`** 是**输出上限** — 模型在*单次响应*中可生成的最大标记数。它与对话历史长度无关。行业标准名称 `max_tokens` 是一个常见的混淆来源；Anthropic 的原生 API 已将其重命名为 `max_output_tokens` 以提高清晰度。

当自动检测获取窗口大小有误时，设置 `context_length`。
仅当你需要限制单个响应长度时，才设置 `model.max_tokens`。
:::

Hermes 使用多源解析链来检测您的模型和提供商的正确上下文窗口：

1.  **配置覆盖** — config.yaml 中的 `model.context_length`（最高优先级）
2.  **自定义提供商按模型设置** — `custom_providers[].models.<id>.context_length`
3.  **持久缓存** — 之前发现的值（重启后仍保留）
4.  **端点 `/models`** — 查询您服务器的 API（本地/自定义端点）
5.  **Anthropic `/v1/models`** — 查询 Anthropic API 的 `max_input_tokens`（仅 API 密钥用户）
6.  **OpenRouter API** — 来自 OpenRouter 的实时模型元数据
7.  **Nous Portal** — 将 Nous 模型 ID 与 OpenRouter 元数据进行后缀匹配
8.  **[models.dev](https://models.dev)** — 社区维护的注册表，包含 100 多个提供商的 3800 多个模型的特定提供商上下文长度
9.  **回退默认值** — 广泛的模型系列模式（默认 128K）

对于大多数设置，这可以直接开箱即用。系统具有提供商感知能力 — 同一个模型根据服务方的不同可能有不同的上下文限制（例如，`claude-opus-4.6` 在 Anthropic 直接提供是 1M，但在 GitHub Copilot 上是 128K）。

要显式设置上下文长度，请在模型配置中添加 `context_length`：

```yaml
model:
  default: "qwen3.5:9b"
  base_url: "http://localhost:8080/v1"
  context_length: 131072  # 标记数
```

对于自定义端点，您还可以按模型设置上下文长度：

```yaml
custom_providers:
  - name: "我的本地 LLM"
    base_url: "http://localhost:11434/v1"
    models:
      qwen3.5:27b:
        context_length: 64000
      deepseek-r1:70b:
        context_length: 65536
```

`hermes model` 在配置自定义端点时会提示输入上下文长度。留空则进行自动检测。

:::tip 何时需要手动设置
- 您正在使用 Ollama，并自定义了低于模型最大值的 `num_ctx`
- 您希望将上下文限制在低于模型最大值（例如，在 128k 模型上设为 8k 以节省显存）
- 您的代理没有暴露 `/v1/models` 端点
:::

---

### 命名自定义提供商

如果您使用多个自定义端点（例如，本地开发服务器和远程 GPU 服务器），可以在 `config.yaml` 中将它们定义为命名自定义提供商：

```yaml
custom_providers:
  - name: local
    base_url: http://localhost:8080/v1
    # 省略 api_key — 对于无密钥的本地服务器，Hermes 使用 "no-key-required"
  - name: work
    base_url: https://gpu-server.internal.corp/v1
    key_env: CORP_API_KEY
    api_mode: chat_completions   # 由 `hermes model` → 自定义端点向导显式设置；自动检测仍作为回退发生
  - name: anthropic-proxy
    base_url: https://proxy.example.com/anthropic
    key_env: ANTHROPIC_PROXY_KEY
    api_mode: anthropic_messages  # 用于 Anthropic 兼容代理
```

一些兼容 OpenAI 的端点需要特定提供商的请求体字段。在匹配的自定义提供商中添加一个 `extra_body` 映射，Hermes 会将其合并到该端点的每个 chat-completions 请求中：

```yaml
custom_providers:
  - name: gemma-local
    base_url: http://localhost:8080/v1
    model: google/gemma-4-31b-it
    extra_body:
      enable_thinking: true
      reasoning_effort: high
```

请使用您服务器文档中定义的格式。例如，vLLM Gemma 部署和某些 NVIDIA NIM 端点期望 `enable_thinking` 在 `chat_template_kwargs` 下，而不是作为顶层 `extra_body` 字段：

```yaml
extra_body:
  chat_template_kwargs:
    enable_thinking: true
```

`hermes model` → 自定义端点向导现在会显式提示 `api_mode`，并将您的答案持久化到 `config.yaml`。当该字段留空时，基于 URL 的自动检测（例如 `/anthropic` 路径 → `anthropic_messages`）仍作为回退发生。

**自定义提供商模型的原生视觉支持。** 如果您的自定义端点提供了一个支持视觉但未在 models.dev 中列出的模型，请设置 `model.supports_vision: true`，以便 Hermes 将附加的图像作为原生部分（作为 `image_url` 部分）路由，而不是通过 `vision_analyze` 进行预处理。单一开关 — 无需再设置 `agent.image_input_mode: native`。

```yaml
model:
  provider: custom
  base_url: http://localhost:8080/v1
  default: qwen3.6-35b-a3b
  supports_vision: true   # 原生发送图像；否则 vision_analyze 会预先描述它们
```

同样的键在按命名提供商的模型上也有效（`custom_providers[*].models[*].supports_vision`），并接受标准 YAML 布尔值（`true/false/yes/no/on/off/1/0`）。

在会话中通过三重语法切换：

```
/model custom:local:qwen-2.5       # 使用 "local" 端点和 qwen-2.5
/model custom:work:llama3-70b      # 使用 "work" 端点和 llama3-70b
/model custom:anthropic-proxy:claude-sonnet-4  # 使用代理
```

您也可以从交互式 `hermes model` 菜单中选择命名自定义提供商。

---

### 实战手册：Together AI, Groq, Perplexity

[其他兼容提供商](#其他兼容提供商)中列出的云提供商都使用 OpenAI 的 REST 方言，因此在 `custom_providers:` 下的配置方式相同。以下是三个可用的配方。每个都可放入 `~/.hermes/config.yaml`，对应的 API 密钥放在 `~/.hermes/.env`。

#### Together AI

将以下英文文本翻译成简体中文。保持 Markdown 格式和结构。
重要术语映射（必须遵循这些精确翻译）：
- "agent" 或 "Agent" -> "智能体"（而非 "代理"）
- "agents" -> "智能体们" 或 "多个智能体"（视上下文而定，而非 "代理"）
- "agents" 在软件上下文中 -> "智能体" 或 "代理智能体"

仅返回翻译后的文本，无需任何额外评论或解释。

关键提示：请勿翻译 YAML 前置数据键（文件顶部 "---" 块内的键）。仅翻译值。例如，保持 "title:"、"description:"、"slug:" 等为英文。

关键提示：请完全保留所有 HTML 实体。请勿将 `&lt;` 转换为 `<`，`&gt;` 转换为 `>`，`&amp;` 转换为 `&`，`&#123;` 转换为 `{`，`&#125;` 转换为 `}` 等。例如，`&lt;100ms` 必须保持为 `&lt;100ms`，而非 `<100ms`。

托管开源权重模型（Llama, MiniMax, Gemma, DeepSeek, Qwen），价格远低于官方 API。适合作为多模型集群的良好默认选择。

```yaml
# ~/.hermes/config.yaml
custom_providers:
  - name: together
    base_url: https://api.together.xyz/v1
    key_env: TOGETHER_API_KEY
    # api_mode: chat_completions  # 默认值——无需设置

model:
  default: MiniMaxAI/MiniMax-M2.7   # 或 together.ai/models 中的任何模型
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

Together 的 `/v1/models` 端点可用，因此 `hermes model` 可以自动发现可用模型。

#### Groq

超快速推理（在 Llama-3.3-70B 上约 500 tok/s）。目录较小，但对于对延迟敏感的交互式使用来说非常强大。

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

当您需要一个能自动进行实时网络搜索和引用的模型时非常有用。对可用模型有严格限制——请查看 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 获取当前列表。

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

#### 单一配置中使用多个提供商

这三种方案可以组合——同时使用它们，并通过 `/model custom:<name>:<model>` 在每轮切换：

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
- 在 CLI 验证器修复 (#15083) 之后，`hermes doctor` 对于这些名称不应再打印 `Unknown provider` 警告。
- 如果提供商的 `/v1/models` 端点不可达（Perplexity 是常见情况），`hermes model` 将以警告形式保留模型，而不是硬性拒绝——参见 #15136。
- 要完全跳过 `custom_providers:`，并使用裸 `provider: custom` 配合 `CUSTOM_BASE_URL` 环境变量，请参见 #15103。
:::

---

### 选择合适的设置

| 使用场景 | 推荐方案 |
|----------|----------|
| **只求能用** | OpenRouter（默认）或 Nous Portal |
| **本地模型，易于安装** | Ollama |
| **生产环境 GPU 服务** | vLLM 或 SGLang |
| **Mac / 无 GPU** | Ollama 或 llama.cpp |
| **多提供商路由** | LiteLLM Proxy 或 OpenRouter |
| **成本优化** | ClawRouter 或 使用 `sort: "price"` 的 OpenRouter |
| **最大隐私** | Ollama、vLLM 或 llama.cpp（完全本地） |
| **企业级 / Azure** | Azure OpenAI 自定义端点 |
| **中文 AI 模型** | z.ai (GLM), Kimi/Moonshot (`kimi-coding` 或 `kimi-coding-cn`), MiniMax, Xiaomi MiMo, 或 Tencent TokenHub（一等提供商） |

:::tip
您可以随时使用 `hermes model` 在提供商之间切换——无需重启。无论您使用哪个提供商，对话历史、记忆和技能都会无缝衔接。
:::

## 可选 API 密钥

| 功能 | 提供商 | 环境变量 |
|---------|----------|--------------|
| 网页抓取 | [Firecrawl](https://firecrawl.dev/) | `FIRECRAWL_API_KEY`, `FIRECRAWL_API_URL` |
| 浏览器自动化 | [Browserbase](https://browserbase.com/) | `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` |
| 图像生成 | [FAL](https://fal.ai/) | `FAL_KEY` |
| 高级 TTS 语音 | [ElevenLabs](https://elevenlabs.io/) | `ELEVENLABS_API_KEY` |
| OpenAI TTS + 语音转录 | [OpenAI](https://platform.openai.com/api-keys) | `VOICE_TOOLS_OPENAI_KEY` |
| Mistral TTS + 语音转录 | [Mistral](https://console.mistral.ai/) | `MISTRAL_API_KEY` |
| 跨会话用户建模 | [Honcho](https://honcho.dev/) | `HONCHO_API_KEY` |
| 语义长期记忆 | [Supermemory](https://supermemory.ai) | `SUPERMEMORY_API_KEY` |

### 自托管 Firecrawl

默认情况下，Hermes 使用 [Firecrawl 云 API](https://firecrawl.dev/) 进行网络搜索和抓取。如果您希望在本地运行 Firecrawl，可以将 Hermes 指向一个自托管实例。完整的安装说明请参阅 Firecrawl 的 [SELF_HOST.md](https://github.com/firecrawl/firecrawl/blob/main/SELF_HOST.md)。

**您将获得：** 无需 API 密钥，无速率限制，无单页成本，完全数据主权。

**您将失去：** 云版本使用 Firecrawl 专有的 "Fire-engine" 进行高级反机器人绕过（Cloudflare、验证码、IP 轮换）。自托管版本使用基本的 fetch + Playwright，因此一些受保护的网站可能会失败。搜索使用 DuckDuckGo 而非 Google。

**设置：**

1. 克隆并启动 Firecrawl Docker 栈（5 个容器：API、Playwright、Redis、RabbitMQ、PostgreSQL——需要约 4-8 GB 内存）：
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

使用 OpenRouter 时，您可以控制请求如何在提供商之间路由。在 `~/.hermes/config.yaml` 中添加 `provider_routing` 部分：

```yaml
provider_routing:
  sort: "throughput"          # "price"（默认）、"throughput" 或 "latency"
  # only: ["anthropic"]      # 仅使用这些提供商
  # ignore: ["deepinfra"]    # 跳过这些提供商
  # order: ["anthropic", "google"]  # 按此顺序尝试提供商
  # require_parameters: true  # 仅使用支持所有请求参数的提供商
  # data_collection: "deny"   # 排除可能存储/训练数据的提供商
```

**快捷方式：** 在任何模型名称后附加 `:nitro` 进行吞吐量排序（例如，`anthropic/claude-sonnet-4:nitro`），或附加 `:floor` 进行价格排序。

## OpenRouter Pareto 代码路由器

OpenRouter 在 `openrouter/pareto-code` 提供了一个实验性编码模型路由器，它会自动将请求路由到满足编码质量门槛（由 [Artificial Analysis](https://artificialanalysis.ai/) 排名）的最便宜模型。选择此模型并在 `~/.hermes/config.yaml` 中调整 `min_coding_score` 旋钮：

```yaml
model:
  provider: openrouter
  model: openrouter/pareto-code

openrouter:
  min_coding_score: 0.65   # 0.0–1.0；越高 = 越强（越昂贵）的编码器。默认 0.65。
```

注意事项：

- `min_coding_score` **仅在** `model.model` 为 `openrouter/pareto-code` 时发送。对于任何其他模型，该值无效。
- 设置为空字符串（或移除该行）可让 OpenRouter 选择最强的可用编码器——这是文档描述的行为，当省略 plugins 块时。
- 在给定的日期内，选择对分数是确定的，但实际选择的模型可能会随着 Pareto 前沿的移动（新模型、基准更新）而变化。
- 有关完整路由器行为，请参阅 OpenRouter 的 [Pareto 路由器文档](https://openrouter.ai/docs/guides/routing/routers/pareto-router)。
- 要将 Pareto 代码路由器用于特定**辅助任务**（压缩、视觉等）而非主智能体，请在该任务下设置 `extra_body.plugins`——参见 [辅助模型 → OpenRouter 路由和用于辅助任务的 Pareto 代码](/user-guide/configuration#openrouter-routing--pareto-code-for-auxiliary-tasks)。

## 回退提供商

配置一串备用提供商链，当主模型失败（速率限制、服务器错误、身份验证失败）时，Hermes 会按顺序尝试。规范格式是顶层 `fallback_providers:` 列表：

```yaml
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
  - provider: anthropic
    model: claude-sonnet-4
    # base_url: http://localhost:8000/v1    # 可选，用于自定义端点
    # api_mode: chat_completions           # 可选覆盖
```

为向后兼容，仍然接受旧的单对 `fallback_model:` 字典：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

激活后，回退会在会话中替换模型和提供商，而不会丢失您的对话。链条会逐项尝试；每次会话激活一次。

支持的提供商：`openrouter`, `nous`, `novita`, `openai-codex`, `copilot`, `copilot-acp`, `anthropic`, `gemini`, `google-gemini-cli`, `qwen-oauth`, `huggingface`, `zai`, `kimi-coding`, `kimi-coding-cn`, `minimax`, `minimax-cn`, `minimax-oauth`, `deepseek`, `nvidia`, `xai`, `xai-oauth`, `ollama-cloud`, `bedrock`, `azure-foundry`, `opencode-zen`, `opencode-go`, `kilocode`, `xiaomi`, `arcee`, `gmi`, `stepfun`, `lmstudio`, `alibaba`, `alibaba-coding-plan`, `tencent-tokenhub`, `custom`.

:::tip
回退功能仅通过 `config.yaml` 配置——或通过 `hermes fallback` 交互式配置。有关何时触发、链条如何推进以及它与辅助任务和委托如何交互的完整详细信息，请参阅 [回退提供商](/user-guide/features/fallback-providers)。
:::

---

## 另请参阅

- [配置](/user-guide/configuration) — 通用配置（目录结构、配置优先级、终端后端、记忆、压缩等）
- [环境变量](/reference/environment-variables) — 所有环境变量的完整参考