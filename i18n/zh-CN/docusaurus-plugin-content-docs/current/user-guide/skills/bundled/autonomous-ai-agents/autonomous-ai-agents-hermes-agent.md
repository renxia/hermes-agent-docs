---
title: "Hermes 智能体 — 配置、扩展或为 Hermes 智能体贡献代码"
sidebar_label: "Hermes 智能体"
description: "配置、扩展或为 Hermes 智能体贡献代码"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Hermes 智能体

配置、扩展或为 Hermes 智能体贡献代码。

## Skill metadata

| | |
|---|---|
| Source | Bundled (默认安装) |
| Path | `skills/autonomous-ai-agents/hermes-agent` |
| Version | `2.1.0` |
| Author | Hermes 智能体 + Teknium |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `hermes`, `setup`, `configuration`, `multi-agent`, `spawning`, `cli`, `gateway`, `development` |
| Related skills | [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`opencode`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-opencode) |

## 参考：full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Hermes 智能体

Hermes Agent 是 Nous Research 开发的一个开源 AI 智能体框架，它可以在您的终端、消息平台和 IDE 中运行。它属于与 Claude Code (Anthropic)、Codex (OpenAI) 和 OpenClaw 相同的范畴——这些都是利用工具调用来与系统交互的自主编码和任务执行智能体。Hermes 可与任何 LLM 提供商（OpenRouter, Anthropic, OpenAI, DeepSeek, 本地模型以及 15+ 个其他提供商）配合使用，并可在 Linux、macOS 和 WSL 上运行。

Hermes 的独特之处：

- **通过技能进行自我改进** — Hermes 通过将可重用程序保存为技能来从经验中学习。当它解决一个复杂问题、发现一个工作流程或被纠正时，它可以将这些知识持久化为一个技能文档，供未来的会话加载。技能随时间积累，使智能体能更好地完成您特定的任务和环境要求。
- **跨会话的持久性记忆** — 记住你是谁、您的偏好、环境细节以及学到的经验教训。可插拔的内存后端（内置、Honcho、Mem0 等）让您可以选择记忆的工作方式。
- **多平台网关** — 同一个智能体可以在 Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Email 和 10+ 个其他平台上运行，并拥有完整的工具访问权限，而不仅仅是聊天功能。
- **不依赖提供商** — 在工作流程中途更换模型和提供商，无需更改其他任何内容。凭证池会自动轮换多个 API 密钥。
- **配置档案 (Profiles)** — 以隔离的配置、会话、技能和记忆运行多个独立的 Hermes 实例。
- **可扩展性** — 包括插件、MCP 服务器、自定义工具、Webhook 触发器、Cron 调度以及完整的 Python 生态系统。

人们使用 Hermes 进行软件开发、研究、系统管理、数据分析、内容创作、家庭自动化，以及任何受益于具有持久上下文和完整系统访问权限的 AI 智能体的事情。

**此技能有助于您有效地使用 Hermes Agent** — 包括设置它、配置功能、生成额外的智能体实例、故障排除、查找正确的命令和设置，以及理解当您需要扩展或贡献时系统的工作原理。

**文档：** https://hermes-agent.nousresearch.com/docs/

## 快速入门

```bash
# 安装
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash

# 交互式聊天（默认）
hermes

# 单次查询
hermes chat -q "法国的首都是哪里？"

# 设置向导
hermes setup

# 更改模型/提供商
hermes model

# 检查健康状况
hermes doctor
```

---

## CLI 参考

### 全局标志 (Global Flags)

```
hermes [flags] [command]

  --version, -V             显示版本
  --resume, -r SESSION      按 ID 或标题恢复会话
  --continue, -c [NAME]     按名称或最近的会话恢复
  --worktree, -w            隔离的 git 工作树模式（多个智能体）
  --skills, -s SKILL        预加载技能（逗号分隔或重复）
  --profile, -p NAME        使用命名的配置档案
  --yolo                    跳过危险命令审批
  --pass-session-id         在系统提示中包含会话 ID
```

没有子命令默认执行 `chat`。

### Chat (聊天)

```
hermes chat [flags]
  -q, --query TEXT          单次查询，非交互式
  -m, --model MODEL         模型（例如 anthropic/claude-sonnet-4）
  -t, --toolsets LIST       工具集列表（逗号分隔）
  --provider PROVIDER       强制指定提供商（openrouter, anthropic, nous 等）
  -v, --verbose             详细输出
  -Q, --quiet               抑制横幅、加载指示器和工具预览
  --checkpoints             启用文件系统检查点（/rollback）
  --source TAG              会话来源标签（默认：cli）
```

### 配置 (Configuration)

```
hermes setup [section]      交互式向导（model|terminal|gateway|tools|agent）
hermes model                交互式模型/提供商选择器
hermes config               查看当前配置
hermes config edit          在 $EDITOR 中打开 config.yaml
hermes config set KEY VAL   设置一个配置值
hermes config path          打印 config.yaml 路径
hermes config env-path      打印 .env 路径
hermes config check         检查是否存在/是否过时配置
hermes config migrate       使用新选项更新配置
hermes auth                 交互式凭证管理器
hermes auth add PROVIDER    添加 OAuth 或 API 密钥凭证（例如 nous, openai-codex, qwen-oauth）
hermes auth list            列出存储的凭证
hermes auth remove PROVIDER 移除一个存储的凭证
hermes doctor [--fix]       检查依赖项和配置
hermes status [--all]       显示组件状态
```

### 工具与技能 (Tools & Skills)

```
hermes tools                交互式工具启用/禁用（curses UI）
hermes tools list           显示所有工具及其状态
hermes tools enable NAME    启用一个工具集
hermes tools disable NAME   禁用一个工具集

hermes skills list          列出已安装的技能
hermes skills search QUERY  搜索技能中心
hermes skills install ID    安装一个技能（ID 可以是中心标识符或直接的 https://…/SKILL.md URL；如果前文没有名称，请使用 --name 覆盖）
hermes skills inspect ID    预览而不安装
hermes skills config        按平台启用/禁用技能
hermes skills check         检查更新
hermes skills update        更新过时的技能
hermes skills uninstall N   移除一个中心技能
hermes skills publish PATH  发布到注册表
hermes skills browse        浏览所有可用的技能
hermes skills tap add REPO  将 GitHub 仓库添加为技能源
```

### MCP 服务器 (MCP Servers)

```
hermes mcp serve            以 MCP 服务器身份运行 Hermes
hermes mcp add NAME         添加一个 MCP 服务器（--url 或 --command）
hermes mcp remove NAME      移除一个 MCP 服务器
hermes mcp list             列出配置的服务器
hermes mcp test NAME        测试连接
hermes mcp configure NAME   切换工具选择
```

内置 MCP 客户端如何连接服务器（stdio/HTTP）、自动发现它们的工具，并将它们作为一级工具暴露，以及目录安装（`hermes mcp install <name>`）：`skill_view(name="hermes-agent", file_path="references/native-mcp.md")`。

### 网关 (Gateway - Messaging Platforms)

```
hermes gateway run          在前台启动网关
hermes gateway install      安装为后台服务
hermes gateway start/stop   控制服务
hermes gateway restart      重启服务
hermes gateway status       检查状态
hermes gateway setup        配置平台
```

支持的平台：Telegram, Discord, Slack, WhatsApp, Signal, Email, SMS, Matrix, Mattermost, Home Assistant, DingTalk, Feishu, WeCom, BlueBubbles (iMessage), Weixin (WeChat), API Server, Webhooks。Open WebUI 通过 API Server 适配器连接。

平台文档：https://hermes-agent.nousresearch.com/docs/user-guide/messaging/

### 会话 (Sessions)

```
hermes sessions list        列出最近的会话
hermes sessions browse      交互式选择器
hermes sessions export OUT  导出为 JSONL
hermes sessions rename ID T 重命名一个会话
hermes sessions delete ID   删除一个会话
hermes sessions prune       清理旧会话（--older-than N 天）
hermes sessions stats       会话存储统计信息
```

### Cron 作业 (Cron Jobs)

```
hermes cron list            列出作业（禁用状态的则使用 --all）
hermes cron create SCHED    创建：'30m', 'every 2h', '0 9 * * *'
hermes cron edit ID         编辑调度、提示、交付
hermes cron pause/resume ID 控制作业状态
hermes cron run ID          在下一次滴答时触发
hermes cron remove ID       删除一个作业
hermes cron status          调度器状态
```

### Webhooks (网络钩子)

```
hermes webhook subscribe N  在 /webhooks/<name> 创建路由
hermes webhook list         列出订阅
hermes webhook remove NAME  移除一个订阅
hermes webhook test NAME    发送测试 POST 请求
```

完整的设置、路由配置、负载模板化和事件驱动的智能体运行模式：`skill_view(name="hermes-agent", file_path="references/webhooks.md")`。

### 配置档案 (Profiles)

```
hermes profile list         列出所有配置档案
hermes profile create NAME  创建（--clone, --clone-all, --clone-from）
hermes profile use NAME     设置粘性默认值
hermes profile delete NAME  删除一个配置档案
hermes profile show NAME    显示详情
hermes profile alias NAME   管理包装脚本
hermes profile rename A B   重命名一个配置档案
hermes profile export NAME  导出为 tar.gz
hermes profile import FILE  从归档文件导入
```

### 凭证池 (Credential Pools)

```
hermes auth add             交互式凭证向导
hermes auth list [PROVIDER] 列出集中管理的凭证
hermes auth remove P INDEX  按提供商 + 索引移除
hermes auth reset PROVIDER  清除耗尽状态
```

### 其他 (Other)

```
hermes insights [--days N]  使用情况分析
hermes update               更新到最新版本
hermes pairing list/approve/revoke  DM 授权
hermes plugins list/install/remove  插件管理
hermes honcho setup/status  Honcho 内存集成（需要 Honcho 插件）
hermes memory setup/status/off  内存提供商配置
hermes completion bash|zsh  Shell 补全
hermes acp                  ACP 服务器（IDE 集成）
hermes claw migrate         从 OpenClaw 迁移
hermes uninstall            卸载 Hermes
```

---

## 斜杠命令 (Slash Commands - In-Session)

在交互式聊天会话期间输入这些命令。新命令经常出现；如果下面任何内容看起来过时，请在会话中运行 `/help` 以获取权威列表，或查看 [实时斜杠命令参考](https://hermes-agent.nousresearch.com/docs/reference/slash-commands)。记录的注册表是 `hermes_cli/commands.py` — 每个消费者（自动补全、Telegram 菜单、Slack 映射、`/help`）都源自它。

### 会话控制 (Session Control)
```
/new (/reset)        新的会话
/clear               清除屏幕 + 新会话 (CLI)
/retry               重新发送上一个消息
/undo                移除上一次交流
/title [name]        命名会话
/compress            手动压缩上下文
/stop                终止后台进程
/rollback [N]        恢复文件系统检查点
/snapshot [sub]      创建或恢复 Hermes 配置/状态快照 (CLI)
/background <prompt> 在后台运行提示
/queue <prompt>      排队到下一轮次
/steer <prompt>      在下一次工具调用后注入消息，而不中断
/agents (/tasks)     显示活动的智能体和正在运行的任务
/resume [name]       恢复一个命名的会话
/goal [text|sub]     设置 Hermes 在完成之前跨轮次工作的持续目标
                     (子命令：status, pause, resume, clear)
/redraw              强制完整 UI 重绘 (CLI)
```

### 配置 (Configuration)
```
/config              显示配置 (CLI)
/model [name]        显示或更改模型
/personality [name]  设置个性
/reasoning [level]   设置推理（none|minimal|low|medium|high|xhigh|show|hide）
/verbose             循环：off → new → all → verbose
/voice [on|off|tts]  语音模式
/yolo                切换审批绕过
/busy [sub]          控制 Hermes 工作时 Enter 键的功能 (CLI)
                     (子命令：queue, steer, interrupt, status)
/indicator [style]   选择 TUI 忙碌指示器样式 (CLI)
                     (样式：kaomoji, emoji, unicode, ascii)
/footer [on|off]     在最终回复上切换网关运行时元数据页脚
/skin [name]         更改主题 (CLI)
/statusbar           切换状态栏 (CLI)
```

### 工具与技能 (Tools & Skills)
```
/tools               管理工具 (CLI)
/toolsets            列出工具集 (CLI)
/skills              搜索/安装技能 (CLI)
/skill <name>        将技能加载到会话中
/reload-skills       重新扫描 ~/.hermes/skills/ 以查找添加/移除的技能
/reload              将 .env 变量重新加载到正在运行的会话中 (CLI)
/reload-mcp          重新加载 MCP 服务器
/cron                管理 Cron 作业 (CLI)
/curator [sub]       后台技能维护（status, run, pin, archive, …）
/kanban [sub]        多配置档案协作板（任务、链接、评论）
/plugins             列出插件 (CLI)
```

### 网关 (Gateway)
```
/approve             批准一个待定的命令 (gateway)
/deny                拒绝一个待定的命令 (gateway)
/restart             重启网关 (gateway)
/sethome             将当前聊天设置为主频道 (gateway)
/update              更新 Hermes 到最新版本 (gateway)
/topic [sub]         启用或检查 Telegram DM 主题会话 (gateway)
/platforms (/gateway) 显示平台连接状态 (gateway)
```

### 实用工具 (Utility)
```
/branch (/fork)      分支当前会话
/fast                切换优先级/快速处理
/browser             打开 CDP 浏览器连接
/history             显示对话历史 (CLI)
/save                将对话保存到文件 (CLI)
/copy [N]            将上一个助手的回复复制到剪贴板 (CLI)
/paste               附加剪贴板图像 (CLI)
/image               附加本地图像文件 (CLI)
```

### 信息 (Info)
```
/help                显示命令
/commands [page]     浏览所有命令 (gateway)
/usage               令牌使用情况
/insights [days]     使用情况分析
/status              会话信息 (gateway)
/profile             活动配置档案信息
/debug               上传调试报告（系统信息 + 日志）并获取可分享的链接
```

### 退出 (Exit)
```
/quit (/exit, /q)    退出 CLI
```

## 关键路径和配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥和秘密信息（如果设置了 $HERMES_HOME）
$HERMES_HOME/skills/        已安装的技能
~/.hermes/sessions/         网关路由索引、请求转储、*.jsonl 转录本（以及当 sessions.write_json_snapshots: true 时可选的每次会话 JSON 快照）
~/.hermes/state.db          规范会话存储（SQLite + FTS5）
~/.hermes/logs/             网关和错误日志
~/.hermes/auth.json         OAuth 令牌和凭证池
~/.hermes/hermes-agent/     源代码（如果通过 git 安装）
```

配置文件使用 `~/.hermes/profiles/<name>/`，布局相同。

### 配置部分

使用 `hermes config edit` 或 `hermes config set section.key value` 进行编辑。

| 部分 | 键选项 |
|---------|-------------|
| `model` | `default` (默认), `provider` (提供者), `base_url` (基础网址), `api_key` (API密钥), `context_length` (上下文长度)（显式覆盖；若设置为 `""` 则从服务器 `/v1/models` 自动检测） |
| `agent` | `max_turns` (最大轮次) (90), `tool_use_enforcement` (工具使用强制执行) |
| `terminal` | `backend` (后端) (local/docker/ssh/modal), `cwd` (当前工作目录), `timeout` (超时) (180) |
| `compression` | `enabled` (启用), `threshold` (阈值) (0.50), `target_ratio` (目标比率) (0.20) |
| `display` | `skin` (皮肤), `tool_progress` (工具进度), `show_reasoning` (显示推理过程), `show_cost` (显示成本) |
| `stt` | `enabled` (启用), `provider` (提供者) (local/groq/openai/mistral) |
| `tts` | `provider` (提供者) (edge/elevenlabs/openai/minimax/mistral/neutts) |
| `memory` | `memory_enabled` (内存启用), `user_profile_enabled` (用户配置文件启用), `provider` (提供者) |
| `security` | `tirith_enabled` (Tirith 启用), `website_blocklist` (网站黑名单) |
| `delegation` | `model` (模型), `provider` (提供者), `base_url` (基础网址), `api_key` (API密钥), `max_iterations` (最大迭代次数) (50), `reasoning_effort` (推理投入度) |
| `checkpoints` | `enabled` (启用), `max_snapshots` (最大快照数) (50) |

完整配置参考：https://hermes-agent.nousresearch.com/docs/user-guide/configuration

### 提供者（Providers）

支持 20+ 个提供者。通过 `hermes model` 或 `hermes setup` 设置。

| 提供者 | 认证方式 (Auth) | 密钥环境变量 (Key env var) |
|----------|------|-------------|
| OpenRouter | API 密钥 | `OPENROUTER_API_KEY` |
| Anthropic | API 密钥 | `ANTHROPIC_API_KEY` |
| Nous Portal | OAuth | `hermes auth` |
| OpenAI Codex | OAuth | `hermes auth` |
| GitHub Copilot | Token | `COPILOT_GITHUB_TOKEN` |
| Google Gemini | API 密钥 | `GOOGLE_API_KEY` 或 `GEMINI_API_KEY` |
| DeepSeek | API 密钥 | `DEEPSEEK_API_KEY` |
| xAI / Grok | API 密钥 | `XAI_API_KEY` |
| Hugging Face | Token | `HF_TOKEN` |
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
| 自定义端点 (Custom endpoint) | 配置 (Config) | 在 config.yaml 中设置 `model.base_url` + `model.api_key` |
| GitHub Copilot ACP | 外部 (External) | `COPILOT_CLI_PATH` 或 Copilot CLI |

完整提供者文档：https://hermes-agent.nousresearch.com/docs/integrations/providers

### 工具集（Toolsets）

通过 `hermes tools` (交互式) 或 `hermes tools enable/disable NAME` 启用/禁用。

| 工具集 | 功能描述 |
|---------|-----------------|
| `web` | 网络搜索和内容提取 |
| `search` | 仅网络搜索（`web` 的子集） |
| `browser` | 浏览器自动化 (Browserbase, Camofox 或本地 Chromium) |
| `terminal` | Shell 命令和进程管理 |
| `file` | 文件读/写/搜索/补丁 |
| `code_execution` | 沙盒化的 Python 执行 |
| `vision` | 图像分析 |
| `image_gen` | AI 图像生成 |
| `video` | 视频分析和生成 |
| `tts` | 文本转语音 |
| `skills` | 技能浏览和管理 |
| `memory` | 持久化的跨会话记忆 |
| `session_search` | 会话历史搜索 |
| `delegation` | 子智能体任务委托 |
| `cronjob` | 定时任务管理 |
| `clarify` | 向用户提出澄清性问题 |
| `messaging` | 跨平台消息发送 |
| `todo` | 会话内任务规划和跟踪 |
| `kanban` | 多智能体工作队列工具（受限于工作者） |
| `debugging` | 额外的内部检查/调试工具（默认禁用） |
| `safe` | 锁定会话的最小、低风险工具集 |
| `spotify` | Spotify 播放和播放列表控制 |
| `homeassistant` | 智能家居控制（默认禁用） |
| `discord` | Discord 集成工具 |
| `discord_admin` | Discord 管理/审核工具 |
| `feishu_doc` | Feishu (Lark) 文档工具 |
| `feishu_drive` | Feishu (Lark) 云盘工具 |
| `yuanbao` | Yuanbao 集成工具 |
| `rl` | 强化学习工具（默认禁用） |

完整的枚举存在于 `toolsets.py` 中的 `TOOLSETS` 字典；`_HERMES_CORE_TOOLS` 是大多数平台继承的默认捆绑包。

工具更改在 `/reset` (新会话) 时生效。它们不会在对话中途应用，以保留提示缓存。

## 安全与隐私开关

关于“为什么 Hermes 对我的输出/工具调用/命令做 X？”的常见疑问和相应的修改命令。这些设置大多需要一个新的会话（聊天中的 `/reset`，或启动新的 `hermes` 调用），因为它们在启动时只读取一次。

### 工具输出中的秘密信息屏蔽

秘密信息屏蔽是**默认开启的**——工具输出（终端 stdout、`read_file`、网页内容、子智能体摘要等）在进入对话上下文和日志之前都会被扫描，以查找看起来像 API 密钥、令牌和秘密信息的字符串。请保持启用状态以便正常使用：

```bash
hermes config set security.redact_secrets true       # 全局保持启用
```

**需要重启。** `security.redact_secrets` 在导入时被快照保存——如果在会话中途（例如，通过工具调用中的 `export HERMES_REDACT_SECRETS=false`）进行切换，将不会对正在运行的进程生效。请告诉用户从终端更改配置，然后启动一个新的会话。这是故意的——它防止 LLM 在任务过程中自我翻转该开关。

仅在您故意需要原始凭证字符串用于调试或屏蔽器开发时才禁用：
```bash
hermes config set security.redact_secrets false
```

### 网关消息中的 PII（个人身份信息）屏蔽

这与秘密信息屏蔽是分开的。当启用时，网关会在信息到达模型之前对用户 ID 进行哈希处理，并从会话上下文中剥离电话号码：

```bash
hermes config set privacy.redact_pii true    # 启用
hermes config set privacy.redact_pii false   # 禁用（默认）
```

### 命令审批提示

默认情况下（`approvals.mode: manual`），Hermes 会在运行被标记为破坏性操作的 Shell 命令（如 `rm -rf`、`git reset --hard` 等）之前提示用户。模式包括：

- `manual` — 始终提示（默认）
- `smart` — 使用辅助 LLM 自动批准低风险命令，对高风险命令进行提示
- `off` — 跳过所有审批提示（等同于 `--yolo`）

```bash
hermes config set approvals.mode smart       # 推荐的中间地带
hermes config set approvals.mode off         # 绕过一切（不推荐）
```

无需更改配置的单次调用绕过：
- `hermes --yolo …`
- `export HERMES_YOLO_MODE=1`

注意：YOLO / `approvals.mode: off` 不会关闭秘密信息屏蔽。它们是独立的。

### Shell Hooks 白名单

某些 Shell Hook 集成功能要求在触发之前进行显式白名单设置。通过 `~/.hermes/shell-hooks-allowlist.json` 管理——当一个 Hook 想要运行时，会在第一次时交互式提示。

### 禁用 Web/浏览器/图像生成工具

要完全让模型远离网络或媒体工具，请打开 `hermes tools` 并按平台进行切换。该设置在下一个会话中生效（`/reset`）。请参阅上方的“工具与技能”部分。

---

## 语音和转录

### STT（语音 → 文本）

来自消息平台的语音信息都会被自动转录。

提供商优先级（自动检测）：
1. **Local faster-whisper** — 免费，无需 API 密钥：`pip install faster-whisper`
2. **Groq Whisper** — 免费层级：设置 `GROQ_API_KEY`
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

| 提供商 | Env var | 是否免费？ |
|----------|---------|-------|
| Edge TTS | 无 | 是（默认） |
| ElevenLabs | `ELEVENLABS_API_KEY` | 免费层级 |
| OpenAI | `VOICE_TOOLS_OPENAI_KEY` | 付费 |
| MiniMax | `MINIMAX_API_KEY` | 付费 |
| Mistral (Voxtral) | `MISTRAL_API_KEY` | 付费 |
| NeuTTS (local) | 无（`pip install neutts[all]` + `espeak-ng`） | 免费 |

语音命令：`/voice on`（语音转语音）、`/voice tts`（始终为语音）、`/voice off`。

---

## 启动额外的 Hermes 实例

以完全独立的子进程形式运行额外的 Hermes 进程——即独立会话、工具和环境。

### 何时使用此功能，何时使用 `delegate_task`

| | `delegate_task` | 启动 `hermes` 进程 |
|---|---|---|
| 隔离性 | 单个对话，共享进程 | 完全独立的进程 |
| 时长 | 分钟（受父循环限制） | 小时/天 |
| 工具访问 | 父工具集的子集 | 完全的工具访问 |
| 交互式 | 否 | 是（PTY 模式） |
| 用例 | 快速并行子任务 | 长期的自主任务 |

### 一次性模式 (One-Shot Mode)

```
terminal(command="hermes chat -q 'Research GRPO papers and write summary to ~/research/grpo.md'", timeout=300)

# 用于长时间任务的后台运行：
terminal(command="hermes chat -q 'Set up CI/CD for ~/myapp'", background=true)
```

### 交互式 PTY 模式（通过 tmux）

Hermes 使用 prompt_toolkit，这需要一个真实的终端。请使用 tmux 进行交互式启动：

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

### 多智能体协调 (Multi-Agent Coordination)

```
# Agent A：后端
terminal(command="tmux new-session -d -s backend -x 120 -y 40 'hermes -w'", timeout=10)
terminal(command="sleep 8 && tmux send-keys -t backend 'Build REST API for user management' Enter", timeout=15)

# Agent B：前端
terminal(command="tmux new-session -d -s frontend -x 120 -y 40 'hermes -w'", timeout=10)
terminal(command="sleep 8 && tmux send-keys -t frontend 'Build React dashboard for user management' Enter", timeout=15)

# 检查进度，在它们之间传递上下文
terminal(command="tmux capture-pane -t backend -p | tail -30", timeout=5)
terminal(command="tmux send-keys -t frontend 'Here is the API schema from the backend agent: ...' Enter", timeout=5)
```

### 会话恢复 (Session Resume)

```
# 恢复最近的会话
terminal(command="tmux new-session -d -s resumed 'hermes --continue'", timeout=10)

# 恢复特定的会话
terminal(command="tmux new-session -d -s resumed 'hermes --resume 20260225_143052_a1b2c3'", timeout=10)
```

### 提示

- **对于快速子任务，优先使用 `delegate_task`** — 比启动完整进程的开销小得多。
- **当启动编辑代码的智能体时，请使用 `-w`（工作树模式）** — 防止 Git 冲突。
- **为一次性模式设置超时** — 复杂任务可能需要 5-10 分钟。
- **对于“即发即忘”的任务，使用 `hermes chat -q`** — 无需 PTY。
- **对于交互式会话，请使用 tmux** — 原生 PTY 模式与 prompt_toolkit 在 `\r` 和 `\n` 上存在问题。
- **对于定时任务，请使用 `cronjob` 工具而不是启动进程** — 它负责交付和重试。

---

## 持久化和后台系统

有四个系统与主对话循环并行运行。这里提供快速参考；完整的开发者说明在 `AGENTS.md` 中，面向用户的文档在 `website/docs/user-guide/features/` 下。

### 委托 (`delegate_task`)

同步子智能体启动——父进程会等待子进程的摘要后再继续自己的循环。隔离的上下文 + 终端会话。

- **单次：** `delegate_task(goal, context, toolsets)`。
- **批量：** `delegate_task(tasks=[{goal, ...}, ...])` 在并行中运行子任务，受 `delegation.max_concurrent_children`（默认 3）限制。
- **角色：** `leaf`（叶节点；不能再次委托）与 `orchestrator`（编排者）（可以启动自己的工作者，受 `delegation.max_spawn_depth` 限制）。
- **非持久化。** 如果父进程被中断，子进程将被取消。对于必须存活于回合之外的工作，请使用 `cronjob` 或 `terminal(background=True, notify_on_complete=True)`。

配置：`config.yaml` 中的 `delegation.*`。

### Cron（定时任务）

持久化调度器——`cron/jobs.py` + `cron/scheduler.py`。通过 `cronjob` 工具、`hermes cron` CLI (`list`、`add`、`edit`、`pause`、`resume`、`run`、`remove`) 或 `/cron` 斜杠命令来驱动它。

- **调度：** 持续时间（`"30m"`、`"2h"`）、“每”短语（`"every monday 9am"`）、5 字段 cron（`"0 9 * * *"`）或 ISO 时间戳。
- **每个任务的控制项：** `skills`、`model`/`provider` 覆盖、`script`（预运行数据收集；`no_agent=True` 使脚本成为整个任务）、`context_from`（将任务 A 的输出链式传递给任务 B）、`workdir`（在特定目录中运行，并加载其 `AGENTS.md` / `CLAUDE.md`）、多平台交付。
- **不变性：** 每次运行都有 3 分钟的硬中断限制，`.tick.lock` 文件防止跨进程重复滴答，cron 会话默认传递 `skip_memory=True`，并且 cron 交付物会以头部/尾部形式进行封装，而不是被镜像到目标网关会话中（保持角色交替不变）。

用户文档：https://hermes-agent.nousresearch.com/docs/user-guide/features/cron

### Curator（技能生命周期）

对智能体创建的技能进行后台维护。跟踪使用情况，将空闲技能标记为陈旧，存档陈旧技能，保留一次运行前的 tar.gz 备份，以防任何内容丢失。

- **CLI：** `hermes curator <verb>` — 包括 `status`、`run`、`pause`、`resume`、`pin`、`unpin`、`archive`、`restore`、`prune`、`backup`、`rollback`。
- **斜杠命令：** `/curator <subcommand>` 镜像 CLI。
- **范围：** 只处理具有 `created_by: "agent"` 来源的技能。捆绑和 hub 安装的技能是禁区。**永不删除**——最大的破坏性操作是存档。被固定的技能免于任何自动转换和任何 LLM 审查通过。
- **遥测数据：** 位于 `~/.hermes/skills/.usage.json` 的伴侣程序，包含每个技能的 `use_count`、`view_count`、`patch_count`、`last_activity_at`、`state`、`pinned`。

配置：`curator.*`（`enabled`、`interval_hours`、`min_idle_hours`、`stale_after_days`、`archive_after_days`、`backup.*`）。
用户文档：https://hermes-agent.nousresearch.com/docs/user-guide/features/curator

### Kanban（多智能体工作队列）

用于多配置/多工作者协作的持久化 SQLite 看板。用户通过 `hermes kanban <verb>` 来驱动它；由调度器启动的工作者会看到受 `HERMES_KANBAN_TASK` 限制的特定 `kanban_*` 工具集，而编排体则可以选择使用更广泛的 `kanban` 工具集。正常会话除非配置否则不会有 `kanban_*` 的模式足迹。

- **CLI 命令（常见）：** `init`、`create`、`list` (别名 `ls`)、`show`、`assign`、`link`、`unlink`、`comment`、`complete`、`block`、`unblock`、`archive`、`tail`。不那么常见的包括：`watch`、`stats`、`runs`、`log`、`dispatch`、`daemon`、`gc`。
- **工作者/编排体工具集：** `kanban_show`、`kanban_complete`、`kanban_block`、`kanban_heartbeat`、`kanban_comment`、`kanban_create`、`kanban_link`；明确启用 `kanban` 工具集的配置，即使不在调度器启动的任务中，也包括 `kanban_list` 和 `kanban_unblock` 以便进行看板路由。
- **调度器** 默认在网关内部运行（`kanban.dispatch_in_gateway: true`）——它会回收陈旧的声明、提升准备好的任务、原子性地声明并启动分配的配置。如果连续发生 `failure_limit` 次（默认 2；可通过 `kanban.failure_limit` 或每个任务的 `max_retries` 配置）的启动失败，则会自动阻止该任务。
- **隔离性：** 看板是硬边界（工作者在环境中被 `HERMES_KANBAN_BOARD` 固定）；租户是在看板内部的一个软命名空间，用于工作区路径 + 内存键隔离。

用户文档：https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban

## Windows 特有怪癖

Hermes 原生运行在 Windows 上（PowerShell, cmd, Windows Terminal, git-bash mintty, VS Code integrated terminal）。大多数功能都能正常工作，但 Win32 和 POSIX 之间的一些差异困扰了我们——请在此处记录新的问题，以便下次使用者（或下一次会话）不必从零开始重新发现它们。

### 输入/按键绑定

**Alt+Enter 不会插入换行符。** Windows Terminal 在终端层拦截 Alt+Enter 以切换全屏模式——该按键从未到达 prompt_toolkit。请改用 **Ctrl+Enter**。Windows Terminal 将 Ctrl+Enter 交付为 LF (`c-j`)，这与普通的 Enter (`c-m` / CR) 不同，而 CLI 只在 `win32` 上将 `c-j` 绑定到换行插入（参见 `_bind_prompt_submit_keys` 和 `cli.py` 中的 Windows 特有 `c-j` 绑定）。
**副作用：** 原生的 Ctrl+J 按键在 Windows 上也会插入换行符——这是不可避免的，因为 Windows Terminal 将 Ctrl+Enter 和 Ctrl+J 坍缩为 Win32 控制台 API 层中的同一按键码。Windows 上没有冲突的 Ctrl+J 绑定，所以这只是一个无害的副作用。

mintty / git-bash 的行为也是一样的（Alt+Enter 全屏），除非你在 Options → Keys 中禁用了 Alt+Fn 快捷键。直接使用 Ctrl+Enter 更简单。

**诊断按键绑定。** 运行 `python scripts/keystroke_diagnostic.py` (repo root) 以查看 prompt_toolkit 如何识别当前终端中的每个按键。它回答了诸如“Shift+Enter 是否作为一个独立的按键通过？”（几乎从没有——大多数终端将其坍缩为普通 Enter）或“我的终端发送 Ctrl+Enter 时是什么字节序列？”这些问题。这就是确立 Ctrl+Enter = c-j 事实依据的方法。

### 配置/文件

**首次运行时 HTTP 400 "未提供模型"。** `config.yaml` 是使用带 BOM 的 UTF-8 保存的（这是 Windows 应用写入文件时常见的现象）。请重新保存为不带 BOM 的 UTF-8。`hermes config edit` 会以不带 BOM 的方式写入；Notepad 中的手动编辑是常见的原因。

### execute_code/沙箱

**沙箱中的 WinError 10106**（“无法加载或初始化请求的服务提供程序”）——它不能创建 AF_INET 套接字，因此在 `connect()` 之前循环回环 TCP RPC 回退机制就失败了。根本原因通常不是 Winsock LSP 损坏；而是 Hermes 自身的环境清理器移除了子环境中的 `SYSTEMROOT` / `WINDIR` / `COMSPEC`。Python 的 `socket` 模块需要 `SYSTEMROOT` 来定位 `mswsock.dll`。已通过 `tools/code_execution_tool.py` 中的 `_WINDOWS_ESSENTIAL_ENV_VARS` 白名单修复。如果仍然遇到此问题，请在 `execute_code` 块内回显 `os.environ` 以确认 `SYSTEMROOT` 已设置。完整的诊断方法见 `references/execute-code-sandbox-env-windows.md`。

### 测试/贡献

**`scripts/run_tests.sh` 在 Windows 上无法直接运行**——它查找 POSIX 虚拟环境布局（`.venv/bin/activate`）。Hermes 安装的 `venv/Scripts/` 虚拟环境既没有 pip，也没有 pytest（为了减小安装体积而被剥离）。解决方法：将 `pytest + pytest-xdist + pyyaml` 安装到系统 Python 3.11 的用户站点中，然后使用设置了 `PYTHONPATH` 的方式直接调用 pytest：

```bash
"/c/Program Files/Python311/python" -m pip install --user pytest pytest-xdist pyyaml
export PYTHONPATH="$(pwd)"
"/c/Program Files/Python311/python" -m pytest tests/foo/test_bar.py -v --tb=short -n 0
```

使用 `-n 0`，而不是 `-n 4`——`pyproject.toml` 的默认 `addopts` 中已经包含了 `-n`，并且包装器（wrapper）的 CI 平行性保证不适用于非 POSIX 环境。

**需要跳过 POSIX 独有的测试。** 代码库中已包含常见的标记：
*   符号链接（Symlinks）— Windows 上的提升权限
*   `0o600` 文件模式——NTFS 上默认不强制执行的 POSIX 模式位
*   `signal.SIGALRM` — Unix 独有（参见 `tests/conftest.py::_enforce_test_timeout`）
*   Winsock / Windows 特定的回归测试 — `@pytest.mark.skipif(sys.platform != "win32", ...)`

请使用现有的跳过模式（`sys.platform == "win32"` 或 `sys.platform.startswith("win")`）以保持与测试套件其余部分的一致性。

### 路径/文件系统

**行尾符。** Git 可能会警告“下次 Git 触及它时，LF 将被 CRLF 替换”。这只是外观问题——仓库的 `.gitattributes` 会进行标准化。不要让编辑器自动将提交的 POSIX 换行文件转换为 CRLF。

**正斜杠（Forward slashes）几乎在所有地方都有效。** `C:/Users/...` 被 Hermes 的所有工具和大多数 Windows API 所接受。代码和日志中应优先使用正斜杠——这可以避免 Bash 中的反斜杠转义问题。

## 故障排除

### 语音功能不工作
1. 在 config.yaml 中检查 `stt.enabled: true`
2. 验证提供商：`pip install faster-whisper` 或设置 API 密钥
3. 在网关中执行 `/restart`。在 CLI 中，退出并重新启动。

### 工具不可用
1. `hermes tools` — 检查您的平台是否启用了工具集
2. 有些工具需要环境变量（请检查 `.env`）
3. 启用工具后执行 `/reset`

### 模型/提供商问题
1. `hermes doctor` — 检查配置和依赖项
2. `hermes auth` — 重新认证 OAuth 提供商（或 `hermes auth add <provider>`）
3. 检查 `.env` 中是否包含正确的 API 密钥
4. **Copilot 403**：`gh auth login` 的令牌无法用于 Copilot API。您必须通过 `hermes model` → GitHub Copilot 使用特定的 Copilot OAuth 设备代码流程。

### 更改未生效
- **工具/技能**：`/reset` 会以更新后的工具集启动新会话
- **配置更改**：在网关中执行 `/restart`。在 CLI 中，退出并重新启动。
- **代码更改**：重启 CLI 或网关进程

### 技能未显示
1. `hermes skills list` — 验证是否已安装
2. `hermes skills config` — 检查平台启用状态
3. 显式加载：`/skill name` 或 `hermes -s name`

### 网关问题
先检查日志：
```bash
grep -i "failed to send\|error" ~/.hermes/logs/gateway.log | tail -20
```

常见的网关问题：
- **SSH 登出时网关崩溃**：启用 linger（保持活动状态）：`sudo loginctl enable-linger $USER`
- **WSL2 关闭时网关崩溃**：WSL2 要求 `/etc/wsl.conf` 中设置 `systemd=true`，以便系统级服务正常工作。如果没有这个设置，网关会回退到 `nohup`（当会话关闭时就会崩溃）。
- **网关崩溃循环**：重置失败状态：`systemctl --user reset-failed hermes-gateway`

### 特定平台问题
- **Discord 机器人静默**：必须在 Bot → Privileged Gateway Intents 中启用**消息内容意图 (Message Content Intent)**。
- **Slack 机器人仅在私信中工作**：必须订阅 `message.channels` 事件。否则，该机器人会忽略公共频道。
- **Windows 特定问题**（`Alt+Enter` 新行、WinError 10106、UTF-8 BOM 配置、测试套件、行尾符）：请参阅上方的专用**Windows 特有怪癖 (Windows-Specific Quirks)** 部分。

### 辅助模型不工作
如果 `auxiliary`（辅助）任务（视觉、压缩、会话搜索）静默失败，则 `auto` 提供商无法找到后端。请设置 `OPENROUTER_API_KEY` 或 `GOOGLE_API_KEY`，或显式配置每个辅助任务的提供商：
```bash
hermes config set auxiliary.vision.provider <your_provider>
hermes config set auxiliary.vision.model <model_name>
```

---
### 上下文窗口显示尺寸错误

如果 Hermes 报告的上下文窗口小于您的本地模型支持的尺寸
（例如，llama-server 设置了 `-c 262144` 但 Hermes 显示为 128k）：

**检查 `model.context_length` 是否被显式设置。** Hermes 使用一个多源解析链（按优先级从高到低）：

1. config.yaml 中的 `model.context_length` — **如果设置了，将阻止自动检测**
2. 每个模型的自定义提供商设置
3. 持久化缓存（会存活重启）
4. 来自您服务器的 `/v1/models` 端点 — 当上述任何一项都没有覆盖它时，会自动检测

**修复方法：** 清除覆盖设置，以便自动检测流程继续进行：


## 查找内容参考表

| 寻找的内容 | 位置 |
|----------------|----------|
| 配置选项 | `hermes config edit` 或 [配置文档](https://hermes-agent.nousresearch.com/docs/user-guide/configuration) |
| 可用工具 | `hermes tools list` 或 [工具参考](https://hermes-agent.nousresearch.com/docs/reference/tools-reference) |
| 斜杠命令 | 会话中的 `/help` 或 [斜杠命令参考](https://hermes-agent.nousresearch.com/docs/reference/slash-commands) |
| 技能目录 | `hermes skills browse` 或 [技能目录](https://hermes-agent.nousresearch.com/docs/reference/skills-catalog) |
| 提供商设置 | `hermes model` 或 [提供商指南](https://hermes-agent.nousresearch.com/docs/integrations/providers) |
| 平台设置 | `hermes gateway setup` 或 [消息传递文档](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/) |
| MCP 服务器 | `hermes mcp list` 或 [MCP 指南](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp) |
| 配置文件 | `hermes profile list` 或 [配置文件文档](https://hermes-agent.nousresearch.com/docs/user-guide/profiles) |
| Cron 作业 | `hermes cron list` 或 [Cron 文档](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron) |
| 内存状态 | `hermes memory status` 或 [内存文档](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory) |
| 环境变量 | `hermes config env-path` 或 [环境变量参考](https://hermes-agent.nousresearch.com/docs/reference/environment-variables) |
| CLI 命令 | `hermes --help` 或 [CLI 参考](https://hermes-agent.nousresearch.com/docs/reference/cli-commands) |
| 网关日志 | `~/.hermes/logs/gateway.log` |
| 会话文件 | `hermes sessions browse` (读取 state.db) |
| 源代码 | `~/.hermes/hermes-agent/` |

---

## 贡献者快速参考指南

面向偶尔的贡献者和 PR 作者。完整的开发者文档：https://hermes-agent.nousresearch.com/docs/developer-guide/

### 项目布局

<!-- ascii-guard-ignore -->
```
hermes-agent/
├── run_agent.py          # AIAgent — 核心对话循环
├── model_tools.py        # 工具发现和分派
├── toolsets.py           # 工具集定义
├── cli.py                # 交互式 CLI (HermesCLI)
├── hermes_state.py       # SQLite 会话存储
├── agent/                # 提示词构建器、上下文压缩、内存、模型路由、凭证池化、技能分派
├── hermes_cli/           # CLI 子命令、配置、设置、命令
│   ├── commands.py       # 斜杠命令注册表 (CommandDef)
│   ├── config.py         # DEFAULT_CONFIG, 环境变量定义
│   └── main.py           # CLI 入口点和 argparse
├── tools/                # 每个工具一个文件
│   └── registry.py       # 中央工具注册表
├── gateway/              # 消息网关
│   └── platforms/        # 平台适配器 (telegram, discord 等)
├── cron/                 # 作业调度器
├── tests/                # ~3000 个 pytest 测试
└── website/              # Docusaurus 文档网站
```
<!-- ascii-guard-ignore-end -->

配置：`~/.hermes/config.yaml`（设置），`~/.hermes/.env`（API 密钥）— 当 `$HERMES_HOME` 设置时，两者都位于该目录下。

### 添加一个工具（3 个文件）

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

自动发现：任何带有顶级 `registry.register()` 调用的 `tools/*.py` 文件都会被自动导入 — 无需手动列出。

所有处理器都必须返回 JSON 字符串。使用 `get_hermes_home()` 获取路径，切勿硬编码 `~/.hermes`。

### 添加一个斜杠命令

1. 将 `CommandDef` 添加到 `hermes_cli/commands.py` 中的 `COMMAND_REGISTRY`
2. 在 `cli.py` 中添加处理器 → `process_command()`
3. (可选) 在 `gateway/run.py` 中添加网关处理器

所有消费者（帮助文本、自动补全、Telegram 菜单、Slack 映射）都会自动从中央注册表派生。

### 智能体循环（高层级）

```
run_conversation():
  1. 构建系统提示词
  2. 当迭代次数 < 最大值时循环：
     a. 调用 LLM (OpenAI 格式消息 + 工具模式)
     b. 如果有 tool_calls → 通过 handle_function_call() 分派每个工具 → 追加结果 → 继续
     c. 如果是文本响应 → 返回
  3. 上下文压缩会在接近令牌限制时自动触发
```

### 测试

```bash
python -m pytest tests/ -o 'addopts=' -q   # 完整套件
python -m pytest tests/tools/ -q            # 特定区域
```

- 测试会自动将 `HERMES_HOME` 重定向到临时目录 — 切勿触碰真实的 `~/.hermes/`
- 在推送任何更改之前运行完整的测试套件
- 使用 `-o 'addopts='` 清除任何内置的 pytest 标志

**Windows 贡献者：** `scripts/run_tests.sh` 当前查找 POSIX venvs（`.venv/bin/activate` / `venv/bin/activate`），而 Windows 上的布局是 `venv/Scripts/activate` + `python.exe`，因此会报错。Hermes 安装的 venv 在 `venv/Scripts/` 下面也没有 `pip` 或 `pytest` — 它被剥离以减小最终用户安装尺寸。解决方法：将 pytest + pytest-xdist + pyyaml 安装到系统 Python 3.11 用户站点（`/c/Program Files/Python311/python -m pip install --user pytest pytest-xdist pyyaml`），然后直接运行测试：

```bash
export PYTHONPATH="$(pwd)"
"/c/Program Files/Python311/python" -m pytest tests/tools/test_foo.py -v --tb=short -n 0
```

使用 `-n 0`（而不是 `-n 4`），因为 `pyproject.toml` 的默认 `addopts` 中已经包含了 `-n`，而包装器的 CI-parity 故事不适用于非 POSIX。

**跨平台测试保护措施：** 使用仅限 POSIX 的系统调用的测试需要一个跳过标记。代码库中已有的常见示例包括：
- 符号链接创建 → `@pytest.mark.skipif(sys.platform == "win32", reason="Symlinks require elevated privileges on Windows")` (参见 `tests/cron/test_cron_script.py`)
- POSIX 文件模式（0o600 等）→ `@pytest.mark.skipif(sys.platform.startswith("win"), reason="POSIX mode bits not enforced on Windows")` (参见 `tests/hermes_cli/test_auth_toctou_file_modes.py`)
- `signal.SIGALRM` → 仅限 Unix（参见 `tests/conftest.py::_enforce_test_timeout`）
- 实时 Winsock / Windows 特定回归测试 → `@pytest.mark.skipif(sys.platform != "win32", reason="Windows-specific regression")`

**猴子补丁 (Monkeypatching) `sys.platform` 是不够的**，当被测代码也调用 `platform.system()` / `platform.release()` / `platform.mac_ver()` 时。这些函数会独立地重新读取实际操作系统信息，因此一个在 Windows 运行器上设置 `sys.platform = "linux"` 的测试仍然会看到 `platform.system() == "Windows"` 并走 Windows 分支。请同时补丁这三个：

```python
monkeypatch.setattr(sys, "platform", "linux")
monkeypatch.setattr(platform, "system", lambda: "Linux")
monkeypatch.setattr(platform, "release", lambda: "6.8.0-generic")
```

请参阅 `tests/agent/test_prompt_builder.py::TestEnvironmentHints` 查看已成功的示例。

### 扩展系统提示词的执行环境块

关于宿主操作系统、用户主目录、当前工作目录 (cwd)、终端后端和 Shell（Windows 上的 bash 与 PowerShell）的事实指导，由 `agent/prompt_builder.py::build_environment_hints()` 发出。这也是 WSL 提示和每个后端的探测逻辑所在之处。惯例：

- **本地终端后端** → 发出宿主信息（OS、`$HOME`、cwd）+ Windows 特有说明（主机名 ≠ 用户名，`terminal` 使用 bash 而非 PowerShell）。
- **远程终端后端**（`_REMOTE_TERMINAL_BACKENDS` 中的任何内容：`docker, singularity, modal, daytona, ssh, managed_modal`）→ **完全抑制**宿主信息，只描述后端。一个实时的 `uname`/`whoami`/`pwd` 探测会在后端内部通过 `tools.environments.get_environment(...).execute(...)` 运行，并按进程保存在 `_BACKEND_PROBE_CACHE` 中，如果探测超时则有静态回退机制。
- **提示词编写的关键事实**：当 `TERMINAL_ENV != "local"` 时，*所有*文件工具（`read_file`, `write_file`, `patch`, `search_files`）都在后端容器内运行，而不是在宿主机上。在这种情况下，系统提示词绝不能描述宿主——智能体无法触及它。

完整的设计说明、精确的输出字符串和测试陷阱：
`references/prompt-builder-environment-hints.md`。

**重构安全模式（POSIX 等价性保护）：** 当您将内联逻辑提取到一个添加 Windows/平台特定行为的辅助函数中时，请在测试文件中保留一个 `_legacy_<name>` 预言机函数，该函数是旧代码的逐字复制品，然后进行参数化差异对比。示例：`tests/tools/test_code_execution_windows_env.py::TestPosixEquivalence`。这锁定了 POSIX 行为是位对位的完全相同的这一不变性，并确保任何未来的漂移都会以清晰的差异发出响亮的失败警告。

### 提交约定

```
type: 简洁的主题行

可选的正文。
```

类型：`fix:`、`feat:`、`refactor:`、`docs:`、`chore:`

### 关键规则

- **绝不能破坏提示词缓存** — 在对话过程中不要更改上下文、工具或系统提示词
- **消息角色的交替** — 绝对不能连续出现两个助手的消息或两个用户的消息
- 使用 `hermes_constants` 中的 `get_hermes_home()` 来获取所有路径（保证安全）
- 配置值放入 `config.yaml`，秘密信息放入 `.env`
- 新工具需要一个 `check_fn`，这样它们才能在满足要求时才显示出来