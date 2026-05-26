# 看板教程

本文将引导您了解赫尔墨斯看板系统设计的四大应用场景，并将在浏览器中打开仪表板进行演示。若您尚未阅读[看板概述](./kanban)，建议先从那里开始——本文假设您已了解任务、运行、分配人和调度器的概念。

## 环境配置

```bash
hermes kanban init           # 可选；首次执行任何 `hermes kanban <指令>` 时会自动初始化
hermes dashboard             # 在浏览器中打开 http://127.0.0.1:9119
# 点击左侧导航栏的"看板"
```

仪表板是最便于您**观察系统运作**的界面。调度器生成的智能体工作进程既看不到仪表板也无法使用命令行——它们通过专用的 `kanban_*` [工具集](./kanban#how-workers-interact-with-the-board)（`kanban_show`、`kanban_list`、`kanban_complete`、`kanban_block`、`kanban_heartbeat`、`kanban_comment`、`kanban_create`、`kanban_link`、`kanban_unblock`）来驱动看板。所有三种操作界面——仪表板、命令行、工作进程工具——都通过每个看板独立的 SQLite 数据库路由（默认看板使用 `~/.hermes/kanban.db`，后续创建的看板使用 `~/.hermes/kanban/boards/<slug>/kanban.db`），因此无论变更来自哪个端口，各看板数据始终保持一致。

本教程全程使用 `default` 看板。若您需要多个隔离队列（按项目/仓库/领域划分），请参阅概述中的[看板（多项目）](./kanban#boards-multi-project)章节——命令行/仪表板/工作流程在各看板中均适用，且工作进程在物理上无法访问其他看板的任务。

整个教程中，**标记为 `bash` 的代码块是*您*执行的命令**。标记为 `# worker tool calls` 的代码块是生成的工作进程模型调用工具的输出——在此展示是为了让您完整观察循环流程，并非需要您手动执行。

## 看板概览

![看板概览](/img/kanban-tutorial/01-board-overview.png)

六列，从左到右：

- **分诊** — 原始想法。默认情况下，调度器会自动在此处的任务上运行**分解器**（由协调器驱动的扇出式任务分配）：它会读取您的配置文件列表和描述，生成一个子任务图，并将其路由到最匹配的专家，同时保留原始任务作为父任务，以便协调器在所有任务完成后唤醒并判断完成情况。点击看板页面顶部的 **协调模式：自动/手动** 标签可切换模式。在手动模式下（或对于没有协调器配置文件的设置），点击卡片上的 **⚗ 分解**，或运行 `hermes kanban decompose <id>` / `/kanban decompose <id>`。对于不需要扇出式分配的单个任务，**✨ 规范化** 会执行一次性的规范重写（目标、方法、验收标准），并将其提升到 `待办` 状态。在 `config.yaml` 中配置 `auxiliary.kanban_decomposer` 和 `auxiliary.triage_specifier` 模型。参见主看板指南中的[自动与手动协调](./kanban#auto-vs-manual-orchestration)。
- **待办** — 已创建但等待依赖项，或尚未分配。
- **就绪** — 已分配并等待调度器认领。
- **进行中** — 智能体正在执行任务。当“按配置文件分栏”开启（默认设置）时，此列会按分配者进行子分组，这样您可以一目了然地查看每个智能体正在做什么。
- **阻塞** — 智能体请求了人工输入，或断路器触发了。
- **已完成** — 已完成。

顶部栏有用于搜索、租户和分配者的过滤器，还有一个 `按配置文件分栏` 切换按钮和一个 `催促调度器` 按钮，该按钮会立即运行一次调度，而不是等待守护进程的下一个间隔。点击任何卡片会在右侧打开其抽屉视图。

### 平面视图

如果配置文件分栏显得杂乱，关闭“按配置文件分栏”，“进行中”列将折叠为一个按认领时间排序的单一平面列表：

![关闭按配置文件分栏后的看板](/img/kanban-tutorial/02-board-flat.png)

## 故事 1 — 单人开发者交付功能

您正在构建一个功能。经典流程：设计模式、实现 API、编写测试。三个任务具有父子依赖关系。

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
    --body "覆盖正常路径、错误密码、过期令牌、并发刷新场景。"
```

由于 `API` 的父任务是 `SCHEMA`，而 `测试` 的父任务是 `API`，因此只有 `SCHEMA` 会从 `就绪` 状态开始。另外两个任务则停留在 `待办` 状态，直到它们的父任务完成。这是依赖项提升引擎在发挥作用——在有 API 可供测试之前，不会有其他智能体来接手测试编写任务。

在下一个调度器周期（默认为 60 秒，或在您点击 **催促调度器** 时立即触发），`backend-dev` 配置文件将作为一个智能体生成，其环境变量中包含 `HERMES_KANBAN_TASK=$SCHEMA`。以下是智能体内部的工具调用循环示例：

```python
# 智能体工具调用 — 并非您要运行的命令
kanban_show()
# → 返回标题、正文、工作者上下文、父任务、之前的尝试、评论

# (智能体读取工作者上下文，使用终端/文件工具设计模式，
#  编写迁移、运行自身检查、提交——实际工作发生在这里)

kanban_heartbeat(note="模式已起草，正在编写迁移")

kanban_

## 故事 4 — 断路器与崩溃恢复

现实中的工作者会出错。缺少凭据、内存溢出终止、瞬时网络错误。调度器有两道防线：一道是**断路器**，在连续 N 次失败后自动阻止任务，以防看板永远无法正常运行；另一道是**崩溃检测**，当工作者进程 ID 在其 TTL 到期前消失时，回收该任务。

### 断路器 — 看似永久的失败

一个部署任务因在配置文件环境中未设置 `AWS_ACCESS_KEY_ID` 而无法启动其工作者：

```bash
hermes kanban create "Deploy to staging (missing creds)" \
    --assignee deploy-bot --tenant ops \
    --max-retries 3
```

调度器尝试启动工作者。启动失败（`RuntimeError: AWS_ACCESS_KEY_ID not set`）。调度器释放认领，增加一个失败计数器，并在下一个 tick 重试。因为此示例设置了 `--max-retries 3`，在连续三次失败后断路器跳闸：任务进入 `blocked` 状态，结果为 `gave_up`。如果省略此标志，Hermes 将使用 `kanban.failure_limit`（默认值：2）。在人工解除阻塞之前，不再重试。

点击被阻塞的任务：

![断路器 — 2 次 spawn_failed + 1 次 gave_up](/img/kanban-tutorial/11-drawer-gave-up.png)

三次运行，`error` 字段都有相同的错误。前两次是 `spawn_failed`（可重试），第三次是 `gave_up`（终止）。上面的事件日志显示了完整的序列：`created → claimed → spawn_failed → claimed → spawn_failed → claimed → gave_up`。

在终端上：

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

如果连接了 Telegram / Discord / Slack，在 `gave_up` 事件时会触发网关通知，这样你无需查看看板就能得知中断情况。

### 崩溃恢复 — 工作者中途死亡

有时启动成功但工作者进程稍后死亡 — 段错误、OOM、`systemctl stop`。调度器轮询 `kill(pid, 0)` 并检测到已失效的 pid；释放认领，任务回到 `ready`，下一个 tick 会将其分配给一个新的工作者。

种子数据中的例子是一个因内存不足而中断的迁移：

```bash
# 工作者认领，开始扫描 240 万行，在约 230 万行时被 OOM 终止
# 调度器检测到已失效的 pid，释放认领，增加尝试计数器
# 使用分块策略重试成功
```

抽屉显示了完整的两次尝试历史：

![崩溃与恢复 — 1 次崩溃 + 1 次完成](/img/kanban-tutorial/06-drawer-crash-recovery.png)

运行 1 — `crashed`，错误为 `OOM kill at row 2.3M (process 99999 gone)`。运行 2 — `completed`，其元数据中包含 `"strategy": "chunked with LIMIT + WHERE id > last_id"`。重试的工作者在其上下文中看到了运行 1 的崩溃记录，并选择了更安全的策略；元数据使未来的观察者（或事后分析人员）能清楚地知道发生了什么变化。

## 结构化交接 — 为什么 `summary` 和 `metadata` 很重要

在上述每个故事中，工作者在结束时调用了 `kanban_complete(summary=..., metadata=...)`。这不是装饰 — 它是工作流各阶段之间主要的交接通道。

当任务 B 上的工作者被启动并调用 `kanban_show()` 时，它获得的 `worker_context` 包括：

- B 的**先前尝试**（以前的运行：结果、摘要、错误、元数据），这样重试的工作者不会重复失败的路径。
- **父任务结果** — 对于每个父任务，是最近一次已完成运行的摘要和元数据 — 这样下游工作者可以看到上游工作是如何以及为何完成的。

这取代了困扰扁平看板系统的“翻阅评论和工作产出”的繁琐过程。产品经理在规格说明的元数据中编写验收标准，工程师的工作者在父级交接中结构化地看到它们。工程师记录运行了哪些测试以及通过了多少，审查员的工作者在查看差异之前就已掌握该列表。

存在批量关闭保护正是因为这些数据是按运行记录的。`hermes kanban complete a b c --summary X`（你通过命令行执行）会被拒绝 — 将相同的摘要复制粘贴到三个任务几乎总是错误的。不带交接标志的批量关闭仍然适用于常见的“我完成了一堆管理任务”的情况。工具层面根本不暴露批量变体；`kanban_complete` 总是单任务单任务处理，原因相同。

## 检查当前正在运行的任务

为完整起见 — 这是一个仍在进行中的任务的抽屉（故事 1 中的 API 实现，已被 `backend-dev` 认领但尚未完成）：

![已认领、进行中的任务](/img/kanban-tutorial/10-drawer-in-flight.png)

状态为 `Running`。活动运行出现在“运行历史”部分，结果为 `active`，没有 `ended_at`。如果此工作者死亡或超时，调度器将使用相应结果关闭此运行，并在下一次认领时开启新的运行 — 尝试行永远不会消失。

## 后续步骤

- [Kanban 概述](./kanban) — 完整的数据模型、事件词汇表和命令行参考。
- `hermes kanban --help` — 每个子命令，每个标志。
- `hermes kanban watch --kinds completed,gave_up,timed_out` — 跨整个看板的实时流终端事件。
- `hermes kanban notify-subscribe <task> --platform telegram --chat-id <id>` — 当特定任务完成时获取网关通知。