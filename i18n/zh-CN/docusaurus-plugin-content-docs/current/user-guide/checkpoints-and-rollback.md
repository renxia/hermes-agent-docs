---
sidebar_position: 8
sidebar_label: "检查点与回滚"
title: "检查点与 /rollback"
description: "使用影子 Git 仓库和自动快照为破坏性操作提供文件系统安全网"
---

# 检查点与 `/rollback`

Hermes 智能体在**破坏性操作**前会自动为您的项目创建快照，并允许您通过单个命令恢复项目。检查点**默认启用**——当没有触发任何文件修改工具时，不会产生任何开销。

此安全网由一个内部的**检查点管理器**提供支持，该管理器在 `~/.hermes/checkpoints/` 下维护一个独立的影子 Git 仓库——您的真实项目 `.git` 永远不会被触及。

## 什么会触发检查点

检查点会在以下操作前自动创建：

- **文件工具** — `write_file` 和 `patch`
- **破坏性终端命令** — `rm`、`mv`、`sed -i`、`truncate`、`shred`、输出重定向（`>`）以及 `git reset`/`clean`/`checkout`

智能体**每轮对话（每个目录）最多创建一个检查点**，因此长时间运行的会话不会产生大量快照。

## 快速参考

| 命令 | 描述 |
|---------|-------------|
| `/rollback` | 列出所有检查点及其变更统计 |
| `/rollback <N>` | 恢复到第 N 个检查点（同时撤销上一轮对话） |
| `/rollback diff <N>` | 预览当前状态与第 N 个检查点之间的差异 |
| `/rollback <N> <file>` | 从第 N 个检查点恢复单个文件 |

## 检查点的工作原理

从高层面来看：

- Hermes 会检测工具何时即将**修改工作树中的文件**。
- 每轮对话（每个目录）仅执行一次，它会：
  - 为文件解析一个合理的项目根目录。
  - 初始化或重用与该目录关联的**影子 Git 仓库**。
  - 暂存并提交当前状态，附带简短易懂的原因说明。
- 这些提交构成了一个检查点历史记录，您可以通过 `/rollback` 命令查看和恢复。

```mermaid
flowchart LR
  user["用户命令\n(hermes, gateway)"]
  agent["AI智能体\n(run_agent.py)"]
  tools["文件与终端工具"]
  cpMgr["检查点管理器"]
  shadowRepo["影子 Git 仓库\n~/.hermes/checkpoints/<hash>"]

  user --> agent
  agent -->|"工具调用"| tools
  tools -->|"变更前\nensure_checkpoint()"| cpMgr
  cpMgr -->|"git add/commit"| shadowRepo
  cpMgr -->|"成功 / 跳过"| tools
  tools -->|"应用变更"| agent
```

## 配置

检查点默认启用。请在 `~/.hermes/config.yaml` 中进行配置：

```yaml
checkpoints:
  enabled: true          # 总开关（默认：true）
  max_snapshots: 50      # 每个目录的最大检查点数量

  # 自动维护（可选）：启动时扫描 ~/.hermes/checkpoints/
  # 并删除其工作目录已不存在（孤儿仓库）或最新提交早于保留天数的影子仓库。
  # 最多每 min_interval_hours 执行一次，通过 ~/.hermes/checkpoints/ 内的
  # .last_prune 标记进行跟踪。
  auto_prune: false           # 默认关闭 — 启用以释放磁盘空间
  retention_days: 7
  delete_orphans: true        # 删除工作目录已消失的仓库
  min_interval_hours: 24
```

要禁用：

```yaml
checkpoints:
  enabled: false
```

禁用后，检查点管理器将不执行任何操作，且永远不会尝试执行 Git 操作。

## 列出检查点

在 CLI 会话中：

```
/rollback
```

Hermes 会返回一个格式化的列表，显示变更统计信息：

```text
📸 /path/to/project 的检查点：

  1. 4270a8c  2026-03-16 04:36  before patch  (1 个文件, +1/-0)
  2. eaf4c1f  2026-03-16 04:35  before write_file
  3. b3f9d2e  2026-03-16 04:34  before terminal: sed -i s/old/new/ config.py  (1 个文件, +1/-1)

  /rollback <N>             恢复到第 N 个检查点
  /rollback diff <N>        预览自第 N 个检查点以来的变更
  /rollback <N> <file>      从第 N 个检查点恢复单个文件
```

每个条目显示：

- 短哈希值
- 时间戳
- 原因（触发快照的操作）
- 变更摘要（修改的文件数、插入/删除行数）

## 使用 `/rollback diff` 预览变更

在确认恢复之前，预览自某个检查点以来的变更：

```
/rollback diff 1
```

这会显示一个 Git 差异统计摘要，后跟实际的差异内容：

```text
test.py | 2 +-
 1 个文件已修改, 1 行插入(+), 1 行删除(-)

diff --git a/test.py b/test.py
--- a/test.py
+++ b/test.py
@@ -1 +1 @@
-print('original content')
+print('modified content')
```

为避免终端信息过载，长差异内容最多显示 80 行。

## 使用 `/rollback` 恢复

按编号恢复到某个检查点：

```
/rollback 1
```

在后台，Hermes 会：

1. 验证目标提交是否存在于影子仓库中。
2. 对当前状态创建一个**回滚前快照**，以便您稍后可以“撤销回滚”。
3. 恢复工作目录中已跟踪的文件。
4. **撤销上一轮对话**，使智能体的上下文与恢复后的文件系统状态匹配。

成功后：

```text
✅ 已恢复到检查点 4270a8c5: before patch
已自动保存回滚前快照。
(^_^)b 已撤销 4 条消息。已移除: "Now update test.py to ..."
  历史记录中还剩 4 条消息。
  已撤销对话轮次以匹配恢复的文件状态。
```

对话撤销可确保智能体不会“记住”已被回滚的变更，从而避免下一轮对话出现混淆。

## 单文件恢复

仅从某个检查点恢复一个文件，而不影响目录中的其他文件：

```
/rollback 1 src/broken_file.py
```

当智能体修改了多个文件但只需还原其中一个时，此功能非常有用。

## 安全性与性能保护

为确保检查点功能安全且高效，Hermes 应用了多项保护措施：

- **Git 可用性** — 如果在 `PATH` 中找不到 `git`，检查点将被透明地禁用。
- **目录范围** — Hermes 会跳过过于宽泛的目录（如根目录 `/`、主目录 `$HOME`）。
- **仓库大小** — 文件数超过 50,000 的目录将被跳过，以避免 Git 操作变慢。
- **无变更快照** — 如果自上次快照以来没有发生任何变更，则跳过检查点创建。
- **非致命错误** — 检查点管理器内部的所有错误均以调试级别记录；您的工具将继续正常运行。

## 检查点的存储位置

所有影子仓库均位于：

```text
~/.hermes/checkpoints/
  ├── <hash1>/   # 一个工作目录的影子 Git 仓库
  ├── <hash2>/
  └── ...
```

每个 `<hash>` 均由工作目录的绝对路径派生而来。在每个影子仓库中，您会找到：

- 标准 Git 内部文件（`HEAD`、`refs/`、`objects/`）
- 一个包含精选忽略列表的 `info/exclude` 文件
- 一个指向原始项目根目录的 `HERMES_WORKDIR` 文件

通常情况下，您无需手动操作这些文件。

## 最佳实践

- **保持检查点启用** — 它们默认开启，且在未修改文件时不会产生任何开销。
- **恢复前使用 `/rollback diff`** — 预览将要发生的变更，以选择合适的检查点。
- **使用 `/rollback` 而非 `git reset`** — 当您只想撤销由智能体驱动的变更时。
- **结合 Git 工作树使用**以实现最大安全性 — 将每个 Hermes 会话置于其独立的工作树/分支中，并将检查点作为额外的一层保护。

有关在同一仓库上并行运行多个智能体的信息，请参阅 [Git 工作树](./git-worktrees.md) 指南。