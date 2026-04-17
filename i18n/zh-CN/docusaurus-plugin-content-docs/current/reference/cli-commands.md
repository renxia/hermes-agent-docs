---
sidebar_position: 1
title: "CLI 命令参考"
description: "Hermes 终端命令和命令族权威参考"
---

# CLI 命令参考

本页面涵盖您从 shell 中运行的 **终端命令**。

有关聊天中的斜杠命令，请参阅 [斜杠命令参考](./slash-commands.md)。

## 全局入口点

```bash
hermes [global-options] <command> [subcommand/options]
```

### 全局选项

| 选项 | 描述 |
|--------|-------------|
| `--version`, `-V` | 显示版本并退出。 |
| `--profile <name>`, `-p <name>` | 选择本次调用使用的 Hermes profile。它会覆盖 `hermes profile use` 设置的粘性默认值。 |
| `--resume <session>`, `-r <session>` | 按 ID 或标题恢复之前的会话。 |
| `--continue [name]`, `-c [name]` | 恢复最近的会话，或匹配特定标题的最近会话。 |
| `--worktree`, `-w` | 在隔离的 git 工作树中启动，用于并行代理工作流。 |
| `--yolo` | 绕过危险命令的批准提示。 |
| `--pass-session-id` | 将会话 ID 包含在代理的系统提示中。 |

## 顶级命令

| 命令 | 用途 |
|---------|---------|
| `hermes chat` | 与代理进行交互式或单次聊天。 |
| `hermes model` | 交互式选择默认的提供商和模型。 |
| `hermes gateway` | 运行或管理消息网关服务。 |
| `hermes setup` | 交互式设置向导，用于配置所有或部分配置。 |
| `hermes whatsapp` | 配置和配对 WhatsApp 桥接。 |
| `hermes auth` | 管理凭证——添加、列出、移除、重置、设置策略。处理 Codex/Nous/Anthropic 的 OAuth 流程。 |
| `hermes login` / `logout` | **已弃用** — 请使用 `hermes auth` 代替。 |
| `hermes status` | 显示代理、认证和平台状态。 |
| `hermes cron` | 检查和维护定时任务调度器。 |
| `hermes webhook` | 管理用于事件驱动激活的动态 Webhook 订阅。 |
| `hermes doctor` | 诊断配置和依赖项问题。 |
| `hermes dump` | 可复制粘贴的设置摘要，用于支持/调试。 |
| `hermes debug` | 调试工具——上传日志和系统信息以供支持。 |
| `hermes backup` | 将 Hermes 主目录备份为 zip 文件。 |
| `hermes import` | 从 zip 文件恢复 Hermes 备份。 |
| `hermes logs` | 查看、跟踪和过滤代理/网关/错误日志文件。 |
| `hermes config` | 显示、编辑、迁移和查询配置文件。 |
| `hermes pairing` | 批准或撤销消息配对代码。 |
| `hermes skills` | 浏览、安装、发布、审计和配置技能。 |
| `hermes honcho` | 管理 Honcho 跨会话内存集成。 |
| `hermes memory` | 配置外部内存提供商。 |
| `hermes acp` | 作为 ACP 服务器运行 Hermes，用于编辑器集成。 |
| `hermes mcp` | 管理 MCP 服务器配置，并将 Hermes 作为 MCP 服务器运行。 |
| `hermes plugins` | 管理 Hermes 代理插件（安装、启用、禁用、移除）。 |
| `hermes tools` | 配置每个平台的启用工具。 |
| `hermes sessions` | 浏览、导出、修剪、重命名和删除会话。 |
| `hermes insights` | 显示 token/成本/活动分析。 |
| `hermes claw` | OpenClaw 迁移助手。 |
| `hermes dashboard` | 启动 Web 仪表板，用于管理配置、API 密钥和会话。 |
| `hermes debug` | 调试工具——上传日志和系统信息以供支持。 |
| `hermes backup` | 将 Hermes 主目录备份为 zip 文件。 |
| `hermes import` | 从 zip 文件恢复 Hermes 备份。 |
| `hermes profile` | 管理 profile——多个隔离的 Hermes 实例。 |
| `hermes completion` | 打印 shell 补全脚本 (bash/zsh)。 |
| `hermes version` | 显示版本信息。 |
| `hermes update` | 拉取最新代码并重新安装依赖项。 |
| `hermes uninstall` | 从系统中移除 Hermes。 |

## `hermes chat`

```bash
hermes chat [options]
```

常用选项：

| 选项 | 描述 |
|--------|-------------|
| `-q`, `--query "..."` | 单次、非交互式提示。 |
| `-m`, `--model <model>` | 覆盖本次运行的模型。 |
| `-t`, `--toolsets <csv>` | 启用逗号分隔的工具集。 |
| `--provider <provider>` | 强制指定提供商：`auto`, `openrouter`, `nous`, `openai-codex`, `copilot-acp`, `copilot`, `anthropic`, `gemini`, `huggingface`, `zai`, `kimi-coding`, `minimax`, `minimax-cn`, `kilocode`, `xiaomi`, `arcee`。 |
| `-s`, `--skills <name>` | 为会话预加载一个或多个技能（可重复或逗号分隔）。 |
| `-v`, `--verbose` | 详细输出。 |
| `-Q`, `--quiet` | 编程模式：抑制横幅/加载动画/工具预览。 |
| `--image <path>` | 将本地图片附加到单个查询。 |
| `--resume <session>` / `--continue [name]` | 直接从 `chat` 恢复会话。 |
| `--worktree` | 为本次运行创建一个隔离的 git 工作树。 |
| `--checkpoints` | 在破坏性文件更改之前启用文件系统检查点。 |
| `--yolo` | 跳过批准提示。 |
| `--pass-session-id` | 将会话 ID 传递到系统提示中。 |
| `--source <tag>` | 会话来源标签，用于过滤（默认为 `cli`）。对于不应出现在用户会话列表中的第三方集成，请使用 `tool`。 |
| `--max-turns <N>` | 每个对话轮次的工具调用最大迭代次数（默认为 90，或配置中的 `agent.max_turns`）。 |

示例：

```bash
hermes
hermes chat -q "总结最新的 PR"
hermes chat --provider openrouter --model anthropic/claude-sonnet-4.6
hermes chat --toolsets web,terminal,skills
hermes chat --quiet -q "只返回 JSON"
hermes chat --worktree -q "审查此仓库并打开 PR"
```

## `hermes model`

交互式提供商 + 模型选择器。**这是添加新提供商、设置 API 密钥和运行 OAuth 流程的命令。** 请在终端中运行它——而不是在活动的 Hermes chat 会话内部。

```bash
hermes model
```

当您需要执行以下操作时使用此命令：
- **添加新提供商**（OpenRouter、Anthropic、Copilot、DeepSeek、自定义等）
- 登录 OAuth 支持的提供商（Anthropic、Copilot、Codex、Nous Portal）
- 输入或更新 API 密钥
- 从提供商特定的模型列表中选择
- 配置自定义/自托管端点
- 将新的默认值保存到配置中

:::warning hermes model 与 /model 的区别
**`hermes model`**（在终端中运行，在任何 Hermes 会话外部）是**完整的提供商设置向导**。它可以添加新提供商、运行 OAuth 流程、提示输入 API 密钥和配置端点。

**`/model`**（在活动的 Hermes chat 会话中输入）只能**在您已设置的提供商和模型之间切换**。它不能添加新提供商、运行 OAuth 或提示输入 API 密钥。

**如果您需要添加新提供商：** 请先退出您的 Hermes 会话（`Ctrl+C` 或 `/quit`），然后从终端提示符运行 `hermes model`。
:::

### `/model` 斜杠命令（会话中）

无需离开会话即可在已配置的模型之间切换：

```
/model                              # 显示当前模型和可用选项
/model claude-sonnet-4              # 切换模型（自动检测提供商）
/model zai:glm-5                    # 切换提供商和模型
/model custom:qwen-2.5              # 使用自定义端点的模型
/model custom                       # 从自定义端点自动检测模型
/model custom:local:qwen-2.5        # 使用命名自定义提供商
/model openrouter:anthropic/claude-sonnet-4  # 切换回云端
```

默认情况下，`/model` 的更改**仅对当前会话有效**。添加 `--global` 可将更改持久化到 `config.yaml`：

```
/model claude-sonnet-4 --global     # 切换并保存为新的默认值
```

:::info 如果我只看到 OpenRouter 的模型怎么办？
如果您只配置了 OpenRouter，`/model` 只会显示 OpenRouter 的模型。要添加另一个提供商（Anthropic、DeepSeek、Copilot 等），请退出会话，然后从终端运行 `hermes model`。
:::

提供商和基础 URL 的更改会自动持久化到 `config.yaml`。当从自定义端点切换离开时，会清除陈旧的基础 URL，以防止其泄露到其他提供商中。

## `hermes gateway`

```bash
hermes gateway <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `run` | 在前台运行网关。推荐用于 WSL、Docker 和 Termux。 |
| `start` | 启动已安装的 systemd/launchd 后台服务。 |
| `stop` | 停止服务（或前台进程）。 |
| `restart` | 重启服务。 |
| `status` | 显示服务状态。 |
| `install` | 安装为 systemd（Linux）或 launchd（macOS）后台服务。 |
| `uninstall` | 移除已安装的服务。 |
| `setup` | 交互式消息平台设置。 |

:::tip WSL 用户
请使用 `hermes gateway run` 代替 `hermes gateway start` — WSL 的 systemd 支持不可靠。使用 `tmux new -s hermes 'hermes gateway run'` 进行封装以保持持久性。有关详细信息，请参阅 [WSL FAQ](/docs/reference/faq#wsl-gateway-keeps-disconnecting-or-hermes-gateway-start-fails)。
:::

## `hermes setup`

```bash
hermes setup [model|tts|terminal|gateway|tools|agent] [--non-interactive] [--reset]
```

使用完整的向导或跳转到特定部分：

| 部分 | 描述 |
|---------|-------------|
| `model` | 提供商和模型设置。 |
| `terminal` | 终端后端和沙盒设置。 |
| `gateway` | 消息平台设置。 |
| `tools` | 按平台启用/禁用工具。 |
| `agent` | 代理行为设置。 |

选项：

| 选项 | 描述 |
|--------|-------------|
| `--non-interactive` | 使用默认值/环境变量值，无需提示。 |
| `--reset` | 在设置前将配置重置为默认值。 |

## `hermes whatsapp`

```bash
hermes whatsapp
```

运行 WhatsApp 配对/设置流程，包括模式选择和二维码配对。

## `hermes login` / `hermes logout` *(已弃用)*

:::caution
`hermes login` 已移除。请使用 `hermes auth` 管理 OAuth 凭证，使用 `hermes model` 选择提供商，或使用 `hermes setup` 进行完整的交互式设置。
:::

## `hermes auth`

管理凭证池，用于相同提供商的密钥轮换。有关完整文档，请参阅 [凭证池](/docs/user-guide/features/credential-pools)。

```bash
hermes auth                                              # 交互式向导
hermes auth list                                         # 显示所有池
hermes auth list openrouter                              # 显示特定提供商
hermes auth add openrouter --api-key sk-or-v1-xxx        # 添加 API 密钥
hermes auth add anthropic --type oauth                   # 添加 OAuth 凭证
hermes auth remove openrouter 2                          # 按索引移除
hermes auth reset openrouter                             # 清除冷却时间
```

子命令：`add`, `list`, `remove`, `reset`。不带子命令调用时，启动交互式管理向导。

## `hermes status`

```bash
hermes status [--all] [--deep]
```

| 选项 | 描述 |
|--------|-------------|
| `--all` | 以可分享的脱敏格式显示所有详细信息。 |
| `--deep` | 运行更深入的检查，可能需要更长时间。 |

## `hermes cron`

```bash
hermes cron <list|create|edit|pause|resume|run|remove|status|tick>
```

| 子命令 | 描述 |
|------------|-------------|
| `list` | 显示计划任务。 |
| `create` / `add` | 从提示创建计划任务，可选地通过重复的 `--skill` 附加一个或多个技能。 |
| `edit` | 更新任务的计划、提示、名称、交付、重复次数或附加的技能。支持 `--clear-skills`, `--add-skill` 和 `--remove-skill`。 |
| `pause` | 暂停任务，但不删除它。 |
| `resume` | 恢复已暂停的任务，并计算其下一个未来运行时间。 |
| `run` | 在下一个调度器滴答时触发任务。 |
| `remove` | 删除计划任务。 |
| `status` | 检查定时任务调度器是否正在运行。 |
| `tick` | 运行到期的任务一次并退出。 |

## `hermes webhook`

```bash
hermes webhook <subscribe|list|remove|test>
```

管理用于事件驱动代理激活的动态 Webhook 订阅。要求配置文件中启用 Webhook 平台——如果未配置，将打印设置说明。

| 子命令 | 描述 |
|------------|-------------|
| `subscribe` / `add` | 创建 Webhook 路由。返回用于在您的服务上配置的 URL 和 HMAC 密钥。 |
| `list` / `ls` | 显示所有代理创建的订阅。 |
| `remove` / `rm` | 删除动态订阅。配置文件中的静态路由不受影响。 |
| `test` | 发送测试 POST 以验证订阅是否正常工作。 |

### `hermes webhook subscribe`

```bash
hermes webhook subscribe <name> [options]
```

| 选项 | 描述 |
|--------|-------------|
| `--prompt` | 包含 `{dot.notation}` 负载引用的提示模板。 |
| `--events` | 接受的逗号分隔事件类型（例如：`issues,pull_request`）。空值 = 全部。 |
| `--description` | 人类可读的描述。 |
| `--skills` | 要加载的逗号分隔技能名称，用于代理运行。 |
| `--deliver` | 交付目标：`log` (默认), `telegram`, `discord`, `slack`, `github_comment`。 |
| `--deliver-chat-id` | 跨平台交付的目标聊天/频道 ID。 |
| `--secret` | 自定义 HMAC 密钥。如果省略，则自动生成。 |

订阅持久化到 `~/.hermes/webhook_subscriptions.json`，并且在不重启网关的情况下由 Webhook 适配器热重载。

## `hermes doctor`

```bash
hermes doctor [--fix]
```

| 选项 | 描述 |
|--------|-------------|
| `--fix` | 尝试进行可能的自动修复。 |

## `hermes dump`

```bash
hermes dump [--show-keys]
```

输出一个紧凑的纯文本摘要，涵盖您的整个 Hermes 设置。设计用于在请求支持时粘贴到 Discord、GitHub issue 或 Telegram 中——没有 ANSI 颜色，没有特殊格式，只有数据。

| 选项 | 描述 |
|--------|-------------|
| `--show-keys` | 显示脱敏的 API 密钥前缀（前 4 位和后 4 位），而不是仅显示 `set`/`not set`。 |

### 包含内容

| 部分 | 详情 |
|---------|---------|
| **头部** | Hermes 版本、发布日期、git 提交哈希 |
| **环境** | OS、Python 版本、OpenAI SDK 版本 |
| **身份** | 活动 profile 名称、HERMES_HOME 路径 |
| **模型** | 配置的默认模型和提供商 |
| **终端** | 后端类型（local, docker, ssh 等） |
| **API 密钥** | 所有 22 个提供商/工具 API 密钥的存在性检查 |
| **功能** | 启用的工具集、MCP 服务器数量、内存提供商 |
| **服务** | 网关状态、配置的消息平台 |
| **工作负载** | Cron 任务计数、已安装技能计数 |
| **配置覆盖** | 任何与默认值不同的配置值 |

### 示例输出

```
--- hermes dump ---
version:          0.8.0 (2026.4.8) [af4abd2f]
os:               Linux 6.14.0-37-generic x86_64
python:           3.11.14
openai_sdk:       2.24.0
profile:          default
hermes_home:      ~/.hermes
model:            anthropic/claude-opus-4.6
provider:         openrouter
terminal:         local

api_keys:
  openrouter           set
  openai               not set
  anthropic            set
  nous                 not set
  firecrawl            set
  ...

features:
  toolsets:           all
  mcp_servers:        0
  memory_provider:    built-in
  gateway:            running (systemd)
  platforms:          telegram, discord
  cron_jobs:          3 active / 5 total
  skills:             42

config_overrides:
  agent.max_turns: 250
  compression.threshold: 0.85
  display.streaming: True
--- end dump ---
```

### 何时使用

- 在 GitHub 报告错误时——将 dump 粘贴到您的 issue 中
- 在 Discord 寻求帮助时——在代码块中分享它
- 将您的设置与其他人的设置进行比较
- 当某些功能不工作时进行快速的健康检查

:::tip
`hermes dump` 专门用于分享。进行交互式诊断，请使用 `hermes doctor`。进行视觉概览，请使用 `hermes status`。
:::

## `hermes debug`

```bash
hermes debug share [options]
```

将调试报告（系统信息 + 最近日志）上传到粘贴服务并获取可分享的 URL。对于快速支持请求很有用——包含帮助人员诊断您问题所需的一切。

| 选项 | 描述 |
|--------|-------------|
| `--lines <N>` | 每个日志文件中包含的日志行数（默认为 200）。 |
| `--expire <days>` | 粘贴过期天数（默认为 7）。 |
| `--local` | 在本地打印报告，而不是上传。 |

报告包括系统信息（OS、Python 版本、Hermes 版本）、最近的代理和网关日志（每个文件 512 KB 限制）以及脱敏的 API 密钥状态。密钥始终是脱敏的——不会上传任何秘密。

按顺序尝试的粘贴服务：paste.rs, dpaste.com。

### 示例

```bash
hermes debug share              # 上传调试报告，打印 URL
hermes debug share --lines 500  # 包含更多日志行
hermes debug share --expire 30  # 保留粘贴 30 天
hermes debug share --local      # 将报告打印到终端（不上传）
```

## `hermes backup`

```bash
hermes backup [options]
```

创建一个包含您的 Hermes 配置、技能、会话和数据的 zip 存档。备份不包含 hermes-agent 代码库本身。

| 选项 | 描述 |
|--------|-------------|
| `-o`, `--output <path>` | zip 文件的输出路径（默认为 `~/hermes-backup-<timestamp>.zip`）。 |
| `-q`, `--quick` | 快速快照：仅包含关键状态文件（config.yaml, state.db, .env, auth, cron jobs）。比完整备份快得多。 |
| `-l`, `--label <name>` | 快照标签（仅与 `--quick` 使用）。 |

备份使用 SQLite 的 `backup()` API 进行安全复制，因此即使 Hermes 正在运行也能正常工作（WAL 模式安全）。

### 示例

```bash
hermes backup                           # 完整备份到 ~/hermes-backup-*.zip
hermes backup -o /tmp/hermes.zip        # 完整备份到指定路径
hermes backup --quick                   # 快速状态快照
hermes backup --quick --label "pre-upgrade"  # 带标签的快速快照
```

## `hermes import`

```bash
hermes import <zipfile> [options]
```

将先前创建的 Hermes 备份恢复到您的 Hermes 主目录。

| 选项 | 描述 |
|--------|-------------|
| `-f`, `--force` | 强制覆盖现有文件，无需确认。 |

## `hermes logs`

```bash
hermes logs [log_name] [options]
```

查看、跟踪和过滤 Hermes 日志文件。所有日志都存储在 `~/.hermes/logs/`（或非默认 profile 的 `<profile>/logs/`）。

### 日志文件

| 名称 | 文件 | 捕获内容 |
|------|------|-----------------|
| `agent` (默认) | `agent.log` | 所有代理活动——API 调用、工具分派、会话生命周期（INFO 及以上） |
| `errors` | `errors.log` | 仅警告和错误——agent.log 的过滤子集 |
| `gateway` | `gateway.log` | 消息网关活动——平台连接、消息分派、Webhook 事件 |

### 选项

| 选项 | 描述 |
|--------|-------------|
| `log_name` | 要查看的日志：`agent` (默认), `errors`, `gateway`，或 `list` 以显示可用文件和大小。 |
| `-n`, `--lines <N>` | 要显示的行数（默认为 50）。 |
| `-f`, `--follow` | 实时跟踪日志，类似于 `tail -f`。按 Ctrl+C 停止。 |
| `--level <LEVEL>` | 要显示的最小日志级别：`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`。 |
| `--session <ID>` | 过滤包含会话 ID 子字符串的行。 |
| `--since <TIME>` | 显示从相对时间点开始的行：`30m`, `1h`, `2d` 等。支持 `s` (秒), `m` (分钟), `h` (小时), `d` (天)。 |
| `--component <NAME>` | 按组件过滤：`gateway`, `agent`, `tools`, `cli`, `cron`。 |

### 示例

```bash
# 查看 agent.log 的最后 50 行（默认）
hermes logs

# 实时跟踪 agent.log
hermes logs -f

# 查看 gateway.log 的最后 100 行
hermes logs gateway -n 100

# 只显示过去一小时的警告和错误
hermes logs --level WARNING --since 1h

# 按特定会话过滤
hermes logs --session abc123

# 跟踪 errors.log，从 30 分钟前开始
hermes logs errors --since 30m -f

# 列出所有日志文件及其大小
hermes logs list
```

### 过滤

可以组合过滤条件。当多个过滤器处于活动状态时，日志行必须通过**所有**过滤器才会显示：

```bash
# 包含会话 "tg-12345" 的过去 2 小时内的 WARNING+ 行
hermes logs --level WARNING --since 2h --session tg-12345
```

没有可解析时间戳的行在 `--since` 激活时包含（它们可能是多行日志条目的延续行）。没有可检测级别的行在 `--level` 激活时包含。

### 日志轮转

Hermes 使用 Python 的 `RotatingFileHandler`。旧日志会自动轮转——请查找 `agent.log.1`, `agent.log.2` 等。`hermes logs list` 子命令显示所有日志文件，包括已轮转的。

## `hermes config`

```bash
hermes config <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `show` | 显示当前的配置值。 |
| `edit` | 在您的编辑器中打开 `config.yaml`。 |
| `set <key> <value>` | 设置一个配置值。 |
| `path` | 打印配置文件路径。 |
| `env-path` | 打印 `.env` 文件路径。 |
| `check` | 检查缺失或过时的配置。 |
| `migrate` | 交互式添加新引入的选项。 |

## `hermes pairing`

```bash
hermes pairing <list|approve|revoke|clear-pending>
```

| 子命令 | 描述 |
|------------|-------------|
| `list` | 显示待处理和已批准的用户。 |
| `approve <platform> <code>` | 批准配对代码。 |
| `revoke <platform> <user-id>` | 撤销用户的访问权限。 |
| `clear-pending` | 清除待处理的配对代码。 |

## `hermes skills`

```bash
hermes skills <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `browse` | 技能注册表的分页浏览器。 |
| `search` | 搜索技能注册表。 |
| `install` | 安装一个技能。 |
| `inspect` | 在不安装的情况下预览技能。 |
| `list` | 列出已安装的技能。 |
| `check` | 检查已安装的 hub 技能是否有上游更新。 |
| `update` | 当有可用上游更改时，重新安装 hub 技能。 |
| `audit` | 重新扫描已安装的 hub 技能。 |
| `uninstall` | 移除 hub 安装的技能。 |
| `publish` | 将技能发布到注册表。 |
| `snapshot` | 导出/导入技能配置。 |
| `tap` | 管理自定义技能源。 |
| `config` | 按平台对技能进行交互式启用/禁用配置。 |

常用示例：

```bash
hermes skills browse
hermes skills browse --source official
hermes skills search react --source skills-sh
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect official/security/1password
hermes skills inspect skills-sh/vercel-labs/json-render/json-render-react
hermes skills install official/migration/openclaw-migration
hermes skills install skills-sh/anthropics/skills/pdf --force
hermes skills check
hermes skills update
hermes skills config
```

注意：
- `--force` 可以覆盖第三方/社区技能的非危险策略块。
- `--force` 不会覆盖 `dangerous` 扫描的裁决。
- `--source skills-sh` 搜索公共 `skills.sh` 目录。
- `--source well-known` 允许您将 Hermes 指向暴露了 `/.well-known/skills/index.json` 的网站。

## `hermes honcho`

```bash
hermes honcho [--target-profile NAME] <subcommand>
```

管理 Honcho 跨会话内存集成。此命令由 Honcho 内存提供商插件提供，并且仅当您的配置中 `memory.provider` 设置为 `honcho` 时可用。

`--target-profile` 标志允许您在不切换到另一个 profile 的情况下管理其 Honcho 配置。

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `setup` | 重定向到 `hermes memory setup`（统一设置路径）。 |
| `status [--all]` | 显示当前的 Honcho 配置和连接状态。`--all` 显示跨 profile 的概览。 |
| `peers` | 显示所有 profile 的对等体身份。 |
| `sessions` | 列出已知的 Honcho 会话映射。 |
| `map [name]` | 将当前目录映射到 Honcho 会话名称。省略 `name` 可列出当前映射。 |
| `peer` | 显示或更新对等体名称和方言推理级别。选项：`--user NAME`, `--ai NAME`, `--reasoning LEVEL`。 |
| `mode [mode]` | 显示或设置召回模式：`hybrid`, `context` 或 `tools`。省略可显示当前模式。 |
| `tokens` | 显示或设置上下文和方言的 token 预算。选项：`--context N`, `--dialectic N`。 |
| `identity [file] [--show]` | 播种或显示 AI 对等体身份表示。 |
| `enable` | 为活动 profile 启用 Honcho。 |
| `disable` | 为活动 profile 禁用 Honcho。 |
| `sync` | 将 Honcho 配置同步到所有现有 profile（创建缺失的主机块）。 |
| `migrate` | 从 openclaw-honcho 到 Hermes Honcho 的分步迁移指南。 |

## `hermes memory`

```bash
hermes memory <subcommand>
```

设置和管理外部内存提供商插件。可用提供商：honcho, openviking, mem0, hindsight, holographic, retaindb, byterover, supermemory。一次只能激活一个外部提供商。内置内存 (MEMORY.md/USER.md) 始终处于活动状态。

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `setup` | 交互式提供商选择和配置。 |
| `status` | 显示当前的内存提供商配置。 |
| `off` | 禁用外部提供商（仅内置）。 |

## `hermes acp`

```bash
hermes acp
```

以 ACP（代理客户端协议）stdio 服务器启动 Hermes，用于编辑器集成。

相关入口点：

```bash
hermes-acp
python -m acp_adapter
```

首先安装支持：

```bash
pip install -e '.[acp]'
```

请参阅 [ACP 编辑器集成](../user-guide/features/acp.md) 和 [ACP 内部机制](../developer-guide/acp-internals.md)。

## `hermes mcp`

```bash
hermes mcp <subcommand>
```

管理 MCP（模型上下文协议）服务器配置，并将 Hermes 作为 MCP 服务器运行。

| 子命令 | 描述 |
|------------|-------------|
| `serve [-v\|--verbose]` | 将 Hermes 作为 MCP 服务器运行——将对话暴露给其他代理。 |
| `add <name> [--url URL] [--command CMD] [--args ...] [--auth oauth\|header]` | 添加一个带有自动工具发现的 MCP 服务器。 |
| `remove <name>` (别名: `rm`) | 从配置中移除一个 MCP 服务器。 |
| `list` (别名: `ls`) | 列出配置的 MCP 服务器。 |
| `test <name>` | 测试到 MCP 服务器的连接。 |
| `configure <name>` (别名: `config`) | 切换服务器的工具选择。 |

请参阅 [MCP 配置参考](./mcp-config-reference.md)、[使用 MCP 与 Hermes](../guides/use-mcp-with-hermes.md) 和 [MCP 服务器模式](../user-guide/features/mcp.md#running-hermes-as-an-mcp-server)。

## `hermes plugins`

```bash
hermes plugins [subcommand]
```

统一的插件管理——通用插件、内存提供商和上下文引擎在一个地方。不带子命令运行 `hermes plugins` 会打开一个复合交互式屏幕，包含两个部分：

- **通用插件** — 多选复选框，用于启用/禁用已安装的插件
- **提供商插件** — 内存提供商和上下文引擎的单选配置。在类别上按 ENTER 可打开单选选择器。

| 子命令 | 描述 |
|------------|-------------|
| *(none)* | 复合交互式 UI — 通用插件切换 + 提供商插件配置。 |
| `install <identifier> [--force]` | 从 Git URL 或 `owner/repo` 安装插件。 |
| `update <name>` | 拉取已安装插件的最新更改。 |
| `remove <name>` (别名: `rm`, `uninstall`) | 移除已安装的插件。 |
| `enable <name>` | 启用禁用的插件。 |
| `disable <name>` | 禁用插件，但不移除它。 |
| `list` (别名: `ls`) | 列出已安装的插件及其启用/禁用状态。 |

提供商插件的选择保存在 `config.yaml` 中：
- `memory.provider` — 活动内存提供商（空 = 仅内置）
- `context.engine` — 活动上下文引擎（`"compressor"` = 内置默认）

通用插件禁用列表存储在 `config.yaml` 的 `plugins.disabled` 下。

请参阅 [Plugins](../user-guide/features/plugins.md) 和 [构建 Hermes 插件](../guides/build-a-hermes-plugin.md)。

## `hermes tools`

```bash
hermes tools [--summary]
```

| 选项 | 描述 |
|--------|-------------|
| `--summary` | 打印当前启用的工具摘要并退出。 |

不带 `--summary` 时，这将启动交互式的按平台工具配置 UI。

## `hermes sessions`

```bash
hermes sessions <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出最近的会话。 |
| `browse` | 带有搜索和恢复功能的交互式会话选择器。 |
| `export <output> [--session-id ID]` | 将会话导出为 JSONL。 |
| `delete <session-id>` | 删除一个会话。 |
| `prune` | 删除旧会话。 |
| `stats` | 显示会话存储统计信息。 |
| `rename <session-id> <title>` | 设置或更改会话标题。 |

## `hermes insights`

```bash
hermes insights [--days N] [--source platform]
```

| 选项 | 描述 |
|--------|-------------|
| `--days <n>` | 分析过去 `n` 天（默认为 30）。 |
| `--source <platform>` | 按来源过滤，例如 `cli`, `telegram` 或 `discord`。 |

## `hermes claw`

```bash
hermes claw migrate [options]
```

将您的 OpenClaw 设置迁移到 Hermes。从 `~/.openclaw`（或自定义路径）读取，写入 `~/.hermes`。自动检测遗留目录名（`~/.clawdbot`, `~/.moltbot`）和配置文件名（`clawdbot.json`, `moltbot.json`）。

| 选项 | 描述 |
|--------|-------------|
| `--dry-run` | 预览将迁移的内容，不写入任何文件。 |
| `--preset <name>` | 迁移预设：`full`（默认，包含密钥）或 `user-data`（排除 API 密钥）。 |
| `--overwrite` | 解决冲突时覆盖现有 Hermes 文件（默认为跳过）。 |
| `--migrate-secrets` | 在迁移中包含 API 密钥（与 `--preset full` 默认启用）。 |
| `--source <path>` | 自定义 OpenClaw 目录（默认为 `~/.openclaw`）。 |
| `--workspace-target <path>` | 工作区说明的目标目录（AGENTS.md）。 |
| `--skill-conflict <mode>` | 处理技能名称冲突：`skip` (默认), `overwrite`, 或 `rename`。 |
| `--yes` | 跳过确认提示。 |

### 迁移内容

迁移涵盖了 30 多个类别，包括角色、内存、技能、模型提供商、消息平台、代理行为、会话策略、MCP 服务器、TTS 等。项目要么**直接导入**到 Hermes 等效项，要么**存档**以供手动审查。

**直接导入：** SOUL.md, MEMORY.md, USER.md, AGENTS.md, skills (4 个源目录), 默认模型, 自定义提供商, MCP 服务器, 消息平台令牌和白名单（Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Mattermost）, 代理默认值（推理努力、压缩、人类延迟、时区、沙盒）, 会话重置策略, 批准规则, TTS 配置, 浏览器设置, 工具设置, 执行超时, 命令白名单, 网关配置, 以及来自 3 个来源的 API 密钥。

**存档以供手动审查：** Cron 任务, 插件, 钩子/webhook, 内存后端 (QMD), 技能注册表配置, UI/身份, 日志记录, 多代理设置, 频道绑定, IDENTITY.md, TOOLS.md, HEARTBEAT.md, BOOTSTRAP.md。

**API 密钥解析** 检查三个来源，优先级顺序为：配置值 → `~/.openclaw/.env` → `auth-profiles.json`。所有令牌字段处理纯字符串、环境变量模板 (`${VAR}`) 和 SecretRef 对象。

有关完整的配置键映射、SecretRef 处理详情和迁移后检查清单，请参阅 **[完整迁移指南](../guides/migrate-from-openclaw.md)**。

### 示例

```bash
# 预览将迁移的内容
hermes claw migrate --dry-run

# 包含 API 密钥的完整迁移
hermes claw migrate --preset full

# 仅迁移用户数据（无密钥），覆盖冲突
hermes claw migrate --preset user-data --overwrite

# 从自定义 OpenClaw 路径迁移
hermes claw migrate --source /home/user/old-openclaw
```

## `hermes dashboard`

```bash
hermes dashboard [options]
```

启动 Web 仪表板——一个基于浏览器的 UI，用于管理配置、API 密钥和监控会话。需要 `pip install hermes-agent[web]` (FastAPI + Uvicorn)。有关完整文档，请参阅 [Web 仪表板](/docs/user-guide/features/web-dashboard)。

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
| `--port` | `9119` | 运行 Web 服务器的端口 |
| `--host` | `127.0.0.1` | 绑定地址 |
| `--no-open` | — | 不自动打开浏览器 |

```bash
# 默认 — 在 http://127.0.0.1:9119 打开浏览器
hermes dashboard

# 自定义端口，不打开浏览器
hermes dashboard --port 8080 --no-open
```

## `hermes profile`

```bash
hermes profile <subcommand>
```

管理 profile——多个隔离的 Hermes 实例，每个实例都有自己的配置、会话、技能和主目录。

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出所有 profile。 |
| `use <name>` | 设置粘性默认 profile。 |
| `create <name> [--clone] [--clone-all] [--clone-from <source>] [--no-alias]` | 创建一个新的 profile。`--clone` 从活动 profile 复制配置、.env 和 SOUL.md。`--clone-all` 复制所有状态。`--clone-from` 指定源 profile。 |
| `delete <name> [-y]` | 删除一个 profile。 |
| `show <name>` | 显示 profile 详细信息（主目录、配置等）。 |
| `alias <name> [--remove] [--name NAME]` | 管理用于快速访问 profile 的包装脚本。 |
| `rename <old> <new>` | 重命名 profile。 |
| `export <name> [-o FILE]` | 将 profile 导出为 `.tar.gz` 存档。 |
| `import <archive> [--name NAME]` | 从 `.tar.gz` 存档导入 profile。 |

示例：

```bash
hermes profile list
hermes profile create work --clone
hermes profile use work
hermes profile alias work --name h-work
hermes profile export work -o work-backup.tar.gz
hermes profile import work-backup.tar.gz --name restored
hermes -p work chat -q "来自 work profile 的问候"
```

## `hermes completion`

```bash
hermes completion [bash|zsh]
```

将 shell 补全脚本打印到 stdout。在您的 shell profile 中源（source）该输出，以实现 Hermes 命令、子命令和 profile 名称的 Tab 补全。

示例：

```bash
# Bash
hermes completion bash >> ~/.bashrc

# Zsh
hermes completion zsh >> ~/.zshrc
```

## 维护命令

| 命令 | 描述 |
|---------|-------------|
| `hermes version` | 打印版本信息。 |
| `hermes update` | 拉取最新更改并重新安装依赖项。 |
| `hermes uninstall [--full] [--yes]` | 移除 Hermes，可选地删除所有配置/数据。 |

## 另请参阅

- [斜杠命令参考](./slash-commands.md)
- [CLI 接口](../user-guide/cli.md)
- [会话](../user-guide/sessions.md)
- [技能系统](../user-guide/features/skills.md)
- [皮肤与主题](../user-guide/features/skins.md)