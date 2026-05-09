---
sidebar_position: 1
title: "CLI 命令参考"
description: "Hermes 终端命令及命令族权威参考"
---

# CLI 命令参考

本页面涵盖您从 shell 中运行的**终端命令**。

有关聊天内斜杠命令，请参阅 [斜杠命令参考](./slash-commands.md)。

## 全局入口点

```bash
hermes [全局选项] <命令> [子命令/选项]
```

### 全局选项

| 选项 | 描述 |
|--------|-------------|
| `--version`, `-V` | 显示版本并退出。 |
| `--profile <名称>`, `-p <名称>` | 为此调用选择要使用的 Hermes 配置文件。覆盖由 `hermes profile use` 设置的粘性默认值。 |
| `--resume <会话>`, `-r <会话>` | 按 ID 或标题恢复之前的会话。 |
| `--continue [名称]`, `-c [名称]` | 恢复最近的会话，或匹配标题的最近会话。 |
| `--worktree`, `-w` | 在隔离的 git 工作树中启动，用于并行智能体工作流。 |
| `--yolo` | 绕过危险命令的批准提示。 |
| `--pass-session-id` | 在智能体的系统提示中包含会话 ID。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml` 并回退到内置默认值。`.env` 中的凭据仍会被加载。 |
| `--ignore-rules` | 跳过 `AGENTS.md`、`SOUL.md`、`.cursorrules`、内存和预加载技能的自动注入。 |
| `--tui` | 启动 [TUI](../user-guide/tui.md) 而不是经典 CLI。等效于 `HERMES_TUI=1`。 |
| `--dev` | 与 `--tui` 一起使用时：通过 `tsx` 直接运行 TypeScript 源代码，而不是预构建的捆绑包（适用于 TUI 贡献者）。 |

## 顶级命令

| 命令 | 用途 |
|---------|---------|
| `hermes chat` | 与智能体进行交互式或一次性聊天。 |
| `hermes model` | 交互式选择默认提供商和模型。 |
| `hermes fallback` | 管理主模型出错时尝试的备用提供商。 |
| `hermes gateway` | 运行或管理消息网关服务。 |
| `hermes setup` | 针对全部或部分配置的交互式设置向导。 |
| `hermes whatsapp` | 配置并配对 WhatsApp 桥接。 |
| `hermes slack` | Slack 辅助工具（目前：为每个命令生成本机斜杠命令的应用程序清单）。 |
| `hermes auth` | 管理凭据 —— 添加、列出、删除、重置、设置策略。处理 Codex/Nous/Anthropic 的 OAuth 流程。 |
| `hermes login` / `logout` | **已弃用** —— 请改用 `hermes auth`。 |
| `hermes status` | 显示智能体、身份验证和平台状态。 |
| `hermes cron` | 检查并触发 cron 调度器。 |
| `hermes kanban` | 多配置文件协作看板（任务、链接、调度器）。 |
| `hermes webhook` | 管理用于事件驱动激活的动态 webhook 订阅。 |
| `hermes hooks` | 检查、批准或删除在 `config.yaml` 中声明的 shell 脚本钩子。 |
| `hermes doctor` | 诊断配置和依赖项问题。 |
| `hermes dump` | 可复制粘贴的设置摘要，用于支持/调试。 |
| `hermes debug` | 调试工具 —— 上传日志和系统信息以获取支持。 |
| `hermes backup` | 将 Hermes 主目录备份为 zip 文件。 |
| `hermes checkpoints` | 检查 / 清理 / 清除 `~/.hermes/checkpoints/`（`/rollback` 使用的影子存储）。不带参数运行可查看状态概览。 |
| `hermes import` | 从 zip 文件恢复 Hermes 备份。 |
| `hermes logs` | 查看、跟踪和过滤智能体/网关/错误日志文件。 |
| `hermes config` | 显示、编辑、迁移和查询配置文件。 |
| `hermes pairing` | 批准或撤销消息配对码。 |
| `hermes skills` | 浏览、安装、发布、审计和配置技能。 |
| `hermes curator` | 后台技能维护 —— 状态、运行、暂停、固定。请参阅 [Curator](../user-guide/features/curator.md)。 |
| `hermes memory` | 配置外部记忆提供商。插件特定的子命令（例如 `hermes honcho`）在其提供商激活时自动注册。 |
| `hermes acp` | 将 Hermes 作为 ACP 服务器运行，用于编辑器集成。 |
| `hermes mcp` | 管理 MCP 服务器配置并将 Hermes 作为 MCP 服务器运行。 |
| `hermes plugins` | 管理 Hermes 智能体插件（安装、启用、禁用、移除）。 |
| `hermes tools` | 配置每个平台启用的工具。 |
| `hermes sessions` | 浏览、导出、清理、重命名和删除会话。 |
| `hermes insights` | 显示令牌/成本/活动分析。 |
| `hermes fallback` | 备用提供商链的交互式管理器。 |
| `hermes claw` | OpenClaw 迁移辅助工具。 |
| `hermes dashboard` | 启动用于管理配置、API 密钥和会话的 Web 仪表板。 |
| `hermes profile` | 管理配置文件 —— 多个隔离的 Hermes 实例。 |
| `hermes completion` | 打印 shell 补全脚本（bash/zsh/fish）。 |
| `hermes version` | 显示版本信息。 |
| `hermes update` | 拉取最新代码并重新安装依赖项。`--check` 打印提交差异但不拉取；`--backup` 在拉取前拍摄 `HERMES_HOME` 快照。 |
| `hermes uninstall` | 从系统中移除 Hermes。 |

## `hermes chat`

```bash
hermes chat [选项]
```

常用选项：

| 选项 | 描述 |
|--------|-------------|
| `-q`, `--query "..."` | 一次性、非交互式提示。 |
| `-m`, `--model <模型>` | 为此运行覆盖模型。 |
| `-t`, `--toolsets <csv>` | 启用逗号分隔的工具集集合。 |
| `--provider <提供商>` | 强制使用提供商：`auto`、`openrouter`、`nous`、`openai-codex`、`copilot-acp`、`copilot`、`anthropic`、`gemini`、`google-gemini-cli`、`huggingface`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`minimax-oauth`、`kilocode`、`xiaomi`、`arcee`、`gmi`、`alibaba`、`alibaba-coding-plan`（别名 `alibaba_coding`）、`deepseek`、`nvidia`、`ollama-cloud`、`xai`（别名 `grok`）、`qwen-oauth`、`bedrock`、`opencode-zen`、`opencode-go`、`ai-gateway`、`azure-foundry`、`tencent-tokenhub`（别名 `tencent`、`tokenhub`）。 |
| `-s`, `--skills <名称>` | 为此会话预加载一个或多个技能（可重复或逗号分隔）。 |
| `-v`, `--verbose` | 详细输出。 |
| `-Q`, `--quiet` | 编程模式：抑制横幅/旋转指示器/工具预览。 |
| `--image <路径>` | 将本地图像附加到单个查询。 |
| `--resume <会话>` / `--continue [名称]` | 直接从 `chat` 恢复会话。 |
| `--worktree` | 为此运行创建隔离的 git 工作树。 |
| `--checkpoints` | 在破坏性文件更改前启用文件系统检查点。 |
| `--yolo` | 跳过批准提示。 |
| `--pass-session-id` | 将会话 ID 传递到系统提示中。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml` 并使用内置默认值。`.env` 中的凭据仍会被加载。适用于隔离的 CI 运行、可重现的错误报告以及第三方集成。 |
| `--ignore-rules` | 跳过 `AGENTS.md`、`SOUL.md`、`.cursorrules`、持久记忆和预加载技能的自动注入。与 `--ignore-user-config` 结合使用可实现完全隔离的运行。 |
| `--source <标签>` | 用于过滤的会话源标签（默认：`cli`）。对不应出现在用户会话列表中的第三方集成使用 `tool`。 |
| `--max-turns <N>` | 每次对话轮次的最大工具调用迭代次数（默认：90，或配置中的 `agent.max_turns`）。 |

示例：

```bash
hermes
hermes chat -q "总结最新的 PR"
hermes chat --provider openrouter --model anthropic/claude-sonnet-4.6
hermes chat --toolsets web,terminal,skills
hermes chat --quiet -q "仅返回 JSON"
hermes chat --worktree -q "审查此仓库并打开一个 PR"
hermes chat --ignore-user-config --ignore-rules -q "在不使用我的个人设置的情况下重现"
```

### `hermes -z <提示>` —— 脚本化一次性调用

对于编程调用者（shell 脚本、CI、cron、父进程通过管道传入提示），`hermes -z` 是最纯粹的一次性入口点：**单个提示输入，最终响应文本输出，stdout 或 stderr 上无其他内容。** 无横幅、无旋转指示器、无工具预览、无 `Session:` 行 —— 只有智能体的最终回复作为纯文本。

```bash
hermes -z "法国的首都是什么？"
# → 巴黎。

# 父脚本可以干净地捕获响应：
answer=$(hermes -z "总结这个" < /path/to/file.txt)
```

每次运行的覆盖（不修改 `~/.hermes/config.yaml`）：

| 标志 | 等效环境变量 | 用途 |
|---|---|---|
| `-m` / `--model <模型>` | `HERMES_INFERENCE_MODEL` | 为此运行覆盖模型 |
| `--provider <提供商>` | `HERMES_INFERENCE_PROVIDER` | 为此运行覆盖提供商 |

```bash
hermes -z "…" --provider openrouter --model openai/gpt-5.5
# 或者：
HERMES_INFERENCE_MODEL=anthropic/claude-sonnet-4.6 hermes -z "…"
```

相同的智能体、相同的工具、相同的技能 —— 只是剥离了所有交互/装饰层。如果你还需要转录中的工具输出，请改用 `hermes chat -q`；`-z` 明确用于“我只想要最终答案”。

## `hermes model`

交互式提供商 + 模型选择器。**这是用于添加新提供商、设置 API 密钥和运行 OAuth 流程的命令。** 请从终端运行它 —— 而不是在活动的 Hermes 聊天会话中运行。

```bash
hermes model
```

当你想要时，请使用此命令：
- **添加新提供商**（OpenRouter、Anthropic、Copilot、DeepSeek、自定义等）
- 登录到支持 OAuth 的提供商（Anthropic、Copilot、Codex、Nous Portal）
- 输入或更新 API 密钥
- 从提供商特定的模型列表中选择
- 配置自定义/自托管端点
- 将新的默认值保存到配置中

:::warning hermes model 与 /model —— 了解区别
**`hermes model`**（从终端运行，在任何 Hermes 会话之外）是**完整的提供商设置向导**。它可以添加新提供商、运行 OAuth 流程、提示输入 API 密钥并配置端点。

**`/model`**（在活动的 Hermes 聊天会话中输入）只能**在你已设置的提供商和模型之间切换**。它无法添加新提供商、运行 OAuth 或提示输入 API 密钥。

**如果你需要添加新提供商：** 首先退出你的 Hermes 会话（`Ctrl+C` 或 `/quit`），然后从终端提示符运行 `hermes model`。
:::

### `/model` 斜杠命令（会话中）

在不离开会话的情况下在已配置的模型之间切换：

```
/model                              # 显示当前模型和可用选项
/model claude-sonnet-4              # 切换模型（自动检测提供商）
/model zai:glm-5                    # 切换提供商和模型
/model custom:qwen-2.5              # 使用自定义端点上的模型
/model custom                       # 从自定义端点自动检测模型
/model custom:local:qwen-2.5        # 使用命名的自定义提供商
/model openrouter:anthropic/claude-sonnet-4  # 切换回云端
```

默认情况下，`/model` 的更改**仅应用于当前会话**。添加 `--global` 可将更改持久化到 `config.yaml`：

```
/model claude-sonnet-4 --global     # 切换并保存为新的默认值
```

:::info 如果我只能看到 OpenRouter 模型怎么办？
如果你只配置了 OpenRouter，`/model` 将只显示 OpenRouter 模型。要添加其他提供商（Anthropic、DeepSeek、Copilot 等），请退出会话并从终端运行 `hermes model`。
:::

提供商和基础 URL 的更改会自动持久化到 `config.yaml`。当切换出自定义端点时，过时的基础 URL 会被清除，以防止其泄漏到其他提供商。

## `hermes gateway`

```bash
hermes gateway <子命令>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `run` | 在前台运行网关。推荐用于 WSL、Docker 和 Termux。 |
| `start` | 启动已安装的系统 d/launchd 后台服务。 |
| `stop` | 停止服务（或前台进程）。 |
| `restart` | 重启服务。 |
| `status` | 显示服务状态。 |
| `install` | 安装为 systemd（Linux）或 launchd（macOS）后台服务。 |
| `uninstall` | 移除已安装的服务。 |
| `setup` | 交互式消息平台设置。 |

选项：

| 选项 | 描述 |
|--------|-------------|
| `--all` | 在 `start` / `restart` / `stop` 时：作用于**每个配置文件**的网关，而不仅仅是当前活动的 `HERMES_HOME`。如果您并行运行多个配置文件，并希望在 `hermes update` 后全部重启，此选项非常有用。 |

:::tip WSL 用户
请使用 `hermes gateway run` 而不是 `hermes gateway start` —— WSL 对 systemd 的支持不可靠。将其包装在 tmux 中以保持持久性：`tmux new -s hermes 'hermes gateway run'`。详情请参见 [WSL 常见问题解答](/docs/reference/faq#wsl-gateway-keeps-disconnecting-or-hermes-gateway-start-fails)。
:::

## `hermes setup`

```bash
hermes setup [模型|tts|终端|网关|工具|智能体] [--非交互模式] [--重置] [--快速] [--重新配置]
```

**首次运行：** 启动首次使用向导。

**返回用户（已配置）：** 直接进入完整的重新配置向导 —— 每个提示都会将您当前的值作为默认值显示，按 Enter 键保留或输入新值。无菜单。

跳过一个部分，而不是运行完整向导：

| 部分 | 描述 |
|---------|-------------|
| `模型` | 提供者和模型设置。 |
| `终端` | 终端后端和沙箱设置。 |
| `网关` | 消息平台设置。 |
| `工具` | 按平台启用/禁用工具。 |
| `智能体` | 智能体行为设置。 |

选项：

| 选项 | 描述 |
|--------|-------------|
| `--快速` | 在返回用户运行时：仅提示缺失或未设置的项。跳过您已配置的项。 |
| `--非交互模式` | 使用默认值/环境变量，不进行提示。 |
| `--重置` | 在设置前将配置重置为默认值。 |
| `--重新配置` | 向后兼容别名 —— 在现有安装上运行不带参数的 `hermes setup` 现在默认执行此操作。 |

## `hermes whatsapp`

```bash
hermes whatsapp
```

运行 WhatsApp 配对/设置流程，包括模式选择和二维码配对。

## `hermes slack`

```bash
hermes slack manifest              # 将清单输出到标准输出
hermes slack manifest --write      # 写入 ~/.hermes/slack-manifest.json
hermes slack manifest --slashes-only  # 仅输出 features.slash_commands 数组
```

生成一个 Slack 应用清单，将 `COMMAND_REGISTRY`（`/btw`、`/stop`、`/model` 等）中的每个网关命令注册为一级 Slack 斜杠命令，与 Discord 和 Telegram 保持功能一致。将输出内容粘贴到你的 Slack 应用配置中：[https://api.slack.com/apps](https://api.slack.com/apps) → 你的应用 → **功能 → 应用清单 → 编辑**，然后点击 **保存**。如果作用域或斜杠命令发生变更，Slack 会提示你重新安装应用。

| 标志 | 默认值 | 用途 |
|------|--------|------|
| `--write [PATH]` | 标准输出 | 写入文件而非标准输出。仅使用 `--write` 时会写入 `$HERMES_HOME/slack-manifest.json`。 |
| `--name NAME` | `Hermes` | Slack 中机器人的显示名称。 |
| `--description DESC` | 默认描述 | 在 Slack 应用目录中显示的机器人描述。 |
| `--slashes-only` | 关闭 | 仅输出 `features.slash_commands`，以便合并到手动维护的清单中。 |

在 `hermes update` 后再次运行 `hermes slack manifest --write`，以获取任何新命令。

## `hermes login` / `hermes logout` *（已弃用）*

:::caution
`hermes login` 已被移除。请使用 `hermes auth` 管理 OAuth 凭据，`hermes model` 选择提供商，或使用 `hermes setup` 进行完整的交互式设置。
:::

## `hermes auth`

管理同一提供商的凭据池，用于密钥轮换。完整文档请参阅[凭据池](/docs/user-guide/features/credential-pools)。

```bash
hermes auth                                              # 交互式向导
hermes auth list                                         # 显示所有凭据池
hermes auth list openrouter                              # 显示特定提供商
hermes auth add openrouter --api-key sk-or-v1-xxx        # 添加 API 密钥
hermes auth add anthropic --type oauth                   # 添加 OAuth 凭据
hermes auth remove openrouter 2                          # 按索引移除
hermes auth reset openrouter                             # 清除冷却时间
```

子命令：`add`、`list`、`remove`、`reset`。当不带子命令调用时，启动交互式管理向导。

## `hermes status`

```bash
hermes status [--all] [--deep]
```

| 选项 | 描述 |
|------|------|
| `--all` | 以可共享的脱敏格式显示所有详细信息。 |
| `--deep` | 运行更深入的检查，可能需要更长时间。 |

## `hermes cron`

```bash
hermes cron <list|create|edit|pause|resume|run|remove|status|tick>
```

| 子命令 | 描述 |
|--------|------|
| `list` | 显示已计划的作业。 |
| `create` / `add` | 根据提示创建计划作业，可选择通过重复 `--skill` 附加一个或多个技能。 |
| `edit` | 更新作业的计划、提示、名称、交付方式、重复次数或附加的技能。支持 `--clear-skills`、`--add-skill` 和 `--remove-skill`。 |
| `pause` | 暂停作业而不删除它。 |
| `resume` | 恢复暂停的作业并计算其下一次运行时间。 |
| `run` | 在下一次调度器滴答时触发作业。 |
| `remove` | 删除计划作业。 |
| `status` | 检查 cron 调度器是否正在运行。 |
| `tick` | 运行到期的作业一次并退出。 |

## `hermes kanban`

```bash
hermes kanban [--board <slug>] <action> [options]
```

多配置文件、多项目协作看板。每次安装可托管多个看板（每个项目、仓库或域一个看板）；每个看板是一个独立的队列，拥有自己的 SQLite 数据库和调度器作用域。新安装默认创建一个名为 `default` 的看板，其数据库为 `~/.hermes/kanban.db`（向后兼容）；其他看板位于 `~/.hermes/kanban/boards/<slug>/kanban.db`。网关内嵌的调度器每次滴答都会扫描每个看板。

**全局标志（适用于以下所有操作）：**

| 标志 | 用途 |
|------|------|
| `--board <slug>` | 操作指定看板。默认为当前看板（通过 `hermes kanban boards switch` 设置、`HERMES_KANBAN_BOARD` 环境变量或 `default`）。 |

**这是人类用户/脚本操作的接口。** 由调度器生成的智能体工作进程通过专用的 `kanban_*` [工具集](/docs/user-guide/features/kanban#how-workers-interact-with-the-board)（`kanban_show`、`kanban_complete`、`kanban_block`、`kanban_create`、`kanban_link`、`kanban_comment`、`kanban_heartbeat`）驱动看板，而不是调用 `hermes kanban` shell 命令。工作进程的环境变量中固定了 `HERMES_KANBAN_BOARD`，因此它们物理上无法看到其他看板。

| 操作 | 用途 |
|------|------|
| `init` | 如果 `kanban.db` 不存在则创建。幂等操作。 |
| `boards list` / `boards ls` | 列出所有看板及其任务数量。`--json`、`--all`（包含已归档的看板）。 |
| `boards create <slug>` | 创建新看板。标志：`--name`、`--description`、`--icon`、`--color`、`--switch`（设为活跃看板）。Slug 为 kebab-case，自动转为小写。 |
| `boards switch <slug>` / `boards use` | 将 `<slug>` 设为活跃看板（写入 `~/.hermes/kanban/current`）。 |
| `boards show` / `boards current` | 打印当前活跃看板的名称、数据库路径和任务数量。 |
| `boards rename <slug> "<name>"` | 更改看板的显示名称。Slug 不可变。 |
| `boards rm <slug>` | 归档（默认）或硬删除看板。`--delete` 跳过归档步骤。已归档的看板移至 `boards/_archived/<slug>-<ts>/`。不允许对 `default` 执行此操作。 |
| `create "<title>"` | 在活跃看板上创建新任务。标志：`--body`、`--assignee`、`--parent`（可重复）、`--workspace scratch\|worktree\|dir:<path>`、`--tenant`、`--priority`、`--triage`、`--idempotency-key`、`--max-runtime`、`--skill`（可重复）。 |
| `list` / `ls` | 列出活跃看板上的任务。可用 `--mine`、`--assignee`、`--status`、`--tenant`、`--archived`、`--json` 过滤。 |
| `show <id>` | 显示任务及其评论和事件。`--json` 用于机器可读输出。 |
| `assign <id> <profile>` | 分配或重新分配任务。使用 `none` 取消分配。任务运行时拒绝操作。 |
| `link <parent> <child>` | 添加依赖关系。会检测循环依赖。两个任务必须在同一看板上。 |
| `unlink <parent> <child>` | 移除依赖关系。 |
| `claim <id>` | 原子性地认领一个就绪任务。输出解析后的工作区路径。 |
| `comment <id> "<text>"` | 添加评论。下一个认领该任务的智能体工作进程会在其 `kanban_show()` 响应中读取该评论。 |
| `complete <id>` | 标记任务完成。标志：`--result`、`--summary`、`--metadata`。 |
| `block <id> "<reason>"` | 标记任务为阻塞状态。同时将原因作为评论添加。 |
| `unblock <id>` | 将阻塞任务恢复为就绪状态。 |
| `archive <id>` | 从默认列表中隐藏。`gc` 会清理临时工作区。 |
| `tail <id>` | 跟踪任务的事件流。 |
| `dispatch` | 对活跃看板执行一次调度器轮询。标志：`--dry-run`、`--max N`、`--json`。 |
| `context <id>` | 打印智能体工作进程将看到的完整上下文（标题 + 正文 + 父任务结果 + 评论）。 |
| `specify <id>` / `specify --all` | 通过辅助 LLM 将三列分类任务细化为具体规范（包含目标、方法和验收标准的标题 + 正文），然后将其提升至 `todo` 状态。标志：`--tenant`（将 `--all` 限定到特定租户）、`--author`、`--json`。在 `config.yaml` 的 `auxiliary.triage_specifier` 下配置模型。 |
| `gc` | 删除已归档任务的临时工作区。 |

示例：

```bash
# 创建第二个看板并在其上放置任务，无需切换当前看板。
hermes kanban boards create atm10-server --name "ATM10 Server" --icon 🎮
hermes kanban --board atm10-server create "Restart server" --assignee ops

# 切换活跃看板，以便后续调用。
hermes kanban boards switch atm10-server
hermes kanban list                  # 显示 atm10-server 的任务

# 归档看板（可恢复）或硬删除看板。
hermes kanban boards rm atm10-server
hermes kanban boards rm atm10-server --delete
```

看板解析顺序（优先级从高到低）：`--board <slug>` 标志 → `HERMES_KANBAN_BOARD` 环境变量 → `~/.hermes/kanban/current` 文件 → `default`。

所有操作也作为网关中的斜杠命令提供（`/kanban …`），具有相同的参数接口，包括 `boards` 子命令和 `--board` 标志。

完整设计请参阅仓库中的 `docs/hermes-kanban-v1-spec.pdf` 或 [看板用户指南](/docs/user-guide/features/kanban)，内容包括：与 Cline Kanban / Paperclip / NanoClaw / Gemini Enterprise 的比较、八种协作模式、四个用户故事、并发正确性证明。

## `hermes webhook`

```bash
hermes webhook <subscribe|list|remove|test>
```

管理用于事件驱动智能体激活的动态 Webhook 订阅。需要在配置中启用 Webhook 平台 —— 如果未配置，将打印设置说明。

| 子命令 | 描述 |
|------------|-------------|
| `subscribe` / `add` | 创建一个 Webhook 路由。返回 URL 和 HMAC 密钥，用于在您的服务中进行配置。 |
| `list` / `ls` | 显示所有由智能体创建的订阅。 |
| `remove` / `rm` | 删除一个动态订阅。来自 config.yaml 的静态路由不受影响。 |
| `test` | 发送一个测试 POST 请求以验证订阅是否正常工作。 |

### `hermes webhook subscribe`

```bash
hermes webhook subscribe <name> [options]
```

| 选项 | 描述 |
|--------|-------------|
| `--prompt` | 提示模板，使用 `{dot.notation}` 引用有效载荷。 |
| `--events` | 要接受的事件类型，以逗号分隔（例如 `issues,pull_request`）。留空表示接受所有事件。 |
| `--description` | 人类可读的描述。 |
| `--skills` | 要为智能体运行加载的技能名称，以逗号分隔。 |
| `--deliver` | 投递目标：`log`（默认）、`telegram`、`discord`、`slack`、`github_comment`。 |
| `--deliver-chat-id` | 跨平台投递的目标聊天/频道 ID。 |
| `--secret` | 自定义 HMAC 密钥。如果省略，则自动生成。 |
| `--deliver-only` | 跳过智能体 —— 将渲染后的 `--prompt` 作为字面消息投递。零 LLM 成本，亚秒级投递。要求 `--deliver` 是一个真实的目标（而非 `log`）。 |

订阅信息将持久化保存到 `~/.hermes/webhook_subscriptions.json`，并由 Webhook 适配器热重载，无需重启网关。

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

输出 Hermes 完整设置的简洁纯文本摘要。专为复制粘贴到 Discord、GitHub issue 或 Telegram 寻求支持而设计 —— 无 ANSI 颜色、无特殊格式，只有数据。

| 选项 | 说明 |
|--------|-------------|
| `--show-keys` | 显示脱敏后的 API 密钥前缀（首尾各 4 个字符），而非仅显示 `已设置`/`未设置`。 |

### 包含内容

| 部分 | 详情 |
|---------|---------|
| **头部** | Hermes 版本、发布日期、git 提交哈希 |
| **环境** | 操作系统、Python 版本、OpenAI SDK 版本 |
| **身份** | 当前活跃配置文件名称、HERMES_HOME 路径 |
| **模型** | 配置的默认模型及其提供商 |
| **终端** | 后端类型（本地、Docker、SSH 等） |
| **API 密钥** | 对所有 22 个提供商/工具的 API 密钥进行存在性检查 |
| **功能** | 已启用的工具集、MCP 服务器数量、记忆提供商 |
| **服务** | 网关状态、配置的消息平台 |
| **工作负载** | 定时任务数量、已安装技能数量 |
| **配置覆盖** | 所有与默认值不同的配置项 |

### 输出示例

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
  openrouter           已设置
  openai               未设置
  anthropic            已设置
  nous                 未设置
  firecrawl            已设置
  ...

features:
  toolsets:           全部
  mcp_servers:        0
  memory_provider:    内置
  gateway:            运行中 (systemd)
  platforms:          telegram, discord
  cron_jobs:          3 个活跃 / 5 个总计
  skills:             42

config_overrides:
  agent.max_turns: 250
  compression.threshold: 0.85
  display.streaming: True
--- end dump ---
```

### 使用场景

- 在 GitHub 上报告 bug —— 将 dump 内容粘贴到 issue 中  
- 在 Discord 上求助 —— 将其放在代码块中分享  
- 将自己的设置与他人进行比较  
- 当某些功能异常时快速检查 sanity  

:::tip
`hermes dump` 专为分享而设计。如需交互式诊断，请使用 `hermes doctor`。如需可视化概览，请使用 `hermes status`。
:::

## `hermes debug`

```bash
hermes debug share [options]
```

将调试报告（系统信息 + 近期日志）上传至 paste 服务并获取可共享的 URL。适用于快速请求支持 —— 包含协助者诊断您问题所需的一切信息。

| 选项 | 说明 |
|--------|-------------|
| `--lines <N>` | 每个日志文件包含的日志行数（默认：200）。 |
| `--expire <days>` | Paste 的有效期（天）（默认：7）。 |
| `--local` | 在本地打印报告而非上传。 |

报告包含系统信息（操作系统、Python 版本、Hermes 版本）、近期智能体和网关日志（每个文件限制 512 KB）以及脱敏后的 API 密钥状态。密钥始终会被脱敏 —— 不会上传任何机密信息。

按顺序尝试的 paste 服务：paste.rs、dpaste.com。

### 示例

```bash
hermes debug share              # 上传调试报告，打印 URL
hermes debug share --lines 500  # 包含更多日志行
hermes debug share --expire 30  # 保留 paste 30 天
hermes debug share --local      # 在终端打印报告（不上传）
```

## `hermes backup`

```bash
hermes backup [options]
```

创建 Hermes 配置、技能、会话和数据的 zip 归档文件。备份不包含 hermes-agent 代码库本身。

| 选项 | 说明 |
|--------|-------------|
| `-o`, `--output <path>` | zip 文件的输出路径（默认：`~/hermes-backup-<timestamp>.zip`）。 |
| `-q`, `--quick` | 快速快照：仅包含关键状态文件（config.yaml、state.db、.env、auth、定时任务）。比完整备份快得多。 |
| `-l`, `--label <name>` | 快照标签（仅与 `--quick` 一起使用）。 |

备份使用 SQLite 的 `backup()` API 进行安全复制，因此即使 Hermes 正在运行也能正确工作（WAL 模式安全）。

**zip 归档中排除的内容：**

- `*.db-wal`、`*.db-shm`、`*.db-journal` —— SQLite 的 WAL / 共享内存 / 日志附属文件。`*.db` 文件已通过 `sqlite3.backup()` 获取了一致性快照；若同时打包这些实时附属文件，恢复时可能会看到半提交状态。
- `checkpoints/` —— 每会话轨迹缓存。基于哈希键且每会话重新生成；无论如何也无法干净地迁移到其他安装环境。
- `hermes-agent` 代码本身（这是用户数据备份，而非仓库快照）。

### 示例

```bash
hermes backup                           # 完整备份至 ~/hermes-backup-*.zip
hermes backup -o /tmp/hermes.zip        # 完整备份至指定路径
hermes backup --quick                   # 快速仅状态快照
hermes backup --quick --label "pre-upgrade"  # 带标签的快速快照
```

## `hermes checkpoints`

```bash
hermes checkpoints [COMMAND]
```

检查并管理位于 `~/.hermes/checkpoints/` 的 shadow git 存储 —— 即会话内 `/rollback` 命令背后的存储层。可随时安全运行；不要求智能体正在运行。

| 子命令 | 说明 |
|------------|-------------|
| `status`（默认） | 显示总大小、项目数量以及每个项目的明细。仅输入 `hermes checkpoints` 等效于此命令。 |
| `list` | `status` 的别名。 |
| `prune` | 强制执行清理扫描 —— 删除孤立和过期项目，对存储进行垃圾回收，强制执行大小上限。忽略 24 小时幂等标记。 |
| `clear` | 删除整个检查点基础目录。不可逆；除非使用 `-f`，否则会要求确认。 |
| `clear-legacy` | 仅删除由 v1→v2 迁移产生的 `legacy-<timestamp>/` 归档目录。 |

### 选项

| 选项 | 子命令 | 说明 |
|--------|------------|-------------|
| `--limit N` | `status`、`list` | 列出项目的最大数量（默认 20）。 |
| `--retention-days N` | `prune` | 删除 `last_touch` 早于 N 天的项目（默认 7）。 |
| `--max-size-mb N` | `prune` | 在孤立/过期清理后，按项目删除最旧的提交，直至总存储大小 ≤ N MB（默认 500）。 |
| `--keep-orphans` | `prune` | 跳过删除其工作目录已不存在的项目。 |
| `-f`, `--force` | `clear`、`clear-legacy` | 跳过确认提示。 |

### 示例

```bash
hermes checkpoints                                  # 状态概览
hermes checkpoints prune --retention-days 3         # 激进清理
hermes checkpoints prune --max-size-mb 200          # 一次性收紧大小上限
hermes checkpoints clear-legacy -f                  # 删除 v1 归档目录
hermes checkpoints clear -f                         # 清除所有内容
```

请参阅[检查点与 `/rollback`](../user-guide/checkpoints-and-rollback.md) 了解完整架构及会话内命令。

## `hermes import`

```bash
hermes import <zipfile> [options]
```

将之前创建的 Hermes 备份恢复到您的 Hermes 主目录中。归档中的所有文件将覆盖 Hermes 主目录中的现有文件；`--force` 仅在目标目录已存在 Hermes 安装时跳过确认提示。

| 选项 | 说明 |
|--------|-------------|
| `-f`, `--force` | 跳过现有安装确认提示。 |

:::warning
导入前请停止网关，以避免与正在运行的进程发生冲突。
:::

### 示例
```bash
hermes import ~/hermes-backup-20260423.zip           # 覆盖现有配置前提示
hermes import ~/hermes-backup-20260423.zip --force   # 直接覆盖，不提示
```

## `hermes logs`

```bash
hermes logs [log_name] [options]
```

查看、实时追踪和过滤 Hermes 日志文件。所有日志均存储在 `~/.hermes/logs/` 中（非默认配置文件则存储在 `<profile>/logs/` 中）。

### 日志文件

| 名称 | 文件 | 捕获内容 |
|------|------|-----------------|
| `agent`（默认） | `agent.log` | 所有智能体活动 —— API 调用、工具调度、会话生命周期（INFO 及以上级别） |
| `errors` | `errors.log` | 仅警告和错误 —— agent.log 的过滤子集 |
| `gateway` | `gateway.log` | 消息网关活动 —— 平台连接、消息调度、Webhook 事件 |

### 选项

| 选项 | 说明 |
|--------|-------------|
| `log_name` | 要查看的日志：`agent`（默认）、`errors`、`gateway`，或 `list` 以显示可用文件及其大小。 |
| `-n`, `--lines <N>` | 显示的行数（默认：50）。 |
| `-f`, `--follow` | 实时追踪日志，类似 `tail -f`。按 Ctrl+C 停止。 |
| `--level <LEVEL>` | 显示的最小日志级别：`DEBUG`、`INFO`、`WARNING`、`ERROR`、`CRITICAL`。 |
| `--session <ID>` | 过滤包含会话 ID 子串的行。 |
| `--since <TIME>` | 显示相对时间以来的行：`30m`、`1h`、`2d` 等。支持 `s`（秒）、`m`（分钟）、`h`（小时）、`d`（天）。 |
| `--component <NAME>` | 按组件过滤：`gateway`、`agent`、`tools`、`cli`、`cron`。 |

### 示例

```bash
# 查看 agent.log 的最后 50 行（默认）
hermes logs

# 实时追踪 agent.log
hermes logs -f

# 查看 gateway.log 的最后 100 行
hermes logs gateway -n 100

# 仅显示过去一小时的警告和错误
hermes logs --level WARNING --since 1h

# 按特定会话过滤
hermes logs --session abc123

# 实时追踪 errors.log，从 30 分钟前开始
hermes logs errors --since 30m -f

# 列出所有日志文件及其大小
hermes logs list
```

### 过滤

可以组合使用过滤器。当多个过滤器同时生效时，日志行必须通过**所有**过滤器才会显示：

```bash
# 过去 2 小时内包含会话 "tg-12345" 的 WARNING+ 级别行
hermes logs --level WARNING --since 2h --session tg-12345
```

当启用 `--since` 时，无法解析时间戳的行也会被包含（它们可能是多行日志条目的延续行）。当启用 `--level` 时，无法检测级别的行也会被包含。

### 日志轮转

Hermes 使用 Python 的 `RotatingFileHandler`。旧日志会自动轮转 —— 请查找 `agent.log.1`、`agent.log.2` 等。`hermes logs list` 子命令会显示包括轮转文件在内的所有日志文件。

## `hermes 配置`

```bash
hermes config <子命令>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `show` | 显示当前配置值。 |
| `edit` | 在编辑器中打开 `config.yaml`。 |
| `set <键> <值>` | 设置一个配置值。 |
| `path` | 打印配置文件路径。 |
| `env-path` | 打印 `.env` 文件路径。 |
| `check` | 检查缺失或过时的配置。 |
| `migrate` | 交互式添加新引入的选项。 |

## `hermes 配对`

```bash
hermes pairing <list|approve|revoke|clear-pending>
```

| 子命令 | 描述 |
|------------|-------------|
| `list` | 显示待处理和已批准的用户。 |
| `approve <平台> <代码>` | 批准一个配对代码。 |
| `revoke <平台> <用户ID>` | 撤销用户的访问权限。 |
| `clear-pending` | 清除待处理的配对代码。 |

## `hermes skills`

```bash
hermes skills <子命令>
```

子命令：

| 子命令 | 描述 |
|--------|------|
| `browse` | 技能注册表的翻页浏览器。 |
| `search` | 搜索技能注册表。 |
| `install` | 安装一个技能。 |
| `inspect` | 预览技能（不安装）。 |
| `list` | 列出已安装的技能。 |
| `check` | 检查已安装的 hub 技能是否有上游更新。 |
| `update` | 在有上游变更时，重新安装 hub 技能。 |
| `audit` | 重新扫描已安装的 hub 技能。 |
| `uninstall` | 移除通过 hub 安装的技能。 |
| `reset` | 清除被标记为 `user_modified` 的捆绑技能，解除其“卡住”状态。使用 `--restore` 时，还会将用户副本替换为捆绑版本。 |
| `publish` | 将技能发布到注册表。 |
| `snapshot` | 导出/导入技能配置。 |
| `tap` | 管理自定义技能源。 |
| `config` | 按平台交互式启用/禁用技能配置。 |

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
hermes skills install https://sharethis.chat/SKILL.md                     # 直接 URL（单文件 SKILL.md）
hermes skills install https://example.com/SKILL.md --name my-skill        # 当 frontmatter 无名称时覆盖名称
hermes skills check
hermes skills update
hermes skills config
hermes skills reset google-workspace
hermes skills reset google-workspace --restore --yes
```

注意事项：
- `--force` 可覆盖第三方/社区技能的非危险策略阻止。
- `--force` 不会覆盖 `dangerous` 扫描结果。
- `--source skills-sh` 搜索公共的 `skills.sh` 目录。
- `--source well-known` 允许你将 Hermes 指向暴露 `/.well-known/skills/index.json` 的网站。
- 传递 `http(s)://…/*.md` URL 会直接安装单文件 SKILL.md。当 frontmatter 中没有 `name:` 且 URL 路径段不是有效标识符时，交互式终端会提示输入名称；非交互式界面（如 TUI 内的 `/skills install`、网关平台）则需要使用 `--name <x>`。

## `hermes curator`

```bash
hermes curator <子命令>
```

Curator 是一个辅助模型后台任务，定期审查智能体创建的技能，清理过期技能，合并重复项，并归档废弃技能。捆绑技能和通过 hub 安装的技能不会被处理。归档的技能可恢复；不会发生自动删除。

| 子命令 | 描述 |
|--------|------|
| `status` | 显示 curator 状态和技能统计信息 |
| `run` | 立即触发一次 curator 审查（阻塞直到 LLM 处理完成） |
| `run --background` | 在后台线程中启动 LLM 处理并立即返回 |
| `run --dry-run` | 仅预览 —— 生成审查报告但不执行任何变更 |
| `backup` | 手动创建 `~/.hermes/skills/` 的 tar.gz 快照（curator 在每次实际运行前也会自动创建快照） |
| `rollback` | 从快照恢复 `~/.hermes/skills/`（默认使用最新的快照） |
| `rollback --list` | 列出可用快照 |
| `rollback --id <ts>` | 根据 ID 恢复特定快照 |
| `rollback -y` | 跳过确认提示 |
| `pause` | 暂停 curator，直到恢复 |
| `resume` | 恢复被暂停的 curator |
| `pin <skill>` | 固定一个技能，使其不会被 curator 自动处理 |
| `unpin <skill>` | 取消固定技能 |
| `restore <skill>` | 恢复已归档的技能 |

在全新安装时，首次计划任务会延迟一个完整的 `interval_hours`（默认为 7 天）——网关不会在 `hermes update` 后的第一个周期立即执行整理。可使用 `hermes curator run --dry-run` 在此前预览效果。

参见 [Curator](../user-guide/features/curator.md) 了解行为与配置。

## `hermes fallback`

```bash
hermes fallback <子命令>
```

管理备用提供者链。当主模型因速率限制、过载或连接错误失败时，将按顺序尝试备用提供者。

| 子命令 | 描述 |
|--------|------|
| `list`（别名：`ls`） | 显示当前备用链（无子命令时默认执行此操作） |
| `add` | 选择一个提供者 + 模型（与 `hermes model` 相同的选取器）并追加到链中 |
| `remove`（别名：`rm`） | 从链中选择一个条目删除 |
| `clear` | 移除所有备用条目 |

参见 [备用提供者](../user-guide/features/fallback-providers.md)。

## `hermes hooks`

```bash
hermes hooks <子命令>
```

检查在 `~/.hermes/config.yaml` 中声明的 shell 脚本钩子，针对合成负载进行测试，并管理首次使用同意白名单（位于 `~/.hermes/shell-hooks-allowlist.json`）。

| 子命令 | 描述 |
|--------|------|
| `list`（别名：`ls`） | 列出已配置的钩子，包括匹配规则、超时时间和同意状态 |
| `test <event>` | 针对合成负载触发所有匹配 `<event>` 的钩子 |
| `revoke`（别名：`remove`、`rm`） | 移除某命令的白名单条目（下次重启后生效） |
| `doctor` | 检查每个已配置钩子：可执行位、白名单、mtime 漂移、JSON 有效性及合成运行耗时 |

参见 [钩子](../user-guide/features/hooks.md) 了解事件签名和负载格式。

## `hermes memory`

```bash
hermes memory <子命令>
```

设置并管理外部记忆提供者插件。可用提供者：honcho、openviking、mem0、hindsight、holographic、retaindb、byterover、supermemory。一次只能有一个外部提供者处于活动状态。内置记忆（MEMORY.md/USER.md）始终处于活动状态。

子命令：

| 子命令 | 描述 |
|--------|------|
| `setup` | 交互式提供者选择与配置。 |
| `status` | 显示当前记忆提供者配置。 |
| `off` | 禁用外部提供者（仅使用内置）。 |

:::info 提供者特定子命令
当外部记忆提供者处于活动状态时，它可能会注册自己的顶级 `hermes <提供者>` 命令以进行特定管理（例如，当 Honcho 激活时为 `hermes honcho`）。非活动提供者不会暴露其子命令。运行 `hermes --help` 可查看当前已连接的内容。
:::

## `hermes acp`

```bash
hermes acp
```

将 Hermes 作为 ACP（智能体客户端协议）stdio 服务器启动，用于编辑器集成。

相关入口点：

```bash
hermes-acp
python -m acp_adapter
```

请先安装支持：

```bash
pip install -e '.[acp]'
```

参见 [ACP 编辑器集成](../user-guide/features/acp.md) 和 [ACP 内部机制](../developer-guide/acp-internals.md)。

## `hermes mcp`

```bash
hermes mcp <子命令>
```

管理 MCP（模型上下文协议）服务器配置，并将 Hermes 作为 MCP 服务器运行。

| 子命令 | 描述 |
|--------|------|
| `serve [-v\|--verbose]` | 将 Hermes 作为 MCP 服务器运行 —— 向其他智能体暴露对话。 |
| `add <name> [--url URL] [--command CMD] [--args ...] [--auth oauth\|header]` | 添加一个 MCP 服务器并自动发现工具。 |
| `remove <name>`（别名：`rm`） | 从配置中移除 MCP 服务器。 |
| `list`（别名：`ls`） | 列出已配置的 MCP 服务器。 |
| `test <name>` | 测试与 MCP 服务器的连接。 |
| `configure <name>`（别名：`config`） | 切换服务器的工具选择。 |

参见 [MCP 配置参考](./mcp-config-reference.md)、[在 Hermes 中使用 MCP](../guides/use-mcp-with-hermes.md) 和 [MCP 服务器模式](../user-guide/features/mcp.md#running-hermes-as-an-mcp-server)。

## `hermes plugins`

```bash
hermes plugins [子命令]
```

统一插件管理 —— 将通用插件、记忆提供者和上下文引擎集中管理。不带子命令运行 `hermes plugins` 将打开一个复合交互式界面，包含两个部分：

- **通用插件** —— 多选复选框，用于启用/禁用已安装插件  
- **提供者插件** —— 单选配置，用于记忆提供者和上下文引擎。在某一类别上按回车键可打开单选选取器。

| 子命令 | 描述 |
|--------|------|
| *（无）* | 复合交互界面 —— 通用插件开关 + 提供者插件配置。 |
| `install <identifier> [--force]` | 从 Git URL 或 `owner/repo` 安装插件。 |
| `update <name>` | 拉取已安装插件的最新变更。 |
| `remove <name>`（别名：`rm`、`uninstall`） | 移除已安装插件。 |
| `enable <name>` | 启用已禁用的插件。 |
| `disable <name>` | 禁用插件但不移除。 |
| `list`（别名：`ls`） | 列出已安装插件及其启用/禁用状态。 |

提供者插件选择将保存到 `config.yaml`：
- `memory.provider` —— 活动记忆提供者（空值 = 仅内置）  
- `context.engine` —— 活动上下文引擎（`"compressor"` = 内置默认值）

通用插件禁用列表存储在 `config.yaml` 的 `plugins.disabled` 下。

参见 [插件](../user-guide/features/plugins.md) 和 [构建 Hermes 插件](../guides/build-a-hermes-plugin.md)。

## `hermes tools`

```bash
hermes tools [--summary]
```

| 选项 | 描述 |
|------|------|
| `--summary` | 打印当前已启用工具摘要并退出。 |

不使用 `--summary` 时，将启动按平台划分的交互式工具配置界面。

## `hermes sessions`

```bash
hermes sessions <子命令>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出最近的会话。 |
| `browse` | 交互式会话选择器，支持搜索和恢复。 |
| `export <输出> [--session-id ID]` | 将会话导出为 JSONL 格式。 |
| `delete <会话ID>` | 删除一个会话。 |
| `prune` | 删除旧会话。 |
| `stats` | 显示会话存储统计信息。 |
| `rename <会话ID> <标题>` | 设置或更改会话标题。 |

## `hermes insights`

```bash
hermes insights [--days N] [--source platform]
```

| 选项 | 描述 |
|--------|-------------|
| `--days <n>` | 分析过去 `n` 天（默认：30）。 |
| `--source <平台>` | 按来源过滤，例如 `cli`、`telegram` 或 `discord`。 |

## `hermes claw`

```bash
hermes claw migrate [options]
```

将您的 OpenClaw 配置迁移至 Hermes。从 `~/.openclaw`（或自定义路径）读取配置，并写入 `~/.hermes`。自动检测旧版目录名（`~/.clawdbot`、`~/.moltbot`）和配置文件名（`clawdbot.json`、`moltbot.json`）。

| 选项 | 说明 |
|--------|-------------|
| `--dry-run` | 预览将要迁移的内容，但不实际写入任何文件。 |
| `--preset <name>` | 迁移预设：`full`（所有兼容设置）或 `user-data`（排除基础设施配置）。两种预设均不会导入密钥——需显式传递 `--migrate-secrets`。 |
| `--overwrite` | 在发生冲突时覆盖现有的 Hermes 文件（默认：当迁移计划存在冲突时拒绝执行）。 |
| `--migrate-secrets` | 在迁移中包含 API 密钥。即使使用 `--preset full` 也必须指定此选项。 |
| `--no-backup` | 跳过迁移前对 `~/.hermes/` 的 zip 快照备份（默认情况下，在应用迁移前会将单个还原点存档写入 `~/.hermes/backups/pre-migration-*.zip`；可通过 `hermes import` 还原）。 |
| `--source <path>` | 自定义 OpenClaw 目录（默认：`~/.openclaw`）。 |
| `--workspace-target <path>` | 工作区指令（AGENTS.md）的目标目录。 |
| `--skill-conflict <mode>` | 处理技能名称冲突：`skip`（默认）、`overwrite` 或 `rename`。 |
| `--yes` | 跳过确认提示。 |

### 迁移内容

迁移涵盖超过 30 个类别，包括人设、记忆、技能、模型提供商、消息平台、智能体行为、会话策略、MCP 服务器、TTS 等。各项内容要么**直接导入**到 Hermes 的对应项中，要么**归档**以供手动审查。

**直接导入：** SOUL.md、MEMORY.md、USER.md、AGENTS.md、技能（4 个源目录）、默认模型、自定义提供商、MCP 服务器、消息平台令牌和白名单（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost）、智能体默认设置（推理强度、压缩、人工延迟、时区、沙箱）、会话重置策略、审批规则、TTS 配置、浏览器设置、工具设置、执行超时、命令白名单、网关配置，以及来自 3 个来源的 API 密钥。

**归档以供手动审查：** 定时任务、插件、钩子/webhook、记忆后端（QMD）、技能注册表配置、UI/身份、日志记录、多智能体设置、频道绑定、IDENTITY.md、TOOLS.md、HEARTBEAT.md、BOOTSTRAP.md。

**API 密钥解析**按优先级顺序检查三个来源：配置值 → `~/.openclaw/.env` → `auth-profiles.json`。所有令牌字段均支持纯字符串、环境变量模板（`${VAR}`）和 SecretRef 对象。

完整的配置键映射、SecretRef 处理细节以及迁移后检查清单，请参阅**[完整迁移指南](../guides/migrate-from-openclaw.md)**。

### 示例

```bash
# 预览将要迁移的内容
hermes claw migrate --dry-run

# 完整迁移（所有兼容设置，不含密钥）
hermes claw migrate --preset full

# 完整迁移（包含 API 密钥）
hermes claw migrate --preset full --migrate-secrets

# 仅迁移用户数据（不含密钥），覆盖冲突
hermes claw migrate --preset user-data --overwrite

# 从自定义 OpenClaw 路径迁移
hermes claw migrate --source /home/user/old-openclaw
```

## `hermes dashboard`

```bash
hermes dashboard [options]
```

启动 Web 仪表板——一个基于浏览器的 UI，用于管理配置、API 密钥和监控会话。需要 `pip install hermes-agent[web]`（FastAPI + Uvicorn）。完整文档请参阅 [Web 仪表板](/docs/user-guide/features/web-dashboard)。

| 选项 | 默认值 | 说明 |
|--------|---------|-------------|
| `--port` | `9119` | Web 服务器运行的端口 |
| `--host` | `127.0.0.1` | 绑定地址 |
| `--no-open` | — | 不自动打开浏览器 |

```bash
# 默认 — 在浏览器中打开 http://127.0.0.1:9119
hermes dashboard

# 自定义端口，不打开浏览器
hermes dashboard --port 8080 --no-open
```

## `hermes profile`

```bash
hermes profile <subcommand>
```

管理配置文件——多个隔离的 Hermes 实例，每个实例拥有独立的配置、会话、技能和主目录。

| 子命令 | 说明 |
|------------|-------------|
| `list` | 列出所有配置文件。 |
| `use <name>` | 设置一个粘性默认配置文件。 |
| `create <name> [--clone] [--clone-all] [--clone-from <source>] [--no-alias]` | 创建新配置文件。`--clone` 从当前活动配置文件复制配置、`.env` 和 `SOUL.md`。`--clone-all` 复制全部状态。`--clone-from` 指定源配置文件。 |
| `delete <name> [-y]` | 删除配置文件。 |
| `show <name>` | 显示配置文件详情（主目录、配置等）。 |
| `alias <name> [--remove] [--name NAME]` | 管理用于快速访问配置文件的包装脚本。 |
| `rename <old> <new>` | 重命名配置文件。 |
| `export <name> [-o FILE]` | 将配置文件导出为 `.tar.gz` 存档（本地备份）。 |
| `import <archive> [--name NAME]` | 从 `.tar.gz` 存档导入配置文件（本地恢复）。 |
| `install <source> [--name N] [--alias] [--force] [-y]` | 从 Git URL 或本地目录安装配置文件发行版。 |
| `update <name> [--force-config] [-y]` | 重新拉取发行版；保留用户数据（记忆、会话、认证信息）。 |
| `info <name>` | 显示配置文件的发行版清单（版本、依赖项、来源）。 |

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
hermes -p work chat -q "来自工作配置文件的问候"
```

## `hermes completion`

```bash
hermes completion [bash|zsh|fish]
```

将 shell 补全脚本打印到标准输出。在您的 shell 配置文件中引入该输出，以实现对 Hermes 命令、子命令和配置文件名称的 Tab 补全。

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

拉取最新的 `hermes-agent` 代码并在您的虚拟环境中重新安装依赖项，然后重新运行安装后钩子（MCP 服务器、技能同步、补全安装）。在运行中的安装上安全执行。

| 选项 | 说明 |
|--------|-------------|
| `--check` | 并排打印当前提交和最新的 `origin/main` 提交，如果同步则退出码为 0，否则为 1。不执行拉取、安装或重启操作。 |
| `--backup` | 在拉取前创建 `HERMES_HOME` 的带标签预更新快照（配置、认证、会话、技能、配对数据）。默认为**关闭**——之前的始终备份行为会在大型主目录上每次更新增加数分钟时间。可通过在 `config.yaml` 中设置 `update.backup: true` 永久启用。 |
| `--restart-gateway` | 成功更新后，重启正在运行的网关服务。如果安装了多个配置文件，则隐含 `--all` 语义。 |

其他行为：

- **配对数据快照。** 即使关闭了 `--backup`，`hermes update` 仍会在 `git pull` 前对 `~/.hermes/pairing/` 和飞书评论规则进行轻量级快照。如果拉取操作覆盖了您正在编辑的文件，您可以使用 `hermes backup restore --state pre-update` 回滚。
- **旧版 `hermes.service` 警告。** 如果 Hermes 检测到重命名前的 `hermes.service` systemd 单元（而非当前的 `hermes-gateway.service`），则会打印一次性迁移提示，以避免出现 flap-loop 问题。
- **退出码。** 成功时为 `0`，拉取/安装/安装后钩子错误时为 `1`，因意外的工作树更改导致 `git pull` 被阻止时为 `2`。

## `hermes fallback`

```bash
hermes fallback           # 交互式管理器
```

管理备用提供商链（当您的主提供商遇到速率限制或返回致命错误时使用），无需手动编辑 `config.yaml`。复用 `hermes model` 中的提供商选择器——相同的提供商列表、相同的凭据提示、相同的验证逻辑。

典型会话：

1. 按 `a` 添加备用提供商 → 选择一个提供商（基于 OAuth 的提供商将打开浏览器；基于 API 密钥的提供商将提示输入密钥），然后选择具体模型。
2. 使用 `↑`/`↓` 重新排序备用提供商（列表中的第一个将首先尝试）。
3. 按 `d` 删除一个。

所有更改将持久化到 `config.yaml` 顶层的 `fallback_providers:` 列表中。与[凭据池](/docs/user-guide/features/credential-pools)交互：池在*同一*提供商内轮换密钥，而备用提供商则完全切换到*不同*的提供商。

行为详情以及与 `fallback_model`（旧版单备用密钥）的交互，请参阅[备用提供商](/docs/user-guide/features/fallback-providers)。

## 维护命令

| 命令 | 说明 |
|---------|-------------|
| `hermes version` | 打印版本信息。 |
| `hermes update` | 拉取最新更改并重新安装依赖项。 |
| `hermes uninstall [--full] [--yes]` | 移除 Hermes，可选择删除所有配置/数据。 |

## 另请参阅

- [斜杠命令参考](./slash-commands.md)
- [CLI 接口](../user-guide/cli.md)
- [会话](../user-guide/sessions.md)
- [技能系统](../user-guide/features/skills.md)
- [皮肤与主题](../user-guide/features/skins.md)