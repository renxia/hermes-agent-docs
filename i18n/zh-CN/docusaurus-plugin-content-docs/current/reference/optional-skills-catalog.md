---
sidebar_position: 9
title: "可选技能目录"
description: "hermes 官方附带的可选技能 — 通过 hermes skills install official/<category>/<skill> 安装"
---

# 可选技能目录

可选技能随 hermes 附带在 `optional-skills/` 目录下，但**默认未激活**。需显式安装：

```bash
hermes skills install official/<category>/<skill>
```

例如：

```bash
hermes skills install official/blockchain/solana
hermes skills install official/mlops/flash-attention
```

以下每个技能都链接到一个专用页面，包含其完整定义、设置和用法。

要卸载：

```bash
hermes skills uninstall <skill-name>
```

## autonomous-ai-agents

| 技能 | 描述 |
|-------|-------------|
| [**blackbox**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-blackbox) | 将编码任务委托给 Blackbox AI CLI 智能体。多模型智能体，内置评判器，通过多个 LLM 运行任务并选择最佳结果。需要安装 blackbox CLI 和有效的 Blackbox AI API 密钥。 |
| [**honcho**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-honcho) | 配置并使用 Honcho 记忆与 Hermes 集成 — 跨会话用户建模、多配置文件对等隔离、观察配置、辩证推理、会话摘要以及上下文预算管理。在设置 Honcho 时使用，也适用于故障排除... |

## 区块链

| 技能 | 描述 |
|------|------|
| [**base**](/docs/user-guide/skills/optional/blockchain/blockchain-base) | 查询 Base (Ethereum L2) 区块链数据，并提供美元定价 — 钱包余额、代币信息、交易详情、Gas分析、合约检查、巨鲸检测和实时网络统计。使用 Base RPC + CoinGecko。无需API密钥。 |
| [**solana**](/docs/user-guide/skills/optional/blockchain/blockchain-solana) | 查询 Solana 区块链数据，并提供美元定价 — 钱包余额、带估值的代币组合、交易详情、NFT、巨鲸检测和实时网络统计。使用 Solana RPC + CoinGecko。无需API密钥。 |

## 通信

| 技能 | 描述 |
|------|------|
| [**one-three-one-rule**](/docs/user-guide/skills/optional/communication/communication-one-three-one-rule) | 用于技术方案和权衡分析的结构化决策框架。当用户面临多种方法（架构决策、工具选择、重构策略、迁移路径）之间的选择时，此技能会... |

## 创意

| 技能 | 描述 |
|------|------|
| [**blender-mcp**](/docs/user-guide/skills/optional/creative/creative-blender-mcp) | 通过与 blender-mcp 插件的套接字连接，直接从 Hermes 控制 Blender。创建 3D 对象、材质、动画，并运行任意 Blender Python (bpy) 代码。当用户想要在 Blender 中创建或修改任何内容时使用。 |
| [**concept-diagrams**](/docs/user-guide/skills/optional/creative/creative-concept-diagrams) | 生成扁平、最小化、明暗感知的 SVG 图表作为独立 HTML 文件，使用统一的教育视觉语言，包含9种语义色阶、句子大小写排版和自动暗色模式。最适合教育和注释... |
| [**hyperframes**](/docs/user-guide/skills/optional/creative/creative-hyperframes) | 使用 HyperFrames 创建基于 HTML 的视频合成、动画标题卡、社交覆盖层、带字幕的讲话者头部视频、音频响应视觉效果和着色器过渡。HTML 是视频的真实来源。当用户想要... |
| [**kanban-video-orchestrator**](/docs/user-guide/skills/optional/creative/creative-kanban-video-orchestrator) | 规划、设置和监控由 Hermes 看板支持的多智能体视频制作流程。当用户想要制作任何视频时使用 — 叙事电影、产品/营销、音乐视频、讲解视频、ASCII/终端艺术、抽象/生成式外观... |
| [**meme-generation**](/docs/user-guide/skills/optional/creative/creative-meme-generation) | 通过选择模板并使用 Pillow 叠加文本生成真实表情包图片。生成实际的 .png 表情包文件。 |

## 开发运维

| 技能 | 描述 |
|------|------|
| [**inference-sh-cli**](/docs/user-guide/skills/optional/devops/devops-cli) | 通过 inference.sh CLI (infsh) 运行 150+ AI 应用 — 图像生成、视频创建、LLM、搜索、3D、社交自动化。使用终端工具。触发词：inference.sh, infsh, ai apps, flux, veo, image generation, video generation, seedrea... |
| [**docker-management**](/docs/user-guide/skills/optional/devops/devops-docker-management) | 管理 Docker 容器、镜像、卷、网络和 Compose 栈 — 生命周期操作、调试、清理和 Dockerfile 优化。 |
| [**watchers**](/docs/user-guide/skills/optional/devops/devops-watchers) | 通过水印去重轮询 RSS、JSON API 和 GitHub。 |

## 内部试用

| 技能 | 描述 |
|------|------|
| [**adversarial-ux-test**](/docs/user-guide/skills/optional/dogfood/dogfood-adversarial-ux-test) | 为你的产品扮演最难缠、最抗拒技术的用户。以该角色浏览应用，找出每一个用户体验痛点，然后通过务实层过滤投诉，将真正的问题与噪音分离。创建可操作的工单... |

## 电子邮件

| 技能 | 描述 |
|------|------|
| [**agentmail**](/docs/user-guide/skills/optional/email/email-agentmail) | 通过 AgentMail 为智能体提供其专用的收件箱。使用智能体拥有的电子邮件地址（例如 hermes-agent@agentmail.to）自主发送、接收和管理电子邮件。 |

## 金融

| 技能 | 描述 |
|------|------|
| [**3-statement-model**](/docs/user-guide/skills/optional/finance/finance-3-statement-model) | 在 Excel 中构建完全集成的三表模型（利润表、资产负债表、现金流量表），包含营运资金计划表、折旧摊销滚动表、债务计划表以及使现金和留存收益保持平衡的调节项。与 excel-author 配合使用。 |
| [**comps-analysis**](/docs/user-guide/skills/optional/finance/finance-comps-analysis) | 在 Excel 中构建可比公司分析 — 运营指标、估值倍数、与同行组的统计基准对比。与 excel-author 配合使用。用于上市公司估值、IPO定价、行业基准或异常值检测。 |
| [**dcf-model**](/docs/user-guide/skills/optional/finance/finance-dcf-model) | 在 Excel 中构建机构级的 DCF 估值模型 — 收入预测、自由现金流构建、WACC、终值、熊市/基准/牛市情景、5x5 敏感性分析表。与 excel-author 配合使用。用于股权内在价值分析。 |
| [**excel-author**](/docs/user-guide/skills/optional/finance/finance-excel-author) | 使用 openpyxl 无头构建可审计的 Excel 工作簿 — 蓝/黑/绿色单元格惯例、使用公式而非硬编码、命名范围、余额检查、敏感性分析表。用于财务模型、审计输出、对账。 |
| [**lbo-model**](/docs/user-guide/skills/optional/finance/finance-lbo-model) | 在 Excel 中构建杠杆收购模型 — 资金来源与运用、债务计划表、现金清偿、退出倍数、IRR/MOIC 敏感性分析。与 excel-author 配合使用。用于私募股权筛选、发起人案例估值或推介中的示意性杠杆收购。 |
| [**merger-model**](/docs/user-guide/skills/optional/finance/finance-merger-model) | 在 Excel 中构建增厚/摊薄（并购）模型 — 模拟利润表、协同效应、融资组合、每股收益影响。与 excel-author 配合使用。用于并购推介、董事会材料或交易评估。 |
| [**pptx-author**](/docs/user-guide/skills/optional/finance/finance-pptx-author) | 使用 python-pptx 无头构建 PowerPoint 演示文稿。与 excel-author 配合使用，用于模型支持的演示文稿，其中每个数字都可追溯到工作簿单元格。用于推介材料、投资备忘录、盈利报告。 |

## 健康

| 技能 | 描述 |
|------|------|
| [**fitness-nutrition**](/docs/user-guide/skills/optional/health/health-fitness-nutrition) | 健身锻炼计划和营养跟踪器。通过 wger 搜索 690+ 项练习，可按肌肉、器材或类别筛选。通过 USDA FoodData Central 查询 380,000+ 种食物的宏量营养素和热量。计算 BMI、TDEE、单次最大重量、宏量营养素分配和体... |
| [**neuroskill-bci**](/docs/user-guide/skills/optional/health/health-neuroskill-bci) | 连接到运行中的 NeuroSkill 实例，并将用户的实时认知和情绪状态（专注度、放松度、情绪、认知负荷、困倦度、心率、HRV、睡眠阶段和 40+ 种衍生 EXG 评分）纳入响应... |

## MCP

| 技能 | 描述 |
|------|------|
| [**fastmcp**](/docs/user-guide/skills/optional/mcp/mcp-fastmcp) | 使用 Python 中的 FastMCP 构建、测试、检查、安装和部署 MCP 服务器。用于创建新的 MCP 服务器、将 API 或数据库封装为 MCP 工具、暴露资源或提示，或为 Claude Code、Cur... 准备 FastMCP 服务器。 |
| [**mcporter**](/docs/user-guide/skills/optional/mcp/mcp-mcporter) | 使用 mcporter CLI 直接列出、配置、授权和调用 MCP 服务器/工具（HTTP 或 stdio），包括临时服务器、配置编辑和 CLI/类型生成。 |

## 迁移

| 技能 | 描述 |
|------|------|
| [**openclaw-migration**](/docs/user-guide/skills/optional/migration/migration-openclaw-migration) | 将用户的 OpenClaw 定制配置迁移至 Hermes Agent。从 ~/.openclaw 导入与 Hermes 兼容的记忆、SOUL.md、命令允许列表、用户技能和选定的工作区资产，然后准确报告无法迁移的部... |

## MLOps

| 技能 | 描述 |
|------|------|
| [**huggingface-accelerate**](/docs/user-guide/skills/optional/mlops/mlops-accelerate) | 最简单的分布式训练 API。4行代码即可为任何 PyTorch 脚本添加分布式支持。适用于 DeepSpeed/FSDP/Megatron/DDP 的统一 API。自动设备放置、混合精度 (FP16/BF16/FP8)。交互式配置、单启动命令... |
| [**axolotl**](/docs/user-guide/skills/optional/mlops/mlops-training-axolotl) | Axolotl：基于 YAML 的 LLM 微调 (LoRA, DPO, GRPO)。 |
| [**chroma**](/docs/user-guide/skills/optional/mlops/mlops-chroma) | 用于 AI 应用的开源嵌入数据库。存储嵌入和元数据，执行向量和全文搜索，按元数据过滤。简单的4函数 API。可从笔记本扩展到生产集群。用于语义搜索、RAG... |
| [**clip**](/docs/user-guide/skills/optional/mlops/mlops-clip) | OpenAI 的连接视觉与语言的模型。实现零样本图像分类、图文匹配和跨模态检索。在4亿图文对上训练。用于图像搜索、内容审核或视觉语言任务... |
| [**faiss**](/docs/user-guide/skills/optional/mlops/mlops-faiss) | Facebook 的用于密集向量高效相似性搜索和聚类的库。支持数十亿向量、GPU 加速和各种索引类型 (Flat, IVF, HNSW)。用于快速 k-NN 搜索、大规模向量检索或... |
| [**optimizing-attention-flash**](/docs/user-guide/skills/optional/mlops/mlops-flash-attention) | 使用 Flash Attention 优化 transformer 注意力，实现 2-4 倍加速和 10-20 倍内存减少。用于训练/运行长序列 (>512 token) 的 transformer，遇到注意力相关的 GPU 内存问题，或需要更快的推理... |
| [**guidance**](/docs/user-guide/skills/optional/mlops/mlops-guidance) | 使用正则表达式和语法控制 LLM 输出，保证生成有效的 JSON/XML/代码，强制执行结构化格式，并使用 Guidance（微软研究院的约束生成框架）构建多步骤工作流。 |
| [**hermes-atropos-environments**](/docs/user-guide/skills/optional/mlops/mlops-hermes-atropos-environments) | 为 Atropos 训练构建、测试和调试 Hermes Agent 强化学习环境。涵盖 HermesAgentBaseEnv 接口、奖励函数、智能体循环集成、带工具的评估、wandb 日志记录和三种 CLI 模式 (serve/process/eva... |
| [**huggingface-tokenizers**](/docs/user-guide/skills/optional/mlops/mlops-huggingface-tokenizers) | 针对研究和生产优化的快速分词器。基于 Rust 的实现在 &lt;20 秒内可分词 1GB 文本。支持 BPE、WordPiece 和 Unigram 算法。训练自定义词表，跟踪对齐，处理填充/截断。集成... |
| [**instructor**](/docs/user-guide/skills/optional/mlops/mlops-instructor) | 使用 Pydantic 验证从 LLM 响应中提取结构化数据，自动重试失败的提取，解析具有类型安全性的复杂 JSON，并使用 Instructor（久经考验的结构化输出库）流式传输部分结果。 |
| [**lambda-labs-gpu-cloud**](/docs/user-guide/skills/optional/mlops/mlops-lambda-labs) | 用于 ML 训练和推理的预留和按需 GPU 云实例。当您需要具有简单 SSH 访问、持久文件系统或用于大规模训练的高性能多节点集群的专用 GPU 实例时使用。 |
| [**llava**](/docs/user-guide/skills/optional/mlops/mlops-llava) | 大型语言与视觉助手。实现视觉指令微调和基于图像的对话。结合 CLIP 视觉编码器和 Vicuna/LLaMA 语言模型。支持多轮图像对话、视觉问答和指令... |
| [**modal-serverless-gpu**](/docs/user-guide/skills/optional/mlops/mlops-modal) | 用于运行 ML 工作负载的无服务器 GPU 云平台。当您需要无需基础设施管理的按需 GPU 访问、将 ML 模型部署为 API，或运行具有自动扩展的批处理作业时使用。 |
| [**nemo-curator**](/docs/user-guide/skills/optional/mlops/mlops-nemo-curator) | 用于 LLM 训练的 GPU 加速数据策展。支持文本/图像/视频/音频。具有模糊去重（速度快16倍）、质量过滤（30+ 启发式规则）、语义去重、PII 编辑、NSFW 检测。可在 GPU 间扩展... |
| [**outlines**](/docs/user-guide/skills/optional/mlops/mlops-inference-outlines) | Outlines：结构化 JSON/正则/Pydantic LLM 生成。 |
| [**peft-fine-tuning**](/docs/user-guide/skills/optional/mlops/mlops-peft) | 使用 LoRA、QLoRA 和 25+ 种方法对 LLM 进行参数高效微调。当使用有限 GPU 内存微调大型模型（7B-70B），需要在最小精度损失下训练 &lt;1% 的参数，或用于多适配器设置... |
| [**pinecone**](/docs/user-guide/skills/optional/mlops/mlops-pinecone) | 用于生产 AI 应用的托管向量数据库。完全托管、自动扩展，支持混合搜索（密集 + 稀疏）、元数据过滤和命名空间。低延迟 (&lt;100ms p95)。用于生产 RAG、推荐系统或... |
| [**pytorch-fsdp**](/docs/user-guide/skills/optional/mlops/mlops-pytorch-fsdp) | 关于使用 PyTorch FSDP 进行完全分片数据并行训练的专家指导 - 参数分片、混合精度、CPU 卸载、FSDP2 |
| [**pytorch-lightning**](/docs/user-guide/skills/optional/mlops/mlops-pytorch-lightning) | 高级 PyTorch 框架，包含 Trainer 类、自动分布式训练 (DDP/FSDP/DeepSpeed)、回调系统和最少的样板代码。使用相同代码从笔记本扩展到超级计算机。当您想要干净的训练循环并... |
| [**qdrant-vector-search**](/docs/user-guide/skills/optional/mlops/mlops-qdrant) | 用于 RAG 和语义搜索的高性能向量相似性搜索引擎。当构建需要快速近邻搜索、带过滤的混合搜索或具有 Rust 性能的可扩展向量存储的生产 RAG 系统时使用... |
| [**sparse-autoencoder-training**](/docs/user-guide/skills/optional/mlops/mlops-saelens) | 提供使用 SAELens 训练和分析稀疏自编码器 (SAE) 的指导，以将神经网络激活分解为可解释的特征。当发现可解释特征、分析叠加或研究... |
| [**simpo-training**](/docs/user-guide/skills/optional/mlops/mlops-simpo) | 用于 LLM 对齐的简单偏好优化。无需参考模型的 DPO 替代方案，性能更优 (AlpacaEval 2.0 上 +6.4 分)。无需参考模型，比 DPO 更高效。当想要简单的偏好对齐时使用... |
| [**slime-rl-training**](/docs/user-guide/skills/optional/mlops/mlops-slime) | 提供使用 slime（一个 Megatron+SGLang 框架）对 LLM 进行后训练强化学习的指导。用于训练 GLM 模型、实现自定义数据生成工作流，或需要紧密的 Megatron-LM 集成以进行 RL 扩展。 |
| [**stable-diffusion-image-generation**](/docs/user-guide/skills/optional/mlops/mlops-stable-diffusion) | 通过 HuggingFace Diffusers 使用 Stable Diffusion 模型生成最先进文本到图像。用于从文本提示生成图像、执行图像到图像转换、修复，或构建自定义扩散管道。 |
| [**tensorrt-llm**](/docs/user-guide/skills/optional/mlops/mlops-tensorrt-llm) | 使用 NVIDIA TensorRT 优化 LLM 推理，以实现最大吞吐量和最低延迟。用于在 NVIDIA GPU (A100/H100) 上进行生产部署，当您需要比 PyTorch 快 10-100 倍的推理速度，或用于提供量化的模型服务... |
| [**distributed-llm-pretraining-torchtitan**](/docs/user-guide/skills/optional/mlops/mlops-torchtitan) | 使用 torchtitan 提供 PyTorch 原生分布式 LLM 预训练，支持 4D 并行 (FSDP2, TP, PP, CP)。用于从 8 到 512+ 个 GPU 使用 Float8、torch.compile 和分布式优化器预训练 Llama 3.1、DeepSeek V3 或自定义模型... |
| [**fine-tuning-with-trl**](/docs/user-guide/skills/optional/mlops/mlops-training-trl-fine-tuning) | TRL：用于 LLM RLHF 的 SFT、DPO、PPO、GRPO、奖励建模。 |
| [**unsloth**](/docs/user-guide/skills/optional/mlops/mlops-training-unsloth) | Unsloth：LoRA/QLoRA 微调速度提升 2-5 倍，显存占用更少。 |
| [**whisper**](/docs/user-guide/skills/optional/mlops/mlops-whisper) | OpenAI 的通用语音识别模型。支持 99 种语言、转录、翻译为英语和语言识别。六种模型尺寸，从 tiny (39M 参数) 到 large (1550M 参数)。用于语音转文本、播客... |

## 生产力

| 技能 | 描述 |
|-------|-------------|
| [**canvas**](/docs/user-guide/skills/optional/productivity/productivity-canvas) | Canvas LMS 集成 — 使用 API 令牌认证获取已注册课程和作业。 |
| [**here.now**](/docs/user-guide/skills/optional/productivity/productivity-here-now) | 将静态站点发布到 &#123;slug&#125;.here.now，并将私有文件存储在云端驱动器中，用于智能体之间的交接。 |
| [**memento-flashcards**](/docs/user-guide/skills/optional/productivity/productivity-memento-flashcards) | 间隔重复记忆卡系统。从事实或文本创建卡片，与记忆卡进行自由文本对话并由智能体评分，从 YouTube 字幕生成测验，使用自适应调度复习到期卡片，以及导入/导出... |
| [**shop-app**](/docs/user-guide/skills/optional/productivity/productivity-shop-app) | Shop.app：产品搜索、订单跟踪、退货、重新订购。 |
| [**shopify**](/docs/user-guide/skills/optional/productivity/productivity-shopify) | 通过 curl 调用 Shopify 管理和商店前台 GraphQL API。涵盖产品、订单、客户、库存、元字段。 |
| [**siyuan**](/docs/user-guide/skills/optional/productivity/productivity-siyuan) | 思源笔记 API，通过 curl 在自托管知识库中搜索、阅读、创建和管理块及文档。 |
| [**telephony**](/docs/user-guide/skills/optional/productivity/productivity-telephony) | 为 Hermes 添加电话功能，无需修改核心工具。配置并持久化 Twilio 号码，收发短信/彩信，直接拨打电话，以及通过 Bland.ai 或 Vapi 进行 AI 驱动的外呼。 |

## 研究

| 技能 | 描述 |
|-------|-------------|
| [**bioinformatics**](/docs/user-guide/skills/optional/research/research-bioinformatics) | 连接来自 bioSkills 和 ClawBio 的 400+ 生物信息学技能的网关。涵盖基因组学、转录组学、单细胞分析、变异检测、药物基因组学、宏基因组学、结构生物学等。获取领域特定参考材料... |
| [**domain-intel**](/docs/user-guide/skills/optional/research/research-domain-intel) | 使用 Python 标准库进行被动域名侦察。子域名发现、SSL 证书检查、WHOIS 查询、DNS 记录、域名可用性检查以及批量多域名分析。无需 API 密钥。 |
| [**drug-discovery**](/docs/user-guide/skills/optional/research/research-drug-discovery) | 药物发现工作流程的药物研究助手。在 ChEMBL 上搜索生物活性化合物，计算类药性（Lipinski Ro5、QED、TPSA、合成可行性），通过 OpenFDA 查询药物相互作用，解读 ADMET... |
| [**duckduckgo-search**](/docs/user-guide/skills/optional/research/research-duckduckgo-search) | 通过 DuckDuckGo 进行免费网页搜索 — 支持文本、新闻、图片、视频。无需 API 密钥。优先使用 `ddgs` CLI（如已安装）；仅在确认当前运行时中可用时才使用 Python DDGS 库。 |
| [**gitnexus-explorer**](/docs/user-guide/skills/optional/research/research-gitnexus-explorer) | 使用 GitNexus 索引代码库，并通过 Web UI + Cloudflare 隧道提供交互式知识图谱服务。 |
| [**parallel-cli**](/docs/user-guide/skills/optional/research/research-parallel-cli) | Parallel CLI 的可选供应商技能 — 原生智能体网页搜索、提取、深度研究、数据增强、FindAll 和监控。优先使用 JSON 输出和非交互式流程。 |
| [**qmd**](/docs/user-guide/skills/optional/research/research-qmd) | 使用 qmd 在本地搜索个人知识库、笔记、文档和会议记录 — 一种混合检索引擎，支持 BM25、向量搜索和 LLM 重排序。支持 CLI 和 MCP 集成。 |
| [**scrapling**](/docs/user-guide/skills/optional/research/research-scrapling) | 使用 Scrapling 进行网页抓取 — HTTP 获取、隐身浏览器自动化、Cloudflare 绕过，以及通过 CLI 和 Python 进行蜘蛛爬取。 |
| [**searxng-search**](/docs/user-guide/skills/optional/research/research-searxng-search) | 通过 SearXNG 进行免费元搜索 — 聚合来自 70+ 个搜索引擎的结果。可自托管或使用公共实例。无需 API 密钥。当网页搜索工具集不可用时自动回退。 |

## 安全

| 技能 | 描述 |
|-------|-------------|
| [**1password**](/docs/user-guide/skills/optional/security/security-1password) | 设置和使用 1Password CLI (op)。适用于安装 CLI、启用桌面应用集成、登录以及为命令读取/注入密钥等场景。 |
| [**oss-forensics**](/docs/user-guide/skills/optional/security/security-oss-forensics) | GitHub 仓库的供应链调查、证据恢复和取证分析。涵盖已删除提交恢复、强制推送检测、IOC 提取、多源证据收集、假设形成/验证，以及 st... |
| [**sherlock**](/docs/user-guide/skills/optional/security/security-sherlock) | 跨 400+ 社交网络的 OSINT 用户名搜索。通过用户名追踪社交媒体账户。 |

## Web 开发

| 技能 | 描述 |
|-------|-------------|
| [**page-agent**](/docs/user-guide/skills/optional/web-development/web-development-page-agent) | 将 alibaba/page-agent 嵌入您自己的 Web 应用 — 一个纯 JavaScript 的页面内 GUI 智能体，以单个 &lt;script> 标签或 npm 包的形式提供，让网站终端用户通过自然语言驱动 UI（"点击登录，填写用户名... |

---

## 贡献可选技能

要向仓库添加新的可选技能：

1. 在 `optional-skills/<类别>/<技能名称>/` 下创建目录
2. 添加包含标准前置元数据（name、description、version、author）的 `SKILL.md`
3. 在 `references/`、`templates/` 或 `scripts/` 子目录中包含所有支持文件
4. 提交拉取请求 — 合并后，该技能将出现在此目录中并拥有自己的文档页面