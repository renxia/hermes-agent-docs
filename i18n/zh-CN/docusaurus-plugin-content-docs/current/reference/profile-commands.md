---
sidebar_position: 7
---

# Profile Commands Reference

This page covers all commands related to [Hermes profiles](../user-guide/profiles.md). For general CLI commands, see [CLI Commands Reference](./cli-commands.md).

## `hermes profile`

```bash
hermes profile <subcommand>
```

Top-level command for managing profiles. Running `hermes profile` without a subcommand shows help.

| Subcommand | Description |
|------------|-------------|
| `list` | List all profiles. |
| `use` | Set the active (default) profile. |
| `create` | Create a new profile. |
| `describe` | Read or set a profile's description (used by the kanban orchestrator for routing). |
| `delete` | Delete a profile. |
| `show` | Show details about a profile. |
| `alias` | Regenerate the shell alias for a profile. |
| `rename` | Rename a profile. |
| `export` | Export a profile to a tar.gz archive. |
| `import` | Import a profile from a tar.gz archive. |
| `install` | Install a profile distribution from a git URL or local directory. See [Profile Distributions](../user-guide/profile-distributions.md). |
| `update` | Re-pull a distribution-managed profile and re-apply its bundle. |
| `info` | Show distribution metadata for a profile (origin URL, commit, last update). |

## `hermes profile list`

```bash
hermes profile list
```

列出所有配置文件。当前激活的配置文件用 `*` 标记。

**示例：**

```bash
$ hermes profile list
  default
* work
  dev
  personal
```

无选项。

## `hermes profile use`

```bash
hermes profile use <name>
```

将 `<name>` 设为激活的配置文件。之后所有不带 `-p` 的 `hermes` 命令都将使用该配置文件。

| 参数 | 说明 |
|------|------|
| `<name>` | 要激活的配置文件名称。使用 `default` 可回到基础配置文件。 |

**示例：**

```bash
hermes profile use work
hermes profile use default
```

## `hermes profile create`

```bash
hermes profile create <name> [options]
```

创建一个新的配置文件。

| 参数 / 选项 | 说明 |
|-------------------|-------------|
| `<name>` | 新配置文件的名称。必须是有效的目录名称（字母数字、连字符、下划线）。 |
| `--clone` | 从当前配置文件复制 `config.yaml`、`.env`、`SOUL.md` 和技能。 |
| `--clone-all` | 从当前配置文件复制所有内容（配置、记忆、技能、定时任务、插件）。排除每个配置文件独有的历史记录：会话、`state.db`、备份、状态快照、检查点。 |
| `--clone-from <profile>` | 从指定配置文件而非当前配置文件克隆配置/技能/SOUL。隐含 `--clone`，除非与 `--clone-all` 搭配使用。 |
| `--no-alias` | 跳过包装脚本的创建。 |
| `--description "<text>"` | 一到两句话描述该配置文件擅长什么。由看板编排器用于基于角色而非配置文件名称来路由任务。可跳过，之后通过 `hermes profile describe` 添加。持久保存在 `<profile_dir>/profile.yaml` 中。 |
| `--no-skills` | 创建一个**空的**配置文件，不启用任何捆绑技能。在配置文件中写入 `.no-bundled-skills` 标记，使未来的 `hermes update` 运行不会重新注入捆绑技能集，且拒绝与 `--clone`、`--clone-from` 或 `--clone-all` 组合使用（这些选项无论如何都会复制技能）。适用于狭窄的编排器配置文件或不应继承完整技能目录的沙箱配置文件。若要在已创建的配置文件（包括默认的 `~/.hermes`）上切换此设置，使用 `hermes skills opt-out` / `hermes skills opt-in`。 |

创建配置文件**不会**使该配置文件目录成为终端命令的默认项目/工作区目录。如果希望配置文件从特定项目启动，请在配置文件的 `config.yaml` 中设置 `terminal.cwd`。

**示例：**

```bash
# 空白配置文件——需要完整设置
hermes profile create mybot

# 仅从当前配置文件克隆配置
hermes profile create work --clone

# 从当前配置文件克隆所有内容
hermes profile create backup --clone-all

# 从指定配置文件克隆配置
hermes profile create work2 --clone-from work

# 从指定配置文件克隆所有内容
hermes profile create work2-backup --clone-from work --clone-all
```

## `hermes profile describe`

```bash
hermes profile describe [<name>] [options]
```

读取或设置配置文件的描述。描述由看板编排器使用，基于每个配置文件擅长什么来路由任务，而非仅凭配置文件名称猜测。持久保存在 `<profile_dir>/profile.yaml` 中，使其在重启后依然保留，并可与网关共享。

不带任何标志时，打印当前描述（如果为空则打印 `(no description set for '<name>')`）。

| 参数 / 选项 | 说明 |
|-------------------|-------------|
| `<name>` | 要描述的配置文件。除非使用 `--all --auto`，否则为必填。 |
| `--text "<text>"` | 将描述设置为此确切文本（用户编写）。覆盖任何现有描述。 |
| `--auto` | 通过辅助 LLM 自动生成 1-2 句话的描述，基于配置文件已安装的技能、配置的模型和名称。在 `config.yaml` 中的 `auxiliary.profile_describer` 下配置模型。自动生成的描述会标记 `description_auto: true`，以便仪表板可标记它们以供审查。 |
| `--overwrite` | 与 `--auto` 一起使用时，也替换用户编写的描述（默认：跳过已显式设置描述的配置文件）。 |
| `--all` | 与 `--auto` 一起使用时，扫描所有缺少描述的配置文件。 |

**示例：**

```bash
# 读取当前描述
hermes profile describe researcher

# 显式设置
hermes profile describe researcher --text "Reads source code and writes findings."

# 让 LLM 生成一个
hermes profile describe researcher --auto

# 为所有没有描述的配置文件填充描述
hermes profile describe --all --auto
```

## `hermes profile delete`

```bash
hermes profile delete <name> [options]
```

删除配置文件并移除其 shell 别名。

| 参数 / 选项 | 说明 |
|-------------------|-------------|
| `<name>` | 要删除的配置文件。 |
| `--yes`, `-y` | 跳过确认提示。 |

**示例：**

```bash
hermes profile delete mybot
hermes profile delete mybot --yes
```

:::warning
这会永久删除配置文件的整个目录，包括所有配置、记忆、会话和技能。无法删除当前激活的配置文件。
:::

## `hermes profile show`

```bash
hermes profile show <name>
```

显示配置文件的详细信息，包括其主目录、配置的模型、网关状态、技能数量和配置文件状态。

这显示的是配置文件的 Hermes 主目录，而非终端工作目录。终端命令从 `terminal.cwd`（或本地后端中当 `cwd: "."` 时的启动目录）开始。

| 参数 | 说明 |
|------|------|
| `<name>` | 要检查的配置文件。 |

**示例：**

```bash
$ hermes profile show work
Profile: work
Path:    ~/.hermes/profiles/work
Model:   anthropic/claude-sonnet-4 (anthropic)
Gateway: stopped
Skills:  12
.env:    exists
SOUL.md: exists
Alias:   ~/.local/bin/work
```

## `hermes profile alias`

```bash
hermes profile alias <name> [options]
```

在 `~/.local/bin/<name>` 重新生成 shell 别名脚本。在别名被意外删除或在移动 Hermes 安装后需要更新时有用。

| 参数 / 选项 | 说明 |
|-------------------|-------------|
| `<name>` | 要为其创建/更新别名的配置文件。 |
| `--remove` | 移除包装脚本而非创建它。 |
| `--name <alias>` | 自定义别名名称（默认：配置文件名称）。 |

**示例：**

```bash
hermes profile alias work
# 创建/更新 ~/.local/bin/work

hermes profile alias work --name mywork
# 创建 ~/.local/bin/mywork

hermes profile alias work --remove
# 移除包装脚本
```

## `hermes profile rename`

```bash
hermes profile rename <old-name> <new-name>
```

重命名配置文件。更新目录和 shell 别名。

| 参数 | 说明 |
|------|------|
| `<old-name>` | 当前配置文件名称。 |
| `<new-name>` | 新的配置文件名称。 |

**示例：**

```bash
hermes profile rename mybot assistant
# ~/.hermes/profiles/mybot → ~/.hermes/profiles/assistant
# ~/.local/bin/mybot → ~/.local/bin/assistant
```

## `hermes profile export`

```bash
hermes profile export <name> [options]
```

将配置文件导出为压缩的 tar.gz 归档文件。

| 参数 / 选项 | 说明 |
|-------------------|-------------|
| `<name>` | 要导出的配置文件。 |
| `-o`, `--output <path>` | 输出文件路径（默认：`<name>.tar.gz`）。 |

**示例：**

```bash
hermes profile export work
# 在当前目录创建 work.tar.gz

hermes profile export work -o ./work-2026-03-29.tar.gz
```

## `hermes profile import`

```bash
hermes profile import <archive> [options]
```

从 tar.gz 归档文件导入配置文件。

| 参数 / 选项 | 说明 |
|-------------------|-------------|
| `<archive>` | 要导入的 tar.gz 归档文件路径。 |
| `--name <name>` | 导入的配置文件名称（默认：从归档文件推断）。 |

**示例：**

```bash
hermes profile import ./work-2026-03-29.tar.gz
# 从归档文件推断配置文件名称

hermes profile import ./work-2026-03-29.tar.gz --name work-restored
```

## 分发命令

:::tip
**不熟悉分发版本？** 请从[配置文件分发用户指南](../user-guide/profile-distributions.md)开始——其中包含完整示例，涵盖原因、时机和方法。下文是面向已知需求的精简 CLI 参考。
:::

分发版本将配置文件转化为可共享、可版本化的产物，以 **git 仓库**的形式发布。接收方通过单条命令安装分发版本，之后可在原地更新，无需触及本地的记忆、会话或凭据。

`auth.json` 和 `.env` 永远不会包含在分发版本中——它们保留在用户机器上。

接收方的用户数据（记忆、会话、认证、他们对 `.env` 的自定义修改）在初始安装和后续更新中始终保留。

:::info
`hermes profile export` / `import` 仍然是在自己机器上**本地备份和恢复**配置文件的正确命令。分发（`install` / `update` / `info`）是一个独立的概念：通过 git 分发配置文件以便他人安装。
:::

### `hermes profile install`

```bash
hermes profile install <source> [--name <name>] [--alias] [--force] [--yes]
```

从 git URL 或本地目录安装配置文件分发版本。

| 选项 | 说明 |
|--------|-------------|
| `<source>` | Git URL（`github.com/user/repo`、`https://...`、`git@...`、`ssh://`、`git://`）或根目录包含 `distribution.yaml` 的本地目录。 |
| `--name NAME` | 覆盖清单中的配置文件名称。 |
| `--alias` | 同时创建 shell 包装脚本（例如 `telemetry` → `hermes -p telemetry`）。 |
| `--force` | 覆盖同名已存在的配置文件。用户数据仍然保留。 |
| `-y`, `--yes` | 跳过清单预览确认提示。 |

安装器会显示清单、列出所需环境变量，并在询问确认前警告定时任务。所需环境变量会写入 `.env.EXAMPLE` 文件，你需要将其复制为 `.env` 并填写。

**示例：**

```bash
# 从 GitHub 仓库安装（简写）
hermes profile install github.com/kyle/telemetry-distribution --alias

# 从完整 HTTPS git URL 安装
hermes profile install https://github.com/kyle/telemetry-distribution.git

# 从 SSH 安装
hermes profile install git@github.com:kyle/telemetry-distribution.git

# 从本地目录安装（开发期间）
hermes profile install ./telemetry/
```

### `hermes profile update`

```bash
hermes profile update <name> [--force-config] [--yes]
```

从记录的来源重新克隆分发版本并应用更新。分发版本拥有的文件（SOUL.md、skills/、cron/、mcp.json）会被覆盖；用户数据（记忆、会话、认证、.env）永远不会被触及。

`config.yaml` 默认保留以保持你的本地覆盖配置。传入 `--force-config` 可将其重置为分发的自带配置。

### `hermes profile info`

```bash
hermes profile info <name>
```

打印配置文件的分发清单——名称、版本、所需的 Hermes 版本、作者、环境变量要求、来源 URL/路径以及分发版本上次被 `install` 或 `update` 时记录的 `Installed:` 时间戳。用于在安装前查看共享配置文件的需求，以及发现"该配置文件是 6 个月前安装的，至今未更新"的情况。

`hermes profile list` 还在 `Distribution` 列中显示分发名称和版本，且 `hermes profile show <name>` / `delete <name>` 会显示来源 URL，以便你一眼看出哪些配置文件来自 git 仓库，哪些是本地创建的。

### 私有分发版本

私有 git 仓库无需额外配置即可作为分发源——安装器会调用你常规的 `git` 二进制文件，因此你 shell 已设置的任何认证（SSH 密钥、`git credential` 助手、GitHub CLI 存储的 HTTPS 凭据）都会透明地生效。

```bash
# 使用你的 SSH 密钥，与任何其他 `git clone` 相同
hermes profile install git@github.com:your-org/internal-assistant.git

# 使用你的 git 凭据助手
hermes profile install https://github.com/your-org/internal-assistant.git
```

如果克隆在安装期间于终端中交互式提示凭据，该提示会正常流转。先按你通常使用 `git clone` 访问同一仓库的方式设置认证，然后再安装。

### 分发清单（`distribution.yaml`）

每个分发版本在其仓库根目录都有一个 `distribution.yaml`：

```yaml
name: telemetry
version: 0.1.0
description: "Compliance monitoring harness"
hermes_requires: ">=0.12.0"
author: "Your Name"
license: "MIT"
env_requires:
  - name: OPENAI_API_KEY
    description: "OpenAI API key"
    required: true
  - name: GRAPHITI_MCP_URL
    description: "Memory graph URL"
    required: false
    default: "http://127.0.0.1:8000/sse"
distribution_owned:   # 可选；默认为 SOUL.md、config.yaml、
                      #   mcp.json、skills/、cron/、distribution.yaml
  - SOUL.md
  - skills/compliance/
  - cron/
```

`hermes_requires` 支持 `>=`、`<=`、`==`、`!=`、`>`、`<` 或裸版本号（视为 `>=`）。如果当前 Hermes 版本不满足规范，安装将失败并显示明确的错误。

`distribution_owned` 是可选的。如果设置，只有这些路径会在更新时被替换；配置文件中的其他内容保留为用户所有。如果省略，使用上述默认值。

### 发布分发版本

编写分发版本只需一次 git 推送：

1. 在你的配置文件目录中，创建至少包含 `name` 和 `version` 的 `distribution.yaml`。
2. 初始化 git 仓库（或使用已有的）并推送到 GitHub / GitLab / Hermes 可克隆的任何主机。
3. 告知接收方运行 `hermes profile install <你的仓库URL>`。

使用 git 标签进行版本发布——克隆 `HEAD` 的接收方获取最新状态，你可以随时在清单中提升 `version:`。

## `hermes -p` / `hermes --profile`

```bash
hermes -p <name> <command> [options]
hermes --profile <name> <command> [options]
```

全局标志，用于在特定配置文件下运行任意 Hermes 命令，而不会更改粘性默认值。此标志会在命令执行期间覆盖当前激活的配置文件。

| 选项 | 说明 |
|--------|-------------|
| `-p <name>`, `--profile <name>` | 用于此命令的配置文件。 |

**示例：**

```bash
hermes -p work chat -q "Check the server status"
hermes --profile dev gateway start
hermes -p personal skills list
hermes -p work config edit
```

## `hermes completion`

```bash
hermes completion <shell>
```

生成 shell 自动补全脚本。包括配置文件名称和配置文件子命令的补全。

| 参数 | 说明 |
|----------|-------------|
| `<shell>` | 要生成补全的 shell：`bash`、`zsh` 或 `fish`。 |

**示例：**

```bash
# 安装补全脚本
hermes completion bash >> ~/.bashrc
hermes completion zsh >> ~/.zshrc
hermes completion fish > ~/.config/fish/completions/hermes.fish

# 重新加载 shell
source ~/.bashrc
```

安装完成后，Tab 自动补全可用于：
- `hermes profile <TAB>` — 子命令（list、use、create 等）
- `hermes profile use <TAB>` — 配置文件名称
- `hermes -p <TAB>` — 配置文件名称

## 另请参阅

- [配置文件用户指南](../user-guide/profiles.md)
- [CLI 命令参考](./cli-commands.md)
- [常见问题 — 配置文件部分](./faq.md#profiles)