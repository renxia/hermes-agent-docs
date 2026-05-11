---
title: "Hyperframes"
sidebar_label: "Hyperframes"
description: "使用HyperFrames创建基于HTML的视频合成、动画标题卡、社交叠加层、带字幕的访谈视频、音频反应式视觉效果和着色器过渡..."
---

{/* 此页面由网站脚本从技能的SKILL.md自动生成。请编辑源文件SKILL.md，而非此页面。 */}

# Hyperframes

使用HyperFrames创建基于HTML的视频合成、动画标题卡、社交叠加层、带字幕的访谈视频、音频反应式视觉效果和着色器过渡。HTML是视频的真实来源。当用户希望从HTML合成渲染MP4/WebM、需要在媒体上动画化文本/徽标/图表、需要与音频同步的字幕、需要TTS旁白或将网站转换为视频时使用此技能。

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
以下为 Hermes 加载此技能时的完整技能定义。这是技能激活时智能体看到的指令。
:::

# HyperFrames

HTML 是视频的真相来源。组合（composition）是一个 HTML 文件，包含用于计时的 `data-*` 属性、用于动画的 GSAP 时间线以及用于外观的 CSS。HyperFrames 引擎逐帧捕获页面，并使用 FFmpeg 编码为 MP4/WebM 格式。

**`manim-video` 的补充：** 对于数学/几何讲解（方程式、3B1B 风格），请使用 `manim-video`。对于动态图形、带字幕的说话人头部、产品导览、社交覆盖、着色器过渡以及由真实视频/音频媒体驱动的任何内容，请使用 `hyperframes`。

## 何时使用

- 用户根据文本、脚本或网站请求渲染视频
- 动画标题卡、下三分之一标题或排版开场
- 带字幕的叙述视频（TTS + 与波形同步的字幕）
- 音频反应式视觉效果（节拍同步、频谱条、脉动发光）
- 场景间过渡（交叉淡化、擦除、着色器扭曲、闪白）
- 社交覆盖（Instagram/TikTok/YouTube 风格）
- 网站到视频的流程（捕获 URL，制作宣传片）
- 任何必须确定性地渲染为视频文件的 HTML/CSS/JS 动画

**不要**将此技能用于：
- 纯数学/方程式动画（→ `manim-video`）
- 图像生成或表情包（→ `meme-generation`，图像模型）
- 实时视频会议或直播

## 快速参考

```bash
npx hyperframes init my-video               # 搭建项目脚手架
cd my-video
npx hyperframes lint                        # 预览/渲染前进行验证
npx hyperframes preview                     # 实时重载浏览器预览（端口 3002）
npx hyperframes render --output final.mp4   # 渲染为 MP4
npx hyperframes doctor                      # 诊断环境问题
```

渲染标志：`--quality draft|standard|high` · `--fps 24|30|60` · `--format mp4|webm` · `--docker`（可重现） · `--strict`。

完整 CLI 参考：[references/cli.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/cli.md)。

## 设置（一次性）

```bash
bash "$(dirname "$(find ~/.hermes/skills -path '*/hyperframes/SKILL.md' 2>/dev/null | head -1)")/scripts/setup.sh"
```

该脚本：
1. 验证 Node.js >= 22 和 FFmpeg 已安装（如果未安装则打印修复说明）。
2. 全局安装 `hyperframes` CLI（`npm install -g hyperframes@>=0.4.2`）。
3. 通过 Puppeteer 预缓存 `chrome-headless-shell` — **这是通过 Chrome 的 `HeadlessExperimental.beginFrame` 捕获路径实现最佳渲染质量所必需的**。
4. 运行 `npx hyperframes doctor` 并报告结果。

如果设置失败，请参阅 [references/troubleshooting.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/troubleshooting.md)。

## 步骤

### 1. 编写 HTML 前进行规划

在编写代码之前，先在高层明确：
- **内容** — 叙事弧线、关键时刻、情感节奏
- **结构** — 组合、轨道（视频/音频/覆盖层）、时长
- **视觉识别** — 颜色、字体、运动特性（爆炸性/电影感/流畅/技术感）
- **关键帧** — 对于每个场景，最多元素同时可见的时刻。这是你首先要构建的静态布局。

**视觉识别关卡（硬性关卡）。** 在编写任何组合 HTML 之前，必须定义视觉识别。不要用默认或通用颜色（`#333`、`#3b82f6`、`Roboto` 是跳过此步骤的标志）编写组合。按顺序检查：

1. **项目根目录有 `DESIGN.md`？** → 使用其确切的颜色、字体、运动规则和“不该做什么”约束。
2. **用户指定了风格**（例如“瑞士脉冲”、“黑暗科技感”、“奢侈品牌”）？ → 生成一个包含 `## 风格提示`、`## 颜色`（3-5 个十六进制代码及角色）、`## 排版`（1-2 种字体系列）、`## 不该做什么`（3-5 个反模式）的最小化 `DESIGN.md`。
3. **以上都没有？** → 在编写任何 HTML 前询问 3 个问题：
   - 情绪？（爆炸性/电影感/流畅/技术感/混乱/温暖）
   - 亮色还是暗色画布？
   - 有任何品牌颜色、字体或视觉参考吗？

   然后根据答案生成 `DESIGN.md`。每个组合都必须将其调色板和排版追溯到 `DESIGN.md` 或明确的用户指示。

### 2. 搭建脚手架

```bash
npx hyperframes init my-video --non-interactive
```

模板：`blank`、`warm-grain`、`play-mode`、`swiss-grid`、`vignelli`、`decision-tree`、`kinetic-type`、`product-promo`、`nyt-graph`。使用 `--example <name>` 选择一个，使用 `--video clip.mp4` 或 `--audio track.mp3` 添加媒体种子。

### 3. 先布局后动画

首先为**关键帧**编写静态 HTML+CSS —— 暂不使用 GSAP。`.scene-content` 容器必须填满场景（`width:100%; height:100%; padding:Npx`），并使用 `display:flex` + `gap`。使用 padding 将内容向内推 —— 永远不要在内容容器上使用 `position: absolute; top: Npx`（当内容高于剩余空间时会溢出）。

仅当关键帧看起来正确后，再添加 `gsap.from()` 入场动画（动画**至** CSS 位置）和 `gsap.to()` 退场动画（动画**从**其位置）。

完整的数据属性模式和组合规则，请参阅 [references/composition.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/composition.md)。

### 4. 使用 GSAP 动画

每个组合必须：
- 注册其时间线：`window.__timelines["<composition-id>"] = tl`
- 以暂停状态开始：`gsap.timeline({ paused: true })` — 播放器控制播放
- 使用有限的 `repeat` 值（不要使用 `repeat: -1` — 会破坏捕获引擎）。计算方式：`repeat: Math.ceil(duration / cycleDuration) - 1`。
- 具有确定性 —— 不要使用 `Math.random()`、`Date.now()` 或依赖系统时钟的逻辑。如果需要伪随机性，请使用带种子的 PRNG。
- 同步构建 —— 不要在时间线构建周围使用 `async`/`await`、`setTimeout` 或 Promise。

核心 GSAP API（补间、缓动、交错、时间线），请参阅 [references/gsap.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/gsap.md)。

### 5. 场景间过渡

多场景组合需要过渡。规则：
1. **始终在场景间使用过渡** —— 不要使用跳切。
2. **始终在每个场景元素上使用入场动画**（`gsap.from(...)`）。
3. **除最后一个场景外，永远不要使用退场动画** —— 过渡本身就是退场。
4. 最后一个场景可以淡出。

使用 `npx hyperframes add <transition-name>` 安装着色器过渡（`flash-through-white`、`liquid-wipe` 等）。完整列表：`npx hyperframes add --list`。

### 6. 音频、字幕、TTS、音频反应式、高亮

- **音频：** 始终使用单独的 `<audio>` 元素（视频为 `muted playsinline`）。
- **TTS：** `npx hyperframes tts "脚本文本" --voice af_nova --output narration.wav`。使用 `--list` 列出声音。声音 ID 的首字母编码语言（`a`/`b`=英语，`e`=西班牙语，`f`=法语，`j`=日语，`z`=普通话等）—— CLI 会自动推断音素化器语言环境；仅当需要覆盖时才传递 `--lang`。非英语音素化需要系统范围内安装 `espeak-ng`。
- **字幕：** `npx hyperframes transcribe narration.wav` → 逐词转录。从转录语气（hype / corporate / tutorial / storytelling / social —— 参见 `references/features.md` 中的表格）中选择样式。**语言规则：** 除非确认音频为英语，否则不要使用 `.en` whisper 模型 —— `.en` 会将非英语音频翻译而非转录。每个字幕组**必须**在其退场补间之后有一个硬性的 `tl.set(el, { opacity: 0, visibility: "hidden" }, group.end)` 结束点 —— 否则组会泄漏到后面的组中并可见。
- **音频反应式视觉效果：** 预先提取音频频段（低音/中音/高音），并在时间线内使用 `for` 循环 `tl.call(draw, [], f / fps)` 逐帧采样 —— 单个长补间**不会**对音频做出反应。将低音映射到 `scale`（脉动），高音映射到 `textShadow`/`boxShadow`（发光），整体振幅映射到 `opacity`/`y`/`backgroundColor`。避免均衡器条的陈词滥调 —— 让内容引导视觉，音频驱动其行为。
- **标记风格高亮：** 用于文本强调的高亮、圆圈、爆发、涂鸦、草图效果是确定性的 CSS+GSAP —— 参见 `references/features.md#marker-highlighting`。完全可定位，没有动画 SVG 滤镜。
- **场景过渡：** 每个多场景组合**必须**使用过渡（不要跳切）。从 CSS 基元（推动滑动、模糊交叉淡化、缩放穿过、交错块）或通过 `npx hyperframes add` 安装的着色器过渡（`flash-through-white`、`liquid-wipe`、`cross-warp-morph`、`chromatic-split` 等）中选择。情绪和能量表位于 `references/features.md#transitions`。不要在同一个组合中混合使用 CSS 和着色器过渡。

### 7. 检查、验证、检查、预览、渲染

```bash
npx hyperframes lint              # 捕获缺少 data-composition-id、重叠轨道、未注册的时间线
npx hyperframes validate          # 在 5 个时间戳处进行 WCAG 对比度审计
npx hyperframes inspect           # 视觉布局审计 —— 溢出、离屏元素、被遮挡的文本
npx hyperframes preview           # 实时浏览器预览
npx hyperframes render --quality draft --output draft.mp4    # 快速迭代
npx hyperframes render --quality high --output final.mp4     # 最终交付
```

`hyperframes validate` 对每个文本元素背后的背景像素进行采样，并在对比度低于 4.5:1（或大文本为 3:1）时发出警告。`hyperframes inspect` 是布局方面的配套工具 —— 在多个时间戳运行页面，并标记静态检查无法看到的问题（例如仅在 4.5 秒时字幕包裹超过安全区域、标题为最长变体时卡片溢出、元素最终位于过渡着色器之后）。特别是在包含对话气泡、卡片、字幕或紧凑排版的组合上运行 `inspect`。

### 8. 网站转视频（如果用户提供了 URL）

请使用 [references/website-to-video.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/website-to-video.md) 中的 7 步捕获到视频工作流程：捕获 → DESIGN.md → SCRIPT.md → 故事板 → 组合 → 渲染 → 交付。

## 常见问题

- **`HeadlessExperimental.beginFrame' wasn't found`** — Chromium 147+ 移除了此协议。请确保您使用的是 `hyperframes@>=0.4.2`（会自动检测并回退到截图模式）。应急方案：`export PRODUCER_FORCE_SCREENSHOT=true`。参见 [hyperframes#294](https://github.com/heygen-com/hyperframes/issues/294) 和 [references/troubleshooting.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/troubleshooting.md)。
- **系统级 Chrome (非 `chrome-headless-shell`)** — 渲染会挂起 120 秒后超时。运行 `npx puppeteer browsers install chrome-headless-shell` (setup.sh 会执行此操作)。`hyperframes doctor` 会报告将使用哪个二进制文件。
- **在任何地方使用 `repeat: -1`** — 会破坏捕获引擎。务必计算一个有限的重复次数。
- **在后期才出现的剪辑元素上使用 `gsap.set()`** — 该元素在页面加载时并不存在。请在时间轴内使用 `tl.set(selector, vars, timePosition)`，在剪辑的 `data-start` 时刻或之后调用。
- **内容文本中的 `<br>`** — 强制换行不知道渲染字体的宽度，所以自然换行加上 `<br>` 会导致双重换行。使用 `max-width` 让文本自然换行。例外情况：每个单词都故意独占一行的短显示标题。
- **为 `visibility` 或 `display` 添加动画** — GSAP 无法对这些属性进行补间。请使用 `autoAlpha`（同时处理可见性和不透明度）。
- **调用 `video.play()` 或 `audio.play()`** — 框架负责播放控制。请勿自行调用。
- **异步构建时间轴** — 捕获引擎会在页面加载后同步读取 `window.__timelines`。切勿将时间轴构建包装在 `async`、`setTimeout` 或 Promise 中。
- **独立 `index.html` 被包裹在 `<template>` 中** — 会隐藏所有浏览器内容。只有通过 `data-composition-src` 加载的**子合成**才使用 `<template>`。
- **用视频充当音频** — 应始终使用静音的 `<video>` 加上独立的 `<audio>`。

## 验证

渲染前后：

1.  **代码检查 + 验证 + 审查通过：** `npx hyperframes lint --strict && npx hyperframes validate && npx hyperframes inspect`（lint 检查结构问题，validate 检查对比度，inspect 检查视觉布局/溢出问题 — 如果出现警告，请参见 troubleshooting.md）。
2.  **动画编排** — 对于新的合成或重大的动画变更，请运行动画映射。`npx hyperframes init` 会将技能脚本复制到项目中，因此路径是项目本地的：
    ```bash
    node skills/hyperframes/scripts/animation-map.mjs <composition-dir> \
      --out <composition-dir>/.hyperframes/anim-map
    ```
    输出单个 `animation-map.json`，包含每个补间的摘要、ASCII 甘特图时间轴、错开检测、死区（>1 秒无动画）、元素生命周期以及标志（`offscreen`、`collision`、`invisible`、`paced-fast` &lt;0.2 秒、`paced-slow` >2 秒）。浏览摘要和标志 — 修复或解释每一个。小的修改可跳过。
3.  **文件存在且非零大小：** `ls -lh final.mp4`。
4.  **时长匹配 `data-duration`：** `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 final.mp4`。
5.  **视觉检查：** 提取合成中间的一个帧：`ffmpeg -i final.mp4 -ss 00:00:05 -vframes 1 preview.png`。
6.  **如有需要则包含音频：** `ffprobe -v error -show_streams -select_streams a -of default=nw=1:nk=1 final.mp4 | head -1`。

如果 `hyperframes render` 失败，请运行 `npx hyperframes doctor` 并在报告时附上其输出。

## 参考资料

- [composition.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/composition.md) — 数据属性、时间轴合约、不可协商的规则、排版/资产规则
- [cli.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/cli.md) — 所有 CLI 命令 (init, capture, lint, validate, inspect, preview, render, transcribe, tts, doctor, browser, info, upgrade, benchmark)
- [gsap.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/gsap.md) — HyperFrames 的 GSAP 核心 API (补间、缓动、错开、时间轴、matchMedia)
- [features.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/features.md) — 字幕、TTS、音频响应、标记高亮、过渡（按需加载）
- [website-to-video.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/website-to-video.md) — 7 步捕获到视频工作流
- [troubleshooting.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/creative/hyperframes/references/troubleshooting.md) — OpenClaw 修复、环境变量、常见渲染错误