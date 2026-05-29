---
sidebar_position: 5
title: "计划任务（定时作业）"
description: "通过自然语言安排自动化任务，使用单一的定时作业工具进行管理，并可附加一项或多项技能"
---

# 计划任务（定时作业）

通过自然语言或定时表达式安排任务自动运行。Hermes 通过一个单一的 `cronjob` 工具，以操作式指令来管理定时作业，而非使用独立的计划/列表/移除工具。

## 定时作业目前的功能

定时作业可以：

- 安排一次性或重复性任务
- 暂停、恢复、编辑、触发和移除作业
- 为作业附加零项、一项或多项技能
- 将结果传送回原始对话、本地文件或已配置的平台目标
- 在包含常规静态工具列表的全新智能体会话中运行
- 以 **无智能体模式** 运行 —— 一个按计划运行的脚本，其标准输出按原样传送，无需任何大语言模型参与（请参阅下方的[无智能体模式（仅脚本任务）](#无智能体模式（仅脚本任务）)部分）

所有这些功能均可由 Hermes 自身通过 `cronjob` 工具实现，因此您只需用自然语言提问即可创建、暂停、编辑和移除作业 —— 无需命令行界面。

:::tip
定时作业使用 `hermes model` 选定的任何提供商。`hermes setup --portal` 对于无人值守运行是最低阻力的选项，因为 OAuth 刷新是自动的。详见 [Nous Portal](/integrations/nous-portal)。
:::

:::warning
定时作业运行的会话无法递归地创建更多定时作业。Hermes 会在定时作业执行期间禁用定时作业管理工具，以防止产生失控的调度循环。
:::

## 创建定时任务

### 在聊天中使用 `/cron` 命令

```bash
/cron add 30m "提醒我检查构建"
/cron add "每2小时" "检查服务器状态"
/cron add "每1小时" "总结新的订阅源条目" --skill blogwatcher
/cron add "每1小时" "同时使用两个技能并合并结果" --skill blogwatcher --skill maps
```

### 通过独立命令行

```bash
hermes cron create "每2小时" "检查服务器状态"
hermes cron create "每1小时" "总结新的订阅源条目" --skill blogwatcher
hermes cron create "每1小时" "同时使用两个技能并合并结果" \
  --skill blogwatcher \
  --skill maps \
  --name "技能组合"
```

### 通过自然对话

直接向 Hermes 提出要求：

```text
每天早上9点，检查 Hacker News 上的 AI 新闻，并将摘要发送到我的 Telegram。
```

Hermes 会在内部统一使用 `cronjob` 工具。

## 基于技能的定时任务

一个定时任务在运行提示词前可以加载一个或多个技能。

### 单个技能

```python
cronjob(
    action="create",
    skill="blogwatcher",
    prompt="检查已配置的订阅源并总结任何新内容。",
    schedule="0 9 * * *",
    name="晨间订阅",
)
```

### 多个技能

技能按顺序加载。提示词成为叠加在这些技能之上的任务指令。

```python
cronjob(
    action="create",
    skills=["blogwatcher", "maps"],
    prompt="寻找新的本地活动和附近有趣的地方，然后将它们合并成一份简短的简报。",
    schedule="every 6h",
    name="本地简报",
)
```

当你想让一个定时智能体继承可重用的工作流，而不必将完整的技能文本塞入定时任务提示词本身时，这非常有用。

## 在项目目录中运行任务

定时任务默认与任何代码仓库分离运行——不加载 `AGENTS.md`、`CLAUDE.md` 或 `.cursorrules`，且终端/文件/代码执行工具在网关启动时的工作目录下运行。传递 `--workdir`（CLI）或 `workdir=`（工具调用）可以更改此行为：

```bash
# 独立 CLI (schedule 和 prompt 是位置参数)
hermes cron create "每天 09:00" \
  "审计待处理的 PR，总结 CI 健康状况，并发布到 #eng 频道" \
  --workdir /home/me/projects/acme
```

```python
# 在聊天中，通过 cronjob 工具
cronjob(
    action="create",
    schedule="every 1d at 09:00",
    workdir="/home/me/projects/acme",
    prompt="审计待处理的 PR，总结 CI 健康状况，并发布到 #eng 频道",
)
```

当设置 `workdir` 后：

- 该目录下的 `AGENTS.md`、`CLAUDE.md` 和 `.cursorrules` 会被注入到系统提示词中（发现顺序与交互式 CLI 相同）
- `terminal`、`read_file`、`write_file`、`patch`、`search_files` 和 `execute_code` 都使用该目录作为工作目录（通过 `TERMINAL_CWD`）
- 该路径必须是一个存在的绝对目录——相对路径和缺失的目录在创建/更新时会被拒绝
- 编辑时传递 `--workdir ""`（或通过工具传递 `workdir=""`）可以清除它并恢复旧行为

:::note 序列化
带有 `workdir` 的任务在调度器节拍时会顺序运行，而非在并行池中运行。这是故意的——`TERMINAL_CWD` 是进程全局的，因此两个 workdir 任务同时运行会相互破坏各自的当前工作目录。没有 workdir 的任务仍然像以前一样并行运行。
:::

## 在特定配置文件中运行定时任务

默认情况下，定时任务继承创建它的网关/CLI 所属的 Hermes 配置文件。传递 `--profile <name>`（CLI）或 `profile=`（cronjob 工具）可以将任务重新定向到不同的配置文件——调度器会解析该配置文件的 `HERMES_HOME`，在任务运行期间临时切换到其中，加载其 `.env` + `config.yaml`，并在那里执行任务：

```bash
# 将任务固定到 `night-ops` 配置文件，无论它是在何处被调度的
hermes cron create "每天 03:00" \
  "跟踪安全日志并标记异常" \
  --profile night-ops
```

```python
# 在聊天中，通过 cronjob 工具
cronjob(
    action="create",
    schedule="every 1d at 03:00",
    prompt="跟踪安全日志并标记异常",
    profile="night-ops",
)
```

使用 `--profile default` 可以明确固定到根 Hermes 配置文件。命名的配置文件必须已经存在；调度器不会即时创建配置文件。要在 `cron edit` 期间清除配置文件固定，传递一个空字符串（`--profile ""` 或 `profile=""`）——任务将恢复为在调度器自身所在的配置文件中运行。

如果固定的配置文件后来被删除，调度器会记录警告并回退到在其当前配置文件中运行任务，而不是崩溃——因此过时的 `profile` 引用永远不会卡住任务。

:::note 序列化
设置了 `profile` 的任务也会顺序运行，原因与 `workdir` 固定的任务相同：切换 `HERMES_HOME` 是一个进程全局的变更，因此两个配置文件固定的并行运行任务会相互竞争。未固定的任务仍然在正常的并行池中运行。
:::

## 编辑任务

你不需要删除并重新创建任务来更改它们。

:::tip 任务引用
下面的 `<job_id>` 占位符（以及在 [生命周期操作](#生命周期操作) 中）也接受任务的名称（不区分大小写）——当你记得 `morning-digest` 但不记得十六进制 ID 时很方便。精确的任务 ID 优先于名称匹配；如果引用的不是 ID 并且一个名称匹配了多个任务，命令会拒绝并打印候选项 ID 以便你进行明确。
:::

### 聊天

```bash
/cron edit <job_id> --schedule "每4小时"
/cron edit <job_id> --prompt "使用修订后的任务"
/cron edit <job_id> --skill blogwatcher --skill maps
/cron edit <job_id> --remove-skill blogwatcher
/cron edit <job_id> --clear-skills
```

### 独立 CLI

```bash
hermes cron edit <job_id> --schedule "every 4h"
hermes cron edit <job_id> --prompt "使用修订后的任务"
hermes cron edit <job_id> --skill blogwatcher --skill maps
hermes cron edit <job_id> --add-skill maps
hermes cron edit <job_id> --remove-skill blogwatcher
hermes cron edit <job_id> --clear-skills
```

注意：
- 重复的 `--skill` 会替换任务关联的技能列表
- `--add-skill` 会追加到现有列表而不替换
- `--remove-skill` 会移除特定的关联技能
- `--clear-skills` 会移除所有关联的技能

## 生命周期操作

定时任务现在拥有比创建/删除更完整的生命周期。

### 聊天

```bash
/cron list
/cron pause <job_id>
/cron resume <job_id>
/cron run <job_id>
/cron remove <job_id>
```

### 独立 CLI

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

它们的作用：
- `pause` — 保留任务但停止调度它
- `resume` — 重新启用任务并计算下一次未来运行时间
- `run` — 在下一个调度器节拍时触发任务
- `remove` — 完全删除它
- `edit` — 修改计划、提示词、配置文件、交付方式等。

**基于名称的查找。** 所有四个变更性动词（`pause`、`resume`、`run`、`remove`、`edit`）以及智能体的 `cronjob` 工具现在都接受任务**名称**（不区分大小写）来代替十六进制 ID。智能体和 CLI 都优先选择精确的 ID 匹配（如果存在）；模糊的名称匹配（多个任务共享同一名称）会被拒绝，并附带候选项 ID 的完整列表，以便你明确选择。名称不是唯一的，因此这种保护是必要的——它防止在两个任务共享一个名称时静默地更改错误的任务。

## 工作原理

**定时任务的执行由网关守护进程处理。** 网关每 60 秒调度器节拍一次，在隔离的智能体会话中运行所有到期的任务。

```bash
hermes gateway install     # 安装为用户服务
sudo hermes gateway install --system   # Linux: 用于服务器的启动时系统服务
hermes gateway             # 或在前台运行

hermes cron list
hermes cron status
```

### 网关调度器行为

在每次节拍时，Hermes：

1. 从 `~/.hermes/cron/jobs.json` 加载任务
2. 检查 `next_run_at` 是否符合当前时间
3. 为每个到期的任务启动一个新的 `AIAgent` 会话
4. 可选地将一个或多个关联技能注入该新会话
5. 运行提示词直至完成
6. 交付最终响应
7. 更新运行元数据和下一个计划时间

`~/.hermes/cron/.tick.lock` 处的文件锁防止重叠的调度器节拍重复运行同一批任务。

## 交付选项

调度任务时，你可以指定输出发送到哪里：

| 选项 | 描述 | 示例 |
|------|------|------|
| `"origin"` | 返回任务创建的地方 | 消息平台上的默认值 |
| `"local"` | 仅保存到本地文件 (`~/.hermes/cron/output/`) | CLI 上的默认值 |
| `"telegram"` | Telegram 主频道 | 使用 `TELEGRAM_HOME_CHANNEL` |
| `"telegram:123456"` | 按 ID 指定的 Telegram 聊天 | 直接交付 |
| `"telegram:-100123:17585"` | 指定的 Telegram 话题 | `chat_id:thread_id` 格式 |
| `"discord"` | Discord 主频道 | 使用 `DISCORD_HOME_CHANNEL` |
| `"discord:#engineering"` | 指定的 Discord 频道 | 通过频道名称 |
| `"slack"` | Slack 主频道 | |
| `"whatsapp"` | WhatsApp 主页 | |
| `"signal"` | Signal | |
| `"matrix"` | Matrix 主房间 | |
| `"mattermost"` | Mattermost 主频道 | |
| `"email"` | 电子邮件 | |
| `"sms"` | 通过 Twilio 的短信 | |
| `"homeassistant"` | Home Assistant | |
| `"dingtalk"` | 钉钉 | |
| `"feishu"` | 飞书 | |
| `"wecom"` | 企业微信 | |
| `"weixin"` | 微信 | |
| `"bluebubbles"` | BlueBubbles (iMessage) | |
| `"qqbot"` | QQ 机器人 (腾讯 QQ) | |
| `"all"` | 分发到每个已连接的主频道 | 在触发时解析 |
| `"telegram,discord"` | 分发到特定的一组频道 | 逗号分隔列表 |
| `"origin,all"` | 交付到原点**加上**每个其他已连接的频道 | 组合任何标记 |

智能体的最终响应会自动交付。你无需在定时任务提示词中调用 `send_message`。

### 路由意图 (`all`)

`all` 让你可以将一个定时任务发送到你已配置的每个消息频道，而无需按名称枚举它们。它**在触发时被解析**，因此在你连接 Telegram 之前创建的任务会在你设置 `TELEGRAM_HOME_CHANNEL` 后的下一个节拍时获取 Telegram。

语义：`all` 扩展到每个已配置了主频道的平台。零个是可以的；任务只是不产生交付目标，并在上游记录为交付失败。

`all` 可以与显式目标组合。`origin,all` 交付到原点聊天*加上*每个其他已连接的主频道，通过 `(platform, chat_id, thread_id)` 进行去重。

### Telegram 定时任务话题 (`TELEGRAM_CRON_THREAD_ID`)

当 Telegram 话题模式启用时，根私聊被保留为系统大厅——发送到那里的回复会被大厅提醒拒绝，并且 `reply_to_message_id` 会被丢弃，因此你无法回复落入主聊天的定时消息。

改为将定时任务指向一个专用的论坛话题：

1. 在 Telegram 中，打开机器人私聊并创建一个话题，例如命名为 `Cron`。长按话题标题 → **复制链接**；末尾的整数就是该话题的 `message_thread_id`。
2. 在你的 `.env` 中设置 `TELEGRAM_CRON_THREAD_ID=<那个 id>`。

这仅适用于定时任务交付。`TELEGRAM_HOME_CHANNEL_THREAD_ID`（在其他地方使用，例如重启通知）保持不变。显式的 `deliver="telegram:chat_id:thread_id"` 目标继续优先于环境变量。对定时消息的回复现在会到达现有的话题会话中，因此你可以直接对其采取行动。

### 响应包装

默认情况下，交付的定时输出会被包裹在一个页眉和页脚中，这样接收者就知道它来自一个计划任务：

```
定时任务响应：晨间订阅
-------------

<此处为智能体输出>

注意：智能体无法看到此消息，因此无法对其做出回应。
```

要交付原始的智能体输出而不带包装，请将 `cron.wrap_response` 设置为 `false`：

```yaml
# ~/.hermes/config.yaml
cron:
  wrap_response: false
```

### 静默抑制

如果智能体的最终响应以 `[SILENT]` 开头，则交付会被完全抑制。输出仍然会保存在本地以供审计（在 `~/.hermes/cron/output/` 中），但不会向交付目标发送任何消息。

这对于仅应在出现问题时才报告的监控任务非常有用：

```text
检查 nginx 是否正在运行。如果一切健康，则仅以 [SILENT] 响应。
否则，报告该问题。
```

失败的任务无论是否有 `[SILENT]` 标记都会被交付——只有成功的运行才能被静默。

## 脚本超时时间

通过 `script` 参数附加的预运行脚本默认超时时间为 120 秒。如果你的脚本需要更长时间 —— 例如包含随机延迟以避免机器人式的计时模式 —— 你可以增加这个时间：

```yaml
# ~/.hermes/config.yaml
cron:
  script_timeout_seconds: 300   # 5 分钟
```

或者设置 `HERMES_CRON_SCRIPT_TIMEOUT` 环境变量。解析顺序为：环境变量 → config.yaml → 120 秒默认值。

## 无智能体模式（纯脚本任务）

对于不需要 LLM 推理的周期性任务 —— 经典的监视器、磁盘/内存告警、心跳检测、CI 探针 —— 在创建时传递 `no_agent=True`。调度器将按计划运行你的脚本，并直接传递其标准输出，完全跳过智能体：

```bash
hermes cron create "every 5m" \
  --no-agent \
  --script memory-watchdog.sh \
  --deliver telegram \
  --name "memory-watchdog"
```

语义：

- 脚本标准输出（修剪后）→ 原样作为消息传递。
- **空的标准输出 → 静默标记**，不进行传递。这就是监视器模式：“只在有问题时才说话”。
- 非零退出码或超时 → 会发送错误警报，因此故障的监视器不能无声无息地失效。
- 最后一行 `{"wakeAgent": false}` → 静默标记（与 LLM 任务使用的相同门控）。
- 无令牌、无模型、无提供商回退 —— 该任务从不接触推理层。

`.sh` / `.bash` 文件在 `/bin/bash` 下运行；其他文件则使用当前的 Python 解释器（`sys.executable`）。脚本必须位于 `~/.hermes/scripts/` 中（与预运行脚本门控相同的沙盒规则）。

### 智能体会为你设置这些

`cronjob` 工具的模式直接向 Hermes 暴露了 `no_agent`，因此你可以在聊天中描述一个监视器，让智能体来配置它：

```text
如果内存占用超过 85%，每 5 分钟通过 Telegram 提醒我。
```

Hermes 将通过 `write_file` 将检查脚本写入 `~/.hermes/scripts/`，然后调用：

```python
cronjob(action="create", schedule="every 5m",
        script="memory-watchdog.sh", no_agent=True,
        deliver="telegram", name="memory-watchdog")
```

当消息内容完全由脚本决定时（监视器、阈值告警、心跳），它会自动选择 `no_agent=True`。同一个工具还允许智能体暂停、恢复、编辑和删除任务 —— 因此整个生命周期都是聊天驱动的，无需任何人操作命令行。

请参阅[纯脚本定时任务指南](/guides/cron-script-only)获取实际示例。

## 使用 `context_from` 链式执行任务

定时任务在隔离的会话中运行，不保留任何前次运行的记忆。但有时一个任务的输出恰好是另一个任务所需的输入。`context_from` 参数能够自动建立这种连接——任务 B 的提示词将在运行时自动前置任务 A 的最近一次输出作为上下文。

```python
# 任务 1：收集原始数据
cronjob(
    action="create",
    prompt="从 Hacker News 获取前 10 条 AI/ML 新闻故事。将其以 markdown 格式保存到 ~/.hermes/data/briefs/raw.md，包含标题、URL 和评分。",
    schedule="0 7 * * *",
    name="AI 新闻收集器",
)

# 任务 2：筛选 — 接收任务 1 的输出作为上下文
# 从以下命令获取任务 1 的 ID: cronjob(action="list")
cronjob(
    action="create",
    prompt="读取 ~/.hermes/data/briefs/raw.md。为每个故事的互动潜力和新颖性打 1–10 分。将前 5 名输出到 ~/.hermes/data/briefs/ranked.md。",
    schedule="30 7 * * *",
    context_from="<job1_id>",
    name="AI 新闻筛选",
)

# 任务 3：发送 — 接收任务 2 的输出作为上下文
cronjob(
    action="create",
    prompt="读取 ~/.hermes/data/briefs/ranked.md。撰写 3 条推文草稿（吸引点 + 正文 + 话题标签）。发送至 telegram:7976161601。",
    schedule="0 8 * * *",
    context_from="<job2_id>",
    name="AI 新闻简报",
)
```

**工作原理：**

- 当任务 2 触发时，Hermes 会从 `~/.hermes/cron/output/{job1_id}/*.md` 读取任务 1 的最近一次输出。
- 该输出会自动前置到任务 2 的提示词之前。
- 任务 2 无需硬编码“读取此文件”——它会将内容作为上下文接收。
- 该链可以是任意长度：任务 1 → 任务 2 → 任务 3 → ...

**`context_from` 接受的格式：**

| 格式 | 示例 |
|------|------|
| 单个任务 ID（字符串） | `context_from="a1b2c3d4"` |
| 多个任务 ID（列表） | `context_from=["job_a", "job_b"]` |

输出将按列表顺序进行拼接。

**使用场景：**

- 多阶段流水线（收集 → 过滤 → 格式化 → 交付）
- 依赖性任务，其中步骤 N 的工作依赖于步骤 N-1 的输出
- 扇出/扇入模式，其中一个任务汇总来自多个其他任务的结果

## 提供商恢复

定时任务继承您配置的备用提供商和凭据池轮换策略。如果主 API 密钥受到速率限制或提供商返回错误，定时智能体可以：

- **回退到备用提供商**，前提是在 `config.yaml` 中配置了 `fallback_providers`（或旧版 `fallback_model`）
- **轮换到同一提供商的下一个凭据**，参见您的[凭据池](/user-guide/configuration#credential-pool-strategies)

这意味着在高峰时段或高频运行的定时任务更具弹性——单个受速率限制的密钥不会导致整个运行失败。

## 调度格式

智能体的最终响应会自动发送——您**无需**为同一目标地址在定时任务的提示词中包含 `send_message`。如果一次定时运行向调度器本身将发送到的完全相同的目标调用了 `send_message`，Hermes 会跳过该重复发送，并告知模型将面向用户的内容放在最终响应中。仅当需要向其他或不同目标发送时才使用 `send_message`。

### 相对延迟（一次性）

```text
30m     → 30 分钟后运行一次
2h      → 2 小时后运行一次
1d      → 1 天后运行一次
```

### 间隔（周期性）

```text
every 30m    → 每 30 分钟
every 2h     → 每 2 小时
every 1d     → 每天
```

### Cron 表达式

```text
0 9 * * *       → 每天上午 9:00
0 9 * * 1-5     → 工作日上午 9:00
0 */6 * * *     → 每 6 小时
30 8 1 * *      → 每月 1 日上午 8:30
0 0 * * 0       → 每周日午夜
```

### ISO 时间戳

```text
2026-03-15T09:00:00    → 一次性，2026 年 3 月 15 日上午 9:00
```

## 重复行为

| 调度类型 | 默认重复次数 | 行为 |
|----------|--------------|------|
| 一次性 (`30m`，时间戳) | 1 | 运行一次 |
| 间隔 (`every 2h`) | forever | 运行直到被移除 |
| Cron 表达式 | forever | 运行直到被移除 |

您可以覆盖它：

```python
cronjob(
    action="create",
    prompt="...",
    schedule="every 2h",
    repeat=5,
)
```

## 以编程方式管理任务

面向智能体的 API 是一个工具：

```python
cronjob(action="create", ...)
cronjob(action="list")
cronjob(action="update", job_id="...")
cronjob(action="pause", job_id="...")
cronjob(action="resume", job_id="...")
cronjob(action="run", job_id="...")
cronjob(action="remove", job_id="...")
```

对于 `update`，传入 `skills=[]` 可移除所有附加的技能。

## 定时任务可用的工具集

定时运行在每个任务都在一个全新的智能体会话中执行，没有连接聊天平台。默认情况下，定时智能体获得的是您在 `hermes tools` 中为 `cron` 平台配置的工具集——不是 CLI 默认值，也不是所有工具。

```bash
hermes tools
# → 在交互式界面中选择 "cron" 平台
# → 就像为 Telegram/Discord 等平台一样，切换工具集的开关
```

更细粒度的每任务控制可以通过 `cronjob.create`（或通过 `cronjob.update` 更新现有任务）的 `enabled_toolsets` 字段实现：

```text
cronjob(action="create", name="weekly-news-summary",
        schedule="every sunday 9am",
        enabled_toolsets=["web", "file"],      # 仅启用 web 和 file，无 terminal/browser 等
        prompt="Summarize this week's AI news: ...")
```

当任务上设置了 `enabled_toolsets` 时，它优先；否则由 `hermes tools` 的 cron 平台配置决定；否则 Hermes 回退到内置默认值。这对成本控制很重要：将 `moa`、`browser`、`delegation` 带入每个微小的“获取新闻”任务，会在每次 LLM 调用时膨胀工具模式提示词。

### 完全跳过智能体：`wakeAgent`

如果您的定时任务附加了预检脚本（通过 `script=`），该脚本可以在运行时决定 Hermes 是否应该调用智能体。在最后一行输出如下格式的标准输出：

```text
{"wakeAgent": false}
```

…那么定时任务将完全跳过该次的智能体运行。这对于频繁轮询（每 1-5 分钟）且仅在状态实际改变时才需要唤醒 LLM 的情况非常有用——否则您会为一次又一次内容为空的智能体回合付费。

```python
# 预检脚本
import json, sys
latest = fetch_latest_issue_count()
prev = read_state("issue_count")
if latest == prev:
    print(json.dumps({"wakeAgent": False}))   # 跳过本次
    sys.exit(0)
write_state("issue_count", latest)
print(json.dumps({"wakeAgent": True, "context": {"new_issues": latest - prev}}))
```

当省略 `wakeAgent` 时，默认值为 `true`（照常唤醒智能体）。

#### 配方：低成本运行前门控

`wakeAgent` 门控为您提供了一种零成本的方式，以决定计划任务是否应该消耗任何 LLM token。三种模式涵盖了大多数用例。

**文件变更门控** — 仅当被监视的文件自上次成功执行以来有新内容时运行。调度器记录每个任务的 `last_run_at`；将其与文件的修改时间 (mtime) 进行比较。

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
        prompt="A new ~/data/feed.json has landed. Summarize what changed.")
```

**外部标志门控** — 仅当其他进程已发出就绪信号时运行（例如，部署钩子放置一个文件，CI 任务在您的状态存储中设置一个值）。

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
        prompt="Run the nightly analysis over today's batch.")
```

**SQL 计数门控** — 仅当您的数据库中有需要处理的新行时运行。脚本还可以通过 `context` 将计数传递给智能体，这样智能体无需重新查询就知道自己要处理多少数据。

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
        prompt="Summarize the new messages from the last 2 hours.")
```

同样的模式适用于您可以通过脚本查询的任何数据源——Postgres、HTTP API、您自己的状态存储——而无需在定时子系统中内嵌 SQL 评估器。

:::tip
Hermes 自己的 `~/.hermes/state.db` 是一个内部模式，会在不同版本之间发生变化。不要从运行前门控脚本查询它——请指向您自己的数据库或数据源。
:::

致谢：此配方集由 @iankar8 在 [#2654](https://github.com/NousResearch/hermes-agent/pull/2654) 中的探索所启发，该提议添加了 sql/file/command 触发器作为并行机制。`script` + `wakeAgent` 门控已经以零成本覆盖了所有三种情况，因此该工作最终转化为文档。

### 链式执行任务：`context_from`

一个定时任务可以通过在 `context_from` 中列出其他任务的名称（或 ID）来使用它们最近一次成功输出的上下文：

```text
cronjob(action="create", name="daily-digest",
        schedule="every day 7am",
        context_from=["ai-news-fetch", "github-prs-fetch"],
        prompt="Write the daily digest using the outputs above.")
```

被引用的任务的最近一次已完成输出会作为上下文注入到本次运行的提示词之前。每个上游条目必须是有效的任务 ID 或名称（参见 `cronjob action="list"`）。注意：链式读取使用的是*最近一次已完成*的输出——它不会等待在同一执行周期内正在运行的上游任务。

## 任务存储

任务存储在 `~/.hermes/cron/jobs.json` 中。任务运行的输出保存到 `~/.hermes/cron/output/{job_id}/{timestamp}.md`。

任务可能会将 `model` 和 `provider` 存储为 `null`。当这些字段被省略时，Hermes 会在执行时从全局配置中解析它们。它们仅在设置了任务级别的覆盖时才会出现在任务记录中。

该存储使用原子文件写入，因此中断的写入不会留下部分写入的任务文件。

## 自包含的提示词仍然重要

:::warning 重要
定时任务在一个完全独立的智能体会话中运行。提示词必须包含智能体运行所需的一切，这些内容并非由附加技能提供。
:::

**错误示例：** `"Check on that server issue"`

**正确示例：** `"以用户 'deploy' 的身份通过 SSH 登录服务器 192.168.1.100，使用 'systemctl status nginx' 命令检查 nginx 是否正在运行，并验证 https://example.com 是否返回 HTTP 200。"`

## 安全性

计划任务的提示词在创建和更新时会进行提示注入和凭证窃取模式的扫描。包含不可见 Unicode 技巧、SSH 后门尝试或明显密钥窃取有效载荷的提示词将被阻止。