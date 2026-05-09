---
sidebar_position: 2
title: "斜杠命令参考"
description: "交互式 CLI 和消息斜杠命令的完整参考"
---

# 斜杠命令参考

Hermes 有两个斜杠命令接口，均由 `hermes_cli/commands.py` 中的中央 `COMMAND_REGISTRY` 驱动：

- **交互式 CLI 斜杠命令** — 由 `cli.py` 分发，支持从注册表中自动补全
- **消息斜杠命令** — 由 `gateway/run.py` 分发，帮助文本和平台菜单由注册表生成

已安装的技能也会在这两个接口上作为动态斜杠命令暴露。这包括像 `/plan` 这样的捆绑技能，它会打开计划模式，并将 Markdown 计划保存在相对于当前工作空间/后端工作目录的 `.hermes/plans/` 下。

## 交互式 CLI 斜杠命令

在 CLI 中输入 `/` 可打开自动补全菜单。内置命令不区分大小写。

### 会话

| 命令 | 说明 |
|---------|-------------|
| `/new`（别名：`/reset`） | 开始新会话（新会话 ID + 历史记录） |
| `/clear` | 清屏并开始新会话 |
| `/history` | 显示对话历史 |
| `/save` | 保存当前对话 |
| `/retry` | 重试最后一条消息（重新发送给智能体） |
| `/undo` | 移除最后一次用户/助手交互 |
| `/title` | 为当前会话设置标题（用法：/title 我的会话名称） |
| `/compress [focus topic]` | 手动压缩对话上下文（刷新记忆 + 总结）。可选的焦点主题可缩小总结保留的内容范围。 |
| `/rollback` | 列出或恢复文件系统检查点（用法：/rollback [数字]） |
| `/snapshot [create\|restore <id>\|prune]`（别名：`/snap`） | 创建或恢复 Hermes 配置/状态的状态快照。`create [标签]` 保存快照，`restore <id>` 恢复到该快照，`prune [N]` 删除旧快照，无参数时列出所有快照。 |
| `/stop` | 终止所有正在运行的后台进程 |
| `/queue <prompt>`（别名：`/q`） | 将提示词加入下一轮队列（不会中断当前智能体的响应）。 |
| `/steer <prompt>` | 注入一条中途提示，该提示将在**下一次工具调用之后**到达智能体 — 无中断，无新轮次。当前工具完成后，该文本将追加到最后一条工具结果的内容中，为智能体提供新的上下文，而不会破坏当前的工具调用循环。可用于在任务中途调整方向（例如，当智能体运行测试时，“关注认证模块”）。 |
| `/goal <text>` | 设置 Hermes 跨轮次持续努力的目标 — 我们对 Ralph 循环的实现。每轮之后，一个辅助判断模型会决定是否已完成目标；如果未完成，Hermes 将自动继续。子命令：`/goal status`、`/goal pause`、`/goal resume`、`/goal clear`。预算默认为 20 轮（`goals.max_turns`）；任何真实用户消息都会抢占继续循环，且状态在 `/resume` 后保留。详见[持久化目标](/docs/user-guide/features/goals)的完整说明。 |
| `/resume [name]` | 恢复之前命名的会话 |
| `/redraw` | 强制完整重绘 UI（在 tmux 调整大小、鼠标选择伪影等后恢复终端漂移） |
| `/status` | 显示会话信息 |
| `/agents`（别名：`/tasks`） | 显示当前会话中活跃的多个智能体及正在运行的任务。 |
| `/background <prompt>`（别名：`/bg`、`/btw`） | 在单独的后台会话中运行提示词。智能体独立处理您的提示 — 您当前会话可自由进行其他工作。任务完成时结果以面板形式显示。详见 [CLI 后台会话](/docs/user-guide/cli#background-sessions)。 |
| `/branch [name]`（别名：`/fork`） | 分支当前会话（探索不同路径） |

### 配置

| 命令 | 说明 |
|---------|-------------|
| `/config` | 显示当前配置 |
| `/model [model-name]` | 显示或更改当前模型。支持：`/model claude-sonnet-4`、`/model provider:model`（切换提供商）、`/model custom:model`（自定义端点）、`/model custom:name:model`（命名自定义提供商）、`/model custom`（从端点自动检测），以及用户定义别名（`/model fav`、`/model grok` — 参见[自定义模型别名](#custom-model-aliases)）。使用 `--global` 可将更改持久化到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新提供商，请退出会话并在终端中运行 `hermes model`。 |
| `/personality` | 设置预定义人格 |
| `/verbose` | 循环切换工具进度显示：关闭 → 新消息 → 全部 → 详细。可通过配置[针对消息启用](#notes)。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。选项：`normal`、`fast`、`status`。 |
| `/reasoning` | 管理推理努力程度和显示（用法：/reasoning [级别\|show\|hide]） |
| `/skin` | 显示或更改显示皮肤/主题 |
| `/statusbar`（别名：`/sb`） | 切换上下文/模型状态栏开关 |
| `/voice [on\|off\|tts\|status]` | 切换 CLI 语音模式和语音播放。录音使用 `voice.record_key`（默认：`Ctrl+B`）。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令审批提示。 |
| `/footer [on\|off\|status]` | 切换最终回复中的网关运行时元数据页脚（显示模型、工具计数、计时）。 |
| `/busy [queue\|steer\|interrupt\|status]` | 仅限 CLI：控制 Hermes 工作时按下 Enter 键的操作 — 将新消息加入队列、中途调整或立即中断。 |
| `/indicator [kaomoji\|emoji\|unicode\|ascii]` | 仅限 CLI：选择 TUI 忙碌指示器样式。 |

### 工具与技能

| 命令 | 说明 |
|---------|-------------|
| `/tools [list\|disable\|enable] [name...]` | 管理工具：列出可用工具，或为当前会话禁用/启用特定工具。禁用工具会将其从智能体的工具集中移除并触发会话重置。 |
| `/toolsets` | 列出可用工具集 |
| `/browser [connect\|disconnect\|status]` | 管理本地 Chrome CDP 连接。`connect` 将浏览器工具附加到正在运行的 Chrome 实例（默认：`ws://localhost:9222`）。`disconnect` 分离。`status` 显示当前连接。如果未检测到调试器，则自动启动 Chrome。 |
| `/skills` | 从在线注册表中搜索、安装、检查或管理技能 |
| `/cron` | 管理计划任务（列出、添加/创建、编辑、暂停、恢复、运行、删除） |
| `/curator` | 后台技能维护 — `status`、`run`、`pin`、`archive`。详见 [Curator](/docs/user-guide/features/curator)。 |
| `/kanban <action>` | 不离开聊天即可驱动多配置文件、多项目协作看板。完整的 `hermes kanban` 功能可用：`/kanban list`、`/kanban show t_abc`、`/kanban create "标题" --assignee X`、`/kanban comment t_abc "文本"`、`/kanban unblock t_abc`、`/kanban dispatch` 等。支持多看板：`/kanban boards list`、`/kanban boards create <slug>`、`/kanban boards switch <slug>`、`/kanban --board <slug> <action>`。详见 [Kanban 斜杠命令](/docs/user-guide/features/kanban#kanban-slash-command)。 |
| `/reload-mcp`（别名：`/reload_mcp`） | 从 config.yaml 重新加载 MCP 服务器 |
| `/reload` | 将 `.env` 变量重新加载到当前会话（无需重启即可获取新 API 密钥） |
| `/plugins` | 列出已安装插件及其状态 |

### 信息

| 命令 | 说明 |
|---------|-------------|
| `/help` | 显示此帮助信息 |
| `/usage` | 显示令牌使用情况、成本明细、会话时长，以及（当活跃提供商提供时）**账户限制**部分，其中包含从提供商 API 实时获取的剩余配额/积分/套餐使用情况。 |
| `/insights` | 显示使用情况洞察和分析（最近 30 天） |
| `/platforms`（别名：`/gateway`） | 显示网关/消息平台状态 |
| `/paste` | 附加剪贴板图像 |
| `/copy [number]` | 将最后一条助手回复复制到剪贴板（或使用数字指定倒数第 N 条）。仅限 CLI。 |
| `/image <path>` | 为下一条提示词附加本地图像文件。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可共享链接。也可在消息中使用。 |
| `/profile` | 显示活跃配置文件名称和主目录 |
| `/gquota` | 显示 Google Gemini Code Assist 配额使用情况（带进度条，仅在 `google-gemini-cli` 提供商激活时可用）。 |

### 退出

| 命令 | 说明 |
|---------|-------------|
| `/quit` | 退出 CLI（也可用：`/exit`）。 |

### 动态 CLI 斜杠命令

| 命令 | 说明 |
|---------|-------------|
| `/<skill-name>` | 将任何已安装技能作为按需命令加载。例如：`/gif-search`、`/github-pr-workflow`、`/excalidraw`。 |
| `/skills ...` | 从注册表和官方可选技能目录中搜索、浏览、检查、安装、审计、发布和配置技能。 |

### 快速命令

用户定义的快速命令将短斜杠命令映射到 shell 命令或另一个斜杠命令。在 `~/.hermes/config.yaml` 中配置：

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

然后在 CLI 或消息平台中输入 `/status`、`/deploy` 或 `/inbox`。快速命令在调度时解析，可能不会出现在每个内置自动补全/帮助表中。

不支持仅字符串的提示词快捷方式作为快速命令。将较长的可重用提示词放入技能中，或使用 `type: alias` 指向现有斜杠命令。

### 自定义模型别名

为您经常使用的模型定义自己的短名称，然后在 CLI 或任何消息平台中使用 `/model <别名>` 访问。别名在两种环境中工作方式相同，支持仅会话（默认）和 `--global` 切换。

支持两种配置格式：

**完整形式** — 固定确切的模型、提供商，以及可选的基础 URL。将其放入 `~/.hermes/config.yaml`：

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

**简短形式** — 用单个字符串表示 `provider/model`。无需编辑 YAML，直接从 shell 设置：

```bash
hermes config set model.aliases.fav anthropic/claude-opus-4.6
hermes config set model.aliases.grok x-ai/grok-4
```

然后在聊天中：

```
/model fav            # 仅会话
/model grok --global  # 同时将当前模型更改持久化到 config.yaml
```

用户别名优先于内置短名称，因此将别名命名为 `sonnet`、`kimi`、`opus` 等会覆盖内置名称。别名名称不区分大小写。

### 别名解析

命令支持前缀匹配：输入 `/h` 解析为 `/help`，`/mod` 解析为 `/model`。当前缀存在歧义（匹配多个命令）时，按注册表顺序选择第一个匹配项。完整命令名称和已注册别名始终优先于前缀匹配。

## 消息斜杠命令

消息网关支持在 Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant 和 Teams 聊天中使用以下内置命令：

| 命令 | 描述 |
|---------|-------------|
| `/new` | 开始一次新的对话。 |
| `/reset` | 重置对话历史记录。 |
| `/status` | 显示会话信息。 |
| `/stop` | 终止所有正在运行的后台进程并中断当前运行的智能体。 |
| `/model [provider:model]` | 显示或更改模型。支持提供商切换（`/model zai:glm-5`）、自定义端点（`/model custom:model`）、命名自定义提供商（`/model custom:local:qwen`）、自动检测（`/model custom`）以及用户定义的别名（`/model fav`、`/model grok` — 参见[自定义模型别名](#custom-model-aliases)）。使用 `--global` 可将更改持久化保存到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新提供商或设置 API 密钥，请从终端（在聊天会话之外）使用 `hermes model` 命令。 |
| `/personality [name]` | 为当前会话设置人格覆盖。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。 |
| `/retry` | 重试上一条消息。 |
| `/undo` | 移除最后一次交互。 |
| `/sethome`（别名：`/set-home`） | 将当前聊天标记为平台的“主频道”，用于接收交付内容。 |
| `/compress [focus topic]` | 手动压缩对话上下文。可选的聚焦主题可限定摘要保留的内容范围。 |
| `/topic [off\|help\|session-id]` | **仅限 Telegram 私聊。** 管理用户控制的多会话主题模式。`/topic` 启用该模式或显示状态；`/topic off` 禁用该模式并清除绑定；`/topic help` 显示用法；在主题内使用 `/topic <session-id>` 可恢复之前的会话。参见[多会话私聊模式（主题）](/docs/user-guide/messaging/telegram#multi-session-dm-mode-topic)。 |
| `/title [name]` | 设置或显示会话标题。 |
| `/resume [name]` | 恢复之前命名的会话。 |
| `/usage` | 显示 token 使用情况、预估成本明细（输入/输出）、上下文窗口状态、会话持续时间，以及（如果活动提供商支持）**账户限制**部分，其中包含从提供商 API 实时获取的剩余配额/积分。 |
| `/insights [days]` | 显示使用分析数据。 |
| `/reasoning [level\|show\|hide]` | 更改推理努力程度或切换推理内容显示。 |
| `/voice [on\|off\|tts\|join\|channel\|leave\|status]` | 控制聊天中的语音回复。`join`/`channel`/`leave` 用于管理 Discord 语音频道模式。 |
| `/rollback [number]` | 列出或恢复文件系统检查点。 |
| `/background <prompt>` | 在独立的后台会话中运行提示词。任务完成后，结果将发送回同一聊天。参见[消息后台会话](/docs/user-guide/messaging/#background-sessions)。 |
| `/queue <prompt>`（别名：`/q`） | 将提示词排队到下一轮，不中断当前轮次。 |
| `/steer <prompt>` | 在下一次工具调用后注入一条消息而不中断 — 模型会在下一次迭代时处理它，而不是作为新的一轮。 |
| `/goal <text>` | 设置一个 Hermes 跨轮次持续努力的目标 — 我们对 Ralph 循环的实现。每轮结束后由评判模型检查；若未完成，Hermes 将自动继续，直到完成、您暂停/清除它，或达到轮次预算（默认 20）。子命令：`/goal status`、`/goal pause`、`/goal resume`、`/goal clear`。在智能体运行期间安全执行 status/pause/clear 操作；设置新目标前需先执行 `/stop`。参见[持久化目标](/docs/user-guide/features/goals)。 |
| `/footer [on\|off\|status]` | 切换最终回复中的运行时元数据页脚（显示模型、工具数量、耗时）。 |
| `/curator [status\|run\|pin\|archive]` | 后台技能维护控制。 |
| `/kanban <action>` | 通过聊天驱动多配置文件、多项目协作看板 — 参数接口与 CLI 完全相同。绕过“运行中智能体”保护机制，因此 `/kanban unblock t_abc`、`/kanban comment t_abc "…"`、`/kanban list --mine`、`/kanban boards switch <slug>` 等命令可在任意轮次执行。`/kanban create …` 会自动将发起聊天的会话订阅到新任务的终端事件。参见[看板斜杠命令](/docs/user-guide/features/kanban#kanban-slash-command)。 |
| `/reload-mcp`（别名：`/reload_mcp`） | 从配置重新加载 MCP 服务器。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令的审批提示。 |
| `/commands [page]` | 浏览所有命令和技能（分页显示）。 |
| `/approve [session\|always]` | 批准并执行待处理的危险命令。`session` 仅对当前会话有效；`always` 将其加入永久允许列表。 |
| `/deny` | 拒绝待处理的危险命令。 |
| `/update` | 将 Hermes 智能体更新至最新版本。 |
| `/restart` | 排空活动运行后优雅重启网关。网关重新上线后，会向请求者的聊天/线程发送确认消息。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可分享链接。 |
| `/help` | 显示消息帮助信息。 |
| `/<skill-name>` | 通过名称调用任意已安装的技能。 |

## 说明

- `/skin`、`/snapshot`、`/gquota`、`/reload`、`/tools`、`/toolsets`、`/browser`、`/config`、`/cron`、`/skills`、`/platforms`、`/paste`、`/image`、`/statusbar`、`/plugins`、`/busy`、`/indicator`、`/redraw`、`/clear`、`/history`、`/save`、`/copy` 和 `/quit` 为 **仅限 CLI** 的命令。
- `/verbose` **默认仅限 CLI**，但可通过在 `config.yaml` 中设置 `display.tool_progress_command: true` 来为消息平台启用。启用后，它将循环切换 `display.tool_progress` 模式并保存到配置。
- `/sethome`、`/update`、`/restart`、`/approve`、`/deny`、`/topic` 和 `/commands` 为 **仅限消息平台** 的命令。
- `/status`、`/background`、`/queue`、`/steer`、`/voice`、`/reload-mcp`、`/rollback`、`/debug`、`/fast`、`/footer`、`/curator`、`/kanban` 和 `/yolo` 在 **CLI 和消息网关中均可使用**。
- `/voice join`、`/voice channel` 和 `/voice leave` 仅在 Discord 上有意义。