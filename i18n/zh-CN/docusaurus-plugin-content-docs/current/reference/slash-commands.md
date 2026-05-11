---
sidebar_position: 2
title: "斜杠命令参考"
description: "交互式CLI和消息斜杠命令的完整参考"
---

# 斜杠命令参考

Hermes 有两个斜杠命令界面，均由 `hermes_cli/commands.py` 中的核心 `COMMAND_REGISTRY` 驱动：

- **交互式 CLI 斜杠命令** — 由 `cli.py` 调度，并从注册表提供自动补全功能
- **消息斜杠命令** — 由 `gateway/run.py` 调度，其帮助文本和平台菜单从注册表生成

已安装的技能也会作为动态斜杠命令在这两个界面中暴露出来。这包括像 `/plan` 这样的内置技能，它会打开计划模式并将markdown计划保存在相对于活动工作区/后端工作目录的 `.hermes/plans/` 路径下。

## 交互式 CLI 斜杠命令

在 CLI 中输入 `/` 可以打开自动补全菜单。内置命令不区分大小写。

### 会话

| 命令 | 描述 |
|------|------|
| `/new` (别名: `/reset`) | 开始新的会话（新的会话 ID + 历史记录） |
| `/clear` | 清屏并开始新的会话 |
| `/history` | 显示对话历史记录 |
| `/save` | 保存当前对话 |
| `/retry` | 重试上一条消息（重新发送给智能体） |
| `/undo` | 移除最后一条用户/助手交换 |
| `/title` | 为当前会话设置标题（用法：/title My Session Name） |
| `/compress [重点主题]` | 手动压缩对话上下文（刷新记忆 + 摘要）。可选的重点主题会缩窄摘要保留的内容。 |
| `/rollback` | 列出或恢复文件系统检查点（用法：/rollback [数字]） |
| `/snapshot [create\|restore <id>\|prune]` (别名: `/snap`) | 创建或恢复 Hermes 配置/状态的快照。`create [标签]` 保存快照，`restore <id>` 恢复到该快照，`prune [N]` 移除旧快照，或在没有参数时列出所有快照。 |
| `/stop` | 终止所有正在运行的后台进程 |
| `/queue <提示>` (别名: `/q`) | 为下一轮对话排队一个提示（不中断当前智能体响应）。 |
| `/steer <提示>` | 注入一个中途运行的注释，它会在**下一次工具调用之后**到达智能体——不中断，不产生新的用户轮次。文本在当前工具完成后会附加到最后一个工具结果的内容中，在不中断当前工具调用循环的情况下为智能体提供新的上下文。用此来在任务执行中途引导方向（例如，在智能体运行测试时输入 "focus on the auth module"）。 |
| `/goal <文本>` | 设置一个持续的目标，Hermes 会在多轮对话中为之努力——这是我们的 Ralph 循环实现。每轮对话后，一个辅助判断模型会决定目标是否完成；如果没有，Hermes 会自动继续。子命令：`/goal status`、`/goal pause`、`/goal resume`、`/goal clear`。预算默认为 20 轮 (`goals.max_turns`)；任何真实的用户消息都会抢占继续循环，并且状态在 `/resume` 后仍然存在。参见 [持久化目标](/docs/user-guide/features/goals) 以获取完整演练。 |
| `/resume [名称]` | 恢复之前命名的会话 |
| `/sessions` | 以交互式选择器浏览并恢复之前的会话 |
| `/redraw` | 强制完全重绘 UI（可从 tmux 调整大小、鼠标选择伪影等导致的终端漂移中恢复） |
| `/status` | 显示会话信息 |
| `/agents` (别名: `/tasks`) | 显示当前会话中的活跃智能体和运行中的任务。 |
| `/background <提示>` (别名: `/bg`, `/btw`) | 在一个单独的后台会话中运行提示。智能体会独立处理你的提示——你当前的会话可以自由用于其他工作。结果会在任务完成后以面板形式显示。参见 [CLI 后台会话](/docs/user-guide/cli#background-sessions)。 |
| `/branch [名称]` (别名: `/fork`) | 分支当前会话（探索不同的路径） |
| `/handoff <平台>` | **仅限 CLI。** 将当前会话移交给消息平台（Telegram, Discord, Slack, WhatsApp, Signal, Matrix）。网关会立即接手，在支持线程的平台（Telegram 主题、Discord 文本频道线程、Slack 消息锚定线程）上创建一个新线程，将目标重新绑定到你的 CLI session_id 以播放完整的角色感知对话记录，并伪造一个合成用户轮次，让智能体确认它正在新地点工作。成功时你的 CLI 会干净退出并给出 `/resume` 提示；你可以随时用 `/resume <标题>` 在本地恢复。在轮次中途被拒绝。要求网关正在运行，并且为目标平台配置了一个主频道（从目标聊天中使用 `/sethome`）。参见 [跨平台移交](/docs/user-guide/sessions#cross-platform-handoff)。 |

### 配置

| 命令 | 描述 |
|------|------|
| `/config` | 显示当前配置 |
| `/model [模型名称]` | 显示或更改当前模型。支持：`/model claude-sonnet-4`、`/model provider:model`（切换提供商）、`/model custom:model`（自定义端点）、`/model custom:name:model`（命名的自定义提供商）、`/model custom`（从端点自动检测），以及用户定义的别名（`/model fav`、`/model grok`——参见[自定义模型别名](#custom-model-aliases)）。使用 `--global` 将更改持久化到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新的提供商，请退出会话并在终端运行 `hermes model`。 |
| `/personality` | 设置预定义的个性 |
| `/verbose` | 循环切换工具进度显示：关闭 -> 新增 -> 全部 -> 详细。可以通过配置[为消息平台启用](#notes)。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。选项：`normal`、`fast`、`status`。 |
| `/reasoning` | 管理推理努力和显示（用法：/reasoning [level\|show\|hide]） |
| `/skin` | 显示或更改显示皮肤/主题 |
| `/statusbar` (别名: `/sb`) | 切换上下文/模型状态栏的开启或关闭 |
| `/voice [on\|off\|tts\|status]` | 切换 CLI 语音模式和语音播放。录制使用 `voice.record_key`（默认：`Ctrl+B`）。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令的批准提示。 |
| `/footer [on\|off\|status]` | 切换最终回复的网关运行时元数据页脚（显示模型、工具计数、计时）。 |
| `/busy [queue\|steer\|interrupt\|status]` | 仅限 CLI：控制在 Hermes 工作时按 Enter 键的作用 — 排队新消息、在中途引导，或立即中断。 |
| `/indicator [kaomoji\|emoji\|unicode\|ascii]` | 仅限 CLI：选择 TUI 忙碌指示器样式。 |

### 工具与技能

| 命令 | 描述 |
|------|------|
| `/tools [list\|disable\|enable] [名称...]` | 管理工具：列出可用工具，或为当前会话禁用/启用特定工具。禁用工具会将其从智能体的工具集中移除，并触发会话重置。 |
| `/toolsets` | 列出可用的工具集 |
| `/browser [connect\|disconnect\|status]` | 管理本地 Chrome CDP 连接。`connect` 将浏览器工具附加到运行中的 Chrome 实例（默认：`ws://localhost:9222`）。`disconnect` 分离。`status` 显示当前连接。如果未检测到调试器，会自动启动 Chrome。 |
| `/skills` | 从在线注册表搜索、安装、检查或管理技能 |
| `/cron` | 管理定时任务（列表、添加/创建、编辑、暂停、恢复、运行、移除） |
| `/curator` | 后台技能维护 — `status`、`run`、`pin`、`archive`。参见 [策展人](/docs/user-guide/features/curator)。 |
| `/kanban <操作>` | 无需离开聊天即可驱动多配置文件、多项目协作看板。完整的 `hermes kanban` 功能可用：`/kanban list`、`/kanban show t_abc`、`/kanban create "title" --assignee X`、`/kanban comment t_abc "text"`、`/kanban unblock t_abc`、`/kanban dispatch` 等。包含多看板支持：`/kanban boards list`、`/kanban boards create <slug>`、`/kanban boards switch <slug>`、`/kanban --board <slug> <action>`。参见 [看板斜杠命令](/docs/user-guide/features/kanban#kanban-slash-command)。 |
| `/reload-mcp` (别名: `/reload_mcp`) | 从 config.yaml 重新加载 MCP 服务器 |
| `/reload-skills` (别名: `/reload_skills`) | 重新扫描 `~/.hermes/skills/` 以查找新安装或已移除的技能 |
| `/reload` | 将 `.env` 变量重新加载到正在运行的会话中（无需重启即可获取新的 API 密钥） |
| `/plugins` | 列出已安装的插件及其状态 |

### 信息

| 命令 | 描述 |
|------|------|
| `/help` | 显示此帮助信息 |
| `/usage` | 显示令牌使用情况、费用明细、会话持续时间，以及当从活动提供商处获取到**账户限额**部分时，显示实时从提供商 API 拉取的剩余配额/信用额度/计划使用情况。 |
| `/insights` | 显示使用洞察和分析（过去 30 天） |
| `/platforms` (别名: `/gateway`) | 显示网关/消息平台状态 |
| `/paste` | 附加剪贴板图像 |
| `/copy [数字]` | 将最后一条助手回复复制到剪贴板（或带数字复制倒数第 N 条）。仅限 CLI。 |
| `/image <路径>` | 为您的下一次提示附加一个本地图像文件。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可分享链接。在消息平台中也可用。 |
| `/profile` | 显示活动配置文件名称和主目录 |
| `/gquota` | 显示 Google Gemini Code Assist 配额使用情况及进度条（仅当 `google-gemini-cli` 提供商活动时可用）。 |

### 退出

| 命令 | 描述 |
|------|------|
| `/quit` | 退出 CLI（也可用：`/exit`）。 |

### 动态 CLI 斜杠命令

| 命令 | 描述 |
|------|------|
| `/<技能名称>` | 将任何已安装的技能作为按需命令加载。示例：`/gif-search`、`/github-pr-workflow`、`/excalidraw`。 |
| `/skills ...` | 从注册表和官方可选技能目录中搜索、浏览、检查、安装、审计、发布和配置技能。 |

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

然后在 CLI 或消息平台中输入 `/status`、`/deploy` 或 `/inbox`。快速命令在调度时解析，可能不会出现在每个内置的自动补全/帮助表中。

不支持纯字符串的提示快捷方式作为快速命令。将较长的可重用提示放入技能中，或使用 `type: alias` 指向现有的斜杠命令。

### 自定义模型别名

为您经常使用的模型定义自己的短名称，然后通过 CLI 或任何消息平台中的 `/model <别名>` 来使用它们。别名在两者中的工作方式完全相同，适用于仅会话（默认）和 `--global` 切换。

支持两种配置格式：

**完整形式** — 固定确切的模型、提供商，可选的 base URL。将其放入 `~/.hermes/config.yaml`：

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

**简短形式** — 一个字符串中的 `provider/model`。无需编辑 YAML 即可从 shell 设置：

```bash
hermes config set model.aliases.fav anthropic/claude-opus-4.6
hermes config set model.aliases.grok x-ai/grok-4
```

然后在聊天中：

```
/model fav            # 仅会话
/model grok --global  # 同时将当前模型更改持久化到 config.yaml
```

用户别名优先于内置短名称，因此将别名命名为 `sonnet`、`kimi`、`opus` 等会遮蔽内置名称。别名名称不区分大小写。

### 别名解析

命令支持前缀匹配：输入 `/h` 会解析为 `/help`，`/mod` 会解析为 `/model`。当一个前缀有歧义（匹配多个命令）时，注册表顺序中的第一个匹配项获胜。完整的命令名称和已注册的别名始终优先于前缀匹配。

## 消息斜杠命令

消息网关支持在 Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant 和 Teams 聊天中使用以下内置命令：

| 命令 | 描述 |
|------|------|
| `/new` | 开始新对话。 |
| `/reset` | 重置对话历史记录。 |
| `/status` | 显示会话信息。 |
| `/stop` | 终止所有正在运行的后台进程并中断运行中的智能体。 |
| `/model [provider:model]` | 显示或更改模型。支持提供者切换 (`/model zai:glm-5`)、自定义端点 (`/model custom:model`)、命名自定义提供者 (`/model custom:local:qwen`)、自动检测 (`/model custom`) 以及用户定义的别名 (`/model fav`, `/model grok` — 参见 [自定义模型别名](#custom-model-aliases))。使用 `--global` 将更改持久化到 config.yaml。**注意：** `/model` 只能在已配置的提供者之间切换。要添加新提供者或设置 API 密钥，请在终端（聊天会话外）使用 `hermes model`。 |
| `/personality [name]` | 为会话设置人格覆盖。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。 |
| `/retry` | 重试上一条消息。 |
| `/undo` | 删除最后一轮交流。 |
| `/sethome` (别名：`/set-home`) | 将当前聊天标记为平台的主频道用于投递。 |
| `/compress [focus topic]` | 手动压缩对话上下文。可选的重点主题会缩小摘要保留的范围。 |
| `/topic [off\|help\|session-id]` | **仅限 Telegram 私信。** 管理用户管理的多会话主题模式。`/topic` 启用它或显示状态；`/topic off` 禁用它并清除绑定；`/topic help` 显示用法；在主题内使用 `/topic <session-id>` 可恢复先前的会话。参见 [多会话私信模式](/docs/user-guide/messaging/telegram#multi-session-dm-mode-topic)。 |
| `/title [name]` | 设置或显示会话标题。 |
| `/resume [name]` | 恢复先前命名的会话。 |
| `/usage` | 显示令牌使用量、估算成本明细（输入/输出）、上下文窗口状态、会话持续时间，以及 — 当活跃提供者可用时 — 一个 **账户限制** 部分，显示从提供者 API 实时获取的剩余配额/信用额度。 |
| `/insights [days]` | 显示使用情况分析。 |
| `/reasoning [level\|show\|hide]` | 更改推理强度或切换推理显示。 |
| `/voice [on\|off\|tts\|join\|channel\|leave\|status]` | 控制聊天中的语音回复。`join`/`channel`/`leave` 管理 Discord 语音频道模式。 |
| `/rollback [number]` | 列出或恢复文件系统检查点。 |
| `/background <prompt>` | 在单独的后台会话中运行提示。任务完成后，结果会投递回同一聊天。参见 [消息后台会话](/docs/user-guide/messaging/#background-sessions)。 |
| `/queue <prompt>` (别名：`/q`) | 将提示排队到下一轮，而不中断当前轮次。 |
| `/steer <prompt>` | 在下一次工具调用后注入一条消息而不中断 — 模型将在下一次迭代时接收它，而不是作为新的一轮。 |
| `/goal <text>` | 设置一个长期目标，Hermes 会在多轮对话中努力实现 — 这是我们对 Ralph 循环的实现。每轮后一个评判模型会进行检查；如果未完成，Hermes 会自动继续，直到完成、您暂停/清除它，或者达到轮次预算（默认为 20）。子命令：`/goal status`、`/goal pause`、`/goal resume`、`/goal clear`。在智能体运行期间可以安全地用于状态/暂停/清除；设置新目标需要先执行 `/stop`。参见 [持久化目标](/docs/user-guide/features/goals)。 |
| `/footer [on\|off\|status]` | 切换最终回复上的运行时元数据页脚（显示模型、工具计数、耗时）。 |
| `/curator [status\|run\|pin\|archive]` | 后台技能维护控制。 |
| `/kanban <action>` | 从聊天驱动多配置文件、多项目协作看板 — 与 CLI 参数表面相同。它会绕过运行中的智能体守卫，因此 `/kanban unblock t_abc`、`/kanban comment t_abc "…"`、`/kanban list --mine`、`/kanban boards switch <slug>` 等命令可在轮次中途使用。`/kanban create …` 会自动将发起聊天订阅到新任务的终端事件。参见 [看板斜杠命令](/docs/user-guide/features/kanban#kanban-slash-command)。 |
| `/reload-mcp` (别名：`/reload_mcp`) | 从配置重新加载 MCP 服务器。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令审批提示。 |
| `/commands [page]` | 浏览所有命令和技能（分页）。 |
| `/approve [session\|always]` | 批准并执行待处理的危险命令。`session` 仅批准本次会话；`always` 添加到永久允许列表。 |
| `/deny` | 拒绝待处理的危险命令。 |
| `/update` | 将 Hermes 智能体更新到最新版本。 |
| `/restart` | 在排空活跃运行后优雅地重启网关。当网关重新上线时，它会向请求者的聊天/线程发送确认。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可共享链接。 |
| `/help` | 显示消息帮助。 |
| `/<skill-name>` | 通过名称调用任何已安装的技能。 |

## 注意事项

- `/skin`、`/snapshot`、`/gquota`、`/reload`、`/tools`、`/toolsets`、`/browser`、`/config`、`/cron`、`/skills`、`/platforms`、`/paste`、`/image`、`/statusbar`、`/plugins`、`/busy`、`/indicator`、`/redraw`、`/clear`、`/history`、`/save`、`/copy`、`/handoff` 和 `/quit` 是**仅限 CLI** 的命令。
- `/verbose` **默认情况下仅限 CLI**，但可以通过在 `config.yaml` 中设置 `display.tool_progress_command: true` 来为消息平台启用。启用后，它会循环切换 `display.tool_progress` 模式并保存到配置。
- `/sethome`、`/update`、`/restart`、`/approve`、`/deny`、`/topic` 和 `/commands` 是**仅限消息**的命令。
- `/status`、`/background`、`/queue`、`/steer`、`/voice`、`/reload-mcp`、`/reload-skills`、`/rollback`、`/debug`、`/fast`、`/footer`、`/curator`、`/kanban`、`/sessions` 和 `/yolo` 在 **CLI 和消息网关**中均可使用。
- `/voice join`、`/voice channel` 和 `/voice leave` 仅在 Discord 上有意义。