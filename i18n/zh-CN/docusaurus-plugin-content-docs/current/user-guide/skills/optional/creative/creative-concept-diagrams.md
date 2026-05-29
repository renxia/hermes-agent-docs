---
title: "概念图表"
sidebar_label: "概念图表"
description: "使用统一的视觉语言生成扁平化、简约、亮色/暗色感知的SVG图表，该语言包含9个语义色彩渐变、标题大小写排版并支持自动暗色模式。最适合教育和非软件类视觉图表——物理装置、化学机制、数学曲线、实物（飞机、涡轮机、智能手机、机械手表）、解剖学、平面图、剖面图、叙事旅程（X的生命周期、Y的流程）、枢纽-辐条系统集成（智慧城市、物联网）以及分解层视图。如果存在针对该主题更专业的技能（专用的软件/云架构、手绘草图、动画讲解器等），请优先选用——否则此技能也可作为通用SVG图表的后备方案，提供简洁的教育性外观。附带15个示例图表。"
---

{/* 本页由网站脚本 generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源 SKILL.md 文件，而非本页。 */}

# 概念图表

使用统一的视觉语言生成扁平化、简约、亮色/暗色感知的SVG图表，作为独立HTML文件。该语言包含9个语义色彩渐变、标题大小写排版并支持自动暗色模式。最适合教育和非软件类视觉图表——物理装置、化学机制、数学曲线、实物（飞机、涡轮机、智能手机、机械手表）、解剖学、平面图、剖面图、叙事旅程（X的生命周期、Y的流程）、枢纽-辐条系统集成（智慧城市、物联网）以及分解层视图。如果存在针对该主题更专业的技能（专用的软件/云架构、手绘草图、动画讲解器等），请优先选用——否则此技能也可作为通用SVG图表的后备方案，提供简洁的教育性外观。附带15个示例图表。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/creative/concept-diagrams` 安装 |
| 路径 | `optional-skills/creative/concept-diagrams` |
| 版本 | `0.1.0` |
| 作者 | v1k22 (原始PR), 移植至 hermes-agent |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `图表`, `svg`, `可视化`, `教育`, `物理`, `化学`, `工程` |
| 相关技能 | [`architecture-diagram`](/docs/user-guide/skills/bundled/creative/creative-architecture-diagram), [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw), `generative-widgets` |

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在该技能激活时看到的说明。
:::

# 概念图表

生成具有统一扁平、极简设计系统的生产级 SVG 图表。输出为单个自包含的 HTML 文件，可在任何现代浏览器中呈现相同效果，并自动支持明/暗模式。

## 适用范围

**最适用于：**
- 物理装置、化学机制、数学曲线、生物
- 物理对象（飞机、涡轮机、智能手机、机械表、细胞）
- 解剖学、横截面、分层爆炸视图
- 平面图、建筑转换
- 叙述性旅程（X 的生命周期、Y 的流程）
- 辐射式系统集成（智慧城市、物联网网络、电网）
- 任何领域的教育/教科书风格视觉内容
- 定量图表（分组柱状图、能量分布图）

**若以下情况，请优先考虑其他方案：**
- 专用的软件/云基础设施架构且偏好暗黑科技美学（如果可用，请考虑 `architecture-diagram`）
- 手绘白板草图（如果可用，请考虑 `excalidraw`）
- 动画解说或视频输出（请考虑动画技能）

如果有针对该主题更专业的技能可用，请优先使用。如果没有合适的技能，此技能可以作为通用 SVG 图表的后备方案——其输出将具有以下描述的清晰教育美学，这对于几乎任何主题都是一个合理的默认选择。

## 工作流程

1.  确定图表类型（参见下方图表类型）。
2.  使用设计系统规则布局组件。
3.  使用 `templates/template.html` 作为外壳编写完整的 HTML 页面——将您的 SVG 粘贴到模板中 `<!-- PASTE SVG HERE -->` 指示的位置。
4.  保存为独立的 `.html` 文件（例如 `~/my-diagram.html` 或 `./my-diagram.html`）。
5.  用户直接在浏览器中打开它——无需服务器，无依赖项。

可选：如果用户需要多个图表的可浏览库，请参见底部的“本地预览服务器”。

加载 HTML 模板：
```
skill_view(name="concept-diagrams", file_path="templates/template.html")
```

该模板内嵌了完整的 CSS 设计系统（`c-*` 颜色类、文本类、明/暗模式变量、箭头标记样式）。您生成的 SVG 依赖于这些类在宿主页面上的存在。

---

## 设计系统

### 哲学

-   **扁平**：无渐变、投影、模糊、发光或霓虹效果。
-   **极简**：仅展示核心要素。方框内无装饰性图标。
-   **一致**：每个图表都使用相同的颜色、间距、排版和描边宽度。
-   **暗模式就绪**：所有颜色通过 CSS 类自动适应——无需为每种模式单独制作 SVG。

### 调色板

9 种色阶，每种有 7 个色级。将类名放在 `<g>` 或形状元素上；模板 CSS 会处理两种模式。

| 类名         | 50（最浅） | 100     | 200     | 400     | 600     | 800     | 900（最深） |
|--------------|------------|---------|---------|---------|---------|---------|-------------|
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

-   按**类别**对节点分组——所有相同类型的节点共享同一种颜色。
-   使用 `c-gray` 表示中性/结构节点（开始、结束、通用步骤、用户）。
-   每个图表使用 **2-3 种颜色**，而非 6 种以上。
-   通用类别优先使用 `c-purple`、`c-teal`、`c-coral`、`c-pink`。
-   将 `c-blue`、`c-green`、`c-amber`、`c-red` 保留用于语义含义（信息、成功、警告、错误）。

明/暗模式色级映射（由模板 CSS 处理——只需使用类名）：
-   明亮模式：50 填充 + 600 描边 + 800 标题 / 600 副标题
-   暗黑模式：800 填充 + 200 描边 + 100 标题 / 200 副标题

### 排版

仅两种字号。无例外。

| 类名 | 大小  | 字重  | 用途                     |
|------|-------|-------|--------------------------|
| `th` | 14px  | 500   | 节点标题、区域标签       |
| `ts` | 12px  | 400   | 副标题、描述、箭头标签   |
| `t`  | 14px  | 400   | 通用文本                 |

-   **始终使用句首大写。** 切勿使用标题大小写，切勿全大写。
-   每个 `<text>` **必须**携带一个类（`t`、`ts` 或 `th`）。无类文本是不允许的。
-   方框内所有文本使用 `dominant-baseline="central"`。
-   方框内居中文本使用 `text-anchor="middle"`。

**宽度估算（近似）：**
-   14px 字重 500：约 8px 每字符
-   12px 字重 400：约 6.5px 每字符
-   始终验证：`方框宽度 >= (字符数 × 每字符像素数) + 48`（每侧 24px 内边距）

### 间距与布局

-   **视图框**：`viewBox="0 0 680 H"`，其中 H = 内容高度 + 40px 缓冲区。
-   **安全区域**：x=40 至 x=640，y=40 至 y=(H-40)。
-   **方框间距**：最小间距 60px。
-   **方框内部**：水平内边距 24px，垂直内边距 12px。
-   **箭头间隙**：箭头尖端与方框边缘之间保留 10px。
-   **单行方框**：高度 44px。
-   **两行方框**：高度 56px，标题与副标题基线间距 18px。
-   **容器内边距**：每个容器内部最小内边距 20px。
-   **最大嵌套深度**：2-3 层。在 680px 宽度下，更深的嵌套将难以阅读。

### 描边与形状

-   **描边宽度**：所有节点边框均为 0.5px。不是 1px，不是 2px。
-   **矩形圆角**：节点使用 `rx="8"`，内部容器使用 `rx="12"`，外部容器使用 `rx="16"` 到 `rx="20"`。
-   **连接器路径**：必须设置 `fill="none"`。否则 SVG 默认填充为黑色。

### 箭头标记

在每个 SVG 的开头包含此 `<defs>` 块：

```xml
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </marker>
</defs>
```

在线条上使用 `marker-end="url(#arrow)"`。箭头通过 `context-stroke` 继承线条颜色。

### CSS 类（由模板提供）

模板页面提供：

-   文本类：`.t`、`.ts`、`.th`
-   中性类：`.box`、`.arr`、`.leader`、`.node`
-   色阶类：`.c-purple`、`.c-teal`、`.c-coral`、`.c-pink`、`.c-gray`、`.c-blue`、`.c-green`、`.c-amber`、`.c-red`（均自动支持明/暗模式）

您**无需**重新定义这些——只需在您的 SVG 中应用它们即可。模板文件包含完整的 CSS 定义。

---

## SVG 样板代码

模板页面内的每个 SVG 都以此精确结构开始：

```xml
<svg width="100%" viewBox="0 0 680 {高度}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <!-- 图表内容在此处 -->

</svg>
```

将 `{高度}` 替换为实际计算出的高度（最后一个元素底部 + 40px）。

### 节点模式

**单行节点（44px）：**
```xml
<g class="node c-blue">
  <rect x="100" y="20" width="180" height="44" rx="8" stroke-width="0.5"/>
  <text class="th" x="190" y="42" text-anchor="middle" dominant-baseline="central">服务名称</text>
</g>
```

**两行节点（56px）：**
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

根据主题选择合适的布局：

1. **流程图** — CI/CD 管道、请求生命周期、审批工作流、数据处理。单一方向的流程（从上到下或从左到右）。每行最多 4-5 个节点。
2. **结构/包含图** — 云基础设施嵌套、带层级的系统架构。包含内部区域的大型外部容器。用于逻辑分组的虚线矩形。
3. **API/端点映射** — REST 路由、GraphQL 模式。从根节点开始的树形结构，分支到资源组，每个资源组包含端点节点。
4. **微服务拓扑** — 服务网格、事件驱动系统。服务作为节点，箭头表示通信模式，消息队列位于中间。
5. **数据流** — ETL 管道、流式架构。从左到右，从数据源经过处理流向数据接收器。
6. **物理/结构图** — 车辆、建筑物、硬件、解剖结构。使用与物理形态匹配的形状 — 弯曲的物体用 `<path>`，锥形用 `<polygon>`，圆柱形部件用 `<ellipse>`/`<circle>`，隔间用嵌套的 `<rect>`。参见 `references/physical-shape-cookbook.md`。
7. **基础设施/系统集成** — 智慧城市、物联网网络、多域系统。采用以中心平台连接子系统的中心辐射式布局。使用具有语义的线条样式（`.data-line`, `.power-line`, `.water-pipe`, `.road`）。参见 `references/infrastructure-patterns.md`。
8. **UI/仪表盘模型** — 管理面板、监控仪表盘。带有嵌套图表/仪表/指示器元素的屏幕框架。参见 `references/dashboard-patterns.md`。

对于物理、基础设施和仪表盘图表，在生成前加载匹配的参考文件 — 每个文件都提供了现成的 CSS 类和形状原语。

---

## 验证清单

在最终确定任何 SVG 之前，请验证以下所有内容：

1.  每个 `<text>` 都具有 `t`、`ts` 或 `th` 类。
2.  框内的每个 `<text>` 都设置了 `dominant-baseline="central"`。
3.  用作箭头的每个连接器 `<path>` 或 `<line>` 都设置了 `fill="none"`。
4.  没有箭头线穿过不相关的框。
5.  对于 14px 文本，`box_width >= (最长标签字符数 × 8) + 48`。
6.  对于 12px 文本，`box_width >= (最长标签字符数 × 6.5) + 48`。
7.  视图框高度 = 最下方元素 + 40px。
8.  所有内容保持在 x=40 到 x=640 之间。
9.  颜色类（`c-*`）应用于 `<g>` 或形状元素，绝不应用于 `<path>` 连接器。
10. 箭头 `<defs>` 块已存在。
11. 没有渐变、阴影、模糊或发光效果。
12. 所有节点边框的描边宽度为 0.5px。

---

## 输出与预览

### 默认：独立 HTML 文件

编写一个用户可以直接打开的单一 `.html` 文件。无需服务器、无依赖项，可离线工作。模式如下：

```python
# 1. 加载模板
template = skill_view("concept-diagrams", "templates/template.html")

# 2. 填写标题、副标题并粘贴你的 SVG
html = template.replace(
    "<!-- DIAGRAM TITLE HERE -->", "SN2 反应机理"
).replace(
    "<!-- OPTIONAL SUBTITLE HERE -->", "双分子亲核取代"
).replace(
    "<!-- PASTE SVG HERE -->", svg_content
)

# 3. 写入用户选择的路径（默认为当前目录 ./）
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

仅在用户明确需要可浏览的多图表画廊时使用此选项。

**规则：**
-   仅绑定到 `127.0.0.1`。绝不使用 `0.0.0.0`。在共享网络中，将图表暴露在所有网络接口上存在安全隐患。
-   选择一个空闲端口（不要硬编码）并告知用户所选的 URL。
-   该服务器是可选的且需用户选择加入 — 优先提供独立的 HTML 文件。

推荐模式（让操作系统选择一个空闲的临时端口）：

```bash
# 将每个图表放在 .diagrams/ 下的单独文件夹中
mkdir -p .diagrams/sn2-mechanism
# ...编写 .diagrams/sn2-mechanism/index.html...

# 仅在回环地址上提供服务，使用空闲端口
cd .diagrams && python3 -c "
import http.server, socketserver
with socketserver.TCPServer(('127.0.0.1', 0), http.server.SimpleHTTPRequestHandler) as s:
    print(f'Serving at http://127.0.0.1:{s.server_address[1]}/')
    s.serve_forever()
" &
```

如果用户坚持使用固定端口，请使用 `127.0.0.1:<端口>` — 仍然绝不使用 `0.0.0.0`。说明如何停止服务器（`kill %1` 或 `pkill -f "http.server"`）。

---

## 示例参考

`examples/` 目录附带 15 个完整、经过测试的图表。在编写类似类型的新图表之前，请浏览它们以获取可用模式：

| 文件名 | 类型 | 演示内容 |
|------|------|------|
| `hospital-emergency-department-flow.md` | 流程图 | 带语义颜色的优先级路由 |
| `feature-film-production-pipeline.md` | 流程图 | 分阶段工作流、水平子流程 |
| `automated-password-reset-flow.md` | 流程图 | 带错误分支的身份验证流程 |
| `autonomous-llm-research-agent-flow.md` | 流程图 | 回环箭头、决策分支 |
| `place-order-uml-sequence.md` | 序列图 | UML 序列图风格 |
| `commercial-aircraft-structure.md` | 物理结构 | 使用路径、多边形、椭圆实现逼真形状 |
| `wind-turbine-structure.md` | 物理剖面图 | 地下/地上分离、颜色编码 |
| `smartphone-layer-anatomy.md` | 分解视图 | 左右交替标签、分层组件 |
| `apartment-floor-plan-conversion.md` | 平面图 | 墙壁、门、虚线标示的拟议变更 |
| `banana-journey-tree-to-smoothie.md` | 叙事旅程 | 蜿蜒路径、渐进状态变化 |
| `cpu-ooo-microarchitecture.md` | 硬件管道 | 扇出、内存层级侧边栏 |
| `sn2-reaction-mechanism.md` | 化学反应 | 分子、弯曲箭头、能级图 |
| `smart-city-infrastructure.md` | 中心辐射图 | 每个系统使用语义线条样式 |
| `electricity-grid-flow.md` | 多阶段流程 | 电压层级、流量标记 |
| `ml-benchmark-grouped-bar-chart.md` | 图表 | 分组条形图、双轴 |

使用以下命令加载任何示例：
```
skill_view(name="concept-diagrams", file_path="examples/<filename>")
```

---

## 快速参考：何时使用什么

| 用户说 | 图表类型 | 建议颜色 |
|------|------|------|
| “展示管道” | 流程图 | 灰色开始/结束，紫色步骤，红色错误，青色部署 |
| “绘制数据流” | 数据管道（左-右） | 灰色数据源，紫色处理，青色数据接收器 |
| “可视化系统” | 结构（包含）图 | 紫色容器，青色服务，珊瑚色数据 |
| “映射端点” | API 树 | 紫色根节点，每个资源组一个分支 |
| “展示服务” | 微服务拓扑 | 灰色入口，青色服务，紫色总线，珊瑚色工作节点 |
| “绘制飞机/车辆” | 物理结构图 | 使用路径、多边形、椭圆实现逼真形状 |
| “智慧城市/物联网” | 中心辐射式集成图 | 每个子系统使用语义线条样式 |
| “展示仪表盘” | UI 模型 | 深色屏幕，图表颜色：青色、紫色、珊瑚色用于警报 |
| “电网/电力” | 多阶段流程 | 电压层级（高压/中压/低压线粗细） |
| “风力涡轮机/涡轮机” | 物理剖面图 | 地基 + 塔架剖面 + 机舱颜色编码 |
| “X 的旅程/生命周期” | 叙事旅程 | 蜿蜒路径，渐进状态变化 |
| “X 的层次/分解视图” | 分解层视图 | 垂直堆叠，交替标签 |
| “CPU/管道” | 硬件管道 | 垂直阶段，扇出到执行端口 |
| “平面图/公寓” | 平面图 | 墙壁、门、虚线标示的拟议变更 |
| “反应机理” | 化学 | 原子、键、弯曲箭头、过渡态、能级图 |