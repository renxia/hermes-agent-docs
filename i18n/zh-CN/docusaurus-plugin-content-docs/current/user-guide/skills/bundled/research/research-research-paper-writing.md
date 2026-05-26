---
title: "研究论文写作——为NeurIPS/ICML/ICML撰写机器学习论文：从设计到提交"
sidebar_label: "研究论文写作"
description: "为NeurIPS/ICML/ICLR撰写机器学习论文：从设计到提交"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 研究论文写作

为NeurIPS/ICML/ICLR撰写机器学习论文：从设计到提交。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/research/research-paper-writing` |
| 版本 | `1.1.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `semanticscholar`, `arxiv`, `habanero`, `requests`, `scipy`, `numpy`, `matplotlib`, `SciencePlots` |
| 平台 | linux, macos |
| 标签 | `研究`, `论文写作`, `实验`, `机器学习`, `人工智能`, `NeurIPS`, `ICML`, `ICLR`, `ACL`, `AAAI`, `COLM`, `LaTeX`, `引用`, `统计分析` |
| 相关技能 | [`arxiv`](/user-guide/skills/bundled/research/research-arxiv), `ml-paper-writing`, [`subagent-driven-development`](/user-guide/skills/bundled/software-development/software-development-subagent-driven-development), [`plan`](/user-guide/skills/bundled/software-development/software-development-plan) |

## Reference: full SKILL.md

:::info
以下是 Hermes 加载此技能时的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 论文写作流水线

面向 **NeurIPS、ICML、ICLR、ACL、AAAI 和 COLM** 等顶级会议的端到端出版级机器学习/人工智能研究论文生产流水线。该技能涵盖完整的科研生命周期：实验设计、执行、监控、分析、论文撰写、审阅、修订和投稿。

这**不是线性流程**——而是一个迭代循环。结果会触发新的实验。审阅意见会触发新的分析。智能体必须处理这些反馈循环。

<!-- ascii-guard-ignore -->
<!-- ascii-guard-ignore -->
```
┌─────────────────────────────────────────────────────────────┐
│                    研究论文流水线                             │
│                                                             │
│  阶段 0：项目设置 ──► 阶段 1：文献综述                        │
│       │                          │                          │
│       ▼                          ▼                          │
│  阶段 2：实验设计         阶段 5：论文撰写 ◄──┐               │
│       Design                     │                   │      │
│       │                          ▼                   │      │
│       ▼                    阶段 6：自审               │      │
│  阶段 3：执行与监控       与修订 ──────────┘                  │
│       │                          │                          │
│       ▼                          ▼                          │
│  阶段 4：分析 ─────────► 阶段 7：投稿                        │
│                     （反馈至阶段 2 或 5）                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
<!-- ascii-guard-ignore-end -->
<!-- ascii-guard-ignore-end -->

---

## 何时使用该技能

在以下情况下使用该技能：
- **从现有代码库或想法开始撰写新研究论文**
- **设计和运行实验**以支持论文主张
- **撰写或修订**研究论文的任何章节
- **准备向特定会议或研讨会投稿**
- **应对审阅意见**，进行补充实验或修订
- **转换**论文的会议格式
- **撰写非实证论文**——理论、综述、基准或立场论文（参见[超越实证机器学习的论文类型](#paper-types-beyond-empirical-ml)）
- **设计人工评估**用于自然语言处理、人机交互或对齐研究
- **准备录用后的交付物**——海报、演示、代码发布

## 核心理念

1. **主动出击。** 提供完整的草稿，而非问题。科学家很忙——产出他们可以回应的具体内容，然后迭代。
2. **切勿虚构引用。** 人工智能生成的引用错误率约为 40%。始终以编程方式获取。将无法验证的引用标记为 `[CITATION NEEDED]`。
3. **论文是一个故事，而非实验的堆砌。** 每篇论文都需要一个用一句话表达的清晰贡献。如果做不到这一点，论文就还没有准备好。
4. **实验服务于主张。** 每个实验都必须明确说明它支持哪个主张。切勿运行与论文叙述无关的实验。
5. **尽早提交，频繁提交。** 每完成一批实验、每次论文草稿更新——都用描述性的消息提交。Git 日志就是实验历史。

### 主动性与协作

**默认模式：主动出击。先写草稿，带着草稿提问。**

| 信心水平 | 行动 |
|---------|------|
| **高**（代码库清晰，贡献明显） | 撰写完整草稿，交付，根据反馈迭代 |
| **中**（存在一定歧义） | 撰写草稿并标注不确定之处，继续推进 |
| **低**（存在重大未知） | 通过 `clarify` 提出 1-2 个针对性问题，然后撰写草稿 |

| 章节 | 自主撰写草稿？ | 在草稿中标注 |
|------|--------------|------------|
| 摘要 | 是 | "将贡献表述为 X——如有需要请调整" |
| 引言 | 是 | "强调了问题 Y——如有误请更正" |
| 方法 | 是 | "包含了细节 A、B、C——补充缺失部分" |
| 实验 | 是 | "突出了结果 1、2、3——如有需要请重新排序" |
| 相关工作 | 是 | "引用了论文 X、Y、Z——补充遗漏的" |

**仅在以下情况等待输入**：目标会议不明确、存在多种相互矛盾的表述方式、结果似乎不完整、明确要求先审阅。

---

## 阶段 0：项目设置

**目标**：建立工作空间，理解现有工作，确定贡献点。

### 步骤 0.1：探索代码仓库

```bash
# 理解项目结构
ls -la
find . -name "*.py" | head -30
find . -name "*.md" -o -name "*.txt" | xargs grep -l -i "result\|conclusion\|finding"
```

寻找以下内容：
- `README.md`——项目概述和主张
- `results/`、`outputs/`、`experiments/`——已有发现
- `configs/`——实验设置
- `.bib` 文件——已有引用
- 草稿文档或笔记

### 步骤 0.2：组织工作空间

建立一致的工作空间结构：

```
workspace/
  paper/               # LaTeX 源文件、图表、编译后的 PDF
  experiments/         # 实验运行脚本
  code/                # 核心方法实现
  results/             # 原始实验结果（自动生成）
  tasks/               # 任务/基准定义
  human_eval/          # 人工评估材料（如需要）
```

### 步骤 0.3：设置版本控制

```bash
git init  # 如果尚未初始化
git remote add origin <repo-url>
git checkout -b paper-draft  # 或 main
```

**Git 纪律**：每完成一批实验就提交一次，并附上描述性的消息。示例：
```
Add Monte Carlo constrained results (5 runs, Sonnet 4.6, policy memo task)
Add Haiku baseline comparison: autoreason vs refinement baselines at cheap model tier
```

### 步骤 0.4：确定贡献点

在撰写任何内容之前，先阐明：
- **是什么**：本文贡献的单一核心内容是什么？
- **为什么**：有哪些证据支持它？
- **有何意义**：为什么读者应该关注？

> 向科学家提议："根据我的理解，主要贡献是：[一句话]。关键结果表明 [Y]。这是您想要的表述方式吗？"

### 步骤 0.5：创建待办事项列表

使用 `todo` 工具创建结构化的项目计划：

```
研究论文待办事项：
- [ ] 定义一句话贡献
- [ ] 文献综述（相关工作 + 基线方法）
- [ ] 设计核心实验
- [ ] 运行实验
- [ ] 分析结果
- [ ] 撰写初稿
- [ ] 自审（模拟审稿人）
- [ ] 根据审阅意见修订
- [ ] 投稿准备
```

在整个项目过程中持续更新此列表。它作为跨会话的持久状态。

### 步骤 0.6：估算计算预算

在运行实验之前，估算总成本和时间：

```
计算预算清单：
- [ ] API 成本：（模型每 token 价格）×（每次运行预计 token 数）×（运行次数）
- [ ] GPU 小时：（每次实验时间）×（实验数量）×（随机种子数量）
- [ ] 人工评估成本：（标注人员数）×（小时数）×（时薪）
- [ ] 总预算上限和应急储备（增加 30-50% 用于重复运行）
```

在实验运行时跟踪实际支出：
```python
# 简单的成本跟踪模式
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

**预算紧张时**：在进行全面扫描之前，先运行小规模实验（1-2 个随机种子，任务子集）。使用较便宜的模型调试流程，然后切换到目标模型进行最终运行。

### 步骤 0.7：多作者协调

大多数论文有 3-10 位作者。尽早建立工作流程：

| 工作流程 | 工具 | 适用场景 |
|---------|------|---------|
| **Overleaf** | 基于浏览器 | 多位作者同时编辑，无 git 经验 |
| **Git + LaTeX** | 使用 `git`，通过 `.gitignore` 忽略辅助文件 | 技术团队，需要基于分支的审阅 |
| **Overleaf + Git 同步** | Overleaf 高级版 | 两全其美——实时协作加版本历史 |

**章节负责制**：为每个章节指定一位主要作者。其他人可以评论但不直接编辑。这样可以防止合并冲突和风格不一致。

```
作者协调清单：
- [ ] 确定章节负责分工（谁写什么）
- [ ] 建立共享工作空间（Overleaf 或 git 仓库）
- [ ] 确定符号约定（在任何人开始撰写之前）
- [ ] 安排内部审阅轮次（不仅仅在最后）
- [ ] 指定一人负责最终格式化
- [ ] 在创建图表前确定图表风格（颜色、字体、大小）
```

**需要尽早商定的 LaTeX 约定**：
- `\method{}` 宏用于一致的方法命名
- 引用风格：`\citet{}` 与 `\citep{}` 的使用
- 数学符号：小写粗体表示向量，大写粗体表示矩阵，等等
- 英式英语 vs 美式英语拼写

## 阶段一：文献综述

**目标**：寻找相关工作，确定基线，收集引用。

### 步骤 1.1：识别种子论文

从代码库中已引用的论文开始：

```bash
# 通过终端：
grep -r "arxiv\|doi\|cite" --include="*.md" --include="*.bib" --include="*.py"
find . -name "*.bib"
```

### 步骤 1.2：搜索相关工作

**加载 `arxiv` 技能**，以进行结构化的论文发现：`skill_view("arxiv")`。它提供 arXiv REST API 搜索、Semantic Scholar 引用图谱、作者资料和 BibTeX 生成功能。

使用 `web_search` 进行广泛发现，使用 `web_extract` 获取特定论文：

```
# 通过 web_search：
web_search("[主要技术] + [应用领域] site:arxiv.org")
web_search("[基线方法] 比较 ICML NeurIPS 2024")

# 通过 web_extract（用于特定论文）：
web_extract("https://arxiv.org/abs/2303.17651")
```

可尝试的其他搜索查询：

```
搜索查询：
- "[主要技术] + [应用领域]"
- "[基线方法] 比较"
- "[问题名称] 最先进"
- 来自现有引用的作者姓名
```

**推荐**：安装 **Exa MCP** 以进行实时学术搜索：
```bash
claude mcp add exa -- npx -y mcp-remote "https://mcp.exa.ai/mcp"
```

### 步骤 1.2b：深化搜索（先广度，后深度）

扁平化搜索（一轮查询）通常会遗漏重要的相关工作。采用受深度研究流程启发的迭代**广度优先，然后深度优先**模式：

```
迭代文献搜索：

第 1 轮（广度）：4-6 个并行查询，覆盖不同角度
  - "[方法] + [领域]"
  - "[问题名称] 最先进 2024 2025"
  - "[基线方法] 比较"
  - "[替代方法] vs [您的方法]"
  → 收集论文，提取关键概念和术语

第 2 轮（深度）：基于第 1 轮的发现生成后续查询
  - 第 1 轮论文中发现的新术语
  - 第 1 轮最相关结果所引用的论文
  - 需要调查的矛盾发现
  → 收集论文，识别剩余差距

第 3 轮（针对性）：填补特定差距
  - 第 1-2 轮识别出的缺失基线
  - 同期工作（最近 6 个月，同一问题）
  - 关键的负面结果或失败的方法
  → 当新查询返回的大部分是您已经看过的论文时停止
```

**何时停止**：如果一轮查询返回的论文中 >80% 已在您的收藏中，则搜索已饱和。通常 2-3 轮即足够。对于综述论文，预计需要 4-5 轮。

**对于基于智能体的工作流**：通过 `delegate_task` 并行委托每轮查询。收集结果，去重，然后基于组合的发现生成下一轮查询。

### 步骤 1.3：验证每条引用

**切勿从记忆生成 BibTeX。始终以编程方式获取。**

对于每条引用，请遵循强制性的 5 步流程：

```
引用验证（每条引用必做）：
1. 搜索 → 使用特定关键词查询 Semantic Scholar 或 Exa MCP
2. 验证 → 确认论文存在于 2 个以上来源中（Semantic Scholar + arXiv/CrossRef）
3. 获取 → 通过 DOI 内容协商获取 BibTeX（编程方式，非来自记忆）
4. 验证 → 确认您引用的观点确实出现在论文中
5. 添加 → 将已验证的 BibTeX 添加到参考文献
如果任何步骤失败 → 标记为 [需要引用]，通知科学家
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

如果无法验证引用：

```latex
\cite{PLACEHOLDER_author2024_verify_this}  % TODO: 验证此引用是否存在
```

**务必告知科学家**："我已将 [X] 条引用标记为需要验证的占位符。"

完整的 API 文档和完整的 `CitationManager` 类，请参阅 [references/citation-workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/citation-workflow.md)。

### 步骤 1.4：组织相关工作

按方法论分组，而非逐篇论文：

**正确示例**："一行工作使用了 X 的假设 [引用]，而我们使用 Y 的假设，因为..."
**错误示例**："Smith 等人引入了 X。Jones 等人引入了 Y。我们将两者结合。"

## 阶段 2：实验设计

**目标**：设计直接支持论文论点的实验。每个实验必须回答一个具体问题。

### 步骤 2.1：将论点映射到实验

创建一个明确的映射：

| 论点 | 实验 | 预期证据 |
|-------|-----------|-------------------|
| "我们的方法优于基线方法" | 主要比较（表 1） | 胜率、统计显著性 |
| "对较弱模型的效果更大" | 模型缩放研究 | 单调改进曲线 |
| "收敛需要范围约束" | 有约束 vs 无约束 | 收敛率比较 |

**规则**：如果实验没有对应的论点，就不要进行。

### 步骤 2.2：设计基线

强基线是区分被接收论文和被拒论文的关键。审稿人会问："他们是否与 X 进行了比较？"

标准基线类别：
- **朴素基线**：最简单可行的方法
- **强基线**：最佳已知现有方法
- **消融基线**：你的方法减去一个组件
- **计算匹配基线**：相同的计算预算，不同的分配

### 步骤 2.3：定义评估协议

在运行任何实验之前，请指定：
- **指标**：你衡量的是什么，方向符号（越高/越低越好）
- **聚合**：如何跨运行/任务组合结果
- **统计检验**：使用什么检验来确定显著性
- **样本量**：运行/问题/任务的数量

### 步骤 2.4：编写实验脚本

遵循来自成功研究流水线的以下模式：

**增量保存** —— 每个步骤后保存结果以便崩溃恢复：
```python
# 在每个问题/任务后保存
result_path = f"results/{task}/{strategy}/result.json"
if os.path.exists(result_path):
    continue  # 跳过已完成的工作
# ... 运行实验 ...
with open(result_path, 'w') as f:
    json.dump(result, f, indent=2)
```

**工件保存** —— 保存所有中间输出：
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

**关注点分离** —— 将生成、评估和可视化分开：
```
run_experiment.py              # 核心实验运行器
run_baselines.py               # 基线比较
run_comparison_judge.py        # 盲评
analyze_results.py             # 统计分析
make_charts.py                 # 可视化
```

完整设计模式、cron 监控和错误恢复请参见 [references/experiment-patterns.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md)。

### 步骤 2.5：设计人工评估（如适用）

许多 NLP、HCI 和对齐论文需要人工评估作为主要或补充证据。在运行自动化实验之前设计这一点 —— 人工评估通常有更长的准备时间（IRB 审批、标注员招聘）。

**何时需要人工评估：**
- 自动化指标无法捕捉你关心的内容（流畅性、有用性、安全性）
- 你的贡献是关于面向人类的特性（可读性、偏好、信任）
- NLP 领域的审稿人（ACL、EMNLP）在生成任务中期望这样做

**关键设计决策：**

| 决策 | 选项 | 指导 |
|----------|---------|----------|
| **标注员类型** | 专家、众包工作者、终端用户 | 匹配你的论点所需 |
| **量表** | 李克特量表 (1-5)、成对比较、排序 | 对于 LLM 输出，成对比李克特量表更可靠 |
| **样本量** | 每位标注员的项目数和总项目数 | 功效分析或至少 100 个项目，3+ 标注员 |
| **一致性指标** | Cohen's kappa, Krippendorff's alpha, ICC | 对于 >2 位标注员使用 Krippendorff's alpha；也报告原始一致性 |
| **平台** | Prolific, MTurk, 内部团队 | Prolific 保证质量；MTurk 规模大；内部团队具有领域专业知识 |

**标注指南清单：**
```
- [ ] 带有示例（好与坏）的清晰任务描述
- [ ] 模糊案例的决策标准
- [ ] 每个类别至少 2 个详细示例
- [ ] 注意力检查 / 黄金标准项目（占总项目的 10-15%）
- [ ] 资格任务或筛选轮次
- [ ] 每个项目的估计时间和公平补偿（>= 当地最低工资）
- [ ] 如果你的机构要求，需进行 IRB/伦理审查
```

**报告要求**（审稿人会检查所有这些）：
- 标注员数量及其资质
- 具体指标和数值的标注员间一致性
- 补偿细节（金额、估计时薪）
- 标注界面描述或截图（附录）
- 总标注时间

完整指南，包括人工评估数据的统计检验、众包质量控制模式和 IRB 指导，请参见 [references/human-evaluation.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md)。

---

## 阶段 3：实验执行与监控

**目标**：可靠地运行实验，监控进度，从失败中恢复。

### 步骤 3.1：启动实验

对于长时间运行的实验，使用 `nohup`：

```bash
nohup python run_experiment.py --config config.yaml > logs/experiment_01.log 2>&1 &
echo $!  # 记录 PID
```

**并行执行**：同时运行独立实验，但要注意 API 速率限制。同一 API 上 4 个以上的并发实验会相互减慢。

### 步骤 3.2：设置监控（Cron 模式）

对于长时间运行的实验，设置定期状态检查。cron 提示应遵循此模板：

```
监控提示模板：
1. 检查进程是否仍在运行：ps aux | grep <pattern>
2. 读取日志最后 30 行：tail -30 <logfile>
3. 检查已完成的 results：ls <result_dir>
4. 如果结果存在，读取并报告：cat <result_file>
5. 如果全部完成，提交：git add -A && git commit -m "<descriptive message>" && git push
6. 以结构化格式报告（包含关键指标的表格）
7. 回答本次实验的关键分析问题
```

**静默模式**：如果自上次检查以来没有变化，请回复 `[SILENT]` 以抑制对用户的通知。仅在有新情况时报告。

### 步骤 3.3：处理失败

常见失败模式及恢复方法：

| 失败 | 检测 | 恢复 |
|---------|-----------|----------|
| API 速率限制 / 额度耗尽 | 日志中出现 402/429 错误 | 等待，然后重新运行（脚本会跳过已完成的工作） |
| 进程崩溃 | PID 消失，结果不完整 | 从上一个检查点重新运行 |
| 难题超时 | 进程卡住，日志无进展 | 终止并跳过，在结果中注明 |
| 错误的模型 ID | 引用模型名称的错误 | 修复 ID 并重新运行 |

**关键**：脚本应始终检查现有结果并跳过已完成的工作。这使得重新运行安全且高效。

### 步骤 3.4：提交已完成的结果

每个实验批次完成后：

```bash
git add -A
git commit -m "添加 <实验名称>：<单行关键发现>"
git push
```

### 步骤 3.5：维护实验日志

Git 提交记录了发生了什么，但没有记录**探索树** —— 基于你学到的内容，决定下一步尝试什么。维护一个结构化的实验日志来捕捉这棵树：

```json
// experiment_journal.jsonl — 每次实验尝试追加一个条目
{
  "id": "exp_003",
  "parent": "exp_001",
  "timestamp": "2025-05-10T14:30:00Z",
  "hypothesis": "添加范围约束将修复 exp_001 的收敛失败",
  "plan": "使用 max_tokens=2000 和固定结构模板重新运行 autoreason",
  "config": {"model": "haiku", "strategy": "autoreason", "max_tokens": 2000},
  "status": "completed",
  "result_path": "results/exp_003/",
  "key_metrics": {"win_rate": 0.85, "convergence_rounds": 3},
  "analysis": "范围约束修复了收敛问题。胜率从 0.42 跃升至 0.85。",
  "next_steps": ["尝试对 Sonnet 应用相同约束", "测试不使用结构模板"],
  "figures": ["figures/exp003_convergence.pdf"]
}
```

**为什么是日志而不仅仅是 Git？** Git 跟踪文件更改。日志跟踪推理：为什么你尝试 X，你学到了什么，这对下一个实验意味着什么。在撰写论文时，这棵树对于方法部分（"我们观察到 X，这促使了 Y"）和诚实报告失败极为宝贵。

**选择最佳路径**：当日志显示分支树（exp_001 → exp_002a, exp_002b, exp_003）时，找出最能支持论文论点的路径。在附录中将死胡同分支记录为消融实验或负面结果。

**每次实验的代码快照**：每次运行后复制实验脚本：
```bash
cp experiment.py results/exp_003/experiment_snapshot.py
```
这使得即使在后续代码更改后也能精确重现。

---

## 第四阶段：结果分析

**目标**：提取发现，计算统计数据，识别核心结论。

### 步骤 4.1：汇总结果

编写分析脚本，用于：
1.  从一个批次中加载所有结果文件
2.  计算单项任务和整体指标
3.  生成摘要表格

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

# 计算整体指标
for strategy, tasks in results.items():
    scores = [t["score"] for t in tasks.values()]
    print(f"{strategy}: mean={np.mean(scores):.1f}, std={np.std(scores):.1f}")
```

### 步骤 4.2：统计显著性

始终计算：
- **误差线**：标准差或标准误，并具体指明使用的是哪一个。
- **置信区间**：关键结果的 95% 置信区间。
- **成对检验**：使用 McNemar 检验比较两种方法。
- **效应量**：Cohen's d 或 h，用于评估实际显著性。

完整的 McNemar 检验、引导法置信区间以及 Cohen's h 的实现，请参见 [references/experiment-patterns.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md)。

### 步骤 4.3：识别核心结论

分析完成后，明确回答：
1.  **主要发现是什么？** 用一句话陈述。
2.  **什么让你感到惊讶？** 意外的结果往往能成就最好的论文。
3.  **什么失败了？** 失败的实验可能最具启发性。诚实报告失败能增强论文的说服力。
4.  **需要哪些后续实验？** 结果常常会引发新的问题。

#### 处理阴性或无效结果

当你的假设错误或结果不确定时，你有三个选择：

| 情况 | 操作 | 适合的会议/期刊 |
| :--- | :--- | :--- |
| 假设错误，但 **原因** 具有启发性 | 围绕分析“为什么”来构建论文 | NeurIPS, ICML (如果分析严谨) |
| 方法未超越基线，但 **揭示了新信息** | 将贡献重新定义为理解/分析 | ICLR (重视理解), Workshop 论文 |
| 对流行主张得出清晰的阴性结果 | 将其写出来 —— 该领域需要知道 | NeurIPS Datasets & Benchmarks, TMLR, Workshop |
| 结果不确定，没有清晰的核心结论 | 转向 —— 进行不同的实验或重新构建框架 | 不要强行撰写一篇不成熟的论文 |

**如何撰写一篇阴性结果的论文：**
- 开篇介绍业界普遍相信的观点及其验证的重要性
- 描述你严谨的方法论（必须无懈可击 —— 审稿人会审查得更严格）
- 用统计证据清晰呈现无效结果
- 分析 **为什么** 预期结果没有出现
- 讨论对该领域的意义

**明确欢迎阴性结果的平台**：NeurIPS (Datasets & Benchmarks 赛道), TMLR, ML Reproducibility Challenge, 各大会议的 Workshop。一些 Workshop 专门征集阴性结果。

### 步骤 4.4：创建图表

**图表**：
- 对所有绘图使用矢量图形 (PDF)：`plt.savefig('fig.pdf')`
- 使用色盲友好的调色板（Okabe-Ito 或 Paul Tol）
- 标题文本应自包含 —— 读者无需阅读正文即可理解
- 图内无标题 —— 标题功能由图注承担

**表格**：
- 使用 LaTeX 的 `booktabs` 宏包
- 将每个指标的最佳值**加粗**显示
- 包含方向符号（↑ 表示越高越好，↓ 表示越低越好）
- 保持小数位数一致

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

### 步骤 4.5：决定：继续实验还是开始写作？

| 情况 | 操作 |
| :--- | :--- |
| 核心主张得到支持，结果显著 | 进入第五阶段（写作） |
| 结果不确定，需要更多数据 | 返回第二阶段（设计） |
| 意外发现指向新方向 | 返回第二阶段（设计） |
| 缺少一个审稿人可能会问的消融实验 | 做完它，然后进入第五阶段 |
| 所有实验完成但部分失败 | 记录失败项，进入第五阶段 |

### 步骤 4.6：撰写实验日志（通向写作的桥梁）

在开始撰写论文之前，创建一个结构化的实验日志，将结果与文本连接起来。这是实验与写作之间最重要的连接组织 —— 没有它，写作智能体就需要从原始结果文件中重新推导故事。

**创建 `experiment_log.md`**，其结构如下：

```markdown
# 实验日志

## 贡献（一句话）
[论文的核心主张]

## 运行实验

### 实验 1: [名称]
- **测试的主张**: [支持论文的哪项主张]
- **设置**: [模型、数据集、配置、运行次数]
- **关键结果**: [一句话说明，包含数字]
- **结果文件**: results/exp1/final_info.json
- **生成的图表**: figures/exp1_comparison.pdf
- **意外发现**: [任何未预料到的结果]

### 实验 2: [名称]
...

## 图表
| 文件名 | 描述 | 所属章节 |
|--------|------|----------|
| figures/main_comparison.pdf | 比较所有方法在基准 X 上的柱状图 | 结果，图 2 |
| figures/ablation.pdf | 移除组件 A、B、C 的消融研究 | 结果，图 3 |
...

## 失败实验（为诚实起见记录）
- [尝试了什么，为什么失败，这告诉我们什么]

## 开放性问题
- [结果引发的、论文应讨论的任何问题]
```

**重要性**：在撰写时，智能体（或委托的子智能体）可以加载 `experiment_log.md` 并结合 LaTeX 模板，生成一份基于实际结果的初稿。如果没有这个桥梁，撰写智能体必须解析原始的 JSON/CSV 文件并推断故事线——这是产生幻觉或误报数字的常见原因。

**Git 纪律**：将此日志与其描述的结果一并提交。

---

## 迭代优化：策略选择

此流程中的任何输出——论文草稿、实验脚本、分析——都可以进行迭代优化。自动推理的研究为每种优化策略何时有效、何时失效提供了经验证据。使用此部分来选择正确的方法。

### 快速决策表

| 您的情况 | 策略 | 原因 |
|----------|------|------|
| 中等能力模型 + 约束任务 | **自动推理** | 最佳契合点。生成-评估差距最大。基线会主动破坏弱模型输出。 |
| 中等能力模型 + 开放任务 | **自动推理** 并添加范围约束 | 添加固定事实、结构或可交付成果以限制改进空间。 |
| 前沿模型 + 约束任务 | **自动推理** | 即使在前沿水平，也能赢得 2/3 的约束任务。 |
| 前沿模型 + 无约束任务 | **批评修订** 或 **单次生成** | 自动推理排在最后。模型自我评估能力足够好。 |
| 具体技术任务（系统设计） | **批评修订** | 直接的查找-修复循环更高效。 |
| 模板填充任务（一种正确结构） | **单次生成** 或 **保守策略** | 决策空间极小。迭代不增加价值。 |
| 带测试用例的代码 | **自动推理（代码变体）** | 在修复前分析 *为什么* 失败的结构化分析。恢复率 62% vs 43%。 |
| 非常弱的模型（Llama 8B 级） | **单次生成** | 模型太弱，无法生成多样化的候选方案。投资于生成质量。 |

### 生成-评估差距

**核心洞察**：自动推理的价值取决于模型的生成能力与其自我评估能力之间的差距。

<!-- ascii-guard-ignore -->
```
模型等级        │ 生成能力 │ 自我评估 │ 差距    │ 自动推理价值
──────────────────┼────────────┼───────────┼────────┼─────────────────
弱（Llama 8B）   │ 差        │ 差        │ 小      │ 无——无法生成多样候选
中（Haiku 3.5）   │ 尚可      │ 差        │ 大      │ 最大——42/42 完美波达计数
中（Gemini Flash）│ 尚可      │ 中等      │ 大      │ 高——赢得 2/3
强（Sonnet 4）    │ 好        │ 尚可      │ 中等    │ 中等——赢得 3/5
前沿（S4.6）      │ 优秀      │ 好        │ 小      │ 仅在有约束时有效
```
<!-- ascii-guard-ignore-end -->

这种差距是结构性的，而非暂时性的。随着成本下降，今天的前沿将成为明天的中等能力。最佳契合点会移动，但永远不会消失。

### 自动推理循环（摘要）

每次传递都从独立的智能体产生三个候选方案：

1. **批评者** → 找出当前方案 A 的问题（不修复）
2. **作者 B** → 根据批评修订 A
3. **合成器** → 合并 A 和 B（随机化标签）
4. **评审团** → 3 位盲审的思维链评审员通过波达计数对 A、B、AB 进行排名
5. **收敛** → A 连续 k=2 次获胜 → 完成

**关键参数：**
- k=2 收敛（k=1 过早，k=3 过于昂贵且无质量提升）
- 始终使用思维链评审员（收敛速度快 3 倍）
- 作者温度 0.8，评审员温度 0.3
- 保守决胜规则：平局时当前方案获胜
- 每个角色都是独立的智能体，无共享上下文

### 应用于论文草稿

通过自动推理优化论文本身时：
- **向批评者提供真实数据**：实际的实验数据、结果 JSON、统计输出。没有这些，模型会臆造出伪造的消融研究和虚假的置信区间。
- **至少使用 3 个有效的评审员**：一个解析失败的评审员不会增加噪音——它会完全阻碍达到平衡。
- **范围限定修订**：“解决这些特定弱点”，而不是“改进论文”。

### 失败模式

| 失败 | 检测方法 | 修复方法 |
|------|----------|----------|
| 无收敛（A 从未获胜） | 在 20+ 次传递中，A 获胜率 &lt;15% | 向任务添加范围约束 |
| 合成漂移 | 字数无限制增长 | 限制结构和可交付成果 |
| 退化至低于单次生成 | 基线得分高于迭代输出 | 切换到单次生成；模型可能太弱 |
| 过拟合（代码） | 公开测试通过率高，私有测试通过率低 | 使用结构化分析，而不仅仅是测试反馈 |
| 评审员故障 | 解析失败导致评审团人数低于 3 | 在继续前修复解析器 |

参见 [references/autoreason-methodology.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/autoreason-methodology.md) 获取完整提示、波达计数细节、模型选择指南、范围约束设计模式和计算预算参考。

---

## 第五阶段：论文撰写

**目标**：撰写一篇完整、可发表的论文。

### 大型项目的上下文管理

一个包含50多个实验文件、多个结果目录和大量文献笔记的论文项目，很容易超出智能体的上下文窗口。需要主动管理：

**按撰写任务加载到上下文的内容：**

| 撰写任务 | 加载到上下文的内容 | 不要加载的内容 |
|----------|------------------|----------------|
| 撰写引言 | `experiment_log.md`、贡献声明、5-10篇最相关论文摘要 | 原始结果JSON文件、完整实验脚本、所有文献笔记 |
| 撰写方法 | 实验配置、伪代码、架构描述 | 原始日志、其他实验的结果 |
| 撰写结果 | `experiment_log.md`、结果汇总表、图表列表 | 完整的分析脚本、中间数据 |
| 撰写相关工作 | 整理好的引文笔记（步骤1.4的输出）、`.bib`文件 | 实验文件、原始PDF |
| 修订轮次 | 完整的论文草稿、具体的审稿人意见 | 其他所有内容 |

**原则：**
- **`experiment_log.md`是主要的上下文桥梁** — 它总结了撰写所需的所有内容，而无需加载原始数据文件（参见步骤4.6）
- **委托时一次加载一个部分的上下文**。负责撰写"方法"部分的子智能体不需要文献综述笔记。
- **总结，不要包含原始文件**。对于一个200行的结果JSON，加载一个10行的汇总表。对于一篇50页的相关论文，加载5句话的摘要加上你关于其相关性的2行备注。
- **对于非常大的项目**：创建一个 `context/` 目录，存放预先压缩好的摘要：
  ```
  context/
    contribution.md          # 一句话
    experiment_summary.md    # 关键结果表（来自experiment_log.md）
    literature_map.md        # 整理好的引文笔记
    figure_inventory.md      # 图表清单及描述
  ```

### 叙事原则

**最关键的一个洞察**：你的论文不是一系列实验的集合 — 而是一个有明确贡献并得到证据支持的故事。

每一项成功的机器学习论文都围绕着尼尔·南达（Neel Nanda）所说的"叙事"展开：一个简短、严谨、基于证据的技术故事，其要点是读者所关心的。

**三大支柱（在引言结束时必须清晰明确）：**

| 支柱 | 描述 | 检验方法 |
|------|------|----------|
| **是什么** | 1-3个具体的新颖主张 | 你能用一句话陈述它们吗？ |
| **为什么** | 严谨的经验证据 | 实验是否将你的假设与其他替代方案区分开来？ |
| **所以呢** | 读者为什么应该关心 | 这是否与一个公认的社区问题相关？ |

**如果你不能用一句话陈述你的贡献，那么你还没有一篇论文。**

### 本指南的来源

本技能综合了在顶级会议上有丰富发表记录的研究人员的写作理念。写作理念层最初由 [Orchestra Research](https://github.com/orchestra-research) 编译为 `ml-paper-writing` 技能。

| 来源 | 核心贡献 | 链接 |
|------|----------|------|
| **尼尔·南达** (Google DeepMind) | 叙事原则，"是什么/为什么/所以呢"框架 | [如何撰写机器学习论文](https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers) |
| **塞巴斯蒂安·法夸尔** (DeepMind) | 5句话摘要公式 | [如何撰写机器学习论文](https://sebastianfarquhar.com/on-research/2024/11/04/how_to_write_ml_papers/) |
| **Gopen & Swan** | 读者期望的7个原则 | [科学写作的科学](https://cseweb.ucsd.edu/~swanson/papers/science-of-writing.pdf) |
| **扎卡里·利普顿** | 用词选择，消除模糊表述 | [技术科学写作启示录](https://www.approximatelycorrect.com/2018/01/29/heuristics-technical-scientific-writing-machine-learning-perspective/) |
| **雅各布·斯坦哈特** (UC Berkeley) | 精确性，术语一致性 | [写作技巧](https://bounded-regret.ghost.io/) |
| **伊桑·佩雷兹** (Anthropic) | 微观层面清晰性技巧 | [轻松论文写作技巧](https://ethanperez.net/easy-paper-writing-tips/) |
| **安德烈·卡帕西** | 单一贡献焦点 | 多次讲座 |

**如需深入了解其中任何一点，请参阅：**
- [references/writing-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md) — 带示例的完整解释
- [references/sources.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/sources.md) — 完整参考文献

### 时间分配

在以下方面花费**大致相等的时间**：
1. 摘要
2. 引言
3. 图表
4. 其他所有内容的总和

**原因？** 大多数审稿人在读到你的方法部分之前就已经形成了判断。读者阅读你论文的顺序是：标题 → 摘要 → 引言 → 图表 → 可能才是其余部分。

### 撰写工作流程

```
论文撰写清单：
- [ ] 步骤1：用一句话定义贡献
- [ ] 步骤2：起草图1（核心思想或最有说服力的结果）
- [ ] 步骤3：起草摘要（5句话公式）
- [ ] 步骤4：起草引言（最多1-1.5页）
- [ ] 步骤5：起草方法
- [ ] 步骤6：起草实验与结果
- [ ] 步骤7：起草相关工作
- [ ] 步骤8：起草结论与讨论
- [ ] 步骤9：起草局限性（所有会议都要求）
- [ ] 步骤10：规划附录（证明、额外实验、细节）
- [ ] 步骤11：完成论文清单
- [ ] 步骤12：最终审阅
```

### 两遍修订模式

在使用智能体撰写草稿时，使用**两遍**方法（在SakanaAI的AI-Scientist流程中被证明有效）：

**第一遍 — 撰写并立即修订每个部分：**
对于每个部分，撰写一份完整的草稿，然后立即在相同的上下文中修订它。这样可以在该部分内容还新鲜时捕捉局部问题（清晰度、流畅性、完整性）。

**第二遍 — 在完整论文上下文中进行全局修订：**
所有部分起草完毕后，在了解完整论文的情况下重新审视每个部分。这样可以捕捉跨部分的问题：冗余、术语不一致、叙事流畅性，以及一个部分承诺了但另一个部分未兑现的内容空缺。

```
第二遍修订提示（针对每个部分）：
"在完整论文的上下文中审阅[某部分]。
- 它与论文的其余部分是否匹配？与其他部分是否有冗余？
- 术语是否与引言和方法部分一致？
- 是否可以在不削弱信息的前提下删减任何内容？
- 叙事是否从前一部分流畅地过渡到下一部分？
进行最小化、有针对性的编辑。不要从头开始重写。"
```

### LaTeX 错误清单

将此清单附加到每个修订提示中。当LLM撰写LaTeX时，这些是最常见的错误：

```
LaTeX 质量清单（每次编辑后验证）：
- [ ] 没有未封闭的数学符号（$符号成对）
- [ ] 仅引用已存在的图表/表格（\ref 与 \label 匹配）
- [ ] 没有虚构的引用（\cite 与 .bib 中的条目匹配）
- [ ] 每个 \begin{env} 都有匹配的 \end{env}（特别是 figure, table, algorithm）
- [ ] 没有 HTML 污染（</end{figure}> 而不是 \end{figure}）
- [ ] 在数学模式外没有未转义的下划线（文本中使用 \_）
- [ ] 没有重复的 \label 定义
- [ ] 没有重复的章节标题
- [ ] 文本中的数字与实际实验结果匹配
- [ ] 所有图表都有标题和标签
- [ ] 没有导致 overfull hbox 警告的过长行
```

### 步骤 5.0：标题

标题是论文中被阅读最多的元素。它决定了是否有人会点击查看摘要。

**好的标题**：
- 阐明贡献或发现："Autoreason: When Iterative LLM Refinement Works and Why It Fails"
- 强调一个令人惊讶的结果："Scaling Data-Constrained Language Models"（暗示你可以做到）
- 命名方法及其功能："DPO: Direct Preference Optimization of Language Models"

**糟糕的标题**：
- 过于笼统："An Approach to Improving Language Model Outputs"
- 太长：超过约15个单词的任何标题
- 只有术语："Asymptotic Convergence of Iterative Stochastic Policy Refinement"（这是给谁看的？）

**规则**：
- 如果有方法名称，请包含它（为了可引用性）
- 包含1-2个审稿人会搜索的关键词
- 避免使用冒号，除非两半都有意义
- 检验：审稿人能否仅从标题就知道领域和贡献？

### 步骤 5.1：摘要（5句话公式）

来自塞巴斯蒂安·法夸尔（DeepMind）：

```
1. 你取得了什么成就："We introduce...", "We prove...", "We demonstrate..."
2. 为什么这很难且很重要
3. 你是如何做到的（使用专业关键词以便发现性）
4. 你有什么证据
5. 你最显著的数字/结果
```

**删除**诸如"Large language models have achieved remarkable success..."之类的通用开头。

### 步骤 5.2：图1

图1是大多数读者在看完摘要后第二眼看到的东西（在引言之前）。在撰写引言之前起草它——它迫使你澄清核心思想。

| 图1类型 | 何时使用 | 示例 |
|---------|----------|------|
| **方法图** | 新架构或流程 | 展示你系统的TikZ流程图 |
| **结果预览** | 一个有说服力的结果就能说明整个故事 | 柱状图："我们的方法 vs 基线"，差距明显 |
| **问题图示** | 问题不直观 | 展示你所解决的失效模式的"前后"对比 |
| **概念图** | 抽象贡献需要视觉基础 | 方法属性的2x2矩阵 |

**规则**：图1必须无需阅读任何文本就能理解。仅凭图注就应该能传达核心思想。有目的地使用颜色——不要只是装饰。

### 步骤 5.3：引言（最多1-1.5页）

必须包含：
- 清晰的问题陈述
- 简要的方法概述
- 2-4个要点的贡献列表（两栏格式中每点最多1-2行）
- 方法部分应在第2-3页开始

### 步骤 5.4：方法

### 步骤 5.5：实验与结果

对于每项实验，需明确说明：
- **支持哪项主张**
- 如何与主要贡献相关联
- 观察要点："蓝色线条显示 X，这证明了 Y"

要求：
- 提供误差线及其计算方法（标准差 vs 标准误差）
- 超参数搜索范围
- 计算基础设施（GPU 类型，总耗时）
- 种子设定方法

### 步骤 5.6：相关工作

按方法论组织，而非逐篇论文罗列。应慷慨引用——审稿人很可能就是相关论文的作者。

### 步骤 5.7：局限性（必需）

所有主要会议都要求此部分。诚实的态度有益处：
- 审稿人被指示不要因诚实承认局限性而扣分
- 先主动识别弱点，以预防批评
- 解释为何局限性不会削弱核心主张

### 步骤 5.8：结论与讨论

**结论**（必需，0.5-1 页）：
- 用一句话重申贡献（措辞需与摘要不同）
- 总结关键发现（2-3句话，而非列表）
- 意义：这对该领域意味着什么？
- 未来工作：2-3个具体的下一步（而非模糊的"我们将X留作未来工作"）

**讨论**（可选，有时与结论合并）：
- 超越直接结果的更广泛影响
- 与其他子领域的联系
- 对方法适用与不适用场景的坦诚评估
- 实际部署的考量

**切勿**在结论中引入新的结果或主张。

### 步骤 5.9：附录策略

在所有主要会议中附录页数不限，对可重复性至关重要。结构如下：

| 附录章节 | 放置内容 |
|---------|---------|
| **证明与推导** | 正文过长的完整证明。正文可陈述定理并注明"证明见附录A"。 |
| **附加实验** | 消融实验、扩展曲线、按数据集分解的结果、超参数敏感性分析 |
| **实现细节** | 完整的超参数表、训练细节、硬件规格、随机种子 |
| **数据集文档** | 数据收集流程、标注指南、许可证、预处理 |
| **提示与模板** | 使用的精确提示（针对基于LLM的方法）、评估模板 |
| **人工评估** | 标注界面截图、给出的标注员指示、IRB详情 |
| **附加图表** | 按任务分解、轨迹可视化、失败案例示例 |

**规则**：
- 正文必须自成一体——审稿人并非必须阅读附录
- 切勿将关键证据仅置于附录中
- 交叉引用："完整结果见表5（附录B）"，而非仅"见附录"
- 使用 `\appendix` 命令，然后 `\section{A: 证明}` 等。

### 页面预算管理

当超出页数限制时：

| 削减策略 | 节省页数 | 风险 |
|---------|---------|------|
| 将证明移至附录 | 0.5-2 页 | 低 — 标准做法 |
| 压缩相关工作 | 0.5-1 页 | 中 — 可能遗漏关键引用 |
| 合并表格与子图 | 0.25-0.5 页 | 低 — 通常可提升可读性 |
| 谨慎使用 `\vspace{-Xpt}` | 0.1-0.3 页 | 若细微则低，若明显则高 |
| 移除定性示例 | 0.5-1 页 | 中 — 审稿人喜欢示例 |
| 缩小图表尺寸 | 0.25-0.5 页 | 高 — 图表必须保持可读 |

**切勿**：减小字体、改变页边距、删除必需章节（局限性、广泛影响），或对正文使用 `\small`/`\footnotesize`。

### 步骤 5.10：伦理与更广泛影响声明

大多数会议现在要求或强烈鼓励提供伦理/更广泛影响声明。这不是样板文件——审稿人会阅读它，并可能标记伦理问题导致直接拒稿。

**应包含的内容：**

| 组件 | 内容 | 要求方 |
|------|------|--------|
| **积极社会影响** | 你的工作如何造福社会 | NeurIPS, ICML |
| **潜在负面影响** | 误用风险、双重用途关切、失效模式 | NeurIPS, ICML |
| **公平与偏见** | 你的方法/数据是否存在已知偏见？ | 所有会议（隐含） |
| **环境影响** | 大规模训练的计算碳足迹 | ICML, 越来越多NeurIPS |
| **隐私** | 你的工作是否使用或能够处理个人数据？ | ACL, NeurIPS |
| **LLM披露** | 写作或实验中是否使用了AI？ | ICLR（强制）, ACL |

**撰写声明：**

```latex
\section*{更广泛影响声明}
% NeurIPS/ICML：置于结论之后，不计入页数限制

% 1. 积极应用（1-2句话）
这项工作实现了[具体应用]，可能使[具体群体]受益。

% 2. 风险与缓解措施（1-3句话，要具体）
[方法/模型]可能被误用于[具体风险]。我们通过[具体缓解措施，例如：仅发布大小超过X的模型权重，包含安全过滤器，记录失效模式]来缓解此问题。

% 3. 影响声明的局限性（1句话）
我们的评估仅限于[特定领域]；更广泛的部署将需要[具体额外工作]。
```

**常见错误：**
- 写"我们预见不到负面影响"（几乎从不真实——审稿人不信任这一点）
- 表述模糊："这可能被误用"却未说明如何
- 忽略大规模工作的计算成本
- 忘记在要求披露的会议上说明LLM的使用

**计算碳足迹**（针对训练密集型论文）：
```python
# 使用 ML CO2 Impact 工具方法论估算
gpu_hours = 1000  # 总 GPU 小时数
gpu_tdp_watts = 400  # 例如，A100 = 400W
pue = 1.1  # 电源使用效率（数据中心开销）
carbon_intensity = 0.429  # kg CO2/kWh（美国平均值；因地区而异）

energy_kwh = (gpu_hours * gpu_tdp_watts * pue) / 1000
carbon_kg = energy_kwh * carbon_intensity
print(f"能源：{energy_kwh:.0f} kWh，碳排放：{carbon_kg:.0f} kg CO2eq")
```

### 步骤 5.11：数据表与模型卡（如适用）

如果你的论文引入了**新数据集**或**发布了模型**，请包含结构化文档。审稿人对此的期望越来越高，NeurIPS 数据集与基准赛道也要求如此。

**数据集的数据表**（Gebru 等人, 2021）——置于附录中：

```
数据集文档（附录）：
- 动机：为何创建此数据集？支持什么任务？
- 组成：实例是什么？有多少？数据类型是什么？
- 收集：数据如何收集？来源是什么？
- 预处理：应用了哪些清理/过滤？
- 分发：数据集如何分发？基于什么许可证？
- 维护：谁维护它？如何报告问题？
- 伦理考量：包含个人数据吗？获得同意了吗？
  是否有潜在危害？是否存在已知偏见？
```

**模型卡**（Mitchell 等人, 2019）——针对模型发布，置于附录中：

```
模型卡（附录）：
- 模型详情：架构、训练数据、训练过程
- 预期用途：主要用例、不适用的用途
- 指标：评估指标及基准测试结果
- 伦理考量：已知偏见、公平性评估
- 局限性：已知失效模式、模型表现不佳的领域
```

### 写作风格

**句子级清晰度（Gopen & Swan 的 7 大原则）：**

| 原则 | 规则 |
|------|------|
| 主语-动词邻近性 | 保持主语和动词靠近 |
| 强调位置 | 将重点置于句末 |
| 主题位置 | 将背景信息前置，新信息后置 |
| 先旧后新 | 熟悉的信息 → 陌生的信息 |
| 一个单元，一个功能 | 每个段落阐述一个观点 |
| 动词体现动作 | 使用动词，避免名词化 |
| 先背景后新知 | 呈现前先设定背景 |

**词汇选择（Lipton, Steinhardt）：**
- 具体明确："准确率"而非"性能"
- 消除模糊表述：除非真正不确定，否则删掉"可能"
- 全文术语一致
- 避免渐进词汇："开发"，而非"结合"

**完整写作指南及示例**：参见 [references/writing-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md)

### 使用 LaTeX 模板

**始终首先复制整个模板目录，然后在其中编写。**

```
模板设置清单：
- [ ] 步骤 1：将整个模板目录复制到新项目
- [ ] 步骤 2：验证模板本身可编译（在进行任何修改之前）
- [ ] 步骤 3：阅读模板的示例内容以理解结构
- [ ] 步骤 4：逐节替换示例内容
- [ ] 步骤 5：使用模板宏（检查导言区中的 \newcommand 定义）
- [ ] 步骤 6：仅在最后清理模板残留项
```

**步骤 1：复制完整模板**

```bash
cp -r templates/neurips2025/ ~/papers/my-paper/
cd ~/papers/my-paper/
ls -la  # 应看到：main.tex, neurips.sty, Makefile 等。
```

复制**整个**目录，而不仅仅是 .tex 文件。模板包含样式文件（.sty）、参考文献样式（.bst）、示例内容和 Makefiles。

**步骤 2：首先验证模板可编译**

在进行**任何**修改之前：
```bash
latexmk -pdf main.tex
# 或手动：pdflatex main.tex && bibtex main && pdflatex main.tex && pdflatex main.tex
```

如果未修改的模板无法编译，请先修复此问题（通常是缺少 TeX 包——通过 `tlmgr install <package>` 安装）。

**步骤 3：保留模板内容作为参考**

不要立即删除示例内容。将其注释掉，并用作格式参考：
```latex
% 模板示例（保留作为参考）：
% \begin{figure}[t]
%   \centering
%   \includegraphics[width=0.8\linewidth]{example-image}
%   \caption{模板展示了标题样式}
% \end{figure}

% 你的实际图表：
\begin{figure}[t]
  \centering
  \includegraphics[width=0.8\linewidth]{your-figure.pdf}
  \caption{你的标题，遵循相同样式。}
\end{figure}
```

**步骤 4：逐节替换内容**

**第5步：使用模板宏**

```latex
\newcommand{\method}{YourMethodName}  % 一致的方法命名
\newcommand{\eg}{e.g.,\xspace}        % 正确的缩写
\newcommand{\ie}{i.e.,\xspace}
```

### 模板陷阱

| 陷阱 | 问题 | 解决方案 |
|------|------|----------|
| 仅复制 `.tex` 文件 | 缺少 `.sty` 文件，无法编译 | 复制整个目录 |
| 修改 `.sty` 文件 | 破坏会议格式 | 永远不要编辑样式文件 |
| 随意添加宏包 | 冲突，破坏模板 | 仅在必要时添加 |
| 过早删除模板内容 | 失去格式参考 | 保留为注释直至完成 |
| 不经常编译 | 错误累积 | 每完成一个章节后编译 |
| 使用光栅 PNG 图片 | 论文中图像模糊 | 始终通过 `savefig('fig.pdf')` 使用矢量 PDF |

### 快速模板参考

| 会议 | 主文件 | 样式文件 | 页数限制 |
|------|--------|----------|----------|
| NeurIPS 2025 | `main.tex` | `neurips.sty` | 9页 |
| ICML 2026 | `example_paper.tex` | `icml2026.sty` | 8页 |
| ICLR 2026 | `iclr2026_conference.tex` | `iclr2026_conference.sty` | 9页 |
| ACL 2025 | `acl_latex.tex` | `acl.sty` | 8页（长文） |
| AAAI 2026 | `aaai2026-unified-template.tex` | `aaai2026.sty` | 7页 |
| COLM 2025 | `colm2025_conference.tex` | `colm2025_conference.sty` | 9页 |

**通用**：双盲评审，参考文献不计入页数限制，附录页数不限，必须使用LaTeX。

模板位于 `templates/` 目录。有关编译设置（VS Code、CLI、Overleaf、其他IDE），请参阅 [templates/README.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/templates/README.md)。

### 表格和图表

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
- 每个指标的最佳值加粗显示
- 包含方向符号（$\uparrow$ 越高越好，$\downarrow$ 越低越好）
- 数值列右对齐
- 保持一致的十进制精度

**图表**：
- 所有图表和示意图使用**矢量图形**（PDF，EPS） — `plt.savefig('fig.pdf')`
- **光栅图**（PNG 600 DPI）仅用于照片
- 使用**对色盲友好的调色板**（Okabe-Ito 或 Paul Tol）
- 验证**灰度可读性**（8% 的男性有色觉缺陷）
- **图中不放标题** — 标题功能由图注承担
- **图注应自成一体** — 读者无需阅读正文也能理解

### 会议转投

有关不同会议间的转换，请参见第7阶段（投稿准备）——其中涵盖了完整的转换工作流、页数变更表以及被拒后的指导。

### 专业 LaTeX 导言区

为任何论文添加以下宏包以实现专业质量。它们与所有主要会议的样式文件兼容：

```latex
% --- 专业宏包（添加在会议样式文件之后） ---

% 排版
\usepackage{microtype}              % 微排版改进（突出、扩展）
                                     % 使文本明显更精致 — 务必包含

% 表格
\usepackage{booktabs}               % 专业的表线（\toprule， \midrule， \bottomrule）
\usepackage{siunitx}                % 一致的数字格式，十进制对齐
                                     % 用法：\num{12345} → 12,345；\SI{3.5}{GHz} → 3.5 GHz
                                     % 表格对齐：使用 S 列类型进行十进制对齐的数字

% 图片
\usepackage{graphicx}               % 包含图形（\includegraphics）
\usepackage{subcaption}             % 带 (a), (b), (c) 标签的子图
                                     % 用法：\begin{subfigure}{0.48\textwidth} ... \end{subfigure}

% 图表和算法
\usepackage{tikz}                   % 可编程矢量图表
\usetikzlibrary{arrows.meta, positioning, shapes.geometric, calc, fit, backgrounds}
\usepackage[ruuled,vlined]{algorithm2e}  % 专业伪代码
                                     % 备选：如果模板已包含，可使用 \usepackage{algorithmicx}

% 交叉引用
\usepackage{cleveref}               % 智能引用：\cref{fig:x} → “图 1”
                                     % 必须在 hyperref **之后**加载
                                     % 处理：图、表、章节、方程、算法

% 数学（通常已由会议 .sty 包含，但需验证）
\usepackage{amsmath,amssymb}        % AMS 数学环境和符号
\usepackage{mathtools}              % 扩展 amsmath（dcases， coloneqq 等）

% 颜色（用于图表和示意图）
\usepackage{xcolor}                 % 颜色管理
% Okabe-Ito 色盲友好调色板：
\definecolor{okblue}{HTML}{0072B2}
\definecolor{okorange}{HTML}{E69F00}
\definecolor{okgreen}{HTML}{009E73}
\definecolor{okred}{HTML}{D55E00}
\definecolor{okpurple}{HTML}{CC79A7}
\definecolor{okcyan}{HTML}{56B4E9}
\definecolor{okyellow}{HTML}{F0E442}
```

**注意：**
- `microtype` 是提升视觉质量效果最显著的宏包。它在亚像素级别调整字符间距。务必包含它。
- `siunitx` 通过 `S` 列类型处理表格中的十进制对齐 — 消除了手动调整间距的需要。
- `cleveref` 必须在 `hyperref` **之后**加载。大多数会议的 .sty 文件会加载 hyperref，因此将 cleveref 放在最后。
- 检查会议模板是否已加载其中任何宏包（尤其是 `algorithm`、`amsmath`、`graphicx`）。避免重复加载。

### siunitx 表格对齐

`siunitx` 使数字密集的表格显著更易读：

```latex
\begin{tabular}{l S[table-format=2.1] S[table-format=2.1] S[table-format=2.1]}
\toprule
方法 & {准确率 $\uparrow$} & {F1 $\uparrow$} & {延迟 (ms) $\downarrow$} \\
\midrule
基线             & 85.2  & 83.7  & 45.3 \\
消融实验 (无 X)  & 87.1  & 85.4  & 42.1 \\
\textbf{我们的方法} & \textbf{92.1} & \textbf{90.8} & \textbf{38.7} \\
\bottomrule
\end{tabular}
```

`S` 列类型自动按小数点对齐。表头放在 `{}` 中以转义对齐。

### 子图

并排图表的标准模式：

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
  \caption{我们的方法在两个数据集上的比较。(a) 显示了缩放行为，(b) 显示了消融实验结果。两者均使用 5 个随机种子。}
  \label{fig:results}
\end{figure}
```

使用 `\cref{fig:results}` → “图 1”，`\cref{fig:results-a}` → “图 1a”。

### 使用 algorithm2e 的伪代码

```latex
\begin{algorithm}[t]
\caption{带评审团的迭代优化}
\label{alg:method}
\KwIn{任务 $T$, 模型 $M$, 评审员 $J_1 \ldots J_n$, 收敛阈值 $k$}
\KwOut{最终输出 $A^*$}
$A \gets M(T)$ \tcp*{初始生成}
$\text{streak} \gets 0$\;
\While{$\text{streak} < k$}{
  $C \gets \text{Critic}(A, T)$ \tcp*{识别弱点}
  $B \gets M(T, C)$ \tcp*{针对批评的修订版本}
  $AB \gets \text{Synthesize}(A, B)$ \tcp*{合并最佳元素}
  \ForEach{评审员 $J_i$}{
    $\text{rank}_i \gets J_i(\text{shuffle}(A, B, AB))$ \tcp*{盲排序}
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

### TikZ 图表模式

TikZ 是机器学习论文中方法示意图的标准。常见模式：

**流程图/流图**（机器学习论文中最常见）：

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
  \node[box, fill=okgreen!20, right of=encoder] (latent) {潜空间\\$z$};
  \node[box, fill=okorange!20, right of=latent] (decoder) {解码器\\$g_\phi$};
  \node[box, fill=okred!20, right of=decoder] (output) {输出\\$\hat{x}$};

  \draw[arrow] (input) -- (encoder);
  \draw[arrow] (encoder) -- (latent);
  \draw[arrow] (latent) -- (decoder);
  \draw[arrow] (decoder) -- (output);
\end{tikzpicture}
\caption{架构概述。编码器将输入 $x$ 映射到潜表示 $z$，解码器对其进行重建。}
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
  \node[header] at (3, 0) {收敛?};
  \node[header] at (6, 0) {质量?};
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

**迭代循环图**（用于带反馈的方法）：

```latex
\begin{tikzpicture}[
  node distance=2cm,
  box/.style={rectangle, draw, rounded corners, minimum height=0.8cm,
              minimum width=1.8cm, align=center, font=\small},
  arrow/.style={-{Stealth[length=3mm]}, thick},
  label/.style={font=\scriptsize, midway, above},
]
  \node[box, fill=okblue!20] (gen) {Generator};
  \node[box, fill=okred!20, right=2.5cm of gen] (critic) {Critic};
  \node[box, fill=okgreen!20, below=1.5cm of $(gen)!0.5!(critic)$] (judge) {Judge Panel};

  \draw[arrow] (gen) -- node[label] {output $A$} (critic);
  \draw[arrow] (critic) -- node[label, right] {critique $C$} (judge);
  \draw[arrow] (judge) -| node[label, left, pos=0.3] {winner} (gen);
\end{tikzpicture}
```

### 用于版本追踪的 latexdiff

对于回应审稿意见至关重要——它能生成标记出版本间差异的 PDF 文件：

```bash
# 安装
# macOS: brew install latexdiff（或随 TeX Live 一同安装）
# Linux: sudo apt install latexdiff

# 生成差异文件
latexdiff paper_v1.tex paper_v2.tex > paper_diff.tex
pdflatex paper_diff.tex

# 对于多文件项目（使用了 \input{} 或 \include{}）
latexdiff --flatten paper_v1.tex paper_v2.tex > paper_diff.tex
```

这将生成一份 PDF，其中删除部分用红色删除线标出，新增部分用蓝色标出——这是回应审稿意见补充材料的标准格式。

### 用于 matplotlib 的 SciencePlots

安装并使用以获得出版级质量的图表：

```bash
pip install SciencePlots
```

```python
import matplotlib.pyplot as plt
import scienceplots  # 注册样式

# 使用 science 样式（类似 IEEE 风格，简洁）
with plt.style.context(['science', 'no-latex']):
    fig, ax = plt.subplots(figsize=(3.5, 2.5))  # 单栏宽度
    ax.plot(x, y, label='Ours', color='#0072B2')
    ax.plot(x, y2, label='Baseline', color='#D55E00', linestyle='--')
    ax.set_xlabel('Training Steps')
    ax.set_ylabel('Accuracy')
    ax.legend()
    fig.savefig('paper/fig_results.pdf', bbox_inches='tight')

# 可用样式：'science', 'ieee', 'nature', 'science+ieee'
# 如果生成图表的机器未安装 LaTeX，请添加 'no-latex'
```

**标准图表尺寸**（双栏格式）：
- 单栏：`figsize=(3.5, 2.5)` —— 适合单栏
- 双栏：`figsize=(7.0, 3.0)` —— 横跨两栏
- 正方形：`figsize=(3.5, 3.5)` —— 用于热图、混淆矩阵

---

## 阶段 6：自查与修订

**目标**：模拟提交前的审阅流程。尽早发现问题。

### 步骤 6.1：模拟审阅（集成模式）

从多角度生成审阅意见。自动化研究流程（特别是 SakanaAI 的 AI-Scientist）的关键发现是：**集成审阅配合元审阅员能产生比单次审阅更校准的反馈。**

**第 1 步：生成 N 份独立审阅**（N=3-5）

使用不同模型或温度设置。每位审阅员仅查看论文本身，不看其他审阅意见。**默认采用负面偏见** —— LLM 在评估时存在有据可查的正面倾向。

```
您是 [会议/期刊] 的专家审稿人。您批判且细致。
如果论文存在弱点或您对某主张存疑，请明确指出
并在评分中反映出来。不要给予无根据的优待。

根据官方审稿指南审阅此论文。评估：

1. 健全性（主张是否有充分支持？基线是否公平且强大？）
2. 清晰度（论文写作质量如何？专家能否复现？）
3. 重要性（这对社区是否重要？）
4. 原创性（是否有新见解，而非仅增量组合？）

请以结构化 JSON 格式提供您的审阅意见：
{
  "summary": "2-3 句话总结",
  "strengths": ["优点 1", "优点 2", ...],
  "weaknesses": ["弱点 1（最关键）", "弱点 2", ...],
  "questions": ["给作者的问题 1", ...],
  "missing_references": ["应引用的论文", ...],
  "soundness": 1-4,
  "presentation": 1-4,
  "contribution": 1-4,
  "overall": 1-10,
  "confidence": 1-5
}
```

**第 2 步：元审阅（区域主席汇总）**

将所有 N 份审阅意见提交给元审阅员：

```
您是 [会议/期刊] 的区域主席。您收到了一篇论文的 [N] 份独立审阅意见。
您的职责是：

1. 识别跨审阅员的共识优点和弱点
2. 通过直接检查论文来解决分歧
3. 生成一份代表综合判断的元审阅意见
4. 使用所有审阅意见的平均数值分数

保持审慎：如果审阅员对某个弱点是否严重存在分歧，
在作者解决之前，将其视为严重弱点。

审阅意见：
[review_1]
[review_2]
...
```

**第 3 步：反思循环**（可选，2-3 轮）

每位审阅员在看到元审阅意见后可以修改自己的审阅意见。使用提前终止信号：如果审阅员回复“我已完成”（无更改），则停止迭代。

**审阅的模型选择**：审阅最好使用最强大的可用模型，即使您用更便宜的模型撰写了论文。审阅模型应与写作模型独立选择。

**少样本校准**：如果可用，包含 1-2 来自目标会议/期刊的真实已发表审阅意见作为示例。这能显著提高分数校准效果。有关示例审阅意见，请参见 [references/reviewer-guidelines.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md)。

### 步骤 6.1b：视觉审阅（VLM）

纯文本审阅会漏掉一整类问题：图表质量、布局问题、视觉一致性。如果您有视觉能力模型，可在编译好的 PDF 上运行单独的**视觉审阅**：

```
您正在审阅此研究论文 PDF 的视觉呈现。检查：
1. 图表质量：图表是否可读？标签是否清晰？颜色是否可区分？
2. 图表与标题对齐：每个标题是否准确描述其图表？
3. 布局问题：孤立的章节标题、尴尬的分页、图表远离其引用位置
4. 表格格式：列对齐、一致的精度、最佳结果用粗体表示
5. 视觉一致性：所有图表使用相同的配色方案、一致的字体大小
6. 灰度可读性：如果黑白打印，图表是否仍可理解？

对于每个问题，指明页码和具体位置。
```

这能捕捉基于文本审阅无法发现的问题：坐标轴标签难以辨认的图表、距离首次引用位置 3 页远的图表、图 2 和图 5 之间不一致的配色方案，或明显超出列宽的表格。

### 步骤 6.1c：主张验证检查

在模拟审阅后，运行单独的验证检查。这能捕捉审阅员可能遗漏的事实错误：

```
主张验证协议：
1. 提取论文中的每一项事实主张（数字、比较、趋势）
2. 对于每项主张，追溯支持它的具体实验/结果
3. 验证论文中的数字是否与实际结果文件匹配
4. 将任何没有可追溯来源的主张标记为 [VERIFY]
```

对于基于智能体的工作流：将验证委托给一个**全新的子智能体**，该子智能体仅接收论文文本和原始结果文件。全新的上下文可防止确认偏误 —— 验证者不会“记得”结果本应是什么。

### 步骤 6.2：优先处理反馈

收集审阅意见后，进行分类：

| 优先级 | 行动 |
|----------|--------|
| **关键**（技术缺陷、缺少基线） | 必须修复。可能需要新实验 → 返回阶段 2 |
| **高**（清晰度问题、缺少消融实验） | 应在此修订中修复 |
| **中**（次要写作问题、额外实验） | 如有时间则修复 |
| **低**（风格偏好、不相关的建议） | 记录以供未来工作参考 |

### 步骤 6.3：修订周期

对于每个关键/高优先级问题：
1. 识别受影响的具体章节
2. 起草修复内容
3. 验证修复不会破坏其他主张
4. 更新论文
5. 针对审阅员的关切再次检查

### 步骤 6.4：撰写反驳信

在回应实际审阅意见时（提交后），反驳信的撰写与修订是不同的技能：

**格式**：逐点回应。对于每位审阅员的关切：
```
> R1-W1: “论文缺少与方法 X 的比较。”

我们感谢审阅员的建议。我们已在表 3（修订版）中添加了与
方法 X 的比较。我们的方法在 [指标] 上比 X 高出 3.2 个百分点
（p<0.05）。我们注意到 X 所需的计算预算是我们方法的两倍。
```

**规则**：
- 回应每项关切 —— 审阅员会注意到您是否跳过了某项
- 以最有力的回应开头
- 简洁直接 —— 审阅员会阅读数十份反驳信
- 如果在反驳期间进行了新实验，请包含新结果
- 即使面对薄弱的批评，也永远不要表现得防御性或轻蔑
- 使用 `latexdiff` 生成标记了更改的 PDF（参见专业 LaTeX 工具部分）
- 感谢审阅员提供具体、可操作的反馈（而非泛泛的赞扬）

**切勿这样做**：没有证据地说“我们恭敬地不同意”。没有解释地说“这超出范围”。通过只回应优点来忽略弱点。

### 步骤 6.5：论文演进追踪

在关键里程碑保存快照：
```
paper/
  paper.tex                    # 当前工作版本
  paper_v1_first_draft.tex     # 首次完整草稿
  paper_v2_post_review.tex     # 模拟审阅后
  paper_v3_pre_submission.tex  # 提交前最终版
  paper_v4_camera_ready.tex    # 录用后最终版
```

## 阶段 7：提交准备

**目标**：最终检查、格式化和提交。

### 步骤 7.1：会议检查清单

每个会议都有强制性检查清单。请仔细填写——不完整的检查清单可能导致稿件被直接拒收。

查看 [references/checklists.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/checklists.md) 以获取：
- NeurIPS 16项论文检查清单
- ICML 更广泛影响 + 可复现性
- ICLR LLM 披露政策
- ACL 强制性的局限性部分
- 通用提交前检查清单

### 步骤 7.2：匿名化检查清单

双盲评审意味着审稿人不能知道论文作者是谁。请核对以下所有项：

```
匿名化检查清单：
- [ ] PDF 中没有任何地方出现作者姓名或所属机构
- [ ] 没有致谢部分（接受后添加）
- [ ] 自我引用使用第三人称："Smith et al. [1] 表明..." 而非 "我们先前表明 [1]..."
- [ ] 没有指向您个人代码仓库的 GitHub/GitLab URL
- [ ] 使用 Anonymous GitHub (https://anonymous.4open.science/) 提供代码链接
- [ ] 图中无机构标识或徽标
- [ ] 文件元数据不包含作者姓名（检查 PDF 属性）
- [ ] 避免使用"我们之前的工作"或"在我们早期的论文中"等措辞
- [ ] 数据集名称不会泄露机构信息（如有需要请重命名）
- [ ] 补充材料中不含可识别身份的信息
```

**常见错误**：补充代码中可见的 Git 提交信息、来自机构工具的带水印图表、前一稿中遗留的致谢、在匿名期之前发布的 arXiv 预印本。

### 步骤 7.3：格式验证

```
提交前格式检查：
- [ ] 遵守页数限制（不包括参考文献和附录）
- [ ] 所有图表为矢量格式 (PDF) 或高分辨率栅格格式 (600 DPI PNG)
- [ ] 所有图表在灰度模式下清晰可读
- [ ] 所有表格使用 booktabs 格式
- [ ] 参考文献正确编译（引用中无 "?"）
- [ ] 关键区域无 overfull hbox
- [ ] 附录清晰标注并分隔
- [ ] 包含必需的部分（局限性、更广泛影响等）
```

### 步骤 7.4：预编译验证

在尝试运行 `pdflatex` **之前**运行这些自动检查。在此捕获错误比调试编译器输出更快。

```bash
# 1. 使用 chktex 进行语法检查（捕捉常见 LaTeX 错误）
# 抑制嘈杂警告：-n2（句子结束），-n24（括号），-n13（句间），-n1（命令终止）
chktex main.tex -q -n2 -n24 -n13 -n1

# 2. 验证 .bib 中存在所有引用
# 从 .tex 中提取 \cite{...}，对照 .bib 检查每一项
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

# 3. 验证所有引用的图表文件存在于磁盘
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

在继续之前修复任何警告。对于基于智能体的工作流：将 chktex 输出反馈给智能体，并指示其进行最小化修复。

### 步骤 7.5：最终编译

```bash
# 清洁构建
rm -f *.aux *.bbl *.blg *.log *.out *.pdf
latexmk -pdf main.tex

# 或手动编译（三次 pdflatex + bibtex 处理交叉引用）
pdflatex -interaction=nonstopmode main.tex
bibtex main
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex

# 验证输出存在且有内容
ls -la main.pdf
```

**如果编译失败**：解析 `.log` 文件查找第一个错误。常见修复方法：
- "Undefined control sequence" → 缺少包或命令名拼写错误
- "Missing $ inserted" → 数学符号出现在数学模式之外
- "File not found" → 图表路径错误或缺少 .sty 文件
- "Citation undefined" → .bib 条目缺失或未运行 bibtex

### 步骤 7.6：会议特定要求

| 会议 | 特殊要求 |
|------|----------|
| **NeurIPS** | 论文检查清单放在附录，接受后需提交通俗摘要 |
| **ICML** | 更广泛影响声明（结论之后，不计入页数限制） |
| **ICLR** | 要求 LLM 披露，相互评审协议 |
| **ACL** | 强制性局限性部分，负责任 NLP 检查清单 |
| **AAAI** | 严格的样式文件——不允许任何修改 |
| **COLM** | 为语言模型社区框架贡献 |

### 步骤 7.7：会议重投与格式转换

在不同会议间转换时，**切勿在不同模板间复制 LaTeX 导言区**：

```bash
# 1. 从目标模板重新开始
cp -r templates/icml2026/ new_submission/

# 2. 仅复制内容部分（非导言区）
#    - 摘要文本、章节内容、图表、参考文献条目

# 3. 调整页数限制
# 4. 添加会议特定要求的章节
# 5. 更新参考文献
```

| 从 → 到 | 页数变化 | 关键调整 |
|---------|----------|----------|
| NeurIPS → ICML | 9 → 8 | 砍掉1页，添加“更广泛影响” |
| ICML → ICLR | 8 → 9 | 扩展实验，添加 LLM 披露 |
| NeurIPS → ACL | 9 → 8 | 按 NLP 惯例重构，添加“局限性” |
| ICLR → AAAI | 9 → 7 | 大幅删减，严格遵守样式 |
| 任何 → COLM | 各异 → 9 | 重新聚焦于语言模型 |

删减页数时：将证明移至附录，精简相关工作，合并表格，使用子图。
扩展时：增加消融实验，扩展局限性，包含额外的基线，添加定性示例。

**被拒后**：在新版本中回应审稿人意见，但不要包含“修改说明”部分或引用上一次投稿（盲审）。

### 步骤 7.8：最终版准备（接受后）

论文被接受后，准备最终版：

```
最终版检查清单：
- [ ] 取消匿名：添加作者姓名、所属机构、电子邮箱地址
- [ ] 添加致谢部分（资助、计算资源资助、有帮助的审稿人）
- [ ] 添加公开代码/数据 URL（真实 GitHub，非匿名）
- [ ] 处理领域编辑/主编提出的任何强制性修改意见
- [ ] 切换到最终版模板（如果适用——例如 AAAI 的 \anon → \camera）
- [ ] 如果会议要求，添加版权声明
- [ ] 更新文本中所有“匿名”占位符
- [ ] 验证最终 PDF 编译无误
- [ ] 检查最终版的页数限制（有时与提交版不同）
- [ ] 将补充材料（代码、数据、附录）上传至会议门户网站
```

### 步骤 7.9：arXiv 与预印本策略

在 arXiv 上发布是 ML 领域的标准做法，但需注意重要的时间和匿名性考虑。

**时机决策树：**

| 情况 | 建议 |
|------|------|
| 投稿至双盲会议 (NeurIPS, ICML, ACL) | 在提交截止日期**之后**发布到 arXiv，而非之前。在之前发布技术上可能违反匿名政策，尽管执行力度不一。 |
| 投稿至 ICLR | ICLR 明确允许在投稿前发布 arXiv。但不要在提交的论文本身中放上作者姓名。 |
| 论文已在 arXiv 上，投稿至新会议 | 在大多数会议都可以接受。在审稿期间，**切勿**更新 arXiv 版本以包含明显回应审稿意见的内容。 |
| Workshop 论文 | 随时都可以发布到 arXiv——Workshop 通常不是双盲的。 |
| 希望确立优先权 | 如果担心被抢先，立即发布——但需接受匿名性上的折衷。 |

**arXiv 分类选择**（ML/AI 论文）：

| 分类 | 代码 | 最适合 |
|------|------|--------|
| 机器学习 | `cs.LG` | 通用 ML 方法 |
| 计算与语言 | `cs.CL` | NLP，语言模型 |
| 人工智能 | `cs.AI` | 推理、规划、智能体 |
| 计算机视觉 | `cs.CV` | 视觉模型 |
| 信息检索 | `cs.IR` | 搜索、推荐 |

**列出主要分类 + 1-2 个交叉分类。** 更多分类 = 更高可见度，但仅在真正相关时才进行交叉分类。

**版本策略：**
- **v1**：初始提交（与会议投稿一致）
- **v2**：接受后带有最终版修正（在摘要中添加“accepted at [Venue]”）
- 不要在审稿期间发布 v2，其中包含明显针对审稿意见的修改

```bash
# 检查您的论文标题是否在 arXiv 上已被占用
# （在选择标题之前）
pip install arxiv
python -c "
import arxiv
results = list(arxiv.Search(query='ti:\"Your Exact Title\"', max_results=5).results())
print(f'Found {len(results)} matches')
for r in results: print(f'  {r.title} ({r.published.year})')
"
```

### 步骤 7.10：研究代码打包

发布干净、可运行的代码能显著增加引用次数和审稿人信任。将代码与最终版论文一同打包。

**仓库结构：**

```
your-method/
  README.md              # 设置、使用说明、复现指令
  requirements.txt       # 或 environment.yml 用于 conda
  setup.py               # 用于 pip 可安装包
  LICENSE                # 推荐 MIT 或 Apache 2.0 用于研究
  configs/               # 实验配置
  src/                   # 核心方法实现
  scripts/               # 训练、评估、分析脚本
    train.py
    evaluate.py
    reproduce_table1.sh  # 每个主要结果对应一个脚本
  data/                  # 小数据或下载脚本
    download_data.sh
  results/               # 用于验证的预期输出
```

**研究代码的 README 模板：**

```markdown
# [论文标题]

"[论文标题]" (Venue Year) 的官方实现。
```

## 设置
[设置环境的具体命令]

## 复现
要复现表格 1：`bash scripts/reproduce_table1.sh`
要复现图 2：`python scripts/make_figure2.py`

```
**发布前检查清单：**
```
- [ ] 代码从干净克隆中运行（在全新机器或Docker上测试）
- [ ] 所有依赖项固定到特定版本
- [ ] 没有硬编码的绝对路径
- [ ] 仓库中没有API密钥、凭证或个人数据
- [ ] README涵盖设置、复现和引用
- [ ] 许可证文件存在（MIT或Apache 2.0以最大化重用）
- [ ] 结果在预期方差内可复现
- [ ] .gitignore排除了数据文件、检查点、日志
```

**用于提交的匿名代码**（被接收前）：
```bash
# 用于双盲评审的匿名GitHub
# https://anonymous.4open.science/
# 上传您的仓库 → 获取匿名URL → 写入论文中
```

---

## 第8阶段：接收后的交付成果

**目标**：通过演示材料和社区参与，最大化您被接收论文的影响力。

### 步骤8.1：会议海报

大多数会议都要求海报展示环节。海报设计原则：

| 元素 | 指南 |
|---------|-----------|
| **尺寸** | 查看会议要求（通常为24"x36"或A0竖版/横版） |
| **内容** | 标题、作者、一句话贡献、方法图、2-3个关键结果、结论 |
| **布局** | 从左上到右下（Z型模式）或分栏式 |
| **文字** | 标题在3米处可读，正文在1米处可读。不要整段文字——仅用要点。 |
| **图片** | 以更高分辨率重用论文中的图片。放大关键结果图。 |

**工具**：LaTeX（`beamerposter`包）、PowerPoint/Keynote、Figma、Canva。

**制作**：会议前至少2周下单。布料海报更轻便，便于携带。现在许多会议也支持虚拟/数字海报。

### 步骤8.2：会议报告 / 聚光灯演讲

如果获得口头报告或聚光灯演讲机会：

| 报告类型 | 时长 | 内容 |
|-----------|----------|---------|
| **聚光灯** | 5分钟 | 问题、方法、一个关键结果。练习到刚好5分钟。 |
| **口头报告** | 15-20分钟 | 完整故事：问题、方法、关键结果、消融实验、局限性。 |
| **研讨会报告** | 10-15分钟 | 根据研讨会听众调整——可能需要更多背景介绍。 |

**幻灯片设计规则：**
- 一张幻灯片一个观点
- 最少文字——讲述细节，而不是投射出来
- 关键图片采用动画效果，逐步构建理解
- 最后包含一张"要点"幻灯片（单句话总结贡献）
- 为预想的问题准备备用幻灯片

### 步骤8.3：博客文章 / 社交媒体

一个易于理解的摘要可以显著提高影响力：

- **Twitter/X线程**：5-8条推文。以结果而非方法开头。包含图1和关键结果图。
- **博客文章**：800-1500字。为机器学习实践者而非审稿人撰写。跳过形式化，强调直觉和实际意义。
- **项目页面**：包含摘要、图片、演示、代码链接、BibTeX的HTML页面。使用GitHub Pages。

**时机**：在论文出现在会议录或arXiv定稿版后1-2天内发布。

---

## 研讨会与短论文

研讨会论文和短论文（例如ACL短论文、Findings论文）遵循相同的流程，但有不同的约束和期望。

### 研讨会论文

| 属性 | 研讨会 | 主会议 |
|----------|----------|-----------------|
| **页数限制** | 通常4-6页 | 7-9页 |
| **评审标准** | 完整性门槛较低 | 必须完整、深入 |
| **评审过程** | 通常是单盲或轻度评审 | 双盲，严格 |
| **受重视的** | 有趣的想法、初步结果、立场文章 | 包含强大基线的完整实证研究 |
| **arXiv** | 随时发布 | 时机很重要（参见arXiv策略） |
| **贡献门槛** | 新方向、有趣的负面结果、进行中的工作 | 有强有力证据的重大进展 |

**何时考虑研讨会：**
- 您想在正式成文前获得反馈的早期想法
- 无法支撑8页以上的负面结果
- 关于及时话题的立场文章或意见
- 复现研究或可复现性报告

### ACL短论文与Findings

ACL会议有不同的投稿类型：

| 类型 | 页数 | 预期内容 |
|------|-------|-----------------|
| **长论文** | 8 | 完整的研究，强大的基线，消融实验 |
| **短论文** | 4 | 聚焦的贡献：一个清晰的观点及其证据 |
| **Findings** | 8 | 扎实但略逊于主会议标准的工作 |

**短论文策略**：选择一个主张并充分支持。不要试图将一篇长论文压缩到4页——写一篇不同的、更聚焦的论文。

---

## 超越经验性机器学习的论文类型

以上主要流程针对的是经验性机器学习论文。其他类型的论文需要不同的结构和证据标准。有关每种类型的详细指南，请参见[references/paper-types.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md)。

### 理论论文

**结构**：引言 → 预备知识（定义、符号） → 主要结果（定理） → 证明概述 → 讨论 → 完整证明（附录）

**与经验性论文的主要区别：**
- 贡献是定理、界或不可能性结果——而非实验数据
- "方法"部分被"预备知识"和"主要结果"取代
- 证明是证据，而非实验（不过对理论的实证验证是受欢迎的）
- 正文包含证明概述，完整证明放在附录是标准做法
- 实验部分是可选的，但如果能验证理论预测，则能加强论文

**证明写作原则：**
- 正式陈述定理，所有假设明确
- 在正式证明前提供直觉（"关键见解是..."）
- 证明概述应在0.5-1页内传达主要思想
- 使用 `\begin{proof}...\end{proof}` 环境
- 编号假设并在定理中引用："在假设1-3下，..."

### 综述 / 教程论文

**结构**：引言 → 分类体系/组织 → 详细涵盖 → 未解决的问题 → 结论

**主要区别：**
- 贡献在于组织、综合和识别未解决的问题——而非新方法
- 必须在范围内全面（审稿人会检查是否遗漏了参考文献）
- 需要清晰的分类体系或组织框架
- 价值来自于单篇论文无法建立的各工作之间的联系
- 最佳发表场合：TMLR（综述轨道）、JMLR、Foundations and Trends in ML、ACM Computing Surveys

### 基准论文

**结构**：引言 → 任务定义 → 数据集构建 → 基线评估 → 分析 → 预期用途与局限性

**主要区别：**
- 贡献在于基准本身——它必须填补真正的评估空白
- 数据集文档是强制性的，而非可选（参见数据表，步骤5.11）
- 必须证明该基准具有挑战性（基线未能饱和它）
- 必须证明该基准衡量了你声称它衡量的东西（构念效度）
- 最佳发表场合：NeurIPS数据集与基准轨道、ACL（资源论文）、LREC-COLING

### 立场论文

**结构**：引言 → 背景 → 论点/论据 → 支持证据 → 反驳 → 影响

**主要区别：**
- 贡献在于一个论点，而非一个结果
- 必须认真对待反驳观点
- 证据可以是经验性的、理论性的或逻辑分析
- 最佳发表场合：ICML（立场轨道）、研讨会、TMLR

---

## 与Hermes智能体的集成

本技能专为Hermes智能体设计。它利用Hermes工具、委托、调度和记忆功能来支持整个研究生命周期。

### 相关技能

将本技能与其他Hermes技能结合使用，以应对特定阶段：

| 技能 | 使用时机 | 如何加载 |
|-------|-------------|-------------|
| **arxiv** | 第1阶段（文献综述）：搜索arXiv、生成BibTeX、通过Semantic Scholar查找相关论文 | `skill_view("arxiv")` |
| **subagent-driven-development** | 第5阶段（起草）：使用两阶段评审（规范符合性检查，然后质量检查）并行撰写各章节 | `skill_view("subagent-driven-development")` |
| **plan** | 第0阶段（设置）：在执行前创建结构化计划。写入 `.hermes/plans/` | `skill_view("plan")` |
| **qmd** | 第1阶段（文献）：通过混合BM25+向量搜索查询本地知识库（笔记、转录稿、文档） | 安装：`skill_manage("install", "qmd")` |
| **diagramming** | 第4-5阶段：创建基于Excalidraw的图表和架构图 | `skill_view("diagramming")` |
| **data-science** | 第4阶段（分析）：用于交互式分析和可视化的Jupyter实时内核 | `skill_view("data-science")` |

**本技能取代 `ml-paper-writing`** —— 它包含了`ml-paper-writing`的所有内容，外加完整的实验/分析流程和自动推理方法。

### Hermes工具参考

| 工具 | 在本流程中的用途 |
|------|----------------------|
| **`terminal`** | LaTeX编译（`latexmk -pdf`）、git操作、启动实验（`nohup python run.py &`）、进程检查 |
| **`process`** | 后台实验管理：`process("start", ...)`、`process("poll", pid)`、`process("log", pid)`、`process("kill", pid)` |
| **`execute_code`** | 运行Python进行引文验证、统计分析、数据聚合。可通过RPC访问工具。 |
| **`read_file`** / **`write_file`** / **`patch`** | 论文编辑、实验脚本、结果文件。使用 `patch` 对大型.tex文件进行有针对性的编辑。 |
| **`web_search`** | 文献发现：`web_search("transformer attention mechanism 2024")` |
| **`web_extract`** | 获取论文内容、验证引文：`web_extract("https://arxiv.org/abs/2303.17651")` |
| **`delegate_task`** | **并行章节起草** —— 为每个章节生成独立的子智能体。也用于并发引文验证。 |
| **`todo`** | 跨会话的主要状态跟踪器。每次阶段转换后更新。 |
| **`memory`** | 在会话间持久化关键决策：贡献框架、场地选择、审稿人反馈。 |
| **`cronjob`** | 调度实验监控、截止日期倒计时、自动arXiv检查。 |
| **`clarify`** | 当受阻时（如场地选择、贡献框架）向用户提出有针对性的问题。 |
| **`send_message`** | 当实验完成或草稿就绪时通知用户，即使用户不在聊天中。 |

### 工具使用模式

**实验监控**（最常见）：
```
terminal("ps aux | grep <模式>")
→ terminal("tail -30 <日志文件>")
→ terminal("ls results/")
→ execute_code("分析结果JSON，计算指标")
→ terminal("git add -A && git commit -m '<描述性信息>' && git push")
→ send_message("实验完成：<摘要>")
```

**并行章节起草**（使用委托）：
```
delegate_task("根据这些实验脚本和配置起草‘方法’部分。
  包括：伪代码、所有超参数、足以复现的架构细节。
  使用neurips2025模板惯例用LaTeX撰写。")

delegate_task("起草‘相关工作’部分。使用web_search和web_extract查找论文。
  通过Semantic Scholar验证每一条引文。按方法论分组。")

delegate_task("起草‘实验’部分。读取results/中的所有结果文件。
  说明每个实验支持哪个主张。包含误差线和显著性检验。")
```

每个委托都作为一个**全新的子智能体**运行，没有共享上下文——请在提示中提供所有必要信息。收集输出并整合。

**引文验证**（使用execute_code）：
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

**`memory` 工具** —— 持久化关键决策（有界：MEMORY.md 约2200字符）：
```
memory("add", "论文：autoreason。场地：NeurIPS 2025（9页）。
  贡献：当生成-评估差距较大时，结构化精炼有效。
  关键结果：Haiku 42/42, Sonnet 3/5, S4.6 constrained 2/3。
  状态：第5阶段——正在起草方法部分。")
```
在做出重大决策或阶段转换后更新记忆。这在会话间持续存在。

**`todo` 工具** —— 跟踪详细进展：
```
todo("add", "为Sonnet 4.6设计约束性任务实验")
todo("add", "运行Haiku基线比较")
todo("add", "起草方法部分")
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
6. 向用户报告状态，询问下一步方向
```

### 使用 `cronjob` 进行定时监控

使用 `cronjob` 工具调度定期实验检查：
```
cronjob("create", {
  "schedule": "*/30 * * * *",  # 每30分钟
  "prompt": "检查实验状态：
    1. ps aux | grep run_experiment
    2. tail -30 logs/experiment_haiku.log
    3. ls results/haiku_baselines/
    4. 如果完成：读取结果，计算Borda分数，
       git add -A && git commit -m '添加Haiku结果' && git push
    5. 报告：结果表格、关键发现、下一步
    6. 如果没有变化：回复 [SILENT]"
})
```

**[SILENT] 协议**：当自上次检查以来没有任何变化时，准确回复 `[SILENT]`。这会抑制向用户传递通知。只在有真正值得了解的变化时才报告。

**截止日期跟踪**：
```
cronjob("create", {
  "schedule": "0 9 * * *",  # 每天上午9点
  "prompt": "NeurIPS 2025截止日期：5月22日。今天是{date}。
    剩余天数：{compute}。
    检查待办事项列表——我们进度正常吗？
    如果<7天：警告用户剩余任务。"
})
```

### 沟通模式

**何时通知用户**（通过 `send_message` 或直接回复）：
- 实验批次完成（附结果表）
- 需要决策的意外发现或失败
- 草稿部分已就绪可审阅
- 截止日期临近但任务未完成

**何时不通知：**
- 实验仍在运行，无新结果 → `[SILENT]`
- 例行监控无变化 → `[SILENT]`
- 不需要关注的中间步骤

**报告格式** —— 始终包含结构化数据：
```
## 实验：<name>
状态：完成 / 运行中 / 失败

| 任务 | 方法A | 方法B | 方法C |
|------|-------|-------|-------|
| 任务1 | 85.2 | 82.1 | **89.4** |

关键发现：<一句话>
下一步：<接下来做什么>
```

### 需要人类输入的决策点

当真正受阻时使用 `clarify` 提出有针对性的问题：

| 决策 | 何时提问 |
|------|----------|
| 目标会议/期刊 | 开始撰写论文前（影响篇幅限制、论述框架） |
| 贡献论述框架 | 存在多种有效框架时 |
| 实验优先级 | 待办事项中的实验数量超过可用时间时 |
| 提交准备度 | 最终提交前 |

**不要询问**（请主动决策，做出选择，标注出来）：
- 措辞选择、章节顺序
- 应突出哪些具体结果
- 引用完整性（用找到的信息起草，注明差距）

---

## 审稿人评估标准

了解审稿人的关注点有助于聚焦努力：

| 标准 | 他们检查什么 |
|------|--------------|
| **质量** | 技术合理性、论据充分、基准公平 |
| **清晰度** | 表述清晰、专家可复现、符号一致 |
| **重要性** | 社区影响力、推动认知发展 |
| **原创性** | 新见解（不要求必须是新方法） |

**评分（NeurIPS 6分制）：**
- 6：强烈接收 — 具有开创性、无懈可击
- 5：接收 — 技术扎实、影响力高
- 4：边缘接收 — 扎实，但评估有限
- 3：边缘拒绝 — 弱点大于优点
- 2：拒绝 — 存在技术缺陷
- 1：强烈拒绝 — 已知结果或存在伦理问题

详见[审稿指南参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md)了解详细指南、常见问题和反驳策略。

---

## 常见问题与解决方案

| 问题 | 解决方案 |
|------|----------|
| 摘要过于宽泛 | 如果首句能加在任何ML论文前，请删除。从你的具体贡献开始。 |
| 引言超过1.5页 | 将背景拆分到相关工作部分。提前列出贡献要点。 |
| 实验缺少明确论点 | 在每个实验前添加：“本实验旨在检验[具体论点]是否成立……” |
| 审稿人觉得论文难懂 | 增加指引性语句，使用一致的术语，使图注自成一体。 |
| 缺少统计显著性 | 添加误差线、运行次数、统计检验、置信区间。 |
| 实验范围蔓延 | 每个实验必须对应一个具体论点。删除不相关的实验。 |
| 论文被拒，需重投 | 见阶段7的“会议重投”。解决审稿人关切，但不要提及审稿意见。 |
| 缺少更广泛影响声明 | 见步骤5.10。大多数会议要求此部分。“无负面影响”几乎总是不可信的。 |
| 人工评估被批评较弱 | 见步骤2.5和[人工评估参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md)。报告一致性指标、标注者详情、补偿方式。 |
| 审稿人质疑可复现性 | 公开代码（步骤7.9），记录所有超参数，包含随机种子和计算细节。 |
| 理论论文缺乏直观解释 | 在正式证明前添加带通俗语言解释的证明思路。见[论文类型参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md)。 |
| 结果为阴性/无效 | 见阶段4.3关于处理阴性结果的内容。考虑研讨会、TMLR或重新框架为分析。 |

---

## 参考文档

| 文档 | 内容 |
|------|------|
| [写作指南参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md) | Gopen & Swan 7原则、Perez微技巧、Lipton选词、Steinhardt精确性、图表设计 |
| [引用工作流参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/citation-workflow.md) | 引用API、Python代码、CitationManager类、BibTeX管理 |
| [清单参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/checklists.md) | NeurIPS 16项清单、ICML、ICLR、ACL要求、通用提交前清单 |
| [审稿指南参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md) | 评估标准、评分、常见问题、反驳模板 |
| [资料来源参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/sources.md) | 所有写作指南、会议指南、API的完整参考文献目录 |
| [实验模式参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md) | 实验设计模式、评估协议、监控、错误恢复 |
| [自动推理方法论参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/autoreason-methodology.md) | 自动推理循环、策略选择、模型指南、提示、范围约束、Borda计分 |
| [人工评估参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md) | 人工评估设计、标注指南、一致性指标、众包质量控制、IRB指导 |
| [论文类型参考文档](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md) | 理论论文（证明撰写、定理结构）、综述论文、基准论文、立场论文 |

### LaTeX模板

`templates/`目录下包含以下模板：**NeurIPS 2025**、**ICML 2026**、**ICLR 2026**、**ACL**、**AAAI 2026**、**COLM 2025**。

编译说明请见[templates/README.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/templates/README.md)。

### 关键外部资源

**写作哲学：**
- [Neel Nanda：如何撰写ML论文](https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers)
- [Sebastian Farquhar：如何撰写ML论文](https://sebastianfarquhar.com/on-research/2024/11/04/how_to_write_ml_papers/)
- [Gopen & Swan：科学写作的科学](https://cseweb.ucsd.edu/~swanson/papers/science-of-writing.pdf)
- [Lipton：科学写作启发法](https://www.approximatelycorrect.com/2018/01/29/heuristics-technical-scientific-writing-machine-learning-perspective/)
- [Perez：简易论文写作技巧](https://ethanperez.net/easy-paper-writing-tips/)

**API：** [Semantic Scholar](https://api.semanticscholar.org/api-docs/) | [CrossRef](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | [arXiv](https://info.arxiv.org/help/api/basics.html)

**会议/期刊：** [NeurIPS](https://neurips.cc/Conferences/2025/PaperInformation/StyleFiles) | [ICML](https://icml.cc/Conferences/2025/AuthorInstructions) | [ICLR](https://iclr.cc/Conferences/2026/AuthorGuide) | [ACL](https://github.com/acl-org/acl-style-files)