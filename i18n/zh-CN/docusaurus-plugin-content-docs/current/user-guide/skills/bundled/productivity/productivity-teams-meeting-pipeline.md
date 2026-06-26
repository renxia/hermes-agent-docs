---
title: "Teams 会议流程"
sidebar_label: "Teams 会议流程"
description: "通过 Hermes CLI 操作 Teams 会议摘要流程 — 总结会议、检查流程状态、重放作业、管理 Microsoft Graph 订阅"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Teams 会议流程

通过 Hermes CLI 操作 Teams 会议摘要流程 — 总结会议、检查流程状态、重放作业、管理 Microsoft Graph 订阅。

## 技能元数据

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/productivity/teams-meeting-pipeline` |
| Version | `1.1.0` |
| Author | Hermes 智能体 + Teknium |
| License | MIT |
| Tags | `Teams`, `Microsoft Graph`, `Meetings`, `Productivity`, `Operations` |

## 参考: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是该智能体在技能激活时所看到的指令。
:::

# Teams 会议流程

当用户询问有关 Microsoft Teams 会议摘要、文字记录、录音、行动项、Graph 订阅或任何关于 Teams 会议流程的操作问题时，请使用此技能。它适用于任何语言 — 下面的触发示例并非详尽无遗。

所有面向操作员的功能都是通过终端工具运行的 `hermes teams-pipeline` 子命令。对于此流程没有新的模型工具——CLI 是其接口。

## 何时使用此技能

用户正在要求：
- 总结 Teams 会议 / 提取行动项 / 获取会议记录
- 检查流程状态、检查存储的会议作业或查看最近的会议
- 重放 / 重新运行失败或需要全新摘要的已存储作业
- 在更改环境或配置后验证 Microsoft Graph 设置
- 故障排除“会议摘要从未到达”或“没有新的会议正在摄取”的问题
- 管理 Graph webhook 订阅（创建、续订、删除、检查）
- 设置自动订阅续期（参见下方的陷阱）

多语言触发示例（非详尽）：
- English: "summarize the Teams meeting", "pipeline status", "replay job X"
- Turkish: "Teams meeting özetle", "action item çıkar", "toplantı notu", "pipeline durumu", "replay job"

## 先决条件

在使用流程之前，请验证这些内容已设置在 `${HERMES_HOME:-~/.hermes}/.env` 中：

```bash
MSGRAPH_TENANT_ID=...
MSGRAPH_CLIENT_ID=...
MSGRAPH_CLIENT_SECRET=...
```

如果缺少任何一项，请将用户引导至 `/docs/guides/microsoft-graph-app-registration` 的 Azure 应用程序注册指南——在流程工作之前，他们需要一个具有管理员同意 Graph 应用程序权限的 Azure AD 应用注册。

## 命令参考

### 状态和检查（从这里开始）

```bash
hermes teams-pipeline validate              # 配置快照 — 在任何更改后首先运行
hermes teams-pipeline token-health          # Graph 令牌状态
hermes teams-pipeline token-health --force-refresh   # 强制获取新的令牌
hermes teams-pipeline list                  # 最近的会议作业
hermes teams-pipeline list --status failed  # 仅失败的作业
hermes teams-pipeline show <job-id>         # 单个作业的完整详情
hermes teams-pipeline subscriptions         # 当前的 Graph webhook 订阅
```

### 重新运行 / 调试

```bash
hermes teams-pipeline run <job-id>          # 重放已存储的作业（重新摘要、重新交付）
hermes teams-pipeline fetch --meeting-id <id>   # 干跑：在不持久化的前提下解析会议+文字记录
hermes teams-pipeline fetch --join-web-url "<url>"   # 通过加入 URL 进行干跑
```

### 订阅管理

```bash
hermes teams-pipeline subscribe \
  --resource communications/onlineMeetings/getAllTranscripts \
  --notification-url https://<your-public-host>/msgraph/webhook \
  --client-state "$MSGRAPH_WEBHOOK_CLIENT_STATE"

hermes teams-pipeline renew-subscription <sub-id> --expiration <iso-8601>
hermes teams-pipeline delete-subscription <sub-id>
hermes teams-pipeline maintain-subscriptions            # 续订临近到期的订阅
hermes teams-pipeline maintain-subscriptions --dry-run  # 显示将要续订的内容
```

## 常见问题的决策树

- 用户询问“为什么我没有收到今天的会议摘要？” → 首先运行 `list --status failed`，然后对相关行运行 `show <job-id>`。如果作业根本不存在，请检查 `subscriptions` — webhook 可能已过期（参见下方的陷阱）。
- 用户询问“设置是否正常工作？” → 运行 `validate`，然后 `token-health`，然后 `subscriptions`。如果这三项均通过，则请求一次测试会议并检查 `list` 以获取新的行记录。
- 用户询问“为会议 X 重新运行摘要” → 运行 `list` 以找到作业 ID，然后运行 `run <job-id>` 进行重放。如果再次失败，请运行 `show <job-id>` 来检查错误，并运行 `fetch --meeting-id` 来干跑工件解析。
- 用户询问“将会议 X 添加到流程中” → 通常不需要——该流程是订阅驱动的，而不是按会议进行的。如果他们想要一个特定的过去会议摘要，请使用 `fetch` 来拉取文字记录 + 在创建作业后运行 `run`。

## 关键陷阱：Graph 订阅有 72 小时有效期

Microsoft Graph 将 webhook 订阅限制在 72 小时，并且**不会自动续订它们**。如果未安排 `maintain-subscriptions`，会议通知将在任何手动创建订阅后的 3 天内静默停止到达。

当用户报告“昨天流程正常工作，但今天没有收到任何内容”时：
1. 运行 `hermes teams-pipeline subscriptions` — 如果它为空或所有条目显示 `expirationDateTime` 已在过去，那就是原因。
2. 使用上述方法重新创建订阅。
3. **立即设置自动续订**，通过 `hermes cron add`、systemd 定时器或标准的 crontab。`/docs/guides/operate-teams-meeting-pipeline#automating-subscription-renewal-required-for-production` 中的操作员运行手册包含了所有这三种选项。12 小时的间隔是安全的（相对于 72 小时限制的 6 倍冗余）。

## 其他陷阱

- **文字记录尚未可用。** Teams 在会议结束后需要一段时间才能生成文字记录工件。对刚结束的会议运行 `fetch --meeting-id` 可能返回空值。等待 2-5 分钟再重试，或者让 Graph webhook 自然驱动摄取过程。
- **交付模式不匹配。**如果摘要已生成（`list` 显示成功）但没有内容进入 Teams，请检查 `platforms.teams.extra.delivery_mode` 和匹配的目标配置（`incoming_webhook_url` 或 `chat_id` 或 `team_id`+`channel_id`）。撰写者从 config.yaml 或 `TEAMS_*` 环境变量中读取这些信息。
- **Graph 应用权限。**令牌已成功获取（`token-health` 通过），但当添加了权限而没有重新授予管理员同意时，Graph API 调用返回 401/403。请让用户重访 Azure 门户中的应用注册，并再次点击“授予管理员同意”。

## 相关文档

当用户需要比此技能更深入的信息时，请引导他们参考以下文档：
- Azure 应用注册指南：`/docs/guides/microsoft-graph-app-registration`
- 完整流程设置：`/docs/user-guide/messaging/teams-meetings`
- 操作员运行手册（续订自动化、故障排除、上线检查清单）：`/docs/guides/operate-teams-meeting-pipeline`
- Webhook 监听器设置：`/docs/user-guide/messaging/msgraph-webhook`