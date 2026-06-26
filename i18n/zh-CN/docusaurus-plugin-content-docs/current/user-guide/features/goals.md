---
sidebar_position: 16
title: "Persistent Goals"
description: "Set a standing goal and let Hermes keep working across turns until it's done. Our take on the Ralph loop."
---

# Persistent Goals (`/goal`)

`/goal` 为 Hermes 提供一个跨轮次持续存在的待办目标。每轮结束后，一个轻量级判断模型会检查助手的最后回复是否已满足该目标。如果未满足，Hermes 会自动将一个续接提示反馈到同一会话中并继续工作——直到目标达成、你暂停或清除它，或轮次预算耗尽为止。

这是我们对 **Ralph 循环** 的实现，直接受到 [Codex CLI 0.128.0 的 `/goal`](https://github.com/openai/codex)（Eric Traut，OpenAI）的启发。其核心思想——让目标在跨轮次中保持活跃，并且在达成之前不停止——来自他们。此处的实现是独立的，并针对 Hermes 的架构进行了适配。

## 何时使用

当你希望 Hermes 自主迭代、无需你每轮都重新提示时，使用 `/goal`：

- "修复 `src/` 中的所有 lint 错误，并验证 `ruff check` 通过"
- "将功能 X 从仓库 Y 移植过来，包括测试，并通过 CI"
- "调查为什么会话 ID 有时会在运行中压缩时偏移，并撰写一份报告"
- "构建一个小型 CLI 工具，按 EXIF 日期重命名文件，然后针对 photos/ 文件夹进行测试"

智能体只需一轮即可完成的任务不需要 `/goal`。*你本来要说三次"继续"*的任务才是它大显身手的地方。

## 快速开始

```
/goal 修复 tests/hermes_cli/ 中所有失败的测试，并确保 scripts/run_tests.sh 对该目录通过
```

你会看到：

1. **目标已接受** — `⊙ Goal set (20-turn budget): <your goal>`
2. **第 1 轮运行** — Hermes 开始工作，就像你发送了一条普通消息一样。
3. **评判运行** — 每轮结束后，评判模型决定 `done` 还是 `continue`。
4. **如需要则循环触发** — 如果返回 `continue`，你会看到 `↻ Continuing toward goal (1/20): <judge's reason>`，Hermes 自动执行下一步。
5. **终止** — 最终你会看到 `✓ Goal achieved: <reason>` 或 `⏸ Goal paused — N/20 turns used`。

## 命令

| 命令 | 功能 |
|---|---|
| `/goal <text>` | 设置（或替换）当前目标。立即启动第一轮，无需额外发送消息。 |
| `/goal draft <text>` | 从自然语言目标起草一份结构化的完成契约，然后设置为目标。参见[完成契约](#完成契约)。 |
| `/goal show` | 打印当前目标的完成契约。 |
| `/goal` 或 `/goal status` | 显示当前目标、状态和已用轮数。 |
| `/goal pause` | 停止自动循环，但不清除目标。 |
| `/goal resume` | 恢复循环（将轮数计数器重置为零）。 |
| `/goal clear` | 完全清除目标。 |
| `/goal wait <pid> [reason]` | 将循环挂起在一个后台进程上——进程运行期间不再每轮重复触发智能体，进程退出后自动恢复。 |
| `/goal unwait` | 解除等待屏障，立即恢复循环。 |

在 CLI 和所有网关平台（Telegram、Discord、Slack、Matrix、Signal、WhatsApp、SMS、iMessage、Webhook、API 服务器和 Web 仪表板）上运行方式完全相同。

## 完成契约

裸的 `/goal <text>` 可以正常工作，但*模糊*的目标会导致模糊的评判——评判者只能检查你告诉它想要什么。Codex 的 `/goal` 指南也说明了这一点：一个持久的目标最好能明确**完成意味着什么、如何证明、不能破坏什么、范围是什么、以及何时停止**。Hermes 在此基础上进行了适配，提供了一个可选的**完成契约**，叠加在现有的目标循环之上。

契约包含五个字段，均为可选：

| 字段 | 含义 |
|---|---|
| `outcome` | 完成时必须为真的最终状态。 |
| `verification` | *证明*结果的具体测试/命令/产物。 |
| `constraints` | 不能改变或退步的内容。 |
| `boundaries` | 范围内的文件、目录、工具或系统。 |
| `stop_when` | Hermes 应停止并请求输入的条件。 |

设置契约后，两个提示都会变化：**循环提示**会引导智能体验证面并遵守约束，**评判提示**仅在验证标准有具体证据（命令结果、文件片段、测试输出）时才判定 `done`——而不是模糊的"看起来完成了"。这直接收紧了最常见的 `/goal` 失败模式（提前完成或在不明确的目标上无休止地过度循环）。

### 两种设置契约的方式

**1. 让 Hermes 起草**（推荐——改编自 Codex 的"让智能体起草目标"建议）：

```
/goal draft 将认证服务从 session cookie 迁移到 JWT
```

Hermes 通过 `goal_judge` 辅助模型将你的单行描述扩展为完整契约，设置后展示结果供你审查或收紧任何字段。如果辅助模型不可用，则回退为普通的自由格式目标——起草永远不会阻塞目标设置。

**2. 内联编写**，使用 `field: value` 格式：

```
/goal 将认证迁移到 JWT
verify: pytest tests/auth 通过
constraints: 保持 /login 响应结构不变
boundaries: 仅涉及 services/auth 及其测试
stop when: 需要数据库 schema 迁移
```

第一个非字段行是目标标题；识别的字段前缀（`verify:`、`verified by:`、`constraints:`、`preserve:`、`boundaries:`、`scope:`、`stop when:`、`blocked:`、…）填充契约。带有偶然冒号的普通目标（`Fix bug: the parser drops commas`）**不会被破坏**——只提取已知的字段前缀。

使用 `/goal show` 查看当前契约。契约与目标一起持久化存储在 `SessionDB.state_meta` 中，因此可以在 `/resume` 后存活。此功能之前加载的旧目标不受影响（无契约）。契约与 `/subgoal` 标准组合：子目标作为评判必须满足的额外标准融入契约。

## 目标执行中途添加标准：`/subgoal`

目标处于活动状态时，你可以通过 `/subgoal <text>` 追加额外的验收标准，而不会重置循环。每次调用会在目标的子目标列表中添加一个编号项；智能体在下一轮看到的**循环提示**包含原始目标加上"用户在循环中途添加的额外标准"块，**评判提示**被重写，使裁决必须考虑每个子目标——只有原始目标**和**所有子目标都满足时，目标才标记为完成。

| 命令 | 功能 |
|---|---|
| `/subgoal <text>` | 向当前目标追加新标准。需要已激活的 `/goal`。 |
| `/subgoal`（无参数） | 显示当前编号子目标列表。 |
| `/subgoal remove <N>` | 移除第 N 个子目标（从 1 开始）。 |
| `/subgoal clear` | 清除所有子目标，但保留原始目标。 |

子目标与目标一起持久化存储在 `SessionDB.state_meta` 中，因此可以在 `/resume` 后存活。设置新的 `/goal <text>` 会替换目标并清除子目标列表；`/goal clear` 同理。

当你启动一个循环（"修复失败的测试"）中途发现你还想"为刚修复的 bug 添加回归测试"时使用——`/subgoal add a regression test` 在不中断运行循环的情况下收紧成功标准。

## 挂起在后台进程上：自动处理，支持手动覆盖

某些目标依赖于需要几分钟且独立运行的内容——推送 PR 后的 CI、长时间构建、测试矩阵、部署、速率限制冷却。如果没有帮助，目标循环会在等待期间每轮重复触发智能体去"完成了吗？"的忙碌工作。

**这是自动处理的。** 每轮中，评判者会看到智能体的实时后台进程（`terminal(background=true)` 注册表——pid、会话 ID、命令、运行时间、最近输出以及任何 `watch_patterns` / `notify_on_complete` 触发器）以及目标和智能体的响应。当智能体的进展真正依赖于其中一个进程时，评判者返回 **`wait`** 裁决而非 `continue`，循环**挂起**：跳过下一轮（无评判调用、无循环、不消耗轮数）直到等待条件满足——然后带着结果正常恢复。评判者也可以基于**时间**（`wait_for_seconds`）挂起，用于退避/冷却等待。挂起期间 `/goal status` 显示 `⏳ Goal (parked …)`。

评判者从进程自身的信号中选择正确的等待类型：

- **`wait_on_session <id>`** — 当进程*自身触发器*激发时释放：进程退出，**或者**（如果使用 `watch_pattern` 启动）其模式匹配。适用于长时间运行的观察器/服务器/轮询器在**运行中**发出信号（例如打印 `BUILD SUCCESSFUL` 后继续运行的构建进程，或 `notify_on_complete` 观察器），可能永远不会自行退出。
- **`wait_on_pid <pid>`** — 仅在进程退出时释放。
- **`wait_for_seconds <n>`** — 在固定延迟后释放。

你不需要输入任何内容——这是评判者的决定，基于循环提供的进程上下文。手动命令作为覆盖存在：

| 命令 | 功能 |
|---|---|
| `/goal wait <pid> [reason]` | 手动挂起循环，直到具有该 PID 的进程退出。 |
| `/goal unwait` | 清除任何等待屏障（评判者设置或手动设置）并立即恢复。 |

屏障（基于 pid 或时间）与目标一起持久化存储在 `SessionDB.state_meta` 中，因此可以在 `/resume` 后存活。`/goal pause`、`/goal resume` 和 `/goal clear` 都会清除它。如果设置屏障时 PID 已死亡（或挂起期间死亡），或时间期限已过，屏障会在下次检查时清除——陈旧的屏障永远不会卡住循环。

典型流程：智能体推送 PR，使用 `terminal(background=true, notify_on_complete=true)` 启动 CI 观察器，并报告"正在监视 CI"。评判者看到观察器进程仍在运行，对其 pid 返回 `wait`，循环静默——CI 完成后立即恢复并根据实际结果评判目标。

## 行为细节

### 评判者

每轮结束后，Hermes 调用辅助模型，传入：

- 当前目标文本
- 智能体最近的最终响应（最后约 4 KB 文本）
- 一个系统提示，要求评判者以严格 JSON 回复：`{"done": <bool>, "reason": "<一句话理由>"}`

评判者刻意保守：仅在响应**明确**确认目标已完成、最终交付物已明确产出、或目标无法实现/被阻塞时（视为 DONE 并附带阻塞原因，以免在不可能的任务上消耗预算），才将目标标记为 `done`。

### 故障开放语义

如果评判者出错（网络抖动、格式错误的响应、辅助客户端不可用），Hermes 将裁决视为 `continue`——损坏的评判者永远不会阻塞进展。**轮数预算**才是真正的兜底机制。

### 轮数预算

默认 20 个循环轮（`config.yaml` 中的 `goals.max_turns`）。当预算用尽时，Hermes 自动暂停并告诉你如何继续：

```
⏸ Goal paused — 20/20 turns used. Use /goal resume to keep going, or /goal clear to stop.
```

`/goal resume` 将计数器重置为零，以便你分批次继续。

### 用户消息始终优先

目标处于活动状态时你发送的任何真实消息都优先于循环。在 CLI 上，你的消息在排队的循环之前进入 `_pending_input`；在网关上，它通过适配器 FIFO 以同样方式处理。你的轮次结束后评判者会再次运行——因此如果你的消息恰好完成了目标，评判者会捕获并停止。

### 运行中安全（网关）

当智能体已经在运行时，`/goal status`、`/goal pause`、`/goal clear`、`/goal wait` 和 `/goal unwait` 可以安全运行——它们只操作控制面状态，不中断当前轮次。在运行中设置**新**目标（`/goal <new text>`）会被拒绝，并提示你先 `/stop`，防止旧循环与新循环竞争。

### 持久化

目标状态存储在 `SessionDB.state_meta` 中，以 `goal:<session_id>` 为键。这意味着 `/resume` 可以从上次离开的地方继续——设置目标，合上笔记本，明天回来，`/resume`，目标仍然保持原样（活动、暂停或完成）。

### 提示缓存

循环提示是追加到历史中的普通用户角色消息。它**不会**修改系统提示、切换工具集、或以任何会使 Hermes 提示缓存失效的方式触及对话。运行一个 20 轮的目标在缓存成本上与 20 轮普通对话相同。

## 配置

添加到 `~/.hermes/config.yaml`：

```yaml
goals:
  # Hermes 自动暂停并要求你输入
  # /goal resume 之前的最大继续轮数。默认值为 20。如果你希望循环更紧凑，
  # 请降低此值；对于长时间运行的重构任务，请提高此值。
  max_turns: 20
```

### 选择评判模型

评判器使用 `goal_judge` 辅助任务。默认情况下它会解析到你的主模型（参见[辅助模型](/user-guide/configuration#auxiliary-models)）。如果你想将评判器路由到一个便宜且快速的模型以降低成本，可以添加覆盖配置：

```yaml
auxiliary:
  goal_judge:
    provider: openrouter
    model: google/gemini-3-flash-preview
```

评判调用很小（约 200 个输出 token），每轮运行一次，因此使用便宜快速的模型通常是正确的选择。

## 示例演练

```
你：/goal 创建四个文件 /tmp/note_{1..4}.txt，每轮创建一个，每个文件以其编号作为内容

  ⊙ 目标已设定（20 轮预算）：创建四个文件 /tmp/note_{1..4}.txt，每轮创建一个，每个文件以其编号作为内容

Hermes：现在创建 /tmp/note_1.txt。
  💻 echo "1" > /tmp/note_1.txt   (0.1s)
  我已创建 /tmp/note_1.txt，内容为"1"。我将在下一轮继续创建剩余的文件，按照你的指定。

  ↻ 继续推进目标 (1/20)：4 个文件中仅创建了 1 个；还剩 3 个文件。

Hermes：[继续推进你的持久目标]
  💻 echo "2" > /tmp/note_2.txt   (0.1s)
  已创建 /tmp/note_2.txt。还剩两个。

  ↻ 继续推进目标 (2/20)：4 个文件中已创建 2 个；还剩 2 个。

Hermes：[继续推进你的持久目标]
  💻 echo "3" > /tmp/note_3.txt   (0.1s)
  已创建 /tmp/note_3.txt。

  ↻ 继续推进目标 (3/20)：4 个文件中已创建 3 个；还剩 1 个。

Hermes：[继续推进你的持久目标]
  💻 echo "4" > /tmp/note_4.txt   (0.1s)
  所有四个文件均已创建：/tmp/note_1.txt 到 /tmp/note_4.txt，每个文件包含其编号。

  ✓ 目标已达成：所有四个文件均已按指定内容创建，目标完成。

你：_
```

四轮，一次 `/goal` 调用，零次来自你的"继续"提示。

## 当评判器出错时

没有完美的评判器。需要注意两种故障模式：

**假阴性——目标实际已完成，但评判器说继续。** 轮数预算会捕获这种情况。你会看到 `⏸ 目标已暂停`，然后可以执行 `/goal clear` 或直接发送新消息。

**假阳性——仍有工作未完成，但评判器说已完成。** 你会看到 `✓ 目标已达成`，但你清楚实际情况。可以发送后续消息继续，或更精确地重新设定目标：`/goal <更具体的文本>`。评判器的系统提示经过刻意保守设计，使假阳性比假阴性更少见。

如果你对评判器的判定结果不满意，`↻ 继续推进目标` 或 `✓ 目标已达成` 行中的原因文本会准确告诉你评判器看到了什么。这通常足以诊断是目标文本有歧义，还是模型的响应有问题。

## 致谢

`/goal` 是 Hermes 对 **Ralph 循环** 模式的实现。面向用户的设计——跨轮次保持目标活跃，直到目标达成才停止，并配有创建/暂停/继续/清除控制——由 OpenAI Codex 团队的 Eric Traut 在 [Codex CLI 0.128.0](https://github.com/openai/codex) 中推广并发布。我们的实现是独立的（中心化的 `CommandDef` 注册表、`SessionDB.state_meta` 持久化、辅助客户端评判器、网关侧的适配器 FIFO 继续机制），但创意归功于他们。该归功于谁就归功于谁。