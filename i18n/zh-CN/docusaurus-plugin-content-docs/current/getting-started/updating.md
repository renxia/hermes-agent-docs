---
sidebar_position: 3
title: "更新与卸载"
description: "如何将 Hermes 智能体更新到最新版本或将其卸载"
---

# 更新与卸载

## 更新

使用单个命令即可更新至最新版本：

```bash
hermes update
```

此操作会拉取最新代码、更新依赖项，并提示您配置自上次更新以来新增的任何选项。

:::tip
`hermes update` 会自动检测新的配置选项并提示您添加它们。如果您跳过了该提示，可以手动运行 `hermes config check` 查看缺失的选项，然后运行 `hermes config migrate` 以交互式方式添加它们。
:::

### 更新过程中会发生什么

当您运行 `hermes update` 时，将执行以下步骤：

1. **配对数据快照** — 保存一个轻量级的更新前状态快照（涵盖 `~/.hermes/pairing/`、飞书评论规则以及其他在运行时会被修改的状态文件）。可通过 `hermes backup restore --state pre-update` 回滚。
2. **Git 拉取** — 从 `main` 分支拉取最新代码并更新子模块
3. **依赖项安装** — 运行 `uv pip install -e ".[all]"` 以获取新增或变更的依赖项
4. **配置迁移** — 检测自您当前版本以来新增的配置选项，并提示您进行设置
5. **网关自动重启** — 更新完成后，正在运行的网关会被刷新，以便新代码立即生效。由服务管理的网关（Linux 上的 systemd、macOS 上的 launchd）会通过服务管理器重启。手动启动的网关会在 Hermes 能够将运行中的 PID 映射回对应配置文件时自动重新启动。

### 仅预览：`hermes update --check`

想在实际拉取代码之前知道自己是否落后于 `origin/main` 吗？运行 `hermes update --check` — 它会获取远程信息，并排打印本地提交和最新的远程提交，如果同步则退出码为 `0`，如果落后则退出码为 `1`。不会修改任何文件，也不会重启网关。适用于依赖“是否有更新”这一条件的脚本和定时任务。

### 完整更新前备份：`--backup`

对于高价值配置文件（生产环境网关、团队共享安装），您可以选择对 `HERMES_HOME`（配置、认证、会话、技能、配对数据）进行完整的更新前备份：

```bash
hermes update --backup
```

或将其设为每次运行的默认行为：

```yaml
# ~/.hermes/config.yaml
update:
  backup: true
```

`--backup` 在早期构建中是默认开启的行为，但在大型主目录下每次更新都会增加数分钟时间，因此现在改为可选。上述轻量级配对数据快照仍会无条件执行。

预期输出如下：

```
$ hermes update
正在更新 Hermes 智能体...
📥 拉取最新代码...
已是最新。  （或：正在更新 abc1234..def5678）
📦 更新依赖项...
✅ 依赖项已更新
🔍 检查新配置选项...
✅ 配置已是最新  （或：发现 2 个新选项 — 正在运行迁移...）
🔄 重启网关...
✅ 网关已重启
✅ Hermes 智能体更新成功！
```

### 推荐的更新后验证

`hermes update` 处理了主要的更新流程，但快速验证可确认一切是否顺利生效：

1. `git status --short` — 如果工作树意外变脏，请在继续之前进行检查
2. `hermes doctor` — 检查配置、依赖项和服务健康状况
3. `hermes --version` — 确认版本已按预期升级
4. 如果您使用网关：`hermes gateway status`
5. 如果 `doctor` 报告 npm 审计问题：在标记的目录中运行 `npm audit fix`

:::warning 更新后工作树变脏
如果 `hermes update` 执行后 `git status --short` 显示意外变更，请停止并检查这些变更后再继续。这通常意味着本地修改被重新应用到了更新后的代码之上，或者某个依赖项步骤刷新了锁文件。
:::

### 如果终端在更新过程中断开连接

`hermes update` 可防止因意外丢失终端而导致中断：

- 更新过程会忽略 `SIGHUP` 信号，因此关闭 SSH 会话或终端窗口不会再导致安装中途被杀掉。`pip` 和 `git` 子进程继承此保护机制，因此即使连接断开，Python 环境也不会处于半安装状态。
- 所有输出都会镜像到 `~/.hermes/logs/update.log` 中。如果您的终端消失，请重新连接并检查日志，以确认更新是否完成以及网关重启是否成功：

```bash
tail -f ~/.hermes/logs/update.log
```

- `Ctrl-C` (SIGINT) 和系统关机 (SIGTERM) 仍会被正常处理 — 这些是故意取消操作，而非意外。

您不再需要将 `hermes update` 包装在 `screen` 或 `tmux` 中以避免终端断开造成的影响。

### 检查当前版本

```bash
hermes version
```

请与 [GitHub 发布页面](https://github.com/NousResearch/hermes-agent/releases) 上的最新版本进行比较。

### 从消息平台更新

您也可以直接从 Telegram、Discord、Slack、WhatsApp 或 Teams 发送以下命令来更新：

```
/update
```

此操作会拉取最新代码、更新依赖项并重启正在运行的网关。机器人会在重启期间短暂离线（通常 5–15 秒），然后恢复运行。

### 手动更新

如果您是手动安装的（而非通过快速安装程序）：

```bash
cd /path/to/hermes-agent
export VIRTUAL_ENV="$(pwd)/venv"

# 拉取最新代码和子模块
git pull origin main
git submodule update --init --recursive

# 重新安装（获取新依赖项）
uv pip install -e ".[all]"
uv pip install -e "./tinker-atropos"

# 检查新配置选项
hermes config check
hermes config migrate   # 交互式添加任何缺失的选项
```

### 回滚说明

如果更新引入了问题，您可以回滚到之前的版本：

```bash
cd /path/to/hermes-agent

# 列出最近版本
git log --oneline -10

# 回滚到特定提交
git checkout <commit-hash>
git submodule update --init --recursive
uv pip install -e ".[all]"

# 如果网关正在运行，请重启
hermes gateway restart
```

要回滚到特定发布标签：

```bash
git checkout v0.6.0
git submodule update --init --recursive
uv pip install -e ".[all]"
```

:::warning
如果新增过配置选项，回滚可能导致配置不兼容。请在回滚后运行 `hermes config check`，如果遇到错误，请从 `config.yaml` 中移除任何无法识别的选项。
:::

### Nix 用户注意事项

如果您是通过 Nix flake 安装的，则更新由 Nix 包管理器管理：

```bash
# 更新 flake 输入
nix flake update hermes-agent

# 或使用最新版本重建
nix profile upgrade hermes-agent
```

Nix 安装是不可变的 — 回滚由 Nix 的生成系统处理：

```bash
nix profile rollback
```

更多详情请参阅 [Nix 设置](./nix-setup.md)。

---

## 卸载

```bash
hermes uninstall
```

卸载程序会提供保留配置文件 (`~/.hermes/`) 的选项，以便将来重新安装时使用。

### 手动卸载

```bash
rm -f ~/.local/bin/hermes
rm -rf /path/to/hermes-agent
rm -rf ~/.hermes            # 可选 — 如果计划重新安装，请保留
```

:::info
如果您已将网关安装为系统服务，请先停止并禁用它：
```bash
hermes gateway stop
# Linux: systemctl --user disable hermes-gateway
# macOS: launchctl remove ai.hermes.gateway
```
:::