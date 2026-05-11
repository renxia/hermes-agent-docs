# 看板工作者通道

**工作者通道**是看板调度器可将任务路由至的一类进程。每个通道拥有一个身份标识（负责人字符串）、一种生成机制，以及一份规定其生成后必须如何处理任务的契约。

本页面即该契约。它面向两类读者：

- **运维人员**：选择将哪些通道接入看板（创建哪些配置文件、使用哪些负责人）。
- **插件/集成开发者**：希望添加新的通道形态（封装 Codex / Claude Code / OpenCode 的 CLI 工作进程、容器化审查进程、通过 API 拉取任务的非 Hermes 服务）。

若您正在编写工作者代码本身——即运行在通道*内部*的智能体——[`kanban-worker`](https://github.com/NousResearch/hermes-agent/blob/main/skills/devops/kanban-worker/SKILL.md) 技能文档包含更详细的操作说明。

## 层级结构

```text
Hermes 看板   =  规范的任务生命周期 + 审计追踪
工作者通道   =  单张分配任务的执行器
审查者       =  人工或代理人工，负责"完成"状态的把关
GitHub PR    =  可向上游提交的制品（可选，针对代码通道）
```

Hermes 看板拥有生命周期的最终定义权——`就绪` → `运行中` → `阻塞` / `完成` / `归档`。工作者通道执行工作但不拥有该定义权；其所有操作均通过 `kanban_*` 工具（或对于非 Hermes 外部工作者，通过 API）流回看板内核。审查者负责把关从"代码变更已编写"到"任务已完成"的状态转换。

## 通道提供内容

要成为看板工作者通道，一个集成必须提供以下三项：

### 1. 受托人字符串

分发器将 `task.assignee` 与 Hermes 配置文件名称（默认通道形态）或已注册的非可生成标识符（插件通道形态——见[添加外部 CLI 工作者通道](#添加外部-cli-工作者通道)）进行匹配。受托人无法解析的任务将保留在 `ready` 状态并附带 `skipped_nonspawnable` 事件，以便看板操作员可以修正它们；它们不会被静默丢弃或由任意回退机制执行。

### 2. 生成机制

对于 Hermes 配置文件通道，分发器的 `_default_spawn` 会在任务的固定工作区内运行 `hermes -p <assignee> chat -q <prompt>`（或者当 `hermes` 垫片不在 `$PATH` 上时使用等效的模块形式），并设置以下环境变量：

| 变量 | 携带内容 |
|---|---|
| `HERMES_KANBAN_TASK` | 工作者正在操作的任务 ID |
| `HERMES_KANBAN_DB` | 每个看板对应的 SQLite 文件的绝对路径 |
| `HERMES_KANBAN_BOARD` | 看板标识符 |
| `HERMES_KANBAN_WORKSPACES_ROOT` | 看板工作区树的根目录 |
| `HERMES_KANBAN_WORKSPACE` | *此*任务工作区的绝对路径 |
| `HERMES_KANBAN_RUN_ID` | 当前运行的 ID（用于生命周期门控） |
| `HERMES_KANBAN_CLAIM_LOCK` | 认领锁字符串（`<host>:<pid>:<uuid>`） |
| `HERMES_PROFILE` | 工作者自身的配置文件名称（用于 `kanban_comment` 的作者归属） |
| `HERMES_TENANT` | 租户命名空间（如果任务有的话） |

对于非 Hermes 通道（通过插件注册），插件提供其自己的 `spawn_fn` 可调用对象，该对象接收 `task`、`workspace` 和 `board`，并返回一个可选的 PID 用于崩溃检测。

### 3. 生命周期终止器

每次认领必须恰好以下列方式之一结束：

- `kanban_complete(summary=..., metadata=...)` — 任务成功，状态翻转为 `done`。
- `kanban_block(reason=...)` — 任务等待人工输入，状态翻转为 `blocked`。当 `kanban_unblock` 运行时，分发器会重新生成。
- 工作者进程在未进行工具调用的情况下退出。内核回收它并发出 `crashed`（PID 死亡）或 `gave_up`（连续失败断路器触发）或 `timed_out`（超过最大运行时间）。这是失败路径；正常工作者不会在此结束。

看板内核强制规定每次运行都恰好以这些方式之一终止。一个既不调用这些函数又正常退出的工作者将被视为崩溃。

## 输出和审查必需约定

对于大多数更改代码的任务，工作在工作者完成时并未真正 *完成* — 它需要人工审查。看板内核不强制执行这种区分（“更改代码的任务”是模糊的，并且强制每个代码工作者都阻塞而不是完成会破坏不需要审查的工作流）。这是在其之上叠加的一个约定：

- **阻塞而不是完成**，`reason` 以 `review-required: ` 为前缀，这样仪表板 / `hermes kanban show` 会将该行显示为等待审查。
- **先在 `kanban_comment` 中放入结构化元数据**，因为 `kanban_block` 只携带人类可读的 `reason`。注释是持久的批注通道 — 每个审计相关字段（changed_files, tests_run, diff_path 或 PR url, decisions）都应放在那里。
- **审查者要么批准并解除阻塞**，这会重新生成工作者以处理评论线程中的后续事项；要么通过另一个评论要求更改，下一个工作者运行时会将此作为 `kanban_show` 上下文的一部分看到。

[`kanban-worker`](https://github.com/NousResearch/hermes-agent/blob/main/skills/devops/kanban-worker/SKILL.md) 技能提供了 `kanban_complete`（真正终结的任务 — 修复错别字、文档变更、研究报告撰写）和 `review-required` 阻塞模式的用例。

## 日志和审计追踪

分发器将每个任务工作者的 stdout/stderr 写入 `<board-root>/logs/<task_id>.log`。日志可从看板元数据中审计：

- `task_runs` 行携带 `log_path`、退出代码（如果可用）、摘要和元数据。
- `task_events` 行携带每个状态转换（`promoted`, `claimed`, `heartbeat`, `completed`, `blocked`, `gave_up`, `crashed`, `timed_out`, `reclaimed`, `claim_extended`）。
- `kanban_show` 返回这两者，因此审查者（或后续工作者）在读取任务时可以获得完整历史记录，无需访问仪表板。

仪表板使用摘要、元数据块和退出状态徽章呈现运行历史记录。CLI 用户可以运行 `hermes kanban tail <task_id>` 来实时跟踪，或运行 `hermes kanban runs <task_id>` 获取历史尝试列表。

## 现有通道形态

### Hermes 配置文件通道（默认）

这是今天每个看板工作者采用的形态：受托人是一个配置文件名称，分发器生成 `hermes -p <profile>`，工作者自动加载 [`kanban-worker`](https://github.com/NousResearch/hermes-agent/blob/main/skills/devops/kanban-worker/SKILL.md) 技能加上 `KANBAN_GUIDANCE` 系统提示块，并使用 `kanban_*` 工具来终止运行。除了定义配置文件外无需其他设置。

当你为你的集群创建配置文件时，选择与你希望编排器路由到的 *角色* 相匹配的名称。编排器（如果有的话）通过 `hermes profile list` 发现你的配置文件名称 — 系统不会假定固定的成员列表（参见 [`kanban-orchestrator`](https://github.com/NousResearch/hermes-agent/blob/main/skills/devops/kanban-orchestrator/SKILL.md) 技能了解编排器方面的契约）。

### 编排器配置文件通道

配置文件通道的一个特化：编排器是一个 Hermes 配置文件，其工具集包括 `kanban`，但不包括用于实现的 `terminal` / `file` / `code` / `web`。其工作是通过 `kanban_create` + `kanban_link` 将高层目标分解为子任务，然后退后一步。编排器技能编码了抵制诱惑的规则。

## 添加外部 CLI 工作者通道

将非 Hermes CLI 工具（Codex CLI、Claude Code CLI、OpenCode CLI、本地编码模型运行器等）接入作为看板工作者通道 *尚不是一条铺好的路*。分发器的生成函数是可插拔的（`spawn_fn` 是 `dispatch_once` 的一个参数），插件可以为非 Hermes 受托人注册自己的 `spawn_fn`，但周围的集成工作 — 将 CLI 的退出码包装成 `kanban_complete` / `kanban_block` 调用、将 CLI 的工作区/沙盒约定映射到分发器的 `HERMES_KANBAN_WORKSPACE` 环境变量、处理认证和每个 CLI 的策略 — 仍然是每项集成各自的设计工作。

如果你正在考虑添加一个 CLI 通道，请提交一个问题描述具体的 CLI 和你试图实现的工作流。上面的契约是任何此类通道必须满足的约束；实现形态（每个 CLI 一个插件 vs 一个由配置参数化的通用 CLI 运行器插件）是开放的。

相关的历史 issue 是 [#19931](https://github.com/NousResearch/hermes-agent/issues/19931) 和已关闭未合并的 Codex 特定 PR [#19924](https://github.com/NousResearch/hermes-agent/pull/19924) — 这些描述了最初的架构提案，但没有落地一个运行器。

## 分发器处理的失败模式

这样通道作者就不必重新实现这些：

- **过期认领 TTL** — 一个认领后既不心跳 / 完成 / 也不阻塞的工作者，会在 `DEFAULT_CLAIM_TTL_SECONDS`（默认 15 分钟）后被回收 — 但仅当工作者进程实际死亡时。一个活跃的工作者（慢速模型在一次无工具的 LLM 调用中花费 20 分钟以上）会得到认领 *延长* 而不是被杀死；只有死亡的 PID 会被回收。
- **崩溃的工作者** — 一个其主机本地 PID 已消失的工作者会被 `detect_crashed_workers` 检测到并被回收；该任务会增加 `consecutive_failures`，并且当断路器触发时可能会自动阻塞。
- **运行级别重试** — 当一个任务被重试（阻塞后、崩溃后、回收后）时，工作者可以在终止工具上使用 `expected_run_id` 参数，以便在其自己的运行已被取代时快速失败。
- **每个任务的最大运行时间** — `task.max_runtime_seconds` 硬性限制了每次运行的挂钟时间，无论 PID 是否活跃。可以捕获那些真正死锁、而活跃 PID 延长机制会一直让其运行的工作者。
- **滞留任务检测** — 一个就绪任务，其受托人在 `kanban.stranded_threshold_seconds`（默认 30 分钟）内从未产生认领，会作为 `stranded_in_ready` 警告出现在 `hermes kanban diagnostics` 中。严重性在阈值 2 倍时升级为错误，在 6 倍时升级为严重。用一个信号捕获了输入错误的受托人、已删除的配置文件和宕机的外部工作者池 — 与身份无关，无需维护每个看板的允许列表。

## 相关

- [看板概述](./kanban) — 面向用户的介绍。
- [看板教程](./kanban-tutorial) — 打开仪表板的演练。
- [`kanban-worker`](https://github.com/NousResearch/hermes-agent/blob/main/skills/devops/kanban-worker/SKILL.md) — 工作者进程加载的技能。
- [`kanban-orchestrator`](https://github.com/NousResearch/hermes-agent/blob/main/skills/devops/kanban-orchestrator/SKILL.md) — 编排器方面。