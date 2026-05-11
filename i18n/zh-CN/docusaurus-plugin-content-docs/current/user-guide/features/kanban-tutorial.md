# 看板教程

对 Hermes 看板系统设计的四个用例的详细讲解，同时仪表板在浏览器中打开。如果你还没阅读[看板概述](./kanban)，请从那里开始——这里假设你已了解任务、运行、负责人和调度员的含义。

## 设置

```bash
hermes kanban init           # 可选；首次执行 `hermes kanban <任意命令>` 时会自动初始化
hermes dashboard             # 在浏览器中打开 http://127.0.0.1:9119
# 点击左侧导航栏中的 Kanban
```

仪表板是**你**观察系统最便捷的地方。调度员生成的智能体工作者永远不会看到仪表板或命令行界面——它们通过专用的 `kanban_*` [工具集](./kanban#how-workers-interact-with-the-board)（`kanban_show`、`kanban_list`、`kanban_complete`、`kanban_block`、`kanban_heartbeat`、`kanban_comment`、`kanban_create`、`kanban_link`、`kanban_unblock`）来驱动看板。这三种界面——仪表板、命令行界面、工作者工具——都通过每个看板的 SQLite 数据库（默认看板为 `~/.hermes/kanban.db`，后续创建的任何看板为 `~/.hermes/kanban/boards/<slug>/kanban.db`）进行路由，因此无论更改来自哪一侧，每个看板都能保持一致性。

本教程全程使用 `default` 看板。如果你想设置多个独立的队列（每个项目/仓库/领域一个），请参阅概述中的[看板（多项目）](./kanban#boards-multi-project)部分——相同的命令行界面/仪表板/工作者流程适用于每个看板，且工作者在物理上无法看到其他看板上的任务。

在本教程中，**标记为 `bash` 的代码块是你*执行*的命令。** 标记为 `# 工作者工具调用` 的代码块是生成的工作者模型发出的工具调用——这里展示是为了让你看到完整的循环，而不是因为你需要自己运行它们。

## 看板概览

![看板概览](/img/kanban-tutorial/01-board-overview.png)

从左到右共六列：

- **分诊** — 原始想法，在有人开始工作前，一位规范制定者将完善其规格。点击任何分诊卡片上的 **✨ 制定规范** 按钮（或在聊天中运行 `hermes kanban specify <id>` / `/kanban specify <id>`），让辅助 LLM 将一句话变成完整的规范（目标、方法、验收标准），并立即将其提升至 `待办`。在 `config.yaml` 中的 `auxiliary.triage_specifier` 下配置使用哪个模型运行此操作。
- **待办** — 已创建，但等待依赖项完成，或尚未分配。
- **就绪** — 已分配，等待调度器领取。
- **进行中** — 一个工作单元正在积极执行任务。当启用"Lanes by profile"（默认）时，此列按受托人子分组，让你一眼就能看到每个工作单元在做什么。
- **阻塞** — 一个工作单元请求人工输入，或断路器触发。
- **已完成** — 完成。

顶部栏包含搜索、租户和受托人的过滤器，还有一个 `Lanes by profile` 切换按钮和一个 `Nudge dispatcher` 按钮，后者会立即运行一次调度，而不是等待守护进程的下一个时间间隔。点击任何卡片会在右侧打开其抽屉。

### 平面视图

如果按配置文件的泳道显得杂乱，可以关闭"Lanes by profile"，此时"进行中"列会折叠为一个按领取时间排序的单一平面列表：

![关闭配置文件泳道后的看板](/img/kanban-tutorial/02-board-flat.png)

## 故事 1 — 独立开发者交付功能

你正在构建一个功能。经典流程：设计一个模式，实现 API，编写测试。三个任务，具有父子依赖关系。

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
    --body "覆盖成功路径、错误密码、过期令牌、并发刷新。"
```

因为 `API` 以 `SCHEMA` 为父任务，而 `tests` 以 `API` 为父任务，所以只有 `SCHEMA` 开始时处于 `就绪` 状态。另外两个待在 `待办` 中，直到它们的父任务完成。这就是依赖提升引擎的工作原理——在有可测试的 API 之前，不会有其他工作单元去领取测试编写任务。

在下一个调度周期（默认 60 秒，或点击 **Nudge dispatcher** 立即执行），`backend-dev` 配置文件会作为一个工作单元启动，其环境变量中包含 `HERMES_KANBAN_TASK=$SCHEMA`。以下是从智能体内部看到的工作单元工具调用循环：

```python
# 工作单元工具调用 — 不是你运行的命令
kanban_show()
# → 返回标题、正文、worker_context、父任务、先前尝试、评论

# (工作单元读取 worker_context，使用终端/文件工具设计模式，
#  编写迁移，运行自己的检查，提交 — 实际工作发生在这里)

kanban_heartbeat(note="模式草案完成，正在编写迁移")

kanban_complete(
    summary="users(id, email, pw_hash), sessions(id, user_id, jti, expires_at); "
            "刷新令牌存储为 sessions，type='refresh'",
    metadata={
        "changed_files": ["migrations/001_users.sql", "migrations/002_sessions.sql"],
        "decisions": ["使用 bcrypt 进行哈希处理", "会话令牌使用 JWT",
                      "刷新令牌7天有效，访问令牌15分钟有效"],
    },
)
```

`kanban_show` 的 `task_id` 默认值为 `$HERMES_KANBAN_TASK`，因此工作单元不需要知道自己的 ID。`kanban_complete` 将摘要和元数据写入当前 `task_runs` 行，关闭该运行，并将任务转换为 `已完成` —— 所有这些通过 `kanban_db` 在一次原子操作中完成。

当 `SCHEMA` 达到 `已完成` 状态时，依赖引擎会自动将 `API` 提升至 `就绪`。当 API 工作单元领取任务时，它会调用 `kanban_show()` 并在父任务交接信息中看到 `SCHEMA` 的摘要和元数据——因此它无需重新阅读冗长的设计文档就能知道模式决策。

点击看板上已完成的模式任务，抽屉会显示所有信息：

![独立开发者 — 已完成的模式任务抽屉](/img/kanban-tutorial/03-drawer-schema-task.png)

底部的运行历史部分是关键新增内容。一次尝试：结果 `已完成`，工作单元 `@backend-dev`，持续时间，时间戳，以及完整的交接摘要。元数据块（`changed_files`、`decisions`）也存储在该运行中，并提供给任何读取此父任务的下游工作单元。

你可以随时从终端检查相同的数据——这些命令是**你**查看看板，而不是工作单元：

```bash
hermes kanban show $SCHEMA
hermes kanban runs $SCHEMA
# #  OUTCOME       PROFILE       ELAPSED  STARTED
# 1  completed     backend-dev        0s  2026-04-27 19:34
#     → users(id, email, pw_hash), sessions(id, user_id, jti, expires_at); refresh tokens ...
```

## 故事 2 — 集群作业

你有三个工作单元（一个翻译员、一个转录员、一个文案）和一堆独立的任务。你想让三个工作单元并行工作并取得可见的进展。这是最简单的看板使用场景，也是原始设计所优化的场景。

创建任务：

```bash
for lang in 西班牙语 法语 德语; do
    hermes kanban create "将主页翻译为 $lang" \
        --assignee translator --tenant content-ops
done
for i in 1 2 3 4 5; do
    hermes kanban create "转录第三季度客户电话 #$i" \
        --assignee transcriber --tenant content-ops
done
for sku in 1001 1002 1003 1004; do
    hermes kanban create "生成产品描述：SKU-$sku" \
        --assignee copywriter --tenant content-ops
done
```

启动网关然后离开——它托管着嵌入式调度器，在同一个 kanban.db 上领取所有三个专家配置文件的任务：

```bash
hermes gateway start
```

现在将看板过滤到 `content-ops`（或只搜索"转录"），你会看到：

![过滤到转录任务的集群视图](/img/kanban-tutorial/07-fleet-transcribes.png)

两项转录已完成，一项正在进行，两项就绪等待下一个调度周期。"进行中"列按配置文件分组（默认的"Lanes by profile"），因此你无需扫描混合列表就能看到每个工作单元的活动任务。一旦当前任务完成，调度器会将下一个就绪任务提升为进行中。三个守护进程在三个受托人池上并行工作，整个内容队列无需进一步的人工干预就能排空。

**故事 1 中关于结构化交接的所有内容在这里同样适用。** 一个翻译员工作单元完成任务时会发出 `kanban_complete(summary="翻译了4页，风格与现有营销语调一致", metadata={"duration_seconds": 720, "tokens_used": 2100})` —— 这对分析和任何依赖此任务的下游任务都有用。

## 故事 3 — 带重试的角色流水线

这是看板相对于扁平 TODO 列表真正发挥价值的地方。一位产品经理编写规范。一位工程师实现它。一位审核者拒绝了第一次尝试。工程师根据修改再次尝试。审核者批准。

按 `auth-project` 过滤后的仪表板视图：

![多角色功能的流水线视图](/img/kanban-tutorial/08-pipeline-auth.png)

可以一次看到三个阶段的链条：`规范：密码重置流程`（已完成，pm），`实现密码重置流程`（已完成，backend-dev），`审查密码重置 PR`（就绪，reviewer）。每个任务底部绿色显示其父任务，并显示子任务作为依赖项。

有趣的是实现任务，因为它曾被阻塞并重试。以下是完整的三个智能体协作流程，展示为每个工作单元模型进行的工具调用：

```python
# --- PM 工作单元启动于 $SPEC 并编写验收标准 ---
# 工作单元工具调用
kanban_show()
kanban_complete(
    summary="规范已批准；POST /forgot-password 发送邮件，"
            "GET /reset/:token 渲染表单，POST /reset 应用新密码",
    metadata={"acceptance": [
        "过期令牌返回 410",
        "重复使用最近3次使用过的密码返回 400 并附带消息",
        "成功重置会使所有活动会话失效",
    ]},
)
# → $SPEC 完成；$IMPL 自动从待办提升至就绪

# --- 工程师工作单元启动于 $IMPL（第一次尝试）---
# 工作单元工具调用
kanban_show()   # 在 worker_context 中读取 $SPEC 的摘要 + 验收元数据
# (工程师编写代码，运行测试，提交 PR)
# 审核反馈到达 — 工程师认为意见合理，并决定阻塞
kanban_block(
    reason="审查意见：缺少密码强度检查，重置链接不是"
           "一次性使用的（可在30分钟内重放）",
)
# → $IMPL 转换为阻塞；运行 1 关闭，结果='blocked'
```

现在，你（人类，或一个单独的审核者配置文件）阅读阻塞原因，认为修复方向明确，并从仪表板的"解除阻塞"按钮解除阻塞——或从 CLI / 斜杠命令：

```bash
hermes kanban unblock $IMPL
# 或从聊天中：/kanban unblock $IMPL
```

调度器将 `$IMPL` 重新提升至 `就绪`，并在下一个周期重新启动 `backend-dev` 工作单元。这次重启是在同一任务上的**新运行**：

```python
# --- 工程师工作单元启动于 $IMPL（第二次尝试）---
# 工作单元工具调用
kanban_show()
# → worker_context 现在包含运行 1 的阻塞原因，因此此工作单元知道
#   要修复哪两个问题，而不是重新阅读整个规范
# (工程师添加 zxcvbn 检查，使重置令牌一次性使用，重新运行测试)
kanban_complete(
    summary="添加了 zxcvbn 强度检查，重置令牌现在是一次性使用的"
            "（存储 + 成功后删除）",
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

![带有两次运行的实现任务 — 阻塞然后完成](/img/kanban-tutorial/04b-drawer-retry-history-scrolled.png)

- **运行 1** — `被 @backend-dev 阻塞`。审查反馈就在结果下方："缺少密码强度检查，重置链接不是一次性使用的（可在30分钟内重放）"。
- **运行 2** — `由 @backend-dev 完成`。新的摘要，新的元数据。

每次运行都是 `task_runs` 表中的一行，拥有自己的结果、摘要和元数据。重试历史不是概念上附加在"最新状态"任务之上的附加物——它是主要表示。当一个重试的工作单元打开任务时，`build_worker_context` 会向它展示先前的尝试，因此第二次尝试的工作单元能看到第一次尝试为何被阻塞，并解决那些具体问题，而不是从头开始重新运行。

接下来审核者领取任务。当他们打开 `审查密码重置 PR` 时，会看到：

![审核者对流水线的抽屉视图](/img/kanban-tutorial/09-drawer-pipeline-review.png)

父任务链接是已完成的实现。当审核者的工作单元启动于 `审查密码重置 PR` 并调用 `kanban_show()` 时，返回的 `worker_context` 包含父任务最近一次完成运行的摘要 + 元数据——因此审核者读取到"添加了 zxcvbn 强度检查，重置令牌现在是一次性使用的"，并在查看差异之前就拥有了更改文件列表。

## 故事 4 —— 断路器与崩溃恢复

实际工作者会失败。凭据缺失、内存溢出、瞬时网络错误。调度器有两道防线：**断路器**在连续 N 次失败后自动阻塞，避免看板陷入无限混乱；**崩溃检测**则会回收那些在 TTL 到期前工作者进程消失的任务。

### 断路器 —— 永久性故障

因配置文件环境中未设置 `AWS_ACCESS_KEY_ID` 而无法启动工作者的部署任务：

```bash
hermes kanban create "Deploy to staging (missing creds)" \
    --assignee deploy-bot --tenant ops
```

调度器尝试启动工作者。启动失败（`RuntimeError: AWS_ACCESS_KEY_ID not set`）。调度器释放任务认领，增加失败计数器，并在下一个周期重试。连续三次失败后（默认 `failure_limit`），断路器触发：任务状态变为 `blocked`，结果为 `gave_up`（终止）。在人工解除阻塞前不再重试。

点击被阻塞的任务：

![断路器 —— 2次启动失败 + 1次终止](/img/kanban-tutorial/11-drawer-gave-up.png)

三次运行，`error` 字段均显示相同错误。前两次为 `spawn_failed`（可重试），第三次为 `gave_up`（终止）。上方的事件日志显示完整序列：`created → claimed → spawn_failed → claimed → spawn_failed → claimed → gave_up`。

在终端显示：

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

如果集成了 Telegram / Discord / Slack，当触发 `gave_up` 事件时，网关会发送通知，这样你无需查看看板就能知晓故障。

### 崩溃恢复 —— 工作者中途死亡

有时启动成功，但工作者进程随后死亡——段错误、内存溢出、`systemctl stop`。调度器轮询 `kill(pid, 0)` 并检测到死亡的进程；释放认领，任务状态返回 `ready`，下一个周期将任务分配给新工作者。

示例数据中是一个内存耗尽的迁移任务：

```bash
# 工作者认领任务，开始扫描 240 万行数据，在约 230 万行时因 OOM 被杀死
# 调度器检测到死亡的进程，释放认领，增加尝试计数器
# 采用分块策略重试成功
```

抽屉视图显示完整的两次尝试历史：

![崩溃与恢复 —— 1次崩溃 + 1次完成](/img/kanban-tutorial/06-drawer-crash-recovery.png)

运行 1 —— `crashed`（崩溃），错误为 `OOM kill at row 2.3M (process 99999 gone)`。运行 2 —— `completed`（完成），其元数据中包含 `"strategy": "chunked with LIMIT + WHERE id > last_id"`。重试的工作者在其上下文中看到了运行 1 的崩溃记录，并选择了更安全的策略；元数据清晰地向未来的观察者（或复盘人员）展示了改变的内容。

## 结构化交接 —— 为什么 `summary` 和 `metadata` 很重要

在以上每个故事中，工作者在最后都调用了 `kanban_complete(summary=..., metadata=...)`。这不是装饰——它是工作流各阶段间的主要交接渠道。

当任务 B 的工作者被启动并调用 `kanban_show()` 时，它获取的 `worker_context` 包含：

- B 的**先前尝试**（历史运行记录：结果、摘要、错误、元数据），使重试的工作者不会重复失败的路径。
- **父任务结果**——对于每个父任务，最近一次完成运行的摘要和元数据——使下游工作者能够了解上游工作完成的原因和方式。

这替代了困扰扁平看板系统的“挖掘评论和工作成果”的流程。产品经理将验收标准写入规格的元数据，工程师的工作者在父任务交接中能结构化地看到这些标准。工程师记录了他们运行了哪些测试以及通过了多少，审查的工作者在查看差异前就能手握这些信息。

存在批量关闭保护正是因为这些数据是按运行记录独立存在的。`hermes kanban complete a b c --summary X`（你通过 CLI 执行）会被拒绝——将相同的摘要复制粘贴给三个任务几乎总是错误的。批量关闭而不带交接标志的操作，对于常见的“我完成了一堆行政任务”的情况仍然有效。工具界面根本不暴露批量变体；`kanban_complete` 总是单任务操作，原因相同。

## 检查当前正在运行的任务

为完整起见——这是一个仍在执行中的任务（故事 1 中的 API 实现，已被 `backend-dev` 认领但尚未完成）：

![已认领、进行中的任务](/img/kanban-tutorial/10-drawer-in-flight.png)

状态为 `Running`（运行中）。活跃的运行出现在运行历史部分，结果为 `active`，且没有 `ended_at`。如果该工作者死亡或超时，调度器将使用相应的结果关闭此运行，并在下次认领时开启一个新的运行——尝试行永远不会消失。

## 后续步骤

- [看板概述](./kanban) —— 完整的数据模型、事件词汇表和 CLI 参考。
- `hermes kanban --help` —— 所有子命令、所有标志。
- `hermes kanban watch --kinds completed,gave_up,timed_out` —— 跨整个看板的实时终端事件流。
- `hermes kanban notify-subscribe <task> --platform telegram --chat-id <id>` —— 当特定任务完成时接收网关通知。