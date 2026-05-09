---
title: "草图 — 一次性 HTML 模型：2-3 个设计变体进行比较"
sidebar_label: "草图"
description: "一次性 HTML 模型：2-3 个设计变体进行比较"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 草图

一次性 HTML 模型：2-3 个设计变体进行比较。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/sketch` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体（改编自 gsd-build/get-shit-done） |
| 许可证 | MIT |
| 标签 | `sketch`, `mockup`, `design`, `ui`, `prototype`, `html`, `variants`, `exploration`, `wireframe`, `comparison` |
| 相关技能 | [`spike`](/docs/user-guide/skills/bundled/software-development/software-development-spike), [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design), [`popular-web-designs`](/docs/user-guide/skills/bundled/creative/creative-popular-web-designs), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 草图

当用户希望在**确定设计方向之前先看到设计方向**时，使用此技能——将 UI/UX 想法探索为可丢弃的 HTML 模型。目的是生成 2-3 个交互式变体，以便用户可以并排比较视觉方向，而不是生成可发布的代码。

当用户说“草绘此屏幕”、“向我展示 X 可能的样子”、“比较布局 A 与 B”、“给我 2-3 个此 UI 的方案”、“让我看看一些变体”、“在我构建之前先制作模型”时，加载此技能。

## 何时不应使用此技能

- 用户想要一个生产组件——使用 `claude-design` 或正确构建它
- 用户想要一个精美的独立 HTML 作品（登陆页面、演示文稿）——`claude-design`
- 用户想要一个图表——`excalidraw`、`architecture-diagram`
- 设计已经锁定——直接构建它

## 如果用户已安装完整的 GSD 系统

如果 `gsd-sketch` 作为同级技能出现（通过 `npx get-shit-done-cc --hermes` 安装），则优先使用 **`gsd-sketch`** 以获得完整的工作流：持久的 `.planning/sketches/` 目录，包含 MANIFEST、前沿模式分析、对过去草图的审计，以及与 GSD 其余部分的集成。此技能是轻量级的独立版本——一次性草图绘制，无需状态机制。

## 核心方法

```
输入 → 变体 → 对比 → 选择优胜者（或迭代）
```

### 1. 输入（如果用户已提供足够信息，则跳过）

在生成变体之前，一次一个问题，依次获取以下三项内容：

1. **感觉。** “这应该是什么感觉？形容词、情绪、氛围。” —— *“平静、编辑感、像 Linear”* 比 *“极简”* 提供更多信息。
2. **参考。** “哪些应用、网站或产品捕捉到了您想象的感觉？” —— 实际参考胜过抽象描述。
3. **核心操作。** “用户在此屏幕上做的最重要的一件事是什么？” —— 所有变体都应很好地服务于这一点；如果做不到，它们就只是装饰。

在下一个问题之前简要反映每个答案。如果用户已提前提供全部三项内容，则直接跳到变体。

### 2. 变体（2-3 个，绝不为 1 个，很少为 4 个以上）

一次性生成 **2-3 个变体**。每个变体都是一个完整的独立 HTML 文件。不要描述变体——构建它们。目的是进行比较。

每个变体应采用**不同的设计立场**，而不是不同的像素值。三个好的变体轴：

- **密度：** 紧凑 / 宽松 / 超密集（选择两个对立的极端）
- **重点：** 内容优先 / 操作优先 / 工具优先
- **美学：** 编辑感 / 实用主义 / 趣味性
- **布局：** 单列 / 侧边栏 / 分屏
- **基础：** 卡片式 / 裸内容 / 文档式

选择一个轴并从中拉开差异。仅在强调色上不同的两个变体是浪费精力——用户无法区分它们。

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

每个变体都是一个**独立的 HTML 文件**：

- 内联 `<style>` —— 无需构建步骤，无需外部 CSS
- 系统字体或通过 `<link>` 引入的一个 Google 字体
- 通过 CDN 引入 Tailwind（`<script src="https://cdn.tailwindcss.com"></script>`）是可以的
- 真实的假内容 —— 实际的句子、实际的名字，而不是“Lorem ipsum”
- **交互性：** 链接可点击，悬停效果真实，至少有一个状态转换（打开/关闭、过滤、切换）。一个冻结的静态图像比一个粗糙的动画图像更糟糕。

在浏览器中打开它。如果看起来有问题，请在向用户展示之前修复它。

**使用 Hermes 的浏览器工具视觉验证变体。** 不要只写 HTML 并希望它呈现；加载每个变体并查看它：

```
browser_navigate(url="file:///absolute/path/to/sketches/001-calm-editorial/index.html")
browser_vision(question="此布局看起来是否干净且可读？是否有任何可见的错误（重叠文本、未样式化的元素、损坏的图像）？")
```

`browser_vision` 返回页面上实际内容的 AI 描述以及屏幕截图路径 —— 可以捕获纯源代码检查遗漏的布局错误（例如，字体导入静默失败，flex 容器塌陷）。修复并重新导航，直到每个变体看起来都正确。

**默认 CSS 重置 + 系统字体栈**，以便快速开始：

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
一句话说明驱动此变体的原则。

### 关键选择
- 布局：...
- 排版：...
- 颜色：...
- 交互：...

### 权衡
- 擅长：...
- 不擅长：...

### 最适合
- 此变体实际服务的用户类型或用例
```

### 5. 对比

构建所有变体后，以比较的方式呈现它们。不要只是列出 —— **表达观点**：

```markdown
## 关于主页面的三种方案

| 维度 | 平静编辑感 | 实用密集 | 趣味分屏 |
|-----------|----------------|-------------------|---------------|
| 密度   | 低            | 高              | 中        |
| 主要操作可见性 | 低 | 高 | 中 |
| 可扫描性 | 高 | 中 | 低 |
| 感觉 | 平静、可信 | 锋利、工具感 | 吸引人、充满活力 |

**我的观点：** 实用密集适合高级用户，平静编辑感适合内容导向的受众。趣味分屏最弱 —— 试图兼顾两者，但都不彻底。
```

让用户选择优胜者，或将两个结合成混合体，或要求再进行一轮。

## 主题（当项目具有视觉标识时）

如果用户已有现有主题（颜色、字体、令牌），请将共享令牌放在 `sketches/themes/tokens.css` 中，并在每个变体中 `@import` 它们。保持令牌最小化：

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

不要过度标记一个一次性草图 —— 三种颜色和一种字体通常就足够了。

## 交互性标准

当用户可以进行以下操作时，草图就具有足够的交互性：

1. **点击主要操作** 并发生可见变化（状态变化、模态框、提示、导航假象）
2. **看到一个有意义的状态转换**（过滤列表、切换模式、打开/关闭面板）
3. **悬停可识别的 affordance**（按钮、行、选项卡）

超过此标准是对一次性作品的过度工程化。低于此标准则只是一个屏幕截图。

## 前沿模式（选择接下来要草绘的内容）

如果草图已存在且用户说“我接下来应该草绘什么？”：

- **一致性差距** —— 来自不同草图的两个优胜变体做出了尚未组合在一起的独立选择
- **未草绘的屏幕** —— 被引用但从未探索过
- **状态覆盖** —— 草绘了正常路径，但没有空 / 加载 / 错误 / 1000 个项目
- **响应式差距** —— 在一个视口下验证；在移动端 / 超宽屏幕上是否成立？
- **交互模式** —— 存在静态布局；但过渡、拖拽、滚动行为不存在

提出 2-4 个命名候选。让用户选择。

## 输出

- 在仓库根目录创建 `sketches/`（如果用户使用的是 GSD 约定，则为 `.planning/sketches/`）
- 每个变体一个子目录：`NNN-stance-name/index.html` + `README.md`
- 告诉用户如何打开它们：macOS 上使用 `open sketches/001-calm-editorial/index.html`，Linux 上使用 `xdg-open`，Windows 上使用 `start`
- 保持变体可丢弃 —— 如果您觉得需要保留的草图，应将其提升为实际项目代码，而不是作为资产进行策划

**一个变体的典型工具序列：**

```
terminal("mkdir -p sketches/001-calm-editorial")
write_file("sketches/001-calm-editorial/index.html", "<!doctype html>...")
write_file("sketches/001-calm-editorial/README.md", "## 变体：平静编辑感\n...")
browser_navigate(url="file://$(pwd)/sketches/001-calm-editorial/index.html")
browser_vision(question="这看起来如何？有任何明显的布局问题吗？")
```

为每个变体重复此过程，然后呈现比较表。

## 归属

改编自 GSD（Get Shit Done）项目的 `/gsd-sketch` 工作流 —— MIT © 2025 Lex Christopherson ([gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done))。完整的 GSD 系统提供持久的草图状态、主题/变体模式参考和一致性审计工作流；使用 `npx get-shit-done-cc --hermes --global` 安装。