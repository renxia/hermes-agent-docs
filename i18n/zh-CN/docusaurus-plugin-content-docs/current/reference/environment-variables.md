---
sidebar_position: 2
title: "环境变量"
description: "Hermes 智能体使用的所有环境变量的完整参考"
---

# 环境变量参考

所有变量都放在 `~/.hermes/.env` 文件中。您也可以通过 `hermes config set VAR value` 命令来设置它们。

## LLM 提供商

| 变量 | 描述 |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API 密钥（推荐，灵活性高） |
| `OPENROUTER_BASE_URL` | 覆盖兼容 OpenRouter 的基础 URL |
| `HERMES_OPENROUTER_CACHE` | 启用 OpenRouter 响应缓存 (`1`/`true`/`yes`/`on`)。覆盖 config.yaml 中的 `openrouter.response_cache`。参见 [响应缓存](https://openrouter.ai/docs/guides/features/response-caching)。 |
| `HERMES_OPENROUTER_CACHE_TTL` | 缓存 TTL，单位为秒 (1-86400)。覆盖 config.yaml 中的 `openrouter.response_cache_ttl`。 |
| `NOUS_BASE_URL` | 覆盖 Nous Portal 基础 URL（通常无需更改；仅用于开发/测试） |
| `NOUS_INFERENCE_BASE_URL` | 直接覆盖 Nous 推理端点 |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway API 密钥 ([ai-gateway.vercel.sh](https://ai-gateway.vercel.sh)) |
| `AI_GATEWAY_BASE_URL` | 覆盖 AI Gateway 基础 URL（默认：`https://ai-gateway.vercel.sh/v1`） |
| `OPENAI_API_KEY` | 用于自定义 OpenAI 兼容端点的 API 密钥（与 `OPENAI_BASE_URL` 配合使用） |
| `OPENAI_BASE_URL` | 自定义端点（VLLM、SGLang 等）的基础 URL |
| `COPILOT_GITHUB_TOKEN` | 用于 Copilot API 的 GitHub 令牌 — 优先级最高（OAuth `gho_*` 或细粒度 PAT `github_pat_*`；**不支持**经典 PAT `ghp_*`） |
| `GH_TOKEN` | GitHub 令牌 — 用于 Copilot 的第二优先级（也被 `gh` CLI 使用） |
| `GITHUB_TOKEN` | GitHub 令牌 — 用于 Copilot 的第三优先级 |
| `HERMES_COPILOT_ACP_COMMAND` | 覆盖 Copilot ACP CLI 二进制文件路径（默认：`copilot`） |
| `COPILOT_CLI_PATH` | `HERMES_COPILOT_ACP_COMMAND` 的别名 |
| `HERMES_COPILOT_ACP_ARGS` | 覆盖 Copilot ACP 参数（默认：`--acp --stdio`） |
| `COPILOT_ACP_BASE_URL` | 覆盖 Copilot ACP 基础 URL |
| `GLM_API_KEY` | z.ai / 智谱 AI GLM API 密钥 ([z.ai](https://z.ai)) |
| `ZAI_API_KEY` | `GLM_API_KEY` 的别名 |
| `Z_AI_API_KEY` | `GLM_API_KEY` 的别名 |
| `GLM_BASE_URL` | 覆盖 z.ai 基础 URL（默认：`https://api.z.ai/api/paas/v4`） |
| `KIMI_API_KEY` | Kimi / Moonshot AI API 密钥 ([moonshot.ai](https://platform.moonshot.ai)) |
| `KIMI_BASE_URL` | 覆盖 Kimi 基础 URL（默认：`https://api.moonshot.ai/v1`） |
| `KIMI_CN_API_KEY` | Kimi / Moonshot 中国版 API 密钥 ([moonshot.cn](https://platform.moonshot.cn)) |
| `ARCEEAI_API_KEY` | Arcee AI API 密钥 ([chat.arcee.ai](https://chat.arcee.ai/)) |
| `ARCEE_BASE_URL` | 覆盖 Arcee 基础 URL（默认：`https://api.arcee.ai/api/v1`） |
| `GMI_API_KEY` | GMI Cloud API 密钥 ([gmicloud.ai](https://www.gmicloud.ai/)) |
| `GMI_BASE_URL` | 覆盖 GMI Cloud 基础 URL（默认：`https://api.gmi-serving.com/v1`） |
| `MINIMAX_API_KEY` | MiniMax API 密钥 — 全球端点 ([minimax.io](https://www.minimax.io))。**不用于 `minimax-oauth`**（OAuth 路径使用浏览器登录）。 |
| `MINIMAX_BASE_URL` | 覆盖 MiniMax 基础 URL（默认：`https://api.minimax.io/anthropic` — Hermes 使用 MiniMax 的 Anthropic Messages 兼容端点）。**不用于 `minimax-oauth`**。 |
| `MINIMAX_CN_API_KEY` | MiniMax API 密钥 — 中国端点 ([minimaxi.com](https://www.minimaxi.com))。**不用于 `minimax-oauth`**（OAuth 路径使用浏览器登录）。 |
| `MINIMAX_CN_BASE_URL` | 覆盖 MiniMax 中国基础 URL（默认：`https://api.minimaxi.com/anthropic`）。**不用于 `minimax-oauth`**。 |
| `KILOCODE_API_KEY` | Kilo Code API 密钥 ([kilo.ai](https://kilo.ai)) |
| `KILOCODE_BASE_URL` | 覆盖 Kilo Code 基础 URL（默认：`https://api.kilo.ai/api/gateway`） |
| `XIAOMI_API_KEY` | 小米 MiMo API 密钥 ([platform.xiaomimimo.com](https://platform.xiaomimimo.com)) |
| `XIAOMI_BASE_URL` | 覆盖小米 MiMo 基础 URL（默认：`https://api.xiaomimimo.com/v1`） |
| `TOKENHUB_API_KEY` | 腾讯 TokenHub API 密钥 ([tokenhub.tencentmaas.com](https://tokenhub.tencentmaas.com)) |
| `TOKENHUB_BASE_URL` | 覆盖腾讯 TokenHub 基础 URL（默认：`https://tokenhub.tencentmaas.com/v1`） |
| `AZURE_FOUNDRY_API_KEY` | Azure AI Foundry / Azure OpenAI API 密钥 ([ai.azure.com](https://ai.azure.com/)) |
| `AZURE_FOUNDRY_BASE_URL` | Azure AI Foundry 端点 URL（例如 OpenAI 风格为 `https://<resource>.openai.azure.com/openai/v1`，Anthropic 风格为 `https://<resource>.services.ai.azure.com/anthropic`） |
| `AZURE_ANTHROPIC_KEY` | 当 `provider: anthropic` 且 `base_url` 指向 Azure Foundry Claude 部署时，用于 Azure Anthropic 的 API 密钥（当同时配置了 Anthropic 和 Azure Anthropic 时，作为 `ANTHROPIC_API_KEY` 的替代方案） |
| `HF_TOKEN` | 用于推理提供商的 Hugging Face 令牌 ([huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)) |
| `HF_BASE_URL` | 覆盖 Hugging Face 基础 URL（默认：`https://router.huggingface.co/v1`） |
| `GOOGLE_API_KEY` | Google AI Studio API 密钥 ([aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)) |
| `GEMINI_API_KEY` | `GOOGLE_API_KEY` 的别名 |
| `GEMINI_BASE_URL` | 覆盖 Google AI Studio 基础 URL |
| `HERMES_GEMINI_CLIENT_ID` | 用于 `google-gemini-cli` PKCE 登录的 OAuth 客户端 ID（可选；默认为 Google 公开的 gemini-cli 客户端） |
| `HERMES_GEMINI_CLIENT_SECRET` | 用于 `google-gemini-cli` 的 OAuth 客户端密钥（可选） |
| `HERMES_GEMINI_PROJECT_ID` | 用于付费 Gemini 层级的 GCP 项目 ID（免费层会自动预配） |
| `ANTHROPIC_API_KEY` | Anthropic Console API 密钥 ([console.anthropic.com](https://console.anthropic.com/)) |
| `ANTHROPIC_TOKEN` | 手动或旧版 Anthropic OAuth/设置令牌覆盖 |
| `DASHSCOPE_API_KEY` | 阿里云 DashScope API 密钥，用于 Qwen 模型 ([modelstudio.console.alibabacloud.com](https://modelstudio.console.alibabacloud.com/)) |
| `DASHSCOPE_BASE_URL` | 自定义 DashScope 基础 URL（默认：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`；中国大陆区域使用 `https://dashscope.aliyuncs.com/compatible-mode/v1`） |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥，用于直接访问 DeepSeek ([platform.deepseek.com](https://platform.deepseek.com/api_keys)) |
| `DEEPSEEK_BASE_URL` | 自定义 DeepSeek API 基础 URL |
| `NVIDIA_API_KEY` | NVIDIA NIM API 密钥 — Nemotron 及开源模型 ([build.nvidia.com](https://build.nvidia.com)) |
| `NVIDIA_BASE_URL` | 覆盖 NVIDIA 基础 URL（默认：`https://integrate.api.nvidia.com/v1`；本地 NIM 端点设置为 `http://localhost:8000/v1`） |
| `STEPFUN_API_KEY` | StepFun API 密钥 — Step 系列模型 ([platform.stepfun.com](https://platform.stepfun.com)) |
| `STEPFUN_BASE_URL` | 覆盖 StepFun 基础 URL（默认：`https://api.stepfun.com/v1`） |
| `OLLAMA_API_KEY` | Ollama Cloud API 密钥 — 无需本地 GPU 的托管 Ollama 模型目录 ([ollama.com/settings/keys](https://ollama.com/settings/keys)) |
| `OLLAMA_BASE_URL` | 覆盖 Ollama Cloud 基础 URL（默认：`https://ollama.com/v1`） |
| `XAI_API_KEY` | xAI (Grok) API 密钥，用于聊天和语音合成 ([console.x.ai](https://console.x.ai/)) |
| `XAI_BASE_URL` | 覆盖 xAI 基础 URL（默认：`https://api.x.ai/v1`） |
| `MISTRAL_API_KEY` | Mistral API 密钥，用于 Voxtral 语音合成和 Voxtral 语音识别 ([console.mistral.ai](https://console.mistral.ai)) |
| `AWS_REGION` | 用于 Bedrock 推理的 AWS 区域（例如 `us-east-1`、`eu-central-1`）。由 boto3 读取。 |
| `AWS_PROFILE` | 用于 Bedrock 认证的 AWS 命名配置文件（读取 `~/.aws/credentials`）。保持未设置以使用默认的 boto3 凭证链。 |
| `BEDROCK_BASE_URL` | 覆盖 Bedrock 运行时基础 URL（默认：`https://bedrock-runtime.us-east-1.amazonaws.com`；通常保持未设置，转而使用 `AWS_REGION`） |
| `HERMES_QWEN_BASE_URL` | Qwen Portal 基础 URL 覆盖（默认：`https://portal.qwen.ai/v1`） |
| `OPENCODE_ZEN_API_KEY` | OpenCode Zen API 密钥 — 按使用付费访问精选模型 ([opencode.ai](https://opencode.ai/auth)) |
| `OPENCODE_ZEN_BASE_URL` | 覆盖 OpenCode Zen 基础 URL |
| `OPENCODE_GO_API_KEY` | OpenCode Go API 密钥 — $10/月订阅开源模型 ([opencode.ai](https://opencode.ai/auth)) |
| `OPENCODE_GO_BASE_URL` | 覆盖 OpenCode Go 基础 URL |
| `CLAUDE_CODE_OAUTH_TOKEN` | 如果您手动导出，请显式覆盖 Claude Code 令牌 |
| `HERMES_MODEL` | 在进程级别覆盖模型名称（由 cron 调度器使用；常规使用请优先使用 `config.yaml`） |
| `VOICE_TOOLS_OPENAI_KEY` | 用于 OpenAI 语音转文本和文本转语音提供商的首选 OpenAI 密钥 |
| `HERMES_LOCAL_STT_COMMAND` | 可选的本地语音转文本命令模板。支持 `{input_path}`、`{output_dir}`、`{language}` 和 `{model}` 占位符 |
| `HERMES_LOCAL_STT_LANGUAGE` | 传递给 `HERMES_LOCAL_STT_COMMAND` 或自动检测的本地 `whisper` CLI 回退的默认语言（默认：`en`） |
| `HERMES_HOME` | 覆盖 Hermes 配置目录（默认：`~/.hermes`）。同时限定网关 PID 文件和 systemd 服务名称的范围，因此多个安装可以并发运行 |
| `HERMES_GIT_BASH_PATH` | **仅限 Windows。** 覆盖终端工具的 `bash.exe` 发现路径。指向任何 bash — 完整的 Git-for-Windows 安装、通过符号链接的 WSL bash、MSYS2、Cygwin。安装程序会自动将其设置为它配置的 PortableGit。参见 [Windows（原生）指南](../user-guide/windows-native.md#how-hermes-runs-shell-commands-on-windows) |
| `HERMES_DISABLE_WINDOWS_UTF8` | **仅限 Windows。** 设置为 `1` 可禁用 UTF-8 stdio 垫片（`configure_windows_stdio()`）并回退到控制台的区域代码页。对于二分法定位编码问题很有用；在正常操作中很少是合适的设置 |
| `HERMES_KANBAN_HOME` | 覆盖用于定位看板（数据库 + 工作空间 + 工作节点日志）的共享 Hermes 根目录。回退到 `get_default_hermes_root()`（任何活动配置文件的父目录）。对于测试和不常见的部署很有用 |
| `HERMES_KANBAN_BOARD` | 为此进程固定活动看板。优先级高于 `~/.hermes/kanban/current`；调度器会将其注入到工作子进程环境中，因此工作节点在物理上无法看到其他看板上的任务。默认为 `default`。Slug 验证：小写字母数字 + 连字符 + 下划线，1-64 个字符 |
| `HERMES_KANBAN_DB` | 直接固定看板数据库文件路径（最高优先级；优于 `HERMES_KANBAN_BOARD` 和 `HERMES_KANBAN_HOME`）。调度器会将其注入到工作子进程环境中，因此配置文件工作节点会汇聚到调度器的看板上 |
| `HERMES_KANBAN_WORKSPACES_ROOT` | 直接固定看板工作空间根目录（工作空间的最高优先级；优于 `HERMES_KANBAN_HOME`）。调度器会将其注入到工作子进程环境中 |

## 提供商认证（OAuth）

对于 Anthropic 原生认证，当存在凭证文件时，Hermes 偏好使用 Claude Code 自身的凭证文件，因为这些凭证可以自动刷新。**针对 Anthropic 的 OAuth 认证需要购买了额外使用额度的 Claude Max 计划** —— Hermes 作为 Claude Code 路由，仅从 Max 计划的额外/超额额度中提取，而非基础 Max 额度，并且在 Claude Pro 上无法使用。若没有 Max 计划和额外额度，则应使用 API 密钥。诸如 `ANTHROPIC_TOKEN` 之类的环境变量作为手动覆盖项仍然有用，但它们不再是 Claude Max 登录的首选路径。

| 变量 | 描述 |
|----------|-------------|
| `HERMES_INFERENCE_PROVIDER` | 覆盖提供商选择：`auto`, `custom`, `openrouter`, `nous`, `openai-codex`, `copilot`, `copilot-acp`, `anthropic`, `huggingface`, `gemini`, `zai`, `kimi-coding`, `kimi-coding-cn`, `minimax`, `minimax-cn`, `minimax-oauth`（浏览器 OAuth 登录 —— 无需 API 密钥；参见 [MiniMax OAuth 指南](../guides/minimax-oauth.md)），`kilocode`, `xiaomi`, `arcee`, `gmi`, `stepfun`, `alibaba`, `alibaba-coding-plan`（别名 `alibaba_coding`），`deepseek`, `nvidia`, `ollama-cloud`, `xai`（别名 `grok`），`google-gemini-cli`, `qwen-oauth`, `bedrock`, `opencode-zen`, `opencode-go`, `ai-gateway`, `tencent-tokenhub`（默认：`auto`） |
| `HERMES_PORTAL_BASE_URL` | 覆盖 Nous Portal URL（用于开发/测试） |
| `NOUS_INFERENCE_BASE_URL` | 覆盖 Nous 推理 API URL |
| `HERMES_NOUS_MIN_KEY_TTL_SECONDS` | 重新生成代理智能体密钥前的最小 TTL（默认：1800 = 30分钟） |
| `HERMES_NOUS_TIMEOUT_SECONDS` | 用于 Nous 凭证/令牌流程的 HTTP 超时时间 |
| `HERMES_DUMP_REQUESTS` | 将 API 请求负载转储到日志文件（`true`/`false`） |
| `HERMES_PREFILL_MESSAGES_FILE` | 在 API 调用时注入的临时预填充消息的 JSON 文件路径 |
| `HERMES_TIMEZONE` | IANA 时区覆盖（例如 `America/New_York`） |

## 工具 API

| 变量 | 描述 |
|----------|-------------|
| `PARALLEL_API_KEY` | AI 原生网络搜索 ([parallel.ai](https://parallel.ai/)) |
| `FIRECRAWL_API_KEY` | 网页抓取和云浏览器 ([firecrawl.dev](https://firecrawl.dev/)) |
| `FIRECRAWL_API_URL` | 用于自托管实例的自定义 Firecrawl API 端点（可选） |
| `TAVILY_API_KEY` | 用于 AI 原生网络搜索、提取和爬取的 Tavily API 密钥 ([app.tavily.com](https://app.tavily.com/home)) |
| `SEARXNG_URL` | 用于免费自托管网络搜索的 SearXNG 实例 URL —— 无需 API 密钥 ([searxng.github.io](https://searxng.github.io/searxng/)) |
| `TAVILY_BASE_URL` | 覆盖 Tavily API 端点。适用于企业代理和自托管的 Tavily 兼容搜索后端。模式与 `GROQ_BASE_URL` 相同。 |
| `EXA_API_KEY` | 用于 AI 原生网络搜索和内容的 Exa API 密钥 ([exa.ai](https://exa.ai/)) |
| `BROWSERBASE_API_KEY` | 浏览器自动化 ([browserbase.com](https://browserbase.com/)) |
| `BROWSERBASE_PROJECT_ID` | Browserbase 项目 ID |
| `BROWSER_USE_API_KEY` | Browser Use 云浏览器 API 密钥 ([browser-use.com](https://browser-use.com/)) |
| `FIRECRAWL_BROWSER_TTL` | Firecrawl 浏览器会话 TTL（秒）（默认：300） |
| `BROWSER_CDP_URL` | 用于本地浏览器的 Chrome DevTools 协议 URL（通过 `/browser connect` 设置，例如 `ws://localhost:9222`） |
| `CAMOFOX_URL` | Camofox 本地反检测浏览器 URL（默认：`http://localhost:9377`） |
| `BROWSER_INACTIVITY_TIMEOUT` | 浏览器会话不活动超时时间（秒） |
| `FAL_KEY` | 图像生成 ([fal.ai](https://fal.ai/)) |
| `GROQ_API_KEY` | Groq Whisper STT API 密钥 ([groq.com](https://groq.com/)) |
| `ELEVENLABS_API_KEY` | ElevenLabs 高级 TTS 语音 ([elevenlabs.io](https://elevenlabs.io/)) |
| `STT_GROQ_MODEL` | 覆盖 Groq STT 模型（默认：`whisper-large-v3-turbo`） |
| `GROQ_BASE_URL` | 覆盖 Groq OpenAI 兼容的 STT 端点 |
| `STT_OPENAI_MODEL` | 覆盖 OpenAI STT 模型（默认：`whisper-1`） |
| `STT_OPENAI_BASE_URL` | 覆盖 OpenAI 兼容的 STT 端点 |
| `GITHUB_TOKEN` | 用于技能中心的 GitHub 令牌（更高的 API 速率限制，技能发布） |
| `HONCHO_API_KEY` | 跨会话用户建模 ([honcho.dev](https://honcho.dev/)) |
| `HONCHO_BASE_URL` | 自托管 Honcho 实例的基础 URL（默认：Honcho 云）。本地实例无需 API 密钥 |
| `HINDSIGHT_TIMEOUT` | Hindsight 记忆提供商 API 调用的超时时间（秒）（默认：`60`）。如果你的 Hindsight 实例在 `/sync` 或 `on_session_switch` 期间响应缓慢，并且在 `errors.log` 中看到超时错误，请增加此值。 |
| `SUPERMEMORY_API_KEY` | 带有个人资料召回和会话摄入的语义长期记忆 ([supermemory.ai](https://supermemory.ai)) |
| `TINKER_API_KEY` | 强化学习训练 ([tinker-console.thinkingmachines.ai](https://tinker-console.thinkingmachines.ai/)) |
| `WANDB_API_KEY` | 强化学习训练指标 ([wandb.ai](https://wandb.ai/)) |
| `DAYTONA_API_KEY` | Daytona 云沙箱 ([daytona.io](https://daytona.io/)) |
| `VERCEL_TOKEN` | Vercel 沙箱访问令牌 ([vercel.com](https://vercel.com/)) |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID（与 `VERCEL_TOKEN` 配合使用） |
| `VERCEL_TEAM_ID` | Vercel 团队 ID（与 `VERCEL_TOKEN` 配合使用） |
| `VERCEL_OIDC_TOKEN` | Vercel 短期 OIDC 令牌（仅限开发环境的替代方案） |

### Langfuse 可观测性

用于内置 [`observability/langfuse`](/docs/user-guide/features/built-in-plugins#observabilitylangfuse) 插件的环境变量。通过 `hermes tools → Langfuse Observability` 或在 `~/.hermes/.env` 中手动设置这些变量。在生效之前，还必须启用该插件（`hermes plugins enable observability/langfuse`）。

| 变量 | 描述 |
|----------|-------------|
| `HERMES_LANGFUSE_PUBLIC_KEY` | Langfuse 项目公钥（`pk-lf-...`）。必需。 |
| `HERMES_LANGFUSE_SECRET_KEY` | Langfuse 项目私钥（`sk-lf-...`）。必需。 |
| `HERMES_LANGFUSE_BASE_URL` | Langfuse 服务器 URL（默认：`https://cloud.langfuse.com`）。自托管时设置。 |
| `HERMES_LANGFUSE_ENV` | 追踪上的环境标签（`production`, `staging`, …） |
| `HERMES_LANGFUSE_RELEASE` | 追踪上的发布/版本标签 |
| `HERMES_LANGFUSE_SAMPLE_RATE` | SDK 采样率 0.0–1.0（默认：`1.0`） |
| `HERMES_LANGFUSE_MAX_CHARS` | 序列化负载的每个字段截断长度（默认：`12000`） |
| `HERMES_LANGFUSE_DEBUG` | `true` 启用详细插件日志记录到 `agent.log` |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` / `LANGFUSE_BASE_URL` | 标准 Langfuse SDK 名称。当对应的 `HERMES_LANGFUSE_*` 变量未设置时，作为后备接受。 |

### Nous 工具网关

这些变量为付费 Nous 订阅用户或自托管网关部署配置[工具网关](/docs/user-guide/features/tool-gateway)。大多数用户无需设置这些 —— 网关会通过 `hermes model` 或 `hermes tools` 自动配置。

| 变量 | 描述 |
|----------|-------------|
| `TOOL_GATEWAY_DOMAIN` | 用于工具网关路由的基础域名（默认：`nousresearch.com`） |
| `TOOL_GATEWAY_SCHEME` | 用于网关 URL 的 HTTP 或 HTTPS 方案（默认：`https`） |
| `TOOL_GATEWAY_USER_TOKEN` | 工具网关的认证令牌（通常从 Nous 认证自动填充） |
| `FIRECRAWL_GATEWAY_URL` | 专门覆盖 Firecrawl 网关端点的 URL |

## 终端后端

| 变量 | 描述 |
|----------|-------------|
| `TERMINAL_ENV` | 后端类型：`local`、`docker`、`ssh`、`singularity`、`modal`、`daytona`、`vercel_sandbox` |
| `HERMES_DOCKER_BINARY` | 覆盖 Hermès 使用的容器二进制文件（例如 `podman`、`/usr/local/bin/docker`）。未设置时，Hermès 会自动在 `PATH` 中发现 `docker` 或 `podman`。当两者均已安装且您希望使用非默认项，或二进制文件位于 `PATH` 之外时，需要此设置。 |
| `TERMINAL_DOCKER_IMAGE` | Docker 镜像（默认：`nikolaik/python-nodejs:python3.11-nodejs20`） |
| `TERMINAL_DOCKER_FORWARD_ENV` | 一个 JSON 数组，包含要显式转发到 Docker 终端会话中的环境变量名。请注意：技能声明的 `required_environment_variables` 会自动转发——您只需为未被任何技能声明的变量设置此项。 |
| `TERMINAL_DOCKER_VOLUMES` | 附加的 Docker 卷挂载（以逗号分隔的 `宿主机:容器` 对） |
| `TERMINAL_DOCKER_MOUNT_CWD_TO_WORKSPACE` | 高级选项：将启动时的当前工作目录挂载到 Docker 的 `/workspace` 中（`true`/`false`，默认：`false`） |
| `TERMINAL_SINGULARITY_IMAGE` | Singularity 镜像或 `.sif` 文件路径 |
| `TERMINAL_MODAL_IMAGE` | Modal 容器镜像 |
| `TERMINAL_DAYTONA_IMAGE` | Daytona 沙箱镜像 |
| `TERMINAL_VERCEL_RUNTIME` | Vercel 沙箱运行时（`node24`、`node22`、`python3.13`） |
| `TERMINAL_TIMEOUT` | 命令超时时间（秒） |
| `TERMINAL_LIFETIME_SECONDS` | 终端会话的最大生命周期（秒） |
| `TERMINAL_CWD` | 终端会话的工作目录（仅用于网关/定时任务；CLI 使用启动时的目录） |
| `SUDO_PASSWORD` | 启用 sudo 而无需交互式提示 |

对于云沙箱后端，持久性以文件系统为导向。`TERMINAL_LIFETIME_SECONDS` 控制 Hermès 何时清理空闲的终端会话，后续恢复时可能会重新创建沙箱，而不是保持相同的活动进程运行。

## SSH 后端

| 变量 | 描述 |
|----------|-------------|
| `TERMINAL_SSH_HOST` | 远程服务器主机名 |
| `TERMINAL_SSH_USER` | SSH 用户名 |
| `TERMINAL_SSH_PORT` | SSH 端口（默认：22） |
| `TERMINAL_SSH_KEY` | 私钥文件路径 |
| `TERMINAL_SSH_PERSISTENT` | 覆盖 SSH 的持久化 Shell 设置（默认：遵循 `TERMINAL_PERSISTENT_SHELL` 的设置） |

## 容器资源（Docker、Singularity、Modal、Daytona）

| 变量 | 描述 |
|----------|-------------|
| `TERMINAL_CONTAINER_CPU` | CPU 核心数（默认：1） |
| `TERMINAL_CONTAINER_MEMORY` | 内存（MB）（默认：5120） |
| `TERMINAL_CONTAINER_DISK` | 磁盘（MB）（默认：51200） |
| `TERMINAL_CONTAINER_PERSISTENT` | 是否在会话间持久化容器文件系统（默认：`true`） |
| `TERMINAL_SANDBOX_DIR` | 用于存放工作空间和覆盖层的主机目录（默认：`~/.hermes/sandboxes/`） |

## 持久化 Shell 会话

| 变量 | 描述 |
|------|------|
| `TERMINAL_PERSISTENT_SHELL` | 为非本地后端启用持久化 shell 会话（默认值：`true`）。也可通过 config.yaml 中的 `terminal.persistent_shell` 设置 |
| `TERMINAL_LOCAL_PERSISTENT` | 为本地后端启用持久化 shell 会话（默认值：`false`） |
| `TERMINAL_SSH_PERSISTENT` | 为 SSH 后端覆盖持久化 shell 会话设置（默认值：遵循 `TERMINAL_PERSISTENT_SHELL`） |

## 消息传递

| 变量 | 描述 |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram 机器人令牌（来自 @BotFather） |
| `TELEGRAM_ALLOWED_USERS` | 允许使用机器人的用户 ID（逗号分隔）（适用于私聊、群组和论坛） |
| `TELEGRAM_GROUP_ALLOWED_USERS` | 仅限在群组/论坛中授权的发送者用户 ID（逗号分隔）（不授予私聊权限）。为向后兼容 #17686 之前的配置，以 `-` 开头的聊天 ID 格式的值仍被作为聊天 ID 处理，但会发出弃用警告。 |
| `TELEGRAM_GROUP_ALLOWED_CHATS` | 群组/论坛聊天 ID（逗号分隔）；任何成员均被授权 |
| `TELEGRAM_HOME_CHANNEL` | 定时推送的默认 Telegram 聊天/频道 |
| `TELEGRAM_HOME_CHANNEL_NAME` | Telegram 主频道的显示名称 |
| `TELEGRAM_WEBHOOK_URL` | Webhook 模式的公共 HTTPS URL（启用 webhook 而非轮询） |
| `TELEGRAM_WEBHOOK_PORT` | Webhook 服务器的本地监听端口（默认：`8443`） |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram 在每次更新中回显的用于验证的秘密令牌。**只要设置了 `TELEGRAM_WEBHOOK_URL` 就必须设置此项** — 网关未设置此项将无法启动（GHSA-3vpc-7q5r-276h）。使用 `openssl rand -hex 32` 生成。 |
| `TELEGRAM_REACTIONS` | 在消息处理期间启用表情符号反应（默认：`false`） |
| `TELEGRAM_REPLY_TO_MODE` | 回复引用行为：`off`、`first`（默认）或 `all`。与 Discord 模式匹配。 |
| `TELEGRAM_IGNORED_THREADS` | 机器人永不响应的 Telegram 论坛主题/线程 ID（逗号分隔） |
| `TELEGRAM_PROXY` | 用于 Telegram 连接的代理 URL — 覆盖 `HTTPS_PROXY`。支持 `http://`、`https://`、`socks5://` |
| `DISCORD_BOT_TOKEN` | Discord 机器人令牌 |
| `DISCORD_ALLOWED_USERS` | 允许使用机器人的 Discord 用户 ID（逗号分隔） |
| `DISCORD_ALLOWED_ROLES` | 允许使用机器人的 Discord 角色 ID（逗号分隔）（与 `DISCORD_ALLOWED_USERS` 为 OR 关系）。自动启用 Members 意图。当审核团队更替时很有用 — 角色授予会自动传播。 |
| `DISCORD_ALLOWED_CHANNELS` | Discord 频道 ID（逗号分隔）。设置后，机器人仅在这些频道（以及允许的私聊）中响应。覆盖 `config.yaml` 中的 `discord.allowed_channels`。 |
| `DISCORD_PROXY` | 用于 Discord 连接的代理 URL — 覆盖 `HTTPS_PROXY`。支持 `http://`、`https://`、`socks5://` |
| `DISCORD_HOME_CHANNEL` | 定时推送的默认 Discord 频道 |
| `DISCORD_HOME_CHANNEL_NAME` | Discord 主频道的显示名称 |
| `DISCORD_COMMAND_SYNC_POLICY` | Discord 斜杠命令启动同步策略：`safe`（差异并协调）、`bulk`（旧版 `tree.sync()`）或 `off` |
| `DISCORD_REQUIRE_MENTION` | 在服务器频道中需要 @提及 后才响应 |
| `DISCORD_FREE_RESPONSE_CHANNELS` | 不需要提及即可响应的频道 ID（逗号分隔） |
| `DISCORD_AUTO_THREAD` | 支持时自动为长回复创建线程 |
| `DISCORD_REACTIONS` | 在消息处理期间启用表情符号反应（默认：`true`） |
| `DISCORD_IGNORED_CHANNELS` | 机器人永不响应的频道 ID（逗号分隔） |
| `DISCORD_NO_THREAD_CHANNELS` | 机器人响应但不自动创建线程的频道 ID（逗号分隔） |
| `DISCORD_REPLY_TO_MODE` | 回复引用行为：`off`、`first`（默认）或 `all` |
| `DISCORD_ALLOW_MENTION_EVERYONE` | 允许机器人 ping `@everyone`/`@here`（默认：`false`）。参见[提及控制](../user-guide/messaging/discord.md#mention-control)。 |
| `DISCORD_ALLOW_MENTION_ROLES` | 允许机器人 ping `@role` 提及（默认：`false`）。 |
| `DISCORD_ALLOW_MENTION_USERS` | 允许机器人 ping 单个 `@user` 提及（默认：`true`）。 |
| `DISCORD_ALLOW_MENTION_REPLIED_USER` | 回复消息时 ping 作者（默认：`true`）。 |
| `SLACK_BOT_TOKEN` | Slack 机器人令牌（`xoxb-...`） |
| `SLACK_APP_TOKEN` | Slack 应用级令牌（`xapp-...`，Socket Mode 所需） |
| `SLACK_ALLOWED_USERS` | Slack 用户 ID（逗号分隔） |
| `SLACK_HOME_CHANNEL` | 定时推送的默认 Slack 频道 |
| `SLACK_HOME_CHANNEL_NAME` | Slack 主频道的显示名称 |
| `GOOGLE_CHAT_PROJECT_ID` | 托管 Pub/Sub 主题的 GCP 项目（回退到 `GOOGLE_CLOUD_PROJECT`） |
| `GOOGLE_CHAT_SUBSCRIPTION_NAME` | 完整的 Pub/Sub 订阅路径，`projects/{proj}/subscriptions/{sub}`（旧版别名：`GOOGLE_CHAT_SUBSCRIPTION`） |
| `GOOGLE_CHAT_SERVICE_ACCOUNT_JSON` | 服务账户 JSON 的路径，或内联 JSON（回退到 `GOOGLE_APPLICATION_CREDENTIALS`） |
| `GOOGLE_CHAT_ALLOWED_USERS` | 允许与机器人聊天的用户电子邮件（逗号分隔） |
| `GOOGLE_CHAT_ALLOW_ALL_USERS` | 允许任何 Google Chat 用户触发机器人（仅限开发） |
| `GOOGLE_CHAT_HOME_CHANNEL` | 定时推送的默认空间（例如 `spaces/AAAA...`） |
| `GOOGLE_CHAT_HOME_CHANNEL_NAME` | Google Chat 主空间的显示名称 |
| `GOOGLE_CHAT_MAX_MESSAGES` | Pub/Sub FlowControl 最大在途消息数（默认：`1`） |
| `GOOGLE_CHAT_MAX_BYTES` | Pub/Sub FlowControl 最大在途字节数（默认：`16777216`，16 MiB） |
| `GOOGLE_CHAT_BOOTSTRAP_SPACES` | 启动时解析机器人自身 `users/{id}` 时要探测的额外空间 ID（逗号分隔） |
| `GOOGLE_CHAT_DEBUG_RAW` | 设置为任意值以在 DEBUG 级别记录已编辑的 Pub/Sub 信封（仅调试用） |
| `WHATSAPP_ENABLED` | 启用 WhatsApp 桥接（`true`/`false`） |
| `WHATSAPP_MODE` | `bot`（独立号码）或 `self-chat`（给自己发消息） |
| `WHATSAPP_ALLOWED_USERS` | 允许的电话号码（带国家代码，不含 `+`）（逗号分隔），或 `*` 允许所有发送者 |
| `WHATSAPP_ALLOW_ALL_USERS` | 无需允许列表允许所有 WhatsApp 发送者（`true`/`false`） |
| `WHATSAPP_DEBUG` | 记录桥接中的原始消息事件以进行故障排除（`true`/`false`） |
| `SIGNAL_HTTP_URL` | signal-cli 守护进程 HTTP 端点（例如 `http://127.0.0.1:8080`） |
| `SIGNAL_ACCOUNT` | 机器人电话号码（E.164 格式） |
| `SIGNAL_ALLOWED_USERS` | E.164 格式的电话号码或 UUID（逗号分隔） |
| `SIGNAL_GROUP_ALLOWED_USERS` | 群组 ID（逗号分隔），或 `*` 表示所有群组 |
| `SIGNAL_HOME_CHANNEL_NAME` | Signal 主频道的显示名称 |
| `SIGNAL_IGNORE_STORIES` | 忽略 Signal 故事/状态更新 |
| `SIGNAL_ALLOW_ALL_USERS` | 无需允许列表允许所有 Signal 用户 |
| `TWILIO_ACCOUNT_SID` | Twilio 账户 SID（与电话技能共享） |
| `TWILIO_AUTH_TOKEN` | Twilio 认证令牌（与电话技能共享；也用于 webhook 签名验证） |
| `TWILIO_PHONE_NUMBER` | Twilio 电话号码（E.164 格式）（与电话技能共享） |
| `SMS_WEBHOOK_URL` | 用于 Twilio 签名验证的公共 URL — 必须与 Twilio 控制台中的 webhook URL 匹配（必需） |
| `SMS_WEBHOOK_PORT` | 入站短信的 webhook 监听端口（默认：`8080`） |
| `SMS_WEBHOOK_HOST` | Webhook 绑定地址（默认：`0.0.0.0`） |
| `SMS_INSECURE_NO_SIGNATURE` | 设置为 `true` 以禁用 Twilio 签名验证（仅限本地开发 — 不适用于生产环境） |
| `SMS_ALLOWED_USERS` | 允许聊天的 E.164 格式电话号码（逗号分隔） |
| `SMS_ALLOW_ALL_USERS` | 无需允许列表允许所有短信发送者 |
| `SMS_HOME_CHANNEL` | 定时任务/通知推送的电话号码 |
| `SMS_HOME_CHANNEL_NAME` | 短信主频道的显示名称 |
| `EMAIL_ADDRESS` | 电子邮件网关适配器的电子邮件地址 |
| `EMAIL_PASSWORD` | 电子邮件账户的密码或应用密码 |
| `EMAIL_IMAP_HOST` | 电子邮件适配器的 IMAP 主机名 |
| `EMAIL_IMAP_PORT` | IMAP 端口 |
| `EMAIL_SMTP_HOST` | 电子邮件适配器的 SMTP 主机名 |
| `EMAIL_SMTP_PORT` | SMTP 端口 |
| `EMAIL_ALLOWED_USERS` | 允许向机器人发消息的电子邮件地址（逗号分隔） |
| `EMAIL_HOME_ADDRESS` | 主动电子邮件推送的默认收件人 |
| `EMAIL_HOME_ADDRESS_NAME` | 电子邮件主目标的显示名称 |
| `EMAIL_POLL_INTERVAL` | 电子邮件轮询间隔（秒） |
| `EMAIL_ALLOW_ALL_USERS` | 允许所有入站电子邮件发送者 |
| `DINGTALK_CLIENT_ID` | 钉钉机器人 AppKey，来自开发者门户（[open.dingtalk.com](https://open.dingtalk.com)） |
| `DINGTALK_CLIENT_SECRET` | 钉钉机器人 AppSecret，来自开发者门户 |
| `DINGTALK_ALLOWED_USERS` | 允许向机器人发消息的钉钉用户 ID（逗号分隔） |
| `FEISHU_APP_ID` | 飞书/Lark 机器人 App ID，来自 [open.feishu.cn](https://open.feishu.cn/) |
| `FEISHU_APP_SECRET` | 飞书/Lark 机器人 App Secret |
| `FEISHU_DOMAIN` | `feishu`（中国）或 `lark`（国际）。默认：`feishu` |
| `FEISHU_CONNECTION_MODE` | `websocket`（推荐）或 `webhook`。默认：`websocket` |
| `FEISHU_ENCRYPT_KEY` | Webhook 模式的可选加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | Webhook 模式的可选验证令牌 |
| `FEISHU_ALLOWED_USERS` | 允许向机器人发消息的飞书用户 ID（逗号分隔） |
| `FEISHU_ALLOW_BOTS` | `none`（默认）/ `mentions` / `all` — 接受来自其他机器人的入站消息。参见 [bot-to-bot 消息传递](../user-guide/messaging/feishu.md#bot-to-bot-messaging) |
| `FEISHU_REQUIRE_MENTION` | `true`（默认）/ `false` — 群消息是否必须 @提及 机器人。可通过 `group_rules.<chat_id>.require_mention` 按聊天覆盖。 |
| `FEISHU_HOME_CHANNEL` | 用于定时推送和通知的飞书聊天 ID |
| `WECOM_BOT_ID` | 企业微信 AI 机器人 ID，来自管理控制台 |
| `WECOM_SECRET` | 企业微信 AI 机器人 secret |
| `WECOM_WEBSOCKET_URL` | 自定义 WebSocket URL（默认：`wss://openws.work.weixin.qq.com`） |
| `WECOM_ALLOWED_USERS` | 允许向机器人发消息的企业微信用户 ID（逗号分隔） |
| `WECOM_HOME_CHANNEL` | 用于定时推送和通知的企业微信聊天 ID |
| `WECOM_CALLBACK_CORP_ID` | 回调自建应用的企业微信企业 Corp ID |
| `WECOM_CALLBACK_CORP_SECRET` | 自建应用的 Corp secret |
| `WECOM_CALLBACK_AGENT_ID` | 自建应用的 Agent ID |
| `WECOM_CALLBACK_TOKEN` | 回调验证令牌 |
| `WECOM_CALLBACK_ENCODING_AES_KEY` | 用于回调加密的 AES 密钥 |
| `WECOM_CALLBACK_HOST` | 回调服务器绑定地址（默认：`0.0.0.0`） |
| `WECOM_CALLBACK_PORT` | 回调服务器端口（默认：`8645`） |
| `WECOM_CALLBACK_ALLOWED_USERS` | 允许列表的用户 ID（逗号分隔） |
| `WECOM_CALLBACK_ALLOW_ALL_USERS` | 设置为 `true` 以允许所有用户，无需允许列表 |
| `WEIXIN_ACCOUNT_ID` | 通过 iLink Bot API 的二维码登录获取的微信账户 ID |
| `WEIXIN_TOKEN` | 通过 iLink Bot API 的二维码登录获取的微信认证令牌 |
| `WEIXIN_BASE_URL` | 覆盖微信 iLink Bot API 基础 URL（默认：`https://ilinkai.weixin.qq.com`） |
| `WEIXIN_CDN_BASE_URL` | 覆盖用于媒体的微信 CDN 基础 URL（默认：`https://novac2c.cdn.weixin.qq.com/c2c`） |
| `WEIXIN_DM_POLICY` | 私信策略：`open`、`allowlist`、`pairing`、`disabled`（默认：`open`） |
| `WEIXIN_GROUP_POLICY` | 群消息策略：`open`、`allowlist`、`disabled`（默认：`disabled`） |
| `WEIXIN_ALLOWED_USERS` | 允许私信机器人的微信用户 ID（逗号分隔） |
| `WEIXIN_GROUP_ALLOWED_USERS` | 允许与机器人交互的微信 **群聊 ID**（不是成员用户 ID）（逗号分隔）。变量名是旧版遗留 — 它需要群组 ID。仅当 iLink 实际传递群事件时才生效；二维码登录的 iLink 机器人身份（`...@im.bot`）通常不接收普通微信群消息。 |
| `WEIXIN_HOME_CHANNEL` | 用于定时推送和通知的微信聊天 ID |
| `WEIXIN_HOME_CHANNEL_NAME` | 微信主频道的显示名称 |
| `WEIXIN_ALLOW_ALL_USERS` | 无需允许列表允许所有微信用户（`true`/`false`） |
| `BLUEBUBBLES_SERVER_URL` | BlueBubbles 服务器 URL（例如 `http://192.168.1.10:1234`） |
| `BLUEBUBBLES_PASSWORD` | BlueBubbles 服务器密码 |
| `BLUEBUBBLES_WEBHOOK_HOST` | Webhook 监听器绑定地址（默认：`127.0.0.1`） |
| `BLUEBUBBLES_WEBHOOK_PORT` | Webhook 监听器端口（默认：`8645`） |
| `BLUEBUBBLES_HOME_CHANNEL` | 定时任务/通知推送的电话号码/电子邮件 |
| `BLUEBUBBLES_ALLOWED_USERS` | 授权用户（逗号分隔） |
| `BLUEBUBBLES_ALLOW_ALL_USERS` | 允许所有用户（`true`/`false`） |
| `QQ_APP_ID` | QQ 机器人 App ID，来自 [q.qq.com](https://q.qq.com) |
| `QQ_CLIENT_SECRET` | QQ 机器人 App Secret，来自 [q.qq.com](https://q.qq.com) |
| `QQ_STT_API_KEY` | 外部 STT 后备提供商的 API 密钥（可选，当 QQ 内置 ASR 未返回文本时使用） |
| `QQ_STT_BASE_URL` | 外部 STT 提供商的基础 URL（可选） |
| `QQ_STT_MODEL` | 外部 STT 提供商的模型名称（可选） |
| `QQ_ALLOWED_USERS` | 允许向机器人发消息的 QQ 用户 openID（逗号分隔） |
| `QQ_GROUP_ALLOWED_USERS` | 用于群组 @消息访问的 QQ 群 ID（逗号分隔） |
| `QQ_ALLOW_ALL_USERS` | 允许所有用户（`true`/`false`，覆盖 `QQ_ALLOWED_USERS`） |
| `QQBOT_HOME_CHANNEL` | 用于定时推送和通知的 QQ 用户/群组 openID |
| `QQBOT_HOME_CHANNEL_NAME` | QQ 主频道的显示名称 |
| `QQ_PORTAL_HOST` | 覆盖 QQ 门户主机（设置为 `sandbox.q.qq.com` 以通过沙盒网关路由；默认：`q.qq.com`）。 |
| `MATTERMOST_URL` | Mattermost 服务器 URL（例如 `https://mm.example.com`） |
| `MATTERMOST_TOKEN` | 用于 Mattermost 的机器人令牌或个人访问令牌 |
| `MATTERMOST_ALLOWED_USERS` | 允许向机器人发消息的 Mattermost 用户 ID（逗号分隔） |
| `MATTERMOST_HOME_CHANNEL` | 用于主动消息推送（定时任务、通知）的频道 ID |
| `MATTERMOST_REQUIRE_MENTION` | 在频道中需要 `@提及`（默认：`true`）。设置为 `false` 以响应所有消息。 |
| `MATTERMOST_FREE_RESPONSE_CHANNELS` | 机器人无需 `@提及` 即可响应的频道 ID（逗号分隔） |
| `MATTERMOST_REPLY_MODE` | 回复样式：`thread`（线程化回复）或 `off`（平铺消息，默认） |
| `MATRIX_HOMESERVER` | Matrix 主服务器 URL（例如 `https://matrix.org`） |
| `MATRIX_ACCESS_TOKEN` | 用于机器人认证的 Matrix 访问令牌 |
| `MATRIX_USER_ID` | Matrix 用户 ID（例如 `@hermes:matrix.org`）— 密码登录所需，访问令牌可选 |
| `MATRIX_PASSWORD` | Matrix 密码（访问令牌的替代方案） |
| `MATRIX_ALLOWED_USERS` | 允许向机器人发消息的 Matrix 用户 ID（逗号分隔）（例如 `@alice:matrix.org`） |
| `MATRIX_HOME_ROOM` | 用于主动消息推送的房间 ID（例如 `!abc123:matrix.org`） |
| `MATRIX_ENCRYPTION` | 启用端到端加密（`true`/`false`，默认：`false`） |
| `MATRIX_DEVICE_ID` | 用于 E2EE 跨重启持久性的稳定设备 ID（例如 `HERMES_BOT`）。若不设置，E2EE 密钥每次启动都会轮换，历史房间解密将失败。 |
| `MATRIX_REACTIONS` | 在入站消息上启用处理生命周期表情符号反应（默认：`true`）。设置为 `false` 可禁用。 |
| `MATRIX_REQUIRE_MENTION` | 在房间中需要 `@提及`（默认：`true`）。设置为 `false` 以响应所有消息。 |
| `MATRIX_FREE_RESPONSE_ROOMS` | 机器人无需 `@提及` 即可响应的房间 ID（逗号分隔） |
| `MATRIX_AUTO_THREAD` | 为房间消息自动创建线程（默认：`true`） |
| `MATRIX_DM_MENTION_THREADS` | 当机器人在私聊中被 `@提及` 时创建线程（默认：`false`） |
| `MATRIX_RECOVERY_KEY` | 用于设备密钥轮换后跨签名验证的恢复密钥。推荐用于启用跨签名的 E2EE 设置。 |
| `HASS_TOKEN` | Home Assistant 长期访问令牌（启用 HA 平台 + 工具） |
| `HASS_URL` | Home Assistant URL（默认：`http://homeassistant.local:8123`） |
| `WEBHOOK_ENABLED` | 启用 webhook 平台适配器（`true`/`false`） |
| `WEBHOOK_PORT` | 用于接收 webhooks 的 HTTP 服务器端口（默认：`8644`） |
| `WEBHOOK_SECRET` | 用于 webhook 签名验证的全局 HMAC 密钥（当路由未指定自己的密钥时用作后备） |
| `API_SERVER_ENABLED` | 启用 OpenAI 兼容的 API 服务器（`true`/`false`）。与其他平台并行运行。 |
| `API_SERVER_KEY` | 用于 API 服务器认证的 Bearer 令牌。非环回绑定时强制要求。 |
| `API_SERVER_CORS_ORIGINS` | 允许直接调用 API 服务器的浏览器源（逗号分隔）（例如 `http://localhost:3000,http://127.0.0.1:3000`）。默认：禁用。 |
| `API_SERVER_PORT` | API 服务器端口（默认：`8642`） |
| `API_SERVER_HOST` | API 服务器的主机/绑定地址（默认：`127.0.0.1`）。使用 `0.0.0.0` 进行网络访问 — 需要 `API_SERVER_KEY` 和严格的 `API_SERVER_CORS_ORIGINS` 允许列表。 |
| `API_SERVER_MODEL_NAME` | 在 `/v1/models` 上公布的模型名称。默认为配置文件名称（或默认配置文件的 `hermes-agent`）。在多用户设置中很有用，像 Open WebUI 这样的前端需要为每个连接指定不同的模型名称。 |
| `GATEWAY_PROXY_URL` | 用于转发消息的远程 Hermes API 服务器 URL（[代理模式](/docs/user-guide/messaging/matrix#proxy-mode-e2ee-on-macos)）。设置后，网关仅处理平台 I/O — 所有智能体工作都委托给远程服务器。也可通过 `config.yaml` 中的 `gateway.proxy_url` 配置。 |
| `GATEWAY_PROXY_KEY` | 用于在代理模式下向远程 API 服务器进行身份验证的 Bearer 令牌。必须与远程主机上的 `API_SERVER_KEY` 匹配。 |
| `MESSAGING_CWD` | 消息传递模式下终端命令的工作目录（默认：`~`） |
| `GATEWAY_ALLOWED_USERS` | 跨所有平台允许的用户 ID（逗号分隔） |
| `GATEWAY_ALLOW_ALL_USERS` | 无需允许列表允许所有用户（`true`/`false`，默认：`false`） |

### Microsoft Graph（Teams 会议）

用于即将到来的 Teams 会议摘要管道的 Microsoft Graph REST 客户端的应用程序凭据。请参阅[注册 Microsoft Graph 应用程序](/docs/guides/microsoft-graph-app-registration)获取 Azure 门户演练和所需的 API 权限。

| 变量 | 描述 |
|----------|-------------|
| `MSGRAPH_TENANT_ID` | 用于 Graph 应用程序注册的 Azure AD 租户 ID（目录 GUID）。 |
| `MSGRAPH_CLIENT_ID` | Azure 应用程序注册的应用程序（客户端）ID。 |
| `MSGRAPH_CLIENT_SECRET` | 应用程序注册的客户端密钥值。存储在 `~/.hermes/.env` 中并设置 `chmod 600`；定期通过 Azure 门户轮换。 |
| `MSGRAPH_SCOPE` | 用于客户端凭据令牌请求的 OAuth2 范围（默认：`https://graph.microsoft.com/.default`）。 |
| `MSGRAPH_AUTHORITY_URL` | Microsoft 标识平台权限（默认：`https://login.microsoftonline.com`）。仅针对国家/主权云覆盖（例如，GCC High 为 `https://login.microsoftonline.us`）。 |

### Microsoft Graph Webhook 监听器

用于 Graph 事件（Teams 会议、日历、聊天等）的入站更改通知监听器。请参阅 [Microsoft Graph Webhook 监听器](/docs/user-guide/messaging/msgraph-webhook)了解设置和安全强化。

| 变量 | 描述 |
|----------|-------------|
| `MSGRAPH_WEBHOOK_ENABLED` | 启用 `msgraph_webhook` 网关平台（`true`/`1`/`yes`）。 |
| `MSGRAPH_WEBHOOK_PORT` | 监听器绑定的端口（默认：`8646`）。 |
| `MSGRAPH_WEBHOOK_CLIENT_STATE` | Graph 在每个通知中回显的共享密钥；与 `hmac.compare_digest` 比较。使用 `openssl rand -hex 32` 生成。 |
| `MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES` | Graph 资源路径/模式的允许列表（逗号分隔）（例如 `communications/onlineMeetings,chats/*/messages`）。尾部 `*` 为前缀匹配。空 = 接受所有。 |
| `MSGRAPH_WEBHOOK_ALLOWED_SOURCE_CIDRS` | 允许向监听器发送 POST 的 CIDR 范围（逗号分隔）（例如 `52.96.0.0/14,52.104.0.0/14`）。空 = 允许所有（默认）。在生产环境中限制为 Microsoft Graph 公布的出口范围。 |

### Teams 会议摘要推送

仅在启用 [`teams_pipeline` 插件](/docs/user-guide/messaging/msgraph-webhook)时使用。设置也可在 `config.yaml` 的 `platforms.teams.extra` 下配置 — 当两者都设置时，环境变量优先。请参阅 [Microsoft Teams → 会议摘要推送](/docs/user-guide/messaging/teams#meeting-summary-delivery-teams-meeting-pipeline)。

| 变量 | 描述 |
|----------|-------------|
| `TEAMS_DELIVERY_MODE` | `graph` 或 `incoming_webhook`。 |
| `TEAMS_INCOMING_WEBHOOK_URL` | Teams 生成的 webhook URL；当 `TEAMS_DELIVERY_MODE=incoming_webhook` 时必需。 |
| `TEAMS_GRAPH_ACCESS_TOKEN` | 用于 Graph 推送的预先获取的委托访问令牌。很少需要 — 未设置时，写入器会回退到 `MSGRAPH_*` 应用程序凭据。 |
| `TEAMS_TEAM_ID` | 用于频道推送的目标 Team ID（`graph` 模式）。 |
| `TEAMS_CHANNEL_ID` | 目标频道 ID（与 `TEAMS_TEAM_ID` 配对）。 |
| `TEAMS_CHAT_ID` | 目标 1:1 或群组聊天 ID（`graph` 模式下 team+channel 的替代方案）。 |

### LINE 消息传递 API

由捆绑的 LINE 平台插件（`plugins/platforms/line/`）使用。请参阅 [消息传递网关 → LINE](/docs/user-guide/messaging/line) 了解完整设置。

| 变量 | 描述 |
|----------|-------------|
| `LINE_CHANNEL_ACCESS_TOKEN` | 来自 LINE Developers Console（Messaging API 选项卡）的长期频道访问令牌。必需。 |
| `LINE_CHANNEL_SECRET` | 频道密钥（Basic settings 选项卡）；用于 HMAC-SHA256 webhook 签名验证。必需。 |
| `LINE_HOST` | Webhook 绑定主机（默认：`0.0.0.0`）。 |
| `LINE_PORT` | Webhook 绑定端口（默认：`8646`）。 |
| `LINE_PUBLIC_URL` | 公共 HTTPS 基础 URL（例如 `https://my-tunnel.example.com`）。发送图片/音频/视频所需 — LINE 仅接受 HTTPS 可访问的 URL。 |
| `LINE_ALLOWED_USERS` | 允许私信机器人的用户 ID（`U` 前缀）（逗号分隔）。 |
| `LINE_ALLOWED_GROUPS` | 机器人将在其中响应的群组 ID（`C` 前缀）（逗号分隔）。 |
| `LINE_ALLOWED_ROOMS` | 机器人将在其中响应的房间 ID（`R` 前缀）（逗号分隔）。 |
| `LINE_ALLOW_ALL_USERS` | 仅限开发 — 接受任何来源。默认：`false`。 |
| `LINE_HOME_CHANNEL` | 使用 `deliver: line` 的定时任务的默认推送目标。 |
| `LINE_SLOW_RESPONSE_THRESHOLD` | 慢 LLM 模板按钮 postback 触发前的秒数（默认：`45`）。设置 `0` 以禁用并始终使用 Push 回退。 |
| `LINE_PENDING_TEXT` | 与 postback 按钮一起显示的气泡文本。 |
| `LINE_BUTTON_LABEL` | Postback 按钮标签（默认：`Get answer`）。 |
| `LINE_DELIVERED_TEXT` | 再次点击已推送的 postback 时的回复（默认：`Already replied ✅`）。 |
| `LINE_INTERRUPTED_TEXT` | 点击由 `/stop` 中断的 postback 按钮时的回复（默认：`Run was interrupted before completion.`）。 |

### 高级消息传递调优

用于节流出站消息批处理器的每个平台高级调节项。大多数用户无需更改这些设置；默认值设置为在尊重每个平台速率限制的同时避免感觉迟钝。

| 变量 | 描述 |
|----------|-------------|
| `HERMES_TELEGRAM_TEXT_BATCH_DELAY_SECONDS` | 刷新排队的 Telegram 文本块前的宽限期（默认：`0.6`）。 |
| `HERMES_TELEGRAM_TEXT_BATCH_SPLIT_DELAY_SECONDS` | 当单条 Telegram 消息超过长度限制时，分块之间的延迟（默认：`2.0`）。 |
| `HERMES_TELEGRAM_MEDIA_BATCH_DELAY_SECONDS` | 刷新排队的 Telegram 媒体前的宽限期（默认：`0.6`）。 |
| `HERMES_TELEGRAM_FOLLOWUP_GRACE_SECONDS` | 智能体完成后发送后续消息前的延迟，以避免与最后一个流块竞争。 |
| `HERMES_TELEGRAM_HTTP_CONNECT_TIMEOUT` / `_READ_TIMEOUT` / `_WRITE_TIMEOUT` / `_POOL_TIMEOUT` | 覆盖底层 `python-telegram-bot` HTTP 超时（秒）。 |
| `HERMES_TELEGRAM_HTTP_POOL_SIZE` | 到 Telegram API 的最大并发 HTTP 连接数。 |
| `HERMES_TELEGRAM_DISABLE_FALLBACK_IPS` | 禁用当 DNS 失败时使用的硬编码 Cloudflare 后备 IP（`true`/`false`）。 |
| `HERMES_DISCORD_TEXT_BATCH_DELAY_SECONDS` | 刷新排队的 Discord 文本块前的宽限期（默认：`0.6`）。 |
| `HERMES_DISCORD_TEXT_BATCH_SPLIT_DELAY_SECONDS` | 当 Discord 消息超过长度限制时，分块之间的延迟（默认：`2.0`）。 |
| `HERMES_MATRIX_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` | Telegram 批处理调节项的 Matrix 等效项。 |
| `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` / `_MAX_CHARS` / `_MAX_MESSAGES` | 飞书批处理器调优 — 延迟、分块延迟、每条消息最大字符数、每批最大消息数。 |
| `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 飞书媒体刷新延迟。 |
| `HERMES_FEISHU_DEDUP_CACHE_SIZE` | 飞书 webhook 去重缓存大小（默认：`1024`）。 |
| `HERMES_WECOM_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` | 企业微信批处理器调优。 |
| `HERMES_VISION_DOWNLOAD_TIMEOUT` | 将图像交给视觉模型前的下载超时秒数（默认：`30`）。 |
| `HERMES_RESTART_DRAIN_TIMEOUT` | 网关：在 `/restart` 时等待活跃运行排空的秒数，超过后强制重启（默认：`900`）。 |
| `HERMES_GATEWAY_PLATFORM_CONNECT_TIMEOUT` | 网关启动期间每个平台的连接超时（秒）。 |
| `HERMES_GATEWAY_BUSY_INPUT_MODE` | 默认网关繁忙输入行为：`queue`、`steer` 或 `interrupt`。可通过 `/busy` 按聊天覆盖。 |
| `HERMES_GATEWAY_BUSY_ACK_ENABLED` | 当用户在智能体忙时发送输入，网关是否发送确认消息（⚡/⏳/⏩）（默认：`true`）。设置为 `false` 可完全抑制这些消息 — 输入仍会正常排队/引导/中断，只是聊天回复被静音。从 `config.yaml` 中的 `display.busy_ack_enabled` 桥接而来。 |
| `HERMES_CRON_TIMEOUT` | 定时任务智能体运行的不活动超时秒数（默认：`600`）。智能体在主动调用工具或接收流令牌时可以无限期运行 — 仅在空闲时触发。设置为 `0` 表示无限制。 |
| `HERMES_CRON_SCRIPT_TIMEOUT` | 定时任务附加的预运行脚本超时秒数（默认：`120`）。为需要更长执行时间的脚本覆盖（例如，用于反机器人定时的随机延迟）。也可通过 `config.yaml` 中的 `cron.script_timeout_seconds` 配置。 |
| `HERMES_CRON_MAX_PARALLEL` | 每个 tick 并行运行的最大定时任务数（默认：`4`）。 |

## 智能体行为

| 变量 | 描述 |
|------|------|
| `HERMES_MAX_ITERATIONS` | 每次对话的最大工具调用迭代次数（默认：90） |
| `HERMES_INFERENCE_MODEL` | 在进程级别覆盖模型名称（会话中优先级高于 `config.yaml`）。也可通过 `-m`/`--model` 标志设置。 |
| `HERMES_YOLO_MODE` | 设为 `1` 可绕过危险命令的确认提示。等同于 `--yolo`。 |
| `HERMES_ACCEPT_HOOKS` | 自动批准 `config.yaml` 中声明的任何未见的 shell 钩子，无需 TTY 提示。等同于 `--accept-hooks` 或 `hooks_auto_accept: true`。 |
| `HERMES_IGNORE_USER_CONFIG` | 跳过 `~/.hermes/config.yaml`，使用内置默认值（`.env` 中的凭据仍会加载）。等同于 `--ignore-user-config`。 |
| `HERMES_IGNORE_RULES` | 跳过自动注入 `AGENTS.md`、`SOUL.md`、`.cursorrules`、记忆和预加载技能。等同于 `--ignore-rules`。 |
| `HERMES_MD_NAMES` | 逗号分隔的规则文件名列表，用于自动注入（默认：`AGENTS.md,CLAUDE.md,.cursorrules,SOUL.md`）。 |
| `HERMES_TOOL_PROGRESS` | 用于工具进度显示的已弃用兼容性变量。建议使用 `config.yaml` 中的 `display.tool_progress`。 |
| `HERMES_TOOL_PROGRESS_MODE` | 用于工具进度模式的已弃用兼容性变量。建议使用 `config.yaml` 中的 `display.tool_progress`。 |
| `HERMES_HUMAN_DELAY_MODE` | 响应定步：`off`/`natural`/`custom` |
| `HERMES_HUMAN_DELAY_MIN_MS` | 自定义延迟范围最小值（毫秒） |
| `HERMES_HUMAN_DELAY_MAX_MS` | 自定义延迟范围最大值（毫秒） |
| `HERMES_QUIET` | 抑制非必要输出（`true`/`false`） |
| `HERMES_API_TIMEOUT` | LLM API 调用超时时间（秒）（默认：`1800`） |
| `HERMES_API_CALL_STALE_TIMEOUT` | 非流式陈旧调用超时时间（秒）（默认：`300`）。未设置时，对本地提供程序自动禁用。也可通过 `config.yaml` 中的 `providers.<id>.stale_timeout_seconds` 或 `providers.<id>.models.<model>.stale_timeout_seconds` 配置。 |
| `HERMES_STREAM_READ_TIMEOUT` | 流式套接字读取超时时间（秒）（默认：`120`）。对本地提供程序会自动增加至 `HERMES_API_TIMEOUT`。如果本地 LLM 在长代码生成期间超时，请增加此值。 |
| `HERMES_STREAM_STALE_TIMEOUT` | 陈旧流检测超时时间（秒）（默认：`180`）。对本地提供程序自动禁用。如果在此时间窗口内没有收到任何数据块，将触发连接终止。 |
| `HERMES_STREAM_RETRIES` | 针对瞬态网络错误的中流重连尝试次数（默认：`3`）。 |
| `HERMES_AGENT_TIMEOUT` | 网关对运行中的智能体的不活动超时时间（秒）（默认：`900`）。每次工具调用和流式传输的令牌都会重置。设为 `0` 以禁用。 |
| `HERMES_AGENT_TIMEOUT_WARNING` | 网关：在此时间（秒）的不活动后发送警告消息（默认：`HERMES_AGENT_TIMEOUT` 的 75%）。 |
| `HERMES_AGENT_NOTIFY_INTERVAL` | 网关：对长时间运行的智能体轮次，进度通知之间的间隔（秒）。 |
| `HERMES_CHECKPOINT_TIMEOUT` | 文件系统检查点创建的超时时间（秒）（默认：`30`）。 |
| `HERMES_EXEC_ASK` | 在网关模式下启用执行批准提示（`true`/`false`） |
| `HERMES_ENABLE_PROJECT_PLUGINS` | 启用从 `./.hermes/plugins/` 自动发现仓库本地插件（`true`/`false`，默认：`false`） |
| `HERMES_PLUGINS_DEBUG` | `1`/`true` 可在 stderr 上显示详细的插件发现日志——扫描的目录、解析的清单、跳过的原因以及解析或 `register()` 失败时的完整回溯。面向插件作者。 |
| `HERMES_BACKGROUND_NOTIFICATIONS` | 网关中的后台进程通知模式：`all`（默认）、`result`、`error`、`off` |
| `HERMES_EPHEMERAL_SYSTEM_PROMPT` | 在 API 调用时注入的临时系统提示（永远不会持久化到会话中） |
| `HERMES_PREFILL_MESSAGES_FILE` | 临时预填充消息 JSON 文件的路径，在 API 调用时注入。 |
| `HERMES_ALLOW_PRIVATE_URLS` | `true`/`false` — 允许工具获取 localhost/私有网络 URL。在网关模式下默认关闭。 |
| `HERMES_REDACT_SECRETS` | `true`/`false` — 控制工具输出、日志和聊天响应中的密钥编辑（默认：`true`）。 |
| `HERMES_WRITE_SAFE_ROOT` | 可选的目录前缀，用于限制 `write_file`/`patch` 的写入；超出路径需要批准。 |
| `HERMES_DISABLE_FILE_STATE_GUARD` | 设为 `1` 以关闭 `patch`/`write_file` 上的“文件自读取后已更改”保护。 |
| `HERMES_CORE_TOOLS` | 逗号分隔的规范核心工具列表覆盖（高级；很少需要）。 |
| `HERMES_BUNDLED_SKILLS` | 逗号分隔的启动时加载的捆绑技能列表覆盖。 |
| `HERMES_OPTIONAL_SKILLS` | 逗号分隔的可选技能名称列表，首次运行时自动安装。 |
| `HERMES_DEBUG_INTERRUPT` | 设为 `1` 可将详细的中断/取消追踪记录到 `agent.log`。 |
| `HERMES_DUMP_REQUESTS` | 将 API 请求负载转储到日志文件（`true`/`false`） |
| `HERMES_DUMP_REQUEST_STDOUT` | 将 API 请求负载转储到 stdout 而不是日志文件。 |
| `HERMES_OAUTH_TRACE` | 设为 `1` 可记录 OAuth 令牌交换和刷新尝试。包括编辑后的时序信息。 |
| `HERMES_OAUTH_FILE` | 覆盖用于 OAuth 凭据存储的路径（默认：`~/.hermes/auth.json`）。 |
| `HERMES_AGENT_HELP_GUIDANCE` | 向自定义部署的系统提示追加额外的指导文本。 |
| `HERMES_AGENT_LOGO` | 覆盖 CLI 启动时的 ASCII 横幅标识。 |
| `DELEGATION_MAX_CONCURRENT_CHILDREN` | 每个 `delegate_task` 批次的最大并行子智能体数（默认：`3`，最小为 1，无上限）。也可通过 `config.yaml` 中的 `delegation.max_concurrent_children` 配置——配置值优先级更高。 |

## 界面

| 变量 | 描述 |
|----------|-------------|
| `HERMES_TUI` | 设为 `1` 时启动 [TUI](../user-guide/tui.md) 而非经典 CLI。等同于传递 `--tui`。 |
| `HERMES_TUI_DIR` | 指向预构建的 `ui-tui/` 目录的路径（必须包含 `dist/entry.js` 和已填充的 `node_modules`）。供发行版和 Nix 使用，以跳过首次启动时的 `npm install`。 |
| `HERMES_TUI_RESUME` | 启动时通过 ID 恢复特定的 TUI 会话。设置后，`hermes --tui` 会跳过创建新会话，直接连接到指定的命名会话——在断开连接或终端崩溃后重新接入时非常有用。 |
| `HERMES_TUI_THEME` | 强制设置 TUI 颜色主题：`light`、`dark`，或一个 6 位背景十六进制色值（例如 `ffffff` 或 `1a1a2e`）。未设置时，Hermes 会使用 `COLORFGBG` 和终端背景查询自动检测；此变量可在不设置 `COLORFGBG` 的终端（Ghostty、Warp、iTerm2 等）上覆盖自动检测。 |
| `HERMES_INFERENCE_MODEL` | 无需修改 `config.yaml` 即可强制指定 `hermes -z` / `hermes chat` 使用的模型。与 `HERMES_INFERENCE_PROVIDER` 配合使用。适用于需要在每次运行时覆盖默认模型的脚本调用方（清理器、CI、批量运行器）。 |

## 会话设置

| 变量 | 描述 |
|----------|-------------|
| `SESSION_IDLE_MINUTES` | 在 N 分钟不活动后重置会话（默认：1440） |
| `SESSION_RESET_HOUR` | 每日重置时间，24 小时制（默认：4 = 凌晨 4 点） |

## 上下文压缩（仅限 config.yaml）

上下文压缩完全通过 `config.yaml` 进行配置——没有对应的环境变量。阈值设置位于 `compression:` 块中，而摘要模型/提供商位于 `auxiliary.compression:` 下。

```yaml
compression:
  enabled: true
  threshold: 0.50
  target_ratio: 0.20         # 保留为近期尾部的阈值比例
  protect_last_n: 20         # 保持未压缩的最近消息最低数量
```

:::info 旧版迁移
包含 `compression.summary_model`、`compression.summary_provider` 和 `compression.summary_base_url` 的旧配置会在首次加载时自动迁移到 `auxiliary.compression.*`。
:::

## 辅助任务覆盖

| 变量 | 描述 |
|----------|-------------|
| `AUXILIARY_VISION_PROVIDER` | 覆盖视觉任务的提供商 |
| `AUXILIARY_VISION_MODEL` | 覆盖视觉任务的模型 |
| `AUXILIARY_VISION_BASE_URL` | 视觉任务的直接 OpenAI 兼容端点 |
| `AUXILIARY_VISION_API_KEY` | 与 `AUXILIARY_VISION_BASE_URL` 配对的 API 密钥 |
| `AUXILIARY_WEB_EXTRACT_PROVIDER` | 覆盖网页提取/摘要的提供商 |
| `AUXILIARY_WEB_EXTRACT_MODEL` | 覆盖网页提取/摘要的模型 |
| `AUXILIARY_WEB_EXTRACT_BASE_URL` | 网页提取/摘要的直接 OpenAI 兼容端点 |
| `AUXILIARY_WEB_EXTRACT_API_KEY` | 与 `AUXILIARY_WEB_EXTRACT_BASE_URL` 配对的 API 密钥 |

对于任务特定的直接端点，Hermes 使用该任务配置的 API 密钥或 `OPENAI_API_KEY`。它不会为这些自定义端点复用 `OPENROUTER_API_KEY`。

## 备用提供商（仅限 config.yaml）

主模型的备用链完全通过 `config.yaml` 进行配置——没有对应的环境变量。添加一个包含 `provider` 和 `model` 键的顶层 `fallback_providers` 列表，即可在主模型遇到错误时启用自动故障转移。

```yaml
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
```

旧版的顶层 `fallback_model` 单提供商格式仍可读取以保持向后兼容，但新配置应使用 `fallback_providers`。

详情请参阅[备用提供商](/docs/user-guide/features/fallback-providers)。

## 提供商路由（仅限 config.yaml）

这些配置位于 `~/.hermes/config.yaml` 的 `provider_routing` 部分下：

| 键 | 描述 |
|-----|-------------|
| `sort` | 提供商排序：`"price"`（默认）、`"throughput"` 或 `"latency"` |
| `only` | 允许的提供商标识列表（例如 `["anthropic", "google"]`） |
| `ignore` | 跳过的提供商标识列表 |
| `order` | 按顺序尝试的提供商标识列表 |
| `require_parameters` | 仅使用支持所有请求参数的提供商（`true`/`false`） |
| `data_collection` | `"allow"`（默认）或 `"deny"` 以排除存储数据的提供商 |

:::tip
使用 `hermes config set` 来设置环境变量——它会自动将变量保存到正确的文件中（密钥保存到 `.env`，其他所有配置保存到 `config.yaml`）。
:::