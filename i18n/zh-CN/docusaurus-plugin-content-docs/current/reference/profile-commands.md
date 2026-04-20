---
sidebar_position: 7
---

# 配置文件命令参考

本页面涵盖所有与 [Hermes 配置文件](../user-guide/profiles.md) 相关的命令。有关通用 CLI 命令，请参见 [CLI 命令参考](./cli-commands.md)。

## `hermes profile`

```bash
hermes profile <子命令>
```

管理配置文件的顶级命令。不带子命令运行 `hermes profile` 会显示帮助信息。

| 子命令 | 说明 |
|------------|-------------|
| `list` | 列出所有配置文件。 |
| `use` | 设置当前（默认）配置文件。 |
| `create` | 创建新的配置文件。 |
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
hermes profile use <名称>
```

将 `<名称>` 设置为当前配置文件。此后所有不带 `-p` 参数的 `hermes` 命令都会使用此配置文件。

| 参数 | 说明 |
|----------|-------------|
| `<名称>` | 要激活的配置文件名称。使用 `default` 可返回基础配置文件。 |

**示例：**

```bash
hermes profile use work
hermes profile use default
```

## `hermes profile create`

```bash
hermes profile create <名称> [选项]
```

创建新的配置文件。

| 参数/选项 | 说明 |
|-------------------|-------------|
| `<名称>` | 新配置文件的名称。必须是有效的目录名（字母数字、连字符、下划线）。 |
| `--clone` | 从当前配置文件复制 `config.yaml`、`.env` 和 `SOUL.md`。 |
| `--clone-all` | 复制当前配置文件的所有内容（配置、记忆、技能、会话、状态）。 |
| `--clone-from <配置文件>` | 从指定配置文件克隆，而不是当前配置文件。需配合 `--clone` 或 `--clone-all` 使用。 |
| `--no-alias` | 跳过包装脚本的创建。 |

创建配置文件 **不会** 自动将其设为终端命令的默认项目/工作区目录。若希望配置文件启动时进入特定项目，请在配置文件的 `config.yaml` 中设置 `terminal.cwd`。

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
hermes profile delete <名称> [选项]
```

删除配置文件并移除其 shell 别名。

| 参数/选项 | 说明 |
|-------------------|-------------|
| `<名称>` | 要删除的配置文件。 |
| `--yes`, `-y` | 跳过确认提示。 |

**示例：**

```bash
hermes profile delete mybot
hermes profile delete mybot --yes
```

:::warning
此操作会永久删除配置文件的整个目录，包括所有配置、记忆、会话和技能。无法删除当前正在使用的配置文件。
:::

## `hermes profile show`

```bash
hermes profile show <名称>
```

显示配置文件的详细信息，包括其主目录、配置的模型、网关状态、技能数量以及配置文件状态。

此处显示的是配置文件的 Hermes 主目录，而非终端的工作目录。终端命令实际从 `terminal.cwd`（或在本地后端启动时从启动目录）开始执行。

| 参数 | 说明 |
|----------|-------------|
| `<名称>` | 要检查的配置文件。 |

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
hermes profile alias <名称> [选项]
```

在 `~/.local/bin/<名称>` 处重新生成 shell 别名脚本。适用于意外删除别名，或在移动 Hermes 安装后需要更新别名的情况。

| 参数/选项 | 说明 |
|-------------------|-------------|
| `<名称>` | 要创建/更新别名的配置文件。 |
| `--remove` | 移除包装脚本，而不是创建它。 |
| `--name <别名>` | 自定义别名名称（默认为配置文件名称）。 |

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
hermes profile rename <旧名称> <新名称>
```

重命名配置文件。同时更新目录和 shell 别名。

| 参数 | 说明 |
|----------|-------------|
| `<旧名称>` | 当前配置文件名称。 |
| `<新名称>` | 新配置文件名称。 |

**示例：**

```bash
hermes profile rename mybot assistant
# ~/.hermes/profiles/mybot → ~/.hermes/profiles/assistant
# ~/.local/bin/mybot → ~/.local/bin/assistant
```

## `hermes profile export`

```bash
hermes profile export <名称> [选项]
```

将配置文件导出为压缩的 tar.gz 归档文件。

| 参数/选项 | 说明 |
|-------------------|-------------|
| `<名称>` | 要导出的配置文件。 |
| `-o`, `--output <路径>` | 输出文件路径（默认为 `<名称>.tar.gz`）。 |

**示例：**

```bash
hermes profile export work
# 在当前目录创建 work.tar.gz

hermes profile export work -o ./work-2026-03-29.tar.gz
```

## `hermes profile import`

```bash
hermes profile import <归档文件> [选项]
```

从 tar.gz 归档文件导入配置文件。

| 参数/选项 | 说明 |
|-------------------|-------------|
| `<归档文件>` | 要导入的 tar.gz 归档文件路径。 |
| `--name <名称>` | 导入配置文件的名称（默认为从归档文件中推断的名称）。 |

**示例：**

```bash
hermes profile import ./work-2026-03-29.tar.gz
# 从归档文件推断配置文件名称

hermes profile import ./work-2026-03-29.tar.gz --name work-restored
```

## `hermes -p` / `hermes --profile`

```bash
hermes -p <名称> <命令> [选项]
hermes --profile <名称> <命令> [选项]
```

全局标志，用于在特定配置文件下运行任意 Hermes 命令，而无需更改持久性默认设置。该标志仅在命令执行期间覆盖当前活动配置文件。

| 选项 | 说明 |
|--------|-------------|
| `-p <名称>`, `--profile <名称>` | 为此命令使用的配置文件。 |

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

生成 shell 补全脚本。包含对配置文件名称和配置文件子命令的补全支持。

| 参数 | 说明 |
|----------|-------------|
| `<shell>` | 要生成补全的 shell：`bash` 或 `zsh`。 |

**示例：**

```bash
# 安装补全
hermes completion bash >> ~/.bashrc
hermes completion zsh >> ~/.zshrc

# 重载 shell
source ~/.bashrc
```

安装后，以下情况支持 Tab 补全：
- `hermes profile <TAB>` — 子命令（list、use、create 等）
- `hermes profile use <TAB>` — 配置文件名称
- `hermes -p <TAB>` — 配置文件名称

## 另请参阅

- [配置文件用户指南](../user-guide/profiles.md)
- [CLI 命令参考](./cli-commands.md)
- [常见问题解答 — 配置文件部分](./faq.md#profiles)