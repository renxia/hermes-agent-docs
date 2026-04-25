---
title: "表情包生成 — 通过选择模板并使用 Pillow 叠加文本来生成真实的表情包图片"
sidebar_label: "表情包生成"
description: "通过选择模板并使用 Pillow 叠加文本来生成真实的表情包图片"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 表情包生成

通过选择模板并使用 Pillow 叠加文本，生成真实的表情包图片。输出实际的表情包 .png 文件。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/creative/meme-generation` 安装 |
| 路径 | `optional-skills/creative/meme-generation` |
| 版本 | `2.0.0` |
| 作者 | adanaleycio |
| 许可证 | MIT |
| 标签 | `creative`, `memes`, `humor`, `images` |
| 相关技能 | [`ascii-art`](/docs/user-guide/skills/bundled/creative/creative-ascii-art), `generative-widgets` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 表情包生成

根据某个主题生成实际的表情包图片。选择一个模板，编写标题文字，并渲染一个带有文本叠加的真实 .png 文件。

## 何时使用

- 用户要求你制作或生成一个表情包
- 用户想要一个关于特定主题、情境或挫折的表情包
- 用户说“把这个做成表情包”或类似的话

## 可用模板

该脚本支持 **约 100 个流行的 imgflip 模板**（通过名称或 ID），以及 10 个经过精心挑选的模板，这些模板具有手动优化的文本定位。

### 精选模板（自定义文本位置）

| ID | 名称 | 字段 | 最适合 |
|----|------|--------|----------|
| `this-is-fine` | 这很好 | top, bottom | 混乱、否认 |
| `drake` | Drake Hotline Bling | reject, approve | 拒绝/偏好 |
| `distracted-boyfriend` | 分心的男友 | distraction, current, person | 诱惑、优先级转移 |
| `two-buttons` | 两个按钮 | left, right, person | 无法选择 |
| `expanding-brain` | 扩展的大脑 | 4 levels | 逐步升级的讽刺 |
| `change-my-mind` | 改变我的想法 | statement | 热门观点 |
| `woman-yelling-at-cat` | 女人对猫大喊 | woman, cat | 争论 |
| `one-does-not-simply` | 一个人不能简单地 | top, bottom | 看似简单实则困难的事情 |
| `grus-plan` | Gru 的计划 | step1-3, realization | 适得其反的计划 |
| `batman-slapping-robin` | 蝙蝠侠扇罗宾耳光 | robin, batman | 压制糟糕的想法 |

### 动态模板（来自 imgflip API）

任何不在精选列表中的模板都可以通过名称或 imgflip ID 使用。这些模板会获得智能的默认文本定位（两个字段的模板为顶部/底部，三个或更多字段的模板为均匀分布）。搜索方式：
```bash
python "$SKILL_DIR/scripts/generate_meme.py" --search "disaster"
```

## 流程

### 模式 1：经典模板（默认）

1. 读取用户的主题并识别核心动态（混乱、困境、偏好、讽刺等）
2. 选择最匹配的模板。使用“最适合”列，或使用 `--search` 进行搜索。
3. 为每个字段编写简短的标题文字（每个字段最多 8-12 个单词，越短越好）。
4. 找到技能的脚本目录：
   ```
   SKILL_DIR=$(dirname "$(find ~/.hermes/skills -path '*/meme-generation/SKILL.md' 2>/dev/null | head -1)")
   ```
5. 运行生成器：
   ```bash
   python "$SKILL_DIR/scripts/generate_meme.py" <template_id> /tmp/meme.png "caption 1" "caption 2" ...
   ```
6. 使用 `MEDIA:/tmp/meme.png` 返回图片

### 模式 2：自定义 AI 图片（当 image_generate 可用时）

当没有合适的经典模板，或用户想要原创内容时使用此模式。

1. 首先编写标题文字。
2. 使用 `image_generate` 创建一个符合表情包概念的场景。**不要在图片提示中包含任何文本** — 文本将由脚本添加。仅描述视觉场景。
3. 从 `image_generate` 结果 URL 中找到生成的图片路径。如果需要，请将其下载到本地路径。
4. 使用 `--image` 运行脚本以叠加文本，选择一种模式：
   - **叠加**（文本直接叠加在图片上，白色带黑色轮廓）：
     ```bash
     python "$SKILL_DIR/scripts/generate_meme.py" --image /path/to/scene.png /tmp/meme.png "top text" "bottom text"
     ```
   - **黑条**（图片上方/下方添加黑色条，白色文本 — 更清晰，始终可读）：
     ```bash
     python "$SKILL_DIR/scripts/generate_meme.py" --image /path/to/scene.png --bars /tmp/meme.png "top text" "bottom text"
     ```
   当图片内容复杂/详细，文本直接叠加难以阅读时，请使用 `--bars`。
5. **使用视觉分析验证**（如果 `vision_analyze` 可用）：检查结果是否良好：
   ```
   vision_analyze(image_url="/tmp/meme.png", question="文本是否清晰可读且位置合适？表情包在视觉上是否有效？")
   ```
   如果视觉模型标记出问题（文本难以阅读、位置不佳等），请尝试另一种模式（在叠加和黑条之间切换）或重新生成场景。
6. 使用 `MEDIA:/tmp/meme.png` 返回图片

## 示例

**"凌晨 2 点调试生产环境":**
```bash
python generate_meme.py this-is-fine /tmp/meme.png "服务器着火了" "这很好"
```

**"在睡觉和再看一集之间选择":**
```bash
python generate_meme.py drake /tmp/meme.png "睡 8 个小时" "凌晨 3 点再看一集"
```

**"周一早晨的几个阶段":**
```bash
python generate_meme.py expanding-brain /tmp/meme.png "设一个闹钟" "设 5 个闹钟" "睡过所有闹钟" "在床上工作"
```

## 列出模板

要查看所有可用模板：
```bash
python generate_meme.py --list
```

## 陷阱

- 保持标题文字**简短**。带有长文本的表情包看起来很糟糕。
- 将文本参数的数量与模板的字段数匹配。
- 选择符合笑话结构的模板，而不仅仅是主题。
- 不要生成仇恨、辱骂或针对个人的内容。
- 脚本在首次下载后会将模板图片缓存在 `scripts/.cache/` 中。

## 验证

如果满足以下条件，则输出是正确的：
- 在输出路径创建了一个 .png 文件
- 模板上的文本清晰可读（白色带黑色轮廓）
- 笑话成立 — 标题文字符合模板的预期结构
- 文件可以通过 MEDIA: 路径传递