---
sidebar_position: 12
title: "看板（多智能体板）"
description: "用于协调多个 Hermes 配置文件的持久性 SQLite 后端任务板"
---

# 看板 — 多智能体配置协作

> **想要一个操作指南吗？** 阅读 [Kanban 操作教程](./kanban-tutorial) — 其中包含四种用户故事（单人开发、集群农场化、带重试的角色流水线、熔断器），并附有每项任务的仪表板截图。本页面是参考资料；而教程则是叙事部分。

Hermes Kanban 是一个持久性的任务板，可供所有 Hermes 配置共享，它允许多个命名智能体在没有脆弱的进程内子智能体群集的情况下协作完成工作。每个任务都是 `~/.hermes/kanban.db` 中的一行记录；每一次交接都是任何人都可以读取和写入的一行记录；每一个工作者都是一个具有自身身份的完整操作系统进程。

### 两种界面：模型通过工具进行交互，你则通过 CLI 进行操作

该看板有两个前端界面，都由同一个 `~/.hermes/kanban.db` 提供支持：

- **智能体们通过专用的 `kanban_*` 工具集来驱动看板** — 包括 `kanban_show`、`kanban_list`、`kanban_complete`、`kanban_block`、`kanban_heartbeat`、`kanban_comment`、`kanban_create`、`kanban_link`、`kanban_unblock`。调度器会使用这些工具来生成每个工作者；编排器配置也可以显式地启用 `kanban` 工具集。模型通过直接调用工具而不是通过 shelling out 到 `hermes kanban` 来读取和路由任务。请参阅下方 [工作者如何与看板交互](#how-workers-interact-with-the-board)。
- **你（以及脚本、定时任务）通过 CLI 上的 `hermes kanban …`、斜杠命令 `/kanban …` 或仪表板来驱动看板**。这些界面是为人类和自动化设计的——它们背后没有工具调用模型支持。

这两种界面都通过相同的 `kanban_db` 层进行路由，因此读取操作可以看到一致的视图，写入操作不会出现漂移。本页面的其余部分展示 CLI 示例，因为它们易于复制粘贴，但每一个 CLI 动词都有一个模型使用的工具调用等效项。

这套系统覆盖了 `delegate_task` 无法处理的工作负载：

- **研究分流** — 平行研究员 + 分析师 + 撰稿人，人工参与。
- **定期操作** — 持续构建周报的日常重复性简报。
- **数字孪生** — 具有持久名称（如 `inbox-triage`、`ops-review`）并随时间积累记忆的助理。
- **工程流水线** — 分解 → 在并行工作树中实现 → 审查 → 迭代 → PR。
- **集群工作** — 一名专家管理 N 个主体（50 个社交媒体账户，12 个被监控的服务）。

有关完整的设计原理、与 Cline Kanban / Paperclip / NanoClaw / Google Gemini Enterprise 的比较分析以及八种规范的协作模式，请参阅仓库中的 `docs/hermes-kanban-v1-spec.pdf`。

## 看板 vs. `delegate_task`

它们看起来相似；但它们不是同一个原始功能。

| | `delegate_task` | Kanban |
|---|---|---|
| 形式 | RPC 调用（分叉 → 合并） | 持久化消息队列 + 状态机 |
| 父级 | 直到子返回才阻塞 | 在 `create` 后即时遗忘 (Fire-and-forget) |
| 子身份 | 匿名的子智能体 | 具有持久记忆的命名配置 |
| 可恢复性 | 无 — 失败即是失败 | 阻塞 → 解除阻塞 → 重新运行；崩溃 → 恢复 |
| 人工介入 | 不支持 | 在任何时间点进行评论/解除阻塞 |
| 任务中的智能体数 | 一次调用 = 一个子智能体 | N 个智能体在任务生命周期内（重试、审查、跟进） |
| 审计追踪 | 上下文压缩时丢失 | SQLite 中永久持久化的行记录 |
| 协调方式 | 层级式（调用者 → 被调用者） | 同伴 — 任何配置都可以读取/写入任何任务 |

**一句话的区别：** `delegate_task` 是一个函数调用；而 Kanban 是一个工作队列，其中每一次交接都是任何配置（或人类）都可以看到和编辑的一行记录。

**当需要父智能体在继续进行之前获得简短的推理答案、不涉及任何人、结果返回到父级上下文时，请使用 `delegate_task`。**

**当工作跨越智能体边界、需要存活重启、可能需要人工输入、可能被不同的角色接手，或者需要在事后被发现时，请使用 Kanban。**

它们是共存的：一个看板工作者在运行时可能会内部调用 `delegate_task`。

## 核心概念

- **Board（看板）** — 一个独立的任务队列，拥有自己的 SQLite DB、工作区目录和调度器循环。单个安装可以有多个看板（例如：每个项目、仓库或领域一个）；请参阅下方的[多项目看板](#boards-multi-project)。单项目用户使用 `default` 看板，在本文档之外绝不会看到“看板”一词。
- **Task（任务）** — 一行记录，包含标题、可选的正文、一名指派人（一个个人资料名称）、状态（`triage | todo | ready | running | blocked | done | archived`）、可选的租户命名空间、可选的幂等性键（用于重试自动化去重）。
- **Link（链接）** — `task_links` 行，记录父子依赖关系。当所有父任务都为 `done` 时，调度器会促成 `todo → ready` 的状态转换。
- **Comment（评论）** — 智能体之间的协议。智能体和人类都会添加评论；当一个工作进程被（重新）生成时，它会将完整的评论线程作为其上下文进行读取。
- **Workspace（工作区）** — 工作进程操作的目录。有三种类型：
  - `scratch` (临时) — 位于 `~/.hermes/kanban/workspaces/<id>/` 下的新临时目录（非默认看板则位于 `~/.hermes/kanban/boards/<slug>/workspaces/<id>/`）。**任务完成后会被删除** — scratch 是按设计而言的短暂的，因此一旦工作进程（或使用 `hermes kanban complete <id>`）将任务标记为完成，该目录就会被清除。如果你想保留工作进程的输出，请改用 `worktree:` 或 `dir:<path>`。在某个安装上首次创建 scratch 工作区时，调度器会记录警告并向任务发出 `tip_scratch_workspace` 事件（可通过 `hermes kanban show <id>` 查看）。
  - `dir:<path>` — 一个现有的共享目录（Obsidian 库、邮件操作目录、每个账户的文件夹）。**必须是绝对路径。** 像 `dir:../tenants/foo/` 这样的相对路径会被拒绝，因为它们会相对于调度器所在的任何当前工作目录解析，这是不明确的，也是一种逃避“多头人”状态（confused-deputy）的手段。该路径在其他方面是可信赖的——那是你的盒子，你的文件系统，工作进程以你的 uid 运行。这是受信任本地用户威胁模型；kanban 是按设计单一主机的。**完成时会被保留。**
  - `worktree` — 用于编码任务的 `.worktrees/<id>/` 下的 git 工作树。使用 `worktree:<path>` 来固定精确的目标路径。工作进程端的 `git worktree add` 会创建它，如果提供了 `--branch` 则会使用该分支。**完成时会被保留。**
- **Dispatcher（调度器）** — 一个长期运行的循环，每 N 秒（默认为 60 秒）：回收陈旧的声明、回收崩溃的工作进程（PID 已消失但 TTL 尚未过期）、提升准备就绪的任务、原子性地进行声明、生成指派的个人资料。默认情况下，它在 **网关内部** 运行 (`kanban.dispatch_in_gateway: true`)。一个调度器会扫描所有看板以完成一次滴答（tick）；工作进程被 `HERMES_KANBAN_BOARD` 固定住，因此它们看不到其他看板。对于同一任务连续发生 `kanban.failure_limit` 次（默认为 2）的生成失败，调度器会自动将其标记为阻止状态，并将最后一条错误作为原因——这可以防止对那些个人资料不存在、工作区无法挂载等任务进行过度操作（thrashing）。
- **Tenant（租户）** — 看板内部可选的字符串命名空间。一个专业的舰队可以服务多个业务（`--tenant business-a`），通过工作区路径和内存键前缀实现数据隔离。租户是一个软过滤器；看板是硬隔离边界。

## 多项目看板 (Boards)

看板允许你将不相关的系列工作——每个项目、仓库或领域一个——分离到独立的队列中。新安装会有一个名为 `default` 的看板（DB 位于 `~/.hermes/kanban.db`，用于向后兼容）。那些只需要单一工作流的用户永远不需要了解看板；这是一个可选功能。

板级隔离是绝对的：

- 每个看板都有一个独立的 SQLite DB (`~/.hermes/kanban/boards/<slug>/kanban.db`)。
- 独立的 `workspaces/` 和 `logs/` 目录。
- 为任务生成的工人**只能**看到他们自己的看板任务——调度器会在子环境中设置 `HERMES_KANBAN_BOARD`，而所有有权限的 `kanban_*` 工具都会读取它。
- 不允许跨看板链接任务（保持模式简单；如果你确实需要跨项目引用，请使用自由文本提及并手动通过 ID 查找）。

### 从 CLI 管理看板

```bash
# 查看磁盘上有什么内容。新安装只显示 "default"。
hermes kanban boards list

# 创建一个新的看板。
hermes kanban boards create atm10-server \
    --name "ATM10 Server" \
    --description "Minecraft modded server ops" \
    --icon 🎮 \
    --switch                   # 可选：设为活动看板

# 在不切换的情况下操作特定看板。
hermes kanban --board atm10-server list
hermes kanban --board atm10-server create "Restart ATM server" --assignee ops

# 更改后续调用所使用的“当前”看板。
hermes kanban boards switch atm10-server
hermes kanban boards show             # 现在谁是活动的？

# 重命名显示名称（slug 是不可变的——它是目录名）。
hermes kanban boards rename atm10-server "ATM10 (Prod)"

# 存档（默认）— 将看板的目录移动到 boards/_archived/<slug>-<ts>/。
# 可以通过将目录移回的方式恢复。
hermes kanban boards rm atm10-server

# 硬删除 — `rm -rf` 看板目录。不可恢复。
hermes kanban boards rm atm10-server --delete
```

看板解析顺序（优先级从高到低）：

1. CLI 调用中的显式 `--board <slug>`。
2. `HERMES_KANBAN_BOARD` 环境变量（由调度器在生成工作进程时设置，因此工人看不到其他看板）。
3. `~/.hermes/kanban/current` — 由 `hermes kanban boards switch` 持久化的 slug。
4. `default`。

Slugs 会被验证：小写字母数字 + 连字符 + 下划线，1-64 个字符，必须以字母数字开头。大写输入会被自动转换为小写。其他任何内容（斜杠、空格、点号、`..`）都会在 CLI 层被拒绝，以防止路径遍历技巧来命名看板。

### 从仪表板管理看板

`hermes dashboard` → Kanban 标签页会在存在多个看板（或任一看板有任务）时，顶部显示一个看板切换器。单看板用户只会看到一个小小的 `+ New board` 按钮；只有当它变得重要时，切换器才会显示出来。

- **看板下拉菜单** — 选择活动看板。你的选择会被保存在浏览器的 `localStorage` 中，因此在不改变你留下的终端窗口的 `current` 指针的情况下保持持久化。
- **+ New board（新建看板）** — 会弹出一个模态框，要求输入 slug、显示名称、描述和图标。提供自动切换到新看板的选项。
- **Archive（存档）** — 仅在非 `default` 看板上显示。确认后，会将看板目录移动到 `boards/_archived/`。

所有仪表板 API 端点都接受 `?board=<slug>` 用于看板范围限定。事件 WebSocket 会在连接时被固定到一个看板；在 UI 中切换会打开一个新的 WS 连接到新的看板。

## 文件附件

任务可以携带文件附件——PDF、图像、源文档——这样工作进程就可以拥有它需要的原始材料，而不需要你将路径粘贴到正文中并祈祷它可以找到它们。

- **Upload（上传）** — 在仪表板抽屉中打开一个任务，使用“附件”部分的 *Upload file* 按钮（一次上传多个文件都可以）。每次上传限制为 25 MB。
- **Storage（存储）** — 文件会存放在默认看板的 `<hermes-home>/kanban/attachments/<task_id>/` 下，或命名看板的 `<hermes-home>/kanban/boards/<slug>/attachments/<task_id>/` 下。设置 `HERMES_KANBAN_ATTACHMENTS_ROOT` 可以固定自定义位置。
- **What the worker sees（工作进程看到的内容）** — 当调度器将任务交给工作进程时，该工作进程的上下文会包含一个列出每个文件名称和其**绝对路径**的“附件”部分。工作进程拥有完整的文件/终端工具访问权限，因此它可以直接读取附件（`read_file`，或像 `pdftotext` 这样的 Shell 工具）。
- **Download / remove（下载/删除）** — 抽屉会列出每个附件，并提供一个下载链接和一个删除（×）控件。删除附件会同时删除元数据行和磁盘上的文件。

:::note 远程终端后端
附件路径是在**本地**终端后端直接解析的，这是 Kanban 工作进程的默认设置。如果你在远程后端（Docker、Modal）上运行工作进程，请将看板的 `attachments/` 目录挂载到沙箱中，以确保工作进程上下文中的绝对路径是可达的。
:::

## 快速入门

下面的命令是**你**（人类）用来设置看板和创建任务的。一旦任务被分配，调度器就会将指定的配置作为工作者启动，然后**模型会通过 `kanban_*` 工具调用而不是 CLI 命令来驱动任务**——请参阅[工作者如何与看板互动](#how-workers-interact-with-the-board)。

```bash
# 1. 创建看板（你）
hermes kanban init

# 2. 启动网关（托管嵌入式调度器）
hermes gateway start

# 3. 创建任务（你——或通过 kanban_create 的编排智能体）
hermes kanban create "research AI funding landscape" --assignee researcher

# 4. 实时查看活动（你）
hermes kanban watch

# 5. 查看看板（你）
hermes kanban list
hermes kanban stats
```

当调度器拾取 `t_abcd` 并启动 `researcher` 配置时，该工作者的模型做的第一件事就是调用 `kanban_show()` 来读取其任务。它不会运行 `hermes kanban show t_abcd`。

### 网关嵌入式调度器（默认）

调度器在网关进程内部运行。无需安装任何东西，也无需管理单独的服务——如果网关正在运行，待办任务将在下一个周期（默认 60 秒）被拾取。

```yaml
# config.yaml
kanban:
  dispatch_in_gateway: true        # default
  dispatch_interval_seconds: 60    # default
```

可以在运行时通过 `HERMES_KANBAN_DISPATCH_IN_GATEWAY=0` 来覆盖配置标志，用于调试。标准网关监督机制适用：直接运行 `hermes gateway start`，或将网关配置为 systemd 用户单元（参见网关文档）。如果没有正在运行的网关，待办任务就会保持原位，直到有网关启动——`hermes kanban create` 会在创建时对此发出警告。

将 `hermes kanban daemon` 作为独立进程运行是**已弃用**的；请使用网关。如果你确实无法运行网关（例如，无头主机策略禁止长期运行的服务），可以使用 `--force` 这个逃生口来维持旧的独立守护程序在一个发布周期内存活，但同时对同一个 `kanban.db` 运行嵌入式调度器和独立守护程序会导致竞态条件，这是不支持的。

### 重试性创建（用于自动化/Webhook）

```bash
# 第一次调用会创建任务。任何使用相同密钥的后续调用都会返回现有任务 ID，而不是重复创建。
hermes kanban create "nightly ops review" \
    --assignee ops \
    --idempotency-key "nightly-ops-$(date -u +%Y-%m-%d)" \
    --json
```

### 批量 CLI 动词

所有生命周期动词都接受多个 ID，因此您可以使用一个命令清理一批任务：

```bash
hermes kanban complete t_abc t_def t_hij --result "batch wrap"
hermes kanban archive  t_abc t_def t_hij
hermes kanban unblock  t_abc t_def
hermes kanban block    t_abc "need input" --ids t_def t_hij
```

## 工作者如何与看板互动

**工作者不会调用 `hermes kanban`。** 当调度器生成一个工作者时，它会在子进程的环境中设置 `HERMES_KANBAN_TASK=t_abcd`，该环境变量会激活模型模式中的专用**看板工具集**。相同的工具集也对那些在工具集配置中启用了 `kanban` 的编排者配置文件是可用的。这些工具通过 Python 的 `kanban_db` 层直接读取和修改看板，与 CLI 相同。一个正在运行的工作者会像调用其他任何工具一样调用它们；它既看不到也不需要 `hermes kanban` CLI。

| 工具 | 用途 | 所需参数 |
|---|---|---|
| `kanban_show` | 读取当前任务（标题、正文、先前的尝试、父级交接、评论、完整的预格式化 `worker_context`）。默认为环境中的任务 ID。 | — |
| `kanban_list` | 列出带有按 `assignee`、`status`、`tenant`、归档可见性和限制等过滤条件的任务摘要。供编排者发现看板工作使用。 | — |
| `kanban_complete` | 使用 `summary` + `metadata` 结构化交接来完成任务。 | 至少包含 `summary` / `result` 中的一项 |
| `kanban_block` | 停止工作并按原因路由：`kind=dependency`（在 `todo` 中等待，自动恢复）、`needs_input`/`capability`/`transient`（暴露给人类）。重复相同类型的重新阻塞会自动升级到 `triage`。 | `reason` |
| `kanban_heartbeat` | 在长时间操作期间发出存活信号。纯粹的副作用。 | — |
| `kanban_comment` | 向任务线程附加一条持久笔记。 | `task_id`, `body` |
| `kanban_create` | (编排者) 扇出到具有 `assignee`、可选 `parents`、`skills` 等属性的子任务。 | `title`, `assignee` |
| `kanban_link` | (编排者) 事后添加一个 `parent_id → child_id` 的依赖边。 | `parent_id`, `child_id` |
| `kanban_unblock` | (编排者) 将被阻塞的任务移回 `ready` 状态。 | `task_id` |

一次典型的工作者流程如下：

```
# 模型工具调用顺序：
kanban_show()                                     # 无参数 — 使用 HERMES_KANBAN_TASK
# (模型读取返回的 worker_context，通过终端/文件工具完成工作)
kanban_heartbeat(note="halfway through — 4 of 8 files transformed")
# (更多工作)
kanban_complete(
    summary="migrated limiter.py to token-bucket; added 14 tests, all pass",
    metadata={"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14},
)
```

一个**编排者**工作者则进行扇出（fan out）：

```
kanban_show()
kanban_create(
    title="research ICP funding 2024-2026",
    assignee="researcher-a",
    body="focus on seed + series A, North America, AI-adjacent",
)
# → 返回 {"task_id": "t_r1", ...}
kanban_create(title="research ICP funding — EU angle", assignee="researcher-b", body="…")
# → 返回 {"task_id": "t_r2", ...}
kanban_create(
    title="synthesize findings into launch brief",
    assignee="writer",
    parents=["t_r1", "t_r2"],                     # 当两者都完成时，提升为 ready
    body="one-pager, 300 words, neutral tone",
)
kanban_complete(summary="decomposed into 2 research tasks + 1 writer; linked dependencies")
```

这些“(编排者)”工具——`kanban_list`、`kanban_create`、`kanban_link`、`kanban_unblock` 和针对外部任务的 `kanban_comment`——是通过相同的工具集提供的；惯例（编码在自动注入的看板指导中）是，工作者配置文件不会进行扇出或路由不相关的任务，而编排者配置文件也不会执行实现工作。由调度器生成的（Dispatcher-spawned）工作者仍然是任务范围的，用于破坏性生命周期操作，不能修改不相关的任务。

### 为什么使用工具而不是调用 `hermes kanban`

原因有三：

1. **后端可移植性。** 如果工作者的终端工具指向一个远程后端（Docker / Modal / Singularity / SSH），它将在容器内部运行 `hermes kanban complete`，而 `hermes` 在容器中未安装，且 `~/.hermes/kanban.db` 未挂载。看板工具在智能体自身的 Python 进程中运行，并且无论终端后端如何，总是能到达 `~/.hermes/kanban.db`。
2. **没有 Shell 引号的脆弱性问题。** 通过 shlex + argparse 传递 `--metadata '{"files": [...]}'` 是一个潜在的陷阱。结构化的工具参数完全跳过了这个问题。
3. **更好的错误处理。** 工具结果是模型可以进行推理的结构化 JSON，而不是它必须解析的 stderr 字符串。

**正常会话中零模式足迹。** 一个常规的 `hermes chat` 会话中，除非活动配置文件明确为编排者工作启用了看板工具集，否则其模式中不包含任何 `kanban_*` 工具。由调度器生成的任务工作者获得了任务范围的工具，因为设置了 `HERMES_KANBAN_TASK`；而编排者配置文件则通过配置获得了更广泛的路由界面。对于从不接触看板的用户来说，没有工具冗余。

自动注入的看板指导教导模型何时以及如何调用哪个工具。

### 推荐的手交证据

`kanban_complete(summary=..., metadata={...})` 是有意设计的灵活：
摘要是供人类阅读的收尾总结，而 `metadata` 是下游智能体、审阅者或仪表板可以重用的机器可读手交信息，无需解析散文。

对于工程和审查任务，请优先使用以下可选的元数据结构：

```json
{
  "changed_files": ["path/to/file.py"],
  "verification": ["pytest tests/hermes_cli/test_kanban_db.py -q"],
  "dependencies": ["parent task id or external issue, if any"],
  "blocked_reason": null,
  "retry_notes": "what failed before, if this was a retry",
  "residual_risk": ["what was not tested or still needs human review"]
}
```

这些键是惯例，而非模式要求。有用的属性在于：
每个工作者都留下了足够的证据，让下一个读者能够快速回答四个问题：

1. 哪些内容发生了变化？
2. 如何进行了验证？
3. 如果失败了，什么可以解除阻塞或重试它？
4. 还有哪些风险是故意留待的？

不要将秘密、原始日志、令牌、OAuth 材料和不相关的转录本包含在 `metadata` 中。请存储指针和摘要。如果一个任务没有文件或测试，请在 `summary` 中明确说明，并使用 `metadata` 来提供存在的证据，例如源 URL、问题 ID 或手动审查步骤。

### 工作者生命周期

所有处理看板任务的配置文件都会自动获得工作者生命周期——它在生成时（即 `KANBAN_GUIDANCE` 块）被注入到工作者的系统提示中，因此**无需安装或配置任何东西**。它通过**工具调用**而不是 CLI 命令来教导工作者完整的生命周期：

1. **生成时**，调用 `kanban_show()` 来读取标题 + 正文 + 父级交接 + 先前的尝试 + 完整的评论线程。
2. `cd $HERMES_KANBAN_WORKSPACE`（通过终端工具）并在那里完成工作。
3. 在长时间操作期间每隔几分钟调用一次 `kanban_heartbeat(note="...")`。**如果你的工作可能运行超过 1 小时，请至少每小时调用一次 `kanban_heartbeat`**——调度器会回收那些在过去一小时内没有心跳信号、且已运行超过 `kanban.dispatch_stale_timeout_seconds`（默认 4 小时）的任务，前提是工作者崩溃而未进行清理。任务被回收是良性的（任务重新进入 `ready` 状态等待重新调度，而不是失败计数器增加），但你将失去当前运行的进度。
4. 使用 `kanban_complete(summary="...", metadata={...})` 完成，或者如果卡住则使用 `kanban_block(reason="...")`。

这个最终的 `kanban_complete` / `kanban_block` 调用是工作者协议的一部分。如果工作进程在任务仍处于 `running` 状态时以状态码 0 退出，调度器会将其视为协议违规，发出一个 `protocol_violation` 事件，并在下一个滴答中自动阻塞该任务，而不是将其重新生成到同一个循环中。这通常意味着模型撰写了一个纯文本答案并退出了，而没有使用看板工具界面。

生命周期以及负载承载的参考细节（工作区类型、可交付成果 `artifacts`、声称创建卡片）都包含在那个系统提示块中，因此无论工作者是在哪个配置文件下运行，它都拥有它们——无需每个配置文件的技能设置。

### 将额外技能固定到特定任务上

有时一个单一的任务需要被分配者配置文件默认不具备的专业上下文——一个需要 `translation` 技能的翻译工作，一个需要 `github-code-review` 的审查任务，一个需要 `security-pr-audit` 的安全审计。与其每次都编辑分配者的配置文件，不如直接将技能附加到任务上。

**从一个编排者智能体来看**（常见情况——一个智能体将工作路由给另一个），请使用 `kanban_create` 工具的 `skills` 数组：

```
kanban_create(
    title="translate README to Japanese",
    assignee="linguist",
    skills=["translation"],
)

kanban_create(
    title="audit auth flow",
    assignee="reviewer",
    skills=["security-pr-audit", "github-code-review"],
)
```

**从人类用户（CLI / 斜杠命令）来看**，请为每个技能重复使用 `--skill`：

```bash
hermes kanban create "translate README to Japanese" \
    --assignee linguist \
    --skill translation

hermes kanban create "audit auth flow" \
    --assignee reviewer \
    --skill security-pr-audit \
    --skill github-code-review
```

**从仪表板来看**，请将技能以逗号分隔的形式输入到内联创建表单的 **skills** 字段中。

调度器会为每个列出的技能发出一个 `--skills <name>` 标志，因此工作者会带着所有这些技能启动，并叠加了自动注入的看板指导。技能名称必须与实际安装在分配者配置文件上的技能匹配（运行 `hermes skills list` 查看可用项）；这没有运行时安装。

### 目标模式卡片 (`--goal`)

默认情况下，每个工作者对其卡片都有**一次机会**——完成工作，调用 `kanban_complete`/`kanban_block`，退出。请传递 `--goal` (CLI) 或 `goal_mode=True` ( `kanban_create` 工具 / 仪表板)，而是让该工作者在一个**目标循环**中运行，这是 `/goal` 斜杠命令背后的同一种 Ralph 风格引擎：在每一次轮次后，一个辅助裁判会根据卡片的标题 + 正文（被视为验收标准）来检查工作者的输出，如果工作尚未完成——并且轮次预算仍有剩余——工作者将**在同一会话中**继续进行，直到裁判同意、工作者自行终止任务或预算耗尽（这会导致卡片被阻塞等待人工审查，而不是静默退出）。

```bash
hermes kanban create "Translate the docs site to French" \
    --body "Acceptance: every page translated, no English left, links intact." \
    --assignee linguist \
    --goal \
    --goal-max-turns 15      # 可选；默认 20
```

将其用于开放式、多步骤或“直到 X 为真才停止”的卡片。不要用于廉价的一次性工作——每轮次的裁判开销不值得，而调度器现有的重试/断路器已经处理了瞬态的工作者故障。裁判的好坏取决于你的目标文本，所以请将正文写成**明确的验收标准**。

### 编排者的行为方式

一个**行为良好的编排者不会自己做工作**。它会将用户的目标分解为任务，进行链接，将每个任务分配给你设置的一个配置文件，然后退后一步。编排者指导——反诱惑规则、一个零步骤的配置文件发现提示（调度器对未知分配者名称会静默失败，因此编排者必须将每张卡片都基于你的机器上实际存在的配置文件进行接地）以及一个以 `kanban_create` / `kanban_link` / `kanban_comment` 为键的分解剧本——会自动注入到工作者的系统提示中；无需安装任何东西。

一次典型的编排者流程（两个并行研究人员将任务交接给一名撰稿人）：

```
# 用户目标："起草一份关于 ICP 资金格局的发布文章"
kanban_create(title="research ICP funding, NA angle",  assignee="researcher-a", body="…")  # → t_r1
kanban_create(title="research ICP funding, EU angle",  assignee="researcher-b", body="…")  # → t_r2
kanban_create(
    title="synthesize ICP funding research into launch post draft",
    assignee="writer",
    parents=["t_r1", "t_r2"],        # 当两个研究人员都完成时，提升为 'ready'
    body="one-pager, neutral tone, cite sources inline",
)                                     # → t_w1
# 可选：稍后发现的交叉依赖关系添加链接
kanban_link(parent_id="t_r1", child_id="t_followup")
kanban_complete(
    summary="decomposed into 2 parallel research tasks → 1 synthesis task; writer starts when both researchers finish",
)
```

编排者指导会自动包含在工作者的系统提示中——无需为每个配置文件进行安装或同步。

为了获得最佳结果，请将其与一个工具集仅限于看板操作（`kanban`、`gateway`、`memory`）的配置文件配对，这样编排者即使尝试执行实现任务也做不到。

## 仪表板 (GUI)

`/kanban` CLI 和斜杠命令足以在无头模式下运行看板，但对于需要人工干预（human-in-the-loop）的场景来说，可视化看板通常是正确的界面：分诊、跨配置监督、阅读评论串和在列之间拖动卡片。Hermes 将其作为一个**捆绑式仪表板插件**提供在 `plugins/kanban/` — 它不是核心功能，也不是独立的服务 — 遵循 [扩展仪表板](./extending-the-dashboard) 中概述的模型。

使用以下命令打开：

```bash
hermes kanban init      # 一次性操作：如果尚未存在，则创建 kanban.db
hermes dashboard        # 在“技能”之后显示“看板”标签
```

### 该插件提供的功能

- 一个**看板 (Kanban)** 标签页，显示每个状态一列：`triage`（分诊）、`todo`（待办）、`ready`（就绪）、`running`（运行中）、`blocked`（阻塞）和 `done`（完成）（如果开关打开，则包括 `archived`）。
  - `triage` 是粗略想法的停泊列。默认情况下 (`kanban.auto_decompose: true`)，调度器会对落入此处的任务自动运行**分解器 (decomposer)**。内置的分解器使用 `auxiliary.kanban_decomposer` 模型路径，读取您的配置名册（附带描述），并将任务分发到一个小型子任务图谱中，路由到最合适的专家。原始任务作为每个子任务的父级保持存活，直到所有事情完成，其指定者 (`kanban.orchestrator_profile` 或未设置时的活动默认配置) 才会醒来判断是否完成，并添加更多任务。点击页面顶部的**编排：自动/手动 (Orchestration: Auto/Manual)** 药丸（翡翠色 = 自动，灰暗灰色 = 手动），或直接编辑 `config.yaml`。这两种模式都与 `hermes kanban specify` 共存——当您不希望进行任务分解时，它仍然可用作单任务的规范重写。
- 卡片显示任务 ID、标题、优先级徽章、租户标签、分配的配置、评论/链接计数、一个**进度药丸**（如果任务有依赖项，则显示 `N/M` 个子任务已完成），以及“创建 N 天前”。每个卡片的复选框都支持多选。
- **运行中 (Running) 内部的按配置划分的泳道** — 工具栏复选框可用于按指定者对“运行中”列进行子分组。
- **WebSocket 实时更新** — 该插件会短间隔地轮询附加日志的 `task_events` 表；一旦任何配置（CLI、网关或另一个仪表板标签页）采取行动，看板就会立即反映这些更改。重载操作是去抖动的 (debounced)，因此事件爆发只会触发一次重新获取。
- **拖放**卡片到不同列以更改状态。放下时会发送 `PATCH /api/plugins/kanban/tasks/:id`，该请求通过 CLI 使用的同一 `kanban_db` 代码路径进行路由——这三个界面永远不会出现漂移。移动到破坏性状态（`done`、`archived`、`blocked`）时会提示确认。触摸设备使用基于指针的回退机制，因此平板电脑上也可以使用看板。
- **内联创建** — 点击任何列标题上的 `+` 符号，即可输入标题、指定者、优先级，以及（可选地）从现有任务的下拉菜单中选择父任务。按 Enter 键创建任务，Shift+Enter 插入新行到标题字段，或按 Escape 键取消。从分诊列创建时会自动将新任务停泊在分诊中。
- **多选和批量操作** — 按住 Shift/Ctrl 点击卡片或勾选其复选框将其添加到选择集中。顶部会显示一个批量操作栏，提供批次状态转换、归档和重新分配（通过配置下拉菜单或“(取消指定)”）。破坏性批次操作会先进行确认。部分 ID 失败会被报告，而不会中止其余操作。
- **点击卡片**（不按 Shift/Ctrl）会打开一个侧边抽屉（Escape 或点击外部区域关闭），其中包含：
  - **可编辑的标题** — 点击标题即可重命名。
  - **可编辑的指定者 / 优先级** — 点击元数据行即可重写。
  - **可编辑的描述** — 默认以 Markdown 渲染（包括标题、粗体、斜体、内联代码、围栏代码、`http(s)` / `mailto:` 链接、项目符号列表），并带有一个“编辑”按钮，该按钮会切换成一个文本区域。Markdown 渲染器是一个微小、防 XSS 的渲染器——每一次替换都针对经过 HTML 转义的输入进行，只有 `http(s)` / `mailto:` 链接会被通过，并且总是设置 `target="_blank"` + `rel="noopener noreferrer"`。
  - **依赖编辑器** — 显示父级和子级的芯片列表，每个都可以用一个 `×` 符号取消链接，此外还提供针对每个其他任务的下拉菜单，用于添加新的父级或子级。循环尝试会在服务器端被拒绝，并给出清晰的消息。
  - **状态操作行**（→ 分诊 / → 就绪 / → 运行中 / 阻塞 / 解除阻塞 / 完成 / 归档），对于破坏性转换会提示确认。对于处于**分诊 (Triage)** 列中的卡片，该行还提供了两个由 LLM 驱动的操作：**⚗ 分解 (Decompose)** 将任务分解成一个路由到专家配置的子任务图谱，而 **✨ 指定 (Specify)** 则执行单任务规范重写。当 LLM 决定任务不需要进行任务分解时，分解功能会回退到指定风格的晋升，因此它是一个严格的超集。两者都可通过 CLI (`hermes kanban decompose <id>` / `specify <id>` / `--all`)、任何网关平台 (`/kanban decompose <id>`) 以及通过 `POST /api/plugins/kanban/tasks/:id/decompose` 和 `…/specify` 编程调用。请在 `config.yaml` 中 `auxiliary.kanban_decomposer` 和 `auxiliary.triage_specifier` 下配置模型。
  - 结果部分（也以 Markdown 渲染）、评论串（按 Enter 键提交）和最近的 20 个事件。
- **工具栏过滤器** — 自由文本搜索、租户下拉菜单（默认为 `config.yaml` 中的 `dashboard.kanban.default_tenant`）、指定者下拉菜单、“显示已归档”开关、“按配置划分泳道”开关，以及一个**推动调度器 (Nudge dispatcher)** 按钮，这样您就不必等待下一个 60 秒的滴答。

视觉上，目标是熟悉的 Linear / Fusion 布局：深色主题、带有计数功能的列标题、彩色状态点、用于优先级和租户的药丸芯片。该插件只读取主题 CSS 变量（`--color-*`、`--radius`、`--font-mono` 等），因此它会自动适应任何活动的仪表板主题进行重新皮肤化。

### 自动与手动编排 (Auto vs Manual orchestration)

看板有两种处理您放入分诊列的任务方式：

**自动 (Auto)（默认）** — `kanban.auto_decompose: true`。嵌入网关的调度器会在每次滴答时对任务运行**分解器**，受限于 `kanban.auto_decompose_per_tick`（默认为每滴答 3 个任务），以防止大量分诊任务耗尽辅助 LLM 的资源。分解器使用内置的分解提示以及 `auxiliary.kanban_decomposer` 模型路径，读取您安装的配置及其描述，并要求 LLM 生成一个 JSON 任务图谱：需要生成哪些任务、它们分配给谁、以及哪些依赖于哪个。原始分诊任务成为图谱中每个叶节点的父级，因此它会保持存活，直到整个图谱完成——然后才会晋升回 `ready`，以便其指定者 (`kanban.orchestrator_profile` 或未设置时的活动默认配置) 可以判断是否完成并添加更多任务。这就是“扔下一行简短描述，走开”的工作流程。

**手动 (Manual)** — `kanban.auto_decompose: false`。分诊任务会停留在分诊中，直到您采取行动。点击卡片上的**⚗ 分解**按钮，运行 `hermes kanban decompose <id>`（或 `--all`），或者从聊天中使用 `/kanban decompose <id>`。这与看板的预分解行为一致，当您希望完全控制何时运行什么时非常有用。

可以在看板页面的顶部**编排：自动/手动 (Orchestration: Auto/Manual)** 药丸之间切换（翡翠色 = 自动，灰暗灰色 = 手动），或直接编辑 `config.yaml`。这两种模式都与 `hermes kanban specify` 共存——当您不希望进行任务分解时，它仍然可用作单任务的规范重写。

分解器的路由决策取决于配置描述，这是一个您通过 `hermes profile create --description "..."`、`hermes profile describe <name> --text "..."`、`hermes profile describe <name> --auto`（LLM 从配置的技能+模型生成）或在扩展的**编排设置 (Orchestration settings)** 面板中的仪表板内嵌编辑器来设置的按配置标记原语。没有描述的配置仍然会出现在名册中——它们可以通过名称路由，只是不够精确。分解器绝不会将子任务分配给 `assignee=None`：当 LLM 选择一个未知配置时，该子任务会被路由到 `kanban.default_assignee`（或未设置时的活动默认配置）。

`kanban.orchestrator_profile` 不会加载该配置的提示、技能或自定义逻辑到分解调用中。它控制谁拥有 fan-out 后的根/编排任务。要更改分解器的模型/提供者，请配置 `auxiliary.kanban_decomposer`。如果想使用某个配置的自定义任务拆分逻辑而不是内置的分解器，请切换到手动模式，并让该配置显式地创建或分解任务。

配置旋钮（所有都在 `~/.hermes/config.yaml` 中的 `kanban:` 下）：

| Key | Default | Purpose |
|---|---|---|
| `auto_decompose` | `true` | 调度器在每次滴答时自动运行分解器。 |
| `auto_decompose_per_tick` | `3` | 每个调度器滴答的分解上限。超出部分将推迟到下一个滴答。 |
| `orchestrator_profile` | `""` | 分配给分解后根/编排任务的配置。为空 = 回退到活动默认配置。 |
| `default_assignee` | `""` | 当 LLM 选择一个未知配置时，子任务会落入此项。为空 = 回退到活动默认值。 |
| `auto_subscribe_on_create` | `true` | 当工作者从具有持久交付通道（消息网关或 TUI）的会话中调用 `kanban_create` 时，发起会话会自动订阅新任务的完成/阻塞事件。调度器仍然驱动交付——这只改变了呼叫者的聊天/键是否显示在通知-订阅表中。设置为 `false` 则要求对每个任务进行显式的 `kanban_notify-subscribe` 调用。 |

以及两个辅助 LLM 槽位：

| Key | Purpose |
|---|---|
| `auxiliary.kanban_decomposer` | 生成任务图谱的模型（由 Decompose 调用）。设置 `provider`/`model` 可以覆盖主聊天模型。 |
| `auxiliary.profile_describer` | 自动生成配置描述的模型（由 `hermes profile describe --auto` 调用）。 |

### 架构 (Architecture)

GUI 严格是一个**读穿数据库 + 写穿 kanban_db** 层，本身不包含任何领域逻辑：

<!-- ascii-guard-ignore -->
```
┌────────────────────────┐      WebSocket (tails task_events)
│   React SPA (plugin)   │ ◀──────────────────────────────────┐
│   HTML5 drag-and-drop  │                                    │
└──────────┬─────────────┘                                    │
           │ REST over fetchJSON                              │
           ▼                                                  │
┌────────────────────────┐     writes call kanban_db.*        │
│  FastAPI router        │     directly — same code path      │
│  plugins/kanban/       │     the CLI /kanban verbs use      │
│  dashboard/plugin_api.py                                    │
└──────────┬─────────────┘                                    │
           │                                                  │
           ▼                                                  │
┌────────────────────────┐                                    │
│  ~/.hermes/kanban.db   │ ───── append task_events ──────────┘
│  (WAL, shared)         │
└────────────────────────┘
```
<!-- ascii-guard-ignore-end -->

### REST 接口 (REST surface)

所有路由都挂载在 `/api/plugins/kanban/` 下，并受仪表板临时会话令牌的保护：

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/board?tenant=<name>&include_archived=…` | 按状态列分组的完整看板，包括租户和指派人以供筛选下拉菜单使用 |
| `GET` | `/tasks/:id` | 任务 + 评论 + 事件 + 链接 |
| `POST` | `/tasks` | 创建（封装了 `kanban_db.create_task`，接受 `triage: bool` 和 `parents: [id, …]`） |
| `PATCH` | `/tasks/:id` | 状态 / 指派人 / 优先级 / 标题 / 正文 / 结果 |
| `POST` | `/tasks/bulk` | 将相同的补丁（状态 / 归档 / 指派人 / 优先级）应用到 `ids` 中的每个 ID。报告每个 ID 的失败，而不会中止其他任务 |
| `POST` | `/tasks/:id/comments` | 添加评论 |
| `POST` | `/tasks/:id/specify` | 运行分流规范（triage specifier）— 辅助 LLM fleshes out the task body 并将其从 `triage` 提升到 `todo`。返回 `{ok, task_id, reason, new_title}`；如果 `ok=false`，则提供一个人类可读的“未处于分流状态”/“无辅助客户端”/“LLM 错误”原因，且 HTTP 状态码为 200 而非 4xx |
| `POST` | `/tasks/:id/decompose` | 运行看板分解器（kanban decomposer）— 辅助 LLM 生成任务图，助手原子性地创建子任务并链接根任务，同时将 `triage → todo`。返回 `{ok, task_id, reason, fanout, child_ids, new_title}`。与 `/specify` 相同的“LLM 错误时返回 200”约定。 |
| `GET` | `/profiles` | 列出已安装的配置文件及其描述（供仪表板的配置文件编辑器和编排器选择器使用）。 |
| `PATCH` | `/profiles/:name` | 设置或清除配置文件的描述（用户撰写 — `description_auto: false`）。返回 `{ok, profile, description}`。 |
| `POST` | `/profiles/:name/describe-auto` | 通过 `auxiliary.profile_describer` 为配置文件生成描述。持久化存储，设置 `description_auto: true`，以便仪表板可以显示“审查”徽章。 |
| `GET` | `/orchestration` | 读取看板编排设置（`orchestrator_profile`, `default_assignee`, `auto_decompose`），以及回退机制后的*已解析*有效值。 |
| `PUT` | `/orchestration` | 更新 `config.yaml` 中的一个或多个编排键。验证非空配置文件名是否实际存在。 |
| `POST` | `/links` | 添加依赖关系（`parent_id` → `child_id`） |
| `DELETE` | `/links?parent_id=…&child_id=…` | 移除依赖关系 |
| `POST` | `/dispatch?max=…&dry_run=…` | 轻推调度器 — 跳过 60 秒的等待时间 |
| `GET` | `/config` | 从 `config.yaml` 读取 `dashboard.kanban` 偏好设置 — `default_tenant`, `lane_by_profile`, `include_archived_by_default`, `render_markdown` |
| `WS` | `/events?since=<event_id>` | `task_events` 行的实时流 |

每个处理器都是一个薄包装器——该插件大约有 700 行 Python 代码（路由器 + WebSocket 尾部处理程序 + 批量批处理器 + 配置读取器），没有增加新的业务逻辑。一个微小的 `_conn()` 辅助函数会在每次读取和写入时自动初始化 `kanban.db`，因此无论用户是先打开仪表板、直接调用 REST API 还是运行 `hermes kanban init`，它都能正常工作。

### 仪表板配置

在 `~/.hermes/config.yaml` 中，`dashboard.kanban` 下的任何键都会更改该标签页的默认设置——插件通过 `GET /config` 在加载时读取它们：

```yaml
dashboard:
  kanban:
    default_tenant: acme              # 预选租户筛选器
    lane_by_profile: true             # “按配置文件划分泳道”切换按钮的默认值
    include_archived_by_default: false
    render_markdown: true             # 设置为 false 以进行纯 <pre> 渲染
```

每个键都是可选的，都会回退到显示的默认值。

### 安全模型

仪表板的 HTTP 身份验证中间件[明确跳过 `/api/plugins/`](./extending-the-dashboard#backend-api-routes)——插件路由在设计上是未经验证的，因为仪表板默认绑定到本地主机（localhost）。这意味着看板 RESTful 接口可以从主机上的任何进程访问。

WebSocket 增加了一个额外的步骤：它要求提供仪表板的临时会话令牌作为 `?token=…` 查询参数（浏览器无法在升级请求上设置 `Authorization`），这与浏览器内部 PTY 桥接器使用的模式相匹配。

如果你运行 `hermes dashboard --host 0.0.0.0`，则所有插件路由——包括看板——都将可以从网络访问。**不要在共享主机上这样做。** 看板包含任务正文、评论和工作区路径；一个能够到达这些路由的攻击者就可以读取你整个协作表面，也可以创建/重新分配/归档任务。

`~/.hermes/kanban.db` 中的任务是故意做到与配置文件无关的（这是协调原语）。如果你使用 `hermes -p <profile> dashboard` 打开仪表板，看板仍然会显示主机上任何其他配置文件的任务。同一个用户拥有所有配置文件，但如果存在多个角色，这一点值得了解。

### 实时更新

`task_events` 是一个带单调递增 `id` 的追加式 SQLite 表。WebSocket 端点保存每个客户端的最后一次所见事件 ID，并随着新行到来而推送它们。当一批事件到达时，前端会重新加载（非常便宜的）看板端点——这比尝试从每种事件类型补丁本地状态要简单和正确得多。WAL 模式意味着读取循环永远不会阻塞调度器的 `BEGIN IMMEDIATE` 事务声明。

### 扩展它

该插件使用了标准的 Hermes 仪表板插件契约——有关完整的清单参考、shell 插槽、页面范围插槽和插件 SDK，请参阅[Extending the Dashboard](./extending-the-dashboard)。额外的列、自定义卡片外观、按租户过滤的布局或完整的 `tab.override` 替换，都可以无需分叉此插件即可实现。

要禁用而不删除：将 `dashboard.plugins.kanban.enabled: false` 添加到 `config.yaml` 中（或删除 `plugins/kanban/dashboard/manifest.json`）。

### 作用域边界

GUI 是故意保持精简的。插件所做的一切都可通过 CLI 访问；该插件只是让它对人类来说更舒适一些。自动分配、预算、治理门控和组织结构图视图仍然是用户空间——一个路由器配置文件、另一个插件或对 `tools/approval.py` 的重用——这与设计规范中的“超出范围”部分所列出的完全一致。

## CLI 命令参考

这是你（或脚本、cron、仪表板）用来驱动看板的界面。运行在调度器内部的工人使用 `kanban_*` [工具界面](#how-workers-interact-with-the-board) 来执行相同的操作——CLI 和工具都通过 `kanban_db` 进行路由，因此这两个界面是结构上一致的。

```
hermes kanban init                                     # 创建 kanban.db + 打印守护进程提示
hermes kanban create "<title>" [--body ...] [--assignee <profile>]
                                [--parent <id>]... [--tenant <name>]
                                [--workspace scratch|worktree|worktree:<path>|dir:<path>]
                                [--branch <name>]
                                [--priority N] [--triage] [--idempotency-key KEY]
                                [--max-runtime 30m|2h|1d|<seconds>]
                                [--max-retries N]
                                [--goal] [--goal-max-turns N]
                                [--skill <name>]...
                                [--json]
hermes kanban list [--mine] [--assignee P] [--status S] [--tenant T] [--archived]
        [--workflow-template-id <id>] [--current-step-key <key>]
        [--sort created|created-desc|priority|priority-desc|status|assignee|title|updated]
        [--json]
hermes kanban show <id> [--json]
hermes kanban assign <id> <profile>                    # 或 'none' 取消分配
hermes kanban reassign <id>... <profile>               # 批量将任务重新分配给一个智能体
hermes kanban edit <id> [--title ...] [--body ...]     # 原地编辑任务标题/正文/优先级
        [--priority N]
hermes kanban promote <id>...                          # 将待办/阻塞任务移动到就绪状态（恢复）
hermes kanban schedule <id> --at <ISO8601>             # 设置/清除任务的 scheduled_at 开始时间
hermes kanban diagnostics [--json]                     # 看板健康快照 (别名: diag)
hermes kanban link <parent_id> <child_id>
hermes kanban unlink <parent_id> <child_id>
hermes kanban claim <id> [--ttl SECONDS]
hermes kanban comment <id> "<text>" [--author NAME]

# 批量操作动词 — 接受多个 ID：
hermes kanban complete <id>... [--result "..."]
hermes kanban block <id> "<reason>" [--ids <id>...]
hermes kanban unblock <id>...
hermes kanban archive <id>...

hermes kanban tail <id>                                # 跟踪单个任务的事件流
hermes kanban watch [--assignee P] [--tenant T]        # 向终端实时查看所有事件
        [--kinds completed,blocked,…] [--interval SECS]
hermes kanban heartbeat <id> [--note "..."]            # 长操作的智能体存活信号
hermes kanban runs <id> [--json]                       # 尝试历史记录（每条运行记录一行）
hermes kanban assignees [--json]                       # 磁盘上的智能体配置 + 每个智能体的任务计数
hermes kanban dispatch [--dry-run] [--max N]           # 一次性执行
        [--failure-limit N] [--json]
hermes kanban daemon --force                           # 已弃用 — 单独的调度器（请使用 `hermes gateway start` 代替）
        [--failure-limit N] [--pidfile PATH] [-v]
hermes kanban stats [--json]                           # 按状态 + 按智能体计数的统计信息
hermes kanban log <id> [--tail BYTES]                  # 来自 ~/.hermes/kanban/logs/ 的工人日志
hermes kanban notify-subscribe <id>                    # 网关桥接钩子（由网关中的 /kanban 使用）
        --platform <name> --chat-id <id> [--thread-id <id>] [--user-id <id>]
hermes kanban notify-list [<id>] [--json]
hermes kanban notify-unsubscribe <id>
        --platform <name> --chat-id <id> [--thread-id <id>]
hermes kanban context <id>                             # 一个智能体所看到的
hermes kanban specify [<id> | --all] [--tenant T]      # 完善一个分诊列的想法
        [--author NAME] [--json]                       #   生成完整的规范并提升到待办状态
hermes kanban gc [--event-retention-days N]            # 工作区 + 旧事件 + 旧日志
        [--log-retention-days N]
```

所有命令也作为交互式 CLI 和消息网关中的斜杠命令可用（参见下面的 [\#kanban 斜杠命令](#kanban-slash-command)）。

`--max-retries` 是调度器针对单个任务的熔断器覆盖设置。`--max-retries 1` 在第一次不成功的尝试时就阻止该任务，而 `--max-retries 3` 则允许两次重试并在第三次失败时阻止。如果省略此项，则使用 `config.yaml` 中的 `kanban.failure_limit`，然后是内置的默认值。

### 并发性、调度和子任务提升配置

| 配置键 | 默认值 | 功能描述 |
|---|---|---|
| `kanban.max_in_progress` | 未设置（不限） | 限制同时运行的任务数量。如果看板上已有 N 个正在运行，调度器将跳过生成更多任务——这对慢速的智能体（本地 LLM、资源受限的主机）非常有用，因为它们可以先完成手头的工作，而不是让更多的任务堆积并超时。无效值或小于 1 的值会记录警告，并表现为不限。 |
| `kanban.max_in_progress_per_profile` | 未设置（不限） | 对 `max_in_progress` 的按智能体划分的限制——限制任何单个分配智能体可以并发运行的任务数量。当一个智能体缓慢或被速率限制，但其他智能体应该继续运行时非常有用。它与看板级别的 `max_in_progress` 同时生效；两者都必须允许生成任务才能继续进行。 |
| `kanban.auto_promote_children` | `true` | 在 `decompose_triage_task()` 生成了没有父级阻塞依赖的子任务后，它们会自动提升到“就绪”状态，以便调度器可以拾取。如果设置为 `false`，则需要手动审查——子任务将保持在“待办”中，直到你将其提升。 |
| `kanban.default_workdir` | 未设置 | 当既没有 `--workspace` 也没有任务本身覆盖它时，应用于新任务的看板级别默认工作目录。单个任务的 `workspace:` 仍然具有最高优先级。 |

```yaml
kanban:
  max_in_progress: 2
  auto_promote_children: false
  default_workdir: ~/work/active-project
```

### 定时任务启动（`scheduled_at`）

在任务上设置 `scheduled_at` 可以延迟调度，直到特定时间。调度器会跳过 `scheduled_at` 在未来的就绪任务，并在该时间戳之后的第一次滴答中拾取它们。

```bash
hermes kanban create "夜间备份审计" \
  --assignee ops --scheduled-at "2026-06-01T03:00:00Z"
```

### 重启保护机制 (Respawn guard)

如果调度器在之前的运行中遇到了配额/身份验证/429 错误（`blocker_auth`），或者在一个成功的运行窗口内完成了运行（`recent_success`），或者最近的任务评论链接到一个 GitHub PR（`active_pr`），它将拒绝重新生成一个就绪任务。这可以防止在人工介入之前对同一个缺陷或任务进行重复的工人风暴式攻击。请参阅 [事件参考](#event-reference) 中的 `respawn_guarded` 行。

### 拖拽删除和批量删除（仪表板）

仪表板上暴露了一个看板页面的**垃圾箱区域**——将任何卡片拖入其中即可删除任务（会级联到 `task_events`、子链接和订阅）。一个确认提示可以防止意外发生。还可以通过 `DELETE /api/plugins/kanban/tasks` 配合 JSON 主体 `{"ids": ["t_abc", "t_def", ...]}` 进行批量删除。

### 工人可见性端点 (Worker visibility endpoints)

仪表板插件 API 现在为外部监控器暴露了这些只读端点（以及一个运行控制动词）：

| 端点 | 返回内容 |
|---|---|
| `GET /api/plugins/kanban/workers/active` | 当前已生成的工人，包括 PID、智能体配置、任务 ID、开始时间、上次心跳信号 |
| `GET /api/plugins/kanban/runs/{id}` | 单次运行详情——任务 ID、状态、开始/结束时间、退出代码、日志路径 |
| `POST /api/plugins/kanban/runs/{run_id}/terminate` | 终止一个可回收的运行——停止工人并释放任务以便重新调度 |
| `GET /api/plugins/kanban/inspect` | 综合调度器快照——积压量、正在进行中的数量 vs. `max_in_progress`、最近事件 |

所有这些端点都受到与看板插件 API 的其余部分相同的仪表板插件身份验证保护。

### 看板群集拓扑助手 (Kanban Swarm topology helper)

`hermes kanban swarm` 一次性创建了一个持久的**看板群集 v1** 图：一个已完成的根/黑板卡片、N 个并行工人卡片、一个受所有工人限制的验证者卡片，以及一个受验证者限制的合成器卡片。共享的群集上下文（“黑板”）以结构化 JSON 评论的形式存储在根卡片上，因此任何智能体都可以读取它。

```bash
hermes kanban swarm "设计多区域故障转移计划" \
  --workers researcher,architect,sre \
  --verifier reviewer --synthesizer writer
```

生成的图会正常调度——工人并行运行，验证者在所有工人完成后唤醒，合成器在验证者标记工作干净后唤醒。

## `/kanban` 斜杠命令 {#kanban-slash-command}

每个 `hermes kanban <action>` 动词也可以通过 `/kanban <action>` 调用——这不仅在交互式的 `hermes chat` 会话中，也来自任何网关平台（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost、电子邮件、SMS）。这两种界面都调用相同的 `hermes_cli.kanban.run_slash()` 入口点，该入口点重用了 `hermes kanban` 的 argparse 树，因此 CLI、`/kanban` 和 `hermes kanban` 之间的参数界面、标志和输出格式是完全一致的。你无需离开聊天就能驱动看板。

```
/kanban list
/kanban show t_abcd
/kanban create "write launch post" --assignee writer --parent t_research
/kanban comment t_abcd "looks good, ship it"
/kanban unblock t_abcd
/kanban dispatch --max 3
/kanban specify t_abcd                  # 将一个分诊单行细化为真正的规范
/kanban specify --all --tenant engineering  # 批量处理一个租户中的所有分诊任务
```

引用多词参数的方式与在 shell 中一样——`run_slash` 使用 `shlex.split` 解析剩余的行，因此 `"..."` 和 `'...'` 都有效。

### 运行中期的使用：`/kanban` 绕过了运行智能体（running-agent）的保护机制

网关通常会在一个智能体仍在思考时排队斜杠命令和用户消息——这就是阻止你在第一个任务正在进行时意外启动第二个任务的原因。**`/kanban` 被明确豁免于此项保护。** 看板存储在 `~/.hermes/kanban.db` 中，而不是运行中的智能体状态中，因此读取（`list`、`show`、`context`、`tail`、`watch`、`stats`、`runs`）和写入（`comment`、`unblock`、`block`、`assign`、`archive`、`create`、`link` 等）操作都会立即进行，即使是在任务运行中。

这就是分离的全部意义：

- 一个工作智能体被阻塞，等待一个同伴（peer）→ 你从手机发送 `/kanban unblock t_abcd`，调度器在下一次滴答时拾取该同伴。被阻塞的工作智能体不会被打断——它只是停止处于被阻塞状态。
- 你发现一张卡片需要人工上下文→ `/kanban comment t_xyz "使用 2026 年的 schema，而不是 2025 年"` 会出现在任务线程上，而该任务的*下一次*运行会在 `kanban_show()` 中读取它。
- 你想知道你的智能体群（fleet）在做什么，同时又不停止编排器→ `/kanban list --mine` 或 `/kanban stats` 会检查看板，而不会影响你的主对话。

### `/kanban create` 上的自动订阅（仅限网关）

当你使用 `/kanban create "..."` 从网关创建任务时，原始的聊天记录（平台 + 聊天 ID + 线程 ID）会自动订阅该任务的终端事件（`completed`、`blocked`、`gave_up`、`crashed`、`timed_out`）。你将收到一条消息回复每个终端事件——包括在 `completed` 时工作智能体结果摘要的第一行——而无需轮询或记住任务 ID。

```
you> /kanban create "transcribe today's podcast" --assignee transcriber
bot> Created t_9fc1a3  (ready, assignee=transcriber)
     (已订阅 — 当 t_9fc1a3 完成或被阻塞时，你将会收到通知)

… 大约 8 分钟后 …

bot> ✓ t_9fc1a3 已由 transcriber 完成
     转录了 42 分钟，保存在 podcast/2026-05-04.md 中
```

任务一旦达到 `done` 或 `archived` 状态，订阅就会自动移除。如果你使用 `--json`（机器输出）来脚本创建任务，则会跳过自动订阅——这是基于脚本调用者希望通过 `/kanban notify-subscribe` 显式管理订阅的假设。

### 消息中的输出截断

网关平台有实际的消息长度限制。如果 `/kanban list`、`/kanban show` 或 `/kanban tail` 生成超过约 3800 个字符的输出，则响应会以 `… (已截断；请在终端中使用 \`hermes kanban …\` 获取完整输出)` 的页脚进行截断。CLI 界面没有这样的限制。

### 自动补全

在交互式 CLI 中，输入 `/kanban ` 并按 Tab 键，即可循环浏览内置的子命令列表（`list`、`ls`、`show`、`create`、`assign`、`link`、`unlink`、`claim`、`comment`、`complete`、`block`、`unblock`、`archive`、`tail`、`dispatch`、`context`、`init`、`gc`）。CLI 参考中列出的其余动词（`watch`、`stats`、`runs`、`log`、`assignees`、`heartbeat`、`notify-subscribe`、`notify-list`、`notify-unsubscribe`、`daemon`）也有效——它们只是尚未包含在自动补全提示列表中。

## 协作模式

该看板支持这些模式，而无需任何新的基本原语：

| Pattern | Shape | Example |
|---|---|---|
| **P1 Fan-out** | N 个同级智能体，相同角色 | "并行研究 5 个角度" |
| **P2 Pipeline** | 角色链：侦察员 → 编辑者 → 作者 | 日常简报汇编 |
| **P3 Voting / quorum** | N 个同级智能体 + 1 个聚合器 | 3 名研究人员 → 1 名审阅者选择 |
| **P4 Long-running journal** | 相同配置文件 + 共享目录 + cron | Obsidian Vault |
| **P5 Human-in-the-loop** | 工作块 → 用户评论 → 解锁 | 模棱两可的决策 |
| **P6 `@mention`** | 来自正文的内联路由 | `@reviewer 查看此项` |
| **P7 Thread-scoped workspace** | 线程中的 `/kanban here` | 每个项目的网关线程 |
| **P8 Fleet farming** | 一个配置文件，N 个主题 | 50 个社交账号 |
| **P9 Triage specifier** | 草稿想法 → `triage` → `hermes kanban specify` 展开主体 → `todo` | "将这个单行命令转换为一个规范化的任务" |

有关每个模式的实际示例，请参阅 `docs/hermes-kanban-v1-spec.pdf`。

## 多租户使用

当一个专业智能体群（fleet）服务于多个企业时，请为每个任务打上租户标签：

```bash
hermes kanban create "monthly report" \
    --assignee researcher \
    --tenant business-a \
    --workspace dir:~/tenants/business-a/data/
```

工作者（Workers）会接收 `$HERMES_TENANT`，并通过前缀对它们的内存写入进行命名空间划分。看板、调度器和配置文件定义都是共享的；只有数据是受限域的。

## 网关通知 (Gateway notifications)

当你从网关（Telegram、Discord、Slack 等）运行 `/kanban create …` 时，原始聊天会自动订阅新任务。网关的后台通知器会每隔几秒轮询 `task_events`，并将一个终端事件（`completed`、`blocked`、`gave_up`、`crashed`、`timed_out`）的消息发送到该聊天。完成的任务还会发送工作者 `--result` 的第一行内容，这样你无需 `/kanban show` 就可以看到结果。

你可以从 CLI 显式管理订阅——当脚本/定时任务需要通知它最初没有发起的聊天时，这非常有用：

```bash
hermes kanban notify-subscribe t_abcd \
    --platform telegram --chat-id 12345678 --thread-id 7
hermes kanban notify-list
hermes kanban notify-unsubscribe t_abcd \
    --platform telegram --chat-id 12345678 --thread-id 7
```

一旦任务达到 `done` 或 `archived`，订阅就会自动移除；无需进行清理。

## 运行 (Runs) — 每个尝试一次行记录

任务是一个逻辑工作单元；**运行 (run)** 是执行它的一次尝试。当调度器（dispatcher）声称一个任务已准备好时，它会在 `task_runs` 中创建一行并将其 `tasks.current_run_id` 指向该行。当这次尝试结束时——无论是完成、阻塞、崩溃、超时还是生成失败、被回收——运行记录都会关闭并附带一个 `outcome`（结果），任务的指针也会清除。一个被尝试了三次的任务会有三条 `task_runs` 记录。

为什么需要两个表而不是只修改任务本身：你需要**完整的尝试历史**来进行真实的事后分析（“第二个审阅者尝试批准，第三个合并”），还需要一个干净的地方来存放每次尝试的元数据——比如哪些文件被更改、运行了哪些测试、审阅者注意到了哪些发现。这些都是运行的事实，而不是任务的事实。

运行也是**结构化交接 (structured handoff)** 的所在地。当工作者通过 `kanban_complete(...)` 完成一个任务时，它可以传递：

- `summary`（工具参数）/ `--summary`（CLI）— 人工交接；记录在运行中；下游子智能体会在其 `build_worker_context` 中看到它。
- `metadata`（工具参数）/ `--metadata`（CLI）— 运行中的自由格式 JSON 字典；子智能体会将其与摘要一起序列化看到。
- `result`（工具参数）/ `--result`（CLI）— 会记录在任务行上的简短日志行（遗留字段，保留用于向后兼容）。

下游子智能体会读取每个父任务最近一次完成运行的摘要 + 元数据。重试工作者会读取自己任务之前的尝试（结果、摘要、错误），这样它们就不会重复一个已经失败过的路径。

```
# 工作者实际执行的操作——来自智能体循环内部的一个工具调用：
kanban_complete(
    summary="implemented token bucket, keys on user_id with IP fallback, all tests pass",
    metadata={"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14},
    result="rate limiter shipped",
)
```

当你需要关闭一个工作者无法完成的任务时（例如，被放弃的任务，或者你从仪表板手动标记为已完成的任务），CLI 也可以实现相同的交接功能：

```bash
hermes kanban complete t_abcd \
    --result "rate limiter shipped" \
    --summary "implemented token bucket, keys on user_id with IP fallback, all tests pass" \
    --metadata '{"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14}'

# 查看重试任务的尝试历史：
hermes kanban runs t_abcd
#   #  OUTCOME       PROFILE           ELAPSED  STARTED
#   1  blocked       worker               12s  2026-04-27 14:02
#        → BLOCKED: need decision on rate-limit key
#   2  completed     worker                8m   2026-04-27 15:18
#        → implemented token bucket, keys on user_id with IP fallback
```

运行记录会显示在仪表板上（抽屉中的运行历史部分，每个尝试一行彩色记录）和 REST API 上（`GET /api/plugins/kanban/tasks/:id` 返回一个 `runs[]` 数组）。如果使用 `PATCH /api/plugins/kanban/tasks/:id` 并传入 `{status: "done", summary, metadata}`，则会将两者都转发给内核，这样仪表板上的“标记完成”按钮就等同于 CLI 操作。`task_events` 行会携带它们所属的 `run_id`，以便 UI 可以按尝试分组；而 `completed` 事件会在其负载中嵌入第一行摘要（限制为 400 个字符），从而网关通知器可以在没有进行第二次 SQL 往返的情况下渲染结构化交接。

**批量关闭注意事项。** `hermes kanban complete a b c --summary X` 是被拒绝的——结构化交接是针对每次运行的，因此将相同的摘要复制粘贴到 N 个任务上几乎总是错误的。在没有 `--summary` / `--metadata` 的情况下进行批量关闭仍然适用于“我完成了一堆行政任务”这一常见情况。

**状态变更导致的回收运行 (Reclaimed runs from status changes)。** 如果你在仪表板上将一个正在运行的任务从 `running` 拖走（回到 `ready` 或直接到 `todo`），或者你归档了一个仍在运行的任务，那么这个进行中的运行就会以 `outcome='reclaimed'` 关闭，而不是成为孤儿。当 `tasks.current_run_id` 为 `NULL` 时，`task_runs` 行总是处于终端状态，反之亦然——这个不变量在 CLI、仪表板、调度器和通知器之间都是一致的。

**从未被声称完成的合成运行 (Synthetic runs for never-claimed completions)。** 如果一个从未被声称的任务（例如，一个人类从仪表板上关闭了一个 `ready` 任务并提供了摘要，或者一个 CLI 用户运行了 `hermes kanban complete <ready-task> --summary X`）被完成或阻塞，那么交接信息就会丢失。内核会插入一条零持续时间的运行记录（`started_at == ended_at`），携带摘要/元数据/原因，从而保持尝试历史的完整性。`completed` / `blocked` 事件的 `run_id` 指向该行。

**实时抽屉刷新 (Live drawer refresh)。** 当仪表板的 WebSocket 事件流报告了用户当前查看的任务的新事件时，抽屉会重新加载自身（通过将一个针对每个任务的事件计数器线程到其 `useEffect` 依赖列表中）。不再需要关闭和重新打开才能看到运行的新行或更新后的结果。

### 向后兼容性 (Forward compatibility)

`tasks` 表上有两个可空列是为 v2 工作流路由预留的：`workflow_template_id`（该任务属于哪个模板）和 `current_step_key`（该模板中哪个步骤处于活动状态）。v1 内核会忽略它们进行路由，但允许客户端写入，这样 v2 版本就可以在不进行另一个模式迁移的情况下添加路由机制。

## 事件参考 (Event reference)

每一次转换都会向 `task_events` 追加一行记录。每一行都包含一个可选的 `run_id`，以便 UI 可以按尝试分组。这些种类被分为三个集群，方便过滤（`hermes kanban watch --kinds completed,gave_up,timed_out`）：

**生命周期 (Lifecycle)**（任务作为一个逻辑单元发生了什么变化）：

| Kind | Payload | When |
|---|---|---|
| `created` | `{assignee, status, parents, tenant}` | 任务被插入。`run_id` 为 `NULL`。 |
| `promoted` | — | 所有父任务都达到 `done` 后，从 `todo → ready`。`run_id` 为 `NULL`。 |
| `claimed` | `{lock, expires, run_id}` | 调度器原子性地声称一个 `ready` 任务以进行生成 (spawn)。 |
| `completed` | `{result_len, summary?}` | 工作者写入 `--result` / `--summary`，且任务达到 `done`。`summary` 是第一行交接（400 字符限制）；完整版本保存在运行记录中。如果对从未被声称的任务调用 `complete_task` 并提供了交接字段，则会合成一个零持续时间的运行记录，从而使 `run_id` 仍然指向某处。 |
| `blocked` | `{reason, kind, recurrences}` | 工作者或人类将任务翻转为 `blocked`。`kind` 是指定的阻塞原因（`needs_input`、`capability`、`transient` 或用于通用阻塞的 `null`）；`recurrences` 是解封循环计数器。当对从未被声称的任务调用时，会合成一个零持续时间的运行记录。 |
| `dependency_wait` | `{reason, kind}` | 工作者以 `kind=dependency` 状态阻塞——该任务只是在等待另一个任务，因此它路由到 `todo`（父级限制，自动晋升）而不是 `blocked`。不需要人类干预。 |
| `block_loop_detected` | `{reason, kind, recurrences, limit}` | 一个任务被解封并再次阻塞了相同的原因 `BLOCK_RECURRENCE_LIMIT` 次（默认为 2）。它没有再次进入 `blocked`——那样一个定时任务会不断地解除阻塞它——而是路由到 `triage` 以供人类决策，从而打破解封↔再阻塞的循环。 |
| `unblocked` | — | 从 `blocked → ready`（如果父级仍未完成）或从 `blocked → todo`，无论是手动操作还是通过 `/unblock`。重置调度器的 `consecutive_failures`，但故意保留 `block_recurrences` 以保持循环中断者的记忆。`run_id` 为 `NULL`。 |
| `archived` | — | 从默认看板中隐藏。如果任务仍在运行，则携带被回收的运行的 `run_id`。 |

**编辑 (Edits)**（非转换的人工更改）：

| Kind | Payload | When |
|---|---|---|
| `assigned` | `{assignee}` | 负责人变更（包括取消分配）。 |
| `edited` | `{fields}` | 标题或正文被更新。 |
| `reprioritized` | `{priority}` | 优先级发生变化。 |
| `status` | `{status}` | 仪表板的拖放直接写入状态（例如 `todo → ready`）。携带从 `running` 拖走时被回收的运行的 `run_id`；否则 `run_id` 为 NULL。 |

**工作者遥测 (Worker telemetry)**（关于执行过程，而非逻辑任务）：

| Kind | Payload | When |
|---|---|---|
| `spawned` | `{pid}` | 调度器成功启动了一个工作进程。 |
| `heartbeat` | `{note?}` | 工作者调用 `hermes kanban heartbeat $TASK` 以在长时间操作中发出存活信号。 |
| `reclaimed` | `{stale_lock}` | 锁的 TTL 过期而未完成；任务返回到 `ready`。 |
| `crashed` | `{pid, claimer}` | 工作者 PID 不再存活，但 TTL 尚未过期。 |
| `timed_out` | `{pid, elapsed_seconds, limit_seconds, sigkill}` | 超出 `max_runtime_seconds`；调度器发送 SIGTERM（然后 grace 期 5 秒后发送 SIGKILL）并重新排队。 |
| `stale` | `{elapsed_seconds, last_heartbeat_at, heartbeat_age_seconds, timeout_seconds, pid, terminated}` | 任务运行时间超过 `kanban.dispatch_stale_timeout_seconds`（默认为 4 小时）**并且**在过去一小时内没有收到 `kanban_heartbeat`。调度器会 SIGTERM 主机本地的工作者（如果有），并将任务重置为 `ready` 以供重新调度。这不计入失败计数（`stale` 是调度器侧的缺失检测，而不是工作者故障）。运行长时间操作的工作者应至少每小时调用一次 `kanban_heartbeat` 以避免这种情况。 |
| `respawn_guarded` | `{reason}` | 调度器拒绝在当前 tick 重启此 `ready` 任务。原因包括：`blocker_auth`（上次失败是配额/认证/429 错误——等待速率窗口重置）、`recent_success`（过去一小时内发生了一次完成运行——等待审查后再重新运行）、`active_pr`（最近的评论中出现了 GitHub PR URL——之前的智能体已经创建了 PR）。该任务保持在 `ready` 状态；下一个 tick 会再次有机会生成。如果底层条件持续存在，正常的 `consecutive_failures` 断路器会在达到 `failure_limit` 次失败后自动将其设置为 `gave_up`。 |
| `spawn_failed` | `{error, failures}` | 一次生成尝试失败（缺少 PATH、工作区不可挂载等）。计数器增加；任务返回到 `ready` 以供重试。 |
| `protocol_violation` | `{pid, claimer, exit_code}` | 任务仍在 `running` 状态时，工作者成功退出，通常是因为它在没有调用 `kanban_complete` 或 `kanban_block` 的情况下进行了响应。调度器也会发出 `gave_up` 并立即自动阻塞，而不是重试。 |
| `gave_up` | `{failures, effective_limit, limit_source, error}` | 断路器触发，连续 N 次尝试均不成功。任务自动设置为阻塞状态，并附带上次的错误。有效限制依次解析为任务 `max_retries`、调度器 `failure_limit` / `kanban.failure_limit`，然后是内置默认值。 |

`hermes kanban tail <id>` 会显示单个任务的事件流。`hermes kanban watch` 会以看板级别进行流式传输。

## 不在范围之内

Kanban 是故意设计为单主机的。`~/.hermes/kanban.db` 是一个本地的 SQLite 文件，调度器（dispatcher）会在同一台机器上生成工作进程（workers）。不支持跨两个主机运行共享看板——因为没有“A 主机上的工作者 X、B 主机上的工作者 Y”这种协调原语，而且崩溃检测路径假定 PID 是本地主机的。如果需要多主机功能，请为每个主机运行一个独立的看板，并使用 `delegate_task` / 消息队列来桥接它们。

## 设计规范

完整的设计——包括架构、并发正确性、与其他系统的比较、实现计划、风险和未解决的问题——都可以在 `docs/hermes-kanban-v1-spec.pdf` 中找到。在提交任何行为更改的 PR 之前，请先阅读该文档。