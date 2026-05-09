---
sidebar_position: 2
---

# 配置文件：运行多个智能体

在同一台机器上运行多个独立的 Hermes 智能体 —— 每个智能体拥有各自的配置、API 密钥、记忆、会话、技能和网关状态。

## 什么是配置文件？

配置文件是一个独立的 Hermes 主目录。每个配置文件都会获得一个包含其自身 `config.yaml`、`.env`、`SOUL.md`、记忆、会话、技能、定时任务和状态数据库的目录。配置文件让你可以为不同目的运行独立的智能体 —— 例如编码助手、个人机器人或研究智能体 —— 而不会混淆 Hermes 的状态。

当你创建一个配置文件时，它会自动成为一个独立的命令。创建一个名为 `coder` 的配置文件后，你立刻就可以使用 `coder chat`、`coder setup`、`coder gateway start` 等命令。

## 快速开始

```bash
hermes profile create coder       # 创建配置文件 + “coder”命令别名
coder setup                       # 配置 API 密钥和模型
coder chat                        # 开始聊天
```

就是这样。`coder` 现在是一个拥有独立配置、记忆和状态的 Hermes 配置文件。

## 创建配置文件

### 空白配置文件

```bash
hermes profile create mybot
```

创建一个带有预置技能的新鲜配置文件。运行 `mybot setup` 来配置 API 密钥、模型和网关令牌。

### 仅克隆配置（`--clone`）

```bash
hermes profile create work --clone
```

将当前配置文件的 `config.yaml`、`.env` 和 `SOUL.md` 复制到新配置文件中。使用相同的 API 密钥和模型，但会话和记忆是全新的。编辑 `~/.hermes/profiles/work/.env` 以使用不同的 API 密钥，或编辑 `~/.hermes/profiles/work/SOUL.md` 以设置不同的个性。

### 克隆所有内容（`--clone-all`）

```bash
hermes profile create backup --clone-all
```

复制**所有内容** —— 配置、API 密钥、个性、所有记忆、完整会话历史、技能、定时任务、插件。这是一个完整的快照。适用于备份或基于已有上下文的智能体进行分叉。

### 从特定配置文件克隆

```bash
hermes profile create work --clone --clone-from coder
```

:::tip Honcho 记忆 + 配置文件
启用 Honcho 时，`--clone` 会自动为新配置文件创建一个专用的 AI 对等体，同时共享相同的用户工作区。每个配置文件会构建自己的观察和身份。详情请参阅 [Honcho —— 多智能体 / 配置文件](./features/memory-providers.md#honcho)。
:::

## 使用配置文件

### 命令别名

每个配置文件都会在 `~/.local/bin/<name>` 自动获得一个命令别名：

```bash
coder chat                    # 与 coder 智能体聊天
coder setup                   # 配置 coder 的设置
coder gateway start           # 启动 coder 的网关
coder doctor                  # 检查 coder 的健康状况
coder skills list             # 列出 coder 的技能
coder config set model.default anthropic/claude-sonnet-4
```

该别名适用于所有 hermes 子命令 —— 实际上就是 `hermes -p <name>`。

### `-p` 标志

你也可以在任何命令中显式指定目标配置文件：

```bash
hermes -p coder chat
hermes --profile=coder doctor
hermes chat -p coder -q "hello"    # 可在任意位置使用
```

### 粘性默认值（`hermes profile use`）

```bash
hermes profile use coder
hermes chat                   # 现在目标为 coder
hermes tools                  # 配置 coder 的工具
hermes profile use default    # 切换回来
```

设置一个默认值，使得普通的 `hermes` 命令以该配置文件为目标。类似于 `kubectl config use-context`。

### 知道你当前所处的位置

CLI 始终会显示哪个配置文件处于活动状态：

- **提示符**：显示 `coder ❯` 而非 `❯`
- **横幅**：启动时显示 `Profile: coder`
- **`hermes profile`**：显示当前配置文件名称、路径、模型、网关状态

## 配置文件 vs 工作区 vs 沙箱

配置文件常与工作区或沙箱混淆，但它们是不同的概念：

- **配置文件**为 Hermes 提供其独立的状态目录：`config.yaml`、`.env`、`SOUL.md`、会话、记忆、日志、定时任务和网关状态。
- **工作区**或**工作目录**是终端命令启动的位置。这由 `terminal.cwd` 单独控制。
- **沙箱**用于限制文件系统访问。配置文件**不会**对智能体进行沙箱隔离。

在默认的 `local` 终端后端上，智能体仍然拥有与你的用户账户相同的文件系统访问权限。配置文件不会阻止它访问配置文件目录之外的文件夹。

如果你希望某个配置文件默认在特定项目文件夹中启动，请在该配置文件的 `config.yaml` 中设置一个显式的绝对路径 `terminal.cwd`：

```yaml
terminal:
  backend: local
  cwd: /absolute/path/to/project
```

在本地后端上使用 `cwd: "."` 表示“Hermes 启动时所在的目录”，而非“配置文件目录”。

另请注意：

- `SOUL.md` 可以引导模型，但不会强制执行工作区边界。
- 对 `SOUL.md` 的更改会在新会话中干净地生效。现有会话可能仍在使用旧的提示状态。
- 询问模型“你在哪个目录？”并不是一个可靠的隔离测试。如果你需要工具具有可预测的起始目录，请显式设置 `terminal.cwd`。

## 运行网关

每个配置文件都会以其自身的机器人令牌作为独立进程运行自己的网关：

```bash
coder gateway start           # 启动 coder 的网关
assistant gateway start       # 启动 assistant 的网关（独立进程）
```

### 不同的机器人令牌

每个配置文件都有自己的 `.env` 文件。在每个文件中配置不同的 Telegram/Discord/Slack 机器人令牌：

```bash
# 编辑 coder 的令牌
nano ~/.hermes/profiles/coder/.env

# 编辑 assistant 的令牌
nano ~/.hermes/profiles/assistant/.env
```

### 安全性：令牌锁

如果两个配置文件意外使用了相同的机器人令牌，第二个网关将被阻止，并显示一个明确指出冲突配置文件的错误。支持 Telegram、Discord、Slack、WhatsApp 和 Signal。

### 持久化服务

```bash
coder gateway install         # 创建 hermes-gateway-coder systemd/launchd 服务
assistant gateway install     # 创建 hermes-gateway-assistant 服务
```

每个配置文件都会获得其自身的服务名称。它们独立运行。

## 配置配置文件

每个配置文件都有自己的：

- **`config.yaml`** —— 模型、提供商、工具集、所有设置
- **`.env`** —— API 密钥、机器人令牌
- **`SOUL.md`** —— 个性和指令

```bash
coder config set model.default anthropic/claude-sonnet-4
echo "You are a focused coding assistant." > ~/.hermes/profiles/coder/SOUL.md
```

如果你希望此配置文件默认在特定项目中工作，还请设置其自身的 `terminal.cwd`：

```bash
coder config set terminal.cwd /absolute/path/to/project
```

## 更新

`hermes update` 会拉取一次代码（共享），并自动将新的捆绑技能同步到**所有**配置文件：

```bash
hermes update
# → 代码已更新（12 次提交）
# → 技能已同步：default（最新），coder（+2 个新技能），assistant（+2 个新技能）
```

用户修改过的技能永远不会被覆盖。

## 管理配置文件

```bash
hermes profile list           # 显示所有配置文件及其状态
hermes profile show coder     # 显示一个配置文件的详细信息
hermes profile rename coder dev-bot   # 重命名（更新别名 + 服务）
hermes profile export coder   # 导出为 coder.tar.gz
hermes profile import coder.tar.gz   # 从归档导入
```

## 删除配置文件

```bash
hermes profile delete coder
```

这会停止网关，移除 systemd/launchd 服务，移除命令别名，并删除所有配置文件数据。系统会要求你输入配置文件名称以确认。

使用 `--yes` 可跳过确认：`hermes profile delete coder --yes`

:::note
你无法删除默认配置文件（`~/.hermes`）。要删除所有内容，请使用 `hermes uninstall`。
:::

## 制表符补全

```bash
# Bash
eval "$(hermes completion bash)"

# Zsh
eval "$(hermes completion zsh)"
```

将该行添加到你的 `~/.bashrc` 或 `~/.zshrc` 中，以实现持久化补全。可在 `-p` 后补全配置文件名称、配置文件子命令以及顶级命令。

## 工作原理

配置文件使用 `HERMES_HOME` 环境变量。当你运行 `coder chat` 时，包装脚本会在启动 hermes 之前设置 `HERMES_HOME=~/.hermes/profiles/coder`。由于代码库中 119+ 个文件通过 `get_hermes_home()` 解析路径，Hermes 状态会自动限定在配置文件的目录范围内 —— 包括配置、会话、记忆、技能、状态数据库、网关 PID、日志和定时任务。

这与终端工作目录是分开的。工具执行从 `terminal.cwd` 启动（或在本地后端上 `cwd: "."` 时从启动目录启动），而非自动从 `HERMES_HOME` 启动。

默认配置文件就是 `~/.hermes` 本身。无需迁移 —— 现有安装完全相同地工作。

## 将配置文件作为发行版共享

你在一台机器上构建的配置文件可以打包为一个 **git 仓库**，并通过一条命令安装到另一台机器上 —— 无论是你自己的工作站、队友的笔记本电脑，还是社区用户的环境。共享包包含 SOUL、配置、技能、定时任务和 MCP 连接。凭据、记忆和会话则每台机器各自保留。

```bash
# 从 git 仓库安装整个智能体
hermes profile install github.com/you/research-bot --alias

# 当作者发布新版本时稍后更新（保留你的记忆 + .env）
hermes profile update research-bot
```

请参阅 **[配置文件发行版：共享整个智能体](./profile-distributions.md)** 获取完整指南 —— 包括创作、发布、更新语义、安全模型和使用案例。