---
sidebar_position: 1
title: "CLI 命令参考"
description: "Hermes 终端命令及其命令族的权威参考文档"
---

# CLI 命令参考

本文档涵盖您从 shell 运行的**终端命令**。

有关聊天中的斜杠命令，请参见 [斜杠命令参考](./slash-commands.md)。

## 全局入口点

```bash
hermes [global-options] <command> [subcommand/options]
```

### 全局选项

| 选项 | 说明 |
|--------|-------------|
| `--version`, `-V` | 显示版本并退出。 |
| `--profile <name>`, `-p <name>` | 选择本次调用使用的 Hermes 配置文件。覆盖由 `hermes profile use` 设置的默认值。 |
| `--resume <session>`, `-r <session>` | 通过 ID 或标题恢复之前的会话。 |
| `--continue [name]`, `-c [name]` | 恢复最近的会话，或匹配指定标题的最近会话。 |
| `--worktree`, `-w` | 在隔离的 git worktree 中启动（适用于并行智能体工作流）。 |
| `--yolo` | 绕过危险命令的确认提示。 |
| `--pass-session-id` | 将会话 ID 包含在智能体的系统提示中。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml`，回退到内置默认值。仍会加载 `.env` 中的凭据。 |
| `--ignore-rules` | 跳过自动注入 `AGENTS.md`、`SOUL.md`、`.cursorrules`、记忆和预加载技能。 |
| `--tui` | 启动 [TUI](../user-guide/tui.md) 而非经典 CLI。等价于 `HERMES_TUI=1`。 |
| `--dev` | 配合 `--tui` 使用：直接通过 `tsx` 运行 TypeScript 源码而非预构建包（供 TUI 贡献者使用）。 |

## 顶级命令

| 命令 | 用途 |
|---------|---------|
| `hermes chat` | 与智能体进行交互式或一次性聊天。 |
| `hermes model` | 交互式选择默认提供商和模型。 |
| `hermes gateway` | 运行或管理消息网关服务。 |
| `hermes setup` | 配置的全交互式设置向导。 |
| `hermes whatsapp` | 配置并配对 WhatsApp 桥接。 |
| `hermes auth` | 管理凭据——添加、列出、删除、重置、设置策略。处理 Codex/Nous/Anthropic 的 OAuth 流程。 |
| `hermes login` / `logout` | **已弃用**——请使用 `hermes auth` 替代。 |
| `hermes status` | 显示智能体、认证和平台状态。 |
| `hermes cron` | 检查并触发定时任务调度器。 |
| `hermes webhook` | 管理用于事件驱动激活的动态 Webhook 订阅。 |
| `hermes doctor` | 诊断配置和依赖问题。 |
| `hermes dump` | 可复制粘贴的设置摘要，用于支持/调试。 |
| `hermes debug` | 调试工具——上传日志和系统信息以获取支持。 |
| `hermes backup` | 将 Hermes 主目录备份为 zip 文件。 |
| `hermes import` | 从 zip 文件恢复 Hermes 备份。 |
| `hermes logs` | 查看、跟踪和过滤智能体和网关日志文件。 |
| `hermes config` | 显示、编辑、迁移和查询配置文件。 |
| `hermes pairing` | 批准或撤销消息配对码。 |
| `hermes skills` | 浏览、安装、发布、审计和配置技能。 |
| `hermes honcho` | 管理 Honcho 跨会话记忆集成。 |
| `hermes memory` | 配置外部记忆提供者。 |
| `hermes acp` | 作为 ACP 服务器运行 Hermes，用于编辑器集成。 |
| `hermes mcp` | 管理 MCP 服务器配置，并以 MCP 服务器身份运行 Hermes。 |
| `hermes plugins` | 管理 Hermes 智能体插件（安装、启用、禁用、移除）。 |
| `hermes tools` | 按平台配置启用的工具。 |
| `hermes sessions` | 浏览、导出、清理、重命名和删除会话。 |
| `hermes insights` | 显示令牌/成本/活动分析。 |
| `hermes claw` | OpenClaw 迁移辅助工具。 |
| `hermes dashboard` | 启动用于管理配置、API 密钥和会话的 Web 仪表板。 |
| `hermes profile` | 管理配置文件——多个隔离的 Hermes 实例。 |
| `hermes completion` | 打印 Shell 补全脚本（bash/zsh）。 |
| `hermes version` | 显示版本信息。 |
| `hermes update` | 拉取最新代码并重新安装依赖项。 |
| `hermes uninstall` | 从系统中移除 Hermes。 |

## `hermes chat`

```bash
hermes chat [options]
```

常用选项：

| 选项 | 说明 |
|--------|-------------|
| `-q`, `--query "..."` | 一次性、非交互式的提示。 |
| `-m`, `--model <model>` | 覆盖本次运行的模型。 |
| `-t`, `--toolsets <csv>` | 启用逗号分隔的工具集。 |
| `--provider <provider>` | 强制指定提供者：`auto`、`openrouter`、`nous`、`openai-codex`、`copilot-acp`、`copilot`、`anthropic`、`gemini`、`google-gemini-cli`、`huggingface`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`kilocode`、`xiaomi`、`arcee`、`alibaba`、`deepseek`、`nvidia`、`ollama-cloud`、`xai`（别名 `grok`）、`qwen-oauth`、`bedrock`、`opencode-zen`、`opencode-go`、`ai-gateway`。 |
| `-s`, `--skills <name>` | 为会话预加载一个或多个技能（可重复或逗号分隔）。 |
| `-v`, `--verbose` | 详细输出。 |
| `-Q`, `--quiet` | 程序化模式：抑制横幅/旋转器和工具预览。 |
| `--image <path>` | 为单个查询附加本地图像。 |
| `--resume <session>` / `--continue [name]` | 直接从 `chat` 恢复会话。 |
| `--worktree` | 为此运行创建隔离的 git worktree。 |
| `--checkpoints` | 在破坏性文件更改前启用文件系统检查点。 |
| `--yolo` | 跳过批准提示。 |
| `--pass-session-id` | 将会话 ID 传入系统提示。 |
| `--ignore-user-config` | 忽略 `~/.hermes/config.yaml` 并使用内置默认值。仍会加载 `.env` 中的凭据。适用于隔离的 CI 运行、可重现的错误报告和第三方集成。 |
| `--ignore-rules` | 跳过自动注入 `AGENTS.md`、`SOUL.md`、`.cursorrules`、持久记忆和预加载技能。结合 `--ignore-user-config` 可实现完全隔离的运行。 |
| `--source <tag>` | 会话源标签，用于过滤（默认为 `cli`）。使用 `tool` 表示不应出现在用户会话列表中的第三方集成。 |
| `--max-turns <N>` | 每轮对话的最大工具调用迭代次数（默认为 90，或配置中的 `agent.max_turns`）。 |

示例：

```bash
hermes
hermes chat -q "总结最新的 PR"
hermes chat --provider openrouter --model anthropic/claude-sonnet-4.6
hermes chat --toolsets web,terminal,skills
hermes chat --quiet -q "仅返回 JSON"
hermes chat --worktree -q "审查此仓库并打开 PR"
hermes chat --ignore-user-config --ignore-rules -q "在不使用个人设置的情况下复现"
```

## `hermes model`

交互式提供者和模型选择器。**这是添加新提供者、设置 API 密钥和运行 OAuth 流程的命令。** 请从终端运行，而不是在活跃的 Hermes 聊天会话中运行。

```bash
hermes model
```

当您希望：
- **添加新的提供者**（OpenRouter、Anthropic、Copilot、DeepSeek、自定义等）
- 登录基于 OAuth 的提供者（Anthropic、Copilot、Codex、Nous Portal）
- 输入或更新 API 密钥
- 从提供者的特定模型列表中选择
- 配置自定义/自托管端点
- 将新默认值保存到配置时，使用此命令。

:::warning hermes model vs /model — 注意区别
**`hermes model`**（从终端运行，不在任何 Hermes 会话中）是**完整的提供者设置向导**。它可以添加新提供者、运行 OAuth 流程、提示输入 API 密钥并配置端点。

**`/model`**（在活跃的 Hermes 聊天会话中键入）只能**在您已经设置好的提供者和模型之间切换**。它不能添加新提供者、运行 OAuth 或提示输入 API 密钥。

**如果您需要添加新提供者：** 请先退出您的 Hermes 会话（`Ctrl+C` 或 `/quit`），然后从终端提示符运行 `hermes model`。
:::

### `/model` 斜杠命令（会话中）

在会话中切换已配置的模型，而无需离开会话：

```
/model                              # 显示当前模型和可用选项
/model claude-sonnet-4              # 切换模型（自动检测提供者）
/model zai:glm-5                    # 切换提供者和模型
/model custom:qwen-2.5              # 使用自定义端点上的模型
/model custom                       # 从自定义端点自动检测模型
/model custom:local:qwen-2.5        # 使用命名的自定义提供者
/model openrouter:anthropic/claude-sonnet-4  # 切换回云端
```

默认情况下，`/model` 更改仅应用于**当前会话**。添加 `--global` 可将更改保存到 `config.yaml`：

```
/model claude-sonnet-4 --global     # 切换并保存为新默认值
```

:::info 如果我只看到 OpenRouter 模型怎么办？
如果您只配置了 OpenRouter，`/model` 将只显示 OpenRouter 模型。要添加其他提供者（Anthropic、DeepSeek、Copilot 等），请先退出会话并从终端运行 `hermes model`。
:::

Provider 和基础 URL 更改会自动保存到 `config.yaml`。当切换到非自定义端点时，过时的基础 URL 会被清除，以防止其泄漏到其他提供者。

## `hermes gateway`

```bash
hermes gateway <subcommand>
```

子命令：

| 子命令 | 说明 |
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
请使用 `hermes gateway run` 而不是 `hermes gateway start`——WSL 的 systemd 支持不可靠。将其包装在 tmux 中以实现持久化：`tmux new -s hermes 'hermes gateway run'`。有关详细信息，请参见 [WSL FAQ](/docs/reference/faq#wsl-gateway-keeps-disconnecting-or-hermes-gateway-start-fails)。
:::

## `hermes setup`

```bash
hermes setup [model|tts|terminal|gateway|tools|agent] [--non-interactive] [--reset]
```

使用完整向导或跳转到某个部分：

| 部分 | 说明 |
|---------|-------------|
| `model` | 提供者和模型设置。 |
| `terminal` | 终端后端和沙箱设置。 |
| `gateway` | 消息平台设置。 |
| `tools` | 按平台启用/禁用工具。 |
| `agent` | 智能体行为设置。 |

选项：

| 选项 | 说明 |
|--------|-------------|
| `--non-interactive` | 使用默认值/环境变量而不提示。 |
| `--reset` | 在设置前将配置重置为默认值。 |

## `hermes whatsapp`

```bash
hermes whatsapp
```

运行 WhatsApp 配对/设置流程，包括模式选择和二维码配对。

## `hermes login` / `hermes logout` *(已弃用)*

:::caution
`hermes login` 已被移除。请使用 `hermes auth` 管理 OAuth 凭据，`hermes model` 选择提供者，或 `hermes setup` 进行完整的交互式设置。
:::

## `hermes auth`

管理同一提供者的凭据池，用于密钥轮换。有关完整文档，请参见 [凭据池](/docs/user-guide/features/credential-pools)。

```bash
hermes auth                                              # 交互式向导
hermes auth list                                         # 显示所有池
hermes auth list openrouter                              # 显示特定提供者
hermes auth add openrouter --api-key sk-or-v1-xxx        # 添加 API 密钥
hermes auth add anthropic --type oauth                   # 添加 OAuth 凭据
hermes auth remove openrouter 2                          # 按索引删除
hermes auth reset openrouter                             # 清除冷却时间
```

子命令：`add`、`list`、`remove`、`reset`。不带子命令调用时将启动交互式管理向导。

## `hermes status`

```bash
hermes status [--all] [--deep]
```

| 选项 | 说明 |
|--------|-------------|
| `--all` | 以可分享的脱敏格式显示所有详细信息。 |
| `--deep` | 运行可能需要更长时间但更深入的检查。 |

## `hermes cron`

```bash
hermes cron <list|create|edit|pause|resume|run|remove|status|tick>
```

| 子命令 | 说明 |
|------------|-------------|
| `list` | 显示计划任务。 |
| `create` / `add` | 从提示创建计划任务，可选地通过重复 `--skill` 附加一个或多个技能。 |
| `edit` | 更新任务的计划、提示、名称、交付、重复次数或附加技能。支持 `--clear-skills`、`--add-skill` 和 `--remove-skill`。 |
| `pause` | 暂停任务而不删除它。 |
| `resume` | 恢复暂停的任务并计算下一次运行时间。 |
| `run` | 在下一个调度器滴答上触发任务。 |
| `remove` | 删除计划任务。 |
| `status` | 检查定时任务调度器是否正在运行。 |
| `tick` | 运行到期任务一次并退出。 |

## `hermes webhook`

```bash
hermes webhook <subscribe|list|remove|test>
```

管理用于事件驱动智能体激活的动态 Webhook 订阅。需要在配置中启用 Webhook 平台——如果未配置，将打印设置说明。

| 子命令 | 说明 |
|------------|-------------|
| `subscribe` / `add` | 创建 Webhook 路由。返回要在您的服务上配置的 URL 和 HMAC 密钥。 |
| `list` / `ls` | 显示所有智能体创建的订阅。 |
| `remove` / `rm` | 删除动态订阅。来自 `config.yaml` 的静态路由不受影响。 |
| `test` | 发送测试 POST 以验证订阅是否正常工作。 |

### `hermes webhook subscribe`

```bash
hermes webhook subscribe <name> [options]
```

| 选项 | 说明 |
|--------|-------------|
| `--prompt` | 带有 `{dot.notation}` 有效负载引用的提示模板。 |
| `--events` | 接受的事件类型，逗号分隔（例如 `issues,pull_request`）。空值表示全部。 |
| `--description` | 人类可读的描述。 |
| `--skills` | 逗号分隔的技能名称，用于智能体运行。 |
| `--deliver` | 交付目标：`log`（默认）、`telegram`、`discord`、`slack`、`github_comment`。 |
| `--deliver-chat-id` | 跨平台交付的目标聊天/频道 ID。 |
| `--secret` | 自定义 HMAC 密钥。如果省略则自动生成。 |

订阅会持久保存到 `~/.hermes/webhook_subscriptions.json`，并由 Webhook 适配器热重载，无需重启网关。

## `hermes doctor`

```bash
hermes doctor [--fix]
```

| 选项 | 说明 |
|--------|-------------|
| `--fix` | 尝试自动修复（如可能）。 |

## `hermes dump`

```bash
hermes dump [--show-keys]
```

输出您的整个 Hermes 设置的紧凑纯文本摘要。设计用于在 Discord、GitHub Issues 或 Telegram 中复制粘贴以寻求支持——无 ANSI 颜色，无特殊格式，只有数据。

| 选项 | 说明 |
|--------|-------------|
| `--show-keys` | 显示脱敏的 API 密钥前缀（首尾各 4 个字符）而不是仅显示 `set`/`not set`。 |

### 包含内容

| 部分 | 详情 |
|---------|---------|
| **头部** | Hermes 版本、发布日期、git 提交哈希 |
| **环境** | OS、Python 版本、OpenAI SDK 版本 |
| **身份** | 活动配置文件名、HERMES_HOME 路径 |
| **模型** | 配置的默认模型和提供者 |
| **终端** | 后端类型（本地、docker、ssh 等） |
| **API 密钥** | 对所有 22 个提供者和工具的 API 密钥存在性检查 |
| **功能** | 启用的工具集、MCP 服务器数量、记忆提供者 |
| **服务** | 网关状态、配置的消息平台 |
| **工作负载** | 定时任务数量、已安装技能数量 |
| **配置覆盖** | 与默认值不同的任何配置值 |

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

### 使用场景

- 在 GitHub 上报告错误——将 dump 粘贴到您的 issue 中
- 在 Discord 中寻求帮助——在代码块中共享
- 与其他人的设置进行比较
- 当某些功能不工作时快速 sanity check

:::tip
`hermes dump` 专为共享而设计。对于交互式诊断，请使用 `hermes doctor`。对于可视化概览，请使用 `hermes status`。
:::

## `hermes debug`

```bash
hermes debug share [options]
```

将调试报告（系统信息和最近日志）上传到粘贴服务并获得可分享的 URL。适用于快速支持请求——包含助手诊断问题所需的所有内容。

| 选项 | 说明 |
|--------|-------------|
| `--lines <N>` | 每个日志文件包含的行数（默认：200）。 |
| `--expire <days>` | 粘贴过期天数（默认：7）。 |
| `--local` | 本地打印报告而不是上传。 |

报告包括系统信息（OS、Python 版本、Hermes 版本）、最近的智能体和网关日志（每个文件 512 KB 限制）以及脱敏的 API 密钥状态。密钥始终被脱敏——不上传任何秘密。

按顺序尝试的粘贴服务：paste.rs、dpaste.com。

### 示例

```bash
hermes debug share              # 上传调试报告，打印 URL
hermes debug share --lines 500  # 包含更多日志行
hermes debug share --expire 30  # 保留粘贴 30 天
hermes debug share --local      # 在终端打印报告（不上传）
```

## `hermes backup`

```bash
hermes backup [options]
```

创建您的 Hermes 配置、技能、会话和数据的 zip 归档。备份不包括 hermes-agent 代码库本身。

| 选项 | 说明 |
|--------|-------------|
| `-o`, `--output <path>` | zip 文件的输出路径（默认：`~/hermes-backup-<timestamp>.zip`）。 |
| `-q`, `--quick` | 快速快照：仅关键状态文件（config.yaml、state.db、.env、auth、定时任务）。比完整备份快得多。 |
| `-l`, `--label <name>` | 快照标签（仅在 `--quick` 时使用）。 |

备份使用 SQLite 的 `backup()` API 进行安全复制，因此即使 Hermes 正在运行也能正确工作（WAL 模式安全）。

### 示例

```bash
hermes backup                           # 完整备份到 ~/hermes-backup-*.zip
hermes backup -o /tmp/hermes.zip        # 完整备份到特定路径
hermes backup --quick                   # 快速状态-only 快照
hermes backup --quick --label "pre-upgrade"  # 带标签的快速快照
```

## `hermes import`

```bash
hermes import <zipfile> [options]
```

将之前创建的 Hermes 备份恢复到您的 Hermes 主目录。

| 选项 | 说明 |
|--------|-------------|
| `-f`, `--force` | 强制覆盖现有文件而不确认。 |

## `hermes logs`

```bash
hermes logs [log_name] [options]
```

查看、跟踪和过滤 Hermes 日志文件。所有日志都存储在 `~/.hermes/logs/`（或非默认配置文件时为 `<profile>/logs/`）。

### 日志文件

| 名称 | 文件 | 捕获内容 |
|------|------|-----------------|
| `agent`（默认） | `agent.log` | 所有智能体活动——API 调用、工具分派、会话生命周期（INFO 及以上） |
| `errors` | `errors.log` | 仅警告和错误——agent.log 的筛选子集 |
| `gateway` | `gateway.log` | 消息网关活动——平台连接、消息分派、Webhook 事件 |

### 选项

| 选项 | 说明 |
|--------|-------------|
| `log_name` | 要查看的日志：`agent`（默认）、`errors`、`gateway`，或 `list` 显示可用文件及其大小。 |
| `-n`, `--lines <N>` | 显示的行数（默认：50）。 |
| `-f`, `--follow` | 实时跟踪日志，类似于 `tail -f`。按 Ctrl+C 停止。 |
| `--level <LEVEL>` | 显示的最小日志级别：`DEBUG`、`INFO`、`WARNING`、`ERROR`、`CRITICAL`。 |
| `--session <ID>` | 过滤包含会话 ID 子串的行。 |
| `--since <TIME>` | 显示相对时间前的行：`30m`、`1h`、`2d` 等。支持 `s`（秒）、`m`（分钟）、`h`（小时）、`d`（天）。 |
| `--component <NAME>` | 按组件过滤：`gateway`、`agent`、`tools`、`cli`、`cron`。 |

### 示例

```bash
# 查看 agent.log 的最后 50 行（默认）
hermes logs

# 实时跟踪 agent.log
hermes logs -f

# 查看 gateway.log 的最后 100 行
hermes logs gateway -n 100

# 仅显示过去一小时的 WARNING+ 行
hermes logs --level WARNING --since 1h

# 按特定会话过滤
hermes logs --session abc123

# 从 30 分钟前开始跟踪 errors.log
hermes logs errors --since 30m -f

# 列出所有日志文件及其大小
hermes logs list
```

### 过滤

可以组合过滤器。当多个过滤器激活时，日志行必须通过**所有**过滤器才能显示：

```bash
# 过去 2 小时内包含会话 "tg-12345" 的 WARNING+ 行
hermes logs --level WARNING --since 2h --session tg-12345
```

当 `--since` 激活时，没有可解析时间戳的行将被包含（它们可能是多行日志条目的续行）。当 `--level` 激活时，没有检测到级别的行将被包含。

### 日志轮转

Hermes 使用 Python 的 `RotatingFileHandler`。旧日志会自动轮转——查找 `agent.log.1`、`agent.log.2` 等。`hermes logs list` 子命令显示所有日志文件，包括轮转的文件。

## `hermes config`

```bash
hermes config <subcommand>
```

子命令：

| 子命令 | 说明 |
|------------|-------------|
| `show` | 显示当前配置值。 |
| `edit` | 在您的编辑器中打开 `config.yaml`。 |
| `set <key> <value>` | 设置配置值。 |
| `path` | 打印配置文件路径。 |
| `env-path` | 打印 `.env` 文件路径。 |
| `check` | 检查缺失或过期的配置。 |
| `migrate` | 交互式添加新引入的选项。 |

## `hermes pairing`

```bash
hermes pairing <list|approve|revoke|clear-pending>
```

| 子命令 | 说明 |
|------------|-------------|
| `list` | 显示待处理和已批准的用戶。 |
| `approve <platform> <code>` | 批准配对码。 |
| `revoke <platform> <user-id>` | 撤销用户的访问权限。 |
| `clear-pending` | 清除待处理的配对码。 |

## `hermes skills`

```bash
hermes skills <subcommand>
```

子命令：

| 子命令 | 说明 |
|------------|-------------|
| `browse` | 技能注册表的翻页浏览器。 |
| `search` | 搜索技能注册表。 |
| `install` | 安装技能。 |
| `inspect` | 预览技能而不安装。 |
| `list` | 列出已安装的技能。 |
| `check` | 检查已安装的 hub 技能是否有上游更新。 |
| `update` | 当有可用更新时重新安装 hub 技能。 |
| `audit` | 重新扫描已安装的 hub 技能。 |
| `uninstall` | 移除 hub 安装的技能。 |
| `publish` | 将技能发布到注册表。 |
| `snapshot` | 导出/导入技能配置。 |
| `tap` | 管理自定义技能源。 |
| `config` | 交互式按平台启用/禁用技能的配置。 |

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
hermes skills check
hermes skills update
hermes skills config
```

注意：
- `--force` 可以覆盖非危险策略块，用于第三方/社区技能。
- `--force` 不会覆盖 `dangerous` 扫描判定。
- `--source skills-sh` 搜索公开的 `skills.sh` 目录。
- `--source well-known` 允许您将 Hermes 指向暴露 `/.well-known/skills/index.json` 的网站。

## `hermes honcho`

```bash
hermes honcho [--target-profile NAME] <subcommand>
```

管理 Honcho 跨会话记忆集成。此命令由 Honcho 记忆提供者插件提供，仅在您的配置中将 `memory.provider` 设置为 `honcho` 时才可用。

`--target-profile` 标志允许您在不禁用当前配置文件的情况下管理另一个配置文件的 Honcho 配置。

子命令：

| 子命令 | 说明 |
|------------|-------------|
| `setup` | 重定向到 `hermes memory setup`（统一的设置路径）。 |
| `status [--all]` | 显示当前的 Honcho 配置和连接状态。`--all` 显示跨配置文件的概览。 |
| `peers` | 显示所有配置文件中的对等身份。 |
| `sessions` | 列出已知的 Honcho 会话映射。 |
| `map [name]` | 将当前目录映射到 Honcho 会话名称。省略 `name` 列出当前映射。 |
| `peer` | 显示或更新对等名称和推理级别。选项：`--user NAME`、`--ai NAME`、`--reasoning LEVEL`。 |
| `mode [mode]` | 显示或设置回忆模式：`hybrid`、`context` 或 `tools`。省略以显示当前模式。 |
| `tokens` | 显示或设置上下文和对话推理的令牌预算。选项：`--context N`、`--dialectic N`。 |
| `identity [file] [--show]` | 播种或显示 AI 对等身份表示。 |
| `enable` | 为活动配置文件启用 Honcho。 |
| `disable` | 为活动配置文件禁用 Honcho。 |
| `sync` | 将 Honcho 配置同步到所有现有配置文件（创建缺失的主机块）。 |
| `migrate` | 从 openclaw-honcho 到 Hermes Honcho 的分步迁移指南。 |

## `hermes memory`

```bash
hermes memory <subcommand>
```

设置和管理外部记忆提供者插件。可用提供者：honcho、openviking、mem0、hindsight、holographic、retaindb、byterover、supermemory。一次只能激活一个外部提供者。内置记忆（MEMORY.md/USER.md）始终活跃。

子命令：

| 子命令 | 说明 |
|------------|-------------|
| `setup` | 交互式提供者选择和配置。 |
| `status` | 显示当前记忆提供者配置。 |
| `off` | 禁用外部提供者（仅内置）。 |

## `hermes acp`

```bash
hermes acp
```

以 ACP（Agent Client Protocol）stdio 服务器的身份启动 Hermes，用于编辑器集成。

相关入口点：

```bash
hermes-acp
python -m acp_adapter
```

首先安装支持：

```bash
pip install -e '.[acp]'
```

请参见 [ACP 编辑器集成](../user-guide/features/acp.md) 和 [ACP 内部机制](../developer-guide/acp-internals.md)。

## `hermes mcp`

```bash
hermes mcp <subcommand>
```

管理 MCP（Model Context Protocol）服务器配置，并以 MCP 服务器身份运行 Hermes。

| 子命令 | 说明 |
|------------|-------------|
| `serve [-v\|--verbose]` | 以 MCP 服务器身份运行 Hermes——向其他智能体暴露对话。 |
| `add <name> [--url URL] [--command CMD] [--args ...] [--auth oauth\|header]` | 添加具有自动工具发现的 MCP 服务器。 |
| `remove <name>`（别名：`rm`） | 从配置中移除 MCP 服务器。 |
| `list`（别名：`ls`） | 列出配置的 MCP 服务器。 |
| `test <name>` | 测试与 MCP 服务器的连接。 |
| `configure <name>`（别名：`config`） | 切换服务器的工具选择。 |

请参见 [MCP 配置参考](./mcp-config-reference.md)、[使用 MCP 与 Hermes](../guides/use-mcp-with-hermes.md) 和 [MCP 服务器模式](../user-guide/features/mcp.md#running-hermes-as-an-mcp-server)。

## `hermes plugins`

```bash
hermes plugins [subcommand]
```

统一的插件管理——通用插件、记忆提供者和上下文引擎都在一处。不带子命令运行 `hermes plugins` 会打开一个复合交互式屏幕，包含两个部分：

- **通用插件**——多选复选框以启用/禁用已安装的插件
- **提供者插件**——单选配置用于记忆提供者和上下文引擎。按 ENTER 选择一个类别以打开单选器。

| 子命令 | 说明 |
|------------|-------------|
| *(无)* | 复合交互式 UI——通用插件切换 + 提供者插件配置。 |
| `install <identifier> [--force]` | 从 Git URL 或 `owner/repo` 安装插件。 |
| `update <name>` | 拉取已安装插件的最新更改。 |
| `remove <name>`（别名：`rm`、`uninstall`） | 移除已安装的插件。 |
| `enable <name>` | 启用禁用的插件。 |
| `disable <name>` | 不移除插件的情况下禁用它。 |
| `list`（别名：`ls`） | 列出已安装插件及其启用/禁用状态。 |

提供者插件选择会保存到 `config.yaml`：
- `memory.provider`——活动记忆提供者（空 = 仅内置）
- `context.engine`——活动上下文引擎（`"compressor"` = 内置默认值）

通用插件禁用列表存储在 `config.yaml` 的 `plugins.disabled` 下。

请参见 [插件](../user-guide/features/plugins.md) 和 [构建 Hermes 插件](../guides/build-a-hermes-plugin.md)。

## `hermes tools`

```bash
hermes tools [--summary]
```

| 选项 | 说明 |
|--------|-------------|
| `--summary` | 打印当前启用的工具摘要并退出。 |

不带 `--summary` 时，这会启动交互式按平台工具配置 UI。

## `hermes sessions`

```bash
hermes sessions <subcommand>
```

子命令：

| 子命令 | 说明 |
|------------|-------------|
| `list` | 列出最近的会话。 |
| `browse` | 交互式会话选择器，带搜索和恢复功能。 |
| `export <output> [--session-id ID]` | 将会话导出为 JSONL。 |
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
| `--days <n>` | 分析最后 `n` 天（默认：30）。 |
| `--source <platform>` | 按来源过滤，如 `cli`、`telegram` 或 `discord`。 |

## `hermes claw`

```bash
hermes claw migrate [options]
```

将您的 OpenClaw 设置迁移到 Hermes。从 `~/.openclaw`（或自定义路径）读取，写入 `~/.hermes`。自动检测遗留目录名（`~/.clawdbot`、`~/.moltbot`）和配置文件名（`clawdbot.json`、`moltbot.json`）。

| 选项 | 说明 |
|--------|-------------|
| `--dry-run` | 预览迁移内容而不写入任何内容。 |
| `--preset <name>` | 迁移预设：`full`（默认，包含密钥）或 `user-data`（排除 API 密钥）。 |
| `--overwrite` | 覆盖冲突的现有 Hermes 文件（默认：跳过）。 |
| `--migrate-secrets` | 在迁移中包含 API 密钥（`--preset full` 时默认启用）。 |
| `--source <path>` | 自定义 OpenClaw 目录（默认：`~/.openclaw`）。 |
| `--workspace-target <path>` | 工作区指令（AGENTS.md）的目标目录。 |
| `--skill-conflict <mode>` | 处理技能名称冲突：`skip`（默认）、`overwrite` 或 `rename`。 |
| `--yes` | 跳过确认提示。 |

### 迁移内容

迁移涵盖 30 多个类别，包括个性、记忆、技能、模型提供者、消息平台、智能体行为、会话策略、MCP 服务器、TTS 等。项目要么**直接导入**到 Hermes 等效项，要么**存档**供手动审查。

**直接导入：** SOUL.md、MEMORY.md、USER.md、AGENTS.md、技能（4 个源目录）、默认模型、自定义提供者、MCP 服务器、消息平台令牌和白名单（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost）、智能体默认值（推理努力、压缩、人为延迟、时区、沙箱）、会话重置策略、批准规则、TTS 配置、浏览器设置、工具设置、执行超时、命令白名单、网关配置和来自 3 个来源的 API 密钥。

**存档供手动审查：** 定时任务、插件、钩子/Webhook、记忆后端（QMD）、技能注册表配置、UI/身份、日志、多智能体设置、频道绑定、IDENTITY.md、TOOLS.md、HEARTBEAT.md、BOOTSTRAP.md。

**API 密钥解析** 按优先级顺序检查三个来源：配置值 → `~/.openclaw/.env` → `auth-profiles.json`。所有令牌字段处理纯字符串、环境模板（`${VAR}`）和 SecretRef 对象。

有关完整的配置键映射、SecretRef 处理细节和迁移后检查清单，请参见 **[完整迁移指南](../guides/migrate-from-openclaw.md)**。

### 示例

```bash
# 预览将要迁移的内容
hermes claw migrate --dry-run

# 完整迁移，包含 API 密钥
hermes claw migrate --preset full

# 仅迁移用户数据（不含密钥），覆盖冲突
hermes claw migrate --preset user-data --overwrite

# 从自定义 OpenClaw 路径迁移
hermes claw migrate --source /home/user/old-openclaw
```

## `hermes dashboard`

```bash
hermes dashboard [options]
```

启动 Web 仪表板——用于管理配置、API 密钥和监控会话的基于浏览器的 UI。需要 `pip install hermes-agent[web]`（FastAPI + Uvicorn）。请参见 [Web 仪表板](/docs/user-guide/features/web-dashboard) 的完整文档。

| 选项 | 默认值 | 说明 |
|--------|---------|-------------|
| `--port` | `9119` | 运行 Web 服务器的端口 |
| `--host` | `127.0.0.1` | 绑定地址 |
| `--no-open` | — | 不自动打开浏览器 |

```bash
# 默认——打开浏览器到 http://127.0.0.1:9119
hermes dashboard

# 自定义端口，不打开浏览器
hermes dashboard --port 8080 --no-open
```

## `hermes profile`

```bash
hermes profile <subcommand>
```

管理配置文件——多个隔离的 Hermes 实例，每个实例都有自己的配置、会话、技能和主目录。

| 子命令 | 说明 |
|------------|-------------|
| `list` | 列出所有配置文件。 |
| `use <name>` | 设置粘性的默认配置文件。 |
| `create <name> [--clone] [--clone-all] [--clone-from <source>] [--no-alias]` | 创建新配置文件。`--clone` 从活动配置文件复制配置、`.env` 和 `SOUL.md`。`--clone-all` 复制所有状态。`--clone-from` 指定源配置文件。 |
| `delete <name> [-y]` | 删除配置文件。 |
| `show <name>` | 显示配置文件详情（主目录、配置等）。 |
| `alias <name> [--remove] [--name NAME]` | 管理快速配置文件访问的包装脚本。 |
| `rename <old> <new>` | 重命名配置文件。 |
| `export <name> [-o FILE]` | 将配置文件导出为 `.tar.gz` 归档。 |
| `import <archive> [--name NAME]` | 从 `.tar.gz` 归档导入配置文件。 |

示例：

```bash
hermes profile list
hermes profile create work --clone
hermes profile use work
hermes profile alias work --name h-work
hermes profile export work -o work-backup.tar.gz
hermes profile import work-backup.tar.gz --name restored
hermes -p work chat -q "Hello from work profile"
```

## `hermes completion`

```bash
hermes completion [bash|zsh]
```

将 Shell 补全脚本打印到 stdout。在您的 Shell 配置文件中源化输出以获得 Hermes 命令、子命令和配置文件名的制表符补全。

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
| `hermes uninstall [--full] [--yes]` | 从系统中移除 Hermes，可选删除所有配置/数据。 |

## 另见

- [Slash Commands Reference](./slash-commands.md)
- [CLI Interface](../user-guide/cli.md)
- [Sessions](../user-guide/sessions.md)
- [Skills System](../user-guide/features/skills.md)
- [Skins & Themes](../user-guide/features/skins.md)
