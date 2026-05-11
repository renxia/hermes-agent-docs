---
sidebar_position: 12
title: "看板（多智能体协作面板）"
description: "基于 SQLite 的持久化任务面板，用于协调多个 Hermes 配置文件"
---

# 看板 — 多智能体配置文件协作

> **需要教程指南？** 阅读 [看板教程](./kanban-tutorial) — 包含四个用户故事（独立开发者、集群处理、带重试的角色流水线、熔断器），并附有各自的仪表盘截图。本页是参考手册；教程是叙述性说明。

Hermes 看板是一个持久化的任务面板，可在您所有的 Hermes 配置文件间共享，让多个命名的智能体协作处理工作，而无需依赖脆弱的进程内子智能体集群。每个任务对应 `~/.hermes/kanban.db` 中的一行；每次交接对应一行，任何智能体都可读写；每个工作者都是一个拥有独立身份的完整操作系统进程。

### 两种交互界面：模型通过工具交流，您通过命令行交流

该面板有两个入口，均基于相同的 `~/.hermes/kanban.db` 后端：

- **智能体通过专用的 `kanban_*` 工具集驱动面板** — `kanban_show`、`kanban_list`、`kanban_complete`、`kanban_block`、`kanban_heartbeat`、`kanban_comment`、`kanban_create`、`kanban_link`、`kanban_unblock`。调度器生成每个工作者时，其工具模式中已包含这些工具；协调器配置文件也可以显式启用 `kanban` 工具集。模型通过直接调用工具来读取和路由任务，*而非* 通过 shell 命令 `hermes kanban`。请参阅下方 [工作者如何与面板交互](#工作者如何与面板交互)。
- **您（以及脚本和定时任务）通过 CLI 上的 `hermes kanban …`、斜杠命令 `/kanban …` 或仪表盘来驱动面板**。这些面向人类和自动化——即那些背后没有工具调用模型的使用场景。

两种交互界面都通过相同的 `kanban_db` 层进行路由，因此读操作看到一致的视图，写操作不会产生偏移。本页的其余部分展示 CLI 示例，因为它们易于复制粘贴，但每个 CLI 动词都有模型使用的等效工具调用。

这种形态覆盖了 `delegate_task` 无法处理的工作负载：

- **研究分类** — 并行的研究员 + 分析师 + 写作者，人类参与其中。
- **计划运维** — 每日重复的简报，数周累积形成日志。
- **数字孪生** — 持久的命名助手（`inbox-triage`、`ops-review`），随时间积累记忆。
- **工程流水线** — 分解 → 在并行工作树中实现 → 审查 → 迭代 → PR。
- **集群工作** — 一个专家管理 N 个主题（50 个社交账户，12 个监控服务）。

有关完整的设计原理、与 Cline Kanban / Paperclip / NanoClaw / Google Gemini Enterprise 的对比分析，以及八种规范协作模式，请参阅仓库中的 `docs/hermes-kanban-v1-spec.pdf`。

## 看板 vs. `delegate_task`

它们看起来相似；但并非同一原语。

| | `delegate_task` | 看板 |
|---|---|---|
| 形态 | RPC 调用（分叉 → 合并） | 持久化消息队列 + 状态机 |
| 父级 | 阻塞直到子任务返回 | `create` 后即发即忘 |
| 子级身份 | 匿名子智能体 | 具有持久记忆的命名配置文件 |
| 可恢复性 | 无 — 失败即失败 | 阻塞 → 解除阻塞 → 重新运行；崩溃 → 回收 |
| 人类参与 | 不支持 | 随时可评论 / 解除阻塞 |
| 每个任务的智能体数 | 一次调用 = 一个子智能体 | 任务生命周期内 N 个智能体（重试、审查、后续） |
| 审计跟踪 | 上下文压缩时丢失 | SQLite 中永久保存的行 |
| 协调 | 层级化（调用方 → 被调用方） | 对等 — 任何配置文件可读写任何任务 |

**一句话区分：** `delegate_task` 是一个函数调用；看板是一个工作队列，其中每次交接都是任何配置文件（或人类）都可见和可编辑的一行。

**当**父级智能体需要一个简短的推理答案才能继续，且不涉及人类，结果返回到父级上下文中时，**使用 `delegate_task`**。

**当**工作跨越智能体边界、需要在重启后存活、可能需要人类输入、可能被不同角色接管，或者需要事后可追溯时，**使用看板**。

它们可以共存：看板工作者在其运行过程中可以内部调用 `delegate_task`。

## 核心概念

- **看板** — 一个独立的任务队列，拥有自己的 SQLite 数据库、工作空间目录和调度器循环。单个安装可以拥有多个看板（例如每个项目、仓库或域一个）；详见下方[看板（多项目）](#看板多项目)部分。单项目用户保持在 `default` 看板上，除了本文档章节外不会看到“看板”这个词。
- **任务** — 一行记录，包含标题、可选的正文、一个负责人（配置文件名）、状态（`triage | todo | ready | running | blocked | done | archived`）、可选的租户命名空间、可选的幂等键（用于重试自动化的去重）。
- **链接** — `task_links` 表中的一行记录，表示父任务 → 子任务的依赖关系。当所有父任务都处于 `done` 状态时，调度器会将子任务从 `todo` 提升为 `ready`。
- **评论** — 智能体间的协议。智能体和人类添加评论；当一个工作者被（重新）启动时，它会读取完整的评论线程作为其上下文的一部分。
- **工作空间** — 工作者操作的目录。有三种类型：
  - `scratch`（默认）— `~/.hermes/kanban/workspaces/<id>/` 下的一个全新的临时目录（在非默认看板上是 `~/.hermes/kanban/boards/<slug>/workspaces/<id>/`）。
  - `dir:<path>` — 一个现有的共享目录（Obsidian 保险库、邮件操作目录、每个账户的文件夹）。**必须是绝对路径。** 相对路径（如 `dir:../tenants/foo/`）在调度时会被拒绝，因为它们会根据调度器当时所在的工作目录进行解析，这是不明确的，并且存在混淆代理逃脱向量。除此之外，路径是受信任的——这是你的机器，你的文件系统，工作者以你的用户 ID 运行。这是受信任本地用户的威胁模型；看板设计上是单主机的。
  - `worktree` — 一个位于 `.worktrees/<id>/` 下的 git 工作树，用于编码任务。工作者端的 `git worktree add` 会创建它。
- **调度器** — 一个长期运行的循环，每隔 N 秒（默认 60 秒）：回收过期的声明、回收崩溃的工作者（PID 消失但 TTL 尚未过期）、提升就绪的任务、原子性地声明并启动分配了配置文件的工作者。默认**在网关内运行**（`kanban.dispatch_in_gateway: true`）。每个 tick 一个调度器会扫描所有看板；工作者启动时设置了 `HERMES_KANBAN_BOARD` 环境变量，因此他们看不到其他看板的任务。在同一个任务上连续启动失败达到 `kanban.failure_limit` 次后（默认：2），调度器会自动阻止该任务，并将最后一次错误作为原因——防止任务（其配置文件不存在、工作空间无法挂载等）出现反复抖动。
- **租户** — 看板*内*可选的字符串命名空间。一个专家舰队可以为多个业务提供服务（`--tenant business-a`），通过工作空间路径和内存键前缀进行数据隔离。租户是一种软过滤器；看板才是硬隔离边界。

## 看板（多项目）

看板让您能够将不相关的工作流——每个项目、仓库或域一个——分离到独立的队列中。一个全新的安装只有一个名为 `default` 的看板（数据库位于 `~/.hermes/kanban.db` 以保持向后兼容）。只需要单一工作流的用户无需了解看板功能；该功能是可选的。

每个看板的隔离是绝对的：

- 每个看板拥有独立的 SQLite 数据库（`~/.hermes/kanban/boards/<slug>/kanban.db`）。
- 独立的 `workspaces/` 和 `logs/` 目录。
- 为某个任务启动的工作者**只能**看到其所在看板的任务——调度器在子进程环境中设置了 `HERMES_KANBAN_BOARD`，并且工作者可访问的每个 `kanban_*` 工具都会读取它。
- 不允许跨看板链接任务（保持 schema 简单；如果确实需要跨项目引用，请使用自由文本提及并手动按 ID 查找）。

### 从命令行管理看板

```bash
# 查看磁盘上的内容。全新安装只显示 "default"。
hermes kanban boards list

# 创建一个新看板。
hermes kanban boards create atm10-server \
    --name "ATM10 服务器" \
    --description "Minecraft 模组服务器运维" \
    --icon 🎮 \
    --switch                   # 可选：使其成为活动看板

# 在不切换当前看板的情况下操作特定看板。
hermes kanban --board atm10-server list
hermes kanban --board atm10-server create "重启 ATM 服务器" --assignee ops

# 更改后续调用的“当前”看板。
hermes kanban boards switch atm10-server
hermes kanban boards show             # 当前活动的看板是哪个？

# 重命名显示名称（slug 是不可变的——它是目录名）。
hermes kanban boards rename atm10-server "ATM10 (生产)"

# 归档（默认）— 将看板的目录移动到 boards/_archived/<slug>-<ts>/。
# 通过将目录移回可以恢复。
hermes kanban boards rm atm10-server

# 永久删除 — 使用 `rm -rf` 删除看板目录。无法恢复。
hermes kanban boards rm atm10-server --delete
```

看板解析顺序（优先级从高到低）：

1.  在命令行调用中显式指定 `--board <slug>`。
2.  `HERMES_KANBAN_BOARD` 环境变量（调度器在启动工作者时设置，因此工作者看不到其他看板）。
3.  `~/.hermes/kanban/current` — 由 `hermes kanban boards switch` 保存的 slug。
4.  `default`。

Slug 验证规则：小写字母数字 + 连字符 + 下划线，1-64 个字符，必须以字母数字开头。大写输入会自动转换为小写。其他任何字符（斜杠、空格、点号、`..`）都会在命令行层被拒绝，以防止路径遍历技巧命名看板。

### 从仪表板管理看板

`hermes dashboard` → 看板选项卡在顶部显示一个看板切换器，只要存在多个看板（或任何看板有任务）。单看板用户只能看到一个小的 `+ 新建看板` 按钮；切换器在需要之前是隐藏的。

- **看板下拉菜单** — 选择活动看板。您的选择会保存到浏览器的 `localStorage`，因此它在重新加载后仍然存在，而不会将 CLI 的 `current` 指针从您打开的终端中移出。
- **+ 新建看板** — 打开一个模态框，要求输入 slug、显示名称、描述和图标。可选择自动切换到新看板。
- **归档** — 仅在非 `default` 看板上显示。确认后，将看板目录移动到 `boards/_archived/`。

所有仪表板 API 端点都接受 `?board=<slug>` 参数来限定看板范围。事件 WebSocket 在连接时绑定到一个看板；在 UI 中切换会打开一个连接到新看板的新 WebSocket。

## 快速入门

以下命令由**您**（操作员）设置看板并创建任务。任务分配后，调度器将指定的配置文件生成为工作进程，随后**由模型通过 `kanban_*` 工具调用驱动任务，而非使用 CLI 命令**——详见[工作进程如何与看板交互](#工作进程如何与看板交互)。

```bash
# 1. 创建看板（您执行）
hermes kanban init

# 2. 启动网关（承载内嵌调度器）
hermes gateway start

# 3. 创建任务（您或通过 kanban_create 的协调智能体执行）
hermes kanban create "研究AI资金格局" --assignee researcher

# 4. 实时查看活动（您执行）
hermes kanban watch

# 5. 查看看板（您执行）
hermes kanban list
hermes kanban stats
```

当调度器接收 `t_abcd` 并生成 `researcher` 配置文件时，该工作进程的模型首先会调用 `kanban_show()` 来读取任务，而非执行 `hermes kanban show t_abcd`。

### 网关内嵌调度器（默认）

调度器运行于网关进程内。无需安装其他组件，也无需管理独立服务——只要网关运行，就绪任务将在下个周期（默认60秒）被自动获取。

```yaml
# config.yaml
kanban:
  dispatch_in_gateway: true        # 默认
  dispatch_interval_seconds: 60    # 默认
```

调试时可通过 `HERMES_KANBAN_DISPATCH_IN_GATEWAY=0` 运行时覆盖配置标志。标准网关监管机制适用：可直接运行 `hermes gateway start`，或将网关配置为 systemd 用户单元（详见网关文档）。若网关未运行，`ready` 状态任务将保持原状直至网关启动——`hermes kanban create` 会在创建时对此发出警告。

作为独立进程运行 `hermes kanban daemon` 的方式已**弃用**；请使用网关。若确实无法运行网关（例如无头主机策略禁止长期服务等），可使用 `--force` 临时方案在下一版本周期前保留旧版独立守护进程，但同时运行网关内嵌调度器和独立守护进程并指向同一 `kanban.db` 会导致声明竞争，此场景不受支持。

### 幂等创建（适用于自动化/网络钩子）

```bash
# 首次调用创建任务。后续使用相同键的调用将返回现有任务ID而非重复创建。
hermes kanban create "每晚运维审查" \
    --assignee ops \
    --idempotency-key "nightly-ops-$(date -u +%Y-%m-%d)" \
    --json
```

### 批量 CLI 动词

所有生命周期动词支持多任务ID，便于单次命令批量处理：

```bash
hermes kanban complete t_abc t_def t_hij --result "批量完结"
hermes kanban archive  t_abc t_def t_hij
hermes kanban unblock  t_abc t_def
hermes kanban block    t_abc "需要输入" --ids t_def t_hij
```

## 工作单元如何与看板交互

**工作单元不会调用 `hermes kanban`。** 当调度器生成一个工作单元时，它会在子进程的环境变量中设置 `HERMES_KANBAN_TASK=t_abcd`，该环境变量会激活模型架构中专用的**看板工具集**。在工具集配置中启用了 `kanban` 的编排器配置文件也可以使用相同的工具集。这些工具通过 Python 的 `kanban_db` 层直接读取和修改看板，这与 CLI 的行为一致。一个运行中的工作单元像调用其他任何工具一样调用这些工具；它永远看不到也不需要 `hermes kanban` CLI。

| 工具 | 用途 | 必需参数 |
|---|---|---|
| `kanban_show` | 读取当前任务（标题、正文、先前的尝试、父任务交接、评论、完整的预格式化 `worker_context`）。默认使用环境变量中的任务 ID。 | — |
| `kanban_list` | 列出任务摘要，支持按 `assignee`、`status`、`tenant`、存档可见性和限制进行过滤。旨在供编排器发现看板工作。 | — |
| `kanban_complete` | 通过 `summary` + 结构化的 `metadata` 交接来完成任务。 | `summary` 和 `result` 中至少需要一个 |
| `kanban_block` | 因需要人工输入而升级，需提供 `reason`。 | `reason` |
| `kanban_heartbeat` | 在长时间操作期间发送活性信号。纯副作用。 | — |
| `kanban_comment` | 向任务线程追加一条持久性备注。 | `task_id`、`body` |
| `kanban_create` | （编排器）通过分配 `assignee`、可选的 `parents`、`skills` 等，展开成子任务。 | `title`、`assignee` |
| `kanban_link` | （编排器）事后添加 `parent_id → child_id` 依赖边。 | `parent_id`、`child_id` |
| `kanban_unblock` | （编排器）将阻塞的任务移回 `ready` 状态。 | `task_id` |

一个典型的工作单元轮次如下：

```
# 模型的工具调用，按顺序：
kanban_show()                                     # 无参数 — 使用 HERMES_KANBAN_TASK
# （模型读取返回的 worker_context，通过终端/文件工具执行工作）
kanban_heartbeat(note="halfway through — 4 of 8 files transformed")
# （继续工作）
kanban_complete(
    summary="migrated limiter.py to token-bucket; added 14 tests, all pass",
    metadata={"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14},
)
```

一个**编排器**工作单元则会展开任务：

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
    parents=["t_r1", "t_r2"],                     # 当两者都完成时提升为 ready 状态
    body="one-pager, 300 words, neutral tone",
)
kanban_complete(summary="decomposed into 2 research tasks + 1 writer; linked dependencies")
```

那些“(编排器)”工具——`kanban_list`、`kanban_create`、`kanban_link`、`kanban_unblock` 以及在外部任务上的 `kanban_comment`——通过相同的工具集提供；约定（由 `kanban-orchestrator` 技能强制执行）是工作单元配置文件不展开或路由不相关的工作，而编排器配置文件不执行实现工作。调度器生成的工作单元在破坏性的生命周期操作上仍然是任务范围的，不能修改不相关的任务。

### 为什么使用工具而不是调用 `hermes kanban`

三个原因：

1.  **后端可移植性。** 终端工具指向远程后端（Docker / Modal / Singularity / SSH）的工作单元将在容器*内部*运行 `hermes kanban complete`，而容器中并未安装 `hermes`，且 `~/.hermes/kanban.db` 也未挂载。看板工具在智能体自身的 Python 进程中运行，无论终端后端如何，总能访问到 `~/.hermes/kanban.db`。
2.  **避免 shell 引号的脆弱性。** 通过 shlex + argparse 传递 `--metadata '{"files": [...]}'` 是一个潜在的隐患。结构化的工具参数完全绕过了这个问题。
3.  **更好的错误信息。** 工具结果是模型可以推理的结构化 JSON，而不是它必须解析的 stderr 字符串。

**对正常会话零架构开销。** 普通的 `hermes chat` 会话在其架构中没有任何 `kanban_*` 工具。每个工具上的 `check_fn` 仅在设置了 `HERMES_KANBAN_TASK` 时返回 True，而这只在调度器生成了此进程时发生。对于从不接触看板的用户来说，没有工具膨胀问题。

`kanban-worker` 和 `kanban-orchestrator` 技能教会模型何时以及以何种顺序调用哪个工具。

### 推荐的交接证据

`kanban_complete(summary=..., metadata={...})` 被设计为有意灵活的：
摘要是人类可读的结项报告，而 `metadata` 是
机器可读的交接，下游智能体、审查者或仪表板可以
重用而无需抓取文本。

对于工程和审查任务，首选此可选的 metadata 结构：

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

这些键是约定，而不是架构要求。其有用的特性在于
每个工作单元都留下足够的证据，让下一个读者能快速回答四个
问题：

1.  改变了什么？
2.  如何验证的？
3.  如果失败，什么可以解除阻塞或重试此任务？
4.  什么风险仍然被有意保留？

请将机密信息、原始日志、令牌、OAuth 材料以及不相关的记录排除在
`metadata` 之外。请存储指针和摘要。如果一个任务没有文件或
测试，请在 `summary` 中明确说明，并将存在的证据放在 `metadata` 中，
例如源 URL、问题 ID 或手动审查步骤。

### 工作单元技能

任何需要处理看板任务的配置文件都必须加载 `kanban-worker` 技能。它通过**工具调用**（而非 CLI 命令）教会工作单元完整的生命周期：

1.  生成时，调用 `kanban_show()` 读取标题 + 正文 + 父任务交接 + 先前的尝试 + 完整的评论线程。
2.  通过终端工具 `cd $HERMES_KANBAN_WORKSPACE` 并在那里执行工作。
3.  在长时间操作期间，每隔几分钟调用一次 `kanban_heartbeat(note="...")`。
4.  使用 `kanban_complete(summary="...", metadata={...})` 完成，或如果卡住则调用 `kanban_block(reason="...")`。

`kanban-worker` 是一个内置技能，在安装和
更新期间同步到每个配置文件——没有单独的技能中心安装步骤。请验证它在
你用于看板工作单元的任何配置文件（`researcher`、`writer`、`ops` 等）中都存在：

```bash
hermes -p <your-worker-profile> skills list | grep kanban-worker
```

如果内置副本缺失，请为该配置文件恢复它：

```bash
hermes -p <your-worker-profile> skills reset kanban-worker --restore
```

调度器在生成每个工作单元时还会自动传递 `--skills kanban-worker`，因此工作单元始终拥有模式库，即使配置文件的默认技能配置中没有包含它。

### 将额外技能固定到特定任务

有时，单个任务需要分配者配置文件默认不携带的专业上下文——例如需要 `translation` 技能的翻译工作、需要 `github-code-review` 的审查任务、需要 `security-pr-audit` 的安全审计。与其每次都编辑分配者的配置文件，不如直接将技能附加到任务上。

**从编排器智能体（通常情况——一个智能体将工作路由给另一个智能体）**，使用 `kanban_create` 工具的 `skills` 数组：

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

**从人类（CLI / 斜杠命令）**，为每个技能重复 `--skill`：

```bash
hermes kanban create "translate README to Japanese" \
    --assignee linguist \
    --skill translation

hermes kanban create "audit auth flow" \
    --assignee reviewer \
    --skill security-pr-audit \
    --skill github-code-review
```

**从仪表板**，在内联创建表单的**技能**字段中输入逗号分隔的技能名称。

这些技能是**附加**到内置的 `kanban-worker` 之上的——调度器会为每个技能（以及内置的）发出一个 `--skills <name>` 标志，因此工作单元生成时会加载所有技能。技能名称必须与实际安装在分配者配置文件上的技能匹配（运行 `hermes skills list` 查看可用的技能）；没有运行时安装。

### 编排器技能

一个**表现良好的编排器不会自己执行工作。** 它将用户的目标分解为任务，链接它们，将每个任务分配给你设置的某个配置文件，然后退后一步。`kanban-orchestrator` 技能将此编码为工具调用模式：反诱惑规则、一个第 0 步的配置文件发现提示（调度器对未知的分配者名称会静默失败，因此编排器必须将每张卡与你机器上实际存在的配置文件关联起来），以及一个基于 `kanban_create` / `kanban_link` / `kanban_comment` 的分解剧本。

一个典型的编排器轮次（两个并行的研究员交接给一个写手）：

```
# 来自用户的目标："起草一篇关于 ICP 融资环境的发布文章"
kanban_create(title="research ICP funding, NA angle",  assignee="researcher-a", body="…")  # → t_r1
kanban_create(title="research ICP funding, EU angle",  assignee="researcher-b", body="…")  # → t_r2
kanban_create(
    title="synthesize ICP funding research into launch post draft",
    assignee="writer",
    parents=["t_r1", "t_r2"],        # 当两个研究者都完成时提升为 'ready' 状态
    body="one-pager, neutral tone, cite sources inline",
)                                     # → t_w1
# 可选：添加事后发现的跨领域依赖，无需重新创建任务
kanban_link(parent_id="t_r1", child_id="t_followup")
kanban_complete(
    summary="decomposed into 2 parallel research tasks → 1 synthesis task; writer starts when both researchers finish",
)
```

`kanban-orchestrator` 是一个内置技能。它在
安装和更新期间同步到每个配置文件，因此没有单独的技能中心安装步骤。请验证它在
你的编排器配置文件中存在：

```bash
hermes -p orchestrator skills list | grep kanban-orchestrator
```

如果内置副本缺失，请为该配置文件恢复它：

```bash
hermes -p orchestrator skills reset kanban-orchestrator --restore
```

为了获得最佳效果，请将其与一个工具集仅限于看板操作（`kanban`、`gateway`、`memory`）的配置文件配对，这样编排器即使尝试也无法执行实现任务。

## 仪表盘 (GUI)

`/kanban` CLI 和斜杠命令足以在无头模式下运行看板，但一个可视化看板通常才是适合人机协作的界面：分诊、跨配置文件监督、阅读评论线索以及在列之间拖动卡片。Hermes 将其作为 **一个捆绑的仪表盘插件** 提供，位于 `plugins/kanban/` —— 它既不是核心功能，也不是一个单独的服务 —— 遵循 [扩展仪表盘](./extending-the-dashboard) 中阐述的模型。

使用以下命令打开：

```bash
hermes kanban init      # 一次性：如果尚未存在，则创建 kanban.db
hermes dashboard        # “Kanban” 选项卡将出现在导航栏中，位于 “Skills” 之后
```

### 插件功能

- 一个 **Kanban** 选项卡，每个状态显示一列：`triage`、`todo`、`ready`、`running`、`blocked`、`done`（当开关打开时还包括 `archived`）。
  - `triage` 是存放粗略想法的停放列，需要说明者来充实。使用 `hermes kanban create --triage`（或通过 Triage 列的内联创建）创建的任务会停放在这里，调度器会忽略它们，直到人工或说明者将其提升到 `todo` / `ready`。运行 `hermes kanban specify <id>` 可让辅助 LLM 将一个分诊任务展开为具体规范（包含目标、方法、验收标准的标题 + 正文），并一次性将其提升到 `todo`；`--all` 会一次性处理所有分诊任务。可以在 `config.yaml` 的 `auxiliary.triage_specifier` 下配置运行说明器的模型。
- 卡片显示任务 ID、标题、优先级徽章、租户标签、分配的配置文件、评论/链接计数、一个 **进度药丸**（当任务有依赖项时，显示 `N/M` 个子任务完成），以及 “创建于 N 前”。每张卡片都有一个复选框用于多选。
- **运行中列内的按配置文件分道** —— 工具栏复选框可切换按经办人对运行中列进行子分组。
- **通过 WebSocket 实时更新** —— 插件在短轮询间隔内追踪追加式的 `task_events` 表；当任何配置文件（CLI、网关或另一个仪表盘选项卡）执行操作时，看板会立即反映变化。重载会进行去抖，因此一连串事件只会触发一次重新获取。
- **拖放**卡片到不同列以更改状态。放下操作会发送 `PATCH /api/plugins/kanban/tasks/:id`，该请求会路由到与 CLI 使用的相同的 `kanban_db` 代码 —— 三个界面永远不会偏离。移动到破坏性状态（`done`、`archived`、`blocked`）时会提示确认。触屏设备使用基于指针的后备方案，因此看板可以在平板电脑上使用。
- **内联创建** —— 点击任何列标题上的 `+` 可输入标题、经办人、优先级，以及（可选地）通过下拉菜单选择所有现有任务中某个任务作为父任务。从 Triage 列创建时，会自动将新任务停放在分诊区。
- **多选与批量操作** —— 按住 Shift/Ctrl 键点击卡片或勾选其复选框可将其添加到选择中。顶部会出现一个批量操作栏，提供批量状态转换、归档和重新分配（通过配置文件下拉菜单，或“（取消分配）”）。破坏性批量操作会先进行确认。针对每个 ID 的部分失败会被报告，而不会中止其他操作。
- **点击卡片**（不按住 Shift/Ctrl）可打开一个侧边抽屉（按 Escape 或点击外部关闭），其中包含：
  - **可编辑标题** —— 点击标题可重命名。
  - **可编辑经办人 / 优先级** —— 点击元数据行可重写。
  - **可编辑描述** —— 默认进行 Markdown 渲染（标题、粗体、斜体、行内代码、围栏代码、`http(s)` / `mailto:` 链接、项目符号列表），并有一个“编辑”按钮可切换为文本域。Markdown 渲染器很小巧且 XSS 安全 —— 每个替换都在 HTML 转义后的输入上运行，只有 `http(s)` / `mailto:` 链接会被放行，并且始终设置 `target="_blank"` + `rel="noopener noreferrer"`。
  - **依赖关系编辑器** —— 父项和子项的芯片列表，每个都有一个 `×` 用于取消链接，加上下拉菜单可选择所有其他任务来添加新的父项或子项。循环尝试会在服务器端被明确消息拒绝。
  - **状态操作行**（→ triage / → ready / → running / block / unblock / complete / archive），破坏性转换会有确认提示。对于 **Triage** 列中的卡片，该行还会显示一个 **✨ Specify** 按钮，该按钮调用辅助 LLM（`config.yaml` 中的 `auxiliary.triage_specifier`）来将单行描述展开为具体规范（包含目标、方法、验收标准的标题 + 正文），并将任务提升到 `todo`。相同的行为可以通过 CLI（`hermes kanban specify <id>` / `--all`）、任何网关平台（`/kanban specify <id>`）以及通过 `POST /api/plugins/kanban/tasks/:id/specify` 以编程方式实现。
  - 结果部分（也进行 Markdown 渲染）、按回车提交的评论线索、最近的 20 个事件。
- **工具栏过滤器** —— 自由文本搜索、租户下拉菜单（默认为 `config.yaml` 中的 `dashboard.kanban.default_tenant`）、经办人下拉菜单、“显示已归档”切换、“按配置文件分道”切换，以及一个 **提醒调度器** 按钮，这样你就无需等待下一个 60 秒的间隔。

视觉上的目标是熟悉的 Linear / Fusion 布局：深色主题、带计数的列标题、彩色状态点、用于优先级和租户的药丸形芯片。该插件仅读取主题 CSS 变量（`--color-*`、`--radius`、`--font-mono` 等），因此它会自动跟随任何活跃的仪表盘主题重新皮肤化。

### 架构

该 GUI 严格是一个 **读穿数据库 + 写穿 kanban_db** 的层，自身没有任何领域逻辑：

```
┌────────────────────────┐      WebSocket (追踪 task_events)
│   React SPA (插件)     │ ◀──────────────────────────────────┐
│   HTML5 拖放功能       │                                    │
└──────────┬─────────────┘                                    │
           │ REST over fetchJSON                              │
           ▼                                                  │
┌────────────────────────┐     写入调用 kanban_db.*            │
│  FastAPI 路由器         │     直接调用 —— 相同的代码路径      │
│  plugins/kanban/       │     CLI /kanban 动词使用的           │
│  dashboard/plugin_api.py                                    │
└──────────┬─────────────┘                                    │
           │                                                  │
           ▼                                                  │
┌────────────────────────┐                                    │
│  ~/.hermes/kanban.db   │ ───── 追加 task_events ──────────┘
│  (WAL, 共享)           │
└────────────────────────┘
```

### REST 接口

所有路由都挂载在 `/api/plugins/kanban/` 下，并受仪表盘的临时会话令牌保护：

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/board?tenant=<name>&include_archived=…` | 按状态列分组的完整看板，外加用于过滤器下拉菜单的租户和经办人 |
| `GET` | `/tasks/:id` | 任务 + 评论 + 事件 + 链接 |
| `POST` | `/tasks` | 创建（封装 `kanban_db.create_task`，接受 `triage: bool` 和 `parents: [id, …]`） |
| `PATCH` | `/tasks/:id` | 状态 / 经办人 / 优先级 / 标题 / 正文 / 结果 |
| `POST` | `/tasks/bulk` | 将相同的补丁（状态 / 归档 / 经办人 / 优先级）应用于 `ids` 中的每个 ID。每个 ID 的失败都会报告，而不会中止其他操作 |
| `POST` | `/tasks/:id/comments` | 追加一条评论 |
| `POST` | `/tasks/:id/specify` | 运行分诊说明器 —— 辅助 LLM 充实任务正文并将其从 `triage` 提升到 `todo`。返回 `{ok, task_id, reason, new_title}`；当“未在分诊中”/无辅助客户端/LLM 错误时，`ok=false` 并附带人类可读的原因，返回码是 200 而非 4xx |
| `POST` | `/links` | 添加一个依赖项（`parent_id` → `child_id`） |
| `DELETE` | `/links?parent_id=…&child_id=…` | 移除一个依赖项 |
| `POST` | `/dispatch?max=…&dry_run=…` | 提醒调度器 —— 跳过 60 秒的等待 |
| `GET` | `/config` | 从 `config.yaml` 读取 `dashboard.kanban` 首选项 —— `default_tenant`、`lane_by_profile`、`include_archived_by_default`、`render_markdown` |
| `WS` | `/events?since=<event_id>` | `task_events` 行的实时流 |

每个处理程序都是一个薄封装 —— 该插件大约 700 行 Python（路由器 + WebSocket 追踪器 + 批量处理器 + 配置读取器），并且不添加任何新的业务逻辑。一个小型的 `_conn()` 辅助函数会在每次读取和写入时自动初始化 `kanban.db`，因此无论是用户先打开仪表盘、直接调用 REST API 还是运行 `hermes kanban init`，全新安装都可以工作。

### 仪表盘配置

`~/.hermes/config.yaml` 中 `dashboard.kanban` 下的任何这些键都会更改该选项卡的默认值 —— 插件在加载时通过 `GET /config` 读取它们：

```yaml
dashboard:
  kanban:
    default_tenant: acme              # 预选租户过滤器
    lane_by_profile: true             # “按配置文件分道”切换的默认值
    include_archived_by_default: false
    render_markdown: true             # 设置为 false 则进行纯 <pre> 渲染
```

每个键都是可选的，并会回退到所示的默认值。

### 安全模型

仪表盘的 HTTP 认证中间件 [显式跳过 `/api/plugins/` 路由](./extending-the-dashboard#backend-api-routes) —— 插件路由默认是未经认证的，因为仪表盘默认绑定到 localhost。这意味着看板 REST 接口可被主机上的任何进程访问。

WebSocket 需要额外一步：它要求仪表盘的临时会话令牌作为 `?token=…` 查询参数（浏览器在升级请求上无法设置 `Authorization`），这与浏览器内 PTY 桥所使用的模式一致。

如果你运行 `hermes dashboard --host 0.0.0.0`，每个插件路由 —— 包括看板 —— 都将可从网络访问。**在共享主机上不要这样做。** 看板包含任务正文、评论和工作区路径；攻击者访问到这些路由将获得对你整个协作表面的读取权限，并且还可以创建/重新分配/归档任务。

位于 `~/.hermes/kanban.db` 中的任务在设计上与配置文件无关（这是协调的原始机制）。如果你通过 `hermes -p <profile> dashboard` 打开仪表盘，看板上仍然会显示主机上由其他任何配置文件创建的任务。所有配置文件归属于同一用户，但如果存在多个角色共存的情况，这一点值得注意。

### 实时更新

`task_events` 是一个仅追加的 SQLite 表，具有单调递增的 `id`。WebSocket 端点会记录每个客户端最后看到的事件 ID，并在新行出现时立即推送。当突发大量事件时，前端会重新加载（开销很低的）看板端点——这比尝试根据每种事件类型修补本地状态更简单、更准确。WAL 模式意味着读取循环永远不会阻塞调度器的 `BEGIN IMMEDIATE` 事务申请。

### 扩展性

该插件使用标准的 Hermes 仪表盘插件契约——完整的清单参考、Shell 插槽、页面级插槽以及插件 SDK，请参见 [扩展仪表盘](./extending-the-dashboard)。无需 fork 此插件即可实现额外的列、自定义卡片样式、租户过滤布局或完整的 `tab.override` 替换。

要禁用而不删除：在 `config.yaml` 中添加 `dashboard.plugins.kanban.enabled: false`（或删除 `plugins/kanban/dashboard/manifest.json`）。

### 范围边界

该图形界面有意保持轻量。插件的所有功能均可通过命令行访问；该插件只是让人类使用起来更方便。自动分配、预算、治理门控和组织结构图视图均属于用户空间——可以通过路由配置文件、另一个插件或复用 `tools/approval.py` 来实现——正如设计规范的“不在范围内”部分所列出的那样。

## CLI 命令参考

这是**您**（或脚本、定时任务、仪表盘）用于驱动任务板的操作界面。在调度器内部运行的工作者使用 `kanban_*` [工具接口](#工作者如何与任务板交互)执行相同操作 — 此处的 CLI 和那里的工具都通过 `kanban_db` 路由，因此两个接口在结构上保持一致。

```
hermes kanban init                                     # 创建 kanban.db + 打印守护进程提示
hermes kanban create "<title>" [--body ...] [--assignee <profile>]
                                [--parent <id>]... [--tenant <name>]
                                [--workspace scratch|worktree|dir:<path>]
                                [--priority N] [--triage] [--idempotency-key KEY]
                                [--max-runtime 30m|2h|1d|<seconds>]
                                [--skill <name>]...
                                [--json]
hermes kanban list [--mine] [--assignee P] [--status S] [--tenant T] [--archived] [--json]
hermes kanban show <id> [--json]
hermes kanban assign <id> <profile>                    # 或 'none' 取消分配
hermes kanban link <parent_id> <child_id>
hermes kanban unlink <parent_id> <child_id>
hermes kanban claim <id> [--ttl SECONDS]
hermes kanban comment <id> "<text>" [--author NAME]

# 批量操作 — 接受多个 id：
hermes kanban complete <id>... [--result "..."]
hermes kanban block <id> "<reason>" [--ids <id>...]
hermes kanban unblock <id>...
hermes kanban archive <id>...

hermes kanban tail <id>                                # 跟踪单个任务的事件流
hermes kanban watch [--assignee P] [--tenant T]        # 将所有事件实时流式传输到终端
        [--kinds completed,blocked,…] [--interval SECS]
hermes kanban heartbeat <id> [--note "..."]            # 长期操作中工作者的存活信号
hermes kanban runs <id> [--json]                       # 尝试历史记录（每次运行一行）
hermes kanban assignees [--json]                       # 磁盘上的配置文件及每个分配者的任务计数
hermes kanban dispatch [--dry-run] [--max N]           # 单次执行
        [--failure-limit N] [--json]
hermes kanban daemon --force                           # 已弃用 — 独立调度器（请改用 `hermes gateway start`）
        [--failure-limit N] [--pidfile PATH] [-v]
hermes kanban stats [--json]                           # 按状态 + 按分配者统计计数
hermes kanban log <id> [--tail BYTES]                  # 来自 ~/.hermes/kanban/logs/ 的工作者日志
hermes kanban notify-subscribe <id>                    # 网关桥接钩子（由网关中的 /kanban 使用）
        --platform <name> --chat-id <id> [--thread-id <id>] [--user-id <id>]
hermes kanban notify-list [<id>] [--json]
hermes kanban notify-unsubscribe <id>
        --platform <name> --chat-id <id> [--thread-id <id>]
hermes kanban context <id>                             # 工作者所见内容
hermes kanban specify [<id> | --all] [--tenant T]      # 将分诊栏中的想法充实
        [--author NAME] [--json]                       #   为完整规范并提升至待办
hermes kanban gc [--event-retention-days N]            # 工作空间 + 旧事件 + 旧日志
        [--log-retention-days N]
```

所有命令也作为交互式 CLI 和消息网关中的斜杠命令提供（参见下方的 [`/kanban` 斜杠命令](#kanban-斜杠命令)）。

## `/kanban` 斜杠命令 {#kanban-slash-command}

每个 `hermes kanban <action>` 动词也可以通过 `/kanban <action>` 访问——无论是在交互式 `hermes chat` 会话**内部**，还是从任何网关平台（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost、电子邮件、短信）。这两种界面都调用完全相同的 `hermes_cli.kanban.run_slash()` 入口点，该入口点复用了 `hermes kanban` 的参数解析树，因此在 CLI、`/kanban` 和 `hermes kanban` 中，参数表面、标志和输出格式都是一致的。您无需离开聊天界面即可操作看板。

```
/kanban list
/kanban show t_abcd
/kanban create "write launch post" --assignee writer --parent t_research
/kanban comment t_abcd "looks good, ship it"
/kanban unblock t_abcd
/kanban dispatch --max 3
/kanban specify t_abcd                  # 将一行分类描述充实为完整的规范
/kanban specify --all --tenant engineering  # 扫描某个租户下的所有分类任务
```

像在 shell 中一样用引号包裹多词参数——`run_slash` 使用 `shlex.split` 解析行的其余部分，所以 `"..."` 和 `'...'` 都有效。

### 运行中使用：`/kanban` 绕过运行智能体保护

网关通常会在智能体仍在思考时将斜杠命令和用户消息排入队列——这是为了防止您在第一次回合进行中意外启动第二个回合。**`/kanban` 明确豁免于此保护。** 看板数据存储在 `~/.hermes/kanban.db` 中，而不是运行智能体的状态中，因此读取（`list`、`show`、`context`、`tail`、`watch`、`stats`、`runs`）和写入（`comment`、`unblock`、`block`、`assign`、`archive`、`create`、`link`、……）操作都会立即执行，即使在回合进行中也是如此。

这正是数据分离的意义所在：

-   一个工作智能体因等待对等方而阻塞 → 您从手机发送 `/kanban unblock t_abcd`，调度器在下一个周期就会捡起这个对等方。被阻塞的工作智能体不会被中断——它只是不再处于阻塞状态。
-   您发现某个卡片需要人工上下文 → `/kanban comment t_xyz "use the 2026 schema, not 2025"` 会落到该任务的线程中，*下一次*该任务运行时会在 `kanban_show()` 中读取到这条评论。
-   您想在不停止编排器的情况下了解您的集群在做什么 → `/kanban list --mine` 或 `/kanban stats` 可以在不触碰您主对话的情况下检查看板。

### `/kanban create` 时自动订阅（仅限网关）

当您通过网关使用 `/kanban create "…"` 创建任务时，原始聊天（平台 + 聊天 ID + 线程 ID）会自动订阅该任务的终止事件（`completed`、`blocked`、`gave_up`、`crashed`、`timed_out`）。您将为每个终止事件收到一条消息——包括 `completed` 时工作智能体结果摘要的第一行——而无需轮询或记住任务 ID。

```
you> /kanban create "transcribe today's podcast" --assignee transcriber
bot> Created t_9fc1a3  (ready, assignee=transcriber)
     (subscribed — you'll be notified when t_9fc1a3 completes or blocks)

… ~8 minutes later …

bot> ✓ t_9fc1a3 completed by transcriber
     transcribed 42 minutes, saved to podcast/2026-05-04.md
```

订阅会在任务达到 `done` 或 `archived` 状态时自动移除。如果您使用 `--json`（机器输出）进行脚本化创建，则会跳过自动订阅——假设脚本化调用者希望通过 `/kanban notify-subscribe` 显式管理订阅。

### 消息中的输出截断

网关平台有实际的消息长度上限。如果 `/kanban list`、`/kanban show` 或 `/kanban tail` 产生的输出超过约 3800 个字符，响应将被截断，并附带 `… (truncated; use \`hermes kanban …\` in your terminal for full output)` 页脚。CLI 界面没有此类限制。

### 自动补全

在交互式 CLI 中，输入 `/kanban ` 并按 Tab 键可循环浏览内置子命令列表（`list`、`ls`、`show`、`create`、`assign`、`link`、`unlink`、`claim`、`comment`、`complete`、`block`、`unblock`、`archive`、`tail`、`dispatch`、`context`、`init`、`gc`）。CLI 参考中列出的其余动词（`watch`、`stats`、`runs`、`log`、`assignees`、`heartbeat`、`notify-subscribe`、`notify-list`、`notify-unsubscribe`、`daemon`）也有效——只是尚未加入自动补全提示列表。

## 协作模式

看板无需任何新的原语即可支持以下八种模式：

| 模式 | 形状 | 示例 |
|---|---|---|
| **P1 扇出** | N 个兄弟智能体，相同角色 | “并行研究 5 个角度” |
| **P2 流水线** | 角色链：侦察员 → 编辑 → 作者 | 每日简报汇编 |
| **P3 投票/法定人数** | N 个兄弟智能体 + 1 个聚合器 | 3 个研究员 → 1 个审阅者挑选 |
| **P4 长期运行日志** | 相同配置文件 + 共享目录 + 定时任务 | Obsidian 仓库 |
| **P5 人在环中** | 工作智能体阻塞 → 用户评论 → 解除阻塞 | 模糊决策 |
| **P6 `@提及`** | 从行文中进行内联路由 | `@reviewer look at this` |
| **P7 线程作用域工作区** | 在线程中使用 `/kanban here` | 每个项目的网关线程 |
| **P8 集群管理** | 一个配置文件，N 个主题 | 50 个社交媒体账户 |
| **P9 分类指定器** | 粗略想法 → `triage` → `hermes kanban specify` 扩充内容 → `todo` | “将这一行变成一个规范的任务” |

有关每种模式的详细示例，请参阅 `docs/hermes-kanban-v1-spec.pdf`。

## 多租户使用

当一个专业集群服务于多个企业时，为每个任务标记租户：

```bash
hermes kanban create "monthly report" \
    --assignee researcher \
    --tenant business-a \
    --workspace dir:~/tenants/business-a/data/
```

工作智能体会接收到 `$HERMES_TENANT`，并以前缀命名其内存写入。看板、调度器和配置文件定义都是共享的；只有数据是作用域限定的。

## 网关通知

当您从网关（Telegram、Discord、Slack 等）运行 `/kanban create …` 时，原始聊天会自动订阅该新任务。网关的后台通知器每隔几秒轮询 `task_events`，并将每个终止事件（`completed`、`blocked`、`gave_up`、`crashed`、`timed_out`）的一条消息发送到该聊天。完成的任务还会发送工作智能体 `--result` 的第一行，这样您无需执行 `/kanban show` 就能看到结果。

您可以通过 CLI 显式管理订阅——当脚本/定时任务想要通知一个它不是源自的聊天时很有用：

```bash
hermes kanban notify-subscribe t_abcd \
    --platform telegram --chat-id 12345678 --thread-id 7
hermes kanban notify-list
hermes kanban notify-unsubscribe t_abcd \
    --platform telegram --chat-id 12345678 --thread-id 7
```

一旦任务达到 `done` 或 `archived` 状态，订阅会自动移除；无需手动清理。

## 运行 — 每次尝试一行

一个任务是一个逻辑工作单元；一次**运行**是对其的一次执行尝试。当调度器认领一个就绪的任务时，它会在 `task_runs` 中创建一行，并将 `tasks.current_run_id` 指向它。当该次尝试结束时——无论是完成、阻塞、崩溃、超时、生成失败还是回收——该运行行会以一个 `outcome`（结果）关闭，并且任务的指针会清空。一个被尝试了三次的任务会有三行 `task_runs` 记录。

为什么使用两张表而不是直接修改任务：你需要**完整的尝试历史记录**用于现实中的事后分析（“第二次审查尝试到了批准阶段，第三次合并了”），并且你需要一个干净的地方来存放每次尝试的元数据——哪些文件被修改了，哪些测试运行了，审查者注意到了哪些发现。这些是运行事实，而不是任务事实。

运行也是**结构化交接**所在的地方。当一个工作者完成一个任务（通过 `kanban_complete(...)`）时，它可以传递：

- `summary`（工具参数）/ `--summary`（CLI）—— 人工交接；记录在运行上；下游子任务在其 `build_worker_context` 中可以看到它。
- `metadata`（工具参数）/ `--metadata`（CLI）—— 记录在运行上的自由格式 JSON 字典；子任务会看到它被序列化后与摘要一起显示。
- `result`（工具参数）/ `--result`（CLI）—— 记录在任务行上的简短日志行（遗留字段，为向后兼容而保留）。

下游子任务读取其每个父任务最近一次已完成运行的摘要和元数据。重试的工作者读取其自身任务上的先前尝试（结果、摘要、错误），这样它们就不会重复已经失败的路径。

```
# 工作者实际做什么——一次工具调用，来自智能体循环内部：
kanban_complete(
    summary="implemented token bucket, keys on user_id with IP fallback, all tests pass",
    metadata={"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14},
    result="rate limiter shipped",
)
```

当你（人工）需要关闭一个工作者无法完成的任务时——例如一个被放弃的任务，或者一个你从仪表板手动标记为完成的任务——也可以通过 CLI 进行相同的交接：

```bash
hermes kanban complete t_abcd \
    --result "rate limiter shipped" \
    --summary "implemented token bucket, keys on user_id with IP fallback, all tests pass" \
    --metadata '{"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14}'

# 审查一个重试任务的尝试历史：
hermes kanban runs t_abcd
#   #  OUTCOME       PROFILE           ELAPSED  STARTED
#   1  blocked       worker               12s  2026-04-27 14:02
#        → BLOCKED: need decision on rate-limit key
#   2  completed     worker                8m   2026-04-27 15:18
#        → implemented token bucket, keys on user_id with IP fallback
```

运行在仪表板上公开显示（抽屉中的“运行历史”部分，每次尝试一行彩色行），并在 REST API 上公开显示（`GET /api/plugins/kanban/tasks/:id` 返回一个 `runs[]` 数组）。`PATCH /api/plugins/kanban/tasks/:id` 带有 `{status: "done", summary, metadata}` 会将两者都转发给内核，因此仪表板上的“标记完成”按钮与 CLI 等效。`task_events` 行携带着它们所属的 `run_id`，以便 UI 可以按尝试进行分组，而 `completed` 事件在其载荷中嵌入了第一行摘要（限制为 400 个字符），以便网关通知器无需第二次 SQL 查询即可呈现结构化交接。

**批量关闭注意事项。** `hermes kanban complete a b c --summary X` 会被拒绝——结构化交接是按运行进行的，因此将相同的摘要复制粘贴到 N 个任务几乎总是错误的。批量关闭 *不带* `--summary` / `--metadata` 对于常见的“我完成了一堆管理任务”情况仍然有效。

**状态变更导致的运行回收。** 如果你在仪表板中将一个正在运行的任务拖离 `running` 状态（回到 `ready`，或直接到 `todo`），或者归档一个仍在运行的任务，正在进行的运行会以 `outcome='reclaimed'` 关闭，而不是成为孤儿。当 `tasks.current_run_id` 为 `NULL` 时，`task_runs` 行始终处于终态，反之亦然——这个不变性在 CLI、仪表板、调度器和通知器中都成立。

**从未认领完成的合成运行。** 完成或阻塞一个从未被认领的任务（例如，人工从仪表板用摘要关闭一个 `ready` 任务，或 CLI 用户运行 `hermes kanban complete <ready-task> --summary X`）否则会丢失交接信息。作为替代，内核会插入一个零时长的运行行（`started_at == ended_at`），携带摘要/元数据/原因，以便尝试历史保持完整。`completed` / `blocked` 事件的 `run_id` 指向该行。

**实时抽屉刷新。** 当仪表板的 WebSocket 事件流为用户当前正在查看的任务报告新事件时，抽屉会重新加载自身（通过线程到其 `useEffect` 依赖列表中的每任务事件计数器）。不再需要关闭和重新打开即可看到运行的新行或更新后的结果。

### 向前兼容

`tasks` 表上保留了两个可空列用于 v2 工作流路由：`workflow_template_id`（该任务所属的模板）和 `current_step_key`（该模板中活动的步骤）。v1 内核在路由中忽略它们，但允许客户端写入它们，因此 v2 版本可以添加路由机制而无需另一次架构迁移。

## 事件参考

每次转换都会向 `task_events` 追加一行。每行携带一个可选的 `run_id`，以便 UI 可以按尝试对事件进行分组。类型分为三个组，便于过滤（`hermes kanban watch --kinds completed,gave_up,timed_out`）：

**生命周期**（关于任务作为逻辑单元发生了什么变化）：

| 类型 | 载荷 | 时机 |
|---|---|---|
| `created` | `{assignee, status, parents, tenant}` | 任务插入。`run_id` 为 `NULL`。 |
| `promoted` | — | `todo → ready`，因为所有父任务都达到了 `done`。`run_id` 为 `NULL`。 |
| `claimed` | `{lock, expires, run_id}` | 调度器原子性地为生成认领了一个 `ready` 任务。 |
| `completed` | `{result_len, summary?}` | 工作者写入了 `--result` / `--summary` 并且任务达到 `done`。`summary` 是第一行交接（400 字符上限）；完整版本在运行行上。如果对一个带有交接字段的从未认领的任务调用 `complete_task`，则会合成一个零时长运行，以便 `run_id` 仍然指向某个实体。 |
| `blocked` | `{reason}` | 工作者或人工将任务翻转为 `blocked`。对一个带有 `--reason` 的从未认领的任务调用时，会合成一个零时长运行。 |
| `unblocked` | — | `blocked → ready`，手动或通过 `/unblock`。`run_id` 为 `NULL`。 |
| `archived` | — | 从默认看板中隐藏。如果任务仍在运行，则携带作为副作用被回收的运行的 `run_id`。 |

**编辑**（非状态转换的人工驱动更改）：

| 类型 | 载荷 | 时机 |
|---|---|---|
| `assigned` | `{assignee}` | 负责人变更（包括取消分配）。 |
| `edited` | `{fields}` | 标题或正文更新。 |
| `reprioritized` | `{priority}` | 优先级变更。 |
| `status` | `{status}` | 仪表板拖放直接写入了一个状态（例如 `todo → ready`）。携带当从 `running` 拖离时被回收的运行的 `run_id`；否则 `run_id` 为 NULL。 |

**工作者遥测**（关于执行过程，而非逻辑任务）：

| 类型 | 载荷 | 时机 |
|---|---|---|
| `spawned` | `{pid}` | 调度器成功启动了一个工作者进程。 |
| `heartbeat` | `{note?}` | 工作者调用 `hermes kanban heartbeat $TASK` 以在长时间操作期间发出存活信号。 |
| `reclaimed` | `{stale_lock}` | 认领 TTL 过期且未完成；任务返回 `ready`。 |
| `crashed` | `{pid, claimer}` | 工作者 PID 不再存活，但 TTL 尚未过期。 |
| `timed_out` | `{pid, elapsed_seconds, limit_seconds, sigkill}` | 超过 `max_runtime_seconds`；调度器发送 SIGTERM（然后 5 秒宽限期后发送 SIGKILL）并重新入队。 |
| `spawn_failed` | `{error, failures}` | 一次生成尝试失败（缺少 PATH、工作区无法挂载…）。计数器递增；任务返回 `ready` 以进行重试。 |
| `gave_up` | `{failures, error}` | 在 N 次连续 `spawn_failed` 后熔断器触发。任务自动阻塞并带有最后一个错误。默认 N = 5；可通过 `--failure-limit` 覆盖。 |

`hermes kanban tail <id>` 显示单个任务的这些事件。`hermes kanban watch` 在整个看板范围内流式传输它们。

## 范围外

看板是刻意设计为单主机的。`~/.hermes/kanban.db` 是一个本地 SQLite 文件，调度器在同一台机器上生成工作者。不支持跨两个主机运行共享看板——没有用于“主机 A 上的工作者 X，主机 B 上的工作者 Y”的协调原语，并且崩溃检测路径假设 PID 是主机本地的。如果你需要多主机，请在每个主机上运行独立的看板，并使用 `delegate_task` / 消息队列来桥接它们。

## 设计规范

完整的设计——架构、并发正确性、与其他系统的比较、实施计划、风险、未决问题——位于 `docs/hermes-kanban-v1-spec.pdf`。在提交任何行为更改 PR 之前请阅读它。