---
sidebar_position: 12
title: "看板（多智能体协作板）"
description: "基于持久化 SQLite 的任务看板，用于协调多个 Hermes 配置文件"
---

# 看板 — 多智能体配置文件协作

> **需要详细教程吗？** 请阅读[看板教程](./kanban-tutorial)——其中包含四个用户故事（独立开发者、多实例农场、带重试的角色流水线、熔断器），并附有每个故事的仪表板截图。本页是参考文档，教程是叙述性指南。

Hermes 看板是一个持久化的任务看板，在您所有的 Hermes 配置文件之间共享，允许多个具名智能体在不依赖脆弱的进程内子智能体群的情况下协同工作。每个任务都是 `~/.hermes/kanban.db` 中的一行记录；每次交接都是一行任何智能体都可以读写的记录；每个工作进程都是一个拥有自己身份的独立操作系统进程。

### 双入口：模型通过工具交互，您通过命令行操作

该看板有两个入口，均基于同一个 `~/.hermes/kanban.db` 文件：

- **智能体通过专用的 `kanban_*` 工具集驱动看板** — 包括 `kanban_show`, `kanban_list`, `kanban_complete`, `kanban_block`, `kanban_heartbeat`, `kanban_comment`, `kanban_create`, `kanban_link`, `kanban_unblock`。调度器在启动每个工作进程时，其模式中已包含这些工具；编排器配置文件也可以显式启用 `kanban` 工具集。模型通过直接调用工具来读取和路由任务，*而不是* 通过执行 `hermes kanban` 命令。请参阅下方的[工作进程如何与看板交互](#工作进程如何与看板交互)。
- **您（以及脚本、定时任务）通过 CLI 命令 `hermes kanban …`、斜杠命令 `/kanban …` 或仪表板来驱动看板**。这些是为人类和自动化流程（即背后没有工具调用模型的地方）设计的。

两个入口都通过同一个 `kanban_db` 层进行路由，因此读取操作能获得一致的视图，写入操作也不会出现偏差。本页其余部分展示 CLI 示例，因为它们易于复制粘贴，但每个 CLI 动词都有模型使用的等效工具调用。

这种形式涵盖了 `delegate_task` 无法处理的工作负载：

- **研究分流** — 并行的研究员 + 分析师 + 作家，人在回路。
- **计划任务** — 每日例行简报，随时间累积形成日志。
- **数字孪生** — 持久的具名助手（如 `inbox-triage`, `ops-review`），能随时间积累记忆。
- **工程流水线** — 分解 → 在并行工作树中实现 → 审查 → 迭代 → 提交 PR。
- **集群工作** — 一个专家管理 N 个主体（50 个社交账户、12 个监控服务）。

完整的设计原理、与 Cline Kanban / Paperclip / NanoClaw / Google Gemini Enterprise 的对比分析，以及八种典型的协作模式，请参阅代码仓库中的 `docs/hermes-kanban-v1-spec.pdf`。

## 看板 vs. `delegate_task`

它们看起来相似，但并非同一原语。

| | `delegate_task` | 看板 |
|---|---|---|
| 形式 | RPC 调用（分叉 → 合并） | 持久化消息队列 + 状态机 |
| 父进程 | 阻塞直至子进程返回 | 创建后即“发射后不管” |
| 子进程身份 | 匿名子智能体 | 拥有持久记忆的具名配置文件 |
| 可恢复性 | 无 — 失败即失败 | 阻塞 → 解除阻塞 → 重新运行；崩溃 → 回收 |
| 人在回路 | 不支持 | 随时可评论/解除阻塞 |
| 单任务智能体数 | 一次调用 = 一个子智能体 | 任务生命周期内可有 N 个智能体（重试、审查、跟进） |
| 审计跟踪 | 在上下文压缩时丢失 | 永久保存在 SQLite 行中 |
| 协调方式 | 层级式（调用方 → 被调用方） | 对等 — 任何配置文件都可读写任何任务 |

**一句话区分：** `delegate_task` 是一个函数调用；看板是一个工作队列，其中每次交接都是一行任何配置文件（或人类）都可以查看和编辑的记录。

**当**父智能体需要一个简短的推理答案才能继续，且不涉及人类，结果会返回到父进程上下文时，**使用 `delegate_task`**。

**当**工作跨越智能体边界、需要在重启后幸存、可能需要人类输入、可能被不同角色接手，或需要事后可发现时，**使用看板**。

它们可以共存：一个看板工作进程在其运行期间内部可能会调用 `delegate_task`。

## 核心概念

- **看板 (Board)** — 一个独立的任务队列，拥有自己的 SQLite 数据库、工作空间目录和调度器循环。一次安装可以拥有多个看板（例如，每个项目、代码库或领域一个）；详见下方[看板（多项目）](#boards-multi-project)。单项目用户可始终使用 `default` 看板，无需在本文档章节之外了解“看板”一词。
- **任务 (Task)** — 一行记录，包含标题、可选正文、一个负责人（配置文件名称）、状态（`triage | todo | ready | running | blocked | done | archived`）、可选的租户命名空间以及可选的幂等键（用于重试自动化时的去重）。
- **链接 (Link)** — 一条 `task_links` 记录，表示父任务 → 子任务的依赖关系。当所有父任务都处于 `done` 状态时，调度器会将子任务从 `todo` 提升为 `ready`。
- **评论 (Comment)** — 智能体间的通信协议。智能体和人类可追加评论；当工作节点被（重新）启动时，它会读取完整的评论线程作为其上下文的一部分。
- **工作空间 (Workspace)** — 工作节点操作的目录。有三种类型：
  - `scratch`（默认）— 位于 `~/.hermes/kanban/workspaces/<id>/`（对于非默认看板，则在 `~/.hermes/kanban/boards/<slug>/workspaces/<id>/`）下的全新临时目录。**任务完成时删除** — scratch 设计上是临时的，因此在工作节点（或 `hermes kanban complete <id>`）标记任务完成的瞬间目录即被清除。若想保留工作节点的输出，请改用 `worktree:` 或 `dir:<path>`。首次在安装中创建 scratch 工作空间时，调度器会记录一条警告并在该任务上发出 `tip_scratch_workspace` 事件（可通过 `hermes kanban show <id>` 查看）。
  - `dir:<path>` — 一个已存在的共享目录（如 Obsidian 知识库、邮件运维目录、按账户文件夹）。**必须是绝对路径。** 像 `dir:../tenants/foo/` 这样的相对路径在调度时会被拒绝，因为它们会基于调度器当时所在的工作目录进行解析，这存在歧义，也是一个混淆代理逃逸向量。除此之外，路径是受信任的 —— 这是你的机器，你的文件系统，工作节点以你的用户 ID 运行。这是受信任的本地用户威胁模型；看板在设计上是单主机的。**任务完成时保留。**
  - `worktree` — 用于编码任务的 git 工作树，位于 `.worktrees/<id>/` 下。使用 `worktree:<path>` 可以固定确切的目标路径。工作节点端的 `git worktree add` 会创建它，在提供 `--branch` 参数时使用。**任务完成时保留。**
- **调度器 (Dispatcher)** — 一个长驻循环，每 N 秒（默认 60 秒）执行一次：回收陈旧的声明、回收已崩溃的工作节点（PID 消失但 TTL 尚未过期）、提升就绪的任务、原子性地声明任务、启动被分配的配置文件。默认情况下运行在**网关内部**（`kanban.dispatch_in_gateway: true`）。每次 tick 时，一个调度器扫描所有看板；启动工作节点时会固定 `HERMES_KANBAN_BOARD` 环境变量，使它们无法看到其他看板的任务。当同一任务连续启动失败达到 `kanban.failure_limit` 次（默认：2 次）后，调度器会自动将其阻塞，并将最后一次错误作为原因 —— 防止因配置文件不存在、工作空间无法挂载等问题导致任务不断抖动。
- **租户 (Tenant)** — 看板*内*的可选字符串命名空间。一个专家智能体舰队可以通过使用 `--tenant business-a` 来为多个业务服务，通过工作空间路径和内存键前缀实现数据隔离。租户是软性过滤；看板才是硬性的隔离边界。

## 看板（多项目）

看板允许你将不相关的工作流 —— 每个项目、代码库或领域一个 —— 分离到独立的队列中。新安装时恰好有一个名为 `default` 的看板（数据库位于 `~/.hermes/kanban.db` 以保持向后兼容）。只需要一个工作流的用户无需了解看板；该功能是可选的。

每个看板的隔离是绝对的：

- 每个看板有独立的 SQLite 数据库（`~/.hermes/kanban/boards/<slug>/kanban.db`）。
- 独立的 `workspaces/` 和 `logs/` 目录。
- 为任务启动的工作节点**只能**看到其所属看板的任务 —— 调度器在子进程环境中设置 `HERMES_KANBAN_BOARD`，并且工作节点可访问的每个 `kanban_*` 工具都会读取该变量。
- 不允许跨看板链接任务（保持模式简单；如果确实需要跨项目引用，请使用纯文本提及并手动按 ID 查找）。

### 通过 CLI 管理看板

```bash
# 查看磁盘上的内容。新安装时只显示 "default"。
hermes kanban boards list

# 创建新看板。
hermes kanban boards create atm10-server \
    --name "ATM10 Server" \
    --description "Minecraft 模组服务器运维" \
    --icon 🎮 \
    --switch                   # 可选：将其设为活动看板

# 无需切换即可操作特定看板。
hermes kanban --board atm10-server list
hermes kanban --board atm10-server create "重启 ATM 服务器" --assignee ops

# 更改后续调用的“当前”看板。
hermes kanban boards switch atm10-server
hermes kanban boards show             # 当前哪个是活动看板？

# 重命名显示名称（slug 是不可变的 —— 它是目录名）。
hermes kanban boards rename atm10-server "ATM10 (生产环境)"

# 归档（默认）— 将看板目录移至 boards/_archived/<slug>-<ts>/。
# 可通过移回目录来恢复。
hermes kanban boards rm atm10-server

# 硬删除 —— 使用 `rm -rf` 删除看板目录。无法恢复。
hermes kanban boards rm atm10-server --delete
```

看板解析顺序（优先级从高到低）：

1. CLI 调用时显式指定的 `--board <slug>`。
2. `HERMES_KANBAN_BOARD` 环境变量（由调度器在启动工作节点时设置，因此工作节点看不到其他看板的任务）。
3. `~/.hermes/kanban/current` —— 由 `hermes kanban boards switch` 持久化的 slug。
4. `default`。

Slugs 经过验证：仅限小写字母数字 + 连字符 + 下划线，长度 1-64 字符，必须以字母数字开头。大写输入会自动转为小写。其他任何字符（斜杠、空格、点号、`..`）都会在 CLI 层被拒绝，从而防止路径遍历技巧命名看板。

### 通过仪表盘管理看板

`hermes dashboard` → “看板”标签页会在存在多个看板（或任何看板有任务时）在顶部显示看板切换器。单看板用户只会看到一个小型的 `+ 新建看板` 按钮；切换器在必要时才显示。

- **看板下拉菜单** —— 选择活动看板。你的选择会保存到浏览器的 `localStorage`，因此在页面刷新后依然有效，不会改变你打开的终端中 CLI 的 `current` 指针。
- **+ 新建看板** —— 打开一个模态框，要求输入 slug、显示名称、描述和图标。可选择自动切换到新看板。
- **归档** —— 仅在非 `default` 看板上显示。确认后，将看板目录移至 `boards/_archived/`。

所有仪表盘 API 端点都接受 `?board=<slug>` 参数以限定看板范围。事件 WebSocket 在连接时绑定到一个看板；在 UI 中切换会针对新看板打开一个新的 WS 连接。

## 快速开始

下方命令是**你**（人类）在设置看板和创建任务。任务分配后，调度器会启动指定的配置文件作为工作线程，随后**由模型通过 `kanban_*` 工具调用驱动任务，而非使用命令行命令** — 参见 [工作线程如何与看板交互](#how-workers-interact-with-the-board)。

```bash
# 1. 创建看板（你）
hermes kanban init

# 2. 启动网关（托管内嵌调度器）
hermes gateway start

# 3. 创建任务（你——或一个通过 kanban_create 的编排智能体）
hermes kanban create "研究AI资助格局" --assignee researcher

# 4. 实时查看活动（你）
hermes kanban watch

# 5. 查看看板（你）
hermes kanban list
hermes kanban stats
```

当调度器拾取 `t_abcd` 并启动 `researcher` 配置文件时，该工作线程的模型首先会调用 `kanban_show()` 来读取其任务，而**不是**运行 `hermes kanban show t_abcd`。

### 网关内嵌调度器（默认）

调度器运行在网关进程内部。无需安装，无需管理单独的服务——如果网关在运行，就绪的任务将在下一个调度周期（默认为60秒）被拾取。

```yaml
# config.yaml
kanban:
  dispatch_in_gateway: true        # 默认
  dispatch_interval_seconds: 60    # 默认
```

可通过 `HERMES_KANBAN_DISPATCH_IN_GATEWAY=0` 在运行时覆盖此配置标志以进行调试。标准网关监控适用：直接运行 `hermes gateway start`，或将网关设置为 systemd 用户单元（参见网关文档）。如果没有运行的网关，`ready` 状态的任务将停留在原地，直到网关启动——`hermes kanban create` 在创建时会对此发出警告。

将 `hermes kanban daemon` 作为单独进程运行已**弃用**；请使用网关。如果你确实无法运行网关（例如无头主机策略禁止长寿命服务等），`--force` 逃生舱口可让旧的独立守护进程再运行一个发布周期，但同时运行网关内嵌调度器和独立守护进程并指向同一个 `kanban.db` 会导致所有权冲突，**不受支持**。

### 幂等创建（用于自动化/Webhooks）

```bash
# 首次调用创建任务。任何使用相同密钥的后续调用
# 将返回现有任务ID，而不会创建重复任务。
hermes kanban create "每晚运维审查" \
    --assignee ops \
    --idempotency-key "nightly-ops-$(date -u +%Y-%m-%d)" \
    --json
```

### 批量命令行操作

所有生命周期操作都接受多个ID，以便你可以通过一条命令清理一批任务：

```bash
hermes kanban complete t_abc t_def t_hij --result "批量收尾"
hermes kanban archive  t_abc t_def t_hij
hermes kanban unblock  t_abc t_def
hermes kanban block    t_abc "需要输入" --ids t_def t_hij
```

## 工作者如何与看板交互

**工作者不会调用外部命令 `hermes kanban`。** 当调度器生成一个工作者时，它会设置子进程环境变量 `HERMES_KANBAN_TASK=t_abcd`，该环境变量会激活模型模式中一个专用的**看板工具集**。同样的工具集也可用于在其工具集配置中启用了 `kanban` 的编排器配置文件。这些工具通过 Python 的 `kanban_db` 层直接读取和修改看板，与 CLI 的工作方式相同。运行中的工作者像调用任何其他工具一样调用这些工具；它从不接触或需要 `hermes kanban` 命令行界面。

| 工具 | 用途 | 必需参数 |
|---|---|---|
| `kanban_show` | 读取当前任务（标题、正文、先前尝试、父级交接、评论、完整预格式化的 `worker_context`）。默认使用环境中的任务 ID。 | — |
| `kanban_list` | 列出任务摘要，支持按 `assignee`、`status`、`tenant`、归档可见性进行过滤和限制数量。供编排器发现看板工作。 | — |
| `kanban_complete` | 通过 `summary` + `metadata` 结构化交接完成任务。 | `summary` / `result` 至少一个 |
| `kanban_block` | 以 `reason` 为由，升级请求人工输入。 | `reason` |
| `kanban_heartbeat` | 在长时间操作期间发送活动信号。纯副作用。 | — |
| `kanban_comment` | 向任务线程追加一条持久备注。 | `task_id`、`body` |
| `kanban_create` | （编排器）创建 `assignee`，可选 `parents`、`skills` 等，以扇出方式生成子任务。 | `title`、`assignee` |
| `kanban_link` | （编排器）事后添加 `parent_id → child_id` 依赖边。 | `parent_id`、`child_id` |
| `kanban_unblock` | （编排器）将被阻塞的任务移回 `ready` 状态。 | `task_id` |

一个典型的工作者执行顺序如下：

```
# 模型的工具调用，按顺序：
kanban_show()                                     # 无参数 — 使用 HERMES_KANBAN_TASK
# （模型读取返回的 worker_context，通过终端/文件工具执行工作）
kanban_heartbeat(note="进度过半 — 已转换 8 个文件中的 4 个")
# （更多工作）
kanban_complete(
    summary="已将 limiter.py 迁移为令牌桶算法；添加了 14 个测试，全部通过",
    metadata={"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14},
)
```

一个**编排器**工作者则进行扇出操作：

```
kanban_show()
kanban_create(
    title="研究 2024-2026 年 ICP 融资情况",
    assignee="researcher-a",
    body="关注种子轮 + A 轮融资，北美地区，AI 相关",
)
# → 返回 {"task_id": "t_r1", ...}
kanban_create(title="研究 ICP 融资情况 — 欧洲视角", assignee="researcher-b", body="…")
# → 返回 {"task_id": "t_r2", ...}
kanban_create(
    title="将研究发现综合成启动简报",
    assignee="writer",
    parents=["t_r1", "t_r2"],                     # 当两者都完成时，状态提升为 ready
    body="一页纸，300 字，中立语气",
)
kanban_complete(summary="已分解为 2 个研究任务 + 1 个写作任务；已链接依赖关系")
```

"（编排器）"工具 — `kanban_list`、`kanban_create`、`kanban_link`、`kanban_unblock` 以及对其他任务的 `kanban_comment` — 通过相同的工具集可用；约定（由 `kanban-orchestrator` 技能强制执行）是工作者配置文件不进行扇出或路由无关工作，编排器配置文件不执行实现工作。调度器生成的工作者在执行破坏性生命周期操作时仍然限定于任务范围内，不能修改无关任务。

### 为什么使用工具而不是调用外部 `hermes kanban`

三个原因：

1.  **后端可移植性。** 其终端工具指向远程后端（Docker / Modal / Singularity / SSH）的工作者需要在容器内运行 `hermes kanban complete`，但容器内可能未安装 `hermes` 且未挂载 `~/.hermes/kanban.db`。看板工具运行在智能体自身的 Python 进程中，无论终端后端如何，始终可以访问 `~/.hermes/kanban.db`。
2.  **无 Shell 引用脆弱性。** 通过 shlex + argparse 传递 `--metadata '{"files": [...]}'` 是一个潜在的陷阱。结构化工具参数完全避免了这个问题。
3.  **更好的错误处理。** 工具结果是模型可以推理的结构化 JSON，而不是需要解析的 stderr 字符串。

**对普通会话零模式占用。** 一个普通的 `hermes chat` 会话在其模式中没有任何 `kanban_*` 工具，除非活动配置文件明确启用了用于编排器工作的 `kanban` 工具集。调度器生成的任务工作者获得任务范围的工具，因为设置了 `HERMES_KANBAN_TASK`；编排器配置文件通过配置获得更广泛的路由表面。对于从不接触看板的用户来说，不会有工具膨胀。

`kanban-worker` 和 `kanban-orchestrator` 技能教会模型何时以及按何种顺序调用哪个工具。

### 推荐的交接证据

`kanban_complete(summary=..., metadata={...})` 被设计为灵活的：
总结是人类可读的收尾，而 `metadata` 是机器可读的交接数据，下游智能体、审阅者或仪表板可以重用，无需解析文本。

对于工程和审阅任务，推荐使用此可选的元数据结构：

```json
{
  "changed_files": ["path/to/file.py"],
  "verification": ["pytest tests/hermes_cli/test_kanban_db.py -q"],
  "dependencies": ["父任务 ID 或外部问题，如有"],
  "blocked_reason": null,
  "retry_notes": "如果这是重试，之前失败的原因",
  "residual_risk": ["未测试或仍需人工审查的内容"]
}
```

这些键是约定，而非模式要求。其有用之处在于，每个工作者都留下足够的证据，让下一个读者能快速回答四个问题：

1.  改变了什么？
2.  如何验证的？
3.  如果失败，什么可以解除阻塞或重试它？
4.  有哪些风险是有意保留的？

将密钥、原始日志、令牌、OAuth 材料和不相关的记录排除在 `metadata` 之外。改为存储指针和摘要。如果一个任务没有文件或测试，请在 `summary` 中明确说明，并在 `metadata` 中提供确实存在的证据，例如来源 URL、问题 ID 或手动审查步骤。

### 工作者技能

任何应该能够处理看板任务的配置文件都必须加载 `kanban-worker` 技能。它通过**工具调用**（而非 CLI 命令）教导工作者完整的生命周期：

1.  生成时，调用 `kanban_show()` 读取标题 + 正文 + 父级交接 + 先前尝试 + 完整评论线程。
2.  `cd $HERMES_KANBAN_WORKSPACE`（通过终端工具）并在那里执行工作。
3.  在长时间操作期间，每隔几分钟调用 `kanban_heartbeat(note="...")`。**如果您的工作可能运行超过 1 小时，请至少每小时调用一次 `kanban_heartbeat`** — 调度器会回收自上次心跳以来已运行超过 `kanban.dispatch_stale_timeout_seconds`（默认 4 小时）的任务，假设工作者已崩溃且未清理。回收是良性的（任务返回 `ready` 状态以重新分发，不会增加失败计数器），但您会丢失当前运行的进度。
4.  通过 `kanban_complete(summary="...", metadata={...})` 完成，或者如果卡住则调用 `kanban_block(reason="...")`。

最后的 `kanban_complete` / `kanban_block` 调用是工作者协议的一部分。如果工作者进程在任务仍为 `running` 状态时以状态码 0 退出，调度器会将其视为协议违规，发出 `protocol_violation` 事件，并在下一个周期自动阻塞该任务，而不是将其重新生成到相同的循环中。这通常意味着模型编写了一个纯文本答案并在未使用看板工具界面的情况下退出了。

`kanban-worker` 是一个捆绑技能，在安装和更新期间同步到每个配置文件中 — 没有单独的技能中心安装步骤。验证它是否存在于您用于看板工作者的配置文件（`researcher`、`writer`、`ops` 等）中：

```bash
hermes -p <your-worker-profile> skills list | grep kanban-worker
```

如果捆绑副本丢失，请为该配置文件恢复它：

```bash
hermes -p <your-worker-profile> skills reset kanban-worker --restore
```

调度器在生成每个工作者时也会自动传递 `--skills kanban-worker`，因此即使配置文件的默认技能配置中没有包含它，工作者也总是拥有模式库可用。

### 为特定任务固定额外技能

有时单个任务需要受让人配置文件默认不携带的专业上下文 — 一个需要 `translation` 技能的翻译任务，一个需要 `github-code-review` 的审阅任务，一个需要 `security-pr-audit` 的安全审计。与其每次都编辑受让人的配置文件，不如直接将技能附加到任务上。

**从编排器智能体**（常见情况 — 一个智能体将工作路由给另一个），使用 `kanban_create` 工具的 `skills` 数组：

```
kanban_create(
    title="将 README 翻译成日语",
    assignee="linguist",
    skills=["translation"],
)

kanban_create(
    title="审计认证流程",
    assignee="reviewer",
    skills=["security-pr-audit", "github-code-review"],
)
```

**从人工（CLI / 斜杠命令）**，为每个技能重复 `--skill`：

```bash
hermes kanban create "将 README 翻译成日语" \
    --assignee linguist \
    --skill translation

hermes kanban create "审计认证流程" \
    --assignee reviewer \
    --skill security-pr-audit \
    --skill github-code-review
```

**从仪表板**，在行内创建表单的 **skills** 字段中以逗号分隔输入技能名称。

这些技能是**附加**到内置的 `kanban-worker` 之上的 — 调度器为每个技能（以及内置的）发出一个 `--skills <name>` 标志，因此工作者生成时会加载所有这些技能。技能名称必须与实际安装在受让人配置文件上的技能匹配（运行 `hermes skills list` 查看可用的技能）；没有运行时安装。

### 编排器技能

**一个行为良好的编排器不会自己动手工作。** 它将用户的目标分解为任务，链接它们，将每个任务分配给您设置的其中一个配置文件，然后退后一步。`kanban-orchestrator` 技能将其编码为工具调用模式：反诱惑规则，一个第 0 步的配置文件发现提示（调度器在遇到未知的受让人名称时会静默失败，因此编排器必须将每张卡片都锚定在您机器上实际存在的配置文件上），以及一个以 `kanban_create` / `kanban_link` / `kanban_comment` 为基础的分解剧本。

一个典型的编排器执行顺序（两个并行的研究者交接给一个写作者）：

```
# 来自用户的目标："起草一篇关于 ICP 融资格局的启动文章"
kanban_create(title="研究 ICP 融资，北美视角",  assignee="researcher-a", body="…")  # → t_r1
kanban_create(title="研究 ICP 融资，欧洲视角",  assignee="researcher-b", body="…")  # → t_r2
kanban_create(
    title="将 ICP 融资研究综合成启动文章草稿",
    assignee="writer",
    parents=["t_r1", "t_r2"],        # 当两位研究者都完成时，状态提升为 'ready'
    body="一页纸，中立语气，行内引用来源",
)                                     # → t_w1
# 可选：事后添加后来发现的跨领域依赖，无需重新创建任务
kanban_link(parent_id="t_r1", child_id="t_followup")
kanban_complete(
    summary="已分解为 2 个并行的研究任务 → 1 个综合任务；当两位研究者都完成时写作者开始工作",
)
```

`kanban-orchestrator` 是一个捆绑技能。在安装和更新期间同步到每个配置文件中，因此没有单独的技能中心安装步骤。验证它是否存在于您的编排器配置文件中：

```bash
hermes -p orchestrator skills list | grep kanban-orchestrator
```

如果捆绑副本丢失，请为该配置文件恢复它：

```bash
hermes -p orchestrator skills reset kanban-orchestrator --restore
```

为了获得最佳效果，将其与一个工具集仅限于看板操作（`kanban`、`gateway`、`memory`）的配置文件配对，这样编排器即使尝试也无法执行实现任务。

## 仪表盘 (GUI)

`/kanban` CLI 和斜杠命令足以在无头模式下运行看板，但可视化看板通常更适合作为需要人类参与的界面：用于分类处理、跨配置文件监督、阅读评论线程以及在列间拖动卡片。Hermes 将此作为**内置仪表盘插件**在 `plugins/kanban/` 提供——不是核心功能，也不是单独服务——遵循 [扩展仪表盘](./extending-the-dashboard) 中阐述的模式。

使用以下方式打开：

```bash
hermes kanban init      # 一次性操作：创建 kanban.db（如果尚未存在）
hermes dashboard        # 导航栏中出现 "Kanban" 选项卡，位于 "Skills" 之后
```

### 插件功能

- 一个 **Kanban** 选项卡，每列对应一个状态：`triage`、`todo`、`ready`、`running`、`blocked`、`done`（开启开关后还会有 `archived`）。
  - `triage` 是存放粗略想法的分类列。默认情况下 (`kanban.auto_decompose: true`)，调度器会自动对落到此处的任务运行**分解器**——编排配置文件读取粗略想法，查看您的配置文件列表（包含描述），并将任务扇出（fan out）为一个小型子任务图，路由到最合适的专家。原始任务作为所有子任务的父任务保持存活，以便当所有子任务完成时，编排器能再次唤醒并判断完成情况。点击页面顶部的 **Orchestration: Auto/Manual** 药丸按钮（或设置 `kanban.auto_decompose: false`）可切换到手动模式，在该模式下，分类任务会保持原位，直到您点击卡片上的 **⚗ Decompose** 或运行 `hermes kanban decompose <id>`。对于不需要扇出（fan-out）的任务（或没有编排器配置文件的场景），**✨ Specify** 按钮通过相同的 LLM 机制执行单任务规范重写（包含目标、方法、验收标准的标题和正文）。参见下文 [自动与手动编排](#auto-vs-manual-orchestration)。
- 卡片显示任务 ID、标题、优先级徽章、租户标签、分配的配置文件、评论/链接计数、**进度药丸**（当任务有依赖时显示 `N/M` 子任务完成），以及 "created N ago"（创建于 N 前）。每张卡片的复选框支持多选。
- **Running 列内的按配置文件分区** — 工具栏复选框可切换 Running 列是否按负责人分组显示。
- **通过 WebSocket 实时更新** — 插件以短轮询间隔监控仅追加的 `task_events` 表；当任何配置文件（CLI、网关或其他仪表盘标签页）操作时，看板会立即反映变化。重载经过防抖处理，因此一连串事件只会触发一次重新获取。
- **拖放**卡片以更改状态。放置操作会发送 `PATCH /api/plugins/kanban/tasks/:id`，该请求通过与 CLI 使用的相同的 `kanban_db` 代码路由——三个界面永远不可能不同步。移入破坏性状态（`done`、`archived`、`blocked`）时会提示确认。触摸设备使用基于指针的替代方案，因此该看板可在平板电脑上使用。
- **内联创建** — 点击任意列标题的 `+` 号，可输入标题、负责人、优先级，并（可选地）通过下拉菜单选择现有任务作为父任务。按 Enter 创建任务，按 Shift+Enter 在标题字段中插入换行，或按 Escape 取消。在 Triage 列中创建会自动将新任务放入分类列。
- **多选与批量操作** — 按住 Shift/Ctrl 点击卡片或勾选其复选框以将其加入选择。顶部会出现一个批量操作栏，支持批量状态转换、归档和重新分配（通过配置文件下拉菜单，或选择 "(unassign)"）。破坏性批量操作会首先确认。按 ID 的部分失败会被报告，但不会中止其余操作。
- **点击卡片**（不按 Shift/Ctrl）会打开一个侧边抽屉（Escape 或点击外部可关闭），包含：
  - **可编辑标题** — 点击标题可重命名。
  - **可编辑负责人/优先级** — 点击元数据行可重写。
  - **可编辑描述** — 默认以 Markdown 渲染（支持标题、粗体、斜体、行内代码、围栏代码块、`http(s)` / `mailto:` 链接、无序列表），并有一个 "edit" 按钮可切换为文本区域。Markdown 渲染器是一个小型、防 XSS 的安全渲染器——每次替换都在 HTML 转义后的输入上运行，仅允许 `http(s)` / `mailto:` 链接通过，并且始终设置 `target="_blank"` 和 `rel="noopener noreferrer"`。
  - **依赖关系编辑器** — 父任务和子任务的标签（chip）列表，每个标签带一个 `×` 以解除链接，另加下拉菜单供添加新的父任务或子任务。循环依赖尝试会在服务端被拒绝，并给出明确消息。
  - **状态操作行**（→ 分类 / → 就绪 / → 运行中 / 阻塞 / 取消阻塞 / 完成 / 归档），破坏性转换会有确认提示。对于 **Triage** 列中的卡片，该行还提供两个 LLM 驱动的操作：**⚗ Decompose** 会将任务扇出（fan out）为一个子任务图，根据描述路由到专家配置文件（这是编排器驱动的路径）；**✨ Specify** 则执行单任务规范重写。当 LLM 认为任务不适合扇出时，Decompose 会回退到 specify 式的提升，因此它是严格超集。两者均可通过 CLI (`hermes kanban decompose <id>` / `specify <id>` / `--all`)、任意网关平台 (`/kanban decompose <id>`) 访问，也可通过 `POST /api/plugins/kanban/tasks/:id/decompose` 和 `…/specify` 以编程方式调用。在 `config.yaml` 中的 `auxiliary.kanban_decomposer` 和 `auxiliary.triage_specifier` 下配置所用模型。
  - 结果部分（同样以 Markdown 渲染）、支持按 Enter 提交的评论线程、最后 20 个事件。
- **工具栏过滤器** — 自由文本搜索、租户下拉菜单（默认为 `config.yaml` 中的 `dashboard.kanban.default_tenant`）、负责人下拉菜单、"显示已归档" 开关、"按配置文件分区" 开关，以及一个 **Nudge dispatcher**（催促调度器）按钮，这样您就无需等待下一个 60 秒的时钟周期。

视觉上，目标是类似 Linear / Fusion 的布局：深色主题、带计数的列标题、彩色状态点、用于优先级和租户的药丸标签。插件仅读取主题 CSS 变量（`--color-*`、`--radius`、`--font-mono` 等），因此会随着活动的仪表盘主题自动换肤。

### 自动与手动编排

看板有两种方式处理您放入 Triage 列的任务：

**自动（默认）** — `kanban.auto_decompose: true`。网关内嵌的调度器在每个时钟周期运行**分解器**，受 `kanban.auto_decompose_per_tick`（默认为每个周期 3 个任务）限制，因此批量加载分类任务不会导致辅助 LLM 额度激增。分解器读取粗略想法，查看您安装的配置文件及其描述，并要求 LLM 生成 JSON 任务图：生成哪些任务、分配给谁、以及它们之间的依赖关系。原始的分类任务成为图中每个叶子节点的父任务，因此它会保持存活直到整个图完成——然后被提升回 `ready` 状态，以便其负责人（编排配置文件）判断完成情况，并在工作未完成时添加更多任务。这就是 "写一句话，然后走开" 的工作流。

**手动** — `kanban.auto_decompose: false`。分类任务会保持原位，直到您采取行动。点击卡片上的 **⚗ Decompose** 按钮，运行 `hermes kanban decompose <id>`（或 `--all`），或在聊天中使用 `/kanban decompose <id>`。这符合看板在分解器出现之前的行为，当您想完全控制何时运行何任务时很有用。

在看板页面顶部的 **Orchestration: Auto/Manual** 药丸按钮处切换模式（绿色 = 自动，灰色 = 手动），或直接编辑 `config.yaml`。两种模式与 `hermes kanban specify` 共存——当您不需要扇出时，它仍可作为单任务规范重写使用。

分解器的路由决策依赖于配置文件描述，这是一种通过 `hermes profile create --description "..."`、`hermes profile describe <name> --text "..."`、`hermes profile describe <name> --auto`（根据配置文件的已安装技能和模型由 LLM 生成）或仪表盘中展开的 **Orchestration settings**（编排设置）面板内的每配置文件编辑器来设置的每配置文件标签原语。没有描述的配置文件仍会出现在列表中——它们可通过名称路由，只是精确度较低。分解器永远不会将子任务路由到 `assignee=None`：当 LLM 选择了一个未知的配置文件时，该子任务会被路由到 `kanban.default_assignee`（如果该值未设置，则回退到活动默认配置文件）。

配置旋钮（均在 `~/.hermes/config.yaml` 的 `kanban:` 下）：

| 键 | 默认值 | 用途 |
|---|---|---|
| `auto_decompose` | `true` | 调度器在每个时钟周期自动运行分解器。 |
| `auto_decompose_per_tick` | `3` | 每个调度器时钟周期的最大分解次数。超出部分延迟到下个周期。 |
| `orchestrator_profile` | `""` | 负责分解的配置文件。为空时回退到活动默认配置文件。 |
| `default_assignee` | `""` | 当 LLM 选择了一个未知的配置文件时，子任务落入此处。为空时回退到活动默认值。 |

以及两个辅助 LLM 插槽：

| 键 | 用途 |
|---|---|
| `auxiliary.kanban_decomposer` | 生成任务图的模型（由 Decompose 调用）。设置 `provider`/`model` 以覆盖主聊天模型。 |
| `auxiliary.profile_describer` | 自动生成配置文件描述的模型（由 `hermes profile describe --auto` 调用）。 |

### 架构

GUI 严格是一个**通过数据库读取 + 通过 kanban_db 写入**的层，自身没有任何业务逻辑：

<!-- ascii-guard-ignore -->
```
┌────────────────────────┐      WebSocket (tails task_events)
│   React SPA (插件)     │ ◀──────────────────────────────────┐
│   HTML5 拖放功能       │                                    │
└──────────┬─────────────┘                                    │
           │ REST over fetchJSON                              │
           ▼                                                  │
┌────────────────────────┐     写入调用 kanban_db.*            │
│  FastAPI 路由器        │     直接 —— 相同的代码路径           │
│  plugins/kanban/       │     CLI 的 /kanban 动词所使用的      │
│  dashboard/plugin_api.py                                    │
└──────────┬─────────────┘                                    │
           │                                                  │
           ▼                                                  │
┌────────────────────────┐                                    │
│  ~/.hermes/kanban.db   │ ───── 追加 task_events ─────────────┘
│  (WAL, 共享)           │
└────────────────────────┘
```
<!-- ascii-guard-ignore-end -->

### REST 接口

所有路由均挂载在 `/api/plugins/kanban/` 下，并通过仪表板的临时会话令牌进行保护：

| 方法   | 路径                                            | 用途                                                                                             |
|--------|-----------------------------------------------|--------------------------------------------------------------------------------------------------|
| `GET`  | `/board?tenant=<name>&include_archived=…`     | 按状态列分组的完整看板，外加用于过滤下拉菜单的租户和负责人信息                                         |
| `GET`  | `/tasks/:id`                                  | 任务 + 评论 + 事件 + 链接                                                                         |
| `POST` | `/tasks`                                      | 创建（包装了 `kanban_db.create_task`，接受 `triage: bool` 和 `parents: [id, …]` 参数）             |
| `PATCH`| `/tasks/:id`                                  | 更新状态 / 负责人 / 优先级 / 标题 / 正文 / 结果                                                    |
| `POST` | `/tasks/bulk`                                 | 将相同的补丁（状态 / 归档 / 负责人 / 优先级）应用于 `ids` 列表中的每个 id。单个 id 的失败会报告，但不会中止其他操作 |
| `POST` | `/tasks/:id/comments`                         | 追加评论                                                                                         |
| `POST` | `/tasks/:id/specify`                          | 运行分类指定器 —— 辅助性 LLM 完善任务正文并将其从 `triage` 提升到 `todo` 状态。返回 `{ok, task_id, reason, new_title}`；`ok=false` 并带有人类可读原因（如“不在分类中”/ 无辅助客户端 / LLM 错误）是 200 响应，而非 4xx |
| `POST` | `/tasks/:id/decompose`                        | 运行看板分解器 —— 辅助性 LLM 生成任务图，辅助工具原子性地创建子任务 + 链接根任务 + 将 `triage` 翻转为 `todo`。返回 `{ok, task_id, reason, fanout, child_ids, new_title}`。LLM 错误时返回 200 的约定与 `/specify` 相同。 |
| `GET`  | `/profiles`                                   | 列出已安装的配置文件及其描述（供仪表板的配置描述编辑器和编排器选择器使用）。                            |
| `PATCH`| `/profiles/:name`                             | 设置或清除某个配置文件的描述（用户编写 —— `description_auto: false`）。返回 `{ok, profile, description}`。 |
| `POST` | `/profiles/:name/describe-auto`              | 通过 `auxiliary.profile_describer` 为配置文件生成描述。持久化时设置 `description_auto: true`，以便仪表板可以显示“待审核”徽章。 |
| `GET`  | `/orchestration`                              | 读取看板编排设置（`orchestrator_profile`、`default_assignee`、`auto_decompose`）以及回退后的 *解析后的* 有效值。 |
| `PUT`  | `/orchestration`                              | 更新 `config.yaml` 中三个编排键中的一个或多个。验证非空的配置文件名称确实存在。                      |
| `POST` | `/links`                                      | 添加依赖关系（`parent_id` → `child_id`）                                                         |
| `DELETE`| `/links?parent_id=…&child_id=…`               | 移除依赖关系                                                                                     |
| `POST` | `/dispatch?max=…&dry_run=…`                   | 推送调度器 —— 跳过 60 秒的等待                                                                     |
| `GET`  | `/config`                                     | 从 `config.yaml` 读取 `dashboard.kanban` 偏好设置 —— `default_tenant`、`lane_by_profile`、`include_archived_by_default`、`render_markdown` |
| `WS`   | `/events?since=<event_id>`                    | `task_events` 行的实时流                                                                           |

每个处理程序都是一个薄封装层 —— 该插件大约有 700 行 Python 代码（路由器 + WebSocket 追踪器 + 批量处理器 + 配置读取器），不添加任何新的业务逻辑。一个小型的 `_conn()` 辅助函数会在每次读取和写入时自动初始化 `kanban.db`，因此无论是用户先打开了仪表板、直接访问了 REST API，还是运行了 `hermes kanban init`，全新的安装都能正常工作。

### 仪表板配置

在 `~/.hermes/config.yaml` 中 `dashboard.kanban` 下的任何这些键都会更改该标签页的默认设置 —— 插件在加载时通过 `GET /config` 读取它们：

```yaml
dashboard:
  kanban:
    default_tenant: acme              # 预选租户过滤器
    lane_by_profile: true             # "按配置文件分列"切换的默认值
    include_archived_by_default: false
    render_markdown: true             # 设置为 false 可进行纯 `<pre>` 渲染
```

每个键都是可选的，如果未指定则回退到所示的默认值。

### 安全模型

仪表板的 HTTP 认证中间件[明确跳过了 `/api/plugins/` 路径](./extending-the-dashboard#backend-api-routes) —— 插件路由在设计上是未认证的，因为仪表板默认绑定到 localhost。这意味着看板的 REST 接口可以被主机上的任何进程访问。

WebSocket 需要额外的一步：它要求将仪表板的临时会话令牌作为 `?token=…` 查询参数（浏览器无法在升级请求上设置 `Authorization` 头），这与浏览器内 PTY 桥接使用的模式相同。

如果你运行 `hermes dashboard --host 0.0.0.0`，每个插件路由 —— 包括看板 —— 都将变得可从网络访问。**不要在共享主机上这样做。** 看板包含任务正文、评论和工作区路径；攻击者访问这些路由就能读取你整个协作表面，并且还可以创建 / 重新分配 / 归档任务。

`~/.hermes/kanban.db` 中的任务在设计上是与配置文件无关的（这是协调的原语）。如果你通过 `hermes -p <profile> dashboard` 打开仪表板，看板仍然会显示主机上任何其他配置文件创建的任务。同一个用户拥有所有配置文件，但如果多个角色共存，这一点值得了解。

### 实时更新

`task_events` 是一个仅追加的 SQLite 表，具有单调递增的 `id`。WebSocket 端点记录每个客户端最后看到的事件 id，并在新行到达时进行推送。当事件突发到达时，前端会重新加载（开销很小的）看板端点 —— 这比尝试根据每种事件类型修补本地状态更简单、更正确。WAL 模式意味着读取循环永远不会阻塞调度器的 `BEGIN IMMEDIATE` 事务请求。

### 扩展性

该插件使用标准的 Hermes 仪表板插件契约 —— 完整的清单参考、外壳插槽、页面作用域插槽和插件 SDK，请参见 [扩展仪表板](./extending-the-dashboard)。额外的列、自定义卡片外观、租户过滤的布局，或完整的 `tab.override` 替换都可以在不分叉此插件的情况下实现。

要在不移除的情况下禁用：在 `config.yaml` 中添加 `dashboard.plugins.kanban.enabled: false`（或删除 `plugins/kanban/dashboard/manifest.json`）。

### 范围边界

图形用户界面被故意设计得很薄。插件所做的一切都可以从 CLI 访问；该插件只是让人类使用起来更舒适。自动分配、预算、治理关卡和组织架构图视图仍属于用户空间 —— 一个路由器配置文件、另一个插件，或对 `tools/approval.py` 的复用 —— 正如设计规范中“范围外”部分所列出的那样。

## CLI 命令参考

这是**您**（或脚本、定时任务、仪表板）用来驱动看板的界面。在调度器内部运行的智能体则使用 `kanban_*` [工具界面](#how-workers-interact-with-the-board) 执行相同的操作——此处的 CLI 和那里的工具都通过 `kanban_db` 进行路由，因此两个界面在结构上是一致的。

```
hermes kanban init                                     # 创建 kanban.db 并打印守护进程提示
hermes kanban create "<title>" [--body ...] [--assignee <profile>]
                                [--parent <id>]... [--tenant <name>]
                                [--workspace scratch|worktree|worktree:<path>|dir:<path>]
                                [--branch <name>]
                                [--priority N] [--triage] [--idempotency-key KEY]
                                [--max-runtime 30m|2h|1d|<seconds>]
                                [--max-retries N]
                                [--skill <name>]...
                                [--json]
hermes kanban list [--mine] [--assignee P] [--status S] [--tenant T] [--archived] [--json]
hermes kanban show <id> [--json]
hermes kanban assign <id> <profile>                    # 或使用 'none' 取消分配
hermes kanban link <parent_id> <child_id>
hermes kanban unlink <parent_id> <child_id>
hermes kanban claim <id> [--ttl SECONDS]
hermes kanban comment <id> "<text>" [--author NAME]

# 批量操作动词 — 接受多个 id：
hermes kanban complete <id>... [--result "..."]
hermes kanban block <id> "<reason>" [--ids <id>...]
hermes kanban unblock <id>...
hermes kanban archive <id>...

hermes kanban tail <id>                                # 跟踪单个任务的事件流
hermes kanban watch [--assignee P] [--tenant T]        # 将所有事件实时流式传输到终端
        [--kinds completed,blocked,…] [--interval SECS]
hermes kanban heartbeat <id> [--note "..."]            # 用于长时间操作的智能体活跃信号
hermes kanban runs <id> [--json]                       # 尝试历史（每次运行一行）
hermes kanban assignees [--json]                       # 磁盘上的配置文件 + 每个分配者的任务计数
hermes kanban dispatch [--dry-run] [--max N]           # 单次执行
        [--failure-limit N] [--json]
hermes kanban daemon --force                           # 已弃用 — 独立调度器（改用 `hermes gateway start`）
        [--failure-limit N] [--pidfile PATH] [-v]
hermes kanban stats [--json]                           # 按状态 + 按分配者的计数
hermes kanban log <id> [--tail BYTES]                  # 来自 ~/.hermes/kanban/logs/ 的智能体日志
hermes kanban notify-subscribe <id>                    # 网关桥接钩子（由网关中的 /kanban 使用）
        --platform <name> --chat-id <id> [--thread-id <id>] [--user-id <id>]
hermes kanban notify-list [<id>] [--json]
hermes kanban notify-unsubscribe <id>
        --platform <name> --chat-id <id> [--thread-id <id>]
hermes kanban context <id>                             # 智能体所看到的内容
hermes kanban specify [<id> | --all] [--tenant T]      # 将分诊列中的想法充实为完整规格并提升到待办事项
        [--author NAME] [--json]
hermes kanban gc [--event-retention-days N]            # 工作区 + 旧事件 + 旧日志
        [--log-retention-days N]
```

所有命令也可以在交互式 CLI 和消息网关中作为斜杠命令使用（参见下方的 [`/kanban` 斜杠命令](#kanban-slash-command)）。

`--max-retries` 是针对调度器的每任务级断路器覆盖。`--max-retries 1` 会在第一次非成功尝试时阻塞任务，而 `--max-retries 3` 允许两次重试，并在第三次失败时阻塞。省略此选项将使用 `config.yaml` 中的 `kanban.failure_limit`，然后是内置默认值。

## `/kanban` 斜杠命令 {#kanban-slash-command}

每个 `hermes kanban <action>` 动词也可以作为 `/kanban <action>` 访问——既可以在交互式 `hermes chat` 会话**内部**使用，也可以从任何网关平台（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost、电子邮件、短信）使用。这两种界面都调用完全相同的 `hermes_cli.kanban.run_slash()` 入口点，该入口点复用了 `hermes kanban` 的 argparse 树，因此参数界面、标志和输出格式在 CLI、`/kanban` 和 `hermes kanban` 中完全一致。您无需离开聊天界面即可控制看板。

```
/kanban list
/kanban show t_abcd
/kanban create "write launch post" --assignee writer --parent t_research
/kanban comment t_abcd "looks good, ship it"
/kanban unblock t_abcd
/kanban dispatch --max 3
/kanban specify t_abcd                  # 将一个筛选描述充实为详细规格
/kanban specify --all --tenant engineering  # 扫描某个租户中的所有筛选任务
```

引用多字参数的方式与在 shell 中相同——`run_slash` 使用 `shlex.split` 解析行的其余部分，因此 `"..."` 和 `'...'` 都有效。

### 运行中使用：`/kanban` 绕过运行中的智能体保护

网关通常在智能体仍在思考时将斜杠命令和用户消息排队——这就是防止您在第一次请求进行中意外启动第二次交互的原因。**`/kanban` 明确豁免于此保护。** 看板位于 `~/.hermes/kanban.db`，不在运行中的智能体状态内，因此读取（`list`、`show`、`context`、`tail`、`watch`、`stats`、`runs`）和写入（`comment`、`unblock`、`block`、`assign`、`archive`、`create`、`link`、…）都会立即执行，即使在回合中途也是如此。

这正是分离的核心目的：

- 工作者因等待同级而阻塞 → 您从手机发送 `/kanban unblock t_abcd`，调度器会在下一个循环时拾取该同级。被阻塞的工作者不会被中断——它只是停止被阻塞。
- 您发现一个需要人工上下文的卡片 → `/kanban comment t_xyz "use the 2026 schema, not 2025"` 会落到任务线程上，该任务的*下一次*运行将在 `kanban_show()` 中读取它。
- 您想知道您的集群在做什么而不必停止编排器 → `/kanban list --mine` 或 `/kanban stats` 可以在不触及主对话的情况下检查看板。

### `/kanban create` 时自动订阅（仅限网关）

当您通过网关使用 `/kanban create "…"` 创建任务时，发起聊天（平台 + 聊天 ID + 线程 ID）会自动订阅该任务的终止事件（`completed`、`blocked`、`gave_up`、`crashed`、`timed_out`）。每个终止事件您都会收到一条消息——包括在 `completed` 时工作者结果摘要的第一行——无需轮询或记住任务 ID。

```
you> /kanban create "transcribe today's podcast" --assignee transcriber
bot> Created t_9fc1a3  (ready, assignee=transcriber)
     (subscribed — you'll be notified when t_9fc1a3 completes or blocks)

… ~8 minutes later …

bot> ✓ t_9fc1a3 completed by transcriber
     transcribed 42 minutes, saved to podcast/2026-05-04.md
```

一旦任务达到 `done` 或 `archived`，订阅会自动移除。如果您使用 `--json`（机器输出）进行创建脚本操作，则会跳过自动订阅——因为假设是脚本调用者希望通过 `/kanban notify-subscribe` 显式管理订阅。

### 消息传递中的输出截断

网关平台有实际的消息长度上限。如果 `/kanban list`、`/kanban show` 或 `/kanban tail` 产生超过约 3800 个字符的输出，响应将被截断，并带有 `… (truncated; use \`hermes kanban …\` in your terminal for full output)` 页脚。CLI 界面没有这样的上限。

### 自动补全

在交互式 CLI 中，输入 `/kanban ` 并按 Tab 键可以循环浏览内置的子命令列表（`list`、`ls`、`show`、`create`、`assign`、`link`、`unlink`、`claim`、`comment`、`complete`、`block`、`unblock`、`archive`、`tail`、`dispatch`、`context`、`init`、`gc`）。CLI 参考中列出的其余动词（`watch`、`stats`、`runs`、`log`、`assignees`、`heartbeat`、`notify-subscribe`、`notify-list`、`notify-unsubscribe`、`daemon`）也可以使用——只是它们尚未包含在自动补全提示列表中。

## 协作模式

看板无需任何新原语即可支持以下八种模式：

| 模式 | 形状 | 示例 |
|---|---|---|
| **P1 扇出** | N 个同级，相同角色 | "并行研究 5 个角度" |
| **P2 流水线** | 角色链：侦察员 → 编辑 → 作者 | 每日简报组装 |
| **P3 投票/法定人数** | N 个同级 + 1 个聚合器 | 3 个研究员 → 1 个审阅者选择 |
| **P4 长期运行日志** | 相同配置 + 共享目录 + 定时任务 | Obsidian 知识库 |
| **P5 人在回路** | 工作者阻塞 → 用户评论 → 解除阻塞 | 模糊的决策 |
| **P6 `@提及`** | 从文本中内联路由 | `@reviewer 看看这个` |
| **P7 线程作用域工作区** | 线程中的 `/kanban here` | 每个项目的网关线程 |
| **P8 集群养殖** | 一个配置文件，N 个主题 | 50 个社交账号 |
| **P9 筛选指定器** | 粗略想法 → `triage` → `hermes kanban specify` 扩充正文 → `todo` | "将这一行描述变成详细规格的任务" |

每个模式的实际示例，请参见 `docs/hermes-kanban-v1-spec.pdf`。

## 多租户用法

当一个专业集群服务多个业务时，为每个任务添加租户标签：

```bash
hermes kanban create "monthly report" \
    --assignee researcher \
    --tenant business-a \
    --workspace dir:~/tenants/business-a/data/
```

工作者接收 `$HERMES_TENANT`，并使用前缀对其内存写入进行命名空间划分。看板、调度器和配置文件定义都是共享的；只有数据是有作用域的。

## 网关通知

当您通过网关（Telegram、Discord、Slack 等）运行 `/kanban create …` 时，发起聊天会自动订阅新任务。网关的后台通知器每几秒钟轮询一次 `task_events`，并向该聊天传递每个终止事件（`completed`、`blocked`、`gave_up`、`crashed`、`timed_out`）的一条消息。已完成的任务还会发送工作者 `--result` 的第一行，这样您无需使用 `/kanban show` 就能看到结果。

您可以从 CLI 显式管理订阅——当脚本/定时任务想要通知一个并非源自其本身的聊天时很有用：

```bash
hermes kanban notify-subscribe t_abcd \
    --platform telegram --chat-id 12345678 --thread-id 7
hermes kanban notify-list
hermes kanban notify-unsubscribe t_abcd \
    --platform telegram --chat-id 12345678 --thread-id 7
```

一旦任务达到 `done` 或 `archived`，订阅会自动移除；无需手动清理。

## 运行 — 每次尝试一行

任务是工作的逻辑单元；**运行**是执行任务的一次尝试。当调度器认领一个就绪任务时，它会在 `task_runs` 中创建一行，并将 `tasks.current_run_id` 指向该行。当该次尝试结束（完成、阻塞、崩溃、超时、派生失败、回收）时，运行行会以一个 `outcome` 结束，任务的指针被清空。一个被尝试三次的任务会有三行 `task_runs` 记录。

为什么用两张表而不是直接修改任务本身：你需要**完整的尝试历史**用于真实的复盘（"第二次审核尝试到了批准阶段，第三次合并了"），并且你需要一个干净的地方来存放每次尝试的元数据 — 哪些文件更改了，哪些测试运行了，审核者注意到了哪些发现。这些是运行事实，而非任务事实。

运行也是**结构化交接**的所在之处。当一个工作单元完成任务（通过 `kanban_complete(...)`）时，它可以传递：

- `summary`（工具参数）/ `--summary`（CLI）— 人工交接；记录在运行上；下游子节点可以在其 `build_worker_context` 中看到它。
- `metadata`（工具参数）/ `--metadata`（CLI）— 运行上的自由格式 JSON 字典；子节点可以看到它被序列化后与摘要放在一起。
- `result`（工具参数）/ `--result`（CLI）— 简短日志行，记录在任务行上（遗留字段，为向后兼容保留）。

下游子节点会为每个父级读取最近一次已完成运行的摘要和元数据。重试的工作单元会读取其自身任务上之前尝试的结果（结果、摘要、错误），这样它们就不会重复已经失败的路径。

```
# 工作单元实际执行的操作 — 来自智能体循环内部的一个工具调用：
kanban_complete(
    summary="实现了令牌桶，基于 user_id 带 IP 回退的键，所有测试通过",
    metadata={"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14},
    result="限速器已上线",
)
```

当你（作为人工操作者）需要关闭一个工作单元无法处理的任务（例如被遗弃的任务，或你从仪表盘手动标记为完成的任务）时，同样的交接也可以通过 CLI 实现：

```bash
hermes kanban complete t_abcd \
    --result "限速器已上线" \
    --summary "实现了令牌桶，基于 user_id 带 IP 回退的键，所有测试通过" \
    --metadata '{"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14}'

# 查看重试任务的尝试历史：
hermes kanban runs t_abcd
#   #  结果           轮廓             耗时     开始时间
#   1  blocked       worker               12s  2026-04-27 14:02
#        → BLOCKED: 需要决定限速键
#   2  completed     worker                8m   2026-04-27 15:18
#        → 实现了令牌桶，基于 user_id 带 IP 回退的键
```

运行在仪表盘上可见（抽屉中的运行历史部分，每次尝试一行带颜色的行）以及 REST API 上（`GET /api/plugins/kanban/tasks/:id` 返回一个 `runs[]` 数组）。`PATCH /api/plugins/kanban/tasks/:id` 配合 `{status: "done", summary, metadata}` 会将两者都转发给内核，因此仪表盘的“标记完成”按钮等同于 CLI。`task_events` 行携带它们所属的 `run_id`，以便 UI 可以按尝试分组，并且 `completed` 事件会在其负载中嵌入第一行摘要（上限为 400 个字符），这样网关通知器可以在不进行第二次 SQL 查询的情况下呈现结构化交接。

**批量关闭警告。** `hermes kanban complete a b c --summary X` 会被拒绝 — 结构化交接是针对每次运行的，因此将相同的摘要复制粘贴到 N 个任务几乎总是错误的。不带 `--summary` / `--metadata` 的批量关闭仍然有效，适用于常见的“我完成了一堆管理任务”的情况。

**状态变更导致的回收运行。** 如果你在仪表盘中将一个运行中的任务从 `running` 状态拖走（回到 `ready`，或直接到 `todo`），或者归档一个仍在运行的任务，正在进行的运行会以 `outcome='reclaimed'` 结束，而不是被孤立。当 `tasks.current_run_id` 为 `NULL` 时，`task_runs` 行始终处于终态，反之亦然 — 这个不变式在 CLI、仪表盘、调度器和通知器中都成立。

**针对从未认领完成的合成运行。** 完成或阻塞一个从未被认领的任务（例如，人工从仪表盘使用摘要关闭一个 `ready` 任务，或 CLI 用户运行 `hermes kanban complete <ready-task> --summary X`）否则会丢失交接。相反，内核会插入一个零时长的运行行（`started_at == ended_at`），携带摘要 / 元数据 / 原因，以便尝试历史保持完整。`completed` / `blocked` 事件的 `run_id` 指向该行。

**实时抽屉刷新。** 当仪表盘的 WebSocket 事件流为用户正在查看的任务报告新事件时，抽屉会自行重新加载（通过一个线程到其 `useEffect` 依赖列表中的每任务事件计数器）。关闭和重新打开抽屉不再是查看运行的新行或更新结果所必需的。

### 向前兼容

`tasks` 上的两个可空列被保留用于 v2 工作流路由：`workflow_template_id`（此任务所属的模板）和 `current_step_key`（该模板中哪个步骤处于活动状态）。v1 内核在路由时忽略它们，但允许客户端写入它们，因此 v2 版本可以在不进行另一次模式迁移的情况下添加路由机制。

## 事件参考

每次状态转换都会在 `task_events` 中追加一行记录。每行都带有一个可选的 `run_id`，以便用户界面可以按尝试分组事件。事件种类分为三个类别，便于过滤（`hermes kanban watch --kinds completed,gave_up,timed_out`）：

**生命周期**（关于任务作为逻辑单元的变化）：

| 种类 | 载荷 | 触发条件 |
|---|---|---|
| `created` | `{assignee, status, parents, tenant}` | 任务被插入。`run_id` 为 `NULL`。 |
| `promoted` | — | `todo → ready`，因为所有父任务都已 `done`。`run_id` 为 `NULL`。 |
| `claimed` | `{lock, expires, run_id}` | 调度器原子性地认领一个 `ready` 状态的任务以进行派生。 |
| `completed` | `{result_len, summary?}` | 工作进程写入了 `--result` / `--summary` 且任务达到 `done`。`summary` 是第一行交接信息（上限400字符）；完整版本保存在运行记录中。如果在一个从未被认领但带有交接字段的任务上调用 `complete_task`，会合成一个零时长的运行，以便 `run_id` 仍指向某处。 |
| `blocked` | `{reason}` | 工作进程或人工将任务切换为 `blocked`。当在一个从未被认领的任务上调用并提供 `--reason` 时，会合成一个零时长的运行。 |
| `unblocked` | — | `blocked → ready`，可以是手动操作或通过 `/unblock` 触发。`run_id` 为 `NULL`。 |
| `archived` | — | 从默认看板中隐藏。如果任务仍在运行，则会携带作为副作用被回收的运行的 `run_id`。 |

**编辑**（由人工驱动的非状态转换的变更）：

| 种类 | 载荷 | 触发条件 |
|---|---|---|
| `assigned` | `{assignee}` | 负责人变更（包括取消分配）。 |
| `edited` | `{fields}` | 标题或正文被更新。 |
| `reprioritized` | `{priority}` | 优先级变更。 |
| `status` | `{status}` | 仪表板通过拖放直接写入了状态（例如 `todo → ready`）。当从 `running` 状态拖出时，会携带被回收的运行的 `run_id`；否则 `run_id` 为 NULL。 |

**工作进程遥测**（关于执行过程，而非逻辑任务）：

| 种类 | 载荷 | 触发条件 |
|---|---|---|
| `spawned` | `{pid}` | 调度器成功启动了一个工作进程。 |
| `heartbeat` | `{note?}` | 工作进程调用 `hermes kanban heartbeat $TASK` 以在长时间操作期间表示存活状态。 |
| `reclaimed` | `{stale_lock}` | 认领 TTL 到期且未完成；任务退回 `ready`。 |
| `crashed` | `{pid, claimer}` | 工作进程 PID 已不存在，但 TTL 尚未到期。 |
| `timed_out` | `{pid, elapsed_seconds, limit_seconds, sigkill}` | 超过 `max_runtime_seconds`；调度器发送 SIGTERM（5秒宽限期后发送 SIGKILL）并重新入队。 |
| `stale` | `{elapsed_seconds, last_heartbeat_at, heartbeat_age_seconds, timeout_seconds, pid, terminated}` | 任务运行时间超过 `kanban.dispatch_stale_timeout_seconds`（默认4小时）且最近一小时内未收到 `kanban_heartbeat`。调度器对本机的工作进程（如有）发送 SIGTERM，并将任务重置为 `ready` 以便重新派发。这不计入失败计数器（stale 是调度器侧的缺失检测，不是工作进程故障）。运行长时间操作的工作进程应至少每小时调用一次 `kanban_heartbeat` 以避免此情况。 |
| `respawn_guarded` | `{reason}` | 调度器在本周期内拒绝重新派生此 ready 任务。原因：`blocker_auth`（上次失败是配额/认证/429错误 —— 等待速率窗口重置），`recent_success`（过去一小时内有一次已完成的运行 —— 等待审核后再重新运行），`active_pr`（近期评论中出现 GitHub PR URL —— 前一个工作进程已打开 PR）。任务保持 `ready` 状态；下一个周期将有机会再次派生。如果根本条件持续存在，正常的 `consecutive_failures` 断路器将在 `failure_limit` 次失败后通过 `gave_up` 自动阻塞。 |
| `spawn_failed` | `{error, failures}` | 一次派生尝试失败（缺少 PATH、工作区无法挂载等）。计数器递增；任务返回 `ready` 重试。 |
| `protocol_violation` | `{pid, claimer, exit_code}` | 工作进程在任务仍为 `running` 状态时成功退出，通常是因为它未调用 `kanban_complete` 或 `kanban_block` 就进行了响应。调度器也会发出 `gave_up` 并立即自动阻塞，而不是重试。 |
| `gave_up` | `{failures, effective_limit, limit_source, error}` | 在连续 N 次非成功尝试后触发断路器。任务自动阻塞并记录最后的错误。有效限制依次解析为任务 `max_retries`、调度器 `failure_limit` / `kanban.failure_limit`、然后是内置默认值。 |

`hermes kanban tail <id>` 用于显示单个任务的这些事件。`hermes kanban watch` 则在整个看板范围内流式传输这些事件。

## 范围之外

看板有意设计为单主机运行。`~/.hermes/kanban.db` 是一个本地 SQLite 文件，调度器在同一台机器上派生工作进程。不支持在两个主机上运行共享看板 —— 没有用于“主机 A 上的工作进程 X，主机 B 上的工作进程 Y”的协调原语，并且崩溃检测路径假设 PID 是本机的。如果你需要多主机支持，请在每个主机上运行独立的看板，并使用 `delegate_task` / 消息队列来桥接它们。

## 设计规范

完整的设计——包括架构、并发正确性、与其他系统的比较、实现计划、风险、未解决的问题——位于 `docs/hermes-kanban-v1-spec.pdf`。请在提交任何行为变更 PR 之前阅读该文档。