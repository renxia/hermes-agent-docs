---
sidebar_position: 5
title: "内置技能目录"
description: "Hermes 智能体附带的内置技能目录"
---

# 内置技能目录

Hermes 在安装时会附带一个大型内置技能库，这些技能会被复制到 `~/.hermes/skills/` 目录下。本页面列出了位于仓库 `skills/` 目录下的所有内置技能。

## apple

Apple/macOS 专用技能 — iMessage、提醒事项、备忘录、查找我的设备和 macOS 自动化。这些技能仅在 macOS 系统上加载。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `apple-notes` | 通过 macOS 上的 memo CLI 管理 Apple 备忘录（创建、查看、搜索、编辑）。 | `apple/apple-notes` |
| `apple-reminders` | 通过 remindctl CLI 管理 Apple 提醒事项（列出、添加、完成、删除）。 | `apple/apple-reminders` |
| `findmy` | 通过 macOS 上的 AppleScript 和屏幕截图功能，使用 FindMy.app 跟踪 Apple 设备和 AirTag。 | `apple/findmy` |
| `imessage` | 通过 macOS 上的 imsg CLI 发送和接收 iMessage/SMS。 | `apple/imessage` |

## autonomous-ai-agents

用于生成和协调自主 AI 编码智能体以及多智能体工作流的技能 — 运行独立的智能体进程、委派任务并协调并行工作流。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `claude-code` | 将编码任务委派给 Claude Code（Anthropic 的 CLI 智能体）。适用于构建功能、重构、PR 审查以及迭代式编码。需要安装 claude CLI。 | `autonomous-ai-agents/claude-code` |
| `codex` | 将编码任务委派给 OpenAI Codex CLI 智能体。适用于构建功能、重构、PR 审查以及批量修复问题。需要安装 codex CLI 并配置 git 仓库。 | `autonomous-ai-agents/codex` |
| `hermes-agent` | 使用与扩展 Hermes 智能体的完整指南 — CLI 用法、设置、配置、生成额外智能体、网关平台、技能、语音、工具、配置文件，以及简洁的贡献者参考。在帮助用户配置 Hermes、排查问题时使用此技能。 | `autonomous-ai-agents/hermes-agent` |
| `opencode` | 将编码任务委派给 OpenCode CLI 智能体，用于功能实现、重构、PR 审查以及长时间运行的自主会话。需要安装并认证 opencode CLI。 | `autonomous-ai-agents/opencode` |

## creative

创意内容生成 — ASCII 艺术、手绘图表、动画、音乐和视觉设计工具。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `architecture-diagram` | 生成深色主题的 SVG 图表，展示软件系统和云基础设施，输出为独立的 HTML 文件，内嵌 SVG 图形。语义化组件颜色（青色=前端，翠绿色=后端，紫色=数据库，琥珀色=云/AWS，玫瑰色=安全，橙色=消息总线），JetBrains Mono 字体… | `creative/architecture-diagram` |
| `ascii-art` | 使用 pyfiglet（571 种字体）、cowsay、boxes、toilet、图像转 ASCII、远程 API（asciified、ascii.co.uk）以及 LLM 回退生成 ASCII 艺术。无需 API 密钥。 | `creative/ascii-art` |
| `ascii-video` | ASCII 艺术视频制作流水线 — 支持任意格式。将视频/音频/图像/生成式输入转换为彩色 ASCII 字符视频输出（MP4、GIF、图像序列）。涵盖：视频转 ASCII、音频反应式音乐可视化、生成式 ASCII 艺术动画、混合… | `creative/ascii-video` |
| `excalidraw` | 使用 Excalidraw JSON 格式创建手绘风格图表。生成 .excalidraw 文件，用于架构图、流程图、时序图、概念图等。文件可在 excalidraw.com 打开或上传以生成可共享链接。 | `creative/excalidraw` |
| `ideation` | 通过创意约束生成项目想法。当用户说“我想做点东西”、“给我一个项目想法”、“我很无聊”、“我该做什么”、“启发我”或任何“我有工具但没方向”的变体时使用。适用于代码、艺术、硬件、写作、工具… | `creative/creative-ideation` |
| `manim-video` | 使用 Manim 社区版制作数学和技术动画的流水线。创建 3Blue1Brown 风格的解释视频、算法可视化、方程推导、架构图和数据故事。当用户请求：动画解释、数学… | `creative/manim-video` |
| `p5js` | 使用 p5.js 制作交互式与生成式视觉艺术的流水线。创建基于浏览器的草图、生成式艺术、数据可视化、交互体验、3D 场景、音频反应式视觉效果和动态图形 — 导出为 HTML、PNG、GIF、MP4 或 SVG。涵盖：2D… | `creative/p5js` |
| `popular-web-designs` | 从真实网站中提取的 54 个生产级设计系统。加载模板以生成匹配 Stripe、Linear、Vercel、Notion、Airbnb 等网站视觉标识的 HTML/CSS。每个模板包含颜色、排版、组件、布局规则和真实… | `creative/popular-web-designs` |
| `songwriting-and-ai-music` | 歌曲创作技巧、AI 音乐生成提示（聚焦 Suno）、模仿/改编技巧、语音技巧和经验教训。这些是工具和想法，而非规则。当艺术需要时，可以打破其中任何一条。 | `creative/songwriting-and-ai-music` |

## data-science

数据科学工作流技能 — 交互式探索、Jupyter 笔记本、数据分析和可视化。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `jupyter-live-kernel` | 通过 hamelnb 使用实时 Jupyter 内核进行有状态、迭代的 Python 执行。当任务涉及探索、迭代或检查中间结果时加载此技能 — 数据科学、ML 实验、API 探索或逐步构建复杂代码。使用… | `data-science/jupyter-live-kernel` |

## devops

DevOps 和基础设施自动化技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `webhook-subscriptions` | 创建和管理 webhook 订阅，以实现事件驱动的智能体激活。当用户希望外部服务自动触发智能体运行时使用。 | `devops/webhook-subscriptions` |

## dogfood

用于测试 Hermes 智能体本身的内部“吃自己的狗粮”（dogfooding）和 QA 技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `dogfood` | 对 Web 应用程序进行系统性探索性 QA 测试 — 发现 bug、收集证据并生成结构化报告 | `dogfood` |
| `adversarial-ux-test` | 扮演产品最难缠、最抗拒技术的用户 — 以该角色浏览、抱怨，然后通过红/黄/白/绿实用主义层级过滤，仅将真实的 UX 摩擦转化为工单。 | `dogfood/adversarial-ux-test` |

## email

从终端发送、接收、搜索和管理电子邮件的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `himalaya` | 通过 IMAP/SMTP 管理电子邮件的 CLI。使用 himalaya 从终端列出、阅读、撰写、回复、转发、搜索和组织电子邮件。支持多账户和 MML（MIME 元语言）消息编写。 | `email/himalaya` |

## gaming

设置、配置和管理游戏服务器、模组包和游戏相关基础设施的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `minecraft-modpack-server` | 从 CurseForge/Modrinth 服务器包 zip 文件设置一个模组化 Minecraft 服务器。涵盖 NeoForge/Forge 安装、Java 版本、JVM 调优、防火墙、局域网配置、备份和启动脚本。 | `gaming/minecraft-modpack-server` |
| `pokemon-player` | 通过无头模拟器自主玩 Pokemon 游戏。启动游戏服务器，从 RAM 读取结构化游戏状态，做出策略决策并发送按键输入 — 全部来自终端。 | `gaming/pokemon-player` |

## github

用于管理仓库、拉取请求、代码审查、问题和 CI/CD 管道的 GitHub 工作流技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `codebase-inspection` | 使用 pygount 检查和分析代码库，统计代码行数、语言分布和代码与注释比例。当被要求检查代码行数、仓库大小、语言组成或代码库统计信息时使用。 | `github/codebase-inspection` |
| `github-auth` | 使用 git（普遍可用）或 gh CLI 为智能体设置 GitHub 身份验证。涵盖 HTTPS 令牌、SSH 密钥、凭据助手和 gh auth — 并带有自动检测方法以选择正确方式。 | `github/github-auth` |
| `github-code-review` | 通过分析 git diff、在 PR 上留下内联评论并执行彻底的预推送审查来审查代码更改。支持 gh CLI 或回退到通过 curl 使用 git + GitHub REST API。 | `github/github-code-review` |
| `github-issues` | 创建、管理、分类和关闭 GitHub 问题。搜索现有问题、添加标签、分配人员并链接到 PR。支持 gh CLI 或回退到通过 curl 使用 git + GitHub REST API。 | `github/github-issues` |
| `github-pr-workflow` | 完整的拉取请求生命周期 — 创建分支、提交更改、打开 PR、监控 CI 状态、自动修复失败并合并。支持 gh CLI 或回退到通过 curl 使用 git + GitHub REST API。 | `github/github-pr-workflow` |
| `github-repo-management` | 克隆、创建、分叉、配置和管理 GitHub 仓库。管理远程、机密、发布和工作流。支持 gh CLI 或回退到通过 curl 使用 git + GitHub REST API。 | `github/github-repo-management` |

## mcp

用于处理 MCP（模型上下文协议）服务器、工具和集成的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `native-mcp` | 内置 MCP（模型上下文协议）客户端，连接外部 MCP 服务器，发现其工具并将其注册为 Hermes 智能体的原生工具。支持 stdio 和 HTTP 传输，具有自动重连、安全过滤和零配置工具注入功能。 | `mcp/native-mcp` |

## media

处理媒体内容的技能 — YouTube 字幕、GIF 搜索、音乐生成和音频可视化。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `gif-search` | 使用 curl 从 Tenor 搜索和下载 GIF。除 curl 和 jq 外无依赖。适用于查找反应 GIF、创建视觉内容以及在聊天中发送 GIF。 | `media/gif-search` |
| `heartmula` | 设置并运行 HeartMuLa，开源音乐生成模型家族（类似 Suno）。根据歌词 + 标签生成完整歌曲，支持多语言。 | `media/heartmula` |
| `songsee` | 通过 CLI 从音频文件生成频谱图和音频特征可视化（梅尔、色度、MFCC、节奏图等）。适用于音频分析、音乐制作调试和视觉文档。 | `media/songsee` |
| `youtube-content` | 获取 YouTube 视频字幕并将其转换为结构化内容（章节、摘要、线程、博客文章）。当用户分享 YouTube URL 或视频链接、要求总结视频、请求字幕或希望从任何 YouT… | `media/youtube-content` |

## mlops

通用机器学习运维工具 — 模型中心管理、数据集操作和工作流编排。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `huggingface-hub` | Hugging Face Hub CLI（hf）— 搜索、下载和上传模型与数据集，管理仓库，使用 SQL 查询数据集，部署推理端点，管理 Spaces 和存储桶。 | `mlops/huggingface-hub` |

## mlops/evaluation

模型评估基准、实验跟踪和可解释性工具。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `evaluating-llms-harness` | 在 60+ 学术基准（MMLU、HumanEval、GSM8K、TruthfulQA、HellaSwag）上评估 LLM。在基准测试模型质量、比较模型、报告学术结果或跟踪训练进度时使用。EleutherAI、HuggingFace 和主要实验室使用的行业标准。S… | `mlops/evaluation/lm-evaluation-harness` |
| `weights-and-biases` | 使用自动日志记录跟踪 ML 实验，实时可视化训练过程，通过扫描优化超参数，并使用 W&B（协作式 MLOps 平台）管理模型注册表 | `mlops/evaluation/weights-and-biases` |

## mlops/inference

模型服务、量化（GGUF/GPTQ）、结构化输出、推理优化和模型手术工具，用于部署和运行 LLM。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `llama-cpp` | 在 CPU、Apple Silicon、AMD/Intel GPU 或 NVIDIA 上使用 llama.cpp 运行 LLM 推理 — 加上 GGUF 模型转换和量化（2–8 位，支持 K-quants 和 imatrix）。涵盖 CLI、Python 绑定、OpenAI 兼容服务器以及 Ollama/LM Studio 集成。适用于边缘部署… | `mlops/inference/llama-cpp` |
| `obliteratus` | 使用 OBLITERATUS 从开源权重 LLM 中移除拒绝行为 — 采用机制可解释性技术（均值差分、SVD、白化 SVD、LEACE、SAE 分解等）切除防护栏同时保留推理能力。9 种 CLI 方法，28 个分析模块，116 个模型预设… | `mlops/inference/obliteratus` |
| `outlines` | 在生成过程中保证有效的 JSON/XML/代码结构，使用 Pydantic 模型实现类型安全输出，支持本地模型（Transformers、vLLM），并通过 Outlines（dottxt.ai 的结构化生成库）最大化推理速度 | `mlops/inference/outlines` |
| `serving-llms-vllm` | 使用 vLLM 的 PagedAttention 和连续批处理以高吞吐量服务 LLM。在部署生产级 LLM API、优化推理延迟/吞吐量或在 GPU 内存有限的情况下服务模型时使用。支持 OpenAI 兼容端点、量化（GPTQ/AWQ/FP8）… | `mlops/inference/vllm` |

## mlops/models

特定模型架构 — 图像分割（SAM）和音频生成（AudioCraft / MusicGen）。其他模型技能（CLIP、Stable Diffusion、Whisper、LLaVA）可作为可选技能使用。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `audiocraft-audio-generation` | 用于音频生成的 PyTorch 库，包括文本到音乐（MusicGen）和文本到声音（AudioGen）。在需要根据文本描述生成音乐、创建音效或执行旋律条件音乐生成时使用。 | `mlops/models/audiocraft` |
| `segment-anything-model` | 具有零样本迁移能力的图像分割基础模型。在需要使用点、框或掩码作为提示来分割图像中的任何对象，或自动生成分割图像中所有对象的掩码时使用。 | `mlops/models/segment-anything` |

## mlops/research

用于通过声明式编程构建和优化 AI 系统的 ML 研究框架。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `dspy` | 使用声明式编程构建复杂 AI 系统，自动优化提示，创建模块化 RAG 系统和智能体 — DSPy（斯坦福 NLP 的系统化 LM 编程框架） | `mlops/research/dspy` |

## mlops/training

微调、RLHF/DPO/GRPO 训练、分布式训练框架和优化工具。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `axolotl` | 使用 Axolotl 微调 LLM 的专家指导 — YAML 配置、100+ 模型、LoRA/QLoRA、DPO/KTO/ORPO/GRPO、多模态支持 | `mlops/training/axolotl` |
| `fine-tuning-with-trl` | 使用 TRL 进行强化学习微调 LLM — SFT 用于指令调优，DPO 用于偏好对齐，PPO/GRPO 用于奖励优化，以及奖励模型训练。在需要 RLHF、使模型与偏好对齐或从人类反馈训练时使用。支持 HuggingFace… | `mlops/training/trl-fine-tuning` |
| `unsloth` | 使用 Unsloth 进行快速微调的专家指导 — 训练速度提升 2-5 倍，内存减少 50-80%，LoRA/QLoRA 优化 | `mlops/training/unsloth` |

## note-taking

笔记技能，用于保存信息、协助研究以及协作进行多会话规划。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `obsidian` | 读取、搜索和在 Obsidian 保险库中创建笔记。 | `note-taking/obsidian` |

## productivity

文档创建、演示文稿、电子表格和其他生产力工作流的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `google-workspace` | 为 Hermes 提供 Gmail、日历、云端硬盘、联系人、表格和文档集成。使用 Hermes 管理的 OAuth2 设置，优先使用 Google Workspace CLI（`gws`）以获得更广泛的 API 覆盖，否则回退到 Python 客户端库。 | `productivity/google-workspace` |
| `linear` | 通过 GraphQL API 管理 Linear 问题、项目和团队。创建、更新、搜索和组织问题。使用 API 密钥认证（无需 OAuth）。所有操作均通过 curl — 无依赖。 | `productivity/linear` |
| `maps` | 位置智能 — 地理编码、反向地理编码、附近 POI 搜索（44 个类别，通过 `--near` 指定坐标或地址）、驾车/步行/骑行距离 + 时间、逐向导航、时区、边界框 + 面积、矩形区域内 POI 搜索。使用 OpenStreetMap + Overpass + OSRM。无需 API 密钥。Telegram 位置引脚友好。 | `productivity/maps` |
| `nano-pdf` | 使用 nano-pdf CLI 通过自然语言指令编辑 PDF。修改文本、修复拼写错误、更新标题并对特定页面进行内容更改，无需手动编辑。 | `productivity/nano-pdf` |
| `notion` | 通过 curl 使用 Notion API 创建和管理页面、数据库和块。直接从终端搜索、创建、更新和查询 Notion 工作区。 | `productivity/notion` |
| `ocr-and-documents` | 从 PDF 和扫描文档中提取文本。远程 URL 使用 web_extract，本地文本型 PDF 使用 pymupdf，OCR/扫描文档使用 marker-pdf。DOCX 使用 python-docx，PPTX 参见 powerpoint 技能。 | `productivity/ocr-and-documents` |
| `powerpoint` | 任何时候涉及 .pptx 文件时都使用此技能 — 作为输入、输出或两者。包括：创建幻灯片、宣传幻灯片或演示文稿；读取、解析或从任何 .pptx 文件提取文本（即使提取的内容将用于其他地方，如… | `productivity/powerpoint` |

## red-teaming

LLM 红队测试、越狱和安全过滤器绕过研究技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `godmode` | 使用 G0DM0D3 技术对 API 服务的 LLM 进行越狱 — Parseltongue 输入混淆（33 种技术）、GODMODE CLASSIC 系统提示模板、ULTRAPLINIAN 多模型竞速、编码升级以及 Hermes 原生预填充/系统提示集成。当用户希望绕过… | `red-teaming/godmode` |

## research

学术研究、论文发现、文献综述、市场数据、内容监控和科学知识检索技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `arxiv` | 使用 arXiv 免费 REST API 搜索和检索学术论文。无需 API 密钥。可按关键词、作者、类别或 ID 搜索。可与 web_extract 或 ocr-and-documents 技能结合以阅读完整论文内容。 | `research/arxiv` |
| `blogwatcher` | 使用 blogwatcher-cli 工具监控博客和 RSS/Atom 订阅源的更新。添加博客、扫描新文章、跟踪阅读状态并按类别过滤。 | `research/blogwatcher` |
| `llm-wiki` | Karpathy 的 LLM Wiki — 构建和维护一个持久、相互链接的 Markdown 知识库。摄取来源、查询编译知识并检查一致性。 | `research/llm-wiki` |
| `polymarket` | 查询 Polymarket 预测市场数据 — 搜索市场、获取价格、订单簿和价格历史。通过公共 REST API 只读访问，无需 API 密钥。 | `research/polymarket` |
| `research-paper-writing` | 编写 ML/AI 研究论文的端到端流水线 — 从实验设计到分析、起草、修订和提交。涵盖 NeurIPS、ICML、ICLR、ACL、AAAI、COLM。集成自动实验监控、统计分析、迭代写作和引用… | `research/research-paper-writing` |

## smart-home

控制智能家居设备 — 灯光、开关、传感器和家庭自动化系统的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `openhue` | 通过 OpenHue CLI 控制 Philips Hue 灯光、房间和场景。开关灯光、调节亮度、颜色、色温并激活场景。 | `smart-home/openhue` |

## social-media

与社交平台交互 — 发布、阅读、监控和账户操作的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `xurl` | 通过 xurl（官方 X API CLI）与 X/Twitter 交互。用于发布、回复、引用、搜索、时间线、提及、点赞、转发、书签、关注、私信、媒体上传和原始 v2 端点访问。 | `social-media/xurl` |

## software-development

通用软件工程技能 — 规划、审查、调试和测试驱动开发。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `plan` | Hermes 的规划模式 — 检查上下文，将 Markdown 计划写入活动工作空间的 `.hermes/plans/` 目录，但不执行工作。 | `software-development/plan` |
| `requesting-code-review` | 预提交验证流水线 — 静态安全扫描、基线感知质量门禁、独立审查子智能体和自动修复循环。在代码更改后、提交、推送或打开 PR 前使用。 | `software-development/requesting-code-review` |
| `subagent-driven-development` | 在执行具有独立任务的实现计划时使用。为每个任务分派新的 delegate_task，并进行两阶段审查（规范合规性然后代码质量）。 | `software-development/subagent-driven-development` |
| `systematic-debugging` | 遇到任何 bug、测试失败或意外行为时使用。四阶段根本原因调查 — 在不理解问题之前不进行任何修复。 | `software-development/systematic-debugging` |
| `test-driven-development` | 在实现任何功能或修复 bug 时使用，在编写实现代码之前。强制执行 RED-GREEN-REFACTOR 循环，采用测试优先方法。 | `software-development/test-driven-development` |
| `writing-plans` | 当有多步骤任务的规范或需求时使用。创建包含小块任务、精确文件路径和完整代码示例的综合实现计划。 | `software-development/writing-plans` |


---

# 可选技能

可选技能随仓库一起提供，位于 `optional-skills/` 目录下，但**默认不激活**。它们涵盖更重量级或小众的用例。使用以下命令安装：

```bash
hermes skills install official/<category>/<skill>
```

## autonomous-ai-agents

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `blackbox` | 将编码任务委派给 Blackbox AI CLI 智能体。内置评判器的多模型智能体，将任务通过多个 LLM 运行并选择最佳结果。需要安装 blackbox CLI 和 Blackbox AI API 密钥。 | `autonomous-ai-agents/blackbox` |

## blockchain

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `base` | 查询 Base（以太坊 L2）区块链数据并显示美元价格 — 钱包余额、代币信息、交易详情、Gas 分析、合约检查、巨鲸检测和实时网络统计。使用 Base RPC + CoinGecko。无需 API 密钥。 | `blockchain/base` |
| `solana` | 查询 Solana 区块链数据并显示美元价格 — 钱包余额、带价值的代币投资组合、交易详情、NFT、巨鲸检测和实时网络统计。使用 Solana RPC + CoinGecko。无需 API 密钥。 | `blockchain/solana` |

## creative

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `blender-mcp` | 通过套接字连接 Blender 的 blender-mcp 插件，直接从 Hermes 控制 Blender。创建 3D 对象、材质、动画并运行任意 Blender Python（bpy）代码。 | `creative/blender-mcp` |
| `meme-generation` | 通过选择模板并使用 Pillow 叠加文本生成真实的迷因图像。生成实际的 .png 迷因文件。 | `creative/meme-generation` |
| `touchdesigner-mcp` | 通过 twozero MCP 插件控制正在运行的 TouchDesigner 实例 — 创建操作符、设置参数、连接线路、执行 Python、构建实时音频反应式视觉效果和 GLSL 网络。36 个原生工具。 | `creative/touchdesigner-mcp` |

## devops

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `docker-management` | 管理 Docker 容器、镜像、卷、网络和 Compose 栈 — 生命周期操作、调试、清理和 Dockerfile 优化。 | `devops/docker-management` |

## email

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `agentmail` | 通过 AgentMail 为智能体提供专用邮箱。使用智能体拥有的邮箱地址（例如 hermes-agent@agentmail.to）自主发送、接收和管理电子邮件。 | `email/agentmail` |

## health

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `neuroskill-bci` | 连接到正在运行的 NeuroSkill 实例，并将用户的实时认知和情绪状态（专注度、放松度、情绪、认知负荷、困倦度、心率、HRV、睡眠分期以及 40+ 衍生 EXG 分数）融入响应中。需要 BCI 可穿戴设备（Muse 2/S 或 OpenBCI）和 NeuroSkill 桌面应用。 | `health/neuroskill-bci` |

## mcp

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `fastmcp` | 使用 Python 中的 FastMCP 构建、测试、检查、安装和部署 MCP 服务器。在创建新的 MCP 服务器、将 API 或数据库包装为 MCP 工具、暴露资源或提示，或准备将 FastMCP 服务器部署到 HTTP 时使用。 | `mcp/fastmcp` |

## migration

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `openclaw-migration` | 将用户的 OpenClaw 自定义配置迁移到 Hermes 智能体。从 ~/.openclaw 导入与 Hermes 兼容的记忆、SOUL.md、命令白名单、用户技能和选定的工作空间资产，然后报告无法迁移的内容及其原因。 | `migration/openclaw-migration` |

## productivity

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `telephony` | 为 Hermes 提供电话功能 — 配置并持久化 Twilio 号码，发送和接收 SMS/MMS，进行直接呼叫，并通过 Bland.ai 或 Vapi 进行 AI 驱动的出站呼叫。 | `productivity/telephony` |

## research

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `bioinformatics` | 通往来自 bioSkills 和 ClawBio 的 400+ 生物信息学技能的网关。涵盖基因组学、转录组学、单细胞、变异调用、药物基因组学、宏基因组学、结构生物学等。 | `research/bioinformatics` |
| `qmd` | 使用 qmd（一种结合 BM25、向量搜索和 LLM 重排序的混合检索引擎）在本地搜索个人知识库、笔记、文档和会议记录。支持 CLI 和 MCP 集成。 | `research/qmd` |

## security

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `1password` | 设置并使用 1Password CLI（op）。在安装 CLI、启用桌面应用集成、登录以及为命令读取/注入机密时使用。 | `security/1password` |
| `oss-forensics` | 对 GitHub 仓库进行供应链调查、证据恢复和取证分析。涵盖已删除提交恢复、强制推送检测、IOC 提取、多源证据收集和结构化取证报告。 | `security/oss-forensics` |
| `sherlock` | 在 400+ 社交网络上进行 OSINT 用户名搜索。通过用户名追踪社交媒体账户。 | `security/sherlock` |