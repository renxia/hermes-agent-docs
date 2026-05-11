---
sidebar_position: 3
title: "更新与卸载"
description: "如何更新 Hermes 智能体到最新版本或卸载它"
---

# 更新与卸载

## 更新

使用单条命令更新到最新版本：

```bash
hermes update
```

这会拉取最新代码，更新依赖项，并提示您配置自上次更新以来添加的任何新选项。

:::提示
`hermes update` 会自动检测新的配置选项并提示您添加它们。如果您跳过了该提示，可以手动运行 `hermes config check` 来查看缺失的选项，然后运行 `hermes config migrate` 以交互方式添加它们。
:::

### 更新期间发生了什么

当您运行 `hermes update` 时，将执行以下步骤：

1.  **配对数据快照** — 保存一个轻量级的预更新状态快照（涵盖 `~/.hermes/pairing/`、飞书评论规则以及其他运行时被修改的状态文件）。可以通过[快照与回滚](../user-guide/checkpoints-and-rollback.md)中描述的快照恢复流程进行恢复，或者通过提取 Hermes 写在 `~/.hermes/` 目录旁边的最新快速快照压缩包来恢复。
2.  **Git 拉取** — 从 `main` 分支拉取最新代码并更新子模块
3.  **依赖安装** — 运行 `uv pip install -e ".[all]"` 以获取新的或更改的依赖项
4.  **配置迁移** — 检测自您的版本以来添加的新配置选项，并提示您进行设置
5.  **网关自动重启** — 更新完成后，正在运行的网关会自动刷新，以便新代码立即生效。由服务管理的网关（Linux 上的 systemd，macOS 上的 launchd）通过服务管理器重启。当 Hermes 可以将运行的 PID 映射回配置文件时，手动网关将自动重新启动。

### 仅预览：`hermes update --check`

想在实际拉取之前了解您是否落后于 `origin/main` 吗？运行 `hermes update --check` — 它会获取信息，并排打印您的本地提交和最新的远程提交，如果同步则退出代码为 `0`，如果落后则为 `1`。不修改任何文件，不重启网关。在依赖于“是否有更新”的脚本和 cron 作业中很有用。

### 完整的预更新备份：`--backup`

对于高价值配置文件（生产网关、共享团队安装），您可以选择在拉取前对 `HERMES_HOME`（配置、认证、会话、技能、配对）进行完整备份：

```bash
hermes update --backup
```

或者将其设为每次运行的默认行为：

```yaml
# ~/.hermes/config.yaml
updates:
  pre_update_backup: true
```

`--backup` 在早期版本中是始终启用的行为，但它在大型 home 目录上每次更新都会增加几分钟时间，所以现在是可选加入的。上述轻量级配对数据快照仍然会无条件运行。

预期输出如下所示：

```
$ hermes update
正在更新 Hermes 智能体...
📥 正在拉取最新代码...
已经是最新的。 (或: 正在更新 abc1234..def5678)
📦 正在更新依赖项...
✅ 依赖项已更新
🔍 正在检查新的配置选项...
✅ 配置是最新的 (或: 发现 2 个新选项 — 正在运行迁移...)
🔄 正在重启网关...
✅ 网关已重启
✅ Hermes 智能体更新成功!
```

### 推荐的更新后验证

`hermes update` 处理了主要的更新路径，但一个快速验证可以确认一切顺利落地：

1.  `git status --short` — 如果工作树意外地不干净，在继续之前检查一下
2.  `hermes doctor` — 检查配置、依赖项和服务健康状况
3.  `hermes --version` — 确认版本已如预期般更新
4.  如果您使用网关：`hermes gateway status`
5.  如果 `doctor` 报告了 npm 审计问题：在指定的目录中运行 `npm audit fix`

:::警告 更新后工作树不干净
如果在 `hermes update` 后 `git status --short` 显示意外的更改，请在继续之前停止并检查它们。这通常意味着本地修改被重新应用到更新的代码之上，或者依赖项步骤刷新了锁文件。
:::

### 如果更新期间终端断开连接

`hermes update` 会保护自身免受意外终端丢失的影响：

-   更新过程会忽略 `SIGHUP`，因此关闭您的 SSH 会话或终端窗口不会在安装过程中途终止它。`pip` 和 `git` 子进程会继承此保护，因此 Python 环境不会因连接中断而处于半安装状态。
-   更新运行期间，所有输出都会同步到 `~/.hermes/logs/update.log`。如果您的终端断开，重新连接并检查日志以查看更新是否完成以及网关重启是否成功：

```bash
tail -f ~/.hermes/logs/update.log
```

-   `Ctrl-C` (SIGINT) 和系统关机 (SIGTERM) 仍然会被响应 — 那些是刻意的取消，而非意外。

您不再需要将 `hermes update` 包装在 `screen` 或 `tmux` 中来应对终端断开。

### 检查当前版本

```bash
hermes version
```

与 [GitHub 发布页面](https://github.com/NousResearch/hermes-agent/releases)上的最新版本进行比较。

### 从消息平台更新

您也可以通过从 Telegram、Discord、Slack、WhatsApp 或 Teams 发送以下命令直接更新：

```
/update
```

这会拉取最新代码，更新依赖项，并重启正在运行的网关。在重启期间（通常 5-15 秒），机器人将短暂下线，然后恢复运行。

### 手动更新

如果您是手动安装的（不是通过快速安装程序）：

```bash
cd /path/to/hermes-agent
export VIRTUAL_ENV="$(pwd)/venv"

# 拉取最新代码和子模块
git pull origin main
git submodule update --init --recursive

# 重新安装（获取新依赖项）
uv pip install -e ".[all]"
uv pip install -e "./tinker-atropos"

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

# 回滚到特定的提交
git checkout <commit-hash>
git submodule update --init --recursive
uv pip install -e ".[all]"

# 如果正在运行，则重启网关
hermes gateway restart
```

要回滚到特定的发布标签：

```bash
git checkout v0.6.0
git submodule update --init --recursive
uv pip install -e ".[all]"
```

:::警告
如果添加了新选项，回滚可能会导致配置不兼容。回滚后运行 `hermes config check`，如果遇到错误，请从 `config.yaml` 中删除任何无法识别的选项。
:::

### Nix 用户须知

如果您通过 Nix flake 安装，更新通过 Nix 包管理器管理：

```bash
# 更新 flake 输入
nix flake update hermes-agent

# 或使用最新版本重新构建
nix profile upgrade hermes-agent
```

Nix 安装是不可变的 — 回滚由 Nix 的代数系统处理：

```bash
nix profile rollback
```

更多详情请参见 [Nix 安装](./nix-setup.md)。

---

## 卸载

```bash
hermes uninstall
```

卸载程序会为您提供保留配置文件 (`~/.hermes/`) 以供将来重新安装的选项。

### 手动卸载

```bash
rm -f ~/.local/bin/hermes
rm -rf /path/to/hermes-agent
rm -rf ~/.hermes            # 可选 — 如果您计划重新安装，请保留
```

:::信息
如果您将网关作为系统服务安装，请先停止并禁用它：
```bash
hermes gateway stop
# Linux: systemctl --user disable hermes-gateway
# macOS: launchctl remove ai.hermes.gateway
```
:::