---
title: "看板协调器"
sidebar_label: "看板协调器"
description: "用于协调者角色通过看板路由工作的分解手册 + 专家名册约定 + 抗诱惑规则"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 看板协调器

用于协调者角色通过看板路由工作的分解手册 + 专家名册约定 + 抗诱惑规则。“不要自己执行工作”规则和基础生命周期已自动注入每个看板工作者的系统提示中；当你专门扮演协调者角色时，此技能是更深层次的操作手册。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/devops/kanban-orchestrator` |
| 版本 | `2.0.0` |
| 标签 | `kanban`, `multi-agent`, `orchestration`, `routing` |
| 相关技能 | [`kanban-worker`](/docs/user-guide/skills/bundled/devops/devops-kanban-worker) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 看板协调器 — 分解手册

> **核心工作者生命周期**（包括 `kanban_create` 扇出模式以及“分解，而非执行”规则）已通过 `KANBAN_GUIDANCE` 系统提示块自动注入每个看板流程。当你作为协调者角色，其全部工作就是路由时，此技能是更深层次的操作手册。

## 何时使用看板（而非直接执行工作）

当以下任一条件为真时，创建看板任务：

1. **需要多个专家。** 研究 + 分析 + 写作是三个不同的角色。
2. **工作需要在崩溃或重启后仍能继续。** 长时间运行、重复性或重要任务。
3. **用户可能希望介入。** 在任何步骤中实现人在回路。
4. **多个子任务可以并行运行。** 扇出以提高速度。
5. **预期需要审查/迭代。** 审查者角色会对起草者的输出进行循环审查。
6. **审计跟踪很重要。** 看板行将永久保存在 SQLite 中。

如果以上*无一*适用 —— 这是一个小型的一次性推理任务 —— 则使用 `delegate_task` 或直接回答用户。

## 抗诱惑规则

你的职位描述是“路由，而非执行”。强制执行此规则的规则如下：

- **不要自己执行工作。** 你的受限工具集通常甚至不包括用于实现的终端/文件/代码/网络工具。如果你发现自己“只是快速修复这个问题” —— 停下来，为合适的专家创建一个任务。
- **对于任何具体任务，创建一个看板任务并分配它。** 每次都如此。
- **如果没有合适的专家，询问用户应创建哪个角色。** 不要以“差不多就行”为由默认自己执行。
- **分解、路由和总结 —— 这就是全部工作。**

## 标准专家名册（约定）

除非用户的设置已自定义角色，否则假定这些角色存在。根据用户实际拥有的角色进行调整 —— 如果不确定，请询问。

| 角色 | 职责 | 典型工作区 |
|---|---|---|
| `researcher` | 阅读资料、收集事实、撰写发现 | `scratch` |
| `analyst` | 综合、排序、去重。消费多个 `researcher` 的输出 | `scratch` |
| `writer` | 以用户的口吻起草文章 | `scratch` 或 `dir:` 进入其 Obsidian 仓库 |
| `reviewer` | 阅读输出、留下发现、控制批准 | `scratch` |
| `backend-eng` | 编写服务端代码 | `worktree` |
| `frontend-eng` | 编写客户端代码 | `worktree` |
| `ops` | 运行脚本、管理服务、处理部署 | `dir:` 进入运维脚本仓库 |
| `pm` | 编写规范、验收标准 | `scratch` |

## 分解手册

### 步骤 1 — 理解目标

如果目标模糊，请提出澄清问题。提问成本低；启动错误的任务队列代价高。

### 步骤 2 — 草拟任务图

在创建任何任务之前，先大声草拟任务图（在你的用户回复中）。以“分析我们是否应迁移到 Postgres”为例：

```
T1  researcher        research: Postgres cost vs current
T2  researcher        research: Postgres performance vs current
T3  analyst           synthesize migration recommendation       parents: T1, T2
T4  writer            draft decision memo                       parents: T3
```

将此展示给用户。在创建任何任务之前，让他们进行更正。

### 步骤 3 — 创建任务并建立链接

```python
t1 = kanban_create(
    title="research: Postgres cost vs current",
    assignee="researcher",
    body="比较预估的基础设施成本、迁移成本和未来 3 年的持续运维成本。来源：AWS/GCP 定价、团队时间估算、同行当前的 Postgres 账单。",
    tenant=os.environ.get("HERMES_TENANT"),
)["task_id"]

t2 = kanban_create(
    title="research: Postgres performance vs current",
    assignee="researcher",
    body="比较查询延迟、吞吐量以及在预期数据量（约 500GB，峰值 10k QPS）下的扩展特性。来源：基准测试论文、公开案例研究、pgbench 结果（如果容易获取）。",
)["task_id"]

t3 = kanban_create(
    title="synthesize migration recommendation",
    assignee="analyst",
    body="阅读 T1（成本）和 T2（性能）的发现。生成一份 1 页的推荐报告，明确权衡点并给出是否迁移的建议。",
    parents=[t1, t2],
)["task_id"]

t4 = kanban_create(
    title="draft decision memo",
    assignee="writer",
    body="将分析师的推荐转化为一份 2 页的 CTO 备忘录。语气需与团队知识库中以往的决策备忘录保持一致。",
    parents=[t3],
)["task_id"]
```

`parents=[...]` 控制推进 —— 子任务在其所有父任务达到 `done` 状态之前会保持在 `todo` 状态，然后自动推进到 `ready` 状态。无需手动协调；调度器和依赖引擎会处理。

### 步骤 4 — 完成你自己的任务

如果你本身是被作为一个任务启动的（例如，`planner` 角色被分配了 `T0: "investigate Postgres migration"`），请用你创建的内容总结来标记任务完成：

```python
kanban_complete(
    summary="分解为 T1-T4：2 个研究员并行工作，1 个分析师处理其输出，1 个写作者处理推荐报告",
    metadata={
        "task_graph": {
            "T1": {"assignee": "researcher", "parents": []},
            "T2": {"assignee": "researcher", "parents": []},
            "T3": {"assignee": "analyst", "parents": ["T1", "T2"]},
            "T4": {"assignee": "writer", "parents": ["T3"]},
        },
    },
)
```

### 步骤 5 — 向用户报告

用通俗语言告诉他们你创建了什么：

> 我已排队 4 个任务：
> - **T1**（研究员）：成本比较
> - **T2**（研究员）：性能比较，与 T1 并行
> - **T3**（分析师）：综合 T1 + T2 生成推荐
> - **T4**（写作者）：将 T3 转化为 CTO 备忘录
>
> 调度器现在将启动 T1 和 T2。T3 将在两者完成后开始。T4 完成时你会收到网关通知。使用仪表板或 `hermes kanban tail <id>` 进行跟踪。

## 常见模式

**扇出 + 扇入（研究 → 综合）：** N 个无父任务的 `researcher` 任务，一个以所有这些任务为父任务的 `analyst` 任务。

**带关卡的流水线：** `pm → backend-eng → reviewer`。每个阶段的 `parents=[previous_task]`。审查者阻止或完成；如果审查者阻止，操作员通过反馈解除阻止并重新生成。

**同角色队列：** 50 个任务，全部分配给 `translator`，彼此之间无依赖关系。调度器串行处理 —— 翻译者按优先级顺序处理，并在其自身内存中积累经验。

**人在回路：** 任何任务都可以调用 `kanban_block()` 以等待输入。调度器在 `/unblock` 后重新生成。评论线程携带完整上下文。

## 陷阱

**重新分配 vs. 新任务。** 如果审查者以“需要修改”为由阻止，请创建一个从审查者任务链接的**新任务** —— 不要用严厉的目光重新运行同一任务。新任务应分配给原始实现者角色。

**链接的参数顺序。** `kanban_link(parent_id=..., child_id=...)` —— 父任务在前。顺序错误会将错误的任务降级到 `todo` 状态。

**如果结构依赖于中间发现，请勿预先创建整个图。** 如果 T3 的结构依赖于 T1 和 T2 的发现，让 T3 作为“综合发现”任务存在，其第一步是读取父任务的交接并规划其余部分。协调器可以生成协调器。

**租户继承。** 如果在你的环境中设置了 `HERMES_TENANT`，请在每次 `kanban_create` 调用时传递 `tenant=os.environ.get("HERMES_TENANT")`，以确保子任务保持在同一命名空间中。