---
sidebar_position: 2
---

# 配置文件：运行多个代理

在同一台机器上运行多个独立的 Hermes 代理，每个代理都有自己独立的配置、API 密钥、内存、会话、技能和服务网关状态。

## 什么是配置文件？

配置文件是一个独立的 Hermes 主目录。每个配置文件都会获得一个专属目录，其中包含自己的 `config.yaml`、`.env`、`SOUL.md`、记忆、会话、技能、计划任务和状态数据库。配置文件让你可以为不同用途运行独立的代理——比如编程助手、个人机器人、研究代理等，而不会混淆 Hermes 的状态。

创建配置文件后，它会自动成为一个独立的命令。创建一个名为 `coder` 的配置文件后，你立即就可以使用 `coder chat`、`coder setup`、`coder gateway start` 等命令。

## 快速开始

```bash
hermes profile create coder       # 创建配置文件 + "coder" 命令别名
coder setup                       # 配置 API 密钥和模型
coder chat                        # 开始对话
```

就这样。`coder` 现在已经成为一个拥有自己配置、记忆和状态的独立 Hermes 配置文件。

## 创建配置文件

### 空白配置文件

```bash
hermes profile create mybot
```

创建一个带有捆绑技能的新配置文件。运行 `mybot setup` 来配置 API 密钥、模型和网关令牌。

### 仅克隆配置（`--clone`）

```bash
hermes profile create work --clone
```

将当前配置文件的 `config.yaml`、`.env` 和 `SOUL.md` 复制到新配置文件。API 密钥和模型相同，但会话和记忆是全新的。编辑 `~/.hermes/profiles/work/.env` 设置不同的 API 密钥，或编辑 `~/.hermes/profiles/work/SOUL.md` 设置不同的个性。

### 克隆所有内容（`--clone-all`）

```bash
hermes profile create backup --clone-all
```

复制**所有内容**——配置、API 密钥、个性、所有记忆、完整的会话历史、技能、计划任务、插件。这是一个完整快照。适用于备份或分叉一个已有上下文的代理。

### 从特定配置文件克隆

```bash
hermes profile create work --clone --clone-from coder
```

:::tip Honcho 记忆 + 配置文件
当启用 Honcho 时，`--clone` 会自动为新的配置文件创建一个专用的 AI 同伴，同时共享相同的工作区。每个配置文件构建自己的观察结果和身份。详情参见 [Honcho -- 多代理 / 配置文件](./features/memory-providers.md#honcho)。
:::

## 使用配置文件

### 命令别名

每个配置文件都会在 `~/.local/bin/<name>` 处自动获得一个命令别名：

```bash
coder chat                    # 与 coder 代理对话
coder setup                   # 配置 coder 的设置
coder gateway start           # 启动 coder 的网关
coder doctor                  # 检查 coder 的健康状况
coder skills list             # 列出 coder 的技能
coder config set model.model anthropic/claude-sonnet-4
```

这个别名适用于所有 hermes 子命令——实际上只是 `hermes -p <name>`。

### `-p` 标志

你也可以通过任何命令显式指定目标配置文件：

```bash
hermes -p coder chat
hermes --profile=coder doctor
hermes chat -p coder -q "hello"    # 在任何位置都有效
```

### 粘性默认值（`hermes profile use`）

```bash
hermes profile use coder
hermes chat                   # 现在针对 coder
hermes tools                  # 配置 coder 的工具
hermes profile use default    # 切换回来
```

设置一个默认值，这样普通的 `hermes` 命令就会针对该配置文件。类似于 `kubectl config use-context`。

### 了解当前状态

CLI 始终显示哪个配置文件处于活动状态：

- **提示符**：显示 `coder ❯` 而不是 `❯`
- **横幅**：启动时显示 `Profile: coder`
- **`hermes profile`**：显示当前配置文件名称、路径、模型和网关状态

## 配置文件 vs 工作区 vs 沙箱

配置文件经常与工作区或沙箱混淆，但它们是不同的概念：

- **配置文件**为 Hermes 提供独立的状态目录：`config.yaml`、`.env`、`SOUL.md`、会话、记忆、日志、计划任务和网关状态。
- **工作区**或**工作目录**是终端命令开始执行的位置。这由 `terminal.cwd` 单独控制。
- **沙箱**是限制文件系统访问的机制。配置文件**不会**对代理进行沙箱隔离。

在默认的 `local` 终端后端上，代理仍然具有与你用户账户相同的文件系统访问权限。配置文件不会阻止它访问配置文件目录之外的文件夹。

如果你希望某个配置文件在特定项目文件夹中启动，请在那个配置文件的 `config.yaml` 中设置明确的绝对路径 `terminal.cwd`：

```yaml
terminal:
  backend: local
  cwd: /absolute/path/to/project
```

在本地后端上使用 `cwd: "."` 表示"Hermes 启动时的目录"，而不是"配置文件目录"。

还要注意：

- `SOUL.md` 可以指导模型，但不会强制执行工作区边界。
- 对 `SOUL.md` 的更改会在新会话中干净地生效。现有会话可能仍在使用旧的提示词状态。
- 询问模型"你在什么目录下？"不是一个可靠的隔离测试。如果你需要工具的可预测起始目录，请显式设置 `terminal.cwd`。

## 运行网关

每个配置文件都会作为单独的进程运行自己的网关，并拥有自己独立的 bot token：

```bash
coder gateway start           # 启动 coder 的网关
assistant gateway start       # 启动 assistant 的网关（独立进程）
```

### 不同的 bot tokens

每个配置文件都有自己的 `.env` 文件。在每个文件中配置不同的 Telegram/Discord/Slack bot token：

```bash
# 编辑 coder 的 tokens
nano ~/.hermes/profiles/coder/.env

# 编辑 assistant 的 tokens
nano ~/.hermes/profiles/assistant/.env
```

### 安全：token 锁定

如果两个配置文件意外使用了相同的 bot token，第二个网关会被阻止，并显示清晰的错误信息指出冲突的配置文件。支持 Telegram、Discord、Slack、WhatsApp 和 Signal。

### 持久化服务

```bash
coder gateway install         # 创建 hermes-gateway-coder systemd/launchd 服务
assistant gateway install     # 创建 hermes-gateway-assistant 服务
```

每个配置文件都会获得自己独立的服务名称。它们会独立运行。

## 配置配置文件

每个配置文件都有自己独立的：

- **`config.yaml`** — 模型、提供商、工具集、所有设置
- **`.env`** — API 密钥、bot tokens
- **`SOUL.md`** — 个性和指令

```bash
coder config set model.model anthropic/claude-sonnet-4
echo "You are a focused coding assistant." > ~/.hermes/profiles/coder/SOUL.md
```

如果你希望这个配置文件默认在特定项目中工作，还要设置它自己的 `terminal.cwd`：

```bash
coder config set terminal.cwd /absolute/path/to/project
```

## 更新

`hermes update` 会一次性拉取代码（共享）并将新的捆绑技能同步到**所有**配置文件：

```bash
hermes update
# → 代码已更新（12 次提交）
# → 技能已同步：default（最新），coder（+2 个新增），assistant（+2 个新增）
```

用户修改的技能永远不会被覆盖。

## 管理配置文件

```bash
hermes profile list           # 显示所有配置文件及其状态
hermes profile show coder     # 显示单个配置文件的详细信息
hermes profile rename coder dev-bot   # 重命名（更新别名 + 服务）
hermes profile export coder   # 导出为 coder.tar.gz
hermes profile import coder.tar.gz   # 从归档文件导入
```

## 删除配置文件

```bash
hermes profile delete coder
```

这会停止网关、移除 systemd/launchd 服务、移除命令别名，并删除所有配置文件数据。系统会要求你输入配置文件名称以确认。

使用 `--yes` 跳过确认：`hermes profile delete coder --yes`

:::note
你不能删除默认配置文件（`~/.hermes`）。要完全移除所有内容，请使用 `hermes uninstall`。
:::

## Tab 补全

```bash
# Bash
eval "$(hermes completion bash)"

# Zsh
eval "$(hermes completion zsh)"
```

将此行添加到你的 `~/.bashrc` 或 `~/.zshrc` 以实现持久的补全功能。补全 `-p` 后的配置文件名称、配置文件子命令和顶级命令。

## 工作原理

配置文件使用 `HERMES_HOME` 环境变量。当你运行 `coder chat` 时，包装脚本会在启动 hermes 之前设置 `HERMES_HOME=~/.hermes/profiles/coder`。由于代码库中有 119+ 个文件通过 `get_hermes_home()` 解析路径，Hermes 状态会自动限定到配置文件的目录——配置、会话、记忆、技能、状态数据库、网关 PID、日志和计划任务。

这与终端工作目录是分开的。工具执行从 `terminal.cwd`（或在本地后端上启动目录，当 `cwd: "."` 时）开始，而不是自动从 `HERMES_HOME` 开始。

默认配置文件就是 `~/.hermes` 本身。无需迁移——现有安装会完全一样工作。