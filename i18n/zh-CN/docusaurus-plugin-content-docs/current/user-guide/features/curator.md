---
sidebar_position: 3
title: "Curator"
description: "Background maintenance for agent-created skills — usage tracking, staleness, archival, and LLM-driven review"
---

# Curator

Curator 是**智能体创建的技能**的后台维护通道。它追踪每个技能的查看、使用频率，将长期未使用的技能按 `活跃 → 过期 → 归档` 状态流转，并定期启动一次简短的辅助模型审查，以提出整合或修补偏差的建议。

它的存在是为了防止通过[自我改进循环](/user-guide/features/skills#agent-managed-skills-skill_manage-tool)创建的技能无限积累。每当智能体解决一个新问题并保存技能时，该技能会落入 `~/.hermes/skills/`。若不加维护，最终会出现大量狭窄的近似重复项，污染目录并浪费 token。

默认情况下（`prune_builtins: true`），Curator 可以在 `archive_after_days` 天未使用后归档**未使用的内置捆绑技能**（随仓库一起分发），同时管理它主要维护的智能体创建技能。从 [agentskills.io](https://agentskills.io) 安装的 Hub 技能始终不可触碰。设置 `curator.prune_builtins: false` 可恢复旧的仅处理智能体创建技能的行为，内置技能将永远不会被触碰。Curator 也**从不自动删除**——最坏的情况是归档到 `~/.hermes/skills/.archive/`，这是可恢复的。

追踪 [issue #7816](https://github.com/NousResearch/hermes-agent/issues/7816)。

## 运行方式

Curator 由非活动检查触发，而非 cron 守护进程。在 CLI 会话启动时，以及在网关的 cron-ticker 线程内的周期性 tick 中，Hermes 会检查：

1. 距离上次 Curator 运行是否已过足够时间（`interval_hours`，默认 **7 天**），以及
2. 智能体是否已空闲足够长时间（`min_idle_hours`，默认 **2 小时**）。

如果两者都满足，它会派生一个 `AIAgent` 的后台分支——与记忆/技能自我改进提示使用的模式相同。该分支在自己的提示缓存中运行，永远不会触及活跃会话。

:::info 首次运行行为
在全新安装时（或首次安装 Curator 前的版本在 `hermes update` 后第一次 tick 时），Curator **不会立即运行**。首次观察会将 `last_run_at` 标记为"现在"，并将首次真正的通道推迟一个完整的 `interval_hours`。这为你提供了完整的间隔时间来审查你的技能库、固定重要内容，或在 Curator 触及之前完全退出。

如果你想在实际运行前了解 Curator *会做什么*，运行 `hermes curator run --dry-run`——它会生成相同的审查报告，但不会修改技能库。
:::

一次运行分为两个阶段：

1. **自动流转**（确定性，无需 LLM）。超过 `stale_after_days`（30）天未使用的技能变为 `stale`；超过 `archive_after_days`（90）天未使用的技能被移至 `~/.hermes/skills/.archive/`。这是始终开启的修剪行为——只要 Curator 启用就会运行，无辅助模型成本。
2. **LLM 整合**（单次辅助模型通道，`max_iterations=8`）——**默认关闭**。当 `curator.consolidate: true` 时，分支智能体调查智能体创建的技能，可以通过 `skill_view` 读取其中任何一个，并逐个技能决定保留、修补（通过 `skill_manage`）、将重叠技能整合为类级伞形技能，或通过终端工具归档。整合将技能视为完整包：如果技能包含 `references/`、`templates/`、`scripts/`、`assets/` 或这些路径的相对链接，Curator 必须保持其独立、重新安置所需的支持文件并重写路径，或将整个包原封不动地归档——而不是仅将 `SKILL.md` 扁平化到另一个技能的 `references/` 文件中。

:::info 整合是可选的
默认情况下 Curator 仅**修剪**——确定性的非活动通道将技能标记为过期并归档长期未使用的技能。带有主观判断的 LLM **整合**通道（构建伞形技能、合并重叠技能）默认关闭，因为它每次运行都会消耗辅助模型 token，并对你的技能库进行广泛的结构性更改。通过 `curator.consolidate: true` 开启它，或使用 `hermes curator run --consolidate` 按需运行一次。
:::

固定技能对 Curator 的自动流转和智能体自身的 `skill_manage` 工具均不可触碰。见下文[固定技能](#pinning-a-skill)。

## 配置

所有设置都位于 `config.yaml` 中的 `curator:` 下（不是 `.env` — 这不是什么秘密）。默认值：

```yaml
curator:
  enabled: true
  interval_hours: 168          # 7 天
  min_idle_hours: 2
  stale_after_days: 30
  archive_after_days: 90
  consolidate: false           # LLM 伞形构建通道 — 选择性启用（默认仅剪枝）
  prune_builtins: true         # 同时归档未使用的内置技能（hub 技能始终豁免）
```

要完全禁用，设置 `curator.enabled: false`。要保留始终启用的剪枝功能但选择启用 LLM 整合，设置 `curator.consolidate: true`。

### 在更便宜的辅助模型上运行审查

智能体的 LLM 审查通道是一个常规的辅助任务槽位 — `auxiliary.curator` — 与视觉、压缩、会话搜索等并列。"自动"意味着"使用我的主聊天模型"；覆盖该槽位可以为审查通道固定特定的提供商 + 模型。

**最简单的方式 — `hermes model`：**

```bash
hermes model                   # → "辅助模型 — 侧任务路由"
                               # → 选择 "Curator" → 选择提供商 → 选择模型
```

Web 仪表板的 **模型** 选项卡中也有相同的选取器。

**直接编辑 config.yaml（等效）：**

```yaml
auxiliary:
  curator:
    provider: openrouter
    model: google/gemini-3-flash-preview
    timeout: 600               # 宽裕 — 审查可能需要几分钟
```

保留 `provider: auto`（默认值）会将审查通道路由到你的主聊天模型，与其他所有辅助任务的行为一致。

:::note 旧版配置
早期版本使用了一次性的 `curator.auxiliary.{provider,model}` 块。该路径仍然有效，但会输出一条弃用日志 — 请迁移到上面的 `auxiliary.curator`，以便智能体共享相同的管道（`hermes model`、仪表板模型选项卡、`base_url`、`api_key`、`timeout`、`extra_body`）与其他所有辅助任务。
:::

## CLI

```bash
hermes curator status         # 上次运行、计数、固定列表、LRU 前 5
hermes curator run            # 立即触发运行（阻塞直到完成）。除非 curator.consolidate: true，否则仅剪枝
hermes curator run --consolidate # 强制本次运行启用 LLM 整合通道，覆盖配置默认值
hermes curator run --background  # 即发即忘：在后台线程中启动运行
hermes curator run --dry-run  # 仅预览 — 报告但不做任何变更
hermes curator backup         # 手动拍摄 ~/.hermes/skills/ 的快照
hermes curator rollback       # 从最新快照恢复
hermes curator rollback --list     # 列出所有可用快照
hermes curator rollback --id <ts>  # 恢复特定快照
hermes curator rollback -y         # 跳过确认提示
hermes curator pause          # 停止运行直到恢复
hermes curator resume
hermes curator pin <skill>    # 永不自动转换此技能
hermes curator unpin <skill>
hermes curator restore <skill>  # 将已归档的技能移回活动状态
hermes curator list-archived    # 列出当前在 ~/.hermes/skills/.archive/ 中的技能
hermes curator archive <skill>  # 立即手动归档单个技能
hermes curator prune [--days N] # 批量归档空闲 >= N 天的智能体创建技能（默认 90 天）
```

## 备份与回滚

在每次真正的智能体运行之前，Hermes 会在 `~/.hermes/skills/.curator_backups/<utc-iso>/skills.tar.gz` 处拍摄 `~/.hermes/skills/` 的 tar.gz 快照。如果某次运行归档或整合了你不想被改动的内容，你可以用一条命令撤销整个运行：

```bash
hermes curator rollback        # 恢复最新快照（需确认）
hermes curator rollback -y     # 跳过提示
hermes curator rollback --list # 查看所有快照及其原因和大小
```

回滚本身是可逆的：在替换技能树之前，Hermes 会拍摄另一个标记为 `pre-rollback to <target-id>` 的快照，因此错误的回滚可以通过使用 `--id` 向前滚动到该快照来撤销。

你也可以随时用 `hermes curator backup --reason "before-refactor"` 拍摄手动快照。`--reason` 字符串会出现在快照的 `manifest.json` 中，并在 `--list` 中显示。

快照会按 `curator.backup.keep`（默认 5）进行剪枝，以控制磁盘使用：

```yaml
curator:
  backup:
    enabled: true
    keep: 5
```

设置 `curator.backup.enabled: false` 可禁用自动快照。手动 `hermes curator backup` 命令仅在先将 `enabled` 设为 `true` 时才能在备份被禁用时生效 — 该标志对称地控制两条路径，因此不会意外跳过变更运行前的快照。

`hermes curator status` 还会列出最近使用最少的五个技能 — 这是查看哪些技能可能即将过期的快捷方式。

在运行中的会话（CLI 或网关平台）内，相同的子命令也可作为 `/curator` 斜杠命令使用。

## "智能体创建"的含义

智能体仅管理在 `~/.hermes/skills/.usage.json` 中明确标记为 **智能体创建** 的技能。技能必须同时满足以下所有条件才符合资格：

1. 其名称**不在** `~/.hermes/skills/.bundled_manifest` 中（仓库附带的内置技能）。
2. 其名称**不在** `~/.hermes/skills/.hub/lock.json` 中（hub 安装的技能）。
3. 其 `.usage.json` 条目具有 `"created_by": "agent"` 或 `"agent_created": true`。

目前，只有**后台自我改进审查分支**会设置此标记 — 当它在周期性审查通道（约每 10 个智能体轮次）中创建新的伞形技能时。后台分支以 `"background_review"` 的写入来源运行（通过 `tools/skill_provenance.py`），这是唯一触发 `skill_manage` 中 `mark_agent_created()` 调用的路径。

前台智能体在对话中通过 `skill_manage(action="create")` 创建的技能**不会**被标记为智能体创建 — 它们被视为用户指定的，智能体有意让它们保持原样。

:::warning 你手动编写的技能不会被管理
如果你手动创建了 `SKILL.md` 或将 Hermes 指向外部技能目录，该技能的 `.usage.json` 条目将具有 `created_by: null`（或该字段缺失）。智能体不会触碰它。前台智能体应你请求而创建的技能同理。

**要查看智能体实际管理哪些技能**，运行 `hermes curator status`。如果智能体创建计数为 0，则当前没有技能在智能体的管辖范围内 — LLM 审查通道将被跳过，报告将显示 `Model: (not resolved) via (not resolved)` 且 `Duration: 0s`。
:::

被标记为智能体创建的技能遵循完整的生命周期：

- `active` →（30 天未使用）`stale` →（90 天未使用）`archived`
- 固定的技能绕过所有自动转换
- 归档可通过 `hermes curator restore <name>` 恢复

如果你想保护某个特定技能不被触碰 — 例如你依赖的手动编写的技能 — 使用 `hermes curator pin <name>`。见下一节。

## 固定技能

固定可保护技能免于删除 — 包括智能体的自动归档通道和智能体的 `skill_manage(action="delete")` 工具调用。一旦技能被固定：

- **智能体**在自动转换（`active → stale → archived`）期间跳过它，其 LLM 审查通道被指示让其保持原样。
- **智能体的 `skill_manage` 工具**拒绝对其执行 `delete`，并指向用户执行 `hermes curator unpin <name>`。补丁和编辑仍然可以通过，因此智能体可以在遇到缺陷时改进固定技能的内容，而无需反复固定/取消固定/重新固定。

用以下命令固定和取消固定：

```bash
hermes curator pin <skill>
hermes curator unpin <skill>
```

该标志作为 `"pinned": true` 存储在技能的 `~/.hermes/skills/.usage.json` 条目中，因此在会话之间保持不变。

只有**智能体创建**的技能才能被固定 — `hermes curator pin` 在内置和 hub 安装的技能上会拒绝并显示说明信息。Hub 安装的技能永远不会被智能体变更。内置内置技能仅在 `curator.prune_builtins: true`（默认值）时被触及，且仅在 `archive_after_days` 未使用后才被归档 — 从不被补丁、整合或删除。设置 `curator.prune_builtins: false` 可完全豁免内置技能。

一小组**受保护的内置技能**被硬编码为永远不可归档和不可整合，不受 `curator.prune_builtins`、固定状态或 LLM 判断的影响。这些支撑着关键的 UX — 例如，`plan` 驱动 `/plan` 斜杠命令流程 — 因此静默归档某个技能会使其斜杠命令变成 "Unknown command" 错误而不会给你任何提示。受保护的内置技能会从智能体的候选列表中完全过滤掉，因此整合通道永远不会看到它们。

如果你想要比"不删除"更强的保证 — 例如，在智能体仍然读取技能的同时完全冻结其内容 — 直接用编辑器编辑 `~/.hermes/skills/<name>/SKILL.md`。固定保护的是工具驱动的删除，而不是你自己的文件系统访问。

## 使用遥测

管理器会在 `~/.hermes/skills/.usage.json` 中维护一个边车文件，每个技能对应一条记录：

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

- `view_count`：当智能体对该技能调用 `skill_view` 时。
- `use_count`：当技能被加载到对话的提示词中时。
- `patch_count`：当对该技能执行 `skill_manage patch/edit/write_file/remove_file` 时。

捆绑安装和从中心安装的技能被显式排除在遥测写入之外。

## 每次运行报告

每次管理器运行都会在 `~/.hermes/logs/curator/` 下写入一个带时间戳的目录：

```
~/.hermes/logs/curator/
└── 20260429-111512/
    ├── run.json      # 机器可读：完整保真度、统计信息、LLM 输出
    └── REPORT.md     # 人类可读的摘要
```

`REPORT.md` 是快速查看某次运行做了什么的方式——哪些技能发生了状态转换、LLM 审查者说了什么、它修补了哪些技能。适合用于审计，而无需去 `agent.log` 中搜索。

:::note 没有候选？报告将显示 `(not resolved)`
当管理器**没有智能体创建的技能**可供审查时，LLM 审查步骤将被完全跳过。报告头部将显示
`Model: (not resolved) via (not resolved)` 且 `Duration: 0s` ——这**并不**表示配置错误或模型解析失败。它仅仅意味着没有候选技能，因此从未调用过任何模型。自动转换阶段仍会正常运行并正常报告其计数。
:::

### 摘要中的重命名映射

如果某次运行在伞形名称下合并了多个技能（或合并了近似重复项），运行结束时打印的用户可见摘要中包含一个显式的重命名映射，显示管理器应用的每一对 `旧名称 → 新名称`。这是对逐条技能转换行的补充，因此当一批重命名出现时，你可以一目了然，而无需对比 JSON 报告。该提示也会在 `hermes curator pin` 下显示，以便你可以立即锁定新的伞形名称。

## 恢复已归档的技能

如果管理器归档了你仍然需要的某个技能：

```bash
hermes curator restore <skill-name>
```

这会将技能从 `~/.hermes/skills/.archive/` 移回活动目录树，并将其状态重置为 `active`。如果此后有捆绑安装或从中心安装的技能以同名安装（会遮蔽上游），则恢复操作会被拒绝。

## 按环境禁用

管理器默认处于开启状态。要关闭它：

- **仅针对单个配置文件：** 编辑 `~/.hermes/config.yaml`（或当前活动配置文件的配置），设置 `curator.enabled: false`。
- **仅针对单次运行：** `hermes curator pause` ——暂停状态会跨会话持续；使用 `resume` 重新启用。

管理器还会在 `min_idle_hours` 未经过时拒绝运行，因此在活跃的开发机器上，它自然只会在空闲时段运行。

## 另见

- [技能系统](/user-guide/features/skills) ——技能的通用工作原理及创建它们的自我改进循环
- [记忆](/user-guide/features/memory) ——一个并行的后台审查，维护长期记忆
- [捆绑技能目录](/reference/skills-catalog)
- [Issue #7816](https://github.com/NousResearch/hermes-agent/issues/7816) ——原始提案与设计讨论