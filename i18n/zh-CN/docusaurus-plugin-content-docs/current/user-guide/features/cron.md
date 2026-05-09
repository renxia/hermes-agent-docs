---
sidebar_position: 5
title: "计划任务 (Cron)"
description: "使用自然语言安排自动化任务，通过一个 cron 工具管理它们，并附加一个或多个技能"
---

# 计划任务 (Cron)

使用自然语言或 cron 表达式安排任务自动运行。Hermes 通过一个 `cronjob` 工具公开 cron 管理功能，该工具采用操作式操作，而不是单独的 schedule/list/remove 工具。

## cron 现在能做什么

Cron 作业可以：

- 安排一次性或重复性任务
- 暂停、恢复、编辑、触发和删除作业
- 为作业附加零个、一个或多个技能
- 将结果传递回原始聊天、本地文件或配置的平台目标
- 在新的智能体会话中运行，使用正常的静态工具列表
- 在**无智能体模式**下运行 — 按计划运行的脚本，其标准输出逐字传递，不涉及任何 LLM（参见下面的[无智能体模式（仅脚本作业）](#no-agent-mode-script-only-jobs)部分）

所有这些功能 Hermes 本身都可以通过 `cronjob` 工具使用，因此您可以通过自然语言请求来创建、暂停、编辑和删除作业 — 无需使用命令行界面。

:::warning
Cron 运行的会话无法递归创建更多 cron 作业。Hermes 会在 cron 执行期间禁用 cron 管理工具，以防止失控的调度循环。
:::

## 创建计划任务

### 在聊天中使用 `/cron`

```bash
/cron add 30m "提醒我检查构建"
/cron add "每2小时" "检查服务器状态"
/cron add "每1小时" "汇总新订阅内容" --skill blogwatcher
/cron add "每1小时" "使用两个技能并合并结果" --skill blogwatcher --skill maps
```

### 从独立 CLI

```bash
hermes cron create "每2小时" "检查服务器状态"
hermes cron create "每1小时" "汇总新订阅内容" --skill blogwatcher
hermes cron create "每1小时" "使用两个技能并合并结果" \
  --skill blogwatcher \
  --skill maps \
  --name "技能组合"
```

### 通过自然对话

像平常一样询问 Hermes：

```text
每天早上9点，检查 Hacker News 上的 AI 新闻并通过 Telegram 发送给我摘要。
```

Hermes 内部将使用统一的 `cronjob` 工具。

## 支持技能的定时任务

定时任务可以在运行提示之前加载一个或多个技能。

### 单个技能

```python
cronjob(
    action="create",
    skill="blogwatcher",
    prompt="检查已配置的订阅源并汇总任何新内容。",
    schedule="0 9 * * *",
    name="每日订阅",
)
```

### 多个技能

技能按顺序加载。提示成为叠加在这些技能之上的任务指令。

```python
cronjob(
    action="create",
    skills=["blogwatcher", "maps"],
    prompt="查找新的本地活动和有趣的附近地点，然后将它们合并成一个简短的简报。",
    schedule="每6小时",
    name="本地简报",
)
```

当你希望一个计划智能体继承可重用的工作流，而无需将完整的技能文本塞入定时任务提示本身时，这非常有用。

## 在项目目录内运行任务

定时任务默认在与任何仓库分离的状态下运行 — 不会加载 `AGENTS.md`、`CLAUDE.md` 或 `.cursorrules`，终端 / 文件 / 代码执行工具从网关启动时的任何工作目录运行。传递 `--workdir`（CLI）或 `workdir=`（工具调用）来更改：

```bash
# 独立 CLI（计划和提示是位置参数）
hermes cron create "每天 09:00" \
  "审计开放的 PR，汇总 CI 健康状况，并发布到 #eng" \
  --workdir /home/me/projects/acme
```

```python
# 从聊天中，通过 cronjob 工具
cronjob(
    action="create",
    schedule="每天 09:00",
    workdir="/home/me/projects/acme",
    prompt="审计开放的 PR，汇总 CI 健康状况，并发布到 #eng",
)
```

当设置了 `workdir` 时：

- 该目录中的 `AGENTS.md`、`CLAUDE.md` 和 `.cursorrules` 会被注入到系统提示中（与交互式 CLI 相同的发现顺序）
- `terminal`、`read_file`、`write_file`、`patch`、`search_files` 和 `execute_code` 都使用该目录作为其工作目录（通过 `TERMINAL_CWD`）
- 路径必须是存在的绝对目录 — 相对路径和缺失的目录在创建 / 更新时会被拒绝
- 在编辑时传递 `--workdir ""`（或通过工具传递 `workdir=""`）以清除它并恢复旧的行为

:::note 序列化
带有 `workdir` 的任务在调度器滴答时按顺序运行，而不是在并行池中运行。这是故意的 — `TERMINAL_CWD` 是进程全局的，因此两个 workdir 任务同时运行会相互破坏 cwd。无 workdir 的任务仍像以前一样并行运行。
:::

## 编辑任务

你无需删除并重新创建任务来更改它们。

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
hermes cron edit <job_id> --schedule "每4小时"
hermes cron edit <job_id> --prompt "使用修订后的任务"
hermes cron edit <job_id> --skill blogwatcher --skill maps
hermes cron edit <job_id> --add-skill maps
hermes cron edit <job_id> --remove-skill blogwatcher
hermes cron edit <job_id> --clear-skills
```

注意：

- 重复的 `--skill` 会替换任务附带的技能列表
- `--add-skill` 会附加到现有列表而不替换它
- `--remove-skill` 会移除特定的附带技能
- `--clear-skills` 会移除所有附带技能

## 生命周期操作

定时任务现在具有比创建/删除更完整的生命周期。

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
hermes cron pause <job_id>
hermes cron resume <job_id>
hermes cron run <job_id>
hermes cron remove <job_id>
hermes cron status
hermes cron tick
```

它们的作用：

- `pause` — 保留任务但停止调度它
- `resume` — 重新启用任务并计算下一次未来运行时间
- `run` — 在下次调度器滴答时触发任务
- `remove` — 完全删除它

## 工作原理

**定时任务执行由网关守护进程处理。** 网关每 60 秒滴答一次调度器，在隔离的智能体会话中运行任何到期的任务。

```bash
hermes gateway install     # 安装为用户服务
sudo hermes gateway install --system   # Linux：服务器的启动时系统服务
hermes gateway             # 或在前台运行

hermes cron list
hermes cron status
```

### 网关调度器行为

每次滴答时 Hermes 会：

1. 从 `~/.hermes/cron/jobs.json` 加载任务
2. 检查 `next_run_at` 与当前时间
3. 为每个到期任务启动一个新的 `AIAgent` 会话
4. 可选地将一个或多个附带技能注入到该新会话中
5. 运行提示直至完成
6. 传递最终响应
7. 更新运行元数据和下次计划时间

`~/.hermes/cron/.tick.lock` 处的文件锁可防止重叠的调度器滴答重复运行同一批任务。

## 传递选项

在调度任务时，你指定输出的去向：

| 选项 | 描述 | 示例 |
|--------|-------------|---------|
| `"origin"` | 返回到任务创建的位置 | 消息平台上的默认值 |
| `"local"` | 仅保存到本地文件（`~/.hermes/cron/output/`） | CLI 上的默认值 |
| `"telegram"` | Telegram 主频道 | 使用 `TELEGRAM_HOME_CHANNEL` |
| `"telegram:123456"` | 通过 ID 指定的特定 Telegram 聊天 | 直接传递 |
| `"telegram:-100123:17585"` | 特定的 Telegram 主题 | `chat_id:thread_id` 格式 |
| `"discord"` | Discord 主频道 | 使用 `DISCORD_HOME_CHANNEL` |
| `"discord:#engineering"` | 特定的 Discord 频道 | 通过频道名称 |
| `"slack"` | Slack 主频道 | |
| `"whatsapp"` | WhatsApp 主频道 | |
| `"signal"` | Signal | |
| `"matrix"` | Matrix 主房间 | |
| `"mattermost"` | Mattermost 主频道 | |
| `"email"` | 电子邮件 | |
| `"sms"` | 通过 Twilio 发送短信 | |
| `"homeassistant"` | Home Assistant | |
| `"dingtalk"` | 钉钉 | |
| `"feishu"` | 飞书/Lark | |
| `"wecom"` | 企业微信 | |
| `"weixin"` | 微信 | |
| `"bluebubbles"` | BlueBubbles（iMessage） | |
| `"qqbot"` | QQ 机器人（腾讯 QQ） | |
| `"all"` | 分发到每个已连接的主频道 | 在触发时解析 |
| `"telegram,discord"` | 分发到特定的一组频道 | 逗号分隔列表 |
| `"origin,all"` | 传递到原始聊天**以及**每个其他已连接的主频道 | 组合任何标记 |

智能体的最终响应会自动传递。你无需在定时任务提示中调用 `send_message`。

### 路由意图（`all`）

`all` 让你可以将一个定时任务发送到每个你已配置的消息频道，而无需按名称枚举它们。它在**触发时解析**，因此在你设置 `TELEGRAM_HOME_CHANNEL` 之前创建的任务将在下次滴答时获取 Telegram。

语义：`all` 扩展到每个具有已配置主频道的平台。零也可以；任务 simply 不产生传递目标，并记录为上游传递失败。

`all` 与显式目标组合。`origin,all` 传递到原始聊天*以及*每个其他已连接的主频道，通过 `(platform, chat_id, thread_id)` 去重。

### 响应包装

默认情况下，传递的定时任务输出会被包装在页眉和页脚中，以便接收者知道它来自计划任务：

```
定时任务响应：每日订阅
-------------

<智能体输出>

注意：智能体无法看到此消息，因此无法对其作出响应。
```

要传递没有包装的原始智能体输出，请将 `cron.wrap_response` 设置为 `false`：

```yaml
# ~/.hermes/config.yaml
cron:
  wrap_response: false
```

### 静默抑制

如果智能体的最终响应以 `[SILENT]` 开头，则传递会被完全抑制。输出仍会本地保存以供审计（在 `~/.hermes/cron/output/` 中），但不会向传递目标发送消息。

这对于仅在出现问题时才应报告的监控任务非常有用：

```text
检查 nginx 是否正在运行。如果一切正常，请仅响应 [SILENT]。
否则，报告问题。
```

失败的任务始终传递，无论是否有 `[SILENT]` 标记 — 只有成功的运行才能被静默。

## 脚本超时

预运行脚本（通过 `script` 参数附加）的默认超时时间为 120 秒。如果您的脚本需要更长时间——例如，包含随机延迟以避免类似机器人的时间模式——您可以增加此值：

```yaml
# ~/.hermes/config.yaml
cron:
  script_timeout_seconds: 300   # 5 分钟
```

或者设置 `HERMES_CRON_SCRIPT_TIMEOUT` 环境变量。优先级顺序为：环境变量 → config.yaml → 120 秒默认值。

## 无智能体模式（仅脚本作业）

对于不需要 LLM 推理的重复性作业——例如经典的看门狗、磁盘/内存警报、心跳检测、CI 心跳——请在创建时传递 `no_agent=True`。调度器将按计划运行您的脚本，并直接传递其标准输出，完全跳过智能体：

```bash
hermes cron create "every 5m" \
  --no-agent \
  --script memory-watchdog.sh \
  --deliver telegram \
  --name "memory-watchdog"
```

语义说明：

- 脚本的标准输出（经过修剪）→ 逐字作为消息传递。
- **空的标准输出 → 静默滴答**，不进行传递。这是看门狗模式：“仅在出现问题时才发出通知”。
- 非零退出码或超时 → 将传递错误警报，因此损坏的看门狗不会静默失败。
- 最后一行包含 `{"wakeAgent": false}` → 静默滴答（与 LLM 作业使用的相同门控机制）。
- 无 token 消耗、无模型调用、无提供商回退 —— 该作业永远不会触及推理层。

`.sh` / `.bash` 文件将在 `/bin/bash` 下运行；其他任何文件将在当前 Python 解释器（`sys.executable`）下运行。脚本必须位于 `~/.hermes/scripts/` 目录中（与预运行脚本门控相同的沙箱规则）。

### 智能体将为您设置这些

`cronjob` 工具的模式直接将 `no_agent` 暴露给 Hermes，因此您可以在聊天中描述一个看门狗，并让智能体将其连接起来：

```text
如果 RAM 使用率超过 85%，请每 5 分钟通过 Telegram 通知我。
```

Hermes 将通过 `write_file` 将检查脚本写入 `~/.hermes/scripts/`，然后调用：

```python
cronjob(action="create", schedule="every 5m",
        script="memory-watchdog.sh", no_agent=True,
        deliver="telegram", name="memory-watchdog")
```

当消息内容完全由脚本决定时（例如看门狗、阈值警报、心跳检测），它将自动选择 `no_agent=True`。同一工具还允许智能体暂停、恢复、编辑和删除作业 —— 因此整个生命周期都可通过聊天驱动，无需任何人接触命令行界面。

有关实际示例，请参阅[仅脚本的 Cron 作业指南](/docs/guides/cron-script-only)。

## 使用 `context_from` 链式调用任务

Cron 任务在隔离的会话中运行，不会记住之前的运行记录。但有时，一个任务的输出正是下一个任务所需要的。`context_from` 参数会自动建立这种连接——任务 B 的提示词会在运行时自动加上任务 A 的最新输出作为上下文。

```python
# 任务 1：收集原始数据
cronjob(
    action="create",
    prompt="从 Hacker News 获取前 10 条 AI/ML 新闻。以 Markdown 格式保存到 ~/.hermes/data/briefs/raw.md，包含标题、URL 和分数。",
    schedule="0 7 * * *",
    name="AI 新闻收集器",
)

# 任务 2：筛选 — 接收任务 1 的输出作为上下文
# 从 cronjob(action="list") 获取任务 1 的 ID
cronjob(
    action="create",
    prompt="读取 ~/.hermes/data/briefs/raw.md。为每条新闻按参与度和新颖性打分（1-10 分）。将前 5 条输出到 ~/.hermes/data/briefs/ranked.md。",
    schedule="30 7 * * *",
    context_from="<job1_id>",
    name="AI 新闻筛选",
)

# 任务 3：发布 — 接收任务 2 的输出作为上下文
cronjob(
    action="create",
    prompt="读取 ~/.hermes/data/briefs/ranked.md。撰写 3 条推文草稿（钩子 + 正文 + 标签）。发送到 telegram:7976161601。",
    schedule="0 8 * * *",
    context_from="<job2_id>",
    name="AI 新闻简报",
)
```

**工作原理：**

- 当任务 2 触发时，Hermes 会从 `~/.hermes/cron/output/{job1_id}/*.md` 读取任务 1 的最新输出
- 该输出会自动添加到任务 2 的提示词之前
- 任务 2 无需硬编码“读取此文件”——它会直接收到内容作为上下文
- 链式调用可以是任意长度：任务 1 → 任务 2 → 任务 3 → ...

**`context_from` 支持的格式：**

| 格式 | 示例 |
|------|------|
| 单个任务 ID（字符串） | `context_from="a1b2c3d4"` |
| 多个任务 ID（列表） | `context_from=["job_a", "job_b"]` |

输出会按列表顺序拼接。

**使用场景：**

- 多阶段流水线（收集 → 过滤 → 格式化 → 发布）
- 依赖任务，其中第 N 步的工作依赖于第 N−1 步的输出
- 扇出/扇入模式，其中一个任务聚合多个其他任务的结果

## 提供者恢复

Cron 任务会继承您配置的备用提供者和凭据池轮换机制。如果主 API 密钥被限流或提供者返回错误，cron 智能体可以：

- **回退到备用提供者**，前提是您在 `config.yaml` 中配置了 `fallback_providers`（或旧版 `fallback_model`）
- **轮换到同一提供者的下一个凭据**，使用您的[凭据池](/docs/user-guide/configuration#credential-pool-strategies)

这意味着高频运行或在高峰时段运行的 cron 任务更具弹性——单个被限流的密钥不会导致整个运行失败。

## 调度格式

智能体的最终响应会自动发送——您**无需**在 cron 提示词中包含 `send_message` 来发送到同一目标。如果 cron 运行调用 `send_message` 到调度器将要发送的完全相同的目标，Hermes 会跳过该重复发送，并告诉模型将面向用户的内容放在最终响应中。仅在需要发送到额外或不同目标时才使用 `send_message`。

### 相对延迟（一次性）

```text
30m     → 30 分钟后运行一次
2h      → 2 小时后运行一次
1d      → 1 天后运行一次
```

### 间隔（重复）

```text
every 30m    → 每 30 分钟运行一次
every 2h     → 每 2 小时运行一次
every 1d     → 每天运行一次
```

### Cron 表达式

```text
0 9 * * *       → 每天上午 9:00
0 9 * * 1-5     → 工作日（周一至周五）上午 9:00
0 */6 * * *     → 每 6 小时运行一次
30 8 1 * *      → 每月 1 日上午 8:30
0 0 * * 0       → 每周日午夜
```

### ISO 时间戳

```text
2026-03-15T09:00:00    → 2026 年 3 月 15 日上午 9:00 运行一次
```

## 重复行为

| 调度类型 | 默认重复次数 | 行为 |
|----------|--------------|------|
| 一次性（`30m`、时间戳） | 1 | 运行一次 |
| 间隔（`every 2h`） | 无限 | 运行直到被移除 |
| Cron 表达式 | 无限 | 运行直到被移除 |

您可以覆盖默认行为：

```python
cronjob(
    action="create",
    prompt="...",
    schedule="every 2h",
    repeat=5,
)
```

## 以编程方式管理任务

面向智能体的 API 是一种工具：

```python
cronjob(action="create", ...)
cronjob(action="list")
cronjob(action="update", job_id="...")
cronjob(action="pause", job_id="...")
cronjob(action="resume", job_id="...")
cronjob(action="run", job_id="...")
cronjob(action="remove", job_id="...")
```

对于 `update`，传递 `skills=[]` 可移除所有附加技能。

## Cron 任务可用的工具集

Cron 会在一个全新的智能体会话中运行每个任务，且不附加任何聊天平台。默认情况下，cron 智能体会获得您在 `hermes tools` 中为 `cron` 平台配置的**工具集**——而不是 CLI 默认值，也不是所有可用工具。

```bash
hermes tools
# → 在 curses 界面中选择 "cron" 平台
# → 像为 Telegram/Discord 等一样切换工具集的开/关状态
```

您还可以通过 `cronjob.create` 上的 `enabled_toolsets` 字段（或通过 `cronjob.update` 对现有任务）进行更细粒度的每任务控制：

```text
cronjob(action="create", name="weekly-news-summary",
        schedule="every sunday 9am",
        enabled_toolsets=["web", "file"],      # 仅 web + file，不包含 terminal/browser 等
        prompt="总结本周 AI 新闻：...")
```

当任务上设置了 `enabled_toolsets` 时，它将优先使用；否则使用 `hermes tools` 中 cron 平台的配置；否则 Hermes 会回退到内置默认值。这对于成本控制很重要：在每个微小的“获取新闻”任务中都携带 `moa`、`browser`、`delegation` 会使得每次 LLM 调用时的工具模式提示词膨胀。

### 完全跳过智能体：`wakeAgent`

如果您的 cron 任务附加了一个预检查脚本（通过 `script=`），该脚本可以在运行时决定是否应该调用 Hermes 智能体。输出如下格式的最后一行标准输出：

```text
{"wakeAgent": false}
```

……cron 将完全跳过本次的智能体运行。这对于频繁轮询（每 1-5 分钟）但仅在状态实际发生变化时才需要唤醒 LLM 的场景非常有用——否则您会反复为无内容的智能体轮转而付费。

```python
# 预检查脚本
import json, sys
latest = fetch_latest_issue_count()
prev = read_state("issue_count")
if latest == prev:
    print(json.dumps({"wakeAgent": False}))   # 跳过本次运行
    sys.exit(0)
write_state("issue_count", latest)
print(json.dumps({"wakeAgent": True, "context": {"new_issues": latest - prev}}))
```

当省略 `wakeAgent` 时，默认为 `true`（照常唤醒智能体）。

### 链式调用任务：`context_from`

一个 cron 任务可以通过在 `context_from` 中列出其他任务的名称（或 ID）来消费一个或多个其他任务的最新成功输出：

```text
cronjob(action="create", name="daily-digest",
        schedule="every day 7am",
        context_from=["ai-news-fetch", "github-prs-fetch"],
        prompt="使用上述输出撰写每日摘要。")
```

被引用的任务的最新已完成输出会作为本次运行的上下文注入到提示词上方。每个上游条目必须是有效的任务 ID 或名称（参见 `cronjob action="list"`）。注意：链式调用读取的是*最新已完成的*输出——它不会等待在同一时间点正在运行的上游任务。

## 任务存储

任务存储在 `~/.hermes/cron/jobs.json` 中。任务运行的输出会保存到 `~/.hermes/cron/output/{job_id}/{timestamp}.md`。

任务中的 `model` 和 `provider` 字段可能为 `null`。当这些字段被省略时，Hermes 会在执行时从全局配置中解析它们。仅当设置了每任务覆盖时，它们才会出现在任务记录中。

存储使用原子文件写入，因此中断的写入不会留下部分写入的任务文件。

## 自包含提示词仍然重要

:::warning 重要
Cron 任务在完全全新的智能体会话中运行。提示词必须包含智能体所需的一切，除了已附加技能提供的部分。
:::

**错误示例：** `"检查那个服务器问题"`

**正确示例：** `"以用户 'deploy' 身份通过 SSH 登录服务器 192.168.1.100，使用 'systemctl status nginx' 检查 nginx 是否正在运行，并验证 https://example.com 是否返回 HTTP 200。"`

## 安全

在创建和更新时，系统会扫描计划任务提示词中是否存在提示注入和凭据泄露模式。包含不可见 Unicode 技巧、SSH 后门尝试或明显凭据泄露载荷的提示词将被阻止。