---
title: "Sketch — 一次性HTML原型：2-3个设计变体进行比较"
sidebar_label: "Sketch"
description: "一次性HTML原型：2-3个设计变体进行比较"
---

{/* 本页面由网站脚本 `scripts/generate-skill-docs.py` 根据技能的 `SKILL.md` 文件自动生成。请编辑源文件 `SKILL.md`，而非本页面。 */}

# Sketch

一次性HTML原型：2-3个设计变体进行比较。

## 技能元数据

| | |
|---|---|
| 源码 | 捆绑（默认安装） |
| 路径 | `skills/creative/sketch` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 (改编自 gsd-build/get-shit-done) |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `sketch`, `mockup`, `design`, `ui`, `prototype`, `html`, `variants`, `exploration`, `wireframe`, `comparison` |
| 相关技能 | [`spike`](/docs/user-guide/skills/bundled/software-development/software-development-spike), [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design), [`popular-web-designs`](/docs/user-guide/skills/bundled/creative/creative-popular-web-designs), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw) |

:::info
以下是 Hermes 加载此技能时看到的完整技能定义。这是技能激活时智能体所见的说明。
:::

# 草图绘制

当用户想要**在最终确定前查看设计方向**时使用此技能 —— 将 UI/UX 想法作为一次性的 HTML 原型来探索。重点在于生成 2-3 个交互式变体，让用户可以并排比较视觉方向，而非产出可交付的代码。

当用户说出诸如“画出这个屏幕的草图”、“给我看看 X 可能的样子”、“比较布局 A 和 B”、“给我 2-3 种对这个 UI 的设计”、“让我看看一些变体”、“在我构建之前先做个原型”之类的话时加载此技能。

## 何时不使用此技能

- 用户想要一个生产组件 —— 使用 `claude-design` 或正确地构建它
- 用户想要一个精美的单次 HTML 制品（落地页、演示文稿） —— `claude-design`
- 用户想要图表 —— `excalidraw`、`architecture-diagram`
- 设计已定稿 —— 直接构建它

## 如果用户安装了完整的 GSD 系统

如果 `gsd-sketch` 作为同级技能显示（通过 `npx get-shit-done-cc --hermes` 安装），优先使用 **`gsd-sketch`** 以获得完整的工作流：持久的 `.planning/sketches/` 目录与 MANIFEST 文件、前沿模式分析、过往草图的一致性审计，以及与 GSD 其余部分的集成。此技能是轻量级的独立版本 —— 无状态机制的一次性草图绘制。

## 核心方法

```
收集信息  →  生成变体  →  对比分析  →  选择赢家（或迭代）
```

### 1. 收集信息（如果用户已提供足够信息则跳过）

在生成变体之前，获取三样东西 —— 一次一个问题，不要一次性全部问完：

1.  **感觉。** “这个应该给人什么感觉？形容词、情感、一种氛围。” —— *“平静、编辑性、像 Linear”* 比 *“极简”* 告诉你更多。
2.  **参考。** “哪些应用、网站或产品能捕捉你想象的感觉？” —— 具体的参考比抽象的描述更好。
3.  **核心操作。** “用户在这个屏幕上做的最重要的一件事是什么？” —— 变体都应该很好地服务于这个核心；如果不能，它们就只是装饰。

在下一个问题之前，简要复述每个答案。如果用户一开始就给出了全部三个信息，直接进入变体生成阶段。

### 2. 变体（2-3 个，不要少于 2 个，很少需要 4 个以上）

一次性生成 **2-3 个变体**。每个变体是一个完整的、独立的 HTML 文件。不要描述变体 —— 直接构建它们。重点在于比较。

每个变体应该采取**不同的设计立场**，而不是不同的像素值。三个好的变体维度：

- **密度：** 紧凑 / 疏朗 / 超密集（选择两个对比鲜明的极点）
- **强调重点：** 内容优先 / 操作优先 / 工具优先
- **美学风格：** 编辑性 / 实用主义 / 趣味性
- **布局：** 单栏 / 侧边栏 / 分屏
- **基础形式：** 卡片式 / 裸内容 / 文档式

选择一个维度并从中拉开距离。仅在强调色上有区别的两个变体是浪费精力 —— 用户无法区分它们。

**变体命名：** 描述立场，而不是编号。

<!-- ascii-guard-ignore -->
```
sketches/
├── 001-calm-editorial/
│   ├── index.html
│   └── README.md
├── 001-utilitarian-dense/
│   ├── index.html
│   └── README.md
└── 001-playful-split/
    ├── index.html
    └── README.md
```
<!-- ascii-guard-ignore-end -->

### 3. 制作真实的 HTML

每个变体是一个**单文件、自包含的 HTML 文件**：

- 内联 `<style>` —— 无需构建步骤，无外部 CSS
- 系统字体或通过 `<link>` 引入一个 Google 字体
- 通过 CDN 使用 Tailwind（`<script src="https://cdn.tailwindcss.com"></script>`）也可以
- 逼真的虚拟内容 —— 实际的句子、实际的名字，而不是“Lorem ipsum”
- **交互性**：链接可点击，悬停效果真实，至少有一个状态转换（打开/关闭、筛选、切换）。冻结的静态图像比粗糙的动画更差。

在浏览器中打开它。如果看起来有问题，在展示给用户之前修复它。

**视觉验证变体 —— 使用 Hermes 的浏览器工具。** 不要只是编写 HTML 然后寄希望于它能渲染；加载每个变体并查看它：

```
browser_navigate(url="file:///absolute/path/to/sketches/001-calm-editorial/index.html")
browser_vision(question="这个布局看起来干净易读吗？有没有可见的错误（文本重叠、未样式化的元素、损坏的图片）？")
```

`browser_vision` 会返回一个 AI 对页面实际内容的描述以及截图路径 —— 能捕捉纯源码检查遗漏的布局错误（例如一个静默失败的字体导入、一个折叠的 flex 容器）。修复并重新导航，直到每个变体看起来正确。

**默认的 CSS 重置 + 系统字体栈** 用于快速起步：

```html
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                 "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #1a1a1a;
    background: #fafafa;
    line-height: 1.5;
  }
</style>
```

### 4. 变体 README

每个变体的 `README.md` 回答：

```markdown
## 变体：{立场名称}

### 设计立场
关于驱动此变体的原理的一句话。

### 关键选择
- 布局：...
- 排版：...
- 颜色：...
- 交互：...

### 权衡取舍
- 强项在于：...
- 弱项在于：...

### 最适合
- 此变体真正服务的用户类型或使用场景
```

### 5. 对比分析

所有变体构建完成后，将它们作为比较呈现。不要只是列举 —— **提出观点**：

```markdown
## 首页的三种方案

| 维度           | 平静编辑式   | 实用主义密集式 | 趣味分屏式   |
|----------------|--------------|----------------|--------------|
| 密度           | 低           | 高             | 中等         |
| 主要操作可见性 | 低           | 高             | 中等         |
| 可扫描性       | 高           | 中等           | 低           |
| 感觉           | 平静、可信   | 精准、工具感   | 亲切、有活力 |

**我的看法：** 实用主义密集式适合高级用户，平静编辑式适合内容为先的受众。趣味分屏式最弱 —— 试图兼顾两者，但都没有真正投入。
```

让用户选择赢家，或将两个结合成一个混合方案，或要求再进行一轮。

## 主题化（当项目有视觉标识时）

如果用户有现有的主题（颜色、字体、设计代币），将共享代币放在 `sketches/themes/tokens.css` 中，并在每个变体中 `@import` 它们。保持代币最小化：

```css
/* sketches/themes/tokens.css */
:root {
  --color-bg: #fafafa;
  --color-fg: #1a1a1a;
  --color-accent: #0066ff;
  --color-muted: #666;
  --radius: 8px;
  --font-display: "Inter", sans-serif;
  --font-body: -apple-system, BlinkMacSystemFont, sans-serif;
}
```

不要过度代币化一个一次性草图 —— 三种颜色和一种字体通常就足够了。

## 交互性门槛

当用户可以做到以下几点时，草图的交互性就足够了：

1.  **点击一个主要操作**并有可见的效果发生（状态变化、模态框、提示、导航模拟）
2.  **看到一个有意义的状态转换**（筛选列表、切换模式、打开/关闭面板）
3.  **悬停在可识别的交互提示上**（按钮、行、标签页）

超过这个程度就是对一次性工作的过度工程化。少于这个程度就是一张截图。

## 前沿模式（选择下一个要绘制什么）

如果已有草图，用户说“我接下来应该画什么？”：

- **一致性缺口** —— 来自不同草图的两个获胜变体做出了尚未组合的独立选择
- **未绘制的屏幕** —— 被提及但从未探索过
- **状态覆盖** —— 已绘制了理想路径，但空状态 / 加载中 / 错误 / 1000 个项目未绘制
- **响应式缺口** —— 在单一视口下验证过；在移动端 / 超宽屏下是否成立？
- **交互模式** —— 存在静态布局；过渡、拖动、滚动行为不存在

提议 2-4 个命名的候选方案。让用户选择。

## 输出

- 在仓库根目录创建 `sketches/`（如果用户使用 GSD 约定，则为 `.planning/sketches/`）
- 每个变体一个子目录：`NNN-stance-name/index.html` + `README.md`
- 告诉用户如何打开它们：在 macOS 上用 `open sketches/001-calm-editorial/index.html`，在 Linux 上用 `xdg-open`，在 Windows 上用 `start`
- 保持变体的可丢弃性 —— 一个你觉得有必要保留的草图，应该被提升为真正的项目代码，而不是作为资产被维护起来

**一个变体的典型工具序列：**

```
terminal("mkdir -p sketches/001-calm-editorial")
write_file("sketches/001-calm-editorial/index.html", "<!doctype html>...")
write_file("sketches/001-calm-editorial/README.md", "## 变体：平静编辑式\n...")
browser_navigate(url="file://$(pwd)/sketches/001-calm-editorial/index.html")
browser_vision(question="这个看起来怎么样？有没有明显的布局问题？")
```

对每个变体重复此操作，然后呈现比较表格。

## 归属

改编自 GSD（Get Shit Done）项目的 `/gsd-sketch` 工作流 —— MIT © 2025 Lex Christopherson ([gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done))。完整的 GSD 系统提供持久的草图状态、主题/变体模式引用和一致性审计工作流；通过 `npx get-shit-done-cc --hermes --global` 安装。