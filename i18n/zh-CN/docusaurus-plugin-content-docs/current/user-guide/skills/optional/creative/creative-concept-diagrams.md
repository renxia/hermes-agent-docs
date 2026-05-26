---
title: "概念图表"
sidebar_label: "概念图表"
description: "生成扁平化、极简的、支持浅色/深色模式的SVG图表，作为独立HTML文件，使用统一的教育视觉语言，包含9个语义色阶、句式大小写排版以及自动深色模式。"
---

{/* 此页面由website/scripts/generate-skill-docs.py脚本根据技能的SKILL.md文件自动生成。请编辑源文件SKILL.md，而非此页面。*/}

# 概念图表

生成扁平化、极简的、支持浅色/深色模式的SVG图表，作为独立HTML文件，使用统一的教育视觉语言，包含9个语义色阶、句式大小写排版以及自动深色模式。最适合教育和非软件视觉展示——物理装置、化学机制、数学曲线、实物物体（飞机、涡轮机、智能手机、机械手表）、解剖结构、平面图、横截面、叙事性旅程（X的生命周期、Y的过程）、中心辐射式系统集成（智慧城市、物联网）以及爆炸图层视图。如果存在针对特定主题的更专业技能（专用软件/云架构、手绘草图、动画讲解器等），则优先使用该技能——否则，此技能也可作为通用SVG图表的备选方案，提供简洁的教育外观。附带15个示例图表。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/creative/concept-diagrams` 安装 |
| 路径 | `optional-skills/creative/concept-diagrams` |
| 版本 | `0.1.0` |
| 作者 | v1k22 (原始PR), 移植到 hermes-agent |
| 许可 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `diagrams`, `svg`, `visualization`, `education`, `physics`, `chemistry`, `engineering` |
| 相关技能 | [`architecture-diagram`](/user-guide/skills/bundled/creative/creative-architecture-diagram), [`excalidraw`](/user-guide/skills/bundled/creative/creative-excalidraw), `generative-widgets` |

:::info
以下是此技能触发时，Hermes 加载的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# 概念图

生成具有统一扁平化、极简设计系统的生产级 SVG 图表。输出为单个自包含的 HTML 文件，可在任何现代浏览器中一致渲染，并支持自动亮/暗模式。

## 适用范围

**最适合：**
- 物理装置、化学机制、数学曲线、生物
- 物理对象（飞机、涡轮机、智能手机、机械表、细胞）
- 解剖学、横截面、爆炸层视图
- 平面图、建筑转换
- 叙事旅程（X 的生命周期、Y 的过程）
- 辐条式系统集成（智慧城市、物联网网络、电网）
- 任何领域的教育/教科书风格视觉图
- 定量图表（分组柱状图、能量分布图）

**请先考虑其他方案：**
- 具有深色科技美学的专业软件/云基础设施架构（如可用，请考虑 `architecture-diagram`）
- 手绘白板草图（如可用，请考虑 `excalidraw`）
- 动画讲解或视频输出（请考虑动画技能）

如果针对主题有更专业的技能可用，请优先使用。如果没有合适的，此技能可作为通用 SVG 图表的后备方案——其输出将具有下述的简洁教育美学，这几乎是任何主题的合理默认选择。

## 工作流程

1. 确定图表类型（见下方图表类型）。
2. 使用设计系统规则布局组件。
3. 使用 `templates/template.html` 作为包装器编写完整的 HTML 页面——将你的 SVG 粘贴到模板中注明 `<!-- PASTE SVG HERE -->` 的位置。
4. 保存为独立的 `.html` 文件（例如 `~/my-diagram.html` 或 `./my-diagram.html`）。
5. 用户直接在浏览器中打开——无需服务器，无依赖项。

可选：如果用户想要一个可浏览的多图表画廊，请参见底部的"本地预览服务器"。

加载 HTML 模板：
```
skill_view(name="concept-diagrams", file_path="templates/template.html")
```

该模板内嵌了完整的 CSS 设计系统（`c-*` 颜色类、文本类、亮/暗模式变量、箭头标记样式）。你生成的 SVG 依赖于宿主页面上存在的这些类。

---

## 设计系统

### 理念

- **扁平**：无渐变、阴影、模糊、发光或霓虹效果。
- **极简**：只展示本质。框内无装饰性图标。
- **一致**：在所有图表中使用相同的颜色、间距、排版和描边宽度。
- **深色模式就绪**：所有颜色通过 CSS 类自动适应——无需为每种模式单独制作 SVG。

### 调色板

9 种色阶，每种 7 个色级。将类名放在 `<g>` 或形状元素上；模板 CSS 会处理两种模式。

| 类         | 50 (最亮) | 100     | 200     | 400     | 600     | 800     | 900 (最暗) |
|------------|-----------|---------|---------|---------|---------|---------|------------|
| `c-purple` | #EEEDFE   | #CECBF6 | #AFA9EC | #7F77DD | #534AB7 | #3C3489 | #26215C    |
| `c-teal`   | #E1F5EE   | #9FE1CB | #5DCAA5 | #1D9E75 | #0F6E56 | #085041 | #04342C    |
| `c-coral`  | #FAECE7   | #F5C4B3 | #F0997B | #D85A30 | #993C1D | #712B13 | #4A1B0C    |
| `c-pink`   | #FBEAF0   | #F4C0D1 | #ED93B1 | #D4537E | #993556 | #72243E | #4B1528    |
| `c-gray`   | #F1EFE8   | #D3D1C7 | #B4B2A9 | #888780 | #5F5E5A | #444441 | #2C2C2A    |
| `c-blue`   | #E6F1FB   | #B5D4F4 | #85B7EB | #378ADD | #185FA5 | #0C447C | #042C53    |
| `c-green`  | #EAF3DE   | #C0DD97 | #97C459 | #639922 | #3B6D11 | #27500A | #173404    |
| `c-amber`  | #FAEEDA   | #FAC775 | #EF9F27 | #BA7517 | #854F0B | #633806 | #412402    |
| `c-red`    | #FCEBEB   | #F7C1C1 | #F09595 | #E24B4A | #A32D2D | #791F1F | #501313    |

#### 颜色分配规则

颜色编码**含义**，而非顺序。切勿像彩虹一样循环使用颜色。

- 按**类别**分组节点——相同类型的所有节点共享一种颜色。
- 对中性/结构性节点（开始、结束、通用步骤、用户）使用 `c-gray`。
- 每个图表使用 **2-3 种颜色**，而非 6 种以上。
- 一般类别优先使用 `c-purple`、`c-teal`、`c-coral`、`c-pink`。
- 保留 `c-blue`、`c-green`、`c-amber`、`c-red` 用于语义含义（信息、成功、警告、错误）。

亮/暗色级映射（由模板 CSS 处理——只需使用类名）：
- 亮色模式：50 填充 + 600 描边 + 800 标题 / 600 副标题
- 暗色模式：800 填充 + 200 描边 + 100 标题 / 200 副标题

### 排版

仅两种字号。无例外。

| 类  | 大小 | 字重 | 用途             |
|-----|------|------|------------------|
| `th` | 14px | 500  | 节点标题、区域标签 |
| `ts` | 12px | 400  | 副标题、描述、箭头标签 |
| `t`  | 14px | 400  | 通用文本         |

- **始终使用句首大写。** 切勿使用标题大小写或全大写。
- 每个 `<text>` 元素必须带有类（`t`、`ts` 或 `th`）。不得有无类文本。
- 框内所有文本使用 `dominant-baseline="central"`。
- 框内居中文本使用 `text-anchor="middle"`。

**宽度估算（近似）：**
- 14px 字重 500：每字符约 8px
- 12px 字重 400：每字符约 6.5px
- 始终验证：`box_width >= (char_count × px_per_char) + 48`（两侧各 24px 内边距）

### 间距与布局

- **视图框**：`viewBox="0 0 680 H"`，其中 H = 内容高度 + 40px 缓冲。
- **安全区域**：x=40 至 x=640，y=40 至 y=(H-40)。
- **框之间**：最小间距 60px。
- **框内部**：水平内边距 24px，垂直内边距 12px。
- **箭头间距**：箭头头部与框边缘间距 10px。
- **单行框**：高度 44px。
- **双行框**：高度 56px，标题与副标题基线间距 18px。
- **容器内边距**：每个容器内部至少 20px。
- **最大嵌套深度**：2-3 层。在 680px 宽度下，更深则难以阅读。

### 描边与形状

- **描边宽度**：所有节点边框为 0.5px。非 1px，非 2px。
- **矩形圆角**：节点 `rx="8"`，内部容器 `rx="12"`，外部容器 `rx="16"` 至 `rx="20"`。
- **连接线路径**：必须设置 `fill="none"`。否则 SVG 默认为 `fill: black`。

### 箭头标记

在每个 SVG 的开头包含以下 `<defs>` 块：

```xml
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </marker>
</defs>
```

在直线上使用 `marker-end="url(#arrow)"`。箭头头部通过 `context-stroke` 继承线条颜色。

### CSS 类（由模板提供）

模板页面提供：

- 文本：`.t`、`.ts`、`.th`
- 中性：`.box`、`.arr`、`.leader`、`.node`
- 色阶：`.c-purple`、`.c-teal`、`.c-coral`、`.c-pink`、`.c-gray`、`.c-blue`、`.c-green`、`.c-amber`、`.c-red`（均自动适配亮/暗模式）

你**无需**重新定义这些——只需在 SVG 中应用它们即可。模板文件包含完整的 CSS 定义。

---

## SVG 模板

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

将 `{HEIGHT}` 替换为实际计算的高度（最后元素底部 + 40px）。

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

**连接线（无标签）：**
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

1.  **流程图** — CI/CD 管道、请求生命周期、审批流程、数据处理。单向流动（自上而下或从左到右）。每行最多 4-5 个节点。
2.  **结构/包含图** — 云基础设施嵌套、带分层的系统架构。大型外层容器与内部区域。虚线矩形表示逻辑分组。
3.  **API/端点图** — REST 路由、GraphQL 模式。从根节点树状展开，分支到资源组，每个组包含端点节点。
4.  **微服务拓扑图** — 服务网格、事件驱动系统。服务作为节点，箭头表示通信模式，消息队列在其中。
5.  **数据流图** — ETL 管道、流式架构。从左到右，从数据源流经处理到数据汇。
6.  **物理/结构图** — 车辆、建筑物、硬件、解剖结构。使用与物理形态匹配的形状 — `<path>` 用于曲面体，`<polygon>` 用于锥形，`<ellipse>`/`<circle>` 用于圆柱部件，嵌套 `<rect>` 用于隔间。参见 `references/physical-shape-cookbook.md`。
7.  **基础设施/系统集成图** — 智慧城市、物联网网络、多领域系统。中心辐射布局，中心平台连接子系统。语义化线条样式 (`.data-line`, `.power-line`, `.water-pipe`, `.road`)。参见 `references/infrastructure-patterns.md`。
8.  **UI/仪表板示意图** — 管理面板、监控仪表板。屏幕框架内嵌套图表/仪表/指示器元素。参见 `references/dashboard-patterns.md`。

对于物理、基础设施和仪表板图表，生成前请加载匹配的参考文件 — 每个文件都提供了现成的 CSS 类和形状基本元素。

---

## 验证检查清单

在最终确定任何 SVG 之前，请验证以下所有项：

1.  每个 `<text>` 都有类 `t`、`ts` 或 `th`。
2.  框内的每个 `<text>` 都有 `dominant-baseline="central"`。
3.  用作箭头的每个连接器 `<path>` 或 `<line>` 都有 `fill="none"`。
4.  没有箭头线穿过不相关的框。
5.  对于 14px 文本，`box_width >= (最长标签字符数 × 8) + 48`。
6.  对于 12px 文本，`box_width >= (最长标签字符数 × 6.5) + 48`。
7.  视图框高度 = 最下方元素 + 40px。
8.  所有内容保持在 x=40 到 x=640 之间。
9.  颜色类 (`c-*`) 在 `<g>` 或形状元素上，绝不在 `<path>` 连接器上。
10. 箭头 `<defs>` 块存在。
11. 无渐变、阴影、模糊或发光效果。
12. 所有节点边框的描边宽度为 0.5px。

---

## 输出与预览

### 默认：独立 HTML 文件

编写一个用户可以直接打开的 `.html` 文件。无需服务器，无依赖项，可离线工作。模式：

```python
# 1. 加载模板
template = skill_view("concept-diagrams", "templates/template.html")

# 2. 填写标题、副标题并粘贴您的 SVG
html = template.replace(
    "<!-- DIAGRAM TITLE HERE -->", "SN2 反应机理"
).replace(
    "<!-- OPTIONAL SUBTITLE HERE -->", "双分子亲核取代"
).replace(
    "<!-- PASTE SVG HERE -->", svg_content
)

# 3. 写入用户选择的路径（默认为当前目录）
write_file("./sn2-mechanism.html", html)
```

告知用户如何打开它：

```
# macOS
open ./sn2-mechanism.html
# Linux
xdg-open ./sn2-mechanism.html
```

### 可选：本地预览服务器（多图表画廊）

仅当用户明确希望浏览多个图表的画廊时使用。

**规则：**
*   仅绑定 `127.0.0.1`。绝不使用 `0.0.0.0`。在共享网络上将图表暴露在所有网络接口上存在安全风险。
*   选择一个空闲端口（不要硬编码）并告知用户所选 URL。
*   服务器是可选且需用户同意的 — 优先提供独立 HTML 文件。

推荐模式（让操作系统选择空闲临时端口）：

```bash
# 将每个图表放在 .diagrams/ 下的各自文件夹中
mkdir -p .diagrams/sn2-mechanism
# ...写入 .diagrams/sn2-mechanism/index.html...

# 仅在回环地址上服务，使用空闲端口
cd .diagrams && python3 -c "
import http.server, socketserver
with socketsocket.TCPServer(('127.0.0.1', 0), http.server.SimpleHTTPRequestHandler) as s:
    print(f'正在服务 http://127.0.0.1:{s.server_address[1]}/')
    s.serve_forever()
" &
```

如果用户坚持使用固定端口，使用 `127.0.0.1:<端口>` — 仍然绝不使用 `0.0.0.0`。说明如何停止服务器（`kill %1` 或 `pkill -f "http.server"`）。

---

## 示例参考

`examples/` 目录包含 15 个完整、经过测试的图表。在编写类似类型的新图表之前，请浏览它们以了解可用模式：

| 文件 | 类型 | 展示内容 |
|------|------|----------|
| `hospital-emergency-department-flow.md` | 流程图 | 带语义颜色的优先级路由 |
| `feature-film-production-pipeline.md` | 流程图 | 分阶段工作流，水平子流 |
| `automated-password-reset-flow.md` | 流程图 | 带错误分支的认证流程 |
| `autonomous-llm-research-agent-flow.md` | 流程图 | 回环箭头、决策分支 |
| `place-order-uml-sequence.md` | 序列图 | UML 序列图风格 |
| `commercial-aircraft-structure.md` | 物理图 | 路径、多边形、椭圆用于逼真形状 |
| `wind-turbine-structure.md` | 物理剖面图 | 地下/地上分离，颜色编码 |
| `smartphone-layer-anatomy.md` | 分解视图 | 左右交替标签，分层组件 |
| `apartment-floor-plan-conversion.md` | 平面图 | 墙壁、门、红色虚线表示提议变更 |
| `banana-journey-tree-to-smoothie.md` | 叙事旅程图 | 蜿蜒路径，渐进状态变化 |
| `cpu-ooo-microarchitecture.md` | 硬件管线图 | 扇出，内存层次结构侧边栏 |
| `sn2-reaction-mechanism.md` | 化学图 | 分子、弯箭头、能量剖面 |
| `smart-city-infrastructure.md` | 中心辐射图 | 每个子系统的语义线条样式 |
| `electricity-grid-flow.md` | 多阶段流图 | 电压等级，流量标记 |
| `ml-benchmark-grouped-bar-chart.md` | 图表 | 分组条形图，双轴 |

使用以下命令加载任何示例：
```
skill_view(name="concept-diagrams", file_path="examples/<文件名>")
```

---

## 快速参考：何时使用什么

| 用户说 | 图表类型 | 建议颜色 |
|--------|----------|----------|
| "展示管道" | 流程图 | 灰色开始/结束，紫色步骤，红色错误，青色部署 |
| "绘制数据流" | 数据管道（从左到右） | 灰色数据源，紫色处理，青色数据汇 |
| "可视化系统" | 结构（包含）图 | 紫色容器，青色服务，珊瑚色数据 |
| "映射端点" | API 树图 | 紫色根节点，每个资源组一个斜坡 |
| "展示服务" | 微服务拓扑图 | 灰色入口，青色服务，紫色总线，珊瑚色工作者 |
| "绘制飞机/车辆" | 物理图 | 路径、多边形、椭圆用于逼真形状 |
| "智慧城市/物联网" | 中心辐射集成图 | 每个子系统的语义线条样式 |
| "展示仪表板" | UI 示意图 | 深色屏幕，图表颜色：青色、紫色、珊瑚色用于警报 |
| "电网/电力" | 多阶段流图 | 电压等级（HV/MV/LV 线条粗细） |
| "风力涡轮机/涡轮机" | 物理剖面图 | 基础 + 塔架剖面 + 机舱颜色编码 |
| "X的旅程/生命周期" | 叙事旅程图 | 蜿蜒路径，渐进状态变化 |
| "X的层次/分解" | 分解层次视图 | 垂直堆叠，交替标签 |
| "CPU/管线" | 硬件管线图 | 垂直阶段，扇出到执行端口 |
| "平面图/公寓" | 平面图 | 墙壁、门、红色虚线表示提议变更 |
| "反应机理" | 化学图 | 原子、键、弯箭头、过渡态、能量剖面 |