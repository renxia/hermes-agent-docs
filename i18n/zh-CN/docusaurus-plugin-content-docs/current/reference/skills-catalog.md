---
sidebar_position: 5
title: "捆绑技能目录"
description: "Hermes智能体附带的捆绑技能目录"
---

# 捆绑技能目录

Hermes附带了一个庞大的内置技能库，安装时会复制到 `~/.hermes/skills/` 目录下。以下每个技能都链接到一个专门页面，包含其完整定义、设置和用法。

Hermes也会在执行 `hermes update` 命令时同步捆绑技能，但同步清单会尊重本地删除和用户编辑。如果此处列出的某个技能在您个人配置的 `~/.hermes/skills/` 目录树中缺失，它仍然随Hermes提供；可以使用 `hermes skills reset <name> --restore` 命令来恢复它。

如果一个技能在此列表中缺失但在仓库中存在，该目录会通过 `website/scripts/generate-skill-docs.py` 脚本重新生成。

## apple

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`apple-notes`](/user-guide/skills/bundled/apple/apple-apple-notes) | 通过memo CLI管理Apple Notes：创建、搜索、编辑。 | `apple/apple-notes` |
| [`apple-reminders`](/user-guide/skills/bundled/apple/apple-apple-reminders) | 通过remindctl使用Apple Reminders：添加、列出、完成。 | `apple/apple-reminders` |
| [`findmy`](/user-guide/skills/bundled/apple/apple-findmy) | 在macOS上通过FindMy.app追踪Apple设备/AirTags。 | `apple/findmy` |
| [`imessage`](/user-guide/skills/bundled/apple/apple-imessage) | 在macOS上通过imsg CLI发送和接收iMessage/SMS。 | `apple/imessage` |
| [`macos-computer-use`](/user-guide/skills/bundled/apple/apple-macos-computer-use) | 在后台控制macOS桌面——截屏、鼠标、键盘、滚动、拖拽——而不抢占用户的光标、键盘焦点或空间。适用于任何具备工具能力的模型。每当 `computer_use` 工具...时加载此技能。 | `apple/macos-computer-use` |

## 自主式人工智能智能体

| 技能 | 描述 | 路径 |
|------|------|------|
| [`claude-code`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code) | 将编码工作委托给 Claude Code CLI（功能开发、PR）。 | `autonomous-ai-agents/claude-code` |
| [`codex`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex) | 将编码工作委托给 OpenAI Codex CLI（功能开发、PR）。 | `autonomous-ai-agents/codex` |
| [`hermes-agent`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) | 配置、扩展或贡献 Hermes 智能体。 | `autonomous-ai-agents/hermes-agent` |
| [`opencode`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-opencode) | 将编码工作委托给 OpenCode CLI（功能开发、PR 审查）。 | `autonomous-ai-agents/opencode` |

## 创意

| 技能 | 描述 | 路径 |
|------|------|------|
| [`architecture-diagram`](/user-guide/skills/bundled/creative/creative-architecture-diagram) | 深色主题的 SVG 架构图/云/基础设施图，以 HTML 形式呈现。 | `creative/architecture-diagram` |
| [`ascii-art`](/user-guide/skills/bundled/creative/creative-ascii-art) | ASCII 艺术：pyfiglet、cowsay、boxes、图像转 ASCII。 | `creative/ascii-art` |
| [`ascii-video`](/user-guide/skills/bundled/creative/creative-ascii-video) | ASCII 视频：将视频/音频转换为彩色 ASCII 的 MP4/GIF。 | `creative/ascii-video` |
| [`baoyu-article-illustrator`](/user-guide/skills/bundled/creative/creative-baoyu-article-illustrator) | 文章配图：类型 × 风格 × 调色板保持一致性。 | `creative/baoyu-article-illustrator` |
| [`baoyu-comic`](/user-guide/skills/bundled/creative/creative-baoyu-comic) | 知识漫画：教育性、传记、教程。 | `creative/baoyu-comic` |
| [`baoyu-infographic`](/user-guide/skills/bundled/creative/creative-baoyu-infographic) | 信息图：21 种布局 × 21 种风格（信息图、可视化）。 | `creative/baoyu-infographic` |
| [`claude-design`](/user-guide/skills/bundled/creative/creative-claude-design) | 设计一次性 HTML 作品（落地页、演示文稿、原型）。 | `creative/claude-design` |
| [`comfyui`](/user-guide/skills/bundled/creative/creative-comfyui) | 使用 ComfyUI 生成图像、视频和音频 — 安装、启动、管理节点/模型，通过参数注入运行工作流。使用官方 comfy-cli 进行生命周期管理，并通过直接的 REST/WebSocket API 执行操作。 | `creative/comfyui` |
| [`ideation`](/user-guide/skills/bundled/creative/creative-creative-ideation) | 通过创意约束生成项目想法。 | `creative/creative-ideation` |
| [`design-md`](/user-guide/skills/bundled/creative/creative-design-md) | 编写/验证/导出 Google 的 DESIGN.md 规范文件。 | `creative/design-md` |
| [`excalidraw`](/user-guide/skills/bundled/creative/creative-excalidraw) | 手绘风格的 Excalidraw JSON 图表（架构、流程、时序）。 | `creative/excalidraw` |
| [`humanizer`](/user-guide/skills/bundled/creative/creative-humanizer) | 人性化文本：去除 AI 痕迹，增加真实感。 | `creative/humanizer` |
| [`manim-video`](/user-guide/skills/bundled/creative/creative-manim-video) | Manim CE 动画：3Blue1Brown 风格的数学/算法视频。 | `creative/manim-video` |
| [`p5js`](/user-guide/skills/bundled/creative/creative-p5js) | p5.js 草图：生成艺术、着色器、交互式、3D。 | `creative/p5js` |
| [`pixel-art`](/user-guide/skills/bundled/creative/creative-pixel-art) | 像素艺术，配有时代调色板（NES、Game Boy、PICO-8）。 | `creative/pixel-art` |
| [`popular-web-designs`](/user-guide/skills/bundled/creative/creative-popular-web-designs) | 54 个真实设计系统（Stripe、Linear、Vercel）的 HTML/CSS 实现。 | `creative/popular-web-designs` |
| [`pretext`](/user-guide/skills/bundled/creative/creative-pretext) | 在构建创意浏览器演示时使用 @chenglou/pretext — 用于 ASCII 艺术的无 DOM 文本布局、围绕障碍物的排版流动、文本作为几何图形的游戏、动态排版以及文本驱动的生成艺术。生成单文件 HT... | `creative/pretext` |
| [`sketch`](/user-guide/skills/bundled/creative/creative-sketch) | 临时 HTML 模型：提供 2-3 个设计变体以供比较。 | `creative/sketch` |
| [`songwriting-and-ai-music`](/user-guide/skills/bundled/creative/creative-songwriting-and-ai-music) | 歌曲创作技巧与 Suno AI 音乐提示。 | `creative/songwriting-and-ai-music` |
| [`touchdesigner-mcp`](/user-guide/skills/bundled/creative/creative-touchdesigner-mcp) | 通过 twozero MCP 控制正在运行的 TouchDesigner 实例 — 创建算子、设置参数、连接线路、执行 Python、构建实时视觉效果。包含 36 个原生工具。 | `creative/touchdesigner-mcp` |

## 数据科学

| 技能 | 描述 | 路径 |
|------|------|------|
| [`jupyter-live-kernel`](/user-guide/skills/bundled/data-science/data-science-jupyter-live-kernel) | 通过实时 Jupyter 内核进行迭代式 Python 开发（hamelnb）。 | `data-science/jupyter-live-kernel` |

## 运维开发

| 技能 | 描述 | 路径 |
|------|------|------|
| [`kanban-orchestrator`](/user-guide/skills/bundled/devops/devops-kanban-orchestrator) | 面向编排器的分解策略与防干扰规则，用于通过看板路由工作。其"不要自己动手做工作"的规则和基本生命周期会被自动注入每个看板工作者的系统提示中；此技能... | `devops/kanban-orchestrator` |
| [`kanban-worker`](/user-guide/skills/bundled/devops/devops-kanban-worker) | 针对 Hermes 看板工作者的常见陷阱、示例和边界情况。生命周期本身会作为 KANBAN_GUIDANCE（来自 agent/prompt_builder.py）自动注入到每个工作者的系统提示中；此技能用于你需要更深入了解...时加载 | `devops/kanban-worker` |
| [`webhook-subscriptions`](/user-guide/skills/bundled/devops/devops-webhook-subscriptions) | Webhook 订阅：事件驱动的智能体运行。 | `devops/webhook-subscriptions` |

## 内部测试（Dogfood）

| 技能 | 描述 | 路径 |
|------|------|------|
| [`dogfood`](/user-guide/skills/bundled/dogfood/dogfood-dogfood) | 对 Web 应用进行探索性 QA：查找 Bug、收集证据、生成报告。 | `dogfood` |

## 邮件

| 技能 | 描述 | 路径 |
|------|------|------|
| [`himalaya`](/user-guide/skills/bundled/email/email-himalaya) | Himalaya CLI：从终端收发 IMAP/SMTP 邮件。 | `email/himalaya` |

## 游戏

| 技能 | 描述 | 路径 |
|------|------|------|
| [`minecraft-modpack-server`](/user-guide/skills/bundled/gaming/gaming-minecraft-modpack-server) | 托管模组化 Minecraft 服务器（CurseForge、Modrinth）。 | `gaming/minecraft-modpack-server` |
| [`pokemon-player`](/user-guide/skills/bundled/gaming/gaming-pokemon-player) | 通过无头模拟器和内存读取来玩 Pokemon 游戏。 | `gaming/pokemon-player` |

## GitHub

| 技能 | 描述 | 路径 |
|------|------|------|
| [`codebase-inspection`](/user-guide/skills/bundled/github/github-codebase-inspection) | 使用 pygount 检查代码库：代码行数、语言、比例。 | `github/codebase-inspection` |
| [`github-auth`](/user-guide/skills/bundled/github/github-github-auth) | GitHub 认证设置：HTTPS 令牌、SSH 密钥、gh CLI 登录。 | `github/github-auth` |
| [`github-code-review`](/user-guide/skills/bundled/github/github-github-code-review) | 审查 PR：差异分析、通过 gh 或 REST 添加行内评论。 | `github/github-code-review` |
| [`github-issues`](/user-guide/skills/bundled/github/github-github-issues) | 通过 gh 或 REST 创建、分类、标记、分配 GitHub Issues。 | `github/github-issues` |
| [`github-pr-workflow`](/user-guide/skills/bundled/github/github-github-pr-workflow) | GitHub PR 生命周期：分支、提交、发起、CI、合并。 | `github/github-pr-workflow` |
| [`github-repo-management`](/user-guide/skills/bundled/github/github-github-repo-management) | 克隆/创建/复刻仓库；管理远程仓库、发布版本。 | `github/github-repo-management` |

## MCP

| 技能 | 描述 | 路径 |
|------|------|------|
| [`native-mcp`](/user-guide/skills/bundled/mcp/mcp-native-mcp) | MCP 客户端：连接服务器、注册工具（stdio/HTTP）。 | `mcp/native-mcp` |

## 媒体

| 技能 | 描述 | 路径 |
|------|------|------|
| [`gif-search`](/user-guide/skills/bundled/media/media-gif-search) | 通过 curl + jq 从 Tenor 搜索/下载 GIF。 | `media/gif-search` |
| [`heartmula`](/user-guide/skills/bundled/media/media-heartmula) | HeartMuLa：根据歌词和标签生成类似 Suno 的歌曲。 | `media/heartmula` |
| [`songsee`](/user-guide/skills/bundled/media/media-songsee) | 音频频谱图/特征（梅尔、色度、MFCC）通过 CLI 生成。 | `media/songsee` |
| [`spotify`](/user-guide/skills/bundled/media/media-spotify) | Spotify：播放、搜索、加入队列、管理播放列表和设备。 | `media/spotify` |
| [`youtube-content`](/user-guide/skills/bundled/media/media-youtube-content) | 将 YouTube 转录文本转换为摘要、话题帖、博客文章。 | `media/youtube-content` |

## mlops

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`audiocraft-audio-generation`](/user-guide/skills/bundled/mlops/mlops-models-audiocraft) | AudioCraft：MusicGen文本生成音乐，AudioGen文本生成声音。 | `mlops/models/audiocraft` |
| [`dspy`](/user-guide/skills/bundled/mlops/mlops-research-dspy) | DSPy：声明式语言模型程序，自动优化提示，检索增强生成。 | `mlops/research/dspy` |
| [`huggingface-hub`](/user-guide/skills/bundled/mlops/mlops-huggingface-hub) | HuggingFace hf CLI：搜索/下载/上传模型、数据集。 | `mlops/huggingface-hub` |
| [`llama-cpp`](/user-guide/skills/bundled/mlops/mlops-inference-llama-cpp) | llama.cpp 本地GGUF推理 + HF Hub模型发现。 | `mlops/inference/llama-cpp` |
| [`evaluating-llms-harness`](/user-guide/skills/bundled/mlops/mlops-evaluation-lm-evaluation-harness) | lm-eval-harness：基准测试LLM（MMLU，GSM8K等）。 | `mlops/evaluation/lm-evaluation-harness` |
| [`obliteratus`](/user-guide/skills/bundled/mlops/mlops-inference-obliteratus) | OBLITERATUS：通过差异均值法消除LLM的拒绝倾向。 | `mlops/inference/obliteratus` |
| [`segment-anything-model`](/user-guide/skills/bundled/mlops/mlops-models-segment-anything) | SAM：通过点、框、掩码进行零样本图像分割。 | `mlops/models/segment-anything` |
| [`serving-llms-vllm`](/user-guide/skills/bundled/mlops/mlops-inference-vllm) | vLLM：高吞吐量LLM服务，兼容OpenAI API，支持量化。 | `mlops/inference/vllm` |
| [`weights-and-biases`](/user-guide/skills/bundled/mlops/mlops-evaluation-weights-and-biases) | W&B：记录机器学习实验、超参数调优、模型注册表、仪表板。 | `mlops/evaluation/weights-and-biases` |

## 笔记记录

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`obsidian`](/user-guide/skills/bundled/note-taking/note-taking-obsidian) | 读取、搜索、创建和编辑Obsidian笔记库中的笔记。 | `note-taking/obsidian` |

## 生产力

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`airtable`](/user-guide/skills/bundled/productivity/productivity-airtable) | 通过curl使用Airtable REST API。记录增删改查、筛选、更新插入。 | `productivity/airtable` |
| [`google-workspace`](/user-guide/skills/bundled/productivity/productivity-google-workspace) | 通过gws CLI或Python操作Gmail、日历、云端硬盘、文档、表格。 | `productivity/google-workspace` |
| [`linear`](/user-guide/skills/bundled/productivity/productivity-linear) | Linear：通过GraphQL + curl管理问题、项目、团队。 | `productivity/linear` |
| [`maps`](/user-guide/skills/bundled/productivity/productivity-maps) | 通过OpenStreetMap/OSRM进行地理编码、兴趣点查询、路线规划、时区查询。 | `productivity/maps` |
| [`nano-pdf`](/user-guide/skills/bundled/productivity/productivity-nano-pdf) | 通过nano-pdf CLI（自然语言提示）编辑PDF文本/错误/标题。 | `productivity/nano-pdf` |
| [`notion`](/user-guide/skills/bundled/productivity/productivity-notion) | Notion API + ntn CLI：页面、数据库、Markdown、Workers。 | `productivity/notion` |
| [`ocr-and-documents`](/user-guide/skills/bundled/productivity/productivity-ocr-and-documents) | 从PDF/扫描件中提取文本（pymupdf，marker-pdf）。 | `productivity/ocr-and-documents` |
| [`powerpoint`](/user-guide/skills/bundled/productivity/productivity-powerpoint) | 创建、读取、编辑.pptx演示文稿、幻灯片、备注、模板。 | `productivity/powerpoint` |
| [`teams-meeting-pipeline`](/user-guide/skills/bundled/productivity/productivity-teams-meeting-pipeline) | 通过Hermes CLI操作Teams会议摘要流程——总结会议、检查流程状态、重放作业、管理Microsoft Graph订阅。 | `productivity/teams-meeting-pipeline` |

## 红队测试

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`godmode`](/user-guide/skills/bundled/red-teaming/red-teaming-godmode) | 突破LLM限制：蛇佬腔、GODMODE、ULTRAPLINIAN。 | `red-teaming/godmode` |

## 研究

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`arxiv`](/user-guide/skills/bundled/research/research-arxiv) | 按关键词、作者、类别或ID搜索arXiv论文。 | `research/arxiv` |
| [`blogwatcher`](/user-guide/skills/bundled/research/research-blogwatcher) | 通过blogwatcher-cli工具监控博客和RSS/Atom订阅源。 | `research/blogwatcher` |
| [`llm-wiki`](/user-guide/skills/bundled/research/research-llm-wiki) | Karpathy的LLM Wiki：构建/查询相互链接的Markdown知识库。 | `research/llm-wiki` |
| [`polymarket`](/user-guide/skills/bundled/research/research-polymarket) | 查询Polymarket：市场、价格、订单簿、历史记录。 | `research/polymarket` |
| [`research-paper-writing`](/user-guide/skills/bundled/research/research-research-paper-writing) | 为NeurIPS/ICML/ICLR撰写机器学习论文：从设计到提交。 | `research/research-paper-writing` |

## 智能家居

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`openhue`](/user-guide/skills/bundled/smart-home/smart-home-openhue) | 通过OpenHue CLI控制飞利浦Hue灯光、场景和房间。 | `smart-home/openhue` |

## 社交媒体

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`xurl`](/user-guide/skills/bundled/social-media/social-media-xurl) | 通过xurl CLI使用X/Twitter：发帖、搜索、私信、媒体、v2 API。 | `social-media/xurl` |

## 软件开发

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`debugging-hermes-tui-commands`](/user-guide/skills/bundled/software-development/software-development-debugging-hermes-tui-commands) | 调试Hermes TUI斜杠命令：Python、网关、Ink UI。 | `software-development/debugging-hermes-tui-commands` |
| [`hermes-agent-skill-authoring`](/user-guide/skills/bundled/software-development/software-development-hermes-agent-skill-authoring) | 编写仓库内SKILL.md：前置元数据、验证器、结构。 | `software-development/hermes-agent-skill-authoring` |
| [`node-inspect-debugger`](/user-guide/skills/bundled/software-development/software-development-node-inspect-debugger) | 通过 --inspect + Chrome DevTools Protocol CLI调试Node.js。 | `software-development/node-inspect-debugger` |
| [`plan`](/user-guide/skills/bundled/software-development/software-development-plan) | 计划模式：将Markdown计划写入 .hermes/plans/，不执行。 | `software-development/plan` |
| [`python-debugpy`](/user-guide/skills/bundled/software-development/software-development-python-debugpy) | 调试Python：pdb REPL + debugpy远程调试（DAP）。 | `software-development/python-debugpy` |
| [`requesting-code-review`](/user-guide/skills/bundled/software-development/software-development-requesting-code-review) | 提交前审查：安全扫描、质量门禁、自动修复。 | `software-development/requesting-code-review` |
| [`spike`](/user-guide/skills/bundled/software-development/software-development-spike) | 用于在构建前验证想法的探索性实验。 | `software-development/spike` |
| [`subagent-driven-development`](/user-guide/skills/bundled/software-development/software-development-subagent-driven-development) | 通过delegate_task子智能体执行计划（两阶段审查）。 | `software-development/subagent-driven-development` |
| [`systematic-debugging`](/user-guide/skills/bundled/software-development/software-development-systematic-debugging) | 4阶段根本原因调试：在修复前先理解错误。 | `software-development/systematic-debugging` |
| [`test-driven-development`](/user-guide/skills/bundled/software-development/software-development-test-driven-development) | 测试驱动开发：强制执行红-绿-重构，测试先行。 | `software-development/test-driven-development` |
| [`writing-plans`](/user-guide/skills/bundled/software-development/software-development-writing-plans) | 编写实现计划：将任务分解为小块，指定路径和代码。 | `software-development/writing-plans` |

## 元宝

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`yuanbao`](/user-guide/skills/bundled/yuanbao/yuanbao-yuanbao) | 元宝群组：@提及用户、查询信息/成员。 | `yuanbao` |