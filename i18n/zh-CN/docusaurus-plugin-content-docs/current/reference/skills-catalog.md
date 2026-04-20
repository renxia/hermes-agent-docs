---
sidebar_position: 5
title: "捆绑技能目录"
description: "与 Hermes Agent 一起发布的捆绑技能目录"
---

# 捆绑技能目录

Hermes 在安装时会附带一个大型内置技能库，复制到 `~/.hermes/skills/` 目录下。本页面列出了存储在仓库 `skills/` 目录下的捆绑技能。

## apple

Apple/macOS 特定技能 — iMessage、提醒事项、备忘录、查找以及 macOS 自动化。这些技能仅在 macOS 系统上加载。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `apple-notes` | 通过 memo CLI 在 macOS 上管理 Apple 备忘录（创建、查看、搜索、编辑）。 | `apple/apple-notes` |
| `apple-reminders` | 通过 remindctl CLI 管理 Apple 提醒事项（列出、添加、完成、删除）。 | `apple/apple-reminders` |
| `findmy` | 使用 AppleScript 和屏幕截图，通过 FindMy.app 在 macOS 上追踪 Apple 设备和 AirTag。 | `apple/findmy` |
| `imessage` | 通过 imsg CLI 在 macOS 上发送和接收 iMessage/SMS。 | `apple/imessage` |

## autonomous-ai-agents

用于生成和编排自主 AI 编码代理及多代理工作流的技能 — 运行独立的代理进程、委派任务并协调并行工作流。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `claude-code` | 将编码任务委派给 Claude Code（Anthropic 的 CLI 代理）。用于构建功能、重构、PR 审查和迭代编码。需要安装 claude CLI。 | `autonomous-ai-agents/claude-code` |
| `codex` | 将编码任务委派给 OpenAI Codex CLI 代理。用于构建功能、重构、PR 审查和批量问题修复。需要安装 codex CLI 并处于 git 仓库中。 | `autonomous-ai-agents/codex` |
| `hermes-agent` | 使用和扩展 Hermes Agent 的完整指南 — CLI 用法、设置、配置、生成额外代理、网关平台、技能、语音、工具、配置文件以及简洁的贡献者参考。在帮助用户配置 Hermes、排查问题或……时加载此技能 | `autonomous-ai-agents/hermes-agent` |
| `opencode` | 将编码任务委派给 OpenCode CLI 代理，用于功能实现、重构、PR 审查和长时间运行的自主会话。需要安装 opencode CLI 并经过身份验证。 | `autonomous-ai-agents/opencode` |

## creative

创意内容生成 — ASCII 艺术、手绘图表、动画、音乐和视觉设计工具。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `architecture-diagram` | 生成软件系统和云基础设施的深色主题 SVG 图表，作为带有内联 SVG 图形的独立 HTML 文件。语义组件颜色（青色=前端、翡翠色=后端、紫色=数据库、琥珀色=云/AWS、玫瑰色=安全、橙色=消息总线），JetBrains Mono 字体…… | `creative/architecture-diagram` |
| `ascii-art` | 使用 pyfiglet（571 种字体）、cowsay、boxes、toilet、image-to-ascii、远程 API（asciified、ascii.co.uk）和 LLM 回退生成 ASCII 艺术。无需 API 密钥。 | `creative/ascii-art` |
| `ascii-video` | ASCII 艺术视频的生产流水线 — 任意格式。将视频/音频/图像/生成输入转换为彩色 ASCII 字符视频输出（MP4、GIF、图像序列）。涵盖：视频转 ASCII、音频驱动的音乐可视化器、生成式 ASCII 艺术动画、混合…… | `creative/ascii-video` |
| `excalidraw` | 使用 Excalidraw JSON 格式创建手绘风格图表。生成 .excalidraw 文件用于架构图、流程图、时序图、概念图和更多内容。可在 excalidraw.com 打开或上传以生成可共享链接。 | `creative/excalidraw` |
| `ideation` | 通过创造性约束生成项目想法。当用户说“我想构建一些东西”、“给我一个项目想法”、“我很无聊”、“我应该做什么”、“启发我”或任何“我有工具但没有方向”的变体时使用。适用于代码、艺术、硬件、写作、工具…… | `creative/creative-ideation` |
| `manim-video` | 使用 Manim Community Edition 制作数学和技术动画的生产流水线。创建 3Blue1Brown 风格的解释视频、算法可视化、方程推导、架构图和数据故事。当用户请求：动画解释、数学……时使用 | `creative/manim-video` |
| `p5js` | 使用 p5.js 制作交互式生成式视觉艺术的生产流水线。创建基于浏览器的草图、生成艺术、数据可视化、交互体验、3D 场景、音频驱动视觉效果和运动图形 — 导出为 HTML、PNG、GIF、MP4 或 SVG。涵盖：2D…… | `creative/p5js` |
| `popular-web-designs` | 从真实网站提取的 54 个生产质量设计系统。加载模板以生成匹配站点视觉标识的 HTML/CSS，如 Stripe、Linear、Vercel、Notion、Airbnb 等。每个模板包含颜色、排版、组件、布局规则和实际…… | `creative/popular-web-designs` |
| `songwriting-and-ai-music` | 歌曲创作技巧、AI 音乐生成提示（Suno 重点）、 parody/改编技术、语音技巧和经验教训。这些都是工具和想法，不是规则。当艺术需要时可以打破其中任何一条。 | `creative/songwriting-and-ai-music` |

## data-science

数据科学工作流程技能 — 交互式探索、Jupyter notebooks、数据分析和可视化。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `jupyter-live-kernel` | 使用 live Jupyter kernel 进行有状态的迭代 Python 执行 via hamelnb。当任务涉及探索、迭代或检查中间结果时加载此技能 — 数据科学、ML 实验、API 探索或逐步构建复杂代码。使用…… | `data-science/jupyter-live-kernel` |

## devops

DevOps 和基础设施自动化技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `webhook-subscriptions` | 创建和管理事件驱动代理激活的 webhook 订阅。当用户希望外部服务自动触发代理运行时使用。 | `devops/webhook-subscriptions` |

## dogfood

用于测试 Hermes Agent 本身的内部狗食技能和 QA 技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `dogfood` | 网页应用的系统性探索性 QA 测试 — 发现 bug、捕获证据并生成结构化报告 | `dogfood` |

## email

用于在终端中发送、接收、搜索和管理电子邮件的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `himalaya` | 通过 IMAP/SMTP 管理电子邮件的 CLI。使用 himalaya 在终端中列出、阅读、编写、回复、转发、搜索和组织电子邮件。支持多个账户和 MML（MIME 元语言）的消息撰写。 | `email/himalaya` |

## gaming

用于设置、配置和管理游戏服务器、modpack 和游戏相关基础设施的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `minecraft-modpack-server` | 从 CurseForge/Modrinth 服务器包 zip 设置模组版 Minecraft 服务器。涵盖 NeoForge/Forge 安装、Java 版本、JVM 调优、防火墙、LAN 配置、备份和启动脚本。 | `gaming/minecraft-modpack-server` |
| `pokemon-player` | 通过无头模拟自主玩 Pokemon 游戏。启动游戏服务器、从 RAM 读取结构化游戏状态、做出战略决策并发送按钮输入 — 全部来自终端。 | `gaming/pokemon-player` |

## github

GitHub 工作流程技能，用于管理仓库、拉取请求、代码审查、问题和 CI/CD 流水线。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `codebase-inspection` | 使用 pygount 检查和分析代码库，统计 LOC、语言分布和代码 vs 注释比例。当被要求检查代码行数、仓库大小、语言组成或代码库统计信息时使用。 | `github/codebase-inspection` |
| `github-auth` | 使用 git（普遍可用）或 gh CLI 设置 GitHub 身份验证。涵盖 HTTPS 令牌、SSH 密钥、凭证助手和 gh auth — 带检测流程以自动选择正确方法。 | `github/github-auth` |
| `github-code-review` | 通过分析 git diffs 审查代码变更，在 PR 上留下内联评论并进行彻底的预推送审查。与 gh CLI 配合使用或回退到 git + GitHub REST API via curl。 | `github/github-code-review` |
| `github-issues` | 创建、管理、分类和关闭 GitHub 问题。搜索现有问题、添加标签、分配人员和链接到 PR。与 gh CLI 配合使用或回退到 git + GitHub REST API via curl。 | `github/github-issues` |
| `github-pr-workflow` | 完整的拉取请求生命周期 — 创建分支、提交更改、打开 PR、监控 CI 状态、自动修复失败和合并。与 gh CLI 配合使用或回退到 git + GitHub REST API via curl。 | `github/github-pr-workflow` |
| `github-repo-management` | 克隆、创建、分叉、配置和管理 GitHub 仓库。管理远程、秘密、发布和 workflow。与 gh CLI 配合使用或回退到 git + GitHub REST API via curl。 | `github/github-repo-management` |

## mcp

用于处理 MCP（Model Context Protocol）服务器、工具和集成的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `native-mcp` | 内置 MCP（Model Context Protocol）客户端，连接外部 MCP 服务器、发现其工具并将它们注册为原生 Hermes Agent 工具。支持 stdio 和 HTTP 传输，具有自动重连、安全过滤和无配置工具注入功能。 | `mcp/native-mcp` |

## media

用于处理媒体内容的技能 — YouTube 字幕、GIF 搜索、音乐生成和音频可视化。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `gif-search` | 使用 curl 从 Tenor 搜索和下载 GIF。除了 curl 和 jq 外无其他依赖。适用于查找反应 GIF、创建视觉内容和在聊天中发送 GIF。 | `media/gif-search` |
| `heartmula` | 设置和运行 HeartMuLa，开源音乐生成模型系列（类似 Suno）。从歌词+标签生成完整歌曲，支持多语言。 | `media/heartmula` |
| `songsee` | 通过 CLI 从音频文件生成频谱图和音频特征可视化（mel、chroma、MFCC、tempogram 等）。适用于音频分析、音乐制作调试和视觉文档。 | `media/songsee` |
| `youtube-content` | 获取 YouTube 视频字幕并将其转换为结构化内容（章节、摘要、线程、博客文章）。当用户分享 YouTube URL 或视频链接、要求总结视频、请求字幕或想要从任何 YouT…提取和重新格式化内容时 | `media/youtube-content` |

## mlops

通用 ML 运维工具 — 模型 hub 管理、数据集操作和工作流编排。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `huggingface-hub` | Hugging Face Hub CLI (hf) — 搜索、下载和上传模型和数据集，管理仓库，使用 SQL 查询数据集，部署推理端点，管理 Spaces 和 buckets。 | `mlops/huggingface-hub` |

## mlops/evaluation

模型评估基准、实验跟踪和可解释性工具。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `evaluating-llms-harness` | 在 60 多个学术基准（MMLU、HumanEval、GSM8K、TruthfulQA、HellaSwag）上评估 LLM。当基准测试模型质量、比较模型、报告学术结果或跟踪训练进度时使用。EleutherAI、HuggingFace 和主要实验室使用的行业标准。S… | `mlops/evaluation/lm-evaluation-harness` |
| `weights-and-biases` | 使用自动日志记录跟踪 ML 实验，实时可视化训练，使用 sweeps 优化超参数，并使用 W&B 管理模型注册表 - 协作 MLOps 平台 | `mlops/evaluation/weights-and-biases` |

## mlops/inference

模型服务、量化（GGUF/GPTQ）、结构化输出、推理优化和模型手术工具，用于部署和运行 LLMs。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `llama-cpp` | 使用 llama.cpp 在 CPU、Apple Silicon、AMD/Intel GPU 或 NVIDIA GPU 上运行 LLM 推理 — 加上 GGUF 模型转换和量化（2-8 位 K-quants 和 imatrix）。涵盖 CLI、Python 绑定、OpenAI 兼容服务器和 Ollama/LM Studio 集成。用于边缘部署… | `mlops/inference/llama-cpp` |
| `obliteratus` | 使用 OBLITERATUS 从开放权重 LLM 中移除拒绝行为 — 使用机制可解释性技术（diff-in-means、SVD、白化 SVD、LEACE、SAE 分解等）切除防护栏同时保留推理能力。9 种 CLI 方法、28 个分析模块、116 个模型预设… | `mlops/inference/obliteratus` |
| `outlines` | 在生成过程中保证有效 JSON/XML/代码结构，使用 Pydantic 模型进行类型安全的输出，支持本地模型（Transformers、vLLM），并通过 Outlines - dottxt.ai 的结构化生成库最大化推理速度 | `mlops/inference/outlines` |
| `serving-llms-vllm` | 使用 vLLM 的 PagedAttention 和连续批处理以高吞吐量服务 LLM。当部署生产 LLM API、优化推理延迟/吞吐量或使用有限 GPU 内存服务模型时使用。支持 OpenAI 兼容端点、量化（GPTQ/AWQ/FP8）、… | `mlops/inference/vllm` |

## mlops/models

特定模型架构 — 图像分割（SAM）和音频生成（AudioCraft / MusicGen）。CLIP、Stable Diffusion、Whisper、LLaVA 等其他模型技能可作为可选技能提供。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `audiocraft-audio-generation` | PyTorch 库用于音频生成，包括文本到音乐（MusicGen）和文本到声音（AudioGen）。当您需要进行文本描述的音乐生成、创建音效或执行旋律条件音乐生成时使用。 | `mlops/models/audiocraft` |
| `segment-anything-model` | 用于图像分割的基础模型，具有零样本迁移能力。当您需要在图像中分割任何对象，使用点、框或蒙版作为提示，或自动生成图像中所有对象的蒙版时使用。 | `mlops/models/segment-anything` |

## mlops/research

用于构建和优化 AI 系统的 ML 研究框架，采用声明式编程。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `dspy` | 使用声明式编程构建复杂的 AI 系统，自动优化提示，使用 DSPy - Stanford NLP 的系统化 LM 编程框架创建模块化 RAG 系统和代理 | `mlops/research/dspy` |

## mlops/training

微调、RLHF/DPO/GRPO 训练、分布式训练框架和优化工具。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `axolotl` | Axolotl 微调 LLM 的专家指导 - YAML 配置、100+ 模型、LoRA/QLoRA、DPO/KTO/ORPO/GRPO、多模态支持 | `mlops/training/axolotl` |
| `fine-tuning-with-trl` | 使用 TRL 微调 LLM - SFT 用于指令调优、DPO 用于偏好对齐、PPO/GRPO 用于奖励优化和奖励模型训练。当需要 RLHF、使模型与偏好对齐或从人类反馈训练时使用。与 HuggingFace … | `mlops/training/trl-fine-tuning` |
| `unsloth` | Unsloth 快速微调的专家指导 - 训练速度快 2-5 倍、内存减少 50-80%、LoRA/QLoRA 优化 | `mlops/training/unsloth` |

## note-taking

笔记技能，用于保存信息、协助研究和协作多会话规划。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `obsidian` | 读取、搜索和创建 Obsidian 库中的笔记。 | `note-taking/obsidian` |

## productivity

用于文档创建、演示文稿、电子表格和其他生产力工作流程的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `google-workspace` | Gmail、Calendar、Drive、Contacts、Sheets 和 Docs 与 Hermes 集成。使用 Hermes 管理的 OAuth2 设置，当 Google Workspace CLI (`gws`) 可用时优先使用，否则回退到 Python 客户端库。 | `productivity/google-workspace` |
| `linear` | 通过 GraphQL API 管理 Linear 问题、项目和团队。创建、更新、搜索和组织问题。使用 API 密钥认证（无需 OAuth）。所有操作通过 curl — 无依赖。 | `productivity/linear` |
| `maps` | 位置智能 — 地理编码、反向地理编码、附近 POI 搜索（44 个类别、坐标或地址通过 `--near`）、驾驶/步行/骑行距离+时间、逐向导航、时区、边界框+区域、矩形内 POI 搜索。使用 OpenStreetMap + Overpass + OSRM。无需 API 密钥。Telegram 位置-pin 友好。 | `productivity/maps` |
| `nano-pdf` | 使用 nano-pdf CLI 通过自然语言指令编辑 PDF。修改文本、修复错别字、更新标题并对特定页面进行内容更改，无需手动编辑。 | `productivity/nano-pdf` |
| `notion` | Notion API 用于通过 curl 创建和管理页面、数据库和块。直接从终端搜索、创建、更新和查询 Notion 工作空间。 | `productivity/notion` |
| `ocr-and-documents` | 从 PDF 和扫描文档中提取文本。对远程 URL 使用 web_extract，对基于文本的本地 PDF 使用 pymupdf，对 OCR/扫描文档使用 marker-pdf。对 DOCX 使用 python-docx，对 PPTX 参见 powerpoint 技能。 | `productivity/ocr-and-documents` |
| `powerpoint` | 任何时候涉及 .pptx 文件时都使用此技能 — 作为输入、输出或两者。包括：创建幻灯片演示、推介演示或演示文稿；读取、解析或提取任何 .pptx 文件中的文本（即使提取的内容将在其他地方使用，例如… | `productivity/powerpoint` |

## red-teaming

用于 LLM 红队测试、越狱和安全过滤器绕过研究的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `godmode` | 使用 G0DM0D3 技术越狱 API 服务的 LLM — Parseltongue 输入混淆（33 种技术）、GODMODE CLASSIC 系统提示模板、ULTRAPLINIAN 多模型竞速、编码升级和 Hermes 原生预填充/系统提示集成。当用户想要绕过…时使用 | `red-teaming/godmode` |

## research

用于学术研究、论文发现、文献综述、市场数据、内容监控和科学知识检索的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `arxiv` | 使用免费的 REST API 从 arXiv 搜索和检索学术论文。无需 API 密钥。按关键词、作者、类别或 ID 搜索。与 web_extract 或 ocr-and-documents 技能结合读取完整论文内容。 | `research/arxiv` |
| `blogwatcher` | 使用 blogwatcher-cli 工具监控博客和 RSS/Atom feed 的更新。添加博客、扫描新文章、跟踪阅读状态并按类别筛选。 | `research/blogwatcher` |
| `llm-wiki` | Karpathy 的 LLM Wiki — 构建和维护持久、互连的 markdown 知识库。摄取来源、查询编译知识并检查一致性。 | `research/llm-wiki` |
| `polymarket` | 查询 Polymarket 预测市场数据 — 搜索市场、获取价格、订单簿和历史价格。仅通过公共 REST APIs 只读访问，无需 API 密钥。 | `research/polymarket` |
| `research-paper-writing` | 端到端 ML/AI 研究论文写作流水线 — 从实验设计到分析、草稿、修订和投稿。涵盖 NeurIPS、ICML、ICLR、ACL、AAAI、COLM。集成自动实验监控、统计分析、迭代写作和引用验证… | `research/research-paper-writing` |

## smart-home

用于控制智能家居设备的技能 — 灯光、开关、传感器和家庭自动化系统。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `openhue` | 通过 OpenHue CLI 控制飞利浦 Hue 灯、房间和场景。打开/关闭灯光、调整亮度、颜色、色温和激活场景。 | `smart-home/openhue` |

## social-media

用于与社交平台交互的技能 — 发帖、读取、监控和账户操作。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `xurl` | 通过 xurl（官方 X API CLI）与 X/Twitter 交互。用于发帖、回复、引用、搜索、时间线、提及、点赞、转发、收藏、关注、私信、媒体上传和原始 v2 端点访问。 | `social-media/xurl` |

## software-development

通用软件工程技能 — 规划、审查、调试和测试驱动开发。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `plan` | Hermes 的规划模式 — 检查上下文，将 markdown 计划写入活动工作区的 `.hermes/plans/` 目录，不执行工作。 | `software-development/plan` |
| `requesting-code-review` | 提交前验证流水线 — 静态安全扫描、基线感知质量门、独立审查员子代理和自动修复循环。在代码更改后和提交、推送或打开 PR 前使用。 | `software-development/requesting-code-review` |
| `subagent-driven-development` | 在执行带独立任务的实现计划时使用。为每个任务分派 fresh delegate_task 并进行两阶段审查（规范合规性然后代码质量）。 | `software-development/subagent-driven-development` |
| `systematic-debugging` | 遇到任何 bug、测试失败或意外行为时使用。四阶段根本原因调查 — 首先理解问题，然后才进行修复。 | `software-development/systematic-debugging` |
| `test-driven-development` | 实现任何功能或修复 bug 前使用，在编写实现代码前。强制 RED-GREEN-REFACTOR 周期和测试优先方法。 | `software-development/test-driven-development` |
| `writing-plans` | 当您有多步骤任务的规范或需求时使用。创建包含 bite-sized 任务、确切文件路径和完整代码示例的综合实现计划。 | `software-development/writing-plans` |

---

# 可选技能

可选技能存储在 `optional-skills/` 下，**默认不激活**。它们涵盖更重或更专业的用例。使用以下命令安装：

```bash
hermes skills install official/<category>/<skill>
```

## autonomous-ai-agents

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `blackbox` | 将编码任务委派给 Blackbox AI CLI 代理。多模型代理，内置法官，通过多个 LLM 运行任务并选择最佳结果。需要 blackbox CLI 和 Blackbox AI API 密钥。 | `autonomous-ai-agents/blackbox` |

## blockchain

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `base` | 使用 USD 定价查询 Base（以太坊 L2）区块链数据 — 钱包余额、代币信息、交易详情、gas 分析、合约检查、鲸鱼检测和实时网络统计。使用 Base RPC + CoinGecko。无需 API 密钥。 | `blockchain/base` |
| `solana` | 使用 USD 定价查询 Solana 区块链数据 — 钱包余额、代币投资组合和价值、交易详情、NFT、鲸鱼检测和实时网络统计。使用 Solana RPC + CoinGecko。无需 API 密钥。 | `blockchain/solana` |

## creative

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `blender-mcp` | 通过 socket 连接直接控制 Blender，使用 blender-mcp 插件。创建 3D 对象、材质、动画并运行任意 Blender Python (bpy) 代码。 | `creative/blender-mcp` |
| `meme-generation` | 通过选择模板并用 Pillow 叠加文本生成真实 meme 图像。生成实际的 .png meme 文件。 | `creative/meme-generation` |
| `touchdesigner-mcp` | 通过 twozero MCP 插件控制正在运行的 TouchDesigner 实例 — 创建操作符、设置参数、连接线路、执行 Python、构建实时音频驱动视觉效果和 GLSL 网络。36 个原生工具。 | `creative/touchdesigner-mcp` |

## devops

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `docker-management` | 管理 Docker 容器、镜像、卷、网络和 Compose 堆栈 — 生命周期操作、调试、清理和 Dockerfile 优化。 | `devops/docker-management` |

## email

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `agentmail` | 为代理提供专用邮箱收件箱 via AgentMail。使用代理拥有的邮箱地址（如 hermes-agent@agentmail.to）自动发送、接收和管理邮件。 | `email/agentmail` |

## health

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `neuroskill-bci` | 连接到正在运行的 NeuroSkill 实例并将用户的实时认知和情绪状态（专注力、放松度、情绪、认知负荷、瞌睡、心率、HRV、睡眠分期和 40+ 派生 EXG 分数）纳入响应。需要一个 BCI 可穿戴设备（Muse 2/S 或 OpenBCI）和 NeuroSkill 桌面应用。 | `health/neuroskill-bci` |

## mcp

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `fastmcp` | 使用 FastMCP in Python 构建、测试、检查、安装和部署 MCP 服务器。当创建新的 MCP 服务器、将 API 或数据库包装为 MCP 工具、暴露资源或提示，或为 HTTP 部署准备 FastMCP 服务器时使用。 | `mcp/fastmcp` |

## migration

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `openclaw-migration` | 将用户的 OpenClaw 自定义足迹迁移到 Hermes Agent。从 ~/.openclaw 导入 Hermes 兼容的记忆、SOUL.md、命令允许列表、用户技能和选定的工作区资产，然后报告无法迁移的内容及其原因。 | `migration/openclaw-migration` |

## productivity

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `telephony` | 赋予 Hermes 电话能力 — 配置和持久化 Twilio 号码，发送和接收 SMS/MMS，直接拨打电话，并通过 Bland.ai 或 Vapi 进行 AI 驱动的呼出电话。 | `productivity/telephony` |

## research

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `bioinformatics` | bioSkills 和 ClawBio 的 400+ 生物信息学技能的网关。涵盖基因组学、转录组学、单细胞、变异调用、药物基因组学、宏基因组学和结构生物学等。 | `research/bioinformatics` |
| `qmd` | 使用 qmd 在个人知识库、笔记、文档和会议记录中进行本地搜索 — 一种混合检索引擎，具有 BM25、向量搜索和 LLM 重排序。支持 CLI 和 MCP 集成。 | `research/qmd` |

## security

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `1password` | 设置和使用 1Password CLI (op)。当安装 CLI、启用桌面应用集成、登录以及读取/注入命令的机密时使用。 | `security/1password` |
| `oss-forensics` | 供应链调查、证据恢复和 GitHub 仓库的 forensic 分析。涵盖已删除提交恢复、强制推送检测、IOC 提取、多源证据收集和结构化 forensic 报告。 | `security/oss-forensics` |
| `sherlock` | 在 400+ 社交网络中搜索 OSINT 用户名。通过用户名寻找社交媒体账户。 | `security/sherlock` |