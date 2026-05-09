---
sidebar_position: 7
---

# 配置文件命令参考

此页面涵盖所有与 [Hermes 配置文件](../user-guide/profiles.md) 相关的命令。有关通用 CLI 命令，请参阅 [CLI 命令参考](./cli-commands.md)。

## `hermes profile`

```bash
hermes profile <子命令>
```

用于管理配置文件的一级命令。不带子命令运行 `hermes profile` 会显示帮助信息。

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出所有配置文件。 |
| `use` | 设置活动（默认）配置文件。 |
| `create` | 创建新配置文件。 |
| `delete` | 删除配置文件。 |
| `show` | 显示配置文件的详细信息。 |
| `alias` | 为配置文件重新生成 shell 别名。 |
| `rename` | 重命名配置文件。 |
| `export` | 将配置文件导出为 tar.gz 归档文件。 |
| `import` | 从 tar.gz 归档文件导入配置文件。 |

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

将 `<name>` 设置为激活的配置文件。所有后续的 `hermes` 命令（不带 `-p` 参数）都将使用此配置文件。

| 参数 | 说明 |
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

创建一个新配置文件。

| 参数 / 选项 | 说明 |
|-------------|------|
| `<name>` | 新配置文件的名称。必须是有效的目录名（字母数字、连字符、下划线）。 |
| `--clone` | 从当前配置文件复制 `config.yaml`、`.env` 和 `SOUL.md`。 |
| `--clone-all` | 从当前配置文件复制所有内容（配置、记忆、技能、会话、状态）。 |
| `--clone-from <profile>` | 从指定配置文件克隆，而非当前配置文件。需与 `--clone` 或 `--clone-all` 配合使用。 |
| `--no-alias` | 跳过包装脚本创建。 |

创建配置文件**不会**将该配置文件目录设为终端命令的默认项目/工作目录。如果希望某个配置文件在特定项目中启动，请在该配置文件的 `config.yaml` 中设置 `terminal.cwd`。

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

删除配置文件并移除其 shell 别名。

| 参数 / 选项 | 说明 |
|-------------|------|
| `<name>` | 要删除的配置文件。 |
| `--yes`, `-y` | 跳过确认提示。 |

**示例：**

```bash
hermes profile delete mybot
hermes profile delete mybot --yes
```

:::warning
这将永久删除配置文件的整个目录，包括所有配置、记忆、会话和技能。无法删除当前激活的配置文件。
:::

## `hermes profile show`

```bash
hermes profile show <name>
```

显示配置文件的详细信息，包括其主目录、配置的模型、网关状态、技能数量以及配置文件状态。

此处显示的是配置文件的 Hermes 主目录，而非终端工作目录。终端命令从 `terminal.cwd` 启动（或在本地后端从启动目录启动，当 `cwd: "."` 时）。

| 参数 | 说明 |
|------|------|
| `<name>` | 要检查的配置文件。 |

**示例：**

```bash
$ hermes profile show work
配置文件: work
路径:    ~/.hermes/profiles/work
模型:   anthropic/claude-sonnet-4 (anthropic)
网关: 已停止
技能:  12
.env:    存在
SOUL.md: 存在
别名:   ~/.local/bin/work
```

## `hermes profile alias`

```bash
hermes profile alias <name> [options]
```

在 `~/.local/bin/<name>` 重新生成 shell 别名脚本。如果别名被意外删除，或移动 Hermes 安装位置后需要更新别名时，此命令很有用。

| 参数 / 选项 | 说明 |
|-------------|------|
| `<name>` | 要为其创建/更新别名的配置文件。 |
| `--remove` | 移除包装脚本，而非创建它。 |
| `--name <alias>` | 自定义别名名称（默认为配置文件名称）。 |

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
| `<new-name>` | 新配置文件名称。 |

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

从 tar.gz 归档文件导入配置文件。

| 参数 / 选项 | 说明 |
|-------------|------|
| `<archive>` | 要导入的 tar.gz 归档文件路径。 |
| `--name <name>` | 导入后配置文件的名称（默认：从归档文件中推断）。 |

**示例：**

```bash
hermes profile import ./work-2026-03-29.tar.gz
# 从归档文件推断配置文件名称

hermes profile import ./work-2026-03-29.tar.gz --name work-restored
```

## 分发命令

:::tip
**刚接触分发？** 请从[配置文件分发用户指南](../user-guide/profile-distributions.md)开始 — 它涵盖了为什么、何时以及如何使用，并附有完整示例。以下各节是 CLI 参考，适用于您明确知道自己想要什么的情况。
:::

分发将配置文件转换为可共享、带版本控制的制品，并以 **git 仓库**的形式发布。接收者只需一条命令即可安装该分发，后续可在不触及本地记忆、会话或凭据的情况下就地更新。

`auth.json` 和 `.env` 永远不会成为分发的一部分 — 它们保留在安装用户的机器上。

接收者的用户数据（记忆、会话、认证、对 `.env` 的自定义编辑）在初始安装和后续更新中始终会被保留。

:::info
`hermes profile export` / `import` 仍然是您在自己机器上**本地备份和恢复**配置文件的正确命令。分发（`install` / `update` / `info`）是一个独立的概念：通过 git 发送配置文件，以便其他人可以安装它。
:::

### `hermes profile install`

```bash
hermes profile install <source> [--name <name>] [--alias] [--force] [--yes]
```

从 git URL 或本地目录安装配置文件分发。

| 选项 | 说明 |
|------|------|
| `<source>` | Git URL（`github.com/user/repo`、`https://...`、`git@...`、`ssh://`、`git://`）或包含根目录下 `distribution.yaml` 的本地目录。 |
| `--name NAME` | 覆盖清单中的配置文件名称。 |
| `--alias` | 同时创建 shell 包装脚本（例如 `telemetry` → `hermes -p telemetry`）。 |
| `--force` | 覆盖同名的现有配置文件。用户数据仍会被保留。 |
| `-y`, `--yes` | 跳过清单预览确认提示。 |

安装程序会显示清单，列出所需的环境变量，并在请求确认前警告 cron 作业。所需的环境变量将写入 `.env.EXAMPLE` 文件，您需要将其复制为 `.env` 并填写。

**示例：**

```bash
# 从 GitHub 仓库安装（简写）
hermes profile install github.com/kyle/telemetry-distribution --alias

# 从完整的 HTTPS git URL 安装
hermes profile install https://github.com/kyle/telemetry-distribution.git

# 从 SSH 安装
hermes profile install git@github.com:kyle/telemetry-distribution.git

# 在开发期间从本地目录安装
hermes profile install ./telemetry/
```

### `hermes profile update`

```bash
hermes profile update <name> [--force-config] [--yes]
```

从记录的分发源重新克隆分发并应用更新。分发拥有的文件（`SOUL.md`、`skills/`、`cron/`、`mcp.json`）会被覆盖；用户数据（记忆、会话、认证、`.env`）绝不会被触及。

默认情况下，`config.yaml` 会被保留以维持您的本地覆盖。传递 `--force-config` 可将其重置为分发附带的配置。

### `hermes profile info`

```bash
hermes profile info <name>
```

打印配置文件的清单 — 名称、版本、所需的 Hermes 版本、作者、环境变量要求、源 URL/路径，以及分发上次 `install` 或 `update` 时记录的 `Installed:` 时间戳。在安装共享配置文件前检查其需求，或发现“此配置文件已安装 6 个月且未更新”时非常有用。

`hermes profile list` 也会在 `Distribution` 列中显示分发名称和版本，而 `hermes profile show <name>` / `delete <name>` 会显示源 URL，以便您一目了然地分辨哪些配置文件来自 git 仓库，哪些是本地创建的。

### 私有分发

私有 git 仓库无需额外配置即可作为分发源 — 安装时会调用您正常的 `git` 二进制文件，因此您的 shell 已设置的任何认证方式（SSH 密钥、`git credential` 助手、GitHub CLI 存储的 HTTPS 凭据）都会透明地应用。

```bash
# 使用您的 SSH 密钥，与任何其他 `git clone` 相同
hermes profile install git@github.com:your-org/internal-assistant.git

# 使用您的 git credential 助手
hermes profile install https://github.com/your-org/internal-assistant.git
```

如果在安装期间克隆操作在终端中交互式提示输入凭据，该提示会传递过来。请先按正常使用 `git clone` 相同仓库的方式设置好您的认证，然后再进行安装。

### 分发清单（`distribution.yaml`）

每个分发在其仓库根目录下都有一个 `distribution.yaml`：

```yaml
name: telemetry
version: 0.1.0
description: "合规监控工具"
hermes_requires: ">=0.12.0"
author: "您的姓名"
license: "MIT"
env_requires:
  - name: OPENAI_API_KEY
    description: "OpenAI API 密钥"
    required: true
  - name: GRAPHITI_MCP_URL
    description: "记忆图谱 URL"
    required: false
    default: "http://127.0.0.1:8000/sse"
distribution_owned:   # 可选；默认为 SOUL.md、config.yaml、
                      #   mcp.json、skills/、cron/、distribution.yaml
  - SOUL.md
  - skills/compliance/
  - cron/
```

`hermes_requires` 支持 `>=`、`<=`、`==`、`!=`、`>`、`<` 或裸版本（视为 `>=`）。如果当前 Hermes 版本不满足规范，安装将失败并显示明确的错误。

`distribution_owned` 是可选的。如果设置，更新时仅替换这些路径；配置文件中的其他内容仍为用户所有。如果省略，则应用上述默认值。

### 发布分发

创建分发只需执行 git push：

1. 在您的配置文件目录中，创建至少包含 `name` 和 `version` 的 `distribution.yaml`。
2. 初始化 git 仓库（或使用现有仓库）并推送到 GitHub / GitLab / Hermes 可克隆的任何主机。
3. 告知接收者运行 `hermes profile install <your-repo-url>`。

使用 git 标签进行版本化发布 — 克隆 `HEAD` 的接收者将获得您的最新状态，您始终可以在清单中提升 `version:`。

## `hermes -p` / `hermes --profile`

```bash
hermes -p <名称> <命令> [选项]
hermes --profile <名称> <命令> [选项]
```

全局标志，用于在特定配置文件中运行任意 Hermes 命令，而无需更改粘性默认值。此操作将覆盖命令执行期间的当前活动配置文件。

| 选项 | 描述 |
|--------|-------------|
| `-p <名称>`, `--profile <名称>` | 为此命令使用的配置文件。 |

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

生成 shell 补全脚本。包括配置文件名称和配置文件子命令的补全。

| 参数 | 描述 |
|----------|-------------|
| `<shell>` | 要为其生成补全的 shell：`bash` 或 `zsh`。 |

**示例：**

```bash
# 安装补全
hermes completion bash >> ~/.bashrc
hermes completion zsh >> ~/.zshrc

# 重新加载 shell
source ~/.bashrc
```

安装后，Tab 补全功能适用于：
- `hermes profile <TAB>` — 子命令（list、use、create 等）
- `hermes profile use <TAB>` — 配置文件名称
- `hermes -p <TAB>` — 配置文件名称

## 另见

- [配置文件用户指南](../user-guide/profiles.md)
- [CLI 命令参考](./cli-commands.md)
- [常见问题 — 配置文件部分](./faq.md#profiles)