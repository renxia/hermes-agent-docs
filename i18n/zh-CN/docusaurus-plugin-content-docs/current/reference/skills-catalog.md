---
sidebar_position: 5
title: "Bundled Skills Catalog"
description: "Catalog of bundled skills that ship with Hermes Agent"
---

# 内置技能目录

Hermes 在安装时会将大量内置技能库复制到 `~/.hermes/skills/` 目录中。下方每个技能都链接到专门的页面，包含其完整定义、设置和使用说明。

Hermes 还会在执行 `hermes update` 时同步内置技能，但同步清单会保留本地删除和用户编辑。如果此处列出的技能在你的配置文件的 `~/.hermes/skills/` 目录中缺失，它仍然随 Hermes 一起发布；可通过 `hermes skills reset <name> --restore` 来恢复。

如果某个技能出现在仓库中但未列在此目录中，可通过 `website/scripts/generate-skill-docs.py` 重新生成目录。

## apple

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`apple-notes`](/docs/user-guide/skills/bundled/apple/apple-apple-notes) | 通过 memo CLI 管理 Apple 备忘录：创建、搜索、编辑。 | `apple/apple-notes` |
| [`apple-reminders`](/docs/user-guide/skills/bundled/apple/apple-apple-reminders) | 通过 remindctl 管理 Apple 提醒事项：添加、列出、完成。 | `apple/apple-reminders` |
| [`findmy`](/docs/user-guide/skills/bundled/apple/apple-findmy) | 通过 macOS 上的 FindMy.app 追踪 Apple 设备/AirTags。 | `apple/findmy` |
| [`imessage`](/docs/user-guide/skills/bundled/apple/apple-imessage) | 通过 macOS 上的 immsg CLI 发送和接收 iMessage/短信。 | `apple/imessage` |
| [`macos-computer-use`](/docs/user-guide/skills/bundled/apple/apple-macos-computer-use) | 在后台操控 macOS 桌面——截图、鼠标、键盘、滚动、拖拽——而不会抢占用户的鼠标指针、键盘焦点或空间。适用于任何具备工具能力的模型。当 `computer_use` 工具可用时加载此技能…… | `apple/macos-computer-use` |

## autonomous-ai-agents

| Skill | Description | Path |
|-------|-------------|------|
| [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code) | 将编码任务委派给 Claude Code CLI（功能、PR）。 | `autonomous-ai-agents/claude-code` |
| [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex) | 将编码任务委派给 OpenAI Codex CLI（功能、PR）。 | `autonomous-ai-agents/codex` |
| [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) | 配置、扩展或贡献 Hermes Agent。 | `autonomous-ai-agents/hermes-agent` |
| [`opencode`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-opencode) | 将编码任务委派给 OpenCode CLI（功能、PR 审查）。 | `autonomous-ai-agents/opencode` |

## creative

| Skill | Description | Path |
|-------|-------------|------|
| [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram) | 暗色主题 SVG 架构/云/基础设施图，以 HTML 格式输出。 | `creative/architecture-diagram` |
| [`ascii-art`](/docs/user-guide/skills/bundled/creative/creative-ascii-art) | ASCII 艺术：pyfiglet、cowsay、boxes、图像转 ASCII。 | `creative/ascii-art` |
| [`ascii-video`](/docs/user-guide/skills/bundled/creative/creative-ascii-video) | ASCII 视频：将视频/音频转换为彩色 ASCII MP4/GIF。 | `creative/ascii-video` |
| [`baoyu-infographic`](/docs/user-guide/skills/bundled/creative/creative-baoyu-infographic) | 信息图：21 种布局 x 21 种风格（信息图、可视化）。 | `creative/baoyu-infographic` |
| [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design) | 设计一次性 HTML 产物（落地页、演示文稿、原型）。 | `creative/claude-design` |
| [`comfyui`](/docs/user-guide/skills/bundled/creative/creative-comfyui) | 使用 ComfyUI 生成图像、视频和音频——安装、启动、管理节点/模型，通过参数注入运行工作流。使用官方 comfy-cli 管理生命周期，直接通过 REST/WebSocket API 执行。 | `creative/comfyui` |
| [`design-md`](/docs/user-guide/skills/bundled/creative/creative-design-md) | 编写/验证/导出 Google 的 DESIGN.md token 规范文件。 | `creative/design-md` |
| [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw) | 手绘风格 Excalidraw JSON 图表（架构、流程、时序）。 | `creative/excalidraw` |
| [`humanizer`](/docs/user-guide/skills/bundled/creative/creative-humanizer) | 文本人性化：去除 AI 痕迹，增添真实语气。 | `creative/humanizer` |
| [`manim-video`](/docs/user-guide/skills/bundled/creative/creative-manim-video) | Manim CE 动画：3Blue1Brown 风格数学/算法视频。 | `creative/manim-video` |
| [`p5js`](/docs/user-guide/skills/bundled/creative/creative-p5js) | p5.js 草图：生成艺术、着色器、交互、3D。 | `creative/p5js` |
| [`popular-web-designs`](/docs/user-guide/skills/bundled/creative/creative-popular-web-designs) | 54 个真实设计系统（Stripe、Linear、Vercel）以 HTML/CSS 格式呈现。 | `creative/popular-web-designs` |
| [`pretext`](/docs/user-guide/skills/bundled/creative/creative-pretext) | 在使用 @chenglou/pretext 构建创意浏览器演示时使用——无 DOM 的文本布局，用于 ASCII 艺术、绕障碍的排版流、文本几何游戏、动态排版和文本驱动的生成艺术。生成单文件 HT... | `creative/pretext` |
| [`sketch`](/docs/user-guide/skills/bundled/creative/creative-sketch) | 一次性 HTML 模型：2-3 种设计变体供比较。 | `creative/sketch` |
| [`songwriting-and-ai-music`](/docs/user-guide/skills/bundled/creative/creative-songwriting-and-ai-music) | 歌曲创作技巧和 Suno AI 音乐提示词。 | `creative/songwriting-and-ai-music` |
| [`touchdesigner-mcp`](/docs/user-guide/skills/bundled/creative/creative-touchdesigner-mcp) | 通过 twozero MCP 控制运行中的 TouchDesigner 实例——创建算子、设置参数、连接线路、执行 Python、构建实时视觉效果。36 个原生工具。 | `creative/touchdesigner-mcp` |

## data-science

| Skill | Description | Path |
|-------|-------------|------|
| [`jupyter-live-kernel`](/docs/user-guide/skills/bundled/data-science/data-science-jupyter-live-kernel) | 通过实时 Jupyter 内核（hamelnb）进行迭代式 Python 开发。 | `data-science/jupyter-live-kernel` |

## devops

| Skill | Description | Path |
|-------|-------------|------|


## dogfood

| Skill | Description | Path |
|-------|-------------|------|
| [`dogfood`](/docs/user-guide/skills/bundled/dogfood/dogfood-dogfood) | 对 Web 应用进行探索性 QA：查找缺陷、证据、报告。 | `dogfood` |

## email

| Skill | Description | Path |
|-------|-------------|------|
| [`himalaya`](/docs/user-guide/skills/bundled/email/email-himalaya) | Himalaya CLI：从终端通过 IMAP/SMTP 收发邮件。 | `email/himalaya` |

## github

| Skill | Description | Path |
|-------|-------------|------|
| [`codebase-inspection`](/docs/user-guide/skills/bundled/github/github-codebase-inspection) | 使用 pygount 检查代码库：代码行数、语言、比例。 | `github/codebase-inspection` |
| [`github-auth`](/docs/user-guide/skills/bundled/github/github-github-auth) | GitHub 认证设置：HTTPS 令牌、SSH 密钥、gh CLI 登录。 | `github/github-auth` |
| [`github-code-review`](/docs/user-guide/skills/bundled/github/github-github-code-review) | 审查 PR：通过 gh 或 REST 查看差异、行内评论。 | `github/github-code-review` |
| [`github-issues`](/docs/user-guide/skills/bundled/github/github-github-issues) | 通过 gh 或 REST 创建、分类、标记、分配 GitHub Issues。 | `github/github-issues` |
| [`github-pr-workflow`](/docs/user-guide/skills/bundled/github/github-github-pr-workflow) | GitHub PR 生命周期：分支、提交、开启、CI、合并。 | `github/github-pr-workflow` |
| [`github-repo-management`](/docs/user-guide/skills/bundled/github/github-github-repo-management) | 克隆/创建/分叉仓库；管理远程仓库、发布版本。 | `github/github-repo-management` |

## media

| Skill | Description | Path |
|-------|-------------|------|
| [`gif-search`](/docs/user-guide/skills/bundled/media/media-gif-search) | 通过 curl + jq 从 Tenor 搜索/下载 GIF。 | `media/gif-search` |
| [`heartmula`](/docs/user-guide/skills/bundled/media/media-heartmula) | HeartMuLa：从歌词+标签生成 Suno 风格的歌曲。 | `media/heartmula` |
| [`songsee`](/docs/user-guide/skills/bundled/media/media-songsee) | 通过 CLI 提取音频频谱图/特征（梅尔、色度、MFCC）。 | `media/songsee` |
| [`youtube-content`](/docs/user-guide/skills/bundled/media/media-youtube-content) | YouTube 转录文本转摘要、推文、博客。 | `media/youtube-content` |

## mlops

| Skill | Description | Path |
|-------|-------------|------|
| [`audiocraft-audio-generation`](/docs/user-guide/skills/bundled/mlops/mlops-models-audiocraft) | AudioCraft：MusicGen 文本转音乐，AudioGen 文本转音效。 | `mlops/models/audiocraft` |
| [`huggingface-hub`](/docs/user-guide/skills/bundled/mlops/mlops-huggingface-hub) | HuggingFace hf CLI：搜索/下载/上传模型、数据集。 | `mlops/huggingface-hub` |
| [`llama-cpp`](/docs/user-guide/skills/bundled/mlops/mlops-inference-llama-cpp) | llama.cpp 本地 GGUF 推理 + HF Hub 模型发现。 | `mlops/inference/llama-cpp` |
| [`evaluating-llms-harness`](/docs/user-guide/skills/bundled/mlops/mlops-evaluation-lm-evaluation-harness) | lm-eval-harness：LLM 基准测试（MMLU、GSM8K 等）。 | `mlops/evaluation/lm-evaluation-harness` |
| [`segment-anything-model`](/docs/user-guide/skills/bundled/mlops/mlops-models-segment-anything) | SAM：通过点、框、掩码进行零样本图像分割。 | `mlops/models/segment-anything` |
| [`serving-llms-vllm`](/docs/user-guide/skills/bundled/mlops/mlops-inference-vllm) | vLLM：高吞吐量 LLM 服务、OpenAI API、量化。 | `mlops/inference/vllm` |
| [`weights-and-biases`](/docs/user-guide/skills/bundled/mlops/mlops-evaluation-weights-and-biases) | W&B：记录 ML 实验、超参搜索、模型注册表、仪表盘。 | `mlops/evaluation/weights-and-biases` |

## note-taking

| Skill | Description | Path |
|-------|-------------|------|
| [`obsidian`](/docs/user-guide/skills/bundled/note-taking/note-taking-obsidian) | 在 Obsidian 笔记库中读取、搜索、创建和编辑笔记。 | `note-taking/obsidian` |

## productivity

| Skill | Description | Path |
|-------|-------------|------|
| [`airtable`](/docs/user-guide/skills/bundled/productivity/productivity-airtable) | 通过 curl 调用 Airtable REST API。记录增删改查、过滤、upsert。 | `productivity/airtable` |
| [`google-workspace`](/docs/user-guide/skills/bundled/productivity/productivity-google-workspace) | 通过 gws CLI 或 Python 使用 Gmail、Calendar、Drive、Docs、Sheets。 | `productivity/google-workspace` |
| [`maps`](/docs/user-guide/skills/bundled/productivity/productivity-maps) | 通过 OpenStreetMap/OSRM 进行地理编码、兴趣点、路线、时区查询。 | `productivity/maps` |
| [`nano-pdf`](/docs/user-guide/skills/bundled/productivity/productivity-nano-pdf) | 通过 nano-pdf CLI（NL 提示）编辑 PDF 文本/拼写/标题。 | `productivity/nano-pdf` |
| [`notion`](/docs/user-guide/skills/bundled/productivity/productivity-notion) | Notion API + ntn CLI：页面、数据库、Markdown、Workers。 | `productivity/notion` |
| [`ocr-and-documents`](/docs/user-guide/skills/bundled/productivity/productivity-ocr-and-documents) | 从 PDF/扫描件中提取文本（pymupdf、marker-pdf）。 | `productivity/ocr-and-documents` |
| [`petdex`](/docs/user-guide/skills/bundled/productivity/productivity-petdex) | 安装并选择动画 petdex 吉祥物用于 Hermes。 | `productivity/petdex` |
| [`powerpoint`](/docs/user-guide/skills/bundled/productivity/productivity-powerpoint) | 创建、读取、编辑 .pptx 演示文稿、幻灯片、备注、模板。 | `productivity/powerpoint` |
| [`teams-meeting-pipeline`](/docs/user-guide/skills/bundled/productivity/productivity-teams-meeting-pipeline) | 通过 Hermes CLI 操作 Teams 会议摘要流水线——总结会议、检查流水线状态、重放任务、管理 Microsoft Graph 订阅。 | `productivity/teams-meeting-pipeline` |

## research

| Skill | Description | Path |
|-------|-------------|------|
| [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv) | 按关键词、作者、类别或 ID 搜索 arXiv 论文。 | `research/arxiv` |
| [`blogwatcher`](/docs/user-guide/skills/bundled/research/research-blogwatcher) | 通过 blogwatcher-cli 工具监控博客和 RSS/Atom 订阅。 | `research/blogwatcher` |
| [`llm-wiki`](/docs/user-guide/skills/bundled/research/research-llm-wiki) | Karpathy 的 LLM Wiki：构建/查询互联的 Markdown 知识库。 | `research/llm-wiki` |
| [`polymarket`](/docs/user-guide/skills/bundled/research/research-polymarket) | 查询 Polymarket：市场、价格、订单簿、历史记录。 | `research/polymarket` |
| [`research-paper-writing`](/docs/user-guide/skills/bundled/research/research-research-paper-writing) | 撰写 NeurIPS/ICML/ICLR 的 ML 论文：从设计到投稿。 | `research/research-paper-writing` |

## smart-home

| Skill | Description | Path |
|-------|-------------|------|
| [`openhue`](/docs/user-guide/skills/bundled/smart-home/smart-home-openhue) | 通过 OpenHue CLI 控制飞利浦 Hue 灯具、场景和房间。 | `smart-home/openhue` |

## social-media

| Skill | Description | Path |
|-------|-------------|------|
| [`xurl`](/docs/user-guide/skills/bundled/social-media/social-media-xurl) | 通过 xurl CLI 操作 X/Twitter：发帖、搜索、私信、媒体、v2 API。 | `social-media/xurl` |

## software-development

| Skill | Description | Path |
|-------|-------------|------|
| [`hermes-agent-skill-authoring`](/docs/user-guide/skills/bundled/software-development/software-development-hermes-agent-skill-authoring) | 在仓库内编写 SKILL.md：前置元数据、验证器、结构。 | `software-development/hermes-agent-skill-authoring` |
| [`node-inspect-debugger`](/docs/user-guide/skills/bundled/software-development/software-development-node-inspect-debugger) | 通过 --inspect + Chrome DevTools Protocol CLI 调试 Node.js。 | `software-development/node-inspect-debugger` |
| [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan) | 计划模式：将可执行的 markdown 计划写入 .hermes/plans/，不执行。细粒度任务、精确路径、完整代码。 | `software-development/plan` |
| [`python-debugpy`](/docs/user-guide/skills/bundled/software-development/software-development-python-debugpy) | 调试 Python：pdb REPL + debugpy 远程（DAP）。 | `software-development/python-debugpy` |
| [`requesting-code-review`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review) | 提交前审查：安全扫描、质量门禁、自动修复。 | `software-development/requesting-code-review` |
| [`simplify-code`](/docs/user-guide/skills/bundled/software-development/software-development-simplify-code) | 并行 3 智能体清理最近的代码变更。 | `software-development/simplify-code` |
| [`spike`](/docs/user-guide/skills/bundled/software-development/software-development-spike) | 一次性实验，在构建前验证想法。 | `software-development/spike` |
| [`systematic-debugging`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging) | 4 阶段根因调试：先理解缺陷再修复。 | `software-development/systematic-debugging` |
| [`test-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development) | TDD：强制执行 RED-GREEN-REFACTOR，先写测试再写代码。 | `software-development/test-driven-development` |

## yuanbao

| Skill | Description | Path |
|-------|-------------|------|
| [`yuanbao`](/docs/user-guide/skills/bundled/yuanbao/yuanbao-yuanbao) | 元宝群组：@提及用户、查询信息/成员。 | `yuanbao` |