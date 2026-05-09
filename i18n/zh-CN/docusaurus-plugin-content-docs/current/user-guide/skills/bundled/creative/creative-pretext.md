---
title: "Pretext"
sidebar_label: "Pretext"
description: "在构建使用 @chenglou/pretext 的创意浏览器演示时使用 — 适用于 ASCII 艺术、绕过障碍物的排版流、文本作为几何体的游戏、动态排版以及文本驱动生成艺术的 DOM 无关文本布局..."
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Pretext

在构建使用 @chenglou/pretext 的创意浏览器演示时使用 — 适用于 ASCII 艺术、绕过障碍物的排版流、文本作为几何体的游戏、动态排版以及文本驱动生成艺术的 DOM 无关文本布局。默认生成单文件 HTML 演示。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/creative/pretext` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 标签 | `creative-coding`, `typography`, `pretext`, `ascii-art`, `canvas`, `generative`, `text-layout`, `kinetic-typography` |
| 相关技能 | [`p5js`](/docs/user-guide/skills/bundled/creative/creative-p5js), [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw), [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Pretext 创意演示

## 概述

[`@chenglou/pretext`](https://github.com/chenglou/pretext) 是由 Cheng Lou（React 核心、ReasonML、Midjourney）编写的一个 15KB、零依赖的 TypeScript 库，用于 **无 DOM 的多行文本测量与布局**。它只做一件事：给定 `(文本, 字体, 宽度)`，返回换行位置、每行宽度、每个字素的位置以及总高度 —— 全部通过 canvas 测量实现，无需重排。

这听起来像是底层 plumbing。但它不是。因为它速度快且具有几何特性，所以它是一个**创意原语**：你可以在 60fps 下让段落围绕移动的精灵重排，构建关卡几何由真实单词构成的游戏，让 ASCII 标志在散文中穿梭，将文本精确地破碎成粒子（每个字素都有精确的起始位置），或者打包“收缩包裹”的多行 UI，而无需任何 `getBoundingClientRect` 抖动。

此技能的存在是为了让 Hermes 能够用它制作**酷炫的演示** —— 人们会发布到 X 的那种。请参阅 `pretext.cool` 和 `chenglou.me/pretext` 查看社区演示集。

## 何时使用

当用户要求以下内容时使用：
- “pretext 演示” / “酷炫的 pretext 东西” / “文本作为 X”
- 文本围绕移动形状流动（英雄区块、编辑布局、动画长页面）
- 使用**真实单词或散文**（而非等宽光栅）的 ASCII 艺术效果
- 游戏场地/障碍物/砖块由文本构成的游戏（字母俄罗斯方块、散文打砖块）
- 具有逐字形物理效果的动态排版（破碎、散射、群集、流动）
- 排版生成艺术，尤其是非拉丁脚本或混合脚本
- 多行“收缩包裹” UI（能容纳文本的最小容器宽度）
- 任何需要在渲染*之前*知道换行位置的情况

不要用于：
- 静态 SVG/HTML 页面，其中 CSS 已解决布局问题 —— 直接使用 CSS
- 富文本编辑器、通用内联格式化引擎（pretext 故意设计得很窄）
- 图像 → 文本（使用 `ascii-art` / `ascii-video` 技能）
- 纯 canvas 生成艺术，且文本无作用 —— 使用 `p5js`

## 创意标准

这是在浏览器中渲染的视觉艺术。Pretext 返回数字；**你**负责绘制内容。

- **不要交付“hello world”演示。** `hello-orb-flow.html` 模板是*起点*。每个交付的演示都必须有意添加颜色、运动、构图，以及一个用户未要求但会欣赏的视觉细节。
- **深色背景，温暖核心，精心调色板。** 经典的琥珀色配黑色（CRT / 终端）有效，但冷白色配炭黑（编辑风格）和去饱和的粉彩（risograph）也很好。选择一种并坚持使用。
- **比例字体是重点。** Pretext 的整体氛围是“非等宽” —— 要充分利用这一点。使用 Iowan Old Style、Inter、JetBrains Mono、Helvetica Neue 或可变字体。永远不要默认使用无衬线字体。
- **真实源文本，而非 lorem ipsum。** 语料库应有意义。短宣言、诗歌、真实源代码、发现的文本、库自身的 README —— 永远不要使用 `lorem ipsum`。
- **首次渲染即优秀。** 无加载状态，无空白帧。演示必须一打开就看起来可交付。

## 技术栈

每个演示一个独立的 HTML 文件。无需构建步骤。

| 层级 | 工具 | 用途 |
|-------|------|---------|
| 核心 | 通过 `esm.sh` CDN 引入 `@chenglou/pretext` | 文本测量 + 行布局 |
| 渲染 | HTML5 Canvas 2D | 字形渲染，逐帧合成 |
| 分割 | `Intl.Segmenter`（内置） | 字素分割，用于表情符号 / CJK / 组合标记 |
| 交互 | 原生 DOM 事件 | 鼠标 / 触摸 / 滚轮 —— 无框架 |

```html
<script type="module">
import {
  prepare, layout,                   // 用例 1: 简单高度
  prepareWithSegments, layoutWithLines,  // 用例 2a: 固定宽度行
  layoutNextLineRange, materializeLineRange, // 用例 2b: 流式 / 可变宽度
  measureLineStats, walkLineRanges,  // 无需字符串分配的统计
} from "https://esm.sh/@chenglou/pretext@0.0.6";
</script>
```

固定版本。撰写本文时为 `@0.0.6` —— 如果演示行为异常，请检查 [npm](https://www.npmjs.com/package/@chenglou/pretext) 获取最新版本。

## 两个用例

几乎所有内容都可以归结为以下两种模式之一。请学习两者。

### 用例 1 —— 测量，然后使用 CSS/DOM 渲染

```js
const prepared = prepare(text, "16px Inter");
const { height, lineCount } = layout(prepared, 320, 20);
```

你仍然让浏览器绘制文本。Pretext 只是告诉你，在给定宽度下，盒子会有多高，**而无需**读取 DOM。适用于：
- 包含换行文本的虚拟化列表
- 具有精确卡片高度的瀑布流
- “此标签是否合适？”开发时检查
- 防止远程文本加载时的布局偏移

**保持 `font` 和 `letterSpacing` 与你的 CSS 完全同步。** Canvas 的 `ctx.font` 格式（例如 `"16px Inter"`、`"500 17px 'JetBrains Mono'"`）必须与渲染的 CSS 匹配，否则测量结果会漂移。

### 用例 2 —— 测量*并*自行渲染

```js
const prepared = prepareWithSegments(text, FONT);
const { lines } = layoutWithLines(prepared, 320, 26);
for (let i = 0; i < lines.length; i++) {
  ctx.fillText(lines[i].text, 0, i * 26);
}
```

创意工作就在这里。你拥有绘制权，因此你可以：
- 渲染到 canvas、SVG、WebGL 或任何坐标系
- 替换逐字形变换（旋转、抖动、缩放、不透明度）
- 使用行元数据（宽度、字素位置）作为几何信息

对于**每行可变宽度**的流动（文本围绕形状、文本在环形带中、文本在非矩形列中）：

```js
let cursor = { segmentIndex: 0, graphemeIndex: 0 };
let y = 0;
while (true) {
  const lineWidth = widthAtY(y);  // 你的函数：在此 y 位置，通道有多宽？
  const range = layoutNextLineRange(prepared, cursor, lineWidth);
  if (!range) break;
  const line = materializeLineRange(prepared, range);
  ctx.fillText(line.text, leftEdgeAtY(y), y);
  cursor = range.end;
  y += lineHeight;
}
```

这是整个库中最重要的模式。它解锁了“文本围绕拖动的精灵流动” —— 在 X 上走红的演示。

### 值得了解的辅助函数

- `measureLineStats(prepared, maxWidth)` → `{ lineCount, maxLineWidth }` —— 最宽的行，即多行收缩包裹宽度。
- `walkLineRanges(prepared, maxWidth, callback)` —— 遍历行而无需分配字符串。当你不需要字符本身，而需要对字素进行统计/物理计算时，请使用此函数。
- `@chenglou/pretext/rich-inline` —— 相同的系统，但用于混合字体 / 芯片 / 提及的段落。从子路径导入。

## 演示配方模式

社区语料库（参见 `references/patterns.md`）可归纳为少数几种强模式。选择一种并进行变奏 —— 除非被要求，否则不要发明新类别。

| 模式 | 关键 API | 示例想法 |
|---|---|---|
| **围绕障碍物重排** | `layoutNextLineRange` + 每行宽度函数 | 编辑段落围绕拖动的游标精灵分开 |
| **文本即几何游戏** | `layoutWithLines` + 每行碰撞矩形 | 打砖块游戏，其中每个砖块都是一个测量过的单词 |
| **破碎 / 粒子** | `walkLineRanges` → 每个字素 (x,y) → 物理 | 点击时句子爆炸成字母 |
| **ASCII 障碍物排版** | `layoutNextLineRange` + 测量的每行障碍物跨度 | 位图 ASCII 标志，形状变形，以及可拖动的线状球体/立方体，使文本围绕其实际几何形状打开 |
| **编辑多列** | 每列 `layoutNextLineRange` + 共享游标 | 带有拉引号的动画杂志版面 |
| **动态排版** | `layoutWithLines` + 随时间变化的每行变换 | 星球大战爬行，波浪，弹跳，故障 |
| **多行收缩包裹** | `measureLineStats` | 自动调整到最紧容器的引用卡片 |

请参阅 `templates/donut-orbit.html` 和 `templates/hello-orb-flow.html` 获取可工作的单文件启动器。

## 工作流程

1. **根据用户的简要描述，从上表中选择一个模式。**
2. **从模板开始：**
   - `templates/hello-orb-flow.html` —— 文本围绕移动的球体重排（围绕障碍物重排模式）
   - `templates/donut-orbit.html` —— 高级示例：测量的 ASCII 标志障碍物，可拖动的线状球体/立方体，变形形状场，可选的 DOM 文本，以及仅限开发的控件
   - 使用 `write_file` 将新 `.html` 文件写入 `/tmp/` 或用户的工作区。
3. **为语料库交换一些符合简要描述的内容。** 真实的散文，10-100 个句子，不要使用 lorem。
4. **调整美学** —— 字体、调色板、构图、交互。这是工作；不要跳过它。
5. **本地验证：**
   ```sh
   cd <包含 html 的目录> && python3 -m http.server 8765
   # 然后打开 http://localhost:8765/<文件>.html
   ```
6. **检查控制台** —— 如果 `prepareWithSegments` 被调用时使用了错误的字体字符串，pretext 会抛出错误；`Intl.Segmenter` 在每个现代浏览器中都可用。
7. **向用户显示文件路径，而不仅仅是代码** —— 他们想要打开它。

## 性能注意事项

- `prepare()` / `prepareWithSegments()` 是开销较大的调用。每个文本+字体组合**仅执行一次**。缓存句柄。
- 调整大小时，仅重新运行 `layout()` / `layoutWithLines()` —— 切勿重新准备。
- 对于每帧动画（文本不变但几何形状变化），在紧密循环中调用 `layoutNextLineRange` 的开销足够小，可以在 60fps 下对正常长度的段落每帧执行。
- 当每帧渲染 ASCII 掩码时，保留一个单元格缓冲区（`Uint8Array`/类型化数组），从单元格或投影几何中导出每行测量的障碍物跨度，合并跨度，然后在绘制文本之前将这些跨度输入 `layoutNextLineRange`。
- 保持视觉动画和布局动画的耦合。如果一个球体变形为立方体，请使用相同的值对渲染的单元格缓冲区和障碍物跨度进行补间；否则，演示看起来像是画上去的，而不是物理上重新流动的。
- 对于淡入淡出，优先使用图层不透明度，而不是更改字形强度或障碍物比例。将临时的 ASCII 精灵放在单独的画布上，并使用 CSS/GSAP 不透明度淡化画布，这样几何形状就不会显得缩小。
- Canvas 的 `ctx.font` 设置出人意料地慢；如果字体不变化，每帧**仅设置一次**，而不是每次调用 `fillText` 时都设置。

## 常见陷阱

1. **CSS/画布字体字符串漂移。** `ctx.font = "16px Inter"` 已测量，但 CSS 显示 `font-family: Inter, sans-serif; font-size: 16px`。*如果* Inter 字体加载成功，则没问题。如果 Inter 字体 404，CSS 会回退到 sans-serif，测量值会漂移 5-20%。始终 `preload` 字体或使用 web 安全字体族。

2. **在动画循环内重新准备。** 只有 `layout*` 是廉价的。每帧重新调用 `prepare` 会严重影响性能。将准备好的句柄保存在模块作用域中。

3. **忘记使用 `Intl.Segmenter` 进行字形簇分割。** 表情符号、组合标记、中日韩字符 —— `"é".split("")` 会给你两个字符。在采样单个可见字形时，使用 `new Intl.Segmenter(undefined, { granularity: "grapheme" })`。

4. **`break: 'never'` 的原子块（chip）缺少 `extraWidth`。** 在 `rich-inline` 中，如果使用 `break: 'never'` 表示一个原子块/提及，还必须提供 `extraWidth` 以容纳药丸内边距 —— 否则块的外观会溢出容器。

5. **使用 `unpkg` 上的 `@chenglou/pretext` 且仅提供 TypeScript 入口。** 使用 `esm.sh` —— 它会自动将 TS 导出编译为浏览器可用的 ESM。`unpkg` 会 404 或提供原始 TS。

6. **等宽字体回退无声地破坏了整个目的。** 看到等宽字体输出的用户通常有一个 CSS `font-family` 回退到了 `monospace`。通过 DevTools 验证实际渲染的字体。

7. **围绕形状流动时跳过行 vs 调整宽度。** 如果当前行的通道太窄，无法容纳一行，*跳过该行*（`y += lineHeight; continue;`），而不是向 `layoutNextLineRange` 传递一个很小的 maxWidth —— pretext 会返回看起来破损的单字形簇行。

8. **交付一个“冷”演示。** 默认的首次绘制看起来像教程级别。添加：晕影、细微的扫描线、空闲自动运动、一个精心选择的交互响应（拖拽、悬停、滚动、点击）。没有这些，“酷炫的 pretext 演示”会变成“实习生复现的 README”。

## 验证清单

- [ ] 演示是一个独立的 `.html` 文件 —— 可通过双击或 `python3 -m http.server` 打开
- [ ] 通过 `esm.sh` 导入 `@chenglou/pretext` 并固定版本
- [ ] 语料库是真实的散文，不是 lorem ipsum，且与演示的概念匹配
- [ ] 传递给 `prepare` 的字体字符串与 CSS 字体完全匹配
- [ ] `prepare()` / `prepareWithSegments()` 仅调用一次，而不是每帧调用
- [ ] 深色背景 + 经过深思熟虑的调色板 —— 不是默认的白色画布
- [ ] 至少一个交互响应（拖拽 / 悬停 / 滚动 / 点击）或空闲自动运动
- [ ] 在本地使用 `python3 -m http.server` 测试并确认无控制台错误
- [ ] 在中端笔记本电脑上达到 60fps（或记录了优雅降级）
- [ ] 一个用户未要求的“额外努力”细节

## 参考：社区演示

克隆这些以获得灵感/模式（均为 MIT 风格，链接自 [pretext.cool](https://www.pretext.cool/)）：

- **Pretext Breaker** —— 打砖块游戏，使用单词砖块 —— `github.com/rinesh/pretext-breaker`
- **Tetris × Pretext** —— `github.com/shinichimochizuki/tetris-pretext`
- **龙动画** —— `github.com/qtakmalay/PreTextExperiments`
- **Somnai 编辑引擎** —— `github.com/somnai-dreams/pretext-demos`
- **Bad Apple!! ASCII** —— `github.com/frmlinn/bad-apple-pretext`
- **拖拽精灵重排** —— `github.com/dokobot/pretext-demo`
- **Alarmy 编辑时钟** —— `github.com/SmisLee/alarmy-pretext-demo`

官方 playground：[chenglou.me/pretext](https://chenglou.me/pretext/) —— 手风琴、气泡、动态布局、编辑引擎、对齐比较、瀑布流、Markdown 聊天、富笔记。