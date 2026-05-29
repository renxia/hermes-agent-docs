---
sidebar_position: 3
title: "更新与卸载"
description: "如何将 Hermes 智能体更新至最新版本或将其卸载"
---

# 更新与卸载

## 更新

### Git 安装

使用单个命令即可更新至最新版本：

```bash
hermes update
```

此操作会拉取 `main` 分支的最新代码，更新依赖项，并提示您配置自上次更新以来添加的新选项。

### pip 安装

PyPI 发布跟踪的是**带标签的版本**（主要和次要版本），而非 `main` 分支上的每次提交。检查更新并升级：

```bash
hermes update --check    # 查看 PyPI 上是否有更新的版本
hermes update            # 运行 pip install --upgrade hermes-agent
```

或手动操作：

```bash
pip install --upgrade hermes-agent    # 或者：uv pip install --upgrade hermes-agent
```

:::提示
`hermes update` 会自动检测新的配置选项并提示您添加它们。如果您跳过了该提示，可以手动运行 `hermes config check` 来查看缺失的选项，然后运行 `hermes config migrate` 进行交互式添加。
:::

### 更新过程中会发生什么（Git 安装）

当您运行 `hermes update` 时，将执行以下步骤：

1.  **配对数据快照** —— 保存一个轻量级的更新前状态快照（涵盖 `~/.hermes/pairing/`、飞书评论规则以及在运行时会被修改的其他状态文件）。可通过[快照和回滚](../user-guide/checkpoints-and-rollback.md)中描述的快照恢复流程进行恢复，或者通过解压 Hermes 写入您 `~/.hermes/` 目录旁的最新快速快照压缩包。
2.  **Git 拉取** —— 从 `main` 分支拉取最新代码并更新子模块
3.  **拉取后语法验证 + 自动回滚** —— 拉取后，Hermes 会编译每个 `hermes` 启动时导入的八个关键文件。如果任何文件解析失败（例如孤立的合并冲突标记、被意外截断的文件），Hermes 会运行 `git reset --hard <pre-pull-sha>` 来将安装回滚，以便您的 shell 保持可启动状态。一旦上游修复发布，请重新运行 `hermes update`。
4.  **依赖项安装** —— 运行 `uv pip install -e ".[all]"` 以获取新的或已更改的依赖项
5.  **配置迁移** —— 检测自您当前版本以来添加的新配置选项，并提示您进行设置
6.  **网关自动重启** —— 更新完成后，正在运行的网关将被刷新，以便新代码立即生效。通过服务管理的网关（Linux 上的 systemd，macOS 上的 launchd）通过服务管理器重启。当 Hermes 可以将正在运行的 PID 映射回一个配置文件时，手动网关将自动重新启动。

### 更新非默认分支：`--branch`

默认情况下，`hermes update` 跟踪 `origin/main`。传递 `--branch <name>` 以针对不同分支进行更新——这对 QA 通道、功能分支或候选版本测试很有用：

```bash
hermes update --branch release-candidate
hermes update --check --branch experimental   # 仅预览落后情况
```

如果您的本地检出位于不同的分支，Hermes 会自动暂存任何未提交的工作，将 HEAD 切换到目标分支，然后拉取。本地不存在的分支会自动从 `origin/<name>` 跟踪（`git checkout -B <name> origin/<name>`）。任何地方都不存在的分支会干净地失败——您的暂存更改会在退出前被恢复，因此您永远不会陷入奇怪的状态。仅限 `main` 分支的上游同步逻辑在非 `main` 分支上会被自动跳过。

### 仅预览：`hermes update --check`

想知道拉取前是否有可用的更新？运行 `hermes update --check` —— 对于 Git 安装，它会获取提交并与 `origin/main` 进行比较；对于 pip 安装，它会查询 PyPI 获取最新版本。不修改任何文件，不重启网关。在脚本和定时任务中根据“是否有更新”来决定是否执行时很有用。

### 完整的更新前备份：`--backup`

对于高价值的配置文件（生产网关、团队共享安装），您可以选择在拉取前对 `HERMES_HOME`（配置、身份验证、会话、技能、配对）进行完整备份：

```bash
hermes update --backup
```

或者将其设置为每次运行的默认行为：

```yaml
# ~/.hermes/config.yaml
updates:
  pre_update_backup: true
```

在早期版本中，`--backup` 是默认启用的行为，但它在大型主目录上为每次更新增加了数分钟时间，因此现在是可选的。上面提到的轻量级配对数据快照仍会无条件运行。

### Windows：另一个 `hermes.exe` 正在运行

在 Windows 上，如果检测到另一个 `hermes.exe` 进程持有 venv 的入口点可执行文件打开，`hermes update` 将拒绝运行——最常见的情况是 Hermes 桌面应用生成的后端、另一个终端中打开的 `hermes` REPL 或正在运行的网关：

```
$ hermes update
✗ 另一个 hermes.exe 正在运行：
    PID 12345  hermes.exe

  现在更新将无法覆盖 ...\venv\Scripts\hermes.exe，因为
  Windows 会阻止对正在运行的可执行文件进行替换。

  在重试之前，请关闭 Hermes 桌面应用，退出任何打开的 `hermes` REPL，并
  停止网关（`hermes gateway stop`）。
  如果您已确认这些进程不会写入 venv，可使用 `hermes update --force` 强制覆盖。
```

关闭列出的进程并重新运行。如果您确定并发进程不会干扰（很少见——通常仅当防病毒软件干扰被误判时有用），请传递 `--force` 以跳过检查。在这种情况下，更新程序仍会以指数退避方式重试 `.exe` 重命名，并且对于顽固的锁，会通过 `MoveFileEx(MOVEFILE_DELAY_UNTIL_REBOOT)` 安排在下次启动时替换，以便更新可以完成。

预期输出如下：

```
$ hermes update
正在更新 Hermes 智能体...
📥 正在拉取最新代码...
已是最新。  （或：正在更新 abc1234..def5678）
📦 正在更新依赖项...
✅ 依赖项已更新
🔍 正在检查新的配置选项...
✅ 配置是最新的  （或：发现 2 个新选项 —— 正在运行迁移...）
🔄 正在重启网关...
✅ 网关已重启
✅ Hermes 智能体更新成功！
```

### 推荐的更新后验证

`hermes update` 处理主要的更新路径，但快速验证可以确认一切正常：

1.  `git status --short` —— 如果工作区意外地不干净，请在继续之前检查
2.  `hermes doctor` —— 检查配置、依赖项和服务健康状况
3.  `hermes --version` —— 确认版本如预期般更新
4.  如果您使用网关：`hermes gateway status`
5.  如果 `doctor` 报告 npm 审计问题：在标记的目录中运行 `npm audit fix`

:::警告 更新后工作区不干净
如果 `hermes update` 之后 `git status --short` 显示意外的更改，请停止并检查它们，然后再继续。这通常意味着本地修改被重新应用到更新后的代码之上，或者依赖项步骤刷新了锁文件。
:::

### 如果您的终端在更新过程中断开连接

`hermes update` 会防止意外终端断开连接：

- 更新过程会忽略 `SIGHUP`，因此关闭您的 SSH 会话或终端窗口不再会在安装过程中终止它。`pip` 和 `git` 子进程继承此保护，因此 Python 环境不会因连接中断而处于半安装状态。
- 更新运行期间，所有输出会同步输出到 `~/.hermes/logs/update.log`。如果您的终端消失，请重新连接并检查日志以查看更新是否完成以及网关重启是否成功：

```bash
tail -f ~/.hermes/logs/update.log
```

- `Ctrl-C` (SIGINT) 和系统关机 (SIGTERM) 仍会被执行——这些是刻意的取消，而非意外。

您不再需要将 `hermes update` 包装在 `screen` 或 `tmux` 中以在终端断开连接后存活。

### 检查当前版本

```bash
hermes version
```

与 [GitHub 发布页面](https://github.com/NousResearch/hermes-agent/releases) 上的最新版本进行比较。

### 从消息平台更新

您也可以直接从 Telegram、Discord、Slack、WhatsApp 或 Teams 发送以下内容进行更新：

```
/update
```

此操作会拉取最新代码、更新依赖项并重启正在运行的网关。机器人将在重启期间短暂离线（通常为 5-15 秒），然后恢复。

### 手动更新

如果您是手动安装（不是通过快速安装程序）：

```bash
cd /path/to/hermes-agent
export VIRTUAL_ENV="$(pwd)/venv"

# 拉取最新代码
git pull origin main

# 重新安装（获取新的依赖项）
uv pip install -e ".[all]"

# 检查新的配置选项
hermes config check
hermes config migrate   # 交互式添加任何缺失的选项
```

### 回滚说明

如果更新引入了问题，您可以回滚到之前的版本：

```bash
cd /path/to/hermes-agent

# 列出最近的版本
git log --oneline -10

# 回滚到特定提交
git checkout <commit-hash>
git submodule update --init --recursive
uv pip install -e ".[all]"

# 如果网关正在运行，请重启它
hermes gateway restart
```

要回滚到特定的发布标签（替换为您之前的标签——例如最近的发布版本 `v2026.5.16`，或来自 `git tag --sort=-version:refname` 的任何早期标签）：

```bash
git checkout vX.Y.Z
git submodule update --init --recursive
uv pip install -e ".[all]"
```

:::警告
如果添加了新选项，回滚可能导致配置不兼容。回滚后请运行 `hermes config check`，如果遇到错误，请从 `config.yaml` 中删除任何无法识别的选项。
:::

### Nix 用户注意事项

如果您通过 Nix flake 安装，更新通过 Nix 包管理器管理：

```bash
# 更新 flake 输入
nix flake update hermes-agent

# 或使用最新版本重建
nix profile upgrade hermes-agent
```

Nix 安装是不可变的——回滚通过 Nix 的生成系统处理：

```bash
nix profile rollback
```

详见 [Nix 设置](./nix-setup.md)。

---

## 卸载

### Git 安装方式

```bash
hermes uninstall
```

卸载程序会提供保留配置文件（`~/.hermes/`）的选项，以便将来重新安装。

### pip 安装方式

```bash
pip uninstall hermes-agent
rm -rf ~/.hermes            # 可选 — 若计划重新安装则保留
```

### 手动卸载

```bash
rm -f ~/.local/bin/hermes
rm -rf /path/to/hermes-agent
rm -rf ~/.hermes            # 可选 — 若计划重新安装则保留
```

:::info
如果将网关作为系统服务安装，请先停止并禁用它：
```bash
hermes gateway stop
# Linux: systemctl --user disable hermes-gateway
# macOS: launchctl remove ai.hermes.gateway
```
:::