---
sidebar_position: 5
title: "计划任务 (Cron)"
description: "使用自然语言安排自动化任务，通过一个 cron 工具管理它们，并附加一个或多个技能"
---

# 计划任务 (Cron)

使用自然语言或 cron 表达式安排任务自动运行。Hermes 通过一个 `cronjob` 工具公开 cron 管理功能，该工具采用操作式方法，而不是单独的调度/列表/删除工具。

## cron 现在可以做什么

Cron 作业可以：

- 安排一次性或重复性任务
- 暂停、恢复、编辑、触发和删除作业
- 为作业附加零个、一个或多个技能
- 将结果传递回原始聊天、本地文件或配置的平台目标
- 在具有正常静态工具列表的新智能体会话中运行

:::warning
Cron 运行的会话无法递归创建更多 cron 作业。Hermes 会在 cron 执行期间禁用 cron 管理工具，以防止出现失控的调度循环。
:::

## 创建计划任务

### 在聊天中使用 `/cron`

```bash
/cron add 30m "提醒我检查构建状态"
/cron add "every 2h" "检查服务器状态"
/cron add "every 1h" "总结新订阅内容" --skill blogwatcher
/cron add "every 1h" "使用两个技能并合并结果" --skill blogwatcher --skill maps
```

### 使用独立 CLI

```bash
hermes cron create "every 2h" "检查服务器状态"
hermes cron create "every 1h" "总结新订阅内容" --skill blogwatcher
hermes cron create "every 1h" "使用两个技能并合并结果" \
  --skill blogwatcher \
  --skill maps \
  --name "技能组合"
```

### 通过自然对话

正常向 Hermes 提问：

```text
每天早上 9 点，检查 Hacker News 上的 AI 新闻并通过 Telegram 发送给我摘要。
```

Hermes 内部会使用统一的 `cronjob` 工具。

## 支持技能的计划任务

计划任务可以在运行提示词之前加载一个或多个技能。

### 单个技能

```python
cronjob(
    action="create",
    skill="blogwatcher",
    prompt="检查已配置的订阅源并总结任何新内容。",
    schedule="0 9 * * *",
    name="每日订阅摘要",
)
```

### 多个技能

技能按顺序加载。提示词成为叠加在这些技能之上的任务指令。

```python
cronjob(
    action="create",
    skills=["blogwatcher", "maps"],
    prompt="查找新的本地活动和有趣的附近地点，然后将它们合并成一个简短的摘要。",
    schedule="every 6h",
    name="本地简报",
)
```

当你希望计划智能体继承可复用的工作流，而不想将完整的技能文本塞入 cron 提示词本身时，这非常有用。

## 在项目目录中运行任务

计划任务默认与任何仓库分离运行 — 不会加载 `AGENTS.md`、`CLAUDE.md` 或 `.cursorrules`，终端 / 文件 / 代码执行工具从网关启动时的工作目录运行。传递 `--workdir`（CLI）或 `workdir=`（工具调用）来更改：

```bash
# 独立 CLI
hermes cron create --schedule "every 1d at 09:00" \
  --workdir /home/me/projects/acme \
  --prompt "审计开放的 PR，总结 CI 健康状况，并发布到 #eng"
```

```python
# 通过聊天，使用 cronjob 工具
cronjob(
    action="create",
    schedule="every 1d at 09:00",
    workdir="/home/me/projects/acme",
    prompt="审计开放的 PR，总结 CI 健康状况，并发布到 #eng",
)
```

当设置了 `workdir` 时：

- 该目录下的 `AGENTS.md`、`CLAUDE.md` 和 `.cursorrules` 会被注入系统提示词（与交互式 CLI 相同的发现顺序）
- `terminal`、`read_file`、`write_file`、`patch`、`search_files` 和 `execute_code` 都会使用该目录作为工作目录（通过 `TERMINAL_CWD`）
- 路径必须是存在的绝对目录 — 相对路径和缺失的目录在创建 / 更新时会被拒绝
- 编辑时传递 `--workdir ""`（或通过工具传递 `workdir=""`）以清除并恢复旧行为

:::note 序列化
带有 `workdir` 的任务在调度器滴答时按顺序运行，而不是在并行池中运行。这是有意为之 — `TERMINAL_CWD` 是进程全局的，因此两个 workdir 任务同时运行会相互破坏 cwd。无 workdir 的任务仍像以前一样并行运行。
:::

## 编辑任务

你无需为了更改任务而删除并重新创建。

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

注意：

- 重复的 `--skill` 会替换任务附带的技能列表
- `--add-skill` 会追加到现有列表而不替换
- `--remove-skill` 会移除特定的附带技能
- `--clear-skills` 会移除所有附带技能

## 生命周期操作

计划任务现在拥有比创建/删除更完整的生命周期。

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

- `pause` — 保留任务但停止调度
- `resume` — 重新启用任务并计算下一次运行时间
- `run` — 在下次调度器滴答时触发任务
- `remove` — 完全删除

## 工作原理

**计划任务执行由网关守护进程处理。** 网关每 60 秒滴答一次调度器，在隔离的智能体会话中运行任何到期的任务。

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
4. 可选地将一个或多个附带技能注入该新会话
5. 运行提示词直至完成
6. 发送最终响应
7. 更新运行元数据和下次计划时间

`~/.hermes/cron/.tick.lock` 处的文件锁防止重叠的调度器滴答重复运行同一批任务。

## 交付选项

调度任务时，你需指定输出去向：

| 选项 | 描述 | 示例 |
|--------|-------------|---------|
| `"origin"` | 返回任务创建位置 | 消息平台上的默认值 |
| `"local"` | 仅保存到本地文件 (`~/.hermes/cron/output/`) | CLI 上的默认值 |
| `"telegram"` | Telegram 主频道 | 使用 `TELEGRAM_HOME_CHANNEL` |
| `"telegram:123456"` | 指定 Telegram 聊天（通过 ID） | 直接交付 |
| `"telegram:-100123:17585"` | 指定 Telegram 主题 | `chat_id:thread_id` 格式 |
| `"discord"` | Discord 主频道 | 使用 `DISCORD_HOME_CHANNEL` |
| `"discord:#engineering"` | 指定 Discord 频道 | 通过频道名称 |
| `"slack"` | Slack 主频道 | |
| `"whatsapp"` | WhatsApp 主页 | |
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
| `"bluebubbles"` | BlueBubbles (iMessage) | |
| `"qqbot"` | QQ 机器人 (腾讯 QQ) | |

智能体的最终响应会自动交付。你无需在 cron 提示词中调用 `send_message`。

### 响应包装

默认情况下，交付的计划任务输出会被包装头部和尾部，以便接收者知道它来自计划任务：

```
计划任务响应：每日订阅摘要
-------------

<智能体输出>

注意：智能体无法看到此消息，因此无法对此作出响应。
```

要交付未经包装的原始智能体输出，请将 `cron.wrap_response` 设置为 `false`：

```yaml
# ~/.hermes/config.yaml
cron:
  wrap_response: false
```

### 静默抑制

如果智能体的最终响应以 `[SILENT]` 开头，则完全抑制交付。输出仍会本地保存以供审计（在 `~/.hermes/cron/output/` 中），但不会向交付目标发送消息。

这对于仅应在出现问题时才报告的监控任务很有用：

```text
检查 nginx 是否正在运行。如果一切正常，请仅响应 [SILENT]。
否则，请报告问题。
```

失败的任务始终会交付，无论是否有 `[SILENT]` 标记 — 只有成功的运行才能被静默。

## 脚本超时

运行前脚本（通过 `script` 参数附加）的默认超时为 120 秒。如果你的脚本需要更长时间 — 例如，包含随机延迟以避免类似机器人的时间模式 — 你可以增加此值：

```yaml
# ~/.hermes/config.yaml
cron:
  script_timeout_seconds: 300   # 5 分钟
```

或设置 `HERMES_CRON_SCRIPT_TIMEOUT` 环境变量。优先级顺序为：环境变量 → config.yaml → 120 秒默认值。

## 提供者恢复

计划任务继承你配置的备用提供者和凭据池轮换。如果主 API 密钥被限流或提供者返回错误，计划智能体可以：

- **回退到备用提供者**，如果你在 `config.yaml` 中配置了 `fallback_providers`（或传统的 `fallback_model`）
- **轮换到同一提供者的下一个凭据**，在你的[凭据池](/docs/user-guide/configuration#credential-pool-strategies)中

这意味着高频运行或在高峰时段运行的计划任务更具弹性 — 单个被限流的密钥不会导致整个运行失败。

## 调度格式

智能体的最终响应会自动交付 — 你**无需**在 cron 提示词中包含 `send_message` 以交付到同一目标。如果计划任务运行调用 `send_message` 到调度器将要交付的完全相同的目标，Hermes 会跳过该重复发送，并告诉模型将面向用户的内容放在最终响应中。仅对额外或不同的目标使用 `send_message`。

### 相对延迟（一次性）

```text
30m     → 30 分钟后运行一次
2h      → 2 小时后运行一次
1d      → 1 天后运行一次
```

### 间隔（重复）

```text
every 30m    → 每 30 分钟
every 2h     → 每 2 小时
every 1d     → 每天
```

### Cron 表达式

```text
0 9 * * *       → 每天上午 9:00
0 9 * * 1-5     → 工作日 上午 9:00
0 */6 * * *     → 每 6 小时
30 8 1 * *      → 每月第一天上午 8:30
0 0 * * 0       → 每周日午夜
```

### ISO 时间戳

```text
2026-03-15T09:00:00    → 2026 年 3 月 15 日上午 9:00 一次性运行
```

## 重复行为

| 调度类型 | 默认重复次数 | 行为 |
|--------------|----------------|----------|
| 一次性 (`30m`, 时间戳) | 1 | 仅运行一次 |
| 间隔 (`every 2h`) | 无限次 | 运行直至被移除 |
| Cron 表达式 | 无限次 | 运行直至被移除 |

您可以覆盖此行为：

```python
cronjob(
    action="create",
    prompt="...",
    schedule="every 2h",
    repeat=5,
)
```

## 以编程方式管理作业

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

对于 `update`，传递 `skills=[]` 以移除所有已附加的技能。

## 作业存储

作业存储在 `~/.hermes/cron/jobs.json` 中。作业运行的输出保存到 `~/.hermes/cron/output/{job_id}/{timestamp}.md`。

作业可能将 `model` 和 `provider` 存储为 `null`。当省略这些字段时，Hermes 会在执行时从全局配置中解析它们。仅当设置了每个作业的覆盖时，它们才会出现在作业记录中。

存储使用原子文件写入，因此中断的写入不会留下部分写入的作业文件。

## 自包含提示仍然重要

:::warning 重要
Cron 作业在完全全新的智能体会话中运行。提示必须包含智能体所需的一切，除了已由附加技能提供的内容。
:::

**错误示例：** `"检查那个服务器问题"`

**正确示例：** `"以用户 'deploy' 身份 SSH 登录到服务器 192.168.1.100，使用 'systemctl status nginx' 检查 nginx 是否正在运行，并验证 https://example.com 是否返回 HTTP 200。"`

## 安全性

在创建和更新时，系统会扫描计划任务提示，以查找提示注入和凭据泄露模式。包含不可见 Unicode 技巧、SSH 后门尝试或明显凭据泄露有效载荷的提示将被阻止。