---
title: "看板视频编排器 — 规划、设置和监控一个由Hermes Kanban支持的多智能体视频制作流程"
sidebar_label: "看板视频编排器"
description: "规划、设置和监控一个由Hermes Kanban支持的多智能体视频制作流程"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 看板视频编排器

规划、设置和监控一个由Hermes Kanban支持的多智能体视频制作流程。当用户想要制作任何类型的视频时使用——包括叙事片、产品/营销视频、音乐视频、解释性视频、ASCII/终端艺术、抽象/生成循环、漫画、3D、实时/装置等——并且工作内容需要分解成专业的角色（作家、设计师、动画师、渲染器、配音、编辑等）并通过看板进行协调。它会执行自适应的发现过程来确定项目范围，为所请求的风格设计一个合适的团队，生成创建Hermes配置文件和初始看板任务的设置脚本，然后帮助监控执行情况，并在任务停滞或失败时进行干预。它将场景路由到适合每个环节的任一Hermes渲染/音频/设计技能（`ascii-video`, `manim-video`, `p5js`, `comfyui`, `touchdesigner-mcp`, `blender-mcp`, `pixel-art`, `baoyu-comic`, `claude-design`, `excalidraw`, `songsee`, `heartmula` 等）以及外部的TTS、图像生成和图像转视频API。

## 技能元数据

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/creative/kanban-video-orchestrator` 安装 |
| Path | `optional-skills/creative/kanban-video-orchestrator` |
| Version | `1.0.0` |
| Author | ['SHL0MS', 'alt-glitch'] |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `video`, `kanban`, `多智能体`, `编排`, `制作流程` |
| Related skills | [`ascii-video`](/docs/user-guide/skills/bundled/creative/creative-ascii-video), [`manim-video`](/docs/user-guide/skills/bundled/creative/creative-manim-video), [`p5js`](/docs/user-guide/skills/bundled/creative/creative-p5js), [`comfyui`](/docs/user-guide/skills/bundled/creative/creative-comfyui), [`touchdesigner-mcp`](/docs/user-guide/skills/bundled/creative/creative-touchdesigner-mcp), [`blender-mcp`](/docs/user-guide/skills/optional/creative/creative-blender-mcp), [`pixel-art`](/docs/user-guide/skills/optional/creative/creative-pixel-art), [`ascii-art`](/docs/user-guide/skills/bundled/creative/creative-ascii-art), [`songwriting-and-ai-music`](/docs/user-guide/skills/bundled/creative/creative-songwriting-and-ai-music), [`heartmula`](/docs/user-guide/skills/bundled/media/media-heartmula), [`songsee`](/docs/user-guide/skills/bundled/media/media-songsee), `spotify`, [`youtube-content`](/docs/user-guide/skills/bundled/media/media-youtube-content), [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw), [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram), [`concept-diagrams`](/docs/user-guide/skills/optional/creative/creative-concept-diagrams), [`baoyu-comic`](/docs/user-guide/skills/optional/creative/creative-baoyu-comic), [`baoyu-infographic`](/docs/user-guide/skills/bundled/creative/creative-baoyu-infographic), [`humanizer`](/docs/user-guide/skills/bundled/creative/creative-humanizer), [`gif-search`](/docs/user-guide/skills/bundled/media/media-gif-search), [`meme-generation`](/docs/user-guide/skills/optional/creative/creative-meme-generation) |

## 关键路径与配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥和秘密信息（如果设置了$HERMES_HOME）
$HERMES_HOME
```

# 看板视频编排器 (Kanban Video Orchestrator)

将任何视频请求——无论是15秒的产品预告片、5分钟的叙事短片、音乐视频还是ASCII循环——封装到一个Hermes看板流程中，该流程会将工作分解给专业的智能体配置（agent profiles）。

此技能本身**不**进行渲染。它是一个元级管道（meta-pipeline），负责：

1. **限定范围 (Scopes)** 请求，通过有针对性的发现过程。
2. **设计 (Designs)** 一个合适的团队（包括角色和每个角色的工具）。
3. **生成 (Generates)** 一套设置脚本，用于创建Hermes配置、项目工作区和初始看板任务。
4. **移交 (Hands off)** 给导演智能体（director profile），由其通过看板进行分解。
5. **监控 (Monitors)** 执行过程，当任务停滞或失败时提供帮助干预。

实际的渲染是在看板运行后进行的，通过任何符合场景需求的现有技能和工具——`ascii-video`、`manim-video`、`p5js`、`comfyui`、`touchdesigner-mcp`、`blender-mcp`、`songwriting-and-ai-music`、`heartmula`、外部API，或使用PIL + ffmpeg的纯Python。

## 何时不应使用此技能

*   视频是一个不需要专家的连续程序化项目。直接编写代码即可。
*   用户需要快速的一次性转换（例如：“将这个mp4转换为GIF”）——请直接使用ffmpeg。
*   输出是静态图像、GIF或仅音频的产物——请使用相应的特定技能（`ascii-art`、`gifs`、`meme-generation`、`songwriting-and-ai-music`）。
*   工作内容完全符合一个现有技能（例如，纯ASCII视频——直接使用`ascii-video`）。

## 工作流程

```
发现 (DISCOVER)  →  简报 (BRIEF)  →  团队设计 (TEAM DESIGN)  →  设置 (SETUP)  →  执行 (EXECUTE)  →  监控 (MONITOR)
```

### 第1步 — 发现（提出正确的问题）

发现过程是**自适应的**：只问实际需要的。始终从三个问题开始，以确定大致轮廓：

*   **这是什么视频？**（一句话简报）
*   **多长？**（5-30秒预告片 / 30-90秒短片 / 90秒-3分钟解说片 / 3-10分钟电影 / 更长）
*   **宽高比和目标平台是什么？**（1:1 / 9:16 / 16:9；X, IG, YouTube, internal等）

根据答案，分类风格。风格决定了需要提出哪些后续问题。**不要一次性问完所有问题。** 一次只问2-4个，倾听回答，然后继续进行下一步。当用户暗示了答案时，请做出合理的假设。

有关完整的摄取模式和按风格划分的问题库，请参阅**[references/intake.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/intake.md)**。

### 第2步 — 简报 (Brief)

一旦掌握足够信息，请使用`assets/brief.md.tmpl`中的模板来生成结构化的`brief.md`文件。阶段包括：

1. **概念 (Concept)** — 一句话的推介 + 情感北极星
2. **范围 (Scope)** — 时长、宽高比、平台、截止日期
3. **风格 (Style)** — 视觉参考、品牌限制、语气
4. **场景 (Scenes)** — 分镜细分（时长、内容、目标工具）
5. **音频 (Audio)** — 配音/音乐/SFX/静音（如果需要，则按场景划分）
6. **交付物 (Deliverables)** — 文件格式、分辨率、可选替代品（垂直裁剪、GIF等）

在设计团队之前向用户展示简报以供确认。**该简报即是合同**——所有下游任务都以此为参考。

### 第3步 — 团队设计 (Team design)

从库中挑选适合此视频的角色原型。**进行组合，而不是克隆。** 大多数视频需要4-7个配置（profiles）。导演智能体总是存在；其余的则根据简报实际要求来选择。

有关角色库和按风格划分的团队构成，请参阅**[references/role-archetypes.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/role-archetypes.md)**。

有关角色到它加载的Hermes技能和工具集（toolsets）的映射，请参阅**[references/tool-matrix.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/tool-matrix.md)**。

### 第4步 — 设置 (Setup)

生成一个设置脚本（`setup.sh`）并运行它。该脚本：

1. 创建项目工作区（`~/projects/video-pipeline/<slug>/`）。
2. 将任何提供的素材文件复制到`taste/`、`audio/`、`assets/`。
3. 通过`hermes profile create --clone`创建每个Hermes配置。
4. 编写每个配置的`SOUL.md`（个性 + 角色定义）。
5. 配置配置YAML（工具集、始终加载技能(always_load skills)、cwd）。
6. 编写`brief.md`、`TEAM.md`和`taste/`内容。
7. 发起分配给导演的初始`hermes kanban create`任务。

使用`scripts/bootstrap_pipeline.py`根据简报 + 团队设计JSON来生成setup.sh。有关设置脚本结构、配置模式和关键的“共享工作区”规则，请参阅**[references/kanban-setup.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/kanban-setup.md)**。

### 第5步 — 执行 (Execute)

运行`setup.sh`。然后提供监控命令：

```bash
hermes kanban watch --tenant <project-tenant>     # 实时事件
hermes kanban list  --tenant <project-tenant>     # 看板快照
hermes dashboard                                   # 可视化看板UI
```

从这一步开始，导演智能体接管工作，通过看板工具集将工作分解并路由给专业的智能体配置。

### 第6步 — 监控与干预 (Monitor and intervene)

保持投入——看板是自主运行的，但卡住的任务或不良输出需要人工（或AI）判断。

监控模式：定期轮询`kanban list`，使用`kanban show <id>`检查任何超出预期时长的正在运行(RUNNING)任务，并检查心跳信号。当某个智能体的输出失败时，标准的干预措施包括：

1. 在该智能体的任务上添加特定反馈（`kanban_comment`）。
2. 创建一个带有原始任务作为父级的重新运行任务。
3. 调整简报的范围，让导演重新分解工作。

有关诊断模式、干预食谱和“任务卡住”的操作手册，请参阅**[references/monitoring.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/monitoring.md)**。

## 参考：已完成的示例

六个涵盖非常不同视频风格（叙事电影、产品/营销、音乐视频、数学/算法解说片、ASCII视频、实时装置）的具体管道，展示了相同的流程如何产生截然不同的团队和任务图谱。请参阅**[references/examples.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/examples.md)**。

## 关键规则

1. **先发现，后行动。** 绝不要在没有至少提出三个基础问题之前就开始生成简报或团队。一个糟糕的简报会级联到整个管道中。
2. **将团队与视频匹配。** 不要为每个项目重复使用相同的4个配置设置。一个没有节奏分析智能体的音乐视频将会失败。一个没有撰稿人智能体的叙事电影将产生不连贯的场景。请参阅`references/role-archetypes.md`。
3. **每个项目一个工作区。** 所有针对给定视频的配置都共享同一个`dir:`工作区。任务通过共享文件系统和结构化的移交传递产物。**每一次**`kanban_create`调用都必须包含`workspace_kind="dir"` + `workspace_path="<绝对项目路径>"`。
4. **每个项目一个租户 (Tenant)。** 使用特定于项目的租户（`--tenant <project-slug>`）。这有助于限定仪表板范围，并防止与其他正在进行的看板发生交叉污染。
5. **尊重现有技能。** 当某个场景符合现有技能时，相关的渲染器应通过其任务上的`--skill <name>`或配置中的`always_load`来加载该技能。不要重新推导一个技能已经提供的功能。
6. **导演永不执行。** 即使拥有完整的`kanban + terminal + file`工具集，导演的`SOUL.md`规则也禁止它自己执行工作。它只负责分解和路由——每个具体的任务都成为对专业智能体配置的一次`hermes kanban create`调用。自动注入的看板编排指导进一步阐明了这一点。
7. **不要过度分解。** 一个30秒的产品视频不需要20个任务。目标是找到一个仍能良好并行化并暴露正确的审核关卡（human-review gates）的最小任务图谱。
8. **在执行前验证API密钥。** 外部API（TTS、图像生成、图像转视频）需要在`${HERMES_HOME:-~/.hermes}/.env`或用户的秘密存储中包含密钥。一个遇到缺少密钥错误的智能体会浪费一个任务槽位。设置脚本中的`check_key`辅助函数会在必需的密钥缺失时干净地中止。

## 文件映射

```
SKILL.md                            ← 本文件（工作流程 + 规则）
references/
  intake.md                         ← 按风格划分的发现问题库
  role-archetypes.md                ← 角色库（撰稿人、设计师、动画师等）
  tool-matrix.md                    ← 按角色划分的技能 + 工具集映射
  kanban-setup.md                   ← 设置脚本结构和配置
  monitoring.md                     ← 监控 + 干预模式
  examples.md                       ← 六个已完成的管道示例
assets/
  brief.md.tmpl                     ← 简报骨架
  setup.sh.tmpl                     ← 设置脚本骨架
  soul.md.tmpl                      ← 配置个性骨架
scripts/
  bootstrap_pipeline.py             ← 根据简报 + 团队JSON生成setup.sh
  monitor.py                        ← 轮询 + 干预辅助工具
```