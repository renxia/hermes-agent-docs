---
sidebar_position: 2
---

# 配置：运行多个智能体

在同一台机器上运行多个独立的 Hermes 智能体们——每个智能体都有自己的配置、API 密钥、内存、会话、技能和网关状态。

## 什么是配置？

配置是一个独立的 Hermes 主目录。每个配置都有自己的目录，其中包含其自身的 `config.yaml`、`.env`、`SOUL.md`、记忆、会话、技能、cron 作业和状态数据库。配置允许您运行用于不同目的的独立智能体——例如编码助手、个人机器人或研究智能体——而不会混淆 Hermes 的状态。

当您创建一个配置时，它会自动成为一个命令。创建名为 `coder` 的配置后，您立即可以使用 `coder chat`、`coder setup`、`coder gateway start` 等命令。

## 快速入门 (Quick start)

```bash
hermes profile create coder       # 创建配置文件 + "coder" 命令别名
coder setup                       # 配置 API 密钥和模型
coder chat                        # 开始聊天
```

就是这样。`coder` 现在是拥有自己配置、内存和状态的独立 Hermes 配置文件。

## 创建配置文件 (Creating a profile)

:::tip
最快的设置方法：在新的配置文件中运行 `hermes setup --portal`，即可一次性地连接模型 + 工具。请参阅 [Nous Portal](/integrations/nous-portal)。
:::

### 空白配置文件 (Blank profile)

```bash
hermes profile create mybot
```

创建一个带有预置捆绑技能的全新配置文件。运行 `mybot setup` 来配置 API 密钥、模型和网关令牌。

如果你计划将此配置文件用作看板工作者（或希望看板编排器将其路由到它），请在创建时传递 `--description "<role>"`，以便编排器知道它的专长：

```bash
hermes profile create researcher --description "读取源代码和外部文档，撰写发现。"
```

你也可以稍后使用 `hermes profile describe` 来设置或自动生成描述 — 查阅 [看板指南](./features/kanban#auto-vs-manual-orchestration) 以了解完整的路由模型。

### 只克隆配置 (`--clone`)

```bash
hermes profile create work --clone
```

将你当前配置文件的 `config.yaml`、`.env`、`SOUL.md` 和技能复制到新配置文件中。API 密钥、模型和能力是相同的，但会话和内存是全新的。要使用不同的 API 密钥，请编辑 `~/.hermes/profiles/work/.env`；要使用不同的个性，请编辑 `~/.hermes/profiles/work/SOUL.md`。

### 克隆所有内容 (`--clone-all`)

```bash
hermes profile create backup --clone-all
```

复制**所有内容**——配置、API 密钥、个性、所有内存、技能、定时任务、插件。这是一个完整的可工作快照。排除了每个配置文件的历史记录（会话历史、`state.db`、`backups/`、`state-snapshots/`、`checkpoints/`）— 这些属于源配置文件，可能达到数十 GB 的大小。如果需要包含历史记录的完整备份，请使用 `hermes profile export` 或 `hermes backup`。

### 从特定配置文件克隆 (Clone from a specific profile)

```bash
hermes profile create work --clone-from coder
```

`--clone-from <source>` 直接选择源配置文件并隐含配置/技能/SOUL 的克隆。当你想对该源配置文件进行完整复制时，将其与 `--clone-all` 结合使用：

```bash
hermes profile create work-backup --clone-from coder --clone-all
```

:::tip Honcho 内存 + 配置文件
当启用 Honcho 时，克隆操作会自动为新配置文件创建一个专用的 AI 同伴（peer），同时共享同一个用户工作区。每个配置文件都会构建自己的观察和身份。请参阅 [Honcho - 多智能体/配置文件](./features/memory-providers.md#honcho) 以获取详细信息。
:::

## 使用配置文件 (Using profiles)

### 命令别名 (Command aliases)

每个配置文件都会在 `~/.local/bin/<name>` 自动获得一个命令别名：

```bash
coder chat                    # 与 coder 智能体聊天
coder setup                   # 配置 coder 的设置
coder gateway start           # 启动 coder 的网关
coder doctor                  # 检查 coder 的健康状况
coder skills list             # 列出 coder 的技能
coder config set model.default anthropic/claude-sonnet-4
```

该别名适用于所有 hermes 子命令——本质上它只是 `hermes -p <name>`。

### `-p` 标志 (The `-p` flag)

你也可以使用任何命令明确指定一个配置文件：

```bash
hermes -p coder chat
hermes --profile=coder doctor
hermes chat -p coder -q "hello"    # 无论放在哪个位置都有效
```

### 粘性默认值 (`hermes profile use`) (Sticky default)

```bash
hermes profile use coder
hermes chat                   # 现在会针对 coder 执行
hermes tools                  # 配置 coder 的工具
hermes profile use default    # 切回默认设置
```

这设置了一个默认值，使得普通的 `hermes` 命令都指向该配置文件。类似于 `kubectl config use-context`。

### 了解你所在的位置 (Knowing where you are)

CLI 始终显示哪个配置文件是活动的：

- **提示符 (Prompt)**: 显示 `coder ❯` 而不是 `❯`
- **横幅 (Banner)**: 启动时显示 `Profile: coder`
- **`hermes profile`**: 显示当前配置文件的名称、路径、模型和网关状态

## 配置文件 vs 工作区 vs 沙盒 (Profiles vs workspaces vs sandboxing)

配置文件经常与工作区或沙盒混淆，但它们是不同的概念：

- 一个**配置文件**赋予 Hermes 自己的状态目录：`config.yaml`、`.env`、`SOUL.md`、会话、内存、日志、定时任务和网关状态。
- **工作区**或**工作目录**是终端命令开始的地方。这由 `terminal.cwd` 单独控制。
- **沙盒 (Sandbox)** 是限制文件系统访问的部分。配置文件**不会**对智能体进行沙盒化。

在默认的 `local` 终端后端，智能体仍然拥有与你的用户账户相同的文件系统访问权限。一个配置文件并不能阻止它访问配置文件目录之外的文件夹。

如果你希望配置文件在一个特定的项目文件夹中启动，请在该配置文件的 `config.yaml` 中设置一个明确的绝对 `terminal.cwd`：

```yaml
terminal:
  backend: local
  cwd: /absolute/path/to/project
```

在本地后端使用 `cwd: "."` 意味着“Hermes 被启动时的目录”，而不是“配置文件目录”。

另请注意：

- `SOUL.md` 可以指导模型，但它不能强制执行工作区边界。
- 对 `SOUL.md` 的更改会在新的会话中干净生效。现有会话可能仍在使用了旧的提示状态。
- 询问模型“你在哪个目录？”不是一个可靠的隔离性测试。如果你需要工具的一个可预测的起始目录，请明确设置 `terminal.cwd`。

## 运行网关 (Running gateways)

每个配置文件都以独立的进程形式运行自己的网关，并拥有自己的机器人令牌：

```bash
coder gateway start           # 启动 coder 的网关
assistant gateway start       # 启动 assistant的网关（独立进程）
```

### 不同的机器人令牌 (Different bot tokens)

每个配置文件都有自己的 `.env` 文件。在每个文件中配置不同的 Telegram/Discord/Slack 机器人令牌：

```bash
# 编辑 coder 的令牌
nano ~/.hermes/profiles/coder/.env

# 编辑 assistant 的令牌
nano ~/.hermes/profiles/assistant/.env
```

### 安全性：令牌锁定 (Safety: token locks)

如果两个配置文件意外使用了相同的机器人令牌，第二个网关将被阻止，并会显示一个明确指出冲突配置文件的错误。支持 Telegram、Discord、Slack、WhatsApp 和 Signal。

### 持久化服务 (Persistent services)

```bash
coder gateway install         # 创建 hermes-gateway-coder systemd/launchd 服务
assistant gateway install     # 创建 hermes-gateway-assistant 服务
```

每个配置文件都会获得自己的服务名称。它们独立运行。

:::note 官方 Docker 镜像内部
网关由 [s6-overlay](https://github.com/just-containers/s6-overlay)（容器中的 PID 1）进行监督，因此 `hermes profile create <name>` 会自动在 `/run/service/gateway-<name>/` 处注册一个 s6 服务槽位。`hermes -p <name> gateway start/stop/restart` 会分派给 `s6-svc`，而不是启动一个裸进程——崩溃会被自动重启，而 `docker restart` 会保留先前运行的网关集合。请参阅 [Per-profile gateway supervision](/user-guide/docker#per-profile-gateway-supervision) 获取详细信息。
:::

## 配置配置文件 (Configuring profiles)

每个配置文件都有自己的：

- **`config.yaml`** — 模型、提供商、工具集、所有设置
- **`.env`** — API 密钥、机器人令牌
- **`SOUL.md`** — 个性和指令

```bash
coder config set model.default anthropic/claude-sonnet-4
echo "You are a focused coding assistant." > ~/.hermes/profiles/coder/SOUL.md
```

如果你希望此配置文件默认在一个特定的项目中工作，也请设置其自己的 `terminal.cwd`：

```bash
coder config set terminal.cwd /absolute/path/to/project
```

### 从仪表板 (From the dashboard)

[Web 仪表板](features/web-dashboard.md#managing-multiple-profiles) 是一个机器级别的界面，可以通过侧边栏中的配置文件切换器来管理**任何**配置文件的配置、API 密钥、技能、MCP 和模型——无需每个配置文件的独立仪表板。`coder dashboard` 会路由到带有 `coder` 配置文件的机器仪表板。仪表板的聊天标签页也会跟随该切换器，在选定配置文件的主页下启动对话。

注意：“设置为活动”功能是针对**未来的 CLI/网关运行**的粘性默认值（与 `hermes profile use` 相同）——要从仪表板编辑配置文件，请使用切换器。

## 更新 (Updating)

`hermes update` 只拉取一次代码（共享），并自动将新的捆绑技能同步到**所有**配置文件：

```bash
hermes update
# → 代码已更新 (12 次提交)
# → 技能已同步: default (已更新), coder (+2 个新技能), assistant (+2 个新技能)
```

用户修改的技能永远不会被覆盖。

## 管理配置文件 (Managing profiles)

```bash
hermes profile list           # 显示所有配置文件的状态
hermes profile show coder     # 单个配置文件的详细信息
hermes profile rename coder dev-bot   # 重命名（更新别名 + 服务）
hermes profile export coder   # 导出为 coder.tar.gz
hermes profile import coder.tar.gz   # 从归档文件导入
```

## 删除配置文件 (Deleting a profile)

```bash
hermes profile delete coder
```

这会停止网关、移除 systemd/launchd 服务、移除命令别名并删除所有配置文件数据。系统会要求你输入配置文件名称以确认。

使用 `--yes` 跳过确认：`hermes profile delete coder --yes`

:::note
你不能删除默认配置文件（`~/.hermes`）。要移除所有内容，请使用 `hermes uninstall`。
:::

## Tab 补全 (Tab completion)

```bash
# Bash
eval "$(hermes completion bash)"

# Zsh
eval "$(hermes completion zsh)"
```

将此行添加到你的 `~/.bashrc` 或 `~/.zshrc` 中以实现持久化补全。它会补全 `-p` 后的配置文件名称、配置文件子命令和顶级命令。

## 工作原理 (How it works)

配置文件使用 `HERMES_HOME` 环境变量。当你运行 `coder chat` 时，包装脚本会在启动 hermes 之前设置 `HERMES_HOME=~/.hermes/profiles/coder`。由于代码库中 119+ 个文件都通过 `get_hermes_home()` 解析路径，Hermes 的状态会自动限定到该配置文件的目录——包括配置、会话、内存、技能、状态数据库、网关 PID、日志和定时任务。

这与终端工作目录是分开的。工具执行是从 `terminal.cwd`（或在本地后端使用 `cwd: "."` 时的启动目录）开始的，而不是自动从 `HERMES_HOME` 开始。

在主机安装中，工具子进程默认保留你真实的操作系统用户 `HOME`，因此 `~` 下现有的 CLI 凭证可以在所有配置文件中继续工作。配置文件数据是通过 `HERMES_HOME` 进行隔离的，而不是通过更改 `HOME`。容器后端仍然使用 `{HERMES_HOME}/home` 来持久化工具状态，而需要严格按配置文件配置工具的主机用户可以选项启用 `terminal.home_mode: profile`。

这意味着两件很容易混淆的事情：

- `HERMES_HOME` 是配置文件边界。它控制 Hermes 的配置、`.env`、内存、会话、技能、日志、定时任务、网关状态和其他 Hermes 数据。
- `HOME` 是外部 CLI 所期望的操作系统/用户主目录。在主机安装中，Hermes 默认将其保留为真实的用户主目录，因此像 `git`、`ssh`、`gh`、`az`、`npm`、Claude Code 和 Codex 这样的工具可以找到它们在正常 shell 中使用的相同凭证。

权衡是：主机配置文件默认共享正常的用户级别 CLI 状态。如果你需要每个配置文件的独立 CLI 身份，请在该配置文件的 `config.yaml` 中设置 `terminal.home_mode: profile`。在这种模式下，Hermes 使用 `HOME={HERMES_HOME}/home` 启动工具子进程；你随后需要在该配置文件主目录内初始化或链接特定于配置文件的 `~/.ssh`、`~/.gitconfig`、`~/.config/gh`、云 CLI 认证、Claude/Codex 认证、npm 状态和类似文件。

Hermes 还将 `HERMES_REAL_HOME` 暴露给子进程，因此当 `home_mode: profile` 激活时，脚本仍然可以找到实际的账户主目录。

默认配置文件本身就是 `~/.hermes`。无需迁移——现有安装可以完全相同地工作。

## 将配置文件作为分发包共享

在一个机器上构建的配置文件可以被打包成一个**git 仓库**，然后通过一条命令在另一台机器上安装——可能是你自己的工作站、队友的笔记本电脑或社区用户的环境。这个共享的软件包包括 SOUL、配置、技能、cron 作业和 MCP 连接。凭证（Credentials）、记忆（memories）和会话（sessions）则保留在各自的机器上。

```bash
# 从 git 仓库安装一个完整的智能体
hermes profile install github.com/you/research-bot --alias

# 当作者发布新版本时进行更新（保留你的记忆 + .env 文件）
hermes profile update research-bot
```

请参阅**[配置文件分发：共享整个智能体](./profile-distributions.md)** 以获取完整的指南——包括编写、发布、更新语义、安全模型和使用案例。