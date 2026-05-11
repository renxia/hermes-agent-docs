---
title: "Sketch — 即用即弃的HTML原型：2-3个设计变体对比"
sidebar_label: "Sketch"
description: "即用即弃的HTML原型：2-3个设计变体对比"
---

{/* 此页面由网站脚本website/scripts/generate-skill-docs.py从技能的SKILL.md自动生成。请编辑源文件SKILL.md，而非此页面。 */}

# Sketch

即用即弃的HTML原型：2-3个设计变体对比。

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
| 相关技能 | [`spike`](/docs/user-guide/skills/bundled/software-development/software-development-spike), [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design), [`popular-web-designs`](/docs/user-guide/skills/bundled/creative/creative-popular-web-designs), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw) |

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 草图设计

当用户想在**最终确定设计方向之前先预览**时 — 将 UI/UX 创意作为一次性 HTML 原型进行探索 — 请使用此技能。其要点是生成 2-3 个交互式变体供用户并排比较视觉方向，而非产出可交付的代码。

当用户说“把这个界面画个草图”、“让我看看 X 可能的样子”、“比较一下布局 A 和 B”、“给我 2-3 个这个 UI 的方案”、“让我看一些变体”、“在我动手前先做个原型”时加载此技能。

## 何时不使用此技能

- 用户需要生产级组件 — 使用 `claude-design` 或正确构建
- 用户需要精美的单页 HTML 制品（落地页、演示文稿）— `claude-design`
- 用户需要图表 — `excalidraw`, `architecture-diagram`
- 设计已锁定 — 直接构建

## 如果用户安装了完整的 GSD 系统

如果 `gsd-sketch` 作为同级技能出现（通过 `npx get-shit-done-cc --hermes` 安装），请优先选择 **`gsd-sketch`** 以获得完整的工作流：持久化的 `.planning/sketches/` 目录与 MANIFEST 文件、前沿模式分析、跨历史草图的一致性审计，以及与 GSD 系统其他部分的集成。此技能是其轻量级独立版本 — 用于一次性草图设计，无需状态管理机制。

## 核心方法

```
需求收集  →  变体生成  →  逐一比较  →  挑选赢家（或迭代）
```

### 1. 需求收集（如果用户已提供足够信息则跳过）

在生成变体之前，先获取三点信息 — 每次一个问题，不要一次性全部提出：

1.  **感觉。** “这个应该给人什么感觉？用形容词、情绪或氛围来描述。” — *“平静、编辑风格、像 Linear”* 比 *“极简”* 更能说明问题。
2.  **参考。** “哪些应用、网站或产品抓住了你想象中的感觉？” — 实际的参考比抽象的描述更有效。
3.  **核心操作。** “用户在此界面上最重要的单一操作是什么？” — 所有变体都应很好地服务于这一点；如果做不到，它们就只是装饰。

在下一个问题之前，简要复述每个答案。如果用户已一次性提供了全部三点，直接进入变体生成阶段。

### 2. 变体（2-3个，绝不1个，很少4+）

一次性生成 **2-3 个变体**。每个变体是一个完整、独立的 HTML 文件。不要描述变体 — 直接构建它们。目的是进行比较。

每个变体应采取**不同的设计立场**，而非仅不同的像素值。三个好的变体维度：

- **密度：** 紧凑 / 宽松 / 超密集（选择两个对比极）
- **侧重：** 内容优先 / 操作优先 / 工具优先
- **美学：** 编辑风格 / 实用主义 / 活泼有趣
- **布局：** 单栏 / 侧边栏 / 分屏
- **基础：** 卡片式 / 裸内容 / 文档风格

选择一个维度并拉开差距。仅在强调色上不同的两个变体是浪费精力 — 用户无法区分它们。

**变体命名：** 描述立场，而非数字。

<!-- ascii-guard-ignore -->
```
sketches/
├── 001-平静编辑风格/
│   ├── index.html
│   └── README.md
├── 001-实用主义密集型/
│   ├── index.html
│   └── README.md
└── 001-活泼分屏式/
    ├── index.html
    └── README.md
```
<!-- ascii-guard-ignore-end -->

### 3. 制作真实的 HTML

每个变体是一个**单一的自包含 HTML 文件**：

- 内联 `<style>` — 无需构建步骤，无外部 CSS
- 系统字体或一个通过 `<link>` 引入的 Google 字体
- 通过 CDN 引入 Tailwind（`<script src="https://cdn.tailwindcss.com"></script>`）是可行的
- 逼真的模拟内容 — 实际的句子、实际的名字，而非“Lorem ipsum”
- **交互式：** 链接可点击，悬停效果真实，至少有一个状态转换（打开/关闭、筛选、切换）。一个冻结的静态图像比一个粗糙的动画原型更差。

在浏览器中打开它。如果看起来有问题，在展示给用户之前修复它。

**通过视觉验证变体 — 使用 Hermes 的浏览器工具。** 不要只是编写 HTML 然后指望它能正确渲染；加载每个变体并查看它：

```
browser_navigate(url="file:///绝对路径/sketches/001-平静编辑风格/index.html")
browser_vision(question="这个布局看起来是否整洁清晰？有可见的错误（文本重叠、未样式化的元素、图片损坏）吗？")
```

`browser_vision` 返回页面上实际内容的 AI 描述以及一个截图路径 — 能捕捉到纯源码检查可能遗漏的布局错误（例如字体导入静默失败、flex 容器塌陷）。修复并重新导航，直到每个变体看起来正确。

**默认的 CSS 重置与系统字体栈**，便于快速启动：

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

每个变体的 `README.md` 回答以下问题：

```markdown
## 变体：{立场名称}

### 设计立场
用一句话说明驱动此变体的原则。

### 关键选择
- 布局：...
- 字体：...
- 颜色：...
- 交互：...

### 权衡
- 强项：...
- 弱项：...

### 最适用于
- 此变体实际服务的用户类型或用例
```

### 5. 逐一比较

所有变体构建完成后，将它们作为比较呈现。不要只是罗列 — **要提出观点**：

```markdown
## 主页的三种方案

| 维度 | 平静编辑风格 | 实用主义密集型 | 活泼分屏式 |
|------|--------------|----------------|------------|
| 密度 | 低 | 高 | 中等 |
| 主要操作可见性 | 低 | 高 | 中等 |
| 可扫描性 | 高 | 中等 | 低 |
| 感觉 | 平静、可信 | 锐利、工具化 | 友好、有活力 |

**我的看法：** 实用主义密集型适合高级用户，平静编辑风格适合内容导向型受众。活泼分屏式最弱 — 试图兼顾两者但两边都没做好。
```

让用户选择一个赢家，或将两个组合成一个混合方案，或再请求一轮迭代。

## 主题化（当项目有视觉标识时）

如果用户有现有主题（颜色、字体、设计变量），将共享变量放在 `sketches/themes/tokens.css` 中，并在每个变体中 `@import` 它们。保持变量精简：

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

不要对一次性草图过度变量设计 — 三种颜色和一种字体通常就够了。

## 交互性标准

当用户能够完成以下操作时，草图的交互性就足够了：

1.  **点击主要操作**并发生可见变化（状态变更、模态框、提示、导航模拟）
2.  **看到一个有意义的状态转换**（筛选列表、切换模式、打开/关闭面板）
3.  **悬停可识别的交互区域**（按钮、行、标签页）

超过此标准是对一次性原型的过度设计。低于此标准就是一张截图。

## 前沿模式（选择下一步草图内容）

如果已有草图，用户问“接下来我应该画什么草图？”：

- **一致性缺口** — 来自不同草图的两个获胜变体做出了尚未组合在一起的独立选择
- **未绘制草图的界面** — 被引用但从未探索过
- **状态覆盖** — 绘制了快乐路径，但未涵盖空状态 / 加载中 / 错误 / 1000 项
- **响应式缺口** — 在一个视口下验证过；在移动端 / 超宽屏下是否依然有效？
- **交互模式** — 存在静态布局；过渡、拖动、滚动行为则没有

提出 2-4 个命名的候选方案。让用户选择。

## 输出

- 在仓库根目录创建 `sketches/`（如果用户使用 GSD 约定，则为 `.planning/sketches/`）
- 每个变体一个子目录：`NNN-立场名称/index.html` + `README.md`
- 告诉用户如何打开它们：macOS 上用 `open sketches/001-平静编辑风格/index.html`，Linux 上用 `xdg-open`，Windows 上用 `start`
- 保持变体的可丢弃性 — 你觉得有必要保留的草图应该被提升为真正的项目代码，而不是作为资产被精心管理

**单个变体的典型工具序列：**

```
terminal("mkdir -p sketches/001-平静编辑风格")
write_file("sketches/001-平静编辑风格/index.html", "<!doctype html>...")
write_file("sketches/001-平静编辑风格/README.md", "## 变体: 平静编辑风格\n...")
browser_navigate(url="file://$(pwd)/sketches/001-平静编辑风格/index.html")
browser_vision(question="这个看起来怎么样？有明显的布局问题吗？")
```

为每个变体重复上述步骤，然后呈现比较表格。

## 归属

改编自 GSD (Get Shit Done) 项目的 `/gsd-sketch` 工作流 — MIT © 2025 Lex Christopherson ([gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done))。完整的 GSD 系统提供持久化的草图状态、主题/变体模式参考以及一致性审计工作流；可通过 `npx get-shit-done-cc --hermes --global` 安装。