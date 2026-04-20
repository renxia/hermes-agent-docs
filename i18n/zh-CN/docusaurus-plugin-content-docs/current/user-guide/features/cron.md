---
sidebar_position: 5
title: "计划任务 (Cron)"
description: "使用自然语言安排自动化任务，通过一个 cron 工具进行管理，并可附加一个或多个技能"
---

# 计划任务 (Cron)

使用自然语言或 cron 表达式安排自动运行的任务。Hermes 通过单一的 `cronjob` 工具暴露 cron 管理功能，采用操作式接口而非独立的 schedule/list/remove 工具。

## Cron 当前支持的功能

Cron 作业可以：

- 安排一次性或周期性任务
- 暂停、恢复、编辑、触发和删除作业
- 为作业附加零个、一个或多个技能
- 将结果返回至原始聊天窗口、本地文件或配置的平台目标
- 在全新的代理会话中运行，使用正常的静态工具列表

:::warning
Cron 运行时无法递归创建新的 cron 作业。Hermes 在 cron 执行过程中禁用 cron 管理工具，以防止无限调度循环。
:::

## 创建计划任务

### 在聊天中使用 `/cron`

```bash
/cron add 30m "提醒我检查构建状态"
/cron add "every 2h" "检查服务器状态"
/cron add "every 1h" "总结新推送项" --skill blogwatcher
/cron add "every 1h" "同时使用两个技能并合并结果" --skill blogwatcher --skill maps
```

### 使用独立 CLI

```bash
hermes cron create "every 2h" "检查服务器状态"
hermes cron create "every 1h" "总结新推送项" --skill blogwatcher
hermes cron create "every 1h" "同时使用两个技能并合并结果" \
  --skill blogwatcher \
  --skill maps \
  --name "技能组合"
```

### 通过自然对话

正常向 Hermes 提问：

```text
每天早上9点，检查Hacker News上的AI新闻，并在Telegram上发送给我摘要。
```

Hermes 将在内部使用统一的 `cronjob` 工具。

## 基于技能的 cron 作业

Cron 作业可以在运行提示词前加载一个或多个技能。

### 单个技能

```python
cronjob(
    action="create",
    skill="blogwatcher",
    prompt="检查已配置的订阅源并总结任何新内容。",
    schedule="0 9 * * *",
    name="早晨推送",
)
```

### 多个技能

技能按顺序加载。提示词作为任务指令叠加在这些技能之上。

```python
cronjob(
    action="create",
    skills=["blogwatcher", "maps"],
    prompt="查找本地新活动及附近有趣地点，然后合并为一份简短简报。",
    schedule="every 6h",
    name="本地简报",
)
```

这在您希望计划代理继承可重用工作流而不将完整技能文本塞入 cron 提示词时非常有用。

## 编辑作业

无需删除再重新创建即可修改作业。

### 聊天界面

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

- 重复的 `--skill` 会替换作业的已附技能列表
- `--add-skill` 追加到现有列表而不替换它
- `--remove-skill` 移除特定已附技能
- `--clear-skills` 移除所有已附技能

## 生命周期操作

Cron 作业现在拥有比仅创建/删除更完整的生命周期。

### 聊天界面

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

功能说明：

- `pause` — 保留作业但停止调度
- `resume` — 重新启用作业并计算下一次运行时间
- `run` — 在下一次调度器滴答时触发作业
- `remove` — 完全删除

## 工作原理

**Cron 执行由网关守护进程处理。** 网关每60秒滴答一次调度器，在隔离的代理会话中运行任何到期作业。

```bash
hermes gateway install     # 安装为用户服务
sudo hermes gateway install --system   # Linux：服务器的开机系统服务
hermes gateway             # 或在后台运行

hermes cron list
hermes cron status
```

### 网关调度器行为

每次滴答时，Hermes：

1. 从 `~/.hermes/cron/jobs.json` 加载作业
2. 将 `next_run_at` 与当前时间比较
3. 为每个到期作业启动一个新的 `AIAgent` 会话
4. 可选地将一个或多个已附技能注入该新会话
5. 运行提示词直至完成
6. 交付最终响应
7. 更新运行元数据及下次计划时间

文件锁 `~/.hermes/cron/.tick.lock` 防止重叠的调度器滴答重复运行同一批作业。

## 投递选项

安排作业时可指定输出目的地：

| 选项 | 描述 | 示例 |
|--------|-------------|---------|
| `"origin"` | 返回至作业创建位置 | 消息平台默认值 |
| `"local"` | 仅保存至本地文件 (`~/.hermes/cron/output/`) | CLI 默认值 |
| `"telegram"` | Telegram 主频道 | 使用 `TELEGRAM_HOME_CHANNEL` |
| `"telegram:123456"` | 特定 Telegram 聊天（ID） | 直接投递 |
| `"telegram:-100123:17585"` | 特定 Telegram 主题 | `chat_id:thread_id` 格式 |
| `"discord"` | Discord 主频道 | 使用 `DISCORD_HOME_CHANNEL` |
| `"discord:#engineering"` | 特定 Discord 频道 | 按频道名称 |
| `"slack"` | Slack 主频道 | |
| `"whatsapp"` | WhatsApp 主频道 | |
| `"signal"` | Signal | |
| `"matrix"` | Matrix 主房间 | |
| `"mattermost"` | Mattermost 主频道 | |
| `"email"` | 电子邮件 | |
| `"sms"` | 短信（通过 Twilio） | |
| `"homeassistant"` | Home Assistant | |
| `"dingtalk"` | 钉钉 | |
| `"feishu"` | 飞书/Lark | |
| `"wecom"` | 企业微信 | |
| `"weixin"` | 微信（WeChat） | |
| `"bluebubbles"` | BlueBubbles (iMessage) | |
| `"qqbot"` | QQ 机器人（腾讯 QQ） | |

代理的最终响应会自动投递。您无需在 cron 提示词中调用 `send_message`。

### 响应包装

默认情况下，投递的 cron 输出会用标题和页脚包装，以便收件人知道它来自计划任务：

```
Cronjob Response: Morning feeds
-------------

<代理输出内容>

注意：代理无法看到此消息，因此无法对其作出响应。
```

要投递未经包装的原始代理输出，请将 `cron.wrap_response` 设为 `false`：

```yaml
# ~/.hermes/config.yaml
cron:
  wrap_response: false
```

### 静默抑制

如果代理的最终响应以 `[SILENT]` 开头，则完全抑制投递。输出仍会本地保存以供审计（在 `~/.hermes/cron/output/` 中），但不会向投递目标发送消息。

这对仅应在出现问题时报告的监控作业很有用：

```text
检查 nginx 是否正在运行。如果一切正常，仅响应 [SILENT]。
否则报告问题。
```

失败的作业始终会投递，无论 `[SILENT]` 标记如何——只有成功的运行可以被静默。

## 脚本超时

预运行脚本（通过 `script` 参数附加）默认超时为120秒。如果您的脚本需要更长时间——例如包含避免类机器人定时模式的随机延迟——您可以增加此设置：

```yaml
# ~/.hermes/config.yaml
cron:
  script_timeout_seconds: 300   # 5分钟
```

或设置环境变量 `HERMES_CRON_SCRIPT_TIMEOUT`。优先级顺序为：环境变量 → config.yaml → 120秒默认值。

## 提供商恢复

Cron 作业继承您配置的备用提供程序和凭据池轮换。如果主要 API 密钥被限流或提供商返回错误，cron 代理可以：

- **回退到备用提供商**（如果您在 `config.yaml` 中配置了 `fallback_providers` 或旧版 `fallback_model`）
- **轮换至同一提供商的下一个凭据**（来自[凭据池](/docs/user-guide/configuration#credential-pool-strategies)）

这意味着高频运行或在高峰时段运行的 cron 作业更具弹性——单个被限流的密钥不会导致整个运行失败。

## 计划格式

代理的最终响应会自动投递——您**不需要**在 cron 提示词中包含 `send_message` 来发送到同一目标。如果 cron 运行调用 `send_message` 到调度器将投递到的确切目标，Hermes 会跳过该重复发送，并指示模型将面向用户的内容放在最终响应中。仅对额外或不同的目标使用 `send_message`。

### 相对延迟（一次性）

```text
30m     → 30分钟后运行一次
2h      → 2小时后运行一次
1d      → 1天后运行一次
```

### 间隔（周期性）

```text
every 30m    → 每30分钟
every 2h     → 每2小时
every 1d     → 每天
```

### Cron 表达式

```text
0 9 * * *       → 每天上午9:00
0 9 * * 1-5     → 工作日每天上午9:00
0 */6 * * *     → 每6小时
30 8 1 * *      → 每月1日8:30
0 0 * * 0       → 每周日午夜
```

### ISO 时间戳

```text
2026-03-15T09:00:00    → 2026年3月15日上午9:00运行一次
```

## 重复行为

| 计划类型 | 默认重复 | 行为 |
|--------------|----------------|----------|
| 一次性 (`30m`, 时间戳) | 1 | 运行一次 |
| 间隔 (`every 2h`) | forever | 持续运行直至删除 |
| Cron 表达式 | forever | 持续运行直至删除 |

您可以覆盖此设置：

```python
cronjob(
    action="create",
    prompt="...",
    schedule="every 2h",
    repeat=5,
)
```

## 编程方式管理作业

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

对于 `update`，传递 `skills=[]` 可移除所有已附技能。

## 作业存储

作业存储在 `~/.hermes/cron/jobs.json` 中。作业运行的输出保存至 `~/.hermes/cron/output/{job_id}/{timestamp}.md`。

存储使用原子文件写入，因此中断的写入不会留下部分写入的作业文件。

## 自包含提示词仍然重要

:::warning 重要
Cron 作业在完全全新的代理会话中运行。提示词必须包含代理所需的所有内容，除非已由已附技能提供。
:::

**错误示例：** `"检查那个服务器问题"`

**正确示例：** `"以用户'deploy' SSH登录服务器192.168.1.100，使用'systemctl status nginx'检查nginx是否运行，并验证https://example.com返回HTTP 200。"`

## 安全性

计划任务提示词会在创建和更新时被扫描是否存在提示注入和凭据泄露模式。包含不可见Unicode技巧、SSH后门尝试或明显凭据泄露载荷的提示词会被阻止。