---
title: "概念示意图"
sidebar_label: "概念示意图"
description: "生成扁平、极简、可感知明暗的 SVG 示意图，并作为独立 HTML 文件呈现。使用统一的教育视觉语言，包含 9 个语义色阶、句首大写排版，并支持自动暗黑模式。最适用于教育类和非软件视觉内容——物理实验装置、化学反应机制、数学曲线、实体物品（飞机、涡轮机、智能手机、机械表）、解剖图、平面图、剖面图、叙事流程（X 的生命周期、Y 的过程）、枢纽-辐条式系统集成（智慧城市、物联网）以及爆炸分层视图。如果存在更针对特定主题的专用技能（如专门的软件/云架构图、手绘草图、动画解说等），请优先选用——否则，此技能也可作为通用 SVG 图表工具，提供简洁的教育风格。内含 15 个示例图。"
---

{/* 本页面由网站脚本 generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# 概念示意图

生成扁平、极简、可感知明暗的 SVG 示意图，并作为独立 HTML 文件呈现。使用统一的教育视觉语言，包含 9 个语义色阶、句首大写排版，并支持自动暗黑模式。最适用于教育类和非软件视觉内容——物理实验装置、化学反应机制、数学曲线、实体物品（飞机、涡轮机、智能手机、机械表）、解剖图、平面图、剖面图、叙事流程（X 的生命周期、Y 的过程）、枢纽-辐条式系统集成（智慧城市、物联网）以及爆炸分层视图。如果存在更针对特定主题的专用技能（如专门的软件/云架构图、手绘草图、动画解说等），请优先选用——否则，此技能也可作为通用 SVG 图表工具，提供简洁的教育风格。内含 15 个示例图。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/creative/concept-diagrams` 安装 |
| 路径 | `optional-skills/creative/concept-diagrams` |
| 版本 | `0.1.0` |
| 作者 | v1k22（原始 PR），移植入 hermes-agent |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `diagrams`, `svg`, `visualization`, `education`, `physics`, `chemistry`, `engineering` |
| 相关技能 | [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw), `generative-widgets` |

:::info
以下是 Hermes 触发此技能时加载的完整技能定义。这是该技能激活时智能体看到的指令。
:::

# 概念图表

生成具有统一扁平、极简设计系统的生产质量 SVG 图表。输出是一个独立的 HTML 文件，可在任何现代浏览器中一致呈现，并自动适配明暗模式。

## 适用范围

**最适合：**
- 物理场景、化学机制、数学曲线、生物学
- 物理对象（飞机、涡轮机、智能手机、机械手表、细胞）
- 解剖学、横截面、分解层视图
- 平面图、建筑转换
- 叙述性流程（X 的生命周期、Y 的过程）
- 辐射状系统集成（智慧城市、物联网网络、电网）
- 任何领域的教育/教科书风格视觉呈现
- 定量图表（分组柱状图、能量分布图）

**若可能，请优先考虑：**
- 具有深色科技美学的专用软件/云基础设施架构（如果可用，考虑 `architecture-diagram`）
- 手绘白板草图（如果可用，考虑 `excalidraw`）
- 动画解释器或视频输出（考虑动画技能）

如果有更专业的技能适用于该主题，请优先使用。如果没有合适的，此技能可作为通用 SVG 图表的后备方案——输出将呈现如下所述的清晰教育美学，这几乎是任何主题的合理默认选择。

## 工作流程

1.  确定图表类型（见下方图表类型）。
2.  使用设计系统规则布局组件。
3.  使用 `templates/template.html` 作为外壳编写完整的 HTML 页面——将 SVG 粘贴到模板指定的位置 `<!-- PASTE SVG HERE -->`。
4.  保存为独立的 `.html` 文件（例如 `~/my-diagram.html` 或 `./my-diagram.html`）。
5.  用户直接在浏览器中打开——无需服务器，无需依赖项。

可选：如果用户想要可浏览的多图表库，请参见底部的“本地预览服务器”。

加载 HTML 模板：
```
skill_view(name="concept-diagrams", file_path="templates/template.html")
```

模板内嵌了完整的 CSS 设计系统（`c-*` 颜色类、文本类、明暗模式变量、箭头标记样式）。你生成的 SVG 依赖于这些类存在于宿主页面上。

---

## 设计系统

### 设计理念

- **扁平**：无渐变、无阴影、模糊、发光或霓虹效果。
- **极简**：展现本质。框内无装饰性图标。
- **一致**：跨图表使用相同的颜色、间距、排版和描边宽度。
- **暗色模式就绪**：所有颜色通过 CSS 类自动适配——无需为不同模式准备单独的 SVG。

### 颜色色板

9 种颜色渐变，每种有 7 个色阶。将类名放在 `<g>` 或形状元素上；模板 CSS 会处理明暗两种模式。

| 类名       | 50 (最浅) | 100     | 200     | 400     | 600     | 800     | 900 (最深) |
|------------|-----------|---------|---------|---------|---------|---------|------------|
| `c-purple` | #EEEDFE | #CECBF6 | #AFA9EC | #7F77DD | #534AB7 | #3C3489 | #26215C |
| `c-teal`   | #E1F5EE | #9FE1CB | #5DCAA5 | #1D9E75 | #0F6E56 | #085041 | #04342C |
| `c-coral`  | #FAECE7 | #F5C4B3 | #F0997B | #D85A30 | #993C1D | #712B13 | #4A1B0C |
| `c-pink`   | #FBEAF0 | #F4C0D1 | #ED93B1 | #D4537E | #993556 | #72243E | #4B1528 |
| `c-gray`   | #F1EFE8 | #D3D1C7 | #B4B2A9 | #888780 | #5F5E5A | #444441 | #2C2C2A |
| `c-blue`   | #E6F1FB | #B5D4F4 | #85B7EB | #378ADD | #185FA5 | #0C447C | #042C53 |
| `c-green`  | #EAF3DE | #C0DD97 | #97C459 | #639922 | #3B6D11 | #27500A | #173404 |
| `c-amber`  | #FAEEDA | #FAC775 | #EF9F27 | #BA7517 | #854F0B | #633806 | #412402 |
| `c-red`    | #FCEBEB | #F7C1C1 | #F09595 | #E24B4A | #A32D2D | #791F1F | #501313 |

#### 颜色分配规则

颜色编码**含义**，而非顺序。切勿像彩虹一样循环使用颜色。

- 按**类别**对节点分组——相同类型的所有节点共享一种颜色。
- 使用 `c-gray` 表示中性/结构节点（开始、结束、通用步骤、用户）。
- 每个图表使用 **2-3 种颜色**，而非 6 种以上。
- 通用类别优先选择 `c-purple`, `c-teal`, `c-coral`, `c-pink`。
- 为语义含义保留 `c-blue`, `c-green`, `c-amber`, `c-red`（信息、成功、警告、错误）。

明暗模式色阶映射（由模板 CSS 处理——只需使用类名）：
- 明亮模式：50 填充 + 600 描边 + 800 标题 / 600 副标题
- 暗黑模式：800 填充 + 200 描边 + 100 标题 / 200 副标题

### 排版

只有两种字号。无一例外。

| 类名 | 大小 | 字重 | 用途 |
|------|------|------|------|
| `th` | 14px | 500 | 节点标题、区域标签 |
| `ts` | 12px | 400 | 副标题、描述、箭头标签 |
| `t`  | 14px | 400 | 通用文本 |

- **始终使用句首大写。** 永不使用标题大写，永不使用全大写。
- 每个 `<text>` 必须携带类名（`t`, `ts` 或 `th`）。无类文本不允许。
- 框内所有文本设置 `dominant-baseline="central"`。
- 框内居中文本设置 `text-anchor="middle"`。

**宽度估算（近似）：**
- 14px 字重 500：每字符约 8px
- 12px 字重 400：每字符约 6.5px
- 始终验证：`box_width >= (字符数 × 每字符px) + 48`（每边 24px 内边距）

### 间距与布局

- **视图框**：`viewBox="0 0 680 H"`，其中 H = 内容高度 + 40px 缓冲区。
- **安全区域**：x=40 到 x=640，y=40 到 y=(H-40)。
- **框之间**：最小间距 60px。
- **框内部**：水平内边距 24px，垂直内边距 12px。
- **箭头间隙**：箭头与框边缘之间 10px。
- **单行框**：高度 44px。
- **双行框**：高度 56px，标题与副标题基线之间 18px。
- **容器内边距**：每个容器内部最小 20px 内边距。
- **最大嵌套深度**：2-3 层。在 680px 宽度下更深嵌套将难以阅读。

### 描边与形状

- **描边宽度**：所有节点边框 0.5px。不是 1px，不是 2px。
- **矩形圆角**：节点 `rx="8"`，内部容器 `rx="12"`，外部容器 `rx="16"` 到 `rx="20"`。
- **连接器路径**：必须设置 `fill="none"`。否则 SVG 默认 `fill: black`。

### 箭头标记

在**每个** SVG 开头包含此 `<defs>` 块：

```xml
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </marker>
</defs>
```

在线段上使用 `marker-end="url(#arrow)"`。箭头会通过 `context-stroke` 继承线的颜色。

### CSS 类（由模板提供）

模板页面提供：

- 文本：`.t`, `.ts`, `.th`
- 中性：`.box`, `.arr`, `.leader`, `.node`
- 颜色渐变：`.c-purple`, `.c-teal`, `.c-coral`, `.c-pink`, `.c-gray`, `.c-blue`, `.c-green`, `.c-amber`, `.c-red`（全部自动适配明暗模式）

你**不需要**重新定义这些——只需在你的 SVG 中应用它们即可。模板文件包含完整的 CSS 定义。

---

## SVG 样板代码

模板页面内的每个 SVG 都以此确切结构开始：

```xml
<svg width="100%" viewBox="0 0 680 {HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <!-- 图表内容在此 -->

</svg>
```

将 `{HEIGHT}` 替换为实际计算的高度（最后一个元素底部 + 40px）。

### 节点模式

**单行节点（44px）：**
```xml
<g class="node c-blue">
  <rect x="100" y="20" width="180" height="44" rx="8" stroke-width="0.5"/>
  <text class="th" x="190" y="42" text-anchor="middle" dominant-baseline="central">服务名称</text>
</g>
```

**双行节点（56px）：**
```xml
<g class="node c-teal">
  <rect x="100" y="20" width="200" height="56" rx="8" stroke-width="0.5"/>
  <text class="th" x="200" y="38" text-anchor="middle" dominant-baseline="central">服务名称</text>
  <text class="ts" x="200" y="56" text-anchor="middle" dominant-baseline="central">简短描述</text>
</g>
```

**连接器（无标签）：**
```xml
<line x1="200" y1="76" x2="200" y2="120" class="arr" marker-end="url(#arrow)"/>
```

**容器（虚线或实线）：**
```xml
<g class="c-purple">
  <rect x="40" y="92" width="600" height="300" rx="16" stroke-width="0.5"/>
  <text class="th" x="66" y="116">容器标签</text>
  <text class="ts" x="66" y="134">副标题信息</text>
</g>
```

---

## 图表类型

选择适合主题的布局：

1.  **流程图** — CI/CD 管道、请求生命周期、审批工作流、数据处理。单向流动（从上到下或从左到右）。每行最多 4-5 个节点。
2.  **结构/包含** — 云基础设施嵌套、带层级的系统架构。大的外层容器包含内部区域。用虚线矩形表示逻辑分组。
3.  **API/端点映射** — REST 路由、GraphQL 模式。从根节点开始的树形结构，分支到资源组，每个包含端点节点。
4.  **微服务拓扑** — 服务网格、事件驱动系统。服务作为节点，箭头表示通信模式，消息队列位于其间。
5.  **数据流** — ETL 管道、流式处理架构。从左到右的流动，从数据源经过处理到数据汇聚点。
6.  **物理/结构** — 车辆、建筑、硬件、解剖学。使用匹配物理形态的形状 — `<path>` 用于弯曲体，`<polygon>` 用于锥形，`<ellipse>`/`<circle>` 用于圆柱部件，嵌套 `<rect>` 用于舱室。参见 `references/physical-shape-cookbook.md`。
7.  **基础设施/系统集成** — 智慧城市、物联网网络、多域系统。中心-分支布局，中央平台连接子系统。语义化线型（`.data-line`, `.power-line`, `.water-pipe`, `.road`）。参见 `references/infrastructure-patterns.md`。
8.  **用户界面/仪表盘原型** — 管理面板、监控仪表盘。屏幕框架内嵌套图表/仪表/指示器元素。参见 `references/dashboard-patterns.md`。

对于物理、基础设施和仪表盘图表，在生成前加载匹配的参考文件 — 每一个都提供了现成的 CSS 类和形状基元。

---

## 验证清单

在最终确定任何 SVG 之前，请验证以下所有项：

1.  每个 `<text>` 都具有类 `t`、`ts` 或 `th`。
2.  框内的每个 `<text>` 都具有 `dominant-baseline="central"`。
3.  用作箭头的每个连接器 `<path>` 或 `<line>` 都具有 `fill="none"`。
4.  没有箭头线穿过不相关的方框。
5.  `box_width >= (最长标签字符数 × 8) + 48` （用于 14px 文本）。
6.  `box_width >= (最长标签字符数 × 6.5) + 48` （用于 12px 文本）。
7.  视图框高度 = 最底部元素 + 40px。
8.  所有内容都在 x=40 到 x=640 的范围内。
9.  颜色类 (`c-*`) 位于 `<g>` 或形状元素上，而不是 `<path>` 连接器上。
10. 存在箭头 `<defs>` 块。
11. 无渐变、阴影、模糊或发光效果。
12. 所有节点边框的描边宽度为 0.5px。

---

## 输出与预览

### 默认：独立 HTML 文件

编写一个用户可以直接打开的单个 `.html` 文件。无需服务器，无依赖项，可离线工作。模式：

```python
# 1. 加载模板
template = skill_view("concept-diagrams", "templates/template.html")

# 2. 填入标题、副标题并粘贴你的 SVG
html = template.replace(
    "<!-- DIAGRAM TITLE HERE -->", "SN2 反应机理"
).replace(
    "<!-- OPTIONAL SUBTITLE HERE -->", "双分子亲核取代"
).replace(
    "<!-- PASTE SVG HERE -->", svg_content
)

# 3. 写入用户选择的路径（或默认为当前目录 ./）
write_file("./sn2-mechanism.html", html)
```

告知用户如何打开它：

```
# macOS
open ./sn2-mechanism.html
# Linux
xdg-open ./sn2-mechanism.html
```

### 可选：本地预览服务器（多图表库）

仅当用户明确需要多图表的可浏览库时才使用此选项。

**规则：**
*   仅绑定到 `127.0.0.1`。绝不使用 `0.0.0.0`。在共享网络上将图表暴露于所有网络接口存在安全风险。
*   选择一个可用端口（不要硬编码）并告知用户所选 URL。
*   服务器是可选且可选加入的 — 首选独立 HTML 文件。

推荐模式（让操作系统选择一个临时空闲端口）：

```bash
# 将每个图表放在 .diagrams/ 下自己的文件夹中
mkdir -p .diagrams/sn2-mechanism
# ...将 .diagrams/sn2-mechanism/index.html 写入其中...

# 仅在回环地址上服务，使用空闲端口
cd .diagrams && python3 -c "
import http.server, socketserver
with socketserver.TCPServer(('127.0.0.1', 0), http.server.SimpleHTTPRequestHandler) as s:
    print(f'Serving at http://127.0.0.1:{s.server_address[1]}/')
    s.serve_forever()
" &
```

如果用户坚持使用固定端口，请使用 `127.0.0.1:<端口>` — 仍然不要使用 `0.0.0.0`。记录如何停止服务器（`kill %1` 或 `pkill -f "http.server"`）。

---

## 示例参考

`examples/` 目录包含 15 个完整、经过测试的图表。在编写类似类型的新图表之前，请浏览它们以获取可用模式：

| 文件 | 类型 | 演示 |
|------|------|------|
| `hospital-emergency-department-flow.md` | 流程图 | 带语义颜色的优先级路由 |
| `feature-film-production-pipeline.md` | 流程图 | 阶段性工作流，水平子流 |
| `automated-password-reset-flow.md` | 流程图 | 带错误分支的认证流 |
| `autonomous-llm-research-agent-flow.md` | 流程图 | 回环箭头，决策分支 |
| `place-order-uml-sequence.md` | 序列图 | UML 序列图风格 |
| `commercial-aircraft-structure.md` | 物理结构 | 用路径、多边形、椭圆实现逼真形状 |
| `wind-turbine-structure.md` | 物理剖面 | 地下/地上分离，颜色编码 |
| `smartphone-layer-anatomy.md` | 分解视图 | 交替的左右标签，分层组件 |
| `apartment-floor-plan-conversion.md` | 平面图 | 墙壁、门、用虚线红标示提议更改 |
| `banana-journey-tree-to-smoothie.md` | 叙事旅程 | 蜿蜒路径，渐进状态变化 |
| `cpu-ooo-microarchitecture.md` | 硬件管道 | 扇出，内存层次结构侧边栏 |
| `sn2-reaction-mechanism.md` | 化学 | 分子，曲线箭头，能级图 |
| `smart-city-infrastructure.md` | 中心-分支 | 按系统区分的语义线型 |
| `electricity-grid-flow.md` | 多阶段流 | 电压层次结构，流标记 |
| `ml-benchmark-grouped-bar-chart.md` | 图表 | 分组柱状图，双轴 |

使用以下命令加载任何示例：
```
skill_view(name="concept-diagrams", file_path="examples/<文件名>")
```

---

## 快速参考：何时使用什么

| 用户说 | 图表类型 | 建议颜色 |
|--------|----------|----------|
| “展示管道” | 流程图 | 灰色开始/结束，紫色步骤，红色错误，青绿色部署 |
| “画出数据流” | 数据管道（从左到右） | 灰色数据源，紫色处理，青绿色数据汇聚点 |
| “可视化系统” | 结构（包含） | 紫色容器，青绿色服务，珊瑚色数据 |
| “映射端点” | API 树 | 紫色根节点，每个资源组一个分支 |
| “展示服务” | 微服务拓扑 | 灰色入口，青绿色服务，紫色总线，珊瑚色工作者 |
| “画出飞机/车辆” | 物理结构 | 路径、多边形、椭圆实现逼真形状 |
| “智慧城市/物联网” | 中心-分支集成 | 按子系统区分的语义线型 |
| “展示仪表盘” | 用户界面原型 | 深色屏幕，图表颜色：青绿、紫、珊瑚用于警报 |
| “电网/电力” | 多阶段流 | 电压层次结构（高压/中压/低压线型粗细） |
| “风力涡轮机/涡轮机” | 物理剖面 | 基础+塔架剖切+机舱颜色编码 |
| “X的旅程/生命周期” | 叙事旅程 | 蜿蜒路径，渐进状态变化 |
| “X的层次/分解” | 分解层视图 | 垂直堆叠，交替标签 |
| “CPU/管道” | 硬件管道 | 垂直阶段，扇出到执行端口 |
| “平面图/公寓” | 平面图 | 墙壁、门、用虚线红标示提议更改 |
| “反应机理” | 化学 | 原子、键、曲线箭头、过渡态、能级图 |