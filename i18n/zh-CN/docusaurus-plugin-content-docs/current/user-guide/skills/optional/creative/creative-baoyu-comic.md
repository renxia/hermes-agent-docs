---
title: "Baoyu Comic — Knowledge comics (知识漫画): educational, biography, tutorial"
sidebar_label: 宝玉漫画
description: "Knowledge comics (知识漫画): educational, biography, tutorial"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 宝玉漫画

知识漫画：教育、传记、教程。

## 技能元数据 (Skill metadata)

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/creative/baoyu-comic` 进行安装 |
| Path | `optional-skills/creative/baoyu-comic` |
| Version | `1.56.1` |
| Author | 宝玉 (JimLiu) |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `comic`, `knowledge-comic`, `creative`, `image-generation` |

## 关键路径和配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥和秘密信息（如果设置了$HERMES_HOME）
$HERMES_HOME
```

# 知识漫画创建器 (Knowledge Comic Creator)

改编自 [baoyu-comic](https://github.com/JimLiu/baoyu-skills)，用于 Hermes 智能体工具生态系统。

通过灵活的艺术风格 × 语调组合，创建原创知识漫画。

## 何时使用

当用户要求创建知识/教育漫画、人物传记漫画、教程漫画，或使用了“知识漫画”、“教育漫画”或“Logicomix风格”等术语时，触发此技能。用户提供内容（文本、文件路径、URL或主题），并可选择性地指定艺术风格、语调、布局、宽高比或语言。

## 参考图像 (Reference Images)

Hermes 的 `image_generate` 工具是**仅限提示词**的——它接受一个文本提示和宽高比，然后返回一个图像 URL。它**不**接受参考图像。当用户提供参考图像时，请使用它们来**提取文本中的特征**，这些特征将被嵌入到每一页的提示词中：

**输入 (Intake)**：接收用户提供的文件路径（或在对话中粘贴图像）。
- 文件路径(s) → 复制到 `refs/NN-ref-{slug}.{ext}`，与漫画输出一起保存以供溯源。
- 无路径的粘贴图像 → 通过 `clarify` 要求用户提供路径，或将其作为文本备选方案口头提取风格特征。
- 没有参考资料 → 跳过此部分

**使用模式 (Usage modes)**（每个参考文件）：

| 用法 | 效果 |
|-------|--------|
| `style` | 提取风格特征（线条处理、纹理、情绪）并附加到每一页的提示词中。 |
| `palette` | 提取十六进制颜色代码并附加到每一页的提示词中。 |
| `scene` | 提取场景构图或主题笔记并附加到相关的页面(s)。 |

**在每个页面的提示词前置信息 (frontmatter) 中记录参考资料**（如果存在）：

```yaml
references:
  - ref_id: 01
    filename: 01-ref-scene.png
    usage: style
    traits: "muted earth tones, soft-edged ink wash, low-contrast backgrounds"
```

角色一致性由 `characters/characters.md`（在第3步中编写）中的**文本描述**驱动，这些描述会被嵌入到每一页的提示词中（第5步）。第7.1步生成的可选 PNG 角色表是供人类审查的产物，而不是 `image_generate` 的输入。

## 选项 (Options)

### 可视尺寸 (Visual Dimensions)

| 选项 | 值 | 描述 |
|--------|--------|-------------|
| Art | ligne-claire (默认), manga, realistic, ink-brush, chalk, minimalist | 艺术风格 / 渲染技术 |
| Tone | neutral (默认), warm, dramatic, romantic, energetic, vintage, action | 心情 / 氛围 |
| Layout | standard (默认), cinematic, dense, splash, mixed, webtoon, four-panel | 面板排列 |
| Aspect | 3:4 (默认，肖像), 4:3 (风景), 16:9 (宽屏) | 页面宽高比 |
| Language | auto (默认), zh, en, ja 等 | 输出语言 |
| Refs | 文件路径 | 用于风格/调色板特征提取的参考图像（不会传递给图像模型）。参见上方的[参考图像](#reference-images)。 |

### 部分工作流程选项 (Partial Workflow Options)

| 选项 | 描述 |
|--------|-------------|
| Storyboard only | 只生成故事板，跳过提示词和图像。 |
| Prompts only | 生成故事板 + 提示词，跳过图像。 |
| Images only | 从现有提示词目录生成图像。 |
| Regenerate N | 只重新生成特定页面（例如 `3` 或 `2,5,8`）。 |

详情：[references/partial-workflows.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-comic/references/partial-workflows.md)

### 艺术风格、语调和预设目录 (Art, Tone & Preset Catalogue)

- **艺术风格** (6)：`ligne-claire`, `manga`, `realistic`, `ink-brush`, `chalk`, `minimalist`。完整定义在 `references/art-styles/<style>.md` 中。
- **语调** (7)：`neutral`, `warm`, `dramatic`, `romantic`, `energetic`, `vintage`, `action`。完整定义在 `references/tones/<tone>.md` 中。
- **预设** (5)，具有超越普通艺术+语调的特殊规则：

  | 预设 | 等效项 | 钩子 (Hook) |
  |--------|-----------|------|
  | `ohmsha` | manga + neutral | 视觉隐喻，无说话头像，小工具展示 |
  | `wuxia` | ink-brush + action | 气效果，战斗视觉，氛围感 |
  | `shoujo` | manga + romantic | 装饰元素，眼睛细节，浪漫时刻 |
  | `concept-story` | manga + warm | 视觉符号系统，成长弧线，对话+行动平衡 |
  | `four-panel` | minimalist + neutral + four-panel layout | 起承转合结构，黑白+局部色，木偶式角色 |

  完整规则在 `references/presets/<preset>.md` 中——当选择预设时，加载该文件。

- **兼容性矩阵**和**内容信号 → 预设**表位于 [references/auto-selection.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-comic/references/auto-selection.md)。在第2步推荐组合之前阅读它。

## 文件结构 (File Structure)

输出目录：`comic/{topic-slug}/`
- Slug：从主题（例如 `alan-turing-bio`）提取的 2-4 个单词 kebab-case 名称。
- 冲突解决：附加时间戳（例如 `turing-story-20260118-143052`）。

**内容**:
| 文件 | 描述 |
|------|-------------|
| `source-{slug}.md` | 已保存的源内容（kebab-case slug 与输出目录匹配） |
| `analysis.md` | 内容分析 |
| `storyboard.md` | 包含面板分解的故事板 |
| `characters/characters.md` | 角色定义 |
| `characters/characters.png` | 角色参考表（从 `image_generate` 下载） |
| `prompts/NN-{cover\|page}-[slug].md` | 生成提示词 |
| `NN-{cover\|page}-[slug].png` | 生成的图像（从 `image_generate` 下载） |
| `refs/NN-ref-{slug}.{ext}` | 用户提供的参考图像（可选，用于溯源） |

## 语言处理 (Language Handling)

**检测优先级**:
1. 用户指定的语言（显式选项）
2. 用户的对话语言
3. 源内容语言

**规则**: 所有交互都使用用户的输入语言：
- 故事板大纲和场景描述
- 图像生成提示词
- 用户选择选项和确认
- 进度更新、问题、错误、摘要

技术术语保持英文。

## 工作流程 (Workflow)

### 进度清单 (Progress Checklist)

```
漫画进度:
- [ ] 第1步：设置与分析
  - [ ] 1.1 分析内容
  - [ ] 1.2 检查现有目录
- [ ] 第2步：确认——风格和选项 ⚠️ 必需
- [ ] 第3步：生成故事板 + 角色
- [ ] 第4步：审查大纲（有条件）
- [ ] 第5步：生成提示词
- [ ] 第6步：审查提示词（有条件）
- [ ] 第7步：生成图像
  - [ ] 7.1 生成角色表（如果需要）→ characters/characters.png
  - [ ] 7.2 生成页面（在提示词中嵌入角色描述）
- [ ] 第8步：完成报告
```

### 流程 (Flow)

```
输入 → 分析 → [检查现有?] → [确认：风格 + 审查] → 故事板 → [审查?] → 提示词 → [审查?] → 图像 → 完成
```

### 步骤摘要 (Step Summary)

| 步骤 | 操作 | 关键输出 |
|------|--------|------------|
| 1.1 | 分析内容 | `analysis.md`, `source-{slug}.md` |
| 1.2 | 检查现有目录 | 处理冲突 |
| 2 | 确认风格、焦点、受众、审查 | 用户偏好设置 |
| 3 | 生成故事板 + 角色 | `storyboard.md`, `characters/` |
| 4 | 审查大纲（如果要求） | 用户批准 |
| 5 | 生成提示词 | `prompts/*.md` |
| 6 | 审查提示词（如果要求） | 用户批准 |
| 7.1 | 生成角色表（如果需要） | `characters/characters.png` |
| 7.2 | 生成页面 | `*.png` 文件 |
| 8 | 完成报告 | 摘要 |

### 用户问题 (User Questions)

使用 `clarify` 工具来确认选项。由于 `clarify` 一次只处理一个问题，请先提出最重要的一个问题并按顺序进行。有关完整的第2步问题集，请参阅 [references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-comic/references/workflow.md)。

**超时处理（关键）**: `clarify` 可能会返回“用户未在规定时间内提供回复。请您尽力而为做出选择并继续。”——这**不代表**用户同意默认所有选项。

- 将其视为**仅针对该一个问题的默认值**。继续按顺序提出剩余的第2步问题；每个问题都是一个独立的同意点。
- **在下一次消息中向用户可见地展示默认值**，以便他们有机会进行更正：例如，“风格：已默认为 ohmsha 预设（clarify 超时）。请说出关键词以切换。”——未报告的默认值与从未询问过是无法区分的。
- 不要将第2步合并为一次“使用所有默认值”的流程。如果用户确实缺席，他们对所有五个问题都将是缺席状态——但当他们回来时，他们可以更正可见的默认值，而不能更正不可见的默认值。

### 第7步：图像生成 (Step 7: Image Generation)

使用 Hermes 内置的 `image_generate` 工具进行所有图像渲染。其模式只接受 `prompt` 和 `aspect_ratio`（`landscape` | `portrait` | `square`）；它**返回一个 URL**，而不是本地文件。因此，每一张生成的页面或角色表都必须下载到输出目录中。

**提示词文件要求（强制）**: 在调用 `image_generate` **之前**，必须将每张图像的完整、最终提示词写入 `prompts/` 下的一个独立文件（命名：`NN-{type}-[slug].md`）。提示词文件是可重现性的记录。

**宽高比映射** — 故事板中的 `aspect_ratio` 字段映射到 `image_generate` 的格式如下：

| 故事板比例 | `image_generate` 格式 |
|------------------|-------------------------|
| `3:4`, `9:16`, `2:3` | `portrait` |
| `4:3`, `16:9`, `3:2` | `landscape` |
| `1:1` | `square` |

**下载步骤** — 每次调用 `image_generate` 后：
1. 从工具结果中读取 URL。
2. 使用一个**绝对**输出路径，例如：
   `curl -fsSL "<url>" -o /abs/path/to/comic/<slug>/NN-page-<slug>.png`
3. 在继续处理下一页之前，验证文件是否存在且非空。

**切勿依赖 Shell CWD（当前工作目录）的持久性来使用 `-o` 路径。** 终端工具的持久化 Shell CWD 可能会在批次之间发生变化（会话过期、`TERMINAL_LIFETIME_SECONDS`、一个失败的 `cd` 命令导致您身处错误目录）。`curl -o relative/path.png` 是一个沉默的陷阱：如果 CWD 发生了漂移，文件就会落在别处而不会报错。**务必向 `-o` 提供一个完全限定的绝对路径**，或者向终端工具传递 `workdir=<abs path>`。2026年4月事件：一部10页漫画的第06-09页被放置在了仓库根目录而不是 `comic/<slug>/` 下，因为第三个批次继承了第二个批次的陈旧 CWD，而 `curl -o 06-page-skills.png` 将文件写入了错误的目录。随后智能体花费了好几轮时间声称文件存在于它实际不存在的地方。

**7.1 角色表** — 当漫画有多页且包含重复角色时，生成它（保存到 `characters/characters.png`，宽高比 `landscape`）。对于简单的预设（例如四格极简）或单页漫画，则跳过。`characters/characters.md` 中的提示词文件必须在调用 `image_generate` 之前存在。渲染的 PNG 是一个**供人类审查的产物**（以便用户可以视觉上验证角色设计），也是后续重新生成或手动编辑提示词的参考——它**不驱动**第7.2步。页面提示词是在第5步从 `characters/characters.md` 中的**文本描述**中编写的；`image_generate` 无法接受图像作为视觉输入。

**7.2 页面** — 在调用 `image_generate` **之前**，每一页的提示词必须存在于 `prompts/NN-{cover|page}-[slug].md` 中。由于 `image_generate` 是仅限提示词的，角色一致性是通过**在第5步中将角色描述（源自 `characters/characters.md`）嵌入到每一页提示词中**来强制执行的。无论是否生成 7.1 中的 PNG 表，嵌入过程都是统一的；PNG 只是一种审查/重新生成辅助工具。

**备份规则**: 现有 `prompts/…md` 和 `…png` 文件 → 在重新生成之前，重命名并添加 `-backup-YYYYMMDD-HHMMSS` 后缀。

完整的逐步工作流程（分析、故事板、审查门控、再生变体）：[references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-comic/references/workflow.md)。

## References

**Core Templates**:
- [analysis-framework.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-comic/references/analysis-framework.md) - 深度内容分析
- [character-template.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-comic/references/character-template.md) - 角色定义格式
- [storyboard-template.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-comic/references/storyboard-template.md) - 故事板结构
- [ohmsha-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-comic/references/ohmsha-guide.md) - Ohmsha漫画特定要求

**Style Definitions**:
- `references/art-styles/` - 艺术风格（ligne-claire, manga, realistic, ink-brush, chalk, minimalist）
- `references/tones/` - 色调（neutral, warm, dramatic, romantic, energetic, vintage, action）
- `references/presets/` - 包含特殊规则的预设（ohmsha, wuxia, shoujo, concept-story, four-panel）
- `references/layouts/` - 版面布局（standard, cinematic, dense, splash, mixed, webtoon, four-panel）

**Workflow**:
- [workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-comic/references/workflow.md) - 完整工作流程详情
- [auto-selection.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-comic/references/auto-selection.md) - 内容信号分析
- [partial-workflows.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/baoyu-comic/references/partial-workflows.md) - 部分工作流程选项

## Page Modification

| Action | Steps |
|--------|-------|
| **Edit** | **首先更新提示文件** → 重新生成图像 → 下载新的PNG |
| **Add** | 在指定位置创建提示 → 嵌入角色描述后生成 → 重新编号后续页面 → 更新故事板 |
| **Delete** | 删除文件 → 重新编号后续页面 → 更新故事板 |

**重要事项**: 在更新页面时，务必**首先**更新提示文件（`prompts/NN-{cover|page}-[slug].md`），然后再进行图像生成。这可以确保更改被记录下来并且是可复现的。

## Pitfalls

- 图像生成：每页需要10-30秒；失败时自动重试一次
- **务必下载** `image_generate` 返回的URL到本地PNG文件——下游工具（以及用户的审查）需要输出目录中的文件，而不是临时的URL
- **使用绝对路径进行 `curl -o`** ——切勿依赖跨批次的持久Shell当前工作目录。隐患：文件被放置在了错误的目录中，而对预期路径的后续 `ls` 命令显示为空。请参考第7步“下载步骤”。
- 为敏感公众人物使用风格化的替代品
- **需要进行第2步确认** - 切勿跳过
- **第4/6步为条件性操作** - 仅当用户在第2步中要求时才执行
- **第7.1步角色表** - 推荐用于多页漫画，对于简单的预设是可选的。PNG文件是一个审查/重新生成辅助工具；页面提示（在第5步中编写）使用的是`characters/characters.md`中的文本描述，而不是PNG。`image_generate` 不接受图像作为视觉输入
- **清除秘密信息** — 在写入任何输出文件之前，扫描源内容以查找API密钥、令牌或凭证