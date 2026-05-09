# 看板教程

本教程将带您了解 Hermes 看板系统设计的四种用例，同时浏览器中会打开仪表板。如果您尚未阅读[看板概述](./kanban)，请先阅读该文档——本教程假设您已经了解什么是任务、运行、负责人和调度器。

## 设置

```bash
hermes kanban init           # 可选；首次运行 `hermes kanban <任意命令>` 时会自动初始化
hermes dashboard             # 在浏览器中打开 http://127.0.0.1:9119
# 点击左侧导航栏中的“看板”
```

仪表板是**您**观察系统的最舒适场所。调度器生成的智能体工作进程永远看不到仪表板或命令行界面——它们通过专用的 `kanban_*` [工具集](./kanban#how-workers-interact-with-the-board)（`kanban_show`、`kanban_complete`、`kanban_block`、`kanban_heartbeat`、`kanban_comment`、`kanban_create`、`kanban_link`）来驱动看板。所有三个界面——仪表板、命令行界面、工作进程工具——都通过同一个每看板 SQLite 数据库（默认看板为 `~/.hermes/kanban.db`，您之后创建的任何看板为 `~/.hermes/kanban/boards/<slug>/kanban.db`）进行路由，因此无论更改来自哪一侧，每个看板都保持一致。

本教程始终使用 `default` 看板。如果您需要多个隔离的队列（每个项目/仓库/域一个），请参阅概述中的[看板（多项目）](./kanban#boards-multi-project)——每个看板都适用相同的命令行界面/仪表板/工作进程流程，且工作进程在物理上无法看到其他看板上的任务。

在本教程中，**标记为 `bash` 的代码块是*您*运行的命令。**标记为 `# worker tool calls` 的代码块是生成的工作进程模型发出的工具调用——此处展示以便您了解端到端的循环，而不是因为您需要自己运行它们。

## 看板一览

![看板概览](/img/kanban-tutorial/01-board-overview.png)

从左到右共六列：

- **待分类** — 原始想法，需由规范制定者完善规范后，其他人才能开始处理。点击任意待分类卡片上的 **✨ 制定规范** 按钮（或在聊天中运行 `hermes kanban specify <id>` / `/kanban specify <id>`），辅助大模型会将一行描述转化为完整规范（目标、方法、验收标准），并直接将其提升至 `待办` 状态。可在 `config.yaml` 中的 `auxiliary.triage_specifier` 下配置执行此操作的模型。
- **待办** — 已创建但依赖项未完成，或尚未分配。
- **就绪** — 已分配，等待调度器认领。
- **进行中** — 某位工作者正在积极执行任务。启用“按配置分组”（默认开启）时，此列会按被分配者分子组，以便一目了然地查看每位工作者正在做什么。
- **受阻** — 工作者请求人工输入，或触发了熔断机制。
- **已完成** — 任务已完成。

顶部工具栏包含搜索、租户和被分配者的筛选器，以及一个 `按配置分组` 切换开关和一个 `立即调度` 按钮。点击后者会立即执行一次调度，而无需等待守护进程的下一个周期。点击任意卡片会在右侧打开其详情抽屉。

### 扁平视图

如果按配置分组显得杂乱，可关闭“按配置分组”，此时“进行中”列会折叠为按认领时间排序的单一扁平列表：

![关闭按配置分组的看板](/img/kanban-tutorial/02-board-flat.png)

## 场景 1 — 单人开发者交付功能

你正在开发一个功能。典型流程：设计模式，实现 API，编写测试。三个任务存在父子依赖关系。

```bash
SCHEMA=$(hermes kanban create "设计认证模式" \
    --assignee backend-dev --tenant auth-project --priority 2 \
    --body "为认证模块设计用户/会话/令牌模式。" \
    --json | jq -r .id)

API=$(hermes kanban create "实现认证 API 端点" \
    --assignee backend-dev --tenant auth-project --priority 2 \
    --parent $SCHEMA \
    --body "POST /register, POST /login, POST /refresh, POST /logout。" \
    --json | jq -r .id)

hermes kanban create "编写认证集成测试" \
    --assignee qa-dev --tenant auth-project --priority 2 \
    --parent $API \
    --body "覆盖正常路径、密码错误、令牌过期、并发刷新等情况。"
```

由于 `API` 的父任务是 `SCHEMA`，而 `tests` 的父任务是 `API`，因此只有 `SCHEMA` 初始状态为 `就绪`。其余两个任务会停留在 `待办` 状态，直到其父任务完成。这是依赖项自动提升引擎在发挥作用 — 在有待测试的 API 之前，不会有其他工作者接手测试编写任务。

在下一个调度周期（默认为 60 秒，或点击 **立即调度** 后立即执行），`backend-dev` 配置会作为工作者启动，并在其环境中设置 `HERMES_KANBAN_TASK=$SCHEMA`。以下是智能体内部工作者工具调用循环的示例：

```python
# 工作者工具调用 — 非您运行的命令
kanban_show()
# → 返回标题、正文、工作者上下文、父任务、先前尝试、评论

# （工作者读取工作者上下文，使用终端/文件工具设计模式、
#  编写迁移脚本、运行自身检查、提交 — 实际工作在此处进行）

kanban_heartbeat(note="模式已起草，正在编写迁移脚本")

kanban_complete(
    summary="users(id, email, pw_hash), sessions(id, user_id, jti, expires_at)；"
            "刷新令牌作为 type='refresh' 的会话存储",
    metadata={
        "changed_files": ["migrations/001_users.sql", "migrations/002_sessions.sql"],
        "decisions": ["使用 bcrypt 进行哈希", "使用 JWT 作为会话令牌",
                      "7 天刷新，15 分钟访问"],
    },
)
```

`kanban_show` 默认将 `task_id` 设为 `$HERMES_KANBAN_TASK`，因此工作者无需知道自己的 ID。`kanban_complete` 会将摘要和元数据写入当前 `task_runs` 行，关闭该次运行，并将任务状态转换为 `已完成` — 所有操作通过 `kanban_db` 一次性原子完成。

当 `SCHEMA` 状态变为 `已完成` 时，依赖引擎会自动将 `API` 提升至 `就绪` 状态。API 工作者在接手时调用 `kanban_show()`，会看到父任务交接时附带的 `SCHEMA` 摘要和元数据 — 因此无需重读冗长的设计文档即可了解模式决策。

点击看板上的已完成模式任务，抽屉中会显示全部信息：

![单人开发者 — 已完成模式任务抽屉](/img/kanban-tutorial/03-drawer-schema-task.png)

底部的“运行历史”部分是关键新增功能。一次尝试：结果为 `已完成`，工作者为 `@backend-dev`，持续时间，时间戳，以及完整的交接摘要。元数据 blob（`changed_files`、`decisions`）也存储在运行记录中，并会展示给任何读取此父任务的下游工作者。

你也可以随时从终端检查相同数据 — 这些命令是 **你** 在看板中查看，而非工作者：

```bash
hermes kanban show $SCHEMA
hermes kanban runs $SCHEMA
# #  结果         配置          耗时     开始时间
# 1  已完成       backend-dev     0s  2026-04-27 19:34
#     → users(id, email, pw_hash), sessions(id, user_id, jti, expires_at)；刷新令牌 ...
```

## 场景 2 — 多智能体并行处理

你有三个工作者（翻译员、转录员、文案撰写员）和一堆独立任务。你希望三者并行处理并能看到明显进展。这是最简单的看板用例，也是原始设计优化的目标。

创建工作：

```bash
for lang in Spanish French German; do
    hermes kanban create "将主页翻译为 $lang" \
        --assignee translator --tenant content-ops
done
for i in 1 2 3 4 5; do
    hermes kanban create "转录 Q3 客户通话 #$i" \
        --assignee transcriber --tenant content-ops
done
for sku in 1001 1002 1003 1004; do
    hermes kanban create "生成产品描述：SKU-$sku" \
        --assignee copywriter --tenant content-ops
done
```

启动网关后离开 — 它会托管嵌入式调度器，在同一 `kanban.db` 上拾取所有三个专业配置的任务：

```bash
hermes gateway start
```

现在筛选看板至 `content-ops`（或仅搜索“Transcribe”），你会看到如下内容：

![筛选为转录任务的多智能体视图](/img/kanban-tutorial/07-fleet-transcribes.png)

两个转录任务已完成，一个正在运行，两个就绪等待下一个调度周期。“进行中”列按配置分组（“按配置分组”默认设置），因此你可以看到每位工作者的活跃任务，而无需扫描混合列表。当前任务完成后，调度器会立即将下一个就绪任务提升为运行状态。三个守护进程并行处理三个被分配者池，整个内容队列无需进一步人工干预即可清空。

**场景 1 中关于结构化交接的所有内容在此处仍然适用。** 翻译员工作者完成一次通话后会发出 `kanban_complete(summary="翻译了 4 页，风格匹配现有营销语调", metadata={"duration_seconds": 720, "tokens_used": 2100})` — 这对分析和任何依赖此任务的下游任务都很有用。

## 场景 3 — 带重试的角色流水线

这是看板相对于扁平待办列表的优势所在。产品经理编写规范。工程师实现它。审核员拒绝首次尝试。工程师根据修改再次尝试。审核员批准。

筛选 `auth-project` 后的看板视图：

![多角色功能的流水线视图](/img/kanban-tutorial/08-pipeline-auth.png)

三阶段链同时可见：`规范：密码重置流程`（已完成，产品经理），`实现密码重置流程`（已完成，后端开发者），`审核密码重置 PR`（就绪，审核员）。每个任务底部都有绿色的父任务，子任务作为依赖项显示。

有趣的是实现任务，因为它曾被阻塞并重试。以下是三个智能体的完整协作流程，以每个工作者模型的工具调用形式展示：

```python
# --- 产品经理工作者在 $SPEC 上启动并编写验收标准 ---
# 工作者工具调用
kanban_show()
kanban_complete(
    summary="规范已批准；POST /forgot-password 发送邮件，"
            "GET /reset/:token 渲染表单，POST /reset 应用新密码",
    metadata={"acceptance": [
        "过期令牌返回 410",
        "重复使用最近 3 次密码返回 400 及消息",
        "成功重置后使所有活跃会话失效",
    ]},
)
# → $SPEC 已完成；$IMPL 自动从待办提升至就绪

# --- 工程师工作者在 $IMPL 上启动（首次尝试）---
# 工作者工具调用
kanban_show()   # 在工作者上下文中读取 $SPEC 的摘要和验收元数据
# （工程师编写代码、运行测试、打开 PR）
# 审核员反馈到达 — 工程师认为问题合理并阻塞
kanban_block(
    reason="审核：缺少密码强度检查，重置链接非一次性使用"
           "（30 分钟内可重放）",
)
# → $IMPL 转换为受阻状态；运行 1 以结果='受阻'关闭
```

现在你（人类，或单独的审核员配置）阅读阻塞原因，认为修复方向明确，然后从看板的“解除阻塞”按钮 — 或从 CLI / 斜杠命令 — 解除阻塞：

```bash
hermes kanban unblock $IMPL
# 或在聊天中：/kanban unblock $IMPL
```

调度器将 `$IMPL` 重新提升至 `就绪` 状态，并在下一个周期重新生成 `backend-dev` 工作者。这次重新生成是对同一任务的 **新运行**：

```python
# --- 工程师工作者在 $IMPL 上启动（第二次尝试）---
# 工作者工具调用
kanban_show()
# → 工作者上下文现在包含运行 1 的阻塞原因，因此此工作者知道
#   要修复哪两件事，而无需重读整个规范
# （工程师添加 zxcvbn 检查，使重置令牌为一次性使用，重新运行测试）
kanban_complete(
    summary="添加了 zxcvbn 强度检查，重置令牌现在为一次性使用"
            "（成功时存储 + 删除）",
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

点击实现任务。抽屉中会显示 **两次尝试**：

![实现任务有两次运行 — 先受阻后完成](/img/kanban-tutorial/04b-drawer-retry-history-scrolled.png)

- **运行 1** — 被 `@backend-dev` 阻塞。审核反馈直接显示在结果下方：“缺少密码强度检查，重置链接非一次性使用（30 分钟内可重放）”。
- **运行 2** — 被 `@backend-dev` 完成。新的摘要，新的元数据。

每次运行都是 `task_runs` 中的一行，具有自己的结果、摘要和元数据。重试历史并非叠加在“最新状态”任务之上的事后概念 — 它是主要表示形式。当重试工作者打开任务时，`build_worker_context` 会向其展示先前的尝试，因此第二次尝试的工作者会看到第一次尝试被阻塞的原因，并针对这些具体发现进行处理，而无需从头开始重新运行。

接下来审核员接手。当他们打开 `审核密码重置 PR` 时，会看到：

![审核员对流水线的抽屉视图](/img/kanban-tutorial/09-drawer-pipeline-review.png)

父链接是已完成的实现。当审核员工作者在 `审核密码重置 PR` 上启动并调用 `kanban_show()` 时，返回的 `工作者上下文` 会包含父任务最近一次已完成运行的摘要和元数据 — 因此审核员在查看差异之前，会先读到“添加了 zxcvbn 强度检查，重置令牌现在为一次性使用”，并掌握已更改文件列表。

## 故事 4 — 断路器与崩溃恢复

真实的工人会失败。凭据缺失、内存不足（OOM）被终止、瞬态网络错误。调度器有两道防线：**断路器**在连续 N 次失败后自动阻止任务，防止看板无休止地重试；以及**崩溃检测**，用于回收那些在 TTL 过期前其工作进程 PID 已消失的任务。

### 断路器 — 看似永久性失败

一个部署任务无法启动其工作进程，因为其配置文件的環境中未设置 `AWS_ACCESS_KEY_ID`：

```bash
hermes kanban create "Deploy to staging (missing creds)" \
    --assignee deploy-bot --tenant ops
```

调度器尝试启动工作进程。启动失败（`RuntimeError: AWS_ACCESS_KEY_ID not set`）。调度器释放声明，增加失败计数器，并在下一个调度周期重试。连续三次失败后（默认 `failure_limit`），断路器跳闸：任务状态变为 `blocked`，结果为 `gave_up`。除非人工解除阻塞，否则不再重试。

点击被阻塞的任务：

![断路器 — 2 次 spawn_failed + 1 次 gave_up](/img/kanban-tutorial/11-drawer-gave-up.png)

三次运行记录，`error` 字段均为相同错误。前两次为 `spawn_failed`（可重试），第三次为 `gave_up`（终态）。上方的事件日志显示了完整序列：`created → claimed → spawn_failed → claimed → spawn_failed → claimed → gave_up`。

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

如果已接入 Telegram / Discord / Slack，`gave_up` 事件会触发网关通知，这样您无需查看看板也能得知服务中断。

### 崩溃恢复 — 工作进程中途死亡

有时启动成功，但工作进程稍后死亡 — 段错误、内存不足、`systemctl stop`。调度器轮询 `kill(pid, 0)` 并检测到已死亡的 PID；声明被释放，任务状态回到 `ready`，下一个调度周期会将其分配给一个新的工作进程。

种子数据中的示例是一个内存耗尽的迁移任务：

```bash
# 工作进程声明任务，开始扫描 240 万行，在约 230 万行时因 OOM 被终止
# 调度器检测到死亡的 PID，释放声明，增加尝试计数器
# 使用分块策略重试成功
```

抽屉面板显示了完整的两次尝试历史：

![崩溃与恢复 — 1 次 crashed + 1 次 completed](/img/kanban-tutorial/06-drawer-crash-recovery.png)

运行 1 — `crashed`，错误为 `OOM kill at row 2.3M (process 99999 gone)`。运行 2 — `completed`，其元数据中包含 `"strategy": "chunked with LIMIT + WHERE id > last_id"`。重试的工作进程在其上下文中看到了运行 1 的崩溃，并选择了更安全的策略；元数据让未来的观察者（或事后分析作者）能清楚看到发生了什么变化。

## 结构化交接 — 为什么 `summary` 和 `metadata` 很重要

在上述每个故事中，工作进程结束时都调用了 `kanban_complete(summary=..., metadata=...)`。这不是装饰 — 这是工作流各阶段之间的主要交接通道。

当任务 B 的工作进程启动并调用 `kanban_show()` 时，它收到的 `worker_context` 包括：

- B 的**先前尝试**（之前的运行记录：结果、摘要、错误、元数据），这样重试的工作进程就不会重复失败的路径。
- **父任务结果** — 每个父任务最近一次成功运行的摘要和元数据 — 这样下游工作进程就能看到上游工作为何以及如何完成。

这取代了困扰扁平化看板系统的“翻阅评论和工作输出”的繁琐操作。产品经理在规范的元数据中编写验收标准，工程师的工作进程就能在父任务交接中结构化地看到它们。工程师记录他们运行了哪些测试以及通过了多少，评审人员的工作进程在打开差异之前就掌握了该列表。

批量关闭保护机制存在，是因为这些数据是按运行记录的。`hermes kanban complete a b c --summary X`（您在 CLI 中执行）会被拒绝 — 将相同摘要复制粘贴到三个任务几乎总是错误的。不带交接标志的批量关闭仍适用于常见的“我完成了一堆行政任务”的情况。工具界面根本不会暴露批量变体；出于同样的原因，`kanban_complete` 始终是每次单个任务。

## 检查正在运行的任务

为完整起见 — 这是一个仍在运行的任务的抽屉面板（来自故事 1 的 API 实现，由 `backend-dev` 声明但尚未完成）：

![已声明，运行中的任务](/img/kanban-tutorial/10-drawer-in-flight.png)

状态为 `Running`。活跃运行记录出现在“运行历史”部分，结果为 `active`，且没有 `ended_at`。如果此工作进程死亡或超时，调度器会用适当的结果关闭此运行记录，并在下一次声明时开启新记录 — 尝试记录永远不会消失。

## 后续步骤

- [看板概览](./kanban) — 完整的数据模型、事件词汇表和 CLI 参考。
- `hermes kanban --help` — 每个子命令，每个标志。
- `hermes kanban watch --kinds completed,gave_up,timed_out` — 在整个看板上实时流式传输终端事件。
- `hermes kanban notify-subscribe <task> --platform telegram --chat-id <id>` — 当特定任务完成时接收网关通知。