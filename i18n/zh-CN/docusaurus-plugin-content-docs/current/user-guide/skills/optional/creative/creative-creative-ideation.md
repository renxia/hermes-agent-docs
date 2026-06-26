---
title: Creative Ideation — Generate ideas via named methods from creative practice
sidebar_label: Creative Ideation
description: 通过命名方法从创意实践中生成想法
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 创意构思 (Creative Ideation)

通过命名方法从创意实践中生成想法。

## 技能元数据 (Skill metadata)

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/creative/creative-ideation` 安装 |
| Path | `optional-skills/creative/creative-ideation` |
| Version | `2.1.0` |
| Author | SHL0MS |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `创意`, `构思`, `头脑风暴`, `方法`, `灵感` |

## 参考：完整的 SKILL.md (Reference: full SKILL.md)

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# 创意构思 (Creative Ideation)

一个适用于任何领域的构思方法库。阅读用户的处境，路由到匹配的方法，进行应用，生成具体且非显而易见的结果。方法是工具——选择适合当前情况的那个，而不是全部执行。

## 何时使用 (When to use)

任何开放式、生成性或选择性的问题：“我想制作/构建/写作/开始某件事”，“我卡住了”，“给我灵感”，“让它更怪异一些”，“帮我挑选”，“我需要发明 X”，“给我一个研究问题”。

## 操作规则 (Operating rules)

1. **约束加上方向即是创造力。** 没有约束 = 没有牵引力。没有方向 = 没有形态。方法提供了两者。
2. **拒绝前三个想法。** 它们是垃圾（slop）。生成，丢弃，再生成。参考 `references/anti-slop.md`。
3. **每次回复只使用一种方法，除非被要求。** 不要堆叠。
4. **具体性胜过抽象性。** 使用真实的专有名词、真实的材料、真实的机制。“一个用于 X 的应用”是垃圾；“一个当 Z 发生时会打印 Y 的 200 行 CLI 工具”才是方向。命名技术栈不是具体性——而是命名一个机制。
5. **怪异也必须有用。** 打破框架是目标，但一个没有真实处境、机制或存在理由的奇怪想法，本身就是一种失败模式。每一组想法都必须包含至少一个**当前可构建/可追求**的（buildable/pursuable now）——非显而易见但有基础，并有一个真实的起始步骤。不要为了惊喜而牺牲所有实用性。
6. **命名你所使用的方法以及发明它的那个人。** 署名即是纪律。
7. **当用户选择一个时，就去构建它。** 不要在他们选择后继续生成。

## 路由 — 四步流程 (Routing — 4-step procedure)

在生成任何输出*之前*执行此操作。路由失败会产生垃圾（slop）。

如果更简洁，可以跳过叙述路由步骤，但**绝不能以牺牲每个想法的深度为代价来压缩**：每个想法的具体机制、情境绑定和诚实的失败模式，才是使输出变得好的地方（可衡量），它们不是支架，不要剪掉。

### 第 1 步 — 从提示中提取三个信号 (Step 1 — Extract three signals from the prompt)

**PHASE（阶段）** — 用户处于哪个阶段？

| Phase | 线索 (Cues) |
|---|---|
| **GENERATING (生成)** | “给我一个想法”，“我应该做什么”，“给我灵感”，尚未有任何想法 |
| **EXPANDING (扩展)** | “还有什么其他选择”，“更多类似这样的”，“给我变体”——已有基础想法 |
| **SELECTING (选择)** | “帮我挑选”，“我应该做哪个”，“我有这些选项” |
| **UNBLOCKING (解封)** | “我卡住了”，“被阻碍了”，“陷入循环”，“状态不佳”——有材料可供使用 |
| **SUBVERTING (颠覆)** | “让它更怪异一些”，“更不明显一些”，“这太安全了” |
| **REFINING (精炼)** | “这个可以，但缺少点什么”，“感觉粗糙” |
| **SYNTHESIZING (综合)** | “我有一堆笔记/访谈/观察记录” |

**DOMAIN（领域）** — 用户在做什么/制作什么？

| Domain | 线索 (Cues) |
|---|---|
| **TEXT (文本)** | 小说、散文、诗歌、歌词、剧本、文案 |
| **OBJECT (物体)** | 视觉艺术、音乐、声音、表演、装置、雕塑 |
| **ARTIFACT (产物)** | 软件、硬件、机制、设备 |
| **SYSTEM (系统)** | 组织、公民事务、机构、生态、社区 |
| **SELF (自我)** | 生活决定、职业、个人实践 |
| **RESEARCH (研究)** | 论文、学位论文、学术问题 |
| **PRODUCT (产品)** | 商业、市场、服务 |

**SPECIFICITY（具体性）** — 提示中有多少约束？

| Level | 线索 (Cues) |
|---|---|
| **NONE (无)** | “我感到无聊”，“给我灵感”——没有领域，没有项目 |
| **DOMAIN (领域)** | “我想写点东西”——知道领域，但没有具体项目 |
| **PROJECT (项目)** | “我正在做这个特定的 X” |
| **PROBLEM (问题)** | “我在 X 中遇到了特定的摩擦/痛点” |

### 第 2 步 — 应用覆盖规则（最高优先级，先执行）(Step 2 — Apply overrides)

覆盖规则凌驾于路由表之上：

- **情绪信号** — 用户说“怪异的”、“奇怪的”、“令人惊讶的”、“更不明显一些”、“更有趣一些”→ `references/methods/lateral-provocations.md` 或 `references/methods/pataphysics.md`，无论领域如何。
- **用户指定方法** — 使用它。
- **用户要求推荐方法**（“用哪个方法”）→ 呈现 2–3 个候选方法及其单行描述，询问用户想应用哪一个。不要默默地默认。
- **高垃圾（High-slop）领域** — “AI 想法”，“创业想法”，“习惯追踪器”，“生产力/健康/健身/食物/旅行应用”→ 强制使用 `references/methods/lateral-provocations.md` 或 `references/methods/pataphysics.md`，而不是显而易见的方法。拒绝前 **5** 个想法，而不是 3 个。

### 第 3 步 — 先按阶段路由，再按领域 (Step 3 — Route by phase first, then domain)

**按阶段（无论领域如何均适用）：**

| Phase | 默认路由 |
|---|---|
| GENERATING + SPECIFICITY=NONE | `references/full-prompt-library.md` **通用 (General)** 部分（约束分配） |
| GENERATING + DOMAIN known | 按领域路由（下一表） |
| EXPANDING | `references/methods/scamper.md` |
| SELECTING | `references/methods/premortem-and-inversion.md`（或针对正面情况的 `references/methods/compression-progress.md`） |
| UNBLOCKING | `references/methods/oblique-strategies.md` |
| SUBVERTING | `references/methods/lateral-provocations.md` (备选：`references/methods/pataphysics.md`) |
| REFINING (文本) | `references/methods/defamiliarization.md` |
| REFINING (其他) | `references/methods/creative-discipline.md` (Tharp 的脊柱) |
| SYNTHESIZING | `references/methods/affinity-diagrams.md` |
| Volume needed fast | `references/methods/volume-generation.md` |

**按领域（当 GENERATING 且 DOMAIN 已知时）：**

| Domain | 默认路由 |
|---|---|
| TEXT — 正式/诗歌 | `references/methods/oulipo.md` |
| TEXT — 叙事 | `references/methods/story-skeletons.md` |
| TEXT — 有素材可重组 | `references/methods/chance-and-remix.md` |
| OBJECT (音乐、视觉、表演) | `references/methods/oblique-strategies.md` |
| OBJECT — 物理制作者 / 需要一个起始约束 | `references/full-prompt-library.md` **物理 / 物体** 部分 |
| ARTIFACT — 需要一个起始约束 | `references/full-prompt-library.md` **软件 / 产物** 部分 |
| ARTIFACT — 工程发明且存在参数冲突 | `references/methods/triz-principles.md` |
| ARTIFACT — 软件架构 | `references/methods/pattern-languages.md` |
| ARTIFACT — 有自然系统类比 | `references/methods/biomimicry.md` |
| ARTIFACT — 需要质疑已有的假设 | `references/methods/first-principles.md` |
| SYSTEM (公民、组织、机构) | `references/methods/leverage-points.md` |
| SYSTEM — 集体/参与式 | `references/full-prompt-library.md` **社会 / 集体** 部分 |
| SELF (生活、职业、要学习什么) | `references/methods/derive-and-mapping.md` |
| RESEARCH — 选择一个问题 | `references/methods/compression-progress.md` |
| RESEARCH — 攻击一个已知问题 | `references/methods/polya.md` |
| PRODUCT (商业、服务) | `references/methods/jobs-to-be-done.md` |
| Need to break a frame / find analogy | `references/methods/analogy-and-blending.md` |

### 第 4 步 — 处理歧义和矛盾 (Step 4 — Handle ambiguity and contradiction)

- **多个路径都合理** → 选择最接近用户实际措辞的那一条。不要选择最有趣的方法来显得自己很聪明。
- **真正模棱两可** → 提出一个澄清问题，不要默默猜测。示例：“你是在生成想法还是在已有的选项中进行选择？” / “这是用于小说、散文还是其他用途？”
- **信号矛盾**（例如，“怪异的创业想法”→ 产品领域 + 怪异情绪）→ **明确地堆叠两种方法**。说明你在做什么：“使用 `jobs-to-be-done` 进行产品框架设定 + 使用 `lateral-provocations` 来打破显而易见的形态。”
- **没有匹配项** → 约束分配（`references/full-prompt-library.md`）是安全的后备方案。
- **再次提出相同的问题** → 切换方法。方法的变化 = 想法分布的变化。

### 反默认检查 (Anti-default check)（生成前运行）

- 即将要写“这里有 5 个想法：”或一个裸露的编号列表？→ 停止。先选择一个方法。
- 即将默认进行通用 LLM 模式的头脑风暴？→ 停止。请从上文选择一条路径。
- 输出看起来像未经路由的 LLM 会产出的东西？→ 路由失败，重做。

这个默认的 LLM 模式正是本技能存在的意义。如果你在没有经过路由的情况下生成内容，你就击败了这门技能。

对于更深层次的边缘案例（情绪信号、堆叠、反模式），请参考 `references/heuristics.md`。

## 输出格式 (Output format)

对于约束分配默认路径：

```
## 约束: [名称] — 来自 [来源]
> [一个句子描述该约束]

### 想法 (Ideas)

1. **[单行宣传语]**
   [2-3 个句子——具体是什么，为什么有趣]
   ⏱ [周末/周/月] • 🔧 [技术栈/介质/材料]

2. ...
3. ...
```

对于其他方法，请使用该方法指定的格式（TRIZ 会生成矛盾分析；OuLiPo 会生成约束文本；Oblique Strategies 会生成一个已应用的卡片 → 下一步）。不要强迫所有方法都套用约束模板。

**每一组想法，无论采用何种方法：**
- 命名所使用的方法。在垃圾领域中，也要命名那些你拒绝的显而易见的想法。
- 为每个想法提供其具体的机制和诚实的失败模式/权衡/目标人群。这种深度才是让想法落地的关键——是可衡量的，而非装饰性的。
- 标记至少一个想法为**有基础的 (grounded)** — 当前可构建/可追求，非显而易见但有真实的起始步骤。其他想法可以继续朝着怪异的方向发展；但这个必须是真正可实现的。不要让整个集合都变得奇怪但不可行。

## 文件地图 (File map)

- `references/full-prompt-library.md` — 约束库，按领域划分（通用、软件、物理、社会、列表）。SPECIFICITY=NONE 的默认路径。
- `references/method-catalog.md` — 每种方法的单行摘要 + 何时使用
- `references/heuristics.md` — 边缘案例的扩展决策树
- `references/anti-slop.md` — 反垃圾规则；应用于所有输出
- `references/exercises.md` — 限时练习（5分钟 / 30分钟 / 1小时 / 日 / 周）
- `references/methods/` — 22 个命名方法，每个文件一个，只加载你正在使用的那一个

## 署名 (Attribution)

约束分配核心改编自 [wttdotm.com/prompts.html](https://wttdotm.com/prompts.html)。方法源自每个方法文件中引用的原始资料。