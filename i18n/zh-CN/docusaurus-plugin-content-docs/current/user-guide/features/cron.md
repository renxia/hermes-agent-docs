---
sidebar_position: 5
title: "定时任务（Cron）"
description: "使用自然语言安排自动化任务，通过一个 cron 工具进行管理，并附加一个或多个技能"
---

# 定时任务（Cron）

任务可以通过自然语言或 cron 表达式安排自动运行。Hermes 通过单个 `cronjob` 工具暴露了 cron 管理功能，并采用操作式操作（action-style operations），而不是使用单独的 schedule/list/remove 工具。

## Cron 当前功能

Cron 任务可以：

- 安排一次性或周期性任务
- 暂停、恢复、编辑、触发和删除任务
- 为任务附加零个、一个或多个技能
- 将结果发送回源聊天、本地文件或配置的平台目标
- 在带有正常静态工具列表的新代理会话中运行

:::warning
Cron 运行会话不能递归创建更多 cron 任务。Hermes 在 cron 执行内部禁用 cron 管理工具，以防止失控的调度循环。
:::

## 创建定时任务

### 在聊天中使用 `/cron`

```bash
/cron add 30m "提醒我检查构建"
/cron add "every 2h" "检查服务器状态"
/cron add "every 1h" "总结新的信息流项目" --skill blogwatcher
/cron add "every 1h" "使用两个技能并组合结果" --skill blogwatcher --skill find-nearby
```

### 从独立 CLI 使用

```bash
hermes cron create "every 2h" "检查服务器状态"
hermes cron create "every 1h" "总结新的信息流项目" --skill blogwatcher
hermes cron create "every 1h" "使用两个技能并组合结果" \
  --skill blogwatcher \
  --skill find-nearby \
  --name "技能组合"
```

### 通过自然对话

正常询问 Hermes：

```text
每天早上 9 点，检查 Hacker News 的 AI 新闻，并在 Telegram 上给我发送一份摘要。
```

Hermes 将在内部使用统一的 `cronjob` 工具。

## 技能支持的定时任务

一个定时任务在运行提示之前可以加载一个或多个技能。

### 单个技能

```python
cronjob(
    action="create",
    skill="blogwatcher",
    prompt="检查配置的信息流并总结任何新内容。",
    schedule="0 9 * * *",
    name="早间信息流",
)
```

### 多个技能

技能是按顺序加载的。提示内容成为叠加在这些技能之上的任务指令。

```python
cronjob(
    action="create",
    skills=["blogwatcher", "find-nearby"],
    prompt="查找新的本地活动和有趣的附近地点，然后将它们组合成一份简短的简报。",
    schedule="every 6h",
    name="本地简报",
)
```

当您希望安排的代理继承可重用工作流，而无需将完整的技能文本塞入 cron 提示本身时，这非常有用。

## 编辑任务

您不需要删除和重新创建任务来更改它们。

### 聊天

```bash
/cron edit <job_id> --schedule "every 4h"
/cron edit <job_id> --prompt "使用修改后的任务"
/cron edit <job_id> --skill blogwatcher --skill find-nearby
/cron edit <job_id> --remove-skill blogwatcher
/cron edit <job_id> --clear-skills
```

### 独立 CLI

```bash
hermes cron edit <job_id> --schedule "every 4h"
hermes cron edit <job_id> --prompt "使用修改后的任务"
hermes cron edit <job_id> --skill blogwatcher --skill find-nearby
hermes cron edit <job_id> --add-skill find-nearby
hermes cron edit <job_id> --remove-skill blogwatcher
hermes cron edit <job_id> --clear-skills
```

注意：

- 重复的 `--skill` 会替换任务附加的技能列表
- `--add-skill` 会追加到现有列表，不会替换它
- `--remove-skill` 会移除特定的附加技能
- `--clear-skills` 会移除所有附加技能

## 生命周期操作

定时任务现在拥有比仅创建/删除更完整的生命周期。

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

- `pause` — 保留任务，但停止调度它
- `resume` — 重新启用任务并计算下一个未来的运行时间
- `run` — 在下一个调度器滴答（tick）时触发任务
- `remove` — 彻底删除任务

## 工作原理

**Cron 执行由网关守护程序处理。** 网关每 60 秒滴答一次调度器，并在隔离的代理会话中运行任何到期的任务。

```bash
hermes gateway install     # 安装为用户服务
sudo hermes gateway install --system   # Linux：服务器的启动时系统服务
hermes gateway             # 或在前台运行

hermes cron list
hermes cron status
```

### 网关调度器行为

在每次滴答时，Hermes 会：

1. 从 `~/.hermes/cron/jobs.json` 加载任务
2. 将 `next_run_at` 与当前时间进行比较
3. 为每个到期的任务启动一个新的 `AIAgent` 会话
4. 可选地将一个或多个附加技能注入到该新会话中
5. 运行提示直到完成
6. 发送最终响应
7. 更新运行元数据和下一个计划时间

在 `~/.hermes/cron/.tick.lock` 的文件锁可以防止重叠的调度器滴答重复运行相同的任务批次。

## 交付选项

任务调度时，您需要指定输出的去向：

| 选项 | 描述 | 示例 |
|--------|-------------|---------|
| `"origin"` | 发回任务创建的源头 | 消息平台默认 |
| `"local"` | 仅保存到本地文件 (`~/.hermes/cron/output/`) | CLI 默认 |
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
| `"sms"` | 通过 Twilio 的短信 | |
| `"homeassistant"` | Home Assistant | |
| `"dingtalk"` | 钉钉 | |
| `"feishu"` | 飞书/Lark | |
| `"wecom"` | 企业微信 | |
| `"weixin"` | 微信 | |
| `"bluebubbles"` | BlueBubbles (iMessage) | |
| `"qqbot"` | QQ Bot (腾讯 QQ) | |

代理的最终响应会自动交付。您不需要在 cron 提示中调用 `send_message`。

### 响应包装

默认情况下，交付的 cron 输出会用头部和尾部进行包装，以便接收方知道它来自一个定时任务：

```
Cronjob Response: Morning feeds
-------------

<agent output here>

注意：代理看不到此消息，因此无法回复。
```

要交付原始的代理输出而不带包装，请将 `cron.wrap_response` 设置为 `false`：

```yaml
# ~/.hermes/config.yaml
cron:
  wrap_response: false
```

### 静音抑制

如果代理的最终响应以 `[SILENT]` 开头，则完全抑制交付。输出仍然会保存在本地用于审计（在 `~/.hermes/cron/output/`），但不会向交付目标发送消息。

这对于监控那些只有在出现问题时才应该报告的任务非常有用：

```text
检查 nginx 是否正在运行。如果一切正常，则只回复 [SILENT]。
否则，报告问题。
```

失败的任务无论是否包含 `[SILENT]` 标记都会交付——只有成功的运行可以被静音。

## 脚本超时

预运行脚本（通过 `script` 参数附加）的默认超时时间为 120 秒。如果您的脚本需要更长的时间——例如，包含随机延迟以避免机器人式的定时模式——您可以增加此值：

```yaml
# ~/.hermes/config.yaml
cron:
  script_timeout_seconds: 300   # 5 分钟
```

或者设置 `HERMES_CRON_SCRIPT_TIMEOUT` 环境变量。解决顺序是：环境变量 → config.yaml → 120秒默认值。

## 提供商恢复

定时任务会继承您配置的备用提供商和凭证池轮换。如果主要 API 密钥达到速率限制或提供商返回错误，cron 代理可以：

- **回退到备用提供商**，如果您在 `config.yaml` 中配置了 `fallback_providers`（或旧的 `fallback_model`）
- **轮换到同一提供商的下一个凭证**（在 [credential pool](/docs/user-guide/configuration#credential-pool-strategies) 中）

这意味着高频率或高峰时段运行的定时任务更具弹性——单个达到速率限制的密钥不会导致整个运行失败。

## 调度格式

代理的最终响应会自动交付——您**不需要**在 cron 提示中为相同的目标包含 `send_message`。如果一次 cron 运行调用了发送到调度器已经会交付的精确目标，Hermes 将跳过重复发送，并指示模型将面向用户的内容放入最终响应中。仅当需要附加或不同的目标时，才使用 `send_message`。

### 相对延迟（一次性）

```text
30m     → 30 分钟后运行一次
2h      → 2 小时后运行一次
1d      → 1 天后运行一次
```

### 间隔（周期性）

```text
every 30m    → 每 30 分钟运行一次
every 2h     → 每 2 小时运行一次
every 1d     → 每天运行一次
```

### Cron 表达式

```text
0 9 * * *       → 每天上午 9:00
0 9 * * 1-5     → 工作日上午 9:00
0 */6 * * *     → 每 6 小时
30 8 1 * *      → 每月 1 号上午 8:30
0 0 * * 0       → 每周日午夜
```

### ISO 时间戳

```text
2026-03-15T09:00:00    → 2026 年 3 月 15 日上午 9:00 一次性运行
```

## 重复行为

| 调度类型 | 默认重复 | 行为 |
|--------------|----------------|----------|
| 一次性 (`30m`, 时间戳) | 1 | 运行一次 |
| 间隔 (`every 2h`) | forever | 运行直到删除 |
| Cron 表达式 | forever | 运行直到删除 |

您可以覆盖它：

```python
cronjob(
    action="create",
    prompt="...",
    schedule="every 2h",
    repeat=5,
)
```

## 编程管理任务

面向代理的 API 是一个工具：

```python
cronjob(action="create", ...)
cronjob(action="list")
cronjob(action="update", job_id="...")
cronjob(action="pause", job_id="...")
cronjob(action="resume", job_id="...")
cronjob(action="run", job_id="...")
cronjob(action="remove", job_id="...")
```

对于 `update`，请传递 `skills=[]` 以移除所有附加的技能。

## 任务存储

任务存储在 `~/.hermes/cron/jobs.json`。任务运行的输出保存在 `~/.hermes/cron/output/{job_id}/{timestamp}.md`。

该存储使用原子文件写入，因此中断的写入不会留下部分写入的任务文件。

## 自包含的提示仍然重要

:::warning 重要
定时任务在一个全新的代理会话中运行。提示内容必须包含代理所需的所有内容，而这些内容不能由附加的技能提供。
:::

**差：** `"检查那个服务器问题"`

**好：** `"以用户 'deploy' 的身份通过 'systemctl status nginx' SSH 到服务器 192.168.1.100，并验证 https://example.com 是否返回 HTTP 200。"`

## 安全性

定时任务提示在创建和更新时会扫描提示注入和凭证泄露模式。包含不可见 Unicode 技巧、SSH 后门尝试或明显的秘密泄露载荷的提示将被阻止。