# 看板教程

这是在浏览器中打开仪表板的情况下，对 Hermes 看板系统设计的四个使用场景的逐步讲解。如果你还没有阅读[看板概述](./kanban)，请先阅读——本教程假设你了解任务（task）、运行（run）、负责人（assignee）和调度器（dispatcher）的概念。

## 设置

```bash
hermes kanban init           # 可选；首次运行 `hermes kanban <anything>` 时会自动初始化
hermes dashboard             # 在浏览器中打开 http://127.0.0.1:9119
# 点击左侧导航栏中的 Kanban
```

仪表板是**你**观察系统最舒适的地方。调度器派生的智能体工作者永远不会看到仪表板或 CLI——它们通过专用的 `kanban_*` [工具集](./kanban#how-workers-interact-with-the-board)（`kanban_show`、`kanban_list`、`kanban_complete`、`kanban_block`、`kanban_heartbeat`、`kanban_comment`、`kanban_create`、`kanban_link`、`kanban_unblock`）来驱动看板。所有三个界面——仪表板、CLI、工作者工具——都通过同一个基于每个看板的 SQLite 数据库进行路由（默认看板为 `~/.hermes/kanban.db`，后续创建的任何看板为 `~/.hermes/kanban/boards/<slug>/kanban.db`），因此无论从哪一侧发起变更，每个看板的数据都是一致的。

本教程全程使用 `default` 看板。如果你需要多个隔离的队列（每个项目/代码库/领域一个），请参阅概述中的[看板（多项目）](./kanban#boards-multi-project)——每个看板适用相同的 CLI/仪表板/工作者流程，且工作者在物理上无法看到其他看板上的任务。

在本教程中，**标记为 `bash` 的代码块是*你*运行的命令。** 标记为 `# worker tool calls` 的代码块是派生的工作者模型发出的工具调用——在此展示是为了让你看到完整的端到端循环，而不是因为你需要自己运行它们。

## 看板概览

![看板概览](/img/kanban-tutorial/01-board-overview.png)

六列，从左到右：

- **分类（Triage）** — 原始想法。默认情况下，调度器会在此列的任务上自动运行**分解器**：内置分解器使用 `auxiliary.kanban_decomposer`，读取你的配置文件名册和描述，生成子任务图并路由到最合适的专业智能体。原始任务作为父任务保持存活，因此当所有子任务完成时，其负责人（`kanban.orchestrator_profile`，未设置时为当前默认配置文件）会重新激活以判断是否完成。点击看板页面顶部的**编排：自动/手动**药丸标签可切换模式。在手动模式下，点击卡片上的**⚗ 分解**，或运行 `hermes kanban decompose <id>` / `/kanban decompose <id>`。对于不需要展开的单个任务，**✨ 明确化**会一次性重写规格（目标、方法、验收标准）并提升到 `todo`。在 `config.yaml` 的 `auxiliary.kanban_decomposer` 和 `auxiliary.triage_specifier` 下配置模型。参见主看板指南中的[自动 vs 手动编排](./kanban#auto-vs-manual-orchestration)。
- **待办（Todo）** — 已创建但依赖未满足，或尚未分配。
- **就绪（Ready）** — 已分配，等待调度器认领。
- **进行中（In progress）** — 一个工作智能体正在积极执行任务。开启"按配置文件分区"（默认）时，此列按负责人子分组，便于你一目了然地看到每个工作智能体在做什么。
- **已阻塞（Blocked）** — 工作智能体请求人工输入，或断路器跳闸。
- **已完成（Done）** — 已完成。

顶部栏有搜索、租户和负责人的筛选器，以及一个`按配置文件分区`开关和一个`推动调度器`按钮，可立即执行一次调度周期，无需等待守护进程的下一个间隔。点击任意卡片会在右侧打开其抽屉。

### 平铺视图

如果配置文件分区显得杂乱，关闭"按配置文件分区"，进行中列将折叠为按认领时间排序的单一平铺列表：

![关闭按配置文件分区的看板](/img/kanban-tutorial/02-board-flat.png)

## 故事 1 — 独立开发者交付一个功能

你正在构建一个功能。经典流程：设计模式、实现 API、编写测试。三个任务，具有父→子依赖关系。

```bash
SCHEMA=$(hermes kanban create "Design auth schema" \
    --assignee backend-dev --tenant auth-project --priority 2 \
    --body "Design the user/session/token schema for the auth module." \
    --json | jq -r .id)

API=$(hermes kanban create "Implement auth API endpoints" \
    --assignee backend-dev --tenant auth-project --priority 2 \
    --parent $SCHEMA \
    --body "POST /register, POST /login, POST /refresh, POST /logout." \
    --json | jq -r .id)

hermes kanban create "Write auth integration tests" \
    --assignee qa-dev --tenant auth-project --priority 2 \
    --parent $API \
    --body "Cover happy path, wrong password, expired token, concurrent refresh."
```

因为 `API` 以 `SCHEMA` 为父任务，`tests` 以 `API` 为父任务，所以只有 `SCHEMA` 从 `ready` 开始。另外两个停留在 `todo`，直到它们的父任务完成。这就是依赖提升引擎在起作用——在完成可供测试的 API 之前，不会有其他工作智能体接取编写测试的任务。

在下一个调度周期（默认 60 秒，或如果你点击**推动调度器**则立即）时，`backend-dev` 配置文件作为工作智能体启动，其环境变量为 `HERMES_KANBAN_TASK=$SCHEMA`。以下是智能体内部工作智能体的工具调用循环：

```python
# 工作智能体的工具调用 — 不是你要执行的命令
kanban_show()
# → 返回标题、正文、worker_context、父任务、之前的尝试、评论

# （工作智能体读取 worker_context，使用终端/文件工具设计模式，
#  编写迁移、运行自己的检查、提交 — 实际工作在此进行）

kanban_heartbeat(note="schema drafted, writing migrations now")

kanban_complete(
    summary="users(id, email, pw_hash), sessions(id, user_id, jti, expires_at); "
            "refresh tokens stored as sessions with type='refresh'",
    metadata={
        "changed_files": ["migrations/001_users.sql", "migrations/002_sessions.sql"],
        "decisions": ["bcrypt for hashing", "JWT for session tokens",
                      "7-day refresh, 15-min access"],
    },
)
```

`kanban_show` 默认将 `task_id` 设为 `$HERMES_KANBAN_TASK`，因此工作智能体无需知道自己的 id。`kanban_complete` 将摘要 + 元数据写入当前 `task_runs` 行，关闭该次运行，并将任务转换为 `done` — 全部通过 `kanban_db` 一次原子跳转完成。

当 `SCHEMA` 变为 `done` 时，依赖引擎自动将 `API` 提升到 `ready`。API 工作智能体接取任务后，会调用 `kanban_show()` 并看到 `SCHEMA` 的摘要和元数据附加在父任务交接中——因此它了解模式决策，无需重新阅读冗长的设计文档。

在看板上点击已完成的模式任务，抽屉会展示所有内容：

![独立开发者 — 已完成的模式任务抽屉](/img/kanban-tutorial/03-drawer-schema-task.png)

底部的运行历史部分是关键新增内容。一次尝试：结果为 `completed`，工作智能体 `@backend-dev`，持续时间、时间戳，以及完整的交接摘要。元数据块（`changed_files`、`decisions`）也存储在该运行记录中，并展示给任何读取此父任务的下游工作智能体。

你可以随时从终端查看相同数据——这些命令是**你**在看板上窥探，而不是工作智能体：

```bash
hermes kanban show $SCHEMA
hermes kanban runs $SCHEMA
# #  OUTCOME       PROFILE       ELAPSED  STARTED
# 1  completed     backend-dev        0s  2026-04-27 19:34
#     → users(id, email, pw_hash), sessions(id, user_id, jti, expires_at); refresh tokens ...
```

## 故事 2 — 多智能体批量处理

你有三个工作智能体（一个翻译员、一个转录员、一个文案撰写人）和一堆独立任务。你希望三者并行工作并取得可见进展。这是最简单的看板用例，也是最初设计所优化的场景。

创建工作：

```bash
for lang in Spanish French German; do
    hermes kanban create "Translate homepage to $lang" \
        --assignee translator --tenant content-ops
done
for i in 1 2 3 4 5; do
    hermes kanban create "Transcribe Q3 customer call #$i" \
        --assignee transcriber --tenant content-ops
done
for sku in 1001 1002 1003 1004; do
    hermes kanban create "Generate product description: SKU-$sku" \
        --assignee copywriter --tenant content-ops
done
```

启动网关然后走开——它托管了内嵌的调度器，
在同一 kanban.db 上接取所有三个专业配置文件的任务：

```bash
hermes gateway start
```

现在将看板筛选到 `content-ops`（或直接搜索"Transcribe"），你会看到：

![筛选到转录任务的多智能体视图](/img/kanban-tutorial/07-fleet-transcribes.png)

两个转录已完成，一个运行中，两个就绪等待下一个调度周期。进行中列按配置文件分组（"按配置文件分区"默认值），因此你可以看到每个工作智能体的活跃任务，无需扫描混合列表。当前一个完成后，调度器会立即将下一个就绪任务提升到运行中。三个守护进程并行处理三个负责人池，整个内容队列无需进一步人工输入即可排空。

**故事 1 中关于结构化交接的所有内容在此仍然适用。** 完成通话的翻译工作智能体会发出 `kanban_complete(summary="translated 4 pages, style matched existing marketing voice", metadata={"duration_seconds": 720, "tokens_used": 2100})` — 对分析和任何依赖此任务的下游任务很有用。

## 故事 3 — 带重试的角色流水线

这是看板相比扁平 TODO 列表真正发挥价值的地方。产品经理写规格。工程师实现。审核员拒绝第一次尝试。工程师带修改重试。审核员批准。

仪表板视图，按 `auth-project` 筛选：

![多角色功能的流水线视图](/img/kanban-tutorial/08-pipeline-auth.png)

三阶段链一目了然：`Spec: password reset flow`（已完成，pm）、`Implement password reset flow`（已完成，backend-dev）、`Review password reset PR`（就绪，reviewer）。每个任务底部绿色显示父任务，子任务显示为依赖。

有趣的是实现任务，因为它被阻塞并重试了。以下是完整的三个智能体协作过程，展示为每个工作智能体的模型所调用的工具：

```python
# --- PM 工作智能体在 $SPEC 上启动并编写验收标准 ---
# 工作智能体工具调用
kanban_show()
kanban_complete(
    summary="spec approved; POST /forgot-password sends email, "
            "GET /reset/:token renders form, POST /reset applies new password",
    metadata={"acceptance": [
        "expired token returns 410",
        "reused last-3 password returns 400 with message",
        "successful reset invalidates all active sessions",
    ]},
)
# → $SPEC 完成；$IMPL 自动从 todo 提升到 ready

# --- 工程师工作智能体在 $IMPL 上启动（第一次尝试） ---
# 工作智能体工具调用
kanban_show()   # 在 worker_context 中读取 $SPEC 的摘要 + 验收元数据
# （工程师编写代码、运行测试、提交 PR）
# 收到审核反馈 — 工程师判断意见合理并阻塞
kanban_block(
    reason="Review: password strength check missing, reset link isn't "
           "single-use (can be replayed within 30min)",
)
# → $IMPL 转换为 blocked；run 1 以 outcome='blocked' 关闭
```

现在你（人类，或独立的审核配置文件）阅读阻塞原因，判断修复方向明确，然后从仪表板的"解除阻塞"按钮解除阻塞——或通过 CLI / 斜杠命令：

```bash
hermes kanban unblock $IMPL
# 或在聊天中：/kanban unblock $IMPL
```

调度器将 `$IMPL` 恢复到 `ready`，并在下一个周期重新生成 `backend-dev` 工作智能体。这次第二次生成是同一任务上的**新运行**：

```python
# --- 工程师工作智能体在 $IMPL 上启动（第二次尝试） ---
# 工作智能体工具调用
kanban_show()
# → worker_context 现在包含运行 1 的阻塞原因，因此该工作智能体知道
#   要修复哪两件事，而不是重新阅读整个规格
# （工程师添加 zxcvbn 检查、将重置令牌改为一次性、重新运行测试）
kanban_complete(
    summary="added zxcvbn strength check, reset tokens are now single-use "
            "(stored + deleted on success)",
    metadata={
        "changed_files": [
            "auth/reset.py",
            "auth/tests/test_reset.py",
            "migrations/003_single_use_reset_tokens.sql",
        ],
        "tests_run": 11,
        "review_iteration": 2,
    },
)
```

点击实现任务。抽屉显示**两次尝试**：

![有两次运行的实现任务 — 先阻塞后完成](/img/kanban-tutorial/04b-drawer-retry-history-scrolled.png)

- **运行 1** — 被 `@backend-dev` `阻塞`。审核反馈就在结果下方："password strength check missing, reset link isn't single-use (can be replayed within 30min)"。
- **运行 2** — 被 `@backend-dev` `完成`。新的摘要，新的元数据。

每次运行是 `task_runs` 表中的一行，拥有自己的结果、摘要和元数据。重试历史不是叠加在"最新状态"任务之上的概念性补充——它是主要表示形式。当重试的工作智能体打开任务时，`build_worker_context` 向它展示之前的尝试，因此第二轮的工作智能体看到第一轮被阻塞的原因并针对这些具体发现进行处理，而不是从头重新运行。

审核员接下来接取。当他们打开 `Review password reset PR` 时，他们会看到：

![审核员的流水线抽屉视图](/img/kanban-tutorial/09-drawer-pipeline-review.png)

父任务链接是已完成的实现。当审核员的工作智能体在 `Review password reset PR` 上启动并调用 `kanban_show()` 时，返回的 `worker_context` 包含父任务最近一次完成运行的摘要 + 元数据——因此审核员在查看差异之前先读到"added zxcvbn strength check, reset tokens are now single-use"，并已掌握变更文件列表。

## 故事 4 — 熔断器与崩溃恢复

真实的劳动者会失败。凭证缺失、OOM 杀死进程、短暂的网络错误。调度器有两道防线：一个是**熔断器**，在连续失败 N 次后自动阻止，防止看板永远颠簸；另一个是**崩溃检测**，回收那些在 TTL 过期前 worker 进程 PID 已经消失的任务。

### 熔断器 — 看起来是永久性的失败

一个部署任务无法启动其 worker，因为 profile 环境中未设置 `AWS_ACCESS_KEY_ID`：

```bash
hermes kanban create "Deploy to staging (missing creds)" \
    --assignee deploy-bot --tenant ops \
    --max-retries 3
```

调度器尝试启动 worker。启动失败（`RuntimeError: AWS_ACCESS_KEY_ID not set`）。调度器释放认领，增加失败计数器，并在下一轮重试。因为此示例设置了 `--max-retries 3`，熔断器在连续失败三次后触发：任务变为 `blocked`，结果为 `gave_up`。如果省略该标志，Hermes 使用 `kanban.failure_limit`（默认值：2）。在人工解除阻止之前，不会再有重试。

点击被阻止的任务：

![熔断器 — 2 spawn_failed + 1 gave_up](/img/kanban-tutorial/11-drawer-gave-up.png)

三次运行，`error` 字段上都是相同的错误。前两次是 `spawn_failed`（可重试），第三次是 `gave_up`（终态）。上方的事件日志显示了完整序列：`created → claimed → spawn_failed → claimed → spawn_failed → claimed → gave_up`。

在终端中：

```bash
hermes kanban runs t_ef5d
# #   OUTCOME        PROFILE        ELAPSED  STARTED
# 1   spawn_failed   deploy-bot          0s  2026-04-27 19:34
#       ! AWS_ACCESS_KEY_ID not set in deploy-bot env
# 2   spawn_failed   deploy-bot          0s  2026-04-27 19:34
#       ! AWS_ACCESS_KEY_ID not set in deploy-bot env
# 3   gave_up        deploy-bot          0s  2026-04-27 19:34
#       ! AWS_ACCESS_KEY_ID not set in deploy-bot env
```

如果已配置 Telegram / Discord / Slack，会在 `gave_up` 事件时触发网关通知，让你无需查看看板就能得知故障。

### 崩溃恢复 — worker 在运行中死亡

有时启动成功了，但 worker 进程后来崩溃了——段错误、OOM、`systemctl stop`。调度器轮询 `kill(pid, 0)` 并检测到已死亡的 PID；认领被释放，任务回到 `ready` 状态，下一轮会将其分配给新的 worker。

种子数据中的示例是一个内存不足的迁移任务：

```bash
# Worker 认领，开始扫描 240 万行，在约 230 万行时被 OOM 杀死
# 调度器检测到已死亡的 PID，释放认领，增加尝试计数器
# 使用分块策略重试成功
```

抽屉显示了完整的两次尝试历史：

![崩溃与恢复 — 1 crashed + 1 completed](/img/kanban-tutorial/06-drawer-crash-recovery.png)

运行 1——`crashed`，错误信息为 `OOM kill at row 2.3M (process 99999 gone)`。运行 2——`completed`，元数据中包含 `"strategy": "chunked with LIMIT + WHERE id > last_id"`。重试的 worker 在其上下文中看到了运行 1 的崩溃，并选择了更安全的策略；元数据让未来的观察者（或事后分析编写者）能清楚地看到发生了什么变化。

## 结构化交接 — 为什么 `summary` 和 `metadata` 很重要

在上述每个故事中，worker 在结束时调用了 `kanban_complete(summary=..., metadata=...)`。这不是装饰——它是工作流各阶段之间的主要交接通道。

当任务 B 上的 worker 被启动并调用 `kanban_show()` 时，返回的 `worker_context` 包括：

- B 的**先前尝试**（之前的运行：结果、摘要、错误、元数据），这样重试的 worker 不会重复失败的路径。
- **父任务结果**——对于每个父任务，最近一次完成的运行的摘要和元数据——这样下游 worker 能看到上游工作完成的原因和方式。

这取代了困扰扁平看板系统的"翻阅评论和工作输出"的折腾。项目经理在规格的元数据中编写验收标准，工程师的 worker 在父任务交接中结构化地看到它们。工程师记录他们运行了哪些测试以及通过了多少，审核者的 worker 在打开 diff 之前就已经拿到了这份列表。

批量关闭保护存在是因为这些数据是按运行计算的。`hermes kanban complete a b c --summary X`（你从 CLI 执行）会被拒绝——将相同的摘要复制粘贴到三个任务上几乎总是错误的。不带交接标志的批量关闭仍然适用于常见的"我完成了一堆管理任务"场景。工具界面根本不暴露批量变体；`kanban_complete` 始终是单任务操作，原因相同。

## 检查正在运行的任务

为了完整起见——这是一个仍在运行中的任务的抽屉（来自故事 1 的 API 实现，由 `backend-dev` 认领但尚未完成）：

![已认领、运行中的任务](/img/kanban-tutorial/10-drawer-in-flight.png)

状态为 `Running`。活动运行出现在运行历史部分，结果为 `active`，没有 `ended_at`。如果这个 worker 死亡或超时，调度器会以适当的结果关闭此运行，并在下次认领时打开新的运行——尝试行永远不会消失。

## 下一步

- [看板概述](./kanban) — 完整的数据模型、事件词汇表和 CLI 参考。
- `hermes kanban --help` — 每个子命令，每个标志。
- `hermes kanban watch --kinds completed,gave_up,timed_out` — 整个看板上终端事件的实时流。
- `hermes kanban notify-subscribe <task> --platform telegram --chat-id <id>` — 特定任务完成时获取网关通知。