---
sidebar_position: 9
title: "可选技能目录"
description: "hermes-agent 附带的官方可选技能 — 通过 hermes skills install official/<category>/<skill> 安装"
---

# 可选技能目录

可选技能位于 hermes-agent 的 `optional-skills/` 目录下，但**默认未激活**。请显式安装它们：

```bash
hermes skills install official/<category>/<skill>
```

例如：

```bash
hermes skills install official/blockchain/solana
hermes skills install official/mlops/flash-attention
```

下方每个技能都链接到一个专属页面，其中包含其完整定义、设置说明和使用方法。

卸载命令：

```bash
hermes skills uninstall <skill-name>
```

## autonomous-ai-agents

| 技能 | 描述 |
|-------|-------------|
| [**blackbox**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-blackbox) | 将编码任务委托给 Blackbox AI CLI 智能体。这是一个多模型智能体，内置评判器，可通过多个 LLM 运行任务并挑选最佳结果。需要 blackbox CLI 和 Blackbox AI API 密钥。 |
| [**honcho**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-honcho) | 配置并使用 Honcho 记忆与 Hermes 集成 — 实现跨会话的用户建模、多档案对等隔离、观察配置、辩证推理、会话摘要以及上下文预算强制执行。在设置 Honcho 时使用，进行故障排查... |
| [**openhands**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-openhands) | 将编码任务委托给 OpenHands CLI（模型无关，基于 LiteLLM）。 |

## 区块链

| 技能 | 描述 |
|------|------|
| [**evm**](/docs/user-guide/skills/optional/blockchain/blockchain-evm) | 只读EVM客户端：跨8条链查询钱包、代币、Gas费。 |
| [**hyperliquid**](/docs/user-guide/skills/optional/blockchain/blockchain-hyperliquid) | Hyperliquid市场数据、账户历史、交易复盘。 |
| [**solana**](/docs/user-guide/skills/optional/blockchain/blockchain-solana) | 查询Solana区块链数据并以美元计价——钱包余额、带价值的代币组合、交易详情、NFT、巨鲸检测和实时网络统计。使用Solana RPC + CoinGecko。无需API密钥。 |

## 通信

| 技能 | 描述 |
|------|------|
| [**one-three-one-rule**](/docs/user-guide/skills/optional/communication/communication-one-three-one-rule) | 用于技术方案和权衡分析的结构化决策框架。当用户面临多种方案之间的选择时（架构决策、工具选择、重构策略、迁移路径），此技能... |

## 创意

| 技能 | 描述 |
|------|------|
| [**blender-mcp**](/docs/user-guide/skills/optional/creative/creative-blender-mcp) | 通过socket连接blender-mcp插件，直接从Hermes控制Blender。创建3D对象、材质、动画，并运行任意的Blender Python (bpy)代码。当用户想要在Blender中创建或修改任何内容时使用。 |
| [**concept-diagrams**](/docs/user-guide/skills/optional/creative/creative-concept-diagrams) | 生成扁平、极简、支持明暗模式的SVG图表，作为独立的HTML文件，使用统一的教育视觉语言，包含9种语义色彩梯度、句子大小写的排版和自动暗色模式。最适合用于教育和无... |
| [**hyperframes**](/docs/user-guide/skills/optional/creative/creative-hyperframes) | 使用HyperFrames创建基于HTML的视频合成、动态标题卡、社交叠加层、带字幕的头像视频、音频响应式视觉效果和着色器过渡。HTML是视频的真实来源。当用户想要...时使用。 |
| [**kanban-video-orchestrator**](/docs/user-guide/skills/optional/creative/creative-kanban-video-orchestrator) | 计划、搭建并监控由Hermes看板支持的**多智能体**视频制作流水线。当用户想要制作任何视频时使用——叙事电影、产品/营销视频、音乐视频、讲解视频、ASCII/终端艺术、抽象/生成式循环视频... |
| [**meme-generation**](/docs/user-guide/skills/optional/creative/creative-meme-generation) | 通过选择模板并使用Pillow叠加文本来生成真实的表情包图片。生成实际的.png表情包文件。 |

## 运维

| 技能 | 描述 |
|------|------|
| [**inference-sh-cli**](/docs/user-guide/skills/optional/devops/devops-cli) | 通过inference.sh CLI (infsh)运行150+个AI应用——图像生成、视频创建、LLM、搜索、3D、社交自动化。使用终端工具。触发词：inference.sh, infsh, ai apps, flux, veo, image generation, video generation, seedrea... |
| [**docker-management**](/docs/user-guide/skills/optional/devops/devops-docker-management) | 管理Docker容器、镜像、卷、网络和Compose堆栈——生命周期操作、调试、清理和Dockerfile优化。 |
| [**pinggy-tunnel**](/docs/user-guide/skills/optional/devops/devops-pinggy-tunnel) | 通过Pinggy实现零安装的SSH localhost隧道。 |
| [**watchers**](/docs/user-guide/skills/optional/devops/devops-watchers) | 轮询RSS、JSON API和GitHub，并进行水印去重。 |

## 内部测试

| 技能 | 描述 |
|------|------|
| [**adversarial-ux-test**](/docs/user-guide/skills/optional/dogfood/dogfood-adversarial-ux-test) | 为您的产品扮演最难缠、最抗拒技术的用户。以该角色浏览应用，找出每一个用户体验痛点，然后将投诉通过实用主义层进行过滤，以区分真实问题和噪音。创建可操作的工单... |

## 电子邮件

| 技能 | 描述 |
|------|------|
| [**agentmail**](/docs/user-guide/skills/optional/email/email-agentmail) | 通过AgentMail为**智能体**提供其专属的电子邮箱。使用**智能体**拥有的邮箱地址（例如 hermes-agent@agentmail.to）自主地发送、接收和管理电子邮件。 |

## 财务

| 技能 | 描述 |
|------|------|
| [**3-statement-model**](/docs/user-guide/skills/optional/finance/finance-3-statement-model) | 在Excel中构建完全集成的三表模型（IS, BS, CF），包含营运资本计划表、折旧摊销结转表、债务计划表以及使现金和留存收益相匹配的调节项。与excel-author配合使用。 |
| [**comps-analysis**](/docs/user-guide/skills/optional/finance/finance-comps-analysis) | 在Excel中构建可比公司分析——运营指标、估值倍数、与同组公司的统计基准对比。与excel-author配合使用。用于上市公司估值、IPO定价、行业基准对比或异常值检测。 |
| [**dcf-model**](/docs/user-guide/skills/optional/finance/finance-dcf-model) | 在Excel中构建机构级DCF估值模型——收入预测、自由现金流构建、WACC、终值、熊市/基准/牛市情景分析、5x5敏感性分析表。与excel-author配合使用。用于内在价值权益分析。 |
| [**excel-author**](/docs/user-guide/skills/optional/finance/finance-excel-author) | 使用openpyxl无头构建可审计的Excel工作簿——蓝/黑/绿色单元格惯例、使用公式而非硬编码、命名范围、平衡检查、敏感性分析表。用于财务模型、审计输出、对账。 |
| [**lbo-model**](/docs/user-guide/skills/optional/finance/finance-lbo-model) | 在Excel中构建杠杆收购模型——资金来源与用途、债务计划表、现金归集、退出倍数、IRR/MOIC敏感性分析。与excel-author配合使用。用于PE筛选、赞助方估值或推介材料中的示例LBO。 |
| [**merger-model**](/docs/user-guide/skills/optional/finance/finance-merger-model) | 在Excel中构建增厚/稀释（合并）模型——备考损益表、协同效应、融资组合、每股收益影响。与excel-author配合使用。用于并购推介、董事会材料或交易评估。 |
| [**pptx-author**](/docs/user-guide/skills/optional/finance/finance-pptx-author) | 使用python-pptx无头构建PowerPoint演示文稿。与excel-author配合，用于有模型支持的演示文稿，其中每个数字都可追溯到工作簿单元格。用于推介材料、投委会备忘录、收益报告。 |
| [**stocks**](/docs/user-guide/skills/optional/finance/finance-stocks) | 通过Yahoo获取股票报价、历史数据、搜索、比较、加密货币信息。 |

## 健康

| 技能 | 描述 |
|------|------|
| [**fitness-nutrition**](/docs/user-guide/skills/optional/health/health-fitness-nutrition) | 健身锻炼计划和营养追踪器。通过wger按肌肉、设备或类别搜索690+种练习。通过USDA食品数据中心查找38万+种食物的宏量营养素和卡路里。计算BMI、TDEE、单次最大重量、宏量营养素分配和身体... |
| [**neuroskill-bci**](/docs/user-guide/skills/optional/health/health-neuroskill-bci) | 连接到正在运行的NeuroSkill实例，并将用户的实时认知和情绪状态（专注度、放松度、情绪、认知负荷、困倦度、心率、HRV、睡眠分期和40+项衍生EXG评分）纳入响应... |

## MCP

| 技能 | 描述 |
|------|------|
| [**fastmcp**](/docs/user-guide/skills/optional/mcp/mcp-fastmcp) | 使用FastMCP在Python中构建、测试、检查、安装和部署MCP服务器。当创建新的MCP服务器、将API或数据库包装为MCP工具、暴露资源或提示、或为Claude Code准备FastMCP服务器时使用... |
| [**mcporter**](/docs/user-guide/skills/optional/mcp/mcp-mcporter) | 使用mcporter CLI直接列出、配置、授权和调用MCP服务器/工具（HTTP或stdio），包括临时服务器、配置编辑和CLI/类型生成。 |

## 迁移

| 技能 | 描述 |
|------|------|
| [**openclaw-migration**](/docs/user-guide/skills/optional/migration/migration-openclaw-migration) | 将用户的OpenClaw自定义配置迁移到Hermes Agent中。从~/.openclaw导入Hermes兼容的记忆、SOUL.md、命令白名单、用户技能和选定的工作区资产，然后报告具体哪些无法迁移... |

## MLOps

| 技能 | 描述 |
|------|------|
| [**huggingface-accelerate**](/docs/user-guide/skills/optional/mlops/mlops-accelerate) | 最简单的分布式训练API。4行代码即可为任何PyTorch脚本添加分布式支持。用于DeepSpeed/FSDP/Megatron/DDP的统一API。自动设备放置、混合精度（FP16/BF16/FP8）。交互式配置，单启动命令... |
| [**axolotl**](/docs/user-guide/skills/optional/mlops/mlops-training-axolotl) | Axolotl：YAML LLM微调（LoRA、DPO、GRPO）。 |
| [**chroma**](/docs/user-guide/skills/optional/mlops/mlops-chroma) | 用于AI应用的开源嵌入数据库。存储嵌入和元数据，执行向量和全文搜索，按元数据过滤。简单的4函数API。可从笔记本扩展到生产集群。用于语义搜索、RAG... |
| [**clip**](/docs/user-guide/skills/optional/mlops/mlops-clip) | OpenAI的连接视觉与语言的模型。支持零样本图像分类、图文匹配和跨模态检索。在4亿图文对上训练。用于图像搜索、内容审核或无需微调的视觉语言任务... |
| [**faiss**](/docs/user-guide/skills/optional/mlops/mlops-faiss) | Facebook的用于高效相似性搜索和密集向量聚类的库。支持数十亿向量、GPU加速和各种索引类型（Flat、IVF、HNSW）。用于快速k-NN搜索、大规模向量检索，或当... |
| [**optimizing-attention-flash**](/docs/user-guide/skills/optional/mlops/mlops-flash-attention) | 使用Flash Attention优化transformer注意力机制，实现2-4倍加速和10-20倍内存减少。当训练/运行具有长序列（>512 token）的transformer、遇到注意力GPU内存问题或需要更快推理时使用。 |
| [**guidance**](/docs/user-guide/skills/optional/mlops/mlops-guidance) | 使用正则表达式和语法控制LLM输出，保证生成有效的JSON/XML/代码，强制结构化格式，并使用Guidance（微软研究院的约束生成框架）构建多步骤工作流。 |
| [**huggingface-tokenizers**](/docs/user-guide/skills/optional/mlops/mlops-huggingface-tokenizers) | 针对研究和生产优化的快速分词器。基于Rust的实现可在&lt;20秒内分词1GB数据。支持BPE、WordPiece和Unigram算法。训练自定义词表，跟踪对齐，处理填充/截断。集成... |
| [**instructor**](/docs/user-guide/skills/optional/mlops/mlops-instructor) | 使用Pydantic验证从LLM响应中提取结构化数据，自动重试失败的提取，解析复杂JSON并保证类型安全，以及流式传输部分结果——使用Instructor这个久经考验的结构化输出库。 |
| [**lambda-labs-gpu-cloud**](/docs/user-guide/skills/optional/mlops/mlops-lambda-labs) | 用于ML训练和推理的预留及按需GPU云实例。当您需要带简单SSH访问、持久文件系统或用于大规模训练的高性能多节点集群的专用GPU实例时使用。 |
| [**llava**](/docs/user-guide/skills/optional/mlops/mlops-llava) | 大型语言与视觉助手。支持视觉指令微调和基于图像的对话。将CLIP视觉编码器与Vicuna/LLaMA语言模型结合。支持多轮图像聊天、视觉问答和指令... |
| [**modal-serverless-gpu**](/docs/user-guide/skills/optional/mlops/mlops-modal) | 用于运行ML工作负载的无服务器GPU云平台。当您需要无需基础设施管理的按需GPU访问、将ML模型部署为API、或运行带自动扩缩的批处理作业时使用。 |
| [**nemo-curator**](/docs/user-guide/skills/optional/mlops/mlops-nemo-curator) | 用于LLM训练的GPU加速数据策展。支持文本/图像/视频/音频。具有模糊去重（快16倍）、质量过滤（30+种启发式规则）、语义去重、PII编辑、NSFW检测。跨GPU扩展... |
| [**outlines**](/docs/user-guide/skills/optional/mlops/mlops-inference-outlines) | Outlines：结构化JSON/regex/Pydantic LLM生成。 |
| [**peft-fine-tuning**](/docs/user-guide/skills/optional/mlops/mlops-peft) | 使用LoRA、QLoRA和25+种方法对LLM进行参数高效微调。当在有限GPU内存下微调大模型（7B-70B）、需要以最小精度损失训练&lt;1%参数、或进行多适配器序列化...时使用。 |
| [**pinecone**](/docs/user-guide/skills/optional/mlops/mlops-pinecone) | 用于生产AI应用的托管向量数据库。全托管、自动扩缩，具有混合搜索（稠密+稀疏）、元数据过滤和命名空间。低延迟（&lt;100ms p95）。用于生产RAG、推荐系统或语义... |
| [**pytorch-fsdp**](/docs/user-guide/skills/optional/mlops/mlops-pytorch-fsdp) | 使用PyTorch FSDP进行全分片数据并行训练的专家指导——参数分片、混合精度、CPU卸载、FSDP2。 |
| [**pytorch-lightning**](/docs/user-guide/skills/optional/mlops/mlops-pytorch-lightning) | 带有Trainer类的高级PyTorch框架，自动分布式训练（DDP/FSDP/DeepSpeed），回调系统，且样板代码最少。同一代码可从笔记本电脑扩展到超级计算机。当您想要简洁的训练循环和...时使用。 |
| [**qdrant-vector-search**](/docs/user-guide/skills/optional/mlops/mlops-qdrant) | 用于RAG和语义搜索的高性能向量相似性搜索引擎。当构建需要快速最近邻搜索、带过滤的混合搜索或具有Rust驱动性能的可扩展向量存储的生产RAG系统时使用。 |
| [**sparse-autoencoder-training**](/docs/user-guide/skills/optional/mlops/mlops-saelens) | 提供使用SAELens训练和分析稀疏自编码器（SAEs）的指导，以将神经网络激活分解为可解释的特征。当发现可解释特征、分析叠加或研究...时使用。 |
| [**simpo-training**](/docs/user-guide/skills/optional/mlops/mlops-simpo) | 用于LLM对齐的简单偏好优化。无需参考模型的DPO替代方案，性能更优（在AlpacaEval 2.0上高出6.4分）。无需参考模型，比DPO更高效。当希望进行简单偏好对齐时使用。 |
| [**slime-rl-training**](/docs/user-guide/skills/optional/mlops/mlops-slime) | 提供使用slime（一个Megatron+SGLang框架）进行LLM RL后训练的指导。当训练GLM模型、实现自定义数据生成工作流或需要紧密的Megatron-LM集成以进行RL扩展时使用。 |
| [**stable-diffusion-image-generation**](/docs/user-guide/skills/optional/mlops/mlops-stable-diffusion) | 通过HuggingFace Diffusers使用Stable Diffusion模型进行最先进的文生图。当从文本提示生成图像、执行图像到图像转换、修复或构建自定义扩散管道时使用。 |
| [**tensorrt-llm**](/docs/user-guide/skills/optional/mlops/mlops-tensorrt-llm) | 使用NVIDIA TensorRT优化LLM推理，以获得最大吞吐量和最低延迟。用于在NVIDIA GPU（A100/H100）上进行生产部署，当您需要比PyTorch快10-100倍的推理速度，或需要使用量化服务模型时... |
| [**distributed-llm-pretraining-torchtitan**](/docs/user-guide/skills/optional/mlops/mlops-torchtitan) | 使用torchtitan提供PyTorch原生的分布式LLM预训练，支持4D并行（FSDP2、TP、PP、CP）。当使用Float8、torch.compile和分布式优化器从8到512+ GPU大规模预训练Llama 3.1、DeepSeek V3或自定义模型时使用。 |
| [**fine-tuning-with-trl**](/docs/user-guide/skills/optional/mlops/mlops-training-trl-fine-tuning) | TRL：用于LLM RLHF的SFT、DPO、PPO、GRPO、奖励建模。 |
| [**unsloth**](/docs/user-guide/skills/optional/mlops/mlops-training-unsloth) | Unsloth：快2-5倍的LoRA/QLoRA微调，更少显存占用。 |
| [**whisper**](/docs/user-guide/skills/optional/mlops/mlops-whisper) | OpenAI的通用语音识别模型。支持99种语言、转录、翻译为英语和语言识别。六种模型大小，从tiny（3900万参数）到large（15.5亿参数）。用于语音转文本、播客... |

## 生产力

| 技能 | 描述 |
|------|------|
| [**canvas**](/docs/user-guide/skills/optional/productivity/productivity-canvas) | Canvas LMS 集成 — 通过 API 令牌认证获取已注册课程和作业。 |
| [**here.now**](/docs/user-guide/skills/optional/productivity/productivity-here-now) | 将静态网站发布到 &#123;slug&#125;.here.now，并将私有文件存储在云端驱动器中以实现智能体间的任务交接。 |
| [**memento-flashcards**](/docs/user-guide/skills/optional/productivity/productivity-memento-flashcards) | 间隔重复闪卡系统。从事实或文本创建卡片，使用由智能体评分的自由文本答案与闪卡对话，从 YouTube 视频记录生成测验，通过自适应调度复习到期卡片，以及导出/导入... |
| [**shop-app**](/docs/user-guide/skills/optional/productivity/productivity-shop-app) | Shop.app：产品搜索、订单跟踪、退货、重新订购。 |
| [**shopify**](/docs/user-guide/skills/optional/productivity/productivity-shopify) | 通过 curl 访问 Shopify Admin 和 Storefront GraphQL API。管理产品、订单、客户、库存、元字段。 |
| [**siyuan**](/docs/user-guide/skills/optional/productivity/productivity-siyuan) | 思源笔记 API，用于在自托管知识库中通过 curl 搜索、读取、创建和管理内容块与文档。 |
| [**telephony**](/docs/user-guide/skills/optional/productivity/productivity-telephony) | 赋予 Hermes 电话能力，无需更改核心工具。配置并持久化 Twilio 号码，发送和接收短信/彩信，直接通话，以及通过 Bland.ai 或 Vapi 进行 AI 驱动的外呼。 |

## 研究

| 技能 | 描述 |
|------|------|
| [**bioinformatics**](/docs/user-guide/skills/optional/research/research-bioinformatics) | 通往来自 bioSkills 和 ClawBio 的 400 多项生物信息学技能的入口。涵盖基因组学、转录组学、单细胞分析、变异检测、药物基因组学、宏基因组学、结构生物学等。获取特定领域的参考资料... |
| [**darwinian-evolver**](/docs/user-guide/skills/optional/research/research-darwinian-evolver) | 使用 Imbue 的进化循环来优化提示/正则表达式/SQL/代码。 |
| [**domain-intel**](/docs/user-guide/skills/optional/research/research-domain-intel) | 使用 Python 标准库进行被动域名侦察。子域名发现、SSL 证书检查、WHOIS 查询、DNS 记录、域名可用性检查以及批量多域名分析。无需 API 密钥。 |
| [**drug-discovery**](/docs/user-guide/skills/optional/research/research-drug-discovery) | 面向药物发现工作流程的制药研究助手。在 ChEMBL 上搜索生物活性化合物，计算类药性（Lipinski Ro5， QED， TPSA， 合成可及性），通过 OpenFDA 查询药物-药物相互作用，解释 ADMET... |
| [**duckduckgo-search**](/docs/user-guide/skills/optional/research/research-duckduckgo-search) | 通过 DuckDuckGo 进行免费网络搜索 — 文本、新闻、图片、视频。无需 API 密钥。如果已安装，优先使用 `ddgs` 命令行工具；仅在当前运行时环境中验证 `ddgs` 可用后，才使用 Python DDGS 库。 |
| [**gitnexus-explorer**](/docs/user-guide/skills/optional/research/research-gitnexus-explorer) | 使用 GitNexus 索引代码库，并通过 Web UI + Cloudflare 隧道提供交互式知识图谱。 |
| [**osint-investigation**](/docs/user-guide/skills/optional/research/research-osint-investigation) | 公开记录的开源情报调查框架 — SEC EDGAR 文件、USAspending 合同、参议院游说、OFAC 制裁、ICIJ 离岸泄露、NYC 房产记录（ACRIS）、OpenCorporates 注册表、CourtListener 法庭记录、Wayback... |
| [**parallel-cli**](/docs/user-guide/skills/optional/research/research-parallel-cli) | Parallel CLI 的可选供应商技能 — 智能体原生的网络搜索、提取、深度研究、增强、FindAll 和监控。优先使用 JSON 输出和非交互式流程。 |
| [**qmd**](/docs/user-guide/skills/optional/research/research-qmd) | 使用 qmd 在本地搜索个人知识库、笔记、文档和会议记录 — 一个结合 BM25、向量搜索和 LLM 重排序的混合检索引擎。支持命令行和 MCP 集成。 |
| [**scrapling**](/docs/user-guide/skills/optional/research/research-scrapling) | 使用 Scrapling 进行网页抓取 — HTTP 获取、隐匿浏览器自动化、Cloudflare 绕过，以及通过命令行和 Python 进行蜘蛛爬取。 |
| [**searxng-search**](/docs/user-guide/skills/optional/research/research-searxng-search) | 通过 SearXNG 进行免费元搜索 — 聚合来自 70 多个搜索引擎的结果。可自托管或使用公共实例。无需 API 密钥。当网络搜索工具集不可用时，会自动回退。 |

## 安全

| 技能 | 描述 |
|------|------|
| [**1password**](/docs/user-guide/skills/optional/security/security-1password) | 设置并使用 1Password CLI（op）。在安装命令行工具、启用桌面应用集成、登录以及为命令读取/注入密钥时使用。 |
| [**oss-forensics**](/docs/user-guide/skills/optional/security/security-oss-forensics) | 针对 GitHub 仓库的供应链调查、证据恢复和取证分析。涵盖已删除提交恢复、强制推送检测、IOC 提取、多源证据收集、假设形成/验证，以及 st... |
| [**sherlock**](/docs/user-guide/skills/optional/security/security-sherlock) | 跨 400 多个社交网络的开源情报用户名搜索。通过用户名追查社交媒体账户。 |
| [**web-pentest**](/docs/user-guide/skills/optional/security/security-web-pentest) | 经授权的 Web 应用程序渗透测试 — 侦察、漏洞分析、基于证据的利用和专业报告。改编了香农的“无利用，无报告”方法，并为范围、授权...设置了硬性护栏。 |

## 软件开发

| 技能 | 描述 |
|------|------|
| [**code-wiki**](/docs/user-guide/skills/optional/software-development/software-development-code-wiki) | 为任何代码库生成 Wiki 文档和 Mermaid 图表。 |
| [**rest-graphql-debug**](/docs/user-guide/skills/optional/software-development/software-development-rest-graphql-debug) | 调试 REST/GraphQL API：状态码、认证、架构、重现。 |

## 网页开发

| 技能 | 描述 |
|------|------|
| [**page-agent**](/docs/user-guide/skills/optional/web-development/web-development-page-agent) | 将 alibaba/page-agent 嵌入到您自己的 Web 应用程序中 — 一个纯 JavaScript 的页面内图形用户界面智能体，以单个 &lt;script> 标签或 npm 包的形式提供，让您的网站终端用户能够使用自然语言驱动界面（“点击登录，填写用户... |

---

## 贡献可选技能

要在仓库中添加新的可选技能：

1.  在 `optional-skills/<类别>/<技能名称>/` 下创建一个目录。
2.  添加一个带有标准前端元数据（名称、描述、版本、作者）的 `SKILL.md` 文件。
3.  在 `references/`、`templates/` 或 `scripts/` 子目录中包含任何支持文件。
4.  提交一个拉取请求 — 合并后，该技能将出现在此目录中并获得自己的文档页面。