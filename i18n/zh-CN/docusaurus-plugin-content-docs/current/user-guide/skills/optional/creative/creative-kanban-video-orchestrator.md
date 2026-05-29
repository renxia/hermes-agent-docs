---
title: "Kanban 视频编排器 —— 规划、设置并监控由 Hermes 看板支持的多智能体视频制作流水线"
sidebar_label: "Kanban 视频编排器"
description: "规划、设置并监控由 Hermes 看板支持的多智能体视频制作流水线"
---

{/* 此页面由网站脚本 `website/scripts/generate-skill-docs.py` 从该技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Kanban 视频编排器

规划、设置并监控由 Hermes 看板支持的多智能体视频制作流水线。当用户想要制作任何类型的视频——叙事电影、产品/营销视频、音乐视频、讲解视频、ASCII/终端艺术、抽象/生成循环、漫画、3D、实时/装置艺术——且工作值得分解为通过看板协调的专业配置文件（编剧、设计师、动画师、渲染师、配音、剪辑师等）时使用此技能。它会执行自适应发现以确定简报范围，为所请求的风格设计合适的团队，生成创建 Hermes 配置文件和初始看板任务的设置脚本，然后帮助监控执行并在任务停滞或失败时介入。它将场景路由到最适合每个节拍的任何 Hermes 渲染/音频/设计技能（`ascii-video`、`manim-video`、`p5js`、`comfyui`、`touchdesigner-mcp`、`blender-mcp`、`pixel-art`、`baoyu-comic`、`claude-design`、`excalidraw`、`songsee`、`heartmula` 等），以及根据需要调用用于 TTS、图像生成和图像到视频转换的外部 API。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/creative/kanban-video-orchestrator` 安装 |
| 路径 | `optional-skills/creative/kanban-video-orchestrator` |
| 版本 | `1.0.0` |
| 作者 | ['SHL0MS', 'alt-glitch'] |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `video`, `kanban`, `multi-agent`, `orchestration`, `production-pipeline` |
| 相关技能 | [`kanban-orchestrator`](/docs/user-guide/skills/bundled/devops/devops-kanban-orchestrator), [`kanban-worker`](/docs/user-guide/skills/bundled/devops/devops-kanban-worker), [`ascii-video`](/docs/user-guide/skills/bundled/creative/creative-ascii-video), [`manim-video`](/docs/user-guide/skills/bundled/creative/creative-manim-video), [`p5js`](/docs/user-guide/skills/bundled/creative/creative-p5js), [`comfyui`](/docs/user-guide/skills/bundled/creative/creative-comfyui), [`touchdesigner-mcp`](/docs/user-guide/skills/bundled/creative/creative-touchdesigner-mcp), [`blender-mcp`](/docs/user-guide/skills/optional/creative/creative-blender-mcp), [`pixel-art`](/docs/user-guide/skills/bundled/creative/creative-pixel-art), [`ascii-art`](/docs/user-guide/skills/bundled/creative/creative-ascii-art), [`songwriting-and-ai-music`](/docs/user-guide/skills/bundled/creative/creative-songwriting-and-ai-music), [`heartmula`](/docs/user-guide/skills/bundled/media/media-heartmula), [`songsee`](/docs/user-guide/skills/bundled/media/media-songsee), [`spotify`](/docs/user-guide/skills/bundled/media/media-spotify), [`youtube-content`](/docs/user-guide/skills/bundled/media/media-youtube-content), [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw), [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram), [`concept-diagrams`](/docs/user-guide/skills/optional/creative/creative-concept-diagrams), [`baoyu-comic`](/docs/user-guide/skills/bundled/creative/creative-baoyu-comic), [`baoyu-infographic`](/docs/user-guide/skills/bundled/creative/creative-baoyu-infographic), [`humanizer`](/docs/user-guide/skills/bundled/creative/creative-humanizer), [`gif-search`](/docs/user-guide/skills/bundled/media/media-gif-search), [`meme-generation`](/docs/user-guide/skills/optional/creative/creative-meme-generation) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 看板视频协调器

将任何视频请求——从 15 秒的产品预告片到 5 分钟的叙事短片，再到音乐视频或 ASCII 循环动画——封装在一个 Hermes 看板流水线中，该流水线将工作分解给专门的智能体配置文件。

此技能本身**不**执行任何渲染。它是一个元流水线，负责：
1. 通过针对性发现**界定**请求范围
2. 根据风格**设计**合适的团队（哪些角色，每个角色使用哪些工具）
3. **生成**一个设置脚本，用于创建 Hermes 配置文件、项目工作区和初始看板任务
4. **移交给**导演配置文件，由其通过看板进行分解
5. **监控**执行情况，并在任务停滞或失败时协助干预

实际的渲染发生在看板运行后，由现有技能 + 工具（`ascii-video`、`manim-video`、`p5js`、`comfyui`、`touchdesigner-mcp`、`blender-mcp`、`songwriting-and-ai-music`、`heartmula`、外部 API，或使用 PIL + ffmpeg 的纯 Python）来完成。

## 何时不使用此技能

- 视频是一个连续的程序化项目，不需要专家。直接编写代码即可。
- 用户想要一次快速的转换（例如“将此 mp4 转换为 GIF”）——直接使用 ffmpeg。
- 输出是静态图像、GIF 或纯音频制品——使用匹配的特定技能（`ascii-art`、`gifs`、`meme-generation`、`songwriting-and-ai-music`）。
- 工作完全适合某个现有技能（例如纯 ASCII 视频——直接使用 `ascii-video`）。

## 工作流程

```
发现  →  摘要  →  团队设计  →  设置  →  执行  →  监控
```

### 步骤 1 — 发现（提出正确的问题）

发现过程是**自适应的**：只问实际需要的内容。始终从三个问题开始，以确定大致方向：

- **视频是什么？**（一句话简介）
- **多长？**（5-30 秒预告片 / 30-90 秒短片 / 90 秒-3 分钟讲解 / 3-10 分钟影片 / 更长）
- **什么宽高比 + 目标平台？**（1:1 / 9:16 / 16:9；X、IG、YouTube、内部平台等）

根据答案，对风格类别进行分类。风格决定了要问的后续问题。**不要一次性问所有问题。** 每次问 2-4 个问题，听取回答，然后继续。当用户隐含答案时，做出合理的假设。

有关完整的接收模式和每种风格的问题库，请参阅 **[references/intake.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/intake.md)**。

### 步骤 2 — 摘要

一旦掌握了足够信息，使用 `assets/brief.md.tmpl` 中的模板生成结构化的 `brief.md`。阶段包括：

1. **概念** — 一句话核心创意 + 情感北极星
2. **范围** — 时长、宽高比、平台、截止日期
3. **风格** — 视觉参考、品牌约束、基调
4. **场景** — 逐节拍分解（时长、内容、目标工具）
5. **音频** — 旁白 / 音乐 / 音效 / 静音（如需要可按场景指定）
6. **交付物** — 文件格式、分辨率、可选替代版本（竖版剪辑、GIF 等）

在设计团队之前，向用户展示摘要以获得确认。**摘要是合同**——每个下游任务都引用它。

### 步骤 3 — 团队设计

从库中挑选适合此视频的角色原型。**组合，而非复制。** 大多数视频需要 4-7 个配置文件。导演始终在场；其余的根据摘要实际需求挑选。

有关角色库和每种风格的团队构成，请参阅 **[references/role-archetypes.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/role-archetypes.md)**。

有关角色 → 加载哪些 Hermes 技能 + 工具集的映射，请参阅 **[references/tool-matrix.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/tool-matrix.md)**。

### 步骤 4 — 设置

生成设置脚本 (`setup.sh`) 并运行它。该脚本：

1. 创建项目工作区 (`~/projects/video-pipeline/<slug>/`)
2. 将提供的任何资产复制到 `taste/`、`audio/`、`assets/`
3. 通过 `hermes profile create --clone` 创建每个 Hermes 配置文件
4. 编写每个配置文件的 `SOUL.md`（个性 + 角色定义）
5. 配置配置文件 YAML（工具集、always_load 技能、cwd）
6. 编写 `brief.md`、`TEAM.md` 和 `taste/` 内容
7. 触发分配给导演的初始 `hermes kanban create` 任务

使用 `scripts/bootstrap_pipeline.py` 从摘要 + 团队设计 JSON 生成 setup.sh。有关设置脚本结构、配置文件配置模式和关键的“共享工作区”规则，请参阅 **[references/kanban-setup.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/kanban-setup.md)**。

### 步骤 5 — 执行

运行 `setup.sh`。然后为用户提供监控命令：

```bash
hermes kanban watch --tenant <project-tenant>     # 实时事件
hermes kanban list  --tenant <project-tenant>     # 看板快照
hermes dashboard                                   # 可视化看板 UI
```

导演配置文件从这里接管，通过看板工具集分解工作并将任务路由给专家配置文件。

### 步骤 6 — 监控和干预

保持关注——看板自主运行，但当任务卡住或产出质量差时，需要人工（或 AI）判断。

监控模式：定期轮询 `kanban list`，使用 `kanban show <id>` 检查任何超过预期时长的 RUNNING 任务，并检查心跳。当工作人员的产出未能通过审查时，标准干预措施是：

1. 在工作人员的任务上添加具体反馈注释 (`kanban_comment`)
2. 创建一个以原始任务为父级的重试任务
3. 调整摘要的范围，并让导演重新分解

有关诊断模式、干预方案和“任务卡住”应对策略，请参阅 **[references/monitoring.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/monitoring.md)**。
## 参考：实际案例

六个涵盖不同视频风格的具体流水线——叙事电影、产品/营销、音乐视频、数学/算法讲解、ASCII 视频、实时装置——展示了相同的工作流程如何产生非常不同的团队和任务图。请参阅 **[references/examples.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/kanban-video-orchestrator/references/examples.md)**。

## 关键规则

1.  **先发现，再行动。** 在没有至少问完三个基础问题的情况下，绝不要开始生成摘要或团队。一个糟糕的摘要会在整个流水线中产生级联效应。

2.  **让团队匹配视频。** 不要为每个任务重复使用相同的 4 配置文件设置。一个没有节拍分析配置文件的音乐会失败。一个没有编剧配置文件的叙事电影会产生不连贯的场景。请参见 `references/role-archetypes.md`。

3.  **每个项目一个工作区。** 给定视频的所有配置文件共享同一个 `dir:` 工作区。任务通过共享文件系统和结构化移交传递工件。**每个** `kanban_create` 调用都传递 `workspace_kind="dir"` + `workspace_path="<绝对项目路径>"`。

4.  **每个项目都有租户。** 使用项目特定的租户 (`--tenant <project-slug>`)。保持看板范围，并防止与其他正在进行的看板发生交叉污染。

5.  **尊重现有技能。** 当某个场景适合现有技能时，相关的渲染器应在其任务中通过 `--skill <name>` 或在其配置文件中的 `always_load` 加载该技能。不要重新发明技能已经提供的东西。

6.  **导演绝不执行。** 即使拥有完整的 `kanban + terminal + file` 工具集，导演的 `SOUL.md` 规则也禁止其自己执行工作。它只负责分解和路由——每个具体任务都通过 `hermes kanban create` 调用分配给专家配置文件。`kanban-orchestrator` 技能对此有进一步说明。

7.  **不要过度分解。** 一个 30 秒的产品视频不需要 20 个任务。目标是创建尽可能小的任务图，同时仍能很好地并行化并暴露正确的审核关口。

8.  **启动前验证 API 密钥。** 外部 API（TTS、图像生成、图像转视频）需要在 `~/.hermes/.env` 或用户的密钥存储中有密钥。遇到缺少密钥错误的工作者会浪费任务槽位。设置脚本的 `check_key` 辅助函数会在所需密钥缺失时干净地中止。

## 文件结构图

```
SKILL.md                            ← 本文件（工作流程 + 规则）
references/
  intake.md                         ← 每种风格的发现问题库
  role-archetypes.md                ← 角色库（编剧、设计师、动画师等）
  tool-matrix.md                    ← 每个角色的技能 + 工具集映射
  kanban-setup.md                   ← 设置脚本结构与配置文件配置
  monitoring.md                     ← 监控 + 干预模式
  examples.md                       ← 六个实际流水线案例
assets/
  brief.md.tmpl                     ← 摘要模板
  setup.sh.tmpl                     ← 设置脚本模板
  soul.md.tmpl                      ← 配置文件个性模板
scripts/
  bootstrap_pipeline.py             ← 从摘要 + 团队 JSON 生成 setup.sh
  monitor.py                        ← 轮询 + 干预辅助脚本
```