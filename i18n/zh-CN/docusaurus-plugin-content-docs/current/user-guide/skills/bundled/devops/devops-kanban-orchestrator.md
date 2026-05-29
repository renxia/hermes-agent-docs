---
title: "看板编排器"
sidebar_label: "看板编排器"
description: "分解剧本 + 反诱惑规则，用于编排器配置文件通过看板路由工作"
---

{/* 本页面由网站脚本 scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 看板编排器

分解剧本 + 反诱惑规则，用于编排器配置文件通过看板路由工作。“不要自己动手做工作”的规则和基本生命周期会自动注入到每个看板工人的系统提示中；当你专门扮演编排器角色时，此技能是更深层的剧本。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/devops/kanban-orchestrator` |
| 版本 | `3.0.0` |
| 平台 | linux, macos, windows |
| 标签 | `kanban`, `multi-agent`, `orchestration`, `routing` |
| 相关技能 | [`kanban-worker`](/docs/user-guide/skills/bundled/devops/devops-kanban-worker) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 看板编排器 — 分解策略手册

> **核心工作生命周期**（包括 `kanban_create` 的扇出模式和“分解任务，而非亲自动手执行”的规则）通过 `KANBAN_GUIDANCE` 系统提示块自动注入到每个看板流程中。当你的个人资料是专注于路由的编排器时，这份手册是更深入的策略指南。

## 个人资料由用户配置 — 不是固定的花名册

Hermes 的设置各不相同。有些用户运行一个处理所有事项的个人资料；有些运行一个小型集群（`docker-worker`， `cron-worker`）；有些运行他们自己命名的精选专家团队。**没有默认的专家花名册** — 编排器技能不知道这台机器上存在哪些个人资料。

在扇出之前，你必须将分解工作建立在实际存在的个人资料基础上。调度器对于未知的负责人名称会静默失败 — 它不会自动更正、不提供建议、不回退。因此，在一个只有 `docker-worker` 的设置上，分配给 `researcher` 的卡片将永远停留在 `ready` 状态。

**第 0 步：在规划前，先发现可用的个人资料。**

使用以下方法之一：

- `hermes profile list` — 打印此机器上配置的个人资料表格。如果你有终端工具，就用它运行；否则询问用户。
- `kanban_list(assignee="<某个名称>")` — 对单个名称进行合理性检查。对于未知负责人，它返回空列表（而不是错误），因此这只能确认你正在考虑的一个名称。
- **直接询问用户。** “您设置了哪些个人资料？”在需要多个专家时，这是一个很好的第一轮提问。

将结果缓存到你对话期间的工作记忆中。每轮都重新询问会浪费工具调用。

## 何时使用看板（而不是直接执行任务）

当满足以下任一条件时，创建看板任务：

1.  **需要多个专家。** 研究 + 分析 + 写作是三个个人资料。
2.  **工作需要在崩溃或重启后存活。** 长时间运行、重复或重要。
3.  **用户可能希望介入。** 在任何步骤进行人工干预。
4.  **多个子任务可以并行运行。** 扇出以提高速度。
5.  **预期进行审查/迭代。** 审查者个人资料对草稿者输出进行循环审查。
6.  **审计跟踪很重要。** 看板行在 SQLite 中永久保存。

如果*以上条件都不适用* — 这是一个一次性的小型推理任务 — 请改用 `delegate_task` 或直接回答用户。

## 反诱惑规则

你的职位描述是“路由，而非执行”。强制执行该规则的规则：

- **不要自己执行工作。** 你的受限工具集通常甚至不包括用于实现的终端/文件/代码/网络。如果你发现自己正在“快速处理这个” — 停下来，为合适的专家创建一个任务。
- **对于任何具体任务，创建一个看板任务并分配。** 每次都如此。
- **创建卡片前，先拆分多通道请求。** 一个用户提示可以包含几个独立的工作流。首先提取这些通道，然后为每个通道创建一张卡片，而不是将不相关的工作捆绑到一张执行者卡片中。
- **并行运行独立通道。** 如果两张卡片不需要彼此的输出，则不链接它们，以便调度器可以扇出它们。仅链接真正的数据依赖。
- **永远不要将具有依赖性的工作创建为独立的就绪卡片。** 如果一张卡片必须等待另一张卡片，请在原始 `kanban_create` 调用中传递 `parents=[...]`。不要先创建它再链接，也不要依赖正文中像“等待 T1”这样的文字。
- **如果没有专家适合可用的个人资料，请询问用户要创建哪个个人资料或使用哪个现有个人资料。** 不要虚构个人资料名称；调度器会静默丢弃未知负责人。
- **分解、路由、总结 — 这就是全部工作。**

## 分解策略手册

### 第 1 步 — 理解目标

如果目标不明确，请提出澄清问题。提问成本低；启动错误集群成本高。

### 第 2 步 — 构思任务图

在创建任何内容之前，先用文字草拟图表（在你给用户的回复中）。将每个具体的工作流视为一张候选卡片：

1.  从请求中提取各个通道。
2.  将每个通道映射到你在第 0 步中发现的个人资料之一。如果某个通道不适合任何现有个人资料，请询问用户使用或创建哪个。
3.  决定每个通道是独立的，还是受另一个通道限制。
4.  将独立通道创建为并行卡片，不带父链接。
5.  创建带有父链接（指向它们所依赖的通道）的综合/审查/集成卡片。父项未完成时创建的子项起始于 `todo`；调度器只有在每个父项都完成后才会将其提升为 `ready`。

应该扇出的提示示例（使用占位符个人资料名称 — 根据用户设置中存在的实际名称进行替换）：

- “构建一个应用程序” → 一张卡片给面向设计的个人资料以获取产品/用户界面方向，一张或两张卡片给工程个人资料以进行实现，加上一张后期的集成/审查卡片（如果用户有审查者个人资料）。
- “修复阻碍因素并检查模型变体” → 一张用于修复阻碍因素的实现卡片，加上一张用于配置/源代码验证的发现/研究卡片。最终的审查者卡片可以依赖两者。
- “研究文档并实现” → 文档研究卡片可以与代码库发现卡片并行运行；实现只在真正需要这些发现时才等待。
- “分析此截图并找到相关代码” → 一张卡片给具有视觉能力的个人资料进行视觉分析，同时另一张卡片搜索代码库。

像“此外”、“最后”或“并且”这样的词语并不自动意味着依赖性。它们通常意味着“在汇报前确保这部分已完成”。仅当一张卡片在另一张卡片的输出存在之前无法开始时，才链接任务。

在创建卡片之前，向用户展示图表。让他们纠正它 — 包括每个通道应由哪个实际的个人资料名称负责。

### 第 3 步 — 创建任务并链接

使用第 0 步中的个人资料名称。下面的示例使用占位符 `<profile-A>`、`<profile-B>`、`<profile-C>` — 请替换为用户实际拥有的名称。

```python
t1 = kanban_create(
    title="research: Postgres cost vs current",
    assignee="<profile-A>",  # whichever profile handles research on this setup
    body="Compare estimated infrastructure costs, migration costs, and ongoing ops costs over a 3-year window. Sources: AWS/GCP pricing, team time estimates, current Postgres bills from peers.",
    tenant=os.environ.get("HERMES_TENANT"),
)["task_id"]

t2 = kanban_create(
    title="research: Postgres performance vs current",
    assignee="<profile-A>",  # same profile, run in parallel
    body="Compare query latency, throughput, and scaling characteristics at our expected data volume (~500GB, 10k QPS peak). Sources: benchmark papers, public case studies, pgbench results if easy.",
)["task_id"]

t3 = kanban_create(
    title="synthesize migration recommendation",
    assignee="<profile-B>",  # whichever profile does synthesis/analysis
    body="Read the findings from T1 (cost) and T2 (performance). Produce a 1-page recommendation with explicit trade-offs and a go/no-go call.",
    parents=[t1, t2],
)["task_id"]

t4 = kanban_create(
    title="draft decision memo",
    assignee="<profile-C>",  # whichever profile drafts user-facing prose
    body="Turn the analyst's recommendation into a 2-page memo for the CTO. Match the tone of previous decision memos in the team's knowledge base.",
    parents=[t3],
)["task_id"]
```

`parents=[...]` 限制提升 — 子项停留在 `todo` 直到每个父项达到 `done`，然后自动提升为 `ready`。无需手动协调；调度器和依赖引擎会处理。

如果任务图存在依赖关系，请先创建父卡片，捕获其返回的 ID，并在子卡片的 `kanban_create` 调用期间将这些 ID 包含在子卡片的 `parents` 列表中。避免并行创建所有卡片并稍后链接它们；这会造成一个窗口期，调度器可能在其输入存在之前就认领子项。

### 第 4 步 — 完成你自己的任务

如果你本身是作为一个任务被生成的（例如，一个规划者个人资料被分配了 `T0: “调查 Postgres 迁移”`），请通过总结你创建的内容来标记它为完成：

```python
kanban_complete(
    summary="decomposed into T1-T4: 2 research lanes in parallel, 1 synthesis on their outputs, 1 prose draft on the recommendation",
    metadata={
        "task_graph": {
            "T1": {"assignee": "<profile-A>", "parents": []},
            "T2": {"assignee": "<profile-A>", "parents": []},
            "T3": {"assignee": "<profile-B>", "parents": ["T1", "T2"]},
            "T4": {"assignee": "<profile-C>", "parents": ["T3"]},
        },
    },
)
```

### 第 5 步 — 向用户汇报

用平实的文字告诉他们你创建了什么，命名你使用的实际个人资料：

> 我已排队 4 个任务：
> - **T1** (`<profile-A>`): 成本比较
> - **T2** (`<profile-A>`): 性能比较，与 T1 并行
> - **T3** (`<profile-B>`): 将 T1 + T2 综合成一份建议
> - **T4** (`<profile-C>`): 将 T3 转化为一份给首席技术官的备忘录
>
> 调度器现在会拾取 T1 和 T2。两者完成后 T3 开始。T4 完成时您会收到网关通知。使用仪表盘或 `hermes kanban tail <id>` 来跟踪进度。

---
title: Hermes 智能体系统指南
description: 关于如何在 Hermes 中使用和构建智能体的详细指南
slug: agents-guide
---

# 智能体工作流指南

这份指南解释了在 Hermes 中管理智能体、任务和工作流的关键概念。

## 核心模式

**扇出 + 扇入 (研究 → 综合)：** N 个无父任务的研究型卡片，一张综合卡片将它们全部作为父任务。

**并行实现 + 验证：** 一个实现者卡片进行更改，同时一个探索者/研究者卡片验证配置、文档或源代码映射。审查者卡片可以依赖两者。不要因为用户在同一句话中提到了两者，就让实现者负责不相关的验证。

**带关卡的流水线：** `规划者 → 实现者 → 审查者`。每个阶段的 `parents=[previous_task]`。审查者会阻塞或完成；如果审查者阻塞，操作员会提供反馈并重新生成任务以解除阻塞。

**同配置文件队列：** N 个任务，全部分配给同一个配置文件，它们之间没有依赖关系。调度器会进行序列化处理——该配置文件会按优先级顺序处理它们，并在自己的记忆中积累经验。

**人在回路：** 任何任务都可以调用 `kanban_block()` 以等待输入。调度器在 `/unblock` 后会重新生成任务。评论线程承载了完整的上下文。

## 常见陷阱

**使用不存在的配置文件名。** 调度器在生成未知的受让人时会静默失败——卡片将永远停留在 `ready` 状态。请始终将任务分配给你在第 0 步发现的配置文件；如果不确定，请询问用户。

**将独立的任务通道捆绑到一张卡片中。** 如果用户要求两个独立的成果，请创建两张卡片。例如：“修复阻塞问题并检查模型变体”不是一个修复任务；应为修复创建一个修复/工程师卡片，为变体检查创建一个探索/研究者卡片，然后可选择性地将审查与两者关联。

**因措辞而过度关联。** “最后检查 X”可能仍然与实现并行，如果 X 是静态配置、文档或源代码发现。仅当检查依赖于实现结果时，才在实现后链接它。

**忘记依赖链接。** 如果任务图是 `研究 → 实现 → 审查`，不要将所有任务创建为独立的就绪卡片。使用父链接，以便实现/审查在其输入存在之前无法运行。

**重新分配 vs. 新任务。** 如果审查者以“需要更改”而阻塞，请创建一个与审查者任务链接的**新任务**——不要用严厉的表情重新运行同一个任务。新任务分配给原始的实现者配置文件。

**链接的参数顺序。** `kanban_link(parent_id=..., child_id=...)` — 父任务在前。弄混它们会将错误的任务降级为 `todo`。

**如果形状取决于中间发现，不要预先创建整个图。** 如果 T3 的结构取决于 T1 和 T2 的发现，让 T3 作为一个“综合发现”任务存在，其第一步是读取父任务的交接内容并计划其余部分。编排器可以生成编排器。

**租户继承。** 如果你的环境中设置了 `HERMES_TENANT`，请在每次 `kanban_create` 调用时传递 `tenant=os.environ.get("HERMES_TENANT")`，以便子任务保持在相同的命名空间中。

## 恢复卡住的工作者

当工作者配置文件持续崩溃、产生幻觉或被自己的错误阻塞时（通常是：错误的模型、缺失的技能、损坏的凭证），看板仪表盘会用一个 ⚠ 徽章标记该任务，并在抽屉中打开一个 **恢复** 部分。主要有三个操作：

1.  **回收** (或 `hermes kanban reclaim <task_id>`) — 立即中止正在运行的工作者，并将任务重置为 `ready`。现有的声明 TTL 约为 15 分钟；这是快速退出的路径。
2.  **重新分配** (或 `hermes kanban reassign <task_id> <new-profile> --reclaim`) — 将任务切换到另一个配置文件（在本设置中存在的配置文件），并让调度器用一个全新的工作者来拾取它。
3.  **更改配置文件模型** — 仪表盘会为 `hermes -p <profile> model` 打印一个复制粘贴的提示，因为配置文件配置存储在磁盘上；在终端中编辑它，然后使用新模型进行回收以重试。

幻觉警告出现在以下任务上：工作者的 `kanban_complete(created_cards=[...])` 声明中包含不存在或不是由该工作者配置文件创建的卡片 ID（关卡会阻止完成），或者自由形式的摘要引用了无法解析的 `t_<hex>` ID（咨询性文本扫描，非阻塞）。两者都会产生审计事件，即使在恢复操作之后也会持续存在——调试线索会保留下来。