---
title: "P5Js — p5"
sidebar_label: "P5Js"
description: "p5"
---

{/* 此页面由网站脚本 generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# P5Js

p5.js 草图：生成艺术、着色器、交互式、3D。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/p5js` |
| 版本 | `1.0.0` |
| 平台 | linux, macos, windows |
| 标签 | `creative-coding`, `generative-art`, `p5js`, `canvas`, `interactive`, `visualization`, `webgl`, `shaders`, `animation` |
| 相关技能 | [`ascii-video`](/docs/user-guide/skills/bundled/creative/creative-ascii-video), [`manim-video`](/docs/user-guide/skills/bundled/creative/creative-manim-video), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw) |

:::info
以下是Hermes在此技能被触发时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# p5.js 生产流水线

## 何时使用

当用户请求以下内容时使用：p5.js 草图、创意编码、生成艺术、交互式可视化、画布动画、基于浏览器的视觉艺术、数据可视化、着色器效果或任何 p5.js 项目。

## 内容包含

使用 p5.js 进行交互式和生成式视觉艺术的生产流水线。创建基于浏览器的草图、生成艺术、数据可视化、交互体验、3D 场景、音频反应视觉和动态图形——导出为 HTML、PNG、GIF、MP4 或 SVG。涵盖：2D/3D 渲染、噪点和粒子系统、流场、着色器（GLSL）、像素操作、动态排版、WebGL 场景、音频分析、鼠标/键盘交互以及无头高清导出。

## 创意标准

这是在浏览器中渲染的视觉艺术。画布是媒介；算法是画笔。

**在编写任何代码之前**，明确阐述创意概念。这件作品传达什么？是什么让观众停止滚动？是什么让它区别于一个代码教程示例？用户的提示是一个起点——用创意抱负去诠释它。

**首次渲染的卓越性是不可妥协的。** 输出在首次加载时必须具有视觉冲击力。如果它看起来像一个 p5.js 教程练习、默认配置或“AI 生成的创意编码”，那就是错误的。发布前请重新思考。

**超越参考词汇。** 参考资料中的噪点函数、粒子系统、调色板和着色器效果是起始词汇。对于每个项目，要进行组合、叠加和创新。目录是一盒颜料——你来创作这幅画。

**主动创造。** 如果用户要求“一个粒子系统”，那就交付一个具有涌现集群行为、拖尾幽灵回声、调色板偏移的深度雾以及一个会呼吸的背景噪波场的粒子系统。包含至少一个用户没有要求但会欣赏的视觉细节。

**密集、分层、深思熟虑。** 每一帧都值得观赏。永远不要用纯白的背景。始终有构图层次。始终有意识地使用色彩。始终有只有在仔细观察时才会出现的微细节。

**风格统一优于功能数量。** 所有元素必须服务于统一的视觉语言——共享的色彩温度、一致的笔触粗细词汇、和谐的运动速度。一个包含十个不相关效果的草图，不如一个包含三个相互协调的效果的草图。

## 模式

| 模式 | 输入 | 输出 | 参考 |
|------|-------|--------|-----------|
| **生成艺术** | 种子 / 参数 | 程序化视觉构图（静态或动画） | `references/visual-effects.md` |
| **数据可视化** | 数据集 / API | 交互式图表、图形、自定义数据显示 | `references/interaction.md` |
| **交互体验** | 无（用户驱动） | 鼠标/键盘/触摸驱动的草图 | `references/interaction.md` |
| **动画 / 动态图形** | 时间轴 / 故事板 | 定时序列、动态排版、过渡 | `references/animation.md` |
| **3D 场景** | 概念描述 | WebGL 几何体、灯光、相机、材质 | `references/webgl-and-3d.md` |
| **图像处理** | 图像文件 | 像素操作、滤镜、马赛克、点画法 | `references/visual-effects.md` § 像素操作 |
| **音频反应** | 音频文件 / 麦克风 | 声音驱动的生成视觉 | `references/interaction.md` § 音频输入 |

## 技术栈

每个项目一个自包含的单 HTML 文件。无需构建步骤。

| 层级 | 工具 | 用途 |
|-------|------|---------|
| 核心 | p5.js 1.11.3 (CDN) | 画布渲染、数学、变换、事件处理 |
| 3D | p5.js WebGL 模式 | 3D 几何体、相机、灯光、GLSL 着色器 |
| 音频 | p5.sound.js (CDN) | FFT 分析、振幅、麦克风输入、振荡器 |
| 导出 | 内置 `saveCanvas()` / `saveGif()` / `saveFrames()` | PNG、GIF、帧序列输出 |
| 捕获 | CCapture.js (可选) | 确定性帧率视频捕获（WebM、GIF） |
| 无头 | Puppeteer + Node.js (可选) | 自动化高清渲染、通过 ffmpeg 生成 MP4 |
| 矢量 | p5.js-svg 1.6.0 (可选) | 用于打印的矢量输出——需要 p5.js 1.x |
| 自然媒介 | p5.brush (可选) | 水彩、炭笔、钢笔——需要 p5.js 2.x + WEBGL |
| 纹理 | p5.grain (可选) | 胶片颗粒、纹理叠加 |
| 字体 | Google Fonts / `loadFont()` | 通过 OTF/TTF/WOFF2 自定义排版 |

### 版本说明

**p5.js 1.x** (1.11.3) 是默认版本——稳定、文档完善、库兼容性最广。除非项目需要 2.x 功能，否则使用此版本。

**p5.js 2.x** (2.2+) 新增：`async setup()` 替代 `preload()`、OKLCH/OKLAB 色彩模式、`splineVertex()`、着色器 `.modify()` API、可变字体、`textToContours()`、指针事件。p5.brush 需要此版本。参见 `references/core-api.md` § p5.js 2.0。

## 流水线

每个项目遵循相同的 6 阶段路径：

```
概念 → 设计 → 代码 → 预览 → 导出 → 验证
```

1. **概念** — 明确创意愿景：氛围、色彩世界、运动词汇、使其独特之处
2. **设计** — 选择模式、画布尺寸、交互模型、色彩系统、导出格式。将概念映射到技术决策
3. **代码** — 编写包含内联 p5.js 的单个 HTML 文件。结构：全局变量 → `preload()` → `setup()` → `draw()` → 辅助函数 → 类 → 事件处理器
4. **预览** — 在浏览器中打开，验证视觉质量。在目标分辨率下测试。检查性能
5. **导出** — 捕获输出：`saveCanvas()` 用于 PNG，`saveGif()` 用于 GIF，`saveFrames()` + ffmpeg 用于 MP4，Puppeteer 用于无头批处理
6. **验证** — 输出是否符合概念？在预期显示尺寸下是否具有视觉冲击力？你会把它装裱起来吗？

## 创意方向

### 美学维度

| 维度 | 选项 | 参考 |
|-----------|---------|-----------|
| **色彩系统** | HSB/HSL、RGB、命名调色板、程序和谐、渐变插值 | `references/color-systems.md` |
| **噪点词汇** | 柏林噪点、单纯形、分形（多频）、域扭曲、卷曲噪点 | `references/visual-effects.md` § 噪点 |
| **粒子系统** | 基于物理、集群、轨迹绘制、吸引子驱动、流场跟随 | `references/visual-effects.md` § 粒子 |
| **形状语言** | 几何基元、自定义顶点、贝塞尔曲线、SVG 路径 | `references/shapes-and-geometry.md` |
| **运动风格** | 缓动、基于弹簧、噪点驱动、物理模拟、线性插值、阶梯式 | `references/animation.md` |
| **排版** | 系统字体、加载的 OTF、`textToPoints()` 粒子文字、动态 | `references/typography.md` |
| **着色器效果** | GLSL 片元/顶点、滤镜着色器、后处理、反馈循环 | `references/webgl-and-3d.md` § 着色器 |
| **构图** | 网格、径向、黄金比例、三分法、有机散布、平铺 | `references/core-api.md` § 构图 |
| **交互模型** | 鼠标跟随、点击生成、拖拽、键盘状态、滚动驱动、麦克风输入 | `references/interaction.md` |
| **混合模式** | `BLEND`、`ADD`、`MULTIPLY`、`SCREEN`、`DIFFERENCE`、`EXCLUSION`、`OVERLAY` | `references/color-systems.md` § 混合模式 |
| **图层** | `createGraphics()` 离屏缓冲、Alpha 合成、遮罩 | `references/core-api.md` § 离屏缓冲 |
| **纹理** | 柏林表面、点刻、影线、半调、像素排序 | `references/visual-effects.md` § 纹理生成 |

### 每个项目的变化规则

永远不要使用默认配置。对于每个项目：
- **自定义调色板** — 永远不要直接用 `fill(255, 0, 0)`。始终使用包含 3-7 种颜色的精心设计的调色板
- **自定义笔触粗细词汇** — 细线强调（0.5）、中等结构线（1-2）、粗线强调（3-5）
- **背景处理** — 永远不要用纯色 `background(0)` 或 `background(255)`。始终使用纹理、渐变或分层背景
- **运动多样性** — 不同元素使用不同速度。主要元素为 1x，次要元素为 0.3x，环境元素为 0.1x
- **至少一个自创元素** — 自定义的粒子行为、新颖的噪点应用、独特的交互响应

### 项目特定创新

对于每个项目，至少创新以下之一：
- 匹配氛围的自定义调色板（不是预设）
- 新颖的噪波场组合（例如，卷曲噪点 + 域扭曲 + 反馈）
- 独特的粒子行为（自定义力、自定义轨迹、自定义生成）
- 用户未要求但能提升作品的交互机制
- 创造视觉层次的构图技巧

### 参数设计哲学

参数应从算法中涌现，而不是来自一个通用菜单。问：“这个系统的哪些属性应该是可调的？”

**好的参数**揭示了算法的特性：
- **数量** — 粒子、分支、单元的数量（控制密度）
- **尺度** — 噪点频率、元素大小、间距（控制纹理）
- **速率** — 速度、生长速率、衰减（控制能量）
- **阈值** — 行为何时改变？（控制戏剧性）
- **比率** — 比例、力之间的平衡（控制和谐）

**坏的参数**是与算法无关的通用控制：
- "color1"、"color2"、"size" — 没有上下文则无意义
- 不相关效果的切换开关
- 只改变外观而非行为的参数

每个参数都应改变算法*思考*的方式，而不仅仅是它*看起来*怎样。一个改变噪点八度的“湍流”参数是好的。一个只改变 `ellipse()` 半径的“粒子大小”滑块是肤浅的。

## 工作流程

### 步骤一：创意构想

在编写任何代码之前，先清晰阐述：

- **情绪/氛围**：观众应该感受到什么？沉思？充满活力？不安？趣味？
- **视觉叙事**：随着时间流逝（或交互）会发生什么？建构？衰败？转变？振荡？
- **色彩世界**：暖色/冷色？单色？互补色？主色调是什么？强调色是什么？
- **形状语言**：有机曲线？尖锐几何？点？线？混合？
- **动态词汇**：缓慢漂移？爆发式进发？呼吸脉动？机械式精准？
- **独特之处**：是什么让**这个**草图与众不同？

将用户的提示映射到美学选择。“放松的生成性背景”与“故障数据可视化”在各方面都截然不同。

### 步骤二：技术设计

- **模式** — 上述表格中的 7 种模式之一
- **画布尺寸** — 横向 1920x1080，纵向 1080x1920，方形 1080x1080，或响应式 `windowWidth/windowHeight`
- **渲染器** — `P2D`（默认）或 `WEBGL`（用于 3D、着色器、高级混合模式）
- **帧率** — 60fps（交互式）、30fps（环境动画）或 `noLoop()`（静态生成）
- **导出目标** — 浏览器显示、PNG 静图、GIF 循环、MP4 视频、SVG 矢量图
- **交互模型** — 被动（无输入）、鼠标驱动、键盘驱动、音频响应、滚动驱动
- **查看器界面** — 对于交互式生成艺术，从 `templates/viewer.html` 开始，该模板提供了种子导航、参数滑块和下载功能。对于简单草图或视频导出，使用裸 HTML

### 步骤三：编写草图代码

对于**交互式生成艺术**（种子探索、参数调整）：从 `templates/viewer.html` 开始。先阅读模板，保留固定部分（种子导航、操作按钮），替换算法和参数控件。这为用户提供了种子的上一个/下一个/随机/跳转、带实时更新的参数滑块以及 PNG 下载功能——全部已预先连接好。

对于**动画、视频导出或简单草图**：使用裸 HTML：

单个 HTML 文件。结构如下：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>项目名称</title>
  <script>p5.disableFriendlyErrors = true;</script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.3/p5.min.js"></script>
  <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.3/addons/p5.sound.min.js"></script> -->
  <!-- <script src="https://unpkg.com/p5.js-svg@1.6.0"></script> -->  <!-- SVG 导出 -->
  <!-- <script src="https://cdn.jsdelivr.net/npm/ccapture.js-npmfixed/build/CCapture.all.min.js"></script> -->  <!-- 视频捕获 -->
  <style>
    html, body { margin: 0; padding: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
<script>
// === 配置 ===
const CONFIG = {
  seed: 42,
  // ... 项目特定参数
};

// === 调色板 ===
const PALETTE = {
  bg: '#0a0a0f',
  primary: '#e8d5b7',
  // ...
};

// === 全局状态 ===
let particles = [];

// === 预加载（字体、图片、数据）===
function preload() {
  // font = loadFont('...');
}

// === 初始化 ===
function setup() {
  createCanvas(1920, 1080);
  randomSeed(CONFIG.seed);
  noiseSeed(CONFIG.seed);
  colorMode(HSB, 360, 100, 100, 100);
  // 初始化状态...
}

// === 绘制循环 ===
function draw() {
  // 渲染帧...
}

// === 辅助函数 ===
// ...

// === 类 ===
class Particle {
  // ...
}

// === 事件处理器 ===
function mousePressed() { /* ... */ }
function keyPressed() { /* ... */ }
function windowResized() { resizeCanvas(windowWidth, windowHeight); }
</script>
</body>
</html>
```

关键实现模式：
- **可复现随机性**：始终使用 `randomSeed()` + `noiseSeed()` 以确保可复现性
- **色彩模式**：使用 `colorMode(HSB, 360, 100, 100, 100)` 以获得直观的色彩控制
- **状态分离**：CONFIG 存放参数，PALETTE 存放颜色，全局变量存放可变状态
- **基于类的实体**：粒子、智能体、形状作为类，具有 `update()` + `display()` 方法
- **离屏缓冲区**：`createGraphics()` 用于分层构图、尾迹、遮罩

### 步骤四：预览与迭代

- 直接在浏览器中打开 HTML 文件——对于基本草图无需服务器
- 对于从本地文件加载 `loadImage()`/`loadFont()`：使用 `scripts/serve.sh` 或 `python3 -m http.server`
- 使用 Chrome DevTools 性能选项卡验证是否达到 60fps
- 在目标导出分辨率下测试，而不仅仅是窗口大小
- 调整参数，直到视觉效果与步骤一的概念相符

### 步骤五：导出

| 格式 | 方法 | 命令 |
|--------|--------|---------|
| **PNG** | 在 `keyPressed()` 中调用 `saveCanvas('output', 'png')` | 按 's' 保存 |
| **高分辨率 PNG** | Puppeteer 无头捕获 | `node scripts/export-frames.js sketch.html --width 3840 --height 2160 --frames 1` |
| **GIF** | `saveGif('output', 5)` — 捕获 N 秒 | 按 'g' 保存 |
| **帧序列** | `saveFrames('frame', 'png', 10, 30)` — 30fps 下持续 10 秒 | 然后 `ffmpeg -i frame-%04d.png -c:v libx264 output.mp4` |
| **MP4** | Puppeteer 帧捕获 + ffmpeg | `bash scripts/render.sh sketch.html output.mp4 --duration 30 --fps 30` |
| **SVG** | 使用 p5.js-svg 调用 `createCanvas(w, h, SVG)` | `save('output.svg')` |

### 步骤六：质量验证

- **是否符合愿景？** 将输出与创意概念进行比较。如果看起来很普通，返回步骤一
- **分辨率检查**：在目标显示尺寸下是否清晰？没有锯齿伪影？
- **性能检查**：在浏览器中是否能保持 60fps？（动画最低 30fps）
- **颜色检查**：颜色搭配是否协调？在亮色和暗色显示器上都测试一下
- **边缘情况**：在画布边缘会发生什么？调整大小后呢？运行 10 分钟后呢？

## 关键实现说明

### 性能 — 首先禁用 FES

友好错误系统 (FES) 会增加高达 10 倍的开销。在每个生产草图中禁用它：

```javascript
p5.disableFriendlyErrors = true;  // 在 setup() 之前

function setup() {
  pixelDensity(1);  // 防止在视网膜屏上出现 2-4 倍的过度绘制
  createCanvas(1920, 1080);
}
```

在热循环（粒子、像素操作）中，使用 `Math.*` 代替 p5 包装器 — 性能可测量地更快：

```javascript
// 在 draw() 或 update() 热路径中：
let a = Math.sin(t);          // 不是 sin(t)
let r = Math.sqrt(dx*dx+dy*dy); // 不是 dist() — 或者更好：跳过 sqrt，比较 magSq
let v = Math.random();        // 不是 random() — 当不需要种子时
let m = Math.min(a, b);       // 不是 min(a, b)
```

永远不要在 `draw()` 内部使用 `console.log()`。永远不要在 `draw()` 中操作 DOM。参见 `references/troubleshooting.md` § 性能。

### 种子随机性 — 必须使用

每个生成式草图都必须是可重现的。相同的种子，相同的输出。

```javascript
function setup() {
  randomSeed(CONFIG.seed);
  noiseSeed(CONFIG.seed);
  // 所有 random() 和 noise() 调用现在都是确定性的
}
```

对于生成式内容，永远不要使用 `Math.random()` — 仅用于性能关键的非视觉代码。对于视觉元素，始终使用 `random()`。如果你需要一个随机种子：`CONFIG.seed = floor(random(99999))`。

### 生成式艺术平台支持 (fxhash / Art Blocks)

对于生成式艺术平台，请用平台的确定性随机数替换 p5 的 PRNG：

```javascript
// fxhash 约定
const SEED = $fx.hash;              // 每个铸造唯一
const rng = $fx.rand;               // 确定性 PRNG
$fx.features({ palette: 'warm', complexity: 'high' });

// 在 setup() 中：
randomSeed(SEED);   // 用于 p5 的 noise()
noiseSeed(SEED);

// 用 rng() 替换 random() 以实现平台确定性
let x = rng() * width;  // 而不是 random(width)
```

参见 `references/export-pipeline.md` § 平台导出。

### 颜色模式 — 使用 HSB

HSB（色相、饱和度、亮度）比 RGB 更容易用于生成式艺术：

```javascript
colorMode(HSB, 360, 100, 100, 100);
// 现在：fill(hue, sat, bri, alpha)
// 旋转色相：fill((baseHue + offset) % 360, 80, 90)
// 去饱和：fill(hue, sat * 0.3, bri)
// 变暗：fill(hue, sat, bri * 0.5)
```

永远不要硬编码原始 RGB 值。定义一个调色板对象，程序化地派生变体。参见 `references/color-systems.md`。

### 噪声 — 多八度，不是原始的

原始的 `noise(x, y)` 看起来像平滑的斑点。叠加八度以获得自然纹理：

```javascript
function fbm(x, y, octaves = 4) {
  let val = 0, amp = 1, freq = 1, sum = 0;
  for (let i = 0; i < octaves; i++) {
    val += noise(x * freq, y * freq) * amp;
    sum += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return val / sum;
}
```

对于流动的有机形状，使用**域扭曲**：将噪声输出作为噪声输入坐标反馈。参见 `references/visual-effects.md`。

### createGraphics() 用于图层 — 不是可选的

平坦的单遍渲染看起来很单调。使用离屏缓冲区进行合成：

```javascript
let bgLayer, fgLayer, trailLayer;
function setup() {
  createCanvas(1920, 1080);
  bgLayer = createGraphics(width, height);
  fgLayer = createGraphics(width, height);
  trailLayer = createGraphics(width, height);
}
function draw() {
  renderBackground(bgLayer);
  renderTrails(trailLayer);   // 持久，淡出
  renderForeground(fgLayer);  // 每帧清除
  image(bgLayer, 0, 0);
  image(trailLayer, 0, 0);
  image(fgLayer, 0, 0);
}
```

### 性能 — 尽可能向量化

p5.js 的 draw 调用开销很大。对于成千上万的粒子：

```javascript
// 慢：单个形状
for (let p of particles) {
  ellipse(p.x, p.y, p.size);
}

// 快：使用 beginShape() 的单一形状
beginShape(POINTS);
for (let p of particles) {
  vertex(p.x, p.y);
}
endShape();

// 最快：用于大规模计数的像素缓冲区
loadPixels();
for (let p of particles) {
  let idx = 4 * (floor(p.y) * width + floor(p.x));
  pixels[idx] = r; pixels[idx+1] = g; pixels[idx+2] = b; pixels[idx+3] = 255;
}
updatePixels();
```

参见 `references/troubleshooting.md` § 性能。

### 实例模式用于多个草图

全局模式会污染 `window`。对于生产环境，请使用实例模式：

```javascript
const sketch = (p) => {
  p.setup = function() {
    p.createCanvas(800, 800);
  };
  p.draw = function() {
    p.background(0);
    p.ellipse(p.mouseX, p.mouseY, 50);
  };
};
new p5(sketch, 'canvas-container');
```

当在同一页面嵌入多个草图或与框架集成时必须使用。

### WebGL 模式注意事项

- `createCanvas(w, h, WEBGL)` — 原点是中心，不是左上角
- Y 轴是反转的（在 WEBGL 中正 Y 向上，在 P2D 中向下）
- `translate(-width/2, -height/2)` 以获得类似 P2D 的坐标
- 在每个变换周围使用 `push()`/`pop()` — 矩阵堆栈溢出是静默的
- `texture()` 在 `rect()`/`plane()` 之前 — 不是之后
- 自定义着色器：`createShader(vert, frag)` — 在多个浏览器上测试

### 导出 — 快捷键约定

每个草图都应在 `keyPressed()` 中包含这些：

```javascript
function keyPressed() {
  if (key === 's' || key === 'S') saveCanvas('output', 'png');
  if (key === 'g' || key === 'G') saveGif('output', 5);
  if (key === 'r' || key === 'R') { randomSeed(millis()); noiseSeed(millis()); }
  if (key === ' ') CONFIG.paused = !CONFIG.paused;
}
```

### 无头视频导出 — 使用 noLoop()

对于通过 Puppeteer 进行无头渲染，草图**必须**在 setup 中使用 `noLoop()`。如果没有它，p5 的 draw 循环会自由运行，而截图是缓慢的 — 草图会超前运行，你会得到跳过/重复的帧。

```javascript
function setup() {
  createCanvas(1920, 1080);
  pixelDensity(1);
  noLoop();                    // 捕获脚本控制帧推进
  window._p5Ready = true;      // 向捕获脚本发出就绪信号
}
```

捆绑的 `scripts/export-frames.js` 检测 `_p5Ready` 并为每次捕获调用 `redraw()` 一次，以实现精确的 1:1 帧对应。参见 `references/export-pipeline.md` § 确定性捕获。

对于多场景视频，使用每个片段的架构：每个场景一个 HTML，独立渲染，用 `ffmpeg -f concat` 拼接。参见 `references/export-pipeline.md` § 每个片段的架构。

### 智能体工作流程

构建 p5.js 草图时：

1.  **编写 HTML 文件** — 单个自包含文件，所有代码内联
2.  **在浏览器中打开** — `open sketch.html` (macOS) 或 `xdg-open sketch.html` (Linux)
3.  **本地资源**（字体、图像）需要服务器：在项目目录中运行 `python3 -m http.server 8080`，然后打开 `http://localhost:8080/sketch.html`
4.  **导出 PNG/GIF** — 按照上面所示添加 `keyPressed()` 快捷键，告诉用户按哪个键
5.  **无头导出** — `node scripts/export-frames.js sketch.html --frames 300` 用于自动帧捕获（草图必须使用 `noLoop()` + `_p5Ready`）
6.  **MP4 渲染** — `bash scripts/render.sh sketch.html output.mp4 --duration 30`
7.  **迭代优化** — 编辑 HTML 文件，用户刷新浏览器以查看更改
8.  **按需加载参考** — 使用 `skill_view(name="p5js", file_path="references/...")` 在实现过程中根据需要加载特定的参考文件

## 性能指标

| 指标 | 目标 |
|------|------|
| 帧率（交互模式） | 持续 60fps |
| 帧率（动画导出） | 最低 30fps |
| 粒子数量（P2D 图形） | 60fps 下 5,000-10,000 个 |
| 粒子数量（像素缓冲区） | 60fps 下 50,000-100,000 个 |
| 画布分辨率 | 最高 3840x2160（导出），1920x1080（交互） |
| 文件大小（HTML） | &lt; 100KB（不包括 CDN 库） |
| 加载时间 | &lt; 2 秒至首帧 |

## 参考资料

| 文件 | 内容 |
|------|------|
| `references/core-api.md` | 画布设置、坐标系、绘制循环、`push()`/`pop()`、离屏缓冲区、合成模式、`pixelDensity()`、响应式设计 |
| `references/shapes-and-geometry.md` | 二维基元、`beginShape()`/`endShape()`、贝塞尔/ Catmull-Rom 曲线、`vertex()` 系统、自定义形状、`p5.Vector`、符号距离场、SVG 路径转换 |
| `references/visual-effects.md` | 噪声（柏林、分形、域扭曲、卷曲）、流场、粒子系统（物理、群集、尾迹）、像素操作、纹理生成（点刻、影线、半调）、反馈循环、反应-扩散 |
| `references/animation.md` | 基于帧的动画、缓动函数、`lerp()`/`map()`、弹簧物理、状态机、时间轴序列、基于 `millis()` 的计时、过渡模式 |
| `references/typography.md` | `text()`、`loadFont()`、`textToPoints()`、动态排版、文本蒙版、字体度量、响应式文本大小 |
| `references/color-systems.md` | `colorMode()`、HSB/HSL/RGB、`lerpColor()`、`paletteLerp()`、程序化调色板、色彩和谐、`blendMode()`、渐变渲染、精选调色板库 |
| `references/webgl-and-3d.md` | WEBGL 渲染器、三维基元、摄像机、光照、材质、自定义几何体、GLSL 着色器（`createShader()`、`createFilterShader()`）、帧缓冲、后期处理 |
| `references/interaction.md` | 鼠标事件、键盘状态、触控输入、DOM 元素、`createSlider()`/`createButton()`、音频输入（p5.sound FFT/振幅）、滚动驱动动画、响应式事件 |
| `references/export-pipeline.md` | `saveCanvas()`、`saveGif()`、`saveFrames()`、确定性无头捕获、ffmpeg 帧转视频、CCapture.js、SVG 导出、每段架构、平台导出（fxhash）、视频注意事项 |
| `references/troubleshooting.md` | 性能分析、每像素预算、常见错误、浏览器兼容性、WebGL 调试、字体加载问题、像素密度陷阱、内存泄漏、CORS |
| `templates/viewer.html` | 交互式查看器模板：种子导航（上一个/下一个/随机/跳转）、参数滑块、下载 PNG、响应式画布。可从此开始创建可探索的生成艺术 |

---

## 创意发散（仅当用户要求实验性/创意/独特输出时使用）

如果用户要求创意、实验性、令人惊讶或非传统的输出，请选择最合适的策略并在生成代码前思考其步骤。

- **概念融合** — 当用户提及要结合的两个事物或想要混合美学时使用
- **SCAMPER 变换** — 当用户想要对已知生成艺术模式进行扭转时使用
- **远距联想** — 当用户给出一个概念并希望进行探索时使用（“创作关于时间的作品”）

### 概念融合
1. 命名两个不同的视觉系统（例如，粒子物理 + 手写）
2. 映射对应关系（粒子 = 墨滴，力 = 笔压，场 = 字形）
3. 选择性融合 — 保留能产生有趣涌现视觉效果的映射
4. 将融合编码为一个统一系统，而不是两个并排的系统

### SCAMPER 变换
取一个已知的生成模式（流场、粒子系统、L 系统、元胞自动机）并系统地进行变换：
- **替代**：用文本字符替换圆圈，用渐变替换线条
- **合并**：合并两种模式（流场 + 泰森多边形）
- **改编**：将 2D 模式应用于 3D 投影
- **修改**：夸大比例，扭曲坐标空间
- **目的**：将物理模拟用于排版，将排序算法用于色彩
- **消除**：移除网格、移除颜色、移除对称性
- **逆转**：反向运行模拟，反转参数空间

### 远距联想
1. 锚定在用户的概念上（例如，“孤独”）
2. 在三个距离上产生联想：
   - 近距（明显）：空房间、单个身影、寂静
   - 中距（有趣）：鱼群中一条游错方向的鱼、没有通知的手机、地铁车厢之间的空隙
   - 远距（抽象）：素数、渐近曲线、凌晨 3 点的颜色
3. 发展中距联想 — 它们足够具体可以可视化，但又足够出人意料以显得有趣。