---
sidebar_position: 2
title: "环境变量"
description: "Hermes Agent 使用的所有环境变量完整参考"
---

# 环境变量参考

所有变量都应放在 `~/.hermes/.env` 中。您也可以使用 `hermes config set VAR value` 进行设置。

## LLM 提供商

| 变量 | 描述 |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API 密钥（推荐用于灵活性） |
| `OPENROUTER_BASE_URL` | 覆盖兼容 OpenRouter 的基础 URL |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway API 密钥 ([ai-gateway.vercel.sh](https://ai-gateway.vercel.sh)) |
| `AI_GATEWAY_BASE_URL` | 覆盖 AI Gateway 基础 URL（默认为：`https://ai-gateway.vercel.sh/v1`） |
| `OPENAI_API_KEY` | 用于自定义 OpenAI 兼容端点的 API 密钥（与 `OPENAI_BASE_URL` 配合使用） |
| `OPENAI_BASE_URL` | 自定义端点的基础 URL（例如 VLLM, SGLang 等） |
| `COPILOT_GITHUB_TOKEN` | Copilot API 的 GitHub 令牌 — 最高优先级（OAuth `gho_*` 或细粒度 PAT `github_pat_*`；经典 PAT `ghp_*` **不支持**） |
| `GH_TOKEN` | GitHub 令牌 — Copilot 的第二优先级（也用于 `gh` CLI） |
| `GITHUB_TOKEN` | GitHub 令牌 — Copilot 的第三优先级 |
| `HERMES_COPILOT_ACP_COMMAND` | 覆盖 Copilot ACP CLI 二进制文件路径（默认为：`copilot`） |
| `COPILOT_CLI_PATH` | `HERMES_COPILOT_ACP_COMMAND` 的别名 |
| `HERMES_COPILOT_ACP_ARGS` | 覆盖 Copilot ACP 参数（默认为：`--acp --stdio`） |
| `COPILOT_ACP_BASE_URL` | 覆盖 Copilot ACP 基础 URL |
| `GLM_API_KEY` | z.ai / 智谱AI GLM API 密钥 ([z.ai](https://z.ai)) |
| `ZAI_API_KEY` | `GLM_API_KEY` 的别名 |
| `Z_AI_API_KEY` | `GLM_API_KEY` 的别名 |
| `GLM_BASE_URL` | 覆盖 z.ai 基础 URL（默认为：`https://api.z.ai/api/paas/v4`） |
| `KIMI_API_KEY` | Kimi / Moonshot AI API 密钥 ([moonshot.ai](https://platform.moonshot.ai)) |
| `KIMI_BASE_URL` | 覆盖 Kimi 基础 URL（默认为：`https://api.moonshot.ai/v1`） |
| `KIMI_CN_API_KEY` | Kimi / Moonshot 中国 API 密钥 ([moonshot.cn](https://platform.moonshot.cn)) |
| `ARCEEAI_API_KEY` | Arcee AI API 密钥 ([chat.arcee.ai](https://chat.arcee.ai/)) |
| `ARCEE_BASE_URL` | 覆盖 Arcee 基础 URL（默认为：`https://api.arcee.ai/api/v1`） |
| `MINIMAX_API_KEY` | MiniMax API 密钥 — 全局端点 ([minimax.io](https://www.minimax.io)) |
| `MINIMAX_BASE_URL` | 覆盖 MiniMax 基础 URL（默认为：`https://api.minimax.io/v1`） |
| `MINIMAX_CN_API_KEY` | MiniMax API 密钥 — 中国端点 ([minimaxi.com](https://www.minimaxi.com)) |
| `MINIMAX_CN_BASE_URL` | 覆盖 MiniMax 中国基础 URL（默认为：`https://api.minimaxi.com/v1`） |
| `KILOCODE_API_KEY` | Kilo Code API 密钥 ([kilo.ai](https://kilo.ai)) |
| `KILOCODE_BASE_URL` | 覆盖 Kilo Code 基础 URL（默认为：`https://api.kilo.ai/api/gateway`） |
| `XIAOMI_API_KEY` | 小米 MiMo API 密钥 ([platform.xiaomimimo.com](https://platform.xiaomimimo.com)) |
| `XIAOMI_BASE_URL` | 覆盖小米 MiMo 基础 URL（默认为：`https://api.xiaomimimo.com/v1`） |
| `HF_TOKEN` | Hugging Face 推理提供商的令牌 ([huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)) |
| `HF_BASE_URL` | 覆盖 Hugging Face 基础 URL（默认为：`https://router.huggingface.co/v1`） |
| `GOOGLE_API_KEY` | Google AI Studio API 密钥 ([aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)) |
| `GEMINI_API_KEY` | `GOOGLE_API_KEY` 的别名 |
| `GEMINI_BASE_URL` | 覆盖 Google AI Studio 基础 URL |
| `HERMES_GEMINI_CLIENT_ID` | `google-gemini-cli` PKCE 登录的 OAuth 客户端 ID（可选；默认为 Google 的公共 gemini-cli 客户端） |
| `HERMES_GEMINI_CLIENT_SECRET` | `google-gemini-cli` 的 OAuth 客户端密钥（可选） |
| `HERMES_GEMINI_PROJECT_ID` | 付费 Gemini 级别的 GCP 项目 ID（免费级别自动配置） |
| `ANTHROPIC_API_KEY` | Anthropic 控制台 API 密钥 ([console.anthropic.com](https://console.anthropic.com/)) |
| `ANTHROPIC_TOKEN` | 手动或遗留的 Anthropic OAuth/setup-token 覆盖 |
| `DASHSCOPE_API_KEY` | 阿里云 DashScope API 密钥，用于 Qwen 模型 ([modelstudio.console.alibabacloud.com](https://modelstudio.console.alibabacloud.com/)) |
| `DASHSCOPE_BASE_URL` | 自定义 DashScope 基础 URL（默认为：`https://coding-intl.dashscope.aliyuncs.com/v1`） |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥，用于直接访问 DeepSeek ([platform.deepseek.com](https://platform.deepseek.com/api_keys)) |
| `DEEPSEEK_BASE_URL` | 自定义 DeepSeek API 基础 URL |
| `OPENCODE_ZEN_API_KEY` | OpenCode Zen API 密钥 — 按使用付费，用于精选模型 ([opencode.ai](https://opencode.ai/auth)) |
| `OPENCODE_ZEN_BASE_URL` | 覆盖 OpenCode Zen 基础 URL |
| `OPENCODE_GO_API_KEY` | OpenCode Go API 密钥 — 开源模型每月 10 美元订阅 ([opencode.ai](https://opencode.ai/auth)) |
| `OPENCODE_GO_BASE_URL` | 覆盖 OpenCode Go 基础 URL |
| `CLAUDE_CODE_OAUTH_TOKEN` | 如果手动导出，用于显式覆盖 Claude Code 令牌 |
| `HERMES_MODEL` | 覆盖进程级别的模型名称（由 cron 调度器使用；正常使用请使用 `config.yaml`） |
| `VOICE_TOOLS_OPENAI_KEY` | 用于 OpenAI 语音转文本和文本转语音提供商的首选 OpenAI 密钥 |
| `HERMES_LOCAL_STT_COMMAND` | 可选的本地语音转文本命令模板。支持 `{input_path}`、`{output_dir}`、`{language}` 和 `{model}` 占位符 |
| `HERMES_LOCAL_STT_LANGUAGE` | 传递给 `HERMES_LOCAL_STT_COMMAND` 的默认语言，或本地 `whisper` CLI 的自动检测回退（默认为：`en`） |
| `HERMES_HOME` | 覆盖 Hermes 配置目录（默认为：`~/.hermes`）。它还限定了网关 PID 文件和 systemd 服务名称，因此可以并发运行多个实例 |

## 提供商认证（OAuth）

对于原生的 Anthropic 认证，如果存在，Hermes 倾向于使用 Claude Code 自身的凭证文件，因为这些凭证可以自动刷新。像 `ANTHROPIC_TOKEN` 这样的环境变量仍然作为手动覆盖有用，但它们不再是登录 Claude Pro/Max 的首选路径。

| 变量 | 描述 |
|----------|-------------|
| `HERMES_INFERENCE_PROVIDER` | 覆盖提供商选择：`auto`, `openrouter`, `nous`, `openai-codex`, `copilot`, `copilot-acp`, `anthropic`, `huggingface`, `zai`, `kimi-coding`, `kimi-coding-cn`, `minimax`, `minimax-cn`, `kilocode`, `xiaomi`, `arcee`, `alibaba`, `deepseek`, `opencode-zen`, `opencode-go`, `ai-gateway`（默认为：`auto`） |
| `HERMES_PORTAL_BASE_URL` | 覆盖 Nous Portal URL（用于开发/测试） |
| `NOUS_INFERENCE_BASE_URL` | 覆盖 Nous 推理 API URL |
| `HERMES_NOUS_MIN_KEY_TTL_SECONDS` | 最小代理密钥在重新生成前的 TTL 秒数（默认为：1800 = 30分钟） |
| `HERMES_NOUS_TIMEOUT_SECONDS` | Nous 凭证/令牌流程的 HTTP 超时时间 |
| `HERMES_DUMP_REQUESTS` | 是否将 API 请求负载转储到日志文件（`true`/`false`） |
| `HERMES_PREFILL_MESSAGES_FILE` | 临时预填充消息 JSON 文件的路径，该消息在 API 调用时注入 |
| `HERMES_TIMEZONE` | IANA 时区覆盖（例如 `America/New_York`） |

## 工具 API

| 变量 | 描述 |
|----------|-------------|
| `PARALLEL_API_KEY` | AI 原生网络搜索 ([parallel.ai](https://parallel.ai/)) |
| `FIRECRAWL_API_KEY` | 网络爬取和云浏览器 ([firecrawl.dev](https://firecrawl.dev/)) |
| `FIRECRAWL_API_URL` | 用于自托管实例的自定义 Firecrawl API 端点（可选） |
| `TAVILY_API_KEY` | Tavily API 密钥，用于 AI 原生网络搜索、提取和爬取 ([app.tavily.com](https://app.tavily.com/home)) |
| `EXA_API_KEY` | Exa API 密钥，用于 AI 原生网络搜索和内容 ([exa.ai](https://exa.ai/)) |
| `BROWSERBASE_API_KEY` | 浏览器自动化 ([browserbase.com](https://browserbase.com/)) |
| `BROWSERBASE_PROJECT_ID` | Browserbase 项目 ID |
| `BROWSER_USE_API_KEY` | Browser Use 云浏览器 API 密钥 ([browser-use.com](https://browser-use.com/)) |
| `FIRECRAWL_BROWSER_TTL` | Firecrawl 浏览器会话 TTL 秒数（默认为：300） |
| `BROWSER_CDP_URL` | 本地浏览器的 Chrome DevTools Protocol URL（通过 `/browser connect` 设置，例如 `ws://localhost:9222`） |
| `CAMOFOX_URL` | Camofox 本地反检测浏览器 URL（默认为：`http://localhost:9377`） |
| `BROWSER_INACTIVITY_TIMEOUT` | 浏览器会话不活动超时秒数 |
| `FAL_KEY` | 图像生成 ([fal.ai](https://fal.ai/)) |
| `GROQ_API_KEY` | Groq Whisper STT API 密钥 ([groq.com](https://groq.com/)) |
| `ELEVENLABS_API_KEY` | ElevenLabs 高级 TTS 语音 ([elevenlabs.io](https://elevenlabs.io/)) |
| `STT_GROQ_MODEL` | 覆盖 Groq STT 模型（默认为：`whisper-large-v3-turbo`） |
| `GROQ_BASE_URL` | 覆盖 Groq OpenAI 兼容 STT 端点 |
| `STT_OPENAI_MODEL` | 覆盖 OpenAI STT 模型（默认为：`whisper-1`） |
| `STT_OPENAI_BASE_URL` | 覆盖 OpenAI 兼容 STT 端点 |
| `GITHUB_TOKEN` | Skills Hub 的 GitHub 令牌（更高的 API 速率限制，用于技能发布） |
| `HONCHO_API_KEY` | 跨会话用户建模 ([honcho.dev](https://honcho.dev/)) |
| `HONCHO_BASE_URL` | 自托管 Honcho 实例的基础 URL（默认为：Honcho cloud）。本地实例无需 API 密钥 |
| `SUPERMEMORY_API_KEY` | 具有配置文件召回和会话摄取语义长期记忆 ([supermemory.ai](https://supermemory.ai)) |
| `TINKER_API_KEY` | RL 训练 ([tinker-console.thinkingmachines.ai](https://tinker-console.thinkingmachines.ai/)) |
| `WANDB_API_KEY` | RL 训练指标 ([wandb.ai](https://wandb.ai/)) |
| `DAYTONA_API_KEY` | Daytona 云沙箱 ([daytona.io](https://daytona.io/)) |

### Nous 工具网关

这些变量用于配置付费 Nous 订阅者或自托管网关部署的 [工具网关](/docs/user-guide/features/tool-gateway)。大多数用户无需设置这些变量——网关通过 `hermes model` 或 `hermes tools` 自动配置。

| 变量 | 描述 |
|----------|-------------|
| `TOOL_GATEWAY_DOMAIN` | 工具网关路由的基础域名（默认为：`nousresearch.com`） |
| `TOOL_GATEWAY_SCHEME` | 网关 URL 的 HTTP 或 HTTPS 方案（默认为：`https`） |
| `TOOL_GATEWAY_USER_TOKEN` | 工具网关的认证令牌（通常从 Nous 认证中自动填充） |
| `FIRECRAWL_GATEWAY_URL` | 专门用于 Firecrawl 网关端点的覆盖 URL |

## 终端后端

| 变量 | 描述 |
|----------|-------------|
| `TERMINAL_ENV` | 后端：`local`, `docker`, `ssh`, `singularity`, `modal`, `daytona` |
| `TERMINAL_DOCKER_IMAGE` | Docker 镜像（默认为：`nikolaik/python-nodejs:python3.11-nodejs20`） |
| `TERMINAL_DOCKER_FORWARD_ENV` | JSON 数组，用于显式转发到 Docker 终端会话的环境变量名称。注意：技能声明的 `required_environment_variables` 会自动转发——您只需要为未由任何技能声明的变量设置此项。 |
| `TERMINAL_DOCKER_VOLUMES` | 额外的 Docker 卷挂载（逗号分隔的 `host:container` 对） |
| `TERMINAL_DOCKER_MOUNT_CWD_TO_WORKSPACE` | 高级可选：将启动的当前工作目录挂载到 Docker 的 `/workspace` (`true`/`false`，默认为：`false`) |
| `TERMINAL_SINGULARITY_IMAGE` | Singularity 镜像或 `.sif` 路径 |
| `TERMINAL_MODAL_IMAGE` | Modal 容器镜像 |
| `TERMINAL_DAYTONA_IMAGE` | Daytona 沙箱镜像 |
| `TERMINAL_TIMEOUT` | 命令超时秒数 |
| `TERMINAL_LIFETIME_SECONDS` | 终端会话的最大生命周期秒数 |
| `TERMINAL_CWD` | 所有终端会话的工作目录 |
| `SUDO_PASSWORD` | 启用无需交互提示的 sudo |

对于云沙箱后端，持久性是基于文件系统的。`TERMINAL_LIFETIME_SECONDS` 控制 Hermes 何时清理空闲的终端会话，后续恢复可能会重建沙箱，而不是保持相同的实时进程运行。

## SSH 后端

| 变量 | 描述 |
|----------|-------------|
| `TERMINAL_SSH_HOST` | 远程服务器主机名 |
| `TERMINAL_SSH_USER` | SSH 用户名 |
| `TERMINAL_SSH_PORT` | SSH 端口（默认为：22） |
| `TERMINAL_SSH_KEY` | 私钥路径 |
| `TERMINAL_SSH_PERSISTENT` | 覆盖 SSH 的持久化 Shell（默认为：遵循 `TERMINAL_PERSISTENT_SHELL`） |

## 容器资源（Docker, Singularity, Modal, Daytona）

| 变量 | 描述 |
|----------|-------------|
| `TERMINAL_CONTAINER_CPU` | CPU 核心数（默认为：1） |
| `TERMINAL_CONTAINER_MEMORY` | 内存（MB）（默认为：5120） |
| `TERMINAL_CONTAINER_DISK` | 磁盘空间（MB）（默认为：51200） |
| `TERMINAL_CONTAINER_PERSISTENT` | 是否跨会话持久化容器文件系统（默认为：`true`） |
| `TERMINAL_SANDBOX_DIR` | 工作区和覆盖层的宿主目录（默认为：`~/.hermes/sandboxes/`） |

## 持久化 Shell

| 变量 | 描述 |
|----------|-------------|
| `TERMINAL_PERSISTENT_SHELL` | 启用非本地后端的持久化 Shell（默认为：`true`）。也可以通过 `config.yaml` 中的 `terminal.persistent_shell` 设置。 |
| `TERMINAL_LOCAL_PERSISTENT` | 启用本地后端的持久化 Shell（默认为：`false`） |
| `TERMINAL_SSH_PERSISTENT` | 覆盖 SSH 后端的持久化 Shell（默认为：遵循 `TERMINAL_PERSISTENT_SHELL`） |

## 消息传递

| 变量 | 描述 |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot 令牌（来自 @BotFather） |
| `TELEGRAM_ALLOWED_USERS` | 允许使用 bot 的逗号分隔用户 ID |
| `TELEGRAM_HOME_CHANNEL` | cron 投递的默认 Telegram 聊天/频道 |
| `TELEGRAM_HOME_CHANNEL_NAME` | Telegram 首页频道的显示名称 |
| `TELEGRAM_WEBHOOK_URL` | Webhook 模式的公共 HTTPS URL（启用 Webhook 而非轮询） |
| `TELEGRAM_WEBHOOK_PORT` | Webhook 服务器的本地监听端口（默认为：`8443`） |
| `TELEGRAM_WEBHOOK_SECRET` | 用于验证来自 Telegram 的更新的密钥令牌 |
| `TELEGRAM_REACTIONS` | 在处理过程中是否启用消息表情符号反应（默认为：`false`） |
| `TELEGRAM_IGNORED_THREADS` | 逗号分隔的 Telegram 论坛主题/线程 ID，bot 绝不回复这些主题 |
| `TELEGRAM_PROXY` | Telegram 连接的代理 URL — 覆盖 `HTTPS_PROXY`。支持 `http://`、`https://`、`socks5://` |
| `DISCORD_BOT_TOKEN` | Discord bot 令牌 |
| `DISCORD_ALLOWED_USERS` | 允许使用 bot 的逗号分隔 Discord 用户 ID |
| `DISCORD_HOME_CHANNEL` | cron 投递的默认 Discord 频道 |
| `DISCORD_HOME_CHANNEL_NAME` | Discord 首页频道的显示名称 |
| `DISCORD_REQUIRE_MENTION` | 在服务器频道中回复前是否需要 @提及（默认：`true`）。设置为 `false` 则回复所有消息。 |
| `DISCORD_FREE_RESPONSE_CHANNELS` | 不需要提及的逗号分隔频道 ID |
| `DISCORD_AUTO_THREAD` | 自动为长回复创建线程（如果支持） |
| `DISCORD_REACTIONS` | 在处理过程中是否启用消息表情符号反应（默认为：`true`） |
| `DISCORD_IGNORED_CHANNELS` | 逗号分隔的频道 ID，bot 绝不回复这些频道 |
| `DISCORD_NO_THREAD_CHANNELS` | 逗号分隔的频道 ID，bot 在不自动创建线程的情况下回复 |
| `DISCORD_REPLY_TO_MODE` | 回复引用行为：`off`、`first`（默认）或 `all` |
| `SLACK_BOT_TOKEN` | Slack bot 令牌（`xoxb-...`） |
| `SLACK_APP_TOKEN` | Slack 应用级别令牌（`xapp-...`，Socket Mode 所需） |
| `SLACK_ALLOWED_USERS` | 逗号分隔的 Slack 用户 ID |
| `SLACK_HOME_CHANNEL` | cron 投递的默认 Slack 频道 |
| `SLACK_HOME_CHANNEL_NAME` | Slack 首页频道的显示名称 |
| `WHATSAPP_ENABLED` | 是否启用 WhatsApp 网桥（`true`/`false`） |
| `WHATSAPP_MODE` | `bot`（独立号码）或 `self-chat`（给自己发送消息） |
| `WHATSAPP_ALLOWED_USERS` | 逗号分隔的电话号码（带国家代码，不带 `+`），或 `*` 允许所有发送者 |
| `WHATSAPP_ALLOW_ALL_USERS` | 是否允许所有 WhatsApp 发送者，无需白名单（`true`/`false`） |
| `WHATSAPP_DEBUG` | 是否在网桥中记录原始消息事件用于故障排除（`true`/`false`） |
| `SIGNAL_HTTP_URL` | signal-cli 守护进程 HTTP 端点（例如 `http://127.0.0.1:8080`） |
| `SIGNAL_ACCOUNT` | E.164 格式的 bot 电话号码 |
| `SIGNAL_ALLOWED_USERS` | 逗号分隔的 E.164 电话号码或 UUID |
| `SIGNAL_GROUP_ALLOWED_USERS` | 逗号分隔的群组 ID，或 `*` 代表所有群组 |
| `SIGNAL_HOME_CHANNEL_NAME` | Signal 首页频道的显示名称 |
| `SIGNAL_IGNORE_STORIES` | 是否忽略 Signal 故事/状态更新 |
| `SIGNAL_ALLOW_ALL_USERS` | 是否允许所有 Signal 用户，无需白名单 |
| `TWILIO_ACCOUNT_SID` | Twilio 账户 SID（与电话技能共享） |
| `TWILIO_AUTH_TOKEN` | Twilio 认证令牌（与电话技能共享；也用于 Webhook 签名验证） |
| `TWILIO_PHONE_NUMBER` | Twilio 电话号码（E.164 格式，与电话技能共享） |
| `SMS_WEBHOOK_URL` | 用于 Twilio 签名验证的公共 URL — 必须与 Twilio 控制台中的 Webhook URL 匹配（必需） |
| `SMS_WEBHOOK_PORT` | 接收入站 SMS 的 Webhook 监听端口（默认为：`8080`） |
| `SMS_WEBHOOK_HOST` | Webhook 绑定地址（默认为：`0.0.0.0`） |
| `SMS_INSECURE_NO_SIGNATURE` | 设置为 `true` 可禁用 Twilio 签名验证（仅限本地开发 — 不适用于生产环境） |
| `SMS_ALLOWED_USERS` | 允许聊天发送的逗号分隔 E.164 电话号码 |
| `SMS_ALLOW_ALL_USERS` | 是否允许所有 SMS 发送者，无需白名单 |
| `SMS_HOME_CHANNEL` | cron 任务/通知投递的电话号码 |
| `SMS_HOME_CHANNEL_NAME` | SMS 首页频道的显示名称 |
| `EMAIL_ADDRESS` | 邮件网关适配器的电子邮件地址 |
| `EMAIL_PASSWORD` | 电子邮件账户的密码或应用密码 |
| `EMAIL_IMAP_HOST` | 邮件适配器的 IMAP 主机名 |
| `EMAIL_IMAP_PORT` | IMAP 端口 |
| `EMAIL_SMTP_HOST` | 邮件适配器的 SMTP 主机名 |
| `EMAIL_SMTP_PORT` | SMTP 端口 |
| `EMAIL_ALLOWED_USERS` | 允许向 bot 发送消息的逗号分隔电子邮件地址 |
| `EMAIL_HOME_ADDRESS` | 主动邮件投递的默认收件人 |
| `EMAIL_HOME_ADDRESS_NAME` | 邮件首页目标的显示名称 |
| `EMAIL_POLL_INTERVAL` | 邮件轮询间隔秒数 |
| `EMAIL_ALLOW_ALL_USERS` | 是否允许所有入站电子邮件发送者 |
| `DINGTALK_CLIENT_ID` | 来自开发者门户的 DingTalk bot AppKey ([open.dingtalk.com](https://open.dingtalk.com)) |
| `DINGTALK_CLIENT_SECRET` | 来自开发者门户的 DingTalk bot AppSecret |
| `DINGTALK_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔 DingTalk 用户 ID |
| `FEISHU_APP_ID` | 来自 [open.feishu.cn](https://open.feishu.cn/) 的 Feishu/Lark bot App ID |
| `FEISHU_APP_SECRET` | Feishu/Lark bot App Secret |
| `FEISHU_DOMAIN` | `feishu`（中国）或 `lark`（国际）。默认为：`feishu` |
| `FEISHU_CONNECTION_MODE` | `websocket`（推荐）或 `webhook`。默认为：`websocket` |
| `FEISHU_ENCRYPT_KEY` | Webhook 模式的可选加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | Webhook 模式的可选验证令牌 |
| `FEISHU_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔 Feishu 用户 ID |
| `FEISHU_HOME_CHANNEL` | cron 投递和通知的 Feishu 聊天 ID |
| `WECOM_BOT_ID` | 来自管理员控制台的 WeCom AI Bot ID |
| `WECOM_SECRET` | WeCom AI Bot 密钥 |
| `WECOM_WEBSOCKET_URL` | 自定义 WebSocket URL（默认为：`wss://openws.work.weixin.qq.com`） |
| `WECOM_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔 WeCom 用户 ID |
| `WECOM_HOME_CHANNEL` | cron 投递和通知的 WeCom 聊天 ID |
| `WECOM_CALLBACK_CORP_ID` | 用于回调自建应用的 WeCom 企业 Corp ID |
| `WECOM_CALLBACK_CORP_SECRET` | 自建应用的 Corp 密钥 |
| `WECOM_CALLBACK_AGENT_ID` | 自建应用的 Agent ID |
| `WECOM_CALLBACK_TOKEN` | 回调验证令牌 |
| `WECOM_CALLBACK_ENCODING_AES_KEY` | 回调加密的 AES 密钥 |
| `WECOM_CALLBACK_HOST` | 回调服务器绑定地址（默认为：`0.0.0.0`） |
| `WECOM_CALLBACK_PORT` | 回调服务器端口（默认为：`8645`） |
| `WECOM_CALLBACK_ALLOWED_USERS` | 白名单的逗号分隔用户 ID |
| `WECOM_CALLBACK_ALLOW_ALL_USERS` | 设置为 `true` 可允许所有用户，无需白名单 |
| `WEIXIN_ACCOUNT_ID` | 通过 iLink Bot API 的二维码登录获取的微信账号 ID |
| `WEIXIN_TOKEN` | 通过 iLink Bot API 的二维码登录获取的微信认证令牌 |
| `WEIXIN_BASE_URL` | 覆盖微信 iLink Bot API 基础 URL（默认为：`https://ilinkai.weixin.qq.com`） |
| `WEIXIN_CDN_BASE_URL` | 覆盖微信媒体的 CDN 基础 URL（默认为：`https://novac2c.cdn.weixin.qq.com/c2c`） |
| `WEIXIN_DM_POLICY` | 私信策略：`open`、`allowlist`、`pairing`、`disabled`（默认为：`open`） |
| `WEIXIN_GROUP_POLICY` | 群消息策略：`open`、`allowlist`、`disabled`（默认为：`disabled`） |
| `WEIXIN_ALLOWED_USERS` | 允许私信 bot 的逗号分隔微信用户 ID |
| `WEIXIN_GROUP_ALLOWED_USERS` | 允许与 bot 交互的逗号分隔微信群组 ID |
| `WEIXIN_HOME_CHANNEL` | cron 投递和通知的微信聊天 ID |
| `WEIXIN_HOME_CHANNEL_NAME` | 微信首页频道的显示名称 |
| `WEIXIN_ALLOW_ALL_USERS` | 是否允许所有微信用户，无需白名单（`true`/`false`） |
| `BLUEBUBBLES_SERVER_URL` | BlueBubbles 服务器 URL（例如：`http://192.168.1.10:1234`） |
| `BLUEBUBBLES_PASSWORD` | BlueBubbles 服务器密码 |
| `BLUEBUBBLES_WEBHOOK_HOST` | Webhook 监听绑定地址（默认为：`127.0.0.1`） |
| `BLUEBUBBLES_WEBHOOK_PORT` | Webhook 监听端口（默认为：`8645`） |
| `BLUEBUBBLES_HOME_CHANNEL` | cron/通知投递的电话/电子邮件 |
| `BLUEBUBBLES_ALLOWED_USERS` | 逗号分隔的授权用户 |
| `BLUEBUBBLES_ALLOW_ALL_USERS` | 是否允许所有用户（`true`/`false`） |
| `QQ_APP_ID` | 来自 [q.qq.com](https://q.qq.com) 的 QQ Bot App ID |
| `QQ_CLIENT_SECRET` | 来自 [q.qq.com](https://q.qq.com) 的 QQ Bot App Secret |
| `QQ_STT_API_KEY` | 外部 STT 回退提供商的 API 密钥（可选，当 QQ 内置 ASR 未返回文本时使用） |
| `QQ_STT_BASE_URL` | 外部 STT 提供商的基础 URL（可选） |
| `QQ_STT_MODEL` | 外部 STT 提供商的模型名称（可选） |
| `QQ_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔 QQ 用户 openID |
| `QQ_GROUP_ALLOWED_USERS` | 用于群组 @消息访问的逗号分隔 QQ 群组 ID |
| `QQ_ALLOW_ALL_USERS` | 是否允许所有用户（`true`/`false`，覆盖 `QQ_ALLOWED_USERS`） |
| `QQ_HOME_CHANNEL` | cron 投递和通知的 QQ 用户/群组 openID |
| `MATTERMOST_URL` | Mattermost 服务器 URL（例如：`https://mm.example.com`） |
| `MATTERMOST_TOKEN` | Mattermost 的 bot 令牌或个人访问令牌 |
| `MATTERMOST_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔 Mattermost 用户 ID |
| `MATTERMOST_HOME_CHANNEL` | 用于主动消息投递（cron、通知）的频道 ID |
| `MATTERMOST_REQUIRE_MENTION` | 频道中是否需要 @提及（默认为：`true`）。设置为 `false` 则回复所有消息。 |
| `MATTERMOST_FREE_RESPONSE_CHANNELS` | 不需要 @提及的逗号分隔频道 ID |
| `MATTERMOST_REPLY_MODE` | 回复样式：`thread`（线程回复）或 `off`（扁平消息，默认为：`off`） |
| `MATRIX_HOMESERVER` | Matrix homeserver URL（例如：`https://matrix.org`） |
| `MATRIX_ACCESS_TOKEN` | Matrix bot 认证访问令牌 |
| `MATRIX_USER_ID` | Matrix 用户 ID（例如：`@hermes:matrix.org`）— 密码登录必需，使用访问令牌可选 |
| `MATRIX_PASSWORD` | Matrix 密码（访问令牌的替代方案） |
| `MATRIX_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔 Matrix 用户 ID（例如：`@alice:matrix.org`） |
| `MATRIX_HOME_ROOM` | 用于主动消息投递的房间 ID（例如：`!abc123:matrix.org`） |
| `MATRIX_ENCRYPTION` | 是否启用端到端加密（`true`/`false`，默认为：`false`） |
| `MATRIX_REQUIRE_MENTION` | 房间中是否需要 @提及（默认为：`true`）。设置为 `false` 则回复所有消息。 |
| `MATRIX_FREE_RESPONSE_ROOMS` | 不需要 @提及的逗号分隔房间 ID |
| `MATRIX_AUTO_THREAD` | 是否自动为房间消息创建线程（默认为：`true`） |
| `MATRIX_DM_MENTION_THREADS` | 在 DM 中被 @提及时是否创建线程（默认为：`false`） |
| `MATRIX_RECOVERY_KEY` | 设备密钥轮换后进行交叉签名的恢复密钥。推荐用于启用了交叉签名的 E2EE 设置。 |
| `HASS_TOKEN` | Home Assistant 长效访问令牌（启用 HA 平台 + 工具） |
| `HASS_URL` | Home Assistant URL（默认为：`http://homeassistant.local:8123`） |
| `WEBHOOK_ENABLED` | 是否启用 Webhook 平台适配器（`true`/`false`） |
| `WEBHOOK_PORT` | 接收 Webhook 的 HTTP 服务器端口（默认为：`8644`） |
| `WEBHOOK_SECRET` | 全局 HMAC 密钥，用于 Webhook 签名验证（作为路由未指定时使用的回退） |
| `API_SERVER_ENABLED` | 是否启用 OpenAI 兼容的 API 服务器（`true`/`false`）。与其他平台并行运行。 |
| `API_SERVER_KEY` | API 服务器认证的 Bearer 令牌。强制要求非回环绑定。 |
| `API_SERVER_CORS_ORIGINS` | 允许直接调用 API 服务器的逗号分隔浏览器源（例如 `http://localhost:3000,http://127.0.0.1:3000`）。默认为：禁用。 |
| `API_SERVER_PORT` | API 服务器端口（默认为：`8642`） |
| `API_SERVER_HOST` | API 服务器的主机/绑定地址（默认为：`127.0.0.1`）。使用 `0.0.0.0` 进行网络访问 — 需要 `API_SERVER_KEY` 和严格的 `API_SERVER_CORS_ORIGINS` 白名单。 |
| `API_SERVER_MODEL_NAME` | 在 `/v1/models` 上公布的模型名称。默认为配置文件名称（或默认配置的 `hermes-agent`）。对于需要为每个连接提供不同模型名称的多用户设置很有用，例如 Open WebUI。 |
| `GATEWAY_PROXY_URL` | 转发消息到远程 Hermes API 服务器的 URL ([代理模式](/docs/user-guide/messaging/matrix#proxy-mode-e2ee-on-macos))。设置后，网关仅处理平台 I/O — 所有代理工作都委托给远程服务器。也可以通过 `config.yaml` 中的 `gateway.proxy_url` 配置。 |
| `GATEWAY_PROXY_KEY` | 代理模式下与远程 API 服务器认证的 Bearer 令牌。必须与远程主机的 `API_SERVER_KEY` 匹配。 |
| `MESSAGING_CWD` | 消息模式下终端命令的工作目录（默认为：`~`） |
| `GATEWAY_ALLOWED_USERS` | 允许跨所有平台的逗号分隔用户 ID |
| `GATEWAY_ALLOW_ALL_USERS` | 是否允许所有用户，无需白名单（`true`/`false`，默认为：`false`） |

## 代理行为

| 变量 | 描述 |
|----------|-------------|
| `HERMES_MAX_ITERATIONS` | 每个对话的最大工具调用迭代次数（默认为：90） |
| `HERMES_TOOL_PROGRESS` | 废弃的工具进度显示兼容变量。推荐在 `config.yaml` 中使用 `display.tool_progress`。 |
| `HERMES_TOOL_PROGRESS_MODE` | 废弃的工具进度模式兼容变量。推荐在 `config.yaml` 中使用 `display.tool_progress`。 |
| `HERMES_HUMAN_DELAY_MODE` | 回复节奏：`off`/`natural`/`custom` |
| `HERMES_HUMAN_DELAY_MIN_MS` | 自定义延迟范围最小值（毫秒） |
| `HERMES_HUMAN_DELAY_MAX_MS` | 自定义延迟范围最大值（毫秒） |
| `HERMES_QUIET` | 抑制非必要的输出（`true`/`false`） |
| `HERMES_API_TIMEOUT` | LLM API 调用超时秒数（默认为：`1800`） |
| `HERMES_STREAM_READ_TIMEOUT` | 流式套接字读取超时秒数（默认为：`120`）。对于本地提供商会自动增加到 `HERMES_API_TIMEOUT`。如果本地 LLM 在长时间代码生成时超时，请增加此值。 |
| `HERMES_STREAM_STALE_TIMEOUT` | 陈旧流检测超时秒数（默认为：`180`）。对于本地提供商自动禁用。如果在该窗口内未收到数据块，将触发连接终止。 |
| `HERMES_EXEC_ASK` | 在网关模式下启用执行批准提示（`true`/`false`） |
| `HERMES_ENABLE_PROJECT_PLUGINS` | 启用从 `./.hermes/plugins/` 自动发现仓库本地插件（`true`/`false`，默认为：`false`） |
| `HERMES_BACKGROUND_NOTIFICATIONS` | 网关中的后台进程通知模式：`all`（默认）、`result`、`error`、`off` |
| `HERMES_EPHEMERAL_SYSTEM_PROMPT` | 在 API 调用时注入的临时系统提示（永不持久化到会话） |

## Cron 调度器

| 变量 | 描述 |
|----------|-------------|
| `HERMES_CRON_TIMEOUT` | Cron 任务代理运行的空闲超时秒数（默认为：`600`）。代理在主动调用工具或接收流令牌时可以无限期运行——这仅在空闲时触发。设置为 `0` 表示无限期。 |
| `HERMES_CRON_SCRIPT_TIMEOUT` | Cron 任务预运行脚本的超时秒数（默认为：`120`）。用于需要更长执行时间的脚本的覆盖（例如，用于反机器人计时的随机延迟）。也可以通过 `config.yaml` 中的 `cron.script_timeout_seconds` 配置。 |

## 会话设置

| 变量 | 描述 |
|----------|-------------|
| `SESSION_IDLE_MINUTES` | 空闲 N 分钟后重置会话（默认为：1440） |
| `SESSION_RESET_HOUR` | 每日重置小时（24 小时制）（默认为：4 = 上午 4 点） |

## 上下文压缩（仅限 config.yaml）

上下文压缩仅通过 `config.yaml` 配置——没有相应的环境变量。阈值设置位于 `compression:` 块中，而摘要模型/提供商位于 `auxiliary.compression:` 下。

```yaml
compression:
  enabled: true
  threshold: 0.50
  target_ratio: 0.20         # 需保留的阈值分数（作为近期尾部）
  protect_last_n: 20         # 最小保留未压缩的近期消息数
```

:::info 遗留迁移
带有 `compression.summary_model`、`compression.summary_provider` 和 `compression.summary_base_url` 的旧配置在首次加载时会自动迁移到 `auxiliary.compression.*`。
:::

## 辅助任务覆盖

| 变量 | 描述 |
|----------|-------------|
| `AUXILIARY_VISION_PROVIDER` | 视觉任务的提供商覆盖 |
| `AUXILIARY_VISION_MODEL` | 视觉任务的模型覆盖 |
| `AUXILIARY_VISION_BASE_URL` | 视觉任务的直接 OpenAI 兼容端点 |
| `AUXILIARY_VISION_API_KEY` | 与 `AUXILIARY_VISION_BASE_URL` 配对的 API 密钥 |
| `AUXILIARY_WEB_EXTRACT_PROVIDER` | 网络提取/摘要的提供商覆盖 |
| `AUXILIARY_WEB_EXTRACT_MODEL` | 网络提取/摘要的模型覆盖 |
| `AUXILIARY_WEB_EXTRACT_BASE_URL` | 网络提取/摘要的直接 OpenAI 兼容端点 |
| `AUXILIARY_WEB_EXTRACT_API_KEY` | 与 `AUXILIARY_WEB_EXTRACT_BASE_URL` 配对的 API 密钥 |

对于任务特定的直接端点，Hermes 使用任务配置的 API 密钥或 `OPENAI_API_KEY`。它不会为这些自定义端点重用 `OPENROUTER_API_KEY`。

## 故障模型（仅限 config.yaml）

主要的模型故障转移是通过 `config.yaml` 独家配置的——没有相应的环境变量。添加一个 `fallback_model` 部分，包含 `provider` 和 `model` 键，可以在主模型遇到错误时启用自动故障转移。

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

有关完整详细信息，请参阅 [故障转移提供商](/docs/user-guide/features/fallback-providers)。

## 提供商路由（仅限 config.yaml）

这些变量位于 `~/.hermes/config.yaml` 的 `provider_routing` 部分：

| Key | 描述 |
|-----|-------------|
| `sort` | 排序提供商：`"price"`（默认）、`"throughput"` 或 `"latency"` |
| `only` | 允许的提供商 slug 列表（例如：`["anthropic", "google"]`） |
| `ignore` | 要跳过的提供商 slug 列表 |
| `order` | 尝试的提供商 slug 顺序列表 |
| `require_parameters` | 是否仅使用支持所有请求参数的提供商（`true`/`false`） |
| `data_collection` | `"allow"`（默认）或 `"deny"`，用于排除存储数据的提供商 |

:::tip
使用 `hermes config set` 来设置环境变量——它会自动将它们保存到正确的配置文件中（秘密信息为 `.env`，其他所有内容为 `config.yaml`）。
:::