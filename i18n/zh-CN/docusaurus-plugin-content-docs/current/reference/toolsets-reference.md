sidebar_position: 4
title: "工具集参考"
description: "Hermes 核心、复合、平台和动态工具集的参考"
---

# 工具集参考

工具集是控制智能体可执行操作的命名工具包。它们是配置每个平台、每个会话或每个任务工具可用性的主要机制。

## 工具集工作原理

每个工具都属于一个工具集。当你启用一个工具集时，该工具包中的所有工具都会对智能体可用。工具集分为三种类型：

- **核心 (Core)** — 一组相关的逻辑工具（例如，`file` 捆绑了 `read_file`、`write_file`、`patch`、`search_files`）。
- **复合 (Composite)** — 组合多个核心工具集以应对常见场景（例如，`debugging` 捆绑了文件、终端和网络工具）。
- **平台 (Platform)** — 针对特定部署环境的完整工具配置（例如，`hermes-cli` 是交互式 CLI 会话的默认配置）。

## 配置工具集

### 按会话配置 (CLI)

```bash
hermes chat --toolsets web,file,terminal
hermes chat --toolsets debugging        # 复合 — 扩展为 file + terminal + web
hermes chat --toolsets all              # 所有
```

### 按平台配置 (config.yaml)

```yaml
toolsets:
  - hermes-cli          # CLI 的默认配置
  # - hermes-telegram   # 覆盖 Telegram 网关的配置
```

### 交互式管理

```bash
hermes tools                            # curses UI，用于按平台启用/禁用工具
```

或在会话中：

```
/tools list
/tools disable browser
/tools enable rl
```

## 核心工具集

| 工具集 | 工具 | 用途 |
|---------|-------|---------|
| `browser` | `browser_back`, `browser_click`, `browser_console`, `browser_get_images`, `browser_navigate`, `browser_press`, `browser_scroll`, `browser_snapshot`, `browser_type`, `browser_vision`, `web_search` | 全面的浏览器自动化。包含 `web_search` 作为快速查询的备用选项。 |
| `clarify` | `clarify` | 当智能体需要澄清时，向用户提问。 |
| `code_execution` | `execute_code` | 运行调用 Hermes 工具的 Python 脚本。 |
| `cronjob` | `cronjob` | 安排和管理周期性任务。 |
| `delegation` | `delegate_task` | 启动隔离的子智能体实例以进行并行工作。 |
| `file` | `patch`, `read_file`, `search_files`, `write_file` | 文件读取、写入、搜索和编辑。 |
| `homeassistant` | `ha_call_service`, `ha_get_state`, `ha_list_entities`, `ha_list_services` | 通过 Home Assistant 控制智能家居。仅在设置了 `HASS_TOKEN` 时可用。 |
| `image_gen` | `image_generate` | 通过 FAL.ai 进行文本到图像生成。 |
| `memory` | `memory` | 持久化的跨会话内存管理。 |
| `messaging` | `send_message` | 从会话内部向其他平台（Telegram、Discord 等）发送消息。 |
| `moa` | `mixture_of_agents` | 通过混合智能体实现多模型共识。 |
| `rl` | `rl_check_status`, `rl_edit_config`, `rl_get_current_config`, `rl_get_results`, `rl_list_environments`, `rl_list_runs`, `rl_select_environment`, `rl_start_training`, `rl_stop_training`, `rl_test_inference` | RL 训练环境管理（Atropos）。 |
| `search` | `web_search` | 仅进行网络搜索（不包含提取）。 |
| `session_search` | `session_search` | 搜索过去的对话会话。 |
| `skills` | `skill_manage`, `skill_view`, `skills_list` | 技能的增删改查和浏览。 |
| `terminal` | `process`, `terminal` | Shell 命令执行和后台进程管理。 |
| `todo` | `todo` | 会话内的任务列表管理。 |
| `tts` | `text_to_speech` | 文本到语音音频生成。 |
| `vision` | `vision_analyze` | 通过具备视觉能力的模型进行图像分析。 |
| `web` | `web_extract`, `web_search` | 网络搜索和页面内容提取。 |

## 复合工具集

这些工具集扩展为多个核心工具集，为常见场景提供了便捷的简写：

| 工具集 | 扩展为 | 用例 |
|---------|-----------|----------|
| `debugging` | `patch`, `process`, `read_file`, `search_files`, `terminal`, `web_extract`, `web_search`, `write_file` | 调试会话 — 文件访问、终端和网络研究，无需浏览器或委托开销。 |
| `safe` | `image_generate`, `vision_analyze`, `web_extract`, `web_search` | 只读研究和媒体生成。不写入文件，不访问终端，不执行代码。适用于不可信或受限环境。 |

## 平台工具集

平台工具集定义了部署目标完整的工具配置。大多数消息平台使用与 `hermes-cli` 相同的工具集：

| 工具集 | 与 `hermes-cli` 的区别 |
|---------|-------------------------------|
| `hermes-cli` | 完整工具集 — 包含所有 36 个工具，包括 `clarify`。交互式 CLI 会话的默认配置。 |
| `hermes-acp` | 移除了 `clarify`、`cronjob`、`image_generate`、`send_message`、`text_to_speech` 和 homeassistant 工具。专注于 IDE 环境中的编码任务。 |
| `hermes-api-server` | 移除了 `clarify`、`send_message` 和 `text_to_speech`。添加了所有其他工具 — 适用于无法进行用户交互的程序化访问。 |
| `hermes-telegram` | 与 `hermes-cli` 相同。 |
| `hermes-discord` | 与 `hermes-cli` 相同。 |
| `hermes-slack` | 与 `hermes-cli` 相同。 |
| `hermes-whatsapp` | 与 `hermes-cli` 相同。 |
| `hermes-signal` | 与 `hermes-cli` 相同。 |
| `hermes-matrix` | 与 `hermes-cli` 相同。 |
| `hermes-mattermost` | 与 `hermes-cli` 相同。 |
| `hermes-email` | 与 `hermes-cli` 相同。 |
| `hermes-sms` | 与 `hermes-cli` 相同。 |
| `hermes-dingtalk` | 与 `hermes-cli` 相同。 |
| `hermes-feishu` | 与 `hermes-cli` 相同。 |
| `hermes-wecom` | 与 `hermes-cli` 相同。 |
| `hermes-wecom-callback` | WeCom 回调工具集 — 企业自建应用消息（完全访问）。 |
| `hermes-weixin` | 与 `hermes-cli` 相同。 |
| `hermes-bluebubbles` | 与 `hermes-cli` 相同。 |
| `hermes-qqbot` | 与 `hermes-cli` 相同。 |
| `hermes-homeassistant` | 与 `hermes-cli` 相同。 |
| `hermes-webhook` | 与 `hermes-cli` 相同。 |
| `hermes-gateway` | 所有消息平台工具集的并集。当网关需要尽可能广泛的工具集时使用。 |

## 动态工具集

### MCP 服务器工具集

每个配置的 MCP 服务器都会在运行时生成一个 `mcp-<server>` 工具集。例如，如果你配置了一个 `github` MCP 服务器，就会创建一个包含该服务器暴露的所有工具的 `mcp-github` 工具集。

```yaml
# config.yaml
mcp:
  servers:
    github:
      command: npx
      args: ["-y", "@modelcontextprotocol/server-github"]
```

这将创建一个 `mcp-github` 工具集，你可以在 `--toolsets` 或平台配置中引用它。

### 插件工具集

插件可以在初始化过程中通过 `ctx.register_tool()` 注册自己的工具集。这些工具集会与内置工具集并列，并且可以以相同的方式启用/禁用。

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

- `all` 或 `*` — 扩展为所有已注册的工具集（内置 + 动态 + 插件）

## 与 `hermes tools` 的关系

`hermes tools` 命令提供了一个基于 curses 的 UI，用于按平台单独切换工具的启用或禁用。这在工具级别操作（比工具集更精细），并且会持久化到 `config.yaml`。即使工具集已启用，禁用的工具也会被过滤掉。

另请参阅：[工具参考](./tools-reference.md)，了解所有单个工具及其参数的完整列表。