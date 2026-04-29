---
sidebar_position: 5
title: "内置技能目录"
description: "Hermes 智能体附带的内置技能目录"
---

# 内置技能目录

Hermes 附带一个大型内置技能库，安装时会复制到 `~/.hermes/skills/` 目录。下面每个技能都链接到一个专用页面，其中包含其完整定义、设置和使用方法。

如果某个技能在此列表中缺失，但在代码库中存在，则目录会通过 `website/scripts/generate-skill-docs.py` 重新生成。

## apple

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`apple-notes`](/docs/user-guide/skills/bundled/apple/apple-apple-notes) | 在 macOS 上通过 memo CLI 管理 Apple Notes（创建、查看、搜索、编辑）。 | `apple/apple-notes` |
| [`apple-reminders`](/docs/user-guide/skills/bundled/apple/apple-apple-reminders) | 通过 remindctl CLI 管理 Apple 提醒事项（列出、添加、完成、删除）。 | `apple/apple-reminders` |
| [`findmy`](/docs/user-guide/skills/bundled/apple/apple-findmy) | 在 macOS 上使用 AppleScript 和屏幕截图通过 FindMy.app 跟踪 Apple 设备和 AirTag。 | `apple/findmy` |
| [`imessage`](/docs/user-guide/skills/bundled/apple/apple-imessage) | 在 macOS 上通过 imsg CLI 发送和接收 iMessage/SMS 消息。 | `apple/imessage` |

## autonomous-ai-agents

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`claude-code`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code) | 将编码任务委派给 Claude Code（Anthropic 的命令行智能体）。用于构建功能、重构、PR 审查以及迭代编码。需要安装 claude CLI。 | `autonomous-ai-agents/claude-code` |
| [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex) | 将编码任务委派给 OpenAI Codex CLI 智能体。用于构建功能、重构、PR 审查以及批量修复问题。需要 codex CLI 和一个 git 仓库。 | `autonomous-ai-agents/codex` |
| [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) | 使用和扩展 Hermes 智能体的完整指南 — 包括 CLI 用法、设置、配置、生成额外智能体、网关平台、技能、语音、工具、配置文件，以及简洁的贡献者参考。在帮助用户时加载此技能... | `autonomous-ai-agents/hermes-agent` |
| [`opencode`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-opencode) | 将编码任务委派给 OpenCode CLI 智能体，用于功能实现、重构、PR 审查以及长时间运行的自主会话。需要安装并认证 opencode CLI。 | `autonomous-ai-agents/opencode` |

## creative

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram) | 生成深色主题的 SVG 图表，展示软件系统和云基础设施，作为独立的 HTML 文件，内嵌 SVG 图形。语义化组件颜色（青色=前端，翠绿色=后端，紫色=数据库，琥珀色=云/AWS，玫瑰色=安全，... | `creative/architecture-diagram` |
| [`ascii-art`](/docs/user-guide/skills/bundled/creative/creative-ascii-art) | 使用 pyfiglet（571 种字体）、cowsay、boxes、toilet、图像转 ASCII、远程 API（asciified, ascii.co.uk）以及 LLM 回退生成 ASCII 艺术。无需 API 密钥。 | `creative/ascii-art` |
| [`ascii-video`](/docs/user-guide/skills/bundled/creative/creative-ascii-video) | ASCII 艺术视频的生产流水线 — 支持任何格式。将视频/音频/图像/生成式输入转换为彩色 ASCII 字符视频输出（MP4、GIF、图像序列）。涵盖：视频转 ASCII 转换、音频反应式音乐可视化器，... | `creative/ascii-video` |
| [`baoyu-comic`](/docs/user-guide/skills/bundled/creative/creative-baoyu-comic) | 支持多种艺术风格和色调的知识漫画创作者。创建原创教育漫画，具有详细的面板布局和序列图像生成。当用户要求创建“知识漫画”、“教育漫画”、“传记漫画”、“教程... | `creative/baoyu-comic` |
| [`baoyu-infographic`](/docs/user-guide/skills/bundled/creative/creative-baoyu-infographic) | 生成专业信息图，包含 21 种布局类型和 21 种视觉样式。分析内容，推荐布局×样式组合，并生成可用于发布的信息图。当用户要求创建“信息图”、“视觉摘要... | `creative/baoyu-infographic` |
| [`ideation`](/docs/user-guide/skills/bundled/creative/creative-creative-ideation) | 通过创意约束生成项目想法。当用户说“我想构建一些东西”、“给我一个项目想法”、“我很无聊”、“我应该做什么”、“启发我”或任何“我有工具但没有方向”的变体时使用。适用于... | `creative/creative-ideation` |
| [`design-md`](/docs/user-guide/skills/bundled/creative/creative-design-md) | 编写、验证、比较和导出 DESIGN.md 文件 — Google 的开源格式规范，为编码智能体提供对设计系统的持久、结构化理解（令牌 + 原理合并在一个文件中）。在构建设计系统时使用，... | `creative/design-md` |
| [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw) | 使用 Excalidraw JSON 格式创建手绘风格图表。生成 .excalidraw 文件，用于架构图、流程图、序列图、概念图等。文件可在 excalidraw.com 上打开或上传以共享... | `creative/excalidraw` |
| [`manim-video`](/docs/user-guide/skills/bundled/creative/creative-manim-video) | 使用 Manim 社区版制作数学和技术动画的生产流水线。创建 3Blue1Brown 风格的解释视频、算法可视化、方程推导、架构图和数据故事。当用户... | `creative/manim-video` |
| [`p5js`](/docs/user-guide/skills/bundled/creative/creative-p5js) | 使用 p5.js 制作交互式和生成式视觉艺术的生产流水线。创建基于浏览器的草图、生成式艺术、数据可视化、交互体验、3D 场景、音频反应式视觉效果和动态图形 — 导出为... | `creative/p5js` |
| [`pixel-art`](/docs/user-guide/skills/bundled/creative/creative-pixel-art) | 将图像转换为复古像素艺术，使用硬件精确调色板（NES、Game Boy、PICO-8、C64 等），并将其动画化为短视频。预设涵盖街机、SNES 和 10+ 个时代正确的风格。使用 `clarify` 让用户选择风格... | `creative/pixel-art` |
| [`popular-web-designs`](/docs/user-guide/skills/bundled/creative/creative-popular-web-designs) | 从真实网站中提取的 54 个生产级设计系统。加载模板以生成与 Stripe、Linear、Vercel、Notion、Airbnb 等网站视觉标识匹配的 HTML/CSS。每个模板包括颜色、排版... | `creative/popular-web-designs` |
| [`songwriting-and-ai-music`](/docs/user-guide/skills/bundled/creative/creative-songwriting-and-ai-music) | 歌曲创作技巧、AI 音乐生成提示（聚焦 Suno）、模仿/改编技巧、语音技巧和经验教训。这些是工具和想法，而不是规则。当艺术需要时，可以打破其中任何一条。 | `creative/songwriting-and-ai-music` |
| [`touchdesigner-mcp`](/docs/user-guide/skills/bundled/creative/creative-touchdesigner-mcp) | 通过 twozero MCP 控制正在运行的 TouchDesigner 实例 — 创建操作符、设置参数、连接线路、执行 Python、构建实时视觉效果。36 个原生工具。 | `creative/touchdesigner-mcp` |

## data-science

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`jupyter-live-kernel`](/docs/user-guide/skills/bundled/data-science/data-science-jupyter-live-kernel) | 使用 live Jupyter 内核进行有状态、迭代的 Python 执行，通过 hamelnb。当任务涉及探索、迭代或检查中间结果时加载此技能 — 数据科学、ML 实验、API 探索或构建... | `data-science/jupyter-live-kernel` |

## devops

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`webhook-subscriptions`](/docs/user-guide/skills/bundled/devops/devops-webhook-subscriptions) | 创建和管理 webhook 订阅，用于事件驱动的智能体激活，或直接推送通知（零 LLM 成本）。当用户希望外部服务触发智能体运行或向聊天推送通知时使用。 | `devops/webhook-subscriptions` |

## dogfood

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`dogfood`](/docs/user-guide/skills/bundled/dogfood/dogfood-dogfood) | 对 Web 应用程序进行系统性的探索性 QA 测试 — 发现错误、捕获证据并生成结构化报告 | `dogfood` |

## email

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`himalaya`](/docs/user-guide/skills/bundled/email/email-himalaya) | 通过 IMAP/SMTP 管理电子邮件的 CLI。使用 himalaya 从终端列出、读取、编写、回复、转发、搜索和组织电子邮件。支持多个账户和使用 MML（MIME 元语言）的消息组合。 | `email/himalaya` |

## gaming

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`minecraft-modpack-server`](/docs/user-guide/skills/bundled/gaming/gaming-minecraft-modpack-server) | 从 CurseForge/Modrinth 服务器包 zip 设置一个模组化的 Minecraft 服务器。涵盖 NeoForge/Forge 安装、Java 版本、JVM 调优、防火墙、局域网配置、备份和启动脚本。 | `gaming/minecraft-modpack-server` |
| [`pokemon-player`](/docs/user-guide/skills/bundled/gaming/gaming-pokemon-player) | 通过无头仿真自主玩 Pokemon 游戏。启动游戏服务器，从 RAM 读取结构化的游戏状态，做出战略决策，并发送按钮输入 — 所有操作都从终端完成。 | `gaming/pokemon-player` |

## github

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`codebase-inspection`](/docs/user-guide/skills/bundled/github/github-codebase-inspection) | 使用 pygount 检查和分析代码库，进行代码行数统计、语言分解和代码与注释比率分析。当被要求检查代码行数、仓库大小、语言组成或代码库统计信息时使用。 | `github/codebase-inspection` |
| [`github-auth`](/docs/user-guide/skills/bundled/github/github-github-auth) | 使用 git（普遍可用）或 gh CLI 为智能体设置 GitHub 身份验证。涵盖 HTTPS 令牌、SSH 密钥、凭证助手和 gh auth — 并带有检测流程以自动选择正确的方法。 | `github/github-auth` |
| [`github-code-review`](/docs/user-guide/skills/bundled/github/github-github-code-review) | 通过分析 git diff、在 PR 上留下内联评论并执行彻底的预推送审查来审查代码更改。可与 gh CLI 配合使用，或回退到通过 curl 使用 git + GitHub REST API。 | `github/github-code-review` |
| [`github-issues`](/docs/user-guide/skills/bundled/github/github-github-issues) | 创建、管理、分类和关闭 GitHub 问题。搜索现有问题、添加标签、分配人员并链接到 PR。可与 gh CLI 配合使用，或回退到通过 curl 使用 git + GitHub REST API。 | `github/github-issues` |
| [`github-pr-workflow`](/docs/user-guide/skills/bundled/github/github-github-pr-workflow) | 完整的拉取请求生命周期 — 创建分支、提交更改、打开 PR、监控 CI 状态、自动修复失败并合并。可与 gh CLI 配合使用，或回退到通过 curl 使用 git + GitHub REST API。 | `github/github-pr-workflow` |
| [`github-repo-management`](/docs/user-guide/skills/bundled/github/github-github-repo-management) | 克隆、创建、分叉、配置和管理 GitHub 仓库。管理远程、机密、发布和工作流。可与 gh CLI 配合使用，或回退到通过 curl 使用 git + GitHub REST API。 | `github/github-repo-management` |

## mcp

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`native-mcp`](/docs/user-guide/skills/bundled/mcp/mcp-native-mcp) | 内置的 MCP（模型上下文协议）客户端，用于连接外部 MCP 服务器，发现其工具，并将其注册为 Hermes 智能体的原生工具。支持 stdio 和 HTTP 传输，具备自动重连、安全过滤... | `mcp/native-mcp` |

## 媒体

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`gif-search`](/docs/user-guide/skills/bundled/media/media-gif-search) | 使用 curl 从 Tenor 搜索和下载 GIF。除 curl 和 jq 外无其他依赖。适用于查找反应 GIF、创建视觉内容以及在聊天中发送 GIF。 | `media/gif-search` |
| [`heartmula`](/docs/user-guide/skills/bundled/media/media-heartmula) | 设置并运行 HeartMuLa，开源音乐生成模型系列（类似 Suno）。根据歌词和标签生成完整歌曲，支持多语言。 | `media/heartmula` |
| [`songsee`](/docs/user-guide/skills/bundled/media/media-songsee) | 通过 CLI 从音频文件生成频谱图及音频特征可视化（梅尔频谱、色度、MFCC、节拍图等）。适用于音频分析、音乐制作调试和可视化文档。 | `media/songsee` |
| [`spotify`](/docs/user-guide/skills/bundled/media/media-spotify) | 控制 Spotify —— 播放音乐、搜索目录、管理播放列表和资料库、检查设备和播放状态。当用户要求播放/暂停/排队音乐、搜索曲目/专辑/艺术家、管理播放列表或查看当前播放内容时加载... | `media/spotify` |
| [`youtube-content`](/docs/user-guide/skills/bundled/media/media-youtube-content) | 获取 YouTube 视频字幕并将其转换为结构化内容（章节、摘要、线程、博客文章）。当用户分享 YouTube URL 或视频链接、要求总结视频、请求字幕或希望将... | `media/youtube-content` |

## mlops

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`audiocraft-audio-generation`](/docs/user-guide/skills/bundled/mlops/mlops-models-audiocraft) | 用于音频生成的 PyTorch 库，包括文本到音乐（MusicGen）和文本到声音（AudioGen）。当您需要根据文本描述生成音乐、创建音效或执行旋律条件音乐生成时使用。 | `mlops/models/audiocraft` |
| [`axolotl`](/docs/user-guide/skills/bundled/mlops/mlops-training-axolotl) | 使用 Axolotl 微调大语言模型的专业指导 - YAML 配置、100+ 模型、LoRA/QLoRA、DPO/KTO/ORPO/GRPO、多模态支持 | `mlops/training/axolotl` |
| [`dspy`](/docs/user-guide/skills/bundled/mlops/mlops-research-dspy) | 使用声明式编程构建复杂 AI 系统，自动优化提示，使用 DSPy 创建模块化 RAG 系统和智能体 - 斯坦福 NLP 的系统化 LM 编程框架 | `mlops/research/dspy` |
| [`huggingface-hub`](/docs/user-guide/skills/bundled/mlops/mlops-huggingface-hub) | Hugging Face Hub CLI (hf) — 搜索、下载和上传模型和数据集，管理仓库，使用 SQL 查询数据集，部署推理端点，管理 Spaces 和存储桶。 | `mlops/huggingface-hub` |
| [`llama-cpp`](/docs/user-guide/skills/bundled/mlops/mlops-inference-llama-cpp) | llama.cpp 本地 GGUF 推理 + HF Hub 模型发现。 | `mlops/inference/llama-cpp` |
| [`evaluating-llms-harness`](/docs/user-guide/skills/bundled/mlops/mlops-evaluation-lm-evaluation-harness) | 在 60+ 学术基准（MMLU、HumanEval、GSM8K、TruthfulQA、HellaSwag）上评估大语言模型。在基准测试模型质量、比较模型、报告学术结果或跟踪训练进度时使用。El... 使用的行业标准 | `mlops/evaluation/lm-evaluation-harness` |
| [`obliteratus`](/docs/user-guide/skills/bundled/mlops/mlops-inference-obliteratus) | 使用 OBLITERATUS 从开源权重大语言模型中移除拒绝行为 — 机械可解释性技术（均值差、SVD、白化 SVD、LEACE、SAE 分解等）以切除防护栏同时保留推理能力。9 种 CLI 方法,... | `mlops/inference/obliteratus` |
| [`outlines`](/docs/user-guide/skills/bundled/mlops/mlops-inference-outlines) | 在生成过程中保证有效的 JSON/XML/代码结构，使用 Pydantic 模型进行类型安全输出，支持本地模型（Transformers、vLLM），并使用 Outlines（dottxt.ai 的结构化生成库）最大化推理速度 | `mlops/inference/outlines` |
| [`segment-anything-model`](/docs/user-guide/skills/bundled/mlops/mlops-models-segment-anything) | 具有零样本迁移能力的图像分割基础模型。当您需要使用点、框或掩码作为提示来分割图像中的任何对象，或自动生

## 智能家居

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`openhue`](/docs/user-guide/skills/bundled/smart-home/smart-home-openhue) | 通过 OpenHue CLI 控制飞利浦 Hue 灯光、房间和场景。可开关灯光、调节亮度、颜色、色温以及激活场景。 | `smart-home/openhue` |

## 社交媒体

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`xurl`](/docs/user-guide/skills/bundled/social-media/social-media-xurl) | 通过 xurl（官方 X API CLI）与 X/Twitter 交互。可用于发帖、回复、引用、搜索、时间线、提及、点赞、转发、收藏、关注、私信、媒体上传以及访问原始 v2 端点。 | `social-media/xurl` |

## 软件开发

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan) | Hermes 的规划模式 — 检查上下文，将 Markdown 格式的计划写入当前工作空间的 `.hermes/plans/` 目录，但不执行工作。 | `software-development/plan` |
| [`requesting-code-review`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review) | 提交前验证流水线 — 静态安全扫描、基于基线的质量门禁、独立的评审子智能体以及自动修复循环。请在代码更改后、提交、推送或打开 PR 前使用。 | `software-development/requesting-code-review` |
| [`subagent-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-subagent-driven-development) | 在执行包含独立任务的实现计划时使用。为每个任务分派新的 delegate_task，并进行两阶段评审（规范符合性，然后是代码质量）。 | `software-development/subagent-driven-development` |
| [`systematic-debugging`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging) | 遇到任何 bug、测试失败或意外行为时使用。四阶段根本原因调查 — 在未理解问题之前，绝不进行修复。 | `software-development/systematic-debugging` |
| [`test-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development) | 在实现任何功能或修复 bug 时使用，在编写实现代码之前。强制执行 RED-GREEN-REFACTOR 循环，采用测试优先的方法。 | `software-development/test-driven-development` |
| [`writing-plans`](/docs/user-guide/skills/bundled/software-development/software-development-writing-plans) | 当您有一个多步骤任务的规范或需求时使用。创建包含细粒度任务、精确文件路径和完整代码示例的综合实现计划。 | `software-development/writing-plans` |