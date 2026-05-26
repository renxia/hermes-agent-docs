---
sidebar_position: 4
title: "工具集参考"
description: "Hermes 核心、复合、平台及动态工具集参考"
---

# 工具集参考

工具集是指定工具的捆绑包，控制着智能体能够执行的操作。它们是针对不同平台、会话或任务配置工具可用性的主要机制。

## 工具集如何运作

每个工具恰好属于一个工具集。当你启用一个工具集时，该捆绑包内的所有工具都会对智能体可用。工具集分为三类：

- **核心工具集** — 一组相关的逻辑工具单元（例如，`file` 工具集捆绑了 `read_file`、`write_file`、`patch`、`search_files`）
- **复合工具集** — 为常见场景组合多个核心工具集（例如，`debugging` 工具集捆绑了文件、终端和网络工具）
- **平台工具集** — 针对特定部署环境的完整工具配置（例如，`hermes-cli` 是交互式命令行会话的默认配置）

## 配置工具集

### 每会话配置（CLI）

```bash
hermes chat --toolsets web,file,terminal
hermes chat --toolsets debugging        # 组合工具集 — 展开为 file + terminal + web
hermes chat --toolsets all              # 所有工具集
```

### 每平台配置（config.yaml）

```yaml
toolsets:
  - hermes-cli          # CLI 的默认工具集
  # - hermes-telegram   # 为 Telegram 网关覆盖
```

### 交互式管理

```bash
hermes tools                            # 用于为每个平台启用/禁用的 curses 界面
```

或在会话中：

```
/tools list
/tools disable browser
/tools enable homeassistant
```

## 核心工具集

| 工具集 | 工具 | 用途 |
|---------|-------|------|
| `browser` | `browser_back`, `browser_cdp`, `browser_click`, `browser_console`, `browser_dialog`, `browser_get_images`, `browser_navigate`, `browser_press`, `browser_scroll`, `browser_snapshot`, `browser_type`, `browser_vision`, `web_search` | 核心浏览器自动化。包含 `web_search` 作为快速查找的后备方案。`browser_cdp` 和 `browser_dialog` 在运行时有条件加载 — 仅在会话开始时通过 `/browser connect`、`browser.cdp_url` 配置、Browserbase 或 Camofox 可以访问 CDP 端点时注册。`browser_dialog` 与 `browser_snapshot` 在附加 CDP 监视器时添加的 `pending_dialogs` 和 `frame_tree` 字段协同工作。 |
| `clarify` | `clarify` | 当智能体需要澄清时向用户提问。 |
| `code_execution` | `execute_code` | 运行可编程调用 Hermes 工具的 Python 脚本。 |
| `cronjob` | `cronjob` | 调度和管理定期任务。 |
| `debugging` | 组合 (`file` + `terminal` + `web`) | 调试包 — 文件、进程/终端、网页提取/搜索。 |
| `delegation` | `delegate_task` | 生成隔离的子智能体实例以进行并行工作。 |
| `discord` | `discord` | 核心 Discord 文本/嵌入/私信操作（仅限网关）。在 `hermes-discord` 工具集上激活。 |
| `discord_admin` | `discord_admin` | Discord 管理功能（封禁、角色更改、频道管理）。在 `hermes-discord` 工具集上激活；要求机器人拥有相关的 Discord 权限。 |
| `feishu_doc` | `feishu_doc_read` | 读取飞书/Lark 文档内容。供飞书文档评论智能回复处理器使用。 |
| `feishu_drive` | `feishu_drive_add_comment`, `feishu_drive_list_comments`, `feishu_drive_list_comment_replies`, `feishu_drive_reply_comment` | 飞书/Lark 云文档评论操作。作用域限定为评论智能体；不在 `hermes-cli` 或其他消息工具集上公开。 |
| `file` | `patch`, `read_file`, `search_files`, `write_file` | 文件读取、写入、搜索和编辑。 |
| `homeassistant` | `ha_call_service`, `ha_get_state`, `ha_list_entities`, `ha_list_services` | 通过 Home Assistant 控制智能家居。仅在设置了 `HASS_TOKEN` 时可用。 |
| `computer_use` | `computer_use` | 通过 cua-driver 进行后台 macOS 桌面控制 — 不会抢占光标/焦点。适用于任何具备工具调用能力的模型。仅限 macOS；需要 `cua-driver` 在 `$PATH` 中。 |
| `image_gen` | `image_generate` | 通过 FAL.ai 进行文生图（可选启用 OpenAI / xAI 后端）。 |
| `video_gen` | `video_generate` | 通过插件注册的后端进行文生视频和图生视频（xAI Grok-Imagine、FAL.ai Veo 3.1 / Pixverse v6 / Kling O3）。传递 `image_url` 以动画化图像；省略则为文生视频。 |
| `kanban` | `kanban_block`, `kanban_comment`, `kanban_complete`, `kanban_create`, `kanban_heartbeat`, `kanban_link`, `kanban_list`, `kanban_show`, `kanban_unblock` | 多智能体协调工具。为调度器生成的任务工作者 (`HERMES_KANBAN_TASK`) 和明确启用 `kanban` 工具集的配置文件注册。工作者标记任务完成、阻塞、心跳、评论和创建/链接后续任务；协调者配置文件额外获得列表/解除阻塞等看板路由工具。 |
| `memory` | `memory` | 跨会话的持久化内存管理。 |
| `messaging` | `send_message` | 从会话内部向其他平台（Telegram、Discord 等）发送消息。 |
| `moa` | `mixture_of_agents` | 通过混合智能体实现多模型共识。 |
| `safe` | `image_generate`, `vision_analyze`, `web_extract`, `web_search` (通过 `includes`) | 只读研究 + 媒体生成。无文件写入、无终端、无代码执行。 |
| `search` | `web_search` | 仅网页搜索（无提取）。 |
| `session_search` | `session_search` | 搜索过去的对话会话。 |
| `skills` | `skill_manage`, `skill_view`, `skills_list` | 技能的创建、读取、更新、删除和浏览。 |
| `spotify` | `spotify_albums`, `spotify_devices`, `spotify_library`, `spotify_playback`, `spotify_playlists`, `spotify_queue`, `spotify_search` | 原生 Spotify 控制（播放、队列、搜索、播放列表、专辑、库）。由内置的 `spotify` 插件注册。 |
| `terminal` | `process`, `terminal` | Shell 命令执行和后台进程管理。 |
| `todo` | `todo` | 会话内的任务列表管理。 |
| `tts` | `text_to_speech` | 文本转语音音频生成。 |
| `vision` | `vision_analyze` | 通过视觉能力模型进行图像分析。 |
| `video` | `video_analyze` | 视频分析和理解工具（可选启用，不在默认工具集中 — 通过 `--toolsets` 显式添加）。 |
| `web` | `web_extract`, `web_search` | 网页搜索和页面内容提取。 |
| `x_search` | `x_search` | 通过 xAI 内置的 `x_search` Responses 工具搜索 X（Twitter）帖子和线程。默认关闭；通过 `hermes tools` 选择加入。仅在配置了 xAI 凭据（SuperGrok OAuth 或 `XAI_API_KEY`）时注册架构。 |
| `yuanbao` | `yb_query_group_info`, `yb_query_group_members`, `yb_search_sticker`, `yb_send_dm`, `yb_send_sticker` | 元宝私信/群组操作和表情搜索。仅在 `hermes-yuanbao` 上注册。 |

## 平台工具集

平台工具集定义了部署目标的完整工具配置。大多数消息平台使用与 `hermes-cli` 相同的工具集：

| 工具集 | 与 `hermes-cli` 的差异 |
|---------|--------------------------|
| `hermes-cli` | 完整工具集 — 交互式 CLI 会话的默认工具集。包括文件、终端、网页、浏览器、内存、技能、视觉、图像生成、待办事项、语音合成、委托、代码执行、定时任务、会话搜索、澄清和 `safe`（只读）包以及标准消息传递工具。 |
| `hermes-acp` | 移除 `clarify`、`cronjob`、`image_generate`、`send_message`、`text_to_speech` 和所有四个 Home Assistant 工具。专注于 IDE 上下文中的编码任务。 |
| `hermes-api-server` | 移除 `clarify`、`send_message` 和 `text_to_speech`。保留其他所有功能 — 适用于无法进行用户交互的编程访问。 |
| `hermes-cron` | 与 `hermes-cli` 相同。 |
| `hermes-telegram` | 与 `hermes-cli` 相同。 |
| `hermes-discord` | 在 `hermes-cli` 基础上添加 `discord` 和 `discord_admin`。 |
| `hermes-slack` | 与 `hermes-cli` 相同。 |
| `hermes-whatsapp` | 与 `hermes-cli` 相同。 |
| `hermes-signal` | 与 `hermes-cli` 相同。 |
| `hermes-matrix` | 与 `hermes-cli` 相同。 |
| `hermes-mattermost` | 与 `hermes-cli` 相同。 |
| `hermes-email` | 与 `hermes-cli` 相同。 |
| `hermes-sms` | 与 `hermes-cli` 相同。 |
| `hermes-bluebubbles` | 与 `hermes-cli` 相同。 |
| `hermes-dingtalk` | 与 `hermes-cli` 相同。 |
| `hermes-feishu` | 添加五个 `feishu_doc_*` / `feishu_drive_*` 工具（仅由文档评论处理器使用，而非普通聊天适配器）。 |
| `hermes-qqbot` | 与 `hermes-cli` 相同。 |
| `hermes-wecom` | 与 `hermes-cli` 相同。 |
| `hermes-wecom-callback` | 与 `hermes-cli` 相同。 |
| `hermes-weixin` | 与 `hermes-cli` 相同。 |
| `hermes-yuanbao` | 在 `hermes-cli` 基础上添加五个 `yb_*` 工具（私信/群组/表情）。 |
| `hermes-homeassistant` | 与 `hermes-cli` 相同（Home Assistant 工具默认已存在，并在设置 `HASS_TOKEN` 时激活）。 |
| `hermes-webhook` | 与 `hermes-cli` 相同。 |
| `hermes-gateway` | 内部网关协调器工具集 — 所有 `hermes-<platform>` 工具集的并集；当网关需要接受任何消息源时使用。 |

## 动态工具集

### MCP 服务器工具集

每个配置的 MCP 服务器在运行时生成一个 `mcp-<server>` 工具集。例如，如果你配置了一个 `github` MCP 服务器，会创建一个包含该服务器公开的所有工具的 `mcp-github` 工具集。

```yaml
# config.yaml
mcp_servers:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
```

这会创建一个你可以在 `--toolsets` 或平台配置中引用的 `mcp-github` 工具集。

### 插件工具集

插件可以在插件初始化期间通过 `ctx.register_tool()` 注册自己的工具集。这些工具集与内置工具集一起出现，并且可以以相同的方式启用/禁用。

### 自定义工具集

在 `config.yaml` 中定义自定义工具集，以创建特定于项目的包：

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

### 通配符

- `all` 或 `*` — 展开为每个已注册的工具集（内置 + 动态 + 插件）

## 与 `hermes tools` 的关系

`hermes tools` 命令提供了一个基于 curses 的界面，用于为每个平台切换单个工具的开启或关闭。这在工具级别（比工具集更精细）进行操作，并持久化到 `config.yaml`。即使启用了其工具集，被禁用的工具也会被过滤掉。

另请参阅：[工具参考](./tools-reference.md) 获取所有单个工具及其参数的完整列表。