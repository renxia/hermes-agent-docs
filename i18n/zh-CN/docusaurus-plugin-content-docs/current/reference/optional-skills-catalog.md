---
sidebar_position: 9
title: "可选技能目录"
description: "随 hermes-agent 提供的官方可选技能 — 通过 hermes skills install official/<category>/<skill> 安装"
---

# 可选技能目录

官方可选技能随 hermes-agent 仓库一起发布，位于 `optional-skills/` 目录下，但**默认不启用**。请显式安装：

```bash
hermes skills install official/<category>/<skill>
```

例如：

```bash
hermes skills install official/blockchain/solana
hermes skills install official/mlops/flash-attention
```

安装后，该技能将出现在智能体的技能列表中，并在检测到相关任务时自动加载。

要卸载：

```bash
hermes skills uninstall <skill-name>
```

---

## 自主 AI 智能体

| 技能 | 描述 |
|-------|-------------|
| **blackbox** | 将编码任务委托给 Blackbox AI CLI 智能体。多模型智能体，内置评判器，通过多个大语言模型运行任务并选择最佳结果。 |
| **honcho** | 配置并使用 Honcho 记忆功能与 Hermes 集成 — 跨会话用户建模、多配置文件对等隔离、观察配置和辩证推理。 |

## 区块链

| 技能 | 描述 |
|-------|-------------|
| **base** | 查询 Base（以太坊 L2）区块链数据并附带美元计价 — 钱包余额、代币信息、交易详情、Gas 分析、合约检查、巨鲸检测以及实时网络统计。无需 API 密钥。 |
| **solana** | 查询 Solana 区块链数据并附带美元计价 — 钱包余额、代币投资组合、交易详情、NFT、巨鲸检测以及实时网络统计。无需 API 密钥。 |

## 通信

| 技能 | 描述 |
|-------|-------------|
| **one-three-one-rule** | 用于提案和决策的结构化沟通框架。 |

## 创意

| 技能 | 描述 |
|-------|-------------|
| **blender-mcp** | 通过套接字连接 blender-mcp 插件，直接从 Hermes 控制 Blender。创建 3D 对象、材质、动画，并运行任意 Blender Python (bpy) 代码。 |
| **concept-diagrams** | 生成扁平化、极简且适配浅色/深色模式的 SVG 图表，保存为独立 HTML 文件，采用统一的科普可视化语言（9 种语义色彩渐变，自动深色模式）。适用于物理装置、化学机制、数学曲线、物理对象（飞机、涡轮机、智能手机）、平面图、剖面图、生命周期/流程叙事以及中心辐射型系统图。附带 15 个示例图表。 |
| **meme-generation** | 通过选择模板并使用 Pillow 叠加文本生成真实迷因图片。生成实际的 `.png` 迷因文件。 |
| **touchdesigner-mcp** | 通过 twozero MCP 插件控制正在运行的 TouchDesigner 实例 — 创建操作符、设置参数、连接线路、执行 Python 代码，构建实时音频响应式视觉效果和 GLSL 网络。包含 36 种原生工具。 |

## 内部试用（Dogfood）

| 技能 | 描述 |
|-------|-------------|
| **adversarial-ux-test** | 扮演产品最难缠、最抗拒技术的用户 — 以该身份浏览、抱怨，然后通过红/黄/白/绿务实性层级过滤，仅将真实的 UX 摩擦转化为工单。 |

## DevOps

| 技能 | 描述 |
|-------|-------------|
| **cli** | 通过 inference.sh CLI (infsh) 运行 150+ 个 AI 应用 — 图像生成、视频创作、大语言模型、搜索、3D 建模以及社交自动化。 |
| **docker-management** | 管理 Docker 容器、镜像、卷、网络和 Compose 栈 — 生命周期操作、调试、清理以及 Dockerfile 优化。 |

## 邮件

| 技能 | 描述 |
|-------|-------------|
| **agentmail** | 通过 AgentMail 为智能体分配专属邮箱收件箱。使用智能体拥有的邮箱地址自主发送、接收和管理邮件。 |

## 健康

| 技能 | 描述 |
|-------|-------------|
| **fitness-nutrition** | 健身房锻炼计划制定与营养追踪。通过 wger 按肌肉群、器械或类别搜索 690+ 种运动。通过 USDA FoodData Central 查询 380,000+ 种食物的营养成分和卡路里。计算 BMI、TDEE、单次最大重量、宏量营养素分配和体脂率 — 纯 Python 实现，无需 pip 安装。 |
| **neuroskill-bci** | 脑机接口（BCI）集成，用于神经科学研究工作流。 |

## MCP

| 技能 | 描述 |
|-------|-------------|
| **fastmcp** | 使用 FastMCP 在 Python 中构建、测试、检查、安装和部署 MCP 服务器。涵盖将 API 或数据库封装为 MCP 工具、暴露资源或提示以及部署。 |
| **mcporter** | `mcporter` CLI — 在终端中直接列出、配置、认证和调用 MCP 服务器/工具（HTTP 或 stdio）。适用于临时 MCP 交互；如需常驻工具发现，请使用内置的 `native-mcp` 客户端。 |

## 迁移

| 技能 | 描述 |
|-------|-------------|
| **openclaw-migration** | 将用户的 OpenClaw 自定义配置迁移至 Hermes 智能体。导入记忆、SOUL.md、命令白名单、用户技能以及选定的工作区资产。 |

## MLOps

最大的可选类别 — 涵盖从数据整理到生产推理的完整机器学习流水线。

| 技能 | 描述 |
|-------|-------------|
| **accelerate** | 最简单的分布式训练 API。仅需 4 行代码即可为任何 PyTorch 脚本添加分布式支持。为 DeepSpeed/FSDP/Megatron/DDP 提供统一 API。 |
| **chroma** | 开源嵌入数据库。存储嵌入向量和元数据，执行向量搜索和全文搜索。为 RAG 和语义搜索提供简单的 4 函数 API。 |
| **clip** | OpenAI 的视觉-语言模型，连接图像与文本。零样本图像分类、图像-文本匹配以及跨模态检索。基于 4 亿对图像-文本对训练。无需微调即可用于图像搜索、内容审核或视觉-语言任务。 |
| **faiss** | Facebook 的高效密集向量相似性搜索和聚类库。支持数十亿向量、GPU 加速以及多种索引类型（Flat、IVF、HNSW）。 |
| **flash-attention** | 使用 Flash Attention 优化 Transformer 注意力机制，实现 2-4 倍加速和 10-20 倍内存降低。支持 PyTorch SDPA、flash-attn 库、H100 FP8 以及滑动窗口。 |
| **guidance** | 使用正则表达式和语法控制大语言模型输出，确保生成有效的 JSON/XML/代码，强制执行结构化格式，并使用 Guidance 构建多步骤工作流 — 微软研究院的约束生成框架。 |
| **hermes-atropos-environments** | 为 Atropos 训练构建、测试和调试 Hermes 智能体强化学习环境。涵盖 HermesAgentBaseEnv 接口、奖励函数、智能体循环集成以及评估。 |
| **huggingface-tokenizers** | 用于研究和生产的高速基于 Rust 的分词器。可在 20 秒内对 1GB 文本进行分词。支持 BPE、WordPiece 和 Unigram 算法。 |
| **instructor** | 使用 Pydantic 验证从大语言模型响应中提取结构化数据，自动重试失败的提取，并流式传输部分结果。 |
| **lambda-labs** | 用于机器学习训练和推理的预留和按需 GPU 云实例。支持 SSH 访问、持久文件系统和多节点集群。 |
| **llava** | 大型语言与视觉助手 — 结合 CLIP 视觉与 LLaMA 语言模型的视觉指令微调和基于图像的对话。 |
| **modal** | 用于运行机器学习工作负载的无服务器 GPU 云平台。无需基础设施管理即可获得按需 GPU 访问，将机器学习模型部署为 API，或运行具有自动扩展能力的批处理作业。 |
| **nemo-curator** | 用于大语言模型训练的 GPU 加速数据整理。模糊去重（快 16 倍）、质量过滤（30+ 启发式规则）、语义去重、PII 脱敏。可与 RAPIDS 扩展。 |
| **peft-fine-tuning** | 使用 LoRA、QLoRA 等 25+ 种方法对大语言模型进行参数高效微调。在有限 GPU 内存下，以极小精度损失训练 `<1%` 的参数，适用于 7B–70B 模型。HuggingFace 官方 PEFT 库。 |
| **pinecone** | 用于生产级 AI 的托管向量数据库。自动扩展、混合搜索（密集 + 稀疏）、元数据过滤以及低延迟（p95 低于 100ms）。 |
| **pytorch-fsdp** | 使用 PyTorch FSDP 进行全分片数据并行训练的专家指导 — 参数分片、混合精度、CPU 卸载、FSDP2。 |
| **pytorch-lightning** | 带有 Trainer 类的高级 PyTorch 框架，支持自动分布式训练（DDP/FSDP/DeepSpeed）、回调以及极简样板代码。 |
| **qdrant** | 高性能向量相似性搜索引擎。基于 Rust 构建，具有快速最近邻搜索、带过滤的混合搜索以及可扩展的向量存储。 |
| **saelens** | 使用 SAELens 训练和分析稀疏自编码器（SAEs），将神经网络激活分解为可解释的特征。 |
| **simpo** | 简单偏好优化 — 无需参考模型的 DPO 替代方案，性能更优（在 AlpacaEval 2.0 上提升 +6.4 分）。 |
| **slime** | 使用 Megatron+SGLang 框架通过强化学习进行大语言模型后训练。自定义数据生成工作流以及与 Megatron-LM 的紧密集成，以实现强化学习扩展。 |
| **stable-diffusion-image-generation** | 通过 HuggingFace Diffusers 使用 Stable Diffusion 进行最先进的文本到图像生成。支持文本到图像、图像到图像转换、图像修复以及自定义扩散流水线。 |
| **tensorrt-llm** | 使用 NVIDIA TensorRT 优化大语言模型推理，实现最大吞吐量。在 A100/H100 上比 PyTorch 快 10-100 倍，支持量化（FP8/INT4）和飞行中批处理。 |
| **torchtitan** | 基于 PyTorch 的分布式大语言模型预训练，支持 4D 并行（FSDP2、TP、PP、CP）。可从 8 扩展到 512+ GPU，支持 Float8 和 torch.compile。 |
| **whisper** | OpenAI 的通用语音识别模型。支持 99 种语言、转录、翻译为英语以及语言识别。提供六种模型尺寸，从 tiny（39M）到 large（1550M）。最适合稳健的多语言自动语音识别（ASR）。 |

## 生产力

| 技能 | 描述 |
|-------|-------------|
| **canvas** | Canvas LMS 集成 — 使用 API 令牌认证获取已注册课程和作业。 |
| **memento-flashcards** | 用于学习和知识保留的间隔重复闪卡系统。 |
| **siyuan** | SiYuan 笔记 API，用于在自托管知识库中搜索、阅读、创建和管理块和文档。 |
| **telephony** | 为 Hermes 提供电话功能 — 配置 Twilio 号码、发送/接收短信/彩信、拨打电话，并通过 Bland.ai 或 Vapi 进行 AI 驱动的出站呼叫。 |

## 研究

| 技能 | 描述 |
|-------|-------------|
| **bioinformatics** | 通往来自 bioSkills 和 ClawBio 的 400+ 个生物信息学技能的门户。涵盖基因组学、转录组学、单细胞分析、变异检测、药物基因组学、宏基因组学和结构生物学。 |
| **domain-intel** | 使用 Python 标准库进行被动域名侦察。子域名发现、SSL 证书检查、WHOIS 查询、DNS 记录以及批量多域名分析。无需 API 密钥。 |
| **duckduckgo-search** | 通过 DuckDuckGo 进行免费网络搜索 — 文本、新闻、图像、视频。无需 API 密钥。 |
| **gitnexus-explorer** | 使用 GitNexus 对代码库建立索引，并通过 Web UI 和 Cloudflare 隧道提供交互式知识图谱。 |
| **parallel-cli** | Parallel CLI 的供应商技能 — 智能体原生网络搜索、提取、深度研究、丰富化和监控。 |
| **qmd** | 使用 qmd 在本地搜索个人知识库、笔记、文档和会议记录 — 一种结合 BM25、向量搜索和大语言模型重排序的混合检索引擎。 |
| **scrapling** | 使用 Scrapling 进行网络爬取 — HTTP 获取、隐身浏览器自动化、绕过 Cloudflare 以及通过 CLI 和 Python 进行蜘蛛爬取。 |

## 安全

| 技能 | 描述 |
|-------|-------------|
| **1password** | 设置并使用 1Password CLI (op)。安装 CLI、启用桌面应用集成、登录，并为命令读取/注入密钥。 |
| **oss-forensics** | 开源软件取证 — 分析软件包、依赖项和供应链风险。 |
| **sherlock** | 在 400+ 个社交网络上进行 OSINT 用户名搜索。通过用户名查找社交媒体账户。 |

---

## 贡献可选技能

要向仓库添加新的可选技能：

1. 在 `optional-skills/<category>/<skill-name>/` 下创建目录
2. 添加包含标准 frontmatter（名称、描述、版本、作者）的 `SKILL.md` 文件
3. 在 `references/`、`templates/` 或 `scripts/` 子目录中包含任何支持文件
4. 提交拉取请求 — 技能合并后将出现在此目录中