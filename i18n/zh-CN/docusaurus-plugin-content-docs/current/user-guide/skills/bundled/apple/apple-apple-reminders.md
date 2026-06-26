---
title: "Apple Reminders — Apple Reminders via remindctl: add, list, complete"
sidebar_label: "Apple Reminders"
description: "Apple Reminders via remindctl: add, list, complete"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Apple Reminders

Apple Reminders via remindctl: add, list, complete。

## Skill metadata

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/apple/apple-reminders` |
| Version | `1.0.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | macos |
| Tags | `Reminders`, `tasks`, `todo`, `macOS`, `Apple` |

## Reference: full SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Apple Reminders

使用 `remindctl` 直接从终端管理 Apple Reminders。任务会通过 iCloud 在所有 Apple 设备上同步。

## Prerequisites (先决条件)

- 带有 Reminders.app 的 macOS
- 安装: `brew install steipete/tap/remindctl`
- 提示时授予 Reminders 权限
- 检查: `remindctl status` / 请求: `remindctl authorize`

## When to Use (何时使用)

- 用户提到“提醒”或“Apple Reminders”
- 创建带有截止日期、可同步到 iOS 的个人待办事项
- 管理 Apple Reminders 列表
- 用户希望任务出现在他们的 iPhone/iPad 上

## When NOT to Use (何时不应使用)

- 设置智能体警报 → 请改用 cronjob 工具
- 日历事件 → 使用 Apple Calendar 或 Google Calendar
- 项目任务管理 → 使用 GitHub Issues、Notion 等工具
- 如果用户说“提醒我”但指的是智能体警报 → 先进行澄清

## Quick Reference (快速参考)

### View Reminders (查看提醒事项)

```bash
remindctl                    # 今日的提醒事项
remindctl today              # 今天
remindctl tomorrow           # 明天
remindctl week               # 本周
remindctl overdue            # 已逾期
remindctl all                # 所有
remindctl 2026-01-04         # 特定日期
```

### Manage Lists (管理列表)

```bash
remindctl list               # 列出所有列表
remindctl list Work          # 显示特定列表
remindctl list Projects --create    # 创建列表
remindctl list Work --delete        # 删除列表
```

### Create Reminders (创建提醒事项)

```bash
remindctl add "Buy milk"
remindctl add --title "Call mom" --list Personal --due tomorrow
remindctl add --title "Meeting prep" --due "2026-02-15 09:00"
```

### Due Time vs Alarm / Early Nudge (截止时间与警报/提前提醒)

`--due` 和 `--alarm` 是不同的字段：

- `--due` 设置提醒事项的截止日期/时间。
- `--alarm` 设置 EventKit 的警报/通知触发器。有时限的提醒可能会默认在截止时间发出警报，但当用户要求更早的提醒时，请显式地使用 `--alarm`。

对于一个定于下午 2:00 的提醒事项，提前 30 分钟通知：

```bash
remindctl add --title "Hairdresser" --due "2026-05-15 14:00" --alarm "2026-05-15 13:30"
```

要编辑现有提醒事项：

```bash
remindctl edit 87354 --due "2026-05-15 14:00" --alarm "2026-05-15 13:30"
```

Reminders UI 可能会根据警报时间显示或分组该项目，因为通知是在那个时候触发的。请通过 JSON 而非假设截止时间已更改来验证：

```bash
remindctl today --json
```

预期结构：

- `dueDate`: 实际截止时间
- `alarmDate`: 通知/提前提醒时间

Apple 的公共 `EKReminder` 文档只列出了特定于提醒事项的属性。警报支持来自于 remindctl `--alarm` 标志所暴露的继承自 `EKCalendarItem` 的行为。

### Complete / Delete (完成/删除)

```bash
remindctl complete 1 2 3          # 按 ID 完成
remindctl delete 4A83 --force     # 按 ID 删除
```

### Output Formats (输出格式)

```bash
remindctl today --json       # 用于脚本的 JSON
remindctl today --plain      # TSV 格式
remindctl today --quiet      # 只计数
```

## Date Formats (日期格式)

接受 `--due` 和日期过滤器的格式：
- `today`, `tomorrow`, `yesterday`
- `YYYY-MM-DD`
- `YYYY-MM-DD HH:mm`
- ISO 8601 (`2026-01-04T12:34:56Z`)

## Rules (规则)

1. 当用户说“提醒我”时，进行澄清：Apple Reminders（同步到手机）与智能体 cronjob 警报
2. 在创建之前，务必确认提醒内容和截止日期
3. 使用 `--json` 进行程序化解析