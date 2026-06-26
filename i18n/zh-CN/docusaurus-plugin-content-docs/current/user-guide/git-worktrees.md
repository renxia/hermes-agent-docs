---
sidebar_position: 3
sidebar_label: "Git Worktrees"
title: "Git Worktrees"
description: "Run multiple Hermes agents safely on the same repository using git worktrees and isolated checkouts"
---

# Git Worktrees

Hermes 智能体通常用于大型、长期维护的仓库。当你需要：

- 在同一项目中**并行运行多个智能体**，或者
- 将实验性重构与主分支隔离时，

Git **worktrees** 是为每个智能体提供独立检出（checkout）且不复制整个仓库的最安全方式。

本页面展示了如何将 worktrees 与 Hermes 结合使用，使每个会话都拥有干净、隔离的工作目录。

## 为什么要在 Hermes 中使用 Worktrees？

Hermes 将**当前工作目录**视为项目根目录：

- CLI：你运行 `hermes` 或 `hermes chat` 的目录
- 消息网关：由 `~/.hermes/config.yaml` 中的 `terminal.cwd` 设置的目录

如果你在**同一个检出**中运行多个智能体，它们的更改可能会相互干扰：

- 一个智能体可能删除或重写另一个智能体正在使用的文件。
- 更难理解哪些更改属于哪个实验。

使用 worktrees，每个智能体获得：

- 自己的**分支和工作目录**
- 自己的 Checkpoint Manager 历史记录，用于 `/rollback`

另请参见：[Checkpoints 和 /rollback](./checkpoints-and-rollback.md)。

## 快速开始：创建 Worktree

从主仓库（包含 `.git/`）中，为功能分支创建一个新的 worktree：

```bash
# 从主仓库根目录
cd /path/to/your/repo

# 在 ../repo-feature 中创建新分支和 worktree
git worktree add ../repo-feature feature/hermes-experiment
```

这将创建：

- 一个新目录：`../repo-feature`
- 一个新分支：`feature/hermes-experiment` 已检出到该目录中

现在你可以 `cd` 进入新的 worktree 并在那里运行 Hermes：

```bash
cd ../repo-feature

# 在 worktree 中启动 Hermes
hermes
```

Hermes 将：

- 将 `../repo-feature` 视为项目根目录。
- 使用该目录处理上下文文件、代码编辑和工具。
- 为该 worktree 范围内的 `/rollback` 使用**独立的 checkpoint 历史记录**。

## 并行运行多个智能体

你可以创建多个 worktrees，每个带有自己的分支：

```bash
cd /path/to/your/repo

git worktree add ../repo-experiment-a feature/hermes-a
git worktree add ../repo-experiment-b feature/hermes-b
```

在各自的终端中：

```bash
# 终端 1
cd ../repo-experiment-a
hermes

# 终端 2
cd ../repo-experiment-b
hermes
```

每个 Hermes 进程：

- 在各自的分支上工作（`feature/hermes-a` 与 `feature/hermes-b`）。
- 在不同的影子仓库哈希（由 worktree 路径派生）下写入 checkpoints。
- 可以独立使用 `/rollback`，而不会影响另一个。

这在以下场景中特别有用：

- 运行批量重构。
- 对同一任务尝试不同的方法。
- 将 CLI + 网关会话针对同一上游仓库配对使用。

## 安全清理 Worktrees

当你完成一个实验后：

1. 决定保留还是丢弃该工作。
2. 如果你想保留：
   - 像平常一样将分支合并到主分支。
3. 移除 worktree：

```bash
cd /path/to/your/repo

# 移除 worktree 目录及其引用
git worktree remove ../repo-feature
```

注意事项：

- `git worktree remove` 会拒绝移除包含未提交更改的 worktree，除非你强制执行。
- 移除 worktree **不会**自动删除分支；你可以使用常规的 `git branch` 命令删除或保留该分支。
- 当移除 worktree 时，`~/.hermes/checkpoints/` 下的 Hermes checkpoint 数据不会自动清理，但通常占用空间非常小。

## 最佳实践

- **每个 Hermes 实验使用一个 worktree**
  - 为每个实质性更改创建专用的分支/worktree。
  - 这能保持 diff 集中且 PR 小巧可审查。
- **以实验名称命名分支**
  - 例如 `feature/hermes-checkpoints-docs`、`feature/hermes-refactor-tests`。
- **频繁提交**
  - 对高层级里程碑使用 git 提交。
  - 在中间过程中，使用 [checkpoints 和 /rollback](./checkpoints-and-rollback.md) 作为工具驱动编辑的安全网。
- **使用 worktrees 时避免从裸仓库根目录运行 Hermes**
  - 优先使用 worktree 目录，以便每个智能体有明确的作用域。

## 使用 `hermes -w`（自动 Worktree 模式）

Hermes 内置了 `-w` 标志，可以**自动创建一个临时 git worktree** 并带有独立分支。你无需手动设置 worktrees——只需 `cd` 进入你的仓库并运行：

```bash
cd /path/to/your/repo
hermes -w
```

Hermes 将：

- 在仓库内的 `.worktrees/` 下创建一个临时 worktree。
- 检出隔离的分支（例如 `hermes/hermes-<hash>`）。
- 在该 worktree 内运行完整的 CLI 会话。

这是获得 worktree 隔离的最简单方式。你也可以将其与单个查询结合使用：

```bash
hermes -w -z "Fix issue #123"
```

对于并行智能体，打开多个终端并在每个终端中运行 `hermes -w`——每次调用都会自动获得自己的 worktree 和分支。

## 总结

- 使用 **git worktrees** 为每个 Hermes 会话提供干净的独立检出。
- 使用 **分支** 记录实验的高层级历史。
- 使用 **checkpoints + `/rollback`** 在每个 worktree 中从错误中恢复。

这种组合为你提供：

- 强有力的保证，确保不同的智能体和实验不会互相干扰。
- 快速迭代周期，且易于从错误编辑中恢复。
- 干净、可审查的拉取请求。