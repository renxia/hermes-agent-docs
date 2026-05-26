---
sidebar_position: 2
title: "环境变量"
description: "Hermes 智能体使用的所有环境变量完整参考"
---

# 环境变量参考

所有变量均放置于 `~/.hermes/.env` 文件中。您也可以通过 `hermes config set VAR value` 命令进行设置。

## LLM 提供商

| 变量 | 描述 |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API 密钥（推荐，因其灵活性） |
| `OPENROUTER_BASE_URL` | 覆盖 OpenRouter 兼容的 base URL |
| `HERMES_OPENROUTER_CACHE` | 启用 OpenRouter 响应缓存 (`1`/`true`/`yes`/`on`)。覆盖 config.yaml 中的 `openrouter.response_cache`。参见 [响应缓存](https://openrouter.ai/docs/guides/features/response-caching)。 |
| `HERMES_OPENROUTER_CACHE_TTL` | 缓存 TTL，单位为秒 (1-86400)。覆盖 config.yaml 中的 `openrouter.response_cache_ttl`。 |
| `NOUS_BASE_URL` | 覆盖 Nous Portal base URL（通常不需要；仅用于开发/测试） |
| `NOUS_INFERENCE_BASE_URL` | 直接覆盖 Nous 推理端点 |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway API 密钥 ([ai-gateway.vercel.sh](https://ai-gateway.vercel.sh)) |
| `AI_GATEWAY_BASE_URL` | 覆盖 AI Gateway base URL（默认：`https://ai-gateway.vercel.sh/v1`） |
| `OPENAI_API_KEY` | 自定义 OpenAI 兼容端点的 API 密钥（与 `OPENAI_BASE_URL` 配合使用） |
| `OPENAI_BASE_URL` | 自定义端点的 base URL（VLLM、SGLang 等） |
| `COPILOT_GITHUB_TOKEN` | 用于 Copilot API 的 GitHub 令牌 — 优先级最高（OAuth `gho_*` 或细粒度 PAT `github_pat_*`；**不支持** 经典 PAT `ghp_*`） |
| `GH_TOKEN` | GitHub 令牌 — Copilot 的第二优先级（也被 `gh` CLI 使用） |
| `GITHUB_TOKEN` | GitHub 令牌 — Copilot 的第三优先级 |
| `HERMES_COPILOT_ACP_COMMAND` | 覆盖 Copilot ACP CLI 二进制文件路径（默认：`copilot`） |
| `COPILOT_CLI_PATH` | `HERMES_COPILOT_ACP_COMMAND` 的别名 |
| `HERMES_COPILOT_ACP_ARGS` | 覆盖 Copilot ACP 参数（默认：`--acp --stdio`） |
| `COPILOT_ACP_BASE_URL` | 覆盖 Copilot ACP base URL |
| `GLM_API_KEY` | z.ai / ZhipuAI GLM API 密钥 ([z.ai](https://z.ai)) |
| `ZAI_API_KEY` | `GLM_API_KEY` 的别名 |
| `Z_AI_API_KEY` | `GLM_API_KEY` 的别名 |
| `GLM_BASE_URL` | 覆盖 z.ai base URL（默认：`https://api.z.ai/api/paas/v4`） |
| `KIMI_API_KEY` | Kimi / Moonshot AI API 密钥 ([moonshot.ai](https://platform.moonshot.ai)) |
| `KIMI_BASE_URL` | 覆盖 Kimi base URL（默认：`https://api.moonshot.ai/v1`） |
| `KIMI_CN_API_KEY` | Kimi / Moonshot 中国 API 密钥 ([moonshot.cn](https://platform.moonshot.cn)) |
| `ARCEEAI_API_KEY` | Arcee AI API 密钥 ([chat.arcee.ai](https://chat.arcee.ai/)) |
| `ARCEE_BASE_URL` | 覆盖 Arcee base URL（默认：`https://api.arcee.ai/api/v1`） |
| `GMI_API_KEY` | GMI Cloud API 密钥 ([gmicloud.ai](https://www.gmicloud.ai/)) |
| `GMI_BASE_URL` | 覆盖 GMI Cloud base URL（默认：`https://api.gmi-serving.com/v1`） |
| `MINIMAX_API_KEY` | MiniMax API 密钥 — 全球端点 ([minimax.io](https://www.minimax.io))。**不被 `minimax-oauth` 使用**（OAuth 路径改用浏览器登录）。 |
| `MINIMAX_BASE_URL` | 覆盖 MiniMax base URL（默认：`https://api.minimax.io/anthropic` — Hermes 使用 MiniMax 的 Anthropic Messages 兼容端点）。**不被 `minimax-oauth` 使用**。 |
| `MINIMAX_CN_API_KEY` | MiniMax API 密钥 — 中国端点 ([minimaxi.com](https://www.minimaxi.com))。**不被 `minimax-oauth` 使用**（OAuth 路径改用浏览器登录）。 |
| `MINIMAX_CN_BASE_URL` | 覆盖 MiniMax 中国 base URL（默认：`https://api.minimaxi.com/anthropic`）。**不被 `minimax-oauth` 使用**。 |
| `KILOCODE_API_KEY` | Kilo Code API 密钥 ([kilo.ai](https://kilo.ai)) |
| `KILOCODE_BASE_URL` | 覆盖 Kilo Code base URL（默认：`https://api.kilo.ai/api/gateway`） |
| `XIAOMI_API_KEY` | 小米 MiMo API 密钥 ([platform.xiaomimimo.com](https://platform.xiaomimimo.com)) |
| `XIAOMI_BASE_URL` | 覆盖小米 MiMo base URL（默认：`https://api.xiaomimimo.com/v1`） |
| `TOKENHUB_API_KEY` | 腾讯 TokenHub API 密钥 ([tokenhub.tencentmaas.com](https://tokenhub.tencentmaas.com)) |
| `TOKENHUB_BASE_URL` | 覆盖腾讯 TokenHub base URL（默认：`https://tokenhub.tencentmaas.com/v1`） |
| `AZURE_FOUNDRY_API_KEY` | 微软 Foundry / Azure OpenAI API 密钥 ([ai.azure.com](https://ai.azure.com/))。当 `model.auth_mode: entra_id` 时无需设置 |
| `AZURE_FOUNDRY_BASE_URL` | 微软 Foundry 端点 URL（例如，OpenAI 风格为 `https://&lt;resource&gt;.openai.azure.com/openai/v1`，或 Anthropic 风格为 `https://&lt;resource&gt;.services.ai.azure.com/anthropic`） |
| `AZURE_ANTHROPIC_KEY` | 用于 `provider: anthropic` + 指向微软 Foundry Claude 部署的 `base_url` 的 Azure Anthropic API 密钥（当同时配置了 Anthropic 和 Azure Anthropic 时，替代 `ANTHROPIC_API_KEY`） |
| `AZURE_TENANT_ID` | Entra ID 租户 ID（服务主体流程；当 `model.auth_mode: entra_id` 时被 `azure-identity` 使用） |
| `AZURE_CLIENT_ID` | Entra ID 客户端 ID（服务主体、工作负载标识或用户分配的托管标识） |
| `AZURE_CLIENT_SECRET` | `EnvironmentCredential` 使用的服务主体密钥 |
| `AZURE_CLIENT_CERTIFICATE_PATH` | 服务主体证书（替代 `AZURE_CLIENT_SECRET`） |
| `AZURE_FEDERATED_TOKEN_FILE` | 用于 AKS 工作负载标识 / OIDC 流程的联合令牌文件路径 |
| `AZURE_AUTHORITY_HOST` | 主权云权威机构覆盖（例如，Azure Government 使用 `https://login.microsoftonline.us`）。参见 [Azure Foundry 指南](/guides/azure-foundry#sovereign-clouds-government-china) |
| `IDENTITY_ENDPOINT` / `MSI_ENDPOINT` | 用于应用服务、函数和容器应用的托管标识端点；虚拟机通常改用 IMDS，不设置这些 |
| `HF_TOKEN` | Hugging Face 令牌，用于推理提供商 ([huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)) |
| `HF_BASE_URL` | 覆盖 Hugging Face base URL（默认：`https://router.huggingface.co/v1`） |
| `GOOGLE_API_KEY` | Google AI Studio API 密钥 ([aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)) |
| `GEMINI_API_KEY` | `GOOGLE_API_KEY` 的别名 |
| `GEMINI_BASE_URL` | 覆盖 Google AI Studio base URL |
| `HERMES_GEMINI_CLIENT_ID` | 用于 `google-gemini-cli` PKCE 登录的 OAuth 客户端 ID（可选；默认使用 Google 公共 gemini-cli 客户端） |
| `HERMES_GEMINI_CLIENT_SECRET` | 用于 `google-gemini-cli` 的 OAuth 客户端密钥（可选） |
| `HERMES_GEMINI_PROJECT_ID` | 用于付费 Gemini 层的 GCP 项目 ID（免费层自动配置） |
| `ANTHROPIC_API_KEY` | Anthropic 控制台 API 密钥 ([console.anthropic.com](https://console.anthropic.com/)) |
| `ANTHROPIC_TOKEN` | 手动或旧式 Anthropic OAuth/设置令牌覆盖 |
| `DASHSCOPE_API_KEY` | 通义千问云（阿里 DashScope）API 密钥，用于通义千问模型 ([modelstudio.console.alibabacloud.com](https://modelstudio.console.alibabacloud.com/)) |
| `DASHSCOPE_BASE_URL` | 自定义 DashScope base URL（默认：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`；中国大陆区域使用 `https://dashscope.aliyuncs.com/compatible-mode/v1`） |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥，用于直接访问 DeepSeek ([platform.deepseek.com](https://platform.deepseek.com/api_keys)) |
| `DEEPSEEK_BASE_URL` | 自定义 DeepSeek API base URL |
| `NOVITA_API_KEY` | NovitaAI API 密钥 — AI 原生云，提供模型 API、智能体沙盒和 GPU 云 ([novita.ai/settings/key-management](https://novita.ai/settings/key-management)) |
| `NOVITA_BASE_URL` | 覆盖 NovitaAI base URL（默认：`https://api.novita.ai/openai/v1`） |
| `NVIDIA_API_KEY` | NVIDIA NIM API 密钥 — Nemotron 和开放模型 ([build.nvidia.com](https://build.nvidia.com)) |
| `NVIDIA_BASE_URL` | 覆盖 NVIDIA base URL（默认：`https://integrate.api.nvidia.com/v1`；本地 NIM 端点设为 `http://localhost:8000/v1`） |
| `STEPFUN_API_KEY` | 阶跃星辰 API 密钥 — 阶跃系列模型 ([platform.stepfun.com](https://platform.stepfun.com)) |
| `STEPFUN_BASE_URL` | 覆盖阶跃星辰 base URL（默认：`https://api.stepfun.com/v1`） |
| `OLLAMA_API_KEY` | Ollama Cloud API 密钥 — 托管的 Ollama 目录，无需本地 GPU ([ollama.com/settings/keys](https://ollama.com/settings/keys)) |
| `OLLAMA_BASE_URL` | 覆盖 Ollama Cloud base URL（默认：`https://ollama.com/v1`） |
| `XAI_API_KEY` | xAI (Grok) API 密钥，用于聊天 + TTS + 网页搜索 ([console.x.ai](https://console.x.ai/)) |
| `XAI_BASE_URL` | 覆盖 xAI base URL（默认：`https://api.x.ai/v1`） |
| `MISTRAL_API_KEY` | Mistral API 密钥，用于 Voxtral TTS 和 Voxtral STT ([console.mistral.ai](https://console.mistral.ai)) |
| `AWS_REGION` | 用于 Bedrock 推理的 AWS 区域（例如 `us-east-1`、`eu-central-1`）。由 boto3 读取。 |
| `AWS_PROFILE` | 用于 Bedrock 认证的 AWS 命名配置文件（读取 `~/.aws/credentials`）。不设置则使用默认的 boto3 凭证链。 |
| `BEDROCK_BASE_URL` | 覆盖 Bedrock 运行时 base URL（默认：`https://bedrock-runtime.us-east-1.amazonaws.com`；通常不设置，改用 `AWS_REGION`） |
| `HERMES_QWEN_BASE_URL` | 通义千问门户 base URL 覆盖（默认：`https://portal.qwen.ai/v1`） |
| `OPENCODE_ZEN_API_KEY` | OpenCode Zen API 密钥 — 按需访问精选模型 ([opencode.ai](https://opencode.ai/auth)) |
| `OPENCODE_ZEN_BASE_URL` | 覆盖 OpenCode Zen base URL |
| `OPENCODE_GO_API_KEY` | OpenCode Go API 密钥 — 每月 $10 订阅开放模型 ([opencode.ai](https://opencode.ai/auth)) |
| `OPENCODE_GO_BASE_URL` | 覆盖 OpenCode Go base URL |
| `CLAUDE_CODE_OAUTH_TOKEN` | 如果手动导出了 Claude Code 令牌，可在此显式覆盖 |
| `HERMES_MODEL` | 在进程级别覆盖模型名称（用于 cron 调度器；常规使用推荐 `config.yaml`） |
| `VOICE_TOOLS_OPENAI_KEY` | 首选的 OpenAI 密钥，用于 OpenAI 语音转文本和文本转语音提供商 |
| `HERMES_LOCAL_STT_COMMAND` | 可选的本地语音转文本命令模板。支持 `{input_path}`、`{output_dir}`、`{language}` 和 `{model}` 占位符 |
| `HERMES_LOCAL_STT_LANGUAGE` | 传递给 `HERMES_LOCAL_STT_COMMAND` 或自动检测的本地 `whisper` CLI 回退的默认语言（默认：`en`） |
| `HERMES_HOME` | 覆盖 Hermes 配置目录（默认：`~/.hermes`）。同时限定网关 PID 文件和 systemd 服务名称的作用域，因此可以并发运行多个安装实例 |
| `HERMES_GIT_BASH_PATH` | **仅限 Windows。** 覆盖终端工具的 `bash.exe` 发现路径。可指向任何 bash — 完整的 Git for Windows 安装、通过符号链接的 WSL bash、MSYS2、Cygwin。安装程序会自动将其设置为已配置的 PortableGit。参见 [Windows（原生）指南](../user-guide/windows-native.md#how-hermes-runs-shell-commands-on-windows) |
| `HERMES_DISABLE_WINDOWS_UTF8` | **仅限 Windows。** 设置为 `1` 可禁用 UTF-8 stdio 垫片（`configure_windows_stdio()`），并回退到控制台的区域设置代码页。用于定位编码错误；在正常操作中很少需要此设置 |
| `HERMES_KANBAN_HOME` | 覆盖锚定看板（数据库 + 工作区 + worker 日志）的共享 Hermes 根目录。回退到 `get_default_hermes_root()`（任何活动配置文件的父目录）。适用于测试和非常规部署 |
| `HERMES_KANBAN_BOARD` | 为此进程固定活动看板。优先于 `~/.hermes/kanban/current`；调度器会将其注入到 worker 子进程环境中，因此 worker 物理上无法看到其他看板的任务。默认为 `default`。slug 验证：小写字母数字 + 连字符 + 下划线，1-64 字符 |
| `HERMES_KANBAN_DB` | 直接固定看板数据库文件路径（优先级最高；覆盖 `HERMES_KANBAN_BOARD` 和 `HERMES_KANBAN_HOME`）。调度器会将其注入到 worker 子进程环境中，因此配置文件 worker 会汇聚到调度器的看板上 |
| `HERMES_KANBAN_WORKSPACES_ROOT` | 直接固定看板工作区根目录（工作区的最高优先级；覆盖 `HERMES_KANBAN_HOME`）。调度器会将其注入到 worker 子进程环境中 |
| `HERMES_KANBAN_DISPATCH_IN_GATEWAY` | `kanban.dispatch_in_gateway` 的运行时覆盖。设置为 `0`、`false`、`no` 或 `off` 可阻止网关启动内嵌的看板调度器；任何其他非空值则启用它。当单独的调度器进程拥有看板时很有用。 |

## 提供商认证 (OAuth)

对于原生 Anthropic 认证，当 Hermes 存在 Claude Code 自己的凭证文件时，它会优先使用这些凭证，因为这些凭证可以自动刷新。**针对 Anthropic 的 OAuth 需要购买了额外使用额度的 Claude Max 计划** —— Hermes 以 Claude Code 的身份进行路由，它仅从 Max 计划的额外/超额额度中提取，而不是从基础的 Max 配额中提取，并且在 Claude Pro 上不适用。如果没有 Max + 额外额度，请改用 API 密钥。像 `ANTHROPIC_TOKEN` 这样的环境变量仍然可以作为手动覆盖手段，但它们不再是 Claude Max 登录的首选路径。

| 变量 | 描述 |
|----------|-------------|
| `HERMES_PORTAL_BASE_URL` | 覆盖 Nous Portal URL (用于开发/测试) |
| `NOUS_INFERENCE_BASE_URL` | 覆盖 Nous 推理 API URL |
| `HERMES_NOUS_MIN_KEY_TTL_SECONDS` | 智能体密钥在重新铸造前的最小 TTL (默认值: 1800 = 30分钟) |
| `HERMES_NOUS_TIMEOUT_SECONDS` | Nous 凭证/令牌流程的 HTTP 超时时间 |
| `HERMES_DUMP_REQUESTS` | 将 API 请求载荷转储到日志文件 (`true`/`false`) |
| `HERMES_PREFILL_MESSAGES_FILE` | 包含在 API 调用时注入的临时预填充消息的 JSON 文件路径 |
| `HERMES_TIMEZONE` | IANA 时区覆盖 (例如 `America/New_York`) |

## 工具 API

| 变量 | 描述 |
|----------|-------------|
| `PARALLEL_API_KEY` | AI 原生网络搜索 ([parallel.ai](https://parallel.ai/)) |
| `FIRECRAWL_API_KEY` | 网页抓取和云浏览器 ([firecrawl.dev](https://firecrawl.dev/)) |
| `FIRECRAWL_API_URL` | 用于自托管实例的自定义 Firecrawl API 端点 (可选) |
| `TAVILY_API_KEY` | Tavily API 密钥，用于 AI 原生的网络搜索、提取和抓取 ([app.tavily.com](https://app.tavily.com/home)) |
| `SEARXNG_URL` | SearXNG 实例 URL，用于免费的自托管网络搜索 —— 无需 API 密钥 ([searxng.github.io](https://searxng.github.io/searxng/)) |
| `TAVILY_BASE_URL` | 覆盖 Tavily API 端点。适用于企业代理和与 Tavily 兼容的自托管搜索后端。模式与 `GROQ_BASE_URL` 相同。 |
| `EXA_API_KEY` | Exa API 密钥，用于 AI 原生的网络搜索和内容获取 ([exa.ai](https://exa.ai/)) |
| `BROWSERBASE_API_KEY` | 浏览器自动化 ([browserbase.com](https://browserbase.com/)) |
| `BROWSERBASE_PROJECT_ID` | Browserbase 项目 ID |
| `BROWSER_USE_API_KEY` | Browser Use 云浏览器 API 密钥 ([browser-use.com](https://browser-use.com/)) |
| `FIRECRAWL_BROWSER_TTL` | Firecrawl 浏览器会话 TTL (秒) (默认值: 300) |
| `BROWSER_CDP_URL` | 用于本地浏览器的 Chrome DevTools Protocol URL (通过 `/browser connect` 设置，例如 `ws://localhost:9222`) |
| `CAMOFOX_URL` | Camofox 本地反检测浏览器 URL (默认值: `http://localhost:9377`) |
| `CAMOFOX_USER_ID` | 可选的外部管理的 Camofox 用户 ID，用于共享可见会话 |
| `CAMOFOX_SESSION_KEY` | 为 `CAMOFOX_USER_ID` 创建标签页时使用的可选 Camofox 会话密钥 |
| `CAMOFOX_ADOPT_EXISTING_TAB` | 设置为 `true` 以在创建新标签页前重用现有的 Camofox 标签页 |
| `BROWSER_INACTIVITY_TIMEOUT` | 浏览器会话不活动超时时间 (秒) |
| `AGENT_BROWSER_ARGS` | 额外的 Chromium 启动标志 (用逗号或换行符分隔)。当以 root 用户或在 AppArmor 受限的非特权用户命名空间 (Ubuntu 23.10+、DGX Spark、许多容器镜像) 中运行时，Hermes 会自动注入 `--no-sandbox,--disable-dev-shm-usage`；仅在需要覆盖或添加其他标志时才手动设置此项。 |
| `FAL_KEY` | 图像生成 ([fal.ai](https://fal.ai/)) |
| `GROQ_API_KEY` | Groq Whisper STT API 密钥 ([groq.com](https://groq.com/)) |
| `ELEVENLABS_API_KEY` | ElevenLabs 高级 TTS 语音 ([elevenlabs.io](https://elevenlabs.io/)) |
| `STT_GROQ_MODEL` | 覆盖 Groq STT 模型 (默认值: `whisper-large-v3-turbo`) |
| `GROQ_BASE_URL` | 覆盖与 OpenAI 兼容的 Groq STT 端点 |
| `STT_OPENAI_MODEL` | 覆盖 OpenAI STT 模型 (默认值: `whisper-1`) |
| `STT_OPENAI_BASE_URL` | 覆盖与 OpenAI 兼容的 STT 端点 |
| `GITHUB_TOKEN` | 用于 Skills Hub 的 GitHub 令牌 (更高的 API 速率限制、技能发布) |
| `HONCHO_API_KEY` | 跨会话用户建模 ([honcho.dev](https://honcho.dev/)) |
| `HONCHO_BASE_URL` | 自托管 Honcho 实例的基础 URL (默认值: Honcho 云)。本地实例无需 API 密钥 |
| `HINDSIGHT_TIMEOUT` | Hindsight 内存提供者 API 调用的超时时间 (秒) (默认值: `60`)。如果您的 Hindsight 实例在 `/sync` 或 `on_session_switch` 期间响应缓慢，并且在 `errors.log` 中看到超时，请调高此值。 |
| `SUPERMEMORY_API_KEY` | 语义长期记忆，具有档案召回和会话摄入功能 ([supermemory.ai](https://supermemory.ai)) |
| `DAYTONA_API_KEY` | Daytona 云沙盒 ([daytona.io](https://daytona.io/)) |
| `VERCEL_TOKEN` | Vercel 沙盒访问令牌 ([vercel.com](https://vercel.com/)) |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID (与 `VERCEL_TOKEN` 一起使用时必填) |
| `VERCEL_TEAM_ID` | Vercel 团队 ID (与 `VERCEL_TOKEN` 一起使用时必填) |
| `VERCEL_OIDC_TOKEN` | Vercel 短期 OIDC 令牌 (仅限开发的替代方案) |

### Langfuse 可观测性

用于捆绑的 [`observability/langfuse`](/user-guide/features/built-in-plugins#observabilitylangfuse) 插件的环境变量。在 `~/.hermes/.env` 中设置这些变量。在这些变量生效之前，还必须启用该插件 (`hermes plugins enable observability/langfuse`，或在 `hermes plugins` 中勾选该框)。

| 变量 | 描述 |
|----------|-------------|
| `HERMES_LANGFUSE_PUBLIC_KEY` | Langfuse 项目公钥 (`pk-lf-...`)。必填。 |
| `HERMES_LANGFUSE_SECRET_KEY` | Langfuse 项目私钥 (`sk-lf-...`)。必填。 |
| `HERMES_LANGFUSE_BASE_URL` | Langfuse 服务器 URL (默认值: `https://cloud.langfuse.com`)。为自托管实例设置。 |
| `HERMES_LANGFUSE_ENV` | 追踪上的环境标签 (`production`, `staging`, …) |
| `HERMES_LANGFUSE_RELEASE` | 追踪上的版本/发布标签 |
| `HERMES_LANGFUSE_SAMPLE_RATE` | SDK 采样率 0.0–1.0 (默认值: `1.0`) |
| `HERMES_LANGFUSE_MAX_CHARS` | 序列化载荷的每字段截断长度 (默认值: `12000`) |
| `HERMES_LANGFUSE_DEBUG` | `true` 启用详细插件日志记录到 `agent.log` |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` / `LANGFUSE_BASE_URL` | 标准 Langfuse SDK 名称。当未设置 `HERMES_LANGFUSE_*` 对应项时，可作为后备选项接受。 |

### Nous 工具网关

这些变量为付费 Nous 订阅者或自托管网关部署配置[工具网关](/user-guide/features/tool-gateway)。大多数用户不需要设置这些 —— 网关通过 `hermes model` 或 `hermes tools` 自动配置。

| 变量 | 描述 |
|----------|-------------|
| `TOOL_GATEWAY_DOMAIN` | 用于工具网关路由的基础域名 (默认值: `nousresearch.com`) |
| `TOOL_GATEWAY_SCHEME` | 网关 URL 的 HTTP 或 HTTPS 方案 (默认值: `https`) |
| `TOOL_GATEWAY_USER_TOKEN` | 工具网关的认证令牌 (通常从 Nous 认证自动填充) |
| `FIRECRAWL_GATEWAY_URL` | 专门覆盖 Firecrawl 网关端点的 URL |

## 终端后端

| 变量 | 描述 |
|------|------|
| `TERMINAL_ENV` | 后端类型：`local`、`docker`、`ssh`、`singularity`、`modal`、`daytona`、`vercel_sandbox` |
| `HERMES_DOCKER_BINARY` | 覆盖 Hermes 调用的容器二进制文件路径（例如 `podman`、`/usr/local/bin/docker`）。未设置时，Hermes 会自动在 `PATH` 中查找 `docker` 或 `podman`。当两者均已安装且您希望使用非默认项，或当二进制文件位于 `PATH` 之外时，需要此设置。 |
| `TERMINAL_DOCKER_IMAGE` | Docker 镜像（默认值：`nikolaik/python-nodejs:python3.11-nodejs20`） |
| `TERMINAL_DOCKER_FORWARD_ENV` | JSON 数组，包含需要显式转发到 Docker 终端会话的环境变量名称。请注意，由技能声明的 `required_environment_variables` 会自动转发——您仅需在此处设置未被任何技能声明的变量。 |
| `TERMINAL_DOCKER_VOLUMES` | 额外的 Docker 卷挂载项（以逗号分隔的 `主机:容器` 对） |
| `TERMINAL_DOCKER_MOUNT_CWD_TO_WORKSPACE` | 高级选项（选择启用）：将启动时的当前工作目录挂载到 Docker 的 `/workspace`（`true`/`false`，默认值：`false`） |
| `TERMINAL_SINGULARITY_IMAGE` | Singularity 镜像或 `.sif` 文件路径 |
| `TERMINAL_MODAL_IMAGE` | Modal 容器镜像 |
| `TERMINAL_DAYTONA_IMAGE` | Daytona 沙盒镜像 |
| `TERMINAL_VERCEL_RUNTIME` | Vercel 沙盒运行时（`node24`、`node22`、`python3.13`） |
| `TERMINAL_TIMEOUT` | 命令超时时间（秒） |
| `TERMINAL_LIFETIME_SECONDS` | 终端会话的最长存活时间（秒） |
| `TERMINAL_CWD` | 终端会话的工作目录（仅限网关/定时任务；CLI 使用启动目录） |
| `SUDO_PASSWORD` | 启用 sudo 而无需交互式提示 |

对于云端沙盒后端，持久化是基于文件系统的。`TERMINAL_LIFETIME_SECONDS` 控制 Hermes 何时清理空闲的终端会话，之后的恢复可能会重新创建沙盒，而不是保持相同的活动进程运行。

## SSH 后端

| 变量 | 描述 |
|------|------|
| `TERMINAL_SSH_HOST` | 远程服务器主机名 |
| `TERMINAL_SSH_USER` | SSH 用户名 |
| `TERMINAL_SSH_PORT` | SSH 端口（默认值：22） |
| `TERMINAL_SSH_KEY` | 私钥文件路径 |
| `TERMINAL_SSH_PERSISTENT` | 覆盖 SSH 的持久化 Shell 设置（默认值：遵循 `TERMINAL_PERSISTENT_SHELL` 的设置） |

## 容器资源（Docker、Singularity、Modal、Daytona）

| 变量 | 描述 |
|------|------|
| `TERMINAL_CONTAINER_CPU` | CPU 核心数（默认值：1） |
| `TERMINAL_CONTAINER_MEMORY` | 内存，单位为 MB（默认值：5120） |
| `TERMINAL_CONTAINER_DISK` | 磁盘空间，单位为 MB（默认值：51200） |
| `TERMINAL_CONTAINER_PERSISTENT` | 跨会话持久化容器文件系统（默认值：`true`） |
| `TERMINAL_SANDBOX_DIR` | 用于工作区和覆盖层的宿主机目录（默认值：`~/.hermes/sandboxes/`） |

## 持久化 Shell

| 变量 | 描述 |
|------|------|
| `TERMINAL_PERSISTENT_SHELL` | 为非本地后端启用持久化 Shell（默认值：`true`）。也可通过 config.yaml 中的 `terminal.persistent_shell` 设置。 |
| `TERMINAL_LOCAL_PERSISTENT` | 为本地后端启用持久化 Shell（默认值：`false`） |
| `TERMINAL_SSH_PERSISTENT` | 覆盖 SSH 后端的持久化 Shell 设置（默认值：遵循 `TERMINAL_PERSISTENT_SHELL` 的设置） |

---
title: 消息系统
description: 学习如何使用 MiMo 框架中的消息协议来构建通信系统
slug: /docs/messaging
---

# 消息系统

消息系统是 MiMo 框架中智能体之间通信的基础。它提供了一种灵活、可扩展的方式来传递数据、触发操作和协调任务。

## 核心概念

### 消息

消息是通信的基本单位。每条消息都包含：

- **类型**：标识消息用途的字符串（例如 `"task_request"`, `"status_update"`）
- **有效载荷**：实际传输的数据（JSON 对象）
- **元数据**：关于消息的额外信息（时间戳、发送者、优先级等）

```python
from mimo.messaging import Message

# 创建消息
msg = Message(
    type="task_request",
    payload={
        "task_id": "task-001",
        "action": "process_data",
        "parameters": {"input": "数据流"}
    },
    metadata={
        "sender": "agent-alpha",
        "priority": "high",
        "timestamp": "2023-10-27T10:30:00Z"
    }
)
```

### 主题

主题是消息路由的逻辑通道。智能体可以订阅特定主题来接收感兴趣的消息。

```python
# 订阅主题
messaging.subscribe("tasks.processing.*", handle_processing_tasks)

# 发布消息到主题
messaging.publish("tasks.processing.data", msg)
```

## 通信模式

### 请求-响应模式

这种模式用于需要即时反馈的操作。

```python
async def request_response_example():
    # 发送请求并等待响应
    response = await messaging.request(
        target="data-processor",
        message=msg,
        timeout=1000  # 1秒超时
    )
    
    if response.status == "success":
        print("处理完成:", response.payload["result"])
    else:
        print("处理失败:", response.error)
```

### 发布-订阅模式

适用于一对多广播场景。

```python
# 发布者
async def publish_status_update():
    status_msg = Message(
        type="status_update",
        payload={"system": "operational", "load": "45%"}
    )
    await messaging.broadcast("system.status", status_msg)

# 订阅者
@subscriber("system.status")
async def handle_status_update(msg):
    print(f"系统状态更新: {msg.payload}")
```

### 点对点模式

用于直接的智能体间通信。

```python
# 直接发送消息给特定智能体
await messaging.direct_send(
    target="agent-beta",
    message=task_message
)
```

## 消息处理管道

MiMo 支持消息处理管道，允许在消息传递过程中执行一系列操作。

```python
from mimo.messaging import Pipeline, Filter, Transformer

# 创建处理管道
pipeline = Pipeline([
    # 过滤器：只处理高优先级消息
    Filter(lambda msg: msg.metadata.get("priority") == "high"),
    
    # 转换器：添加时间戳
    Transformer(lambda msg: msg.add_metadata("processed_at", current_time())),
    
    # 日志记录器
    LoggerMiddleware()
])

# 应用管道
messaging.use_pipeline(pipeline)
```

## 错误处理和重试机制

系统提供内置的错误处理和消息重试功能。

```python
from mimo.messaging import RetryPolicy

# 配置重试策略
retry_policy = RetryPolicy(
    max_retries=3,
    backoff_factor=2,  # 指数退避
    retry_on=[TimeoutError, ConnectionError]
)

@message_handler(retry_policy=retry_policy)
async def handle_critical_task(msg):
    try:
        await process_critical_task(msg)
    except CriticalError as e:
        # 可以自定义错误处理
        await messaging.send_to_dead_letter_queue(msg, str(e))
```

## 消息持久化

对于需要持久化的消息，MiMo 支持多种后端存储。

```python
from mimo.messaging.persistence import (
    MemoryBackend,      # 内存存储（开发测试用）
    RedisBackend,       # Redis 存储
    DatabaseBackend,    # 数据库存储
    KafkaBackend        # Apache Kafka 存储
)

# 配置持久化后端
messaging.configure_persistence(
    backend="redis",
    connection_string="redis://localhost:6379",
    ttl=3600  # 消息保留1小时
)
```

## 性能优化

### 消息批处理

```python
# 批量发送消息，减少网络开销
with messaging.batch_context() as batch:
    for i in range(1000):
        batch.publish(f"topic.{i % 10}", messages[i])
# 离开上下文时自动发送批量消息
```

### 压缩和序列化

```python
# 配置消息压缩
messaging.configure(
    compression="lz4",  # 使用 LZ4 压缩
    serialization="msgpack"  # 使用 MessagePack 序列化（比 JSON 更高效）
)
```

## 安全考虑

1. **消息加密**：支持端到端加密，确保敏感数据安全
2. **身份验证**：智能体在连接时需要进行身份验证
3. **授权**：基于角色的访问控制，限制消息发布/订阅权限
4. **审计日志**：记录所有消息活动，便于安全审计

```python
# 配置安全设置
messaging.configure_security(
    encryption="AES-256-GCM",
    authentication="certificate",
    authorization="rbac",
    audit_logging=True
)
```

## 监控和可观测性

MiMo 提供全面的监控指标：

- 消息吞吐量（每秒消息数）
- 处理延迟（端到端延迟）
- 队列深度
- 错误率
- 重试次数

```python
# 获取监控指标
metrics = await messaging.get_metrics()
print(f"当前吞吐量: {metrics.throughput} msg/sec")
print(f"平均延迟: {metrics.avg_latency}ms")
```

## 最佳实践

1. **保持消息小而专注**：每条消息只做一件事
2. **使用类型明确的消息**：便于路由和处理
3. **实现幂等性**：确保消息可以安全重试
4. **监控死信队列**：及时处理失败的消息
5. **设计容错的消费者**：处理各种异常情况
6. **合理设置超时**：避免资源长时间被占用
7. **文档化消息协议**：确保团队对消息格式有共识

## 示例：完整的聊天系统

```python
from mimo import Agent, Message, messaging

class ChatAgent(Agent):
    def __init__(self, agent_id):
        super().__init__(agent_id)
        self.message_history = []
    
    async def setup(self):
        # 订阅聊天消息
        await messaging.subscribe("chat.general", self.handle_chat_message)
        
        # 订阅私信
        await messaging.subscribe(f"chat.private.{self.agent_id}", self.handle_private_message)
    
    async def handle_chat_message(self, msg):
        # 处理群聊消息
        sender = msg.metadata["sender"]
        content = msg.payload["text"]
        
        print(f"[{sender}]: {content}")
        self.message_history.append(msg)
        
        # 自动回复示例
        if "你好" in content:
            await self.send_message(
                "chat.general",
                {"text": f"你好！我是{self.agent_id}"},
                reply_to=msg
            )
    
    async def send_message(self, topic, content, reply_to=None):
        metadata = {
            "sender": self.agent_id,
            "timestamp": current_time()
        }
        
        if reply_to:
            metadata["reply_to"] = reply_to.metadata["message_id"]
        
        msg = Message(
            type="chat_message",
            payload=content,
            metadata=metadata
        )
        
        await messaging.publish(topic, msg)

# 使用示例
async def main():
    # 创建聊天智能体
    agent1 = ChatAgent("alice")
    agent2 = ChatAgent("bob")
    
    await agent1.start()
    await agent2.start()
    
    # 发送消息
    await agent1.send_message(
        "chat.general",
        {"text": "大家好！今天的会议几点开始？"}
    )
```

消息系统是构建复杂多智能体应用的基础。通过合理使用消息协议，您可以创建松耦合、高扩展性的分布式系统。

| 变量 | 描述 |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram 机器人令牌 (来自 @BotFather) |
| `TELEGRAM_ALLOWED_USERS` | 允许使用机器人的用户 ID 列表 (逗号分隔，适用于私聊、群组和论坛) |
| `TELEGRAM_GROUP_ALLOWED_USERS` | 仅在群组/论坛中授权的发送者用户 ID 列表 (逗号分隔，不授予私聊权限)。形如聊天 ID 的值 (以 `-` 开头) 仍被视为聊天 ID，以向早于 #17686 的配置提供向后兼容，但会显示弃用警告。 |
| `TELEGRAM_GROUP_ALLOWED_CHATS` | 群组/论坛聊天 ID 列表 (逗号分隔)；任何成员都将获得授权 |
| `TELEGRAM_HOME_CHANNEL` | 用于定时任务推送的默认 Telegram 聊天/频道 |
| `TELEGRAM_HOME_CHANNEL_NAME` | Telegram 主频道的显示名称 |
| `TELEGRAM_CRON_THREAD_ID` | 接收定时任务推送的论坛话题 ID；覆盖 `TELEGRAM_HOME_CHANNEL_THREAD_ID`，仅对定时任务有效。在话题模式下使用，以便对定时消息的回复会打开一个新会话，而不是进入系统大厅 (#24409)。 |
| `TELEGRAM_WEBHOOK_URL` | Webhook 模式的公共 HTTPS URL (启用 webhook 代替轮询) |
| `TELEGRAM_WEBHOOK_PORT` | Webhook 服务器的本地监听端口 (默认值: `8443`) |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram 在每次更新中回传用于验证的密钥令牌。**当设置了 `TELEGRAM_WEBHOOK_URL` 时为必填项** — 网关缺少此项将无法启动 (GHSA-3vpc-7q5r-276h)。使用 `openssl rand -hex 32` 生成。 |
| `TELEGRAM_REACTIONS` | 在处理消息期间启用表情符号回应 (默认值: `false`) |
| `TELEGRAM_REQUIRE_MENTION` | 在 Telegram 群组中回复前需要显式触发。等同于 `config.yaml` 中的 `telegram.require_mention`。 |
| `TELEGRAM_MENTION_PATTERNS` | 当 Telegram 群组提及门控启用时，接受的唤醒词正则表达式模式的 JSON 数组、换行分隔列表或逗号分隔列表。等同于 `telegram.mention_patterns`。 |
| `TELEGRAM_EXCLUSIVE_BOT_MENTIONS` | 启用后，在 Telegram 群组中显式的 `@...bot` 提及会优先路由到被提及的机器人用户名，然后再进行回复或唤醒词回退。默认值: `true`。等同于 `telegram.exclusive_bot_mentions`。 |
| `TELEGRAM_REPLY_TO_MODE` | 回复引用行为: `off`、`first` (默认值) 或 `all`。与 Discord 模式匹配。 |
| `TELEGRAM_IGNORED_THREADS` | 机器人永不回复的 Telegram 论坛话题/线程 ID 列表 (逗号分隔) |
| `TELEGRAM_PROXY` | 用于 Telegram 连接的代理 URL — 覆盖 `HTTPS_PROXY`。支持 `http://`、`https://`、`socks5://` |
| `DISCORD_BOT_TOKEN` | Discord 机器人令牌 |
| `DISCORD_ALLOWED_USERS` | 允许使用机器人的 Discord 用户 ID 列表 (逗号分隔) |
| `DISCORD_ALLOWED_ROLES` | 允许使用机器人的 Discord 角色 ID 列表 (逗号分隔，与 `DISCORD_ALLOWED_USERS` 为“或”关系)。自动启用 Members 意图。在审核团队变动时很有用 — 角色授权会自动传播。 |
| `DISCORD_ALLOWED_CHANNELS` | Discord 频道 ID 列表 (逗号分隔)。设置后，机器人仅在这些频道中响应 (以及允许的私聊)。覆盖 `config.yaml` 中的 `discord.allowed_channels`。 |
| `DISCORD_PROXY` | 用于 Discord 连接的代理 URL — 覆盖 `HTTPS_PROXY`。支持 `http://`、`https://`、`socks5://` |
| `DISCORD_HOME_CHANNEL` | 用于定时任务推送的默认 Discord 频道 |
| `DISCORD_HOME_CHANNEL_NAME` | Discord 主频道的显示名称 |
| `DISCORD_COMMAND_SYNC_POLICY` | Discord 斜杠命令启动同步策略: `safe` (差异比较与调和)、`bulk` (旧版 `tree.sync()`) 或 `off` |
| `DISCORD_REQUIRE_MENTION` | 在服务器频道中回复前需要 @提及 |
| `DISCORD_FREE_RESPONSE_CHANNELS` | 不需要提及的频道 ID 列表 (逗号分隔) |
| `DISCORD_AUTO_THREAD` | 在支持时自动为长回复创建线程 |
| `DISCORD_ALLOW_ANY_ATTACHMENT` | 设为 `true` 时，接受任何文件类型的附件 (而不仅仅是内置的 PDF/文本/zip/office 允许列表)。未知类型会被缓存并作为本地路径提供给智能体，以便其可以通过 `terminal` / `read_file` / `ffprobe` 检查它们。默认值为 `false`。 |
| `DISCORD_MAX_ATTACHMENT_BYTES` | 网关将缓存的每个附件最大字节数。默认值 `33554432` (32 MiB)。设为 `0` 表示无上限 (附件在写入时会保持在内存中)。 |
| `DISCORD_REACTIONS` | 在处理消息期间启用表情符号回应 (默认值: `true`) |
| `DISCORD_IGNORED_CHANNELS` | 机器人永不回复的频道 ID 列表 (逗号分隔) |
| `DISCORD_NO_THREAD_CHANNELS` | 机器人响应时不创建线程的频道 ID 列表 (逗号分隔) |
| `DISCORD_REPLY_TO_MODE` | 回复引用行为: `off`、`first` (默认值) 或 `all` |
| `DISCORD_ALLOW_MENTION_EVERYONE` | 允许机器人 ping `@everyone`/`@here` (默认值: `false`)。参见[提及控制](../user-guide/messaging/discord.md#mention-control)。 |
| `DISCORD_ALLOW_MENTION_ROLES` | 允许机器人 ping `@role` 提及 (默认值: `false`)。 |
| `DISCORD_ALLOW_MENTION_USERS` | 允许机器人 ping 个人 `@user` 提及 (默认值: `true`)。 |
| `DISCORD_ALLOW_MENTION_REPLIED_USER` | 回复用户消息时 ping 该用户 (默认值: `true`)。 |
| `SLACK_BOT_TOKEN` | Slack 机器人令牌 (`xoxb-...`) |
| `SLACK_APP_TOKEN` | Slack 应用级别令牌 (`xapp-...`，Socket 模式必需) |
| `SLACK_ALLOWED_USERS` | Slack 用户 ID 列表 (逗号分隔) |
| `SLACK_HOME_CHANNEL` | 用于定时任务推送的默认 Slack 频道 |
| `SLACK_HOME_CHANNEL_NAME` | Slack 主频道的显示名称 |
| `GOOGLE_CHAT_PROJECT_ID` | 托管 Pub/Sub 主题的 GCP 项目 (回退到 `GOOGLE_CLOUD_PROJECT`) |
| `GOOGLE_CHAT_SUBSCRIPTION_NAME` | 完整的 Pub/Sub 订阅路径，`projects/{proj}/subscriptions/{sub}` (旧版别名: `GOOGLE_CHAT_SUBSCRIPTION`) |
| `GOOGLE_CHAT_SERVICE_ACCOUNT_JSON` | 服务账户 JSON 的路径，或内联 JSON (回退到 `GOOGLE_APPLICATION_CREDENTIALS`) |
| `GOOGLE_CHAT_ALLOWED_USERS` | 允许与机器人聊天的用户邮箱列表 (逗号分隔) |
| `GOOGLE_CHAT_ALLOW_ALL_USERS` | 允许任何 Google Chat 用户触发机器人 (仅限开发环境) |
| `GOOGLE_CHAT_HOME_CHANNEL` | 用于定时任务推送的默认空间 (例如 `spaces/AAAA...`) |
| `GOOGLE_CHAT_HOME_CHANNEL_NAME` | Google Chat 主空间的显示名称 |
| `GOOGLE_CHAT_MAX_MESSAGES` | Pub/Sub FlowControl 最大在途消息数 (默认值: `1`) |
| `GOOGLE_CHAT_MAX_BYTES` | Pub/Sub FlowControl 最大在途字节数 (默认值: `16777216`，16 MiB) |
| `GOOGLE_CHAT_BOOTSTRAP_SPACES` | 启动时用于解析机器人自身 `users/{id}` 的额外空间 ID 列表 (逗号分隔) |
| `GOOGLE_CHAT_DEBUG_RAW` | 设置任意值以将脱敏的 Pub/Sub 信封记录在 DEBUG 级别 (仅用于调试) |
| `WHATSAPP_ENABLED` | 启用 WhatsApp 桥接 (`true`/`false`) |
| `WHATSAPP_MODE` | `bot` (独立号码) 或 `self-chat` (给自己发消息) |
| `WHATSAPP_ALLOWED_USERS` | 允许的电话号码列表 (带国家代码，无 `+`，逗号分隔)，或设为 `*` 允许所有发送者 |
| `WHATSAPP_ALLOW_ALL_USERS` | 允许所有 WhatsApp 发送者而无需允许列表 (`true`/`false`) |
| `WHATSAPP_DEBUG` | 在桥接中记录原始消息事件以用于故障排除 (`true`/`false`) |
| `SIGNAL_HTTP_URL` | signal-cli 守护进程 HTTP 端点 (例如 `http://127.0.0.1:8080`) |
| `SIGNAL_ACCOUNT` | E.164 格式的机器人电话号码 |
| `SIGNAL_ALLOWED_USERS` | E.164 格式的电话号码或 UUID 列表 (逗号分隔) |
| `SIGNAL_GROUP_ALLOWED_USERS` | 群组 ID 列表 (逗号分隔)，或设为 `*` 表示所有群组 |
| `SIGNAL_HOME_CHANNEL_NAME` | Signal 主频道的显示名称 |
| `SIGNAL_IGNORE_STORIES` | 忽略 Signal 故事/状态更新 |
| `SIGNAL_ALLOW_ALL_USERS` | 允许所有 Signal 用户而无需允许列表 |
| `TWILIO_ACCOUNT_SID` | Twilio 账户 SID (与电话技能共享) |
| `TWILIO_AUTH_TOKEN` | Twilio 认证令牌 (与电话技能共享；也用于 webhook 签名验证) |
| `TWILIO_PHONE_NUMBER` | E.164 格式的 Twilio 电话号码 (与电话技能共享) |
| `SMS_WEBHOOK_URL` | 用于 Twilio 签名验证的公共 URL — 必须匹配 Twilio 控制台中的 webhook URL (必填) |
| `SMS_WEBHOOK_PORT` | 入站 SMS 的 webhook 监听端口 (默认值: `8080`) |
| `SMS_WEBHOOK_HOST` | Webhook 绑定地址 (默认值: `0.0.0.0`) |
| `SMS_INSECURE_NO_SIGNATURE` | 设为 `true` 可禁用 Twilio 签名验证 (仅限本地开发 — 不用于生产环境) |
| `SMS_ALLOWED_USERS` | 允许聊天的 E.164 格式电话号码列表 (逗号分隔) |
| `SMS_ALLOW_ALL_USERS` | 允许所有 SMS 发送者而无需允许列表 |
| `SMS_HOME_CHANNEL` | 用于定时任务/通知推送的电话号码 |
| `SMS_HOME_CHANNEL_NAME` | SMS 主频道的显示名称 |
| `EMAIL_ADDRESS` | 电子邮件网关适配器的电子邮件地址 |
| `EMAIL_PASSWORD` | 电子邮件账户的密码或应用密码 |
| `EMAIL_IMAP_HOST` | 电子邮件适配器的 IMAP 主机名 |
| `EMAIL_IMAP_PORT` | IMAP 端口 |
| `EMAIL_SMTP_HOST` | 电子邮件适配器的 SMTP 主机名 |
| `EMAIL_SMTP_PORT` | SMTP 端口 |
| `EMAIL_ALLOWED_USERS` | 允许给机器人发消息的电子邮件地址列表 (逗号分隔) |
| `EMAIL_HOME_ADDRESS` | 主动邮件推送的默认收件人 |
| `EMAIL_HOME_ADDRESS_NAME` | 电子邮件主目标的显示名称 |
| `EMAIL_POLL_INTERVAL` | 电子邮件轮询间隔 (秒) |
| `EMAIL_ALLOW_ALL_USERS` | 允许所有入站电子邮件发送者 |
| `DINGTALK_CLIENT_ID` | 来自开发者门户 ([open.dingtalk.com](https://open.dingtalk.com)) 的钉钉机器人 AppKey |
| `DINGTALK_CLIENT_SECRET` | 来自开发者门户的钉钉机器人 AppSecret |
| `DINGTALK_ALLOWED_USERS` | 允许给机器人发消息的钉钉用户 ID 列表 (逗号分隔) |
| `FEISHU_APP_ID` | 来自 [open.feishu.cn](https://open.feishu.cn/) 的飞书/Lark 机器人应用 ID |
| `FEISHU_APP_SECRET` | 飞书/Lark 机器人应用密钥 |
| `FEISHU_DOMAIN` | `feishu` (中国) 或 `lark` (国际版)。默认值: `feishu` |
| `FEISHU_CONNECTION_MODE` | `websocket` (推荐) 或 `webhook`。

| 变量 | 描述 |
|------|------|
| `FEISHU_ENCRYPT_KEY` | Webhook模式的可选加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | Webhook模式的可选验证令牌 |
| `FEISHU_ALLOWED_USERS` | 允许向机器人发送消息的飞书用户ID列表（逗号分隔） |
| `FEISHU_ALLOW_BOTS` | `none`（默认）/ `mentions` / `all` —— 接受来自其他机器人的入站消息。参见[机器人间消息传递](../user-guide/messaging/feishu.md#bot-to-bot-messaging) |
| `FEISHU_REQUIRE_MENTION` | `true`（默认）/ `false` —— 群消息是否必须@提及机器人。可通过 `group_rules.<chat_id>.require_mention` 按聊天覆盖设置。 |
| `FEISHU_HOME_CHANNEL` | 用于定时任务投递和通知的飞书聊天ID |
| `WECOM_BOT_ID` | 来自管理控制台的企业微信AI机器人ID |
| `WECOM_SECRET` | 企业微信AI机器人密钥 |
| `WECOM_WEBSOCKET_URL` | 自定义WebSocket URL（默认：`wss://openws.work.weixin.qq.com`） |
| `WECOM_ALLOWED_USERS` | 允许向机器人发送消息的企业微信用户ID列表（逗号分隔） |
| `WECOM_HOME_CHANNEL` | 用于定时任务投递和通知的企业微信聊天ID |
| `WECOM_CALLBACK_CORP_ID` | 回调自建应用的企业微信企业Corp ID |
| `WECOM_CALLBACK_CORP_SECRET` | 自建应用的Corp secret |
| `WECOM_CALLBACK_AGENT_ID` | 自建应用的Agent ID |
| `WECOM_CALLBACK_TOKEN` | 回调验证令牌 |
| `WECOM_CALLBACK_ENCODING_AES_KEY` | 回调加密的AES密钥 |
| `WECOM_CALLBACK_HOST` | 回调服务器绑定地址（默认：`0.0.0.0`） |
| `WECOM_CALLBACK_PORT` | 回调服务器端口（默认：`8645`） |
| `WECOM_CALLBACK_ALLOWED_USERS` | 用于允许列表的用户ID列表（逗号分隔） |
| `WECOM_CALLBACK_ALLOW_ALL_USERS` | 设置 `true` 以允许所有用户而不使用允许列表 |
| `WEIXIN_ACCOUNT_ID` | 通过iLink Bot API扫码登录获得的微信账号ID |
| `WEIXIN_TOKEN` | 通过iLink Bot API扫码登录获得的微信认证令牌 |
| `WEIXIN_BASE_URL` | 覆盖微信iLink Bot API的基础URL（默认：`https://ilinkai.weixin.qq.com`） |
| `WEIXIN_CDN_BASE_URL` | 覆盖用于媒体文件的微信CDN基础URL（默认：`https://novac2c.cdn.weixin.qq.com/c2c`） |
| `WEIXIN_DM_POLICY` | 私信策略：`open`、`allowlist`、`pairing`、`disabled`（默认：`open`） |
| `WEIXIN_GROUP_POLICY` | 群消息策略：`open`、`allowlist`、`disabled`（默认：`disabled`） |
| `WEIXIN_ALLOWED_USERS` | 允许向机器人发送私信的微信用户ID列表（逗号分隔） |
| `WEIXIN_GROUP_ALLOWED_USERS` | 允许与机器人交互的微信**群聊ID**（非成员用户ID）列表（逗号分隔）。变量名是遗留用法——它需要的是群ID。仅当iLink实际投递群事件时生效；二维码登录的iLink机器人身份（`...@im.bot`）通常不会接收普通微信群消息。 |
| `WEIXIN_HOME_CHANNEL` | 用于定时任务投递和通知的微信聊天ID |
| `WEIXIN_HOME_CHANNEL_NAME` | 微信主频道的显示名称 |
| `WEIXIN_ALLOW_ALL_USERS` | 允许所有微信用户而不使用允许列表（`true`/`false`） |
| `BLUEBUBBLES_SERVER_URL` | BlueBubbles服务器URL（例如 `http://192.168.1.10:1234`） |
| `BLUEBUBBLES_PASSWORD` | BlueBubbles服务器密码 |
| `BLUEBUBBLES_WEBHOOK_HOST` | Webhook监听器绑定地址（默认：`127.0.0.1`） |
| `BLUEBUBBLES_WEBHOOK_PORT` | Webhook监听器端口（默认：`8645`） |
| `BLUEBUBBLES_HOME_CHANNEL` | 用于定时/通知投递的电话/邮箱 |
| `BLUEBUBBLES_ALLOWED_USERS` | 授权用户列表（逗号分隔） |
| `BLUEBUBBLES_ALLOW_ALL_USERS` | 允许所有用户（`true`/`false`） |
| `QQ_APP_ID` | 来自 [q.qq.com](https://q.qq.com) 的QQ机器人应用ID |
| `QQ_CLIENT_SECRET` | 来自 [q.qq.com](https://q.qq.com) 的QQ机器人应用密钥 |
| `QQ_STT_API_KEY` | 外部语音转文字备用提供商的API密钥（可选，当QQ内置语音识别未返回文本时使用） |
| `QQ_STT_BASE_URL` | 外部语音转文字提供商的基础URL（可选） |
| `QQ_STT_MODEL` | 外部语音转文字提供商的模型名称（可选） |
| `QQ_ALLOWED_USERS` | 允许向机器人发送消息的QQ用户openID列表（逗号分隔） |
| `QQ_GROUP_ALLOWED_USERS` | 用于群@消息访问的QQ群ID列表（逗号分隔） |
| `QQ_ALLOW_ALL_USERS` | 允许所有用户（`true`/`false`，覆盖 `QQ_ALLOWED_USERS`） |
| `QQBOT_HOME_CHANNEL` | 用于定时任务投递和通知的QQ用户/群openID |
| `QQBOT_HOME_CHANNEL_NAME` | QQ主频道的显示名称 |
| `QQ_PORTAL_HOST` | 覆盖QQ门户主机（设置为 `sandbox.q.qq.com` 以通过沙盒网关路由；默认：`q.qq.com`）。 |
| `MATTERMOST_URL` | Mattermost服务器URL（例如 `https://mm.example.com`） |
| `MATTERMOST_TOKEN` | Mattermost的机器人令牌或个人访问令牌 |
| `MATTERMOST_ALLOWED_USERS` | 允许向机器人发送消息的Mattermost用户ID列表（逗号分隔） |
| `MATTERMOST_HOME_CHANNEL` | 用于主动消息投递（定时任务、通知）的频道ID |
| `MATTERMOST_REQUIRE_MENTION` | 在频道中需要 `@提及`（默认：`true`）。设置为 `false` 以响应所有消息。 |
| `MATTERMOST_FREE_RESPONSE_CHANNELS` | 机器人无需 `@提及` 即可响应的频道ID列表（逗号分隔） |
| `MATTERMOST_REPLY_MODE` | 回复样式：`thread`（线程回复）或 `off`（平面消息，默认） |
| `MATRIX_HOMESERVER` | Matrix主服务器URL（例如 `https://matrix.org`） |
| `MATRIX_ACCESS_TOKEN` | 用于机器人认证的Matrix访问令牌 |
| `MATRIX_USER_ID` | Matrix用户ID（例如 `@hermes:matrix.org`）— 密码登录时必需，使用访问令牌时可选 |
| `MATRIX_PASSWORD` | Matrix密码（访问令牌的替代方案） |
| `MATRIX_ALLOWED_USERS` | 允许向机器人发送消息的Matrix用户ID列表（逗号分隔，例如 `@alice:matrix.org`） |
| `MATRIX_HOME_ROOM` | 用于主动消息投递的房间ID（例如 `!abc123:matrix.org`） |
| `MATRIX_ENCRYPTION` | 启用端到端加密（`true`/`false`，默认：`false`） |
| `MATRIX_DEVICE_ID` | 稳定的Matrix设备ID，用于跨重启的E2EE持久化（例如 `HERMES_BOT`）。如果没有此设置，E2EE密钥每次启动都会轮换，历史房间解密将失败。 |
| `MATRIX_REACTIONS` | 启用对入站消息的处理生命周期emoji反应（默认：`true`）。设置为 `false` 以禁用。 |
| `MATRIX_REQUIRE_MENTION` | 在房间中需要 `@提及`（默认：`true`）。设置为 `false` 以响应所有消息。 |
| `MATRIX_FREE_RESPONSE_ROOMS` | 机器人无需 `@提及` 即可响应的房间ID列表（逗号分隔） |
| `MATRIX_AUTO_THREAD` | 为房间消息自动创建线程（默认：`true`） |
| `MATRIX_DM_MENTION_THREADS` | 当机器人在私信中被 `@提及时` 创建线程（默认：`false`） |
| `MATRIX_RECOVERY_KEY` | 设备密钥轮换后用于交叉签名验证的恢复密钥。建议在启用交叉签名的E2EE设置中使用。 |
| `HASS_TOKEN` | Home Assistant长期访问令牌（启用HA平台和工具） |
| `HASS_URL` | Home Assistant URL（默认：`http://homeassistant.local:8123`） |
| `WEBHOOK_ENABLED` | 启用webhook平台适配器（`true`/`false`） |
| `WEBHOOK_PORT` | 用于接收webhook的HTTP服务器端口（默认：`8644`） |
| `WEBHOOK_SECRET` | 用于webhook签名验证的全局HMAC密钥（当路由未指定自己的密钥时用作备用） |
| `API_SERVER_ENABLED` | 启用OpenAI兼容的API服务器（`true`/`false`）。与其他平台并行运行。 |
| `API_SERVER_KEY` | API服务器认证的Bearer令牌。对于非环回绑定是强制性的。 |
| `API_SERVER_CORS_ORIGINS` | 允许直接调用API服务器的浏览器源列表（逗号分隔，例如 `http://localhost:3000,http://127.0.0.1:3000`）。默认：禁用。 |
| `API_SERVER_PORT` | API服务器的端口（默认：`8642`） |
| `API_SERVER_HOST` | API服务器的主机/绑定地址（默认：`127.0.0.1`）。使用 `0.0.0.0` 以允许网络访问——需要 `API_SERVER_KEY` 和一个狭窄的 `API_SERVER_CORS_ORIGINS` 允许列表。 |
| `API_SERVER_MODEL_NAME` | 在 `/v1/models` 上公布的模型名称。默认为配置文件名称（或默认配置文件为 `hermes-agent`）。对于多用户设置很有用，其中像Open WebUI这样的前端需要为每个连接使用不同的模型名称。 |
| `GATEWAY_PROXY_URL` | 远程Hermes API服务器的URL，用于转发消息（[代理模式](/user-guide/messaging/matrix#proxy-mode-e2ee-on-macos)）。设置后，网关仅处理平台I/O——所有智能体工作都委托给远程服务器。也可在 `config.yaml` 中通过 `gateway.proxy_url` 配置。 |
| `GATEWAY_PROXY_KEY` | 在代理模式下用于向远程API服务器认证的Bearer令牌。必须与远程主机上的 `API_SERVER_KEY` 匹配。 |
| `MESSAGING_CWD` | 消息传递模式下终端命令的工作目录（默认：`~`） |
| `GATEWAY_ALLOWED_USERS` | 跨所有平台允许的用户ID列表（逗号分隔） |
| `GATEWAY_ALLOW_ALL_USERS` | 允许所有用户而不使用允许列表（`true`/`false`，默认：`false`） |

### Microsoft Graph（Teams会议）

用于即将到来的Teams会议摘要管线的Microsoft Graph REST客户端的仅限应用的凭据。有关Azure门户演练和所需的精确API权限，请参见[注册Microsoft Graph应用程序](/guides/microsoft-graph-app-registration)。

| 变量 | 描述 |
|------|------|
| `MSGRAPH_TENANT_ID` | 用于Graph应用注册的Azure AD租户ID（目录GUID）。 |
| `MSGRAPH_CLIENT_ID` | Azure应用注册的应用程序（客户端）ID。 |
| `MSGRAPH_CLIENT_SECRET` | 应用注册的客户端密钥值。请使用 `chmod 600` 存储在 `~/.hermes/.env` 中；通过Azure门户定期轮换。 |
| `MSGRAPH_SCOPE` | 客户端凭据令牌请求的OAuth2作用域（默认：`https://graph.microsoft.com/.default`）。 |
| `MSGRAPH_AUTHORITY_URL` | Microsoft身份平台颁发机构（默认：`https://login.microsoftonline.com`）。仅为国家/主权云覆盖（例如GCC High为 `https://login.microsoftonline.us`）。 |

### Microsoft Graph Webhook监听器

用于 Graph 事件（Teams 会议、日历、聊天等）的入站变更通知监听器。请参阅 [Microsoft Graph Webhook 监听器](/user-guide/messaging/msgraph-webhook) 了解设置和安全加固。

| 变量 | 描述 |
|------|------|
| `MSGRAPH_WEBHOOK_ENABLED` | 启用 `msgraph_webhook` 网关平台（`true`/`1`/`yes`）。 |
| `MSGRAPH_WEBHOOK_PORT` | 监听器绑定的端口（默认：`8646`）。 |
| `MSGRAPH_WEBHOOK_CLIENT_STATE` | Graph 在每个通知中回显的共享密钥；通过 `hmac.compare_digest` 进行比较。使用 `openssl rand -hex 32` 生成。 |
| `MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES` | 允许的 Graph 资源路径/模式的逗号分隔列表（例如 `communications/onlineMeetings,chats/*/messages`）。尾部的 `*` 表示前缀匹配。留空 = 接受所有。 |
| `MSGRAPH_WEBHOOK_ALLOWED_SOURCE_CIDRS` | 允许向监听器发送 POST 请求的 CIDR 范围的逗号分隔列表（例如 `52.96.0.0/14,52.104.0.0/14`）。留空 = 允许所有（默认）。在生产环境中，请限制为 Microsoft Graph 公布的出口范围。 |

### Teams 会议摘要传递

仅在启用 [`teams_pipeline` 插件](/user-guide/messaging/msgraph-webhook) 时使用。设置也可在 `config.yaml` 的 `platforms.teams.extra` 下配置 — 当两者都设置时，环境变量优先。请参阅 [Microsoft Teams → 会议摘要传递](/user-guide/messaging/teams#meeting-summary-delivery-teams-meeting-pipeline)。

| 变量 | 描述 |
|------|------|
| `TEAMS_DELIVERY_MODE` | `graph` 或 `incoming_webhook`。 |
| `TEAMS_INCOMING_WEBHOOK_URL` | Teams 生成的 Webhook URL；当 `TEAMS_DELIVERY_MODE=incoming_webhook` 时为必需项。 |
| `TEAMS_GRAPH_ACCESS_TOKEN` | 为 Graph 传递预先获取的委托访问令牌。很少需要 — 未设置时，写入器会回退到 `MSGRAPH_*` 应用凭据。 |
| `TEAMS_TEAM_ID` | 频道传递（`graph` 模式）的目标团队 ID。 |
| `TEAMS_CHANNEL_ID` | 目标频道 ID（与 `TEAMS_TEAM_ID` 配对）。 |
| `TEAMS_CHAT_ID` | 目标 1:1 或群聊 ID（`graph` 模式下团队+频道的替代方案）。 |

### LINE 消息 API

由内置的 LINE 平台插件 (`plugins/platforms/line/`) 使用。请参阅 [消息网关 → LINE](/user-guide/messaging/line) 了解完整设置。

| 变量 | 描述 |
|------|------|
| `LINE_CHANNEL_ACCESS_TOKEN` | 来自 LINE 开发者控制台（消息 API 选项卡）的长期频道访问令牌。必需项。 |
| `LINE_CHANNEL_SECRET` | 频道密钥（基本设置选项卡）；用于 HMAC-SHA256 Webhook 签名验证。必需项。 |
| `LINE_HOST` | Webhook 绑定主机（默认：`0.0.0.0`）。 |
| `LINE_PORT` | Webhook 绑定端口（默认：`8646`）。 |
| `LINE_PUBLIC_URL` | 公共 HTTPS 基础 URL（例如 `https://my-tunnel.example.com`）。发送图片/音频/视频时为必需项 — LINE 仅接受可通过 HTTPS 访问的 URL。 |
| `LINE_ALLOWED_USERS` | 允许向机器人发送私信的用户 ID 逗号分隔列表（`U` 开头）。 |
| `LINE_ALLOWED_GROUPS` | 机器人将在其中回复的群组 ID 逗号分隔列表（`C` 开头）。 |
| `LINE_ALLOWED_ROOMS` | 机器人将在其中回复的房间 ID 逗号分隔列表（`R` 开头）。 |
| `LINE_ALLOW_ALL_USERS` | 仅限开发的权宜之计 — 接受任何来源。默认：`false`。 |
| `LINE_HOME_CHANNEL` | 用于 `deliver: line` 的定时任务的默认传递目标。 |
| `LINE_SLOW_RESPONSE_THRESHOLD` | 在慢速 LLM 模板按钮 postback 触发之前的秒数（默认：`45`）。设置为 `0` 可禁用并始终回退到推送。 |
| `LINE_PENDING_TEXT` | 与 postback 按钮一起显示的气泡文本。 |
| `LINE_BUTTON_LABEL` | Postback 按钮标签（默认：`Get answer`）。 |
| `LINE_DELIVERED_TEXT` | 当再次点击已传递的 postback 时的回复（默认：`Already replied ✅`）。 |
| `LINE_INTERRUPTED_TEXT` | 当点击被 `/stop` 中断的孤立 postback 按钮时的回复（默认：`Run was interrupted before completion.`）。 |

### ntfy（推送通知）

[ntfy](https://ntfy.sh/) 是一个轻量级的基于 HTTP 的推送通知服务。从 [ntfy 手机应用](https://ntfy.sh/docs/subscribe/phone/) 订阅一个主题，向该主题发布消息即可与智能体交谈。

| 变量 | 描述 |
|------|------|
| `NTFY_TOPIC` | 订阅的主题（用于接收消息）。必需项。 |
| `NTFY_SERVER_URL` | 服务器 URL（默认：`https://ntfy.sh`）。为保护隐私，可指向自托管的 ntfy。 |
| `NTFY_TOKEN` | 可选的身份验证令牌。Bearer 令牌（例如 `tk_xyz`）或用于基本身份验证的 `user:pass`。 |
| `NTFY_PUBLISH_TOPIC` | 用于发出回复的主题（默认为 `NTFY_TOPIC`）。 |
| `NTFY_MARKDOWN` | 设置为 `true` 时，回复将带有 `X-Markdown: true` 标头。默认：`false`。 |
| `NTFY_ALLOWED_USERS` | 允许列表（视为用户 ID；在 ntfy 上这些是主题名称）。通常设置为与 `NTFY_TOPIC` 相同的值。 |
| `NTFY_ALLOW_ALL_USERS` | 仅限开发的权宜之计 — 仅在访问控制的私有主题上安全。默认：`false`。 |
| `NTFY_HOME_CHANNEL` | 用于 `deliver: ntfy` 的定时任务的默认传递目标。 |
| `NTFY_HOME_CHANNEL_NAME` | 主页频道的可读标签（默认为主题名称）。 |

请参阅 [ntfy 消息指南](/user-guide/messaging/ntfy) — 特别是 **身份模型** 部分 — 然后再使用不受信任的主题进行部署。

### 高级消息调优

用于控制出站消息批处理器的每个平台的高级调节旋钮。大多数用户永远不需要修改这些；默认值已设置为在尊重每个平台速率限制的同时，避免感觉迟钝。

| 变量 | 描述 |
|------|------|
| `HERMES_TELEGRAM_TEXT_BATCH_DELAY_SECONDS` | 刷新排队的 Telegram 文本块前的宽限期（默认：`0.6`）。 |
| `HERMES_TELEGRAM_TEXT_BATCH_SPLIT_DELAY_SECONDS` | 当单条 Telegram 消息超过长度限制时，拆分块之间的延迟（默认：`2.0`）。 |
| `HERMES_TELEGRAM_MEDIA_BATCH_DELAY_SECONDS` | 刷新排队的 Telegram 媒体前的宽限期（默认：`0.6`）。 |
| `HERMES_TELEGRAM_FOLLOWUP_GRACE_SECONDS` | 在智能体完成后发送后续消息前的延迟，以避免与最后一个流块竞争。 |
| `HERMES_TELEGRAM_HTTP_CONNECT_TIMEOUT` / `_READ_TIMEOUT` / `_WRITE_TIMEOUT` / `_POOL_TIMEOUT` | 覆盖底层 `python-telegram-bot` 的 HTTP 超时时间（秒）。 |
| `HERMES_TELEGRAM_HTTP_POOL_SIZE` | 与 Telegram API 的最大并发 HTTP 连接数。 |
| `HERMES_TELEGRAM_DISABLE_FALLBACK_IPS` | 禁用当 DNS 失败时使用的硬编码 Cloudflare 备用 IP（`true`/`false`）。 |
| `HERMES_DISCORD_TEXT_BATCH_DELAY_SECONDS` | 刷新排队的 Discord 文本块前的宽限期（默认：`0.6`）。 |
| `HERMES_DISCORD_TEXT_BATCH_SPLIT_DELAY_SECONDS` | 当 Discord 消息超过长度限制时，拆分块之间的延迟（默认：`2.0`）。 |
| `HERMES_MATRIX_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` | Matrix 的等效 Telegram 批处理旋钮。 |
| `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` / `_MAX_CHARS` / `_MAX_MESSAGES` | 飞书批处理器调优 — 延迟、拆分延迟、每条消息最大字符数、每批最大消息数。 |
| `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 飞书媒体刷新延迟。 |
| `HERMES_FEISHU_DEDUP_CACHE_SIZE` | 飞书 Webhook 去重缓存的大小（默认：`1024`）。 |
| `HERMES_WECOM_TEXT_BATCH_DELAY_SECONDS` / `_SPLIT_DELAY_SECONDS` | 企业微信批处理器调优。 |
| `HERMES_VISION_DOWNLOAD_TIMEOUT` | 在将图像交给视觉模型之前的下载超时时间（秒）（默认：`30`）。 |
| `HERMES_RESTART_DRAIN_TIMEOUT` | 网关：在 `/restart` 时强制重启前等待活动运行排空的时间（秒）（默认：`900`）。 |
| `HERMES_GATEWAY_PLATFORM_CONNECT_TIMEOUT` | 网关启动时每个平台的连接超时时间（秒）。 |
| `HERMES_GATEWAY_BUSY_INPUT_MODE` | 默认网关繁忙输入行为：`queue`、`steer` 或 `interrupt`。可通过 `/busy` 按聊天覆盖。 |
| `HERMES_GATEWAY_BUSY_ACK_ENABLED` | 当用户在智能体繁忙时发送输入，网关是否发送确认消息（⚡/⏳/⏩）（默认：`true`）。设置为 `false` 可完全抑制这些消息 — 输入仍按正常排队/引导/中断，仅聊天回复被静音。从 `config.yaml` 中的 `display.busy_ack_enabled` 桥接而来。 |
| `HERMES_FILE_MUTATION_VERIFIER` | 启用每轮文件变更验证器脚注（默认：`true`）。启用时，Hermes 会附加一条通知，列出在本轮中失败且未被成功写入覆盖的任何 `write_file` / `patch` 调用。设置为 `0`、`false`、`no` 或 `off` 可抑制。镜像 `config.yaml` 中的 `display.file_mutation_verifier`；设置环境变量时优先。 |
| `HERMES_CRON_TIMEOUT` | 定时任务智能体运行的空闲超时时间（秒）（默认：`600`）。当智能体在积极调用工具或接收流令牌时，可以无限期运行 — 仅在空闲时触发。设置为 `0` 表示无限制。 |
| `HERMES_CRON_SCRIPT_TIMEOUT` | 附加到定时任务的预运行脚本的超时时间（秒）（默认：`120`）。为需要更长执行时间的脚本覆盖（例如，用于防机器人的随机延迟）。也可通过 `config.yaml` 中的 `cron.script_timeout_seconds` 配置。 |
| `HERMES_CRON_MAX_PARALLEL` | 每个节拍并行运行的最大定时任务数（默认：`4`）。 |

## 智能体行为

| 变量 | 描述 |
|------|------|
| `HERMES_MAX_ITERATIONS` | 每次对话中工具调用的最大迭代次数（默认值：90） |
| `HERMES_INFERENCE_MODEL` | 在进程级别覆盖模型名称（优先级高于当前会话的 `config.yaml`）。也可通过 `-m`/`--model` 标志设置。 |
| `HERMES_YOLO_MODE` | 设置为 `1` 以跳过危险命令的确认提示。等效于 `--yolo`。 |
| `HERMES_ACCEPT_HOOKS` | 自动批准 `config.yaml` 中声明的任何未见过的 shell 钩子，无需 TTY 提示。等效于 `--accept-hooks` 或 `hooks_auto_accept: true`。 |
| `HERMES_IGNORE_USER_CONFIG` | 跳过 `~/.hermes/config.yaml` 并使用内置默认值（`.env` 中的凭据仍会加载）。等效于 `--ignore-user-config`。 |
| `HERMES_IGNORE_RULES` | 跳过 `AGENTS.md`、`SOUL.md`、`.cursorrules`、记忆和预加载技能的自动注入。等效于 `--ignore-rules`。 |
| `HERMES_MD_NAMES` | 以逗号分隔的规则文件名列表，用于自动注入（默认值：`AGENTS.md,CLAUDE.md,.cursorrules,SOUL.md`）。 |
| `HERMES_TOOL_PROGRESS` | 用于工具进度显示的已弃用兼容性变量。推荐使用 `config.yaml` 中的 `display.tool_progress`。 |
| `HERMES_TOOL_PROGRESS_MODE` | 用于工具进度模式的已弃用兼容性变量。推荐使用 `config.yaml` 中的 `display.tool_progress`。 |
| `HERMES_HUMAN_DELAY_MODE` | 响应节奏：`off`/`natural`/`custom` |
| `HERMES_HUMAN_DELAY_MIN_MS` | 自定义延迟范围最小值（毫秒） |
| `HERMES_HUMAN_DELAY_MAX_MS` | 自定义延迟范围最大值（毫秒） |
| `HERMES_QUIET` | 抑制非必要输出（`true`/`false`） |
| `CODEX_HOME` | 当启用 [Codex 应用服务器运行时](../user-guide/features/codex-app-server-runtime) 时，覆盖 Codex CLI 读取其配置和身份验证的目录（默认值：`~/.codex`）。Hermes 的迁移会将托管块写入 `<CODEX_HOME>/config.toml`。 |
| `HERMES_KANBAN_TASK` | 由看板调度器在生成工作进程时设置（任务 UUID）。工作进程和生成的 `hermes-tools` MCP 子进程会继承此变量，以便看板工具正确进行门控。请勿手动设置。 |
| `HERMES_API_TIMEOUT` | LLM API 调用超时时间（秒）（默认值：`1800`） |
| `HERMES_API_CALL_STALE_TIMEOUT` | 非流式陈旧调用超时时间（秒）（默认值：`300`）。对于本地提供程序，如果未设置则自动禁用。也可通过 `config.yaml` 中的 `providers.<id>.stale_timeout_seconds` 或 `providers.<id>.models.<model>.stale_timeout_seconds` 进行配置。 |
| `HERMES_STREAM_READ_TIMEOUT` | 流式套接字读取超时时间（秒）（默认值：`120`）。对于本地提供程序，会自动增加到 `HERMES_API_TIMEOUT`。如果本地 LLM 在长时间代码生成期间超时，请增加此值。 |
| `HERMES_STREAM_STALE_TIMEOUT` | 陈旧流检测超时时间（秒）（默认值：`180`）。对于本地提供程序自动禁用。如果在此时间窗口内没有接收到任何数据块，将触发连接终止。 |
| `HERMES_STREAM_RETRIES` | 在瞬态网络错误时尝试中流重连的次数（默认值：`3`）。 |
| `HERMES_AGENT_TIMEOUT` | 网关对运行中智能体的不活动超时时间（秒）（默认值：`900`）。每次工具调用和流式传输的标记都会重置此计时器。设置为 `0` 可禁用。 |
| `HERMES_AGENT_TIMEOUT_WARNING` | 网关：在不活动达到此秒数后发送警告消息（默认值：`HERMES_AGENT_TIMEOUT` 的 75%）。 |
| `HERMES_AGENT_NOTIFY_INTERVAL` | 网关：长时间运行的智能体轮次中进度通知之间的间隔（秒）。 |
| `HERMES_CHECKPOINT_TIMEOUT` | 文件系统检查点创建的超时时间（秒）（默认值：`30`）。 |
| `HERMES_EXEC_ASK` | 在网关模式下启用执行批准提示（`true`/`false`） |
| `HERMES_ENABLE_PROJECT_PLUGINS` | 启用从 `./.hermes/plugins/` 自动发现仓库本地插件，适用于智能体加载器和仪表板 Web 服务器。接受标准的真值集合：`1` / `true` / `yes` / `on`（不区分大小写）。其他所有值——包括 `0`、`false`、`no`、`off` 和空字符串——都被视为**禁用**（默认值）。注意：自 GHSA-5qr3-c538-wm9j (#29156) 起，即使启用了此变量，仪表板 Web 服务器也会拒绝自动导入项目插件的 Python `api` 文件——项目插件可以通过静态 JS/CSS 扩展 UI，但它们的后端路由只有在移动到 `~/.hermes/plugins/` 下时才会加载。 |
| `HERMES_PLUGINS_DEBUG` | `1`/`true` 可在 stderr 上显示详细的插件发现日志——扫描的目录、解析的清单、跳过的原因以及解析或 `register()` 失败时的完整回溯。面向插件作者。 |
| `HERMES_BACKGROUND_NOTIFICATIONS` | 网关中后台进程的通知模式：`all`（默认），`result`，`error`，`off` |
| `HERMES_EPHEMERAL_SYSTEM_PROMPT` | 在 API 调用时注入的临时系统提示（永不持久化到会话中） |
| `HERMES_PREFILL_MESSAGES_FILE` | 临时预填充消息的 JSON 文件路径，在 API 调用时注入。 |
| `HERMES_ALLOW_PRIVATE_URLS` | `true`/`false` — 允许工具获取 localhost/私有网络 URL。在网关模式下默认关闭。 |
| `HERMES_REDACT_SECRETS` | `true`/`false` — 控制工具输出、日志和聊天响应中的密钥编辑（默认值：`true`）。 |
| `HERMES_WRITE_SAFE_ROOT` | 可选的目录前缀，用于限制 `write_file`/`patch` 写入；超出此路径的写入需要批准。 |
| `HERMES_DISABLE_FILE_STATE_GUARD` | 设置为 `1` 可关闭对 `patch`/`write_file` 的“文件自你上次读取后已更改”保护。 |
| `HERMES_CORE_TOOLS` | 覆盖标准核心工具列表的逗号分隔值（高级；很少需要）。 |
| `HERMES_BUNDLED_SKILLS` | 覆盖启动时加载的内置技能列表的逗号分隔值。 |
| `HERMES_OPTIONAL_SKILLS` | 首次运行时自动安装的可选技能名称的逗号分隔列表。 |
| `HERMES_DEBUG_INTERRUPT` | 设置为 `1` 可将详细的中断/取消跟踪记录到 `agent.log`。 |
| `HERMES_DUMP_REQUESTS` | 将 API 请求有效负载转储到日志文件（`true`/`false`） |
| `HERMES_DUMP_REQUEST_STDOUT` | 将 API 请求有效负载转储到标准输出而不是日志文件。 |
| `HERMES_OAUTH_TRACE` | 设置为 `1` 可记录 OAuth 令牌交换和刷新尝试。包含已编辑的时序信息。 |
| `HERMES_OAUTH_FILE` | 覆盖用于 OAuth 凭据存储的路径（默认值：`~/.hermes/auth.json`）。 |
| `HERMES_AGENT_HELP_GUIDANCE` | 向自定义部署的系统提示追加额外的指导文本。 |
| `HERMES_AGENT_LOGO` | 覆盖 CLI 启动时的 ASCII 横幅徽标。 |
| `DELEGATION_MAX_CONCURRENT_CHILDREN` | 每个 `delegate_task` 批次中最大的并行子智能体数量（默认值：`3`，最小为 1，无上限）。也可通过 `config.yaml` 中的 `delegation.max_concurrent_children` 配置——配置值优先级更高。 |

## 接口

| 变量 | 描述 |
|------|------|
| `HERMES_TUI` | 设置为 `1` 时启动 [TUI](../user-guide/tui.md) 而不是经典 CLI。等同于传递 `--tui` 参数。 |
| `HERMES_TUI_DIR` | 预构建的 `ui-tui/` 目录的路径（必须包含 `dist/entry.js` 和已填充的 `node_modules`）。发行版和 Nix 使用此选项跳过首次启动时的 `npm install`。 |
| `HERMES_TUI_RESUME` | 启动时通过 ID 恢复特定的 TUI 会话。设置后，`hermes --tui` 会跳过创建新会话，转而使用指定的命名会话——这在断开连接或终端崩溃后重新连接时非常有用。 |
| `HERMES_TUI_THEME` | 强制指定 TUI 颜色主题：`light`、`dark` 或原始的 6 位背景十六进制颜色值（例如 `ffffff` 或 `1a1a2e`）。未设置时，Hermes 使用 `COLORFGBG` 和终端背景查询进行自动检测；此变量覆盖了那些不设置 `COLORFGBG` 的终端（如 Ghostty、Warp、iTerm2 等）的检测结果。 |
| `HERMES_INFERENCE_MODEL` | 强制指定 `hermes -z` / `hermes chat` 使用的模型，而无需修改 `config.yaml`。与 `--provider` 标志配合使用。适用于需要为每次运行覆盖默认模型的脚本调用程序（如清理器、CI、批量运行器）。 |

## 会话设置

| 变量 | 描述 |
|------|------|
| `SESSION_IDLE_MINUTES` | N 分钟不活动后重置会话（默认值：1440） |
| `SESSION_RESET_HOUR` | 每日重置小时，24 小时制（默认值：4 = 凌晨 4 点） |
| `HERMES_SESSION_ID` | **自动导出到 Hermes 生成的每个工具子进程中**（包括 `terminal`、`execute_code`、持久化 shell、Docker/Singularity 后端、委托的子智能体运行）。由智能体设置为当前会话 ID；从工具中调用的用户脚本可以读取它，以将其输出、遥测或副作用与发起的 Hermes 会话关联起来。**您不应手动设置此变量** —— 从父 shell 覆盖它仅在智能体运行之外生效，并且在智能体启动会话时会被覆盖。 |

## 上下文压缩（仅限 config.yaml）

上下文压缩完全通过 `config.yaml` 配置——没有相应的环境变量。阈值设置位于 `compression:` 块下，而摘要模型/提供商则位于 `auxiliary.compression:` 下。

```yaml
compression:
  enabled: true
  threshold: 0.50
  target_ratio: 0.20         # 保留为近期尾部的比例，相对于阈值
  protect_last_n: 20         # 保持未压缩的最少近期消息数
```

:::info 遗留迁移
包含 `compression.summary_model`、`compression.summary_provider` 和 `compression.summary_base_url` 的旧配置会在首次加载时自动迁移到 `auxiliary.compression.*`。
:::

## 辅助任务覆盖

| 变量 | 描述 |
|------|------|
| `AUXILIARY_VISION_PROVIDER` | 覆盖视觉任务的提供商 |
| `AUXILIARY_VISION_MODEL` | 覆盖视觉任务的模型 |
| `AUXILIARY_VISION_BASE_URL` | 用于视觉任务的直接 OpenAI 兼容端点 |
| `AUXILIARY_VISION_API_KEY` | 与 `AUXILIARY_VISION_BASE_URL` 配对的 API 密钥 |
| `AUXILIARY_WEB_EXTRACT_PROVIDER` | 覆盖网页提取/摘要的提供商 |
| `AUXILIARY_WEB_EXTRACT_MODEL` | 覆盖网页提取/摘要的模型 |
| `AUXILIARY_WEB_EXTRACT_BASE_URL` | 用于网页提取/摘要的直接 OpenAI 兼容端点 |
| `AUXILIARY_WEB_EXTRACT_API_KEY` | 与 `AUXILIARY_WEB_EXTRACT_BASE_URL` 配对的 API 密钥 |

对于特定任务的直接端点，Hermes 使用该任务配置的 API 密钥或 `OPENAI_API_KEY`。它不会为这些自定义端点重复使用 `OPENROUTER_API_KEY`。

## 回退提供商（仅限 config.yaml）

主模型的回退链完全通过 `config.yaml` 配置——没有相应的环境变量。添加一个包含 `provider` 和 `model` 键的顶级 `fallback_providers` 列表，即可在主模型遇到错误时启用自动故障转移。

```yaml
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
```

旧版的顶级 `fallback_model` 单提供商形式仍可向后兼容读取，但新配置应使用 `fallback_providers`。

完整详情请参阅[回退提供商](/user-guide/features/fallback-providers)。

## 提供商路由（仅限 config.yaml）

这些配置位于 `~/.hermes/config.yaml` 的 `provider_routing` 部分下：

| 键 | 描述 |
|----|------|
| `sort` | 排序提供商：`"price"` (默认)、`"throughput"` 或 `"latency"` |
| `only` | 允许的提供商标识列表（例如 `["anthropic", "google"]`） |
| `ignore` | 要跳过的提供商标识列表 |
| `order` | 按顺序尝试的提供商标识列表 |
| `require_parameters` | 仅使用支持所有请求参数的提供商 (`true`/`false`) |
| `data_collection` | `"allow"` (默认) 或 `"deny"` 以排除存储数据的提供商 |

:::tip
使用 `hermes config set` 来设置环境变量——它会自动将变量保存到正确的文件（密钥存入 `.env`，其他所有配置存入 `config.yaml`）。
:::