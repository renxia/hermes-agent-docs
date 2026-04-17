---
sidebar_position: 3
title: "内置工具参考"
description: "Hermes 内置工具的权威参考，按工具集分组"
---

# 内置工具参考

本页面记录了 Hermes 工具注册表中所有 47 个内置工具，并按工具集进行分组。可用性取决于平台、凭证和启用的工具集。

**快速统计：** 包含 10 个浏览器工具、4 个文件工具、10 个 RL 工具、4 个 Home Assistant 工具、2 个终端工具、2 个网络工具和 15 个其他工具集中的独立工具。

:::tip MCP 工具
除了内置工具外，Hermes 还可以从 MCP 服务器动态加载工具。MCP 工具会带上服务器名称前缀（例如，`github_create_issue` 用于 `github` MCP 服务器）。有关配置，请参阅 [MCP 集成](/docs/user-guide/features/mcp)。
:::

## `browser` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `browser_back` | 在浏览器历史记录中导航回上一个页面。必须先调用 `browser_navigate`。 | — |
| `browser_click` | 点击由快照（例如，'@e5'）通过其引用 ID 识别的元素。引用 ID 显示在快照输出的方括号中。必须先调用 `browser_navigate` 和 `browser_snapshot`。 | — |
| `browser_console` | 获取当前页面的浏览器控制台输出和 JavaScript 错误。返回 console.log/warn/error/info 消息和未捕获的 JS 异常。用于检测静默 JavaScript 错误、失败的 API 调用和应用程序警告。需要… | — |
| `browser_get_images` | 获取当前页面所有图片的列表，包括它们的 URL 和 alt 文本。对于需要使用视觉工具分析图片非常有用。必须先调用 `browser_navigate`。 | — |
| `browser_navigate` | 在浏览器中导航到 URL。初始化会话并加载页面。必须在调用其他浏览器工具之前调用。对于简单的信息检索，建议使用 web_search 或 web_extract（更快、更便宜）。当您需要…时使用浏览器工具。 | — |
| `browser_press` | 按下键盘按键。对于提交表单（Enter）、导航（Tab）或键盘快捷键非常有用。必须先调用 `browser_navigate`。 | — |
| `browser_scroll` | 按方向滚动页面。用于显示当前视口下方或上方的更多内容。必须先调用 `browser_navigate`。 | — |
| `browser_snapshot` | 获取当前页面可访问性树的文本快照。返回带有引用 ID（如 @e1, @e2）的交互元素，可用于 `browser_click` 和 `browser_type`。full=false（默认）：包含交互元素的紧凑视图。full=true：完整… | — |
| `browser_type` | 将文本输入到由其引用 ID 识别的输入字段。首先清除字段，然后输入新文本。必须先调用 `browser_navigate` 和 `browser_snapshot`。 | — |
| `browser_vision` | 拍摄当前页面的截图并使用视觉 AI 进行分析。当您需要从视觉上理解页面内容时使用——对于 CAPTCHA、视觉验证挑战、复杂布局或文本快照…时特别有用。 | — |

## `clarify` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `clarify` | 当您在继续执行之前需要澄清、反馈或决策时，向用户提问。支持两种模式：1. **多项选择** — 提供最多 4 个选项。用户选择一个或通过第 5 个“其他”选项输入自己的答案。2.… | — |

## `code_execution` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `execute_code` | 运行一个可编程调用 Hermes 工具的 Python 脚本。当您需要 3 个或更多带有处理逻辑的工具调用时，或者需要过滤/减少大型工具输出进入您的上下文之前，或者需要条件分支（…）时使用。 | — |

## `cronjob` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `cronjob` | 统一的定时任务管理器。使用 `action="create"`、`"list"`、`"update"`、`"pause"`、`"resume"`、`"run"` 或 `"remove"` 来管理任务。支持带有一个或多个附加技能的技能支持任务，并在更新时，`skills=[]` 会清除附加的技能。Cron 任务在新的会话中运行，没有当前聊天上下文。 | — |

## `delegation` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `delegate_task` | 启动一个或多个子代理，在隔离的上下文中使用任务。每个子代理都有自己的对话、终端会话和工具集。只返回最终摘要——中间工具结果绝不会进入您的上下文窗口。TWO… | — |

## `file` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `patch` | 文件中的目标查找和替换编辑。在终端中使用此工具代替 sed/awk。使用模糊匹配（9 种策略），因此即使微小的空白/缩进差异也不会导致失败。返回一个统一的 diff。编辑后会自动运行语法检查… | — |
| `read_file` | 读取带有行号和分页的文本文件。在终端中使用此工具代替 cat/head/tail。输出格式：'行号\|内容'。如果找不到，会建议类似的文件名。对于大文件，请使用 offset 和 limit。注意：无法读取图片… | — |
| `search_files` | 搜索文件内容或按名称查找文件。在终端中使用此工具代替 grep/rg/find/ls。基于 Ripgrep，比 shell 等效工具更快。内容搜索 (target='content')：文件内的正则表达式搜索。输出模式：包含行号的完整匹配… | — |
| `write_file` | 将内容写入文件，完全替换现有内容。在终端中使用此工具代替 echo/cat heredoc。自动创建父目录。会**覆盖**整个文件——对于目标编辑，请使用 'patch'。 | — |

## `homeassistant` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `ha_call_service` | 调用 Home Assistant 服务来控制设备。使用 ha_list_services 发现每个域的可用服务及其参数。 | — |
| `ha_get_state` | 获取单个 Home Assistant 实体详细状态，包括所有属性（亮度、颜色、温度设定点、传感器读数等）。 | — |
| `ha_list_entities` | 列出 Home Assistant 实体。可选择按域（light, switch, climate, sensor, binary_sensor, cover, fan 等）或按区域名称（living room, kitchen, bedroom 等）进行过滤。 | — |
| `ha_list_services` | 列出用于设备控制的可用 Home Assistant 服务（动作）。显示了可以对每种设备类型执行哪些动作以及它们接受哪些参数。使用此工具发现如何控制通过 ha_list_entities 找到的设备。 | — |

:::note
**Honcho 工具** (`honcho_profile`, `honcho_search`, `honcho_context`, `honcho_reasoning`, `honcho_conclude`) 已不再内置。它们可通过 Honcho 内存提供程序插件在 `plugins/memory/honcho/` 访问。有关安装和使用，请参阅 [内存提供程序](../user-guide/features/memory-providers.md)。
:::

## `image_gen` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `image_generate` | 使用 FAL.ai 从文本提示生成高质量图像。底层模型由用户配置（默认：FLUX 2 Klein 9B，生成速度低于 1 秒），代理无法选择。返回单个图片 URL。使用…显示它。 | FAL_KEY |

## `memory` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `memory` | 将重要信息保存到持久内存中，该内存可在会话间保留。您的记忆会在会话开始时出现在您的系统提示中——这是您在对话期间记住用户和环境信息的方式。何时保存… | — |

## `messaging` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `send_message` | 向连接的消息平台发送消息，或列出可用目标。重要提示：当用户要求发送到特定的频道或个人（而不仅仅是裸平台名称）时，请首先调用 send_message(action='list') 查看可用的… | — |

## `moa` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `mixture_of_agents` | 通过多个前沿 LLM 协作处理难题。进行 5 次 API 调用（4 个参考模型 + 1 个聚合器），具有最大的推理努力——仅用于真正困难的问题。最适用于：复杂的数学、高级算法… | OPENROUTER_API_KEY |

## `rl` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `rl_check_status` | 获取训练运行的状态和指标。速率限制：对同一运行的检查强制执行 30 分钟的最小间隔。返回 WandB 指标：step, state, reward_mean, loss, percent_correct。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_edit_config` | 更新配置字段。首先使用 rl_get_current_config() 查看所选环境所有可用字段。每个环境都有不同的可配置选项。基础设施设置（tokenizer, URLs, lora_rank, learning_ra…） | TINKER_API_KEY, WANDB_API_KEY |
| `rl_get_current_config` | 获取当前的环境配置。仅返回可修改的字段：group_size, max_token_length, total_steps, steps_per_eval, use_wandb, wandb_name, max_num_workers。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_get_results` | 获取已完成训练运行的最终结果和指标。返回最终指标和训练权重路径。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_list_environments` | 列出所有可用的 RL 环境。返回环境名称、路径和描述。提示：使用文件工具读取 file_path 以了解每个环境的工作原理（验证器、数据加载、奖励）。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_list_runs` | 列出所有训练运行（活动和已完成）及其状态。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_select_environment` | 为训练选择一个 RL 环境。加载环境的默认配置。选择后，使用 rl_get_current_config() 查看设置，并使用 rl_edit_config() 修改它们。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_start_training` | 使用当前环境和配置启动新的 RL 训练运行。大多数训练参数（lora_rank, learning_rate 等）是固定的。在开始前，使用 rl_edit_config() 设置 group_size、batch_size、wandb_project。警告：训练… | TINKER_API_KEY, WANDB_API_KEY |
| `rl_stop_training` | 停止正在运行的训练任务。如果指标看起来不佳、训练停滞或您想尝试不同的设置时使用。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_test_inference` | 对任何环境的快速推理测试。使用 OpenRouter 运行几个推理步骤 + 评分。默认：3 步 x 16 个补全 = 每个模型的 48 个滚出，测试 3 个模型 = 144 个总计。测试环境加载、提示构建、… | TINKER_API_KEY, WANDB_API_KEY |

## `session_search` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `session_search` | 搜索您长期记忆中的过往对话。这是您的回忆——每个过往会话都是可搜索的，此工具总结了发生的事情。当您主动使用此工具时：- 用户说“我们之前做过这个”、“还记得上次…” | — |

## `skills` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `skill_manage` | 管理技能（创建、更新、删除）。技能是您的程序性记忆——可重复用于处理重复任务类型的方法。新技能放入 ~/.hermes/skills/；现有技能可以修改其所在位置。操作：create (完整的 SKILL.m… | — |
| `skill_view` | 技能允许加载有关特定任务和工作流程的信息，以及脚本和模板。加载技能的完整内容或访问其链接文件（参考、模板、脚本）。首次调用返回 SKILL.md 内容以及… | — |
| `skills_list` | 列出可用的技能（名称 + 描述）。使用 skill_view(name) 加载完整内容。 | — |

## `terminal` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `process` | 管理使用 terminal(background=true) 启动的后台进程。操作：'list' (显示所有)，'poll' (检查状态 + 新输出)，'log' (带分页的完整输出)，'wait' (阻塞直到完成或超时)，'kill' (终止)，'write' (发送…)。 | — |
| `terminal` | 在 Linux 环境上执行 shell 命令。文件系统在调用之间持久化。对于长时间运行的服务器，设置 `background=true`。设置 `notify_on_complete=true`（与 `background=true` 一起）可以在进程完成后获得自动通知——无需轮询。请勿使用 cat/head/tail——请使用 read_file。请勿使用 grep/rg/find——请使用 search_files。 | — |

## `todo` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `todo` | 管理当前会话的任务列表。用于具有 3 个或更多步骤的复杂任务，或用户提供多个任务时。不带参数调用以读取当前列表。写入：- 提供 'todos' 数组来创建/更新项目 - merge=… | — |

## `vision` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `vision_analyze` | 使用 AI 视觉分析图像。提供全面的描述，并回答有关图像内容的特定问题。 | — |

## `web` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `web_search` | 在网络上搜索任何主题的信息。返回最多 5 个包含标题、URL 和描述的相关结果。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |
| `web_extract` | 从网页 URL 提取内容。返回 markdown 格式的页面内容。也适用于 PDF URL——直接传递 PDF 链接即可转换为 markdown 文本。少于 5000 个字符的页面返回完整 markdown；更大的页面由 LLM 总结。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |

## `tts` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `text_to_speech` | 将文本转换为语音音频。返回一个 MEDIA: 路径，该路径由平台作为语音消息交付。在 Telegram 上，它播放为语音气泡；在 Discord/WhatsApp 上，它作为音频附件。在 CLI 模式下，保存到 ~/voice-memos/。语音和提供商… | — |