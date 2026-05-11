---
title: "宝玉漫画 — 知识漫画（教育、传记、教程）"
sidebar_label: "宝玉漫画"
description: "知识漫画（教育、传记、教程）"
---

{/* 此页面由网站脚本 `generate-skill-docs.py` 根据技能的 `SKILL.md` 自动生成。请编辑源文件 `SKILL.md`，而非本页面。 */}

# 宝玉漫画

知识漫画（教育、传记、教程）。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/baoyu-comic` |
| 版本 | `1.56.1` |
| 作者 | 宝玉 (JimLiu) |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `漫画`, `知识漫画`, `创意`, `图像生成` |

:::info
以下是 Hermes 加载此技能时的完整技能定义。当此技能激活时，这就是智能体看到的指令。
:::

# 知识漫画创作器

改编自 [baoyu-comic](https://github.com/JimLiu/baoyu-skills)，以适应 Hermes 智能体的工具生态系统。

创作具有灵活的风格×语调组合的原创知识漫画。

## 何时使用

当用户要求创作知识/教育漫画、传记漫画、教程漫画，或使用如"知识漫画"、"教育漫画"或"Logicomix风格"等术语时触发此技能。用户提供内容（文本、文件路径、URL或主题），并可选择性地指定艺术风格、语调、布局、宽高比或语言。

## 参考图像

Hermes 的 `image_generate` 工具是**仅提示**的——它接受文本提示和宽高比，并返回一个图像URL。它**不**接受参考图像。当用户提供参考图像时，使用它来**提取文本特征**，并将其嵌入到每页的提示中：

**接收**：当用户提供文件路径时（或在对话中粘贴图像）。
- 文件路径 → 复制到漫画输出旁边的 `refs/NN-ref-{slug}.{ext}` 以作溯源
- 粘贴的图像没有路径 → 通过 `clarify` 询问用户路径，或作为文本回退方案，口头提取风格特征
- 无参考 → 跳过此部分

**使用模式**（每个参考）：

| 用途 | 效果 |
|------|------|
| `style` | 提取风格特征（线条处理、纹理、情绪）并添加到每页的提示正文中 |
| `palette` | 提取十六进制颜色并添加到每页的提示正文中 |
| `scene` | 提取场景构图或主体说明并添加到相关页面 |

**在每个页面的提示前言中记录**当存在参考时：

```yaml
references:
  - ref_id: 01
    filename: 01-ref-scene.png
    usage: style
    traits: "柔和的色调，软边的水墨，低对比度背景"
```

角色一致性通过 `characters/characters.md` 中的**文本描述**（在步骤3中编写）来驱动，这些描述在步骤5中内联嵌入到每个页面提示中。步骤7.1生成的可选PNG角色表是面向人工的审查产物，不是 `image_generate` 的输入。

## 选项

### 视觉维度

| 选项 | 值 | 描述 |
|------|------|------|
| 艺术风格 | ligne-claire (默认), manga, realistic, ink-brush, chalk, minimalist | 艺术风格/渲染技术 |
| 语调 | neutral (默认), warm, dramatic, romantic, energetic, vintage, action | 情绪/氛围 |
| 布局 | standard (默认), cinematic, dense, splash, mixed, webtoon, four-panel | 面板排列 |
| 宽高比 | 3:4 (默认，竖版), 4:3 (横版), 16:9 (宽屏) | 页面宽高比 |
| 语言 | auto (默认), zh, en, ja, 等。 | 输出语言 |
| 参考 | 文件路径 | 用于风格/调色板特征提取的参考图像（不传递给图像模型）。参见上方的[参考图像](#参考图像)。 |

### 部分工作流选项

| 选项 | 描述 |
|------|------|
| 仅故事板 | 仅生成故事板，跳过提示和图像 |
| 仅提示 | 生成故事板+提示，跳过图像 |
| 仅图像 | 从现有提示目录生成图像 |
| 重新生成第N页 | 仅重新生成特定页面（例如，`3` 或 `2,5,8`） |

详情：[references/partial-workflows.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/partial-workflows.md)

### 艺术风格、语调与预设目录

- **艺术风格** (6种): `ligne-claire`, `manga`, `realistic`, `ink-brush`, `chalk`, `minimalist`。完整定义见 `references/art-styles/<style>.md`。
- **语调** (7种): `neutral`, `warm`, `dramatic`, `romantic`, `energetic`, `vintage`, `action`。完整定义见 `references/tones/<tone>.md`。
- **预设** (5种)，具有超越单纯艺术+语调的特殊规则：

  | 预设 | 等效组合 | 亮点 |
  |------|----------|------|
  | `ohmsha` | manga + neutral | 视觉隐喻，无对话头， gadget 揭示 |
  | `wuxia` | ink-brush + action | 气效，战斗视觉，氛围感 |
  | `shoujo` | manga + romantic | 装饰元素，眼部细节，浪漫时刻 |
  | `concept-story` | manga + warm | 视觉符号系统，成长弧线，对话+动作平衡 |
  | `four-panel` | minimalist + neutral + four-panel布局 | 起承转合结构，黑白+点色，火柴人角色 |

  完整规则见 `references/presets/<preset>.md` — 当选择预设时加载该文件。

- **兼容性矩阵** 和 **内容信号→预设** 表位于 [references/auto-selection.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/auto-selection.md)。在步骤2中推荐组合前请先阅读。

## 文件结构

输出目录：`comic/{topic-slug}/`
- Slug：来自主题的2-4个单词 kebab-case（例如，`alan-turing-bio`）
- 冲突：添加时间戳（例如，`turing-story-20260118-143052`）

**内容**：
| 文件 | 描述 |
|------|------|
| `source-{slug}.md` | 保存的源内容（kebab-case slug 与输出目录匹配） |
| `analysis.md` | 内容分析 |
| `storyboard.md` | 包含面板分解的故事板 |
| `characters/characters.md` | 角色定义 |
| `characters/characters.png` | 角色参考表（从 `image_generate` 下载） |
| `prompts/NN-{cover\|page}-[slug].md` | 生成提示 |
| `NN-{cover\|page}-[slug].png` | 生成的图像（从 `image_generate` 下载） |
| `refs/NN-ref-{slug}.{ext}` | 用户提供的参考图像（可选，用于溯源） |

## 语言处理

**检测优先级**：
1. 用户指定的语言（显式选项）
2. 用户的对话语言
3. 源内容语言

**规则**：使用用户的输入语言进行所有交互：
- 故事板大纲和场景描述
- 图像生成提示
- 用户选择选项和确认
- 进度更新、问题、错误、摘要

技术术语保持英文。

## 工作流程

### 进度清单

```
漫画进度：
- [ ] 步骤1: 设置与分析
  - [ ] 1.1 分析内容
  - [ ] 1.2 检查现有目录
- [ ] 步骤2: 确认 - 风格与选项 ⚠️ 必需
- [ ] 步骤3: 生成故事板 + 角色
- [ ] 步骤4: 审查大纲（条件性）
- [ ] 步骤5: 生成提示
- [ ] 步骤6: 审查提示（条件性）
- [ ] 步骤7: 生成图像
  - [ ] 7.1 生成角色表（如需要）→ characters/characters.png
  - [ ] 7.2 生成页面（提示中嵌入角色描述）
- [ ] 步骤8: 完成报告
```

### 流程

```
输入 → 分析 → [检查现有？] → [确认：风格 + 审查] → 故事板 → [审查？] → 提示 → [审查？] → 图像 → 完成
```

### 步骤摘要

| 步骤 | 操作 | 关键输出 |
|------|------|----------|
| 1.1 | 分析内容 | `analysis.md`, `source-{slug}.md` |
| 1.2 | 检查现有目录 | 处理冲突 |
| 2 | 确认风格、焦点、受众、审查 | 用户偏好 |
| 3 | 生成故事板 + 角色 | `storyboard.md`, `characters/` |
| 4 | 审查大纲（如果请求） | 用户批准 |
| 5 | 生成提示 | `prompts/*.md` |
| 6 | 审查提示（如果请求） | 用户批准 |
| 7.1 | 生成角色表（如果需要） | `characters/characters.png` |
| 7.2 | 生成页面 | `*.png` 文件 |
| 8 | 完成报告 | 摘要 |

### 用户提问

使用 `clarify` 工具确认选项。由于 `clarify` 一次处理一个问题，首先询问最重要的问题并按顺序进行。完整的步骤2问题集见 [references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/workflow.md)。

**超时处理（关键）**：`clarify` 可能返回 `"用户未在时间限制内提供响应。请运用你的最佳判断做出选择并继续。"` — 这**不是**用户同意默认所有选项的许可。

- 将其视为仅针对**那一个问题**的默认值。继续按顺序询问剩余的步骤2问题；每个问题都是独立的同意点。
- **在下一条消息中向用户明显地展示默认值**，以便他们有机会纠正：例如 `"风格：默认为 ohmsha 预设（clarify 超时）。如需更改请告知。"` — 未报告的默认值与从未询问无异。
- 不要在一次超时后将步骤2压缩为单一的"全部使用默认值"流程。如果用户真的不在，他们对所有五个问题都会同样缺席——但当他们返回时可以纠正可见的默认值，而无法纠正不可见的。

### 步骤7：图像生成

对所有图像渲染使用 Hermes 的内置 `image_generate` 工具。其模式仅接受 `prompt` 和 `aspect_ratio` (`landscape` | `portrait` | `square`)；它**返回一个URL**，而不是本地文件。因此，每页生成的角色表或图像都必须下载到输出目录。

**提示文件要求（硬性）**：在调用 `image_generate` 之前，将每个图像的完整最终提示写入 `prompts/` 下的独立文件（命名：`NN-{type}-[slug].md`）。提示文件是可重现性的记录。

**宽高比映射** — 故事板的 `aspect_ratio` 字段映射到 `image_generate` 的格式如下：

| 故事板宽高比 | `image_generate` 格式 |
|------------------|-------------------------|
| `3:4`, `9:16`, `2:3` | `portrait` |
| `4:3`, `16:9`, `3:2` | `landscape` |
| `1:1` | `square` |

**下载步骤** — 在每次 `image_generate` 调用后：
1. 从工具结果中读取URL
2. 使用**绝对**输出路径获取图像字节，例如
   `curl -fsSL "<url>" -o /abs/path/to/comic/<slug>/NN-page-<slug>.png`
3. 在继续下一页之前，验证该文件在该确切路径下存在且非空。

**永远不要依赖 shell CWD 持久性来处理 `-o` 路径。** 终端工具的持久shell CWD 可能在批次之间发生变化（会话过期、`TERMINAL_LIFETIME_SECONDS`、失败的 `cd` 使你留在错误的目录中）。`curl -o relative/path.png` 是一个隐蔽的陷阱：如果CWD已漂移，文件会落在其他地方且没有错误。**始终将完全限定的绝对路径传递给 `-o`**，或向终端工具传递 `workdir=<abs path>`。2026年4月事件：一个10页漫画的第06-09页落在了仓库根目录，而不是 `comic/<slug>/`，因为批次3从批次2继承了过时的CWD，而 `curl -o 06-page-skills.png` 写入了错误的目录。然后智能体花了几个轮次声称文件存在于它们并不存在的地方。

**7.1 角色表** — 当漫画是多页且有重复角色时生成它（到 `characters/characters.png`，宽高比为 `landscape`）。对于简单预设（例如，四格漫画极简风格）或单页漫画则跳过。`characters/characters.md` 中的提示文件必须在调用 `image_generate` 之前存在。渲染的PNG是**面向人工的审查产物**（以便用户可以视觉验证角色设计），也是后续重新生成或手动提示编辑的参考——它**不**驱动步骤7.2。页面提示在步骤5中已经根据 `characters/characters.md` 中的**文本描述**编写；`image_generate` 无法接受图像作为视觉输入。

**7.2 页面** — 每页的提示必须在调用 `image_generate` 之前已经位于 `prompts/NN-{cover|page}-[slug].md`。由于 `image_generate` 是仅提示的，角色一致性通过在步骤5中将角色描述（来自 `characters/characters.md`）**内联嵌入到每个页面提示中**来强制执行。无论7.1中是否生成了PNG表，嵌入都是统一进行的；PNG仅作为审查/重新生成的辅助工具。

**备份规则**：现有的 `prompts/…md` 和 `…png` 文件 → 在重新生成前使用 `-backup-YYYYMMDD-HHMMSS` 后缀重命名。

完整的逐步工作流程（分析、故事板、审查门、重新生成变体）：[references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/workflow.md)。

## 参考资料

**核心模板**:
- [analysis-framework.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/analysis-framework.md) - 深度内容分析
- [character-template.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/character-template.md) - 角色定义格式
- [storyboard-template.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/storyboard-template.md) - 分镜脚本结构
- [ohmsha-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/ohmsha-guide.md) - Ohmsha 漫画特定指南

**风格定义**:
- `references/art-styles/` - 艺术风格（ligne-claire、manga、realistic、ink-brush、chalk、minimalist）
- `references/tones/` - 基调（neutral、warm、dramatic、romantic、energetic、vintage、action）
- `references/presets/` - 预设（含特殊规则：ohmsha、wuxia、shoujo、concept-story、four-panel）
- `references/layouts/` - 布局（standard、cinematic、dense、splash、mixed、webtoon、four-panel）

**工作流**:
- [workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/workflow.md) - 完整工作流详情
- [auto-selection.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/auto-selection.md) - 内容信号分析
- [partial-workflows.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/partial-workflows.md) - 部分工作流选项

## 页面修改

| 操作 | 步骤 |
|------|------|
| **编辑** | **首先更新提示词文件** → 重新生成图片 → 下载新 PNG |
| **添加** | 在指定位置创建提示词 → 嵌入角色描述进行生成 → 重新编号后续页面 → 更新分镜脚本 |
| **删除** | 移除文件 → 重新编号后续页面 → 更新分镜脚本 |

**重要提示**：更新页面时，**务必先**更新提示词文件（`prompts/NN-{cover|page}-[slug].md`），然后再重新生成。这确保了变更被记录且可复现。

## 注意事项

- 图片生成：每页 10-30 秒；失败时自动重试一次
- **务必下载** `image_generate` 返回的 URL 为本地 PNG 文件——下游工具（以及用户的审查）期望文件位于输出目录中，而非临时 URL
- **`curl -o` 使用绝对路径**——不要依赖跨批次的持久 shell 工作目录。隐蔽陷阱：文件会落错目录，随后对目标路径执行 `ls` 会显示为空。参见步骤 7 "下载步骤"
- 对敏感公众人物使用风格化替代形象
- **步骤 2 需要确认** - 不可跳过
- **步骤 4/6 为条件步骤** - 仅在用户于步骤 2 中提出请求时执行
- **步骤 7.1 角色设定表** - 建议用于多页漫画，简单预设为可选。PNG 用于审查/重新生成辅助；页面提示词（在步骤 5 中编写）使用 `characters/characters.md` 中的文字描述，而非 PNG。`image_generate` 不接受图片作为视觉输入
- **去除敏感信息** - 在写入任何输出文件之前，扫描源内容中的 API 密钥、令牌或凭据