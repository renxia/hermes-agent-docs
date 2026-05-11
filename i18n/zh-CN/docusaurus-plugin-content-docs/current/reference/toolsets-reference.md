---
sidebar_position: 4
title: "工具集参考"
description: "Hermes核心、复合、平台及动态工具集的参考说明"
---

# 工具集参考

工具集是控制智能体能力边界的功能模块集合，它们是针对特定平台、会话或任务配置可用工具的主要机制。

## 工具集工作原理

每个工具严格归属于一个工具集。当您启用某个工具集时，该模块中的所有工具将立即对智能体开放。工具集主要分为三种类型：

- **核心型** — 逻辑相关的单一工具组（例如 `file` 工具集包含 `read_file`、`write_file`、`patch`、`search_files` 等功能）
- **复合型** — 为特定场景整合多个核心工具集（例如 `debugging` 工具集会聚合文件、终端和网络相关工具）
- **平台型** — 为特定部署环境提供完整工具配置（例如 `hermes-cli` 是交互式命令行会话的默认工具集）

## 配置工具集

### 按会话配置（CLI）

```bash
hermes chat --toolsets web,file,terminal
hermes chat --toolsets debugging        # 组合工具集 — 展开为 file + terminal + web
hermes chat --toolsets all              # 全部工具
```

### 按平台配置（config.yaml）

```yaml
toolsets:
  - hermes-cli          # CLI 默认工具集
  # - hermes-telegram   # 覆盖 Telegram 网关的工具集
```

### 交互式管理

```bash
hermes tools                            # 基于 curses 的 UI，用于按平台启用/禁用工具
```

或在会话中：

```
/tools list
/tools disable browser
/tools enable rl
```

## 核心工具集

| 工具集 | 工具 | 用途 |
|---------|-------|------|
| `browser` | `browser_back`, `browser_cdp`, `browser_click`, `browser_console`, `browser_dialog`, `browser_get_images`, `browser_navigate`, `browser_press`, `browser_scroll`, `browser_snapshot`, `browser_type`, `browser_vision`, `web_search` | 核心浏览器自动化。包含 `web_search` 作为快速查找的备选方案。`browser_cdp` 和 `browser_dialog` 在运行时受限制 — 仅在会话启动时 CDP 端点可达（通过 `/browser connect`、`browser.cdp_url` 配置、Browserbase 或 Camofox）时才注册。`browser_dialog` 与 `browser_snapshot` 在附加 CDP 监管器时添加的 `pending_dialogs` 和 `frame_tree` 字段协同工作。 |
| `clarify` | `clarify` | 当智能体需要澄清时向用户提问。 |
| `code_execution` | `execute_code` | 运行可编程调用 Hermes 工具的 Python 脚本。 |
| `cronjob` | `cronjob` | 调度和管理定时任务。 |
| `debugging` | 组合工具集 (`file` + `terminal` + `web`) | 调试套件 — 文件、进程/终端、网页提取/搜索。 |
| `delegation` | `delegate_task` | 生成隔离的子智能体实例以进行并行工作。 |
| `discord` | `discord` | 核心 Discord 文本/嵌入/私信操作（仅限网关）。在 `hermes-discord` 工具集上激活。 |
| `discord_admin` | `discord_admin` | Discord 管理（封禁、角色变更、频道管理）。在 `hermes-discord` 工具集上激活；需要机器人持有相关的 Discord 权限。 |
| `feishu_doc` | `feishu_doc_read` | 读取飞书/Lark 文档内容。由飞书文档评论智能回复处理器使用。 |
| `feishu_drive` | `feishu_drive_add_comment`, `feishu_drive_list_comments`, `feishu_drive_list_comment_replies`, `feishu_drive_reply_comment` | 飞书/Lark 云盘评论操作。作用域为评论智能体；不在 `hermes-cli` 或其他消息工具集上公开。 |
| `file` | `patch`, `read_file`, `search_files`, `write_file` | 文件读取、写入、搜索和编辑。 |
| `homeassistant` | `ha_call_service`, `ha_get_state`, `ha_list_entities`, `ha_list_services` | 通过 Home Assistant 进行智能家居控制。仅在设置了 `HASS_TOKEN` 时可用。 |
| `computer_use` | `computer_use` | 通过 cua-driver 进行后台 macOS 桌面控制 — 不会夺取光标/焦点。适用于任何支持工具的模型。仅限 macOS；需要在 `$PATH` 中包含 `cua-driver`。 |
| `image_gen` | `image_generate` | 通过 FAL.ai 进行文生图（可选 OpenAI / xAI 后端）。 |
| `kanban` | `kanban_block`, `kanban_comment`, `kanban_complete`, `kanban_create`, `kanban_heartbeat`, `kanban_link`, `kanban_show` | 多智能体协调工具 — 仅当智能体由看板调度器生成（设置了 `HERMES_KANBAN_TASK` 环境变量）时才注册。允许工作者通过结构化交接标记任务完成、为人类输入设置阻塞、在长操作期间发送心跳、对讨论线程评论，以及（对于编排者）分解为子任务。 |
| `memory` | `memory` | 跨会话的持久化记忆管理。 |
| `messaging` | `send_message` | 从会话内部向其他平台（Telegram、Discord 等）发送消息。 |
| `moa` | `mixture_of_agents` | 通过混合智能体实现多模型共识。 |
| `rl` | `rl_check_status`, `rl_edit_config`, `rl_get_current_config`, `rl_get_results`, `rl_list_environments`, `rl_list_runs`, `rl_select_environment`, `rl_start_training`, `rl_stop_training`, `rl_test_inference` | 强化学习训练环境管理（Atropos）。 |
| `safe` | `image_generate`, `vision_analyze`, `web_extract`, `web_search`（通过 `includes`） | 只读研究 + 媒体生成。无文件写入、无终端、无代码执行。 |
| `search` | `web_search` | 仅网页搜索（无提取）。 |
| `session_search` | `session_search` | 搜索过往的会话记录。 |
| `skills` | `skill_manage`, `skill_view`, `skills_list` | 技能的增删改查和浏览。 |
| `spotify` | `spotify_albums`, `spotify_devices`, `spotify_library`, `spotify_playback`, `spotify_playlists`, `spotify_queue`, `spotify_search` | 原生 Spotify 控制（播放、队列、搜索、播放列表、专辑、曲库）。由捆绑的 `spotify` 插件注册。 |
| `terminal` | `process`, `terminal` | Shell 命令执行和后台进程管理。 |
| `todo` | `todo` | 会话内的任务列表管理。 |
| `tts` | `text_to_speech` | 文本转语音音频生成。 |
| `vision` | `vision_analyze` | 通过支持视觉的模型进行图像分析。 |
| `video` | `video_analyze` | 视频分析和理解工具（可选加入，不在默认工具集中 — 通过 `--toolsets` 显式添加）。 |
| `web` | `web_extract`, `web_search` | 网页搜索和页面内容提取。 |
| `yuanbao` | `yb_query_group_info`, `yb_query_group_members`, `yb_search_sticker`, `yb_send_dm`, `yb_send_sticker` | 元宝私信/群组操作和表情搜索。仅在 `hermes-yuanbao` 上注册。 |

## 平台工具集

平台工具集为部署目标定义了完整的工具配置。大多数消息平台使用与 `hermes-cli` 相同的工具集：

| 工具集 | 与 `hermes-cli` 的差异 |
|---------|----------------------|
| `hermes-cli` | 完整工具集 — 交互式 CLI 会话的默认设置。包括文件、终端、网页、浏览器、记忆、技能、视觉、图像生成、待办事项、文本转语音、委派、代码执行、定时任务、会话搜索、澄清和 `safe`（只读）捆绑包以及标准消息工具。 |
| `hermes-acp` | 移除 `clarify`、`cronjob`、`image_generate`、`send_message`、`text_to_speech` 和所有四个 Home Assistant 工具。专注于 IDE 上下文中的编码任务。 |
| `hermes-api-server` | 移除 `clarify`、`send_message` 和 `text_to_speech`。保留其他所有工具 — 适用于无法进行用户交互的编程访问。 |
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
| `hermes-feishu` | 添加五个 `feishu_doc_*` / `feishu_drive_*` 工具（仅由文档评论处理器使用，非常规聊天适配器）。 |
| `hermes-qqbot` | 与 `hermes-cli` 相同。 |
| `hermes-wecom` | 与 `hermes-cli` 相同。 |
| `hermes-wecom-callback` | 与 `hermes-cli` 相同。 |
| `hermes-weixin` | 与 `hermes-cli` 相同。 |
| `hermes-yuanbao` | 在 `hermes-cli` 基础上添加五个 `yb_*` 工具（私信/群组/表情）。 |
| `hermes-homeassistant` | 与 `hermes-cli` 相同（Home Assistant 工具默认已存在，并在设置了 `HASS_TOKEN` 时激活）。 |
| `hermes-webhook` | 与 `hermes-cli` 相同。 |
| `hermes-gateway` | 内部网关编排器工具集 — 所有 `hermes-<platform>` 工具集的并集；当网关需要接受任何消息源时使用。 |

## 动态工具集

### MCP 服务器工具集

每个已配置的 MCP 服务器会在运行时生成一个 `mcp-<server>` 工具集。例如，如果你配置了一个 `github` MCP 服务器，则会创建一个包含该服务器暴露的所有工具的 `mcp-github` 工具集。

```yaml
# config.yaml
mcp_servers:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
```

这会创建一个 `mcp-github` 工具集，你可以在 `--toolsets` 或平台配置中引用它。

### 插件工具集

插件可以在初始化期间通过 `ctx.register_tool()` 注册自己的工具集。这些工具集会与内置工具集并列显示，并且可以以相同的方式启用/禁用。

### 自定义工具集

在 `config.yaml` 中定义自定义工具集以创建特定于项目的捆绑包：

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

`hermes tools` 命令提供了一个基于 curses 的 UI，用于按平台逐个切换工具的开启或关闭。这在工具级别（比工具集更精细）上运行，并持久化到 `config.yaml`。即使启用了其所属的工具集，被禁用的工具也会被过滤掉。

另请参阅：[工具参考](./tools-reference.md) 以获取所有单个工具及其参数的完整列表。