---
title: "Pretext"
sidebar_label: "Pretext"
description: "适用于使用 @chenglou/pretext 构建创意浏览器演示——无 DOM 文本排版，用于 ASCII 艺术、围绕障碍物的排版流动、文本作为几何体的游戏、动态排版以及基于文本的生成艺术。默认生成单文件 HTML 演示。"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Pretext

适用于使用 @chenglou/pretext 构建创意浏览器演示——无 DOM 文本排版，用于 ASCII 艺术、围绕障碍物的排版流动、文本作为几何体的游戏、动态排版以及基于文本的生成艺术。默认生成单文件 HTML 演示。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/creative/pretext` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `creative-coding`, `typography`, `pretext`, `ascii-art`, `canvas`, `generative`, `text-layout`, `kinetic-typography` |
| 相关技能 | [`p5js`](/user-guide/skills/bundled/creative/creative-p5js), [`claude-design`](/user-guide/skills/bundled/creative/creative-claude-design), [`excalidraw`](/user-guide/skills/bundled/creative/creative-excalidraw), [`architecture-diagram`](/user-guide/skills/bundled/creative/creative-architecture-diagram) |

---
title: Pretext 创意演示
description: Pretext 创意演示的技能定义
slug: pretext-creative-demos
---

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Pretext 创意演示

## 概述

[`@chenglou/pretext`](https://github.com/chenglou/pretext) 是一个由 Cheng Lou（React 核心成员，ReasonML，Midjourney）创建的 15KB 零依赖 TypeScript 库，用于**无 DOM 的多行文本测量和布局**。它只做一件事：给定 `(文本, 字体, 宽度)`，返回断行、每行宽度、每个字素的位置以及总高度——全部通过 canvas 测量，无需回流。

这听起来像是管道工作。但它不是。因为它快速且基于几何计算，所以它是一种**创意原语**：你可以让段落围绕移动的精灵以 60fps 重新排列，构建关卡几何由真实文字构成的游戏，通过散文驱动 ASCII 标志，使用精确的每个字素起始位置将文本打散成粒子，或者打包收缩包装的多行 UI，而无需任何 `getBoundingClientRect` 的抖动。

这个技能的存在是为了让 Hermes 能用它制作**酷炫的演示**——那种人们会在 X 上发布的类型。社区演示合集请见 `pretext.cool` 和 `chenglou.me/pretext`。

## 何时使用

当用户要求以下内容时使用：
- 一个“pretext 演示” / “酷炫的 pretext 东西” / “文本作为 X”
- 文本围绕移动形状流动（英雄区、编辑布局、动画长页面）
- 使用**真实词语或散文**的 ASCII 艺术效果，而非等宽字体栅格
- 游戏场地/障碍物/砖块由文字构成的游戏（字母版俄罗斯方块、散文版打砖块）
- 具有每个字形物理效果的动态排版（打散、散开、群聚、流动）
- 排版生成艺术，特别是非拉丁文字或混合文字
- 多行“收缩包装” UI（仍能容纳文本的最小容器宽度）
- 任何需要在渲染*之前*知道断行位置的情况

不适用于：
- CSS 已经解决布局的静态 SVG/HTML 页面——直接使用 CSS
- 富文本编辑器、通用内联格式引擎（pretext 有意设计得狭窄）
- 图像 → 文本（使用 `ascii-art` / `ascii-video` 技能）
- 没有文本作用的纯 canvas 生成艺术——使用 `p5js`

## 创意标准

这是在浏览器中渲染的视觉艺术。Pretext 返回数字；**你**来绘制这个东西。

- **不要交付一个“你好世界”演示。** `hello-orb-flow.html` 模板是*起点*。每个交付的演示必须添加刻意的颜色、运动、构图，以及一个用户没要求但会欣赏的视觉细节。
- **深色背景，温暖的核心，经过考虑的调色板。** 经典的琥珀色配黑色（CRT/终端）效果不错，但冷白色配炭灰色（编辑风格）和去饱和的柔和色（孔版印刷）也可以。选择一种并坚持下去。
- **比例字体是关键。** Pretext 的整体氛围是“非等宽”——投入其中。使用 Iowan Old Style、Inter、JetBrains Mono、Helvetica Neue 或可变字体。永远不要默认使用无衬线字体。
- **真实的来源/文本，而非 Lorem ipsum。** 语料库应该有意义。简短的宣言、诗歌、真实的源代码、一段发现的文字、库本身的 README——永远不要用 `lorem ipsum`。
- **首次绘制就要出色。** 没有加载状态，没有空白帧。演示必须在打开的瞬间看起来就可发布。

## 技术栈

每个演示都是单个自包含 HTML 文件。无构建步骤。

| 层 | 工具 | 目的 |
|------|------|---------|
| 核心 | 通过 `esm.sh` CDN 引入 `@chenglou/pretext` | 文本测量 + 行布局 |
| 渲染 | HTML5 Canvas 2D | 字形渲染、每帧合成 |
| 分割 | `Intl.Segmenter`（内置） | 用于表情符号/中日韩/组合标记的字素分割 |
| 交互 | 原生 DOM 事件 | 鼠标/触摸/滚轮——无框架 |

```html
<script type="module">
import {
  prepare, layout,                   // 用例 1: 简单高度
  prepareWithSegments, layoutWithLines,  // 用例 2a: 固定宽度行
  layoutNextLineRange, materializeLineRange, // 用例 2b: 流式/可变宽度
  measureLineStats, walkLineRanges,  // 无需字符串分配的统计
} from "https://esm.sh/@chenglou/pretext@0.0.6";
</script>
```

固定版本。写作时是 `@0.0.6`——如果演示行为异常，请检查 [npm](https://www.npmjs.com/package/@chenglou/pretext) 获取最新版本。

## 两个用例

几乎所有东西都可以归结为以下两种形式之一。两者都要学习。

### 用例 1 — 测量，然后使用 CSS/DOM 渲染

```js
const prepared = prepare(text, "16px Inter");
const { height, lineCount } = layout(prepared, 320, 20);
```

你仍然让浏览器绘制文本。Pretext 只是告诉你在给定宽度下盒子有多高，而**无需** DOM 读取。用于：
- 行包含自动换行文本的虚拟化列表
- 具有精确卡片高度的瀑布流布局
- “这个标签放得下吗？”开发时检查
- 当远程文本加载时防止布局偏移

**保持 `font` 和 `letterSpacing` 与你的 CSS 完全同步。** canvas 的 `ctx.font` 格式（例如 `"16px Inter"`, `"500 17px 'JetBrains Mono'"`）必须与渲染的 CSS 匹配，否则测量值会偏移。

### 用例 2 — 测量*并*自己渲染

```js
const prepared = prepareWithSegments(text, FONT);
const { lines } = layoutWithLines(prepared, 320, 26);
for (let i = 0; i < lines.length; i++) {
  ctx.fillText(lines[i].text, 0, i * 26);
}
```

这是创意工作所在的地方。你拥有绘制权，所以你可以：
- 渲染到 canvas、SVG、WebGL 或任何坐标系
- 为每个字形替换变换（旋转、抖动、缩放、不透明度）
- 使用行元数据（宽度、字素位置）作为几何数据

对于**每行可变宽度**的流动（文本围绕形状、文本在环形带中、文本在非矩形列中）：

```js
let cursor = { segmentIndex: 0, graphemeIndex: 0 };
let y = 0;
while (true) {
  const lineWidth = widthAtY(y);  // 你的函数：在这个 y 值，走廊有多宽？
  const range = layoutNextLineRange(prepared, cursor, lineWidth);
  if (!range) break;
  const line = materializeLineRange(prepared, range);
  ctx.fillText(line.text, leftEdgeAtY(y), y);
  cursor = range.end;
  y += lineHeight;
}
```

这是整个库中最重要的模式。它解锁了“文本围绕拖动的精灵流动”——那个在 X 上疯传的演示。

### 值得了解的辅助函数

- `measureLineStats(prepared, maxWidth)` → `{ lineCount, maxLineWidth }` — 最宽的行，即多行收缩包装宽度。
- `walkLineRanges(prepared, maxWidth, callback)` — 迭代行而不分配字符串。当不需要字符本身时，用于对字素进行统计/物理计算。
- `@chenglou/pretext/rich-inline` — 相同的系统，但适用于混合字体/芯片/提及的段落。从子路径导入。

## 演示模式配方

社区语料库（见 `references/patterns.md`）聚集在少数几种强大的模式中。选择一种并即兴创作——除非被要求，否则不要发明新类别。

| 模式 | 关键 API | 示例想法 |
|---|---|---|
| **围绕障碍物流动** | `layoutNextLineRange` + 每行宽度函数 | 编辑段落围绕拖动的光标精灵分开 |
| **文本即几何游戏** | `layoutWithLines` + 每行碰撞矩形 | 打砖块，其中每块砖是一个测量过的单词 |
| **打散/粒子** | `walkLineRanges` → 每个字素 (x,y) → 物理 | 点击时句子爆炸成字母 |
| **ASCII 障碍物排版** | `layoutNextLineRange` + 测量过的每行障碍物跨度 | 位图 ASCII 标志、形状变形，以及可拖动的线框物体，使文本在其实际几何形状周围展开 |
| **编辑多栏** | 每列的 `layoutNextLineRange` + 共享光标 | 带有引述的动画杂志跨页 |
| **动态字体** | `layoutWithLines` + 随时间变化的每行变换 | 星球大战式爬行、波浪、弹跳、故障效果 |
| **多行收缩包装** | `measureLineStats` | 自动调整到最紧凑容器大小的引述卡片 |

参见 `templates/donut-orbit.html` 和 `templates/hello-orb-flow.html` 获取可工作的单文件起始模板。

## 工作流程

1. **选择一种模式**：根据用户的要求，从上表中选择一种模式。
2. **从模板开始**：
   - `templates/hello-orb-flow.html` — 围绕移动球体重新排列的文本（围绕障碍物流动模式）
   - `templates/donut-orbit.html` — 高级示例：测量过的 ASCII 标志障碍物、可拖动的线框球体/立方体、变形的形状场、可选的 DOM 文本以及仅开发时的控制。
   - 使用 `write_file` 将文件写入 `/tmp/` 或用户工作区的新 `.html` 文件。
3. **替换语料库**为与要求相关的真实散文，10-100 句，不要用 Lorem ipsum。
4. **调整美学** — 字体、调色板、构图、交互。这是重点，不要跳过。
5. **本地验证**：
   ```sh
   cd <目录包含html> && python3 -m http.server 8765
   # 然后打开 http://localhost:8765/<文件名>.html
   ```
6. **检查控制台** — 如果 `prepareWithSegments` 使用了错误的字体字符串，pretext 会抛出错误；`Intl.Segmenter` 在所有现代浏览器中都可用。
7. **向用户展示文件路径**，而不仅仅是代码——他们想要打开它。

## 性能注意事项

- `prepare()` / `prepareWithSegments()` 是开销较大的调用。请为每组文本+字体组合执行**一次**。请缓存该句柄。
- 调整大小时，仅重新运行 `layout()` / `layoutWithLines()` —— 永远不要重新执行 `prepare`。
- 对于文本内容不变但几何形状变化的逐帧动画，在紧密循环中使用 `layoutNextLineRange` 已经足够轻量，对于普通长度的段落，可以在60fps的每一帧都执行。
- 每帧渲染 ASCII 蒙版时，请保留一个单元格缓冲区（`Uint8Array`/类型化数组），从单元格或投影几何体中推导出每行测量出的障碍区间，合并区间，然后在绘制文本前将这些区间输入 `layoutNextLineRange`。
- 保持视觉动画和布局动画同步。如果一个球体变形为立方体，请使用相同的插值值同时补间渲染出的单元格缓冲区和障碍区间；否则演示看起来像是贴上去的，而不是物理重排的效果。
- 对于渐隐效果，优先使用图层透明度，而不是改变字形强度或障碍比例。将临时的 ASCII 精灵放在自己的画布上，并用 CSS/GSAP 透明度来渐隐该画布，这样几何体就不会显得收缩。
- Canvas 的 `ctx.font` 设置出乎意料地慢；如果字体不变，请**每帧设置一次**，而不是每次 `fillText` 调用都设置。

## 常见陷阱

1.  **CSS/Canvas 字体字符串不一致。** 测量时使用 `ctx.font = "16px Inter"`，但 CSS 设置为 `font-family: Inter, sans-serif; font-size: 16px`。这在 Inter 字体加载成功时**没问题**。但如果 Inter 404 了，CSS 会回退到 sans-serif，测量结果就会偏移 5-20%。请务必 `preload` 字体，或使用 Web 安全字体族。

2.  **在动画循环内重新执行 `prepare`。** 只有 `layout*` 是轻量的。每帧重新调用 `prepare` 会严重影响性能。请将准备好的句柄保存在模块作用域中。

3.  **在分词字形时忘记使用 `Intl.Segmenter`。** 对于表情符号、组合标记、CJK 字符 —— `"é".split("")` 会得到两个字符。在采样单个可见字形时，请使用 `new Intl.Segmenter(undefined, { granularity: "grapheme" })`。

4.  **使用 `break: 'never'` 但没有设置 `extraWidth`。** 在 `rich-inline` 中，如果你为原子性的标签/提及使用了 `break: 'never'`，还必须为胶囊形状的内边距提供 `extraWidth` —— 否则标签的边框会溢出容器。

5.  **在 TypeScript-only 入口使用 `@chenglou/pretext` 和 `unpkg`。** 请使用 `esm.sh` —— 它会自动将 TypeScript 导出编译为浏览器可用的 ESM。`unpkg` 会返回 404 或提供原始的 TypeScript 文件。

6.  **单等宽回退字体悄然消解了重点。** 用户看到看起来是等宽字体的输出时，通常是 CSS 的 `font-family` 回退到了 `monospace`。请通过开发者工具验证实际渲染的字体。

7.  **绕开形状流动时，跳过行与调整宽度的区别。** 如果当前行的通道太窄，无法容纳一行文本，那么请**跳过该行**（`y += lineHeight; continue;`），而不是传递一个很小的 `maxWidth` 给 `layoutNextLineRange` —— pretext 会返回只有单个字形的行，看起来会断裂。

8.  **发布一个冷冰冰的演示。** 默认的首次画面看起来像教程级别。请添加：暗角、轻微的扫描线效果、闲置时自动运动、一个精心设计的交互响应（拖动、悬停、滚动、点击）。如果没有这些，"酷炫的 pretext 演示" 会让人觉得是 "README 的实习生复制品"。

## 验证清单

- [ ] 演示是一个单独的、自包含的 `.html` 文件 —— 双击或使用 `python3 -m http.server` 即可打开
- [ ] `@chenglou/pretext` 通过 `esm.sh` 导入，并固定了版本
- [ ] 语料是真实散文，不是乱语填充文本，且符合演示的概念
- [ ] 传递给 `prepare` 的字体字符串与 CSS 字体完全匹配
- [ ] `prepare()` / `prepareWithSegments()` 只调用一次，不是每帧调用
- [ ] 深色背景 + 精心挑选的配色方案 —— 而非默认的白色画布
- [ ] 至少有一个交互响应（拖动 / 悬停 / 滚动 / 点击）或闲置自动运动
- [ ] 使用 `python3 -m http.server` 在本地测试过，并确认没有控制台错误
- [ ] 在中端笔记本电脑上能达到 60fps（或已记录优雅降级方案）
- [ ] 有一个用户未要求但你额外添加的 "超越期待" 的细节

## 参考：社区演示

克隆这些项目以获取灵感/模式（均为 MIT 类许可，来自 [pretext.cool](https://www.pretext.cool/) 链接）：

- **Pretext Breaker** —— 用文字砖块玩打砖块游戏 —— `github.com/rinesh/pretext-breaker`
- **俄罗斯方块 × Pretext** —— `github.com/shinichimochizuki/tetris-pretext`
- **龙动画** —— `github.com/qtakmalay/PreTextExperiments`
- **Somnai 编辑引擎** —— `github.com/somnai-dreams/pretext-demos`
- **Bad Apple!! ASCII** —— `github.com/frmlinn/bad-apple-pretext`
- **拖拽精灵重排** —— `github.com/dokobot/pretext-demo`
- **Alarmy 编辑时钟** —— `github.com/SmisLee/alarmy-pretext-demo`

官方游乐场：[chenglou.me/pretext](https://chenglou.me/pretext/) —— 手风琴、气泡、动态布局、编辑引擎、对齐对比、网格布局、Markdown 聊天、富文本笔记。