---
sidebar_position: 3
title: "Curator"
description: "智能体创建技能的后台维护 — 使用跟踪、过期处理、归档以及基于大语言模型的审查"
---

# Curator

Curator 是对**智能体创建技能**进行后台维护的工具。它会跟踪每个技能被查看、使用和修补的频率，将长期未使用的技能在 `活跃 → 过期 → 已归档` 状态之间迁移，并定期启动一个由辅助模型驱动的简短审查，以提出合并建议或修补漂移问题。

它的存在是为了防止通过[自我改进循环](/docs/user-guide/features/skills#agent-managed-skills-skill_manage-tool)创建的技能无限堆积。每当智能体解决一个新问题并保存一个技能时，该技能就会被放入 `~/.hermes/skills/` 目录。如果没有维护，最终会产生大量狭窄的近似重复项，污染技能目录并浪费令牌。

Curator **绝不会触及**捆绑技能（随仓库一起发布）或从 [agentskills.io](https://agentskills.io) 安装的 Hub 技能。它仅审查智能体自己创作的技能。它也**永远不会自动删除** — 最坏的情况是将技能归档到 `~/.hermes/skills/.archive/`，这是可以恢复的。

跟踪 [issue #7816](https://github.com/NousResearch/hermes-agent/issues/7816)。

## 运行方式

Curator 由非活动性检查触发，而不是由 cron 守护进程触发。在 CLI 会话启动时，以及在网关的 cron 计时器线程内的周期性滴答中，Hermes 会检查是否满足以下条件：

1. 距离上次 Curator 运行已过去足够长的时间（`interval_hours`，默认为 **7 天**），以及  
2. 智能体已空闲足够长的时间（`min_idle_hours`，默认为 **2 小时**）。

如果两个条件都满足，它会启动一个 `AIAgent` 的后台分支 — 这与内存/技能自我改进提示所使用的模式相同。该分支运行在其自己的提示缓存中，并且绝不会触及当前活跃的对话。

:::info 首次运行行为
在全新安装（或在 `hermes update` 之后首次触发 Curator 安装计时器）时，Curator **不会立即运行**。首次观察会将 `last_run_at` 设置为“现在”，并将第一次实际运行推迟一个完整的 `interval_hours`。这为您提供了完整的间隔时间来审查您的技能库，固定任何重要内容，或在 Curator 触及之前完全选择退出。

如果您想在 Curator 实际运行之前查看它*会*做什么，请运行 `hermes curator run --dry-run` — 它会生成相同的审查报告，但不会修改技能库。
:::

一次运行包含两个阶段：

1. **自动转换**（确定性，无需大语言模型）。超过 `stale_after_days`（30 天）未使用的技能将变为 `过期`；超过 `archive_after_days`（90 天）未使用的技能将被移动到 `~/.hermes/skills/.archive/`。
2. **大语言模型审查**（单次辅助模型运行，`max_iterations=8`）。分支智能体将审查智能体创建的技能，可以使用 `skill_view` 读取其中任意一个，并针对每个技能决定是保留、修补（通过 `skill_manage`）、合并重叠项，还是通过终端工具进行归档。

固定技能对 Curator 的自动转换以及智能体自身的 `skill_manage` 工具都是不可触及的。请参阅下面的[固定技能](#pinning-a-skill)。

## 配置

所有设置均位于 `config.yaml` 文件的 `curator:` 下（而非 `.env` 文件，因为这不是敏感信息）。默认配置如下：

```yaml
curator:
  enabled: true
  interval_hours: 168          # 7 天
  min_idle_hours: 2
  stale_after_days: 30
  archive_after_days: 90
```

若要完全禁用，请将 `curator.enabled` 设置为 `false`。

### 在更便宜的辅助模型上运行审查

智能体策展人的 LLM 审查过程是一个常规的辅助任务槽位 —— `auxiliary.curator` —— 与视觉、压缩、会话搜索等并列。"Auto" 表示“使用我的主聊天模型”；若要为审查过程指定特定的提供商 + 模型，请覆盖该槽位。

**最简单的方式 —— `hermes model`：**

```bash
hermes model                   # → "辅助模型 — 子任务路由"
                               # → 选择 "Curator" → 选择提供商 → 选择模型
```

Web 仪表板的 **模型** 选项卡中也提供了相同的选取器。

**直接配置 config.yaml（等效方式）：**

```yaml
auxiliary:
  curator:
    provider: openrouter
    model: google/gemini-3-flash-preview
    timeout: 600               # 时间充裕 — 审查可能需要几分钟
```

保留 `provider: auto`（默认值）会将审查过程路由到您的主聊天模型，与其他所有辅助任务的行为一致。

:::note 旧版配置
早期版本使用了一次性的 `curator.auxiliary.{provider,model}` 块。该路径仍然有效，但会输出一条弃用日志 —— 请迁移到上述的 `auxiliary.curator`，以便智能体策展人与所有其他辅助任务共享相同的底层机制（`hermes model`、仪表板模型选项卡、`base_url`、`api_key`、`timeout`、`extra_body`）。
:::

## 命令行接口 (CLI)

```bash
hermes curator status         # 上次运行时间、计数、固定列表、最近最少使用 (LRU) 前 5 名
hermes curator run            # 立即触发审查（阻塞直到 LLM 过程完成）
hermes curator run --background  # 触发即忘：在后台线程中启动 LLM 过程
hermes curator run --dry-run  # 仅预览 —— 报告但不进行任何更改
hermes curator backup         # 手动创建 ~/.hermes/skills/ 的快照
hermes curator rollback       # 从最新的快照恢复
hermes curator rollback --list     # 列出可用的快照
hermes curator rollback --id <ts>  # 恢复特定快照
hermes curator rollback -y         # 跳过确认提示
hermes curator pause          # 停止运行，直到恢复
hermes curator resume
hermes curator pin <skill>    # 永不自动转换此技能
hermes curator unpin <skill>
hermes curator restore <skill>  # 将已归档的技能移回活跃状态
```

## 备份与回滚

在每次实际的智能体策展人过程之前，Hermes 会在 `~/.hermes/skills/.curator_backups/<utc-iso>/skills.tar.gz` 处创建 `~/.hermes/skills/` 的 tar.gz 快照。如果某个过程归档或合并了您不希望更改的内容，您可以使用一条命令撤销整个运行：

```bash
hermes curator rollback        # 恢复最新快照（带确认）
hermes curator rollback -y     # 跳过提示
hermes curator rollback --list # 查看所有快照（包含原因和大小）
```

回滚本身也是可逆的：在替换技能树之前，Hermes 会创建另一个标记为 `pre-rollback to <target-id>` 的快照，因此可以通过 `--id` 向前回滚到该快照来撤销错误的回滚。

您也可以随时使用 `hermes curator backup --reason "before-refactor"` 手动创建快照。`--reason` 字符串会保存在快照的 `manifest.json` 中，并在 `--list` 中显示。

快照会被修剪至 `curator.backup.keep`（默认为 5），以控制磁盘使用量：

```yaml
curator:
  backup:
    enabled: true
    keep: 5
```

将 `curator.backup.enabled` 设置为 `false` 可禁用自动快照。只有在首先将 `enabled` 设置为 `true` 的情况下，手动 `hermes curator backup` 命令在禁用备份时才能工作 —— 该标志对称地控制两条路径，因此无法在变更性运行中意外跳过运行前快照。

`hermes curator status` 还会列出五个最近最少使用的技能 —— 这是查看接下来可能变陈旧内容的快速方法。

相同的子命令在运行中的会话（CLI 或网关平台）内作为 `/curator` 斜杠命令也可用。

## “智能体创建”的含义

如果技能的名称**不在**以下位置，则被视为智能体创建：

- `~/.hermes/skills/.bundled_manifest`（安装时从仓库复制的技能），以及
- `~/.hermes/skills/.hub/lock.json`（通过 `hermes skills install` 安装的技能）。

`~/.hermes/skills/` 中的其他所有内容都是智能体策展人的操作对象。这包括：

- 智能体在对话期间通过 `skill_manage(action="create")` 保存的技能。
- 您手动创建的、带有手写 `SKILL.md` 的技能。
- 通过您指向 Hermes 的外部技能目录添加的技能。

:::warning 您手写的技能看起来与智能体保存的技能相同
此处的来源是**二元的**（捆绑/中心 vs. 其他所有内容）。智能体策展人无法区分您用于私有工作流的手写技能与自我改进循环在会话中保存的技能。两者都会被归入“智能体创建”的类别。

在第一次实际运行之前（默认在安装后 7 天），请花点时间：

1. 运行 `hermes curator run --dry-run` 以确切查看智能体策展人会提出什么建议。
2. 使用 `hermes curator pin <name>` 来隔离您不希望更改的任何内容。
3. 或者，如果您更愿意自己管理库，请在 `config.yaml` 中将 `curator.enabled` 设置为 `false`。

归档的技能始终可以通过 `hermes curator restore <name>` 恢复，但预先固定比事后追查合并更容易。
:::

如果您希望保护特定技能不被更改 —— 例如，您所依赖的手写技能 —— 请使用 `hermes curator pin <name>`。请参阅下一节。

## 固定技能

固定可以保护技能不被删除 —— 既包括智能体策展人的自动归档过程，也包括智能体的 `skill_manage(action="delete")` 工具调用。一旦技能被固定：

- **智能体策展人**在自动转换（`活跃 → 陈旧 → 已归档`）期间会跳过它，并且其 LLM 审查过程会被指示不要触碰它。
- **智能体的 `skill_manage` 工具**会拒绝对其执行 `delete` 操作，并引导用户使用 `hermes curator unpin <name>`。补丁和编辑仍然会通过，因此智能体可以在出现陷阱时改进固定技能的内容，而无需进行固定/取消固定/再固定的操作。

使用以下命令进行固定和取消固定：

```bash
hermes curator pin <skill>
hermes curator unpin <skill>
```

该标志会作为 `"pinned": true` 存储在 `~/.hermes/skills/.usage.json` 中技能条目的元数据中，因此它会跨会话保留。

只有**智能体创建**的技能才能被固定 —— 捆绑和中心安装的技能从一开始就不会受到智能体策展人的更改，如果您尝试，`hermes curator pin` 会拒绝并显示解释性消息。

如果您希望获得比“不删除”更强的保证 —— 例如，在智能体仍然读取技能内容时完全冻结其内容 —— 请直接使用您的编辑器编辑 `~/.hermes/skills/<name>/SKILL.md`。固定保护的是工具驱动的删除，而不是您自己的文件系统访问。
## 使用遥测

智能体策展人在 `~/.hermes/skills/.usage.json` 中维护一个附属文件，每个技能一个条目：

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

计数器在以下情况时递增：

- `view_count`：智能体对该技能调用 `skill_view`。
- `use_count`：该技能被加载到对话的提示中。
- `patch_count`：对该技能执行 `skill_manage patch/edit/write_file/remove_file`。

捆绑和中心安装的技能被明确排除在遥测写入之外。

## 每次运行的报告

每次智能体策展人运行都会在 `~/.hermes/logs/curator/` 下写入一个带时间戳的目录：

```
~/.hermes/logs/curator/
└── 20260429-111512/
    ├── run.json      # 机器可读：完整保真度、统计信息、LLM 输出
    └── REPORT.md     # 人类可读摘要
```

`REPORT.md` 是查看给定运行所做操作的快速方式 —— 哪些技能发生了转换、LLM 审查员说了什么、它修补了哪些技能。无需在 `agent.log` 中搜索即可进行审计。

## 恢复已归档的技能

如果智能体策展人归档了您仍然想要的技能：

```bash
hermes curator restore <skill-name>
```

这会将技能从 `~/.hermes/skills/.archive/` 移回活跃树，并将其状态重置为 `active`。如果同名的捆绑或中心安装技能已安装（会遮蔽上游），则恢复操作会拒绝。

## 按环境禁用

智能体策展人默认处于启用状态。要将其关闭：

- **仅针对一个配置文件：** 编辑 `~/.hermes/config.yaml`（或活动配置文件的配置）并将 `curator.enabled` 设置为 `false`。
- **仅针对一次运行：** `hermes curator pause` —— 暂停会跨会话持续存在；使用 `resume` 重新启用。

如果 `min_idle_hours` 尚未过去，智能体策展人也会拒绝运行，因此在活跃的 dev 机器上，它自然只会在安静的时段运行。

## 另请参阅

- [技能系统](/docs/user-guide/features/skills) —— 技能如何工作以及创建它们的自我改进循环
- [记忆](/docs/user-guide/features/memory) —— 维护长期记忆的并行后台审查
- [捆绑技能目录](/docs/reference/skills-catalog)
- [问题 #7816](https://github.com/NousResearch/hermes-agent/issues/7816) —— 原始提案和设计讨论