---
sidebar_position: 12
title: "Cron 故障排除"
description: "诊断和修复常见的 Hermes cron 问题——任务未触发、交付失败、技能加载错误和性能问题"
---

# Cron 故障排除

当 cron 任务的行为不符合预期时，请按顺序执行以下检查。大多数问题可归为以下四类：时间设置、交付、权限或技能加载。

---

## 任务未触发

### 检查 1：验证任务是否存在且处于活动状态

```bash
hermes cron list
```

查找该任务，并确认其状态为 `[active]`（而不是 `[paused]` 或 `[completed]`）。如果显示 `[completed]`，则可能是重复次数已用尽——请编辑任务以重置它。

### 检查 2：确认计划时间是否正确

格式错误的计划时间会静默地默认设置为一次性任务，或直接被拒绝。请测试您的表达式：

| 您的表达式 | 应评估为 |
|----------------|-------------------|
| `0 9 * * *` | 每天上午 9:00 |
| `0 9 * * 1` | 每周一上午 9:00 |
| `every 2h` | 从现在开始的每 2 小时 |
| `30m` | 从现在开始的 30 分钟 |
| `2025-06-01T09:00:00` | 2025 年 6 月 1 日上午 9:00 UTC |

如果任务触发了一次后从列表中消失，这属于一次性计划（`30m`、`1d` 或 ISO 时间戳）——这是预期的行为。

### 检查 3：网关是否正在运行？

Cron 任务由网关的后台滴答线程触发，该线程每 60 秒滴答一次。常规的 CLI 聊天会话**不会**自动触发 cron 任务。

如果您期望任务自动触发，您需要一个正在运行的网关（`hermes gateway` 或 `hermes serve`）。对于一次性调试，您可以使用 `hermes cron tick` 手动触发一次滴答。

### 检查 4：检查系统时钟和时区

任务使用本地时区。如果您的机器时钟不正确或时区与预期不同，任务将在错误的时间触发。请验证：

```bash
date
hermes cron list   # 将 next_run 时间与本地时间进行比较
```

---

## 交付失败

### 检查 1：验证交付目标是否正确

交付目标是区分大小写的，并且需要配置正确的平台。配置错误的目标会静默地丢弃响应。

| 目标 | 需要 |
|--------|----------|
| `telegram` | `~/.hermes/.env` 中的 `TELEGRAM_BOT_TOKEN` |
| `discord` | `~/.hermes/.env` 中的 `DISCORD_BOT_TOKEN` |
| `slack` | `~/.hermes/.env` 中的 `SLACK_BOT_TOKEN` |
| `whatsapp` | 配置了 WhatsApp 网关 |
| `signal` | 配置了 Signal 网关 |
| `matrix` | 配置了 Matrix homeserver |
| `email` | `config.yaml` 中配置了 SMTP |
| `sms` | 配置了短信提供商 |
| `local` | 对 `~/.hermes/cron/output/` 有写入权限 |
| `origin` | 交付到创建任务的聊天中 |

其他支持的平台包括 `mattermost`、`homeassistant`、`dingtalk`、`feishu`、`wecom`、`weixin`、`bluebubbles`、`qqbot` 和 `webhook`。您也可以使用 `platform:chat_id` 语法定向到特定的聊天（例如：`telegram:-1001234567890`）。

如果交付失败，任务仍然会运行——只是不会发送到任何地方。请检查 `hermes cron list` 以查看更新的 `last_error` 字段（如果可用）。

### 检查 2：检查 `[SILENT]` 的使用

如果您的 cron 任务没有输出，或者代理响应为 `[SILENT]`，则交付被抑制了。这对于监控任务是故意的——但请确保您的提示没有意外地抑制所有内容。

如果提示包含“如果没有任何变化，则响应 [SILENT]”，它也会静默地吞掉非空响应。请检查您的条件逻辑。

### 检查 3：平台令牌权限

每个消息平台机器人都需要特定的权限才能接收消息。如果交付静默失败：

- **Telegram**: 机器人必须是目标群组/频道管理员
- **Discord**: 机器人必须有权在目标频道发送消息
- **Slack**: 机器人必须添加到工作区并具有 `chat:write` 范围

### 检查 4：响应包装

默认情况下，cron 响应会用头部和尾部进行包装（`config.yaml` 中的 `cron.wrap_response: true`）。某些平台或集成可能无法很好地处理这一点。要禁用此功能，请执行：

```yaml
cron:
  wrap_response: false
```

---

## 技能加载失败

### 检查 1：验证技能是否已安装

```bash
hermes skills list
```

技能必须安装后才能附加到 cron 任务。如果缺少技能，请先使用 `hermes skills install <skill-name>` 或在 CLI 中使用 `/skills` 进行安装。

### 检查 2：检查技能名称与技能文件夹名称

技能名称是区分大小写的，并且必须与已安装技能的文件夹名称匹配。如果您的任务指定了 `ai-funding-daily-report`，但技能文件夹是 `ai-funding-daily-report`，请从 `hermes skills list` 确认确切名称。

### 检查 3：需要交互式工具的技能

Cron 任务在禁用 `cronjob`、`messaging` 和 `clarify` 工具集的情况下运行。这可以防止递归 cron 创建、直接消息发送（交付由调度器处理）和交互式提示。如果某个技能依赖于这些工具集，它在 cron 环境中将无法工作。

请查阅技能文档，确认它可以在非交互式（无头）模式下工作。

### 检查 4：多技能排序

使用多个技能时，它们会按顺序加载。如果技能 A 依赖于技能 B 的上下文，请确保 B 先加载：

```bash
/cron add "0 9 * * *" "..." --skill context-skill --skill target-skill
```

在这个示例中，`context-skill` 会在 `target-skill` 之前加载。

---

## 任务错误和失败

### 检查 1：回顾最近的任务输出

如果任务运行失败，您可能会在以下位置看到错误上下文：

1. 任务交付的聊天中（如果交付成功）
2. `~/.hermes/logs/agent.log` 中的调度器消息（或 `errors.log` 中的警告）
3. 通过 `hermes cron list` 查看任务的 `last_run` 元数据

### 检查 2：常见的错误模式

**脚本的 "No such file or directory"**
`script` 路径必须是绝对路径（或相对于 Hermes 配置目录）。请验证：
```bash
ls ~/.hermes/scripts/your-script.py   # 必须存在
hermes cron edit <job_id> --script ~/.hermes/scripts/your-script.py
```

**任务执行时的 "Skill not found"**
该技能必须安装在运行调度器的机器上。如果您在机器之间移动，技能不会自动同步——请使用 `hermes skills install <skill-name>` 重新安装它们。

**任务运行但未交付任何内容**
这很可能是交付目标问题（参见上文“交付失败”）或静默抑制的响应（`[SILENT]`）。

**任务挂起或超时**
调度器使用基于不活动的超时机制（默认 600 秒，可通过 `HERMES_CRON_TIMEOUT` 环境变量配置，`0` 表示无限）。代理可以持续运行，只要它正在主动调用工具——计时器只在持续不活动后触发。长时间运行的任务应使用脚本来处理数据收集，并只交付结果。

### 检查 3：锁竞争

调度器使用基于文件的锁定机制来防止重叠的滴答。如果运行了两个网关实例（或 CLI 会话与网关冲突），任务可能会延迟或跳过。

杀死重复的网关进程：
```bash
ps aux | grep hermes
# 杀死重复进程，只保留一个
```

### 检查 4：jobs.json 的权限

任务存储在 `~/.hermes/cron/jobs.json`。如果此文件对您的用户不可读/可写，调度器将静默失败：

```bash
ls -la ~/.hermes/cron/jobs.json
chmod 600 ~/.hermes/cron/jobs.json   # 您的用户应拥有它
```

---

## 性能问题

### 任务启动缓慢

每个 cron 任务都会创建一个新的 AIAgent 会话，这可能涉及提供商认证和模型加载。对于时间敏感的计划，请增加缓冲区时间（例如，使用 `0 8 * * *` 而不是 `0 9 * * *`）。

### 过多的重叠任务

调度器在每个滴答内按顺序执行任务。如果多个任务同时到期，它们将一个接一个地运行。考虑错开计划时间（例如，使用 `0 9 * * *` 和 `5 9 * * *` 而不是都使用 `0 9 * * *`），以避免延迟。

### 大型脚本输出

输出兆字节数据的脚本会减慢代理速度，并可能达到令牌限制。请在脚本级别进行过滤/总结——只发出代理需要用于推理的内容。

---

## 诊断命令

```bash
hermes cron list                    # 显示所有任务、状态、下次运行时间
hermes cron run <job_id>            # 安排到下一次滴答（用于测试）
hermes cron edit <job_id>           # 修复配置问题
hermes logs                         # 查看最近的 Hermes 日志
hermes skills list                  # 验证已安装的技能
```

---

## 获取更多帮助

如果您已经按照本指南操作，但问题仍然存在：

1. 使用 `hermes cron run <job_id>` 运行任务（在下一次网关滴答时触发），并留意聊天输出中的错误。
2. 检查 `~/.hermes/logs/agent.log` 获取调度器消息，以及 `~/.hermes/logs/errors.log` 获取警告。
3. 在 [github.com/NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) 开 Issue，并提供以下信息：
   - 任务 ID 和计划时间
   - 交付目标
   - 您预期发生什么 vs. 实际发生什么
   - 从日志中获取的相关错误消息

---

*有关完整的 cron 参考，请参阅 [Automate Anything with Cron](/docs/guides/automate-with-cron) 和 [Scheduled Tasks (Cron)](/docs/user-guide/features/cron)。*