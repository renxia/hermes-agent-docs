---
title: "Pretext"
sidebar_label: "Pretext"
description: "在使用 @chenglou/pretext 构建创意浏览器演示时使用——为 ASCII 艺术、围绕障碍物的排版流、文本几何游戏、动态排版和文本驱动生成艺术提供无 DOM 文本布局。默认生成单文件 HTML 演示。"
---

{/* 本页面由网站脚本 /scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md 文件，而非此页面。 */}

# Pretext

在使用 @chenglou/pretext 构建创意浏览器演示时使用——为 ASCII 艺术、围绕障碍物的排版流、文本几何游戏、动态排版和文本驱动生成艺术提供无 DOM 文本布局。默认生成单文件 HTML 演示。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/pretext` |
| 版本 | `1.0.0` |
| 作者 | 赫尔墨斯智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `创意编程`, `排版`, `pretext`, `ascii-art`, `canvas`, `生成式`, `文本布局`, `动态排版` |
| 相关技能 | [`p5js`](/docs/user-guide/skills/bundled/creative/creative-p5js), [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw), [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram) |

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Pretext 创意演示

## 概述

[`@chenglou/pretext`](https://github.com/chenglou/pretext) 是由 Cheng Lou（React 核心成员、ReasonML、Midjourney）开发的一个 15KB 零依赖 TypeScript 库，用于**无 DOM 的多行文本测量与排版**。它只做一件事：给定 `(text, font, width)`，返回换行位置、每行宽度、每个字素的位置以及总高度——全部通过 canvas 测量完成，无需回流。

这听起来像是底层管道。但它不是。因为它速度快且具有几何特性，它是一种**创意原语**：你可以围绕移动的精灵以 60fps 重新排版段落；构建关卡几何由真实单词组成的游戏；用散文驱动 ASCII 徽标；将文本以精确的每个字素起始位置打碎成粒子；或者打包自适应多行 UI，完全不会触发任何 `getBoundingClientRect` 的抖动。

这个技能的存在是为了让 Hermes 能够用它制作**酷炫的演示**——那种人们会发到 X 上的内容。社区演示素材库请参见 `pretext.cool` 和 `chenglou.me/pretext`。

## 何时使用

当用户请求以下内容时使用：
- "pretext 演示" / "酷炫的 pretext 作品" / "文本即 X"
- 文本围绕移动形状流动（英雄区块、编辑排版、动画长页面）
- 使用**真实单词或散文**的 ASCII 艺术效果，而非等宽字体栅格
- 游戏场地 / 障碍物 / 砖块由文字组成的游戏（字母俄罗斯方块、散文打砖块）
- 带有逐字形物理效果的动态字体（粉碎、散射、群聚、流动）
- 字体生成艺术，尤其是非拉丁文字或混合文字
- 多行"自适应"UI（仍能容纳文本的最小容器宽度）
- 任何需要在渲染*之前*知道换行位置的场景

不适用于：
- CSS 已经能解决布局的静态 SVG/HTML 页面——直接用 CSS
- 富文本编辑器、通用内联格式引擎（pretext 刻意保持功能聚焦）
- 图片转文本（使用 `ascii-art` / `ascii-video` 技能）
- 没有文本角色的纯 canvas 生成艺术——使用 `p5js`

## 创意标准

这是在浏览器中渲染的视觉艺术。Pretext 返回的是数字；**你**来绘制它。

- **不要交付"hello world"演示。** `hello-orb-flow.html` 模板是*起点*。每个交付的演示都必须添加精心设计的色彩、运动、构图，以及一个用户没有要求但会欣赏的视觉细节。
- **深色背景，温暖核心，精心挑选的调色板。** 经典的琥珀色配黑色（CRT / 终端）效果很好，但冷白色配炭灰色（编辑风格）和低饱和度柔色（孔版印刷风格）也可以。选定一个并坚持使用。
- **比例字体是关键。** Pretext 的核心气质就是"不是等宽字体"——拥抱这一点。使用 Iowan Old Style、Inter、JetBrains Mono、Helvetica Neue 或可变字体。永远不要默认使用无衬线字体。
- **真实的来源/文本，不要 lorem ipsum。** 素材应该有意义。简短宣言、诗歌、真实源码、拾得文本、库自身的 README——永远不要用 `lorem ipsum`。
- **首次渲染即精彩。** 没有加载状态，没有空白帧。演示在打开的瞬间就必须看起来可以发布。

## 技术栈

每个演示一个自包含的 HTML 文件。无构建步骤。

| 层级 | 工具 | 用途 |
|-------|------|---------|
| 核心 | 通过 `esm.sh` CDN 使用 `@chenglou/pretext` | 文本测量 + 换行排版 |
| 渲染 | HTML5 Canvas 2D | 字形渲染、逐帧合成 |
| 分段 | `Intl.Segmenter`（内置） | 用于 emoji / CJK / 组合字符的字素分割 |
| 交互 | 原生 DOM 事件 | 鼠标 / 触摸 / 滚轮——无框架 |

```html
<script type="module">
import {
  prepare, layout,                   // 用例 1：简单高度
  prepareWithSegments, layoutWithLines,  // 用例 2a：固定宽度行
  layoutNextLineRange, materializeLineRange, // 用例 2b：流式 / 可变宽度
  measureLineStats, walkLineRanges,  // 无需字符串分配的统计
} from "https://esm.sh/@chenglou/pretext@0.0.6";
</script>
```

固定版本号。撰写时为 `@0.0.6`——如果演示行为异常，请检查 [npm](https://www.npmjs.com/package/@chenglou/pretext) 获取最新版本。

## 两种用例

几乎所有内容都可以归结为以下两种模式之一。两种都要掌握。

### 用例 1 —— 测量，然后用 CSS/DOM 渲染

```js
const prepared = prepare(text, "16px Inter");
const { height, lineCount } = layout(prepared, 320, 20);
```

你仍然让浏览器绘制文本。Pretext 只是告诉你在给定宽度下容器会有多高，**无需** DOM 读取。适用于：
- 行包含自动换文本的虚拟化列表
- 精确卡片高度的瀑布流布局
- "这个标签能放下吗？"的开发时检查
- 远程文本加载时防止布局偏移

**保持 `font` 和 `letterSpacing` 与你的 CSS 完全同步。** Canvas 的 `ctx.font` 格式（如 `"16px Inter"`、`"500 17px 'JetBrains Mono'"`）必须与渲染的 CSS 匹配，否则测量会漂移。

### 用例 2 —— 测量*并*自行渲染

```js
const prepared = prepareWithSegments(text, FONT);
const { lines } = layoutWithLines(prepared, 320, 26);
for (let i = 0; i < lines.length; i++) {
  ctx.fillText(lines[i].text, 0, i * 26);
}
```

创意工作就在这里。你掌控绘制，所以你可以：
- 渲染到 canvas、SVG、WebGL 或任何坐标系
- 为每个字形替换变换（旋转、抖动、缩放、透明度）
- 使用行元数据（宽度、字素位置）作为几何数据

用于**每行可变宽度**的流式排版（围绕形状的文本、环形带中的文本、非矩形列中的文本）：

```js
let cursor = { segmentIndex: 0, graphemeIndex: 0 };
let y = 0;
while (true) {
  const lineWidth = widthAtY(y);  // 你的函数：在这个 y 值处走廊有多宽？
  const range = layoutNextLineRange(prepared, cursor, lineWidth);
  if (!range) break;
  const line = materializeLineRange(prepared, range);
  ctx.fillText(line.text, leftEdgeAtY(y), y);
  cursor = range.end;
  y += lineHeight;
}
```

这是整个库中最重要的模式。正是它实现了"文本围绕被拖拽的精灵流动"——那个在 X 上爆火的演示。

### 值得了解的辅助函数

- `measureLineStats(prepared, maxWidth)` → `{ lineCount, maxLineWidth }` —— 最宽的行，即多行自适应宽度。
- `walkLineRanges(prepared, maxWidth, callback)` —— 无需分配字符串即可迭代各行。当你不需要字符本身而只需对字素进行统计/物理计算时使用。
- `@chenglou/pretext/rich-inline` —— 同一系统但适用于混合字体 / 标签 / 提及的段落。从子路径导入。

## 演示配方模式

社区素材库（参见 `references/patterns.md`）聚集为几种强势模式。选择一种并发挥——除非被要求，否则不要发明新的类别。

| 模式 | 关键 API | 示例创意 |
|---|---|---|
| **围绕障碍物重新排版** | `layoutNextLineRange` + 逐行宽度函数 | 编辑风格段落围绕拖拽的光标精灵分开 |
| **文本即几何游戏** | `layoutWithLines` + 逐行碰撞矩形 | 打砖块，其中每块砖是一个经过测量的单词 |
| **粉碎 / 粒子** | `walkLineRanges` → 逐字素 (x,y) → 物理 | 点击时爆炸成字母的句子 |
| **ASCII 障碍字体** | `layoutNextLineRange` + 逐行测量的障碍跨度 | 位图 ASCII 徽标、形状变形、可拖拽的线框对象，使文本围绕其实际几何形状展开 |
| **编辑风格多栏** | 每栏 `layoutNextLineRange` + 共享光标 | 带引用块的动画杂志版面 |
| **动态字体** | `layoutWithLines` + 随时间变化的逐行变换 | 星球大战字幕、波浪、弹跳、故障效果 |
| **多行自适应** | `measureLineStats` | 根据最紧凑容器自动调整大小的引用卡片 |

请参见 `templates/donut-orbit.html` 和 `templates/hello-orb-flow.html` 获取可运行的单文件入门示例。

## 工作流程

1. **根据用户的简要描述从上表中选择一个模式。**
2. **从模板开始**：
   - `templates/hello-orb-flow.html` —— 文本围绕移动球体重新排版（围绕障碍物重新排版模式）
   - `templates/donut-orbit.html` —— 高级示例：测量过的 ASCII 徽标障碍物、可拖拽的线框球体/立方体、变形形状场、可选中的 DOM 文本，以及仅开发模式的控制项
   - 使用 `write_file` 写入到 `/tmp/` 或用户工作空间中的新 `.html` 文件。
3. **替换素材**为与简要描述相关的有意义内容。真实散文，10-100 句，不要 lorem ipsum。
4. **调整美学**——字体、调色板、构图、交互。这才是核心工作；不要跳过。
5. **本地验证**：
   ```sh
   cd <dir-with-html> && python3 -m http.server 8765
   # 然后打开 http://localhost:8765/<file>.html
   ```
6. **检查控制台** —— 如果 `prepareWithSegments` 使用了错误的字体字符串调用，pretext 会抛出错误；`Intl.Segmenter` 在每个现代浏览器中都可用。
7. **向用户展示文件路径**，而不仅仅是代码——他们想打开它。

## 性能说明

- `prepare()` / `prepareWithSegments()` 是开销较大的调用。对于每个文本+字体组合，**只执行一次**。请缓存其句柄。
- 调整大小时，仅需重新运行 `layout()` / `layoutWithLines()` — **切勿**重新准备。
- 对于文本不变但几何形状逐帧变化的动画，在紧凑循环中使用 `layoutNextLineRange` 性能足够，可以在 60fps 下处理常规长度的段落。
- 当每帧渲染 ASCII 遮罩时，维护一个单元格缓冲区（`Uint8Array`/类型化数组），从单元格或投影几何体中得出每行的测量障碍区间，合并区间，然后在绘制文本前将这些区间输入 `layoutNextLineRange`。
- 保持视觉动画与布局动画同步。如果一个球体变形为立方体，使用相同的值同时对渲染的单元格缓冲区和障碍区间进行插值；否则演示看起来会像涂上去的，而非物理上重新流动。
- 对于淡入淡出效果，优先使用图层透明度，而不是改变字形强度或障碍物缩放。将临时 ASCII 精灵放在自己的画布上，并使用 CSS/GSAP 透明度来淡化画布，这样几何体就不会显得收缩。
- Canvas 的 `ctx.font` 设置速度出奇地慢；如果字体不变，**每帧只设置一次**，而不是每次 `fillText` 调用时都设置。

## 常见陷阱

1.  **CSS/Canvas 字体字符串不一致。** 测量时使用 `ctx.font = "16px Inter"`，但 CSS 声明的是 `font-family: Inter, sans-serif; font-size: 16px`。如果 Inter 字体加载成功则没问题。如果 Inter 404 加载失败，CSS 会回退到 sans-serif，导致测量结果偏移 5-20%。务必 `preload` 字体或使用网络安全的字体系列。

2.  **在动画循环内重新准备。** 只有 `layout*` 开销小。每帧重新调用 `prepare` 会严重影响性能。将准备好的句柄保持在模块作用域内。

3.  **在字形分割时忘记 `Intl.Segmenter`。** 表情符号、组合标记、CJK 字符 — `"é".split("")` 会返回两个字符。在采样单个可见字形时，请使用 `new Intl.Segmenter(undefined, { granularity: "grapheme" })`。

4.  **在没有 `extraWidth` 的情况下使用 `break: 'never'` 切片。** 在 `rich-inline` 中，如果为原子性切片/提及使用 `break: 'never'`，还必须为药丸填充提供 `extraWidth` — 否则切片的装饰部分会溢出容器。

5.  **从 `unpkg` 使用仅含 TypeScript 入口的 `@chenglou/pretext`。** 请使用 `esm.sh` — 它会自动将 TS 导出编译为浏览器可用的 ESM。`unpkg` 会返回 404 或提供原始 TS 文件。

6.  **等宽字体回退悄然使整个效果失效。** 用户看到类似等宽的输出时，通常是因为 CSS `font-family` 回退到了 `monospace`。请通过开发者工具验证实际渲染的字体。

7.  **围绕形状流动时，选择跳过行而非调整宽度。** 如果某行的通道太窄，无法容纳一行文字，*跳过该行*（`y += lineHeight; continue;`），而不是向 `layoutNextLineRange` 传递一个极小的 maxWidth — pretext 会返回单个字形的行，看起来像是断行。

8.  **发布一个冷启动演示。** 默认的首屏渲染看起来像教程级别。添加：晕影、细微的扫描线、空闲时的自动动画、一个精心选择的交互响应（拖拽、悬停、滚动、点击）。没有这些，“酷炫 pretext 演示”会沦为“README 的实习复现”。

## 验证清单

- [ ] 演示是一个自包含的 `.html` 文件 — 双击即可打开或使用 `python3 -m http.server`
- [ ] 通过 `esm.sh` 导入 `@chenglou/pretext` 并指定版本
- [ ] 语料是真实的文本段落，而非 Lorem Ipsum，并与演示的概念相符
- [ ] 传递给 `prepare` 的字体字符串与 CSS 字体完全匹配
- [ ] `prepare()` / `prepareWithSegments()` 只调用一次，而非每帧调用
- [ ] 深色背景 + 经过考虑的配色方案 — 不是默认的白色画布
- [ ] 至少有一个交互响应（拖拽/悬停/滚动/点击）或空闲自动动画
- [ ] 已在本地使用 `python3 -m http.server` 测试并确认控制台无错误
- [ ] 在中端笔记本电脑上达到 60fps（或记录了优雅降级方案）
- [ ] 一个用户未要求但额外增加的细节

## 参考：社区演示

克隆这些项目以获取灵感/模式（均为 MIT 类许可，链接来自 [pretext.cool](https://www.pretext.cool/)）：

- **Pretext Breaker** — 使用词砖的打砖块游戏 — `github.com/rinesh/pretext-breaker`
- **Tetris × Pretext** — `github.com/shinichimochizuki/tetris-pretext`
- **龙动画** — `github.com/qtakmalay/PreTextExperiments`
- **Somnai 编辑引擎** — `github.com/somnai-dreams/pretext-demos`
- **Bad Apple!! ASCII** — `github.com/frmlinn/bad-apple-pretext`
- **拖拽精灵重排** — `github.com/dokobot/pretext-demo`
- **Alarmy 编辑时钟** — `github.com/SmisLee/alarmy-pretext-demo`

官方演示场：[chenglou.me/pretext](https://chenglou.me/pretext/) — 手风琴、气泡、动态布局、编辑引擎、对齐比较、瀑布流、Markdown 聊天、富笔记。