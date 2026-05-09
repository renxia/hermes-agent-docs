---
title: "Spike — 在正式构建之前通过一次性实验验证想法"
sidebar_label: "Spike"
description: "在正式构建之前通过一次性实验验证想法"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Spike

在正式构建之前通过一次性实验验证想法。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/software-development/spike` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体（改编自 gsd-build/get-shit-done） |
| 许可证 | MIT |
| 标签 | `spike`, `prototype`, `experiment`, `feasibility`, `throwaway`, `exploration`, `research`, `planning`, `mvp`, `proof-of-concept` |
| 相关技能 | [`sketch`](/docs/user-guide/skills/bundled/creative/creative-sketch), [`writing-plans`](/docs/user-guide/skills/bundled/software-development/software-development-writing-plans), [`subagent-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-subagent-driven-development), [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Spike

当用户想要在投入实际构建之前**试探一个想法**时使用此技能——验证可行性、比较不同方法，或发现仅靠研究无法解答的未知因素。Spike 实验在设计上就是一次性的。一旦它们完成了使命，就将其丢弃。

当用户说出类似“让我试试这个”、“我想看看 X 是否可行”、“快速验证一下这个”、“在我投入 Y 之前”、“Z 的快速原型”、“这甚至可能吗？”或“比较 A 和 B”时，加载此技能。

## 何时不应使用此技能

- 答案可以通过文档或阅读代码得知——只需进行研究，无需构建
- 工作属于生产路径——请改用 `writing-plans` / `plan`
- 想法已经被验证——直接跳到实现阶段

## 如果用户已安装完整的 GSD 系统

如果 `gsd-spike` 作为同级技能出现（通过 `npx get-shit-done-cc --hermes` 安装），当用户需要完整的 GSD 工作流时，请优先使用 **`gsd-spike`**：持久化的 `.planning/spikes/` 状态、跨会话的 MANIFEST 跟踪、Given/When/Then 结论格式，以及与 GSD 其他部分集成的提交模式。此技能是轻量级的独立版本，适用于没有（或不需要）完整系统的用户。

## 核心方法

无论规模大小，每个 spike 都遵循以下循环：

```
分解  →  研究  →  构建  →  结论
   ↑__________________________________________↓
                  根据发现迭代
```

### 1. 分解

将用户的想法分解为 **2-5 个独立的可行性问题**。每个问题对应一个 spike。以 Given/When/Then 框架以表格形式呈现：

| # | Spike | 验证内容（Given/When/Then） | 风险 |
|---|-------|----------------------------|------|
| 001 | websocket-streaming | 给定一个 WebSocket 连接，当 LLM 流式传输 token 时，客户端接收到的数据块 < 100ms | 高 |
| 002a | pdf-parse-pdfjs | 给定一个多页 PDF，当使用 pdfjs 解析时，可提取结构化文本 | 中 |
| 002b | pdf-parse-camelot | 给定一个多页 PDF，当使用 camelot 解析时，可提取结构化文本 | 中 |

**Spike 类型：**
- **标准型** — 一种方法回答一个问题
- **比较型** — 同一问题，不同方法（共享编号，字母后缀 `a`/`b`/`c`）

**好的 spike 问题：** 具有可观察输出的具体可行性问题。
**差的 spike 问题：** 过于宽泛、无可观察输出，或仅仅是“阅读关于 X 的文档”。

**按风险排序。** 最有可能否定该想法的 spike 优先运行。如果关键难点无法实现，那么对简单部分进行原型设计就没有意义。

**跳过分解** 仅当用户已经明确知道他们想要验证什么并明确说明时。此时，将他们的想法视为单个 spike。

### 2. 对齐（针对多 spike 想法）

呈现 spike 表格。询问：“按此顺序构建所有项目，还是进行调整？”在编写任何代码之前，让用户删除、重新排序或重新定义。

### 3. 研究（每个 spike 构建前）

Spike 并非无需研究——你需要研究足够的内容以选择正确的方法，然后进行构建。每个 spike：

1. **简要说明。** 2-3 句话：此 spike 是什么，为什么重要，关键风险。
2. **呈现竞争方法** 如果存在真正的选择：

   | 方法 | 工具/库 | 优点 | 缺点 | 状态 |
   |----------|-------------|------|------|--------|
   | ... | ... | ... | ... | 维护中 / 已废弃 / 测试版 |

3. **选择一个。** 说明原因。如果有 2 个或更多可信选项，则在 spike 中构建快速变体。
4. **跳过研究** 对于纯逻辑且无外部依赖的情况。

使用 Hermes 工具进行研究步骤：

- `web_search("python websocket streaming libraries 2025")` — 查找候选库
- `web_extract(urls=["https://websockets.readthedocs.io/..."])` — 阅读实际文档（返回 markdown）
- `terminal("pip show websockets | grep Version")` — 检查项目中虚拟环境已安装的版本

对于没有文档页面的库，通过 `read_file` 克隆并阅读其 `README.md` / `examples/`。如果用户已配置 Context7 MCP，这也是一个很好的来源 — 先使用 `mcp_*_resolve-library-id`，然后使用 `mcp_*_query-docs`。

### 4. 构建

每个 spike 一个目录。保持其独立性。

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

**偏向于用户可以与之交互的内容。** 当唯一输出是“它工作了”这样的日志行时，Spike 往往会失败。用户希望*感受*到 spike 正在工作。默认选择，按偏好顺序排列：

1. 一个可运行的 CLI，接受输入并打印可观察的输出
2. 一个展示行为的最小 HTML 页面
3. 一个带有一个端点的小型 Web 服务器
4. 一个用可识别断言测试问题的单元测试

**深度优于速度。** 切勿在一次顺利路径运行后就宣称“它工作了”。测试边缘情况。追踪令人惊讶的发现。只有当调查是诚实的，结论才是可信的。

**避免** 除非 spike 特别要求：复杂的包管理、构建工具/打包器、Docker、环境文件、配置系统。硬编码所有内容——这是一个 spike。

**构建一个 spike** — 典型的工具序列：

```
terminal("mkdir -p spikes/001-websocket-streaming")
write_file("spikes/001-websocket-streaming/README.md", "# 001: websocket-streaming\n\n...")
write_file("spikes/001-websocket-streaming/main.py", "...")
terminal("cd spikes/001-websocket-streaming && python3 main.py")
# 观察输出，迭代。
```

**并行比较 spikes (002a / 002b) — 委派。** 当两种方法可以并行运行且都需要真正的工程实现（而非 10 行代码的原型）时，使用 `delegate_task` 进行分发：

```
delegate_task(tasks=[
    {"goal": "构建 002a-pdf-parse-pdfjs: ...", "toolsets": ["terminal", "file", "web"]},
    {"goal": "构建 002b-pdf-parse-camelot: ...", "toolsets": ["terminal", "file", "web"]},
])
```

每个子智能体返回其自己的结论；你负责撰写最终对比。

### 5. 结论

每个 spike 的 `README.md` 以以下内容结尾：

```markdown
## 结论: 已验证 | 部分验证 | 未验证

### 有效部分
- ...

### 无效部分
- ...

### 意外发现
- ...

### 对实际构建的建议
- ...
```

**已验证** = 核心问题已得到肯定回答，并有证据支持。
**部分验证** = 在约束条件 X、Y、Z 下有效——请记录这些条件。
**未验证** = 无效，原因如下。这是一个成功的 spike。

## 比较型 spikes

当两种方法回答同一问题（002a / 002b）时，**背靠背**构建它们，然后在最后进行正面比较：

```markdown
## 正面比较：pdfjs 与 camelot

| 维度 | pdfjs (002a) | camelot (002b) |
|-----------|--------------|----------------|
| 提取质量 | 9/10 结构化 | 7/10 仅表格 |
| 设置复杂度 | npm install，一行代码 | pip + ghostscript |
| 100 页 PDF 性能 | 3秒 | 18秒 |
| 处理旋转文本 | 否 | 是 |

**胜出者：** 对于我们的用例，pdfjs 更优。如果后续需要以表格优先的提取，则选择 Camelot。
```

## 前沿模式（选择下一个要验证的内容）

如果 spike 已存在且用户询问“接下来我应该验证什么？”，请遍历现有目录并查找：

- **集成风险** — 两个已验证的 spike 涉及相同资源，但独立测试
- **数据交接** — spike A 的输出被假设与 spike B 的输入兼容；但从未被证明
- **愿景中的空白** — 假设但未经证实的能力
- **替代方法** — 针对部分验证或未验证 spike 的不同角度

提出 2-4 个候选方案，格式为 Given/When/Then。让用户选择。

## 输出

- 在仓库根目录创建 `spikes/`（如果用户使用的是 GSD 约定，则为 `.planning/spikes/`）
- 每个 spike 一个目录：`NNN-描述性名称/`
- 每个 spike 的 `README.md` 记录问题、方法、结果和结论
- 保持代码的一次性特性 — 一个需要 2 天时间来“清理以用于生产”的 spike 是一个糟糕的 spike

## 归属

改编自 GSD (Get Shit Done) 项目的 `/gsd-spike` 工作流 — MIT © 2025 Lex Christopherson ([gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done))。完整的 GSD 系统提供持久的 spike 状态、MANIFEST 跟踪，并与更广泛的基于规约的开发流程集成；使用 `npx get-shit-done-cc --hermes --global` 安装。