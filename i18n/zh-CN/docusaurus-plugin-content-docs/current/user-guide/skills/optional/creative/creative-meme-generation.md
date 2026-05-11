---
title: "表情包生成——通过选择模板并用Pillow叠加文字来生成真实的表情包图片"
sidebar_label: "表情包生成"
description: "通过选择模板并用Pillow叠加文字来生成真实的表情包图片"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页。 */}

# 表情包生成

通过选择模板并用Pillow叠加文字来生成真实的表情包图片。生成实际的 .png 表情包文件。

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
| 相关技能 | [`ascii-art`](/docs/user-guide/skills/bundled/creative/creative-ascii-art), `generative-widgets` |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 表情包生成

根据主题生成实际的表情包图片。选择模板，撰写说明文字，并通过文字叠加渲染生成一个真实的 .png 文件。

## 何时使用

- 用户要求你制作或生成一个表情包
- 用户想要一个关于特定主题、情况或挫折的表情包
- 用户说"做个表情包"或类似的话

## 可用模板

该脚本支持**任何流行的 imgflip 模板**（约100个），可通过名称或ID选择，另外还包含10个经过精心调整文本定位的策划模板。

### 策划模板（自定义文本定位）

| ID | 名称 | 字段 | 最适用于 |
|----|------|------|----------|
| `this-is-fine` | This is Fine | 顶部, 底部 | 混乱, 否认 |
| `drake` | Drake Hotline Bling | 拒绝, 赞同 | 拒绝/偏好 |
| `distracted-boyfriend` | 分心男友 | 诱惑, 当前, 人物 | 诱惑, 优先级转变 |
| `two-buttons` | 两个按钮 | 左, 右, 人物 | 艰难抉择 |
| `expanding-brain` | 膨胀大脑 | 4个层级 | 层层递进的讽刺 |
| `change-my-mind` | 改变我的想法 | 陈述 | 热门观点 |
| `woman-yelling-at-cat` | 女人对着猫大喊 | 女人, 猫 | 争论 |
| `one-does-not-simply` | 你不能轻易 | 顶部, 底部 | 表面简单实则困难的事 |
| `grus-plan` | 格鲁的计划 | 步骤1-3, 醒悟 | 搬起石头砸自己脚的计划 |
| `batman-slapping-robin` | 蝙蝠侠打罗宾 | 罗宾, 蝙蝠侠 | 否定糟糕的想法 |

### 动态模板（来自 imgflip API）

任何不在策划列表中的模板都可以通过名称或 imgflip ID 使用。这些模板会获得智能的默认文本定位（2个字段为顶部/底部，3个及以上均匀分布）。使用以下命令搜索：
```bash
python "$SKILL_DIR/scripts/generate_meme.py" --search "disaster"
```

## 操作步骤

### 模式1：经典模板（默认）

1.  阅读用户的主题并识别其核心动态（混乱、困境、偏好、讽刺等）。
2.  选择最匹配的模板。使用“最适用于”列，或使用 `--search` 搜索。
3.  为每个字段撰写简短的文字说明（每个字段最多8-12个词，越短越好）。
4.  找到技能的脚本目录：
    ```
    SKILL_DIR=$(dirname "$(find ~/.hermes/skills -path '*/meme-generation/SKILL.md' 2>/dev/null | head -1)")
    ```
5.  运行生成器：
    ```bash
    python "$SKILL_DIR/scripts/generate_meme.py" <template_id> /tmp/meme.png "说明文字1" "说明文字2" ...
    ```
6.  使用 `MEDIA:/tmp/meme.png` 返回图片。

### 模式2：自定义AI图像（当 image_generate 可用时）

当没有经典模板合适，或用户想要原创内容时使用此模式。

1.  先撰写说明文字。
2.  使用 `image_generate` 创建符合表情包概念的场景。**不要**在图像提示中包含任何文字——文字将由脚本添加。仅描述视觉场景。
3.  从 image_generate 结果 URL 中找到生成的图像路径。如有需要，将其下载到本地路径。
4.  使用 `--image` 运行脚本以叠加文字，选择一种模式：
    - **叠加**（文字直接显示在图像上，白字黑边）：
      ```bash
      python "$SKILL_DIR/scripts/generate_meme.py" --image /path/to/scene.png /tmp/meme.png "顶部文字" "底部文字"
      ```
    - **条状**（顶部/底部为黑条加白字——更清晰，始终可读）：
      ```bash
      python "$SKILL_DIR/scripts/generate_meme.py" --image /path/to/scene.png --bars /tmp/meme.png "顶部文字" "底部文字"
      ```
      当图像内容繁杂/细节多，文字叠在上面难以阅读时，请使用 `--bars`。
5.  **通过视觉验证**（如果 `vision_analyze` 可用）：检查结果是否看起来良好：
    ```
    vision_analyze(image_url="/tmp/meme.png", question="文字是否清晰易读且位置得当？表情包在视觉上效果如何？")
    ```
    如果视觉模型指出问题（文字难以阅读、位置不当等），请尝试另一种模式（在叠加和条状之间切换）或重新生成场景。
6.  使用 `MEDIA:/tmp/meme.png` 返回图片。

## 示例

**“凌晨2点调试生产环境”：**
```bash
python generate_meme.py this-is-fine /tmp/meme.png "服务器着火了" "这都没事"
```

**“在睡觉和再看一集之间选择”：**
```bash
python generate_meme.py drake /tmp/meme.png "睡足8小时" "凌晨3点再看一集"
```

**“周一早上的几个阶段”：**
```bash
python generate_meme.py expanding-brain /tmp/meme.png "设一个闹钟" "设5个闹钟" "所有闹钟都睡过" "在床上工作"
```

## 列出模板

要查看所有可用模板：
```bash
python generate_meme.py --list
```

## 注意事项

- 保持说明文字**简短**。文字过长的表情包看起来很糟糕。
- 文字参数的数量要与模板的字段数匹配。
- 选择符合笑话结构的模板，而不仅仅是主题。
- 不要生成仇恨、辱骂或针对个人的内容。
- 脚本在首次下载后会将模板图像缓存在 `scripts/.cache/` 中。

## 验证

输出正确需满足：
- 在输出路径创建了一个 .png 文件
- 文字在模板上清晰可读（白字带黑边）
- 笑点有效——说明文字符合模板的预期结构
- 文件可通过 MEDIA: 路径传递