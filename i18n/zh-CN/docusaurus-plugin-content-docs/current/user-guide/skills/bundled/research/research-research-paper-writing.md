---
title: "研究论文撰写 — 针对NeurIPS/ICML/ICLR的机器学习论文撰写：从设计到提交"
sidebar_label: "研究论文撰写"
description: "针对NeurIPS/ICML/ICLR的机器学习论文撰写：从设计到提交"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 研究论文撰写

针对NeurIPS/ICML/ICLR的机器学习论文撰写：从设计到提交。

## 技能元数据 (Skill metadata)

| | |
|---|---|
| Source | Bundled (安装默认提供) |
| Path | `skills/research/research-paper-writing` |
| Version | `1.1.0` |
| Author | Orchestra Research |
| License | MIT |
| Dependencies | `semanticscholar`, `arxiv`, `habanero`, `requests`, `scipy`, `numpy`, `matplotlib`, `SciencePlots` |
| Platforms | linux, macos |
| Tags | `研究`, `论文撰写`, `实验`, `ML`, `AI`, `NeurIPS`, `ICML`, `ICLR`, `ACL`, `AAAI`, `COLM`, `LaTeX`, `引用`, `统计分析` |
| Related skills | [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv), `ml-paper-writing`, [`subagent-driven-development`](/docs/user-guide/skills/optional/software-development/software-development-subagent-driven-development), [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan) |

## 关键路径与配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥和秘密信息（如果设置了$HERMES_HOME）
$HERMES_HOME
```

# 研究论文撰写流程

端到端的、用于产出面向**NeurIPS, ICML, ICLR, ACL, AAAI, 和 COLM**的出版级机器学习/AI研究论文的管道。此技能涵盖完整的科研生命周期：实验设计、执行、监控、分析、论文撰写、审阅、修改和提交。

这**不是一个线性流程**——它是一个迭代循环。结果会触发新的实验。审稿意见会触发新的分析。智能体必须处理这些反馈循环。

<!-- ascii-guard-ignore -->
<!-- ascii-guard-ignore -->
```
┌─────────────────────────────────────────────────────────────┐
│                    研究论文管道 (RESEARCH PAPER PIPELINE)                  │
│                                                             │
│  阶段 0: 项目设置 ──► 阶段 1: 文献综述      │
│       │                          │                          │
│       ▼                          ▼                          │
│  阶段 2: 实验设计                     阶段 5: 论文起草 ◄──┐      │
│       │                   │                   │      │
│       ▼                   │                   │      │
│  阶段 3: 执行与监控           & 修改 ──────────┘      │
│       │                   │                          │
│       ▼                   ▼                          │
│  阶段 4: 分析 ─────► (反馈至阶段 2 或 5)     │
│                                                             │
│  阶段 6: 自我审阅               阶段 7: 提交               │
└─────────────────────────────────────────────────────────────┘
```
<!-- ascii-guard-ignore-end -->
<!-- ascii-guard-ignore-end -->

---

## 何时使用此技能

当出现以下情况时，请使用此技能：
- **从现有代码库或想法开始撰写新研究论文**
- **设计和运行实验**以支持论文中的主张
- **撰写或修改**研究论文的任何部分
- **为特定的会议或研讨会做提交准备**
- **回应审稿意见**，进行额外的实验或修改
- **将论文从一种会议格式转换为另一种**
- **撰写非实证性论文**——理论、综述、基准测试或立场声明（参见[超越实证机器学习的论文类型](#paper-types-beyond-empirical-ml)）
- **设计NLP、HCI或对齐研究的人工评估**
- **准备接受后的交付物**——海报、演讲、代码发布

## 核心理念

1. **保持积极主动。** 提供完整的草稿，而不是提出问题。科学家们非常忙碌——请产出一些具体的成果供他们反应和迭代。
2. **绝不捏造引用。** AI生成的引用错误率约为40%。务必通过程序获取。将无法核实的引用标记为`[CITATION NEEDED]`（需要引用）。
3. **论文是一个故事，而不是一系列实验的集合。** 每篇论文都需要一个清晰的贡献点，用一句话概括。如果做不到这一点，这篇论文就还不能定稿。
4. **实验是为了支持主张。** 每个实验都必须明确指出它支持哪个主张。绝不要运行与论文叙事不相关的实验。
5. **尽早提交代码，频繁提交更新。** 每一个完成的实验批次、每一次论文草稿的更新——都应附带描述性的消息进行提交。Git日志即是实验历史记录。

### 积极主动性与协作

**默认设置：保持积极主动。先起草，再带着草稿提问。**

| 置信度 | 操作 |
|:---|:---|
| **高** (代码库清晰、贡献显而易见) | 完成全文草稿，交付，根据反馈迭代 |
| **中等** (存在一定模糊性) | 撰写带有标记不确定性的草稿，继续进行 |
| **低** (重大未知点) | 通过`clarify`提出1-2个有针对性的问题，然后起草 |

| 部分 | 是否自主起草？ | 在草稿中标记的内容 |
|:---|:---|:---|
| 摘要 (Abstract) | 是 | “将贡献定性为X——如有需要则调整” |
| 引言 (Introduction) | 是 | “强调了问题Y——如果错误请更正” |
| 方法 (Methods) | 是 | “包含了A、B、C细节——添加缺失的部分” |
| 实验 (Experiments) | 是 | “突出了结果1、2、3——如有需要则重新排序” |
| 相关工作 (Related Work) | 是 | “引用了X, Y, Z论文——请补充我遗漏的任何内容” |

**仅在以下情况下才阻塞输入：** 目标会议不明确、存在多个相互矛盾的框架、结果似乎不完整、有明确要求先进行审阅。

---

## 阶段 0: 项目设置

**目标**：建立工作空间，了解现有工作，确定贡献点。

### 步骤 0.1: 探索代码库

```bash
# 理解项目结构
ls -la
find . -name "*.py" | head -30
find . -name "*.md" -o -name "*.txt" | xargs grep -l -i "result\|conclusion\|finding"
```

查找以下内容：
- `README.md` — 项目概述和主张
- `results/`, `outputs/`, `experiments/` — 现有发现
- `configs/` — 实验设置
- `.bib` 文件 — 现有引用
- 草稿文件或笔记

### 步骤 0.2: 组织工作空间

建立一致的工作空间结构：

```
workspace/
  paper/               # LaTeX源文件、图表、编译后的PDF
  experiments/         # 实验运行脚本
  code/                # 核心方法实现
  results/             # 原始实验结果（自动生成）
  tasks/               # 任务/基准定义
  human_eval/          # 人工评估材料（如果需要）
```

### 步骤 0.3: 设置版本控制

```bash
git init  # 如果尚未初始化
git remote add origin <repo-url>
git checkout -b paper-draft  # 或 main
```

**Git纪律**: 每个完成的实验批次都必须附带描述性的消息进行提交。示例：
```
添加蒙特卡洛受限结果（5次运行，Sonnet 4.6，政策备忘录任务）
添加Haiku基线对比：廉价模型层级的自动推理与精炼基线
```

### 步骤 0.4: 确定贡献点

在撰写任何内容之前，请阐明：
- **What (是什么)**：这篇论文提供的唯一一点是什么？
- **Why (为什么)**：哪些证据支持这一点？
- **So What (那又如何)**：读者为什么要关心这件事？

> 向科学家提出建议：“根据我的理解，主要贡献是：[一句话]。关键结果显示 [Y]。这是您想要的框架吗？”

### 步骤 0.5: 创建待办事项列表 (TODO List)

使用`todo`工具创建一个结构化的项目计划：

```
研究论文待办事项:
- [ ] 定义单句贡献点
- [ ] 文献综述（相关工作 + 基线）
- [ ] 设计核心实验
- [ ] 运行实验
- [ ] 分析结果
- [ ] 撰写初稿
- [ ] 自我审阅（模拟审稿人）
- [ ] 根据审稿意见修改
- [ ] 提交准备
```

在整个项目过程中持续更新此列表。它充当着跨会话的持久化状态。

### 步骤 0.6: 估算计算预算

在运行实验之前，估算总成本和时间：

```
计算预算检查清单:
- [ ] API成本：（模型价格/token）×（每次运行估计token数）×（运行次数）
- [ ] GPU小时数：（单次实验耗时）×（实验次数）×（随机种子数量）
- [ ] 人工评估成本：（标注员人数）×（小时数）×（时薪）
- [ ] 总预算上限和应急预备金（增加30-50%用于重跑）
```

随着实验运行，跟踪实际支出：
```python
# 简单的成本追踪模式
import json, os
from datetime import datetime

COST_LOG = "results/cost_log.jsonl"

def log_cost(experiment: str, model: str, input_tokens: int, output_tokens: int, cost_usd: float):
    entry = {
        "timestamp": datetime.now().isoformat(),
        "experiment": experiment,
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_usd": cost_usd,
    }
    with open(COST_LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")
```

**预算紧张时**: 在承诺进行完整的搜索之前，先运行试点实验（1-2个随机种子，任务子集）。使用更便宜的模型来调试管道，然后切换到目标模型进行最终运行。

### 步骤 0.7: 多作者协调

大多数论文有3到10位作者。尽早建立工作流程：

| 工作流 | 工具 | 何时使用 |
|:---|:---|:---|
| **Overleaf** | 基于浏览器的 | 多个作者同时编辑，没有Git经验 |
| **Git + LaTeX** | `git` 和用于辅助文件的`.gitignore` | 技术团队，需要基于分支的审阅 |
| **Overleaf + Git同步** | Overleaf高级版 | 两者优势结合——带有版本历史记录的实时协作 |

**部分所有权**: 将每个部分分配给一位主要作者。其他作者进行评论但无需直接编辑。这可以防止合并冲突和风格不一致。

```
作者协调检查清单:
- [ ] 同意部分的所有权（谁写什么）
- [ ] 设置共享工作空间（Overleaf或Git仓库）
- [ ] 建立符号约定（在任何人开始写作之前）
- [ ] 安排内部审阅轮次（而不仅仅是最后一次）
- [ ] 指定一个人负责最终格式化检查
- [ ] 在创建图表之前同意图表风格（颜色、字体、大小）
```

**尽早需要商定的LaTeX约定**:
- 用于一致方法命名的`\method{}`宏
- 引用样式：`\citet{}`与`\citep{}`的使用
- 数学符号：向量用小写粗体，矩阵用大写粗体等
- 英式拼写 vs 美式拼写

---

## 阶段 1: 文献综述

**目标**：查找相关工作、确定基线、收集引用。

### 步骤 1.1: 识别种子论文

从代码库中已引用的论文开始：

```bash
# 通过终端执行：
grep -r "arxiv\|doi\|cite" --include="*.md" --include="*.bib" --include="*.py"
find . -name "*.bib"
```

### 步骤 1.2: 搜索相关工作

**加载`arxiv`技能**以进行结构化的论文发现：`skill_view("arxiv")`。它提供arXiv REST API搜索、Semantic Scholar引用图谱、作者简介和BibTeX生成。

使用`web_search`进行广泛探索，使用`web_extract`来获取特定论文：

```
# 通过web_search:
web_search("[主要技术] + [应用领域] site:arxiv.org")
web_search("[基线方法] 比较 ICML NeurIPS 2024")

# 通过web_extract (针对特定论文):
web_extract("https://arxiv.org/abs/2303.17651")
```

尝试的其他搜索查询：

```
搜索查询:
- "[主要技术] + [应用领域]"
- "[基线方法] 比较"
- "[问题名称] 最先进水平 (state-of-the-art)"
- 现有引用中的作者姓名
```

**推荐**: 安装**Exa MCP**以进行实时学术搜索：
```bash
claude mcp add exa -- npx -y mcp-remote "https://mcp.exa.ai/mcp"
```

### 步骤 1.2b: 加深搜索（广度优先，然后深度）

一次性的扁平搜索通常会遗漏重要的相关工作。使用受深入研究管道启发的迭代**广度-深度**模式：

```
迭代文献搜索:

第一轮 (广度): 4-6个并行查询，涵盖不同的角度
  - "[方法] + [领域]"
  - "[问题名称] 最先进水平 2024 2025"
  - "[基线方法] 比较"
  - "[替代方法] vs [您的方法]"
  → 收集论文，提取关键概念和术语

第二轮 (深度): 从第一轮的学习中生成后续查询
  - 第一轮论文中发现的新术语
  - 被最相关的第一轮结果引用的论文
  - 需要调查的矛盾发现
  → 收集论文，确定剩余的空白点

第三轮 (定向): 填补特定的空白点
  - 第一、二轮次中识别出的缺失基线
  - 同步工作（最近6个月，同一问题）
  - 关键的负面结果或失败的方法
  → 当新查询返回的论文大多是你已有的时停止
```

**何时停止**: 如果一轮搜索返回的论文超过80%在你现有的集合中，则表示搜索已饱和。通常2-3轮就足够了。对于综述性论文，预计需要4-5轮。

**对于基于智能体的流程**: 通过`delegate_task`并行委托每一轮次的查询。收集结果，去重叠，然后从组合的学习中生成下一轮的查询。

### 步骤 1.3: 验证每一个引用

**绝不能从记忆中生成BibTeX。必须通过程序获取。**

对于每个引用，请遵循强制性的5步流程：

```
引用验证（针对每个引用的强制步骤）:
1. 搜索 (SEARCH) → 使用特定的关键词查询Semantic Scholar或Exa MCP
2. 验证 (VERIFY) → 在2个以上的来源中确认论文存在（Semantic Scholar + arXiv/CrossRef）
3. 获取 (RETRIEVE) → 通过DOI内容协商获取BibTeX（通过程序，而非从记忆中）
4. 验证 (VALIDATE) → 确认你引用的主张确实出现在该论文中
5. 添加 (ADD) → 将已验证的BibTeX添加到参考文献列表
如果任何一步失败 → 标记为[CITATION NEEDED]，通知科学家
```

```python
# 通过DOI获取BibTeX
import requests

def doi_to_bibtex(doi: str) -> str:
    response = requests.get(
        f"https://doi.org/{doi}",
        headers={"Accept": "application/x-bibtex"}
    )
    response.raise_for_status()
    return response.text
```

如果你无法验证一个引用：

```latex
\cite{PLACEHOLDER_author2024_verify_this}  % TODO: 验证此引用是否存在
```

**务必告知科学家**: “我已经将[X]个引用标记为需要验证的占位符。”

请参阅[references/citation-workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/citation-workflow.md)以获取完整的API文档和`CitationManager`类。

### 步骤 1.4: 组织相关工作

按**方法论**而非按论文来分组：

**好的做法**: “某一条工作使用了X的假设[refs]，而我们使用Y的假设，因为……”
**不好的做法**: “Smith等人介绍了X。Jones等人介绍了Y。我们将两者结合起来。”

## 第二阶段：实验设计

**目标**: 设计直接支持论文论点的实验。每个实验都必须回答一个特定的问题。

### 步骤 2.1：将论点映射到实验

创建显式的映射关系：

| 论点 | 实验 | 预期证据 |
|-------|-----------|-------------------|
| “我们的方法优于基线” | 主要对比（表 1） | 胜率、统计显著性 |
| “对于较弱的模型，效果更显著” | 模型缩放研究 | 单调改进曲线 |
| “收敛需要范围约束” | 有约束 vs 无约束 | 收敛速度比较 |

**规则**: 如果一个实验与论点不匹配，则不要运行它。

### 步骤 2.2：设计基线

强大的基线是区分被接受论文和被拒绝论文的关键。审稿人会问：“他们是否对比了 X？”

标准基线类别：
- **朴素基线 (Naive baseline)**：最简单的可能方法
- **强基线 (Strong baseline)**：已知最好的现有方法
- **消融基线 (Ablation baselines)**：你的方法减去一个组件
- **计算匹配基线 (Compute-matched baselines)**：相同的计算预算，不同的分配

### 步骤 2.3：定义评估协议

在运行任何实验之前，请明确指定：
- **指标 (Metrics)**：你正在衡量什么，方向符号（越高/越低越好）
- **聚合 (Aggregation)**：如何将跨多次运行/任务的结果进行组合
- **统计测试 (Statistical tests)**：哪些测试将确定显著性
- **样本量 (Sample sizes)**：多少次运行/问题/任务

### 步骤 2.4：编写实验脚本

遵循成功的研究流程中的这些模式：

**增量保存 (Incremental saving)** — 在每一步骤后保存结果以进行崩溃恢复：
```python
# Save after each problem/task
result_path = f"results/{task}/{strategy}/result.json"
if os.path.exists(result_path):
    continue  # Skip already-completed work
# ... run experiment ...
with open(result_path, 'w') as f:
    json.dump(result, f, indent=2)
```

**工件保存 (Artifact preservation)** — 保存所有中间输出：
```
results/<experiment>/
  <task>/
    <strategy>/
      final_output.md          # 最终结果
      history.json             # 完整轨迹
      pass_01/                 # 每迭代的工件
        version_a.md
        version_b.md
        critic.md
```

**关注点分离 (Separation of concerns)** — 将生成、评估和可视化分开：
```
run_experiment.py              # 核心实验运行器
run_baselines.py               # 基线对比
run_comparison_judge.py        # 盲评判
analyze_results.py             # 统计分析
make_charts.py                 # 可视化
```

请参阅 [references/experiment-patterns.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md) 以获取完整的设计模式、时钟监控和错误恢复。

### 步骤 2.5：设计人工评估（如果适用）

许多 NLP、HCI 和对齐论文要求进行人工评估，作为主要或补充证据。在运行自动化实验之前设计好这一点——人工评估通常需要更长的准备时间（IRB 批准、标注员招募）。

**何时需要人工评估:**
- 自动化指标无法捕捉你关心的内容（流畅性、有用性、安全性）
- 你的贡献涉及面向人类的质量（可读性、偏好度、信任度）
- NLP 领域的审稿人（ACL, EMNLP）要求对生成任务进行人工评估

**关键设计决策:**

| 决策 | 选项 | 指导建议 |
|----------|---------|----------|
| **标注员类型** | 专家、众包工人、最终用户 | 需与你的论点相匹配 |
| **量表 (Scale)** | 李克特量表（1-5）、成对比较、排名 | 对于 LLM 输出，成对比较比李克特量表更可靠 |
| **样本量** | 每个标注员和总项目数 | 进行功效分析或至少 100 个项目、3 个以上的标注员 |
| **一致性指标** | Cohen's kappa, Krippendorff's alpha, ICC | 对于 >2 个标注员使用 Krippendorff's alpha；也应报告原始一致度 |
| **平台** | Prolific, MTurk, 内部团队 | Prolific 用于质量；MTurk 用于规模；内部用于领域专业知识 |

**注释指南清单:**
```
- [ ] 清晰的任务描述，附带示例（好的和坏的）
- [ ] 模糊情况下的决策标准
- [ ] 每个类别至少 2 个已完成的示例
- [ ] 注意力检查/黄金标准项目（总数的 10-15%）
- [ ] 资格测试或筛选轮次
- [ ] 每项任务的预估时间以及公平报酬（>=当地最低工资）
- [ ] 如果机构要求，进行 IRB/伦理审查
```

**报告要求**（审稿人会检查所有这些）：
- 标注员的数量及其资质
- 特定指标和数值的人间一致性
- 报酬详情（金额、预估时薪）
- 注释界面的描述或截图（附录）
- 总注释时间

请参阅 [references/human-evaluation.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md) 以获取完整的指南，包括人工评估数据的统计测试、众包采购质量控制模式和 IRB 指导。

## Phase 3: 实验执行与监控

**目标**: 稳定地运行实验，监控进度，从故障中恢复。

### Step 3.1: 启动实验

使用 `nohup` 来运行长时间的实验：

```bash
nohup python run_experiment.py --config config.yaml > logs/experiment_01.log 2>&1 &
echo $!  # 记录 PID
```

**并行执行**: 同时运行独立的实验，但要注意 API 的速率限制。在同一个 API 上进行 4 个以上的并发实验会减慢每个实验的速度。

### Step 3.2: 设置监控（Cron 模式）

对于长时间运行的实验，设置定期的状态检查。cron 提示符应遵循此模板：

```
Monitor Prompt Template (监控提示模板):
1. 检查进程是否仍在运行: ps aux | grep <pattern>
2. 读取日志的最后 30 行: tail -30 <logfile>
3. 检查是否有已完成的结果: ls <result_dir>
4. 如果存在结果，则读取并报告: cat <result_file>
5. 如果一切完成，则提交: git add -A && git commit -m "<descriptive message>" && git push
6. 以结构化格式报告（包含关键指标的表格）
7. 回答本实验的关键分析问题
```

**静默模式**: 如果自上次检查以来没有任何变化，请回复 `[SILENT]` 以抑制对用户的通知。只有当有新消息时才进行报告。

### Step 3.3: 处理故障

常见的故障模式和恢复方法：

| 故障 | 检测方式 | 恢复方法 |
|---------|-----------|----------|
| API 速率限制 / 信用额度耗尽 | 日志中的 402/429 错误 | 等待，然后重新运行（脚本会跳过已完成的工作） |
| 进程崩溃 | PID 不存在，结果不完整 | 从上一个检查点重新运行 |
| 硬性问题超时 | 进程卡住，日志没有进展 | 杀死并跳过，在结果中记录下来 |
| 模型 ID 错误 | 引用模型名称的错误 | 修复 ID 并重新运行 |

**要点**: 脚本应该始终检查是否存在现有结果并跳过已完成的工作。这使得重新运行既安全又高效。

### Step 3.4: 提交已完成的结果

每个实验批次完成后：

```bash
git add -A
git commit -m "添加 <实验名称>: <一句话的关键发现>"
git push
```

### Step 3.5: 维护实验日志

Git 提交记录了发生了什么，但没有记录**探索树**——即基于所学到的内容决定下一步尝试什么的。请维护一个捕获此探索树的结构化实验日志：

```json
// experiment_journal.jsonl — 每个实验尝试追加一条记录
{
  "id": "exp_003",
  "parent": "exp_001",
  "timestamp": "2025-05-10T14:30:00Z",
  "hypothesis": "添加范围约束将解决 exp_001 中的收敛失败问题",
  "plan": "使用 max_tokens=2000 和固定的结构模板重新运行 autoreason",
  "config": {"model": "haiku", "strategy": "autoreason", "max_tokens": 2000},
  "status": "completed",
  "result_path": "results/exp_003/",
  "key_metrics": {"win_rate": 0.85, "convergence_rounds": 3},
  "analysis": "范围约束解决了收敛问题。胜率从 0.42 提高到 0.85。",
  "next_steps": ["在 Sonnet 上尝试相同的约束", "测试不带结构模板"],
  "figures": ["figures/exp003_convergence.pdf"]
}
```

**为什么需要日志，而不仅仅是 Git？** Git 跟踪文件更改。日志则跟踪推理过程：你为什么尝试 X，你学到了什么，这对于下一个实验意味着什么。在撰写论文时，这棵树对于方法论部分（“我们观察到 X，这促使了 Y”）和诚实的失败报告至关重要。

**选择最佳路径**: 当日志显示一个分支树（exp_001 → exp_002a, exp_002b, exp_003）时，请确定哪个路径最能支持论文的论点。将死胡同支线记录在附录中作为消融实验或负面结果。

**每个实验快照代码**: 在每次运行后都复制实验脚本：
```bash
cp experiment.py results/exp_003/experiment_snapshot.py
```
这即使在后续的代码更改之后也确保了精确的重现性。

---

## Phase 4: 结果分析

**目标**: 提取发现，计算统计数据，找出故事线。

### Step 4.1: 聚合结果

编写分析脚本，这些脚本需要：
1. 加载批次中的所有结果文件
2. 计算每个任务和汇总指标
3. 生成摘要表格

```python
# 标准分析模式
import json, os
from pathlib import Path

results = {}
for result_file in Path("results/").rglob("result.json"):
    data = json.loads(result_file.read_text())
    strategy = result_file.parent.name
    task = result_file.parent.parent.name
    results.setdefault(strategy, {})[task] = data

# 计算汇总指标
for strategy, tasks in results.items():
    scores = [t["score"] for t in tasks.values()]
    print(f"{strategy}: mean={np.mean(scores):.1f}, std={np.std(scores):.1f}")
```

### Step 4.2: 统计显著性

始终计算：
- **误差棒**: 标准差或标准误，需指定是哪个
- **置信区间**: 关键结果的 95% CI
- **配对检验**: 用于比较两种方法的 McNemar's test
- **效应量**: Cohen's d 或 h，用于实际意义

请参阅 [references/experiment-patterns.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md) 以获取 McNemar's test、自抽样 CI 和 Cohen's h 的完整实现。

### Step 4.3: 找出故事线

分析完成后，明确回答：
1. **主要发现是什么？** 用一句话陈述出来。
2. **什么让你感到惊讶？** 意外的结果往往能写出最好的论文。
3. **哪里失败了？** 失败的实验可能最具启发性。诚实地报告失败可以增强论文的说服力。
4. **还需要哪些后续实验？** 结果通常会提出新的问题。

#### 处理负面或零结果

当你的假设是错误的或结果不确定时，你有三种选择：

| 情况 | 行动 | 适合的投稿场所 |
|-----------|--------|-----------|
| 假设错误但 **原因** 是有启发性的 | 将论文框架围绕分析失败的原因展开 | NeurIPS, ICML (如果分析严谨) |
| 方法没有超越基线，但 **揭示了新东西** | 将贡献重新定义为理解/分析 | ICLR (重视理解), 工作坊论文 |
| 对流行主张的干净负面结果 | 撰写出来——领域需要知道 | NeurIPS Datasets & Benchmarks, TMLR, 工作坊 |
| 结果不确定，没有清晰的故事线 | 转向——运行不同的实验或重新定义 | 不要强行出一篇不存在的论文 |

**如何撰写负面结果论文**:
- 从社区相信什么以及为什么测试它很重要这一点入手。
- 描述你的严谨方法论（必须是滴水不漏的——审稿人会更仔细地审查）。
- 清晰地呈现零结果，并提供统计证据。
- 分析**为什么**预期的结果没有实现。
- 讨论这对该领域的启示。

**明确欢迎负面结果的投稿场所**: NeurIPS (Datasets & Benchmarks 专题), TMLR, ML Reproducibility Challenge, 主要会议的工作坊。有些工作坊专门征集负面结果。

### Step 4.4: 创建图表

**图表**:
- 所有图表均使用矢量图形（PDF）: `plt.savefig('fig.pdf')`
- 色盲安全调色板 (Okabe-Ito 或 Paul Tol)
- 自包含的图注——读者应该无需阅读正文就能理解。
- 图内不含标题——图注承担此功能。

**表格**:
- 使用 `booktabs` LaTeX 包
- 对每个指标的最佳值加粗显示
- 包含方向符号（越高/越低越好）
- 保持一致的小数精度

```latex
\usepackage{booktabs}
\begin{tabular}{lcc}
\toprule
Method & Accuracy $\uparrow$ & Latency $\downarrow$ \\
\midrule
Baseline & 85.2 & 45ms \\
\textbf{Ours} & \textbf{92.1} & 38ms \\
\bottomrule
\end{tabular}
```

### Step 4.5: 决定：再做实验还是写作？

| 情况 | 行动 |
|-----------|--------|
| 核心论点得到支持，结果显著 | 进入 Phase 5（撰写） |
| 结果不确定，需要更多数据 | 回到 Phase 2（设计） |
| 意外发现暗示新的方向 | 回到 Phase 2（设计） |
| 缺少一个消融实验，审稿人会要求 | 进行该实验，然后进入 Phase 5 |
| 所有实验都完成了但有些失败了 | 记录故障，进入 Phase 5 |

### Step 4.6: 撰写实验日志（连接到论文写作的桥梁）

在转入论文写作之前，创建一个结构化的实验日志，将结果与散文联系起来。这是实验和论文写作之间最重要的粘合剂——如果没有它，**智能体**就必须从原始结果文件重新推导出故事线。

**创建 `experiment_log.md`**，包含以下结构：

```markdown
# 实验日志

## 贡献（一句话）
[论文的主要论点]

## 运行的实验

### Experiment 1: [名称]
- **测试的论点**: [这支持哪篇论文的论点]
- **设置**: [模型、数据集、配置、运行次数]
- **关键结果**: [包含数字的一句话]
- **结果文件**: results/exp1/final_info.json
- **生成的图表**: figures/exp1_comparison.pdf
- **令人惊讶的发现**: [任何意外之处]

### Experiment 2: [名称]
...

## 图表
| Filename | Description (描述) | Which section it belongs in (属于哪个部分) |
|----------|-------------|---------------------------|
| figures/main_comparison.pdf | 比较所有方法在基准 X 上的条形图 | Results, Figure 2 |
| figures/ablation.pdf | 移除组件 A、B、C 的消融实验 | Results, Figure 3 |
...

## 失败的实验（记录以保持诚实）
- [尝试了什么，为什么失败，这告诉我们什么]

## 未解决的问题
- [结果提出了哪些论文应该解决的问题]
```

**为何这很重要**: 在起草过程中，**智能体**（或委托的子智能体）可以加载 `experiment_log.md` 和 LaTeX 模板，从而生成一份以实际结果为基础的第一稿。如果没有这个桥梁，撰写**智能体**就必须解析原始 JSON/CSV 文件并推断故事线——这是虚构或错误报告数字的常见来源。

**Git 纪律**: 将此日志与它所描述的结果一起提交。

## 迭代精炼：策略选择

该流程中的任何产出——论文草稿、实验脚本、分析——都可以进行迭代精炼。Autoreason 研究提供了关于每种精炼策略何时有效以及何时失败的实证证据。请使用本节来选择正确的方案。

### 快速决策表

| 你的情况 | 策略 | 原因 |
|---|---|---|
| 中端模型 + 受限任务 | **Autoreason** | 最佳甜蜜点。生成-评估差距最大。基线会主动摧毁弱模型的输出。 |
| 中端模型 + 未受限任务 | **Autoreason** 并添加范围约束 | 添加固定事实、结构或可交付成果来限定改进空间。 |
| 前沿模型 + 受限任务 | **Autoreason** | 即使在受限任务中，也能赢得 2/3 的任务。 |
| 前沿模型 + 未受限任务 | **Critique-and-revise** 或 **单次通过 (single pass)** | Autoreason 排在最后。模型的自我评估足够优秀。 |
| 具体技术任务（系统设计） | **Critique-and-revise** | 直接的查找和修复循环更高效。 |
| 填充模板的任务（一种正确的结构） | **单次通过 (Single pass)** 或 **保守 (conservative)** | 决策空间最小。迭代不会增加任何价值。 |
| 带有测试用例的代码 | **Autoreason (代码变体)** | 对失败原因进行结构化分析，然后再修复。恢复率 62% 对比 43%。 |
| 非常弱的模型（Llama 8B 等级） | **单次通过 (Single pass)** | 模型太弱，无法产生多样化的候选方案。应投入精力提高生成质量。 |

### 生成-评估差距

**核心洞察**: Autoreason 的价值取决于模型的生成能力与其自我评估能力之间的差距。

<!-- ascii-guard-ignore -->
```
模型等级        │ 生成能力 │ 自我评估 │ 差距    │ Autoreason 价值
──────────────────┼────────────┼───────────┼────────┼─────────────────
弱 (Llama 8B)   │ 差       │ 差      │ 小      │ 无 — 无法生成多样化的候选方案
中等 (Haiku 3.5) │ 中等     │ 差      │ 大      │ 最大 — 42/42 完美 Borda
中等 (Gemini Flash)│ 中等     │ 一般    │ 大      │ 高 — 赢得 2/3
强 (Sonnet 4)   │ 好       │ 中等    │ 中      │ 中等 — 赢得 3/5
前沿 (S4.6)    │ 优秀     │ 好      │ 小      │ 仅限有约束条件
```
<!-- ascii-guard-ignore-end -->

这个差距是结构性的，而非暂时的。随着成本下降，今天的“前沿”将成为明天的“中端”。最佳甜蜜点会移动，但永远不会消失。

### Autoreason 循环（总结）

每次运行都会从独立的智能体们生成三个候选方案：

1. **评论者 (Critic)** → 找出现有版本 A 的问题（不进行修复）
2. **作者 B (Author B)** → 根据批评意见修改 A
3. **合成者 (Synthesizer)** → 合并 A 和 B（随机化标签）
4. **裁判团 (Judge Panel)** → 3 个盲评判的 CoT 智能体通过 Borda 分数对 A、B、AB 进行排名
5. **收敛 (Convergence)** → A 在连续 k=2 次运行中获胜 → 完成

**关键参数:**
- k=2 收敛（k=1 过早，k=3 太昂贵，没有质量提升）
- 始终使用 CoT 裁判团（收敛速度快 3 倍）
- 作者温度 0.8，裁判员温度 0.3
- 保守式平局处理：现有版本获胜
- 每个角色都是一个拥有独立上下文的智能体

### 应用于论文草稿

通过 autoreason 精炼论文本身时：
- **向评论者提供事实依据 (ground truth)**：实际实验数据、结果 JSON、统计输出。如果没有这些，模型就会产生虚构的消融研究和虚假的置信区间。
- **至少使用 3 个工作正常的裁判员**：一个有缺陷的裁判解析器不会增加噪音——它会完全阻止平衡状态的实现。
- **对修订进行范围约束**：“解决这些特定的弱点”而不是“改进论文”。

请参阅 [references/autoreason-methodology.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/autoreason-methodology.md) 以获取完整的提示词、Borda 打分细节、模型选择指南、范围约束设计模式和计算预算参考。

---

## 第五阶段：论文撰写

**目标**: 撰写一份完整的、可供出版的论文。

### 大型项目的内容管理

一个包含50个以上实验文件、多个结果目录和大量文献笔记的论文项目，很容易超出智能体的上下文窗口。需要主动进行管理：

**每次撰写任务应加载到上下文中的内容:**

| 撰写任务 | 应加载到上下文中的内容 | 不应加载的内容 |
|---------------|------------------|-------------|
| 撰写引言 | `experiment_log.md`、贡献声明、5-10篇最相关的论文摘要 | 原始结果JSON、完整的实验脚本、所有文献笔记 |
| 撰写方法 | 实验配置、伪代码、架构描述 | 原始日志、其他实验的结果 |
| 撰写结果 | `experiment_log.md`、结果摘要表、图表列表 | 完整的分析脚本、中间数据 |
| 撰写相关工作 | 有组织的引用笔记（步骤1.4的输出）、.bib文件 | 实验文件、原始PDF |
| 修订稿件 | 完整论文草稿、特定的审稿人关注点 | 其他所有内容 |

**原则:**
- **`experiment_log.md` 是主要的上下文桥梁** — 它总结了撰写所需的全部信息，而无需加载原始数据文件（参见步骤4.6）
- **一次只加载一个部分的上下文**，当进行任务委派时。例如，负责方法论述的子智能体不需要文献综述笔记。
- **总结，而不是包含原始文件。** 对于一份200行的结果JSON，加载一份10行的摘要表。对于一篇50页的相关论文，加载5句的摘要 + 关于其相关性的2行笔记。
- **对于非常大的项目**: 创建一个`context/`目录，存放预压缩的摘要：
  ```
  context/
    contribution.md          # 1句话
    experiment_summary.md    # 关键结果表（来自experiment_log.md）
    literature_map.md        # 有组织的引用笔记
    figure_inventory.md      # 包含描述的图表清单
  ```

### 叙事原则 (The Narrative Principle)

**最关键的洞察**: 你的论文不是一系列实验的集合——它是一个有清晰贡献的故事，并由证据支持。

每一篇成功的机器学习（ML）论文都围绕着尼尔·南达（Neel Nanda）所说的“叙事”：一个简短、严谨、基于证据的技术故事，让读者关心其结果。

**三大支柱（必须在引言结束时做到清晰）：**

| 支柱 | 描述 | 测试 |
|--------|-------------|------|
| **What (是什么)** | 1-3个具体的创新主张 | 你能否用一句话陈述它们？ |
| **Why (为什么)** | 严谨的实证证据 | 实验是否区分了你的假设与其他替代方案？ |
| **So What (那又如何)** | 读者为什么要关心 | 这是否与公认的社区问题相关联？ |

**如果你不能用一句话陈述你的贡献，那么你还没有一篇论文。**

### 本指南的来源

此技能综合了来自在顶级会议上发表过大量论文的研究人员的写作哲学。该写作哲学层最初由[Orchestra Research](https://github.com/orchestra-research)作为`ml-paper-writing`技能汇编而成。

| 来源 | 关键贡献 | 链接 |
|--------|-----------------|------|
| **Neel Nanda** (Google DeepMind) | 叙事原则、What/Why/So What框架 | [How to Write ML Papers](https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers) |
| **Sebastian Farquhar** (DeepMind) | 5句摘要公式 | [How to Write ML Papers](https://sebastianfarquhar.com/on-research/2024/11/04/how_to_write_ml_papers/) |
| **Gopen & Swan** | 读者期望的7个原则 | [Science of Scientific Writing](https://cseweb.ucsd.edu/~swanson/papers/science-of-writing.pdf) |
| **Zachary Lipton** | 用词选择、消除模棱两可性 | [Heuristics for Scientific Writing](https://www.approximatelycorrect.com/2018/01/29/heuristics-technical-scientific-writing-machine-learning-perspective/) |
| **Jacob Steinhardt** (UC Berkeley) | 精确度、一致的术语 | [Writing Tips](https://bounded-regret.ghost.io/) |
| **Ethan Perez** (Anthropic) | 微观层面的清晰度技巧 | [Easy Paper Writing Tips](https://ethanperez.net/easy-paper-writing-tips/) |
| **Andrej Karpathy** | 单一贡献焦点 | 各种讲座 |

**如需深入了解任何内容，请参考:**
- [references/writing-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md) — 附有示例的完整解释
- [references/sources.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/sources.md) — 完整的参考文献

### 时间分配

在以下各项上花费**大致相等的时间**:
1. 摘要
2. 引言
3. 图表
4. 所有其他内容

**为什么？** 大多数审稿人会在看到方法论之前就形成判断。读者看到的论文顺序是：标题 → 摘要 → 引言 → 图表 → 可能还有剩余部分。

### 撰写工作流程

```
论文撰写清单:
- [ ] 步骤1：定义一句话的贡献
- [ ] 步骤2：起草图1（核心思想或最引人注目的结果）
- [ ] 步骤3：起草摘要（5句公式）
- [ ] 步骤4：起草引言（最多1-1.5页）
- [ ] 步骤5：起草方法
- [ ] 步骤6：起草实验和结果
- [ ] 步骤7：起草相关工作
- [ ] 步骤8：起草结论与讨论
- [ ] 步骤9：起草局限性（所有会议都要求）
- [ ] 步骤10：规划附录（证明、额外实验、细节）
- [ ] 步骤11：完成论文清单
- [ ] 步骤12：最终审阅
```

### 两轮精炼模式 (Two-Pass Refinement Pattern)

当与AI智能体一起撰写时，请使用**两轮**方法（已被SakanaAI的AI科学家流程证明有效）：

**第一轮 — 写作 + 即时精炼每个部分:**
对于每个部分，先完成草稿，然后立即在同一上下文中进行精炼。这可以在该部分内容还新鲜时捕获局部问题（清晰度、流畅性、完整性）。

**第二轮 — 使用完整论文上下文进行的全局精炼:**
所有部分都完成后，重新审视每个部分，同时考虑到整篇论文的宏观情况。这可以发现跨章节的问题：冗余、不一致的术语、叙事流程以及某个部分承诺但另一个部分未交付的缺失点。

```
第二轮精炼提示（针对每个部分）:
“在完整论文的背景下审阅[该部分]。
- 它是否与论文的其他部分相符？是否存在冗余？
- 术语是否与引言和方法保持一致？
- 是否可以剪除任何内容而不会削弱信息？
- 叙事流程是否从前一个部分平稳过渡到下一个部分？
进行最小化、有针对性的编辑。不要从零开始重写。”
```

### LaTeX 错误检查清单

将此检查清单附加到每个精炼提示中。这些是LLM撰写LaTeX时最常见的错误：

```
LaTeX质量检查（每次编辑后都验证）:
- [ ] 没有未闭合的数学符号（$号是否平衡）
- [ ] 只引用存在的图表（\ref 是否匹配 \label）
- [ ] 没有虚构的引用（\cite 是否匹配 .bib 中的条目）
- [ ] 每个\begin{env}都有匹配的\end{env}（尤其是figure, table, algorithm）
- [ ] 没有HTML污染（使用</end{figure}>而不是\end{figure}）
- [ ] 在数学模式之外没有未转义的下划线（在文本中使用\_）
- [ ] 没有重复的\label定义
- [ ] 没有重复的章节标题
- [ ] 文本中的数字是否与实际实验结果匹配
- [ ] 所有图表都有标题和标签
- [ ] 没有导致overfull hbox警告的过长行
```

### 5.0：标题

标题是论文中最常被阅读的部分。它决定了读者是否会点击进入摘要。

**好的标题**:
- 陈述贡献或发现：“Autoreason: 当迭代式LLM精炼有效和失败的原因”
- 突出一个令人惊讶的结果：“扩展数据受限的语言模型” (暗示你做到了)
- 命名方法 + 它做什么：“DPO：语言模型的直接偏好优化”

**坏的标题**:
- 太笼统：“一种改进语言模型输出的方法”
- 太长：超过约15个词
- 只有术语：“迭代随机策略收敛性分析” (这是给谁看的？)

**规则**:
- 如果有方法名称，请包含它（以便引用）
- 包含1-2个审稿人会搜索的关键词
- 除非两个部分都具有意义，否则避免使用冒号
- 测试：审稿人是否能仅从标题中了解领域和贡献？

### 5.1：摘要（五句公式）

来自Sebastian Farquhar (DeepMind):

```
1. 你完成了什么：“我们引入了...”、“我们证明了...”、“我们展示了...”
2. 这为什么困难且重要
3. 你是如何做到的（包含用于可发现性的专业关键词）
4. 你有什么证据
5. 你最显著的数字/结果
```

**删除**“大型语言模型取得了卓越成功……”等笼统的开场白。

### 5.2：图1

图1是读者第二看的部分（在摘要之后）。在撰写引言之前起草它——这会迫使你澄清核心思想。

| 图1类型 | 何时使用 | 示例 |
|---------------|-------------|---------|
| **方法图** | 新架构或流程 | 展示系统的TikZ流程图 |
| **结果预告片** | 一个引人注目的结果讲述了整个故事 | 条形图：“我们的方法 vs 基线”并显示出明显的差距 |
| **问题插图** | 问题是非直观的 | 修复失败模式的“之前/之后”对比图 |
| **概念图** | 抽象的贡献需要视觉基础 | 方法属性的2x2矩阵 |

**规则**: 图1必须在不阅读任何文本的情况下就能被理解。标题本身就应该传达核心思想。有目的地使用颜色——不要只是装饰。

### 5.3：引言（最多1-1.5页）

必须包括：
- 清晰的问题陈述
- 简要的方法概述
- 2-4个项目符号化的贡献列表（在两栏格式中，每个不超过1-2行）
- 方法应从第2-3页开始介绍

### 5.4：方法 (Methods)

启用重现性:
- 概念大纲或伪代码
- 列出所有超参数
- 足够的架构细节以供复现
- 呈现最终的设计决策；消融实验放在实验部分

### 5.5：实验与结果

对于每个实验，必须明确说明：
- **它支持哪个主张**
- 它如何与主要贡献相关联
- 需要观察什么：“蓝线显示X，这证明了Y”

要求:
- 带有方法论的误差棒（标准差 vs 标准误）
- 超参数搜索范围
- 计算基础设施（GPU类型、总小时数）
- 种子设置方法

### 5.6：相关工作 (Related Work)

应按方法学组织，而不是按论文来组织。要慷慨地引用——审稿人很可能撰写过相关的论文。

### 5.7：局限性 (Limitations)（必需）

所有主要会议都要求此项。诚实有助于：
- 审稿人被告知不要因为诚实的局限性承认而进行惩罚
- 通过首先识别弱点来预先避免批评
- 解释为什么这些局限性不会动摇核心主张

### 5.8：结论与讨论 (Conclusion & Discussion)

**结论**（必需，0.5-1页）:
- 用一句话重述贡献（措辞应不同于摘要）
- 总结关键发现（2-3句话，而不是一个列表）
- 启示意义：这对该领域意味着什么？
- 未来工作：2-3个具体的下一步（不要使用“我们将X留待未来研究”这种模糊的说法）

**讨论**（可选，有时与结论合并）:
- 超越即时结果的更广泛影响
- 与其他子领域的联系
- 对方法何时有效和无效的诚实评估
- 实际部署考量

**绝对不要**在结论中引入新的结果或主张。

### 5.9：附录策略 (Appendix Strategy)

所有主要会议都允许无限量的附录，它们对于可复现性至关重要。结构如下：

| 附录部分 | 应包含的内容 |
|-----------------|---------------|
| **证明与推导** | 主文本中篇幅过长的完整证明。主文本可以陈述定理并注明“证明见附录A”。 |
| **附加实验** | 消融实验、缩放曲线、按数据集划分的分析、超参数敏感性测试 |
| **实现细节** | 完整的超参数表、训练详情、硬件规格、随机种子 |
| **数据集文档** | 数据收集过程、标注指南、许可协议、预处理 |
| **提示与模板** | 使用的精确提示（针对基于LLM的方法）、评估模板 |
| **人工评估** | 标注界面截图、给标注员的指示、IRB详情 |
| **附加图表** | 按任务划分的分析、轨迹可视化、失败案例示例 |

**规则**:
- 主论文必须是自洽的——审稿人不需要阅读附录。
- 绝不能只在附录中提供关键证据。
- 交叉引用：“完整结果见表5（附录B）”，而不仅仅是“参见附录”。
- 使用`\appendix`命令，然后使用`\section{A: Proofs}`等。

### 页数预算管理 (Page Budget Management)

当超出页限制时：

| 缩减策略 | 可节省的页数 | 风险 |
|-------------|-------|------|
| 将证明移至附录 | 0.5-2页 | 低 — 标准做法 |
| 精简相关工作 | 0.5-1页 | 中 — 可能遗漏关键引用 |
| 合并子图表 | 0.25-0.5页 | 低 — 通常能提高可读性 |
| 谨慎使用`\vspace{-Xpt}` | 0.1-0.3页 | 如果微妙则低，如果明显则高 |
| 删除定性示例 | 0.5-1页 | 中 — 审稿人喜欢例子 |
| 减小图表尺寸 | 0.25-0.5页 | 高 — 图表必须保持可读性 |

**绝对不要**: 缩小字体、更改页边距、删除必需的部分（局限性、更广泛的影响），或对正文使用`\small`/`\footnotesize`。

### 5.10：伦理与更广泛影响声明 (Ethics & Broader Impact Statement)

大多数会议现在都要求或强烈鼓励提供伦理/更广泛影响声明。这不是套话——审稿人会阅读它，并可能指出触发桌面拒稿的伦理问题。

**需要包含的内容:**

| 组件 | 内容 | 必需性 |
|-----------|---------|-------------|
| **积极的社会影响** | 你的工作如何使社会受益 | NeurIPS, ICML |
| **潜在的负面影响** | 滥用风险、双重用途顾虑、失败模式 | NeurIPS, ICML |
| **公平性与偏见** | 你的方法/数据是否具有已知偏见？ | 所有会议（隐含） |
| **环境影响** | 大规模训练的计算碳足迹 | ICML, NeurIPS日益重视 |
| **隐私** | 你的工作是否使用或涉及个人数据的处理？ | ACL, NeurIPS |
| **LLM披露** | AI是否用于写作或实验？ | ICLR（强制）, ACL |

**撰写声明:**

```latex
\section*{Broader Impact Statement}
% NeurIPS/ICML: 在结论之后，不计入页限制

% 1. 正面应用（1-2句话）
这项工作使得[特定应用]成为可能，这可能使[特定群体]受益。

% 2. 风险和缓解措施（1-3句话，要具体）
[方法/模型]有可能被用于[特定风险]。我们通过[具体的缓解措施，例如：只发布尺寸大于X的模型权重、包括安全过滤器、记录失败模式]来减轻这一风险。

% 3. 影响声明的局限性（1句话）
我们的评估仅限于[特定领域]；更广泛的部署需要[特定的额外工作]。
```

**常见错误:**
- 写“我们预见没有负面影响”（几乎永远不真实——审稿人对此持怀疑态度）
- 模糊不清：“这可能被滥用”但没有说明如何滥用
- 忽略大规模工作的计算成本
- 忘记在要求披露的会议上披露LLM的使用

**计算碳足迹**（针对重度训练的论文）:
```python
# 使用ML CO2 Impact工具的方法论进行估算
gpu_hours = 1000  # 总GPU小时数
gpu_tdp_watts = 400  # 例如，A100 = 400W
pue = 1.1  # 电力使用效率（数据中心开销）
carbon_intensity = 0.429  # kg CO2/kWh (美国平均值；因地区而异)

energy_kwh = (gpu_hours * gpu_tdp_watts * pue) / 1000
carbon_kg = energy_kwh * carbon_intensity
print(f"Energy: {energy_kwh:.0f} kWh, Carbon: {carbon_kg:.0f} kg CO2eq")
```

### 5.11：数据表和模型卡片（如适用）

如果你的论文引入了**新的数据集**或**发布了一个模型**，请包含结构化的文档。审稿人越来越期望这一点，而NeurIPS Datasets & Benchmarks对此有所要求。

**数据集的数据表 (Datasheets for Datasets)** (Gebru et al., 2021) — 包含在附录中:

```
数据集文档（附录）:
- 动机：为什么创建这个数据集？它支持什么任务？
- 构成：实例是什么？有多少个？数据类型是什么？
- 收集：数据是如何收集的？来源是什么？
- 预处理：应用了哪些清洗/过滤？
- 分布：数据集如何分发？使用何种许可协议？
- 维护：谁来维护它？如何报告问题？
- 伦理考量：是否包含个人数据？是否获得了同意？是否存在潜在危害？已知偏见是什么？
```

**模型卡片 (Model Cards)** (Mitchell et al., 2019) — 针对模型发布，包含在附录中:

```
模型卡片（附录）:
- 模型详情：架构、训练数据、训练过程
- 预期用途：主要用例、不属于范围的用途
- 指标：基准测试的评估指标和结果
- 伦理考量：已知的偏见、公平性评估
- 局限性：已知的失败模式、模型表现不佳的领域
```

### 写作风格

**句子级别的清晰度（Gopen & Swan的7个原则）:**

| 原则 | 规则 |
|-----------|------|
| 主语-谓语接近性 | 使主语和谓语保持靠近 |
| 重音位置 | 将重点放在句子的末尾 |
| 主题位置 | 先提出背景，再给出新信息 |
| 旧信息在前，新信息在后 | 熟悉的信息 → 不熟悉的（新）信息 |
| 一个单元，一个功能 | 每个段落只表达一个观点 |
| 动词而非名词化 | 使用动词，而不是名词化（例如：使用“分析”而不是“进行分析”） |
| 新信息之前设置背景 | 在呈现新信息之前先铺垫好场景 |

**用词选择 (Lipton, Steinhardt):**
- 要具体：“准确率”而非“性能”
- 消除模棱两可性：除非真正不确定，否则删除“可能”（may）
- 全文术语一致
- 避免增量式词汇：“开发”（develop），而不是“结合”（combine）

**完整的写作指南及示例**: 参考 [references/writing-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md)

### 使用LaTeX模板

**始终先复制整个模板目录，然后再在其中进行撰写。**

```
模板设置清单:
- [ ] 步骤1：将整个模板目录复制到新项目
- [ ] 步骤2：验证模板本身可以编译（在任何更改之前）
- [ ] 步骤3：阅读模板的示例内容以了解结构
- [ ] 步骤4：逐部分替换示例内容
- [ ] 步骤5：使用模板宏（检查导言区中的\newcommand定义）
- [ ] 步骤6：仅在最后清理模板产物
```

**步骤1：复制完整模板**

```bash
cp -r templates/neurips2025/ ~/papers/my-paper/
cd ~/papers/my-paper/
ls -la  # 应看到: main.tex, neurips.sty, Makefile 等。
```

复制整个目录，而不仅仅是.tex文件。模板包括样式文件（.sty）、参考文献样式（.bst）、示例内容和Makefile。

**步骤2：首先验证模板是否可以编译**

在进行任何更改之前：
```bash
latexmk -pdf main.tex
# 或手动: pdflatex main.tex && bibtex main && pdflatex main.tex && pdflatex main.tex
```

如果未修改的模板无法编译，请先修复它（通常是缺少TeX包——通过`tlmgr install <package>`安装）。

**步骤3：将模板内容作为参考保留**

不要立即删除示例内容。将其注释掉并用作格式参考:
```latex
% 模板示例（保留供参考）:
% \begin{figure}[t]
%   \centering
%   \includegraphics[width=0.8\linewidth]{example-image}
%   \caption{Template shows caption style}
% \end{figure}

% 你实际的图表:
\begin{figure}[t]
  \centering
  \includegraphics[width=0.8\linewidth]{your-figure.pdf}
  \caption{遵循相同风格的你的标题。}
\end{figure}
```

**步骤4：逐部分替换内容**

系统地进行操作：标题/作者 → 摘要 → 引言 → 方法 → 实验 → 相关工作 → 结论 → 参考文献 → 附录。每完成一个部分后都编译一次。

**步骤5：使用模板宏**

```latex
\newcommand{\method}{YourMethodName}  % 一致的方法命名
\newcommand{\eg}{e.g.,\xspace}        % 正确的缩写词汇
\newcommand{\ie}{i.e.,\xspace}
```

### 模板陷阱 (Template Pitfalls)

| 陷阱 | 问题 | 解决方案 |
|---------|---------|----------|
| 只复制`.tex`文件 | 缺少`.sty`，无法编译 | 复制整个目录 |
| 修改`.sty`文件 | 会破坏会议格式 | 绝不要编辑样式文件 |
| 添加随机包 | 冲突，破坏模板 | 仅在必要时添加 |
| 过早删除模板内容 | 丢失格式参考 | 在完成之前保持注释状态 |
| 不经常编译 | 错误会累积 | 每完成一个部分后都编译一次 |
| 使用PNG栅格图表 | 论文中模糊不清 | 始终使用`savefig('fig.pdf')`生成的矢量PDF |

### 快速模板参考

| 会议 | 主文件 | 样式文件 | 页数限制 |
|------------|-----------|------------|------------|
| NeurIPS 2025 | `main.tex` | `neurips.sty` | 9页 |
| ICML 2026 | `example_paper.tex` | `icml2026.sty` | 8页 |
| ICLR 2026 | `iclr2026_conference.tex` | `iclr2026_conference.sty` | 9页 |
| ACL 2025 | `acl_latex.tex` | `acl.sty` | 8页（长篇） |
| AAAI 2026 | `aaai2026-unified-template.tex` | `aaai2026.sty` | 7页 |
| COLM 2025 | `colm2025_conference.tex` | `colm2025_conference.sty` | 9页 |

**通用规则**: 双盲审，参考文献不计入页数，附录无限量，需要LaTeX。

模板位于`templates/`目录中。请参考[templates/README.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/templates/README.md)以了解编译设置（VS Code, CLI, Overleaf, 其他IDE）。

### 表格和图表

**表格** — 使用`booktabs`进行专业格式化:

```latex
\usepackage{booktabs}
\begin{tabular}{lcc}
\toprule
方法 & 准确率 $\uparrow$ & 延迟 $\downarrow$ \\
\midrule
基线 (Baseline) & 85.2 & 45ms \\
\textbf{我们的方法} & \textbf{92.1} & 38ms \\
\bottomrule
\end{tabular}
```

规则:
- 对每个指标的最佳值加粗显示
- 包含方向符号（$\uparrow$越高越好，$\downarrow$越低越好）
- 右对齐数值列
- 保持小数精度一致

**图表**:
- **矢量图形** (PDF, EPS) 用于所有图表和流程图 — `plt.savefig('fig.pdf')`
- **栅格图** (PNG 600 DPI) 仅用于照片
- **色盲安全调色板** (Okabe-Ito 或 Paul Tol)
- 验证**灰度可读性**（8%的男性有色盲）
- **图中不应包含标题** — 标题本身就承担此功能
- **自洽的图表标题** — 读者应该在没有主文本的情况下就能理解

### 会议重投 (Conference Resubmission)

有关不同会议之间的转换，请参考第7阶段（投稿准备）——它涵盖了完整的转换流程、页数变化表和拒稿后的指导。

### 专业LaTeX导言区 (Professional LaTeX Preamble)

将这些包添加到任何论文中以获得专业质量。它们与所有主要的会议样式文件都是兼容的：

```latex
% --- 专业软件包（在会议样式文件之后添加）---

% 排版
\usepackage{microtype}              % 微排版改进（字符突起、扩展）
                                     % 使文本明显更精致——始终包含此项

% 表格
\usepackage{booktabs}               % 专业表格规则（\toprule, \midrule, \bottomrule）
\usepackage{siunitx}                % 一致的数字格式化，小数对齐
                                     % 用法: \num{12345} → 12,345; \SI{3.5}{GHz} → 3.5 GHz
                                     % 表格对齐：S列类型用于小数对齐的数字

% 图表
\usepackage{graphicx}               % 包含图形（\includegraphics）
\usepackage{subcaption}             % 带(a), (b), (c)标签的子图
                                     % 用法: \begin{subfigure}{0.48\textwidth} ... \end{subfigure}

% 图表和算法
\usepackage{tikz}                   % 可编程矢量图
\usetikzlibrary{arrows.meta, positioning, shapes.geometric, calc, fit, backgrounds}
\usepackage[ruled,vlined]{algorithm2e}  % 专业伪代码
                                     % 替代方案: 如果模板包含，则使用 \usepackage{algorithmicx}

% 交叉引用
\usepackage{cleveref}               % 智能引用：\cref{fig:x} → "图1"
                                     % 必须在hyperref之后加载
                                     % 处理对象：图表、部分、方程、算法

% 数学（通常由会议.sty文件包含，但请验证）
\usepackage{amsmath,amssymb}        % AMS数学环境和符号
\usepackage{mathtools}              % 扩展amsmath (dcases, coloneqq等)

% 颜色（用于图表和流程图）
\usepackage{xcolor}                 % 颜色管理
% Okabe-Ito色盲安全调色板:
\definecolor{okblue}{HTML}{0072B2}
\definecolor{okorange}{HTML}{E69F00}
\definecolor{okgreen}{HTML}{009E73}
\definecolor{okred}{HTML}{D55E00}
\definecolor{okpurple}{HTML}{CC79A7}
\definecolor{okcyan}{HTML}{56B4E9}
\definecolor{okyellow}{HTML}{F0E442}
```

**注意事项:**
- `microtype`是视觉质量影响最大的包。它会在亚像素级别调整字符间距。始终包含它。
- `siunitx`通过`S`列类型处理表格中的数字对齐——消除了手动留白。
- `cleveref`必须在`hyperref`之后加载。大多数会议.sty文件都会加载hyperref，因此请将cleveref放在最后。
- 检查会议模板是否已经加载了这些包（尤其是`algorithm`, `amsmath`, `graphicx`）。不要重复加载。

### siunitx 表格对齐

`siunitx`使重度依赖数字的表格更具可读性：

```latex
\begin{tabular}{l S[table-format=2.1] S[table-format=2.1] S[table-format=2.1]}
\toprule
方法 & {准确率 $\uparrow$} & {F1 $\uparrow$} & {延迟 (ms) $\downarrow$} \\
\midrule
基线 (Baseline)         & 85.2  & 83.7  & 45.3 \\
消融实验（无X）  & 87.1  & 85.4  & 42.1 \\
\textbf{我们的方法}    & \textbf{92.1} & \textbf{90.8} & \textbf{38.7} \\
\bottomrule
\end{tabular}
```

`S`列类型会自动对齐到小数点。花括号 `{}` 中的内容用于转义对齐。

### 子图表 (Subfigures)

并排图表的标准模式：

```latex
\begin{figure}[t]
  \centering
  \begin{subfigure}[b]{0.48\textwidth}
    \centering
    \includegraphics[width=\textwidth]{fig_results_a.pdf}
    \caption{在数据集A上的结果。}
    \label{fig:results-a}
  \end{subfigure}
  \hfill
  \begin{subfigure}[b]{0.48\textwidth}
    \centering
    \includegraphics[width=\textwidth]{fig_results_b.pdf}
    \caption{在数据集B上的结果。}
    \label{fig:results-b}
  \end{subfigure}
  \caption{我们的方法在两个数据集上的比较。（a）显示了缩放行为，而（b）显示了消融实验的结果。两者都使用了5个随机种子。}
  \label{fig:results}
\end{figure}
```

使用`\cref{fig:results}` → "图1"，`\cref{fig:results-a}` → "图1a"。

### 使用algorithm2e的伪代码

```latex
\begin{algorithm}[t]
\caption{带裁判团体的迭代精炼}
\label{alg:method}
\KwIn{任务 $T$，模型 $M$，裁判 $J_1 \ldots J_n$，收敛阈值 $k$}
\KwOut{最终输出 $A^*$}
$A \gets M(T)$ \tcp*{初始生成}
$\text{streak} \gets 0$\;
\While{$\text{streak} < k$}{
  $C \gets \text{Critic}(A, T)$ \tcp*{识别弱点}
  $B \gets M(T, C)$ \tcp*{解决批评的修订版本}
  $AB \gets \text{Synthesize}(A, B)$ \tcp*{合并最佳元素}
  \ForEach{裁判 $J_i$}{
    $\text{rank}_i \gets J_i(\text{shuffle}(A, B, AB))$ \tcp*{盲评排名}
  }
  $\text{winner} \gets \text{BordaCount}(\text{ranks})$\;
  \eIf{$\text{winner} = A$}{
    $\text{streak} \gets \text{streak} + 1$\;
  }{
    $A \gets \text{winner}$; $\text{streak} \gets 0$\;
  }
}
\Return{$A$}\;
\end{algorithm}
```

### TikZ 图表模式 (TikZ Diagram Patterns)

TikZ是ML论文中方法图的标准。常见模式：

**流程/管道图** (ML论文中最常见的):

```latex
\begin{figure}[t]
\centering
\begin{tikzpicture}[
  node distance=1.8cm,
  box/.style={rectangle, draw, rounded corners, minimum height=1cm, 
              minimum width=2cm, align=center, font=\small},
  arrow/.style={-{Stealth[length=3mm]}, thick},
]
  \node[box, fill=okcyan!20] (input) {输入\\$x$};
  \node[box, fill=okblue!20, right of=input] (encoder) {编码器\\$f_\theta$};
  \node[box, fill=okgreen!20, right of=encoder] (latent) {潜在表示\\$z$};
  \node[box, fill=okorange!20, right of=latent] (decoder) {解码器\\$g_\phi$};
  \node[box, fill=okred!20, right of=decoder] (output) {输出\\$\hat{x}$};
  
  \draw[arrow] (input) -- (encoder);
  \draw[arrow] (encoder) -- (latent);
  \draw[arrow] (latent) -- (decoder);
  \draw[arrow] (decoder) -- (output);
\end{tikzpicture}
\caption{架构概述。编码器将输入$x$映射到潜在表示$z$，解码器负责重建它。}
\label{fig:architecture}
\end{figure}
```

**比较/矩阵图** (用于展示方法变体):

```latex
\begin{tikzpicture}[
  cell/.style={rectangle, draw, minimum width=2.5cm, minimum height=1cm, 
               align=center, font=\small},
  header/.style={cell, fill=gray!20, font=\small\bfseries},
]
  % 标题行
  \node[header] at (0, 0) {方法};
  \node[header] at (3, 0) {收敛?};
  \node[header] at (6, 0) {质量?};
  % 行
  \node[cell] at (0, -1) {单次通过};
  \node[cell, fill=okgreen!15] at (3, -1) {不适用};
  \node[cell, fill=okorange!15] at (6, -1) {基线};
  \node[cell] at (0, -2) {批评+重审};
  \node[cell, fill=okred!15] at (3, -2) {否};
  \node[cell, fill=okred!15] at (6, -2) {退化};
  \node[cell] at (0, -3) {我们的方法};
  \node[cell, fill=okgreen!15] at (3, -3) {是 ($k$=2)};
  \node[cell, fill=okgreen!15] at (6, -3) {改进};
\end{tikzpicture}
```

**迭代循环图** (用于具有反馈机制的方法):

```latex
\begin{tikzpicture}[
  node distance=2cm,
  box/.style={rectangle, draw, rounded corners, minimum height=0.8cm, 
              minimum width=1.8cm, align=center, font=\small},
  arrow/.style={-{Stealth[length=3mm]}, thick},
  label/.style={font=\scriptsize, midway, above},
]
  \node[box, fill=okblue!20] (gen) {生成器};
  \node[box, fill=okred!20, right=2.5cm of gen] (critic) {批评者};
  \node[box, fill=okgreen!20, below=1.5cm of $(gen)!0.5!(critic)$] (judge) {裁判团};
  
  \draw[arrow] (gen) -- node[label] {输出 $A$} (critic);
  \draw[arrow] (critic) -- node[label, right] {批评 $C$} (judge);
  \draw[arrow] (judge) -| node[label, left, pos=0.3] {获胜者} (gen);
\end{tikzpicture}
```

### latexdiff 用于修订跟踪

对于反驳意见至关重要——它会生成一个标记过的PDF，显示版本之间的更改：

```bash
# 安装
# macOS: brew install latexdiff (或随TeX Live自带)
# Linux: sudo apt install latexdiff

# 生成差异文件
latexdiff paper_v1.tex paper_v2.tex > paper_diff.tex
pdflatex paper_diff.tex

# 对于多文件项目（使用\input{}或\include{}）
latexdiff --flatten paper_v1.tex paper_v2.tex > paper_diff.tex
```

这会生成一个带有红色删除线和蓝色添加内容的PDF——这是反驳补充材料的标准格式。

### SciencePlots 用于matplotlib

安装并使用以获得可供出版的图表：

```bash
pip install SciencePlots
```

```python
import matplotlib.pyplot as plt
import scienceplots  # 注册样式

# 使用science风格（类似IEEE，简洁）
with plt.style.context(['science', 'no-latex']):
    fig, ax = plt.subplots(figsize=(3.5, 2.5))  # 单栏宽度
    ax.plot(x, y, label='Ours', color='#0072B2')
    ax.plot(x, y2, label='Baseline', color='#D55E00', linestyle='--')
    ax.set_xlabel('训练步数')
    ax.set_ylabel('准确率')
    ax.legend()
    fig.savefig('paper/fig_results.pdf', bbox_inches='tight')

# 可用的样式: 'science', 'ieee', 'nature', 'science+ieee'
# 如果生成图表的机器上没有安装LaTeX，请添加'no-latex'
```

**标准图表尺寸**（双栏格式）:
- 单栏：`figsize=(3.5, 2.5)` — 适合单栏
- 双栏：`figsize=(7.0, 3.0)` — 横跨两栏
- 方形：`figsize=(3.5, 3.5)` — 用于热力图、混淆矩阵

---

## 第六阶段：自我审查与修改

**目标**: 在提交前模拟评审过程。尽早发现弱点。

### 6.1 模拟评审（集成模式）

从多个角度生成评审意见。自动化研究流水线（尤其是SakanaAI的AI科学家）的关键洞察是：**使用元审者（meta-reviewer）进行集合评审，比单次评审能产生更校准、更准确的反馈。**

**步骤 1: 生成 N 个独立的评审报告** (N=3-5)

使用不同的模型或温度设置。每个评审员只能看到论文，看不到其他人的评审意见。**默认采用负面偏见**——LLM在评估时有公认的正向偏见。

```
你是一个[VENUE]的专家评审员。你非常批判和彻底。
如果论文存在弱点或你对某个论断不确定，请明确指出，并体现在你的评分中。不要抱持任何侥幸心理。

根据官方评审指南审查这篇论文。评估以下几项内容：

1. 稳健性（Soundness）：论点是否得到充分支持？基线（baselines）是否公平且强大？
2. 清晰度（Clarity）：论文是否写得很好？专家能否重现它？
3. 重要性（Significance）：这对社区有意义吗？
4. 独创性（Originality）：是否有新的见解，而不仅仅是增量组合？

以结构化的 JSON 格式提供你的评审意见：
{
  "summary": "2-3句话的摘要",
  "strengths": ["优点 1", "优点 2", ...],
  "weaknesses": ["最关键的弱点 1", "弱点 2", ...],
  "questions": ["对作者的问题 1", ...],
  "missing_references": ["应该引用的论文", ...],
  "soundness": 1-4,
  "presentation": 1-4,
  "contribution": 1-4,
  "overall": 1-10,
  "confidence": 1-5
}
```

**步骤 2: 元评审（Area Chair 聚合）**

将所有 N 个评审报告输入给元审者：

```
你是一个[VENUE]的领域主席（Area Chair）。你收到了 [N] 份独立的论文评审报告。你的工作是：

1. 识别跨评审员的一致性优点和缺点
2. 通过直接检查论文来解决分歧
3. 产出代表聚合判断的元评审报告
4. 使用所有评审报告的平均数值分数

保持保守：如果评审员对某个弱点是否严重存在意见不一，请将其视为严重的，直到作者进行修改。

评审报告：
[review_1]
[review_2]
...
```

**步骤 3: 反思循环** (可选，2-3轮)

每个评审员可以在看到元评审报告后完善自己的评审意见。使用一个提前终止的哨兵：如果评审员回复“我完成了”（没有修改），则停止迭代。

**评审模型选择**: 最佳的评审工作应该由最强大的可用模型完成，即使你最初是用更便宜的模型撰写了论文。评审模型应独立于写作模型进行选择。

**少样本校准（Few-shot calibration）**: 如果有的话，请包含1-2份来自目标会议的真实已发表评审报告作为示例。这能极大地提高评分的校准度。请参阅 [references/reviewer-guidelines.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md) 以获取示例评审报告。

### 6.1b 可视化评审（VLM）

仅文本的评审会错过一整类问题：图表质量、排版问题、视觉一致性。如果拥有具备视觉能力的模型，请对编译后的PDF进行独立的**可视化评审**：

```
你正在评审这篇研究论文的视觉呈现。
检查以下内容：
1. 图表质量：图表是否可读？标签是否清晰？颜色是否易区分？
2. 图注与图表的匹配度：每个图注是否准确描述了其对应的图表？
3. 排版问题：孤立的分段标题、不自然的页面断裂、图表与其引用位置相距太远。
4. 表格格式：列是否对齐，小数精度是否一致，最佳结果是否加粗。
5. 视觉一致性：所有图表是否采用相同的配色方案？字体大小是否一致？
6. 灰度可读性：如果以黑白打印，这些图表是否仍可理解？

对于每个问题，请指定页码和确切位置。
```

这可以发现文本评审无法捕捉到的问题：轴标签不可读的图表、放置在引用处3页之遥远的图表、图2和图5之间不一致的配色方案，或者明显超出列宽度的表格。

### 6.1c 论点验证（Claim Verification Pass）

模拟评审后，进行独立的验证过程。这可以捕捉到评审员可能忽略的事实错误：

```
论点验证协议：
1. 从论文中提取所有事实性陈述（数字、比较、趋势）。
2. 对于每个论点，追溯支持它的特定实验/结果。
3. 验证论文中的数字是否与实际结果文件相符。
4. 标记任何缺乏可追踪来源的论点为 [VERIFY]。
```

对于基于智能体（agent-based）的工作流：将验证工作委托给一个**全新的子智能体**，该子智能体只接收论文文本和原始结果文件。这种新的上下文可以防止确认偏见——验证者不会“记得”结果本应是什么。

### 6.2 优先级划分

收集评审意见后进行分类：

| 优先级 | 操作 |
|----------|--------|
| **关键** (Critical)（技术缺陷、缺少基线） | 必须修复。可能需要新的实验 → 回到第2阶段 |
| **高** (High)（清晰度问题、缺乏消融实验） | 应在此次修改中修复 |
| **中** (Medium)（轻微写作问题、额外的实验） | 如果时间允许则修复 |
| **低** (Low)（风格偏好、附带建议） | 记录在未来工作计划中 |

### 6.3 修改周期

对于每个关键/高优先级的问题：
1. 确定受影响的具体部分。
2. 起草解决方案。
3. 验证该解决方案没有破坏其他论点。
4. 更新论文。
5. 根据评审员的顾虑进行重新检查。

### 6.4 反驳信撰写（Rebuttal Writing）

在回复实际评审意见时（投稿后），反驳信是一种与修改不同的技能：

**格式**: 点对点的回应。对于每个评审员提出的担忧：
```
> R1-W1: “论文缺乏与方法 X 的比较。”

我们感谢评审员的建议。我们在表格 3 (修订版) 中增加了与 Method X 的比较。我们的方法在 [metric] 上比 X 高出 3.2pp (p<0.05)。我们注意到 X 所需的计算预算是我们的两倍。
```

**规则**:
- 回应每一个担忧——评审员会注意到你跳过了哪个。
- 先提出最强有力的回应。
- 保持简洁和直接——评审员需要阅读数十份反驳信。
- 如果在反驳期间进行了实验，请包含新的结果。
- 切勿表现出防御性或轻视的态度，即使是针对微小的批评。
- 使用 `latexdiff` 生成一个标记的 PDF 文件来显示更改（参见专业 LaTeX 工具使用部分）。
- 感谢评审员提供具体、可操作的反馈（而不是泛泛的赞美）。

**不应该做的事**: “我们表示不同意”但没有证据支持。“这超出了范围”但没有解释。只回应优点而忽略弱点。

### 6.5 论文演进追踪

在关键里程碑处保存快照：
```
paper/
  paper.tex                    # 当前工作版本
  paper_v1_first_draft.tex     # 第一个完整草稿
  paper_v2_post_review.tex     # 模拟评审后的版本
  paper_v3_pre_submission.tex  # 提交前的最终版本
  paper_v4_camera_ready.tex    # 接受后的最终版
```

---

## 第七阶段：提交准备

**目标**: 最终检查、格式化和提交。

### 7.1 研讨会清单

每个会议都有强制性的检查清单。请仔细完成它们——不完整的清单可能导致被拒稿（desk rejection）。

参考 [references/checklists.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/checklists.md) 获取以下内容：
- NeurIPS 16项论文清单
- ICML 更广泛的影响和可复现性要求
- ICLR LLM披露政策
- ACL 强制性的限制部分
- 通用预提交检查清单

### 7.2 匿名化清单

双盲评审意味着审稿人不知道是谁撰写的这篇论文。请检查所有这些项目：

```
Anonymization Checklist:
- [ ] PDF中不包含任何作者姓名或单位
- [ ] 不包含致谢部分（接受后添加）
- [ ] 自引文以第三人称撰写：“Smith et al. [1] 展示了...” 而不是 “我们之前展示了 [1]...”
- [ ] 没有指向个人仓库的GitHub/GitLab URL
- [ ] 使用 Anonymous GitHub (https://anonymous.4open.science/) 进行代码链接
- [ ] 图中不包含机构标志或标识符
- [ ] 文件元数据中不包含作者姓名（检查PDF属性）
- [ ] 不使用“我们之前的研究”或“在我们早期的论文中”等措辞
- [ ] 数据集名称不能泄露所属机构（如有必要，请重命名）
- [ ] 补充材料中不包含身份识别信息
```

**常见错误**: Git提交信息显示在补充代码中、来自机构工具的水印图表、遗留的致谢部分、在匿名期之前发布的arXiv预印本。

### 7.3 格式验证

```
Pre-Submission Format Check:
- [ ] 遵守页数限制（不包括参考文献和附录）
- [ ] 所有图都是矢量图（PDF）或高分辨率栅格图（600 DPI PNG）
- [ ] 所有图在灰度下均可读
- [ ] 所有表格都使用booktabs格式
- [ ] 参考文献编译正确（引用中没有“?”）
- [ ] 关键区域内没有溢出的hboxes
- [ ] 附录清晰标记并分隔开
- [ ] 必需部分存在（限制、更广泛的影响等）
```

### 7.4 预编译验证

在尝试运行`pdflatex`**之前**，运行这些自动化检查。在这里捕获错误比调试编译器输出更快。

```bash
# 1. 使用 chktex 进行语言检查（捕获常见的LaTeX错误）
# 抑制噪音警告：-n2 (句末), -n24 (括号), -n13 (句子内), -n1 (命令终止)
chktex main.tex -q -n2 -n24 -n13 -n1

# 2. 验证所有引用是否存在于 .bib 文件中
# 从 .tex 中提取 \cite{...}，并与 .bib 进行比对
python3 -c "
import re
tex = open('main.tex').read()
bib = open('references.bib').read()
cites = set(re.findall(r'\\\\cite[tp]?{([^}]+)}', tex))
for cite_group in cites:
    for cite in cite_group.split(','):
        cite = cite.strip()
        if cite and cite not in bib:
            print(f'WARNING: \\\\cite{{{cite}}} not found in references.bib')
"

# 3. 验证所有引用的图文件是否存在于磁盘上
python3 -c "
import re, os
tex = open('main.tex').read()
figs = re.findall(r'\\\\includegraphics(?:\[.*?\])?{([^}]+)}', tex)
for fig in figs:
    if not os.path.exists(fig):
        print(f'WARNING: Figure file not found: {fig}')
"

# 4. 检查重复的 \label 定义
python3 -c "
import re
from collections import Counter
tex = open('main.tex').read()
labels = re.findall(r'\\\\label{([^}]+)}', tex)
dupes = {k: v for k, v in Counter(labels).items() if v > 1}
for label, count in dupes.items():
    print(f'WARNING: Duplicate label: {label} (appears {count} times)')
"
```

在继续之前，修复所有警告。对于基于智能体（agent-based）的工作流程：将chktex的输出反馈给智能体，并指示其进行最小程度的修复。

### 7.5 最终编译

```bash
# 清理构建
rm -f *.aux *.bbl *.blg *.log *.out *.pdf
latexmk -pdf main.tex

# 或手动操作（三重pdflatex + bibtex 用于交叉引用）
pdflatex -interaction=nonstopmode main.tex
bibtex main
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex

# 验证输出文件存在且包含内容
ls -la main.pdf
```

**如果编译失败**: 解析 `.log` 文件以找到第一个错误。常见的修复方法：
- "Undefined control sequence" → 缺少宏包或命令名称拼写错误
- "Missing $ inserted" → 数学模式外的数学符号
- "File not found" → 图文件路径错误或缺少.sty文件
- "Citation undefined" → .bib 条目缺失或未运行 bibtex

### 7.6 会议特定的要求

| Venue | 特殊要求 |
|-------|---------------------|
| **NeurIPS** | 附录中的论文清单，如果被接受则提供摘要总结 |
| **ICML** | 更广泛的影响声明（在结论之后添加，不计入页数限制） |
| **ICLR** | 需要LLM披露，互惠评审协议 |
| **ACL** | 强制性的限制部分，负责任NLP检查清单 |
| **AAAI** | 严格的样式文件——不得进行任何修改 |
| **COLM** | 为语言模型社区构建贡献框架 |

### 7.7 会议重投与格式转换

在不同研讨会之间进行格式转换时，**绝不要复制LaTeX导言区（preamble）的内容**：

```bash
# 1. 使用目标模板全新开始
cp -r templates/icml2026/ new_submission/

# 2. 只复制内容部分（而非导言区）
#    - 摘要文本、章节内容、图表、bib条目

# 3. 调整页数限制
# 4. 添加研讨会特定的必需部分
# 5. 更新参考文献
```

| From → To | 页数变化 | 关键调整项 |
|-----------|-------------|-----------------|
| NeurIPS → ICML | 9 → 8 | 缩减1页，添加更广泛的影响声明 |
| ICML → ICLR | 8 → 9 | 扩展实验部分，添加LLM披露 |
| NeurIPS → ACL | 9 → 8 | 重构以符合NLP惯例，添加限制部分 |
| ICLR → AAAI | 9 → 7 | 大幅缩减，严格遵守样式要求 |
| Any → COLM | 不定 → 9 | 为语言模型焦点进行重构 |

在缩减页数时：将证明材料移至附录，精简相关工作，合并表格，使用子图。
在扩展时：添加消融实验（ablations），扩展限制部分，包含额外的基线（baselines），添加定性示例。

**被拒稿后**: 在新版本中解决审稿人的顾虑，但不要包含“修改说明”部分或提及之前的提交（保持盲评）。

### 7.8 准备最终版（Camera-Ready）（接受后）

获得接受通知后，准备最终版：

```
Camera-Ready Checklist:
- [ ] 去匿名化：添加作者姓名、单位、电子邮件地址
- [ ] 添加致谢部分（资金、计算拨款、提供帮助的审稿人）
- [ ] 添加公共代码/数据URL（真实的GitHub，而非匿名链接）
- [ ] 解决元审稿人提出的任何强制性修改意见
- [ ] 将模板切换到最终版模式（如果适用——例如 AAAI \anon → \camera）
- [ ] 如果研讨会要求，添加版权声明
- [ ] 更新文本中所有“匿名”占位符
- [ ] 验证最终PDF是否干净地编译成功
- [ ] 检查最终版的页数限制（有时与提交版本不同）
- [ ] 将补充材料（代码、数据、附录）上传到研讨会门户网站
```

### 7.9 arXiv 和预印本策略

向arXiv投稿是机器学习领域的标准做法，但它涉及重要的时机和匿名性考量。

**时间决策树**:

| 情况 | 建议 |
|-----------|---------------|
| 向双盲评审研讨会（NeurIPS, ICML, ACL）提交 | **在**截止日期后才投稿到arXiv，而不是之前。提前投稿可能违反匿名政策，尽管执行情况各异。 |
| 向ICLR提交 | ICLR明确允许在提交前发布到arXiv。但不要将作者姓名放入提交材料本身。 |
| 论文已在arXiv上，并向新研讨会提交 | 大多数研讨会都接受。**不要**在审稿期间根据评审意见更新arXiv版本。 |
| 工作坊论文 | 任何时间点投稿到arXiv都是可以的——工作坊通常不是双盲评审。 |
| 希望建立优先权 | 如果担心被抢先，请立即发布——但必须接受匿名性的取舍。 |

**arXiv 分类选择** (ML/AI 论文):

| Category | Code | 最适合 |
|----------|------|----------|
| Machine Learning | `cs.LG` | 通用机器学习方法 |
| Computation and Language | `cs.CL` | NLP、语言模型 |
| Artificial Intelligence | `cs.AI` | 推理、规划、智能体 |
| Computer Vision | `cs.CV` | 视觉模型 |
| Information Retrieval | `cs.IR` | 搜索、推荐 |

**列出主分类 + 1-2 个交叉分类。** 分类越多，可见度越高，但只进行真正相关的交叉引用。

**版本控制策略**:
- **v1**: 初次提交（与会议提交稿一致）
- **v2**: 接受后的最终版修正（添加“已在[研讨会]接受”字样到摘要中）
- 在审稿期间，不要发布包含明显回应评审意见的v2版本

```bash
# 检查您的论文标题是否已经在arXiv上被使用
# (在选择标题之前)
pip install arxiv
python -c "
import arxiv
results = list(arxiv.Search(query='ti:\"Your Exact Title\"', max_results=5).results())
print(f'Found {len(results)} matches')
for r in results: print(f'  {r.title} ({r.published.year})')
"
```

### 7.10 研究代码打包

发布干净、可运行的代码能显著提高引用量和审稿人的信任度。将代码与最终版提交材料一起打包。

**仓库结构**:

```
your-method/
  README.md              # 设置、使用方法、复现说明
  requirements.txt       # 或 environment.yml (针对conda)
  setup.py               # 供pip安装的包
  LICENSE                # 推荐MIT或Apache 2.0用于研究用途
  configs/               # 实验配置
  src/                   # 核心方法实现
  scripts/               # 训练、评估、分析脚本
    train.py
    evaluate.py
    reproduce_table1.sh  # 每个主要结果一个脚本
  data/                  # 小型数据或下载脚本
    download_data.sh
  results/               # 用于验证的预期输出
```

**研究代码 README 模板**:

```markdown
# [论文标题]

"[论文标题]" 的官方实现（[研讨会] 年）。

## 设置 (Setup)
[设置环境所需的精确命令]

## 复现 (Reproduction)
要复现表1：`bash scripts/reproduce_table1.sh`
要复现图2：`python scripts/make_figure2.py`

## 引用 (Citation)
[BibTeX 条目]
```

**预发布检查清单**:
```
- [ ] 代码可以从干净的克隆体运行（在新的机器或Docker上测试）
- [ ] 所有依赖项都固定到特定版本
- [ ] 没有硬编码的绝对路径
- [ ] 仓库中不包含API密钥、凭证或个人数据
- [ ] README 涵盖设置、复现和引用信息
- [ ] LICENSE 文件存在（MIT 或 Apache 2.0 以实现最大程度的重用）
- [ ] 结果在预期方差内是可复现的
- [ ] .gitignore 排除数据文件、检查点、日志
```

**提交前的匿名代码**:
```bash
# 使用 Anonymous GitHub 进行双盲评审
# https://anonymous.4open.science/
# 上传您的仓库 → 获取一个匿名URL → 放入论文中
```

## 第八阶段：接收后的交付成果

**目标**：通过演示材料和社区参与来最大化你的论文影响力。

### 第8.1步：会议海报

大多数会议都需要海报环节。海报设计原则如下：

| 元素 | 指南意见 |
|---------|-----------|
| **大小** | 检查场地的要求（通常为 24"x36" 或 A0 人像/横向） |
| **内容** | 标题、作者、一句话贡献、方法图示、2-3个关键结果、结论 |
| **排版** | 从左上到右下（Z型）或分栏式 |
| **文字** | 标题在 3 米处可读，正文在 1 米处可读。不要使用完整段落——只用项目符号。 |
| **图形** | 使用更高分辨率的论文图表进行重用。放大关键结果。 |

**工具**：LaTeX (`beamerposter` 包)、PowerPoint/Keynote、Figma、Canva。

**制作**：在会议前 2 周以上下订单。布艺海报更适合旅行。许多会议现在也支持虚拟/数字海报。

### 第8.2步：会议演讲/重点介绍

如果获得了口头报告或重点介绍的机会：

| 演讲类型 | 时长 | 内容 |
|-----------|----------|---------|
| **重点介绍** | 5 分钟 | 问题、方法、一个关键结果。练习至正好 5 分钟。 |
| **口头报告** | 15-20 分钟 | 完整的故事：问题、方法、关键结果、消融实验、局限性。 |
| **研讨会演讲** | 10-15 分钟 | 根据研讨会听众进行调整——可能需要更多的背景介绍。 |

**幻灯片设计规则**：
- 每张幻灯片只包含一个想法
- 尽量减少文字——口头讲解细节，而不是投射它们
- 动画化关键图表以逐步建立理解
- 在末尾包括一张“收获”（Takeaway）幻灯片（单句贡献）
- 准备好应对预料到问题的备用幻灯片

### 第8.3步：博客文章/社交媒体

一个可供大众了解的摘要能显著提高影响力：

- **Twitter/X 帖子**：5-8 条推文。先谈结果，而不是方法。包括图1和关键结果图。
- **博客文章**：800-1500 字。为机器学习从业者撰写，而非审稿人。跳过形式化内容，强调直觉和实际意义。
- **项目页面**：包含摘要、图形、演示、代码链接、BibTeX 的 HTML 页面。使用 GitHub Pages。

**时间安排**：在论文出现在会议记录或 arXiv 草稿版后的 1-2 天内发布。

---

## 研讨会和短篇论文

研讨会论文和短篇论文（例如 ACL 短文，Findings 论文）遵循相同的流程，但有不同的限制和期望。

### 研讨会论文

| 特性 | 研讨会 | 主会议 |
|----------|----------|-----------------|
| **页数限制** | 4-6 页（通常） | 7-9 页 |
| **评审标准** | 对完整性的要求较低 | 必须是完整的、彻底的 |
| **评审流程** | 通常为单盲或轻度评审 | 双盲，严格 |
| **重视的内容** | 有趣的想法、初步结果、立场性文章 | 具有强大基线的完整实证故事 |
| **arXiv** | 可随时投稿 | 时间很重要（参见 arXiv 策略） |
| **贡献门槛** | 新的方向、有趣的负面结果、进行中的工作 | 显著的进展和强有力的证据 |

**何时瞄准研讨会**：
- 在提交完整论文之前希望获得反馈的早期想法
- 不足以支撑 8 页以上篇幅的负面结果
- 关于时事热点的立场性文章或观点
- 重复研究或可重现性报告

### ACL 短文和 Findings

ACL 有不同的投稿类型：

| 类型 | 页数 | 期望内容 |
|------|-------|-----------------|
| **长篇论文** | 8 | 完整的研究、强大的基线、消融实验 |
| **短篇论文** | 4 | 聚焦的贡献：一个清晰的点和证据 |
| **Findings** | 8 | 略微未能进入主会议但工作扎实的研究成果 |

**短篇论文策略**：选择 ONE 个论点并彻底支持它。不要试图将一篇长文压缩到 4 页——而是撰写一篇不同、更聚焦的论文。

## 经验性机器学习之外的论文类型

上文中的主流程是针对经验性机器学习（Empirical ML）论文设计的。其他类型的论文需要不同的结构和证据标准。请参阅 [references/paper-types.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md) 以获取每种类型详细的指导。

### 理论论文 (Theory Papers)

**结构**: 引言 → 预备知识（定义、符号）→ 主要结果（定理）→ 证明草稿 → 讨论 → 完整证明（附录）

**与经验性论文的主要区别:**
- 贡献是定理、界限或不可能性的结果，而不是实验数据。
- 方法部分被“预备知识”和“主要结果”所取代。
- 证明是证据，而不是实验（尽管欢迎对理论进行经验验证）。
- 在正文中使用证明草稿，在附录中使用完整证明是标准做法。
- 实验部分是可选的，但如果它能验证理论预测，则会增强论文。

**撰写证明的原则:**
- 以所有假设明确的方式正式陈述定理。
- 在正式证明之前提供直觉（“关键洞察在于……”）。
- 证明草稿应在 0.5-1 页内传达主要思想。
- 使用 `\begin{proof}...\end{proof}` 环境。
- 对假设进行编号并在定理中引用：“在假设 1-3 下，...”

### 综述/教程论文 (Survey / Tutorial Papers)

**结构**: 引言 → 分类/组织 → 详细覆盖范围 → 未解决问题 → 结论

**主要区别:**
- 贡献在于组织、综合和识别未解决的问题，而不是新的方法。
- 必须在范围内做到全面（审稿人会检查是否有遗漏的参考文献）。
- 需要清晰的分类或组织框架。
- 价值来自于单个论文所未涵盖的工作之间的联系。
- 最佳投稿期刊：TMLR (综述专题)、JMLR、Foundations and Trends in ML, ACM Computing Surveys

### 基准测试论文 (Benchmark Papers)

**结构**: 引言 → 任务定义 → 数据集构建 → 基线评估 → 分析 → 预期用途与局限性

**主要区别:**
- 贡献在于基准测试本身——它必须填补一个真正的评估空白。
- 数据集文档是强制性的，而不是可选的（参见 Datasheets, 第 5.11 节）。
- 必须证明该基准测试具有挑战性（现有基线无法饱和它）。
- 必须证明该基准测试衡量的是你声称它衡量的东西（构建效度）。
- 最佳投稿期刊：NeurIPS Datasets & Benchmarks track, ACL (资源论文), LREC-COLING

### 立场陈述论文 (Position Papers)

**结构**: 引言 → 背景 → 论点/主张 → 支持证据 → 反驳意见 → 启示意义

**主要区别:**
- 贡献是一个论点，而不是一个结果。
- 必须认真对待反驳意见。
- 证据可以是经验性、理论性或逻辑分析。
- 最佳投稿期刊：ICML (立场专题), 工作坊, TMLR

---

## Hermes 智能体集成 (Hermes Agent Integration)

此技能是为 Hermes 智能体设计的。它利用 Hermes 工具、任务委派、调度和记忆来完成整个研究生命周期。

### 相关技能 (Related Skills)

将此技能与其他 Hermes 技能组合使用，以应对特定的阶段：

| 技能 | 使用时机 | 如何加载 |
|-------|-------------|-------------|
| **arxiv** | 第 1 阶段（文献综述）：搜索 arXiv、生成 BibTeX、通过 Semantic Scholar 查找相关论文 | `skill_view("arxiv")` |
| **subagent-driven-development** | 第 5 阶段（草稿撰写）：与两阶段审查（规范合规性然后质量）并行撰写章节 | `skill_view("subagent-driven-development")` |
| **plan** | 第 0 阶段（设置）：在执行前创建结构化计划。写入 `.hermes/plans/` | `skill_view("plan")` |
| **qmd** | 第 1 阶段（文献）：通过混合 BM25 + 向量搜索搜索本地知识库（笔记、记录、文档） | 安装: `skill_manage("install", "qmd")` |
| **diagramming** | 第 4-5 阶段：创建基于 Excalidraw 的图表和架构图 | `skill_view("diagramming")` |
| **data-science** | 第 4 阶段（分析）：用于交互式分析和可视化的 Jupyter 实时内核 | `skill_view("data-science")` |

**此技能取代了 `ml-paper-writing`** — 它包含了 ml-paper-writing 的所有内容，以及完整的实验/分析流程和自推理方法论。

### Hermes 工具参考 (Hermes Tools Reference)

| 工具 | 在此流程中的用途 |
|------|----------------------|
| **`terminal`** | LaTeX 编译 (`latexmk -pdf`)、git 操作、启动实验 (`nohup python run.py &`)、进程检查 |
| **`process`** | 后台实验管理：`process("start", ...)`、`process("poll", pid)`、`process("log", pid)`、`process("kill", pid)` |
| **`execute_code`** | 运行 Python 进行引用验证、统计分析、数据聚合。通过 RPC 访问工具。 |
| **`read_file` / `write_file` / `patch`** | 论文编辑、实验脚本、结果文件。使用 `patch` 对大型 .tex 文件进行定向编辑。 |
| **`web_search`** | 文献发现：`web_search("transformer attention mechanism 2024")` |
| **`web_extract`** | 获取论文内容，验证引用：`web_extract("https://arxiv.org/abs/2303.17651")` |
| **`delegate_task`** | **并行章节撰写** — 为每个章节生成隔离的子智能体。也用于并发引用验证。 |
| **`todo`** | 跨会话的主要状态跟踪器。在每次阶段转换后更新。 |
| **`memory`** | 跨会话持久化关键决策：贡献框架、投稿期刊选择、审稿人反馈。 |
| **`cronjob`** | 安排实验监控、截止日期倒计时、自动 arXiv 检查。 |
| **`clarify`** | 当受阻时向用户提出有针对性的问题（投稿期刊选择、贡献框架）。 |
| **`send_message`** | 通知用户实验完成或草稿准备就绪，即使用户不在聊天中。 |

### 工具使用模式 (Tool Usage Patterns)

**实验监控** (最常见):
```
terminal("ps aux | grep <pattern>")
→ terminal("tail -30 <logfile>")
→ terminal("ls results/")
→ execute_code("analyze results JSON, compute metrics")
→ terminal("git add -A && git commit -m '<descriptive message>' && git push")
→ send_message("Experiment complete: <summary>")
```

**并行章节撰写** (使用委派):
```
delegate_task("根据这些实验脚本和配置，草拟方法论部分。 
  包括：伪代码、所有超参数、足以进行重现的架构细节。 使用 neurips2025 模板惯例以 LaTeX 编写。")

delegate_task("草拟相关工作部分。使用 web_search 和 web_extract 查找论文。通过 Semantic Scholar 验证每个引用。按方法论分组。")

delegate_task("草拟实验部分。阅读 results/ 中的所有结果文件。陈述每个实验支持哪个主张。包括误差条和显著性。")
```

每个智能体都作为一个**新的子智能体**运行，没有共享上下文——请在提示中提供所有必要信息。收集输出并进行整合。

**引用验证** (使用 execute_code):
```python
# 在 execute_code 中:
from semanticscholar import SemanticScholar
import requests

sch = SemanticScholar()
results = sch.search_paper("attention mechanism transformers", limit=5)
for paper in results:
    doi = paper.externalIds.get('DOI', 'N/A')
    if doi != 'N/A':
        bibtex = requests.get(f"https://doi.org/{doi}", 
                              headers={"Accept": "application/x-bibtex"}).text
        print(bibtex)
```

### 使用 `memory` 和 `todo` 进行状态管理 (State Management with `memory` and `todo`)

**`memory` 工具** — 持久化关键决策（限制：MEMORY.md 的约 2200 个字符）：

```
memory("add", "论文: autoreason。投稿期刊: NeurIPS 2025 (9 页)。 
  贡献: 当生成-评估差距很大时，结构化的精炼工作。
  关键结果: Haiku 42/42, Sonnet 3/5, S4.6 constrained 2/3。
  状态: 第 5 阶段 — 方法论部分的草稿撰写。")
```

在做出重大决策或阶段转换后更新记忆。这会在会话之间保持持久化。

**`todo` 工具** — 跟踪细粒度的进度：

```
todo("add", "为 Sonnet 4.6 设计受限任务实验")
todo("add", "运行 Haiku 基线比较")
todo("add", "草拟方法论部分")
todo("update", id=3, status="in_progress")
todo("update", id=1, status="completed")
```

**会话启动协议:**
```
1. todo("list")                           # 检查当前任务列表
2. memory("read")                         # 回顾关键决策
3. terminal("git log --oneline -10")      # 检查最近的提交记录
4. terminal("ps aux | grep python")       # 检查正在运行的实验
5. terminal("ls results/ | tail -20")     # 检查是否有新结果
6. 向用户报告状态，询问下一步方向
```

### Cron 监控 (Cron Monitoring with `cronjob`)

使用 `cronjob` 工具来安排定期的实验检查：

```
cronjob("create", {
  "schedule": "*/30 * * * *",  # 每 30 分钟
  "prompt": "检查实验状态:
    1. ps aux | grep run_experiment
    2. tail -30 logs/experiment_haiku.log
    3. ls results/haiku_baselines/
    4. 如果完成: 读取结果，计算 Borda 分数, 
       git add -A && git commit -m '添加 Haiku 结果' && git push
    5. 报告: 结果表格、关键发现、下一步骤
    6. 如果没有变化: 回复 [SILENT]"
})
```

**[SILENT] 协议**: 当自上次检查以来没有任何变化时，精确地回复 `[SILENT]`。这可以抑制通知的发送给用户。只有在有值得了解的真正变化时才进行报告。

**截止日期跟踪:**
```
cronjob("create", {
  "schedule": "0 9 * * *",  # 每天上午 9 点
  "prompt": "NeurIPS 2025 截止日期: 5 月 22 日。今天是 {date}。 
    剩余天数: {compute}。 
    检查待办事项列表 — 我们是否在正轨上？ 
    如果 <7 天: 警告用户剩余任务。"
})
```

### 通信模式 (Communication Patterns)

**何时通知用户** (通过 `send_message` 或直接回复):
- 实验批次完成（附带结果表格）
- 意外发现或需要决策的失败。
- 草稿章节准备就绪，等待审查。
- 截止日期临近且任务未完成。

**何时不通知:**
- 实验仍在运行，没有新结果 → `[SILENT]`
- 例行监控，没有变化 → `[SILENT]`
- 不需要关注的中间步骤。

**报告格式** — 始终包含结构化数据:
```
## 实验: <名称>
状态: 完成 / 运行中 / 失败

| 任务 | 方法 A | 方法 B | 方法 C |
|------|---------|---------|---------|
| 任务 1 | 85.2 | 82.1 | **89.4** |

关键发现: <一句话>
下一步: <接下来会发生什么>
```

### 需要人工输入的决策点 (Decision Points Requiring Human Input)

当真正受阻时，使用 `clarify` 进行有针对性的提问：

| 决策 | 何时提出 |
|----------|-------------|
| 目标投稿期刊 | 开始撰写论文之前（影响页数限制、框架设定） |
| 贡献框架 | 当存在多种有效的框架选择时 |
| 实验优先级 | TODO 列表中实验数量多于时间允许时 |
| 提交准备度 | 最终提交前 |

**不要询问** (要主动，做出选择，标记出来):
- 用词、章节顺序。
- 哪些特定的结果需要重点突出。
- 引用的完整性（先草稿已找到的内容，并指出空白）。

## 审稿人评估标准

了解审稿人关注哪些方面有助于集中精力：

| 标准 | 他们检查的内容 |
|-----------|----------------|
| **质量 (Quality)** | 技术可靠性、有充分依据的论断、公平的基线 |
| **清晰度 (Clarity)** | 写作清晰、专家可复现、符号表示一致 |
| **重要性 (Significance)** | 社区影响、推进理解 |
| **原创性 (Originality)** | 新见解（不需要新的方法） |

**评分（NeurIPS 6分制）：**
- 6：强力接受 — 开创性的，完美无瑕
- 5：接受 — 技术上扎实，影响力大
- 4：边缘接受 — 稳健的，评估有限
- 3：边缘拒绝 — 缺点大于优点
- 2：拒绝 — 技术缺陷
- 1：强力拒绝 — 已知结果或伦理问题

请参阅 [references/reviewer-guidelines.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md) 以获取详细指南、常见顾虑和反驳策略。

---

## 常见问题及解决方案

| 问题 (Issue) | 解决方案 (Solution) |
|-------|----------|
| 摘要过于笼统 | 如果第一句话可以适用于任何机器学习论文，则删除它。从你的具体贡献开始。 |
| 引言超过1.5页 | 将背景内容拆分到“相关工作”。提前放置贡献要点。 |
| 实验缺乏明确的论断 | 在每个实验前添加：“本实验旨在测试[特定论断]是否成立……” |
| 审稿人认为论文难以理解 | 添加导言提示（signposting），使用一致的术语，使图表说明自成一体。 |
| 缺少统计显著性 | 添加误差棒、运行次数、统计测试、置信区间。 |
| 实验范围蔓延 (Scope creep) | 每个实验都必须对应一个特定的论断。剔除那些不对应的实验。 |
| 论文被拒，需要重新提交 | 请参阅第7阶段的“会议重投”。在不提及审稿意见的情况下解决审稿人的顾虑。 |
| 缺少更广泛的影响声明 | 请参阅步骤5.10。大多数场合都要求提供。声称“没有负面影响”几乎是不可信的。 |
| 人工评估被批评为薄弱 | 请参阅步骤2.5和[references/human-evaluation.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md)。报告一致性指标、标注者详情、报酬。 |
| 审稿人质疑可复现性 | 发布代码（步骤7.9），记录所有超参数，包括种子和计算细节。 |
| 理论论文缺乏直觉 | 在正式证明之前添加用通俗语言解释的证明草图。请参阅[references/paper-types.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md)。 |
| 结果为负值/零值 | 请参阅第4.3节关于处理负面结果的内容。考虑研讨会、TMLR，或将其重构为分析。 |

---

## 参考文档

| 文档 (Document) | 内容 (Contents) |
|----------|----------|
| [references/writing-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md) | Gopen & Swan的7项原则、Perez微技巧、Lipton的措辞选择、Steinhardt的精确性、图表设计 |
| [references/citation-workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/citation-workflow.md) | 引用API、Python代码、CitationManager类、BibTeX管理 |
| [references/checklists.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/checklists.md) | NeurIPS的16项检查清单、ICML、ICLR、ACL的要求、通用预提交检查清单 |
| [references/reviewer-guidelines.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md) | 评估标准、评分、常见顾虑、反驳模板 |
| [references/sources.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/sources.md) | 所有写作指南、会议指南、API的完整参考文献 |
| [references/experiment-patterns.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md) | 实验设计模式、评估协议、监控、错误恢复 |
| [references/autoreason-methodology.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/autoreason-methodology.md) | 自我推理循环、策略选择、模型指南、提示词、范围约束、Borda评分 |
| [references/human-evaluation.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md) | 人工评估设计、标注指南、一致性指标、众包采购质量控制（QC）、IRB指导 |
| [references/paper-types.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md) | 理论论文（证明撰写、定理结构）、综述论文、基准测试论文、立场声明论文 |

### LaTeX 模板

`templates/` 中的模板包括：**NeurIPS 2025**，**ICML 2026**，**ICLR 2026**，**ACL**，**AAAI 2026**，**COLM 2025**。

请参阅 [templates/README.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/templates/README.md) 以获取编译说明。

### 关键外部资源

**写作理念：**
- [Neel Nanda: How to Write ML Papers](https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers)
- [Sebastian Farquhar: How to Write ML Papers](https://sebastianfarquhar.com/on-research/2024/11/04/how_to_write_ml_papers/)
- [Gopen & Swan: Science of Scientific Writing](https://cseweb.ucsd.edu/~swanson/papers/science-of-writing.pdf)
- [Lipton: Heuristics for Scientific Writing](https://www.approximatelycorrect.com/2018/01/29/heuristics-technical-scientific-writing-machine-learning-perspective/)
- [Perez: Easy Paper Writing Tips](https://ethanperez.net/easy-paper-writing-tips/)

**API：** [Semantic Scholar](https://api.semanticscholar.org/api-docs/) | [CrossRef](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | [arXiv](https://info.arxiv.org/help/api/basics.html)

**会议：** [NeurIPS](https://neurips.cc/Conferences/2025/PaperInformation/StyleFiles) | [ICML](https://icml.cc/Conferences/2025/AuthorInstructions) | [ICLR](https://iclr.cc/Conferences/2026/AuthorGuide) | [ACL](https://github.com/acl-org/acl-style-files)