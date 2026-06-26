---
sidebar_position: 9
title: "Optional Skills Catalog"
description: "随hermes-agent一起提供的官方可选技能——通过 hermes skills install official/<category>/<skill> 安装"
---

# 可选技能目录

可选技能随hermes-agent提供，位于`optional-skills/`下，但**默认不激活**。请显式安装它们：

```bash
hermes skills install official/<category>/<skill>
```

例如：

```bash
hermes skills install official/blockchain/solana
hermes skills install official/mlops/flash-attention
```

下面的每个技能都链接到一个专门的页面，其中包含其完整的定义、设置和使用方法。

要卸载：

```bash
hermes skills uninstall <skill-name>
```

## 自主AI智能体

| Skill | Description |
|-------|-------------|
| [**antigravity-cli**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-antigravity-cli) | 操作Antigravity CLI (agy)：插件、认证、沙箱。 |
| [**blackbox**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-blackbox) | 将编码任务委托给Blackbox AI CLI 智能体。这是一个多模型智能体，内置有裁判功能，它通过多个LLM运行任务并选择最佳结果。需要blackbox CLI和Blackbox AI API密钥。 |
| [**grok**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-grok) | 将编码工作委托给xAI Grok Build CLI（功能、PR）。 |
| [**honcho**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-honcho) | 使用Hermes配置和使用Honcho内存——包括跨会话用户建模、多配置文件对等隔离、观察配置、辩证推理、会话摘要和上下文预算强制执行。在设置Honcho、故障排除时使用... |
| [**openhands**](/docs/user-guide/skills/optional/autonomous-ai-agents/autonomous-ai-agents-openhands) | 将编码工作委托给OpenHands CLI（与模型无关，LiteLLM）。 |

## blockchain

| Skill | Description |
|-------|-------------|
| [**evm**](/docs/user-guide/skills/optional/blockchain/blockchain-evm) | 只读 EVM 客户端：跨 8 条链的钱包、代币和 Gas。 |
| [**hyperliquid**](/docs/user-guide/skills/optional/blockchain/blockchain-hyperliquid) | Hyperliquid 市场数据、账户历史记录、交易回顾。 |
| [**solana**](/docs/user-guide/skills/optional/blockchain/blockchain-solana) | 使用 USD 定价查询 Solana 区块链数据——钱包余额、带价值的代币投资组合、交易详情、NFT、巨鲸检测和实时网络统计信息。使用 Solana RPC + CoinGecko。无需 API 密钥。 |

## communication

| Skill | Description |
|-------|-------------|
| [**one-three-one-rule**](/docs/user-guide/skills/optional/communication/communication-one-three-one-rule) | 用于技术提案和权衡分析的结构化决策框架。当用户面临多个方法（架构决策、工具选择、重构策略、迁移路径）的选择时，此技能可以... |

## creative

| Skill | Description |
|-------|-------------|
| [**baoyu-article-illustrator**](/docs/user-guide/skills/optional/creative/creative-baoyu-article-illustrator) | 文章插图：类型 × 风格 × 色板一致性。 |
| [**baoyu-comic**](/docs/user-guide/skills/optional/creative/creative-baoyu-comic) | 知识漫画：教育、传记、教程。 |
| [**blender-mcp**](/docs/user-guide/skills/optional/creative/creative-blender-mcp) | 通过 socket 连接从 Hermes 直接控制 Blender 到 blender-mcp 插件。创建 3D 对象、材质、动画，并运行任意的 Blender Python (bpy) 代码。当用户想要在 Blender 中创建或修改任何内容时使用。 |
| [**concept-diagrams**](/docs/user-guide/skills/optional/creative/creative-concept-diagrams) | 生成扁平化、极简的、感知明暗的 SVG 图表，作为独立的 HTML 文件，使用统一的教育视觉语言，包含 9 种语义色彩渐变、句子式排版和自动深色模式。最适合用于教育和非... |
| [**creative-ideation**](/docs/user-guide/skills/optional/creative/creative-creative-ideation) | 通过命名方法从创意实践中生成想法。 |
| [**hyperframes**](/docs/user-guide/skills/optional/creative/creative-hyperframes) | 使用 HyperFrames 创建基于 HTML 的视频作品、动画片头、社交媒体叠加层、带字幕的说话人视频、音频反应视觉效果和着色器过渡。HTML 是视频的真相来源。当用户想要... 时使用。 |
| [**kanban-video-orchestrator**](/docs/user-guide/skills/optional/creative/creative-kanban-video-orchestrator) | 规划、设置和监控由 Hermes Kanban 支持的多智能体视频制作流程。当用户想要制作任何类型的视频（叙事片、产品/营销、音乐视频、解说片、ASCII/终端艺术、抽象/生成式作品）时使用。 |
| [**meme-generation**](/docs/user-guide/skills/optional/creative/creative-meme-generation) | 通过选择模板并用 Pillow 叠加文本来生成真正的迷因图像。产出实际的 .png 迷因文件。 |
| [**pixel-art**](/docs/user-guide/skills/optional/creative/creative-pixel-art) | 带时代色板（NES, Game Boy, PICO-8）的像素艺术。 |

## devops

| Skill | Description |
|-------|-------------|
| [**inference-sh-cli**](/docs/user-guide/skills/optional/devops/devops-cli) | 通过 inference.sh CLI (infsh) 运行 150+ 个 AI 应用——图像生成、视频创建、LLM、搜索、3D、社交自动化。使用终端工具。触发器：inference.sh, infsh, ai apps, flux, veo, 图像生成, 视频生成, seedrea... |
| [**docker-management**](/docs/user-guide/skills/optional/devops/devops-docker-management) | 管理 Docker 容器、镜像、卷、网络和 Compose 堆栈——生命周期操作、调试、清理和 Dockerfile 优化。 |
| [**hermes-s6-container-supervision**](/docs/user-guide/skills/optional/devops/devops-hermes-s6-container-supervision) | 修改、调试或扩展 Hermes 智能体 Docker 镜像内部的 s6-overlay 超级监督树——添加新服务、调试配置文件网关、理解Architecture B 主程序模式。 |
| [**pinggy-tunnel**](/docs/user-guide/skills/optional/devops/devops-pinggy-tunnel) | 通过 Pinggy 实现零安装的本地主机 SSH 隧道。 |
| [**watchers**](/docs/user-guide/skills/optional/devops/devops-watchers) | 带水印去重（watermark dedup）地轮询 RSS、JSON API 和 GitHub。 |

## dogfood

| Skill | Description |
|-------|-------------|
| [**adversarial-ux-test**](/docs/user-guide/skills/optional/dogfood/dogfood-adversarial-ux-test) | 扮演最难、最抗拒技术的用户来测试您的产品。以该角色浏览应用，找出所有 UX 痛点，然后通过实用主义层过滤投诉，将真正的难题与噪音区分开来。创建可操作的工单... |

## email

| Skill | Description |
|-------|-------------|
| [**agentmail**](/docs/user-guide/skills/optional/email/email-agentmail) | 通过 AgentMail 为智能体提供专属电子邮件收件箱。使用智能体拥有的电子邮件地址（例如 hermes-agent@agentmail.to）自主发送、接收和管理电子邮件。 |

## finance

| Skill | Description |
|-------|-------------|
| [**3-statement-model**](/docs/user-guide/skills/optional/finance/finance-3-statement-model) | 在 Excel 中构建完全集成的三表模型（损益表、资产负债表、现金流量表），包括营运资金计划、折旧摊销滚动计算、债务计划以及使现金和留存收益相匹配的衔接点。与 excel-author 配合使用。 |
| [**comps-analysis**](/docs/user-guide/skills/optional/finance/finance-comps-analysis) | 在 Excel 中构建可比公司分析——运营指标、估值倍数、相对于同行集的统计基准。与 excel-author 配合使用。用于公共公司估值、IPO 定价、行业基准或异常值检测。 |
| [**dcf-model**](/docs/user-guide/skills/optional/finance/finance-dcf-model) | 在 Excel 中构建机构级别的 DCF 估值模型——收入预测、FCF 构建、WACC、终值、熊市/基准/牛市情景、5x5 敏感性表。与 excel-author 配合使用。用于内在价值股权分析。 |
| [**excel-author**](/docs/user-guide/skills/optional/finance/finance-excel-author) | 使用 openpyxl 无头构建可审计的 Excel 工作簿——蓝色/黑色/绿色单元格约定、公式而非硬编码、命名范围、平衡检查、敏感性表。用于财务模型、审计产出、对账。 |
| [**lbo-model**](/docs/user-guide/skills/optional/finance/finance-lbo-model) | 在 Excel 中构建杠杆收购（LBO）模型——资金来源与用途、债务计划、现金流回收、退出倍数、IRR/MOIC 敏感性。与 excel-author 配合使用。用于 PE 初筛、发起人案例估值或路演中的示例 LBO。 |
| [**merger-model**](/docs/user-guide/skills/optional/finance/finance-merger-model) | 在 Excel 中构建收益增加/稀释（并购）模型——合并后的损益表、协同效应、融资结构、EPS 影响。与 excel-author 配合使用。用于 M&A 路演、董事会材料或交易评估。 |
| [**pptx-author**](/docs/user-guide/skills/optional/finance/finance-pptx-author) | 使用 python-pptx 无头构建 PowerPoint 演示文稿。与 excel-author 配合使用，用于每个数字都可追溯到工作簿单元格的模型支持演示文稿。用于路演演示、IC 备忘录、盈利报告。 |
| [**stocks**](/docs/user-guide/skills/optional/finance/finance-stocks) | 通过 Yahoo 获取股票报价、历史记录、搜索、比较、加密货币信息。 |

## gaming

| Skill | Description |
|-------|-------------|
| [**minecraft-modpack-server**](/docs/user-guide/skills/optional/gaming/gaming-minecraft-modpack-server) | 托管模组化 Minecraft 服务器（CurseForge, Modrinth）。 |
| [**pokemon-player**](/docs/user-guide/skills/optional/gaming/gaming-pokemon-player) | 通过无头模拟器 + RAM 读取来玩宝可梦。 |

## health

| Skill | Description |
|-------|-------------|
| [**fitness-nutrition**](/docs/user-guide/skills/optional/health/health-fitness-nutrition) | 健身锻炼计划和营养追踪器。通过 wger 搜索按肌肉、设备或类别的 690+ 个运动。通过 USDA FoodData Central 查询 380,000+ 种食物的宏量营养素和卡路里。计算 BMI、TDEE、单次最大重复次数、宏量分配和身体... |
| [**neuroskill-bci**](/docs/user-guide/skills/optional/health/health-neuroskill-bci) | 连接到正在运行的 NeuroSkill 实例，并将用户的实时认知和情绪状态（专注度、放松程度、心情、认知负荷、困倦、心率、HRV、睡眠分期和 40+ 个衍生 EXG 分数）纳入响应中。 |

## mcp

| Skill | Description |
|-------|-------------|
| [**fastmcp**](/docs/user-guide/skills/optional/mcp/mcp-fastmcp) | 使用 FastMCP 在 Python 中构建、测试、检查、安装和部署 MCP 服务器。当创建新的 MCP 服务器、将 API 或数据库封装为 MCP 工具、暴露资源或提示，或为 Claude Code, Cur... 做准备时使用。 |
| [**mcporter**](/docs/user-guide/skills/optional/mcp/mcp-mcporter) | 使用 mcporter CLI 直接列出、配置、授权和调用 MCP 服务器/工具（HTTP 或 stdio），包括临时服务器、配置编辑和 CLI/类型生成。 |

## migration

| Skill | Description |
|-------|-------------|
| [**openclaw-migration**](/docs/user-guide/skills/optional/migration/migration-openclaw-migration) | 将用户的 OpenClaw 定制化足迹迁移到 Hermes 智能体中。从 ~/.openclaw 导入与 Hermes 兼容的记忆、SOUL.md、命令白名单、用户技能和选定的工作区资产，然后报告哪些内容未能成功迁移... |

## mlops

| Skill | Description |
|-------|-------------|
| [**huggingface-accelerate**](/docs/user-guide/skills/optional/mlops/mlops-accelerate) | 最简单的分布式训练 API。只需 4 行代码即可为任何 PyTorch 脚本添加分布式支持。DeepSpeed/FSDP/Megatron/DDP 的统一 API。自动设备放置，混合精度（FP16/BF16/FP8）。交互式配置，单次启动通信... |
| [**axolotl**](/docs/user-guide/skills/optional/mlops/mlops-training-axolotl) | Axolotl：YAML LLM 微调（LoRA, DPO, GRPO）。 |
| [**chroma**](/docs/user-guide/skills/optional/mlops/mlops-chroma) | 用于 AI 应用的开源嵌入数据库。存储嵌入和元数据，执行向量和全文搜索，按元数据过滤。简单的 4 个功能 API。从笔记本扩展到生产集群。用于语义搜索、RAG... |
| [**clip**](/docs/user-guide/skills/optional/mlops/mlops-clip) | OpenAI 连接视觉和语言的模型。支持零样本图像分类、图像-文本匹配和跨模态检索。在 4 亿张图像-文本对上训练。用于图像搜索、内容审核或视觉-语言任务... |
| [**dspy**](/docs/user-guide/skills/optional/mlops/mlops-research-dspy) | DSPy：声明式 LM 程序，自动优化提示词，RAG。 |
| [**faiss**](/docs/user-guide/skills/optional/mlops/mlops-faiss) | Facebook 用于高效相似性搜索和密集向量聚类的库。支持数十亿个向量、GPU 加速和各种索引类型（Flat, IVF, HNSW）。用于快速 k-NN 搜索、大规模向量检索或... |
| [**optimizing-attention-flash**](/docs/user-guide/skills/optional/mlops/mlops-flash-attention) | 使用 Flash Attention 优化 Transformer 注意力机制，实现 2-4 倍的速度提升和 10-20 倍的内存减少。当训练/运行具有长序列（>512 个 token）的 Transformer、遇到注意力 GPU 内存问题或需要更快的内... 时使用。 |
| [**guidance**](/docs/user-guide/skills/optional/mlops/mlops-guidance) | 使用正则表达式和语法控制 LLM 输出，保证有效的 JSON/XML/代码生成，强制执行结构化格式，并使用 Microsoft Research 的约束生成框架 Guidance 构建多步工作流程。 |
| [**huggingface-tokenizers**](/docs/user-guide/skills/optional/mlops/mlops-huggingface-tokenizers) | 针对研究和生产优化的快速分词器。基于 Rust 实现，可在 &lt;20 秒内分词 1GB 数据。支持 BPE、WordPiece 和 Unigram 算法。训练自定义词汇表，跟踪对齐信息，处理填充/截断。集成... |
| [**instructor**](/docs/user-guide/skills/optional/mlops/mlops-instructor) | 使用 Pydantic 验证从 LLM 响应中提取结构化数据，自动重试失败的提取，使用类型安全解析复杂的 JSON，并使用 Instructor（经过实战检验的结构化输出库）流式传输部分结果。 |
| [**lambda-labs-gpu-cloud**](/docs/user-guide/skills/optional/mlops/mlops-lambda-labs) | 用于 ML 训练和推理的预留和按需 GPU 云实例。当需要具有简单 SSH 访问、持久化文件系统或用于大规模训练的高性能多节点集群的专用 GPU 实例时使用。 |
| [**llava**](/docs/user-guide/skills/optional/mlops/mlops-llava) | 大语言和视觉助手。支持视觉指令微调和基于图像的对话。结合 CLIP 视觉编码器与 Vicuna/LLaMA 语言模型。支持多轮图像聊天、视觉问答和指令... |
| [**modal-serverless-gpu**](/docs/user-guide/skills/optional/mlops/mlops-modal) | 用于运行 ML 工作负载的无服务器 GPU 云平台。当需要按需 GPU 访问而无需基础设施管理、将 ML 模型部署为 API 或进行自动扩展批处理作业时使用。 |
| [**nemo-curator**](/docs/user-guide/skills/optional/mlops/mlops-nemo-curator) | 用于 LLM 训练的 GPU 加速数据策展（data curation）。支持文本/图像/视频/音频。功能包括模糊去重（快 16 倍）、质量过滤（30+ 个启发式规则）、语义去重、PII 脱敏和 NSFW 检测。可在多个 GPU 上扩展... |
| [**obliteratus**](/docs/user-guide/skills/optional/mlops/mlops-obliteratus) | OBLITERATUS：消除 LLM 的拒绝（diff-in-means）。 |
| [**outlines**](/docs/user-guide/skills/optional/mlops/mlops-inference-outlines) | Outlines：结构化的 JSON/正则表达式/Pydantic LLM 生成。 |
| [**peft-fine-tuning**](/docs/user-guide/skills/optional/mlops/mlops-peft) | 使用 LoRA、QLoRA 和 25+ 种方法进行参数高效微调（PEFT）。当使用有限的 GPU 内存对大型模型（7B-70B）进行微调，需要以最小的精度损失训练 &lt;1% 的参数，或进行多适配器选择时使用。 |
| [**pinecone**](/docs/user-guide/skills/optional/mlops/mlops-pinecone) | 用于生产 AI 应用的托管向量数据库。完全托管、自动扩展，具有混合搜索（密集+稀疏）、元数据过滤和命名空间。低延迟（p95 &lt;100ms）。用于生产 RAG、推荐系统或... |
| [**pytorch-fsdp**](/docs/user-guide/skills/optional/mlops/mlops-pytorch-fsdp) | PyTorch FSDP 的专家指导——参数分片、混合精度、CPU 卸载、FSDP2。 |
| [**pytorch-lightning**](/docs/user-guide/skills/optional/mlops/mlops-pytorch-lightning) | 高级 PyTorch 框架，包含 Trainer 类、自动分布式训练（DDP/FSDP/DeepSpeed）、回调系统和最小的样板代码。从笔记本电脑扩展到超级计算机，使用相同的代码。当需要干净的训练循环时使用。 |
| [**qdrant-vector-search**](/docs/user-guide/skills/optional/mlops/mlops-qdrant) | 用于 RAG 和语义搜索的高性能向量相似性搜索引擎。当构建需要快速最近邻搜索、带过滤的混合搜索或具有 Rust 驱动的每节点可扩展向量存储的生产 RAG 系统时使用。 |
| [**sparse-autoencoder-training**](/docs/user-guide/skills/optional/mlops/mlops-saelens) | 提供使用 SAELens 对稀疏自编码器（SAEs）进行训练和分析的指导，将神经网络激活分解为可解释的特征。当发现可解释特征、分析叠加或研究... 时使用。 |
| [**simpo-training**](/docs/user-guide/skills/optional/mlops/mlops-simpo) | LLM 对齐的简单偏好优化（SimPO）。比 DPO 更具参考性，性能更好（AlpacaEval 2.0 上提升 +6.4 分）。不需要参考模型，比 DPO 更高效。用于需要简化对齐时使用。 |
| [**slime-rl-training**](/docs/user-guide/skills/optional/mlops/mlops-slime) | 提供使用 slime（Megatron+SGLang 框架）进行 LLM 后训练的 RL 指导。当训练 GLM 模型、实现自定义数据生成工作流程或需要紧密的 Megatron-LM 集成以实现 RL 扩展时使用。 |
| [**stable-diffusion-image-generation**](/docs/user-guide/skills/optional/mlops/mlops-stable-diffusion) | 使用 HuggingFace Diffusers 的最先进的文本到图像生成，基于 Stable Diffusion 模型。当从文本提示词生成图像、执行图像到图像的翻译、修复或构建自定义扩散流程时使用。 |
| [**tensorrt-llm**](/docs/user-guide/skills/optional/mlops/mlops-tensorrt-llm) | 使用 NVIDIA TensorRT 优化 LLM 推理，以实现最大吞吐量和最低延迟。用于在 NVIDIA GPU (A100/H100) 上进行生产部署，当需要比 PyTorch 快 10-100 倍的推理速度或进行模型量化服务时使用。 |
| [**distributed-llm-pretraining-torchtitan**](/docs/user-guide/skills/optional/mlops/mlops-torchtitan) | 使用 torchtitan 提供 PyTorch 原生的分布式 LLM 预训练，采用 4D 并行化（FSDP2, TP, PP, CP）。当从 8 到 512+ 个 GPU 在大规模上预训练 Llama 3.1、DeepSeek V3 或自定义模型时使用，并结合 Float8、torch.compile 和 dist...。 |
| [**fine-tuning-with-trl**](/docs/user-guide/skills/optional/mlops/mlops-training-trl-fine-tuning) | TRL：用于 LLM RLHF 的 SFT、DPO、PPO、GRPO，奖励建模。 |
| [**unsloth**](/docs/user-guide/skills/optional/mlops/mlops-training-unsloth) | Unsloth：2-5 倍更快的 LoRA/QLoRA 微调，更低的 VRAM 占用。 |
| [**whisper**](/docs/user-guide/skills/optional/mlops/mlops-whisper) | OpenAI 的通用语音识别模型。支持 99 种语言、转录、翻译成英语和语言识别。从 tiny (39M 参数) 到 large (1550M 参数) 的六种模型尺寸。用于语音到文本、播客...。 |

## payments

| Skill | Description |
|-------|-------------|
| [**mpp-agent**](/docs/user-guide/skills/optional/payments/payments-mpp-agent) | 通过机器支付协议（MPP）支付HTTP 402 API。 |
| [**stripe-link-cli**](/docs/user-guide/skills/optional/payments/payments-stripe-link-cli) | 通过Stripe Link进行智能体支付——包括卡片、SPT和审批。 |
| [**stripe-projects**](/docs/user-guide/skills/optional/payments/payments-stripe-projects) | 通过Stripe Projects配置SaaS服务并同步凭证。 |

## productivity

| Skill | Description |
|-------|-------------|
| [**canvas**](/docs/user-guide/skills/optional/productivity/productivity-canvas) | Canvas LMS集成——使用API令牌身份验证来获取已注册课程和作业。 |
| [**here.now**](/docs/user-guide/skills/optional/productivity/productivity-here-now) | 将静态站点发布到&#123;slug&#125;.here.now，并将私有文件存储在云驱动器中，用于智能体间交接。 |
| [**memento-flashcards**](/docs/user-guide/skills/optional/productivity/productivity-memento-flashcards) | 间隔重复闪卡系统。从事实或文本创建卡片，使用自由文本答案与闪卡片聊天，这些答案由智能体进行评分，从YouTube字幕生成测验，使用自适应调度查看到期的卡片，并导出/导入... |
| [**shop**](/docs/user-guide/skills/optional/productivity/productivity-shop) | 商店目录搜索、结账、订单跟踪、退货。 |
| [**shopify**](/docs/user-guide/skills/optional/productivity/productivity-shopify) | 通过curl访问Shopify Admin和Storefront GraphQL API。包括产品、订单、客户、库存、元字段。 |
| [**siyuan**](/docs/user-guide/skills/optional/productivity/productivity-siyuan) | SiYuan Note API，用于通过curl在自托管知识库中搜索、读取、创建和管理块和文档。 |
| [**telephony**](/docs/user-guide/skills/optional/productivity/productivity-telephony) | 在不更改核心工具的情况下赋予Hermes电话功能。配置和持久化一个Twilio号码，发送和接收SMS/MMS，拨打直接电话，并通过Bland.ai或Vapi进行AI驱动的呼出电话。 |

## research

| Skill | Description |
|-------|-------------|
| [**bioinformatics**](/docs/user-guide/skills/optional/research/research-bioinformatics) | 来自bioSkills和ClawBio的400多个生物信息学技能的网关。涵盖基因组学、转录组学、单细胞、变异调用、药物基因组学、宏基因组学、结构生物学等。用于获取特定领域的参考资料... |
| [**darwinian-evolver**](/docs/user-guide/skills/optional/research/research-darwinian-evolver) | 使用Imbue的进化循环来演化提示词/正则表达式/SQL/代码。 |
| [**domain-intel**](/docs/user-guide/skills/optional/research/research-domain-intel) | 使用Python标准库进行被动域名侦察。子域名发现、SSL证书检查、WHOIS查询、DNS记录、域名可用性检查和批量多域名分析。无需API密钥。 |
| [**drug-discovery**](/docs/user-guide/skills/optional/research/research-drug-discovery) | 药物发现工作流程的制药研究助手。在ChEMBL上搜索生物活性化合物，计算药物特性（Lipinski Ro5, QED, TPSA, 合成可及性），通过OpenFDA查询药物相互作用，解释ADMET... |
| [**duckduckgo-search**](/docs/user-guide/skills/optional/research/research-duckduckgo-search) | 通过DuckDuckGo进行免费网络搜索——文本、新闻、图像、视频。无需API密钥。如果已安装`ddgs` CLI，则优先使用它；仅在验证当前运行时可用`ddgs`后才使用Python DDGS库。 |
| [**gitnexus-explorer**](/docs/user-guide/skills/optional/research/research-gitnexus-explorer) | 使用GitNexus索引代码库，并通过Web UI + Cloudflare隧道提供交互式知识图谱。 |
| [**osint-investigation**](/docs/user-guide/skills/optional/research/research-osint-investigation) | 公开记录OSINT调查框架——SEC EDGAR备案、USAspending合同、参议院游说、OFAC制裁、ICIJ离岸泄密、NYC房产记录（ACRIS）、OpenCorporates注册表、CourtListener法院记录、Wayback... |
| [**parallel-cli**](/docs/user-guide/skills/optional/research/research-parallel-cli) | Parallel CLI的可选供应商技能——包括智能体原生的网络搜索、提取、深度研究、丰富化、FindAll和监控。优先使用JSON输出和非交互式流程。 |
| [**qmd**](/docs/user-guide/skills/optional/research/research-qmd) | 使用qmd在本地搜索个人知识库、笔记、文档和会议记录——它是一个具有BM25、向量搜索和LLM重排的混合检索引擎。支持CLI和MCP集成。 |
| [**scrapling**](/docs/user-guide/skills/optional/research/research-scrapling) | 使用Scrapling进行网络抓取——HTTP获取、隐身浏览器自动化、Cloudflare绕过以及通过CLI和Python的蜘蛛爬行。 |
| [**searxng-search**](/docs/user-guide/skills/optional/research/research-searxng-search) | 通过SearXNG进行免费元搜索——聚合来自70多个搜索引擎的结果。可自托管或使用公共实例。无需API密钥。当网络搜索工具集不可用时会自动回退。 |

## security

| Skill | Description |
|-------|-------------|
| [**1password**](/docs/user-guide/skills/optional/security/security-1password) | 设置和使用1Password CLI (op)。在安装CLI、启用桌面应用集成、登录以及为命令读取/注入密钥时使用。 |
| [**godmode**](/docs/user-guide/skills/optional/security/security-godmode) | LLM的越狱：Parseltongue, GODMODE, ULTRAPLINIAN。 |
| [**oss-forensics**](/docs/user-guide/skills/optional/security/security-oss-forensics) | GitHub代码库的供应链调查、证据恢复和取证分析。涵盖已删除提交的恢复、强制推送检测、IOC提取、多源证据收集、假设形成/验证和... |
| [**sherlock**](/docs/user-guide/skills/optional/security/security-sherlock) | 跨400多个社交网络进行OSINT用户名搜索。通过用户名查找社交媒体账户。 |
| [**web-pentest**](/docs/user-guide/skills/optional/security/security-web-pentest) | 合法的Web应用程序渗透测试——包括侦察、漏洞分析、基于证明的利用和专业报告。它将Shannon的“无漏洞，则无报告”方法与严格的范围授权护栏相结合。 |

## software-development

| Skill | Description |
|-------|-------------|
| [**code-wiki**](/docs/user-guide/skills/optional/software-development/software-development-code-wiki) | 为任何代码库生成Wiki文档和Mermaid图表。 |
| [**rest-graphql-debug**](/docs/user-guide/skills/optional/software-development/software-development-rest-graphql-debug) | 调试REST/GraphQL API：状态码、认证、模式、重现步骤。 |
| [**subagent-driven-development**](/docs/user-guide/skills/optional/software-development/software-development-subagent-driven-development) | 通过delegate_task子智能体执行计划（两阶段审核）。 |

## web-development

| Skill | Description |
|-------|-------------|
| [**page-agent**](/docs/user-guide/skills/optional/web-development/web-development-page-agent) | 将alibaba/page-agent嵌入到您自己的Web应用程序中——这是一个纯JavaScript的页面内GUI智能体，以单个&lt;script>标签或npm包的形式发布，允许您的网站最终用户使用自然语言（“点击登录，填写用户名...”）来驱动UI。 |

---

## Contributing Optional Skills

要向仓库添加一个新的可选技能：

1. 在 `optional-skills/<category>/<skill-name>/` 下创建一个目录
2. 添加一个带有标准前置信息（名称、描述、版本、作者）的`SKILL.md`文件
3. 将任何支持文件包含在 `references/`、`templates/` 或 `scripts/` 子目录中
4. 提交拉取请求——一旦合并，该技能就会出现在此目录中并拥有自己的文档页面。