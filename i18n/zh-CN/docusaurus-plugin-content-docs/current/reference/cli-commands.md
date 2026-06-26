---
sidebar_position: 1
title: "CLI Commands Reference"
description: "Hermes 终端命令和命令族群的权威参考资料"
---

# CLI 命令参考

本文档涵盖了您从 shell 中运行的**终端命令**。

有关聊天中的斜杠命令，请参阅[斜杠命令参考](./slash-commands.md)。

## 全局入口点

```bash
hermes [global-options] <command> [subcommand/options]
```

### 全局选项

| Option | Description |
|--------|-------------|
| `--version`, `-V` | 显示版本并退出。 |
| `--profile <name>`, `-p <name>` | 选择用于本次调用的 Hermes 配置。它会覆盖由 `hermes profile use` 设置的固定默认值。 |
| `--resume <session>`, `-r <session>` | 通过 ID 或标题恢复之前的会话。 |
| `--continue [name]`, `-c [name]` | 恢复最近一次会话，或匹配特定标题的最近一次会话。 |
| `--worktree`, `-w` | 在隔离的 git 工作树中启动，用于并行智能体工作流。 |
| `--yolo` | 绕过危险命令的批准提示。 |
| `--pass-session-id` | 将会话 ID 包含在智能体的系统提示中。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml`，并回退到内置默认值。`.env` 中的凭证仍然会被加载。 |
| `--ignore-rules` | 跳过自动注入 `AGENTS.md`、`SOUL.md`、`.cursorrules`、内存和预加载的技能。 |
| `--tui` | 启动 [TUI](../user-guide/tui.md) 而不是经典的 CLI。等同于 `HERMES_TUI=1`。它总是优先于 `display.interface`。 |
| `--cli` | 强制使用经典的 prompt_toolkit REPL。这可用于覆盖单次调用的 `display.interface: tui`。 |
| `--dev` | 使用 `--tui` 时：通过 `tsx` 直接运行 TypeScript 源代码，而不是预构建的捆绑包（适用于 TUI 贡献者）。 |

## 顶层命令

| Command | Purpose |
|---------|---------|
| `hermes chat` | 与智能体进行交互式或一次性聊天。 |
| `hermes model` | 交互式地选择默认的提供商和模型。 |
| `hermes moa` | 配置由 `/moa` 使用命名的智能体混合（Mixture of Agents）预设。 |
| `hermes fallback` | 管理主模型出错时尝试的备用提供商。 |
| `hermes gateway` | 运行或管理消息网关服务。 |
| `hermes proxy` | 一个本地兼容 OpenAI 的代理，可附加 OAuth 提供商凭证。参见 [Subscription Proxy](../user-guide/features/subscription-proxy.md)。 |
| `hermes lsp` | 管理语言服务器协议（Language Server Protocol）集成（用于 write_file/patch 的语义诊断）。 |
| `hermes setup` | 完整的配置设置向导，可针对所有或部分配置进行操作。 |
| `hermes whatsapp` | 配置和配对 WhatsApp 网桥。 |
| `hermes slack` | Slack 助手（目前功能：将每个命令都生成为原生斜杠的应用程序清单）。 |
| `hermes auth` | 管理凭证——添加、列出、移除、重置、状态、登出。处理 Codex/Nous/Anthropic 的 OAuth 流程。 |
| `hermes login` / `logout` | **已弃用** — 请使用 `hermes auth` 代替。 |
| `hermes send` | 向配置的消息平台（Telegram, Discord, Slack, Signal, SMS, …）发送一次性消息。对于 Shell 脚本、定时任务、CI Hooks 和监控守护进程非常有用——不涉及智能体循环，也不涉及 LLM。 |
| `hermes secrets` | 管理外部密钥源（目前为 Bitwarden Secrets Manager），用于在进程启动时而不是从 `~/.hermes/.env` 中拉取 API 密钥。 |
| `hermes migrate` | 诊断并（可选地）重写 `config.yaml`，以替换对已退役模型或已弃用设置的引用（例如：`migrate xai`）。 |
| `hermes status` | 显示智能体、认证和平台状态。 |
| `hermes cron` | 检查并标记定时任务调度器。 |
| `hermes kanban` | 多配置文件协作板（任务、链接、分派器）。 |
| `hermes webhook` | 管理用于事件驱动激活的动态 Webhook 订阅。 |
| `hermes hooks` | 检查、批准或移除在 `config.yaml` 中声明的 Shell 脚本 Hook。 |
| `hermes doctor` | 诊断配置和依赖问题。 |
| `hermes security audit` | 按需供应链审计（OSV.dev），针对 venv、插件要求和固定的 MCP 服务器。 |
| `hermes dump` | 用于支持/调试的、可复制粘贴的设置摘要。 |
| `hermes prompt-size` | 显示系统提示 + 工具模式（技能索引、内存、配置文件）的字节分解。离线运行。 |
| `hermes debug` | 调试工具——上传日志和系统信息以供支持使用。 |
| `hermes backup` | 将 Hermes 主目录备份为 zip 文件。 |
| `hermes checkpoints` | 检查/修剪/清除 `~/.hermes/checkpoints/`（由 `/rollback` 使用的影子存储）。不带参数运行时可获得状态概览。 |
| `hermes import` | 从 zip 文件恢复 Hermes 备份。 |
| `hermes logs` | 查看、跟踪和过滤智能体/网关/错误日志文件。 |
| `hermes config` | 显示、编辑、迁移和查询配置文件。 |
| `hermes pairing` | 批准或撤销消息配对代码。 |
| `hermes skills` | 浏览、安装、发布、审计和配置技能。 |
| `hermes bundles` | 将多个技能分组到一个单一的 `/<name>` 斜杠命令下。参见 [Skill Bundles](../user-guide/features/skills.md#skill-bundles)。 |
| `hermes curator` | 后台技能维护——状态、运行、暂停、固定。参见 [Curator](../user-guide/features/curator.md)。 |
| `hermes memory` | 配置外部内存提供商。特定插件的子命令（例如 `hermes honcho`）会在其提供商激活时自动注册。 |
| `hermes acp` | 作为 ACP 服务器运行 Hermes 以实现编辑器集成。 |
| `hermes mcp` | 管理 MCP 服务器配置，并将 Hermes 作为 MCP 服务器运行。 |
| `hermes plugins` | 管理 Hermes 智能体插件（安装、启用、禁用、移除）。 |
| `hermes portal` | Nous Portal 状态、订阅链接和工具网关路由。参见 [Tool Gateway](../user-guide/features/tool-gateway.md)。 |
| `hermes tools` | 配置每个平台的已启用工具。 |
| `hermes computer-use` | 安装或检查 cua-driver 后端（macOS Computer Use）。 |
| `hermes sessions` | 浏览、导出、修剪、重命名和删除会话。 |
| `hermes insights` | 显示令牌/成本/活动分析。 |
| `hermes claw` | OpenClaw 迁移助手。 |
| `hermes dashboard` | 启动用于管理配置、API 密钥和会话的 Web 仪表板。 |
| `hermes profile` | 管理配置文件——多个隔离的 Hermes 实例。 |
| `hermes completion` | 打印 Shell 补全脚本（bash/zsh/fish）。 |
| `hermes version` | 显示版本信息。 |
| `hermes update` | 拉取最新代码并重新安装依赖项。`--check` 在不安装的情况下进行预览；`--backup` 会在拉取前创建 `HERMES_HOME` 快照。 |
| `hermes uninstall` | 从系统中移除 Hermes。 |

## `hermes chat`

```bash
hermes chat [options]
```

常用选项：

| Option | Description |
|--------|-------------|
| `-q`, `--query "..."` | 一次性、非交互式提示。 |
| `-m`, `--model <model>` | 覆盖本次运行的模型。 |
| `-t`, `--toolsets <csv>` | 启用逗号分隔的工具集。 |
| `--provider <provider>` | 强制指定提供商：`auto`, `openrouter`, `nous`, `openai-codex`, `copilot-acp`, `copilot`, `anthropic`, `gemini`, `huggingface`, `novita` (别名 `novita-ai`, `novitaai`), `openai-api`, `zai`, `kimi-coding`, `kimi-coding-cn`, `minimax`, `minimax-cn`, `minimax-oauth`, `kilocode`, `xiaomi`, `arcee`, `gmi`, `alibaba`, `alibaba-coding-plan` (别名 `alibaba_coding`), `deepseek`, `nvidia`, `ollama-cloud`, `xai` (别名 `grok`), `xai-oauth` (别名 `grok-oauth`), `qwen-oauth`, `bedrock`, `opencode-zen`, `opencode-go`, `azure-foundry`, `lmstudio`, `stepfun`, `tencent-tokenhub` (别名 `tencent`, `tokenhub`)。 |
| `-s`, `--skills <name>` | 预加载一个或多个技能到会话中（可以重复或逗号分隔）。 |
| `-v`, `--verbose` | 详细输出。 |
| `-Q`, `--quiet` | 编程模式：抑制横幅/转圈/工具预览。 |
| `--image <path>` | 将本地图片附加到单个查询中。 |
| `--resume <session>` / `--continue [name]` | 直接从 `chat` 恢复会话。 |
| `--worktree` | 为本次运行创建一个隔离的 Git 工作树。 |
| `--checkpoints` | 在进行破坏性文件更改之前启用文件系统检查点。 |
| `--yolo` | 跳过批准提示。 |
| `--pass-session-id` | 将会话 ID 传递到系统提示中。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml` 并使用内置默认值。`.env` 中的凭证仍然会被加载。这对于隔离的 CI 运行、可复现的 Bug 报告和第三方集成非常有用。 |
| `--ignore-rules` | 跳过自动注入 `AGENTS.md`、`SOUL.md`、`.cursorrules`、持久内存和预加载的技能。与 `--ignore-user-config` 结合使用，实现完全隔离的运行。 |
| `--safe-mode` | 故障排除模式：禁用所有自定义设置——用户配置、规则/内存注入、插件和 MCP 服务器（隐含了 `--ignore-user-config` 和 `--ignore-rules`）。用于判断问题是出在你的设置上还是出在 Hermes 本身。 |
| `--source <tag>` | 用于过滤的会话源标签（默认为 `cli`）。对于不应出现在用户会话列表中的第三方集成，请使用 `tool`。 |
| `--max-turns <N>` | 每个对话轮次的最大工具调用次数（默认：90，或配置中的 `agent.max_turns`）。 |

示例：

```bash
hermes
hermes chat -q "总结最新的 PR"
hermes chat --provider openrouter --model anthropic/claude-sonnet-4.6
hermes chat --toolsets web,terminal,skills
hermes chat --quiet -q "只返回 JSON"
hermes chat --worktree -q "审查此仓库并打开一个 PR"
hermes chat --ignore-user-config --ignore-rules -q "在没有我的个人设置的情况下重现"
hermes chat --safe-mode -q "这是我的 Bug 还是 Hermes 的？"
```

### `hermes -z <prompt>` — 脚本化的一次性操作

对于程序调用者（Shell 脚本、CI、cron、管道输入提示的父进程），`hermes -z` 是最纯粹的一次性入口点：**单个提示输入，最终响应文本输出，stdout 或 stderr 上没有其他内容。** 没有横幅，没有转圈，没有工具预览，没有 `Session:` 行——只有智能体的最终回复作为纯文本。

```bash
hermes -z "法国的首都是哪里？"
# → Paris.

# 父脚本可以干净地捕获响应：
answer=$(hermes -z "总结一下这个文件")
```

每次运行的覆盖设置（不会修改 `~/.hermes/config.yaml`）：

| Flag | Equivalent env var | Purpose |
|---|---|---|
| `-m` / `--model <model>` | `HERMES_INFERENCE_MODEL` | 覆盖本次运行的模型 |
| `--provider <provider>` | _(none)_ | 覆盖本次运行的提供商 |

```bash
hermes -z "…" --provider openrouter --model openai/gpt-5.5
# 或：
HERMES_INFERENCE_MODEL=anthropic/claude-sonnet-4.6 hermes -z "…"
```

相同的智能体、相同的工具、相同的技能——只是剥离了所有交互式/美观的层。如果你也需要转录中的工具输出，请使用 `hermes chat -q`；`-z` 是明确用于“我只需要最终答案”。

## `hermes model`

交互式提供商 + 模型选择器。**这是用于添加新提供商、设置 API 密钥和运行 OAuth 流程的命令。** 请从终端中运行它——而不是在活动的 Hermes chat 会话内部。

```bash
hermes model
```

当你想：
- **添加新的提供商**（OpenRouter, Anthropic, Copilot, DeepSeek, 自定义等）
- 登录 OAuth 支持的提供商（Anthropic, Copilot, Codex, Nous Portal）
- 输入或更新 API 密钥
- 从特定于提供商的模型列表中进行选择
- 配置自定义/自托管端点
- 将新的默认值保存到配置中

:::warning hermes model 与 /model 的区别
**`hermes model`**（从终端运行，在任何 Hermes 会话之外）是**完整的提供商设置向导**。它可以添加新提供商、运行 OAuth 流程、提示 API 密钥并配置端点。

**`/model`**（在活动的 Hermes chat 会话内部输入）只能**在已设置好的提供商和模型之间进行切换**。它不能添加新提供商、运行 OAuth 或提示 API 密钥。

**如果你需要添加新提供商：** 请先退出 Hermes 会话（`Ctrl+C` 或 `/quit`），然后从终端提示符中运行 `hermes model`。
:::

### `/model` 斜杠命令（会话中）

在不离开会话的情况下，在已配置好的模型之间进行切换：

```
/model                              # 显示当前模型和可用选项
/model claude-sonnet-4              # 切换模型（自动检测提供商）
/model zai:glm-5                    # 切换提供商和模型
/model custom:qwen-2.5              # 在自定义端点上使用模型
/model custom                       # 从自定义端点自动检测模型
/model custom:local:qwen-2.5        # 使用命名的自定义提供商
/model openrouter:anthropic/claude-sonnet-4  # 切换回云端
```

默认情况下，`/model` 的更改**仅对当前会话有效**。要将更改持久化到 `config.yaml` 中，请添加 `--global`：

```
/model claude-sonnet-4 --global     # 切换并保存为新的默认值
```

:::info 如果我只看到 OpenRouter 的模型怎么办？
如果你只配置了 OpenRouter，`/model` 将只会显示 OpenRouter 的模型。要添加另一个提供商（Anthropic, DeepSeek, Copilot 等），请退出会话，然后从终端运行 `hermes model`。
:::

提供商和基础 URL 的更改会自动保存到 `config.yaml` 中。当切换离开自定义端点时，该陈旧的基础 URL 会被清除，以防止它泄露到其他提供商中。

## `hermes gateway`

```bash
hermes gateway <subcommand>
```

Subcommands:

| Subcommand | Description |
|------------|-------------|
| `run` | 在前台运行网关。推荐用于WSL、Docker和Termux。 |
| `start` | 启动已安装的systemd/launchd后台服务。 |
| `stop` | 停止服务（或前台进程）。 |
| `restart` | 重启服务。 |
| `status` | 显示服务状态。 |
| `list` | 列出**所有配置文件**以及每个配置文件的网关是否正在运行（如果可用，则显示PID）。当您并排运行多个配置文件并希望获得一个总体概览时非常有用。 |
| `install` | 安装为systemd（Linux）或launchd（macOS）后台服务。 |
| `uninstall` | 移除已安装的服务。 |
| `setup` | 交互式消息平台设置。 |
| `enroll` | 实验性功能：使用中继连接器注册此网关，并为基于连接器的平台保存中继凭证。 |

Options:

| Option | Description |
|--------|-------------|
| `--all` | 在`start` / `restart` / `stop`时：对**每个配置文件的**网关进行操作，而不仅仅是对活动的`HERMES_HOME`。如果您并排运行多个配置文件并在`hermes update`后希望全部重启，则此选项很有用。 |
| `--no-supervise` | 在`run`时：在s6-overlay Docker镜像内部，选择退出自动监督并使用pre-s6前台语义——网关作为容器的主进程运行，没有自动重启。在s6镜像外部无效。等同于设置`HERMES_GATEWAY_NO_SUPERVISE=1`。 |

`hermes gateway enroll`接受`--token`、`--connector-url`和`--gateway-id`。它将注册令牌与连接器进行交换，并将生成的`GATEWAY_RELAY_ID`、`GATEWAY_RELAY_SECRET`、`GATEWAY_RELAY_DELIVERY_KEY`以及可选的`GATEWAY_RELAY_URL`值写入活动配置文件的`.env`中。

:::tip WSL用户
请使用`hermes gateway run`而不是`hermes gateway start`——WSL的systemd支持不可靠。将其包装在tmux中以保持持久性：`tmux new -s hermes 'hermes gateway run'`。有关详细信息，请参阅[WSL FAQ](/reference/faq#wsl-gateway-keeps-disconnecting-or-hermes-gateway-start-fails)。
:::

## `hermes lsp`

```bash
hermes lsp <subcommand>
```

管理语言服务器协议（LSP）的集成。LSP在后台运行真实的语言服务器（pyright, gopls, rust-analyzer等），并将它们的诊断信息提供给`write_file`和`patch`所使用的后写入检查。它取决于Git工作区检测——只有当当前工作目录或编辑的文件位于Git工作树内时，LSP才会运行。

Subcommands:

| Subcommand | Description |
|------------|-------------|
| `status` | 显示服务状态、配置的服务器和安装状态。 |
| `list` | 打印支持的服务器注册表。传递`--installed-only`可跳过缺失的服务器。 |
| `install <id>` | 立即安装一个服务器的二进制文件。 |
| `install-all` | 使用已知自动安装配方安装所有服务器。 |
| `restart` | 关闭正在运行的客户端，以便下次编辑时重新启动。 |
| `which <id>` | 打印一个服务器已解析的二进制文件路径。 |

有关完整的指南、支持的语言和配置选项，请参阅[LSP — 语义诊断](/user-guide/features/lsp)。

## `hermes setup`

```bash
hermes setup [model|tts|terminal|gateway|tools|agent] [--non-interactive] [--reset] [--quick] [--reconfigure] [--portal]
```

**最简单的路径：** `hermes setup --portal` — 一次性OAuth登录到Nous Portal，并选择加入[工具网关](../user-guide/features/tool-gateway.md)。

**首次运行：** 启动首次使用向导。

**返回用户（已配置）：** 直接进入完整的重新配置向导——每个提示都会显示当前值作为默认值，按回车键保留或输入新值。没有菜单。

跳入特定部分而非完整向导：

| 部分 | 描述 |
|---------|-------------|
| `model` | 提供商和模型设置。 |
| `terminal` | 终端后端和沙盒设置。 |
| `gateway` | 消息平台设置。 |
| `tools` | 按平台启用/禁用工具。 |
| `agent` | 智能体行为设置。 |

选项：

| 选项 | 描述 |
|--------|-------------|
| `--quick` | 对于返回用户运行：仅提示缺失或未设置的项目。跳过已配置好的项目。 |
| `--non-interactive` | 使用默认值/环境值，不进行提示。 |
| `--reset` | 在设置前将配置重置为默认值。 |
| `--reconfigure` | 向后兼容的别名 — 对于现有安装的裸 `hermes setup` 默认为此操作。 |
| `--portal` | 一次性Nous Portal设置：通过OAuth登录，将Nous设置为推理提供商，并选择加入[工具网关](../user-guide/features/tool-gateway.md)。跳过向导的其余部分。 |

## `hermes portal`

```bash
hermes portal [status|open|tools]
```

检查Nous Portal认证、工具网关路由，并到达订阅页面。不带子命令的调用将运行 `status`。

| 子命令 | 描述 |
|------------|-------------|
| `status` (默认) | Portal认证状态 + 每个工具的工具网关路由摘要。当未提供任何子命令时也会显示此项。 |
| `open` | 在您的默认浏览器中打开 `portal.nousresearch.com/manage-subscription`。 |
| `tools` | 列出所有工具网关合作伙伴（Firecrawl, FAL, OpenAI TTS, Browser Use, Modal）以及哪些是通过Nous路由的。 |

有关网关本身的配置，请参阅[工具网关](../user-guide/features/tool-gateway.md)。有关一次性设置路径，请参考上方的 `hermes setup --portal`。

## `hermes whatsapp`

```bash
hermes whatsapp
```

运行WhatsApp配对/设置流程，包括模式选择和二维码配对。

## `hermes slack`

```bash
hermes slack manifest              # 将清单打印到标准输出
hermes slack manifest --write      # 写入 ~/.hermes/slack-manifest.json
hermes slack manifest --slashes-only  # 仅功能斜杠命令数组
```

生成一个Slack应用清单，该清单将`COMMAND_REGISTRY`（`/btw`、`/stop`、`/model`等）中的每个网关命令注册为一流的Slack斜杠命令——与Discord和Telegram保持一致。将输出粘贴到[https://api.slack.com/apps](https://api.slack.com/apps)您的应用→**功能 → 应用清单 → 编辑**，然后**保存**。如果范围或斜杠命令发生变化，Slack会提示重新安装。

| 标志 | 默认值 | 用途 |
|------|---------|---------|
| `--write [PATH]` | stdout | 不写入标准输出，而是写入文件。裸的 `--write` 会写入 `$HERMES_HOME/slack-manifest.json`。 |
| `--name NAME` | `Hermes` | Slack中的机器人显示名称。 |
| `--description DESC` | 默认描述 | 显示在Slack应用目录中的机器人描述。 |
| `--slashes-only` | off | 只发出用于合并到手动维护的清单的`features.slash_commands`。 |

运行 `hermes update` 后，再次运行 `hermes slack manifest --write` 以拾取任何新命令。


## `hermes send`

```bash
hermes send --to <target> "message text"
hermes send --to <target> --file <path>
echo "message" | hermes send --to <target>
hermes send --list [platform]
```

向已配置的消息平台发送一次性消息，而无需启动智能体或网关循环。它重用网关的现有凭证（`~/.hermes/.env` + `~/.hermes/config.yaml`），因此操作脚本、定时任务、CI钩子和监控守护进程可以发布状态更新，而无需重新实现每个平台的REST客户端。

对于机器人令牌平台（Telegram, Discord, Slack, Signal, SMS, WhatsApp-CloudAPI），不需要运行网关——`hermes send` 直接与平台的REST端点通信。需要持久适配器的插件平台仍然需要一个活动的网关。

| 选项 | 描述 |
|--------|-------------|
| `-t`, `--to <TARGET>` | 交付目标。格式：`platform`（使用主频道）、`platform:chat_id`、`platform:chat_id:thread_id` 或 `platform:#channel-name`。示例：`telegram`、`telegram:-1001234567890`、`discord:#ops`、`slack:C0123ABCD`、`signal:+15551234567`。 |
| `-f`, `--file <PATH>` | 从 `PATH` 读取消息体（仅限文本文件——日志、报告、markdown）。传递 `-` 可强制从stdin读取。要发送图片或其他二进制文件，请使用 `MEDIA:<path>`（见下文）。 |
| `-s`, `--subject <LINE>` | 在消息体前添加一个主题/标题行。 |
| `-l`, `--list [platform]` | 列出所有平台配置的目标（或仅列出指定的平台）。 |
| `-q`, `--quiet` | 成功时抑制标准输出——在脚本中使用非常有用（只依赖退出代码）。 |
| `--json` | 发出原始JSON结果，而不是人类可读的输出。 |

如果未提供位置参数 `message` 或 `--file`，当它不是TTY时，`hermes send` 会从stdin读取。退出代码：成功为 `0`，交付/后端失败为 `1`，使用错误为 `2`。

### 发送图片和其他媒体

`--file` 仅用于*文本*体。要作为原生的平台附件交付图片、文档、视频或音频文件，请在消息文本中引用它，使用 `MEDIA:<local_path>` 指令：

```bash
hermes send --to telegram "MEDIA:/tmp/screenshot.png"
hermes send --to telegram "Build chart for today MEDIA:/tmp/chart.png"   # 带标题
hermes send --to discord:#ops "MEDIA:/tmp/report.pdf"
```

默认情况下，图片文件作为照片发送（Telegram等平台会重新压缩这些文件）。请将 `[[as_document]]` 添加到消息中，以将其作为未压缩的文件附件交付：

```bash
hermes send --to telegram "[[as_document]] MEDIA:/tmp/screenshot.png"
```

示例：

```bash
hermes send --to telegram "deploy finished"
echo "RAM 92%" | hermes send --to telegram:-1001234567890
hermes send --to discord:#ops --file /tmp/report.md
hermes send --to slack:#eng --subject "[CI]" --file build.log
hermes send --list                  # 所有平台
hermes send --list telegram         # 按平台过滤
```


## `hermes secrets`

```bash
hermes secrets bitwarden <subcommand>
hermes secrets bw <subcommand>          # 简称别名
```

在进程启动时，而不是将API密钥存储在 `~/.hermes/.env` 中，从外部密钥管理器中拉取它们。目前支持**Bitwarden Secrets Manager**。查看完整指南：[Bitwarden集成](../user-guide/secrets/bitwarden.md)。

`bitwarden` (别名 `bw`) 的子命令：

| 子命令 | 描述 |
|------------|-------------|
| `setup` | 交互式向导：安装固定的`bws`二进制文件，存储访问令牌，并选择一个项目。接受 `--project-id`、`--access-token` 和 `--server-url` 以进行非交互式使用。 |
| `status` | 显示当前配置、二进制文件路径/版本和上次获取信息。 |
| `sync` | 立即拉取密钥并报告更改内容。添加 `--apply` 以实际将密钥导出到当前Shell的环境中（默认是干运行）。 |
| `install` | 下载并验证固定的`bws`二进制文件。`--force` 会重新下载，即使已存在托管副本。 |
| `disable` | 关闭Bitwarden集成。 |


## `hermes migrate`

```bash
hermes migrate <type>
```

诊断并（可选地）重写活动的 `config.yaml` 文件，以替换对已退役模型或已弃用设置的引用。在任何重写之前都会对原始 `config.yaml` 进行带时间戳的备份（使用 `--no-backup` 跳过）。

| 子命令 | 描述 |
|------------|-------------|
| `xai` | 扫描 `config.yaml` 中针对定于2026年5月15日退役的xAI模型引用，并（使用 `--apply`）根据xAI迁移指南将其原地重写为官方替代品。默认为干运行。 |

迁移子命令的常用标志：

| 标志 | 描述 |
|------|-------------|
| `--apply` | 原地重写 `config.yaml`（默认：干运行，不写入）。 |
| `--no-backup` | 在应用时跳过 `config.yaml` 的带时间戳备份。 |

> 不应与 `hermes claw migrate` (OpenClaw配置的一次性导入到Hermes) 混淆——`hermes migrate` 是顶级的配置重写命令。


## `hermes proxy`

```bash
hermes proxy <subcommand>
```

运行一个本地的、兼容OpenAI的HTTP服务器，将请求转发到一个经过OAuth认证的上游提供商（例如 Nous Portal, xAI）。外部应用程序可以使用任何bearer token指向该代理；该代理会在发送出去时附加您的真实OAuth凭证。有关完整指南，请参阅[订阅代理](../user-guide/features/subscription-proxy.md)。

| 子命令 | 描述 |
|------------|-------------|
| `start` | 在前台运行代理。标志：`--provider <nous\|xai>`（默认 `nous`），`--host <addr>`（默认 `127.0.0.1`；使用 `0.0.0.0` 在局域网暴露），`--port <int>`（默认 `8645`）。 |
| `status` | 显示哪些代理上游已准备就绪（凭证存在，OAuth有效）。 |
| `providers` | 列出可用的代理上游提供商。 |

## hermes security

```bash
hermes security <subcommand>
```

对 [OSV.dev](https://osv.dev) 进行按需漏洞扫描。涵盖 Hermes venv（已安装的 PyPI 分发包）、插件在 `~/.hermes/plugins/` 下声明的 Python 依赖项，以及 `config.yaml` 中固定的 `npx`/`uvx` MCP 服务器。不扫描全局安装的软件包或编辑器/浏览器扩展。

| Subcommand | Description |
|------------|-------------|
| `audit` | 执行一次性的供应链审计。 |

`audit` 标志:

| Flag | Default | Description |
|------|---------|-------------|
| `--json` | off | 而不是人类可读文本，而是发出机器可读的 JSON。 |
| `--fail-on <level>` | `critical` | 当任何发现达到此严重性级别（`low`、`moderate`、`high`、`critical`）时，则退出非零状态。 |
| `--skip-venv` | off | 跳过扫描 Hermes Python venv。 |
| `--skip-plugins` | off | 跳过扫描插件要求文件。 |
| `--skip-mcp` | off | 跳过扫描 `config.yaml` 中固定的 MCP 服务器。 |


## hermes login / hermes logout *(已弃用)*

:::caution
`hermes login` 已被移除。使用 `hermes auth` 来管理 OAuth 凭据，使用 `hermes model` 来选择提供商，或使用 `hermes setup` 进行完整的交互式设置。
:::

## `hermes auth`

用于相同提供商密钥轮换的凭证池管理。有关完整文档，请参阅[凭证池](/user-guide/features/credential-pools)。

```bash
hermes auth                                              # 交互式向导
hermes auth list                                         # 显示所有池
hermes auth list openrouter                              # 显示特定提供商
hermes auth add openrouter --api-key sk-or-v1-xxx        # 添加 API 密钥
hermes auth add anthropic --type oauth                   # 添加 OAuth 凭证
hermes auth remove openrouter 2                          # 按索引移除
hermes auth reset openrouter                             # 清除冷却时间
hermes auth status anthropic                             # 显示提供商的认证状态
hermes auth logout anthropic                             # 登出并清除存储的认证状态
hermes auth spotify                                      # 通过 PKCE 使用 Spotify 认证 Hermes
```

子命令：`add`、`list`、`remove`、`reset`、`status`、`logout`、`spotify`。如果不带任何子命令调用，将启动交互式管理向导。

## `hermes status`

```bash
hermes status [--all] [--deep]
```

| 选项 | 描述 |
|--------|-------------|
| `--all` | 以可分享的脱敏格式显示所有详细信息。 |
| `--deep` | 运行可能耗时更长的深度检查。 |

## `hermes cron`

```bash
hermes cron <list|create|edit|pause|resume|run|remove|status|tick>
```

| 子命令 | 描述 |
|------------|-------------|
| `list` | 显示已排定的任务。 |
| `create` / `add` | 从提示创建排定任务，可选择性地通过重复使用 `--skill` 附加一个或多个技能。 |
| `edit` | 更新任务的计划、提示、名称、交付方式、重复次数或所附带的技能。支持 `--clear-skills`、`--add-skill` 和 `--remove-skill`。 |
| `pause` | 暂停任务，而不删除它。 |
| `resume` | 恢复已暂停的任务并计算其下一次未来的运行时间。 |
| `run` | 在下一个调度器滴答时触发任务。 |
| `remove` | 删除排定的任务。 |
| `status` | 检查 cron 调度器是否正在运行。 |
| `tick` | 一次性运行到期的任务并退出。 |

Cron **触发器** 可通过 `cron.provider` 配置键进行插件化。为空（默认值）则使用内置的进程内计时器。可将其设置为 `chronos`（用于按需扩展托管网关的 NAS 管理提供商）—通过 `cron.chronos.*` 键（`portal_url`、`callback_url`、`expected_audience`、`nas_jwks_url`）配置—或在 `plugins/cron/<name>/` 或 `$HERMES_HOME/plugins/<name>/` 下命名一个自定义提供商。如果提供商未知或不可用，则回退到内置的计时器，因此 cron 永远不会没有触发器。请参阅[cron 内部机制](../developer-guide/cron-internals.md#gateway-integration) 文档。

## `hermes kanban`

```bash
hermes kanban [--board <slug>] <action> [options]
```

多资料、多项目协作看板。每个安装都可以托管多个看板（每个项目、仓库或域名的一个）；每个看板都是一个独立的队列，拥有自己的 SQLite 数据库和调度器范围。新安装会有一个名为 `default` 的看板，其 DB 为 `~/.hermes/kanban.db` 以保持向后兼容性；额外的看板位于 `~/.hermes/kanban/boards/<slug>/kanban.db`。网关嵌入式调度器每滴答都会扫描所有看板。

**全局标志（适用于以下所有操作）：**

| 标志 | 用途 |
|------|---------|
| `--board <slug>` | 在特定看板上操作。默认为当前看板（通过 `hermes kanban boards switch`、`HERMES_KANBAN_BOARD` 环境变量或 `default` 设置）。 |

**这是人类/脚本接口。** 由调度器生成的智能体工作者通过专用的 `kanban_*` [工具集](/user-guide/features/kanban#how-workers-interact-with-the-board)（`kanban_show`、`kanban_complete`、`kanban_block`、`kanban_create`、`kanban_link`、`kanban_comment`、`kanban_heartbeat`；编排器资料还包括 `kanban_list` 和 `kanban_unblock`）来驱动看板，而不是通过调用 `hermes kanban`。工作者在其环境中固定了 `HERMES_KANBAN_BOARD`，因此它们物理上无法看到其他看板。

| 操作 | 用途 |
|--------|---------|
| `init` | 如果缺失则创建 `kanban.db`。幂等操作。 |
| `boards list` / `boards ls` | 列出所有看板及其任务计数。支持 `--json`、`--all`（包括已归档的）。 |
| `boards create <slug>` | 创建一个新的看板。标志：`--name`、`--description`、`--icon`、`--color`、`--switch`（设为活动状态）。Slug 必须是 kebab-case，会自动小写化。 |
| `boards switch <slug>` / `boards use` | 将 `<slug>` 固化为活动看板（写入 `~/.hermes/kanban/current`）。 |
| `boards show` / `boards current` | 打印当前活动的看板的名称、DB 路径和任务计数。 |
| `boards rename <slug> "<name>"` | 更改看板的显示名称。Slug 是不可变的。 |
| `boards rm <slug>` | 归档（默认）或硬删除看板。`--delete` 跳过归档步骤。已归档的看板移动到 `boards/_archived/<slug>-<ts>/`。对 `default` 不执行此操作。 |
| `create "<title>"` | 在活动看板上创建一个新任务。标志：`--body`、`--assignee`、`--parent`（可重复）、`--workspace scratch\|worktree\|dir:<path>`、`--tenant`、`--priority`、`--triage`、`--idempotency-key`、`--max-runtime`、`--max-retries`、`--skill`（可重复）。 |
| `list` / `ls` | 列出活动看板上的任务。支持 `--mine`、`--assignee`、`--status`、`--tenant`、`--archived`、`--json` 进行过滤。 |
| `show <id>` | 显示一个任务及其评论和事件。机器输出使用 `--json`。 |
| `assign <id> <profile>` | 分配或重新分配。使用 `none` 取消分配。如果任务正在运行，则不执行。 |
| `link <parent> <child>` | 添加一个依赖关系。检测到循环。两个任务必须在同一个看板上。 |
| `unlink <parent> <child>` | 移除一个依赖关系。 |
| `claim <id>` | 原子性地认领一个待办任务。打印解析后的工作区路径。 |
| `comment <id> "<text>"` | 添加一条评论。下一个认领该任务的工作者会将其作为其 `kanban_show()` 响应的一部分读取。 |
| `complete <id>` | 标记任务完成。标志：`--result`、`--summary`、`--metadata`。 |
| `block <id> "<reason>"` | 将任务标记为阻塞，等待人工输入。还会将原因作为评论附加上去。 |
| `schedule <id> "<reason>"` | 将时间延迟/后续工作放入 `scheduled` 中，使其不会显示为人工阻塞项。 |
| `unblock <id>` | 将被阻塞或已排期的任务恢复到待办状态（如果依赖关系仍然开放则恢复到 `todo`）。 |
| `archive <id>` | 从默认列表中隐藏。`gc` 会删除 scratch 工作区。 |
| `tail <id>` | 跟踪一个任务的事件流。 |
| `dispatch` | 对活动看板进行一次调度器遍历。标志：`--dry-run`、`--max N`、`--failure-limit N`、`--json`。 |
| `context <id>` | 打印工作者将看到的完整上下文（标题 + 正文 + 父级结果 + 评论）。 |
| `specify <id>` / `specify --all` | 通过辅助 LLM 将一个分流列任务完善为一个具体的规范（包含目标、方法、验收标准），然后将其提升为 `todo`。标志：`--tenant`（将 `--all` 作用于一个租户）、`--author`、`--json`。在 `config.yaml` 的 `auxiliary.triage_specifier` 下配置模型。 |
| `decompose <id>` / `decompose --all` | 将一个分流列任务分解成一个由描述路由到专业智能体的子任务图。当 LLM 决定该任务不需要分流时，会回退到 specify 式的单任务提升。标志与 `specify` 相同。在 `config.yaml` 的 `auxiliary.kanban_decomposer` 下配置分解模型；`kanban.orchestrator_profile` 只控制谁拥有分流后的根/编排任务。当 `kanban.auto_decompose: true`（默认值）时，也会自动运行一次调度器滴答。请参阅[自动 vs 手动编排](/user-guide/features/kanban#auto-vs-manual-orchestration) 文档。 |
| `gc` | 移除已归档任务的 scratch 工作区。 |

示例：

```bash
# 创建第二个看板，并在上面放置一个任务，而无需切换。
hermes kanban boards create atm10-server --name "ATM10 Server" --icon 🎮
hermes kanban --board atm10-server create "Restart server" --assignee ops

# 切换活动看板以供后续调用使用。
hermes kanban boards switch atm10-server
hermes kanban list                  # 显示 atm10-server 的任务

# 归档一个看板（可恢复）或硬删除它。
hermes kanban boards rm atm10-server
hermes kanban boards rm atm10-server --delete
```

看板解析顺序（优先级从高到低）：`--board <slug>` 标志 → `HERMES_KANBAN_BOARD` 环境变量 → `~/.hermes/kanban/current` 文件 → `default`。

所有操作都可以在网关中作为斜杠命令（`/kanban …`）使用，具有相同的参数接口——包括 `boards` 子命令和 `--board` 标志。

有关完整的设计——与 Cline Kanban / Paperclip / NanoClaw / Gemini Enterprise 的比较、八种协作模式、四个用户故事、并发正确性证明——请参阅仓库中的 `docs/hermes-kanban-v1-spec.pdf` 或[看板用户指南](/user-guide/features/kanban)。

## `hermes webhook`

```bash
hermes webhook <subscribe|list|remove|test>
```

用于事件驱动的智能体激活，管理动态 Webhook 订阅。要求在配置中启用 Webhook 平台——如果未配置，将打印设置说明。

| 子命令 | 描述 |
|------------|-------------|
| `subscribe` / `add` | 创建一个 webhook 路由。返回 URL 和 HMAC 密钥，用于在您的服务上进行配置。 |
| `list` / `ls` | 显示所有智能体创建的订阅。 |
| `remove` / `rm` | 删除动态订阅。来自 config.yaml 的静态路由不受影响。 |
| `test` | 发送一个测试 POST 请求以验证订阅是否正常工作。 |

### `hermes webhook subscribe`

```bash
hermes webhook subscribe <name> [options]
```

| 选项 | 描述 |
|--------|-------------|
| `--prompt` | 包含 `{dot.notation}` Payload 引用的提示模板。 |
| `--events` | 要接受的逗号分隔事件类型（例如 `issues,pull_request`）。为空则表示所有。 |
| `--description` | 人类可读的描述。 |
| `--skills` | 要加载给智能体运行的逗号分隔技能名称。 |
| `--deliver` | 交付目标：`log`（默认）、`telegram`、`discord`、`slack`、`github_comment`。 |
| `--deliver-chat-id` | 用于跨平台交付的目标聊天/频道 ID。 |
| `--secret` | 自定义 HMAC 密钥。如果省略，则自动生成。 |
| `--deliver-only` | 跳过智能体——将渲染的 `--prompt` 作为字面消息进行交付。零 LLM 成本，亚秒级交付。要求 `--deliver` 是一个真实的目标（而不是 `log`）。 |

订阅会持久化到 `~/.hermes/webhook_subscriptions.json`，并且在网关重启时无需重新加载即可被 webhook 适配器热重载。

## `hermes doctor`

```bash
hermes doctor [--fix]
```

| 选项 | 描述 |
|--------|-------------|
| `--fix` | 在可能的情况下尝试自动修复。 |

## `hermes dump`

```bash
hermes dump [--show-keys]
```

输出一个关于整个 Hermes 设置的紧凑、纯文本摘要。设计用于在寻求支持时粘贴到 Discord、GitHub 问题或 Telegram 中——不含 ANSI 颜色，无特殊格式，只有数据。

| 选项 | 描述 |
|--------|-------------|
| `--show-keys` | 显示脱敏后的 API 密钥前缀（前 4 位和后 4 位），而不仅仅是 `set`/`not set`。 |

### 内容包括

| 部分 | 详情 |
|---------|---------|
| **Header** | Hermes 版本、发布日期、git commit hash |
| **Environment** | OS、Python 版本、OpenAI SDK 版本 |
| **Identity** | 活动资料名称、HERMES_HOME 路径 |
| **Model** | 配置的默认模型和提供商 |
| **Terminal** | 后端类型（本地、docker、ssh 等） |
| **API keys** | 所有 22 个提供商/工具 API 密钥的存在性检查 |
| **Features** | 已启用的工具集、MCP 服务器数量、内存提供商 |
| **Services** | 网关状态、配置的消息平台 |
| **Workload** | Cron 作业计数、已安装技能数 |
| **Config overrides** | 与默认值不同的任何配置值 |

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

- 在 GitHub 上报告错误——将摘要粘贴到您的问题中
- 在 Discord 中寻求帮助——在代码块中分享它
- 将您的设置与其他人进行比较
- 当某些功能不工作时进行的快速检查

:::tip
`hermes dump` 专门用于共享。要进行交互式诊断，请使用 `hermes doctor`。要获得可视化概览，请使用 `hermes status`。
:::

## `hermes debug`

```bash
hermes debug share [options]
```

将调试报告（系统信息 + 最近日志）上传到粘贴服务，获取可分享的 URL。这对于快速支持请求非常有用——它包含了帮助者诊断您问题的所需所有内容。

| 选项 | 描述 |
|--------|-------------|
| `--lines <N>` | 每个日志文件包含的日志行数（默认：200）。 |
| `--expire <days>` | 粘贴服务的有效期天数（默认：7）。 |
| `--local` | 不上传，在本地打印报告。 |

该报告包括系统信息（操作系统、Python 版本、Hermes 版本）、最近的智能体 (agent)、网关 (gateway)、GUI/仪表板和桌面日志（每个文件 512 KB 的限制），以及被屏蔽的 API 密钥状态。密钥总是被屏蔽——不会上传任何秘密信息。

尝试的粘贴服务顺序：paste.rs, dpaste.com。

### 示例

```bash
hermes debug share              # 上传调试报告，打印 URL
hermes debug share --lines 500  # 包含更多的日志行
hermes debug share --expire 30  # 将粘贴服务保留 30 天
hermes debug share --local      # 在终端中打印报告（不上传）
```

## `hermes backup`

```bash
hermes backup [options]
```

创建您的 Hermes 配置、技能、会话和数据的 zip 存档。备份排除了 hermes-agent 代码库本身。

| 选项 | 描述 |
|--------|-------------|
| `-o`, `--output <path>` | Zip 文件的输出路径（默认：`~/hermes-backup-<timestamp>.zip`）。 |
| `-q`, `--quick` | 快速快照：仅包含关键状态文件 (config.yaml, state.db, .env, auth, cron jobs)。比完整备份更快。 |
| `-l`, `--label <name>` | 快照的标签（仅与 `--quick` 一起使用）。 |

该备份使用了 SQLite 的 `backup()` API 进行安全复制，因此即使在 Hermes 运行时也能正确工作（WAL 模式安全）。

**Zip 文件中不包含的内容：**

- `*.db-wal`, `*.db-shm`, `*.db-journal` — SQLite 的 WAL / 共享内存 / 日志文件。`*.db` 文件已经通过 `sqlite3.backup()` 获取了一致的快照；如果随附带活态的伴侣文件，恢复时可能会看到一个未完全提交的状态。
- `checkpoints/` — 每个会话的轨迹缓存。按哈希键存储并为每个会话重新生成；无论如何移植到另一个安装中都无法干净地做到。
- `hermes-agent` 代码本身（这是一个用户数据备份，而不是代码库快照）。

### 示例

```bash
hermes backup                           # 完整备份到 ~/hermes-backup-*.zip
hermes backup -o /tmp/hermes.zip        # 完整备份到指定路径
hermes backup --quick                   # 快速状态快照
hermes backup --quick --label "pre-upgrade"  # 带标签的快速快照
```

## `hermes checkpoints`

```bash
hermes checkpoints [COMMAND]
```

检查和管理位于 `~/.hermes/checkpoints/` 的影子 Git 存储库——这是会话内 `/rollback` 命令背后的存储层。随时运行都安全；不需要智能体正在运行。

| 子命令 | 描述 |
|------------|-------------|
| `status` (默认) | 显示总大小、项目数量和每个项目的细分情况。裸运行 `hermes checkpoints` 即为此功能。 |
| `list` | `status` 的别名。 |
| `prune` | 强制进行清理扫描——删除孤立和陈旧的项目，垃圾回收存储库，执行大小限制。忽略 24 小时幂等性标记。 |
| `clear` | 删除整个检查点基础数据。不可逆；除非使用 `-f`，否则会要求确认。 |
| `clear-legacy` | 只删除 v1→v2 迁移产生的 `legacy-<timestamp>/` 存档。 |

### 选项

| 选项 | 子命令 | 描述 |
|--------|------------|-------------|
| `--limit N` | `status`, `list` | 要列出的最大项目数（默认 20）。 |
| `--retention-days N` | `prune` | 删除 `last_touch` 早于 N 天的项目（默认 7 天）。 |
| `--max-size-mb N` | `prune` | 在孤立/陈旧项目扫描后，删除每个项目中最老的提交，直到总存储大小 ≤ N MB（默认 500）。 |
| `--keep-orphans` | `prune` | 跳过那些工作目录已不存在的项目。 |
| `-f`, `--force` | `clear`, `clear-legacy` | 跳过确认提示。 |

### 示例

```bash
hermes checkpoints                                  # status 概览
hermes checkpoints prune --retention-days 3         # 激进清理
hermes checkpoints prune --max-size-mb 200          # 收紧大小限制
hermes checkpoints clear-legacy -f                  # 删除 v1 存档目录
hermes checkpoints clear -f                         # 清除所有内容
```

有关完整的架构和会话内命令，请参阅 [检查点和 `/rollback`](../user-guide/checkpoints-and-rollback.md)。

## `hermes import`

```bash
hermes import <zipfile> [options]
```

将先前创建的 Hermes 备份恢复到您的 Hermes 主目录。归档文件中的所有内容都会覆盖您 Hermes 主目录中现有文件；`--force` 只会跳过目标已存在 Hermes 安装时弹出的确认提示。

| 选项 | 描述 |
|--------|-------------|
| `-f`, `--force` | 跳过现有安装的确认提示。 |

:::warning
在导入之前停止网关，以避免与正在运行的进程发生冲突。
:::

### 示例
```bash
hermes import ~/hermes-backup-20260423.zip           # 在覆盖现有配置前提示
hermes import ~/hermes-backup-20260423.zip --force   # 无提示地覆盖
```

## `hermes logs`

```bash
hermes logs [log_name] [options]
```

查看、尾随和过滤 Hermes 日志文件。所有日志都存储在 `~/.hermes/logs/`（或非默认配置的 `<profile>/logs/`）。

### 日志文件

| 名称 | 文件 | 捕获的内容 |
|------|------|-----------------|
| `agent` (默认) | `agent.log` | 所有智能体活动——API 调用、工具分派、会话生命周期（INFO 及以上） |
| `errors` | `errors.log` | 警告和错误，仅——`agent.log` 的一个过滤子集 |
| `gateway` | `gateway.log` | 消息网关活动——平台连接、消息分派、Webhook 事件 |
| `gui` | `gui.log` | 仪表板 / TUI-网关 / PTY-桥接 / websocket 事件 |
| `desktop` | `desktop.log` | Electron 桌面应用——启动、后端生成输出和最近的 Python 追溯信息 |

### 选项

| 选项 | 描述 |
|--------|-------------|
| `log_name` | 要查看哪个日志：`agent`（默认）、`errors`、`gateway`，或 `list` 以显示带有大小信息的可用文件。 |
| `-n`, `--lines <N>` | 要显示的行数（默认：50）。 |
| `-f`, `--follow` | 实时尾随日志，类似于 `tail -f`。按 Ctrl+C 停止。 |
| `--level <LEVEL>` | 要显示的最低日志级别：`DEBUG`、`INFO`、`WARNING`、`ERROR`、`CRITICAL`。 |
| `--session <ID>` | 过滤包含会话 ID 子字符串的行。 |
| `--since <TIME>` | 显示从相对时间点开始的行：`30m`、`1h`、`2d` 等。支持 `s`（秒）、`m`（分钟）、`h`（小时）、`d`（天）。 |
| `--component <NAME>` | 按组件过滤：`gateway`、`agent`、`tools`、`cli`、`cron`。 |

### 示例

```bash
# 查看 agent.log (默认) 的最后 50 行
hermes logs

# 实时尾随 agent.log
hermes logs -f

# 查看 gateway.log 的最后 100 行
hermes logs gateway -n 100

# 只显示过去一小时的警告和错误
hermes logs --level WARNING --since 1h

# 按特定会话过滤
hermes logs --session abc123

# 尾随 errors.log，从 30 分钟前开始
hermes logs errors --since 30m -f

# 列出所有日志文件及其大小
hermes logs list
```

### 过滤

可以组合使用过滤器。当多个过滤器处于活动状态时，一行日志必须通过**所有**过滤器才能显示：

```bash
# 从过去 2 小时内、包含会话 "tg-12345" 的 WARNING+ 行
hermes logs --level WARNING --since 2h --session tg-12345
```

当 `--since` 处于活动状态时，没有可解析时间戳的行也会被包含（它们可能是多行日志条目的延续行）。当 `--level` 处于活动状态时，没有可检测到的级别的行也会被包含。

### 日志轮转

Hermes 使用 Python 的 `RotatingFileHandler`。旧日志会自动轮转——请查找 `agent.log.1`、`agent.log.2` 等。`hermes logs list` 子命令会显示所有日志文件，包括已轮转的文件。

## `hermes prompt-size`

```bash
hermes prompt-size [--platform <name>] [--json]
```

报告一个全新会话的固定提示预算——即在任何对话内容发送*之前*每次 API 调用都会发送的内容。这对于下游适配器或代理（proxy）的提示预算比模型的上下文窗口更严格的情况非常有用，或者当您想了解哪个区块（技能索引、内存、配置/profile）占主导地位时。

它会构建智能体将使用的相同系统提示，然后将其分解：

- **系统提示总计** — 完整的已组装提示（身份、指导、技能索引、上下文文件、内存、配置文件、时间戳）。
- **技能索引** — `<available_skills>` 区块。当安装了许多技能时，这通常是最大的单个区块。
- **内存和用户配置** — 您的 `MEMORY.md` / `USER.md` 快照。
- **提示层级** — stable（稳定）/ context（上下文）/ volatile（易变），匹配 Hermes 为缓存友好性分层提示的方式。
- **工具模式** — 所有已启用工具的 JSON（固定每次调用的负载另一半）。

它完全离线运行——不进行 API 调用，无需配置凭证即可工作。

```bash
# 适用于 CLI 平台的易读分解（默认）
hermes prompt-size

# 模拟消息平台提示（不同的平台提示）
hermes prompt-size --platform telegram

# 用于脚本的机器可读输出
hermes prompt-size --json
```

:::tip
技能索引和工具模式会随着您启用的技能和工具数量而扩展。要缩小提示，请禁用未使用的工具集（`hermes tools`）或卸载不需要的技能（`hermes skills`）。当前目录中的上下文文件（AGENTS.md, .cursorrules）也会计入总数。
:::

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
| `check` | 检查是否存在缺失或陈旧的配置。 |
| `migrate` | 交互式地添加新引入的选项。 |

## `hermes pairing`

```bash
hermes pairing <list|approve|revoke|clear-pending>
```

| 子命令 | 描述 |
|------------|-------------|
| `list` | 显示待定和已批准的用户。 |
| `approve <platform> <code>` | 批准一个配对代码。 |
| `revoke <platform> <user-id>` | 撤销用户的访问权限。 |
| `clear-pending` | 清除待定的配对代码。 |

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
| `inspect` | 在不安装的前提下预览一个技能。 |
| `list` | 列出已安装的技能。 |
| `check` | 检查已安装的主 Hub 技能是否有上游更新。 |
| `update` | 当有可用上游更改时，重新安装主 Hub 技能。 |
| `audit` | 重新扫描已安装的主 Hub 技能。 |
| `uninstall` | 移除一个由 Hub 安装的技能。 |
| `reset` | 清除标记为 `user_modified` 的捆绑技能（通过清除其清单条目）。使用 `--restore` 时，还会用捆绑版本替换用户副本。 |
| `opt-out` | 阻止捆绑技能被播种到活动配置中。写入一个 `.no-bundled-skills` 标记，这样安装程序、`hermes update` 和任何同步操作都不会播种捆绑技能。默认安全——不会触碰磁盘上的任何内容。使用 `--remove` 时，还会删除那些**未修改**的已存在捆绑技能（用户编辑、Hub 安装和手动编写的技能永远不会被移除；会先预览并确认，需使用 `--yes` 才能跳过）。 |
| `opt-in` | 通过移除 `.no-bundled-skills` 标记来撤销 `opt-out`，以便在下次 `hermes update` 时再次播种捆绑技能。使用 `--sync` 时，立即重新播种。 |
| `publish` | 将技能发布到注册表。 |
| `snapshot` | 导出/导入技能配置。 |
| `tap` | 管理自定义技能源。 |
| `config` | 按平台进行技能的交互式启用/禁用配置。 |

常见示例：

```bash
hermes skills browse
hermes skills browse --source official
hermes skills search react --source skills-sh
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect official/security/1password
hermes skills inspect skills-sh/vercel-labs/json-render/json-render-react
hermes skills install official/migration/openclaw-migration
hermes skills install skills-sh/anthropics/skills/pdf --force
hermes skills install https://sharethis.chat/SKILL.md                     # 直接 URL (单个 SKILL.md 文件)
hermes skills install https://example.com/SKILL.md --name my-skill        # 当前置信息中没有 name 时覆盖名称
hermes skills check
hermes skills update
hermes skills config
hermes skills reset google-workspace
hermes skills reset google-workspace --restore --yes
hermes skills opt-out                  # 停止未来的捆绑技能播种（不删除任何内容）
hermes skills opt-out --remove --yes   # 同时删除未修改的捆绑技能
hermes skills opt-in --sync            # 撤销：移除标记并立即重新播种
```

说明：
- `--force` 可以覆盖第三方/社区技能中非危险性的策略区块。
- `--force` 不会覆盖 `dangerous`（危险）扫描裁决。
- `--source skills-sh` 搜索公共的 `skills.sh` 目录。
- `--source well-known` 允许您将 Hermes 指向一个暴露了 `/.well-known/skills/index.json` 的站点。
- `--source browse-sh` 搜索 [browse.sh](https://browse.sh) 上面超过 200 个特定于站点的浏览器自动化技能的目录。标识符类似于 `browse-sh/airbnb.com/search-listings-ddgioa`。
- 传递一个 `http(s)://…/*.md` URL 会直接安装单个 SKILL.md 文件。如果前置信息中没有 `name:`，并且 URL slug 不是有效的标识符，则会提示终端要求输入名称；非交互式界面（TUI 内的 `/skills install`、网关平台）则需要使用 `--name <x>` 代替。

## `hermes bundles`

```bash
hermes bundles <subcommand>
```

技能捆绑包将多个技能归类到一个 `/ <bundle-name>` 斜杠命令下。调用该捆绑包会将所有引用的技能加载到一个单一的组合用户消息中。存储位置：`~/.hermes/skill-bundles/<slug>.yaml`。有关 YAML 模式和行为，请参阅 [Skill Bundles](../user-guide/features/skills.md#skill-bundles)。

子命令:

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出已安装的捆绑包（未指定子命令时的默认操作） |
| `show <name>` | 显示一个捆绑包的名称、描述、技能和文件路径 |
| `create <name>` | 创建一个新的捆绑包。可使用 `--skill <id>` (重复) 或省略进行交互式输入。支持 `--description`、`--instruction` 和 `--force`。 |
| `delete <name>` | 移除一个捆绑包文件 |
| `reload` | 重新扫描 `~/.hermes/skill-bundles/` 并报告添加/移除的捆绑包 |

示例:

```bash
hermes bundles create backend-dev \
  --skill github-code-review \
  --skill test-driven-development \
  --skill github-pr-workflow \
  -d "Backend feature work"

hermes bundles list
hermes bundles show backend-dev
hermes bundles delete backend-dev
```

在聊天会话中，`/bundles` 会列出已安装的捆绑包，而 `/<bundle-name>` 则加载其中一个。

## `hermes curator`

```bash
hermes curator <subcommand>
```

Curator 是一个辅助模型的后台任务，它会定期审查由智能体创建的技能，修剪过时的技能、整合重叠的部分，并归档过时（obsolete）的技能。捆绑包和通过 Hub 安装的技能永远不会被触动。存档是可恢复的；自动删除永不会发生。

| 子命令 | 描述 |
|------------|-------------|
| `status` | 显示 Curator 状态和技能统计信息 |
| `run` | 立即触发一次 Curator 审查（会阻塞，直到 LLM 流程完成） |
| `run --background` | 在后台线程中启动 LLM 流程并立即返回 |
| `run --dry-run` | 仅预览——生成审查报告，但不进行任何修改 |
| `backup` | 对 `~/.hermes/skills/` 进行手动 tar.gz 快照（Curator 也会在每次真实运行前自动快照） |
| `rollback` | 从快照恢复 `~/.hermes/skills/`（默认为最新的） |
| `rollback --list` | 列出可用的快照 |
| `rollback --id <ts>` | 通过 ID 恢复特定的快照 |
| `rollback -y` | 跳过确认提示 |
| `pause` | 暂停 Curator，直到被恢复 |
| `resume` | 恢复已暂停的 Curator |
| `pin <skill>` | 固定一个技能，确保 Curator 不会对其进行自动转换 |
| `unpin <skill>` | 解除固定一个技能 |
| `restore <skill>` | 恢复一个已归档的技能 |
| `archive <skill>` | 手动归档一个技能 |
| `prune` | 手动修剪 Curator 通常会清理的技能 |
| `list-archived` | 列出已归档的技能（可通过 `restore` 恢复） |

在全新安装时，第一次计划的运行将被推迟一个完整的 `interval_hours`（默认为 7 天）——在 `hermes update` 之后的首次检查中，网关将不会立即进行审查。请使用 `hermes curator run --dry-run` 进行预览。

有关行为和配置，请参阅 [Curator](../user-guide/features/curator.md)。

## `hermes moa`

配置 `/moa` 斜杠命令所使用的命名智能体混合（Mixture of Agents）预设。

```bash
hermes moa list
hermes moa configure [name]
hermes moa delete <name>
```

`hermes moa configure` 重用 Hermes 的提供者 → 模型选择器，用于每个参考模型和聚合器。一个预设是一种执行模式配置，而不是主要的模型或提供者。

## `hermes fallback`

```bash
hermes fallback <subcommand>
```

管理故障转移（fallback）提供者链。当主模型因速率限制、过载或连接错误而失败时，系统会按顺序尝试这些故障转移提供者。

| 子命令 | 描述 |
|------------|-------------|
| `list` (别名: `ls`) | 显示当前的故障转移链（如果没有子命令则默示显示）。 |
| `add` | 选择一个提供者 + 模型（与 `hermes model` 相同的选择器）并将其附加到链上。 |
| `remove` (别名: `rm`) | 选择一个条目从链中删除。 |
| `clear` | 删除所有故障转移条目。 |

请参阅 [Fallback Providers](../user-guide/features/fallback-providers.md)。

## `hermes hooks`

```bash
hermes hooks <subcommand>
```

检查在 `~/.hermes/config.yaml` 中声明的 Shell 脚本钩子（hooks），针对合成载荷（synthetic payloads）进行测试，并管理 `~/.hermes/shell-hooks-allowlist.json` 中的首次使用同意白名单。

| 子命令 | 描述 |
|------------|-------------|
| `list` (别名: `ls`) | 列出配置的钩子及其匹配器、超时和同意状态。 |
| `test <event>` | 将每个匹配 `<event>` 的钩子对合成载荷进行触发测试。 |
| `revoke` (别名: `remove`, `rm`) | 移除命令的白名单条目（在下次重启时生效）。 |
| `doctor` | 检查每个配置的钩子：执行位、白名单、mtime 漂移、JSON 有效性以及合成运行时间。 |

有关事件签名和载荷形状，请参阅 [Hooks](../user-guide/features/hooks.md)。

## `hermes memory`

```bash
hermes memory <subcommand>
```

设置和管理外部内存提供者插件。可用提供者包括 honcho, openviking, mem0, hindsight, holographic, retaindb, byterover, supermemory。同一时间只能有一个外部提供者处于活动状态。内置内存（MEMORY.md/USER.md）始终保持激活状态。

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `setup` | 交互式地选择和配置提供者。 |
| `status` | 显示当前的内存提供者配置。 |
| `off` | 禁用外部提供者（仅使用内置）。 |

:::info 提供者特定的子命令
当一个外部内存提供者处于活动状态时，它可能会注册自己的顶层 `hermes <provider>` 命令用于特定于该提供者的管理（例如，当 Honcho 激活时运行 `hermes honcho`）。非活动的提供者不会暴露其子命令。请运行 `hermes --help` 查看当前已连接的内容。
:::

## `hermes acp`

```bash
hermes acp
```

将 Hermes 作为 ACP（Agent Client Protocol，智能体客户端协议）stdio 服务器启动起来，用于编辑器集成。

相关入口点：

```bash
hermes-acp
python -m acp_adapter
```

请先安装支持：

```bash
cd ~/.hermes/hermes-agent && uv pip install -e '.[acp]'
```

请参阅 [ACP 编辑器集成](../user-guide/features/acp.md) 和 [ACP 内部机制](../developer-guide/acp-internals.md)。

## `hermes mcp`

```bash
hermes mcp <subcommand>
```

管理 MCP（Model Context Protocol，模型上下文协议）服务器配置，并将 Hermes 作为 MCP 服务器运行。

| 子命令 | 描述 |
|------------|-------------|
| *(none)* 或 `picker` | 交互式目录选择器——浏览 Nous 批准的 MCP 并进行安装/启用/禁用。 |
| `catalog` | 列出 Nous 批准的 MCP（纯文本，可脚本化）。 |
| `install <name>` | 安装一个目录条目（例如：`hermes mcp install n8n`）。 |
| `serve [-v\|--verbose]` | 将 Hermes 作为 MCP 服务器运行——向其他智能体暴露对话。 |
| `add <name> [--url URL] [--command CMD] [--auth oauth\|header] [--args ...]` | 添加一个具有自动工具发现功能的自定义 MCP 服务器。`--args` 将剩余的 argv 传递给 stdio 命令，因此应将其放在最后。 |
| `remove <name>` (别名: `rm`) | 从配置中移除一个 MCP 服务器。 |
| `list` (别名: `ls`) | 列出已配置的 MCP 服务器。 |
| `test <name>` | 测试与 MCP 服务器的连接。 |
| `configure <name>` (别名: `config`) | 切换服务器的工具选择状态。 |
| `login <name>` | 强制基于 OAuth 的 MCP 服务器重新进行身份验证。 |

请参阅 [MCP 配置参考](./mcp-config-reference.md)、[使用 Hermes 与 MCP](../guides/use-mcp-with-hermes.md) 和 [MCP 服务器模式](../user-guide/features/mcp.md#running-hermes-as-an-mcp-server)。

## `hermes plugins`

```bash
hermes plugins [subcommand]
```

统一的插件管理——在一个地方管理通用插件、内存提供者和上下文引擎。如果使用没有子命令运行 `hermes plugins`，将打开一个包含两个部分的复合式交互屏幕：

- **通用插件 (General Plugins)** — 用于启用/禁用已安装插件的多选复选框
- **提供者插件 (Provider Plugins)** — 针对内存提供者和上下文引擎的单选配置。点击任一类别可打开无线电选择器（radio picker）。

| 子命令 | 描述 |
|------------|-------------|
| *(none)* | 复合式交互界面——通用插件切换 + 提供者插件配置。 |
| `install <identifier> [--force]` | 从 Git URL 或 `owner/repo` 安装一个插件。 |
| `update <name>` | 拉取已安装插件的最新更改。 |
| `remove <name>` (别名: `rm`, `uninstall`) | 移除一个已安装的插件。 |
| `enable <name>` | 启用一个被禁用的插件。 |
| `disable <name>` | 在不移除的情况下禁用一个插件。 |
| `list` (别名: `ls`) | 列出已安装的插件及其启用/禁用状态。 |

提供者插件的选择会保存在 `config.yaml` 中：
- `memory.provider` — 活动内存提供者（为空则仅使用内置）。
- `context.engine` — 活动上下文引擎（`"compressor"` 为内置默认值）。

通用插件的禁用列表存储在 `config.yaml` 的 `plugins.disabled` 下。

请参阅 [Plugins](../user-guide/features/plugins.md) 和 [构建 Hermes 插件](../guides/build-a-hermes-plugin.md)。

## `hermes tools`

```bash
hermes tools [--summary]
```

| 选项 | 描述 |
|--------|-------------|
| `--summary` | 打印当前启用的工具摘要并退出。 |

如果不使用 `--summary`，则会启动平台特定的交互式工具配置 UI。

## `hermes computer-use`

```bash
hermes computer-use <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `install` | 运行上游 cua-driver 安装程序（仅限 macOS）。 |
| `install --upgrade` | 即使 cua-driver 已在 PATH 中，也重新运行安装程序。该上游脚本总是拉取最新版本，因此这会执行原地升级。 |
| `status` | 打印 `cua-driver` 是否在 `$PATH` 中以及已安装的版本号。 |

`hermes computer-use install` 是用于安装由 `computer_use` 工具集使用的 [cua-driver](https://github.com/trycua/cua) 二进制文件的稳定入口点。它运行与 `hermes tools` 在首次启用 Computer Use 时调用的相同的上游安装程序，因此即使工具集开关没有触发它（例如在返回用户设置时），使用它也是安全的。

`hermes update` 会在更新结束时自动重新运行上游安装程序，前提是 cua-driver 位于 PATH 中，因此大多数用户不需要手动调用 `--upgrade`。当上游发布一个您希望立即获得的修复程序，而不想等待下一个 Hermes 更新时，请使用它。

## `hermes sessions`

```bash
hermes sessions <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出最近的会话。 |
| `browse` | 带搜索和恢复功能的交互式会话选择器。 |
| `export <output> [--session-id ID]` | 将会话导出为 JSONL。 |
| `delete <session-id>` | 删除一个会话。 |
| `prune` | 删除旧的会话。 |
| `stats` | 显示会话存储的统计信息。 |
| `rename <session-id> <title>` | 设置或更改会话标题。 |

## `hermes insights`

```bash
hermes insights [--days N] [--source platform]
```

| 选项 | 描述 |
|--------|-------------|
| `--days <n>` | 分析最近 `n` 天（默认：30）。 |
| `--source <platform>` | 按来源过滤，例如 `cli`、`telegram` 或 `discord`。 |

## `hermes claw`

```bash
hermes claw migrate [options]
```

将您的 OpenClaw 设置迁移到 Hermes。它从 `~/.openclaw`（或自定义路径）读取数据，并写入 `~/.hermes`。它会自动检测旧的目录名称（`~/.clawdbot`, `~/.moltbot`）和配置文件名（`clawdbot.json`, `moltbot.json`）。

| 选项 | 描述 |
|--------|-------------|
| `--dry-run` | 在不写入任何内容的情况下预览将要迁移的内容。 |
| `--preset <name>` | 迁移预设：`full`（所有兼容设置）或 `user-data`（排除基础设施配置）。任一预设都不会导入密钥——请显式使用 `--migrate-secrets`。 |
| `--overwrite` | 在发生冲突时覆盖现有 Hermes 文件（默认：如果计划有冲突，则拒绝应用）。 |
| `--migrate-secrets` | 包含 API 密钥进行迁移。即使在 `--preset full` 下也需要此选项。 |
| `--no-backup` | 跳过 `~/.hermes/` 的预迁移 zip 快照（默认：在应用之前会写入一个可恢复的单点存档到 `~/.hermes/backups/pre-migration-*.zip`；可通过 `hermes import` 恢复）。 |
| `--source <path>` | 自定义 OpenClaw 目录（默认：`~/.openclaw`）。 |
| `--workspace-target <path>` | 工作区指令的目标目录（AGENTS.md）。 |
| `--skill-conflict <mode>` | 处理技能名称冲突的模式：`skip`（跳过，默认）、`overwrite` 或 `rename`。 |
| `--yes` | 跳过确认提示。 |

### 哪些内容会被迁移

本次迁移涵盖了超过 30 个类别，包括人物设定、内存、技能、模型提供者、消息平台、智能体行为、会话策略、MCP 服务器、TTS 等。这些项目要么被**直接导入**到 Hermes 的等效项中，要么被**存档**以供手动审查。

**直接导入：** SOUL.md, MEMORY.md, USER.md, AGENTS.md, 技能（4 个源目录）、默认模型、自定义提供者、MCP 服务器、消息平台令牌和白名单（Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Mattermost）、智能体默认设置（推理投入、压缩、人类延迟、时区、沙箱）、会话重置策略、批准规则、TTS 配置、浏览器设置、工具设置、执行超时、命令白名单、网关配置以及 3 个来源的 API 密钥。

**存档以供手动审查：** Cron 作业、插件、钩子/Webhook、内存后端（QMD）、技能注册表配置、UI/身份、日志记录、多智能体设置、频道绑定、IDENTITY.md, TOOLS.md, HEARTBEAT.md, BOOTSTRAP.md。

**API 密钥解析** 会按优先级顺序检查三个来源：配置值 → `~/.openclaw/.env` → `auth-profiles.json`。所有令牌字段都支持纯字符串、环境变量模板（`${VAR}`）和 SecretRef 对象。

有关完整的配置键映射、SecretRef 处理细节以及迁移后的检查清单，请参阅 **[完整迁移指南](../guides/migrate-from-openclaw.md)**。

### 示例

```bash
# 预览将要迁移的内容
hermes claw migrate --dry-run

# 完全迁移（所有兼容设置，不包含密钥）
hermes claw migrate --preset full

# 完全迁移，包括 API 密钥
hermes claw migrate --preset full --migrate-secrets

# 只迁移用户数据（不含密钥），覆盖冲突
hermes claw migrate --preset user-data --overwrite

# 从自定义 OpenClaw 路径进行迁移
hermes claw migrate --source /home/user/old-openclaw
```

## `hermes dashboard`

```bash
hermes dashboard [options]
```

启动 Web Dashboard —— 一个基于浏览器的 UI，用于管理配置、API 密钥和监控会话。需要运行 `cd ~/.hermes/hermes-agent && uv pip install -e ".[web]"` (FastAPI + Uvicorn)。嵌入的浏览器聊天标签始终可用，此外还需要 `pty` 额外依赖（`cd ~/.hermes/hermes-agent && uv pip install -e ".[web,pty]"`）以及像 Linux、macOS 或 WSL2 这样的 POSIX PTY 环境。请参阅 [Web Dashboard](/user-guide/features/web-dashboard) 获取完整文档。

| Option | Default | Description |
|--------|---------|-------------|
| `--port` | `9119` | 用于运行 Web 服务器的端口。 |
| `--host` | `127.0.0.1` | 绑定地址。 |
| `--no-open` | — | 不自动打开浏览器。 |
| `--insecure` | off | 允许绑定到非本地主机。这会在网络上暴露 Dashboard 凭证；仅在受信任的网络控制下使用。 |
| `--isolated` | off | 当从命名配置文件（`worker dashboard`）启动时，它会运行一个专属于该配置文件的服务器，而不是路由到机器 Dashboard。 |
| `--stop` | — | 停止正在运行的 `hermes dashboard` 进程并退出。 |
| `--status` | — | 列出正在运行的 `hermes dashboard` 进程并退出。 |

```bash
# Default — opens browser to http://127.0.0.1:9119
hermes dashboard

# Custom port, no browser
hermes dashboard --port 8080 --no-open

# From a profile alias — routes to the machine dashboard with the
# profile preselected in the sidebar switcher (attach if running)
worker dashboard
```

## `hermes profile`

```bash
hermes profile <subcommand>
```

管理配置文件 —— 多个隔离的 Hermes 实例，每个实例都有自己的配置、会话、技能和主目录。

| Subcommand | Description |
|------------|-------------|
| `list` | 列出所有配置文件。 |
| `use <name>` | 设置一个固定的默认配置文件。 |
| `create <name> [--clone] [--clone-all] [--clone-from <source>] [--no-alias]` | 创建一个新的配置文件。`--clone` 从活动配置中复制配置、`.env`、`SOUL.md` 和技能。`--clone-all` 复制所有状态。`--clone-from` 指定一个源配置文件，除非与 `--clone-all` 配对，否则它意味着配置克隆。 |
| `delete <name> [-y]` | 删除一个配置文件。 |
| `show <name>` | 显示配置文件详情（主目录、配置等）。 |
| `alias <name> [--remove] [--name NAME]` | 管理用于快速访问配置文件的包装脚本。 |
| `rename <old> <new>` | 重命名一个配置文件。 |
| `export <name> [-o FILE]` | 将配置文件导出到 `.tar.gz` 归档文件（本地备份）。 |
| `import <archive> [--name NAME]` | 从 `.tar.gz` 归档文件导入一个配置文件（本地恢复）。 |
| `install <source> [--name N] [--alias] [--force] [-y]` | 从 Git URL 或本地目录安装一个配置文件的分发包。 |
| `update <name> [--force-config] [-y]` | 重新拉取一个分发包；保留用户数据（记忆、会话、身份验证）。 |
| `info <name>` | 显示配置文件的分发清单（版本、要求、来源）。 |

Examples:

```bash
hermes profile list
hermes profile create work --clone
hermes profile use work
hermes profile alias work --name h-work
hermes profile export work -o work-backup.tar.gz
hermes profile import work-backup.tar.gz --name restored
hermes profile install github.com/user/my-distro --alias
hermes profile update work
hermes -p work chat -q "Hello from work profile"
```

## `hermes completion`

```bash
hermes completion [bash|zsh|fish]
```

将 Shell 补全脚本打印到标准输出。在您的 Shell 配置文件中引入该输出，以实现对 Hermes 命令、子命令和配置文件名称的 Tab 键补全。

Examples:

```bash
# Bash
hermes completion bash >> ~/.bashrc

# Zsh
hermes completion zsh >> ~/.zshrc

# Fish
hermes completion fish > ~/.config/fish/completions/hermes.fish
```

## `hermes update`

```bash
hermes update [--gateway] [--check] [--no-backup] [--backup] [--yes]
```

拉取最新的 `hermes-agent` 代码，并在管理的虚拟环境中重新安装依赖项，然后重新运行后安装钩子（MCP 服务器、技能同步、补全安装）。在正在运行的安装上安全执行。使用 `--check` 查看您的检出版本是否落后于 `origin/main`，而无需安装。

`hermes update` 会拉取配置的更新分支（默认：`main`）。如果您的检出版本位于另一个分支，Hermes 可能会在拉取之前检出更新分支。如果您想保持某个工作内容不参与自动 stash 流程，请在更新前提交该分支的工作内容。

| Option | Description |
|--------|-------------|
| `--gateway` | 由消息传递的 `/update` 命令使用的内部模式。它使用基于文件的进程间通信（IPC）来处理提示和进度流，而不是从终端标准输入读取。这不是一个网关重启标志。 |
| `--check` | 检查是否有可用更新，而无需拉取、安装依赖项或重启任何东西。 |
| `--no-backup` | 跳过本次运行的更新前备份，即使 `config.yaml` 中启用了 `updates.pre_update_backup`。 |
| `--backup` | 在拉取之前，为 `HERMES_HOME`（配置、身份验证、会话、技能、配对数据）创建一个带标签的更新前快照。默认是**关闭**——以前总是备份的行为会在大型主目录上增加每次更新所需的时间。通过在 `config.yaml` 中设置 `updates.pre_update_backup: true` 来永久开启它。 |
| `--yes`, `-y` | 针对配置迁移和 stash 恢复等交互式提示，默认回答“是”。会跳过 API 密钥输入；请单独运行 `hermes config migrate` 来处理这些事情。 |

附加行为：

- **网关重启。** 成功更新后，Hermes 会尝试自动重启所有正在运行的网关配置文件，以便它们能够使用新代码。当您想在不应用更新的情况下重启网关时，请使用 `hermes gateway restart`。
- **本地源更改。** 对于 Git 安装，在分支检出或拉取之前，脏的已跟踪文件和未跟踪文件都会被自动 stashed（`git stash push --include-untracked`）。交互式终端更新会询问是否恢复 stash。非交互式更新默认会恢复它；仅在本地源编辑应该在成功拉取后被丢弃的管理安装上设置 `updates.non_interactive_local_changes: discard`。如果 stash 恢复冲突或拉取失败，stash 将保持原位以供手动恢复。
- **npm lockfile 混乱（Churn）。** 在 stashing 或切换分支之前，Hermes 会尽力清理由 npm 安装/构建步骤产生的已跟踪 `package-lock.json` 差异。在运行 `hermes update` 之前，请提交或手动 stash 有意的 lockfile 编辑。
- **配对数据快照。** 即使 `--backup` 是关闭的，`hermes update` 也会在 `git pull` 之前对 `~/.hermes/pairing/` 和 Feishu 注释规则进行轻量级快照。如果拉取重写了您正在编辑的文件，您可以使用 `hermes backup restore --state pre-update` 进行回滚。
- **遗留的 `hermes.service` 警告。** 如果 Hermes 检测到预先更名的 `hermes.service` systemd 单元（而不是当前的 `hermes-gateway.service`），它会打印一个一次性的迁移提示，以便您可以避免循环抖动（flap-loop）问题。
- **退出代码。** 成功时为 `0`，拉取/安装/后安装错误时为 `1`，导致 `git pull` 失败的意外工作区更改时为 `2`。

## Maintenance commands

| Command | Description |
|---------|-------------|
| `hermes version` | 打印版本信息。 |
| `hermes update` | 拉取最新更改并重新安装依赖项。 |
| `hermes postinstall` | 内部引导。在安装脚本配置 Hermes（或在 `hermes update` 之后）运行一次，用于安装 pip 无法提供的非 Python 依赖项——Node.js 运行时、无头浏览器、ripgrep、ffmpeg——然后如果配置文件尚未配置，则触发 `hermes setup`。安全地幂等重跑。 |
| `hermes uninstall [--full] [--gui] [--yes]` | 移除 Hermes，可选地删除所有配置/数据。`--gui` 只移除桌面聊天 GUI，而保留智能体；`--full` 也会删除配置/数据；`--yes` 跳过提示。 |

## See also

- [Slash Commands Reference](./slash-commands.md)
- [CLI Interface](../user-guide/cli.md)
- [Sessions](../user-guide/sessions.md)
- [Skills System](../user-guide/features/skills.md)
- [Skins & Themes](../user-guide/features/skins.md)