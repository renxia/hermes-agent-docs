---
title: "Design Md — 创作/验证/导出 Google 的 DESIGN.md"
sidebar_label: "Design Md"
description: "创作/验证/导出 Google 的 DESIGN.md"
---

{/* 此页面由网站脚本 `generate-skill-docs.py` 根据技能的 SKILL.md 文件自动生成。请编辑源 SKILL.md，而非此页面。 */}

# Design Md

创作、验证和导出 Google 的 DESIGN.md 规范文件。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/design-md` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `design`, `design-system`, `tokens`, `ui`, `accessibility`, `wcag`, `tailwind`, `dtcg`, `google` |
| 相关技能 | [`popular-web-designs`](/docs/user-guide/skills/bundled/creative/creative-popular-web-designs), [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw), [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram) |

## 参考：完整的 SKILL.md

:::info
以下是此技能被触发时，Hermes 加载的完整技能定义。这就是技能激活时智能体看到的指令。
:::

# DESIGN.md 技能

DESIGN.md 是 Google 开放的规范（Apache-2.0 协议，`google-labs-code/design.md`），用于向编码智能体描述视觉标识。单个文件结合了：
- **YAML 头部元数据** — 机器可读的设计令牌（规范值）
- **Markdown 正文** — 人类可读的原理解释，按规范章节组织

令牌提供精确值。说明文告诉智能体这些值存在的原因以及如何应用它们。CLI 工具 (`npx @google/design.md`) 可检查结构和 WCAG 对比度、比较版本差异以识别回归问题，并导出为 Tailwind 或 W3C DTCG JSON 格式。

## 何时使用此技能

- 用户要求创建一个 DESIGN.md 文件、设计令牌或设计系统规范
- 用户希望在多个项目或工具中保持一致的 UI/品牌风格
- 用户粘贴一个现有的 DESIGN.md 文件，并要求进行检查、比较差异、导出或扩展
- 用户希望将样式指南转换为智能体可消费的格式
- 用户希望对其调色板进行对比度 / WCAG 无障碍性验证

如果只是需要纯视觉灵感或布局示例，请使用 `popular-web-designs` 技能。如果设计一个一次性 HTML 作品（原型、演示文稿、着陆页、组件库）时需要*过程和品味*，请使用 `claude-design` 技能。此技能用于*正式的规范文件*本身。

## 文件结构

```md
---
version: alpha
name: Heritage
description: Architectural minimalism meets journalistic gravitas.
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  tertiary: "#B8422E"
  neutral: "#F7F5F2"
typography:
  h1:
    fontFamily: Public Sans
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body-md:
    fontFamily: Public Sans
    fontSize: 1rem
rounded:
  sm: 4px
  md: 8px
  lg: 16px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
---

## 概述

建筑极简主义与新闻庄重感相结合...

## 颜色

- **主色 (#1A1C1E):** 深墨色，用于标题和核心文本。
- **第三色 (#B8422E):** "波士顿粘土"色 — 交互的唯一主色调。

## 排版

除了小号全大写标签外，所有内容均使用 Public Sans 字体...

## 组件

`button-primary` 是页面上唯一高强调度的操作...
```

## 令牌类型

| 类型 | 格式 | 示例 |
|------|--------|---------|
| 颜色 | `#` + 十六进制 (sRGB) | `"#1A1C1E"` |
| 尺寸 | 数字 + 单位 (`px`, `em`, `rem`) | `48px`, `-0.02em` |
| 令牌引用 | `{路径.到.令牌}` | `{colors.primary}` |
| 排版 | 包含 `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `fontFeature`, `fontVariation` 的对象 | 见上文 |

组件属性白名单：`backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`。变体（悬停、活动、按下）是**独立的组件条目**，键名相关联（如 `button-primary-hover`），而非嵌套。

## 规范章节顺序

章节是可选的，但存在的章节**必须**按此顺序出现。重复的标题会导致文件被拒绝。

1.  概述 (别名：品牌与风格)
2.  颜色
3.  排版
4.  布局 (别名：布局与间距)
5.  浮层与深度 (别名：浮层)
6.  形状
7.  组件
8.  注意事项

未知章节会被保留，不会报错。如果值类型有效，未知的令牌名称会被接受。未知的组件属性会产生警告。

## 工作流程：创建新的 DESIGN.md

1.  **询问用户**（或推断）品牌调性、强调色和排版方向。如果用户提供了网站、图片或氛围，将其转换为上述令牌结构。
2.  **在项目根目录编写 `DESIGN.md`** 文件（使用 `write_file`）。务必包含 `name:` 和 `colors:`；其他章节可选但建议包含。
3.  **在 `components:` 部分使用令牌引用**（例如 `{colors.primary}`）而不是重复输入十六进制值。这可以保持调色板的单一来源。
4.  **检查它**（见下文）。在返回之前，修复任何无效引用或 WCAG 失败。
5.  **如果用户有现有项目**，还需将 Tailwind 或 DTCG 导出文件与主文件放在一起（`tailwind.theme.json`, `tokens.json`）。

## 工作流程：检查 / 比较差异 / 导出

CLI 工具是 `@google/design.md`（Node）。使用 `npx` — 无需全局安装。

```bash
# 验证结构 + 令牌引用 + WCAG 对比度
npx -y @google/design.md lint DESIGN.md

# 比较两个版本，失败时报告回归（退出码 1 = 存在回归）
npx -y @google/design.md diff DESIGN.md DESIGN-v2.md

# 导出为 Tailwind 主题 JSON
npx -y @google/design.md export --format tailwind DESIGN.md > tailwind.theme.json

# 导出为 W3C DTCG (设计令牌格式模块) JSON
npx -y @google/design.md export --format dtcg DESIGN.md > tokens.json

# 打印规范本身 — 当注入智能体提示时很有用
npx -y @google/design.md spec --rules-only --format json
```

所有命令都接受 `-` 表示标准输入。`lint` 命令在出错时返回退出码 1。如果需要结构化地报告发现，请使用 `--format json` 标志并解析输出。

### 检查规则参考（这 7 条规则捕获的问题）

- `broken-ref` (错误) — `{colors.missing}` 指向不存在的令牌
- `duplicate-section` (错误) — 相同的 `## 标题` 出现两次
- `invalid-color`, `invalid-dimension`, `invalid-typography` (错误)
- `wcag-contrast` (警告/信息) — 组件的 `textColor` 与 `backgroundColor` 的对比度是否符合 WCAG AA (4.5:1) 和 AAA (7:1) 标准
- `unknown-component-property` (警告) — 不在上述白名单中的属性

当用户关心可访问性时，请在你的总结中明确指出这一点 — WCAG 发现是使用 CLI 工具最重要的理由。

## 注意事项

- **不要嵌套组件变体。** `button-primary.hover` 是错误的；将 `button-primary-hover` 作为同级键才是正确的。
- **十六进制颜色值必须用引号括起。** 否则 YAML 会因 `#` 而报错，或奇怪地截断 `#1A1C1E` 这样的值。
- **负尺寸也需要引号。** `letterSpacing: -0.02em` 会被解析为 YAML 流 — 应写为 `letterSpacing: "-0.02em"`。
- **章节顺序是强制的。** 如果用户提供的说明顺序是随机的，在保存前请按规范列表重新排序。
- **`version: alpha` 是当前的规范版本**（截至 2026 年 4 月）。该规范标记为 alpha 版 — 需留意破坏性变更。
- **令牌引用通过点分路径解析。** `{colors.primary}` 有效；`{primary}` 无效。

## 规范的权威来源

- 仓库：https://github.com/google-labs-code/design.md (Apache-2.0 协议)
- CLI：npm 上的 `@google/design.md`
- 生成的 DESIGN.md 文件许可：遵循用户项目的许可；规范本身是 Apache-2.0 协议。