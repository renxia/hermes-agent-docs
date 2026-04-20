---
sidebar_position: 3
title: "内置工具参考"
description: "Hermes 内置工具的权威参考，按工具集分组"
---

# 内置工具参考

本页面记录了 Hermes 工具注册表中全部 53 个内置工具，并按工具集进行了分组。可用性因平台、凭据和启用的工具集而异。

**快速统计：** 11 个浏览器工具、4 个文件工具、10 个 RL 工具、4 个 Home Assistant 工具、2 个终端工具、2 个网页工具、5 个飞书工具，以及其他工具集中的 15 个独立工具。

:::tip MCP 工具
除了内置工具外，Hermes 还可以从 MCP 服务器动态加载工具。MCP 工具会带有服务器名称前缀（例如 `github_create_issue` 表示 `github` MCP 服务器）。有关配置信息，请参见 [MCP 集成](/docs/user-guide/features/mcp)。
:::

## `browser` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `browser_back` | 在浏览器历史记录中返回到上一页。需要先调用 browser_navigate。 | — |
| `browser_cdp` | 发送原始的 Chrome DevTools Protocol (CDP) 命令。用于处理 browser_navigate、browser_click、browser_console 等未涵盖的浏览器操作。仅在会话开始时 CDP 端点可达时可用 —— 通过 `/browser connect` 或 `browser.cdp_url` 配置。详见 https://chromedevtools.github.io/devtools-protocol/ | — |
| `browser_click` | 点击快照中标识为 ref ID 的元素（例如 '@e5'）。ref ID 显示在快照输出的方括号中。需要先调用 browser_navigate 和 browser_snapshot。 | — |
| `browser_console` | 获取当前页面的浏览器控制台输出和 JavaScript 错误。返回 console.log/warn/error/info 消息和无捕获的 JS 异常。用于检测静默 JavaScript 错误、失败的 API 调用和应用警告。需要… | — |
| `browser_get_images` | 获取当前页面上所有图像的 URL 和 alt 文本列表。可用于查找要用 vision 工具分析的图像。需要先调用 browser_navigate。 | — |
| `browser_navigate` | 在浏览器中导航到 URL。初始化会话并加载页面。必须先调用此工具才能使用其他浏览器工具。对于简单的信息检索，优先使用 web_search 或 web_extract（更快、更便宜）。当您需要… | — |
| `browser_press` | 按下键盘键。用于提交表单（Enter）、导航（Tab）或键盘快捷键。需要先调用 browser_navigate。 | — |
| `browser_scroll` | 按方向滚动页面。使用此工具揭示当前视口下方或上方的更多内容。需要先调用 browser_navigate。 | — |
| `browser_snapshot` | 获取当前页面无障碍树的基于文本的快照。返回带有 ref ID（如 @e1、@e2）的可交互元素，供 browser_click 和 browser_type 使用。full=false（默认值）：紧凑视图，包含可交互元素。full=true：完整… | — |
| `browser_type` | 将文本输入到由 ref ID 标识的输入字段中。先清除字段，然后输入新文本。需要先调用 browser_navigate 和 browser_snapshot。 | — |
| `browser_vision` | 对当前页面截图并使用视觉 AI 进行分析。当您需 visually 理解页面上内容时使用此工具 —— 尤其适用于验证码、视觉验证挑战、复杂布局，或者当文本快照… | — |

## `clarify` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `clarify` | 当您需要澄清、反馈或决策时，向用户提问。支持两种模式：1. **多项选择** —— 提供最多 4 个选项。用户选择一个或输入自己的答案，通过第 5 个“其他”选项。2.… | — |

## `code_execution` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `execute_code` | 运行可以编程调用 Hermes 工具的 Python 脚本。当您需要 3 次以上工具调用并在其间进行逻辑处理，需要过滤/减少大量工具输出后再进入上下文，需要条件分支（… | — |

## `cronjob` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `cronjob` | 统一计划任务管理器。使用 `action="create"`、`"list"`、`"update"`、`"pause"`、`"resume"`、`"run"` 或 `"remove"` 管理作业。支持技能支持的作业，附加一个或多个技能，并在更新时使用 `skills=[]` 清除附加技能。Cron 运行在没有任何当前聊天上下文的全新会话中进行。 | — |

## `delegation` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `delegate_task` | 生成一个或多个子代理，在隔离的上下文中处理任务。每个子代理都有自己的对话、终端会话和工具集。仅返回最终摘要 —— 中间工具结果永远不会进入您的上下文窗口。TWO… | — |

## `feishu_doc` 工具集

范围限定于飞书文档评论智能回复处理器 (`gateway/platforms/feishu_comment.py`)。未在 `hermes-cli` 或常规飞书聊天适配器中公开。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `feishu_doc_read` | 读取给定 file_type 和 token 的飞书/Lark 文档（Docx、Doc 或 Sheet）的完整文本内容。 | 飞书应用凭据 |

## `feishu_drive` 工具集

范围限定于飞书文档评论处理器。驱动对驱动器文件的评论读写操作。

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `feishu_drive_add_comment` | 在飞书/Lark 文档或文件上添加顶级评论。 | 飞书应用凭据 |
| `feishu_drive_list_comments` | 列出飞书/Lark 文件的整个文档评论，最新的在前。 | 飞书应用凭据 |
| `feishu_drive_list_comment_replies` | 列出特定飞书评论线程（整个文档或局部选择）的回复。 | 飞书应用凭据 |
| `feishu_drive_reply_comment` | 在飞书评论线程上发布回复，可选择 `@`-提及。 | 飞书应用凭据 |

## `file` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `patch` | 文件中的定向查找和替换编辑。与终端中的 sed/awk 相比，使用此工具。使用模糊匹配（9 种策略），因此轻微的空白/缩进差异不会破坏它。返回统一差异。编辑后自动运行语法检查… | — |
| `read_file` | 带行号和分页读取文本文件。与终端中的 cat/head/tail 相比，使用此工具。输出格式：'LINE_NUM\|CONTENT'。如果未找到，建议相似的 filenames。对大文件使用 offset 和 limit。注意：无法读取图像 o… | — |
| `search_files` | 搜索文件内容或按名称查找文件。与终端中的 grep/rg/find/ls 相比，使用此工具。基于 Ripgrep，比 shell 等效工具更快。内容搜索（target='content'）：在文件中正则表达式搜索。输出模式：完整匹配行… | — |
| `write_file` | 将内容写入文件，完全替换现有内容。与终端中的 echo/cat heredoc 相比，使用此工具。自动创建父目录。覆盖整个文件 —— 使用 'patch' 进行定向编辑。 | — |

## `homeassistant` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `ha_call_service` | 调用 Home Assistant 服务控制设备。使用 ha_list_services 发现每个域可用的服务和参数。 | — |
| `ha_get_state` | 获取单个 Home Assistant 实体的详细状态，包括所有属性（亮度、颜色、温度设定点、传感器读数等）。 | — |
| `ha_list_entities` | 列出 Home Assistant 实体。可按域（light、switch、climate、sensor、binary_sensor、cover、fan 等）或区域名称（living room、kitchen、bedroom 等）筛选。 | — |
| `ha_list_services` | 列出可用的 Home Assistant 服务（操作）以控制设备。显示每个设备类型可执行的操作及其接受的参数。使用此工具发现如何通过 ha_list_entities 控制的设备。 | — |

:::note
**Honcho 工具**（`honcho_profile`、`honcho_search`、`honcho_context`、`honcho_reasoning`、`honcho_conclude`）不再是内置工具。它们通过 Honcho 内存提供者插件在 `plugins/memory/honcho/` 中提供。有关安装和使用的信息，请参见 [内存提供者](../user-guide/features/memory-providers.md)。
:::

## `image_gen` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `image_generate` | 使用 FAL.ai 从文本提示生成高质量图像。底层模型由用户配置（默认：FLUX 2 Klein 9B，生成时间少于 1 秒），代理不可选择。返回单个图像 URL。使用…显示它 | FAL_KEY |

## `memory` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `memory` | 将重要信息保存到跨会话持久内存中。您的记忆出现在会话开始时的系统提示中 —— 这是您在对话之间记住用户和环境信息的方式。何时保存… | — |

## `messaging` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `send_message` | 向连接的消息平台发送消息，或列出可用目标。重要：当用户要求发送到特定频道或个人（不仅仅是裸平台名称）时，首先调用 send_message(action='list') 查看可用 tar… | — |

## `moa` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `mixture_of_agents` | 通过多个前沿语言模型协作路由困难问题。进行 5 次 API 调用（4 个参考模型 + 1 个聚合器），最大推理努力 —— 仅对真正困难的问题谨慎使用。最适合：复杂数学、高级算法… | OPENROUTER_API_KEY |

## `rl` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `rl_check_status` | 获取训练运行的狀態和指标。速率限制：对同一运行强制执行 30 分钟的最小检查间隔。返回 WandB 指标：step、state、reward_mean、loss、percent_correct。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_edit_config` | 更新配置字段。首先使用 rl_get_current_config() 查看所有所选环境的可用字段。每个环境都有不同的可配置选项。基础设施设置（tokenizer、URLs、lora_rank、learning_ra… | TINKER_API_KEY, WANDB_API_KEY |
| `rl_get_current_config` | 获取当前环境配置。仅返回可修改的字段：group_size、max_token_length、total_steps、steps_per_eval、use_wandb、wandb_name、max_num_workers。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_get_results` | 获取已完成训练运行的最终结果和指标。返回最终指标和训练权重的路径。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_list_environments` | 列出所有可用的 RL 环境。返回环境名称、路径和描述。提示：使用 file 工具读取 file_path 了解每个环境的工作原理（验证器、数据加载、奖励）。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_list_runs` | 列出所有训练运行（活动和已完成）及其状态。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_select_environment` | 选择用于训练的 RL 环境。加载环境的默认配置。选择后，使用 rl_get_current_config() 查看设置并使用 rl_edit_config() 修改它们。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_start_training` | 使用当前环境和配置启动新的 RL 训练运行。大多数训练参数（lora_rank、learning_rate 等）是固定的。在启动前使用 rl_edit_config() 设置 group_size、batch_size、wandb_project。警告：训练… | TINKER_API_KEY, WANDB_API_KEY |
| `rl_stop_training` | 停止正在运行的训练作业。如果指标看起来不好、训练停滞或想尝试不同设置时使用。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_test_inference` | 任何环境的快速推理测试。使用 OpenRouter 运行几轮推理+评分。默认：3 步 x 16 次完成 = 每模型 48 次 rollout，测试 3 个模型 = 总共 144 次。测试环境加载、提示构建、in… | TINKER_API_KEY, WANDB_API_KEY |

## `session_search` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `session_search` | 搜索您过去对话的长时记忆。这是您的回忆 —— 每个过去的会话都可搜索，此工具总结发生了什么。主动使用：当用户说 '我们之前做过这个'、'记得什么时候'、'上次… | — |

## `skills` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `skill_manage` | 管理技能（创建、更新、删除）。技能是您的程序性记忆 —— 用于重复任务类型的可重用方法。新技能转到 ~/.hermes/skills/；现有技能可在其所在位置修改。操作：create (full SKILL.m… | — |
| `skill_view` | 技能允许加载关于特定任务和流程的信息以及脚本和模板。加载技能的完整内容或访问其链接的文件（引用、模板、脚本）。首次调用返回 SKILL.md 内容加… | — |
| `skills_list` | 列出可用技能（名称+描述）。使用 skill_view(name) 加载完整内容。 | — |

## `terminal` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `process` | 管理与 terminal(background=true) 启动的后台进程。操作：'list'（显示所有）、'poll'（检查状态+新输出）、'log'（完整输出带分页）、'wait'（阻塞直到完成或超时）、'kill'（终止）、'write'（sen… | — |
| `terminal` | 在 Linux 环境中执行 shell 命令。文件系统在各次调用间保持持久化。设置 `background=true` 用于长时间运行的服务器。设置 `notify_on_complete=true`（与 `background=true` 一起）在进程完成时自动通知 —— 无需轮询。不要使用 cat/head/tail —— 使用 read_file。不要使用 grep/rg/find —— 使用 search_files。 | — |

## `todo` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `todo` | 管理当前会话的任务列表。用于步骤超过 3 步的复杂任务或用户提供多个任务时。不带参数调用以读取当前列表。写入：- 提供 'todos' 数组创建/更新项目 - merge=… | — |

## `vision` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `vision_analyze` | 使用 AI 视觉分析图像。提供全面的描述并回答关于图像内容的特定问题。 | — |

## `web` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `web_search` | 为任何主题搜索网络信息。返回最多 5 个相关结果，包含标题、URL 和描述。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |
| `web_extract` | 从网页 URL 提取内容。以 markdown 格式返回页面内容。也可用于 PDF URL —— 直接传递 PDF 链接并将其转换为 markdown 文本。小于 5000 字符的页面返回完整 markdown；较大的页面由 LLM 总结。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |

## `tts` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `text_to_speech` | 将文本转换为语音音频。返回 MEDIA: 路径，平台将其作为语音消息传递。在 Telegram 上播放为语音气泡，在 Discord/WhatsApp 上为音频附件。在 CLI 模式下，保存到 ~/voice-memos/。语音和提供者… | — |