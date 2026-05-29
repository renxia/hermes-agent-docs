---
sidebar_position: 2
title: "环境变量"
description: "Hermes 智能体使用的所有环境变量完整参考"
---

# 环境变量参考

所有变量均放置于 `~/.hermes/.env` 文件中。您也可以使用 `hermes config set VAR value` 命令进行设置。

## LLM 提供商

| 变量 | 描述 |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API 密钥（推荐，因其灵活性） |
| `OPENROUTER_BASE_URL` | 覆盖 OpenRouter 兼容的基 URL |
| `HERMES_OPENROUTER_CACHE` | 启用 OpenRouter 响应缓存（`1`/`true`/`yes`/`on`）。覆盖 `config.yaml` 中的 `openrouter.response_cache`。参见[响应缓存](https://openrouter.ai/docs/guides/features/response-caching)。 |
| `HERMES_OPENROUTER_CACHE_TTL` | 缓存 TTL，单位为秒（1-86400）。覆盖 `config.yaml` 中的 `openrouter.response_cache_ttl`。 |
| `NOUS_BASE_URL` | 覆盖 Nous 门户基 URL（通常不需要；仅用于开发/测试） |
| `NOUS_INFERENCE_BASE_URL` | 直接覆盖 Nous 推理端点 |
| `OPENAI_API_KEY` | 用于自定义 OpenAI 兼容端点的 API 密钥（与 `OPENAI_BASE_URL` 配合使用） |
| `OPENAI_BASE_URL` | 自定义端点（VLLM、SGLang 等）的基 URL |
| `COPILOT_GITHUB_TOKEN` | 用于 Copilot API 的 GitHub 令牌 —— 第一优先级（OAuth `gho_*` 或细粒度 PAT `github_pat_*`；**不支持** 经典 PAT `ghp_*`） |
| `GH_TOKEN` | GitHub 令牌 —— Copilot 的第二优先级（`gh` CLI 也使用） |
| `GITHUB_TOKEN` | GitHub 令牌 —— Copilot 的第三优先级 |
| `HERMES_COPILOT_ACP_COMMAND` | 覆盖 Copilot ACP CLI 二进制文件路径（默认：`copilot`） |
| `COPILOT_CLI_PATH` | `HERMES_COPILOT_ACP_COMMAND` 的别名 |
| `HERMES_COPILOT_ACP_ARGS` | 覆盖 Copilot ACP 参数（默认：`--acp --stdio`） |
| `COPILOT_ACP_BASE_URL` | 覆盖 Copilot ACP 基 URL |
| `GLM_API_KEY` | z.ai / 智谱 AI GLM API 密钥 ([z.ai](https://z.ai)) |
| `ZAI_API_KEY` | `GLM_API_KEY` 的别名 |
| `Z_AI_API_KEY` | `GLM_API_KEY` 的别名 |
| `GLM_BASE_URL` | 覆盖 z.ai 基 URL（默认：`https://api.z.ai/api/paas/v4`） |
| `KIMI_API_KEY` | Kimi / 月之暗面 AI API 密钥 ([moonshot.ai](https://platform.moonshot.ai)) |
| `KIMI_BASE_URL` | 覆盖 Kimi 基 URL（默认：`https://api.moonshot.ai/v1`） |
| `KIMI_CN_API_KEY` | Kimi / 月之暗面中国站 API 密钥 ([moonshot.cn](https://platform.moonshot.cn)) |
| `ARCEEAI_API_KEY` | Arcee AI API 密钥 ([chat.arcee.ai](https://chat.arcee.ai/)) |
| `ARCEE_BASE_URL` | 覆盖 Arcee 基 URL（默认：`https://api.arcee.ai/api/v1`） |
| `GMI_API_KEY` | GMI Cloud API 密钥 ([gmicloud.ai](https://www.gmicloud.ai/)) |
| `GMI_BASE_URL` | 覆盖 GMI Cloud 基 URL（默认：`https://api.gmi-serving.com/v1`） |
| `MINIMAX_API_KEY` | MiniMax API 密钥 —— 全球端点 ([minimax.io](https://www.minimax.io))。**不被 `minimax-oauth` 使用**（OAuth 路径改用浏览器登录）。 |
| `MINIMAX_BASE_URL` | 覆盖 MiniMax 基 URL（默认：`https://api.minimax.io/anthropic` —— Hermes 使用 MiniMax 的 Anthropic Messages 兼容端点）。**不被 `minimax-oauth` 使用**。 |
| `MINIMAX_CN_API_KEY` | MiniMax API 密钥 —— 中国端点 ([minimaxi.com](https://www.minimaxi.com))。**不被 `minimax-oauth` 使用**（OAuth 路径改用浏览器登录）。 |
| `MINIMAX_CN_BASE_URL` | 覆盖 MiniMax 中国站基 URL（默认：`https://api.minimaxi.com/anthropic`）。**不被 `minimax-oauth` 使用**。 |
| `KILOCODE_API_KEY` | Kilo Code API 密钥 ([kilo.ai](https://kilo.ai)) |
| `KILOCODE_BASE_URL` | 覆盖 Kilo Code 基 URL（默认：`https://api.kilo.ai/api/gateway`） |
| `XIAOMI_API_KEY` | 小米 MiMo API 密钥 ([platform.xiaomimimo.com](https://platform.xiaomimimo.com)) |
| `XIAOMI_BASE_URL` | 覆盖小米 MiMo 基 URL（默认：`https://api.xiaomimimo.com/v1`） |
| `TOKENHUB_API_KEY` | 腾讯 TokenHub API 密钥 ([tokenhub.tencentmaas.com](https://tokenhub.tencentmaas.com)) |
| `TOKENHUB_BASE_URL` | 覆盖腾讯 TokenHub 基 URL（默认：`https://tokenhub.tencentmaas.com/v1`） |
| `AZURE_FOUNDRY_API_KEY` | 微软 Foundry / Azure OpenAI API 密钥 ([ai.azure.com](https://ai.azure.com/))。当 `model.auth_mode: entra_id` 时不需要。 |
| `AZURE_FOUNDRY_BASE_URL` | 微软 Foundry 端点 URL（例如 OpenAI 风格为 `https://&lt;resource&gt;.openai.azure.com/openai/v1`，Anthropic 风格为 `https://&lt;resource&gt;.services.ai.azure.com/anthropic`） |
| `AZURE_ANTHROPIC_KEY` | 用于 `provider: anthropic` + `base_url` 指向微软 Foundry Claude 部署的 Azure Anthropic API 密钥（当同时配置了 Anthropic 和 Azure Anthropic 时，可替代 `ANTHROPIC_API_KEY`） |
| `AZURE_TENANT_ID` | Entra ID 租户 ID（服务主体流程；当 `model.auth_mode: entra_id` 时，`azure-identity` 会读取此值） |
| `AZURE_CLIENT_ID` | Entra ID 客户端 ID（服务主体、工作负载标识或用户分配的托管标识） |
| `AZURE_CLIENT_SECRET` | `EnvironmentCredential` 使用的服务主体密钥 |
| `AZURE_CLIENT_CERTIFICATE_PATH` | 服务主体证书（`AZURE_CLIENT_SECRET` 的替代方案） |
| `AZURE_FEDERATED_TOKEN_FILE` | AKS 工作负载标识 / OIDC 流程的联合令牌文件路径 |
| `AZURE_AUTHORITY_HOST` | 主权云授权机构覆盖（例如 Azure 政府版为 `https://login.microsoftonline.us`）。参见 [Azure Foundry 指南](/guides/azure-foundry#sovereign-clouds-government-china) |
| `IDENTITY_ENDPOINT` / `MSI_ENDPOINT` | 应用服务、函数和容器应用的托管标识端点；虚拟机通常使用 IMDS，无需设置这些变量 |
| `HF_TOKEN` | 用于推理提供商的 Hugging Face 令牌 ([huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)) |
| `HF_BASE_URL` | 覆盖 Hugging Face 基 URL（默认：`https://router.huggingface.co/v1`） |
| `GOOGLE_API_KEY` | Google AI Studio API 密钥 ([aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)) |
| `GEMINI_API_KEY` | `GOOGLE_API_KEY` 的别名 |
| `GEMINI_BASE_URL` | 覆盖 Google AI Studio 基 URL |
| `HERMES_GEMINI_CLIENT_ID` | `google-gemini-cli` PKCE 登录的 OAuth 客户端 ID（可选；默认为 Google 的公共 gemini-cli 客户端） |
| `HERMES_GEMINI_CLIENT_SECRET` | `google-gemini-cli` 的 OAuth 客户端密钥（可选） |
| `HERMES_GEMINI_PROJECT_ID` | 用于付费 Gemini 层级的 GCP 项目 ID（免费层级会自动配置） |
| `ANTHROPIC_API_KEY` | Anthropic Console API 密钥 ([console.anthropic.com](https://console.anthropic.com/)) |
| `ANTHROPIC_TOKEN` | 手动或旧版 Anthropic OAuth/设置令牌覆盖 |
| `DASHSCOPE_API_KEY` | 通义千问云（阿里云 DashScope）API 密钥，用于通义千问模型 ([modelstudio.console.alibabacloud.com](https://modelstudio.console.alibabacloud.com/)) |
| `DASHSCOPE_BASE_URL` | 自定义 DashScope 基 URL（默认：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`；中国大陆区域请使用 `https://dashscope.aliyuncs.com/compatible-mode/v1`） |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥，用于直接访问 DeepSeek ([platform.deepseek.com](https://platform.deepseek.com/api_keys)) |
| `DEEPSEEK_BASE_URL` | 自定义 DeepSeek API 基 URL |
| `NOVITA_API_KEY` | NovitaAI API 密钥 —— 面向模型 API、智能体沙盒和 GPU 云的 AI 原生云 ([novita.ai/settings/key-management](https://novita.ai/settings/key-management)) |
| `NOVITA_BASE_URL` | 覆盖 NovitaAI 基 URL（默认：`https://api.novita.ai/openai/v1`） |
| `NVIDIA_API_KEY` | NVIDIA NIM API 密钥 —— Nemotron 和开源模型 ([build.nvidia.com](https://build.nvidia.com)) |
| `NVIDIA_BASE_URL` | 覆盖 NVIDIA 基 URL（默认：`https://integrate.api.nvidia.com/v1`；本地 NIM 端点请设为 `http://localhost:8000/v1`） |
| `STEPFUN_API_KEY` | StepFun API 密钥 —— Step 系列模型 ([platform.stepfun.com](https://platform.stepfun.com)) |
| `STEPFUN_BASE_URL` | 覆盖 StepFun 基 URL（默认：`https://api.stepfun.com/v1`） |
| `OLLAMA_API_KEY` | Ollama Cloud API 密钥 —— 无需本地 GPU 的托管 Ollama 目录 ([ollama.com/settings/keys](https://ollama.com/settings/keys)) |
| `OLLAMA_BASE_URL` | 覆盖 Ollama Cloud 基 URL（默认：`https://ollama.com/v1`） |
| `XAI_API_KEY` | xAI (Grok) API 密钥，用于聊天 + TTS + 网页搜索 ([console.x.ai](https://console.x.ai/)) |
| `XAI_BASE_URL` | 覆盖 xAI 基 URL（默认：`https://api.x.ai/v1`） |
| `MISTRAL_API_KEY` | Mistral API 密钥，用于 Voxtral TTS 和 Voxtral STT ([console.mistral.ai](https://console.mistral.ai)) |
| `AWS_REGION` | 用于 Bedrock 推理的 AWS 区域（例如 `us-east-1`、`eu-central-1`）。由 boto3 读取。 |
| `AWS_PROFILE` | 用于 Bedrock 身份验证的 AWS 命名配置文件（读取 `~/.aws/credentials`）。留空以使用默认的 boto3 凭证链。 |
| `BEDROCK_BASE_URL` | 覆盖 Bedrock 运行时基 URL（默认：`https://bedrock-runtime.us-east-1.amazonaws.com`；通常留空并使用 `AWS_REGION`） |
| `HERMES_QWEN_BASE_URL` | 通义千问门户基 URL 覆盖（默认：`https://portal.qwen.ai/v1`） |
| `OPENCODE_ZEN_API_KEY` | OpenCode Zen API 密钥 —— 按需访问精选模型 ([opencode.ai](https://opencode.ai/auth)) |
| `OPENCODE_ZEN_BASE_URL` | 覆盖 OpenCode Zen 基 URL |
| `OPENCODE_GO_API_KEY` | OpenCode Go API 密钥 —— 10 美元/月订阅访问开源模型 ([opencode.ai](https://opencode.ai/auth)) |
| `OPENCODE_GO_BASE_URL` | 覆盖 OpenCode Go 基 URL |
| `CLAUDE_CODE_OAUTH_TOKEN` | 如果你手动导出了 Claude Code 令牌，可以在此处显式覆盖 |
| `HERMES_MODEL` | 在进程级别覆盖模型名称（由 cron 调度程序使用；正常使用建议在 `config.yaml` 中配置） |
| `VOICE_TOOLS_OPENAI_KEY` | OpenAI 语音转文本和文本转语音提供商的首选 OpenAI 密钥 |
| `HERMES_LOCAL_STT_COMMAND` | 可选的本地语音转文本命令模板。支持 `{input_path}`、`{output_dir}`、`{language}` 和 `{model}` 占位符 |
| `HERMES_LOCAL_STT_LANGUAGE` | 传递给 `HERMES_LOCAL_STT_COMMAND` 或自动检测的本地 `whisper` CLI 回退的默认语言（默认：`en`） |
| `HERMES_HOME` | 覆盖 Hermes 配置目录（默认：`~/.hermes`）。同时确定网关 PID 文件和 systemd 服务名称的范围，以便多个安装可以并行运行 |
| `HERMES_GIT_BASH_PATH` | **仅限 Windows。** 覆盖终端工具对 `bash.exe` 的查找。可指向任何 bash —— 完整的 Git for Windows 安装、通过符号链接的 WSL bash、MSYS2、Cygwin。安装程序会自动将其设置为它配置的 PortableGit。参见 [Windows（原生）指南](../user-guide/windows-native.md#how-hermes-runs-shell-commands-on-windows) |
| `HERMES_DISABLE_WINDOWS_UTF8` | **仅限 Windows。** 设为 `1` 以禁用 UTF-8 stdio 垫片（`configure_windows_stdio()`），并回退到控制台的语言环境代码页。有助于定位编码错误；在正常操作中很少是正确的设置 |
| `HERMES_KANBAN_HOME` | 覆盖用于锚定看板（数据库 + 工作区 + 工作进程日志）的共享 Hermes 根目录。回退到 `get_default_hermes_root()`（任何活动配置文件的父目录）。适用于测试和特殊部署场景 |
| `HERMES_KANBAN_BOARD` | 为此进程固定活动看板。优先级高于 `~/.hermes/kanban/current`；调度程序会将其注入到工作进程子环境变量中，以便工作进程在物理上无法看到其他看板上的任务。默认为 `default`。Slug 验证：小写字母数字 + 连字符 + 下划线，1-64 个字符 |
| `HERMES_KANBAN_DB` | 直接固定看板数据库文件路径（最高优先级；优先于 `HERMES_KANBAN_BOARD` 和 `HERMES_KANBAN_HOME`）。调度程序会将其注入到工作进程子环境变量中，以便配置文件工作进程收敛到调度程序的看板 |
| `HERMES_KANBAN_WORKSPACES_ROOT` | 直接固定看板工作区根目录（工作区的最高优先级；优先于 `HERMES_KANBAN_HOME`）。调度程序会将其注入到工作进程子环境变量中 |
| `HERMES_KANBAN_DISPATCH_IN_GATEWAY` | `kanban.dispatch_in_gateway` 的运行时覆盖。设为 `0`、`false`、`no` 或 `off` 可阻止网关启动内嵌的看板调度程序；任何其他非空值将启用它。当有独立的调度程序进程拥有该看板时很有用。 |

## 提供者身份验证 (OAuth)

对于原生 Anthropic 身份验证，Hermes 在存在 Claude Code 自身的凭证文件时会优先使用它们，因为这些凭证可以自动刷新。**针对 Anthropic 的 OAuth 要求拥有已购买额外使用额度的 Claude Max 套餐** —— Hermes 作为 Claude Code 进行路由，这仅会从 Max 套餐的额外/超额额度中扣费，而非基础 Max 额度，且不适用于 Claude Pro。如果没有 Max + 额外额度，请改用 API 密钥。环境变量如 `ANTHROPIC_TOKEN` 仍可作为手动覆盖使用，但不再是 Claude Max 登录的首选路径。

| 变量名 | 描述 |
|--------|------|
| `HERMES_PORTAL_BASE_URL` | 覆盖 Nous 门户 URL（用于开发/测试） |
| `NOUS_INFERENCE_BASE_URL` | 覆盖 Nous 推理 API URL |
| `HERMES_NOUS_MIN_KEY_TTL_SECONDS` | 智能体密钥在重新生成前的最小生存时间（默认值：1800 = 30分钟） |
| `HERMES_NOUS_TIMEOUT_SECONDS` | 用于 Nous 凭证/令牌流程的 HTTP 超时时间 |
| `HERMES_DUMP_REQUESTS` | 将 API 请求载荷转储到日志文件（`true`/`false`） |
| `HERMES_PREFILL_MESSAGES_FILE` | 指向在 API 调用时注入的临时预填充消息 JSON 文件的路径 |
| `HERMES_TIMEZONE` | IANA 时区覆盖（例如 `America/New_York`） |

## 工具 API

| 变量名 | 描述 |
|--------|------|
| `PARALLEL_API_KEY` | AI 原生网络搜索 ([parallel.ai](https://parallel.ai/)) |
| `FIRECRAWL_API_KEY` | 网页抓取和云浏览器 ([firecrawl.dev](https://firecrawl.dev/)) |
| `FIRECRAWL_API_URL` | 用于自托管实例的自定义 Firecrawl API 端点（可选） |
| `TAVILY_API_KEY` | 用于 AI 原生网络搜索、提取和爬取的 Tavily API 密钥 ([app.tavily.com](https://app.tavily.com/home)) |
| `SEARXNG_URL` | 用于免费自托管网络搜索的 SearXNG 实例 URL —— 无需 API 密钥 ([searxng.github.io](https://searxng.github.io/searxng/)) |
| `TAVILY_BASE_URL` | 覆盖 Tavily API 端点。适用于企业代理和自托管的 Tavily 兼容搜索后端。模式与 `GROQ_BASE_URL` 相同。 |
| `EXA_API_KEY` | 用于 AI 原生网络搜索和内容获取的 Exa API 密钥 ([exa.ai](https://exa.ai/)) |
| `BROWSERBASE_API_KEY` | 浏览器自动化 ([browserbase.com](https://browserbase.com/)) |
| `BROWSERBASE_PROJECT_ID` | Browserbase 项目 ID |
| `BROWSER_USE_API_KEY` | Browser Use 云浏览器 API 密钥 ([browser-use.com](https://browser-use.com/)) |
| `FIRECRAWL_BROWSER_TTL` | Firecrawl 浏览器会话生存时间（秒）（默认值：300） |
| `BROWSER_CDP_URL` | 用于本地浏览器的 Chrome 开发者工具协议 URL（通过 `/browser connect` 设置，例如 `ws://localhost:9222`） |
| `CAMOFOX_URL` | Camofox 本地反检测浏览器 URL（默认值：`http://localhost:9377`） |
| `CAMOFOX_USER_ID` | 可选，用于共享可见会话的外部管理 Camofox 用户 ID |
| `CAMOFOX_SESSION_KEY` | 可选，为 `CAMOFOX_USER_ID` 创建标签页时使用的 Camofox 会话密钥 |
| `CAMOFOX_ADOPT_EXISTING_TAB` | 设置为 `true` 以在创建新标签页前重用现有的 Camofox 标签页 |
| `BROWSER_INACTIVITY_TIMEOUT` | 浏览器会话不活动超时时间（秒） |
| `AGENT_BROWSER_ARGS` | 额外的 Chromium 启动标志（以逗号或换行符分隔）。当以 root 身份或在 AppArmor 限制的非特权用户命名空间（Ubuntu 23.10+、DGX Spark、许多容器镜像）中运行时，Hermes 会自动注入 `--no-sandbox,--disable-dev-shm-usage`；仅当需要覆盖或添加其他标志时才需手动设置此项。 |
| `FAL_KEY` | 图像生成 ([fal.ai](https://fal.ai/)) |
| `GROQ_API_KEY` | Groq Whisper 语音转文本 API 密钥 ([groq.com](https://groq.com/)) |
| `ELEVENLABS_API_KEY` | ElevenLabs 高级语音合成 ([elevenlabs.io](https://elevenlabs.io/)) |
| `STT_GROQ_MODEL` | 覆盖 Groq 语音转文本模型（默认值：`whisper-large-v3-turbo`） |
| `GROQ_BASE_URL` | 覆盖 Groq 的 OpenAI 兼容语音转文本端点 |
| `STT_OPENAI_MODEL` | 覆盖 OpenAI 语音转文本模型（默认值：`whisper-1`） |
| `STT_OPENAI_BASE_URL` | 覆盖 OpenAI 兼容的语音转文本端点 |
| `GITHUB_TOKEN` | 用于技能中心的 GitHub 令牌（更高的 API 速率限制、技能发布） |
| `HONCHO_API_KEY` | 跨会话用户建模 ([honcho.dev](https://honcho.dev/)) |
| `HONCHO_BASE_URL` | 自托管 Honcho 实例的基础 URL（默认值：Honcho 云服务）。本地实例无需 API 密钥 |
| `HINDSIGHT_TIMEOUT` | Hindsight 记忆提供者 API 调用的超时时间（秒）（默认值：`60`）。如果在 `/sync` 或 `on_session_switch` 期间你的 Hindsight 实例响应缓慢，并在 `errors.log` 中看到超时错误，请调高此值。 |
| `SUPERMEMORY_API_KEY` | 具有画像召回和会话集成功能的语义长期记忆 ([supermemory.ai](https://supermemory.ai)) |
| `DAYTONA_API_KEY` | Daytona 云沙箱 ([daytona.io](https://daytona.io/)) |

### Langfuse 可观测性

为内置的 [`observability/langfuse`](/user-guide/features/built-in-plugins#observabilitylangfuse) 插件设置的环境变量。在 `~/.hermes/.env` 中设置这些变量。插件也必须启用（通过 `hermes plugins enable observability/langfuse` 或在 `hermes plugins` 中勾选复选框），这些设置才会生效。

| 变量名 | 描述 |
|--------|------|
| `HERMES_LANGFUSE_PUBLIC_KEY` | Langfuse 项目公钥（`pk-lf-...`）。必需。 |
| `HERMES_LANGFUSE_SECRET_KEY` | Langfuse 项目私钥（`sk-lf-...`）。必需。 |
| `HERMES_LANGFUSE_BASE_URL` | Langfuse 服务器 URL（默认值：`https://cloud.langfuse.com`）。用于自托管时设置。 |
| `HERMES_LANGFUSE_ENV` | 追踪上的环境标签（`production`、`staging`、……） |
| `HERMES_LANGFUSE_RELEASE` | 追踪上的发布/版本标签 |
| `HERMES_LANGFUSE_SAMPLE_RATE` | SDK 采样率 0.0–1.0（默认值：`1.0`） |
| `HERMES_LANGFUSE_MAX_CHARS` | 序列化载荷的每字段截断长度（默认值：`12000`） |
| `HERMES_LANGFUSE_DEBUG` | `true` 启用插件详细日志记录到 `agent.log` |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` / `LANGFUSE_BASE_URL` | 标准 Langfuse SDK 名称。当 `HERMES_LANGFUSE_*` 等效项未设置时，这些将作为回退值被接受。 |

### Nous 工具网关

这些变量为付费 Nous 订阅者或自托管网关部署配置 [工具网关](/user-guide/features/tool-gateway)。大多数用户无需设置这些——网关会通过 `hermes model` 或 `hermes tools` 自动配置。

| 变量名 | 描述 |
|--------|------|
| `TOOL_GATEWAY_DOMAIN` | 工具网关路由的基础域名（默认值：`nousresearch.com`） |
| `TOOL_GATEWAY_SCHEME` | 网关 URL 使用的 HTTP 或 HTTPS 协议（默认值：`https`） |
| `TOOL_GATEWAY_USER_TOKEN` | 工具网关的身份验证令牌（通常从 Nous 身份验证自动填充） |
| `FIRECRAWL_GATEWAY_URL` | 专门覆盖 Firecrawl 网关端点的 URL |

## 终端后端

| 变量 | 描述 |
|------|------|
| `TERMINAL_ENV` | 后端类型：`local`、`docker`、`ssh`、`singularity`、`modal`、`daytona` |
| `HERMES_DOCKER_BINARY` | 覆盖 Hermeshells 时调用的容器二进制文件（例如 `podman`、`/usr/local/bin/docker`）。未设置时，Hermes 会自动在 `PATH` 中发现 `docker` 或 `podman`。当两者都安装且你想使用非默认的那个，或二进制文件不在 `PATH` 中时需要此变量。 |
| `TERMINAL_DOCKER_IMAGE` | Docker 镜像（默认：`nikolaik/python-nodejs:python3.11-nodejs20`） |
| `TERMINAL_DOCKER_FORWARD_ENV` | 需要显式转发到 Docker 终端会话的环境变量名称的 JSON 数组。注意：技能声明的 `required_environment_variables` 会自动转发——你只需要为未被任何技能声明的变量设置此项。 |
| `TERMINAL_DOCKER_VOLUMES` | 额外的 Docker 卷挂载（逗号分隔的 `宿主机:容器` 对） |
| `TERMINAL_DOCKER_MOUNT_CWD_TO_WORKSPACE` | 高级可选项：将启动目录挂载到 Docker 的 `/workspace`（`true`/`false`，默认：`false`） |
| `TERMINAL_SINGULARITY_IMAGE` | Singularity 镜像或 `.sif` 文件路径 |
| `TERMINAL_MODAL_IMAGE` | Modal 容器镜像 |
| `TERMINAL_DAYTONA_IMAGE` | Daytona 沙箱镜像 |
| `TERMINAL_TIMEOUT` | 命令超时时间（秒） |
| `TERMINAL_LIFETIME_SECONDS` | 终端会话的最大生命周期（秒） |
| `TERMINAL_CWD` | 终端会话的工作目录（仅适用于网关/定时任务；CLI 使用启动目录） |
| `SUDO_PASSWORD` | 启用无需交互提示的 sudo |

对于云沙箱后端，持久化是面向文件系统的。`TERMINAL_LIFETIME_SECONDS` 控制 Hermes 何时清理闲置的终端会话，后续恢复可能会重新创建沙箱，而不是保持相同的活动进程运行。

## SSH 后端

| 变量 | 描述 |
|------|------|
| `TERMINAL_SSH_HOST` | 远程服务器主机名 |
| `TERMINAL_SSH_USER` | SSH 用户名 |
| `TERMINAL_SSH_PORT` | SSH 端口（默认：22） |
| `TERMINAL_SSH_KEY` | 私钥文件路径 |
| `TERMINAL_SSH_PERSISTENT` | 覆盖 SSH 的持久化 shell 设置（默认：遵循 `TERMINAL_PERSISTENT_SHELL`） |

## 容器资源（Docker、Singularity、Modal、Daytona）

| 变量 | 描述 |
|------|------|
| `TERMINAL_CONTAINER_CPU` | CPU 核心数（默认：1） |
| `TERMINAL_CONTAINER_MEMORY` | 内存，单位 MB（默认：5120） |
| `TERMINAL_CONTAINER_DISK` | 磁盘，单位 MB（默认：51200） |
| `TERMINAL_CONTAINER_PERSISTENT` | 是否跨会话持久化容器文件系统（默认：`true`） |
| `TERMINAL_SANDBOX_DIR` | 用于工作区和覆盖层的宿主机目录（默认：`~/.hermes/sandboxes/`） |

## 持久化 Shell

| 变量 | 描述 |
|------|------|
| `TERMINAL_PERSISTENT_SHELL` | 为非本地后端启用持久化 shell（默认：`true`）。也可通过 `config.yaml` 中的 `terminal.persistent_shell` 设置 |
| `TERMINAL_LOCAL_PERSISTENT` | 为本地后端启用持久化 shell（默认：`false`） |
| `TERMINAL_SSH_PERSISTENT` | 覆盖 SSH 后端的持久化 shell 设置（默认：遵循 `TERMINAL_PERSISTENT_SHELL`） |

## 消息传递

| 变量 | 描述 |
|------|------|
| `TELEGRAM_BOT_TOKEN` | Telegram 机器人令牌（来自 @BotFather） |
| `TELEGRAM_ALLOWED_USERS` | 允许使用机器人的用户 ID（逗号分隔），适用于私聊、群组和论坛 |
| `TELEGRAM_GROUP_ALLOWED_USERS` | 仅在群组/论坛中授权的发送者用户 ID（逗号分隔）。*不*授予私聊权限。为向后兼容 pre-#17686 配置，以 `-` 开头的类似 Chat ID 的值仍作为聊天 ID 处理，但会显示弃用警告。 |
| `TELEGRAM_GROUP_ALLOWED_CHATS` | 群组/论坛聊天 ID（逗号分隔）；任何成员均被授权 |
| `TELEGRAM_HOME_CHANNEL` | 用于定时任务投递的默认 Telegram 聊天/频道 |
| `TELEGRAM_HOME_CHANNEL_NAME` | Telegram 主频道的显示名称 |
| `TELEGRAM_CRON_THREAD_ID` | 用于接收定时任务投递的论坛主题 ID；仅覆盖定时任务的 `TELEGRAM_HOME_CHANNEL_THREAD_ID`。在主题模式下使用，以便对定时消息的回复会开启新会话，而不是进入系统大厅 (#24409)。 |
| `TELEGRAM_WEBHOOK_URL` | 用于 webhook 模式的公共 HTTPS URL（启用 webhook 而非轮询） |
| `TELEGRAM_WEBHOOK_PORT` | webhook 服务器的本地监听端口（默认：`8443`） |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram 在每次更新中回传的密钥令牌，用于验证。**当 `TELEGRAM_WEBHOOK_URL` 设置时必需** — 网关在没有它的情况下会拒绝启动 (GHSA-3vpc-7q5r-276h)。使用 `openssl rand -hex 32` 生成。 |
| `TELEGRAM_REACTIONS` | 在消息处理期间启用表情符号回应（默认：`false`） |
| `TELEGRAM_REQUIRE_MENTION` | 在 Telegram 群组中，回复前需要显式触发词。等同于 `config.yaml` 中的 `telegram.require_mention`。 |
| `TELEGRAM_MENTION_PATTERNS` | 当启用 Telegram 群组提及门控时，接受的唤醒词模式列表，可以是 JSON 数组、换行分隔列表或逗号分隔的正则表达式列表。等同于 `telegram.mention_patterns`。 |
| `TELEGRAM_EXCLUSIVE_BOT_MENTIONS` | 启用时，Telegram 群组中显式的 `@...bot` 提及会*仅*路由到被提及的机器人用户名，然后再执行回复或唤醒词回退。默认：`true`。等同于 `telegram.exclusive_bot_mentions`。 |
| `TELEGRAM_REPLY_TO_MODE` | 回复引用行为：`off`、`first`（默认）或 `all`。与 Discord 模式匹配。 |
| `TELEGRAM_IGNORED_THREADS` | 机器人永不响应的 Telegram 论坛主题/线程 ID（逗号分隔） |
| `TELEGRAM_PROXY` | 用于 Telegram 连接的代理 URL — 覆盖 `HTTPS_PROXY`。支持 `http://`、`https://`、`socks5://` |
| `DISCORD_BOT_TOKEN` | Discord 机器人令牌 |
| `DISCORD_ALLOWED_USERS` | 允许使用机器人的 Discord 用户 ID（逗号分隔） |
| `DISCORD_ALLOWED_ROLES` | 允许使用机器人的 Discord 角色 ID（逗号分隔）（与 `DISCORD_ALLOWED_USERS` 取并集）。自动启用 Members 意图。当审核团队人员变动时很有用 — 角色授权会自动传播。 |
| `DISCORD_ALLOWED_CHANNELS` | Discord 频道 ID（逗号分隔）。设置后，机器人仅在这些频道中响应（如果允许，还包括私聊）。覆盖 `config.yaml` 中的 `discord.allowed_channels`。 |
| `DISCORD_PROXY` | 用于 Discord 连接的代理 URL — 覆盖 `HTTPS_PROXY`。支持 `http://`、`https://`、`socks5://` |
| `DISCORD_HOME_CHANNEL` | 用于定时任务投递的默认 Discord 频道 |
| `DISCORD_HOME_CHANNEL_NAME` | Discord 主频道的显示名称 |
| `DISCORD_COMMAND_SYNC_POLICY` | Discord 斜杠命令启动同步策略：`safe`（差异和协调）、`bulk`（旧版 `tree.sync()`）或 `off` |
| `DISCORD_REQUIRE_MENTION` | 在服务器频道中回复前需要 @提及 |
| `DISCORD_FREE_RESPONSE_CHANNELS` | 不需要提及即可响应的频道 ID（逗号分隔） |
| `DISCORD_AUTO_THREAD` | 支持时自动为长回复创建线程 |
| `DISCORD_ALLOW_ANY_ATTACHMENT` | 为 `true` 时，接受任何文件类型的附件（不仅仅是内置的 PDF/text/zip/office 允许列表）。未知类型会被缓存并作为本地路径呈现给智能体，以便其通过 `terminal` / `read_file` / `ffprobe` 进行检查。默认 `false`。 |
| `DISCORD_MAX_ATTACHMENT_BYTES` | 网关将缓存的每个附件的最大字节数。默认 `33554432` (32 MiB)。设为 `0` 表示无上限（附件在写入时暂存在内存中）。 |
| `DISCORD_REACTIONS` | 在消息处理期间启用表情符号回应（默认：`true`） |
| `DISCORD_IGNORED_CHANNELS` | 机器人永不响应的频道 ID（逗号分隔） |
| `DISCORD_NO_THREAD_CHANNELS` | 机器人响应但不自动创建线程的频道 ID（逗号分隔） |
| `DISCORD_REPLY_TO_MODE` | 回复引用行为：`off`、`first`（默认）或 `all` |
| `DISCORD_ALLOW_MENTION_EVERYONE` | 允许机器人 ping `@everyone`/`@here`（默认：`false`）。参见 [提及控制](../user-guide/messaging/discord.md#mention-control)。 |
| `DISCORD_ALLOW_MENTION_ROLES` | 允许机器人 ping `@role` 提及（默认：`false`）。 |
| `DISCORD_ALLOW_MENTION_USERS` | 允许机器人 ping 单个 `@user` 提及（默认：`true`）。 |
| `DISCORD_ALLOW_MENTION_REPLIED_USER` | 回复某条消息时 ping 其作者（默认：`true`）。 |
| `SLACK_BOT_TOKEN` | Slack 机器人令牌（`xoxb-...`） |
| `SLACK_APP_TOKEN` | Slack 应用级令牌（`xapp-...`，Socket 模式必需） |
| `SLACK_ALLOWED_USERS` | Slack 用户 ID（逗号分隔） |
| `SLACK_HOME_CHANNEL` | 用于定时任务投递的默认 Slack 频道 |
| `SLACK_HOME_CHANNEL_NAME` | Slack 主频道的显示名称 |
| `GOOGLE_CHAT_PROJECT_ID` | 承载 Pub/Sub 主题的 GCP 项目（回退到 `GOOGLE_CLOUD_PROJECT`） |
| `GOOGLE_CHAT_SUBSCRIPTION_NAME` | 完整的 Pub/Sub 订阅路径，`projects/{proj}/subscriptions/{sub}`（旧版别名：`GOOGLE_CHAT_SUBSCRIPTION`） |
| `GOOGLE_CHAT_SERVICE_ACCOUNT_JSON` | 服务账户 JSON 的路径，或内联 JSON（回退到 `GOOGLE_APPLICATION_CREDENTIALS`） |
| `GOOGLE_CHAT_ALLOWED_USERS` | 允许与机器人聊天的用户电子邮件（逗号分隔） |
| `GOOGLE_CHAT_ALLOW_ALL_USERS` | 允许任何 Google Chat 用户触发机器人（仅限开发） |
| `GOOGLE_CHAT_HOME_CHANNEL` | 用于定时任务投递的默认空间（例如 `spaces/AAAA...`） |
| `GOOGLE_CHAT_HOME_CHANNEL_NAME` | Google Chat 主空间的显示名称 |
| `GOOGLE_CHAT_MAX_MESSAGES` | Pub/Sub FlowControl 最大在途消息数（默认：`1`） |
| `GOOGLE_CHAT_MAX_BYTES` | Pub/Sub FlowControl 最大在途字节数（默认：`16777216`，16 MiB） |
| `GOOGLE_CHAT_BOOTSTRAP_SPACES` | 启动时探测的额外空间 ID（逗号分隔），用于解析机器人自身的 `users/{id}` |
| `GOOGLE_CHAT_DEBUG_RAW` | 设置为任意值以 DEBUG 级别记录脱敏的 Pub/Sub 信封（仅用于调试） |
| `WHATSAPP_ENABLED` | 启用 WhatsApp 桥接（`true`/`false`） |
| `WHATSAPP_MODE` | `bot`（独立号码）或 `self-chat`（给自己发消息） |
| `WHATSAPP_ALLOWED_USERS` | 允许的电话号码（带国家代码，不含 `+`）（逗号分隔），或 `*` 允许所有发送者 |
| `WHATSAPP_ALLOW_ALL_USERS` | 允许所有 WhatsApp 发送者而无需允许列表（`true`/`false`） |
| `WHATSAPP_DEBUG` | 在桥接中记录原始消息事件以进行故障排除（`true`/`false`） |
| `SIGNAL_HTTP_URL` | signal-cli 守护进程 HTTP 端点（例如 `http://127.0.0.1:8080`） |
| `SIGNAL_ACCOUNT` | 机器人电话号码，E.164 格式 |
| `SIGNAL_ALLOWED_USERS` | E.164 格式的电话号码或 UUID（逗号分隔） |
| `SIGNAL_GROUP_ALLOWED_USERS` | 群组 ID（逗号分隔），或 `*` 表示所有群组 |
| `SIGNAL_HOME_CHANNEL_NAME` | Signal 主频道的显示名称 |
| `SIGNAL_IGNORE_STORIES` | 忽略 Signal 故事/状态更新 |
| `SIGNAL_ALLOW_ALL_USERS` | 允许所有 Signal 用户而无需允许列表 |
| `TWILIO_ACCOUNT_SID` | Twilio 账户 SID（与电话技能共享） |
| `TWILIO_AUTH_TOKEN` | Twilio 认证令牌（与电话技能共享；也用于 webhook 签名验证） |
| `TWILIO_PHONE_NUMBER` | Twilio 电话号码，E.164 格式（与电话技能共享） |
| `SMS_WEBHOOK_URL` | 用于 Twilio 签名验证的公共 URL — 必须与 Twilio 控制台中的 webhook URL 匹配（必需） |
| `SMS_WEBHOOK_PORT` | 入站短信的 webhook 监听端口（默认：`8080`） |
| `SMS_WEBHOOK_HOST` | webhook 绑定地址（默认：`0.0.0.0`） |
| `SMS_INSECURE_NO_SIGNATURE` | 设为 `true` 以禁用 Twilio 签名验证（仅限本地开发 — 不用于生产） |
| `SMS_ALLOWED_USERS` | 允许聊天的 E.164 格式电话号码（逗号分隔） |
| `SMS_ALLOW_ALL_USERS` | 允许所有短信发送者而无需允许列表 |
| `SMS_HOME_CHANNEL` | 用于定时任务/通知投递的电话号码 |
| `SMS_HOME_CHANNEL_NAME` | SMS 主频道的显示名称 |
| `EMAIL_ADDRESS` | 电子邮件网关适配器的电子邮件地址 |
| `EMAIL_PASSWORD` | 电子邮件账户的密码或应用密码 |
| `EMAIL_IMAP_HOST` | 电子邮件适配器的 IMAP 主机名 |
| `EMAIL_IMAP_PORT` | IMAP 端口 |
| `EMAIL_SMTP_HOST` | 电子邮件适配器的 SMTP 主机名 |
| `EMAIL_SMTP_PORT` | SMTP 端口 |
| `EMAIL_ALLOWED_USERS` | 允许向机器人发消息的电子邮件地址（逗号分隔） |
| `EMAIL_HOME_ADDRESS` | 用于主动电子邮件投递的默认收件人 |
| `EMAIL_HOME_ADDRESS_NAME` | 电子邮件主目标的显示名称 |
| `EMAIL_POLL_INTERVAL` | 电子邮件轮询间隔（秒） |
| `EMAIL_ALLOW_ALL_USERS` | 允许所有入站电子邮件发送者 |
| `DINGTALK_CLIENT_ID` | 钉钉机器人 AppKey，来自开发者门户 ([open.dingtalk.com](https://open.dingtalk.com)) |
| `DINGTALK_CLIENT_SECRET` | 钉钉机器人 AppSecret，来自开发者门户 |
| `DINGTALK_ALLOWED_USERS` | 允许向机器人发消息的钉钉用户 ID（逗号分隔） |
| `FEISHU_APP_ID` | 飞书/Lark 机器人 App ID，来自 [open.feishu.cn](https://open.feishu.cn/) |
| `FEISHU_APP_SECRET` | 飞书/Lark 机器人 App Secret |
| `FEISHU_DOMAIN` | `feishu`（中国）或 `lark`（国际）。默认：`feishu` |
| `FEISHU_CONNECTION_MODE` | `websocket`（推荐）或 `webhook`。默认：`websocket` |
| `FEISHU_ENCRYPT_KEY` | webhook 模式的可选加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | webhook 模式的可选验证令牌 |
| `FEISHU_ALLOWED_USERS` | 允许向机器人发消息的飞书用户 ID（逗号分隔） |
| `FEISHU_ALLOW_BOTS` | `none`（默认）/ `mentions` / `all` — 接受来自其他机器人的入站消息。参见 [机器人间消息传递](../user-guide/messaging/feishu.md#bot-to-bot-messaging) |
| `FEISHU_REQUIRE_MENTION` | `true`（默认）/ `false` — 群组消息是否必须 @提及机器人。可通过 `group_rules.<chat_id>.require_mention` 按聊天覆盖。 |
| `FEISHU_HOME_CHANNEL` | 用于定时任务投递和通知的飞书聊天 ID |
| `WECOM_BOT_ID` | 企业微信 AI 机器人 ID，来自管理控制台 |
| `WECOM_SECRET` | 企业微信 AI 机器人密钥 |
| `WECOM_WEBSOCKET_URL` | 自定义 WebSocket URL（默认：`wss://openws.work.weixin.qq.com`） |
| `WECOM_ALLOWED_USERS` | 允许向机器人发消息的企业微信用户 ID（逗号分隔） |
| `WECOM_HOME_CHANNEL` | 用于定时任务投递和通知的企业微信聊天 ID |
| `WECOM_CALLBACK_CORP_ID` | 用于回调自建应用的企业微信企业 Corp ID |
| `WECOM_CALLBACK_CORP_SECRET` | 自建应用的 Corp 密钥 |
| `WECOM_CALLBACK_AGENT_ID` | 自建应用的 Agent ID |
| `WECOM_CALLBACK_TOKEN` | 回调验证令牌 |
| `WECOM_CALLBACK_ENCODING_AES_KEY` | 回调加密的 AES 密钥 |
| `WECOM_CALLBACK_HOST` | 回调服务器绑定地址（默认：`0.0.0.0`） |
| `WECOM_CALLBACK_PORT` | 回调服务器端口（默认：`8645`） |
| `WECOM_CALLBACK_ALLOWED_USERS` | 允许列表的用户 ID（逗号分隔） |
| `WECOM_CALLBACK_ALLOW_ALL_USERS` | 设为 `true` 以允许所有用户而无需允许列表 |
| `WEIXIN_ACCOUNT_ID` | 通过 iLink Bot API 扫码登录获得的微信账户 ID |
| `WEIXIN_TOKEN` | 通过 iLink Bot API 扫码登录获得的微信认证令牌 |
| `WEIXIN_BASE_URL` | 覆盖微信 iLink Bot API 基础 URL（默认：`https://ilinkai.weixin.qq.com`） |
| `WEIXIN_CDN_BASE_URL` | 覆盖用于媒体的微信 CDN 基础 URL（默认：`https://novac2c.cdn.weixin.qq.com/c2c`） |
| `WEIXIN_DM_POLICY` | 私信策略：`open`、`allowlist`、`pairing`、`disabled`（默认：`open`） |
| `WEIXIN_GROUP_POLICY` | 群组消息策略：`open`、`allowlist`、`disabled`（默认：`disabled`） |
| `WEIXIN_ALLOWED_USERS` | 允许私聊机器人的微信用户 ID（逗号分隔） |
| `WEIXIN_GROUP_ALLOWED_USERS` | 允许与机器人互动的微信**群聊 ID**（非成员用户 ID）（逗号分隔）。变量名是旧版遗留——它期望群组 ID。仅当 iLink 实际传递群组事件时生效；扫码登录的 iLink 机器人身份 (`...@im.bot`) 通常不接收普通微信群消息。 |
| `WEIXIN_HOME_CHANNEL` | 用于定时任务投递和通知的微信聊天 ID |
| `WEIXIN_HOME_CHANNEL_NAME` | 微信主频道的显示名称 |
| `WEIXIN_ALLOW_ALL_USERS` | 允许所有微信用户而无需允许列表（`true`/`false`） |
| `BLUEBUBBLES_SERVER_URL` | BlueBubbles 服务器 URL（例如 `http://192.168.1.10:1234`） |
| `BLUEBUBBLES_PASSWORD` | BlueBubbles 服务器密码 |
| `BLUEBUBBLES_WEBHOOK_HOST` | webhook 监听绑定地址（默认：`127.0.0.1`） |
| `BLUEBUBBLES_WEBHOOK_PORT` | webhook 监听端口（默认：`8645`） |
| `BLUEBUBBLES_HOME_CHANNEL` | 用于定时任务/通知投递的电话/邮箱 |
| `BLUEBUBBLES_ALLOWED_USERS` | 授权用户（逗号分隔） |
| `BLUEBUBBLES_ALLOW_ALL_USERS` | 允许所有用户（`true`/`false`） |
| `QQ_APP_ID` | QQ 机器人 App ID，来自 [q.qq.com](https://q.qq.com) |
| `QQ_CLIENT_SECRET` | QQ 机器人 App Secret，来自 [q.qq.com](https://q.qq.com) |
| `QQ_STT_API_KEY` | 外部 STT 回退提供商的 API 密钥（可选，当 QQ 内置 ASR 未返回文本时使用） |
| `QQ_STT_BASE_URL` | 外部 STT 提供商的基础 URL（可选） |
| `QQ_STT_MODEL` | 外部 STT 提供商的模型名称（可选） |
| `QQ_ALLOWED_USERS` | 允许向机器人发消息的 QQ 用户 openID（逗号分隔） |
| `QQ_GROUP_ALLOWED_USERS` | 用于群组 @消息访问的 QQ 群 ID（逗号分隔） |
| `QQ_ALLOW_ALL_USERS` | 允许所有用户（`true`/`false`，覆盖 `QQ_ALLOWED_USERS`） |
| `QQBOT_HOME_CHANNEL` | 用于定时任务投递和通知的 QQ 用户/群 openID |
| `QQBOT_HOME_CHANNEL_NAME` | QQ 主频道的显示名称 |
| `QQ_PORTAL_HOST` | 覆盖 QQ 门户主机（设为 `sandbox.q.qq.com` 以通过沙箱网关路由；默认：`q.qq.com`）。 |
| `MATTERMOST_URL` | Mattermost 服务器 URL（例如 `https://mm.example.com`） |
| `MATTERMOST_TOKEN` | Mattermost 的机器人令牌或个人访问令牌 |
| `MATTERMOST_ALLOWED_USERS` | 允许向机器人发消息的 Mattermost 用户 ID（逗号分隔） |
| `MATTERMOST_HOME_CHANNEL` | 用于主动消息投递（定时任务、通知）的频道 ID |
| `MATTERMOST_REQUIRE_MENTION` | 在频道中需要 `@提及`（默认：`true`）。设为 `false` 以响应所有消息。 |
| `MATTERMOST_FREE_RESPONSE_CHANNELS` | 机器人无需 `@提及` 即可响应的频道 ID（逗号分隔） |
| `MATTERMOST_REPLY_MODE` | 回复样式：`thread`（线程式回复）或 `off`（扁平消息，默认） |
| `MATRIX_HOMESERVER` | Matrix 家服务器 URL（例如 `https://matrix.org`） |
| `MATRIX_ACCESS_TOKEN` | 用于机器人认证的 Matrix 访问令牌 |
| `MATRIX_USER_ID` | Matrix 用户 ID（例如 `@hermes:matrix.org`）— 密码登录必需，使用访问令牌时可选 |
| `MATRIX_PASSWORD` | Matrix 密码（访问令牌的替代方案） |
| `MATRIX_ALLOWED_USERS` | 允许向机器人发消息的 Matrix 用户 ID（逗号分隔）（例如 `@alice:matrix.org`） |
| `MATRIX_HOME_ROOM` | 用于主动消息投递的房间 ID（例如 `!abc123:matrix.org`） |
| `MATRIX_ENCRYPTION` | 启用端到端加密（`true`/`false`，默认：`false`） |
| `MATRIX_DEVICE_ID` | 稳定的 Matrix 设备 ID，用于跨重启的 E2EE 持久化（例如 `HERMES_BOT`）。没有此项，E2EE 密钥会在每次启动时轮换，历史房间解密将失败。 |
| `MATRIX_REACTIONS` | 在入站消息上启用处理生命周期表情符号回应（默认：`true`）。设为 `false` 以禁用。 |
| `MATRIX_REQUIRE_MENTION` | 在房间中需要 `@提及`（默认：`true`）。设为 `false` 以响应所有消息。 |
| `MATRIX_FREE_RESPONSE_ROOMS` | 机器人无需 `@提及` 即可响应的房间 ID（逗号分隔） |
| `MATRIX_AUTO_THREAD` | 为房间消息自动创建线程（默认：`true`） |
| `MATRIX_DM_MENTION_THREADS` | 在私聊中当机器人被 `@提及` 时创建线程（默认：`false`） |
| `MATRIX_RECOVERY_KEY` | 设备密钥轮换后用于交叉签名验证的恢复密钥。建议用于启用了交叉签名的 E2EE 设置。 |
| `HASS_TOKEN` | Home Assistant 长期访问令牌（启用 HA 平台 + 工具） |
| `HASS_URL` | Home Assistant URL（默认：`http://homeassistant.local:8123`） |
| `WEBHOOK_ENABLED` | 启用 webhook 平台适配器（`true`/`false`） |
| `WEBHOOK_PORT` | 用于接收 webhooks 的 HTTP 服务器端口（默认：`8644`） |
| `WEBHOOK_SECRET` | 用于 webhook 签名验证的全局 HMAC 密钥（当路由未指定自己的密钥时作为回退使用） |
| `API_SERVER_ENABLED` | 启用 OpenAI 兼容的 API 服务器（`true`/`false`）。与其他平台并行运行。 |
| `API_SERVER_KEY` | 用于 API 服务器认证的 Bearer 令牌。当 API 服务器启用时必需。 |
| `API_SERVER_CORS_ORIGINS` | 允许直接调用 API 服务器的浏览器源（逗号分隔）（例如 `http://localhost:3000,http://127.0.0.1:3000`）。默认：禁用。 |
| `API_SERVER_PORT` | API 服务器的端口（默认：`8642`） |
| `API_SERVER_HOST` | API 服务器的主机/绑定地址（默认：`127.0.0.1`）。在回环地址上仍然需要 `API_SERVER_KEY`；为浏览器访问使用窄范围的 `API_SERVER_CORS_ORIGINS` 允许列表。 |
| `API_SERVER_MODEL_NAME` | 在 `/v1/models` 上公布的模型名称。默认为配置文件名称（或默认配置文件的 `hermes-agent`）。对于前端（如 Open WebUI）需要每个连接不同模型名称的多用户设置很有用。 |
| `GATEWAY_PROXY_URL` | 用于转发消息的远程 Hermes API 服务器的 URL（[代理模式](/user-guide/messaging/matrix#proxy-mode-e2ee-on-macos)）。设置后，网关仅处理平台 I/O — 所有智能体工作都委托给远程服务器。也可通过 `config.yaml` 中的 `gateway.proxy_url` 配置。 |
| `GATEWAY_PROXY_KEY` | 用于在代理模式下向远程 API 服务器认证的 Bearer 令牌。必须与远程主机上的 `API_SERVER_KEY` 匹配。 |
| `MESSAGING_CWD` | 消息传递模式下终端命令的工作目录（默认：`~`） |
| `GATEWAY_ALLOWED_USERS` | 跨所有平台允许的用户 ID（逗号分隔） |
| `GATEWAY_ALLOW_ALL_USERS` | 允许所有用户而无需允许列表（`true`/`false`，默认：`false`） |

### Microsoft Graph（Teams 会议）

用于即将到来的 Teams 会议摘要管线的 Microsoft Graph REST 客户端的应用程序凭据。参见 [注册 Microsoft Graph 应用程序](/guides/microsoft-graph-app-registration) 了解 Azure 门户操作步骤和所需的精确 API 权限。

| 变量 | 描述 |
|------|------|
| `MSGRAPH_TENANT_ID` | 用于 Graph 应用注册的 Azure AD 租户 ID（目录 GUID）。 |
| `MSGRAPH_CLIENT_ID` | Azure 应用注册的应用程序（客户端）ID。 |
| `MSGRAPH_CLIENT_SECRET` | 应用注册的客户端密钥值。存储在 `~/.hermes/.env` 中，权限设为 `chmod 600`；通过 Azure 门户定期轮换。 |
| `MSGRAPH_SCOPE` | 用于客户端凭据令牌请求的 OAuth2 范围（默认：`https://graph.microsoft.com/.default`）。 |
| `MSGRAPH_AUTHORITY_URL` | Microsoft 身份平台授权机构（默认：`https://login.microsoftonline.com`）。仅当使用国家/主权云时覆盖（例如 GCC High 使用 `https://login.microsoftonline.us`）。 |

### Microsoft Graph Webhook 监听器

用于 Graph 事件（Teams 会议、日历、聊天等）的入站更改通知监听器。参见 [Microsoft Graph Webhook 监听器](/user-guide/messaging/msgraph-webhook) 了解设置和安全加固。

| 变量 | 描述 |
|------|------|
| `MSGRAPH_WEBHOOK_ENABLED` | 启用 `msgraph_webhook` 网关平台（`true`/`1`/`yes`）。 |
| `MSGRAPH_WEBHOOK_PORT` | 监听器绑定的端口（默认：`8646`）。 |
| `MSGRAPH_WEBHOOK_CLIENT_STATE` | Graph 在每次通知中回传的共享密钥；使用 `hmac.compare_digest` 进行比较。使用 `openssl rand -hex 32` 生成。 |
| `MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES` | Graph 资源路径/模式的允许列表（逗号分隔）（例如 `communications/onlineMeetings,chats/*/messages`）。尾部 `*` 表示前缀匹配。空 = 接受所有。 |
| `MSGRAPH_WEBHOOK_ALLOWED_SOURCE_CIDRS` | 允许向监听器 POST 的 CIDR 范围（逗号分隔）（例如 `52.96.0.0/14,52.104.0.0/14`）。空 = 允许所有（默认）。在生产环境中，限制为 Microsoft Graph 公布的出口范围。 |

### Teams 会议摘要投递

仅在启用 [`teams_pipeline` 插件](/user-guide/messaging/msgraph-webhook) 时使用。设置也可在 `config.yaml` 的 `platforms.teams.extra` 下配置 — 当两者都设置时，环境变量优先。参见 [Microsoft Teams → 会议摘要投递](/user-guide/messaging/teams#meeting-summary-delivery-teams-meeting-pipeline)。

| 变量 | 描述 |
|------|------|
| `TEAMS_DELIVERY_MODE` | `graph` 或 `incoming_webhook`。 |
| `TEAMS_INCOMING_WEBHOOK_URL` | Teams 生成的 webhook URL；当 `TEAMS_DELIVERY_MODE=incoming_webhook` 时必需。 |
| `TEAMS_GRAPH_ACCESS_TOKEN` | 预先获取的用于 Graph 投递的委托访问令牌。很少需要 — 未设置时，写入程序会回退到 `MSGRAPH_*` 应用凭据。 |
| `TEAMS_TEAM_ID` | 用于频道投递的目标 Team ID（`graph` 模式）。 |
| `TEAMS_CHANNEL_ID` | 目标频道 ID（与 `TEAMS_TEAM_ID` 配对）。 |
| `TEAMS_CHAT_ID` | 目标 1:1 或群组聊天 ID（`graph` 模式下 team+channel 的替代方案）。 |

### LINE 消息 API

由内置的 LINE 平台插件 (`plugins/platforms/line/`) 使用。参见 [消息网关 → LINE](/user-guide/messaging/line) 了解完整设置。

| 变量 | 描述 |
|------|------|
| `LINE_CHANNEL_ACCESS_TOKEN` | 来自 LINE 开发者控制台（Messaging API 选项卡）的长期频道访问令牌。必需。 |
| `LINE_CHANNEL_SECRET` | 频道密钥（Basic settings 选项卡）；用于 HMAC-SHA256 webhook 签名验证。必需。 |
| `LINE_HOST` | Webhook 绑定主机（默认：`0.0.0.0`）。 |
| `LINE_PORT` | Webhook 绑定端口（默认：`8646`）。 |
| `LINE_PUBLIC_URL` | 公共 HTTPS 基础 URL（例如 `https://my-tunnel.example.com`）。发送图片/音频/视频必需 — LINE 仅接受 HTTPS 可达的 URL。 |
| `LINE_ALLOWED_USERS` | 允许私聊机器人的用户 ID（`U` 前缀）（逗号分隔）。 |
| `LINE_ALLOWED_GROUPS` | 机器人将响应的群组 ID（`C` 前缀）（逗号分隔）。 |
| `LINE_ALLOWED_ROOMS` | 机器人将响应的房间 ID（`R` 前缀）（逗号分隔）。 |
| `LINE_ALLOW_ALL_USERS` | 仅限开发的应急开关 — 接受任何来源。默认：`false`。 |
| `LINE_HOME_CHANNEL` | 带有 `deliver: line` 的定时任务的默认投递目标。 |
| `LINE_SLOW_RESPONSE_THRESHOLD` | 慢速 LLM 模板按钮回发触发前的秒数（默认：`45`）。设为 `0` 以禁用并始终使用 Push 回退。 |
| `LINE_PENDING_TEXT` | 与回发按钮一起显示的气泡文本。 |
| `LINE_BUTTON_LABEL` | 回发按钮标签（默认：`Get answer`）。 |
| `LINE_DELIVERED_TEXT` | 当已投递的回发被再次点击时的回复（默认：`Already replied ✅`）。 |
| `LINE_INTERRUPTED_TEXT` | 当被 `/stop` 中断的回发按钮被点击时的回复（默认：`Run was interrupted before completion.`）。 |

### ntfy（推送通知）

[ntfy](https://ntfy.sh/) 是一个轻量级的基于 HTTP 的推送通知服务。从 [ntfy 移动应用](https://ntfy.sh/docs/subscribe/phone/) 订阅一个主题，向该主题发布消息即可与智能体对话。

| 变量 | 描述 |
|------|------|
| `NTFY_TOPIC` | 订阅的主题（用于接收消息）。必需。 |
| `NTFY_SERVER_URL` | 服务器 URL（默认：`https://ntfy.sh`）。为保护隐私，指向自托管的 ntfy。 |
| `NTFY_TOKEN` | 可选的认证令牌。Bearer 令牌（例如 `tk_xyz`）或用于 Basic 认证的 `user:pass`。 |
| `NTFY_PUBLISH_TOPIC` | 用于发送回复的主题（默认为 `NTFY_TOPIC`）。 |
| `NTFY_MARKDOWN` | 设为 `true` 以在回复中添加 `X-Markdown: true` 头。默认：`false`。 |
| `NTFY_ALLOWED_USERS` | 允许列表（视为用户 ID；在 ntfy 上这些是主题名称）。通常设置为与 `NTFY_TOPIC` 相同的值。 |
| `NTFY_ALLOW_ALL_USERS` | 仅限开发的应急开关 — 仅在访问控制的私有主题上安全。默认：`false`。 |
| `NTFY_HOME_CHANNEL` | 带有 `deliver: ntfy` 的定时任务的默认投递目标。 |
| `NTFY_HOME_CHANNEL_NAME` | 主频道的可读标签（默认为主题名称）。 |

部署不受信任的主题前，请参阅 [ntfy 消息指南](/user-guide/messaging/ntfy) — 特别是**身份模型**部分。

### 高级消息调优

用于节流出站消息批处理器的高级每平台设置。大多数用户永远不需要接触这些；默认值设置为在不感觉迟钝的前提下尊重每个平台的速率限制。

| 变量 | 描述 |
|------|------|
| `HERMES_TELEGRAM_TEXT_BATCH_DELAY_SECONDS` | 刷新队列中的 Telegram 文本块前的宽限期（默认：`0.6`）。 |
| `HERMES_TELEGRAM_TEXT_BATCH_SPLIT_DELAY_SECONDS` | 当单条 Telegram 消息超过长度限制时，拆分块之间的延迟（默认：`2.0`）。 |
| `HERMES_TELEGRAM_MEDIA_BATCH_DELAY_SECONDS` | 刷新队列中的 Telegram 媒体前的宽限期（默认：`0.6`）。 |
| `HERMES_TELEGRAM_FOLLOWUP_GRACE_SECONDS` | 智能体完成后发送后续消息前的延迟，以避免与最后一个流块竞争。 |
| `HERMES_TELEGRAM_HTTP_CONNECT_TIMEOUT` / `_READ_TIMEOUT` / `_WRITE_TIMEOUT` / `_POOL_TIMEOUT` | 覆盖底层 `python-telegram-bot` 的 HTTP 超时（秒）。 |
| `HERMES_TELEGRAM_HTTP_POOL_SIZE` | 到 Telegram API 的最大并发 HTTP 连接数。 |
| `HERMES_TELEGRAM_DISABLE_FALLBACK_IPS` | 禁用当 DNS 失败时使用的硬编码 Cloudflare 回退 IP（`true`/`false`）。 |
| `HERMES_DISCORD_TEXT_BATCH_DELAY_SECONDS` | 刷新队列中的 Discord 文本块前的宽限期（默认：`0.6`）。 |
| `HERMES_DISCORD_TEXT_BATCH_SPLIT_DELAY_SECONDS` | 当 Discord 消息超过长度限制时，拆分块之间的延迟（默认：`2.0`）。 |
| `HERMES_MATRIX_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` | Matrix 的 Telegram 批处理设置等效项。 |
| `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` / `_MAX_CHARS` / `_MAX_MESSAGES` | 飞书批处理器调优 — 延迟、拆分延迟、每条消息最大字符数、每批最大消息数。 |
| `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 飞书媒体刷新延迟。 |
| `HERMES_FEISHU_DEDUP_CACHE_SIZE` | 飞书 webhook 去重缓存大小（默认：`1024`）。 |
| `HERMES_WECOM_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` | 企业微信批处理器调优。 |
| `HERMES_VISION_DOWNLOAD_TIMEOUT` | 在交给视觉模型前下载图像的超时秒数（默认：`30`）。 |
| `HERMES_RESTART_DRAIN_TIMEOUT` | 网关：在强制重启前等待活动运行排空的秒数（默认：`900`）。 |
| `HERMES_GATEWAY_PLATFORM_CONNECT_TIMEOUT` | 网关启动期间每平台连接超时（秒）。 |
| `HERMES_GATEWAY_BUSY_INPUT_MODE` | 默认网关忙时输入行为：`queue`、`steer` 或 `interrupt`。可通过 `/busy` 按聊天覆盖。 |
| `HERMES_GATEWAY_BUSY_ACK_ENABLED` | 当用户在智能体忙时发送输入，网关是否发送确认消息（⚡/⏳/⏩）（默认：`true`）。设为 `false` 以完全抑制这些消息 — 输入仍照常排队/引导/中断，仅聊天回复被静音。从 `config.yaml` 中的 `display.busy_ack_enabled` 桥接而来。 |
| `HERMES_GATEWAY_NO_SUPERVISE` | 在 s6-overlay Docker 镜像内，运行 `hermes gateway run` 时选择退出自动监督，并使用 pre-s6 前台语义（无自动重启，网关是容器的主进程）。真值：`1`、`true`、`yes`。等同于 `--no-supervise` CLI 标志。在 s6 镜像外无效。 |
| `HERMES_FILE_MUTATION_VERIFIER` | 启用每轮次文件变更验证器页脚（默认：`true`）。启用后，Hermes 会附加一份建议列表，列出本轮次期间失败且未被成功写入覆盖的任何 `write_file` / `patch` 调用。设为 `0`、`false`、`no` 或 `off` 以抑制。镜像 `config.yaml` 中的 `display.file_mutation_verifier`；设置时环境变量优先。 |
| `HERMES_CRON_TIMEOUT` | 定时任务智能体运行的不活动超时秒数（默认：`600`）。智能体在主动调用工具或接收流令牌时可以无限期运行 — 此设置仅在空闲时触发。设为 `0` 表示无限制。 |
| `HERMES_CRON_SCRIPT_TIMEOUT` | 附加到定时任务的预运行脚本超时秒数（默认：`120`）。为需要更长执行时间的脚本覆盖（例如，用于反机器人计时的随机延迟）。也可通过 `config.yaml` 中的 `cron.script_timeout_seconds` 配置。 |
| `HERMES_CRON_MAX_PARALLEL` | 每个 tick 最大并行运行的定时任务数（默认：`4`）。 |

## 智能体行为

| 变量 | 描述 |
|----------|-------------|
| `HERMES_MAX_ITERATIONS` | 每次对话的最大工具调用迭代次数（默认值：90） |
| `HERMES_INFERENCE_MODEL` | 在进程级别覆盖模型名称（会话中优先于 `config.yaml` 的设置）。也可通过 `-m`/`--model` 标志设置。 |
| `HERMES_YOLO_MODE` | 设置为 `1` 可跳过危险命令的批准提示。等同于 `--yolo`。 |
| `HERMES_ACCEPT_HOOKS` | 自动批准在 `config.yaml` 中声明的、任何未见过的 shell 钩子，无需 TTY 提示。等同于 `--accept-hooks` 或 `hooks_auto_accept: true`。 |
| `HERMES_IGNORE_USER_CONFIG` | 跳过 `~/.hermes/config.yaml` 并使用内置默认值（`.env` 中的凭据仍会加载）。等同于 `--ignore-user-config`。 |
| `HERMES_IGNORE_RULES` | 跳过自动注入 `AGENTS.md`、`SOUL.md`、`.cursorrules`、记忆和预加载技能。等同于 `--ignore-rules`。 |
| `HERMES_MD_NAMES` | 逗号分隔的规则文件名列表，用于自动注入（默认值：`AGENTS.md,CLAUDE.md,.cursorrules,SOUL.md`）。 |
| `HERMES_TOOL_PROGRESS` | 已弃用的工具进度显示兼容变量。推荐在 `config.yaml` 中使用 `display.tool_progress`。 |
| `HERMES_TOOL_PROGRESS_MODE` | 已弃用的工具进度模式兼容变量。推荐在 `config.yaml` 中使用 `display.tool_progress`。 |
| `HERMES_HUMAN_DELAY_MODE` | 响应节奏控制：`off`/`natural`/`custom` |
| `HERMES_HUMAN_DELAY_MIN_MS` | 自定义延迟范围最小值（毫秒） |
| `HERMES_HUMAN_DELAY_MAX_MS` | 自定义延迟范围最大值（毫秒） |
| `HERMES_QUIET` | 抑制非必要输出（`true`/`false`） |
| `CODEX_HOME` | 当 [Codex 应用服务器运行时](../user-guide/features/codex-app-server-runtime) 启用时，覆盖 Codex CLI 读取其配置和认证信息的目录（默认值：`~/.codex`）。Hermes 的迁移会将托管区块写入 `<CODEX_HOME>/config.toml`。 |
| `HERMES_KANBAN_TASK` | 由看板调度器在生成工作进程时设置（任务 UUID）。工作进程和生成的 `hermes-tools` MCP 子进程会继承此变量，以便看板工具正确进行门控。请勿手动设置。 |
| `HERMES_API_TIMEOUT` | LLM API 调用超时时间（秒）（默认值：`1800`） |
| `HERMES_API_CALL_STALE_TIMEOUT` | 非流式陈旧调用超时时间（秒）（默认值：`300`）。对于本地提供程序，未设置时自动禁用。也可通过 `config.yaml` 中的 `providers.<id>.stale_timeout_seconds` 或 `providers.<id>.models.<model>.stale_timeout_seconds` 进行配置。 |
| `HERMES_STREAM_READ_TIMEOUT` | 流式套接字读取超时时间（秒）（默认值：`120`）。对于本地提供程序，会自动增加到 `HERMES_API_TIMEOUT`。如果本地 LLM 在长代码生成期间超时，可增加此值。 |
| `HERMES_STREAM_STALE_TIMEOUT` | 陈旧流检测超时时间（秒）（默认值：`180`）。对于本地提供程序自动禁用。如果在此时间窗口内没有收到数据块，将触发连接中断。 |
| `HERMES_STREAM_RETRIES` | 针对瞬态网络错误的中流重连尝试次数（默认值：`3`）。 |
| `HERMES_AGENT_TIMEOUT` | 运行中智能体的网关不活动超时时间（秒）（默认值：`900`）。在每次工具调用和流式传输令牌时重置。设置为 `0` 以禁用。 |
| `HERMES_AGENT_TIMEOUT_WARNING` | 网关：在不活动达到此秒数后发送警告消息（默认值：`HERMES_AGENT_TIMEOUT` 的 75%）。 |
| `HERMES_AGENT_NOTIFY_INTERVAL` | 网关：长时间运行的智能体回合中，进度通知之间的间隔（秒）。 |
| `HERMES_CHECKPOINT_TIMEOUT` | 文件系统检查点创建超时时间（秒）（默认值：`30`）。 |
| `HERMES_EXEC_ASK` | 在网关模式下启用执行批准提示（`true`/`false`） |
| `HERMES_ENABLE_PROJECT_PLUGINS` | 启用从 `./.hermes/plugins/` 自动发现仓库本地插件，适用于智能体加载器和仪表板 Web 服务器。接受标准的真值集合：`1` / `true` / `yes` / `on`（不区分大小写）。其他所有值——包括 `0`、`false`、`no`、`off` 和空字符串——都被视为**已禁用**（默认）。注意：自 GHSA-5qr3-c538-wm9j (#29156) 起，即使此变量启用，仪表板 Web 服务器也拒绝自动导入项目插件的 Python `api` 文件——项目插件可通过静态 JS/CSS 扩展 UI，但其后端路由仅在移动到 `~/.hermes/plugins/` 下时才会加载。 |
| `HERMES_PLUGINS_DEBUG` | `1`/`true` 以在 stderr 上显示详细的插件发现日志——扫描的目录、解析的清单、跳过原因，以及解析或 `register()` 失败时的完整回溯。面向插件开发者。 |
| `HERMES_BACKGROUND_NOTIFICATIONS` | 网关中后台进程的通知模式：`all`（默认），`result`，`error`，`off` |
| `HERMES_EPHEMERAL_SYSTEM_PROMPT` | 在 API 调用时注入的临时系统提示（永不持久化到会话中） |
| `HERMES_PREFILL_MESSAGES_FILE` | 指向 JSON 文件的路径，该文件包含在 API 调用时注入的临时预填充消息。 |
| `HERMES_ALLOW_PRIVATE_URLS` | `true`/`false` — 允许工具获取 localhost/私有网络 URL。在网关模式下默认关闭。 |
| `HERMES_REDACT_SECRETS` | `true`/`false` — 控制工具输出、日志和聊天响应中的机密信息脱敏（默认值：`true`）。 |
| `HERMES_WRITE_SAFE_ROOT` | 可选的目录前缀，用于限制 `write_file`/`patch` 的写入；外部路径需要批准。 |
| `HERMES_DISABLE_FILE_STATE_GUARD` | 设置为 `1` 以关闭 `patch`/`write_file` 上的“自您读取后文件已更改”保护。 |
| `HERMES_CORE_TOOLS` | 逗号分隔的规范核心工具列表覆盖（高级；很少需要）。 |
| `HERMES_BUNDLED_SKILLS` | 逗号分隔的启动时加载的捆绑技能列表覆盖。 |
| `HERMES_OPTIONAL_SKILLS` | 逗号分隔的可选技能名称列表，用于首次运行时自动安装。 |
| `HERMES_DEBUG_INTERRUPT` | 设置为 `1` 以将详细的中断/取消跟踪记录到 `agent.log`。 |
| `HERMES_DUMP_REQUESTS` | 将 API 请求负载转储到日志文件（`true`/`false`） |
| `HERMES_DUMP_REQUEST_STDOUT` | 将 API 请求负载转储到 stdout 而不是日志文件。 |
| `HERMES_OAUTH_TRACE` | 设置为 `1` 以记录 OAuth 令牌交换和刷新尝试。包含脱敏的时序信息。 |
| `HERMES_OAUTH_FILE` | 覆盖用于 OAuth 凭据存储的路径（默认值：`~/.hermes/auth.json`）。 |
| `HERMES_AGENT_HELP_GUIDANCE` | 向自定义部署的系统提示追加额外的指导文本。 |
| `HERMES_AGENT_LOGO` | 覆盖 CLI 启动时的 ASCII 横幅标志。 |
| `DELEGATION_MAX_CONCURRENT_CHILDREN` | 每个 `delegate_task` 批次的最大并行子智能体数量（默认值：`3`，下限为 1，无上限）。也可通过 `config.yaml` 中的 `delegation.max_concurrent_children` 进行配置——配置值优先。 |

## 接口

| 变量 | 描述 |
|------|------|
| `HERMES_TUI` | 设置为 `1` 时，启动 [TUI](../user-guide/tui.md) 而非经典命令行界面。等同于传递 `--tui` 参数。 |
| `HERMES_TUI_DIR` | 指向预构建的 `ui-tui/` 目录（必须包含 `dist/entry.js` 和已填充的 `node_modules`）。供发行版和 Nix 使用，以跳过首次启动时的 `npm install`。 |
| `HERMES_TUI_RESUME` | 启动时通过 ID 恢复特定的 TUI 会话。设置后，`hermes --tui` 将跳过创建新会话，转而加载指定的命名会话——适用于在断开连接或终端崩溃后重新连接。 |
| `HERMES_TUI_THEME` | 强制使用 TUI 颜色主题：`light`、`dark` 或原始的 6 位背景十六进制码（例如 `ffffff` 或 `1a1a2e`）。未设置时，Hermes 会利用 `COLORFGBG` 和终端背景查询自动检测；对于不设置 `COLORFGBG` 的终端（如 Ghostty、Warp、iTerm2 等），此变量可覆盖检测结果。 |
| `HERMES_INFERENCE_MODEL` | 强制为 `hermes -z` / `hermes chat` 指定模型，而不修改 `config.yaml`。与 `--provider` 标志配合使用。适用于需要在每次运行时覆盖默认模型的脚本调用方（如清理程序、CI、批量执行器）。 |

## 会话设置

| 变量 | 描述 |
|------|------|
| `SESSION_IDLE_MINUTES` | 闲置 N 分钟后重置会话（默认值：1440） |
| `SESSION_RESET_HOUR` | 每日重置的小时（24 小时制，默认值：4 = 凌晨 4 点） |
| `HERMES_SESSION_ID` | **Hermes 生成的每个工具子进程都会自动导出此变量**（包括 `terminal`、`execute_code`、持久化 Shell、Docker/Singularity 后端以及委托的子智能体运行）。由智能体设置为当前会话 ID；从工具调用的用户脚本可以读取它，以将其输出、遥测数据或副作用与发起的 Hermes 会话关联起来。**您不应手动设置此变量**——从父 Shell 覆盖它仅在智能体运行外部生效，并在智能体启动会话时被覆盖。 |

## 上下文压缩（仅限 config.yaml）

上下文压缩仅通过 `config.yaml` 进行配置——没有对应的环境变量。阈值设置位于 `compression:` 块中，而摘要模型/提供商则位于 `auxiliary.compression:` 下。

```yaml
compression:
  enabled: true
  threshold: 0.50
  target_ratio: 0.20         # 作为近期尾部保留的阈值比例
  protect_last_n: 20         # 保持未压缩的最小近期消息数
```

:::info 旧版迁移
包含 `compression.summary_model`、`compression.summary_provider` 和 `compression.summary_base_url` 的旧版配置，在首次加载时会自动迁移到 `auxiliary.compression.*`。
:::

## 辅助任务覆盖

| 变量 | 描述 |
|------|------|
| `AUXILIARY_VISION_PROVIDER` | 覆盖视觉任务的提供商 |
| `AUXILIARY_VISION_MODEL` | 覆盖视觉任务的模型 |
| `AUXILIARY_VISION_BASE_URL` | 视觉任务的直接 OpenAI 兼容端点 |
| `AUXILIARY_VISION_API_KEY` | 与 `AUXILIARY_VISION_BASE_URL` 配对的 API 密钥 |
| `AUXILIARY_WEB_EXTRACT_PROVIDER` | 覆盖网页提取/摘要的提供商 |
| `AUXILIARY_WEB_EXTRACT_MODEL` | 覆盖网页提取/摘要的模型 |
| `AUXILIARY_WEB_EXTRACT_BASE_URL` | 网页提取/摘要的直接 OpenAI 兼容端点 |
| `AUXILIARY_WEB_EXTRACT_API_KEY` | 与 `AUXILIARY_WEB_EXTRACT_BASE_URL` 配对的 API 密钥 |

对于特定任务的直接端点，Hermes 使用任务配置的 API 密钥或 `OPENAI_API_KEY`。它不会为这些自定义端点复用 `OPENROUTER_API_KEY`。

## 回退提供商（仅限 config.yaml）

主要模型的回退链仅通过 `config.yaml` 进行配置——没有对应的环境变量。添加一个包含 `provider` 和 `model` 键的顶层 `fallback_providers` 列表，以在主模型遇到错误时启用自动故障转移。

```yaml
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
```

旧版的单提供者 `fallback_model` 顶层格式仍为向后兼容而保留，但新配置应使用 `fallback_providers`。

详见 [回退提供商](/user-guide/features/fallback-providers)。

## 提供商路由（仅限 config.yaml）

这些设置位于 `~/.hermes/config.yaml` 的 `provider_routing` 部分下：

| 键 | 描述 |
|----|------|
| `sort` | 排序提供商：`"price"`（默认）、`"throughput"` 或 `"latency"` |
| `only` | 允许的提供商 slug 列表（例如 `["anthropic", "google"]`） |
| `ignore` | 要跳过的提供商 slug 列表 |
| `order` | 按顺序尝试的提供商 slug 列表 |
| `require_parameters` | 仅使用支持所有请求参数的提供商（`true`/`false`） |
| `data_collection` | `"allow"`（默认）或 `"deny"` 以排除存储数据的提供商 |

:::tip
使用 `hermes config set` 来设置环境变量——它会自动将它们保存到正确的文件（敏感信息存入 `.env`，其他所有配置存入 `config.yaml`）。
:::