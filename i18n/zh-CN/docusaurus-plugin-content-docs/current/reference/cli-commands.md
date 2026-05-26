---
sidebar_position: 1
title: "CLI 命令参考"
description: "Hermes 终端命令及命令家族的权威参考"
---

# CLI 命令参考

本页涵盖了您在终端运行的 **终端命令**。

关于聊天内的斜杠命令，请参阅 [斜杠命令参考](./slash-commands.md)。

## 全局入口点

```bash
hermes [全局选项] <命令> [子命令/选项]
```

### 全局选项

| 选项 | 描述 |
|------|------|
| `--version`, `-V` | 显示版本并退出。 |
| `--profile <名称>`, `-p <名称>` | 选择本次调用要使用的 Hermes 配置文件。将覆盖由 `hermes profile use` 设置的粘性默认值。 |
| `--resume <会话>`, `-r <会话>` | 通过 ID 或标题恢复之前的会话。 |
| `--continue [名称]`, `-c [名称]` | 恢复最近的会话，或恢复与标题匹配的最近会话。 |
| `--worktree`, `-w` | 在一个隔离的 git worktree 中启动，用于并行智能体工作流。 |
| `--yolo` | 绕过危险命令的确认提示。 |
| `--pass-session-id` | 在智能体的系统提示中包含会话 ID。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml` 并回退到内置默认值。`.env` 中的凭据仍会加载。 |
| `--ignore-rules` | 跳过自动注入 `AGENTS.md`、`SOUL.md`、`.cursorrules`、记忆和预加载技能。 |
| `--tui` | 启动 [TUI](../user-guide/tui.md) 而非经典 CLI。等效于 `HERMES_TUI=1`。 |
| `--dev` | 与 `--tui` 一起使用：直接通过 `tsx` 运行 TypeScript 源码，而非预构建的包（供 TUI 贡献者使用）。 |

## 顶层命令

| 命令 | 用途 |
|------|------|
| `hermes chat` | 与智能体进行交互式或一次性对话。 |
| `hermes model` | 交互式选择默认提供者和模型。 |
| `hermes fallback` | 管理在主模型出错时尝试的备用提供者。 |
| `hermes gateway` | 运行或管理消息网关服务。 |
| `hermes proxy` | 本地的 OpenAI 兼容代理，附加 OAuth 提供者凭据。详见 [订阅代理](../user-guide/features/subscription-proxy.md)。 |
| `hermes lsp` | 管理语言服务器协议集成（用于 write_file/patch 的语义诊断）。 |
| `hermes setup` | 交互式设置向导，用于配置的全部或部分内容。 |
| `hermes whatsapp` | 配置并连接 WhatsApp 桥接。 |
| `hermes slack` | Slack 辅助工具（当前功能：生成包含所有原生斜杠命令的应用清单）。 |
| `hermes auth` | 管理凭据 —— 添加、列出、移除、重置、设置策略。处理 Codex/Nous/Anthropic 的 OAuth 流程。 |
| `hermes login` / `logout` | **已弃用** —— 请使用 `hermes auth` 代替。 |
| `hermes status` | 显示智能体、认证和平台状态。 |
| `hermes cron` | 检查并触发 cron 调度器。 |
| `hermes kanban` | 多配置文件协作看板（任务、链接、调度器）。 |
| `hermes webhook` | 管理用于事件驱动激活的动态 webhook 订阅。 |
| `hermes hooks` | 检查、批准或移除在 `config.yaml` 中声明的 shell 脚本钩子。 |
| `hermes doctor` | 诊断配置和依赖问题。 |
| `hermes security audit` | 按需供应链审计 (OSV.dev)，用于虚拟环境、插件需求和固定的 MCP 服务器。 |
| `hermes dump` | 用于支持/调试的可复制粘贴设置摘要。 |
| `hermes debug` | 调试工具 —— 上传日志和系统信息以供支持。 |
| `hermes backup` | 将 Hermes 主目录备份为 zip 文件。 |
| `hermes checkpoints` | 检查 / 清理 / 清除 `~/.hermes/checkpoints/`（`/rollback` 使用的影子存储）。不带参数运行可查看状态概览。 |
| `hermes import` | 从 zip 文件恢复 Hermes 备份。 |
| `hermes logs` | 查看、跟踪和过滤智能体/网关/错误日志文件。 |
| `hermes config` | 显示、编辑、迁移和查询配置文件。 |
| `hermes pairing` | 批准或撤销消息配对码。 |
| `hermes skills` | 浏览、安装、发布、审计和配置技能。 |
| `hermes bundles` | 将多个技能分组到一个 `/<name>` 斜杠命令下。详见 [技能包](../user-guide/features/skills.md#skill-bundles)。 |
| `hermes curator` | 后台技能维护 —— 状态、运行、暂停、固定。详见 [策展器](../user-guide/features/curator.md)。 |
| `hermes memory` | 配置外部记忆提供者。插件特定的子命令（例如 `hermes honcho`）在其提供者激活时会自动注册。 |
| `hermes acp` | 将 Hermes 作为 ACP 服务器运行以进行编辑器集成。 |
| `hermes mcp` | 管理 MCP 服务器配置并将 Hermes 作为 MCP 服务器运行。 |
| `hermes plugins` | 管理 Hermes 智能体插件（安装、启用、禁用、移除）。 |
| `hermes portal` | Nous Portal 状态、订阅链接和工具网关路由。详见 [工具网关](../user-guide/features/tool-gateway.md)。 |
| `hermes tools` | 按平台配置启用的工具。 |
| `hermes computer-use` | 安装或检查 cua-driver 后端（macOS 电脑使用功能）。 |
| `hermes sessions` | 浏览、导出、清理、重命名和删除会话。 |
| `hermes insights` | 显示 token/成本/活动分析。 |
| `hermes claw` | OpenClaw 迁移辅助工具。 |
| `hermes dashboard` | 启动 Web 仪表板以管理配置、API 密钥和会话。 |
| `hermes profile` | 管理配置文件 —— 多个隔离的 Hermes 实例。 |
| `hermes completion` | 打印 shell 补全脚本 (bash/zsh/fish)。 |
| `hermes version` | 显示版本信息。 |
| `hermes update` | 拉取最新代码并重新安装依赖（git 安装），或检查 PyPI 并执行 `pip install --upgrade`（pip 安装）。`--check` 可预览而不安装；`--backup` 会在拉取前对 `HERMES_HOME` 进行快照。 |
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
| `-t`, `--toolsets <csv>` | 启用逗号分隔的一组工具集。 |
| `--provider <provider>` | 强制指定提供者：`auto`, `openrouter`, `nous`, `openai-codex`, `copilot-acp`, `copilot`, `anthropic`, `gemini`, `google-gemini-cli`, `huggingface`, `novita`, `zai`, `kimi-coding`, `kimi-coding-cn`, `minimax`, `minimax-cn`, `minimax-oauth`, `kilocode`, `xiaomi`, `arcee`, `gmi`, `alibaba`, `alibaba-coding-plan` (别名 `alibaba_coding`), `deepseek`, `nvidia`, `ollama-cloud`, `xai` (别名 `grok`), `xai-oauth` (别名 `grok-oauth`), `qwen-oauth`, `bedrock`, `opencode-zen`, `opencode-go`, `ai-gateway`, `azure-foundry`, `lmstudio`, `stepfun`, `tencent-tokenhub` (别名 `tencent`, `tokenhub`)。 |
| `-s`, `--skills <name>` | 为会话预加载一个或多个技能（可重复使用或逗号分隔）。 |
| `-v`, `--verbose` | 详细输出。 |
| `-Q`, `--quiet` | 编程模式：禁止显示横幅/加载动画/工具预览。 |
| `--image <path>` | 将本地图片附加到单个查询中。 |
| `--resume <session>` / `--continue [name]` | 直接从 `chat` 恢复会话。 |
| `--worktree` | 为此运行创建一个隔离的 git worktree。 |
| `--checkpoints` | 在执行破坏性文件更改前启用文件系统检查点。 |
| `--yolo` | 跳过批准提示。 |
| `--pass-session-id` | 将会话 ID 传递到系统提示中。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml` 并使用内置默认值。`.env` 中的凭据仍会加载。适用于隔离的 CI 运行、可复现的错误报告和第三方集成。 |
| `--ignore-rules` | 跳过自动注入 `AGENTS.md`、`SOUL.md`、`.cursorrules`、持久记忆和预加载的技能。与 `--ignore-user-config` 结合使用可实现完全隔离的运行。 |
| `--source <tag>` | 用于过滤的会话源标签（默认值：`cli`）。对于不应出现在用户会话列表中的第三方集成，请使用 `tool`。 |
| `--max-turns <N>` | 每次对话轮次的最大工具调用迭代次数（默认值：90，或配置中的 `agent.max_turns`）。 |

示例：

```bash
hermes
hermes chat -q "总结最新的 PR"
hermes chat --provider openrouter --model anthropic/claude-sonnet-4.6
hermes chat --toolsets web,terminal,skills
hermes chat --quiet -q "仅返回 JSON"
hermes chat --worktree -q "审查此仓库并创建一个 PR"
hermes chat --ignore-user-config --ignore-rules -q "在不包含我个人设置的情况下复现问题"
```

### `hermes -z <prompt>` —— 脚本化一次性命令

对于编程调用方（shell 脚本、CI、cron、向管道传入提示的父进程），`hermes -z` 是最纯粹的一次性入口点：**单个提示输入，最终响应文本输出，标准输出或标准错误上没有任何其他内容。** 没有横幅，没有加载动画，没有工具预览，没有 `Session:` 行 —— 只有智能体的最终回复作为纯文本。

```bash
hermes -z "法国的首都是什么？"
# → 巴黎。

# 父脚本可以干净地捕获响应：
answer=$(hermes -z "总结这个" < /path/to/file.txt)
```

按运行覆盖（不修改 `~/.hermes/config.yaml`）：

| 标志 | 等效环境变量 | 用途 |
|---|---|---|
| `-m` / `--model <model>` | `HERMES_INFERENCE_MODEL` | 覆盖本次运行使用的模型 |
| `--provider <provider>` | _(无)_ | 覆盖本次运行使用的提供者 |

```bash
hermes -z "…" --provider openrouter --model openai/gpt-5.5
# 或：
HERMES_INFERENCE_MODEL=anthropic/claude-sonnet-4.6 hermes -z "…"
```

相同的智能体、相同的工具、相同的技能 —— 只是剥离了每一层交互式/装饰性内容。如果你还需要工具输出也出现在记录中，请改用 `hermes chat -q`；`-z` 明确用于“我只想要最终答案”。

## `hermes model`

交互式提供者 + 模型选择器。**这是用于添加新提供者、设置 API 密钥和运行 OAuth 流程的命令。** 从你的终端运行它 —— 而不是在活跃的 Hermes 聊天会话内部运行。

```bash
hermes model
```

当你想要：
- **添加新提供者**（OpenRouter、Anthropic、Copilot、DeepSeek、自定义等）
- 登录到基于 OAuth 的提供者（Anthropic、Copilot、Codex、Nous Portal）
- 输入或更新 API 密钥
- 从特定于提供者的模型列表中选择
- 配置自定义/自托管端点
- 将新默认值保存到配置中时使用此命令。

:::warning hermes model 与 /model —— 了解区别
**`hermes model`**（在你的终端运行，在任何 Hermes 会话之外）是**完整的提供者设置向导**。它可以添加新提供者、运行 OAuth 流程、提示输入 API 密钥并配置端点。

**`/model`**（在活跃的 Hermes 聊天会话内输入）只能**在你已经设置好的提供者和模型之间切换**。它不能添加新提供者、运行 OAuth 或提示输入 API 密钥。

**如果你需要添加新提供者：** 首先退出你的 Hermes 会话（`Ctrl+C` 或 `/quit`），然后从终端提示符运行 `hermes model`。
:::

### `/model` 斜杠命令（会话中）

在不离开会话的情况下切换已配置的模型：

```
/model                              # 显示当前模型和可用选项
/model claude-sonnet-4              # 切换模型（自动检测提供者）
/model zai:glm-5                    # 切换提供者和模型
/model custom:qwen-2.5              # 使用自定义端点上的模型
/model custom                       # 从自定义端点自动检测模型
/model custom:local:qwen-2.5        # 使用命名的自定义提供者
/model openrouter:anthropic/claude-sonnet-4  # 切换回云端
```

默认情况下，`/model` 的更改仅**应用于当前会话**。添加 `--global` 可将更改持久化到 `config.yaml`：

```
/model claude-sonnet-4 --global     # 切换并保存为新默认值
```

:::info 如果我只看到 OpenRouter 模型怎么办？
如果你只配置了 OpenRouter，`/model` 将只显示 OpenRouter 模型。要添加另一个提供者（Anthropic、DeepSeek、Copilot 等），请退出你的会话并从终端运行 `hermes model`。
:::

提供者和基础 URL 的更改会自动持久化到 `config.yaml`。当切换离开自定义端点时，过时的基础 URL 会被清除，以防止其泄漏到其他提供者中。

## `hermes gateway`

```bash
hermes gateway <subcommand>
```

子命令：

| 子命令 | 描述 |
|--------|------|
| `run` | 在前台运行网关。推荐在 WSL、Docker 和 Termux 中使用。 |
| `start` | 启动已安装的 systemd/launchd 后台服务。 |
| `stop` | 停止服务（或前台进程）。 |
| `restart` | 重启服务。 |
| `status` | 显示服务状态。 |
| `list` | 列出 **所有配置文件** 及其网关是否当前正在运行（如可用则显示 PID）。当您并行运行多个配置文件并需要一个统一概览时，此命令非常便于使用。 |
| `install` | 安装为 systemd（Linux）或 launchd（macOS）后台服务。 |
| `uninstall` | 移除已安装的服务。 |
| `setup` | 交互式消息平台设置。 |

选项：

| 选项 | 描述 |
|------|------|
| `--all` | 在 `start` / `restart` / `stop` 操作时：对 **所有配置文件的** 网关生效，而不仅仅是当前活动的 `HERMES_HOME`。当您并行运行多个配置文件并希望在 `hermes update` 后重启所有网关时，此选项非常有用。 |

:::tip WSL 用户
请使用 `hermes gateway run` 代替 `hermes gateway start` — WSL 的 systemd 支持不稳定。建议将其包裹在 tmux 中以维持会话：`tmux new -s hermes 'hermes gateway run'`。详情请参阅 [WSL 常见问题解答](/reference/faq#wsl-gateway-keeps-disconnecting-or-hermes-gateway-start-fails)。
:::

## `hermes lsp`

```bash
hermes lsp <subcommand>
```

管理语言服务器协议集成。LSP 在后台运行真正的语言服务器（pyright、gopls、rust-analyzer 等），并将其诊断信息输入到 `write_file` 和 `patch` 使用的写后检查中。它基于 Git 工作区检测启用 — 仅当当前工作目录或正在编辑的文件位于 Git 工作树内时，LSP 才会运行。

子命令：

| 子命令 | 描述 |
|--------|------|
| `status` | 显示服务状态、已配置的服务器、安装状态。 |
| `list` | 打印受支持的服务器注册表。传入 `--installed-only` 可跳过未安装的项。 |
| `install <id>` | 立即安装一个服务器的二进制文件。 |
| `install-all` | 安装所有具有已知自动安装方案的服务器。 |
| `restart` | 关闭现有客户端，以便下次编辑时重新启动。 |
| `which <id>` | 打印一个服务器的已解析二进制文件路径。 |

完整指南、支持的语言和配置选项请参见 [LSP — 语义诊断](/user-guide/features/lsp)。

---
title: "Hermes 命令行界面"
description: "Hermes CLI 命令参考文档。"
slug: "hermes-cli"
---

## `hermes setup`

```bash
hermes setup [model|tts|terminal|gateway|tools|agent] [--non-interactive] [--reset] [--quick] [--reconfigure] [--portal]
```

**首次运行：** 启动首次设置向导。

**回归用户（已配置）：** 直接进入完整的重新配置向导——每个提示都会将您当前的值显示为默认值，按回车键保留或输入新值。没有菜单。

跳转到某个部分，而不是完整的向导：

| 章节       | 描述           |
|------------|----------------|
| `model`    | 提供商和模型设置。 |
| `terminal` | 终端后端和沙箱设置。 |
| `gateway`  | 消息平台设置。   |
| `tools`    | 按平台启用/禁用工具。 |
| `agent`    | 智能体行为设置。   |

选项：

| 选项               | 描述                                                     |
|--------------------|----------------------------------------------------------|
| `--quick`          | 在回归用户运行时：仅提示缺失或未设置的项目。跳过您已配置的项目。 |
| `--non-interactive`| 使用默认值/环境变量，无提示。                            |
| `--reset`          | 在设置前将配置重置为默认值。                             |
| `--reconfigure`    | 向后兼容别名——现在在现有安装上运行裸 `hermes setup` 会默认执行此操作。 |
| `--portal`         | 一次性 Nous Portal 设置：通过 OAuth 登录，将 Nous 设为推理提供商，并选择加入 [工具网关](../user-guide/features/tool-gateway.md)。跳过其余向导步骤。 |

## `hermes portal`

```bash
hermes portal [status|open|tools]
```

检查 Nous Portal 认证、工具网关路由，并访问订阅页面。无子命令的调用将运行 `status`。

| 子命令     | 描述                                                         |
|------------|--------------------------------------------------------------|
| `status`（默认）| Portal 认证状态 + 每个工具的工具网关路由摘要。未给出子命令时也会显示。 |
| `open`     | 在默认浏览器中打开 `portal.nousresearch.com/manage-subscription`。 |
| `tools`    | 列出每个工具网关合作伙伴（Firecrawl, FAL, OpenAI TTS, Browser Use, Modal）以及哪些是通过 Nous 路由的。 |

有关网关本身的配置，请参见[工具网关](../user-guide/features/tool-gateway.md)。有关一次性设置路径，请参见上面的 `hermes setup --portal`。

## `hermes whatsapp`

```bash
hermes whatsapp
```

运行 WhatsApp 配对/设置流程，包括模式选择和二维码配对。

## `hermes slack`

```bash
hermes slack manifest              # 将清单打印到标准输出
hermes slack manifest --write      # 写入 ~/.hermes/slack-manifest.json
hermes slack manifest --slashes-only  # 仅生成 features.slash_commands 数组
```

生成一个 Slack 应用清单，将 `COMMAND_REGISTRY` 中的每个网关命令（`/btw`, `/stop`, `/model`, …）注册为一流的 Slack 斜杠命令——与 Discord 和 Telegram 保持同等地位。将输出粘贴到您的 Slack 应用配置中，地址为 [https://api.slack.com/apps](https://api.slack.com/apps) → 您的应用 → **功能 → 应用清单 → 编辑**，然后**保存**。如果范围或斜杠命令发生更改，Slack 会提示重新安装。

| 标志              | 默认值    | 用途                                                     |
|-------------------|-----------|----------------------------------------------------------|
| `--write [PATH]`  | 标准输出  | 写入文件而不是标准输出。单独的 `--write` 会写入 `$HERMES_HOME/slack-manifest.json`。 |
| `--name NAME`     | `Hermes`  | 在 Slack 中的机器人显示名称。                            |
| `--description DESC` | 默认简介 | Slack 应用目录中显示的机器人描述。                       |
| `--slashes-only`  | 关闭      | 仅生成 `features.slash_commands`，以便合并到手动维护的清单中。 |

在 `hermes update` 后再次运行 `hermes slack manifest --write` 以获取任何新命令。

## `hermes login` / `hermes logout` *（已弃用）*

:::caution
`hermes login` 已被移除。请使用 `hermes auth` 管理 OAuth 凭证，使用 `hermes model` 选择提供商，或使用 `hermes setup` 进行完整的交互式设置。
:::

## `hermes auth`

管理同提供商密钥轮换的凭证池。有关完整文档，请参阅[凭证池](/user-guide/features/credential-pools)。

```bash
hermes auth                                              # 交互式向导
hermes auth list                                         # 显示所有凭证池
hermes auth list openrouter                              # 显示特定提供商
hermes auth add openrouter --api-key sk-or-v1-xxx        # 添加 API 密钥
hermes auth add anthropic --type oauth                   # 添加 OAuth 凭证
hermes auth remove openrouter 2                          # 按索引移除
hermes auth reset openrouter                             # 清除冷却时间
hermes auth status anthropic                             # 显示提供商的认证状态
hermes auth logout anthropic                             # 注销并清除存储的认证状态
hermes auth spotify                                      # 通过 PKCE 认证 Hermes 与 Spotify
```

子命令：`add`, `list`, `remove`, `reset`, `status`, `logout`, `spotify`。无子命令调用时，启动交互式管理向导。

## `hermes status`

```bash
hermes status [--all] [--deep]
```

| 选项    | 描述                                         |
|---------|----------------------------------------------|
| `--all` | 以可分享的编辑格式显示所有详细信息。         |
| `--deep`| 运行可能需要更长时间的深度检查。             |

## `hermes cron`

```bash
hermes cron <list|create|edit|pause|resume|run|remove|status|tick>
```

| 子命令        | 描述                                                         |
|---------------|--------------------------------------------------------------|
| `list`        | 显示已计划的作业。                                           |
| `create` / `add` | 根据提示创建一个计划作业，可选择通过重复使用 `--skill` 附加一个或多个技能。 |
| `edit`        | 更新作业的计划、提示、名称、投递、重复次数或附加的技能。支持 `--clear-skills`, `--add-skill` 和 `--remove-skill`。 |
| `pause`       | 暂停作业而不删除。                                           |
| `resume`      | 恢复已暂停的作业并计算其下一个未来运行时间。                 |
| `run`         | 在下一个调度器时间片触发作业。                               |
| `remove`      | 删除一个计划作业。                                           |
| `status`      | 检查 cron 调度器是否正在运行。                               |
| `tick`        | 运行一次到期的作业然后退出。                                 |

## `hermes kanban`

```bash
hermes kanban [--board <slug>] <action> [options]
```

多配置文件、多项目协作看板。每个安装可以托管多个看板（每个项目、仓库或域一个）；每个看板是一个独立的队列，拥有自己的 SQLite 数据库和调度器作用域。新安装从一个名为 `default` 的看板开始，其数据库为 `~/.hermes/kanban.db` 以保持向后兼容；附加看板位于 `~/.hermes/kanban/boards/<slug>/kanban.db`。内嵌于网关的调度器在每个时间片中扫描所有看板。

**全局标志（适用于以下每个操作）：**

| 标志              | 用途                                                                 |
|-------------------|----------------------------------------------------------------------|
| `--board <slug>`  | 操作特定看板。默认为当前看板（通过 `hermes kanban boards switch`、`HERMES_KANBAN_BOARD` 环境变量或 `default` 设置）。 |

**这是面向人类/脚本的接口。** 由调度器生成的智能体工作者通过专用的 `kanban_*` [工具集](/user-guide/features/kanban#how-workers-interact-with-the-board)（`kanban_show`, `kanban_complete`, `kanban_block`, `kanban_create`, `kanban_link`, `kanban_comment`, `kanban_heartbeat`；编排器配置文件还会获得 `kanban_list` 和 `kanban_unblock`）来驱动看板，而不是通过 shell 执行 `hermes kanban`。工作者的环境中固定了 `HERMES_KANBAN_BOARD`，因此它们物理上无法看到其他看板。

| 操作                     | 用途                                                                                                 |
|--------------------------|------------------------------------------------------------------------------------------------------|
| `init`                   | 如果 `kanban.db` 不存在则创建。幂等操作。                                                            |
| `boards list` / `boards ls` | 列出所有看板及任务计数。`--json`, `--all`（包含已归档）。                                            |
| `boards create <slug>`   | 创建一个新看板。标志：`--name`, `--description`, `--icon`, `--color`, `--switch`（设为活动）。Slug 为 kebab-case，自动小写。 |
| `boards switch <slug>` / `boards use` | 将 `<slug>` 持久化为活动看板（写入 `~/.hermes/kanban/current`）。                                      |
| `boards show` / `boards current` | 打印当前活动看板的名称、数据库路径和任务计数。                                                       |
| `boards rename <slug> "<name>"` | 更改看板的显示名称。Slug 不可变。                                                                    |
| `boards rm <slug>`       | 归档（默认）或硬删除看板。`--delete` 跳过归档步骤。已归档的看板移至 `boards/_archived/<slug>-<ts>/`。`default` 看板拒绝此操作。 |
| `create "<title>"`       | 在活动看板上创建新任务。标志：`--body`, `--assignee`, `--parent`（可重复）, `--workspace scratch\|worktree\|dir:<path>`, `--tenant`, `--priority`, `--triage`, `--idempotency-key`, `--max-runtime`, `--max-retries`, `--skill`（可重复）。 |
| `list` / `ls`            | 列出活动看板上的任务。使用 `--mine`, `--assignee`, `--status`, `--tenant`, `--archived`, `--json` 进行过滤。 |
| `show <id>`              | 显示任务、评论和事件。`--json` 用于机器输出。                                                        |
| `assign <id> <profile>`  | 分配或重新分配。使用 `none` 取消分配。任务运行时拒绝操作。                                           |
| `link <parent> <child>`  | 添加依赖关系。检测循环。两个任务必须在同一看板上。                                                   |
| `unlink <parent> <child>` | 移除依赖关系。                                                                                       |
| `claim <id>`             | 原子性地认领一个就绪任务。打印解析后的工作区路径。                                                   |
| `comment <id> "<text>"`  | 附加一条评论。下一个认领该任务的工作者会将其作为 `kanban_show()` 响应的一部分读取。                   |
| `complete <id>`          | 标记任务完成。标志：`--result`, `--summary`, `--metadata`。                                          |
| `block <id> "<reason>"`  | 标记任务因需要人工输入而阻塞。同时将原因作为评论附加。                                               |
| `schedule <id> "<reason>"` | 将延时/后续工作置入 `scheduled` 状态，使其不显示为人工阻塞项。                                      |
| `unblock <id>`           | 将阻塞或计划的任务返回就绪状态（如果依赖项仍未完成则返回 `todo`）。                                 |
| `archive <id>`           | 从默认列表中隐藏。`gc` 将移除临时工作区。                                                            |
| `tail <id>`              | 跟踪任务的事件流。                                                                                   |
| `dispatch`               | 在活动看板上执行一次调度器传递。标志：`--dry-run`, `--max N`, `--failure-limit N`, `--json`。         |
| `context <id>`           | 打印工作者将看到的完整上下文（标题 + 主体 + 父级结果 + 评论）。                                      |
| `specify <id>` / `--all` | 通过辅助 LLM 将分诊列任务充实为具体规范（标题 + 包含目标、方法、验收标准的主体），然后将其提升至 `todo`。标志：`--tenant`（将 `--all` 作用域限定为一个租户）, `--author`, `--json`。在 `config.yaml` 的 `auxiliary.triage_specifier` 下配置模型。 |
| `decompose <id>` / `--all` | 将分诊列任务扇出为一个由描述路由到专家配置文件的子任务图（编排器驱动路径）。当 LLM 决定任务不适合扇出时，回退到 specify 风格的单任务提升。与 `specify` 标志相同。在 `config.yaml` 的 `auxiliary.kanban_decomposer` 下配置模型。当 `kanban.auto_decompose: true`（默认）时，也会在每个调度器时间片自动运行。参见[自动 vs 手动编排](/user-guide/features/kanban#auto-vs-manual-orchestration)。 |
| `gc`                     | 移除已归档任务的临时工作区。                                                                         |

示例：

```bash
# 创建第二个看板并在上面放置任务，而不切换离开当前看板。
hermes kanban boards create atm10-server --name "ATM10 Server" --icon 🎮
hermes kanban --board atm10-server create "Restart server" --assignee ops

# 切换后续调用的活动看板。
hermes kanban boards switch atm10-server
hermes kanban list                  # 显示 atm10-server 的任务

# 归档（可恢复）或硬删除一个看板。
hermes kanban boards rm atm10-server
hermes kanban boards rm atm10-server --delete
```

看板解析顺序（优先级从高到低）：`--board <slug>` 标志 → `HERMES_KANBAN_BOARD` 环境变量 → `~/.hermes/kanban/current` 文件 → `default`。

所有操作也可作为网关中的斜杠命令使用（`/kanban …`），具有相同的参数界面——包括 `boards` 子命令和 `--board` 标志。

有关完整设计——与 Cline Kanban / Paperclip / NanoClaw / Gemini Enterprise 的比较、八种协作模式、四个用户故事、并发正确性证明——请参见仓库中的 `docs/hermes-kanban-v1-spec.pdf` 或[看板用户指南](/user-guide/features/kanban)。

## `hermes webhook`

```bash
hermes webhook <subscribe|list|remove|test>
```
管理用于事件驱动智能体激活的动态 Webhook 订阅。需要在配置中启用 Webhook 平台——如果未配置，将打印设置说明。

| 子命令 | 描述 |
|------------|-------------|
| `subscribe` / `add` | 创建一个 Webhook 路由。返回用于在您的服务上配置的 URL 和 HMAC 密钥。 |
| `list` / `ls` | 显示所有由智能体创建的订阅。 |
| `remove` / `rm` | 删除一个动态订阅。来自 config.yaml 的静态路由不受影响。 |
| `test` | 发送一个测试 POST 请求以验证订阅是否正常工作。 |

### `hermes webhook subscribe`

```bash
hermes webhook subscribe <name> [options]
```

| 选项 | 描述 |
|--------|-------------|
| `--prompt` | 使用 `{dot.notation}` 引用负载数据的提示模板。 |
| `--events` | 要接受的逗号分隔的事件类型（例如 `issues,pull_request`）。留空 = 接受所有事件。 |
| `--description` | 人类可读的描述。 |
| `--skills` | 要为智能体运行加载的逗号分隔的技能名称。 |
| `--deliver` | 投递目标：`log`（默认）、`telegram`、`discord`、`slack`、`github_comment`。 |
| `--deliver-chat-id` | 用于跨平台投递的目标聊天/频道 ID。 |
| `--secret` | 自定义 HMAC 密钥。如果省略则自动生成。 |
| `--deliver-only` | 跳过智能体——直接将渲染后的 `--prompt` 作为原始消息投递。零 LLM 成本，亚秒级投递。要求 `--deliver` 是一个实际目标（非 `log`）。 |

订阅将持久化到 `~/.hermes/webhook_subscriptions.json`，并由 Webhook 适配器热重载，无需重启网关。

## `hermes doctor`

```bash
hermes doctor [--fix]
```

| 选项 | 描述 |
|--------|-------------|
| `--fix` | 尝试在可能的情况下进行自动修复。 |

## `hermes dump`

```bash
hermes dump [--show-keys]
```

输出您整个 Hermes 设置的紧凑、纯文本摘要。旨在用于复制粘贴到 Discord、GitHub issues 或 Telegram 中寻求支持 — 没有 ANSI 颜色，没有特殊格式，只有数据。

| 选项 | 描述 |
|--------|-------------|
| `--show-keys` | 显示已脱敏的 API 密钥前缀（首尾各 4 个字符），而不是仅显示 `set`/`not set`。 |

### 包含内容

| 部分 | 详情 |
|---------|---------|
| **Header** | Hermes 版本、发布日期、git 提交哈希 |
| **Environment** | 操作系统、Python 版本、OpenAI SDK 版本 |
| **Identity** | 活跃配置文件名、HERMES_HOME 路径 |
| **Model** | 已配置的默认模型和提供商 |
| **Terminal** | 后端类型（本地、docker、ssh 等） |
| **API keys** | 所有 22 个提供商/工具 API 密钥的存在性检查 |
| **Features** | 已启用的工具集、MCP 服务器数量、内存提供程序 |
| **Services** | 网关状态、已配置的消息平台 |
| **Workload** | 定时任务数量、已安装技能数量 |
| **Config overrides** | 任何与默认值不同的配置值 |

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

- 在 GitHub 上报告 bug — 将 dump 粘贴到您的 issue 中
- 在 Discord 中寻求帮助 — 在代码块中分享它
- 将您的设置与他人的设置进行比较
- 当某些功能不工作时进行快速完整性检查

:::tip
`hermes dump` 专门用于分享。如需交互式诊断，请使用 `hermes doctor`。如需视觉概览，请使用 `hermes status`。
:::

## `hermes debug`

```bash
hermes debug share [options]
```

将调试报告（系统信息 + 最近的日志）上传到粘贴服务并获得可分享的 URL。适用于快速支持请求 — 包含帮助者诊断您问题所需的一切信息。

| 选项 | 描述 |
|--------|-------------|
| `--lines <N>` | 每个日志文件包含的日志行数（默认：200）。 |
| `--expire <days>` | 粘贴过期天数（默认：7）。 |
| `--local` | 在本地打印报告而不是上传。 |

报告包括系统信息（操作系统、Python 版本、Hermes 版本）、最近的智能体和网关日志（每个文件限制 512 KB），以及已脱敏的 API 密钥状态。密钥始终会被脱敏 — 不会上传任何机密信息。

按顺序尝试的粘贴服务：paste.rs, dpaste.com。

### 示例

```bash
hermes debug share              # 上传调试报告，打印 URL
hermes debug share --lines 500  # 包含更多日志行
hermes debug share --expire 30  # 保留粘贴内容 30 天
hermes debug share --local      # 将报告打印到终端（不上传）
```

## `hermes backup`

```bash
hermes backup [options]
```

创建一个包含您的 Hermes 配置、技能、会话和数据的 zip 压缩包。备份不包含 hermes-agent 代码库本身。

| 选项 | 描述 |
|--------|-------------|
| `-o`, `--output <path>` | zip 文件的输出路径（默认：`~/hermes-backup-<timestamp>.zip`）。 |
| `-q`, `--quick` | 快照：仅包含关键状态文件（config.yaml, state.db, .env, auth, 定时任务）。比完整备份快得多。 |
| `-l`, `--label <name>` | 快照标签（仅与 `--quick` 一起使用）。 |

备份使用 SQLite 的 `backup()` API 进行安全复制，因此即使在 Hermes 运行时也能正确工作（支持 WAL 模式的安全操作）。

**zip 中排除的内容：**

- `*.db-wal`, `*.db-shm`, `*.db-journal` — SQLite 的 WAL/共享内存/日志附属文件。`*.db` 文件已经通过 `sqlite3.backup()` 获得了一致性快照；将实时附属文件一起打包会让恢复操作看到一个半提交的状态。
- `checkpoints/` — 每个会话的轨迹缓存。基于哈希键并在每个会话中重新生成；无论如何都不会干净地移植到另一个安装中。
- `hermes-agent` 代码本身（这是用户数据备份，不是代码库快照）。

### 示例

```bash
hermes backup                           # 完整备份到 ~/hermes-backup-*.zip
hermes backup -o /tmp/hermes.zip        # 完整备份到指定路径
hermes backup --quick                   # 仅状态的快速快照
hermes backup --quick --label "pre-upgrade"  # 带标签的快速快照
```

## `hermes checkpoints`

```bash
hermes checkpoints [COMMAND]
```

检查和管理位于 `~/.hermes/checkpoints/` 的影子 git 存储 — 这是会话内 `/rollback` 命令背后的存储层。可以随时安全运行；不要求智能体正在运行。

| 子命令 | 描述 |
|------------|-------------|
| `status` (默认) | 显示总大小、项目数量和每个项目的详细信息。直接运行 `hermes checkpoints` 等效。 |
| `list` | `status` 的别名。 |
| `prune` | 强制执行清理扫描 — 删除孤立和过时的项目，对存储进行垃圾回收，强制执行大小上限。忽略 24 小时的幂等性标记。 |
| `clear` | 删除整个检查点库。不可逆；除非使用 `-f`，否则会要求确认。 |
| `clear-legacy` | 仅删除由 v1→v2 迁移产生的 `legacy-<timestamp>/` 归档。 |

### 选项

| 选项 | 子命令 | 描述 |
|--------|------------|-------------|
| `--limit N` | `status`, `list` | 要列出的最大项目数（默认 20）。 |
| `--retention-days N` | `prune` | 丢弃 `last_touch` 早于 N 天的项目（默认 7）。 |
| `--max-size-mb N` | `prune` | 在孤立/过时项扫描之后，丢弃每个项目中最旧的提交，直到总存储大小 ≤ N MB（默认 500）。 |
| `--keep-orphans` | `prune` | 跳过删除其工作目录已不存在的项目。 |
| `-f`, `--force` | `clear`, `clear-legacy` | 跳过确认提示。 |

### 示例

```bash
hermes checkpoints                                  # 状态概览
hermes checkpoints prune --retention-days 3         # 激进清理
hermes checkpoints prune --max-size-mb 200          # 一次性收紧大小上限
hermes checkpoints clear-legacy -f                  # 删除 v1 归档目录
hermes checkpoints clear -f                         # 清除所有内容
```

有关完整架构和会话内命令，请参阅[检查点与 `/rollback`](../user-guide/checkpoints-and-rollback.md)。

## `hermes import`

```bash
hermes import <zipfile> [options]
```

将先前创建的 Hermes 备份恢复到您的 Hermes 主目录。归档中的所有文件会覆盖您 Hermes 主目录中的现有文件；`--force` 仅在目标已存在 Hermes 安装时跳过确认提示。

| 选项 | 描述 |
|--------|-------------|
| `-f`, `--force` | 跳过现有安装确认提示。 |

:::warning
导入前请停止网关以避免与正在运行的进程发生冲突。
:::

### 示例
```bash
hermes import ~/hermes-backup-20260423.zip           # 覆盖现有配置前会提示
hermes import ~/hermes-backup-20260423.zip --force   # 直接覆盖，不提示
```

## `hermes logs`

```bash
hermes logs [log_name] [options]
```

查看、跟踪和过滤 Hermes 日志文件。所有日志存储在 `~/.hermes/logs/`（或非默认配置文件的 `<profile>/logs/`）。

### 日志文件

| 名称 | 文件 | 记录内容 |
|------|------|-----------------|
| `agent` (默认) | `agent.log` | 所有智能体活动 — API 调用、工具调度、会话生命周期（INFO 及以上级别） |
| `errors` | `errors.log` | 仅警告和错误 — agent.log 的过滤子集 |
| `gateway` | `gateway.log` | 消息网关活动 — 平台连接、消息调度、webhook 事件 |

### 选项

| 选项 | 描述 |
|--------|-------------|
| `log_name` | 要查看的日志：`agent` (默认), `errors`, `gateway`, 或 `list` 显示可用文件及其大小。 |
| `-n`, `--lines <N>` | 要显示的行数（默认：50）。 |
| `-f`, `--follow` | 实时跟踪日志，类似 `tail -f`。按 Ctrl+C 停止。 |
| `--level <LEVEL>` | 要显示的最低日志级别：`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`。 |
| `--session <ID>` | 过滤包含会话 ID 子字符串的行。 |
| `--since <TIME>` | 显示从指定相对时间前的日志行：`30m`, `1h`, `2d` 等。支持 `s` (秒), `m` (分钟), `h` (小时), `d` (天)。 |
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

# 跟踪 errors.log，从 30 分钟前开始
hermes logs errors --since 30m -f

# 列出所有日志文件及其大小
hermes logs list
```

### 过滤

过滤器可以组合使用。当多个过滤器处于活动状态时，日志行必须通过**所有**过滤条件才会被显示：

```bash
# 最近 2 小时内包含会话 "tg-12345" 的 WARNING+ 行
hermes logs --level WARNING --since 2h --session tg-12345
```

当 `--since` 处于活动状态时，没有可解析时间戳的行也会被包含（它们可能是多行日志条目的续行）。当 `--level` 处于活动状态时，没有可检测级别的行也会被包含。

### 日志轮转

Hermes 使用 Python 的 `RotatingFileHandler`。旧日志会自动轮转 — 查找 `agent.log.1`, `agent.log.2` 等文件。`hermes logs list` 子命令会显示所有日志文件，包括已轮转的。

## `hermes config`

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
| `check` | 检查是否有缺失或过时的配置。 |
| `migrate` | 以交互方式添加新引入的选项。 |

## `hermes pairing`

```bash
hermes pairing <list|approve|revoke|clear-pending>
```

| 子命令 | 描述 |
|------------|-------------|
| `list` | 显示待处理和已批准的用户。 |
| `approve <平台> <代码>` | 批准一个配对代码。 |
| `revoke <平台> <用户-id>` | 撤销用户的访问权限。 |
| `clear-pending` | 清除待处理的配对代码。 |

## `hermes skills`

```bash
hermes skills <子命令>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `browse` | 技能注册表的分页浏览器。 |
| `search` | 搜索技能注册表。 |
| `install` | 安装一个技能。 |
| `inspect` | 预览一个技能而不安装它。 |
| `list` | 列出已安装的技能。 |
| `check` | 检查已安装的中心技能是否有上游更新。 |
| `update` | 当有上游变更时，重新安装中心技能。 |
| `audit` | 重新扫描已安装的中心技能。 |
| `uninstall` | 移除一个中心安装的技能。 |
| `reset` | 通过清除清单条目，取消一个被标记为 `user_modified` 的内置技能的卡住状态。使用 `--restore`，还会将用户副本替换为内置版本。 |
| `publish` | 将技能发布到注册表。 |
| `snapshot` | 导出/导入技能配置。 |
| `tap` | 管理自定义技能源。 |
| `config` | 按平台交互式启用/禁用技能的配置。 |

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
hermes skills install https://sharethis.chat/SKILL.md                     # 直接URL（单文件SKILL.md）
hermes skills install https://example.com/SKILL.md --name my-skill        # 当前置元数据没有名称时覆盖名称
hermes skills check
hermes skills update
hermes skills config
hermes skills reset google-workspace
hermes skills reset google-workspace --restore --yes
```

注意事项：
- `--force` 可以为第三方/社区技能覆盖非危险性的策略限制。
- `--force` 不会覆盖 `dangerous` 扫描结论。
- `--source skills-sh` 搜索公共的 `skills.sh` 目录。
- `--source well-known` 允许您将 Hermes 指向一个公开 `/.well-known/skills/index.json` 的站点。
- `--source browse-sh` 搜索 [browse.sh](https://browse.sh) 的200多个特定站点浏览器自动化技能目录。标识符类似 `browse-sh/airbnb.com/search-listings-ddgioa`。
- 传递 `http(s)://…/*.md` URL 会直接安装一个单文件 SKILL.md。当前置元数据中没有 `name:` 且 URL 的 slug 不是有效标识符时，交互式终端会提示输入名称；非交互式界面（如 TUI 内的 `/skills install`、网关平台）则需要使用 `--name <x>` 来代替。

## `hermes bundles`

```bash
hermes bundles <子命令>
```

技能包将多个技能组合在一个 `/<bundle-name>` 斜杠命令下。调用技能包会将每个引用的技能加载到单个组合的用户消息中。存储位置：`~/.hermes/skill-bundles/<slug>.yaml`。参见 [技能包](../user-guide/features/skills.md#skill-bundles) 了解 YAML 模式和行为。

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出已安装的包（无子命令时默认） |
| `show <name>` | 显示一个包的名称、描述、技能列表和文件路径 |
| `create <name>` | 创建一个新包。传递 `--skill <id>`（可重复）或省略以进行交互式输入。可用选项：`--description`, `--instruction`, `--force`。 |
| `delete <name>` | 删除一个包文件 |
| `reload` | 重新扫描 `~/.hermes/skill-bundles/` 并报告添加/移除的包 |

示例：

```bash
hermes bundles create backend-dev \
  --skill github-code-review \
  --skill test-driven-development \
  --skill github-pr-workflow \
  -d "后端特性开发"

hermes bundles list
hermes bundles show backend-dev
hermes bundles delete backend-dev
```

在聊天会话中，`/bundles` 列出已安装的包，`/<bundle-name>` 加载一个包。

## `hermes curator`

```bash
hermes curator <子命令>
```

策展人是一个后台辅助模型任务，它定期审查智能体创建的技能，清理过时技能，合并重叠技能，并归档废弃技能。捆绑的和中心安装的技能永远不会被触动。归档是可恢复的；永远不会发生自动删除。

| 子命令 | 描述 |
|------------|-------------|
| `status` | 显示策展人状态和技能统计 |
| `run` | 立即触发一次策展审查（阻塞直到大语言模型处理完成） |
| `run --background` | 在后台线程中启动大语言模型处理并立即返回 |
| `run --dry-run` | 仅预览 — 生成审查报告而不进行任何修改 |
| `backup` | 对 `~/.hermes/skills/` 进行手动 tar.gz 快照（策展人在每次实际运行前也会自动快照） |
| `rollback` | 从快照恢复 `~/.hermes/skills/`（默认为最新的） |
| `rollback --list` | 列出可用的快照 |
| `rollback --id <ts>` | 按 id 恢复特定快照 |
| `rollback -y` | 跳过确认提示 |
| `pause` | 暂停策展人直到恢复 |
| `resume` | 恢复已暂停的策展人 |
| `pin <skill>` | 钉住一个技能，使策展人永远不会自动转换它 |
| `unpin <skill>` | 取消钉住一个技能 |
| `restore <skill>` | 恢复一个已归档的技能 |
| `archive <skill>` | 手动归档一个技能 |
| `prune` | 手动清理策展人通常会清理的技能 |
| `list-archived` | 列出已归档的技能（可通过 `restore` 恢复） |

在全新安装时，第一次计划的运行会延迟整整一个 `interval_hours`（默认为7天）——网关不会在 `hermes update` 后的第一次心跳时立即执行策展。在那之前，使用 `hermes curator run --dry-run` 进行预览。

参见 [策展人](../user-guide/features/curator.md) 了解行为和配置。

## `hermes fallback`

```bash
hermes fallback <子命令>
```

管理后备提供者链。当主模型因速率限制、过载或连接错误而失败时，会按顺序尝试后备提供者。

| 子命令 | 描述 |
|------------|-------------|
| `list` (别名: `ls`) | 显示当前的后备链（无子命令时的默认行为） |
| `add` | 选择一个提供者 + 模型（与 `hermes model` 相同的选择器）并添加到链中 |
| `remove` (别名: `rm`) | 选择链中的一个条目进行删除 |
| `clear` | 移除所有后备条目 |

参见 [后备提供者](../user-guide/features/fallback-providers.md)。

## `hermes hooks`

```bash
hermes hooks <子命令>
```

检查在 `~/.hermes/config.yaml` 中声明的 shell 脚本钩子，针对合成负载进行测试，并管理 `~/.hermes/shell-hooks-allowlist.json` 中的首次使用同意白名单。

| 子命令 | 描述 |
|------------|-------------|
| `list` (别名: `ls`) | 列出已配置的钩子，包括匹配器、超时和同意状态 |
| `test <event>` | 触发匹配 `<event>` 的所有钩子，针对合成负载 |
| `revoke` (别名: `remove`, `rm`) | 移除一个命令的白名单条目（下次重启时生效） |
| `doctor` | 检查每个已配置的钩子：可执行位、白名单、修改时间漂移、JSON 有效性和合成运行计时 |

参见 [钩子](../user-guide/features/hooks.md) 了解事件签名和负载格式。

## `hermes memory`

```bash
hermes memory <子命令>
```

设置和管理外部记忆提供者插件。可用提供者：honcho, openviking, mem0, hindsight, holographic, retaindb, byterover, supermemory。同一时间只能激活一个外部提供者。内置记忆（MEMORY.md/USER.md）始终处于活动状态。

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `setup` | 交互式提供者选择和配置。 |
| `status` | 显示当前记忆提供者配置。 |
| `off` | 禁用外部提供者（仅内置）。 |

:::info 提供者特定子命令
当外部记忆提供者处于活动状态时，它可能会注册自己的顶级 `hermes <provider>` 命令用于提供者特定的管理（例如，当 Honcho 处于活动状态时为 `hermes honcho`）。未激活的提供者不会暴露其子命令。运行 `hermes --help` 可查看当前接入的命令。
:::

## `hermes acp`

```bash
hermes acp
```

将 Hermes 启动为用于编辑器集成的 ACP（智能体客户端协议）标准输入/输出服务器。

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
hermes mcp <子命令>
```

管理 MCP（模型上下文协议）服务器配置，并将 Hermes 作为 MCP 服务器运行。

| 子命令 | 描述 |
|------------|-------------|
| `serve [-v\|--verbose]` | 将 Hermes 作为 MCP 服务器运行 — 将对话暴露给其他智能体。 |
| `add <name> [--url URL] [--command CMD] [--args ...] [--auth oauth\|header]` | 添加一个具有自动工具发现功能的 MCP 服务器。 |
| `remove <name>` (别名: `rm`) | 从配置中移除一个 MCP 服务器。 |
| `list` (别名: `ls`) | 列出已配置的 MCP 服务器。 |
| `test <name>` | 测试到 MCP 服务器的连接。 |
| `configure <name>` (别名: `config`) | 切换服务器的工具选择。 |
| `login <name>` | 对基于 OAuth 的 MCP 服务器强制重新认证。 |

参见 [MCP 配置参考](./mcp-config-reference.md)、[在 Hermes 中使用 MCP](../guides/use-mcp-with-hermes.md) 和 [MCP 服务器模式](../user-guide/features/mcp.md#running-hermes-as-an-mcp-server)。

## `hermes 插件`

```bash
hermes plugins [子命令]
```

统一的插件管理 —— 将通用插件、记忆提供者和上下文引擎集中一处。运行不带子命令的 `hermes plugins` 会打开一个组合式交互界面，包含两个部分：

- **通用插件** —— 使用多选框启用/禁用已安装的插件
- **提供者插件** —— 用于记忆提供者和上下文引擎的单选配置。在某个类别上按 ENTER 键可打开单选选择器。

| 子命令 | 描述 |
|--------|------|
| *（无）* | 组合式交互界面 —— 包含通用插件开关和提供者插件配置。 |
| `install <标识符> [--force]` | 从 Git URL 或 `owner/repo` 安装插件。 |
| `update <名称>` | 拉取已安装插件的最新更改。 |
| `remove <名称>` （别名：`rm`, `uninstall`） | 移除已安装插件。 |
| `enable <名称>` | 启用一个已禁用的插件。 |
| `disable <名称>` | 禁用插件但不移除。 |
| `list` （别名：`ls`） | 列出已安装插件及其启用/禁用状态。 |

提供者插件的选择保存在 `config.yaml` 中：
- `memory.provider` —— 活动的记忆提供者（空值 = 仅使用内置功能）
- `context.engine` —— 活动的上下文引擎（`"compressor"` = 内置默认值）

通用插件的禁用列表存储在 `config.yaml` 的 `plugins.disabled` 下。

参阅 [插件](../user-guide/features/plugins.md) 和 [构建 Hermes 插件](../guides/build-a-hermes-plugin.md)。

## `hermes 工具`

```bash
hermes tools [--summary]
```

| 选项 | 描述 |
|------|------|
| `--summary` | 打印当前已启用工具的摘要并退出。 |

如果不带 `--summary` 参数，此命令将启动交互式的、按平台分类的工具配置界面。

## `hermes computer-use`

```bash
hermes computer-use <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `install` | 运行上游 cua-driver 安装程序（仅限 macOS）。 |
| `install --upgrade` | 即使 cua-driver 已在 PATH 中，也重新运行安装程序。上游脚本始终拉取最新版本，因此这将执行就地升级。 |
| `status` | 打印 `cua-driver` 是否在 `$PATH` 中以及安装的版本。 |

`hermes computer-use install` 是安装 `computer_use` 工具集所用的
[cua-driver](https://github.com/trycua/cua) 二进制文件的稳定入口点。它运行的是与你首次启用 Computer Use 时 `hermes tools` 调用的相同的上游安装程序，因此如果工具集切换未触发安装（例如，在返回用户设置时），重新运行安装是安全的。

`hermes update` 在更新结束时，如果 cua-driver 在 PATH 中，会自动重新运行上游安装程序，因此大多数用户不需要手动调用 `--upgrade`。当上游发布了你希望立即使用而不想等待下一次 Hermes 更新的修复时，可以使用此选项。

## `hermes sessions`

```bash
hermes sessions <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出最近的会话。 |
| `browse` | 交互式会话选择器，支持搜索和恢复。 |
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
| `--days <n>` | 分析最后 `n` 天（默认：30）。 |
| `--source <platform>` | 按来源筛选，如 `cli`、`telegram` 或 `discord`。 |

## `hermes claw`

```bash
hermes claw migrate [options]
```

将你的 OpenClaw 设置迁移到 Hermes。从 `~/.openclaw`（或自定义路径）读取并写入到 `~/.hermes`。自动检测旧目录名（`~/.clawdbot`、`~/.moltbot`）和配置文件名（`clawdbot.json`、`moltbot.json`）。

| 选项 | 描述 |
|--------|-------------|
| `--dry-run` | 预览将要迁移的内容，而不实际写入。 |
| `--preset <name>` | 迁移预设：`full`（所有兼容设置）或 `user-data`（不包括基础设施配置）。两个预设都不会导入密钥 — 需显式传递 `--migrate-secrets`。 |
| `--overwrite` | 在冲突时覆盖现有 Hermes 文件（默认：当计划有冲突时拒绝应用）。 |
| `--migrate-secrets` | 在迁移中包含 API 密钥。即使在 `--preset full` 下也需要此选项。 |
| `--no-backup` | 跳过迁移前的 `~/.hermes/` zip 快照（默认在应用前将单个恢复点存档写入 `~/.hermes/backups/pre-migration-*.zip`；可用 `hermes import` 恢复）。 |
| `--source <path>` | 自定义 OpenClaw 目录（默认：`~/.openclaw`）。 |
| `--workspace-target <path>` | 工作区指令 (AGENTS.md) 的目标目录。 |
| `--skill-conflict <mode>` | 处理技能名称冲突：`skip`（默认）、`overwrite` 或 `rename`。 |
| `--yes` | 跳过确认提示。 |

### 迁移内容

迁移涵盖超过 30 个类别，包括角色、记忆、技能、模型提供商、消息平台、智能体行为、会话策略、MCP 服务器、TTS 等。项目要么被**直接导入**到 Hermes 的对应项中，要么被**存档**以供手动审查。

**直接导入：** SOUL.md、MEMORY.md、USER.md、AGENTS.md、技能（4 个源目录）、默认模型、自定义提供商、MCP 服务器、消息平台令牌和允许列表（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost）、智能体默认值（推理力度、压缩、人工延迟、时区、沙箱）、会话重置策略、批准规则、TTS 配置、浏览器设置、工具设置、执行超时、命令允许列表、网关配置以及来自 3 个来源的 API 密钥。

**存档以供手动审查：** 定时任务、插件、钩子/网络钩子、记忆后端 (QMD)、技能注册表配置、UI/身份、日志记录、多智能体设置、通道绑定、IDENTITY.md、TOOLS.md、HEARTBEAT.md、BOOTSTRAP.md。

**API 密钥解析**按优先级顺序检查三个来源：配置值 → `~/.openclaw/.env` → `auth-profiles.json`。所有令牌字段都处理纯字符串、环境变量模板 (`${VAR}`) 和 SecretRef 对象。

有关完整的配置键映射、SecretRef 处理详情和迁移后检查清单，请参阅 **[完整迁移指南](../guides/migrate-from-openclaw.md)**。

### 示例

```bash
# 预览将要迁移的内容
hermes claw migrate --dry-run

# 完整迁移（所有兼容设置，不包含密钥）
hermes claw migrate --preset full

# 完整迁移，包含 API 密钥
hermes claw migrate --preset full --migrate-secrets

# 仅迁移用户数据（不包含密钥），覆盖冲突
hermes claw migrate --preset user-data --overwrite

# 从自定义 OpenClaw 路径迁移
hermes claw migrate --source /home/user/old-openclaw
```

## `hermes dashboard`

```bash
hermes dashboard [options]
```

启动 Web 仪表板 — 一个基于浏览器的 UI，用于管理配置、API 密钥和监控会话。需要 `pip install hermes-agent[web]`（FastAPI + Uvicorn）。嵌入式浏览器聊天选项卡需要 `--tui` 加上 `pty` 扩展。完整文档请参阅 [Web 仪表板](/user-guide/features/web-dashboard)。

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
| `--port` | `9119` | 运行 Web 服务器的端口 |
| `--host` | `127.0.0.1` | 绑定地址 |
| `--no-open` | — | 不自动打开浏览器 |
| `--tui` | 关闭 | 通过在 PTY/WebSocket 桥接后运行 `hermes --tui` 来启用浏览器内的聊天选项卡。需要 `pip install 'hermes-agent[web,pty]'` 和 POSIX PTY 环境，如 Linux、macOS 或 WSL2。 |
| `--insecure` | 关闭 | 允许绑定到非 localhost 主机。将仪表板凭据暴露在网络上；仅在受信任的网络控制下使用。 |
| `--stop` | — | 停止正在运行的 `hermes dashboard` 进程并退出。 |
| `--status` | — | 列出正在运行的 `hermes dashboard` 进程并退出。 |

```bash
# 默认 — 打开浏览器到 http://127.0.0.1:9119
hermes dashboard

# 自定义端口，不打开浏览器
hermes dashboard --port 8080 --no-open

# 启用浏览器聊天选项卡
hermes dashboard --tui
```

## `hermes profile`

```bash
hermes profile <subcommand>
```

管理配置文件 — 多个隔离的 Hermes 实例，每个都有自己的配置、会话、技能和主目录。

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出所有配置文件。 |
| `use <name>` | 设置一个持久默认配置文件。 |
| `create <name> [--clone] [--clone-all] [--clone-from <source>] [--no-alias]` | 创建一个新配置文件。`--clone` 从活动配置文件复制配置、`.env` 和 `SOUL.md`。`--clone-all` 复制所有状态。`--clone-from` 指定源配置文件。 |
| `delete <name> [-y]` | 删除一个配置文件。 |
| `show <name>` | 显示配置文件详情（主目录、配置等）。 |
| `alias <name> [--remove] [--name NAME]` | 管理快速配置文件访问的包装脚本。 |
| `rename <old> <new>` | 重命名一个配置文件。 |
| `export <name> [-o FILE]` | 将配置文件导出为 `.tar.gz` 归档（本地备份）。 |
| `import <archive> [--name NAME]` | 从 `.tar.gz` 归档导入配置文件（本地恢复）。 |
| `install <source> [--name N] [--alias] [--force] [-y]` | 从 git URL 或本地目录安装配置文件分发版。 |
| `update <name> [--force-config] [-y]` | 重新拉取分发版；保留用户数据（记忆、会话、认证）。 |
| `info <name>` | 显示配置文件的分发版清单（版本、要求、来源）。 |

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

将 shell 补全脚本打印到标准输出。在你的 shell 配置文件中引入输出，以获得 Hermes 命令、子命令和配置文件名称的制表符补全。

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

拉取最新的 `hermes-agent` 代码，并在你的虚拟环境中重新安装依赖项，然后重新运行安装后钩子（MCP 服务器、技能同步、补全安装）。可在实时安装上安全运行。

**pip 安装：** `hermes update` 会自动检测基于 pip 的安装——它会查询 PyPI 获取最新版本，并运行 `pip install --upgrade hermes-agent` 而非 `git pull`。PyPI 发布跟踪的是标记版本（主版本/次版本），而非 `main` 分支上的每次提交。使用 `--check` 可查看是否有更新的 PyPI 版本可用而不实际安装。

| 选项                 | 描述                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `--check`            | 并排打印当前提交与最新的 `origin/main` 提交，如果同步则退出代码 0，如果落后则退出代码 1。不会进行拉取、安装或重启。 |
| `--backup`           | 在拉取之前，为 `HERMES_HOME`（配置、认证、会话、技能、配对数据）创建一个带标签的更新前快照。默认为**关闭**——之前的总是备份行为会在大型主目录上为每次更新增加数分钟时间。可通过在 `config.yaml` 中设置 `update.backup: true` 永久开启。 |
| `--restart-gateway`  | 在成功更新后，重启正在运行的网关服务。如果安装了多个配置文件，则隐含 `--all` 语义。                             |

其他行为：

- **配对数据快照。** 即使 `--backup` 关闭，`hermes update` 也会在 `git pull` 之前对 `~/.hermes/pairing/` 和飞书评论规则进行轻量级快照。如果拉取操作覆盖了你正在编辑的文件，你可以使用 `hermes backup restore --state pre-update` 进行回滚。
- **旧版 `hermes.service` 警告。** 如果 Hermes 检测到重命名前的 `hermes.service` systemd 单元（而不是当前的 `hermes-gateway.service`），它会打印一次迁移提示，以便你避免出现抖动循环问题。
- **退出代码。** 成功为 `0`，拉取/安装/安装后出错为 `1`，阻止 `git pull` 的意外工作树变更为 `2`。

## 维护命令

| 命令                               | 描述                       |
| ---------------------------------- | -------------------------- |
| `hermes version`                   | 打印版本信息。             |
| `hermes update`                    | 拉取最新变更并重新安装依赖。 |
| `hermes uninstall [--full] [--yes]` | 移除 Hermes，可选删除所有配置/数据。 |

## 另请参见

- [斜杠命令参考](./slash-commands.md)
- [命令行界面](../user-guide/cli.md)
- [会话](../user-guide/sessions.md)
- [技能系统](../user-guide/features/skills.md)
- [皮肤与主题](../user-guide/features/skins.md)