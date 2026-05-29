---
title: "看板编码通道"
sidebar_label: "看板编码通道"
description: "当赫尔墨斯看板工作者希望将Codex CLI作为隔离的实现通道运行，同时由赫尔墨斯保留任务生命周期、协调、测试和交接的所有权时使用。"
---

{/* 本页面由网站脚本/scripts/generate-skill-docs.py从技能的SKILL.md自动生成。请编辑源文件SKILL.md，而非此页面。 */}

# 看板编码通道

当赫尔墨斯看板工作者希望将Codex CLI作为隔离的实现通道运行，同时由赫尔墨斯保留任务生命周期、协调、测试和交接的所有权时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/autonomous-ai-agents/kanban-codex-lane` |
| 版本 | `1.0.0` |
| 作者 | 赫尔墨斯智能体 |
| 许可证 | MIT |
| 标签 | `看板`, `编码`, `工作树`, `自主智能体`, `预测市场机器人` |
| 相关技能 | [`看板工作者`](/docs/user-guide/skills/bundled/devops/devops-kanban-worker), [`编码`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`赫尔墨斯智能体`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

```markdown
:::info
以下是在此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 看板 Codex 车道

## 概述

此技能为看板工作者定义了轻量级的 Hermes+Codex 双车道约定。Hermes 始终是任务所有者：它调用 `kanban_show`，决定是否适用 Codex，创建或选择一个隔离的工作空间，启动并监控 Codex，协调任何差异，运行验证，并写出最终的 `kanban_complete` 或 `kanban_block` 交接。Codex 仅是一个输入车道。Codex 的输出不是任务完成信号，不是可信的审查者，也不允许直接写入持久化的看板状态。

制定该约定是为了让 Hermes 工作者可以利用 Codex 提供有界的实施帮助，而无需更改调度器。调度器仍然必须生成 Hermes 工作者。工作者可以选择性地在其自身运行中生成 Codex，然后在独立审查和测试后接受、部分接受或拒绝该车道。

## 使用时机

当满足以下所有条件时，使用 Codex 车道：

- 看板任务是一个具有明确验收标准的编码、重构、文档、测试或机械迁移任务。
- 一个有界的差异可以在一次运行中由 Hermes 评估。
- 仓库可以在隔离的 git 工作树/分支中复制或签出。
- Hermes 可以在 Codex 退出后自行运行相关测试。
- 提示词可以陈述所有安全约束以及不得更改的文件。

当满足以下任一条件时，**不要**使用 Codex 车道：

- 任务需要的人类判断未在看板主体中体现。
- 工作者缺乏仓库访问权限、Codex 授权或协调结果的时间。
- 更改涉及密钥、凭证存储、私有用户数据或生产订单输入系统。
- 一次小的直接编辑比生成另一个智能体更快、更安全。
- 任务仅为研究性质，应产生书面交接而非差异。
- 工作者仅根据 Codex 的自我报告就倾向于标记为完成。

## 所有权规则

1.  **Hermes 拥有看板生命周期**。Codex 绝不能调用 `kanban_complete`、`kanban_block`、`kanban_create`、网关消息传递或任何 Hermes 看板 CLI 来替代工作者。
2.  **Hermes 拥有最终验收权**。将 Codex 的提交/差异视为不受信任的补丁，直到被审查和验证。
3.  **Hermes 拥有测试执行权**。Codex 可以运行测试，但这些运行仅供参考；需使用仓库的规范包装器从 Hermes 重复必要的验证。
4.  **Hermes 拥有安全权**。如果 Codex 更改了安全边界、风险关卡、实时交易行为或密钥处理，即使测试通过也应拒绝该车道。
5.  **Hermes 拥有清理权**。在不再需要时，终止卡住的 Codex 进程并移除临时工作树。

## 必需的工作树和分支模式

切勿在共享的脏签出中直接运行 Codex。使用将车道与看板任务关联并保持不受信任的编辑隔离的分支/工作树名称。

推荐变量：

```bash
TASK_ID="${HERMES_KANBAN_TASK:-t_manual}"
REPO="/path/to/repo"
BASE="$(git -C "$REPO" rev-parse --abbrev-ref HEAD)"
SAFE_TASK="$(printf '%s' "$TASK_ID" | tr -cd '[:alnum:]_-')"
BRANCH="codex/${SAFE_TASK}/$(date -u +%Y%m%d%H%M%S)"
WORKTREE="/tmp/${SAFE_TASK}-codex-lane"
```

创建隔离车道：

```bash
git -C "$REPO" fetch --all --prune
git -C "$REPO" worktree add -b "$BRANCH" "$WORKTREE" "$BASE"
git -C "$WORKTREE" status --short --branch
```

如果当前的看板工作空间已经是为该任务创建的隔离 git 工作树，你可以在其中创建一个同级 Codex 分支，但前提条件是 `git status --short` 是干净的（除了有意的 Hermes 编辑）。否则，创建一个单独的临时工作树，并在协调后将已接受的提交挑选或复制回来。

协调后的清理：

```bash
git -C "$REPO" worktree remove "$WORKTREE"
git -C "$REPO" branch -D "$BRANCH"  # 仅在已接受的提交被复制/挑选或有意拒绝后执行
```

如果工作树作为审查工件需要保留，请记录在 `codex_lane.artifacts` 中并在交接中提及。

## Codex 能力检查

在生成 Codex 之前运行这些检查。缺少 Codex 是跳过该车道的正常原因，如果 Hermes 能直接完成任务，则不是任务阻塞点。

```bash
command -v codex
codex --version
codex features list | grep -i goals || true
```

如果需要 `/goal` 支持，仅在检查可用性后启用或启动特性标志：

```bash
codex features enable goals || true
codex --enable goals --version
```

身份验证可通过 `OPENAI_API_KEY` 或 Codex CLI OAuth 状态（通常是 `~/.codex/auth.json`）进行。不要打印令牌文件。缺少 `OPENAI_API_KEY` 并不能证明身份验证不可用。

## 模式选择

对于 Codex 应自行退出的有界一次性编辑，使用 `codex exec`：

```python
terminal(
    command="codex exec --full-auto '$(cat /tmp/codex_prompt.md)'",
    workdir=WORKTREE,
    background=True,
    pty=True,
    notify_on_complete=True,
)
```

仅对于受益于持久性目标跟踪的更广泛的多步骤工作，才使用 Codex `/goal`。在 PTY/tmux 会话中交互式启动，或如果默认禁用则使用 `codex --enable goals` 启动。保持目标目标自包含：仓库路径、任务 ID、安全约束、允许范围、验收标准、测试和提交期望。

要粘贴到 Codex 中的 `/goal` 目标文本示例：

```text
/goal Work in this repository only: <WORKTREE>. Task: <TASK_ID> <TITLE>.
Hermes owns the Kanban lifecycle; do not call Hermes kanban tools or messaging.
Create small commits on branch <BRANCH>. Follow the PMB safety constraints in the prompt.
Run the requested verification commands and report exact outputs. Stop after producing a diff and summary.
```

对于预测市场机器人或安全敏感的仓库，不要使用 `--yolo`。优先在隔离的工作树中使用 `--full-auto`，然后依赖 Hermes 协调。

## 提示词构建

对于预测市场机器人相关工作，使用 `templates/pmb-codex-lane-prompt.md` 处的链接模板。对于其他仓库，保持相同结构，并用特定于仓库的不变量替换 PMB 特定的安全块。

每个 Codex 提示词必须包含：

- `task_id`、标题和完整的看板验收标准。
- 仓库路径、工作树路径、分支名称和允许的文件范围。
- 明确声明：Hermes 拥有看板生命周期；Codex 仅是一个输入车道。
- 要求的输出：简洁摘要、更改的文件、提交、运行的测试和已知风险。
- 禁止操作：访问密钥、外部消息传递、看板变更、不相关的重构、除非必要否则不进行依赖升级。
- Codex 可能运行的验证命令以及 Hermes 随后将运行的命令。

对于 PMB，逐字包含这些强制性安全约束：

```text
PMB safety constraints:
- live-SIM is paper-only; do not add or enable live REST order entry.
- Never use market orders.
- Do not add execution crossing or bypass price/risk checks.
- Do not fake passive fills, fills, PnL, order states, or reconciliation evidence.
- Do not weaken risk gates, limits, kill switches, or fail-closed behavior.
- Keep research/selection outside the C++ hot path unless explicitly requested.
- Do not read, print, write, or require secrets/tokens/credentials.
```

## 监控、超时和终止行为

在后台使用 PTY 和完成通知启动长时间运行的 Codex 车道：

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

监控而不干扰：

```python
process(action="poll", session_id=session_id)
process(action="log", session_id=session_id, limit=200)
process(action="wait", session_id=session_id, timeout=300)
```

对于超过两分钟的车道，每隔几分钟发送一次看板心跳，例如 `kanban_heartbeat(note="Codex lane running in <WORKTREE>; waiting for tests/diff")`。

终止条件：

- 在任务的剩余运行时间内没有有用的输出。
- Codex 请求密钥、生产凭证或外部权限。
- Codex 试图修改工作树之外的文件。
- Codex 开始不相关的重写或依赖混乱。
- Codex 在工作者超时前仍在运行，并且没有安全的部分工件存在。

终止命令：

```python
process(action="kill", session_id=session_id)
```

终止后，检查 `git status --short`，仅在安全时保留有用的补丁，并记录 `codex_lane.result: timed_out` 或 `rejected` 以及具体的 `rejected_reason`。

## 协调检查清单

Hermes 在接受任何 Codex 车道结果之前必须执行此检查清单：

- [ ] `git -C <WORKTREE> status --short --branch` 仅显示预期文件。
- [ ] `git -C <WORKTREE> diff --stat` 和 `git diff` 已由 Hermes 审查。
- [ ] 未包含密钥、凭证、生成的缓存、不相关数据或本地工件。
- [ ] PMB 安全约束得以保留：无实时 REST 订单输入、无市价单、无执行交叉、无虚假被动成交/PnL、无风险关卡削弱、无密钥。
- [ ] Codex 提交足够小，可以干净地挑选或压缩。
- [ ] Hermes 自行运行了规范测试，对于 Hermes 智能体使用 `scripts/run_tests.sh`，对于其他仓库使用仓库记录的包装器。
- [ ] 任何 Codex 运行的测试与 Hermes 运行的测试分别列出。
- [ ] 已接受的提交/差异已应用到 Hermes 拥有的工作空间/分支。
- [ ] 被拒绝或部分的工作有具体原因，如果有用则提供工件路径。

验收结果：

- `accepted`：Codex 差异/提交已审查、应用并验证。
- `partial`：部分 Codex 工作在编辑或挑选后被接受；被拒绝的部分已记录。
- `rejected`：未接受任何 Codex 更改；原因已记录。
- `timed_out`：Codex 超出了车道预算；可能存在或不存在有用的工件。
```

---
title: "kanban完成元数据架构"
description: "了解如何跟踪 Codex 智能体的执行情况、管理任务状态并记录工作树。"
slug: "kanban-complete-metadata-schema"
---

## kanban 完成元数据架构

在 `metadata.codex_lane` 下为每个考虑过该任务通道的任务包含此对象。如果未使用 Codex，请将 `used` 设置为 `false`，并在 `rejected_reason` 或同级 `notes` 字段中解释原因。

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
    "rejected_reason": "当被完全接受时为空；否则为具体原因",
    "tests_run": [
      {"command": "scripts/run_tests.sh tests/tools/test_x.py", "exit_code": 0, "owner": "hermes"},
      {"command": "codex-reported: npm test", "exit_code": 0, "owner": "codex"}
    ],
    "artifacts": ["/absolute/path/to/log-or-patch"]
  }
}
```

对于有意跳过 Codex 的任务：

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
    "rejected_reason": "直接由 Hermes 编辑比生成 Codex 更简单、更安全。",
    "tests_run": [],
    "artifacts": []
  }
}
```

## 常见陷阱

1.  将 Codex 的自我报告视为验证。务必检查差异并从 Hermes 重新运行测试。
2.  在用户脏的主检出中运行 Codex。务必在工作树/分支中隔离。
3.  让 Codex 拥有看板。Codex 可以总结进度，但由 Hermes 写入板状态。
4.  在提示中忘记 PMB 安全不变量。缺失安全文本是通道设置失败。
5.  将 `/goal` 用于快速编辑。除非需要持久的多步骤延续，否则优先选择 `codex exec`。
6.  在未记录原因的情况下终止卡住的通道。`rejected_reason` 必须解释该决定。
7.  因为测试通过就接受宽泛的不相关清理。仅对范围内的更改进行拒绝或挑选。

## 验证清单

- [ ] 在运行 `command -v codex`、`codex --version` 以及可选的目标功能检查后，Codex 被跳过或才启动。
- [ ] Codex 仅在隔离的工作树/分支中运行。
- [ ] 提示包含任务范围、所有权规则、适用时的 PMB 安全约束以及验证命令。
- [ ] Hermes 检查了 `git diff` 和安全敏感文件。
- [ ] Hermes 独立运行了规范测试。
- [ ] `kanban_complete.metadata.codex_lane` 遵循上述架构。
- [ ] 临时进程和不必要的工作树已清理。