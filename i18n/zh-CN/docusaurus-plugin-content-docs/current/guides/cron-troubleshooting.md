---
sidebar_position: 12
title: "Cron Troubleshooting"
description: "Diagnose and fix common Hermes cron issues — jobs not firing, delivery failures, skill loading errors, and performance problems"
---

# Cron 故障排查

当某个 cron 任务未按预期运行时，请按以下顺序逐一排查。大多数问题可归为四类：定时、投递、权限或技能加载。

---

## 任务未触发

### 检查 1：确认任务存在且处于活动状态

```bash
hermes cron list
```

查找该任务并确认其状态为 `[active]`（而非 `[paused]` 或 `[completed]`）。如果显示 `[completed]`，可能是重复次数已耗尽——编辑该任务以重置。

### 检查 2：确认调度表达式正确

格式错误的调度表达式会静默退化为一次性任务或被完全拒绝。请测试你的表达式：

| 你的表达式 | 应计算为 |
|----------------|-------------------|
| `0 9 * * *` | 每天上午 9:00 |
| `0 9 * * 1` | 每周一上午 9:00 |
| `every 2h` | 从现在起每 2 小时 |
| `30m` | 从现在起 30 分钟后 |
| `2025-06-01T09:00:00` | 2025年6月1日 UTC 上午 9:00 |

如果任务触发一次后即从列表中消失，说明是一次性调度（`30m`、`1d` 或 ISO 时间戳）——这是预期行为。

### 检查 3：网关是否在运行？

Cron 任务由网关的后台 tick 线程触发，该线程每 60 秒执行一次。常规的 CLI 聊天会话**不会**自动触发 cron 任务。

如果你期望任务自动触发，需要运行中的网关（前台运行使用 `hermes gateway`，后台服务使用 `hermes gateway start`）。如需临时调试，可以手动触发一次 tick：`hermes cron tick`。

### 检查 4：检查系统时钟和时区

任务使用本地时区。如果机器的时钟有误或时区与预期不同，任务将在错误的时间触发。请验证：

```bash
date
hermes cron list   # 将 next_run 时间与本地时间对比
```

---

## 投递失败

### 检查 1：确认投递目标正确

投递目标区分大小写，且需要正确配置对应的平台。配置错误的目标会导致响应被静默丢弃。

| 目标 | 所需条件 |
|--------|----------|
| `telegram` | `~/.hermes/.env` 中需配置 `TELEGRAM_BOT_TOKEN` |
| `discord` | `~/.hermes/.env` 中需配置 `DISCORD_BOT_TOKEN` |
| `slack` | `~/.hermes/.env` 中需配置 `SLACK_BOT_TOKEN` |
| `whatsapp` | 需配置 WhatsApp 网关 |
| `signal` | 需配置 Signal 网关 |
| `matrix` | 需配置 Matrix 服务器 |
| `email` | `config.yaml` 中需配置 SMTP |
| `sms` | 需配置短信提供商 |
| `local` | 需对 `~/.hermes/cron/output/` 有写入权限 |
| `origin` | 投递到创建该任务的聊天 |

其他支持的平台还包括 `mattermost`、`homeassistant`、`dingtalk`、`feishu`、`wecom`、`weixin`、`bluebubbles`、`qqbot` 和 `webhook`。你也可以使用 `platform:chat_id` 语法指定特定聊天（例如 `telegram:-1001234567890`）。

如果投递失败，任务仍会执行——只是不会发送到任何地方。检查 `hermes cron list` 中更新的 `last_error` 字段（如有）。

### 检查 2：检查 `[SILENT]` 的使用

如果你的 cron 任务没有产生任何输出，投递将被抑制。如果智能体的响应中包含 cron 静默标记 `[SILENT]`，投递也会被抑制。这对于监控任务是有意为之——但请确保你的提示词不会意外抑制所有内容。

使用类似"如无变化，仅回复 [SILENT]"的提示词。避免要求智能体在较长的解释中包含 `[SILENT]`，因为 cron 会将该标记视为抑制信号。

### 检查 3：平台令牌权限

每个消息平台的机器人都需要特定的权限才能接收消息。如果投递静默失败：

- **Telegram**：机器人必须是目标群组/频道的管理员
- **Discord**：机器人必须拥有在目标频道发送消息的权限
- **Slack**：机器人必须已添加到工作区并具有 `chat:write` 权限范围

### 检查 4：响应包装

默认情况下，cron 响应会附带头部和尾部包装（`config.yaml` 中的 `cron.wrap_response: true`）。某些平台或集成可能无法很好地处理。如需禁用：

```yaml
cron:
  wrap_response: false
```

---

## 技能加载失败

### 检查 1：确认技能已安装

```bash
hermes skills list
```

技能必须先安装，然后才能关联到 cron 任务。如果缺少某个技能，请先使用 `hermes skills install <skill-name>` 安装，或通过 CLI 中的 `/skills` 命令安装。

### 检查 2：检查技能名称与技能文件夹名称

技能名称区分大小写，且必须与已安装技能的文件夹名称完全匹配。如果你的任务指定的是 `ai-funding-daily-report`，而技能文件夹也是 `ai-funding-daily-report`，请通过 `hermes skills list` 确认精确的名称。

### 检查 3：需要交互式工具的技能

Cron 任务运行时，`cronjob`、`messaging` 和 `clarify` 工具集处于禁用状态。这是为了防止递归创建 cron 任务、直接发送消息（投递由调度器处理）以及交互式提示。如果某个技能依赖这些工具集，则在 cron 上下文中将无法运行。

请查看技能的文档，确认其支持非交互式（无头）模式。

### 检查 4：多技能加载顺序

使用多个技能时，它们按顺序加载。如果技能 A 依赖技能 B 提供的上下文，请确保 B 先加载：

```bash
/cron add "0 9 * * *" "..." --skill context-skill --skill target-skill
```

在此示例中，`context-skill` 会在 `target-skill` 之前加载。

---

## 任务错误与失败

### 检查 1：查看最近的任务输出

如果任务已执行但失败，你可能在以下位置找到错误上下文：

1. 任务投递到的聊天（如果投递成功）
2. `~/.hermes/logs/agent.log` 中的调度器消息（或 `errors.log` 中的警告）
3. 通过 `hermes cron list` 查看任务的 `last_run` 元数据

### 检查 2：常见错误模式

**脚本出现"No such file or directory"**
`script` 路径必须是绝对路径（或相对于 Hermes 配置目录的相对路径）。请验证：
```bash
ls ~/.hermes/scripts/your-script.py   # 必须存在
hermes cron edit <job_id> --script ~/.hermes/scripts/your-script.py
```

**任务执行时出现"Skill not found"**
技能必须安装在运行调度器的机器上。如果你在不同机器之间切换，技能不会自动同步——请使用 `hermes skills install <skill-name>` 重新安装。

**任务运行但投递无内容**
可能是投递目标问题（参见上面的"投递失败"）、无输出，或响应中包含 cron 静默标记 `[SILENT]`。

**任务挂起或超时**
调度器使用基于非活动状态的超时机制（默认 600 秒，可通过 `HERMES_CRON_TIMEOUT` 环境变量配置，`0` 表示无限制）。只要智能体在主动调用工具，就可以持续运行——计时器仅在持续非活动状态后才会触发。长时间运行的任务应使用脚本处理数据收集，仅投递结果。

### 检查 3：锁竞争

调度器使用基于文件的锁来防止 tick 重叠。如果两个网关实例同时运行（或 CLI 会话与网关冲突），任务可能会被延迟或跳过。

终止重复的网关进程：
```bash
ps aux | grep hermes
# 终止重复进程，仅保留一个
```

### 检查 4：jobs.json 的权限

任务存储在 `~/.hermes/cron/jobs.json` 中。如果你的用户无法读写此文件，调度器将静默失败：

```bash
ls -la ~/.hermes/cron/jobs.json
chmod 600 ~/.hermes/cron/jobs.json   # 应为你用户所有
```

---

## 性能问题

### 任务启动缓慢

每个 cron 任务都会创建一个全新的 AIAgent 会话，这可能涉及提供商认证和模型加载。对于时间敏感的计划，请添加缓冲时间（例如使用 `0 8 * * *` 而非 `0 9 * * *`）。

### 过多重叠任务

调度器在每个 tick 内按顺序执行任务。如果多个任务同时到期，它们将依次运行。考虑错开调度时间（例如 `0 9 * * *` 和 `5 9 * * *`，而非都在 `0 9 * * *`），以避免延迟。

### 大量脚本输出

输出兆字节级别数据的脚本会拖慢智能体速度，并可能触及 token 限制。在脚本层面进行过滤/摘要——仅输出智能体推理所需的内容。

---

## 诊断命令

```bash
hermes cron list                    # 显示所有任务、状态、next_run 时间
hermes cron run <job_id>            # 安排在下次 tick 执行（用于测试）
hermes cron edit <job_id>           # 修复配置问题
hermes logs                         # 查看最近的 Hermes 日志
hermes skills list                  # 验证已安装的技能
```

---

## 获取更多帮助

如果你已按本指南排查但问题仍然存在：

1. 使用 `hermes cron run <job_id>` 运行任务（在下次网关 tick 时触发），并在聊天输出中观察是否有错误
2. 检查 `~/.hermes/logs/agent.log` 中的调度器消息和 `~/.hermes/logs/errors.log` 中的警告
3. 在 [github.com/NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) 提交 issue，包含：
   - 任务 ID 和调度表达式
   - 投递目标
   - 预期行为与实际行为的对比
   - 日志中的相关错误信息

---

*有关完整的 cron 参考，请参阅 [使用 Cron 实现一切自动化](/guides/automate-with-cron) 和 [计划任务（Cron）](/user-guide/features/cron)。*