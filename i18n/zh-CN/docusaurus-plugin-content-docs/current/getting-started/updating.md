---
sidebar_position: 3
title: "Updating & Uninstalling"
description: "How to update Hermes Agent to the latest version or uninstall it"
---

# 更新与卸载

## 更新

使用单条命令更新到最新版本：

```bash
hermes update
```

这会从 `main` 分支拉取最新代码、更新依赖，并提示你配置自上次更新以来新增的任何选项。

:::tip
`hermes update` 会自动检测新的配置选项并提示你添加。如果你跳过了该提示，可以手动运行 `hermes config check` 查看缺失的选项，然后运行 `hermes config migrate` 以交互式方式添加它们。
:::

### 更新过程中会发生什么

当你运行 `hermes update` 时，会执行以下步骤：

1. **配对数据快照** — 会保存一个轻量级的更新前状态快照（涵盖 `~/.hermes/pairing/`、飞书评论规则以及其他在运行时被修改的状态文件）。可通过[快照和回滚](../user-guide/checkpoints-and-rollback.md)中描述的快照恢复流程进行恢复，或者通过解压 Hermes 写入 `~/.hermes/` 目录旁边最新的快速快照 zip 文件来恢复。
2. **Git pull** — 从 `main` 分支拉取最新代码并更新子模块
3. **拉取后语法验证 + 自动回滚** — 拉取完成后，Hermes 会编译每次启动时 `hermes` 导入的八个关键文件。如果任何文件解析失败（例如孤立的合并冲突标记、被意外截断的文件），Hermes 会运行 `git reset --hard <pre-pull-sha>` 将安装回滚，以确保你的 shell 保持可启动状态。在上游修复发布后重新运行 `hermes update`。
4. **依赖安装** — 运行 `uv pip install -e ".[all]"` 以获取新的或变更的依赖
5. **配置迁移** — 检测自你的版本以来新增的配置选项并提示你设置
6. **网关自动重启** — 正在运行的网关在更新完成后会刷新，以便新代码立即生效。服务管理的网关（Linux 上的 systemd、macOS 上的 launchd）通过服务管理器重启。手动网关会在 Hermes 能够将运行中的 PID 映射到配置文件时自动重新启动。

### 针对非默认分支进行更新：`--branch`

默认情况下 `hermes update` 跟踪 `origin/main`。传入 `--branch <name>` 可针对不同的分支进行更新 — 适用于 QA 渠道、功能分支或候选发布测试：

```bash
hermes update --branch release-candidate
hermes update --check --branch experimental   # 仅预览落后状态
```

如果你的本地检出的分支不同，Hermes 会自动暂存任何未提交的作业，将 HEAD 切换到目标分支，然后拉取。本地不存在的分支会自动从 `origin/<name>` 跟踪（`git checkout -B <name> origin/<name>`）。任何地方都不存在的分支会干净地失败 — 你的暂存更改会在退出前恢复，确保你永远不会陷入异常状态。非 `main` 分支会自动跳过仅 fork 上游同步逻辑。

### 非交互式更新时的本地更改

当你在终端中运行 `hermes update` 时，Hermes 会暂存任何未提交的源代码树更改，拉取，然后**询问**是否恢复它们 — 与以往完全一致。交互式更新没有任何变化。

当更新**在没有终端的情况下运行** — 来自桌面/聊天应用的"更新"按钮或网关触发的更新 — 没有提示需要回答。`updates.non_interactive_local_changes` 设置决定如何处理你暂存的更改：

```yaml
# ~/.hermes/config.yaml
updates:
  non_interactive_local_changes: stash   # 默认：保留 + 自动恢复
  # non_interactive_local_changes: discard  # 丢弃本地源代码编辑
```

- `stash`（默认） — 自动暂存，拉取，然后在更新后的代码上自动恢复你的更改。不会丢失任何内容；如果恢复遇到冲突，它们会被保留在 git 暂存区以供手动恢复。
- `discard` — 自动暂存并在拉取后丢弃暂存，使更新始终落在干净的工作树上。仅在你从不打算保留对 Hermes 源代码本地编辑的机器上使用。它执行暂存丢弃（而非 `git reset --hard` + `git clean -fd`），因此 `node_modules`、`venv` 和构建输出等被忽略的路径永远不会被触及。

在桌面应用中，这是 **设置 → 高级 → 应用内更新本地更改**。

### 仅预览：`hermes update --check`

想在拉取之前知道是否有可用更新？运行 `hermes update --check` — 它会获取提交并与 `origin/main` 进行比较。不修改任何文件，不重启网关。适用于以"是否有更新"为条件的脚本和 cron 任务。

### 完整的更新前备份：`--backup`

对于高价值配置文件（生产网关、共享团队安装），你可以选择启用 `HERMES_HOME`（配置、认证、会话、技能、配对）的完整拉取前备份：

```bash
hermes update --backup
```

或将其设为每次运行的默认行为：

```yaml
# ~/.hermes/config.yaml
updates:
  pre_update_backup: true
```

`--backup` 在早期版本中曾是始终启用的行为，但它会为每次更新增加几分钟的时间（对于大型主目录而言），因此现在为可选。上面提到的轻量级配对数据快照仍然无条件运行。

### Windows：另一个 `hermes.exe` 正在运行

在 Windows 上，如果 `hermes update` 检测到另一个 `hermes.exe` 进程持有 venv 的入口点可执行文件 — 最常见的是 Hermes 桌面应用生成的后端、另一个终端中打开的 `hermes` REPL 或正在运行的网关 — 它将拒绝运行：

```
$ hermes update
✗ Another hermes.exe is running:
    PID 12345  hermes.exe

  Updating now would fail to overwrite ...\venv\Scripts\hermes.exe because
  Windows blocks REPLACE on a running executable.

  Close Hermes Desktop, exit any open `hermes` REPLs, and
  stop the gateway (`hermes gateway stop`) before retrying.
  Override with `hermes update --force` if you've already
  confirmed those processes will not write to the venv.
```

关闭列出的进程并重新运行。如果你确定并发进程不会干扰（很少见 — 通常仅在防病毒 shim 被错误归属时有用），传入 `--force` 跳过检查。在这种情况下，更新程序仍会以指数退避重试 `.exe` 重命名，对于顽固的锁，会通过 `MoveFileEx(MOVEFILE_DELAY_UNTIL_REBOOT)` 安排在下一次重启时替换，以便更新可以完成。

预期输出如下：

```
$ hermes update
Updating Hermes Agent...
📥 Pulling latest code...
Already up to date.  (or: Updating abc1234..def5678)
📦 Updating dependencies...
✅ Dependencies updated
🔍 Checking for new config options...
✅ Config is up to date  (or: Found 2 new options — running migration...)
🔄 Restarting gateways...
✅ Gateway restarted
✅ Hermes Agent updated successfully!
```

### 推荐的更新后验证

`hermes update` 处理主要的更新路径，但快速验证可以确认一切都干净落地：

1. `git status --short` — 如果工作树意外脏了，先检查再继续
2. `hermes doctor` — 检查配置、依赖和服务健康状态
3. `hermes --version` — 确认版本按预期升级
4. 如果你使用网关：`hermes gateway status`
5. 如果 `doctor` 报告了 npm 审计问题：在标记的目录中运行 `npm audit fix`

:::warning 更新后工作树脏
如果 `git status --short` 在 `hermes update` 后显示意外的更改，请停止并检查它们再继续。这通常意味着本地修改被重新应用在更新后的代码之上，或者依赖步骤刷新了锁文件。
:::

### 如果终端在更新过程中断开连接

`hermes update` 保护自己免受意外终端丢失的影响：

- 更新忽略 `SIGHUP`，因此关闭 SSH 会话或终端窗口不再会在安装过程中终止它。`pip` 和 `git` 子进程继承此保护，因此 Python 环境不会因连接断开而处于半安装状态。
- 更新运行时，所有输出都会镜像到 `~/.hermes/logs/update.log`。如果你的终端消失，重新连接并检查日志以查看更新是否完成以及网关重启是否成功：

```bash
tail -f ~/.hermes/logs/update.log
```

- `Ctrl-C`（SIGINT）和系统关机（SIGTERM）仍然会被尊重 — 这些是故意的取消操作，而非意外。

你不再需要将 `hermes update` 包裹在 `screen` 或 `tmux` 中以应对终端断开。

### 检查当前版本

```bash
hermes version
```

与 [GitHub 发布页面](https://github.com/NousResearch/hermes-agent/releases) 上的最新版本进行比较。

### 从消息平台更新

你也可以直接从 Telegram、Discord、Slack、WhatsApp 或 Teams 发送以下内容进行更新：

```
/update
```

这会拉取最新代码、更新依赖并重启正在运行的网关。机器人在重启期间会短暂离线（通常 5-15 秒），然后恢复。

### 手动更新

如果你是手动安装的（不是通过快速安装器）：

```bash
cd /path/to/hermes-agent
export VIRTUAL_ENV="$(pwd)/venv"

# 拉取最新代码
git pull origin main

# 重新安装（获取新依赖）
uv pip install -e ".[all]"

# 检查新的配置选项
hermes config check
hermes config migrate   # 交互式添加任何缺失的选项
```

### 回滚说明

如果更新引入了问题，你可以回滚到之前的版本：

```bash
cd /path/to/hermes-agent

# 列出最近的版本
git log --oneline -10

# 回滚到特定提交
git checkout <commit-hash>
uv pip install -e ".[all]"

# 如果网关正在运行则重启
hermes gateway restart
```

要回滚到特定的发布标签（替换为你之前的标签 — 例如最近的发布如 `v2026.5.16`，或来自 `git tag --sort=-version:refname` 的任何更早标签）：

```bash
git checkout vX.Y.Z
uv pip install -e ".[all]"
```

:::warning
回滚可能会导致配置不兼容，如果添加了新的选项。回滚后运行 `hermes config check`，如果遇到错误，从 `config.yaml` 中删除任何无法识别的选项。
:::

### Nix 用户注意事项

如果你通过 Nix flake 安装，更新通过 Nix 包管理器管理：

```bash
# 更新 flake 输入
nix flake update hermes-agent

# 或使用最新版本重建
nix profile upgrade hermes-agent
```

Nix 安装是不可变的 — 回滚由 Nix 的世代系统处理：

```bash
nix profile rollback
```

有关更多详情，请参阅 [Nix 设置](./nix-setup.md)。

---

## 卸载

```bash
hermes uninstall
```

卸载程序会提供保留配置文件（`~/.hermes/`）以供未来重新安装的选项。

### 手动卸载

```bash
rm -f ~/.local/bin/hermes
rm -rf /path/to/hermes-agent
rm -rf ~/.hermes            # 可选 — 如果计划重新安装则保留
```

:::info
如果你将网关安装为系统服务，请先停止并禁用它：
```bash
hermes gateway stop
# Linux: systemctl --user disable hermes-gateway
# macOS: launchctl remove ai.hermes.gateway
```
:::