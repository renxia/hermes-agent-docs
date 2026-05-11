---
title: "Spike — 验证性实验：在正式构建前验证想法"
sidebar_label: "Spike"
description: "在正式构建前，通过一次性实验来验证想法"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非本页面。*/}

# Spike

一次性实验，用于在正式构建前验证想法。

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
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时，智能体所看到的指令。
:::

# Spike

当用户想要**试探一个想法**，再决定是否进行正式构建时，使用此技能——这可以是验证可行性、比较不同方法，或是发现那些无论研究多少都无法解答的未知问题。Spike 实验本质上是一次性的。一旦它们的价值被榨取，就应该被丢弃。

当用户说类似这样的话时加载此技能：“让我试试这个”、“我想看看 X 是否可行”、“先做个 spike 验证一下”、“在我承诺做 Y 之前”、“快速做个 Z 的原型”、“这甚至可能吗？”或“比较 A 和 B”。

## 何时**不**使用此技能

- 答案可以通过阅读文档或代码来获取——那就做研究，而不是构建
- 工作属于生产路径——请改用 `writing-plans` / `plan`
- 想法已经被验证——直接跳到实现

## 如果用户安装了完整的 GSD 系统

如果 `gsd-spike` 作为并列技能出现（通过 `npx get-shit-done-cc --hermes` 安装），当用户需要完整的 GSD 工作流（持久化的 `.planning/spikes/` 状态、跨会话的 MANIFEST 跟踪、Given/When/Then 判定格式，以及能与 GSD 其余部分集成的提交模式）时，请优先使用 **`gsd-spike`**。此技能是面向那些没有（或不想使用）完整系统的用户的轻量级独立版本。

## 核心方法

无论规模大小，每个 spike 都遵循此循环：

```
分解  →  研究  →  构建  →  判定
   ↑__________________________________________↓
                  根据发现迭代
```

### 1. 分解

将用户的想法分解为 **2-5 个独立的可行性问题**。每个问题就是一个 spike。以 Given/When/Then 的框架呈现它们为表格：

| # | Spike | 验证点 (Given/When/Then) | 风险 |
|---|-------|----------------------------|------|
| 001 | websocket-streaming | Given（给定）一个 WS 连接，When（当）LLM 流式传输 tokens，Then（那么）客户端在 &lt; 100ms 内接收到数据块 | 高 |
| 002a | pdf-parse-pdfjs | Given 一个多页 PDF，When 使用 pdfjs 解析，Then 可提取结构化文本 | 中 |
| 002b | pdf-parse-camelot | Given 一个多页 PDF，When 使用 camelot 解析，Then 可提取结构化文本 | 中 |

**Spike 类型：**
- **标准型** — 一个方法回答一个问题
- **比较型** — 同一个问题，不同的方法（共享编号，使用字母后缀 `a`/`b`/`c`）

**好的 spike 问题：** 具体的可行性，带有可观察的输出。
**差的 spike 问题：** 太宽泛、没有可观察的输出，或者仅仅是“阅读关于 X 的文档”。

**按风险排序。** 最有可能杀死想法的 spike 先做。如果困难的部分行不通，那么容易的部分也就没必要做原型了。

**只有当用户确切地知道他们想 spike 什么并明确说出来时，才跳过分解。** 那么就将他们的想法作为一个单独的 spike。

### 2. 对齐（针对多 spike 的想法）

展示 spike 表格。询问：“按此顺序全部构建，还是调整？”在您编写任何代码之前，让用户可以删除、重新排序或重新定义问题。

### 3. 研究（每个 spike，在构建之前）

Spike 并非不需要研究——您需要研究足够多的信息来选择正确的方法，然后才构建。每个 spike：

1.  **简述。** 2-3 句话：这个 spike 是什么、为什么重要、关键风险。
2.  **呈现竞争方案**（如果确实有选择）：

    | 方案 | 工具/库 | 优点 | 缺点 | 状态 |
    |----------|-------------|------|------|--------|
    | ... | ... | ... | ... | 维护中 / 已废弃 / 测试版 |

3.  **选择一个。** 说明原因。如果有 2 个以上可信选项，在 spike 内快速构建变体。
4.  **跳过研究**，对于没有外部依赖的纯逻辑。

使用 Hermes 工具进行研究步骤：

- `web_search("python websocket streaming libraries 2025")` — 寻找候选库
- `web_extract(urls=["https://websockets.readthedocs.io/..."])` — 阅读实际文档（返回 markdown）
- `terminal("pip show websockets | grep Version")` — 检查项目虚拟环境中安装了什么

对于没有文档页面的库，通过 `read_file` 克隆并阅读它们的 `README.md` / `examples/`。Context7 MCP（如果用户配置了）也是一个好来源 — `mcp_*_resolve-library-id` 然后 `mcp_*_query-docs`。

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

**倾向于构建用户可以交互的东西。** 当唯一的输出是一行写着“它工作了”的日志时，Spike 就失败了。用户想要*感受*到 spike 在工作。默认选择，按偏好顺序：

1.  一个可运行的 CLI，接受输入并打印可观察的输出
2.  一个展示行为的最小 HTML 页面
3.  一个只有一个端点的小型 web 服务器
4.  一个通过可识别的断言来验证问题的单元测试

**深度优先于速度。** 永远不要在一次顺利的运行后就宣称“它工作了”。测试边界情况。跟踪令人惊讶的发现。只有当调查是诚实的，判定才可信。

**避免使用**（除非 spike 明确要求）：复杂的包管理、构建工具/打包器、Docker、环境变量文件、配置系统。将所有东西硬编码 — 这只是一个 spike。

**构建一个 spike** — 典型的工具调用序列：

```
terminal("mkdir -p spikes/001-websocket-streaming")
write_file("spikes/001-websocket-streaming/README.md", "# 001: websocket-streaming\n\n...")
write_file("spikes/001-websocket-streaming/main.py", "...")
terminal("cd spikes/001-websocket-streaming && python3 main.py")
# 观察输出，迭代。
```

**并行比较型 spike (002a / 002b) — 委派。** 当两个方法可以并行运行，并且都需要真正的工程工作（而非 10 行的原型）时，使用 `delegate_task` 进行扇出：

```
delegate_task(tasks=[
    {"goal": "构建 002a-pdf-parse-pdfjs: ...", "toolsets": ["terminal", "file", "web"]},
    {"goal": "构建 002b-pdf-parse-camelot: ...", "toolsets": ["terminal", "file", "web"]},
])
```

每个子智能体返回自己的判定；您来撰写对比分析。

### 5. 判定

每个 spike 的 `README.md` 以如下内容结尾：

```markdown
## 判定：已验证 | 部分验证 | 未验证

### 成功之处
- ...

### 未成功之处
- ...

### 意外发现
- ...

### 对正式构建的建议
- ...
```

**已验证** = 核心问题得到了肯定的回答，并有证据支持。
**部分验证** = 在约束条件 X, Y, Z 下可行 — 记录它们。
**未验证** = 不可行，原因如下。这是一个成功的 spike。

## 比较型 spike

当两个方法回答同一个问题 (002a / 002b) 时，**依次**构建它们，然后在最后进行直接对比：

```markdown
## 直接对比：pdfjs vs camelot

| 维度 | pdfjs (002a) | camelot (002b) |
|-----------|--------------|----------------|
| 提取质量 | 9/10 结构化 | 7/10 仅表格 |
| 设置复杂度 | npm install，1 行 | pip + ghostscript |
| 100 页 PDF 性能 | 3 秒 | 18 秒 |
| 处理旋转文本 | 否 | 是 |

**胜出者：** 对于我们的用例是 pdfjs。如果以后需要以表格优先的提取，则用 camelot。
```

## 前沿模式（选择接下来 spike 什么）

如果已经存在 spike，并且用户问“我接下来应该 spike 什么？”，请遍历现有目录，寻找：

- **集成风险** — 两个已验证的 spike 触及相同的资源，但它们是独立测试的
- **数据交接** — spike A 的输出假设与 spike B 的输入兼容；但从未被证明
- **愿景中的缺口** — 被假设但未被证明的能力
- **替代方法** — 针对“部分验证”或“未验证” spike 的不同角度

提出 2-4 个候选方案，使用 Given/When/Then 格式。让用户选择。

## 输出

- 在仓库根目录创建 `spikes/`（如果用户使用 GSD 约定，则为 `.planning/spikes/`）
- 每个 spike 一个目录：`NNN-描述性名称/`
- 每个 spike 的 `README.md` 记录问题、方法、结果、判定
- 保持代码的临时性 — 一个需要花 2 天“清理以用于生产”的 spike 是一个糟糕的 spike

## 署名

改编自 GSD (Get Shit Done) 项目的 `/gsd-spike` 工作流 — MIT © 2025 Lex Christopherson ([gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done))。完整的 GSD 系统提供持久化的 spike 状态、MANIFEST 跟踪，以及与更广泛的规范驱动开发流水线的集成；通过 `npx get-shit-done-cc --hermes --global` 安装。