---
sidebar_position: 2
title: "斜杠命令参考"
description: "交互式 CLI 和消息平台斜杠命令的完整参考"
---

# 斜杠命令参考

Hermes 有两个斜杠命令入口，均由 `hermes_cli/commands.py` 中的中央 `COMMAND_REGISTRY` 驱动：

- **交互式 CLI 斜杠命令** — 由 `cli.py` 分发，支持从注册表中自动补全
- **消息平台斜杠命令** — 由 `gateway/run.py` 分发，帮助文本和平台菜单由注册表生成

已安装的技能也会在这两个入口上作为动态斜杠命令暴露。包括捆绑技能如 `/plan`，它将打开计划模式，并在相对于当前工作区/后端工作目录的 `.hermes/plans/` 下保存 Markdown 计划。

## 交互式 CLI 斜杠命令

在 CLI 中输入 `/` 可打开自动补全菜单。内置命令不区分大小写。

### 会话

| 命令 | 说明 |
|---------|-------------|
| `/new`（别名：`/reset`） | 开始新会话（新的会话 ID + 历史记录） |
| `/clear` | 清屏并开始新会话 |
| `/history` | 显示对话历史 |
| `/save` | 保存当前对话 |
| `/retry` | 重试最后一条消息（重新发送给智能体） |
| `/undo` | 移除最后一次用户/助手交互 |
| `/title` | 为当前会话设置标题（用法：/title 我的会话名称） |
| `/compress [focus topic]` | 手动压缩对话上下文（刷新记忆 + 总结）。可选的 focus topic 可限定总结保留的内容。 |
| `/rollback` | 列出或恢复文件系统检查点（用法：/rollback [编号]） |
| `/snapshot [create\|restore <id>\|prune]`（别名：`/snap`） | 创建或恢复 Hermes 配置/状态的状态快照。`create [label]` 保存快照，`restore <id>` 恢复到该快照，`prune [N]` 删除旧快照，无参数则列出所有快照。 |
| `/stop` | 终止所有正在运行的后台进程 |
| `/queue <prompt>`（别名：`/q`） | 将提示排队到下一轮（不会中断当前智能体响应）。**注意：** `/q` 被 `/queue` 和 `/quit` 同时声明；最后注册的命令生效，因此实践中 `/q` 会解析为 `/quit`。请显式使用 `/queue`。 |
| `/resume [name]` | 恢复之前命名的会话 |
| `/status` | 显示会话信息 |
| `/agents`（别名：`/tasks`） | 显示当前会话中活跃的多个智能体和正在运行的任务。 |
| `/background <prompt>`（别名：`/bg`、`/btw`） | 在单独的后台会话中运行提示。智能体将独立处理您的提示 — 您当前会话可继续用于其他工作。任务完成后结果将以面板形式显示。参见 [CLI 后台会话](/docs/user-guide/cli#background-sessions)。 |
| `/branch [name]`（别名：`/fork`） | 分支当前会话（探索不同路径） |

### 配置

| 命令 | 说明 |
|---------|-------------|
| `/config` | 显示当前配置 |
| `/model [model-name]` | 显示或更改当前模型。支持：`/model claude-sonnet-4`、`/model provider:model`（切换提供商）、`/model custom:model`（自定义端点）、`/model custom:name:model`（命名自定义提供商）、`/model custom`（从端点自动检测）。使用 `--global` 可将更改持久化到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新提供商，请退出会话并在终端运行 `hermes model`。 |
| `/personality` | 设置预定义人格 |
| `/verbose` | 循环切换工具进度显示：关闭 → 新消息 → 全部 → 详细。可通过配置[在消息平台启用](#notes)。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。选项：`normal`、`fast`、`status`。 |
| `/reasoning` | 管理推理强度和显示（用法：/reasoning [level\|show\|hide]） |
| `/skin` | 显示或更改显示皮肤/主题 |
| `/statusbar`（别名：`/sb`） | 切换上下文/模型状态栏开关 |
| `/voice [on\|off\|tts\|status]` | 切换 CLI 语音模式和语音播放。录音使用 `voice.record_key`（默认：`Ctrl+B`）。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令审批提示。 |

### 工具与技能

| 命令 | 说明 |
|---------|-------------|
| `/tools [list\|disable\|enable] [name...]` | 管理工具：列出可用工具，或为当前会话禁用/启用特定工具。禁用工具会将其从智能体的工具集中移除并触发会话重置。 |
| `/toolsets` | 列出可用工具集 |
| `/browser [connect\|disconnect\|status]` | 管理本地 Chrome CDP 连接。`connect` 将浏览器工具附加到正在运行的 Chrome 实例（默认：`ws://localhost:9222`）。`disconnect` 分离连接。`status` 显示当前连接状态。如果未检测到调试器，则自动启动 Chrome。 |
| `/skills` | 从在线注册表搜索、安装、检查或管理技能 |
| `/cron` | 管理定时任务（列出、添加/创建、编辑、暂停、恢复、运行、删除） |
| `/reload-mcp`（别名：`/reload_mcp`） | 从 config.yaml 重新加载 MCP 服务器 |
| `/reload` | 将 `.env` 变量重新加载到当前会话（无需重启即可获取新的 API 密钥） |
| `/plugins` | 列出已安装插件及其状态 |

### 信息

| 命令 | 说明 |
|---------|-------------|
| `/help` | 显示此帮助信息 |
| `/usage` | 显示 token 使用情况、成本细目和会话时长 |
| `/insights` | 显示使用洞察和分析（最近 30 天） |
| `/platforms`（别名：`/gateway`） | 显示网关/消息平台状态 |
| `/paste` | 附加剪贴板图像 |
| `/copy [number]` | 将最后一次助手响应复制到剪贴板（或使用数字指定倒数第 N 次响应）。仅限 CLI。 |
| `/image <path>` | 为下一次提示附加本地图像文件。 |
| `/terminal-setup [auto\|vscode\|cursor\|windsurf]` | 仅限 TUI：配置本地 VS Code 系列终端绑定，以改善多行输入和撤销/重做体验。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可共享链接。在消息平台也可用。 |
| `/profile` | 显示当前激活的配置文件名称和主目录 |
| `/gquota` | 显示 Google Gemini Code Assist 配额使用情况（带进度条）（仅在 `google-gemini-cli` 提供商激活时可用）。 |

### 退出

| 命令 | 说明 |
|---------|-------------|
| `/quit` | 退出 CLI（也可用：`/exit`）。关于 `/q` 的说明参见上文 `/queue`。 |

### 动态 CLI 斜杠命令

| 命令 | 说明 |
|---------|-------------|
| `/<skill-name>` | 将任意已安装技能作为按需命令加载。例如：`/gif-search`、`/github-pr-workflow`、`/excalidraw`。 |
| `/skills ...` | 从注册表和官方可选技能目录中搜索、浏览、检查、安装、审计、发布和配置技能。 |

### 快速命令

用户定义的快速命令可将简短斜杠命令映射到 shell 命令或另一个斜杠命令。在 `~/.hermes/config.yaml` 中配置：

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

然后在 CLI 或消息平台中输入 `/status`、`/deploy` 或 `/inbox`。快速命令在分发时解析，可能不会出现在每个内置自动补全/帮助表中。

不支持仅字符串的提示快捷方式作为快速命令。请将较长的可重用提示放入技能中，或使用 `type: alias` 指向现有斜杠命令。

### 别名解析

命令支持前缀匹配：输入 `/h` 解析为 `/help`，`/mod` 解析为 `/model`。当前缀存在歧义（匹配多个命令）时，按注册表顺序取第一个匹配项。完整命令名称和已注册别名始终优先于前缀匹配。

## 消息斜杠命令

消息网关支持在 Telegram、Discord、Slack、WhatsApp、Signal、电子邮件和 Home Assistant 聊天中使用以下内置命令：

| 命令 | 说明 |
|---------|-------------|
| `/new` | 开始一次新的对话。 |
| `/reset` | 重置对话历史记录。 |
| `/status` | 显示会话信息。 |
| `/stop` | 终止所有正在运行的后台进程并中断正在运行的智能体。 |
| `/model [provider:model]` | 显示或更改模型。支持提供商切换（`/model zai:glm-5`）、自定义端点（`/model custom:model`）、命名自定义提供商（`/model custom:local:qwen`）和自动检测（`/model custom`）。使用 `--global` 可将更改持久化保存到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新提供商或设置 API 密钥，请在终端（聊天会话外部）使用 `hermes model` 命令。 |
| `/personality [name]` | 为会话设置一个性格覆盖层。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。 |
| `/retry` | 重试最后一条消息。 |
| `/undo` | 移除最后一次交互。 |
| `/sethome`（别名：`/set-home`） | 将当前聊天标记为平台的主频道，用于消息投递。 |
| `/compress [focus topic]` | 手动压缩对话上下文。可选的焦点主题可限定摘要保留的内容范围。 |
| `/title [name]` | 设置或显示会话标题。 |
| `/resume [name]` | 恢复之前命名的会话。 |
| `/usage` | 显示 token 使用量、预估成本明细（输入/输出）、上下文窗口状态和会话持续时间。 |
| `/insights [days]` | 显示使用分析数据。 |
| `/reasoning [level\|show\|hide]` | 更改推理努力程度或切换推理显示。 |
| `/voice [on\|off\|tts\|join\|channel\|leave\|status]` | 控制聊天中的语音回复。`join`/`channel`/`leave` 用于管理 Discord 语音频道模式。 |
| `/rollback [number]` | 列出或恢复文件系统检查点。 |
| `/background <prompt>` | 在单独的后台会话中运行一个提示词。任务完成后，结果将发送回同一聊天。请参阅[消息后台会话](/docs/user-guide/messaging/#background-sessions)。 |
| `/reload-mcp`（别名：`/reload_mcp`） | 从配置中重新加载 MCP 服务器。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令的审批提示。 |
| `/commands [page]` | 浏览所有命令和技能（分页显示）。 |
| `/approve [session\|always]` | 批准并执行待处理的危险命令。`session` 仅对此会话有效；`always` 将命令添加到永久允许列表。 |
| `/deny` | 拒绝待处理的危险命令。 |
| `/update` | 将 Hermes 智能体更新到最新版本。 |
| `/restart` | 在排空正在运行的任务后，优雅地重启网关。当网关重新上线时，会向请求者的聊天/线程发送确认消息。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可共享链接。 |
| `/help` | 显示消息帮助。 |
| `/<skill-name>` | 通过名称调用任何已安装的技能。 |
## 注意事项

- `/skin`、`/snapshot`、`/gquota`、`/reload`、`/tools`、`/toolsets`、`/browser`、`/config`、`/cron`、`/skills`、`/platforms`、`/paste`、`/image`、`/terminal-setup`、`/statusbar` 和 `/plugins` 是**仅限 CLI** 的命令。
- `/verbose` **默认仅限 CLI**，但可通过在 `config.yaml` 中设置 `display.tool_progress_command: true` 来为消息平台启用。启用后，它会循环切换 `display.tool_progress` 模式并保存到配置。
- `/sethome`、`/update`、`/restart`、`/approve`、`/deny` 和 `/commands` 是**仅限消息**的命令。
- `/status`、`/background`、`/voice`、`/reload-mcp`、`/rollback`、`/debug`、`/fast` 和 `/yolo` 在 **CLI 和消息网关中均可使用**。
- `/voice join`、`/voice channel` 和 `/voice leave` 仅在 Discord 上有意义。