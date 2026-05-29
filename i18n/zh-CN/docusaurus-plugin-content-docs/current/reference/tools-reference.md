---
sidebar_position: 3
title: "内置工具参考"
description: "Hermes 内置工具的权威参考，按工具集分组"
---

# 内置工具参考

本页记录了 Hermes 的内置工具，按工具集分组。可用性因平台、凭据和启用的工具集而异。

**快速统计（当前注册表）：** 约64个工具 — 10个浏览器工具（核心）+ 2个 CDP 门控浏览器工具，4个文件工具，4个 Home Assistant 工具，2个终端工具，2个网络工具，5个飞书工具，7个 Spotify 工具（由捆绑的 `spotify` 插件注册），5个元宝工具，9个看板工具（当看板调度器启动智能体时注册），2个 Discord 工具，以及少量独立工具（`memory`、`clarify`、`delegate_task`、`execute_code`、`cronjob`、`session_search`、`skill_view`/`skill_manage`/`skills_list`、`text_to_speech`、`image_generate`、`video_generate`、`vision_analyze`、`video_analyze`、`mixture_of_agents`、`send_message`、`todo`、`computer_use`、`process`）。

:::tip MCP 工具
除了内置工具，Hermes 还可以动态地从 MCP 服务器加载工具。MCP 工具以前缀 `mcp_<server>_` 显示（例如，用于 `github` MCP 服务器的 `mcp_github_create_issue`）。有关配置，请参见 [MCP 集成](/user-guide/features/mcp)。
:::

## `browser` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `browser_back` | 浏览器历史记录中后退到上一个页面。需要先调用 `browser_navigate`。 | — |
| `browser_click` | 单击快照中通过其引用 ID 标识的元素（例如 '@e5'）。引用 ID 显示在快照输出的方括号中。需要先调用 `browser_navigate` 和 `browser_snapshot`。 | — |
| `browser_console` | 获取当前页面的浏览器控制台输出和 JavaScript 错误。返回 console.log/warn/error/info 消息和未捕获的 JS 异常。使用此工具检测静默的 JavaScript 错误、失败的 API 调用和应用程序警告。需要先调用 `browser_navigate`。 | — |
| `browser_get_images` | 获取当前页面所有图片的列表，包括其 URL 和替代文本。对于查找要用视觉工具分析的图片很有用。需要先调用 `browser_navigate`。 | — |
| `browser_navigate` | 导航到浏览器中的一个 URL。初始化会话并加载页面。必须在使用其他浏览器工具之前调用。对于简单的信息检索，首选 `web_search` 或 `web_extract`（更快、更便宜）。当您需要浏览器交互时使用浏览器工具。 | — |
| `browser_press` | 按下一个键盘键。对于提交表单（Enter）、导航（Tab）或键盘快捷键很有用。需要先调用 `browser_navigate`。 | — |
| `browser_scroll` | 在指定方向滚动页面。使用此工具显示当前视口下方或上方可能存在的更多内容。需要先调用 `browser_navigate`。 | — |
| `browser_snapshot` | 获取当前页面可访问性树的基于文本的快照。返回带有引用 ID（如 @e1, @e2）的交互元素，供 `browser_click` 和 `browser_type` 使用。`full=false`（默认）：仅显示交互元素的紧凑视图。`full=true`：完整快照。需要先调用 `browser_navigate`。 | — |
| `browser_type` | 在通过引用 ID 标识的输入字段中键入文本。先清空字段，然后键入新文本。需要先调用 `browser_navigate` 和 `browser_snapshot`。 | — |
| `browser_vision` | 对当前页面进行截图并使用视觉 AI 进行分析。当您需要视觉理解页面内容时使用此工具——特别适用于 CAPTCHA、视觉验证挑战、复杂布局或当文本快照不充分时。需要先调用 `browser_navigate`。 | — |

## `browser` 工具集（受 CDP 门控的工具）

这两个工具位于 `browser` 工具集中，但仅在会话开始时可通过 Chrome DevTools Protocol 端点连接时注册——通过 `/browser connect`、`browser.cdp_url` 配置、Browserbase 会话或 Camofox。

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `browser_cdp` | 发送原始的 Chrome DevTools Protocol 命令。作为处理未涵盖在更高级 `browser_*` 工具中的浏览器操作的后备方案。详见 https://chromedevtools.github.io/devtools-protocol/ | CDP 端点 |
| `browser_dialog` | 响应原生 JavaScript 对话框（alert / confirm / prompt / beforeunload）。请先调用 `browser_snapshot`——待处理的对话框会出现在其 `pending_dialogs` 字段中。然后调用 `browser_dialog(action='accept'\|'dismiss')`。 | CDP 端点 |

## `clarify` 工具集

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `clarify` | 当您需要澄清、反馈或在继续之前做出决定时，向用户提问。支持两种模式：1. **多选** — 提供最多 4 个选项。用户选择一个，或通过第 5 个“其他”选项输入自己的答案。2.… | — |

## `code_execution` 工具集

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `execute_code` | 运行一个可以以编程方式调用 Hermes 工具的 Python 脚本。当您需要 3 次以上的工具调用并在它们之间进行处理逻辑、需要在工具输出进入上下文之前过滤/减少大型输出、需要条件分支（… | — |

## `cronjob` 工具集

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `cronjob` | 统一的定时任务管理器。使用 `action="create"`、`"list"`、`"update"`、`"pause"`、`"resume"`、`"run"` 或 `"remove"` 来管理任务。支持带有技能支持的任务，可附加一个或多个技能，并且在更新时使用 `skills=[]` 可清除附加的技能。Cron 任务在没有当前对话上下文的新会话中运行。 | — |

## `delegation` 工具集

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `delegate_task` | 生成一个或多个子智能体，在隔离的上下文中处理任务。每个子智能体拥有自己的对话、终端会话和工具集。仅返回最终摘要——中间工具结果不会进入您的上下文窗口。两个… | — |

## `feishu_doc` 工具集

限定于飞书文档评论智能回复处理器 (`gateway/platforms/feishu_comment.py`)。未在 `hermes-cli` 或常规飞书聊天适配器上公开。

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `feishu_doc_read` | 根据文件类型和 token 读取飞书/Lark 文档（Docx、Doc 或 Sheet）的完整文本内容。 | 飞书应用凭证 |

## `feishu_drive` 工具集

限定于飞书文档评论处理器。驱动云盘文件的评论读写操作。

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `feishu_drive_add_comment` | 在飞书/Lark 文档或文件上添加顶层评论。 | 飞书应用凭证 |
| `feishu_drive_list_comments` | 列出飞书/Lark 文件上的整篇文档评论，最新的排在前面。 | 飞书应用凭证 |
| `feishu_drive_list_comment_replies` | 列出特定飞书评论线程（整篇文档或局部选择）上的回复。 | 飞书应用凭证 |
| `feishu_drive_reply_comment` | 在飞书评论线程上发布回复，可选择 @提及某人。 | 飞书应用凭证 |

## `file` 工具集

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `patch` | 在文件中进行有针对性的查找和替换编辑。使用此工具代替在终端中使用 sed/awk。采用模糊匹配（9 种策略），因此细微的空白/缩进差异不会影响其工作。返回统一的 diff。编辑后会自动运行语法检查… | — |
| `read_file` | 读取带行号和分页的文本文件。使用此工具代替在终端中使用 cat/head/tail。输出格式：'行号\|内容'。如果未找到，会建议类似的文件名。对大文件可使用 offset 和 limit。注意：无法读取图片或… | — |
| `search_files` | 按内容搜索文件或按名称查找文件。使用此工具代替在终端中使用 grep/rg/find/ls。基于 Ripgrep，比 shell 等效工具更快。内容搜索（target='content'）：在文件内部进行正则表达式搜索。输出模式：带行… | — |
| `write_file` | 将内容写入文件，完全替换现有内容。使用此工具代替在终端中使用 echo/cat heredoc。自动创建父目录。会覆盖整个文件——若需针对性编辑，请使用 'patch'。 | — |

## `homeassistant` 工具集

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `ha_call_service` | 调用 Home Assistant 服务以控制设备。使用 ha_list_services 来发现每个域可用的服务及其参数。 | — |
| `ha_get_state` | 获取单个 Home Assistant 实体的详细状态，包括所有属性（亮度、颜色、温度设定值、传感器读数等）。 | — |
| `ha_list_entities` | 列出 Home Assistant 实体。可选择按域（灯、开关、恒温器、传感器、二元传感器、窗帘、风扇等）或按区域名称（客厅、厨房、卧室等）进行过滤。 | — |
| `ha_list_services` | 列出可用于设备控制的 Home Assistant 服务（操作）。显示每种设备类型可以执行哪些操作以及它们接受什么参数。使用此工具来发现如何控制通过 ha_list_entities 找到的设备。 | — |

## `computer_use` 工具集

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `computer_use` | 通过 cua-driver 实现的后台 macOS 桌面控制——截图（SOM / 视觉 / AX）、点击/拖动/滚动/输入/按键/等待、list_apps、focus_app。不会占用用户的光标或键盘焦点。适用于任何具备工具调用能力的模型。仅限 macOS。 | `cua-driver` 在 `$PATH` 上（通过 `hermes tools` 安装）。 |


:::note
**Honcho 工具**（`honcho_profile`、`honcho_search`、`honcho_context`、`honcho_reasoning`、`honcho_conclude`）不再内置。它们可通过 Honcho 记忆提供者插件在 `plugins/memory/honcho/` 获取。安装和使用说明请参阅 [记忆提供者](../user-guide/features/memory-providers.md)。
:::

## `image_gen` 工具集

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `image_generate` | 使用 FAL.ai 根据文本提示生成高质量图像。底层模型由用户配置（默认：FLUX 2 Klein 9B，亚秒级生成），智能体无法选择。返回单个图像 URL。请使用…显示。 | FAL_KEY |

## `kanban` 工具集

当智能体（a）由看板调度器生成（设置 `HERMES_KANBAN_TASK` 环境变量）或（b）在明确启用 `kanban` 工具集的配置中运行时注册。任务作用域的工作者使用其分配任务的生命周期工具；编排器配置文件还会获得看板路由工具，如 `kanban_list` 和 `kanban_unblock`。完整工作流请参见[看板多智能体](/user-guide/features/kanban)。

| 工具 | 描述 | 环境要求 |
|------|-------------|----------------------|
| `kanban_show` | 显示分配给此工作者的活动看板任务（标题、描述、评论、依赖项）。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_list` | 使用过滤器列出看板任务。仅限编排器；对调度器生成的任务工作者隐藏。 | 启用 `kanban` 工具集的配置 |
| `kanban_complete` | 使用结构化的交接负载（结果、工件、后续任务）将当前任务标记为已完成。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_block` | 因用户问题而阻止当前任务——调度器暂停、显示问题，并在人工回复后恢复。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_heartbeat` | 在长时间运行的操作期间发送进度心跳，以便调度器知道工作者仍然存活。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_comment` | 在任务线程中添加评论而不改变其状态——有助于呈现中间发现。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_create` | 从当前任务分派子任务。由编排器和生成后续任务的工作者使用。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_link` | 使用父 → 子依赖边链接任务。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_unblock` | 将被阻止的任务返回至 `ready` 状态。仅限编排器；对调度器生成的任务工作者隐藏。 | 启用 `kanban` 工具集的配置 |

## `memory` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `memory` | 将重要信息保存到持久内存中，该信息在会话之间保留。您的内存在会话开始时出现在系统提示中——这是您在对话之间记住关于用户和环境信息的方式。何时使用... | — |

## `messaging` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `send_message` | 向连接的消息平台发送消息，或列出可用目标。重要提示：当用户要求发送到特定频道或个人（而不仅仅是平台名称）时，请先调用 `send_message(action='list')` 以查看可用目标... | — |

## `moa` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `mixture_of_agents` | 通过多个前沿大型语言模型协作路由困难问题。进行5次API调用（4个参考模型+1个聚合器），最大推理努力——请谨慎使用，仅用于真正困难的问题。最适用于：复杂数学、高级算法... | OPENROUTER_API_KEY |

## `session_search` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `session_search` | 搜索存储在本地会话数据库中的过去会话，或在一个会话内滚动。FTS5支持的检索；返回数据库中的实际消息（无LLM调用）。三种形式：发现（传递 `query`）、滚动（传递 `session_id` + `around_message_id`）、浏览（无参数）。 | — |

## `skills` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `skill_manage` | 管理技能（创建、更新、删除）。技能是您的程序性记忆——用于重复任务类型的可重用方法。新技能保存到 ~/.hermes/skills/；现有技能可以在其所在位置进行修改。操作：创建（完整SKILL.m... | — |
| `skill_view` | 技能允许加载有关特定任务和工作流的信息，以及脚本和模板。加载技能的完整内容或访问其链接文件（引用、模板、脚本）。首次调用返回SKILL.md内容以及... | — |
| `skills_list` | 列出可用技能（名称+描述）。使用 `skill_view(name)` 加载完整内容。 | — |

## `terminal` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `process` | 管理使用 `terminal(background=true)` 启动的后台进程。操作：'list'（显示全部）、'poll'（检查状态+新输出）、'log'（完整输出带分页）、'wait'（阻塞直到完成或超时）、'kill'（终止）、'write'（发送... | — |
| `terminal` | 在Linux环境中执行shell命令。文件系统在调用之间持续存在。对于长时间运行的服务器，设置 `background=true`。设置 `notify_on_complete=true`（配合 `background=true`）可在进程完成时自动获得通知——无需轮询。不要使用 cat/head/tail——使用 `read_file`。不要使用 grep/rg/find——使用 `search_files`。 | — |

## `todo` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `todo` | 管理当前会话的任务列表。用于包含3个以上步骤的复杂任务，或当用户提供多个任务时。不带参数调用以读取当前列表。写入：- 提供 'todos' 数组以创建/更新项目 - merge=... | — |

## `vision` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `vision_analyze` | 使用AI视觉分析图像。在支持视觉的主模型上，将原始图像像素作为多模态工具结果返回，以便模型在其下一次轮次原生地看到它们。在纯文本主模型上，回退到辅助视觉模型，该模型描述图像并将描述作为文本返回。无论哪种方式，工具签名都是相同的。 | — |

## `video` 工具集

可选工具集（未在默认的 `hermes-cli` 集中加载）。通过 `--toolsets video` 添加或在 `toolsets:` 配置中包含 `video`。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `video_analyze` | 从URL或文件路径分析视频内容——字幕、场景分解、关键时间戳和视觉描述。 | — |

## `video_gen` 工具集

可选工具集（未在默认的 `hermes-cli` 集中加载）。通过 `--toolsets video_gen` 添加或在 `hermes tools` → 视频生成中启用，该处还会引导您选择后端。

后端作为插件在 `plugins/video_gen/<name>/` 下提供：

- **xAI Grok-Imagine** — 文本到视频和图像到视频（SuperGrok OAuth 或 `XAI_API_KEY`）。
- **FAL.ai** — Veo 3.1、Pixverse v6、Kling O3（需要 `FAL_KEY`）。

单个 `video_generate` 工具涵盖两种模态——传递 `image_url` 以动画化静态图像，省略它则仅从文本生成。活动的后端会自动路由到正确的端点。工具的描述在会话开始时重建，以反映活动后端的实际能力（模态、宽高比、分辨率、持续时间范围、最大参考图像数、音频支持）。请参阅[视频生成提供商插件](/developer-guide/video-gen-provider-plugin)了解后端编写。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `video_generate` | 使用用户配置的视频生成后端，根据文本提示生成视频（文本到视频）或动画化静态图像（图像到视频）。传递 `image_url` 以动画化该图像；省略它则仅从文本生成。后端会自动路由到正确的端点。在 `video` 字段中返回HTTP URL或绝对文件路径。 | 活动的 `video_gen` 插件及其凭证（例如 `XAI_API_KEY`、`FAL_KEY`） |

## `web` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `web_search` | 在网络上搜索信息。默认返回最多5个结果，包含标题、URL和描述。接受可选的 `limit`（1-100，默认5）。查询直接传递给配置的后端，因此诸如 `site:domain`、`filetype:pdf`、`intitle:word`、`-term` 和 `"exact phrase"` 之类的运算符在后端支持时可能会起作用。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |
| `web_extract` | 从网页URL中提取内容。以markdown格式返回页面内容。也适用于PDF URL——直接传递PDF链接，它会转换为markdown文本。少于5000个字符的页面返回完整的markdown；较大的页面由LLM进行总结。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |

## `x_search` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `x_search` | 使用xAI内置的 `x_search` Responses 工具搜索X（Twitter）帖子、个人资料和主题。使用此工具获取X上的当前讨论、反应或声明，而不是一般的网页。默认关闭——通过 `hermes tools` → 🐦 X（Twitter）搜索选择加入。模式仅在配置了xAI凭证时注册（check_fn门控）。 | XAI_API_KEY **或** xAI Grok OAuth（SuperGrok / Premium+）登录 |

## `tts` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `text_to_speech` | 将文本转换为语音音频。返回一个MEDIA：路径，平台将其作为语音消息传递。在Telegram上，它作为语音气泡播放；在Discord/WhatsApp上作为音频附件。在CLI模式下，保存到 ~/voice-memos/。语音和提供商... | — |

## `discord` 工具集

在 `hermes-discord` 平台工具集上注册（仅限网关）。使用与消息适配器相同的机器人令牌。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `discord` | 读取并参与Discord服务器。操作包括 `search_members`、`fetch_messages`、`send_message`、`react`、`fetch_channel`、`list_channels` 等。 | `DISCORD_BOT_TOKEN` |

## `discord_admin` 工具集

在 `hermes-discord` 平台工具集上注册。执行管理操作需要机器人拥有对应的 Discord 权限。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `discord_admin` | 通过 REST API 管理 Discord 服务器：列出公会/频道/角色、创建/编辑/删除频道、管理角色授权、超时、踢出和封禁。 | `DISCORD_BOT_TOKEN` + 机器人权限 |

## `spotify` 工具集

由内置 `spotify` 插件注册。需要 OAuth 令牌——请先运行 `hermes spotify setup` 进行授权。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `spotify_playback` | 控制 Spotify 播放、检查活动播放状态或获取最近播放的曲目。 | Spotify OAuth 认证 |
| `spotify_devices` | 列出 Spotify Connect 设备或将播放转移到其他设备。 | Spotify OAuth 认证 |
| `spotify_queue` | 检查用户的 Spotify 队列或向队列中添加项目。 | Spotify OAuth 认证 |
| `spotify_search` | 在 Spotify 目录中搜索曲目、专辑、艺术家、播放列表、节目或单集。 | Spotify OAuth 认证 |
| `spotify_playlists` | 列出、检查、创建、更新和修改 Spotify 播放列表。 | Spotify OAuth 认证 |
| `spotify_albums` | 获取 Spotify 专辑元数据或专辑曲目。 | Spotify OAuth 认证 |
| `spotify_library` | 列出、保存或移除用户保存的 Spotify 曲目或专辑。 | Spotify OAuth 认证 |

## `hermes-yuanbao` 工具集

仅在 `hermes-yuanbao` 平台工具集上注册。元宝是腾讯的聊天应用；这些工具驱动其私信/群组/表情包 API。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `yb_query_group_info` | 查询群组（在应用中称为“派”）的基本信息：名称、群主、成员数量。 | 元宝凭据 |
| `yb_query_group_members` | 查询群组成员（用于 `@` 提及、按名称查找用户、列出机器人）。 | 元宝凭据 |
| `yb_send_dm` | 在群组中向用户发送私信/直接消息，可附带媒体文件。 | 元宝凭据 |
| `yb_search_sticker` | 按关键词搜索内置的元宝表情包（TIM 表情）目录。 | 元宝凭据 |
| `yb_send_sticker` | 向当前元宝聊天发送内置表情包。 | 元宝凭据 |