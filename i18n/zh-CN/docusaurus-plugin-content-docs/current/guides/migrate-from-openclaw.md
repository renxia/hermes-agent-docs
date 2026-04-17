---
sidebar_position: 10
title: "从 OpenClaw 迁移"
description: "OpenClaw / Clawdbot 设置迁移到 Hermes Agent 的完整指南 — 哪些内容会被迁移、配置映射以及迁移后需要检查哪些内容。"
---

# 从 OpenClaw 迁移

`hermes claw migrate` 将您的 OpenClaw（或旧版 Clawdbot/Moldbot）设置导入到 Hermes。本指南详细介绍了哪些内容会被迁移、配置键的映射关系以及迁移后需要验证的内容。

## 快速开始

```bash
# 预览并迁移（总是先显示预览，然后要求确认）
hermes claw migrate

# 仅预览，不进行任何更改
hermes claw migrate --dry-run

# 完整迁移，包括 API 密钥，跳过确认
hermes claw migrate --preset full --yes
```

迁移过程在进行任何更改之前，总是会显示完整的预览。请审阅列表，然后确认以继续。

默认从 `~/.openclaw/` 读取。旧版 `~/.clawdbot/` 或 `~/.moltbot/` 目录会自动检测。旧版配置文件名（`clawdbot.json`、`moltbot.json`）也适用。

## 选项

| 选项 | 描述 |
|--------|-------------|
| `--dry-run` | 仅预览 — 在显示将要迁移的内容后停止。 |
| `--preset <name>` | `full`（默认，包含密钥）或 `user-data`（排除 API 密钥）。 |
| `--overwrite` | 解决冲突时覆盖现有 Hermes 文件（默认：跳过）。 |
| `--migrate-secrets` | 包含 API 密钥（默认与 `--preset full` 一起启用）。 |
| `--source <path>` | 自定义 OpenClaw 目录。 |
| `--workspace-target <path>` | `AGENTS.md` 的放置位置。 |
| `--skill-conflict <mode>` | `skip`（默认）、`overwrite` 或 `rename`。 |
| `--yes` | 跳过预览后的确认提示。 |

## 哪些内容会被迁移

### 人设、记忆和指令

| 内容 | OpenClaw 源 | Hermes 目标 | 备注 |
|------|----------------|-------------------|-------|
| 人设 (Persona) | `workspace/SOUL.md` | `~/.hermes/SOUL.md` | 直接复制 |
| 工作区指令 | `workspace/AGENTS.md` | `--workspace-target` 中的 `AGENTS.md` | 需要 `--workspace-target` 标志 |
| 长期记忆 | `workspace/MEMORY.md` | `~/.hermes/memories/MEMORY.md` | 解析为条目，与现有内容合并，去重。使用 `§` 分隔符。 |
| 用户资料 | `workspace/USER.md` | `~/.hermes/memories/USER.md` | 与记忆相同的条目合并逻辑。 |
| 日常记忆文件 | `workspace/memory/*.md` | `~/.hermes/memories/MEMORY.md` | 所有日常文件合并到主记忆中。 |

工作区文件还会检查 `workspace.default/` 和 `workspace-main/` 作为备用路径（OpenClaw 在最近版本中将 `workspace/` 重命名为 `workspace-main/`，并使用 `workspace-{agentId}` 处理多智能体设置）。

### 技能 (4 个来源)

| 来源 | OpenClaw 位置 | Hermes 目标 |
|--------|------------------|-------------------|
| 工作区技能 | `workspace/skills/` | `~/.hermes/skills/openclaw-imports/` |
| 管理/共享技能 | `~/.openclaw/skills/` | `~/.hermes/skills/openclaw-imports/` |
| 个人跨项目技能 | `~/.agents/skills/` | `~/.hermes/skills/openclaw-imports/` |
| 项目级共享技能 | `workspace/.agents/skills/` | `~/.hermes/skills/openclaw-imports/` |

技能冲突由 `--skill-conflict` 处理：`skip` 保留现有的 Hermes 技能，`overwrite` 替换它，`rename` 创建一个 `-imported` 副本。

### 模型和提供商配置

| 内容 | OpenClaw 配置路径 | Hermes 目标 | 备注 |
|------|---------------------|-------------------|-------|
| 默认模型 | `agents.defaults.model` | `config.yaml` → `model` | 可以是字符串或 `{primary, fallbacks}` 对象 |
| 自定义提供商 | `models.providers.*` | `config.yaml` → `custom_providers` | 映射 `baseUrl`，`apiType`/`api` — 支持短格式（"openai", "anthropic"）和连字符格式（"openai-completions", "anthropic-messages", "google-generative-ai"）的值 |
| 提供商 API 密钥 | `models.providers.*.apiKey` | `~/.hermes/.env` | 需要 `--migrate-secrets`。详情请参阅 [API 密钥解析](#api-key-resolution) 部分。 |

### 智能体行为

| 内容 | OpenClaw 配置路径 | Hermes 配置路径 | 映射关系 |
|------|---------------------|-------------------|---------|
| 最大轮次 | `agents.defaults.timeoutSeconds` | `agent.max_turns` | `timeoutSeconds / 10`，上限为 200 |
| 详细模式 | `agents.defaults.verboseDefault` | `agent.verbose` | "off" / "on" / "full" |
| 推理努力度 | `agents.defaults.thinkingDefault` | `agent.reasoning_effort` | "always"/"high"/"xhigh" → "high"，"auto"/"medium"/"adaptive" → "medium"，"off"/"low"/"none"/"minimal" → "low" |
| 压缩 | `agents.defaults.compaction.mode` | `compression.enabled` | "off" → false，其他任何值 → true |
| 压缩模型 | `agents.defaults.compaction.model` | `compression.summary_model` | 直接字符串复制 |
| 人类延迟 | `agents.defaults.humanDelay.mode` | `human_delay.mode` | "natural" / "custom" / "off" |
| 人类延迟时间 | `agents.defaults.humanDelay.minMs` / `.maxMs` | `human_delay.min_ms` / `.max_ms` | 直接复制 |
| 时区 | `agents.defaults.userTimezone` | `timezone` | 直接字符串复制 |
| 执行超时 | `tools.exec.timeoutSec` | `terminal.timeout` | 直接复制（字段为 `timeoutSec`，而非 `timeout`） |
| Docker 沙箱 | `agents.defaults.sandbox.backend` | `terminal.backend` | "docker" → "docker" |
| Docker 镜像 | `agents.defaults.sandbox.docker.image` | `terminal.docker_image` | 直接复制 |

### 会话重置策略

| OpenClaw 配置路径 | Hermes 配置路径 | 备注 |
|---------------------|-------------------|-------|
| `session.reset.mode` | `session_reset.mode` | "daily"（每日）、"idle"（空闲）或两者 |
| `session.reset.atHour` | `session_reset.at_hour` | 每日重置的小时数（0–23） |
| `session.reset.idleMinutes` | `session_reset.idle_minutes` | 不活跃的分钟数 |

注意：OpenClaw 还有一个 `session.resetTriggers`（一个简单的字符串数组，如 `["daily", "idle"]`）。如果未设置结构化的 `session.reset`，迁移将回退到从 `resetTriggers` 推断。

### MCP 服务器

| OpenClaw 字段 | Hermes 字段 | 备注 |
|----------------|-------------|-------|
| `mcp.servers.*.command` | `mcp_servers.*.command` | Stdio 传输 |
| `mcp.servers.*.args` | `mcp_servers.*.args` | |
| `mcp.servers.*.env` | `mcp_servers.*.env` | |
| `mcp.servers.*.cwd` | `mcp_servers.*.cwd` | |
| `mcp.servers.*.url` | `mcp_servers.*.url` | HTTP/SSE 传输 |
| `mcp.servers.*.tools.include` | `mcp_servers.*.tools.include` | 工具过滤 |
| `mcp.servers.*.tools.exclude` | `mcp_servers.*.tools.exclude` | |

### TTS（文本转语音）

TTS 设置从 **两个** OpenClaw 配置位置读取，优先级如下：

1. `messages.tts.providers.{provider}.*`（标准位置）
2. 顶层 `talk.providers.{provider}.*`（备用）
3. 旧版扁平键 `messages.tts.{provider}.*`（最旧格式）

| 内容 | Hermes 目标 |
|------|-------------------|
| 提供商名称 | `config.yaml` → `tts.provider` |
| ElevenLabs 语音 ID | `config.yaml` → `tts.elevenlabs.voice_id` |
| ElevenLabs 模型 ID | `config.yaml` → `tts.elevenlabs.model_id` |
| OpenAI 模型 | `config.yaml` → `tts.openai.model` |
| OpenAI 语音 | `config.yaml` → `tts.openai.voice` |
| Edge TTS 语音 | `config.yaml` → `tts.edge.voice` (OpenClaw 将 "edge" 重命名为 "microsoft" — 两者都支持) |
| TTS 资源 | `~/.hermes/tts/` (文件复制) |

### 消息平台

| 平台 | OpenClaw 配置路径 | Hermes `.env` 变量 | 备注 |
|----------|---------------------|----------------------|-------|
| Telegram | `channels.telegram.botToken` 或 `.accounts.default.botToken` | `TELEGRAM_BOT_TOKEN` | Token 可以是字符串或 [SecretRef](#secretref-handling)。支持扁平和 accounts 布局。 |
| Telegram | `credentials/telegram-default-allowFrom.json` | `TELEGRAM_ALLOWED_USERS` | 从 `allowFrom[]` 数组逗号连接而成 |
| Discord | `channels.discord.token` 或 `.accounts.default.token` | `DISCORD_BOT_TOKEN` | |
| Discord | `channels.discord.allowFrom` 或 `.accounts.default.allowFrom` | `DISCORD_ALLOWED_USERS` | |
| Slack | `channels.slack.botToken` 或 `.accounts.default.botToken` | `SLACK_BOT_TOKEN` | |
| Slack | `channels.slack.appToken` 或 `.accounts.default.appToken` | `SLACK_APP_TOKEN` | |
| Slack | `channels.slack.allowFrom` 或 `.accounts.default.allowFrom` | `SLACK_ALLOWED_USERS` | |
| WhatsApp | `channels.whatsapp.allowFrom` 或 `.accounts.default.allowFrom` | `WHATSAPP_ALLOWED_USERS` | 通过 Baileys QR 配对进行认证 — 迁移后需要重新配对 |
| Signal | `channels.signal.account` 或 `.accounts.default.account` | `SIGNAL_ACCOUNT` | |
| Signal | `channels.signal.httpUrl` 或 `.accounts.default.httpUrl` | `SIGNAL_HTTP_URL` | |
| Signal | `channels.signal.allowFrom` 或 `.accounts.default.allowFrom` | `SIGNAL_ALLOWED_USERS` | |
| Matrix | `channels.matrix.accessToken` 或 `.accounts.default.accessToken` | `MATRIX_ACCESS_TOKEN` | 使用 `accessToken`（而非 `botToken`） |
| Mattermost | `channels.mattermost.botToken` 或 `.accounts.default.botToken` | `MATTERMOST_BOT_TOKEN` | |

### 其他配置

| 内容 | OpenClaw 路径 | Hermes 路径 | 备注 |
|------|-------------|-------------|-------|
| 审批模式 | `approvals.exec.mode` | `config.yaml` → `approvals.mode` | "auto"→"off", "always"→"manual", "smart"→"smart" |
| 命令白名单 | `exec-approvals.json` | `config.yaml` → `command_allowlist` | 模式合并并去重 |
| 浏览器 CDP URL | `browser.cdpUrl` | `config.yaml` → `browser.cdp_url` | |
| 浏览器无头模式 | `browser.headless` | `config.yaml` → `browser.headless` | |
| Brave 搜索密钥 | `tools.web.search.brave.apiKey` | `.env` → `BRAVE_API_KEY` | 需要 `--migrate-secrets` |
| 网关认证 Token | `gateway.auth.token` | `.env` → `HERMES_GATEWAY_TOKEN` | 需要 `--migrate-secrets` |
| 工作目录 | `agents.defaults.workspace` | `.env` → `MESSAGING_CWD` | |

### 已归档（无直接 Hermes 等效项）

这些内容将保存到 `~/.hermes/migration/openclaw/<timestamp>/archive/`，供手动审查：

| 内容 | 归档文件 | 如何在 Hermes 中重建 |
|------|-------------|--------------------------|
| `IDENTITY.md` | `archive/workspace/IDENTITY.md` | 合并到 `SOUL.md` |
| `TOOLS.md` | `archive/workspace/TOOLS.md` | Hermes 内置了工具指令 |
| `HEARTBEAT.md` | `archive/workspace/HEARTBEAT.md` | 使用 cron job 进行周期性任务 |
| `BOOTSTRAP.md` | `archive/workspace/BOOTSTRAP.md` | 使用上下文文件或技能 |
| Cron 任务 | `archive/cron-config.json` | 使用 `hermes cron create` 重建 |
| 插件 | `archive/plugins-config.json` | 参见 [插件指南](/docs/user-guide/features/hooks) |
| Hooks/Webhooks | `archive/hooks-config.json` | 使用 `hermes webhook` 或网关 Hooks |
| 记忆后端 | `archive/memory-backend-config.json` | 通过 `hermes honcho` 配置 |
| 技能注册表 | `archive/skills-registry-config.json` | 使用 `hermes skills config` |
| UI/身份 | `archive/ui-identity-config.json` | 使用 `/skin` 命令 |
| 日志记录 | `archive/logging-diagnostics-config.json` | 在 `config.yaml` 的日志部分设置 |
| 多智能体列表 | `archive/agents-list.json` | 使用 Hermes 配置文件 |
| 通道绑定 | `archive/bindings.json` | 每个平台手动设置 |
| 复杂通道 | `archive/channels-deep-config.json` | 手动平台配置 |

## API 密钥解析

当启用 `--migrate-secrets` 时，API 密钥将按以下优先级从 **四个来源** 收集：

1. **配置值** — `models.providers.*.apiKey` 和 `openclaw.json` 中的 TTS 提供商密钥
2. **环境变量文件** — `~/.openclaw/.env`（如 `OPENROUTER_API_KEY`、`ANTHROPIC_API_KEY` 等）
3. **配置环境子对象** — `openclaw.json` → `"env"` 或 `"env"."vars"`（某些设置将密钥存储在这里，而不是单独的 `.env` 文件）
4. **认证配置文件** — `~/.openclaw/agents/main/agent/auth-profiles.json`（每个智能体凭证）

配置值具有最高优先级。后续的来源会填充任何剩余的空缺。

### 支持的密钥目标

`OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `ZAI_API_KEY`, `MINIMAX_API_KEY`, `ELEVENLABS_API_KEY`, `TELEGRAM_BOT_TOKEN`, `VOICE_TOOLS_OPENAI_KEY`

不在此白名单中的密钥绝不会被复制。

## SecretRef 处理

OpenClaw 配置值中的 Token 和 API 密钥可以是三种格式：

```json
// 纯字符串
"channels": { "telegram": { "botToken": "123456:ABC-DEF..." } }

// 环境变量模板
"channels": { "telegram": { "botToken": "${TELEGRAM_BOT_TOKEN}" } }

// SecretRef 对象
"channels": { "telegram": { "botToken": { "source": "env", "id": "TELEGRAM_BOT_TOKEN" } } }
```

迁移会解析所有这三种格式。对于 `source: "env"` 的环境变量模板和 SecretRef 对象，它会在 `~/.openclaw/.env` 和 `openclaw.json` 的 env 子对象中查找值。`source: "file"` 或 `source: "exec"` 的 SecretRef 对象无法自动解析 — 迁移会警告这些值，并且必须通过 `hermes config set` 手动添加到 Hermes 中。

## 迁移后

1. **检查迁移报告** — 在完成时打印，包含已迁移、跳过和冲突项目的计数。

2. **审阅归档文件** — `~/.hermes/migration/openclaw/<timestamp>/archive/` 中的任何内容都需要手动关注。

3. **启动新会话** — 导入的技能和记忆条目只在新的会话中生效，不影响当前会话。

4. **验证 API 密钥** — 运行 `hermes status` 检查提供商认证。

5. **测试消息传递** — 如果您迁移了平台 Token，请重启网关：`systemctl --user restart hermes-gateway`

6. **检查会话策略** — 验证 `hermes config get session_reset` 是否符合您的预期。

7. **重新配对 WhatsApp** — WhatsApp 使用 QR 码配对（Baileys），而非 Token 迁移。运行 `hermes whatsapp` 进行配对。

8. **归档清理** — 确认所有功能正常后，运行 `hermes claw cleanup` 将残留的 OpenClaw 目录重命名为 `.pre-migration/`（防止状态混淆）。

## 故障排除

### "未找到 OpenClaw 目录"

迁移会依次检查 `~/.openclaw/`、`~/.clawdbot/`，然后是 `~/.moltbot/`。如果您的安装位置不同，请使用 `--source /path/to/your/openclaw`。

### "未找到提供商 API 密钥"

密钥可能存储在多个位置，具体取决于您的 OpenClaw 版本：内嵌在 `openclaw.json` 的 `models.providers.*.apiKey` 下，在 `~/.openclaw/.env` 中，在 `openclaw.json` 的 `"env"` 子对象中，或在 `agents/main/agent/auth-profiles.json` 中。迁移会检查所有四个位置。如果密钥使用 `source: "file"` 或 `source: "exec"` SecretRef，则无法自动解析 — 请使用 `hermes config set` 添加它们。

### 技能未在迁移后出现

导入的技能会放置在 `~/.hermes/skills/openclaw-imports/`。请启动新会话使其生效，或运行 `/skills` 验证它们是否已加载。

### TTS 语音未迁移

OpenClaw 在两个位置存储 TTS 设置：`messages.tts.providers.*` 和顶层的 `talk` 配置。迁移会检查两者。如果您的语音 ID 是通过 OpenClaw UI 设置的（存储在不同路径），您可能需要手动设置：`hermes config set tts.elevenlabs.voice_id YOUR_VOICE_ID`