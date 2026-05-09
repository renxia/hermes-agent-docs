---
title: "看板工作者 —— Hermes 看板工作者的陷阱、示例与边界情况"
sidebar_label: "看板工作者"
description: "Hermes 看板工作者的陷阱、示例与边界情况"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 看板工作者

Hermes 看板工作者的陷阱、示例与边界情况。生命周期本身会自动注入到每个工作者的系统提示中，作为 KANBAN_GUIDANCE（来自 agent/prompt_builder.py）；当您需要在特定场景下获得更详细说明时，就会加载此技能。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/devops/kanban-worker` |
| 版本 | `2.0.0` |
| 标签 | `kanban`, `multi-agent`, `collaboration`, `workflow`, `pitfalls` |
| 相关技能 | [`kanban-orchestrator`](/docs/user-guide/skills/bundled/devops/devops-kanban-orchestrator) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 看板工作者 —— 陷阱与示例

> 您看到此技能是因为 Hermes 看板调度器以 `--skills kanban-worker` 参数将您作为工作者生成 —— 该技能会自动为每个被调度的工作者加载。**生命周期**（6 个步骤：定向 → 工作 → 心跳 → 阻塞/完成）也存在于 `KANBAN_GUIDANCE` 块中，该块会自动注入到您的系统提示中。此技能提供更深入的细节：良好的交接形式、重试诊断、边界情况。

## 工作空间处理

您的工作空间类型决定了您应如何在 `$HERMES_KANBAN_WORKSPACE` 内行为：

| 类型 | 含义 | 如何操作 |
|---|---|---|
| `scratch` | 全新的临时目录，仅属于您 | 可自由读写；任务归档后会被垃圾回收。 |
| `dir:<path>` | 共享的持久化目录 | 其他运行实例会读取您写入的内容。将其视为长期存在的状态。路径保证为绝对路径（内核会拒绝相对路径）。 |
| `worktree` | 解析路径处的 Git 工作树 | 如果 `.git` 不存在，请首先从主仓库运行 `git worktree add <path> <branch>`，然后 cd 并正常工作。在此提交工作。 |

## 租户隔离

如果设置了 `$HERMES_TENANT`，则该任务属于某个租户命名空间。在读取或写入持久化内存时，请为内存条目添加租户前缀，以防止上下文在不同租户之间泄露：

- 正确：`business-a: Acme 是我们的最大客户`
- 错误（会泄露）：`Acme 是我们的最大客户`

## 良好的摘要 + 元数据格式

`kanban_complete(summary=..., metadata=...)` 交接是下游工作者了解您所做工作的方式。有效的模式如下：

**编码任务：**
```python
kanban_complete(
    summary="已交付速率限制器 —— 令牌桶算法，以 user_id 为键，IP 为备用键，14 个测试通过",
    metadata={
        "changed_files": ["rate_limiter.py", "tests/test_rate_limiter.py"],
        "tests_run": 14,
        "tests_passed": 14,
        "decisions": ["user_id 为主键，对未认证请求使用 IP 备用键"],
    },
)
```

**研究任务：**
```python
kanban_complete(
    summary="已审查 3 个竞争库；vLLM 在吞吐量上胜出，SGLang 在延迟上胜出，Tensorrt-LLM 在内存效率上胜出",
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
    summary="已审查 PR #123；发现 2 个阻塞性问题（/search 中的 SQL 注入，/settings 中缺少 CSRF 保护）",
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

请格式化 `metadata`，以便下游解析器（审查者、聚合器、调度器）无需重新阅读您的描述性文本即可使用它。

## 能快速获得答复的阻塞原因

错误：`"卡住了"` —— 人类无法理解上下文。

正确：用一句话说明您需要的具体决策。将更长的上下文作为注释留下。

```python
kanban_comment(
    task_id=os.environ["HERMES_KANBAN_TASK"],
    body="完整上下文：我从 Cloudflare 标头中获取了用户 IP，但某些用户位于拥有数千个对等节点的 NAT 之后。仅以 IP 为键会导致误报。",
)
kanban_block(reason="速率限制键选择：IP（简单，但 NAT 不安全）还是 user_id（需要认证，会跳过匿名端点）？")
```

阻塞消息会显示在看板 / 网关通知器中。注释是人类在打开任务时阅读的更深层上下文。

## 值得发送的心跳

良好的心跳会说明进展：`"第 12/50 轮，损失 0.31"`，`"已扫描 1.2M/2.4M 行"`，`"已上传 47/120 个视频"`。

不良心跳：`"仍在工作"`、空备注、亚秒级间隔。最多每隔几分钟发送一次；对于约 2 分钟以内的任务，请完全跳过。

## 重试场景

如果您打开任务，而 `kanban_show` 返回 `runs: [...]` 且包含一个或多个已关闭的运行记录，则您正在进行重试。先前运行的 `outcome` / `summary` / `error` 会告诉您什么方法无效。请不要重复该路径。典型的重试诊断：

- `outcome: "timed_out"` —— 先前尝试达到了 `max_runtime_seconds`。您可能需要将工作分块或缩短。
- `outcome: "crashed"` —— 内存不足或段错误。请减少内存占用。
- `outcome: "spawn_failed"` + `error: "..."` —— 通常是配置文件问题（缺少凭据、PATH 错误）。请通过 `kanban_block` 询问人类，而非盲目重试。
- `outcome: "reclaimed"` + `summary: "task archived..."` —— 操作员在先前运行期间归档了任务；您可能根本不应该运行，请仔细检查状态。
- `outcome: "blocked"` —— 先前尝试被阻塞；此时线程中应有解除阻塞的注释。

## 请勿执行的操作

- 将 `delegate_task` 作为 `kanban_create` 的替代品。`delegate_task` 用于您当前运行中的短推理子任务；`kanban_create` 用于跨智能体交接，其生命周期超过一个 API 循环。
- 修改 `$HERMES_KANBAN_WORKSPACE` 之外的文件，除非任务正文中明确说明。
- 创建分配给自己的后续任务 —— 请分配给正确的专家。
- 完成您实际上并未完成的任务。请改为将其阻塞。

## 陷阱

**任务状态可能在调度与您启动之间发生变化。** 在调度器声明任务与您的进程实际启动之间，任务可能已被阻塞、重新分配或归档。请始终首先执行 `kanban_show`。如果报告显示 `blocked` 或 `archived`，请停止 —— 您不应该运行。

**工作空间可能包含过时的工件。** 尤其是 `dir:` 和 `worktree` 工作空间可能包含先前运行的文件。请阅读注释线程 —— 它通常会解释您为何再次运行以及工作空间的状态。

**当有可用指南时，请勿依赖 CLI。** `kanban_*` 工具可在所有终端后端（Docker、Modal、SSH）上运行。在容器化后端中，从您的终端工具运行 `hermes kanban <verb>` 会失败，因为 CLI 未安装在那里。如有疑问，请使用工具。

## CLI 回退（用于脚本）

每个工具都有对应的 CLI 版本，供人类操作员和脚本使用：
- `kanban_show` ↔ `hermes kanban show <id> --json`
- `kanban_complete` ↔ `hermes kanban complete <id> --summary "..." --metadata '{...}'`
- `kanban_block` ↔ `hermes kanban block <id> "reason"`
- `kanban_create` ↔ `hermes kanban create "title" --assignee <profile> [--parent <id>]`
- 等等。

请在智能体内部使用这些工具；CLI 是为终端的人类用户提供的。