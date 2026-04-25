---
title: "Apple Reminders — 通过 remindctl 命令行工具管理 Apple Reminders（列出、添加、完成、删除）"
sidebar_label: "Apple Reminders"
description: "通过 remindctl 命令行工具管理 Apple Reminders（列出、添加、完成、删除）"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从该技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Apple Reminders

通过 remindctl 命令行工具管理 Apple Reminders（列出、添加、完成、删除）。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/apple/apple-reminders` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | macos |
| 标签 | `Reminders`, `tasks`, `todo`, `macOS`, `Apple` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是当技能激活时，智能体看到的指令。
:::

# Apple Reminders

使用 `remindctl` 直接从终端管理 Apple Reminders。任务通过 iCloud 在所有 Apple 设备间同步。

## 先决条件

- 带有 Reminders.app 的 **macOS**
- 安装：`brew install steipete/tap/remindctl`
- 在提示时授予 Reminders 权限
- 检查：`remindctl status` / 请求：`remindctl authorize`

## 何时使用

- 用户提到“reminder”或“Reminders app”
- 创建带有截止日期的个人待办事项，这些事项会同步到 iOS
- 管理 Apple Reminders 列表
- 用户希望任务出现在其 iPhone/iPad 上

## 何时不应使用

- 调度智能体提醒 → 请改用 cronjob 工具
- 日历事件 → 请使用 Apple 日历或 Google 日历
- 项目任务管理 → 请使用 GitHub Issues、Notion 等
- 如果用户说“remind me”但指的是智能体提醒 → 请先澄清

## 快速参考

### 查看提醒

```bash
remindctl                    # 今天的提醒
remindctl today              # 今天
remindctl tomorrow           # 明天
remindctl week               # 本周
remindctl overdue            # 逾期
remindctl all                # 所有
remindctl 2026-01-04         # 特定日期
```

### 管理列表

```bash
remindctl list               # 列出所有列表
remindctl list Work          # 显示特定列表
remindctl list Projects --create    # 创建列表
remindctl list Work --delete        # 删除列表
```

### 创建提醒

```bash
remindctl add "Buy milk"
remindctl add --title "Call mom" --list Personal --due tomorrow
remindctl add --title "Meeting prep" --due "2026-02-15 09:00"
```

### 完成 / 删除

```bash
remindctl complete 1 2 3          # 通过 ID 完成
remindctl delete 4A83 --force     # 通过 ID 删除
```

### 输出格式

```bash
remindctl today --json       # 用于脚本的 JSON 格式
remindctl today --plain      # TSV 格式
remindctl today --quiet      # 仅计数
```

## 日期格式

`--due` 和日期过滤器接受的格式：
- `today`, `tomorrow`, `yesterday`
- `YYYY-MM-DD`
- `YYYY-MM-DD HH:mm`
- ISO 8601 (`2026-01-04T12:34:56Z`)

## 规则

1. 当用户说“remind me”时，请澄清：Apple Reminders（同步到手机）与智能体 cronjob 提醒
2. 在创建提醒前，始终确认提醒内容和截止日期
3. 使用 `--json` 进行程序化解析