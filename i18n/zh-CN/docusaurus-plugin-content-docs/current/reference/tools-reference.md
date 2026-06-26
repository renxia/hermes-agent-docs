---
sidebar_position: 3
title: "Built-in Tools Reference"
description: "Authoritative reference for Hermes built-in tools, grouped by toolset"
---

# 内置工具参考

本页面记录了按工具集分组的 Hermes 内置工具。可用性取决于平台、凭证和启用的工具集。

**快速统计（当前注册表）：** 约 71 个工具 — 10 个浏览器工具（核心）+ 2 个 CDP 受限的浏览器工具，4 个文件工具，4 个家庭助理工具，2 个终端工具，2 个网络工具，5 个 Feishu 工具，7 个 Spotify 工具（由捆绑的 `spotify` 插件注册），5 个 Yuanbao 工具，9 个看板工具（当看板调度器生成智能体时注册），2 个 Discord 工具，以及少数独立的工具（`memory`、`clarify`、`delegate_task`、`execute_code`、`cronjob`、`session_search`、`skill_view`/`skill_manage`/`skills_list`、`text_to_speech`、`image_generate`、`video_generate`、`vision_analyze`、`video_analyze`、`send_message`、`todo`、`computer_use`、`process`）。

:::tip MCP 工具
除了内置工具外，Hermes 还可以从 MCP 服务器动态加载工具。MCP 工具以 `mcp_<server>` 为前缀显示（例如，对于 `github` MCP 服务器的 `mcp_github_create_issue`）。请参阅 [MCP 集成](/user-guide/features/mcp) 以获取配置信息。
:::

## `browser` 工具集

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `browser_back` | 在浏览器历史记录中导航回上一页。必须先调用 `browser_navigate`。 | — |
| `browser_click` | 点击从快照（snapshot）中通过其引用 ID 识别的元素（例如，'@e5'）。引用 ID 显示在快照输出的方括号内。必须先调用 `browser_navigate` 和 `browser_snapshot`。 | — |
| `browser_console` | 获取当前页面的浏览器控制台输出和 JavaScript 错误。返回 console.log/warn/error/info 消息以及未捕获的 JS 异常。可用于检测静默的 JavaScript 错误、失败的 API 调用和应用程序警告。需… | — |
| `browser_get_images` | 获取当前页面所有图片的列表，包括它们的 URL 和替代文本。对于需要使用视觉工具进行分析的图片很有用。必须先调用 `browser_navigate`。 | — |
| `browser_navigate` | 在浏览器中导航到指定 URL。初始化会话并加载页面。必须在其他浏览器工具之前调用。对于简单的信息检索，请优先使用 web_search 或 web_extract（更快、更便宜）。当需要…时，请使用浏览器工具。 | — |
| `browser_press` | 按下一个键盘键。可用于提交表单（Enter）、导航（Tab）或键盘快捷键。必须先调用 `browser_navigate`。 | — |
| `browser_scroll` | 在指定方向上滚动页面。可用于显示可能在当前视口下方或上方的更多内容。必须先调用 `browser_navigate`。 | — |
| `browser_snapshot` | 获取当前页面可访问性树的基于文本的快照。返回带有引用 ID（如 @e1, @e2）的可交互元素，供 `browser_click` 和 `browser_type` 使用。full=false (默认): 包含可交互元素的紧凑视图。full=true: 完整… | — |
| `browser_type` | 将文本输入到通过其引用 ID 识别的输入字段中。首先清除该字段，然后输入新文本。必须先调用 `browser_navigate` 和 `browser_snapshot`。 | — |
| `browser_vision` | 对当前页面进行截图并使用视觉 AI 进行分析。当需要视觉上理解页面上的内容时（特别适用于 CAPTCHA、视觉验证挑战、复杂布局或文本快照…）请使用此工具。 | — |

## browser 工具集 (CDP 限制工具)

这两个工具存在于 `browser` 工具集中，但在会话开始时，只有当可达 Chrome DevTools Protocol 端点时才会注册——通过 `/browser connect`、`browser.cdp_url` 配置、Browserbase 会话或 Camofox。

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `browser_cdp` | 发送原始的 Chrome DevTools Protocol 命令。这是高级别的 `browser_*` 工具未覆盖浏览器操作时的逃生舱口。参见 https://chromedevtools.github.io/devtools-protocol/ | CDP 端点 |
| `browser_dialog` | 响应原生的 JavaScript 对话框（alert / confirm / prompt / beforeunload）。首先调用 `browser_snapshot` — 待定的对话框将出现在其 `pending_dialogs` 字段中。然后调用 `browser_dialog(action='accept'\|'dismiss')`。 | CDP 端点 |

## clarify 工具集

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `clarify` | 当你需要澄清、反馈或在继续进行之前做出决策时，询问用户一个问题。支持两种模式：1. **多项选择** — 提供最多 4 个选项。用户选择其中一个，或者通过第 5 个“其他”选项输入自己的答案。2. … | — |

## code_execution 工具集

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `execute_code` | 运行一个可以以编程方式调用 Hermes 工具的 Python 脚本。当需要 3 个或更多工具调用，并且它们之间有处理逻辑、需要过滤/减少大型工具输出后再进入你的上下文、或者需要条件分支时，请使用此工具（… | — |

## cronjob 工具集

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `cronjob` | 统一的定时任务管理器。使用 `action="create"`、`"list"`、`"update"`、`"pause"`、`"resume"`、`"run"` 或 `"remove"` 来管理任务。支持带有一个或多个附加技能的技能后备任务，在更新时，`skills=[]` 会清除已附加的技能。Cron 运行发生在新的会话中，没有当前聊天上下文。 | — |

## delegation 工具集

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `delegate_task` | 派生一个或多个子智能体（subagents）在隔离的上下文中处理任务。每个子智能体都有自己的对话、终端会话和工具集。只返回最终摘要——中间的工具结果永远不会进入你的上下文窗口。TWO… | — |

## feishu_doc 工具集

限定于 Feishu 文档评论智能回复处理器（`gateway/platforms/feishu_comment.py`）。未在 `hermes-cli` 或常规 Feishu 聊天适配器上暴露。

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `feishu_doc_read` | 根据文件类型和令牌，读取 Feishu/Lark 文档（Docx、Doc 或 Sheet）的完整文本内容。 | Feishu 应用凭证 |

## feishu_drive 工具集

限定于 Feishu 文档评论处理器。驱动对云端文件的评论读写操作。

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `feishu_drive_add_comment` | 在 Feishu/Lark 文档或文件上添加一个顶层评论。 | Feishu 应用凭证 |
| `feishu_drive_list_comments` | 列出 Feishu/Lark 文件的全文档评论，按最新顺序排列。 | Feishu 应用凭证 |
| `feishu_drive_list_comment_replies` | 列出特定 Feishu 评论串（全文档或本地选择）的回复。 | Feishu 应用凭证 |
| `feishu_drive_reply_comment` | 在 Feishu 评论串上发布回复，可包含可选的 `@` 提及。 | Feishu 应用凭证 |

## file 工具集

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `patch` | 对文件进行有针对性的查找和替换编辑。这比在终端中使用 sed/awk 更有效。使用模糊匹配（9 种策略），因此轻微的空白/缩进差异不会导致失败。返回一个统一 diff。编辑后自动运行语法检查… | — |
| `read_file` | 读取带有行号和分页的文本文件。这比在终端中使用 cat/head/tail 更有效。输出格式：'LINE_NUM\|CONTENT'。如果未找到，会建议相似的文件名。对于大文件，请使用偏移量（offset）和限制（limit）。注意：无法读取图像… | — |
| `search_files` | 搜索文件内容或按名称查找文件。这比在终端中使用 grep/rg/find/ls 更有效。Ripgrep 后备，比 shell 等效工具更快。内容搜索 (target='content')：文件内部的正则表达式搜索。输出模式：带有行号的完整匹配… | — |
| `write_file` | 将内容写入文件，完全替换现有内容。这比在终端中使用 echo/cat heredoc 更有效。会自动创建父目录。会覆盖整个文件——对于有针对性的编辑，请使用 'patch'。 | — |

## homeassistant 工具集

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `ha_call_service` | 调用 Home Assistant 服务来控制设备。使用 ha_list_services 来发现可用服务及其每个域的参数。 | — |
| `ha_get_state` | 获取单个 Home Assistant 实体的详细状态，包括所有属性（亮度、颜色、温度设定点、传感器读数等）。 | — |
| `ha_list_entities` | 列出 Home Assistant 实体。可以选择按域（light, switch, climate, sensor, binary_sensor, cover, fan 等）或按区域名称（living room, kitchen, bedroom 等）进行过滤。 | — |
| `ha_list_services` | 列出可用于设备控制的 Home Assistant 服务（动作）。显示了对每种设备类型可以执行哪些操作以及它们接受哪些参数。使用此工具来发现如何控制通过 ha_list_entities 找到的设备。 | — |

## computer_use 工具集

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `computer_use` | 通过 cua-driver 进行背景 macOS 桌面控制——截图 (SOM / vision / AX)、点击/拖动/滚动/输入/按键/等待、list_apps, focus_app。不会窃取用户的光标或键盘焦点。与任何具有工具能力的模型配合使用。仅限 macOS。 | `$PATH` 上的 `cua-driver`（通过 `hermes tools` 安装）。 |


:::note
**Honcho 工具** (`honcho_profile`, `honcho_search`, `honcho_context`, `honcho_reasoning`, `honcho_conclude`) 已不再内置。它们可通过 Honcho 内存提供者插件在 `plugins/memory/honcho/` 获取。请参阅 [Memory Providers](../user-guide/features/memory-providers.md) 以了解安装和使用方法。
:::

## image_gen 工具集

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `image_generate` | 从文本提示生成图像（text-to-image），或通过用户配置的后端（FAL.ai, OpenAI, xAI, Krea）编辑/转换现有图像（image-to-image）。要编辑图像，请传递 `image_url`；要进行风格参考，请传递 `reference_image_urls`；对于 text-to-image，则两者都省略。该模型由用户配置，智能体无法选择。返回单个图像 URL 或本地路径。 | FAL_KEY / OPENAI_API_KEY / xAI OAuth / KREA_API_KEY |

## kanban 工具集

当智能体被 (a) kanban 分派器（`HERMES_KANBAN_TASK` 环境变量设置）生成，或 (b) 在显式启用 `kanban` 工具集的配置文件中运行时，此工具集才会注册。任务范围的工人使用生命周期工具来完成分配的任务；编排者（orchestrator）配置文件还获得了 `kanban_list` 和 `kanban_unblock` 等看板路由工具。有关完整工作流程，请参阅 [Kanban Multi-Agent](/user-guide/features/kanban)。

| 工具 | 描述 | 所需环境 |
|------|-------------|----------------------|
| `kanban_show` | 显示分配给该工人的活动看板任务（标题、描述、评论、依赖项）。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_list` | 列出带有过滤条件的看板任务。仅限编排者；对由分派器生成的任务工人隐藏。 | 具有 `kanban` 工具集的配置文件 |
| `kanban_complete` | 使用结构化的移交负载（结果、工件、后续事项）标记当前任务已完成。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_block` | 针对一个问题阻塞当前任务，等待用户回答——分派器暂停，显示该问题，并在有人回复后恢复。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_heartbeat` | 在长时间运行的操作中发送进度心跳（heartbeat），以便分派器知道工人仍然存活。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_comment` | 向任务串添加评论，而不改变其状态——这对于展示中间发现非常有用。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_create` | 从当前任务分出子任务（Fan out）。由编排者和后续生成任务的工人使用。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_link` | 以父→子依赖关系链接任务。 | `HERMES_KANBAN_TASK` 或 `kanban` 工具集 |
| `kanban_unblock` | 将被阻塞的任务返回到“ready”（就绪）状态。仅限编排者；对由分派器生成的任务工人隐藏。 | 具有 `kanban` 工具集的配置文件 |

## `memory` 工具集

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `memory` | 将重要信息保存到持久性内存中，该内存可以跨会话保留。您的记忆会在会话开始时出现在系统提示中——它决定了您如何在对话之间记住用户和环境的细节。何时使用... | — |

## `messaging` 工具集

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `send_message` | 向已连接的消息平台发送消息，或列出可用的目标。重要提示：当用户要求发送到特定的频道或人员（而不仅仅是裸平台的名称）时，请首先调用 send_message(action='list') 以查看可用目标... | — |

## `session_search` 工具集

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `session_search` | 搜索存储在本地会话数据库中的历史会话，或在单个会话内部滚动查找。基于 FTS5 的检索；返回来自数据库的实际消息（不调用 LLM）。有三种模式：发现（传入 `query`），滚动（传入 `session_id` + `around_message_id`），浏览（无参数）。 | — |

## `skills` 工具集

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `skill_manage` | 管理技能（创建、更新、删除）。技能是您的程序化记忆——用于重复任务类型的可重用方法。新技能应放在 ~/.hermes/skills/；现有技能可以修改它们所在的位置。操作：创建（完整的 SKILL.m... | — |
| `skill_view` | 技能允许加载有关特定任务和工作流程的信息，以及脚本和模板。加载技能的完整内容或访问其链接文件（引用、模板、脚本）。第一次调用会返回 SKILL.md 内容及一个... | — |
| `skills_list` | 列出可用技能（名称 + 描述）。使用 skill_view(name) 来加载完整内容。 | — |

## `terminal` 工具集

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `process` | 管理通过 terminal(background=true)启动的后台进程。操作包括：'list'（显示所有）、'poll'（检查状态 + 新输出）、'log'（带分页的完整输出）、'wait'（阻塞直到完成或超时）、'kill'（终止）、'write'（发送... | — |
| `terminal` | 在 Linux 环境上执行 shell 命令。文件系统在调用之间保持持久性。对于长时间运行的服务，请设置 background=true。设置 notify_on_complete=true（与 background=true 一起使用），以便在进程完成时收到自动通知——无需轮询。不要使用 cat/head/tail — 请使用 read_file。不要使用 grep/rg/find — 请使用 search_files。 | — |

## `todo` 工具集

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `todo` | 管理当前会话的任务列表。适用于具有 3 个以上步骤的复杂任务，或当用户提供多个任务时。调用时不带任何参数即可读取当前列表。写入操作：- 提供 'todos' 数组来创建/更新项目 - merge=... | — |

## `vision` 工具集

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `vision_analyze` | 使用 AI 视觉分析图像。对于具备视觉能力的主模型，它会以多模态工具结果的形式返回原始图像像素，从而使模型在其下一个回合中原生看到它们。对于仅文本的主模型，则回退到描述图像的辅助视觉模型，并以文本形式返回该描述。无论哪种方式，工具签名都是相同的。 | — |

## `video` 工具集

可选工具集（未在默认的 `hermes-cli` 套件中加载）。通过 `--toolsets video` 添加或在 `toolsets:` 配置中包含 `video`。

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `video_analyze` | 分析来自 URL 或文件路径的视频内容——包括字幕、场景分解、关键时间戳和视觉描述。 | — |

## `video_gen` 工具集

可选工具集（未在默认的 `hermes-cli` 套件中加载）。通过 `--toolsets video_gen` 添加，或在 `hermes tools` → 视频生成中启用它，这也会引导您选择一个后端。

后端以插件的形式提供于 `plugins/video_gen/<name>/`:

- **xAI Grok-Imagine** — 文生视频和图生视频（SuperGrok OAuth 或 `XAI_API_KEY`）。
- **FAL.ai** — Veo 3.1, Pixverse v6, Kling O3（需要 `FAL_KEY`）。

单一的 `video_generate` 工具涵盖这两种模态——传入 `image_url` 可对静态图像进行动画处理；省略它则可从文本单独生成。后端会自动路由到正确的端点。工具描述会在会话开始时重建，以反映活动后端实际的能力（模态、宽高比、分辨率、持续时间范围、最大参考图片、音频支持）。有关后端编写，请参阅 [Video Generation Provider Plugins](/developer-guide/video-gen-provider-plugin)。

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `video_generate` | 使用用户配置的视频生成后端，从文本提示（文生视频）或对静态图像进行动画处理（图生视频）来生成视频。传入 `image_url` 可对该图像进行动画处理；省略它则可从文本单独生成。后端会自动路由到正确的端点。返回一个 HTTP URL 或在 `video` 字段中的绝对文件路径。 | 激活的 `video_gen` 插件及其凭证（例如 `XAI_API_KEY`, `FAL_KEY`） |

## `web` 工具集

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `web_search` | 搜索网络信息。默认返回最多 5 个结果，包括标题、URL 和描述。接受可选的 `limit`（1-100，默认 5）。查询会传递给配置的后端，因此诸如 `site:domain`、`filetype:pdf`、`intitle:word`、`-term` 和 `"exact phrase"` 等操作符在后端支持时可能有效。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |
| `web_extract` | 从网页 URL 提取内容。返回 markdown 格式的页面内容。也适用于 PDF URL——直接传入 PDF 链接，它就会转换为 markdown 文本。少于 5000 个字符的页面返回完整 markdown；较大的页面会被 LLM 总结。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |

## `x_search` 工具集

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `x_search` | 使用 xAI 内置的 `x_search` Responses 工具搜索 X（Twitter）帖子、个人资料和话题。这适用于 X 上的当前讨论、反应或声明，而非一般网页。默认禁用——可通过 `hermes tools` → 🐦 X (Twitter) Search 进行选择启用。该模式仅在配置了 xAI 凭证时注册（check_fn-gated）。 | XAI_API_KEY **或** xAI Grok OAuth (SuperGrok / Premium+) 登录 |

## `tts` 工具集

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `text_to_speech` | 将文本转换为语音音频。返回一个平台作为语音消息交付的 MEDIA: 路径。在 Telegram 上，它以语音气泡的形式播放；在 Discord/WhatsApp 上，它是一个音频附件。在 CLI 模式下，保存到 ~/voice-memos/。语音和提供商... | — |

## `discord` 工具集

注册于 `hermes-discord` 平台工具集（仅网关）。使用与消息适配器相同的机器人令牌。

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `discord` | 读取和参与 Discord 服务器。操作包括 `search_members`、`fetch_messages`、`send_message`、`react`、`fetch_channel`、`list_channels` 等。 | `DISCORD_BOT_TOKEN` |

## `discord_admin` 工具集

注册于 `hermes-discord` 平台工具集。管理操作要求机器人拥有相应的 Discord 权限。

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `discord_admin` | 通过 REST API 管理 Discord 服务器：列出公会/频道/角色，创建/编辑/删除频道，管理角色授予、超时、踢人和封禁。 | `DISCORD_BOT_TOKEN` + 机器人权限 |

## `spotify` 工具集

由捆绑的 `spotify` 插件注册。需要 OAuth 令牌——运行一次 `hermes spotify setup` 进行授权。

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `spotify_playback` | 控制 Spotify 播放，检查当前的播放状态或获取最近播放的曲目。 | Spotify OAuth |
| `spotify_devices` | 列出 Spotify Connect 设备或将播放转移到不同的设备上。 | Spotify OAuth |
| `spotify_queue` | 检查用户的 Spotify 队列或向其中添加项目。 | Spotify OAuth |
| `spotify_search` | 在 Spotify 目录中搜索曲目、专辑、艺术家、播放列表、节目或剧集。 | Spotify OAuth |
| `spotify_playlists` | 列出、检查、创建、更新和修改 Spotify 播放列表。 | Spotify OAuth |
| `spotify_albums` | 获取 Spotify 专辑元数据或专辑曲目。 | Spotify OAuth |
| `spotify_library` | 列出、保存或移除用户已保存的 Spotify 曲目或专辑。 | Spotify OAuth |

## `hermes-yuanbao` 工具集

仅注册于 `hermes-yuanbao` 平台工具集。Yuanbao 是腾讯的聊天应用；这些工具驱动其 DM/群组/贴纸 API。

| Tool | Description | Requires environment |
|------|-------------|----------------------|
| `yb_query_group_info` | 查询关于一个群组（在应用中称为“派/Pai”）的基本信息：名称、所有者、成员数量。 | Yuanbao 凭证 |
| `yb_query_group_members` | 查询群组成员（用于@提及、按名称查找用户、列出机器人）。 | Yuanbao 凭证 |
| `yb_send_dm` | 向群组中的用户发送私信/直接消息，可附带可选的媒体文件。 | Yuanbao 凭证 |
| `yb_search_sticker` | 按关键词搜索内置的 Yuanbao 贴纸（TIM face）目录。 | Yuanbao 凭证 |
| `yb_send_sticker` | 向当前的 Yuanbao 聊天发送一个内置贴纸。 | Yuanbao 凭证 |