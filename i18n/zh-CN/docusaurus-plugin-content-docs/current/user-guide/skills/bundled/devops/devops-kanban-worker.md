---
title: "看板工作者 — 赫尔墨斯看板工作者的陷阱、示例与边界情况"
sidebar_label: "看板工作者"
description: "赫尔墨斯看板工作者的陷阱、示例与边界情况"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 脚本从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 看板工作者

赫尔墨斯看板工作者的陷阱、示例与边界情况。生命周期本身作为 `KANBAN_GUIDANCE` 会自动注入到每个工作者的系统提示中（来自 agent/prompt_builder.py）；此技能是当你想深入了解特定场景细节时加载的内容。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/devops/kanban-worker` |
| 版本 | `2.0.0` |
| 平台 | linux, macos, windows |
| 标签 | `看板`, `多智能体`, `协作`, `工作流`, `陷阱` |
| 相关技能 | [`kanban-orchestrator`](/user-guide/skills/bundled/devops/devops-kanban-orchestrator) |

:::info
以下是 Hermes 加载的完整技能定义，当此技能被触发时生效。这是智能体在技能激活时看到的指令。
:::

# 看板工作者 — 陷阱与示例

> 您看到此技能是因为 Hermes 看板调度器将您作为工作者派生出来，并加载了 `--skills kanban-worker` —— 它会为每个被派生的工作者自动加载。**生命周期**（6个步骤：定向 → 工作 → 心跳 → 阻塞/完成）也位于自动注入到您系统提示中的 `KANBAN_GUIDANCE` 块中。此技能包含更深层次的细节：良好的交接形式、重试诊断、边缘情况。

## 工作空间处理

您的工作空间类型决定了您在 `$HERMES_KANBAN_WORKSPACE` 内应如何行为：

| 类型 | 它是什么 | 如何工作 |
|---|---|---|
| `scratch` | 全新的临时目录，仅您可用 | 自由读写；任务归档时会被垃圾回收。 |
| `dir:<path>` | 共享的持久目录 | 其他运行实例会读取您写入的内容。将其视为长期存在的状态。路径保证是绝对路径（内核拒绝相对路径）。 |
| `worktree` | 位于已解析路径的 Git 工作树 | 如果 `.git` 不存在，请先从主仓库运行 `git worktree add <path> <branch>`，然后 cd 进入并正常工作。在此处提交工作。 |

## 租户隔离

如果设置了 `$HERMES_TENANT`，则该任务属于一个租户命名空间。在读取或写入持久化内存时，请在内存条目前加上租户前缀，以避免上下文在租户之间泄露：

- 正确：`business-a: Acme是我们最大的客户`
- 错误（会泄露）：`Acme是我们最大的客户`

## 良好的摘要与元数据结构

`kanban_complete(summary=..., metadata=...)` 交接是下游工作者读取您工作成果的方式。有效的模式：

**编码任务：**
```python
kanban_complete(
    summary="已发布速率限制器 — 令牌桶算法，基于user_id并带有IP回退，14个测试通过",
    metadata={
        "changed_files": ["rate_limiter.py", "tests/test_rate_limiter.py"],
        "tests_run": 14,
        "tests_passed": 14,
        "decisions": ["主要使用user_id，对未认证请求使用IP回退"],
    },
)
```

**需要人工审查的编码任务（需审查）：**

对于大多数更改代码的任务，工作并非真正*完成*，直到人工审查员看过它。应阻塞而不是完成，并在 `reason` 前加上 `review-required: `，以便仪表板将该行标记为需要审查。首先将结构化元数据（更改的文件、测试计数、差异/PR 链接）放入评论中，因为 `kanban_block` 只携带人类可读的原因——评论是持久的注释通道。审查员要么批准并运行 `hermes kanban unblock <id>`（这会重新派生您并附上评论线程以进行后续跟进），要么通过另一条评论要求修改。

```python
import json

kanban_comment(
    body="review-required handoff:\n" + json.dumps({
        "changed_files": ["rate_limiter.py", "tests/test_rate_limiter.py"],
        "tests_run": 14,
        "tests_passed": 14,
        "diff_path": "/path/to/worktree",  # 或PR链接（如果已推送）
        "decisions": ["主要使用user_id，对未认证请求使用IP回退"],
    }, indent=2),
)
kanban_block(
    reason="review-required: 速率限制器已发布，14/14测试通过 — 合并前需要审查user_id/IP回退选择",
)
```

仅当任务确实终结时才使用 `kanban_complete` —— 例如，一行的拼写错误修复、无功能后果的文档更改，或研究任务（其成果本身就是报告本身）。

**研究任务：**
```python
kanban_complete(
    summary="审查了3个竞争库；vLLM在吞吐量上胜出，SGLang在延迟上胜出，Tensorrt-LLM在内存效率上胜出",
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
    summary="审查了PR #123；发现2个阻断性问题（/search中的SQL注入，/settings中缺少CSRF）",
    metadata={
        "pr_number": 123,
        "findings": [
            {"severity": "critical", "file": "api/search.py", "line": 42, "issue": "原始SQL拼接"},
            {"severity": "high", "file": "api/settings.py", "issue": "缺少CSRF中间件"},
        ],
        "approved": False,
    },
)
```

构建 `metadata` 以使下游解析器（审查员、聚合器、调度器）无需重新阅读您的叙述即可使用。

## 声明您实际创建的卡片

如果您的运行产生了新的看板任务（通过 `kanban_create`），请在 `kanban_complete` 的 `created_cards` 中传递这些 id。内核会验证每个 id 是否存在并由您的配置文件创建；任何不存在的 id 都会导致完成操作因列出错误的失败而被阻止，并且被拒绝的尝试将永久记录在该任务的事件日志中。**仅列出您从成功的 `kanban_create` 返回值中捕获的 id —— 永远不要从叙述中臆造 id，永远不要粘贴之前运行中的 id，永远不要声称其他工作者创建的卡片。**

```python
# 正确 — 捕获返回值，然后声明它们。
c1 = kanban_create(title="修复SQL注入", assignee="security-worker")
c2 = kanban_create(title="修复CSRF中间件", assignee="web-worker")

kanban_complete(
    summary="审查完成；为两个发现生成了修复任务。",
    metadata={"pr_number": 123, "approved": False},
    created_cards=[c1["task_id"], c2["task_id"]],
)
```

```python
# 错误 — 声明您没有捕获返回值的id。
kanban_complete(
    summary="创建了修复任务卡片 t_a1b2c3d4, t_deadbeef",  # 臆造的
    created_cards=["t_a1b2c3d4", t_deadbeef"],                   # → 门控会拒绝
)
```

如果 `kanban_create` 调用失败（异常、工具错误），则卡片未被创建 —— 不要为其包含不存在的 id。重试创建，或在您的摘要中提及该失败。叙述扫描过程也会捕获您自由格式摘要中无法解析的 `t_<hex>` 引用；这些不会阻止完成，但会在仪表板上的任务中显示为建议警告。

## 能得到快速响应的阻塞原因

错误：`"卡住了"` — 人类没有上下文。

好的：用一句话说明您需要的具体决策。将更长的上下文作为评论留下。

```python
kanban_comment(
    task_id=os.environ["HERMES_KANBAN_TASK"],
    body="完整上下文：我从 Cloudflare 头部获取了用户 IP，但有些用户位于拥有数千个对等点的 NAT 后面。仅基于 IP 会导致误报。"
)
kanban_block(reason="速率限制键选择：IP（简单，NAT不安全）还是 user_id（需要认证，跳过匿名端点）？")
```

阻塞消息是出现在仪表板/网关通知器中的内容。评论是人类打开任务时阅读的更深层上下文。

## 值得发送的心跳

好的心跳命名进度：`"epoch 12/50, loss 0.31"`, `"已扫描 1.2M/2.4M 行"`, `"已上传 47/120 个视频"`。

不好的心跳：`"仍在工作"`, 空注释, 亚秒级间隔。最多每几分钟一次；对于少于约2分钟的任务，完全可以跳过。

## 重试场景

如果您打开任务且 `kanban_show` 返回包含一个或多个已关闭运行的 `runs: [...]`，则您是重试。先前运行的 `outcome` / `summary` / `error` 会告诉您哪里出了问题。不要重复那条路径。典型的重试诊断：

- `outcome: "timed_out"` — 之前的尝试达到了 `max_runtime_seconds`。您可能需要将工作分块或缩短。
- `outcome: "crashed"` — 内存不足或段错误。减少内存占用。
- `outcome: "spawn_failed"` + `error: "..."` — 通常是配置文件问题（缺少凭据、错误的 PATH）。通过 `kanban_block` 询问人类，而不是盲目重试。
- `outcome: "reclaimed"` + `summary: "task archived..."` — 操作员在先前运行时归档了任务；您可能根本不应该运行，请仔细检查状态。
- `outcome: "blocked"` — 之前的尝试被阻塞；解锁评论现在应该在线程中。

## 不要

- 调用 `delegate_task` 作为 `kanban_create` 的替代品。`delegate_task` 用于您运行期间的短期推理子任务；`kanban_create` 用于跨智能体的、超出单个 API 循环生命周期的交接。
- 修改 `$HERMES_KANBAN_WORKSPACE` 之外的文件，除非任务正文要求如此。
- 创建分配给自己的后续任务 —— 分配给合适的专家。
- 完成您实际上没有完成的任务。改为将其阻塞。

## 陷阱

**任务状态可能在调度和启动之间发生变化。** 在调度器认领和您的进程实际启动之间，任务可能已被阻塞、重新分配或归档。始终首先使用 `kanban_show`。如果它报告 `blocked` 或 `archived`，则停止 —— 您不应该在运行。

**工作空间可能有过时的工件。** 特别是 `dir:` 和 `worktree` 工作空间可能有来自先前运行的文件。阅读评论线程 —— 它通常解释了您为什么再次运行以及工作空间处于什么状态。

**当指南可用时，不要依赖 CLI。** `kanban_*` 工具可在所有终端后端（Docker、Modal、SSH）工作。从您的终端工具运行的 `hermes kanban <verb>` 在容器化后端中会失败，因为 CLI 未安装在那里。如有疑问，请使用工具。
## CLI 回退（用于脚本）

每个工具都有一个面向人类操作员和脚本的 CLI 等效项：
- `kanban_show` ↔ `hermes kanban show <id> --json`
- `kanban_complete` ↔ `hermes kanban complete <id> --summary "..." --metadata '{...}'`
- `kanban_block` ↔ `hermes kanban block <id> "reason"`
- `kanban_create` ↔ `hermes kanban create "title" --assignee <profile> [--parent <id>]`
- 等。

在智能体内部使用工具；CLI 是为终端处的人类准备的。