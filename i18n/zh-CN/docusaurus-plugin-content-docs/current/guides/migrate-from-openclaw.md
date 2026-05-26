---
sidebar_position: 10
title: "从 OpenClaw 迁移"
description: "将您的 OpenClaw / Clawdbot 设置迁移到 Hermes 智能体的完整指南 — 包括迁移内容、配置映射方式以及迁移后的检查要点。"
---

# 从 OpenClaw 迁移

`hermes claw migrate` 命令可将您的 OpenClaw（或旧版 Clawdbot/Moldbot）设置导入到 Hermes。本指南详细说明了哪些内容将被迁移、配置键的映射关系，以及迁移后需要验证的事项。

## 快速开始

```bash
# 先预览后迁移（总是先显示预览，然后要求确认）
hermes claw migrate

# 仅预览，不进行任何更改
hermes claw migrate --dry-run

# 执行完整迁移（包括 API 密钥），并跳过确认
hermes claw migrate --preset full --migrate-secrets --yes
```

迁移过程始终会在进行任何更改之前，显示一份完整的待导入内容预览。请仔细审阅列表内容，确认无误后再继续执行。

默认情况下，命令会读取 `~/.openclaw/` 目录。旧版的 `~/.clawdbot/` 或 `~/.moltbot/` 目录会被自动检测。同样，旧版配置文件名（如 `clawdbot.json`、`moltbot.json`）也会被自动识别。

| 选项 | 描述 |
|------|------|
| `--dry-run` | 仅预览 — 显示将迁移的内容后停止。 |
| `--preset <name>` | `full` (所有兼容设置) 或 `user-data` (不包括基础设施配置)。两个预设默认均不导入密钥 — 需显式传递 `--migrate-secrets`。 |
| `--overwrite` | 当存在冲突时，覆盖现有的 Hermes 文件（默认：计划存在冲突时拒绝应用）。 |
| `--migrate-secrets` | 包含 API 密钥。即使在 `--preset full` 下也需要显式传递 — 没有任何预设会静默导入密钥。 |
| `--no-backup` | 跳过迁移前对 `~/.hermes/` 的 zip 快照（默认在应用前会写入一个恢复点存档，位于 `~/.hermes/backups/pre-migration-*.zip`；可通过 `hermes import` 恢复）。 |
| `--source <path>` | 自定义的 OpenClaw 目录。 |
| `--workspace-target <path>` | 放置 `AGENTS.md` 的位置。 |
| `--skill-conflict <mode>` | `skip` (默认)，`overwrite`，或 `rename`。 |
| `--yes` | 跳过预览后的确认提示。 |

## 迁移内容

### 角色、记忆与指令

| 内容 | OpenClaw 来源 | Hermes 目标 | 备注 |
|------|---------------|-------------|------|
| 角色 | `workspace/SOUL.md` | `~/.hermes/SOUL.md` | 直接复制 |
| 工作区指令 | `workspace/AGENTS.md` | `AGENTS.md` 在 `--workspace-target` 指定的位置 | 需要 `--workspace-target` 标志 |
| 长期记忆 | `workspace/MEMORY.md` | `~/.hermes/memories/MEMORY.md` | 解析为条目，与现有内容合并，去重。使用 `§` 作为分隔符。 |
| 用户资料 | `workspace/USER.md` | `~/.hermes/memories/USER.md` | 与记忆相同的条目合并逻辑。 |
| 每日记忆文件 | `workspace/memory/*.md` | `~/.hermes/memories/MEMORY.md` | 所有每日文件合并到主记忆文件中。 |

工作区文件也会在 `workspace.default/` 和 `workspace-main/` 作为备用路径进行检查（OpenClaw 在最近版本中将 `workspace/` 重命名为 `workspace-main/`，并在多智能体设置中使用 `workspace-{agentId}`）。

### 技能 (4 个来源)

| 来源 | OpenClaw 位置 | Hermes 目标 |
|------|---------------|-------------|
| 工作区技能 | `workspace/skills/` | `~/.hermes/skills/openclaw-imports/` |
| 托管/共享技能 | `~/.openclaw/skills/` | `~/.hermes/skills/openclaw-imports/` |
| 个人跨项目技能 | `~/.agents/skills/` | `~/.hermes/skills/openclaw-imports/` |
| 项目级共享技能 | `workspace/.agents/skills/` | `~/.hermes/skills/openclaw-imports/` |

技能冲突由 `--skill-conflict` 处理：`skip` 保留现有的 Hermes 技能，`overwrite` 覆盖它，`rename` 创建一个 `-imported` 副本。

### 模型与提供商配置

| 内容 | OpenClaw 配置路径 | Hermes 目标 | 备注 |
|------|-------------------|-------------|------|
| 默认模型 | `agents.defaults.model` | `config.yaml` → `model` | 可以是字符串或 `{primary, fallbacks}` 对象 |
| 自定义提供商 | `models.providers.*` | `config.yaml` → `custom_providers` | 映射 `baseUrl`、`apiType`/`api` — 处理简短形式 ("openai", "anthropic") 和连字符形式 ("openai-completions", "anthropic-messages", "google-generative-ai") |
| 提供商 API 密钥 | `models.providers.*.apiKey` | `~/.hermes/.env` | 需要 `--migrate-secrets`。参见下方的 [API 密钥解析](#api-key-resolution)。 |

### 智能体行为

| 内容 | OpenClaw 配置路径 | Hermes 配置路径 | 映射 |
|------|-------------------|-----------------|------|
| 最大轮次 | `agents.defaults.timeoutSeconds` | `agent.max_turns` | `timeoutSeconds / 10`，上限为 200 |
| 详细模式 | `agents.defaults.verboseDefault` | `agent.verbose` | "off" / "on" / "full" |
| 推理强度 | `agents.defaults.thinkingDefault` | `agent.reasoning_effort` | "always"/"high"/"xhigh" → "high", "auto"/"medium"/"adaptive" → "medium", "off"/"low"/"none"/"minimal" → "low" |
| 压缩 | `agents.defaults.compaction.mode` | `compression.enabled` | "off" → false，其他 → true |
| 压缩模型 | `agents.defaults.compaction.model` | `compression.summary_model` | 直接字符串复制 |
| 人类延迟 | `agents.defaults.humanDelay.mode` | `human_delay.mode` | "natural" / "custom" / "off" |
| 人类延迟时间 | `agents.defaults.humanDelay.minMs` / `.maxMs` | `human_delay.min_ms` / `.max_ms` | 直接复制 |
| 时区 | `agents.defaults.userTimezone` | `timezone` | 直接字符串复制 |
| 执行超时 | `tools.exec.timeoutSec` | `terminal.timeout` | 直接复制（字段是 `timeoutSec`，不是 `timeout`） |
| Docker 沙箱 | `agents.defaults.sandbox.backend` | `terminal.backend` | "docker" → "docker" |
| Docker 镜像 | `agents.defaults.sandbox.docker.image` | `terminal.docker_image` | 直接复制 |

### 会话重置策略

| OpenClaw 配置路径 | Hermes 配置路径 | 备注 |
|-------------------|-----------------|------|
| `session.reset.mode` | `session_reset.mode` | "daily"、"idle" 或两者兼有 |
| `session.reset.atHour` | `session_reset.at_hour` | 每日重置的小时数 (0–23) |
| `session.reset.idleMinutes` | `session_reset.idle_minutes` | 不活动的分钟数 |

注意：OpenClaw 也有 `session.resetTriggers`（一个简单的字符串数组，如 `["daily", "idle"]`）。如果结构化的 `session.reset` 不存在，迁移将回退到从 `resetTriggers` 推断。

### MCP 服务器

| OpenClaw 字段 | Hermes 字段 | 备注 |
|---------------|-------------|------|
| `mcp.servers.*.command` | `mcp_servers.*.command` | Stdio 传输 |
| `mcp.servers.*.args` | `mcp_servers.*.args` | |
| `mcp.servers.*.env` | `mcp_servers.*.env` | |
| `mcp.servers.*.cwd` | `mcp_servers.*.cwd` | |
| `mcp.servers.*.url` | `mcp_servers.*.url` | HTTP/SSE 传输 |
| `mcp.servers.*.tools.include` | `mcp_servers.*.tools.include` | 工具过滤 |
| `mcp.servers.*.tools.exclude` | `mcp_servers.*.tools.exclude` | |

### TTS (文本转语音)

TTS 设置从**两个** OpenClaw 配置位置读取，优先级如下：

1. `messages.tts.providers.{provider}.*` (规范位置)
2. 顶层 `talk.providers.{provider}.*` (备用)
3. 旧版扁平键 `messages.tts.{provider}.*` (最旧格式)

| 内容 | Hermes 目标 |
|------|-------------|
| 提供商名称 | `config.yaml` → `tts.provider` |
| ElevenLabs 语音 ID | `config.yaml` → `tts.elevenlabs.voice_id` |
| ElevenLabs 模型 ID | `config.yaml` → `tts.elevenlabs.model_id` |
| OpenAI 模型 | `config.yaml` → `tts.openai.model` |
| OpenAI 语音 | `config.yaml` → `tts.openai.voice` |
| Edge TTS 语音 | `config.yaml` → `tts.edge.voice` (OpenClaw 将 "edge" 重命名为 "microsoft" — 两者均可识别) |
| TTS 资源 | `~/.hermes/tts/` (文件复制) |

### 消息平台

| 平台 | OpenClaw 配置路径 | Hermes `.env` 变量 | 备注 |
|------|-------------------|---------------------|------|
| Telegram | `channels.telegram.botToken` 或 `.accounts.default.botToken` | `TELEGRAM_BOT_TOKEN` | 令牌可以是字符串或 [SecretRef](#secretref-handling)。支持扁平和账户布局。 |
| Telegram | `credentials/telegram-default-allowFrom.json` | `TELEGRAM_ALLOWED_USERS` | 从 `allowFrom[]` 数组逗号连接 |
| Discord | `channels.discord.token` 或 `.accounts.default.token` | `DISCORD_BOT_TOKEN` | |
| Discord | `channels.discord.allowFrom` 或 `.accounts.default.allowFrom` | `DISCORD_ALLOWED_USERS` | |
| Slack | `channels.slack.botToken` 或 `.accounts.default.botToken` | `SLACK_BOT_TOKEN` | |
| Slack | `channels.slack.appToken` 或 `.accounts.default.appToken` | `SLACK_APP_TOKEN` | |
| Slack | `channels.slack.allowFrom` 或 `.accounts.default.allowFrom` | `SLACK_ALLOWED_USERS` | |
| WhatsApp | `channels.whatsapp.allowFrom` 或 `.accounts.default.allowFrom` | `WHATSAPP_ALLOWED_USERS` | 通过 Baileys QR 配对认证 — 迁移后需要重新配对 |
| Signal | `channels.signal.account` 或 `.accounts.default.account` | `SIGNAL_ACCOUNT` | |
| Signal | `channels.signal.httpUrl` 或 `.accounts.default.httpUrl` | `SIGNAL_HTTP_URL` | |
| Signal | `channels.signal.allowFrom` 或 `.accounts.default.allowFrom` | `SIGNAL_ALLOWED_USERS` | |
| Matrix | `channels.matrix.accessToken` 或 `.accounts.default.accessToken` | `MATRIX_ACCESS_TOKEN` | 使用 `accessToken` (不是 `botToken`) |
| Mattermost | `channels.mattermost.botToken` 或 `.accounts.default.botToken` | `MATTERMOST_BOT_TOKEN` | |

### 其他配置

| 内容 | OpenClaw 路径 | Hermes 路径 | 备注 |
|------|---------------|-------------|------|
| 审批模式 | `approvals.exec.mode` | `config.yaml` → `approvals.mode` | "auto"→"off", "always"→"manual", "smart"→"smart" |
| 命令允许列表 | `exec-approvals.json` | `config.yaml` → `command_allowlist` | 模式合并并去重 |
| 浏览器 CDP URL | `browser.cdpUrl` | `config.yaml` → `browser.cdp_url` | |
| 浏览器无头模式 | `browser.headless` | `config.yaml` → `browser.headless` | |
| Brave 搜索密钥 | `tools.web.search.brave.apiKey` | `.env` → `BRAVE_API_KEY` | 需要 `--migrate-secrets` |
| 网关认证令牌 | `gateway.auth.token` | `.env` → `HERMES_GATEWAY_TOKEN` | 需要 `--migrate-secrets` |
| 工作目录 | `agents.defaults.workspace` | `.env` → `MESSAGING_CWD` | |

### 已归档 (Hermes 无直接等效项)

这些内容被保存到 `~/.hermes/migration/openclaw/<timestamp>/archive/` 以供手动审查：

| 内容 | 归档文件 | 如何在 Hermes 中重新创建 |
|------|----------|--------------------------|
| `IDENTITY.md` | `archive/workspace/IDENTITY.md` | 合并到 `SOUL.md` |
| `TOOLS.md` | `archive/workspace/TOOLS.md` | Hermes 有内置工具指令 |
| `HEARTBEAT.md` | `archive/workspace/HEARTBEAT.md` | 使用定时任务处理周期性任务 |
| `BOOTSTRAP.md` | `archive/workspace/BOOTSTRAP.md` | 使用上下文文件或技能 |
| 定时任务 | `archive/cron-config.json` | 使用 `hermes cron create` 重新创建 |
| 插件 | `archive/plugins-config.json` | 参见 [插件指南](/user-guide/features/hooks) |
| 钩子/网页钩子 | `archive/hooks-config.json` | 使用 `hermes webhook` 或网关钩子 |
| 记忆后端 | `archive/memory-backend-config.json` | 通过 `hermes honcho` 配置 |
| 技能注册表 | `archive/skills-registry-config.json` | 使用 `hermes skills config` |
| 界面/身份 | `archive/ui-identity-config.json` | 使用 `/skin` 命令 |
| 日志记录 | `archive/logging-diagnostics-config.json` | 在 `config.yaml` 日志部分设置 |
| 多智能体列表 | `archive/agents-list.json` | 使用 Hermes 配置文件 |
| 频道绑定 | `archive/bindings.json` | 为每个平台手动设置 |
| 复杂频道 | `archive/channels-deep-config.json` | 手动平台配置 |

## API 密钥解析

当启用 `--migrate-secrets` 时，API 密钥会按优先级从**四个来源**收集：

1. **配置值** — `openclaw.json` 中的 `models.providers.*.apiKey` 和 TTS 提供商密钥
2. **环境文件** — `~/.openclaw/.env`（如 `OPENROUTER_API_KEY`、`ANTHROPIC_API_KEY` 等键名）
3. **配置环境子对象** — `openclaw.json` 中的 `"env"` 或 `"env"."vars"`（某些配置将密钥存储在此处，而非单独的 `.env` 文件）
4. **认证配置文件** — `~/.openclaw/agents/main/agent/auth-profiles.json`（每个智能体的凭据）

配置值具有最高优先级。后续来源会填补任何剩余的空白。

### 支持的密钥目标

`OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `ZAI_API_KEY`, `MINIMAX_API_KEY`, `ELEVENLABS_API_KEY`, `TELEGRAM_BOT_TOKEN`, `VOICE_TOOLS_OPENAI_KEY`

不在此允许列表中的密钥不会被复制。

## SecretRef 处理

OpenClaw 配置中的令牌和 API 密钥值可以有三种格式：

```json
// 纯字符串
"channels": { "telegram": { "botToken": "123456:ABC-DEF..." } }

// 环境变量模板
"channels": { "telegram": { "botToken": "${TELEGRAM_BOT_TOKEN}" } }

// SecretRef 对象
"channels": { "telegram": { "botToken": { "source": "env", "id": "TELEGRAM_BOT_TOKEN" } } }
```

迁移过程会解析所有三种格式。对于环境变量模板和 `source: "env"` 的 SecretRef 对象，它会在 `~/.openclaw/.env` 和 `openclaw.json` 的环境子对象中查找值。对于 `source: "file"` 或 `source: "exec"` 的 SecretRef 对象则无法自动解析 — 迁移会对此发出警告，这些值需要通过 `hermes config set` 手动添加到 Hermes。

## 迁移后

1.  **检查迁移报告** — 完成时会打印已迁移、已跳过和存在冲突的项目计数。

2.  **审阅归档文件** — `~/.hermes/migration/openclaw/<timestamp>/archive/` 中的任何内容都需要手动处理。

3.  **启动新会话** — 导入的技能和记忆条目在新会话中生效，而非当前会话。

4.  **验证 API 密钥** — 运行 `hermes status` 检查提供商认证状态。

5.  **测试消息传递** — 如果您迁移了平台令牌，请重启网关：`systemctl --user restart hermes-gateway`

6.  **检查会话策略** — 验证 `hermes config get session_reset` 是否符合您的预期。

7.  **重新配对 WhatsApp** — WhatsApp 使用二维码配对 (Baileys)，而非令牌迁移。请运行 `hermes whatsapp` 进行配对。

8.  **清理归档** — 确认一切正常后，运行 `hermes claw cleanup` 将剩余的 OpenClaw 目录重命名为 `.pre-migration/`（防止状态混淆）。

## 故障排除

### “未找到 OpenClaw 目录”

迁移会依次检查 `~/.openclaw/`、`~/.clawdbot/` 和 `~/.moltbot/`。如果您的安装在其他位置，请使用 `--source /path/to/your/openclaw`。

### “未找到提供商 API 密钥”

根据您的 OpenClaw 版本，密钥可能存储在多个位置：`openclaw.json` 中 `models.providers.*.apiKey` 的内联值、`~/.openclaw/.env`、`openclaw.json` 的 `"env"` 子对象，或 `agents/main/agent/auth-profiles.json`。迁移会检查所有四个位置。如果密钥使用 `source: "file"` 或 `source: "exec"` 的 SecretRef，则无法自动解析 — 请通过 `hermes config set` 添加它们。

### 迁移后技能未出现

导入的技能位于 `~/.hermes/skills/openclaw-imports/`。启动新会话以使其生效，或运行 `/skills` 以验证它们已加载。

### TTS 语音未迁移

OpenClaw 将 TTS 设置存储在两个位置：`messages.tts.providers.*` 和顶层 `talk` 配置。迁移会检查这两处。如果您的语音 ID 是通过 OpenClaw UI 设置的（存储在不同的路径），您可能需要手动设置：`hermes config set tts.elevenlabs.voice_id YOUR_VOICE_ID`。