---
title: "Spike — 构建前通过一次性实验验证想法"
sidebar_label: "Spike"
description: "构建前通过一次性实验验证想法"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Spike

在构建前通过一次性实验来验证想法。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/software-development/spike` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent (改编自 gsd-build/get-shit-done) |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `spike`, `prototype`, `experiment`, `feasibility`, `throwaway`, `exploration`, `research`, `planning`, `mvp`, `proof-of-concept` |
| 相关技能 | [`sketch`](/user-guide/skills/bundled/creative/creative-sketch), [`writing-plans`](/user-guide/skills/bundled/software-development/software-development-writing-plans), [`subagent-driven-development`](/user-guide/skills/bundled/software-development/software-development-subagent-driven-development), [`plan`](/user-guide/skills/bundled/software-development/software-development-plan) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Spike

当用户想要在投入实际构建之前**试探一个想法**时——验证可行性、比较方案或揭示任何研究都无法解决的未知因素——使用此技能。Spike 本质上是一次性的，一旦偿还了其“债务”（即回答了问题），就可以丢弃。

当用户说出诸如“让我试试这个”、“我想看看 X 是否可行”、“快速原型化 Z”、“在我承诺做 Y 之前”、“快速原型化 Z”、“这真的可行吗？”或“比较 A 和 B”之类的话时，加载此技能。

## 何时不应使用此技能

- 答案可以通过文档或阅读代码获知——只需做研究，不要构建
- 工作属于生产路径——请改用 `writing-plans` / `plan`
- 想法已经验证——直接跳到实现

## 如果用户安装了完整的 GSD 系统

如果 `gsd-spike` 作为一个同级技能出现（通过 `npx get-shit-done-cc --hermes` 安装），当用户想要完整的 GSD 工作流时，请优先选择 **`gsd-spike`**：持久的 `.planning/spikes/` 状态、跨会话的 MANIFEST 跟踪、Given/When/Then 结论格式以及与 GSD 其余部分集成的提交模式。本技能是为那些没有（或不想要）完整系统的用户提供的轻量级独立版本。

## 核心方法

无论规模大小，每个 spike 都遵循以下循环：

```
分解 → 研究 → 构建 → 结论
   ↑__________________________________________↓
                  根据发现迭代
```

### 1. 分解

将用户的想法分解为 **2-5 个独立的可行性问题**。每个问题就是一个 spike。以 Given/When/Then 框架将它们呈现为一个表格：

| # | Spike | 验证内容 (Given/When/Then) | 风险 |
|---|-------|----------------------------|------|
| 001 | websocket-streaming | Given 一个 WS 连接，当 LLM 流式传输令牌时，客户端在 &lt;100ms 内接收分块数据 | 高 |
| 002a | pdf-parse-pdfjs | Given 一个多页 PDF，当使用 pdfjs 解析时，可提取结构化文本 | 中 |
| 002b | pdf-parse-camelot | Given 一个多页 PDF，当使用 camelot 解析时，可提取结构化文本 | 中 |

**Spike 类型：**
- **标准** — 一种方法回答一个问题
- **比较** — 同一问题，不同方法（共享编号，字母后缀 `a`/`b`/`c`）

**好的 spike 问题：** 具体的可行性，有可观察的输出。
**坏的 spike 问题：** 太宽泛，无可观察的输出，或者只是“阅读关于 X 的文档”。

**按风险排序。** 最有可能扼杀想法的 spike 先运行。如果困难的部分行不通，原型制作简单的部分就没有意义了。

**仅当**用户已经确切知道他们想要 spike 什么并且明确说明时，才**跳过分解**。然后将他们的想法视为单个 spike。

### 2. 对齐（用于多 spike 的想法）

呈现 spike 表格。询问：“按此顺序全部构建，还是调整？”在编写任何代码之前，让用户可以删除、重新排序或重新构建问题。

### 3. 研究（每个 spike，在构建之前）

Spike 并非不需要研究——你只需研究到足以选择正确方法的程度，然后就开始构建。对于每个 spike：

1.  **简要说明。** 2-3 句话：这个 spike 是什么，为什么重要，主要风险。
2.  **列出竞争方案**（如果存在真正的选择）：

    | 方法 | 工具/库 | 优点 | 缺点 | 状态 |
    |----------|-------------|------|------|--------|
    | ... | ... | ... | ... | 维护中 / 已弃用 / 测试版 |

3.  **选择一个。** 说明原因。如果有 2 个以上可行，在 spike 内构建快速变体。
4.  对于没有外部依赖的纯逻辑，**跳过研究**。

使用 Hermes 工具进行研究步骤：

- `web_search("python websocket streaming libraries 2025")` — 查找候选
- `web_extract(urls=["https://websockets.readthedocs.io/..."])` — 阅读实际文档（返回 markdown）
- `terminal("pip show websockets | grep Version")` — 检查项目虚拟环境中安装了什么

对于没有文档页面的库，通过 `read_file` 克隆并阅读它们的 `README.md` / `examples/`。如果用户配置了 Context7 MCP，它也是一个很好的来源——`mcp_*_resolve-library-id` 然后 `mcp_*_query-docs`。

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

**偏向于用户可以交互的东西。** 当唯一的输出是写着“它能工作”的日志行时，Spike 就失败了。用户想要**感受** spike 在工作。默认选择，按优先顺序：

1.  一个可运行的 CLI，接受输入并打印可观察的输出
2.  一个演示行为的最小 HTML 页面
3.  一个带有一个端点的小型 Web 服务器
4.  一个通过可识别的断言来测试问题的单元测试

**深度胜过速度。** 永远不要在一次愉快路径运行后就宣称“它能工作”。测试边缘情况。跟踪令人惊讶的发现。只有当调查是诚实的，结论才可信。

**避免**（除非 spike 特别需要）：复杂的包管理、构建工具/打包器、Docker、环境文件、配置系统。硬编码一切——这只是一个 spike。

**构建一个 spike** — 典型的工具序列：

```
terminal("mkdir -p spikes/001-websocket-streaming")
write_file("spikes/001-websocket-streaming/README.md", "# 001: websocket-streaming\n\n...")
write_file("spikes/001-websocket-streaming/main.py", "...")
terminal("cd spikes/001-websocket-streaming && python3 main.py")
# 观察输出，迭代。
```

**并行比较 spike (002a / 002b) — 委派。** 当两种方法可以并行运行，且两者都需要真正的工程（不是 10 行原型）时，使用 `delegate_task` 进行扇出：

```
delegate_task(tasks=[
    {"goal": "构建 002a-pdf-parse-pdfjs: ...", "toolsets": ["terminal", "file", "web"]},
    {"goal": "构建 002b-pdf-parse-camelot: ...", "toolsets": ["terminal", "file", "web"]},
])
```

每个子智能体返回自己的结论；你来编写对比分析。

### 5. 结论

每个 spike 的 `README.md` 结尾包含：

```markdown
## 结论：已验证 | 部分验证 | 已证伪

### 有效的部分
- ...

### 无效的部分
- ...

### 意外发现
- ...

### 对实际构建的建议
- ...
```

**已验证** = 核心问题得到了肯定的回答，并有证据支持。
**部分验证** = 在约束条件 X, Y, Z 下可行——记录它们。
**已证伪** = 不可行，原因是……。这是一个成功的 spike。

## 比较性 spike

当两种方法回答同一个问题（002a / 002b）时，**背靠背**地构建它们，然后在最后进行对比分析：

```markdown
## 对比分析：pdfjs vs camelot

| 维度 | pdfjs (002a) | camelot (002b) |
|-----------|--------------|----------------|
| 提取质量 | 9/10 结构化 | 7/10 仅表格 |
| 设置复杂度 | npm install, 1 行 | pip + ghostscript |
| 100 页 PDF 性能 | 3 秒 | 18 秒 |
| 处理旋转文本 | 否 | 是 |

**胜出者：** 对于我们的用例是 pdfjs。如果以后需要表格优先的提取，则选择 camelot。
```

## 前沿模式（选择下一步 spike 什么）

如果已经存在 spike，并且用户问“我下一步应该 spike 什么？”，则遍历现有目录并查找：

- **集成风险** — 两个已验证的 spike 触及同一资源，但被独立测试
- **数据交接** — spike A 的输出被假设与 spike B 的输入兼容；但从未验证
- **愿景中的空白** — 假设但未证实的能力
- **替代方案** — 对于部分验证或已证伪的 spike，尝试不同的角度

提出 2-4 个候选方案（使用 Given/When/Then 格式）。让用户选择。

## 输出

- 在仓库根目录创建 `spikes/`（如果用户使用 GSD 约定，则为 `.planning/spikes/`）
- 每个 spike 一个目录：`NNN-描述性名称/`
- 每个 spike 的 `README.md` 记录问题、方法、结果、结论
- 保持代码的一次性——一个需要 2 天时间“为生产清理”的 spike 是一个坏的 spike

## 署名

改编自 GSD (Get Shit Done) 项目的 `/gsd-spike` 工作流 — MIT © 2025 Lex Christopherson ([gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done))。完整的 GSD 系统提供持久的 spike 状态、MANIFEST 跟踪以及与更广泛的规范驱动开发管道的集成；可通过 `npx get-shit-done-cc --hermes --global` 安装。