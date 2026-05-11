---
sidebar_position: 5
title: "预装技能目录"
description: "Hermes 智能体附带的预装技能目录"
---

# 预装技能目录

Hermes 在安装时会复制一个庞大的内置技能库到 `~/.hermes/skills/` 目录。下方列出的每项技能都链接到一个专门页面，包含其完整定义、设置和用法说明。

Hermes 还会在执行 `hermes update` 命令时同步预装技能，但同步清单会尊重本地删除和用户编辑。如果此处列出的技能在您个人配置的 `~/.hermes/skills/` 目录树中缺失，它仍然随附于 Hermes；您可以通过 `hermes skills reset <名称> --restore` 命令恢复它。

如果一项技能未在此列表中但存在于代码仓库中，目录将由 `website/scripts/generate-skill-docs.py` 重新生成。

## apple

| 技能 | 描述 | 路径 |
|------|------|------|
| [`apple-notes`](/docs/user-guide/skills/bundled/apple/apple-apple-notes) | 通过 memo CLI 管理 Apple 备忘录：创建、搜索、编辑。 | `apple/apple-notes` |
| [`apple-reminders`](/docs/user-guide/skills/bundled/apple/apple-apple-reminders) | 通过 remindctl 操作 Apple 提醒事项：添加、列出、完成。 | `apple/apple-reminders` |
| [`findmy`](/docs/user-guide/skills/bundled/apple/apple-findmy) | 通过 macOS 上的 FindMy.app 追踪 Apple 设备和 AirTag。 | `apple/findmy` |
| [`imessage`](/docs/user-guide/skills/bundled/apple/apple-imessage) | 在 macOS 上通过 imsg CLI 发送和接收 iMessage/短信。 | `apple/imessage` |
| [`macos-computer-use`](/docs/user-guide/skills/bundled/apple/apple-macos-computer-use) | 在后台操控 macOS 桌面 —— 截屏、鼠标操作、键盘输入、滚动、拖拽 —— 而不会抢占用户的光标、键盘焦点或工作区。适用于任何支持工具调用的模型。每当 `computer_use` 工具可用时，都应加载此技能。 | `apple/macos-computer-use` |

## autonomous-ai-agents

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code) | 将编码任务委派给 Claude Code CLI（功能开发和PR）。 | `autonomous-ai-agents/claude-code` |
| [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex) | 将编码任务委派给 OpenAI Codex CLI（功能开发和PR）。 | `autonomous-ai-agents/codex` |
| [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) | 配置、扩展或为 Hermes 智能体贡献代码。 | `autonomous-ai-agents/hermes-agent` |
| [`opencode`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-opencode) | 将编码任务委派给 OpenCode CLI（功能开发和PR审查）。 | `autonomous-ai-agents/opencode` |

## creative

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram) | 生成深色主题的 SVG 架构/云/基础设施图表，输出为 HTML。 | `creative/architecture-diagram` |
| [`ascii-art`](/docs/user-guide/skills/bundled/creative/creative-ascii-art) | ASCII 艺术：使用 pyfiglet、cowsay、boxes、image-to-ascii。 | `creative/ascii-art` |
| [`ascii-video`](/docs/user-guide/skills/bundled/creative/creative-ascii-video) | ASCII 视频：将视频/音频转换为彩色 ASCII MP4/GIF。 | `creative/ascii-video` |
| [`baoyu-comic`](/docs/user-guide/skills/bundled/creative/creative-baoyu-comic) | 知识漫画：教育类、传记类、教程类。 | `creative/baoyu-comic` |
| [`baoyu-infographic`](/docs/user-guide/skills/bundled/creative/creative-baoyu-infographic) | 信息图：21 种布局 x 21 种风格（信息图，可视化）。 | `creative/baoyu-infographic` |
| [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design) | 设计一次性 HTML 构件（登陆页、演示文稿、原型）。 | `creative/clausal-design` |
| [`comfyui`](/docs/user-guide/skills/bundled/creative/creative-comfyui) | 使用 ComfyUI 生成图像、视频和音频 —— 安装、启动、管理节点/模型、通过参数注入运行工作流。使用官方 comfy-cli 管理生命周期，使用直接的 REST/WebSocket API 执行。 | `creative/comfyui` |
| [`ideation`](/docs/user-guide/skills/bundled/creative/creative-creative-ideation) | 通过创意约束生成项目想法。 | `creative/creative-ideation` |
| [`design-md`](/docs/user-guide/skills/bundled/creative/creative-design-md) | 编写/验证/导出 Google 的 DESIGN.md 令牌规范文件。 | `creative/design-md` |
| [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw) | 手绘风格的 Excalidraw JSON 图表（架构、流程、序列图）。 | `creative/excalidraw` |
| [`humanizer`](/docs/user-guide/skills/bundled/creative/creative-humanizer) | 使文本更具人性化：去除 AI 痕迹，增加真实语感。 | `creative/humanizer` |
| [`manim-video`](/docs/user-guide/skills/bundled/creative/creative-manim-video) | Manim CE 动画：3Blue1Brown 风格的数学/算法视频。 | `creative/manim-video` |
| [`p5js`](/docs/user-guide/skills/bundled/creative/creative-p5js) | p5.js 草图：生成艺术、着色器、交互式、3D。 | `creative/p5js` |
| [`pixel-art`](/docs/user-guide/skills/bundled/creative/creative-pixel-art) | 像素艺术，使用时代调色板（NES、Game Boy、PICO-8）。 | `creative/pixel-art` |
| [`popular-web-designs`](/docs/user-guide/skills/bundled/creative/creative-popular-web-designs) | 54 个真实的设计系统（Stripe、Linear、Vercel），实现为 HTML/CSS。 | `creative/popular-web-designs` |
| [`pretext`](/docs/user-guide/skills/bundled/creative/creative-pretext) | 用于构建使用 @chengl/pretext 的创意浏览器演示 —— 无 DOM 的文本布局，用于 ASCII 艺术、围绕障碍物的文字排版流动、文本作为几何体的游戏、动态排版以及文本驱动的生成艺术。生成单文件 HT... | `creative/pretext` |
| [`sketch`](/docs/user-guide/skills/bundled/creative/creative-sketch) | 一次性 HTML 模型：2-3 种设计变体供比较。 | `creative/sketch` |
| [`songwriting-and-ai-music`](/docs/user-guide/skills/bundled/creative/creative-songwriting-and-ai-music) | 歌曲创作技巧与 Suno AI 音乐提示词。 | `creative/songwriting-and-ai-music` |
| [`touchdesigner-mcp`](/docs/user-guide/skills/bundled/creative/creative-touchdesigner-mcp) | 通过 twozero MCP 控制正在运行的 TouchDesigner 实例 —— 创建算子、设置参数、连线、执行 Python、构建实时视觉效果。包含 36 个原生工具。 | `creative/touchdesigner-mcp` |

## data-science

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`jupyter-live-kernel`](/docs/user-guide/skills/bundled/data-science/data-science-jupyter-live-kernel) | 通过实时 Jupyter 内核进行迭代式 Python 开发（hamelnb）。 | `data-science/jupyter-live-kernel` |

## devops

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`kanban-orchestrator`](/docs/user-guide/skills/bundled/devops/devops-kanban-orchestrator) | 分解策略与防错规则，用于编排器配置，该配置通过看板分配工作。“不要亲自执行工作”的规则和基本生命周期会自动注入到每个看板工作者的系统提示词中；此技能... | `devops/kanban-orchestrator` |
| [`kanban-worker`](/docs/user-guide/skills/bundled/devops/devops-kanban-worker) | Hermes 看板工作者的陷阱、示例和边缘情况。生命周期本身作为 KANBAN_GUIDANCE（来自 agent/prompt_builder.py）自动注入到每个工作者的系统提示词中；当你想了解更深入的细节时加载此技能... | `devops/kanban-worker` |
| [`webhook-subscriptions`](/docs/user-guide/skills/bundled/devops/devops-webhook-subscriptions) | Webhook 订阅：事件驱动的智能体运行。 | `devops/webhook-subscriptions` |

## dogfood

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`dogfood`](/docs/user-guide/skills/bundled/dogfood/dogfood-dogfood) | 对 Web 应用进行探索性 QA：寻找缺陷、收集证据、生成报告。 | `dogfood` |

## email

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`himalaya`](/docs/user-guide/skills/bundled/email/email-himalaya) | Himalaya CLI：从终端使用 IMAP/SMTP 收发邮件。 | `email/himalaya` |

## gaming

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`minecraft-modpack-server`](/docs/user-guide/skills/bundled/gaming/gaming-minecraft-modpack-server) | 搭建模组化 Minecraft 服务器（CurseForge，Modrinth）。 | `gaming/minecraft-modpack-server` |
| [`pokemon-player`](/docs/user-guide/skills/bundled/gaming/gaming-pokemon-player) | 通过无头模拟器 + RAM 读取来玩 Pokemon 游戏。 | `gaming/pokemon-player` |

## github

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`codebase-inspection`](/docs/user-guide/skills/bundled/github/github-codebase-inspection) | 使用 pygount 检查代码库：代码行数、语言统计、比例。 | `github/codebase-inspection` |
| [`github-auth`](/docs/user-guide/skills/bundled/github/github-github-auth) | GitHub 认证设置：HTTPS 令牌、SSH 密钥、gh CLI 登录。 | `github/github-auth` |
| [`github-code-review`](/docs/user-guide/skills/bundled/github/github-github-code-review) | 审查 PR：查看差异，通过 gh 或 REST 进行行内评论。 | `github/github-code-review` |
| [`github-issues`](/docs/user-guide/skills/bundled/github/github-github-issues) | 通过 gh 或 REST 创建、分类、打标签、分配 GitHub Issue。 | `github/github-issues` |
| [`github-pr-workflow`](/docs/user-guide/skills/bundled/github/github-github-pr-workflow) | GitHub PR 生命周期：分支、提交、发起、CI、合并。 | `github/github-pr-workflow` |
| [`github-repo-management`](/docs/user-guide/skills/bundled/github/github-github-repo-management) | 克隆/创建/复刻仓库；管理远程仓库、发布。 | `github/github-repo-management` |

## mcp

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`native-mcp`](/docs/user-guide/skills/bundled/mcp/mcp-native-mcp) | MCP 客户端：连接服务器，注册工具（stdio/HTTP）。 | `mcp/native-mcp` |

## media

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`gif-search`](/docs/user-guide/skills/bundled/media/media-gif-search) | 通过 curl + jq 从 Tenor 搜索/下载 GIF。 | `media/gif-search` |
| [`heartmula`](/docs/user-guide/skills/bundled/media/media-heartmula) | HeartMuLa：类似 Suno 的歌曲生成，基于歌词和标签。 | `media/heartmula` |
| [`songsee`](/docs/user-guide/skills/bundled/media/media-songsee) | 通过 CLI 分析音频频谱/特征（梅尔、色度、MFCC）。 | `media/songsee` |
| [`spotify`](/docs/user-guide/skills/bundled/media/media-spotify) | Spotify：播放、搜索、排队、管理播放列表和设备。 | `media/spotify` |
| [`youtube-content`](/docs/user-guide/skills/bundled/media/media-youtube-content) | 将 YouTube 转录文本转化为摘要、讨论串、博客文章。 | `media/youtube-content` |

## mlops

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`audiocraft-audio-generation`](/docs/user-guide/skills/bundled/mlops/mlops-models-audiocraft) | AudioCraft：MusicGen 文本生成音乐，AudioGen 文本生成音效。 | `mlops/models/audiocraft` |
| [`dspy`](/docs/user-guide/skills/bundled/mlops/mlops-research-dspy) | DSPy：声明式语言模型程序，自动优化提示词，检索增强生成。 | `mlops/research/dspy` |
| [`huggingface-hub`](/docs/user-guide/skills/bundled/mlops/mlops-huggingface-hub) | HuggingFace hf CLI：搜索/下载/上传模型、数据集。 | `mlops/huggingface-hub` |
| [`llama-cpp`](/docs/user-guide/skills/bundled/mlops/mlops-inference-llama-cpp) | llama.cpp 本地 GGUF 推理 + HuggingFace Hub 模型发现。 | `mlops/inference/llama-cpp` |
| [`evaluating-llms-harness`](/docs/user-guide/skills/bundled/mlops/mlops-evaluation-lm-evaluation-harness) | lm-eval-harness：评估大语言模型（MMLU、GSM8K 等）。 | `mlops/evaluation/lm-evaluation-harness` |
| [`obliteratus`](/docs/user-guide/skills/bundled/mlops/mlops-inference-obliteratus) | OBLITERATUS：消除大语言模型拒绝（均值差异法）。 | `mlops/inference/obliteratus` |
| [`segment-anything-model`](/docs/user-guide/skills/bundled/mlops/mlops-models-segment-anything) | SAM：通过点、框、掩码进行零样本图像分割。 | `mlops/models/segment-anything` |
| [`serving-llms-vllm`](/docs/user-guide/skills/bundled/mlops/mlops-inference-vllm) | vLLM：高吞吐量大语言模型服务，兼容 OpenAI API，支持量化。 | `mlops/inference/vllm` |
| [`weights-and-biases`](/docs/user-guide/skills/bundled/mlops/mlops-evaluation-weights-and-biases) | W&B：记录机器学习实验、超参数搜索、模型注册、仪表盘。 | `mlops/evaluation/weights-and-biases` |

## note-taking

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`obsidian`](/docs/user-guide/skills/bundled/note-taking/note-taking-obsidian) | 在 Obsidian 知识库中读取、搜索、创建和编辑笔记。 | `note-taking/obsidian` |

## productivity

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`airtable`](/docs/user-guide/skills/bundled/productivity/productivity-airtable) | 通过 curl 使用 Airtable REST API。记录增删改查、过滤、更新插入。 | `productivity/airtable` |
| [`google-workspace`](/docs/user-guide/skills/bundled/productivity/productivity-google-workspace) | 通过 gws CLI 或 Python 使用 Gmail、日历、云端硬盘、文档、表格。 | `productivity/google-workspace` |
| [`linear`](/docs/user-guide/skills/bundled/productivity/productivity-linear) | Linear：通过 GraphQL + curl 管理问题、项目、团队。 | `productivity/linear` |
| [`maps`](/docs/user-guide/skills/bundled/productivity/productivity-maps) | 通过 OpenStreetMap/OSRM 进行地理编码、兴趣点查询、路线规划、时区查询。 | `productivity/maps` |
| [`nano-pdf`](/docs/user-guide/skills/bundled/productivity/productivity-nano-pdf) | 通过 nano-pdf CLI（自然语言提示）编辑 PDF 文本/错别字/标题。 | `productivity/nano-pdf` |
| [`notion`](/docs/user-guide/skills/bundled/productivity/productivity-notion) | 通过 curl 使用 Notion API：页面、数据库、块、搜索。 | `productivity/notion` |
| [`ocr-and-documents`](/docs/user-guide/skills/bundled/productivity/productivity-ocr-and-documents) | 从 PDF/扫描件提取文本（pymupdf, marker-pdf）。 | `productivity/ocr-and-documents` |
| [`powerpoint`](/docs/user-guide/skills/bundled/productivity/productivity-powerpoint) | 创建、读取、编辑 .pptx 演示文稿、幻灯片、备注、模板。 | `productivity/powerpoint` |
| [`teams-meeting-pipeline`](/docs/user-guide/skills/bundled/productivity/productivity-teams-meeting-pipeline) | 通过 Hermes CLI 操作 Teams 会议摘要管道 —— 总结会议、检查管道状态、重播作业、管理 Microsoft Graph 订阅。 | `productivity/teams-meeting-pipeline` |

## red-teaming

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`godmode`](/docs/user-guide/skills/bundled/red-teaming/red-teaming-godmode) | 越狱大语言模型：蛇佬腔、GODMODE、ULTRAPLINIAN。 | `red-teaming/godmode` |

## research

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv) | 按关键词、作者、类别或 ID 搜索 arXiv 论文。 | `research/arxiv` |
| [`blogwatcher`](/docs/user-guide/skills/bundled/research/research-blogwatcher) | 通过 blogwatcher-cli 工具监控博客和 RSS/Atom 订阅源。 | `research/blogwatcher` |
| [`llm-wiki`](/docs/user-guide/skills/bundled/research/research-llm-wiki) | Karpathy 的 LLM Wiki：构建/查询相互链接的 Markdown 知识库。 | `research/llm-wiki` |
| [`polymarket`](/docs/user-guide/skills/bundled/research/research-polymarket) | 查询 Polymarket：市场、价格、订单簿、历史数据。 | `research/polymarket` |
| [`research-paper-writing`](/docs/user-guide/skills/bundled/research/research-research-paper-writing) | 为 NeurIPS/ICML/ICLR 撰写机器学习论文：从设计到提交。 | `research/research-paper-writing` |

## smart-home

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`openhue`](/docs/user-guide/skills/bundled/smart-home/smart-home-openhue) | 通过 OpenHue CLI 控制 Philips Hue 灯光、场景、房间。 | `smart-home/openhue` |

## social-media

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`xurl`](/docs/user-guide/skills/bundled/social-media/social-media-xurl) | 通过 xurl CLI 使用 X/Twitter：发帖、搜索、私信、媒体、v2 API。 | `social-media/xurl` |

## software-development

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`debugging-hermes-tui-commands`](/docs/user-guide/skills/bundled/software-development/software-development-debugging-hermes-tui-commands) | 调试 Hermes TUI 斜杠命令：Python、网关、Ink UI。 | `software-development/debugging-hermes-tui-commands` |
| [`hermes-agent-skill-authoring`](/docs/user-guide/skills/bundled/software-development/software-development-hermes-agent-skill-authoring) | 编写仓库内 SKILL.md：前置数据、验证器、结构。 | `software-development/hermes-agent-skill-authoring` |
| [`node-inspect-debugger`](/docs/user-guide/skills/bundled/software-development/software-development-node-inspect-debugger) | 通过 --inspect + Chrome DevTools Protocol CLI 调试 Node.js。 | `software-development/node-inspect-debugger` |
| [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan) | 计划模式：将 Markdown 计划写入 .hermes/plans/，不执行。 | `software-development/plan` |
| [`python-debugpy`](/docs/user-guide/skills/bundled/software-development/software-development-python-debugpy) | 调试 Python：pdb REPL + debugpy 远程调试（DAP）。 | `software-development/python-debugpy` |
| [`requesting-code-review`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review) | 提交前审查：安全扫描、质量门禁、自动修复。 | `software-development/requesting-code-review` |
| [`spike`](/docs/user-guide/skills/bundled/software-development/software-development-spike) | 一次性实验，在构建前验证想法。 | `software-development/spike` |
| [`subagent-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-subagent-driven-development) | 通过 delegate_task 子智能体执行计划（两阶段审查）。 | `software-development/subagent-driven-development` |
| [`systematic-debugging`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging) | 四阶段根因调试：修复前理解错误。 | `software-development/systematic-debugging` |
| [`test-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development) | TDD：强制执行“红-绿-重构”，代码前写测试。 | `software-development/test-driven-development` |
| [`writing-plans`](/docs/user-guide/skills/bundled/software-development/software-development-writing-plans) | 编写实施计划：小任务、路径、代码。 | `software-development/writing-plans` |

## yuanbao

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`yuanbao`](/docs/user-guide/skills/bundled/yuanbao/yuanbao-yuanbao) | 元宝（元宝）群组：@提及用户，查询信息/成员。 | `yuanbao` |