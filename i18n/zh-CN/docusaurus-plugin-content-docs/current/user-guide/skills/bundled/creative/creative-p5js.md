---
title: "P5Js — p5"
sidebar_label: "P5Js"
description: "p5"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# P5Js

p5.js 草图：生成艺术、着色器、交互式内容、3D。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/creative/p5js` |
| 版本 | `1.0.0` |
| 平台 | linux, macos, windows |
| 标签 | `creative-coding`, `generative-art`, `p5js`, `canvas`, `interactive`, `visualization`, `webgl`, `shaders`, `animation` |
| 相关技能 | [`ascii-video`](/user-guide/skills/bundled/creative/creative-ascii-video), [`manim-video`](/user-guide/skills/bundled/creative/creative-manim-video), [`excalidraw`](/user-guide/skills/bundled/creative/creative-excalidraw) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# p5.js 制作流程

## 何时使用

当用户请求：p5.js 草图、创意编码、生成艺术、交互式可视化、画布动画、基于浏览器的视觉艺术、数据可视化、着色器效果或任何 p5.js 项目时使用。

## 包含内容

使用 p5.js 进行交互式和生成式视觉艺术的制作流程。创建基于浏览器的草图、生成艺术、数据可视化、交互式体验、3D 场景、音频响应式视觉和动态图形——导出为 HTML、PNG、GIF、MP4 或 SVG。涵盖：2D/3D 渲染、噪声和粒子系统、流场、着色器（GLSL）、像素操作、运动排版、WebGL 场景、音频分析、鼠标/键盘交互以及无头高分辨率导出。

## 创意标准

这是在浏览器中呈现的视觉艺术。画布是媒介；算法是画笔。

**在编写任何代码之前**，阐述创意概念。这件作品传达什么？是什么让观众停止滚动？是什么让它不同于一个代码教程示例？用户的提示是一个起点——以创意抱负去诠释它。

**首次渲染的卓越性是不可妥协的。** 输出必须在首次加载时就具有视觉冲击力。如果它看起来像一个 p5.js 教程练习、一个默认配置或“AI 生成的创意编码”，那就是错误的。在发布前请重新思考。

**超越参考词汇。** 参考中的噪声函数、粒子系统、调色板和着色器效果是起始词汇。对于每个项目，要进行组合、分层和创造。目录是颜料的调色板——你书写的是画作。

**主动发挥创意。** 如果用户要求“一个粒子系统”，请提供一个具有涌现群体行为、尾迹幽灵回声、调色板变换深度雾以及一个会呼吸的背景噪声场的粒子系统。包含至少一个用户没有要求但会欣赏的视觉细节。

**密集、分层、深思熟虑。** 每一帧都值得观看。绝不能是平坦的白色背景。始终具有构图层次。始终使用有意的颜色。始终包含只有在仔细观察时才显现的微观细节。

**统一的美学优于功能数量。** 所有元素必须服务于统一的视觉语言——共享的色温、一致的笔画粗细词汇、和谐的运动速度。一个包含十个不相关效果的草图不如一个包含三个相互关联效果的草图。

## 模式

| 模式 | 输入 | 输出 | 参考 |
|------|-------|--------|-----------|
| **生成艺术** | 种子 / 参数 | 程序化视觉构图（静态或动画） | `references/visual-effects.md` |
| **数据可视化** | 数据集 / API | 交互式图表、图形、自定义数据显示 | `references/interaction.md` |
| **交互式体验** | 无（用户驱动） | 鼠标/键盘/触摸驱动的草图 | `references/interaction.md` |
| **动画 / 动态图形** | 时间线 / 故事板 | 定时序列、运动排版、过渡 | `references/animation.md` |
| **3D 场景** | 概念描述 | WebGL 几何体、灯光、摄像机、材质 | `references/webgl-and-3d.md` |
| **图像处理** | 图像文件 | 像素操作、滤镜、马赛克、点画法 | `references/visual-effects.md` § 像素操作 |
| **音频响应式** | 音频文件 / 麦克风 | 声音驱动的生成视觉 | `references/interaction.md` § 音频输入 |

## 技术栈

每个项目一个独立的 HTML 文件。无需构建步骤。

| 层 | 工具 | 用途 |
|-------|------|---------|
| 核心 | p5.js 1.11.3 (CDN) | 画布渲染、数学、变换、事件处理 |
| 3D | p5.js WebGL 模式 | 3D 几何体、摄像机、灯光、GLSL 着色器 |
| 音频 | p5.sound.js (CDN) | FFT 分析、振幅、麦克风输入、振荡器 |
| 导出 | 内置 `saveCanvas()` / `saveGif()` / `saveFrames()` | PNG、GIF、帧序列输出 |
| 捕获 | CCapture.js (可选) | 确定性帧率视频捕获 (WebM, GIF) |
| 无头 | Puppeteer + Node.js (可选) | 自动化高分辨率渲染，通过 ffmpeg 生成 MP4 |
| SVG | p5.js-svg 1.6.0 (可选) | 用于打印的矢量输出——需要 p5.js 1.x |
| 自然媒介 | p5.brush (可选) | 水彩、炭笔、钢笔——需要 p5.js 2.x + WEBGL |
| 纹理 | p5.grain (可选) | 胶片颗粒、纹理叠加 |
| 字体 | Google Fonts / `loadFont()` | 通过 OTF/TTF/WOFF2 自定义排版 |

### 版本说明

**p5.js 1.x** (1.11.3) 是默认版本——稳定、文档完善、库兼容性最广。除非项目需要 2.x 功能，否则使用此版本。

**p5.js 2.x** (2.2+) 增加了：用 `async setup()` 替代 `preload()`、OKLCH/OKLAB 颜色模式、`splineVertex()`、着色器 `.modify()` API、可变字体、`textToContours()`、指针事件。p5.brush 需要此版本。参见 `references/core-api.md` § p5.js 2.0。

## 流程

每个项目遵循相同的 6 个阶段路径：

```
概念 → 设计 → 编码 → 预览 → 导出 → 验证
```

1.  **概念** — 阐明创意愿景：情绪、色彩世界、运动词汇、独特之处
2.  **设计** — 选择模式、画布尺寸、交互模型、颜色系统、导出格式。将概念映射到技术决策
3.  **编码** — 编写单个包含内联 p5.js 的 HTML 文件。结构：全局变量 → `preload()` → `setup()` → `draw()` → 辅助函数 → 类 → 事件处理程序
4.  **预览** — 在浏览器中打开，验证视觉质量。在目标分辨率下测试。检查性能
5.  **导出** — 捕获输出：`saveCanvas()` 用于 PNG，`saveGif()` 用于 GIF，`saveFrames()` + ffmpeg 用于 MP4，Puppeteer 用于无头批量处理
6.  **验证** — 输出是否符合概念？在目标显示尺寸下是否具有视觉冲击力？你愿意把它装裱起来吗？

## 创意方向

### 美学维度

| 维度 | 选项 | 参考 |
|-----------|---------|-----------|
| **颜色系统** | HSB/HSL、RGB、命名调色板、程序化和谐、渐变插值 | `references/color-systems.md` |
| **噪声词汇** | 柏林噪声、单纯形、分形（多倍频）、域扭曲、旋度噪声 | `references/visual-effects.md` § 噪声 |
| **粒子系统** | 基于物理、群聚、轨迹绘制、吸引子驱动、流场跟随 | `references/visual-effects.md` § 粒子 |
| **形状语言** | 几何图元、自定义顶点、贝塞尔曲线、SVG 路径 | `references/shapes-and-geometry.md` |
| **运动风格** | 缓动、基于弹簧、噪声驱动、物理模拟、线性插值、阶梯式 | `references/animation.md` |
| **排版** | 系统字体、加载的 OTF、`textToPoints()` 粒子文字、运动排版 | `references/typography.md` |
| **着色器效果** | GLSL 片段/顶点、滤镜着色器、后处理、反馈循环 | `references/webgl-and-3d.md` § 着色器 |
| **构图** | 网格、放射状、黄金比例、三分法、有机散射、平铺 | `references/core-api.md` § 构图 |
| **交互模型** | 鼠标跟随、点击生成、拖拽、键盘状态、滚动驱动、麦克风输入 | `references/interaction.md` |
| **混合模式** | `BLEND`、`ADD`、`MULTIPLY`、`SCREEN`、`DIFFERENCE`、`EXCLUSION`、`OVERLAY` | `references/color-systems.md` § 混合模式 |
| **分层** | `createGraphics()` 离屏缓冲区、Alpha 合成、遮罩 | `references/core-api.md` § 离屏缓冲区 |
| **纹理** | 柏林表面、点画、影线、半调、像素排序 | `references/visual-effects.md` § 纹理生成 |

### 每个项目的变化规则

永远不要使用默认配置。对于每个项目：
- **自定义调色板** — 永远不要直接使用 `fill(255, 0, 0)`。始终使用包含 3-7 种颜色的精心设计的调色板
- **自定义笔画粗细词汇** — 细点缀（0.5），中等结构（1-2），粗重点（3-5）
- **背景处理** — 永远不要使用纯色 `background(0)` 或 `background(255)`。始终使用纹理、渐变或分层
- **运动多样性** — 不同元素使用不同速度。主要元素 1x，次要元素 0.3x，环境元素 0.1x
- **至少一个自创元素** — 一个自定义粒子行为、一个新颖的噪声应用、一个独特的交互响应

### 项目特定的创新

对于每个项目，至少创新一个：
- 匹配氛围的自定义调色板（非预设）
- 新颖的噪声场组合（例如，旋度噪声 + 域扭曲 + 反馈）
- 独特的粒子行为（自定义力、自定义轨迹、自定义生成）
- 用户未要求但能提升作品的交互机制
- 创造视觉层次的构图技巧

### 参数设计哲学

参数应源于算法，而非通用菜单。问：“*这个*系统的哪些属性应该是可调的？”

**好的参数**揭示算法的特性：
- **数量** — 有多少粒子、分支、单元（控制密度）
- **尺度** — 噪声频率、元素大小、间距（控制纹理）
- **速率** — 速度、生长速率、衰减（控制能量）
- **阈值** — 行为何时改变？（控制戏剧性）
- **比率** — 比例、力之间的平衡（控制和谐）

**坏的参数**是与算法无关的通用控件：
- “color1”、“color2”、“size” — 没有上下文则无意义
- 不相关效果的切换开关
- 只改变外观而非行为的参数

每个参数都应改变算法的*思考方式*，而不仅仅是它的*外观*。一个改变噪声倍频程的“湍流”参数是好的。一个只改变 `ellipse()` 半径的“粒子大小”滑块是肤浅的。

## 工作流程

### 步骤一：创意构想

在编写任何代码之前，请阐明：

- **情绪/氛围**：观众应该感受到什么？沉思的？充满活力的？不安的？俏皮的？
- **视觉叙事**：随时间推移（或在交互时）会发生什么？积累？衰败？转化？振荡？
- **色彩世界**：暖色调/冷色调？单色？互补色？主色是什么？点缀色是什么？
- **形态语言**：有机曲线？锐利几何？点？线条？混合形态？
- **运动词汇**：缓慢漂移？爆炸性迸发？呼吸般的脉动？机械般的精确？
- **独特之处**：是什么让这个创意作品与众不同？

将用户的提示映射到美学选择上。“放松的生成式背景”与“故障数据可视化”在所有方面都要求不同的处理方式。

### 步骤二：技术设计

- **模式** — 上述表格中的7种模式之一
- **画布尺寸** — 横屏 1920x1080，竖屏 1080x1920，正方形 1080x1080，或响应式 `windowWidth/windowHeight`
- **渲染器** — `P2D`（默认）或 `WEBGL`（用于3D、着色器、高级混合模式）
- **帧率** — 60fps（交互式），30fps（氛围动画），或 `noLoop()`（静态生成）
- **导出目标** — 浏览器显示、PNG 静图、GIF 循环、MP4 视频、SVG 矢量
- **交互模型** — 被动（无输入）、鼠标驱动、键盘驱动、音频响应、滚动驱动
- **查看器 UI** — 对于交互式生成艺术，从 `templates/viewer.html` 开始，它提供种子导航、参数滑块和下载功能。对于简单草图或视频导出，使用基础 HTML

### 步骤三：编写代码

对于**交互式生成艺术**（种子探索、参数调整）：从 `templates/viewer.html` 开始。首先阅读模板，保留固定部分（种子导航、操作），替换算法和参数控制。这为用户提供了种子上一个/下一个/随机/跳转、带实时更新的参数滑块和 PNG 下载功能——所有都已连接好。

对于**动画、视频导出或简单草图**：使用基础 HTML：

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

// === 预加载（字体、图像、数据） ===
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
- **基于种子的随机性**：始终使用 `randomSeed()` + `noiseSeed()` 以实现可重现性
- **颜色模式**：使用 `colorMode(HSB, 360, 100, 100, 100)` 以进行直观的颜色控制
- **状态分离**：CONFIG 用于参数，PALETTE 用于颜色，全局变量用于可变状态
- **基于类的实体**：粒子、智能体、形状作为类，带有 `update()` + `display()` 方法
- **离屏缓冲区**：`createGraphics()` 用于分层合成、拖尾、遮罩

### 步骤四：预览与迭代

- 在浏览器中直接打开 HTML 文件——基础草图无需服务器
- 对于从本地文件加载 `loadImage()`/`loadFont()`：使用 `scripts/serve.sh` 或 `python3 -m http.server`
- Chrome DevTools 性能选项卡验证 60fps
- 在目标导出分辨率下测试，而不仅仅是窗口大小
- 调整参数，直到视觉效果符合步骤一中的概念

### 步骤五：导出

| 格式 | 方法 | 命令 |
|--------|--------|---------|
| **PNG** | 在 `keyPressed()` 中调用 `saveCanvas('output', 'png')` | 按 's' 保存 |
| **高分辨率 PNG** | Puppeteer 无头捕获 | `node scripts/export-frames.js sketch.html --width 3840 --height 2160 --frames 1` |
| **GIF** | `saveGif('output', 5)` — 捕获 N 秒 | 按 'g' 保存 |
| **帧序列** | `saveFrames('frame', 'png', 10, 30)` — 10秒，30fps | 然后 `ffmpeg -i frame-%04d.png -c:v libx264 output.mp4` |
| **MP4** | Puppeteer 帧捕获 + ffmpeg | `bash scripts/render.sh sketch.html output.mp4 --duration 30 --fps 30` |
| **SVG** | 使用 p5.js-svg 的 `createCanvas(w, h, SVG)` | `save('output.svg')` |

### 步骤六：质量验证

- **是否符合愿景？** 将输出与创意概念进行比较。如果看起来很普通，请回到步骤一
- **分辨率检查**：在目标显示尺寸下是否清晰？没有锯齿伪影？
- **性能检查**：在浏览器中是否能保持 60fps？（动画最低 30fps）
- **颜色检查**：颜色是否协调？在明暗显示器上测试
- **边界情况**：在画布边缘会发生什么？调整大小时？运行10分钟后？

## 关键实施注意事项

### 性能 — 优先禁用 FES

友好错误系统 (FES) 会带来高达 10 倍的开销。在每个生产环境草图中都应将其禁用：

```javascript
p5.disableFriendlyErrors = true;  // 在 setup() 之前

function setup() {
  pixelDensity(1);  // 防止视网膜显示屏上出现 2 倍到 4 倍的过绘
  createCanvas(1920, 1080);
}
```

在热循环（粒子、像素操作）中，使用 `Math.*` 代替 p5 的封装函数 — 性能提升显著：

```javascript
// 在 draw() 或 update() 的热路径中：
let a = Math.sin(t);          // 不要用 sin(t)
let r = Math.sqrt(dx*dx+dy*dy); // 不要用 dist() — 或者更好：跳过 sqrt，比较 magSq
let v = Math.random();        // 不需要种子时，不要用 random()
let m = Math.min(a, b);       // 不要用 min(a, b)
```

绝不要在 `draw()` 中使用 `console.log()`。绝不要在 `draw()` 中操作 DOM。参见 `references/troubleshooting.md` § 性能。

### 随机种子 — 必须使用

每个生成式草图都必须是可复现的。相同的种子，相同的输出。

```javascript
function setup() {
  randomSeed(CONFIG.seed);
  noiseSeed(CONFIG.seed);
  // 现在所有 random() 和 noise() 调用都是确定性的
}
```

生成内容绝不要使用 `Math.random()` — 仅用于性能关键的非视觉代码。视觉元素一律使用 `random()`。如果需要随机种子：`CONFIG.seed = floor(random(99999))`。

### 生成艺术平台支持 (fxhash / Art Blocks)

对于生成艺术平台，用平台的确定性随机数替换 p5 的 PRNG：

```javascript
// fxhash 惯例
const SEED = $fx.hash;              // 每次铸造都唯一
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

对于生成艺术，HSB（色相、饱和度、亮度）比 RGB 更容易使用：

```javascript
colorMode(HSB, 360, 100, 100, 100);
// 现在：fill(色相, 饱和度, 亮度, 透明度)
// 旋转色相：fill((baseHue + offset) % 360, 80, 90)
// 降低饱和度：fill(色相, 饱和度 * 0.3, 亮度)
// 变暗：fill(色相, 饱和度, 亮度 * 0.5)
```

绝不要硬编码原始 RGB 值。定义一个调色板对象，程序化地派生变体。参见 `references/color-systems.md`。

### 噪声 — 多倍频，而非原始

原始的 `noise(x, y)` 看起来像平滑的斑块。叠加倍频以获得自然纹理：

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

### createGraphics() 用于图层 — 不是可选项

单次平面渲染看起来很扁平。使用离屏缓冲区进行合成：

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
  renderTrails(trailLayer);   // 持久、渐变
  renderForeground(fgLayer);  // 每帧清除
  image(bgLayer, 0, 0);
  image(trailLayer, 0, 0);
  image(fgLayer, 0, 0);
}
```

### 性能 — 尽可能向量化

p5.js 的 draw 调用开销很大。对于数千个粒子：

```javascript
// 慢：单独形状
for (let p of particles) {
  ellipse(p.x, p.y, p.size);
}

// 快：单个形状使用 beginShape()
beginShape(POINTS);
for (let p of particles) {
  vertex(p.x, p.y);
}
endShape();

// 最快：用于海量计数的像素缓冲区
loadPixels();
for (let p of particles) {
  let idx = 4 * (floor(p.y) * width + floor(p.x));
  pixels[idx] = r; pixels[idx+1] = g; pixels[idx+2] = b; pixels[idx+3] = 255;
}
updatePixels();
```

参见 `references/troubleshooting.md` § 性能。

### 实例模式用于多个草图

全局模式会污染 `window`。对于生产环境，使用实例模式：

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

当在单页面上嵌入多个草图或与框架集成时需要使用。

### WebGL 模式注意事项

- `createCanvas(w, h, WEBGL)` — 原点在中心，而非左上角
- Y 轴反转（WEBGL 中正 Y 向上，P2D 中正 Y 向下）
- `translate(-width/2, -height/2)` 以获得类似 P2D 的坐标
- 每次变换前后使用 `push()`/`pop()` — 矩阵栈会静默溢出
- `texture()` 在 `rect()`/`plane()` 之前使用 — 而非之后
- 自定义着色器：`createShader(vert, frag)` — 在多个浏览器上测试

### 导出 — 按键绑定惯例

每个草图都应在 `keyPressed()` 中包含以下内容：

```javascript
function keyPressed() {
  if (key === 's' || key === 'S') saveCanvas('output', 'png');
  if (key === 'g' || key === 'G') saveGif('output', 5);
  if (key === 'r' || key === 'R') { randomSeed(millis()); noiseSeed(millis()); }
  if (key === ' ') CONFIG.paused = !CONFIG.paused;
}
```

### 无头视频导出 — 使用 noLoop()

通过 Puppeteer 进行无头渲染时，草图**必须**在 setup 中使用 `noLoop()`。否则，p5 的 draw 循环会自由运行，而截图速度较慢 — 草图会超前运行，导致跳帧或重复帧。

```javascript
function setup() {
  createCanvas(1920, 1080);
  pixelDensity(1);
  noLoop();                    // 捕获脚本控制帧推进
  window._p5Ready = true;      // 向捕获脚本发出就绪信号
}
```

捆绑的 `scripts/export-frames.js` 检测 `_p5Ready` 并为每次捕获调用一次 `redraw()`，实现精确的 1:1 帧对应关系。参见 `references/export-pipeline.md` § 确定性捕获。

对于多场景视频，使用逐片段架构：每个场景一个 HTML 文件，独立渲染，用 `ffmpeg -f concat` 拼接。参见 `references/export-pipeline.md` § 逐片段架构。

### 智能体工作流程

构建 p5.js 草图时：

1.  **编写 HTML 文件** — 单个自包含文件，所有代码内联
2.  **在浏览器中打开** — `open sketch.html`（macOS）或 `xdg-open sketch.html`（Linux）
3.  **本地资源**（字体、图像）需要服务器：在项目目录中运行 `python3 -m http.server 8080`，然后打开 `http://localhost:8080/sketch.html`
4.  **导出 PNG/GIF** — 如上所示添加 `keyPressed()` 快捷键，告诉用户按哪个键
5.  **无头导出** — `node scripts/export-frames.js sketch.html --frames 300` 用于自动帧捕获（草图必须使用 `noLoop()` + `_p5Ready`）
6.  **MP4 渲染** — `bash scripts/render.sh sketch.html output.mp4 --duration 30`
7.  **迭代优化** — 编辑 HTML 文件，用户刷新浏览器查看更改
8.  **按需加载参考** — 实现过程中根据需要使用 `skill_view(name="p5js", file_path="references/...")` 加载特定参考文件

## 性能目标

| 指标 | 目标 |
|--------|--------|
| 帧率（交互模式） | 持续 60fps |
| 帧率（动画导出） | 最低 30fps |
| 粒子数量（P2D 形状） | 60fps 下 5,000-10,000 |
| 粒子数量（像素缓冲区） | 60fps 下 50,000-100,000 |
| 画布分辨率 | 最高 3840x2160（导出），1920x1080（交互） |
| 文件大小（HTML） | &lt; 100KB（不含 CDN 库） |
| 加载时间 | &lt; 2s 显示第一帧 |

## 参考资料

| 文件 | 内容 |
|------|----------|
| `references/core-api.md` | 画布设置、坐标系统、绘制循环、`push()`/`pop()`、离屏缓冲区、合成模式、`pixelDensity()`、响应式设计 |
| `references/shapes-and-geometry.md` | 2D 基本图元、`beginShape()`/`endShape()`、贝塞尔/卡特穆尔-罗姆曲线、`vertex()` 系统、自定义形状、`p5.Vector`、有符号距离场、SVG 路径转换 |
| `references/visual-effects.md` | 噪声（Perlin、分形、域扭曲、旋度）、流场、粒子系统（物理、群聚、拖尾）、像素操作、纹理生成（点彩、交叉线、半色调）、反馈循环、反应扩散 |
| `references/animation.md` | 基于帧的动画、缓动函数、`lerp()`/`map()`、弹簧物理、状态机、时间轴序列、基于 `millis()` 的计时、过渡模式 |
| `references/typography.md` | `text()`、`loadFont()`、`textToPoints()`、动态排版、文字遮罩、字体度量、响应式文字大小 |
| `references/color-systems.md` | `colorMode()`、HSB/HSL/RGB、`lerpColor()`、`paletteLerp()`、程序化调色板、色彩和谐、`blendMode()`、渐变渲染、精选调色板库 |
| `references/webgl-and-3d.md` | WEBGL 渲染器、3D 基本图元、相机、灯光、材质、自定义几何体、GLSL 着色器（`createShader()`、`createFilterShader()`）、帧缓冲区、后处理 |
| `references/interaction.md` | 鼠标事件、键盘状态、触摸输入、DOM 元素、`createSlider()`/`createButton()`、音频输入（p5.sound FFT/振幅）、滚动驱动动画、响应式事件 |
| `references/export-pipeline.md` | `saveCanvas()`、`saveGif()`、`saveFrames()`、确定性无头捕获、ffmpeg 帧转视频、CCapture.js、SVG 导出、按片段架构、平台导出（fxhash）、视频常见问题 |
| `references/troubleshooting.md` | 性能分析、每像素预算、常见错误、浏览器兼容性、WebGL 调试、字体加载问题、像素密度陷阱、内存泄漏、CORS |
| `templates/viewer.html` | 交互式查看器模板：种子导航（上一个/下一个/随机/跳转）、参数滑块、下载 PNG、响应式画布。从此模板开始创建可探索的生成艺术 |

---

## 创意发散（仅在用户要求实验性/创意/独特输出时使用）

如果用户要求创意、实验性、令人惊喜或非常规的输出，选择最适合的策略，并在生成代码之前梳理推理其步骤。

- **概念融合** — 当用户提出两个事物需要融合或想要混合美学风格时
- **SCAMPER 变换** — 当用户想要对已知生成艺术模式进行变化时
- **远距联想** — 当用户给出单一概念并希望进行探索时（如"用时间做点什么"）

### 概念融合
1. 命名两个不同的视觉系统（如：粒子物理 + 手写）
2. 映射对应关系（粒子 = 墨滴，力 = 笔压，场 = 字形）
3. 选择性融合 — 保留能产生有趣涌现视觉效果的映射
4. 将融合作为统一系统编码，而非两个系统并排呈现

### SCAMPER 变换
取一个已知的生成模式（流场、粒子系统、L 系统、细胞自动机）并系统性地对其进行变换：
- **替代**：用文字字符替换圆形，用渐变替换线条
- **合并**：融合两种模式（流场 + 泰森多边形）
- **改编**：将 2D 模式应用到 3D 投影中
- **修改**：夸张比例、扭曲坐标空间
- **用途转换**：将物理模拟用于排版，将排序算法用于色彩
- **消除**：移除网格、移除颜色、移除对称性
- **逆向**：反向运行模拟，反转参数空间

### 远距联想
1. 锚定用户的概念（如"孤独"）
2. 在三个距离上生成联想：
   - 近距（显而易见）：空房间、单个人影、寂静
   - 中距（有趣）：鱼群中一条游错方向的鱼、没有通知的手机、地铁车厢之间的间隙
   - 远距（抽象）：素数、渐近曲线、凌晨三点的颜色
3. 发展中距联想 — 它们足够具体可以可视化，又足够出乎意料而引人入胜