---
title: "宝玉文章插画师 — 文章插图：类型 × 风格 × 配色一致性"
sidebar_label: "宝玉文章插画师"
description: "文章插图：类型 × 风格 × 配色一致性"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md 而非此页面。 */}

# 宝玉文章插画师

文章插图：类型 × 风格 × 配色一致性。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/baoyu-article-illustrator` |
| 版本 | `1.57.0` |
| 作者 | 宝玉 (JimLiu) |
| 许可 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `文章插图`, `创意`, `图像生成` |

:::info
以下是 Hermes 智能体在此技能触发时加载的完整技能定义。这是技能激活时智能体看到的指令内容。
:::

# 文章配图器

改编自 [baoyu-article-illustrator](https://github.com/JimLiu/baoyu-skills)，以适应 Hermes 智能体的工具生态。

分析文章，确定配图位置，并使用 **类型 × 风格 × 调色板** 的一致性来生成图像。

## 何时使用

当用户要求为文章配图、为文章添加图像、为内容生成插图，或使用 "为文章配图"、"illustrate article" 或 "add images" 等短语时，触发此技能。用户提供一篇文章（文件路径或粘贴内容），并可选地指定类型、风格、调色板或密度。

## 三个维度

| 维度     | 控制内容       | 示例                                   |
|----------|----------------|----------------------------------------|
| **类型** | 信息结构       | 信息图表、场景、流程图、对比、框架、时间线 |
| **风格** | 渲染方法       | notion、暖色、极简、蓝图、水彩、优雅     |
| **调色板** | 色彩方案（可选） | 马卡龙、暖色、霓虹色 — 覆盖风格的默认颜色 |

自由组合：`type=infographic, style=vector-illustration, palette=macaron`。

或使用预设：`edu-visual` → 一步设置类型 + 风格 + 调色板。参见 [style-presets.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/style-presets.md)。

## 类型

| 类型           | 最适用于           |
|----------------|-------------------|
| `infographic`  | 数据、指标、技术  |
| `scene`        | 叙事、情感        |
| `flowchart`    | 流程、工作流      |
| `comparison`   | 并列对比、选项    |
| `framework`    | 模型、架构        |
| `timeline`     | 历史、演变        |

## 风格

参见 [references/styles.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/styles.md) 了解核心风格、完整画廊以及类型 × 风格兼容性。

## 输出结构

<!-- ascii-guard-ignore -->
```
{output-dir}/
├── source-{slug}.{ext}    # 仅用于粘贴内容
├── outline.md
├── prompts/
│   └── NN-{type}-{slug}.md
└── NN-{type}-{slug}.png
```
<!-- ascii-guard-ignore-end -->

**默认输出目录**：

| 输入             | 输出目录                            | Markdown 插入路径                          |
|------------------|-------------------------------------|-------------------------------------------|
| 文章文件路径     | `{article-dir}/imgs/`               | `imgs/NN-{type}-{slug}.png`               |
| 粘贴内容         | `illustrations/{topic-slug}/` (当前工作目录) | `illustrations/{topic-slug}/NN-{type}-{slug}.png` |

如果用户要求不同的布局（例如，图像与文章并列，或使用 `illustrations/` 子目录），请遵从其要求。

**Slug**：2-4 个单词，kebab-case 格式。**冲突时**：追加 `-YYYYMMDD-HHMMSS`。

## 核心原则

- **可视化概念，而非隐喻** — 如果文章使用了隐喻（例如，“电锯切西瓜”），请说明其背后的含义。
- **标签使用文章数据** — 使用文章中的实际数字、术语和引文，而非通用占位符。
- **提示词文件是可重复性记录** — 每张插图在生成任何图像之前，必须在 `prompts/` 下保存一个提示词文件。
- **剥离敏感信息** — 在将任何内容写入磁盘之前，扫描源内容中的 API 密钥、令牌或凭据。

## 工作流程

```
- [ ] 步骤 1：检测参考图像（如果提供）
- [ ] 步骤 2：分析内容
- [ ] 步骤 3：确认设置（澄清工具，一次一个问题）
- [ ] 步骤 4：生成大纲
- [ ] 步骤 5：生成提示词
- [ ] 步骤 6：生成图像 (image_generate)
- [ ] 步骤 7：完成
```

### 步骤 1：检测参考图像

如果用户提供了参考图像（内联粘贴的路径、附件或 URL）：

1.  对于每个参考，使用路径/URL 和一个问题调用 `vision_analyze`，询问风格、调色板、构图和主题。将返回的描述通过 `write_file` 记录到 `{output-dir}/references/NN-ref-{slug}.md`。
2.  **不要** 尝试通过 `write_file` / `read_file` 复制二进制文件 — 这些工具仅处理文本。如果需要本地副本留档，请使用 `terminal`（`cp "$src" "{output-dir}/references/NN-ref-{slug}.{ext}"`）。该技能本身不需要读取二进制文件；它基于视觉描述工作。
3.  由于 `image_generate` 不接受图像输入，视觉描述是第 5 步中嵌入提示词的内容。

完整流程：[references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/workflow.md#step-1-detect-reference-images)。

### 步骤 2：分析

| 分析项     | 输出                                 |
|------------|--------------------------------------|
| 内容类型   | 技术 / 教程 / 方法论 / 叙事         |
| 目的       | 信息 / 可视化 / 想象                 |
| 核心论点   | 2-5 个要点                           |
| 位置       | 插图增加价值的位置                   |

读取源文件（文件路径 → `read_file`，或粘贴的文本）并将分析结果使用 `write_file` 写入 `{output-dir}/analysis.md`。

完整流程：[references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/workflow.md#step-2-analyze)。

### 步骤 3：确认设置

使用 `clarify` 工具。由于 `clarify` 一次处理一个问题，请先问最重要的问题。如果用户请求中已包含答案，请跳过该问题。

| 顺序 | 问题                         | 选项                                                                                               |
|------|------------------------------|----------------------------------------------------------------------------------------------------|
| Q1   | **预设还是类型**             | [推荐预设]、[备选预设]，或手动选择：infographic, scene, flowchart, comparison, framework, timeline, mixed |
| Q2   | **密度**                     | minimal (1-2), balanced (3-5), per-section (推荐), rich (6+)                                       |
| Q3   | **风格** *(如果 Q1 选了预设则跳过)* | [推荐]、minimal-flat、sci-fi、hand-drawn、editorial、scene、poster                               |
| Q4   | **调色板** *(可选)*          | Default (风格默认颜色)、macaron、warm、neon                                                        |
| Q5   | **语言** *(仅当文章语言不明确时)* | 文章语言 / 用户语言                                                                               |

不要连续问超过 2-3 个 `clarify` 问题。如果用户已在请求中指定，请完全跳过。

完整流程：[references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/workflow.md#step-3-confirm-settings)。

### 步骤 4：生成大纲 → `outline.md`

使用 `write_file` 保存 `{output-dir}/outline.md`，包含前置元数据（type, density, style, palette, image_count）以及每张插图的一个条目：

```yaml
## 插图 1
**位置**: [章节/段落]
**目的**: [为什么]
**视觉内容**: [展示什么]
**文件名**: 01-infographic-concept-name.png
```

完整模板：[references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/workflow.md#step-4-generate-outline)。

### 步骤 5：生成提示词

**阻塞操作**：每张插图在生成任何图像之前必须有一个保存的提示词文件 — 提示词文件是可重复性记录。

对于每张插图：

1.  根据 [references/prompt-construction.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/prompt-construction.md) 创建提示词文件。
2.  使用 `write_file` 保存到 `{output-dir}/prompts/NN-{type}-{slug}.md`，包含 YAML 前置元数据。
3.  提示词 **必须** 使用包含结构化部分（ZONES / LABELS / COLORS / STYLE / ASPECT）的类型特定模板。
4.  LABELS **必须** 包含文章特定数据：实际数字、术语、指标、引文。
5.  根据提示词前置元数据处理参考（`direct`/`style`/`palette`）— 对于 `direct` 用法，在提示词中嵌入参考的文字描述（因为 `image_generate` 不接受参考图像输入）。

### 步骤 6：生成图像

对于每个提示词文件：

1.  调用 `image_generate(prompt=..., aspect_ratio=...)`。`image_generate` 返回一个包含图像 URL 的 JSON 结果；它 **不** 会写入磁盘，也 **不** 接受输出路径。
2.  将提示词的 `ASPECT` 映射到 `image_generate` 的枚举值：`16:9` → `landscape`，`9:16` → `portrait`，`1:1` → `square`。自定义比例 → 最近的命名比例。
3.  通过 `terminal` 将返回的 URL 下载到 `{output-dir}/NN-{type}-{slug}.png`（例如 `curl -sSL -o "{output-dir}/NN-{type}-{slug}.png" "{url}"`）。
4.  生成失败时，自动重试一次。

注意：底层的图像生成后端由用户配置（默认：FAL FLUX 2 Klein 9B），并且 **不** 能通过 `image_generate` 由智能体选择。不要期望通过将模型名称写入提示词来路由。

### 步骤 7：完成

在相应段落之后插入 `![描述](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/{relative-path}/NN-{type}-{slug}.png)`。替代文本：使用文章语言的简明描述。

报告：

```
文章配图完成！
文章：[路径] | 类型：[类型] | 密度：[级别] | 风格：[风格] | 调色板：[调色板或默认]
图像：X/N 已生成
```

## 修改

| 操作 | 步骤                                       |
|------|--------------------------------------------|
| 编辑 | 更新提示词 → 重新生成 → 更新引用          |
| 添加 | 确定位置 → 提示词 → 生成 → 更新大纲 → 插入 |
| 删除 | 删除文件 → 移除引用 → 更新大纲             |

## 参考文件

| 文件                                                                                                            | 内容                             |
|-----------------------------------------------------------------------------------------------------------------|----------------------------------|
| [references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/workflow.md) | 详细流程                         |
| [references/usage.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/usage.md)         | 调用示例                         |
| [references/styles.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/styles.md)       | 风格画廊 + 调色板画廊            |
| [references/style-presets.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/style-presets.md) | 预设快捷方式（类型 + 风格 + 调色板） |
| [references/prompt-construction.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-article-illustrator/references/prompt-construction.md) | 提示词模板                       |

```markdown
---
title: "智能体系统：原理、设计与实践"
description: "深入解析智能体（Agent）的核心架构、多智能体协作模式及实际部署中的关键注意事项"
slug: agent-systems-guide
---

# 智能体系统：原理、设计与实践

## 核心概念与术语

在智能体（Agent）系统中，每个**智能体**都具备自主决策与执行能力。当多个智能体协同工作时，我们称之为**智能体们**或**多个智能体**的协作网络。在软件工程上下文中，常使用**智能体**或**代理智能体**来指代这些自动化实体。

## 关键设计原则

### 数据完整性至上
- 任何统计数据都必须原样保留，例如“73% 的提升”仍表述为“73% 的提升”
- 禁止摘要、转述或修改原始数据指标

### 安全性考量
- 扫描并移除所有源内容中的 API 密钥、令牌或凭证
- 输出文件中不得包含任何敏感凭据信息

### 概念可视化
- 避免字面化呈现隐喻
- 应聚焦于底层概念的可视化表达

## 技术实现规范

### 提示文件管理
- 无保存的提示文件则禁止生成图像
- 提示文件是后续重新生成或切换后端的关键依据

### 图像生成参数
- `image_generate` 工具支持以下宽高比：`横向`、`纵向`、`正方形`
- 自定义比例将自动匹配至最接近的可用选项

### 资源处理流程
- `image_generate` 返回的是 URL 而非本地文件
- 必须通过 `终端`（`curl`）下载后再插入本地图片路径

### 后端配置说明
- 智能体无法自行选择后端模型
- `image_generate` 将使用用户配置的默认模型（当前：FAL FLUX 2 Klein 9B）
- 请勿在提示中写入 `"使用 <模型> 生成此图"` 等期望路由的指令

## 最佳实践示例

> **注意**：所有 HTML 实体必须严格保留原样
> - `&lt;100ms` 保持为 `&lt;100ms`，不可转换为 `<100ms`
> - `&amp;` 保持为 `&amp;`，不可转换为 `&`

---
*本文档最后更新于智能体系统开发周期第三阶段*