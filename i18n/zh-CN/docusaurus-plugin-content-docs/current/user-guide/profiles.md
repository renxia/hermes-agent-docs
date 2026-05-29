---
sidebar_position: 2
---

# 配置文件：运行多个智能体

在同一台机器上运行多个独立的 Hermes 智能体——每个智能体都有自己的配置、API 密钥、记忆、会话、技能和网关状态。

## 什么是配置文件？

一个配置文件就是一个独立的 Hermes 主目录。每个配置文件拥有自己的目录，包含其独立的 `config.yaml`、`.env`、`SOUL.md`、记忆、会话、技能、定时任务和状态数据库。配置文件允许你为不同目的运行独立的智能体——比如一个编程助手、一个个人机器人、一个研究智能体——而不会混淆 Hermes 的状态。

当你创建一个配置文件时，它会自动成为一个独立的命令。创建一个名为 `coder` 的配置文件，你立刻就拥有了 `coder chat`、`coder setup`、`coder gateway start` 等命令。

## 快速开始

```bash
hermes profile create coder       # 创建配置文件并设置 "coder" 命令别名
coder setup                       # 配置 API 密钥和模型
coder chat                        # 开始聊天
```

就这样。`coder` 现在成为了它自己的 Hermes 配置文件，拥有自己的配置、记忆和状态。

## 创建配置文件

:::tip
最快设置方法：在新配置文件中运行 `hermes setup --portal` 来一次性配置模型和工具。参见 [Nous Portal](/integrations/nous-portal)。
:::

### 空白配置文件

```bash
hermes profile create mybot
```

创建一个包含内置技能种子的全新配置文件。运行 `mybot setup` 来配置 API 密钥、模型和网关令牌。

如果您计划将此配置文件用作看板工作者（或希望看板编排器将工作路由到它），请在创建时传递 `--description "<角色>"`，以便编排器了解其擅长什么：

```bash
hermes profile create researcher --description "阅读源代码和外部文档，撰写发现报告。"
```

您也可以稍后通过 `hermes profile describe` 设置或自动生成描述 —— 请参阅 [看板指南](./features/kanban#auto-vs-manual-orchestration) 了解完整的路由模型。

### 仅克隆配置 (`--clone`)

```bash
hermes profile create work --clone
```

将您当前配置文件的 `config.yaml`、`.env` 和 `SOUL.md` 复制到新配置文件中。使用相同的 API 密钥和模型，但会话和记忆是全新的。编辑 `~/.hermes/profiles/work/.env` 以使用不同的 API 密钥，或编辑 `~/.hermes/profiles/work/SOUL.md` 以使用不同的个性。

### 克隆所有内容 (`--clone-all`)

```bash
hermes profile create backup --clone-all
```

复制**所有内容** —— 配置、API 密钥、个性、所有记忆、完整会话历史、技能、定时任务、插件。一个完整的快照。对于备份或复制已有上下文的智能体很有用。

### 从特定配置文件克隆

```bash
hermes profile create work --clone --clone-from coder
```

:::tip Honcho 记忆 + 配置文件
当启用 Honcho 时，`--clone` 会自动为新配置文件创建一个专用的 AI 对等体，同时共享相同的用户工作区。每个配置文件都会建立自己的观察和身份。详情请参见 [Honcho -- 多智能体 / 配置文件](./features/memory-providers.md#honcho)。
:::

## 使用配置文件

### 命令别名

每个配置文件都会自动在 `~/.local/bin/<名称>` 获得一个命令别名：

```bash
coder chat                    # 与 coder 智能体聊天
coder setup                   # 配置 coder 的设置
coder gateway start           # 启动 coder 的网关
coder doctor                  # 检查 coder 的健康状态
coder skills list             # 列出 coder 的技能
coder config set model.default anthropic/claude-sonnet-4
```

该别名适用于所有 hermes 子命令 —— 底层实现就是 `hermes -p <名称>`。

### `-p` 标志

您也可以通过任何命令显式指定配置文件：

```bash
hermes -p coder chat
hermes --profile=coder doctor
hermes chat -p coder -q "hello"    # 可在任意位置使用
```

### 粘性默认值 (`hermes profile use`)

```bash
hermes profile use coder
hermes chat                   # 现在指向 coder
hermes tools                  # 配置 coder 的工具
hermes profile use default    # 切换回来
```

设置一个默认值，以便普通的 `hermes` 命令指向该配置文件。类似于 `kubectl config use-context`。

### 知道您在哪里

CLI 总是显示当前活动的配置文件：

- **提示符**：`coder ❯` 而不是 `❯`
- **横幅**：启动时显示 `Profile: coder`
- **`hermes profile`**：显示当前配置文件名称、路径、模型、网关状态

## 配置文件 vs 工作空间 vs 沙箱

配置文件常与工作空间或沙箱混淆，但它们是不同的东西：

- **配置文件**为 Hermes 提供自己的状态目录：`config.yaml`、`.env`、`SOUL.md`、会话、记忆、日志、定时任务和网关状态。
- **工作空间**或**工作目录**是终端命令启动的位置。这由 `terminal.cwd` 单独控制。
- **沙箱**用于限制文件系统访问。配置文件**不会**沙箱化智能体。

在默认的 `local` 终端后端上，智能体仍然拥有与您的用户账户相同的文件系统访问权限。配置文件不会阻止它访问配置文件目录之外的文件夹。

如果您希望配置文件在特定的项目文件夹中启动，请在该配置文件的 `config.yaml` 中设置一个显式的绝对路径 `terminal.cwd`：

```yaml
terminal:
  backend: local
  cwd: /absolute/path/to/project
```

在本地后端上使用 `cwd: "."` 意味着 "Hermes 启动时的目录"，而不是 "配置文件目录"。

另请注意：

- `SOUL.md` 可以引导模型，但它不会强制执行工作空间边界。
- 对 `SOUL.md` 的更改会在新会话中干净地生效。现有会话可能仍在使用旧的提示状态。
- 询问模型 "你在哪个目录？" 并不是一个可靠的隔离测试。如果您需要工具可预测的起始目录，请显式设置 `terminal.cwd`。

## 运行网关

每个配置文件都作为独立的进程运行自己的网关，并拥有自己的机器人令牌：

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

### 安全性：令牌锁定

如果两个配置文件意外使用了相同的机器人令牌，第二个网关将被阻塞，并显示一个明确的错误信息，指出冲突的配置文件。支持 Telegram、Discord、Slack、WhatsApp 和 Signal。

### 持久化服务

```bash
coder gateway install         # 创建 hermes-gateway-coder systemd/launchd 服务
assistant gateway install     # 创建 hermes-gateway-assistant 服务
```

每个配置文件获得自己的服务名称。它们独立运行。

:::note 在官方 Docker 镜像内
每个配置文件的网关由 [s6-overlay](https://github.com/just-containers/s6-overlay)（容器中的 PID 1）监督，因此 `hermes profile create <名称>` 会自动在 `/run/service/gateway-<名称>/` 注册一个 s6 服务槽位。`hermes -p <名称> gateway start/stop/restart` 会调度到 `s6-svc` 而不是启动一个裸进程 —— 崩溃会被自动重启，并且 `docker restart` 会保留先前运行的网关集合。详情请参见 [每个配置文件的网关监督](/user-guide/docker#per-profile-gateway-supervision)。
:::

## 配置配置文件

每个配置文件都有自己的：

- **`config.yaml`** —— 模型、提供商、工具集、所有设置
- **`.env`** —— API 密钥、机器人令牌
- **`SOUL.md`** —— 个性和指令

```bash
coder config set model.default anthropic/claude-sonnet-4
echo "You are a focused coding assistant." > ~/.hermes/profiles/coder/SOUL.md
```

如果您希望此配置文件默认在特定项目中工作，还需设置其自己的 `terminal.cwd`：

```bash
coder config set terminal.cwd /absolute/path/to/project
```

## 更新

`hermes update` 会拉取一次代码（共享）并自动将新的内置技能同步到**所有**配置文件：

```bash
hermes update
# → 代码已更新（12 个提交）
# → 技能已同步：default（最新），coder（+2 个新技能），assistant（+2 个新技能）
```

用户修改过的技能永远不会被覆盖。

## 管理配置文件

```bash
hermes profile list           # 显示所有配置文件及其状态
hermes profile show coder     # 显示一个配置文件的详细信息
hermes profile rename coder dev-bot   # 重命名（更新别名 + 服务）
hermes profile export coder   # 导出到 coder.tar.gz
hermes profile import coder.tar.gz   # 从归档文件导入
```

## 删除配置文件

```bash
hermes profile delete coder
```

这将停止网关，移除 systemd/launchd 服务，移除命令别名，并删除所有配置文件数据。系统会要求您输入配置文件名称以确认。

使用 `--yes` 跳过确认：`hermes profile delete coder --yes`

:::note
您不能删除默认配置文件（`~/.hermes`）。要删除所有内容，请使用 `hermes uninstall`。
:::

## 自动补全

```bash
# Bash
eval "$(hermes completion bash)"

# Zsh
eval "$(hermes completion zsh)"
```

将该行添加到您的 `~/.bashrc` 或 `~/.zshrc` 中以获得持久的自动补全。可以在 `-p` 之后补全配置文件名称、配置文件子命令和顶层命令。

## 工作原理

配置文件使用 `HERMES_HOME` 环境变量。当您运行 `coder chat` 时，包装器脚本会在启动 hermes 之前设置 `HERMES_HOME=~/.hermes/profiles/coder`。由于代码库中有 119 个以上的文件通过 `get_hermes_home()` 解析路径，Hermes 状态会自动限定到配置文件的目录 —— 配置、会话、记忆、技能、状态数据库、网关 PID、日志和定时任务。

这与终端工作目录是分开的。工具执行从 `terminal.cwd`（或在本地后端上使用 `cwd: "."` 时从启动目录）开始，而不是自动从 `HERMES_HOME` 开始。

默认配置文件就是 `~/.hermes` 本身。无需迁移 —— 现有安装的工作方式完全相同。

## 将配置文件作为发行版共享

您在一台机器上构建的配置文件可以打包成一个 **git 仓库**，并在另一台机器上通过一条命令安装 —— 您自己的工作站、队友的笔记本电脑或社区用户的环境。共享的包包括 SOUL、配置、技能、定时任务和 MCP 连接。凭据、记忆和会话按机器保留。

```bash
# 从 git 仓库安装一个完整的智能体
hermes profile install github.com/you/research-bot --alias

# 之后当作者发布新版本时更新（保留您的记忆 + .env）
hermes profile update research-bot
```

有关完整指南 —— 创作、发布、更新语义、安全模型和用例，请参见 **[配置文件发行版：共享一个完整的智能体](./profile-distributions.md)**。