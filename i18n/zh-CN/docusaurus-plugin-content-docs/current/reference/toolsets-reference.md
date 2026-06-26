---
sidebar_position: 4
title: "Toolsets Reference"
description: "Reference for Hermes core, composite, platform, and dynamic toolsets"
---

# 工具集参考 (Toolsets Reference)

工具集是控制智能体可以做什么的工具命名捆绑包。它们是配置每个平台、每次会话或每项任务中工具可用性的主要机制。

## 工作原理 (How Toolsets Work)

每个工具都属于一个特定的工具集。当你启用一个工具集时，该捆绑包中的所有工具都会对智能体开放。工具集有三种类型：

- **核心 (Core)** — 一组相关的逻辑工具（例如，`file` 包含 `read_file`、`write_file`、`patch`、`search_files`）。
- **复合型 (Composite)** — 将多个核心工具集组合起来以应对某一常见场景（例如，`debugging` 捆绑了文件、终端和网络工具）。
- **平台型 (Platform)** — 针对特定部署环境的完整工具配置（例如，`hermes-cli` 是交互式 CLI 会话的默认设置）。

## 配置工具集 (Configuring Toolsets)

### 按会话配置 (Per-session (CLI))

```bash
hermes chat --toolsets web,file,terminal
hermes chat --toolsets debugging        # 复合型 — 扩展为 file + terminal + web
hermes chat --toolsets all              # 所有工具
```

### 按平台配置 (Per-platform (config.yaml))

```yaml
toolsets:
  - hermes-cli          # CLI 的默认设置
  # - hermes-telegram   # Telegram 网关的覆盖设置
```

### 交互式管理 (Interactive management)

```bash
hermes tools                            # 用于启用/禁用特定平台的 curses UI
```

或者在会话中：

```
/tools list
/tools disable browser
/tools enable homeassistant
```

## 核心工具集 (Core Toolsets)

| 工具集 (Toolset) | 工具 (Tools) | 用途 (Purpose) |
|---------|-------|---------|
| `browser` | `browser_back`, `browser_cdp`, `browser_click`, `browser_console`, `browser_dialog`, `browser_get_images`, `browser_navigate`, `browser_press`, `browser_scroll`, `browser_snapshot`, `browser_type`, `browser_vision`, `web_search` | 核心浏览器自动化。包括 `web_search` 作为快速查找的备用选项。`browser_cdp` 和 `browser_dialog` 是运行时受限的——仅在 CDP 端点在会话开始时可达（通过 `/browser connect`、`browser.cdp_url` 配置、Browserbase 或 Camofox）才注册。`browser_dialog` 与 `browser_snapshot` 添加的 `pending_dialogs` 和 `frame_tree` 字段协同工作，前提是已附加 CDP 监督者。 |
| `clarify` | `clarify` | 当智能体需要澄清时，向用户提问。 |
| `code_execution` | `execute_code` | 运行调用 Hermes 工具的 Python 脚本。 |
| `cronjob` | `cronjob` | 安排和管理重复性任务。 |
| `debugging` | composite (`file` + `terminal` + `web`) | 调试捆绑包 — 文件、进程/终端、网络提取/搜索。 |
| `delegation` | `delegate_task` | 派生隔离的子智能体实例以进行并行工作。 |
| `discord` | `discord` | 核心 Discord 文本/嵌入/私信操作（仅限网关）。在 `hermes-discord` 工具集上激活。 |
| `discord_admin` | `discord_admin` | Discord 版权管理（封禁、角色更改、频道管理）。在 `hermes-discord` 工具集上激活；需要机器人拥有相关的 Discord 权限。 |
| `feishu_doc` | `feishu_doc_read` | 读取 Feishu/Lark 文档内容。由 Feishu 文档评论智能回复处理器使用。 |
| `feishu_drive` | `feishu_drive_add_comment`, `feishu_drive_list_comments`, `feishu_drive_list_comment_replies`, `feishu_drive_reply_comment` | Feishu/Lark 驱动器评论操作。作用域限定于评论智能体；不会在 `hermes-cli` 或其他消息工具集上暴露。 |
| `file` | `patch`, `read_file`, `search_files`, `write_file` | 文件读取、写入、搜索和编辑。 |
| `homeassistant` | `ha_call_service`, `ha_get_state`, `ha_list_entities`, `ha_list_services` | 通过 Home Assistant 进行智能家居控制。仅当设置了 `HASS_TOKEN` 时可用。 |
| `computer_use` | `computer_use` | 通过 cua-driver 进行后台 macOS 桌面控制——不会窃取光标/焦点。与任何具备工具能力的模型配合使用。仅限 macOS；需要 `$PATH` 上有 `cua-driver`。 |
| `context_engine` | (varies) | 由活动上下文引擎插件暴露的运行时工具（在插件填充之前为空）。 |
| `image_gen` | `image_generate` | 通过 FAL.ai 进行文本到图像生成（支持 OpenAI / xAI 后端）。 |
| `video_gen` | `video_generate` | 通过插件注册的后端进行文本到视频和图像到视频转换（xAI Grok-Imagine, FAL.ai Veo 3.1 / Pixverse v6 / Kling O3）。传递 `image_url` 可动图像；省略则为文本到视频。 |
| `kanban` | `kanban_block`, `kanban_comment`, `kanban_complete`, `kanban_create`, `kanban_heartbeat`, `kanban_link`, `kanban_list`, `kanban_show`, `kanban_unblock` | 多个智能体协调工具。已注册给由调度器派生的任务工作者（`HERMES_KANBAN_TASK`）以及明确按名称列出 `kanban` 工具集的配置文件（`all`/`*` 通配符**不**启用它）。工作者标记任务完成、阻塞、心跳、评论和创建/链接后续任务；编排器配置还获得列表/取消阻塞等看板路由工具。 |
| `memory` | `memory` | 持久化的跨会话内存管理。 |
| `messaging` | `send_message` | 从会话中向其他平台（Telegram、Discord 等）发送消息。 |
| `safe` | `image_generate`, `vision_analyze`, `web_extract`, `web_search` (通过 `includes`) | 只读研究 + 媒体生成。无文件写入，无终端，无代码执行。 |
| `search` | `web_search` | 仅限网页搜索（不含提取）。 |
| `session_search` | `session_search` | 搜索过去的会话记录。 |
| `skills` | `skill_manage`, `skill_view`, `skills_list` | 技能的 CRUD 和浏览。 |
| `spotify` | `spotify_albums`, `spotify_devices`, `spotify_library`, `spotify_playback`, `spotify_playlists`, `spotify_queue`, `spotify_search` | 原生 Spotify 控制（播放、队列、搜索、播放列表、专辑、库）。由捆绑的 `spotify` 插件注册。 |
| `terminal` | `process`, `terminal` | Shell 命令执行和后台进程管理。 |
| `todo` | `todo` | 会话内的任务列表管理。 |
| `tts` | `text_to_speech` | 文本到语音的音频生成。 |
| `vision` | `vision_analyze` | 通过具备视觉能力的模型进行图像分析。 |
| `video` | `video_analyze` | 视频分析和理解工具（可选，不包含在默认工具集中——需通过 `--toolsets` 显式添加）。 |
| `web` | `web_extract`, `web_search` | 网页搜索和页面内容提取。 |
| `x_search` | `x_search` | 通过 xAI 内置的 `x_search` 回复工具搜索 X（Twitter）帖子和线程。默认禁用；通过 `hermes tools` 可选启用。仅在配置了 xAI 凭证（SuperGrok OAuth 或 `XAI_API_KEY`）时才注册 Schema。 |
| `yuanbao` | `yb_query_group_info`, `yb_query_group_members`, `yb_search_sticker`, `yb_send_dm`, `yb_send_sticker` | Yuanbao DM/群组操作和贴纸搜索。仅在 `hermes-yuanbao` 上注册。 |

## 平台工具集 (Platform Toolsets)

平台工具集定义了部署目标的完整工具配置。大多数消息平台使用的设置与 `hermes-cli` 相同：

| 工具集 (Toolset) | 与 `hermes-cli` 的区别 (Differences from `hermes-cli`) |
|---------|-------------------------------|
| `hermes-cli` | 完整的工具集——交互式 CLI 会话的默认设置。包括文件、终端、网络、浏览器、内存、技能、视觉、image_gen、todo、tts、委托、代码执行、cronjob、会话搜索、澄清和 `safe`（只读）捆绑包以及标准的消息工具。 |
| `hermes-acp` | 移除了 `clarify`、`cronjob`、`image_generate`、`send_message`、`text_to_speech` 和所有四个 Home Assistant 工具。专注于 IDE 环境中的编码任务。 |
| `hermes-api-server` | 移除了 `clarify`、`send_message` 和 `text_to_speech`。保留其他所有内容——适用于无法进行用户交互的程序化访问。 |
| `hermes-cron` | 与 `hermes-cli` 相同。 |
| `hermes-telegram` | 与 `hermes-cli` 相同。 |
| `hermes-discord` | 在 `hermes-cli` 的基础上增加了 `discord` 和 `discord_admin`。 |
| `hermes-slack` | 与 `hermes-cli` 相同。 |
| `hermes-whatsapp` | 与 `hermes-cli` 相同。 |
| `hermes-signal` | 与 `hermes-cli` 相同。 |
| `hermes-matrix` | 与 `hermes-cli` 相同。 |
| `hermes-mattermost` | 与 `hermes-cli` 相同。 |
| `hermes-email` | 与 `hermes-cli` 相同。 |
| `hermes-sms` | 与 `hermes-cli` 相同。 |
| `hermes-bluebubbles` | 与 `hermes-cli` 相同。 |
| `hermes-dingtalk` | 与 `hermes-cli` 相同。 |
| `hermes-feishu` | 添加了五个 `feishu_doc_*` / `feishu_drive_*` 工具（仅由文档评论处理器使用，而非常规聊天适配器）。 |
| `hermes-qqbot` | 与 `hermes-cli` 相同。 |
| `hermes-wecom` | 与 `hermes-cli` 相同。 |
| `hermes-wecom-callback` | 与 `hermes-cli` 相同。 |
| `hermes-weixin` | 与 `hermes-cli` 相同。 |
| `hermes-yuanbao` | 在 `hermes-cli` 的基础上增加了五个 `yb_*` 工具（DM/群组/贴纸）。 |
| `hermes-homeassistant` | 与 `hermes-cli` 相同（Home Assistant 工具默认存在并会在设置 `HASS_TOKEN` 时激活）。 |
| `hermes-webhook` | 与 `hermes-cli` 相同。 |
| `hermes-gateway` | 内部网关编排器工具集——所有 `hermes-<platform>` 工具集的并集；当网关需要接受任何消息源时使用。 |

## 动态工具集 (Dynamic Toolsets)

### MCP 服务器工具集 (MCP server toolsets)

每个配置的 MCP 服务器都会在运行时生成一个 `mcp-<server>` 工具集。例如，如果你配置了一个 `github` MCP 服务器，就会创建一个包含该服务器暴露的所有工具的 `mcp-github` 工具集。

```yaml
# config.yaml
mcp_servers:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
```

这会创建一个 `mcp-github` 工具集，你可以在 `--toolsets` 或平台配置中引用它。

### 插件工具集 (Plugin toolsets)

插件可以在初始化时通过 `ctx.register_tool()` 注册自己的工具集。它们与内置工具集并列存在，并且可以以相同的方式启用/禁用。

### 自定义工具集 (Custom toolsets)

在 `config.yaml` 中定义自定义工具集以创建项目特定的捆绑包：

```yaml
toolsets:
  - hermes-cli
custom_toolsets:
  data-science:
    - file
    - terminal
    - code_execution
    - web
    - vision
```

### 通配符 (Wildcards)

- `all` 或 `*` — 扩展为所有已注册的工具集（内置 + 动态 + 插件）。

少数工具除了属于工具集外，还有额外的可用性检查，**不会**仅通过 `all`/`*` 被开启：

- **能力受限 (Capability-gated)** 工具（browser, `computer_use`, `code_execution`, Feishu, Home Assistant, cronjob）仅在它们的后端/凭证先决条件已配置时才显示。
- **工作流受限 (Workflow-gated)** 工具——`kanban` 工具集——是故意可选的。`all`/`*` **不**启用看板；你必须显式列出 `kanban`（或是一个设置了 `HERMES_KANBAN_TASK` 的调度器派生的工作者）。看板工具会修改共享的看板状态，因此即使在 `all` 下也默认保持关闭。

## 与 `hermes tools` 的关系 (Relationship to `hermes tools`)

`hermes tools` 命令提供了一个基于 curses 的 UI，用于按平台切换单个工具的启用或禁用状态。这在工具级别操作（比工具集更精细），并且会持久化到 `config.yaml`。即使工具集已启用，禁用的工具也会被过滤掉。

另请参阅：[Tools Reference](./tools-reference.md) 以获取所有单个工具及其参数的完整列表。