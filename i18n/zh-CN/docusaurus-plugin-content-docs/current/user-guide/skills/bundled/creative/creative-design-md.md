---
title: "Design Md — 编写/验证/导出 Google 的 DESIGN 文件"
sidebar_label: "Design Md"
description: "编写/验证/导出 Google 的 DESIGN 文件"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Design Md

编写、验证或导出 Google 的 DESIGN.md 令牌规范文件。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/creative/design-md` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `design`, `design-system`, `tokens`, `ui`, `accessibility`, `wcag`, `tailwind`, `dtcg`, `google` |
| 相关技能 | [`popular-web-designs`](/docs/user-guide/skills/bundled/creative/creative-popular-web-designs), [`claude-design`](/docs/user-guide/skills/bundled/creative/creative-claude-design), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw), [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram) |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# DESIGN.md 技能

DESIGN.md 是 Google 的开放规范 (Apache-2.0, `google-labs-code/design.md`)，用于向编码智能体描述视觉标识。一个文件结合了：

- **YAML 前置元数据** — 机器可读的设计令牌 (规范性值)
- **Markdown 正文** — 人类可读的设计原理，组织成规范章节

令牌提供精确的值。文字说明则告诉智能体这些值存在的原因以及如何应用它们。命令行工具 (`npx @google/design.md`) 可以检查结构和 WCAG 对比度、对比不同版本以发现回归问题，并导出到 Tailwind 或 W3C DTCG JSON。

## 何时使用此技能

- 用户要求生成 DESIGN.md 文件、设计令牌或设计系统规范
- 用户希望在多个项目或工具之间保持一致的 UI/品牌
- 用户粘贴现有的 DESIGN.md 并要求检查、对比、导出或扩展它
- 用户希望将风格指南移植为智能体可消费的格式
- 用户希望对其调色板进行对比度 / WCAG 无障碍性验证

如果纯粹为了视觉灵感或布局示例，请改用 `popular-web-designs`。对于从零开始设计一次性 HTML 制品（原型、演示文稿、落地页、组件实验室）时的 *流程和品味*，请使用 `claude-design`。此技能适用于 *正式的规范文件本身*。

## 文件结构

```md
---
version: alpha
name: Heritage
description: 建筑极简主义与新闻庄重感相遇。
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

## 概览

建筑极简主义与新闻庄重感相遇...

## 颜色

- **主色 (#1A1C1E):** 深墨色，用于标题和核心文本。
- **第三色 (#B8422E):** “波士顿黏土色” — 唯一用于交互的驱动色。

## 排版

除了小型全大写标签外，所有内容均使用 Public Sans...

## 组件

`button-primary` 是页面上唯一一个高强调度的操作...
```

## 令牌类型

| 类型 | 格式 | 示例 |
|------|--------|---------|
| 颜色 | `#` + 十六进制 (sRGB) | `"#1A1C1E"` |
| 尺寸 | 数字 + 单位 (`px`, `em`, `rem`) | `48px`, `-0.02em` |
| 令牌引用 | `{path.to.token}` | `{colors.primary}` |
| 排版 | 包含 `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `fontFeature`, `fontVariation` 的对象 | 见上文 |

组件属性白名单：`backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`。变体（悬停、激活、按下）是**独立的组件条目**，使用相关的键名（`button-primary-hover`），而不是嵌套的。

## 规范章节顺序

章节是可选的，但存在的章节**必须**按此顺序出现。重复的标题将拒绝文件。

1. 概览 (别名：品牌与风格)
2. 颜色
3. 排版
4. 布局 (别名：布局与间距)
5. 阴影与深度 (别名：阴影)
6. 形状
7. 组件
8. 应做与不应做

未知的章节将被保留，不会报错。未知的令牌名称，只要值类型有效，也会被接受。未知的组件属性会产生警告。

## 工作流程：编写新的 DESIGN.md

1. **询问用户** (或推断) 品牌调性、强调色和排版方向。如果他们提供了网站、图片或氛围，将其转换为上述的令牌形状。
2. **编写 `DESIGN.md`** 到其项目根目录，使用 `write_file`。始终包含 `name:` 和 `colors:`；其他章节可选但建议包含。
3. **使用令牌引用** (`{colors.primary}`) 在 `components:` 部分，而不是重新输入十六进制值。保持调色板为单一来源。
4. **检查它** (见下文)。在返回前修复任何损坏的引用或 WCAG 失败项。
5. **如果用户有现有项目**，同时也将 Tailwind 或 DTCG 导出文件写在文件旁边 (`tailwind.theme.json`, `tokens.json`)。

## 工作流程：检查 / 对比 / 导出

命令行工具是 `@google/design.md` (Node)。使用 `npx` — 无需全局安装。

```bash
# 验证结构 + 令牌引用 + WCAG 对比度
npx -y @google/design.md lint DESIGN.md

# 比较两个版本，遇到回归失败时返回 (退出码 1 = 回归)
npx -y @google/design.md diff DESIGN.md DESIGN-v2.md

# 导出为 Tailwind 主题 JSON
npx -y @google/design.md export --format tailwind DESIGN.md > tailwind.theme.json

# 导出为 W3C DTCG (设计令牌格式模块) JSON
npx -y @google/design.md export --format dtcg DESIGN.md > tokens.json

# 打印规范本身 — 当注入到智能体提示中时很有用
npx -y @google/design.md spec --rules-only --format json
```

所有命令接受 `-` 作为标准输入。`lint` 在出错时返回退出码 1。如果需要结构化报告结果，请使用 `--format json` 标志并解析输出。

### 检查规则参考 (7 条规则捕获的问题)

- `broken-ref` (错误) — `{colors.missing}` 指向了不存在的令牌
- `duplicate-section` (错误) — 同一个 `## 标题` 出现了两次
- `invalid-color`, `invalid-dimension`, `invalid-typography` (错误)
- `wcag-contrast` (警告/信息) — 组件的 `textColor` 与 `backgroundColor` 对比度相对于 WCAG AA (4.5:1) 和 AAA (7:1) 的比率
- `unknown-component-property` (警告) — 超出了上述白名单范围

当用户关心无障碍性时，请在你的总结中明确指出这一点 — WCAG 结果是使用该命令行工具最重要的原因。

## 易错点

- **不要嵌套组件变体。** `button-primary.hover` 是错误的；`button-primary-hover` 作为同级键才是正确的。
- **十六进制颜色必须是带引号的字符串。** 否则 YAML 会在 `#` 处卡住，或奇怪地截断像 `#1A1C1E` 这样的值。
- **负尺寸也需要引号。** `letterSpacing: -0.02em` 会被解析为 YAML 流 — 应写为 `letterSpacing: "-0.02em"`。
- **章节顺序是强制性的。** 如果用户给你的文字顺序随机，在保存前重新排序以匹配规范列表。
- **`version: alpha` 是当前规范版本** (截至 2026 年 4 月)。该规范标记为 alpha — 注意破坏性更改。
- **令牌引用通过点路径解析。** `{colors.primary}` 有效；`{primary}` 无效。

## 规范来源

- 仓库: https://github.com/google-labs-code/design.md (Apache-2.0)
- 命令行工具: npm 上的 `@google/design.md`
- 生成的 DESIGN.md 文件的许可证: 遵循用户项目的许可证；规范本身是 Apache-2.0。