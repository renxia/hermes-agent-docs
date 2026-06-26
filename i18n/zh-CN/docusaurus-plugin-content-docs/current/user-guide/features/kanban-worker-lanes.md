# Kanban worker lanes

**worker lane** 是看板调度器可以将任务路由到的流程类别。每个 worker lane 都有一个身份标识（assignee 字符串）、一个派生机制，以及一个关于派生后必须对任务执行什么操作的契约。

本页即是该契约。它面向两类读者：

- **运维人员** 选择将哪些 lane 接入看板（创建哪些配置文件、使用哪些 assignee）。
- **插件 / 集成开发者** 希望添加新的 worker lane 形态（封装 Codex / Claude Code / OpenCode 的 CLI worker、容器化的审查 worker、通过 API 拉取任务的非 Hermes 服务）。

如果你编写的是 worker 代码本身——即运行在某个 lane *内部* 的智能体——则看板生命周期和参考细节会自动注入到 worker 的系统提示中（[`agent/prompt_builder.py`](https://github.com/NousResearch/hermes-agent/blob/main/agent/prompt_builder.py) 中的 `KANBAN_GUIDANCE` 块）。

## 层级关系

```text
Hermes 看板  =  规范的任务生命周期 + 审计追踪
Worker lane  =  一个已分配卡片的实现执行者
审查者       =  人工或人工代理，控制"完成"关卡
GitHub PR    =  可向上游提交的产物（可选，用于代码 lane）
```

Hermes 看板拥有生命周期真相——`ready` → `running` → `blocked` / `done` / `archived`。Worker lane 执行工作但从不拥有该真相；它们所做的一切都通过 `kanban_*` 工具（或对于非 Hermes 外部 worker，通过 API）回流到看板内核。审查者控制从"代码变更已写入"到"任务完成"的转换。

## 一个 lane 需要提供什么

要成为看板 worker lane，一个集成必须提供三样东西：

### 1. 一个 assignee 字符串

调度器将 `task.assignee` 与 Hermes 配置文件名称（默认 lane 形态）或已注册的不可派生标识符（插件 lane 形态——见下文[添加外部 CLI worker lane](#添加外部-cli-worker-lane)）进行匹配。assignee 无法解析的任务会留在 `ready` 状态并产生 `skipped_nonspawnable` 事件，以便看板运维人员修复；它们不会被静默丢弃或由任意回退机制执行。

### 2. 一个派生机制

对于 Hermes 配置文件 lane，调度器的 `_default_spawn` 会在任务的固定工作区内运行 `hermes -p <assignee> chat -q <prompt>`（当 `hermes` shim 不在 `$PATH` 中时使用等价的模块形式），并设置以下环境变量：

| 变量 | 携带内容 |
|---|---|
| `HERMES_KANBAN_TASK` | worker 正在操作的任务 ID |
| `HERMES_KANBAN_DB` | 每个看板的 SQLite 文件的绝对路径 |
| `HERMES_KANBAN_BOARD` | 看板 slug |
| `HERMES_KANBAN_WORKSPACES_ROOT` | 看板工作区树的根目录 |
| `HERMES_KANBAN_WORKSPACE` | *此*任务工作区的绝对路径 |
| `HERMES_KANBAN_RUN_ID` | 当前运行的 ID（用于生命周期门禁） |
| `HERMES_KANBAN_CLAIM_LOCK` | claim lock 字符串（`<host>:<pid>:<uuid>`） |
| `HERMES_PROFILE` | worker 自己的配置文件名称（用于 `kanban_comment` 作者归属） |
| `HERMES_TENANT` | 租户命名空间（如果任务有） |

对于非 Hermes lane（通过插件注册），插件提供自己的 `spawn_fn` 可调用对象，接收 `task`、`workspace` 和 `board` 参数，并返回一个可选的 pid 用于崩溃检测。

### 3. 一个生命周期终止器

每次 claim 必须以以下三种方式之一结束：

- `kanban_complete(summary=..., metadata=...)`——任务成功，状态翻转为 `done`。
- `kanban_block(reason=...)`——任务等待人工介入，状态翻转为 `blocked`。调度器在 `kanban_unblock` 运行时重新派生。
- Worker 进程在未调用任何工具的情况下退出。内核回收它并发出 `crashed`（PID 死亡）或 `gave_up`（连续失败断路器跳闸）或 `timed_out`（超出 max_runtime）。这是失败路径；健康的 worker 不会在此结束。

看板内核强制要求每次运行必须恰好以其中一种方式终止。既未调用任何工具又正常退出的 worker 被视为已崩溃。

## 输出与审查必需约定

对于大多数涉及代码变更的任务，worker 完成的瞬间工作并非真正*完成*——它需要人工审查者。看板内核不强制这一区分（"代码变更任务"是模糊的，强制每个代码 worker 走 block-instead-of-complete 会破坏不需要审查的流程）。这是一个叠加在上的约定：

- **Block 而非 complete**，`reason` 前缀为 `review-required: `，以便看板 / `hermes kanban show` 将该行显示为等待审查。
- **先将结构化元数据写入 `kanban_comment`**，因为 `kanban_block` 仅携带人类可读的 `reason`。注释是持久的标注通道——每个审计相关字段（changed_files、tests_run、diff_path 或 PR url、决策）都应放在那里。
- **审查者批准并解除阻止**，这将使用注释线程重新派生 worker 以进行后续跟进；或通过另一条评论请求变更，下一次 worker 运行会在 `kanban_show` 的上下文中看到。

注入的 `KANBAN_GUIDANCE` 涵盖了 `kanban_complete`（真正终止性的任务——拼写修正、文档变更、研究报告）和 `review-required` 阻止模式。

## 日志与审计追踪

调度器将每个任务的 worker stdout/stderr 写入 `<board-root>/logs/<task_id>.log`。日志可通过看板元数据审计：

- `task_runs` 行携带 `log_path`、退出码（如可用）、摘要和元数据。
- `task_events` 行携带每次状态转换（`promoted`、`claimed`、`heartbeat`、`completed`、`blocked`、`gave_up`、`crashed`、`timed_out`、`reclaimed`、`claim_extended`）。
- `kanban_show` 返回两者，因此审查者（或后续 worker）在读取任务时无需看板访问权限即可获得完整历史。

看板以摘要、元数据块和退出状态徽章呈现运行历史。CLI 用户可以运行 `hermes kanban tail <task_id>` 实时跟踪，或运行 `hermes kanban runs <task_id>` 查看历史尝试列表。

## 现有 lane 形态

### Hermes 配置文件 lane（默认）

当前每个看板 worker 采用的形态：assignee 是一个配置文件名称，调度器派生 `hermes -p <profile>`，worker 自动获得 `KANBAN_GUIDANCE` 系统提示块注入，并使用 `kanban_*` 工具终止运行。除定义配置文件外无需额外设置。

当你为你的智能体群创建配置文件时，请选择与你希望调度器路由到的*角色*相匹配的名称。编排器（当存在时）通过 `hermes profile list` 发现你的配置文件名称——系统不假设存在固定的名册（契约的编排器侧是注入的 `KANBAN_GUIDANCE` 的一部分）。

### 编排器配置文件 lane

配置文件 lane 的特化形式：编排器是一种 Hermes 配置文件，其工具集包含 `kanban` 但排除 `terminal` / `file` / `code` / `web` 以实现。其工作是通过 `kanban_create` + `kanban_link` 将高层目标分解为子任务，然后退后一步。编排器技能编码了反诱惑规则。

## 添加外部 CLI worker lane

将非 Hermes CLI 工具（Codex CLI、Claude Code CLI、OpenCode CLI、本地编码模型运行器等）接入为看板 worker lane *尚未成为铺砌路径*。调度器的派生函数是可插拔的（`spawn_fn` 是 `dispatch_once` 上的参数），插件可以为其非 Hermes assignee 注册自己的 `spawn_fn`，但周围的集成工作——将 CLI 的退出码封装为 `kanban_complete` / `kanban_block` 调用、将 CLI 的工作区/沙箱约定映射到调度器的 `HERMES_KANBAN_WORKSPACE` 环境、处理认证和每个 CLI 的策略——仍然是每个集成需要自行设计的工作。

如果你在考虑添加 CLI lane，请开一个 issue 描述你试图启用的具体 CLI 和工作流。上面的契约是任何此类 lane 必须满足的约束；实现形态（每个 CLI 一个插件 vs 通过配置参数化的通用 CLI-runner 插件）是开放的。

其历史 issue 是 [#19931](https://github.com/NousResearch/hermes-agent/issues/19931)，未合并的 Codex 专用 PR 是 [#19924](https://github.com/NousResearch/hermes-agent/pull/19924)——它们描述了原始架构提案但未落地 runner。

## 调度器处理的失败模式

以便 lane 作者无需重新实现这些：

- **过期 claim TTL**——已 claim 但始终不发送心跳 / 完成 / 阻止的 worker 在 `DEFAULT_CLAIM_TTL_SECONDS`（默认 15 分钟）后被回收——但前提是 worker 进程确实已死亡。存活的 worker（慢模型在无工具调用的 LLM 调用中花费 20+ 分钟）的 claim 会被*延长*而非终止；只有已死亡的 PID 才会被回收。
- **崩溃的 worker**——其主机本地 PID 已消失的 worker 由 `detect_crashed_workers` 检测并回收；任务递增 `consecutive_failures`，断路器跳闸时可能自动阻止。
- **运行级重试**——当任务被重试（阻止后、崩溃后、回收后），worker 可以在终止工具上使用 `expected_run_id` 参数，以便在其自身运行已被取代时快速失败。
- **每个任务的最大运行时间**——`task.max_runtime_seconds` 硬性限制每次运行的挂钟时间，无论 PID 是否存活。捕获那些存活 PID 延长机制会让其继续运行的真死锁 worker。
- **滞留任务检测**——assignee 在 `kanban.stranded_threshold_seconds`（默认 30 分钟）内始终未产生 claim 的 ready 任务会在 `hermes kanban diagnostics` 中以 `stranded_in_ready` 警告显示。严重性在 2 倍阈值时升级为 error，6 倍时升级为 critical。一次性捕获拼写错误的 assignee、已删除的配置文件和已宕机的外部 worker 池——与身份无关，无需每个看板维护允许列表。

## 相关

- [看板概览](./kanban)——面向用户的介绍。
- [看板教程](./kanban-tutorial)——打开看板界面的操作演练。
- [`KANBAN_GUIDANCE`](https://github.com/NousResearch/hermes-agent/blob/main/agent/prompt_builder.py)——注入到每个看板 worker 系统提示中的 worker + 编排器生命周期。