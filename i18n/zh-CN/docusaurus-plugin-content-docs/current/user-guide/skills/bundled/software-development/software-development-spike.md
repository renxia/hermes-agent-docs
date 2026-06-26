---
title: "尖峰（Spike）—在构建前验证想法的一次性实验"
sidebar_label: "尖峰"
description: "在构建前验证想法的一次性实验"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Spike

在构建前验证想法的一次性实验。

## Skill metadata

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/software-development/spike` |
| Version | `1.0.0` |
| Author | Hermes 智能体（改编自 gsd-build/get-shit-done） |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `spike`, `prototype`, `experiment`, `feasibility`, `throwaway`, `exploration`, `research`, `planning`, `mvp`, `proof-of-concept` |
| Related skills | [`sketch`](/docs/user-guide/skills/bundled/creative/creative-sketch), [`subagent-driven-development`](/docs/user-guide/skills/optional/software-development/software-development-subagent-driven-development), [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan) |

## Reference: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是该智能体在技能激活时的指令内容。
:::

# Spike

当用户希望在承诺进行实际构建之前**摸清一个想法**时，请使用此技能——无论是验证可行性、比较方法，还是找出任何研究都无法回答的未知问题。尖峰是按设计的一次性产物。一旦它们完成了使命，就应该被丢弃。

当用户说“让我试试”、“我想看看X是否可行”、“快速做一下这个原型”、“在我承诺Y之前”、“Z的快速原型”、“这可能吗？”或“比较A和B”时，加载此技能。

## When NOT to use this (何时不应使用)

- 答案可以从文档或阅读代码中得知——只需进行研究，无需构建。
- 该工作属于生产路径——请使用 `plan` 技能。
- 该想法已被验证——直接跳到实现即可。

## If the user has the full GSD system installed (如果用户安装了完整的 GSD 系统)

如果 `gsd-spike` 显示为同级技能（通过 `npx get-shit-done-cc --hermes` 安装），当用户需要完整的 GSD 工作流程时，请优先使用 **`gsd-spike`**：持久化的 `.planning/spikes/` 状态、跨会话的 MANIFEST 跟踪、Given/When/Then 的裁决格式以及与 GSD 其他部分集成的提交模式。此技能是为那些没有（或不想拥有）完整系统的用户提供的轻量级独立版本。

## Core method (核心方法)

无论规模大小，每个尖峰都遵循以下循环：

```
decompose  →  research  →  build  →  verdict
   ↑__________________________________________↓
                  iterate on findings
```

### 1. Decompose (分解)

将用户的想法分解为 **2-5 个独立的、可行的性问题**。每个问题就是一个尖峰。以包含 Given/When/Then 框架的表格形式呈现它们：

| # | Spike | Validates (Given/When/Then) | Risk |
|---|-------|----------------------------|------|
| 001 | websocket-streaming | Given a WS connection, when LLM streams tokens, then client receives chunks &lt; 100ms | High |
| 002a | pdf-parse-pdfjs | Given a multi-page PDF, when parsed with pdfjs, then structured text is extractable | Medium |
| 002b | pdf-parse-camelot | Given a multi-page PDF, when parsed with camelot, then structured text is extractable | Medium |

**Spike types (尖峰类型):**
- **standard** — 一种方法来回答一个问题。
- **comparison** — 同一个问题，不同的方法（使用相同的编号和 `a`/`b`/`c` 后缀）。

**Good spike questions (好的尖峰问题):** 具有可观察输出的具体可行性问题。
**Bad spike questions (不好的尖峰问题):** 太宽泛、没有可观察输出，或者只是“阅读关于X的文档”。

**Order by risk (按风险排序)。** 最有可能导致想法失败的尖峰应该首先运行。如果困难的部分无法实现，那么原型化简单的部分就没有意义了。

**Skip decomposition (跳过分解)** 仅当用户已经确切知道自己想做哪些尖峰并明确告知时才执行。在这种情况下，将他们的想法视为一个单一的尖峰。

### 2. Align (对多尖峰想法进行协调)

展示尖峰表。询问：“是否按此顺序全部构建，还是需要调整？” 在你编写任何代码之前，让用户决定是否放弃、重新排序或重新定义。

### 3. Research (研究 - 每个尖峰在构建前都必须进行)

尖峰并非无需研究——你需要进行足够的研究来选择正确的方案，然后才能构建。针对每个尖峰：

1. **Brief it (简要说明)。** 2-3 句话：这个尖峰是什么、为什么重要、关键风险点。
2. **Surface competing approaches (展示竞争性方法)**，如果存在真正的选择：

   | Approach | Tool/Library | Pros | Cons | Status |
   |----------|-------------|------|------|--------|
   | ... | ... | ... | ... | maintained / abandoned / beta |

3. **Pick one (选择一个)。** 说明原因。如果有 2 个或更多可信的方法，则在尖峰内快速构建变体。
4. **Skip research (跳过研究)**：对于没有外部依赖的纯逻辑问题。

使用 Hermes 工具进行研究步骤：

- `web_search("python websocket streaming libraries 2025")` — 查找候选库
- `web_extract(urls=["https://websockets.readthedocs.io/..."])` — 阅读实际文档（返回 markdown）
- `terminal("pip show websockets | grep Version")` — 检查项目虚拟环境 (venv) 中安装了什么

对于没有文档页面的库，请使用 `read_file` 通过克隆并阅读它们的 `README.md` / `examples/`。Context7 MCP（如果用户已配置）也是一个很好的资源——先执行 `mcp_*_resolve-library-id`，然后执行 `mcp_*_query-docs`。

### 4. Build (构建)

每个尖峰一个目录。保持其独立性。

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

**倾向于用户可以交互的部分。** 当唯一的输出是一行显示“它工作了”的日志时，尖峰就是失败的。用户希望*感受到*这个尖峰是可用的。默认选择顺序如下：

1. 一个可运行的 CLI，接受输入并打印可观察的输出
2. 一个展示行为的最小 HTML 页面
3. 一个带有单个端点的小型 Web 服务器
4. 一个使用可识别断言来执行问题的单元测试

**重视深度而非速度。** 永远不要在一次成功的路径运行后就宣布“它工作了”。测试边缘案例。关注令人惊讶的发现。只有当调查是诚实的，裁决结果才值得信赖。

**避免**除非尖峰特别要求：复杂的包管理、构建工具/捆绑器、Docker、环境变量文件、配置系统。一切都应该硬编码——因为这是一个尖峰。

**构建一个尖峰** — 典型的工具序列：

```
terminal("mkdir -p spikes/001-websocket-streaming")
write_file("spikes/001-websocket-streaming/README.md", "# 001: websocket-streaming\n\n...")
write_file("spikes/001-websocket-streaming/main.py", "...")
terminal("cd spikes/001-websocket-streaming && python3 main.py")
# 观察输出，迭代。
```

**并行比较尖峰 (002a / 002b) — 分配任务。** 当两种方法可以并行运行且都需要真正的工程投入（而不是 10 行的原型）时，使用 `delegate_task` 进行分派：

```
delegate_task(tasks=[
    {"goal": "Build 002a-pdf-parse-pdfjs: ...", "toolsets": ["terminal", "file", "web"]},
    {"goal": "Build 002b-pdf-parse-camelot: ...", "toolsets": ["terminal", "file", "web"]},
])
```

每个子智能体都返回自己的裁决；你负责撰写对比总结。

### 5. Verdict (裁决)

每个尖峰的 `README.md` 都应包含：

```markdown
## Verdict: VALIDATED | PARTIAL | INVALIDATED

### What worked (哪些部分成功了)
- ...

### What didn't (哪些部分失败了)
- ...

### Surprises (意外发现)
- ...

### Recommendation for the real build (对实际构建的建议)
- ...
```

**VALIDATED (已验证)** = 核心问题以证据的形式得到肯定回答。
**PARTIAL (部分成功)** = 在约束 X、Y、Z 下可以工作——请记录下来。
**INVALIDATED (已否定)** = 不可行，原因如下。这是一个成功的尖峰。

## Comparison spikes (比较尖峰)

当两种方法回答相同的问题（002a / 002b）时，应将它们**并排构建**，然后在最后进行逐项对比：

```markdown
## Head-to-head: pdfjs vs camelot (pdfjs 对比 camelot)

| Dimension | pdfjs (002a) | camelot (002b) |
|-----------|--------------|----------------|
| Extraction quality | 9/10 structured | 7/10 table-only |
| Setup complexity | npm install, 1 line | pip + ghostscript |
| Perf on 100-page PDF | 3s | 18s |
| Handles rotated text | no | yes |

**Winner:** pdfjs for our use case. Camelot if we need table-first extraction later. (对于我们的用例，pdfjs更胜一筹。如果以后我们需要先提取表格，则选择 Camelot。)
```

## Frontier mode (前沿模式 - 决定下一个尖峰的方向)

如果已经存在尖峰，而用户问“我接下来应该做哪个尖峰？”，请查看现有目录并寻找：

- **Integration risks (集成风险)** — 两个已验证的尖峰接触了同一资源但各自独立测试。
- **Data handoffs (数据交接)** — 假设尖峰 A 的输出与尖峰 B 的输入兼容；但从未被证明。
- **Gaps in the vision (愿景中的空白点)** — 已假设但尚未证实的某些能力。
- **Alternative approaches (替代方案)** — 对 PARTIAL 或 INVALIDATED 尖峰的不同角度探索。

提出 2-4 个候选方案，以 Given/When/Then 的形式呈现。让用户选择。

## Output (输出)

- 在仓库根目录创建 `spikes/`（如果用户使用 GSD 约定，则为 `.planning/spikes/`）。
- 每个尖峰一个目录：`NNN-descriptive-name/`。
- 每个尖峰的 `README.md` 都应包含问题、方法、结果和裁决。
- 保持代码的一次性使用——一个需要花费两天时间“清理以供生产”的尖峰就是一个糟糕的尖峰。

## Attribution (致谢)

改编自 GSD (Get Shit Done) 项目的 `/gsd-spike` 工作流程 — MIT © 2025 Lex Christopherson ([gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done))。完整的 GSD 系统提供了持久化的尖峰状态、MANIFEST 跟踪以及与更广泛的规范驱动开发流水线集成；使用 `npx get-shit-done-cc --hermes --global` 进行安装。