---
sidebar_position: 4
title: "工具集参考"
description: "Hermes 核心、复合、平台和动态工具集的参考文档"
---

# 工具集参考

工具集是命名工具包，用于控制代理可以执行的操作。它们是配置每个平台、每次会话或每项任务中工具可用性的主要机制。

## 工具集的工作原理

每个工具都属于且仅属于一个工具集。启用某个工具集时，该捆绑包中的所有工具都将对代理开放。工具集分为三种类型：

- **核心** — 一组相关的逻辑工具（例如，`file` 工具集包含 `read_file`、`write_file`、`patch`、`search_files`）
- **复合** — 组合多个核心工具集以适用于常见场景（例如，`debugging` 工具集包含文件、终端和 Web 工具）
- **平台** — 特定部署上下文的完整工具配置（例如，`hermes-cli` 是交互式命令行会话的默认设置）

## 配置工具集

### 按会话（CLI）

```bash
hermes chat --toolsets web,file,terminal
hermes chat --toolsets debugging        # 复合工具集 — 展开为 file + terminal + web
hermes chat --toolsets all              # 全部工具
```

### 按平台（config.yaml）

```yaml
toolsets:
  - hermes-cli          # CLI 的默认设置
  # - hermes-telegram   # Telegram 网关的覆盖设置
```

### 交互式管理

```bash
hermes tools                            # 基于 curses 的 UI，可按平台启用/禁用工具
```

或在会话中操作：

```
/tools list
/tools disable browser
/tools enable rl
```

## 核心工具集

| 工具集 | 工具 | 用途 |
|---------|-------|---------|
| `browser` | `browser_back`, `browser_cdp`, `browser_click`, `browser_console`, `browser_get_images`, `browser_navigate`, `browser_press`, `browser_scroll`, `browser_snapshot`, `browser_type`, `browser_vision`, `web_search` | 完整的浏览器自动化功能。包含 `web_search` 作为快速查找的回退选项。`browser_cdp` 是通过可达的 CDP 端点进行的原生 CDP 透传 — 仅在 `/browser connect` 处于活动状态或设置了 `browser.cdp_url` 时才可见。 |
| `clarify` | `clarify` | 当代理需要澄清时向用户提问。 |
| `code_execution` | `execute_code` | 运行调用 Hermes 工具的 Python 脚本。 |
| `cronjob` | `cronjob` | 计划和管理工作任务。 |
| `delegation` | `delegate_task` | 启动独立的子代理实例以实现并行工作。 |
| `feishu_doc` | `feishu_doc_read` | 读取飞书/Lark 文档内容。由飞书文档评论智能回复处理器使用。 |
| `feishu_drive` | `feishu_drive_add_comment`, `feishu_drive_list_comments`, `feishu_drive_list_comment_replies`, `feishu_drive_reply_comment` | 飞书/Lark 云盘评论操作。限定在评论代理范围内；未在 `hermes-cli` 或其他消息工具集中暴露。 |
| `file` | `patch`, `read_file`, `search_files`, `write_file` | 文件读取、写入、搜索和编辑。 |
| `homeassistant` | `ha_call_service`, `ha_get_state`, `ha_list_entities`, `ha_list_services` | 通过 Home Assistant 控制智能家居。仅在设置了 `HASS_TOKEN` 时才可用。 |
| `image_gen` | `image_generate` | 通过 FAL.ai 生成文本到图像。 |
| `memory` | `memory` | 跨会话的持久化内存管理。 |
| `messaging` | `send_message` | 在会话内将消息发送到其他平台（Telegram、Discord 等）。 |
| `moa` | `mixture_of_agents` | 通过 Mixture of Agents 实现多模型共识。 |
| `rl` | `rl_check_status`, `rl_edit_config`, `rl_get_current_config`, `rl_get_results`, `rl_list_environments`, `rl_list_runs`, `rl_select_environment`, `rl_start_training`, `rl_stop_training`, `rl_test_inference` | RL 训练环境管理（Atropos）。 |
| `search` | `web_search` | 仅网络搜索（不包含内容提取）。 |
| `session_search` | `session_search` | 搜索过往对话会话。 |
| `skills` | `skill_manage`, `skill_view`, `skills_list` | 技能 CRUD 浏览。 |
| `terminal` | `process`, `terminal` | Shell 命令执行和后台进程管理。 |
| `todo` | `todo` | 会话内的任务列表管理。 |
| `tts` | `text_to_speech` | 文本转语音音频生成。 |
| `vision` | `vision_analyze` | 通过具备视觉能力的模型分析图像。 |
| `web` | `web_extract`, `web_search` | 网络搜索和页面内容提取。 |

## 复合工具集

这些工具集会展开为多个核心工具集，为常见场景提供便捷的简写形式：

| 工具集 | 展开内容 | 用例 |
|---------|-----------|----------|
| `debugging` | `web` + `file` + `process`, `terminal`（通过 `includes`）— 实际上是 `patch`, `process`, `read_file`, `search_files`, `terminal`, `web_extract`, `web_search`, `write_file` | 调试会话 — 无需浏览器或委托开销即可访问文件、终端和网络研究。 |
| `safe` | `image_generate`, `vision_analyze`, `web_extract`, `web_search` | 只读研究和媒体生成。无文件写入、无终端访问、无代码执行。适用于不信任或受限的环境。 |

## 平台工具集

平台工具集定义了部署目标的完整工具配置。大多数消息平台使用与 `hermes-cli` 相同的工具集：

| 工具集 | 与 `hermes-cli` 的区别 |
|---------|-------------------------------|
| `hermes-cli` | 完整工具集 — 包含所有 36 个核心工具，包括 `clarify`。交互式命令行会话的默认设置。 |
| `hermes-acp` | 移除 `clarify`、`cronjob`、`image_generate`、`send_message`、`text_to_speech` 以及 homeassistant 相关工具。专注于 IDE 上下文中的编码任务。 |
| `hermes-api-server` | 移除 `clarify`、`send_message` 和 `text_to_speech`。添加其余所有工具 — 适合无法进行用户交互的程序化访问。 |
| `hermes-telegram` | 与 `hermes-cli` 相同。 |
| `hermes-discord` | 与 `hermes-cli` 相同。 |
| `hermes-slack` | 与 `hermes-cli` 相同。 |
| `hermes-whatsapp` | 与 `hermes-cli` 相同。 |
| `hermes-signal` | 与 `hermes-cli` 相同。 |
| `hermes-matrix` | 与 `hermes-cli` 相同。 |
| `hermes-mattermost` | 与 `hermes-cli` 相同。 |
| `hermes-email` | 与 `hermes-cli` 相同。 |
| `hermes-sms` | 与 `hermes-cli` 相同。 |
| `hermes-bluebubbles` | 与 `hermes-cli` 相同。 |
| `hermes-dingtalk` | 与 `hermes-cli` 相同。 |
| `hermes-feishu` | 与 `hermes-cli` 相同。注意：`feishu_doc` / `feishu_drive` 工具集仅由文档评论处理器使用，而不是常规飞书聊天适配器。 |
| `hermes-qqbot` | 与 `hermes-cli` 相同。 |
| `hermes-wecom` | 与 `hermes-cli` 相同。 |
| `hermes-wecom-callback` | 与 `hermes-cli` 相同。 |
| `hermes-weixin` | 与 `hermes-cli` 相同。 |
| `hermes-homeassistant` | 与 `hermes-cli` 相同，并始终启用 `homeassistant` 工具集。 |
| `hermes-webhook` | 与 `hermes-cli` 相同。 |
| `hermes-gateway` | 内部网关协调器工具集 — 当网关需要接受任何消息源时，采用最广泛的工具集组合。 |

## 动态工具集

### MCP 服务器工具集

每个配置的 MCP 服务器都会在运行时生成一个 `mcp-<server>` 工具集。例如，如果您配置了一个 `github` MCP 服务器，则会创建一个包含该服务器暴露的所有工具的 `mcp-github` 工具集。

```yaml
# config.yaml
mcp_servers:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
```

这将创建一个可以在 `--toolsets` 或平台配置中引用的 `mcp-github` 工具集。

### 插件工具集

插件可以在初始化期间通过 `ctx.register_tool()` 注册自己的工具集。这些工具集会出现在内置工具集旁边，并以相同方式启用/禁用。

### 自定义工具集

在 `config.yaml` 中定义自定义工具集以创建项目特定的工具包：

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

- `all` 或 `*` — 展开为所有已注册的工具集（内置 + 动态 + 插件）

## 与 `hermes tools` 的关系

`hermes tools` 命令提供了一个基于 curses 的 UI，用于按平台切换单个工具的开关。此操作在工具级别进行（比工具集更精细），并会持久化到 `config.yaml`。即使其工具集被启用，被禁用的工具也会被过滤掉。

另见：[工具参考](./tools-reference.md) 获取所有单个工具及其参数的完整列表。