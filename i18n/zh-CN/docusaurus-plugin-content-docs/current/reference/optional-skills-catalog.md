---
sidebar_position: 9
title: "可选技能目录"
description: "官方可选技能随 hermes-agent 提供 — 通过 hermes skills install official/<category>/<skill> 安装"
---

# 可选技能目录

官方可选技能随 hermes-agent 仓库在 `optional-skills/` 下提供，但**默认不激活**。请显式安装它们：

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

## 自主 AI 代理 (Autonomous AI Agents)

| 技能 | 描述 |
|-------|-------------|
| **blackbox** | 将编码任务委托给 Blackbox AI CLI 代理。这是一个内置判别器的多模型代理，它通过多个 LLM 运行任务并挑选最佳结果。 |
| **honcho** | 使用 Hermes 配置和使用 Honcho 内存——跨会话用户建模、多配置文件对等隔离、观察配置和辩证推理。 |

## 区块链 (Blockchain)

| 技能 | 描述 |
|-------|-------------|
| **base** | 查询 Base (以太坊 L2) 区块链数据，并以美元定价——包括钱包余额、代币信息、交易详情、Gas 分析、合约检查、巨鲸检测和实时网络统计。无需 API 密钥。 |
| **solana** | 查询 Solana 区块链数据，并以美元定价——包括钱包余额、代币投资组合、交易详情、NFT、巨鲸检测和实时网络统计。无需 API 密钥。 |

## 通信 (Communication)

| 技能 | 描述 |
|-------|-------------|
| **one-three-one-rule** | 用于提案和决策制定的结构化沟通框架。 |

## 创意 (Creative)

| 技能 | 描述 |
|-------|-------------|
| **blender-mcp** | 通过 socket 连接直接控制 Blender，调用 blender-mcp 插件。创建 3D 对象、材质、动画，并运行任意 Blender Python (bpy) 代码。 |
| **meme-generation** | 通过选择模板并使用 Pillow 叠加文本来生成真实的迷因图片。生成实际的 `.png` 迷因文件。 |

## DevOps

| 技能 | 描述 |
|-------|-------------|
| **cli** | 通过 inference.sh CLI (infsh) 运行 150+ 个 AI 应用——包括图像生成、视频创建、LLMs、搜索、3D 和社交自动化。 |
| **docker-management** | 管理 Docker 容器、镜像、卷、网络和 Compose 堆栈——包括生命周期操作、调试、清理和 Dockerfile 优化。 |

## 电子邮件 (Email)

| 技能 | 描述 |
|-------|-------------|
| **agentmail** | 通过 AgentMail 为代理提供专用的电子邮件收件箱。使用代理拥有的电子邮件地址自主发送、接收和管理邮件。 |

## 健康 (Health)

| 技能 | 描述 |
|-------|-------------|
| **neuroskill-bci** | 用于神经科学研究工作流的脑机接口 (BCI) 集成。 |

## MCP

| 技能 | 描述 |
|-------|-------------|
| **fastmcp** | 使用 FastMCP 在 Python 中构建、测试、检查、安装和部署 MCP 服务器。涵盖将 API 或数据库封装为 MCP 工具、暴露资源或提示以及部署。 |

## 迁移 (Migration)

| 技能 | 描述 |
|-------|-------------|
| **openclaw-migration** | 将用户 OpenClaw 的自定义足迹迁移到 Hermes Agent。导入记忆、SOUL.md、命令白名单、用户技能和选定的工作区资产。 |

## MLOps

这是最大的可选类别——涵盖了从数据策划到生产推理的完整 ML 流程。

| 技能 | 描述 |
|-------|-------------|
| **accelerate** | 最简单的分布式训练 API。只需 4 行代码即可为任何 PyTorch 脚本添加分布式支持。用于 DeepSpeed/FSDP/Megatron/DDP 的统一 API。 |
| **chroma** | 开源嵌入数据库。存储嵌入和元数据，执行向量和全文搜索。用于 RAG 和语义搜索的简单 4 功能 API。 |
| **faiss** | Facebook 用于高效相似性搜索和密集向量聚类的库。支持数十亿个向量、GPU 加速和各种索引类型（Flat, IVF, HNSW）。 |
| **flash-attention** | 使用 Flash Attention 优化 Transformer 注意力机制，可实现 2-4 倍的速度提升和 10-20 倍的内存减少。支持 PyTorch SDPA、flash-attn 库、H100 FP8 和滑动窗口。 |
| **hermes-atropos-environments** | 为 Atropos 训练构建、测试和调试 Hermes Agent RL 环境。涵盖 HermesAgentBaseEnv 接口、奖励函数、代理循环集成和评估。 |
| **huggingface-tokenizers** | 用于研究和生产的快速 Rust 库分词器。在 20 秒内分词 1GB 数据。支持 BPE、WordPiece 和 Unigram 算法。 |
| **instructor** | 使用 Pydantic 验证从 LLM 响应中提取结构化数据，自动重试失败的提取，并流式传输部分结果。 |
| **lambda-labs** | 用于 ML 训练和推理的预留和按需 GPU 云实例。提供 SSH 访问、持久化文件系统和多节点集群。 |
| **llava** | 大型语言和视觉助手——结合 CLIP 视觉和 LLaMA 语言模型，实现视觉指令调优和基于图像的对话。 |
| **nemo-curator** | 用于 LLM 训练的 GPU 加速数据策划。模糊去重（快 16 倍）、质量过滤（30+ 启发式规则）、语义去重、PII 脱敏。可扩展至 RAPIDS。 |
| **pinecone** | 用于生产 AI 的托管向量数据库。支持自动扩展、混合搜索（密集 + 稀疏）、元数据过滤和低延迟（p95 < 100ms）。 |
| **pytorch-lightning** | 高级 PyTorch 框架，包含 Trainer 类、自动分布式训练（DDP/FSDP/DeepSpeed）、回调和极简样板代码。 |
| **qdrant** | 高性能向量相似性搜索引擎。基于 Rust，具有快速最近邻搜索、带过滤的混合搜索和可扩展的向量存储。 |
| **saelens** | 使用 SAELens 训练和分析稀疏自编码器 (SAEs)，将神经网络激活分解为可解释的特征。 |
| **simpo** | 简单偏好优化——DPO 的无参考替代方案，性能更优（AlpacaEval 2.0 上提高 6.4 分）。无需参考模型。 |
| **slime** | 使用 Megatron+SGLang 框架进行 LLM 后训练和 RL。提供自定义数据生成工作流和紧密的 Megatron-LM 集成，用于 RL 扩展。 |
| **tensorrt-llm** | 使用 NVIDIA TensorRT 优化 LLM 推理，实现最高吞吐量。在 A100/H100 上，通过量化 (FP8/INT4) 和飞行批处理，比 PyTorch 快 10-100 倍。 |
| **torchtitan** | PyTorch 原生的分布式 LLM 预训练，采用 4D 并行化（FSDP2, TP, PP, CP）。使用 Float8 和 torch.compile，可从 8 到 512+ GPU 扩展。 |

## 生产力 (Productivity)

| 技能 | 描述 |
|-------|-------------|
| **canvas** | Canvas LMS 集成——使用 API 令牌认证获取已注册的课程和作业。 |
| **memento-flashcards** | 用于学习和知识保持的间隔重复抽认卡系统。 |
| **siyuan** | SiYuan Note API，用于搜索、阅读、创建和管理自托管知识库中的块和文档。 |
| **telephony** | 为 Hermes 提供电话功能——配置 Twilio 号码，发送/接收 SMS/MMS，拨打电话，并通过 Bland.ai 或 Vapi 进行 AI 驱动的呼出呼叫。 |

## 研究 (Research)

| 技能 | 描述 |
|-------|-------------|
| **bioinformatics** | 通往 bioSkills 和 ClawBio 400+ 生物信息学技能的门户。涵盖基因组学、转录组学、单细胞、变异检测、药物基因组学、宏基因组学和结构生物学。 |
| **domain-intel** | 使用 Python 标准库进行被动领域侦察。包括子域名发现、SSL 证书检查、WHOIS 查询、DNS 记录和批量多域分析。无需 API 密钥。 |
| **duckduckgo-search** | 通过 DuckDuckGo 进行免费网络搜索——包括文本、新闻、图像和视频。无需 API 密钥。 |
| **gitnexus-explorer** | 使用 GitNexus 索引代码库，并通过 Web UI 和 Cloudflare tunnel 提供交互式知识图谱。 |
| **parallel-cli** | 供应商技能，用于 Parallel CLI——代理原生的网络搜索、提取、深度研究、丰富和监控。 |
| **qmd** | 使用 qmd 在本地搜索个人知识库、笔记、文档和会议记录——这是一种结合了 BM25、向量搜索和 LLM 重排的混合检索引擎。 |
| **scrapling** | 使用 Scrapling 进行网络爬取——通过 CLI 和 Python 进行 HTTP 获取、隐身浏览器自动化、Cloudflare 绕过和蜘蛛爬行。 |

## 安全 (Security)

| 技能 | 描述 |
|-------|-------------|
| **1password** | 设置和使用 1Password CLI (op)。安装 CLI，启用桌面应用集成，登录，并为命令读取/注入密钥。 |
| **oss-forensics** | 开源软件取证——分析软件包、依赖项和供应链风险。 |
| **sherlock** | 跨 400+ 社交网络的 OSINT 用户名搜索。通过用户名查找社交媒体账户。 |

---

## 贡献可选技能 (Contributing Optional Skills)

要向仓库添加新的可选技能：

1. 在 `optional-skills/<category>/<skill-name>/` 下创建一个目录
2. 添加一个带有标准前置元数据（名称、描述、版本、作者）的 `SKILL.md` 文件
3. 在 `references/`、`templates/` 或 `scripts/` 子目录中包含任何支持文件
4. 提交一个拉取请求——合并后，该技能将出现在本目录中