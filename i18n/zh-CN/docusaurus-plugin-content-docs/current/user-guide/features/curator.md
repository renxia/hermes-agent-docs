---
sidebar_position: 3
title: "维护器"
description: "针对智能体创建技能的后台维护——使用追踪、过时处理、归档及LLM驱动的审查"
---

# 维护器

维护器是一个针对**智能体创建技能**的后台维护流程。它会追踪每项技能的查看频率、使用频率和修补频率，将长期未使用的技能按 `活跃 → 过时 → 归档` 状态流转，并定期启动一个简短的辅助模型审查，以提出整合建议或修补漂移。

它的存在是为了防止通过[自我提升循环](/user-guide/features/skills#agent-managed-skills-skill_manage-tool)创建的技能无限堆积。每当智能体解决一个新问题并保存一项技能，该技能就会存入 `~/.hermes/skills/`。若无维护，最终会积累数十个高度相似、污染技能目录并浪费token的狭隘技能。

维护器**从不触碰**内置技能（随仓库发布）或从[agentskills.io](https://agentskills.io)安装的中心技能。它仅审查智能体自身编写的技能。同时它也**从不自动删除**——最坏的情况是归档至 `~/.hermes/skills/.archive/`，此操作可恢复。

跟踪 [issue #7816](https://github.com/NousResearch/hermes-agent/issues/7816)。

## 运行机制

维护器由闲置检查触发，而非计划任务守护进程。在CLI会话启动时，以及网关的计划任务计时线程中定期触发时，Hermes会检查：

1. 距上次维护器运行是否已过足够时间（`interval_hours`，默认**7天**），且
2. 智能体是否已闲置足够长的时间（`min_idle_hours`，默认**2小时**）。

若条件均满足，它将派生一个 `AIAgent` 的后台分支——与记忆/技能自我提升提示采用相同模式。该分支在自己的提示缓存中运行，不会影响当前活跃对话。

:::info 首次运行行为
在全新安装时（或首次在 `hermes update` 后触发的预维护器安装），维护器**不会立即运行**。首次观测会将 `last_run_at` 设为"当前时间"，并将首次实际运行推迟一个完整的 `interval_hours`。这给了您一个完整的间隔期来审视技能库、固定重要技能，或在维护器介入前完全退出。

若想在维护器实际运行前查看其*可能*的操作，请运行 `hermes curator run --dry-run` —— 它会生成相同的审查报告而不修改技能库。
:::

一次运行包含两个阶段：

1. **自动状态转换**（确定性，无LLM参与）。闲置 `stale_after_days`（30天）的技能变为 `过时`；闲置 `archive_after_days`（90天）的技能被移至 `~/.hermes/skills/.archive/`。
2. **LLM审查**（单次辅助模型处理，`max_iterations=8`）。派生的智能体会扫描智能体创建的技能，可通过 `skill_view` 读取任一技能，并决定每项技能是保留、修补（通过 `skill_manage`）、整合重叠部分，还是通过终端工具归档。整合将技能视为完整包：若技能包含 `references/`、`templates/`、`scripts/`、`assets/` 或指向这些路径的相对链接，维护器必须保持其独立性，或重新安置所需支持文件并重写路径，或归档整个包——不能仅将 `SKILL.md` 展平放入另一技能的 `references/` 文件。

被固定的技能对维护器的自动转换和智能体自身的 `skill_manage` 工具均不可操作。请参阅下方[固定技能](#固定技能)。

## 配置

所有设置均在 `config.yaml` 的 `curator:` 下（而非 `.env` — 这并非机密）。默认值如下：

```yaml
curator:
  enabled: true
  interval_hours: 168          # 7天
  min_idle_hours: 2
  stale_after_days: 30
  archive_after_days: 90
```

要完全禁用，请设置 `curator.enabled: false`。

### 使用更廉价的辅助模型运行审查

策展人的LLM审查过程是一个常规的辅助任务槽——`auxiliary.curator`——与视觉、压缩、会话搜索等并列。"Auto"表示"使用我的主聊天模型"；您可以覆盖此槽位，为审查过程指定特定的提供商和模型。

**最简单的方式 — `hermes model`：**

```bash
hermes model                   # → "辅助模型 — 侧任务路由"
                               # → 选择 "Curator" → 选择提供商 → 选择模型
```

相同的选取器可在网页仪表板的 **Models** 标签页中找到。

**直接编辑 config.yaml（等效方式）：**

```yaml
auxiliary:
  curator:
    provider: openrouter
    model: google/gemini-3-flash-preview
    timeout: 600               # 宽裕些 — 审查可能需要几分钟
```

将 `provider: auto`（默认值）保留为空，审查过程将通过您的主聊天模型进行路由，与其他所有辅助任务的行为保持一致。

:::note 旧版配置
早期版本使用一个单独的 `curator.auxiliary.{provider,model}` 块。此路径仍然有效，但会发出弃用日志行 — 请迁移到上面的 `auxiliary.curator`，以便策展人与其他所有辅助任务共享相同的底层机制（`hermes model`、仪表板 Models 标签页、`base_url`、`api_key`、`timeout`、`extra_body`）。
:::

## CLI

```bash
hermes curator status         # 上次运行、计数、固定列表、LRU 前5
hermes curator run            # 立即触发一次审查（阻塞直到LLM过程完成）
hermes curator run --background  # 发射即忘：在后台线程中启动LLM过程
hermes curator run --dry-run  # 仅预览 — 生成报告，不做任何修改
hermes curator backup         # 手动创建 ~/.hermes/skills/ 的快照
hermes curator rollback       # 从最新的快照恢复
hermes curator rollback --list     # 列出可用快照
hermes curator rollback --id <ts>  # 恢复特定的快照
hermes curator rollback -y         # 跳过确认提示
hermes curator pause          # 暂停运行，直到恢复
hermes curator resume
hermes curator pin <skill>    # 永不自动转换此技能
hermes curator unpin <skill>
hermes curator restore <skill>  # 将一个已归档的技能移回活跃状态
```

## 备份与回滚

在每次真正的策展人过程运行前，Hermes 会在 `~/.hermes/skills/.curator_backups/<utc-iso>/skills.tar.gz` 创建一个 `~/.hermes/skills/` 的 tar.gz 快照。如果一次运行归档或合并了您不想动的内容，您可以用一个命令撤销整个操作：

```bash
hermes curator rollback        # 恢复最新快照（带确认）
hermes curator rollback -y     # 跳过提示
hermes curator rollback --list # 查看所有快照的原因及大小
```

回滚本身是可逆的：在替换技能树之前，Hermes 会创建另一个标记为 `pre-rollback to <target-id>` 的快照，因此错误的回滚可以通过使用 `--id` 回滚到那个快照来撤销。

您也可以在任何时候使用 `hermes curator backup --reason "before-refactor"` 手动创建快照。`--reason` 字符串会写入快照的 `manifest.json` 中，并在 `--list` 中显示。

快照会根据 `curator.backup.keep`（默认值为5）进行修剪，以保持磁盘使用量有界：

```yaml
curator:
  backup:
    enabled: true
    keep: 5
```

设置 `curator.backup.enabled: false` 可禁用自动快照。仅当您先设置 `enabled: true` 时，禁用备份后手动的 `hermes curator backup` 命令才有效 — 该标志对称地控制两种路径，因此无法意外地跳过变更运行前的快照。

`hermes curator status` 还会列出最近最少使用的五个技能 — 一种快速查看哪些技能可能即将过时的方法。

相同的子命令也可作为运行中会话（CLI或网关平台）内的 `/curator` 斜杠命令使用。

## “智能体创建”是什么意思

如果一个技能的名称**不**在以下列表中，则被视为智能体创建：

- `~/.hermes/skills/.bundled_manifest`（安装时从仓库复制的技能），以及
- `~/.hermes/skills/.hub/lock.json`（通过 `hermes skills install` 安装的技能）。

`~/.hermes/skills/` 中的其他所有内容都是策展人的目标。这包括：

- 智能体在对话期间通过 `skill_manage(action="create")` 保存的技能。
- 您使用手写的 `SKILL.md` 手动创建的技能。
- 通过您为 Hermes 指定的外部技能目录添加的技能。

:::warning 您手写的技能看起来与智能体保存的相同
这里的来源是**二元的**（捆绑/集线器 vs. 其他所有）。策展人无法区分您为私人工作流所依赖的手工编写技能，和在会话中由自我改进循环保存的技能。两者都属于“智能体创建”的范畴。

在第一次真正的运行之前（默认是安装后7天），请花点时间：

1. 运行 `hermes curator run --dry-run` 以确切查看策展人会提出什么建议。
2. 使用 `hermes curator pin <name>` 来保护您不想动的任何内容。
3. 或者，如果您更愿意自己管理库，可以在 `config.yaml` 中设置 `curator.enabled: false`。

归档始终可以通过 `hermes curator restore <name>` 恢复，但预先进行固定比事后追溯一次合并要容易得多。
:::

如果您想保护某个特定技能不被触及——例如您依赖的手工编写的技能——请使用 `hermes curator pin <name>`。请参阅下一节。

## 固定技能

固定可以保护技能免于删除——无论是策展人的自动归档过程还是智能体的 `skill_manage(action="delete")` 工具调用。一旦一个技能被固定：

- **策展人**在自动转换（`活跃 → 过时 → 归档`）时会跳过它，并且其LLM审查过程被指示不予理会。
- **智能体的 `skill_manage` 工具**会拒绝对其执行 `delete`，并指引用户使用 `hermes curator unpin <name>`。补丁和编辑仍然可以进行，因此智能体可以在发现问题时改进固定技能的内容，而无需进行固定/取消固定/再固定的循环。

使用以下命令进行固定和取消固定：

```bash
hermes curator pin <skill>
hermes curator unpin <skill>
```

该标志存储在 `~/.hermes/skills/.usage.json` 中该技能条目下的 `"pinned": true`，因此它会在不同会话之间保持。

只有**智能体创建**的技能才能被固定——捆绑和集线器安装的技能从根本上就不受策展人变更的影响，如果您尝试固定它们，`hermes curator pin` 会拒绝并给出解释性消息。

如果您想要比“不删除”更强的保证——例如，完全冻结一个技能的内容，同时智能体仍然读取它——请直接使用您的编辑器编辑 `~/.hermes/skills/<name>/SKILL.md`。固定保护的是工具驱动的删除，而非您自己的文件系统访问。

## 使用遥测

策展人在 `~/.hermes/skills/.usage.json` 维护一个侧边栏文件，每个技能对应一条记录：

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

以下情况会递增计数器：

- `view_count`：智能体对技能调用 `skill_view`。
- `use_count`：技能被加载到对话的提示中。
- `patch_count`：在技能上运行了 `skill_manage patch/edit/write_file/remove_file`。

捆绑和通过中心安装的技能明确排除在遥测写入之外。

## 每次运行的报告

每次策展人运行都会在 `~/.hermes/logs/curator/` 下写入一个带时间戳的目录：

```
~/.hermes/logs/curator/
└── 20260429-111512/
    ├── run.json      # 机器可读：完整保真，包含统计数据和 LLM 输出
    └── REPORT.md     # 人类可读的摘要
```

`REPORT.md` 是快速查看特定运行内容的方式——哪些技能发生了转换、LLM 审阅者说了什么、它修补了哪些技能。适合审计，无需费力查找 `agent.log`。

### 摘要中的重命名映射

如果一次运行将多个技能合并到一个总括技能下（或合并了近乎重复的技能），则运行结束时用户可见的摘要会包含一个显式的重命名映射，显示策展人应用的每个 `旧名称 → 新名称` 对。这是在每个技能的转换行之外额外提供的，因此当一波重命名发生时，您无需对比 JSON 报告即可一目了然。该提示也会在 `hermes curator pin` 下显示，以便您如果想锁定新标签，可以立即固定总括技能名称。

## 恢复已存档的技能

如果策展人存档了您仍需要的技能：

```bash
hermes curator restore <技能名称>
```

这会将该技能从 `~/.hermes/skills/.archive/` 移回活动目录树，并将其状态重置为 `active`。如果捆绑技能或通过中心安装的技能随后在相同名称下被安装（可能会覆盖上游），则恢复操作会被拒绝。

## 按环境禁用

策展人默认处于启用状态。要将其关闭：

- **仅针对一个配置文件：** 编辑 `~/.hermes/config.yaml`（或当前活动配置文件的配置）并设置 `curator.enabled: false`。
- **仅针对一次运行：** `hermes curator pause` — 暂停会跨会话持续；使用 `resume` 重新启用。

如果 `min_idle_hours` 尚未经过，策展人也会拒绝运行，因此在活跃的开发机器上，它自然只会在机器空闲期间运行。

## 另请参阅

- [技能系统](/user-guide/features/skills) — 技能的一般工作方式以及创建它们的自我改进循环
- [记忆](/user-guide/features/memory) — 一个维护长期记忆的并行后台审阅
- [捆绑技能目录](/reference/skills-catalog)
- [问题 #7816](https://github.com/NousResearch/hermes-agent/issues/7816) — 原始提案和设计讨论