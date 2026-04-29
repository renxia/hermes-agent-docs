---
sidebar_position: 9
title: "可选技能目录"
description: "hermes-agent 自带的官方可选技能 — 通过 hermes skills install official/<类别>/<技能> 安装"
---

# 可选技能目录

可选技能随 hermes-agent 发布，位于 `optional-skills/` 目录下，但**默认不启用**。请显式安装：

```bash
hermes skills install official/<类别>/<技能>
```

例如：

```bash
hermes skills install official/blockchain/solana
hermes skills install official/mlops/flash-attention
```

下方每个技能均链接至其专属页面，包含完整定义、设置和使用说明。

如需卸载：

```bash
hermes skills uninstall <技能名称>
```

## autonomous-ai-agents

| 技能 | 描述 |
|-------|-------------|
| [**blackbox**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-blackbox) | 将编码任务委派给 Blackbox AI CLI 智能体。多模型智能体，内置评判器，通过多个大语言模型运行任务并选择最佳结果。需要安装 blackbox CLI 并配置 Blackbox AI API 密钥。 |
| [**honcho**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-honcho) | 配置并使用 Hermes 的 Honcho 记忆功能 — 跨会话用户建模、多配置文件对等隔离、观测配置、辩证推理、会话摘要以及上下文预算强制。在设置 Honcho、故障排查...时使用。 |

## 区块链

| 技能 | 描述 |
|-------|-------------|
| [**base**](/docs/user-guide/skills/optional/blockchain/blockchain-base) | 查询 Base（以太坊 L2）区块链数据并附带美元定价 — 钱包余额、代币信息、交易详情、Gas 分析、合约检查、巨鲸检测以及实时网络统计。使用 Base RPC + CoinGecko。无需 API 密钥。 |
| [**solana**](/docs/user-guide/skills/optional/blockchain/blockchain-solana) | 查询 Solana 区块链数据并附带美元定价 — 钱包余额、带价值的代币投资组合、交易详情、NFT、巨鲸检测以及实时网络统计。使用 Solana RPC + CoinGecko。无需 API 密钥。 |

## 通信

| 技能 | 描述 |
|-------|-------------|
| [**one-three-one-rule**](/docs/user-guide/skills/optional/communication/communication-one-three-one-rule) | 用于技术提案和权衡分析的结构化决策框架。当用户在多种方法之间面临选择时（架构决策、工具选择、重构策略、迁移路径），此技能…… |

## 创意

| 技能 | 描述 |
|-------|-------------|
| [**blender-mcp**](/docs/user-guide/skills/optional/creative/creative-blender-mcp) | 通过 socket 连接 Blender 的 blender-mcp 插件，直接从 Hermes 控制 Blender。创建 3D 对象、材质、动画，并运行任意 Blender Python (bpy) 代码。当用户想要在 Blender 中创建或修改任何内容时使用。 |
| [**concept-diagrams**](/docs/user-guide/skills/optional/creative/creative-concept-diagrams) | 生成扁平、极简、自适应明暗模式的 SVG 图表，作为独立的 HTML 文件，使用统一的、具有 9 种语义颜色渐变的视觉教育语言、句子大小写字体，并自动支持深色模式。最适合教育和…… |
| [**meme-generation**](/docs/user-guide/skills/optional/creative/creative-meme-generation) | 通过选择模板并使用 Pillow 叠加文本来生成真实的模因图像。生成实际的 .png 模因文件。 |

## 运维

| 技能 | 描述 |
|-------|-------------|
| [**inference-sh-cli**](/docs/user-guide/skills/optional/devops/devops-cli) | 通过 inference.sh CLI (infsh) 运行 150+ 个 AI 应用 — 图像生成、视频创作、大语言模型、搜索、3D、社交自动化。使用终端工具。触发词：inference.sh, infsh, ai apps, flux, veo, image generation, video generation, seedrea... |
| [**docker-management**](/docs/user-guide/skills/optional/devops/devops-docker-management) | 管理 Docker 容器、镜像、卷、网络和 Compose 栈 — 生命周期操作、调试、清理和 Dockerfile 优化。 |

## 内部体验

| 技能 | 描述 |
|-------|-------------|
| [**adversarial-ux-test**](/docs/user-guide/skills/optional/dogfood/dogfood-adversarial-ux-test) | 扮演产品最苛刻、最抗拒技术的用户。以该角色浏览应用，找出每一个用户体验痛点，然后通过实用主义层过滤抱怨，以区分真正的问题和噪音。创建可操作的工单…… |

## 邮件

| 技能 | 描述 |
|-------|-------------|
| [**agentmail**](/docs/user-guide/skills/optional/email/email-agentmail) | 通过 AgentMail 为智能体提供其专属的电子邮件收件箱。使用智能体拥有的电子邮件地址（例如 hermes-agent@agentmail.to）自主发送、接收和管理电子邮件。 |

## 健康

| 技能 | 描述 |
|-------|-------------|
| [**fitness-nutrition**](/docs/user-guide/skills/optional/health/health-fitness-nutrition) | 健身房锻炼计划器和营养追踪器。通过 wger 按肌肉群、器械或类别搜索 690+ 种运动。通过 USDA FoodData Central 查询 380,000+ 种食物的宏量营养素和卡路里。计算 BMI、TDEE、单次最大重量、宏量营养素分配和身体…… |
| [**neuroskill-bci**](/docs/user-guide/skills/optional/health/health-neuroskill-bci) | 连接到正在运行的 NeuroSkill 实例，并将用户的实时认知和情绪状态（专注度、放松度、情绪、认知负荷、困倦度、心率、心率变异性、睡眠分期以及 40+ 个衍生的 EXG 分数）融入响应中…… |

## MCP

| 技能 | 描述 |
|-------|-------------|
| [**fastmcp**](/docs/user-guide/skills/optional/mcp/mcp-fastmcp) | 使用 Python 中的 FastMCP 构建、测试、检查、安装和部署 MCP 服务器。在创建新的 MCP 服务器、将 API 或数据库包装为 MCP 工具、暴露资源或提示，或准备 FastMCP 服务器以用于 Claude Code、Cur…… |
| [**mcporter**](/docs/user-guide/skills/optional/mcp/mcp-mcporter) | 使用 mcporter CLI 直接列出、配置、认证和调用 MCP 服务器/工具（HTTP 或 stdio），包括临时服务器、配置编辑和 CLI/类型生成。 |

## 迁移

| 技能 | 描述 |
|-------|-------------|
| [**openclaw-migration**](/docs/user-guide/skills/optional/migration/migration-openclaw-migration) | 将用户的 OpenClaw 自定义配置迁移到 Hermes 智能体。从 ~/.openclaw 导入与 Hermes 兼容的记忆、SOUL.md、命令白名单、用户技能以及选定的工作区资产，然后准确报告无法迁移的内容…… |

## MLOps

| 技能 | 描述 |
|-------|-------------|
| [**huggingface-accelerate**](/docs/user-guide/skills/optional/mlops/mlops-accelerate) | 最简单的分布式训练 API。仅需 4 行代码即可为任何 PyTorch 脚本添加分布式支持。DeepSpeed/FSDP/Megatron/DDP 的统一 API。自动设备放置、混合精度（FP16/BF16/FP8）。交互式配置、单次启动命令…… |
| [**chroma**](/docs/user-guide/skills/optional/mlops/mlops-chroma) | 用于 AI 应用的开源嵌入数据库。存储嵌入和元数据，执行向量和全文搜索，按元数据过滤。简单的 4 函数 API。可从笔记本扩展到生产集群。用于语义搜索、RAG…… |
| [**clip**](/docs/user-guide/skills/optional/mlops/mlops-clip) | OpenAI 连接视觉和语言的模型。实现零样本图像分类、图像-文本匹配和跨模态检索。在 4 亿个图像-文本对上训练。用于图像搜索、内容审核或视觉-语言任务…… |
| [**faiss**](/docs/user-guide/skills/optional/mlops/mlops-faiss) | Facebook 的高效密集向量相似性搜索和聚类库。支持数十亿向量、GPU 加速和多种索引类型（Flat、IVF、HNSW）。用于快速 k-NN 搜索、大规模向量检索或…… |
| [**optimizing-attention-flash**](/docs/user-guide/skills/optional/mlops/mlops-flash-attention) | 使用 Flash Attention 优化 Transformer 注意力机制，实现 2-4 倍加速和 10-20 倍内存减少。在训练/运行具有长序列（>512 个标记）的 Transformer、遇到注意力机制的 GPU 内存问题或需要更快推理时使用…… |
| [**guidance**](/docs/user-guide/skills/optional/mlops/mlops-guidance) | 使用正则表达式和语法控制 LLM 输出，保证有效的 JSON/XML/代码生成，强制执行结构化格式，并使用 Guidance（微软研究院的约束生成框架）构建多步骤工作流 |
| [**hermes-atropos-environments**](/docs/user-guide/skills/optional/mlops/mlops-hermes-atropos-environments) | 为 Atropos 训练构建、测试和调试 Hermes 智能体强化学习环境。涵盖 HermesAgentBaseEnv 接口、奖励函数、智能体循环集成、使用工具的评估、wandb 日志记录以及三种 CLI 模式（serve/process/eval…… |
| [**huggingface-tokenizers**](/docs/user-guide/skills/optional/mlops/mlops-huggingface-tokenizers) | 为研究和生产优化的快速分词器。基于 Rust 的实现可在 <20 秒内对 1GB 数据进行分词。支持 BPE、WordPiece 和 Unigram 算法。训练自定义词汇表、跟踪对齐、处理填充/截断。集成…… |
| [**instructor**](/docs/user-guide/skills/optional/mlops/mlops-instructor) | 使用 Pydantic 验证从 LLM 响应中提取结构化数据，自动重试失败的提取，解析具有类型安全的复杂 JSON，并使用 Instructor（经过实战检验的结构化输出库）流式传输部分结果 |
| [**lambda-labs-gpu-cloud**](/docs/user-guide/skills/optional/mlops/mlops-lambda-labs) | 用于 ML 训练和推理的预留和按需 GPU 云实例。在需要具有简单 SSH 访问权限的专用 GPU 实例、持久文件系统或用于大规模训练的高性能多节点集群时使用。 |
| [**llava**](/docs/user-guide/skills/optional/mlops/mlops-llava) | 大型语言和视觉助手。实现视觉指令微调和基于图像的对话。将 CLIP 视觉编码器与 Vicuna/LLaMA 语言模型相结合。支持多轮图像聊天、视觉问答和指令…… |
| [**modal-serverless-gpu**](/docs/user-guide/skills/optional/mlops/mlops-modal) | 用于运行 ML 工作负载的无服务器 GPU 云平台。在需要按需 GPU 访问而无需基础设施管理、将 ML 模型部署为 API 或运行具有自动扩展的批处理作业时使用。 |
| [**nemo-curator**](/docs/user-guide/skills/optional/mlops/mlops-nemo-curator) | 用于 LLM 训练的 GPU 加速数据整理。支持文本/图像/视频/音频。功能包括模糊去重（快 16 倍）、质量过滤（30+ 启发式）、语义去重、PII 编辑、NSFW 检测。可跨 GPU 扩展…… |
| [**peft-fine-tuning**](/docs/user-guide/skills/optional/mlops/mlops-peft) | 使用 LoRA、QLoRA 和 25+ 种方法对 LLM 进行参数高效微调。在 GPU 内存有限的情况下微调大型模型（7B-70B）、需要以最小精度损失训练 <1% 的参数或进行多适配器设置时使用…… |
| [**pinecone**](/docs/user-guide/skills/optional/mlops/mlops-pinecone) | 用于生产 AI 应用的托管向量数据库。完全托管、自动扩展，具有混合搜索（密集 + 稀疏）、元数据过滤和命名空间。低延迟（<100ms p95）。用于生产 RAG、推荐系统或…… |
| [**pytorch-fsdp**](/docs/user-guide/skills/optional/mlops/mlops-pytorch-fsdp) | 使用 PyTorch FSDP 进行完全分片数据并行训练的專家指導 - 参数分片、混合精度、CPU 卸载、FSDP2 |
| [**pytorch-lightning**](/docs/user-guide/skills/optional/mlops/mlops-pytorch-lightning) | 具有 Trainer 类、自动分布式训练（DDP/FSDP/DeepSpeed）、回调系统和最少样板代码的高级 PyTorch 框架。使用相同代码可从笔记本电脑扩展到超级计算机。在希望获得简洁训练循环时使用…… |
| [**qdrant-vector-search**](/docs/user-guide/skills/optional/mlops/mlops-qdrant) | 用于 RAG 和语义搜索的高性能向量相似性搜索引擎。在构建需要快速最近邻搜索、带过滤的混合搜索或具有 Rust 驱动性能的 scalable 向量存储的生产 RAG 系统时使用…… |
| [**sparse-autoencoder-training**](/docs/user-guide/skills/optional/mlops/mlops-saelens) | 提供使用 SAELens 训练和分析稀疏自编码器 (SAEs) 的指导，以将神经网络激活分解为可解释的特征。在发现可解释特征、分析叠加或研究…… |
| [**simpo-training**](/docs/user-guide/skills/optional/mlops/mlops-simpo) | 用于 LLM 对齐的简单偏好优化。无需参考模型的 DPO 替代方案，性能更好（在 AlpacaEval 2.0 上 +6.4 分）。无需参考模型，比 DPO 更高效。在希望简化时进行偏好对齐…… |
| [**slime-rl-training**](/docs/user-guide/skills/optional/mlops/mlops-slime) | 提供使用 slime（Megatron+SGLang 框架）进行 RL 的 LLM 后训练指导。在训练 GLM 模型、实现自定义数据生成工作流或需要紧密的 Megatron-LM 集成以进行 RL 扩展时使用。 |
| [**stable-diffusion-image-generation**](/docs/user-guide/skills/optional/mlops/mlops-stable-diffusion) | 通过 HuggingFace Diffusers 使用 Stable Diffusion 模型进行最先进的文本到图像生成。在根据文本提示生成图像、执行图像到图像翻译、修复或构建自定义扩散管道时使用。 |
| [**tensorrt-llm**](/docs/user-guide/skills/optional/mlops/mlops-tensorrt-llm) | 使用 NVIDIA TensorRT 优化 LLM 推理，以实现最大吞吐量和最低延迟。在 NVIDIA GPU (A100/H100) 上进行生产部署、需要比 PyTorch 快 10-100 倍的推理或对模型进行量化服务时使用…… |
| [**distributed-llm-pretraining-torchtitan**](/docs/user-guide/skills/optional/mlops/mlops-torchtitan) | 使用 torchtitan 提供 PyTorch 原生分布式 LLM 预训练，具有 4D 并行性（FSDP2、TP、PP、CP）。在从 8 到 512+ GPU 的规模上使用 Float8、torch.compile 和 dist 预训练 Llama 3.1、DeepSeek V3 或自定义模型时使用…… |
| [**whisper**](/docs/user-guide/skills/optional/mlops/mlops-whisper) | OpenAI 的通用语音识别模型。支持 99 种语言、转录、翻译成英语和语言识别。六种模型大小，从 tiny（3900 万参数）到 large（15.5 亿参数）。用于语音转文本、播客…… |

## 生产力

| 技能 | 描述 |
|-------|-------------|
| [**canvas**](/docs/user-guide/skills/optional/productivity/productivity-canvas) | Canvas LMS 集成 — 使用 API 令牌认证获取已注册课程和作业。 |
| [**memento-flashcards**](/docs/user-guide/skills/optional/productivity/productivity-memento-flashcards) | 间隔重复记忆卡片系统。根据事实或文本创建卡片，使用自由文本答案与记忆卡片聊天并由智能体评分，根据 YouTube 字幕生成测验，使用自适应调度复习到期卡片，以及导出/导入... |
| [**siyuan**](/docs/user-guide/skills/optional/productivity/productivity-siyuan) | 思源笔记 API，用于通过 curl 在自托管知识库中搜索、读取、创建和管理块和文档。 |
| [**telephony**](/docs/user-guide/skills/optional/productivity/productivity-telephony) | 为 Hermes 提供电话功能，无需更改核心工具。配置并持久化 Twilio 号码，发送和接收短信/彩信，进行直接通话，并通过 Bland.ai 或 Vapi 进行 AI 驱动的出站呼叫。 |

## 研究

| 技能 | 描述 |
|-------|-------------|
| [**bioinformatics**](/docs/user-guide/skills/optional/research/research-bioinformatics) | 通往来自 bioSkills 和 ClawBio 的 400 多项生物信息学技能的门户。涵盖基因组学、转录组学、单细胞、变异检测、药物基因组学、宏基因组学、结构生物学等。获取特定领域的参考资料... |
| [**domain-intel**](/docs/user-guide/skills/optional/research/research-domain-intel) | 使用 Python 标准库进行被动域名侦察。子域名发现、SSL 证书检查、WHOIS 查询、DNS 记录、域名可用性检查以及批量多域名分析。无需 API 密钥。 |
| [**drug-discovery**](/docs/user-guide/skills/optional/research/research-drug-discovery) | 药物发现工作流程的制药研究助手。在 ChEMBL 上搜索生物活性化合物，计算类药性（Lipinski Ro5、QED、TPSA、合成可及性），通过 OpenFDA 查询药物相互作用，解释 ADMET... |
| [**duckduckgo-search**](/docs/user-guide/skills/optional/research/research-duckduckgo-search) | 通过 DuckDuckGo 进行免费网络搜索 — 文本、新闻、图片、视频。无需 API 密钥。安装时优先使用 `ddgs` CLI；仅在验证当前运行时环境中 `ddgs` 可用后才使用 Python DDGS 库。 |
| [**gitnexus-explorer**](/docs/user-guide/skills/optional/research/research-gitnexus-explorer) | 使用 GitNexus 对代码库建立索引，并通过 Web UI + Cloudflare 隧道提供交互式知识图谱。 |
| [**parallel-cli**](/docs/user-guide/skills/optional/research/research-parallel-cli) | Parallel CLI 的可选供应商技能 — 智能体原生网络搜索、提取、深度研究、丰富化、FindAll 和监控。优先使用 JSON 输出和非交互流程。 |
| [**qmd**](/docs/user-guide/skills/optional/research/research-qmd) | 使用 qmd 在本地搜索个人知识库、笔记、文档和会议记录 — 一种混合检索引擎，结合了 BM25、向量搜索和 LLM 重排序。支持 CLI 和 MCP 集成。 |
| [**scrapling**](/docs/user-guide/skills/optional/research/research-scrapling) | 使用 Scrapling 进行网络抓取 — HTTP 获取、隐身浏览器自动化、Cloudflare 绕过以及通过 CLI 和 Python 进行爬虫抓取。 |

## 安全

| 技能 | 描述 |
|-------|-------------|
| [**1password**](/docs/user-guide/skills/optional/security/security-1password) | 设置并使用 1Password CLI (op)。在安装 CLI、启用桌面应用集成、登录以及为命令读取/注入密钥时使用。 |
| [**oss-forensics**](/docs/user-guide/skills/optional/security/security-oss-forensics) | 针对 GitHub 仓库的供应链调查、证据恢复和取证分析。涵盖已删除提交恢复、强制推送检测、IOC 提取、多源证据收集、假设形成/验证以及... |
| [**sherlock**](/docs/user-guide/skills/optional/security/security-sherlock) | 在 400 多个社交网络中进行 OSINT 用户名搜索。通过用户名追踪社交媒体账户。 |

## Web 开发

| 技能 | 描述 |
|-------|-------------|
| [**page-agent**](/docs/user-guide/skills/optional/web-development/web-development-page-agent) | 将 alibaba/page-agent 嵌入到您自己的 Web 应用中 — 一个纯 JavaScript 的页面内 GUI 智能体，以单个 &lt;script> 标签或 npm 包形式提供，允许您网站的用户使用自然语言驱动 UI（“点击登录，填写用户名...”） |

---

## 贡献可选技能

要向仓库添加新的可选技能：

1. 在 `optional-skills/<category>/<skill-name>/` 下创建目录
2. 添加带有标准前置元数据（名称、描述、版本、作者）的 `SKILL.md` 文件
3. 在 `references/`、`templates/` 或 `scripts/` 子目录中包含任何支持文件
4. 提交拉取请求 — 技能合并后将出现在此目录中，并获得其专属文档页面