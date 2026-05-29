---
title: "表情包生成 — 通过选择模板并使用 Pillow 叠加文字来生成真实表情包图片"
sidebar_label: "表情包生成"
description: "通过选择模板并使用 Pillow 叠加文字来生成真实表情包图片"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 表情包生成

通过选择模板并使用 Pillow 叠加文字来生成真实表情包图片。生成实际的 .png 表情包文件。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/creative/meme-generation` 安装 |
| 路径 | `optional-skills/creative/meme-generation` |
| 版本 | `2.0.0` |
| 作者 | adanaleycio |
| 许可 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `创意`, `表情包`, `幽默`, `图片` |
| 相关技能 | [`ascii-art`](/docs/user-guide/skills/bundled/creative/creative-ascii-art), `generative-widgets` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 表情包生成

根据主题生成真实的表情包图片。选择一个模板，编写标题，并渲染一个带有文字叠加的真实 .png 文件。

## 何时使用

- 用户要求你制作或生成一个表情包
- 用户想要一个关于特定主题、情境或挫折的表情包
- 用户说“做个表情包”或类似的话

## 可用模板

该脚本支持**大约100个流行的 imgflip 模板**（通过名称或ID），外加10个经过精心调整、文本位置手动优化的模板。

### 精选模板（自定义文字位置）

| ID | 名称 | 字段 | 最适用于 |
|----|------|--------|----------|
| `this-is-fine` | 这一切都好 | 顶部，底部 | 混乱，否认现实 |
| `drake` | 德雷克热线铃声 | 拒绝，接受 | 拒绝/偏好 |
| `distracted-boyfriend` | 分心的男友 | 分心对象，当前，人物 | 诱惑，优先级转移 |
| `two-buttons` | 两个按钮 | 左，右，人物 | 艰难抉择 |
| `expanding-brain` | 膨胀的大脑 | 4个级别 | 递进的讽刺 |
| `change-my-mind` | 改变我的想法 | 声明 | 热门观点 |
| `woman-yelling-at-cat` | 女人对猫吼叫 | 女人，猫 | 争论 |
| `one-does-not-simply` | 人们不会轻易 | 顶部，底部 | 看似简单实则困难的事 |
| `grus-plan` | 格鲁的计划 | 步骤1-3，领悟 | 事与愿违的计划 |
| `batman-slapping-robin` | 蝙蝠侠打罗宾 | 罗宾，蝙蝠侠 | 否定糟糕的想法 |

### 动态模板（来自 imgflip API）

不在精选列表中的任何模板都可以通过名称或 imgflip ID 使用。这些模板会获得智能的默认文字定位（2个字段时置顶/置底，3个及以上时均匀分布）。使用以下命令搜索：
```bash
python "$SKILL_DIR/scripts/generate_meme.py" --search "disaster"
```

## 流程

### 模式1：经典模板（默认）

1.  阅读用户主题，识别核心动态（混乱、困境、偏好、讽刺等）。
2.  选择最匹配的模板。使用“最适用于”列，或使用 `--search` 搜索。
3.  为每个字段编写简短标题（每个字段最多8-12个词，越短越好）。
4.  找到技能的脚本目录：
    ```
    SKILL_DIR=$(dirname "$(find ~/.hermes/skills -path '*/meme-generation/SKILL.md' 2>/dev/null | head -1)")
    ```
5.  运行生成器：
    ```bash
    python "$SKILL_DIR/scripts/generate_meme.py" <template_id> /tmp/meme.png "标题1" "标题2" ...
    ```
6.  使用 `MEDIA:/tmp/meme.png` 返回图片。

### 模式2：自定义AI图像（当 `image_generate` 可用时）

当没有合适的经典模板，或者用户想要原创内容时使用此模式。

1.  首先编写标题。
2.  使用 `image_generate` 创建与表情包概念匹配的场景。**不要在图像提示中包含任何文字** — 文字将由脚本添加。仅描述视觉场景。
3.  从 `image_generate` 结果 URL 中找到生成的图像路径。如果需要，将其下载到本地路径。
4.  使用 `--image` 参数运行脚本来叠加文字，选择一种模式：
    - **叠加**（文字直接在图像上，白色带黑色描边）：
      ```bash
      python "$SKILL_DIR/scripts/generate_meme.py" --image /path/to/scene.png /tmp/meme.png "顶部文字" "底部文字"
      ```
    - **色条**（在图像上方/下方添加黑色色条和白色文字 — 更清晰，始终可读）：
      ```bash
      python "$SKILL_DIR/scripts/generate_meme.py" --image /path/to/scene.png --bars /tmp/meme.png "顶部文字" "底部文字"
      ```
      当图像本身内容复杂或详细，直接在上面放文字可能难以阅读时，请使用 `--bars`。
5.  **视觉验证**（如果 `vision_analyze` 可用）：检查结果是否看起来不错：
    ```
    vision_analyze(image_url="/tmp/meme.png", question="文字是否清晰易读且位置得当？表情包在视觉上是否有效？")
    ```
    如果视觉模型指出问题（文字难以阅读、位置不佳等），尝试另一种模式（在叠加和色条之间切换）或重新生成场景。
6.  使用 `MEDIA:/tmp/meme.png` 返回图片。

## 示例

**"凌晨2点调试生产环境"：**
```bash
python generate_meme.py this-is-fine /tmp/meme.png "服务器着火了" "这都没事"
```

**"在睡觉和再看一集之间选择"：**
```bash
python generate_meme.py drake /tmp/meme.png "睡足8小时" "凌晨3点再看一集"
```

**"周一早上的各个阶段"：**
```bash
python generate_meme.py expanding-brain /tmp/meme.png "设置一个闹钟" "设置5个闹钟" "睡过所有闹钟" "在床上工作"
```

## 列出模板

要查看所有可用模板：
```bash
python generate_meme.py --list
```

## 注意事项

- 保持标题**简短**。文字过长的表情包看起来很糟糕。
- 文字参数的数量要与模板的字段数匹配。
- 选择符合笑话结构的模板，而不仅仅是符合主题。
- 不要生成仇恨、辱骂或针对个人的内容。
- 脚本会在首次下载后将模板图片缓存在 `scripts/.cache/` 中。

## 验证

如果满足以下条件，则输出正确：
- 在输出路径创建了 .png 文件
- 文字在模板上清晰可读（白色带黑色描边）
- 笑点有效 — 标题与模板的预期结构匹配
- 文件可以通过 MEDIA: 路径传递