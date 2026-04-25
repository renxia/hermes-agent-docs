---
title: "宝玉漫画 — 支持多种艺术风格和色调的知识漫画创作工具"
sidebar_label: "宝玉漫画"
description: "支持多种艺术风格和色调的知识漫画创作工具"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 宝玉漫画

支持多种艺术风格和色调的知识漫画创作工具。可创作原创教育漫画，包含详细的画板布局和连续图像生成。当用户要求创建“知识漫画”、“教育漫画”、“传记漫画”、“教程漫画”或“Logicomix 风格漫画”时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/baoyu-comic` |
| 版本 | `1.56.1` |
| 作者 | 宝玉 (JimLiu) |
| 许可证 | MIT |
| 标签 | `漫画`, `知识漫画`, `创意`, `图像生成` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 知识漫画创作器

改编自 [baoyu-comic](https://github.com/JimLiu/baoyu-skills)，用于 Hermes 智能体的工具生态系统。

创作具有灵活艺术风格 × 色调组合的原创知识漫画。

## 何时使用

当用户要求创建知识/教育类漫画、传记漫画、教程漫画，或使用“知识漫画”、“教育漫画”或“Logicomix 风格”等术语时，触发此技能。用户提供内容（文本、文件路径、URL 或主题），并可选择指定艺术风格、色调、布局、宽高比或语言。

## 参考图像

Hermes 的 `image_generate` 工具**仅接受提示词**——它接受文本提示词和宽高比，并返回图像 URL。它**不接受**参考图像。当用户提供参考图像时，使用它来**提取文本特征**，这些特征将被嵌入到每一页的提示词中：

**输入**：当用户提供文件路径时接受（或在对话中粘贴图像）。
- 文件路径 → 复制到 `refs/NN-ref-{slug}.{ext}`，与漫画输出一起保存，以记录来源
- 粘贴的图像无路径 → 通过 `clarify` 向用户询问路径，或口头提取风格特征作为文本备用方案
- 无参考图像 → 跳过此部分

**使用模式**（每个参考图像）：

| 使用方式 | 效果 |
|----------|------|
| `style` | 提取风格特征（线条处理、纹理、情绪）并附加到每一页提示词正文中 |
| `palette` | 提取十六进制颜色并附加到每一页提示词正文中 |
| `scene` | 提取场景构图或主体注释并附加到相关页面 |

当存在参考图像时，在每一页提示词的前言中记录：

```yaml
references:
  - ref_id: 01
    filename: 01-ref-scene.png
    usage: style
    traits: "muted earth tones, soft-edged ink wash, low-contrast backgrounds"
```

角色一致性由 `characters/characters.md` 中的**文本描述**驱动（在步骤 3 中编写），这些描述会被内联嵌入到每一页提示词中（步骤 5）。在步骤 7.1 中生成的可选 PNG 角色表是一个面向人类的审查工件，而不是 `image_generate` 的输入。

## 选项

### 视觉维度

| 选项 | 值 | 描述 |
|------|-----|------|
| 艺术风格 | ligne-claire（默认）、manga、realistic、ink-brush、chalk、minimalist | 艺术风格 / 渲染技术 |
| 色调 | neutral（默认）、warm、dramatic、romantic、energetic、vintage、action | 情绪 / 氛围 |
| 布局 | standard（默认）、cinematic、dense、splash、mixed、webtoon、four-panel | 分镜排列 |
| 宽高比 | 3:4（默认，竖屏）、4:3（横屏）、16:9（宽屏） | 页面宽高比 |
| 语言 | auto（默认）、zh、en、ja 等 | 输出语言 |
| 参考图像 | 文件路径 | 用于风格/调色板特征提取的参考图像（不传递给图像模型）。参见上文[参考图像](#reference-images)。 |

### 部分工作流选项

| 选项 | 描述 |
|------|------|
| 仅故事板 | 仅生成故事板，跳过提示词和图像 |
| 仅提示词 | 生成故事板 + 提示词，跳过图像 |
| 仅图像 | 从现有提示词目录生成图像 |
| 重新生成 N | 仅重新生成特定页面（例如 `3` 或 `2,5,8`） |

详细信息：[references/partial-workflows.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/partial-workflows.md)

### 艺术风格、色调与预设目录

- **艺术风格**（6 种）：`ligne-claire`、`manga`、`realistic`、`ink-brush`、`chalk`、`minimalist`。完整定义见 `references/art-styles/<style>.md`。
- **色调**（7 种）：`neutral`、`warm`、`dramatic`、`romantic`、`energetic`、`vintage`、`action`。完整定义见 `references/tones/<tone>.md`。
- **预设**（5 种），具有超出普通艺术风格+色调的特殊规则：

  | 预设 | 等效组合 | 特点 |
  |------|----------|------|
  | `ohmsha` | manga + neutral | 视觉隐喻，无对话头像， gadget 揭示 |
  | `wuxia` | ink-brush + action | 气效果，战斗视觉，氛围感 |
  | `shoujo` | manga + romantic | 装饰元素，眼部细节，浪漫节拍 |
  | `concept-story` | manga + warm | 视觉符号系统，成长弧线，对话+动作平衡 |
  | `four-panel` | minimalist + neutral + four-panel 布局 | 起承转合结构，黑白+重点色，简笔画角色 |

  完整规则见 `references/presets/<preset>.md` —— 选择预设时加载该文件。

- **兼容性矩阵**和**内容信号 → 预设**表位于 [references/auto-selection.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/auto-selection.md)。在步骤 2 中推荐组合之前请阅读它。

## 文件结构

输出目录：`comic/{topic-slug}/`
- Slug：主题的 2-4 个单词的 kebab-case 格式（例如 `alan-turing-bio`）
- 冲突：附加时间戳（例如 `turing-story-20260118-143052`）

**内容**：
| 文件 | 描述 |
|------|------|
| `source-{slug}.md` | 保存的源内容（kebab-case slug 与输出目录匹配） |
| `analysis.md` | 内容分析 |
| `storyboard.md` | 分镜故事板 |
| `characters/characters.md` | 角色定义 |
| `characters/characters.png` | 角色参考表（从 `image_generate` 下载） |
| `prompts/NN-{cover\|page}-[slug].md` | 生成提示词 |
| `NN-{cover\|page}-[slug].png` | 生成的图像（从 `image_generate` 下载） |
| `refs/NN-ref-{slug}.{ext}` | 用户提供的参考图像（可选，用于溯源） |

## 语言处理

**检测优先级**：
1. 用户指定的语言（显式选项）
2. 用户的对话语言
3. 源内容语言

**规则**：所有交互均使用用户的输入语言：
- 故事板大纲和场景描述
- 图像生成提示词
- 用户选择选项和确认
- 进度更新、问题、错误、摘要

技术术语保留英文。

## 工作流

### 进度清单

```
漫画进度：
- [ ] 步骤 1：设置与分析
  - [ ] 1.1 分析内容
  - [ ] 1.2 检查现有目录
- [ ] 步骤 2：确认 - 风格与选项 ⚠️ 必需
- [ ] 步骤 3：生成故事板 + 角色
- [ ] 步骤 4：审查大纲（条件性）
- [ ] 步骤 5：生成提示词
- [ ] 步骤 6：审查提示词（条件性）
- [ ] 步骤 7：生成图像
  - [ ] 7.1 生成角色表（如果需要）→ characters/characters.png
  - [ ] 7.2 生成页面（在提示词中嵌入角色描述）
- [ ] 步骤 8：完成报告
```

### 流程

```
输入 → 分析 → [检查现有？] → [确认：风格 + 审查] → 故事板 → [审查？] → 提示词 → [审查？] → 图像 → 完成
```

### 步骤摘要

| 步骤 | 操作 | 关键输出 |
|------|------|----------|
| 1.1 | 分析内容 | `analysis.md`、`source-{slug}.md` |
| 1.2 | 检查现有目录 | 处理冲突 |
| 2 | 确认风格、焦点、受众、审查 | 用户偏好 |
| 3 | 生成故事板 + 角色 | `storyboard.md`、`characters/` |
| 4 | 审查大纲（如果请求） | 用户批准 |
| 5 | 生成提示词 | `prompts/*.md` |
| 6 | 审查提示词（如果请求） | 用户批准 |
| 7.1 | 生成角色表（如果需要） | `characters/characters.png` |
| 7.2 | 生成页面 | `*.png` 文件 |
| 8 | 完成报告 | 摘要 |

### 用户问题

使用 `clarify` 工具确认选项。由于 `clarify` 一次只能处理一个问题，请先询问最重要的问题，然后按顺序进行。完整步骤 2 问题集见 [references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/workflow.md)。

**超时处理（关键）**：`clarify` 可能返回 `"The user did not provide a response within the time limit. Use your best judgement to make the choice and proceed."` —— 这**不是**用户同意使用所有默认值。

- 将其视为**仅针对该问题**的默认值。继续按顺序询问剩余的步骤 2 问题；每个问题都是一个独立的同意点。
- **在您的下一条消息中向用户明确显示默认值**，以便他们有机会更正：例如 `"风格：默认为 ohmsha 预设（clarify 超时）。说出单词以切换。"` —— 未报告的默认值与从未询问过无法区分。
- 不要在一次超时后将步骤 2 合并为单个“使用所有默认值”过程。如果用户确实不在，他们将对所有五个问题同样不在 —— 但他们可以在返回时更正可见的默认值，而无法更正不可见的默认值。

### 步骤 7：图像生成

使用 Hermes 内置的 `image_generate` 工具进行所有图像渲染。其 schema 仅接受 `prompt` 和 `aspect_ratio`（`landscape` | `portrait` | `square`）；它**返回一个 URL**，而不是本地文件。因此，每个生成的页面或角色表都必须下载到输出目录。

**提示词文件要求（硬性）**：在调用 `image_generate` **之前**，将每个图像的完整最终提示词写入 `prompts/` 下的独立文件（命名：`NN-{type}-[slug].md`）。提示词文件是可重现性记录。

**宽高比映射** —— 故事板的 `aspect_ratio` 字段映射到 `image_generate` 的格式如下：

| 故事板比例 | `image_generate` 格式 |
|------------|---------------------|
| `3:4`、`9:16`、`2:3` | `portrait` |
| `4:3`、`16:9`、`3:2` | `landscape` |
| `1:1` | `square` |

**下载步骤** —— 每次 `image_generate` 调用后：
1. 从工具结果中读取 URL
2. 使用**绝对**输出路径获取图像字节，例如
   `curl -fsSL "<url>" -o /abs/path/to/comic/<slug>/NN-page-<slug>.png`
3. 在继续下一页之前，验证文件是否存在于该确切路径且非空

**切勿依赖 shell 当前工作目录（CWD）持久性来设置 `-o` 路径。** 终端工具的持久 shell CWD 可能在批次之间发生变化（会话过期、`TERMINAL_LIFETIME_SECONDS`、失败的 `cd` 导致您处于错误目录）。`curl -o relative/path.png` 是一个无声的陷阱：如果 CWD 已漂移，文件将落在其他地方且无错误。**始终将完全限定的绝对路径传递给 `-o`**，或将 `workdir=<abs path>` 传递给终端工具。2026 年 4 月事件：一本 10 页漫画的第 06-09 页落在了仓库根目录而不是 `comic/<slug>/`，因为批次 3 继承了批次 2 的陈旧 CWD，而 `curl -o 06-page-skills.png` 写入了错误目录。随后智能体花费了几个回合声称文件存在于它们不存在的地方。

**7.1 角色表** —— 当漫画为多页且包含重复角色时生成（到 `characters/characters.png`，宽高比为 `landscape`）。对于简单预设（例如四格极简主义）或单页漫画则跳过。在调用 `image_generate` 之前，`characters/characters.md` 中的提示词文件必须存在。渲染的 PNG 是一个**面向人类的审查工件**（以便用户可以视觉验证角色设计），也是后续重新生成或手动编辑提示词的参考 —— 它**不**驱动步骤 7.2。页面提示词在步骤 5 中已从 `characters/characters.md` 的**文本描述**编写完成；`image_generate` 无法接受图像作为视觉输入。

**7.2 页面** —— 在调用 `image_generate` 之前，每个页面的提示词必须已位于 `prompts/NN-{cover|page}-[slug].md`。由于 `image_generate` 仅接受提示词，角色一致性通过在步骤 5 中将**角色描述（源自 `characters/characters.md`）内联嵌入到每个页面提示词中**来强制实现。无论是否在 7.1 中生成 PNG 表，嵌入都是统一完成的；PNG 仅作为审查/重新生成辅助工具。

**备份规则**：现有的 `prompts/…md` 和 `…png` 文件 → 在重新生成之前重命名为 `-backup-YYYYMMDD-HHMMSS` 后缀。

完整的分步工作流（分析、故事板、审查门、重新生成变体）：[references/workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/workflow.md)。

## 参考资料

**核心模板**：
- [analysis-framework.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/analysis-framework.md) - 深度内容分析
- [character-template.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/character-template.md) - 角色定义格式
- [storyboard-template.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/storyboard-template.md) - 分镜结构
- [ohmsha-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/ohmsha-guide.md) - 欧姆社漫画规范

**风格定义**：
- `references/art-styles/` - 艺术风格（清晰线描、漫画、写实、水墨、粉笔、极简）
- `references/tones/` - 色调（中性、温暖、戏剧性、浪漫、活力、复古、动作）
- `references/presets/` - 特殊规则预设（欧姆社、武侠、少女、概念故事、四格）
- `references/layouts/` - 布局（标准、电影感、密集、跨页、混合、条漫、四格）

**工作流程**：
- [workflow.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/workflow.md) - 完整工作流程详情
- [auto-selection.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/auto-selection.md) - 内容信号分析
- [partial-workflows.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/creative/baoyu-comic/references/partial-workflows.md) - 部分工作流程选项

## 页面修改

| 操作 | 步骤 |
|--------|-------|
| **编辑** | **首先更新提示文件** → 重新生成图像 → 下载新PNG |
| **添加** | 在指定位置创建提示 → 嵌入角色描述进行生成 → 重新编号后续页面 → 更新分镜 |
| **删除** | 删除文件 → 重新编号后续页面 → 更新分镜 |

**重要**：更新页面时，务必在重新生成前**首先更新提示文件**（`prompts/NN-{cover|page}-[slug].md`）。这能确保更改被记录且可重现。

## 注意事项

- 图像生成：每页耗时10-30秒；失败时自动重试一次
- **始终将 `image_generate` 返回的URL下载到本地PNG文件** —— 下游工具（及用户审查）需要输出目录中的文件，而非临时URL
- **对 `curl -o` 使用绝对路径** —— 切勿依赖跨批次的持久Shell工作目录。隐蔽陷阱：文件会落入错误目录，导致后续对目标路径的 `ls` 命令显示为空。参见步骤7“下载步骤”。
- 对敏感公众人物使用风格化替代方案
- **需要步骤2确认** —— 不可跳过
- **步骤4/6为条件执行** —— 仅在步骤2中用户要求时执行
- **步骤7.1角色表** —— 推荐用于多页漫画，简单预设下可选。PNG仅用于审查和重新生成；页面提示（步骤5中编写）使用 `characters/characters.md` 中的文本描述，而非PNG。`image_generate` 不接受图像作为视觉输入
- **清除敏感信息** —— 在写入任何输出文件前，扫描源内容中的API密钥、令牌或凭据