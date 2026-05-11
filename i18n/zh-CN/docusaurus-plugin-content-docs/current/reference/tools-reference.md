---
sidebar_position: 3
title: "内置工具参考"
description: "Hermes 内置工具的权威参考，按工具集分组"
---

# 内置工具参考

本页记录了 Hermes 的内置工具，按工具集分组。可用性因平台、凭证和启用的工具集而异。

**快速统计（当前注册表）：** ~70 个工具 — 10 个浏览器工具（核心）+ 2 个 CDP 受限浏览器工具，4 个文件工具，10 个 RL 工具，4 个 Home Assistant 工具，2 个终端工具，2 个 Web 工具，5 个飞书工具，7 个 Spotify 工具（由捆绑的 `spotify` 插件注册），5 个元宝工具，7 个看板工具（当看板调度器生成智能体时注册），2 个 Discord 工具，以及少量独立工具（`memory`、`clarify`、`delegate_task`、`execute_code`、`cronjob`、`session_search`、`skill_view`/`skill_manage`/`skills_list`、`text_to_speech`、`image_generate`、`vision_analyze`、`video_analyze`、`mixture_of_agents`、`send_message`、`todo`、`computer_use`、`process`）。

:::tip MCP 工具
除了内置工具外，Hermes 可以从 MCP 服务器动态加载工具。MCP 工具以 `mcp_<server>_` 为前缀出现（例如，用于 `github` MCP 服务器的 `mcp_github_create_issue`）。请参阅 [MCP 集成](/docs/user-guide/features/mcp) 了解配置。
:::

## `browser` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `browser_back` | 导航回浏览器历史记录中的上一页。需要先调用 browser_navigate。 | — |
| `browser_click` | 点击由快照中引用 ID 标识的元素（例如 '@e5'）。引用 ID 在快照输出的方括号中显示。需要先调用 browser_navigate 和 browser_snapshot。 | — |
| `browser_console` | 获取当前页面的浏览器控制台输出和 JavaScript 错误。返回 console.log/warn/error/info 消息和未捕获的 JS 异常。使用此工具检测静默的 JavaScript 错误、失败的 API 调用和应用程序警告。需要先调用 browser_navigate。 | — |
| `browser_get_images` | 获取当前页面上所有图像的列表及其 URL 和替代文本。对于查找图像以与视觉工具一起分析很有用。需要先调用 browser_navigate。 | — |
| `browser_navigate` | 在浏览器中导航到 URL。初始化会话并加载页面。必须在调用其他浏览器工具之前调用。对于简单的信息检索，优先使用 web_search 或 web_extract（更快、更便宜）。当您需要时，使用浏览器工具… | — |
| `browser_press` | 按下键盘键。对于提交表单（Enter）、导航（Tab）或键盘快捷键很有用。需要先调用 browser_navigate。 | — |
| `browser_scroll` | 沿某个方向滚动页面。使用此工具可以显示更多可能位于当前视口下方或上方的内容。需要先调用 browser_navigate。 | — |
| `browser_snapshot` | 获取当前页面可访问性树的基于文本的快照。返回带有引用 ID（如 @e1, @e2）的交互式元素，供 browser_click 和 browser_type 使用。full=false（默认）：包含交互式元素的紧凑视图。full=true：包含… | — |
| `browser_type` | 在由引用 ID 标识的输入字段中键入文本。首先清除字段，然后键入新文本。需要先调用 browser_navigate 和 browser_snapshot。 | — |
| `browser_vision` | 拍摄当前页面的屏幕截图并用视觉 AI 进行分析。当您需要视觉理解页面上的内容时使用此工具——对于 CAPTCHA、视觉验证挑战、复杂布局或文本快照特别有用… | — |

## `browser` 工具集（CDP 门控工具）

这两个工具位于 `browser` 工具集中，但仅在会话开始时可访问 Chrome 开发者工具协议端点时才会注册——通过 `/browser connect`、`browser.cdp_url` 配置、Browserbase 会话或 Camofox。

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `browser_cdp` | 发送原始 Chrome 开发者工具协议命令。这是处理高级 `browser_*` 工具未涵盖的浏览器操作的应急方案。参见 https://chromedevtools.github.io/devtools-protocol/ | CDP 端点 |
| `browser_dialog` | 响应原生 JavaScript 对话框（alert / confirm / prompt / beforeunload）。首先调用 `browser_snapshot`——待处理的对话框会显示在其 `pending_dialogs` 字段中。然后调用 `browser_dialog(action='accept'\|'dismiss')`。 | CDP 端点 |

## `clarify` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `clarify` | 当需要澄清、反馈或在继续操作前需要用户做出决定时，向用户提问。支持两种模式：1. **多选**——提供最多 4 个选项。用户选择一个或通过第 5 个“其他”选项输入自己的答案。2.… | — |

## `code_execution` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `execute_code` | 运行一个可以编程方式调用 Hermes 工具的 Python 脚本。当您需要 3 次以上工具调用并在它们之间进行处理逻辑、需要在大型工具输出进入上下文前进行过滤/缩减、需要条件分支（…时使用此工具） | — |

## `cronjob` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `cronjob` | 统一的定时任务管理器。使用 `action="create"`、`"list"`、`"update"`、`"pause"`、`"resume"`、`"run"` 或 `"remove"` 来管理作业。支持带有一个或多个附加技能的技能支持作业，在更新时使用 `skills=[]` 可清除附加技能。定时任务运行在没有当前聊天上下文的全新会话中。 | — |

## `delegation` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `delegate_task` | 启动一个或多个子智能体在隔离的上下文中处理任务。每个子智能体拥有自己的对话、终端会话和工具集。只返回最终摘要——中间工具结果不会进入您的上下文窗口。两种… | — |

## `feishu_doc` 工具集

作用域限定于飞书文档评论智能回复处理器 (`gateway/platforms/feishu_comment.py`)。未在 `hermes-cli` 或常规飞书聊天适配器上公开。

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `feishu_doc_read` | 根据文件类型和 token 读取飞书/Lark 文档（Docx、Doc 或 Sheet）的完整文本内容。 | 飞书应用凭证 |

## `feishu_drive` 工具集

作用域限定于飞书文档评论处理器。驱动云盘文件的评论读写操作。

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `feishu_drive_add_comment` | 在飞书/Lark 文档或文件上添加顶级评论。 | 飞书应用凭证 |
| `feishu_drive_list_comments` | 列出飞书/Lark 文件的整篇文档评论，最新优先。 | 飞书应用凭证 |
| `feishu_drive_list_comment_replies` | 列出特定飞书评论线程（整篇文档或本地选择）的回复。 | 飞书应用凭证 |
| `feishu_drive_reply_comment` | 在飞书评论线程上发布回复，可选提及 `@` 用户。 | 飞书应用凭证 |

## `file` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `patch` | 文件中的定向查找和替换编辑。使用此工具代替终端中的 sed/awk。使用模糊匹配（9 种策略），因此轻微的空白/缩进差异不会导致失败。返回统一的差异。编辑后自动运行语法检查… | — |
| `read_file` | 读取带有行号和分页的文本文件。使用此工具代替终端中的 cat/head/tail。输出格式：'行号\|内容'。如果未找到，会建议相似的文件名。对于大文件，使用 offset 和 limit。注意：无法读取图片或… | — |
| `search_files` | 搜索文件内容或按名称查找文件。使用此工具代替终端中的 grep/rg/find/ls。基于 Ripgrep，比 shell 等价命令更快。内容搜索 (target='content')：文件内的正则表达式搜索。输出模式：包含行…的完整匹配 | — |
| `write_file` | 将内容写入文件，完全替换现有内容。使用此工具代替终端中的 echo/cat heredoc。自动创建父目录。覆盖整个文件——对于定向编辑，请使用 'patch'。 | — |

## `homeassistant` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `ha_call_service` | 调用 Home Assistant 服务以控制设备。使用 ha_list_services 来发现每个域可用的服务及其参数。 | — |
| `ha_get_state` | 获取单个 Home Assistant 实体的详细状态，包括所有属性（亮度、颜色、温度设定点、传感器读数等）。 | — |
| `ha_list_entities` | 列出 Home Assistant 实体。可选按域（灯、开关、空调、传感器、二进制传感器、窗帘、风扇等）或按区域名称（客厅、厨房、卧室等）过滤。 | — |
| `ha_list_services` | 列出可用的 Home Assistant 服务（操作）以控制设备。显示可以对每种设备类型执行哪些操作以及它们接受哪些参数。使用此工具来发现如何控制通过 ha_list_entities 找到的设备。 | — |

## `computer_use` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `computer_use` | 通过 cua-driver 进行后台 macOS 桌面控制——截屏（SOM / 视觉 / AX）、点击/拖动/滚动/输入/按键/等待、list_apps、focus_app。不会抢占用户的鼠标光标或键盘焦点。可与任何具有工具能力的模型配合工作。仅限 macOS。 | `$PATH` 中有 `cua-driver`（通过 `hermes tools` 安装）。 |

:::注意
**Honcho 工具** (`honcho_profile`, `honcho_search`, `honcho_context`, `honcho_reasoning`, `honcho_conclude`) 不再内置。它们可通过 Honcho 记忆提供商插件在 `plugins/memory/honcho/` 获取。参见 [记忆提供商](../user-guide/features/memory-providers.md) 了解安装和使用。
:::

## `image_gen` 工具集

| 工具 | 描述 | 需要的环境变量 |
|------|-------------|----------------------|
| `image_generate` | 使用 FAL.ai 从文本提示词生成高质量图像。底层模型可由用户配置（默认：FLUX 2 Klein 9B，亚1秒生成），智能体无法选择。返回单张图像 URL。显示它使用… | FAL_KEY |

## `kanban` 工具集

仅在看板调度器创建智能体时注册（设置了 `HERMES_KANBAN_TASK` 环境变量）。允许工作者通过结构化交接标记任务完成、阻塞以等待人工输入、在长时间操作期间发送心跳、对讨论串进行评论，以及（对于协调器）将任务扇出为子任务。完整工作流程请参阅 [看板多智能体](/docs/user-guide/features/kanban)。

| 工具 | 描述 | 需要的环境变量 |
|------|-------------|----------------------|
| `kanban_show` | 显示分配给此工作者的活动看板任务（标题、描述、评论、依赖项）。 | `HERMES_KANBAN_TASK` |
| `kanban_complete` | 使用结构化交接有效载荷（结果、制品、后续事项）将当前任务标记为完成。 | `HERMES_KANBAN_TASK` |
| `kanban_block` | 因用户的问题而阻塞当前任务 — 调度器会暂停，显示该问题，并在人工回复后恢复。 | `HERMES_KANBAN_TASK` |
| `kanban_heartbeat` | 在长时间运行的操作期间发送进度心跳，让调度器知道工作者仍然存活。 | `HERMES_KANBAN_TASK` |
| `kanban_comment` | 在不改变任务状态的情况下向任务讨论串添加评论 — 这对于提出中间发现很有用。 | `HERMES_KANBAN_TASK` |
| `kanban_create` | （仅协调器）从当前任务扇出创建子任务。 | `HERMES_KANBAN_TASK` + 协调器角色 |
| `kanban_link` | （仅协调器）将相关任务链接在一起（阻塞/被阻塞/相关）。 | `HERMES_KANBAN_TASK` + 协调器角色 |

## `memory` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `memory` | 将重要信息保存到持久化内存中，该内存可在不同会话间保留。你的内存会在会话开始时出现在系统提示中——这是你记住用户信息和环境的方式。 何时使用… | — |

## `messaging` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `send_message` | 向已连接的消息平台发送消息，或列出可用目标。重要提示：当用户要求发送到特定频道或个人（而不仅仅是裸平台名称）时，请首先调用 `send_message(action='list')` 以查看可用目… | — |

## `moa` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `mixture_of_agents` | 通过多个前沿大型语言模型协作，路由一个难题。进行5次API调用（4个参考模型 + 1个聚合器），并以最大推理努力——请谨慎使用，仅用于真正困难的问题。 最适合：复杂数学，高级算… | OPENROUTER_API_KEY |

## `rl` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `rl_check_status` | 获取训练运行的状态和指标。 速率限制：对同一运行强制执行至少30分钟的检查间隔。 返回 WandB 指标：step（步骤）、state（状态）、reward_mean（平均奖励）、loss（损失）、percent_correct（正确率百分比）。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_edit_config` | 更新配置字段。请先使用 `rl_get_current_config()` 查看所选环境的所有可用字段。每个环境都有不同的可配置选项。 基础设施设置（分词器、URL、lora_rank、学习率等… | TINKER_API_KEY, WANDB_API_KEY |
| `rl_get_current_config` | 获取当前环境配置。仅返回可修改的字段：group_size（组大小）、max_token_length（最大令牌长度）、total_steps（总步数）、steps_per_eval（每次评估步数）、use_wandb（使用WandB）、wandb_name（WandB名称）、max_num_workers（最大工作线程数）。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_get_results` | 获取已完成训练运行的最终结果和指标。返回最终指标和训练权重的路径。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_list_environments` | 列出所有可用的强化学习环境。返回环境名称、路径和描述。 提示：使用文件工具读取 file_path 以了解每个环境的工作原理（验证器、数据加载、奖励）。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_list_runs` | 列出所有训练运行（活动和已完成的）及其状态。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_select_environment` | 选择一个强化学习环境进行训练。加载该环境的默认配置。选择后，使用 `rl_get_current_config()` 查看设置，并使用 `rl_edit_config()` 修改它们。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_start_training` | 使用当前环境和配置开始新的强化学习训练运行。大多数训练参数（lora_rank、学习率等）是固定的。在开始前，请使用 `rl_edit_config()` 设置 group_size（组大小）、batch_size（批大小）、wandb_project（WandB项目）。 警告：训练… | TINKER_API_KEY, WANDB_API_KEY |
| `rl_stop_training` | 停止正在运行的训练作业。当指标看起来不好、训练停滞不前或你想尝试不同设置时使用。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_test_inference` | 对任何环境进行快速推理测试。使用 OpenRouter 运行几步推理和评分。默认：3步 x 16次完成 = 每个模型48次 rollout，测试3个模型 = 总共144次。测试环境加载、提示构建、… | TINKER_API_KEY, WANDB_API_KEY |

## `session_search` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `session_search` | 搜索你过往对话的长期记忆。这是你的回忆功能——每个过往会话都是可搜索的，该工具会总结发生过的事情。 在以下情况下积极使用此工具：当用户说“我们以前做过这个”、“还记得什么时候”、“上次… | — |

## `skills` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `skill_manage` | 管理技能（创建、更新、删除）。技能是你的程序性记忆——针对重复任务类型的可复用方法。新技能保存在 `~/.hermes/skills/`；现有技能可以在其所在位置进行修改。 操作：create（创建完整的 SKILL.m… | — |
| `skill_view` | 技能允许加载有关特定任务和工作流的信息，以及脚本和模板。加载技能的完整内容或访问其链接的文件（参考、模板、脚本）。第一次调用返回 SKILL.md 内容和… | — |
| `skills_list` | 列出可用技能（名称 + 描述）。使用 `skill_view(name)` 加载完整内容。 | — |

## `terminal` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `process` | 管理使用 `terminal(background=true)` 启动的后台进程。操作：'list'（显示全部）、'poll'（检查状态和新输出）、'log'（带分页的完整输出）、'wait'（阻塞直到完成或超时）、'kill'（终止）、'write'（发送… | — |
| `terminal` | 在Linux环境中执行shell命令。文件系统在不同调用之间保持持久性。对于长时间运行的服务器，设置 `background=true`。设置 `notify_on_complete=true`（与 `background=true` 一起）可在进程完成时获得自动通知——无需轮询。 请勿使用 cat/head/tail —— 请使用 read_file。 请勿使用 grep/rg/find —— 请使用 search_files。 | — |

## `todo` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `todo` | 管理当前会话的任务列表。用于包含3个以上步骤的复杂任务或当用户提供多个任务时。不带参数调用以读取当前列表。 写入： - 提供 'todos' 数组以创建/更新项目 - 使用 merge=… | — |

## `vision` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `vision_analyze` | 使用AI视觉分析图像。提供全面描述并回答关于图像内容的具体问题。 | — |

## `video` 工具集

可选工具集（未包含在默认的 `hermes-cli` 集中）。通过 `--toolsets video` 或在你的 `toolsets:` 配置中包含 `video` 来添加。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `video_analyze` | 分析来自URL或文件路径的视频内容——字幕、场景分解、关键时间戳和视觉描述。 | — |

## `web` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `web_search` | 搜索网络获取信息。默认返回最多5条结果，包含标题、URL和描述。接受可选的 `limit` 参数（1-100，默认为5）。查询会直接传递给配置的后端，因此像 `site:domain`、`filetype:pdf`、`intitle:word`、`-term` 和 `"exact phrase"` 这样的运算符在后端支持时可能会起作用。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |
| `web_extract` | 从网页URL提取内容。以markdown格式返回页面内容。也适用于PDF URL——直接传递PDF链接，它会转换为markdown文本。少于5000个字符的页面返回完整markdown；更大的页面由LLM进行总结。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |

## `tts` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `text_to_speech` | 将文本转换为语音音频。返回一个 `MEDIA:` 路径，由平台作为语音消息传递。在Telegram上它作为语音气泡播放，在Discord/WhatsApp上作为音频附件。在CLI模式下，保存到 `~/voice-memos/`。语音和提供者… | — |

## `discord` 工具集

注册在 `hermes-discord` 平台工具集（仅限网关）。使用与消息适配器相同的bot令牌。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `discord` | 读取并参与Discord服务器。操作包括 `search_members`、`fetch_messages`、`send_message`、`react`、`fetch_channel`、`list_channels` 等。 | `DISCORD_BOT_TOKEN` |

## `discord_admin` 工具集

在 `hermes-discord` 平台工具集上注册。执行管理操作需要机器人拥有对应的 Discord 权限。

| 工具 | 描述 | 需要环境变量 |
|------|------|-------------|
| `discord_admin` | 通过 REST API 管理 Discord 服务器：列出公会/频道/角色、创建/编辑/删除频道、管理角色授予、超时、踢出和封禁。 | `DISCORD_BOT_TOKEN` + 机器人权限 |

## `spotify` 工具集

由内置 `spotify` 插件注册。需要一个 OAuth 令牌 —— 运行一次 `hermes spotify setup` 进行授权。

| 工具 | 描述 | 需要环境变量 |
|------|------|-------------|
| `spotify_playback` | 控制 Spotify 播放、检查当前播放状态或获取最近播放的曲目。 | Spotify OAuth |
| `spotify_devices` | 列出 Spotify Connect 设备或将播放转移到其他设备。 | Spotify OAuth |
| `spotify_queue` | 检查用户的 Spotify 播放队列或向队列中添加项目。 | Spotify OAuth |
| `spotify_search` | 在 Spotify 目录中搜索曲目、专辑、艺术家、播放列表、节目或单集。 | Spotify OAuth |
| `spotify_playlists` | 列出、检查、创建、更新和修改 Spotify 播放列表。 | Spotify OAuth |
| `spotify_albums` | 获取 Spotify 专辑元数据或专辑曲目。 | Spotify OAuth |
| `spotify_library` | 列出、保存或移除用户保存的 Spotify 曲目或专辑。 | Spotify OAuth |

## `hermes-yuanbao` 工具集

仅在 `hermes-yuanbao` 平台工具集上注册。元宝是腾讯的聊天应用；这些工具驱动其私信/群组/表情包 API。

| 工具 | 描述 | 需要环境变量 |
|------|------|-------------|
| `yb_query_group_info` | 查询一个群组（在应用中称为“派/Pai”）的基本信息：名称、所有者、成员数量。 | 元宝凭据 |
| `yb_query_group_members` | 查询一个群组的成员（用于 `@` 提及、通过名称查找用户、列出机器人）。 | 元宝凭据 |
| `yb_send_dm` | 向群组中的用户发送私信/直接消息，支持可选的媒体文件。 | 元宝凭据 |
| `yb_search_sticker` | 通过关键词搜索内置元宝表情包（TIM 表情）目录。 | 元宝凭据 |
| `yb_send_sticker` | 向当前元宝聊天发送一个内置表情包。 | 元宝凭据 |