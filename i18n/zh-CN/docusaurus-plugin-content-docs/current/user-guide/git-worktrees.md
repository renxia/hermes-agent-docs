---
sidebar_position: 3
sidebar_label: "Git 工作区"
title: "Git 工作区"
description: "使用 git worktrees 和隔离的检出，安全地在同一仓库上运行多个 Hermes 代理"
---

# Git 工作区

Hermes Agent 经常用于大型、长期维护的仓库。当您需要：

- 在同一项目上**并行运行多个代理**，或者
- 将实验性的重构与主分支隔离时，

Git **工作区 (worktrees)** 是最安全的方式，它允许每个代理拥有自己的检出，而无需复制整个仓库。

本页面介绍了如何将工作区与 Hermes 结合使用，从而确保每个会话都有一个干净、隔离的工作目录。

## 为什么要在 Hermes 中使用工作区？

Hermes 将**当前工作目录**视为项目根目录：

- CLI：运行 `hermes` 或 `hermes chat` 的目录
- 消息网关：由 `MESSAGING_CWD` 设置的目录

如果您在**同一个检出**中运行多个代理，它们的变化可能会相互干扰：

- 一个代理可能会删除或重写另一个代理正在使用的文件。
- 很难弄清楚哪些更改属于哪个实验。

使用工作区，每个代理都会获得：

- **自己的分支和工作目录**
- 用于 `/rollback` 的**自己的检查点管理器历史记录**

另请参阅：[检查点和 /rollback](./checkpoints-and-rollback.md)。

## 快速入门：创建工作区

从您的主仓库（包含 `.git/`）创建新的工作区来处理一个功能分支：

```bash
# 从主仓库根目录
cd /path/to/your/repo

# 在 ../repo-feature 创建一个新的分支和工作区
git worktree add ../repo-feature feature/hermes-experiment
```

这会创建：

- 一个新目录：`../repo-feature`
- 一个新分支：`feature/hermes-experiment`，并检出到该目录

现在您可以 `cd` 进入新的工作区，并在其中运行 Hermes：

```bash
cd ../repo-feature

# 在工作区启动 Hermes
hermes
```

Hermes 将：

- 将 `../repo-feature` 视为项目根目录。
- 使用该目录作为上下文文件、代码编辑和工具的来源。
- 为 `/rollback` 使用一个**独立的检查点历史记录**，范围限定于此工作区。

## 并行运行多个代理

您可以创建多个工作区，每个工作区都有自己的分支：

```bash
cd /path/to/your/repo

git worktree add ../repo-experiment-a feature/hermes-a
git worktree add ../repo-experiment-b feature/hermes-b
```

在单独的终端中：

```bash
# 终端 1
cd ../repo-experiment-a
hermes

# 终端 2
cd ../repo-experiment-b
hermes
```

每个 Hermes 进程：

- 在自己的分支上工作（`feature/hermes-a` vs `feature/hermes-b`）。
- 在不同的影子仓库哈希下写入检查点（该哈希值来源于工作区路径）。
- 可以独立使用 `/rollback`，而不会影响其他工作区。

当以下情况发生时，这尤其有用：

- 运行批量重构。
- 尝试解决同一任务的不同方法。
- 对同一个上游仓库进行 CLI + 网关会话配对。

## 安全清理工作区

当您完成一个实验后：

1. 决定是保留还是丢弃工作成果。
2. 如果您想保留它：
   - 像往常一样将分支合并到主分支。
3. 删除工作区：

```bash
cd /path/to/your/repo

# 删除工作区目录及其引用
git worktree remove ../repo-feature
```

注意：

- `git worktree remove` 如果工作区有未提交的更改，将拒绝删除，除非您强制执行。
- 删除工作区**不会**自动删除分支；您可以使用正常的 `git branch` 命令来删除或保留分支。
- Hermes 在 `~/.hermes/checkpoints/` 下的检查点数据在您删除工作区时不会自动清理，但通常非常小。

## 最佳实践

- **每个 Hermes 实验使用一个工作区**
  - 为每个重要的更改创建一个专用的分支/工作区。
  - 这可以使差异（diffs）保持集中，并将 PR 保持小且易于审查。
- **根据实验命名分支**
  - 例如：`feature/hermes-checkpoints-docs`，`feature/hermes-refactor-tests`。
- **频繁提交**
  - 使用 git 提交记录记录高层次的里程碑。
  - 使用 [检查点和 /rollback](./checkpoints-and-rollback.md) 作为工具驱动编辑过程中的安全网。
- **使用工作区时，避免从裸仓库根目录运行 Hermes**
  - 最好使用工作区目录，这样每个代理都有清晰的范围。

## 使用 `hermes -w`（自动工作区模式）

Hermes 内置了一个 `-w` 标志，它会**自动创建一个可丢弃的 git 工作区**，并为其设置自己的分支。您无需手动设置工作区——只需 `cd` 进入您的仓库并运行：

```bash
cd /path/to/your/repo
hermes -w
```

Hermes 将：

- 在您的仓库内部的 `.worktrees/` 下创建一个临时工作区。
- 检出一个隔离分支（例如 `hermes/hermes-<hash>`）。
- 在该工作区内运行完整的 CLI 会话。

这是获取工作区隔离的最简单方法。您还可以将其与单个查询结合使用：

```bash
hermes -w -q "修复问题 #123"
```

对于并行代理，请打开多个终端并在每个终端中运行 `hermes -w`——每次调用都会自动获得自己的工作区和分支。

## 整合所有知识点

- 使用 **git 工作区**为每个 Hermes 会话提供其自己的干净检出。
- 使用 **分支**来捕获实验的高层次历史记录。
- 使用 **检查点 + `/rollback`** 在每个工作区内从错误中恢复。

这种组合为您提供了：

- 强大的保证，确保不同的代理和实验不会相互干扰。
- 快速的迭代周期，并且可以轻松从错误编辑中恢复。
- 干净、可审查的拉取请求。