---
title: Baoyu Article Illustrator — 文章插图：类型 × 风格 × 配色一致性
sidebar_label: Baoyu Article Illustrator
description: 文章插图：类型 × 风格 × 配色一致性
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Baoyu Article Illustrator

文章插图：类型 × 风格 × 配色一致性。

## Skill metadata

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/creative/baoyu-article-illustrator` 进行安装 |
| Path | `optional-skills/creative/baoyu-article-illustrator` |
| Version | `1.57.0` |
| Author | 宝玉 (JimLiu) |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `article-illustration`, `creative`, `image-generation` |

## Key Paths & Config

```
~/.hermes/config.yaml       Main configuration
~/.hermes/.env              API keys and secrets (under $HERMES_HOME if set)
$HERMES_HOME
```

# Article Illustrator

Adapted from [baoyu-article-illustrator](https://github.com/JimLiu/baoyu-skills) for Hermes智能体的工具生态系统。

分析文章，识别插图位置，并以**类型 × 风格 × 色板**的一致性生成图像。

## 使用时机 (When to Use)

当用户要求为文章配图、向文章添加图片、为内容生成插图，或使用“为文章配图”、“illustrate article”等短语时，请触发此技能。用户提供文章（文件路径或粘贴的内容），并可选地指定类型、风格、色板或密度。

## 三个维度 (Three Dimensions)

| 维度 | 控制项 | 示例 |
|-----------|----------|----------|
| **Type** (类型) | 信息结构 | 信息图表, 场景, 流程图, 对比图, 框架图, 时间轴 |
| **Style** (风格) | 渲染方法 | Notion风, 暖色调, 极简, 蓝图, 水彩, 精致 |
| **Palette** (色板) | 配色方案（可选） | 马卡龙色, 暖色, 霓虹灯 — 会覆盖风格的默认颜色 |

自由组合：`type=infographic, style=vector-illustration, palette=macaron`。

或者使用预设：`edu-visual` → 一次性完成类型 + 风格 + 色板的选择。参考 [style-presets.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/style-presets.md)。

## 类型 (Types)

| Type | 适用场景 |
|------|----------|
| `infographic` | 数据、指标、技术内容 |
| `scene` | 叙事性、情感性内容 |
| `flowchart` | 流程、工作流 |
| `comparison` | 并列展示、选项对比 |
| `framework` | 模型、架构图 |
| `timeline` | 历史、演变过程 |

## 风格 (Styles)

请参考 [references/styles.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/styles.md)，了解核心风格、完整的图库以及类型 × 风格的兼容性。

## 输出结构 (Output Structure)

<!-- ascii-guard-ignore -->
```
{output-dir}/
├── source-{slug}.{ext}    # 仅针对粘贴的内容
├── outline.md
├── prompts/
│   └── NN-{type}-{slug}.md
└── NN-{type}-{slug}.png
```
<!-- ascii-guard-ignore-end -->

**默认输出目录**:

| 输入 | 输出目录 | Markdown 插入路径 |
|-------|------------------|----------------------|
| 文章文件路径 | `{article-dir}/imgs/` | `imgs/NN-{type}-{slug}.png` |
| 粘贴的内容 | `illustrations/{topic-slug}/` (当前工作目录) | `illustrations/{topic-slug}/NN-{type}-{slug}.png` |

如果用户要求不同的布局（例如，图片与文章并排显示，或使用 `illustrations/` 子目录），请尊重该要求。

**Slug**: 2-4 个单词， kebab-case (连字符命名法)。**冲突处理**: 在末尾追加 `-YYYYMMDD-HHMMSS`。

## 核心原则 (Core Principles)

*   **可视化概念，而非比喻** — 如果文章使用了比喻（例如，“电锯切西瓜”），请插图底层概念，而不是字面上的图像。
*   **标签使用文章数据** — 使用文章中的实际数字、术语和引文，而不是通用的占位符。
*   **提示文件是可复现性的记录** — 每一张插图在生成任何图像之前都必须有一个保存在 `prompts/` 下的提示文件。
*   **移除秘密信息** — 在写入任何内容到磁盘之前，请扫描源内容以查找 API 密钥、令牌或凭据。

## 工作流程 (Workflow)

```
- [ ] 第 1 步：检测参考图像（如果提供了）
- [ ] 第 2 步：分析内容
- [ ] 第 3 步：确认设置（一次只澄清一个问题）
- [ ] 第 4 步：生成大纲
- [ ] 第 5 步：生成提示
- [ ] 第 6 步：生成图像 (image_generate)
- [ ] 第 7 步：定稿
```

### 第 1 步：检测参考图像 (Detect Reference Images)

如果用户提供了参考图像（内联粘贴路径、附件或 URL）：

1.  对每张参考图，使用 `vision_analyze` 调用，提供路径/URL，并提出一个关于风格、色板、构图和主题的问题。通过 `write_file` 将返回的描述记录到 `{output-dir}/references/NN-ref-{slug}.md` 中。
2.  **不要**尝试通过 `write_file` / `read_file` 复制二进制文件 — 这些工具仅处理文本。如果需要本地副本以供记录，请使用 `terminal` (`cp "$src" "{output-dir}/references/NN-ref-{slug}.{ext}"`)。技能本身不需要读取二进制文件；它依赖于视觉描述。
3.  由于 `image_generate` 不接受图像输入，因此视觉描述将在第 5 步嵌入到提示中。

完整流程：[references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/workflow.md#step-1-detect-reference-images)。

### 第 2 步：分析 (Analyze)

| 分析项 | 输出内容 |
|----------|--------|
| 内容类型 | 技术性 / 教程 / 方法论 / 叙事性 |
| 目的 | 信息展示 / 可视化 / 想象力激发 |
| 核心论点 | 2-5 个主要观点 |
| 插图位置 | 插图能增加价值的位置 |

读取源文件（文件路径 → `read_file`，或粘贴文本），并使用 `write_file` 将分析结果写入 `{output-dir}/analysis.md`。

完整流程：[references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/workflow.md#step-2-analyze)。

### 第 3 步：确认设置 (Confirm Settings)

使用 `clarify` 工具。由于 `clarify` 一次只处理一个问题，请先提出最重要的那个问题。跳过用户请求中已包含答案的任何问题。

| 顺序 | 问题 | 选项 |
|-------|----------|---------|
| Q1 | **预设或类型** | [推荐预设], [其他预设]，或手动选择：infographic, scene, flowchart, comparison, framework, timeline, mixed |
| Q2 | **密度** | minimal (极少，1-2张), balanced (平衡，3-5张), per-section (按章节分配，推荐), rich (丰富，6+张) |
| Q3 | **风格** *(如果 Q1 选择了预设则跳过)* | [推荐], minimal-flat, sci-fi, hand-drawn, editorial, scene, poster |
| Q4 | **色板** *(可选)* | Default (风格默认颜色), macaron, warm, neon |
| Q5 | **语言** *(仅当文章语言不明确时提问)* | 文章语言 / 用户语言 |

不要连续提出超过 2-3 个 `clarify` 问题。如果用户已在请求中指定了这些信息，则完全跳过。

完整流程：[references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/workflow.md#step-3-confirm-settings)。

### 第 4 步：生成大纲 → `outline.md`

使用 `write_file` 保存 `{output-dir}/outline.md`，包含前置信息（类型、密度、风格、色板、图像数量）和每张插图的条目：

```yaml
## Illustration 1
**Position**: [section/paragraph]
**Purpose**: [why]
**Visual Content**: [what to show]
**Filename**: 01-infographic-concept-name.png
```

完整模板：[references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/workflow.md#step-4-generate-outline)。

### 第 5 步：生成提示 (Generate Prompts)

**阻塞项**: 在生成任何图像之前，每一张插图都必须有一个保存的提示文件——该提示文件是可复现性的记录。

对于每张插图：

1.  为 [references/prompt-construction.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/prompt-construction.md) 中的每一张插图创建提示文件。
2.  使用 `write_file` 将其保存到 `{output-dir}/prompts/NN-{type}-{slug}.md`，并包含 YAML 前置信息。
3.  提示词**必须**使用具有结构化部分（ZONES / LABELS / COLORS / STYLE / ASPECT）的类型特定模板。
4.  LABELS 必须包括文章特定的数据：实际数字、术语、指标、引文。
5.  处理参考资料（`direct`/`style`/`palette`）到提示词前置信息中——对于 `direct` 用法，请在提示词中嵌入对该参考资料的文本描述（因为 `image_generate` 不接受参考图像输入）。

### 第 6 步：生成图像 (Generate Images)

对于每个提示文件：

1.  调用 `image_generate(prompt=..., aspect_ratio=...)`。`image_generate` 返回一个包含图像 URL 的 JSON 结果；它**不写入磁盘**，也**不接受输出路径**。
2.  将提示中的 `ASPECT` 映射到 `image_generate` 的枚举值：`16:9` → `landscape` (横向), `9:16` → `portrait` (纵向), `1:1` → `square` (正方形)。自定义比例 → 最近的命名比例。
3.  通过 `terminal`（例如，`curl -sSL -o "{output-dir}/NN-{type}-{slug}.png" "{url}"`）将返回的 URL 下载到 `{output-dir}/NN-{type}-{slug}.png`。
4.  发生生成失败时，自动重试一次。

注意：底层图像生成后端由用户配置（默认：FAL FLUX 2 Klein 9B），而不是通过 `image_generate` 可供智能体选择。不要在提示词中写入模型名称，期望它能路由到相应的后端。

### 第 7 步：定稿 (Finalize)

将 `![description](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/{relative-path}/NN-{type}-{slug}.png)` 插入到相应的段落之后。Alt 文本：文章语言中的简洁描述。

报告：

```
Article Illustration Complete!
Article: [path] | Type: [type] | Density: [level] | Style: [style] | Palette: [palette or default]
Images: X/N generated
```

## 修改 (Modification)

| 操作 | 步骤 |
|--------|-------|
| 编辑 | 更新提示 → 重新生成 → 更新参考资料 |
| 添加 | 位置 → 提示 → 生成 → 更新大纲 → 插入 |
| 删除 | 删除文件 → 移除参考资料 → 更新大纲 |

## 参考资料 (References)

| 文件 | 内容 |
|------|---------|
| [references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/workflow.md) | 详细流程 |
| [references/usage.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/usage.md) | 调用示例 |
| [references/styles.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/styles.md) | 风格库 + 色板库 |
| [references/style-presets.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/style-presets.md) | 预设快捷方式（类型 + 风格 + 色板） |
| [references/prompt-construction.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-article-illustrator/references/prompt-construction.md) | 提示词模板 |

## 潜在问题 (Pitfalls)

1.  **数据完整性至关重要** — 切勿总结、转述或更改源统计数据。“73% increase”必须保持为“73% increase”。
2.  **移除秘密信息** — 在将任何内容写入输出文件之前，请扫描源内容以查找 API 密钥、令牌或凭据。
3.  **不要字面化地描绘比喻** — 请可视化其潜在概念。
4.  **提示文件是强制性的** — 没有保存的提示文件，就没有图像生成。该文件是未来重新生成或切换后端时的记录依据。
5.  **`image_generate` 的宽高比** — 该工具支持 `landscape` (横向)、`portrait` (纵向) 和 `square` (正方形)。自定义比例会映射到最近的命名选项。
6.  **`image_generate` 返回 URL，而非本地文件** — 在将本地图像路径插入文章之前，务必通过 `terminal` (`curl`) 进行下载。
7.  **智能体无法选择后端** — `image_generate` 使用用户配置的任何模型（默认：FAL FLUX 2 Klein 9B）。不要在提示词中写入“使用 `<model>` 生成此图”来期望它能路由到特定后端。