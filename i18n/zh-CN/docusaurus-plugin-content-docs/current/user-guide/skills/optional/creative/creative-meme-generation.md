---
title: "Meme 生成 — 通过选择模板并使用 Pillow 叠加文本生成真正的 Meme 图片"
sidebar_label: "Meme 生成"
description: "通过选择模板并使用 Pillow 叠加文本生成真正的 Meme 图片"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Meme 生成

通过选择模板并使用 Pillow 叠加文本生成真正的 Meme 图片。生成实际的 .png 格式 Meme 文件。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/creative/meme-generation` 安装 |
| 路径 | `optional-skills/creative/meme-generation` |
| 版本 | `2.0.0` |
| 作者 | adanaleycio |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `creative`, `memes`, `humor`, `images` |
| 相关技能 | [`ascii-art`](/user-guide/skills/bundled/creative/creative-ascii-art), `generative-widgets` |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这就是智能体在技能激活时看到的指令。
:::

# Meme 生成

根据主题生成实际的 Meme 图片。选择一个模板，编写字幕，并渲染带有文本叠加的真实 .png 文件。

## 使用场景

- 用户要求你制作或生成一个 Meme
- 用户想要一个关于特定主题、情况或烦恼的 Meme
- 用户说“做个 Meme”或类似的话

## 可用模板

该脚本支持通过名称或 ID 使用**任何约 100 个流行的 imgflip 模板**，外加 10 个经过精心调整文本定位的策划模板。

### 策划模板（自定义文本位置）

| ID | 名称 | 字段 | 最适用于 |
|----|------|--------|----------|
| `this-is-fine` | This is Fine | 顶部, 底部 | 混乱, 否认 |
| `drake` | Drake Hotline Bling | 拒绝, 赞同 | 拒绝/偏爱 |
| `distracted-boyfriend` | 分心的男友 | 分心对象, 当前, 他人 | 诱惑, 优先级转移 |
| `two-buttons` | 两个按钮 | 左, 右, 人物 | 难以抉择 |
| `expanding-brain` | 膨胀的大脑 | 4 个层级 | 逐步升级的反讽 |
| `change-my-mind` | 改变我的想法 | 观点 | 热门观点 |
| `woman-yelling-at-cat` | 女人对猫喊叫 | 女人, 猫 | 争论 |
| `one-does-not-simply` | 人不能简单地 | 顶部, 底部 | 表面简单实则困难的事 |
| `grus-plan` | 格鲁的计划 | 步骤1-3, 意识到 | 适得其反的计划 |
| `batman-slapping-robin` | 蝙蝠侠打罗宾 | 罗宾, 蝙蝠侠 | 驳回坏主意 |

### 动态模板（来自 imgflip API）

任何不在策划列表中的模板都可以通过名称或 imgflip ID 使用。这些模板会智能设置默认的文本定位（2 个字段为上/下，3 个或更多字段则均匀分布）。使用以下命令搜索：
```bash
python "$SKILL_DIR/scripts/generate_meme.py" --search "disaster"
```

## 流程

### 模式 1：经典模板（默认）

1. 读取用户的主题，识别核心动态（混乱、困境、偏好、反讽等）。
2. 选择最匹配的模板。使用“最适用于”列，或使用 `--search` 搜索。
3. 为每个字段编写简短的字幕（每个字段最多 8-12 个词，越短越好）。
4. 查找技能的脚本目录：
   ```
   SKILL_DIR=$(dirname "$(find ~/.hermes/skills -path '*/meme-generation/SKILL.md' 2>/dev/null | head -1)")
   ```
5. 运行生成器：
   ```bash
   python "$SKILL_DIR/scripts/generate_meme.py" <template_id> /tmp/meme.png "caption 1" "caption 2" ...
   ```
6. 使用 `MEDIA:/tmp/meme.png` 返回图片。

### 模式 2：自定义 AI 图片（当 `image_generate` 可用时）

当没有合适的经典模板，或者用户想要原创内容时使用此模式。

1. 首先编写字幕。
2. 使用 `image_generate` 创建与 Meme 概念匹配的场景。**不要**在图像提示中包含任何文本——文本将由脚本添加。只描述视觉场景。
3. 从 `image_generate` 结果 URL 中找到生成的图像路径。如有需要，将其下载到本地路径。
4. 运行脚本并使用 `--image` 叠加文本，选择一种模式：
   - **叠加模式**（文本直接叠加在图像上，白字黑边）：
     ```bash
     python "$SKILL_DIR/scripts/generate_meme.py" --image /path/to/scene.png /tmp/meme.png "顶部文本" "底部文本"
     ```
   - **条形模式**（图像上下方的黑色条带，白字——更清晰，始终易读）：
     ```bash
     python "$SKILL_DIR/scripts/generate_meme.py" --image /path/to/scene.png --bars /tmp/meme.png "顶部文本" "底部文本"
     ```
     当图像内容繁杂/细节丰富，文本直接叠加在其上难以阅读时，使用 `--bars`。
5. **使用视觉功能验证**（如果 `vision_analyze` 可用）：检查结果是否良好：
   ```
   vision_analyze(image_url="/tmp/meme.png", question="文本是否清晰可读且位置合适？Meme 在视觉上是否成立？")
   ```
   如果视觉模型标记了问题（文本难以阅读、位置不佳等），尝试另一种模式（在叠加和条形模式之间切换）或重新生成场景。
6. 使用 `MEDIA:/tmp/meme.png` 返回图片。

## 示例

**“凌晨 2 点调试生产环境”：**
```bash
python generate_meme.py this-is-fine /tmp/meme.png "服务器着火了" "这很好"
```

**“在睡觉和再看一集之间做选择”：**
```bash
python generate_meme.py drake /tmp/meme.png "睡够8小时" "凌晨3点再看一集"
```

**“周一早上的各个阶段”：**
```bash
python generate_meme.py expanding-brain /tmp/meme.png "设一个闹钟" "设5个闹钟" "睡过所有闹钟" "在床上工作"
```

## 列出模板

要查看所有可用模板：
```bash
python generate_meme.py --list
```

## 注意事项

- 保持字幕**简短**。长文本的 Meme 效果很差。
- 文本参数数量需与模板的字段数量匹配。
- 选择与笑话结构匹配的模板，而不仅仅是主题。
- 不要生成仇恨、辱骂或针对个人的内容。
- 脚本会在首次下载后将模板图像缓存在 `scripts/.cache/` 中。

## 验证

输出正确的条件是：
- 已在输出路径创建了 .png 文件
- 文本在模板上清晰可读（白字黑边）
- 笑点有效——字幕与模板的预期结构匹配
- 文件可以通过 MEDIA: 路径传递