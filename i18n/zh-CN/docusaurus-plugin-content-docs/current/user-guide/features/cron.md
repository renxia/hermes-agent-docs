---
sidebar_position: 5
title: "定时任务（Cron）"
description: "使用自然语言安排自动化任务，通过一个 cron 工具管理它们，并附加一个或多个技能"
---

# 定时任务（Cron）

使用自然语言或 cron 表达式来安排任务自动运行。Hermes 通过一个 `cronjob` 工具来提供 cron 管理功能，该工具采用操作式的命令方式，而不是使用单独的计划/列表/移除工具。

## Cron 现在能做什么

Cron 作业可以：

-   安排一次性或重复性任务
-   暂停、恢复、编辑、触发和移除作业
-   为作业附加零个、一个或多个技能
-   将结果传回原始聊天、本地文件或已配置的平台目标
-   在包含常规静态工具列表的**新的智能体会话**中运行
-   以**无智能体模式**运行 —— 一个按计划运行的脚本，其标准输出原样传递，不涉及任何 LLM（详见下方[无智能体模式（纯脚本作业）](#no-agent-mode-script-only-jobs)章节）

所有这些功能都可以通过 `cronjob` 工具供 Hermes 本身使用，因此您只需用自然语言询问即可创建、暂停、编辑和移除作业 —— 无需使用命令行界面。

:::warning
Cron 运行的会话无法递归地创建更多 cron 作业。Hermes 会在 cron 执行过程中禁用 cron 管理工具，以防止无限调度循环。
:::

# 创建定时任务

## 在对话中使用 `/cron`

```bash
/cron add 30m "提醒我检查构建"
/cron add "every 2h" "检查服务器状态"
/cron add "every 1h" "总结新信息源内容" --skill blogwatcher
/cron add "every 1h" "使用两种技能并合并结果" --skill blogwatcher --skill maps
```

## 通过独立 CLI

```bash
hermes cron create "every 2h" "检查服务器状态"
hermes cron create "every 1h" "总结新信息源内容" --skill blogwatcher
hermes cron create "every 1h" "使用两种技能并合并结果" \
  --skill blogwatcher \
  --skill maps \
  --name "技能组合"
```

## 通过自然对话

正常向 Hermes 提问：

```text
每天早上9点，检查Hacker News上的AI新闻，并在Telegram上向我发送摘要。
```

Hermes 将在内部使用统一的 `cronjob` 工具。

## 技能支持的定时任务

定时任务可以在运行提示词之前加载一个或多个技能。

### 单一技能

```python
cronjob(
    action="create",
    skill="blogwatcher",
    prompt="检查配置的信息源并总结任何新内容。",
    schedule="0 9 * * *",
    name="早间信息",
)
```

### 多个技能

技能按顺序加载。提示词成为叠加在这些技能之上的任务指令。

```python
cronjob(
    action="create",
    skills=["blogwatcher", "maps"],
    prompt="查找本地新活动和附近有趣的地方，然后将它们合并成一份简短的简报。",
    schedule="every 6h",
    name="本地简报",
)
```

当你希望定时任务继承可重用的工作流程，而无需将完整的技能文本塞入定时任务的提示词中时，这非常有用。

## 在项目目录中运行任务

定时任务默认以分离模式运行，不加载任何仓库——不加载 `AGENTS.md`、`CLAUDE.md` 或 `.cursorrules`，终端/文件/代码执行工具从网关启动时的工作目录开始运行。通过传递 `--workdir`（CLI）或 `workdir=`（工具调用）来更改此设置：

```bash
# 独立 CLI（调度和提示词为位置参数）
hermes cron create "every 1d at 09:00" \
  "审计待处理的PR，总结CI健康状况，并发布到#eng" \
  --workdir /home/me/projects/acme
```

```python
# 通过聊天，通过 cronjob 工具
cronjob(
    action="create",
    schedule="every 1d at 09:00",
    workdir="/home/me/projects/acme",
    prompt="审计待处理的PR，总结CI健康状况，并发布到#eng",
)
```

当设置了 `workdir` 时：

- 该目录下的 `AGENTS.md`、`CLAUDE.md` 和 `.cursorrules` 将被注入系统提示词（发现顺序与交互式CLI相同）
- `terminal`、`read_file`、`write_file`、`patch`、`search_files` 和 `execute_code` 都以该目录作为工作目录（通过 `TERMINAL_CWD`）
- 路径必须是存在的绝对目录——在创建/更新时拒绝相对路径和缺失的目录
- 在编辑时传递 `--workdir ""`（或通过工具传递 `workdir=""`）以清除它并恢复旧行为

:::note 序列化
带有 `workdir` 的任务在调度器时间片上顺序运行，而不是在并行池中运行。这是有意为之的——`TERMINAL_CWD` 是进程全局的，因此两个 workdir 任务同时运行会相互破坏对方的 cwd。无 workdir 的任务仍然像以前一样并行运行。
:::

## 在特定配置文件中运行定时任务

默认情况下，定时任务继承创建它的网关/CLI所拥有的 Hermes 配置文件。传递 `--profile <name>`（CLI）或 `profile=`（cronjob 工具）可以将任务重新定向到不同的配置文件——调度器解析该配置文件的 `HERMES_HOME`，在运行期间临时切换到该配置文件，加载其 `.env` + `config.yaml`，并在那里执行任务：

```bash
# 将任务固定到 `night-ops` 配置文件，无论其在何处被调度
hermes cron create "every 1d at 03:00" \
  "跟踪安全日志并标记异常" \
  --profile night-ops
```

```python
# 通过聊天，通过 cronjob 工具
cronjob(
    action="create",
    schedule="every 1d at 03:00",
    prompt="跟踪安全日志并标记异常",
    profile="night-ops",
)
```

使用 `--profile default` 可以明确固定到根 Hermes 配置文件。指定的配置文件必须已存在；调度器不会动态创建配置文件。要在 `cron edit` 期间清除配置文件固定，传递一个空字符串（`--profile ""` 或 `profile=""`）——任务将恢复到在调度器本身所在的配置文件中运行。

如果固定的配置文件后来被删除，调度器会记录警告并回退到在其当前配置文件中运行任务，而不是崩溃——因此过时的 `profile` 引用永远不会卡住任务。

:::note 序列化
设置了 `profile` 的任务也按顺序运行，原因与 `workdir` 固定的任务相同：切换 `HERMES_HOME` 是一个进程全局的突变，因此两个配置文件固定的任务并行运行会相互竞争。未固定的任务仍然在正常的并行池中运行。
:::

## 编辑任务

你不需要为了更改任务而删除并重新创建它们。

:::tip 任务引用
下面的 `<job_id>` 占位符（以及在[生命周期操作](#生命周期操作)中）也可以接受任务的名称（不区分大小写）——当你记得 `morning-digest` 但不记得十六进制 ID 时很方便。精确的任务 ID 优先于名称匹配；如果引用不是 ID 且名称匹配多个任务，命令将拒绝并打印候选 ID 以便你进行区分。
:::

### 聊天

```bash
/cron edit <job_id> --schedule "every 4h"
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

注意事项：

- 重复的 `--skill` 会替换任务附加的技能列表
- `--add-skill` 将追加到现有列表而不替换它
- `--remove-skill` 移除特定的附加技能
- `--clear-skills` 移除所有附加技能

## 生命周期操作

定时任务现在拥有了比创建/删除更完整的生命周期。

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
- `resume` — 重新启用任务并计算下一次运行时间
- `run` — 在下一个调度器时间片触发任务
- `remove` — 完全删除它

## 工作原理

**定时任务执行由网关守护进程处理。** 网关每60秒触发一次调度器，在隔离的智能体会话中运行所有到期的任务。

```bash
hermes gateway install     # 安装为用户服务
sudo hermes gateway install --system   # Linux：为服务器安装开机自启的系统服务
hermes gateway             # 或者在前台运行

hermes cron list
hermes cron status
```

### 网关调度器行为

在每个时间片上，Hermes：

1. 从 `~/.hermes/cron/jobs.json` 加载任务
2. 根据当前时间检查 `next_run_at`
3. 为每个到期的任务启动一个新的 `AIAgent` 会话
4. 可选地将一个或多个附加技能注入该新会话
5. 运行提示词直至完成
6. 交付最终响应
7. 更新运行元数据和下一个调度时间

`~/.hermes/cron/.tick.lock` 处的文件锁可以防止重叠的调度器时间片重复运行同一任务批次。

## 交付选项

调度任务时，你可以指定输出发送到哪里：

| 选项 | 描述 | 示例 |
|--------|-------------|---------|
| `"origin"` | 返回到任务创建的地方 | 在消息平台上的默认值 |
| `"local"` | 仅保存到本地文件 (`~/.hermes/cron/output/`) | CLI 上的默认值 |
| `"telegram"` | Telegram 主频道 | 使用 `TELEGRAM_HOME_CHANNEL` |
| `"telegram:123456"` | 通过 ID 指定 Telegram 聊天 | 直接交付 |
| `"telegram:-100123:17585"` | 指定 Telegram 话题 | `chat_id:thread_id` 格式 |
| `"discord"` | Discord 主频道 | 使用 `DISCORD_HOME_CHANNEL` |
| `"discord:#engineering"` | 指定 Discord 频道 | 通过频道名称 |
| `"slack"` | Slack 主频道 | |
| `"whatsapp"` | WhatsApp 主频道 | |
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
| `"qqbot"` | QQ 机器人 (腾讯QQ) | |
| `"all"` | 扇出到每个连接的主频道 | 在触发时解析 |
| `"telegram,discord"` | 扇出到特定的一组频道 | 逗号分隔列表 |
| `"origin,all"` | 交付到原始聊天 **并** 其他所有连接的频道 | 组合任何令牌 |

智能体的最终响应会自动交付。你无需在定时任务提示词中调用 `send_message`。

### 路由意图 (`all`)

`all` 让你可以将一个定时任务发送到你配置的每个消息频道，而无需逐一枚举它们的名称。它**在触发时解析**，因此在你配置好 Telegram 之前创建的任务，在你设置 `TELEGRAM_HOME_CHANNEL` 后的下一个时间片上就会自动包含 Telegram。

语义：`all` 扩展到每个已配置主频道的平台。零个平台也可以；任务只是不产生交付目标，并在上游记录为交付失败。

`all` 可以与显式目标组合。`origin,all` 交付到原始聊天*并*其他所有连接的主频道，通过 `(platform, chat_id, thread_id)` 进行去重。

### Telegram 定时任务话题 (`TELEGRAM_CRON_THREAD_ID`)

当 Telegram 话题模式启用时，根 DM 被保留为系统大厅——发送到那里的回复会被大厅提醒驳回，并且 `reply_to_message_id` 会被丢弃，因此你无法回复落入主聊天的定时任务消息。

将定时任务指向一个专门的话题：

1. 在 Telegram 中，打开机器人 DM 并创建一个话题，例如命名为 `Cron`。长按话题标题 → **复制链接**；末尾的整数就是话题的 `message_thread_id`。
2. 在你的 `.env` 中设置 `TELEGRAM_CRON_THREAD_ID=<那个ID>`。

这仅适用于定时任务交付。`TELEGRAM_HOME_CHANNEL_THREAD_ID`（用于其他地方，例如重启通知）保持不变。显式的 `deliver="telegram:chat_id:thread_id"` 目标继续优先于环境变量。对定时任务消息的回复现在会到达现有的话题会话中，因此你可以直接对它们进行操作。

### 响应包装

默认情况下，交付的定时任务输出会被包装在一个页眉和页脚中，以便收件人知道它来自定时任务：

```
Cronjob Response: 早间信息
-------------

<智能体输出在此>

注意：智能体无法看到此消息，因此无法对其做出响应。
```

要交付原始的智能体输出而不带包装，将 `cron.wrap_response` 设置为 `false`：

```yaml
# ~/.hermes/config.yaml
cron:
  wrap_response: false
```

### 静默抑制

如果智能体的最终响应以 `[SILENT]` 开头，交付将被完全抑制。输出仍会在本地保存以供审计（在 `~/.hermes/cron/output/` 中），但不会向交付目标发送任何消息。

这对于仅应在出现问题时才报告的监控任务非常有用：

```text
检查 nginx 是否正在运行。如果一切正常，请仅用 [SILENT] 回应。
否则，报告该问题。
```

无论 `[SILENT]` 标记如何，失败的任务始终会交付——只有成功的运行才能被静默。

## 脚本超时

通过 `script` 参数附加的预运行脚本，默认超时时间为 120 秒。如果你的脚本需要更长时间——例如，包含避免类似机器人计时模式的随机延迟——你可以增加此时间：

```yaml
# ~/.hermes/config.yaml
cron:
  script_timeout_seconds: 300   # 5 分钟
```

或设置 `HERMES_CRON_SCRIPT_TIMEOUT` 环境变量。解决顺序为：环境变量 → config.yaml → 默认的 120 秒。

## 无智能体模式（纯脚本任务）

对于不需要大语言模型推理的周期性任务——例如经典的看门狗、磁盘/内存告警、心跳、CI 探针——在创建时传递 `no_agent=True`。调度器将按计划运行你的脚本，并直接投递其标准输出，完全跳过智能体：

```bash
hermes cron create "every 5m" \
  --no-agent \
  --script memory-watchdog.sh \
  --deliver telegram \
  --name "memory-watchdog"
```

语义：

-   脚本标准输出（经修剪）→ 原样作为消息投递。
-   **空标准输出 → 静默滴答**，不进行投递。这就是看门狗模式："仅在出现问题时才报告"。
-   非零退出或超时 → 会投递一个错误警报，因此损坏的看门狗不会静默失败。
-   最后一行出现 `{"wakeAgent": false}` → 静默滴答（与大语言模型任务使用的门控相同）。
-   无 tokens，无模型，无提供商回退——任务完全不接触推理层。

`.sh` / `.bash` 文件在 `/bin/bash` 下运行；其他文件在当前 Python 解释器（`sys.executable`）下运行。脚本必须位于 `~/.hermes/scripts/` 中（与预运行脚本门控的沙盒规则相同）。

### 智能体为你设置这些

`cronjob` 工具的模式直接向 Hermes 暴露了 `no_agent`，因此你可以在聊天中描述一个看门狗，并让智能体将其配置好：

```text
如果 RAM 使用率超过 85%，每 5 分钟通过 Telegram 通知我。
```

Hermes 将通过 `write_file` 将检查脚本写入 `~/.hermes/scripts/`，然后调用：

```python
cronjob(action="create", schedule="every 5m",
        script="memory-watchdog.sh", no_agent=True,
        deliver="telegram", name="memory-watchdog")
```

当消息内容完全由脚本决定时（看门狗、阈值告警、心跳），它会自动选择 `no_agent=True`。同一个工具还允许智能体暂停、恢复、编辑和删除任务——因此整个生命周期都是通过聊天驱动的，无需任何人接触命令行。

参见[纯脚本定时任务指南](/guides/cron-script-only)获取实际示例。

## 使用 `context_from` 链接任务

定时任务（Cron jobs）在隔离的会话中运行，不保留先前运行的任何记忆。但有时，一个任务的输出正好是另一个任务所需的输入。`context_from` 参数会自动建立这种连接——任务 B 的提示词会在运行时自动获得任务 A 最新输出的上下文。

```python
# 任务 1: 收集原始数据
cronjob(
    action="create",
    prompt="获取 Hacker News 上前 10 条 AI/ML 故事。将它们保存到 ~/.hermes/data/briefs/raw.md，采用 Markdown 格式，包含标题、URL 和评分。",
    schedule="0 7 * * *",
    name="AI 新闻收集器",
)

# 任务 2: 分类 — 接收任务 1 的输出作为上下文
# 从以下位置获取任务 1 的 ID: cronjob(action="list")
cronjob(
    action="create",
    prompt="读取 ~/.hermes/data/briefs/raw.md。根据互动潜力和新颖性为每个故事评分 1-10。将前 5 名输出到 ~/.hermes/data/briefs/ranked.md。",
    schedule="30 7 * * *",
    context_from="<job1_id>",
    name="AI 新闻分类",
)

# 任务 3: 发布 — 接收任务 2 的输出作为上下文
cronjob(
    action="create",
    prompt="读取 ~/.hermes/data/briefs/ranked.md。撰写 3 条推文草稿（引子 + 正文 + 标签）。发送至 telegram:7976161601。",
    schedule="0 8 * * *",
    context_from="<job2_id>",
    name="AI 新闻简报",
)
```

**工作原理：**

- 当任务 2 触发时，Hermes 会从 `~/.hermes/cron/output/{job1_id}/*.md` 读取任务 1 的最新输出。
- 该输出会自动添加到任务 2 的提示词前面作为上下文。
- 任务 2 无需硬编码“读取此文件” — 它作为上下文接收内容。
- 链可以是任意长度：任务 1 → 任务 2 → 任务 3 → ...

**`context_from` 接受的格式：**

| 格式 | 示例 |
|--------|---------|
| 单个任务 ID（字符串） | `context_from="a1b2c3d4"` |
| 多个任务 ID（列表） | `context_from=["job_a", "job_b"]` |

输出按列出的顺序连接。

**何时使用：**

- 多阶段流水线（收集 → 过滤 → 格式化 → 投递）
- 依赖型任务，其中步骤 N 的工作依赖于步骤 N-1 的输出
- 扇出/扇入模式，其中一个任务汇总多个其他任务的结果

## 提供商恢复机制

定时任务会继承您配置的备用提供商和凭证池轮换。如果主 API 密钥被限速或提供商返回错误，定时智能体可以：

- **回退到备用提供商**，如果您在 `config.yaml` 中配置了 `fallback_providers`（或旧版 `fallback_model`）
- **轮换到下一个凭证**，针对同一提供商的[凭证池](/user-guide/configuration#credential-pool-strategies)

这意味着高频运行或在高峰时段运行的定时任务更具弹性 — 单个被限速的密钥不会导致整个运行失败。

## 调度格式

智能体的最终响应会自动投递 — 您**无需**在定时提示词中包含指向同一目标的 `send_message`。如果定时运行调用 `send_message` 指向调度程序已要投递的精确目标，Hermes 会跳过该重复发送，并告诉模型将面向用户的内容放在最终响应中。仅当需要向其他或不同目标发送时，才使用 `send_message`。

### 相对延迟（一次性）

```text
30m     → 30 分钟后运行一次
2h      → 2 小时后运行一次
1d      → 1 天后运行一次
```

### 时间间隔（重复）

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
2026-03-15T09:00:00    → 一次性，2026年3月15日上午9:00
```

## 重复行为

| 调度类型 | 默认重复次数 | 行为 |
|--------------|----------------|----------|
| 一次性（`30m`，时间戳） | 1 | 运行一次 |
| 间隔（`every 2h`） | 永久 | 运行直到移除 |
| Cron 表达式 | 永久 | 运行直到移除 |

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

对于 `update`，传入 `skills=[]` 以移除所有已附加的技能。

## 定时任务可用的工具集

定时运行在每个任务中都使用一个全新的智能体会话，不附加聊天平台。默认情况下，定时智能体获得的是**您在 `hermes tools` 中为 `cron` 平台配置的工具集** — 不是 CLI 默认值，也不是所有东西。

```bash
hermes tools
# → 在 curses 界面中选择 "cron" 平台
# → 像为 Telegram/Discord 等切换工具集一样进行开关切换。
```

通过 `cronjob.create`（或通过 `cronjob.update` 更新现有任务）上的 `enabled_toolsets` 字段，可以实现更精细的每任务控制：

```text
cronjob(action="create", name="weekly-news-summary",
        schedule="every sunday 9am",
        enabled_toolsets=["web", "file"],      # 仅限网络 + 文件，无终端/浏览器等。
        prompt="总结本周的 AI 新闻: ...")
```

当在任务上设置了 `enabled_toolsets` 时，它优先；否则 `hermes tools` 的 cron 平台配置优先；否则 Hermes 回退到内置默认值。这对成本控制很重要：将 `moa`、`browser`、`delegation` 等带入每个微小的“获取新闻”任务，会在每次 LLM 调用时膨胀工具模式提示词。

### 完全跳过智能体：`wakeAgent`

如果您的定时任务附加了预检脚本（通过 `script=`），该脚本可以在运行时决定 Hermes 是否应该调用智能体。输出如下形式的最终标准输出行：

```text
{"wakeAgent": false}
```

…并且 cron 将为此次运行完全跳过智能体运行。对于频繁轮询（每 1-5 分钟）非常有用，这些轮询仅在状态实际改变时才需要唤醒 LLM — 否则您会为一遍遍空内容的智能体回合付费。

```python
# 预检脚本
import json, sys
latest = fetch_latest_issue_count()
prev = read_state("issue_count")
if latest == prev:
    print(json.dumps({"wakeAgent": False}))   # 跳过此次运行
    sys.exit(0)
write_state("issue_count", latest)
print(json.dumps({"wakeAgent": True, "context": {"new_issues": latest - prev}}))
```

当省略 `wakeAgent` 时，默认值为 `true`（像往常一样唤醒智能体）。

#### 方案：廉价的预运行门槛

`wakeAgent` 门槛为您提供了一种零成本方式来决定计划任务是否应花费任何 LLM 令牌。三种模式覆盖了大多数用例。

**文件更改门槛** — 仅在监视的文件自上次成功运行以来有新内容时才运行。调度程序记录每个任务的 `last_run_at`；将其与文件的修改时间进行比较。

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
        prompt="新的 ~/data/feed.json 已到达。总结变更内容。")
```

**外部标志门槛** — 仅在其他进程发出就绪信号时才运行（例如，部署钩子生成文件，CI 作业在您的状态存储中设置值）。

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
        prompt="运行今日批次的夜间分析。")
```

**SQL 计数门槛** — 仅在您自己的数据库中有新行需要处理时才运行。脚本还可以通过 `context` 将计数传递给智能体，以便智能体知道要处理多少数据，而无需重新查询。

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

同样的模式适用于任何可以从脚本查询的数据源 — Postgres、HTTP API、您自己的状态存储 — 无需将 SQL 求值器嵌入 cron 子系统。

:::tip
Hermes 自己的 `~/.hermes/state.db` 是一个在版本之间变化的内部架构。不要从预运行门槛查询它 — 请指向您自己的数据库或信息源。
:::

致谢：此方案集由 @iankar8 在 [#2654](https://github.com/NousResearch/hermes-agent/pull/2654) 中的探索所促成，该提案提出了添加 sql/file/command 触发器作为并行机制。`script` + `wakeAgent` 门槛已经以零成本覆盖了所有三种情况，因此该工作最终以文档形式落地。

### 链接任务：`context_from`

定时任务可以通过在 `context_from` 中列出一个或多个其他任务的名称（或 ID）来使用它们最近一次成功的输出：

```text
cronjob(action="create", name="daily-digest",
        schedule="every day 7am",
        context_from=["ai-news-fetch", "github-prs-fetch"],
        prompt="使用上述输出撰写每日摘要。")
```

所引用的任务的最近一次完成的输出会作为本次运行的上下文注入到提示词上方。每个上游条目必须是有效的任务 ID 或名称（参见 `cronjob action="list"`）。注意：链接读取的是*最近一次完成*的输出 — 它不会等待同一运行中正在运行的上游任务。

## 任务存储

任务存储于 `~/.hermes/cron/jobs.json`。任务运行的输出保存至 `~/.hermes/cron/output/{job_id}/{timestamp}.md`。

任务可将 `model` 和 `provider` 字段存储为 `null`。当这些字段被省略时，Hermes 会在执行时根据全局配置解析它们。它们仅在设置了单任务覆盖时才会出现在任务记录中。

存储使用原子文件写入，因此中断的写入不会留下部分写入的任务文件。

## 自包含的提示词仍然重要

:::warning 重要
定时任务在全新的智能体会话中运行。提示词必须包含智能体所需的一切内容，这些内容不是由已附加的技能提供的。
:::

**错误示例：** `"Check on that server issue"`

**正确示例：** `"SSH into server 192.168.1.100 as user 'deploy', check if nginx is running with 'systemctl status nginx', and verify https://example.com returns HTTP 200."`

## 安全性

定时任务的提示词在创建和更新时会接受提示词注入和凭证外泄模式的扫描。包含不可见 Unicode 技巧、SSH 后门尝试或明显秘密外泄载荷的提示词将被阻止。