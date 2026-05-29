---
title: "Pretext"
sidebar_label: "Pretext"
description: "当使用 @chenglou/pretext 构建创意浏览器演示时使用 —— 无需 DOM 的文本布局，适用于 ASCII 艺术、围绕障碍物的排版流动、文本作为几何体的游戏、动态排版和文本驱动的生成艺术。默认生成单文件 HTML 演示。"
---

{/* 此页面由网站脚本 `generate-skill-docs.py` 从该技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Pretext

当使用 `@chenglou/pretext` 构建创意浏览器演示时使用 —— 无需 DOM 的文本布局，适用于 ASCII 艺术、围绕障碍物的排版流动、文本作为几何体的游戏、动态排版和文本驱动的生成艺术。默认生成单文件 HTML 演示。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑 (默认安装) |
| 路径 | `skills/creative/pretext` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `创意编程`, `排版`, `pretext`, `ascii-艺术`, `canvas`, `生成式`, `文本布局`, `动态排版` |
| 相关技能 | [`p5js`](/docs/user-guide/skills/bundled/creative/creative-p5js), [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw), [`架构图`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram) |

:::info
以下是 Hermes 加载该技能时使用的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Pretext 创意演示

## 概述

[`@chenglou/pretext`](https://github.com/chenglou/pretext) 是由 Cheng Lou (React 核心、ReasonML、Midjourney) 开发的一个 15KB 零依赖的 TypeScript 库，用于**无 DOM 多行文本测量和布局**。它只做一件事：给定 `(文本, 字体, 宽度)`，返回换行位置、每行宽度、每个字形的位置和总高度——全部通过 canvas 测量，不触发重排。

这听起来像底层管道工作。但它并非如此。因为它速度快且基于几何计算，它是一个**创意原语**：你可以以 60fps 的速度让段落围绕移动的精灵重新流动；构建关卡几何结构由真实单词组成的游戏；通过散文驱动 ASCII 标志；使用精确的每个字形起始位置将文本粉碎成粒子；或者打包收缩包裹的多行 UI，而无需任何 `getBoundingClientRect` 的抖动。

这个技能的存在是为了让 Hermes 能用它制作**酷炫的演示**——那种人们会发到 X 上的东西。查看 `pretext.cool` 和 `chenglou.me/pretext` 了解社区演示库。

## 何时使用

当用户询问以下内容时使用：
- 一个 "pretext 演示" / "酷炫的 pretext 东西" / "文本即X"
- 文本围绕移动形状流动（英雄区、编辑布局、动画长页面）
- 使用**真实单词或散文**的 ASCII 艺术效果，而非等宽光栅
- 游戏场地/障碍物/砖块由文本构成的游戏（字母版俄罗斯方块、散文打砖块）
- 带有逐字形物理效果的动态排版（粉碎、散射、群聚、流动）
- 排版生成艺术，特别是非拉丁文字或混合文字
- 多行“收缩包裹” UI（仍能容纳文本的最小容器宽度）
- 任何需要**在渲染前**知道换行位置的场景

不要用于：
- CSS 已解决布局问题的静态 SVG/HTML 页面——直接使用 CSS
- 富文本编辑器、通用内联格式引擎（pretext 有意保持窄范围）
- 图片 → 文本（使用 `ascii-art` / `ascii-video` 技能）
- 纯 canvas 生成艺术，文本不作为角色——使用 `p5js`

## 创意标准

这是在浏览器中呈现的视觉艺术。Pretext 返回的是数字；**你**来绘制它。
- **不要交付一个“你好世界”演示。** `hello-orb-flow.html` 模板只是*起点*。每个交付的演示都必须添加刻意的颜色、运动、构图，以及用户没有要求但会欣赏的一个视觉细节。
- **深色背景，温暖的内核，考虑过的调色板。** 经典的琥珀色黑底 (CRT / 终端) 效果不错，但冷白色炭底（编辑风格）和去饱和的淡彩（孔版印刷）也可以。选择一种并坚持。
- **比例字体是重点。** Pretext 的整体氛围就是“非等宽”——拥抱它。使用 Iowan Old Style、Inter、JetBrains Mono、Helvetica Neue 或可变字体。永远不要默认无衬线体。
- **真实的来源/文本，而非 lorem ipsum。** 语料库应该有意义。简短宣言、诗歌、真实源代码、找到的文本、库自身的 README——绝不使用 `lorem ipsum`。
- **首次绘制优秀。** 无加载状态，无空白帧。演示必须在打开瞬间看起来就可交付。

## 技术栈

每个演示一个自包含的 HTML 文件。无构建步骤。

| 层级 | 工具 | 用途 |
|-------|------|---------|
| 核心 | 通过 `esm.sh` CDN 使用 `@chenglou/pretext` | 文本测量 + 行布局 |
| 渲染 | HTML5 Canvas 2D | 字形渲染，逐帧合成 |
| 分词 | `Intl.Segmenter` (内置) | 用于表情符号 / 中日韩 / 组合标记的字形分割 |
| 交互 | 原生 DOM 事件 | 鼠标 / 触摸 / 滚轮——无框架 |

```html
<script type="module">
import {
  prepare, layout,                   // 用例 1：简单高度
  prepareWithSegments, layoutWithLines,  // 用例 2a：固定宽度行
  layoutNextLineRange, materializeLineRange, // 用例 2b：流式 / 可变宽度
  measureLineStats, walkLineRanges,  // 不分配字符串的统计
} from "https://esm.sh/@chenglou/pretext@0.0.6";
</script>
```

固定版本。撰写时为 `@0.0.6`——如果演示行为异常，请检查 [npm](https://www.npmjs.com/package/@chenglou/pretext) 获取最新版本。

## 两个用例

几乎所有内容都归结为以下两种模式之一。两者都要学习。

### 用例 1 — 测量，然后用 CSS/DOM 渲染

```js
const prepared = prepare(text, "16px Inter");
const { height, lineCount } = layout(prepared, 320, 20);
```

你仍然让浏览器绘制文本。Pretext 只是告诉你在给定宽度下盒子会有多高，**而无需** DOM 读取。用于：
- 行包含换接文本的虚拟化列表
- 具有精确卡片高度的瀑布流布局
- “这个标签能放下吗？”开发时检查
- 防止远程文本加载时的布局偏移

**保持 `font` 和 `letterSpacing` 与 CSS 完全同步。** Canvas 的 `ctx.font` 格式（例如 `"16px Inter"`、`"500 17px 'JetBrains Mono'"`）必须与渲染的 CSS 匹配，否则测量会漂移。

### 用例 2 — 测量*并*自己渲染

```js
const prepared = prepareWithSegments(text, FONT);
const { lines } = layoutWithLines(prepared, 320, 26);
for (let i = 0; i < lines.length; i++) {
  ctx.fillText(lines[i].text, 0, i * 26);
}
```

创意工作在这里进行。你拥有绘制权，因此你可以：
- 渲染到 canvas、SVG、WebGL 或任何坐标系
- 替换逐字形变换（旋转、抖动、缩放、不透明度）
- 使用行元数据（宽度、字形位置）作为几何数据

对于**每行可变宽度**的流动（围绕形状的文本、圆环带中的文本、非矩形列中的文本）：

```js
let cursor = { segmentIndex: 0, graphemeIndex: 0 };
let y = 0;
while (true) {
  const lineWidth = widthAtY(y);  // 你的函数：这个 y 处的走廊有多宽？
  const range = layoutNextLineRange(prepared, cursor, lineWidth);
  if (!range) break;
  const line = materializeLineRange(prepared, range);
  ctx.fillText(line.text, leftEdgeAtY(y), y);
  cursor = range.end;
  y += lineHeight;
}
```

这是整个库中最重要的模式。它解锁了“文本围绕拖动的精灵流动”——在 X 上疯传的那个演示。

### 值得了解的辅助函数

- `measureLineStats(prepared, maxWidth)` → `{ lineCount, maxLineWidth }` — 最宽的行，即多行收缩包裹宽度。
- `walkLineRanges(prepared, maxWidth, callback)` — 迭代行而不分配字符串。当你不需要字符本身时，用于对字形进行统计/物理计算。
- `@chenglou/pretext/rich-inline` — 同一系统，但用于混合字体/标签/提及的段落。从子路径导入。

## 演示食谱模式

社区语料库（见 `references/patterns.md`）聚类为几种强模式。选择一种并即兴发挥——除非被要求，否则不要发明新类别。

| 模式 | 关键 API | 示例想法 |
|---|---|---|
| **围绕障碍物流动** | `layoutNextLineRange` + 逐行宽度函数 | 编辑段落围绕拖动的光标精灵分开 |
| **文本即几何游戏** | `layoutWithLines` + 逐行碰撞矩形 | 打砖块，每块砖是一个测量过的单词 |
| **粉碎/粒子** | `walkLineRanges` → 逐字形 (x,y) → 物理 | 点击时爆炸成字母的句子 |
| **ASCII 障碍物排版** | `layoutNextLineRange` + 测量的逐行障碍物跨度 | 位图 ASCII 标志，形状变形，可拖动的线框物体使文本围绕其实际几何形状打开 |
| **编辑多栏** | 每栏 `layoutNextLineRange` + 共享光标 | 带有醒目引文的动画杂志版面 |
| **动态排版** | `layoutWithLines` + 逐行随时间变换 | 星球大战字幕、波浪、弹跳、故障 |
| **多行收缩包裹** | `measureLineStats` | 自动调整到最紧密容器的引言卡片 |

查看 `templates/donut-orbit.html` 和 `templates/hello-orb-flow.html` 获取可工作的单文件启动器。

## 工作流程

1.  **根据用户简报从上表中选择一个模式。**
2.  **从模板开始**：
    *   `templates/hello-orb-flow.html` — 围绕移动球体流动的文本（围绕障碍物流动模式）
    *   `templates/donut-orbit.html` — 高级示例：测量的 ASCII 标志障碍物、可拖动的线框球体/立方体、变形形状场、可选的 DOM 文本和仅开发控制项
    *   `write_file` 到 `/tmp/` 或用户工作区中的新 `.html` 文件。
3.  **替换语料库**为与简报相关的有意内容。真实的散文，10-100 句，不要 lorem ipsum。
4.  **调整美学** — 字体、调色板、构图、交互。这是工作重点；不要跳过。
5.  **本地验证**：
    ```sh
    cd <dir-with-html> && python3 -m http.server 8765
    # 然后打开 http://localhost:8765/<file>.html
    ```
6.  **检查控制台** — 如果 `prepareWithSegments` 使用了错误的字体字符串，pretext 会抛出异常；`Intl.Segmenter` 在每个现代浏览器中都可用。
7.  **向用户展示文件路径**，而不仅仅是代码——他们想打开它。

## 性能说明

- `prepare()` / `prepareWithSegments()` 是开销较大的调用。对于每个文本+字体组合，请仅执行**一次**。缓存句柄。
- 在调整大小时，只需重新运行 `layout()` / `layoutWithLines()` —— **切勿**重新准备。
- 对于文本不变但几何形状变化的逐帧动画，在紧密循环中执行 `layoutNextLineRange` 对于普通长度的段落，即使以60fps逐帧运行也足够便宜。
- 每帧渲染ASCII掩码时，保留一个单元缓冲区（`Uint8Array`/类型化数组），从单元或投影几何形状中推导出每行的测量障碍跨度，合并跨度，然后在绘制文本前将这些跨度输入到 `layoutNextLineRange`。
- 保持视觉动画与布局动画同步。如果一个球体变形为立方体，请使用相同的值同时对渲染的单元缓冲区和障碍跨度进行补间；否则演示看起来像是贴上去的，而不是物理上重新流动的。
- 对于淡入淡出，优先使用图层透明度，而非改变字形强度或障碍比例。将瞬态ASCII精灵放在单独的画布上，并使用CSS/GSAP的不透明度淡化该画布，这样几何形状不会显得缩小。
- 令人惊讶的是，设置Canvas的 `ctx.font` 很慢；如果字体不变，请**每帧设置一次**，而不是每次调用 `fillText` 时设置。

## 常见陷阱

1.  **CSS/Canvas字体字符串漂移。** `ctx.font = "16px Inter"` 用于测量，但CSS中写的是 `font-family: Inter, sans-serif; font-size: 16px`。这没问题，*如果* Inter字体加载成功。如果Inter返回404，CSS会回退到sans-serif，导致测量值漂移5-20%。始终 `preload` 该字体或使用网页安全字体族。

2.  **在动画循环中重新准备。** 只有 `layout*` 是开销较小的。每帧重新调用 `prepare` 将严重影响性能。将准备好的句柄保存在模块作用域中。

3.  **忘记使用 `Intl.Segmenter` 进行字素分割。** 表情符号、组合标记、中日韩字符 —— `"é".split("")` 会得到两个字符。在采样单个可见字形时，请使用 `new Intl.Segmenter(undefined, { granularity: "grapheme" })`。

4.  **使用 `break: 'never'` 的芯片没有 `extraWidth`。** 在 `rich-inline` 中，如果你为原子化的芯片/提及使用 `break: 'never'`，你**必须**同时为药丸状填充提供 `extraWidth` —— 否则芯片的装饰部分会溢出容器。

5.  **从 `unpkg` 使用仅提供TypeScript入口的 `@chenglou/pretext`。** 请使用 `esm.sh` —— 它会自动将TS导出编译为浏览器可用的ESM。`unpkg` 会返回404或提供原始TS。

6.  **单字体回退默默地让一切失去意义。** 用户看到类似单字体的输出时，通常是因为CSS的 `font-family` 回退到了 `monospace`。请通过开发者工具验证实际渲染的字体。

7.  **围绕形状流动时：跳过行 vs 调整宽度。** 如果当前行的通道太窄，无法容纳一行文本，*请跳过该行*（`y += lineHeight; continue;`），而不是将一个很小的maxWidth传递给 `layoutNextLineRange` —— pretext会返回单字形的行，看起来会断行。

8.  **发布一个冷启动的演示。** 默认的首次绘制看起来很初级。请添加：晕影、微妙的扫描线、空闲时的自动运动、一个精心选择的交互响应（拖动、悬停、滚动、点击）。没有这些，“酷炫的pretext演示”会沦为“README的实习生复现”。

## 验证清单

- [ ] 演示是一个自包含的 `.html` 文件 —— 双击或使用 `python3 -m http.server` 即可打开
- [ ] 通过带有固定版本的 `esm.sh` 导入 `@chenglou/pretext`
- [ ] 语料是真实的文本，而非乱数假文，且与演示概念匹配
- [ ] 传递给 `prepare` 的字体字符串与CSS字体**完全一致**
- [ ] `prepare()` / `prepareWithSegments()` 仅调用一次，而非每帧调用
- [ ] 深色背景 + 经过配色考虑 —— 不是默认的白色画布
- [ ] 至少有一个交互响应（拖动/悬停/滚动/点击）或空闲自动运动
- [ ] 使用 `python3 -m http.server` 在本地测试并确认没有控制台错误
- [ ] 在中端笔记本电脑上达到60fps（或记录了优雅降级方案）
- [ ] 一个用户没要求的“额外努力”细节

## 参考：社区演示

克隆这些项目以获取灵感/模式（全部为MIT许可，链接来自 [pretext.cool](https://www.pretext.cool/)）：

- **Pretext Breaker** —— 使用单词砖块的打砖块游戏 —— `github.com/rinesh/pretext-breaker`
- **俄罗斯方块 × Pretext** —— `github.com/shinichimochizuki/tetris-pretext`
- **龙动画** —— `github.com/qtakmalay/PreTextExperiments`
- **Somnai 编辑引擎** —— `github.com/somnai-dreams/pretext-demos`
- **Bad Apple!! ASCII版** —— `github.com/frmlinn/bad-apple-pretext`
- **拖动精灵重排** —— `github.com/dokobot/pretext-demo`
- **Alarmy 编辑时钟** —— `github.com/SmisLee/alarmy-pretext-demo`

官方沙盒：[chenglou.me/pretext](https://chenglou.me/pretext/) —— 手风琴、气泡、动态布局、编辑引擎、对齐对比、瀑布流、Markdown聊天、富文本笔记。