---
title: "研究论文写作 — 撰写适用于 NeurIPS/ICML/ICML 的机器学习论文：设计→提交"
sidebar_label: "研究论文写作"
description: "撰写适用于 NeurIPS/ICML/ICML 的机器学习论文：设计→提交"
---

{/* 此页面由网站脚本 `scripts/generate-skill-docs.py` 从该技能的 `SKILL.md` 文件自动生成。请编辑源文件 `SKILL.md`，而非此页面。*/}

# 研究论文写作

撰写适用于 NeurIPS/ICML/ICML 的机器学习论文：设计→提交。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/research/research-paper-writing` |
| 版本 | `1.1.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `semanticscholar`, `arxiv`, `habanero`, `requests`, `scipy`, `numpy`, `matplotlib`, `SciencePlots` |
| 平台 | linux, macos |
| 标签 | `研究`, `论文写作`, `实验`, `机器学习`, `人工智能`, `NeurIPS`, `ICML`, `ICLR`, `ACL`, `AAAI`, `COLM`, `LaTeX`, `引用`, `统计分析` |
| 相关技能 | [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv), `ml-paper-writing`, [`subagent-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-subagent-driven-development), [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan) |

:::info
以下是在此技能触发时，赫尔墨斯（Hermes）加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 研究论文写作流程

端到端流程，用于生成面向 **NeurIPS、ICML、ICLR、ACL、AAAI 和 COLM** 的、可发表的机器学习/人工智能研究论文。此技能涵盖完整的研究生命周期：实验设计、执行、监控、分析、论文撰写、审阅、修订和投稿。

这**不是一个线性流程** —— 而是一个迭代循环。实验结果会触发新的实验。审阅意见会触发新的分析。智能体必须能够处理这些反馈回路。

<!-- ascii-guard-ignore -->
<!-- ascii-guard-ignore -->
```
┌─────────────────────────────────────────────────────────────┐
│                    研究论文流程                              │
│                                                             │
│  阶段 0：项目设置 ──► 阶段 1：文献综述                       │
│       │                          │                          │
│       ▼                          ▼                          │
│  阶段 2：实验设计     阶段 5：论文撰写 ◄──┐                  │
│       Design                     │                   │      │
│       │                          ▼                   │      │
│       ▼                    阶段 6：自我审阅           │      │
│  阶段 3：执行与监控           & 修订 ─────────────────┘      │
│       Monitoring                 │                          │
│       │                          ▼                          │
│       ▼                    阶段 7：投稿                      │
│  阶段 4：分析 ─────► (反馈至阶段 2 或 5)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
<!-- ascii-guard-ignore-end -->
<!-- ascii-guard-ignore-end -->

---

## 何时使用此技能

在以下情况下使用此技能：
- **开始撰写一篇新的研究论文**，基于现有代码库或想法
- **设计并运行实验**以支持论文论点
- **撰写或修订**研究论文的任何部分
- **准备向特定会议或研讨会投稿**
- **回应审阅意见**，进行额外实验或修订
- **在不同会议格式之间转换**论文
- **撰写非实证性论文** —— 理论、综述、基准或立场性论文（参见 [超越实证机器学习的论文类型](#超越实证机器学习的论文类型)）
- **为自然语言处理、人机交互或对齐研究设计人类评估**
- **准备接受后的交付物** —— 海报、演讲、代码发布

## 核心理念

1. **积极主动。** 提供完整的草稿，而非问题。科学家们很忙——给他们具体的东西来反馈，然后迭代。
2. **绝不编造引用。** AI 生成的引用错误率约为 40%。务必通过程序化方式获取。将无法验证的引用标记为 `[引用待补充]`。
3. **论文是一个故事，而非实验的堆砌。** 每篇论文都需要在一个句子中清晰阐述一个核心贡献。如果做不到这一点，论文就还没准备好。
4. **实验服务于论点。** 每个实验都必须明确说明它支持哪个论点。不要运行与论文叙事无关的实验。
5. **尽早提交，经常提交。** 每完成一批实验，每更新一次论文草稿——都附上描述性信息进行提交。Git 日志就是实验历史。

### 积极主动与协作

**默认：积极主动。先起草，带着草稿去询问。**

| 信心水平 | 行动 |
|-----------------|--------|
| **高**（代码库清晰，贡献明显） | 撰写完整草稿，交付，基于反馈迭代 |
| **中**（存在一定模糊性） | 撰写草稿并标出不确定之处，继续推进 |
| **低**（存在重大未知） | 通过 `clarify` 提出 1-2 个有针对性的问题，然后起草 |

| 部分 | 可自主起草？ | 草稿中需标注的问题 |
|---------|-------------------|-----------------|
| 摘要 | 是 | "将贡献表述为 X —— 如有需要请调整" |
| 引言 | 是 | "强调了问题 Y —— 如有误请更正" |
| 方法 | 是 | "包含了细节 A、B、C —— 请补充缺失部分" |
| 实验 | 是 | "突出了结果 1、2、3 —— 如有需要请调整顺序" |
| 相关工作 | 是 | "引用了论文 X、Y、Z —— 请补充我遗漏的" |

**仅在以下情况阻塞等待输入**：目标会议不明确、存在多种矛盾表述、实验结果似乎不完整、明确要求先进行审阅。

---

## 阶段 0：项目设置

**目标**：建立工作空间，理解已有工作，明确贡献点。

### 步骤 0.1：探索代码库

```bash
# 了解项目结构
ls -la
find . -name "*.py" | head -30
find . -name "*.md" -o -name "*.txt" | xargs grep -l -i "result\|conclusion\|finding"
```

查找：
- `README.md` —— 项目概述和核心论点
- `results/`、`outputs/`、`experiments/` —— 已有发现
- `configs/` —— 实验设置
- `.bib` 文件 —— 已有引用
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
  human_eval/          # 人类评估材料（如需要）
```

### 步骤 0.3：设置版本控制

```bash
git init  # 如果尚未初始化
git remote add origin <repo-url>
git checkout -b paper-draft  # 或 main
```

**Git 纪律**：每完成一批实验都应附上描述性信息进行提交。示例：
```
添加蒙特卡洛约束结果（5 次运行，Sonnet 4.6，政策备忘录任务）
添加 Haiku 基线比较：在廉价模型层上比较自推理 vs 精炼基线
```

### 步骤 0.4：明确贡献点

在撰写任何内容之前，清晰表述：
- **是什么（The What）**：这篇论文贡献的单一具体成果是什么？
- **为什么（The Why）**：支持它的证据是什么？
- **所以呢（The So What）**：为什么读者应该关心？

> 向科学家提议："根据我的理解，主要贡献是：[一句话]。关键结果表明 [Y]。这是你想要的框架吗？"

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
- [ ] 自我审阅（模拟审阅者）
- [ ] 基于审阅意见修订
- [ ] 投稿准备
```

在整个项目过程中更新此列表。它作为跨会话的持久状态。

### 步骤 0.6：估算计算预算

在运行实验之前，估算总成本和时间：

```
计算预算检查清单：
- [ ] API 成本：（模型每 token 价格）×（每次运行的预估 token 数）×（运行次数）
- [ ] GPU 小时：（每次实验时间）×（实验次数）×（种子数）
- [ ] 人类评估成本：（标注人员）×（小时数）×（小时费率）
- [ ] 总预算上限和应急（为重跑增加 30-50%）
```

随着实验的进行跟踪实际支出：
```python
# 简单的成本跟踪器模式
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

**当预算紧张时**：在进行全面搜索之前，先运行试点实验（1-2 个种子，任务子集）。使用更便宜的模型调试流程，然后切换到目标模型进行最终运行。

### 步骤 0.7：多作者协调

大多数论文有 3-10 位作者。尽早建立工作流程：

| 工作流程 | 工具 | 何时使用 |
|----------|------|-------------|
| **Overleaf** | 基于浏览器 | 多位作者同时编辑，无 Git 经验 |
| **Git + LaTeX** | `git` 加上用于辅助文件的 `.gitignore` | 技术团队，需要基于分支的审阅 |
| **Overleaf + Git 同步** | Overleaf 高级版 | 两者兼得——实时协作加版本历史 |

**章节负责制**：将每个章节分配给一位主要作者。其他人评论但不直接编辑。避免合并冲突和风格不一致。

```
作者协调检查清单：
- [ ] 就章节负责达成一致（谁写什么）
- [ ] 设置共享工作空间（Overleaf 或 Git 仓库）
- [ ] 在任何人开始写作前，建立符号约定
- [ ] 安排内部审阅轮次（不只是在最后）
- [ ] 指定一人负责最终格式化
- [ ] 在创建图表前，就图表风格（颜色、字体、大小）达成一致
```

**尽早商定的 LaTeX 约定**：
- 使用 `\method{}` 宏确保方法命名一致
- 引用风格：`\citet{}` 与 `\citep{}` 的使用
- 数学符号：向量用小写粗体，矩阵用大写粗体，等等
- 英式英语 vs 美式英语拼写

---

## 第一阶段：文献综述

**目标**：查找相关研究，确定基准，收集引文。

### 步骤 1.1：确定种子论文

从代码库中已引用的论文开始：

```bash
# 通过终端：
grep -r "arxiv\|doi\|cite" --include="*.md" --include="*.bib" --include="*.py"
find . -name "*.bib"
```

### 步骤 1.2：搜索相关研究

**加载 `arxiv` 技能**以进行结构化的论文发现：`skill_view("arxiv")`。它提供了 arXiv REST API 搜索、Semantic Scholar 引文图谱、作者资料和 BibTeX 生成功能。

使用 `web_search` 进行广泛发现，使用 `web_extract` 获取特定论文：

```
# 通过 web_search：
web_search("[主要技术] + [应用领域] site:arxiv.org")
web_search("[基准方法] comparison ICML NeurIPS 2024")

# 通过 web_extract（获取特定论文）：
web_extract("https://arxiv.org/abs/2303.17651")
```

可以尝试的其他搜索查询：

```
搜索查询：
- "[主要技术] + [应用领域]"
- "[基准方法] comparison"
- "[问题名称] state-of-the-art"
- 现有引文中的作者姓名
```

**推荐**：安装 **Exa MCP** 以进行实时学术搜索：
```bash
claude mcp add exa -- npx -y mcp-remote "https://mcp.exa.ai/mcp"
```

### 步骤 1.2b：深化搜索（广度优先，然后深度）

一次平面搜索（一轮查询）通常会遗漏重要的相关工作。使用受深度研究流程启发的迭代 **广度-深度** 模式：

```
迭代文献搜索：

第 1 轮（广度）：4-6 个并行查询，覆盖不同角度
  - "[方法] + [领域]"
  - "[问题名称] state-of-the-art 2024 2025"
  - "[基准方法] comparison"
  - "[替代方法] vs [你的方法]"
  → 收集论文，提取关键概念和术语

第 2 轮（深度）：根据第 1 轮的发现生成后续查询
  - 第 1 轮论文中发现的新术语
  - 第 1 轮最相关结果所引用的论文
  - 需要调查的相互矛盾的发现
  → 收集论文，确定剩余差距

第 3 轮（定向）：填补特定差距
  - 第 1-2 轮中识别出的缺失基准
  - 并行工作（最近 6 个月，相同问题）
  - 关键的负面结果或失败的方法
  → 当新查询返回的大多是您已见过的论文时停止。
```

**何时停止**：如果某一轮返回的 >80% 论文已在您的收藏中，则搜索已饱和。通常 2-3 轮即可。对于综述论文，预期需要 4-5 轮。

**对于基于智能体的工作流**：通过 `delegate_task` 并行委托每一轮的查询。收集结果，去重，然后从组合的发现中生成下一轮的查询。

### 步骤 1.3：验证每一条引文

**切勿凭记忆生成 BibTeX。始终通过编程获取。**

对于每条引文，遵循强制性的 5 步流程：

```
引文验证（每条引文均强制）：
1. 搜索 → 使用特定关键词查询 Semantic Scholar 或 Exa MCP
2. 验证 → 确认论文存在于 2 个以上来源（Semantic Scholar + arXiv/CrossRef）
3. 检索 → 通过 DOI 内容协商获取 BibTeX（编程方式，非记忆）
4. 确认 → 确认您所引用的声明确实出现在论文中
5. 添加 → 将验证过的 BibTeX 添加到参考文献
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

如果您无法验证一条引文：

```latex
\cite{PLACEHOLDER_author2024_verify_this}  % TODO: 验证此引用是否存在
```

**始终告知科学家**："我已将 [X] 条引文标记为需要验证的占位符。"

完整的 API 文档和完整的 `CitationManager` 类请参见 [references/citation-workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/citation-workflow.md)。

### 步骤 1.4：组织相关研究

按方法论对论文分组，而非逐篇介绍：

**好**："一类工作使用了 X 的假设 [引用]，而我们使用 Y 的假设，因为..."
**差**："Smith 等人引入了 X。Jones 等人引入了 Y。我们将两者结合。"

---

## 阶段二：实验设计

**目标**：设计直接支持论文声明的实验。每个实验都必须回答一个具体的问题。

### 步骤 2.1：将声明映射到实验

创建一个明确的映射：

| 声明 | 实验 | 预期证据 |
|-------|-----------|-------------------|
| "我们的方法优于基线方法" | 主要比较（表 1） | 胜率，统计显著性 |
| "对较弱模型的效果更显著" | 模型规模研究 | 单调递增的改进曲线 |
| "收敛需要作用域约束" | 约束与无约束对比 | 收敛速度对比 |

**规则**：如果一个实验无法映射到某个声明，就不要运行它。

### 步骤 2.2：设计基线

强大的基线是论文被接收而非拒绝的关键区别。审稿人会问：“他们是否与X进行了比较？”

标准基线类别：
- **朴素基线**：最简单可行的方法
- **强力基线**：已知的最佳现有方法
- **消融基线**：你的方法减去一个组件
- **计算匹配基线**：相同的计算预算，不同的分配

### 步骤 2.3：定义评估协议

在运行任何实验之前，需要明确：
- **指标**：你测量什么，方向符号（越高/越低越好）
- **聚合**：结果如何跨运行/任务组合
- **统计检验**：使用何种检验来确定显著性
- **样本量**：运行/问题/任务的数量

### 步骤 2.4：编写实验脚本

遵循成功研究流水线中的这些模式：

**增量保存** — 每个步骤后保存结果以便崩溃恢复：
```python
# 每个问题/任务后保存
result_path = f"results/{task}/{strategy}/result.json"
if os.path.exists(result_path):
    continue  # 跳过已完成的工作
# ... 运行实验 ...
with open(result_path, 'w') as f:
    json.dump(result, f, indent=2)
```

**制品保留** — 保存所有中间输出：
```
results/<实验>/
  <任务>/
    <策略>/
      final_output.md          # 最终结果
      history.json             # 完整轨迹
      pass_01/                 # 每次迭代的制品
        version_a.md
        version_b.md
        critic.md
```

**关注点分离** — 将生成、评估和可视化分开：
```
run_experiment.py              # 核心实验运行器
run_baselines.py               # 基线比较
run_comparison_judge.py        # 盲评估
analyze_results.py             # 统计分析
make_charts.py                 # 可视化
```

完整的设计模式、cron 监控和错误恢复，请参见 [references/experiment-patterns.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md)。

### 步骤 2.5：设计人工评估（如适用）

许多 NLP、HCI 和对齐论文需要人工评估作为主要或补充证据。在运行自动化实验之前设计好这一点——人工评估通常需要更长的前置时间（IRB 批准、标注员招聘）。

**何时需要人工评估：**
- 自动化指标无法捕捉你关心的方面（流畅性、有用性、安全性）
- 你的贡献涉及面向人类的质量（可读性、偏好、信任）
- NLP 领域（ACL、EMNLP）的审稿人期望在生成任务中看到它

**关键设计决策：**

| 决策 | 选项 | 指导 |
|----------|---------|----------|
| **标注员类型** | 专家、众包工作者、终端用户 | 与你的声明要求相匹配 |
| **规模** | 李克特量表 (1-5)、成对比较、排序 | 对于 LLM 输出，成对比李克特更可靠 |
| **样本量** | 每位标注员和总项目数 | 功效分析或最少 100 个项目，3 名以上标注员 |
| **一致性指标** | 科恩卡帕、克里彭多夫阿尔法、ICC | 超过 2 名标注员用克里彭多夫阿尔法；同时报告原始一致性 |
| **平台** | Prolific、MTurk、内部团队 | 追求质量用 Prolific；追求规模用 MTurk；领域专长用内部团队 |

**标注指南清单：**
```
- [ ] 清晰的任务描述和示例（包括好和坏的）
- [ ] 模糊案例的判定标准
- [ ] 每个类别至少 2 个详细示例
- [ ] 注意力检查/黄金标准项目（占总数的 10-15%）
- [ ] 资格任务或筛选轮次
- [ ] 每个项目的估计时间和公平报酬（>= 当地最低工资）
- [ ] 机构要求的 IRB/伦理审查（如果需要）
```

**报告要求**（审稿人会检查所有这些）：
- 标注员数量及其资质
- 标注员间一致性的具体指标和数值
- 报酬细节（金额、估计时薪）
- 标注界面描述或截图（附录）
- 总标注时间

完整的指南，包括人工评估数据的统计检验、众包质量控制模式和 IRB 指导，请参见 [references/human-evaluation.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md)。

---

## 阶段三：实验执行与监控

**目标**：可靠地运行实验，监控进度，从失败中恢复。

### 步骤 3.1：启动实验

对长时间运行的实验使用 `nohup`：

```bash
nohup python run_experiment.py --config config.yaml > logs/experiment_01.log 2>&1 &
echo $!  # 记录 PID
```

**并行执行**：同时运行独立的实验，但注意 API 速率限制。4 个以上使用相同 API 的并发实验会相互拖慢速度。

### 步骤 3.2：设置监控（Cron 模式）

对于长时间运行的实验，设置定期状态检查。cron 提示应遵循此模板：

```
监控提示模板：
1. 检查进程是否仍在运行：ps aux | grep <模式>
2. 读取日志的最后 30 行：tail -30 <日志文件>
3. 检查已完成的结果：ls <结果目录>
4. 如果结果存在，读取并报告：cat <结果文件>
5. 如果全部完成，提交：git add -A && git commit -m "<描述性消息>" && git push
6. 以结构化格式报告（包含关键指标的表格）
7. 回答本次实验的关键分析问题
```

**静默模式**：如果自上次检查以来没有任何变化，响应 `[SILENT]` 以抑制对用户的通知。只有在有新消息时才报告。

### 步骤 3.3：处理失败

常见失败模式及恢复：

| 失败 | 检测 | 恢复 |
|---------|-----------|----------|
| API 速率限制/额度耗尽 | 日志中出现 402/429 错误 | 等待，然后重新运行（脚本会跳过已完成的工作） |
| 进程崩溃 | PID 消失，结果不完整 | 从最后一个检查点重新运行 |
| 硬性问题超时 | 进程卡住，日志无进展 | 终止并跳过，在结果中注明 |
| 模型 ID 错误 | 出现引用模型名称的错误 | 修复 ID 并重新运行 |

**关键**：脚本应始终检查现有结果并跳过已完成的工作。这使得重新运行安全且高效。

### 步骤 3.4：提交已完成的结果

每个实验批次完成后：

```bash
git add -A
git commit -m "添加 <实验名称>：<一行关键发现>"
git push
```

### 步骤 3.5：维护实验日志

Git 提交记录了发生了什么，但没有记录**探索树**——即基于你所学知识决定下一步尝试什么的决策。维护一个结构化的实验日志来捕捉这棵树：

```json
// experiment_journal.jsonl — 每次实验尝试追加一个条目
{
  "id": "exp_003",
  "parent": "exp_001",
  "timestamp": "2025-05-10T14:30:00Z",
  "hypothesis": "添加作用域约束将修复 exp_001 中的收敛失败问题",
  "plan": "使用 max_tokens=2000 和固定结构模板重新运行 autoreason",
  "config": {"model": "haiku", "strategy": "autoreason", "max_tokens": 2000},
  "status": "completed",
  "result_path": "results/exp_003/",
  "key_metrics": {"win_rate": 0.85, "convergence_rounds": 3},
  "analysis": "作用域约束解决了收敛问题。胜率从 0.42 跃升至 0.85。",
  "next_steps": ["在 Sonnet 上尝试相同约束", "测试不使用结构模板"],
  "figures": ["figures/exp003_convergence.pdf"]
}
```

**为什么需要日志而不仅仅是 git？** Git 跟踪文件更改。日志跟踪的是推理过程：为什么你尝试 X，你学到了什么，以及这对下一个实验意味着什么。在撰写论文时，这个树对于方法部分（“我们观察到 X，这促使了 Y”）以及诚实地报告失败情况非常有价值。

**选择最佳路径**：当日志显示一个分支树（exp_001 → exp_002a, exp_002b, exp_003）时，确定最能支持论文声明的路径。将死胡同分支记录在附录中，作为消融研究或负面结果。

**为每个实验快照代码**：每次运行后复制实验脚本：
```bash
cp experiment.py results/exp_003/experiment_snapshot.py
```
这样即使后续代码更改也能精确复现。

---

## 阶段四：结果分析

**目标**：提取发现，计算统计量，识别核心故事。

### 步骤 4.1：汇总结果

编写分析脚本，执行以下操作：
1. 从一个批次加载所有结果文件
2. 计算每个任务及总体的指标
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

# 计算汇总指标
for strategy, tasks in results.items():
    scores = [t["score"] for t in tasks.values()]
    print(f"{strategy}: mean={np.mean(scores):.1f}, std={np.std(scores):.1f}")
```

### 步骤 4.2：统计显著性

始终计算：
- **误差条**：标准差或标准误，并说明使用的是哪一种
- **置信区间**：关键结果的 95% 置信区间
- **成对检验**：使用 McNemar 检验比较两种方法
- **效应量**：使用 Cohen's d 或 h 衡量实际显著性

关于 McNemar 检验、自举置信区间和 Cohen's h 的完整实现，请参阅 [references/experiment-patterns.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md)。

### 步骤 4.3：识别故事

分析完成后，明确回答：
1.  **主要发现是什么？** 用一句话概括。
2.  **什么让你感到惊讶？** 意外的结果往往是最佳论文的素材。
3.  **什么失败了？** 失败的实验可能最具启发性。如实报告失败能增强论文的说服力。
4.  **需要哪些后续实验？** 结果常常会引出新的问题。

#### 处理阴性或无效结果

当你的假设被证明错误或结果不明确时，你有三种选择：

| 情况 | 行动 | 适合的发表场合 |
| :--- | :--- | :--- |
| 假设错误，但**原因**具有启发性 | 围绕“为什么”的分析来构建论文 | NeurIPS, ICML（如果分析足够严谨） |
| 方法未超越基线，但**揭示了新内容** | 将贡献重新定义为理解/分析 | ICLR（重视理解），会议研讨会论文 |
| 对流行主张得出清晰的阴性结果 | 将其撰写成文——领域需要知道这个 | NeurIPS Datasets & Benchmarks 赛道, TMLR, 会议研讨会 |
| 结果不明确，没有清晰的故事 | 转向——运行不同的实验或重新构建 | 不要强行写一篇不存在的论文 |

**如何撰写阴性结果论文：**
- 以社区普遍认同的观点及其验证的重要性为开头
- 描述你严谨的研究方法（必须无懈可击——审稿人会更严格地审查）
- 用统计证据清晰地呈现无效结果
- 分析**为什么**预期结果没有出现
- 讨论该结果对领域的影响

**明确欢迎阴性结果的发表场合**：NeurIPS (Datasets & Benchmarks 赛道), TMLR, ML Reproducibility Challenge, 以及各大会议的研讨会。一些研讨会特别征集阴性结果。

### 步骤 4.4：创建图表

**图表**：
- 所有绘图使用矢量图形（PDF）：`plt.savefig('fig.pdf')`
- 使用色觉友好的调色板（Okabe-Ito 或 Paul Tol）
- 图题应自成一体——读者无需阅读正文即可理解
- 图表内部不设标题——图题承担此功能

**表格**：
- 使用 `booktabs` LaTeX 宏包
- 对每个指标的最佳值使用**粗体**
- 包含方向符号（↑ 表示越高越好，↓ 表示越低越好）
- 保持一致的数值精度

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

### 步骤 4.5：决定：进行更多实验还是开始撰写？

| 情况 | 行动 |
| :--- | :--- |
| 核心主张得到支持，结果显著 | 进入阶段五（撰写） |
| 结果不明确，需要更多数据 | 返回阶段二（设计） |
| 意外发现暗示新方向 | 返回阶段二（设计） |
| 缺少审稿人会要求的一个消融实验 | 运行该实验，然后进入阶段五 |
| 所有实验完成，但部分失败 | 记录失败项，进入阶段五 |

### 步骤 4.6：撰写实验日志（通往撰写的桥梁）

在开始撰写论文之前，创建一份结构化的实验日志，作为从结果到行文的桥梁。这是连接实验与撰写的**最重要纽带**——没有它，撰写智能体就得从原始结果文件中重新推导故事。

**创建 `experiment_log.md`**，结构如下：

```markdown
# 实验日志

## 贡献（一句话）
[论文的主要主张]

## 进行的实验

### 实验 1：[名称]
- **测试的主张**：[支持论文的哪个主张]
- **设置**：[模型、数据集、配置、运行次数]
- **关键结果**：[一句话描述结果，包含数字]
- **结果文件**：results/exp1/final_info.json
- **生成的图表**：figures/exp1_comparison.pdf
- **意外发现**：[任何未预料到的情况]

### 实验 2：[名称]
...

## 图表
| 文件名 | 描述 | 所属章节 |
|----------|-------------|---------------------------|
| figures/main_comparison.pdf | 在基准测试 X 上比较所有方法的条形图 | 结果，图 2 |
| figures/ablation.pdf | 移除组件 A、B、C 的消融实验 | 结果，图 3 |
...

## 失败实验（诚实地记录）
- [尝试了什么，为什么失败，告诉了我们什么]

## 开放性问题
- [结果引出的任何论文需要讨论的问题]
```

**重要性**：在起草时，智能体（或委派的子智能体）可以加载 `experiment_log.md` 和 LaTeX 模板，并基于实际结果生成初稿。没有这个桥梁，写作智能体必须解析原始的 JSON/CSV 文件并推断故事——这是产生幻觉或误报数字的常见原因。

**Git 纪律**：将此日志与它所描述的结果一起提交。

---

## 迭代优化：策略选择

此流程中的任何输出——论文草稿、实验脚本、分析——都可以进行迭代优化。自推理研究为每种优化策略何时有效、何时失效提供了经验证据。使用本节来选择正确的方法。

### 快速决策表

| 您的情况 | 策略 | 原因 |
|---------------|----------|-----|
| 中等模型 + 约束任务 | **自推理** | 最佳契合点。生成-评估差距最大。基线会主动破坏弱模型输出。 |
| 中等模型 + 开放任务 | 带有范围约束的**自推理** | 添加固定事实、结构或可交付成果来限定改进空间。 |
| 前沿模型 + 约束任务 | **自推理** | 即使在前沿水平，也能赢得 2/3 的约束任务。 |
| 前沿模型 + 无约束任务 | **批评-修改** 或 **单次通过** | 自推理排在最后。模型的自我评估足够好。 |
| 具体技术任务（系统设计） | **批评-修改** | 直接的“发现-修复”循环更高效。 |
| 模板填充任务（一个正确结构） | **单次通过** 或 **保守策略** | 决策空间有限。迭代不增加价值。 |
| 带测试用例的代码 | **自推理（代码变体）** | 在修复前对*为什么*失败进行结构化分析。恢复率 62% 对 43%。 |
| 非常弱的模型（如 Llama 8B 级） | **单次通过** | 模型太弱，无法生成多样化的候选。投资于生成质量。 |

### 生成-评估差距

**核心洞察**：自推理的价值取决于模型的生成能力与其自我评估能力之间的差距。

<!-- ascii-guard-ignore -->
```
模型层级          │ 生成能力 │ 自我评估 │ 差距   │ 自推理价值
──────────────────┼──────────┼──────────┼────────┼─────────────
弱 (Llama 8B)     │ 差       │ 差       │ 小     │ 无——无法生成多样化候选
中等 (Haiku 3.5)  │ 中等     │ 差       │ 大     │ 最大——42/42 完美波达计数
中等 (Gemini Flash)│ 中等     │ 中等     │ 大     │ 高——赢 2/3
强 (Sonnet 4)     │ 好       │ 中等     │ 中等   │ 中等——赢 3/5
前沿 (S4.6)       │ 优秀     │ 好       │ 小     │ 仅在有约束时有效
```
<!-- ascii-guard-ignore-end -->

这种差距是结构性的，而非暂时的。随着成本下降，今天的前沿将成为明天的中等水平。最佳契合点会移动，但永远不会消失。

### 自推理循环（总结）

每一轮从新的、独立的智能体产生三个候选：

1.  **批评者** → 发现现有方案 A 的问题（不修复）
2.  **作者 B** → 根据批评修改 A
3.  **综合者** → 合并 A 和 B（随机化标签）
4.  **评审团** → 3 个盲审 CoT 评审通过波达计数对 A、B、AB 进行排名
5.  **收敛** → A 连续赢下 k=2 轮 → 完成

**关键参数：**
-   k=2 收敛（k=1 过早，k=3 过于昂贵，无质量提升）
-   始终使用 CoT 评审（收敛速度快 3 倍）
-   作者温度 0.8，评审温度 0.3
-   保守决胜：现有方案在平局时获胜
-   每个角色都是没有共享上下文的新智能体

### 应用于论文草稿

通过自推理优化论文本身时：
-   **向批评者提供真实情况**：实际的实验数据、结果 JSON、统计输出。没有这些，模型会幻觉出虚构的消融研究和虚假的置信区间。
-   **至少使用 3 个工作正常的评审**：一个损坏的评审解析器不会增加噪声——它会完全阻止均衡。
-   **限制修订范围**：“解决这些特定的弱点”而不是“改进论文”。

### 失败模式

| 失败 | 检测 | 修复 |
|---------|-----------|-----|
| 不收敛（A 从未获胜） | A 在 20+ 轮中获胜率 &lt;15% | 为任务添加范围约束 |
| 综合漂移 | 字数无限增长 | 约束结构和可交付成果 |
| 退化至低于单次通过 | 基线得分高于迭代输出 | 切换到单次通过；模型可能太弱 |
| 过拟合（代码） | 公共测试通过率高，私有测试通过率低 | 使用结构化分析，而不仅仅是测试反馈 |
| 评审损坏 | 解析失败导致评审团低于 3 人 | 在继续之前修复解析器 |

完整的提示、波达计数细节、模型选择指南、范围约束设计模式和计算预算参考，请参见 [references/autoreason-methodology.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/autoreason-methodology.md)。

---

## 第五阶段：论文撰写

**目标**：撰写一篇完整、可发表的论文。

### 大型项目的上下文管理

一个包含 50 多个实验文件、多个结果目录和大量文献笔记的论文项目，很容易超出智能体的上下文窗口。需要对此进行主动管理：

**每个撰写任务应加载到上下文中的内容：**

| 撰写任务 | 加载到上下文中 | 不要加载 |
|---------------|------------------|-------------|
| 撰写引言 | `experiment_log.md`、贡献声明、5-10 篇最相关的论文摘要 | 原始结果 JSON 文件、完整实验脚本、所有文献笔记 |
| 撰写方法 | 实验配置、伪代码、架构描述 | 原始日志、其他实验的结果 |
| 撰写结果 | `experiment_log.md`、结果摘要表、图表列表 | 完整分析脚本、中间数据 |
| 撰写相关工作 | 组织的引用笔记（步骤 1.4 输出）、.bib 文件 | 实验文件、原始 PDF |
| 修改修订 | 完整论文草稿、特定的审稿意见 | 其他所有内容 |

**原则：**
- **`experiment_log.md` 是主要的上下文桥梁** — 它总结了撰写所需的所有信息，无需加载原始数据文件（参见步骤 4.6）。
- **委托时，一次只加载一个部分的上下文。** 负责撰写“方法”部分的子智能体不需要文献综述笔记。
- **总结，不要包含原始文件。** 对于一个 200 行的结果 JSON，加载一个 10 行的摘要表。对于一篇 50 页的相关论文，加载 5 句摘要和你关于其相关性的 2 行说明。
- **对于非常大的项目**：创建一个 `context/` 目录，存放预先压缩的摘要：
  ```
  context/
    contribution.md          # 1 句话
    experiment_summary.md    # 关键结果表（来自 experiment_log.md）
    literature_map.md        # 组织的引用笔记
    figure_inventory.md      # 图表清单及描述
  ```

### 叙事原则

**最关键的一点**：你的论文不是一堆实验的集合 —— 而是一个由证据支撑、具有清晰贡献的故事。

每篇成功的机器学习论文都围绕着尼尔·南达所说的“叙事”展开：一个简短、严谨、基于证据的技术故事，并包含读者关心的要点。

**三大支柱（必须在引言结束前清晰阐明）：**

| 支柱 | 描述 | 检验标准 |
|--------|-------------|------|
| **是什么** | 1-3 项具体的新颖主张 | 你能用一句话陈述它们吗？ |
| **为什么** | 严谨的实证证据 | 实验是否能将你的假设与其他替代方案区分开来？ |
| **有何意义** | 读者为何应该关心 | 这是否与公认的社区问题相关联？ |

**如果你无法用一句话陈述你的贡献，那么你还没有一篇论文。**

### 本指南的来源

本技能综合了在顶级会议发表过大量论文的研究人员的写作哲学。该写作哲学层最初由 [Orchestra Research](https://github.com/orchestra-research) 作为 `ml-paper-writing` 技能编译。

| 来源 | 关键贡献 | 链接 |
|--------|-----------------|------|
| **尼尔·南达**（Google DeepMind） | 叙事原则、是什么/为什么/有何意义框架 | [如何撰写机器学习论文](https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers) |
| **塞巴斯蒂安·法夸尔**（DeepMind） | 5 句话摘要公式 | [如何撰写机器学习论文](https://sebastianfarquhar.com/on-research/2024/11/04/how_to_write_ml_papers/) |
| **Gopen & Swan** | 读者期望的 7 项原则 | [科学写作的科学](https://cseweb.ucsd.edu/~swanson/papers/science-of-writing.pdf) |
| **扎卡里·利普顿** | 选词、消除模糊表述 | [技术科学写作启发式方法](https://www.approximatelycorrect.com/2018/01/29/heuristics-technical-scientific-writing-machine-learning-perspective/) |
| **雅各布·斯坦哈特**（加州大学伯克利分校） | 精确性、术语一致性 | [写作技巧](https://bounded-regret.ghost.io/) |
| **伊桑·佩雷斯**（Anthropic） | 微观层面清晰度技巧 | [轻松论文写作技巧](https://ethanperez.net/easy-paper-writing-tips/) |
| **安德烈·卡帕西** | 单一贡献聚焦 | 各种讲座 |

**如需深入了解其中任何一项，请参阅：**
- [references/writing-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md) — 带示例的完整解释
- [references/sources.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/sources.md) — 完整参考文献

### 时间分配

大致**平均分配时间**用于以下各项：
1. 摘要
2. 引言
3. 图表
4. 其他所有内容

**为什么？** 大多数审稿人在读到你的方法部分之前就已形成判断。读者阅读论文的顺序通常是：标题 → 摘要 → 引言 → 图表 → 其他部分。

### 撰写工作流程

```
论文撰写检查清单：
- [ ] 步骤 1：定义一句话的贡献
- [ ] 步骤 2：绘制图 1（核心思想或最有说服力的结果）
- [ ] 步骤 3：撰写摘要（5 句话公式）
- [ ] 步骤 4：撰写引言（最多 1-1.5 页）
- [ ] 步骤 5：撰写方法
- [ ] 步骤 6：撰写实验与结果
- [ ] 步骤 7：撰写相关工作
- [ ] 步骤 8：撰写结论与讨论
- [ ] 步骤 9：撰写局限性（所有会议都要求）
- [ ] 步骤 10：规划附录（证明、额外实验、细节）
- [ ] 步骤 11：完成论文检查清单
- [ ] 步骤 12：最终审查
```

### 两遍修订模式

当与人工智能智能体一起撰写时，请使用**两遍**方法（已在 SakanaAI 的 AI-Scientist 流程中证明有效）：

**第一遍 — 撰写 + 每个部分即时修订：**
对于每个部分，先撰写完整草稿，然后立即在相同上下文中对其进行修订。这样可以在该部分内容还新鲜时捕捉局部问题（清晰度、流畅性、完整性）。

**第二遍 — 全文上下文下的全局修订：**
所有部分撰写完成后，在了解完整论文的情况下，重新审视每个部分。这可以捕捉跨部分的问题：冗余、术语不一致、叙事流程，以及一个部分承诺但另一部分未能兑现的内容。

```
第二遍修订提示（针对每个部分）：
“在完整论文的背景下审查 [部分名称]。
- 它是否与论文其他部分匹配？与其他部分是否有冗余？
- 术语是否与引言和方法部分一致？
- 是否可以在不削弱信息的情况下删减任何内容？
- 叙事是否从上一部分流畅过渡并进入下一部分？
进行最小、有针对性的编辑。不要从头开始重写。”
```

### LaTeX 错误检查清单

将此检查清单附加到每个修订提示中。这些是 LLM 撰写 LaTeX 时最常见的错误：

```
LaTeX 质量检查清单（每次编辑后验证）：
- [ ] 没有未闭合的数学符号（$ 符号平衡）
- [ ] 只引用存在的图表/表格（\ref 与 \label 匹配）
- [ ] 没有捏造的引用（\cite 与 .bib 文件中的条目匹配）
- [ ] 每个 \begin{env} 都有匹配的 \end{env}（特别是 figure, table, algorithm）
- [ ] 没有 HTML 污染（</end{figure}> 而不是 \end{figure}）
- [ ] 数学模式外没有未转义的下划线（在文本中使用 \_）
- [ ] 没有重复的 \label 定义
- [ ] 没有重复的章节标题
- [ ] 文本中的数字与实际实验结果匹配
- [ ] 所有图表都有标题和标签
- [ ] 没有导致 overfull hbox 警告的过长行
```

### 步骤 5.0：标题

标题是论文中被阅读最多的元素。它决定了是否有人会点击查看摘要。

**好的标题**：
- 陈述贡献或发现：“自动推理：迭代 LLM 优化的作用与失效时机”
- 强调出人意料的结果：“数据受限语言模型的扩展”（暗示你可以做到）
- 命名方法 + 其功能：“DPO：语言模型的直接偏好优化”

**不好的标题**：
- 过于通用：“一种改进语言模型输出的方法”
- 过长：超过约 15 个单词
- 仅限行话：“迭代随机策略优化的渐近收敛性”（这是给谁看的？）

**规则**：
- 如果有方法名称，请包含（便于引用）
- 包含 1-2 个审稿人会搜索的关键词
- 除非两部分都有意义，否则避免使用冒号
- 检验：仅凭标题，审稿人能否知道领域和贡献？

### 步骤 5.1：摘要（5 句话公式）

来自塞巴斯蒂安·法夸尔（DeepMind）：

```
1. 你取得了什么成果：“我们引入了...”，“我们证明了...”，“我们展示了...”
2. 为什么这很难且很重要
3. 你如何做到（包含专业关键词以便检索）
4. 你有什么证据
5. 你最显著的数字/结果
```

**删除**诸如“大型语言模型已取得显著成功...”之类的通用开头。

### 步骤 5.2：图 1

图 1 是大多数读者在摘要之后看到的第二样东西。在撰写引言之前先绘制它 —— 这会迫使你澄清核心思想。

| 图 1 类型 | 何时使用 | 示例 |
|---------------|-------------|---------|
| **方法图** | 新的架构或流程 | 展示你系统的 TikZ 流程图 |
| **结果预览** | 一个有说服力的结果就能说明整个故事 | 柱状图：“我们的 vs 基线”，差距明显 |
| **问题图示** | 问题不直观 | 展示你解决的失败模式的前后对比 |
| **概念图** | 抽象的贡献需要视觉锚点 | 方法特性的 2x2 矩阵 |

**规则**：图 1 必须无需阅读任何文本即可理解。仅凭标题就应能传达核心思想。有目的地使用颜色 —— 不要仅仅为了装饰。

### 步骤 5.3：引言（最多 1-1.5 页）

必须包括：
- 清晰的问题陈述
- 简要的方法概述
- 2-4 项贡献列表（每项最多 1-2 行，采用双栏格式）
- 方法部分应在第 2-3 页开始

### 步骤 5.4：方法

启用重新实现：
- 概念性概述或伪代码
- 列出所有超参数
- 提供足以重现的架构细节
- 呈现最终设计决策；消融实验部分放在实验章节

### 第5.5节：实验与结果

针对每个实验，需明确说明：
- **其支持的论点**
- 与主要贡献的关联
- 观察要点："蓝色线条显示X，这表明Y"

要求：
- 提供误差棒及其计算方法（标准差 vs 标准误）
- 超参数搜索范围
- 计算基础设施（GPU类型，总时长）
- 随机种子设置方法

### 第5.6节：相关工作

按方法论组织，而非逐篇论文。广泛引用——审稿人很可能撰写过相关论文。

### 第5.7节：局限性（必需）

所有主要会议均要求此部分。诚实很重要：
- 审稿人被指示不得因诚实承认局限性而扣分
- 主动识别弱点，先发制人地应对批评
- 解释局限性为何不影响核心论点

### 第5.8节：结论与讨论

**结论**（必需，0.5-1页）：
- 用一句话重申贡献（措辞与摘要不同）
- 总结关键发现（2-3句，非列表形式）
- 影响：这对该领域意味着什么？
- 未来工作：2-3个具体的后续步骤（避免模糊的“我们将X留待未来研究”）

**讨论**（可选，有时与结论合并）：
- 超越直接结果的更广泛影响
- 与其他子领域的关联
- 诚实评估方法适用与不适用的场景
- 实际部署的考虑因素

**切勿**在结论中引入新的结果或主张。

### 第5.9节：附录策略

所有主要会议均允许附录不限页数，这对可复现性至关重要。结构如下：

| 附录章节 | 内容 |
|-----------------|---------------|
| **证明与推导** | 主文中过长的完整证明。主文可陈述定理并注明“证明见附录A”。 |
| **补充实验** | 消融实验、扩展曲线、按数据集分解的结果、超参数敏感性分析 |
| **实现细节** | 完整的超参数表、训练细节、硬件规格、随机种子 |
| **数据集文档** | 数据收集过程、标注指南、许可协议、预处理步骤 |
| **提示词与模板** | 使用的确切提示词（适用于基于LLM的方法）、评估模板 |
| **人工评估** | 标注界面截图、给出的标注说明、IRB详情 |
| **补充图表** | 按任务分解的结果、轨迹可视化、失败案例示例 |

**规则**：
- 主论文必须自成一体——审稿人无需阅读附录
- 切勿将关键证据仅放在附录中
- 交叉引用：“完整结果见表5（附录B）”，而非仅“见附录”
- 使用 `\appendix` 命令，然后 `\section{A: 证明}` 等。

### 页面预算管理

超出页数限制时：

| 裁剪策略 | 节省页数 | 风险 |
|-------------|-------|------|
| 将证明移至附录 | 0.5-2页 | 低——常规做法 |
| 压缩相关工作部分 | 0.5-1页 | 中——可能遗漏关键引用 |
| 使用子图合并表格 | 0.25-0.5页 | 低——通常提升可读性 |
| 谨慎使用 `\vspace{-Xpt}` | 0.1-0.3页 | 若微妙则低，若明显则高 |
| 移除定性示例 | 0.5-1页 | 中——审稿人喜欢示例 |
| 缩小图片尺寸 | 0.25-0.5页 | 高——图片必须保持清晰可读 |

**切勿**：减小字号、改变页边距、删除必需章节（局限性、更广泛影响），或对主文使用 `\small`/`\footnotesize`。

### 第5.10节：伦理与更广泛影响声明

多数会议现在要求或强烈鼓励提交伦理/更广泛影响声明。这不是样板文本——审稿人会阅读并可能标记伦理问题，导致直接拒稿。

**需包含内容：**

| 组件 | 内容 | 要求单位 |
|-----------|---------|-------------|
| **积极社会影响** | 你的工作如何造福社会 | NeurIPS, ICML |
| **潜在负面影响** | 误用风险、双重用途问题、失败模式 | NeurIPS, ICML |
| **公平性与偏见** | 你的方法/数据是否存在已知偏见？ | 所有会议（隐含要求） |
| **环境影响** | 大规模训练的计算碳足迹 | ICML, 越来越多NeurIPS |
| **隐私** | 你的工作是否使用或促成处理个人数据？ | ACL, NeurIPS |
| **LLM声明** | 写作或实验中是否使用了AI？ | ICLR（强制）, ACL |

**撰写声明：**

```latex
\section*{更广泛影响声明}
% NeurIPS/ICML：放在结论后，不计入页数限制

% 1. 积极应用（1-2句）
本工作实现了[具体应用]，可能使[特定群体]受益。

% 2. 风险与缓解措施（1-3句，需具体）
[方法/模型]可能被误用于[具体风险]。我们通过[具体缓解措施，例如：仅发布尺寸大于X的模型权重、包含安全过滤器、记录失败模式]来缓解此风险。

% 3. 影响声明的局限性（1句）
我们的评估仅限于[具体领域]；更广泛的部署将需要[具体的额外工作]。
```

**常见错误：**
- 写道“我们认为没有负面影响”（几乎从不真实——审稿人对此不信任）
- 措辞模糊：“这可能被误用”而未具体说明如何
- 忽略大规模工作的计算成本
- 在要求声明LLM使用的会议忘记进行声明

**计算碳足迹**（适用于训练密集型论文）：
```python
# 使用ML CO2 Impact工具方法论估算
gpu_hours = 1000  # 总GPU小时数
gpu_tdp_watts = 400  # 例如A100 = 400W
pue = 1.1  # 电源使用效率（数据中心开销）
carbon_intensity = 0.429  # 千克CO2/千瓦时（美国平均值；因地区而异）

energy_kwh = (gpu_hours * gpu_tdp_watts * pue) / 1000
carbon_kg = energy_kwh * carbon_intensity
print(f"能源消耗：{energy_kwh:.0f} 千瓦时，碳排放：{carbon_kg:.0f} 千克CO2eq")
```

### 第5.11节：数据说明书与模型卡片（如适用）

如果你的论文引入了**新数据集**或**发布了模型**，请包含结构化文档。审稿人对此的期望日益增长，NeurIPS数据集与基准测试轨道要求如此。

**数据集数据说明书**（Gebru等人, 2021）——放在附录中：

```
数据集文档（附录）：
- 动机：为何创建此数据集？它支持什么任务？
- 构成：实例是什么？数量多少？数据类型？
- 收集：数据如何收集？来源是什么？
- 预处理：应用了何种清洗/过滤？
- 分布：数据集如何分发？使用何种许可？
- 维护：谁负责维护？如何报告问题？
- 伦理考量：是否包含个人数据？是否获得同意？
  潜在危害？已知偏见？
```

**模型卡片**（Mitchell等人, 2019）——用于模型发布时放在附录中：

```
模型卡片（附录）：
- 模型详情：架构、训练数据、训练过程
- 预期用途：主要用例、不适用场景
- 指标：评估指标及在基准测试上的结果
- 伦理考量：已知偏见、公平性评估
- 局限性：已知失败模式、模型表现不佳的领域
```

### 写作风格

**句子层面清晰度（Gopen & Swan的7项原则）：**

| 原则 | 规则 |
|-----------|------|
| 主语-动词靠近 | 保持主语和动词接近 |
| 强调位置 | 将重点放在句末 |
| 主题位置 | 先给上下文，再给新信息 |
| 旧信息先于新信息 | 熟悉信息 → 不熟悉信息 |
| 一个单元一个功能 | 每段阐述一个观点 |
| 动词体现动作 | 使用动词，而非名词化 |
| 先上下文后新信息 | 先设定场景，再呈现内容 |

**用词选择（Lipton, Steinhardt）：**
- 要具体：用“准确率”而非“性能”
- 消除含糊其辞：除非确实不确定，否则删除“可能”
- 全文保持术语一致
- 避免渐进式词汇：用“开发”，而非“结合”

**完整写作指南与示例**：参见 [references/writing-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md)

### 使用LaTeX模板

**务必先复制整个模板目录，然后在其中写作。**

```
模板设置清单：
- [ ] 步骤1：将整个模板目录复制到新项目
- [ ] 步骤2：验证模板可直接编译（修改前）
- [ ] 步骤3：阅读模板示例内容以理解结构
- [ ] 步骤4：逐节替换示例内容
- [ ] 步骤5：使用模板宏（检查导言区中的 \newcommand 定义）
- [ ] 步骤6：最后清理模板残留
```

**步骤1：复制完整模板**

```bash
cp -r templates/neurips2025/ ~/papers/my-paper/
cd ~/papers/my-paper/
ls -la  # 应显示：main.tex, neurips.sty, Makefile 等
```

复制整个目录，而不仅仅是.tex文件。模板包含样式文件（.sty）、参考文献样式（.bst）、示例内容和Makefile。

**步骤2：先验证模板可编译**

在进行任何修改之前：
```bash
latexmk -pdf main.tex
# 或手动：pdflatex main.tex && bibtex main && pdflatex main.tex && pdflatex main.tex
```

如果未修改的模板无法编译，请先解决（通常是缺少TeX包——通过 `tlmgr install <package>` 安装）。

**步骤3：保留模板内容作为参考**

不要立即删除示例内容。将其注释掉并用作格式参考：
```latex
% 模板示例（保留以供参考）：
% \begin{figure}[t]
%   \centering
%   \includegraphics[width=0.8\linewidth]{example-image}
%   \caption{模板显示了标题样式}
% \end{figure}

% 你的实际图片：
\begin{figure}[t]
  \centering
  \includegraphics[width=0.8\linewidth]{your-figure.pdf}
  \caption{你的标题，遵循相同样式。}
\end{figure}
```

**步骤4：逐节替换内容**

**步骤 5：使用模板宏**

```latex
\newcommand{\method}{YourMethodName}  % 方法名称保持一致
\newcommand{\eg}{e.g.,\xspace}        % 规范缩写
\newcommand{\ie}{i.e.,\xspace}
```

### 模板使用陷阱

| 陷阱 | 问题 | 解决方案 |
|------|------|----------|
| 仅复制 `.tex` 文件 | 缺失 `.sty` 文件，无法编译 | 复制整个目录 |
| 修改 `.sty` 文件 | 破坏会议格式要求 | 切勿编辑样式文件 |
| 随意添加包 | 产生冲突，破坏模板 | 仅在必要时添加 |
| 过早删除模板内容 | 丢失格式参考 | 保留为注释直至完成 |
| 不频繁编译 | 错误会累积 | 每个部分完成后立即编译 |
| 使用栅格 PNG 作为图表 | 论文中的图片模糊 | 始终使用矢量 PDF（通过 `savefig('fig.pdf')`） |

### 模板快速参考

| 会议 | 主文件 | 样式文件 | 页数限制 |
|------|--------|----------|----------|
| NeurIPS 2025 | `main.tex` | `neurips.sty` | 9页 |
| ICML 2026 | `example_paper.tex` | `icml2026.sty` | 8页 |
| ICLR 2026 | `iclr2026_conference.tex` | `iclr2026_conference.sty` | 9页 |
| ACL 2025 | `acl_latex.tex` | `acl.sty` | 8页（长文） |
| AAAI 2026 | `aaai2026-unified-template.tex` | `aaai2026.sty` | 7页 |
| COLM 2025 | `colm2025_conference.tex` | `colm2025_conference.sty` | 9页 |

**通用规则**：双盲评审，参考文献不计入页数限制，附录不限篇幅，必须使用LaTeX。

模板位于 `templates/` 目录。有关编译设置（VS Code、CLI、Overleaf及其他IDE），请参见 [templates/README.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/templates/README.md)。

### 表格与图表

**表格** — 使用 `booktabs` 以获得专业排版效果：

```latex
\usepackage{booktabs}
\begin{tabular}{lcc}
\toprule
方法 & 准确率 $\uparrow$ & 延迟 $\downarrow$ \\
\midrule
基线模型 & 85.2 & 45ms \\
\textbf{我们的方法} & \textbf{92.1} & 38ms \\
\bottomrule
\end{tabular}
```

规则：
- 对每个指标的最佳值加粗显示
- 包含方向符号（$\uparrow$ 表示越高越好，$\downarrow$ 表示越低越好）
- 数值列右对齐
- 保持小数精度一致

**图表**：
- **矢量图形**（PDF，EPS）用于所有图表和图示 — `plt.savefig('fig.pdf')`
- **栅格图**（PNG，600 DPI）仅用于照片
- **色盲友好调色板**（Okabe-Ito 或 Paul Tol）
- **验证灰度可读性**（8%的男性有色觉缺陷）
- **图表内部无标题** — 标题由图注承担
- **图注应自成一体** — 读者无需阅读正文也能理解

### 会议论文重投

有关在不同会议间转换，请参见第7阶段（提交准备）—— 其中涵盖了完整的转换工作流、页数变更表以及拒稿后的指导建议。

### 专业LaTeX导言区

将以下包添加到任何论文中，以提升专业质量。它们与所有主要会议的样式文件兼容：

```latex
% --- 专业包（在会议样式文件之后添加） ---

% 排版
\usepackage{microtype}              % 微观排版改进（突出、扩展）
                                     % 使文本明显更精致 — 始终包含

% 表格
\usepackage{booktabs}               % 专业表格线 (\toprule, \midrule, \bottomrule)
\usepackage{siunitx}                % 一致的数字格式、小数点对齐
                                     % 用法: \num{12345} → 12,345; \SI{3.5}{GHz} → 3.5 GHz
                                     % 表格对齐: S 列类型用于数字的小数点对齐

% 图表
\usepackage{graphicx}               % 包含图形 (\includegraphics)
\usepackage{subcaption}             % 子图，带 (a), (b), (c) 标签
                                     % 用法: \begin{subfigure}{0.48\textwidth} ... \end{subfigure}

% 图示与算法
\usepackage{tikz}                   % 可编程矢量图
\usetikzlibrary{arrows.meta, positioning, shapes.geometric, calc, fit, backgrounds}
\usepackage[ruled,vlined]{algorithm2e}  % 专业伪代码
                                     % 备选: \usepackage{algorithmicx}（如果模板已捆绑）

% 交叉引用
\usepackage{cleveref}               % 智能引用: \cref{fig:x} → “图 1”
                                     % 必须在 hyperref 之后加载
                                     % 处理: 图、表、节、公式、算法

% 数学（通常由会议 .sty 包含，但请确认）
\usepackage{amsmath,amssymb}        % AMS 数学环境和符号
\usepackage{mathtools}              % 扩展 amsmath (dcases, coloneqq 等)

% 颜色（用于图表和图示）
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

**注意事项：**
- `microtype` 是提升视觉质量影响最大的单个包。它在子像素级别调整字符间距。务必包含。
- `siunitx` 通过 `S` 列类型处理表格中的小数点对齐 — 消除手动调整。
- `cleveref` 必须在 `hyperref` **之后** 加载。大多数会议 .sty 文件会加载 hyperref，因此将 cleveref 放在最后。
- 检查会议模板是否已加载其中任何包（特别是 `algorithm`、`amsmath`、`graphicx`）。避免重复加载。

### siunitx 表格对齐

`siunitx` 使包含大量数字的表格显著更易读：

```latex
\begin{tabular}{l S[table-format=2.1] S[table-format=2.1] S[table-format=2.1]}
\toprule
方法 & {准确率 $\uparrow$} & {F1 $\uparrow$} & {延迟 (ms) $\downarrow$} \\
\midrule
基线模型         & 85.2  & 83.7  & 45.3 \\
消融实验 (无 X)  & 87.1  & 85.4  & 42.1 \\
\textbf{我们的方法}    & \textbf{92.1} & \textbf{90.8} & \textbf{38.7} \\
\bottomrule
\end{tabular}
```

`S` 列类型会自动按小数点对齐。表头用 `{}` 包裹以避免对齐影响。

### 子图

并列图表的标准模式：

```latex
\begin{figure}[t]
  \centering
  \begin{subfigure}[b]{0.48\textwidth}
    \centering
    \includegraphics[width=\textwidth]{fig_results_a.pdf}
    \caption{在数据集 A 上的结果。}
    \label{fig:results-a}
  \end{subfigure}
  \hfill
  \begin{subfigure}[b]{0.48\textwidth}
    \centering
    \includegraphics[width=\textwidth]{fig_results_b.pdf}
    \caption{在数据集 B 上的结果。}
    \label{fig:results-b}
  \end{subfigure}
  \caption{我们的方法在两个数据集上的比较。(a) 展示了扩展行为，
  (b) 展示了消融实验结果。均使用 5 个随机种子。}
  \label{fig:results}
\end{figure}
```

使用 `\cref{fig:results}` → “图 1”，`\cref{fig:results-a}` → “图 1a”。

### 使用 algorithm2e 编写伪代码

```latex
\begin{algorithm}[t]
\caption{带评委小组的迭代优化}
\label{alg:method}
\KwIn{任务 $T$, 模型 $M$, 评委 $J_1 \ldots J_n$, 收敛阈值 $k$}
\KwOut{最终输出 $A^*$}
$A \gets M(T)$ \tcp*{初始生成}
$\text{连胜计数} \gets 0$\;
\While{$\text{连胜计数} < k$}{
  $C \gets \text{评论}(A, T)$ \tcp*{识别弱点}
  $B \gets M(T, C)$ \tcp*{根据评论修改的版本}
  $AB \gets \text{综合}(A, B)$ \tcp*{合并最佳元素}
  \ForEach{评委 $J_i$}{
    $\text{rank}_i \gets J_i(\text{随机排序}(A, B, AB))$ \tcp*{盲评排名}
  }
  $\text{胜者} \gets \text{波达计数}(\text{排名})$\;
  \eIf{$\text{胜者} = A$}{
    $\text{连胜计数} \gets \text{连胜计数} + 1$\;
  }{
    $A \gets \text{胜者}$; $\text{连胜计数} \gets 0$\;
  }
}
\Return{$A$}\;
\end{algorithm}
```

### TikZ 图示模式

TikZ 是机器学习论文中方法图示的标准工具。常见模式：

**流程图/过程图**（机器学习论文中最常见）：

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
  \node[box, fill=okgreen!20, right of=encoder] (latent) {潜在空间\\$z$};
  \node[box, fill=okorange!20, right of=latent] (decoder) {解码器\\$g_\phi$};
  \node[box, fill=okred!20, right of=decoder] (output) {输出\\$\hat{x}$};

  \draw[arrow] (input) -- (encoder);
  \draw[arrow] (encoder) -- (latent);
  \draw[arrow] (latent) -- (decoder);
  \draw[arrow] (decoder) -- (output);
\end{tikzpicture}
\caption{架构概述。编码器将输入 $x$ 映射到潜在表示 $z$，解码器据此重建。}
\label{fig:architecture}
\end{figure}
```

**对比/矩阵图**（用于展示方法变体）：

```latex
\begin{tikzpicture}[
  cell/.style={rectangle, draw, minimum width=2.5cm, minimum height=1cm,
               align=center, font=\small},
  header/.style={cell, fill=gray!20, font=\small\bfseries},
]
  % 表头
  \node[header] at (0, 0) {方法};
  \node[header] at (3, 0) {是否收敛?};
  \node[header] at (6, 0) {质量如何?};
  % 行
  \node[cell] at (0, -1) {单次处理};
  \node[cell, fill=okgreen!15] at (3, -1) {不适用};
  \node[cell, fill=okorange!15] at (6, -1) {基线};
  \node[cell] at (0, -2) {评论+修改};
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
  \node[box, fill=okblue!20] (gen) {生成器};
  \node[box, fill=okred!20, right=2.5cm of gen] (critic) {评论器};
  \node[box, fill=okgreen!20, below=1.5cm of $(gen)!0.5!(critic)$] (judge) {裁判组};

  \draw[arrow] (gen) -- node[label] {输出 $A$} (critic);
  \draw[arrow] (critic) -- node[label, right] {评论 $C$} (judge);
  \draw[arrow] (judge) -| node[label, left, pos=0.3] {胜出者} (gen);
\end{tikzpicture}
```

### 用于版本追踪的 latexdiff

对于论文修改回复至关重要——它能生成一个标记了版本间差异的PDF：

```bash
# 安装
# macOS：brew install latexdiff（或随 TeX Live 附带）
# Linux：sudo apt install latexdiff

# 生成差异
latexdiff paper_v1.tex paper_v2.tex > paper_diff.tex
pdflatex paper_diff.tex

# 用于多文件项目（使用 \input{} 或 \include{} 时）
latexdiff --flatten paper_v1.tex paper_v2.tex > paper_diff.tex
```

这会生成一个PDF，其中删除内容用红色删除线标出，新增内容用蓝色标出——这是论文修改回复补充材料的标准格式。

### 用于 matplotlib 的 SciencePlots

安装并使用它以获得出版级质量的图表：

```bash
pip install SciencePlots
```

```python
import matplotlib.pyplot as plt
import scienceplots  # 注册样式

# 使用科学样式（类似 IEEE 风格，简洁）
with plt.style.context(['science', 'no-latex']):
    fig, ax = plt.subplots(figsize=(3.5, 2.5))  # 单栏宽度
    ax.plot(x, y, label='我们的方法', color='#0072B2')
    ax.plot(x, y2, label='基线方法', color='#D55E00', linestyle='--')
    ax.set_xlabel('训练步数')
    ax.set_ylabel('准确率')
    ax.legend()
    fig.savefig('paper/fig_results.pdf', bbox_inches='tight')

# 可用样式：'science', 'ieee', 'nature', 'science+ieee'
# 如果生成图表的机器未安装 LaTeX，请添加 'no-latex'
```

**标准图表尺寸**（双栏格式）：
- 单栏：`figsize=(3.5, 2.5)` — 适合单栏
- 双栏：`figsize=(7.0, 3.0)` — 横跨两栏
- 方形：`figsize=(3.5, 3.5)` — 用于热图、混淆矩阵

---

## 阶段 6：自审与修订

**目标**：在提交前模拟审阅流程。尽早发现问题。

### 步骤 6.1：模拟审阅（集成模式）

从多个视角生成审阅意见。自动化研究流程（特别是 SakanaAI 的 AI-Scientist）的关键见解是：**与单次审阅相比，配备元审阅员的集成审阅能产生远为校准的反馈。**

**第 1 步：生成 N 份独立审阅意见**（N=3-5）

使用不同的模型或温度设置。每位审阅员只看到论文，看不到其他审阅意见。**默认采用负面偏见** — LLM 在评估中存在被充分记录的积极性偏差。

```
你是 [会议/期刊名称] 的专家审稿人。你批判性强且细致入微。
如果一篇论文存在弱点，或者你对某个论断存疑，请明确指出，
并在你的评分中体现出来。不要给予无根据的信任。

请根据官方审稿指南审阅这篇论文。评估：

1. 稳健性（论断是否有充分支持？基线是否公平且强大？）
2. 清晰度（论文写作质量如何？专家是否能复现？）
3. 重要性（对相关领域是否重要？）
4. 原创性（是否有新见解，而不仅仅是渐进式组合？）

请以结构化 JSON 格式提供你的审阅意见：
{
  "summary": "2-3句话的摘要",
  "strengths": ["优点 1", "优点 2", ...],
  "weaknesses": ["弱点 1 (最关键)", "弱点 2", ...],
  "questions": ["给作者的问题 1", ...],
  "missing_references": ["应引用的论文", ...],
  "soundness": 1-4,
  "presentation": 1-4,
  "contribution": 1-4,
  "overall": 1-10,
  "confidence": 1-5
}
```

**第 2 步：元审阅（领域主席汇总）**

将所有 N 份审阅意见提供给元审阅员：

```
你是 [会议/期刊名称] 的领域主席。你收到了一篇论文的 [N] 份独立审阅意见。
你的工作是：

1. 识别跨审稿人的共识优点和弱点
2. 通过直接检查论文来解决分歧
3. 生成一份代表汇总判断的元审阅意见
4. 使用所有审阅意见的平均数值分数

保持保守：如果审稿人对某个弱点是否严重存在分歧，
在作者回应之前，将其视为严重问题。

审阅意见：
[审阅意见 1]
[审阅意见 2]
...
```

**第 3 步：反思循环**（可选，2-3轮）

每位审稿人可以在看到元审阅意见后细化自己的审阅。使用提前终止哨兵：如果审稿人回应“我完成了”（无修改），则停止迭代。

**审阅的模型选择**：审阅最好使用可用的最强模型，即使你是用较便宜的模型撰写的论文。审阅模型应独立于写作模型进行选择。

**少样本校准**：如果可用，可包含 1-2 份来自目标会议/期刊的真实已发表审阅意见作为示例。这能显著提高评分校准效果。参见 [references/reviewer-guidelines.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md) 获取示例审阅意见。

### 步骤 6.1b：视觉审阅（VLM）

纯文本审阅会遗漏一整类问题：图表质量、布局问题、视觉一致性。如果你有具备视觉能力的模型，可以对编译后的 PDF 进行单独的**视觉审阅**：

```
你正在审阅这份研究论文 PDF 的视觉呈现。请检查：
1. 图表质量：图是否可读？标签是否清晰？颜色是否可区分？
2. 图表-标题对齐：每个标题是否准确描述了其图表？
3. 布局问题：孤立的章节标题、尴尬的分页、图表远离其首次引用处
4. 表格格式：列对齐、小数精度一致、最佳结果使用粗体
5. 视觉一致性：所有图表使用相同的配色方案、字体大小一致
6. 灰度可读性：如果黑白打印，图表是否仍然可理解？

对于每个问题，请指定页码和确切位置。
```

这能捕捉文本审阅无法发现的问题：带有难以辨认轴标签的图表、距离首次引用相隔 3 页的图表、图 2 和图 5 之间不一致的调色板，或明显超出栏宽的表格。

### 步骤 6.1c：论断核查

在模拟审阅之后，运行单独的核查过程。这能捕捉审阅员可能遗漏的事实错误：

```
论断核查协议：
1. 从论文中提取每一项事实性论断（数字、比较、趋势）
2. 对于每个论断，追溯到支持它的具体实验/结果
3. 核实论文中的数字是否与实际结果文件匹配
4. 将任何无法追溯来源的论断标记为 [待核实]
```

对于基于智能体的工作流：将核查工作委托给一个**新的子智能体**，该智能体仅接收论文文本和原始结果文件。新的上下文能防止确认偏差 — 核查者不“记得”结果本应是什么样子。

### 步骤 6.2：反馈优先级排序

收集审阅意见后，进行分类：

| 优先级 | 操作 |
|----------|--------|
| **关键**（技术缺陷、缺少基线） | 必须修复。可能需要重新实验 → 回到阶段 2 |
| **高**（清晰度问题、缺少消融实验） | 应在本次修订中修复 |
| **中**（轻微写作问题、额外实验） | 如有时间则修复 |
| **低**（风格偏好、附带建议） | 记录下来以备后续工作 |

### 步骤 6.3：修订循环

对于每个关键/高优先级问题：
1. 识别受影响的具体章节
2. 起草修复方案
3. 验证修复不会破坏其他论断
4. 更新论文
5. 根据审稿人的关注点重新检查

### 步骤 6.4：回复信撰写

在回应实际审阅意见（提交后）时，回复信的撰写是一项不同于修订的技能：

**格式**：逐点回应。对于每个审稿人的关注点：
```
> R1-W1: “论文缺少与方法 X 的比较。”

我们感谢审稿人的建议。我们在修订版的表 3 中添加了与方法 X 的比较。
我们的方法在 [指标] 上比 X 高出 3.2 个百分点 (p<0.05)。我们注意到，
X 的计算预算需要我们两倍的资源。
```

**规则**：
- 回应每一个关注点 — 审稿人会注意到你是否跳过了某个点
- 从最强的回应开始
- 简洁直接 — 审稿人要阅读数十份回复信
- 如果在回复期间运行了实验，请包含新结果
- 即使是针对薄弱批评，也绝不要表现出防御性或轻视
- 使用 `latexdiff` 生成标记了更改的 PDF（参见专业 LaTeX 工具部分）
- 感谢审稿人提供的具体、可操作的反馈（而非泛泛的称赞）

**不要做**：“我们礼貌地表示不同意”却没有证据。“这超出范围”却没有解释。只回应优点而忽略弱点。

### 步骤 6.5：论文演进追踪

在关键里程碑处保存快照：
```
paper/
  paper.tex                    # 当前工作版本
  paper_v1_first_draft.tex     # 第一份完整草稿
  paper_v2_post_review.tex     # 模拟审阅后
  paper_v3_pre_submission.tex  # 提交前最终版
  paper_v4_camera_ready.tex    # 录用后最终版
```

---

## 阶段7：提交准备

**目标**：最终检查、格式化和提交。

### 步骤7.1：会议清单

每个会议都有强制性的清单。请仔细完成它们——不完整的清单可能导致直接拒稿。

参见 [references/checklists.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/checklists.md) 了解：
- NeurIPS 16项论文清单
- ICML 更广泛影响 + 可复现性
- ICLR LLM披露政策
- ACL 强制性局限性章节
- 通用提交前清单

### 步骤7.2：匿名化清单

双盲评审意味着审稿人不能知道论文的作者是谁。请检查以下所有项：

```
匿名化清单：
- [ ] PDF中任何地方都没有作者姓名或所属机构
- [ ] 没有致谢部分（接受后添加）
- [ ] 自引使用第三人称写法："Smith et al. [1] showed..." 而不是 "We previously showed [1]..."
- [ ] 没有指向您个人仓库的 GitHub/GitLab URL
- [ ] 使用 Anonymous GitHub (https://anonymous.4open.science/) 提供代码链接
- [ ] 图中没有机构标识或标识符
- [ ] 文件元数据中没有作者姓名（检查PDF属性）
- [ ] 没有"our previous work"或"in our earlier paper"之类的措辞
- [ ] 数据集名称不暴露所属机构（必要时重命名）
- [ ] 补充材料中不包含识别信息
```

**常见错误**：补充代码中可见的Git提交信息、来自机构工具的带水印的图片、从之前草稿中留下的致谢部分、在匿名期之前发布的arXiv预印本。

### 步骤7.3：格式验证

```
提交前格式检查：
- [ ] 遵守页数限制（不包括参考文献和附录）
- [ ] 所有图表均为矢量（PDF）或高分辨率光栅（600 DPI PNG）
- [ ] 所有图表在灰度下可读
- [ ] 所有表格使用 booktabs 样式
- [ ] 参考文献编译正确（引用中没有"?"）
- [ ] 关键区域没有超出盒子宽度的内容
- [ ] 附录标签清晰并分开
- [ ] 存在必需的章节（局限性、更广泛的影响等）
```

### 步骤7.4：预编译验证

在尝试 `pdflatex` **之前** 运行这些自动化检查。在这里捕获错误比调试编译器输出更快。

```bash
# 1. 使用 chktex 检查（捕捉常见的 LaTeX 错误）
# 抑制嘈杂的警告：-n2（句子结尾），-n24（括号），-n13（句子间），-n1（命令结束）
chktex main.tex -q -n2 -n24 -n13 -n1

# 2. 验证所有引用在 .bib 中存在
# 从 .tex 提取 \cite{...}，并对照 .bib 检查每一项
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

# 3. 验证所有引用的图表文件在磁盘上存在
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

在继续之前修复任何警告。对于基于智能体的工作流程：将 chktex 输出反馈给智能体，并指示进行最小限度的修复。

### 步骤7.5：最终编译

```bash
# 清理构建
rm -f *.aux *.bbl *.blg *.log *.out *.pdf
latexmk -pdf main.tex

# 或者手动（三次 pdflatex + bibtex 以处理交叉引用）
pdflatex -interaction=nonstopmode main.tex
bibtex main
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex

# 验证输出存在且有内容
ls -la main.pdf
```

**如果编译失败**：解析 `.log` 文件中的第一个错误。常见修复：
- "Undefined control sequence" → 缺少包或命令名中有拼写错误
- "Missing $ inserted" → 数学符号在数学模式外使用
- "File not found" → 图表路径错误或缺少 .sty 文件
- "Citation undefined" → .bib 条目缺失或未运行 bibtex

### 步骤7.6：会议特定要求

| 会议 | 特殊要求 |
|------|---------|
| **NeurIPS** | 附录中需包含论文清单，若被接受需提供通俗摘要 |
| **ICML** | 更广泛影响声明（在结论之后，不计入页数限制） |
| **ICLR** | 需要 LLM 披露，互惠审稿协议 |
| **ACL** | 强制性局限性章节，负责任的 NLP 清单 |
| **AAAI** | 严格的样式文件——不允许任何修改 |
| **COLM** | 为语言模型社区做出框架性贡献 |

### 步骤7.7：会议重新投稿与格式转换

在不同会议之间转换时，**切勿直接复制 LaTeX 文档头（preamble）到模板之间**：

```bash
# 1. 使用目标模板重新开始
cp -r templates/icml2026/ new_submission/

# 2. 仅复制内容部分（非文档头）
#    - 摘要文本、章节内容、图表、参考文献条目

# 3. 调整以符合页数限制
# 4. 添加会议特定的必需章节
# 5. 更新参考文献
```

| 从 → 到 | 页数变化 | 关键调整 |
|---------|---------|---------|
| NeurIPS → ICML | 9 → 8 | 减少1页，添加更广泛影响 |
| ICML → ICLR | 8 → 9 | 扩展实验部分，添加 LLM 披露 |
| NeurIPS → ACL | 9 → 8 | 根据 NLP 惯例重组，添加局限性 |
| ICLR → AAAI | 9 → 7 | 大幅删减，严格遵守样式 |
| 任意 → COLM | 不定 → 9 | 重新构建以聚焦语言模型 |

删减页面时：将证明移至附录，浓缩相关工作，合并表格，使用子图。
扩展时：添加消融实验，扩展局限性部分，包含额外的基线，添加定性示例。

**被拒后**：在新版本中回应审稿人的顾虑，但不要包含"修改说明"章节或提及之前的投稿（因为是盲审）。

### 步骤7.8：最终定稿准备（接受后）

论文被接受后，准备最终定稿版本：

```
最终定稿清单：
- [ ] 匿名化还原：添加作者姓名、所属机构、电子邮件地址
- [ ] 添加致谢部分（资助、计算资源支持、有益的审稿人）
- [ ] 添加公开代码/数据 URL（真实的 GitHub，非匿名）
- [ ] 解决元审稿人提出的任何强制性修改
- [ ] 将模板切换至最终定稿模式（如果适用——例如 AAAI 的 \anon → \camera）
- [ ] 根据会议要求添加版权声明
- [ ] 更新文本中任何"匿名"的占位符
- [ ] 验证最终 PDF 能够干净地编译
- [ ] 检查最终定稿的页数限制（有时与提交时不同）
- [ ] 将补充材料（代码、数据、附录）上传至会议门户网站
```

### 步骤7.9：arXiv 与预印本策略

发布到 arXiv 是机器学习领域的标准做法，但有重要的时机和匿名性考量。

**时机决策树：**

| 情况 | 建议 |
|------|------|
| 投稿至双盲会议（NeurIPS, ICML, ACL） | 在提交截止日期**之后**发布到 arXiv，而不是之前。提前发布在技术上可能违反匿名政策，尽管执行情况不一。 |
| 投稿至 ICLR | ICLR 明确允许在提交前发布到 arXiv。但提交本身中不要包含作者姓名。 |
| 论文已在 arXiv 上，投稿至新会议 | 在大多数会议都是可接受的。**不要**在审稿期间更新 arXiv 版本，加入明确回应审稿意见的修改。 |
| Workshop 论文 | 任何时候发布到 arXiv 都可以——Workshop 通常不是双盲的。 |
| 希望确立优先权 | 如果担心被抢先，立即发布——但要接受匿名性的权衡。 |

**arXiv 分类选择**（机器学习/人工智能论文）：

| 分类 | 代码 | 最适用于 |
|------|------|---------|
| 机器学习 | `cs.LG` | 通用机器学习方法 |
| 计算与语言 | `cs.CL` | NLP、语言模型 |
| 人工智能 | `cs.AI` | 推理、规划、智能体 |
| 计算机视觉 | `cs.CV` | 视觉模型 |
| 信息检索 | `cs.IR` | 搜索、推荐 |

**列出主要类别 + 1-2 个交叉列表类别。** 更多类别 = 更多可见度，但只在真正相关时交叉列表。

**版本策略：**
- **v1**：初始提交（与会议投稿一致）
- **v2**：接受后带有最终定稿修正（在摘要中添加"accepted at [会议名称]"）
- 不要在审稿期间发布带有明显回应审稿人反馈的 v2 版本

```bash
# 检查您的论文标题是否已被占用（在选择标题前）
pip install arxiv
python -c "
import arxiv
results = list(arxiv.Search(query='ti:\"Your Exact Title\"', max_results=5).results())
print(f'Found {len(results)} matches')
for r in results: print(f'  {r.title} ({r.published.year})')
"
```

### 步骤7.10：研究代码打包

发布干净、可运行的代码能显著提高论文被引用次数和审稿人的信任度。在最终定稿提交时一并打包代码。

**仓库结构：**

```
your-method/
  README.md              # 设置、使用、复现说明
  requirements.txt       # 或使用 conda 的 environment.yml
  setup.py               # 用于可通过 pip 安装的包
  LICENSE                # 推荐 MIT 或 Apache 2.0 许可证用于研究
  configs/               # 实验配置
  src/                   # 核心方法实现
  scripts/               # 训练、评估、分析脚本
    train.py
    evaluate.py
    reproduce_table1.sh  # 每个主要结果对应一个脚本
  data/                  # 小型数据或下载脚本
    download_data.sh
  results/               # 用于验证的预期输出
```

**研究代码的 README 模板：**

```markdown
# [论文标题]

[论文标题]（会议年份）的官方实现。

## 设置
[设置环境的具体命令]

## 复现
复现表格 1：`bash scripts/reproduce_table1.sh`
复现图表 2：`python scripts/make_figure2.py`

## 引用
[BibTeX 条目]
```

**发布前清单：**
```
- [ ] 代码在全新克隆下可运行（在新机器或 Docker 中测试）
- [ ] 所有依赖项固定到特定版本
- [ ] 没有硬编码的绝对路径
- [ ] 仓库中没有 API 密钥、凭证或个人数据
- [ ] README 涵盖设置、复现和引用
- [ ] 存在 LICENSE 文件（推荐 MIT 或 Apache 2.0 以最大化复用）
- [ ] 结果在预期方差内可复现
- [ ] .gitignore 排除了数据文件、检查点、日志
```

**用于提交的匿名代码**（接受前）：
```bash
# 使用 Anonymous GitHub 进行双盲评审
# https://anonymous.4open.science/
# 上传您的仓库 → 获取匿名 URL → 放入论文中
```

## 阶段 8：论文接收后的后续工作

**目标**：通过展示材料和社区互动，最大化已接收论文的影响力。

### 步骤 8.1：会议海报

大多数会议要求海报展示。海报设计原则如下：

| 元素 | 指导原则 |
|---------|-----------|
| **尺寸** | 核查会议要求（通常为24"x36"或A0纵向/横向） |
| **内容** | 标题、作者、一句话贡献总结、方法图、2-3个关键结果、结论 |
| **布局** | 从左上到右下（Z形）或按列排布 |
| **文字** | 标题在3米外可读，正文在1米外可读。避免整段文字——仅使用要点列表。 |
| **图表** | 复用论文中的图表（提高分辨率）。放大关键结果图。 |

**工具**：LaTeX (`beamerposter` 宏包)、PowerPoint/Keynote、Figma、Canva。

**制作**：会议前至少2周下单。织物海报更便于携带出行。许多会议现在也支持虚拟/数字海报。

### 步骤 8.2：会议报告 / 精彩集锦报告

如果被选为口头报告或精彩集锦报告：

| 报告类型 | 时长 | 内容 |
|-----------|----------|---------|
| **精彩集锦报告** | 5分钟 | 介绍问题、方法、一个关键结果。严格控制在5分钟内并反复练习。 |
| **口头报告** | 15-20分钟 | 完整讲述：问题、方法、关键结果、消融实验、局限性。 |
| **研讨会报告** | 10-15分钟 | 根据研讨会听众调整——可能需要更多背景介绍。 |

**幻灯片设计规则：**
- 每页幻灯片只表达一个核心思想
- 精简文字——口头阐述细节，不要投影出来
- 动画演示关键图表，逐步引导理解
- 结尾准备一页“要点总结”幻灯片（一句话总结贡献）
- 准备备用幻灯片以应对预期中的提问

### 步骤 8.3：博客文章 / 社交媒体

一份通俗易懂的摘要能显著提升影响力：

- **Twitter/X 帖文**：5-8条推文。以结果开头，而非方法。包含图1和关键结果图。
- **博客文章**：800-1500字。为机器学习从业者而非审稿人撰写。跳过形式化推导，强调直觉和实际意义。
- **项目主页**：包含摘要、图表、演示、代码链接、BibTeX的HTML页面。使用GitHub Pages。

**时机**：在论文出现在会议论文集或arXiv定稿版后1-2天内发布。

---

## 研讨会论文与短论文

研讨会论文和短论文（例如ACL短论文、Findings论文）遵循相同的流程，但约束和期望值不同。

### 研讨会论文

| 属性 | 研讨会 | 主会议 |
|----------|----------|-----------------|
| **页数限制** | 通常4-6页 | 7-9页 |
| **评审标准** | 对完整性要求较低 | 必须完整、深入 |
| **评审流程** | 通常是单盲或轻量评审 | 双盲、严格 |
| **评审重点** | 有趣的想法、初步结果、立场文章 | 具有强大基线的完整实证研究 |
| **arXiv** | 随时可以发布 | 时机很重要（参见arXiv策略） |
| **贡献要求** | 新方向、有趣的负面结果、进行中的工作 | 有强证据支持的重要进展 |

**何时考虑投稿研讨会：**
- 想在撰写完整论文前获得反馈的早期想法
- 不足以支撑8页以上内容的负面结果
- 关于时事话题的立场文章或观点
- 重复研究或可复现性报告

### ACL 短论文与 Findings 论文

ACL会议有明确的投稿类型：

| 类型 | 页数 | 期望内容 |
|------|-------|-----------------|
| **长论文** | 8页 | 完整研究、强大基线、消融实验 |
| **短论文** | 4页 | 聚焦贡献：一个明确的观点及其证据支撑 |
| **Findings 论文** | 8页 | 质量扎实但与主会场失之交臂的优秀工作 |

**短论文策略**：选择一个主张并充分论证。不要试图将长论文压缩到4页——撰写一篇不同、更聚焦的论文。

# 超越实证机器学习的论文类型

上述主要流程针对实证机器学习论文。其他类型的论文需要不同的结构和证据标准。详见 [references/paper-types.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md) 获取每种类型的详细指南。

### 理论论文

**结构**：引言 → 预备知识（定义、符号）→ 主要结果（定理）→ 证明草图 → 讨论 → 完整证明（附录）

**与实证论文的主要区别：**
- 贡献在于一个定理、界或不可能性结果——而非实验数据
- "方法"部分被"预备知识"和"主要结果"取代
- 证明是证据，而非实验（但对理论的实证验证是受欢迎的）
- 主文中包含证明草图，完整证明放在附录是标准做法
- 实验部分是可选的，但如果能验证理论预测，则能增强论文说服力

**证明写作原则：**
- 形式化陈述定理，所有假设条件必须明确
- 在形式证明前提供直觉性解释（"关键洞察是..."）
- 证明草图应在0.5-1页内传达主要思想
- 使用 `\begin{proof}...\end{proof}` 环境
- 为假设编号并在定理中引用："在假设1-3下，..."

### 综述 / 教程论文

**结构**：引言 → 分类体系 / 组织结构 → 详细阐述 → 开放问题 → 结论

**主要区别：**
- 贡献在于组织、综合和识别开放问题——而非新方法
- 必须在范围内全面（审稿人会检查是否有缺失的引用）
- 需要一个清晰的分类体系或组织框架
- 价值来源于单篇论文未建立的各工作之间的联系
- 最佳发表场所：TMLR (survey track), JMLR, Foundations and Trends in ML, ACM Computing Surveys

### 基准测试论文

**结构**：引言 → 任务定义 → 数据集构建 → 基线评估 → 分析 → 预期用途与局限性

**主要区别：**
- 贡献在于基准测试本身——它必须填补一个真正的评估空白
- 数据集文档是强制性的，而非可选的（参见数据表，步骤5.11）
- 必须证明该基准测试具有挑战性（基线方法无法使其饱和）
- 必须证明该基准测试衡量的是你声称要衡量的内容（构念效度）
- 最佳发表场所：NeurIPS Datasets & Benchmarks track, ACL (resource papers), LREC-COLING

### 立场论文

**结构**：引言 → 背景 → 论点 / 论证 → 支持证据 → 反论 → 影响

**主要区别：**
- 贡献在于论证，而非结果
- 必须认真对待反论
- 证据可以是实证的、理论的或逻辑分析
- 最佳发表场所：ICML (position track), workshops, TMLR

---

## 与 Hermes 智能体的集成

此技能专为 Hermes 智能体设计。它使用 Hermes 的工具、任务委派、调度和记忆功能来支持完整的研究生命周期。

### 相关技能

将此技能与其他 Hermes 技能结合使用，以应对特定阶段：

| 技能 | 何时使用 | 如何加载 |
|-------|-------------|-------------|
| **arxiv** | 阶段 1（文献综述）：搜索 arXiv、生成 BibTeX、通过 Semantic Scholar 查找相关论文 | `skill_view("arxiv")` |
| **subagent-driven-development** | 阶段 5（草稿撰写）：通过两阶段审阅（规范符合性，然后是质量）并行撰写各章节 | `skill_view("subagent-driven-development")` |
| **plan** | 阶段 0（设置）：执行前创建结构化计划。写入 `.hermes/plans/` | `skill_view("plan")` |
| **qmd** | 阶段 1（文献）：通过混合 BM25+向量搜索查询本地知识库（笔记、转录、文档） | 安装： `skill_manage("install", "qmd")` |
| **diagramming** | 阶段 4-5：创建基于 Excalidraw 的图表和架构图 | `skill_view("diagramming")` |
| **data-science** | 阶段 4（分析）：用于交互式分析和可视化的 Jupyter 实时内核 | `skill_view("data-science")` |

**此技能取代 `ml-paper-writing`** ——它包含了 `ml-paper-writing` 的所有内容，并增加了完整的实验/分析流程和自动推理方法论。

### Hermes 工具参考

| 工具 | 在此流程中的用法 |
|------|----------------------|
| **`terminal`** | LaTeX 编译（`latexmk -pdf`）、git 操作、启动实验（`nohup python run.py &`）、进程检查 |
| **`process`** | 后台实验管理：`process("start", ...)`, `process("poll", pid)`, `process("log", pid)`, `process("kill", pid)` |
| **`execute_code`** | 运行 Python 代码进行引文验证、统计分析、数据聚合。可通过 RPC 访问工具。 |
| **`read_file`** / **`write_file`** / **`patch`** | 论文编辑、实验脚本、结果文件。使用 `patch` 对大型 `.tex` 文件进行定向修改。 |
| **`web_search`** | 文献发现：`web_search("transformer attention mechanism 2024")` |
| **`web_extract`** | 获取论文内容，验证引文：`web_extract("https://arxiv.org/abs/2303.17651")` |
| **`delegate_task`** | **并行章节撰写** —— 为每个章节生成独立的子智能体。也用于并发引文验证。 |
| **`todo`** | 跨会话的主要状态跟踪器。在每次阶段转换后更新。 |
| **`memory`** | 跨会话保存关键决策：贡献框架、场所选择、审稿人反馈。 |
| **`cronjob`** | 安排实验监控、截止日期倒计时、自动 arXiv 检查。 |
| **`clarify`** | 当被阻塞时向用户提出有针对性的问题（场所选择、贡献框架）。 |
| **`send_message`** | 当实验完成或草稿就绪时通知用户，即使用户不在聊天中。 |

### 工具使用模式

**实验监控**（最常用）：
```
terminal("ps aux | grep <模式>")
→ terminal("tail -30 <日志文件>")
→ terminal("ls results/")
→ execute_code("分析结果 JSON，计算指标")
→ terminal("git add -A && git commit -m '<描述性信息>' && git push")
→ send_message("实验完成：<摘要>")
```

**并行章节撰写**（使用任务委派）：
```
delegate_task("根据这些实验脚本和配置撰写方法部分。
  包含：伪代码、所有超参数、足以复现的架构细节。
  使用 neurips2025 模板规范以 LaTeX 格式撰写。")

delegate_task("撰写相关工作部分。使用 web_search 和 web_extract 查找论文。
  通过 Semantic Scholar 验证每一条引文。按方法论进行分组。")

delegate_task("撰写实验部分。读取 results/ 中的所有结果文件。
  说明每个实验支持哪项主张。包含误差线和显著性检验。")
```

每个委派任务都作为一个**全新的子智能体**运行，没有共享上下文——请在提示中提供所有必要信息。收集输出并整合。

**引文验证**（使用 execute_code）：
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

**`memory` 工具** —— 保存关键决策（有大小限制：MEMORY.md 约 2200 字符）：
```
memory("add", "论文：autoreason。目标：NeurIPS 2025 (9页)。
  贡献：当生成-评估差距较大时，结构化改进有效。
  关键结果：Haiku 42/42，Sonnet 3/5，S4.6 constrained 2/3。
  状态：阶段 5——正在撰写方法部分。")
```
在做出重大决策或阶段转换后更新内存。这会跨会话保存。

**`todo` 工具** —— 跟踪具体进展：
```
todo("add", "为 Sonnet 4.6 设计约束任务实验")
todo("add", "运行 Haiku 基线比较")
todo("add", "撰写方法部分")
todo("update", id=3, status="进行中")
todo("update", id=1, status="已完成")
```

**会话启动协议：**
```
1. todo("list")                           # 检查当前任务列表
2. memory("read")                         # 回忆关键决策
3. terminal("git log --oneline -10")      # 检查最近提交
4. terminal("ps aux | grep python")       # 检查正在运行的实验
5. terminal("ls results/ | tail -20")     # 检查是否有新结果
6. 向用户报告状态，询问方向
```

### 使用 `cronjob` 进行定时监控

使用 `cronjob` 工具安排定期实验检查：
```
cronjob("create", {
  "schedule": "*/30 * * * *",  # 每 30 分钟
  "prompt": "检查实验状态：
    1. ps aux | grep run_experiment
    2. tail -30 logs/experiment_haiku.log
    3. ls results/haiku_baselines/
    4. 如果完成：读取结果，计算 Borda 分数，
       git add -A && git commit -m '添加 Haiku 结果' && git push
    5. 报告：结果表格、关键发现、下一步
    6. 如果没有变化：回复 [SILENT]"
})
```

**[SILENT] 协议**：当自上次检查后没有变化时，精确回复 `[SILENT]`。这会抑制向用户发送通知。只在有真正值得了解的变化时才报告。

**截止日期跟踪**：
```
cronjob("create", {
  "schedule": "0 9 * * *",  # 每天上午 9 点
  "prompt": "NeurIPS 2025 截止日期：5月22日。今天是 {date}。
    剩余天数：{compute}。
    检查待办事项列表——我们按计划进行吗？
    如果剩余不到 7 天：提醒用户注意剩余任务。"
})
```

### 沟通模式

**何时通知用户**（通过 `send_message` 或直接回复）：
- 实验批次完成（附结果表）
- 出乎意料的发现或失败，需要决策
- 草稿章节就绪，可供审阅
- 截止日期临近且任务未完成

**何时不通知：**
- 实验仍在运行，无新结果 → `[SILENT]`
- 常规监控无变化 → `[SILENT]`
- 不需要关注的中间步骤

**报告格式** —— 始终包含结构化数据：
```
## 实验：<名称>
状态：完成 / 运行中 / 失败

| 任务 | 方法 A | 方法 B | 方法 C |
|------|---------|---------|---------|
| 任务 1 | 85.2 | 82.1 | **89.4** |

关键发现：<一句话>
下一步：<接下来做什么>
```

### 需要人工输入的决策点

当确实被阻塞时，使用 `clarify` 提出有针对性的问题：

| 决策 | 何时提问 |
|----------|-------------|
| 目标会议 | 开始写论文之前（影响页数限制、框架） |
| 贡献框架 | 当存在多种有效框架时 |
| 实验优先级 | 当待办事项列表中的实验数量超过可用时间时 |
| 提交准备情况 | 最终提交之前 |

**不要问以下问题**（主动做出选择，标记它）：
- 措辞选择、章节顺序
- 突出显示哪些具体结果
- 引文完整性（用你找到的写，注明缺失部分）

---

## 评审专家评估标准

理解评审专家的关注点有助于聚焦论文重点：

| 标准 | 他们检查的内容 |
|------|----------------|
| **质量** | 技术严谨性、论据充分性、基准公平性 |
| **清晰度** | 写作清晰、专家可复现、符号一致 |
| **重要性** | 社区影响力、推进理解 |
| **原创性** | 新见解（不强制要求新方法） |

**评分标准（NeurIPS 6分制）：**
- 6：强烈接收 — 开创性工作，无瑕疵
- 5：接收 — 技术扎实，影响深远
- 4：边缘接收 — 扎实但评估有限
- 3：边缘拒收 — 不足之处占主导
- 2：拒收 — 存在技术缺陷
- 1：强烈拒收 — 已知结果或伦理问题

详细指南、常见问题及反驳策略请参阅 [references/reviewer-guidelines.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md)。

---

## 常见问题与解决方案

| 问题 | 解决方案 |
|------|----------|
| 摘要过于通用 | 如果开头第一句可套用任何机器学习论文，请删除。从你的具体贡献开始写。 |
| 引言超过1.5页 | 将背景部分拆分到相关工作章节。前置贡献要点列表。 |
| 实验缺乏明确主张 | 在每个实验前添加：“本实验旨在检验 [具体主张] 是否成立...”。 |
| 评审专家觉得论文难懂 | 添加引导语，使用一致的术语，使图表标题自成一体。 |
| 缺乏统计显著性 | 添加误差线、运行次数、统计检验、置信区间。 |
| 实验范围蔓延 | 每个实验必须对应一个具体主张。删除不对应的实验。 |
| 论文被拒，需重新提交 | 参见第七阶段“会议重新投稿”。解决评审疑虑但不要提及评审意见。 |
| 缺少更广泛影响声明 | 参见步骤5.10。大多数会议要求包含。“无负面影响”几乎从不可信。 |
| 人工评估被批薄弱 | 参见步骤2.5及 [references/human-evaluation.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md)。报告一致性指标、标注者详情、报酬情况。 |
| 评审专家质疑可复现性 | 发布代码（步骤7.9），记录所有超参数，包含随机种子和计算详情。 |
| 理论论文缺乏直观解释 | 在正式证明前添加附有通俗解释的证明草图。参见 [references/paper-types.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md)。 |
| 结果为负/零结果 | 参见4.3节关于处理负结果的方法。考虑投稿研讨会、TMLR，或重新框架为分析性论文。 |

---

## 参考文档

| 文档 | 内容 |
|------|------|
| [references/writing-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/writing-guide.md) | Gopen & Swan 7原则、Perez微技巧、Lipton选词、Steinhardt精确表达、图表设计 |
| [references/citation-workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/citation-workflow.md) | 引用API、Python代码、CitationManager类、BibTeX管理 |
| [references/checklists.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/checklists.md) | NeurIPS 16项、ICML、ICLR、ACL要求、通用投稿前检查清单 |
| [references/reviewer-guidelines.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/reviewer-guidelines.md) | 评估标准、评分、常见问题、反驳模板 |
| [references/sources.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/sources.md) | 所有写作指南、会议规范、API的完整参考文献 |
| [references/experiment-patterns.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/experiment-patterns.md) | 实验设计模式、评估协议、监控、错误恢复 |
| [references/autoreason-methodology.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/autoreason-methodology.md) | 自动推理循环、策略选择、模型指南、提示词、范围约束、Borda计分 |
| [references/human-evaluation.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/human-evaluation.md) | 人工评估设计、标注指南、一致性指标、众包质量控制、伦理审查指导 |
| [references/paper-types.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/references/paper-types.md) | 理论论文（证明写作、定理结构）、综述论文、基准论文、立场论文 |

### LaTeX 模板

`templates/` 中包含以下会议模板：**NeurIPS 2025**、**ICML 2026**、**ICLR 2026**、**ACL**、**AAAI 2026**、**COLM 2025**。

编译说明请参阅 [templates/README.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/research/research-paper-writing/templates/README.md)。

### 关键外部资源

**写作理念：**
- [Neel Nanda：如何撰写机器学习论文](https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers)
- [Sebastian Farquhar：如何撰写机器学习论文](https://sebastianfarquhar.com/on-research/2024/11/04/how_to_write_ml_papers/)
- [Gopen & Swan：科学写作的科学](https://cseweb.ucsd.edu/~swanson/papers/science-of-writing.pdf)
- [Lipton：科学写作启发法](https://www.approximatelycorrect.com/2018/01/29/heuristics-technical-scientific-writing-machine-learning-perspective/)
- [Perez：轻松论文写作技巧](https://ethanperez.net/easy-paper-writing-tips/)

**API：** [Semantic Scholar](https://api.semanticscholar.org/api-docs/) | [CrossRef](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | [arXiv](https://info.arxiv.org/help/api/basics.html)

**会议：** [NeurIPS](https://neurips.cc/Conferences/2025/PaperInformation/StyleFiles) | [ICML](https://icml.cc/Conferences/2025/AuthorInstructions) | [ICLR](https://iclr.cc/Conferences/2026/AuthorGuide) | [ACL](https://github.com/acl-org/acl-style-files)