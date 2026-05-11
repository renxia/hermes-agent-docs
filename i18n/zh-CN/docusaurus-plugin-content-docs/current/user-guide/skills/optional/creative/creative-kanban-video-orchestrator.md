---
title: "看板视频编排器 — 规划、搭建并监控由 Hermes Kanban 支持的多智能体视频制作流水线"
sidebar_label: "看板视频编排器"
description: "规划、搭建并监控由 Hermes Kanban 支持的多智能体视频制作流水线"
---

{/* 本页面由网站脚本 scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 看板视频编排器

规划、搭建并监控由 Hermes Kanban 支持的多智能体视频制作流水线。当用户想要制作任何类型的视频时使用——叙事电影、产品/营销视频、音乐录影带、讲解视频、ASCII/终端艺术、抽象/生成循环、漫画、3D、实时/装置艺术——且工作值得分解为专门角色（编剧、设计师、动画师、渲染师、配音、剪辑等），并通过看板板进行协调时。它会执行自适应发现以界定需求范围，为请求的样式设计合适的团队，生成用于创建 Hermes 配置文件和初始看板任务的搭建脚本，然后帮助监控执行情况，并在任务停滞或失败时进行干预。将场景路由到适合每个节拍的 Hermes 渲染/音频/设计技能（`ascii-video`、`manim-video`、`p5js`、`comfyui`、`touchdesigner-mcp`、`blender-mcp`、`pixel-art`、`baoyu-comic`、`claude-design`、`excalidraw`、`songsee`、`heartmula` 等），并根据需要连接外部 API 以进行文本转语音、图像生成和图像转视频。

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
| 相关技能 | [`kanban-orchestrator`](/docs/user-guide/skills/bundled/devops/devops-kanban-orchestrator), [`kanban-worker`](/docs/user-guide/skills/bundled/devops/devops-kanban-worker), [`ascii-video`](/docs/user-guide/skills/bundled/creative/creative-ascii-video), [`manim-video`](/docs/user-guide/skills/bundled/creative/creative-manim-video), [`p5js`](/docs/user-guide/skills/bundled/creative/creative-p5js), [`comfyui`](/docs/user-guide/skills/bundled/creative/creative-comfyui), [`touchdesigner-mcp`](/docs/user-guide/skills/bundled/creative/creative-touchdesigner-mcp), [`blender-mcp`](/docs/user-guide/skills/optional/creative/creative-blender-mcp), [`pixel-art`](/docs/user-guide/skills/bundled/creative/creative-pixel-art), [`ascii-art`](/docs/user-guide/skills/bundled/creative/creative-ascii-art), [`songwriting-and-ai-music`](/docs/user-guide/skills/bundled/creative/creative-songwriting-and-ai-music), [`heartmula`](/docs/user-guide/skills/bundled/media/media-heartmula), [`songsee`](/docs/user-guide/skills/bundled/media/media-songsee), [`spotify`](/docs/user-guide/skills/bundled/media/media-spotify), [`youtube-content`](/docs/user-guide/skills/bundled/media/media-youtube-content), [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw), [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram), [`concept-diagrams`](/docs/user-guide/skills/optional/creative/creative-concept-diagrams), [`baoyu-comic`](/docs/user-guide/skills/bundled/creative/creative-baoyu-comic), [`baoyu-infographic`](/docs/user-guide/skills/bundled/creative/creative-baoyu-infographic), [`humanizer`](/docs/user-guide/skills/bundled/creative/creative-humanizer), [`gif-search`](/docs/user-guide/skills/bundled/media/media-gif-search), [`meme-generation`](/docs/user-guide/skills/optional/creative/creative-meme-generation) |

```yaml
---
title: "Kanban 视频协调器"
description: "将任何视频请求——从15秒的产品预告片到5分钟的叙事短片、音乐视频或ASCII循环——包装在一个Hermes看板流水线中，该流水线将工作分解给专门的智能体档案。"
slug: "kanban-video-orchestrator"
---
```

:::info
以下是当触发此技能时Hermes加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 看板视频协调器

将任何视频请求——从15秒的产品预告片到5分钟的叙事短片、音乐视频或ASCII循环——包装在一个Hermes看板流水线中，该流水线将工作分解给专门的智能体档案。

此技能**本身并不执行任何渲染**。它是一个元流水线，用于：

1.  通过有针对性的发现来**界定**请求范围
2.  根据风格**设计**合适的团队（哪些角色，每个角色使用哪些工具）
3.  **生成**一个设置脚本，该脚本创建Hermes档案、项目工作区以及初始看板任务
4.  **移交给**导演档案，由其通过看板进行分解
5.  **监控**执行过程，并在任务停滞或失败时协助干预

实际的渲染发生在看板运行后，通过任何合适的现有技能 + 工具来完成场景——`ascii-video`、`manim-video`、`p5js`、`comfyui`、`touchdesigner-mcp`、`blender-mcp`、`songwriting-and-ai-music`、`heartmula`、外部API，或使用PIL + ffmpeg的普通Python。

## 何时不使用此技能

- 视频是一个连续的程序化项目，不需要专家。直接编写代码即可。
- 用户想要快速一次性转换（例如，“将此mp4转换为GIF”）——直接使用ffmpeg。
- 输出是静态图像、GIF或仅音频制品——使用匹配的特定技能（`ascii-art`、`gifs`、`meme-generation`、`songwriting-and-ai-music`）。
- 工作能干净地适配单个现有技能（例如，纯ASCII视频——直接使用`ascii-video`）。

## 工作流

```
发现 → 简报 → 团队设计 → 设置 → 执行 → 监控
```

### 第1步 — 发现（提出正确的问题）

发现过程是**自适应的**：只询问实际需要的内容。始终从三个问题开始，以确定大致轮廓：

- **视频是什么？**（一句话简报）
- **多长？**（5-30秒预告片 / 30-90秒短片 / 90秒-3分钟解说片 / 3-10分钟电影 / 更长）
- **什么宽高比 + 目标平台？**（1:1 / 9:16 / 16:9；X, IG, YouTube, 内部使用等）

根据答案，对风格类别进行分类。风格决定了后续要问的问题。**不要一次性提出所有问题。**每次问2-4个问题，倾听，然后继续。当用户暗示答案时，做出合理假设。

关于完整的询问模式和每种风格的题库，请参见 **[references/intake.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/intake.md)**。

### 第2步 — 简报

一旦掌握了足够信息，使用 `assets/brief.md.tmpl` 中的模板生成结构化的 `brief.md`。阶段包括：

1.  **概念** — 一句话的推销 + 情感北极星
2.  **范围** — 时长、宽高比、平台、截止日期
3.  **风格** — 视觉参考、品牌约束、基调
4.  **场景** — 逐拍分解（时长、内容、目标工具）
5.  **音频** — 旁白 / 音乐 / 音效 / 无声（如果需要，按场景划分）
6.  **交付物** — 文件格式、分辨率、可选的替代版本（垂直剪辑、GIF等）

在设计团队之前，将简报展示给用户确认。**简报即是合同**——每个下游任务都引用它。

### 第3步 — 团队设计

从库中挑选适合此视频的角色原型。**组合，而非克隆。**大多数视频需要4-7个档案。导演始终在场；其余角色根据简报的实际要求来选择。

关于角色库和每种风格的团队构成，请参见 **[references/role-archetypes.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/role-archetypes.md)**。

关于角色 → 其加载的Hermes技能 + 工具集的映射，请参见 **[references/tool-matrix.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/tool-matrix.md)**。

### 第4步 — 设置

生成一个设置脚本 (`setup.sh`) 并运行它。该脚本：

1.  创建项目工作区 (`~/projects/video-pipeline/<slug>/`)
2.  将提供的任何资产复制到 `taste/`, `audio/`, `assets/`
3.  通过 `hermes profile create --clone` 创建每个Hermes档案
4.  编写每个档案的 `SOUL.md`（个性 + 角色定义）
5.  配置档案YAML（工具集、always_load技能、cwd）
6.  编写 `brief.md`、`TEAM.md` 和 `taste/` 内容
7.  启动分配给导演的初始 `hermes kanban create` 任务

使用 `scripts/bootstrap_pipeline.py` 从简报 + 团队设计JSON生成setup.sh。请参见 **[references/kanban-setup.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/kanban-setup.md)** 了解设置脚本的结构、档案配置模式以及关键的“共享工作区”规则。

### 第5步 — 执行

运行 `setup.sh`。然后为用户提供监控命令：

```bash
hermes kanban watch --tenant <project-tenant>     # 实时事件
hermes kanban list  --tenant <project-tenant>     # 看板快照
hermes dashboard                                   # 可视化看板UI
```

导演档案将接管此处的工作，分解任务并通过看板工具集将任务路由给专家档案。

### 第6步 — 监控和干预

保持参与——看板自主运行，但卡住的任务或糟糕的输出需要人类（或AI）的判断。

监控模式：定期轮询 `kanban list`，使用 `kanban show <id>` 检查任何超过预期时长的RUNNING任务，并检查心跳。当工作者的输出未通过审查时，标准干预措施是：

1.  在工作者的任务上添加带有具体反馈的评论 (`kanban_comment`)
2.  创建一个重新运行的任务，其父任务为原始任务
3.  调整简报的范围，让导演重新分解

关于诊断模式、干预方案以及“任务卡住”的应对策略，请参见 **[references/monitoring.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/monitoring.md)**。

## 参考：实际案例

六个具体的流水线，涵盖非常不同的视频风格——叙事电影、产品/营销、音乐视频、数学/算法解说、ASCII视频、实时装置——展示了相同的工作流如何产生非常不同的团队和任务图。请参见 **[references/examples.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/examples.md)**。

## 关键规则

1.  **先发现，后行动。**在生成简报或团队之前，至少要问三个基线问题。一个糟糕的简报会波及整个流水线。
2.  **团队匹配视频。**不要为每项工作都复用相同的4档案设置。没有节拍分析档案的音乐视频会出错。没有编剧档案的叙事电影会产生不连贯的场景。参见 `references/role-archetypes.md`。
3.  **每个项目一个工作区。**给定视频的所有档案共享相同的 `dir:` 工作区。任务通过共享文件系统和结构化移交传递制品。**每一个** `kanban_create` 调用都传递 `workspace_kind="dir"` + `workspace_path="<绝对项目路径>"`。
4.  **为每个项目设置租户。**使用特定于项目的租户 (`--tenant <project-slug>`)。这可以限定仪表板的范围，并防止与其他正在进行的看板交叉污染。
5.  **尊重现有技能。**当场景适合现有技能时，相关的渲染器应在其任务中通过 `--skill <name>` 或在档案的 `always_load` 中加载该技能。不要重新推导技能已经提供的东西。
6.  **导演从不执行。**即使拥有完整的 `kanban + terminal + file` 工具集，导演的 `SOUL.md` 规则也禁止它自己执行工作。它只进行分解和路由——每个具体任务都成为对专家档案的 `hermes kanban create` 调用。`kanban-orchestrator` 技能对此有更详细的说明。
7.  **不要过度分解。**一个30秒的产品视频**不需要**20个任务。目标是构建最小的任务图，该图仍能很好地并行化并暴露适当的人工审查关卡。
8.  **在启动前验证API密钥。**外部API（TTS、图像生成、图像转视频）需要 `~/.hermes/.env` 或用户密钥存储中的密钥。遇到缺失密钥错误的工作者会浪费任务槽。设置脚本的 `check_key` 辅助函数在所需密钥缺失时会干净地中止。

## 文件映射

```
SKILL.md                            ← 本文件（工作流 + 规则）
references/
  intake.md                         ← 每种风格的发现题库
  role-archetypes.md                ← 角色库（编剧、设计师、动画师……）
  tool-matrix.md                    ← 每个角色的技能 + 工具集映射
  kanban-setup.md                   ← 设置脚本结构和档案配置
  monitoring.md                     ← 监控和干预模式
  examples.md                       ← 六个已实践的流水线
assets/
  brief.md.tmpl                     ← 简报骨架
  setup.sh.tmpl                     ← 设置脚本骨架
  soul.md.tmpl                      ← 档案个性骨架
scripts/
  bootstrap_pipeline.py             ← 从简报 + 团队JSON生成setup.sh
  monitor.py                        ← 轮询和干预辅助工具
```