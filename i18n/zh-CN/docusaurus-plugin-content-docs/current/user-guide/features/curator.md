---
sidebar_position: 3
title: "维护者"
description: "针对智能体创建的技能进行的后台维护 — 使用追踪、过期处理、归档及大语言模型驱动的审查"
---

# 维护者

维护者是针对**智能体创建的技能**的后台维护任务。它追踪每个技能被查看、使用和修补的频率，将长期未使用的技能依次迁移至 `active → stale → archived` 状态，并定期启动一个短暂的辅助模型审查，以提出合并建议或修补漂移问题。

它的存在是为了确保通过[自我改进循环](/user-guide/features/skills#agent-managed-skills-skill_manage-tool)创建的技能不会无限堆积。每次智能体解决一个新问题并保存技能时，该技能就会存放在 `~/.hermes/skills/` 中。如果没有维护，你最终会得到大量重复的狭窄技能，它们会污染目录并浪费令牌。

维护者**从不触及**预装技能（随代码库一同发布）或从[agentskills.io](https://agentskills.io) 安装的中枢技能。它只审查智能体自身编写的技能。它也**从不自动删除** —— 最坏的结果是归档到 `~/.hermes/skills/.archive/`，这是可恢复的。

跟踪议题 [#7816](https://github.com/NousResearch/hermes-agent/issues/7816)。

## 运行方式

维护者由不活动检查触发，而非由定时任务守护进程触发。在CLI会话开始时，以及在网关的定时器线程中的周期性滴答声中，Hermes会检查是否满足以下条件：

1. 自上次维护者运行以来已过去足够的时间（`interval_hours`，默认为 **7天**），以及
2. 智能体已空闲足够长时间（`min_idle_hours`，默认为 **2小时**）。

如果两者都满足，它将生成一个 `AIAgent` 的后台分叉 —— 与记忆/技能自我改进提示使用的模式相同。该分叉运行在自己的提示缓存中，不会触及活动的对话。

:::info 首次运行行为
在全新安装时（或首次在 `hermes update` 后进行预维护者安装时的定时检查），维护者**不会立即运行**。首次观察会将 `last_run_at` 设置为“现在”，并将第一次真正的执行推迟一个完整的 `interval_hours`。这给你一个完整的时间间隔来审查你的技能库，固定任何重要技能，或在维护者触及之前完全退出。

如果你想在维护者真正运行之前看看它*会*做什么，可以运行 `hermes curator run --dry-run` —— 它会生成相同的审查报告，但不会修改技能库。
:::

一次运行包含两个阶段：

1. **自动转换**（确定性，无LLM）。未使用时间达到 `stale_after_days`（30天）的技能变为 `stale`；未使用时间达到 `archive_after_days`（90天）的技能将被移动到 `~/.hermes/skills/.archive/`。
2. **LLM审查**（单次辅助模型执行，`max_iterations=8`）。分叉的智能体审查智能体创建的技能，可以使用 `skill_view` 查看其中任何技能，并决定对每个技能是保留、修补（通过 `skill_manage`）、合并重叠技能，还是通过终端工具进行归档。

固定的技能不受维护者的自动转换和智能体自身的 `skill_manage` 工具的影响。请参阅下面的[固定技能](#pinning-a-skill)部分。

## 配置

所有设置位于 `config.yaml` 的 `curator:` 下（非 `.env` — 这并非秘密）。默认值：

```yaml
curator:
  enabled: true
  interval_hours: 168          # 7天
  min_idle_hours: 2
  stale_after_days: 30
  archive_after_days: 90
```

要完全禁用，设置 `curator.enabled: false`。

### 在更便宜的辅助模型上运行审核

智能体的LLM审核传递是一个常规的辅助任务槽 — `auxiliary.curator` — 与视觉处理、压缩、会话搜索等并列。“自动”表示“使用我的主聊天模型”；覆盖该槽位可以为审核传递固定指定特定的提供商 + 模型。

**最简单 — `hermes model`：**

```bash
hermes model                   # → “辅助模型 — 侧任务路由”
                               # → 选择 “Curator” → 选择提供商 → 选择模型
```

同样的选择器也出现在网页仪表板的 **模型** 标签页下。

**直接配置 config.yaml（等效方式）：**

```yaml
auxiliary:
  curator:
    provider: openrouter
    model: google/gemini-3-flash-preview
    timeout: 600               # 宽限 — 审核可能需要几分钟
```

保留 `provider: auto`（默认）将审核传递路由到您主聊天模型的任何配置，行为与其他所有辅助任务一致。

:::note 旧版配置
早期版本使用了一次性的 `curator.auxiliary.{provider,model}` 块。该路径仍然有效，但会发出弃用日志行 — 请迁移到上面的 `auxiliary.curator`，以便智能体与其他所有辅助任务共享相同的基础设施（`hermes model`、仪表板模型标签页、`base_url`、`api_key`、`timeout`、`extra_body`）。
:::

## CLI

```bash
hermes curator status         # 上次运行、计数、固定列表、最近最少使用前5项
hermes curator run            # 立即触发审核（阻塞直到LLM传递完成）
hermes curator run --background  # 即发即忘：在后台线程中启动LLM传递
hermes curator run --dry-run  # 仅预览 — 报告而不进行任何修改
hermes curator backup         # 对 ~/.hermes/skills/ 手动创建快照
hermes curator rollback       # 从最新快照恢复
hermes curator rollback --list     # 列出可用快照
hermes curator rollback --id <ts>  # 恢复特定快照
hermes curator rollback -y         # 跳过确认提示
hermes curator pause          # 暂停运行直到恢复
hermes curator resume
hermes curator pin <skill>    # 永不自动转换此技能
hermes curator unpin <skill>
hermes curator restore <skill>  # 将已归档的技能移回活跃状态
```

## 备份与回滚

在每次真正的智能体传递之前，Hermes 会对 `~/.hermes/skills/` 创建一个 tar.gz 快照，存储在 `~/.hermes/skills/.curator_backups/<utc-iso>/skills.tar.gz`。如果一次传递归档或合并了您不想动的东西，您可以用一个命令撤销整个运行：

```bash
hermes curator rollback        # 恢复最新快照（带确认）
hermes curator rollback -y     # 跳过提示
hermes curator rollback --list # 查看所有带原因和大小的快照
```

回滚操作本身是可逆的：在替换技能树之前，Hermes 会拍摄另一个标记为 `pre-rollback to <target-id>` 的快照，因此可以通过使用 `--id` 前滚到该快照来撤销错误的回滚。

您也可以随时使用 `hermes curator backup --reason "before-refactor"` 手动创建快照。`--reason` 字符串会写入快照的 `manifest.json` 中，并在 `--list` 中显示。

快照会被修剪至 `curator.backup.keep`（默认5），以限制磁盘使用：

```yaml
curator:
  backup:
    enabled: true
    keep: 5
```

设置 `curator.backup.enabled: false` 可禁用自动快照。当禁用备份时，手动 `hermes curator backup` 命令仅在您先设置 `enabled: true` 时才有效 — 该标志对称地控制两种途径，从而避免在修改性运行中意外跳过运行前快照。

`hermes curator status` 还会列出最近最少使用的五个技能 — 这是一个快速查看接下来哪些技能可能过时的方法。

在正在运行的会话（CLI或网关平台）中，这些相同的子命令也作为 `/curator` 斜杠命令可用。

## “智能体创建”的含义

如果一个技能的名称**不在**以下列表中，则被视为智能体创建：

- `~/.hermes/skills/.bundled_manifest`（安装时从仓库复制的技能），以及
- `~/.hermes/skills/.hub/lock.json`（通过 `hermes skills install` 安装的技能）。

`~/.hermes/skills/` 中的其他所有内容都是智能体处理的对象。这包括：

- 智能体在对话期间通过 `skill_manage(action="create")` 保存的技能。
- 您使用手写 `SKILL.md` 手动创建的技能。
- 通过您指向 Hermes 的外部技能目录添加的技能。

:::warning 您手写的技能看起来和智能体保存的一样
这里的来源是**二元**的（捆绑/集线器 vs 其他所有）。智能体无法区分您依赖用于私密工作流程的手工技能和自我改进循环在会话中保存的技能。两者都归入“智能体创建”的类别。

在第一次真正的传递（默认安装后7天）之前，请花点时间：
1. 运行 `hermes curator run --dry-run` 以确切查看智能体将提出什么建议。
2. 使用 `hermes curator pin <name>` 来保护任何您不想动的技能。
3. 或者如果您宁愿自己管理库，可以在 `config.yaml` 中设置 `curator.enabled: false`。

归档始终可以通过 `hermes curator restore <name>` 恢复，但提前固定比事后追踪合并要容易得多。
:::

如果您想保护特定技能永远不被触动 — 例如，您依赖的一个手写技能 — 请使用 `hermes curator pin <name>`。参见下一节。

## 固定技能

固定可以保护技能不被删除 — 包括智能体的自动归档传递和智能体的 `skill_manage(action="delete")` 工具调用。一旦技能被固定：

- **智能体**在自动转换（`active → stale → archived`）过程中会跳过它，并且其LLM审核传递会指示不要动它。
- **智能体的 `skill_manage` 工具**会拒绝对其进行 `delete` 操作，引导用户使用 `hermes curator unpin <name>`。补丁和编辑仍然可以通过，因此智能体可以在出现陷阱时改进固定技能的内容，而无需进行固定/取消固定/重新固定的循环。

使用以下命令进行固定和取消固定：

```bash
hermes curator pin <skill>
hermes curator unpin <skill>
```

该标志作为 `"pinned": true` 存储在 `~/.hermes/skills/.usage.json` 的技能条目中，因此它在不同会话间保持不变。

只有**智能体创建**的技能才能被固定 — 捆绑和集线器安装的技能本身就不受智能体变更的影响，并且如果您尝试对它们使用 `hermes curator pin`，将会收到解释性信息并拒绝操作。

如果您想要比“不删除”更强的保证 — 例如，在智能体仍然读取的情况下完全冻结技能的内容 — 请直接使用编辑器编辑 `~/.hermes/skills/<name>/SKILL.md`。固定保护的是工具驱动的删除，而不是您自己的文件系统访问。

## 使用遥测

策展人在 `~/.hermes/skills/.usage.json` 维护一个边车文件，每个技能对应一条记录：

```json
{
  "my-skill": {
    "use_count": 12,
    "view_count": 34,
    "last_used_at": "2026-04-24T18:12:03Z",
    "last_viewed_at": "2026-04-23T09:44:17Z",
    "patch_count": 3,
    "last_patched_at": "2026-04-20T22:01:55Z",
    "created_at": "2026-03-01T14:20:00Z",
    "state": "active",
    "pinned": false,
    "archived_at": null
  }
}
```

计数器在以下情况递增：

- `view_count`：智能体在该技能上调用了 `skill_view`。
- `use_count`：该技能被加载到某个对话的提示词中。
- `patch_count`：在该技能上运行了 `skill_manage patch/edit/write_file/remove_file`。

捆绑和中心安装的技能明确排除在遥测写入之外。

## 每次运行的报告

每次策展人运行都会在 `~/.hermes/logs/curator/` 下写入一个带时间戳的目录：

```
~/.hermes/logs/curator/
└── 20260429-111512/
    ├── run.json      # 机器可读：完整保真度、统计信息、LLM 输出
    └── REPORT.md     # 人类可读摘要
```

`REPORT.md` 是查看某次运行做了什么的快捷方式——哪些技能状态发生了转变、LLM 审查者说了什么、它修补了哪些技能。这很适合审计，无需去 `agent.log` 里搜索。

### 摘要中的重命名映射

如果某次运行将多个技能整合到一个总称下（或合并了近似重复项），则运行结束后打印的用户可见摘要会包含一个显式的重命名映射，显示策展人应用的每个 `旧名称 → 新名称` 对。这是对每条技能状态转变行的补充，因此当一波重命名到来时，你无需对比 JSON 报告即可一目了然地发现它们。此提示也会出现在 `hermes curator pin` 下，如果你想锁定新标签，可以立即对总称进行固定。

## 恢复已归档的技能

如果策展人归档了你仍然想要的技能：

```bash
hermes curator restore <skill-name>
```

这会将该技能从 `~/.hermes/skills/.archive/` 移回活动目录树，并将其状态重置为 `active`。如果自归档以来，同名的捆绑或中心安装技能已被安装（会遮蔽上游），则恢复操作将被拒绝。

## 按环境禁用

默认情况下，策展人是开启的。要将其关闭：

- **仅针对一个配置文件：** 编辑 `~/.hermes/config.yaml`（或当前活动配置文件的配置）并设置 `curator.enabled: false`。
- **仅针对一次运行：** `hermes curator pause` — 暂停状态会跨会话持续存在；使用 `resume` 可重新启用。

如果 `min_idle_hours` 尚未过去，策展人也会拒绝运行，因此在活跃的开发机器上，它自然只在安静的时段运行。

## 另请参阅

- [技能系统](/user-guide/features/skills) — 技能的一般工作原理以及创建它们的自我改进循环
- [记忆](/user-guide/features/memory) — 一个并行的后台审查，用于维护长期记忆
- [捆绑技能目录](/reference/skills-catalog)
- [Issue #7816](https://github.com/NousResearch/hermes-agent/issues/7816) — 原始提案和设计讨论