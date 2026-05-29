---
sidebar_position: 2
title: "斜杠命令参考"
description: "交互式CLI与消息斜杠命令的完整参考"
---

# 斜杠命令参考

Hermes 拥有两个斜杠命令界面，均由 `hermes_cli/commands.py` 中的中央 `COMMAND_REGISTRY` 驱动：

- **交互式CLI斜杠命令** — 由 `cli.py` 分派，基于注册表提供自动补全
- **消息斜杠命令** — 由 `gateway/run.py` 分派，基于注册表生成帮助文本和平台菜单

已安装的技能也会作为动态斜杠命令在这两个界面上暴露。这包括像 `/plan` 这样的内置技能，它会打开计划模式，并在相对于活动工作空间/后端工作目录的 `.hermes/plans/` 下保存markdown格式的计划。

## 权限与管理员/用户区分

每一个支持用户允许列表的通讯平台（Telegram、Discord、Slack、Matrix、Mattermost、Signal等）也都支持两级斜杠命令区分：**管理员** 可以访问所有已注册的命令，**普通用户** 只能访问您在 `user_allowed_commands` 中列出的名称（加上始终允许的基础命令 `/help` 和 `/whoami`）。请在平台位于 `~/.hermes/gateway-config.yaml` 中的 `extra:` 配置块内配置 `allow_admin_from` 和 `user_allowed_commands`（以及每个群组的等效配置 `group_allow_admin_from` / `group_user_allowed_commands`）。

有关示例，请参阅各平台的文档——其结构在所有平台中是相同的：

- [Telegram](../user-guide/messaging/telegram.md#slash-command-access-control)
- [Discord](../user-guide/messaging/discord.md)
- [Slack](../user-guide/messaging/slack.md)
- [Matrix](../user-guide/messaging/matrix.md)
- [Mattermost](../user-guide/messaging/mattermost.md)
- [Signal](../user-guide/messaging/signal.md)

如果某个作用域的 `allow_admin_from` 未设置，则该作用域将保持不受限制的向后兼容模式——所有允许的用户都可以运行每个命令。

## 交互式 CLI 斜杠命令

在 CLI 中输入 `/` 即可打开自动补全菜单。内置命令不区分大小写。

### 会话

| 命令 | 描述 |
|------|------|
| `/new [名称]` (别名: `/reset`) | 开始新会话（新的会话 ID 和历史记录）。可选的 `[名称]` 设置初始会话标题 — 例如 `/new my-experiment` 会打开一个已命名为 `my-experiment` 的新会话，方便稍后使用 `/resume` 或 `/sessions` 查找。附加 `now`、`--yes` 或 `-y` 可跳过确认对话框 — 例如 `/reset now`、`/new --yes my-experiment`。 |
| `/clear` | 清屏并开始新会话 |
| `/history` | 显示对话历史 |
| `/save` | 保存当前对话 |
| `/retry` | 重试最后一条消息（重新发送给智能体） |
| `/undo` | 移除最后一对用户/助手交互 |
| `/title` | 为当前会话设置标题（用法: /title 我的会话名称） |
| `/compress [关注主题]` | 手动压缩对话上下文（刷新记忆并总结）。可选的 `关注主题` 用于限定摘要保留的内容范围。 |
| `/rollback` | 列出或恢复文件系统检查点（用法: /rollback [数字]） |
| `/snapshot [创建\|恢复 <id>\|清理]` (别名: `/snap`) | 创建或恢复 Hermes 配置/状态的快照。`create [标签]` 保存快照，`restore <id>` 恢复到该快照，`prune [N]` 移除旧快照，不带参数则列出所有快照。 |
| `/stop` | 终止所有正在运行的后台进程 |
| `/queue <提示词>` (别名: `/q`) | 为下一轮对话排队一个提示词（不会中断当前的智能体响应）。 |
| `/steer <提示词>` | 在运行中途注入一个注释，该注释会在**下一次工具调用后**送达智能体 — 无中断，无新用户轮次。当前工具完成后，文本会追加到最后一个工具结果的内容中，为智能体提供新上下文而不会中断当前的工具调用循环。用此命令在任务中途调整方向（例如，在智能体运行测试时提示“专注于认证模块”）。 |
| `/goal <文本>` | 设置一个 Hermes 跨轮次持续努力的持久目标 — 这是我们对 Ralph 循环的实现。每轮结束后，一个辅助判断模型会决定目标是否完成；如果未完成，Hermes 会自动继续。子命令: `/goal status`、`/goal pause`、`/goal resume`、`/goal clear`。预算默认为 20 轮（`goals.max_turns`）；任何真实的用户消息都会抢占继续循环，状态在 `/resume` 后依然保留。完整指南请参见[持久目标](/user-guide/features/goals)。 |
| `/subgoal <文本>` | 在循环中途向活动目标追加一个用户提供的标准。继续提示会将所有子目标逐字呈现给智能体，判断模型会将其纳入“完成/继续”的裁决 — 因此，在原始目标**以及**每个子目标都满足之前，目标不会被标记为完成。子命令: `/subgoal` (列出)、`/subgoal remove <N>`、`/subgoal clear`。需要有一个活动的 `/goal`。 |
| `/resume [名称]` | 恢复一个之前命名的会话 |
| `/sessions` (TUI 别名: `/switch`) | 经典 CLI: 在交互式选择器中浏览和恢复之前的会话。TUI: 为当前打开的 TUI 会话打开实时会话切换器。在 TUI 中使用 `/sessions new` 可立即启动另一个实时会话。 |
| `/redraw` | 强制完全重绘 UI（可修复 tmux 调整大小、鼠标选择痕迹等导致的终端偏移）。 |
| `/status` | 显示会话信息 — 模型、提供商、配置文件、会话 ID、工作目录、标题、创建/更新时间戳、令牌总数、智能体运行状态 — 接着是本地**会话摘要**区块（近期用户/助手轮次计数、工具结果计数、最常用工具、最近访问的几个文件、最新的用户提示词和最新的助手回复）。该摘要根据内存中的对话本地计算；无 LLM 调用，无提示缓存影响。 |
| `/agents` (别名: `/tasks`) | 显示当前会话中活跃的智能体和正在运行的任务。 |
| `/background <提示词>` (别名: `/bg`, `/btw`) | 在独立的后台会话中运行一个提示词。智能体会独立处理你的提示词 — 你当前的会话可以自由进行其他工作。任务完成后，结果会以面板形式出现。参见 [CLI 后台会话](/user-guide/cli#background-sessions)。 |
| `/branch [名称]` (别名: `/fork`) | 分支当前会话（探索不同的路径） |
| `/handoff <平台>` | **仅 CLI。** 将当前会话移交给一个消息平台（Telegram、Discord、Slack、WhatsApp、Signal、Matrix）。网关会立即接管，在支持线程的平台（Telegram 主题、Discord 文本频道线程、Slack 消息锚定线程）上创建新线程，将目标重新绑定到你的 CLI session_id 以回放完整的、带角色标识的对话记录，并伪造一个合成用户轮次以便智能体确认已在新位置工作。成功后你的 CLI 会干净退出并给出 `/resume` 提示；随时可通过 `/resume <标题>` 在本地恢复。在轮次中途被拒绝。需要网关正在运行且目标平台已配置主频道（在目标聊天中执行 `/sethome`）。参见[跨平台移交](/user-guide/sessions#cross-platform-handoff)。 |

### 配置

| 命令 | 描述 |
|------|------|
| `/config` | 显示当前配置 |
| `/model [模型名称]` | 显示或更改当前模型。支持: `/model claude-sonnet-4`、`/model provider:model`（切换提供商）、`/model custom:model`（自定义端点）、`/model custom:name:model`（命名自定义提供商）、`/model custom`（从端点自动检测）以及用户定义的别名（`/model fav`、`/model grok` — 参见[自定义模型别名](#自定义模型别名)）。使用 `--global` 可将更改持久化到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新的提供商，请退出会话并在终端运行 `hermes model`。 |
| `/codex-runtime [auto\|codex_app_server\|on\|off]` | 切换 OpenAI/Codex 模型的可选 [Codex 应用服务器运行时](../user-guide/features/codex-app-server-runtime)。`auto` (默认) 使用 Hermes 的标准聊天补全；`codex_app_server` 将轮次交给 `codex app-server` 子进程以获得原生 shell、apply_patch、ChatGPT 订阅认证和迁移的 Codex 插件。在下一个会话生效。 |
| `/personality` | 设置预定义的人格 |
| `/verbose` | 循环切换工具进度显示：关闭 → 新增 → 全部 → 详细。可通过配置[为消息启用](#notes)。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。选项: `normal`、`fast`、`status`。 |
| `/reasoning` | 管理推理强度和显示（用法: /reasoning [level\|show\|hide]） |
| `/skin` | 显示或更改显示皮肤/主题 |
| `/statusbar` (别名: `/sb`) | 切换上下文/模型状态栏的开或关 |
| `/voice [on\|off\|tts\|status]` | 切换 CLI 语音模式和语音播放。录音使用 `voice.record_key`（默认: `Ctrl+B`）。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令的确认提示。 |
| `/footer [on\|off\|status]` | 切换最终回复上的网关运行时元数据页脚（显示模型、工具计数、耗时）。 |
| `/busy [queue\|steer\|interrupt\|status]` | 仅 CLI: 控制在 Hermes 工作时按下回车键的操作 — 排队新消息、中途引导或立即中断。 |
| `/indicator [kaomoji\|emoji\|unicode\|ascii]` | 仅 CLI: 选择 TUI 忙碌指示器样式。 |

### 工具与技能

| 命令 | 描述 |
|------|------|
| `/tools [list\|disable\|enable] [名称...]` | 管理工具: 列出可用工具，或为当前会话禁用/启用特定工具。禁用工具会将其从智能体的工具集中移除并触发会话重置。 |
| `/toolsets` | 列出可用的工具集 |
| `/browser [connect\|disconnect\|status]` | 管理本地 Chromium 系列 CDP 连接。`connect` 将浏览器工具连接到正在运行的 Chrome、Brave、Chromium 或 Edge 实例（默认: `http://127.0.0.1:9222`）。`disconnect` 断开连接。`status` 显示当前连接。如果未检测到调试器，会自动启动一个受支持的 Chromium 系列浏览器。 |
| `/skills` | 从在线注册表搜索、安装、检查或管理技能 |
| `/bundles` | 列出已配置的技能捆绑包 — `/<名称>` 斜杠别名，可一次性预加载多个技能。在 `~/.hermes/config.yaml` 的 `bundles:` 下配置。参见[技能捆绑包](/user-guide/features/skills#skill-bundles)。 |
| `/cron` | 管理计划任务（列出、添加/创建、编辑、暂停、恢复、运行、移除） |
| `/curator` | 后台技能维护 — `status`、`run`、`pin`、`archive`。参见[策展人](/user-guide/features/curator)。 |
| `/kanban <操作>` | 无需离开聊天即可驱动多配置文件、多项目协作看板。完整的 `hermes kanban` 界面可用: `/kanban list`、`/kanban show t_abc`、`/kanban create "标题" --assignee X`、`/kanban comment t_abc "文本"`、`/kanban unblock t_abc`、`/kanban dispatch` 等。包含多看板支持: `/kanban boards list`、`/kanban boards create <slug>`、`/kanban boards switch <slug>`、`/kanban --board <slug> <操作>`。参见[看板斜杠命令](/user-guide/features/kanban#kanban-slash-command)。 |
| `/reload-mcp` (别名: `/reload_mcp`) | 从 config.yaml 重新加载 MCP 服务器 |
| `/reload-skills` (别名: `/reload_skills`) | 重新扫描 `~/.hermes/skills/` 以发现新安装或已移除的技能 |
| `/reload` | 将 `.env` 变量重新加载到正在运行的会话中（可获取新的 API 密钥而无需重启） |
| `/plugins` | 列出已安装的插件及其状态 |

### 信息

| 命令 | 描述 |
|------|------|
| `/help` | 显示此帮助消息 |
| `/usage` | 显示令牌使用量、成本明细、会话时长，以及 — 当从活动提供商获取时 — 一个**账户限额**部分，包含从提供商 API 实时拉取的剩余配额/信用额度/计划使用量。 |
| `/insights` | 显示使用洞察和分析（过去 30 天） |
| `/platforms` (别名: `/gateway`) | 显示网关/消息平台状态（仅 CLI 摘要视图）。 |
| `/platform <list\|pause\|resume> [名称]` | 操作正在运行的网关平台。`/platform list` 列出每个适配器及其状态（运行中、被断路器暂停、手动暂停）；`/platform pause <名称>` 停止向该适配器分派新消息而不卸载它；`/platform resume <名称>` 重新启用它。当适配器因重复的可重试故障（网络/速率限制/5xx）触发断路器时，网关也会自动暂停它 — 上游恢复正常后使用 `/platform resume <名称>` 清除断路器。在网关可达的任何地方可用（CLI 会话、Telegram、Discord 等）。 |
| `/paste` | 附加剪贴板图像 |
| `/copy [数字]` | 将最后一条助手回复复制到剪贴板（或带数字指定倒数第 N 条）。仅 CLI。 |
| `/image <路径>` | 为你的下一个提示附加一个本地图像文件。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可分享链接。在消息平台也可用。 |
| `/profile` | 显示活动配置文件名称和主目录 |
| `/gquota` | 显示 Google Gemini Code Assist 配额使用情况（带进度条）（仅当 `google-gemini-cli` 提供商活动时可用）。 |

### 退出

| 命令 | 描述 |
|------|------|
| `/quit` | 退出 CLI（也: `/exit`）。关于 `/queue` 下 `/q` 的说明见上文。传递 `--delete`（或 `-d`）— 例如 `/exit --delete` — 还会在退出前永久删除当前会话的 SQLite 历史记录和磁盘上的对话记录。适用于隐私敏感或一次性任务。 |

### 动态 CLI 斜杠命令

| 命令 | 描述 |
|------|------|
| `/<技能名称>` | 将任何已安装的技能作为按需命令加载。示例: `/gif-search`、`/github-pr-workflow`、`/excalidraw`。 |
| `/skills ...` | 从注册表和官方可选技能目录搜索、浏览、检查、安装、审核、发布和配置技能。 |

### 快速命令

用户定义的快速命令将一个简短的斜杠命令映射到一个 shell 命令或另一个斜杠命令。在 `~/.hermes/config.yaml` 中配置它们：

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

然后在 CLI 或消息平台中输入 `/status`、`/deploy` 或 `/inbox`。快速命令在分派时解析，可能不会出现在每个内置的自动补全/帮助表中。

不支持仅字符串的提示快捷方式作为快速命令。将较长的可重用提示放入技能中，或使用 `type: alias` 指向现有的斜杠命令。

### 自定义模型别名

为你经常使用的模型定义自己的短名称，然后在 CLI 或任何消息平台中使用 `/model <别名>` 访问它们。别名在两者中工作方式相同，支持仅会话（默认）和 `--global` 切换。

支持两种配置格式：

**完整形式** — 钉选一个确切的模型、提供商，以及可选的基础 URL。将其放入 `~/.hermes/config.yaml`：

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

**简短形式** — 一个字符串中的 `provider/model`。从 shell 设置而无需编辑 YAML：

```bash
hermes config set model.aliases.fav anthropic/claude-opus-4.6
hermes config set model.aliases.grok x-ai/grok-4
```

然后在聊天中：

```
/model fav            # 仅会话
/model grok --global  # 同时将当前模型更改持久化到 config.yaml
```

用户别名优先于内置短名称，因此将别名命名为 `sonnet`、`kimi`、`opus` 等将覆盖内置名称。别名不区分大小写。

### 别名解析

命令支持前缀匹配：输入 `/h` 会解析为 `/help`，`/mod` 会解析为 `/model`。当前缀有歧义（匹配多个命令）时，注册表顺序中的第一个匹配项胜出。完整的命令名称和已注册的别名始终优先于前缀匹配。

## 消息斜杠命令

消息网关支持在 Telegram、Discord、Slack、WhatsApp、Signal、邮件、Home Assistant 和 Teams 聊天中使用以下内置命令：

| 命令 | 描述 |
|------|------|
| `/start` | 平台协议命令。许多聊天平台（Telegram、Discord 等）在用户首次打开机器人对话时会自动发送 `/start`。Hermes 会静默确认收到信号——不会回复智能体，也不会消耗会话资源——这样首次接触的握手流程就不会浪费回合数。您也可以显式发送此命令以确认网关可达。 |
| `/new` | 开始新对话。 |
| `/reset` | 重置对话历史。 |
| `/status` | 显示会话信息，后跟一个本地**会话摘要**块（近期回合计数、常用工具、涉及文件、最新提示词及回复）。 |
| `/stop` | 终止所有运行中的后台进程并中断正在运行的智能体。 |
| `/model [提供商:模型]` | 显示或更改模型。支持提供商切换（`/model zai:glm-5`）、自定义端点（`/model custom:model`）、命名自定义提供商（`/model custom:local:qwen`）、自动检测（`/model custom`）和用户定义别名（`/model fav`、`/model grok` — 参见[自定义模型别名](#custom-model-aliases)）。使用 `--global` 可将更改持久化到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新提供商或设置 API 密钥，请在终端（聊天会话外）使用 `hermes model`。 |
| `/codex-runtime [auto\|codex_app_server\|on\|off]` | 切换可选的 [Codex 应用服务器运行时](../user-guide/features/codex-app-server-runtime)。持久化到 config.yaml 的 `model.openai_runtime` 并清除缓存的智能体，以便下一条消息使用新的运行时。下次会话生效。 |
| `/personality [名称]` | 为会话设置个性叠加层。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。 |
| `/retry` | 重试上一条消息。 |
| `/undo` | 移除上一次交互。 |
| `/sethome`（别名：`/set-home`） | 将当前聊天标记为平台主频道以接收投递内容。 |
| `/compress [焦点主题]` | 手动压缩对话上下文。可选的焦点主题用于限制摘要保留的内容。 |
| `/topic [off\|help\|session-id]` | **仅限 Telegram 私信。** 管理用户管理的多会话话题模式。`/topic` 启用该模式或显示状态；`/topic off` 禁用并清除绑定；`/topic help` 显示用法；在话题内使用 `/topic <session-id>` 可恢复之前的会话。参见[多会话私信模式](/user-guide/messaging/telegram#multi-session-dm-mode-topic)。 |
| `/title [名称]` | 设置或显示会话标题。 |
| `/resume [名称]` | 恢复之前命名的会话。 |
| `/usage` | 显示令牌使用量、预估费用明细（输入/输出）、上下文窗口状态、会话持续时间，以及当活跃提供商可用时，一个**账户限额**部分，显示从提供商 API 实时获取的剩余配额/信用额度。 |
| `/insights [天数]` | 显示使用分析。 |
| `/reasoning [级别\|show\|hide]` | 更改推理强度或切换推理显示。 |
| `/voice [on\|off\|tts\|join\|channel\|leave\|status]` | 控制聊天中的语音回复。`join`/`channel`/`leave` 用于管理 Discord 语音频道模式。 |
| `/rollback [编号]` | 列出或恢复文件系统检查点。 |
| `/background <提示词>` | 在单独的后台会话中运行提示词。任务完成后，结果会返回到同一聊天中。参见[消息后台会话](/user-guide/messaging/#background-sessions)。 |
| `/queue <提示词>`（别名：`/q`） | 将提示词排入下一回合队列，而不中断当前回合。 |
| `/steer <提示词>` | 在下一次工具调用后注入一条消息而不中断——模型会在下一次迭代中获取它，而不是作为一个新回合。 |
| `/goal <文本>` | 设置一个 Hermes 跨回合努力实现的持续目标——这是我们对 Ralph 循环的实现。一个评判模型会在每个回合后检查；如果未完成，Hermes 会自动继续，直到完成、您暂停/清除它，或达到回合预算（默认 20）。子命令：`/goal status`、`/goal pause`、`/goal resume`、`/goal clear`。在智能体运行期间安全执行状态/暂停/清除操作；设置新目标需要先执行 `/stop`。参见[持续目标](/user-guide/features/goals)。 |
| `/footer [on\|off\|status]` | 切换最终回复上的运行时元数据页脚（显示模型、工具计数、耗时）。 |
| `/curator [status\|run\|pin\|archive]` | 后台技能维护控制。 |
| `/kanban <动作>` | 从聊天驱动多配置文件、多项目协作看板——参数接口与 CLI 完全相同。绕过正在运行的智能体保护，因此 `/kanban unblock t_abc`、`/kanban comment t_abc "…"`、`/kanban list --mine`、`/kanban boards switch <slug>` 等命令可在回合中执行。`/kanban create …` 会自动将源聊天订阅到新任务的终端事件。参见[看板斜杠命令](/user-guide/features/kanban#kanban-slash-command)。 |
| `/reload-mcp`（别名：`/reload_mcp`） | 从配置重新加载 MCP 服务器。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令批准提示。 |
| `/commands [页码]` | 浏览所有命令和技能（分页）。 |
| `/approve [session\|always]` | 批准并执行待处理的危险命令。`session` 仅为此会话批准；`always` 将其添加到永久允许列表。 |
| `/deny` | 拒绝待处理的危险命令。 |
| `/update` | 将 Hermes 智能体更新到最新版本。 |
| `/restart` | 在清空活动运行后优雅地重启网关。当网关重新上线时，它会向请求者的聊天/线程发送确认消息。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可分享的链接。 |
| `/help` | 显示消息帮助。 |
| `/<技能名称>` | 按名称调用任何已安装的技能。 |

## 注意事项

- `/skin`、`/snapshot`、`/gquota`、`/reload`、`/tools`、`/toolsets`、`/browser`、`/config`、`/cron`、`/skills`、`/platforms`、`/paste`、`/image`、`/statusbar`、`/plugins`、`/busy`、`/indicator`、`/redraw`、`/clear`、`/history`、`/save`、`/copy`、`/handoff` 和 `/quit` 是**仅限 CLI** 的命令。
- `/verbose` **默认仅限 CLI**，但可以通过在 `config.yaml` 中设置 `display.tool_progress_command: true` 来为消息平台启用。启用后，它会循环切换 `display.tool_progress` 模式并保存到配置。
- `/sethome`、`/update`、`/restart`、`/approve`、`/deny`、`/topic` 和 `/commands` 是**仅限消息**的命令。
- `/status`、`/background`、`/queue`、`/steer`、`/voice`、`/reload-mcp`、`/reload-skills`、`/rollback`、`/debug`、`/fast`、`/footer`、`/curator`、`/kanban`、`/sessions` 和 `/yolo` 在 **CLI** 和**消息网关**中均可使用。
- `/voice join`、`/voice channel` 和 `/voice leave` 仅在 Discord 上有意义。
- 在 TUI 中，`/sessions` 显示当前 TUI 进程中的活动会话。使用 `/resume [名称]` 或 `hermes --tui --resume <ID或标题>` 恢复已保存或已关闭的记录。

## 破坏性命令的确认提示

CLI 在运行会丢弃未保存会话状态的斜杠命令前会发出提示。当前破坏性命令集如下：

| 命令 | 破坏内容 |
|------|----------|
| `/clear` | 清除屏幕并开始新会话——当前会话 ID 和内存中的历史记录都将消失。 |
| `/new` / `/reset` | 开始新会话（新会话 ID + 空历史记录）。 |
| `/undo` | 从历史记录中移除最后一次用户/助手交互。 |
| `/exit --delete` / `/quit --delete` | 退出**并**永久删除当前会话的 SQLite 历史记录和磁盘上的记录。 |

对于这些命令，CLI 会打开一个三选一的模态框：**批准一次**（此次继续）、**始终批准**（继续并持久化设置 `approvals.destructive_slash_confirm: false`，以便未来破坏性命令无需提示即可运行）或**取消**。

**内联跳过：** 在命令后附加 `now`、`--yes` 或 `-y` 可绕过单次调用的模态框——例如 `/reset now`、`/new --yes my-session`、`/clear -y`、`/undo -y`。当模态框在您的终端上渲染不正确（参见原生 Windows PowerShell 的 [问题 #30768](https://github.com/NousResearch/hermes-agent/issues/30768)）或在针对 CLI 编写脚本时很有用。

在 `~/.hermes/config.yaml` 中设置 `approvals.destructive_slash_confirm: false` 可全局禁用提示；设置回 `true` 可重新启用。参见[安全性 — 破坏性斜杠命令确认](../user-guide/security.md#dangerous-command-approval)了解上下文。