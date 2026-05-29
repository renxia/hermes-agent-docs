---
sidebar_position: 12
title: "看板（多智能体协作板）"
description: "持久化的 SQLite 支持的任务板，用于协调多个 Hermes 配置文件"
---

# 看板 — 多智能体配置文件协作

> **想要一个演练教程？** 请阅读 [看板教程](./kanban-tutorial) —— 四个用户故事（独立开发者、车队分配、带重试的角色流水线、断路器），每个都附带仪表盘截图。本页是参考手册；教程则是叙述性指南。

Hermes 看板是一个持久化的任务板，在你所有的 Hermes 配置文件之间共享，它允许多个命名的智能体协作完成工作，而无需依赖脆弱的进程内子智能体群。每个任务是 `~/.hermes/kanban.db` 中的一行；每次交接是任何人可读写的一行；每个工作者都是一个具有自己身份的完整操作系统进程。

### 两个界面：模型通过工具交互，你通过 CLI 交互

该看板有两个入口，均由同一个 `~/.hermes/kanban.db` 支持：

- **智能体通过专用的 `kanban_*` 工具集驱动看板** —— `kanban_show`、`kanban_list`、`kanban_complete`、`kanban_block`、`kanban_heartbeat`、`kanban_comment`、`kanban_create`、`kanban_link`、`kanban_unblock`。调度器在生成每个工作者时，其架构中就已包含这些工具；协调器配置文件也可以显式启用 `kanban` 工具集。模型通过直接调用工具来读取和路由任务，*而不是*通过调用 `hermes kanban` 命令。请参阅下文[工作者如何与看板交互](#工作者如何与看板交互)。
- **你（以及脚本和 cron）通过 CLI 上的 `hermes kanban …`**、斜杠命令 `/kanban …` 或仪表盘来驱动看板。这些是为人类和自动化准备的 —— 适用于没有工具调用模型支撑的场景。

两个界面都通过相同的 `kanban_db` 层进行路由，因此读取能看到一致的视图，写入不会出现偏差。本页其余部分将展示 CLI 示例，因为它们易于复制粘贴，但每个 CLI 动词都有模型使用的工具调用等效形式。

这种形式涵盖了 `delegate_task` 无法处理的工作负载：
- **研究分流** —— 并行的研究员 + 分析师 + 作者，人类参与其中。
- **计划运维** —— 每日定期简报，长期积累形成日志。
- **数字孪生** —— 持久化的命名助手（如 `inbox-triage`、`ops-review`），随时间积累记忆。
- **工程流水线** —— 分解 → 在并行工作树中实现 → 评审 → 迭代 → PR。
- **车队工作** —— 一个专家管理 N 个主题（如 50 个社交账户、12 个监控服务）。

完整的设计原理、与 Cline Kanban / Paperclip / NanoClaw / Google Gemini Enterprise 的对比分析，以及八种经典协作模式，请参见仓库中的 `docs/hermes-kanban-v1-spec.pdf`。

## 看板 vs. `delegate_task`

它们看起来相似；但并非同一个原语。

| | `delegate_task` | 看板 |
|---|---|---|
| 形态 | RPC 调用（分叉 → 合并） | 持久化消息队列 + 状态机 |
| 父进程 | 阻塞直到子任务返回 | `create` 后即发即忘 |
| 子任务身份 | 匿名子智能体 | 具有持久记忆的命名配置文件 |
| 可恢复性 | 无 —— 失败即失败 | 阻塞 → 解除阻塞 → 重新运行；崩溃 → 认领 |
| 人类参与 | 不支持 | 随时评论/解除阻塞 |
| 每任务的智能体数 | 一次调用 = 一个子智能体 | 任务生命周期内的 N 个智能体（重试、评审、跟进） |
| 审计跟踪 | 上下文压缩时丢失 | SQLite 中的持久行，永久保存 |
| 协调方式 | 层级式（调用方 → 被调用方） | 对等式 —— 任何配置文件均可读/写任何任务 |

**一句话区分：** `delegate_task` 是一个函数调用；看板是一个工作队列，其中每次交接都是一行，任何配置文件（或人类）都可以查看和编辑。

**当**父智能体需要在继续前获得一个简短的推理答案，且无需人类参与，结果直接返回父进程上下文时，**使用 `delegate_task`**。

**当**工作跨越智能体边界、需要在重启后存活、可能需要人类输入、可能被不同角色接手、或需要事后可追溯时，**使用看板**。

它们可以共存：看板工作者在其运行期间内部可以调用 `delegate_task`。

## 核心概念

- **看板** — 一个独立的任务队列，拥有自己的 SQLite 数据库、工作区目录和调度循环。单个安装可以拥有多个看板（例如，每个项目、仓库或域一个）；请参阅下方的 [看板（多项目）](#boards-multi-project)。单项目用户停留在 `default` 看板上，在此文档章节之外不会看到“看板”一词。
- **任务** — 一行记录，包含标题、可选正文、一个负责人（配置文件名称）、状态（`triage | todo | ready | running | blocked | done | archived`）、可选的租户命名空间、可选的幂等性键（用于重试自动化的去重）。
- **链接** — `task_links` 表中记录父级 → 子级依赖关系的一行。当所有父级任务都标记为 `done` 时，调度器会将任务状态从 `todo` 提升为 `ready`。
- **评论** — 智能体之间的协议。智能体和人类都会追加评论；当工作者被（重新）启动时，它会读取完整的评论线程作为其上下文的一部分。
- **工作区** — 工作者操作的目录。有三种类型：
  - `scratch`（默认） — 位于 `~/.hermes/kanban/workspaces/<id>/`（在非默认看板上为 `~/.hermes/kanban/boards/<slug>/workspaces/<id>/`）下的全新临时目录。**任务完成后删除** — scratch 被设计为临时性的，因此工作者（或 `hermes kanban complete <id>`）将任务标记为完成的那一刻，目录就会被清除。如果希望保留工作者的输出，请改用 `worktree:` 或 `dir:<path>`。在安装中首次创建 scratch 工作区时，调度器会记录一条警告，并在该任务上发出一个 `tip_scratch_workspace` 事件（可通过 `hermes kanban show <id>` 查看）。
  - `dir:<path>` — 一个现有的共享目录（Obsidian 库、邮件运维目录、每个账户的文件夹）。**必须是绝对路径。** 像 `dir:../tenants/foo/` 这样的相对路径在调度时会被拒绝，因为它们会相对于调度器当前所在的工作目录（CWD）进行解析，这具有模糊性且存在混淆代理逃逸风险。除此之外，路径是受信任的 — 这是你的机器，你的文件系统，工作者以你的 uid 运行。这是受信任的本地用户威胁模型；看板在设计上是单主机的。**完成后保留。**
  - `worktree` — 一个位于 `.worktrees/<id>/` 下的 git 工作树，用于编码任务。使用 `worktree:<path>` 来固定确切的目标路径。工作者端的 `git worktree add` 会创建它，在提供分支时会使用 `--branch` 参数。**完成后保留。**
- **调度器** — 一个长运行的循环，每 N 秒（默认 60）执行一次：回收过期的任务认领、回收崩溃的工作者（PID 已消失但 TTL 尚未过期）、提升就绪的任务、原子性地认领任务、启动分配的配置文件。默认情况下**在网关内部运行**（`kanban.dispatch_in_gateway: true`）。每个时钟周期，一个调度器会扫描所有看板；启动的工作者会通过 `HERMES_KANBAN_BOARD` 环境变量固定其看板，因此它们看不到其他看板。在同一个任务上连续启动失败达到 `kanban.failure_limit` 次（默认值：2）后，调度器会自动将其标记为阻塞，并将最后一次错误作为原因 — 防止在配置文件不存在、工作区无法挂载等任务上反复抖动。
- **租户** — 一个可选的字符串命名空间，位于看板*内部*。一个专家团队可以服务多个业务（`--tenant business-a`），通过工作区路径和内存键前缀实现数据隔离。租户是软过滤器；看板才是硬隔离边界。

## 看板（多项目）

看板允许你将不相关的工作流分离 — 每个项目、仓库或域一个 — 形成隔离的队列。新安装只有一个名为 `default` 的看板（数据库位于 `~/.hermes/kanban.db` 以保持向后兼容）。只需要单个工作流的用户无需了解看板；此功能是可选的。

每个看板的隔离是绝对的：

- 每个看板拥有独立的 SQLite 数据库（`~/.hermes/kanban/boards/<slug>/kanban.db`）。
- 独立的 `workspaces/` 和 `logs/` 目录。
- 为任务启动的工作者**只能**看到其所在看板的任务 — 调度器在子进程环境中设置 `HERMES_KANBAN_BOARD`，工作者可访问的每个 `kanban_*` 工具都会读取它。
- 不允许跨看板链接任务（保持架构简单；如果确实需要跨项目引用，请使用自由文本提及并手动按 id 查找）。

### 通过 CLI 管理看板

```bash
# 查看磁盘上的看板。全新安装只显示 "default"。
hermes kanban boards list

# 创建一个新看板。
hermes kanban boards create atm10-server \
    --name "ATM10 服务器" \
    --description "Minecraft 模组服务器运维" \
    --icon 🎮 \
    --switch                   # 可选：将其设为当前活动看板

# 在不切换看板的情况下操作特定看板。
hermes kanban --board atm10-server list
hermes kanban --board atm10-server create "重启 ATM 服务器" --assignee ops

# 更改后续调用使用的“当前”看板。
hermes kanban boards switch atm10-server
hermes kanban boards show             # 当前是哪个活动看板？

# 重命名显示名称（slug 是不可变的 — 它就是目录名）。
hermes kanban boards rename atm10-server "ATM10 (生产环境)"

# 归档（默认）— 将看板目录移动到 boards/_archived/<slug>-<ts>/。
# 可通过移回目录来恢复。
hermes kanban boards rm atm10-server

# 硬删除 — 执行 `rm -rf` 删除看板目录。无法恢复。
hermes kanban boards rm atm10-server --delete
```

看板解析顺序（优先级从高到低）：

1. CLI 调用中显式指定的 `--board <slug>`。
2. `HERMES_KANBAN_BOARD` 环境变量（由调度器在启动工作者时设置，因此工作者看不到其他看板）。
3. `~/.hermes/kanban/current` — 由 `hermes kanban boards switch` 持久化的 slug。
4. `default`。

Slug 验证规则：小写字母数字 + 连字符 + 下划线，1-64 个字符，必须以字母数字开头。大写输入会自动转换为小写。其他任何字符（斜杠、空格、点、`..`）都会在 CLI 层被拒绝，这样路径遍历技巧就无法用于命名看板。

### 通过仪表板管理看板

`hermes dashboard` → 看板标签页在顶部显示一个看板切换器，只要存在多个看板（或任何看板有任务）。单看板用户只会看到一个小型的 `+ 新建看板` 按钮；切换器在需要时才会显示。

- **看板下拉菜单** — 选择活动看板。你的选择会保存到浏览器的 `localStorage` 中，这样它会在重新加载后持续生效，而不会影响你打开的终端中 CLI 的 `current` 指针。
- **+ 新建看板** — 打开一个模态框，要求输入 slug、显示名称、描述和图标。可以选择自动切换到新看板。
- **归档** — 仅在非 `default` 看板上显示。确认后，会将看板目录移动到 `boards/_archived/`。

所有仪表板 API 端点都接受 `?board=<slug>` 参数来限定看板范围。事件 WebSocket 在连接时绑定到特定看板；在 UI 中切换看板会针对新看板建立一个新的 WS 连接。

## 快速开始

以下命令是**您**（人类）进行看板设置和创建任务的操作。任务一旦分配，调度器就会将指定的配置文件派生为工作智能体。从此以后，**驱动任务的是模型通过 `kanban_*` 工具调用，而非CLI命令**——请参阅[工作智能体如何与看板交互](#工作智能体如何与看板交互)。

```bash
# 1. 创建看板（您操作）
hermes kanban init

# 2. 启动网关（托管内嵌调度器）
hermes gateway start

# 3. 创建任务（您操作——或由编排智能体通过 kanban_create 创建）
hermes kanban create "research AI funding landscape" --assignee researcher

# 4. 实时查看活动（您操作）
hermes kanban watch

# 5. 查看看板（您操作）
hermes kanban list
hermes kanban stats
```

当调度器接管任务 `t_abcd` 并派生 `researcher` 配置文件时，该工作智能体模型要做的第一件事是调用 `kanban_show()` 来读取其任务。它不会执行 `hermes kanban show t_abcd`。

### 网关内嵌调度器（默认）

调度器运行在网关进程内部。无需安装额外组件，无需管理独立服务——只要网关启动，就绪任务将在下一个调度周期被自动拾取（默认为60秒）。

```yaml
# config.yaml
kanban:
  dispatch_in_gateway: true        # 默认值
  dispatch_interval_seconds: 60    # 默认值
```

可通过环境变量 `HERMES_KANBAN_DISPATCH_IN_GATEWAY=0` 在运行时覆盖该配置标志以进行调试。标准的网关监督机制仍然适用：直接运行 `hermes gateway start`，或将网关配置为 systemd 用户单元（参见网关文档）。如果没有正在运行的网关，处于 `ready` 状态的任务将保持原状，直到网关启动——`hermes kanban create` 在创建任务时会就此发出警告。

将 `hermes kanban daemon` 作为单独进程运行的方式**已弃用**；请使用网关。如果您确实无法运行网关（例如，无头主机策略禁止长期运行的服务等），`--force` 逃生机制可在版本周期内维持旧的独立守护进程运行，但**不支持**同时运行网关内嵌调度器和独立守护进程来操作同一个 `kanban.db`，因为这会导致竞争认领。

### 幂等创建（用于自动化/Webhook）

```bash
# 首次调用将创建任务。后续使用相同键的任何调用都将返回现有任务ID，而不会重复创建。
hermes kanban create "nightly ops review" \
    --assignee ops \
    --idempotency-key "nightly-ops-$(date -u +%Y-%m-%d)" \
    --json
```

### 批量CLI命令

所有生命周期相关的命令都接受多个ID，以便您在一条命令中清理一批任务：

```bash
hermes kanban complete t_abc t_def t_hij --result "batch wrap"
hermes kanban archive  t_abc t_def t_hij
hermes kanban unblock  t_abc t_def
hermes kanban block    t_abc "need input" --ids t_def t_hij
```

## 工作者如何与看板交互

**工作者不会调用 `hermes kanban` 命令。** 当调度器生成一个工作者时，它会在子进程的环境变量中设置 `HERMES_KANBAN_TASK=t_abcd`，该环境变量会在模型的 schema 中激活一个专用的**看板工具集**。相同的工具集也可用于在工具集配置中启用了 `kanban` 的编排器配置文件。这些工具通过 Python 的 `kanban_db` 层直接读取和修改看板，与 CLI 的工作方式相同。一个正在运行的工作者像调用任何其他工具一样调用这些工具；它永远不会看到或需要 `hermes kanban` CLI。

| 工具 | 用途 | 必需参数 |
|---|---|---|
| `kanban_show` | 读取当前任务（标题、正文、先前的尝试、父级交接、评论、完整的预格式化 `worker_context`）。默认为环境中的任务 ID。 | — |
| `kanban_list` | 列出任务摘要，支持按 `assignee`、`status`、`tenant`、归档可见性和限制进行筛选。旨在供编排器发现看板上的工作。 | — |
| `kanban_complete` | 使用 `summary` + `metadata` 进行结构化交接来完成任务。 | `summary` / `result` 中至少一个 |
| `kanban_block` | 需要人工输入时升级，附带 `reason`。 | `reason` |
| `kanban_heartbeat` | 在长时操作中发出活跃信号。纯副作用。 | — |
| `kanban_comment` | 向任务线程追加一条持久的备注。 | `task_id`, `body` |
| `kanban_create` | （供编排器使用）通过 `assignee`、可选的 `parents`、`skills` 等分发子任务。 | `title`, `assignee` |
| `kanban_link` | （供编排器使用）事后添加 `parent_id → child_id` 依赖边。 | `parent_id`, `child_id` |
| `kanban_unblock` | （供编排器使用）将被阻止的任务移回 `ready` 状态。 | `task_id` |

一个典型的工作者调用流程如下所示：

```
# 模型的工具调用，按顺序：
kanban_show()                                     # 无参数 — 使用 HERMES_KANBAN_TASK
# （模型读取返回的 worker_context，通过终端/文件工具执行工作）
kanban_heartbeat(note="进行到一半 — 8 个文件已转换 4 个")
# （继续工作）
kanban_complete(
    summary="已将 limiter.py 迁移为令牌桶算法；添加了 14 个测试，全部通过",
    metadata={"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14},
)
```

而一个**编排器**工作者则会进行任务分发：

```
kanban_show()
kanban_create(
    title="研究 ICP 资金 2024-2026",
    assignee="researcher-a",
    body="聚焦种子轮 + A 轮，北美，AI 相关领域",
)
# → 返回 {"task_id": "t_r1", ...}
kanban_create(title="研究 ICP 资金 — 欧洲视角", assignee="researcher-b", body="…")
# → 返回 {"task_id": "t_r2", ...}
kanban_create(
    title="将研究结果综合成发布简报",
    assignee="writer",
    parents=["t_r1", "t_r2"],                     # 当两者都完成时提升为 ready 状态
    body="一页纸，300 字，中立语气",
)
kanban_complete(summary="分解为 2 个研究任务 + 1 个写作任务；已链接依赖关系")
```

"（编排器用）" 工具 — `kanban_list`、`kanban_create`、`kanban_link`、`kanban_unblock` 以及对他人任务的 `kanban_comment` — 都通过相同的工具集提供；约定（由 `kanban-orchestrator` 技能强制执行）是工作者配置文件不会分发或路由不相关的工作，而编排器配置文件不会执行实现工作。调度器生成的工作者仍然受任务范围限制，在破坏性的生命周期操作上无法修改无关任务。

### 为什么使用工具而不是调用 `hermes kanban` 命令

有三个原因：

1.  **后端可移植性。** 终端工具指向远程后端（Docker / Modal / Singularity / SSH）的工作者会在容器**内部**运行 `hermes kanban complete`，而容器中可能没有安装 `hermes`，`~/.hermes/kanban.db` 也可能未被挂载。看板工具在智能体自身的 Python 进程中运行，并且无论终端后端如何，始终能访问到 `~/.hermes/kanban.db`。
2.  **无 shell 引用脆性。** 通过 shlex + argparse 传递 `--metadata '{"files": [...]}'` 是一个潜在的陷阱。结构化工具参数完全跳过了这一步。
3.  **更好的错误处理。** 工具结果是模型可以推理的结构化 JSON，而不是需要解析的 stderr 字符串。

**对普通会话零 schema 占用。** 常规的 `hermes chat` 会话在其 schema 中没有任何 `kanban_*` 工具，除非活动配置文件明确为编排器工作启用了 `kanban` 工具集。调度器生成的任务工作者会获得任务范围的工具，因为设置了 `HERMES_KANBAN_TASK`；编排器配置文件则通过配置获得更广泛的路由接口。对于从不接触看板的用户，不会造成工具膨胀。

`kanban-worker` 和 `kanban-orchestrator` 技能教会模型在何时、以何种顺序调用哪个工具。

### 推荐的交接证据

`kanban_complete(summary=..., metadata={...})` 的设计是灵活的：摘要是人类可读的结项说明，而 `metadata` 是机器可读的交接数据，下游智能体、审查者或仪表板可以复用，无需解析文本。

对于工程和审查任务，推荐使用此可选的 metadata 结构：

```json
{
  "changed_files": ["path/to/file.py"],
  "verification": ["pytest tests/hermes_cli/test_kanban_db.py -q"],
  "dependencies": ["父任务 ID 或外部问题（如有）"],
  "blocked_reason": null,
  "retry_notes": "如果这是重试，之前失败的原因是什么",
  "residual_risk": ["未测试或仍需人工审查的内容"]
}
```

这些键是约定，而非 schema 要求。其有用的特性在于，每个工作者都留下足够的证据，让下一个读者能快速回答四个问题：

1.  改动了什么？
2.  如何验证的？
3.  如果失败，什么可以解除阻塞或重试？
4.  刻意留下了什么风险未解决？

请将密钥、原始日志、令牌、OAuth 材料和无关的对话记录排除在 `metadata` 之外。存储指针和摘要即可。如果一个任务没有文件或测试，请在 `summary` 中明确说明，并将存在的证据（如源 URL、问题 ID 或手动审查步骤）放在 `metadata` 中。

### 工作者技能

任何需要处理看板任务的配置文件都必须加载 `kanban-worker` 技能。它通过**工具调用**（而非 CLI 命令）教会工作者完整的生命周期：

1.  生成时，调用 `kanban_show()` 读取标题 + 正文 + 父级交接 + 之前的尝试 + 完整的评论线程。
2.  通过终端工具 `cd $HERMES_KANBAN_WORKSPACE` 并在那里执行工作。
3.  在长时操作期间，每隔几分钟调用 `kanban_heartbeat(note="...")`。**如果您的工作可能超过 1 小时，请至少每小时调用一次 `kanban_heartbeat`** — 调度器会回收运行时间超过 `kanban.dispatch_stale_timeout_seconds`（默认 4 小时）且在过去一小时内没有心跳的任务，假设工作者崩溃且未清理。回收是良性的（任务会回到 `ready` 状态以便重新分发，不会增加失败计数），但您会丢失当前运行的进度。
4.  使用 `kanban_complete(summary="...", metadata={...})` 完成，或者如果卡住则使用 `kanban_block(reason="...")`。

最后的 `kanban_complete` / `kanban_block` 调用是工作者协议的一部分。如果工作者进程在任务仍处于 `running` 状态时以状态 0 退出，调度器会将此视为协议违规，发出 `protocol_violation` 事件，并在下一个 tick 自动阻止该任务，而不是将其重新生成到相同的循环中。这通常意味着模型只写了一个纯文本答案然后就退出了，而没有使用看板工具接口。

`kanban-worker` 是一个捆绑技能，在安装和更新期间同步到每个配置文件中 — 无需单独的 Skills Hub 安装步骤。验证它在您用于看板工作者（`researcher`、`writer`、`ops` 等）的配置文件中是否存在：

```bash
hermes -p <your-worker-profile> skills list | grep kanban-worker
```

如果捆绑副本缺失，为该配置文件恢复它：

```bash
hermes -p <your-worker-profile> skills reset kanban-worker --restore
```

调度器在生成每个工作者时也会自动传递 `--skills kanban-worker`，因此即使配置文件的默认技能配置中未包含它，工作者也总是拥有模式库。

### 为特定任务固定额外的技能

有时单个任务需要被指派者配置文件默认不具备的专业上下文 — 需要 `translation` 技能的翻译工作，需要 `github-code-review` 的审查任务，需要 `security-pr-audit` 的安全审计。与其每次都编辑被指派者的配置文件，不如直接将技能附加到任务上。

**从编排器智能体（通常情况 — 一个智能体将工作路由给另一个）**，使用 `kanban_create` 工具的 `skills` 数组：

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

**从仪表板**，在内联创建表单的 **skills** 字段中以逗号分隔输入技能名称。

这些技能是**附加**到内置的 `kanban-worker` 之上的 — 调度器会为每个技能（以及内置技能）发出一个 `--skills <name>` 标志，因此工作者生成时会加载所有技能。技能名称必须与被指派者配置文件上实际安装的技能相匹配（运行 `hermes skills list` 可查看可用技能）；没有运行时安装。

### 编排器技能

**行为良好的编排器不会亲自执行工作。** 它将用户的目标分解为任务，链接它们，将每个任务分配给您设置的配置文件之一，然后退后一步。`kanban-orchestrator` 技能将此编码为工具调用模式：反诱惑规则、一个 Step-0 配置文件发现提示（调度器会对未知的被指派者名称静默失败，因此编排器必须将每张卡片建立在您机器上实际存在的配置文件上），以及一个以 `kanban_create` / `kanban_link` / `kanban_comment` 为关键的分解策略手册。

一个典型的编排器调用流程（两个并行的研究员将结果交给一个写作者）：

```
# 来自用户的目标："就 ICP 资金状况起草一篇发布文章"
kanban_create(title="研究 ICP 资金，北美视角", assignee="researcher-a", body="…")  # → t_r1
kanban_create(title="研究 ICP 资金，欧洲视角", assignee="researcher-b", body="…")  # → t_r2
kanban_create(
    title="将 ICP 资金研究综合成发布文章草稿",
    assignee="writer",
    parents=["t_r1", "t_r2"],        # 当两位研究者都完成后提升为 'ready' 状态
    body="一页纸，中立语气，内联引用来源",
)                                     # → t_w1
# 可选：事后添加跨任务的依赖关系，无需重新创建任务
kanban_link(parent_id="t_r1", child_id="t_followup")
kanban_complete(
    summary="分解为 2 个并行研究任务 → 1 个综合任务；当两位研究者都完成后写作者开始",
)
```

`kanban-orchestrator` 是一个捆绑技能。它在安装和更新期间同步到每个配置文件中，因此无需单独的 Skills Hub 安装步骤。验证它在您的编排器配置文件中是否存在：

```bash
hermes -p orchestrator skills list | grep kanban-orchestrator
```

如果捆绑副本缺失，为该配置文件恢复它：

```bash
hermes -p orchestrator skills reset kanban-orchestrator --restore
```

为了获得最佳效果，请将其与一个工具集被限制为仅看板操作（`kanban`、`gateway`、`memory`）的配置文件配对，这样编排器即使尝试也无法执行实现任务。

## 仪表板（图形用户界面）

`/kanban` 命令行工具和斜杠命令足以无头模式运行看板，但可视化面板通常是人机协作场景（如任务分流、跨配置文件监督、阅读评论线程以及在列之间拖拽卡片）下的正确界面。Hermes 将其作为 **捆绑仪表板插件**（位于 `plugins/kanban/`）提供——既非核心功能，也非独立服务——遵循 [扩展仪表板](./extending-the-dashboard) 中阐述的模式。

通过以下命令打开：

```bash
hermes kanban init      # 一次性操作：如果不存在则创建 kanban.db
hermes dashboard        # 导航栏中出现"看板"选项卡，位于"技能"之后
```

### 插件提供的功能

- **看板** 选项卡，每个状态显示一列：`分流`、`待办`、`就绪`、`运行中`、`阻塞`、`完成`（开启切换后还包括 `已归档`）。
  - `分流` 是粗略想法的暂存列。默认情况下（`kanban.auto_decompose: true`），调度器会自动对落入此处的任务运行 **分解器**——编排器配置文件会读取粗略想法，查看您的配置文件列表（带描述），并将任务扇出为一个子任务图，路由到最匹配的专家。原始任务作为所有子任务的父任务保持存活，因此当所有任务完成时，编排器会再次启动以判断完成情况。点击页面顶部的 **编排：自动/手动** 药丸式切换（或设置 `kanban.auto_decompose: false`）可切换到手动模式，在该模式下分流任务会保持原位，直到您点击卡片上的 **⚗ 分解** 或运行 `hermes kanban decompose <id>`。对于不需要扇出的任务（或没有编排器配置文件的环境），**✨ 规范** 按钮通过相同的 LLM 机制进行单任务规范重写（包括标题、正文中的目标、方法、验收标准）。请参阅下面的 [自动 vs 手动编排](#自动-vs-手动编排)。
- 卡片显示任务 ID、标题、优先级徽章、租户标签、分配的配置文件、评论/链接计数、一个 **进度药丸**（当任务有依赖项时显示 `N/M` 个子任务已完成），以及“N 前创建”。每张卡片都有一个复选框以启用多选。
- **运行中列内按配置文件分组** —— 工具栏复选框可切换运行中列按分配人进行子分组。
- **通过 WebSocket 实时更新** —— 插件以短轮询间隔跟踪仅追加的 `task_events` 表；任何配置文件（命令行、网关或另一个仪表板选项卡）执行操作后，面板会立即反映变化。重新加载经过防抖处理，因此一批事件只会触发一次重新获取。
- **拖放** 卡片到不同列以更改状态。拖放操作会发送 `PATCH /api/plugins/kanban/tasks/:id`，该请求通过命令行使用的相同 `kanban_db` 代码路由——这三个界面永远不会不一致。移入破坏性状态（`完成`、`已归档`、`阻塞`）时会提示确认。触摸设备使用基于指针的回退方案，因此该面板可在平板电脑上使用。
- **内联创建** —— 点击任何列标题上的 `+`，输入标题、分配人、优先级，以及（可选）通过下拉菜单从所有现有任务中选择一个父任务。按 Enter 创建任务，Shift+Enter 在标题字段中换行，或 Escape 取消。从分流列创建会自动将新任务放入分流中。
- **多选与批量操作** —— Shift/ctrl 点击卡片或勾选其复选框可将其加入选择。顶部会出现一个批量操作栏，提供批量状态转换、归档和重新分配（通过配置文件下拉菜单，或“取消分配”）。破坏性批量操作会先进行确认。按 ID 报告部分失败，但不会中止其余操作。
- **点击卡片**（不按 shift/ctrl）会打开一个侧边抽屉（Escape 或点击外部关闭），其中包含：
  - **可编辑标题** —— 点击标题可重命名。
  - **可编辑分配人/优先级** —— 点击元数据行可重写。
  - **可编辑描述** —— 默认以 Markdown 渲染（标题、粗体、斜体、行内代码、围栏代码、`http(s)` / `mailto:` 链接、项目符号列表），带有“编辑”按钮，可切换为文本区域。Markdown 渲染器是一个小型、防 XSS 的渲染器——所有替换都在 HTML 转义后的输入上运行，只有 `http(s)` / `mailto:` 链接会通过，并且始终设置 `target="_blank"` + `rel="noopener noreferrer"`。
  - **依赖关系编辑器** —— 父任务和子任务的芯片列表，每个都有一个 `×` 用于取消链接，加上从所有其他任务中选择以添加新父任务或子任务的下拉菜单。循环尝试会在服务器端被拒绝，并给出清晰的消息。
  - **状态操作行**（→ 分流 / → 就绪 / → 运行中 / 阻塞 / 取消阻塞 / 完成 / 归档），破坏性转换时有确认提示。对于 **分流** 列中的卡片，该行还提供两个 LLM 驱动的操作：**⚗ 分解** 将任务扇出为一个子任务图，根据描述路由到专家配置文件（编排器驱动路径），**✨ 规范** 进行单任务规范重写。当 LLM 判定任务不适合扇出时，分解会回退到规范风格的提升，因此它是严格超集。两者均可通过命令行（`hermes kanban decompose <id>` / `specify <id>` / `--all`）、任何网关平台（`/kanban decompose <id>`）以及通过 `POST /api/plugins/kanban/tasks/:id/decompose` 和 `…/specify` 以编程方式访问。在 `config.yaml` 中的 `auxiliary.kanban_decomposer` 和 `auxiliary.triage_specifier` 下配置模型。
  - 结果部分（同样以 Markdown 渲染）、评论线程（按 Enter 提交）、最后 20 个事件。
- **工具栏过滤器** —— 自由文本搜索、租户下拉菜单（默认使用 `config.yaml` 中的 `dashboard.kanban.default_tenant`）、分配人下拉菜单、“显示已归档”切换、“按配置文件分组”切换，以及一个 **催促调度器** 按钮，这样您无需等待下一个 60 秒的定时触发。

视觉上，目标是类似 Linear / Fusion 的布局：深色主题、带计数的列标题、彩色状态点、用于优先级和租户的药丸式芯片。该插件仅读取主题 CSS 变量（`--color-*`、`--radius`、`--font-mono` 等），因此它会随当前激活的仪表板主题自动重新皮肤化。

### 自动 vs 手动编排

看板面板处理您放入分流列的任务有两种方式：

**自动（默认）** —— `kanban.auto_decompose: true`。网关内嵌的调度器在每个定时周期运行 **分解器**，上限由 `kanban.auto_decompose_per_tick`（默认每个周期 3 个任务）控制，因此分流任务的批量加载不会导致辅助 LLM 的突发消耗。分解器读取粗略想法，查看已安装的配置文件及其描述，并要求 LLM 生成一个 JSON 任务图：要生成哪些任务、分配给谁、以及哪些任务相互依赖。原始分流任务成为图中每个叶节点的父任务，因此它保持存活直到整个图完成——然后提升回 `就绪` 状态，以便其分配人（编排器配置文件）可以判断完成情况，并在工作未完成时添加更多任务。这是“放下一行指令，然后走开”的流程。

**手动** —— `kanban.auto_decompose: false`。分流任务会留在分流中，直到您采取行动。点击卡片上的 **⚗ 分解** 按钮，运行 `hermes kanban decompose <id>`（或 `--all`），或在聊天中使用 `/kanban decompose <id>`。这与面板在分解器出现之前的行为一致，当您希望完全控制何时运行什么时非常有用。

在看板页面顶部的 **编排：自动/手动** 药丸式切换（翡翠绿 = 自动，静音灰 = 手动）中切换这两种模式，或直接编辑 `config.yaml`。两种模式与 `hermes kanban specify` 共存——当您不需要扇出时，该命令仍可用于单任务规范重写。

分解器的路由决策取决于配置文件描述，这是一种您通过 `hermes profile create --description "..."`、`hermes profile describe <name> --text "..."`、`hermes profile describe <name> --auto`（从配置文件的已安装技能 + 模型生成 LLM）或仪表板中 **编排设置** 展开面板的每个配置文件编辑器设置的每配置文件标签原语。没有描述的配置文件仍会出现在列表中——它们可以通过名称路由，只是精确度较低。分解器永远不会将子任务分配给 `assignee=None`：当 LLM 选择一个未知的配置文件时，子任务会被路由到 `kanban.default_assignee`（如果未设置，则回退到活动的默认配置文件）。

配置旋钮（全部位于 `~/.hermes/config.yaml` 中的 `kanban:` 下）：

| 键 | 默认值 | 用途 |
|---|---|---|
| `auto_decompose` | `true` | 调度器每个定时周期自动运行分解器。 |
| `auto_decompose_per_tick` | `3` | 每个调度器周期的分解上限。超出部分推迟到下一个周期。 |
| `orchestrator_profile` | `""` | 拥有分解权限的配置文件。为空 = 回退到活动默认配置文件。 |
| `default_assignee` | `""` | 当 LLM 选择未知配置文件时，子任务落入的地方。为空 = 回退到活动默认值。 |

以及两个辅助 LLM 槽位：

| 键 | 用途 |
|---|---|
| `auxiliary.kanban_decomposer` | 生成任务图的模型（由分解调用）。设置 `provider`/`model` 以覆盖主聊天模型。 |
| `auxiliary.profile_describer` | 自动生成配置文件描述的模型（由 `hermes profile describe --auto` 调用）。 |

### 架构

该图形用户界面严格是一个 **读穿透数据库 + 写穿透 kanban_db** 的层，不包含自身的领域逻辑：

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

### REST 接口

所有路由都挂载在 `/api/plugins/kanban/` 下，并通过仪表盘的临时会话令牌进行保护：

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/board?tenant=<name>&include_archived=…` | 按状态列分组的完整看板，以及用于筛选下拉菜单的租户和负责人列表 |
| `GET` | `/tasks/:id` | 任务 + 评论 + 事件 + 链接 |
| `POST` | `/tasks` | 创建（封装 `kanban_db.create_task`，接受 `triage: bool` 和 `parents: [id, …]`） |
| `PATCH` | `/tasks/:id` | 状态 / 负责人 / 优先级 / 标题 / 正文 / 结果 |
| `POST` | `/tasks/bulk` | 对 `ids` 中的每个 ID 应用相同的补丁（状态 / 归档 / 负责人 / 优先级）。单个 ID 失败会报告，但不会中止其他操作 |
| `POST` | `/tasks/:id/comments` | 添加评论 |
| `POST` | `/tasks/:id/specify` | 运行分类说明器 — 辅助 LLM 充实任务正文，并将其从 `triage` 提升到 `todo`。返回 `{ok, task_id, reason, new_title}`；当 "未处于分类状态" / 无辅助客户端 / LLM 错误时，`ok=false` 并返回人类可读的原因，状态码为 200 而非 4xx |
| `POST` | `/tasks/:id/decompose` | 运行看板分解器 — 辅助 LLM 生成任务图，辅助器原子性地创建子任务 + 链接根节点 + 将状态从 `triage` 翻转为 `todo`。返回 `{ok, task_id, reason, fanout, child_ids, new_title}`。与 `/specify` 遇到 LLM 错误时返回 200 的惯例相同。 |
| `GET` | `/profiles` | 列出已安装的配置文件及其描述（供仪表盘的配置文件描述编辑器和编排器选择器使用）。 |
| `PATCH` | `/profiles/:name` | 设置或清除配置文件的描述（用户编写 — `description_auto: false`）。返回 `{ok, profile, description}`。 |
| `POST` | `/profiles/:name/describe-auto` | 通过 `auxiliary.profile_describer` 为配置文件生成描述。以 `description_auto: true` 持久化，以便仪表盘显示 "需审核" 徽章。 |
| `GET` | `/orchestration` | 读取看板编排设置（`orchestrator_profile`、`default_assignee`、`auto_decompose`）以及回退后的*解析*有效值。 |
| `PUT` | `/orchestration` | 更新 `config.yaml` 中三个编排键中的一个或多个。验证非空的配置文件名称确实存在。 |
| `POST` | `/links` | 添加依赖关系（`parent_id` → `child_id`） |
| `DELETE` | `/links?parent_id=…&child_id=…` | 移除依赖关系 |
| `POST` | `/dispatch?max=…&dry_run=…` | 催促调度器 — 跳过 60 秒的等待 |
| `GET` | `/config` | 从 `config.yaml` 读取 `dashboard.kanban` 偏好设置 — `default_tenant`、`lane_by_profile`、`include_archived_by_default`、`render_markdown` |
| `WS` | `/events?since=<event_id>` | `task_events` 行的实时流 |

每个处理器都是一个薄包装 — 该插件约 700 行 Python 代码（路由 + WebSocket 尾随 + 批量处理器 + 配置读取器），未添加任何新业务逻辑。一个小型 `_conn()` 辅助函数会在每次读写时自动初始化 `kanban.db`，因此无论是用户先打开仪表盘、直接调用 REST API，还是运行 `hermes kanban init`，全新安装都能工作。

### 仪表盘配置

`~/.hermes/config.yaml` 中 `dashboard.kanban` 下的任何键都会更改该标签页的默认设置 — 插件在加载时通过 `GET /config` 读取它们：

```yaml
dashboard:
  kanban:
    default_tenant: acme              # 预选租户筛选器
    lane_by_profile: true             # "按配置文件分泳道" 切换的默认值
    include_archived_by_default: false
    render_markdown: true             # 设置为 false 可使用纯 <pre> 渲染
```

每个键都是可选的，如果没有设置则使用所示默认值。

### 安全模型

仪表盘的 HTTP 认证中间件[明确跳过 `/api/plugins/` 路径](./extending-the-dashboard#backend-api-routes) — 插件路由默认是未认证的，因为仪表盘默认绑定到 localhost。这意味着看板 REST 接口可从主机上的任何进程访问。

WebSocket 需要额外一步：它要求将仪表盘的临时会话令牌作为 `?token=…` 查询参数（浏览器无法在升级请求上设置 `Authorization`），这与浏览器内 PTY 桥接使用的模式一致。

如果你运行 `hermes dashboard --host 0.0.0.0`，每个插件路由 — 包括看板 — 都将可从网络访问。**不要在共享主机上这样做。** 看板包含任务正文、评论和工作区路径；攻击者如果访问到这些路由，就能获得对整个协作界面的读取权限，并且可以创建 / 重新分配 / 归档任务。

`~/.hermes/kanban.db` 中的任务故意与配置文件无关（这是协调原语）。如果你使用 `hermes -p <profile> dashboard` 打开仪表盘，看板仍然会显示主机上任何其他配置文件创建的任务。所有配置文件由同一用户拥有，但如果多个角色共存，这一点值得注意。

### 实时更新

`task_events` 是一个具有单调递增 `id` 的追加式 SQLite 表。WebSocket 端点持有每个客户端最后看到的事件 ID，并在新行到达时推送它们。当一批事件到达时，前端会重新加载（开销极小的）看板端点 — 这比尝试根据每种事件类型修补本地状态更简单、更正确。WAL 模式意味着读取循环永远不会阻塞调度器的 `BEGIN IMMEDIATE` 事务请求。

### 扩展方法

该插件使用标准的 Hermes 仪表盘插件合约 — 有关完整的清单引用、壳槽位、页面作用域槽位和插件 SDK，请参阅[扩展仪表盘](./extending-the-dashboard)。额外的列、自定义卡片外观、按租户筛选的布局或完整的 `tab.override` 替换，都可以在不 fork 此插件的情况下实现。

要禁用但不移除：在 `config.yaml` 中添加 `dashboard.plugins.kanban.enabled: false`（或删除 `plugins/kanban/dashboard/manifest.json`）。

### 范围边界

GUI 故意设计得很薄。插件所做的一切都可以通过 CLI 实现；插件只是让人们操作更舒适。自动分配、预算、治理关卡和组织结构图视图保持在用户空间 — 由路由器配置文件、另一个插件或 `tools/approval.py` 的重用来实现 — 正如设计规范中超出范围部分所列出的那样。

## CLI 命令参考

这是**您**（或脚本、定时任务、仪表板）用于驱动看板的表面界面。调度器内部运行的工作单元使用 `kanban_*` [工具表面](#how-workers-interact-with-the-board)进行相同操作——此处的 CLI 和那里的工具都通过 `kanban_db` 路由，因此两个表面在构造上保持一致。

```
hermes kanban init                                     # 创建 kanban.db + 打印守护进程提示
hermes kanban create "<title>" [--body ...] [--assignee <profile>]
                                [--parent <id>]... [--tenant <name>]
                                [--workspace scratch|worktree|worktree:<path>|dir:<path>]
                                [--branch <name>]
                                [--priority N] [--triage] [--idempotency-key KEY]
                                [--max-runtime 30m|2h|1d|<seconds>]
                                [--max-retries N]
                                [--skill <name>]...
                                [--json]
hermes kanban list [--mine] [--assignee P] [--status S] [--tenant T] [--archived]
        [--workflow-template-id <id>] [--current-step-key <key>]
        [--sort created|created-desc|priority|priority-desc|status|assignee|title|updated]
        [--json]
hermes kanban show <id> [--json]
hermes kanban assign <id> <profile>                    # 或使用 'none' 取消分配
hermes kanban link <parent_id> <child_id>
hermes kanban unlink <parent_id> <child_id>
hermes kanban claim <id> [--ttl SECONDS]
hermes kanban comment <id> "<text>" [--author NAME]

# 批量操作动词 —— 接受多个 id：
hermes kanban complete <id>... [--result "..."]
hermes kanban block <id> "<reason>" [--ids <id>...]
hermes kanban unblock <id>...
hermes kanban archive <id>...

hermes kanban tail <id>                                # 跟踪单个任务的事件流
hermes kanban watch [--assignee P] [--tenant T]        # 实时将所有事件流输出到终端
        [--kinds completed,blocked,…] [--interval SECS]
hermes kanban heartbeat <id> [--note "..."]            # 用于长时间操作的 worker 存活信号
hermes kanban runs <id> [--json]                       # 尝试历史记录（每次运行一行）
hermes kanban assignees [--json]                       # 磁盘上的 profiles + 每个 assignee 的任务计数
hermes kanban dispatch [--dry-run] [--max N]           # 单次执行遍历
        [--failure-limit N] [--json]
hermes kanban daemon --force                           # 已弃用 —— 独立调度器（请使用 `hermes gateway start`）
        [--failure-limit N] [--pidfile PATH] [-v]
hermes kanban stats [--json]                           # 按状态 + 按 assignee 统计计数
hermes kanban log <id> [--tail BYTES]                  # 来自 ~/.hermes/kanban/logs/ 的 worker 日志
hermes kanban notify-subscribe <id>                    # 网关桥接钩子（由网关中的 /kanban 使用）
        --platform <name> --chat-id <id> [--thread-id <id>] [--user-id <id>]
hermes kanban notify-list [<id>] [--json]
hermes kanban notify-unsubscribe <id>
        --platform <name> --chat-id <id> [--thread-id <id>]
hermes kanban context <id>                             # worker 看到的内容
hermes kanban specify [<id> | --all] [--tenant T]      # 将一个 triage 列的想法充实
        [--author NAME] [--json]                       #   成为一个完整规格并提升到 todo
hermes kanban gc [--event-retention-days N]            # 工作区 + 旧事件 + 旧日志
        [--log-retention-days N]
```

所有命令在交互式 CLI 和消息网关中也可以作为斜杠命令使用（参见下面的 [`/kanban` 斜杠命令](#kanban-slash-command)）。

`--max-retries` 是调度器针对每个任务的断路器覆盖设置。`--max-retries 1` 会在第一次非成功尝试时阻塞该任务，而 `--max-retries 3` 允许两次重试，并在第三次失败时阻塞。省略此选项将使用 `config.yaml` 中的 `kanban.failure_limit`，然后是内置默认值。

### 并发、调度和子任务提升配置

| 配置键 | 默认值 | 作用 |
|------------|---------|--------------|
| `kanban.max_in_progress` | 未设置（无限） | 限制同时运行的任务数量上限。当看板已有 N 个任务在运行时，调度器会跳过生成更多任务——这对于慢速工作单元（本地 LLM、资源受限的主机）很有用，可以让它们在堆积超时前先完成手头的工作。无效或低于 1 的值会记录警告并视为无限。 |
| `kanban.auto_promote_children` | `true` | 在 `decompose_triage_task()` 生成没有父任务阻塞依赖的子任务后，它们会自动提升为 `ready`，以便调度器可以拾取。设置为 `false` 以要求手动审查——子任务将停留在 `todo` 状态直到您提升它们。 |
| `kanban.default_workdir` | 未设置 | 应用于新任务的看板级别默认工作目录，当既没有 `--workspace` 也没有任务本身覆盖它时。每个任务的 `workspace:` 仍然优先。 |

```yaml
kanban:
  max_in_progress: 2
  auto_promote_children: false
  default_workdir: ~/work/active-project
```

### 计划任务启动 (`scheduled_at`)

在任务上设置 `scheduled_at` 以将调度延迟到特定时间。调度器会跳过 `scheduled_at` 在未来的就绪任务，并在该时间戳之后的第一个 tick 拾取它们。

```bash
hermes kanban create "nightly backup audit" \
  --assignee ops --scheduled-at "2026-06-01T03:00:00Z"
```

### 重生防护

调度器会拒绝重新生成就绪任务，如果该任务在上次运行时遇到配额/认证/429 错误 (`blocker_auth`)，或在防护窗口内成功完成运行 (`recent_success`)，或最近的任务评论链接到 GitHub PR (`active_pr`)。这防止了在人类跟进的同时，同一个错误或任务上反复出现 worker 风暴。请参阅[事件参考](#event-reference)中的 `respawn_guarded` 行。

### 拖放删除和批量删除（仪表板）

仪表板在看板页面上暴露了一个**垃圾桶放置区域**——将任何卡片拖入其中即可删除该任务（会级联删除 `task_events`、子链接和订阅）。确认提示可防止意外操作。批量删除也可以通过 `DELETE /api/plugins/kanban/tasks` 并使用 JSON 主体 `{"ids": ["t_abc", "t_def", ...]}` 访问。

### 工作单元可见性端点

仪表板插件 API 现在为外部监控暴露了三个只读端点：

| 端点 | 返回 |
|----------|---------|
| `GET /api/plugins/kanban/workers/active` | 当前生成的工作单元，包含 PID、配置文件、任务 ID、启动时间、最后心跳 |
| `GET /api/plugins/kanban/runs/{id}` | 单次运行详情 —— 任务 ID、状态、开始/结束时间、退出代码、日志路径 |
| `GET /api/plugins/kanban/inspect` | 组合的调度器快照 —— 积压任务、进行中计数 vs. `max_in_progress`、最近事件 |

所有三个端点都受到与看板插件 API 其余部分相同的仪表板插件认证保护。

### 看板 Swarm 拓扑助手

`hermes kanban swarm` 一次性创建一个持久化的 **Kanban Swarm v1** 图：一个完成的根/黑板卡片、N 个并行的工作单元卡片、一个在所有工作单元完成后触发的验证器卡片，以及一个在验证器之后触发的合成器卡片。共享的 swarm 上下文（“黑板”）存储为根卡片上的结构化 JSON 评论，以便任何工作单元都可以读取。

```bash
hermes kanban swarm "Design a multi-region failover plan" \
  --workers researcher,architect,sre \
  --verifier reviewer --synthesizer writer
```

生成的图正常调度——工作单元并行运行，验证器在它们全部完成后唤醒，合成器在验证器标记工作清洁后唤醒。

## `/kanban` 斜杠命令 {#kanban-slash-command}

每个 `hermes kanban <action>` 动词也可以通过 `/kanban <action>` 访问——既可以在交互式 `hermes chat` 会话**内**使用，也可以从任何网关平台（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost、邮件、短信）使用。这两种界面调用的是完全相同的 `hermes_cli.kanban.run_slash()` 入口点，该入口点复用了 `hermes kanban` 的 argparse 树，因此参数表面、标志和输出格式在 CLI、`/kanban` 和 `hermes kanban` 之间是完全一致的。你无需离开聊天界面即可操控看板。

```
/kanban list
/kanban show t_abcd
/kanban create "写发布文章" --assignee writer --parent t_research
/kanban comment t_abcd "看起来不错，发布吧"
/kanban unblock t_abcd
/kanban dispatch --max 3
/kanban specify t_abcd                  # 将一行分诊描述扩充成详细规格
/kanban specify --all --tenant engineering  # 扫描某个租户下的所有分诊任务
```

对多词参数使用与 shell 中相同的引号方式——`run_slash` 使用 `shlex.split` 解析该行的其余部分，因此 `"..."` 和 `'...'` 均有效。

### 运行中使用：`/kanban` 绕过运行中智能体的保护机制

网关通常会在智能体仍在思考时将斜杠命令和用户消息排入队列——这正是为了防止你在第一个回复进行中意外开始第二个回合。**`/kanban` 被明确豁免于此保护机制。** 看板存在于 `~/.hermes/kanban.db` 中，而非运行中的智能体状态内，因此读取操作（`list`、`show`、`context`、`tail`、`watch`、`stats`、`runs`）和写入操作（`comment`、`unblock`、`block`、`assign`、`archive`、`create`、`link`、…）都会立即执行，即使在回复进行中也是如此。

这正是这种分离设计的全部意义所在：

*   一个工作者因等待同伴而阻塞 → 你从手机发送 `/kanban unblock t_abcd`，调度器就会在下一个 tick 拾起该同伴。被阻塞的工作者不会被中断——它只是不再处于阻塞状态。
*   你发现一张需要人工上下文的卡片 → `/kanban comment t_xyz "使用2026年的schema，而不是2025年"` 会落到任务线程上，并且该任务的*下次*运行将在 `kanban_show()` 中读取到它。
*   你想知道你的智能体集群在做什么而不中断协调器 → `/kanban list --mine` 或 `/kanban stats` 会在不干扰主对话的情况下检查看板。

### `/kanban create` 时自动订阅（仅限网关）

当你通过网关使用 `/kanban create "…"` 创建任务时，发起聊天（平台 + 聊天 ID + 线程 ID）会自动订阅该任务的终端事件（`completed`、`blocked`、`gave_up`、`crashed`、`timed_out`）。每个终端事件你会收到一条消息——包括在 `completed` 时工作者结果摘要的第一行——无需轮询或记住任务 ID。

```
你> /kanban create "转录今天的播客" --assignee transcriber
机器人> 已创建 t_9fc1a3  (就绪, assignee=transcriber)
       (已订阅——当 t_9fc1a3 完成或阻塞时，你将收到通知)

… ~8 分钟后 …

机器人> ✓ t_9fc1a3 由 transcriber 完成
       转录时长42分钟，已保存至 podcast/2026-05-04.md
```

订阅会在任务达到 `done` 或 `archived` 状态后自动移除。如果你通过 `--json`（机器输出）脚本化执行创建操作，则会跳过自动订阅——假设是脚本化调用者希望通过 `/kanban notify-subscribe` 显式管理订阅。

### 消息传递中的输出截断

网关平台存在实际的消息长度限制。如果 `/kanban list`、`/kanban show` 或 `/kanban tail` 产生超过约3800字符的输出，响应将被截断，并附带一个 `…（已截断；请在你的终端中使用 \`hermes kanban …\` 获取完整输出）` 的页脚。CLI 界面没有此类限制。

### 自动补全

在交互式 CLI 中，输入 `/kanban ` 并按 Tab 键可以循环显示内置子命令列表（`list`、`ls`、`show`、`create`、`assign`、`link`、`unlink`、`claim`、`comment`、`complete`、`block`、`unblock`、`archive`、`tail`、`dispatch`、`context`、`init`、`gc`）。CLI 参考中列出的其余动词（`watch`、`stats`、`runs`、`log`、`assignees`、`heartbeat`、`notify-subscribe`、`notify-list`、`notify-unsubscribe`、`daemon`）同样可用——只是它们尚未包含在自动补全提示列表中。

## 协作模式

该看板无需新增原语即可支持以下八种模式：

| 模式 | 形式 | 示例 |
|---|---|---|
| **P1 扇出** | N个同角色兄弟节点 | "并行研究5个角度" |
| **P2 管道** | 角色链：侦察员→编辑→撰稿人 | 每日简报汇编 |
| **P3 投票/法定人数** | N个兄弟节点+1个聚合器 | 3名研究员→1名评审员筛选 |
| **P4 长期运行日志** | 相同配置文件+共享目录+定时任务 | Obsidian知识库 |
| **P5 人在回路** | 工作者阻塞→用户评论→解除阻塞 | 模糊决策场景 |
| **P6 `@提及`** | 从文本中内联路由 | `@评审员 看看这个` |
| **P7 线程限定工作空间** | 线程内使用 `/kanban here` | 每个项目一个网关线程 |
| **P8 集群作业** | 单个配置文件，N个主体 | 50个社交账号 |
| **P9 分类指定器** | 粗略想法→`triage`→`hermes kanban specify`扩展正文→`todo` | "将这一行说明转化为规格明确的任务" |

每种模式的详细实例，请参见 `docs/hermes-kanban-v1-spec.pdf`。

## 多租户使用

当单一专业集群服务多个业务时，请为每个任务添加租户标签：

```bash
hermes kanban create "月度报告" \
    --assignee researcher \
    --tenant business-a \
    --workspace dir:~/tenants/business-a/data/
```

工作者会收到 `$HERMES_TENANT` 变量，并以前缀方式命名其内存写入空间。看板、调度器和配置定义均为共享；仅数据是隔离的。

## 网关通知

当您从网关（Telegram、Discord、Slack 等）运行 `/kanban create …` 时，发起聊天会自动订阅新任务。网关的后台通知器每几秒轮询一次 `task_events`，并向该聊天发送每个终端事件（`completed`、`blocked`、`gave_up`、`crashed`、`timed_out`）的一条消息。已完成的任务还会发送 worker 的 `--result` 的第一行，这样您无需运行 `/kanban show` 就能看到结果。

您可以通过 CLI 明确管理订阅——当脚本 / cron 任务想要通知一个并非由其发起的聊天时非常有用：

```bash
hermes kanban notify-subscribe t_abcd \
    --platform telegram --chat-id 12345678 --thread-id 7
hermes kanban notify-list
hermes kanban notify-unsubscribe t_abcd \
    --platform telegram --chat-id 12345678 --thread-id 7
```

订阅会在任务达到 `done` 或 `archived` 状态时自动移除；无需手动清理。

## 运行 — 每次尝试一行

任务是一个逻辑工作单元；**运行** 是对其的一次执行尝试。当调度器认领一个准备好的任务时，它会在 `task_runs` 中创建一行，并将 `tasks.current_run_id` 指向它。当该次尝试结束时——完成、阻塞、崩溃、超时、生成失败、回收——该运行行会关闭并记录一个 `outcome`，任务的指针会被清空。一个被尝试三次的任务会有三行 `task_runs` 记录。

为什么用两张表而不是直接修改任务：您需要**完整的尝试历史**用于真实的事后分析（“第二次审阅者尝试达到了批准状态，第三次合并了”），并且需要一个干净的地方来存放每次尝试的元数据——哪些文件更改了、运行了哪些测试、审阅者记录了哪些发现。这些是运行的事实，而非任务的事实。

运行也是**结构化交接**所在之处。当 worker 完成一个任务（通过 `kanban_complete(...)`）时，它可以传递：

- `summary`（工具参数）/ `--summary`（CLI）—— 人工交接；记录在运行上；下游子任务在其 `build_worker_context` 中可以看到。
- `metadata`（工具参数）/ `--metadata`（CLI）—— 运行上的自由格式 JSON 字典；子任务可以看到其序列化形式，与摘要并列。
- `result`（工具参数）/ `--result`（CLI）—— 记录在任务行上的简短日志行（遗留字段，为向后兼容保留）。

下游子任务读取每个父任务最近一次已完成运行的摘要 + 元数据。重试的 worker 读取其自身任务上的先前尝试（结果、摘要、错误），以避免重复已经失败的路径。

```
# worker 实际执行的操作——一个工具调用，在智能体循环内部：
kanban_complete(
    summary="implemented token bucket, keys on user_id with IP fallback, all tests pass",
    metadata={"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14},
    result="rate limiter shipped",
)
```

当您（人类）需要手动关闭一个 worker 无法关闭的任务时——例如被放弃的任务，或您从仪表板手动标记为完成的任务——也可以通过 CLI 达成同样的交接效果：

```bash
hermes kanban complete t_abcd \
    --result "rate limiter shipped" \
    --summary "implemented token bucket, keys on user_id with IP fallback, all tests pass" \
    --metadata '{"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14}'

# 查看重试任务上的尝试历史：
hermes kanban runs t_abcd
#   #  OUTCOME       PROFILE           ELAPSED  STARTED
#   1  blocked       worker               12s  2026-04-27 14:02
#        → BLOCKED: need decision on rate-limit key
#   2  completed     worker                8m   2026-04-27 15:18
#        → implemented token bucket, keys on user_id with IP fallback
```

运行在仪表板上展示（抽屉中的“运行历史”部分，每次尝试一行彩色行）以及在 REST API 上（`GET /api/plugins/kanban/tasks/:id` 返回一个 `runs[]` 数组）。使用 `{status: "done", summary, metadata}` 发送 `PATCH /api/plugins/kanban/tasks/:id` 会将摘要和元数据转发给内核，因此仪表板的“标记完成”按钮等同于 CLI。`task_events` 行携带其所属的 `run_id`，以便 UI 可以按尝试分组，并且 `completed` 事件在其有效载荷中嵌入了第一行摘要（上限为 400 个字符），因此网关通知器无需第二次 SQL 往返即可渲染结构化交接。

**批量关闭注意事项。** `hermes kanban complete a b c --summary X` 会被拒绝——结构化交接是针对每次运行的，因此将相同的摘要复制粘贴到 N 个任务几乎总是错误的。不带 `--summary` / `--metadata` 的批量关闭仍然适用于常见的“我完成了一堆管理任务”的情况。

**状态更改导致的回收运行。** 如果您在仪表板中将一个正在运行的任务从 `running` 拖走（回到 `ready`，或直接到 `todo`），或者归档一个仍在运行的任务，则正在进行的运行会以 `outcome='reclaimed'` 关闭，而不是成为孤儿。当 `tasks.current_run_id` 为 `NULL` 时，`task_runs` 行始终处于终端状态，反之亦然——这一不变式在 CLI、仪表板、调度器和通知器中都成立。

**从未认领的完成操作的合成运行。** 完成或阻塞一个从未被认领的任务（例如，人类从仪表板用摘要关闭一个 `ready` 任务，或者 CLI 用户运行 `hermes kanban complete <ready-task> --summary X`）否则会丢失交接信息。相反，内核会插入一个持续时间为零的运行行（`started_at == ended_at`），携带摘要 / 元数据 / 原因，以便尝试历史保持完整。`completed` / `blocked` 事件的 `run_id` 指向该行。

**实时抽屉刷新。** 当仪表板的 WebSocket 事件流报告用户当前正在查看的任务有新事件时，抽屉会自行重新加载（通过一个基于每个任务的事件计数器，该计数器被线程化到其 `useEffect` 依赖列表中）。不再需要关闭和重新打开抽屉来查看运行的新行或更新结果。

### 向前兼容性

`tasks` 表上有两个可空列是为 v2 工作流路由预留的：`workflow_template_id`（此任务所属的模板）和 `current_step_key`（该模板中当前活动的步骤）。v1 内核在路由时忽略它们，但允许客户端写入它们，因此 v2 版本可以在无需另一次 schema 迁移的情况下添加路由机制。

## 事件参考

每次状态转换都会向 `task_events` 追加一行。每行携带一个可选的 `run_id`，以便 UI 可以按尝试对事件进行分组。类型分为三组，便于过滤（`hermes kanban watch --kinds completed,gave_up,timed_out`）：

**生命周期**（任务作为逻辑单元发生了什么变化）：

| 类型 | 有效载荷 | 发生时机 |
|---|---|---|
| `created` | `{assignee, status, parents, tenant}` | 任务插入。`run_id` 为 `NULL`。 |
| `promoted` | — | `todo → ready`，因为所有父任务都达到了 `done`。`run_id` 为 `NULL`。 |
| `claimed` | `{lock, expires, run_id}` | 调度器原子地为生成认领了一个 `ready` 任务。 |
| `completed` | `{result_len, summary?}` | Worker 写入了 `--result` / `--summary` 并且任务达到 `done`。`summary` 是第一行交接（400 字符上限）；完整版本存储在运行行上。如果在从未被认领的任务上调用 `complete_task` 并带有交接字段，则会合成一个持续时间为零的运行，以便 `run_id` 仍然指向某个对象。 |
| `blocked` | `{reason}` | Worker 或人工将任务翻转为 `blocked`。当在从未被认领的任务上调用并带有 `--reason` 时，会合成一个持续时间为零的运行。 |
| `unblocked` | — | `blocked → ready`，手动或通过 `/unblock`。`run_id` 为 `NULL`。 |
| `archived` | — | 从默认看板隐藏。如果任务仍在运行，则携带作为副作用被回收的运行的 `run_id`。 |

**编辑**（非状态转换的人工驱动更改）：

| 类型 | 有效载荷 | 发生时机 |
|---|---|---|
| `assigned` | `{assignee}` | 负责人更改（包括取消分配）。 |
| `edited` | `{fields}` | 标题或正文更新。 |
| `reprioritized` | `{priority}` | 优先级更改。 |
| `status` | `{status}` | 仪表板拖放直接写入状态（例如 `todo → ready`）。携带从 `running` 状态拖走时被回收的运行的 `run_id`；否则 `run_id` 为 NULL。 |

**Worker 遥测**（关于执行过程，而非逻辑任务）：

| 类型 | 有效载荷 | 发生时机 |
|---|---|---|
| `spawned` | `{pid}` | 调度器成功启动了一个 worker 进程。 |
| `heartbeat` | `{note?}` | Worker 在长时间操作期间调用 `hermes kanban heartbeat $TASK` 以表明存活状态。 |
| `reclaimed` | `{stale_lock}` | 认领 TTL 过期而未完成；任务回到 `ready`。 |
| `crashed` | `{pid, claimer}` | Worker PID 不再存活但 TTL 尚未过期。 |
| `timed_out` | `{pid, elapsed_seconds, limit_seconds, sigkill}` | 超过 `max_runtime_seconds`；调度器发送了 SIGTERM（然后在 5 秒宽限期后发送 SIGKILL）并重新排队。 |
| `stale` | `{elapsed_seconds, last_heartbeat_at, heartbeat_age_seconds, timeout_seconds, pid, terminated}` | 任务运行时间超过 `kanban.dispatch_stale_timeout_seconds`（默认 4 小时）并且在最后一小时内没有收到 `kanban_heartbeat`。调度器终止了主机本地的 worker（如果存在），并将任务重置为 `ready` 以便重新调度。**不会**增加失败计数器（停滞是调度器端的缺席检测，不是 worker 故障）。运行长时间操作的 worker 应至少每小时调用一次 `kanban_heartbeat` 以避免此情况。 |
| `respawn_guarded` | `{reason}` | 调度器拒绝在此次 tick 重新生成此准备就绪的任务。原因：`blocker_auth`（上次失败是配额/认证/429 错误——等待速率窗口重置），`recent_success`（在过去一小时内发生了已完成的运行——在重新运行前等待审阅），`active_pr`（在最近的评论中出现 GitHub PR URL——先前的 worker 已经打开了一个 PR）。任务保持在 `ready`；下次 tick 将获得另一次生成机会。如果底层条件持续存在，正常的 `consecutive_failures` 断路器将在 `failure_limit` 次失败后通过 `gave_up` 自动阻塞。 |
| `spawn_failed` | `{error, failures}` | 一次生成尝试失败（缺少 PATH、工作区无法卸载……）。计数器增加；任务返回 `ready` 以便重试。 |
| `protocol_violation` | `{pid, claimer, exit_code}` | Worker 在任务仍为 `running` 时成功退出，通常是因为它在没有调用 `kanban_complete` 或 `kanban_block` 的情况下应答。调度器还会发出 `gave_up` 并立即自动阻塞，而不是重试。 |
| `gave_up` | `{failures, effective_limit, limit_source, error}` | 断路器在 N 次连续非成功尝试后触发。任务使用最后一个错误自动阻塞。有效限制按顺序解析为：任务 `max_retries`，然后调度器 `failure_limit` / `kanban.failure_limit`，最后是内置默认值。 |

`hermes kanban tail <id>` 显示单个任务的这些事件。`hermes kanban watch` 在整个看板范围内流式传输这些事件。

## 超出范围

看板系统刻意设计为单主机模式。`~/.hermes/kanban.db` 是本地 SQLite 文件，调度器在同一台机器上生成工作进程。不支持在两台主机间运行共享看板——系统缺乏"主机A的工作进程X、主机B的工作进程Y"这类协调原语，且崩溃检测路径假设进程ID仅限本机。若需多主机支持，请在每台主机上独立运行看板，并通过 `delegate_task` 或消息队列进行桥接。

## 设计规范

完整的设计文档——包括架构、并发正确性、系统对比、实现计划、风险与未决问题——均位于 `docs/hermes-kanban-v1-spec.pdf`。提交任何行为变更PR前请先阅读该文档。