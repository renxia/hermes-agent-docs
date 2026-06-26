---
sidebar_position: 2
title: "Environment Variables"
description: "Hermes 智能体所使用的所有环境变量的完整参考"
---

# 环境变量参考

Hermes 从进程环境读取环境变量，对于用户管理的秘密信息，则从 `~/.hermes/.env` 读取。将 API 密钥、机器人令牌、OAuth 密钥和其他凭证保存在 `.env` 中；如果存在配置键，则优先使用 `config.yaml` 来设置非秘密行为。下面的某些变量是仅限进程的覆盖项或内部桥接变量，不应仅仅因为它们被记录在这里就提交到 `.env` 中。

## LLM Providers

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key (recommended for flexibility) |
| `OPENROUTER_BASE_URL` | Override the OpenRouter-compatible base URL |
| `HERMES_OPENROUTER_CACHE` | Enable OpenRouter response caching (`1`/`true`/`yes`/`on`). Overrides `openrouter.response_cache` in config.yaml. See [Response Caching](https://openrouter.ai/docs/guides/features/response-caching). |
| `HERMES_OPENROUTER_CACHE_TTL` | Cache TTL in seconds (1-86400). Overrides `openrouter.response_cache_ttl` in config.yaml. |
| `NOUS_BASE_URL` | Override Nous Portal base URL (rarely needed; development/testing only) |
| `NOUS_INFERENCE_BASE_URL` | Override Nous inference endpoint directly |
| `OPENAI_API_KEY` | API key for custom OpenAI-compatible endpoints (used with `OPENAI_BASE_URL`) |
| `OPENAI_BASE_URL` | Base URL for custom endpoint (VLLM, SGLang, etc.) |
| `LM_API_KEY` | API key for LM Studio (`lmstudio` provider). Often a placeholder for local servers |
| `LM_BASE_URL` | LM Studio base URL (default: `http://localhost:1234/v1`) |
| `COPILOT_GITHUB_TOKEN` | GitHub token for Copilot API — first priority (OAuth `gho_*` or fine-grained PAT `github_pat_*`; classic PATs `ghp_*` are **not supported**) |
| `GH_TOKEN` | GitHub token — second priority for Copilot (also used by `gh` CLI) |
| `GITHUB_TOKEN` | GitHub token — third priority for Copilot |
| `HERMES_COPILOT_ACP_COMMAND` | Override Copilot ACP CLI binary path (default: `copilot`) |
| `COPILOT_CLI_PATH` | Alias for `HERMES_COPILOT_ACP_COMMAND` |
| `HERMES_COPILOT_ACP_ARGS` | Override Copilot ACP arguments (default: `--acp --stdio`) |
| `COPILOT_ACP_BASE_URL` | Override Copilot ACP base URL |
| `COPILOT_API_BASE_URL` | Override the Copilot API base URL (`copilot` provider) |
| `GLM_API_KEY` | z.ai / ZhipuAI GLM API key ([z.ai](https://z.ai)) |
| `ZAI_API_KEY` | Alias for `GLM_API_KEY` |
| `Z_AI_API_KEY` | Alias for `GLM_API_KEY` |
| `GLM_BASE_URL` | Override z.ai base URL (default: `https://api.z.ai/api/paas/v4`) |
| `KIMI_API_KEY` | Kimi / Moonshot AI API key ([moonshot.ai](https://platform.moonshot.ai)) |
| `KIMI_CODING_API_KEY` | Alias key for the `kimi-coding` provider (accepted alongside `KIMI_API_KEY`) |
| `KIMI_BASE_URL` | Override Kimi base URL (default: `https://api.moonshot.ai/v1`) |
| `KIMI_CN_API_KEY` | Kimi / Moonshot China API key ([moonshot.cn](https://platform.moonshot.cn)) |
| `ARCEEAI_API_KEY` | Arcee AI API key ([chat.arcee.ai](https://chat.arcee.ai/)) |
| `ARCEE_BASE_URL` | Override Arcee base URL (default: `https://api.arcee.ai/api/v1`) |
| `GMI_API_KEY` | GMI Cloud API key ([gmicloud.ai](https://www.gmicloud.ai/)) |
| `GMI_BASE_URL` | Override GMI Cloud base URL (default: `https://api.gmi-serving.com/v1`) |
| `MINIMAX_API_KEY` | MiniMax API key — global endpoint ([minimax.io](https://www.minimax.io)). **Not used by `minimax-oauth`** (OAuth path uses browser login instead). |
| `MINIMAX_BASE_URL` | Override MiniMax base URL (default: `https://api.minimax.io/anthropic` — Hermes uses MiniMax's Anthropic Messages-compatible endpoint). **Not used by `minimax-oauth`**. |
| `MINIMAX_CN_API_KEY` | MiniMax API key — China endpoint ([minimaxi.com](https://www.minimaxi.com)). **Not used by `minimax-oauth`** (OAuth path uses browser login instead). |
| `MINIMAX_CN_BASE_URL` | Override MiniMax China base URL (default: `https://api.minimaxi.com/anthropic`). **Not used by `minimax-oauth`**. |
| `KILOCODE_API_KEY` | Kilo Code API key ([kilo.ai](https://kilo.ai)) |
| `KILOCODE_BASE_URL` | Override Kilo Code base URL (default: `https://api.kilo.ai/api/gateway`) |
| `XIAOMI_API_KEY` | Xiaomi MiMo API key ([platform.xiaomimimo.com](https://platform.xiaomimimo.com)) |
| `XIAOMI_BASE_URL` | Override Xiaomi MiMo base URL (default: `https://api.xiaomimimo.com/v1`) |
| `TOKENHUB_API_KEY` | Tencent TokenHub API key ([tokenhub.tencentmaas.com](https://tokenhub.tencentmaas.com)) |
| `TOKENHUB_BASE_URL` | Override Tencent TokenHub base URL (default: `https://tokenhub.tencentmaas.com/v1`) |
| `AZURE_FOUNDRY_API_KEY` | Microsoft Foundry / Azure OpenAI API key ([ai.azure.com](https://ai.azure.com/)). Not needed when `model.auth_mode: entra_id` |
| `AZURE_FOUNDRY_BASE_URL` | Microsoft Foundry endpoint URL (e.g. `https://<resource>.openai.azure.com/openai/v1` for OpenAI-style, or `https://<resource>.services.ai.azure.com/anthropic` for Anthropic-style) |
| `AZURE_ANTHROPIC_KEY` | Azure Anthropic API key for `provider: anthropic` + `base_url` pointing at a Microsoft Foundry Claude deployment (alternative to `ANTHROPIC_API_KEY` when both Anthropic and Azure Anthropic are configured) |
| `AZURE_TENANT_ID` | Entra ID tenant ID (service-principal flows; honored by `azure-identity` when `model.auth_mode: entra_id`) |
| `AZURE_CLIENT_ID` | Entra ID client ID (service principal, workload identity, or user-assigned managed identity) |
| `AZURE_CLIENT_SECRET` | Service principal secret used by `EnvironmentCredential` |
| `AZURE_CLIENT_CERTIFICATE_PATH` | Service principal certificate (alternative to `AZURE_CLIENT_SECRET`) |
| `AZURE_FEDERATED_TOKEN_FILE` | Federated token file path for AKS Workload Identity / OIDC flows |
| `AZURE_AUTHORITY_HOST` | Sovereign-cloud authority override (e.g. `https://login.microsoftonline.us` for Azure Government). See [Azure Foundry guide](/guides/azure-foundry#sovereign-clouds-government-china) |
| `IDENTITY_ENDPOINT` / `MSI_ENDPOINT` | Managed Identity endpoint for App Service, Functions, and Container Apps; VMs usually use IMDS instead and do not set these |
| `HF_TOKEN` | Hugging Face token for Inference Providers ([huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)) |
| `HF_BASE_URL` | Override Hugging Face base URL (default: `https://router.huggingface.co/v1`) |
| `GOOGLE_API_KEY` | Google AI Studio API key ([aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)) |
| `GEMINI_API_KEY` | Alias for `GOOGLE_API_KEY` |
| `GEMINI_BASE_URL` | Override Google AI Studio base URL |
| `ANTHROPIC_API_KEY` | Anthropic Console API key ([console.anthropic.com](https://console.anthropic.com/)) |
| `ANTHROPIC_BASE_URL` | Override the Anthropic API base URL |
| `ANTHROPIC_TOKEN` | Manual or legacy Anthropic OAuth/setup-token override |
| `DASHSCOPE_API_KEY` | Qwen Cloud (Alibaba DashScope) API key for Qwen models ([modelstudio.console.alibabacloud.com](https://modelstudio.console.alibabacloud.com/)) |
| `DASHSCOPE_BASE_URL` | Custom DashScope base URL (default: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`; use `https://dashscope.aliyuncs.com/compatible-mode/v1` for mainland-China region) |
| `ALIBABA_CODING_PLAN_API_KEY` | Qwen Coding Plan API key (`alibaba-coding-plan` provider) |
| `ALIBABA_CODING_PLAN_BASE_URL` | Override the Qwen Coding Plan base URL |
| `DEEPSEEK_API_KEY` | DeepSeek API key for direct DeepSeek access ([platform.deepseek.com](https://platform.deepseek.com/api_keys)) |
| `DEEPSEEK_BASE_URL` | Custom DeepSeek API base URL |
| `NOVITA_API_KEY` | NovitaAI API key — AI-native cloud for Model API, Agent Sandbox, and GPU Cloud ([novita.ai/settings/key-management](https://novita.ai/settings/key-management)) |
| `NOVITA_BASE_URL` | Override NovitaAI base URL (default: `https://api.novita.ai/openai/v1`) |
| `NVIDIA_API_KEY` | NVIDIA NIM API key — Nemotron and open models ([build.nvidia.com](https://build.nvidia.com)) |
| `NVIDIA_BASE_URL` | Override NVIDIA base URL (default: `https://integrate.api.nvidia.com/v1`; set to `http://localhost:8000/v1` for a local NIM endpoint) |
| `STEPFUN_API_KEY` | StepFun API key — Step-series models ([platform.stepfun.com](https://platform.stepfun.com)) |
| `STEPFUN_BASE_URL` | Override StepFun base URL (default: `https://api.stepfun.com/v1`) |
| `OLLAMA_API_KEY` | Ollama Cloud API key — managed Ollama catalog without local GPU ([ollama.com/settings/keys](https://ollama.com/settings/keys)) |
| `OLLAMA_BASE_URL` | Override Ollama Cloud base URL (default: `https://ollama.com/v1`) |
| `XAI_API_KEY` | xAI (Grok) API key for chat + TTS + web search ([console.x.ai](https://console.x.ai/)) |
| `XAI_BASE_URL` | Override xAI base URL (default: `https://api.x.ai/v1`) |
| `MISTRAL_API_KEY` | Mistral API key for Voxtral TTS and Voxtral STT ([console.mistral.ai](https://console.mistral.ai)) |
| `AWS_REGION` | AWS region for Bedrock inference (e.g. `us-east-1`, `eu-central-1`). Read by boto3. |
| `AWS_PROFILE` | AWS named profile for Bedrock authentication (reads `~/.aws/credentials`). Leave unset to use default boto3 credential chain. |
| `BEDROCK_BASE_URL` | Override Bedrock runtime base URL (default: `https://bedrock-runtime.us-east-1.amazonaws.com`; usually leave unset and use `AWS_REGION` instead) |
| `HERMES_QWEN_BASE_URL` | Qwen Portal base URL override (default: `https://portal.qwen.ai/v1`) |
| `OPENCODE_ZEN_API_KEY` | OpenCode Zen API key — pay-as-you-go access to curated models ([opencode.ai](https://opencode.ai/auth)) |
| `OPENCODE_ZEN_BASE_URL` | Override OpenCode Zen base URL |
| `OPENCODE_GO_API_KEY` | OpenCode Go API key — $10/month subscription for open models ([opencode.ai](https://opencode.ai/auth)) |
| `OPENCODE_GO_BASE_URL` | Override OpenCode Go base URL |
| `CLAUDE_CODE_OAUTH_TOKEN` | Explicit Claude Code token override if you export one manually |
| `HERMES_MODEL` | Override model name at process level (used by cron scheduler; prefer `config.yaml` for normal use) |
| `VOICE_TOOLS_OPENAI_KEY` | Preferred OpenAI key for OpenAI speech-to-text and text-to-speech providers |
| `HERMES_LOCAL_STT_COMMAND` | Optional local speech-to-text command template. Supports `{input_path}`, `{output_dir}`, `{language}`, and `{model}` placeholders |
| `HERMES_LOCAL_STT_LANGUAGE` | Default language passed to `HERMES_LOCAL_STT_COMMAND` or auto-detected local `whisper` CLI fallback (default: `en`) |
| `HERMES_HOME` | Override Hermes config directory (default: `~/.hermes`). Also scopes the gateway PID file and systemd service name, so multiple installations can run concurrently |
| `HERMES_GIT_BASH_PATH` | **Windows only.** Override `bash.exe` discovery for the terminal tool. Points at any bash — full Git-for-Windows install, WSL bash via symlink, MSYS2, Cygwin. The installer sets this automatically to the PortableGit it provisioned. See the [Windows (Native) Guide](../user-guide/windows-native.md#how-hermes-runs-shell-commands-on-windows) |
| `HERMES_DISABLE_WINDOWS_UTF8` | **Windows only.** Set to `1` to disable the UTF-8 stdio shim (`configure_windows_stdio()`) and fall back to the console's locale code page. Useful for bisecting encoding bugs; rarely the right setting in normal operation |
| `HERMES_KANBAN_HOME` | Override the shared Hermes root that anchors the kanban board (db + workspaces + worker logs). Falls back to `get_default_hermes_root()` (the parent of any active profile). Useful for tests and unusual deployments |
| `HERMES_KANBAN_BOARD` | Pin the active kanban board for this process. Takes precedence over `~/.hermes/kanban/current`; the dispatcher injects this into worker subprocess env so workers physically cannot see tasks on other boards. Defaults to `default`. Slug validation: lowercase alphanumerics + hyphens + underscores, 1-64 chars |
| `HERMES_KANBAN_DB` | Pin the kanban database file path directly (highest precedence; beats `HERMES_KANBAN_BOARD` and `HERMES_KANBAN_HOME`). The dispatcher injects this into worker subprocess env so profile workers converge on the dispatcher's board |
| `HERMES_KANBAN_WORKSPACES_ROOT` | Pin the kanban workspaces root directly (highest precedence for workspaces; beats `HERMES_KANBAN_HOME`). The dispatcher injects this into worker subprocess env |
| `HERMES_KANBAN_DISPATCH_IN_GATEWAY` | Runtime override for `kanban.dispatch_in_gateway`. Set to `0`, `false`, `no`, or `off` to keep the gateway from starting the embedded Kanban dispatcher; any other non-empty value enables it. Useful when a separate dispatcher process owns the board. |

## Provider Auth (OAuth)

对于原生 Anthropic 认证，Hermes 倾向于使用 Claude Code 自身的凭证文件（如果存在），因为这些凭证可以自动刷新。**OAuth 对接 Anthropic 要求拥有付费的 Claude Max 套餐并购买额外的使用额度** — Hermes 以 Claude Code 的身份路由，它只从 Max 套件的额外/超额信用中扣除，而不是基础 Max 配额，并且不适用于 Claude Pro。如果没有 Max + 额外额度，请改用 API 密钥。`ANTHROPIC_TOKEN` 等环境变量仍然可用作手动覆盖，但它们已不再是 Claude Max 登录的首选路径。

| Variable | Description |
|----------|-------------|
| `HERMES_PORTAL_BASE_URL` | Nous Portal URL 的覆盖（用于开发/测试） |
| `NOUS_INFERENCE_BASE_URL` | Nous 推理 API URL 的覆盖 |
| `HERMES_NOUS_MIN_KEY_TTL_SECONDS` | 重新铸造前的最小智能体密钥 TTL（默认值：1800 = 30分钟） |
| `HERMES_NOUS_TIMEOUT_SECONDS` | Nous 凭证/令牌流程的 HTTP 超时时间 |
| `HERMES_DUMP_REQUESTS` | 将 API 请求负载转储到日志文件 (`true`/`false`) |
| `HERMES_PREFILL_MESSAGES_FILE` | 注入到 API 调用时的临时预填充消息 JSON 文件的路径 |
| `HERMES_TIMEZONE` | IANA 时区覆盖（例如 `America/New_York`） |

## Tool APIs

| Variable | Description |
|----------|-------------|
| `PARALLEL_API_KEY` | AI 原生网络搜索 ([parallel.ai](https://parallel.ai/)) |
| `FIRECRAWL_API_KEY` | 网络抓取和云浏览器 ([firecrawl.dev](https://firecrawl.dev/)) |
| `FIRECRAWL_API_URL` | 用于自托管实例的自定义 Firecrawl API 端点（可选） |
| `TAVILY_API_KEY` | Tavily AI 原生网络搜索、提取和抓取 API 密钥 ([app.tavily.com](https://app.tavily.com/home)) |
| `SEARXNG_URL` | 用于免费自托管网络搜索的 SearXNG 实例 URL — 无需 API 密钥 ([searxng.github.io](https://searxng.github.io/searxng/)) |
| `TAVILY_BASE_URL` | 覆盖 Tavily API 端点。对于企业代理和自托管兼容的搜索后端很有用。与 `GROQ_BASE_URL` 模式相同。 |
| `EXA_API_KEY` | Exa AI 原生网络搜索和内容 API 密钥 ([exa.ai](https://exa.ai/)) |
| `BROWSERBASE_API_KEY` | 浏览器自动化 ([browserbase.com](https://browserbase.com/)) |
| `BROWSERBASE_PROJECT_ID` | Browserbase 项目 ID |
| `BROWSER_USE_API_KEY` | Browser Use 云浏览器 API 密钥 ([browser-use.com](https://browser-use.com/)) |
| `FIRECRAWL_BROWSER_TTL` | Firecrawl 浏览器会话 TTL（秒）（默认：300） |
| `BROWSER_CDP_URL` | 用于本地浏览器的 Chrome DevTools Protocol URL（通过 `/browser connect` 设置，例如 `ws://localhost:9222`） |
| `CAMOFOX_URL` | Camofox 本地反检测浏览器 URL（默认：`http://localhost:9377`） |
| `CAMOFOX_USER_ID` | 用于共享可见会话的可选外部管理 Camofox 用户 ID |
| `CAMOFOX_SESSION_KEY` | 在为 `CAMOFOX_USER_ID` 创建标签页时使用的可选 Camofox 会话密钥 |
| `CAMOFOX_ADOPT_EXISTING_TAB` | 设置为 `true` 以在创建新标签页之前重用现有的 Camofox 标签页 |
| `BROWSER_INACTIVITY_TIMEOUT` | 浏览器会话不活动超时时间（秒） |
| `AGENT_BROWSER_ARGS` | 额外的 Chromium 启动标志（逗号或换行符分隔）。当作为 root 或在 AppArmor 受限的非特权用户命名空间上运行时，Hermes 会自动注入 `--no-sandbox,--disable-dev-shm-usage`；仅手动设置此项以覆盖或添加其他标志。 |
| `FAL_KEY` | 图像生成 ([fal.ai](https://fal.ai/)) |
| `GROQ_API_KEY` | Groq Whisper STT API 密钥 ([groq.com](https://groq.com/)) |
| `ELEVENLABS_API_KEY` | ElevenLabs 高级 TTS 声音 ([elevenlabs.io](https://elevenlabs.io/)) |
| `STT_GROQ_MODEL` | 覆盖 Groq STT 模型（默认：`whisper-large-v3-turbo`） |
| `GROQ_BASE_URL` | 覆盖 Groq OpenAI 兼容的 STT 端点 |
| `STT_OPENAI_MODEL` | 覆盖 OpenAI STT 模型（默认：`whisper-1`） |
| `STT_OPENAI_BASE_URL` | 覆盖 OpenAI 兼容的 STT 端点 |
| `GITHUB_TOKEN` | Skills Hub 的 GitHub 令牌（更高的 API 速率限制，技能发布） |
| `HONCHO_API_KEY` | 跨会话用户建模 ([honcho.dev](https://honcho.dev/)) |
| `HONCHO_BASE_URL` | 自托管 Honcho 实例的基础 URL（默认：Honcho cloud）。本地实例无需 API 密钥 |
| `HINDSIGHT_TIMEOUT` | Hindsight 内存提供者 API 调用的超时时间（秒）（默认：`60`）。如果您的 Hindsight 实例在 `/sync` 或 `on_session_switch` 期间响应缓慢，并且您在 `errors.log` 中看到超时，请增加此值。 |
| `SUPERMEMORY_API_KEY` | 具有档案召回和会话摄取的语义长期记忆 ([supermemory.ai](https://supermemory.ai)) |
| `DAYTONA_API_KEY` | Daytona 云沙箱 ([daytona.io](https://daytona.io/)) |

### Langfuse 可观测性

用于捆绑的 [`observability/langfuse`](/user-guide/features/built-in-plugins#observabilitylangfuse) 插件的环境变量。请在 `~/.hermes/.env` 中设置这些变量。在任何这些变量生效之前，必须启用该插件（`hermes plugins enable observability/langfuse` 或勾选 `hermes plugins` 中的复选框）。

| Variable | Description |
|----------|-------------|
| `HERMES_LANGFUSE_PUBLIC_KEY` | Langfuse 项目公钥 (`pk-lf-...`)。必需。 |
| `HERMES_LANGFUSE_SECRET_KEY` | Langfuse 项目密钥 (`sk-lf-...`)。必需。 |
| `HERMES_LANGFUSE_BASE_URL` | Langfuse 服务器 URL（默认：`https://cloud.langfuse.com`）。用于自托管。 |
| `HERMES_LANGFUSE_ENV` | 追踪中的环境标签（`production`、`staging` 等） |
| `HERMES_LANGFUSE_RELEASE` | 追踪中的版本/发布标签 |
| `HERMES_LANGFUSE_SAMPLE_RATE` | SDK 采样率 0.0–1.0（默认：`1.0`） |
| `HERMES_LANGFUSE_MAX_CHARS` | 序列化负载的字段级截断（默认：`12000`） |
| `HERMES_LANGFUSE_DEBUG` | 设置为 `true` 可在 `agent.log` 中启用详细的插件日志记录 |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` / `LANGFUSE_BASE_URL` | 标准 Langfuse SDK 名称。当 `HERMES_LANGFUSE_*` 对应的变量未设置时，作为备用选项使用。 |

### Nous 工具网关 (Tool Gateway)

这些变量用于配置付费的 Nous 订阅者或自托管网关部署的 [工具网关]( /user-guide/features/tool-gateway)。大多数用户无需设置这些变量——网关会通过 `hermes model` 或 `hermes tools` 自动配置。

| Variable | Description |
|----------|-------------|
| `TOOL_GATEWAY_DOMAIN` | 工具网关路由的基础域名（默认：`nousresearch.com`） |
| `TOOL_GATEWAY_SCHEME` | 网关 URL 的 HTTP 或 HTTPS 方案（默认：`https`） |
| `TOOL_GATEWAY_USER_TOKEN` | 工具网关的认证令牌（通常由 Nous 身份验证自动填充） |
| `FIRECRAWL_GATEWAY_URL` | 特定于 Firecrawl 网关端点的覆盖 URL |

## 终端后端

| Variable | Description |
|----------|-------------|
| `TERMINAL_ENV` | 后端环境：`local`（本地）, `docker`, `ssh`, `singularity`, `modal`, `daytona` |
| `HERMES_DOCKER_BINARY` | 覆盖 Hermes 调用的容器二进制文件 (例如 `podman` 或 `/usr/local/bin/docker`)。未设置时，Hermes 会自动在 `PATH` 中发现 `docker` 或 `podman`。当两者都安装了但您需要非默认选项，或当该二进制文件位于 `PATH` 之外时，此项是必需的。 |
| `TERMINAL_DOCKER_IMAGE` | Docker 镜像 (默认: `nikolaik/python-nodejs:python3.11-nodejs20`) |
| `TERMINAL_DOCKER_FORWARD_ENV` | 要显式转发到 Docker 终端会话的环境变量 JSON 数组。注意：通过技能声明的 `required_environment_variables` 会自动转发——您只需要为未由任何技能声明的变量设置此项。 |
| `TERMINAL_DOCKER_VOLUMES` | 额外的 Docker 卷挂载 (逗号分隔的 `主机:容器` 对) |
| `TERMINAL_DOCKER_MOUNT_CWD_TO_WORKSPACE` | 高级选项：将启动时的当前工作目录挂载到 Docker 的 `/workspace` (`true`/`false`, 默认: `false`) |
| `TERMINAL_SINGULARITY_IMAGE` | Singularity 镜像或 `.sif` 文件路径 |
| `TERMINAL_MODAL_IMAGE` | Modal 容器镜像 |
| `TERMINAL_DAYTONA_IMAGE` | Daytona 沙箱镜像 |
| `TERMINAL_TIMEOUT` | 命令超时时间（秒） |
| `TERMINAL_LIFETIME_SECONDS` | 终端会话的最大生命周期（秒） |
| `TERMINAL_CWD` | 网关/定时任务终端会话的已弃用直接覆盖项。优先使用 `config.yaml` 中的 `terminal.cwd`；CLI 仍使用启动目录。 |
| `SUDO_PASSWORD` | 启用无需交互提示符即可运行 sudo |

对于云沙箱后端，持久性是基于文件系统的。`TERMINAL_LIFETIME_SECONDS` 控制着 Hermes 何时清理空闲的终端会话，后续的恢复操作可能会重新创建沙箱，而不是保持相同的进程运行。

## SSH 后端

| Variable | Description |
|----------|-------------|
| `TERMINAL_SSH_HOST` | 远程服务器主机名 |
| `TERMINAL_SSH_USER` | SSH 用户名 |
| `TERMINAL_SSH_PORT` | SSH 端口 (默认: 22) |
| `TERMINAL_SSH_KEY` | 私钥路径 |
| `TERMINAL_SSH_PERSISTENT` | 对 SSH 进行持久化 Shell 的覆盖设置 (默认: 遵循 `TERMINAL_PERSISTENT_SHELL`) |

## 容器资源（Docker, Singularity, Modal, Daytona）

| Variable | Description |
|----------|-------------|
| `TERMINAL_CONTAINER_CPU` | CPU 核心数 (默认: 1) |
| `TERMINAL_CONTAINER_MEMORY` | 内存大小 (MB) (默认: 5120) |
| `TERMINAL_CONTAINER_DISK` | 磁盘大小 (MB) (默认: 51200) |
| `TERMINAL_CONTAINER_PERSISTENT` | 在会话之间持久化容器文件系统 (`true`) |
| `TERMINAL_SANDBOX_DIR` | 工作区和覆盖层的宿主目录 (默认: `~/.hermes/sandboxes/`) |

## 持久化 Shell

| Variable | Description |
|----------|-------------|
| `TERMINAL_PERSISTENT_SHELL` | 启用非本地后端的持久化 Shell (默认: `true`)。也可通过 `config.yaml` 中的 `terminal.persistent_shell` 设置。 |
| `TERMINAL_LOCAL_PERSISTENT` | 启用本地后端的持久化 Shell (默认: `false`) |
| `TERMINAL_SSH_PERSISTENT` | 对 SSH 后端进行持久化 Shell 的覆盖设置 (默认: 遵循 `TERMINAL_PERSISTENT_SHELL`) |

## 消息传递

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (@BotFather 获取) |
| `TELEGRAM_ALLOWED_USERS` | 允许使用该 bot 的用户 ID 列表 (适用于私聊、群组和论坛) |
| `TELEGRAM_GROUP_ALLOWED_USERS` | 仅授权在群组/论坛中使用的发送者用户 ID 列表 (不授予私聊权限)。仍接受以 `-` 开头的聊天 ID 格式值，以兼容 #17686 之前的配置，并附带弃用警告。 |
| `TELEGRAM_GROUP_ALLOWED_CHATS` | 逗号分隔的群组/论坛聊天 ID；任何成员均被授权。 |
| `TELEGRAM_HOME_CHANNEL` | 定时任务交付的默认 Telegram 聊天/频道 |
| `TELEGRAM_HOME_CHANNEL_NAME` | Telegram 主频道的显示名称 |
| `TELEGRAM_CRON_THREAD_ID` | 用于接收定时任务交付的论坛主题 ID；仅对定时任务覆盖 `TELEGRAM_HOME_CHANNEL_THREAD_ID`。在主题模式下使用，以便回复定时消息时打开新会话而不是命中系统大厅 (#24409)。 |
| `TELEGRAM_WEBHOOK_URL` | Webhook 模式下的公共 HTTPS URL (启用 webhook 而非轮询) |
| `TELEGRAM_WEBHOOK_PORT` | Webhook 服务器的本地监听端口 (默认: `8443`) |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram 在每次更新中回显用于验证的密钥。**当设置了 `TELEGRAM_WEBHOOK_URL` 时必需** — 否则网关将拒绝启动 (GHSA-3vpc-7q5r-276h)。使用 `openssl rand -hex 32` 生成。 |
| `TELEGRAM_REACTIONS` | 在处理过程中启用消息的表情符号反应 (默认: `false`) |
| `TELEGRAM_REQUIRE_MENTION` | 要求在 Telegram 群组中回复前进行明确提及。相当于 `config.yaml` 中的 `telegram.require_mention`。 |
| `TELEGRAM_MENTION_PATTERNS` | 当启用 Telegram 群组提及限制时接受的正则表达式唤醒词模式 JSON 数组、换行分隔列表或逗号分隔列表。相当于 `telegram.mention_patterns`。 |
| `TELEGRAM_EXCLUSIVE_BOT_MENTIONS` | 启用后，Telegram 群组中的明确 `@...bot` 提及将仅路由到被提及的 bot 用户名，在回复或唤醒词回退之前运行。默认: `true`。相当于 `telegram.exclusive_bot_mentions`。 |
| `TELEGRAM_REPLY_TO_MODE` | 回复引用行为：`off`（关闭）, `first`（首次/默认）, 或 `all`（全部）。匹配 Discord 的模式。 |
| `TELEGRAM_IGNORED_THREADS` | bot 绝不回复的逗号分隔的 Telegram 论坛主题/线程 ID |
| `TELEGRAM_PROXY` | 用于 Telegram 连接的代理 URL — 覆盖 `HTTPS_PROXY`。支持 `http://`, `https://`, `socks5://` |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `DISCORD_ALLOWED_USERS` | 允许使用该 bot 的逗号分隔的 Discord 用户 ID |
| `DISCORD_ALLOWED_ROLES` | 允许使用该 bot 的逗号分隔的 Discord 角色 ID (与 `DISCORD_ALLOWED_USERS` 并列)。自动启用 Members 意图。当审核团队变动时特别有用——角色授权会自动传播。 |
| `DISCORD_ALLOWED_CHANNELS` | 逗号分隔的 Discord 频道 ID。设置后，bot 只在这些频道中回复 (如果允许则包括私聊)。覆盖 `config.yaml` 中的 `discord.allowed_channels`。 |
| `DISCORD_PROXY` | 用于 Discord 连接的代理 URL — 覆盖 `HTTPS_PROXY`。支持 `http://`, `https://`, `socks5://` |
| `DISCORD_HOME_CHANNEL` | 定时任务交付的默认 Discord 频道 |
| `DISCORD_HOME_CHANNEL_NAME` | Discord 主频道的显示名称 |
| `DISCORD_COMMAND_SYNC_POLICY` | Discord 斜杠命令启动同步策略：`safe` (差异和协调), `bulk` (旧版 `tree.sync()`), 或 `off`。 |
| `DISCORD_REQUIRE_MENTION` | 要求在服务器频道中回复前进行 @提及 |
| `DISCORD_FREE_RESPONSE_CHANNELS` | 允许免@提及回复的频道 ID 列表 |
| `DISCORD_AUTO_THREAD` | 在支持的情况下自动生成线程 |
| `DISCORD_ALLOW_ANY_ATTACHMENT` | 设置为 `true` 时，接受任何文件类型的附件 (不限于内置的 PDF/文本/zip/office 白名单)。未知类型会被缓存并提供给智能体作为本地路径，以便它可以通过 `terminal` / `read_file` / `ffprobe` 进行检查。默认 `false`。 |
| `DISCORD_MAX_ATTACHMENT_BYTES` | 网关将缓存的每个附件的最大字节数。默认 `33554432` (32 MiB)。设置为 `0` 则没有上限 (附件在写入过程中保存在内存中)。 |
| `DISCORD_REACTIONS` | 在处理消息时启用表情符号反应 (默认: `true`) |
| `DISCORD_IGNORED_CHANNELS` | bot 绝不回复的逗号分隔的频道 ID |
| `DISCORD_NO_THREAD_CHANNELS` | bot 不自动生成线程的频道 ID 列表 |
| `DISCORD_REPLY_TO_MODE` | 回复引用行为：`off`（关闭）, `first`（首次/默认）, 或 `all`（全部） |
| `DISCORD_ALLOW_MENTION_EVERYONE` | 允许 bot ping `@everyone`/`@here` (默认: `false`)。参见 [提及控制](../user-guide/messaging/discord.md#mention-control)。 |
| `DISCORD_ALLOW_MENTION_ROLES` | 允许 bot ping `@role` 提及 (默认: `false`)。 |
| `DISCORD_ALLOW_MENTION_USERS` | 允许 bot ping 单个 `@user` 提及 (默认: `true`)。 |
| `DISCORD_ALLOW_MENTION_REPLIED_USER` | 回复某人消息时，是否 ping 该作者 (默认: `true`)。 |
| `SLACK_BOT_TOKEN` | Slack bot token (`xoxb-...`) |
| `SLACK_APP_TOKEN` | Slack 应用级别的 token (`xapp-...`, Socket 模式必需) |
| `SLACK_ALLOWED_USERS` | 逗号分隔的 Slack 用户 ID |
| `SLACK_HOME_CHANNEL` | 定时任务交付的默认 Slack 频道 |
| `SLACK_HOME_CHANNEL_NAME` | Slack 主频道的显示名称 |
| `GOOGLE_CHAT_PROJECT_ID` | 托管 Pub/Sub 主题的 GCP 项目 (回退到 `GOOGLE_CLOUD_PROJECT`) |
| `GOOGLE_CHAT_SUBSCRIPTION_NAME` | 完整的 Pub/Sub 订阅路径，格式为 `projects/{proj}/subscriptions/{sub}` (旧别名: `GOOGLE_CHAT_SUBSCRIPTION`) |
| `GOOGLE_CHAT_SERVICE_ACCOUNT_JSON` | 服务账号 JSON 的路径，或内联 JSON (回退到 `GOOGLE_APPLICATION_CREDENTIALS`) |
| `GOOGLE_CHAT_ALLOWED_USERS` | 允许与 bot 进行聊天的逗号分隔的用户电子邮件地址 |
| `GOOGLE_CHAT_ALLOW_ALL_USERS` | 允许任何 Google Chat 用户触发 bot (仅限开发) |
| `GOOGLE_CHAT_HOME_CHANNEL` | 用于定时任务交付的默认空间 (例如 `spaces/AAAA...`) |
| `GOOGLE_CHAT_HOME_CHANNEL_NAME` | Google Chat 主空间的显示名称 |
| `GOOGLE_CHAT_MAX_MESSAGES` | Pub/Sub FlowControl 的最大飞行消息数 (默认: `1`) |
| `GOOGLE_CHAT_MAX_BYTES` | Pub/Sub FlowControl 的最大飞行字节数 (默认: `16777216`, 16 MiB) |
| `GOOGLE_CHAT_BOOTSTRAP_SPACES` | 在启动时用于解析 bot 自己的 `users/{id}` 的额外空间 ID 列表（逗号分隔） |
| `GOOGLE_CHAT_DEBUG_RAW` | 设置为任何值，即可在 DEBUG 级别记录被脱敏的 Pub/Sub 信封 (仅限调试) |
| `WHATSAPP_ENABLED` | 启用 WhatsApp 网桥 (`true`/`false`) |
| `WHATSAPP_MODE` | `bot`（独立号码）或 `self-chat`（给自己发送消息） |
| `WHATSAPP_ALLOWED_USERS` | 允许的逗号分隔电话号码 (带国家代码，不带 `+`)，或 `*` 表示允许所有发送者。 |
| `WHATSAPP_ALLOW_ALL_USERS` | 允许所有 WhatsApp 发送者而无需白名单 (`true`/`false`) |
| `WHATSAPP_DEBUG` | 用于故障排除的网桥中原始消息事件日志记录 (`true`/`false`) |
| `WHATSAPP_CLOUD_PHONE_NUMBER_ID` | 来自 WhatsApp Business Cloud API 的 Meta 电话号码 ID (15–17 位数字；**不是**电话号码本身) |
| `WHATSAPP_CLOUD_ACCESS_TOKEN` | Meta 访问令牌 (以 `EAA` 开头)；临时令牌有效期为 24 小时，系统用户令牌是永久的。 |
| `WHATSAPP_CLOUD_APP_SECRET` | 用于验证入站 webhook 签名的 32 位字符十六进制应用密钥 |
| `WHATSAPP_CLOUD_VERIFY_TOKEN` | Meta Webhook 验证握手的共享密钥 (由设置向导自动生成) |
| `WHATSAPP_CLOUD_ALLOWED_USERS` | 允许发送消息给 bot 的逗号分隔 `wa_id` (带国家代码的电话号码，不带 `+`) |
| `WHATSAPP_CLOUD_ALLOW_ALL_USERS` | 允许所有 WhatsApp Cloud 发送者而无需白名单 (`true`/`false`) |
| `WHATSAPP_CLOUD_APP_ID` | 可选的 Meta App ID (用于未来的分析集成) |
| `WHATSAPP_CLOUD_WABA_ID` | 可选的 WhatsApp Business Account ID (用于未来的分析集成) |
| `WHATSAPP_CLOUD_WEBHOOK_HOST` | 入站 webhook 服务器绑定的接口 (默认 `0.0.0.0`) |
| `WHATSAPP_CLOUD_WEBHOOK_PORT` | 入站 webhook 服务器绑定的端口 (默认 `8090`) |
| `WHATSAPP_CLOUD_WEBHOOK_PATH` | Meta 发送入站消息的 URL 路径 (默认 `/whatsapp/webhook`) |
| `WHATSAPP_CLOUD_API_VERSION` | 调用 Meta Graph API 的版本 (默认 `v20.0`) |
| `WHATSAPP_CLOUD_HOME_CHANNEL` | 用于 bot 主频道的 `wa_id` (用于定时任务等) |
| `WHATSAPP_CLOUD_DM_POLICY` | Cloud 适配器的私聊限制 (`open`/`allowlist`/`disabled`)；未设置时回退到 `WHATSAPP_DM_POLICY`。 |
| `WHATSAPP_CLOUD_ALLOW_FROM` | 当 `dm_policy: allowlist` 时允许的逗号分隔发送者 (裸 `wa_id`；JID 格式化为 Baileys 风格) |
| `WHATSAPP_CLOUD_GROUP_POLICY` | Cloud 适配器的群组限制 (`open`/`allowlist`/`disabled`)；未设置时回退到 `WHATSAPP_GROUP_POLICY`。 |
| `WHATSAPP_CLOUD_GROUP_ALLOW_FROM` | 当 `group_policy: allowlist` 时允许的逗号分隔群聊 ID |
| `SIGNAL_HTTP_URL` | signal-cli 守护进程 HTTP 端点 (例如 `http://127.0.0.1:8080`) |
| `SIGNAL_ACCOUNT` | E.164 格式的 bot 电话号码 |
| `SIGNAL_ALLOWED_USERS` | 逗号分隔的 E.164 电话号码或 UUID |
| `SIGNAL_GROUP_ALLOWED_USERS` | 逗号分隔的群组 ID，或 `*` 表示所有群组。 |
| `SIGNAL_HOME_CHANNEL_NAME` | Signal 主频道的显示名称 |
| `SIGNAL_IGNORE_STORIES` | 忽略 Signal 故事/状态更新 |
| `SIGNAL_ALLOW_ALL_USERS` | 允许所有 Signal 用户而无需白名单 |
| `TWILIO_ACCOUNT_SID` | Twilio 账号 SID (与电话技能共享) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token (与电话技能共享；也用于 webhook 签名验证) |
| `TWILIO_PHONE_NUMBER` | E.164 格式的 Twilio 电话号码 (与电话技能共享) |
| `SMS_WEBHOOK_URL` | 用于 Twilio 签名验证的公共 URL — 必须与 Twilio 控制台中的 webhook URL 匹配 (必需)。 |
| `SMS_WEBHOOK_PORT` | 入站 SMS 的 Webhook 监听端口 (默认: `8080`) |
| `SMS_WEBHOOK_HOST` | Webhook 绑定地址 (默认: `0.0.0.0`) |
| `SMS_INSECURE_NO_SIGNATURE` | 设置为 `true` 以禁用 Twilio 签名验证 (仅限本地开发 — 不适用于生产)。 |
| `SMS_ALLOWED_USERS` | 允许聊天用户的逗号分隔 E.164 电话号码 |
| `SMS_ALLOW_ALL_USERS` | 允许所有 SMS 发送者而无需白名单 |
| `SMS_HOME_CHANNEL` | 定时任务/通知交付的电话号码 |
| `SMS_HOME_CHANNEL_NAME` | SMS 主频道的显示名称 |
| `EMAIL_ADDRESS` | Email 网关适配器的电子邮件地址 |
| `EMAIL_PASSWORD` | 电子邮件账户的密码或应用密码 |
| `EMAIL_IMAP_HOST` | 邮件适配器的 IMAP 主机名 |
| `EMAIL_IMAP_PORT` | IMAP 端口 |
| `EMAIL_SMTP_HOST` | 邮件适配器的 SMTP 主机名 |
| `EMAIL_SMTP_PORT` | SMTP 端口 |
| `EMAIL_ALLOWED_USERS` | 允许发送消息给 bot 的逗号分隔电子邮件地址 |
| `EMAIL_HOME_ADDRESS` | 主动邮件交付的默认收件人 |
| `EMAIL_HOME_ADDRESS_NAME` | 邮件主目标的显示名称 |
| `EMAIL_POLL_INTERVAL` | 邮件轮询间隔 (秒) |
| `EMAIL_ALLOW_ALL_USERS` | 允许所有入站电子邮件发送者 |
| `DINGTALK_CLIENT_ID` | 来自开发者门户的 DingTalk bot AppKey ([open.dingtalk.com](https://open.dingtalk.com)) |
| `DINGTALK_CLIENT_SECRET` | 来自开发者门户的 DingTalk bot AppSecret |
| `DINGTALK_ALLOWED_USERS` | 允许发送消息给 bot 的逗号分隔 DingTalk 用户 ID |
| `FEISHU_APP_ID` | Feishu/Lark bot App ID (来自 [open.feishu.cn](https://open.feishu.cn/)) |
| `FEISHU_APP_SECRET` | Feishu/Lark bot App Secret |
| `FEISHU_DOMAIN` | `feishu` (中国) 或 `lark` (国际)。默认: `feishu` |
| `FEISHU_CONNECTION_MODE` | `websocket`（推荐）或 `webhook`。默认: `websocket` |
| `FEISHU_ENCRYPT_KEY` | Webhook 模式下的可选加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | Webhook 模式下的可选验证令牌 |
| `FEISHU_ALLOWED_USERS` | 允许发送消息给 bot 的逗号分隔 Feishu 用户 ID |
| `FEISHU_ALLOW_BOTS` | `none` (默认) / `mentions` / `all` — 接受来自其他 bot 的入站消息。参见 [bot-to-bot messaging](../user-guide/messaging/feishu.md#bot-to-bot-messaging)。 |
| `FEISHU_REQUIRE_MENTION` | `true` (默认) / `false` — 群组消息是否必须 @提及 bot。可通过 `group_rules.<chat_id>.require_mention` 进行每聊天的覆盖设置。 |
| `FEISHU_HOME_CHANNEL` | 用于定时任务和通知的 Feishu 聊天 ID |
| `WECOM_BOT_ID` | 来自管理员控制台的 WeCom AI Bot ID |
| `WECOM_SECRET` | WeCom AI Bot secret |
| `WECOM_WEBSOCKET_URL` | 自定义 WebSocket URL (默认: `wss://openws.work.weixin.qq.com`) |
| `WECOM_ALLOWED_USERS` | 允许发送消息给 bot 的逗号分隔 WeCom 用户 ID |
| `WECOM_HOME_CHANNEL` | 用于定时任务和通知的 WeCom 聊天 ID |
| `WECOM_CALLBACK_CORP_ID` | 自建应用的 WeCom 企业 Corp ID |
| `WECOM_CALLBACK_CORP_SECRET` | 自建应用的 Corp secret |
| `WECOM_CALLBACK_AGENT_ID` | 自建应用的 Agent ID |
| `WECOM_CALLBACK_TOKEN` | 回调验证令牌 |
| `WECOM_CALLBACK_ENCODING_AES_KEY` | 用于回调加密的 AES 密钥 |
| `WECOM_CALLBACK_HOST` | 回调服务器绑定地址 (默认: `0.0.0.0`) |
| `WECOM_CALLBACK_PORT` | 回调服务器端口 (默认: `8645`) |
| `WECOM_CALLBACK_ALLOWED_USERS` | 白名单的用户 ID 列表（逗号分隔） |
| `WECOM_CALLBACK_ALLOW_ALL_USERS` | 设置为 `true` 以允许所有用户而无需白名单。 |
| `WEIXIN_ACCOUNT_ID` | 通过 iLink Bot API 的二维码登录获得的 Weixin 账号 ID |
| `WEIXIN_TOKEN` | 通过 iLink Bot API 的二维码登录获得的 Weixin 认证令牌 |
| `WEIXIN_BASE_URL` | 覆盖 Weixin iLink Bot API 基础 URL (默认: `https://ilinkai.weixin.qq.com`) |
| `WEIXIN_CDN_BASE_URL` | 覆盖用于媒体的 Weixin CDN 基础 URL (默认: `https://novac2c.cdn.weixin.qq.com/c2c`) |
| `WEIXIN_DM_POLICY` | 私聊策略：`open`, `allowlist`, `pairing`, `disabled` (默认: `open`) |
| `WEIXIN_GROUP_POLICY` | 群消息策略：`open`, `allowlist`, `disabled` (默认: `disabled`) |
| `WEIXIN_ALLOWED_USERS` | 允许发送私聊消息给 bot 的逗号分隔 Weixin 用户 ID |
| `WEIXIN_GROUP_ALLOWED_USERS` | 允许与 bot 交互的逗号分隔 Weixin **群聊天 ID** (而非成员用户 ID)。该变量名是旧的——它期望的是群组 ID。仅在 iLink 实际交付群组事件时生效；通过二维码登录的 iLink bot 身份 (`...@im.bot`) 通常不会收到普通的微信群消息。 |
| `WEIXIN_HOME_CHANNEL` | 用于定时任务和通知的 Weixin 聊天 ID |
| `WEIXIN_HOME_CHANNEL_NAME` | Weixin 主频道的显示名称 |
| `WEIXIN_ALLOW_ALL_USERS` | 允许所有 Weixin 用户而无需白名单 (`true`/`false`) |
| `BLUEBUBBLES_SERVER_URL` | BlueBubbles 服务器 URL (例如 `http://192.168.1.10:1234`) |
| `BLUEBUBBLES_PASSWORD` | BlueBubbles 服务器密码 |
| `BLUEBUBBLES_WEBHOOK_HOST` | Webhook 监听绑定地址 (默认: `127.0.0.1`) |
| `BLUEBUBBLES_WEBHOOK_PORT` | Webhook 监听端口 (默认: `8645`) |
| `BLUEBUBBLES_HOME_CHANNEL` | 用于定时任务/通知交付的电话/电子邮件 |
| `BLUEBUBBLES_ALLOWED_USERS` | 授权用户的逗号分隔列表 |
| `BLUEBUBBLES_ALLOW_ALL_USERS` | 允许所有用户 (`true`/`false`) |
| `QQ_APP_ID` | 来自 [q.qq.com](https://q.qq.com) 的 QQ Bot App ID |
| `QQ_CLIENT_SECRET` | 来自 [q.qq.com](https://q.qq.com) 的 QQ Bot App Secret |
| `QQ_STT_API_KEY` | 外部 STT 回退提供商的 API 密钥 (可选，当 QQ 内置 ASR 返回无文本时使用) |
| `QQ_STT_BASE_URL` | 外部 STT 提供商的基础 URL (可选) |
| `QQ_STT_MODEL` | 外部 STT 提供商的模型名称 (可选) |
| `QQ_ALLOWED_USERS` | 允许发送消息给 bot 的逗号分隔 QQ 用户 openID |
| `QQ_GROUP_ALLOWED_USERS` | 用于群 @消息访问的逗号分隔 QQ 群组 ID |
| `QQ_ALLOW_ALL_USERS` | 允许所有用户 (`true`/`false`, 覆盖 `QQ_ALLOWED_USERS`) |
| `QQBOT_HOME_CHANNEL` | 用于定时任务和通知的 QQ 用户/群 openID |
| `QQBOT_HOME_CHANNEL_NAME` | QQ 主频道的显示名称 |
| `QQ_PORTAL_HOST` | 覆盖 QQ portal host (设置为 `sandbox.q.qq.com` 可通过沙箱网关路由；默认: `q.qq.com`)。 |
| `MATTERMOST_URL` | Mattermost 服务器 URL (例如 `https://mm.example.com`) |
| `MATTERMOST_TOKEN` | 用于 Mattermost 的 Bot token 或个人访问令牌 |
| `MATTERMOST_ALLOWED_USERS` | 允许发送消息给 bot 的逗号分隔 Mattermost 用户 ID |
| `MATTERMOST_HOME_CHANNEL` | 主动消息交付（定时任务、通知）的频道 ID |
| `MATTERMOST_REQUIRE_MENTION` | 要求在频道中 @提及 (默认: `true`)。设置为 `false` 可回复所有消息。 |
| `MATTERMOST_FREE_RESPONSE_CHANNELS` | 允许免@提及回复的频道 ID 列表 |
| `MATTERMOST_REPLY_MODE` | 回复样式：`thread` (线程回复) 或 `off` (扁平消息，默认) |
| `MATRIX_HOMESERVER` | Matrix homeserver URL (例如 `https://matrix.org`) |
| `MATRIX_ACCESS_TOKEN` | 用于 bot 身份验证的 Matrix 访问令牌 |
| `MATRIX_USER_ID` | Matrix 用户 ID (例如 `@hermes:matrix.org`) — 对于密码登录必需，对于访问令牌是可选的。 |
| `MATRIX_PASSWORD` | Matrix 密码 (作为访问令牌的替代方案) |
| `MATRIX_ALLOWED_USERS` | 允许发送消息给 bot 的逗号分隔 Matrix 用户 ID (例如 `@alice:matrix.org`) |
| `MATRIX_ALLOWED_ROOMS` | 允许触发 bot 回复函的逗号分隔 Matrix 房间 ID |
| `MATRIX_HOME_ROOM` | 用于主动消息交付的房间 ID (例如 `!abc123:matrix.org`) |
| `MATRIX_ENCRYPTION` | 启用端到端加密 (`true`/`false`, 默认: `false`) |
| `MATRIX_E2EE_MODE` | Matrix E2EE 行为：`off`, `optional`, 或 `required`。设置后会覆盖 `MATRIX_ENCRYPTION`。 |
| `MATRIX_DEVICE_ID` | 用于跨重启的 E2EE 持久化的稳定 Matrix 设备 ID (例如 `HERMES_BOT`)。如果没有此项，E2EE 密钥会在每次启动时轮换，历史房间解密将失败。 |
| `MATRIX_REACTIONS` | 在入站消息上启用处理生命周期表情符号反应 (默认: `true`)。设置为 `false` 可禁用。 |
| `MATRIX_REQUIRE_MENTION` | 要求在房间中 @提及 (默认: `true`)。设置为 `false` 可回复所有消息。 |
| `MATRIX_FREE_RESPONSE_ROOMS` | 允许免@提及回复的逗号分隔房间 ID |
| `MATRIX_IGNORE_USER_PATTERNS` | 用于忽略 Matrix 网桥/应用服务幽灵用户 ID 的逗号分隔正则表达式 |
| `MATRIX_PROCESS_NOTICES` | 处理入站 Matrix `m.notice` 事件 (默认: `false`) |
| `MATRIX_SESSION_SCOPE` | 项目房间的 Matrix 会话范围：`auto`, `room`, 或 `thread` (默认: `auto`) |
| `MATRIX_TOOLS_ALLOW_CROSS_ROOM` | 允许 Matrix 工具针对当前房间以外的明确房间进行操作 (默认: `false`) |
| `MATRIX_TOOLS_ALLOW_CROSS_ROOM_DESTRUCTIVE` | 允许跨房间的 Matrix 审查/邀请式工具；需要设置 `MATRIX_TOOLS_ALLOW_CROSS_ROOM=true` (默认: `false`)。 |
| `MATRIX_TOOLS_ALLOW_REDACTION` | 允许执行 Matrix 消息审查工具 (默认: `false`) |
| `MATRIX_TOOLS_ALLOW_INVITES` | 允许执行 Matrix 邀请工具 (默认: `false`) |
| `MATRIX_TOOLS_ALLOW_ROOM_CREATE` | 允许执行 Matrix 房间创建工具 (默认: `false`) |
| `MATRIX_ALLOW_ROOM_MENTIONS` | 允许向所有房间成员发送出站 `@room` 提及以进行通知 (默认: `false`) |
| `MATRIX_AUTO_THREAD` | 为房间消息自动创建线程 (默认: `true`) |
| `MATRIX_DM_MENTION_THREADS` | 当 bot 在私聊中被 @提及时，是否创建一个线程 (默认: `false`) |
| `MATRIX_APPROVAL_REQUIRE_SENDER` | 当已知时，是否要求批准/模型选择反应来自原始请求者 (默认: `true`) |
| `MATRIX_APPROVAL_TIMEOUT_SECONDS` | Matrix 反应批准/模型选择提示的超时时间 (默认: `300`) |
| `MATRIX_ALLOW_PUBLIC_ROOMS` | 允许 Matrix 房间创建工具创建公共房间 (默认: `false`) |
| `MATRIX_MAX_MEDIA_BYTES` | Matrix 最大媒体上传/下载字节数 (默认: `104857600`) |
| `MATRIX_RECOVERY_KEY` | 用于设备密钥轮换后跨签名验证的恢复密钥。推荐用于启用了跨签名的 E2EE 设置。 |
| `MATRIX_RECOVERY_KEY_OUTPUT_FILE` | 生成的 Matrix 恢复密钥的可选一次性路径。使用模式 `0600` 创建，永不被覆盖。 |
| `HASS_TOKEN` | Home Assistant 长效访问令牌 (启用 HA 平台 + 工具) |
| `HASS_URL` | Home Assistant URL (默认: `http://homeassistant.local:8123`) |
| `WEBHOOK_ENABLED` | 启用 webhook 平台适配器 (`true`/`false`) |
| `WEBHOOK_PORT` | 接收 webhook 的 HTTP 服务器端口 (默认: `8644`) |
| `WEBHOOK_SECRET` | 用于 webhook 签名验证的全局 HMAC secret (当路由未指定自己的时作为回退选项使用) |
| `API_SERVER_ENABLED` | 启用 OpenAI 兼容 API 服务器 (`true`/`false`)。与其他平台并行运行。 |
| `API_SERVER_KEY` | API 服务器身份验证的 Bearer token。只要 API 服务器启用，此项均必需。 |
| `API_SERVER_CORS_ORIGINS` | 允许直接调用 API 服务器的逗号分隔浏览器源 (例如 `http://localhost:3000,http://127.0.0.1:3000`)。默认: disabled。 |
| `API_SERVER_PORT` | API 服务器端口 (默认: `8642`) |
| `API_SERVER_HOST` | API 服务器的主机/绑定地址 (默认: `127.0.0.1`)。在回环地址上仍然需要 `API_SERVER_KEY`；请使用狭窄的 `API_SERVER_CORS_ORIGINS` 白名单来允许浏览器访问。 |
| `API_SERVER_MODEL_NAME` | 在 `/v1/models` 上宣传的模型名称。默认为配置文件名 (或默认配置文件的 `hermes-agent`)。对于需要前端（如 Open WebUI）为每个连接提供不同模型名称的多用户设置非常有用。 |
| `GATEWAY_PROXY_URL` | 用于将消息转发到远程 Hermes API 服务器的 URL ([代理模式](/user-guide/messaging/matrix#proxy-mode-e2ee-on-macos))。设置后，网关只处理平台 I/O — 所有智能体工作都委托给远程服务器。也可通过 `config.yaml` 中的 `gateway.proxy_url` 配置。 |
| `GATEWAY_PROXY_KEY` | 用于与远程 API 服务器进行身份验证的 Bearer token。必须与远程主机上的 `API_SERVER_KEY` 匹配。 |
| `MESSAGING_CWD` | 网关工作目录的已弃用兼容性回退项。优先使用 `config.yaml` 中的 `terminal.cwd`。 |
| `GATEWAY_ALLOWED_USERS` | 允许在所有平台间通信的逗号分隔用户 ID |
| `GATEWAY_ALLOW_ALL_USERS` | 允许所有用户而无需白名单 (`true`/`false`, 默认: `false`) |

### Web Dashboard 和 Hermes Desktop

对于 [Web Dashboard](/user-guide/features/web-dashboard) 以及连接 [Hermes Desktop 到远程后端](/user-guide/features/web-dashboard#connecting-hermes-desktop-to-a-remote-backend) 的身份验证。根据仅凭证的约定，凭据应保存在 `~/.hermes/.env` 中；OAuth `client_id` 最好在 `config.yaml` 的 `dashboard.oauth` 下设置 (已设置时环境变量优先)。

内置了三种仪表板认证提供程序。对于远程 Hermes Desktop 连接或任何面向互联网的仪表板，推荐的提供程序是 **OAuth (Nous Portal)** — 设置 `HERMES_DASHBOARD_OAUTH_CLIENT_ID` (使用 `hermes dashboard register` 进行配置)。捆绑的 **用户名/密码** 提供程序 (`HERMES_DASHBOARD_BASIC_AUTH_*`) 是在受信任的 LAN 或 VPN 后的后端的最快选项，但不适合直接面向公共互联网暴露。要针对您自己的身份提供商进行身份验证，请使用 **自托管 OIDC** 提供程序 (`HERMES_DASHBOARD_OIDC_*`)。无论哪种方式，非回环绑定 (`hermes dashboard --host 0.0.0.0`) 都会激活认证网关。参见 [Web Dashboard → 身份验证](/user-guide/features/web-dashboard#authentication-gated-mode) 以了解完整情况。

| Variable | Description |
|----------|-------------|
| `HERMES_DASHBOARD_BASIC_AUTH_USERNAME` | 捆绑的用户名/密码仪表板认证提供程序 (`plugins/dashboard_auth/basic`) 的用户名。当与密码一起设置时激活该提供程序。覆盖 `dashboard.basic_auth.username`。 |
| `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD` | 基本提供程序的明文密码 (加载时在内存中哈希)。优先于配置中的 `password_hash`，因此可以通过环境变量进行轮换。覆盖 `dashboard.basic_auth.password`。 |
| `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD_HASH` | 基本提供程序的 scrypt 密码哈希 (推荐 — 不存在明文形式)。使用 `python -c "from plugins.dashboard_auth.basic import hash_password; print(hash_password('PW'))"` 计算。覆盖 `dashboard.basic_auth.password_hash`。 |
| `HERMES_DASHBOARD_BASIC_AUTH_SECRET` | HMAC 密钥 (32+ 字节，base64/hex/raw) 用于签署基本提供程序的无状态会话令牌。显式设置以确保会话在重启后存活 / 跨多个工作进程；留空则为每个进程随机生成 (每次重启都会登出)。覆盖 `dashboard.basic_auth.secret`。 |
| `HERMES_DASHBOARD_BASIC_AUTH_TTL_SECONDS` | 基本提供程序的访问令牌生命周期 (默认 12 小时)。覆盖 `dashboard.basic_auth.session_ttl_seconds`。 |
| `HERMES_DASHBOARD_OAUTH_CLIENT_ID` | 用于受限/公共仪表板的 OAuth client id (`agent:{instance_id}`)，激活 Nous (`plugins/dashboard_auth/nous`) 提供程序。覆盖 `dashboard.oauth.client_id`。使用 `hermes dashboard register` 进行配置。 |
| `HERMES_DASHBOARD_PUBLIC_URL` | 仪表板所到达的完整公共 URL，用于反向代理后的 OAuth 回调构建。覆盖 `dashboard.public_url`。 |
| `HERMES_DASHBOARD_OIDC_ISSUER` | 捆绑的自托管 OIDC 提供程序的 OIDC 发行者 URL (`plugins/dashboard_auth/self_hosted`)。激活它所必需。覆盖 `dashboard.oauth.self_hosted.issuer`。 |
| `HERMES_DASHBOARD_OIDC_CLIENT_ID` | 自托管 OIDC 提供程序的公共 OIDC client id (authorization-code + PKCE)。激活它所必需。覆盖 `dashboard.oauth.self_hosted.client_id`。 |
| `HERMES_DASHBOARD_OIDC_SCOPES` | 为自托管 OIDC 提供程序请求的 OIDC 范围 (默认 `openid profile email`)。覆盖 `dashboard.oauth.self_hosted.scopes`。 |
| `HERMES_DESKTOP_REMOTE_URL` | (桌面端) 远程后端的基础 URL，例如 `http://host:9119`。设置后会覆盖应用程序内的网关 URL；您仍需从网关设置面板中登录（OAuth 重定向或用户名/密码，取决于后端所宣传的）。 |
| `HERMES_DESKTOP_HERMES` | 桌面后端命令覆盖项。由打包工具/Nix 或故障排除用于指示 Electron 进程在后端探测后指向特定的 `hermes` 可执行文件。 |
| `HERMES_DESKTOP_HERMES_ROOT` | 由 `hermes desktop --hermes-root` 使用的桌面源检出覆盖项；在打包首次启动安装或 PATH 中已有的 `hermes` 之前检查。 |
| `HERMES_DESKTOP_IGNORE_EXISTING` | 设置为 `1`，使 Desktop 在后端解析过程中忽略 PATH 中已存在的 `hermes`。相当于 `hermes desktop --ignore-existing`。 |
| `HERMES_DESKTOP_CWD` | 桌面聊天会话的初始项目目录。由 `hermes desktop --cwd` 设置。 |

### Microsoft Graph (Teams 会议)

这是即将推出的 Teams 会议摘要管道所使用的 Microsoft Graph REST 客户端的仅应用凭据。请参阅 [注册 Microsoft Graph 应用](/guides/microsoft-graph-app-registration) 以了解 Azure portal 工作流程和所需的精确 API 权限。

| Variable | Description |
|----------|-------------|
| `MSGRAPH_TENANT_ID` | 用于 Graph 应用注册的 Azure AD 租户 ID (目录 GUID)。 |
| `MSGRAPH_CLIENT_ID` | Azure 应用注册的应用（客户端）ID。 |
| `MSGRAPH_CLIENT_SECRET` | 应用注册的客户端密钥值。存储在 `~/.hermes/.env` 中，权限设置为 `chmod 600`；应定期通过 Azure portal 进行轮换。 |
| `MSGRAPH_SCOPE` | 用于客户端凭据令牌请求的 OAuth2 范围 (默认: `https://graph.microsoft.com/.default`)。 |
| `MSGRAPH_AUTHORITY_URL` | Microsoft 身份平台权威 URL (默认: `https://login.microsoftonline.com`)。仅在国家/主权云中进行覆盖（例如，GCC High 的 `https://login.microsoftonline.us`）。 |

### Microsoft Graph Webhook Listener

Graph 事件（Teams 会议、日历、聊天等）的入站变更通知监听器。请参阅 [Microsoft Graph Webhook Listener](/user-guide/messaging/msgraph-webhook) 以了解设置和安全加固。

| Variable | Description |
|----------|-------------|
| `MSGRAPH_WEBHOOK_ENABLED` | 启用 `msgraph_webhook` 网关平台 (`true`/`1`/`yes`)。 |
| `MSGRAPH_WEBHOOK_PORT` | 监听器绑定的端口 (默认: `8646`)。 |
| `MSGRAPH_WEBHOOK_CLIENT_STATE` | Graph 在每次通知中回显的共享密钥；与 `hmac.compare_digest` 进行比较。使用 `openssl rand -hex 32` 生成。 |
| `MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES` | Graph 资源路径/模式的逗号分隔白名单 (例如 `communications/onlineMeetings,chats/*/messages`)。末尾的 `*` 是前缀匹配。为空则接受所有。 |
| `MSGRAPH_WEBHOOK_ALLOWED_SOURCE_CIDRS` | 允许 POST 到监听器的逗号分隔 CIDR 范围 (例如 `52.96.0.0/14,52.104.0.0/14`)。为空则允许所有 (默认)。在生产环境中，请限制为 Microsoft Graph 公布的出口范围。 |

### Teams 会议摘要交付

仅当 [`teams_pipeline` 插件](/user-guide/messaging/msgraph-webhook) 启用时使用。设置也可以在 `config.yaml` 的 `platforms.teams.extra` 下进行配置 — 当两者都设置时，环境变量具有更高的优先级。请参阅 [Microsoft Teams → 会议摘要交付](/user-guide/messaging/teams#meeting-summary-delivery-teams-meeting-pipeline)。

| Variable | Description |
|----------|-------------|
| `TEAMS_DELIVERY_MODE` | `graph` 或 `incoming_webhook`。 |
| `TEAMS_INCOMING_WEBHOOK_URL` | Teams 生成的 webhook URL；当 `TEAMS_DELIVERY_MODE=incoming_webhook` 时必需。 |
| `TEAMS_GRAPH_ACCESS_TOKEN` | 用于 Graph 交付的预先获取的委派访问令牌。很少需要 — 未设置时，编写者会回退到 `MSGRAPH_*` 应用凭据。 |
| `TEAMS_TEAM_ID` | 频道交付的目标团队 ID (`graph` 模式)。 |
| `TEAMS_CHANNEL_ID` | 目标频道 ID (与 `TEAMS_TEAM_ID` 配对)。 |
| `TEAMS_CHAT_ID` | 目标一对一或群聊 ID (作为 `graph` 模式下团队+频道的一种替代方案)。 |

### LINE 消息 API

由捆绑的 LINE 平台插件 (`plugins/platforms/line/`) 使用。请参阅 [消息网关 → LINE](/user-guide/messaging/line) 以获取完整的设置。

| Variable | Description |
|----------|-------------|
| `LINE_CHANNEL_ACCESS_TOKEN` | 来自 LINE Developers Console (Messaging API 标签页) 的长期频道访问令牌。必需。 |
| `LINE_CHANNEL_SECRET` | 频道密钥 (基本设置标签页)；用于 HMAC-SHA256 webhook 签名验证。必需。 |
| `LINE_HOST` | Webhook 绑定主机 (默认: `0.0.0.0`)。 |
| `LINE_PORT` | Webhook 绑定端口 (默认: `8646`)。 |
| `LINE_PUBLIC_URL` | 公共 HTTPS 基础 URL (例如 `https://my-tunnel.example.com`)。发送图片/音频/视频必需 — LINE 只接受可达 HTTPS 的 URL。 |
| `LINE_ALLOWED_USERS` | 允许私聊 bot 的逗号分隔用户 ID (`U`-前缀)。 |
| `LINE_ALLOWED_GROUPS` | bot 将回复的逗号分隔群组 ID (`C`-前缀)。 |
| `LINE_ALLOWED_ROOMS` | bot 将回复的逗号分隔房间 ID (`R`-前缀)。 |
| `LINE_ALLOW_ALL_USERS` | 仅限开发逃生舱口 — 接受任何来源。默认: `false`。 |
| `LINE_HOME_CHANNEL` | 使用 `deliver: line` 的定时任务的默认交付目标。 |
| `LINE_SLOW_RESPONSE_THRESHOLD` | Slow-LLM Template Buttons postback 触发前的秒数 (默认: `45`)。设置为 `0` 可禁用并始终使用 Push-fallback。 |
| `LINE_PENDING_TEXT` | 显示在 postback 按钮旁边的气泡文本。 |
| `LINE_BUTTON_LABEL` | Postback 按钮标签 (默认: `Get answer`)。 |
| `LINE_DELIVERED_TEXT` | 当再次点击已交付的 postback 时回复的内容 (默认: `Already replied ✅`)。 |
| `LINE_INTERRUPTED_TEXT` | 当点击一个 `/stop`-孤立的 postback 按钮时回复的内容 (默认: `Run was interrupted before completion.`)。 |

### ntfy (推送通知)

[ntfy](https://ntfy.sh/) 是一个轻量级的基于 HTTP 的推送通知服务。从 [ntfy 移动应用](https://ntfy.sh/docs/subscribe/phone/) 订阅主题，向该主题发布以与智能体对话。

| Variable | Description |
|----------|-------------|
| `NTFY_TOPIC` | 要订阅的主题 (入站消息)。必需。 |
| `NTFY_SERVER_URL` | 服务器 URL (默认: `https://ntfy.sh`)。建议指向自托管的 ntfy 以确保隐私性。 |
| `NTFY_TOKEN` | 可选的认证令牌。Bearer token (例如 `tk_xyz`) 或 Basic auth 的 `user:pass`。 |
| `NTFY_PUBLISH_TOPIC` | 用于传出回复的主题 (默认为 `NTFY_TOPIC`)。 |
| `NTFY_MARKDOWN` | 设置为 `true` 以使用 `X-Markdown: true` 标头发送回复。默认: `false`。 |
| `NTFY_ALLOWED_USERS` | 白名单 (被视为用户 ID；在 ntfy 中，这些是主题名称)。通常设置为与 `NTFY_TOPIC` 相同的值。 |
| `NTFY_ALLOW_ALL_USERS` | 仅限开发逃生舱口 — 仅对受访问控制的私有主题安全。默认: `false`。 |
| `NTFY_HOME_CHANNEL` | 使用 `deliver: ntfy` 的定时任务的默认交付目标。 |
| `NTFY_HOME_CHANNEL_NAME` | 主频道的命名标签 (默认为主题名称)。 |

请在部署到不受信任的主题之前，参阅 [ntfy 消息指南](/user-guide/messaging/ntfy) — 特别是**身份模型**部分。

### 高级消息调优

用于限制出站消息批处理的平台高级旋钮。大多数用户不需要触碰这些设置；默认值旨在尊重每个平台的速率限制，同时不感到迟钝。

| Variable | Description |
|----------|-------------|
| `HERMES_TELEGRAM_TEXT_BATCH_DELAY_SECONDS` | 在刷新排队的 Telegram 文本块之前的宽限期 (默认: `0.6`)。 |
| `HERMES_TELEGRAM_TEXT_BATCH_SPLIT_DELAY_SECONDS` | 单个 Telegram 消息超过长度限制时的分块间隔延迟 (默认: `2.0`)。 |
| `HERMES_TELEGRAM_MEDIA_BATCH_DELAY_SECONDS` | 在刷新排队的 Telegram 媒体之前的宽限期 (默认: `0.6`)。 |
| `HERMES_TELEGRAM_FOLLOWUP_GRACE_SECONDS` | 在智能体完成后的跟进发送前的延迟，以避免与最后一个流块竞争。 |
| `HERMES_TELEGRAM_HTTP_CONNECT_TIMEOUT` / `_READ_TIMEOUT` / `_WRITE_TIMEOUT` / `_POOL_TIMEOUT` | 覆盖底层的 `python-telegram-bot` HTTP 超时 (秒)。 |
| `HERMES_TELEGRAM_HTTP_POOL_SIZE` | 对 Telegram API 的最大并发 HTTP 连接数。 |
| `HERMES_TELEGRAM_DISABLE_FALLBACK_IPS` | 禁用在 DNS 失败时使用的硬编码 Cloudflare 回退 IP (`true`/`false`)。 |
| `HERMES_DISCORD_TEXT_BATCH_DELAY_SECONDS` | 在刷新排队的 Discord 文本块之前的宽限期 (默认: `0.6`)。 |
| `HERMES_DISCORD_TEXT_BATCH_SPLIT_DELAY_SECONDS` | Discord 消息超过长度限制时的分块间隔延迟 (默认: `2.0`)。 |
| `HERMES_MATRIX_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` | Matrix 等效的批量调优旋钮。 |
| `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` / `_MAX_CHARS` / `_MAX_MESSAGES` | Feishu 批处理调优 — 延迟、分块延迟、每个消息的最大字符数、每批次的最大消息数。 |
| `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | Feishu 媒体刷新延迟。 |
| `HERMES_FEISHU_DEDUP_CACHE_SIZE` | Feishu webhook 去重缓存的大小 (默认: `1024`)。 |
| `HERMES_WECOM_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` | WeCom 批处理调优。 |
| `HERMES_VISION_DOWNLOAD_TIMEOUT` | 在将图像交给视觉模型之前的下载超时时间 (秒) (默认: `30`)。 |
| `HERMES_RESTART_DRAIN_TIMEOUT` | 网关：在强制重启之前等待活动运行完成的秒数 (`/restart`) (默认: `900`)。 |
| `HERMES_GATEWAY_PLATFORM_CONNECT_TIMEOUT` | 网关启动期间每个平台的连接超时时间 (秒)。 |
| `HERMES_GATEWAY_BUSY_INPUT_MODE` | 默认网关忙碌输入行为：`queue`, `steer`, 或 `interrupt`。可以通过 `/busy` 在每个聊天中进行覆盖。 |
| `HERMES_GATEWAY_BUSY_ACK_ENABLED` | 网关是否在用户发送输入时（智能体处于忙碌状态）发送确认消息 (⚡/⏳/⏩) (默认: `true`)。设置为 `false` 可完全抑制这些消息 — 输入仍然按正常方式排队/引导/中断，只是聊天回复被静音了。从 `config.yaml` 的 `display.busy_ack_enabled` 桥接而来。 |
| `HERMES_GATEWAY_NO_SUPERVISE` | 在 s6-overlay Docker 镜像内部，选择不进行自动监督，在运行 `hermes gateway run` 时使用 pre-s6 前台语义 (无自动重启，网关是容器的主进程)。真值：`1`, `true`, `yes`。相当于 CLI 标志 `--no-supervise`。在 s6 镜像外部无效。 |
| `HERMES_GATEWAY_BOOTSTRAP_STATE` | 在 s6-overlay Docker 镜像内部，声明网关在一个新的卷上的**初始**监督状态。在空白卷上没有持久化的 `gateway_state.json`，因此启动协调器注册 `gateway-default` 插槽但将其保持为 **down** (它仅在上次记录的状态为 `running` 时才自动启动)。将其设置为 `running`，并在协调器运行之前通过首次启动设置钩子播种 `gateway_state.json`，以便网关在第一次启动时就启动。只接受字面值 `running`。首次启动时：现有 `gateway_state.json` 永远不会被覆盖，因此故意停止的网关会在重启后保持停止状态。在 s6 镜像外部无效。 |
| `GATEWAY_RELAY_URL` | 实验性的中继连接器 WebSocket 基础 URL。设置后，网关注册通用的 `relay` 适配器并拨打连接器。镜像 `config.yaml` 中的 `gateway.relay_url`。 |
| `GATEWAY_RELAY_ID` | 由 `hermes gateway enroll` 分配或自行配置的中继网关标识符。镜像 `gateway.relay_id`。 |
| `GATEWAY_RELAY_SECRET` | 用于身份验证的每个网关中继密钥。如果已配置，则跳过自配置。镜像 `gateway.relay_secret`。 |
| `GATEWAY_RELAY_DELIVERY_KEY` | 存储用于中继/直通认证的连接器颁发的交付密钥。当前的连接器入站消息到达输出 WebSocket 而不是网关侧的 HTTP 接收器。 |
| `GATEWAY_RELAY_ENROLL_TOKEN` | 当未显式传递 `--token` 时，由 `hermes gateway enroll` 消耗的注册令牌。 |
| `GATEWAY_RELAY_PLATFORM` | 在中继能力描述符中宣传的可选平台名称。 |
| `GATEWAY_RELAY_BOT_ID` | 在中继能力描述符中宣传的可选 bot 标识符。 |
| `GATEWAY_RELAY_ENDPOINT` | 为需要回调/直通 URL 的连接器模式所宣传的可选网关端点；对于默认的 WS-only 入站中继路径不是必需的。镜像 `config.yaml` 中的 `gateway.relay_endpoint`。 |
| `GATEWAY_RELAY_ROUTE_KEYS` | 宣传给连接器的逗号分隔中继路由密钥。镜像 `config.yaml` 中的 `gateway.relay_route_keys`。 |
| `HERMES_FILE_MUTATION_VERIFIER` | 启用每个回合文件变异验证器页脚 (默认: `true`)。启用后，Hermes 会附加一个声明任何在回合中失败但未被成功写入所取代的 `write_file` / `patch` 调用的建议列表。设置为 `0`, `false`, `no` 或 `off` 可抑制。镜像 `config.yaml` 中的 `display.file_mutation_verifier`；环境变量设置后具有更高的优先级。 |
| `HERMES_CRON_TIMEOUT` | 定时任务智能体运行的空闲超时时间 (秒) (默认: `600`)。智能体可以无限期运行，只要它在主动调用工具或接收流令牌——这仅在空闲时触发。设置为 `0` 则为无限。 |
| `HERMES_CRON_SCRIPT_TIMEOUT` | 附加到定时任务的预运行脚本超时时间 (秒) (默认: `120`)。对于需要更长执行时间的脚本（例如反机器人计时器的随机延迟）进行覆盖。也可通过 `config.yaml` 中的 `cron.script_timeout_seconds` 配置。 |
| `HERMES_CRON_MAX_PARALLEL` | 每个 tick 运行的最大并行定时任务数 (默认: `4`)。 |

## 智能体行为

| Variable | Description |
|----------|-------------|
| `HERMES_MAX_ITERATIONS` | 每个对话的最大工具调用迭代次数（默认值：90） |
| `HERMES_INFERENCE_MODEL` | 在进程级别覆盖模型名称（优先于 `config.yaml` 中的设置）。也可通过 `-m`/`--model` 标志设置。 |
| `HERMES_YOLO_MODE` | 设置为 `1` 以绕过危险命令批准提示。等同于 `--yolo`。 |
| `HERMES_ACCEPT_HOOKS` | 自动批准 `config.yaml` 中声明的任何未见的 shell hooks，无需 TTY 提示。等同于 `--accept-hooks` 或 `hooks_auto_accept: true`。 |
| `HERMES_IGNORE_USER_CONFIG` | 跳过 `~/.hermes/config.yaml` 并使用内置默认值（`.env` 中的凭证仍然会加载）。等同于 `--ignore-user-config`。 |
| `HERMES_IGNORE_RULES` | 跳过自动注入 `AGENTS.md`、`SOUL.md`、`.cursorrules`、内存和预加载的技能。等同于 `--ignore-rules`。 |
| `HERMES_SAFE_MODE` | 故障排除模式：禁用所有自定义设置——跳过插件发现和 MCP 服务器加载。通过 `--safe-mode` 自动设置（该标志也会同时设置上述两个标志）。 |
| `HERMES_MD_NAMES` | 要自动注入的规则文件名称逗号分隔列表（默认值：`AGENTS.md,CLAUDE.md,.cursorrules,SOUL.md`）。 |
| `HERMES_TOOL_PROGRESS` | 工具进度显示的已弃用兼容变量。请在 `config.yaml` 中使用 `display.tool_progress`。 |
| `HERMES_TOOL_PROGRESS_MODE` | 工具进度模式的已弃用兼容变量。请在 `config.yaml` 中使用 `display.tool_progress`。 |
| `HERMES_HUMAN_DELAY_MODE` | 响应节奏：`off`/`natural`/`custom` |
| `HERMES_HUMAN_DELAY_MIN_MS` | 自定义延迟范围最小值（毫秒） |
| `HERMES_HUMAN_DELAY_MAX_MS` | 自定义延迟范围最大值（毫秒） |
| `HERMES_QUIET` | 抑制非必要的输出（`true`/`false`） |
| `CODEX_HOME` | 当 [Codex 应用服务器运行时](../user-guide/features/codex-app-server-runtime) 启用时，覆盖 Codex CLI 读取其配置和身份验证的目录（默认值：`~/.codex`）。Hermes 的迁移会将管理块写入 `<CODEX_HOME>/config.toml`。 |
| `HERMES_KANBAN_TASK` | 由看板调度器在启动工作者时设置（任务 UUID）。工作者和衍生的 `hermes-tools` MCP 子进程会继承它，从而使看板工具正确地进行门控。请勿手动设置。 |
| `HERMES_API_TIMEOUT` | LLM API 调用超时时间（秒）（默认值：`1800`） |
| `HERMES_API_CALL_STALE_TIMEOUT` | 非流式调用陈旧超时时间（秒）（默认值：`90`）。对于未设置的本地提供者会自动禁用，并且可能会针对非常大的上下文进行扩展。也可通过 `config.yaml` 中的 `providers.<id>.stale_timeout_seconds` 或 `providers.<id>.models.<model>.stale_timeout_seconds` 进行配置。 |
| `HERMES_STREAM_READ_TIMEOUT` | 流式套接字读取超时时间（秒）（默认值：`120`）。对于本地提供者会自动增加到 `HERMES_API_TIMEOUT`。如果本地 LLM 在长时间的代码生成过程中超时，请进行增加。 |
| `HERMES_STREAM_STALE_TIMEOUT` | 流陈旧检测超时时间（秒）（默认值：`180`）。对于本地提供者会自动禁用。如果在该窗口内没有接收到数据块，将触发连接终止。 |
| `HERMES_STREAM_RETRIES` | 瞬时网络错误时的流中重连尝试次数（默认值：`3`）。 |
| `HERMES_AGENT_TIMEOUT` | 运行中的智能体网关空闲超时时间（秒）（默认值：`1800`，30 分钟）。每次工具调用和流式令牌都会重置。设置为 `0` 可禁用。 |
| `HERMES_AGENT_TIMEOUT_WARNING` | 网关：在达到此空闲秒数后发送警告消息（默认值：`HERMES_AGENT_TIMEOUT` 的 75%）。 |
| `HERMES_AGENT_NOTIFY_INTERVAL` | 网关：长时间运行的智能体回合之间的进度通知间隔时间（秒）。 |
| `HERMES_CHECKPOINT_TIMEOUT` | 文件系统检查点创建超时时间（秒）（默认值：`30`）。 |
| `HERMES_EXEC_ASK` | 在网关模式下启用执行批准提示（`true`/`false`） |
| `HERMES_ENABLE_PROJECT_PLUGINS` | 启用对来自 `./.hermes/plugins/` 的仓库本地插件的自动发现，适用于智能体加载器和仪表板 Web 服务器。接受标准的真值集：`1` / `true` / `yes` / `on`（不区分大小写）。其他所有设置——包括 `0`、`false`、`no`、`off` 和空字符串——都被视为**禁用**（默认）。注意：截至 GHSA-5qr3-c538-wm9j (#29156)，仪表板 Web 服务器拒绝自动导入项目插件的 Python `api` 文件，即使此变量已启用——项目插件可以通过静态 JS/CSS 扩展 UI，但它们的后端路由仅在移动到 `~/.hermes/plugins/` 下方会加载。 |
| `HERMES_PLUGINS_DEBUG` | 设置为 `1`/`true` 以在 stderr 上显示详细的插件发现日志——扫描的目录、解析的清单、跳过原因以及解析或 `register()` 失败时的完整回溯。面向插件作者。 |
| `HERMES_BACKGROUND_NOTIFICATIONS` | 网关中的后台进程通知模式：`all`（默认）、`result`、`error`、`off` |
| `HERMES_EPHEMERAL_SYSTEM_PROMPT` | 在 API 调用时注入的瞬态系统提示（永不持久化到会话中） |
| `HERMES_PREFILL_MESSAGES_FILE` | 在 API 调用时注入的瞬态预填充消息 JSON 文件的路径。 |
| `HERMES_ALLOW_PRIVATE_URLS` | `true`/`false` — 是否允许工具抓取 localhost/私有网络 URL。在网关模式下默认禁用。 |
| `HERMES_REDACT_SECRETS` | `true`/`false` — 控制工具输出、日志和聊天回复中的秘密信息脱敏（默认值：`true`）。 |
| `HERMES_WRITE_SAFE_ROOT` | 可选的目录前缀，用于限制 `write_file`/`patch` 写入；外部路径需要批准。 |
| `HERMES_DISABLE_LAZY_INSTALLS` | 一个内部桥接变量，在官方 Docker 镜像中自动设置，以防止运行时将依赖项安装到不可变的 `/opt/hermes` 树中。面向用户的等效设置是 `config.yaml` 中的 `security.allow_lazy_installs: false`；请勿在 `.env` 中设置此项。 |
| `HERMES_DISABLE_FILE_STATE_GUARD` | 设置为 `1` 以关闭 `patch`/`write_file` 上的“你读取它之后文件已更改”保护机制。 |
| `HERMES_CORE_TOOLS` | 通用核心工具列表的逗号分隔覆盖项（高级；很少需要）。 |
| `HERMES_BUNDLED_SKILLS` | 在启动时加载的捆绑技能列表的逗号分隔覆盖项。 |
| `HERMES_OPTIONAL_SKILLS` | 首次运行时自动安装的可选技能名称逗号分隔列表。 |
| `HERMES_DEBUG_INTERRUPT` | 设置为 `1` 以将详细的中断/取消跟踪记录到 `agent.log` 中。 |
| `HERMES_DUMP_REQUESTS` | 将 API 请求负载转储到日志文件（`true`/`false`） |
| `HERMES_DUMP_REQUEST_STDOUT` | 将 API 请求负载转储到 stdout 而不是日志文件。 |
| `HERMES_OAUTH_TRACE` | 设置为 `1` 以记录 OAuth 令牌交换和刷新尝试。包括脱敏的计时信息。 |
| `HERMES_OAUTH_FILE` | 覆盖用于 OAuth 凭证存储所使用的路径（默认值：`~/.hermes/auth.json`）。 |
| `HERMES_AGENT_HELP_GUIDANCE` | 为自定义部署向系统提示附加额外的指导文本。 |
| `HERMES_AGENT_LOGO` | 覆盖 CLI 启动时的 ASCII 横幅标志。 |
| `DELEGATION_MAX_CONCURRENT_CHILDREN` | 每个 `delegate_task` 批次的最大并行子智能体数（默认值：`3`，取 1 的下限，无上限）。也可通过 `config.yaml` 中的 `delegation.max_concurrent_children` 进行配置——配置文件中的值具有优先级。 |

## 界面 (Interface)

| Variable | Description |
|----------|-------------|
| `HERMES_TUI` | 当设置为 `1` 时，启动 [TUI](../user-guide/tui.md) 而不是经典的 CLI。相当于传递 `--tui` 参数。 |
| `HERMES_TUI_DIR` | 一个预构建的 `ui-tui/` 目录路径（必须包含 `dist/entry.js` 和填充好的 `node_modules`）。供发行版和 Nix 使用，以跳过首次启动时的 `npm install`。 |
| `HERMES_TUI_RESUME` | 通过 ID 恢复特定的 TUI 会话。设置此项后，`hermes --tui` 将跳过创建新会话，而是拾取指定的会话——这对于在断开连接或终端崩溃后重新附着非常有用。 |
| `HERMES_TUI_THEME` | 强制指定 TUI 的颜色主题：`light`（浅色）、`dark`（深色）或原始的 6 位十六进制背景色（例如 `ffffff` 或 `1a1a2e`）。如果未设置，Hermes 会使用 `COLORFGBG` 和终端背景查询自动检测；此变量用于覆盖那些不设置 `COLORFGBG` 的终端（Ghostty, Warp, iTerm2 等）的检测结果。 |
| `HERMES_INFERENCE_MODEL` | 强制为 `hermes -z` / `hermes chat` 指定模型，而无需修改 `config.yaml`。与 `--provider` 标志配合使用。对于需要按运行次覆盖默认模型的脚本调用者（sweeper、CI、批量运行器）非常有用。 |

## 会话设置 (Session Settings)

| Variable | Description |
|----------|-------------|
| `SESSION_IDLE_MINUTES` | 在 N 分钟不活动后重置会话（默认值：1440） |
| `SESSION_RESET_HOUR` | 24 小时制下的每日重置小时（默认值：4 = 上午 4 点） |
| `HERMES_SESSION_ID` | **自动导出到 Hermes 启动的每个工具子进程中**（包括 `terminal`、`execute_code`、持久化 shell、Docker/Singularity 后端、委托的智能体运行）。由智能体设置当前会话 ID；从工具中调用的用户脚本可以读取它，从而将它们的输出、遥测数据或副作用与原始的 Hermes 会话相关联。**你不应该手动设置此项**——从父 shell 覆盖它只能在智能体运行之外生效，一旦智能体启动会话就会被覆盖。 |

## 上下文压缩 (Context Compression) (config.yaml 专用)

上下文压缩仅通过 `config.yaml` 配置——没有环境变量可以配置它。阈值设置位于 `compression:` 块中，而摘要模型/提供者则位于 `auxiliary.compression:` 下。

```yaml
compression:
  enabled: true
  threshold: 0.50
  target_ratio: 0.20         # 保留为近期尾部的阈值分数
  protect_last_n: 20         # 保持不压缩的最小最近消息数
```

:::info 遗留迁移 (Legacy migration)
包含 `compression.summary_model`、`compression.summary_provider` 和 `compression.summary_base_url` 的旧配置将在首次加载时自动迁移到 `auxiliary.compression.*`。
:::

## 辅助任务覆盖设置 (Auxiliary Task Overrides)

| Variable | Description |
|----------|-------------|
| `AUXILIARY_VISION_PROVIDER` | 视觉任务的提供者覆盖设置 |
| `AUXILIARY_VISION_MODEL` | 视觉任务的模型覆盖设置 |
| `AUXILIARY_VISION_BASE_URL` | 视觉任务的 OpenAI 兼容端点地址 |
| `AUXILIARY_VISION_API_KEY` | 与 `AUXILIARY_VISION_BASE_URL` 配对的 API 密钥 |
| `AUXILIARY_WEB_EXTRACT_PROVIDER` | 网络提取/摘要的提供者覆盖设置 |
| `AUXILIARY_WEB_EXTRACT_MODEL` | 网络提取/摘要的模型覆盖设置 |
| `AUXILIARY_WEB_EXTRACT_BASE_URL` | 网络提取/摘要的 OpenAI 兼容端点地址 |
| `AUXILIARY_WEB_EXTRACT_API_KEY` | 与 `AUXILIARY_WEB_EXTRACT_BASE_URL` 配对的 API 密钥 |

对于特定任务的直接端点，Hermes 使用该任务配置的 API 密钥或 `OPENAI_API_KEY`。它不会将 `OPENROUTER_API_KEY` 用于这些自定义端点。

## 回退提供者 (Fallback Providers) (config.yaml 专用)

主模型回退链仅通过 `config.yaml` 配置——没有环境变量可以配置它。添加一个顶级的 `fallback_providers` 列表，包含 `provider` 和 `model` 键，以在主模型遇到错误时启用自动故障转移。提供者为 `auto` 的辅助任务也会先查阅此链，再查阅 Hermes 内置的辅助发现链。

```yaml
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
```

旧的顶级 `fallback_model` 单提供者格式仍保留以保持向后兼容性，但新的配置应使用 `fallback_providers`。对于特定任务的辅助策略，请在 `config.yaml` 中使用 `auxiliary.<task>.fallback_chain`；没有等效的环境变量。

有关完整详情，请参阅 [回退提供者](/user-guide/features/fallback-providers)。

## 提供者路由 (Provider Routing) (config.yaml 专用)

这些内容应放在 `~/.hermes/config.yaml` 的 `provider_routing` 部分下：

| Key | Description |
|-----|-------------|
| `sort` | 排序提供者：`"price"`（默认）、`"throughput"` 或 `"latency"` |
| `only` | 允许的提供者 slug 列表（例如 `["anthropic", "google"]`） |
| `ignore` | 要跳过的提供者 slug 列表 |
| `order` | 按顺序尝试的提供者 slug 列表 |
| `require_parameters` | 是否只使用支持所有请求参数的提供者 (`true`/`false`) |
| `data_collection` | `"allow"`（默认）或 `"deny"`，用于排除存储数据的提供者 |

:::tip
使用 `hermes config set` 来设置环境变量——它会自动将它们保存到正确的文件（秘密信息用 `.env`，其他所有内容用 `config.yaml`）。
:::