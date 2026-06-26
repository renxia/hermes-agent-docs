---
sidebar_position: 17
title: "Extending the Dashboard"
description: "Build themes and plugins for the Hermes web dashboard — palettes, typography, layouts, custom tabs, shell slots, page-scoped slots, and backend API routes"
---

# 扩展仪表板

Hermes Web 仪表板（`hermes dashboard`）被设计为无需分叉代码库即可重新换肤和扩展。暴露了三层能力：

1. **主题** — 通过 YAML 文件重新定义仪表板的调色板、排版、布局以及各组件的外壳样式。将文件放入 `~/.hermes/dashboard-themes/` 目录即可在主题切换器中看到。
2. **UI 插件** — 包含 `manifest.json` + JavaScript 包的目录，可注册新标签页、替换内置页面、通过页面作用域插槽增强内置页面，或将组件注入到命名的 shell 插槽中。
3. **后端插件** — 该插件目录中的一个 Python 文件，暴露一个 FastAPI `router`；路由挂载在 `/api/plugins/<name>/` 下，供插件 UI 调用。

这三者均为**运行时即放即用**：无需克隆仓库、无需 `npm run build`、无需修改仪表板源码。本页是这三者的权威参考文档。

如果你只是想使用仪表板，请参阅 [Web 仪表板](./web-dashboard)。如果你想重新换肤终端 CLI（而非 Web 仪表板），请参阅 [皮肤与主题](./skins) — CLI 皮肤系统与仪表板主题无关。

:::note 各部分如何组合
主题和插件相互独立但协同增效。主题可以独立存在（只需一个 YAML 文件）。插件也可以独立存在（只需一个标签页）。二者结合可构建完整的视觉换肤方案并搭配自定义 HUD — 示例 `strike-freedom-cockpit` 演示（位于 `hermes-example-plugins` 配套仓库中 — 安装步骤请参阅 [主题 + 插件组合演示](#combined-theme--plugin-demo)）正是这么做的。
:::

---

## 目录

- [主题](#themes)
  - [快速开始 — 你的第一个主题](#quick-start--你的第一个主题)
  - [调色板、排版、布局](#palette-typography-layout)
  - [布局变体](#layout-variants)
  - [主题资源（图片作为 CSS 变量）](#theme-assets-images-as-css-vars)
  - [组件外壳覆盖](#component-chrome-overrides)
  - [颜色覆盖](#color-overrides)
  - [原始 `customCSS`](#raw-customcss)
  - [内置主题](#built-in-themes)
  - [完整主题 YAML 参考](#full-theme-yaml-reference)
- [插件](#plugins)
  - [快速开始 — 你的第一个插件](#quick-start--你的第一个插件)
  - [目录结构](#directory-layout)
  - [清单参考](#manifest-reference)
  - [插件 SDK](#the-plugin-sdk)
  - [Shell 插槽](#shell-slots)
  - [替换内置页面（`tab.override`）](#replacing-built-in-pages-taboverride)
  - [增强内置页面（页面作用域插槽）](#augmenting-built-in-pages-page-scoped-slots)
  - [纯插槽插件（`tab.hidden`）](#slot-only-plugins-tabhidden)
  - [后端 API 路由](#backend-api-routes)
  - [每个插件的自定义 CSS](#custom-css-per-plugin)
  - [插件发现与重载](#plugin-discovery--reload)
- [主题 + 插件组合演示](#combined-theme--plugin-demo)
- [API 参考](#api-reference)
- [故障排除](#troubleshooting)

---

## 主题

主题是以 YAML 文件形式存储在 `~/.hermes/dashboard-themes/` 中的。文件名无关紧要（系统使用的是主题的 `name:` 字段），但约定为 `<name>.yaml`。每个字段都是可选的——缺失的键会回退到内置的 `default` 主题，因此一个主题可以只定义一个颜色那么小。

### 快速开始——创建你的第一个主题

```bash
mkdir -p ~/.hermes/dashboard-themes
```

```yaml
# ~/.hermes/dashboard-themes/neon.yaml
name: neon
label: Neon
description: Pure magenta on black

palette:
  background: "#000000"
  midground: "#ff00ff"
```

刷新仪表板。点击标题栏中的调色板图标，选择 **Neon**。背景变为黑色，文字和强调色变为洋红色，每个派生颜色（卡片、边框、弱化色、环等）都会通过 CSS 中的 `color-mix()` 从这三色组合中重新计算。

这就是全部的入门流程：一个文件，两种颜色。以下所有内容都是可选的精调。

### 调色板、排版、布局

这三个块是主题的核心。每个都是独立的——可以只覆盖其中一个，保留其他不变。

#### 调色板（3 层）

调色板是一个由三层颜色组成的组合，加上一个暖色调渐晕颜色和一个噪点纹理乘数。仪表板的设计系统级联通过 CSS `color-mix()` 从这个组合中派生出每个 shadcn 兼容的令牌（card、popover、muted、border、primary、destructive、ring 等）。覆盖三个颜色会级联到整个 UI。

| 键 | 说明 |
|-----|-------------|
| `palette.background` | 最深的画布颜色——通常为近黑色。驱动页面背景和卡片填充。 |
| `palette.midground` | 主文字和强调色。大多数 UI 铬元素使用此颜色（前景文字、按钮轮廓、聚焦环）。 |
| `palette.foreground` | 顶层高亮。默认主题将此设为白色且 alpha 为 0（不可见）；想要在顶部有明亮强调色的主题可以调高其 alpha。 |
| `palette.warmGlow` | 由 `<Backdrop />` 用作渐晕颜色的 `rgba(...)` 字符串。 |
| `palette.noiseOpacity` | 0–1.2 的纹理覆盖层乘数。值越低越柔和，值越高越粗糙。 |

每层接受 `{hex: "#RRGGBB", alpha: 0.0–1.0}` 或纯十六进制字符串（alpha 默认为 1.0）。

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

| 键 | 类型 | 说明 |
|-----|------|-------------|
| `fontSans` | 字符串 | 正文的 CSS font-family 堆栈（应用于 `html`、`body`）。 |
| `fontMono` | 字符串 | 代码块、`<code>`、`.font-mono` 工具的 CSS font-family 堆栈。 |
| `fontDisplay` | 字符串 | 可选的标题/展示字体堆栈。回退到 `fontSans`。 |
| `fontUrl` | 字符串 | 可选的外部样式表 URL。在主题切换时作为 `<link rel="stylesheet">` 注入到 `<head>` 中。同一个 URL 不会注入两次。适用于 Google Fonts、Bunny Fonts、自托管的 `@font-face` 样式表——任何可链接的内容。 |
| `baseSize` | 字符串 | 根字体大小——控制 rem 缩放。例如 `"14px"`、`"16px"`。 |
| `lineHeight` | 字符串 | 默认行高。例如 `"1.5"`、`"1.65"`。 |
| `letterSpacing` | 字符串 | 默认字间距。例如 `"0"`、`"0.01em"`、`"-0.01em"`。 |

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

##### 从 UI 更改字体（无需 YAML）

仪表板标题栏中的主题选择器在主题列表下方有一个 **字体** 部分。在那里选择任意字体会覆盖当前活动主题的正文字体——该选择独立于主题，并在主题切换之间持久化（存储在 `config.yaml` 的 `dashboard.font` 下）。选择 **主题默认值** 以清除覆盖并回退到活动主题自己的 `fontSans`。

选择器提供一个精心策划的目录（系统堆栈加上一组涵盖无衬线/衬线/等宽的 Google Fonts 系列）。它故意**不**接受自由文本的字体 URL——字体的样式表作为 `<link>` 注入，因此目录保持注入来源固定。如需完全自定义外观，请如上所示在主题 YAML 中设置 `fontSans` + `fontUrl`。主题的 `fontMono`（代码块、终端）始终不受 UI 覆盖的影响。

#### 布局

| 键 | 值 | 说明 |
|-----|--------|-------------|
| `radius` | 任意 CSS 长度（`"0"`、`"0.25rem"`、`"0.5rem"`、`"1rem"`...） | 圆角令牌。映射到 `--radius` 并级联到 `--radius-sm/md/lg/xl`——每个圆角元素一起变化。 |
| `density` | `compact` \| `comfortable` \| `spacious` | 作为 CSS 变量 `--spacing-mul` 应用的间距乘数。`compact = 0.85×`，`comfortable = 1.0×`（默认），`spacious = 1.2×`。缩放 Tailwind 的基础间距，因此 padding、gap 和 space-between 工具类都按比例变化。 |

```yaml
layout:
  radius: "0"
  density: compact
```

### 布局变体

`layoutVariant` 选择整体外壳布局。缺失时默认为 `"standard"`。

| 变体 | 行为 |
|---------|-----------|
| `standard` | 单列，1600px 最大宽度（默认）。 |
| `cockpit` | 左侧边栏轨道（260px）+ 主内容。由插件通过 `sidebar` 插槽填充——参见 [Shell 插槽](#shell-slots)。没有插件时边栏显示占位符。 |
| `tiled` | 取消最大宽度限制，使页面可以使用完整的视口宽度。 |

```yaml
layoutVariant: cockpit
```

当前变体通过 `document.documentElement.dataset.layoutVariant` 暴露，因此 `customCSS` 中的原生 CSS 可以通过 `:root[data-layout-variant="cockpit"] ...` 来针对它。

### 主题资源（图片作为 CSS 变量）

随主题一起提供艺术作品 URL。每个命名插槽变成一个 CSS 变量（`--theme-asset-<name>`），内置外壳和任何插件都可以读取。`bg` 插槽自动接入背景；其他插槽面向插件。

```yaml
assets:
  bg: "https://example.com/hero-bg.jpg"           # 自动接入 <Backdrop />
  hero: "/my-images/strike-freedom.png"           # 用于插件侧边栏
  crest: "/my-images/crest.svg"                   # 用于左侧头部插件
  logo: "/my-images/logo.png"
  sidebar: "/my-images/rail.png"
  header: "/my-images/header-art.png"
  custom:
    scanLines: "/my-images/scanlines.png"         # → --theme-asset-custom-scanLines
```

值接受：

- 纯 URL——自动包裹在 `url(...)` 中。
- 预先包裹的 `url(...)`、`linear-gradient(...)`、`radial-gradient(...)` 表达式——按原样使用。
- `"none"`——显式退出。

每个资源还以 `--theme-asset-<name>-raw`（未包裹的 URL）的形式发出，以防插件需要将其传递给 `<img src>` 而不是 `background-image`。

插件可以通过普通 CSS 或 JS 读取这些变量：

```javascript
// 在插件插槽中
const hero = getComputedStyle(document.documentElement)
  .getPropertyValue("--theme-asset-hero").trim();
```

### 组件铬元素覆盖

`componentStyles` 无需编写 CSS 选择器即可重新定义各个外壳组件的样式。每个桶中的条目变成 CSS 变量（`--component-<bucket>-<kebab-property>`），外壳的共享组件读取这些变量。因此 `card:` 覆盖应用于每个 `<Card>`，`header:` 应用于应用栏，等等。

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

支持的桶：`card`、`header`、`footer`、`sidebar`、`tab`、`progress`、`badge`、`backdrop`、`page`。

属性名称使用驼峰命名（`clipPath`），并输出为短横线命名（`clip-path`）。值为纯 CSS 字符串——CSS 接受的任何内容（`clip-path`、`border-image`、`background`、`box-shadow`、`animation`...）。

### 颜色覆盖

大多数主题不需要这个——三层调色板会派生每个 shadcn 令牌。当你想要一个派生无法产生的特定强调色时（柔和的破坏性红色用于柔和主题，特定的成功绿色用于品牌），使用 `colorOverrides`。

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

每个键 1:1 映射到 `--color-<kebab>` CSS 变量（例如 `primaryForeground` → `--color-primary-foreground`）。此处设置的任何键仅对活动主题优先于调色板级联——切换到另一个主题会清除覆盖。

### 原生 `customCSS`

对于 `componentStyles` 无法表达的铬元素级别样式——伪元素、动画、媒体查询、主题范围覆盖——将原生 CSS 放入 `customCSS` 中：

```yaml
customCSS: |
  /* 扫描线覆盖层——仅在驾驶舱变体激活时可见。 */
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

CSS 在主题应用时作为单个作用域 `<style data-hermes-theme-css>` 标签注入，在主题切换时清理。**每个主题上限为 32 KiB。**

### 内置主题

每个内置主题都有自己的调色板、排版和布局——切换时产生的变化不仅限于颜色。

| 主题 | 调色板 | 排版 | 布局 |
|-------|---------|------------|--------|
| **Hermes Teal**（`default`） | 深青色 + 奶油色 | 系统堆栈，15px | 0.5rem 圆角，舒适 |
| **Hermes Teal (Large)**（`default-large`） | 与默认相同 | 系统堆栈，18px，行高 1.65 | 0.5rem 圆角，宽敞 |
| **Midnight**（`midnight`） | 深蓝紫色 | Inter + JetBrains Mono，14px | 0.75rem 圆角，舒适 |
| **Ember**（`ember`） | 暖深红色 + 青铜色 | Spectral（衬线）+ IBM Plex Mono，15px | 0.25rem 圆角，舒适 |
| **Mono**（`mono`） | 灰度 | IBM Plex Sans + IBM Plex Mono，13px | 0 圆角，紧凑 |
| **Cyberpunk**（`cyberpunk`） | 黑底霓虹绿 | 全用 Share Tech Mono，14px | 0 圆角，紧凑 |
| **Rosé**（`rose`） | 粉色 + 象牙色 | Fraunces（衬线）+ DM Mono，16px | 1rem 圆角，宽敞 |

引用 Google Fonts 的主题（除 Hermes Teal 外的所有主题）按需加载样式表——第一次切换到它们时，一个 `<link>` 标签会被注入到 `<head>` 中。

### 完整主题 YAML 参考

所有旋钮集中在一个文件中——复制并修剪你不需要的部分：

```yaml
# ~/.hermes/dashboard-themes/ocean.yaml
name: ocean
label: Ocean Deep
description: Deep sea blues with coral accents

# 三层调色板（接受 {hex, alpha} 或纯十六进制）
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
  /* 任何额外的选择器级别微调 */
```

创建文件后刷新仪表板。从标题栏实时切换主题——点击调色板图标。选择会持久化到 `config.yaml` 的 `dashboard.theme` 中，并在重新加载时恢复。

---

## 插件

仪表板插件是一个包含 `manifest.json`、预构建的 JS 包以及可选的 CSS 文件和带有 FastAPI 路由的 Python 文件的目录。插件位于 `~/.hermes/plugins/<name>/` 下，与其他 Hermes 插件并列——仪表板扩展是该插件目录内的 `dashboard/` 子文件夹，因此一个插件可以通过单次安装同时扩展 CLI/网关和仪表板。

插件不会打包 React 或 UI 组件。它们使用通过 `window.__HERMES_PLUGIN_SDK__` 暴露的 **Plugin SDK**。这使得插件包非常小（通常只有几 KB），并避免了版本冲突。

### 快速开始——你的第一个插件

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

刷新仪表板——你的标签页会出现在导航栏中，位于 **Skills** 之后。

:::tip 跳过 React.createElement
如果你更喜欢 JSX，可以使用任意打包工具（esbuild、Vite、rollup），将 React 设为外部依赖并以 IIFE 格式输出。唯一硬性要求是最终文件必须是一个可通过 `<script>` 加载的单个 JS 文件。React 永远不会被打包；它来自 `SDK.React`。
:::

### 目录布局

```
~/.hermes/plugins/my-plugin/
├── plugin.yaml              # 可选——已有的 CLI/网关插件清单
├── __init__.py              # 可选——已有的 CLI/网关钩子
└── dashboard/               # 仪表板扩展
    ├── manifest.json        # 必需——标签页配置、图标、入口点
    ├── dist/
    │   ├── index.js         # 必需——预构建的 JS 包（IIFE）
    │   └── style.css        # 可选——自定义 CSS
    └── plugin_api.py        # 可选——后端 API 路由（FastAPI）
```

单个插件目录可以承载三个正交扩展：

- `plugin.yaml` + `__init__.py`——CLI/网关插件（[参见插件页面](./plugins)）。
- `dashboard/manifest.json` + `dashboard/dist/index.js`——仪表板 UI 插件。
- `dashboard/plugin_api.py`——仪表板后端路由。

这些都不是必需的；只需包含你需要的层级即可。

### 清单参考

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
| `name` | 是 | 唯一插件标识符。小写，允许使用连字符。用于 URL 和注册。 |
| `label` | 是 | 导航标签页中显示的名称。 |
| `description` | 否 | 简短描述（显示在仪表板管理界面中）。 |
| `icon` | 否 | Lucide 图标名称。默认为 `Puzzle`。未知名称将回退为 `Puzzle`。 |
| `version` | 否 | Semver 字符串。默认为 `0.0.0`。 |
| `tab.path` | 是 | 标签页的 URL 路径（如 `/my-plugin`）。 |
| `tab.position` | 否 | 插入标签页的位置。`"end"`（默认）、`"after:<path>"` 或 `"before:<path>"`——冒号后的值是目标标签页的 **路径段**（无前导斜杠）。示例：`"after:skills"`、`"before:config"`。 |
| `tab.override` | 否 | 设置为内置路由路径（`"/"`、`"/sessions"`、`"/config"`、...）以 **替换** 该页面而非添加新标签页。参见 [替换内置页面](#replacing-built-in-pages-taboverride)。 |
| `tab.hidden` | 否 | 设为 true 时，注册组件及任何槽位但不添加导航标签页。仅供仅使用槽位的插件使用。参见 [仅槽位插件](#slot-only-plugins-tabhidden)。 |
| `slots` | 否 | 此插件填充的命名外壳槽位。**仅供文档参考**——实际注册通过 JS 包中的 `registerSlot()` 完成。在此列出槽位可使发现界面更具信息量。 |
| `entry` | 是 | 相对于 `dashboard/` 的 JS 包路径。默认为 `dist/index.js`。 |
| `css` | 否 | 作为 `<link>` 标签注入的 CSS 文件路径。 |
| `api` | 否 | 包含 FastAPI 路由的 Python 文件路径。挂载于 `/api/plugins/<name>/`。 |

#### 可用图标

插件使用 Lucide 图标名称。仪表板按名称映射这些图标——未知名称将静默回退为 `Puzzle`。

当前已映射：`Activity`、`BarChart3`、`Clock`、`Code`、`Database`、`Eye`、`FileText`、`Globe`、`Heart`、`KeyRound`、`MessageSquare`、`Package`、`Puzzle`、`Settings`、`Shield`、`Sparkles`、`Star`、`Terminal`、`Wrench`、`Zap`。

需要不同的图标？请向 `web/src/App.tsx` 的 `ICON_MAP` 提交 PR——纯粹的增量修改。

### Plugin SDK

插件所需的一切都在 `window.__HERMES_PLUGIN_SDK__` 上。插件绝不应直接导入 React。

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

// UI 组件（shadcn/ui 原语）
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
SDK.components.PluginSlot    // 渲染命名槽位（适用于嵌套插件 UI）

// Hermes API 客户端 + 原始 fetcher
SDK.api                      // 类型化客户端——getStatus、getSessions、getConfig、...
SDK.fetchJSON                // 用于自定义端点（插件注册路由）的原始 fetch

// 工具函数
SDK.utils.cn                 // Tailwind 类合并器（clsx + twMerge）
SDK.utils.timeAgo            // 从 unix 时间戳生成"5m ago"
SDK.utils.isoTimeAgo         // 从 ISO 字符串生成"5m ago"

// Hooks
SDK.useI18n                  // 用于多语言插件的 i18n hook
```

#### 调用插件的后端

```javascript
SDK.fetchJSON("/api/plugins/my-plugin/data")
  .then((data) => console.log(data))
  .catch((err) => console.error("API call failed:", err));
```

`fetchJSON` 会注入会话认证令牌，将错误作为异常抛出，并自动解析 JSON。

#### 调用内置 Hermes 端点

```javascript
// 智能体状态
SDK.api.getStatus().then((s) => console.log("Version:", s.version));

// 最近的会话
SDK.api.getSessions(10).then((resp) => console.log(resp.sessions.length));
```

完整列表参见 [Web 仪表板 → REST API](./web-dashboard#rest-api)。

### 外壳槽位

槽位允许插件将组件注入到应用外壳的命名位置——驾驶舱侧边栏、头部、footer、覆盖层——而无需占用整个标签页。多个插件可以填充同一个槽位；它们按注册顺序堆叠渲染。

在插件包内注册：

```javascript
window.__HERMES_PLUGINS__.registerSlot("my-plugin", "sidebar", MySidebar);
window.__HERMES_PLUGINS__.registerSlot("my-plugin", "header-left", MyCrest);
```

#### 槽位目录

**外壳级槽位**（在应用框架任意位置渲染）：

| 槽位 | 位置 |
|------|----------|
| `backdrop` | 位于 `<Backdrop />` 层叠内部，噪点层之上。 |
| `header-left` | 顶部栏中 Hermes 品牌之前。 |
| `header-right` | 顶部栏中主题/语言切换器之前。 |
| `header-banner` | 导航栏下方的全宽条带。 |
| `sidebar` | 驾驶舱侧边栏栏——**仅在 `layoutVariant === "cockpit"` 时渲染**。 |
| `pre-main` | 路由出口上方（`<main>` 内部）。 |
| `post-main` | 路由出口下方（`<main>` 内部）。 |
| `footer-left` | Footer 单元格内容（替换默认内容）。 |
| `footer-right` | Footer 单元格内容（替换默认内容）。 |
| `overlay` | 固定定位层，位于所有其他内容之上。适用于覆盖层效果（扫描线、暗角），这些效果是 `customCSS` 无法单独实现的。 |

**页面级槽位**（仅在指定的内置页面上渲染——用于在不覆盖整个路由的情况下向现有页面注入 widget、卡片或工具栏）：

| 槽位 | 渲染位置 |
|------|------------------|
| `sessions:top` / `sessions:bottom` | `/sessions` 页面的顶部 / 底部。 |
| `analytics:top` / `analytics:bottom` | `/analytics` 页面的顶部 / 底部。 |
| `logs:top` / `logs:bottom` | `/logs` 页面的顶部（过滤工具栏上方）/ 底部（日志查看器下方）。 |
| `cron:top` / `cron:bottom` | `/cron` 页面的顶部 / 底部。 |
| `skills:top` / `skills:bottom` | `/skills` 页面的顶部 / 底部。 |
| `config:top` / `config:bottom` | `/config` 页面的顶部 / 底部。 |
| `env:top` / `env:bottom` | `/env`（Keys）页面的顶部 / 底部。 |
| `docs:top` / `docs:bottom` | `/docs` 页面的顶部（iframe 上方）/ 底部。 |
| `chat:top` / `chat:bottom` | `/chat` 页面的顶部 / 底部（仅在嵌入聊天启用时激活）。 |

示例——在 Sessions 页面顶部添加一个横幅卡片：

```javascript
function PinnedSessionsBanner() {
  return React.createElement(Card, null,
    React.createElement(CardContent, { className: "py-2 text-xs" },
      "Pinned note injected by my-plugin"),
  );
}

window.__HERMES_PLUGINS__.registerSlot("my-plugin", "sessions:top", PinnedSessionsBanner);
```

将页面级槽位与 `tab.hidden: true` 结合使用，如果你的插件只需要增强现有页面而不需要自己的侧边栏标签页。

外壳仅对上述槽位渲染 `<PluginSlot name="..." />`。额外的名称可被注册中心接受，用于嵌套插件 UI——插件可以通过 `SDK.components.PluginSlot` 暴露自己的槽位。

#### 重新注册与 HMR

如果同一个 `(plugin, slot)` 对被注册了两次，后一次调用会取代前一次——这与 React HMR 期望插件重新挂载的行为方式一致。

### 替换内置页面（`tab.override`）

将 `tab.override` 设置为内置路由路径会使插件的组件替换该页面，而非添加新标签页。当主题需要自定义首页（`/`）但希望保持仪表板其余部分完整时，这非常有用。

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

- `/` 处的原始页面组件会从路由器中移除。
- 你的插件将在 `/` 处渲染。
- 不会为 `tab.path` 添加导航标签页（覆盖本身就是目的）。

只有一个插件可以覆盖给定路径。如果两个插件声明相同的覆盖路径，第一个生效，第二个在开发模式下显示警告后被忽略。

如果你只需要向现有页面添加卡片或工具栏而不接管整个页面，请改用 [页面级槽位](#augmenting-built-in-pages-page-scoped-slots)。

### 增强内置页面（页面级槽位）

通过 `tab.override` 进行完全替换是重量级操作——你的插件现在拥有整个页面，包括我们未来对该页面的任何更新。大多数时候你只是想向现有页面添加横幅、卡片或工具栏。这就是 **页面级槽位** 的用途。

---
title: "Dashboard Plugins"
description: "How to build plugins that inject UI components into the Hermes dashboard"
slug: "dashboard-plugins"
---

每个内置页面都会暴露 `<page>:top` 和 `<page>:bottom` 插槽，分别渲染在其内容区域的顶部和底部。你的插件通过调用 `registerSlot()` 来填充其中一个插槽——内置页面照常运行，你的组件与其并排渲染。

可用插槽：`sessions:*`、`analytics:*`、`logs:*`、`cron:*`、`skills:*`、`config:*`、`env:*`、`docs:*`、`chat:*`（每个都带有 `:top` 和 `:bottom`）。完整目录请参见 [Shell 插槽 → 插槽目录](#slot-catalogue)。

最小示例——将横幅固定到 Sessions 页面顶部：

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
        "Remember to label important sessions before archiving."),
    );
  }

  // 用于隐藏标签页的占位组件。
  window.__HERMES_PLUGINS__.register("session-notes", function () { return null; });

  // 实际工作。
  window.__HERMES_PLUGINS__.registerSlot("session-notes", "sessions:top", Banner);
})();
```

关键点：

- `tab.hidden: true` 使插件不出现在侧边栏中——它没有独立的页面。
- `slots` 清单字段仅用于文档记录。实际的绑定发生在 JS 包中的 `registerSlot()` 调用。
- 多个插件可以声明同一个页面作用域的插槽。它们按注册顺序堆叠渲染。
- 当没有插件注册时零影响：内置页面照常渲染。

一个参考插件（[`hermes-example-plugins`](https://github.com/NousResearch/hermes-example-plugins/tree/main/example-dashboard) 中的 `example-dashboard`）提供了一个实时演示，向 `sessions:top` 注入横幅——安装它来端到端地查看该模式。

### 纯插槽插件（`tab.hidden`）

当 `tab.hidden: true` 时，插件注册其组件（用于直接 URL 访问）以及任何插槽，但永远不会在导航中添加标签页。用于仅存在于插槽注入中的插件——头部装饰、侧边栏 HUD、覆盖层等。

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

该包仍然使用占位组件调用 `register()`（以防有人直接访问该 URL 的良好实践），然后调用 `registerSlot()` 来完成实际工作。

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

路由挂载在 `/api/plugins/<name>/` 下，因此上述路由变为：

- `GET  /api/plugins/my-plugin/data`
- `POST /api/plugins/my-plugin/action`

插件 API 路由绕过会话令牌认证，因为仪表板服务器默认绑定到 localhost。**如果你运行不受信任的插件，不要将仪表板暴露在公共接口 `--host 0.0.0.0` 上**——它们的路由也会变得可访问。

#### 访问 Hermes 内部组件

后端路由在仪表板进程内运行，因此可以直接从 hermes-agent 代码库导入：

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

如果你的插件需要 Tailwind 类和内联 `style=` 之外的样式，添加一个 CSS 文件并在清单中引用它：

```json
{
  "css": "dist/style.css"
}
```

该文件在插件加载时作为 `<link>` 标签注入。使用特定的类名以避免与仪表板的样式冲突，并引用仪表板的 CSS 变量来保持主题感知：

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

仪表板将每个 shadcn 令牌暴露为 `--color-*` 以及主题扩展（`--theme-asset-*`、`--component-<bucket>-*`、`--radius`、`--spacing-mul`）。引用这些变量，你的插件将自动随当前主题重新着色。

### 插件发现与重载

仪表板扫描三个目录查找 `dashboard/manifest.json`：

| 优先级 | 目录 | 来源标签 |
|--------|------|----------|
| 1（冲突时优先） | `~/.hermes/plugins/<name>/dashboard/` | `user` |
| 2 | `<repo>/plugins/memory/<name>/dashboard/` | `bundled` |
| 2 | `<repo>/plugins/<name>/dashboard/` | `bundled` |
| 3 | `./.hermes/plugins/<name>/dashboard/` | `project`——仅在设置了 `HERMES_ENABLE_PROJECT_PLUGINS` 时 |

发现结果按仪表板进程缓存。添加新插件后，选择以下方式之一：

```bash
# 强制重新扫描而不重启
curl http://127.0.0.1:9119/api/dashboard/plugins/rescan
```

…或重启 `hermes dashboard`。

#### 插件加载生命周期

1. 仪表板加载。`main.tsx` 在 `window.__HERMES_PLUGIN_SDK__` 上暴露 SDK，在 `window.__HERMES_PLUGINS__` 上暴露注册表。
2. `App.tsx` 调用 `usePlugins()` → 获取 `GET /api/dashboard/plugins`。
3. 对每个清单：注入 CSS `<link>`（如果已声明），然后 `<script>` 标签加载 JS 包。
4. 插件的 IIFE 运行并调用 `window.__HERMES_PLUGINS__.register(name, Component)`——以及可选地对每个插槽调用 `.registerSlot(name, slot, Component)`。
5. 仪表板根据清单解析已注册的组件，将标签页添加到导航（除非 `hidden`），并将组件作为路由挂载。

插件在脚本加载后有最多 **2 秒** 的时间来调用 `register()`。超时后仪表板停止等待并完成初始渲染。如果插件稍后注册，它仍然会出现——导航是响应式的。

如果插件的脚本加载失败（404、语法错误、IIFE 期间的异常），仪表板会在浏览器控制台记录警告并继续运行而不加载该插件。

---

## 主题 + 插件组合演示

[`strike-freedom-cockpit`](https://github.com/NousResearch/hermes-example-plugins/tree/main/strike-freedom-cockpit) 插件（配套仓库 `hermes-example-plugins`）是一个完整的界面换肤演示。它将一个主题 YAML 与一个纯插槽插件配对，无需分叉仪表盘即可生成一个座舱风格的 HUD。

**它演示了：**

- 一个完整的主题，使用了调色板、排版、`fontUrl`、`layoutVariant: cockpit`、`assets`、`componentStyles`（切角卡片、渐变背景）、`colorOverrides` 和 `customCSS`（扫描线叠加效果）。
- 一个纯插槽插件（`tab.hidden: true`），注册到三个插槽中：
  - `sidebar` — 一个 MS-STATUS 面板，带有由 `SDK.api.getStatus()` 驱动的动态遥测条。
  - `header-left` — 一个派系徽章，从活动主题中读取 `--theme-asset-crest`。
  - `footer-right` — 一个自定义标语，替换默认的组织信息行。
- 插件通过 CSS 变量读取主题提供的艺术作品，因此切换主题会改变英雄图/徽章，无需修改插件代码。

**安装方法：**

```bash
git clone https://github.com/NousResearch/hermes-example-plugins.git

# 主题
cp hermes-example-plugins/strike-freedom-cockpit/theme/strike-freedom.yaml \
   ~/.hermes/dashboard-themes/

# 插件
cp -r hermes-example-plugins/strike-freedom-cockpit ~/.hermes/plugins/
```

打开仪表盘，从主题切换器中选择 **Strike Freedom**。座舱侧边栏出现，徽标显示在头部，标语替换了底部信息。切换回 **Hermes Teal** 后，插件仍然安装但不可见（`sidebar` 插槽仅在 `cockpit` 布局变体下渲染）。

阅读插件源码（配套仓库中的 `strike-freedom-cockpit/dashboard/dist/index.js`），了解它如何读取 CSS 变量、防御不支持插槽的旧仪表盘，以及如何从一个包中注册三个插槽。

---

## API 参考

### 主题端点

| 端点 | 方法 | 说明 |
|----------|--------|-------------|
| `/api/dashboard/themes` | GET | 列出可用主题 + 当前活动主题。内置主题返回 `{name, label, description}`；用户主题还包含一个带有完整标准化主题对象的 `definition` 字段。 |
| `/api/dashboard/theme` | PUT | 设置活动主题。请求体：`{"name": "midnight"}`。持久化到 `config.yaml` 的 `dashboard.theme` 下。 |

### 插件端点

| 端点 | 方法 | 说明 |
|----------|--------|-------------|
| `/api/dashboard/plugins` | GET | 列出已发现的插件（含清单，不含内部字段）。 |
| `/api/dashboard/plugins/rescan` | GET | 强制重新扫描插件目录，无需重启。 |
| `/dashboard-plugins/<name>/<path>` | GET | 从插件的 `dashboard/` 目录提供静态资源。路径遍历被阻止。 |
| `/api/plugins/<name>/*` | * | 插件注册的后端路由。 |

### `window` 上的 SDK

| 全局变量 | 类型 | 提供者 |
|--------|------|----------|
| `window.__HERMES_PLUGIN_SDK__` | 对象 | `registry.ts` — React、钩子、UI 组件、API 客户端、工具函数。 |
| `window.__HERMES_PLUGINS__.register(name, Component)` | 函数 | 注册插件的主组件。 |
| `window.__HERMES_PLUGINS__.registerSlot(name, slot, Component)` | 函数 | 注册到命名的外壳插槽中。 |

---

## 故障排除

**我的主题没有出现在选择器中。**
检查文件是否在 `~/.hermes/dashboard-themes/` 中，且以 `.yaml` 或 `.yml` 结尾。刷新页面。运行 `curl http://127.0.0.1:9119/api/dashboard/themes` — 你的主题应该出现在响应中。如果 YAML 有解析错误，仪表盘会将日志写入 `~/.hermes/logs/errors.log`。

**我的插件标签页没有出现。**
1. 检查清单是否在 `~/.hermes/plugins/<name>/dashboard/manifest.json`（注意 `dashboard/` 子目录）。
2. `curl http://127.0.0.1:9119/api/dashboard/plugins/rescan` 强制重新发现。
3. 打开浏览器开发者工具 → 网络 — 确认 `manifest.json`、`index.js` 和任何 CSS 加载时没有 404 错误。
4. 打开浏览器开发者工具 — 控制台 — 查找 IIFE 执行期间的错误或 `window.__HERMES_PLUGINS__ is undefined`（表示 SDK 未初始化，通常是之前的 React 渲染崩溃）。
5. 验证你的包调用 `window.__HERMES_PLUGINS__.register(...)` 时使用的 **name** 与 `manifest.json:name` 一致。

**插槽注册的组件不渲染。**
`sidebar` 插槽仅在活动主题的 `layoutVariant: cockpit` 时渲染。其他插槽始终渲染。如果你注册到的插槽没有命中，在 `registerSlot` 内部添加 `console.log` 来确认插件包确实运行了。

**插件后端路由返回 404。**
1. 确认清单中有 `"api": "plugin_api.py"` 指向 `dashboard/` 内存在的文件。
2. 重启 `hermes dashboard` — 插件 API 路由在启动时挂载一次，**不会**在重新扫描时挂载。
3. 检查 `plugin_api.py` 是否导出了模块级别的 `router = APIRouter()`。其他导出名称不会被识别。
4. 查看 `~/.hermes/logs/errors.log` 中的 `Failed to load plugin <name> API routes` — 导入错误会被记录在那里。

**主题切换后我的颜色覆盖丢失了。**
`colorOverrides` 作用于活动主题，切换主题时会被清除 — 这是设计如此。如果你希望覆盖效果持久化，请将它们放在主题的 YAML 中，而不是实时切换器中。

**主题的 customCSS 被截断了。**
每个主题的 `customCSS` 块上限为 32 KiB。将大型样式表拆分到多个主题中，或切换为通过其 `css` 字段注入完整样式表的插件（无大小限制）。

**我想在 PyPI 上发布插件。**
仪表盘插件通过目录布局安装，而不是通过 pip 入口点。目前最干净的发布方式是用户克隆到 `~/.hermes/plugins/` 的 git 仓库。基于 pip 的仪表盘插件安装器目前尚未接入。