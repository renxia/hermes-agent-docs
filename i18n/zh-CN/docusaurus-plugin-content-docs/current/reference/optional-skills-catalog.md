---
sidebar_position: 9
title: "可选技能目录"
description: "hermes-agent 附带的官方可选技能 —— 通过 hermes skills install official/<category>/<skill> 安装"
---

# 可选技能目录

可选技能随 hermes-agent 一起提供，位于 `optional-skills/` 目录下，但**默认情况下未激活**。需通过以下命令显式安装：

```bash
hermes skills install official/<category>/<skill>
```

例如：

```bash
hermes skills install official/blockchain/solana
hermes skills install official/mlops/flash-attention
```

下方的每个技能都链接到一个专属页面，包含其完整定义、设置和使用方法。

卸载命令：

```bash
hermes skills uninstall <skill-name>
```

## 自主人工智能智能体

| 技能 | 描述 |
|------|------|
| [**blackbox**](/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-blackbox) | 将编码任务委托给 Blackbox AI 命令行智能体。这是一个多模型智能体，内置评判机制，可通过多个大语言模型运行任务并选择最佳结果。需要安装 blackbox 命令行工具并配置 Blackbox AI API 密钥。 |
| [**honcho**](/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-honcho) | 为 Hermes 配置和使用 Honcho 记忆功能——跨会话用户建模、多档案对等隔离、观察配置、辩证推理、会话摘要以及上下文预算控制。在设置 Honcho、进行故障排除... |
| [**openhands**](/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-openhands) | 将编码任务委托给 OpenHands 命令行工具（模型无关，基于 LiteLLM）。 |

## 区块链

| 技能 | 描述 |
|-------|-------------|
| [**evm**](/user-guide/skills/optional/blockchain/blockchain-evm) | 只读EVM客户端：支持跨8条链的钱包、代币、Gas查询。 |
| [**hyperliquid**](/user-guide/skills/optional/blockchain/blockchain-hyperliquid) | Hyperliquid市场数据、账户历史、交易复盘。 |
| [**solana**](/user-guide/skills/optional/blockchain/blockchain-solana) | 查询Solana区块链数据并提供美元计价——钱包余额、代币组合及价值、交易详情、NFT、鲸鱼检测、实时网络统计。使用Solana RPC + CoinGecko。无需API密钥。 |

## 通信

| 技能 | 描述 |
|-------|-------------|
| [**one-three-one-rule**](/user-guide/skills/optional/communication/communication-one-three-one-rule) | 用于技术方案和权衡分析的结构化决策框架。当用户面临多种方案选择（架构决策、工具选择、重构策略、迁移路径）时，此技能... |

## 创意

| 技能 | 描述 |
|-------|-------------|
| [**blender-mcp**](/user-guide/skills/optional/creative/creative-blender-mcp) | 通过blender-mcp插件的套接字连接，直接从Hermes控制Blender。创建3D对象、材质、动画，并运行任意Blender Python（bpy）代码。当用户需要在Blender中创建或修改任何内容时使用。 |
| [**concept-diagrams**](/user-guide/skills/optional/creative/creative-concept-diagrams) | 生成扁平、最小化的明/暗模式SVG图表，作为独立HTML文件，使用统一的教育视觉语言，包含9种语义色彩渐变、句子式排版和自动暗黑模式。最适合教育和... |
| [**hyperframes**](/user-guide/skills/optional/creative/creative-hyperframes) | 使用HyperFrames创建基于HTML的视频合成、动画标题卡、社交叠加层、字幕说话人视频、音频反应式视觉效果和着色器过渡。HTML是视频的权威来源。当用户想要... |
| [**kanban-video-orchestrator**](/user-guide/skills/optional/creative/creative-kanban-video-orchestrator) | 规划、设置和监控由Hermes看板支持的多智能体视频制作流水线。当用户想要制作任何视频时使用——叙事电影、产品/营销、音乐视频、讲解视频、ASCII/终端艺术、抽象/生成式... |
| [**meme-generation**](/user-guide/skills/optional/creative/creative-meme-generation) | 通过选择模板并使用Pillow叠加文本，生成真实的迷因图片。产生实际的.png迷因文件。 |

## 运维

| 技能 | 描述 |
|-------|-------------|
| [**inference-sh-cli**](/user-guide/skills/optional/devops/devops-cli) | 通过inference.sh CLI (infsh) 运行150多个AI应用——图像生成、视频创作、LLM、搜索、3D、社交自动化。使用终端工具。触发词：inference.sh, infsh, ai apps, flux, veo, image generation, video generation, seedrea... |
| [**docker-management**](/user-guide/skills/optional/devops/devops-docker-management) | 管理Docker容器、镜像、卷、网络和Compose堆栈——生命周期操作、调试、清理和Dockerfile优化。 |
| [**pinggy-tunnel**](/user-guide/skills/optional/devops/devops-pinggy-tunnel) | 通过Pinggy实现基于SSH的零安装本地主机隧道。 |
| [**watchers**](/user-guide/skills/optional/devops/devops-watchers) | 使用水印去重轮询RSS、JSON API和GitHub。 |

## 内部测试

| 技能 | 描述 |
|-------|-------------|
| [**adversarial-ux-test**](/user-guide/skills/optional/dogfood/dogfood-adversarial-ux-test) | 为你的产品扮演最挑剔、最抗拒技术的用户。以该角色浏览应用，找出每一个用户体验痛点，然后通过实用主义层过滤抱怨，区分真实问题和噪音。创建可操作的任务... |

## 电子邮件

| 技能 | 描述 |
|-------|-------------|
| [**agentmail**](/user-guide/skills/optional/email/email-agentmail) | 通过AgentMail为智能体提供其专属的电子邮箱收件箱。使用智能体自有的电子邮件地址（例如hermes-agent@agentmail.to）自主发送、接收和管理电子邮件。 |

## 金融

| 技能 | 描述 |
|-------|-------------|
| [**3-statement-model**](/user-guide/skills/optional/finance/finance-3-statement-model) | 在Excel中构建完全集成的三表模型（损益表、资产负债表、现金流量表），包含营运资金附表、折旧摊销滚动、债务附表以及使现金和留存收益相匹配的调节项。与excel-author配合使用。 |
| [**comps-analysis**](/user-guide/skills/optional/finance/finance-comps-analysis) | 在Excel中构建可比公司分析——经营指标、估值倍数、相对于同行组的统计基准。与excel-author配合使用。用于上市公司估值、IPO定价、行业基准或异常值检测。 |
| [**dcf-model**](/user-guide/skills/optional/finance/finance-dcf-model) | 在Excel中构建机构级DCF估值模型——收入预测、自由现金流构建、WACC、终值、熊市/基准/牛市情景、5x5敏感性分析表。与excel-author配合使用。用于内在价值股权分析。 |
| [**excel-author**](/user-guide/skills/optional/finance/finance-excel-author) | 使用openpyxl构建可审计的Excel工作簿——蓝/黑/绿单元格规范、公式优于硬编码、命名范围、余额检查、敏感性分析表。用于财务模型、审计输出、对账。 |
| [**lbo-model**](/user-guide/skills/optional/finance/finance-lbo-model) | 在Excel中构建杠杆收购模型——资金来源与使用、债务附表、现金流循环、退出倍数、IRR/MOIC敏感性分析。与excel-author配合使用。用于PE筛选、发起人案例估值或演示性LBO。 |
| [**merger-model**](/user-guide/skills/optional/finance/finance-merger-model) | 在Excel中构建增厚/稀释（合并）模型——模拟损益表、协同效应、融资组合、每股收益影响。与excel-author配合使用。用于并购推介、董事会材料或交易评估。 |
| [**pptx-author**](/user-guide/skills/optional/finance/finance-pptx-author) | 使用python-pptx构建PowerPoint演示文稿。与excel-author配合用于基于模型的演示文稿，其中每个数字都可追溯到工作簿单元格。用于推介材料、投资委员会备忘录、盈利报告。 |
| [**stocks**](/user-guide/skills/optional/finance/finance-stocks) | 股票报价、历史、搜索、比较、加密货币，通过Yahoo提供。 |

## 健康

| 技能 | 描述 |
|-------|-------------|
| [**fitness-nutrition**](/user-guide/skills/optional/health/health-fitness-nutrition) | 健身锻炼计划和营养追踪器。通过wger搜索690多种按肌肉、设备或类别分类的锻炼。通过USDA FoodData Central查询380,000多种食物的宏量营养素和卡路里。计算BMI、TDEE、单次最大重量、宏量营养素分配和身体... |
| [**neuroskill-bci**](/user-guide/skills/optional/health/health-neuroskill-bci) | 连接到运行中的NeuroSkill实例，并将用户实时的认知和情绪状态（专注度、放松度、情绪、认知负荷、困倦度、心率、心率变异性、睡眠分期以及40多个衍生EXG分数）纳入响应中... |

## MCP

| 技能 | 描述 |
|-------|-------------|
| [**fastmcp**](/user-guide/skills/optional/mcp/mcp-fastmcp) | 使用FastMCP在Python中构建、测试、检查、安装和部署MCP服务器。当创建新的MCP服务器、将API或数据库包装为MCP工具、暴露资源或提示，或准备用于Claude Code、Cura...的FastMCP服务器时使用。 |
| [**mcporter**](/user-guide/skills/optional/mcp/mcp-mcporter) | 使用mcporter CLI直接列出、配置、认证和调用MCP服务器/工具（HTTP或stdio），包括临时服务器、配置编辑以及CLI/类型生成。 |

## 迁移

| 技能 | 描述 |
|-------|-------------|
| [**openclaw-migration**](/user-guide/skills/optional/migration/migration-openclaw-migration) | 将用户的OpenClaw自定义足迹迁移到Hermes智能体中。从~/.openclaw导入Hermes兼容的记忆、SOUL.md、命令允许列表、用户技能和选定的工作区资产，然后准确报告无法迁移的内容... |

## 机器学习运维

| 技能 | 描述 |
|-------|-------------|
| [**huggingface-accelerate**](/user-guide/skills/optional/mlops/mlops-accelerate) | 最简单的分布式训练API。仅需4行代码即可为任何PyTorch脚本添加分布式支持。统一API支持DeepSpeed/FSDP/Megatron/DDP。自动设备放置、混合精度（FP16/BF16/FP8）。交互式配置，单次启动命令... |
| [**axolotl**](/user-guide/skills/optional/mlops/mlops-training-axolotl) | Axolotl：YAML LLM微调（LoRA, DPO, GRPO）。 |
| [**chroma**](/user-guide/skills/optional/mlops/mlops-chroma) | 用于AI应用的开源嵌入数据库。存储嵌入和元数据，执行向量和全文搜索，按元数据过滤。简单的4函数API。可从笔记本扩展到生产集群。用于语义搜索、RAG... |
| [**clip**](/user-guide/skills/optional/mlops/mlops-clip) | OpenAI连接视觉和语言的模型。支持零样本图像分类、图像-文本匹配和跨模态检索。在4亿图像-文本对上训练。用于图像搜索、内容审核或视觉-语言任务... |
| [**faiss**](/user-guide/skills/optional/mlops/mlops-faiss) | Facebook用于高效相似性搜索和密集向量聚类的库。支持数十亿向量、GPU加速和各种索引类型（Flat, IVF, HNSW）。用于快速k近邻搜索、大规模向量检索或... |
| [**optimizing-attention-flash**](/user-guide/skills/optional/mlops/mlops-flash-attention) | 使用Flash Attention优化Transformer注意力机制，实现2-4倍加速和10-20倍内存减少。当训练/运行具有长序列（&gt;512个token）的Transformer、遇到注意力机制的GPU内存问题或需要更快推理时使用。 |
| [**guidance**](/user-guide/skills/optional/mlops/mlops-guidance) | 使用正则表达式和语法控制LLM输出，保证有效的JSON/XML/代码生成，强制结构化格式，并使用Guidance - Microsoft Research的受约束生成框架构建多步骤工作流 |
| [**huggingface-tokenizers**](/user-guide/skills/optional/mlops/mlops-huggingface-tokenizers) | 为研究和生产优化的快速分词器。基于Rust的实现可在&lt;20秒内对1GB文本进行分词。支持BPE、WordPiece和Unigram算法。训练自定义词表，跟踪对齐，处理填充/截断。集成... |
| [**instructor**](/user-guide/skills/optional/mlops/mlops-instructor) | 使用Pydantic验证从LLM响应中提取结构化数据，自动重试失败的提取，解析具有类型安全的复杂JSON，并使用Instructor - 经过实战检验的结构化输出库流式传输部分结果 |
| [**lambda-labs-gpu-cloud**](/user-guide/skills/optional/mlops/mlops-lambda-labs) | 用于ML训练和推理的预留和按需GPU云实例。当需要具有简单SSH访问、持久文件系统或用于大规模训练的高性能多节点集群的专用GPU实例时使用。 |
| [**llava**](/user-guide/skills/optional/mlops/mlops-llava) | 大型语言和视觉助手。支持视觉指令微调和基于图像的对话。将CLIP视觉编码器与Vicuna/LLaMA语言模型相结合。支持多轮图像聊天、视觉问答和指令... |
| [**modal-serverless-gpu**](/user-guide/skills/optional/mlops/mlops-modal) | 用于运行ML工作负载的无服务器GPU云平台。当需要无需基础设施管理的按需GPU访问、将ML模型部署为API，或运行具有自动扩展的批处理作业时使用。 |
| [**nemo-curator**](/user-guide/skills/optional/mlops/mlops-nemo-curator) | 用于LLM训练的GPU加速数据整理。支持文本/图像/视频/音频。具有模糊去重（快16倍）、质量过滤（30多种启发式方法）、语义去重、PII编辑、NSFW检测。可跨GPU扩展... |
| [**outlines**](/user-guide/skills/optional/mlops/mlops-inference-outlines) | Outlines：结构化JSON/正则表达式/Pydantic LLM生成。 |
| [**peft-fine-tuning**](/user-guide/skills/optional/mlops/mlops-peft) | 使用LoRA、QLoRA和25多种方法进行LLM的参数高效微调。当GPU内存有限微调大模型（7B-70B）、需要以最小精度损失训练&lt;1%的参数，或多适配器设置时使用。 |
| [**pinecone**](/user-guide/skills/optional/mlops/mlops-pinecone) | 用于生产AI应用的托管向量数据库。全托管、自动扩展，具有混合搜索（密集+稀疏）、元数据过滤和命名空间。低延迟（&lt;100ms p95）。用于生产RAG、推荐系统或... |
| [**pytorch-fsdp**](/user-guide/skills/optional/mlops/mlops-pytorch-fsdp) | 使用PyTorch FSDP进行完全分片数据并行训练的专家指导 - 参数分片、混合精度、CPU卸载、FSDP2 |
| [**pytorch-lightning**](/user-guide/skills/optional/mlops/mlops-pytorch-lightning) | 高级PyTorch框架，具有Trainer类、自动分布式训练（DDP/FSDP/DeepSpeed）、回调系统和最小样板代码。使用相同代码可从笔记本扩展到超级计算机。当希望拥有干净的训练循环且... |
| [**qdrant-vector-search**](/user-guide/skills/optional/mlops/mlops-qdrant) | 用于RAG和语义搜索的高性能向量相似性搜索引擎。当构建需要快速最近邻搜索、带过滤的混合搜索或可扩展向量存储（具有Rust驱动的高性能）的生产RAG系统时使用。 |
| [**sparse-autoencoder-training**](/user-guide/skills/optional/mlops/mlops-saelens) | 提供使用SAELens训练和分析稀疏自编码器（SAE）的指导，将神经网络激活分解为可解释特征。当发现可解释特征、分析叠加或研究... |
| [**simpo-training**](/user-guide/skills/optional/mlops/mlops-simpo) | LLM对齐的简单偏好优化。DPO的无参考替代方案，性能更好（在AlpacaEval 2.0上+6.4分）。不需要参考模型，比DPO更高效。当需要简单偏好对齐时使用。 |
| [**slime-rl-training**](/user-guide/skills/optional/mlops/mlops-slime) | 提供使用slime（Megatron+SGLang框架）进行LLM后训练RL的指导。当训练GLM模型、实现自定义数据生成工作流或需要紧密的Megatron-LM集成以进行RL扩展时使用。 |
| [**stable-diffusion-image-generation**](/user-guide/skills/optional/mlops/mlops-stable-diffusion) | 通过HuggingFace Diffusers使用Stable Diffusion模型进行最先进的文本到图像生成。当从文本提示生成图像、执行图像到图像转换、修复或构建自定义扩散流水线时使用。 |
| [**tensorrt-llm**](/user-guide/skills/optional/mlops/mlops-tensorrt-llm) | 使用NVIDIA TensorRT优化LLM推理，实现最大吞吐量和最低延迟。用于NVIDIA GPU（A100/H100）上的生产部署，当需要比PyTorch快10-100倍的推理速度，或需要量化服务模型时使用。 |
| [**distributed-llm-pretraining-torchtitan**](/user-guide/skills/optional/mlops/mlops-torchtitan) | 使用torchtitan提供PyTorch原生分布式LLM预训练，具有4D并行性（FSDP2, TP, PP, CP）。当从8到512+ GPU使用Float8、torch.compile和分布式优化器大规模预训练Llama 3.1、DeepSeek V3或自定义模型时使用。 |
| [**fine-tuning-with-trl**](/user-guide/skills/optional/mlops/mlops-training-trl-fine-tuning) | TRL：用于LLM RLHF的SFT、DPO、PPO、GRPO、奖励建模。 |
| [**unsloth**](/user-guide/skills/optional/mlops/mlops-training-unsloth) | Unsloth：2-5倍更快的LoRA/QLoRA微调，更少显存占用。 |
| [**whisper**](/user-guide/skills/optional/mlops/mlops-whisper) | OpenAI的通用语音识别模型。支持99种语言、转录、翻译成英语和语言识别。六种模型大小，从tiny（3900万参数）到large（15.5亿参数）。用于语音转文本、播客... |

## 生产力

| 技能 | 描述 |
|------|------|
| [**canvas**](/user-guide/skills/optional/productivity/productivity-canvas) | Canvas LMS集成 — 使用API令牌认证获取已注册课程和作业。 |
| [**here.now**](/user-guide/skills/optional/productivity/productivity-here-now) | 将静态网站发布至 &#123;slug&#125;.here.now，并将私有文件存储在云盘中，用于智能体间的交接。 |
| [**memento-flashcards**](/user-guide/skills/optional/productivity/productivity-memento-flashcards) | 间隔重复记忆卡系统。从事实或文本创建卡片，通过自由文本答案与记忆卡聊天（由智能体评分），从YouTube字幕生成测验，使用自适应调度复习到期卡片，以及导出/导入... |
| [**shop-app**](/user-guide/skills/optional/productivity/productivity-shop-app) | Shop.app：产品搜索、订单跟踪、退货、重新订购。 |
| [**shopify**](/user-guide/skills/optional/productivity/productivity-shopify) | 通过curl调用Shopify管理与店面GraphQL API。处理产品、订单、客户、库存、元字段。 |
| [**siyuan**](/user-guide/skills/optional/productivity/productivity-siyuan) | 思源笔记API，用于通过curl在自托管知识库中搜索、阅读、创建和管理块与文档。 |
| [**telephony**](/user-guide/skills/optional/productivity/productivity-telephony) | 无需修改核心工具即可为Hermes添加电话功能。开通并持久化一个Twilio号码，发送和接收短信/彩信，直接拨打电话，并通过Bland.ai或Vapi发起AI驱动的外呼。 |

## 研究

| 技能 | 描述 |
|------|------|
| [**bioinformatics**](/user-guide/skills/optional/research/research-bioinformatics) | 连接来自bioSkills和ClawBio的400多项生物信息学技能。涵盖基因组学、转录组学、单细胞分析、变异检测、药物基因组学、宏基因组学、结构生物学等领域。获取特定领域的参考资料... |
| [**darwinian-evolver**](/user-guide/skills/optional/research/research-darwinian-evolver) | 使用Imbue的进化循环来优化提示/正则表达式/SQL/代码。 |
| [**domain-intel**](/user-guide/skills/optional/research/research-domain-intel) | 使用Python标准库进行被动域名侦察。子域名发现、SSL证书检查、WHOIS查询、DNS记录、域名可用性检查以及批量多域名分析。无需API密钥。 |
| [**drug-discovery**](/user-guide/skills/optional/research/research-drug-discovery) | 药物发现工作流的制药研究助手。在ChEMBL上搜索生物活性化合物，计算类药性（Lipinski Ro5、QED、TPSA、合成可及性），通过OpenFDA查询药物相互作用，解读ADMET... |
| [**duckduckgo-search**](/user-guide/skills/optional/research/research-duckduckgo-search) | 通过DuckDuckGo进行免费网络搜索 — 文本、新闻、图片、视频。无需API密钥。若已安装则优先使用`ddgs`命令行工具；仅当验证当前运行时中`ddgs`可用后，才使用Python DDGS库。 |
| [**gitnexus-explorer**](/user-guide/skills/optional/research/research-gitnexus-explorer) | 使用GitNexus为代码库建立索引，并通过Web界面和Cloudflare隧道提供交互式知识图谱服务。 |
| [**osint-investigation**](/user-guide/skills/optional/research/research-osint-investigation) | 公开记录的OSINT调查框架 — SEC EDGAR文件、USAspending合同、参议院游说、OFAC制裁、ICIJ离岸泄露、纽约房产记录（ACRIS）、OpenCorporates注册表、CourtListener法院记录、Wayback... |
| [**parallel-cli**](/user-guide/skills/optional/research/research-parallel-cli) | Parallel CLI的可选供应商技能 — 智能体原生网络搜索、信息提取、深度研究、数据增强、FindAll和监控。优先使用JSON输出和非交互式流程。 |
| [**qmd**](/user-guide/skills/optional/research/research-qmd) | 使用qmd在本地搜索个人知识库、笔记、文档和会议记录 — 这是一个混合检索引擎，集成了BM25、向量搜索和LLM重排序。支持CLI和MCP集成。 |
| [**scrapling**](/user-guide/skills/optional/research/research-scrapling) | 使用Scrapling进行网络抓取 - HTTP获取、隐身浏览器自动化、Cloudflare绕过，以及通过CLI和Python进行爬虫抓取。 |
| [**searxng-search**](/user-guide/skills/optional/research/research-searxng-search) | 通过SearXNG进行免费元搜索 — 聚合来自70多个搜索引擎的结果。可自托管或使用公共实例。无需API密钥。当网络搜索工具集不可用时会自动回退。 |

## 安全

| 技能 | 描述 |
|------|------|
| [**1password**](/user-guide/skills/optional/security/security-1password) | 设置并使用1Password CLI (op)。适用于安装CLI、启用桌面应用集成、登录，以及为命令读取/注入密钥。 |
| [**oss-forensics**](/user-guide/skills/optional/security/security-oss-forensics) | GitHub仓库的供应链调查、证据恢复和取证分析。涵盖已删除提交恢复、强制推送检测、IOC提取、多源证据收集、假设形成/验证，以及... |
| [**sherlock**](/user-guide/skills/optional/security/security-sherlock) | 跨400多个社交网络的OSINT用户名搜索。通过用户名追踪社交媒体账户。 |

## 软件开发

| 技能 | 描述 |
|------|------|
| [**code-wiki**](/user-guide/skills/optional/software-development/software-development-code-wiki) | 为任意代码库生成Wiki文档和Mermaid图表。 |
| [**rest-graphql-debug**](/user-guide/skills/optional/software-development/software-development-rest-graphql-debug) | 调试REST/GraphQL API：状态码、认证、模式、复现。 |

## Web开发

| 技能 | 描述 |
|------|------|
| [**page-agent**](/user-guide/skills/optional/web-development/web-development-page-agent) | 将alibaba/page-agent嵌入到您自己的Web应用程序中 — 一个纯JavaScript的页面内GUI智能体，以单个 &lt;script> 标签或npm包的形式提供，让您的网站终端用户能够使用自然语言驱动UI（“点击登录，填写用户名...”） |

---

## 贡献可选技能

要向代码库添加新的可选技能：

1.  在 `optional-skills/<category>/<skill-name>/` 下创建一个目录。
2.  添加一个包含标准前置元数据（name, description, version, author）的 `SKILL.md` 文件。
3.  在 `references/`、`templates/` 或 `scripts/` 子目录中包含任何支持文件。
4.  提交拉取请求 — 一旦合并，该技能将出现在此目录中并拥有自己的文档页面。