---
sidebar_position: 7
---

# 配置命令参考

本页涵盖所有与 [Hermes 配置文件](../user-guide/profiles.md) 相关的命令。通用 CLI 命令请参见 [CLI 命令参考](./cli-commands.md)。

## `hermes profile`

```bash
hermes profile <subcommand>
```

管理配置文件的顶级命令。运行不带子命令的 `hermes profile` 将显示帮助信息。

| 子命令 | 描述 |
|--------|------|
| `list` | 列出所有配置文件。 |
| `use` | 设置活动（默认）配置文件。 |
| `create` | 创建一个新的配置文件。 |
| `delete` | 删除一个配置文件。 |
| `show` | 显示某个配置文件的详细信息。 |
| `alias` | 为配置文件重新生成 shell 别名。 |
| `rename` | 重命名一个配置文件。 |
| `export` | 将配置文件导出为 tar.gz 归档文件。 |
| `import` | 从 tar.gz 归档文件导入配置文件。 |
| `install` | 从 git URL 或本地目录安装配置文件分发版。请参阅[配置文件分发版](../user-guide/profile-distributions.md)。 |
| `update` | 重新拉取由分发版管理的配置文件并重新应用其捆绑包。 |
| `info` | 显示配置文件的分发版元数据（来源 URL、提交记录、最后更新时间）。 |

## `hermes profile list`

```bash
hermes profile list
```

列出所有配置文件。当前活动的配置文件会用 `*` 标记。

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

将 `<name>` 设置为活动配置文件。之后所有不带 `-p` 的 `hermes` 命令都将使用此配置文件。

| 参数 | 描述 |
|------|------|
| `<name>` | 要激活的配置文件名称。使用 `default` 可返回基础配置文件。 |

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

| 参数 / 选项 | 描述 |
|-------------|------|
| `<name>` | 新配置文件的名称。必须是有效的目录名（字母、数字、连字符、下划线）。 |
| `--clone` | 从当前配置文件复制 `config.yaml`、`.env` 和 `SOUL.md`。 |
| `--clone-all` | 从当前配置文件复制所有内容（配置、记忆、技能、会话、状态）。 |
| `--clone-from <profile>` | 从指定配置文件克隆，而不是当前配置文件。与 `--clone` 或 `--clone-all` 一起使用。 |
| `--no-alias` | 跳过包装器脚本的创建。 |

创建配置文件**不会**使该配置文件目录成为终端命令的默认项目/工作目录。如果你希望某个配置文件在特定项目中启动，请在其 `config.yaml` 中设置 `terminal.cwd`。

**示例：**

```bash
# 空白配置文件 — 需要完整设置
hermes profile create mybot

# 仅从当前配置文件克隆配置
hermes profile create work --clone

# 从当前配置文件克隆所有内容
hermes profile create backup --clone-all

# 从指定配置文件克隆配置
hermes profile create work2 --clone --clone-from work
```

## `hermes profile delete`

```bash
hermes profile delete <name> [options]
```

删除一个配置文件并移除其shell别名。

| 参数 / 选项 | 描述 |
|-------------|------|
| `<name>` | 要删除的配置文件。 |
| `--yes`, `-y` | 跳过确认提示。 |

**示例：**

```bash
hermes profile delete mybot
hermes profile delete mybot --yes
```

:::warning
这将永久删除该配置文件的整个目录，包括所有配置、记忆、会话和技能。无法删除当前活动的配置文件。
:::

## `hermes profile show`

```bash
hermes profile show <name>
```

显示某个配置文件的详细信息，包括其主目录、配置的模型、网关状态、技能数量以及配置文件状态。

此处显示的是配置文件的Hermes主目录，而非终端工作目录。终端命令从 `terminal.cwd`（或在本地后端当 `cwd: "."` 时的启动目录）开始。

| 参数 | 描述 |
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

重新生成位于 `~/.local/bin/<name>` 的shell别名脚本。在别名被意外删除或你在移动Hermes安装后需要更新它时很有用。

| 参数 / 选项 | 描述 |
|-------------|------|
| `<name>` | 要为其创建/更新别名的配置文件。 |
| `--remove` | 移除包装器脚本，而不是创建它。 |
| `--name <alias>` | 自定义别名名称（默认：配置文件名）。 |

**示例：**

```bash
hermes profile alias work
# 创建/更新 ~/.local/bin/work

hermes profile alias work --name mywork
# 创建 ~/.local/bin/mywork

hermes profile alias work --remove
# 移除包装器脚本
```

## `hermes profile rename`

```bash
hermes profile rename <old-name> <new-name>
```

重命名一个配置文件。同时更新目录和shell别名。

| 参数 | 描述 |
|------|------|
| `<old-name>` | 当前配置文件名。 |
| `<new-name>` | 新的配置文件名。 |

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

将一个配置文件导出为压缩的tar.gz归档文件。

| 参数 / 选项 | 描述 |
|-------------|------|
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

从tar.gz归档文件导入一个配置文件。

| 参数 / 选项 | 描述 |
|-------------|------|
| `<archive>` | 要导入的tar.gz归档文件路径。 |
| `--name <name>` | 导入配置文件的名称（默认：从归档文件推断）。 |

**示例：**

```bash
hermes profile import ./work-2026-03-29.tar.gz
# 从归档文件推断配置文件名

hermes profile import ./work-2026-03-29.tar.gz --name work-restored
```

## 分发命令

:::tip
**不熟悉分发？** 请从[配置文件分发用户指南](../user-guide/profile-distributions.md)开始阅读——它涵盖了原因、时机和方法，并提供完整示例。以下各节是当你清楚自己需要什么时的CLI干巴巴参考。
:::

分发将配置文件转变为一个可共享的、版本化的工件，以 **git仓库** 的形式发布。接收者只需一个命令即可安装该分发，并且可以在不影响其本地记忆、会话或凭证的情况下就地更新。

`auth.json` 和 `.env` 永远不会成为分发的一部分——它们保留在安装用户的机器上。

接收者的用户数据（记忆、会话、认证信息、他们对 `.env` 的编辑）在初次安装和后续更新中始终被保留。

:::info
`hermes profile export` / `import` 仍然是在你自己的机器上**本地备份和恢复**配置文件的正确命令。分发（`install` / `update` / `info`）是一个不同的概念：通过git传送配置文件，以便其他人可以安装它。
:::

### `hermes profile install`

```bash
hermes profile install <source> [--name <name>] [--alias] [--force] [--yes]
```

从git URL或本地目录安装一个配置文件分发。

| 选项 | 描述 |
|------|------|
| `<source>` | Git URL（`github.com/user/repo`、`https://...`、`git@...`、`ssh://`、`git://`）或一个在其根目录下包含 `distribution.yaml` 的本地目录。 |
| `--name NAME` | 覆盖清单中指定的配置文件名。 |
| `--alias` | 同时创建一个shell包装器（例如 `telemetry` → `hermes -p telemetry`）。 |
| `--force` | 覆盖同名的现有配置文件。用户数据仍会被保留。 |
| `-y`, `--yes` | 跳过清单预览确认提示。 |

安装程序会显示清单、列出所需的环境变量，并在要求确认前警告定时任务。所需的环境变量会放入一个 `.env.EXAMPLE` 文件中，你需要将其复制为 `.env` 并填写。

**示例：**

```bash
# 从GitHub仓库安装（简写）
hermes profile install github.com/kyle/telemetry-distribution --alias

# 从完整的HTTPS git URL安装
hermes profile install https://github.com/kyle/telemetry-distribution.git

# 从SSH安装
hermes profile install git@github.com:kyle/telemetry-distribution.git

# 开发期间从本地目录安装
hermes profile install ./telemetry/
```

### `hermes profile update`

```bash
hermes profile update <name> [--force-config] [--yes]
```

从其记录的源重新克隆分发并应用更新。
分发拥有的文件（SOUL.md、skills/、cron/、mcp.json）会被覆盖；用户数据（记忆、会话、认证、.env）永远不会被触及。

`config.yaml` 默认会被保留，以保持你的本地覆盖配置。传递 `--force-config` 可将其重置为分发附带的配置。

### `hermes profile info`

```bash
hermes profile info <name>
```

打印配置文件的分发清单——名称、版本、所需的Hermes版本、作者、环境变量要求、源URL/路径，以及上次执行 `install` 或 `update` 时记录的 `Installed:` 时间戳。在安装共享配置文件之前检查其需求，以及发现“此配置文件是6个月前安装的且未更新”等情况时很有用。

`hermes profile list` 还会在 `Distribution` 列中显示分发名称和版本，而 `hermes profile show <name>` / `delete <name>` 会显示源URL，让你一眼就能分辨哪些配置文件来自git仓库，哪些是本地创建的。

### 私有分发

私有git仓库可以作为分发源使用，无需额外配置——安装程序会调用你正常的 `git` 命令，因此你shell已经设置好的任何认证（SSH密钥、`git credential` 帮助程序、GitHub CLI存储的HTTPS凭证）都会透明地应用。

```bash
# 使用你的SSH密钥，与任何其他 `git clone` 相同
hermes profile install git@github.com:your-org/internal-assistant.git

# 使用你的git凭证帮助程序
hermes profile install https://github.com/your-org/internal-assistant.git
```

如果在安装期间，克隆操作在终端中交互式地提示输入凭证，该提示会传递过来。请先像你通常对同一仓库使用 `git clone` 那样设置好认证，然后再安装。

### 分发清单 (`distribution.yaml`)

每个分发在其仓库根目录下都有一个 `distribution.yaml`：

```yaml
name: telemetry
version: 0.1.0
description: "合规性监控工具"
hermes_requires: ">=0.12.0"
author: "Your Name"
license: "MIT"
env_requires:
  - name: OPENAI_API_KEY
    description: "OpenAI API key"
    required: true
  - name: GRAPHITI_MCP_URL
    description: "内存图URL"
    required: false
    default: "http://127.0.0.1:8000/sse"
distribution_owned:   # 可选；默认为 SOUL.md, config.yaml,
                      #   mcp.json, skills/, cron/, distribution.yaml
  - SOUL.md
  - skills/compliance/
  - cron/
```

`hermes_requires` 支持 `>=`、`<=`、`==`、`!=`、`>`、`<` 或一个单独的版本号（视为 `>=`）。如果当前Hermes版本不满足规范，安装将失败并给出明确的错误信息。

`distribution_owned` 是可选的。如果设置，则更新时只有这些路径会被替换；配置文件中的其他任何内容都保持为用户所有。如果省略，则应用上述默认值。

### 发布分发

编写一个分发只需一个git push：

1. 在你的配置文件目录中，创建 `distribution.yaml`，至少包含 `name` 和 `version`。
2. 初始化一个git仓库（或使用现有的）并推送到 GitHub / GitLab / 任何Hermes可以从中克隆的主机。
3. 告诉接收者运行 `hermes profile install <你的仓库URL>`。

使用git标签进行版本化发布——克隆 `HEAD` 的接收者会获得你最新的状态，并且你可以随时更新清单中的 `version:`。

## `hermes -p` / `hermes --profile`

```bash
hermes -p <name> <command> [options]
hermes --profile <name> <command> [options]
```

全局标志，用于在特定配置文件下运行任何 Hermes 命令，而不会更改粘性默认值。这会在命令执行期间覆盖当前活动的配置文件。

| 选项 | 描述 |
|--------|-------------|
| `-p <name>`, `--profile <name>` | 本次命令使用的配置文件。 |

**示例：**

```bash
hermes -p work chat -q "检查服务器状态"
hermes --profile dev gateway start
hermes -p personal skills list
hermes -p work config edit
```

## `hermes completion`

```bash
hermes completion <shell>
```

生成 shell 自动补全脚本。包含配置文件名称和配置文件子命令的补全。

| 参数 | 描述 |
|----------|-------------|
| `<shell>` | 要生成补全的 Shell 类型：`bash`、`zsh` 或 `fish`。 |

**示例：**

```bash
# 安装自动补全
hermes completion bash >> ~/.bashrc
hermes completion zsh >> ~/.zshrc
hermes completion fish > ~/.config/fish/completions/hermes.fish

# 重新加载 shell
source ~/.bashrc
```

安装后，Tab 自动补全适用于以下场景：
- `hermes profile <TAB>` — 子命令（list、use、create 等）
- `hermes profile use <TAB>` — 配置文件名称
- `hermes -p <TAB>` — 配置文件名称

## 另请参阅

- [配置文件用户指南](../user-guide/profiles.md)
- [CLI 命令参考](./cli-commands.md)
- [常见问题 — 配置文件部分](./faq.md#profiles)