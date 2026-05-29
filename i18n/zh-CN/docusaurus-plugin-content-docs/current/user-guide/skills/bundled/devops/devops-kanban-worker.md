---
title: "看板工作线程 — Hermes 看板工作线程的陷阱、示例和边缘情况"
sidebar_label: "看板工作线程"
description: "Hermes 看板工作线程的陷阱、示例和边缘情况"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 看板工作线程

Hermes 看板工作线程的陷阱、示例和边缘情况。生命周期本身已作为 KANBAN_GUIDANCE 自动注入到每个工作线程的系统提示中（来自 agent/prompt_builder.py）；当您想了解特定场景的更多详细信息时，应加载此技能。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/devops/kanban-worker` |
| 版本 | `2.0.0` |
| 平台 | linux, macos, windows |
| 标签 | `看板`, `多智能体`, `协作`, `工作流`, `陷阱` |
| 相关技能 | [`看板编排器`](/docs/user-guide/skills/bundled/devops/devops-kanban-orchestrator) |

:::info
以下是 Hermes 触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 看板工作智能体 — 陷阱与示例

> 您看到此技能是因为 Hermes 看板调度器已将您作为工作智能体派生，并带有 `--skills kanban-worker` 参数——它会自动为每个派生的工作智能体加载。**生命周期**（6个步骤：定向 → 工作 → 心跳 → 阻塞/完成）也存在于自动注入到您的系统提示词中的 `KANBAN_GUIDANCE` 块中。此技能包含更详细的内容：良好的交接形式、重试诊断、边界情况。

## 工作空间处理

您的工作空间类型决定了您在 `$HERMES_KANBAN_WORKSPACE` 内应如何行为：

| 类型 | 它是什么 | 如何工作 |
|---|---|---|
| `scratch` | 全新的临时目录，仅供您使用 | 随意读写；当任务归档时，它会被垃圾回收。 |
| `dir:<path>` | 共享的持久化目录 | 其他运行实例将读取您写入的内容。将其视为长期存在的状态。路径保证是绝对路径（内核会拒绝相对路径）。 |
| `worktree` | 位于解析路径的 Git 工作树 | 如果 `.git` 不存在，请先从主仓库运行 `git worktree add <path> ${HERMES_KANBAN_BRANCH:-wt/$HERMES_KANBAN_TASK}`，然后 `cd` 进入并正常工作。在此处提交工作。 |

## 租户隔离

如果设置了 `$HERMES_TENANT`，则任务属于租户命名空间。在读取或写入持久化记忆时，请在记忆条目前加上租户前缀，以防止上下文在租户之间泄漏：

- 好的：`business-a: Acme 是我们最大的客户`
- 坏的（会泄漏）：`Acme 是我们最大的客户`

## 良好的摘要 + 元数据结构

`kanban_complete(summary=..., metadata=...)` 交接是下游工作智能体读取您做了什么的方式。有效的模式：

**编码任务：**
```python
kanban_complete(
    summary="已交付速率限制器 — 令牌桶，基于 user_id 的键，IP 作为后备，14 个测试通过",
    metadata={
        "changed_files": ["rate_limiter.py", "tests/test_rate_limiter.py"],
        "tests_run": 14,
        "tests_passed": 14,
        "decisions": ["主要使用 user_id，未认证的请求使用 IP 作为后备"],
    },
)
```

**需要人工审查的编码任务 (需要审查)：**

对于大多数更改代码的任务，只有当人工审查者审视过之后，工作才算真正*完成*。与其直接完成，不如阻塞，并在 `reason` 前加上 `review-required: `，以便仪表板将该行标记为需要审查。首先将结构化元数据（更改的文件、测试计数、差异/PR URL）放入评论中，因为 `kanban_block` 只携带人类可读的原因——评论是持久的注释通道。审查者要么批准并运行 `hermes kanban unblock <id>`（这会重新派生您并附上评论线程以进行后续操作），要么通过另一条评论要求修改。

```python
import json

kanban_comment(
    body="review-required 交接：\n" + json.dumps({
        "changed_files": ["rate_limiter.py", "tests/test_rate_limiter.py"],
        "tests_run": 14,
        "tests_passed": 14,
        "diff_path": "/path/to/worktree",  # 或已推送的 PR URL
        "decisions": ["主要使用 user_id，未认证的请求使用 IP 作为后备"],
    }, indent=2),
)
kanban_block(
    reason="review-required: 速率限制器已交付，14/14 测试通过 — 在合并前需要审视 user_id/IP 后备的选择",
)
```

仅当任务是真正的终结时才使用 `kanban_complete`——例如，一个单行的拼写错误修复、一个没有功能影响的文档更改，或者一个产出本身就是报告的研究任务。

**研究任务：**
```python
kanban_complete(
    summary="审查了 3 个竞争库；vLLM 吞吐量最佳，SGLang 延迟最低，Tensorrt-LLM 内存效率最高",
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
    summary="审查了 PR #123；发现 2 个阻塞性问题（/search 中的 SQL 注入，/settings 中缺少 CSRF）",
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

构建 `metadata` 时要让下游解析器（审查者、聚合器、调度器）无需重新阅读您的叙述即可使用它。

## 认领您实际创建的卡片

如果您的运行产生了新的看板任务（通过 `kanban_create`），请在 `kanban_complete` 的 `created_cards` 中传递这些 ID。内核会验证每个 ID 是否存在且由您的配置文件创建；任何虚拟 ID 都会以错误形式阻止完成，并列出问题所在，拒绝的尝试会被永久记录在该任务的事件日志中。**仅列出您从成功的 `kanban_create` 返回值中捕获的 ID——永远不要从叙述中编造 ID，永远不要粘贴早期运行的 ID，永远不要认领其他工作智能体创建的卡片。**

```python
# 好的做法 — 捕获返回值，然后认领它们。
c1 = kanban_create(title="修复 SQL 注入", assignee="security-worker")
c2 = kanban_create(title="修复 CSRF 中间件", assignee="web-worker")

kanban_complete(
    summary="审查完成；为两个发现点派生了修复任务。",
    metadata={"pr_number": 123, "approved": False},
    created_cards=[c1["task_id"], c2["task_id"]],
)
```

```python
# 坏的做法 — 认领没有捕获返回值的 ID。
kanban_complete(
    summary="创建了修复任务卡片 t_a1b2c3d4, t_deadbeef",  # 幻觉
    created_cards=["t_a1b2c3d4", "t_deadbeef"],                   # → 门控拒绝
)
```

如果 `kanban_create` 调用失败（异常，工具错误），则卡片并未创建——不要为其包含虚拟 ID。重试创建操作，或在摘要中省略该 ID 并提及失败情况。叙述性扫描也会捕获您自由格式摘要中无法解析的 `t_<hex>` 引用；这些不会阻止完成，但会在仪表板中作为任务的警告出现。

## 能得到快速回应的阻塞原因

坏的：`"卡住了"` — 人类没有上下文。

好的：一句话说明您需要的具体决策。将更长的上下文留作评论。

```python
kanban_comment(
    task_id=os.environ["HERMES_KANBAN_TASK"],
    body="完整上下文：我从 Cloudflare 头部获得了用户 IP，但一些用户在 NAT 后面，有数千个对等点。仅基于 IP 设定键会导致误报。"
)
kanban_block(reason="速率限制键选择：IP（简单，但 NAT 不安全）还是 user_id（需要认证，跳过匿名端点）？")
```

阻塞消息是显示在仪表板/网关通知器中的内容。当人类打开任务时，评论是他们阅读的更深层上下文。

## 值得发送的心跳

好的心跳说明进度：`"epoch 12/50, loss 0.31"`，`"扫描了 1.2M/2.4M 行"`，`"上传了 47/120 个视频"`。

坏的心跳：`"仍在工作"`，空注释，亚秒级间隔。最多每隔几分钟发送一次；对于大约 2 分钟以下的任务，完全可以跳过。

## 重试场景

如果您打开任务并且 `kanban_show` 返回包含一个或多个已关闭运行的 `runs: [...]`，那么您是一次重试。先前运行的 `outcome` / `summary` / `error` 告诉您什么没成功。不要重复那条路径。典型的重试诊断：

- `outcome: "timed_out"` — 上一次尝试达到了 `max_runtime_seconds`。您可能需要将工作分块或缩短它。
- `outcome: "crashed"` — 内存不足或段错误。减少内存占用。
- `outcome: "spawn_failed"` + `error: "..."` — 通常是配置文件问题（缺少凭据，错误的 PATH）。通过 `kanban_block` 询问人类，而不是盲目重试。
- `outcome: "reclaimed"` + `summary: "任务已归档..."` — 操作员在上次运行期间归档了任务；您可能根本不应该运行，请仔细检查状态。
- `outcome: "blocked"` — 上一次尝试被阻塞；解除阻塞的评论现在应该在线程中。

## 通知路由

您可以通过将 `notification_sources` 添加到 `~/.hermes/config.yaml` 来配置网关以接收跨配置文件的看板任务通知。
- `notification_sources: ['*']` 接受来自所有配置文件的订阅。
- `notification_sources: ['default', 'zilor-ppt']` 或 `"default,zilor-ppt"` 将订阅限制在指定的配置文件。
- 省略该键则保持默认行为（配置文件隔离）。

## 请勿

- 调用 `delegate_task` 作为 `kanban_create` 的替代品。`delegate_task` 用于您运行期间的短时推理子任务；`kanban_create` 用于跨智能体交接，其生命周期超出单个 API 循环。
- 除非任务正文说明，否则不要修改 `$HERMES_KANBAN_WORKSPACE` 之外的文件。
- 创建分配给自己的后续任务——分配给合适的专家。
- 完成您实际上没有完成的任务。请将其阻塞。

## 陷阱

**任务状态可能在派生和您的启动之间发生变化。** 在调度器认领和您的进程实际启动之间，任务可能已被阻塞、重新分配或归档。请始终先执行 `kanban_show`。如果它报告 `blocked` 或 `archived`，请停止——您不应该运行。

**工作空间可能有陈旧的产物。** 特别是 `dir:` 和 `worktree` 工作空间可能包含来自先前运行的文件。阅读评论线程——它通常解释为什么您要再次运行以及工作空间处于什么状态。

**不要在指导可用时依赖 CLI。** `kanban_*` 工具适用于所有终端后端（Docker、Modal、SSH）。从您的终端工具运行 `hermes kanban <verb>` 在容器化后端中将失败，因为那里没有安装 CLI。如有疑问，请使用工具。

## CLI 回退机制（用于脚本编写）

每个工具都为人工操作员和脚本提供了对应的 CLI 等效命令：
- `kanban_show` ↔ `hermes kanban show <id> --json`
- `kanban_complete` ↔ `hermes kanban complete <id> --summary "..." --metadata '{...}'`
- `kanban_block` ↔ `hermes kanban block <id> "reason"`
- `kanban_create` ↔ `hermes kanban create "title" --assignee <profile> [--parent <id>]`
- 等。

在智能体内部使用工具；CLI 存在的目的是为终端前的人提供服务。