---
title: "Manim 视频 — 使用 Manim 社区版制作数学和技术动画的生产流程"
sidebar_label: "Manim 视频"
description: "使用 Manim 社区版制作数学和技术动画的生产流程"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Manim 视频

使用 Manim 社区版制作数学和技术动画的生产流程。可创建 3Blue1Brown 风格的讲解视频、算法可视化、方程推导、架构图和数据故事。当用户请求以下内容时使用：动画讲解、数学动画、概念可视化、算法演示、技术讲解、3Blue1Brown 风格视频，或任何包含几何/数学内容的程序化动画。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/creative/manim-video` |
| 版本 | `1.0.0` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Manim 视频制作流程

## 创意标准

这是教育电影。每一帧都在教学。每一个动画都在揭示结构。

**在编写一行代码之前**，先阐明叙事弧线。这纠正了什么误解？“顿悟时刻”是什么？什么样的视觉故事能将观众从困惑引向理解？用户的提示是一个起点——用教学抱负来诠释它。

**几何先于代数。** 先展示形状，再展示方程。视觉记忆比符号记忆编码得更快。当观众在看到公式之前先看到几何模式时，方程会让人感到是应得的。

**首次渲染的卓越性是不可协商的。** 输出必须视觉清晰且美学上连贯，无需修改轮次。如果某些内容看起来杂乱、时机不当或像“AI 生成的幻灯片”，那就是错误的。

**不透明度分层引导注意力。** 切勿将所有内容都以全亮度显示。主要元素为 1.0，上下文元素为 0.4，结构元素（坐标轴、网格）为 0.15。大脑分层处理视觉显著性。

**留出呼吸空间。** 每个动画之后都需要 `self.wait()`。观众需要时间吸收刚刚出现的内容。切勿从一个动画匆忙切换到下一个。关键揭示后的 2 秒停顿永远不会浪费。

**统一的视觉语言。** 所有场景共享调色板、一致的字体大小、匹配的动画速度。技术上正确的视频，但每个场景使用随机不同的颜色，是一种美学上的失败。

## 先决条件

运行 `scripts/setup.sh` 以验证所有依赖项。需要：Python 3.10+、Manim 社区版 v0.20+（`pip install manim`）、LaTeX（Linux 上为 `texlive-full`，macOS 上为 `mactex`）和 ffmpeg。参考文档基于 Manim CE v0.20.1 测试。

## 模式

| 模式 | 输入 | 输出 | 参考 |
|------|-------|--------|-----------|
| **概念解释器** | 主题/概念 | 带有几何直觉的动画解释 | `references/scene-planning.md` |
| **方程推导** | 数学表达式 | 逐步动画证明 | `references/equations.md` |
| **算法可视化** | 算法描述 | 带有数据结构的逐步执行 | `references/graphs-and-data.md` |
| **数据故事** | 数据/指标 | 动画图表、比较、计数器 | `references/graphs-and-data.md` |
| **架构图** | 系统描述 | 组件构建及连接 | `references/mobjects.md` |
| **论文解释器** | 研究论文 | 关键发现和方法动画 | `references/scene-planning.md` |
| **3D 可视化** | 3D 概念 | 旋转曲面、参数曲线、空间几何 | `references/camera-and-3d.md` |

## 技术栈

每个项目一个 Python 脚本。无需浏览器，无需 Node.js，无需 GPU。

| 层级 | 工具 | 用途 |
|-------|------|---------|
| 核心 | Manim 社区版 | 场景渲染、动画引擎 |
| 数学 | LaTeX (texlive/MiKTeX) | 通过 `MathTex` 渲染方程 |
| 视频 I/O | ffmpeg | 场景拼接、格式转换、音频复用 |
| TTS | ElevenLabs / Qwen3-TTS（可选） | 旁白配音 |

## 流程

```
计划 --> 编码 --> 渲染 --> 拼接 --> 音频（可选）--> 审查
```

1. **计划** — 编写 `plan.md`，包含叙事弧线、场景列表、视觉元素、调色板、旁白脚本
2. **编码** — 编写 `script.py`，每个场景一个类，每个场景都可独立渲染
3. **渲染** — `manim -ql script.py Scene1 Scene2 ...` 用于草稿，`-qh` 用于生产
4. **拼接** — 使用 ffmpeg 将场景片段拼接成 `final.mp4`
5. **音频**（可选）— 通过 ffmpeg 添加旁白和/或背景音乐。参见 `references/rendering.md`
6. **审查** — 渲染预览静态图，对照计划进行验证，调整

## 项目结构

```
project-name/
  plan.md                # 叙事弧线、场景分解
  script.py              # 所有场景在一个文件中
  concat.txt             # ffmpeg 场景列表
  final.mp4              # 拼接后的输出
  media/                 # Manim 自动生成的目录
    videos/script/480p15/
```

## 创意指导

### 调色板

| 调色板 | 背景 | 主要 | 次要 | 强调 | 使用场景 |
|---------|-----------|---------|-----------|--------|----------|
| **经典 3B1B** | `#1C1C1C` | `#58C4DD` (蓝色) | `#83C167` (绿色) | `#FFFF00` (黄色) | 通用数学/CS |
| **温暖学术** | `#2D2B55` | `#FF6B6B` | `#FFD93D` | `#6BCB77` | 平易近人 |
| **霓虹科技** | `#0A0A0A` | `#00F5FF` | `#FF00FF` | `#39FF14` | 系统、架构 |
| **单色** | `#1A1A2E` | `#EAEAEA` | `#888888` | `#FFFFFF` | 极简主义 |

### 动画速度

| 上下文 | run_time | 之后的 self.wait() |
|---------|----------|-------------------|
| 标题/介绍出现 | 1.5 秒 | 1.0 秒 |
| 关键方程揭示 | 2.0 秒 | 2.0 秒 |
| 变换/变形 | 1.5 秒 | 1.5 秒 |
| 支持性标签 | 0.8 秒 | 0.5 秒 |
| FadeOut 清理 | 0.5 秒 | 0.3 秒 |
| “顿悟时刻”揭示 | 2.5 秒 | 3.0 秒 |

### 字体大小比例

| 角色 | 字体大小 | 用法 |
|------|-----------|-------|
| 标题 | 48 | 场景标题、开场文本 |
| 标题 | 36 | 场景内的章节标题 |
| 正文 | 30 | 解释性文本 |
| 标签 | 24 | 注释、坐标轴标签 |
| 字幕 | 20 | 字幕、小字 |

### 字体

**所有文本都使用等宽字体。** Manim 的 Pango 渲染器在所有尺寸下使用比例字体都会产生断字距。完整建议请参见 `references/visual-design.md`。

```python
MONO = "Menlo"  # 在文件顶部定义一次

Text("Fourier Series", font_size=48, font=MONO, weight=BOLD)  # 标题
Text("n=1: sin(x)", font_size=20, font=MONO)                  # 标签
MathTex(r"\nabla L")                                            # 数学（使用 LaTeX）
```

可读性最低 `font_size=18`。

### 每个场景的变化

切勿对所有场景使用相同的配置。对于每个场景：
- **从调色板中选择不同的主色**
- **不同的布局** — 不要总是居中所有内容
- **不同的动画进入方式** — 在 Write、FadeIn、GrowFromCenter、Create 之间变化
- **不同的视觉权重** — 有些场景密集，有些稀疏

## 工作流程

### 步骤 1：计划 (plan.md)

在任何代码之前，先编写 `plan.md`。综合模板请参见 `references/scene-planning.md`。

### 步骤 2：编码 (script.py)

每个场景一个类。每个场景都可独立渲染。

```python
from manim import *

BG = "#1C1C1C"
PRIMARY = "#58C4DD"
SECONDARY = "#83C167"
ACCENT = "#FFFF00"
MONO = "Menlo"

class Scene1_Introduction(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text("Why Does This Work?", font_size=48, color=PRIMARY, weight=BOLD, font=MONO)
        self.add_subcaption("Why does this work?", duration=2)
        self.play(Write(title), run_time=1.5)
        self.wait(1.0)
        self.play(FadeOut(title), run_time=0.5)
```

关键模式：
- **每个动画都有字幕**：`self.add_subcaption("text", duration=N)` 或在 `self.play()` 上使用 `subcaption="text"`
- **文件顶部共享颜色常量**，以确保跨场景一致性
- **`self.camera.background_color`** 在每个场景中设置
- **干净的退出** — 场景结束时 FadeOut 所有 mobject：`self.play(FadeOut(Group(*self.mobjects)))`

### 步骤 3：渲染

```bash
manim -ql script.py Scene1_Introduction Scene2_CoreConcept  # 草稿
manim -qh script.py Scene1_Introduction Scene2_CoreConcept  # 生产
```

### 步骤 4：拼接

```bash
cat > concat.txt << 'EOF'
file 'media/videos/script/480p15/Scene1_Introduction.mp4'
file 'media/videos/script/480p15/Scene2_CoreConcept.mp4'
EOF
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy final.mp4
```

### 步骤 5：审查

```bash
manim -ql --format=png -s script.py Scene2_CoreConcept  # 预览静态图
```

## 关键实现注意事项

### LaTeX 的原始字符串
```python
# 错误: MathTex("\frac{1}{2}")
# 正确:
MathTex(r"\frac{1}{2}")
```

### 边缘文本的 buff >= 0.5
```python
label.to_edge(DOWN, buff=0.5)  # 切勿 < 0.5
```

### 替换文本前 FadeOut
```python
self.play(ReplacementTransform(note1, note2))  # 不要在顶部 Write(note2)
```

### 切勿动画未添加的 mobject
```python
self.play(Create(circle))  # 必须先添加
self.play(circle.animate.set_color(RED))  # 然后才能动画
```

## 性能目标

| 质量 | 分辨率 | 帧率 | 速度 |
|---------|-----------|-----|-------|
| `-ql` (草稿) | 854x480 | 15 | 5-15 秒/场景 |
| `-qm` (中等) | 1280x720 | 30 | 15-60 秒/场景 |
| `-qh` (生产) | 1920x1080 | 60 | 30-120 秒/场景 |

始终在 `-ql` 下迭代。仅在最终输出时才渲染 `-qh`。

## 参考

| 文件 | 内容 |
|------|----------|
| `references/animations.md` | 核心动画、速率函数、合成、`.animate` 语法、时间模式 |
| `references/mobjects.md` | 文本、形状、VGroup/Group、定位、样式、自定义 mobject |
| `references/visual-design.md` | 12 条设计原则、不透明度分层、布局模板、调色板 |
| `references/equations.md` | Manim 中的 LaTeX、TransformMatchingTex、推导模式 |
| `references/graphs-and-data.md` | 坐标轴、绘图、BarChart、动画数据、算法可视化 |
| `references/camera-and-3d.md` | MovingCameraScene、ThreeDScene、3D 曲面、相机控制 |
| `references/scene-planning.md` | 叙事弧线、布局模板、场景过渡、计划模板 |
| `references/rendering.md` | CLI 参考、质量预设、ffmpeg、旁白工作流程、GIF 导出 |
| `references/troubleshooting.md` | LaTeX 错误、动画错误、常见错误、调试 |
| `references/animation-design-thinking.md` | 何时动画 vs 显示静态、分解、节奏、旁白同步 |
| `references/updaters-and-trackers.md` | ValueTracker、add_updater、always_redraw、基于时间的更新器、模式 |
| `references/paper-explainer.md` | 将研究论文转化为动画 — 工作流程、模板、领域模式 |
| `references/decorations.md` | SurroundingRectangle、Brace、箭头、DashedLine、Angle、注释生命周期 |
| `references/production-quality.md` | 编码前、渲染前、渲染后检查清单、空间布局、颜色、节奏 |

## 创意发散（仅在用户要求实验性/创意性/独特输出时使用）

如果用户要求采用创意性、实验性或非传统的解释方法，请在设计动画前选择一种策略并进行推理。

- **SCAMPER** — 当用户希望对标准解释提出全新视角时
- **假设反转** — 当用户希望挑战某事物的常规教学方式时

### SCAMPER 变换
对标准的数学/技术可视化进行变换：
- **替代**：替换标准视觉隐喻（数轴 → 蜿蜒路径，矩阵 → 城市网格）
- **组合**：融合两种解释方法（代数与几何同时进行）
- **反转**：逆向推导 — 从结果出发，逐步解构至公理
- **修改**：放大某个参数以展示其重要性（学习率放大10倍，样本量放大1000倍）
- **消除**：去除所有符号标记 — 仅通过动画和空间关系进行解释

### 假设反转
1. 列出该主题在可视化方面的“标准”特征（从左到右、二维、离散步骤、正式符号）
2. 选择最根本的假设
3. 将其反转（从右到左推导、将二维概念嵌入三维空间、连续变形而非离散步骤、零符号标记）
4. 探索这种反转揭示了哪些标准方法所隐藏的内容