---
title: "设计 Markdown — 编写/验证/导出 Google 的 DESIGN"
sidebar_label: "设计 Markdown"
description: "编写/验证/导出 Google 的 DESIGN"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 设计 Markdown

编写、验证或导出 Google 的 DESIGN.md 令牌规范文件。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/creative/design-md` |
| 版本 | `1.0.0` |
| 作者 | 赫尔墨斯智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `design`, `design-system`, `tokens`, `ui`, `accessibility`, `wcag`, `tailwind`, `dtcg`, `google` |
| 相关技能 | [`popular-web-designs`](/user-guide/skills/bundled/creative/creative-popular-web-designs), [`claude-design`](/user-guide/skills/bundled/creative/creative-claude-design), [`excalidraw`](/user-guide/skills/bundled/creative/creative-excalidraw), [`architecture-diagram`](/user-guide/skills/bundled/creative/creative-architecture-diagram) |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，赫尔墨斯加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# DESIGN.md 技能

DESIGN.md 是 Google 的开放规范 (Apache-2.0, `google-labs-code/design.md`)，用于向编码智能体描述视觉标识。一个文件包含：

- **YAML 前言** —— 机器可读的设计令牌（规范值）
- **Markdown 正文** —— 人类可读的原理说明，组织成规范章节

令牌提供精确值。正文告诉智能体*为什么*存在这些值以及如何应用它们。命令行工具 (`npx @google/design.md`) 用于检查结构和 WCAG 对比度、比较版本差异以发现回归问题，并导出为 Tailwind 或 W3C DTCG JSON 格式。

## 何时使用此技能

- 用户要求生成 DESIGN.md 文件、设计令牌或设计系统规范
- 用户希望跨多个项目或工具保持一致的 UI/品牌
- 用户粘贴一个现有的 DESIGN.md 并要求检查、比较、导出或扩展它
- 用户要求将样式指南转换为智能体可消费的格式
- 用户希望对其调色板进行对比度 / WCAG 无障碍性验证

对于纯粹的视觉灵感或布局示例，请使用 `popular-web-designs`。对于*从零开始设计一次性 HTML 工件（原型、演示文稿、落地页、组件实验室）时的过程和品味*，请使用 `claude-design`。此技能是用于*规范文件本身*的。

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

建筑极简主义与新闻庄重感相遇...

## 颜色

- **主色 (#1A1C1E)：** 用于标题和正文核心文本的深墨色。
- **第三色 (#B8422E)：** "波士顿粘土" —— 交互的唯一驱动色。

## 字体排印

除小型全大写标签外，其余全部使用 Public Sans...

## 组件

`button-primary` 是页面上唯一的高强调性操作...
```

## 令牌类型

| 类型 | 格式 | 示例 |
|------|--------|---------|
| 颜色 | `#` + 十六进制 (sRGB) | `"#1A1C1E"` |
| 尺寸 | 数字 + 单位 (`px`, `em`, `rem`) | `48px`, `-0.02em` |
| 令牌引用 | `{路径.到.令牌}` | `{colors.primary}` |
| 字体排印 | 包含 `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `fontFeature`, `fontVariation` 的对象 | 见上文 |

组件属性白名单：`backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`。变体（悬停、激活、按下）是**独立的组件条目**，使用相关的键名（`button-primary-hover`），而非嵌套结构。

## 规范章节顺序

章节是可选的，但存在的章节必须按此顺序出现。重复的标题会导致文件被拒绝。

1. 概述 (别名：品牌与风格)
2. 颜色
3. 字体排印
4. 布局 (别名：布局与间距)
5. 层级与深度 (别名：层级)
6. 形状
7. 组件
8. 行为准则

未知章节会被保留，不会报错。如果值类型有效，则接受未知的令牌名称。未知的组件属性会产生警告。

## 工作流：创建新的 DESIGN.md

1. **询问用户** (或推断) 品牌调性、强调色和字体排印方向。如果他们提供了网站、图片或氛围，将其转换为上面的令牌形式。
2. **编写 `DESIGN.md`**，放在他们的项目根目录中，使用 `write_file`。始终包含 `name:` 和 `colors:`；其他章节可选但鼓励包含。
3. **在 `components:` 部分使用令牌引用** (`{colors.primary}`) 代替重复输入十六进制值。这可以保持调色板的单一来源。
4. **检查它** (见下文)。在返回之前修复任何损坏的引用或 WCAG 失败。
5. **如果用户有现有项目**，也在文件旁边编写 Tailwind 或 DTCG 导出文件 (`tailwind.theme.json`, `tokens.json`)。

## 工作流：检查 / 比较 / 导出

命令行工具是 `@google/design.md` (Node)。使用 `npx` —— 无需全局安装。

```bash
# 验证结构 + 令牌引用 + WCAG 对比度
npx -y @google/design.md lint DESIGN.md

# 比较两个版本，遇到回归问题则失败 (exit 1 = 回归)
npx -y @google/design.md diff DESIGN.md DESIGN-v2.md

# 导出为 Tailwind 主题 JSON
npx -y @google/design.md export --format tailwind DESIGN.md > tailwind.theme.json

# 导出为 W3C DTCG (设计令牌格式模块) JSON
npx -y @google/design.md export --format dtcg DESIGN.md > tokens.json

# 打印规范本身 —— 在将内容注入智能体提示时很有用
npx -y @google/design.md spec --rules-only --format json
```

所有命令都接受 `-` 作为标准输入。`lint` 在出错时返回退出码 1。如果需要结构化地报告发现，请使用 `--format json` 标志并解析输出。

### 检查规则参考 (7 条规则捕获什么)

- `broken-ref` (错误) —— `{colors.missing}` 指向一个不存在的令牌
- `duplicate-section` (错误) —— 同一个 `## 标题` 出现两次
- `invalid-color`, `invalid-dimension`, `invalid-typography` (错误)
- `wcag-contrast` (警告/信息) —— 组件的 `textColor` 与 `backgroundColor` 的比率是否符合 WCAG AA (4.5:1) 和 AAA (7:1)
- `unknown-component-property` (警告) —— 超出上述白名单范围

当用户关注无障碍性时，请在你的摘要中明确指出 —— WCAG 发现是使用此命令行工具最重要的原因。

## 常见陷阱

- **不要嵌套组件变体。** `button-primary.hover` 是错误的；作为同级键的 `button-primary-hover` 才是正确的。
- **十六进制颜色必须用带引号的字符串。** 否则 YAML 会在 `#` 处中断或奇怪地截断像 `#1A1C1E` 这样的值。
- **负尺寸也需要引号。** `letterSpacing: -0.02em` 会被解析为 YAML 流 —— 应写作 `letterSpacing: "-0.02em"`。
- **章节顺序是强制的。** 如果用户提供的正文顺序是随机的，请在保存前将其重新排序以匹配规范列表。
- **`version: alpha` 是当前的规范版本** (截至 2026 年 4 月)。该规范标记为 alpha —— 请注意可能的破坏性更改。
- **令牌引用通过点分路径解析。** `{colors.primary}` 有效；`{primary}` 无效。

## 规范的原始来源

- 仓库：https://github.com/google-labs-code/design.md (Apache-2.0)
- 命令行工具：npm 上的 `@google/design.md`
- 生成的 DESIGN.md 文件的许可证：取决于用户的项目；规范本身采用 Apache-2.0 许可证。