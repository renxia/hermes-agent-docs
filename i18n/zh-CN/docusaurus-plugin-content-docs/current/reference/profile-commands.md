---
sidebar_position: 7
---

# 配置文件命令参考

本页涵盖所有与 [Hermes 配置文件](../user-guide/profiles.md)相关的命令。有关通用 CLI 命令，请参见 [CLI 命令参考](./cli-commands.md)。

## `hermes profile`

```bash
hermes profile <子命令>
```

管理配置文件的顶级命令。不带子命令运行 `hermes profile` 将显示帮助信息。

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出所有配置文件。 |
| `use` | 设置活动（默认）配置文件。 |
| `create` | 创建新配置文件。 |
| `delete` | 删除配置文件。 |
| `show` | 显示配置文件的详细信息。 |
| `alias` | 重新生成配置文件的 shell 别名。 |
| `rename` | 重命名配置文件。 |
| `export` | 将配置文件导出为 tar.gz 归档。 |
| `import` | 从 tar.gz 归档导入配置文件。 |
| `install` | 从 git URL 或本地目录安装配置分发。参见 [配置分发](../user-guide/profile-distributions.md)。 |
| `update` | 重新拉取由分发管理的配置文件并重新应用其包。 |
| `info` | 显示配置文件的分发元数据（源 URL、提交记录、上次更新）。 |

## `hermes profile list`

```bash
hermes profile list
```

列出所有配置文件。当前活动的配置文件用 `*` 标记。

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

将 `<name>` 设置为活动配置文件。所有后续的 `hermes` 命令（不带 `-p`）都将使用此配置文件。

| 参数 | 描述 |
|------|------|
| `<name>` | 要激活的配置文件名称。使用 `default` 返回基础配置文件。 |

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
| `<name>` | 新配置文件的名称。必须是有效的目录名称（字母数字、连字符、下划线）。 |
| `--clone` | 从当前配置文件复制 `config.yaml`、`.env` 和 `SOUL.md`。 |
| `--clone-all` | 从当前配置文件复制所有内容（配置、记忆、技能、会话、状态）。 |
| `--clone-from <profile>` | 从特定配置文件克隆，而非当前配置文件。与 `--clone` 或 `--clone-all` 一起使用。 |
| `--no-alias` | 跳过创建包装脚本。 |
| `--description "<text>"` | 一两句描述此配置文件擅长什么的文字。由看板协调器用于基于角色而非仅凭配置文件名称来路由任务。可跳过并通过 `hermes profile describe` 稍后添加。保存在 `<profile_dir>/profile.yaml` 中。 |
| `--no-skills` | 创建一个**空**配置文件，不启用任何捆绑技能。在配置文件中写入 `.no-skills` 标记，以便未来的 `hermes update` 运行不会重新注入捆绑技能集，并拒绝与 `--clone` / `--clone-all` 结合使用（否则仍会复制技能）。适用于专用的协调器配置文件或不应继承完整技能目录的沙盒配置文件。 |

创建配置文件**不会**使该配置文件目录成为终端命令的默认项目/工作区目录。如果希望配置文件从特定项目启动，请在该配置文件的 `config.yaml` 中设置 `terminal.cwd`。

**示例：**

```bash
# 空白配置文件 - 需要完整设置
hermes profile create mybot

# 仅从当前配置文件克隆配置
hermes profile create work --clone

# 从当前配置文件克隆所有内容
hermes profile create backup --clone-all

# 从特定配置文件克隆配置
hermes profile create work2 --clone --clone-from work
```

## `hermes profile describe`

```bash
hermes profile describe [<name>] [options]
```

读取或设置配置文件的描述。描述由看板协调器使用，以便根据每个配置文件的专长来路由任务，而非仅凭配置文件名称猜测。保存在 `<profile_dir>/profile.yaml` 中，因此它在重启后仍然存在，并与网关共享。

不带标志时，打印当前描述（如果为空则显示 `(no description set for '<name>')`）。

| 参数 / 选项 | 描述 |
|-------------|------|
| `<name>` | 要描述的配置文件。除非使用 `--all --auto`，否则为必填。 |
| `--text "<text>"` | 将描述设置为此确切文本（用户编写）。覆盖任何现有描述。 |
| `--auto` | 通过辅助LLM自动生成1-2句描述，基于配置文件的已安装技能、配置的模型和名称。在 `config.yaml` 的 `auxiliary.profile_describer` 下配置模型。自动生成的描述标记为 `description_auto: true`，以便仪表板可以标记它们以供审查。 |
| `--overwrite` | 与 `--auto` 一起使用时，也替换用户编写的描述（默认：跳过明确设置描述的配置文件）。 |
| `--all` | 与 `--auto` 一起使用时，扫描每个缺少描述的配置文件。 |

**示例：**

```bash
# 读取当前描述
hermes profile describe researcher

# 明确设置描述
hermes profile describe researcher --text "Reads source code and writes findings."

# 让LLM生成描述
hermes profile describe researcher --auto

# 为每个没有描述的配置文件填充描述
hermes profile describe --all --auto
```

## `hermes profile delete`

```bash
hermes profile delete <name> [options]
```

删除一个配置文件及其shell别名。

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
这将永久删除配置文件的整个目录，包括所有配置、记忆、会话和技能。无法删除当前活动的配置文件。
:::

## `hermes profile show`

```bash
hermes profile show <name>
```

显示配置文件的详细信息，包括其主目录、配置的模型、网关状态、技能计数和配置文件状态。

这显示的是配置文件的Hermes主目录，而非终端工作目录。终端命令从 `terminal.cwd` 启动（或在本地后端且 `cwd: "."` 时从启动目录启动）。

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

在 `~/.local/bin/<name>` 重新生成shell别名脚本。如果别名被意外删除，或者在移动Hermes安装后需要更新别名时很有用。

| 参数 / 选项 | 描述 |
|-------------|------|
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

重命名配置文件。更新目录和shell别名。

| 参数 | 描述 |
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

将配置文件导出为压缩的tar.gz存档。

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

从tar.gz存档导入配置文件。

| 参数 / 选项 | 描述 |
|-------------|------|
| `<archive>` | 要导入的tar.gz存档路径。 |
| `--name <name>` | 导入的配置文件的名称（默认：从存档推断）。 |

**示例：**

```bash
hermes profile import ./work-2026-03-29.tar.gz
# 从存档推断配置文件名称

hermes profile import ./work-2026-03-29.tar.gz --name work-restored
```

## 分发命令

:::tip
**不熟悉分发？** 从[配置文件分发用户指南](../user-guide/profile-distributions.md)开始——它涵盖了为什么、何时以及如何操作，并带有完整示例。以下各节是当你明确想要什么时的CLI干参考。
:::

分发将配置文件转变为一个可共享、版本化的制品，以**git仓库**形式发布。接收者只需一个命令即可安装该分发，之后可以就地更新它，而无需触及他们的本地记忆、会话或凭据。

`auth.json` 和 `.env` 永远不属于分发的一部分——它们留在安装用户的机器上。

接收者的用户数据（记忆、会话、认证、他们对 `.env` 的编辑）在初始安装和后续更新中都会被保留。

:::info
`hermes profile export` / `import` 仍然是在您自己机器上**本地备份和恢复**配置文件的正确命令。分发（`install` / `update` / `info`）是一个单独的概念：通过git发布配置文件以便他人可以安装。
:::

### `hermes profile install`

```bash
hermes profile install <source> [--name <name>] [--alias] [--force] [--yes]
```

从git URL或本地目录安装配置文件分发。

| 选项 | 描述 |
|------|------|
| `<source>` | Git URL（`github.com/user/repo`、`https://...`、`git@...`、`ssh://`、`git://`）或根目录下包含 `distribution.yaml` 的本地目录。 |
| `--name NAME` | 覆盖来自清单的配置文件名称。 |
| `--alias` | 同时创建一个shell包装器（例如 `telemetry` → `hermes -p telemetry`）。 |
| `--force` | 覆盖同名的现有配置文件。用户数据仍被保留。 |
| `-y`, `--yes` | 跳过清单预览确认提示。 |

安装程序会显示清单，列出所需的环境变量，并在请求确认前警告关于cron作业。所需的环境变量会放入一个 `.env.EXAMPLE` 文件中，您将其复制为 `.env` 并填写。

**示例：**

```bash
# 从GitHub仓库安装（简写形式）
hermes profile install github.com/kyle/telemetry-distribution --alias

# 从完整的HTTPS git URL安装
hermes profile install https://github.com/kyle/telemetry-distribution.git

# 从SSH安装
hermes profile install git@github.com:kyle/telemetry-distribution.git

# 在开发期间从本地目录安装
hermes profile install ./telemetry/
```

### `hermes profile update`

```bash
hermes profile update <name> [--force-config] [--yes]
```

从其记录的源重新克隆分发并应用更新。
分发拥有的文件（SOUL.md、skills/、cron/、mcp.json）会被覆盖；用户数据（记忆、会话、认证、.env）绝不会被触动。

默认情况下保留 `config.yaml` 以保留您的本地覆盖配置。
传递 `--force-config` 以将其重置为分发附带的配置。

### `hermes profile info`

```bash
hermes profile info <name>
```

打印配置文件的分发清单——名称、版本、所需的Hermes版本、作者、环境变量要求、源URL/路径，以及上次执行 `install` 或 `update` 时记录的 `Installed:` 时间戳。在安装共享配置文件之前，可用于检查其需求，以及用于发现“此配置文件是6个月前安装的且未更新”。

`hermes profile list` 还会在 `Distribution` 列中显示分发名称和版本，`hermes profile show <name>` / `delete <name>` 也会显示源URL，以便您一眼看出哪些配置文件来自git仓库，哪些是本地创建的。

### 私有分发

私有git仓库无需额外配置即可作为分发源——安装程序会调用您正常的 `git` 二进制文件，因此您shell已设置的任何认证（SSH密钥、`git credential` helper、GitHub CLI存储的HTTPS凭据）都透明适用。

```bash
# 使用您的SSH密钥，与任何其他 `git clone` 相同
hermes profile install git@github.com:your-org/internal-assistant.git

# 使用您的git凭据助手
hermes profile install https://github.com/your-org/internal-assistant.git
```

如果在安装过程中，克隆操作在您的终端中交互式地提示输入凭据，则该提示会正常流程进行。首先按照您通常针对同一仓库使用 `git clone` 的方式设置认证，然后再安装。

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
    description: "OpenAI API密钥"
    required: true
  - name: GRAPHITI_MCP_URL
    description: "记忆图URL"
    required: false
    default: "http://127.0.0.1:8000/sse"
distribution_owned:   # 可选；默认为 SOUL.md, config.yaml,
                      #   mcp.json, skills/, cron/, distribution.yaml
  - SOUL.md
  - skills/compliance/
  - cron/
```

`hermes_requires` 支持 `>=`、`<=`、`==`、`!=`、`>`、`<` 或单独的版本号（视为 `>=`）。如果当前Hermes版本不满足规范，安装将失败并给出明确错误。

`distribution_owned` 是可选的。如果设置，则只有这些路径在更新时被替换；配置文件中的其他任何内容都保持用户所有。如果省略，则应用上述默认值。

### 发布分发

创建分发只需一次git推送：

1. 在您的配置文件目录中，创建一个至少包含 `name` 和 `version` 的 `distribution.yaml`。
2. 初始化一个git仓库（或使用现有仓库）并推送到 GitHub / GitLab / Hermes 可以克隆的任何主机。
3. 告诉接收者运行 `hermes profile install <your-repo-url>`。

使用git标签进行版本发布——克隆 `HEAD` 的接收者会获得您的最新状态，您随时可以在清单中更新 `version:`。

## `hermes -p` / `hermes --profile`

```bash
hermes -p <名称> <命令> [选项]
hermes --profile <名称> <命令> [选项]
```

全局标志，用于在特定配置文件下运行任何 Hermes 命令，而无需更改粘性默认设置。此选项会在命令执行期间覆盖当前活动的配置文件。

| 选项 | 描述 |
|------|------|
| `-p <名称>`, `--profile <名称>` | 本次命令使用的配置文件。 |

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

生成 Shell 补全脚本。包括配置文件名称和配置文件子命令的补全。

| 参数 | 描述 |
|------|------|
| `<shell>` | 为其生成补全的 Shell：`bash`、`zsh` 或 `fish`。 |

**示例：**

```bash
# 安装补全
hermes completion bash >> ~/.bashrc
hermes completion zsh >> ~/.zshrc
hermes completion fish > ~/.config/fish/completions/hermes.fish

# 重新加载 Shell
source ~/.bashrc
```

安装后，Tab 补全将适用于：
- `hermes profile <TAB>` — 子命令（list、use、create 等）
- `hermes profile use <TAB>` — 配置文件名称
- `hermes -p <TAB>` — 配置文件名称

## 另请参阅

- [配置文件用户指南](../user-guide/profiles.md)
- [CLI 命令参考](./cli-commands.md)
- [常见问题 — 配置文件部分](./faq.md#profiles)