---
title: "宝玉信息图 — 使用 21 种布局类型和 21 种视觉风格生成专业信息图"
sidebar_label: "宝玉信息图"
description: "使用 21 种布局类型和 21 种视觉风格生成专业信息图"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 宝玉信息图

使用 21 种布局类型和 21 种视觉风格生成专业信息图。分析内容，推荐布局×风格组合，并生成可直接发布的信息图。当用户要求创建“信息图”、“可视化摘要”、“信息图”、“可视化”或“高密度信息大图”时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/baoyu-infographic` |
| 版本 | `1.56.1` |
| 作者 | 宝玉 (JimLiu) |
| 许可证 | MIT |
| 标签 | `infographic`, `visual-summary`, `creative`, `image-generation` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 信息图生成器

改编自 [baoyu-infographic](https://github.com/JimLiu/baoyu-skills)，用于 Hermes 智能体的工具生态系统。

两个维度：**布局**（信息结构）× **风格**（视觉美学）。可以自由组合任意布局与任意风格。

## 何时使用

当用户要求创建信息图、可视化摘要、信息图形，或使用“信息图”、“可视化”、“高密度信息大图”等术语时，触发此技能。用户提供内容（文本、文件路径、URL 或主题），并可选择指定布局、风格、宽高比或语言。

## 选项

| 选项 | 值 |
|--------|--------|
| 布局 | 21 个选项（见布局库），默认：bento-grid |
| 风格 | 21 个选项（见风格库），默认：craft-handmade |
| 宽高比 | 命名：landscape (16:9)、portrait (9:16)、square (1:1)。自定义：任意 W:H 比例（例如 3:4、4:3、2.35:1） |
| 语言 | en、zh、ja 等 |

## 布局库

| 布局 | 最适合 |
|--------|----------|
| `linear-progression` | 时间线、流程、教程 |
| `binary-comparison` | A 与 B、前后对比、优缺点 |
| `comparison-matrix` | 多因素比较 |
| `hierarchical-layers` | 金字塔、优先级层级 |
| `tree-branching` | 类别、分类法 |
| `hub-spoke` | 中心概念及相关项目 |
| `structural-breakdown` | 爆炸视图、剖面图 |
| `bento-grid` | 多个主题、概览（默认） |
| `iceberg` | 表面与隐藏方面 |
| `bridge` | 问题-解决方案 |
| `funnel` | 转化、过滤 |
| `isometric-map` | 空间关系 |
| `dashboard` | 指标、KPI |
| `periodic-table` | 分类集合 |
| `comic-strip` | 叙事、序列 |
| `story-mountain` | 情节结构、张力弧线 |
| `jigsaw` | 相互关联的部分 |
| `venn-diagram` | 重叠概念 |
| `winding-roadmap` | 旅程、里程碑 |
| `circular-flow` | 循环、重复流程 |
| `dense-modules` | 高密度模块、数据丰富的指南 |

完整定义：`references/layouts/<layout>.md`

## 风格库

| 风格 | 描述 |
|-------|-------------|
| `craft-handmade` | 手绘、纸艺（默认） |
| `claymation` | 3D 黏土动画、定格动画 |
| `kawaii` | 日式可爱、柔和色调 |
| `storybook-watercolor` | 柔和绘画、奇思妙想 |
| `chalkboard` | 黑板粉笔 |
| `cyberpunk-neon` | 霓虹光效、未来感 |
| `bold-graphic` | 漫画风格、半色调 |
| `aged-academia` | 复古科学、棕褐色调 |
| `corporate-memphis` | 扁平矢量、鲜艳色彩 |
| `technical-schematic` | 蓝图、工程图 |
| `origami` | 折纸、几何图形 |
| `pixel-art` | 复古 8 位像素 |
| `ui-wireframe` | 灰度界面线框图 |
| `subway-map` | 交通图 |
| `ikea-manual` | 极简线条图 |
| `knolling` | 有序平铺 |
| `lego-brick` | 乐高积木构造 |
| `pop-laboratory` | 蓝图网格、坐标标记、实验室精度 |
| `morandi-journal` | 手绘涂鸦、温暖的莫兰迪色调 |
| `retro-pop-grid` | 1970 年代复古波普艺术、瑞士网格、粗轮廓 |
| `hand-drawn-edu` | 马卡龙柔和色调、手绘抖动、简笔画 |

完整定义：`references/styles/<style>.md`

## 推荐组合

| 内容类型 | 布局 + 风格 |
|--------------|----------------|
| 时间线/历史 | `linear-progression` + `craft-handmade` |
| 分步指南 | `linear-progression` + `ikea-manual` |
| A 与 B | `binary-comparison` + `corporate-memphis` |
| 层级结构 | `hierarchical-layers` + `craft-handmade` |
| 重叠 | `venn-diagram` + `craft-handmade` |
| 转化 | `funnel` + `corporate-memphis` |
| 循环 | `circular-flow` + `craft-handmade` |
| 技术性 | `structural-breakdown` + `technical-schematic` |
| 指标 | `dashboard` + `corporate-memphis` |
| 教育性 | `bento-grid` + `chalkboard` |
| 旅程 | `winding-roadmap` + `storybook-watercolor` |
| 分类 | `periodic-table` + `bold-graphic` |
| 产品指南 | `dense-modules` + `morandi-journal` |
| 技术指南 | `dense-modules` + `pop-laboratory` |
| 潮流指南 | `dense-modules` + `retro-pop-grid` |
| 教育图表 | `hub-spoke` + `hand-drawn-edu` |
| 流程教程 | `linear-progression` + `hand-drawn-edu` |

默认：`bento-grid` + `craft-handmade`

## 关键词快捷方式

当用户输入包含以下关键词时，**自动选择**关联的布局，并在第 3 步中将关联的风格作为首要推荐。跳过基于内容的布局推断（针对匹配的关键词）。

如果快捷方式有 **提示说明**，则将其附加到生成的提示中（第 5 步），作为额外的风格说明。

| 用户关键词 | 布局 | 推荐风格 | 默认宽高比 | 提示说明 |
|--------------|--------|--------------------|----------------|--------------|
| 高密度信息大图 / high-density-info | `dense-modules` | `morandi-journal`, `pop-laboratory`, `retro-pop-grid` | portrait | — |
| 信息图 / infographic | `bento-grid` | `craft-handmade` | landscape | 极简主义：干净画布、充足留白、无复杂背景纹理。仅使用简单卡通元素和图标。 |

## 输出结构

```
infographic/{topic-slug}/
├── source-{slug}.{ext}
├── analysis.md
├── structured-content.md
├── prompts/infographic.md
└── infographic.png
```

Slug：主题的 2-4 个单词的 kebab-case 格式。冲突时：追加 `-YYYYMMDD-HHMMSS`。

## 核心原则

- 忠实地保留源数据 — 不进行总结或改写（但在输出中包含之前**剥离任何凭据、API 密钥、令牌或机密信息**）
- 在构建内容之前定义学习目标
- 为视觉传达构建结构（标题、标签、视觉元素）

## 工作流程

### 第 1 步：分析内容

**加载参考**：从此技能中读取 `references/analysis-framework.md`。

1. 保存源内容（文件路径或粘贴 → 使用 `write_file` 保存为 `source.md`）
   - **备份规则**：如果 `source.md` 已存在，重命名为 `source-backup-YYYYMMDD-HHMMSS.md`
2. 分析：主题、数据类型、复杂度、语气、受众
3. 检测源语言和用户语言
4. 从用户输入中提取设计说明
5. 将分析保存到 `analysis.md`
   - **备份规则**：如果 `analysis.md` 已存在，重命名为 `analysis-backup-YYYYMMDD-HHMMSS.md`

详细格式请参见 `references/analysis-framework.md`。

### 第 2 步：生成结构化内容 → `structured-content.md`

将内容转换为信息图结构：
1. 标题和学习目标
2. 各部分包含：关键概念、内容（逐字）、视觉元素、文本标签
3. 数据点（所有统计/引文完全复制）
4. 用户的设计说明

**规则**：仅使用 Markdown。不添加新信息。忠实地保留数据。从输出中剥离任何凭据或机密信息。

详细格式请参见 `references/structured-content-template.md`。

### 第 3 步：推荐组合

**3.1 首先检查关键词快捷方式**：如果用户输入匹配 **关键词快捷方式** 表中的关键词，则自动选择关联的布局，并将关联的风格作为首要推荐。跳过基于内容的布局推断。

**3.2 否则**，根据以下因素推荐 3-5 个布局×风格组合：
- 数据结构 → 匹配布局
- 内容语气 → 匹配风格
- 受众期望
- 用户设计说明

### 第 4 步：确认选项

使用 `clarify` 工具与用户确认选项。由于 `clarify` 一次只能处理一个问题，因此首先询问最重要的问题：

**问题 1 — 组合**：呈现 3 个以上布局×风格组合及其理由。请用户选择一个。

**问题 2 — 宽高比**：询问宽高比偏好（横向/纵向/正方形或自定义 W:H）。

**问题 3 — 语言**（仅在源语言 ≠ 用户语言时）：询问文本内容应使用哪种语言。

### 第 5 步：生成提示 → `prompts/infographic.md`

**备份规则**：如果 `prompts/infographic.md` 已存在，重命名为 `prompts/infographic-backup-YYYYMMDD-HHMMSS.md`

**加载参考**：从 `references/layouts/<layout>.md` 读取所选布局，从 `references/styles/<style>.md` 读取所选风格。

组合：
1. 从 `references/layouts/<layout>.md` 获取布局定义
2. 从 `references/styles/<style>.md` 获取风格定义
3. 从 `references/base-prompt.md` 获取基础模板
4. 从第 2 步获取结构化内容
5. 所有文本使用确认的语言

**宽高比解析** `{{ASPECT_RATIO}}`：
- 命名预设 → 比例字符串：landscape→`16:9`，portrait→`9:16`，square→`1:1`
- 自定义 W:H 比例 → 直接使用（例如 `3:4`、`4:3`、`2.35:1`）

使用 `write_file` 将组装好的提示保存到 `prompts/infographic.md`。

### 第 6 步：生成图像

使用 `image_generate` 工具和第 5 步组装的提示。

- 将宽高比映射到 image_generate 的格式：`16:9` → `landscape`，`9:16` → `portrait`，`1:1` → `square`
- 对于自定义比例，选择最接近的命名宽高比
- 失败时自动重试一次
- 将生成的图像 URL/路径保存到输出目录

### 第 7 步：输出摘要

报告：主题、布局、风格、宽高比、语言、输出路径、创建的文件。

## 参考资料

- `references/analysis-framework.md` — 分析方法论  
- `references/structured-content-template.md` — 内容格式  
- `references/base-prompt.md` — 提示模板  
- `references/layouts/<layout>.md` — 21种布局定义  
- `references/styles/<style>.md` — 21种样式定义  

## 注意事项

1. **数据完整性至关重要** — 切勿总结、改写或更改原始统计数据。“73% 增长”必须保留为“73% 增长”，不能写成“显著增长”。  
2. **清除敏感信息** — 在任何输出文件中包含内容前，务必扫描源内容中的 API 密钥、令牌或凭据。  
3. **每节一条信息** — 每个信息图节应传达一个清晰的概念。信息过载会降低可读性。  
4. **样式一致性** — 必须将参考资料文件中的样式定义在整个信息图中一致应用。不要混用样式。  
5. **image_generate 宽高比** — 该工具仅支持 `横向`、`纵向` 和 `方形`。自定义比例（如 `3:4`）应映射到最接近的选项（此例中为纵向）。