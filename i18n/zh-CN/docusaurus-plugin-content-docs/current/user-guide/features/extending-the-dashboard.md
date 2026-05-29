---
sidebar_position: 17
title: "扩展仪表盘"
description: "为 Hermes 网络仪表盘构建主题和插件——调色板、字体、布局、自定义标签、Shell插槽、页面作用域插槽以及后端 API 路由"
---

# 扩展仪表盘

Hermes 网络仪表盘（`hermes dashboard`）旨在无需分叉代码库即可进行重新设计皮肤和扩展。它暴露了三个层次：

1. **主题** — YAML 文件，用于重新绘制仪表盘的调色板、字体、布局以及每个组件的外观。将文件放入 `~/.hermes/dashboard-themes/`；它将出现在主题切换器中。
2. **UI 插件** — 一个包含 `manifest.json` 和一个 JavaScript 包的目录，用于注册一个标签页、替换内置页面、通过页面作用域插槽增强页面，或向指定的 Shell 插槽注入组件。
3. **后端插件** — 位于该插件目录内的一个 Python 文件，它暴露一个 FastAPI `router`；路由将挂载在 `/api/plugins/<name>/` 下，并由插件的 UI 调用。

这三者都是**运行时即可加载**的：无需克隆仓库，无需运行 `npm run build`，无需修补仪表盘源代码。本页面是所有这三者的权威参考。

如果你只是想使用仪表盘，请参阅 [Web 仪表盘](./web-dashboard)。如果你想重新设计终端 CLI 的皮肤（而非网络仪表盘），请参阅 [皮肤与主题](./skins) —— CLI 皮肤系统与仪表盘主题无关。

:::note 各组件如何协同工作
主题和插件是独立但协同增效的。主题可以独立存在（只需一个 YAML 文件）。插件也可以独立存在（只需一个标签页）。它们结合在一起，让你能够通过自定义 HUD 构建完整的视觉重新设计——示例 `strike-freedom-cockpit` 演示（位于 `hermes-example-plugins` 附属仓库中——有关安装步骤，请参见[组合主题 + 插件演示](#组合主题--插件演示)）正是这样做的。
:::

---

## 目录

- [主题](#主题)
  - [快速开始——你的第一个主题](#快速开始你的第一个主题)
  - [调色板、字体、布局](#调色板字体布局)
  - [布局变体](#布局变体)
  - [主题资产（图片作为 CSS 变量）](#主题资产图片作为-css-变量)
  - [组件外观覆盖](#组件外观覆盖)
  - [颜色覆盖](#颜色覆盖)
  - [原始 `customCSS`](#原始-customcss)
  - [内置主题](#内置主题)
  - [完整主题 YAML 参考](#完整主题-yaml-参考)
- [插件](#插件)
  - [快速开始——你的第一个插件](#快速开始你的第一个插件)
  - [目录布局](#目录布局)
  - [Manifest 参考](#manifest-参考)
  - [插件 SDK](#插件-sdk)
  - [Shell 插槽](#shell-插槽)
  - [替换内置页面（`tab.override`）](#替换内置页面taboverride)
  - [增强内置页面（页面作用域插槽）](#增强内置页面页面作用域插槽)
  - [仅插槽插件（`tab.hidden`）](#仅插槽插件tabhidden)
  - [后端 API 路由](#后端-api-路由)
  - [每个插件的自定义 CSS](#每个插件的自定义-css)
  - [插件发现与重载](#插件发现与重载)
- [组合主题 + 插件演示](#组合主题--插件演示)
- [API 参考](#api-参考)
- [故障排除](#故障排除)

---

## 主题

主题是存储在 `~/.hermes/dashboard-themes/` 目录下的 YAML 文件。文件名并不重要（系统使用的是主题中的 `name:` 字段），但惯例上命名为 `<名称>.yaml`。每个字段都是可选的——缺失的键将回退到内置的 `default` 主题，因此一个主题可以小到只包含一种颜色。

### 快速入门 — 创建你的第一个主题

```bash
mkdir -p ~/.hermes/dashboard-themes
```

```yaml
# ~/.hermes/dashboard-themes/neon.yaml
name: neon
label: Neon
description: 纯洋红色配黑色背景

palette:
  background: "#000000"
  midground: "#ff00ff"
```

刷新仪表盘。点击顶部栏的调色板图标并选择 **Neon**。背景变为黑色，文字和强调色变为洋红色，所有派生颜色（卡片、边框、弱化色、环形等）都将通过 CSS 中的 `color-mix()` 从这 2 色三元组中重新计算。

这就是全部入门步骤：一个文件，两种颜色。以下内容均为可选的精细化调整。

### 调色板、排版、布局

这三个区块是主题的核心。每个部分都是独立的——可以只覆盖其中一个，其余保持不变。

#### 调色板（3 层）

调色板是由三个颜色层组成的三元组，外加一个暖光晕晕染颜色和一个噪点纹理乘数。仪表盘的设计系统级联通过 CSS 的 `color-mix()` 从这个三元组派生出所有与 shadcn 兼容的标记（卡片、弹出框、弱化色、边框、主色、破坏色、环形等）。覆盖三种颜色将级联影响整个用户界面。

| 键 | 描述 |
|-----|-------------|
| `palette.background` | 最底层画布颜色——通常接近黑色。控制页面背景和卡片填充色。 |
| `palette.midground` | 主要文本和强调色。大部分界面外观元素读取此颜色（前景文本、按钮轮廓、焦点环）。 |
| `palette.foreground` | 顶层高亮色。默认主题将其设置为 alpha 值为 0 的白色（不可见）；希望在顶层有明亮强调色的主题可以增加其 alpha 值。 |
| `palette.warmGlow` | `<Backdrop />` 组件用作晕染颜色的 `rgba(...)` 字符串。 |
| `palette.noiseOpacity` | 0–1.2 的纹理叠加乘数。越低越柔和，越高越粗犷。 |

每个层接受 `{hex: "#RRGGBB", alpha: 0.0–1.0}` 或纯十六进制字符串（alpha 默认为 1.0）。

```yaml
palette:
  background:
    hex: "#05091a"
    alpha: 1.0
  midground: "#d8f0ff"          # 纯十六进制，alpha = 1.0
  foreground:
    hex: "#ffffff"
    alpha: 0                    # 不可见的顶层
  warmGlow: "rgba(255, 199, 55, 0.24)"
  noiseOpacity: 0.7
```

#### 排版

| 键 | 类型 | 描述 |
|-----|------|-------------|
| `fontSans` | string | 正文内容的 CSS font-family 字体栈（应用于 `html`、`body`）。 |
| `fontMono` | string | 代码块、`<code>` 元素、`.font-mono` 工具类的 CSS font-family 字体栈。 |
| `fontDisplay` | string | 可选的标题/展示字体栈。回退到 `fontSans`。 |
| `fontUrl` | string | 可选的外部样式表 URL。在主题切换时作为 `<link rel="stylesheet">` 注入到 `<head>` 中。相同的 URL 不会被注入两次。兼容 Google Fonts、Bunny Fonts、自托管的 `@font-face` 表——任何可链接的字体。 |
| `baseSize` | string | 根字体大小——控制 rem 缩放比例。例如 `"14px"`、`"16px"`。 |
| `lineHeight` | string | 默认行高。例如 `"1.5"`、`"1.65"`。 |
| `letterSpacing` | string | 默认字间距。例如 `"0"`、`"0.01em"`、`"-0.01em"`。 |

```yaml
typography:
  fontSans: '"Orbitron", "Eurostile", "Impact", sans-serif'
  fontMono: '"Share Tech Mono", ui-monospace, monospace'
  fontDisplay: '"Orbitron", "Eurostile", sans-serif'
  fontUrl: "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Share+Tech+Mono&display=swap"
  baseSize: "14px"
  lineHeight: "1.5"
  letterSpacing: "0.04em"
```

#### 布局

| 键 | 值 | 描述 |
|-----|--------|-------------|
| `radius` | 任何 CSS 长度值（`"0"`、`"0.25rem"`、`"0.5rem"`、`"1rem"`，...） | 圆角半径标记。映射到 `--radius` 并级联到 `--radius-sm/md/lg/xl`——所有圆角元素同步变化。 |
| `density` | `compact` \| `comfortable` \| `spacious` | 作为 `--spacing-mul` CSS 变量应用的间距乘数。`compact = 0.85×`，`comfortable = 1.0×`（默认），`spacious = 1.2×`。缩放 Tailwind 的基础间距，因此 padding、gap 和 space-between 工具类都会按比例变化。 |

```yaml
layout:
  radius: "0"
  density: compact
```

### 布局变体

`layoutVariant` 选择整体外壳布局。缺失时默认为 `"standard"`。

| 变体 | 行为 |
|---------|-----------|
| `standard` | 单列布局，最大宽度 1600px（默认）。 |
| `cockpit` | 左侧边栏栏杆（260px）+ 主内容区。由插件通过 `sidebar` 槽位填充——参见[外壳槽位](#外壳槽位)。没有插件时，栏杆会显示占位符。 |
| `tiled` | 移除最大宽度限制，使页面可以使用整个视口宽度。 |

```yaml
layoutVariant: cockpit
```

当前变体暴露为 `document.documentElement.dataset.layoutVariant`，因此 `customCSS` 中的原始 CSS 可以通过 `:root[data-layout-variant="cockpit"] ...` 来定位它。

### 主题资源（图片作为 CSS 变量）

通过主题提供艺术素材 URL。每个命名槽位会成为一个 CSS 变量（`--theme-asset-<名称>`），内置的外壳和任何插件都可以读取。`bg` 槽位会自动连接到背景层；其他槽位面向插件。

```yaml
assets:
  bg: "https://example.com/hero-bg.jpg"           # 自动连接到 <Backdrop />
  hero: "/my-images/strike-freedom.png"           # 供插件侧边栏使用
  crest: "/my-images/crest.svg"                   # 供左侧顶部插件使用
  logo: "/my-images/logo.png"
  sidebar: "/my-images/rail.png"
  header: "/my-images/header-art.png"
  custom:
    scanLines: "/my-images/scanlines.png"         # → --theme-asset-custom-scanLines
```

值接受：
- 纯 URL — 会自动包装在 `url(...)` 中。
- 预先包装的 `url(...)`、`linear-gradient(...)`、`radial-gradient(...)` 表达式 — 原样使用。
- `"none"` — 显式排除。

每个资源也会作为 `--theme-asset-<名称>-raw` 发出（未包装的 URL），以防插件需要将其传递给 `<img src>` 而不是 `background-image`。

插件通过纯 CSS 或 JavaScript 读取这些值：

```javascript
// 在插件槽位中
const hero = getComputedStyle(document.documentElement)
  .getPropertyValue("--theme-asset-hero").trim();
```

### 组件外观覆盖

`componentStyles` 可以重新设计单个外壳组件的样式，而无需编写 CSS 选择器。每个分桶的条目会成为 CSS 变量（`--component-<分桶>-<烤串属性名>`），外壳的共享组件会读取这些变量。因此 `card:` 的覆盖应用于每个 `<Card>`，`header:` 应用于应用栏，等等。

```yaml
componentStyles:
  card:
    clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)"
    background: "linear-gradient(180deg, rgba(10, 22, 52, 0.85), rgba(5, 9, 26, 0.92))"
    boxShadow: "inset 0 0 0 1px rgba(64, 200, 255, 0.28)"
  header:
    background: "linear-gradient(180deg, rgba(16, 32, 72, 0.95), rgba(5, 9, 26, 0.9))"
  tab:
    clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)"
  sidebar: {}
  backdrop: {}
  footer: {}
  progress: {}
  badge: {}
  page: {}
```

支持的分桶：`card`、`header`、`footer`、`sidebar`、`tab`、`progress`、`badge`、`backdrop`、`page`。

属性名使用驼峰式（`clipPath`），并以烤串式发出（`clip-path`）。值是纯 CSS 字符串——任何 CSS 接受的属性（`clip-path`、`border-image`、`background`、`box-shadow`、`animation`，...）。

### 颜色覆盖

大多数主题不需要此功能——3 层调色板会派生出所有 shadcn 标记。当你想要一个派生无法产生的特定强调色（比如柔和主题中更柔和的破坏性红色，或品牌特定的成功绿色）时，使用 `colorOverrides`。

```yaml
colorOverrides:
  primary: "#ffce3a"
  primaryForeground: "#05091a"
  accent: "#3fd3ff"
  ring: "#3fd3ff"
  destructive: "#ff3a5e"
  border: "rgba(64, 200, 255, 0.28)"
```

支持的键：`card`、`cardForeground`、`popover`、`popoverForeground`、`primary`、`primaryForeground`、`secondary`、`secondaryForeground`、`muted`、`mutedForeground`、`accent`、`accentForeground`、`destructive`、`destructiveForeground`、`success`、`warning`、`border`、`input`、`ring`。

每个键都 1:1 映射到 `--color-<烤串格式>` CSS 变量（例如 `primaryForeground` → `--color-primary-foreground`）。这里设置的任何键仅对当前活动主题优先于调色板级联——切换到其他主题会清除覆盖。

### 原始 `customCSS`

对于 `componentStyles` 无法表达的选择器级外观——伪元素、动画、媒体查询、主题范围覆盖——可以将原始 CSS 放入 `customCSS`：

```yaml
customCSS: |
  /* 扫描线叠加 — 仅在 cockpit 变体激活时可见。 */
  :root[data-layout-variant="cockpit"] body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 100;
    background: repeating-linear-gradient(to bottom,
      transparent 0px, transparent 2px,
      rgba(64, 200, 255, 0.035) 3px, rgba(64, 200, 255, 0.035) 4px);
    mix-blend-mode: screen;
  }
```

CSS 在主题应用时作为单个带作用域的 `<style data-hermes-theme-css>` 标签注入，并在主题切换时清理。**每个主题上限为 32 KiB。**

### 内置主题

每个内置主题都自带调色板、排版和布局——切换时除了颜色之外还会产生可见的变化。

| 主题 | 调色板 | 排版 | 布局 |
|-------|---------|------------|--------|
| **Hermes Teal** (`default`) | 深青色 + 米色 | 系统字体栈，15px | 0.5rem 圆角，舒适 |
| **Hermes Teal (Large)** (`default-large`) | 与默认相同 | 系统字体栈，18px，行高 1.65 | 0.5rem 圆角，宽敞 |
| **Midnight** (`midnight`) | 深蓝紫色 | Inter + JetBrains Mono，14px | 0.75rem 圆角，舒适 |
| **Ember** (`ember`) | 温暖的深红 + 青铜色 | Spectral（衬线）+ IBM Plex Mono，15px | 0.25rem 圆角，舒适 |
| **Mono** (`mono`) | 灰度 | IBM Plex Sans + IBM Plex Mono，13px | 0 圆角，紧凑 |
| **Cyberpunk** (`cyberpunk`) | 黑底上的霓虹绿 | 全部使用 Share Tech Mono，14px | 0 圆角，紧凑 |
| **Rosé** (`rose`) | 粉色 + 象牙白 | Fraunces（衬线）+ DM Mono，16px | 1rem 圆角，宽敞 |

引用 Google Fonts 的主题（除 Hermes Teal 外的所有主题）会按需加载样式表——首次切换到它们时，会在 `<head>` 中注入一个 `<link>` 标签。

### 完整主题 YAML 参考

一个文件中的所有旋钮——复制并修剪你不需要的部分：

```yaml
# ~/.hermes/dashboard-themes/ocean.yaml
name: ocean
label: Ocean Deep
description: 深海蓝色搭配珊瑚色强调

# 3 层调色板（接受 {hex, alpha} 或纯十六进制）
palette:
  background:
    hex: "#0a1628"
    alpha: 1.0
  midground:
    hex: "#a8d0ff"
    alpha: 1.0
  foreground:
    hex: "#ffffff"
    alpha: 0.0
  warmGlow: "rgba(255, 107, 107, 0.35)"
  noiseOpacity: 0.7

typography:
  fontSans: "Poppins, system-ui, sans-serif"
  fontMono: "Fira Code, ui-monospace, monospace"
  fontDisplay: "Poppins, system-ui, sans-serif"   # 可选
  fontUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Fira+Code:wght@400;500&display=swap"
  baseSize: "15px"
  lineHeight: "1.6"
  letterSpacing: "-0.003em"

layout:
  radius: "0.75rem"
  density: comfortable

layoutVariant: standard        # standard | cockpit | tiled

assets:
  bg: "https://example.com/ocean-bg.jpg"
  hero: "/my-images/kraken.png"
  crest: "/my-images/anchor.svg"
  logo: "/my-images/logo.png"
  custom:
    pattern: "/my-images/waves.svg"

componentStyles:
  card:
    boxShadow: "inset 0 0 0 1px rgba(168, 208, 255, 0.18)"
  header:
    background: "linear-gradient(180deg, rgba(10, 22, 40, 0.95), rgba(5, 9, 26, 0.9))"

colorOverrides:
  destructive: "#ff6b6b"
  ring: "#ff6b6b"

customCSS: |
  /* 任何额外的选择器级微调 */
```

创建文件后刷新仪表盘。从顶部栏实时切换主题——点击调色板图标。选择会持久化到 `config.yaml` 中的 `dashboard.theme` 下，并在重新加载时恢复。

## 插件

仪表盘插件是一个包含 `manifest.json` 文件、预构建的 JS 包，以及可选的 CSS 文件和包含 FastAPI 路由的 Python 文件的目录。插件与其他 Hermes 插件一起存放在 `~/.hermes/plugins/<name>/` 中——仪表盘扩展是该插件目录下的 `dashboard/` 子文件夹，因此一个插件可以通过单次安装同时扩展 CLI/网关和仪表盘。

插件不打包 React 或 UI 组件。它们使用暴露在 `window.__HERMES_PLUGIN_SDK__` 上的 **插件 SDK**。这使得插件包体积很小（通常只有几 KB），并避免了版本冲突。

### 快速上手 — 你的第一个插件

创建目录结构：

```bash
mkdir -p ~/.hermes/plugins/my-plugin/dashboard/dist
```

编写清单文件：

```json
// ~/.hermes/plugins/my-plugin/dashboard/manifest.json
{
  "name": "my-plugin",
  "label": "My Plugin",
  "icon": "Sparkles",
  "version": "1.0.0",
  "tab": {
    "path": "/my-plugin",
    "position": "after:skills"
  },
  "entry": "dist/index.js"
}
```

编写 JS 包（一个普通的 IIFE——无需构建步骤）：

```javascript
// ~/.hermes/plugins/my-plugin/dashboard/dist/index.js
(function () {
  "use strict";

  const SDK = window.__HERMES_PLUGIN_SDK__;
  const { React } = SDK;
  const { Card, CardHeader, CardTitle, CardContent } = SDK.components;

  function MyPage() {
    return React.createElement(Card, null,
      React.createElement(CardHeader, null,
        React.createElement(CardTitle, null, "My Plugin"),
      ),
      React.createElement(CardContent, null,
        React.createElement("p", { className: "text-sm text-muted-foreground" },
          "Hello from my custom dashboard tab.",
        ),
      ),
    );
  }

  window.__HERMES_PLUGINS__.register("my-plugin", MyPage);
})();
```

刷新仪表盘——你的标签页会出现在导航栏中，在 **Skills** 之后。

:::tip 跳过 React.createElement
如果你更喜欢 JSX，可以使用任何打包工具（esbuild、Vite、rollup），将 React 作为外部依赖并使用 IIFE 输出格式。唯一硬性要求是最终文件必须是可通过 `<script>` 加载的单个 JS 文件。React 永远不会被打包；它来自 `SDK.React`。
:::

### 目录结构

```
~/.hermes/plugins/my-plugin/
├── plugin.yaml              # 可选 — 已有的 CLI/网关插件清单
├── __init__.py              # 可选 — 已有的 CLI/网关钩子
└── dashboard/               # 仪表盘扩展
    ├── manifest.json        # 必需 — 标签页配置、图标、入口点
    ├── dist/
    │   ├── index.js         # 必需 — 预构建的 JS 包 (IIFE)
    │   └── style.css        # 可选 — 自定义 CSS
    └── plugin_api.py        # 可选 — 后端 API 路由 (FastAPI)
```

单个插件目录可以携带三个相互独立的扩展：

- `plugin.yaml` + `__init__.py` — CLI/网关插件（[参见插件页面](./plugins)）。
- `dashboard/manifest.json` + `dashboard/dist/index.js` — 仪表盘 UI 插件。
- `dashboard/plugin_api.py` — 仪表盘后端路由。

它们都不是必需的；只包含你需要的层即可。

### 清单文件参考

```json
{
  "name": "my-plugin",
  "label": "My Plugin",
  "description": "What this plugin does",
  "icon": "Sparkles",
  "version": "1.0.0",
  "tab": {
    "path": "/my-plugin",
    "position": "after:skills",
    "override": "/",
    "hidden": false
  },
  "slots": ["sidebar", "header-left"],
  "entry": "dist/index.js",
  "css": "dist/style.css",
  "api": "plugin_api.py"
}
```

| 字段 | 必需 | 描述 |
|-------|----------|-------------|
| `name` | 是 | 唯一的插件标识符。小写，可用连字符。用于 URL 和注册。 |
| `label` | 是 | 导航标签页中显示的名称。 |
| `description` | 否 | 简短描述（在仪表盘管理界面中显示）。 |
| `icon` | 否 | Lucide 图标名称。默认为 `Puzzle`。未知名称会回退到 `Puzzle`。 |
| `version` | 否 | 语义化版本字符串。默认为 `0.0.0`。 |
| `tab.path` | 是 | 标签页的 URL 路径（例如 `/my-plugin`）。 |
| `tab.position` | 否 | 插入标签页的位置。`"end"`（默认）、`"after:<path>"` 或 `"before:<path>"` — 冒号后的值是目标标签页的**路径段**（不含前导斜杠）。示例：`"after:skills"`、`"before:config"`。 |
| `tab.override` | 否 | 设置为内置路由路径（`"/"`、`"/sessions"`、`"/config"` 等）以**替换**该页面，而不是添加新标签页。参见[替换内置页面](#replacing-built-in-pages-taboverride)。 |
| `tab.hidden` | 否 | 设为 true 时，注册组件和任何插槽，但不在导航中添加标签页。用于仅使用插槽的插件。参见[仅插槽插件](#slot-only-plugins-tabhidden)。 |
| `slots` | 否 | 此插件填充的已命名 Shell 插槽。**仅作为文档辅助** — 实际注册通过 JS 包中的 `registerSlot()` 完成。在此列出插槽可使发现界面更具信息性。 |
| `entry` | 是 | 相对于 `dashboard/` 的 JS 包路径。默认为 `dist/index.js`。 |
| `css` | 否 | 作为 `<link>` 标签注入的 CSS 文件路径。 |
| `api` | 否 | 包含 FastAPI 路由的 Python 文件路径。挂载于 `/api/plugins/<name>/`。 |

#### 可用图标

插件使用 Lucide 图标名称。仪表盘按名称映射这些图标——未知名称会静默回退到 `Puzzle`。

当前已映射：`Activity`、`BarChart3`、`Clock`、`Code`、`Database`、`Eye`、`FileText`、`Globe`、`Heart`、`KeyRound`、`MessageSquare`、`Package`、`Puzzle`、`Settings`、`Shield`、`Sparkles`、`Star`、`Terminal`、`Wrench`、`Zap`。

需要不同的图标？提交 PR 到 `web/src/App.tsx` 的 `ICON_MAP` — 这是一个纯增量的更改。

### 插件 SDK

插件所需的一切都在 `window.__HERMES_PLUGIN_SDK__` 上。插件不应直接导入 React。

```javascript
const SDK = window.__HERMES_PLUGIN_SDK__;

// React + hooks
SDK.React                    // React 实例
SDK.hooks.useState
SDK.hooks.useEffect
SDK.hooks.useCallback
SDK.hooks.useMemo
SDK.hooks.useRef
SDK.hooks.useContext
SDK.hooks.createContext

// UI 组件 (shadcn/ui 基础组件)
SDK.components.Card
SDK.components.CardHeader
SDK.components.CardTitle
SDK.components.CardContent
SDK.components.Badge
SDK.components.Button
SDK.components.Input
SDK.components.Label
SDK.components.Select
SDK.components.SelectOption
SDK.components.Separator
SDK.components.Tabs
SDK.components.TabsList
SDK.components.TabsTrigger
SDK.components.PluginSlot    // 渲染已命名的插槽（用于嵌套插件 UI）

// Hermes API 客户端 + 原始请求器
SDK.api                      // 类型化客户端 — getStatus、getSessions、getConfig 等...
SDK.fetchJSON                // 用于自定义端点（插件注册的路由）的原始 fetch

// 工具函数
SDK.utils.cn                 // Tailwind 类合并器 (clsx + twMerge)
SDK.utils.timeAgo            // 从 unix 时间戳返回 "5m ago" 格式
SDK.utils.isoTimeAgo         // 从 ISO 字符串返回 "5m ago" 格式

// Hooks
SDK.useI18n                  // 用于多语言插件的 i18n hook
```

#### 调用插件后端

```javascript
SDK.fetchJSON("/api/plugins/my-plugin/data")
  .then((data) => console.log(data))
  .catch((err) => console.error("API call failed:", err));
```

`fetchJSON` 会注入会话认证令牌，将错误作为抛出的异常暴露，并自动解析 JSON。

#### 调用内置 Hermes 端点

```javascript
// 智能体状态
SDK.api.getStatus().then((s) => console.log("Version:", s.version));

// 最近的会话
SDK.api.getSessions(10).then((resp) => console.log(resp.sessions.length));
```

完整列表请参见 [Web 仪表盘 → REST API](./web-dashboard#rest-api)。

### Shell 插槽

插槽允许插件将组件注入到应用 Shell 的指定位置——驾驶舱侧边栏、头部、底部、覆盖层——而无需占用整个标签页。多个插件可以填充同一个插槽；它们按注册顺序堆叠渲染。

在插件包内部注册：

```javascript
window.__HERMES_PLUGINS__.registerSlot("my-plugin", "sidebar", MySidebar);
window.__HERMES_PLUGINS__.registerSlot("my-plugin", "header-left", MyCrest);
```

#### 插槽目录

**全局 Shell 插槽**（在应用界面的任意位置渲染）：

| 插槽 | 位置 |
|------|----------|
| `backdrop` | `<Backdrop />` 图层栈内部，在噪点图层之上。 |
| `header-left` | 顶部栏中 Hermes 品牌之前。 |
| `header-right` | 顶部栏中主题/语言切换器之前。 |
| `header-banner` | 导航栏下方的全宽条带。 |
| `sidebar` | 驾驶舱侧边栏轨道 — **仅在 `layoutVariant === "cockpit"` 时渲染**。 |
| `pre-main` | 路由出口之上（在 `<main>` 内部）。 |
| `post-main` | 路由出口之下（在 `<main>` 内部）。 |
| `footer-left` | 页脚单元格内容（替换默认内容）。 |
| `footer-right` | 页脚单元格内容（替换默认内容）。 |
| `overlay` | 位于所有内容之上的固定定位图层。适用于 `customCSS` 无法单独实现的界面效果（扫描线、暗角等）。 |

**页面作用域插槽**（仅在指定的内置页面上渲染——用于向现有页面注入小部件、卡片或工具栏，而无需覆盖整个路由）：

| 插槽 | 渲染位置 |
|------|------------------|
| `sessions:top` / `sessions:bottom` | `/sessions` 页面的顶部 / 底部。 |
| `analytics:top` / `analytics:bottom` | `/analytics` 页面的顶部 / 底部。 |
| `logs:top` / `logs:bottom` | `/logs` 页面的顶部（过滤工具栏之上）/ 底部（日志查看器之下）。 |
| `cron:top` / `cron:bottom` | `/cron` 页面的顶部 / 底部。 |
| `skills:top` / `skills:bottom` | `/skills` 页面的顶部 / 底部。 |
| `config:top` / `config:bottom` | `/config` 页面的顶部 / 底部。 |
| `env:top` / `env:bottom` | `/env`（密钥）页面的顶部 / 底部。 |
| `docs:top` / `docs:bottom` | `/docs` 页面的顶部（iframe 之上）/ 底部。 |
| `chat:top` / `chat:bottom` | `/chat` 页面的顶部 / 底部（仅在启用嵌入式聊天时激活）。 |

示例——在 Sessions 页面顶部添加一个横幅卡片：

```javascript
function PinnedSessionsBanner() {
  return React.createElement(Card, null,
    React.createElement(CardContent, { className: "py-2 text-xs" },
      "由 my-plugin 注入的固定笔记"),
  );
}

window.__HERMES_PLUGINS__.registerSlot("my-plugin", "sessions:top", PinnedSessionsBanner);
```

如果您的插件仅增强现有页面，并且不需要自己的侧边栏选项卡，请将页面范围插槽与 `tab.hidden: true` 结合使用。

Shell 仅为上述插槽渲染 `<PluginSlot name="..." />`。注册表接受附加名称用于嵌套插件 UI——插件可以通过 `SDK.components.PluginSlot` 暴露自己的插槽。

#### 重新注册与热模块替换（HMR）

如果同一对 `(plugin, slot)` 被注册两次，后一次调用将替换前一次——这与 React HMR 期望的插件重新挂载行为一致。

### 替换内置页面 (`tab.override`)

将 `tab.override` 设置为内置路由路径，会使得插件的组件替换该页面，而不是添加一个新选项卡。当一个主题想要自定义首页 (`/`) 但保留仪表板其他部分不变时，这很有用。

```json
{
  "name": "my-home",
  "label": "Home",
  "tab": {
    "path": "/my-home",
    "override": "/",
    "position": "end"
  },
  "entry": "dist/index.js"
}
```

设置 `override` 后：

- 原始的 `/` 页面组件会从路由器中移除。
- 您的插件将在 `/` 路径渲染。
- 不会为 `tab.path` 添加导航选项卡（覆盖的本意就在于此）。

只有一个插件可以覆盖给定路径。如果两个插件声明同一个覆盖，第一个获胜，第二个会被忽略，并在开发模式下显示警告。

如果您只需要向现有页面添加卡片或工具栏而不接管它，请改用[页面范围插槽](#增强内置页面页面范围插槽)。

### 增强内置页面（页面范围插槽）

通过 `tab.override` 进行完全替换很重——您的插件现在拥有整个页面，包括我们未来对其发布的任何更新。大多数时候，您只是想向现有页面添加一个横幅、卡片或工具栏。这就是**页面范围插槽**的用途。

每个内置页面都暴露了 `<page>:top` 和 `<page>:bottom` 插槽，在其内容区域的顶部和底部渲染。您的插件通过调用 `registerSlot()` 来填充其中一个插槽——内置页面继续正常工作，您的组件与其并行渲染。

可用插槽：`sessions:*`, `analytics:*`, `logs:*`, `cron:*`, `skills:*`, `config:*`, `env:*`, `docs:*`, `chat:*`（每个都带有 `:top` 和 `:bottom`）。完整目录请参见 [Shell 插槽 → 插槽目录](#插槽目录)。

最小示例——将横幅固定在会话页面顶部：

```json
// ~/.hermes/plugins/session-notes/dashboard/manifest.json
{
  "name": "session-notes",
  "label": "Session Notes",
  "tab": { "path": "/session-notes", "hidden": true },
  "slots": ["sessions:top"],
  "entry": "dist/index.js"
}
```

```javascript
// ~/.hermes/plugins/session-notes/dashboard/dist/index.js
(function () {
  const SDK = window.__HERMES_PLUGIN_SDK__;
  const { React } = SDK;
  const { Card, CardContent } = SDK.components;

  function Banner() {
    return React.createElement(Card, null,
      React.createElement(CardContent, { className: "py-2 text-xs" },
        "归档前请记得标记重要会话。"),
    );
  }

  // 为隐藏选项卡提供的占位符。
  window.__HERMES_PLUGINS__.register("session-notes", function () { return null; });

  // 真正的功能。
  window.__HERMES_PLUGINS__.registerSlot("session-notes", "sessions:top", Banner);
})();
```

要点：

- `tab.hidden: true` 将插件排除在侧边栏之外——它没有独立的页面。
- `slots` 清单字段仅用于文档。实际绑定发生在 JS 包中，通过 `registerSlot()` 完成。
- 多个插件可以声明同一个页面范围插槽。它们按注册顺序堆叠渲染。
- 当没有插件注册时，零影响：内置页面照常渲染。

一个参考插件（[`hermes-example-plugins`](https://github.com/NousResearch/hermes-example-plugins/tree/main/example-dashboard) 中的 `example-dashboard`）提供了一个实时演示，将横幅注入到 `sessions:top`——安装它来端到端查看此模式。

### 仅插槽插件 (`tab.hidden`)

当 `tab.hidden: true` 时，插件注册其组件（用于直接 URL 访问）和任何插槽，但永远不会向导航栏添加选项卡。仅用于注入插槽的插件会使用此设置——例如页眉徽标、侧边栏 HUD、覆盖层。

```json
{
  "name": "header-crest",
  "label": "Header Crest",
  "tab": {
    "path": "/header-crest",
    "position": "end",
    "hidden": true
  },
  "slots": ["header-left"],
  "entry": "dist/index.js"
}
```

包仍然调用 `register()` 并传入一个占位组件（以防有人直接访问 URL，这是一个好习惯），然后调用 `registerSlot()` 来执行真正的工作。

### 后端 API 路由

插件可以通过在清单中设置 `api` 来注册 FastAPI 路由。创建文件并导出一个 `router`：

```python
# ~/.hermes/plugins/my-plugin/dashboard/plugin_api.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/data")
async def get_data():
    return {"items": ["one", "two", "three"]}

@router.post("/action")
async def do_action(body: dict):
    return {"ok": True, "received": body}
```

路由被挂载到 `/api/plugins/<name>/` 下，因此上述路由变为：

- `GET  /api/plugins/my-plugin/data`
- `POST /api/plugins/my-plugin/action`

插件 API 路由绕过会话令牌认证，因为仪表板服务器默认绑定到 localhost。**如果您运行不受信任的插件，请勿使用 `--host 0.0.0.0` 将仪表板暴露在公共接口上**——它们的路由也会变得可达。

#### 访问 Hermes 内部组件

后端路由运行在仪表板进程内部，因此可以直接从 hermes-agent 代码库导入：

```python
from fastapi import APIRouter
from hermes_state import SessionDB
from hermes_cli.config import load_config

router = APIRouter()

@router.get("/session-count")
async def session_count():
    db = SessionDB()
    try:
        count = len(db.list_sessions(limit=9999))
        return {"count": count}
    finally:
        db.close()

@router.get("/config-snapshot")
async def config_snapshot():
    cfg = load_config()
    return {"model": cfg.get("model", {})}
```

### 每个插件的自定义 CSS

如果您的插件需要超出 Tailwind 类和内联 `style=` 的样式，请添加一个 CSS 文件并在清单中引用它：

```json
{
  "css": "dist/style.css"
}
```

该文件在插件加载时作为 `<link>` 标签注入。使用特定的类名以避免与仪表板的样式冲突，并引用仪表板的 CSS 变量以保持主题感知：

```css
/* dist/style.css */
.my-plugin-chart {
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-card-foreground);
  padding: 1rem;
}
.my-plugin-chart:hover {
  border-color: var(--color-ring);
}
```

仪表板将每个 shadcn 标记暴露为 `--color-*`，加上主题附加变量 (`--theme-asset-*`, `--component-<bucket>-*`, `--radius`, `--spacing-mul`)。引用这些变量，您的插件会自动随活动主题重新设置外观。

### 插件发现与重新加载

仪表板在三个目录中扫描 `dashboard/manifest.json`：

| 优先级 | 目录 | 来源标签 |
|----------|-----------|--------------|
| 1（冲突时获胜） | `~/.hermes/plugins/<name>/dashboard/` | `user` |
| 2 | `<repo>/plugins/memory/<name>/dashboard/` | `bundled` |
| 2 | `<repo>/plugins/<name>/dashboard/` | `bundled` |
| 3 | `./.hermes/plugins/<name>/dashboard/` | `project` — 仅在设置 `HERMES_ENABLE_PROJECT_PLUGINS` 时 |

发现结果按仪表板进程缓存。添加新插件后，请执行以下任一操作：

```bash
# 强制重新扫描而不重启
curl http://127.0.0.1:9119/api/dashboard/plugins/rescan
```

…或者重启 `hermes dashboard`。

#### 插件加载生命周期

1.  仪表板加载。`main.tsx` 在 `window.__HERMES_PLUGIN_SDK__` 上暴露 SDK，并在 `window.__HERMES_PLUGINS__` 上暴露注册表。
2.  `App.tsx` 调用 `usePlugins()` → 获取 `GET /api/dashboard/plugins`。
3.  对于每个清单：注入 CSS `<link>`（如果声明），然后通过 `<script>` 标签加载 JS 包。
4.  插件的 IIFE 运行并调用 `window.__HERMES_PLUGINS__.register(name, Component)` ——以及可选地为每个插槽调用 `.registerSlot(name, slot, Component)`。
5.  仪表板解析清单对应的已注册组件，将选项卡添加到导航（除非 `hidden`），并将组件作为路由挂载。

插件在其脚本加载后最多有 **2 秒**时间来调用 `register()`。之后仪表板停止等待并完成初始渲染。如果插件稍后注册，它仍然会出现——导航是响应式的。

如果插件的脚本加载失败（404、语法错误、IIFE 期间异常），仪表板会在浏览器控制台记录警告并继续运行。

## 主题 + 插件组合演示

[`strike-freedom-cockpit`](https://github.com/NousResearch/hermes-example-plugins/tree/main/strike-freedom-cockpit) 插件（配套仓库 `hermes-example-plugins`）是一个完整的重涂装演示。它将一个主题 YAML 文件与一个仅包含插槽的插件配对，无需分叉仪表板即可生成驾驶舱风格的 HUD。

**演示内容：**

- 一个使用调色板、排版、`fontUrl`、`layoutVariant: cockpit`、`assets`、`componentStyles`（卡片凹角、渐变背景）、`colorOverrides` 和 `customCSS`（扫描线叠加效果）的完整主题。
- 一个仅包含插槽的插件（`tab.hidden: true`），它注册到三个插槽：
  - `sidebar` — 一个 MS-STATUS 面板，包含由 `SDK.api.getStatus()` 驱动的实时遥测条。
  - `header-left` — 一个派系徽章，从活动主题中读取 `--theme-asset-crest`。
  - `footer-right` — 一个替换默认组织行的自定义标语。
- 该插件通过 CSS 变量读取主题提供的素材，因此更换主题会改变主视觉/徽章，而无需更改插件代码。

**安装：**

```bash
git clone https://github.com/NousResearch/hermes-example-plugins.git

# 主题
cp hermes-example-plugins/strike-freedom-cockpit/theme/strike-freedom.yaml \
   ~/.hermes/dashboard-themes/

# 插件
cp -r hermes-example-plugins/strike-freedom-cockpit ~/.hermes/plugins/
```

打开仪表板，从主题切换器中选择 **Strike Freedom**。驾驶舱侧边栏出现，徽章显示在页眉中，标语替换了页脚。切换回 **Hermes Teal**，插件仍然安装但不可见（`sidebar` 插槽仅在 `cockpit` 布局变体下渲染）。

阅读插件源代码（配套仓库中的 `strike-freedom-cockpit/dashboard/dist/index.js`），了解它如何读取 CSS 变量、如何在不支持插槽的旧版仪表板中进行防护，以及如何从一个捆绑包注册三个插槽。

---

## API 参考

### 主题端点

| 端点 | 方法 | 描述 |
|----------|--------|-------------|
| `/api/dashboard/themes` | GET | 列出可用主题 + 活动名称。内置主题返回 `{name, label, description}`；用户主题还包括一个 `definition` 字段，其中包含完整规范化的主题对象。 |
| `/api/dashboard/theme` | PUT | 设置活动主题。请求体：`{"name": "midnight"}`。持久化到 `config.yaml` 文件的 `dashboard.theme` 下。 |

### 插件端点

| 端点 | 方法 | 描述 |
|----------|--------|-------------|
| `/api/dashboard/plugins` | GET | 列出发现的插件（包含清单，去除内部字段）。 |
| `/api/dashboard/plugins/rescan` | GET | 强制重新扫描插件目录，无需重启。 |
| `/dashboard-plugins/<name>/<path>` | GET | 提供来自插件 `dashboard/` 目录的静态资产。已阻止路径遍历。 |
| `/api/plugins/<name>/*` | * | 插件注册的后端路由。 |

### `window` 上的 SDK

| 全局变量 | 类型 | 提供者 |
|--------|------|----------|
| `window.__HERMES_PLUGIN_SDK__` | object | `registry.ts` — React、hooks、UI 组件、API 客户端、工具函数。 |
| `window.__HERMES_PLUGINS__.register(name, Component)` | function | 注册插件的主组件。 |
| `window.__HERMES_PLUGINS__.registerSlot(name, slot, Component)` | function | 注册到指定的外壳插槽。 |

---

## 故障排除

**我的主题未出现在选择器中。**
检查文件是否位于 `~/.hermes/dashboard-themes/` 中，并且以 `.yaml` 或 `.yml` 结尾。刷新页面。运行 `curl http://127.0.0.1:9119/api/dashboard/themes` — 您的主题应该在响应中。如果 YAML 存在解析错误，仪表板会将日志记录到 `~/.hermes/logs/` 下的 `errors.log` 中。

**我的插件的标签页没有显示。**
1.  检查清单文件是否位于 `~/.hermes/plugins/<name>/dashboard/manifest.json`（注意 `dashboard/` 子目录）。
2.  运行 `curl http://127.0.0.1:9119/api/dashboard/plugins/rescan` 强制重新发现。
3.  打开浏览器开发工具 → 网络 — 确认 `manifest.json`、`index.js` 和任何 CSS 已加载，没有 404 错误。
4.  打开浏览器开发工具 → 控制台 — 查看在 IIFE 期间或出现 `window.__HERMES_PLUGINS__ is undefined`（表示 SDK 未初始化，通常是之前的 React 渲染崩溃）时的错误。
5.  验证您的捆绑包使用与 `manifest.json:name` **相同的名称** 调用了 `window.__HERMES_PLUGINS__.register(...)`。

**插槽注册的组件未渲染。**
`sidebar` 插槽仅在活动主题具有 `layoutVariant: cockpit` 时渲染。其他插槽始终渲染。如果您注册到一个未命中的插槽，请在 `registerSlot` 内部添加 `console.log` 以确认插件捆绑包是否已运行。

**插件后端路由返回 404。**
1.  确认清单中包含 `"api": "plugin_api.py"`，指向 `dashboard/` 内一个存在的文件。
2.  重启 `hermes dashboard` — 插件 API 路由仅在启动时挂载一次，**不在**重新扫描时挂载。
3.  检查 `plugin_api.py` 是否导出了模块级变量 `router = APIRouter()`。其他导出名称不会被识别。
4.  查看 `~/.hermes/logs/errors.log` 日志，寻找 `Failed to load plugin <name> API routes` — 导入错误会记录在那里。

**主题切换后我的颜色覆盖丢失了。**
`colorOverrides` 的作用域限定在活动主题内，并在主题切换时清除 — 这是设计如此。如果您希望覆盖持久化，请将它们放在主题的 YAML 文件中，而不是放在实时切换器中。

**主题的 `customCSS` 被截断。**
每个主题的 `customCSS` 块限制为 32 KiB。将大型样式表拆分到多个主题中，或者切换到一个通过其 `css` 字段注入完整样式表的插件（没有大小限制）。

**我想通过 PyPI 发布插件。**
仪表板插件是通过目录布局安装的，而不是通过 pip 入口点。目前最简洁的分发路径是用户将其克隆到 `~/.hermes/plugins/` 的 git 仓库。仪表板插件的基于 pip 的安装程序目前尚未配置。