---
title: "Hyperframes"
sidebar_label: "Hyperframes"
description: "使用 HyperFrames 创建基于 HTML 的视频合成、动画标题卡、社交叠加层、带字幕的真人出镜视频、音频响应式视觉效果和着色器过渡..."
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从该技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Hyperframes

使用 HyperFrames 创建基于 HTML 的视频合成、动画标题卡、社交叠加层、带字幕的真人出镜视频、音频响应式视觉效果和着色器过渡。HTML 是视频内容的源头。当用户希望从 HTML 合成渲染出 MP4/WebM 视频、想在媒体上动画化文本/标志/图表、需要与音频同步的字幕、想要 TTS 配音，或想将网站转换为视频时，可使用此技能。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/creative/hyperframes` 安装 |
| 路径 | `optional-skills/creative/hyperframes` |
| 版本 | `1.0.0` |
| 作者 | heygen-com |
| 许可证 | Apache-2.0 |
| 平台 | linux, macos, windows |
| 标签 | `creative`, `video`, `animation`, `html`, `gsap`, `motion-graphics` |
| 相关技能 | [`manim-video`](/docs/user-guide/skills/bundled/creative/creative-manim-video), [`meme-generation`](/docs/user-guide/skills/optional/creative/creative-meme-generation) |

:::info
以下是在此技能被触发时，Hermes加载的完整技能定义。这是当技能激活时，智能体所看到的指令。
:::

# HyperFrames

HTML 是视频的真相来源。一个合成就是一个 HTML 文件，它包含用于计时的 `data-*` 属性、用于动画的 GSAP 时间线，以及用于外观的 CSS。HyperFrames 引擎逐帧捕获页面，并使用 FFmpeg 编码为 MP4/WebM 格式。

**`manim-video` 的补充：** 使用 `manim-video` 制作数学/几何讲解（方程、3B1B 风格）。使用 `hyperframes` 制作动态图形、带字幕的真人解说视频、产品导览、社交平台叠层、着色器过渡，以及任何由真实视频/音频媒体驱动的内容。

## 何时使用

- 用户要求从文本、脚本或网站生成渲染视频
- 动画标题卡、字幕条或排版片头
- 带字幕的旁白视频（TTS + 与波形同步的字幕）
- 音频响应式视觉效果（节拍同步、频谱条、脉冲光效）
- 场景到场景的过渡（交叉溶解、擦除、着色器扭曲、闪白过渡）
- 社交平台叠层（Instagram/TikTok/YouTube 风格）
- 网站到视频的流程（捕获一个 URL，生成一个宣传视频）
- 任何需要确定性地渲染到视频文件的 HTML/CSS/JS 动画

**不要**将此技能用于：
- 纯数学/方程动画（→ `manim-video`）
- 图像生成或表情包（→ `meme-generation`，图像模型）
- 实时视频会议或直播

## 快速参考

```bash
npx hyperframes init my-video               # 脚手架一个项目
cd my-video
npx hyperframes lint                        # 预览/渲染前验证
npx hyperframes preview                     # 实时重载浏览器预览（端口 3002）
npx hyperframes render --output final.mp4   # 渲染为 MP4
npx hyperframes doctor                      # 诊断环境问题
```

渲染标志：`--quality draft|standard|high` · `--fps 24|30|60` · `--format mp4|webm` · `--docker`（可复现） · `--strict`。

完整 CLI 参考：[references/cli.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/cli.md)。

## 设置（一次性）

```bash
bash "$(dirname "$(find ~/.hermes/skills -path '*/hyperframes/SKILL.md' 2>/dev/null | head -1)")/scripts/setup.sh"
```

该脚本：
1. 验证 Node.js >= 22 和 FFmpeg 已安装（如果没有，会打印修复说明）。
2. 全局安装 `hyperframes` CLI（`npm install -g hyperframes@>=0.4.2`）。
3. 通过 Puppeteer 预缓存 `chrome-headless-shell` — **这是通过 Chrome 的 `HeadlessExperimental.beginFrame` 捕获路径实现最佳质量渲染所必需的。**
4. 运行 `npx hyperframes doctor` 并报告结果。

如果设置失败，请参阅 [references/troubleshooting.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/troubleshooting.md)。

## 流程

### 1. 在编写 HTML 前先规划

在接触代码之前，先在高层次上阐述：
- **什么** — 叙事弧线、关键时刻、情感节拍
- **结构** — 合成、轨道（视频/音频/叠层）、时长
- **视觉识别** — 颜色、字体、运动特性（爆炸式 / 电影感 / 流畅 / 技术感）
- **关键帧** — 对于每个场景，即大多数元素同时可见的时刻。这是你将首先构建的静态布局。

**视觉识别关卡（硬性关卡）。** 在编写任何合成 HTML 之前，必须先定义视觉识别。不要使用默认或通用颜色编写合成（`#333`、`#3b82f6`、`Roboto` 是跳过此步骤的标志）。按顺序检查：

1. **项目根目录有 `DESIGN.md`？** → 使用其确切的颜色、字体、运动规则和“不要做什么”的约束。
2. **用户指定了某种风格**（例如 "Swiss Pulse"、"dark and techy"、"luxury brand"）？ → 生成一个最小化的 `DESIGN.md`，包含 `## Style Prompt`、`## Colors`（3-5 种带角色的十六进制色）、`## Typography`（1-2 种字体族）、`## What NOT to Do`（3-5 条反模式）。
3. **以上都没有？** → 在编写任何 HTML 之前问 3 个问题：
   - 情绪？（爆炸式 / 电影感 / 流畅 / 技术感 / 混乱 / 温暖）
   - 亮色还是暗色画布？
   - 有任何品牌颜色、字体或视觉参考吗？

   然后根据答案生成一个 `DESIGN.md`。每个合成都必须将其调色板和排版追溯到 `DESIGN.md` 或用户的明确指示。

### 2. 脚手架搭建

```bash
npx hyperframes init my-video --non-interactive
```

模板：`blank`、`warm-grain`、`play-mode`、`swiss-grid`、`vignelli`、`decision-tree`、`kinetic-type`、`product-promo`、`nyt-graph`。传递 `--example <name>` 来选择一个，传递 `--video clip.mp4` 或 `--audio track.mp3` 来使用媒体种子。

### 3. 先布局后动画

首先为**关键帧**编写静态 HTML+CSS — 暂不使用 GSAP。`.scene-content` 容器必须填满场景（`width:100%; height:100%; padding:Npx`），并使用 `display:flex` + `gap`。使用 padding 将内容向内推 — 永远不要在内容容器上使用 `position: absolute; top: Npx`（当内容高于剩余空间时会溢出）。

只有在关键帧看起来正确后，才添加 `gsap.from()` 入场动画（动画**到** CSS 位置）和 `gsap.to()` 出场动画（动画**从**该位置）。

有关完整的 data-attribute 模式和合成规则，请参阅 [references/composition.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/composition.md)。

### 4. 使用 GSAP 制作动画

每个合成必须：
- 注册其时间线：`window.__timelines["<composition-id>"] = tl`
- 暂停开始：`gsap.timeline({ paused: true })` — 播放器控制播放
- 使用有限的 `repeat` 值（不要使用 `repeat: -1` — 这会破坏捕获引擎）。计算：`repeat: Math.ceil(duration / cycleDuration) - 1`。
- 具有确定性 — 没有 `Math.random()`、`Date.now()` 或系统时钟逻辑。如果需要伪随机性，请使用种子 PRNG。
- 同步构建 — 时间线构造周围没有 `async`/`await`、`setTimeout` 或 Promise。

有关核心 GSAP API（补间、缓动、交错、时间线），请参阅 [references/gsap.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/gsap.md)。

### 5. 场景之间的过渡

多场景合成需要过渡。规则：
1. **始终在场景之间使用过渡** — 不要使用跳切。
2. **始终在每个场景元素上使用入场动画**（`gsap.from(...)`）。
3. **除了最终场景外，永远不要使用出场动画** — 过渡本身就是出场。
4. 最终场景可以淡出。

使用 `npx hyperframes add <transition-name>` 来安装着色器过渡（`flash-through-white`、`liquid-wipe` 等）。完整列表：`npx hyperframes add --list`。

### 6. 音频、字幕、TTS、音频响应式、高亮显示

- **音频：** 始终是一个单独的 `<audio>` 元素（视频是 `muted playsinline`）。
- **TTS：** `npx hyperframes tts "Script text" --voice af_nova --output narration.wav`。使用 `--list` 列出声音。声音 ID 的第一个字母编码语言（`a`/`b`=英语，`e`=西班牙语，`f`=法语，`j`=日语，`z`=普通话等） — CLI 会自动推断音素化器区域设置；仅在需要覆盖时才传递 `--lang`。非英语音素化需要系统范围内安装 `espeak-ng`。
- **字幕：** `npx hyperframes transcribe narration.wav` → 逐词转录。根据转录语气从表中选择样式（hype / corporate / tutorial / storytelling / social — 参见 `references/features.md` 中的表格）。**语言规则：** 除非音频确认是英语，否则永远不要使用 `.en` whisper 模型 — `.en` 会翻译非英语音频而不是转录它。每个字幕组在其出场补间之后必须有一个硬性的 `tl.set(el, { opacity: 0, visibility: "hidden" }, group.end)` 清除操作 — 否则组会泄漏可见到后续组中。
- **音频响应式视觉：** 预提取音频频带（低频 / 中频 / 高频），并在时间线内使用 `for` 循环的 `tl.call(draw, [], f / fps)` 逐帧采样 — 单个长补间**不会**响应音频。映射：低频 → `scale`（脉动），高频 → `textShadow`/`boxShadow`（光效），整体振幅 → `opacity`/`y`/`backgroundColor`。避免均衡器条的陈词滥调 — 让内容引导视觉，音频驱动其行为。
- **标记样式高亮：** 用于文本强调的高亮、圆圈、爆发、涂鸦、草图效果是确定性的 CSS+GSAP — 参见 `references/features.md#marker-highlighting`。完全可寻址，无动画 SVG 滤镜。
- **场景过渡：** 每个多场景合成**必须**使用过渡（不要跳切）。从 CSS 基元（推滑动、模糊交叉溶解、缩放穿越、交错块）或着色器过渡（`flash-through-white`、`liquid-wipe`、`cross-warp-morph`、`chromatic-split` 等）中选择，通过 `npx hyperframes add` 安装。情绪和能量表位于 `references/features.md#transitions`。不要在同一个合成中混合使用 CSS 和着色器过渡。

### 7. 检查、验证、检查布局、预览、渲染

```bash
npx hyperframes lint              # 捕获缺失的 data-composition-id、重叠的轨道、未注册的时间线
npx hyperframes validate          # 在 5 个时间戳处进行 WCAG 对比度审计
npx hyperframes inspect           # 可视化布局审计 — 溢出、离帧元素、被遮挡的文本
npx hyperframes preview           # 实时浏览器预览
npx hyperframes render --quality draft --output draft.mp4    # 快速迭代
npx hyperframes render --quality high --output final.mp4     # 最终交付
```

`hyperframes validate` 会在每个文本元素后面采样背景像素，并在对比度低于 4.5:1（或大文本 3:1）时发出警告。`hyperframes inspect` 是布局端的伴侣 — 在多个时间戳运行页面，并标记静态检查无法看到的问题（一个字幕仅在 4.5 秒时包装超出安全区域，一个卡片在其标题是最长变体时溢出，一个元素最终位于过渡着色器后面）。**尤其是在包含对话气泡、卡片、字幕或紧凑排版的合成上运行 `inspect`。**

### 8. 网站到视频（如果用户给了一个 URL）

使用 [references/website-to-video.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/website-to-video.md) 中的 7 步捕获到视频工作流程：捕获 → DESIGN.md → SCRIPT.md → 故事板 → 合成 → 渲染 → 交付。

## 常见问题

- **`HeadlessExperimental.beginFrame' 未找到`** —— Chromium 147+ 移除了此协议。请确保您使用的 `hyperframes@>=0.4.2`（自动检测并回退到屏幕截图模式）。应急方案：`export PRODUCER_FORCE_SCREENSHOT=true`。参见 [hyperframes#294](https://github.com/heygen-com/hyperframes/issues/294) 和 [references/troubleshooting.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/troubleshooting.md)。
- **系统版 Chrome（非 `chrome-headless-shell`）** —— 渲染会挂起120秒然后超时。运行 `npx puppeteer browsers install chrome-headless-shell`（setup.sh 会执行此操作）。`hyperframes doctor` 会报告将使用哪个二进制文件。
- **任何位置的 `repeat: -1`** —— 会破坏捕获引擎。始终计算一个有限的重复次数。
- **对之后才出现的剪辑元素使用 `gsap.set()`** —— 页面加载时该元素不存在。请在时间线内部使用 `tl.set(selector, vars, timePosition)`，在其剪辑的 `data-start` 时刻或之后。
- **内容文本中的 `<br>`** —— 强制换行不知道渲染字体的宽度，因此自然换行 + `<br>` 会导致双重换行。使用 `max-width` 让文本自动换行。例外：每个单词故意独占一行的短显示标题。
- **为 `visibility` 或 `display` 添加动画** —— GSAP 无法对这些属性进行补间。请使用 `autoAlpha`（同时处理可见性和不透明度）。
- **调用 `video.play()` 或 `audio.play()`** —— 框架负责播放控制。永远不要自己调用这些方法。
- **异步构建时间线** —— 捕获引擎在页面加载后同步读取 `window.__timelines`。永远不要将时间线构造包装在 `async`、`setTimeout` 或 Promise 中。
- **独立 `index.html` 包裹在 `<template>` 中** —— 会对浏览器隐藏所有内容。只有通过 `data-composition-src` 加载的**子合成**才使用 `<template>`。
- **用视频承载音频** —— 始终使用静音的 `<video>` + 独立的 `<audio>`。

## 验证

渲染前后：

1.  **代码检查 + 验证 + 通过检查：** `npx hyperframes lint --strict && npx hyperframes validate && npx hyperframes inspect`（lint 捕获结构问题，validate 捕获对比度问题，inspect 捕获视觉布局/溢出问题 —— 如果出现警告请参见 troubleshooting.md）。
2.  **动画编排** —— 对于新合成或重大动画变更，请运行动画映射。`npx hyperframes init` 会将技能脚本复制到项目中，因此路径是项目本地的：
    ```bash
    node skills/hyperframes/scripts/animation-map.mjs <composition-dir> \
      --out <composition-dir>/.hyperframes/anim-map
    ```
    输出单个 `animation-map.json`，包含每补间摘要、ASCII 甘特时间线、交错检测、死区（>1秒无动画）、元素生命周期以及标志（`offscreen`、`collision`、`invisible`、`paced-fast` &lt;0.2秒、`paced-slow` >2秒）。扫描摘要和标志 —— 修复或证明其合理性。小改动时可跳过。
3.  **文件存在且非零：** `ls -lh final.mp4`。
4.  **时长匹配 `data-duration`：** `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 final.mp4`。
5.  **视觉检查：** 提取合成中间的帧：`ffmpeg -i final.mp4 -ss 00:00:05 -vframes 1 preview.png`。
6.  **如需要，音频存在：** `ffprobe -v error -show_streams -select_streams a -of default=nw=1:nk=1 final.mp4 | head -1`。

如果 `hyperframes render` 失败，请运行 `npx hyperframes doctor` 并在报告时附上其输出。

## 参考资料

- [composition.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/composition.md) —— 数据属性、时间线契约、不可违背的规则、排版/素材规则
- [cli.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/cli.md) —— 所有 CLI 命令（init、capture、lint、validate、inspect、preview、render、transcribe、tts、doctor、browser、info、upgrade、benchmark）
- [gsap.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/gsap.md) —— 适用于 HyperFrames 的 GSAP 核心 API（补间、缓动、交错、时间线、matchMedia）
- [features.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/features.md) —— 字幕、TTS、音频响应、标记高亮、转场（按需加载）
- [website-to-video.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/website-to-video.md) —— 7 步捕获到视频工作流
- [troubleshooting.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/troubleshooting.md) —— OpenClaw 修复、环境变量、常见渲染错误