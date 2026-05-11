---
title: "宝玉信息图 — 信息图: 21种布局 x 21种风格 (信息图, 可视化)"
sidebar_label: "宝玉信息图"
description: "信息图: 21种布局 x 21种风格 (信息图, 可视化)"
---

{/* 此页面由网站脚本 generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md 而非此页面。 */}

# 宝玉信息图

信息图：21种布局 x 21种风格 (信息图, 可视化)。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/creative/baoyu-infographic` |
| 版本 | `1.56.1` |
| 作者 | 宝玉 (JimLiu) |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `infographic`, `visual-summary`, `creative`, `image-generation` |

:::info
以下是该技能被触发时，Hermes 加载的完整技能定义。这就是该技能激活时，智能体看到的指令说明。
:::

# 信息图生成器

改编自 [baoyu-infographic](https://github.com/JimLiu/baoyu-skills) 以适应 Hermes Agent 的工具生态系统。

两个维度：**布局**（信息结构）× **风格**（视觉美学）。可自由组合任意布局与任意风格。

## 何时使用

当用户要求创建信息图、视觉摘要、信息图形，或使用如“信息图”、“可视化”、“高密度信息大图”等术语时，触发此技能。用户提供内容（文本、文件路径、URL 或主题），并可选地指定布局、风格、宽高比或语言。

## 选项

| 选项 | 值 |
|--------|--------|
| 布局 | 21 种选项（见布局图库），默认：bento-grid |
| 风格 | 21 种选项（见风格图库），默认：craft-handmade |
| 宽高比 | 预设：landscape (16:9), portrait (9:16), square (1:1)。自定义：任意 W:H 比例（例如 3:4, 4:3, 2.35:1） |
| 语言 | en, zh, ja 等 |

## 布局图库

| 布局 | 最佳用途 |
|--------|----------|
| `linear-progression` | 时间线、流程、教程 |
| `binary-comparison` | A 对 B、前后对比、优缺点 |
| `comparison-matrix` | 多因素比较 |
| `hierarchical-layers` | 金字塔、优先级 |
| `tree-branching` | 分类、分类学 |
| `hub-spoke` | 核心概念及关联项 |
| `structural-breakdown` | 分解视图、剖面图 |
| `bento-grid` | 多主题概览（默认） |
| `iceberg` | 表面与隐藏方面 |
| `bridge` | 问题-解决方案 |
| `funnel` | 转化、筛选 |
| `isometric-map` | 空间关系 |
| `dashboard` | 指标、KPI |
| `periodic-table` | 分类集合 |
| `comic-strip` | 叙事、序列 |
| `story-mountain` | 情节结构、张力弧 |
| `jigsaw` | 互相关联的部分 |
| `venn-diagram` | 重叠概念 |
| `winding-roadmap` | 旅程、里程碑 |
| `circular-flow` | 循环、重复过程 |
| `dense-modules` | 高密度模块、数据丰富的指南 |

完整定义：`references/layouts/<layout>.md`

## 风格图库

| 风格 | 描述 |
|-------|-------------|
| `craft-handmade` | 手绘、纸艺（默认） |
| `claymation` | 3D 黏土人偶、定格动画 |
| `kawaii` | 日式可爱、粉彩 |
| `storybook-watercolor` | 柔和水彩、异想天开 |
| `chalkboard` | 黑板粉笔 |
| `cyberpunk-neon` | 霓虹辉光、未来感 |
| `bold-graphic` | 漫画风格、半调网点 |
| `aged-academia` | 复古科学、深褐色 |
| `corporate-memphis` | 扁平矢量、活力色彩 |
| `technical-schematic` | 蓝图、工程制图 |
| `origami` | 折纸、几何 |
| `pixel-art` | 复古 8-bit |
| `ui-wireframe` | 灰度界面线框图 |
| `subway-map` | 交通线路图 |
| `ikea-manual` | 极简线条画 |
| `knolling` | 有序的平铺摆放 |
| `lego-brick` | 乐高积木搭建 |
| `pop-laboratory` | 蓝图网格、坐标标记、实验室精度 |
| `morandi-journal` | 手绘涂鸦、温暖莫兰迪色调 |
| `retro-pop-grid` | 1970年代复古波普艺术、瑞士网格、粗轮廓线 |
| `hand-drawn-edu` | 马卡龙粉彩、手绘抖动感、火柴人 |

完整定义：`references/styles/<style>.md`

## 推荐组合

| 内容类型 | 布局 + 风格 |
|--------------|----------------|
| 时间线/历史 | `linear-progression` + `craft-handmade` |
| 分步指南 | `linear-progression` + `ikea-manual` |
| A 对 B | `binary-comparison` + `corporate-memphis` |
| 层级关系 | `hierarchical-layers` + `craft-handmade` |
| 重叠概念 | `venn-diagram` + `craft-handmade` |
| 转化漏斗 | `funnel` + `corporate-memphis` |
| 循环流程 | `circular-flow` + `craft-handmade` |
| 技术原理 | `structural-breakdown` + `technical-schematic` |
| 数据指标 | `dashboard` + `corporate-memphis` |
| 教育内容 | `bento-grid` + `chalkboard` |
| 旅程规划 | `winding-roadmap` + `storybook-watercolor` |
| 分类展示 | `periodic-table` + `bold-graphic` |
| 产品指南 | `dense-modules` + `morandi-journal` |
| 技术指南 | `dense-modules` + `pop-laboratory` |
| 潮流指南 | `dense-modules` + `retro-pop-grid` |
| 教育图表 | `hub-spoke` + `hand-drawn-edu` |
| 流程教程 | `linear-progression` + `hand-drawn-edu` |

默认：`bento-grid` + `craft-handmade`

## 关键词快捷方式

当用户输入包含以下关键词时，**自动选择**关联的布局，并在步骤 3 中将关联风格作为首选推荐。匹配的关键词将跳过基于内容的布局推断。

如果快捷方式有**提示词注释**，则将它们作为额外的风格指令附加到生成的提示词（步骤 5）中。

| 用户关键词 | 布局 | 推荐风格 | 默认宽高比 | 提示词注释 |
|--------------|--------|--------------------|----------------|--------------|
| 高密度信息大图 / high-density-info | `dense-modules` | `morandi-journal`, `pop-laboratory`, `retro-pop-grid` | portrait | — |
| 信息图 / infographic | `bento-grid` | `craft-handmade` | landscape | 极简主义：干净画布、充足留白、无复杂背景纹理。仅使用简单卡通元素和图标。 |

## 输出结构

<!-- ascii-guard-ignore -->
```
infographic/{topic-slug}/
├── source-{slug}.{ext}
├── analysis.md
├── structured-content.md
├── prompts/infographic.md
└── infographic.png
```
<!-- ascii-guard-ignore-end -->

Slug：基于主题生成 2-4 个词的 kebab-case 命名。冲突时：追加 `-YYYYMMDD-HHMMSS`。

## 核心原则

- 忠实保存源数据——不进行总结或改写（但**在包含到输出前，剥离任何凭证、API 密钥、令牌或机密信息**）
- 在构建内容结构之前定义学习目标
- 为视觉传达而构建结构（标题、标签、视觉元素）

## 工作流程

### 步骤 1：分析内容

**加载参考资料**：读取本技能下的 `references/analysis-framework.md`。

1. 保存源内容（文件路径或粘贴内容 → 使用 `write_file` 保存为 `source.md`）
   - **备份规则**：如果 `source.md` 已存在，重命名为 `source-backup-YYYYMMDD-HHMMSS.md`
2. 分析：主题、数据类型、复杂性、语调、受众
3. 检测源语言和用户语言
4. 从用户输入中提取设计指令
5. 将分析保存至 `analysis.md`
   - **备份规则**：如果 `analysis.md` 已存在，重命名为 `analysis-backup-YYYYMMDD-HHMMSS.md`

详见 `references/analysis-framework.md` 了解详细格式。

### 步骤 2：生成结构化内容 → `structured-content.md`

将内容转换为信息图结构：
1. 标题和学习目标
2. 包含以下内容的章节：核心概念、内容（逐字）、视觉元素、文本标签
3. 数据点（所有统计数据/引用语需完全复制）
4. 来自用户的设计指令

**规则**：仅限 Markdown。不添加新信息。忠实保存数据。从输出中剥离任何凭证或机密。

详见 `references/structured-content-template.md` 了解详细格式。

### 步骤 3：推荐组合

**3.1 首先检查关键词快捷方式**：如果用户输入匹配 **关键词快捷方式** 表中的关键词，则自动选择关联的布局，并将关联风格作为首选推荐。跳过基于内容的布局推断。

**3.2 否则**，基于以下因素推荐 3-5 个布局×风格组合：
- 数据结构 → 匹配的布局
- 内容语调 → 匹配的风格
- 受众期望
- 用户的设计指令

### 步骤 4：确认选项

使用 `clarify` 工具与用户确认选项。由于 `clarify` 一次处理一个问题，因此首先询问最重要的问题：

**Q1 — 组合**：展示 3 种以上布局×风格组合及理由。请用户选择一种。

**Q2 — 宽高比**：询问宽高比偏好（landscape/portrait/square 或自定义 W:H）。

**Q3 — 语言**（仅当源语言 ≠ 用户语言时）：询问文本内容应使用哪种语言。

### 步骤 5：生成提示词 → `prompts/infographic.md`

**备份规则**：如果 `prompts/infographic.md` 已存在，重命名为 `prompts/infographic-backup-YYYYMMDD-HHMMSS.md`

**加载参考资料**：从 `references/layouts/<layout>.md` 读取选定的布局，从 `references/styles/<style>.md` 读取选定的风格。

组合：
1. 来自 `references/layouts/<layout>.md` 的布局定义
2. 来自 `references/styles/<style>.md` 的风格定义
3. 来自 `references/base-prompt.md` 的基础模板
4. 来自步骤 2 的结构化内容
5. 所有文本使用确认的语言

**宽高比解析**（用于 `{{ASPECT_RATIO}}`）：
- 预设命名 → 比例字符串：landscape→`16:9`, portrait→`9:16`, square→`1:1`
- 自定义 W:H 比例 → 直接使用（例如 `3:4`, `4:3`, `2.35:1`）

使用 `write_file` 将组装好的提示词保存至 `prompts/infographic.md`。

### 步骤 6：生成图像

使用 `image_generate` 工具及步骤 5 中组装好的提示词。

- 将宽高比映射到 image_generate 的格式：`16:9` → `landscape`, `9:16` → `portrait`, `1:1` → `square`
- 对于自定义比例，选择最接近的预设宽高比
- 失败时，自动重试一次
- 将生成的图像 URL/路径保存到输出目录

### 步骤 7：输出摘要

报告：主题、布局、风格、宽高比、语言、输出路径、已创建的文件。

## 参考资料

- `references/analysis-framework.md` — 分析方法论
- `references/structured-content-template.md` — 内容格式
- `references/base-prompt.md` — 提示词模板
- `references/layouts/<layout>.md` — 21 种布局定义
- `references/styles/<style>.md` — 21 种风格定义

## 概述
智能体是能够代表用户或其他系统自主执行任务的系统，通常借助人工智能技术实现。它们利用大型语言模型（LLMs）作为核心推理引擎，以规划、决策并与环境交互。智能体的设计目标是在无需持续人工干预的情况下完成复杂的工作流程，这使其区别于传统自动化工具。

## 核心组件
典型智能体包含以下关键组件：
- **大型语言模型（LLM）**：充当核心推理引擎，负责理解、规划和生成响应。
- **提示词与指令**：定义智能体的行为、目标和约束条件。
- **工具**：智能体可调用的外部函数或API，用于与外部世界交互（如搜索网络、读写数据库、执行代码）。
- **记忆系统**：存储历史交互和上下文信息，以实现连贯的对话或任务执行。
- **编排与推理**：管理思考-行动循环，决定下一步操作并整合工具输出。

## 智能体类型
根据其架构和功能，智能体可分为多种类型：
- **反应式智能体**：基于当前输入直接响应，不维护内部状态或历史记忆。
- **基于目标的智能体**：设定特定目标，并规划一系列动作来实现目标。
- **学习型智能体**：能够根据反馈和经验随时间优化其性能。
- **多智能体系统**：多个智能体协作或竞争以解决复杂问题。

## 应用场景
智能体正在众多领域被广泛应用：
- **客户服务**：处理咨询、解决问题并执行交易。
- **软件开发**：编写代码、调试错误并自动化测试。
- **数据分析**：收集、处理和解读大型数据集。
- **内容创作**：生成文章、报告、营销文案和创意内容。
- **流程自动化**：执行重复性业务流程，如数据录入和报告生成。

## 技术挑战
开发和部署智能体面临若干挑战：
- **可靠性与安全性**：确保智能体行为安全、可预测且符合道德规范。
- **幻觉问题**：LLM有时会生成不准确或虚构的信息。
- **上下文长度限制**：尽管上下文窗口在扩大，处理极长文本或对话仍具挑战。
- **工具集成的复杂性**：安全、高效地连接和使用各种工具。
- **评估与监控**：衡量性能并持续监控其行为需要专门的方法和工具。

## 未来发展方向
智能体技术的未来演进可能集中在：
- **增强推理与规划能力**：实现更复杂、更长期的任务执行。
- **改进人机协作**：开发更直观的界面和交互模式。
- **专业化与领域适应**：为特定行业或任务打造高度优化的智能体。
- **多模态能力**：集成视觉、听觉等更多感官输入以进行理解和交互。