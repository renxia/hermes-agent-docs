---
title: "Hermes 智能体 — 配置、扩展或为 Hermes 智能体做贡献"
sidebar_label: "Hermes 智能体"
description: "配置、扩展或为 Hermes 智能体做贡献"
---

{/* 此页面由网站脚本 `generate-skill-docs.py` 根据技能的 `SKILL.md` 自动生成。请编辑源文件 `SKILL.md`，而非此页面。*/}

# Hermes 智能体

配置、扩展或为 Hermes 智能体做贡献。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/autonomous-ai-agents/hermes-agent` |
| 版本 | `2.1.0` |
| 作者 | Hermes Agent + Teknium |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `hermes`, `setup`, `configuration`, `multi-agent`, `spawning`, `cli`, `gateway`, `development` |
| 相关技能 | [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`opencode`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-opencode) |

:::info
以下是 Hermes 加载此技能时看到的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# Hermes 智能体

Hermes 智能体是 Nous Research 开发的开源 AI 智能体框架，可在终端、消息平台和 IDE 中运行。它与 Claude Code (Anthropic)、Codex (OpenAI) 和 OpenClaw 属于同一类别——都是使用工具调用来与系统交互的自主编码和任务执行智能体。Hermes 兼容任何 LLM 提供商（OpenRouter、Anthropic、OpenAI、DeepSeek、本地模型等 15+ 种），并可在 Linux、macOS 和 WSL 上运行。

Hermes 的独特之处：

- **通过技能自我改进** —— Hermes 通过将可重用程序保存为技能来从经验中学习。当它解决复杂问题、发现工作流程或被纠正时，可以将该知识保存为技能文档，并在未来的会话中加载。技能会随时间积累，使智能体更擅长处理您的特定任务和环境。
- **跨会话的持久记忆** —— 记住您是谁、您的偏好、环境详情和所学的教训。可插拔的记忆后端（内置、Honcho、Mem0 等）让您可以选择记忆的工作方式。
- **多平台网关** —— 同一个智能体可运行在 Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Email 和 10+ 其他平台上，并拥有完整的工具访问权限，而不仅仅是聊天。
- **提供商无关** —— 在工作流中途切换模型和提供商，无需更改其他任何内容。凭证池可自动轮换多个 API 密钥。
- **配置文件** —— 使用隔离的配置、会话、技能和内存运行多个独立的 Hermes 实例。
- **可扩展** —— 插件、MCP 服务器、自定义工具、Webhook 触发器、定时调度以及完整的 Python 生态系统。

人们将 Hermes 用于软件开发、研究、系统管理、数据分析、内容创作、家庭自动化，以及任何受益于具有持久上下文和完整系统访问权限的 AI 智能体的场景。

**此技能帮助您高效使用 Hermes 智能体** —— 设置、配置功能、生成额外的智能体实例、排查问题、查找正确的命令和设置，以及在需要扩展或贡献时了解系统的工作原理。

**文档:** https://hermes-agent.nousresearch.com/docs/

## 快速开始

```bash
# 安装
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# 交互式聊天（默认）
hermes

# 单次查询
hermes chat -q "法国的首都是什么？"

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
  --resume, -r SESSION      按 ID 或标题恢复会话
  --continue, -c [NAME]     按名称恢复，或恢复最近的会话
  --worktree, -w            隔离的 git 工作树模式（并行智能体）
  --skills, -s SKILL        预加载技能（逗号分隔或重复）
  --profile, -p NAME        使用命名的配置文件
  --yolo                    跳过危险命令审批
  --pass-session-id         在系统提示中包含会话 ID
```

不使用子命令时默认为 `chat`。

### 聊天

```
hermes chat [flags]
  -q, --query TEXT          单次查询，非交互式
  -m, --model MODEL         模型（例如 anthropic/claude-sonnet-4）
  -t, --toolsets LIST       逗号分隔的工具集
  --provider PROVIDER       强制指定提供商（openrouter, anthropic, nous 等）
  -v, --verbose             详细输出
  -Q, --quiet               隐藏横幅、加载指示器、工具预览
  --checkpoints             启用文件系统检查点 (/rollback)
  --source TAG              会话来源标签（默认：cli）
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
hermes login [--provider P] OAuth 登录（nous, openai-codex）
hermes logout               清除存储的认证信息
hermes doctor [--fix]       检查依赖项和配置
hermes status [--all]       显示组件状态
```

### 工具与技能

```
hermes tools                交互式工具启用/禁用（curses UI）
hermes tools list           显示所有工具和状态
hermes tools enable NAME    启用工具集
hermes tools disable NAME   禁用工具集

hermes skills list          列出已安装的技能
hermes skills search QUERY  搜索技能中心
hermes skills install ID    安装技能（ID 可以是中心标识符或直接的 https://…/SKILL.md URL；当 frontmatter 中没有 name 时，传入 --name 以覆盖）
hermes skills inspect ID    预览而不安装
hermes skills config        按平台启用/禁用技能
hermes skills check         检查更新
hermes skills update        更新过时的技能
hermes skills uninstall N   移除中心技能
hermes skills publish PATH  发布到注册表
hermes skills browse        浏览所有可用技能
hermes skills tap add REPO  添加 GitHub 仓库作为技能来源
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
hermes gateway run          在前台启动网关
hermes gateway install      作为后台服务安装
hermes gateway start/stop   控制服务
hermes gateway restart      重启服务
hermes gateway status       检查状态
hermes gateway setup        配置平台
```

支持的平台：Telegram、Discord、Slack、WhatsApp、Signal、Email、SMS、Matrix、Mattermost、Home Assistant、钉钉、飞书、企业微信、BlueBubbles (iMessage)、微信、API 服务器、Webhooks。Open WebUI 通过 API Server 适配器连接。

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
hermes cron create SCHED    创建：'30m'、'every 2h'、'0 9 * * *'
hermes cron edit ID         编辑调度、提示、投递方式
hermes cron pause/resume ID 控制任务状态
hermes cron run ID          在下一次 tick 时触发
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
hermes profile use NAME     设置固定默认值
hermes profile delete NAME  删除配置文件
hermes profile show NAME    显示详情
hermes profile alias NAME   管理包装脚本
hermes profile rename A B   重命名配置文件
hermes profile export NAME  导出为 tar.gz
hermes profile import FILE  从归档文件导入
```

### 凭证池

```
hermes auth add             交互式凭证向导
hermes auth list [PROVIDER] 列出池中的凭证
hermes auth remove P INDEX  按提供商 + 索引移除
hermes auth reset PROVIDER  清除耗尽状态
```

### 其他

```
hermes insights [--days N]  使用情况分析
hermes update               更新到最新版本
hermes pairing list/approve/revoke  DM 授权
hermes plugins list/install/remove  插件管理
hermes honcho setup/status  Honcho 记忆集成（需要 honcho 插件）
hermes memory setup/status/off  记忆提供商配置
hermes completion bash|zsh  Shell 自动补全
hermes acp                  ACP 服务器（IDE 集成）
hermes claw migrate         从 OpenClaw 迁移
hermes uninstall            卸载 Hermes
```

---

## 斜杠命令（会话内）

在交互式聊天会话中输入以下命令。新命令会经常更新；如果以下内容看起来过时，请在会话中运行 `/help` 获取权威列表，或查看[实时斜杠命令参考](https://hermes-agent.nousresearch.com/docs/reference/slash-commands)。
权威注册表是 `hermes_cli/commands.py` —— 每个消费者（自动补全、Telegram 菜单、Slack 映射、`/help`）都源自它。

### 会话控制
```
/new (/reset)        全新会话
/clear               清除屏幕 + 新会话 (CLI)
/retry               重新发送上一条消息
/undo                移除最后一次交互
/title [name]        为会话命名
/compress            手动压缩上下文
/stop                终止后台进程
/rollback [N]        恢复文件系统检查点
/snapshot [sub]      创建或恢复 Hermes 配置/状态的快照 (CLI)
/background <prompt> 在后台运行提示
/queue <prompt>      排队等待下一回合
/steer <prompt>      在下一次工具调用后注入消息而不中断
/agents (/tasks)     显示活跃的智能体和正在运行的任务
/resume [name]       恢复命名的会话
/goal [text|sub]     设置一个持续的目标，Hermes 会跨回合处理直到完成
                     （子命令：status, pause, resume, clear）
/redraw              强制完全重绘 UI (CLI)
```

### 配置
```
/config              显示配置 (CLI)
/model [name]        显示或更改模型
/personality [name]  设置个性
/reasoning [level]   设置推理级别（none|minimal|low|medium|high|xhigh|show|hide）
/verbose             循环切换：off → new → all → verbose
/voice [on|off|tts]  语音模式
/yolo                切换审批绕过
/busy [sub]          控制 Hermes 工作时 Enter 键的行为 (CLI)
                     （子命令：queue, steer, interrupt, status）
/indicator [style]   选择 TUI 忙碌指示器样式 (CLI)
                     （样式：kaomoji, emoji, unicode, ascii）
/footer [on|off]     在最终回复中切换网关运行时元数据页脚
/skin [name]         更改主题 (CLI)
/statusbar           切换状态栏 (CLI)
```

### 工具与技能
```
/tools               管理工具 (CLI)
/toolsets            列出工具集 (CLI)
/skills              搜索/安装技能 (CLI)
/skill <name>        将技能加载到会话中
/reload-skills       重新扫描 ~/.hermes/skills/ 以查找添加/移除的技能
/reload              将 .env 变量重新加载到正在运行的会话中 (CLI)
/reload-mcp          重新加载 MCP 服务器
/cron                管理定时任务 (CLI)
/curator [sub]       后台技能维护（status, run, pin, archive, …）
/kanban [sub]        多配置文件协作面板（tasks, links, comments）
/plugins             列出插件 (CLI)
```

### 网关
```
/approve             批准待处理的命令 (gateway)
/deny                拒绝待处理的命令 (gateway)
/restart             重启网关 (gateway)
/sethome             将当前聊天设为家庭频道 (gateway)
/update              将 Hermes 更新到最新版本 (gateway)
/topic [sub]         启用或检查 Telegram DM 主题会话 (gateway)
/platforms (/gateway) 显示平台连接状态 (gateway)
```

### 实用工具
```
/branch (/fork)      分支当前会话
/fast                切换优先级/快速处理
/browser             打开 CDP 浏览器连接
/history             显示对话历史 (CLI)
/save                将对话保存到文件 (CLI)
/copy [N]            将最后一条助手回复复制到剪贴板 (CLI)
/paste               粘贴剪贴板图像 (CLI)
/image               附加本地图像文件 (CLI)
```

### 信息
```
/help                显示命令
/commands [page]     浏览所有命令 (gateway)
/usage               Token 使用情况
/insights [days]     使用情况分析
/gquota              显示 Google Gemini Code Assist 配额使用情况 (CLI)
/status              会话信息 (gateway)
/profile             活动配置文件信息
/debug               上传调试报告（系统信息 + 日志）并获取可分享的链接
```

### 退出
```
/quit (/exit, /q)    退出 CLI
```

---

## 关键路径与配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥与安全凭证
$HERMES_HOME/skills/        已安装的技能
~/.hermes/sessions/         会话记录
~/.hermes/logs/             网关与错误日志
~/.hermes/auth.json         OAuth令牌与凭证池
~/.hermes/hermes-agent/     源代码（若通过git安装）
```

配置文件使用 `~/.hermes/profiles/<name>/` 目录结构，布局与主配置相同。

### 配置分区

可通过 `hermes config edit` 或 `hermes config set section.key value` 进行编辑。

| 分区 | 关键选项 |
|---------|-------------|
| `model` | `default`、`provider`、`base_url`、`api_key`、`context_length` |
| `agent` | `max_turns`（90）、`tool_use_enforcement` |
| `terminal` | `backend`（local/docker/ssh/modal）、`cwd`、`timeout`（180） |
| `compression` | `enabled`、`threshold`（0.50）、`target_ratio`（0.20） |
| `display` | `skin`、`tool_progress`、`show_reasoning`、`show_cost` |
| `stt` | `enabled`、`provider`（local/groq/openai/mistral） |
| `tts` | `provider`（edge/elevenlabs/openai/minimax/mistral/neutts） |
| `memory` | `memory_enabled`、`user_profile_enabled`、`provider` |
| `security` | `tirith_enabled`、`website_blocklist` |
| `delegation` | `model`、`provider`、`base_url`、`api_key`、`max_iterations`（50）、`reasoning_effort` |
| `checkpoints` | `enabled`、`max_snapshots`（50） |

完整配置参考：https://hermes-agent.nousresearch.com/docs/user-guide/configuration

### 服务商

支持20+家服务商。通过 `hermes model` 或 `hermes setup` 进行设置。

| 服务商 | 认证方式 | 密钥环境变量 |
|----------|------|-------------|
| OpenRouter | API密钥 | `OPENROUTER_API_KEY` |
| Anthropic | API密钥 | `ANTHROPIC_API_KEY` |
| Nous门户 | OAuth | `hermes auth` |
| OpenAI Codex | OAuth | `hermes auth` |
| GitHub Copilot | 令牌 | `COPILOT_GITHUB_TOKEN` |
| Google Gemini | API密钥 | `GOOGLE_API_KEY` 或 `GEMINI_API_KEY` |
| DeepSeek | API密钥 | `DEEPSEEK_API_KEY` |
| xAI / Grok | API密钥 | `XAI_API_KEY` |
| Hugging Face | 令牌 | `HF_TOKEN` |
| Z.AI / GLM | API密钥 | `GLM_API_KEY` |
| MiniMax | API密钥 | `MINIMAX_API_KEY` |
| MiniMax 中国版 | API密钥 | `MINIMAX_CN_API_KEY` |
| Kimi / Moonshot | API密钥 | `KIMI_API_KEY` |
| Alibaba / DashScope | API密钥 | `DASHSCOPE_API_KEY` |
| 小米 MiMo | API密钥 | `XIAOMI_API_KEY` |
| Kilo Code | API密钥 | `KILOCODE_API_KEY` |
| AI 网关 (Vercel) | API密钥 | `AI_GATEWAY_API_KEY` |
| OpenCode Zen | API密钥 | `OPENCODE_ZEN_API_KEY` |
| OpenCode Go | API密钥 | `OPENCODE_GO_API_KEY` |
| 通义千问 OAuth | OAuth | `hermes login --provider qwen-oauth` |
| 自定义端点 | 配置文件 | 在config.yaml中设置 `model.base_url` + `model.api_key` |
| GitHub Copilot ACP | 外部 | `COPILOT_CLI_PATH` 或 Copilot CLI |

完整服务商文档：https://hermes-agent.nousresearch.com/docs/integrations/providers

### 工具集

通过 `hermes tools`（交互式）或 `hermes tools enable/disable NAME` 进行启用/禁用。

| 工具集 | 提供功能 |
|---------|-----------------|
| `web` | 网络搜索与内容提取 |
| `search` | 仅网络搜索（`web` 的子集） |
| `browser` | 浏览器自动化（Browserbase、Camofox 或本地 Chromium） |
| `terminal` | Shell命令与进程管理 |
| `file` | 文件读写/搜索/补丁 |
| `code_execution` | 沙盒化Python执行 |
| `vision` | 图像分析 |
| `image_gen` | AI图像生成 |
| `video` | 视频分析与生成 |
| `tts` | 文本转语音 |
| `skills` | 技能浏览与管理 |
| `memory` | 跨会话持久化记忆 |
| `session_search` | 搜索历史对话 |
| `delegation` | 子智能体任务委派 |
| `cronjob` | 定时任务管理 |
| `clarify` | 向用户询问澄清问题 |
| `messaging` | 跨平台消息发送 |
| `todo` | 会话内任务规划与跟踪 |
| `kanban` | 多智能体工作队列工具（限定于工作者使用） |
| `debugging` | 额外的内省/调试工具（默认关闭） |
| `safe` | 用于锁定会话的最小化、低风险工具集 |
| `spotify` | Spotify播放与播放列表控制 |
| `homeassistant` | 智能家居控制（默认关闭） |
| `discord` | Discord集成工具 |
| `discord_admin` | Discord管理/审核工具 |
| `feishu_doc` | 飞书文档工具 |
| `feishu_drive` | 飞书云盘工具 |
| `yuanbao` | 元宝集成工具 |
| `rl` | 强化学习工具（默认关闭） |
| `moa` | 混合智能体（默认关闭） |

完整枚举位于 `toolsets.py` 中的 `TOOLSETS` 字典；`_HERMES_CORE_TOOLS` 是大多数平台继承的默认工具包。

工具更改在 `/reset`（新会话）时生效。在对话中途不会应用，以保持提示缓存。

## 安全与隐私设置

关于“为什么 Hermes 正在对我的输出/工具调用/命令执行此操作？”的常见设置项及其具体命令。其中大多数需要重启会话（在聊天中使用 `/reset` 或启动新的 `hermes` 调用），因为它们在启动时被读取一次。

### 工具输出中的密钥隐藏

密钥隐藏功能**默认关闭** — 工具输出（终端标准输出、`read_file`、网页内容、子智能体摘要等）会原样通过。如果用户希望 Hermes 在字符串进入对话上下文和日志之前，自动屏蔽看起来像 API 密钥、令牌和机密的内容：

```bash
hermes config set security.redact_secrets true       # 全局启用
```

**需要重启。** `security.redact_secrets` 在导入时被快照 — 在会话中切换它（例如通过工具调用执行 `export HERMES_REDACT_SECRETS=true`）对正在运行的进程**不会**生效。请告知用户在终端中运行 `hermes config set security.redact_secrets true`，然后启动新会话。这是刻意为之的 — 它可以防止 LLM 在任务执行中途自行切换此设置。

使用以下命令再次禁用：
```bash
hermes config set security.redact_secrets false
```

### 网关消息中的 PII 隐藏

与密钥隐藏独立。启用后，网关会在会话上下文到达模型之前，对用户 ID 进行哈希处理并剥离电话号码：

```bash
hermes config set privacy.redact_pii true    # 启用
hermes config set privacy.redact_pii false   # 禁用（默认）
```

### 命令批准提示

默认情况下（`approvals.mode: manual`），Hermes 会在运行被标记为破坏性的 Shell 命令（`rm -rf`、`git reset --hard` 等）之前提示用户。模式包括：

- `manual` — 始终提示（默认）
- `smart` — 使用辅助 LLM 自动批准低风险命令，对高风险命令进行提示
- `off` — 跳过所有批准提示（相当于 `--yolo`）

```bash
hermes config set approvals.mode smart       # 推荐的折中方案
hermes config set approvals.mode off         # 绕过一切（不推荐）
```

无需更改配置即可在每次调用时绕过：
- `hermes --yolo …`
- `export HERMES_YOLO_MODE=1`

注意：YOLO / `approvals.mode: off` **不会**关闭密钥隐藏功能。它们是独立的。

### Shell 钩子允许列表

某些 Shell 钩子集成需要在触发前进行显式允许。通过 `~/.hermes/shell-hooks-allowlist.json` 管理 — 在钩子首次尝试运行时会进行交互式提示。

### 禁用网页/浏览器/图像生成工具

要完全阻止模型访问网络或媒体工具，请打开 `hermes tools` 并按平台进行切换。在下次会话生效（`/reset`）。请参阅上面的“工具与技能”部分。

---

## 语音与转写

### STT（语音 → 文本）

来自消息平台的语音消息会被自动转写。

提供者优先级（自动检测）：
1. **本地 faster-whisper** — 免费，无需 API 密钥：`pip install faster-whisper`
2. **Groq Whisper** — 免费层：设置 `GROQ_API_KEY`
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

### TTS（文本 → 语音）

| 提供者 | 环境变量 | 免费？ |
|--------|----------|--------|
| Edge TTS | 无 | 是（默认） |
| ElevenLabs | `ELEVENLABS_API_KEY` | 免费层 |
| OpenAI | `VOICE_TOOLS_OPENAI_KEY` | 付费 |
| MiniMax | `MINIMAX_API_KEY` | 付费 |
| Mistral (Voxtral) | `MISTRAL_API_KEY` | 付费 |
| NeuTTS（本地） | 无 (`pip install neutts[all]` + `espeak-ng`) | 免费 |

语音命令：`/voice on`（语音转语音），`/voice tts`（始终语音），`/voice off`。

---

## 生成附加 Hermes 实例

将额外的 Hermes 进程作为完全独立的子进程运行 — 独立的会话、工具和环境。

### 何时使用此方法 vs `delegate_task`

| | `delegate_task` | 生成 `hermes` 进程 |
|-|-----------------|-------------------|
| 隔离性 | 独立的对话，共享的进程 | 完全独立的进程 |
| 持续时间 | 分钟级（受父循环限制） | 小时/天级 |
| 工具访问 | 父进程工具的子集 | 完整工具访问 |
| 交互式 | 否 | 是（PTY 模式） |
| 使用场景 | 快速并行子任务 | 长时间自主任务 |

### 单次执行模式

```
terminal(command="hermes chat -q 'Research GRPO papers and write summary to ~/research/grpo.md'", timeout=300)

# 后台执行长时间任务：
terminal(command="hermes chat -q 'Set up CI/CD for ~/myapp'", background=true)
```

### 交互式 PTY 模式（通过 tmux）

Hermes 使用 prompt_toolkit，这需要一个真实的终端。使用 tmux 进行交互式生成：

```
# 启动
terminal(command="tmux new-session -d -s agent1 -x 120 -y 40 'hermes'", timeout=10)

# 等待启动，然后发送消息
terminal(command="sleep 8 && tmux send-keys -t agent1 'Build a FastAPI auth service' Enter", timeout=15)

# 读取输出
terminal(command="sleep 20 && tmux capture-pane -t agent1 -p", timeout=5)

# 发送后续消息
terminal(command="tmux send-keys -t agent1 'Add rate limiting middleware' Enter", timeout=5)

# 退出
terminal(command="tmux send-keys -t agent1 '/exit' Enter && sleep 2 && tmux kill-session -t agent1", timeout=10)
```

### 多智能体协调

```
# 智能体 A：后端
terminal(command="tmux new-session -d -s backend -x 120 -y 40 'hermes -w'", timeout=10)
terminal(command="sleep 8 && tmux send-keys -t backend 'Build REST API for user management' Enter", timeout=15)

# 智能体 B：前端
terminal(command="tmux new-session -d -s frontend -x 120 -y 40 'hermes -w'", timeout=10)
terminal(command="sleep 8 && tmux send-keys -t frontend 'Build React dashboard for user management' Enter", timeout=15)

# 检查进度，在它们之间传递上下文
terminal(command="tmux capture-pane -t backend -p | tail -30", timeout=5)
terminal(command="tmux send-keys -t frontend 'Here is the API schema from the backend agent: ...' Enter", timeout=5)
```

### 会话恢复

```
# 恢复最近的会话
terminal(command="tmux new-session -d -s resumed 'hermes --continue'", timeout=10)

# 恢复特定会话
terminal(command="tmux new-session -d -s resumed 'hermes --resume 20260225_143052_a1b2c3'", timeout=10)
```

### 提示

- **对于快速子任务，首选 `delegate_task`** — 比生成完整进程开销更小
- **当生成编辑代码的智能体时，使用 `-w`（工作树模式）** — 防止 git 冲突
- **为单次执行模式设置超时** — 复杂任务可能需要 5-10 分钟
- **使用 `hermes chat -q` 实现“发后即忘”** — 无需 PTY
- **使用 tmux 进行交互式会话** — 原始 PTY 模式在 prompt_toolkit 中存在 `\r` 与 `\n` 的问题
- **对于计划任务**，使用 `cronjob` 工具而非生成进程 — 它可以处理交付和重试

---

# 持久化与后台系统

四个系统与主对话循环并行运行。此处提供快速参考；完整的开发者说明在 `AGENTS.md` 中，面向用户的文档位于 `website/docs/user-guide/features/` 下。

### 委派 (`delegate_task`)

同步子智能体生成——父级会等待子级的摘要完成，然后才继续自身的循环。具备隔离的上下文和终端会话。

- **单任务：** `delegate_task(goal, context, toolsets)`。
- **批量：** `delegate_task(tasks=[{goal, ...}, ...])` 会并行运行子任务，受 `delegation.max_concurrent_children` (默认 3) 限制。
- **角色：** `leaf` (默认；无法重新委派) 与 `orchestrator` (可以生成其自己的工作线程，受 `delegation.max_spawn_depth` 限制)。
- **非持久化。** 如果父级被中断，子级也会被取消。对于必须在对话轮次结束后继续运行的工作，请使用 `cronjob` 或 `terminal(background=True, notify_on_complete=True)`。

配置：`config.yaml` 中的 `delegation.*`。

### 定时任务 (计划作业)

持久化调度器 —— `cron/jobs.py` + `cron/scheduler.py`。通过 `cronjob` 工具、`hermes cron` CLI (`list`, `add`, `edit`, `pause`, `resume`, `run`, `remove`) 或 `/cron` 斜杠命令来驱动它。

- **计划方式：** 持续时间 (`"30m"`, `"2h"`)，"every" 短语 (`"every monday 9am"`)，5字段 cron (`"0 9 * * *"`)，或 ISO 时间戳。
- **每个作业的设置项：** `skills`、`model`/`provider` 覆盖、`script` (运行前数据收集；`no_agent=True` 会使脚本成为整个作业)、`context_from` (将作业 A 的输出链接到作业 B)、`workdir` (在特定目录中运行，并加载该目录的 `AGENTS.md` / `CLAUDE.md`)、多平台分发。
- **不变量：** 每次运行有3分钟硬中断，`.tick.lock` 文件防止跨进程重复触发，定时任务会话默认传递 `skip_memory=True`，且定时任务的交付内容会加上页眉/页脚，而不是直接镜像到目标网关会话中 (以保持角色交替的完整性)。

用户文档：https://hermes-agent.nousresearch.com/docs/user-guide/features/cron

### 管理器 (技能生命周期)

用于智能体创建的技能的后台维护。跟踪使用情况，将空闲技能标记为过时，归档过时技能，保留一个运行前的 tar.gz 备份以防丢失。

- **CLI：** `hermes curator <verb>` — `status`, `run`, `pause`, `resume`, `pin`, `unpin`, `archive`, `restore`, `prune`, `backup`, `rollback`。
- **斜杠命令：** `/curator <subcommand>` 镜像 CLI 功能。
- **范围：** 仅处理具有 `created_by: "agent"` 来源的技能。内置和从中心安装的技能不在操作范围内。**永不删除** —— 最具破坏性的操作是归档。被固定的技能免于所有自动转换和 LLM 审查。
- **遥测：** 位于 `~/.hermes/skills/.usage.json` 的侧车文件保存每个技能的 `use_count`、`view_count`、`patch_count`、`last_activity_at`、`state`、`pinned`。

配置：`curator.*` (`enabled`, `interval_hours`, `min_idle_hours`, `stale_after_days`, `archive_after_days`, `backup.*`)。
用户文档：https://hermes-agent.nousresearch.com/docs/user-guide/features/curator

### 看板 (多智能体工作队列)

持久化 SQLite 看板，用于多配置/多工作线程协作。用户通过 `hermes kanban <verb>` 驱动它；由调度器生成的工作线程看到一个专注的 `kanban_*` 工具集，由 `HERMES_KANBAN_TASK` 控制，因此在工作线程进程之外模式占用为零。

- **CLI 动词 (常用)：** `init`, `create`, `list` (别名 `ls`), `show`, `assign`, `link`, `unlink`, `comment`, `complete`, `block`, `unblock`, `archive`, `tail`。较不常用：`watch`, `stats`, `runs`, `log`, `dispatch`, `daemon`, `gc`。
- **工作线程工具集：** `kanban_show`, `kanban_complete`, `kanban_block`, `kanban_heartbeat`, `kanban_comment`, `kanban_create`, `kanban_link`。
- **调度器** 默认在网关内运行 (`kanban.dispatch_in_gateway: true`) —— 回收过时的认领，提升就绪的任务，原子性地认领任务，并生成指定的配置文件。连续约 5 次生成失败后会自动阻塞任务。
- **隔离性：** 看板是硬性边界 (工作线程在环境变量中固定获得 `HERMES_KANBAN_BOARD`)；租户是看板内的软性命名空间，用于工作区路径和内存键隔离。

用户文档：https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban

---

## Windows 特有怪癖

Hermes 可在 Windows 上原生运行（PowerShell、cmd、Windows Terminal、git-bash mintty、VS Code 集成终端）。大部分功能都能正常工作，但 Win32 和 POSIX 之间的一些差异曾困扰过我们——当你遇到新问题时，请在这里记录，以免下一个人（或下一次会话）从零开始重新发现它们。

### 输入 / 快捷键

**Alt+Enter 不能插入新行。** Windows Terminal 在终端层拦截了 Alt+Enter 来切换全屏——这个按键根本不会到达 prompt_toolkit。请改用 **Ctrl+Enter**。Windows Terminal 将 Ctrl+Enter 作为 LF (`c-j`) 发送，与普通的 Enter (`c-m` / CR) 不同，CLI 仅在 `win32` 上将 `c-j` 绑定到插入新行（参见 `cli.py` 中的 `_bind_prompt_submit_keys` 以及仅限 Windows 的 `c-j` 绑定）。副作用：原始的 Ctrl+J 按键在 Windows 上也会插入一个新行——这是不可避免的，因为 Windows Terminal 在 Win32 控制台 API 层将 Ctrl+Enter 和 Ctrl+J 合并为相同的键码。在 Windows 上原本没有与 Ctrl+J 冲突的绑定，因此这是一个无害的副作用。

mintty / git-bash 的行为相同（Alt+Enter 切换全屏），除非你在选项 → 按键中禁用 Alt+Fn 快捷键。更简单的方法是直接使用 Ctrl+Enter。

**诊断快捷键。** 运行 `python scripts/keystroke_diagnostic.py`（在仓库根目录），可以精确查看 prompt_toolkit 如何在当前终端中识别每个按键。这能解答诸如“Shift+Enter 是否作为独立按键传递？”（几乎从不——大多数终端将其合并为普通的 Enter）或“我的终端为 Ctrl+Enter 发送什么字节序列？”这类问题。Ctrl+Enter = c-j 的事实就是这样确定的。

### 配置 / 文件

**首次运行时 HTTP 400 "No models provided"。** `config.yaml` 是以 UTF-8 BOM 保存的（当 Windows 应用写入时很常见）。请重新保存为无 BOM 的 UTF-8 格式。`hermes config edit` 会以无 BOM 方式写入；在记事本中手动编辑通常是罪魁祸首。

### `execute_code` / 沙盒

**WinError 10106**（"无法加载或初始化请求的服务提供商"）来自沙盒子进程——它无法创建 `AF_INET` 套接字，因此 loopback-TCP RPC 回退在 `connect()` 之前失败。根本原因通常**不是**损坏的 Winsock LSP；而是 Hermes 自己的环境清理器从子进程环境中删除了 `SYSTEMROOT` / `WINDIR` / `COMSPEC`。Python 的 `socket` 模块需要 `SYSTEMROOT` 来定位 `mswsock.dll`。已通过 `tools/code_execution_tool.py` 中的 `_WINDOWS_ESSENTIAL_ENV_VARS` 白名单修复。如果你仍然遇到此问题，请在 `execute_code` 块内打印 `os.environ` 以确认 `SYSTEMROOT` 已设置。完整的诊断步骤在 `references/execute-code-sandbox-env-windows.md` 中。

### 测试 / 贡献

**`scripts/run_tests.sh` 无法在 Windows 上直接使用** ——它寻找 POSIX 的 venv 布局（`.venv/bin/activate`）。Hermes 安装的 venv 位于 `venv/Scripts/`，并且也没有 pip 或 pytest（为了安装大小而精简）。变通方法：将 `pytest + pytest-xdist + pyyaml` 安装到系统 Python 3.11 的用户 site 中，然后直接调用 pytest 并设置 `PYTHONPATH`：

```bash
"/c/Program Files/Python311/python" -m pip install --user pytest pytest-xdist pyyaml
export PYTHONPATH="$(pwd)"
"/c/Program Files/Python311/python" -m pytest tests/foo/test_bar.py -v --tb=short -n 0
```

使用 `-n 0`，而不是 `-n 4` —— `pyproject.toml` 中的默认 `addopts` 已经包含了 `-n`，并且包装器的 CI 一致性保证不适用于 POSIX 之外的环境。

**仅限 POSIX 的测试需要跳过守卫。** 代码库中已存在常用的标记：
- 符号链接 —— 在 Windows 上需要提升的权限
- `0o600` 文件模式 —— NTFS 默认不强制执行 POSIX 模式位
- `signal.SIGALRM` —— 仅限 Unix（参见 `tests/conftest.py::_enforce_test_timeout`）
- Winsock / Windows 特定回归 —— `@pytest.mark.skipif(sys.platform != "win32", ...)`

使用现有的跳过模式风格（`sys.platform == "win32"` 或 `sys.platform.startswith("win")`）以与测试套件的其余部分保持一致。

### 路径 / 文件系统

**行尾符。** Git 可能会警告 `LF will be replaced by CRLF the next time Git touches it`。这无关紧要——仓库的 `.gitattributes` 会进行规范化。不要让编辑器自动将已提交的 POSIX 换行文件转换为 CRLF。

**正斜杠几乎在任何地方都有效。** `C:/Users/...` 被每个 Hermes 工具和大多数 Windows API 接受。在代码和日志中首选正斜杠——避免在 bash 中对反斜杠进行 shell 转义。

---

## 故障排除

### 语音不工作
1. 检查 `config.yaml` 中的 `stt.enabled: true`
2. 验证提供商：`pip install faster-whisper` 或设置 API 密钥
3. 在网关中：`/restart`。在 CLI 中：退出并重新启动。

### 工具不可用
1. `hermes tools` —— 检查工具集是否为你的平台启用
2. 一些工具需要环境变量（检查 `.env`）
3. 启用工具后执行 `/reset`

### 模型/提供商问题
1. `hermes doctor` —— 检查配置和依赖项
2. `hermes login` —— 重新认证 OAuth 提供商
3. 检查 `.env` 中是否有正确的 API 密钥
4. **Copilot 403**：`gh auth login` 令牌**不能**用于 Copilot API。你必须通过 `hermes model` → GitHub Copilot 使用 Copilot 专用的 OAuth 设备代码流程。

### 更改未生效
- **工具/技能：** `/reset` 会启动一个使用更新工具集的新会话
- **配置更改：** 在网关中：`/restart`。在 CLI 中：退出并重新启动。
- **代码更改：** 重启 CLI 或网关进程

### 技能未显示
1. `hermes skills list` —— 验证已安装
2. `hermes skills config` —— 检查平台启用情况
3. 显式加载：`/skill name` 或 `hermes -s name`

### 网关问题
首先检查日志：
```bash
grep -i "failed to send\|error" ~/.hermes/logs/gateway.log | tail -20
```

常见的网关问题：
- **网关在 SSH 注销时终止**：启用 linger：`sudo loginctl enable-linger $USER`
- **网关在 WSL2 关闭时终止**：WSL2 需要 `/etc/wsl.conf` 中的 `systemd=true` 才能使 systemd 服务正常工作。没有它，网关会回退到 `nohup`（会话关闭时终止）。
- **网关崩溃循环**：重置失败状态：`systemctl --user reset-failed hermes-gateway`

### 特定平台问题
- **Discord 机器人无响应**：必须在 Bot → 特权网关意图中启用 **Message Content Intent**。
- **Slack 机器人仅在私信中工作**：必须订阅 `message.channels` 事件。没有它，机器人会忽略公共频道。
- **Windows 特有问题**（`Alt+Enter` 换行、WinError 10106、UTF-8 BOM 配置、测试套件、行尾符）：请参阅上面专门的 **Windows 特有怪癖** 章节。

### 辅助模型不工作
如果 `auxiliary` 任务（视觉、压缩、session_search）静默失败，则 `auto` 提供商找不到后端。要么设置 `OPENROUTER_API_KEY` 或 `GOOGLE_API_KEY`，要么显式配置每个辅助任务的提供商：
```bash
hermes config set auxiliary.vision.provider <your_provider>
hermes config set auxiliary.vision.model <model_name>
```

---

## 何处可找到信息

| 需要找…… | 位置 |
|----------------|----------|
| 配置选项 | `hermes config edit` 或 [配置文档](https://hermes-agent.nousresearch.com/docs/user-guide/configuration) |
| 可用工具 | `hermes tools list` 或 [工具参考](https://hermes-agent.nousresearch.com/docs/reference/tools-reference) |
| 斜杠命令 | 会话中输入 `/help` 或 [斜杠命令参考](https://hermes-agent.nousresearch.com/docs/reference/slash-commands) |
| 技能目录 | `hermes skills browse` 或 [技能目录](https://hermes-agent.nousresearch.com/docs/reference/skills-catalog) |
| 提供商设置 | `hermes model` 或 [提供商指南](https://hermes-agent.nousresearch.com/docs/integrations/providers) |
| 平台设置 | `hermes gateway setup` 或 [消息文档](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/) |
| MCP 服务器 | `hermes mcp list` 或 [MCP指南](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp) |
| 配置文件 | `hermes profile list` 或 [配置文件文档](https://hermes-agent.nousresearch.com/docs/user-guide/profiles) |
| 定时任务 | `hermes cron list` 或 [定时任务文档](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron) |
| 记忆功能 | `hermes memory status` 或 [记忆文档](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory) |
| 环境变量 | `hermes config env-path` 或 [环境变量参考](https://hermes-agent.nousresearch.com/docs/reference/environment-variables) |
| CLI 命令 | `hermes --help` 或 [CLI参考](https://hermes-agent.nousresearch.com/docs/reference/cli-commands) |
| 网关日志 | `~/.hermes/logs/gateway.log` |
| 会话文件 | `~/.hermes/sessions/` 或 `hermes sessions browse` |
| 源代码 | `~/.hermes/hermes-agent/` |

---

## 贡献者快速参考

面向偶尔贡献者和PR作者。完整的开发者文档：https://hermes-agent.nousresearch.com/docs/developer-guide/

### 项目布局

<!-- ascii-guard-ignore -->
```
hermes-agent/
├── run_agent.py          # AIAgent — 核心对话循环
├── model_tools.py        # 工具发现与调度
├── toolsets.py           # 工具集定义
├── cli.py                # 交互式CLI (HermesCLI)
├── hermes_state.py       # SQLite 会话存储
├── agent/                # 提示构建器、上下文压缩、记忆、模型路由、凭证池、技能调度
├── hermes_cli/           # CLI子命令、配置、设置、命令
│   ├── commands.py       # 斜杠命令注册表 (CommandDef)
│   ├── config.py         # DEFAULT_CONFIG、环境变量定义
│   └── main.py           # CLI入口点和argparse
├── tools/                # 每个工具一个文件
│   └── registry.py       # 中心工具注册表
├── gateway/              # 消息网关
│   └── platforms/        # 平台适配器 (telegram, discord 等)
├── cron/                 # 作业调度器
├── tests/                # ~3000个pytest测试
└── website/              # Docusaurus 文档网站
```
<!-- ascii-guard-ignore-end -->

配置文件：`~/.hermes/config.yaml`（设置），`~/.hermes/.env`（API密钥）。

### 添加一个工具（3个文件）

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

自动发现：任何顶层带有 `registry.register()` 调用的 `tools/*.py` 文件都会被自动导入——无需手动维护列表。

所有处理器必须返回JSON字符串。路径请使用 `get_hermes_home()`，切勿硬编码 `~/.hermes`。

### 添加一个斜杠命令

1.  在 `hermes_cli/commands.py` 的 `COMMAND_REGISTRY` 中添加 `CommandDef`
2.  在 `cli.py` → `process_command()` 中添加处理器
3.  （可选）在 `gateway/run.py` 中添加网关处理器

所有消费者（帮助文本、自动完成、Telegram菜单、Slack映射）都会自动从中央注册表派生。

### 智能体循环（高层级）

```
run_conversation():
  1. 构建系统提示
  2. 循环，当迭代次数 < 最大值时：
     a. 调用LLM (OpenAI格式的消息 + 工具模式)
     b. 如果有 tool_calls → 通过 handle_function_call() 调度每一个 → 附加结果 → 继续
     c. 如果是文本响应 → 返回
  3. 接近token限制时，上下文压缩自动触发
```

### 测试

```bash
python -m pytest tests/ -o 'addopts=' -q   # 完整套件
python -m pytest tests/tools/ -q            # 特定区域
```

- 测试会自动将 `HERMES_HOME` 重定向到临时目录——从不会触碰真实的 `~/.hermes/`
- 推送任何更改前，运行完整测试套件
- 使用 `-o 'addopts='` 清除任何内置的pytest标志

**Windows贡献者：** `scripts/run_tests.sh` 目前会寻找POSIX虚拟环境（`.venv/bin/activate` / `venv/bin/activate`），在Windows上（布局是 `venv/Scripts/activate` + `python.exe`）会出错。Hermes安装的虚拟环境 `venv/Scripts/` 也没有 `pip` 或 `pytest`——为了最终用户的安装大小被精简了。变通方法：将 pytest + pytest-xdist + pyyaml 安装到系统级 Python 3.11 的用户站点中（`/c/Program Files/Python311/python -m pip install --user pytest pytest-xdist pyyaml`），然后直接运行测试：

```bash
export PYTHONPATH="$(pwd)"
"/c/Program Files/Python311/python" -m pytest tests/tools/test_foo.py -v --tb=short -n 0
```

使用 `-n 0`（而非 `-n 4`），因为 `pyproject.toml` 的默认 `addopts` 已经包含了 `-n`，并且包装器的 CI 一致性方案在非 POSIX 系统上不适用。

**跨平台测试守卫：** 使用仅限 POSIX 系统调用的测试需要跳过标记。代码库中已有一些常见用例：
- 创建符号链接 → `@pytest.mark.skipif(sys.platform == "win32", reason="Symlinks require elevated privileges on Windows")` （见 `tests/cron/test_cron_script.py`）
- POSIX 文件权限（0o600等） → `@pytest.mark.skipif(sys.platform.startswith("win"), reason="POSIX mode bits not enforced on Windows")` （见 `tests/hermes_cli/test_auth_toctou_file_modes.py`）
- `signal.SIGALRM` → 仅Unix系统可用（见 `tests/conftest.py::_enforce_test_timeout`）
- 实时 Winsock / Windows 特定回归测试 → `@pytest.mark.skipif(sys.platform != "win32", reason="Windows-specific regression")`

**当被测代码还调用了 `platform.system()` / `platform.release()` / `platform.mac_ver()` 时，仅对 `sys.platform` 打猴子补丁是不够的。** 这些函数会独立地重新读取真实的操作系统信息，因此一个在 Windows 运行器上设置 `sys.platform = "linux"` 的测试仍然会看到 `platform.system() == "Windows"` 并走 Windows 分支。需要将这三个一起打补丁：

```python
monkeypatch.setattr(sys, "platform", "linux")
monkeypatch.setattr(platform, "system", lambda: "Linux")
monkeypatch.setattr(platform, "release", lambda: "6.8.0-generic")
```

参见 `tests/agent/test_prompt_builder.py::TestEnvironmentHints` 中的一个实例。

### 扩展系统提示的执行环境块

关于宿主操作系统、用户主目录、工作目录、终端后端以及 shell（Windows上是bash还是PowerShell）的事实性指导，是从 `agent/prompt_builder.py::build_environment_hints()` 发出的。这也是WSL提示和每个后端的探测逻辑所在。惯例：

- **本地终端后端** → 发出宿主信息（OS、`$HOME`、cwd）以及 Windows 特定注释（主机名≠用户名，`terminal` 使用 bash 而非 PowerShell）。
- **远程终端后端**（`_REMOTE_TERMINAL_BACKENDS` 中的任何：`docker, singularity, modal, daytona, ssh, vercel_sandbox, managed_modal`） → **完全抑制**宿主信息，仅描述该后端。通过 `tools.environments.get_environment(...).execute(...)` 在后端内部运行一个实时的 `uname`/`whoami`/`pwd` 探测，按进程缓存在 `_BACKEND_PROBE_CACHE` 中，如果探测超时则有静态回退。
- **提示编写的关键事实：** 当 `TERMINAL_ENV != "local"` 时，*每个*文件工具（`read_file`、`write_file`、`patch`、`search_files`）都在后端容器内运行，而不是在宿主上运行。在这种情况下，系统提示绝不能描述宿主——智能体无法访问它。

完整的设计笔记、确切的输出字符串以及测试陷阱：
`references/prompt-builder-environment-hints.md`。

**重构安全模式（POSIX等价性守卫）：** 当你将内联逻辑提取到一个添加了 Windows/平台特定行为的辅助函数时，在测试文件中保留一个 `_legacy_<name>` 预言函数（旧代码的逐字副本），然后与它进行参数化差异对比。示例：`tests/tools/test_code_execution_windows_env.py::TestPosixEquivalence`。这锁定了POSIX行为在比特级别上完全相同的不变性，并使得任何未来的漂移都会因清晰的差异而大声失败。

### 提交约定

```
类型: 简明主题行

可选正文。
```

类型：`fix:`、`feat:`、`refactor:`、`docs:`、`chore:`

### 关键规则

- **永远不要破坏提示缓存** —— 不要在对话中途更改上下文、工具或系统提示
- **消息角色交替** —— 永远不要连续出现两个助手或两个用户消息
- 对所有路径使用 `hermes_constants` 中的 `get_hermes_home()`（配置文件安全）
- 配置值放在 `config.yaml`，密钥放在 `.env`
- 新工具需要一个 `check_fn`，这样它们只在满足要求时才出现