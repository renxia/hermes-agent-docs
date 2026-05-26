---
title: "看板视频协调器 — 规划、搭建和监控基于Hermes看板的多智能体视频制作流水线"
sidebar_label: "看板视频协调器"
description: "规划、搭建和监控基于Hermes看板的多智能体视频制作流水线"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非本页面。 */}

# 看板视频协调器

规划、搭建和监控基于Hermes看板的多智能体视频制作流水线。当用户想要制作**任何**类型的视频——叙事电影、产品/营销视频、音乐视频、解说视频、ASCII/终端艺术、抽象/生成循环、漫画、3D、实时/装置艺术——且该工作需要分解为通过看板协调的专业配置文件（编剧、设计师、动画师、渲染师、配音、剪辑等）时，使用此技能。它执行自适应发现以确定简报范围，为所请求的风格设计合适的团队，生成创建Hermes配置文件和初始看板任务的设置脚本，然后帮助监控执行并在任务停滞或失败时进行干预。将场景路由到适合每个节拍的Hermes渲染/音频/设计技能（`ascii-video`、`manim-video`、`p5js`、`comfyui`、`touchdesigner-mcp`、`blender-mcp`、`pixel-art`、`baoyu-comic`、`claude-design`、`excalidraw`、`songsee`、`heartmula`等），以及根据需要用于文本转语音、图像生成和图像转视频的外部API。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/creative/kanban-video-orchestrator` 安装 |
| 路径 | `optional-skills/creative/kanban-video-orchestrator` |
| 版本 | `1.0.0` |
| 作者 | ['SHL0MS', 'alt-glitch'] |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `video`, `kanban`, `multi-agent`, `orchestration`, `production-pipeline` |
| 相关技能 | [`kanban-orchestrator`](/user-guide/skills/bundled/devops/devops-kanban-orchestrator), [`kanban-worker`](/user-guide/skills/bundled/devops/devops-kanban-worker), [`ascii-video`](/user-guide/skills/bundled/creative/creative-ascii-video), [`manim-video`](/user-guide/skills/bundled/creative/creative-manim-video), [`p5js`](/user-guide/skills/bundled/creative/creative-p5js), [`comfyui`](/user-guide/skills/bundled/creative/creative-comfyui), [`touchdesigner-mcp`](/user-guide/skills/bundled/creative/creative-touchdesigner-mcp), [`blender-mcp`](/user-guide/skills/optional/creative/creative-blender-mcp), [`pixel-art`](/user-guide/skills/bundled/creative/creative-pixel-art), [`ascii-art`](/user-guide/skills/bundled/creative/creative-ascii-art), [`songwriting-and-ai-music`](/user-guide/skills/bundled/creative/creative-songwriting-and-ai-music), [`heartmula`](/user-guide/skills/bundled/media/media-heartmula), [`songsee`](/user-guide/skills/bundled/media/media-songsee), [`spotify`](/user-guide/skills/bundled/media/media-spotify), [`youtube-content`](/user-guide/skills/bundled/media/media-youtube-content), [`claude-design`](/user-guide/skills/bundled/creative/creative-claude-design), [`excalidraw`](/user-guide/skills/bundled/creative/creative-excalidraw), [`architecture-diagram`](/user-guide/skills/bundled/creative/creative-architecture-diagram), [`concept-diagrams`](/user-guide/skills/optional/creative/creative-concept-diagrams), [`baoyu-comic`](/user-guide/skills/bundled/creative/creative-baoyu-comic), [`baoyu-infographic`](/user-guide/skills/bundled/creative/creative-baoyu-infographic), [`humanizer`](/user-guide/skills/bundled/creative/creative-humanizer), [`gif-search`](/user-guide/skills/bundled/media/media-gif-search), [`meme-generation`](/user-guide/skills/optional/creative/creative-meme-generation) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 看板视频编排器

将任何视频请求——从15秒的产品预告片到5分钟的叙事短片，再到音乐视频或ASCII循环——封装到一个 Hermes 看板管道中，该管道会将工作分解给专门的智能体配置文件。

此技能本身**不**执行任何渲染。它是一个元管道，负责：

1.  通过有针对性的探索来**界定**请求
2.  根据风格**设计**一个合适的团队（哪些角色，每个角色使用哪些工具）
3.  **生成**一个设置脚本，该脚本会创建 Hermes 配置文件、项目工作区和初始看板任务
4.  **移交**给导演配置文件，后者通过看板进行分解
5.  **监控**执行过程，在任务停滞或失败时提供干预帮助

实际的渲染在看板运行时发生，通过哪些现有的技能 + 工具来匹配场景——`ascii-video`、`manim-video`、`p5js`、`comfyui`、`touchdesigner-mcp`、`blender-mcp`、`songwriting-and-ai-music`、`heartmula`、外部 API 或使用 PIL + ffmpeg 的纯 Python。

## 何时不使用此技能

-   视频是一个连续的程序化项目，不需要专家。直接编写代码即可。
-   用户想要一个快速的一次性转换（例如“将这个mp4转换为GIF”）——直接使用ffmpeg。
-   输出是静态图像、GIF或仅音频的产物——使用匹配的特定技能（`ascii-art`、`gifs`、`meme-generation`、`songwriting-and-ai-music`）。
-   工作可以很好地适配单个现有技能（例如纯ASCII视频——直接使用`ascii-video`）。

## 工作流程

```
探索  →  简报  →  团队设计  →  设置  →  执行  →  监控
```

### 第1步 — 探索（提出正确的问题）

探索过程是**自适应的**：只问真正需要的内容。始终从三个问题开始，以确定大致范围：

-   **视频是什么？** （一句话简报）
-   **多长？** (5-30秒预告片 / 30-90秒短片 / 90秒-3分钟解说片 / 3-10分钟电影 / 更长)
-   **什么宽高比 + 目标平台？** (1:1 / 9:16 / 16:9；X、IG、YouTube、内部等)

根据答案，对风格类别进行分类。风格决定了后续要问哪些问题。**不要一次性问所有问题。** 每次问2-4个问题，倾听，然后继续。当用户暗示了答案时，做出合理的假设。

有关完整的接收模式和每种风格的问题库，请参见 **[references/intake.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/intake.md)**。

### 第2步 — 简报

一旦掌握了足够的信息，使用 `assets/brief.md.tmpl` 中的模板生成一个结构化的 `brief.md`。阶段如下：

1.  **概念** — 一句话的核心理念 + 情感导向
2.  **范围** — 时长、宽高比、平台、截止日期
3.  **风格** — 视觉参考、品牌限制、基调
4.  **场景** — 逐镜头分解（时长、内容、目标工具）
5.  **音频** — 旁白 / 音乐 / 音效 / 静音（按场景需要）
6.  **交付物** — 文件格式、分辨率、可选替代方案（竖屏剪辑、GIF等）

在设计团队之前，将简报展示给用户确认。**简报就是合同**——每个下游任务都引用它。

### 第3步 — 团队设计

从库中选择适合此视频的角色原型。**组合，而非克隆。** 大多数视频需要4-7个配置文件。导演始终在场；其余成员根据简报的实际需求来挑选。

有关角色库和每种风格的团队构成，请参见 **[references/role-archetypes.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/role-archetypes.md)**。

有关角色 → 它加载哪些 Hermes 技能 + 工具集的映射，请参见 **[references/tool-matrix.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/tool-matrix.md)**。

### 第4步 — 设置

生成一个设置脚本 (`setup.sh`) 并运行它。该脚本会：

1.  创建项目工作区 (`~/projects/video-pipeline/<slug>/`)
2.  将任何提供的资产复制到 `taste/`、`audio/`、`assets/`
3.  通过 `hermes profile create --clone` 创建每个 Hermes 配置文件
4.  写入每个配置文件的 `SOUL.md`（个性 + 角色定义）
5.  配置配置文件 YAML（工具集、always_load 技能、cwd）
6.  写入 `brief.md`、`TEAM.md` 和 `taste/` 内容
7.  触发分配给导演的初始 `hermes kanban create` 任务

使用 `scripts/bootstrap_pipeline.py` 从简报 + 团队设计 JSON 生成 setup.sh。有关设置脚本结构、配置文件配置模式和关键的“共享工作区”规则，请参见 **[references/kanban-setup.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/kanban-setup.md)**。

### 第5步 — 执行

运行 `setup.sh`。然后向用户提供监控命令：

```bash
hermes kanban watch --tenant <project-tenant>     # 实时事件
hermes kanban list  --tenant <project-tenant>     # 看板快照
hermes dashboard                                   # 可视化看板界面
```

导演配置文件从这里接管，通过看板工具集分解工作并将任务路由给专家配置文件。

### 第6步 — 监控与干预

保持参与——看板是自主运行的，但卡住的任务或错误的输出需要人类（或人工智能）的判断。

监控模式：定期轮询 `kanban list`，使用 `kanban show <id>` 检查任何超过预期时长的 RUNNING 任务，并检查心跳。当工作者的输出未能通过审查时，标准干预措施如下：

1.  在工作者的任务上添加具体反馈评论 (`kanban_comment`)
2.  创建一个以原始任务为父任务的重跑任务
3.  调整简报的范围，让导演重新分解

有关诊断模式、干预方案和“任务卡住”操作手册，请参见 **[references/monitoring.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/monitoring.md)**。

## 参考：实际示例

六个涵盖截然不同视频风格的具体管道——叙事电影、产品/营销、音乐视频、数学/算法解说、ASCII视频、实时装置——展示了相同的工作流程如何产生完全不同的团队和任务图。请参见 **[references/examples.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/examples.md)**。
## 关键规则

1.  **行动前先探索。** 在未提出至少三个基本问题之前，绝不要开始生成简报或设计团队。一个糟糕的简报会影响整个管道。

2.  **团队要匹配视频。** 不要对所有工作都重复使用相同的4配置文件设置。一个没有节拍分析配置文件的音乐会视频会失败。一个没有编剧配置文件的叙事电影会产生不连贯的场景。参见 `references/role-archetypes.md`。

3.  **每个项目一个工作区。** 给定视频的所有配置文件共享同一个 `dir:` 工作区。任务通过共享文件系统和结构化的交接来传递构件。**每个** `kanban_create` 调用都传递 `workspace_kind="dir"` + `workspace_path="<绝对项目路径>"`。

4.  **为每个项目设置租户。** 使用特定于项目的租户 (`--tenant <project-slug>`)。这可以限定仪表板的范围，并防止与其他正在进行的看板交叉污染。

5.  **尊重现有技能。** 当一个场景适配现有技能时，相关的渲染器应通过其任务上的 `--skill <name>` 或其配置文件中的 `always_load` 来加载该技能。不要重新推导技能已经提供的内容。

6.  **导演永远不执行。** 即使拥有完整的 `kanban + terminal + file` 工具集，导演的 `SOUL.md` 规则也禁止其亲自执行工作。它只负责分解和路由——每个具体的任务都通过 `hermes kanban create` 调用分配给专家配置文件。`kanban-orchestrator` 技能对此有更详细的说明。

7.  **不要过度分解。** 一个30秒的产品视频**不需要**20个任务。目标是创建尽可能小但能良好并行化并暴露正确人工审查关口的任务图。

8.  **启动前验证 API 密钥。** 外部 API（TTS、图像生成、图像转视频）需要 `~/.hermes/.env` 或用户密钥存储中的密钥。遇到缺失密钥错误的工作者会浪费一个任务槽。设置脚本的 `check_key` 辅助函数在必需密钥缺失时会干净地中止。

## 文件地图

```
SKILL.md                            ← 此文件（工作流程 + 规则）
references/
  intake.md                         ← 每种风格的探索问题库
  role-archetypes.md                ← 角色库（编剧、设计师、动画师、……）
  tool-matrix.md                    ← 每个角色的技能 + 工具集映射
  kanban-setup.md                   ← 设置脚本结构与配置文件配置
  monitoring.md                     ← 监控 + 干预模式
  examples.md                       ← 六个实际管道示例
assets/
  brief.md.tmpl                     ← 简报骨架
  setup.sh.tmpl                     ← 设置脚本骨架
  soul.md.tmpl                      ← 配置文件个性骨架
scripts/
  bootstrap_pipeline.py             ← 从简报 + 团队 JSON 生成 setup.sh
  monitor.py                        ← 轮询 + 干预辅助工具
```