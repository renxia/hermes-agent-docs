---
title: "Kanban Codex Lane"
sidebar_label: "Kanban Codex Lane"
description: "当一个 Hermes Kanban 工作者想要将 Codex CLI 作为隔离的实现通道运行，而 Hermes 仍然保留任务生命周期、协调和测试的所有权时，使用此功能。"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Kanban Codex Lane

当一个 Hermes Kanban 工作者想要将 Codex CLI 作为隔离的实现通道运行，而 Hermes 仍然保留任务生命周期、协调、测试和交接的所有权时，使用此功能。

## Skill metadata

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/autonomous-ai-agents/kanban-codex-lane` |
| Version | `1.0.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Tags | `kanban`, `codex`, `worktrees`, `autonomous-agents`, `prediction-market-bot` |
| Related skills | [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## Reference: full SKILL.md

:::info
这是 Hermes 在触发此技能时加载的完整技能定义。当该技能激活时，这就是智能体所看到的指令。
:::

# Kanban Codex Lane（看板 Codex 轨道）

## Overview（概述）

本技能定义了用于看板工作流的轻量级 Hermes+Codex 双轨约定。Hermes 始终是任务所有者：它调用 `kanban_show`，决定 Codex 是否适用，创建或选择一个隔离的工作区，启动并监控 Codex，协调任何差异，运行验证，并写入最终的 `kanban_complete` 或 `kanban_block` 交接。Codex 仅为输入轨道。Codex 的输出不是任务完成信号，也不是受信任的审查者，也不被允许直接写入持久化的看板状态。

此约定存在是为了让 Hermes 智能体可以在不更改调度器的情况下使用 Codex 来获得有界限性的实现帮助。调度器仍必须生成 Hermes 智能体。一个智能体可以选择性地在其自身运行中启动 Codex，然后接受、部分接受或拒绝该轨道，并在独立审查和测试后进行操作。

## When to Use（何时使用）

当所有以下条件都为真时，请使用 Codex 轨道：

- 看板任务是具有明确验收标准的编码、重构、文档、测试或机械迁移任务。
- Hermes 可以在一次运行中评估有界限性的差异。
- 代码库可以被复制或检出到一个隔离的 Git 工作树/分支中。
- 在 Codex 退出后，Hermes 可以自行运行相关的测试。
- 提示信息中可以说明所有安全约束和不得更改的文件。

当任一以下条件为真时，请勿使用 Codex 轨道：

- 该任务需要人类判断，而该判断尚未捕获在看板正文中。
- 工作体缺乏代码库访问权限、Codex 授权或有时间来协调结果。
- 变更涉及秘密信息、凭证存储、私人用户数据或生产订单录入系统。
- 进行一次小的直接编辑比启动另一个智能体更快更安全。
- 该任务仅为研究目的，应产生一份书面交接而不是差异（diff）。
- 工作体可能会仅仅根据 Codex 的自我报告就标记为完成。

## Ownership Rules（所有权规则）

1. Hermes 拥有看板生命周期。Codex 绝不能调用 `kanban_complete`、`kanban_block`、`kanban_create`、网关消息传递或任何作为工作体替代的 Hermes 板 CLI。
2. Hermes 拥有最终接受权。将 Codex 的提交/差异视为未经信任的补丁，直到经过审查和验证。
3. Hermes 拥有测试执行权。Codex 可以运行测试，但这些运行只是建议性的；必须使用代码库的规范包装器（canonical wrapper）从 Hermes 处重复进行验证。
4. Hermes 拥有安全保障。如果 Codex 更改了安全边界、风险门控、实时交易行为或秘密信息处理，即使测试通过，也必须拒绝该轨道。
5. Hermes 拥有清理工作。杀死卡住的 Codex 进程，并在不再需要时移除临时工作树。

## Required Worktree and Branch Pattern（所需的工作树和分支模式）

绝不能在共享的脏检出状态中直接运行 Codex。使用一个将该轨道与看板任务关联起来并保持不受信任编辑隔离的分支/工作树名称。

推荐变量：

```bash
TASK_ID="${HERMES_KANBAN_TASK:-t_manual}"
REPO="/path/to/repo"
BASE="$(git -C "$REPO" rev-parse --abbrev-ref HEAD)"
SAFE_TASK="$(printf '%s' "$TASK_ID" | tr -cd '[:alnum:]_-')"
BRANCH="codex/${SAFE_TASK}/$(date -u +%Y%m%d%H%M%S)"
WORKTREE="/tmp/${SAFE_TASK}-codex-lane"
```

创建隔离轨道：

```bash
git -C "$REPO" fetch --all --prune
git -C "$REPO" worktree add -b "$BRANCH" "$WORKTREE" "$BASE"
git -C "$WORKTREE" status --short --branch
```

如果当前的看板工作区已经是为该任务创建的隔离 Git 工作树，则仅当 `git status --short` 干净（除了故意的 Hermes 编辑）时，才可以在其中创建一个兄弟 Codex 分支。否则，请创建一个单独的临时工作树，并在协调后将接受的提交进行樱桃采摘（cherry-pick）或复制回。

清理工作：

```bash
git -C "$REPO" worktree remove "$WORKTREE"
git -C "$REPO" branch -D "$BRANCH"  # 仅在已复制/樱桃采摘或故意拒绝接受提交后执行
```

如果工作树需要作为审查的产物保留，请保留它；将其记录在 `codex_lane.artifacts` 中并在交接中提及。

## Codex Capability Checks（Codex 能力检查）

在启动 Codex 之前运行这些检查。缺少 Codex 是跳过该轨道的正常原因，而不是一个任务阻塞点，前提是 Hermes 可以直接完成该任务。

```bash
command -v codex
codex --version
codex features list | grep -i goals || true
```

如果需要 `/goal` 支持，请在检查可用性后才启用或使用功能标志启动：

```bash
codex features enable goals || true
codex --enable goals --version
```

身份验证可以通过 `OPENAI_API_KEY` 或 Codex CLI OAuth 状态（通常是 `~/.codex/auth.json`）进行。不要打印令牌文件。缺少 `OPENAI_API_KEY` 不代表身份验证不可用。

## Mode Selection（模式选择）

对于 Codex 应自行退出的有界限性一次性编辑，请使用 `codex exec`：

```python
terminal(
    command="codex exec --full-auto '$(cat /tmp/codex_prompt.md)'",
    workdir=WORKTREE,
    background=True,
    pty=True,
    notify_on_complete=True,
)
```

仅当需要更广泛的多步工作，并且从持久化的目标跟踪中获益时，才使用 Codex `/goal`。在 PTY/tmux 会话中或如果功能默认禁用，则使用 `codex --enable goals` 进行交互式启动。保持目标是自包含的：代码库路径、任务 ID、安全约束、允许范围、验收标准、测试和提交期望。

将以下 `/goal` 目标文本作为示例粘贴到 Codex 中：

```text
/goal 仅在此代码库中工作: <WORKTREE>。任务: <TASK_ID> <TITLE>。
Hermes 拥有看板生命周期；不要调用 Hermes 的看板工具或消息传递。
在 <BRANCH> 分支上创建小的提交。遵循提示中的 PMB 安全约束。
运行请求的验证命令并报告确切输出。在生成差异和摘要后停止。
```

对于 prediction-market-bot 或安全敏感的代码库，不要使用 `--yolo`。最好在隔离的工作树中依赖 `--full-auto`，然后依靠 Hermes 进行协调。

## Prompt Construction（提示构建）

对于 prediction-market-bot 工作，请使用 `templates/pmb-codex-lane-prompt.md` 中提供的链接模板。对于其他代码库，保持相同的结构，将 PMB 特定的安全块替换为代码库特定的不变式（invariants）。

每个 Codex 提示都必须包括：

- `task_id`、标题和完整的看板验收标准。
- 代码库路径、工作树路径、分支名称和允许的文件范围。
- 明确声明：Hermes 拥有看板生命周期；Codex 仅为输入轨道。
- 所需输出：简洁的摘要、更改的文件、提交、运行的测试和已知的风险。
- 禁止的操作：秘密信息访问、外部消息传递、板状态修改、不相关的重构、依赖升级（除非必需）。
- Codex 可以运行的验证命令以及 Hermes 将随后运行的命令。

对于 PMB，必须逐字包含以下强制安全约束：

```text
PMB 安全约束:
- live-SIM 仅为纸面操作；不要添加或启用实时 REST 订单录入。
- 切勿使用市场订单。
- 不要添加执行交叉（execution crossing）或绕过价格/风险检查。
- 不要伪造被动填充、填充、PnL、订单状态或协调证据。
- 不要削弱风险门控、限制、终止开关或故障关闭行为。
- 除非明确要求，否则不要将研究/选择放在 C++ 热路径之外。
- 不得读取、打印、写入或要求秘密信息/令牌/凭证。
```

## Monitoring, Timeout, and Kill Behavior（监控、超时和终止行为）

使用 PTY 和完成通知在后台启动长时间的 Codex 轨道：

```python
result = terminal(
    command="codex exec --full-auto '$(cat /tmp/codex_prompt.md)'",
    workdir=WORKTREE,
    background=True,
    pty=True,
    notify_on_complete=True,
)
session_id = result["session_id"]
```

进行监控而不干预：

```python
process(action="poll", session_id=session_id)
process(action="log", session_id=session_id, limit=200)
process(action="wait", session_id=session_id, timeout=300)
```

对于长于两分钟的轨道，每隔几分钟发送一次看板心跳（heartbeat），例如 `kanban_heartbeat(note="Codex 轨道正在 <WORKTREE> 中运行；等待测试/差异")`。

终止条件：

- 对于任务剩余的预算而言，没有有用的输出。
- Codex 请求秘密信息、生产凭证或外部权限。
- Codex 尝试修改工作树之外的文件。
- Codex 开始不相关的重写或依赖项混乱（dependency churn）。
- Codex 仍在接近工作体超时，但不存在安全的局部产物。

终止命令：

```python
process(action="kill", session_id=session_id)
```

终止后，检查 `git status --short`，仅当安全时才保留有用的补丁，并记录 `codex_lane.result: timed_out` 或 `rejected`，同时提供具体的 `rejected_reason`。

## Reconciliation Checklist（协调清单）

Hermes 必须在接受任何 Codex 轨道结果之前执行此清单：

- [ ] `git -C <WORKTREE> status --short --branch` 只显示预期的文件。
- [ ] Hermes 审查了 `git -C <WORKTREE> diff --stat` 和 `git diff`。
- [ ] 不包含秘密信息、凭证、生成的缓存、不相关数据或本地产物。
- [ ] PMB 安全约束已得到保留：没有实时 REST 订单录入，没有市场订单，没有执行交叉，没有伪造的被动填充/PnL，没有削弱风险门控，没有秘密信息。
- [ ] Codex 的提交足够小，可以干净地进行樱桃采摘或合并（squash）。
- [ ] Hermes 自己运行了规范测试，使用 `scripts/run_tests.sh` 用于 Hermes 智能体或代码库的文档化包装器用于其他代码库。
- [ ] 所有由 Codex 运行的测试都已单独列出，与 Hermes 运行的测试区分开来。
- [ ] 已接受的提交/差异已被应用于 Hermes 所拥有的工作区/分支。
- [ ] 被拒绝或部分的工作有具体的理由和产物路径（如果有用）。

验收结果：

- `accepted`（已接受）：Codex 的差异/提交已被审查、应用并验证。
- `partial`（部分）：部分 Codex 工作被接受，但需要进行编辑或樱桃采摘；被拒绝的部分已记录在案。
- `rejected`（已拒绝）：没有 Codex 更改被接受；原因已记录。
- `timed_out`（超时）：Codex 超出了轨道预算；可能存在有用的产物，也可能不存在。

## kanban_complete Metadata Schema（看板完成元数据模式）

对于所有考虑过该轨道的任务，请在 `metadata.codex_lane` 下包含此对象。如果未使用 Codex，请设置 `used: false` 并在 `rejected_reason` 或兄弟 `notes` 字段中解释原因。

```json
{
  "codex_lane": {
    "used": true,
    "mode": "exec | goal | skipped",
    "worktree": "/absolute/path/to/codex/worktree",
    "branch": "codex/t_caa69668/20260508100000",
    "command": "codex exec --full-auto ...",
    "result": "accepted | rejected | partial | timed_out",
    "accepted_commits": ["<sha1>", "<sha2>"],
    "rejected_reason": "完全接受时留空；否则提供具体原因",
    "tests_run": [
      {"command": "scripts/run_tests.sh tests/tools/test_x.py", "exit_code": 0, "owner": "hermes"},
      {"command": "codex-reported: npm test", "exit_code": 0, "owner": "codex"}
    ],
    "artifacts": ["/absolute/path/to/log-or-patch"]
  }
}
```

对于故意跳过 Codex 的任务：

```json
{
  "codex_lane": {
    "used": false,
    "mode": "skipped",
    "worktree": null,
    "branch": null,
    "command": null,
    "result": "rejected",
    "accepted_commits": [],
    "rejected_reason": "Hermes 的直接编辑比启动 Codex 更小、更安全。",
    "tests_run": [],
    "artifacts": []
  }
}
```

## 常见陷阱

1. 将Codex的自我报告视为验证。务必检查diff并从Hermes重新运行测试。
2. 在用户的脏（dirty）主检出版本中运行Codex。务必在工作树/分支中隔离操作。
3. 让Codex拥有看板(Kanban)。Codex可以总结进度，但Hermes负责编写看板状态。
4. 在提示中忘记PMB安全不变量（safety invariants）。缺少安全文本属于车道设置失败。
5. 使用`/goal`进行快速编辑。除非需要持久的多步延续，否则请优先使用`codex exec`。
6. 在不记录原因的情况下终止一个卡住的车道(lane)。`rejected_reason`必须解释该决策。
7. 因为测试通过而接受广泛的不相关清理。只拒绝或挑选（cherry-pick）范围内的更改。

## 验证清单

- [ ] 在运行`command -v codex`、`codex --version`和可选目标功能检查之后才跳过或启动Codex。
- [ ] Codex仅在隔离的工作树/分支中运行。
- [ ] 提示符（Prompt）包括任务范围、所有权规则、适用的PMB安全约束和验证命令。
- [ ] Hermes审查了`git diff`和安全敏感文件。
- [ ] Hermes独立运行了规范测试（canonical tests）。
- [ ] `kanban_complete.metadata.codex_lane`遵循上述模式。
- [ ] 清理了临时进程和不必要的工件（worktrees）。