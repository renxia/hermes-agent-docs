---
sidebar_position: 1
title: "CLI 命令参考"
description: "Hermes 终端命令及命令族的权威参考"
---

# CLI 命令参考

本页介绍您从 shell 运行的**终端命令**。

有关聊天内的斜杠命令，请参见 [斜杠命令参考](./slash-commands.md)。

## 全局入口

```bash
hermes [全局选项] <命令> [子命令/选项]
```

### 全局选项

| 选项 | 描述 |
|------|------|
| `--version`, `-V` | 显示版本并退出。 |
| `--profile <名称>`, `-p <名称>` | 选择本次调用要使用的 Hermes 配置文件。覆盖由 `hermes profile use` 设置的持久默认值。 |
| `--resume <会话>`, `-r <会话>` | 通过 ID 或标题恢复之前的会话。 |
| `--continue [名称]`, `-c [名称]` | 恢复最近的会话，或匹配标题的最近会话。 |
| `--worktree`, `-w` | 在隔离的 git 工作树中启动，用于并行智能体工作流。 |
| `--yolo` | 绕过危险命令批准提示。 |
| `--pass-session-id` | 将会话 ID 包含在智能体的系统提示中。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml` 并回退到内置默认值。`.env` 中的凭据仍会被加载。 |
| `--ignore-rules` | 跳过自动注入的 `AGENTS.md`、`SOUL.md`、`.cursorrules`、记忆和预加载技能。 |
| `--tui` | 启动 [TUI](../user-guide/tui.md) 而不是经典 CLI。等同于 `HERMES_TUI=1`。 |
| `--dev` | 与 `--tui` 一起使用时：直接通过 `tsx` 运行 TypeScript 源代码，而不是预构建的包（适用于 TUI 贡献者）。 |

## 顶层命令

| 命令 | 用途 |
|------|------|
| `hermes chat` | 与智能体进行交互式或一次性聊天。 |
| `hermes model` | 交互式选择默认的提供商和模型。 |
| `hermes fallback` | 管理当主模型出错时尝试的备用提供商。 |
| `hermes gateway` | 运行或管理消息网关服务。 |
| `hermes setup` | 针对全部或部分配置的交互式设置向导。 |
| `hermes whatsapp` | 配置并配对 WhatsApp 桥接器。 |
| `hermes slack` | Slack 辅助工具（当前功能：为每个命令生成原生斜杠命令的应用清单）。 |
| `hermes auth` | 管理凭据 — 添加、列出、移除、重置、设置策略。处理 Codex/Nous/Anthropic 的 OAuth 流程。 |
| `hermes login` / `logout` | **已弃用** — 请改用 `hermes auth`。 |
| `hermes status` | 显示智能体、认证和平台状态。 |
| `hermes cron` | 检查和触发 cron 调度器。 |
| `hermes kanban` | 多配置文件协作面板（任务、链接、调度器）。 |
| `hermes webhook` | 管理用于事件驱动激活的动态 webhook 订阅。 |
| `hermes hooks` | 检查、批准或移除在 `config.yaml` 中声明的 shell 脚本钩子。 |
| `hermes doctor` | 诊断配置和依赖问题。 |
| `hermes dump` | 可复制粘贴的设置摘要，用于支持/调试。 |
| `hermes debug` | 调试工具 — 上传日志和系统信息以获得支持。 |
| `hermes backup` | 将 Hermes 主目录备份到一个 zip 文件。 |
| `hermes checkpoints` | 检查 / 清理 / 清除 `~/.hermes/checkpoints/`（由 `/rollback` 使用的影子存储）。无参数运行可查看状态概览。 |
| `hermes import` | 从 zip 文件恢复 Hermes 备份。 |
| `hermes logs` | 查看、跟踪和过滤智能体/网关/错误日志文件。 |
| `hermes config` | 显示、编辑、迁移和查询配置文件。 |
| `hermes pairing` | 批准或撤销消息配对码。 |
| `hermes skills` | 浏览、安装、发布、审核和配置技能。 |
| `hermes curator` | 后台技能维护 — 状态、运行、暂停、固定。参见 [Curator](../user-guide/features/curator.md)。 |
| `hermes memory` | 配置外部记忆提供者。当特定于插件的提供商处于活动状态时，其子命令（例如 `hermes honcho`）会自动注册。 |
| `hermes acp` | 将 Hermes 作为 ACP 服务器运行以实现编辑器集成。 |
| `hermes mcp` | 管理 MCP 服务器配置并将 Hermes 作为 MCP 服务器运行。 |
| `hermes plugins` | 管理 Hermes 智能体插件（安装、启用、禁用、移除）。 |
| `hermes tools` | 按平台配置已启用的工具。 |
| `hermes computer-use` | 安装或检查 cua-driver 后端（macOS 计算机使用）。 |
| `hermes sessions` | 浏览、导出、清理、重命名和删除会话。 |
| `hermes insights` | 显示令牌/成本/活动分析。 |
| `hermes claw` | OpenClaw 迁移辅助工具。 |
| `hermes dashboard` | 启动 Web 仪表板以管理配置、API 密钥和会话。 |
| `hermes profile` | 管理配置文件 — 多个独立的 Hermes 实例。 |
| `hermes completion` | 打印 shell 补全脚本 (bash/zsh/fish)。 |
| `hermes version` | 显示版本信息。 |
| `hermes update` | 拉取最新代码并重新安装依赖项。`--check` 仅打印提交差异而不拉取；`--backup` 在拉取前对 `HERMES_HOME` 进行快照。 |
| `hermes uninstall` | 从系统中移除 Hermes。 |

## `hermes chat`

```bash
hermes chat [options]
```

常用选项：

| 选项 | 描述 |
|------|------|
| `-q`, `--query "..."` | 一次性、非交互式提示。 |
| `-m`, `--model <model>` | 覆盖本次运行使用的模型。 |
| `-t`, `--toolsets <csv>` | 启用一组逗号分隔的工具集。 |
| `--provider <provider>` | 强制指定提供商：`auto`、`openrouter`、`nous`、`openai-codex`、`copilot-acp`、`copilot`、`anthropic`、`gemini`、`google-gemini-cli`、`huggingface`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`minimax-oauth`、`kilocode`、`xiaomi`、`arcee`、`gmi`、`alibaba`、`alibaba-coding-plan`（别名 `alibaba_coding`）、`deepseek`、`nvidia`、`ollama-cloud`、`xai`（别名 `grok`）、`qwen-oauth`、`bedrock`、`opencode-zen`、`opencode-go`、`ai-gateway`、`azure-foundry`、`lmstudio`、`stepfun`、`tencent-tokenhub`（别名 `tencent`、`tokenhub`）。 |
| `-s`, `--skills <name>` | 为会话预加载一个或多个技能（可重复或逗号分隔）。 |
| `-v`, `--verbose` | 详细输出。 |
| `-Q`, `--quiet` | 程序化模式：隐藏横幅/旋转图标/工具预览。 |
| `--image <path>` | 将本地图像附加到单个查询中。 |
| `--resume <session>` / `--continue [name]` | 直接从 `chat` 恢复一个会话。 |
| `--worktree` | 为此次运行创建一个隔离的 git 工作树。 |
| `--checkpoints` | 在破坏性文件更改前启用文件系统检查点。 |
| `--yolo` | 跳过批准提示。 |
| `--pass-session-id` | 将会话 ID 传递到系统提示中。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml` 并使用内置默认值。`.env` 中的凭据仍会加载。对于隔离的 CI 运行、可重现的错误报告和第三方集成很有用。 |
| `--ignore-rules` | 跳过自动注入 `AGENTS.md`、`SOUL.md`、`.cursorrules`、持久记忆和预加载的技能。与 `--ignore-user-config` 结合使用可实现完全隔离的运行。 |
| `--source <tag>` | 用于过滤的会话源标签（默认值：`cli`）。对于不应出现在用户会话列表中的第三方集成，使用 `tool`。 |
| `--max-turns <N>` | 每次对话轮次的最大工具调用迭代次数（默认值：90，或配置中的 `agent.max_turns`）。 |

示例：

```bash
hermes
hermes chat -q "总结最新的 PRs"
hermes chat --provider openrouter --model anthropic/claude-sonnet-4.6
hermes chat --toolsets web,terminal,skills
hermes chat --quiet -q "仅返回 JSON"
hermes chat --worktree -q "审查此仓库并提交一个 PR"
hermes chat --ignore-user-config --ignore-rules -q "不包含个人设置的重现步骤"
```

### `hermes -z <prompt>` — 脚本化一次性调用

对于程序化调用者（shell 脚本、CI、cron、通过管道输入提示的父进程），`hermes -z` 是最纯粹的一次性入口点：**单个提示输入，最终响应文本输出，标准输出或标准错误上无其他内容。** 无横幅，无旋转图标，无工具预览，无 `Session:` 行 — 只有智能体的最终回复作为纯文本。

```bash
hermes -z "法国的首都是哪里？"
# → 巴黎。

# 父脚本可以干净地捕获响应：
answer=$(hermes -z "总结这个" < /path/to/file.txt)
```

单次运行覆盖（不修改 `~/.hermes/config.yaml`）：

| 标志 | 等效环境变量 | 用途 |
|---|---|---|
| `-m` / `--model <model>` | `HERMES_INFERENCE_MODEL` | 覆盖本次运行使用的模型 |
| `--provider <provider>` | `HERMES_INFERENCE_PROVIDER` | 覆盖本次运行使用的提供商 |

```bash
hermes -z "…" --provider openrouter --model openai/gpt-5.5
# 或者：
HERMES_INFERENCE_MODEL=anthropic/claude-sonnet-4.6 hermes -z "…"
```

相同的智能体，相同的工具，相同的技能 — 只是剥离了所有交互/装饰层。如果您还需要工具输出记录，请改用 `hermes chat -q`；`-z` 明确用于“我只想要最终答案”的场景。

## `hermes model`

交互式提供商 + 模型选择器。**这是用于添加新提供商、设置 API 密钥和运行 OAuth 流程的命令。** 请在您的终端中运行它 — 不要在活动的 Hermes 聊天会话内部运行。

```bash
hermes model
```

当您想要：
- **添加新提供商**（OpenRouter、Anthropic、Copilot、DeepSeek、自定义等）
- 登录基于 OAuth 的提供商（Anthropic、Copilot、Codex、Nous Portal）
- 输入或更新 API 密钥
- 从提供商特定的模型列表中选择
- 配置自定义/自托管端点
- 将新的默认值保存到配置中

时使用此命令。

:::warning hermes model 与 /model — 了解区别
**`hermes model`**（在终端中运行，在任何 Hermes 会话之外）是**完整的提供商设置向导**。它可以添加新提供商、运行 OAuth 流程、提示输入 API 密钥和配置端点。

**`/model`**（在活动的 Hermes 聊天会话中输入）只能**在您已设置的提供商和模型之间切换**。它不能添加新提供商、运行 OAuth 或提示输入 API 密钥。

**如果您需要添加新提供商：** 请先退出您的 Hermes 会话（`Ctrl+C` 或 `/quit`），然后从终端提示符运行 `hermes model`。
:::

### `/model` 斜杠命令（会话中）

在不离开会话的情况下切换已配置的模型：

```
/model                              # 显示当前模型和可用选项
/model claude-sonnet-4              # 切换模型（自动检测提供商）
/model zai:glm-5                    # 切换提供商和模型
/model custom:qwen-2.5              # 在自定义端点上使用模型
/model custom                       # 从自定义端点自动检测模型
/model custom:local:qwen-2.5        # 使用命名的自定义提供商
/model openrouter:anthropic/claude-sonnet-4  # 切换回云端
```

默认情况下，`/model` 的更改**仅应用于当前会话**。添加 `--global` 可将更改持久化到 `config.yaml`：

```
/model claude-sonnet-4 --global     # 切换并保存为新默认值
```

:::info 如果我只看到 OpenRouter 模型怎么办？
如果您只配置了 OpenRouter，`/model` 将只显示 OpenRouter 模型。要添加另一个提供商（Anthropic、DeepSeek、Copilot 等），请退出您的会话并从终端运行 `hermes model`。
:::

提供商和基础 URL 的更改会自动持久化到 `config.yaml`。当切换离开自定义端点时，陈旧的基础 URL 会被清除，以防止其泄露到其他提供商。

## `hermes 网关`

```bash
hermes gateway <子命令>
```

子命令：

| 子命令 | 描述 |
|--------|------|
| `run` | 在前台运行网关。推荐用于 WSL、Docker 和 Termux。 |
| `start` | 启动已安装的 systemd/launchd 后台服务。 |
| `stop` | 停止服务（或前台进程）。 |
| `restart` | 重启服务。 |
| `status` | 显示服务状态。 |
| `install` | 作为 systemd (Linux) 或 launchd (macOS) 后台服务安装。 |
| `uninstall` | 移除已安装的服务。 |
| `setup` | 交互式消息平台设置。 |

选项：

| 选项 | 描述 |
|------|------|
| `--all` | 对于 `start` / `restart` / `stop`：作用于**所有配置文件的**网关，而不仅仅是当前活动的 `HERMES_HOME`。如果您同时运行多个配置文件，并希望在 `hermes update` 后重启它们，此选项很有用。 |

:::tip WSL 用户
请使用 `hermes gateway run` 而不是 `hermes gateway start` —— WSL 的 systemd 支持不可靠。将其包装在 tmux 中以实现持久化：`tmux new -s hermes 'hermes gateway run'`。详情请参阅 [WSL 常见问题](/docs/reference/faq#wsl-gateway-keeps-disconnecting-or-hermes-gateway-start-fails)。
:::

## `hermes 设置`

```bash
hermes setup [model|tts|terminal|gateway|tools|agent] [--non-interactive] [--reset] [--quick] [--reconfigure]
```

**首次运行：** 启动首次设置向导。

**回访用户（已配置）：** 直接进入完整的重新配置向导 —— 每个提示都显示您当前的值作为默认值，按回车键保留或输入新值。无菜单。

直接跳转到某个部分，而不是完整的向导：

| 部分 | 描述 |
|------|------|
| `model` | 提供商和模型设置。 |
| `terminal` | 终端后端和沙箱设置。 |
| `gateway` | 消息平台设置。 |
| `tools` | 按平台启用/禁用工具。 |
| `agent` | 智能体行为设置。 |

选项：

| 选项 | 描述 |
|------|------|
| `--quick` | 对于回访用户运行：仅提示缺失或未设置的项。跳过已配置的项。 |
| `--non-interactive` | 使用默认值/环境值，不提示。 |
| `--reset` | 在设置前将配置重置为默认值。 |
| `--reconfigure` | 向后兼容别名 —— 现在在现有安装上直接运行 `hermes setup` 默认执行此操作。 |

## `hermes whatsapp`

```bash
hermes whatsapp
```

运行 WhatsApp 配对/设置流程，包括模式选择和二维码配对。

## `hermes slack`

```bash
hermes slack manifest              # 将清单打印到标准输出
hermes slack manifest --write      # 写入 ~/.hermes/slack-manifest.json
hermes slack manifest --slashes-only  # 仅输出 features.slash_commands 数组
```

生成一个 Slack 应用清单，将 `COMMAND_REGISTRY` 中的每个网关命令（`/btw`、`/stop`、`/model` 等）注册为一流的 Slack 斜杠命令——实现与 Discord 和 Telegram 功能对等。将输出粘贴到 [https://api.slack.com/apps](https://api.slack.com/apps) → 你的应用 → **功能 → 应用清单 → 编辑**，然后**保存**。如果权限范围或斜杠命令发生更改，Slack 会提示重新安装。

| 标志 | 默认值 | 用途 |
|------|---------|---------|
| `--write [PATH]` | 标准输出 | 写入文件而非标准输出。单独的 `--write` 会写入 `$HERMES_HOME/slack-manifest.json`。 |
| `--name NAME` | `Hermes` | Slack 中的机器人显示名称。 |
| `--description DESC` | 默认描述 | Slack 应用目录中显示的机器人描述。 |
| `--slashes-only` | 关闭 | 仅输出 `features.slash_commands`，以便合并到手动维护的清单中。 |

在 `hermes update` 之后再次运行 `hermes slack manifest --write` 以获取任何新命令。

## `hermes login` / `hermes logout` *（已弃用）*

:::caution
`hermes login` 已被移除。请使用 `hermes auth` 管理 OAuth 凭证，使用 `hermes model` 选择提供商，或使用 `hermes setup` 进行完整的交互式设置。
:::

## `hermes auth`

管理同提供商的密钥轮换凭证池。完整文档请参阅 [凭证池](/docs/user-guide/features/credential-pools)。

```bash
hermes auth                                              # 交互式向导
hermes auth list                                         # 显示所有凭证池
hermes auth list openrouter                              # 显示特定提供商
hermes auth add openrouter --api-key sk-or-v1-xxx        # 添加 API 密钥
hermes auth add anthropic --type oauth                   # 添加 OAuth 凭证
hermes auth remove openrouter 2                          # 按索引移除
hermes auth reset openrouter                             # 清除冷却状态
hermes auth status anthropic                             # 显示提供商的认证状态
hermes auth logout anthropic                             # 注销并清除存储的认证状态
hermes auth spotify                                      # 通过 PKCE 认证 Hermes 与 Spotify
```

子命令：`add`、`list`、`remove`、`reset`、`status`、`logout`、`spotify`。不带子命令调用时，将启动交互式管理向导。

## `hermes status`

```bash
hermes status [--all] [--deep]
```

| 选项 | 描述 |
|--------|-------------|
| `--all` | 以可共享的脱敏格式显示所有详细信息。 |
| `--deep` | 运行可能需要更长时间的深度检查。 |

## `hermes cron`

```bash
hermes cron <list|create|edit|pause|resume|run|remove|status|tick>
```

| 子命令 | 描述 |
|------------|-------------|
| `list` | 显示计划任务。 |
| `create` / `add` | 从提示创建计划任务，可通过重复使用 `--skill` 附加一个或多个技能。 |
| `edit` | 更新任务的计划、提示、名称、投递方式、重复次数或附加的技能。支持 `--clear-skills`、`--add-skill` 和 `--remove-skill`。 |
| `pause` | 暂停任务而不删除。 |
| `resume` | 恢复已暂停的任务并计算其下一次未来运行时间。 |
| `run` | 在下一个调度器刻度触发任务。 |
| `remove` | 删除计划任务。 |
| `status` | 检查定时调度程序是否正在运行。 |
| `tick` | 运行到期任务一次然后退出。 |

## `hermes kanban`

```bash
hermes kanban [--board <slug>] <action> [options]
```

多配置文件、多项目协作看板。每个安装可以托管多个看板（每个项目、仓库或域一个）；每个看板都是一个独立的队列，拥有自己的 SQLite 数据库和调度器作用域。新安装开始时有一个名为 `default` 的看板，其数据库为 `~/.hermes/kanban.db` 以保持向后兼容；其他看板位于 `~/.hermes/kanban/boards/<slug>/kanban.db`。网关内嵌的调度器每次扫描都会遍历所有看板。

**全局标志（适用于下面的所有操作）：**

| 标志 | 用途 |
|------|---------|
| `--board <slug>` | 操作特定看板。默认为当前看板（通过 `hermes kanban boards switch`、`HERMES_KANBAN_BOARD` 环境变量或 `default` 设置）。 |

**这是面向人类/脚本的界面。** 由调度器生成的智能体工作者通过专用的 `kanban_*` [工具集](/docs/user-guide/features/kanban#how-workers-interact-with-the-board)（`kanban_show`、`kanban_complete`、`kanban_block`、`kanban_create`、`kanban_link`、`kanban_comment`、`kanban_heartbeat`）来驱动看板，而不是调用 `hermes kanban` 命令。工作者的环境中固定设置了 `HERMES_KANBAN_BOARD`，因此它们物理上无法看到其他看板。

| 操作 | 用途 |
|--------|---------|
| `init` | 如果缺失则创建 `kanban.db`。幂等操作。 |
| `boards list` / `boards ls` | 列出所有看板及其任务数量。`--json`、`--all`（包括已归档）。 |
| `boards create <slug>` | 创建新看板。标志：`--name`、`--description`、`--icon`、`--color`、`--switch`（设为活动看板）。Slug 为 kebab-case 格式，自动小写。 |
| `boards switch <slug>` / `boards use` | 将 `<slug>` 持久化为活动看板（写入 `~/.hermes/kanban/current`）。 |
| `boards show` / `boards current` | 打印当前活动看板的名称、数据库路径和任务数量。 |
| `boards rename <slug> "<name>"` | 更改看板的显示名称。Slug 不可变。 |
| `boards rm <slug>` | 归档（默认）或硬删除看板。`--delete` 跳过归档步骤。已归档的看板移动到 `boards/_archived/<slug>-<ts>/`。对 `default` 拒绝此操作。 |
| `create "<title>"` | 在活动看板上创建新任务。标志：`--body`、`--assignee`、`--parent`（可重复）、`--workspace scratch\|worktree\|dir:<path>`、`--tenant`、`--priority`、`--triage`、`--idempotency-key`、`--max-runtime`、`--skill`（可重复）。 |
| `list` / `ls` | 列出活动看板上的任务。使用 `--mine`、`--assignee`、`--status`、`--tenant`、`--archived`、`--json` 进行过滤。 |
| `show <id>` | 显示任务及其评论和事件。`--json` 用于机器输出。 |
| `assign <id> <profile>` | 分配或重新分配。使用 `none` 取消分配。任务运行时拒绝操作。 |
| `link <parent> <child>` | 添加依赖项。检测到循环。两个任务必须在同一看板上。 |
| `unlink <parent> <child>` | 移除依赖项。 |
| `claim <id>` | 原子性地认领一个就绪的任务。打印解析后的工作区路径。 |
| `comment <id> "<text>"` | 追加评论。认领该任务的下一个工作者会将其作为 `kanban_show()` 响应的一部分读取。 |
| `complete <id>` | 标记任务完成。标志：`--result`、`--summary`、`--metadata`。 |
| `block <id> "<reason>"` | 标记任务阻塞。同时将原因作为评论追加。 |
| `unblock <id>` | 将阻塞的任务返回到就绪状态。 |
| `archive <id>` | 从默认列表中隐藏。`gc` 将移除草稿工作区。 |
| `tail <id>` | 跟踪任务的事件流。 |
| `dispatch` | 对活动看板进行一次调度器传递。标志：`--dry-run`、`--max N`、`--json`。 |
| `context <id>` | 打印工作者将看到的完整上下文（标题 + 内容 + 父任务结果 + 评论）。 |
| `specify <id>` / `specify --all` | 通过辅助 LLM 将待分诊列的任务充实为具体规格说明（包含目标、方法、验收标准的标题和内容），然后将其提升到 `todo`。标志：`--tenant`（将 `--all` 的范围限定为某个租户）、`--author`、`--json`。在 `config.yaml` 的 `auxiliary.triage_specifier` 下配置模型。 |
| `gc` | 移除已归档任务的草稿工作区。 |

示例：

```bash
# 创建第二个看板并在其上添加任务，无需切换。
hermes kanban boards create atm10-server --name "ATM10 Server" --icon 🎮
hermes kanban --board atm10-server create "Restart server" --assignee ops

# 为后续调用切换活动看板。
hermes kanban boards switch atm10-server
hermes kanban list                  # 显示 atm10-server 的任务

# 归档看板（可恢复）或硬删除。
hermes kanban boards rm atm10-server
hermes kanban boards rm atm10-server --delete
```

看板解析顺序（优先级从高到低）：`--board <slug>` 标志 → `HERMES_KANBAN_BOARD` 环境变量 → `~/.hermes/kanban/current` 文件 → `default`。

所有操作也作为网关中的斜杠命令提供（`/kanban …`），具有相同的参数界面——包括 `boards` 子命令和 `--board` 标志。

要了解完整设计——与 Cline Kanban / Paperclip / NanoClaw / Gemini Enterprise 的比较、八种协作模式、四个用户故事、并发正确性证明——请参见仓库中的 `docs/hermes-kanban-v1-spec.pdf` 或 [看板用户指南](/docs/user-guide/features/kanban)。

## `hermes webhook`

```bash
hermes webhook <subscribe|list|remove|test>
```

管理用于事件驱动智能体激活的动态 webhook 订阅。需要在配置中启用 webhook 平台 — 如果未配置，将打印设置说明。

| 子命令 | 描述 |
|------------|-------------|
| `subscribe` / `add` | 创建一个 webhook 路由。返回用于在您的服务上配置的 URL 和 HMAC 密钥。 |
| `list` / `ls` | 显示所有由智能体创建的订阅。 |
| `remove` / `rm` | 删除一个动态订阅。config.yaml 中的静态路由不受影响。 |
| `test` | 发送一个测试 POST 请求以验证订阅是否正常工作。 |

### `hermes webhook subscribe`

```bash
hermes webhook subscribe <name> [options]
```

| 选项 | 描述 |
|--------|-------------|
| `--prompt` | 包含 `{dot.notation}` 载荷引用的提示模板。 |
| `--events` | 要接受的逗号分隔的事件类型（例如 `issues,pull_request`）。留空 = 全部接受。 |
| `--description` | 人类可读的描述。 |
| `--skills` | 为智能体运行加载的逗号分隔的技能名称。 |
| `--deliver` | 交付目标：`log`（默认）、`telegram`、`discord`、`slack`、`github_comment`。 |
| `--deliver-chat-id` | 用于跨平台交付的目标聊天/频道 ID。 |
| `--secret` | 自定义 HMAC 密钥。如果省略则自动生成。 |
| `--deliver-only` | 跳过智能体 — 直接将渲染后的 `--prompt` 作为原始消息交付。零 LLM 成本，亚秒级交付。要求 `--deliver` 是一个真实目标（非 `log`）。 |

订阅会持久化到 `~/.hermes/webhook_subscriptions.json`，并由 webhook 适配器热重载，无需重启网关。

## `hermes doctor`

```bash
hermes doctor [--fix]
```

| 选项 | 描述 |
|--------|-------------|
| `--fix` | 尝试在可能的情况下自动修复。 |

## `hermes dump`

```bash
hermes dump [--show-keys]
```
输出您整个 Hermes 设置的紧凑纯文本摘要。设计用于在 Discord、GitHub 问题或 Telegram 中寻求帮助时复制粘贴 — 无 ANSI 颜色，无特殊格式，只有数据。

| 选项 | 描述 |
|------|------|
| `--show-keys` | 显示已脱敏的 API 密钥前缀（首尾各4个字符），而不是仅显示 `set`/`not set`。 |

### 包含内容

| 部分 | 详情 |
|------|------|
| **标题** | Hermes 版本、发布日期、git 提交哈希 |
| **环境** | 操作系统、Python 版本、OpenAI SDK 版本 |
| **身份** | 当前活动的配置文件名称、HERMES_HOME 路径 |
| **模型** | 配置的默认模型和提供商 |
| **终端** | 后端类型（本地、docker、ssh 等） |
| **API 密钥** | 所有 22 个提供商/工具 API 密钥的存在性检查 |
| **功能** | 已启用的工具集、MCP 服务器数量、内存提供商 |
| **服务** | 网关状态、已配置的消息平台 |
| **工作负载** | 定时任务数量、已安装技能数量 |
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

- 在 GitHub 上报告错误 — 将 dump 粘贴到你的 issue 中
- 在 Discord 中寻求帮助 — 在代码块中分享它
- 将你的设置与他人的设置进行比较
- 当某些功能不工作时进行快速健全性检查

:::tip
`hermes dump` 专门用于分享。如需交互式诊断，请使用 `hermes doctor`。如需可视化概览，请使用 `hermes status`。
:::

## `hermes debug`

```bash
hermes debug share [options]
```
上传调试报告（系统信息 + 最近日志）到粘贴服务，并获得可分享的 URL。对于快速支持请求很有用 — 包含了助手诊断你的问题所需的一切。

| 选项 | 描述 |
|------|------|
| `--lines <N>` | 每个日志文件包含的日志行数（默认：200）。 |
| `--expire <days>` | 粘贴内容的过期天数（默认：7）。 |
| `--local` | 在本地打印报告而不是上传。 |

报告包括系统信息（操作系统、Python 版本、Hermes 版本）、最近的智能体和网关日志（每个文件 512 KB 限制）以及已脱敏的 API 密钥状态。密钥始终被脱敏 — 不会上传任何秘密信息。

按顺序尝试的粘贴服务：paste.rs, dpaste.com。

### 示例

```bash
hermes debug share              # 上传调试报告，打印 URL
hermes debug share --lines 500  # 包含更多日志行
hermes debug share --expire 30  # 保留粘贴内容 30 天
hermes debug share --local      # 在终端打印报告（不上传）
```

## `hermes backup`

```bash
hermes backup [options]
```
创建一个包含你的 Hermes 配置、技能、会话和数据的 zip 压缩包。备份不包含 hermes-agent 代码库本身。

| 选项 | 描述 |
|------|------|
| `-o`, `--output <path>` | zip 文件的输出路径（默认：`~/hermes-backup-<timestamp>.zip`）。 |
| `-q`, `--quick` | 快速快照：仅包含关键状态文件（config.yaml, state.db, .env, auth, 定时任务）。比完整备份快得多。 |
| `-l`, `--label <name>` | 快照标签（仅与 `--quick` 一起使用）。 |

备份使用 SQLite 的 `backup()` API 进行安全复制，因此即使 Hermes 正在运行也能正常工作（WAL 模式安全）。

**zip 中排除的内容：**

- `*.db-wal`, `*.db-shm`, `*.db-journal` — SQLite 的 WAL / 共享内存 / 日志附属文件。`*.db` 文件已通过 `sqlite3.backup()` 获得一致快照；将活动的附属文件一并打包会让恢复过程看到一个半提交的状态。
- `checkpoints/` — 按会话缓存的轨迹。以哈希为键，按会话重新生成；无论如何也无法无缝移植到另一个安装实例。
- `hermes-agent` 代码本身（这是用户数据备份，不是仓库快照）。

### 示例

```bash
hermes backup                           # 完整备份到 ~/hermes-backup-*.zip
hermes backup -o /tmp/hermes.zip        # 完整备份到指定路径
hermes backup --quick                   # 仅快速状态快照
hermes backup --quick --label "pre-upgrade"  # 带标签的快速快照
```

## `hermes checkpoints`

```bash
hermes checkpoints [COMMAND]
```
检查和管理位于 `~/.hermes/checkpoints/` 的影子 git 存储 — 这是会话内 `/rollback` 命令背后的存储层。可随时安全运行；无需智能体正在运行。

| 子命令 | 描述 |
|--------|------|
| `status` (默认) | 显示总大小、项目数量和每个项目的细分。直接运行 `hermes checkpoints` 等效。 |
| `list` | `status` 的别名。 |
| `prune` | 强制进行清理扫描 — 删除孤立和过时的项目，垃圾回收存储，强制执行大小上限。忽略 24 小时幂等标记。 |
| `clear` | 删除整个检查点基础目录。不可逆；除非指定 `-f`，否则会要求确认。 |
| `clear-legacy` | 仅删除由 v1→v2 迁移产生的 `legacy-<timestamp>/` 归档目录。 |

### 选项

| 选项 | 适用子命令 | 描述 |
|------|------------|------|
| `--limit N` | `status`, `list` | 列出的最大项目数（默认 20）。 |
| `--retention-days N` | `prune` | 丢弃 `last_touch` 早于 N 天的项目（默认 7）。 |
| `--max-size-mb N` | `prune` | 在孤立/过时项目清理后，丢弃每个项目最旧的提交，直到总存储大小 ≤ N MB（默认 500）。 |
| `--keep-orphans` | `prune` | 跳过删除工作目录已不存在的项目。 |
| `-f`, `--force` | `clear`, `clear-legacy` | 跳过确认提示。 |

### 示例

```bash
hermes checkpoints                                  # 状态概览
hermes checkpoints prune --retention-days 3         # 激进清理
hermes checkpoints prune --max-size-mb 200          # 一次性收紧大小上限
hermes checkpoints clear-legacy -f                  # 删除 v1 归档目录
hermes checkpoints clear -f                         # 清除所有内容
```

参见 [检查点与 `/rollback`](../user-guide/checkpoints-and-rollback.md) 了解完整架构和会话内命令。

## `hermes import`

```bash
hermes import <zipfile> [options]
```
将先前创建的 Hermes 备份恢复到你的 Hermes 主目录。压缩包中的所有文件将覆盖你 Hermes 主目录中的现有文件；`--force` 仅在目标目录已存在 Hermes 安装时跳过确认提示。

| 选项 | 描述 |
|------|------|
| `-f`, `--force` | 跳过已存在安装的确认提示。 |

:::warning
导入前请停止网关，以避免与正在运行的进程发生冲突。
:::

### 示例
```bash
hermes import ~/hermes-backup-20260423.zip           # 覆盖现有配置前提示
hermes import ~/hermes-backup-20260423.zip --force   # 无提示覆盖
```

## `hermes logs`

```bash
hermes logs [log_name] [options]
```
查看、跟踪和过滤 Hermes 日志文件。所有日志存储在 `~/.hermes/logs/`（对于非默认配置文件则是 `<profile>/logs/`）。

### 日志文件

| 名称 | 文件 | 捕获内容 |
|------|------|----------|
| `agent` (默认) | `agent.log` | 所有智能体活动 — API 调用、工具调度、会话生命周期（INFO 及以上级别） |
| `errors` | `errors.log` | 仅警告和错误 — agent.log 的一个过滤子集 |
| `gateway` | `gateway.log` | 消息网关活动 — 平台连接、消息调度、webhook 事件 |

### 选项

| 选项 | 描述 |
|------|------|
| `log_name` | 要查看的日志：`agent` (默认), `errors`, `gateway`, 或 `list` 以显示可用文件及其大小。 |
| `-n`, `--lines <N>` | 显示的行数（默认：50）。 |
| `-f`, `--follow` | 实时跟踪日志，类似 `tail -f`。按 Ctrl+C 停止。 |
| `--level <LEVEL>` | 要显示的最低日志级别：`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`。 |
| `--session <ID>` | 过滤包含会话 ID 子串的行。 |
| `--since <TIME>` | 显示从相对时间前的行：`30m`, `1h`, `2d` 等。支持 `s` (秒), `m` (分钟), `h` (小时), `d` (天)。 |
| `--component <NAME>` | 按组件过滤：`gateway`, `agent`, `tools`, `cli`, `cron`。 |

### 示例

```bash
# 查看 agent.log 的最后 50 行（默认）
hermes logs

# 实时跟踪 agent.log
hermes logs -f

# 查看 gateway.log 的最后 100 行
hermes logs gateway -n 100

# 仅显示最近一小时的警告和错误
hermes logs --level WARNING --since 1h

# 按特定会话过滤
hermes logs --session abc123

# 从 30 分钟前开始跟踪 errors.log
hermes logs errors --since 30m -f

# 列出所有日志文件及其大小
hermes logs list
```

### 过滤

过滤器可以组合使用。当多个过滤器处于活动状态时，日志行必须**全部**满足条件才会被显示：

```bash
# 最近 2 小时内、级别为 WARNING 及以上、包含会话 "tg-12345" 的行
hermes logs --level WARNING --since 2h --session tg-12345
```

当 `--since` 活动时，没有可解析时间戳的行也会被包含（它们可能是多行日志条目的续行）。当 `--level` 活动时，没有可检测级别的行也会被包含。

### 日志轮转

Hermes 使用 Python 的 `RotatingFileHandler`。旧日志会自动轮转 — 查找 `agent.log.1`, `agent.log.2` 等。`hermes logs list` 子命令显示所有日志文件，包括已轮转的。

## `hermes config`

```bash
hermes config <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `show` | 显示当前配置值。 |
| `edit` | 在编辑器中打开 `config.yaml`。 |
| `set <key> <value>` | 设置配置值。 |
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
| `approve <platform> <code>` | 批准一个配对码。 |
| `revoke <platform> <user-id>` | 撤销用户的访问权限。 |
| `clear-pending` | 清除待处理的配对码。 |

## `hermes skills`

```bash
hermes skills <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `browse` | 分页浏览技能注册表。 |
| `search` | 搜索技能注册表。 |
| `install` | 安装技能。 |
| `inspect` | 预览技能而不安装。 |
| `list` | 列出已安装的技能。 |
| `check` | 检查已安装的集线器技能是否有上游更新。 |
| `update` | 在可用时重新安装集线器技能以应用上游更改。 |
| `audit` | 重新扫描已安装的集线器技能。 |
| `uninstall` | 移除通过集线器安装的技能。 |
| `reset` | 通过清除其清单条目，解除被标记为 `user_modified` 的捆绑技能的卡顿状态。使用 `--restore` 时，还会将用户副本替换为捆绑版本。 |
| `publish` | 将技能发布到注册表。 |
| `snapshot` | 导出/导入技能配置。 |
| `tap` | 管理自定义技能来源。 |
| `config` | 按平台交互式启用/禁用技能配置。 |

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
hermes skills install https://sharethis.chat/SKILL.md                     # 直接 URL (单文件 SKILL.md)
hermes skills install https://example.com/SKILL.md --name my-skill        # 当前端没有名称时覆盖名称
hermes skills check
hermes skills update
hermes skills config
hermes skills reset google-workspace
hermes skills reset google-workspace --restore --yes
```

说明：
- `--force` 可以覆盖第三方/社区技能的非危险策略阻止。
- `--force` 不能覆盖 `dangerous` 的扫描结论。
- `--source skills-sh` 搜索公共 `skills.sh` 目录。
- `--source well-known` 让您将 Hermes 指向一个暴露 `/.well-known/skills/index.json` 的站点。
- 传递 `http(s)://…/*.md` URL 将直接安装单文件 SKILL.md。当前端没有 `name:` 且 URL 路径不是有效标识符时，交互式终端会提示输入名称；非交互式界面（TUI 内的 `/skills install`、网关平台）则需要改用 `--name <x>`。

## `hermes curator`

```bash
hermes curator <subcommand>
```

策展人是一个辅助模型后台任务，定期审查智能体创建的技能，修剪过时的，合并重叠的，并归档废弃的技能。捆绑和通过集线器安装的技能永远不会被触及。归档是可恢复的；自动删除永远不会发生。

| 子命令 | 描述 |
|------------|-------------|
| `status` | 显示策展人状态和技能统计信息 |
| `run` | 立即触发策展人审查（阻塞直到 LLM 处理完成） |
| `run --background` | 在后台线程中启动 LLM 处理并立即返回 |
| `run --dry-run` | 仅预览 — 生成审查报告而不进行任何修改 |
| `backup` | 对 `~/.hermes/skills/` 手动创建 tar.gz 快照（策展人在每次实际运行前也会自动快照） |
| `rollback` | 从快照恢复 `~/.hermes/skills/`（默认为最新的） |
| `rollback --list` | 列出可用快照 |
| `rollback --id <ts>` | 通过 id 恢复特定快照 |
| `rollback -y` | 跳过确认提示 |
| `pause` | 暂停策展人直到恢复 |
| `resume` | 恢复已暂停的策展人 |
| `pin <skill>` | 固定技能，使策展人永远不会自动转换它 |
| `unpin <skill>` | 取消固定技能 |
| `restore <skill>` | 恢复已归档的技能 |
| `archive <skill>` | 手动归档技能 |
| `prune` | 手动修剪策展人通常会清理的技能 |
| `list-archived` | 列出已归档的技能（可通过 `restore` 恢复） |

在全新安装时，首次计划的运行会延迟一个完整的 `interval_hours`（默认为 7 天）— 在 `hermes update` 后的第一个刻度网关不会立即进行策展。使用 `hermes curator run --dry-run` 在那之前进行预览。

行为和配置请参见 [策展人](../user-guide/features/curator.md)。

## `hermes fallback`

```bash
hermes fallback <subcommand>
```

管理回退提供者链。当主模型因速率限制、过载或连接错误而失败时，将按顺序尝试回退提供者。

| 子命令 | 描述 |
|------------|-------------|
| `list` (别名: `ls`) | 显示当前的回退链（没有子命令时的默认行为） |
| `add` | 选择一个提供者 + 模型（与 `hermes model` 使用的选择器相同）并添加到链中 |
| `remove` (别名: `rm`) | 选择要从链中删除的条目 |
| `clear` | 移除所有回退条目 |

参见 [回退提供者](../user-guide/features/fallback-providers.md)。

## `hermes hooks`

```bash
hermes hooks <subcommand>
```

检查在 `~/.hermes/config.yaml` 中声明的 shell 脚本钩子，用合成负载测试它们，并管理位于 `~/.hermes/shell-hooks-allowlist.json` 的首次使用同意允许列表。

| 子命令 | 描述 |
|------------|-------------|
| `list` (别名: `ls`) | 列出已配置的钩子，包括匹配器、超时和同意状态 |
| `test <event>` | 对匹配 `<event>` 的每个钩子触发一个合成负载 |
| `revoke` (别名: `remove`, `rm`) | 移除一个命令的允许列表条目（下次重启时生效） |
| `doctor` | 检查每个已配置的钩子：执行位、允许列表、修改时间偏差、JSON 有效性和合成运行计时 |

事件签名和负载形状请参见 [钩子](../user-guide/features/hooks.md)。

## `hermes memory`

```bash
hermes memory <subcommand>
```

设置和管理外部记忆提供者插件。可用提供者：honcho, openviking, mem0, hindsight, holographic, retaindb, byterover, supermemory。同一时间只能激活一个外部提供者。内置记忆 (MEMORY.md/USER.md) 始终处于活动状态。

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `setup` | 交互式选择提供者并进行配置。 |
| `status` | 显示当前记忆提供者配置。 |
| `off` | 禁用外部提供者（仅使用内置）。 |

:::info 提供者特定子命令
当外部记忆提供者处于活动状态时，它可能会注册自己的顶层 `hermes <provider>` 命令用于提供者特定的管理（例如，当 Honcho 处于活动状态时使用 `hermes honcho`）。不活动的提供者不会暴露其子命令。运行 `hermes --help` 以查看当前连接了哪些命令。
:::

## `hermes acp`

```bash
hermes acp
```

将 Hermes 作为 ACP (智能体客户端协议) stdio 服务器启动，用于编辑器集成。

相关入口点：

```bash
hermes-acp
python -m acp_adapter
```

首先安装支持：

```bash
pip install -e '.[acp]'
```

参见 [ACP 编辑器集成](../user-guide/features/acp.md) 和 [ACP 内部机制](../developer-guide/acp-internals.md)。

## `hermes mcp`

```bash
hermes mcp <subcommand>
```

管理 MCP (模型上下文协议) 服务器配置并将 Hermes 作为 MCP 服务器运行。

| 子命令 | 描述 |
|------------|-------------|
| `serve [-v\|--verbose]` | 将 Hermes 作为 MCP 服务器运行 — 向其他智能体公开对话。 |
| `add <name> [--url URL] [--command CMD] [--args ...] [--auth oauth\|header]` | 添加一个带有自动工具发现的 MCP 服务器。 |
| `remove <name>` (别名: `rm`) | 从配置中移除一个 MCP 服务器。 |
| `list` (别名: `ls`) | 列出已配置的 MCP 服务器。 |
| `test <name>` | 测试到 MCP 服务器的连接。 |
| `configure <name>` (别名: `config`) | 为服务器切换工具选择。 |
| `login <name>` | 强制对基于 OAuth 的 MCP 服务器进行重新认证。 |

参见 [MCP 配置参考](./mcp-config-reference.md)，[将 MCP 与 Hermes 一起使用](../guides/use-mcp-with-hermes.md)，以及 [MCP 服务器模式](../user-guide/features/mcp.md#running-hermes-as-an-mcp-server)。

## `hermes plugins`

```bash
hermes plugins [subcommand]
```

统一插件管理 — 将通用插件、记忆提供者和上下文引擎集中在一个地方。运行 `hermes plugins` 而不带子命令会打开一个复合交互式屏幕，分为两个部分：

- **通用插件** — 用于启用/禁用已安装插件的多选复选框
- **提供者插件** — 记忆提供者和上下文引擎的单选配置。在类别上按 ENTER 打开单选选择器。

| 子命令 | 描述 |
|------------|-------------|
| *(无)* | 复合交互式 UI — 通用插件开关 + 提供者插件配置。 |
| `install <identifier> [--force]` | 从 Git URL 或 `owner/repo` 安装插件。 |
| `update <name>` | 拉取已安装插件的最新更改。 |
| `remove <name>` (别名: `rm`, `uninstall`) | 移除已安装的插件。 |
| `enable <name>` | 启用已禁用的插件。 |
| `disable <name>` | 禁用插件而不移除它。 |
| `list` (别名: `ls`) | 列出已安装的插件及其启用/禁用状态。 |

提供者插件选择保存到 `config.yaml`：
- `memory.provider` — 活动记忆提供者（空 = 仅内置）
- `context.engine` — 活动上下文引擎（`"compressor"` = 内置默认）

通用插件禁用列表存储在 `config.yaml` 的 `plugins.disabled` 下。

参见 [插件](../user-guide/features/plugins.md) 和 [构建 Hermes 插件](../guides/build-a-hermes-plugin.md)。

## `hermes tools`

```bash
hermes tools [--summary]
```

| 选项 | 描述 |
|--------|-------------|
| `--summary` | 打印当前已启用的工具摘要并退出。 |

若不带 `--summary` 参数，此命令将启动按平台划分的交互式工具配置界面。

## `hermes computer-use`

```bash
hermes computer-use <子命令>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `install` | 运行上游 cua-driver 安装程序（仅限 macOS）。 |
| `status` | 检查 `cua-driver` 是否在 `$PATH` 中并打印结果。 |

`hermes computer-use install` 是安装 `computer_use` 工具集所用 [cua-driver](https://github.com/trycua/cua) 二进制文件的稳定入口。它运行的是与您首次在 `hermes tools` 中启用 Computer Use 时相同的上游安装程序，因此在工具集切换未触发安装的情况下（例如，在返回用户设置时），可以安全地用于重新运行安装。

## `hermes sessions`

```bash
hermes sessions <子命令>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出最近的会话。 |
| `browse` | 交互式会话选择器，支持搜索和恢复。 |
| `export <output> [--session-id ID]` | 将会话导出为 JSONL 格式。 |
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
| `--days <n>` | 分析过去 `n` 天的数据（默认：30）。 |
| `--source <platform>` | 按来源筛选，例如 `cli`、`telegram` 或 `discord`。 |

## `hermes claw`

```bash
hermes claw migrate [options]
```

将您的 OpenClaw 设置迁移到 Hermes。从 `~/.openclaw`（或自定义路径）读取，并写入 `~/.hermes`。自动检测遗留目录名（`~/.clawdbot`、`~/.moltbot`）和配置文件名（`clawdbot.json`、`moltbot.json`）。

| 选项 | 描述 |
|--------|-------------|
| `--dry-run` | 预览将要迁移的内容，但不写入任何数据。 |
| `--preset <name>` | 迁移预设：`full`（所有兼容设置）或 `user-data`（不包括基础设施配置）。两个预设均不导入密钥——需显式传递 `--migrate-secrets`。 |
| `--overwrite` | 冲突时覆盖现有的 Hermes 文件（默认：当计划存在冲突时拒绝应用）。 |
| `--migrate-secrets` | 在迁移中包含 API 密钥。即使在 `--preset full` 下也需显式指定。 |
| `--no-backup` | 跳过 `~/.hermes/` 的迁移前 zip 快照（默认：应用前会将一个恢复点归档写入 `~/.hermes/backups/pre-migration-*.zip`；可通过 `hermes import` 恢复）。 |
| `--source <path>` | 自定义 OpenClaw 目录（默认：`~/.openclaw`）。 |
| `--workspace-target <path>` | 工作区指令（AGENTS.md）的目标目录。 |
| `--skill-conflict <mode>` | 处理技能名称冲突：`skip`（默认）、`overwrite` 或 `rename`。 |
| `--yes` | 跳过确认提示。 |

### 迁移内容

迁移涵盖 30 多个类别，包括人格设定、记忆、技能、模型提供者、消息平台、智能体行为、会话策略、MCP 服务器、文本转语音等。项目要么被**直接导入**到 Hermes 对应项中，要么被**归档供手动审查**。

**直接导入的项：** SOUL.md、MEMORY.md、USER.md、AGENTS.md、技能（4 个源目录）、默认模型、自定义提供者、MCP 服务器、消息平台令牌和允许列表（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost）、智能体默认设置（推理努力程度、压缩、人为延迟、时区、沙箱）、会话重置策略、批准规则、文本转语音配置、浏览器设置、工具设置、执行超时、命令允许列表、网关配置，以及来自 3 个来源的 API 密钥。

**归档供手动审查的项：** 定时任务、插件、钩子/网络钩子、记忆后端 (QMD)、技能注册表配置、UI/身份标识、日志记录、多智能体设置、频道绑定、IDENTITY.md、TOOLS.md、HEARTBEAT.md、BOOTSTRAP.md。

**API 密钥解析** 按优先级顺序检查三个来源：配置值 → `~/.openclaw/.env` → `auth-profiles.json`。所有令牌字段均处理纯字符串、环境变量模板（`${VAR}`）和 SecretRef 对象。

关于完整的配置键映射、SecretRef 处理详情和迁移后检查清单，请参阅 **[完整迁移指南](../guides/migrate-from-openclaw.md)**。

### 示例

```bash
# 预览将要迁移的内容
hermes claw migrate --dry-run

# 完整迁移（所有兼容设置，不含密钥）
hermes claw migrate --preset full

# 完整迁移，包括 API 密钥
hermes claw migrate --preset full --migrate-secrets

# 仅迁移用户数据（不含密钥），覆盖冲突项
hermes claw migrate --preset user-data --overwrite

# 从自定义 OpenClaw 路径迁移
hermes claw migrate --source /home/user/old-openclaw
```

## `hermes dashboard`

```bash
hermes dashboard [options]
```

启动 Web 仪表板——一个基于浏览器的界面，用于管理配置、API 密钥和监控会话。需要 `pip install hermes-agent[web]`（FastAPI + Uvicorn）。完整文档请参见 [Web 仪表板](/docs/user-guide/features/web-dashboard)。

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
hermes profile <子命令>
```

管理配置文件——多个隔离的 Hermes 实例，每个实例拥有自己的配置、会话、技能和主目录。

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出所有配置文件。 |
| `use <name>` | 设置一个持久默认配置文件。 |
| `create <name> [--clone] [--clone-all] [--clone-from <source>] [--no-alias]` | 创建新配置文件。`--clone` 从活动配置文件复制配置、`.env` 和 `SOUL.md`。`--clone-all` 复制所有状态。`--clone-from` 指定源配置文件。 |
| `delete <name> [-y]` | 删除配置文件。 |
| `show <name>` | 显示配置文件详情（主目录、配置等）。 |
| `alias <name> [--remove] [--name NAME]` | 管理用于快速访问配置文件的包装器脚本。 |
| `rename <old> <new>` | 重命名配置文件。 |
| `export <name> [-o FILE]` | 将配置文件导出为 `.tar.gz` 归档文件（本地备份）。 |
| `import <archive> [--name NAME]` | 从 `.tar.gz` 归档文件导入配置文件（本地恢复）。 |
| `install <source> [--name N] [--alias] [--force] [-y]` | 从 git URL 或本地目录安装配置文件发行版。 |
| `update <name> [--force-config] [-y]` | 重新拉取发行版；保留用户数据（记忆、会话、认证）。 |
| `info <name>` | 显示配置文件的发行版清单（版本、要求、来源）。 |

示例：

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

将 shell 补全脚本打印到标准输出。将输出内容 source 到您的 shell 配置文件中，即可为 Hermes 命令、子命令和配置文件名称提供 Tab 补全功能。

示例：

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
hermes update [--check] [--backup] [--restart-gateway]
```

拉取最新的 `hermes-agent` 代码并在您的虚拟环境中重新安装依赖项，然后重新运行安装后钩子（MCP 服务器、技能同步、补全脚本安装）。可以在运行中的安装上安全执行。

| 选项 | 描述 |
|--------|-------------|
| `--check` | 并排打印当前提交和最新的 `origin/main` 提交，如果同步则退出码为 0，落后则为 1。不执行拉取、安装或重启操作。 |
| `--backup` | 在拉取前创建一个带标签的 `HERMES_HOME` 更新前快照（配置、认证、会话、技能、配对数据）。默认是**关闭**的——之前总是备份的行为在大型主目录上会为每次更新增加数分钟时间。可通过在 `config.yaml` 中设置 `update.backup: true` 来永久启用此功能。 |
| `--restart-gateway` | 更新成功后，重启正在运行的网关服务。如果安装了多个配置文件，则隐含 `--all` 语义。 |

附加行为：

- **配对数据快照。** 即使 `--backup` 处于关闭状态，`hermes update` 也会在 `git pull` 前对 `~/.hermes/pairing/` 和飞书评论规则进行轻量级快照。如果拉取操作重写了您正在编辑的文件，您可以使用 `hermes backup restore --state pre-update` 进行回滚。
- **旧版 `hermes.service` 警告。** 如果 Hermes 检测到一个更名前的 `hermes.service` systemd 单元（而不是当前的 `hermes-gateway.service`），它会打印一次性的迁移提示，以帮助您避免循环抖动问题。
- **退出码。** 成功为 `0`，拉取/安装/安装后错误为 `1`，意外的工作树更改（阻止 `git pull`）为 `2`。

## 维护命令

| 命令 | 描述 |
|---------|-------------|
| `hermes version` | 打印版本信息。 |
| `hermes update` | 拉取最新更改并重新安装依赖项。 |
| `hermes uninstall [--full] [--yes]` | 移除 Hermes，可选择删除所有配置/数据。 |

## 另请参阅

- [斜杠命令参考](./slash-commands.md)
- [CLI 界面](../user-guide/cli.md)
- [会话](../user-guide/sessions.md)
- [技能系统](../user-guide/features/skills.md)
- [皮肤与主题](../user-guide/features/skins.md)