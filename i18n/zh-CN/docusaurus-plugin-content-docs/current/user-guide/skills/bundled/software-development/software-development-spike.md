---
title: "Spike — 验证想法后再进行构建的临时实验"
sidebar_label: "Spike"
description: "验证想法后再进行构建的临时实验"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md 而非此页面。 */}

# Spike

在真正投入构建之前，通过临时实验来验证一个想法。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/software-development/spike` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体（改编自 gsd-build/get-shit-done） |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `spike`, `prototype`, `experiment`, `feasibility`, `throwaway`, `exploration`, `research`, `planning`, `mvp`, `proof-of-concept` |
| 相关技能 | [`sketch`](/docs/user-guide/skills/bundled/creative/creative-sketch), [`writing-plans`](/docs/user-guide/skills/bundled/software-development/software-development-writing-plans), [`subagent-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-subagent-driven-development), [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan) |

## 参考：完整的 SKILL.md

:::info
以下是触发此技能时，Hermes 加载的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# Spike

当用户想在投入真正构建之前**试探一个想法**时使用此技能——验证可行性、比较方法，或揭示任何研究都无法回答的未知问题。Spike 在设计上就是一次性的。它们偿清债务后就该被丢弃。

当用户说“让我试试这个”、“我想看看X是否可行”、“做个Spike试试”、“在我承诺做Y之前”、“快速原型Z”、“这有可能实现吗？”或“比较一下A和B”时，加载此技能。

## 何时不应使用此技能

- 答案可以通过阅读文档或代码得知——只需研究，不要构建
- 工作属于生产路径——请改用 `writing-plans` / `plan`
- 想法已得到验证——直接跳到实现

## 如果用户安装了完整的GSD系统

如果 `gsd-spike` 作为一个同级技能显示（通过 `npx get-shit-done-cc --hermes` 安装），当用户需要完整的GSD工作流时，请优先使用 **`gsd-spike`**：持久化的 `.planning/spikes/` 状态、跨会话的MANIFEST跟踪、Given/When/Then结论格式，以及与GSD其他部分集成的提交模式。此技能是为没有（或不想要）完整系统用户准备的轻量级独立版本。

## 核心方法

无论规模大小，每个Spike都遵循以下循环：

```
分解  →  研究  →  构建  →  结论
   ↑__________________________________________↓
                  基于发现迭代
```

### 1. 分解

将用户的想法分解为 **2-5个独立的可行性问题**。每个问题就是一个Spike。以Given/When/Then框架将它们呈现为一个表格：

| # | Spike | 验证内容 (Given/When/Then) | 风险 |
|---|-------|----------------------------|------|
| 001 | websocket-streaming | 假设一个WebSocket连接，当LLM流式传输token时，客户端在 &lt; 100ms 内收到数据块 | 高 |
| 002a | pdf-parse-pdfjs | 假设一个多页PDF，当使用pdfjs解析时，可以提取结构化文本 | 中 |
| 002b | pdf-parse-camelot | 假设一个多页PDF，当使用camelot解析时，可以提取结构化文本 | 中 |

**Spike类型：**
- **标准** — 一种方法回答一个问题
- **比较** — 相同问题，不同方法（共享数字，后缀字母 `a`/`b`/`c`）

**好的Spike问题：** 具体的可行性问题，带有可观察的输出。
**坏的Spike问题：** 过于宽泛，无可观察输出，或者仅仅是“阅读关于X的文档”。

**按风险排序。** 最可能否定想法的Spike先运行。如果困难的部分行不通，原型化简单的部分就毫无意义。

**仅当用户确切知道他们想要Spike什么并明确说明时，才跳过分解。** 然后将他们的想法视为单个Spike。

### 2. 对齐（用于多Spike的想法）

呈现Spike表格。询问：“按此顺序全部构建，还是调整？” 在编写任何代码之前，让用户删除、重新排序或重新定义问题。

### 3. 研究（每个Spike，在构建之前）

Spike并非不做研究——你需要研究足够来选择正确的方法，然后才开始构建。每个Spike：

1.  **简要说明。** 2-3句话：这个Spike是什么，为什么重要，关键风险是什么。
2.  **列出可行的备选方法**（如果存在真正的选择）：

    | 方法 | 工具/库 | 优点 | 缺点 | 状态 |
    |------|---------|------|------|------|
    | ... | ... | ... | ... | 维护中 / 已废弃 / 测试版 |

3.  **选择一种。** 说明原因。如果有2种以上可信，就在Spike内构建快速变体。
4.  **纯逻辑无外部依赖时跳过研究。**

在研究步骤中使用Hermes工具：

- `web_search("python websocket streaming libraries 2025")` — 寻找候选库
- `web_extract(urls=["https://websockets.readthedocs.io/..."])` — 阅读实际文档（返回markdown）
- `terminal("pip show websockets | grep Version")` — 检查项目虚拟环境中安装了什么版本

对于没有文档页面的库，通过 `read_file` 克隆并阅读它们的 `README.md` / `examples/`。Context7 MCP（如果用户配置了）也是一个好来源——`mcp_*_resolve-library-id` 然后 `mcp_*_query-docs`。

### 4. 构建

每个Spike一个目录。保持其独立性。

<!-- ascii-guard-ignore -->
```
spikes/
├── 001-websocket-streaming/
│   ├── README.md
│   └── main.py
├── 002a-pdf-parse-pdfjs/
│   ├── README.md
│   └── parse.js
└── 002b-pdf-parse-camelot/
    ├── README.md
    └── parse.py
```
<!-- ascii-guard-ignore-end -->

**偏向于用户可以交互的东西。** 当唯一输出是说“它有效”的日志行时，Spike就失败了。用户想要*感受*Spike在工作。默认选择，按优先顺序排列：

1.  一个可运行的CLI，接受输入并打印可观察的输出
2.  一个演示行为的最小HTML页面
3.  一个带单个端点的小型Web服务器
4.  一个通过可识别断言来检验问题的单元测试

**深度优于速度。** 永远不要在一次顺利运行后就宣称“它有效”。测试边缘情况。跟踪令人惊讶的发现。只有当调查是诚实的，结论才可信。

**避免**（除非Spike特别需要）：复杂的包管理、构建工具/打包器、Docker、环境变量文件、配置系统。一切硬编码——这只是一个Spike。

**构建单个Spike** — 典型的工具序列：

```
terminal("mkdir -p spikes/001-websocket-streaming")
write_file("spikes/001-websocket-streaming/README.md", "# 001: websocket-streaming\n\n...")
write_file("spikes/001-websocket-streaming/main.py", "...")
terminal("cd spikes/001-websocket-streaming && python3 main.py")
# 观察输出，迭代。
```

**并行比较Spike（002a / 002b）— 委派。** 当两种方法可以并行运行且都需要真正的工程工作（不是10行原型）时，使用 `delegate_task` 进行分派：

```
delegate_task(tasks=[
    {"goal": "构建 002a-pdf-parse-pdfjs: ...", "toolsets": ["terminal", "file", "web"]},
    {"goal": "构建 002b-pdf-parse-camelot: ...", "toolsets": ["terminal", "file", "web"]},
])
```

每个子智能体返回自己的结论；你负责撰写对比报告。

### 5. 结论

每个Spike的 `README.md` 以以下内容结尾：

```markdown
## 结论: 已验证 | 部分验证 | 未验证

### 有效的部分
- ...

### 无效的部分
- ...

### 意外发现
- ...

### 对真正构建的建议
- ...
```

**已验证** = 核心问题被肯定回答，并有证据支持。
**部分验证** = 在X, Y, Z约束下有效——记录这些约束。
**未验证** = 无效，原因如下。这是一个成功的Spike。

## 比较Spike

当两种方法回答同一个问题时（002a / 002b），**连续构建它们**，最后进行头对头比较：

```markdown
## 头对头: pdfjs vs camelot

| 维度 | pdfjs (002a) | camelot (002b) |
|------|--------------|----------------|
| 提取质量 | 9/10 结构化 | 7/10 仅表格 |
| 设置复杂度 | npm install, 1行代码 | pip + ghostscript |
| 100页PDF性能 | 3秒 | 18秒 |
| 处理旋转文本 | 否 | 是 |

**胜出者：** 对我们的用例来说是 pdfjs。如果我们以后需要以表格为先的提取，则选 camelot。
```

## 前沿模式（选择下一个Spike什么）

如果已经存在Spike，用户说“我应该Spike什么接下来？”，则遍历现有目录，寻找：

- **集成风险** — 两个已验证的Spike涉及相同资源，但却是独立测试的
- **数据交接** — Spike A的输出被假定与Spike B的输入兼容；从未证实
- **愿景中的空白** — 假设但未经证实的能力
- **替代方法** — 针对“部分验证”或“未验证”Spike的不同角度

提出2-4个候选者作为Given/When/Then。让用户选择。

## 输出

- 在仓库根目录创建 `spikes/`（或如果用户使用GSD惯例，则为 `.planning/spikes/`）
- 每个Spike一个目录：`NNN-描述性名称/`
- 每个Spike的 `README.md` 记录问题、方法、结果、结论
- 保持代码一次性——一个需要2天来“清理以用于生产”的Spike是一个糟糕的Spike

## 署名

改编自GSD（Get Shit Done）项目的 `/gsd-spike` 工作流——MIT © 2025 Lex Christopherson ([gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done))。完整的GSD系统提供持久化的Spike状态、MANIFEST跟踪，以及与更广泛的规范驱动开发流程的集成；通过 `npx get-shit-done-cc --hermes --global` 安装。