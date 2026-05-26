---
title: "Hyperframes"
sidebar_label: "Hyperframes"
description: "使用 HyperFrames 创建基于 HTML 的视频合成、动画标题卡、社交叠加层、带字幕的对话头视频、音频响应式视觉效果以及着色器转场。HTML 是视频的权威来源。当用户希望从 HTML 合成渲染出 MP4/WebM、需要在媒体上动画处理文本/徽标/图表、需要与音频同步的字幕、需要 TTS 配音，或将网站转换为视频时，请使用此功能。"
---

{/* 此页面由网站脚本 `generate-skill-docs.py` 根据技能的 `SKILL.md` 自动生成。请编辑源文件 `SKILL.md`，而非此页面。 */}

# Hyperframes

使用 HyperFrames 创建基于 HTML 的视频合成、动画标题卡、社交叠加层、带字幕的对话头视频、音频响应式视觉效果以及着色器转场。HTML 是视频的权威来源。当用户希望从 HTML 合成渲染出 MP4/WebM、需要在媒体上动画处理文本/徽标/图表、需要与音频同步的字幕、需要 TTS 配音，或将网站转换为视频时，请使用此功能。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/creative/hyperframes` 安装 |
| 路径 | `optional-skills/creative/hyperframes` |
| 版本 | `1.0.0` |
| 作者 | heygen-com |
| 许可 | Apache-2.0 |
| 平台 | linux, macos, windows |
| 标签 | `creative`, `video`, `animation`, `html`, `gsap`, `motion-graphics` |
| 相关技能 | [`manim-video`](/user-guide/skills/bundled/creative/creative-manim-video), [`meme-generation`](/user-guide/skills/optional/creative/creative-meme-generation) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# HyperFrames

HTML 是视频的权威来源。一个合成就是一个 HTML 文件，其中包含用于计时的 `data-*` 属性、用于动画的 GSAP 时间轴以及用于外观的 CSS。HyperFrames 引擎逐帧捕获页面并使用 FFmpeg 编码为 MP4/WebM。

**作为 `manim-video` 的补充：** 对于数学/几何解释器（方程、3B1B 风格）请使用 `manim-video`。对于动态图形、带字幕的说话人头部、产品导览、社交覆盖、着色器过渡以及由真实视频/音频媒体驱动的任何内容，请使用 `hyperframes`。

## 何时使用

- 用户根据文本、脚本或网站请求渲染的视频
- 动画标题卡、下三分之一或排版介绍
- 带字幕的旁白视频（TTS + 与波形同步的字幕）
- 音频响应式视觉效果（节拍同步、频谱条、脉冲发光）
- 场景间过渡（交叉渐隐、擦除、着色器变形、闪白）
- 社交覆盖（Instagram/TikTok/YouTube 风格）
- 网站到视频的流水线（捕获 URL，生成宣传片）
- 任何必须确定性渲染为视频文件的 HTML/CSS/JS 动画

**不要**将此技能用于：
- 纯数学/方程动画（→ `manim-video`）
- 图像生成或表情包（→ `meme-generation`，图像模型）
- 实时视频会议或流媒体

## 快速参考

```bash
npx hyperframes init my-video               # 搭建项目脚手架
cd my-video
npx hyperframes lint                        # 预览/渲染前进行验证
npx hyperframes preview                     # 浏览器实时重载预览（端口 3002）
npx hyperframes render --output final.mp4   # 渲染为 MP4
npx hyperframes doctor                      # 诊断环境问题
```

渲染标志：`--quality draft|standard|high` · `--fps 24|30|60` · `--format mp4|webm` · `--docker`（可复现）· `--strict`。

完整 CLI 参考：[references/cli.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/cli.md)。

## 设置（一次性）

```bash
bash "$(dirname "$(find ~/.hermes/skills -path '*/hyperframes/SKILL.md' 2>/dev/null | head -1)")/scripts/setup.sh"
```

该脚本：
1. 验证已安装 Node.js >= 22 和 FFmpeg（如未安装则打印修复说明）。
2. 全局安装 `hyperframes` CLI（`npm install -g hyperframes@>=0.4.2`）。
3. 通过 Puppeteer 预缓存 `chrome-headless-shell` — **这是**通过 Chrome 的 `HeadlessExperimental.beginFrame` 捕获路径实现最佳质量渲染所**必需的**。
4. 运行 `npx hyperframes doctor` 并报告结果。

如果设置失败，请参阅 [references/troubleshooting.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/troubleshooting.md)。

## 流程

### 1. 编写 HTML 前先规划

在编写代码之前，从宏观层面阐述：
- **内容** — 叙事弧线、关键时刻、情感节点
- **结构** — 合成、轨道（视频/音频/覆盖）、持续时间
- **视觉身份** — 颜色、字体、运动特性（爆炸性 / 电影感 / 流畅 / 技术感）
- **关键帧** — 对于每个场景，最多元素同时可见的时刻。这是你将首先构建的静态布局。

**视觉身份门控（硬门控）。** 在编写任何合成 HTML 之前，必须定义视觉身份。不要使用默认或通用颜色（`#333`、`#3b82f6`、`Roboto` 表明跳过了此步骤）编写合成。按顺序检查：

1. **项目根目录有 `DESIGN.md`？** → 使用其确切的颜色、字体、运动规则和“不要做什么”约束。
2. **用户指定了风格**（例如 "Swiss Pulse"、"dark and techy"、"luxury brand"）？ → 生成一个最小化的 `DESIGN.md`，包含 `## 风格提示`、`## 颜色`（3-5 个十六进制值及其用途）、`## 字体`（1-2 个字族）、`## 不要做什么`（3-5 个反模式）。
3. **以上都没有？** → 在编写任何 HTML 之前询问 3 个问题：
   - 情绪？（爆炸性 / 电影感 / 流畅 / 技术感 / 混乱 / 温暖）
   - 亮色还是暗色画布？
   - 有任何品牌颜色、字体或视觉参考吗？

   然后根据答案生成一个 `DESIGN.md`。每个合成都必须追溯其调色板和字体到 `DESIGN.md` 或明确的用户指示。

### 2. 搭建脚手架

```bash
npx hyperframes init my-video --non-interactive
```

模板：`blank`、`warm-grain`、`play-mode`、`swiss-grid`、`vignelli`、`decision-tree`、`kinetic-type`、`product-promo`、`nyt-graph`。传递 `--example <name>` 来选择一个，`--video clip.mp4` 或 `--audio track.mp3` 来用媒体初始化。

### 3. 先布局后动画

首先为**关键帧**编写静态 HTML+CSS — 还没有 GSAP。`.scene-content` 容器必须填满场景（`width:100%; height:100%; padding:Npx`），并使用 `display:flex` + `gap`。使用 padding 将内容向内推 — 永远不要在内容容器上使用 `position: absolute; top: Npx`（当内容高于剩余空间时会溢出）。

只有在关键帧看起来正确后，再添加 `gsap.from()` 入场动画（动画**到** CSS 位置）和 `gsap.to()` 出场动画（动画**从**该位置）。

完整 data-attribute 模式和合成规则参见 [references/composition.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/composition.md)。

### 4. 使用 GSAP 制作动画

每个合成必须：
- 注册其时间轴：`window.__timelines["<composition-id>"] = tl`
- 开始时暂停：`gsap.timeline({ paused: true })` — 播放器控制播放
- 使用有限的 `repeat` 值（不要用 `repeat: -1` — 会破坏捕获引擎）。计算：`repeat: Math.ceil(duration / cycleDuration) - 1`。
- 具有确定性 — 没有 `Math.random()`、`Date.now()` 或挂钟逻辑。如果需要伪随机性，请使用确定性种子的 PRNG。
- 同步构建 — 没有 `async`/`await`、`setTimeout` 或围绕时间轴构建的 Promise。

核心 GSAP API（补间、缓动、交错、时间轴）参见 [references/gsap.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/gsap.md)。

### 5. 场景间的过渡

多场景合成需要过渡。规则：
1. **场景之间始终使用过渡** — 不要硬切。
2. **每个场景元素始终使用入场动画**（`gsap.from(...)`）。
3. **除最后一个场景外，永远不要使用出场动画** — 过渡即出场。
4. 最后一个场景可以淡出。

使用 `npx hyperframes add <transition-name>` 安装着色器过渡（`flash-through-white`、`liquid-wipe` 等）。完整列表：`npx hyperframes add --list`。

### 6. 音频、字幕、TTS、音频响应、高亮

- **音频：** 始终是单独的 `<audio>` 元素（视频是 `muted playsinline`）。
- **TTS：** `npx hyperframes tts "Script text" --voice af_nova --output narration.wav`。使用 `--list` 列出声音。声音 ID 首字母编码语言（`a`/`b`=英语，`e`=西班牙语，`f`=法语，`j`=日语，`z`=普通话等）— CLI 自动推断音素器区域设置；仅当需要覆盖时才传递 `--lang`。非英语音素化需要系统范围安装 `espeak-ng`。
- **字幕：** `npx hyperframes transcribe narration.wav` → 词级文字记录。从文字记录的语气中选择风格（炒作 / 企业 / 教程 / 故事 / 社交 — 参见 `references/features.md` 中的表格）。**语言规则：** 除非音频确认是英语，否则不要使用 `.en` whisper 模型 — `.en` 会翻译非英语音频而不是转录它。每个字幕组**必须**在其出场补间后有一个硬性的 `tl.set(el, { opacity: 0, visibility: "hidden" }, group.end)` 终止 — 否则组会泄漏到后续组中可见。
- **音频响应式视觉效果：** 预提取音频频段（低音 / 中音 / 高音），并在时间轴内使用 `for` 循环 `tl.call(draw, [], f / fps)` 逐帧采样 — 单个长补间**不会**对音频做出响应。将低音映射到 `scale`（脉冲），高音映射到 `textShadow`/`boxShadow`（发光），整体振幅映射到 `opacity`/`y`/`backgroundColor`。避免均衡器条的陈词滥调 — 让内容引导视觉，音频驱动其行为。
- **标记式高亮：** 用于文本强调的高亮、圆圈、爆发、涂鸦、草绘效果是确定性的 CSS+GSAP — 参见 `references/features.md#marker-highlighting`。完全可搜寻，没有动画 SVG 滤镜。
- **场景过渡：** 每个多场景合成**必须**使用过渡（不要硬切）。从 CSS 原语（推滑、模糊交叉渐隐、缩放穿入、交错块）或着色器过渡（`flash-through-white`、`liquid-wipe`、`cross-warp-morph`、`chromatic-split` 等，通过 `npx hyperframes add`）中选择。情绪和能量表位于 `references/features.md#transitions`。不要在同一合成中混合使用 CSS 和着色器过渡。

### 7. 检查、验证、检查、预览、渲染

```bash
npx hyperframes lint              # 捕获缺失的 data-composition-id、重叠轨道、未注册的时间轴
npx hyperframes validate          # 在 5 个时间戳进行 WCAG 对比度审核
npx hyperframes inspect           # 视觉布局审核 — 溢出、离帧元素、被遮挡的文本
npx hyperframes preview           # 实时浏览器预览
npx hyperframes render --quality draft --output draft.mp4    # 快速迭代
npx hyperframes render --quality high --output final.mp4     # 最终交付
```

`hyperframes validate` 在每个文本元素后方采样背景像素，并对低于 4.5:1（大文本为 3:1）的对比度比发出警告。`hyperframes inspect` 是布局端的对应工具 — 在多个时间戳运行页面，并标记静态检查无法看到的问题（字幕仅在 4.5 秒时换行超过安全区域，卡片在标题是最长变体时溢出，元素最终位于过渡着色器后面）。在包含对话气泡、卡片、字幕或紧凑排版的合成上尤其要运行 `inspect`。

### 8. 网站到视频（如果用户提供了 URL）

使用 [references/website-to-video.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/website-to-video.md) 中的 7 步捕获到视频工作流：捕获 → DESIGN.md → SCRIPT.md → 故事板 → 合成 → 渲染 → 交付。

## 常见问题

- **`HeadlessExperimental.beginFrame' 未找到`** — Chromium 147+ 移除了此协议。请确保使用 `hyperframes@>=0.4.2` 版本（会自动检测并回退到截图模式）。应急方案：`export PRODUCER_FORCE_SCREENSHOT=true`。参见 [hyperframes#294](https://github.com/heygen-com/hyperframes/issues/294) 和 [references/troubleshooting.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/troubleshooting.md)。
- **系统 Chrome（非 `chrome-headless-shell`）** — 渲染会挂起120秒后超时。运行 `npx puppeteer browsers install chrome-headless-shell`（setup.sh 会执行此操作）。`hyperframes doctor` 会报告将使用哪个二进制文件。
- **任何地方出现 `repeat: -1`** — 会破坏捕获引擎。务必计算一个有限的重复次数。
- **对后期进入的裁剪元素使用 `gsap.set()`** — 该元素在页面加载时不存在。请在时间轴内，在裁剪的 `data-start` 时间点或之后，使用 `tl.set(selector, vars, timePosition)`。
- **内容文本中的 `<br>`** — 强制换行不知道渲染字体的宽度，因此自然换行 + `<br>` 会导致双重换行。使用 `max-width` 让文本自动换行。例外情况：每个词单独一行的短显示标题。
- **为 `visibility` 或 `display` 添加动画** — GSAP 无法对这些属性进行补间动画。请使用 `autoAlpha`（同时处理可见性和不透明度）。
- **调用 `video.play()` 或 `audio.play()`** — 框架控制播放。切勿自行调用这些方法。
- **异步构建时间轴** — 捕获引擎在页面加载后同步读取 `window.__timelines`。切勿将时间轴构建包装在 `async`、`setTimeout` 或 Promise 中。
- **包装在 `<template>` 中的独立 `index.html`** — 会向浏览器隐藏所有内容。只有通过 `data-composition-src` 加载的**子组合**才使用 `<template>`。
- **使用视频作为音频** — 始终使用静音的 `<video>` + 单独的 `<audio>`。

## 验证

渲染前后：

1. **通过 lint + 验证 + 检查：** `npx hyperframes lint --strict && npx hyperframes validate && npx hyperframes inspect`（lint 捕获结构问题，validate 捕获对比度问题，inspect 捕获视觉布局/溢出问题 — 如果出现警告，请参阅 troubleshooting.md）。
2. **动画编排** — 对于新的组合或重大的动画更改，请运行动画映射。`npx hyperframes init` 会将脚本复制到项目中，因此路径是项目本地的：
   ```bash
   node skills/hyperframes/scripts/animation-map.mjs <composition-dir> \
     --out <composition-dir>/.hyperframes/anim-map
   ```
   输出单个 `animation-map.json`，包含每个补间动画的摘要、ASCII 甘特图时间轴、错开检测、死区（>1秒无动画）、元素生命周期以及标志（`offscreen`、`collision`、`invisible`、`paced-fast` &lt;0.2秒、`paced-slow` >2秒）。扫描摘要和标志 — 修复或说明原因。小改动可跳过。
3. **文件存在且非零：** `ls -lh final.mp4`。
4. **时长匹配 `data-duration`：** `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 final.mp4`。
5. **视觉检查：** 提取组合中间的一帧：`ffmpeg -i final.mp4 -ss 00:00:05 -vframes 1 preview.png`。
6. **如有预期，音频存在：** `ffprobe -v error -show_streams -select_streams a -of default=nw=1:nk=1 final.mp4 | head -1`。

如果 `hyperframes render` 失败，请运行 `npx hyperframes doctor` 并在报告时附上其输出。

## 参考资料

- [composition.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/composition.md) — 数据属性、时间轴契约、不可协商规则、排版/资源规则
- [cli.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/cli.md) — 每个 CLI 命令（init、capture、lint、validate、inspect、preview、render、transcribe、tts、doctor、browser、info、upgrade、benchmark）
- [gsap.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/gsap.md) — HyperFrames 的 GSAP 核心 API（补间、缓动、错开、时间轴、matchMedia）
- [features.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/features.md) — 字幕、TTS、音频反应、标记高亮、过渡（按需加载）
- [website-to-video.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/website-to-video.md) — 7步捕获到视频工作流
- [troubleshooting.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/troubleshooting.md) — OpenClaw 修复、环境变量、常见渲染错误