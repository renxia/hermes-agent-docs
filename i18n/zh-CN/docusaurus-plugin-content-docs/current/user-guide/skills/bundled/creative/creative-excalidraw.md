---
title: "Excalidraw — 手绘风格的 Excalidraw JSON 图表（架构、流程、序列）"
sidebar_label: "Excalidraw"
description: "手绘风格的 Excalidraw JSON 图表（架构、流程、序列）"
---

{/* 此页面由网站脚本 scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Excalidraw

手绘风格的 Excalidraw JSON 图表（架构、流程、序列）。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/excalidraw` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Excalidraw`, `图表`, `流程图`, `架构`, `可视化`, `JSON` |

## 参考：完整 SKILL.md 文件

:::info
以下是 Hermes 智能体在此技能触发时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Excalidraw 图表技能

通过编写标准的 Excalidraw 元素 JSON 并将其保存为 `.excalidraw` 文件来创建图表。这些文件可以拖放到 [excalidraw.com](https://excalidraw.com) 上进行查看和编辑。无需账户，无需 API 密钥，无需渲染库——只需 JSON。

## 何时使用

为架构图、流程图、序列图、概念图等生成 `.excalidraw` 文件。文件可以在 excalidraw.com 打开或上传以获取可分享链接。

## 工作流程

1.  **加载此技能**（您已经完成了）
2.  **编写元素 JSON** —— 一个 Excalidraw 元素对象的数组
3.  **保存文件**，使用 `write_file` 创建一个 `.excalidraw` 文件
4.  **可选上传**，使用终端通过 `scripts/upload.py` 获取可分享链接

### 保存图表

将您的元素数组包裹在标准的 `.excalidraw` 信封中，并使用 `write_file` 保存：

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "hermes-agent",
  "elements": [ ...此处放置您的元素数组... ],
  "appState": {
    "viewBackgroundColor": "#ffffff"
  }
}
```

保存到任意路径，例如 `~/diagrams/my_diagram.excalidraw`。

### 上传以获取可分享链接

通过终端运行上传脚本（位于此技能的 `scripts/` 目录）：

```bash
python skills/diagramming/excalidraw/scripts/upload.py ~/diagrams/my_diagram.excalidraw
```

这会将图表上传到 excalidraw.com（无需账户）并打印一个可分享的 URL。需要 `cryptography` pip 包（`pip install cryptography`）。

---

## 元素格式参考

### 必填字段（所有元素）
`type`, `id`（唯一字符串）, `x`, `y`, `width`, `height`

### 默认值（跳过这些——它们会自动应用）
- `strokeColor`: `"#1e1e1e"`
- `backgroundColor`: `"transparent"`
- `fillStyle`: `"solid"`
- `strokeWidth`: `2`
- `roughness`: `1`（手绘外观）
- `opacity`: `100`

画布背景为白色。

### 元素类型

**矩形**:
```json
{ "type": "rectangle", "id": "r1", "x": 100, "y": 100, "width": 200, "height": 100 }
```
- `roundness: { "type": 3 }` 用于圆角
- `backgroundColor: "#a5d8ff"`, `fillStyle: "solid"` 用于填充

**椭圆**:
```json
{ "type": "ellipse", "id": "e1", "x": 100, "y": 100, "width": 150, "height": 150 }
```

**菱形**:
```json
{ "type": "diamond", "id": "d1", "x": 100, "y": 100, "width": 150, "height": 150 }
```

**带标签的形状（容器绑定）** -- 创建一个绑定到形状的文本元素：

> **警告：** 请勿在形状上使用 `"label": { "text": "..." }`。这不是一个有效的
> Excalidraw 属性，将被静默忽略，产生空白形状。您**必须**
> 使用下面的容器绑定方法。

形状需要 `boundElements` 列出文本，文本需要 `containerId` 指向回来：
```json
{ "type": "rectangle", "id": "r1", "x": 100, "y": 100, "width": 200, "height": 80,
  "roundness": { "type": 3 }, "backgroundColor": "#a5d8ff", "fillStyle": "solid",
  "boundElements": [{ "id": "t_r1", "type": "text" }] },
{ "type": "text", "id": "t_r1", "x": 105, "y": 110, "width": 190, "height": 25,
  "text": "Hello", "fontSize": 20, "fontFamily": 1, "strokeColor": "#1e1e1e",
  "textAlign": "center", "verticalAlign": "middle",
  "containerId": "r1", "originalText": "Hello", "autoResize": true }
```
- 适用于矩形、椭圆、菱形
- 当设置了 `containerId` 时，文本由 Excalidraw 自动居中
- 文本的 `x`/`y`/`width`/`height` 是近似的——Excalidraw 在加载时会重新计算
- `originalText` 应与 `text` 匹配
- 始终包含 `fontFamily: 1`（Virgil/手绘字体）

**带标签的箭头** -- 使用相同的容器绑定方法：
```json
{ "type": "arrow", "id": "a1", "x": 300, "y": 150, "width": 200, "height": 0,
  "points": [[0,0],[200,0]], "endArrowhead": "arrow",
  "boundElements": [{ "id": "t_a1", "type": "text" }] },
{ "type": "text", "id": "t_a1", "x": 370, "y": 130, "width": 60, "height": 20,
  "text": "connects", "fontSize": 16, "fontFamily": 1, "strokeColor": "#1e1e1e",
  "textAlign": "center", "verticalAlign": "middle",
  "containerId": "a1", "originalText": "connects", "autoResize": true }
```

**独立文本**（仅用于标题和注释——无容器）：
```json
{ "type": "text", "id": "t1", "x": 150, "y": 138, "text": "Hello", "fontSize": 20,
  "fontFamily": 1, "strokeColor": "#1e1e1e", "originalText": "Hello", "autoResize": true }
```
- `x` 是左边缘。要在位置 `cx` 居中：`x = cx - (text.length * fontSize * 0.5) / 2`
- 请勿依赖 `textAlign` 或 `width` 进行定位

**箭头**:
```json
{ "type": "arrow", "id": "a1", "x": 300, "y": 150, "width": 200, "height": 0,
  "points": [[0,0],[200,0]], "endArrowhead": "arrow" }
```
- `points`: `[dx, dy]` 是相对于元素 `x`, `y` 的偏移量
- `endArrowhead`: `null` | `"arrow"` | `"bar"` | `"dot"` | `"triangle"`
- `strokeStyle`: `"solid"`（默认）| `"dashed"` | `"dotted"`

### 箭头绑定（将箭头连接到形状）

```json
{
  "type": "arrow", "id": "a1", "x": 300, "y": 150, "width": 150, "height": 0,
  "points": [[0,0],[150,0]], "endArrowhead": "arrow",
  "startBinding": { "elementId": "r1", "fixedPoint": [1, 0.5] },
  "endBinding": { "elementId": "r2", "fixedPoint": [0, 0.5] }
}
```

`fixedPoint` 坐标：`top=[0.5,0]`, `bottom=[0.5,1]`, `left=[0,0.5]`, `right=[1,0.5]`

### 绘制顺序（Z 序）
- 数组顺序 = Z 序（第一个 = 最后，最后一个 = 最前）
- 逐步绘制：背景区域 → 形状 → 其绑定的文本 → 其箭头 → 下一个形状
- **不好**：先所有矩形，然后所有文本，然后所有箭头
- **好**：背景区域 → 形状1 → 形状1的文本 → 箭头1 → 箭头1的标签文本 → 形状2 → 形状2的文本 → ...
- 始终将绑定的文本元素紧放在其容器形状之后

### 尺寸指南

**字体大小：**
- 正文、标签、描述的最小 `fontSize`：**16**
- 标题和副标题的最小 `fontSize`：**20**
- 仅用于次要注释的最小 `fontSize`：**14**（谨慎使用）
- **切勿**使用低于 14 的 `fontSize`

**元素尺寸：**
- 带标签的矩形/椭圆的最小形状尺寸：120x60
- 元素之间至少保留 20-30 像素的间距
- 优先选择更少、更大的元素，而不是许多微小的元素

### 调色板

完整的颜色表请参见 `references/colors.md`。快速参考：

| 用途 | 填充颜色 | 十六进制 |
|-----|-----------|-----|
| 主要/输入 | 浅蓝色 | `#a5d8ff` |
| 成功/输出 | 浅绿色 | `#b2f2bb` |
| 警告/外部 | 浅橙色 | `#ffd8a8` |
| 处理/特殊 | 浅紫色 | `#d0bfff` |
| 错误/关键 | 浅红色 | `#ffc9c9` |
| 注释/决策 | 浅黄色 | `#fff3bf` |
| 存储/数据 | 浅青色 | `#c3fae8` |

### 提示
- 在整个图表中一致地使用调色板
- **文本对比度至关重要**——切勿在白色背景上使用浅灰色。白色背景上文本的最小颜色：`#757575`
- 请勿在文本中使用表情符号——它们无法在 Excalidraw 的字体中渲染
- 有关暗黑模式图表，请参见 `references/dark-mode.md`
- 有关更大示例，请参见 `references/examples.md`