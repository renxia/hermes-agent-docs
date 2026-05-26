---
sidebar_position: 3
title: "更新与卸载"
description: "如何将 Hermes 智能体更新至最新版本或将其卸载"
---

# 更新与卸载

## 更新

### Git 安装

使用单一命令更新至最新版本：

```bash
hermes update
```

此命令会从 `main` 分支拉取最新代码，更新依赖项，并提示您配置自上次更新以来新增的选项。

### pip 安装

PyPI 发布版追踪的是**带标签的版本**（主要和次要版本），而非 `main` 分支上的每次提交。检查更新并升级：

```bash
hermes update --check    # 查看 PyPI 上是否有更新版本
hermes update            # 运行 pip install --upgrade hermes-agent
```

或手动操作：

```bash
pip install --upgrade hermes-agent    # 或：uv pip install --upgrade hermes-agent
```

:::tip
`hermes update` 会自动检测新的配置选项并提示您添加。如果您跳过了该提示，可以手动运行 `hermes config check` 来查看缺失的选项，然后运行 `hermes config migrate` 来交互式地添加它们。
:::

### 更新期间发生了什么（Git 安装）

当您运行 `hermes update` 时，将执行以下步骤：

1.  **配对数据快照** —— 保存一个轻量级的预更新状态快照（涵盖 `~/.hermes/pairing/`、飞书评论规则以及其他在运行时会被修改的状态文件）。可通过[快照与回滚](../user-guide/checkpoints-and-rollback.md)中描述的快照恢复流程恢复，或通过解压 Hermes 写入 `~/.hermes/` 目录旁的最新快速快照压缩包。
2.  **Git 拉取** —— 从 `main` 分支拉取最新代码并更新子模块。
3.  **依赖安装** —— 运行 `uv pip install -e ".[all]"` 以获取新增或更改的依赖项。
4.  **配置迁移** —— 检测自您当前版本以来新增的配置选项，并提示您进行设置。
5.  **网关自动重启** —— 更新完成后，运行中的网关将被刷新，使新代码立即生效。由服务管理的网关（Linux 上的 systemd，macOS 上的 launchd）将通过服务管理器重启。当 Hermes 能够将运行中的 PID 映射回配置文件时，手动网关也会自动重新启动。

### 仅预览：`hermes update --check`

想在拉取前知道是否有更新可用？运行 `hermes update --check` —— 对于 Git 安装，它会获取提交并与 `origin/main` 比较；对于 pip 安装，它会查询 PyPI 上的最新版本。不会修改任何文件，也不会重启网关。对于脚本和需要判断“是否有更新”的定时任务非常有用。

### 完整的更新前备份：`--backup`

对于高价值的配置文件（生产环境网关、团队共享安装），您可以选择在拉取前对 `HERMES_HOME`（配置、认证、会话、技能、配对数据）进行完整备份：

```bash
hermes update --backup
```

或将其设置为每次运行的默认行为：

```yaml
# ~/.hermes/config.yaml
updates:
  pre_update_backup: true
```

在早期版本中 `--backup` 是始终开启的行为，但对于大型安装目录，这会为每次更新增加数分钟时间，因此现在需要手动选择启用。上述轻量级的配对数据快照仍然会无条件运行。

### Windows：另一个 `hermes.exe` 正在运行

在 Windows 上，如果 `hermes update` 检测到另一个 `hermes.exe` 进程持有 venv 的入口点可执行文件处于打开状态（最常见的是 Hermes 桌面应用生成的后端、另一个终端中打开的 `hermes` REPL 或正在运行的网关），它将拒绝运行：

```
$ hermes update
✗ 另一个 hermes.exe 正在运行：
    PID 12345  hermes.exe

  现在更新将无法覆盖 ...\venv\Scripts\hermes.exe，因为
  Windows 会阻止对正在运行的可执行文件进行替换。

  请关闭 Hermes 桌面应用，退出任何打开的 `hermes` REPL，并
  停止网关（`hermes gateway stop`）后重试。
  如果您已确认这些进程不会写入 venv，可以使用 `hermes update --force` 覆盖此检查。
```

关闭列出的进程并重新运行。如果您确定并发进程不会干扰（这很少见——通常只在防病毒软件误报时有用），可以传递 `--force` 跳过检查。在这种情况下，更新程序仍将使用指数退避重试重命名 `.exe` 文件，并且对于顽固的锁，会通过 `MoveFileEx(MOVEFILE_DELAY_UNTIL_REBOOT)` 将替换操作安排在下次系统重启时进行，以便更新可以完成。

预期输出如下所示：

```
$ hermes update
正在更新 Hermes 智能体...
📥 正在拉取最新代码...
已经是最新的。  (或：正在更新 abc1234..def5678)
📦 正在更新依赖项...
✅ 依赖项已更新
🔍 正在检查新的配置选项...
✅ 配置是最新的  (或：发现 2 个新选项 —— 正在运行迁移...)
🔄 正在重启网关...
✅ 网关已重启
✅ Hermes 智能体更新成功！
```

### 建议的更新后验证

`hermes update` 处理主要更新路径，但快速验证可以确认一切已正确安装：

1.  `git status --short` —— 如果工作树意外变脏，请在继续前检查。
2.  `hermes doctor` —— 检查配置、依赖项和服务健康状况。
3.  `hermes --version` —— 确认版本已按预期更新。
4.  如果您使用网关：`hermes gateway status`
5.  如果 `doctor` 报告 npm 审计问题：在标记的目录中运行 `npm audit fix`。

:::warning 更新后工作树变脏
如果 `hermes update` 后 `git status --short` 显示意外更改，请在继续前停止并检查它们。这通常意味着本地修改被重新应用到更新后的代码上，或者依赖步骤刷新了锁文件。
:::

### 如果更新期间终端断开连接

`hermes update` 可以防止因意外终端断开而中断：

- 更新过程忽略 `SIGHUP` 信号，因此关闭 SSH 会话或终端窗口不再会在安装中途终止它。`pip` 和 `git` 子进程继承了此保护，因此 Python 环境不会因连接断开而处于半安装状态。
- 更新运行期间，所有输出都会同步写入 `~/.hermes/logs/update.log`。如果您的终端消失，请重新连接并检查日志以查看更新是否完成以及网关重启是否成功：

```bash
tail -f ~/.hermes/logs/update.log
```

- `Ctrl-C` (SIGINT) 和系统关机 (SIGTERM) 仍然会被处理 —— 这些是故意的取消操作，而非意外。

您不再需要将 `hermes update` 包裹在 `screen` 或 `tmux` 中来抵御终端断开。

### 检查当前版本

```bash
hermes version
```

请与 [GitHub 发布页面](https://github.com/NousResearch/hermes-agent/releases) 上的最新版本进行比较。

### 从消息平台更新

您也可以直接从 Telegram、Discord、Slack、WhatsApp 或 Teams 发送以下命令进行更新：

```
/update
```

此命令会拉取最新代码，更新依赖项，并重启运行中的网关。在重启期间，机器人将短暂离线（通常 5-15 秒），然后恢复。

### 手动更新

如果您是手动安装（非通过快速安装程序）：

```bash
cd /path/to/hermes-agent
export VIRTUAL_ENV="$(pwd)/venv"

# 拉取最新代码
git pull origin main

# 重新安装（获取新依赖项）
uv pip install -e ".[all]"

# 检查新的配置选项
hermes config check
hermes config migrate   # 交互式添加任何缺失的选项
```

### 回滚说明

如果更新引入了问题，您可以回滚到以前的版本：

```bash
cd /path/to/hermes-agent

# 列出最近的版本
git log --oneline -10

# 回滚到特定提交
git checkout <commit-hash>
git submodule update --init --recursive
uv pip install -e ".[all]"

# 如果网关正在运行，则重启网关
hermes gateway restart
```

回滚到特定的发布标签：

```bash
git checkout v0.6.0
git submodule update --init --recursive
uv pip install -e ".[all]"
```

:::warning
如果添加了新选项，回滚可能会导致配置不兼容。回滚后请运行 `hermes config check`，如果遇到错误，请从 `config.yaml` 中删除任何无法识别的选项。
:::

### Nix 用户注意事项

如果您通过 Nix flake 安装，更新通过 Nix 包管理器管理：

```bash
# 更新 flake 输入
nix flake update hermes-agent

# 或使用最新版本重建
nix profile upgrade hermes-agent
```

Nix 安装是不可变的 —— 回滚通过 Nix 的代数系统处理：

```bash
nix profile rollback
```

详见 [Nix 设置](./nix-setup.md)。

---

## 卸载

### Git 安装

```bash
hermes uninstall
```

卸载程序会让您选择是否保留配置文件（`~/.hermes/`）以便将来重新安装。

### pip 安装

```bash
pip uninstall hermes-agent
rm -rf ~/.hermes            # 可选 —— 如果计划重新安装则保留
```

### 手动卸载

```bash
rm -f ~/.local/bin/hermes
rm -rf /path/to/hermes-agent
rm -rf ~/.hermes            # 可选 —— 如果计划重新安装则保留
```

:::info
如果您将网关安装为系统服务，请先停止并禁用它：
```bash
hermes gateway stop
# Linux: systemctl --user disable hermes-gateway
# macOS: launchctl remove ai.hermes.gateway
```
:::