---
title: "P5Js — 使用 p5 制作交互式与生成式视觉艺术的生产流水线"
sidebar_label: "P5Js"
description: "使用 p5 制作交互式与生成式视觉艺术的生产流水线"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# P5Js

使用 p5.js 制作交互式与生成式视觉艺术的生产流水线。可创建基于浏览器的草图、生成式艺术、数据可视化、交互体验、3D 场景、音频反应式视觉效果以及动态图形——导出格式包括 HTML、PNG、GIF、MP4 或 SVG。涵盖内容：2D/3D 渲染、噪声与粒子系统、流场、着色器（GLSL）、像素操作、动态排版、WebGL 场景、音频分析、鼠标/键盘交互以及无头高分辨率导出。当用户请求以下内容时使用：p5.js 草图、创意编程、生成式艺术、交互式可视化、画布动画、基于浏览器的视觉艺术、数据可视化、着色器效果，或任何 p5.js 项目。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/creative/p5js` |
| 版本 | `1.0.0` |
| 标签 | `creative-coding`, `generative-art`, `p5js`, `canvas`, `interactive`, `visualization`, `webgl`, `shaders`, `animation` |
| 相关技能 | [`ascii-video`](/docs/user-guide/skills/bundled/creative/creative-ascii-video), [`manim-video`](/docs/user-guide/skills/bundled/creative/creative-manim-video), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# p5.js 生产流水线

## 创意标准

这是在浏览器中渲染的视觉艺术。画布是媒介；算法是画笔。

**在编写一行代码之前**，请先阐明创意概念。这件作品传达了什么？是什么让观众停下滚动的脚步？是什么让它与代码教程示例区分开来？用户的提示是一个起点——请用创意雄心来诠释它。

**首次渲染的卓越性是不可妥协的。** 输出必须在首次加载时就具有视觉冲击力。如果它看起来像一个 p5.js 教程练习、默认配置或“AI 生成的创意编码”，那就是错误的。在发布之前请重新思考。

**超越参考词汇。** 参考中的噪声函数、粒子系统、调色板和着色器效果是一个起始词汇。对于每个项目，都要进行组合、分层和创造。目录是颜料的调色板——你创作的是绘画。

**主动创造。** 如果用户要求“一个粒子系统”，请交付一个具有涌现群集行为、拖尾幽灵回声、调色板偏移深度雾以及一个呼吸的背景噪声场的粒子系统。包含至少一个用户没有要求但会欣赏的视觉细节。

**密集、分层、深思熟虑。** 每一帧都应该值得观看。永远不要纯白背景。始终有构图层次。始终有 intentional 的颜色。始终有只有在近距离检查时才会出现的微细节。

** cohesive 美学优于功能数量。** 所有元素都必须服务于统一的视觉语言——共享的色温、一致的笔触粗细词汇、和谐的运动速度。一个有十个不相关效果的草图比一个有三个相互关联的效果的草图更糟糕。

## 模式

| 模式 | 输入 | 输出 | 参考 |
|------|-------|--------|-----------|
| **生成艺术** | 种子 / 参数 | 程序化视觉构图（静态或动画） | `references/visual-effects.md` |
| **数据可视化** | 数据集 / API | 交互式图表、图形、自定义数据显示 | `references/interaction.md` |
| **交互体验** | 无（用户驱动） | 鼠标/键盘/触摸驱动的草图 | `references/interaction.md` |
| **动画 / 动态图形** | 时间线 / 故事板 | 定时序列、动态排版、过渡 | `references/animation.md` |
| **3D 场景** | 概念描述 | WebGL 几何体、光照、相机、材质 | `references/webgl-and-3d.md` |
| **图像处理** | 图像文件 | 像素操作、滤镜、马赛克、点彩画 | `references/visual-effects.md` § 像素操作 |
| **音频反应** | 音频文件 / 麦克风 | 声音驱动的生成视觉 | `references/interaction.md` § 音频输入 |

## 技术栈

每个项目一个独立的 HTML 文件。无需构建步骤。

| 层 | 工具 | 目的 |
|-------|------|---------|
| 核心 | p5.js 1.11.3 (CDN) | 画布渲染、数学、变换、事件处理 |
| 3D | p5.js WebGL 模式 | 3D 几何体、相机、光照、GLSL 着色器 |
| 音频 | p5.sound.js (CDN) | FFT 分析、振幅、麦克风输入、振荡器 |
| 导出 | 内置 `saveCanvas()` / `saveGif()` / `saveFrames()` | PNG、GIF、帧序列输出 |
| 捕获 | CCapture.js (可选) | 确定性帧率视频捕获 (WebM, GIF) |
| 无头 | Puppeteer + Node.js (可选) | 自动化高分辨率渲染，通过 ffmpeg 生成 MP4 |
| SVG | p5.js-svg 1.6.0 (可选) | 用于打印的矢量输出 — 需要 p5.js 1.x |
| 自然媒介 | p5.brush (可选) | 水彩、炭笔、钢笔 — 需要 p5.js 2.x + WEBGL |
| 纹理 | p5.grain (可选) | 胶片颗粒、纹理叠加 |
| 字体 | Google Fonts / `loadFont()` | 通过 OTF/TTF/WOFF2 自定义排版 |

### 版本说明

**p5.js 1.x** (1.11.3) 是默认版本 — 稳定、文档齐全、库兼容性最广。除非项目需要 2.x 功能，否则请使用此版本。

**p5.js 2.x** (2.2+) 新增：`async setup()` 替代 `preload()`，OKLCH/OKLAB 颜色模式，`splineVertex()`，着色器 `.modify()` API，可变字体，`textToContours()`，指针事件。p5.brush 必需。参见 `references/core-api.md` § p5.js 2.0。

## 流水线

每个项目都遵循相同的 6 个阶段路径：

```
概念 → 设计 → 编码 → 预览 → 导出 → 验证
```

1. **概念** — 阐明创意愿景：情绪、色彩世界、运动词汇、是什么让这独一无二
2. **设计** — 选择模式、画布大小、交互模型、色彩系统、导出格式。将概念映射到技术决策
3. **编码** — 编写包含内联 p5.js 的单个 HTML 文件。结构：全局变量 → `preload()` → `setup()` → `draw()` → 辅助函数 → 类 → 事件处理程序
4. **预览** — 在浏览器中打开，验证视觉质量。在目标分辨率下测试。检查性能
5. **导出** — 捕获输出：`saveCanvas()` 用于 PNG，`saveGif()` 用于 GIF，`saveFrames()` + ffmpeg 用于 MP4，Puppeteer 用于无头批处理
6. **验证** — 输出是否符合概念？在预期的显示尺寸下是否具有视觉冲击力？你会把它装裱起来吗？

## 创意指导

### 美学维度

| 维度 | 选项 | 参考 |
|-----------|---------|-----------|
| **色彩系统** | HSB/HSL, RGB, 命名调色板, 程序化和谐, 渐变插值 | `references/color-systems.md` |
| **噪声词汇** | Perlin 噪声, simplex, 分形 (倍频), 域扭曲, 卷曲噪声 | `references/visual-effects.md` § 噪声 |
| **粒子系统** | 基于物理, 群集, 拖尾绘制, 吸引子驱动, 流场跟随 | `references/visual-effects.md` § 粒子 |
| **形状语言** | 几何图元, 自定义顶点, 贝塞尔曲线, SVG 路径 | `references/shapes-and-geometry.md` |
| **运动风格** | 缓动, 基于弹簧, 噪声驱动, 物理模拟, 插值, 步进 | `references/animation.md` |
| **排版** | 系统字体, 加载的 OTF, `textToPoints()` 粒子文本, 动态 | `references/typography.md` |
| **着色器效果** | GLSL 片段/顶点, 滤镜着色器, 后期处理, 反馈循环 | `references/webgl-and-3d.md` § 着色器 |
| **构图** | 网格, 径向, 黄金比例, 三分法则, 有机散布, 平铺 | `references/core-api.md` § 构图 |
| **交互模型** | 鼠标跟随, 点击生成, 拖拽, 键盘状态, 滚动驱动, 麦克风输入 | `references/interaction.md` |
| **混合模式** | `BLEND`, `ADD`, `MULTIPLY`, `SCREEN`, `DIFFERENCE`, `EXCLUSION`, `OVERLAY` | `references/color-systems.md` § 混合模式 |
| **分层** | `createGraphics()` 离屏缓冲区, alpha 合成, 遮罩 | `references/core-api.md` § 离屏缓冲区 |
| **纹理** | Perlin 表面, 点画, 影线, 半色调, 像素排序 | `references/visual-effects.md` § 纹理生成 |

### 每个项目的变化规则

永远不要使用默认配置。对于每个项目：
- **自定义调色板** — 永远不要使用原始的 `fill(255, 0, 0)`。始终使用包含 3-7 种颜色的设计调色板
- **自定义笔触粗细词汇** — 细 accents (0.5), 中等结构 (1-2), 粗 emphasis (3-5)
- **背景处理** — 永远不要使用纯 `background(0)` 或 `background(255)`。始终使用纹理、渐变或分层
- **运动变化** — 不同元素的速度不同。主元素 1x，次元素 0.3x，环境元素 0.1x
- **至少一个发明元素** — 一个自定义粒子行为，一个新颖的噪声应用，一个独特的交互响应

### 项目特定发明

对于每个项目，至少发明以下之一：
- 一个符合情绪的自定义调色板（不是预设）
- 一个新颖的噪声场组合（例如，卷曲噪声 + 域扭曲 + 反馈）
- 一个独特的粒子行为（自定义力，自定义拖尾，自定义生成）
- 一个用户没有要求但能提升作品的交互机制
- 一种创造视觉层次的构图技巧

### 参数设计哲学

参数应该从算法中产生，而不是从一个通用菜单中产生。问：“*这个*系统的哪些属性应该是可调的？”

**好的参数** 暴露了算法的特征：
- **数量** — 有多少粒子、分支、细胞（控制密度）
- **尺度** — 噪声频率、元素大小、间距（控制纹理）
- **速率** — 速度、增长率、衰减（控制能量）
- **阈值** — 行为何时改变？（控制戏剧性）
- **比率** — 比例，力之间的平衡（控制和谐）

**坏的参数** 是与算法无关的通用控件：
- “color1”, “color2”, “size” — 没有上下文就毫无意义
- 用于不相关效果的切换开关
- 仅改变外观而不改变行为的参数

每个参数都应该改变算法的*思考*方式，而不仅仅是它的*外观*。一个改变噪声倍频的“湍流”参数是好的。一个仅改变 `ellipse()` 半径的“粒子大小”滑块是肤浅的。

## 工作流程

### 第一步：创意构想

在编写任何代码之前，请先明确：

- **情绪/氛围**：观众应该感受到什么？沉思？充满活力？不安？有趣？
- **视觉故事**：随时间推移（或交互时）会发生什么？构建？衰败？变换？振荡？
- **色彩世界**：暖色调/冷色调？单色？互补色？主色调是什么？点缀色是什么？
- **形状语言**：有机曲线？锐利几何？点？线？混合？
- **运动词汇**：缓慢漂移？爆发式迸发？呼吸式脉动？机械式精准？
- **独特之处**：是什么让这个草图独一无二？

将用户的提示映射到美学选择上。“令人放松的生成式背景”与“故障数据可视化”在各方面都截然不同。

### 第二步：技术设计

- **模式** —— 上述表格中的 7 种模式之一
- **画布尺寸** —— 横向 1920x1080，纵向 1080x1920，正方形 1080x1080，或响应式 `windowWidth/windowHeight`
- **渲染器** —— `P2D`（默认）或 `WEBGL`（用于 3D、着色器、高级混合模式）
- **帧率** —— 60fps（交互式），30fps（环境动画），或 `noLoop()`（静态生成）
- **导出目标** —— 浏览器显示、PNG 静态图、GIF 循环、MP4 视频、SVG 矢量图
- **交互模型** —— 被动（无输入）、鼠标驱动、键盘驱动、音频响应、滚动驱动
- **查看器 UI** —— 对于交互式生成艺术，从 `templates/viewer.html` 开始，它提供了种子导航、参数滑块和下载功能。对于简单草图或视频导出，请使用纯 HTML

### 第三步：编写草图代码

对于**交互式生成艺术**（种子探索、参数调整）：从 `templates/viewer.html` 开始。先阅读模板，保留固定部分（种子导航、操作），替换算法和参数控件。这将为用户提供种子上一个/下一个/随机/跳转、带实时更新的参数滑块以及 PNG 下载功能 —— 全部已连接好。

对于**动画、视频导出或简单草图**：使用纯 HTML：

单个 HTML 文件。结构如下：

```html
<!DOCTYPE html>
<html lang="zh-CN">
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

// === 预加载（字体、图像、数据）===
function preload() {
  // font = loadFont('...');
}

// === 设置 ===
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
- **种子随机性**：始终使用 `randomSeed()` + `noiseSeed()` 以保证可重现性
- **颜色模式**：使用 `colorMode(HSB, 360, 100, 100, 100)` 进行直观的颜色控制
- **状态分离**：CONFIG 用于参数，PALETTE 用于颜色，全局变量用于可变状态
- **基于类的实体**：粒子、智能体、形状作为具有 `update()` + `display()` 方法的类
- **离屏缓冲区**：`createGraphics()` 用于分层合成、轨迹、遮罩

### 第四步：预览与迭代

- 直接在浏览器中打开 HTML 文件 —— 基本草图无需服务器
- 对于从本地文件 `loadImage()`/`loadFont()`：使用 `scripts/serve.sh` 或 `python3 -m http.server`
- 使用 Chrome 开发者工具性能标签验证 60fps
- 在目标导出分辨率下测试，而不仅仅是窗口大小
- 调整参数，直到视觉效果与第一步中的概念相匹配

### 第五步：导出

| 格式 | 方法 | 命令 |
|--------|--------|---------|
| **PNG** | 在 `keyPressed()` 中调用 `saveCanvas('output', 'png')` | 按 's' 保存 |
| **高分辨率 PNG** | Puppeteer 无头捕获 | `node scripts/export-frames.js sketch.html --width 3840 --height 2160 --frames 1` |
| **GIF** | `saveGif('output', 5)` —— 捕获 N 秒 | 按 'g' 保存 |
| **帧序列** | `saveFrames('frame', 'png', 10, 30)` —— 10 秒，30fps | 然后 `ffmpeg -i frame-%04d.png -c:v libx264 output.mp4` |
| **MP4** | Puppeteer 帧捕获 + ffmpeg | `bash scripts/render.sh sketch.html output.mp4 --duration 30 --fps 30` |
| **SVG** | 使用 p5.js-svg 的 `createCanvas(w, h, SVG)` | `save('output.svg')` |

### 第六步：质量验证

- **是否符合构想？** 将输出与创意概念进行比较。如果看起来普通，请返回第一步
- **分辨率检查**：在目标显示尺寸下是否清晰？是否有锯齿伪影？
- **性能检查**：在浏览器中是否能保持 60fps？（动画至少 30fps）
- **颜色检查**：颜色是否协调？在亮色和暗色显示器上测试
- **边缘情况**：在画布边缘会发生什么？调整大小时？运行 10 分钟后？

## 关键实现注意事项

### 性能 —— 首先禁用 FES

友好错误系统（FES）会带来高达 10 倍的性能开销。在每个生产环境草图中禁用它：

```javascript
p5.disableFriendlyErrors = true;  // 在 setup() 之前

function setup() {
  pixelDensity(1);  // 防止在视网膜屏幕上 2x-4x 过度绘制
  createCanvas(1920, 1080);
}
```

在热循环（粒子、像素操作）中，使用 `Math.*` 而不是 p5 的包装函数 —— 速度明显更快：

```javascript
// 在 draw() 或 update() 的热路径中：
let a = Math.sin(t);          // 不要用 sin(t)
let r = Math.sqrt(dx*dx+dy*dy); // 不要用 dist() —— 或者更好：跳过 sqrt，比较 magSq
let v = Math.random();        // 不要用 random() —— 当不需要种子时
let m = Math.min(a, b);       // 不要用 min(a, b)
```

切勿在 `draw()` 中使用 `console.log()`。切勿在 `draw()` 中操作 DOM。参见 `references/troubleshooting.md` § 性能。

### 种子随机性 —— 始终使用

每个生成式草图必须是可复现的。相同的种子，相同的输出。

```javascript
function setup() {
  randomSeed(CONFIG.seed);
  noiseSeed(CONFIG.seed);
  // 现在所有 random() 和 noise() 调用都是确定性的
}
```

切勿对生成内容使用 `Math.random()` —— 仅用于性能关键的非视觉代码。视觉元素始终使用 `random()`。如果你需要一个随机种子：`CONFIG.seed = floor(random(99999))`。

### 生成艺术平台支持（fxhash / Art Blocks）

对于生成艺术平台，请用平台的确定性随机数生成器替换 p5 的 PRNG：

```javascript
// fxhash 约定
const SEED = $fx.hash;              // 每次铸造唯一
const rng = $fx.rand;               // 确定性 PRNG
$fx.features({ palette: 'warm', complexity: 'high' });

// 在 setup() 中：
randomSeed(SEED);   // 用于 p5 的 noise()
noiseSeed(SEED);

// 用 rng() 替换 random() 以实现平台确定性
let x = rng() * width;  // 而不是 random(width)
```

参见 `references/export-pipeline.md` § 平台导出。

### 颜色模式 —— 使用 HSB

对于生成艺术，HSB（色相、饱和度、亮度）比 RGB 容易处理得多：

```javascript
colorMode(HSB, 360, 100, 100, 100);
// 现在：fill(色相, 饱和度, 亮度, 透明度)
// 旋转色相：fill((baseHue + offset) % 360, 80, 90)
// 去饱和：fill(色相, 饱和度 * 0.3, 亮度)
// 变暗：fill(色相, 饱和度, 亮度 * 0.5)
```

切勿硬编码原始 RGB 值。定义一个调色板对象，以程序化方式派生变体。参见 `references/color-systems.md`。

### 噪声 —— 多倍频程，而非原始噪声

原始 `noise(x, y)` 看起来像平滑的斑点。叠加倍频程以获得自然纹理：

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

对于流动的有机形态，使用**域扭曲**：将噪声输出反馈回噪声输入坐标。参见 `references/visual-effects.md`。

### createGraphics() 用于图层 —— 非可选

平面单次渲染看起来是平面的。使用离屏缓冲区进行合成：

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

### 性能 —— 尽可能向量化

p5.js 的绘制调用开销很大。对于成千上万的粒子：

```javascript
// 慢：单独的形状
for (let p of particles) {
  ellipse(p.x, p.y, p.size);
}

// 快：单个形状配合 beginShape()
beginShape(POINTS);
for (let p of particles) {
  vertex(p.x, p.y);
}
endShape();

// 最快：像素缓冲区用于海量计数
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

在单个页面嵌入多个草图或集成到框架中时必需。

### WebGL 模式陷阱

- `createCanvas(w, h, WEBGL)` —— 原点在中心，而非左上角
- Y 轴反转（在 WEBGL 中正 Y 向上，在 P2D 中正 Y 向下）
- `translate(-width/2, -height/2)` 以获得类似 P2D 的坐标
- 每次变换前后使用 `push()`/`pop()` —— 矩阵堆栈会静默溢出
- 在 `rect()`/`plane()` 之前使用 `texture()` —— 而非之后
- 自定义着色器：`createShader(vert, frag)` —— 在多个浏览器上测试

### 导出 —— 按键绑定约定

每个草图都应在 `keyPressed()` 中包含以下按键：

```javascript
function keyPressed() {
  if (key === 's' || key === 'S') saveCanvas('output', 'png');
  if (key === 'g' || key === 'G') saveGif('output', 5);
  if (key === 'r' || key === 'R') { randomSeed(millis()); noiseSeed(millis()); }
  if (key === ' ') CONFIG.paused = !CONFIG.paused;
}
```

### 无头视频导出 —— 使用 noLoop()

通过 Puppeteer 进行无头渲染时，草图**必须**在 setup 中使用 `noLoop()`。否则，p5 的 draw 循环会自由运行，而截图很慢 —— 草图会超前运行，导致帧跳过/重复。

```javascript
function setup() {
  createCanvas(1920, 1080);
  pixelDensity(1);
  noLoop();                    // 捕获脚本控制帧推进
  window._p5Ready = true;      // 向捕获脚本发出就绪信号
}
```

捆绑的 `scripts/export-frames.js` 会检测 `_p5Ready` 并在每次捕获时调用 `redraw()`，以实现精确的 1:1 帧对应。参见 `references/export-pipeline.md` § 确定性捕获。

对于多场景视频，请使用每片段架构：每个场景一个 HTML 文件，独立渲染，用 `ffmpeg -f concat` 拼接。参见 `references/export-pipeline.md` § 每片段架构。

### 智能体工作流

构建 p5.js 草图时：

1. **编写 HTML 文件** —— 单个自包含文件，所有代码内联
2. **在浏览器中打开** —— `open sketch.html`（macOS）或 `xdg-open sketch.html`（Linux）
3. **本地资源**（字体、图像）需要服务器：在项目目录中运行 `python3 -m http.server 8080`，然后打开 `http://localhost:8080/sketch.html`
4. **导出 PNG/GIF** —— 添加如上所示的 `keyPressed()` 快捷键，告诉用户按哪个键
5. **无头导出** —— `node scripts/export-frames.js sketch.html --frames 300` 用于自动帧捕获（草图必须使用 `noLoop()` + `_p5Ready`）
6. **MP4 渲染** —— `bash scripts/render.sh sketch.html output.mp4 --duration 30`
7. **迭代优化** —— 编辑 HTML 文件，用户刷新浏览器以查看更改
8. **按需加载参考** —— 使用 `skill_view(name="p5js", file_path="references/...")` 在实现过程中按需加载特定参考文件

## 性能目标

| 指标 | 目标 |
|--------|--------|
| 帧率（交互式） | 持续 60fps |
| 帧率（动画导出） | 最低 30fps |
| 粒子数量（P2D 形状） | 5,000-10,000（60fps 下） |
| 粒子数量（像素缓冲区） | 50,000-100,000（60fps 下） |
| 画布分辨率 | 最高 3840x2160（导出），1920x1080（交互式） |
| 文件大小（HTML） | &lt; 100KB（不含 CDN 库） |
| 加载时间 | &lt; 2 秒至首帧 |

## 参考文档

| 文件 | 内容 |
|------|----------|
| `references/core-api.md` | 画布设置、坐标系、绘制循环、`push()`/`pop()`、离屏缓冲区、合成模式、`pixelDensity()`、响应式设计 |
| `references/shapes-and-geometry.md` | 2D 基本图形、`beginShape()`/`endShape()`、贝塞尔/卡穆罗-罗姆曲线、`vertex()` 系统、自定义形状、`p5.Vector`、有向距离场、SVG 路径转换 |
| `references/visual-effects.md` | 噪声（Perlin、分形、域扭曲、旋度）、流场、粒子系统（物理、群集、轨迹）、像素操作、纹理生成（点画、排线、半色调）、反馈循环、反应-扩散 |
| `references/animation.md` | 基于帧的动画、缓动函数、`lerp()`/`map()`、弹簧物理、状态机、时间轴序列、基于 `millis()` 的计时、过渡模式 |
| `references/typography.md` | `text()`、`loadFont()`、`textToPoints()`、动态排版、文本遮罩、字体度量、响应式文本大小 |
| `references/color-systems.md` | `colorMode()`、HSB/HSL/RGB、`lerpColor()`、`paletteLerp()`、程序化调色板、色彩和谐、`blendMode()`、渐变渲染、精选调色板库 |
| `references/webgl-and-3d.md` | WEBGL 渲染器、3D 基本图形、相机、光照、材质、自定义几何体、GLSL 着色器（`createShader()`、`createFilterShader()`）、帧缓冲区、后处理 |
| `references/interaction.md` | 鼠标事件、键盘状态、触摸输入、DOM 元素、`createSlider()`/`createButton()`、音频输入（p5.sound FFT/振幅）、滚动驱动动画、响应式事件 |
| `references/export-pipeline.md` | `saveCanvas()`、`saveGif()`、`saveFrames()`、确定性无头捕获、ffmpeg 帧转视频、CCapture.js、SVG 导出、逐片段架构、平台导出（fxhash）、视频陷阱 |
| `references/troubleshooting.md` | 性能分析、每像素预算、常见错误、浏览器兼容性、WebGL 调试、字体加载问题、像素密度陷阱、内存泄漏、CORS |
| `templates/viewer.html` | 交互式查看器模板：种子导航（上一个/下一个/随机/跳转）、参数滑块、下载 PNG、响应式画布。从该模板开始创建可探索的生成艺术 |

---

## 创意发散（仅在用户要求实验性/创意性/独特输出时使用）

如果用户要求创意性、实验性、令人惊讶或非传统的输出，请选择最合适的策略，并在生成代码前推理其步骤。

- **概念融合** — 当用户指定要组合的两个事物或希望获得混合美学时
- **SCAMPER** — 当用户希望对已知的生成艺术模式进行改造时
- **远距离联想** — 当用户给出单一概念并希望探索时（“做一个关于时间的东西”）

### 概念融合
1. 命名两个不同的视觉系统（例如，粒子物理 + 手写）
2. 建立对应关系（粒子 = 墨滴，力 = 笔压，场 = 字母形状）
3. 选择性融合 — 保留能产生有趣涌现视觉效果的映射
4. 将融合编码为一个统一系统，而非两个并置的系统

### SCAMPER 变换
取一个已知的生成模式（流场、粒子系统、L-系统、元胞自动机）并系统地对其进行变换：
- **替代**：用文本字符替换圆形，用渐变替换线条
- **组合**：合并两个模式（流场 + 沃罗诺伊图）
- **适应**：将 2D 模式应用于 3D 投影
- **修改**：放大比例，扭曲坐标空间
- **用途**：将物理模拟用于排版，将排序算法用于颜色
- **消除**：移除网格、移除颜色、移除对称性
- **反转**：反向运行模拟，反转参数空间

### 远距离联想
1. 以用户的概念为锚点（例如，“孤独”）
2. 在三个距离上生成联想：
   - 近距离（明显）：空房间、单独的人、寂静
   - 中距离（有趣）：鱼群中一条游错方向的鱼、没有通知的手机、地铁车厢之间的间隙
   - 远距离（抽象）：质数、渐近曲线、凌晨 3 点的颜色
3. 发展中距离联想 — 它们足够具体以可视化，但又足够出人意料以产生趣味性