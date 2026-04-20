---
sidebar_position: 9
title: "可选技能目录"
description: "hermes-agent 官方提供的可选技能 — 通过 hermes skills install official/<category>/<skill> 安装"
---

# 可选技能目录

hermes-agent 仓库中的 `optional-skills/` 目录下包含官方提供的可选技能，但**默认不启用**。需显式安装：

```bash
hermes skills install official/<category>/<skill>
```

例如：

```bash
hermes skills install official/blockchain/solana
hermes skills install official/mlops/flash-attention
```

安装后，该技能将出现在代理的技能列表中，并在检测到相关任务时自动加载。

要卸载：

```bash
hermes skills uninstall <skill-name>
```

---

## 自主 AI 代理

| 技能 | 描述 |
|-------|-------------|
| **blackbox** | 将编码任务委托给 Blackbox AI CLI 代理。多模型代理，内置裁判机制，通过多个 LLM 运行任务并选择最佳结果。 |
| **honcho** | 配置并使用 Hermes 的 Honcho 记忆功能 — 跨会话用户建模、多配置文件同伴隔离、观察配置和辩证推理。 |

## 区块链

| 技能 | 描述 |
|-------|-------------|
| **base** | 查询 Base（以太坊 L2）区块链数据及美元计价 — 钱包余额、代币信息、交易详情、Gas 分析、合约检查、鲸鱼检测和网络实时统计。无需 API 密钥。 |
| **solana** | 查询 Solana 区块链数据及美元计价 — 钱包余额、代币组合、交易详情、NFT、鲸鱼检测和网络实时统计。无需 API 密钥。 |

## 通信

| 技能 | 描述 |
|-------|-------------|
| **one-three-one-rule** | 提案和决策制定的结构化沟通框架。 |

## 创意

| 技能 | 描述 |
|-------|-------------|
| **blender-mcp** | 通过 socket 连接直接控制 Blender（使用 blender-mcp 插件）。创建 3D 对象、材质、动画，并执行任意 Blender Python (bpy) 代码。 |
| **concept-diagrams** | 生成扁平、极简的 SVG 图表，支持明暗模式，输出为独立的 HTML 文件，采用统一的教育视觉语言（9 种语义色彩渐变，自动暗色模式）。适用于物理设置、化学机制、数学曲线、实物（飞机、涡轮机、智能手机）、平面图、剖面图、生命周期/流程叙述和中心辐射系统图。附带 15 个示例图表。 |
| **meme-generation** | 通过选择模板并叠加文本生成真实 meme 图片。输出实际的 `.png` meme 文件。 |
| **touchdesigner-mcp** | 通过 twozero MCP 插件控制正在运行的 TouchDesigner 实例 — 创建操作符、设置参数、连接线路、执行 Python 代码，构建实时音频可视化效果和 GLSL 网络。36 个原生工具。 |

## DevOps

| 技能 | 描述 |
|-------|-------------|
| **cli** | 通过 inference.sh CLI（infsh）运行 150+ AI 应用 — 图像生成、视频制作、LLM、搜索、3D 和社会自动化。 |
| **docker-management** | 管理 Docker 容器、镜像、卷、网络和 Compose 堆栈 — 生命周期操作、调试、清理和 Dockerfile 优化。 |

## 邮件

| 技能 | 描述 |
|-------|-------------|
| **agentmail** | 为代理分配专用邮箱收件箱。使用代理拥有的邮箱地址自主发送、接收和管理邮件。 |

## 健康

| 技能 | 描述 |
|-------|-------------|
| **fitness-nutrition** | 健身房锻炼计划和营养追踪器。通过 wger 按肌肉群、设备或类别搜索 690+ 项运动。通过 USDA FoodData Central 查询 38 万+ 食物的宏量营养素和热量。计算 BMI、TDEE、一次最大重量、宏量营养素分配和体脂率 — 纯 Python，无需 pip 安装。 |
| **neuroskill-bci** | 脑机接口（BCI）集成，用于神经科学研究工作流程。 |

## MCP

| 技能 | 描述 |
|-------|-------------|
| **fastmcp** | 使用 FastMCP 在 Python 中构建、测试、检查、安装和部署 MCP 服务器。涵盖将 API 或数据库包装为 MCP 工具、暴露资源或提示，以及部署。 |
| **mcporter** | `mcporter` CLI — 从终端列出、配置、认证并直接调用 MCP 服务器/工具（HTTP 或 stdio）。适用于临时 MCP 交互；如需始终可用的工具发现，请使用内置的 `native-mcp` 客户端。 |

## 迁移

| 技能 | 描述 |
|-------|-------------|
| **openclaw-migration** | 将用户的 OpenClaw 定制足迹迁移至 Hermes Agent。导入记忆、SOUL.md、命令白名单、用户技能和选定的工作区资产。 |

## MLOps

最大的可选类别 — 涵盖从数据整理到生产推理的完整 ML 流水线。

| 技能 | 描述 |
|-------|-------------|
| **accelerate** | 最简单的分布式训练 API。4 行代码即可为任何 PyTorch 脚本添加分布式支持。统一 DeepSpeed/FSDP/Megatron/DDP 的 API。 |
| **chroma** | 开源嵌入数据库。存储嵌入和元数据，执行向量和全文搜索。RAG 和语义搜索的简单 4 函数 API。 |
| **clip** | OpenAI 的视觉-语言模型，连接图像和文本。零样本图像分类、图像-文本匹配和跨模态检索。基于 4 亿图像-文本对训练。可用于图像搜索、内容审核或视觉-语言任务，无需微调。 |
| **faiss** | Facebook 的高效相似性搜索和稠密向量聚类库。支持数十亿向量、GPU 加速和各种索引类型（Flat、IVF、HNSW）。 |
| **flash-attention** | 使用 Flash Attention 优化 Transformer 注意力，实现 2-4 倍速度提升和 10-20 倍内存减少。支持 PyTorch SDPA、flash-attn 库、H100 FP8 和滑动窗口。 |
| **guidance** | 使用正则表达式和语法控制 LLM 输出，保证生成有效的 JSON/XML/代码，强制结构化格式，并通过 Guidance（微软研究院的约束生成框架）构建多步骤工作流。 |
| **hermes-atropos-environments** | 构建、测试和调试 Hermes Agent RL 环境以用于 Atropos 训练。涵盖 HermesAgentBaseEnv 接口、奖励函数、代理循环集成和评估。 |
| **huggingface-tokenizers** | 快速 Rust 基础分词器，适用于研究和生产。20 秒内处理 1GB 数据。支持 BPE、WordPiece 和 Unigram 算法。 |
| **instructor** | 使用 Pydantic 验证从 LLM 响应中提取结构化数据，自动重试失败的提取，并流式传输部分结果。 |
| **lambda-labs** | 预留和按需 GPU 云实例，用于 ML 训练和推理。SSH 访问、持久文件系统和多节点集群。 |
| **llava** | 大型语言和视觉助手 — 结合 CLIP 视觉和 LLaMA 语言模型的视觉指令微调和基于图像的对话。 |
| **modal** | 无服务器 GPU 云平台，用于运行 ML 工作负载。按需 GPU 访问，无需基础设施管理，ML 模型部署为 API 或批处理作业，支持自动扩展。 |
| **nemo-curator** | LLM 训练的 GPU 加速数据整理。模糊去重（快 16 倍）、质量过滤（30+ 启发式）、语义去重、PII 遮蔽。与 RAPIDS 一起扩展。 |
| **peft-fine-tuning** | 使用 LoRA、QLoRA 和 25+ 方法进行 LLM 参数高效微调。在有限 GPU 内存下训练 < 1% 的参数，7B–70B 模型精度损失最小。HuggingFace 官方 PEFT 库。 |
| **pinecone** | 生产级 AI 向量数据库。自动扩展、混合搜索（密集 + 稀疏）、元数据过滤和低延迟（p95 低于 100ms）。 |
| **pytorch-fsdp** | PyTorch FSDP 全分片数据并行训练的专门指导 — 参数分片、混合精度、CPU 卸载、FSDP2。 |
| **pytorch-lightning** | 高级 PyTorch 框架，Trainer 类、自动分布式训练（DDP/FSDP/DeepSpeed）、回调和最小样板代码。 |
| **qdrant** | 高性能向量相似性搜索引擎。Rust 驱动，快速最近邻搜索、带过滤的混合搜索和可扩展向量存储。 |
| **saelens** | 使用 SAELens 训练和分析稀疏自编码器（SAEs），将神经网络激活分解为可解释特征。 |
| **simpo** | 简单偏好优化 — DPO 的无参考替代方案，性能更优（AlpacaEval 2.0 提升 +6.4 分）。无需参考模型。 |
| **slime** | 使用 Megatron+SGLang 框架通过 RL 进行 LLM 后训练。自定义数据生成工作流和紧密的 Megatron-LM 集成以实现 RL 扩展。 |
| **stable-diffusion-image-generation** | 通过 HuggingFace Diffusers 使用 Stable Diffusion 实现最先进的文本到图像生成。文本到图像、图像到图像翻译、修复和自定义扩散管道。 |
| **tensorrt-llm** | 使用 NVIDIA TensorRT 优化 LLM 推理，实现最大吞吐量。在 A100/H100 上比 PyTorch 快 10-100 倍，支持量化（FP8/INT4）和飞行批次。 |
| **torchtitan** | PyTorch 原生的分布式 LLM 预训练，4D 并行（FSDP2、TP、PP、CP）。从 8 到 512+ GPU 扩展，支持 Float8 和 torch.compile。 |
| **whisper** | OpenAI 的多用途语音识别。99 种语言，转录、翻译成英语和语言识别。六种模型尺寸，从 tiny（39M）到 large（1550M）。最适合稳健的多语言 ASR。 |

## 生产力

| 技能 | 描述 |
|-------|-------------|
| **canvas** | Canvas LMS 集成 — 使用 API 令牌身份验证获取注册课程和作业。 |
| **memento-flashcards** | 间隔重复闪卡系统，用于学习和知识保留。 |
| **siyuan** | SiYuan Note API，用于在自建知识库中搜索、阅读、创建和管理块和文档。 |
| **telephony** | 赋予 Hermes 电话能力 — 配置 Twilio 号码，发送/接收 SMS/MMS，拨打电话，并通过 Bland.ai 或 Vapi 进行 AI 驱动的呼出呼叫。 |

## 研究

| 技能 | 描述 |
|-------|-------------|
| **bioinformatics** | bioSkills 和 ClawBio 的 400+ 生物信息学技能的入口。涵盖基因组学、转录组学、单细胞、变异检测、药物基因组学、宏基因组学和结构生物学。 |
| **domain-intel** | 使用 Python stdlib 进行被动域名侦察。子域名发现、SSL 证书检查、WHOIS 查询、DNS 记录和批量多域名分析。无需 API 密钥。 |
| **duckduckgo-search** | 通过 DuckDuckGo 免费网络搜索 — 文本、新闻、图像和视频。无需 API 密钥。 |
| **gitnexus-explorer** | 使用 GitNexus 索引代码库并通过 Web UI 和 Cloudflare 隧道提供交互式知识图谱。 |
| **parallel-cli** | Parallel CLI 供应商技能 — 代理原生的网络搜索、提取、深度研究、丰富和监控。 |
| **qmd** | 使用 qmd（混合检索引擎，结合 BM25、向量搜索和 LLM 重排序）在本地搜索个人知识库、笔记、文档和会议记录。 |
| **scrapling** | 使用 Scrapling 进行网页抓取 — HTTP 获取、隐身浏览器自动化、Cloudflare 绕过和通过 CLI 和 Python 的蜘蛛爬取。 |

## 安全

| 技能 | 描述 |
|-------|-------------|
| **1password** | 设置和使用 1Password CLI（op）。安装 CLI、启用桌面应用集成、登录，并为命令读取/注入秘密。 |
| **oss-forensics** | 开源软件取证 — 分析包、依赖项和供应链风险。 |
| **sherlock** | 在 400+ 社交网络中搜索 OSINT 用户名。通过用户名追查社交媒体账户。 |

---

## 贡献可选技能

要将新可选技能添加到仓库：

1. 在 `optional-skills/<category>/<skill-name>/` 下创建目录
2. 添加带有标准 frontmatter（名称、描述、版本、作者）的 `SKILL.md`
3. 在 `references/`、`templates/` 或 `scripts/` 子目录中包含任何支持文件
4. 提交拉取请求 — 合并后将在此目录中显示