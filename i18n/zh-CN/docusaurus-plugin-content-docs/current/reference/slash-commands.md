---
sidebar_position: 2
title: "斜杠命令参考"
description: "交互式命令行界面和消息传递斜杠命令的完整参考"
---

# 斜杠命令参考

Hermes 有两个斜杠命令界面，两者都由 `hermes_cli/commands.py` 中的中央 `COMMAND_REGISTRY` 驱动：

- **交互式 CLI 斜杠命令** — 由 `cli.py` 分发，并具备注册表自动补全功能。
- **消息传递斜杠命令** — 由 `gateway/run.py` 分发，并从注册表生成帮助文本和平台菜单。

已安装的技能也会在这两个界面上作为动态斜杠命令暴露。这包括像 `/plan` 这样的捆绑技能，它会打开计划模式，并将 markdown 计划保存在相对于活动工作区/后端工作目录的 `.hermes/plans/` 路径下。

## 交互式 CLI 斜杠命令

在 CLI 中输入 `/` 可以打开自动补全菜单。内置命令不区分大小写。

### 会话 (Session)

| 命令 | 描述 |
|---------|-------------|
| `/new` (别名: `/reset`) | 启动新会话（新的会话 ID + 历史记录） |
| `/clear` | 清除屏幕并启动新会话 |
| `/history` | 显示对话历史记录 |
| `/save` | 保存当前对话 |
| `/retry` | 重试上一条消息（重新发送给智能体） |
| `/undo` | 移除最后一次用户/助手交谈 |
| `/title` | 为当前会话设置标题（用法：/title 我的会话名称） |
| `/compress [focus topic]` | 手动压缩对话上下文（刷新记忆 + 总结）。可选的焦点主题可以缩小摘要保留的内容范围。 |
| `/rollback` | 列出或恢复文件系统检查点（用法：/rollback [编号]） |
| `/snapshot [create\|restore <id>\|prune]` (别名: `/snap`) | 创建或恢复 Hermes 配置/状态快照。`create [标签]` 保存快照，`restore <id>` 恢复到该快照，`prune [N]` 删除旧快照，或不带参数列出所有快照。 |
| `/stop` | 终止所有正在运行的后台进程 |
| `/queue <prompt>` (别名: `/q`) | 将提示词排队到下一轮（不中断当前的智能体响应）。**注意：** `/q` 同时被 `/queue` 和 `/quit` 占用；最后注册的命令生效，因此在实践中 `/q` 解析为 `/quit`。请明确使用 `/queue`。 |
| `/resume [name]` | 恢复先前命名的会话 |
| `/status` | 显示会话信息 |
| `/snapshot` (别名: `/snap`) | 创建或恢复 Hermes 配置/状态快照（用法：/snapshot [create\|restore \<id\>\|prune]） |
| `/background <prompt>` (别名: `/bg`) | 在单独的后台会话中运行提示词。智能体独立处理您的提示词——您的当前会话保持空闲，可用于其他工作。结果将在任务完成后作为一个面板显示。参见 [CLI 后台会话](/docs/user-guide/cli#background-sessions)。 |
| `/btw <question>` | 使用会话上下文进行临时性侧面提问（不使用工具，不持久化）。适用于无需影响对话历史记录的快速澄清。 |
| `/plan [request]` | 加载捆绑的 `plan` 技能，用于编写 markdown 计划，而不是执行工作。计划保存在相对于活动工作区/后端工作目录的 `.hermes/plans/` 路径下。 |
| `/branch [name]` (别名: `/fork`) | 分支当前会话（探索不同的路径） |

### 配置 (Configuration)

| 命令 | 描述 |
|---------|-------------|
| `/config` | 显示当前配置 |
| `/model [model-name]` | 显示或更改当前模型。支持：`/model claude-sonnet-4`、`/model provider:model`（切换提供商）、`/model custom:model`（自定义端点）、`/model custom:name:model`（命名自定义提供商）、`/model custom`（从端点自动检测）。使用 `--global` 将更改持久化到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新的提供商，请退出会话，并在终端运行 `hermes model`。 |
| `/provider` | 显示可用提供商和当前提供商 |
| `/personality` | 设置预定义的个性 |
| `/verbose` | 循环工具进度显示：关闭 → 新 → 全部 → 详细。可以通过配置 [为消息传递启用](#notes)。 |
| `/fast` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式（用法：/fast [normal\|fast\|status]） |
| `/reasoning` | 管理推理工作和显示（用法：/reasoning [level\|show\|hide]） |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。选项：`normal`，`fast`，`status`，`on`，`off`。 |
| `/skin` | 显示或更改显示皮肤/主题 |
| `/statusbar` (别名: `/sb`) | 切换上下文/模型状态栏的开关 |
| `/voice [on\|off\|tts\|status]` | 切换 CLI 语音模式和语音播放。录音使用 `voice.record_key`（默认：`Ctrl+B`）。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令的批准提示。 |

### 工具与技能 (Tools & Skills)

| 命令 | 描述 |
|---------|-------------|
| `/tools [list\|disable\|enable] [name...]` | 管理工具：列出可用工具，或为当前会话禁用/启用特定工具。禁用工具会将其从智能体的工具集中移除并触发会话重置。 |
| `/toolsets` | 列出可用工具集 |
| `/browser [connect\|disconnect\|status]` | 管理本地 Chrome CDP 连接。`connect` 将浏览器工具附加到正在运行的 Chrome 实例（默认：`ws://localhost:9222`）。`disconnect` 断开连接。`status` 显示当前连接状态。如果未检测到调试器，将自动启动 Chrome。 |
| `/skills` | 从在线注册表搜索、安装、检查或管理技能 |
| `/cron` | 管理计划任务（列出、添加/创建、编辑、暂停、恢复、运行、移除） |
| `/reload-mcp` (别名: `/reload_mcp`) | 从 config.yaml 重新加载 MCP 服务器 |
| `/reload` | 将 `.env` 变量重新加载到运行会话中（无需重启即可获取新的 API 密钥） |
| `/plugins` | 列出已安装的插件及其状态 |

### 信息 (Info)

| 命令 | 描述 |
|---------|-------------|
| `/help` | 显示此帮助信息 |
| `/usage` | 显示 token 使用量、成本细分和会话持续时间 |
| `/insights` | 显示使用洞察和分析（最近 30 天） |
| `/platforms` (别名: `/gateway`) | 显示网关/消息平台状态 |
| `/paste` | 检查剪贴板中的图像并附加它 |
| `/image <path>` | 为您的下一个提示附加本地图像文件。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可分享的链接。消息传递中也可用。 |
| `/profile` | 显示活动的配置文件名和主目录 |

### 退出 (Exit)

| 命令 | 描述 |
|---------|-------------|
| `/quit` | 退出 CLI（也为：/exit）。参见上方 `/queue` 下的 `/q` 注意事项。 |

### 动态 CLI 斜杠命令

| 命令 | 描述 |
|---------|-------------|
| `/<skill-name>` | 将任何已安装的技能作为按需命令加载。示例：`/gif-search`、`/github-pr-workflow`、`/excalidraw`。 |
| `/skills ...` | 从注册表和官方可选技能目录搜索、浏览、检查、安装、审计、发布和配置技能。 |

### 快速命令 (Quick Commands)

用户定义的快速命令将一个简短的别名映射到一个更长的提示词。请在 `~/.hermes/config.yaml` 中配置它们：

```yaml
quick_commands:
  review: "Review my latest git diff and suggest improvements"
  deploy: "Run the deployment script at scripts/deploy.sh and verify the output"
  morning: "Check my calendar, unread emails, and summarize today's priorities"
```

然后，在 CLI 中输入 `/review`、`/deploy` 或 `/morning`。快速命令在分发时解析，不会显示在内置的自动补全/帮助表中。

### 别名解析 (Alias Resolution)

命令支持前缀匹配：输入 `/h` 解析为 `/help`，`/mod` 解析为 `/model`。当前缀不明确（匹配多个命令）时，注册表中第一个匹配的命令获胜。完整的命令名称和注册的别名始终优先于前缀匹配。

## 消息传递斜杠命令

消息传递网关支持在 Telegram、Discord、Slack、WhatsApp、Signal、电子邮件和 Home Assistant 聊天中以下内置命令：

| 命令 | 描述 |
|---------|-------------|
| `/new` | 启动新对话。 |
| `/reset` | 重置对话历史记录。 |
| `/status` | 显示会话信息。 |
| `/stop` | 终止所有正在运行的后台进程并中断运行中的智能体。 |
| `/model [provider:model]` | 显示或更改模型。支持提供商切换（`/model zai:glm-5`）、自定义端点（`/model custom:model`）、命名自定义提供商（`/model custom:local:qwen`）和自动检测（`/model custom`）。使用 `--global` 将更改持久化到 config.yaml。**注意：** `/model` 只能在已配置的提供商之间切换。要添加新的提供商或设置 API 密钥，请在终端（聊天会话外部）使用 `hermes model`。 |
| `/provider` | 显示提供商可用性和认证状态。 |
| `/personality [name]` | 为会话设置个性覆盖层。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。 |
| `/retry` | 重试上一条消息。 |
| `/undo` | 移除最后一次交谈。 |
| `/sethome` (别名: `/set-home`) | 将当前聊天标记为交付的平台主频道。 |
| `/compress [focus topic]` | 手动压缩对话上下文。可选的焦点主题可以缩小摘要保留的内容范围。 |
| `/title [name]` | 设置或显示会话标题。 |
| `/resume [name]` | 恢复先前命名的会话。 |
| `/usage` | 显示 token 使用量、预估成本细分（输入/输出）、上下文窗口状态和会话持续时间。 |
| `/insights [days]` | 显示使用分析。 |
| `/reasoning [level\|show\|hide]` | 更改推理工作或切换推理显示。 |
| `/voice [on\|off\|tts\|join\|channel\|leave\|status]` | 控制聊天中的语音回复。`join`/`channel`/`leave` 管理 Discord 语音频道模式。 |
| `/rollback [number]` | 列出或恢复文件系统检查点。 |
| `/snapshot [create\|restore <id>\|prune]` (别名: `/snap`) | 创建或恢复 Hermes 配置/状态快照。 |
| `/background <prompt>` | 在单独的后台会话中运行提示词。任务完成后，结果会发送回同一聊天。参见 [消息传递后台会话](/docs/user-guide/messaging/#background-sessions)。 |
| `/plan [request]` | 加载捆绑的 `plan` 技能，用于编写 markdown 计划，而不是执行工作。计划保存在相对于活动工作区/后端工作目录的 `.hermes/plans/` 路径下。 |
| `/reload-mcp` (别名: `/reload_mcp`) | 从 config 重新加载 MCP 服务器。 |
| `/reload` | 将 `.env` 变量重新加载到运行会话中。 |
| `/yolo` | 切换 YOLO 模式 — 跳过所有危险命令的批准提示。 |
| `/commands [page]` | 浏览所有命令和技能（分页）。 |
| `/approve [session\|always]` | 批准并执行待处理的危险命令。`session` 仅为本次会话批准；`always` 添加到永久白名单。 |
| `/deny` | 拒绝待处理的危险命令。 |
| `/update` | 将 Hermes Agent 更新到最新版本。 |
| `/restart` | 在耗尽活动运行后平稳重启网关。网关重新上线时，会向请求者的聊天/线程发送确认。 |
| `/fast [normal\|fast\|status]` | 切换快速模式 — OpenAI 优先处理 / Anthropic 快速模式。 |
| `/debug` | 上传调试报告（系统信息 + 日志）并获取可分享的链接。 |
| `/help` | 显示消息传递帮助。 |
| `/<skill-name>` | 按名称调用任何已安装的技能。 |

## 注意事项 (Notes)

- `/skin`、`/tools`、`/toolsets`、`/browser`、`/config`、`/cron`、`/skills`、`/platforms`、`/paste`、`/image`、`/statusbar` 和 `/plugins` 是**仅限 CLI** 命令。
- `/verbose` 默认是**仅限 CLI** 的，但可以通过在 `config.yaml` 中设置 `display.tool_progress_command: true` 为消息传递平台启用。启用后，它会循环 `display.tool_progress` 模式并保存到配置中。
- `/sethome`、`/update`、`/restart`、`/approve`、`/deny` 和 `/commands` 是**仅限消息传递**命令。
- `/status`、`/background`、`/voice`、`/reload-mcp`、`/rollback`、`/snapshot`、`/debug`、`/fast` 和 `/yolo` 在 **CLI 和消息传递网关**中都可用。
- `/voice join`、`/voice channel` 和 `/voice leave` 仅在 Discord 上有意义。