---
title: "架构图 — 暗色主题的 SVG 架构/云/基础设施图转为 HTML"
sidebar_label: "架构图"
description: "暗色主题的 SVG 架构/云/基础设施图转为 HTML"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。 */}

# 架构图

暗色主题的 SVG 架构/云/基础设施图，呈现为 HTML。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/creative/architecture-diagram` |
| 版本 | `1.0.0` |
| 作者 | Cocoon AI (hello@cocoon-ai.com)，由 Hermes 智能体移植 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `架构`, `图表`, `SVG`, `HTML`, `可视化`, `基础设施`, `云` |
| 相关技能 | [`concept-diagrams`](/docs/user-guide/skills/optional/creative/creative-concept-diagrams), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 加载此技能时使用的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 架构图技能

生成专业的、暗色主题的技术架构图，作为内联 SVG 图形的独立 HTML 文件。无需外部工具、API 密钥或渲染库 — 只需编写 HTML 文件并在浏览器中打开即可。

## 适用范围

**最适合：**
- 软件系统架构（前端 / 后端 / 数据库层）
- 云基础设施（VPC、区域、子网、托管服务）
- 微服务 / 服务网格拓扑
- 数据库 + API 映射、部署图
- 任何符合暗色网格背景美学的技术基础设施主题

**请优先考虑其他选项：**
- 物理、化学、数学、生物或其他科学主题
- 物理对象（车辆、硬件、解剖结构、横截面）
- 平面图、叙述性旅程、教育/教科书式视觉内容
- 手绘白板草图（考虑 `excalidraw`）
- 动画解释器（考虑动画技能）

如果存在针对该主题的更专业技能，请优先使用。如果没有合适的技能，此技能也可作为通用 SVG 图表的备选方案 — 输出将携带下文描述的暗色技术美感。

基于 [Cocoon AI 的架构图生成器](https://github.com/Cocoon-AI/architecture-diagram-generator) (MIT)。

## 工作流程

1. 用户描述其系统架构（组件、连接、技术）
2. 按照下述设计系统生成 HTML 文件
3. 使用 `write_file` 保存为 `.html` 文件（例如 `~/architecture-diagram.html`）
4. 用户在任何浏览器中打开 — 支持离线使用，无外部依赖

### 输出位置

将图表保存到用户指定的路径，或默认保存到当前工作目录：
```
./[项目名称]-架构图.html
```

### 预览

保存后，建议用户打开它：
```bash
# macOS
open ./我的架构图.html
# Linux
xdg-open ./我的架构图.html
```

## 设计系统与视觉语言

### 调色板 (语义映射)

使用特定的 `rgba` 填充和十六进制描边对组件进行分类：

| 组件类型 | 填充 (rgba) | 描边 (十六进制) |
| :--- | :--- | :--- |
| **前端** | `rgba(8, 51, 68, 0.4)` | `#22d3ee` (cyan-400) |
| **后端** | `rgba(6, 78, 59, 0.4)` | `#34d399` (emerald-400) |
| **数据库** | `rgba(76, 29, 149, 0.4)` | `#a78bfa` (violet-400) |
| **AWS/云** | `rgba(120, 53, 15, 0.3)` | `#fbbf24` (amber-400) |
| **安全** | `rgba(136, 19, 55, 0.4)` | `#fb7185` (rose-400) |
| **消息总线** | `rgba(251, 146, 60, 0.3)` | `#fb923c` (orange-400) |
| **外部** | `rgba(30, 41, 59, 0.5)` | `#94a3b8` (slate-400) |

### 排版与背景
- **字体：** JetBrains Mono（等宽字体），从 Google Fonts 加载
- **尺寸：** 12px（名称），9px（子标签），8px（注释），7px（微小标签）
- **背景：** Slate-950 (`#020617`)，带有细微的 40px 网格图案

```svg
<!-- 背景网格图案 -->
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.5"/>
</pattern>
```

## 技术实现细节

### 组件渲染
组件是圆角矩形 (`rx="6"`)，描边宽度为 1.5px。为防止箭头穿透半透明填充，使用**双重矩形遮罩技术**：
1. 绘制不透明背景矩形 (`#0f172a`)
2. 在其上绘制带样式的半透明矩形

### 连接规则
- **Z 轴顺序：** 在 SVG 中*较早*绘制箭头（在网格之后），使它们渲染在组件框之后。
- **箭头：** 通过 SVG 标记定义。
- **安全流：** 使用玫瑰色 (`#fb7185`) 的虚线。
- **边界：**
  - *安全组：* 虚线 (`4,4`)，玫瑰色
  - *区域：* 大虚线 (`8,4`)，琥珀色，`rx="12"`

### 间距与布局逻辑
- **标准高度：** 60px（服务）；80-120px（大型组件）
- **垂直间距：** 组件之间至少 40px
- **消息总线：** 必须放置在服务*之间的空隙*中，不得重叠
- **图例位置：** **至关重要。** 必须放置在所有边界框之外。计算所有边界的最低 Y 坐标，并将图例放置在其下方至少 20px 处。

## 文档结构

生成的 HTML 文件遵循四部分布局：
1. **页眉：** 带有脉动点指示器的标题和副标题
2. **主 SVG：** 包含图表的圆角边框卡片
3. **摘要卡片：** 图表下方用于高级细节的三卡片网格
4. **页脚：** 最小化元数据

### 信息卡片模式
```html
<div class="card">
  <div class="card-header">
    <div class="card-dot cyan"></div>
    <h3>标题</h3>
  </div>
  <ul>
    <li>• 项目一</li>
    <li>• 项目二</li>
  </ul>
</div>
```

## 输出要求
- **单个文件：** 一个自包含的 `.html` 文件
- **无外部依赖：** 所有 CSS 和 SVG 必须内联（Google Fonts 除外）
- **无 JavaScript：** 对于任何动画（如脉动点）使用纯 CSS
- **兼容性：** 必须在任何现代网页浏览器中正确渲染

## 模板参考

加载完整的 HTML 模板以获取确切的结构、CSS 和 SVG 组件示例：

```
skill_view(name="architecture-diagram", file_path="templates/template.html")
```

模板包含每种组件类型（前端、后端、数据库、云、安全）、箭头样式（标准、虚线、曲线）、安全组、区域边界和图例的工作示例 — 在生成图表时将其用作结构参考。