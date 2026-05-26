---
sidebar_position: 3
title: "内置工具参考"
description: "Hermes内置工具的权威参考，按工具集分组"
---

# 内置工具参考

本页记录了Hermes的内置工具，按工具集分组。可用性因平台、凭证和启用的工具集而异。

**快速统计（当前注册表）：** 约70个工具 —— 10个浏览器工具（核心）+ 2个CDP门控浏览器工具、4个文件工具、10个RL工具、4个Home Assistant工具、2个终端工具、2个网络工具、5个飞书工具、7个Spotify工具（由捆绑的`spotify`插件注册）、5个元宝工具、7个看板工具（当看板调度器生成智能体时注册）、2个Discord工具，以及一些独立工具（`memory`、`clarify`、`delegate_task`、`execute_code`、`cronjob`、`session_search`、`skill_view`/`skill_manage`/`skills_list`、`text_to_speech`、`image_generate`、`video_generate`、`vision_analyze`、`video_analyze`、`mixture_of_agents`、`send_message`、`todo`、`computer_use`、`process`）。

:::tip MCP工具
除了内置工具，Hermes还可以从MCP服务器动态加载工具。MCP工具以 `mcp_<server>_` 前缀出现（例如，`github` MCP服务器的 `mcp_github_create_issue`）。有关配置，请参见 [MCP集成](/user-guide/features/mcp)。
:::

## `browser` 工具集

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `browser_back` | 浏览器历史记录中返回到上一页。需要首先调用 browser_navigate。 | — |
| `browser_click` | 通过快照中的引用ID（例如 '@e5'）点击元素。引用ID在快照输出的方括号中显示。需要首先调用 browser_navigate 和 browser_snapshot。 | — |
| `browser_console` | 从当前页面获取浏览器控制台输出和JavaScript错误。返回 console.log/warn/error/info 消息以及未捕获的JS异常。用此检测静默JavaScript错误、失败的API调用和应用程序警告。需… | — |
| `browser_get_images` | 获取当前页面上所有图像的列表及其URL和替代文本。对于查找要使用视觉工具分析的图像很有用。需要首先调用 browser_navigate。 | — |
| `browser_navigate` | 在浏览器中导航到URL。初始化会话并加载页面。必须在其他浏览器工具之前调用。对于简单的信息检索，请首选 web_search 或 web_extract（更快、更便宜）。当您需要…时使用浏览器工具。 | — |
| `browser_press` | 按下键盘按键。对于提交表单（Enter）、导航（Tab）或键盘快捷键很有用。需要首先调用 browser_navigate。 | — |
| `browser_scroll` | 向某个方向滚动页面。用此显示当前视口下方或上方可能存在的更多内容。需要首先调用 browser_navigate。 | — |
| `browser_snapshot` | 获取当前页面无障碍树的文本快照。返回带有引用ID（如 @e1、@e2）的交互元素，供 browser_click 和 browser_type 使用。full=false（默认）：仅包含交互元素的紧凑视图。full=true：完… | — |
| `browser_type` | 在由引用ID标识的输入字段中键入文本。首先清空字段，然后键入新文本。需要首先调用 browser_navigate 和 browser_snapshot。 | — |
| `browser_vision` | 对当前页面进行截图并使用视觉AI进行分析。当您需要直观地了解页面上有什么时使用此工具 - 对于验证码、视觉验证挑战、复杂布局或当文本快…特别有用。 | — |

## `browser` 工具集（CDP 门控工具）

这两个工具存在于 `browser` 工具集中，但仅在会话启动时可通过 Chrome 开发者协议端点访问时才注册——可通过 `/browser connect`、`browser.cdp_url` 配置、Browserbase 会话或 Camofox 实现。

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `browser_cdp` | 发送原始的 Chrome 开发者协议命令。作为高级 `browser_*` 工具未涵盖的浏览器操作的应急出口。参见 https://chromedevtools.github.io/devtools-protocol/ | CDP 端点 |
| `browser_dialog` | 响应原生 JavaScript 对话框（alert / confirm / prompt / beforeunload）。请先调用 `browser_snapshot`——挂起的对话框会出现在其 `pending_dialogs` 字段中。然后调用 `browser_dialog(action='accept'\|'dismiss')`。 | CDP 端点 |

## `clarify` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `clarify` | 当你需要澄清、反馈或做出决策才能继续时，向用户提问。支持两种模式：1. **多选** —— 提供最多 4 个选项。用户选择一个或通过第 5 个“其他”选项输入自己的答案。2.… | — |

## `code_execution` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `execute_code` | 运行一个可以以编程方式调用 Hermes 工具的 Python 脚本。当你需要 3 次以上的工具调用且中间有处理逻辑时、需要在大型工具输出进入上下文前进行过滤/减少时、需要条件分支（…时使用此工具。 | — |

## `cronjob` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `cronjob` | 统一的计划任务管理器。使用 `action="create"`, `"list"`, `"update"`, `"pause"`, `"resume"`, `"run"`, 或 `"remove"` 来管理作业。支持带有技能的作业，可以附加一个或多个技能，并且在更新时使用 `skills=[]` 可清除已附加的技能。Cron 作业在全新的会话中运行，没有当前聊天的上下文。 | — |

## `delegation` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `delegate_task` | 生成一个或多个子智能体（subagents），在隔离的上下文中处理任务。每个子智能体有自己的会话、终端会话和工具集。只返回最终的摘要——中间的工具结果不会进入你的上下文窗口。两个… | — |

## `feishu_doc` 工具集

作用于飞书文档评论智能回复处理器（`gateway/platforms/feishu_comment.py`）。不在 `hermes-cli` 或常规飞书聊天适配器上暴露。

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `feishu_doc_read` | 根据文件类型和令牌，读取飞书/Lark 文档（Docx、Doc 或 Sheet）的全部文本内容。 | 飞书应用凭证 |

## `feishu_drive` 工具集

作用于飞书文档评论处理器。驱动云盘文件上的评论读写操作。

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `feishu_drive_add_comment` | 在飞书/Lark 文档或文件上添加顶层评论。 | 飞书应用凭证 |
| `feishu_drive_list_comments` | 列出飞书/Lark 文件上的全文档评论，最新的排在前面。 | 飞书应用凭证 |
| `feishu_drive_list_comment_replies` | 列出特定飞书评论线程（全文档或本地选择）上的回复。 | 飞书应用凭证 |
| `feishu_drive_reply_comment` | 在飞书评论线程上发布回复，可选 `@`提及。 | 飞书应用凭证 |

## `file` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `patch` | 文件中的定向查找与替换编辑。在终端中替代 sed/awk。使用模糊匹配（9 种策略），因此轻微的空白/缩进差异不会影响。返回统一差异。编辑后自动运行语法检查… | — |
| `read_file` | 读取带有行号和分页的文本文件。在终端中替代 cat/head/tail。输出格式：'行号\|内容'。如果文件未找到，会建议类似的文件名。对大文件使用偏移量和限制。注意：无法读取图像或… | — |
| `search_files` | 搜索文件内容或按名称查找文件。在终端中替代 grep/rg/find/ls。由 Ripgrep 支持，比 shell 等效命令更快。内容搜索（target='content'）：在文件内进行正则表达式搜索。输出模式：完整匹配并附带行… | — |
| `write_file` | 将内容写入文件，完全替换现有内容。在终端中替代 echo/cat heredoc。自动创建父目录。会覆盖整个文件——对于定向编辑请使用 `patch`。 | — |

## `homeassistant` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `ha_call_service` | 调用 Home Assistant 服务以控制设备。使用 `ha_list_services` 来发现每个域的可用服务及其参数。 | — |
| `ha_get_state` | 获取单个 Home Assistant 实体的详细状态，包括所有属性（亮度、颜色、温度设定值、传感器读数等）。 | — |
| `ha_list_entities` | 列出 Home Assistant 实体。可选按域（light, switch, climate, sensor, binary_sensor, cover, fan 等）或按区域名称（客厅、厨房、卧室等）过滤。 | — |
| `ha_list_services` | 列出可用于设备控制的 Home Assistant 服务（操作）。显示每种设备类型可以执行哪些操作以及它们接受哪些参数。使用此工具来发现如何控制通过 `ha_list_entities` 找到的设备。 | — |

## `computer_use` 工具集

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `computer_use` | 通过 cua-driver 进行后台 macOS 桌面控制——截屏（SOM / 视觉 / AX）、点击 / 拖动 / 滚动 / 键入 / 按键 / 等待、列出应用、聚焦应用。不会窃取用户的光标或键盘焦点。适用于任何具有工具能力的模型。仅限 macOS。 | 路径 `$PATH` 中需安装 `cua-driver`（通过 `hermes tools` 安装）。 |


:::note
**Honcho 工具** (`honcho_profile`, `honcho_search`, `honcho_context`, `honcho_reasoning`, `honcho_conclude`) 不再是内置的。它们可通过 Honcho 记忆提供器插件在 `plugins/memory/honcho/` 处获取。参见[记忆提供器](../user-guide/features/memory-providers.md)了解安装和用法。
:::

## `image_gen` 工具集

| 工具 | 描述 | 需要环境变量 |
|------|-------------|----------------------|
| `image_generate` | 使用 FAL.ai 根据文本提示生成高质量图像。底层模型由用户配置（默认：FLUX 2 Klein 9B，亚秒级生成），且不可由智能体选择。返回单个图像 URL。使用… 显示它。 | `FAL_KEY` |

## `kanban` 工具集

当智能体被看板调度器生成（设置了 `HERMES_KANBAN_TASK` 环境变量）或在明确启用了 `kanban` 工具集的配置文件中运行时注册。任务范围的工作智能体使用其分配任务的生命周期工具；协调器配置文件则额外获得看板路由工具，如 `kanban_list` 和 `kanban_unblock`。请参阅[看板多智能体](/user-guide/features/kanban)了解完整工作流程。

| 工具 | 描述 | 需要环境变量 |
|------|-------------|----------------------|
| `kanban_show` | 显示分配给此工作智能体的活动看板任务（标题、描述、评论、依赖项）。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_list` | 列出带有过滤条件的看板任务。仅协调器可用；对由调度器生成的任务工作者隐藏。 | 带有 `kanban` 工具集的配置文件 |
| `kanban_complete` | 使用结构化的移交有效载荷（结果、后续事项）将当前任务标记为已完成。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_block` | 因一个问题而阻塞当前任务，等待用户回答——调度器会暂停，展示问题，并在人类回复后恢复。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_heartbeat` | 在长时间运行期间发送进度心跳，让调度器知道工作智能体仍处于活动状态。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_comment` | 在任务线程中添加评论，而不改变其状态——有助于展示中间发现。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_create` | 从当前任务中扇出子任务。由协调器和生成后续任务的工作智能体使用。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_link` | 使用父级 → 子级的依赖边链接任务。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_unblock` | 将阻塞的任务返回至 `ready` 状态。仅协调器可用；对由调度器生成的任务工作者隐藏。 | 带有 `kanban` 工具集的配置文件 |

## `memory` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `memory` | 将重要信息保存到持久内存中，使其在会话间保持。您的内存会在会话开始时出现在系统提示中——这是您在对话之间记住用户和环境信息的方式。适用于... | — |

## `messaging` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `send_message` | 向已连接的即时通讯平台发送消息，或列出可用目标。重要提示：当用户要求发送到特定频道或个人（而非仅仅是平台名称）时，先调用 send_message(action='list') 以查看可用目标... | — |

## `moa` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `mixture_of_agents` | 通过多个前沿LLM协同处理困难问题。进行5次API调用（4个参考模型 + 1个聚合器），并采用最大推理努力——仅用于真正棘手的问题。最适合：复杂数学、高级算法... | OPENROUTER_API_KEY |

## `session_search` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `session_search` | 搜索存储在本地会话数据库中的过往会话，或在单个会话内滚动浏览。基于FTS5的检索；从数据库返回实际消息（不调用LLM）。三种形式：发现（传递 `query`）、滚动（传递 `session_id` + `around_message_id`）、浏览（无参数）。 | — |

## `skills` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `skill_manage` | 管理技能（创建、更新、删除）。技能是您的程序性记忆——用于处理重复任务类型的可重用方法。新技能存放于 ~/.hermes/skills/；现有技能可在其所在位置进行修改。操作：创建（完整的 SKILL.m... | — |
| `skill_view` | 技能允许加载关于特定任务和工作流的信息，以及脚本和模板。加载技能的完整内容或访问其链接文件（参考、模板、脚本）。首次调用返回 SKILL.md 内容，加... | — |
| `skills_list` | 列出可用技能（名称 + 描述）。使用 skill_view(name) 加载完整内容。 | — |

## `terminal` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `process` | 管理使用 terminal(background=true) 启动的后台进程。操作：'list'（显示全部）、'poll'（检查状态 + 新输出）、'log'（完整输出，带分页）、'wait'（阻塞直到完成或超时）、'kill'（终止）、'write'（发... | — |
| `terminal` | 在Linux环境中执行shell命令。文件系统在调用之间保持。设置 `background=true` 以运行长时间服务器。设置 `notify_on_complete=true`（配合 `background=true`）可在进程完成时自动收到通知——无需轮询。请勿使用 cat/head/tail —— 使用 read_file。请勿使用 grep/rg/find —— 使用 search_files。 | — |

## `todo` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `todo` | 管理当前会话的任务列表。用于包含3个以上步骤的复杂任务或用户提供多个任务时。不带参数调用以读取当前列表。写入： - 提供 'todos' 数组以创建/更新项目 - merge=… | — |

## `vision` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `vision_analyze` | 使用AI视觉分析图像。在支持视觉的主模型上，将原始图像像素作为多模态工具结果返回，以便模型在下一轮原生查看。在纯文本主模型上，回退到辅助视觉模型，该模型描述图像并以文本形式返回描述。两种情况下的工具签名相同。 | — |

## `video` 工具集

可选工具集（未在默认 `hermes-cli` 集中加载）。通过 `--toolsets video` 或在 `toolsets:` 配置中包含 `video` 来添加。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `video_analyze` | 分析来自URL或文件路径的视频内容——字幕、场景分解、关键时间戳和视觉描述。 | — |

## `video_gen` 工具集

可选工具集（未在默认 `hermes-cli` 集中加载）。通过 `--toolsets video_gen` 或在 `hermes tools` → 视频生成中启用它，该操作还会引导您选择后端。

后端作为插件位于 `plugins/video_gen/<name>/` 下：

- **xAI Grok-Imagine** — 文本到视频和图像到视频（SuperGrok OAuth 或 `XAI_API_KEY`）。
- **FAL.ai** — Veo 3.1、Pixverse v6、Kling O3（需要 `FAL_KEY`）。

单个 `video_generate` 工具涵盖两种模式——传递 `image_url` 以动画化静态图像，省略则从纯文本生成。活动后端会自动路由到正确的端点。工具的描述在会话开始时重建，以反映活动后端的实际能力（模式、宽高比、分辨率、持续时间范围、最大参考图像数、音频支持）。参见[视频生成提供者插件](/developer-guide/video-gen-provider-plugin)了解后端编写。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `video_generate` | 使用用户配置的视频生成后端，从文本提示生成视频（文本到视频）或使静态图像动起来（图像到视频）。传递 `image_url` 以动画化该图像；省略则从纯文本生成。后端自动路由到正确的端点。在 `video` 字段中返回HTTP URL或绝对文件路径。 | 活动的 `video_gen` 插件 + 其凭证（例如 `XAI_API_KEY`、`FAL_KEY`） |

## `web` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `web_search` | 在网上搜索信息。默认返回最多5个结果，包含标题、URL和描述。接受可选的 `limit`（1-100，默认5）。查询直接传递给配置的后端，因此当后端支持时，诸如 `site:domain`、`filetype:pdf`、`intitle:word`、`-term` 和 `"精确短语"` 等运算符可能有效。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |
| `web_extract` | 从网页URL提取内容。以markdown格式返回页面内容。也适用于PDF URL——直接传递PDF链接，它会转换为markdown文本。小于5000字符的页面返回完整markdown；较大的页面由LLM总结。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |

## `x_search` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `x_search` | 使用xAI内置的 `x_search` Responses 工具搜索X（Twitter）帖子、个人资料和讨论串。用于获取X上当前的讨论、反应或声明，而非一般网页。默认关闭——通过 `hermes tools` → 🐦 X (Twitter) Search 选择加入。仅在配置了xAI凭证时注册模式（check_fn门控）。 | XAI_API_KEY **或** xAI Grok OAuth (SuperGrok / Premium+) 登录 |

## `tts` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `text_to_speech` | 将文本转换为语音音频。返回一个MEDIA:路径，平台将其作为语音消息传递。在Telegram上以语音气泡播放，在Discord/WhatsApp上作为音频附件。在CLI模式下，保存到 ~/voice-memos/。语音和提供者... | — |

## `discord` 工具集

在 `hermes-discord` 平台工具集（仅网关）上注册。使用与消息适配器相同的机器人令牌。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `discord` | 读取并参与Discord服务器。操作包括 `search_members`、`fetch_messages`、`send_message`、`react`、`fetch_channel`、`list_channels` 等。 | `DISCORD_BOT_TOKEN` |

## `discord_admin` 工具集

注册于 `hermes-discord` 平台工具集。管理操作需要机器人拥有对应的 Discord 权限。

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `discord_admin` | 通过 REST API 管理 Discord 服务器：列举公会/频道/角色、创建/编辑/删除频道、管理角色授予、超时、踢出和封禁。 | `DISCORD_BOT_TOKEN` + 机器人权限 |

## `spotify` 工具集

由内置的 `spotify` 插件注册。需要 OAuth 令牌——运行一次 `hermes spotify setup` 进行授权。

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `spotify_playback` | 控制 Spotify 播放、查看当前播放状态或获取最近播放的曲目。 | Spotify OAuth |
| `spotify_devices` | 列举 Spotify Connect 设备或将播放转移到其他设备。 | Spotify OAuth |
| `spotify_queue` | 查看用户的 Spotify 播放队列或向其中添加项目。 | Spotify OAuth |
| `spotify_search` | 在 Spotify 目录中搜索曲目、专辑、艺术家、播放列表、节目或单集。 | Spotify OAuth |
| `spotify_playlists` | 列举、查看、创建、更新和修改 Spotify 播放列表。 | Spotify OAuth |
| `spotify_albums` | 获取 Spotify 专辑元数据或专辑曲目。 | Spotify OAuth |
| `spotify_library` | 列举、保存或移除用户已保存的 Spotify 曲目或专辑。 | Spotify OAuth |

## `hermes-yuanbao` 工具集

仅在 `hermes-yuanbao` 平台工具集注册。元宝是腾讯的聊天应用；这些工具驱动其私信/群组/表情包 API。

| 工具 | 描述 | 所需环境 |
|------|------|----------|
| `yb_query_group_info` | 查询群组（应用内称为"派"）的基本信息：名称、所有者、成员数。 | 元宝凭据 |
| `yb_query_group_members` | 查询群组成员（用于 `@` 提及、按名称查找用户、列举机器人）。 | 元宝凭据 |
| `yb_send_dm` | 在群组中向用户发送私信，可包含可选的媒体文件。 | 元宝凭据 |
| `yb_search_sticker` | 按关键词搜索内置元宝表情包（TIM 脸）目录。 | 元宝凭据 |
| `yb_send_sticker` | 向当前元宝聊天发送内置表情包。 | 元宝凭据 |