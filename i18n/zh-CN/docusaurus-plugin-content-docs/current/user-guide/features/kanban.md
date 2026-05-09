---
sidebar_position: 12
title: "看板（多智能体面板）"
description: "基于 SQLite 的持久化任务面板，用于协调多个 Hermes 配置文件"
---

# 看板 — 多智能体配置文件协作

> **想要一个入门指南？** 请阅读[看板教程](./kanban-tutorial) —— 包含四个用户故事（独立开发者、批量处理、带重试的角色流水线、断路器），以及每个故事的仪表板截图。本页是参考文档；教程是叙事性说明。

Hermes 看板是一个持久的任务面板，由您的所有 Hermes 配置文件共享，允许多个具名智能体协作完成任务，而无需脆弱的进程内子智能体集群。每个任务都是 `~/.hermes/kanban.db` 中的一行；每次交接都是任何人都可以读取和写入的一行；每个工作者都是一个具有自身身份的完整操作系统进程。

### 两个入口：模型通过工具操作，您通过 CLI 操作

该面板有两个入口，均由同一个 `~/.hermes/kanban.db` 支持：

- **智能体通过专用的 `kanban_*` 工具集驱动面板** —— 包括 `kanban_show`、`kanban_complete`、`kanban_block`、`kanban_heartbeat`、`kanban_comment`、`kanban_create`、`kanban_link`。调度器会为每个工作者启动这些工具，并将其包含在其模式中；模型通过直接调用这些工具（*而非*通过 shell 调用 `hermes kanban`）来读取其任务并交接工作。请参阅下面的[工作者如何与面板交互](#how-workers-interact-with-the-board)。
- **您（以及脚本和 cron）通过 CLI 上的 `hermes kanban …`、斜杠命令 `/kanban …` 或仪表板来驱动面板**。这些入口适用于人类和自动化场景 —— 即没有工具调用模型支持的场景。

两个入口都通过相同的 `kanban_db` 层进行路由，因此读取操作看到一致的视图，写入操作不会发生漂移。本页其余部分展示 CLI 示例，因为它们易于复制粘贴，但每个 CLI 动词都有模型使用的工具调用等效项。

这是 `delegate_task` 无法覆盖的工作负载形态：

- **研究分类** —— 并行研究员 + 分析师 + 撰写者，人工参与。
- **计划运维** —— 每日定期简报，持续数周构建日志。
- **数字孪生** —— 持久的具名助手（`inbox-triage`、`ops-review`），随时间积累记忆。
- **工程流水线** —— 分解 → 在并行工作树中实现 → 审查 → 迭代 → 提交 PR。
- **批量工作** —— 一个专家管理 N 个对象（50 个社交账户、12 个受监控服务）。

有关完整的设计原理、与 Cline Kanban / Paperclip / NanoClaw / Google Gemini Enterprise 的比较分析，以及八种典型协作模式，请参阅仓库中的 `docs/hermes-kanban-v1-spec.pdf`。

## 看板 vs. `delegate_task`

它们看起来很相似；但它们不是相同的原语。

| | `delegate_task` | 看板 |
|---|---|---|
| 形态 | RPC 调用（分叉 → 合并） | 持久化消息队列 + 状态机 |
| 父级 | 阻塞直到子级返回 | 创建后即“发射后不管” |
| 子级身份 | 匿名子智能体 | 具有持久化记忆的具名配置文件 |
| 可恢复性 | 无 —— 失败即失败 | 阻塞 → 解除阻塞 → 重新运行；崩溃 → 重新获取 |
| 人工参与 | 不支持 | 可随时评论 / 解除阻塞 |
| 每项任务的智能体数量 | 一次调用 = 一个子智能体 | 任务生命周期内 N 个智能体（重试、审查、跟进） |
| 审计追踪 | 上下文压缩后丢失 | 永久存储在 SQLite 中的持久化行 |
| 协调方式 | 分层（调用者 → 被调用者） | 对等 —— 任何配置文件可读取/写入任何任务 |

**一句话区别：** `delegate_task` 是函数调用；看板是一个工作队列，其中每次交接都是任何配置文件（或人类）可见且可编辑的一行。

**当父级智能体在继续之前需要一个简短的推理答案、不涉及人工、结果返回父级上下文时，请使用 `delegate_task`。**

**当工作跨越智能体边界、需要跨重启持久化、可能需要人工输入、可能由不同角色接手，或事后需要可发现时，请使用看板。**

它们可以共存：看板工作者在其运行期间可能会内部调用 `delegate_task`。

## 核心概念

- **看板** — 一个独立的任务队列，拥有自己的 SQLite 数据库、工作空间目录和调度循环。单个安装可以拥有多个看板（例如，每个项目、代码库或领域一个看板）；请参阅下面的[看板（多项目）](#boards-multi-project)。单项目用户始终停留在 `default` 看板，并且在此文档部分之外永远不会看到“看板”一词。
- **任务** — 一行记录，包含标题、可选正文、一个负责人（配置文件名称）、状态（`triage | todo | ready | running | blocked | done | archived`）、可选租户命名空间、可选幂等键（用于重试自动化的去重）。
- **链接** — `task_links` 行，记录父任务 → 子任务的依赖关系。当所有父任务都标记为 `done` 时，调度器会将子任务状态从 `todo` 提升为 `ready`。
- **评论** — 智能体间协议。智能体和人类可以追加评论；当工作进程（重新）启动时，它会读取完整的评论线程作为其上下文的一部分。
- **工作空间** — 工作进程运行的目录。三种类型：
  - `scratch`（默认）— 在 `~/.hermes/kanban/workspaces/<id>/`（或在非默认看板中为 `~/.hermes/kanban/boards/<slug>/workspaces/<id>/`）下的全新临时目录。
  - `dir:<path>` — 一个现有的共享目录（Obsidian 保险库、邮件操作目录、每个账户的文件夹）。**必须是绝对路径。** 像 `dir:../tenants/foo/` 这样的相对路径在调度时会被拒绝，因为它们会相对于调度器当前的工作目录（CWD）进行解析，这具有歧义，并且是一种 confused-deputy 逃逸向量。除此之外，路径是被信任的 — 这是你的机器，你的文件系统，工作进程以你的用户 ID 运行。这是受信任的本地用户威胁模型；看板在设计上是单机运行的。
  - `worktree` — 用于编码任务的 `.worktrees/<id>/` 下的 git 工作树。工作进程端通过 `git worktree add` 创建它。
- **调度器** — 一个长期运行的循环，每 N 秒（默认 60 秒）执行以下操作：回收过期的认领、回收崩溃的工作进程（PID 已消失但 TTL 尚未过期）、提升就绪任务、原子性地认领、生成指定的配置文件。默认情况下在**网关内部**运行（`kanban.dispatch_in_gateway: true`）。每个调度周期会扫描所有看板；生成的工作进程会固定 `HERMES_KANBAN_BOARD` 环境变量，因此它们无法看到其他看板。如果同一个任务连续 ~5 次生成失败，调度器会自动将其阻塞，并将最后一次错误作为原因 — 防止因配置文件不存在、工作空间无法挂载等原因导致的任务抖动。
- **租户** — 看板*内部*的可选字符串命名空间。一个专家团队可以通过工作空间路径和内存键前缀的数据隔离，为多个业务（`--tenant business-a`）提供服务。租户是一种软过滤；看板才是硬隔离边界。

## 看板（多项目）

看板让你可以将不相关的工作流 — 每个项目、代码库或领域一个 — 分离到隔离的队列中。新安装只有一个名为 `default` 的看板（数据库位于 `~/.hermes/kanban.db`，以保持向后兼容性）。只想处理一个工作流的用户永远不需要了解看板；该功能是选择加入的。

每个看板的隔离是绝对的：

- 每个看板有独立的 SQLite 数据库（`~/.hermes/kanban/boards/<slug>/kanban.db`）。
- 独立的 `workspaces/` 和 `logs/` 目录。
- 为任务生成的工作进程**只能**看到其所在看板的任务 — 调度器会在子进程环境中设置 `HERMES_KANBAN_BOARD`，并且工作进程可以访问的每个 `kanban_*` 工具都会读取它。
- 不允许跨看板链接任务（保持模式简单；如果你确实需要跨项目引用，请使用自由文本提及并手动通过 ID 查找它们）。

### 从 CLI 管理看板

```bash
# 查看磁盘上的内容。新安装只显示 "default"。
hermes kanban boards list

# 创建一个新看板。
hermes kanban boards create atm10-server \
    --name "ATM10 Server" \
    --description "Minecraft modded server ops" \
    --icon 🎮 \
    --switch                   # 可选：使其成为活动看板

# 在不切换的情况下操作特定看板。
hermes kanban --board atm10-server list
hermes kanban --board atm10-server create "Restart ATM server" --assignee ops

# 更改后续调用的 "当前" 看板。
hermes kanban boards switch atm10-server
hermes kanban boards show             # 当前哪个看板是活动的？

# 重命名显示名称（slug 是不可变的 — 它是目录名称）。
hermes kanban boards rename atm10-server "ATM10 (Prod)"

# 归档（默认）— 将看板目录移动到 boards/_archived/<slug>-<ts>/。
# 可通过将目录移回进行恢复。
hermes kanban boards rm atm10-server

# 硬删除 — `rm -rf` 看板目录。无法恢复。
hermes kanban boards rm atm10-server --delete
```

看板解析顺序（优先级从高到低）：

1. CLI 调用中显式的 `--board <slug>`。
2. `HERMES_KANBAN_BOARD` 环境变量（调度器在生成工作进程时设置，因此工作进程无法看到其他看板）。
3. `~/.hermes/kanban/current` — 由 `hermes kanban boards switch` 持久化的 slug。
4. `default`。

Slug 会经过验证：小写字母数字 + 连字符 + 下划线，1-64 个字符，必须以字母数字开头。大写输入会自动转换为小写。任何其他字符（斜杠、空格、点、`..`）都会在 CLI 层被拒绝，因此路径遍历技巧无法命名看板。

### 从仪表板管理看板

`hermes dashboard` → 一旦存在多个看板（或任何看板有任务），看板标签页顶部就会显示一个看板切换器。单看板用户只看到一个小的 `+ New board` 按钮；切换器在需要之前是隐藏的。

- **看板下拉菜单** — 选择活动看板。你的选择会保存到浏览器的 `localStorage` 中，因此在重新加载时不会丢失，也不会影响你打开的终端中 CLI 的 `current` 指针。
- **+ New board** — 打开一个模态框，要求输入 slug、显示名称、描述和图标。可选择自动切换到新看板。
- **归档** — 仅在非 `default` 看板上显示。确认后，将看板目录移动到 `boards/_archived/`。

所有仪表板 API 端点都接受 `?board=<slug>` 进行看板范围限定。事件 WebSocket 在连接时会固定到一个看板；在 UI 中切换会针对新看板打开一个新的 WS。

## 快速入门

以下命令是**您**（人类）设置看板并创建任务的操作。一旦任务被分配，调度器就会生成指定的配置文件作为工作进程，此后**模型会通过 `kanban_*` 工具调用来驱动任务，而不是通过 CLI 命令**——参见[工作进程如何与看板交互](#how-workers-interact-with-the-board)。

```bash
# 1. 创建看板（您）
hermes kanban init

# 2. 启动网关（托管嵌入式调度器）
hermes gateway start

# 3. 创建任务（您 —— 或者通过 kanban_create 的协调智能体）
hermes kanban create "research AI funding landscape" --assignee researcher

# 4. 实时查看活动（您）
hermes kanban watch

# 5. 查看看板（您）
hermes kanban list
hermes kanban stats
```

当调度器获取到 `t_abcd` 并生成 `researcher` 配置文件时，该工作进程的模型所做的第一件事就是调用 `kanban_show()` 来读取其任务。它不会运行 `hermes kanban show t_abcd`。

### 网关嵌入式调度器（默认）

调度器运行在网关进程中。无需安装，也无需管理单独的服务 —— 只要网关处于运行状态，就绪任务就会在下一个调度周期（默认为 60 秒）被获取。

```yaml
# config.yaml
kanban:
  dispatch_in_gateway: true        # 默认值
  dispatch_interval_seconds: 60    # 默认值
```

可通过 `HERMES_KANBAN_DISPATCH_IN_GATEWAY=0` 在运行时覆盖配置标志，用于调试。标准的网关监督机制适用：直接运行 `hermes gateway start`，或者将网关配置为 systemd 用户单元（参见网关文档）。如果没有运行的网关，`ready` 状态的任务将保持原状，直到有网关启动 —— `hermes kanban create` 在创建时会对此发出警告。

单独运行 `hermes kanban daemon` 进程的方式**已被弃用**；请使用网关。如果您确实无法运行网关（例如无头主机策略禁止长期运行的服务等），`--force` 参数可以暂时保留旧的独立守护进程一个发布周期，但同时在同一 `kanban.db` 上运行网关嵌入式调度器和独立守护进程会导致声明竞争，且不受支持。

### 幂等创建（用于自动化 / Webhook）

```bash
# 第一次调用会创建任务。任何后续使用相同键的调用
# 都会返回现有任务 ID，而不是重复创建。
hermes kanban create "nightly ops review" \
    --assignee ops \
    --idempotency-key "nightly-ops-$(date -u +%Y-%m-%d)" \
    --json
```

### 批量 CLI 动词

所有生命周期动词都接受多个 ID，因此您可以使用一条命令批量清理：

```bash
hermes kanban complete t_abc t_def t_hij --result "batch wrap"
hermes kanban archive  t_abc t_def t_hij
hermes kanban unblock  t_abc t_def
hermes kanban block    t_abc "need input" --ids t_def t_hij
```

## 工作者如何与看板交互

**工作者不会调用 `hermes kanban` 命令。** 调度器在启动工作者时，会在其子进程环境变量中设置 `HERMES_KANBAN_TASK=t_abcd`，该环境变量会激活模型 schema 中专用的**看板工具集**——七个工具，这些工具通过 Python 的 `kanban_db` 层直接读取和修改看板，与 CLI 的工作方式相同。运行中的工作者像调用其他工具一样调用这些工具；它永远看不到也不需要 `hermes kanban` CLI。

| 工具 | 用途 | 必需参数 |
|---|---|---|
| `kanban_show` | 读取当前任务（标题、正文、先前尝试、父级交接、评论、完整的预格式化 `worker_context`）。默认为环境变量中的任务 ID。 | — |
| `kanban_complete` | 以结构化的 `summary` + `metadata` 完成交接。 | `summary` / `result` 至少其一 |
| `kanban_block` | 因需要人工输入而升级，需提供 `reason`。 | `reason` |
| `kanban_heartbeat` | 在长时间操作期间发送存活信号。纯副作用。 | — |
| `kanban_comment` | 向任务线程附加一条持久化注释。 | `task_id`、`body` |
| `kanban_create` | （编排器）将任务分解为多个子任务，指定 `assignee`，可选 `parents`、`skills` 等。 | `title`、`assignee` |
| `kanban_link` | （编排器）事后添加 `parent_id → child_id` 依赖关系边。 | `parent_id`、`child_id` |

典型的工作者轮次如下所示：

```
# 模型的工具调用，按顺序：
kanban_show()                                     # 无参数 — 使用 HERMES_KANBAN_TASK
# （模型读取返回的 worker_context，通过终端/文件工具执行工作）
kanban_heartbeat(note="已完成一半 — 8 个文件中的 4 个已转换")
# （更多工作）
kanban_complete(
    summary="将 limiter.py 迁移至令牌桶算法；添加 14 个测试，全部通过",
    metadata={"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14},
)
```

而**编排器**工作者的行为则是将任务分解：

```
kanban_show()
kanban_create(
    title="调研 2024-2026 年 ICP 融资情况",
    assignee="researcher-a",
    body="重点关注种子轮 + A 轮，北美地区，AI 相关领域",
)
# → 返回 {"task_id": "t_r1", ...}
kanban_create(title="调研 ICP 融资情况 — 欧洲视角", assignee="researcher-b", body="…")
# → 返回 {"task_id": "t_r2", ...}
kanban_create(
    title="将调研结果综合成发布简报",
    assignee="writer",
    parents=["t_r1", "t_r2"],                     # 当两个子任务都完成时，提升为“就绪”状态
    body="一页纸，300 字，语气中立",
)
kanban_complete(summary="分解为 2 个调研任务 + 1 个写作任务；已链接依赖关系")
```

三个“（编排器）”工具 — `kanban_create`、`kanban_link` 以及在其他任务上使用 `kanban_comment` — 对所有工作者都可用；约定（由 `kanban-orchestrator` 技能强制执行）是：工作者配置不会分解任务，而编排器配置不会执行具体任务。

### 为什么使用工具而不是调用 `hermes kanban`

三个原因：

1. **后端可移植性。** 终端工具指向远程后端（Docker / Modal / Singularity / SSH）的工作者会在容器*内部*运行 `hermes kanban complete`，而该容器中并未安装 `hermes`，且 `~/.hermes/kanban.db` 也未挂载。看板工具运行在智能体自身的 Python 进程中，无论终端后端如何，始终能访问 `~/.hermes/kanban.db`。
2. **避免 shell 引号脆弱性。** 通过 shlex + argparse 传递 `--metadata '{"files": [...]}'` 是一个潜在的隐患。结构化工具参数完全跳过了这一步。
3. **更好的错误处理。** 工具结果是模型可以推理的结构化 JSON，而不是需要解析的 stderr 字符串。

**普通会话中零 schema 占用。** 普通的 `hermes chat` 会话在其 schema 中没有任何 `kanban_*` 工具。每个工具上的 `check_fn` 仅在 `HERMES_KANBAN_TASK` 设置时才返回 True，而这仅在调度器启动此进程时发生。对于从不使用看板的用户，不会产生工具膨胀。

`kanban-worker` 和 `kanban-orchestrator` 技能会教会模型在何时以及以何种顺序调用哪个工具。

### 推荐的交接证据

`kanban_complete(summary=..., metadata={...})` 故意设计得很灵活：
摘要是人类可读的收尾说明，而 `metadata` 是机器可读的交接信息，下游智能体、审查者或仪表板可以重用，无需从散文中提取。

对于工程和审查任务，建议使用以下可选的元数据格式：

```json
{
  "changed_files": ["path/to/file.py"],
  "verification": ["pytest tests/hermes_cli/test_kanban_db.py -q"],
  "dependencies": ["父任务 ID 或外部问题（如有）"],
  "blocked_reason": null,
  "retry_notes": "如果这是重试，之前失败的原因",
  "residual_risk": ["未测试或仍需人工审查的内容"]
}
```

这些键是一种约定，而非 schema 要求。其有用的特性在于，每个工作者都会留下足够的证据，使下一个读者能够快速回答四个问题：

1. 发生了什么变化？
2. 如何验证的？
3. 如果失败，什么可以解除阻塞或重试？
4. 还有哪些风险是故意遗留的？

请勿将机密、原始日志、令牌、OAuth 材料或无关的对话记录放入 `metadata`。请改为存储指针和摘要。如果任务没有文件或测试，请在 `summary` 中明确说明，并使用 `metadata` 记录确实存在的证据，例如源 URL、问题 ID 或手动审查步骤。

### 工作者技能

任何应该能够处理看板任务的工作者配置都必须加载 `kanban-worker` 技能。它会教会工作者完整的生命周期，通过**工具调用**而非 CLI 命令：

1. 启动时，调用 `kanban_show()` 读取标题 + 正文 + 父级交接 + 先前尝试 + 完整评论线程。
2. 通过终端工具 `cd $HERMES_KANBAN_WORKSPACE` 并在该目录下执行工作。
3. 在长时间操作期间，每隔几分钟调用 `kanban_heartbeat(note="...")`。
4. 使用 `kanban_complete(summary="...", metadata={...})` 完成，或在卡住时使用 `kanban_block(reason="...")`。

`kanban-worker` 是一个捆绑技能，在安装和更新期间会同步到每个配置中 — 无需单独的 Skills Hub 安装步骤。请验证您用于看板工作者的配置（`researcher`、`writer`、`ops` 等）中是否存在该技能：

```bash
hermes -p <your-worker-profile> skills list | grep kanban-worker
```

如果捆绑副本缺失，请为该配置恢复它：

```bash
hermes -p <your-worker-profile> skills reset kanban-worker --restore
```

调度器在启动每个工作者时也会自动传递 `--skills kanban-worker`，因此即使配置的默认技能配置不包含它，工作者也始终拥有可用的模式库。

### 为特定任务固定额外技能

有时，单个任务需要 specialist 上下文，而 assignee 配置默认不携带 — 例如需要 `translation` 技能的翻译工作，需要 `github-code-review` 的审查任务，或需要 `security-pr-audit` 的安全审计。与其每次编辑 assignee 的配置，不如直接将技能附加到任务上。

**从编排器智能体**（通常情况 — 一个智能体将工作路由给另一个），使用 `kanban_create` 工具的 `skills` 数组：

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

**从仪表板**，在行内创建表单的**技能**字段中以逗号分隔输入技能名称。

这些技能是**附加**到内置的 `kanban-worker` 的 — 调度器会为每个技能（以及内置技能）发出一个 `--skills <name>` 标志，因此工作者启动时会加载所有这些技能。技能名称必须与 assignee 配置上实际安装的技能匹配（运行 `hermes skills list` 查看可用技能）；不支持运行时安装。

### 编排器技能

**行为良好的编排器不会自己执行工作。** 它会将用户的目标分解为任务，链接它们，将每个任务分配给 specialist，然后退后。`kanban-orchestrator` 技能将其编码为工具调用模式：反诱惑规则、标准 specialist 名册（`researcher`、`writer`、`analyst`、`backend-eng`、`reviewer`、`ops`），以及基于 `kanban_create` / `kanban_link` / `kanban_comment` 的分解 playbook。

典型的编排器轮次（两个并行研究员交接给一个 writer）：

```
# 用户目标：“起草一篇关于 ICP 融资格局的发布文章”
kanban_create(title="调研 ICP 融资，北美视角",  assignee="researcher-a", body="…")  # → t_r1
kanban_create(title="调研 ICP 融资，欧洲视角",  assignee="researcher-b", body="…")  # → t_r2
kanban_create(
    title="将 ICP 融资调研综合成发布文章草稿",
    assignee="writer",
    parents=["t_r1", "t_r2"],        # 当两个研究员都完成时，提升为“就绪”状态
    body="一页纸，语气中立，内联引用来源",
)                                     # → t_w1
# 可选：稍后发现交叉依赖，无需重新创建任务即可添加
kanban_link(parent_id="t_r1", child_id="t_followup")
kanban_complete(
    summary="分解为 2 个并行调研任务 → 1 个综合任务；当两个研究员都完成时，writer 开始工作",
)
```

`kanban-orchestrator` 是一个捆绑技能。它在安装和更新期间会同步到每个配置中，因此无需单独的 Skills Hub 安装步骤。请验证您的编排器配置中是否存在该技能：

```bash
hermes -p orchestrator skills list | grep kanban-orchestrator
```

如果捆绑副本缺失，请为该配置恢复它：

```bash
hermes -p orchestrator skills reset kanban-orchestrator --restore
```

为了获得最佳效果，请将其与一个工具集仅限于看板操作（`kanban`、`gateway`、`memory`）的配置配对，这样编排器即使尝试也无法执行实施任务。

## 仪表板（GUI）

`/kanban` 命令行界面和斜杠命令足以在无头模式下运行看板，但视觉化看板通常是人类参与循环的正确界面：分类、跨配置文件监督、阅读评论线程以及在列之间拖拽卡片。Hermes 将其作为**捆绑的仪表板插件**提供，位于 `plugins/kanban/` —— 不是核心功能，也不是独立服务 —— 遵循 [扩展仪表板](./extending-the-dashboard) 中描述的模型。

使用以下命令打开：

```bash
hermes kanban init      # 一次性操作：如果尚不存在，则创建 kanban.db
hermes dashboard        # “Kanban” 标签页将出现在导航栏中，位于“Skills”之后
```

### 插件提供的功能

- 一个 **Kanban** 标签页，每个状态显示一列：`triage`（分类）、`todo`（待办）、`ready`（就绪）、`running`（运行中）、`blocked`（阻塞）、`done`（完成）（当切换开关打开时还包括 `archived`（已归档））。
  - `triage` 是用于存放粗略想法的暂存列，预期由规范制定者完善。使用 `hermes kanban create --triage`（或通过“Triage”列的内联创建）创建的任务将位于此处，调度器会将其搁置，直到人类或规范制定者将其提升至 `todo` / `ready`。运行 `hermes kanban specify <id>` 可让辅助 LLM 将分类任务扩展为具体规范（包含目标、方法和验收标准的标题 + 正文），并一步将其提升至 `todo`；`--all` 可一次性处理所有分类任务。在 `config.yaml` 的 `auxiliary.triage_specifier` 下配置运行规范制定者的模型。
- 卡片显示任务 ID、标题、优先级徽章、租户标签、分配的配置文件、评论/链接数量、**进度药丸**（当任务有依赖项时显示 `N/M` 子任务已完成），以及“创建于 N 前”。每张卡片上的复选框支持多选。
- **Running 列中的每个配置文件通道** —— 工具栏复选框可切换按被分配人对 Running 列进行子分组。
- **通过 WebSocket 实时更新** —— 插件以短轮询间隔跟踪仅追加的 `task_events` 表；看板会立即反映任何配置文件（CLI、网关或另一个仪表板标签页）的操作。重新加载会被去抖，因此事件突发只会触发一次重新获取。
- **在列之间拖放**卡片以更改状态。拖放操作会发送 `PATCH /api/plugins/kanban/tasks/:id`，该请求会通过 CLI 使用的相同 `kanban_db` 代码路由 —— 三个界面永远不会出现偏差。移动到破坏性状态（`done`、`archived`、`blocked`）时会提示确认。触摸设备使用基于指针的回退方案，因此看板可在平板电脑上使用。
- **内联创建** —— 点击任何列标题上的 `+` 可输入标题、被分配人、优先级，以及（可选）从涵盖所有现有任务的下拉列表中选择父任务。从“Triage”列创建时会自动将新任务暂存到分类中。
- **多选与批量操作** —— 按住 Shift/Ctrl 点击卡片或勾选其复选框可将其添加到选择中。顶部会出现一个批量操作栏，提供批量状态转换、归档和重新分配（通过配置文件下拉列表或“(unassign)”）功能。破坏性批量操作会先提示确认。每个 ID 的部分失败会被报告，但不会中止其余操作。
- **点击卡片**（不按 Shift/Ctrl）可打开一个侧边抽屉（按 Escape 或点击外部可关闭），其中包含：
  - **可编辑标题** —— 点击标题可重命名。
  - **可编辑被分配人 / 优先级** —— 点击元数据行可重写。
  - **可编辑描述** —— 默认渲染为 Markdown（标题、粗体、斜体、内联代码、围栏代码、`http(s)` / `mailto:` 链接、项目符号列表），带有一个“编辑”按钮，可切换为文本区域。Markdown 渲染是一个小巧、防 XSS 的渲染器 —— 所有替换都在 HTML 转义的输入上运行，只有 `http(s)` / `mailto:` 链接会通过，并且始终设置 `target="_blank"` + `rel="noopener noreferrer"`。
  - **依赖项编辑器** —— 父任务和子任务的芯片列表，每个芯片都有一个 `×` 用于取消链接，以及涵盖所有其他任务的下拉列表，用于添加新的父任务或子任务。循环尝试会在服务器端被拒绝，并显示清晰的消息。
  - **状态操作行**（→ triage / → ready / → running / block / unblock / complete / archive），破坏性转换会提示确认。对于 **Triage** 列中的卡片，该行还暴露一个 **✨ Specify** 按钮，该按钮调用辅助 LLM（`config.yaml` 中的 `auxiliary.triage_specifier`）将一行描述扩展为具体规范（包含目标、方法和验收标准的标题 + 正文），并将任务提升至 `todo`。相同的行为也可通过 CLI（`hermes kanban specify <id>` / `--all`）、任何网关平台（`/kanban specify <id>`）以及通过 `POST /api/plugins/kanban/tasks/:id/specify` 以编程方式实现。
  - 结果部分（同样渲染为 Markdown）、评论线程（按 Enter 提交）、最近 20 个事件。
- **工具栏过滤器** —— 自由文本搜索、租户下拉列表（默认为 `config.yaml` 中的 `dashboard.kanban.default_tenant`）、被分配人下拉列表、“显示已归档”切换开关、“按配置文件分通道”切换开关，以及一个 **Nudge dispatcher** 按钮，因此您无需等待下一个 60 秒滴答。

视觉上，目标是熟悉的 Linear / Fusion 布局：深色主题、带计数的列标题、彩色状态点、优先级和租户的药丸芯片。插件仅读取主题 CSS 变量（`--color-*`、`--radius`、`--font-mono` 等），因此它会自动适应任何活动的仪表板主题。

### 架构

GUI 严格是一个**通过数据库读取 + 通过 kanban_db 写入**的层，不拥有自己的域逻辑：

```
┌────────────────────────┐      WebSocket (跟踪 task_events)
│   React SPA (插件)     │ ◀──────────────────────────────────┐
│   HTML5 拖放           │                                    │
└──────────┬─────────────┘                                    │
           │ 通过 fetchJSON 的 REST                            │
           ▼                                                  │
┌────────────────────────┐     写入直接调用 kanban_db.*        │
│  FastAPI 路由          │     —— 与 CLI /kanban 动词使用        │
│  plugins/kanban/       │     相同的代码路径                  │
│  dashboard/plugin_api.py                                    │
└──────────┬─────────────┘                                    │
           │                                                  │
           ▼                                                  │
┌────────────────────────┐                                    │
│  ~/.hermes/kanban.db   │ ───── 追加 task_events ────────────┘
│  (WAL, 共享)           │
└────────────────────────┘
```

### REST 接口

所有路由都挂载在 `/api/plugins/kanban/` 下，并受仪表板的临时会话令牌保护：

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/board?tenant=<name>&include_archived=…` | 按状态列分组的完整看板，以及用于过滤器下拉列表的租户 + 被分配人 |
| `GET` | `/tasks/:id` | 任务 + 评论 + 事件 + 链接 |
| `POST` | `/tasks` | 创建（包装 `kanban_db.create_task`，接受 `triage: bool` 和 `parents: [id, …]`） |
| `PATCH` | `/tasks/:id` | 状态 / 被分配人 / 优先级 / 标题 / 正文 / 结果 |
| `POST` | `/tasks/bulk` | 对 `ids` 中的每个 ID 应用相同的补丁（状态 / 归档 / 被分配人 / 优先级）。每个 ID 的失败会被报告，但不会中止其他操作 |
| `POST` | `/tasks/:id/comments` | 追加评论 |
| `POST` | `/tasks/:id/specify` | 运行分类规范制定者 —— 辅助 LLM 完善任务正文并将其从 `triage` 提升至 `todo`。返回 `{ok, task_id, reason, new_title}`；`ok=false` 并在“不在分类中”/ 无辅助客户端 / LLM 错误时返回人类可读的原因，状态码为 200，而非 4xx |
| `POST` | `/links` | 添加依赖项（`parent_id` → `child_id`） |
| `DELETE` | `/links?parent_id=…&child_id=…` | 移除依赖项 |
| `POST` | `/dispatch?max=…&dry_run=…` | 轻推调度器 —— 跳过 60 秒等待 |
| `GET` | `/config` | 从 `config.yaml` 读取 `dashboard.kanban` 首选项 —— `default_tenant`、`lane_by_profile`、`include_archived_by_default`、`render_markdown` |
| `WS` | `/events?since=<event_id>` | `task_events` 行的实时流 |

每个处理程序都是一个薄包装 —— 插件约为 700 行 Python 代码（路由 + WebSocket 跟踪 + 批量批处理器 + 配置读取器），不添加新的业务逻辑。一个微小的 `_conn()` 辅助程序会在每次读取和写入时自动初始化 `kanban.db`，因此无论用户是首先打开仪表板、直接访问 REST API，还是运行 `hermes kanban init`，全新安装都能正常工作。

### 仪表板配置

`~/.hermes/config.yaml` 中 `dashboard.kanban` 下的任何这些键都会更改标签页的默认值 —— 插件在加载时通过 `GET /config` 读取它们：

```yaml
dashboard:
  kanban:
    default_tenant: acme              # 预选租户过滤器
    lane_by_profile: true             # “按配置文件分通道”切换开关的默认值
    include_archived_by_default: false
    render_markdown: true             # 设置为 false 以使用纯 <pre> 渲染
```

每个键都是可选的，并会回退到所示的默认值。

### 安全模型

仪表板的 HTTP 认证中间件[明确跳过 `/api/plugins/`](./extending-the-dashboard#backend-api-routes) —— 插件路由在设计上是未经身份验证的，因为仪表板默认绑定到 localhost。这意味着看板 REST 接口可从主机上的任何进程访问。

WebSocket 多了一步：它要求仪表板的临时会话令牌作为 `?token=…` 查询参数（浏览器无法在升级请求上设置 `Authorization`），这与浏览器内 PTY 桥使用的模式相匹配。

如果您运行 `hermes dashboard --host 0.0.0.0`，每个插件路由（包括看板）都会变得可从网络访问。**不要在共享主机上这样做。** 看板包含任务正文、评论和工作区路径；攻击者访问这些路由将获得对您整个协作表面的读取权限，并且还可以创建 / 重新分配 / 归档任务。

`~/.hermes/kanban.db` 中的任务与配置文件无关，这是有意为之（这是协调原语）。如果您使用 `hermes -p <配置文件> dashboard` 打开仪表板，看板仍会显示主机上由任何其他配置文件创建的任务。所有配置文件都属于同一用户，但如果存在多个角色，这一点值得了解。

### 实时更新

`task_events` 是一个仅追加的 SQLite 表，其 `id` 是单调递增的。WebSocket 端点会保存每个客户端最后看到的事件 ID，并在新行写入时将其推送给客户端。当一批事件到达时，前端会重新加载（非常轻量的）看板端点——这比尝试根据每种事件类型修补本地状态更简单且更正确。WAL 模式意味着读取循环永远不会阻塞分发器的 `BEGIN IMMEDIATE` 声明事务。

### 扩展它

该插件使用标准的 Hermes 仪表板插件契约——请参阅[扩展仪表板](./extending-the-dashboard)以获取完整清单参考、shell 插槽、页面作用域插槽和插件 SDK。额外的列、自定义卡片外观、租户过滤的布局，或完整的 `tab.override` 替换，都可以在不 fork 此插件的情况下实现。

要禁用而不删除：在 `config.yaml` 中添加 `dashboard.plugins.kanban.enabled: false`（或删除 `plugins/kanban/dashboard/manifest.json`）。

### 作用域边界

GUI 故意设计得非常轻量。插件所做的所有操作都可以通过 CLI 访问；插件只是让人类使用起来更舒适。自动分配、预算、治理门禁和组织结构图视图仍属于用户空间——一个路由器配置文件、另一个插件，或重用 `tools/approval.py`——正如设计规范中“超出范围”部分所列出的那样。

## CLI 命令参考

这是**您**（或脚本、cron、仪表板）用来驱动看板的表层接口。在调度器（dispatcher）内部运行的工作进程（workers）使用 `kanban_*` [工具表层接口](#how-workers-interact-with-the-board) 执行相同的操作——此处的 CLI 和那里的工具都通过 `kanban_db` 路由，因此这两个表层接口在结构上保持一致。

```
hermes kanban init                                     # 创建 kanban.db + 打印守护进程提示
hermes kanban create "<标题>" [--body ...] [--assignee <配置文件>]
                                [--parent <id>]... [--tenant <名称>]
                                [--workspace scratch|worktree|dir:<路径>]
                                [--priority N] [--triage] [--idempotency-key KEY]
                                [--max-runtime 30m|2h|1d|<秒数>]
                                [--skill <名称>]...
                                [--json]
hermes kanban list [--mine] [--assignee P] [--status S] [--tenant T] [--archived] [--json]
hermes kanban show <id> [--json]
hermes kanban assign <id> <配置文件>                    # 或 'none' 以取消分配
hermes kanban link <父级_id> <子级_id>
hermes kanban unlink <父级_id> <子级_id>
hermes kanban claim <id> [--ttl 秒数]
hermes kanban comment <id> "<文本>" [--author 名称]

# 批量操作动词 — 接受多个 id：
hermes kanban complete <id>... [--result "..."]
hermes kanban block <id> "<原因>" [--ids <id>...]
hermes kanban unblock <id>...
hermes kanban archive <id>...

hermes kanban tail <id>                                # 跟踪单个任务的事件流
hermes kanban watch [--assignee P] [--tenant T]        # 将全部事件实时流式传输到终端
        [--kinds completed,blocked,…] [--interval 秒数]
hermes kanban heartbeat <id> [--note "..."]            # 工作进程针对长时间操作的活跃信号
hermes kanban runs <id> [--json]                       # 尝试历史记录（每次运行一行）
hermes kanban assignees [--json]                       # 磁盘上的配置文件 + 每个分配者的任务计数
hermes kanban dispatch [--dry-run] [--max N]           # 一次性执行
        [--failure-limit N] [--json]
hermes kanban daemon --force                           # 已弃用 — 独立调度器（请改用 `hermes gateway start`）
        [--failure-limit N] [--pidfile 路径] [-v]
hermes kanban stats [--json]                           # 按状态 + 按分配者计数
hermes kanban log <id> [--tail 字节数]                  # 来自 ~/.hermes/kanban/logs/ 的工作进程日志
hermes kanban notify-subscribe <id>                    # 网关桥接钩子（由网关中的 /kanban 使用）
        --platform <名称> --chat-id <id> [--thread-id <id>] [--user-id <id>]
hermes kanban notify-list [<id>] [--json]
hermes kanban notify-unsubscribe <id>
        --platform <名称> --chat-id <id> [--thread-id <id>]
hermes kanban context <id>                             # 工作进程看到的内容
hermes kanban specify [<id> | --all] [--tenant T]      # 将 triage 列中的想法充实为完整规范并提升至待办事项
        [--author 名称] [--json]                       #   
hermes kanban gc [--event-retention-days N]            # 工作区 + 旧事件 + 旧日志
        [--log-retention-days N]
```

所有命令也可在交互式 CLI 和消息传递网关中作为斜杠命令使用（请参阅下面的 [`/kanban` 斜杠命令](#kanban-slash-command)）。

## `/kanban` 斜杠命令 {#kanban-slash-command}

每一个 `hermes kanban <action>` 动词也可以通过 `/kanban <action>` 调用——既可以在交互式 `hermes chat` 会话中使用，**也可以**在任何网关平台（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost、电子邮件、短信）中使用。这两种界面都调用完全相同的 `hermes_cli.kanban.run_slash()` 入口点，该入口点复用 `hermes kanban` 的 argparse 树，因此在 CLI、`/kanban` 和 `hermes kanban` 中，参数界面、标志和输出格式都是完全一致的。您无需离开聊天即可操作看板。

```
/kanban list
/kanban show t_abcd
/kanban create "write launch post" --assignee writer --parent t_research
/kanban comment t_abcd "looks good, ship it"
/kanban unblock t_abcd
/kanban dispatch --max 3
/kanban specify t_abcd                  # 将一个简单的分类任务扩展为详细的规范
/kanban specify --all --tenant engineering  # 在一个租户中批量处理所有分类任务
```

引用多词参数的方式与在 shell 中相同——`run_slash` 使用 `shlex.split` 解析行尾内容，因此 `"..."` 和 `'...'` 均可使用。

### 运行中用法：`/kanban` 绕过运行中智能体的保护机制

网关通常会在某个智能体仍在思考时，将斜杠命令和用户消息排队——这是为了防止您在第一个回合尚未完成时意外启动第二个回合。**`/kanban` 明确不受此保护机制限制。** 看板数据存储在 `~/.hermes/kanban.db` 中，而非运行中智能体的状态中，因此读取操作（`list`、`show`、`context`、`tail`、`watch`、`stats`、`runs`）和写入操作（`comment`、`unblock`、`block`、`assign`、`archive`、`create`、`link`……）都会立即执行，即使在智能体运行回合中也是如此。

这正是这种设计分离的全部意义所在：

- 某个工作智能体因等待同伴而被阻塞 → 您可以通过手机发送 `/kanban unblock t_abcd`，调度器会在下一次轮询时唤醒该同伴。被阻塞的工作智能体不会被中断——它只是不再被阻塞。
- 您发现某张卡片需要人工提供上下文 → `/kanban comment t_xyz "use the 2026 schema, not 2025"` 会直接添加到任务线程中，该任务的*下一次*运行将在 `kanban_show()` 中读取该注释。
- 您想了解您的智能体集群正在做什么，但不想停止编排器 → `/kanban list --mine` 或 `/kanban stats` 可以查看看板状态，而不会干扰您的主对话。

### 在 `/kanban create` 时自动订阅（仅限网关）

当您通过网关使用 `/kanban create "…"` 创建任务时，发起聊天的上下文（平台 + 聊天 ID + 线程 ID）会自动订阅该任务的终止事件（`completed`、`blocked`、`gave_up`、`crashed`、`timed_out`）。您会为每个终止事件收到一条消息——包括任务 `completed` 时工作智能体结果摘要的第一行——而无需轮询或记住任务 ID。

```
you> /kanban create "transcribe today's podcast" --assignee transcriber
bot> Created t_9fc1a3  (ready, assignee=transcriber)
     (subscribed — you'll be notified when t_9fc1a3 completes or blocks)

… ~8 minutes later …

bot> ✓ t_9fc1a3 completed by transcriber
     transcribed 42 minutes, saved to podcast/2026-05-04.md
```

一旦任务达到 `done` 或 `archived` 状态，订阅会自动移除。如果您使用 `--json`（机器输出）脚本化创建任务，则不会自动订阅——我们假设脚本调用者希望通过 `/kanban notify-subscribe` 显式管理订阅。

### 消息中的输出截断

网关平台对消息长度有实际限制。如果 `/kanban list`、`/kanban show` 或 `/kanban tail` 的输出超过约 3800 个字符，响应将被截断，并附带一个 `… (truncated; use \`hermes kanban …\` in your terminal for full output)` 的页脚。CLI 界面则没有此类限制。

### 自动补全

在交互式 CLI 中，输入 `/kanban ` 并按 Tab 键会循环显示内置子命令列表（`list`、`ls`、`show`、`create`、`assign`、`link`、`unlink`、`claim`、`comment`、`complete`、`block`、`unblock`、`archive`、`tail`、`dispatch`、`context`、`init`、`gc`）。上述 CLI 参考中列出的其余动词（`watch`、`stats`、`runs`、`log`、`assignees`、`heartbeat`、`notify-subscribe`、`notify-list`、`notify-unsubscribe`、`daemon`）也有效——只是尚未包含在自动补全提示列表中。

## 协作模式

看板无需任何新的原语即可支持以下八种模式：

| 模式 | 形状 | 示例 |
|---|---|---|
| **P1 扇出** | N 个同级任务，相同角色 | “并行研究 5 个角度” |
| **P2 流水线** | 角色链：侦察员 → 编辑 → 作者 | 每日简报汇编 |
| **P3 投票 / 法定人数** | N 个同级任务 + 1 个聚合器 | 3 名研究员 → 1 名审核员选择 |
| **P4 长期运行日志** | 相同配置 + 共享目录 + 定时任务 | Obsidian 知识库 |
| **P5 人在回路** | 工作智能体阻塞 → 用户评论 → 解除阻塞 | 模糊决策 |
| **P6 `@提及`** | 从散文中进行内联路由 | `@reviewer look at this` |
| **P7 线程限定工作区** | 在某个线程中使用 `/kanban here` | 每个项目的网关线程 |
| **P8 集群分发** | 一个配置，N 个主题 | 50 个社交账户 |
| **P9 分类规范器** | 粗略想法 → `triage` → `hermes kanban specify` 展开正文 → `todo` | “将这个简单描述转化为一个规范化的任务” |

每种模式的实际示例，请参阅 `docs/hermes-kanban-v1-spec.pdf`。

## 多租户用法

当一个专家智能体集群服务于多个业务时，请为每个任务打上租户标签：

```bash
hermes kanban create "monthly report" \
    --assignee researcher \
    --tenant business-a \
    --workspace dir:~/tenants/business-a/data/
```

工作智能体会接收到 `$HERMES_TENANT` 环境变量，并通过前缀来区分其内存写入。看板、调度器和配置定义都是共享的；只有数据是隔离的。

## 网关通知

当您通过网关（Telegram、Discord、Slack 等）运行 `/kanban create …` 时，发起聊天的上下文会自动订阅新任务。网关的后台通知器会每隔几秒轮询 `task_events`，并将每个终止事件（`completed`、`blocked`、`gave_up`、`crashed`、`timed_out`）的消息发送到该聊天。已完成的任务还会发送工作智能体 `--result` 的第一行，因此您无需使用 `/kanban show` 即可看到结果。

您也可以通过 CLI 显式管理订阅——当脚本 / 定时任务需要通知一个并非由其发起的聊天时，这非常有用：

```bash
hermes kanban notify-subscribe t_abcd \
    --platform telegram --chat-id 12345678 --thread-id 7
hermes kanban notify-list
hermes kanban notify-unsubscribe t_abcd \
    --platform telegram --chat-id 12345678 --thread-id 7
```

一旦任务达到 `done` 或 `archived` 状态，订阅会自动移除；无需手动清理。

## 运行 — 每次尝试对应一行

任务是一个逻辑工作单元；一次**运行**是执行该任务的一次尝试。当调度器认领一个就绪任务时，它会在 `task_runs` 中创建一行，并将 `tasks.current_run_id` 指向该行。当该尝试结束时 — 完成、阻塞、崩溃、超时、派生失败、被回收 — 运行行会以一个 `outcome` 关闭，任务指针清空。一个被尝试过三次的任务会有三行 `task_runs`。

为什么需要两个表而不是直接修改任务：你需要**完整的尝试历史**来进行现实世界的故障分析（“第二次评审尝试到了批准阶段，第三次合并了”），并且你需要一个干净的地方来附加每次尝试的元数据 — 哪些文件被更改了，哪些测试运行了，评审员注意到了哪些发现。这些是运行事实，而不是任务事实。

运行也是**结构化交接**存在的地方。当一个工作器完成一个任务（通过 `kanban_complete(...)`）时，它可以传递：

- `summary`（工具参数）/ `--summary`（CLI）— 人类交接；附加在运行上；下游子任务在其 `build_worker_context` 中看到它。
- `metadata`（工具参数）/ `--metadata`（CLI）— 运行上的自由格式 JSON 字典；子任务看到它与摘要一起序列化。
- `result`（工具参数）/ `--result`（CLI）— 附加在任务行上的简短日志行（遗留字段，为向后兼容而保留）。

下游子任务读取每个父任务最近完成的运行的摘要 + 元数据。重试的工作器读取其自身任务的先前尝试（结果、摘要、错误），这样它们就不会重复一条已经失败的路径。

```
# 工作器实际做的事情 — 一个工具调用，来自智能体循环内部：
kanban_complete(
    summary="实现了令牌桶，键基于 user_id，IP 作为回退，所有测试通过",
    metadata={"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14},
    result="速率限制器已发布",
)
```

当你（人类）需要关闭一个工作器无法完成的任务时，例如一个被放弃的任务，或者你从仪表板手动标记为已完成的任务，也可以通过 CLI 访问相同的交接：

```bash
hermes kanban complete t_abcd \
    --result "速率限制器已发布" \
    --summary "实现了令牌桶，键基于 user_id，IP 作为回退，所有测试通过" \
    --metadata '{"changed_files": ["limiter.py", "tests/test_limiter.py"], "tests_run": 14}'

# 查看重试任务的尝试历史：
hermes kanban runs t_abcd
#   #  结果         配置文件           耗时     开始时间
#   1  阻塞         工作器               12秒  2026-04-27 14:02
#        → 阻塞：需要决定速率限制键
#   2  完成         工作器                8分钟  2026-04-27 15:18
#        → 实现了令牌桶，键基于 user_id，IP 作为回退
```

运行在仪表板上暴露（抽屉中的运行历史部分，每次尝试一行彩色行），并且在 REST API 上（`GET /api/plugins/kanban/tasks/:id` 返回一个 `runs[]` 数组）。`PATCH /api/plugins/kanban/tasks/:id` 与 `{status: "done", summary, metadata}` 将两者转发到内核，因此仪表板的“标记完成”按钮等效于 CLI。`task_events` 行携带它们所属的 `run_id`，以便 UI 可以按尝试分组，并且 `completed` 事件在其负载中嵌入第一行摘要（限制为 400 个字符），以便网关通知器可以在没有第二次 SQL 往返的情况下呈现结构化交接。

**批量关闭警告。** `hermes kanban complete a b c --summary X` 被拒绝 — 结构化交接是按运行的，因此将相同的摘要复制粘贴到 N 个任务几乎总是错误的。批量关闭*不带* `--summary` / `--metadata` 仍然适用于常见的“我完成了一堆管理任务”的情况。

**来自状态变化的回收运行。** 如果你在仪表板上将一个正在运行的任务从 `running` 拖走（回到 `ready`，或直接到 `todo`），或者归档一个仍在运行的任务，进行中的运行会以 `outcome='reclaimed'` 关闭，而不是成为孤儿。当 `tasks.current_run_id` 为 `NULL` 时，`task_runs` 行始终处于终止状态，反之亦然 — 该不变量在 CLI、仪表板、调度器和通知器中都成立。

**从未认领的完成中合成运行。** 完成或阻塞一个从未被认领的任务（例如，人类从仪表板关闭一个 `ready` 任务并带有摘要，或 CLI 用户运行 `hermes kanban complete <ready-task> --summary X`）否则会丢失交接。相反，内核会插入一个零持续时间的运行行（`started_at == ended_at`），携带摘要 / 元数据 / 原因，以便尝试历史保持完整。`completed` / `blocked` 事件的 `run_id` 指向该行。

**实时抽屉刷新。** 当仪表板的 WebSocket 事件流为用户当前正在查看的任务报告新事件时，抽屉会重新加载自身（通过一个每任务事件计数器线程到其 `useEffect` 依赖列表中）。不再需要关闭和重新打开以查看运行的新行或更新的结果。

### 向前兼容性

`tasks` 上的两个可空列被保留用于 v2 工作流路由：`workflow_template_id`（此任务属于哪个模板）和 `current_step_key`（该模板中的哪个步骤处于活动状态）。v1 内核忽略它们进行路由，但允许客户端写入它们，因此 v2 版本可以添加路由机制而无需另一次模式迁移。

## 事件参考

每次转换都会向 `task_events` 附加一行。每行携带一个可选的 `run_id`，以便 UI 可以按尝试分组事件。种类分为三个集群，以便过滤（`hermes kanban watch --kinds completed,gave_up,timed_out`）：

**生命周期**（作为逻辑单元的任务发生了什么变化）：

| 种类 | 负载 | 何时 |
|---|---|---|
| `created` | `{assignee, status, parents, tenant}` | 任务插入。`run_id` 为 `NULL`。 |
| `promoted` | — | `todo → ready`，因为所有父任务都达到了 `done`。`run_id` 为 `NULL`。 |
| `claimed` | `{lock, expires, run_id}` | 调度器原子性地认领了一个 `ready` 任务以进行派生。 |
| `completed` | `{result_len, summary?}` | 工作器写入 `--result` / `--summary` 并且任务达到 `done`。`summary` 是第一行交接（400 字符限制）；完整版本存在于运行行上。如果在带有交接字段的从未认领的任务上调用 `complete_task`，则会合成一个零持续时间的运行，以便 `run_id` 仍然指向某个东西。 |
| `blocked` | `{reason}` | 工作器或人类将任务翻转为 `blocked`。当在带有 `--reason` 的从未认领的任务上调用时，会合成一个零持续时间的运行。 |
| `unblocked` | — | `blocked → ready`，要么手动，要么通过 `/unblock`。`run_id` 为 `NULL`。 |
| `archived` | — | 从默认看板中隐藏。如果任务仍在运行，则携带作为副作用被回收的运行的 `run_id`。 |

**编辑**（人类驱动的更改，不是转换）：

| 种类 | 负载 | 何时 |
|---|---|---|
| `assigned` | `{assignee}` | 分配者更改（包括取消分配）。 |
| `edited` | `{fields}` | 标题或正文更新。 |
| `reprioritized` | `{priority}` | 优先级更改。 |
| `status` | `{status}` | 仪表板拖放直接写入了状态（例如 `todo → ready`）。携带从 `running` 拖走时被回收的运行的 `run_id`；否则 `run_id` 为 NULL。 |

**工作器遥测**（关于执行过程，而不是逻辑任务）：

| 种类 | 负载 | 何时 |
|---|---|---|
| `spawned` | `{pid}` | 调度器成功启动了一个工作器进程。 |
| `heartbeat` | `{note?}` | 工作器调用 `hermes kanban heartbeat $TASK` 以在长时间操作期间发出活动信号。 |
| `reclaimed` | `{stale_lock}` | 认领 TTL 过期但没有完成；任务回到 `ready`。 |
| `crashed` | `{pid, claimer}` | 工作器 PID 不再活动，但 TTL 尚未过期。 |
| `timed_out` | `{pid, elapsed_seconds, limit_seconds, sigkill}` | `max_runtime_seconds` 超出；调度器发送 SIGTERM（然后在 5 秒宽限期后发送 SIGKILL）并重新排队。 |
| `spawn_failed` | `{error, failures}` | 一次派生尝试失败（缺少 PATH，工作区无法挂载，…）。计数器递增；任务返回 `ready` 以进行重试。 |
| `gave_up` | `{failures, error}` | 断路器在 N 次连续 `spawn_failed` 后触发。任务自动阻塞，并带有最后一个错误。默认 N = 5；通过 `--failure-limit` 覆盖。 |

`hermes kanban tail <id>` 显示单个任务的这些事件。`hermes kanban watch` 流式传输整个看板的事件。

## 超出范围

看板 deliberately 是单机的。`~/.hermes/kanban.db` 是一个本地 SQLite 文件，调度器在同一台机器上派生工作器。不支持在两台主机上运行共享看板 — 没有“主机 A 上的工作器 X，主机 B 上的工作器 Y”的协调原语，并且崩溃检测路径假设 PID 是主机本地的。如果你需要多主机，请为每台主机运行一个独立的看板，并使用 `delegate_task` / 消息队列来桥接它们。

## 设计规范

完整的设计 — 架构、并发正确性、与其他系统的比较、实现计划、风险、开放问题 — 存在于 `docs/hermes-kanban-v1-spec.pdf` 中。在提交任何行为更改 PR 之前，请阅读该文档。