---
sidebar_position: 5
title: "定时任务（Cron）"
description: "使用自然语言安排自动化任务，通过一个 Cron 工具进行管理，并附加一个或多个技能。"
---

# 定时任务（Cron）

使用自然语言或 Cron 表达式安排任务自动运行。Hermes 通过一个具有操作式操作的 `cronjob` 工具来暴露 Cron 管理功能，而不是使用单独的调度/列表/移除工具。

## Cron 现在可以做什么

Cron 作业可以：

- 安排一次性或重复性的任务
- 暂停、恢复、编辑、触发和移除任务
- 向任务附加零个、一个或多个技能
- 将结果交付回原始聊天、本地文件或配置的平台目标
- 在新的智能体会话中运行，并使用正常的静态工具列表
- 在 **无智能体模式** 下运行——即一个按计划执行的脚本，其标准输出（stdout）被原样交付，零 LLM 参与（参见下方的 [无智能体模式](#no-agent-mode-script-only-jobs) 部分）。

所有这些功能都可通过 `cronjob` 工具提供给 Hermes 本身，因此您可以通过用普通语言提问来创建、暂停、编辑和移除任务——无需使用命令行界面（CLI）。

:::tip
在创建时，一个未固定的任务（即您没有明确指定 `provider`/`model` 的任务）将遵循由 `hermes model` 选择的全局默认值——而 Hermes 会在任务上**快照**该提供商和模型。如果全局默认值稍后发生变化，该任务将**安全失败**：它会跳过运行，不会进行任何推理调用，并发送一个警报，告诉您需要明确固定（`cronjob action=update job_id=… provider=… model=…`）提供商/模型才能继续。这可以防止一个无人看管的任务静默地继承切换到付费的提供商/模型并花费您不打算花的钱 (#44585)。要让任务故意跟踪您的全局默认值，请在更改后将其固定到新值上。由于 OAuth 刷新是自动的，`hermes setup --portal` 是无人运行的最佳低摩擦选项。参见 [Nous Portal](/integrations/nous-portal)。
:::

:::warning
Cron 运行会话不能递归创建更多的 Cron 任务。Hermes 会在 Cron 执行内部禁用 Cron 管理工具，以防止失控的调度循环。
:::

## 创建定时任务

### 在聊天中使用 `/cron`

```bash
/cron add 30m "Remind me to check the build"
/cron add "every 2h" "Check server status"
/cron add "every 1h" "Summarize new feed items" --skill blogwatcher
/cron add "every 1h" "Use both skills and combine the result" --skill blogwatcher --skill maps
```

### 从独立的 CLI 使用

```bash
hermes cron create "every 2h" "Check server status"
hermes cron create "every 1h" "Summarize new feed items" --skill blogwatcher
hermes cron create "every 1h" "Use both skills and combine the result" \
  --skill blogwatcher \
  --skill maps \
  --name "Skill combo"
```

### 通过自然对话

正常提问 Hermes：

```text
Every morning at 9am, check Hacker News for AI news and send me a summary on Telegram.
```

Hermes 会在内部使用统一的 `cronjob` 工具。

## 基于技能的定时任务

Cron 任务在运行提示词之前可以加载一个或多个技能。

### 单一技能

```python
cronjob(
    action="create",
    skill="blogwatcher",
    prompt="Check the configured feeds and summarize anything new.",
    schedule="0 9 * * *",
    name="Morning feeds",
)
```

### 多个技能

技能是按顺序加载的。提示词成为叠加在这些技能之上的任务指令。

```python
cronjob(
    action="create",
    skills=["blogwatcher", "maps"],
    prompt="Look for new local events and interesting nearby places, then combine them into one short brief.",
    schedule="every 6h",
    name="Local brief",
)
```

当您希望一个定时任务（agent）继承可重用工作流程，而无需将完整的技能文本塞入 cron 提示词本身时，这会非常有用。

## 在项目目录内运行任务

Cron 任务默认是脱离任何仓库运行的——不会加载 `AGENTS.md`、`CLAUDE.md` 或 `.cursorrules`，终端/文件/代码执行工具将从网关启动时的工作目录运行。通过传递 `--workdir` (CLI) 或 `workdir=` (工具调用) 来更改这一点：

```bash
# 独立的 CLI（schedule 和 prompt 是位置参数）
hermes cron create "every 1d at 09:00" \
  "Audit open PRs, summarize CI health, and post to #eng" \
  --workdir /home/me/projects/acme
```

```python
# 通过聊天，使用 cronjob 工具
cronjob(
    action="create",
    schedule="every 1d at 09:00",
    workdir="/home/me/projects/acme",
    prompt="Audit open PRs, summarize CI health, and post to #eng",
)
```

当设置了 `workdir` 时：

- 从该目录中获取的 `AGENTS.md`、`CLAUDE.md` 和 `.cursorrules` 会被注入到系统提示词中（与交互式 CLI 相同的发现顺序）。
- `terminal`、`read_file`、`write_file`、`patch`、`search_files` 和 `execute_code` 都使用该目录作为其工作目录。
- 该路径必须是一个存在的绝对目录——相对路径和缺失的目录会在创建/更新时被拒绝。
- 在编辑时，传递 `--workdir ""` (或通过工具调用 `workdir=""`) 来清除它并恢复旧行为。

:::note Serialization
带有 `workdir` 的任务在调度器滴答（tick）时按顺序运行，而不是在并行池中运行。这是故意的：cron 工作进程通过进程全局终端状态应用工作目录，因此两个同时运行的工作目录任务可能会相互损坏 cwd。没有工作目录的任务仍然像以前一样并行运行。
:::

## 编辑任务

您无需删除并重新创建任务来更改它们。

:::tip Job reference
下面的 `<job_id>` 占位符（以及 [Lifecycle actions](#lifecycle-actions) 中的内容）也接受任务的名称（不区分大小写）——当您记得 `morning-digest` 但不记得十六进制 ID 时，这非常方便。精确的任务 ID 优先于名称匹配；如果引用不是 ID 并且有多个任务匹配名称，命令将拒绝执行并打印候选 ID，以便您可以进行区分。名称并非唯一，因此这个保护机制至关重要——它防止了在两个任务共享同一名称时静默地修改错误的任务。
:::

### 聊天

```bash
/cron edit <job_id> --schedule "every 4h"
/cron edit <job_id> --prompt "Use the revised task"
/cron edit <job_id> --skill blogwatcher --skill maps
/cron edit <job_id> --remove-skill blogwatcher
/cron edit <job_id> --clear-skills
```

### 独立的 CLI

```bash
hermes cron edit <job_id> --schedule "every 4h"
hermes cron edit <job_id> --prompt "Use the revised task"
hermes cron edit <job_id> --skill blogwatcher --skill maps
hermes cron edit <job_id> --add-skill maps
hermes cron edit <job_id> --remove-skill blogwatcher
hermes cron edit <job_id> --clear-skills
```

注意事项：

- 重复使用的 `--skill` 会替换任务所附带的技能列表。
- `--add-skill` 会追加到现有列表，而不是替换它。
- `--remove-skill` 会移除特定的附带技能。
- `--clear-skills` 会移除所有附带技能。

## 生命周期操作

Cron 任务现在具有比创建/删除更完整的生命周期。

### 聊天

```bash
/cron list
/cron pause <job_id>
/cron resume <job_id>
/cron run <job_id>
/cron remove <job_id>
```

### 独立的 CLI

```bash
hermes cron list
hermes cron pause <job_id_or_name>
hermes cron resume <job_id_or_name>
hermes cron run <job_id_or_name>
hermes cron remove <job_id_or_name>
hermes cron edit <job_id_or_name> [...flags]
hermes cron status
hermes cron tick
```

它们的功能：

- `pause` — 保留任务，但停止调度它。
- `resume` — 重新启用任务并计算下一次运行时间。
- `run` — 在下一个调度器滴答时触发任务。
- `remove` — 完全删除它。
- `edit` — 修改日程、提示词、交付方式等。

**基于名称的查找。** 所有四个可变动动词（`pause`、`resume`、`run`、`remove`、`edit`）以及智能体（agent）的 `cronjob` 工具现在都接受任务的**名称**（不区分大小写），而不是十六进制 ID。智能体和 CLI 都更喜欢精确的 ID 匹配，如果存在的话；模糊的名称匹配（多个任务共享相同的名称）将被拒绝，并会显示所有候选 ID，以便您可以明确选择一个。名称并非唯一，因此这个保护机制至关重要——它防止了在两个任务共享同一名称时静默地修改错误的任务。

## 工作原理

**Cron 执行由网关守护进程（gateway daemon）处理。** 网关每 60 秒滴答一次调度器，并在隔离的智能体会话中运行所有到期的任务。

```bash
hermes gateway install     # 作为用户服务安装
sudo hermes gateway install --system   # Linux：用于服务器的启动时系统服务
hermes gateway             # 或在前台运行

hermes cron list
hermes cron status
```

### 网关调度器行为

在每次滴答（tick）中，Hermes 会执行以下操作：

1. 从 `~/.hermes/cron/jobs.json` 加载任务。
2. 将 `next_run_at` 与当前时间进行比对。
3. 为每个到期的任务启动一个新的 `AIAgent` 会话。
4. 可选地将一个或多个附带技能注入到该新会话中。
5. 运行提示词直到完成。
6. 交付最终响应。
7. 更新运行元数据和下一次计划时间。

位于 `~/.hermes/cron/.tick.lock` 的文件锁可以防止重叠的调度器滴答导致同一批任务重复运行。

## 交付选项

在安排任务时，您需要指定输出去向：

| Option | Description | Example |
|--------|-------------|---------|
| `"origin"` | 返回到创建该任务的地方 | 消息平台上的默认设置 |
| `"local"` | 仅保存到本地文件（`~/.hermes/cron/output/`） | CLI 上的默认设置 |
| `"telegram"` | Telegram 主频道 | 使用 `TELEGRAM_HOME_CHANNEL` |
| `"telegram:123456"` | 特定 ID 的 Telegram 聊天 | 直接交付 |
| `"telegram:-100123:17585"` | 特定 Telegram 主题 | `chat_id:thread_id` 格式 |
| `"discord"` | Discord 主频道 | 使用 `DISCORD_HOME_CHANNEL` |
| `"discord:#engineering"` | 特定 Discord 频道 | 按频道名称 |
| `"slack"` | Slack 主频道 | |
| `"whatsapp"` | WhatsApp 主频道 | |
| `"signal"` | Signal | |
| `"matrix"` | Matrix 主房间 | |
| `"mattermost"` | Mattermost 主频道 | |
| `"email"` | 电子邮件 | |
| `"sms"` | 通过 Twilio 的 SMS | |
| `"homeassistant"` | Home Assistant | |
| `"dingtalk"` | DingTalk | |
| `"feishu"` | Feishu/Lark | |
| `"wecom"` | WeCom | |
| `"weixin"` | Weixin (WeChat) | |
| `"bluebubbles"` | BlueBubbles (iMessage) | |
| `"qqbot"` | QQ Bot (Tencent QQ) | |
| `"all"` | 分发到所有已连接的主频道 | 在触发时解析 |
| `"telegram,discord"` | 分发到特定的一组频道 | 逗号分隔列表 |
| `"origin,all"` | 交付给源头**以及**所有其他已连接的频道 | 组合任何令牌 |

智能体（agent）的最终响应会自动交付。您不需要在 cron 提示词中调用 `send_message`。

### 路由意图 (`all`)

`all` 允许您将一个 cron 任务发送到所有已配置的消息频道，而无需按名称枚举它们。它是在**触发时解析**的，因此在一个您设置了 `TELEGRAM_HOME_CHANNEL` 之前的创建的任务，将在您设置该变量后的下一个滴答中捕获 Telegram。

语义：`all` 会扩展为具有配置主频道的每个平台。零（0）是可接受的；任务只需不产生任何交付目标，并被记录为上游的交付失败。

`all` 可以与显式目标组合使用。`origin,all` 交付到源聊天*以及*所有其他已连接的主频道，通过 `(platform, chat_id, thread_id)` 进行去重。

### Telegram cron 主题 (`TELEGRAM_CRON_THREAD_ID`)

当启用 Telegram 主题模式时，根 DM 被保留为系统大厅——发送到那里的回复会被一个大厅提醒拒绝，并且 `reply_to_message_id` 会被丢弃，因此您无法回复到一个落入主聊天的 cron 消息。

请改将任务指向一个专用的论坛主题：

1. 在 Telegram 中，打开机器人 DM 并创建一个名为例如 `Cron` 的主题。长按主题标题 → **复制链接**；末尾的整数是该主题的 `message_thread_id`。
2. 在您的 `.env` 文件中设置 `TELEGRAM_CRON_THREAD_ID=<that id>`。

这仅适用于 cron 交付。`TELEGRAM_HOME_CHANNEL_THREAD_ID`（在其他地方使用，例如重启通知）保持不变。显式的 `deliver="telegram:chat_id:thread_id"` 目标仍然具有优先权。对 cron 消息的回复现在会到达现有的主题会话中，因此您可以直接处理它们。

### 响应包装

默认情况下，交付的 cron 输出会被一个头部和尾部包裹起来，以便接收者知道它来自一个定时任务：

```
Cronjob Response: Morning feeds
-------------

<agent output here>

Note: The agent cannot see this message, and therefore cannot respond to it.
```

要交付原始的智能体输出而不带包装器，请将 `cron.wrap_response` 设置为 `false`：

```yaml
# ~/.hermes/config.yaml
cron:
  wrap_response: false
```

### 可续接的任务（回复 cron 交付）

默认情况下，cron 交付是“发送即忘”（fire-and-forget）：消息被发送了，但它不保存在聊天的对话历史中，因此如果您回复它，智能体就不知道它说了什么。设置一个**可续接**的任务，交付的简报就会成为您可以回复的内容——智能体将拥有上下文，而不是询问“任务 #2 是什么？”。

选择加入，**默认关闭**。可以在配置中全局启用，或通过 `cronjob` 工具的 `attach_to_session`（它会覆盖该单个任务的全局设置）进行按任务启用：

```yaml
# ~/.hermes/config.yaml
cron:
  mirror_delivery: false   # 设置为 true 可使 cron 交付可续接
```

行为是**线程优先**的，范围限定于任务的源聊天：

- **支持主题的平台**（Telegram 主题、Discord/Slack 线程）：每次交付都会打开一个专用的线程，简报会被播种到该线程的会话中，因此在线程内回复可以保持完整的上下文。一个重复的任务（例如每日简报）会在每次运行时打开一个新的线程，使每一次交付的后续讨论保持隔离。
- **仅支持 DM 的平台**（WhatsApp、Signal、SMS）：不存在线程，因此简报会被镜像到源 DM 会话中——DM 本身就是续接表面。

只有源聊天会被触及：扇出/广播目标（`all`、显式的其他聊天交付）永远不会被设置为可续接。镜像内容以一个带标签的用户回合（`[Cron delivery: <task name>]`）形式写入，这使得对话历史在所有模型提供商之间保持安全。

### 静默抑制

如果智能体的最终响应包含 `[SILENT]`，则交付将被完全抑制。输出仍然会保存在本地进行审计（在 `~/.hermes/cron/output/` 中），但不会向交付目标发送任何消息。

这对于仅应报告错误情况的任务非常有用：

```text
检查 nginx 是否正在运行。如果一切正常，只回复 [SILENT]。
否则，报告问题。
```

失败的任务无论是否包含 `[SILENT]` 标记都会总是交付——只有成功的运行才能被静音。对于安静的监控任务，请提示智能体在没有需要报告时只回复 `[SILENT]`。

## 脚本超时

通过 `script` 参数附加的预运行脚本默认超时时间为 120 秒。如果您的脚本需要更长的时间——例如，为了包含避免机器人式定时模式的随机延迟——您可以增加此值：

```yaml
# ~/.hermes/config.yaml
cron:
  script_timeout_seconds: 300   # 5 minutes
```

或者设置 `HERMES_CRON_SCRIPT_TIMEOUT` 环境变量。解析顺序为：环境变量 → config.yaml → 120秒默认值。

## 无智能体模式（脚本专用任务）

对于不需要 LLM 推理的重复性任务——经典的看门狗、磁盘/内存警报、心跳、CI ping——请在创建时传入 `no_agent=True`。调度器会按计划运行您的脚本并直接交付其标准输出（stdout），完全跳过智能体：

```bash
hermes cron create "every 5m" \
  --no-agent \
  --script memory-watchdog.sh \
  --deliver telegram \
  --name "memory-watchdog"
```

语义说明：

- 脚本标准输出（已修剪）→ 作为消息原样交付。
- **空标准输出 → 静默滴答**，不进行交付。这是看门狗模式：“只有出问题时才说些什么”。
- 非零退出或超时→ 会发送错误警报，因此一个损坏的看门狗不能静默失败。
- 最后一行有 `{"wakeAgent": false}` → 静默滴答（与 LLM 任务使用的同一机制）。
- 没有 token，没有模型，没有提供商回退——该任务永远不会触及推理层。

`.sh` / `.bash` 文件在 `/bin/bash` 下运行；其他文件则在当前的 Python 解释器（`sys.executable`）下运行。脚本必须位于 `~/.hermes/scripts/` 下（与预运行脚本的沙箱规则相同）。

### 智能体为您设置这些内容

`cronjob` 工具的模式将 `no_agent` 直接暴露给 Hermes，因此您可以在聊天中描述一个看门狗，然后让智能体进行配置：

```text
Ping me on Telegram if RAM is over 85%, every 5 minutes.
```

Hermes 将通过 `write_file` 将检查脚本写入 `~/.hermes/scripts/`，然后调用：

```python
cronjob(action="create", schedule="every 5m",
        script="memory-watchdog.sh", no_agent=True,
        deliver="telegram", name="memory-watchdog")
```

当消息内容完全由脚本确定时（看门狗、阈值警报、心跳），它会自动选择 `no_agent=True`。该工具还允许智能体暂停、恢复、编辑和删除任务——因此整个生命周期都是由聊天驱动的，而无需任何人操作命令行界面（CLI）。

请参阅 [脚本专用定时任务指南](/guides/cron-script-only) 以获取示例。

## 使用 `context_from` 进行任务链式调用

Cron 作业在隔离的会话中运行，不会记住以前的运行记录。但有时一个作业的输出恰好是下一个作业所需要的。`context_from` 参数会自动建立这种连接——Job B 的提示词会在运行时自动加上 Job A 最新的输出作为上下文。

```python
# Job 1: 收集原始数据
cronjob(
    action="create",
    prompt="从 Hacker News 获取排名前 10 的 AI/ML 故事。将它们保存到 ~/.hermes/data/briefs/raw.md，使用 markdown 格式，包含标题、URL 和评分。",
    schedule="0 7 * * *",
    name="AI 新闻收集器",
)

# Job 2: 分类 — 以 Job 1 的输出作为上下文
# 从 cronjob(action="list") 获取 Job 1 的 ID
cronjob(
    action="create",
    prompt="读取 ~/.hermes/data/briefs/raw.md。为每个故事评分 1-10，评估其参与度和新颖性。将排名前 5 的结果输出到 ~/.hermes/data/briefs/ranked.md。",
    schedule="30 7 * * *",
    context_from="<job1_id>",
    name="AI 新闻分类",
)

# Job 3: 发送 — 以 Job 2 的输出作为上下文
cronjob(
    action="create",
    prompt="读取 ~/.hermes/data/briefs/ranked.md。撰写 3 个推文草稿（钩子 + 正文 + 标签）。发送到 telegram:7976161601。",
    schedule="0 8 * * *",
    context_from="<job2_id>",
    name="AI 新闻简报",
)
```

**工作原理：**

- 当 Job 2 触发时，Hermes 会从 `~/.hermes/cron/output/{job1_id}/*.md` 读取 Job 1 最新的输出。
- 该输出会自动附加到 Job 2 的提示词中。
- Job 2 无需硬编码“读取此文件”——它会接收内容作为上下文。
- 链条的长度可以是任意的：Job 1 → Job 2 → Job 3 → ...

**`context_from` 支持的格式：**

| 格式 | 示例 |
|--------|---------|
| 单个作业 ID (字符串) | `context_from="a1b2c3d4"` |
| 多个作业 ID (列表) | `context_from=["job_a", "job_b"]` |

输出将按列出的顺序连接起来。

**何时使用：**

- 多阶段管道（收集 → 过滤 → 格式化 → 发送）
- 依赖任务，其中步骤 N 的工作取决于步骤 N−1 的输出
- 分布式/集中式模式，即一个作业从多个其他作业中聚合结果

## 提供者恢复机制

Cron 作业会继承你配置的备用提供者和凭证池轮换。如果主 API 密钥被限速或提供者返回错误，cron **智能体**可以：

- 如果你在 `config.yaml` 中配置了 `fallback_providers`（或旧版的 `fallback_model`），则**回退到另一个提供者**
- 对于同一提供者的凭证，**轮换到下一个凭证** [凭证池](/user-guide/configuration#credential-pool-strategies)

这意味着高频率运行或在高峰时段运行的 cron 作业具有更高的弹性——单个被限速的密钥不会导致整个运行失败。

## 调度格式

**智能体**的最终回复会自动发送——你不需要在 cron 提示词中包含 `send_message`，使其发送到相同的目标。如果一次 cron 运行调用了 `send_message` 发送到调度器将要发送的精确目标，Hermes 会跳过这次重复发送，并指示模型将面向用户的内容放入最终回复中。请仅在需要额外的或不同的目标时才使用 `send_message`。

### 相对延迟（一次性）

```text
30m     → 运行一次，间隔 30 分钟
2h      → 运行一次，间隔 2 小时
1d      → 运行一次，间隔 1 天
```

### 间隔（重复性）

```text
every 30m    → 每 30 分钟运行一次
every 2h     → 每 2 小时运行一次
every 1d     → 每天运行一次
```

### Cron 表达式

```text
0 9 * * *       → 每日上午 9:00 运行
0 9 * * 1-5     → 工作日（周一到周五）上午 9:00 运行
0 */6 * * *     → 每 6 小时运行一次
30 8 1 * *      → 每月的第一天上午 8:30 运行
0 0 * * 0       → 每周日午夜运行
```

### ISO 时间戳

```text
2026-03-15T09:00:00    → 一次性运行，在 2026 年 3 月 15 日上午 9:00
```

## 重复行为

| 调度类型 | 默认重复次数 | 行为 |
|--------------|----------------|----------|
| 一次性（`30m`，时间戳） | 1 | 只运行一次 |
| 间隔式（`every 2h`） | 永远 | 持续运行直到被移除 |
| Cron 表达式 | 永远 | 持续运行直到被移除 |

你可以进行覆盖：

```python
cronjob(
    action="create",
    prompt="...",
    schedule="every 2h",
    repeat=5,
)
```

## 编程管理作业

面向 **智能体** 的 API 是其中一种工具：

```python
cronjob(action="create", ...)
cronjob(action="list")
cronjob(action="update", job_id="...")
cronjob(action="pause", job_id="...")
cronjob(action="resume", job_id="...")
cronjob(action="run", job_id="...")
cronjob(action="remove", job_id="...")
```

对于 `update` 操作，请传入 `skills=[]` 以移除所有已附加的技能。

## 可用于 Cron 作业的工具集

Cron 运行每次作业时都处于一个全新的 **智能体** 会话中，并且没有聊天平台附着。默认情况下，cron **智能体** 会获得你在 `hermes tools` 中为 `cron` 平台配置的工具集——而不是 CLI 的默认设置，也不是所有东西。

```bash
hermes tools
# → 在 curses UI 中选择 "cron" 平台
# → 像你为 Telegram/Discord 等所做的那样，开启/关闭工具集。
```

可以通过 `cronjob.create`（或通过 `cronjob.update` 对现有作业）上的 `enabled_toolsets` 字段进行更精细的单次作业控制：

```text
cronjob(action="create", name="weekly-news-summary",
        schedule="every sunday 9am",
        enabled_toolsets=["web", "file"],      # 仅 web + file，不包括 terminal/browser 等。
        prompt="总结本周的 AI 新闻：...")
```

如果设置了 `enabled_toolsets`，它将优先；否则，`hermes tools` 的 cron 平台配置将生效；否则，Hermes 将回退到内置默认值。这对于成本控制很重要：将 `browser`、`delegation` 等包含进每一个微小的“获取新闻”作业都会使 LLM 调用中的工具模式提示词变得臃肿。

### 完全跳过智能体：`wakeAgent`

如果你的 cron 作业附带了一个预检查脚本（通过 `script=`），该脚本可以在运行时决定 Hermes 是否应该调用 **智能体**。发出一个格式为以下内容的最终 stdout 行：

```text
{"wakeAgent": false}
```

……然后 cron 会跳过本次的 **智能体** 运行。这对于需要唤醒 LLM 而不是持续进行零内容型 **智能体** 轮次的频繁轮询（每 1-5 分钟）非常有用——否则你会为这些零内容型的 **智能体** 轮次付费。

```python
# 预检查脚本
import json, sys
latest = fetch_latest_issue_count()
prev = read_state("issue_count")
if latest == prev:
    print(json.dumps({"wakeAgent": False}))   # 跳过本次 tick
    sys.exit(0)
write_state("issue_count", latest)
print(json.dumps({"wakeAgent": True, "context": {"new_issues": latest - prev}}))
```

当省略 `wakeAgent` 时，默认值是 `true`（照常唤醒 **智能体**）。

#### 廉价的预运行门控方案

`wakeAgent` 门控机制提供了一种 $0 的方式来决定一个计划作业是否需要消耗任何 LLM token。以下三种模式涵盖了大多数用例。

**文件更改门控** — 仅当被监控的文件自上次成功的 tick 以来有新内容时才运行。调度器会记录每个作业的 `last_run_at`；将其与文件的 mtime 进行比较。

```bash
#!/bin/bash
# ~/.hermes/scripts/feed-changed.sh
FEED="$HOME/data/feed.json"
STATE="$HOME/.hermes/scripts/.feed-changed.last"
test -f "$FEED" || { echo '{"wakeAgent": false}'; exit 0; }
mtime=$(stat -c %Y "$FEED")
last=$(cat "$STATE" 2>/dev/null || echo 0)
if [ "$mtime" -le "$last" ]; then
  echo '{"wakeAgent": false}'
else
  echo "$mtime" > "$STATE"
  echo '{"wakeAgent": true}'
fi
```

```text
cronjob(action="create", name="process-feed",
        schedule="every 30m",
        script="feed-changed.sh",
        prompt="一个新的 ~/data/feed.json 文件已到达。总结一下变化内容。")
```

**外部标志门控** — 仅当其他进程发出就绪信号时才运行（例如，一个部署钩子投递文件，一个 CI 作业在状态存储中设置了一个值）。

```bash
#!/bin/bash
# ~/.hermes/scripts/flag-ready.sh
if test -f /tmp/new-data-ready; then
  rm -f /tmp/new-data-ready
  echo '{"wakeAgent": true}'
else
  echo '{"wakeAgent": false}'
fi
```

```text
cronjob(action="create", name="nightly-analysis",
        schedule="0 9 * * *",
        script="flag-ready.sh",
        prompt="对今天的批次运行夜间分析。")
```

**SQL 计数门控** — 仅当数据库中有新行需要处理时才运行。脚本还可以通过 `context` 将计数传递给 **智能体**，这样 **智能体** 在无需重新查询的情况下就知道自己正在查看多少内容。

```python
#!/usr/bin/env python
# ~/.hermes/scripts/new-rows.py
import json, sqlite3
conn = sqlite3.connect("/home/me/data/app.db")
n = conn.execute(
    "SELECT COUNT(*) FROM messages WHERE ts > strftime('%s','now','-2 hours')"
).fetchone()[0]
if n < 1:
    print(json.dumps({"wakeAgent": False}))
else:
    print(json.dumps({"wakeAgent": True, "context": {"new_rows": n}}))
```

```text
cronjob(action="create", name="summarize-new-msgs",
        schedule="every 2h",
        script="new-rows.py",
        prompt="总结过去 2 小时内的新消息。")
```

相同的模式适用于任何你可以从脚本查询的数据源——Postgres、HTTP API、你自己的状态存储——而无需将 SQL 评估器烘焙到 cron 子系统中。

:::tip
Hermes 自身的 `~/.hermes/state.db` 是一个内部模式，不同版本之间可能会发生变化。不要从预运行门控中查询它——请指向你自己的数据库或数据源。
:::

鸣谢：这套方案是 @iankar8 在 [#2654](https://github.com/NousResearch/hermes-agent/pull/2654) 中的探索所启发，该 PR 提出了将 SQL/文件/命令触发器作为一种并行机制添加。`script` + `wakeAgent` 门控已经涵盖了所有三种情况，并且成本为 $0，因此工作成果以文档形式交付。

### 任务链式调用：`context_from`

cron 作业可以通过在 `context_from` 中列出其他一个或多个作业的名称（或 ID）来消耗它们最近一次成功的输出：

```text
cronjob(action="create", name="daily-digest",
        schedule="every day 7am",
        context_from=["ai-news-fetch", "github-prs-fetch"],
        prompt="使用上述输出撰写每日简报。")
```

被引用的作业的最近一次完成输出会被注入到提示词上方作为本次运行的上下文。每个上游条目都必须是一个有效的作业 ID 或名称（参见 `cronjob action="list"`）。注意：链式调用读取的是**最近一次已完成**的输出——它不会等待在同一 tick 中正在运行的上游作业。
## 作业存储

作业存储在 `~/.hermes/cron/jobs.json` 中。作业运行的输出保存在 `~/.hermes/cron/output/{job_id}/{timestamp}.md` 中。

作业中可能包含 `model` 和 `provider` 为 `null` 的情况。当这些字段被省略时，Hermes 会在执行时从全局配置中解析它们。只有当设置了单次作业覆盖时，它们才会出现在作业记录中。

存储使用原子文件写入，以确保中断的写入不会留下部分完成的作业文件。

## 自包含提示词仍然重要

:::warning 重要
Cron 作业在一个完全全新的 **智能体** 会话中运行。提示词必须包含 **智能体** 所需的一切信息，而这些信息尚未由附加的技能提供。
:::

**错误示例：** "检查一下那个服务器问题"

**正确示例：** "SSH 登录到 192.168.1.100 服务器，以 'deploy' 用户身份，检查 nginx 是否正在运行（使用 'systemctl status nginx'），并验证 https://example.com 返回 HTTP 200。"

## 安全性

定时任务提示词在创建和更新时都会被扫描是否存在提示注入和凭证泄露模式。包含隐形 Unicode 技巧、SSH 后门尝试或明显的秘密泄露载荷的提示词将被阻止。