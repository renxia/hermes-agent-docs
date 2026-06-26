---
sidebar_position: 2
title: "Slash Commands Reference"
description: "Complete reference for interactive CLI and messaging slash commands"
---

# 斜杠命令参考

Hermes 有两个斜杠命令界面，都由 `hermes_cli/commands.py` 中的中央 `COMMAND_REGISTRY` 驱动：

- **交互式 CLI 斜杠命令** — 由 `cli.py` 分派，并带有来自注册表的自动补全功能
- **消息传递斜杠命令** — 由 `gateway/run.py` 分派，带有从注册表生成的帮助文本和平台菜单

已安装的技能也作为动态斜杠命令在两个界面上暴露。这包括像 `/plan` 这样的捆绑技能，它会打开计划模式，并将 markdown 计划保存在相对于活动工作区/后端工作目录的 `.hermes/plans/` 下。

## 权限和管理员/用户划分

所有支持用户级白名单的消息平台（Telegram、Discord、Slack、Matrix、Mattermost、Signal 等）也支持两级斜杠命令划分：**管理员** 可以使用所有已注册的命令，而**普通用户** 只能使用您在 `user_allowed_commands` 中列出的名称（以及始终允许的 `/help` 和 `/whoami`）。请在平台对应的 `extra:` 块中配置 `allow_admin_from` 和 `user_allowed_commands`（以及组级别的等效项 `group_allow_admin_from` / `group_user_allowed_commands`），该文件位于 `~/.hermes/gateway-config.yaml`。

请参阅各平台的文档以获取示例——跨平台结构是相同的：

- [Telegram](../user-guide/messaging/telegram.md#slash-command-access-control)
- [Discord](../user-guide/messaging/discord.md)
- [Slack](../user-guide/messaging/slack.md)
- [Matrix](../user-guide/messaging/matrix.md)
- [Mattermost](../user-guide/messaging/mattermost.md)
- [Signal](../user-guide/messaging/signal.md)

如果某个范围的 `allow_admin_from` 未设置，则该范围将保持在不受限制的向后兼容模式——所有被允许的用户都可以运行所有命令。

## 交互式 CLI 斜杠命令 (Slash Commands)

在 CLI 中输入 `/` 以打开自动补全菜单。内置命令不区分大小写。

### 会话 (Session)

| 命令 | 描述 |
|---------|-------------|
| `/new [name]` (别名: `/reset`) | 启动新会话（新的会话 ID + 历史记录）。可选的 `[name]` 用于设置初始会话标题 — 例如，`/new my-experiment` 会打开一个已命名为 `my-experiment` 的全新会话，这样稍后使用 `/resume` 或 `/sessions` 就能轻松找到它。可附加 `now`、`--yes` 或 `-y` 以跳过确认模态框 — 例如，`/reset now`、`/new --yes my-experiment`。 |
| `/clear` | 清屏并启动新会话 |
| `/history` | 显示对话历史记录 |
| `/save` | 保存当前的对话内容 |
| `/retry` | 重试上一条消息（重新发送给智能体） |
| `/undo` | 移除最近的用户/助手交互 |
| `/title` | 为当前会话设置标题（用法: `/title 我的会话名称`） |
| `/compress [here [N] \| focus topic]` | 手动压缩对话上下文（刷新记忆 + 总结）。`/compress here [N]` 会总结除最近 N 条交互之外的所有内容（默认 2），并保持原样 — 选择你自己的压缩边界。一个焦点主题 (focus topic) 可以缩小完整摘要需要保留的内容范围。 |
| `/rollback` | 列出或恢复文件系统检查点（用法: `/rollback [编号]`） |
| `/snapshot [create\|restore <id>\|prune]` (别名: `/snap`) | 创建或恢复 Hermes 配置/状态的快照。`create [label]` 保存快照，`restore <id>` 恢复到该快照，`prune [N]` 删除旧快照，或者不带参数列出所有快照。 |
| `/stop` | 终止所有正在运行的后台进程 |
| `/queue <prompt>` (别名: `/q`) | 将提示符排队到下一个回合（不会中断当前的智能体响应）。 |
| `/steer <prompt>` | 注入一条在**下一次工具调用之后**到达智能体的中途备注 — 不会中断，也不会产生新的用户回合。该文本会在当前工具完成后附加到最后一个工具结果的内容中，从而为智能体提供新的上下文，而不会破坏当前的工具调用循环。可用于在中途引导方向（例如，当智能体正在运行测试时，“关注认证模块”）。 |
| `/goal <text>` | 设置 Hermes 跨回合努力的目标 — 这是我们对 Ralph 循环的理解。在每个回合后，一个辅助判别模型会决定目标是否已完成；如果未完成，Hermes 将自动继续。子命令：`/goal status`、`/goal pause`、`/goal resume`、`/goal clear`。预算默认为 20 回合（`goals.max_turns`）；任何真实的用户消息都会抢占继续循环，状态将保留到 `/resume`。请参阅 [持久目标](/user-guide/features/goals) 以获取完整的操作指南。 |
| `/subgoal <text>` | 在活动目标中附加一个用户提供的准则（mid-loop）。继续提示符会将所有子目标原样呈现给智能体，判别器会将其纳入其 DONE/CONTINUE 裁决 — 因此，只有在原始目标**和**每个子目标都得到满足后，该目标才会被标记为完成。子命令：`/subgoal`（列表）、`/subgoal remove <N>`、`/subgoal clear`。需要一个活动的 `/goal`。 |
| `/resume [name]` | 恢复先前命名的会话 |
| `/sessions` (TUI 别名: `/switch`) | 经典 CLI：在交互式选择器中浏览和恢复之前的会话。TUI：打开当前已打开的 TUI 会话的实时会话切换器。在 TUI 中使用 `/sessions new` 可以立即启动另一个实时会话。 |
| `/redraw` | 强制完整 UI 重绘（可从 tmux 缩放、鼠标选择伪影等终端漂移中恢复）。 |
| `/status` | 显示会话信息 — 模型、提供商、配置、会话 ID、工作目录、标题、创建/更新时间戳、令牌总量、智能体运行状态 — 然后显示本地的**会话回顾**块（最近的用户/助手回合计数、工具结果计数、最常使用的工具、最后触及的文件、最新的用户提示和最新的助手回复）。该回顾是本地从内存中的对话计算得出的；不涉及 LLM 调用，不影响提示缓存。 |
| `/agents` (别名: `/tasks`) | 显示当前会话中活动的智能体和正在运行的任务。 |
| `/background <prompt>` (别名: `/bg`, `/btw`) | 在单独的后台会话中运行一个提示符。智能体独立地处理你的提示 — 当前会话保持空闲，可用于其他工作。任务完成后，结果将以面板的形式显示。请参阅 [CLI 后台会话](/user-guide/cli#background-sessions)。 |
| `/branch [name]` (别名: `/fork`) | 分支当前会话（探索不同的路径） |
| `/handoff <platform>` | **仅限 CLI**。将当前会话转交给一个消息平台（Telegram、Discord、Slack、WhatsApp、Signal、Matrix）。网关会立即接收它，在支持主题的平台上创建新的线程（Telegram 主题、Discord 文本频道线程、Slack 消息锚定线程），将目的地重新绑定到你的 `session_id` 以便完整地重播角色感知转录，并伪造一个合成的用户回合，以便智能体确认它在新地方工作正常。成功后 CLI 会干净退出，并提供一个 `/resume` 提示；随时使用 `/resume <title>` 本地恢复。如果在途中拒绝。需要网关正在运行并且为目标平台配置了主频道（从目标聊天中的 `/sethome`）。请参阅 [跨平台交接](/user-guide/sessions#cross-platform-handoff)。 |

### 配置 (Configuration)

| 命令 | 描述 |
|---------|-------------|
| `/config` | 显示当前配置 |
| `/model [model-name]` | 显示或更改当前模型。支持：`/model claude-sonnet-4`、`/model provider:model`（切换提供商）、`/model custom:model`（自定义端点）、`/model custom:name:model`（命名自定义提供商）、`/model custom`（从端点自动检测），以及用户定义的别名（`/model fav`、`/model grok` — 参见 [自定义模型别名](#custom-model-aliases)）。使用 `--global` 将更改持久化到 `config.yaml`。**注意：** `/model` 只能在已配置的提供商之间进行切换。要添加新的提供商，请退出会话，并在终端中运行 `hermes model`。 |
| `/codex-runtime [auto\|codex_app_server\|on\|off]` | 为 OpenAI/Codex 模型切换可选的 [Codex 应用服务器运行时](../user-guide/features/codex-app-server-runtime)。`auto`（默认）使用 Hermes 的标准聊天补全；`codex_app_server` 将回合交给 `codex app-server` 子进程，用于原生 shell、apply_patch、ChatGPT 订阅认证和迁移的 Codex 插件。在下一个会话中生效。 |
| `/personality` | 设置预定义的个性 |
| `/verbose` | 循环工具进度显示：off → new → all → verbose。可以通过配置 [启用消息传递中的详细信息](#notes)。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic Fast Mode。选项：`normal`、`fast`、`status`。 |
| `/reasoning` | 管理推理工作量和显示（用法: `/reasoning [level\|show\|hide]`） |
| `/skin` | 显示或更改显示皮肤/主题 |
| `/statusbar` (别名: `/sb`) | 切换上下文/模型状态栏的显示与否 |
| `/voice [on\|off\|tts\|status]` | 切换 CLI 语音模式和语音播放。录音使用 `voice.record_key`（默认：`Ctrl+B`）。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令的批准提示。 |
| `/footer [on\|off\|status]` | 在最终回复中切换网关运行时元数据页脚的显示与否（显示模型、上下文 % 和 cwd）。 |
| `/busy [queue\|steer\|interrupt\|status]` | 仅限 CLI：控制当 Hermes 正在工作时按下 Enter 会发生什么 — 排队新消息、中途引导 (steer) 或立即中断。 |
| `/indicator [kaomoji\|emoji\|unicode\|ascii]` | 仅限 CLI：选择 TUI 忙碌指示器的样式。 |

### 工具和技能 (Tools & Skills)

| 命令 | 描述 |
|---------|-------------|
| `/tools [list\|disable\|enable] [name...]` | 管理工具：列出可用工具，或禁用/启用当前会话中的特定工具。禁用一个工具会将其从智能体的工具集中移除并触发会话重置。 |
| `/toolsets` | 列出可用的工具集 |
| `/browser [connect\|disconnect\|status]` | 管理本地 Chromium 家族 CDP 连接。`connect` 将浏览器工具附加到正在运行的 Chrome、Brave、Chromium 或 Edge 实例（默认：`http://127.0.0.1:9222`）。`disconnect` 断开连接。`status` 显示当前连接状态。如果未检测到调试器，将自动启动一个支持的 Chromium 家族浏览器。 |
| `/skills` | 从在线注册表搜索、安装、检查或管理技能。也是技能写入批准门槛的审查界面：`/skills pending`、`/skills diff <id>`、`/skills approve <id>`、`/skills reject <id>`、`/skills approval on\|off`。请参阅 [限制智能体技能写入](/user-guide/features/skills#gating-agent-skill-writes-skillswrite_approval)。 |
| `/memory [pending\|approve\|reject\|approval]` | 审查由写入批准门槛（`memory.write_approval`）暂存的待定记忆写入，并切换该门槛。请参阅 [控制内存写入](/user-guide/features/memory#controlling-memory-writes-write_approval)。 |
| `/bundles` | 列出配置的技能捆绑包 — `/<name>` 斜杠别名可以一次性预加载多个技能。在 `~/.hermes/config.yaml` 中配置 `bundles:`。请参阅 [技能捆绑包](/user-guide/features/skills#skill-bundles)。 |
| `/learn <what to learn from>` | 从你描述的任何内容（一个目录、一个 URL、你刚刚引导智能体完成的工作流程或粘贴的笔记）中提炼出一个可重用的技能。这是一个开放式任务：智能体会使用自己的工具收集源文件，并按照房主编写标准撰写一份 `SKILL.md`。可在 CLI、消息网关、TUI 和仪表板技能页面中使用。 |
| `/cron` | 管理定时任务（列表、添加/创建、编辑、暂停、恢复、运行、移除） |
| `/suggestions [accept\|dismiss N\|catalog\|clear]` (别名: `/suggest`) | 审查建议的自动化功能。使用 `/suggestions` 列出待定的建议，`/suggestions accept <id>` 创建拟议的自动化功能，`/suggestions dismiss <id>` 拒绝一个，`/suggestions catalog` 添加精选的入门级自动化功能，`/suggestions clear` 清除已解决的建议记录。接受的任务会保留当前的界面作为交付源。 |
| `/blueprint [name] [slot=value ...]` (别名: `/bp`) | 从蓝图模板设置自动化功能。裸的 `/blueprint` 列出目录；`/blueprint <name>` 在下一个智能体回合启动一个引导式的槽位填充流程；`/blueprint <name> slot=value ...` 直接创建任务。 |
| `/curator` | 后台技能维护 — `status`、`run`、`pin`、`archive`。请参阅 [Curator](/user-guide/features/curator)。 |
| `/kanban <action>` | 在不离开聊天的情况下，驱动多配置、多项目的协作看板。完整的 `hermes kanban` 界面包括：`/kanban list`、`/kanban show t_abc`、`/kanban create "title" --assignee X`、`/kanban comment t_abc "text"`、`/kanban unblock t_abc`、`/kanban dispatch` 等。支持多看板：`/kanban boards list`、`/kanban boards create <slug>`、`/kanban boards switch <slug>`、`/kanban --board <slug> <action>`。请参阅 [Kanban 斜杠命令](/user-guide/features/kanban#kanban-slash-command)。 |
| `/reload-mcp` (别名: `/reload_mcp`) | 从 config.yaml 重新加载 MCP 服务器 |
| `/reload-skills` (别名: `/reload_skills`) | 重新扫描 `~/.hermes/skills/` 以查找新安装或已移除的技能 |
| `/reload` | 将 `.env` 变量重新加载到运行中的会话（无需重启即可拾取新的 API 密钥） |
| `/plugins` | 列出已安装的插件及其状态 |

### 信息 (Info)

| 命令 | 描述 |
|---------|-------------|
| `/help` | 显示此帮助信息 |
| `/version` | 显示 Hermes 智能体版本、构建和环境信息。 |
| `/usage` | 显示令牌使用量、成本细分、会话时长，以及——如果来自活动提供商 — 一个包含剩余配额/信用/计划用量的**账户限制**部分（实时从提供商的 API 拉取）。 |
| `/credits` | 显示你的 Nous 信用余额和充值交接链接。 |
| `/billing` | 用于 Nous 的 CLI 终端计费流程 — 查看余额、购买信用和管理自动重载/每月限制。 |
| `/insights` | 显示使用洞察和分析（最近 30 天） |
| `/platforms` (别名: `/gateway`) | 显示网关/消息平台的状态（仅限 CLI 的摘要视图）。 |
| `/paste` | 粘贴剪贴板图像 |
| `/copy [number]` | 将最新的助手回复复制到剪贴板（或带编号的倒数第 N 个）。仅限 CLI。 |
| `/image <path>` | 为你的下一个提示附加一个本地图像文件。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可分享链接。在消息传递中也可用。 |
| `/profile` | 显示活动配置名称和主目录 |

### 退出 (Exit)

| 命令 | 描述 |
|---------|-------------|
| `/quit` | 退出 CLI（也为 `/exit`）。 |

### 动态 CLI 斜杠命令 (Dynamic CLI Slash Commands)

| 命令 | 描述 |
|---------|-------------|
| `/<skill-name>` | 将任何已安装的技能加载为按需命令。示例：`/gif-search`、`/github-pr-workflow`、`/excalidraw`。 |
| `/skills ...` | 从注册表和官方可选技能目录搜索、浏览、检查、安装、审计、发布和配置技能。 |

### 快速命令 (Quick Commands)

用户定义的快速命令将一个简短的斜杠命令映射到 shell 命令或另一个斜杠命令。在 `~/.hermes/config.yaml` 中进行配置：

```yaml
quick_commands:
  status:
    type: exec
    command: systemctl status hermes-agent
  deploy:
    type: exec
    command: scripts/deploy.sh
  inbox:
    type: alias
    target: /gmail unread
```

然后，在 CLI 或消息平台中输入 `/status`、`/deploy` 或 `/inbox`。快速命令在分派时解析，可能不会出现在每个内置的自动补全/帮助表中。

不支持字符串式的提示快捷方式作为快速命令。将更长的可重用提示放入技能中，或使用 `type: alias` 指向一个现有的斜杠命令。

### 自定义模型别名 (Custom Model Aliases)

为经常使用的模型定义自己的简短名称，然后在 CLI 或任何消息平台中使用 `/model <alias>` 来调用它们。在两者中都完全相同地工作，支持会话级（默认）和 `--global` 切换。

支持两种配置格式：

**完整形式 (Full form)** — 固定一个精确的模型、提供商和可选的基础 URL。将其放入 `~/.hermes/config.yaml`：

```yaml
model_aliases:
  fav:
    model: claude-sonnet-4.6
    provider: anthropic
  grok:
    model: grok-4
    provider: x-ai
  ollama-qwen:
    model: qwen3-coder:30b
    provider: custom
    base_url: http://localhost:11434/v1
```

**简短形式 (Short form)** — 一个字符串中的 `provider/model`。在不编辑 YAML 的情况下，从 shell 中设置：

```bash
hermes config set model.aliases.fav anthropic/claude-opus-4.6
hermes config set model.aliases.grok x-ai/grok-4
```

然后在聊天中输入：

```
/model fav            # 仅限会话级
/model grok --global  # 也将当前模型更改持久化到 config.yaml
```

用户别名具有优先权，因此命名一个别名为 `sonnet`、`kimi`、`opus` 等将会覆盖内置的名称。别名名称不区分大小写。

### 别名解析 (Alias Resolution)

命令支持前缀匹配：输入 `/h` 会解析到 `/help`，`/mod` 会解析到 `/model`。当一个前缀是模糊的（匹配多个命令）时，注册表中的第一个匹配项获胜。完整的命令名称和已注册的别名始终优先于前缀匹配。

## 消息命令

消息网关支持在 Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant 和 Teams 聊天中使用的以下内置命令：

| Command | Description |
|---------|-------------|
| `/start` | 平台协议命令。许多聊天平台（Telegram, Discord, …）会在用户首次打开机器人对话时自动发送 `/start`。Hermes 会静默地确认该请求——没有智能体回复，不会消耗会话次数——因此初次接触握手不会浪费一次回合。您也可以显式地发送此命令以确认网关的可达性。 |
| `/new` | 开启新的对话。 |
| `/reset` | 重置对话历史记录。 |
| `/status` | 显示会话信息，随后显示本地的**会话摘要**块（最近的回合计数、使用的顶级工具、被触及的文件、最新提示+回复）。 |
| `/stop` | 终止所有正在运行的后台进程并中断正在运行的智能体。 |
| `/model [provider:model]` | 显示或更改模型。支持提供者切换（`/model zai:glm-5`）、自定义端点（`/model custom:model`）、命名自定义提供者（`/model custom:local:qwen`）、自动检测（`/model custom`）和用户定义的别名（`/model fav`、`/model grok` — 参见[自定义模型别名](#custom-model-aliases)）。使用 `--global` 将更改持久化到 config.yaml。**注意：** `/model` 只能在已配置好的提供者之间进行切换。要添加新的提供者或设置 API 密钥，请从终端（聊天会话外部）使用 `hermes model` 命令。 |
| `/codex-runtime [auto\|codex_app_server\|on\|off]` | 切换可选的[Codex 应用服务器运行时](../user-guide/features/codex-app-server-runtime)。该设置将持久化到 config.yaml 中的 `model.openai_runtime`，并驱逐缓存的智能体，以便下一个消息能拾取新的运行时。在下一次会话中生效。 |
| `/personality [name]` | 为当前会话设置一个个性化叠加层。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic Fast Mode。 |
| `/retry` | 重试上一个消息。 |
| `/undo` | 移除上一次的交流记录。 |
| `/sethome` (alias: `/set-home`) | 将当前聊天标记为交付物的平台主频道。 |
| `/compress [here [N] \| focus topic]` | 手动压缩对话上下文。`/compress here [N]` 保留最近 N 个回合（默认 2）的原始内容，并总结其余部分。焦点主题可以缩小完整摘要需要保留的内容范围。 |
| `/topic [off\|help\|session-id]` | **仅限 Telegram DM**。管理用户管理的、多会话的主题模式。`/topic` 可启用此功能或显示状态；`/topic off` 会禁用它并清除绑定；`/topic help` 显示用法；`/topic <session-id>` 在主题内可恢复之前的会话。参见[多会话 DM 模式](/user-guide/messaging/telegram#multi-session-dm-mode-topic)。 |
| `/title [name]` | 设置或显示会话标题。 |
| `/resume [name]` | 恢复先前命名的会话。 |
| `/usage` | 显示令牌使用情况、估算的成本细分（输入/输出）、上下文窗口状态、会话时长，以及——如果活动提供者可用的话——一个包含剩余配额/从提供商 API 实时拉取的信用额度的**账户限制**部分。 |
| `/credits` | 显示您的 Nous 信用余额和一个打开浏览器中门户账单页面的充值链接。 |
| `/insights [days]` | 显示使用分析。 |
| `/reasoning [level\|show\|hide]` | 更改推理投入或切换推理显示。 |
| `/voice [on\|off\|tts\|join\|channel\|leave\|status]` | 控制聊天中的语音回复。`join`/`channel`/`leave` 用于管理 Discord 语音频道模式。 |
| `/rollback [number]` | 列出或恢复文件系统检查点。 |
| `/background <prompt>` | 在独立的后台会话中运行一个提示。任务完成后，结果将发送回同一个聊天。参见[消息后台会话](/user-guide/messaging/#background-sessions)。 |
| `/queue <prompt>` (alias: `/q`) | 将一个提示排队到下一个回合，而不会中断当前的回合。 |
| `/steer <prompt>` | 在下一次工具调用后注入一条消息，而不造成中断——模型会在其下一次迭代中拾取它，而不是作为新的回合。 |
| `/goal <text>` | 设置一个 Hermes 跨回合努力达成的长期目标——这是我们对 Ralph loop 的理解。一个判别模型在每个回合后进行检查；如果未完成，Hermes 会自动继续，直到它完成了、您暂停/清除它，或者达到回合预算（默认 20）。子命令：`/goal status`、`/goal pause`、`/goal resume`、`/goal clear`。在中途对智能体运行状态/暂停/清除是安全的；设置新目标需要先使用 `/stop`。参见[持久性目标](/user-guide/features/goals)。 |
| `/footer [on\|off\|status]` | 在最终回复上切换运行时元数据页脚（显示模型、上下文百分比和 cwd）。 |
| `/curator [status\|run\|pin\|archive]` | 后台技能维护控制。 |
| `/suggestions [accept\|dismiss N\|catalog\|clear]` | 直接在聊天中查看建议的自动化功能。`/suggestions` 列出待定的建议，`catalog` 添加精选的入门级自动化，而 `clear` 则清除已解决的建议记录。接受的建议会将此聊天/线程设为任务交付原点。 |
| `/blueprint [name] [slot=value ...]` | 浏览定时蓝图、开始引导式的槽位填充对话或直接创建蓝图作业。直接创建的作业将发送回当前的聊天/线程。 |
| `/memory [pending\|approve\|reject\|approval]` | 查看由写入批准门控（`memory.write_approval`）暂存的待定内存写入——直接在聊天中批准或拒绝它们——并使用 `/memory approval on\|off` 切换该门控。参见[控制内存写入](/user-guide/features/memory#controlling-memory-writes-write_approval)。 |
| `/skills [pending\|approve\|reject\|diff\|approval]` | 查看由写入批准门控（`skills.write_approval`）暂存的待定**技能**写入。显示每个暂存写入的一行摘要；`/skills diff <id>` 对聊天进行了截断——请在 CLI 或 `~/.hermes/pending/skills/<id>.json` 中阅读完整的差异。仅当门控开启（或有暂存写入）时才会出现；搜索/安装功能仍仅限 CLI。 |
| `/kanban <action>` | 从聊天驱动多配置文件、多项目协作看板——其参数表面与 CLI 相同。它绕过了正在运行的智能体保护，因此 `/kanban unblock t_abc`、`/kanban comment t_abc "…"`、`/kanban list --mine`、`/kanban boards switch <slug>` 等命令可以在回合中执行。`/kanban create …` 会自动将发起聊天订阅到新任务的终端事件。参见[Kanban 斜杠命令](/user-guide/features/kanban#kanban-slash-command)。 |
| `/platform <list\|pause\|resume> [name]` | 直接从聊天操作正在运行的网关平台。`/platform list` 显示每个适配器及其状态（正在运行、被中断者暂停、手动暂停）；`/platform pause <name>` 停止向该适配器分派新消息，但不会卸载它；`/platform resume <name>` 重新启用它，并在上游健康后清除跳闸的断路器。 |
| `/reload-mcp` (alias: `/reload_mcp`) | 从配置文件重新加载 MCP 服务器。 |
| `/yolo` | 切换 YOLO 模式——跳过所有危险命令批准提示。 |
| `/commands [page]` | 浏览所有命令和技能（分页）。 |
| `/approve [session\|always]` | 批准并执行一个待定的危险命令。`session` 仅对本次会话有效；`always` 会添加到永久允许列表中。 |
| `/deny` | 拒绝一个待定的危险命令。 |
| `/update` | 将 Hermes 智能体更新到最新版本。 |
| `/restart` | 在耗尽活动运行后优雅地重启网关。当网关重新上线时，它会向请求者的聊天/线程发送确认信息。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可分享的链接。 |
| `/help` | 显示消息帮助。 |
| `/<skill-name>` | 通过名称调用任何已安装的技能。 |

## 备注

*   `/skin`、`/snapshot`、`/reload`、`/tools`、`/toolsets`、`/browser`、`/config`、`/cron`、`/platforms`、`/paste`、`/image`、`/statusbar`、`/plugins`、`/busy`、`/indicator`、`/redraw`、`/clear`、`/history`、`/save`、`/copy`、`/handoff`、`/billing` 和 `/quit` 是**仅限 CLI** 的命令。
*   `/skills` **仅限 CLI 用于搜索/浏览/安装**；其写入批准审查子命令（`pending`、`approve`、`reject`、`diff`、`approval`）在 `skills.write_approval` 开启时，也支持消息平台。`/memory` 在**两种**界面上都有效。
*   `/verbose` **默认仅限 CLI**，但可以通过在 `config.yaml` 中设置 `display.tool_progress_command: true` 来启用其在消息平台上的功能。启用后，它会循环使用 `display.tool_progress` 模式并保存到配置中。
*   `/sethome`、`/update`、`/restart`、`/approve`、`/deny`、`/topic`、`/platform` 和 `/commands` 是**仅限消息**的命令。
*   `/status`、`/version`、`/background`、`/queue`、`/steer`、`/voice`、`/reload-mcp`、`/reload-skills`、`/rollback`、`/debug`、`/fast`、`/footer`、`/curator`、`/kanban`、`/credits`、`/suggestions`、`/blueprint`、`/learn`、`/sessions` 和 `/yolo` 在**CLI 和消息网关上都有效**。
*   `/voice join`、`/voice channel` 和 `/voice leave` 仅在 Discord 上有意义。
*   在 TUI 中，`/sessions` 显示当前 TUI 进程中的实时会话。对于已保存或已关闭的记录，请使用 `/resume [name]` 或 `hermes --tui --resume <id-or-title>`。

## 破坏性命令的确认提示

以下是运行那些会丢弃未保存会话状态的斜杠命令之前 CLI 会弹出的提示：

| Command | 它销毁的内容 |
|---------|------------------|
| `/clear` | 清除屏幕并开始一个新的会话——当前会话 ID 和内存中的历史记录都会丢失。 |
| `/new` / `/reset` | 启动一个新的会话（新的会话 ID + 空白的历史）。 |
| `/undo` | 从历史记录中移除上一次的用户/助手交流。 |
| `/exit --delete` / `/quit --delete` | **并**永久删除当前会话的 SQLite 历史和磁盘上的转录文件。 |

对于这些命令，CLI 会弹出一个三选一的模态框：**立即批准**（本次继续）、**始终批准**（继续操作并持久化 `approvals.destructive_slash_confirm: false`，以便未来的破坏性命令无需提示即可运行）或 **取消**。

**内联跳过：** 要绕过单次调用的模态框，请附加 `now`、`--yes` 或 `-y` —— 例如 `/reset now`、`/new --yes my-session`、`/clear -y`、`/undo -y`。当模态框在终端上无法正确渲染时（参见 [issue #30768](https://github.com/NousResearch/hermes-agent/issues/30768) 针对原生 Windows PowerShell）或在使用 CLI 进行脚本操作时，这非常有用。

请在 `~/.hermes/config.yaml` 中设置 `approvals.destructive_slash_confirm: false` 以全局禁用这些提示；将其改回 `true` 以重新启用。参见[安全 — 破坏性斜杠命令确认](../user-guide/security.md#dangerous-command-approval) 获取上下文信息。