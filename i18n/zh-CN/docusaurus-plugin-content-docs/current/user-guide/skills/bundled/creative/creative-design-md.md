---
title: "Design Md — 编写、验证、比较差异并导出 DESIGN"
sidebar_label: "Design Md"
description: "编写、验证、比较差异并导出 DESIGN"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Design Md

编写、验证、比较差异并导出 DESIGN.md 文件 — Google 开源的格式规范，为编码智能体提供对设计系统（在一个文件中包含令牌及其原理）持久化、结构化的理解。适用于构建设计系统、在项目间迁移样式规则、生成具有一致品牌风格的 UI，或审计可访问性/对比度。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/design-md` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 标签 | `design`, `design-system`, `tokens`, `ui`, `accessibility`, `wcag`, `tailwind`, `dtcg`, `google` |
| 相关技能 | [`popular-web-designs`](/docs/user-guide/skills/bundled/creative/creative-popular-web-designs), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw), [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# DESIGN.md 技能

DESIGN.md 是 Google 的开源规范（Apache-2.0，`google-labs-code/design.md`），用于向编码智能体描述视觉标识。一个文件结合了：

- **YAML 前置元数据** — 机器可读的设计令牌（规范值）
- **Markdown 正文** — 人类可读的原理说明，组织成标准章节

令牌提供精确值。正文则告诉智能体这些值存在的原因以及如何应用它们。CLI 工具（`npx @google/design.md`）可检查结构 + WCAG 对比度，比较版本以发现回归，并导出为 Tailwind 或 W3C DTCG JSON 格式。

## 何时使用此技能

- 用户请求 DESIGN.md 文件、设计令牌或设计系统规范
- 用户希望在多个项目或工具中保持一致的 UI/品牌风格
- 用户粘贴现有的 DESIGN.md 并请求进行校验、比较差异、导出或扩展
- 用户请求将样式指南转换为智能体可消费的格式
- 用户希望对其调色板进行对比度 / WCAG 可访问性验证

如果仅需纯粹的视觉灵感或布局示例，请改用 `popular-web-designs`。此技能用于处理*规范文件本身*。

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

Architectural Minimalism meets Journalistic Gravitas...

## 颜色

- **Primary (#1A1C1E):** 深墨色，用于标题和核心文本。
- **Tertiary (#B8422E):** “Boston Clay” — 交互操作的唯一驱动色。

## 字体

除小型全大写标签外，所有元素均使用 Public Sans...

## 组件

`button-primary` 是页面上唯一的高强调操作按钮...

```

## 令牌类型

| 类型 | 格式 | 示例 |
|------|--------|---------|
| 颜色 | `#` + 十六进制（sRGB） | `"#1A1C1E"` |
| 尺寸 | 数字 + 单位（`px`, `em`, `rem`） | `48px`, `-0.02em` |
| 令牌引用 | `{path.to.token}` | `{colors.primary}` |
| 字体 | 包含 `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `fontFeature`, `fontVariation` 的对象 | 参见上文 |

组件属性白名单：`backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`。变体（悬停、激活、按下）是**独立的组件条目**，使用相关的键名（`button-primary-hover`），而非嵌套。

## 标准章节顺序

章节是可选的，但存在的章节必须按此顺序出现。重复的标题将导致文件被拒绝。

1. 概述（别名：品牌与风格）
2. 颜色
3. 字体
4. 布局（别名：布局与间距）
5. 高程与深度（别名：高程）
6. 形状
7. 组件
8. 应该做和不应该做的事项

未知章节将被保留，不会报错。如果值类型有效，则接受未知的令牌名称。未知的组件属性会产生警告。

## 工作流：编写新的 DESIGN.md

1. **询问用户**（或推断）品牌基调、强调色和字体方向。如果他们提供了网站、图像或氛围，请将其转换为上述令牌形式。
2. **在项目根目录中使用 `write_file` 编写 `DESIGN.md`**。始终包含 `name:` 和 `colors:`；其他章节可选，但建议包含。
3. **在 `components:` 部分使用令牌引用**（`{colors.primary}`），而不是重复输入十六进制值。保持调色板单一来源。
4. **进行校验**（见下文）。在返回之前修复任何损坏的引用或 WCAG 失败项。
5. **如果用户已有现有项目**，请在文件旁边同时编写 Tailwind 或 DTCG 导出文件（`tailwind.theme.json`, `tokens.json`）。

## 工作流：校验 / 比较差异 / 导出

CLI 工具为 `@google/design.md`（Node）。使用 `npx` — 无需全局安装。

```bash
# 验证结构 + 令牌引用 + WCAG 对比度
npx -y @google/design.md lint DESIGN.md

# 比较两个版本，发现回归时失败（退出码 1 = 回归）
npx -y @google/design.md diff DESIGN.md DESIGN-v2.md

# 导出为 Tailwind 主题 JSON
npx -y @google/design.md export --format tailwind DESIGN.md > tailwind.theme.json

# 导出为 W3C DTCG（Design Tokens Format Module）JSON
npx -y @google/design.md export --format dtcg DESIGN.md > tokens.json

# 打印规范本身 — 在注入到智能体提示时很有用
npx -y @google/design.md spec --rules-only --format json
```

所有命令都接受 `-` 作为标准输入。`lint` 在出错时返回退出码 1。如果需要结构化地报告结果，请使用 `--format json` 标志并解析输出。

### 校验规则参考（7 条规则捕获的内容）

- `broken-ref`（错误）— `{colors.missing}` 指向不存在的令牌
- `duplicate-section`（错误）— 同一 `## 标题` 出现两次
- `invalid-color`, `invalid-dimension`, `invalid-typography`（错误）
- `wcag-contrast`（警告/信息）— 组件 `textColor` 与 `backgroundColor` 的对比度比率，对照 WCAG AA（4.5:1）和 AAA（7:1）
- `unknown-component-property`（警告）— 超出上述白名单范围

当用户关心可访问性时，请在摘要中明确指出这一点 — WCAG 结果是使用 CLI 工具最重要的原因。

## 陷阱

- **不要嵌套组件变体。** `button-primary.hover` 是错误的；`button-primary-hover` 作为同级键是正确的。
- **十六进制颜色必须用引号括起来。** 否则 YAML 会因 `#` 而解析失败，或截断类似 `#1A1C1E` 的值。
- **负尺寸也需要引号。** `letterSpacing: -0.02em` 会被解析为 YAML 流 — 应写为 `letterSpacing: "-0.02em"`。
- **章节顺序是强制性的。** 如果用户提供的正文顺序随机，请在保存前将其重新排序以匹配标准列表。
- **`version: alpha` 是当前规范版本**（截至 2026 年 4 月）。该规范标记为 alpha — 请注意破坏性变更。
- **令牌引用通过点路径解析。** `{colors.primary}` 有效；`{primary}` 无效。

## 规范真相来源

- 仓库：https://github.com/google-labs-code/design.md (Apache-2.0)
- CLI：npm 上的 `@google/design.md`
- 生成的 DESIGN.md 文件的许可证：由用户的项目决定；规范本身为 Apache-2.0。