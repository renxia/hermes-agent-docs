---
title: "研究论文写作"
sidebar_label: "研究论文写作"
description: "用于撰写机器学习/人工智能研究论文的端到端流程，涵盖实验设计、分析、起草、修改和投稿"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 研究论文写作

用于撰写机器学习/人工智能研究论文的端到端流程，涵盖实验设计、分析、起草、修改和投稿。涵盖 NeurIPS、ICML、ICLR、ACL、AAAI、COLM。集成了自动化实验监控、统计分析、迭代写作和引用验证。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/research/research-paper-writing` |
| 版本 | `1.1.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `semanticscholar`, `arxiv`, `habanero`, `requests`, `scipy`, `numpy`, `matplotlib`, `SciencePlots` |
| 平台 | linux, macos |
| 标签 | `Research`, `Paper Writing`, `Experiments`, `ML`, `AI`, `NeurIPS`, `ICML`, `ICLR`, `ACL`, `AAAI`, `COLM`, `LaTeX`, `Citations`, `Statistical Analysis` |
| 相关技能 | [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv), `ml-paper-writing`, [`subagent-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-subagent-driven-development), [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 研究论文写作流水线

端到端的流水线，用于生成符合 **NeurIPS、ICML、ICLR、ACL、AAAI 和 COLM** 发表要求的机器学习/人工智能研究论文。此技能涵盖完整的研究生命周期：实验设计、执行、监控、分析、论文写作、评审、修订和投稿。

这**不是一个线性流水线**——它是一个迭代循环。结果会触发新的实验。评审会触发新的分析。智能体必须处理这些反馈循环。

<!-- ascii-guard-ignore -->
```
┌─────────────────────────────────────────────────────────────┐
│                    研究论文流水线                           │
│                                                             │
│  阶段 0：项目设置 ──► 阶段 1：文献综述                      │
│       │                          │                          │
│       ▼                          ▼                          │
│  阶段 2：实验设计       阶段 5：论文草稿撰写 ◄──┐          │
│       │                          │                   │      │
│       ▼                          ▼                   │      │
│  阶段 3：执行与监控       阶段 6：自我评审                │      │
│       │                    与修订 ──────────┘              │
│       │                          │                          │
│       ▼                          ▼                          │
│  阶段 4：分析 ─────────► (反馈至阶段 2 或 5)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
<!-- ascii-guard-ignore-end -->

---

## 何时使用此技能

在以下情况使用此技能：
- **从现有代码库或想法开始撰写新研究论文**
- **设计和运行实验**以支持论文主张
- **撰写或修订**研究论文的任何部分
- **准备向特定会议或研讨会投稿**
- **根据评审意见**进行额外实验或修订
- **在不同会议格式之间转换**论文
- **撰写非实证性论文**——理论、综述、基准测试或立场论文（参见[超越实证机器学习的论文类型](#paper-types-beyond-empirical-ml)）
- **为自然语言处理、人机交互或对齐研究设计人工评估**
- **准备录用后交付物**——海报、演讲、代码发布

## 核心理念

1. **积极主动。** 提供完整的草稿，而不是提出问题。科学家很忙——产出一些他们可以回应的具体内容，然后迭代。
2. **切勿虚构引用。** AI 生成的引用错误率约为 40%。始终以编程方式获取。将不可验证的引用标记为 `[需要引用]`。
3. **论文是一个故事，而不是实验的集合。** 每篇论文都需要用一句话清晰陈述其唯一贡献。如果你做不到，说明论文尚未准备就绪。
4. **实验服务于主张。** 每个实验都必须明确说明它支持哪个主张。切勿运行与论文叙事无关的实验。
5. **尽早提交，频繁提交。** 每完成一批实验，每更新一次论文草稿——都要提交并附上描述性信息。Git 日志就是实验历史。

### 主动性与协作

**默认：积极主动。先起草，再带着草稿提问。**

| 信心水平 | 行动 |
|-----------------|--------|
| **高**（代码库清晰，贡献明显） | 撰写完整草稿，交付，根据反馈迭代 |
| **中**（存在一些歧义） | 撰写草稿并标记不确定性，继续推进 |
| **低**（存在重大未知因素） | 通过 `clarify` 提出 1-2 个有针对性的问题，然后起草 |

| 部分 | 是否自主起草？ | 在草稿中标记 |
|---------|-------------------|-----------------|
| 摘要 | 是 | “将贡献框定为 X —— 如有需要请调整” |
| 引言 | 是 | “强调了问题 Y —— 如有错误请纠正” |
| 方法 | 是 | “包含了细节 A、B、C —— 请补充遗漏部分” |
| 实验 | 是 | “突出了结果 1、2、3 —— 如有需要请重新排序” |
| 相关工作 | 是 | “引用了论文 X、Y、Z —— 请补充我遗漏的任何文献” |

**仅在以下情况阻塞输入**：目标会议不明确、存在多个相互矛盾的框架、结果似乎不完整、明确要求先评审。

---

## 阶段 0：项目设置

**目标**：建立工作空间，理解现有工作，识别贡献。

### 步骤 0.1：探索代码库

```bash
# 了解项目结构
ls -la
find . -name "*.py" | head -30
find . -name "*.md" -o -name "*.txt" | xargs grep -l -i "result\|conclusion\|finding"
```

查找：
- `README.md` —— 项目概述和主张
- `results/`、`outputs/`、`experiments/` —— 现有发现
- `configs/` —— 实验设置
- `.bib` 文件 —— 现有引用
- 草稿文档或笔记

### 步骤 0.2：组织工作空间

建立一致的工作空间结构：

```
workspace/
  paper/               # LaTeX 源文件、图表、编译后的 PDF
  experiments/         # 实验运行脚本
  code/                # 核心方法实现
  results/             # 原始实验结果（自动生成）
  tasks/               # 任务/基准测试定义
  human_eval/          # 人工评估材料（如果需要）
```

### 步骤 0.3：设置版本控制

```bash
git init  # 如果尚未初始化
git remote add origin <repo-url>
git checkout -b paper-draft  # 或 main
```

**Git 规范**：每完成一批实验都要提交，并附上描述性信息。例如：
```
添加蒙特卡洛约束结果（5 次运行，Sonnet 4.6，策略备忘录任务）
添加 Haiku 基线比较：在廉价模型层级上 autoreason 与 refinement 基线
```

### 步骤 0.4：识别贡献

在撰写任何内容之前，请先阐明：
- **是什么（The What）**：这篇论文贡献的唯一事物是什么？
- **为什么（The Why）**：什么证据支持它？
- **那又怎样（The So What）**：读者为什么要关心？

> 向科学家提议：“根据我的理解，主要贡献是：[一句话]。关键结果表明 [Y]。这是您想要的框架吗？”

### 步骤 0.5：创建待办事项列表

使用 `todo` 工具创建结构化的项目计划：

```
研究论文待办事项：
- [ ] 定义一句话贡献
- [ ] 文献综述（相关工作 + 基线）
- [ ] 设计核心实验
- [ ] 运行实验
- [ ] 分析结果
- [ ] 撰写初稿
- [ ] 自我评审（模拟审稿人）
- [ ] 根据评审修订
- [ ] 投稿准备
```

在整个项目中更新此列表。它作为跨会话的持久状态。

### 步骤 0.6：估算计算预算

在运行实验之前，估算总成本和时间：

```
计算预算清单：
- [ ] API 成本：（每个 token 的模型价格）×（每次运行的预估 token 数）×（运行次数）
- [ ] GPU 小时数：（每次实验时间）×（实验数量）×（种子数量）
- [ ] 人工评估成本：（标注员）×（小时数）×（每小时费率）
- [ ] 总预算上限和应急费用（为重运行增加 30-50%）
```

在实验运行时跟踪实际支出：
```python
# 简单成本跟踪模式
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

**当预算紧张时**：在投入全面扫描之前，先运行试点实验（1-2 个种子，任务子集）。使用更便宜的模型调试流水线，然后切换到目标模型进行最终运行。

### 步骤 0.7：多作者协调

大多数论文有 3-10 位作者。尽早建立工作流程：

| 工作流程 | 工具 | 何时使用 |
|----------|------|-------------|
| **Overleaf** | 基于浏览器 | 多位作者同时编辑，无需 git 经验 |
| **Git + LaTeX** | 带 `.gitignore` 的 `git`（用于辅助文件） | 技术团队，需要基于分支的评审 |
| **Overleaf + Git 同步** | Overleaf 高级版 | 两者兼顾 —— 具有版本历史的实时协作 |

**部分所有权**：将每个部分分配给一位主要作者。其他人可以评论，但不能直接编辑。防止合并冲突和风格不一致。

```
作者协调清单：
- [ ] 商定部分所有权（谁写什么）
- [ ] 设置共享工作空间（Overleaf 或 git 仓库）
- [ ] 建立符号约定（在任何人撰写之前）
- [ ] 安排内部评审轮次（不仅仅是在最后）
- [ ] 指定一人负责最终格式调整
- [ ] 在创建图表之前商定图表风格（颜色、字体、大小）
```

**需要尽早商定的 LaTeX 约定**：
- `\method{}` 宏用于一致的方法命名
- 引用风格：`\citet{}` 与 `\citep{}` 的使用
- 数学符号：小写粗体表示向量，大写粗体表示矩阵等
- 英式与美式拼写

## 第一阶段：文献综述

**目标**：查找相关工作，确定基线方法，收集引用文献。

### 步骤 1.1：确定种子论文

从代码库中已引用的论文开始：

```bash
# 通过终端：
grep -r "arxiv\|doi\|cite" --include="*.md" --include="*.bib" --include="*.py"
find . -name "*.bib"
```

### 步骤 1.2：搜索相关工作

**加载 `arxiv` 技能**以进行结构化论文发现：`skill_view("arxiv")`。它提供 arXiv REST API 搜索、Semantic Scholar 引用图谱、作者信息以及 BibTeX 生成功能。

使用 `web_search` 进行广泛搜索，使用 `web_extract` 获取特定论文：

```
# 通过 web_search：
web_search("[主要技术] + [应用领域] site:arxiv.org")
web_search("[基线方法] comparison ICML NeurIPS 2024")

# 通过 web_extract（针对特定论文）：
web_extract("https://arxiv.org/abs/2303.17651")
```

可尝试的其他搜索查询：

```
搜索查询：
- "[主要技术] + [应用领域]"
- "[基线方法] comparison"
- "[问题名称] state-of-the-art"
- 现有引用中的作者姓名
```

**建议**：安装 **Exa MCP** 以实现实时学术搜索：
```bash
claude mcp add exa -- npx -y mcp-remote "https://mcp.exa.ai/mcp"
```

### 步骤 1.2b：深化搜索（广度优先，然后深度优先）

扁平化搜索（一轮查询）通常会遗漏重要的相关工作。采用受深度研究流程启发的迭代式**广度优先，然后深度优先**模式：

```
迭代式文献搜索：

第 1 轮（广度）：4-6 个并行查询，涵盖不同角度
  - "[方法] + [领域]"
  - "[问题名称] state-of-the-art 2024 2025"
  - "[基线方法] comparison"
  - "[替代方法] vs [你的方法]"
  → 收集论文，提取关键概念和术语

第 2 轮（深度）：根据第 1 轮的学习结果生成后续查询
  - 在第 1 轮论文中发现的新术语
  - 最相关的第 1 轮结果所引用的论文
  - 需要调查的矛盾发现
  → 收集论文，识别剩余空白

第 3 轮（针对性）：填补特定空白
  - 在第 1-2 轮中识别出的缺失基线
  - 同期工作（最近 6 个月，相同问题）
  - 关键的负面结果或失败方法
  → 当新查询返回的论文大部分是你已经见过的论文时停止
```

**何时停止**：如果某一轮返回的论文中超过 80% 已经存在于你的集合中，则搜索已饱和。通常 2-3 轮就足够了。对于综述性论文，预计需要 4-5 轮。

**对于基于智能体的工作流**：通过 `delegate_task` 并行委派每一轮的查询。收集结果，去重，然后根据综合学习结果生成下一轮的查询。

### 步骤 1.3：验证每一条引用

**切勿凭记忆生成 BibTeX。务必以编程方式获取。**

对于每一条引用，请遵循强制性的 5 步流程：

```
引用验证（每条引用都必须执行）：
1. 搜索 → 使用特定关键词在 Semantic Scholar 或 Exa MCP 中查询
2. 验证 → 确认论文存在于 2 个以上来源（Semantic Scholar + arXiv/CrossRef）
3. 检索 → 通过 DOI 内容协商以编程方式获取 BibTeX（而非凭记忆）
4. 校验 → 确认你引用的主张确实出现在论文中
5. 添加 → 将已验证的 BibTeX 添加到参考文献中
如果任何一步失败 → 标记为 [CITATION NEEDED]，通知科学家
```

```python
# 通过 DOI 获取 BibTeX
import requests

def doi_to_bibtex(doi: str) -> str:
    response = requests.get(
        f"https://doi.org/{doi}",
        headers={"Accept": "application/x-bibtex"}
    )
    response.raise_for_status()
    return response.text
```

如果你无法验证某条引用：

```latex
\cite{PLACEHOLDER_author2024_verify_this}  % TODO: 验证此引用是否存在
```

**始终告知科学家**：“我已将 [X] 条引用标记为需要验证的占位符。”

有关完整的 API 文档和完整的 `CitationManager` 类，请参阅 [references/citation-workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/citation-workflow.md)。

### 步骤 1.4：组织相关工作

按方法论对论文进行分组，而不是一对一地罗列：

**好**：“一系列工作使用 X 的假设 [参考文献]，而我们使用 Y 的假设，因为...”
**差**：“Smith 等人提出了 X。Jones 等人提出了 Y。我们将两者结合起来。”

---

## 第二阶段：实验设计

**目标**：设计能够直接支持论文主张的实验。每个实验都必须回答一个具体问题。

### 步骤 2.1：将主张映射到实验

建立明确的映射关系：

| 主张 | 实验 | 预期证据 |
|------|------|----------|
| “我们的方法优于基线” | 主要对比实验（表1） | 胜率、统计显著性 |
| “效果在较弱的模型上更显著” | 模型规模缩放研究 | 单调改进曲线 |
| “收敛需要范围约束” | 约束 vs 无约束 | 收敛速率比较 |

**规则**：如果某个实验无法映射到某个主张，则不要运行它。

### 步骤 2.2：设计基线

强有力的基线是区分被接收论文与被拒稿论文的关键。审稿人会问：“他们是否与 X 进行了比较？”

标准基线类别：
- **朴素基线**：最简单可行的方法
- **强基线**：已知的最佳现有方法
- **消融基线**：你的方法减去一个组件
- **计算量匹配基线**：相同计算预算，不同分配方式

### 步骤 2.3：定义评估协议

在运行任何实验之前，请明确指定：
- **指标**：你要测量什么，方向符号（越高/越低越好）
- **聚合方式**：如何将多次运行/任务的结果合并
- **统计检验**：使用何种检验来确定显著性
- **样本量**：运行/问题/任务的数量

### 步骤 2.4：编写实验脚本

遵循成功研究流水线中的以下模式：

**增量保存**——每一步之后保存结果，以便崩溃后恢复：
```python
# 每个问题/任务后保存
result_path = f"results/{task}/{strategy}/result.json"
if os.path.exists(result_path):
    continue  # 跳过已完成的工作
# ... 运行实验 ...
with open(result_path, 'w') as f:
    json.dump(result, f, indent=2)
```

**工件保存**——保存所有中间输出：
```
results/<experiment>/
  <task>/
    <strategy>/
      final_output.md          # 最终结果
      history.json             # 完整轨迹
      pass_01/                 # 每次迭代的工件
        version_a.md
        version_b.md
        critic.md
```

**关注点分离**——将生成、评估和可视化分开：
```
run_experiment.py              # 核心实验运行器
run_baselines.py               # 基线比较
run_comparison_judge.py        # 盲评
analyze_results.py             # 统计分析
make_charts.py                 # 可视化
```

完整的设计模式、定时监控和错误恢复方案，请参见 [references/experiment-patterns.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md)。

### 步骤 2.5：设计人工评估（如适用）

许多自然语言处理（NLP）、人机交互（HCI）和对齐方向的论文都需要人工评估作为主要或补充证据。请在运行自动化实验之前就设计好人工评估——人工评估通常需要更长的准备时间（如伦理审查委员会批准、标注员招募）。

**何时需要人工评估：**
- 自动化指标无法捕捉你关心的内容（如流畅性、有帮助性、安全性）
- 你的贡献是关于面向人类的质量（如可读性、偏好、信任）
- NLP 会议（如 ACL、EMNLP）的审稿人对生成任务期望有人工评估

**关键设计决策：**

| 决策 | 选项 | 指导建议 |
|------|------|----------|
| **标注员类型** | 专家、众包工人、最终用户 | 与你的主张要求相匹配 |
| **尺度** | Likert 量表（1-5）、成对比较、排序 | 对于大语言模型输出，成对比较比 Likert 更可靠 |
| **样本量** | 每位标注员和总项目数 | 功效分析或至少 100 个项目，3 名以上标注员 |
| **一致性度量** | Cohen's kappa、Krippendorff's alpha、ICC | 超过 2 名标注员时使用 Krippendorff's alpha；同时报告原始一致性 |
| **平台** | Prolific、MTurk、内部团队 | Prolific 质量高；MTurk 规模大；内部团队适合领域专业知识 |

**标注指南检查清单：**
```
- [ ] 清晰的任务描述及示例（包括好和坏的）
- [ ] 模糊情况的决策标准
- [ ] 每个类别至少 2 个完整示例
- [ ] 注意力检查/黄金标准项目（占总项目的 10-15%）
- [ ] 资格任务或筛选轮次
- [ ] 每个项目的预估时间和公平报酬（≥当地最低工资）
- [ ] 如所在机构要求，需通过伦理审查委员会（IRB）/伦理审查
```

**报告要求**（审稿人会检查所有这些内容）：
- 标注员人数及其资质
- 标注员间一致性，包括具体度量方法和数值
- 报酬详情（金额、预估小时工资）
- 标注界面描述或截图（附录）
- 总标注时间

完整指南（包括人工评估数据的统计检验、众包质量控制模式和伦理审查指导），请参见 [references/human-evaluation.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md)。

---

## 第三阶段：实验执行与监控

**目标**：可靠地运行实验，监控进度，从失败中恢复。

### 步骤 3.1：启动实验

对长时间运行的实验使用 `nohup`：

```bash
nohup python run_experiment.py --config config.yaml > logs/experiment_01.log 2>&1 &
echo $!  # 记录进程 ID（PID）
```

**并行执行**：可同时运行相互独立的实验，但需注意 API 速率限制。在同一 API 上并发运行 4 个以上实验会拖慢每个实验的速度。

### 步骤 3.2：设置监控（定时任务模式）

对于长时间运行的实验，设置周期性状态检查。定时任务提示应遵循以下模板：

```
监控提示模板：
1. 检查进程是否仍在运行：ps aux | grep <pattern>
2. 读取日志最后 30 行：tail -30 <logfile>
3. 检查已完成的结果：ls <result_dir>
4. 如果结果存在，读取并报告：cat <result_file>
5. 如果全部完成，提交：git add -A && git commit -m "<描述性消息>" && git push
6. 以结构化格式报告（包含关键指标的表格）
7. 回答本实验的关键分析问题
```

**静默模式**：如果自上次检查以来没有任何变化，则回复 `[SILENT]` 以抑制向用户发送通知。仅在有新进展时才报告。

### 步骤 3.3：处理失败

常见失败模式及恢复方法：

| 失败类型 | 检测方式 | 恢复方法 |
|----------|----------|----------|
| API 速率限制/额度耗尽 | 日志中出现 402/429 错误 | 等待后重新运行（脚本会跳过已完成的工作） |
| 进程崩溃 | PID 消失，结果不完整 | 从最后一个检查点重新运行 |
| 难题超时 | 进程卡住，日志无进展 | 终止并跳过，在结果中注明 |
| 模型 ID 错误 | 引用模型名称时报错 | 修正 ID 后重新运行 |

**关键**：脚本应始终检查现有结果并跳过已完成的工作。这使得重新运行既安全又高效。

### 步骤 3.4：提交已完成的结果

每批实验完成后：

```bash
git add -A
git commit -m "添加 <实验名称>：<一行关键发现>"
git push
```

### 步骤 3.5：维护实验日志

Git 提交记录的是发生了什么，但无法记录**探索树**——即基于所学知识决定下一步尝试什么的决策过程。请维护一个结构化的实验日志来捕获这棵树：

```json
// experiment_journal.jsonl — 每次实验尝试追加一条记录
{
  "id": "exp_003",
  "parent": "exp_001",
  "timestamp": "2025-05-10T14:30:00Z",
  "hypothesis": "添加范围约束将修复 exp_001 中的收敛失败问题",
  "plan": "使用 max_tokens=2000 和固定结构模板重新运行 autoreason",
  "config": {"model": "haiku", "strategy": "autoreason", "max_tokens": 2000},
  "status": "completed",
  "result_path": "results/exp_003/",
  "key_metrics": {"win_rate": 0.85, "convergence_rounds": 3},
  "analysis": "范围约束修复了收敛问题。胜率从 0.42 跃升至 0.85。",
  "next_steps": ["在 Sonnet 上尝试相同约束", "测试不使用结构模板"],
  "figures": ["figures/exp003_convergence.pdf"]
}
```

**为什么需要日志，而不仅仅是 Git？** Git 跟踪文件变更。日志则记录推理过程：为什么尝试 X，学到了什么，以及这对下一次实验意味着什么。撰写论文时，这棵树对于方法部分（“我们观察到 X，这促使我们尝试 Y”）和诚实地报告失败至关重要。

**选择最佳路径**：当日志显示一棵分支树（exp_001 → exp_002a, exp_002b, exp_003）时，请识别最能支持论文主张的路径。将死胡同分支作为消融实验或负面结果记录在附录中。

**每次实验后保存代码快照**：每次运行后复制实验脚本：
```bash
cp experiment.py results/exp_003/experiment_snapshot.py
```
这确保了即使在后续代码更改后也能精确复现实验。

## 第4阶段：结果分析

**目标**：提取发现、计算统计数据、明确核心结论。

### 步骤4.1：汇总结果

编写分析脚本，实现以下功能：
1. 加载一个批次的所有结果文件
2. 计算每项任务和总体指标
3. 生成汇总表格

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

# 计算总体指标
for strategy, tasks in results.items():
    scores = [t["score"] for t in tasks.values()]
    print(f"{strategy}: mean={np.mean(scores):.1f}, std={np.std(scores):.1f}")
```

### 步骤4.2：统计显著性

始终计算：
- **误差条**：标准差或标准误，需明确说明
- **置信区间**：关键结果的95%置信区间
- **成对检验**：McNemar检验用于比较两种方法
- **效应量**：Cohen's d或h用于衡量实际显著性

完整实现McNemar检验、自助法置信区间和Cohen's h的代码，请参阅[references/experiment-patterns.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md)。

### 步骤4.3：明确核心结论

分析完成后，明确回答以下问题：
1. **主要发现是什么？** 用一句话概括。
2. **什么结果令你感到意外？** 意外结果往往能成就优秀论文。
3. **什么实验失败了？** 失败的实验可能最具信息量。如实报告失败能增强论文的可信度。
4. **需要进行哪些后续实验？** 结果往往会引发新的问题。

#### 处理负面或无显著结果

当你的假设错误或结果不确定时，你有三种选择：

| 情况 | 行动 | 适合投稿的会议 |
|-----------|--------|-----------|
| 假设错误但**原因**具有信息量 | 围绕“为什么”展开论文分析 | NeurIPS、ICML（如果分析严谨） |
| 方法未超越基线但**揭示了新发现** | 将贡献重新定义为理解/分析 | ICLR（重视理解）、研讨会论文 |
| 对流行观点得出明确的负面结果 | 撰写论文——领域需要了解 | NeurIPS数据集与基准、TMLR、研讨会 |
| 结果不确定，无明确结论 | 调整方向——进行不同实验或重新定义问题 | 不要强行撰写不存在的论文 |

**如何撰写负面结果论文：**
- 首先说明社区普遍相信的观点及其重要性
- 描述严谨的方法论（必须无懈可击——审稿人会严格审查）
- 用统计证据清晰地呈现无显著结果
- 分析**为什么**预期结果没有出现
- 讨论对领域的影响

**明确欢迎负面结果的会议**：NeurIPS（数据集与基准轨道）、TMLR、机器学习可复现性挑战赛、主要会议的研讨会。一些研讨会专门征集负面结果。

### 步骤4.4：创建图表和表格

**图表**：
- 所有图表使用矢量图（PDF）：`plt.savefig('fig.pdf')`
- 使用色盲友好调色板（Okabe-Ito或Paul Tol）
- 图表说明应自包含——读者无需参考正文即可理解
- 图表内部不要添加标题——说明文字已承担此功能

**表格**：
- 使用`booktabs` LaTeX宏包
- 加粗每个指标的最佳值
- 包含方向符号（越高/越低越好）
- 保持小数位数一致

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

### 步骤4.5：决定：进行更多实验还是开始撰写？

| 情况 | 行动 |
|-----------|--------|
| 核心主张得到支持，结果显著 | 进入第5阶段（撰写） |
| 结果不确定，需要更多数据 | 返回第2阶段（设计） |
| 意外发现提示新方向 | 返回第2阶段（设计） |
| 缺少审稿人会要求的一个消融实验 | 运行该实验，然后进入第5阶段 |
| 所有实验完成但部分失败 | 记录失败情况，进入第5阶段 |

### 步骤4.6：撰写实验日志（连接撰写阶段）

在进入论文撰写之前，创建一个结构化的实验日志，将结果与正文连接起来。这是实验与撰写之间最重要的桥梁——没有它，撰写智能体必须从原始结果文件中重新推导结论。

**创建`experiment_log.md`**，结构如下：

```markdown
# 实验日志
```

## 贡献（一句话）
[论文的主要主张]

## 实验运行

### 实验 1：[名称]
- **测试的主张**：[支持论文的哪一项主张]
- **设置**：[模型、数据集、配置、运行次数]
- **关键结果**：[包含具体数值的一句话]
- **结果文件**：results/exp1/final_info.json
- **生成的图表**：figures/exp1_comparison.pdf
- **意外发现**：[任何意想不到的结果]

### 实验 2：[名称]
...

## 图表
| 文件名 | 描述 | 所属章节 |
|----------|-------------|---------------------------|
| figures/main_comparison.pdf | 在基准测试 X 上比较所有方法的柱状图 | 结果，图 2 |
| figures/ablation.pdf | 移除组件 A、B、C 的消融实验 | 结果，图 3 |
...

## 失败的实验（如实记录）
- [尝试了什么，为何失败，它告诉我们什么]

## 开放问题
- [结果引发的、论文应解决的问题]
```

**这为何重要**：在撰写论文时，智能体（或委派的子智能体）可以加载 `experiment_log.md` 并与 LaTeX 模板一起使用，从而生成基于实际结果的第一稿。如果没有这种桥梁，写作智能体就必须解析原始的 JSON/CSV 文件并推断故事——这是出现幻觉或误报数字的常见来源。

**Git 规范**：将此日志与它所描述的结果一起提交。

---

## 迭代优化：策略选择

此流水线中的任何输出——论文草稿、实验脚本、分析——都可以通过迭代进行优化。自动推理研究为每种优化策略何时有效、何时失效提供了经验证据。请使用此部分选择正确的方法。

### 快速决策表

| 你的情况 | 策略 | 原因 |
|---------------|----------|-----|
| 中档模型 + 约束任务 | **自动推理** | 最佳点。生成-评估差距最大。基线会主动破坏弱模型的输出。 |
| 中档模型 + 开放任务 | 添加范围约束的 **自动推理** | 添加固定事实、结构或交付物以限定改进空间。 |
| 前沿模型 + 约束任务 | **自动推理** | 即使在最前沿模型中，也能在 2/3 的约束任务中获胜。 |
| 前沿模型 + 无约束任务 | **批判-修订** 或 **单次通过** | 自动推理排在最后。模型自我评估能力已足够强。 |
| 具体技术任务（系统设计） | **批判-修订** | 直接的“查找-修复”循环更高效。 |
| 模板填充任务（唯一正确结构） | **单次通过** 或 **保守策略** | 决策空间极小。迭代不会增加价值。 |
| 带测试用例的代码 | **自动推理（代码变体）** | 在修复前对*为何失败*进行结构化分析。恢复率 62% vs 43%。 |
| 非常弱的模型（Llama 8B 级别） | **单次通过** | 模型太弱，无法生成多样化的候选方案。应投资于生成质量。 |

### 生成-评估差距

**核心洞见**：自动推理的价值取决于模型的生成能力与其自我评估能力之间的差距。

```
模型等级        │ 生成能力 │ 自我评估能力 │ 差距    │ 自动推理价值
──────────────────┼────────────┼───────────┼────────┼─────────────────
弱（Llama 8B）   │ 差       │ 差      │ 小  │ 无 — 无法生成多样化的候选方案
中（Haiku 3.5）   │ 尚可     │ 差      │ 大  │ 最大 — 42/42 完美 Borda 分数
中（Gemini Flash）│ 尚可     │ 中等    │ 大  │ 高 — 在 2/3 任务中获胜
强（Sonnet 4）  │ 好       │ 尚可    │ 中等 │ 中等 — 在 3/5 任务中获胜
前沿（S4.6）   │ 优秀     │ 好      │ 小  │ 仅在约束条件下有效
```

这种差距是结构性的，而非暂时性的。随着成本下降，今天的前沿模型将成为明天的中档模型。最佳点会移动，但永远不会消失。

### 自动推理循环（摘要）

每一轮都会由三个独立的新鲜智能体生成三个候选方案：

1. **批评者** → 找出当前方案 A 的问题（不进行修复）
2. **作者 B** → 根据批评修订 A
3. **综合者** → 合并 A 和 B（随机化标签）
4. **评审小组** → 3 名盲审的链式思维（CoT）评审员通过 Borda 计数对 A、B、AB 进行排名
5. **收敛** → A 连续 k=2 轮获胜 → 完成

**关键参数：**
- k=2 收敛（k=1 过早，k=3 成本过高，且无质量提升）
- 始终使用 CoT 评审员（收敛速度快 3 倍）
- 作者温度 0.8，评审员温度 0.3
- 保守的平局决胜规则：当前方案在平局时获胜
- 每个角色都是一个独立的新鲜智能体，无共享上下文

### 应用于论文草稿

当通过自动推理优化论文本身时：
- **为批评者提供真实数据**：实际的实验数据、结果 JSON 文件、统计输出。否则，模型会编造虚假的消融研究和伪造的置信区间。
- **至少使用 3 个工作评审员**：一个损坏的评审解析器不会增加噪声——它会完全阻止均衡。
- **限定修订范围**：“解决这些特定弱点”，而不是“改进论文”。

### 失败模式

| 失败 | 检测 | 修复 |
|---------|-----------|-----|
| 不收敛（A 从未获胜） | A 在 20+ 轮中获胜率 <15% | 为任务添加范围约束 |
| 综合漂移 | 字数无限增长 | 约束结构和交付物 |
| 退化至低于单次通过 | 基线得分高于迭代输出 | 切换到单次通过；模型可能太弱 |
| 过拟合（代码） | 公共测试通过率高，私有测试通过率低 | 使用结构化分析，而不仅仅是测试反馈 |
| 损坏的评审员 | 解析失败导致评审小组少于 3 人 | 在继续之前修复解析器 |

完整提示、Borda 评分细节、模型选择指南、范围约束设计模式和计算预算参考，请参阅 [references/autoreason-methodology.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/autoreason-methodology.md)。

## 第五阶段：论文撰写

**目标**：撰写一篇完整且达到发表水平的论文。

### 大型项目的上下文管理

一个包含 50 多个实验文件、多个结果目录和大量文献笔记的论文项目很容易超出智能体的上下文窗口。请主动进行管理：

**每次撰写任务需要加载到上下文中的内容：**

| 撰写任务 | 加载到上下文中 | 请勿加载 |
|---------------|------------------|-------------|
| 撰写引言 | `experiment_log.md`、贡献声明、5-10 篇最相关的论文摘要 | 原始结果 JSON 文件、完整的实验脚本、所有文献笔记 |
| 撰写方法 | 实验配置、伪代码、架构描述 | 原始日志、其他实验的结果 |
| 撰写结果 | `experiment_log.md`、结果摘要表、图表清单 | 完整的分析脚本、中间数据 |
| 撰写相关工作 | 组织好的引用笔记（第 1.4 步输出）、.bib 文件 | 实验文件、原始 PDF 文件 |
| 修订阶段 | 完整论文草稿、审稿人的具体意见 | 其他所有内容 |

**原则：**
- **`experiment_log.md` 是主要的上下文桥梁** —— 它总结了撰写所需的所有内容，而无需加载原始数据文件（参见第 4.6 步）
- 在委派任务时，**一次只加载一个部分的上下文**。撰写“方法”部分的子智能体不需要文献综述笔记。
- **总结，不要包含原始文件。** 对于一个 200 行的结果 JSON 文件，加载一个 10 行的摘要表。对于一篇 50 页的相关论文，加载其 5 句话的摘要 + 您对其相关性的 2 行笔记。
- **对于非常大的项目**：创建一个 `context/` 目录，其中包含预压缩的摘要：
  ```
  context/
    contribution.md          # 1 句话
    experiment_summary.md    # 关键结果表（来自 experiment_log.md）
    literature_map.md        # 组织好的引用笔记
    figure_inventory.md      # 图表清单及其描述
  ```

### 叙事原则

**最重要的见解**：您的论文不是一系列实验的集合 —— 它是一个故事，由一个清晰的贡献支撑，并由证据支持。

每一篇成功的机器学习论文都围绕着 Neel Nanda 所说的“叙事”：一个简短的、严谨的、基于证据的技术故事，其结论是读者所关心的。

**三大支柱（必须在引言结尾处清晰明确）：**

| 支柱 | 描述 | 检验 |
|--------|-------------|------|
| **是什么** | 1-3 个具体的新颖主张 | 您能否用一句话陈述它们？ |
| **为什么** | 严谨的经验证据 | 实验是否将您的假设与其他替代方案区分开来？ |
| **那又怎样** | 为什么读者应该关心 | 这是否与一个公认的社区问题相关联？ |

**如果您无法用一句话陈述您的贡献，那么您还没有一篇论文。**

### 本指南背后的来源

这项技能综合了那些在顶级场所发表过大量论文的研究人员的写作理念。写作理念层最初由 [Orchestra Research](https://github.com/orchestra-research) 编译为 `ml-paper-writing` 技能。

| 来源 | 关键贡献 | 链接 |
|--------|-----------------|------|
| **Neel Nanda** (Google DeepMind) | 叙事原则，是什么/为什么/那又怎样的框架 | [如何撰写机器学习论文](https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers) |
| **Sebastian Farquhar** (DeepMind) | 5 句话摘要公式 | [如何撰写机器学习论文](https://sebastianfarquhar.com/on-research/2024/11/04/how_to_write_ml_papers/) |
| **Gopen & Swan** | 读者期望的 7 项原则 | [科学写作的科学](https://cseweb.ucsd.edu/~swanson/papers/science-of-writing.pdf) |
| **Zachary Lipton** | 词语选择，消除模糊表述 | [科学写作启发法](https://www.approximatelycorrect.com/2018/01/29/heuristics-technical-scientific-writing-machine-learning-perspective/) |
| **Jacob Steinhardt** (UC Berkeley) | 精确性，术语一致性 | [写作技巧](https://bounded-regret.ghost.io/) |
| **Ethan Perez** (Anthropic) | 微观层面的清晰度技巧 | [简单的论文写作技巧](https://ethanperez.net/easy-paper-writing-tips/) |
| **Andrej Karpathy** | 单一贡献聚焦 | 各种讲座 |

**要更深入地了解这些内容，请参阅：**
- [references/writing-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md) —— 包含示例的完整解释
- [references/sources.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/sources.md) —— 完整参考文献

### 时间分配

在以下每个部分上花费**大致相等的时间**：
1. 摘要
2. 引言
3. 图表
4. 其他所有内容加起来

**为什么？** 大多数审稿人在看到您的方法之前就已经形成了判断。读者接触您的论文的顺序是：标题 → 摘要 → 引言 → 图表 → 可能还有其他内容。

### 写作流程

```
论文写作清单：
- [ ] 第 1 步：定义一句话的贡献
- [ ] 第 2 步：起草图 1（核心思想或最令人信服的结果）
- [ ] 第 3 步：起草摘要（5 句话公式）
- [ ] 第 4 步：起草引言（最多 1-1.5 页）
- [ ] 第 5 步：起草方法
- [ ] 第 6 步：起草实验与结果
- [ ] 第 7 步：起草相关工作
- [ ] 第 8 步：起草结论与讨论
- [ ] 第 9 步：起草局限性（所有场所都要求）
- [ ] 第 10 步：规划附录（证明、额外实验、细节）
- [ ] 第 11 步：完成论文清单
- [ ] 第 12 步：最终审查
```

### 两轮细化模式

在使用 AI 智能体撰写时，请使用**两轮**方法（在 SakanaAI 的 AI-Scientist 流程中被证明有效）：

**第一轮 —— 撰写 + 每节即时细化：**
对于每一节，撰写一个完整的草稿，然后立即在同一上下文中对其进行细化。这可以在该节内容记忆犹新时捕捉到局部问题（清晰度、流畅性、完整性）。

**第二轮 —— 全局细化，包含完整论文上下文：**
在所有章节都起草完毕后，在了解完整论文的情况下重新审视每个章节。这可以捕捉到跨章节的问题：冗余、术语不一致、叙事流程以及某一节承诺了另一节未交付内容的空白。

```
第二轮细化提示（每节）：
“在完整论文的上下文中审查 [章节]。
- 它是否与论文的其他部分相符？是否与其他章节存在冗余？
- 术语是否与引言和方法保持一致？
- 是否有任何内容可以在不削弱信息的情况下被删除？
- 叙事是否从前一节流畅地过渡到下一节？
进行最小程度的、有针对性的编辑。不要从头开始重写。”
```

### LaTeX 错误清单

将此清单附加到每个细化提示中。这些是 LLM 编写 LaTeX 时最常见的错误：

```
LaTeX 质量清单（每次编辑后验证）：
- [ ] 没有未闭合的数学符号（$ 符号平衡）
- [ ] 仅引用存在的图表/表格（\ref 与 \label 匹配）
- [ ] 没有虚构的引用（\cite 与 .bib 中的条目匹配）
- [ ] 每个 \begin{env} 都有匹配的 \end{env}（尤其是 figure、table、algorithm）
- [ ] 没有 HTML 污染（</end{figure}> 而不是 \end{figure}）
- [ ] 在数学模式外没有未转义的下划线（在文本中使用 \_）
- [ ] 没有重复的 \label 定义
- [ ] 没有重复的章节标题
- [ ] 文本中的数字与实际实验结果匹配
- [ ] 所有图表都有标题和标签
- [ ] 没有导致 overfull hbox 警告的过长行
```

### 第 5.0 步：标题

标题是论文中阅读频率最高的元素。它决定了是否有人会点击进入摘要。

**好的标题**：
- 陈述贡献或发现：“Autoreason：迭代 LLM 细化何时有效及其失败原因”
- 突出一个令人惊讶的结果：“扩展数据受限的语言模型”（暗示您可以做到）
- 命名方法 + 它的作用：“DPO：语言模型的直接偏好优化”

**差的标题**：
- 过于笼统：“一种改进语言模型输出的方法”
- 过长：任何超过 ~15 个单词的标题
- 只有行话：“迭代随机策略细化的渐近收敛性”（这是给谁看的？）

**规则**：
- 如果您有方法名称，请包含它（以便引用）
- 包含审稿人会搜索的 1-2 个关键词
- 避免使用冒号，除非两边都承载意义
- 测试：审稿人能否仅从标题中了解领域和贡献？

### 第 5.1 步：摘要（5 句话公式）

来自 Sebastian Farquhar (DeepMind)：

```
1. 您取得了什么成就：“我们引入了...”、“我们证明了...”、“我们展示了...”
2. 为什么这很困难且重要
3. 您是如何做到的（使用专业关键词以提高可发现性）
4. 您有什么证据
5. 您最显著的数字/结果
```

**删除** 诸如“大型语言模型取得了显著成功...”之类的通用开头。

### 第 5.2 步：图 1

图 1 是大多数读者查看的第二件事（在摘要之后）。在撰写引言之前起草它 —— 这迫使您澄清核心思想。

| 图 1 类型 | 何时使用 | 示例 |
|---------------|-------------|---------|
| **方法图** | 新的架构或流程 | 显示您系统的 TikZ 流程图 |
| **结果预告** | 一个令人信服的结果讲述了整个故事 | 条形图：“我们的方法与基线”有明显的差距 |
| **问题说明** | 问题不直观 | 修复前/后显示您修复的故障模式 |
| **概念图** | 抽象贡献需要视觉基础 | 方法属性的 2x2 矩阵 |

**规则**：图 1 必须在不阅读任何文本的情况下也能理解。仅标题就应该能传达核心思想。有目的性地使用颜色 —— 不要只是为了装饰。

### 第 5.3 步：引言（最多 1-1.5 页）

必须包括：
- 清晰的问题陈述
- 简要的方法概述
- 2-4 个要点贡献列表（双栏格式中每点最多 1-2 行）
- 方法应从第 2-3 页开始

### 第 5.4 步：方法

启用可复现性实现：
- 概念性大纲或伪代码
- 列出所有超参数
- 提供足以复现的架构细节
- 呈现最终设计决策；消融实验见实验部分

### 步骤 5.5：实验与结果

每个实验需明确说明：
- **支持什么主张**
- 如何与主要贡献关联
- 观察要点：“蓝线显示 X，这证明了 Y”

要求：
- 误差条及其方法论（标准差 vs 标准误）
- 超参数搜索范围
- 计算基础设施（GPU 类型、总小时数）
- 随机种子设置方法

### 步骤 5.6：相关工作

按方法论组织，而非逐篇文献罗列。充分引用——审稿人很可能撰写过相关论文。

### 步骤 5.7：局限性（必需）

所有主要会议均要求此部分。坦诚有益：
- 审稿人被指示不得因诚实承认局限性而扣分
- 通过率先指出弱点 preempt 批评
- 解释为何局限性不会削弱核心主张

### 步骤 5.8：结论与讨论

**结论**（必需，0.5–1 页）：
- 用一句话重申贡献（措辞需与摘要不同）
- 总结关键发现（2–3 句，非列表形式）
- 意义：这对领域意味着什么？
- 未来工作：2–3 项具体后续步骤（避免模糊表述如“我们将 X 留待未来研究”）

**讨论**（可选，有时与结论合并）：
- 超越直接结果的更广泛意义
- 与其他子领域的联系
- 如实评估方法在何时有效/无效
- 实际部署考量

**切勿**在结论中引入新结果或主张。

### 步骤 5.9：附录策略

所有主要会议均允许无限附录，且附录对可复现性至关重要。结构如下：

| 附录章节 | 内容 |
|----------|------|
| **证明与推导** | 正文过长而无法容纳的完整证明。正文可陈述定理并注明“证明见附录 A”。 |
| **补充实验** | 消融实验、缩放曲线、各数据集分项结果、超参数敏感性分析 |
| **实现细节** | 完整超参数表格、训练细节、硬件规格、随机种子 |
| **数据集文档** | 数据收集过程、标注指南、许可信息、预处理流程 |
| **提示词与模板** | 使用的确切提示词（针对基于 LLM 的方法）、评估模板 |
| **人工评估** | 标注界面截图、给标注者的说明、IRB 详情 |
| **补充图表** | 各任务分项结果、轨迹可视化、失败案例示例 |

**规则**：
- 主论文必须自包含——不要求审稿人阅读附录
- 切勿将关键证据仅放在附录中
- 交叉引用：“完整结果见表 5（附录 B）”，而非仅写“见附录”
- 使用 `\appendix` 命令，然后使用 `\section{A: 证明}` 等

### 页数预算管理

当超出页数限制时：

| 削减策略 | 节省页数 | 风险 |
|----------|----------|------|
| 将证明移至附录 | 0.5–2 页 | 低——标准做法 |
| 精简相关工作 | 0.5–1 页 | 中——可能遗漏关键引用 |
| 合并表格与子图 | 0.25–0.5 页 | 低——通常提升可读性 |
| 谨慎使用 `\vspace{-Xpt}` | 0.1–0.3 页 | 若 subtle 则低，若明显则高 |
| 移除定性示例 | 0.5–1 页 | 中——审稿人喜欢示例 |
| 缩小图表尺寸 | 0.25–0.5 页 | 高——图表必须保持可读 |

**切勿**：减小字体、更改页边距、删除必需章节（局限性、广泛影响），或对正文使用 `\small`/`\footnotesize`。

### 步骤 5.10：伦理与广泛影响声明

多数会议现在要求或强烈建议包含伦理/广泛影响声明。这不是套话——审稿人会阅读，并可能标记引发 desk rejection 的伦理问题。

**应包含内容：**

| 组成部分 | 内容 | 要求方 |
|----------|------|--------|
| **积极社会影响** | 您的工作如何造福社会 | NeurIPS、ICML |
| **潜在负面影响** | 滥用风险、双重用途担忧、失败模式 | NeurIPS、ICML |
| **公平性与偏见** | 您的方法/数据是否存在已知偏见？ | 所有会议（隐含） |
| **环境影响** | 大规模训练的计算碳足迹 | ICML，NeurIPS 日益要求 |
| **隐私** | 您的工作是否使用或支持处理个人数据？ | ACL、NeurIPS |
| **LLM 披露** | 写作或实验中是否使用了 AI？ | ICLR（强制）、ACL |

**撰写声明：**

```latex
\section*{广泛影响声明}
% NeurIPS/ICML：结论之后，不计入页数限制

% 1. 积极应用（1–2 句）
本工作实现了 [具体应用]，可能使 [特定群体] 受益。

% 2. 风险与缓解措施（1–3 句，需具体）
[方法/模型] 可能被滥用于 [具体风险]。我们通过 [具体缓解措施，例如仅发布尺寸大于 X 的模型权重、包含安全过滤器、记录失败模式] 来缓解此问题。

% 3. 影响主张的局限性（1 句）
我们的评估局限于 [特定领域]；更广泛的部署需要 [具体额外工作]。
```

**常见错误：**
- 写“我们预见无负面影响”（几乎从不成立——审稿人不信任此说法）
- 模糊表述：“这可能被滥用”而未说明具体方式
- 忽略大规模工作的计算成本
- 忘记在要求披露的会议中说明 LLM 使用情况

**计算碳足迹**（针对训练密集型论文）：
```python
# 使用 ML CO2 Impact 工具方法论估算
gpu_hours = 1000  # 总 GPU 小时数
gpu_tdp_watts = 400  # 例如 A100 = 400W
pue = 1.1  # 电源使用效率（数据中心开销）
carbon_intensity = 0.429  # kg CO2/kWh（美国平均值；因地区而异）

energy_kwh = (gpu_hours * gpu_tdp_watts * pue) / 1000
carbon_kg = energy_kwh * carbon_intensity
print(f"能耗: {energy_kwh:.0f} kWh, 碳排放: {carbon_kg:.0f} kg CO2eq")
```

### 步骤 5.11：数据集表与模型卡（如适用）

如果您的论文引入了**新数据集**或**发布模型**，请包含结构化文档。审稿人日益期望此内容，且 NeurIPS 数据集与基准赛道强制要求。

**数据集表**（Gebru 等，2021）——置于附录中：

```
数据集文档（附录）：
- 动机：为何创建此数据集？它支持什么任务？
- 组成：实例是什么？有多少？数据类型是什么？
- 收集：数据如何收集？来源是什么？
- 预处理：应用了哪些清洗/过滤？
- 分发：数据集如何分发？使用何种许可？
- 维护：谁维护它？如何报告问题？
- 伦理考量：是否包含个人数据？是否获得同意？潜在危害？已知偏见？
```

**模型卡**（Mitchell 等，2019）——模型发布时置于附录中：

```
模型卡（附录）：
- 模型详情：架构、训练数据、训练流程
- 预期用途：主要用途、范围外用途
- 指标：基准上的评估指标与结果
- 伦理考量：已知偏见、公平性评估
- 局限性：已知失败模式、模型表现不佳的领域
```

### 写作风格

**句子级清晰度（Gopen & Swan 七原则）：**

| 原则 | 规则 |
|------|------|
| 主谓邻近 | 保持主语与谓语靠近 |
| 强调位置 | 将重点置于句末 |
| 主题位置 | 先放上下文，后放新信息 |
| 旧信息先于新信息 | 熟悉信息 → 陌生信息 |
| 一单位一功能 | 每段只讲一个观点 |
| 动词表动作 | 使用动词，而非名词化 |
| 上下文先于新信息 | 先铺垫，再呈现 |

**用词选择（Lipton, Steinhardt）：**
- 具体化：“准确率”而非“性能”
- 消除模糊限制：除非 genuinely uncertain，否则删除“可能”
- 全文术语一致
- 避免增量词汇：“开发”，而非“结合”

**完整写作指南含示例**：参见 [references/writing-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md)

### 使用 LaTeX 模板

**始终先复制整个模板目录，再在其中写作。**

```
模板设置清单：
- [ ] 步骤 1：将整个模板目录复制到新项目
- [ ] 步骤 2：验证模板本身能否编译（任何修改前）
- [ ] 步骤 3：阅读模板示例内容以理解结构
- [ ] 步骤 4：逐节替换示例内容
- [ ] 步骤 5：使用模板宏（检查导言区中的 \newcommand 定义）
- [ ] 步骤 6：仅在最后清理模板残留
```

**步骤 1：复制完整模板**

```bash
cp -r templates/neurips2025/ ~/papers/my-paper/
cd ~/papers/my-paper/
ls -la  # 应看到：main.tex, neurips.sty, Makefile 等
```

复制整个目录，而非仅 .tex 文件。模板包含样式文件 (.sty)、参考文献样式 (.bst)、示例内容和 Makefile。

**步骤 2：先验证模板可编译**

进行任何修改前：
```bash
latexmk -pdf main.tex
# 或手动：pdflatex main.tex && bibtex main && pdflatex main.tex && pdflatex main.tex
```

若未修改的模板无法编译，请先修复（通常是缺少 TeX 包——通过 `tlmgr install <package>` 安装）。

**步骤 3：保留模板内容作为参考**

不要立即删除示例内容。将其注释掉并用作格式参考：
```latex
% 模板示例（保留作参考）：
% \begin{figure}[t]
%   \centering
%   \includegraphics[width=0.8\linewidth]{example-image}
%   \caption{模板展示标题样式}
% \end{figure}

% 您的实际图表：
\begin{figure}[t]
  \centering
  \includegraphics[width=0.8\linewidth]{your-figure.pdf}
  \caption{您的标题遵循相同样式。}
\end{figure}
```

**步骤 4：逐节替换内容**

系统地推进：标题/作者 → 摘要 → 引言 → 方法 → 实验 → 相关工作 → 结论 → 参考文献 → 附录。每完成一个部分就进行编译。

**步骤 5：使用模板宏**

```latex
\newcommand{\method}{YourMethodName}  % 统一的方法命名
\newcommand{\eg}{e.g.,\xspace}        % 正确的缩写
\newcommand{\ie}{i.e.,\xspace}
```

### 模板陷阱

| 陷阱 | 问题 | 解决方案 |
|---------|---------|----------|
| 仅复制 `.tex` 文件 | 缺少 `.sty` 文件，无法编译 | 复制整个目录 |
| 修改 `.sty` 文件 | 破坏会议格式 | 切勿编辑样式文件 |
| 随意添加宏包 | 冲突，破坏模板 | 仅在必要时添加 |
| 过早删除模板内容 | 丢失格式参考 | 在完成前保留为注释 |
| 不频繁编译 | 错误累积 | 每完成一个部分就编译 |
| 使用栅格 PNG 图像 | 在论文中模糊 | 始终使用矢量 PDF，通过 `savefig('fig.pdf')` 保存 |

### 快速模板参考

| 会议 | 主文件 | 样式文件 | 页数限制 |
|------------|-----------|------------|------------|
| NeurIPS 2025 | `main.tex` | `neurips.sty` | 9 页 |
| ICML 2026 | `example_paper.tex` | `icml2026.sty` | 8 页 |
| ICLR 2026 | `iclr2026_conference.tex` | `iclr2026_conference.sty` | 9 页 |
| ACL 2025 | `acl_latex.tex` | `acl.sty` | 8 页（长文） |
| AAAI 2026 | `aaai2026-unified-template.tex` | `aaai2026.sty` | 7 页 |
| COLM 2025 | `colm2025_conference.tex` | `colm2025_conference.sty` | 9 页 |

**通用要求**：双盲评审，参考文献不计入页数，附录不限页数，必须使用 LaTeX。

模板位于 `templates/` 目录中。有关编译设置（VS Code、CLI、Overleaf、其他 IDE），请参阅 [templates/README.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/templates/README.md)。

### 表格和图形

**表格** — 使用 `booktabs` 实现专业格式：

```latex
\usepackage{booktabs}
\begin{tabular}{lcc}
\toprule
方法 & 准确率 $\uparrow$ & 延迟 $\downarrow$ \\
\midrule
基线 & 85.2 & 45ms \\
\textbf{我们的方法} & \textbf{92.1} & 38ms \\
\bottomrule
\end{tabular}
```

规则：
- 每个指标的最佳值加粗
- 包含方向符号（$\uparrow$ 越高越好，$\downarrow$ 越低越好）
- 数值列右对齐
- 小数精度保持一致

**图形**：
- **矢量图形**（PDF、EPS）用于所有图表和图示 — `plt.savefig('fig.pdf')`
- **栅格图像**（PNG，600 DPI）仅用于照片
- **色盲安全调色板**（Okabe-Ito 或 Paul Tol）
- 验证**灰度可读性**（8% 的男性有色觉缺陷）
- **图形内部无标题** — 图注承担此功能
- **自包含图注** — 读者无需阅读正文即可理解

### 会议重投稿

关于会议间转换，请参阅第 7 阶段（投稿准备）— 它涵盖了完整的转换流程、页数变化表格以及被拒后的指导。

### 专业 LaTeX 导言区

在任何论文中添加以下宏包以获得专业质量。它们与所有主要会议样式文件兼容：

```latex
% --- 专业宏包（在会议样式文件后添加） ---

% 排版
\usepackage{microtype}              % 微排版改进（突出、扩展）
                                     % 使文本明显更精致 — 始终包含

% 表格
\usepackage{booktabs}               % 专业表格线（\toprule, \midrule, \bottomrule）
\usepackage{siunitx}                % 一致的数字格式，小数对齐
                                     % 用法：\num{12345} → 12,345；\SI{3.5}{GHz} → 3.5 GHz
                                     % 表格对齐：S 列类型用于小数对齐的数字

% 图形
\usepackage{graphicx}               % 包含图形（\includegraphics）
\usepackage{subcaption}             % 带 (a)、(b)、(c) 标签的子图
                                     % 用法：\begin{subfigure}{0.48\textwidth} ... \end{subfigure}

% 图示和算法
\usepackage{tikz}                   % 可编程矢量图示
\usetikzlibrary{arrows.meta, positioning, shapes.geometric, calc, fit, backgrounds}
\usepackage[ruled,vlined]{algorithm2e}  % 专业伪代码
                                     % 替代方案：如果模板捆绑了 algorithmicx，则使用 \usepackage{algorithmicx}

% 交叉引用
\usepackage{cleveref}               % 智能引用：\cref{fig:x} → "图 1"
                                     % 必须在 hyperref 之后加载
                                     % 处理：图形、表格、章节、方程、算法

% 数学（通常由会议 .sty 包含，但请验证）
\usepackage{amsmath,amssymb}        % AMS 数学环境和符号
\usepackage{mathtools}              % 扩展 amsmath（dcases, coloneqq 等）

% 颜色（用于图形和图示）
\usepackage{xcolor}                 % 颜色管理
% Okabe-Ito 色盲安全调色板：
\definecolor{okblue}{HTML}{0072B2}
\definecolor{okorange}{HTML}{E69F00}
\definecolor{okgreen}{HTML}{009E73}
\definecolor{okred}{HTML}{D55E00}
\definecolor{okpurple}{HTML}{CC79A7}
\definecolor{okcyan}{HTML}{56B4E9}
\definecolor{okyellow}{HTML}{F0E442}
```

**注意事项：**
- `microtype` 是视觉质量上影响最大的单个宏包。它在亚像素级别调整字符间距。始终包含它。
- `siunitx` 通过 `S` 列类型处理表格中的小数对齐 — 消除手动间距。
- `cleveref` 必须在 `hyperref` 之后加载。大多数会议 .sty 文件会加载 hyperref，因此请将 cleveref 放在最后。
- 检查会议模板是否已加载了其中任何一个（尤其是 `algorithm`、`amsmath`、`graphicx`）。不要重复加载。

### siunitx 表格对齐

`siunitx` 使数字密集的表格更具可读性：

```latex
\begin{tabular}{l S[table-format=2.1] S[table-format=2.1] S[table-format=2.1]}
\toprule
方法 & {准确率 $\uparrow$} & {F1 $\uparrow$} & {延迟 (ms) $\downarrow$} \\
\midrule
基线         & 85.2  & 83.7  & 45.3 \\
消融（无 X）  & 87.1  & 85.4  & 42.1 \\
\textbf{我们的方法}    & \textbf{92.1} & \textbf{90.8} & \textbf{38.7} \\
\bottomrule
\end{tabular}
```

`S` 列类型自动按小数点对齐。`{}` 中的标题会转义对齐。

### 子图

并排图形的标准模式：

```latex
\begin{figure}[t]
  \centering
  \begin{subfigure}[b]{0.48\textwidth}
    \centering
    \includegraphics[width=\textwidth]{fig_results_a.pdf}
    \caption{数据集 A 上的结果。}
    \label{fig:results-a}
  \end{subfigure}
  \hfill
  \begin{subfigure}[b]{0.48\textwidth}
    \centering
    \includegraphics[width=\textwidth]{fig_results_b.pdf}
    \caption{数据集 B 上的结果。}
    \label{fig:results-b}
  \end{subfigure}
  \caption{我们的方法在两个数据集上的比较。(a) 显示了缩放行为，(b) 显示了消融结果。两者均使用 5 个随机种子。}
  \label{fig:results}
\end{figure}
```

使用 `\cref{fig:results}` → "图 1"，`\cref{fig:results-a}` → "图 1a"。

### 使用 algorithm2e 的伪代码

```latex
\begin{algorithm}[t]
\caption{使用评判小组的迭代优化}
\label{alg:method}
\KwIn{任务 $T$，模型 $M$，评判员 $J_1 \ldots J_n$，收敛阈值 $k$}
\KwOut{最终输出 $A^*$}
$A \gets M(T)$ \tcp*{初始生成}
$\text{连续次数} \gets 0$\;
\While{$\text{连续次数} < k$}{
  $C \gets \text{批评}(A, T)$ \tcp*{识别弱点}
  $B \gets M(T, C)$ \tcp*{针对批评的修订版本}
  $AB \gets \text{合成}(A, B)$ \tcp*{合并最佳元素}
  \ForEach{评判员 $J_i$}{
    $\text{排名}_i \gets J_i(\text{打乱}(A, B, AB))$ \tcp*{盲评排名}
  }
  $\text{获胜者} \gets \text{Borda 计数}(\text{排名})$\;
  \eIf{$\text{获胜者} = A$}{
    $\text{连续次数} \gets \text{连续次数} + 1$\;
  }{
    $A \gets \text{获胜者}$; $\text{连续次数} \gets 0$\;
  }
}
\Return{$A$}\;
\end{algorithm}
```

### TikZ 图示模式

TikZ 是机器学习论文中方法图示的标准。常见模式：

**流水线/流程图**（在机器学习论文中最常见）：

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
\caption{架构概览。编码器将输入 $x$ 映射到潜在表示 $z$，解码器对其进行重构。}
\label{fig:architecture}
\end{figure}
```

**比较/矩阵图**（用于展示方法变体）：

```latex
\begin{tikzpicture}[
  cell/.style={rectangle, draw, minimum width=2.5cm, minimum height=1cm, 
               align=center, font=\small},
  header/.style={cell, fill=gray!20, font=\small\bfseries},
]
  % 表头
  \node[header] at (0, 0) {方法};
  \node[header] at (3, 0) {是否收敛？};
  \node[header] at (6, 0) {质量如何？};
  % 行
  \node[cell] at (0, -1) {单次通过};
  \node[cell, fill=okgreen!15] at (3, -1) {不适用};
  \node[cell, fill=okorange!15] at (6, -1) {基线};
  \node[cell] at (0, -2) {批评+修订};
  \node[cell, fill=okred!15] at (3, -2) {否};
  \node[cell, fill=okred!15] at (6, -2) {下降};
  \node[cell] at (0, -3) {我们的方法};
  \node[cell, fill=okgreen!15] at (3, -3) {是 ($k$=2)};
  \node[cell, fill=okgreen!15] at (6, -3) {提升};
\end{tikzpicture}
```

**迭代循环图**（用于具有反馈的方法）：

```latex
\begin{tikzpicture}[
  node distance=2cm,
  box/.style={rectangle, draw, rounded corners, minimum height=0.8cm, 
              minimum width=1.8cm, align=center, font=\small},
  arrow/.style={-{Stealth[length=3mm]}, thick},
  label/.style={font=\scriptsize, midway, above},
]
  \node[box, fill=okblue!20] (gen) {生成器};
  \node[box, fill=okred!20, right=2.5cm of gen] (critic) {判别器};
  \node[box, fill=okgreen!20, below=1.5cm of $(gen)!0.5!(critic)$] (judge) {评审团};
  
  \draw[arrow] (gen) -- node[label] {输出 $A$} (critic);
  \draw[arrow] (critic) -- node[label, right] {评论 $C$} (judge);
  \draw[arrow] (judge) -| node[label, left, pos=0.3] {胜者} (gen);
\end{tikzpicture}
```

### 用于修订追踪的 latexdiff

对 rebuttal 至关重要——生成一个标记了版本之间差异的 PDF：

```bash
# 安装
# macOS: brew install latexdiff（或随 TeX Live 一起提供）
# Linux: sudo apt install latexdiff

# 生成差异文件
latexdiff paper_v1.tex paper_v2.tex > paper_diff.tex
pdflatex paper_diff.tex

# 对于多文件项目（使用 \input{} 或 \include{}）
latexdiff --flatten paper_v1.tex paper_v2.tex > paper_diff.tex
```

这将生成一个 PDF，其中删除的内容以红色删除线显示，新增的内容以蓝色显示——这是 rebuttal 补充材料的标准格式。

### 用于 matplotlib 的 SciencePlots

安装并使用以生成出版质量的图表：

```bash
pip install SciencePlots
```

```python
import matplotlib.pyplot as plt
import scienceplots  # 注册样式

# 使用 science 样式（类似 IEEE，简洁）
with plt.style.context(['science', 'no-latex']):
    fig, ax = plt.subplots(figsize=(3.5, 2.5))  # 单栏宽度
    ax.plot(x, y, label='我们的方法', color='#0072B2')
    ax.plot(x, y2, label='基线方法', color='#D55E00', linestyle='--')
    ax.set_xlabel('训练步数')
    ax.set_ylabel('准确率')
    ax.legend()
    fig.savefig('paper/fig_results.pdf', bbox_inches='tight')

# 可用样式：'science', 'ieee', 'nature', 'science+ieee'
# 如果在生成图表的机器上未安装 LaTeX，请添加 'no-latex'
```

**标准图表尺寸**（双栏格式）：
- 单栏：`figsize=(3.5, 2.5)` —— 适合一栏
- 双栏：`figsize=(7.0, 3.0)` —— 横跨两栏
- 正方形：`figsize=(3.5, 3.5)` —— 适用于热力图、混淆矩阵
```

## 阶段 6：自我审查与修订

**目标**：模拟投稿前的审查流程。尽早发现薄弱环节。

### 步骤 6.1：模拟审查（集成模式）

从多个角度生成审查意见。自动化研究流水线（尤其是 SakanaAI 的 AI-Scientist）的关键洞察：**由元审查者进行的集成审查比单次审查能产生更校准的反馈。**

**步骤 1：生成 N 份独立审查意见**（N=3-5）

使用不同的模型或温度设置。每位审查者只能看到论文，不能看到其他审查意见。**默认采用负面偏见**——大型语言模型在评估中存在众所周知的积极性偏见。

```
你是一位 [会议/期刊名称] 的专家审查者。你应当批判且严谨。
如果论文存在缺陷，或你对某个主张不确定，请明确指出
并在你的评分中反映出来。不要给予任何宽容。

请根据官方审查者指南审查这篇论文。评估以下方面：

1. 合理性（主张是否有充分支持？基线是否公平且强大？）
2. 清晰度（论文是否写得清晰？专家能否复现？）
3. 重要性（这对社区是否重要？）
4. 原创性（是否有新见解，而不仅仅是增量组合？）

请以结构化 JSON 格式提供你的审查意见：
{
  "summary": "2-3 句总结",
  "strengths": ["优点 1", "优点 2", ...],
  "weaknesses": ["缺点 1（最关键）", "缺点 2", ...],
  "questions": ["给作者的提问 1", ...],
  "missing_references": ["应引用的论文", ...],
  "soundness": 1-4,
  "presentation": 1-4,
  "contribution": 1-4,
  "overall": 1-10,
  "confidence": 1-5
}
```

**步骤 2：元审查（领域主席聚合）**

将所有 N 份审查意见提交给一位元审查者：

```
你是 [会议/期刊名称] 的领域主席。你收到了 [N] 份关于一篇论文的独立审查意见。你的任务是：

1. 识别所有审查者达成共识的优点和缺点
2. 通过直接检查论文来解决分歧
3. 生成一份代表聚合判断的元审查意见
4. 使用所有审查意见的平均数值评分

保持保守：如果审查者对某个缺点是否严重存在分歧，
在作者解决该问题之前，应将其视为严重问题。

审查意见：
[审查意见_1]
[审查意见_2]
...
```

**步骤 3：反思循环**（可选，2-3 轮）

每位审查者在看到元审查意见后可以完善自己的审查意见。使用提前终止哨兵：如果审查者回应“我已完成”（无修改），则停止迭代。

**审查模型选择**：审查最好使用最强的可用模型，即使你撰写论文时使用了较便宜的模型。审查模型应与撰写模型独立选择。

**少样本校准**：如果可用，请包含 1-2 份来自目标会议/期刊的真实已发表审查意见作为示例。这能显著改善评分校准。示例审查意见请参见 [references/reviewer-guidelines.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md)。

### 步骤 6.1b：视觉审查轮次（视觉语言模型）

纯文本审查会遗漏一整类问题：图形质量、布局问题、视觉一致性。如果你能使用具备视觉能力的模型，请对编译后的 PDF 单独运行一次**视觉审查**：

```
你正在审查这篇研究论文 PDF 的视觉呈现。请检查：
1. 图形质量：图表是否清晰可读？标签是否清晰？颜色是否可区分？
2. 图形-标题对齐：每个标题是否准确描述其对应的图形？
3. 布局问题：孤立的章节标题、尴尬的换页、图形远离其引用位置
4. 表格格式：列对齐、小数精度一致、最佳结果加粗
5. 视觉一致性：所有图形使用相同的配色方案，字体大小一致
6. 灰度可读性：如果以黑白打印，图形是否仍可理解？

对于每个问题，请指定页码和确切位置。
```

这能发现文本审查无法发现的问题：坐标轴标签无法辨认的图表、图形距离其首次引用位置 3 页、图 2 和图 5 的调色板不一致，或表格明显超出列宽。

### 步骤 6.1c：主张验证轮次

在模拟审查后，运行单独的验证轮次。这能发现审查者可能遗漏的事实错误：

```
主张验证协议：
1. 从论文中提取每一个事实主张（数字、比较、趋势）
2. 对于每个主张，追溯其支持的特定实验/结果
3. 验证论文中的数字与实际结果文件匹配
4. 将任何无法追溯来源的主张标记为 [VERIFY]
```

对于基于智能体的工作流：将验证委托给一个**全新的子智能体**，该智能体仅接收论文文本和原始结果文件。全新的上下文可防止确认偏见——验证者不会“记住”结果本应是什么。

### 步骤 6.2：反馈优先级排序

收集审查意见后，进行分类：

| 优先级 | 行动 |
|----------|--------|
| **关键**（技术缺陷、缺少基线） | 必须修复。可能需要新实验 → 返回阶段 2 |
| **高**（清晰度问题、缺少消融实验） | 应在此次修订中修复 |
| **中**（轻微写作问题、额外实验） | 如果时间允许则修复 |
| **低**（风格偏好、无关建议） | 记录以备将来工作 |

### 步骤 6.3：修订周期

对于每个关键/高优先级问题：
1. 确定受影响的具体章节
2. 起草修复方案
3. 验证修复不会破坏其他主张
4. 更新论文
5. 重新检查是否解决了审查者的担忧

### 步骤 6.4： rebuttal 撰写

在回应实际审查意见时（投稿后），rebuttal 是与修订不同的技能：

**格式**：逐点回应。对于每个审查者担忧：
```
> R1-W1: "论文缺少与方法 X 的比较。"

我们感谢审查者的这一建议。我们已在表 3（修订版）中添加了与方法 X 的比较。我们的方法在 [指标] 上优于 X 3.2 个百分点（p<0.05）。我们注意到 X 需要 2 倍于我们的计算预算。
```

**规则**：
- 回应每一个担忧——审查者会注意到你是否跳过某个问题
- 以最有力的回应开头
- 保持简洁直接——审查者要阅读数十份 rebuttal
- 如果你在 rebuttal 期间进行了实验，请包含新结果
- 永远不要防御性或轻蔑，即使面对微弱的批评
- 使用 `latexdiff` 生成显示更改的标记 PDF（参见专业 LaTeX 工具部分）
- 感谢审查者提供的具体、可操作的反馈（而非泛泛的赞扬）

**切勿**：在没有证据的情况下说“我们 respectfully disagree”。在没有解释的情况下说“这超出了范围”。通过只回应优点来忽略缺点。

### 步骤 6.5：论文演变追踪

在关键里程碑保存快照：
```
paper/
  paper.tex                    # 当前工作版本
  paper_v1_first_draft.tex     # 第一个完整草稿
  paper_v2_post_review.tex     # 模拟审查后
  paper_v3_pre_submission.tex  # 投稿前最终版
  paper_v4_camera_ready.tex    # 录用后最终版
```

---

## 阶段 7：投稿准备

**目标**：最终检查、格式化和投稿。

### 步骤 7.1：会议清单

每个会议都有强制性的检查清单。请仔细完成它们——不完整的清单可能导致直接拒稿。

请参见 [references/checklists.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/checklists.md) 获取：
- NeurIPS 16项论文检查清单
- ICML 更广泛影响 + 可复现性
- ICLR 大语言模型披露政策
- ACL 强制性局限性章节
- 通用投稿前检查清单

### 步骤 7.2：匿名化检查清单

双盲评审意味着审稿人无法知道论文作者是谁。请检查以下**所有**项目：

```
匿名化检查清单：
- [ ] PDF中任何地方均无作者姓名或所属机构
- [ ] 无致谢部分（录用后添加）
- [ ] 自引使用第三人称：“Smith等人[1]表明……”，而非“我们先前表明[1]……”
- [ ] 无指向个人仓库的GitHub/GitLab链接
- [ ] 代码链接使用匿名GitHub（https://anonymous.4open.science/）
- [ ] 图表中无机构标志或标识符
- [ ] 文件元数据中不含作者姓名（检查PDF属性）
- [ ] 无“我们先前的工作”或“在我们早期论文中”等表述
- [ ] 数据集名称不暴露机构（如有需要请重命名）
- [ ] 补充材料不含身份识别信息
```

**常见错误**：补充代码中可见Git提交信息、来自机构工具的带水印图表、上一稿中遗留的致谢、在匿名期前发布arXiv预印本。

### 步骤 7.3：格式验证

```
投稿前格式检查：
- [ ] 遵守页数限制（参考文献和附录除外）
- [ ] 所有图表为矢量图（PDF）或高分辨率位图（600 DPI PNG）
- [ ] 所有图表在灰度下可读
- [ ] 所有表格使用booktabs宏包
- [ ] 参考文献编译正确（引用中无“?”）
- [ ] 关键区域无溢出hbox
- [ ] 附录清晰标注并分离
- [ ] 包含必需章节（局限性、更广泛影响等）
```

### 步骤 7.4：预编译验证

在尝试运行 `pdflatex` **之前**执行这些自动化检查。在此阶段发现错误比调试编译器输出更快。

```bash
# 1. 使用chktex进行语法检查（捕获常见LaTeX错误）
# 抑制干扰性警告：-n2（句末）、-n24（括号）、-n13（句间）、-n1（命令终止）
chktex main.tex -q -n2 -n24 -n13 -n1

# 2. 验证所有引用均存在于.bib文件中
# 从.tex中提取\cite{...}，逐一检查.bib中是否存在
python3 -c "
import re
tex = open('main.tex').read()
bib = open('references.bib').read()
cites = set(re.findall(r'\\\\cite[tp]?{([^}]+)}', tex))
for cite_group in cites:
    for cite in cite_group.split(','):
        cite = cite.strip()
        if cite and cite not in bib:
            print(f'警告：\\\\cite{{{cite}}} 在 references.bib 中未找到')
"

# 3. 验证所有引用的图表文件是否存在于磁盘
python3 -c "
import re, os
tex = open('main.tex').read()
figs = re.findall(r'\\\\includegraphics(?:\[.*?\])?{([^}]+)}', tex)
for fig in figs:
    if not os.path.exists(fig):
        print(f'警告：图表文件未找到：{fig}')
"

# 4. 检查重复的\label定义
python3 -c "
import re
from collections import Counter
tex = open('main.tex').read()
labels = re.findall(r'\\\\label{([^}]+)}', tex)
dupes = {k: v for k, v in Counter(labels).items() if v > 1}
for label, count in dupes.items():
    print(f'警告：重复标签：{label}（出现 {count} 次）')
"
```

继续下一步前修复所有警告。对于基于智能体的工作流：将chktex输出反馈给智能体，并指示其进行最小化修复。

### 步骤 7.5：最终编译

```bash
# 清理构建
rm -f *.aux *.bbl *.blg *.log *.out *.pdf
latexmk -pdf main.tex

# 或手动编译（三次pdflatex + bibtex以确保交叉引用正确）
pdflatex -interaction=nonstopmode main.tex
bibtex main
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex

# 验证输出存在且包含内容
ls -la main.pdf
```

**如果编译失败**：解析 `.log` 文件以查找第一个错误。常见修复方法：
- “未定义的控制序列” → 缺少宏包或命令名拼写错误
- “缺少 $ 插入” → 数学符号位于数学模式之外
- “文件未找到” → 图表路径错误或缺少.sty文件
- “引用未定义” → .bib条目缺失或未运行bibtex

### 步骤 7.6：会议特定要求

| 会议 | 特殊要求 |
|------|----------|
| **NeurIPS** | 附录中包含论文检查清单，若被录用需提交通俗摘要 |
| **ICML** | 更广泛影响声明（位于结论之后，不计入页数限制） |
| **ICLR** | 必须披露大语言模型使用情况，签署互惠评审协议 |
| **ACL** | 强制性局限性章节，负责任NLP检查清单 |
| **AAAI** | 严格使用样式文件——禁止任何修改 |
| **COLM** | 针对语言模型社区框架化贡献 |

### 步骤 7.7：会议重投稿与格式转换

在不同会议间转换时，**切勿在不同模板间复制LaTeX导言区**：

```bash
# 1. 使用目标模板重新开始
cp -r templates/icml2026/ new_submission/

# 2. 仅复制内容部分（而非导言区）
#    - 摘要文本、章节内容、图表、表格、参考文献条目

# 3. 根据页数限制调整
# 4. 添加会议特定必需章节
# 5. 更新参考文献
```

| 从 → 到 | 页数变化 | 关键调整 |
|---------|----------|----------|
| NeurIPS → ICML | 9 → 8 | 删减1页，添加更广泛影响 |
| ICML → ICLR | 8 → 9 | 扩展实验，添加大语言模型披露 |
| NeurIPS → ACL | 9 → 8 | 按NLP惯例重构，添加局限性 |
| ICLR → AAAI | 9 → 7 | 大幅删减，严格遵守样式 |
| 任意 → COLM | 不定 → 9 | 针对语言模型重点重新框架化 |

删减页数时：将证明移至附录，压缩相关工作，合并表格，使用子图。  
扩展页数时：添加消融实验，扩展局限性，纳入额外基线，添加定性示例。

**被拒后**：在新版本中回应审稿人关切，但不要包含“修改说明”章节或引用先前投稿（双盲评审）。

### 步骤 7.8：最终出版准备（录用后）

录用后，准备最终出版版本：

```
最终出版检查清单：
- [ ] 去匿名化：添加作者姓名、所属机构、电子邮箱
- [ ] 添加致谢部分（资助、计算资源拨款、 helpful reviewers）
- [ ] 添加公开代码/数据URL（真实GitHub，而非匿名）
- [ ] 回应元审稿人的任何强制性修改意见
- [ ] 切换模板至最终出版模式（如适用——例如AAAI的\anon → \camera）
- [ ] 按会议要求添加版权声明
- [ ] 更新文本中所有“匿名”占位符
- [ ] 验证最终PDF编译无误
- [ ] 检查最终出版的页数限制（有时与投稿不同）
- [ ] 将补充材料（代码、数据、附录）上传至会议门户
```

### 步骤 7.9：arXiv与预印本策略

在机器学习领域，将论文发布至arXiv是标准做法，但涉及重要的时机和匿名性考量。

**时机决策树：**

| 情况 | 建议 |
|------|------|
| 投稿至双盲会议（NeurIPS、ICML、ACL） | 在投稿截止日期**之后**发布至arXiv，而非之前。提前发布 technically 可能违反匿名政策，尽管执行力度各异。 |
| 投稿至ICLR | ICLR明确允许投稿前发布arXiv。但不要在投稿本身中包含作者姓名。 |
| 论文已在arXiv，向新会议投稿 | 大多数会议均可接受。在评审期间**切勿**更新arXiv版本，尤其是包含回应审稿意见的修改。 |
| 研讨会论文 | 随时发布arXiv均可——研讨会通常非双盲。 |
| 希望确立优先权 | 若担心被抢先，请立即发布——但需接受匿名性 trade-off。 |

**arXiv分类选择**（ML/AI论文）：

| 分类 | 代码 | 最适合 |
|------|------|--------|
| 机器学习 | `cs.LG` | 通用ML方法 |
| 计算与语言 | `cs.CL` | NLP、语言模型 |
| 人工智能 | `cs.AI` | 推理、规划、智能体 |
| 计算机视觉 | `cs.CV` | 视觉模型 |
| 信息检索 | `cs.IR` | 搜索、推荐 |

**列出主分类 + 1-2个交叉分类。** 更多分类 = 更高可见度，但仅在真正相关时交叉分类。

**版本控制策略：**
- **v1**：初始投稿（与会议投稿一致）
- **v2**：录用后带最终出版修正的版本（在摘要中添加“accepted at [会议]”）
- 在评审期间不要发布v2，尤其是包含明显回应审稿反馈的修改

```bash
# 检查您的论文标题是否已在arXiv上被占用
# （选择标题前）
pip install arxiv
python -c "
import arxiv
results = list(arxiv.Search(query='ti:\"您的确切标题\"', max_results=5).results())
print(f'找到 {len(results)} 个匹配项')
for r in results: print(f'  {r.title} ({r.published.year})')
"
```

### 步骤 7.10：研究代码打包

发布干净、可运行的代码可显著提升引用量和审稿人信任度。将代码与最终出版投稿一并打包。

**仓库结构：**

```
your-method/
  README.md              # 安装、使用、复现说明
  requirements.txt       # 或conda的environment.yml
  setup.py               # 用于pip可安装包
  LICENSE                # 推荐MIT或Apache 2.0（适用于研究）
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

**研究代码README模板：**

```markdown
# [论文标题]

“[论文标题]”（会议年份）的官方实现。
```

## 设置
[设置环境的精确命令]

## 复现
要复现表1：`bash scripts/reproduce_table1.sh`  
要复现图2：`python scripts/make_figure2.py`

## 引用
[BibTeX 条目]
```

**预发布检查清单：**
```
- [ ] 代码在全新克隆的仓库中可运行（在干净机器或 Docker 中测试）
- [ ] 所有依赖项锁定至特定版本
- [ ] 无硬编码的绝对路径
- [ ] 仓库中不包含 API 密钥、凭据或个人数据
- [ ] README 涵盖环境搭建、结果复现和引用方式
- [ ] 存在 LICENSE 文件（MIT 或 Apache 2.0 以最大化复用性）
- [ ] 结果在预期方差范围内可复现
- [ ] .gitignore 排除数据文件、检查点、日志
```

**用于提交的匿名代码**（接收前）：
```bash
# 使用 Anonymous GitHub 进行双盲评审
# https://anonymous.4open.science/
# 上传你的仓库 → 获取匿名 URL → 放入论文
```

---

## 阶段 8：录用后交付物

**目标**：通过展示材料和社区互动最大化已录用论文的影响力。

### 步骤 8.1：会议海报

大多数会议要求设置海报环节。海报设计原则如下：

| 元素 | 指导原则 |
|------|----------|
| **尺寸** | 查阅会议场地要求（通常为 24"x36" 或 A0 竖版/横版） |
| **内容** | 标题、作者、一句话贡献、方法示意图、2–3 个关键结果、结论 |
| **布局流向** | 左上至右下（Z 字形）或分栏式 |
| **文本** | 标题在 3 米外可读，正文在 1 米外可读。不要使用完整段落——仅用项目符号。 |
| **图表** | 使用更高分辨率复用论文中的图表。放大关键结果图。 |

**工具**：LaTeX（`beamerposter` 包）、PowerPoint/Keynote、Figma、Canva。

**制作**：在会议前至少 2 周下单。布质海报更轻便，便于携带。许多会议现在也支持虚拟/数字海报。

### 步骤 8.2：会议口头报告 / 聚焦报告

如果获得口头或聚焦报告机会：

| 报告类型 | 时长 | 内容 |
|----------|------|------|
| **聚焦报告** | 5 分钟 | 问题、方法、一个关键结果。排练至恰好 5 分钟。 |
| **口头报告** | 15–20 分钟 | 完整故事：问题、方法、关键结果、消融实验、局限性。 |
| **研讨会报告** | 10–15 分钟 | 根据研讨会受众调整——可能需要更多背景介绍。 |

**幻灯片设计规则：**
- 每张幻灯片只讲一个观点
- 尽量减少文字——口头讲解细节，不要在幻灯片上显示
- 对关键图表进行动画处理，逐步构建理解
- 结尾包含一张“要点”幻灯片（用一句话总结贡献）
- 准备备用幻灯片以应对预期问题

### 步骤 8.3：博客文章 / 社交媒体

易于理解的摘要可显著提升影响力：

- **Twitter/X 推文串**：5–8 条推文。以结果开头，而非方法。包含图 1 和关键结果图。
- **博客文章**：800–1500 字。面向机器学习从业者撰写，而非审稿人。跳过形式化描述，强调直觉和实际意义。
- **项目页面**：HTML 页面，包含摘要、图表、演示、代码链接、BibTeX。使用 GitHub Pages。

**发布时间**：在论文出现在会议论文集或 arXiv 最终版后 1–2 天内发布。

---

## 研讨会与短文

研讨会论文和短文（例如 ACL 短文、Findings 论文）遵循相同流程，但具有不同的约束和期望。

### 研讨会论文

| 属性 | 研讨会 | 主会议 |
|------|--------|--------|
| **页数限制** | 4–6 页（通常） | 7–9 页 |
| **评审标准** | 对完整性的要求较低 | 必须完整、详尽 |
| **评审流程** | 通常为单盲或轻度评审 | 双盲、严格 |
| **重视内容** | 有趣想法、初步结果、立场性文章 | 具备强基线的完整实证研究 |
| **arXiv** | 可随时发布 | 时机很重要（参见 arXiv 策略） |
| **贡献门槛** | 新方向、有趣的负面结果、进行中工作 | 具有强有力证据的重大进展 |

**何时投稿至研讨会：**
- 希望在全篇论文前就早期想法获取反馈
- 负面结果不足以支撑 8+ 页
- 针对热点话题的立场性或观点性文章
- 复制研究或可复现性报告

### ACL 短文与 Findings

ACL 会议设有不同的投稿类型：

| 类型 | 页数 | 期望内容 |
|------|------|----------|
| **长文** | 8 | 完整研究、强基线、消融实验 |
| **短文** | 4 | 聚焦贡献：一个清晰观点并辅以证据 |
| **Findings** | 8 | 扎实的工作， narrowly 错过主会议 |

**短文策略**：选择一个主张并充分支持它。不要试图将长文压缩进 4 页——而是写一篇不同且更聚焦的论文。

---

## 超越实证机器学习的论文类型

上述主要流程针对实证机器学习论文。其他类型的论文需要不同的结构和证据标准。详见 [references/paper-types.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md)，其中提供了每种类型的详细指导。

### 理论论文

**结构**：引言 → 预备知识（定义、符号） → 主要结果（定理） → 证明草图 → 讨论 → 完整证明（附录）

**与实证论文的关键区别：**
- 贡献是一个定理、界限或不可能性结果——而非实验数值
- “方法”部分被“预备知识”和“主要结果”取代
- 证明是证据，而非实验（尽管理论的实证验证是受欢迎的）
- 正文中放证明草图，附录中放完整证明是标准做法
- 实验部分是可选的，但如果能验证理论预测，则可增强论文说服力

**证明写作原则：**
- 明确陈述所有假设下的定理
- 在正式证明前提供直观解释（“关键洞察是……”）
- 证明草图应在 0.5–1 页内传达主要思想
- 使用 `\begin{proof}...\end{proof}` 环境
- 对假设编号并在定理中引用：“在假设 1–3 下，……”

### 综述 / 教程论文

**结构**：引言 → 分类 / 组织结构 → 详细覆盖 → 开放问题 → 结论

**关键区别：**
- 贡献是组织、综合和识别开放问题——而非新方法
- 在范围内必须全面（审稿人会检查是否遗漏参考文献）
- 需要清晰的分类或组织框架
- 价值来自于各工作之间的联系，这是单篇论文无法提供的
- 最佳投稿 venue：TMLR（综述轨道）、JMLR、Foundations and Trends in ML、ACM Computing Surveys

### 基准测试论文

**结构**：引言 → 任务定义 → 数据集构建 → 基线评估 → 分析 → 预期用途与局限性

**关键区别：**
- 贡献是基准测试本身——它必须填补真正的评估空白
- 数据集文档是强制性的，而非可选（参见 Datasheets，步骤 5.11）
- 必须证明基准测试具有挑战性（基线不会饱和）
- 必须证明基准测试衡量的是其所声称的内容（构念效度）
- 最佳投稿 venue：NeurIPS 数据集与基准测试轨道、ACL（资源论文）、LREC-COLING

### 立场性论文

**结构**：引言 → 背景 → 论点 / 论证 → 支持证据 → 反方论点 → 影响

**关键区别：**
- 贡献是一个论证，而非结果
- 必须认真对待反方论点
- 证据可以是实证、理论或逻辑分析
- 最佳投稿 venue：ICML（立场轨道）、研讨会、TMLR

---

## Hermes 智能体集成

此技能专为 Hermes 智能体设计。它利用 Hermes 工具、委派、调度和记忆功能，覆盖完整的研究生命周期。

### 相关技能

将此技能与其他 Hermes 技能组合，用于特定阶段：

| 技能 | 使用时机 | 加载方式 |
|------|----------|----------|
| **arxiv** | 阶段 1（文献综述）：搜索 arXiv、生成 BibTeX、通过 Semantic Scholar 查找相关论文 | `skill_view("arxiv")` |
| **subagent-driven-development** | 阶段 5（起草）：并行撰写各节，采用两阶段评审（规范合规性 → 质量） | `skill_view("subagent-driven-development")` |
| **plan** | 阶段 0（设置）：执行前创建结构化计划。写入 `.hermes/plans/` | `skill_view("plan")` |
| **qmd** | 阶段 1（文献）：通过混合 BM25+向量搜索本地知识库（笔记、转录稿、文档） | 安装：`skill_manage("install", "qmd")` |
| **diagramming** | 阶段 4–5：创建基于 Excalidraw 的图表和架构图 | `skill_view("diagramming")` |
| **data-science** | 阶段 4（分析）：Jupyter 实时内核，用于交互式分析和可视化 | `skill_view("data-science")` |

**此技能 supersedes `ml-paper-writing`** —— 它包含 ml-paper-writing 的所有内容，以及完整的实验/分析流程和 autoreason 方法论。

### Hermes 工具参考

| 工具 | 在本流程中的用途 |
|------|------------------|
| **`terminal`** | LaTeX 编译（`latexmk -pdf`）、git 操作、启动实验（`nohup python run.py &`）、进程检查 |
| **`process`** | 后台实验管理：`process("start", ...)`、`process("poll", pid)`、`process("log", pid)`、`process("kill", pid)` |
| **`execute_code`** | 运行 Python 进行引用验证、统计分析、数据聚合。通过 RPC 访问工具。 |
| **`read_file`** / **`write_file`** / **`patch`** | 论文编辑、实验脚本、结果文件。对大型 .tex 文件使用 `patch` 进行定向编辑。 |
| **`web_search`** | 文献发现：`web_search("transformer attention mechanism 2024")` |
| **`web_extract`** | 获取论文内容、验证引用：`web_extract("https://arxiv.org/abs/2303.17651")` |
| **`delegate_task`** | **并行撰写各节** —— 为每一节生成独立的子智能体。也用于并发引用验证。 |
| **`todo`** | 跨会话的主要状态跟踪器。每次阶段转换后更新。 |
| **`memory`** | 跨会话持久化关键决策：贡献框架、会议选择、审稿人反馈。 |
| **`cronjob`** | 安排实验监控、截止日期倒计时、自动 arXiv 检查。 |
| **`clarify`** | 当受阻时向用户提出有针对性的问题（会议选择、贡献框架）。 |
| **`send_message`** | 当实验完成或草稿就绪时通知用户，即使用户不在聊天中。 |

### 工具使用模式

**实验监控**（最常见）：
```
terminal("ps aux | grep <pattern>")
→ terminal("tail -30 <logfile>")
→ terminal("ls results/")
→ execute_code("analyze results JSON, compute metrics")
→ terminal("git add -A && git commit -m '<descriptive message>' && git push")
→ send_message("Experiment complete: <summary>")
```

**并行撰写各节**（使用委派）：
```
delegate_task("根据这些实验脚本和配置起草“方法”部分。
  包括：伪代码、所有超参数、足以复现的架构细节。
  使用 LaTeX 并按照 neurips2025 模板约定撰写。")

delegate_task("起草“相关工作”部分。使用 web_search 和 web_extract 查找论文。
  通过 Semantic Scholar 验证每一个引用。按方法论分组。")

delegate_task("起草“实验”部分。读取 results/ 中的所有结果文件。
  说明每个实验支持哪个主张。包括误差条和显著性。")
```

每个委派任务作为一个**全新的子智能体**运行，无共享上下文——请在提示中提供所有必要信息。收集输出并整合。

**引用验证**（使用 execute_code）：
```python
# 在 execute_code 中：
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

### 使用 `memory` 和 `todo` 进行状态管理

**`memory` 工具** —— 持久化关键决策（有界：MEMORY.md 约 2200 字符）：

```
memory("add", "论文：autoreason。会议：NeurIPS 2025（9 页）。
  贡献：当生成-评估差距较大时，结构化 refinement 有效。
  关键结果：Haiku 42/42，Sonnet 3/5，S4.6 constrained 2/3。
  状态：阶段 5 —— 正在起草“方法”部分。")
```

在重大决策或阶段转换后更新 memory。这会在会话间持久化。

**`todo` 工具** —— 跟踪细粒度进度：

```
todo("add", "为 Sonnet 4.6 设计 constrained task 实验")
todo("add", "运行 Haiku 基线比较")
todo("add", "起草“方法”部分")
todo("update", id=3, status="in_progress")
todo("update", id=1, status="completed")
```

**会话启动协议：**
```
1. todo("list")                           # 检查当前任务列表
2. memory("read")                         # 回忆关键决策
3. terminal("git log --oneline -10")      # 检查最近提交
4. terminal("ps aux | grep python")       # 检查正在运行的实验
5. terminal("ls results/ | tail -20")     # 检查新结果
6. 向用户报告状态，询问方向
```

### 使用 `cronjob` 进行定时监控

使用 `cronjob` 工具安排周期性实验检查：

```
cronjob("create", {
  "schedule": "*/30 * * * *",  # 每 30 分钟
  "prompt": "检查实验状态：
    1. ps aux | grep run_experiment
    2. tail -30 logs/experiment_haiku.log
    3. ls results/haiku_baselines/
    4. 如果完成：读取结果，计算 Borda 分数，
       git add -A && git commit -m 'Add Haiku results' && git push
    5. 报告：结果表格、关键发现、下一步
    6. 如果无变化：回复 [SILENT]"
})
```

**[SILENT] 协议**：当自上次检查以来无任何变化时，精确回复 `[SILENT]`。这会抑制向用户发送通知。仅在有真正值得关注的变化时才报告。

**截止日期跟踪**：
```
cronjob("create", {
  "schedule": "0 9 * * *",  # 每天上午 9 点
  "prompt": "NeurIPS 2025 截止日期：5 月 22 日。今天是 {date}。
    剩余天数：{compute}。
    检查待办列表——我们是否按计划进行？
    如果 <7 天：警告用户剩余任务。"
})
```

### 通信模式

**何时通知用户**（通过 `send_message` 或直接响应）：
- 实验批次完成（附带结果表格）
- 意外发现或失败需要决策
- 草稿节已准备好供审阅
- 截止日期临近但任务未完成

**何时不通知**：
- 实验仍在运行，无新结果 → `[SILENT]`
- 常规监控无变化 → `[SILENT]`
- 不需要关注的中间步骤

**报告格式** —— 始终包含结构化数据：
```

## 实验：<名称>
状态：已完成 / 进行中 / 失败

| 任务 | 方法 A | 方法 B | 方法 C |
|------|---------|---------|---------|
| 任务 1 | 85.2 | 82.1 | **89.4** |

关键发现：<一句话总结>
下一步：<接下来做什么>
```

### 需要人工输入的决策点

当真正受阻时，使用 `clarify` 提出有针对性的问题：

| 决策 | 何时提问 |
|----------|-------------|
| 目标会议/期刊 | 在开始撰写论文之前（影响页数限制、论文框架） |
| 贡献框架 | 当存在多种有效框架时 |
| 实验优先级 | 当待办事项中的实验数量超过时间允许范围时 |
| 投稿准备情况 | 在最终投稿之前 |

**不要询问**（应主动做出选择并标记）：
- 用词选择、章节顺序
- 应突出显示哪些具体结果
- 引用完整性（使用找到的文献起草，并注明缺失部分）

---

## 审稿人评估标准

了解审稿人关注的内容有助于集中精力：

| 标准 | 他们检查的内容 |
|-----------|----------------|
| **质量** | 技术合理性、论点充分支持、基线公平 |
| **清晰度** | 写作清晰、专家可复现、符号一致 |
| **重要性** | 对社区的影响、推动理解 |
| **原创性** | 新见解（不要求新方法） |

**评分（NeurIPS 6 分制）：**
- 6：强烈推荐接收 — 开创性、无瑕疵
- 5：推荐接收 — 技术扎实、影响重大
- 4：边缘接收 — 扎实但评估有限
- 3：边缘拒绝 — 缺点超过优点
- 2：拒绝 — 技术缺陷
- 1：强烈拒绝 — 已知结果或伦理问题

详见 [references/reviewer-guidelines.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md)，了解详细指南、常见担忧和反驳策略。

---

## 常见问题与解决方案

| 问题 | 解决方案 |
|-------|----------|
| 摘要过于笼统 | 如果第一句话可以放在任何机器学习论文开头，则删除它。从你的具体贡献开始。 |
| 引言超过 1.5 页 | 将背景部分拆分为相关工作。将贡献要点前置。 |
| 实验缺乏明确主张 | 在每个实验前添加：“本实验旨在测试[具体主张]是否成立……” |
| 审稿人认为论文难以理解 | 添加路标语句，使用一致的术语，使图表标题自成一体。 |
| 缺少统计显著性 | 添加误差条、运行次数、统计检验、置信区间。 |
| 实验范围蔓延 | 每个实验必须对应一个具体主张。删除不相关的实验。 |
| 论文被拒，需要重新投稿 | 参见第 7 阶段的“会议重新投稿”。在不提及审稿意见的情况下解决审稿人的担忧。 |
| 缺少更广泛影响声明 | 参见步骤 5.10。大多数会议/期刊都要求提供。“没有负面影响”几乎从来都不可信。 |
| 人类评估被批评为薄弱 | 参见步骤 2.5 和 [references/human-evaluation.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md)。报告一致性指标、标注者详细信息、报酬。 |
| 审稿人质疑可复现性 | 发布代码（步骤 7.9），记录所有超参数，包括随机种子和计算细节。 |
| 理论论文缺乏直观解释 | 在正式证明之前添加带有通俗语言解释的证明草图。参见 [references/paper-types.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md)。 |
| 结果为负面/无效 | 参见第 4.3 阶段关于处理负面结果的内容。考虑研讨会、TMLR 或重新框架为分析。 |

---

## 参考文档

| 文档 | 内容 |
|----------|----------|
| [references/writing-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md) | Gopen & Swan 的 7 项原则、Perez 的微技巧、Lipton 的用词选择、Steinhardt 的精确性、图表设计 |
| [references/citation-workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/citation-workflow.md) | 引用 API、Python 代码、CitationManager 类、BibTeX 管理 |
| [references/checklists.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/checklists.md) | NeurIPS 16 项清单、ICML、ICLR、ACL 要求、通用投稿前清单 |
| [references/reviewer-guidelines.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md) | 评估标准、评分、常见担忧、反驳模板 |
| [references/sources.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/sources.md) | 所有写作指南、会议/期刊指南、API 的完整参考文献 |
| [references/experiment-patterns.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md) | 实验设计模式、评估协议、监控、错误恢复 |
| [references/autoreason-methodology.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/autoreason-methodology.md) | 自动推理循环、策略选择、模型指南、提示、范围约束、Borda 评分 |
| [references/human-evaluation.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md) | 人类评估设计、标注指南、一致性指标、众包质量控制、IRB 指导 |
| [references/paper-types.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md) | 理论论文（证明写作、定理结构）、综述论文、基准测试论文、立场论文 |

### LaTeX 模板

`templates/` 目录中包含以下模板：**NeurIPS 2025**、**ICML 2026**、**ICLR 2026**、**ACL**、**AAAI 2026**、**COLM 2025**。

编译说明请参见 [templates/README.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/templates/README.md)。

### 关键外部资源

**写作理念：**
- [Neel Nanda：如何撰写机器学习论文](https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers)
- [Sebastian Farquhar：如何撰写机器学习论文](https://sebastianfarquhar.com/on-research/2024/11/04/how_to_write_ml_papers/)
- [Gopen & Swan：科学写作的科学](https://cseweb.ucsd.edu/~swanson/papers/science-of-writing.pdf)
- [Lipton：科学写作启发法](https://www.approximatelycorrect.com/2018/01/29/heuristics-technical-scientific-writing-machine-learning-perspective/)
- [Perez：轻松撰写论文的技巧](https://ethanperez.net/easy-paper-writing-tips/)

**API：** [Semantic Scholar](https://api.semanticscholar.org/api-docs/) | [CrossRef](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | [arXiv](https://info.arxiv.org/help/api/basics.html)

**会议/期刊：** [NeurIPS](https://neurips.cc/Conferences/2025/PaperInformation/StyleFiles) | [ICML](https://icml.cc/Conferences/2025/AuthorInstructions) | [ICLR](https://iclr.cc/Conferences/2026/AuthorGuide) | [ACL](https://github.com/acl-org/acl-style-files)