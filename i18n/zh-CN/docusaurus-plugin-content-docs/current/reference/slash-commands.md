---
sidebar_position: 2
title: "斜杠命令参考"
description: "交互式 CLI 和消息平台斜杠命令的完整参考"
---

# 斜杠命令参考

Hermes 有两个斜杠命令界面，均由 `hermes_cli/commands.py` 中的核心 `COMMAND_REGISTRY` 驱动：

- **交互式 CLI 斜杠命令** — 由 `cli.py` 分发，支持基于注册表的自动补全
- **消息平台斜杠命令** — 由 `gateway/run.py` 分发，帮助文本和平台菜单均根据注册表生成

已安装的技能也会作为动态斜杠命令在这两个界面上呈现。这包括像 `/plan` 这样的内置技能，它会打开计划模式并将 Markdown 计划保存在相对于活动工作区/后端工作目录的 `.hermes/plans/` 下。

## 权限与管理员/用户区分

每个支持按用户设置允许列表的消息平台（Telegram、Discord、Slack、Matrix、Mattermost、Signal 等）也支持两级斜杠命令划分：**管理员**拥有所有已注册的命令，**普通用户**仅拥有你在 `user_allowed_commands` 中列出的命令（加上始终允许的 `/help` 和 `/whoami`）。在平台的 `extra:` 配置块（位于 `~/.hermes/gateway-config.yaml` 中）内，配置 `allow_admin_from` 和 `user_allowed_commands`（以及每组的等效配置 `group_allow_admin_from` / `group_user_allowed_commands`）。

请参阅各平台的文档获取示例 — 跨平台的结构完全相同：

- [Telegram](../user-guide/messaging/telegram.md#slash-command-access-control)
- [Discord](../user-guide/messaging/discord.md)
- [Slack](../user-guide/messaging/slack.md)
- [Matrix](../user-guide/messaging/matrix.md)
- [Mattermost](../user-guide/messaging/mattermost.md)
- [Signal](../user-guide/messaging/signal.md)

如果某个作用域未设置 `allow_admin_from`，则该作用域将保持不受限制的向后兼容模式 — 每个允许的用户都可以运行所有命令。

## 交互式 CLI 斜杠命令

在 CLI 中输入 `/` 可打开自动补全菜单。内置命令不区分大小写。

### 会话

| 命令 | 描述 |
|------|------|
| `/new [名称]` (别名: `/reset`) | 开始新会话（新的会话 ID + 历史记录）。可选参数 `[名称]` 用于设置初始会话标题 — 例如 `/new my-experiment` 会打开一个已命名为 `my-experiment` 的新会话，方便稍后使用 `/resume` 或 `/sessions` 查找。在命令后附加 `now`、`--yes` 或 `-y` 可跳过确认对话框 — 例如 `/reset now`、`/new --yes my-experiment`。 |
| `/clear` | 清屏并开始新会话 |
| `/history` | 显示对话历史记录 |
| `/save` | 保存当前对话 |
| `/retry` | 重试上一条消息（重新发送给智能体） |
| `/undo` | 移除最后一条用户/助手交换 |
| `/title` | 为当前会话设置标题（用法：`/title 我的会话名称`） |
| `/compress [焦点主题]` | 手动压缩对话上下文（刷新记忆 + 总结）。可选的焦点主题可缩小总结保留的范围。 |
| `/rollback` | 列出或恢复文件系统检查点（用法：`/rollback [数字]`） |
| `/snapshot [创建\|恢复 <id>\|清理]` (别名: `/snap`) | 创建或恢复 Hermes 配置/状态的状态快照。`创建 [标签]` 保存快照，`恢复 <id>` 回退到该快照，`清理 [N]` 删除旧快照，或使用无参数命令列出所有快照。 |
| `/stop` | 终止所有正在运行的后台进程 |
| `/queue <提示>` (别名: `/q`) | 将提示排入下一轮队列（不中断当前智能体响应）。 |
| `/steer <提示>` | 注入一条中途笔记，该笔记会在**下一次工具调用后**到达智能体 — 无中断，无新的用户轮次。文本会在当前工具完成后附加到上一个工具结果的内容中，从而在不中断当前工具调用循环的情况下为智能体提供新上下文。用于在任务中途调整方向（例如，当智能体正在运行测试时提示“专注于认证模块”）。 |
| `/goal <文本>` | 设置一个持续目标，Hermes 会在多轮对话中努力实现 — 这是我们对 Ralph 循环的实现。每轮结束后，一个辅助判断模型会决定目标是否完成；如果未完成，Hermes 会自动继续。子命令：`/goal status`、`/goal pause`、`/goal resume`、`/goal clear`。预算默认为 20 轮（`goals.max_turns`）；任何真实的用户消息都会抢占继续循环，并且状态在 `/resume` 后仍然保留。完整教程请参见[持久目标](/user-guide/features/goals)。 |
| `/subgoal <文本>` | 在循环中途向活动目标追加用户提供的标准。继续提示会逐字向智能体呈现所有子目标，判断模型会将它们纳入其完成/继续的裁决 — 因此，只有当原始目标**和**每个子目标都满足时，目标才会被标记为完成。子命令：`/subgoal`（列出）、`/subgoal remove <N>`、`/subgoal clear`。需要有一个活动的 `/goal`。 |
| `/resume [名称]` | 恢复一个先前命名的会话 |
| `/sessions` | 在交互式选择器中浏览和恢复先前的会话 |
| `/redraw` | 强制完整的 UI 重绘（可解决 tmux 调整大小、鼠标选择伪影等导致的终端显示偏移问题） |
| `/status` | 显示会话信息 — 模型、提供商、配置文件、会话 ID、工作目录、标题、创建/更新时间戳、令牌总数、智能体运行状态 — 后跟一个本地的**会话摘要**块（近期用户/助手轮次计数、工具调用结果计数、最常用工具、最近访问的几个文件、最新的用户提示和最新的助手回复）。摘要根据内存中的对话在本地计算；无 LLM 调用，无提示缓存影响。 |
| `/agents` (别名: `/tasks`) | 显示当前会话中的活动智能体和运行中的任务。 |
| `/background <提示>` (别名: `/bg`、`/btw`) | 在单独的后台会话中运行提示。智能体独立处理你的提示 — 你当前的会话保持空闲以进行其他工作。任务完成后结果会显示为面板。请参见 [CLI 后台会话](/user-guide/cli#background-sessions)。 |
| `/branch [名称]` (别名: `/fork`) | 分支当前会话（探索不同的路径） |
| `/handoff <平台>` | **仅限 CLI。** 将当前会话移交给一个消息平台（Telegram、Discord、Slack、WhatsApp、Signal、Matrix）。网关会立即接管，在支持线程的平台（Telegram 话题、Discord 文本频道线程、Slack 消息锚定线程）上创建新的线程，将目标重新绑定到你的 CLI session_id 以便完整回放角色感知的对话记录，并伪造一个合成的用户轮次，使智能体确认其已在新位置工作。成功后你的 CLI 会干净退出并附带 `/resume` 提示；可随时使用 `/resume <标题>` 在本地恢复。会在轮次中途被拒绝。需要网关正在运行且为该目标平台配置了主频道（在目标聊天中使用 `/sethome`）。请参见[跨平台移交](/user-guide/sessions#cross-platform-handoff)。 |

### 配置

| 命令 | 描述 |
|------|------|
| `/config` | 显示当前配置 |
| `/model [模型名称]` | 显示或更改当前模型。支持：`/model claude-sonnet-4`、`/model provider:模型`（切换提供商）、`/model custom:模型`（自定义端点）、`/model custom:名称:模型`（命名的自定义提供商）、`/model custom`（从端点自动检测），以及用户定义的别名（`/model fav`、`/model grok` — 请参见[自定义模型别名](#custom-model-aliases)）。使用 `--global` 可将更改持久化到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新的提供商，请退出会话并在终端运行 `hermes model`。 |
| `/codex-runtime [auto\|codex_app_server\|on\|off]` | 切换 OpenAI/Codex 模型的可选 [Codex 应用服务器运行时](../user-guide/features/codex-app-server-runtime)。`auto`（默认）使用 Hermes 的标准聊天完成；`codex_app_server` 将轮次交给 `codex app-server` 子进程，以获得原生 shell、apply_patch、ChatGPT 订阅身份验证和迁移的 Codex 插件。在下一次会话生效。 |
| `/personality` | 设置预定义的个性 |
| `/verbose` | 循环切换工具进度显示：关闭 → 新建 → 全部 → 详细。可通过配置[为消息启用](#notes)。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。选项：`normal`、`fast`、`status`。 |
| `/reasoning` | 管理推理努力度和显示（用法：`/reasoning [级别\|显示\|隐藏]`） |
| `/skin` | 显示或更改显示皮肤/主题 |
| `/statusbar` (别名: `/sb`) | 开启或关闭上下文/模型状态栏 |
| `/voice [on\|off\|tts\|status]` | 切换 CLI 语音模式和语音播放。录音使用 `voice.record_key`（默认：`Ctrl+B`）。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令的批准提示。 |
| `/footer [on\|off\|status]` | 切换最终回复上的网关运行时元数据页脚（显示模型、工具计数、计时）。 |
| `/busy [queue\|steer\|interrupt\|status]` | 仅限 CLI：控制当 Hermes 正在工作时按 Enter 键的效果 — 排队新消息、中途转向或立即中断。 |
| `/indicator [kaomoji\|emoji\|unicode\|ascii]` | 仅限 CLI：选择 TUI 繁忙指示器样式。 |

### 工具与技能

| 命令 | 描述 |
|------|------|
| `/tools [list\|disable\|enable] [名称...]` | 管理工具：列出可用工具，或为当前会话禁用/启用特定工具。禁用工具会将其从智能体的工具集中移除并触发会话重置。 |
| `/toolsets` | 列出可用的工具集 |
| `/browser [connect\|disconnect\|status]` | 管理本地 Chromium 系列 CDP 连接。`connect` 将浏览器工具附加到正在运行的 Chrome、Brave、Chromium 或 Edge 实例（默认：`http://127.0.0.1:9222`）。`disconnect` 分离。`status` 显示当前连接。如果未检测到调试器，会自动启动支持的 Chromium 系列浏览器。 |
| `/skills` | 搜索、安装、检查或管理来自在线注册表的技能 |
| `/cron` | 管理计划任务（列出、添加/创建、编辑、暂停、恢复、运行、移除） |
| `/curator` | 后台技能维护 — `status`、`run`、`pin`、`archive`。请参见[策展人](/user-guide/features/curator)。 |
| `/kanban <操作>` | 无需离开聊天即可驱动多配置文件、多项目协作板。完整的 `hermes kanban` 功能均可用：`/kanban list`、`/kanban show t_abc`、`/kanban create "title" --assignee X`、`/kanban comment t_abc "text"`、`/kanban unblock t_abc`、`/kanban dispatch` 等。支持多板：`/kanban boards list`、`/kanban boards create <slug>`、`/kanban boards switch <slug>`、`/kanban --board <slug> <action>`。请参见[看板斜杠命令](/user-guide/features/kanban#kanban-slash-command)。 |
| `/reload-mcp` (别名: `/reload_mcp`) | 从 config.yaml 重新加载 MCP 服务器 |
| `/reload-skills` (别名: `/reload_skills`) | 重新扫描 `~/.hermes/skills/` 以查找新安装或已移除的技能 |
| `/reload` | 将 `.env` 变量重新加载到正在运行的会话中（无需重启即可获取新的 API 密钥） |
| `/plugins` | 列出已安装的插件及其状态 |

### 信息

| 命令 | 描述 |
|------|------|
| `/help` | 显示此帮助消息 |
| `/usage` | 显示令牌使用情况、成本明细、会话持续时间，以及当活动提供商提供时 — 一个**账户限制**部分，其中包含从提供商 API 实时获取的剩余配额/信用额度/计划使用情况。 |
| `/insights` | 显示使用情况洞察和分析（过去 30 天） |
| `/platforms` (别名: `/gateway`) | 显示网关/消息平台状态（仅限 CLI 的摘要视图）。 |
| `/platform <list\|pause\|resume> [名称]` | 操作正在运行的网关平台。`/platform list` 列出每个适配器及其状态（运行中、因断路器暂停、手动暂停）；`/platform pause <名称>` 停止向该适配器分发新消息而不卸载它；`/platform resume <名称>` 重新启用它。当适配器因可重试的故障（网络/速率限制/5xx）而触发断路器时，网关也会自动暂停该适配器 — 一旦上游恢复正常，使用 `/platform resume <名称>` 清除断路器。在网关可访问的任何地方均可用（CLI 会话、Telegram、Discord 等）。 |
| `/paste` | 附加剪贴板图像 |
| `/copy [数字]` | 将最后一条助手响应复制到剪贴板（或使用数字指定倒数第 N 条）。仅限 CLI。 |
| `/image <路径>` | 为你的下一个提示附加一个本地图像文件。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可共享链接。在消息传递中也可用。 |
| `/profile` | 显示活动配置文件名称和主目录 |
| `/gquota` | 显示 Google Gemini Code Assist 配额使用情况及进度条（仅当 `google-gemini-cli` 提供商处于活动状态时可用）。 |

### 退出

| 命令 | 描述 |
|------|------|
| `/quit` | 退出 CLI（也可以使用 `/exit`）。请参见上面 `/queue` 下关于 `/q` 的说明。传递 `--delete`（或 `-d`）— 例如 `/exit --delete` — 可在退出前同时永久删除当前会话的 SQLite 历史记录和磁盘上的转录文件。适用于隐私敏感或一次性任务。 |

### 动态 CLI 斜杠命令

| 命令 | 描述 |
|------|------|
| `/<技能名称>` | 将任何已安装的技能作为按需命令加载。示例：`/gif-search`、`/github-pr-workflow`、`/excalidraw`。 |
| `/skills ...` | 从注册表和官方可选技能目录中搜索、浏览、检查、安装、审核、发布和配置技能。 |

### 快速命令

用户定义的快速命令将一个简短的斜杠命令映射到一个 shell 命令或另一个斜杠命令。在 `~/.hermes/config.yaml` 中配置它们：

```yaml
快速命令:
  状态:
    类型: exec
    命令: systemctl status hermes-agent
  部署:
    类型: exec
    命令: scripts/deploy.sh
  收件箱:
    类型: alias
    目标: /gmail unread
```

然后在 CLI 或消息平台中输入 `/status`、`/deploy` 或 `/inbox`。快速命令在分发时解析，可能不会出现在每个内置的自动补全/帮助表中。

不支持仅字符串的提示快捷方式作为快速命令。将较长的可重用提示放入技能中，或使用 `type: alias` 指向现有的斜杠命令。

### 自定义模型别名

为你经常使用的模型定义自己的短名称，然后在 CLI 或任何消息平台中使用 `/model <别名>` 来访问它们。别名在两者中的工作方式完全相同，适用于仅会话（默认）和 `--global` 切换。

支持两种配置格式：

**完整形式** — 固定一个精确的模型、提供商，可选地还有基础 URL。将其放入 `~/.hermes/config.yaml`：

```yaml
模型别名:
  fav:
    模型: claude-sonnet-4.6
    提供商: anthropic
  grok:
    模型: grok-4
    提供商: x-ai
  ollama-qwen:
    模型: qwen3-coder:30b
    提供商: custom
    基础地址: http://localhost:11434/v1
```

**简短形式** — `提供商/模型` 一个字符串。无需编辑 YAML 即可从 shell 设置：

```bash
hermes config set model.aliases.fav anthropic/claude-opus-4.6
hermes config set model.aliases.grok x-ai/grok-4
```

然后在聊天中：

```
/model fav            # 仅当前会话
/model grok --global  # 同时将当前模型更改持久化到 config.yaml
```

用户别名优先于内置短名称，因此将别名命名为 `sonnet`、`kimi`、`opus` 等会遮蔽内置名称。别名不区分大小写。

### 别名解析

命令支持前缀匹配：输入 `/h` 会解析为 `/help`，输入 `/mod` 会解析为 `/model`。当前缀有歧义（匹配多个命令）时，按注册顺序的第一个匹配项获胜。完整命令名称和注册的别名始终优先于前缀匹配。

## 消息斜杠命令

消息网关在 Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant 和 Teams 聊天中支持以下内置命令：

| 命令 | 描述 |
|------|------|
| `/new` | 开始新的对话。 |
| `/reset` | 重置对话历史。 |
| `/status` | 显示会话信息，后跟本地的**会话摘要**块（近期轮次计数、最常用工具、涉及文件、最新提示词与回复）。 |
| `/stop` | 终止所有运行中的后台进程并中断正在运行的智能体。 |
| `/model [provider:model]` | 显示或更改模型。支持提供商切换 (`/model zai:glm-5`)、自定义端点 (`/model custom:model`)、命名自定义提供商 (`/model custom:local:qwen`)、自动检测 (`/model custom`) 以及用户定义别名 (`/model fav`, `/model grok` — 参见 [自定义模型别名](#custom-model-aliases))。使用 `--global` 使更改持久化到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新提供商或设置 API 密钥，请在终端（聊天会话之外）使用 `hermes model`。 |
| `/codex-runtime [auto\|codex_app_server\|on\|off]` | 切换可选的 [Codex 应用服务器运行时](../user-guide/features/codex-app-server-runtime)。持久化到 config.yaml 中的 `model.openai_runtime` 并驱逐缓存的智能体，使下一条消息启用新的运行时。在下一个会话生效。 |
| `/personality [name]` | 为会话设置一个性格叠加层。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。 |
| `/retry` | 重试上一条消息。 |
| `/undo` | 移除最后一组交换。 |
| `/sethome` (别名: `/set-home`) | 将当前聊天标记为平台的家庭频道，用于接收投递。 |
| `/compress [focus topic]` | 手动压缩对话上下文。可选的焦点主题会缩小摘要保留的范围。 |
| `/topic [off\|help\|session-id]` | **仅限 Telegram DM。** 管理用户管理的多会话主题模式。`/topic` 启用它或显示状态；`/topic off` 禁用它并清除绑定；`/topic help` 显示用法；在主题内使用 `/topic <session-id>` 可恢复之前的会话。参见 [多会话 DM 模式](/user-guide/messaging/telegram#multi-session-dm-mode-topic)。 |
| `/title [name]` | 设置或显示会话标题。 |
| `/resume [name]` | 恢复一个先前命名的会话。 |
| `/usage` | 显示 token 使用量、估算的费用明细（输入/输出）、上下文窗口状态、会话持续时间，以及 — 当从活动提供商处可用时 — 一个 **账户限制** 部分，其中包含通过提供商 API 实时获取的剩余配额/额度。 |
| `/insights [days]` | 显示使用分析。 |
| `/reasoning [level\|show\|hide]` | 更改推理强度或切换推理显示。 |
| `/voice [on\|off\|tts\|join\|channel\|leave\|status]` | 控制聊天中的语音回复。`join`/`channel`/`leave` 管理 Discord 语音频道模式。 |
| `/rollback [number]` | 列出或恢复文件系统检查点。 |
| `/background <prompt>` | 在单独的后台会话中运行一个提示。任务完成后，结果会传回同一聊天。参见 [消息后台会话](/user-guide/messaging/#background-sessions)。 |
| `/queue <prompt>` (别名: `/q`) | 将一个提示排入下一轮而不中断当前轮次。 |
| `/steer <prompt>` | 在下一次工具调用后注入一条消息而不中断 — 模型在下一次迭代时会接收到它，而不是作为新的一轮。 |
| `/goal <text>` | 设定一个长期目标，Hermes 会在多轮次中努力实现 — 这是我们对 Ralph 循环的理解。一个判断模型在每轮后检查；如果未完成，Hermes 会自动继续直到完成、你暂停/清除它，或达到轮次预算（默认为 20）。子命令：`/goal status`, `/goal pause`, `/goal resume`, `/goal clear`。在智能体运行期间执行状态/暂停/清除是安全的；设置新目标需要先执行 `/stop`。参见 [持久化目标](/user-guide/features/goals)。 |
| `/footer [on\|off\|status]` | 切换最终回复上的运行时元数据页脚（显示模型、工具计数、耗时）。 |
| `/curator [status\|run\|pin\|archive]` | 后台技能维护控制。 |
| `/kanban <action>` | 从聊天中驱动多配置文件、多项目协作板 — 参数接口与 CLI 完全相同。绕过运行中的智能体守卫，因此 `/kanban unblock t_abc`, `/kanban comment t_abc "…"` , `/kanban list --mine`, `/kanban boards switch <slug>` 等可在轮次中间执行。`/kanban create …` 会自动将发起聊天订阅到新任务的终端事件。参见 [Kanban 斜杠命令](/user-guide/features/kanban#kanban-slash-command)。 |
| `/reload-mcp` (别名: `/reload_mcp`) | 从配置重新加载 MCP 服务器。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令的批准提示。 |
| `/commands [page]` | 浏览所有命令和技能（分页）。 |
| `/approve [session\|always]` | 批准并执行一个挂起的危险命令。`session` 仅对此会话批准；`always` 添加到永久允许列表。 |
| `/deny` | 拒绝一个挂起的危险命令。 |
| `/update` | 将 Hermes Agent 更新到最新版本。 |
| `/restart` | 在耗尽活动运行后优雅地重启网关。当网关重新上线时，它会向请求者的聊天/线程发送确认消息。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可分享链接。 |
| `/help` | 显示消息帮助。 |
| `/<skill-name>` | 按名称调用任何已安装的技能。 |

## 备注

- `/skin`, `/snapshot`, `/gquota`, `/reload`, `/tools`, `/toolsets`, `/browser`, `/config`, `/cron`, `/skills`, `/platforms`, `/paste`, `/image`, `/statusbar`, `/plugins`, `/busy`, `/indicator`, `/redraw`, `/clear`, `/history`, `/save`, `/copy`, `/handoff`, 和 `/quit` 是**仅限 CLI** 的命令。
- `/verbose` **默认情况下仅限 CLI**，但可以通过在 `config.yaml` 中设置 `display.tool_progress_command: true` 来为消息平台启用。启用后，它会循环切换 `display.tool_progress` 模式并保存到配置。
- `/sethome`, `/update`, `/restart`, `/approve`, `/deny`, `/topic`, 和 `/commands` 是**仅限消息**的命令。
- `/status`, `/background`, `/queue`, `/steer`, `/voice`, `/reload-mcp`, `/reload-skills`, `/rollback`, `/debug`, `/fast`, `/footer`, `/curator`, `/kanban`, `/sessions`, 和 `/yolo` 在 **CLI** 和**消息网关**中均可工作。
- `/voice join`, `/voice channel`, 和 `/voice leave` 仅在 Discord 上有意义。

## 危险命令的确认提示

CLI 会在运行可能丢弃未保存会话状态的斜杠命令前进行提示。当前的危险命令集合是：

| 命令 | 它会销毁什么 |
|------|--------------|
| `/clear` | 清除屏幕并开始新的会话 — 当前会话 ID 和内存中的历史记录将丢失。 |
| `/new` / `/reset` | 开始新的会话（新的会话 ID + 空的历史记录）。 |
| `/undo` | 从历史记录中移除最后一组用户/助手交换。 |
| `/exit --delete` / `/quit --delete` | 退出 **并** 永久删除当前会话的 SQLite 历史记录和磁盘上的转录文件。 |

对于每一个此类命令，CLI 都会打开一个三选一对话框：**批准一次**（此次继续）、**始终批准**（继续并持久化 `approvals.destructive_slash_confirm: false`，以便未来危险命令无需提示即可运行），或**取消**。

**行内跳过：** 在单次调用中附加 `now`, `--yes`, 或 `-y` 以绕过对话框 — 例如 `/reset now`, `/new --yes my-session`, `/clear -y`, `/undo -y`。当对话框在你的终端上无法正确渲染时很有用（参见 [问题 #30768](https://github.com/NousResearch/hermes-agent/issues/30768)，适用于原生 Windows PowerShell）或在对 CLI 进行脚本操作时。

在 `~/.hermes/config.yaml` 中设置 `approvals.destructive_slash_confirm: false` 可全局禁用提示；将其设置回 `true` 可重新启用。参见 [安全 — 危险斜杠命令确认](../user-guide/security.md#dangerous-command-approval) 了解背景。