---
sidebar_position: 3
title: "更新与卸载"
description: "如何将 Hermes Agent 更新到最新版本或将其卸载"
---

# 更新与卸载

## 更新

使用一条命令即可更新到最新版本：

```bash
hermes update
```

此命令会拉取最新代码，更新依赖项，并提示您配置自上次更新以来新增的任何新选项。

:::tip
`hermes update` 会自动检测新的配置选项并提示您添加它们。如果跳过了该提示，您可以手动运行 `hermes config check` 查看缺失的选项，然后运行 `hermes config migrate` 交互式地添加它们。
:::

### 更新过程中会发生什么

当您运行 `hermes update` 时，将执行以下步骤：

1. **Git pull** — 从 `main` 分支拉取最新代码并更新子模块
2. **依赖安装** — 运行 `uv pip install -e ".[all]"` 以获取新的或更改的依赖项
3. **配置迁移** — 检测自您的版本以来新增的配置选项，并提示您设置它们
4. **网关自动重启** — 如果网关服务正在运行（Linux 上为 systemd，macOS 上为 launchd），则在更新完成后**自动重启**，以便新代码立即生效

预期输出如下所示：

```
$ hermes update
正在更新 Hermes Agent...
📥 拉取最新代码...
已是最新状态。 (或: 正在从 abc1234 更新到 def5678)
📦 正在更新依赖项...
✅ 依赖项已更新
🔍 正在检查新的配置选项...
✅ 配置已是最新状态 (或: 发现 2 个新选项 — 正在运行迁移...)
🔄 正在重启网关服务...
✅ 网关已重启
✅ Hermes Agent 已成功更新！
```

### 推荐的更新后验证

`hermes update` 处理主要更新路径，但快速验证可确认一切正常运行：

1. `git status --short` — 如果工作树意外变脏，请在继续前检查
2. `hermes doctor` — 检查配置、依赖项和服务健康状况
3. `hermes --version` — 确认版本号按预期提升
4. 如果您使用网关：`hermes gateway status`
5. 如果 `doctor` 报告 npm audit 问题：在标记的目录中运行 `npm audit fix`

:::warning 更新后出现脏工作树
如果在 `hermes update` 之后 `git status --short` 显示意外的更改，请停止操作并检查这些更改。这通常意味着本地修改被重新应用到更新后的代码上，或者某个依赖步骤刷新了 lockfile。
:::

### 如果终端在更新中途断开连接

`hermes update` 会保护自己免受意外终端丢失的影响：

- 更新会忽略 `SIGHUP`，因此关闭 SSH 会话或终端窗口不会导致它在安装中途被杀掉。`pip` 和 `git` 的子进程继承此保护，因此 Python 环境不会被断开连接所遗留半安装状态。
- 在更新运行期间，所有输出都会镜像到 `~/.hermes/logs/update.log`。如果您的终端消失，请重新连接并检查日志，以查看更新是否完成以及网关重启是否成功：

```bash
tail -f ~/.hermes/logs/update.log
```

- `Ctrl-C` (SIGINT) 和系统关机 (SIGTERM) 仍然有效——这些是故意的取消操作，而非意外。

您现在无需再将 `hermes update` 包装在 `screen` 或 `tmux` 中以应对终端掉线。

### 检查当前版本

```bash
hermes version
```

与 [GitHub releases 页面](https://github.com/NousResearch/hermes-agent/releases) 上的最新版本进行比较。

### 通过消息平台更新

您也可以直接从 Telegram、Discord、Slack 或 WhatsApp 发送：

```
/update
```

此命令会拉取最新代码，更新依赖项，并重启网关。机器人在重启期间（通常持续 5–15 秒）会短暂离线，然后恢复运行。

### 手动更新

如果您是通过手动方式安装的（非快速安装程序）：

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

如果某次更新引入了问题，您可以回滚到之前的版本：

```bash
cd /path/to/hermes-agent

# 列出最近的版本
git log --oneline -10

# 回滚到特定提交
git checkout <commit-hash>
git submodule update --init --recursive
uv pip install -e ".[all]"

# 如果正在运行，请重启网关
hermes gateway restart
```

要回滚到特定的发布标签：

```bash
git checkout v0.6.0
git submodule update --init --recursive
uv pip install -e ".[all]"
```

:::warning
回滚可能导致配置不兼容，特别是新增了选项的情况下。回滚后请运行 `hermes config check`，如果遇到错误，请从 `config.yaml` 中删除任何无法识别的选项。
:::

### Nix 用户的注意事项

如果您是通过 Nix flake 安装的，更新将通过 Nix 包管理器管理：

```bash
# 更新 flake 输入
nix flake update hermes-agent

# 或使用最新的重建
nix profile upgrade hermes-agent
```

Nix 安装是不可变的——回滚由 Nix 的世代系统处理：

```bash
nix profile rollback
```

更多详情请参阅 [Nix 设置](./nix-setup.md)。

---

## 卸载

```bash
hermes uninstall
```

卸载程序会让您选择是否保留配置文件 (`~/.hermes/`) 以便将来重新安装。

### 手动卸载

```bash
rm -f ~/.local/bin/hermes
rm -rf /path/to/hermes-agent
rm -rf ~/.hermes            # 可选 — 如果您计划重新安装，请保留
```

:::info
如果您已将网关作为系统服务安装，请先停止并禁用它：
```bash
hermes gateway stop
# Linux: systemctl --user disable hermes-gateway
# macOS: launchctl remove ai.hermes.gateway
```
:::