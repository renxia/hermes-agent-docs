---
title: "Sketch — 一次性 HTML 原型：用于对比的 2-3 种设计方案"
sidebar_label: "Sketch"
description: "一次性 HTML 原型：用于对比的 2-3 种设计方案"
---

{/* 本页面由网站脚本 `website/scripts/generate-skill-docs.py` 根据技能的 `SKILL.md` 文件自动生成。请编辑源文件 `SKILL.md`，而非本页面。 */}

# Sketch

一次性 HTML 原型：用于对比的 2-3 种设计方案。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/sketch` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体（改编自 gsd-build/get-shit-done） |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `sketch`, `mockup`, `design`, `ui`, `prototype`, `html`, `variants`, `exploration`, `wireframe`, `comparison` |
| 相关技能 | [`spike`](/user-guide/skills/bundled/software-development/software-development-spike), [`claude-design`](/user-guide/skills/bundled/creative/creative-claude-design), [`popular-web-designs`](/user-guide/skills/bundled/creative/creative-popular-web-designs), [`excalidraw`](/user-guide/skills/bundled/creative/creative-excalidraw) |

:::info
以下是Hermes在此技能触发时加载的完整技能定义。这是智能体在该技能激活时所看到的指令。
:::

# 草图

当用户希望**在确定方向前先查看设计方向**——将UI/UX想法作为一次性HTML原型来探索时，使用此技能。其目的是生成2-3个交互式变体，以便用户并排比较视觉方向，而非生成可发布的代码。

当用户说"草图这个屏幕"、"展示一下X可能的样子"、"比较布局A和B"、"给我2-3个这个UI的方案"、"让我看几个变体"、"在我构建之前做个原型"时，加载此技能。

## 何时不使用此技能

- 用户想要一个生产组件——使用 `claude-design` 或正确构建它
- 用户想要一个精致的一次性HTML产出物（落地页、演示文稿）—— `claude-design`
- 用户想要一个图表—— `excalidraw`, `architecture-diagram`
- 设计已锁定——直接构建即可

## 如果用户安装了完整的GSD系统

如果 `gsd-sketch` 作为同级技能出现（通过 `npx get-shit-done-cc --hermes` 安装），请优先使用 **`gsd-sketch`** 以获得完整工作流：持久化的 `.planning/sketches/` 目录及MANIFEST文件、前沿模式分析、过往草图的一致性审计，以及与GSD其余部分的集成。此技能是轻量级独立版本——没有状态管理机制的一次性草图绘制。

## 核心方法

```
信息收集 → 变体生成 → 对比分析 → 选择赢家（或迭代）
```

### 1. 信息收集（如果用户已提供足够信息则跳过）

在生成变体之前，获取三个要素——一次问一个问题，不要一次性全部询问：

1. **感觉。** "这应该给人什么感觉？形容词、情绪、一种氛围。" —— *"平静、编辑风格、像Linear"* 比 *"极简"* 告诉你的信息更多。
2. **参考。** "哪些应用、网站或产品符合你想象的感觉？" —— 实际参考比抽象描述更有价值。
3. **核心操作。** "用户在这个屏幕上所做的最重要的一件事是什么？" —— 变体应都很好地服务于这一点；如果不能，那它们就只是装饰。

在问下一个问题之前，简要复述每个答案。如果用户已预先提供了所有三个要素，直接进入变体生成阶段。

### 2. 变体（2-3个，从不1个，很少4个以上）

一次性生成 **2-3个变体**。每个变体是一个完整的、独立的HTML文件。不要描述变体——直接构建它们。目的是进行比较。

每个变体应采取**不同的设计立场**，而不仅仅是不同的像素值。三个好的变体轴：

- **密度：** 紧凑 / 宽松 / 超密集（选择两个对比鲜明的极端）
- **重点：** 内容优先 / 操作优先 / 工具优先
- **美学：** 编辑风格 / 实用主义 / 活泼有趣
- **布局：** 单列 / 侧边栏 / 分割窗格
- **基础：** 卡片式 / 裸露内容 / 文档式

选择一个轴并从中拉开差距。两个仅在强调色上不同的变体是浪费精力——用户无法区分它们。

**变体命名：** 描述其立场，而不是编号。

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

### 3. 制作真实的HTML

每个变体是一个**单一的、自包含的HTML文件**：

- 内联 `<style>` —— 无构建步骤，无外部CSS
- 系统字体或一个通过 `<link>` 引入的Google字体
- 通过CDN引入Tailwind (`<script src="https://cdn.tailwindcss.com"></script>`) 是可行的
- 真实的模拟内容——实际的句子、实际的名字，而非"Lorem ipsum"
- **可交互**：链接可点击、悬停效果真实、至少一个状态转换（打开/关闭、筛选、切换）。一个冻结的静态图比一个粗糙的动画原型更差。

在浏览器中打开它。如果看起来有问题，在展示给用户之前修复它。

**视觉验证变体——使用Hermes的浏览器工具。** 不要只是写HTML然后希望它能正确渲染；加载每个变体并查看它：

```
browser_navigate(url="file:///absolute/path/to/sketches/001-calm-editorial/index.html")
browser_vision(question="这个布局看起来干净且可读吗？有没有可见的错误（文本重叠、未样式化的元素、损坏的图片）？")
```

`browser_vision` 返回对页面实际内容的AI描述以及截图路径——能捕获纯源码检查会遗漏的布局错误（例如静默失败的字体导入、折叠的flex容器）。修复并重新导航，直到每个变体看起来正确。

**默认CSS重置 + 系统字体栈**，用于快速启动：

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

### 4. 变体说明文档 (README)

每个变体的 `README.md` 回答：

```markdown
## 变体：{立场名称}

### 设计立场
一句话说明驱动此变体的原则。

### 关键选择
- 布局：...
- 排版：...
- 颜色：...
- 交互：...

### 权衡取舍
- 擅长：...
- 欠缺：...

### 最适合
- 此变体真正适用的用户类型或使用场景
```

### 5. 对比分析

所有变体构建完成后，将它们作为比较进行呈现。不要仅仅列出——**要发表观点**：

```markdown
## 主页的三种方案

| 维度 | 平静编辑风格 | 实用主义密集 | 活泼分割 |
|------|--------------|--------------|----------|
| 密度 | 低           | 高           | 中       |
| 主要操作可见性 | 低 | 高 | 中 |
| 可扫描性 | 高 | 中 | 低 |
| 感觉 | 平静、可信 | 敏锐、工具化 | 亲切、有活力 |

**我的看法：** 实用主义密集适合高级用户，平静编辑风格适合内容导向型受众。活泼分割最弱——试图兼顾两者，但两者都未做到。
```

让用户选择赢家，或将两个组合成混合体，或要求进行另一轮迭代。

## 主题化（当项目有视觉标识时）

如果用户有现有主题（颜色、字体、设计令牌），将共享令牌放入 `sketches/themes/tokens.css` 并在每个变体中 `@import` 它们。保持令牌最少：

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

不要过度令牌化一次性草图——三种颜色和一种字体通常就足够了。

## 交互性标准

当用户可以做到以下几点时，草图的交互性就足够了：

1. **点击主要操作**并有可见的变化发生（状态更改、弹窗、提示信息、导航模拟）
2. **看到一个有意义的状态转换**（筛选列表、切换模式、打开/关闭面板）
3. **悬停在可识别的可操作元素上**（按钮、行、标签）

超过这些就过度工程化了一个一次性草图。少于这些就是一张截图。

## 前沿模式（选择接下来要草图绘制的内容）

如果草图已存在且用户说"接下来我应该草图绘制什么？"：

- **一致性差距**——来自不同草图的两个获胜变体做出了尚未组合在一起的独立选择
- **未草图绘制的屏幕**——被引用但从未探索过
- **状态覆盖**——已绘制了快乐路径，但未绘制空状态 / 加载中 / 错误状态 / 1000项内容
- **响应式差距**——在一个视口下验证；它在移动端/超宽屏上是否成立？
- **交互模式**——存在静态布局；转场、拖动、滚动行为则没有

提出2-4个命名候选方案。让用户选择。

## 输出

- 在仓库根目录创建 `sketches/`（如果用户使用GSD约定，则为 `.planning/sketches/`）
- 每个变体一个子目录：`NNN-stance-name/index.html` + `README.md`
- 告知用户如何打开它们：在macOS上使用 `open sketches/001-calm-editorial/index.html`，在Linux上使用 `xdg-open`，在Windows上使用 `start`
- 保持变体可丢弃——一个你认为需要保留的草图应提升到真正的项目代码中，而不是作为资源来管理

**单个变体的典型工具序列：**

```
terminal("mkdir -p sketches/001-calm-editorial")
write_file("sketches/001-calm-editorial/index.html", "<!doctype html>...")
write_file("sketches/001-calm-editorial/README.md", "## 变体: 平静编辑风格\n...")
browser_navigate(url="file://$(pwd)/sketches/001-calm-editorial/index.html")
browser_vision(question="看起来怎么样？有没有明显的布局问题？")
```

对每个变体重复此过程，然后呈现比较表格。

## 归属

改编自GSD（Get Shit Done）项目的 `/gsd-sketch` 工作流——MIT © 2025 Lex Christopherson ([gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done))。完整的GSD系统包含持久化草图状态、主题/变体模式引用和一致性审计工作流；使用 `npx get-shit-done-cc --hermes --global` 安装。