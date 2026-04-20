---
sidebar_position: 2
title: "Slash Commands Reference"
description: "Complete reference for interactive CLI and messaging slash commands"
---

# Slash Commands Reference

Hermes 拥有两个 slash-command 界面，均由 `hermes_cli/commands.py` 中的中央 `COMMAND_REGISTRY` 驱动：

- **交互式 CLI slash commands** — 由 `cli.py` 分发，支持从注册表中自动补全
- **消息 slash commands** — 由 `gateway/run.py` 分发，帮助文本和平台菜单从注册表中生成

已安装的技能也会在这两个界面上作为动态 slash commands 暴露。包括捆绑技能如 `/plan`，它打开计划模式并在 `.hermes/plans/`（相对于活动工作区/后端工作目录）下保存 markdown 计划。

## 交互式 CLI slash commands

在 CLI 中输入 `/` 以打开自动补全菜单。内置命令不区分大小写。

### Session

| Command | Description |
|---------|-------------|
| `/new` (alias: `/reset`) | 开始新会话（全新会话 ID + 历史记录） |
| `/clear` | 清屏并启动新会话 |
| `/history` | 显示对话历史 |
| `/save` | 保存当前对话 |
| `/retry` | 重试最后一条消息（重新发送给代理） |
| `/undo` | 移除最后一个用户/助手交换内容 |
| `/title` | 为当前会话设置标题（用法：/title 我的会话名称） |
| `/compress [focus topic]` | 手动压缩对话上下文（刷新记忆 + 总结）。可选的 focus topic 可缩小摘要保留的内容范围。 |
| `/rollback` | 列出或恢复文件系统检查点（用法：/rollback [数字]） |
| `/snapshot [create\|restore <id>\|prune]` (alias: `/snap`) | 创建或恢复 Hermes 配置/状态的快照。`create [标签]` 保存快照，`restore <id>` 恢复到该快照，`prune [N]` 删除旧快照，或无参数则列出所有快照。 |
| `/stop` | 终止所有正在运行的后台进程 |
| `/queue <prompt>` (alias: `/q`) | 将提示排队到下一轮处理（不会中断当前代理响应）。**注意：** `/q` 同时被 `/queue` 和 `/quit` 声明；最后注册的获胜，因此实际上 `/q` 解析为 `/quit`。请显式使用 `/queue`。 |
| `/resume [name]` | 恢复之前命名的会话 |
| `/status` | 显示会话信息 |
| `/agents` (alias: `/tasks`) | 显示当前会话中活跃的代理和运行任务。 |
| `/background <prompt>` (alias: `/bg`) | 在单独的后台会话中运行提示。代理独立处理您的提示——您当前的会话保持空闲以便进行其他工作。任务完成时结果将以面板形式出现。参见 [CLI 后台会话](/docs/user-guide/cli#background-sessions)。 |
| `/btw <question>` | 使用会话上下文的临时侧边问题（无工具，不持久化）。适用于无需影响对话历史的快速澄清。 |
| `/plan [request]` | 加载捆绑的 `plan` 技能以编写 markdown 计划而非执行工作。计划保存在 `.hermes/plans/`（相对于活动工作区/后端工作目录）下。 |
| `/branch [name]` (alias: `/fork`) | 分支当前会话（探索不同路径） |

### Configuration

| Command | Description |
|---------|-------------|
| `/config` | 显示当前配置 |
| `/model [model-name]` | 显示或更改当前模型。支持：`/model claude-sonnet-4`、`/model provider:model`（切换提供商）、`/model custom:model`（自定义端点）、`/model custom:name:model`（命名自定义提供商）、`/model custom`（自动检测端点）。使用 `--global` 将更改保存到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新提供商，请退出会话并从终端运行 `hermes model`。 |
| `/provider` | 显示可用提供商和当前提供商 |
| `/personality` | 设置预定义人格 |
| `/verbose` | 循环工具进度显示：关闭 → 新增 → 全部 → 详细。可通过配置在[消息中启用](#notes)。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先级处理 / Anthropic 快速模式。选项：`normal`、`fast`、`status`。 |
| `/reasoning` | 管理推理努力和显示（用法：/reasoning [级别\|show\|hide]） |
| `/skin` | 显示或更改显示皮肤/主题 |
| `/statusbar` (alias: `/sb`) | 切换上下文/模型状态栏的开启或关闭 |
| `/voice [on\|off\|tts\|status]` | 切换 CLI 语音模式和语音播放。录制使用 `voice.record_key`（默认：`Ctrl+B`）。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令批准提示。 |

### Tools & Skills

| Command | Description |
|---------|-------------|
| `/tools [list\|disable\|enable] [name...]` | 管理工具：列出可用工具，或为当前会话禁用/启用特定工具。禁用工具会从代理的工具集中移除并触发会话重置。 |
| `/toolsets` | 列出可用工具集 |
| `/browser [connect\|disconnect\|status]` | 管理本地 Chrome CDP 连接。`connect` 将浏览器工具附加到正在运行的 Chrome 实例（默认：`ws://localhost:9222`）。`disconnect` 分离。`status` 显示当前连接。如果未检测到调试器则自动启动 Chrome。 |
| `/skills` | 从在线注册表中搜索、安装、检查或管理技能 |
| `/cron` | 管理计划任务（列出、添加/创建、编辑、暂停、恢复、运行、删除） |
| `/reload-mcp` (alias: `/reload_mcp`) | 从 config.yaml 重新加载 MCP 服务器 |
| `/reload` | 将 `.env` 变量重新加载到运行会话中（无需重启即可获取新的 API 密钥） |
| `/plugins` | 列出已安装的插件及其状态 |

### Info

| Command | Description |
|---------|-------------|
| `/help` | 显示此帮助信息 |
| `/usage` | 显示令牌使用情况、成本细分和会话持续时间 |
| `/insights` | 显示使用洞察和分析（最近 30 天） |
| `/platforms` (alias: `/gateway`) | 显示网关/消息平台状态 |
| `/paste` | 检查剪贴板是否有图像并将其附加 |
| `/copy [number]` | 将最后一条助手回复复制到剪贴板（或使用数字指定倒数第 N 条）。仅限 CLI。 |
| `/image <path>` | 为您的下一条提示附加本地图像文件。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获得可分享的链接。消息中也提供此功能。 |
| `/profile` | 显示活动配置文件名称和主目录 |
| `/gquota` | 显示 Google Gemini Code Assist 配额使用情况及进度条（仅在 `google-gemini-cli` 提供商激活时可用）。 |

### Exit

| Command | Description |
|---------|-------------|
| `/quit` | 退出 CLI（也可用：`/exit`）。参见上文关于 `/q` 的说明。 |

### Dynamic CLI slash commands

| Command | Description |
|---------|-------------|
| `/<skill-name>` | 将任何已安装的技能作为按需命令加载。示例：`/gif-search`、`/github-pr-workflow`、`/excalidraw`。 |
| `/skills ...` | 从注册中心和官方可选技能目录搜索、浏览、检查、安装、审计、发布和配置技能。 |

### Quick Commands

用户定义的 quick commands 将短别名映射到较长提示。在 `~/.hermes/config.yaml` 中配置它们：

```yaml
quick_commands:
  review: "Review my latest git diff and suggest improvements"
  deploy: "Run the deployment script at scripts/deploy.sh and verify the output"
  morning: "Check my calendar, unread emails, and summarize today's priorities"
```

然后在 CLI 中输入 `/review`、`/deploy` 或 `/morning`。Quick commands 在分发时解析，不会出现在内置自动补全/帮助表中。

### Alias Resolution

命令支持前缀匹配：输入 `/h` 解析为 `/help`，`/mod` 解析为 `/model`。当前缀模糊（匹配多个命令）时，注册表顺序中第一个匹配项胜出。完整命令名和注册别名始终优先于前缀匹配。

## Messaging slash commands

消息网关支持以下内置命令，适用于 Telegram、Discord、Slack、WhatsApp、Signal、Email 和 Home Assistant 聊天：

| Command | Description |
|---------|-------------|
| `/new` | 开始新对话。 |
| `/reset` | 重置对话历史。 |
| `/status` | 显示会话信息。 |
| `/stop` | 终止所有正在运行的后台进程并中断运行中的代理。 |
| `/model [provider:model]` | 显示或更改模型。支持提供商切换（`/model zai:glm-5`）、自定义端点（`/model custom:model`）、命名自定义提供商（`/model custom:local:qwen`）和自动检测（`/model custom`）。使用 `--global` 将更改保存到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新提供商或设置 API 密钥，请使用终端中的 `hermes model`（在聊天会话之外）。 |
| `/provider` | 显示提供商可用性和认证状态。 |
| `/personality [name]` | 为会话设置人格叠加层。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先级处理 / Anthropic 快速模式。 |
| `/retry` | 重试最后一条消息。 |
| `/undo` | 移除最后一条交换内容。 |
| `/sethome` (alias: `/set-home`) | 将当前聊天标记为交付的平台主频道。 |
| `/compress [focus topic]` | 手动压缩对话上下文。可选的 focus topic 可缩小摘要保留的内容范围。 |
| `/title [name]` | 设置或显示会话标题。 |
| `/resume [name]` | 恢复之前命名的会话。 |
| `/usage` | 显示令牌使用情况、估计成本细分（输入/输出）、上下文窗口状态和会话持续时间。 |
| `/insights [days]` | 显示使用分析。 |
| `/reasoning [level\|show\|hide]` | 更改推理努力或切换推理显示。 |
| `/voice [on\|off\|tts\|join\|channel\|leave\|status]` | 控制聊天中的语音回复。`join`/`channel`/`leave` 管理 Discord 语音频道模式。 |
| `/rollback [number]` | 列出或恢复文件系统检查点。 |
| `/snapshot [create\|restore <id>\|prune]` (alias: `/snap`) | 创建或恢复 Hermes 配置/状态的快照。 |
| `/background <prompt>` | 在单独的后台会话中运行提示。任务完成时将结果返回到同一聊天。参见 [消息后台会话](/docs/user-guide/messaging/#background-sessions)。 |
| `/plan [request]` | 加载捆绑的 `plan` 技能以编写 markdown 计划而非执行工作。计划保存在 `.hermes/plans/`（相对于活动工作区/后端工作目录）下。 |
| `/reload-mcp` (alias: `/reload_mcp`) | 从配置重新加载 MCP 服务器。 |
| `/reload` | 将 `.env` 变量重新加载到运行会话中。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令批准提示。 |
| `/commands [page]` | 浏览所有命令和技能（分页）。 |
| `/approve [session\|always]` | 批准并执行待处理的危险命令。`session` 仅对此会话有效；`always` 添加到永久白名单。 |
| `/deny` | 拒绝待处理的危险命令。 |
| `/update` | 将 Hermes Agent 更新到最新版本。 |
| `/restart` | 优雅地重启网关，排空活跃运行后。网关重新上线时会向请求者的聊天/线程发送确认。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获得可分享的链接。 |
| `/help` | 显示消息帮助。 |
| `/<skill-name>` | 通过名称调用任何已安装的技能。 |

## Notes

- `/skin`、`/tools`、`/toolsets`、`/browser`、`/config`、`/cron`、`/skills`、`/platforms`、`/paste`、`/image`、`/statusbar` 和 `/plugins` 是 **仅限 CLI** 的命令。
- `/verbose` 默认为 **仅限 CLI**，但可通过在 `config.yaml` 中设置 `display.tool_progress_command: true` 在消息平台中启用。启用时它会循环 `display.tool_progress` 模式并保存到配置。
- `/sethome`、`/update`、`/restart`、`/approve`、`/deny` 和 `/commands` 是 **仅限消息** 的命令。
- `/status`、`/background`、`/voice`、`/reload-mcp`、`/rollback`、`/snapshot`、`/debug`、`/fast` 和 `/yolo` 在 **CLI 和消息网关中都可用**。
- `/voice join`、`/voice channel` 和 `/voice leave` 仅在 Discord 上有意义。