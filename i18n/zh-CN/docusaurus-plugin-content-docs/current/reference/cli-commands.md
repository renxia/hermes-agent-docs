---
sidebar_position: 1
title: "CLI 命令参考"
description: "Hermes 终端命令及命令族的权威参考"
---

# CLI 命令参考

本页面涵盖您从 shell 中运行的**终端命令**。

有关聊天内斜杠命令，请参阅[斜杠命令参考](./slash-commands.md)。

## 全局入口点

```bash
hermes [global-options] <command> [subcommand/options]
```

### 全局选项

| 选项 | 描述 |
|--------|-------------|
| `--version`, `-V` | 显示版本并退出。 |
| `--profile <name>`, `-p <name>` | 选择本次调用要使用的 Hermes 配置文件。覆盖由 `hermes profile use` 设置的粘性默认值。 |
| `--resume <session>`, `-r <session>` | 通过 ID 或标题恢复之前的会话。 |
| `--continue [name]`, `-c [name]` | 恢复最近的会话，或匹配标题的最近会话。 |
| `--worktree`, `-w` | 在隔离的 git 工作树中启动，用于并行智能体工作流。 |
| `--yolo` | 绕过危险命令的批准提示。 |
| `--pass-session-id` | 在智能体的系统提示中包含会话 ID。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml` 并回退到内置默认值。`.env` 中的凭据仍会被加载。 |
| `--ignore-rules` | 跳过自动注入 `AGENTS.md`、`SOUL.md`、`.cursorrules`、记忆和预加载技能。 |
| `--tui` | 启动 [TUI](../user-guide/tui.md) 而不是经典 CLI。等价于 `HERMES_TUI=1`。 |
| `--dev` | 与 `--tui` 一起使用：通过 `tsx` 直接运行 TypeScript 源码，而不是预构建的包（适用于 TUI 贡献者）。 |

## 顶级命令

| 命令 | 用途 |
|---------|---------|
| `hermes chat` | 与智能体进行交互式或一次性聊天。 |
| `hermes model` | 交互式选择默认提供商和模型。 |
| `hermes gateway` | 运行或管理消息网关服务。 |
| `hermes setup` | 针对全部或部分配置的交互式设置向导。 |
| `hermes whatsapp` | 配置并配对 WhatsApp 桥接。 |
| `hermes slack` | Slack 辅助工具（当前功能：为每个命令生成本地斜杠命令的应用清单）。 |
| `hermes auth` | 管理凭据 — 添加、列出、移除、重置、设置策略。处理 Codex/Nous/Anthropic 的 OAuth 流程。 |
| `hermes login` / `logout` | **已弃用** — 请改用 `hermes auth`。 |
| `hermes status` | 显示智能体、认证和平台状态。 |
| `hermes cron` | 检查并触发 cron 调度器。 |
| `hermes webhook` | 管理事件驱动激活的动态 webhook 订阅。 |
| `hermes doctor` | 诊断配置和依赖项问题。 |
| `hermes dump` | 可复制粘贴的设置摘要，用于支持/调试。 |
| `hermes debug` | 调试工具 — 上传日志和系统信息以获取支持。 |
| `hermes backup` | 将 Hermes 主目录备份为 zip 文件。 |
| `hermes import` | 从 zip 文件恢复 Hermes 备份。 |
| `hermes logs` | 查看、跟踪和过滤智能体/网关/错误日志文件。 |
| `hermes config` | 显示、编辑、迁移和查询配置文件。 |
| `hermes pairing` | 批准或撤销消息配对码。 |
| `hermes skills` | 浏览、安装、发布、审计和配置技能。 |
| `hermes honcho` | 管理 Honcho 跨会话记忆集成。 |
| `hermes memory` | 配置外部记忆提供商。 |
| `hermes acp` | 将 Hermes 作为 ACP 服务器运行，用于编辑器集成。 |
| `hermes mcp` | 管理 MCP 服务器配置，并将 Hermes 作为 MCP 服务器运行。 |
| `hermes plugins` | 管理 Hermes 智能体插件（安装、启用、禁用、移除）。 |
| `hermes tools` | 配置每个平台启用的工具。 |
| `hermes sessions` | 浏览、导出、清理、重命名和删除会话。 |
| `hermes insights` | 显示令牌/成本/活动分析。 |
| `hermes claw` | OpenClaw 迁移辅助工具。 |
| `hermes dashboard` | 启动用于管理配置、API 密钥和会话的 Web 仪表板。 |
| `hermes profile` | 管理配置文件 — 多个隔离的 Hermes 实例。 |
| `hermes completion` | 打印 shell 补全脚本（bash/zsh）。 |
| `hermes version` | 显示版本信息。 |
| `hermes update` | 拉取最新代码并重新安装依赖项。 |
| `hermes uninstall` | 从系统中移除 Hermes。 |

## `hermes chat`

```bash
hermes chat [选项]
```

常用选项：

| 选项 | 描述 |
|--------|-------------|
| `-q`, `--query "..."` | 一次性、非交互式提示。 |
| `-m`, `--model <模型>` | 覆盖本次运行的模型。 |
| `-t`, `--toolsets <csv>` | 启用一组以逗号分隔的工具集。 |
| `--provider <提供商>` | 强制使用某个提供商：`auto`、`openrouter`、`nous`、`openai-codex`、`copilot-acp`、`copilot`、`anthropic`、`gemini`、`google-gemini-cli`、`huggingface`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`kilocode`、`xiaomi`、`arcee`、`gmi`、`alibaba`、`deepseek`、`nvidia`、`ollama-cloud`、`xai`（别名 `grok`）、`qwen-oauth`、`bedrock`、`opencode-zen`、`opencode-go`、`ai-gateway`、`azure-foundry`。 |
| `-s`, `--skills <名称>` | 为会话预加载一个或多个技能（可重复使用或以逗号分隔）。 |
| `-v`, `--verbose` | 详细输出。 |
| `-Q`, `--quiet` | 编程模式：抑制横幅/旋转指示器/工具预览。 |
| `--image <路径>` | 将本地图像附加到单个查询。 |
| `--resume <会话>` / `--continue [名称]` | 直接从 `chat` 恢复会话。 |
| `--worktree` | 为此运行创建一个隔离的 git 工作树。 |
| `--checkpoints` | 在破坏性文件更改之前启用文件系统检查点。 |
| `--yolo` | 跳过批准提示。 |
| `--pass-session-id` | 将会话 ID 传递到系统提示中。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml` 并使用内置默认值。`.env` 中的凭据仍会被加载。适用于隔离的 CI 运行、可重现的错误报告以及第三方集成。 |
| `--ignore-rules` | 跳过 `AGENTS.md`、`SOUL.md`、`.cursorrules`、持久记忆和预加载技能的自动注入。与 `--ignore-user-config` 结合使用可实现完全隔离的运行。 |
| `--source <标签>` | 用于过滤的会话源标签（默认：`cli`）。第三方集成应使用 `tool`，以避免出现在用户会话列表中。 |
| `--max-turns <N>` | 每次对话轮次的最大工具调用迭代次数（默认：90，或配置中的 `agent.max_turns`）。 |

示例：

```bash
hermes
hermes chat -q "总结最新的 PR"
hermes chat --provider openrouter --model anthropic/claude-sonnet-4.6
hermes chat --toolsets web,terminal,skills
hermes chat --quiet -q "仅返回 JSON"
hermes chat --worktree -q "审查此仓库并打开一个 PR"
hermes chat --ignore-user-config --ignore-rules -q "在不使用我的个人设置的情况下重现问题"
```

## `hermes model`

交互式提供商 + 模型选择器。**这是用于添加新提供商、设置 API 密钥和运行 OAuth 流程的命令。**请从终端运行此命令，而不是在活动的 Hermes 聊天会话中运行。

```bash
hermes model
```

在以下情况下使用此命令：
- **添加新提供商**（OpenRouter、Anthropic、Copilot、DeepSeek、自定义等）
- 登录基于 OAuth 的提供商（Anthropic、Copilot、Codex、Nous Portal）
- 输入或更新 API 密钥
- 从提供商特定的模型列表中选择
- 配置自定义/自托管端点
- 将新的默认值保存到配置中

:::warning hermes model 与 /model — 注意区别
**`hermes model`**（从终端运行，不在任何 Hermes 会话内）是**完整的提供商设置向导**。它可以添加新提供商、运行 OAuth 流程、提示输入 API 密钥并配置端点。

**`/model`**（在活动的 Hermes 聊天会话中输入）只能**在您已设置的提供商和模型之间切换**。它无法添加新提供商、运行 OAuth 或提示输入 API 密钥。

**如果您需要添加新提供商：**请先退出 Hermes 会话（`Ctrl+C` 或 `/quit`），然后从终端提示符运行 `hermes model`。
:::

### `/model` 斜杠命令（会话中）

在不离开会话的情况下切换已配置的模型：

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

:::info 如果我只看到 OpenRouter 模型怎么办？
如果您只配置了 OpenRouter，`/model` 将仅显示 OpenRouter 模型。要添加其他提供商（Anthropic、DeepSeek、Copilot 等），请退出会话并从终端运行 `hermes model`。
:::

提供商和基础 URL 的更改会自动持久化到 `config.yaml`。当从自定义端点切换出去时，过时的基础 URL 会被清除，以防止其泄漏到其他提供商。

## `hermes gateway`

```bash
hermes gateway <子命令>
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
请使用 `hermes gateway run` 而不是 `hermes gateway start` — WSL 对 systemd 的支持不可靠。将其包装在 tmux 中以保持持久性：`tmux new -s hermes 'hermes gateway run'`。详情请参见 [WSL 常见问题解答](/docs/reference/faq#wsl-gateway-keeps-disconnecting-or-hermes-gateway-start-fails)。
:::

## `hermes setup`

```bash
hermes setup [模型|语音合成|终端|网关|工具|智能体] [--非交互式] [--重置] [--快速] [--重新配置]
```

**首次运行：** 启动首次使用向导。

**已配置用户：** 直接进入完整的重新配置向导 — 每个提示都会将您当前的值作为默认值显示，按 Enter 键保留原值或输入新值。无菜单。

直接进入某个部分，而不是运行完整向导：

| 部分 | 描述 |
|---------|-------------|
| `模型` | 提供商和模型设置。 |
| `终端` | 终端后端和沙箱设置。 |
| `网关` | 消息平台设置。 |
| `工具` | 按平台启用/禁用工具。 |
| `智能体` | 智能体行为设置。 |

选项：

| 选项 | 描述 |
|--------|-------------|
| `--快速` | 已配置用户运行时：仅提示缺失或未设置的项。跳过已配置的项。 |
| `--非交互式` | 使用默认值/环境变量，不进行提示。 |
| `--重置` | 在设置前将配置重置为默认值。 |
| `--重新配置` | 向后兼容别名 — 在现有安装上直接运行 `hermes setup` 现在默认执行此操作。 |

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

生成一个 Slack 应用清单，将 `COMMAND_REGISTRY`（`/btw`、`/stop`、`/model` 等）中的每个网关命令注册为一级 Slack 斜杠命令 —— 与 Discord 和 Telegram 保持功能一致。将输出内容粘贴到你的 Slack 应用配置中：
[https://api.slack.com/apps](https://api.slack.com/apps) → 你的应用 → **功能 → 应用清单 → 编辑**，然后点击 **保存**。如果作用域或斜杠命令发生更改，Slack 会提示你重新安装应用。

| 参数 | 默认值 | 用途 |
|------|---------|---------|
| `--write [PATH]` | 标准输出 | 写入文件而非输出到标准输出。仅使用 `--write` 会写入 `$HERMES_HOME/slack-manifest.json`。 |
| `--name NAME` | `Hermes` | 在 Slack 中显示的机器人名称。 |
| `--description DESC` | 默认描述 | 在 Slack 应用目录中显示的机器人描述。 |
| `--slashes-only` | 关闭 | 仅输出 `features.slash_commands`，以便合并到手动维护的清单中。 |

在 `hermes update` 后再次运行 `hermes slack manifest --write`，以获取任何新命令。


## `hermes login` / `hermes logout` *（已弃用）*

:::caution
`hermes login` 已被移除。请使用 `hermes auth` 管理 OAuth 凭据，`hermes model` 选择提供商，或使用 `hermes setup` 进行完整的交互式设置。
:::

## `hermes auth`

管理同一提供商凭据池以实现密钥轮换。完整文档请参见 [凭据池](/docs/user-guide/features/credential-pools)。

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
|--------|-------------|
| `--all` | 以可共享的脱敏格式显示所有详细信息。 |
| `--deep` | 运行更深入的检查，可能需要更长时间。 |

## `hermes cron`

```bash
hermes cron <list|create|edit|pause|resume|run|remove|status|tick>
```

| 子命令 | 描述 |
|------------|-------------|
| `list` | 显示已计划的作业。 |
| `create` / `add` | 从提示创建计划作业，可选择通过重复的 `--skill` 附加一个或多个技能。 |
| `edit` | 更新作业的计划、提示、名称、交付方式、重复次数或附加的技能。支持 `--clear-skills`、`--add-skill` 和 `--remove-skill`。 |
| `pause` | 暂停作业而不删除它。 |
| `resume` | 恢复暂停的作业并计算其下一次运行时间。 |
| `run` | 在下次调度器滴答时触发作业。 |
| `remove` | 删除计划作业。 |
| `status` | 检查 cron 调度器是否正在运行。 |
| `tick` | 运行到期的作业一次并退出。 |

## `hermes webhook`

```bash
hermes webhook <subscribe|list|remove|test>
```

管理动态 Webhook 订阅，用于事件驱动的智能体激活。需要在配置中启用 Webhook 平台 —— 如果未配置，则打印设置说明。

| 子命令 | 描述 |
|------------|-------------|
| `subscribe` / `add` | 创建 Webhook 路由。返回 URL 和 HMAC 密钥，以便在你的服务上进行配置。 |
| `list` / `ls` | 显示所有智能体创建的订阅。 |
| `remove` / `rm` | 删除动态订阅。来自 config.yaml 的静态路由不受影响。 |
| `test` | 发送测试 POST 请求以验证订阅是否正常工作。 |

### `hermes webhook subscribe`

```bash
hermes webhook subscribe <name> [options]
```

| 选项 | 描述 |
|--------|-------------|
| `--prompt` | 提示模板，使用 `{dot.notation}` 引用载荷字段。 |
| `--events` | 要接受的事件类型（以逗号分隔，例如 `issues,pull_request`）。留空表示接受所有事件。 |
| `--description` | 人类可读的描述。 |
| `--skills` | 要为智能体运行加载的技能名称（以逗号分隔）。 |
| `--deliver` | 交付目标：`log`（默认）、`telegram`、`discord`、`slack`、`github_comment`。 |
| `--deliver-chat-id` | 跨平台交付的目标聊天/频道 ID。 |
| `--secret` | 自定义 HMAC 密钥。如果省略，则自动生成。 |

订阅信息会持久化保存到 `~/.hermes/webhook_subscriptions.json`，并由 Webhook 适配器热重载，无需重启网关。

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

输出你的整个 Hermes 设置的简洁纯文本摘要。设计用于复制粘贴到 Discord、GitHub 问题或 Telegram 中寻求支持 —— 无 ANSI 颜色、无特殊格式，只有数据。

| 选项 | 描述 |
|--------|-------------|
| `--show-keys` | 显示脱敏的 API 密钥前缀（首尾各 4 个字符），而不是仅显示 `已设置`/`未设置`。 |

### 包含内容

| 部分 | 详情 |
|---------|---------|
| **头部** | Hermes 版本、发布日期、Git 提交哈希 |
| **环境** | 操作系统、Python 版本、OpenAI SDK 版本 |
| **身份** | 当前配置文件名称、HERMES_HOME 路径 |
| **模型** | 配置的默认模型和提供商 |
| **终端** | 后端类型（本地、Docker、SSH 等） |
| **API 密钥** | 对所有 22 个提供商/工具 API 密钥的存在性检查 |
| **功能** | 已启用的工具集、MCP 服务器数量、内存提供商 |
| **服务** | 网关状态、配置的通信平台 |
| **工作负载** | Cron 作业数量、已安装技能数量 |
| **配置覆盖** | 任何与默认值不同的配置项 |

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
  openrouter           已设置
  openai               未设置
  anthropic            已设置
  nous                 未设置
  firecrawl            已设置
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

### 使用场景

- 在 GitHub 上报告 Bug —— 将 dump 内容粘贴到你的问题中
- 在 Discord 中寻求帮助 —— 将其分享到代码块中
- 将你的设置与他人进行比较
- 当某些功能无法正常工作时进行快速检查

:::tip
`hermes dump` 专门用于共享。如需交互式诊断，请使用 `hermes doctor`。如需可视化概览，请使用 `hermes status`。
:::

## `hermes debug`

```bash
hermes debug share [options]
```

将调试报告（系统信息 + 最近日志）上传到粘贴服务并获取可共享的 URL。适用于快速支持请求 —— 包含帮助者诊断你的问题所需的所有信息。

| 选项 | 描述 |
|--------|-------------|
| `--lines <N>` | 每个日志文件包含的日志行数（默认：200）。 |
| `--expire <days>` | 粘贴内容的有效期（以天为单位，默认：7）。 |
| `--local` | 在本地打印报告而不是上传。 |

报告包含系统信息（操作系统、Python 版本、Hermes 版本）、最近的智能体和网关日志（每个文件限制为 512 KB）以及脱敏的 API 密钥状态。密钥始终会被脱敏处理 —— 不会上传任何机密信息。

按顺序尝试的粘贴服务：paste.rs、dpaste.com。

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

创建 Hermes 配置、技能、会话和数据的 ZIP 归档文件。备份不包含 hermes-agent 代码库本身。

| 选项 | 描述 |
|--------|-------------|
| `-o`, `--output <path>` | ZIP 文件的输出路径（默认：`~/hermes-backup-<timestamp>.zip`）。 |
| `-q`, `--quick` | 快速快照：仅包含关键状态文件（config.yaml、state.db、.env、auth、cron 作业）。比完整备份快得多。 |
| `-l`, `--label <name>` | 快照的标签（仅与 `--quick` 一起使用）。 |

备份使用 SQLite 的 `backup()` API 进行安全复制，因此即使在 Hermes 运行时也能正常工作（WAL 模式安全）。

### 示例

```bash
hermes backup                           # 完整备份到 ~/hermes-backup-*.zip
hermes backup -o /tmp/hermes.zip        # 完整备份到指定路径
hermes backup --quick                   # 快速仅状态快照
hermes backup --quick --label "pre-upgrade"  # 带标签的快速快照
```

## `hermes import`

```bash
hermes import <zipfile> [options]
```

将之前创建的 Hermes 备份恢复到您的 Hermes 主目录中。

| 选项 | 描述 |
|--------|-------------|
| `-f`, `--force` | 无需确认即可覆盖现有文件。 |

## `hermes logs`

```bash
hermes logs [log_name] [options]
```

查看、实时跟踪和过滤 Hermes 日志文件。所有日志都存储在 `~/.hermes/logs/` 中（对于非默认配置文件，存储在 `<profile>/logs/` 中）。

### 日志文件

| 名称 | 文件 | 记录内容 |
|------|------|-----------------|
| `agent`（默认） | `agent.log` | 所有智能体活动 — API 调用、工具调度、会话生命周期（INFO 及以上级别） |
| `errors` | `errors.log` | 仅警告和错误 — `agent.log` 的过滤子集 |
| `gateway` | `gateway.log` | 消息网关活动 — 平台连接、消息调度、Webhook 事件 |

### 选项

| 选项 | 描述 |
|--------|-------------|
| `log_name` | 要查看的日志：`agent`（默认）、`errors`、`gateway`，或 `list` 以显示可用文件及其大小。 |
| `-n`, `--lines <N>` | 要显示的行数（默认：50）。 |
| `-f`, `--follow` | 实时跟踪日志，类似于 `tail -f`。按 Ctrl+C 停止。 |
| `--level <LEVEL>` | 要显示的最小日志级别：`DEBUG`、`INFO`、`WARNING`、`ERROR`、`CRITICAL`。 |
| `--session <ID>` | 过滤包含会话 ID 子字符串的行。 |
| `--since <TIME>` | 显示从相对时间 ago 开始的行：`30m`、`1h`、`2d` 等。支持 `s`（秒）、`m`（分钟）、`h`（小时）、`d`（天）。 |
| `--component <NAME>` | 按组件过滤：`gateway`、`agent`、`tools`、`cli`、`cron`。 |

### 示例

```bash
# 查看 agent.log 的最后 50 行（默认）
hermes logs

# 实时跟踪 agent.log
hermes logs -f

# 查看 gateway.log 的最后 100 行
hermes logs gateway -n 100

# 仅显示过去一小时的警告和错误
hermes logs --level WARNING --since 1h

# 按特定会话过滤
hermes logs --session abc123

# 从 30 分钟前开始跟踪 errors.log
hermes logs errors --since 30m -f

# 列出所有日志文件及其大小
hermes logs list
```

### 过滤

可以组合使用过滤器。当多个过滤器处于活动状态时，日志行必须通过**所有**过滤器才能显示：

```bash
# 过去 2 小时内包含会话 "tg-12345" 的 WARNING+ 行
hermes logs --level WARNING --since 2h --session tg-12345
```

当 `--since` 处于活动状态时，包含不可解析时间戳的行会被包括在内（它们可能是多行日志条目的续行）。当 `--level` 处于活动状态时，包含不可检测级别的的行会被包括在内。

### 日志轮换

Hermes 使用 Python 的 `RotatingFileHandler`。旧日志会自动轮换 — 查找 `agent.log.1`、`agent.log.2` 等。`hermes logs list` 子命令显示所有日志文件，包括轮换的文件。

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
| `check` | 检查缺失或过时的配置。 |
| `migrate` | 交互式添加新引入的选项。 |

## `hermes pairing`

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
|------------|-------------|
| `browse` | 技能注册表的带分页浏览器。 |
| `search` | 搜索技能注册表。 |
| `install` | 安装一个技能。 |
| `inspect` | 预览技能而不安装它。 |
| `list` | 列出已安装的技能。 |
| `check` | 检查已安装的 hub 技能是否有上游更新。 |
| `update` | 当有上游变更时，重新安装 hub 技能。 |
| `audit` | 重新扫描已安装的 hub 技能。 |
| `uninstall` | 移除一个通过 hub 安装的技能。 |
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
hermes skills install https://example.com/SKILL.md --name my-skill        # 当 frontmatter 没有 name 时覆盖名称
hermes skills check
hermes skills update
hermes skills config
```

说明：
- `--force` 可以覆盖第三方/社区技能的非危险策略阻止。
- `--force` 不会覆盖 `dangerous` 扫描结果。
- `--source skills-sh` 搜索公共的 `skills.sh` 目录。
- `--source well-known` 允许你将 Hermes 指向暴露 `/.well-known/skills/index.json` 的网站。
- 传递 `http(s)://…/*.md` URL 会直接安装单文件 SKILL.md。当 frontmatter 没有 `name:` 且 URL 路径不是一个有效标识符时，交互式终端会提示输入名称；非交互式界面（TUI 内的 `/skills install`、网关平台）则需要使用 `--name <x>`。

## `hermes honcho`

```bash
hermes honcho [--target-profile 名称] <子命令>
```

管理 Honcho 跨会话记忆集成。此命令由 Honcho 记忆提供者插件提供，仅在配置中将 `memory.provider` 设置为 `honcho` 时可用。

`--target-profile` 标志允许你管理另一个配置文件的 Honcho 配置而无需切换到该配置文件。

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `setup` | 重定向到 `hermes memory setup`（统一设置路径）。 |
| `status [--all]` | 显示当前 Honcho 配置和连接状态。`--all` 显示跨配置文件概览。 |
| `peers` | 显示所有配置文件的对等身份。 |
| `sessions` | 列出已知的 Honcho 会话映射。 |
| `map [名称]` | 将当前目录映射到 Honcho 会话名称。省略 `名称` 可列出当前映射。 |
| `peer` | 显示或更新对等名称和辩证推理级别。选项：`--user 名称`，`--ai 名称`，`--reasoning 级别`。 |
| `mode [模式]` | 显示或设置回忆模式：`hybrid`、`context` 或 `tools`。省略则显示当前模式。 |
| `tokens` | 显示或设置上下文和辩证的令牌预算。选项：`--context N`，`--dialectic N`。 |
| `identity [文件] [--show]` | 播种或显示 AI 对等身份表示。 |
| `enable` | 为当前配置文件启用 Honcho。 |
| `disable` | 为当前配置文件禁用 Honcho。 |
| `sync` | 将 Honcho 配置同步到所有现有配置文件（创建缺失的主机块）。 |
| `migrate` | 从 openclaw-honcho 迁移到 Hermes Honcho 的分步指南。 |

## `hermes memory`

```bash
hermes memory <子命令>
```

设置和管理外部记忆提供者插件。可用提供者：honcho, openviking, mem0, hindsight, holographic, retaindb, byterover, supermemory。一次只能激活一个外部提供者。内置记忆（MEMORY.md/USER.md）始终处于激活状态。

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `setup` | 交互式提供者选择和配置。 |
| `status` | 显示当前记忆提供者配置。 |
| `off` | 禁用外部提供者（仅使用内置）。 |

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
|------------|-------------|
| `serve [-v\|--verbose]` | 将 Hermes 作为 MCP 服务器运行 —— 向其他智能体暴露对话。 |
| `add <名称> [--url URL] [--command CMD] [--args ...] [--auth oauth\|header]` | 添加一个 MCP 服务器并自动发现工具。 |
| `remove <名称>`（别名：`rm`） | 从配置中移除 MCP 服务器。 |
| `list`（别名：`ls`） | 列出已配置的 MCP 服务器。 |
| `test <名称>` | 测试与 MCP 服务器的连接。 |
| `configure <名称>`（别名：`config`） | 切换服务器的工具选择。 |

参见 [MCP 配置参考](./mcp-config-reference.md)、[在 Hermes 中使用 MCP](../guides/use-mcp-with-hermes.md) 和 [MCP 服务器模式](../user-guide/features/mcp.md#running-hermes-as-an-mcp-server)。

## `hermes plugins`

```bash
hermes plugins [子命令]
```

统一的插件管理 —— 通用插件、记忆提供者和上下文引擎集中管理。不带子命令运行 `hermes plugins` 会打开一个包含两个部分的复合交互式界面：

- **通用插件** —— 多选复选框，用于启用/禁用已安装插件
- **提供者插件** —— 记忆提供者和上下文引擎的单选配置。按 ENTER 键进入类别可打开单选选择器。

| 子命令 | 描述 |
|------------|-------------|
| *（无）* | 复合交互式界面 —— 通用插件切换 + 提供者插件配置。 |
| `install <标识符> [--force]` | 从 Git URL 或 `所有者/仓库` 安装插件。 |
| `update <名称>` | 拉取已安装插件的最新更改。 |
| `remove <名称>`（别名：`rm`、`uninstall`） | 移除已安装插件。 |
| `enable <名称>` | 启用已禁用的插件。 |
| `disable <名称>` | 禁用插件而不移除它。 |
| `list`（别名：`ls`） | 列出已安装插件及其启用/禁用状态。 |

提供者插件选择会保存到 `config.yaml`：
- `memory.provider` —— 活跃的记忆提供者（空值 = 仅内置）
- `context.engine` —— 活跃的上下文引擎（`"compressor"` = 内置默认值）

通用插件禁用列表存储在 `config.yaml` 的 `plugins.disabled` 下。

参见 [插件](../user-guide/features/plugins.md) 和 [构建 Hermes 插件](../guides/build-a-hermes-plugin.md)。

## `hermes tools`

```bash
hermes tools [--summary]
```

| 选项 | 说明 |
|--------|-------------|
| `--summary` | 打印当前启用的工具摘要并退出。 |

如果不使用 `--summary`，将启动基于平台的交互式工具配置界面。

## `hermes sessions`

```bash
hermes sessions <子命令>
```

子命令：

| 子命令 | 说明 |
|------------|-------------|
| `list` | 列出最近的会话。 |
| `browse` | 带搜索和恢复功能的交互式会话选择器。 |
| `export <output> [--session-id ID]` | 将会话导出为 JSONL 格式。 |
| `delete <session-id>` | 删除一个会话。 |
| `prune` | 删除旧会话。 |
| `stats` | 显示会话存储统计信息。 |
| `rename <session-id> <title>` | 设置或更改会话标题。 |

## `hermes insights`

```bash
hermes insights [--days N] [--source platform]
```

| 选项 | 说明 |
|--------|-------------|
| `--days <n>` | 分析过去 `n` 天（默认：30）。 |
| `--source <platform>` | 按来源过滤，例如 `cli`、`telegram` 或 `discord`。 |

## `hermes claw`

```bash
hermes claw migrate [选项]
```

将您的 OpenClaw 配置迁移到 Hermes。从 `~/.openclaw`（或自定义路径）读取数据，并写入 `~/.hermes`。自动检测旧目录名称（`~/.clawdbot`、`~/.moltbot`）和配置文件名（`clawdbot.json`、`moltbot.json`）。

| 选项 | 说明 |
|--------|-------------|
| `--dry-run` | 预览将要迁移的内容，但不实际写入任何数据。 |
| `--preset <name>` | 迁移预设：`full`（所有兼容设置）或 `user-data`（排除基础设施配置）。两种预设均不会导入密钥——需显式传递 `--migrate-secrets`。 |
| `--overwrite` | 在冲突时覆盖现有的 Hermes 文件（默认：当计划存在冲突时拒绝应用）。 |
| `--migrate-secrets` | 在迁移中包含 API 密钥。即使使用 `--preset full` 也需要此选项。 |
| `--no-backup` | 跳过对 `~/.hermes/` 的迁移前 zip 快照（默认情况下，在应用前会将单个还原点存档写入 `~/.hermes/backups/pre-migration-*.zip`；可通过 `hermes import` 还原）。 |
| `--source <path>` | 自定义 OpenClaw 目录（默认：`~/.openclaw`）。 |
| `--workspace-target <path>` | 工作区指令（AGENTS.md）的目标目录。 |
| `--skill-conflict <mode>` | 处理技能名称冲突：`skip`（默认）、`overwrite` 或 `rename`。 |
| `--yes` | 跳过确认提示。 |

### 迁移内容

迁移涵盖超过 30 个类别，包括人设、记忆、技能、模型提供商、消息平台、智能体行为、会话策略、MCP 服务器、TTS 等。项目要么**直接导入**到 Hermes 的对应项中，要么**归档**以供手动审查。

**直接导入：** SOUL.md、MEMORY.md、USER.md、AGENTS.md、技能（4 个源目录）、默认模型、自定义提供商、MCP 服务器、消息平台令牌和允许列表（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost）、智能体默认设置（推理努力程度、压缩、人工延迟、时区、沙箱）、会话重置策略、审批规则、TTS 配置、浏览器设置、工具设置、执行超时、命令允许列表、网关配置以及来自 3 个来源的 API 密钥。

**归档以供手动审查：** 定时任务、插件、钩子/ webhook、记忆后端（QMD）、技能注册表配置、UI/身份、日志记录、多智能体设置、频道绑定、IDENTITY.md、TOOLS.md、HEARTBEAT.md、BOOTSTRAP.md。

**API 密钥解析**按优先级顺序检查三个来源：配置值 → `~/.openclaw/.env` → `auth-profiles.json`。所有令牌字段均支持纯字符串、环境变量模板（`${VAR}`）和 SecretRef 对象。

有关完整的配置键映射、SecretRef 处理细节和迁移后检查清单，请参阅**[完整迁移指南](../guides/migrate-from-openclaw.md)**。

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
hermes dashboard [选项]
```

启动 Web 仪表板——一个用于管理配置、API 密钥和监控会话的基于浏览器的 UI。需要 `pip install hermes-agent[web]`（FastAPI + Uvicorn）。完整文档请参阅 [Web 仪表板](/docs/user-guide/features/web-dashboard)。

| 选项 | 默认值 | 说明 |
|--------|---------|-------------|
| `--port` | `9119` | Web 服务器运行的端口 |
| `--host` | `127.0.0.1` | 绑定地址 |
| `--no-open` | — | 不自动打开浏览器 |

```bash
# 默认——在浏览器中打开 http://127.0.0.1:9119
hermes dashboard

# 自定义端口，不打开浏览器
hermes dashboard --port 8080 --no-open
```

## `hermes profile`

```bash
hermes profile <子命令>
```

管理配置文件——多个隔离的 Hermes 实例，每个实例都有自己的配置、会话、技能和主目录。

| 子命令 | 说明 |
|------------|-------------|
| `list` | 列出所有配置文件。 |
| `use <name>` | 设置一个粘性默认配置文件。 |
| `create <name> [--clone] [--clone-all] [--clone-from <source>] [--no-alias]` | 创建新配置文件。`--clone` 从活动配置文件复制配置、`.env` 和 `SOUL.md`。`--clone-all` 复制所有状态。`--clone-from` 指定源配置文件。 |
| `delete <name> [-y]` | 删除配置文件。 |
| `show <name>` | 显示配置文件详情（主目录、配置等）。 |
| `alias <name> [--remove] [--name NAME]` | 管理用于快速访问配置文件的包装脚本。 |
| `rename <old> <new>` | 重命名配置文件。 |
| `export <name> [-o FILE]` | 将配置文件导出为 `.tar.gz` 存档。 |
| `import <archive> [--name NAME]` | 从 `.tar.gz` 存档导入配置文件。 |

示例：

```bash
hermes profile list
hermes profile create work --clone
hermes profile use work
hermes profile alias work --name h-work
hermes profile export work -o work-backup.tar.gz
hermes profile import work-backup.tar.gz --name restored
hermes -p work chat -q "来自工作配置文件的问候"
```

## `hermes completion`

```bash
hermes completion [bash|zsh]
```

将 shell 补全脚本打印到标准输出。在您的 shell 配置文件中引入此输出，以实现 Hermes 命令、子命令和配置文件名称的 Tab 补全。

示例：

```bash
# Bash
hermes completion bash >> ~/.bashrc

# Zsh
hermes completion zsh >> ~/.zshrc
```

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