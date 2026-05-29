---
title: "Hermes 智能体 — 配置、扩展或为 Hermes 智能体做贡献"
sidebar_label: "Hermes 智能体"
description: "配置、扩展或为 Hermes 智能体做贡献"
---

{/* 此页面由网站脚本 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Hermes 智能体

配置、扩展或为 Hermes 智能体做贡献。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/autonomous-ai-agents/hermes-agent` |
| 版本 | `2.1.0` |
| 作者 | Hermes Agent + Teknium |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `hermes`, `setup`, `configuration`, `multi-agent`, `spawning`, `cli`, `gateway`, `development` |
| 相关技能 | [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`opencode`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-opencode) |

```markdown
---
title: "Hermes 智能体 CLI 与集成指南"
description: "完整的 Hermes 智能体 CLI 参考、配置、平台集成与故障排除指南"
slug: "hermes-agent-cli"
---

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Hermes 智能体

Hermes 智能体是 Nous Research 推出的一个开源 AI 智能体框架，可在您的终端、消息平台和 IDE 中运行。它与 Claude Code（Anthropic）、Codex（OpenAI）和 OpenClaw 属于同一类别——即使用工具调用来与您的系统交互的自主编码和任务执行智能体。Hermes 支持任何 LLM 提供商（OpenRouter、Anthropic、OpenAI、DeepSeek、本地模型等 15 种以上），并可在 Linux、macOS 和 WSL 上运行。

Hermes 的与众不同之处：

- **通过技能实现自我改进** —— Hermes 通过将可重用的流程保存为技能来从经验中学习。当它解决了一个复杂问题、发现了一个工作流，或者被纠正时，它可以将这些知识持久化为技能文档，以便在未来的会话中加载。技能会随着时间积累，使智能体更擅长处理您的特定任务和环境。
- **跨会话持久化记忆** —— 记住您是谁、您的偏好、环境详情以及吸取的教训。可插拔的内存后端（内置、Honcho、Mem0 等）让您可以选择内存的工作方式。
- **多平台网关** —— 同一个智能体可在 Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Email 以及其他 10 多个平台上运行，并拥有完整的工具访问权限，而不仅仅是聊天。
- **供应商无关** —— 在工作流中途更换模型和提供商，无需更改其他任何东西。凭证池可在多个 API 密钥之间自动轮换。
- **配置文件** —— 运行多个独立的 Hermes 实例，拥有隔离的配置、会话、技能和内存。
- **可扩展** —— 插件、MCP 服务器、自定义工具、Webhook 触发器、Cron 调度以及完整的 Python 生态系统。

人们使用 Hermes 进行软件开发、研究、系统管理、数据分析、内容创作、家庭自动化以及任何受益于具有持久上下文和完整系统访问权限的 AI 智能体的场景。

**此技能帮助您有效地使用 Hermes 智能体** —— 设置、配置功能、启动额外的智能体实例、排查问题、找到正确的命令和设置，以及在您需要扩展或贡献系统时理解其工作原理。

**文档：** https://hermes-agent.nousresearch.com/docs/

## 快速开始

```bash
# 安装
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# 交互式聊天（默认）
hermes

# 单次查询
hermes chat -q "法国的首都是哪里？"

# 设置向导
hermes setup

# 更改模型/提供商
hermes model

# 健康检查
hermes doctor
```

---

## CLI 参考

### 全局标志

```
hermes [flags] [command]

  --version, -V             显示版本
  --resume, -r SESSION      通过 ID 或标题恢复会话
  --continue, -c [NAME]     按名称恢复，或恢复最近的会话
  --worktree, -w            隔离的 git 工作树模式（并行智能体）
  --skills, -s SKILL        预加载技能（逗号分隔或重复）
  --profile, -p NAME        使用命名配置文件
  --yolo                    跳过危险命令的确认
  --pass-session-id         在系统提示中包含会话 ID
```

不带子命令默认为 `chat`。

### 聊天

```
hermes chat [flags]
  -q, --query TEXT          单次查询，非交互式
  -m, --model MODEL         模型（例如 anthropic/claude-sonnet-4）
  -t, --toolsets LIST       逗号分隔的工具集
  --provider PROVIDER       强制使用提供商（openrouter, anthropic, nous 等）
  -v, --verbose             详细输出
  -Q, --quiet               禁用横幅、加载动画、工具预览
  --checkpoints             启用文件系统检查点（/rollback）
  --source TAG              会话源标签（默认：cli）
```

### 配置

```
hermes setup [section]      交互式向导（model|terminal|gateway|tools|agent）
hermes model                交互式模型/提供商选择器
hermes config               查看当前配置
hermes config edit          在 $EDITOR 中打开 config.yaml
hermes config set KEY VAL   设置配置值
hermes config path          打印 config.yaml 路径
hermes config env-path      打印 .env 路径
hermes config check         检查缺失/过时的配置
hermes config migrate       使用新选项更新配置
hermes auth                 交互式凭证管理器
hermes auth add PROVIDER    添加 OAuth 或 API 密钥凭证（例如 nous, openai-codex, qwen-oauth）
hermes auth list            列出存储的凭证
hermes auth remove PROVIDER 移除存储的凭证
hermes doctor [--fix]       检查依赖项和配置
hermes status [--all]       显示组件状态
```

### 工具与技能

```
hermes tools                交互式工具启用/禁用（curses UI）
hermes tools list           显示所有工具及其状态
hermes tools enable NAME    启用工具集
hermes tools disable NAME   禁用工具集

hermes skills list          列出已安装的技能
hermes skills search QUERY  搜索技能中心
hermes skills install ID    安装技能（ID 可以是中心标识符或直接的 https://…/SKILL.md URL；当前置信息无名称时传递 --name 覆盖）
hermes skills inspect ID    预览但不安装
hermes skills config        按平台启用/禁用技能
hermes skills check         检查更新
hermes skills update        更新过时的技能
hermes skills uninstall N   移除中心技能
hermes skills publish PATH  发布到注册中心
hermes skills browse        浏览所有可用技能
hermes skills tap add REPO  添加 GitHub 仓库作为技能源
```

### MCP 服务器

```
hermes mcp serve            将 Hermes 作为 MCP 服务器运行
hermes mcp add NAME         添加 MCP 服务器（--url 或 --command）
hermes mcp remove NAME      移除 MCP 服务器
hermes mcp list             列出已配置的服务器
hermes mcp test NAME        测试连接
hermes mcp configure NAME   切换工具选择
```

### 网关（消息平台）

```
hermes gateway run          前台启动网关
hermes gateway install      安装为后台服务
hermes gateway start/stop   控制服务
hermes gateway restart      重启服务
hermes gateway status       检查状态
hermes gateway setup        配置平台
```

支持平台：Telegram、Discord、Slack、WhatsApp、Signal、Email、SMS、Matrix、Mattermost、Home Assistant、钉钉、飞书、企业微信、BlueBubbles (iMessage)、微信、API 服务器、Webhooks。Open WebUI 通过 API 服务器适配器连接。

平台文档：https://hermes-agent.nousresearch.com/docs/user-guide/messaging/

### 会话

```
hermes sessions list        列出最近的会话
hermes sessions browse      交互式选择器
hermes sessions export OUT  导出为 JSONL
hermes sessions rename ID T 重命名会话
hermes sessions delete ID   删除会话
hermes sessions prune       清理旧会话（--older-than N 天）
hermes sessions stats       会话存储统计信息
```

### 定时任务

```
hermes cron list            列出任务（--all 包含已禁用的）
hermes cron create SCHED    创建：'30m', 'every 2h', '0 9 * * *'
hermes cron edit ID         编辑计划、提示、投递方式
hermes cron pause/resume ID 控制任务状态
hermes cron run ID          在下一个刻度触发
hermes cron remove ID       删除任务
hermes cron status          调度器状态
```

### Webhooks

```
hermes webhook subscribe N  在 /webhooks/<name> 创建路由
hermes webhook list         列出订阅
hermes webhook remove NAME  移除订阅
hermes webhook test NAME    发送测试 POST
```

### 配置文件

```
hermes profile list         列出所有配置文件
hermes profile create NAME  创建（--clone, --clone-all, --clone-from）
hermes profile use NAME     设置粘性默认值
hermes profile delete NAME  删除配置文件
hermes profile show NAME    显示详情
hermes profile alias NAME   管理包装脚本
hermes profile rename A B   重命名配置文件
hermes profile export NAME  导出为 tar.gz
hermes profile import FILE  从归档导入
```

### 凭证池

```
hermes auth add             交互式凭证向导
hermes auth list [PROVIDER] 列出池化凭证
hermes auth remove P INDEX  按提供商 + 索引移除
hermes auth reset PROVIDER  清除耗尽状态
```

### 其他

```
hermes insights [--days N]  使用分析
hermes update               更新到最新版本
hermes pairing list/approve/revoke  DM 授权
hermes plugins list/install/remove  插件管理
hermes honcho setup/status  Honcho 内存集成（需要 honcho 插件）
hermes memory setup/status/off  内存提供商配置
hermes completion bash|zsh  Shell 补全
hermes acp                  ACP 服务器（IDE 集成）
hermes claw migrate         从 OpenClaw 迁移
hermes uninstall            卸载 Hermes
```

---

## 斜杠命令（会话中）

在交互式聊天会话期间输入这些命令。新命令发布得相当频繁；如果下面的内容看起来过时，请在会话中运行 `/help` 获取权威列表，或查看[实时斜杠命令参考](https://hermes-agent.nousresearch.com/docs/reference/slash-commands)。
权威注册表是 `hermes_cli/commands.py` — 每个消费者（自动补全、Telegram 菜单、Slack 映射、`/help`）都从中派生。

### 会话控制
```
/new (/reset)        全新会话
/clear               清除屏幕 + 新会话（CLI）
/retry               重新发送最后一条消息
/undo                移除最后一个交换
/title [name]        为会话命名
/compress            手动压缩上下文
/stop                终止后台进程
/rollback [N]        恢复文件系统检查点
/snapshot [sub]      创建或恢复 Hermes 配置/状态的快照（CLI）
/background <prompt> 在后台运行提示
/queue <prompt>      排队等待下一轮
/steer <prompt>      在下一个工具调用后注入消息而不中断
/agents (/tasks)     显示活动的智能体和正在运行的任务
/resume [name]       恢复一个已命名的会话
/goal [text|sub]     设置一个目标，Hermes 将在跨轮次中持续努力直至达成
                     （子命令：status, pause, resume, clear）
/redraw              强制完全重绘 UI（CLI）
```

### 配置
```
/config              显示配置（CLI）
/model [name]        显示或更改模型
/personality [name]  设置个性
/reasoning [level]   设置推理等级（none|minimal|low|medium|high|xhigh|show|hide）
/verbose             循环切换：关闭 → 新 → 所有 → 详细
/voice [on|off|tts]  语音模式
/yolo                切换批准绕过
/busy [sub]          控制当 Hermes 工作时 Enter 键的作用（CLI）
                     （子命令：queue, steer, interrupt, status）
/indicator [style]   选择 TUI 忙碌指示器样式（CLI）
                     （样式：kaomoji, emoji, unicode, ascii）
/footer [on|off]     切换最终回复上的网关运行时元数据页脚
/skin [name]         更改主题（CLI）
/statusbar           切换状态栏（CLI）
```

### 工具与技能
```
/tools               管理工具（CLI）
/toolsets            列出工具集（CLI）
/skills              搜索/安装技能（CLI）
/skill <name>        将技能加载到会话中
/reload-skills       重新扫描 ~/.hermes/skills/ 以发现添加/移除的技能
/reload              将 .env 变量重新加载到运行中的会话（CLI）
/reload-mcp          重新加载 MCP 服务器
/cron                管理定时任务（CLI）
/curator [sub]       后台技能维护（status, run, pin, archive, …）
/kanban [sub]        多配置文件协作板（任务、链接、评论）
/plugins             列出插件（CLI）
```

### 网关
```
/approve             批准待处理的命令（网关）
/deny                拒绝待处理的命令（网关）
/restart             重启网关（网关）
/sethome             将当前聊天设置为主频道（网关）
/update              将 Hermes 更新到最新版本（网关）
/topic [sub]         启用或检查 Telegram DM 主题会话（网关）
/platforms (/gateway) 显示平台连接状态（网关）
```

### 工具
```
/branch (/fork)      分支当前会话
/fast                切换优先/快速处理
/browser             打开 CDP 浏览器连接
/history             显示对话历史（CLI）
/save                将对话保存到文件（CLI）
/copy [N]            将最后的助手回复复制到剪贴板（CLI）
/paste               附加剪贴板图像（CLI）
/image               附加本地图像文件（CLI）
```

### 信息
```
/help                显示命令
/commands [page]     浏览所有命令（网关）
/usage               令牌使用情况
/insights [days]     使用分析
/gquota              显示 Google Gemini Code Assist 配额使用情况（CLI）
/status              会话信息（网关）
/profile             活动配置文件信息
/debug               上传调试报告（系统信息 + 日志）并获取可共享链接
```

### 退出
```
/quit (/exit, /q)    退出 CLI
```

## 关键路径与配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API 密钥和秘密
$HERMES_HOME/skills/        已安装的技能
~/.hermes/sessions/         网关路由索引、请求转储、*.jsonl 会话记录（以及当 sessions.write_json_snapshots: true 时可选的每会话 JSON 快照）
~/.hermes/state.db          规范会话存储（SQLite + FTS5）
~/.hermes/logs/             网关和错误日志
~/.hermes/auth.json         OAuth 令牌和凭证池
~/.hermes/hermes-agent/     源代码（如果通过 git 安装）
```

配置文件使用 `~/.hermes/profiles/<name>/`，布局相同。

### 配置部分

使用 `hermes config edit` 或 `hermes config set section.key value` 进行编辑。

| 部分 | 关键选项 |
|---------|-------------|
| `model` | `default`, `provider`, `base_url`, `api_key`, `context_length` |
| `agent` | `max_turns` (90), `tool_use_enforcement` |
| `terminal` | `backend` (local/docker/ssh/modal), `cwd`, `timeout` (180) |
| `compression` | `enabled`, `threshold` (0.50), `target_ratio` (0.20) |
| `display` | `skin`, `tool_progress`, `show_reasoning`, `show_cost` |
| `stt` | `enabled`, `provider` (local/groq/openai/mistral) |
| `tts` | `provider` (edge/elevenlabs/openai/minimax/mistral/neutts) |
| `memory` | `memory_enabled`, `user_profile_enabled`, `provider` |
| `security` | `tirith_enabled`, `website_blocklist` |
| `delegation` | `model`, `provider`, `base_url`, `api_key`, `max_iterations` (50), `reasoning_effort` |
| `checkpoints` | `enabled`, `max_snapshots` (50) |

完整配置参考：https://hermes-agent.nousresearch.com/docs/user-guide/configuration

### 提供者

支持 20+ 个提供者。通过 `hermes model` 或 `hermes setup` 设置。

| 提供者 | 认证方式 | 关键环境变量 |
|----------|------|-------------|
| OpenRouter | API 密钥 | `OPENROUTER_API_KEY` |
| Anthropic | API 密钥 | `ANTHROPIC_API_KEY` |
| Nous Portal | OAuth | `hermes auth` |
| OpenAI Codex | OAuth | `hermes auth` |
| GitHub Copilot | 令牌 | `COPILOT_GITHUB_TOKEN` |
| Google Gemini | API 密钥 | `GOOGLE_API_KEY` 或 `GEMINI_API_KEY` |
| DeepSeek | API 密钥 | `DEEPSEEK_API_KEY` |
| xAI / Grok | API 密钥 | `XAI_API_KEY` |
| Hugging Face | 令牌 | `HF_TOKEN` |
| Z.AI / GLM | API 密钥 | `GLM_API_KEY` |
| MiniMax | API 密钥 | `MINIMAX_API_KEY` |
| MiniMax CN | API 密钥 | `MINIMAX_CN_API_KEY` |
| Kimi / Moonshot | API 密钥 | `KIMI_API_KEY` |
| Alibaba / DashScope | API 密钥 | `DASHSCOPE_API_KEY` |
| Xiaomi MiMo | API 密钥 | `XIAOMI_API_KEY` |
| Kilo Code | API 密钥 | `KILOCODE_API_KEY` |
| OpenCode Zen | API 密钥 | `OPENCODE_ZEN_API_KEY` |
| OpenCode Go | API 密钥 | `OPENCODE_GO_API_KEY` |
| Qwen OAuth | OAuth | `hermes auth add qwen-oauth` |
| 自定义端点 | 配置 | config.yaml 中的 `model.base_url` + `model.api_key` |
| GitHub Copilot ACP | 外部 | `COPILOT_CLI_PATH` 或 Copilot CLI |

完整提供者文档：https://hermes-agent.nousresearch.com/docs/integrations/providers

### 工具集

通过 `hermes tools`（交互式）或 `hermes tools enable/disable NAME` 启用/禁用。

| 工具集 | 功能 |
|---------|-----------------|
| `web` | 网页搜索和内容提取 |
| `search` | 仅网页搜索（`web` 的子集） |
| `browser` | 浏览器自动化（Browserbase, Camofox 或本地 Chromium） |
| `terminal` | Shell 命令和进程管理 |
| `file` | 文件读/写/搜索/补丁 |
| `code_execution` | 沙箱 Python 执行 |
| `vision` | 图像分析 |
| `image_gen` | AI 图像生成 |
| `video` | 视频分析与生成 |
| `tts` | 文本转语音 |
| `skills` | 技能浏览与管理 |
| `memory` | 跨会话持久化记忆 |
| `session_search` | 搜索过去的对话 |
| `delegation` | 子智能体任务委托 |
| `cronjob` | 计划任务管理 |
| `clarify` | 向用户提出澄清问题 |
| `messaging` | 跨平台消息发送 |
| `todo` | 会话内任务规划与跟踪 |
| `kanban` | 多智能体工作队列工具（仅对工作者开放） |
| `debugging` | 额外的自省/调试工具（默认关闭） |
| `safe` | 用于锁定会话的最小化、低风险工具集 |
| `spotify` | Spotify 播放和播放列表控制 |
| `homeassistant` | 智能家居控制（默认关闭） |
| `discord` | Discord 集成工具 |
| `discord_admin` | Discord 管理员/管理工具 |
| `feishu_doc` | 飞书文档工具 |
| `feishu_drive` | 飞书云盘工具 |
| `yuanbao` | 元宝集成工具 |
| `rl` | 强化学习工具（默认关闭） |
| `moa` | 混合智能体（默认关闭） |

完整枚举位于 `toolsets.py` 中的 `TOOLSETS` 字典；`_HERMES_CORE_TOOLS` 是大多数平台继承的默认捆绑包。

工具更改在 `/reset`（新会话）时生效。它们**不会**在对话中途应用，以保留提示缓存。

---

## 安全与隐私开关

常见的"Hermes 为什么对我的输出/工具调用/命令做了 X？"开关——以及更改它们的确切命令。其中大多数需要一个新会话（聊天中输入 `/reset`，或启动新的 `hermes` 调用），因为它们在启动时被读取一次。

### 工具输出中的秘密脱敏

秘密脱敏**默认关闭**——工具输出（终端标准输出、`read_file`、网页内容、子智能体摘要等）会原样通过。如果用户希望 Hermes 在 API 密钥、令牌和秘密字符串进入对话上下文和日志之前自动掩码它们：

```bash
hermes config set security.redact_secrets true       # 全局启用
```

**需要重启。** `security.redact_secrets` 在导入时快照——在会话中切换它（例如通过工具调用中的 `export HERMES_REDACT_SECRETS=true`）**不会**对正在运行的进程生效。告诉用户在终端运行 `hermes config set security.redact_secrets true`，然后开始一个新会话。这是故意的——它防止 LLM 在任务中途自行翻转开关。

再次禁用：
```bash
hermes config set security.redact_secrets false
```

### 网关消息中的 PII 脱敏

与秘密脱敏分开。启用后，网关在模型接收之前，会对会话上下文中的用户 ID 进行哈希处理并剥离电话号码：

```bash
hermes config set privacy.redact_pii true    # 启用
hermes config set privacy.redact_pii false   # 禁用（默认）
```

### 命令审批提示

默认情况下（`approvals.mode: manual`），Hermes 在运行被标记为破坏性的 shell 命令（`rm -rf`, `git reset --hard` 等）之前会提示用户。模式有：

- `manual` — 总是提示（默认）
- `smart` — 使用辅助 LLM 自动批准低风险命令，对高风险命令进行提示
- `off` — 跳过所有审批提示（等同于 `--yolo`）

```bash
hermes config set approvals.mode smart       # 推荐的折中方案
hermes config set approvals.mode off         # 绕过所有内容（不推荐）
```

每次调用时绕过而不更改配置：
- `hermes --yolo …`
- `export HERMES_YOLO_MODE=1`

注意：YOLO / `approvals.mode: off` **不会**关闭秘密脱敏。它们是独立的。

### Shell 钩子白名单

一些 shell 钩子集成需要在触发前进行明确的白名单许可。通过 `~/.hermes/shell-hooks-allowlist.json` 管理——当钩子首次想要运行时，会进行交互式提示。

### 禁用网页/浏览器/图像生成工具

要让模型完全远离网络或媒体工具，请打开 `hermes tools` 并按平台切换。在下一个会话（`/reset`）时生效。请参阅上面的工具与技能部分。

---

## 语音与转录

### 语音转文字

来自消息平台的语音消息将被自动转录。

供应商优先级（自动检测）：
1. **本地 faster-whisper** — 免费，无需 API 密钥：`pip install faster-whisper`
2. **Groq Whisper** — 免费套餐：设置 `GROQ_API_KEY`
3. **OpenAI Whisper** — 付费：设置 `VOICE_TOOLS_OPENAI_KEY`
4. **Mistral Voxtral** — 设置 `MISTRAL_API_KEY`

配置：
```yaml
stt:
  enabled: true
  provider: local        # local, groq, openai, mistral
  local:
    model: base          # tiny, base, small, medium, large-v3
```

### 文字转语音

| 提供商 | 环境变量 | 免费？ |
|----------|---------|-------|
| Edge TTS | 无 | 是（默认） |
| ElevenLabs | `ELEVENLABS_API_KEY` | 免费套餐 |
| OpenAI | `VOICE_TOTOOLS_OPENAI_KEY` | 付费 |
| MiniMax | `MINIMAX_API_KEY` | 付费 |
| Mistral (Voxtral) | `MISTRAL_API_KEY` | 付费 |
| NeuTTS（本地） | 无 (`pip install neutts[all]` + `espeak-ng`) | 免费 |

语音命令：`/voice on`（语音对语音），`/voice tts`（始终语音），`/voice off`。

---

## 生成其他 Hermes 实例

将额外的 Hermes 进程作为完全独立的子进程运行——拥有独立的会话、工具和环境。

### 何时使用此方法 vs 委派任务

| | `delegate_task` | 生成 `hermes` 进程 |
|-|-----------------|--------------------------|
| 隔离性 | 独立对话，共享进程 | 完全独立的进程 |
| 持续时间 | 分钟级（受父循环限制） | 小时/天级 |
| 工具访问权限 | 父工具的子集 | 完整工具访问权限 |
| 交互式 | 否 | 是（PTY 模式） |
| 适用场景 | 快速并行子任务 | 长时间自主任务 |

### 单次模式

```
terminal(command="hermes chat -q '研究 GRPO 论文并将摘要写入 ~/research/grpo.md'", timeout=300)

# 用于长时间任务的后台运行：
terminal(command="hermes chat -q '为 ~/myapp 设置 CI/CD'", background=true)
```

### 交互式 PTY 模式（通过 tmux）

Hermes 使用 prompt_toolkit，这需要一个真实的终端。使用 tmux 进行交互式生成：

```
# 启动
terminal(command="tmux new-session -d -s agent1 -x 120 -y 40 'hermes'", timeout=10)

# 等待启动，然后发送消息
terminal(command="sleep 8 && tmux send-keys -t agent1 '构建一个 FastAPI 认证服务' Enter", timeout=15)

# 读取输出
terminal(command="sleep 20 && tmux capture-pane -t agent1 -p", timeout=5)

# 发送后续消息
terminal(command="tmux send-keys -t agent1 '添加速率限制中间件' Enter", timeout=5)

# 退出
terminal(command="tmux send-keys -t agent1 '/exit' Enter && sleep 2 && tmux kill-session -t agent1", timeout=10)
```

### 多智能体协调

```
# 智能体 A：后端
terminal(command="tmux new-session -d -s backend -x 120 -y 40 'hermes -w'", timeout=10)
terminal(command="sleep 8 && tmux send-keys -t backend '为用户管理构建 REST API' Enter", timeout=15)

# 智能体 B：前端
terminal(command="tmux new-session -d -s frontend -x 120 -y 40 'hermes -w'", timeout=10)
terminal(command="sleep 8 && tmux send-keys -t frontend '为用户管理构建 React 仪表板' Enter", timeout=15)

# 检查进度，在它们之间传递上下文
terminal(command="tmux capture-pane -t backend -p | tail -30", timeout=5)
terminal(command="tmux send-keys -t frontend '这是来自后端智能体的 API 模式：...' Enter", timeout=5)
```

### 会话恢复

```
# 恢复最近的会话
terminal(command="tmux new-session -d -s resumed 'hermes --continue'", timeout=10)

# 恢复特定会话
terminal(command="tmux new-session -d -s resumed 'hermes --resume 20260225_143052_a1b2c3'", timeout=10)
```

### 提示

- **对于快速子任务，优先使用 `delegate_task`** —— 比生成完整进程开销更少
- **生成编辑代码的智能体时，使用 `-w`（工作树模式）** —— 防止 git 冲突
- **为单次模式设置超时** —— 复杂任务可能需要 5-10 分钟
- **使用 `hermes chat -q` 进行“发后不理”** —— 不需要 PTY
- **使用 tmux 进行交互式会话** —— 原始 PTY 模式存在 `\r` 与 `\n` 问题，与 prompt_toolkit 不兼容
- **对于定时任务**，使用 `cronjob` 工具而不是生成——它能处理交付和重试

---

## 持久化与后台系统

四个系统与主对话循环并行运行。此处为快速参考；完整的开发者笔记位于 `AGENTS.md`，面向用户的文档在 `website/docs/user-guide/features/` 下。

### 任务委托 (`delegate_task`)

同步子智能体派生 — 父智能体等待子智能体的摘要后才继续自身的循环。具有隔离的上下文和终端会话。

- **单次：** `delegate_task(goal, context, toolsets)`。
- **批量：** `delegate_task(tasks=[{goal, ...}, ...])` 并行运行子任务，上限为 `delegation.max_concurrent_children`（默认 3）。
- **角色：** `leaf`（默认；不能再委托） vs `orchestrator`（可以派生自己的工作者，受 `delegation.max_spawn_depth` 限制）。
- **非持久化。** 如果父智能体被中断，子智能体也会被取消。对于必须超出单轮生命周期的工作，请使用 `cronjob` 或 `terminal(background=True, notify_on_complete=True)`。

配置：`config.yaml` 中的 `delegation.*`。

### 定时任务 (Cron)

持久化调度器 — `cron/jobs.py` + `cron/scheduler.py`。通过 `cronjob` 工具、`hermes cron` CLI（`list`、`add`、`edit`、`pause`、`resume`、`run`、`remove`）或 `/cron` 斜杠命令驱动。

- **调度方式：** 时长（`"30m"`, `"2h"`）、"every" 短语（`"every monday 9am"`）、5字段 cron 表达式（`"0 9 * * *"`）或 ISO 时间戳。
- **任务级配置：** `skills`、`model`/`provider` 覆盖、`script`（运行前数据收集；`no_agent=True` 使脚本成为整个任务）、`context_from`（将任务 A 的输出链接到任务 B）、`workdir`（在具有其 `AGENTS.md` / `CLAUDE.md` 的特定目录中运行）、多平台交付。
- **不变性：** 每次运行 3 分钟硬中断，`.tick.lock` 文件防止跨进程的重复触发，cron 会话默认传递 `skip_memory=True`，并且 cron 交付使用页眉/页脚框起，而不是镜像到目标网关会话（保持角色交替的完整性）。

用户文档：https://hermes-agent.nousresearch.com/docs/user-guide/features/cron

### 技能管理器 (Curator)

智能体创建的技能的后台维护。跟踪使用情况，标记闲置技能为过时，归档过时技能，保留运行前的 tar.gz 备份，确保不会丢失任何内容。

- **CLI：** `hermes curator <verb>` — `status`, `run`, `pause`, `resume`, `pin`, `unpin`, `archive`, `restore`, `prune`, `backup`, `rollback`。
- **斜杠命令：** `/curator <subcommand>` 映射 CLI 命令。
- **范围：** 仅处理具有 `created_by: "agent"` 来源的技能。捆绑技能和从 hub 安装的技能不在处理范围内。**永不删除** — 最具破坏性的操作是归档。固定的技能不受任何自动转换和任何 LLM 审查通道的影响。
- **遥测：** 位于 `~/.hermes/skills/.usage.json` 的辅助数据文件存储每个技能的 `use_count`、`view_count`、`patch_count`、`last_activity_at`、`state`、`pinned`。

配置：`curator.*`（`enabled`, `interval_hours`, `min_idle_hours`, `stale_after_days`, `archive_after_days`, `backup.*`）。
用户文档：https://hermes-agent.nousresearch.com/docs/user-guide/features/curator

### 看板 (Kanban)

持久化的 SQLite 看板，用于多配置文件 / 多工作者协作。用户通过 `hermes kanban <verb>` 驱动；由调度器派生的工作者会看到一个聚焦的 `kanban_*` 工具集，受 `HERMES_KANBAN_TASK` 控制，而编排者配置文件可以选择加入更广泛的 `kanban` 工具集。除非配置，普通会话不会有任何 `kanban_*` 模式。

- **CLI 动词（常用）：** `init`, `create`, `list`（别名 `ls`）, `show`, `assign`, `link`, `unlink`, `comment`, `complete`, `block`, `unblock`, `archive`, `tail`。较少使用：`watch`, `stats`, `runs`, `log`, `dispatch`, `daemon`, `gc`。
- **工作者/编排者工具集：** `kanban_show`, `kanban_complete`, `kanban_block`, `kanban_heartbeat`, `kanban_comment`, `kanban_create`, `kanban_link`；在调度器派生的任务之外明确启用了 `kanban` 工具集的配置文件，还会获得 `kanban_list` 和 `kanban_unblock` 用于看板路由。
- **调度器** 默认在网关内运行（`kanban.dispatch_in_gateway: true`）— 回收过时的认领，提升就绪的任务，原子地认领任务，派生指定的配置文件。在连续 `failure_limit`（默认 2；可通过 `kanban.failure_limit` 或每个任务的 `max_retries` 配置）次派生失败后，自动阻塞任务。
- **隔离：** 看板是硬边界（工作者在环境中固定 `HERMES_KANBAN_BOARD`）；租户是看板内的软命名空间，用于工作区路径和内存键隔离。

用户文档：https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban

---

## Windows 特定问题

Hermes 可在 Windows 上原生运行（PowerShell、cmd、Windows Terminal、git-bash mintty、VS Code 集成终端）。大部分功能开箱即用，但 Win32 和 POSIX 之间的一些差异曾让我们踩过坑 — 当你遇到新问题时，请记录在此处，以免下一个人（或下一次会话）重新从头发现它们。

### 输入 / 按键绑定

**Alt+Enter 不会插入新行。** Windows Terminal 在终端层拦截 Alt+Enter 以切换全屏 — 该按键信号从未到达 prompt_toolkit。请改用 **Ctrl+Enter**。Windows Terminal 将 Ctrl+Enter 作为 LF（`c-j`）发送，与普通 Enter（`c-m` / CR）不同，并且 CLI 仅在 `win32` 上将 `c-j` 绑定到新行插入（参见 `cli.py` 中的 `_bind_prompt_submit_keys` + Windows 专用的 `c-j` 绑定）。副作用：原始的 Ctrl+J 按键在 Windows 上也会插入新行 — 这是不可避免的，因为 Windows Terminal 在 Win32 控制台 API 层将 Ctrl+Enter 和 Ctrl+J 合并为相同的键码。Windows 上原本没有与 Ctrl+J 冲突的绑定，因此这是一个无害的副作用。

mintty / git-bash 行为相同（Alt+Enter 切换全屏），除非你在选项 → 按键中禁用 Alt+Fn 快捷键。更简单的方法是直接使用 Ctrl+Enter。

**诊断按键绑定。** 运行 `python scripts/keystroke_diagnostic.py`（仓库根目录），可以确切查看 prompt_toolkit 在当前终端中如何识别每个按键。可以解答诸如 “Shift+Enter 是否作为不同的键发送？”（几乎从不 — 大多数终端将其合并为普通 Enter）或 “我的终端为 Ctrl+Enter 发送什么字节序列？” 这样的问题。Ctrl+Enter = c-j 的事实就是这样确定的。

### 配置 / 文件

**首次运行时出现 HTTP 400 “No models provided”。** `config.yaml` 在保存时带有 UTF-8 BOM（当 Windows 应用程序写入时很常见）。请重新保存为不带 BOM 的 UTF-8。`hermes config edit` 写入时不带 BOM；在记事本中手动编辑通常是罪魁祸首。

### `execute_code` / 沙盒

**来自沙盒子进程的 WinError 10106**（“无法加载或初始化请求的服务提供程序”）— 它无法创建 `AF_INET` 套接字，因此回环 TCP RPC 备用方案在 `connect()` 之前就失败了。根本原因通常**不是**损坏的 Winsock LSP；而是 Hermes 自身的环境清理器从子进程中移除了 `SYSTEMROOT` / `WINDIR` / `COMSPEC`。Python 的 `socket` 模块需要 `SYSTEMROOT` 来定位 `mswsock.dll`。通过 `tools/code_execution_tool.py` 中的 `_WINDOWS_ESSENTIAL_ENV_VARS` 白名单修复。如果仍然遇到问题，请在 `execute_code` 块中回显 `os.environ` 以确认 `SYSTEMROOT` 已设置。完整的诊断方案在 `references/execute-code-sandbox-env-windows.md`。

### 测试 / 贡献

**`scripts/run_tests.sh` 在 Windows 上无法原样运行** — 它查找 POSIX venv 布局（`.venv/bin/activate`）。Hermes 安装的 venv 在 `venv/Scripts/` 下也没有 pip 或 pytest（为了安装大小而精简）。变通方法：将 `pytest + pytest-xdist + pyyaml` 安装到系统 Python 3.11 的用户站点，然后直接调用 pytest 并设置 `PYTHONPATH`：

```bash
"/c/Program Files/Python311/python" -m pip install --user pytest pytest-xdist pyyaml
export PYTHONPATH="$(pwd)"
"/c/Program Files/Python311/python" -m pytest tests/foo/test_bar.py -v --tb=short -n 0
```

使用 `-n 0`，而不是 `-n 4` — `pyproject.toml` 的默认 `addopts` 已经包含 `-n`，并且包装器的 CI 对等保证在非 POSIX 环境下不适用。

**仅限 POSIX 的测试需要跳过保护。** 代码库中已有常用标记：
- 符号链接 — Windows 上需要提升权限
- `0o600` 文件模式 — NTFS 默认不强制执行 POSIX 模式位
- `signal.SIGALRM` — 仅限 Unix（参见 `tests/conftest.py::_enforce_test_timeout`）
- Winsock / Windows 特定回归 — `@pytest.mark.skipif(sys.platform != "win32", ...)`

使用现有的跳过模式风格（`sys.platform == "win32"` 或 `sys.platform.startswith("win")`）以与其余测试套件保持一致。

### 路径 / 文件系统

**行尾符。** Git 可能会警告 `LF will be replaced by CRLF the next time Git touches it`。这只是外观问题 — 仓库的 `.gitattributes` 会进行规范化。不要让编辑器自动将已提交的 POSIX 换行文件转换为 CRLF。

**正斜杠几乎在所有地方都有效。** `C:/Users/...` 被每个 Hermes 工具和大多数 Windows API 接受。在代码和日志中优先使用正斜杠 — 避免在 bash 中转义反斜杠。

---

## 故障排除

### 语音功能不工作
1. 检查 `config.yaml` 中的 `stt.enabled: true`
2. 验证提供者：`pip install faster-whisper` 或设置 API 密钥
3. 在网关中：`/restart`。在命令行中：退出并重新启动。

### 工具不可用
1. `hermes tools` — 检查您的平台是否已启用工具集
2. 一些工具需要环境变量（检查 `.env` 文件）
3. 启用工具后执行 `/reset`

### 模型/提供者问题
1. `hermes doctor` — 检查配置和依赖项
2. `hermes auth` — 重新认证 OAuth 提供者（或 `hermes auth add <provider>`）
3. 检查 `.env` 文件中是否包含正确的 API 密钥
4. **Copilot 403 错误**：`gh auth login` 的令牌**不能**用于 Copilot API。您必须通过 `hermes model` → GitHub Copilot 使用 Copilot 专用的 OAuth 设备代码流程。

### 更改未生效
- **工具/技能：** `/reset` 启动一个使用更新后工具集的新会话
- **配置更改：** 在网关中：`/restart`。在命令行中：退出并重新启动。
- **代码更改：** 重启命令行或网关进程

### 技能未显示
1. `hermes skills list` — 验证是否已安装
2. `hermes skills config` — 检查平台启用状态
3. 显式加载：`/skill name` 或 `hermes -s name`

### 网关问题
首先检查日志：
```bash
grep -i "failed to send\|error" ~/.hermes/logs/gateway.log | tail -20
```

常见网关问题：
- **网关在 SSH 登出后终止**：启用持久化：`sudo loginctl enable-linger $USER`
- **网关在 WSL2 关闭后终止**：WSL2 需要在 `/etc/wsl.conf` 中设置 `systemd=true` 才能使 systemd 服务正常工作。否则，网关将回退到 `nohup`（会话关闭时终止）。
- **网关崩溃循环**：重置失败状态：`systemctl --user reset-failed hermes-gateway`

### 平台特定问题
- **Discord 机器人无响应**：必须在 Bot → Privileged Gateway Intents 中启用 **Message Content Intent**。
- **Slack 机器人仅在私信中工作**：必须订阅 `message.channels` 事件。否则，机器人会忽略公共频道。
- **Windows 特定问题**（`Alt+Enter` 换行、WinError 10106、UTF-8 BOM 配置、测试套件、行尾符）：请参阅上方的专门 **Windows 特定注意事项** 章节。

### 辅助模型不工作
如果 `auxiliary` 任务（视觉、压缩、会话搜索）静默失败，则 `auto` 提供者找不到后端。请设置 `OPENROUTER_API_KEY` 或 `GOOGLE_API_KEY`，或者明确配置每个辅助任务的提供者：
```bash
hermes config set auxiliary.vision.provider <your_provider>
hermes config set auxiliary.vision.model <model_name>
```

---

## 在哪里查找信息

| 查找内容... | 位置 |
|-------------|------|
| 配置选项 | `hermes config edit` 或 [配置文档](https://hermes-agent.nousresearch.com/docs/user-guide/configuration) |
| 可用工具 | `hermes tools list` 或 [工具参考](https://hermes-agent.nousresearch.com/docs/reference/tools-reference) |
| 斜杠命令 | 在会话中输入 `/help` 或 [斜杠命令参考](https://hermes-agent.nousresearch.com/docs/reference/slash-commands) |
| 技能目录 | `hermes skills browse` 或 [技能目录](https://hermes-agent.nousresearch.com/docs/reference/skills-catalog) |
| 提供者设置 | `hermes model` 或 [提供者指南](https://hermes-agent.nousresearch.com/docs/integrations/providers) |
| 平台设置 | `hermes gateway setup` 或 [消息传递文档](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/) |
| MCP 服务器 | `hermes mcp list` 或 [MCP 指南](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp) |
| 配置文件 | `hermes profile list` 或 [配置文件文档](https://hermes-agent.nousresearch.com/docs/user-guide/profiles) |
| 定时任务 | `hermes cron list` 或 [定时任务文档](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron) |
| 记忆 | `hermes memory status` 或 [记忆文档](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory) |
| 环境变量 | `hermes config env-path` 或 [环境变量参考](https://hermes-agent.nousresearch.com/docs/reference/environment-variables) |
| 命令行命令 | `hermes --help` 或 [命令行参考](https://hermes-agent.nousresearch.com/docs/reference/cli-commands) |
| 网关日志 | `~/.hermes/logs/gateway.log` |
| 会话文件 | `hermes sessions browse`（读取 state.db） |
| 源代码 | `~/.hermes/hermes-agent/` |

---

## 贡献者快速参考

适用于偶尔贡献者和PR作者。完整开发者文档：https://hermes-agent.nousresearch.com/docs/developer-guide/

### 项目布局

<!-- ascii-guard-ignore -->
```
hermes-agent/
├── run_agent.py          # AIAgent — 核心对话循环
├── model_tools.py        # 工具发现与调度
├── toolsets.py           # 工具集定义
├── cli.py                # 交互式命令行界面 (HermesCLI)
├── hermes_state.py       # SQLite会话存储
├── agent/                # 提示词构建、上下文压缩、记忆、模型路由、凭据池、技能调度
├── hermes_cli/           # CLI子命令、配置、设置、命令
│   ├── commands.py       # 斜杠命令注册表 (CommandDef)
│   ├── config.py         # 默认配置，环境变量定义
│   └── main.py           # CLI入口和参数解析
├── tools/                # 每个工具一个文件
│   └── registry.py       # 中心工具注册表
├── gateway/              # 消息网关
│   └── platforms/        # 平台适配器 (telegram、discord等)
├── cron/                 # 任务调度器
├── tests/                # 约3000个pytest测试
└── website/              # Docusaurus文档站点
```
<!-- ascii-guard-ignore-end -->

配置：`~/.hermes/config.yaml`（设置），`~/.hermes/.env`（API密钥）。

### 添加工具（3个文件）

**1. 创建 `tools/your_tool.py`：**
```python
import json, os
from tools.registry import registry

def check_requirements() -> bool:
    return bool(os.getenv("EXAMPLE_API_KEY"))

def example_tool(param: str, task_id: str = None) -> str:
    return json.dumps({"success": True, "data": "..."})

registry.register(
    name="example_tool",
    toolset="example",
    schema={"name": "example_tool", "description": "...", "parameters": {...}},
    handler=lambda args, **kw: example_tool(
        param=args.get("param", ""), task_id=kw.get("task_id")),
    check_fn=check_requirements,
    requires_env=["EXAMPLE_API_KEY"],
)
```

**2. 添加到 `toolsets.py`** → `_HERMES_CORE_TOOLS` 列表。

自动发现：任何包含顶层 `registry.register()` 调用的 `tools/*.py` 文件都会被自动导入——无需手动列表。

所有处理器必须返回JSON字符串。对于路径，使用 `get_hermes_home()`，永远不要硬编码 `~/.hermes`。

### 添加斜杠命令

1. 在 `hermes_cli/commands.py` 的 `COMMAND_REGISTRY` 中添加 `CommandDef`
2. 在 `cli.py` 的 `process_command()` 中添加处理器
3. （可选）在 `gateway/run.py` 中添加网关处理器

所有消费者（帮助文本、自动补全、Telegram菜单、Slack映射）都自动从中心注册表派生。

### 智能体循环（高级概览）

```
run_conversation():
  1. 构建系统提示词
  2. 循环，直到迭代次数达到最大值：
     a. 调用LLM（OpenAI格式消息 + 工具schema）
     b. 如果有tool_calls → 通过handle_function_call()分发每个调用 → 追加结果 → 继续
     c. 如果是文本响应 → 返回
  3. 接近token限制时自动触发上下文压缩
```

### 测试

```bash
python -m pytest tests/ -o 'addopts=' -q   # 完整套件
python -m pytest tests/tools/ -q            # 特定区域
```

- 测试会自动将 `HERMES_HOME` 重定向到临时目录——永远不会触碰真实的 `~/.hermes/`
- 推送任何更改前运行完整套件
- 使用 `-o 'addopts='` 来清除任何烘焙好的pytest标志

**Windows贡献者：** `scripts/run_tests.sh` 目前寻找POSIX虚拟环境（`.venv/bin/activate` / `venv/bin/activate`），在Windows上会出错，因为那里布局是 `venv/Scripts/activate` + `python.exe`。Hermes安装在 `venv/Scripts/` 的虚拟环境也没有 `pip` 或 `pytest`——它为了最终用户安装大小而被精简了。解决方法：将pytest + pytest-xdist + pyyaml安装到系统Python 3.11用户站点（`/c/Program Files/Python311/python -m pip install --user pytest pytest-xdist pyyaml`），然后直接运行测试：

```bash
export PYTHONPATH="$(pwd)"
"/c/Program Files/Python311/python" -m pytest tests/tools/test_foo.py -v --tb=short -n 0
```

使用 `-n 0`（而不是 `-n 4`），因为 `pyproject.toml` 的默认 `addopts` 已经包含了 `-n`，并且包装器的CI一致性在非POSIX环境下不适用。

**跨平台测试防护：** 使用仅POSIX系统调用的测试需要一个跳过标记。代码库中常见的有：
- 创建符号链接 → `@pytest.mark.skipif(sys.platform == "win32", reason="在Windows上创建符号链接需要提升权限")`（参见 `tests/cron/test_cron_script.py`）
- POSIX文件模式（0o600等） → `@pytest.mark.skipif(sys.platform.startswith("win"), reason="POSIX模式位在Windows上不强制执行")`（参见 `tests/hermes_cli/test_auth_toctou_file_modes.py`）
- `signal.SIGALRM` → Unix专用（参见 `tests/conftest.py::_enforce_test_timeout`）
- 实时Winsock / Windows特定回归测试 → `@pytest.mark.skipif(sys.platform != "win32", reason="Windows特定回归")`

**猴子补丁 `sys.platform` 是不够的**，当被测试的代码还调用了 `platform.system()` / `platform.release()` / `platform.mac_ver()` 时。这些函数独立地重新读取真实操作系统信息，因此在Windows运行器上将 `sys.platform` 设置为 `"linux"` 的测试，仍然会看到 `platform.system() == "Windows"` 并进入Windows分支。需要同时修补这三个函数：

```python
monkeypatch.setattr(sys, "platform", "linux")
monkeypatch.setattr(platform, "system", lambda: "Linux")
monkeypatch.setattr(platform, "release", lambda: "6.8.0-generic")
```

参见 `tests/agent/test_prompt_builder.py::TestEnvironmentHints` 的示例。

### 扩展系统提示词的执行环境块

关于主机操作系统、用户主目录、当前工作目录、终端后端和shell（Windows上的bash或PowerShell）的事实性指导，来自 `agent/prompt_builder.py::build_environment_hints()`。这也是WSL提示和每个后端探测逻辑所在的地方。约定：

- **本地终端后端** → 输出主机信息（操作系统、`$HOME`、当前工作目录）+ Windows特定说明（主机名≠用户名，`terminal` 使用bash而非PowerShell）。
- **远程终端后端**（`_REMOTE_TERMINAL_BACKENDS` 中的任何项：`docker, singularity, modal, daytona, ssh, managed_modal`） → **完全抑制**主机信息，只描述后端。通过 `tools.environments.get_environment(...).execute(...)` 在后端内部运行实时的 `uname`/`whoami`/`pwd` 探测，并在进程中缓存到 `_BACKEND_PROBE_CACHE`，如果探测超时则使用静态回退。
- **编写提示词的关键事实：** 当 `TERMINAL_ENV != "local"` 时，*每个*文件工具（`read_file`、`write_file`、`patch`、`search_files`）都运行在后端容器内，而不是主机上。在这种情况下，系统提示词绝不应描述主机——智能体无法访问主机。

完整的设计说明、精确的输出字符串以及测试注意事项：
`references/prompt-builder-environment-hints.md`。

**重构安全模式（POSIX等价性防护）：** 当你将内联逻辑提取到添加了Windows/平台特定行为的辅助函数时，在测试文件中保留一个 `_legacy_<name>` 预言函数，它是旧代码的逐字副本，然后对其参数化差异进行测试。例如：`tests/tools/test_code_execution_windows_env.py::TestPosixEquivalence`。这锁定了POSIX行为比特级完全相同的不变量，并使任何未来的偏离都能通过清晰的差异大声失败。

### 提交约定

```
类型：简洁的主题行

可选正文。
```

类型：`fix:`、`feat:`、`refactor:`、`docs:`、`chore:`

### 关键规则

- **永远不要破坏提示缓存** —— 不要在对话中途更改上下文、工具或系统提示词
- **消息角色交替** —— 永远不要连续两个assistant或两个user消息
- 对于所有路径，使用 `hermes_constants` 中的 `get_hermes_home()`（配置文件安全）
- 配置值放在 `config.yaml` 中，密钥放在 `.env` 中
- 新工具需要一个 `check_fn`，这样它们只在满足要求时出现