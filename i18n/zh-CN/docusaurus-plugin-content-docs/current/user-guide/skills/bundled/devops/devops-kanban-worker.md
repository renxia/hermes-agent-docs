---
title: "看板工作者 — Hermes 看板工作者的陷阱、示例与边缘情况"
sidebar_label: "看板工作者"
description: "Hermes 看板工作者的陷阱、示例与边缘情况"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 看板工作者

Hermes 看板工作者的陷阱、示例与边缘情况。生命周期本身作为 `KANBAN_GUIDANCE` 被自动注入到每个工作者的系统提示中（来自 agent/prompt_builder.py）；当您希望深入了解特定场景的细节时，加载的便是此技能。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/devops/kanban-worker` |
| 版本 | `2.0.0` |
| 平台 | linux, macos, windows |
| 标签 | `看板`, `多智能体`, `协作`, `工作流`, `陷阱` |
| 相关技能 | [`kanban-orchestrator`](/docs/user-guide/skills/bundled/devops/devops-kanban-orchestrator) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 看板工作者 — 陷阱与示例

> 您看到此技能是因为 Hermes 看板调度器将您作为工作者生成，并带有 `--skills kanban-worker` 参数 — 它会自动为每个调度的工作者加载。**生命周期**（6个步骤：定位 → 工作 → 心跳 → 阻塞/完成）也存在于自动注入到您系统提示的 `KANBAN_GUIDANCE` 块中。此技能是更深入的内容：良好的交接形式、重试诊断、边缘情况。

## 工作区处理

您的工作区类型决定了您在 `$HERMES_KANBAN_WORKSPACE` 内应如何行为：

| 类型 | 是什么 | 如何工作 |
|---|---|---|
| `scratch` | 全新的临时目录，仅为您所有 | 自由读写；任务归档后它会被垃圾回收。 |
| `dir:<path>` | 共享的持久化目录 | 其他运行会读取您写入的内容。请将其视为长期存在的状态。路径保证为绝对路径（内核会拒绝相对路径）。 |
| `worktree` | 位于解析路径的 Git 工作树 | 如果 `.git` 不存在，请先在主仓库运行 `git worktree add <path> <branch>`，然后 `cd` 并正常工作。在此处提交工作。 |

## 租户隔离

如果设置了 `$HERMES_TENANT`，则任务属于一个租户命名空间。在读取或写入持久化记忆时，请为记忆条目添加租户前缀，以避免上下文在租户间泄露：

- 良好示例：`business-a: Acme 是我们最大的客户`
- 不良示例（会泄露）：`Acme 是我们最大的客户`

## 良好的摘要与元数据格式

`kanban_complete(summary=..., metadata=...)` 交接是下游工作者读取您所做工作的方式。有效的模式：

**编码任务：**
```python
kanban_complete(
    summary="已上线速率限制器 — 令牌桶算法，基于 user_id 键并带 IP 回退，14 个测试通过",
    metadata={
        "changed_files": ["rate_limiter.py", "tests/test_rate_limiter.py"],
        "tests_run": 14,
        "tests_passed": 14,
        "decisions": ["user_id 为主要标识，IP 作为未认证请求的回退"],
    },
)
```

**研究任务：**
```python
kanban_complete(
    summary="评估了 3 个竞争库；vLLM 在吞吐量上胜出，SGLang 在延迟上胜出，Tensorrt-LLM 在内存效率上胜出",
    metadata={
        "sources_read": 12,
        "recommendation": "vLLM",
        "benchmarks": {"vllm": 1.0, "sglang": 0.87, "trtllm": 0.72},
    },
)
```

**审查任务：**
```python
kanban_complete(
    summary="审查了 PR #123；发现 2 个阻塞性问题（/search 中的 SQL 注入，/settings 中缺失 CSRF）",
    metadata={
        "pr_number": 123,
        "findings": [
            {"severity": "critical", "file": "api/search.py", "line": 42, "issue": "原始 SQL 拼接"},
            {"severity": "high", "file": "api/settings.py", "issue": "缺少 CSRF 中间件"},
        ],
        "approved": False,
    },
)
```

塑造 `metadata`，使下游解析器（审查器、聚合器、调度器）无需重新阅读您的叙述即可使用它。

## 声明您实际创建的卡片

如果您的运行产生了新的看板任务（通过 `kanban_create`），请在 `kanban_complete` 的 `created_cards` 参数中传递这些 id。内核会验证每个 id 是否存在并且是由您的配置文件创建的；任何虚假的 id 都会阻塞完成，并列出错误信息，拒绝的尝试将永久记录在任务的事件日志中。**仅列出您从成功的 `kanban_create` 返回值中捕获的 id — 切勿从叙述中虚构 id，切勿粘贴早期运行中的 id，切勿声明其他工作者创建的卡片。**

```python
# 良好 — 捕获返回值，然后声明它们。
c1 = kanban_create(title="修复 SQL 注入", assignee="security-worker")
c2 = kanban_create(title="修复 CSRF 中间件", assignee="web-worker")

kanban_complete(
    summary="审查完成；已为两个发现生成修复任务。",
    metadata={"pr_number": 123, "approved": False},
    created_cards=[c1["task_id"], c2["task_id"]],
)
```

```python
# 不良 — 声明您没有捕获到返回值的 id。
kanban_complete(
    summary="创建了修复卡片 t_a1b2c3d4, t_deadbeef",  # 幻觉生成
    created_cards=["t_a1b2c3d4", "t_deadbeef"],                   # → 门控拒绝
)
```

如果 `kanban_create` 调用失败（异常、工具错误），则卡片**未**被创建 — 请勿为其包含幻觉 id。重试创建，或省略该 id 并在您的摘要中提及失败。叙述扫描过程也会捕获您自由形式摘要中无法解析的 `t_<hex>` 引用；这些不会阻塞完成，但会作为仪表板上的建议性警告显示在任务中。

## 能快速得到回应的阻塞原因

不良示例：`"卡住了"` — 人类缺乏上下文。

良好示例：一句话说明您需要做出的具体决策。将更长的上下文留作评论。

```python
kanban_comment(
    task_id=os.environ["HERMES_KANBAN_TASK"],
    body="完整上下文：我从 Cloudflare 头部获取了用户 IP，但部分用户位于拥有数千个对等点的 NAT 之后。仅基于 IP 键会导致误报。",
)
kanban_block(reason="速率限制键选择：IP（简单，但 NAT 不安全）还是 user_id（需要认证，跳过匿名端点）？")
```

阻塞消息是出现在仪表板/网关通知器中的内容。评论是人类打开任务时阅读的更深层上下文。

## 值得发送的心跳

良好的心跳应说明进度：`"epoch 12/50, loss 0.31"`, `"已扫描 1.2M/2.4M 行"`, `"已上传 47/120 个视频"`。

不良心跳：`"仍在工作"`、空注释、亚秒级间隔。最多每几分钟一次；对于少于约 2 分钟的任务，完全可以跳过。

## 重试场景

如果您打开任务并且 `kanban_show` 返回包含一个或多个已关闭运行的 `runs: [...]`，则说明您是一次重试。先前运行的 `outcome` / `summary` / `error` 会告诉您哪些方法行不通。不要重复该路径。典型的重试诊断：

- `outcome: "timed_out"` — 上一次尝试达到了 `max_runtime_seconds`。您可能需要分块处理工作或缩短其长度。
- `outcome: "crashed"` — 内存不足或段错误。减少内存占用。
- `outcome: "spawn_failed"` + `error: "..."` — 通常是配置文件配置问题（缺少凭据、错误的 PATH）。通过 `kanban_block` 询问人类，而不是盲目重试。
- `outcome: "reclaimed"` + `summary: "task archived..."` — 操作员在上次运行期间归档了任务；您可能根本不应该运行，请仔细检查状态。
- `outcome: "blocked"` — 之前的尝试被阻塞；取消阻塞的评论现在应该在线程中了。

## 请勿

- 调用 `delegate_task` 来替代 `kanban_create`。`delegate_task` 用于您运行内部的简短推理子任务；`kanban_create` 用于跨智能体的交接，其生命周期超越单个 API 循环。
- 除非任务正文说明，否则不要修改 `$HERMES_KANBAN_WORKSPACE` 之外的文件。
- 创建分配给您自己的后续任务 — 应分配给合适的专业人员。
- 完成一个您实际上并未完成的任务。相反，请将其阻塞。

## 陷阱

**任务状态可能在调度和您的启动之间发生变化。** 在调度器认领任务和您的进程实际启动之间，任务可能已被阻塞、重新分配或归档。请始终先执行 `kanban_show`。如果它报告 `blocked` 或 `archived`，则停止 — 您不应该在运行。

**工作区可能有过时的构件。** 尤其是 `dir:` 和 `worktree` 工作区可能包含来自先前运行的文件。阅读评论线程 — 它通常解释了为什么您要再次运行以及工作区处于什么状态。

**当有指南可用时，不要依赖 CLI。** `kanban_*` 工具适用于所有终端后端（Docker、Modal、SSH）。从您的终端工具运行 `hermes kanban <verb>` 在容器化后端会失败，因为 CLI 未安装在那里。如有疑问，请使用该工具。

## CLI 回退（用于脚本）

每个工具都有面向人类操作员和脚本的 CLI 等效项：
- `kanban_show` ↔ `hermes kanban show <id> --json`
- `kanban_complete` ↔ `hermes kanban complete <id> --summary "..." --metadata '{...}'`
- `kanban_block` ↔ `hermes kanban block <id> "reason"`
- `kanban_create` ↔ `hermes kanban create "title" --assignee <profile> [--parent <id>]`
- 等等。

在智能体内部使用工具；CLI 存在是为了终端的人类操作员。