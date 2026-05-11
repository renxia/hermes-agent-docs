---
title: "Teams 会议流水线"
sidebar_label: "Teams 会议流水线"
description: "通过 Hermes CLI 操作 Teams 会议摘要流水线 —— 总结会议、检查流水线状态、重放作业、管理 Microsoft Graph 订阅"
---

{/* 本页面由网站脚本 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Teams 会议流水线

通过 Hermes CLI 操作 Teams 会议摘要流水线 —— 总结会议、检查流水线状态、重放作业、管理 Microsoft Graph 订阅。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/productivity/teams-meeting-pipeline` |
| 版本 | `1.1.0` |
| 作者 | Hermes 智能体 + Teknium |
| 许可证 | MIT |
| 标签 | `Teams`, `Microsoft Graph`, `会议`, `生产力`, `运维` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是该技能激活时智能体所看到的指令。
:::

# Teams 会议流水线

每当用户询问 Microsoft Teams 会议摘要、文字记录、录音、行动项、Graph 订阅或任何关于 Teams 会议流水线的运维问题时，请使用此技能。适用于任何语言——下面的触发示例并非详尽列表。

所有面向操作员的功能都是一个 `hermes teams-pipeline` 子命令，通过终端工具运行。此流水线没有新的模型工具——CLI 就是接口。

## 何时使用此技能

用户要求：
- 总结 Teams 会议 / 提取行动项 / 获取会议记录
- 检查流水线状态，检查存储的会议作业，或查看近期会议
- 重放 / 重新运行一个失败的或需要新摘要的存储作业
- 在更改环境或配置后验证 Microsoft Graph 设置
- 排查“会议摘要从未送达”或“没有新会议被摄入”的问题
- 管理 Graph webhook 订阅（创建、续订、删除、检查）
- 设置自动化订阅续订（参见下面的陷阱）

多语言触发示例（非详尽）：
- 英文："summarize the Teams meeting", "pipeline status", "replay job X"
- 土耳其文："Teams meeting özetle", "action item çıkar", "toplantı notu", "pipeline durumu", "replay job"

## 前提条件

在使用流水线之前，请确认这些已在 `~/.hermes/.env` 中设置：

```bash
MSGRAPH_TENANT_ID=...
MSGRAPH_CLIENT_ID=...
MSGRAPH_CLIENT_SECRET=...
```

如果缺少任何项，请指导用户参考 `/docs/guides/microsoft-graph-app-registration` 处的 Azure 应用注册指南——他们需要一个拥有管理员已同意 Graph 应用程序权限的 Azure AD 应用注册，流水线才能工作。

## 命令参考

### 状态与检查（从这里开始）

```bash
hermes teams-pipeline validate              # 配置快照——在任何更改后首先运行
hermes teams-pipeline token-health          # Graph 令牌状态
hermes teams-pipeline token-health --force-refresh   # 强制刷新获取新令牌
hermes teams-pipeline list                  # 近期会议作业
hermes teams-pipeline list --status failed  # 仅失败的作业
hermes teams-pipeline show <job-id>         # 一个作业的完整详情
hermes teams-pipeline subscriptions         # 当前 Graph webhook 订阅
```

### 重运行 / 调试

```bash
hermes teams-pipeline run <job-id>          # 重放存储的作业（重新摘要，重新交付）
hermes teams-pipeline fetch --meeting-id <id>   # 干运行：解析会议 + 文字记录但不持久化
hermes teams-pipeline fetch --join-web-url "<url>"   # 通过加入 URL 干运行
```

### 订阅管理

```bash
hermes teams-pipeline subscribe \
  --resource communications/onlineMeetings/getAllTranscripts \
  --notification-url https://<your-public-host>/msgraph/webhook \
  --client-state "$MSGRAPH_WEBHOOK_CLIENT_STATE"

hermes teams-pipeline renew-subscription <sub-id> --expiration <iso-8601>
hermes teams-pipeline delete-subscription <sub-id>
hermes teams-pipeline maintain-subscriptions            # 续订即将过期的订阅
hermes teams-pipeline maintain-subscriptions --dry-run  # 显示将被续订的内容
```

## 常见请求的决策树

- 用户问“为什么我没有收到今天会议的摘要？” → 先用 `list --status failed`，然后在相关行上使用 `show <job-id>`。如果作业根本不存在，检查 `subscriptions` —— webhook 可能已过期（参见下面的陷阱）。
- 用户问“设置是否正常工作？” → `validate`，然后 `token-health`，然后 `subscriptions`。如果这三者都通过，请求一个测试会议并检查 `list` 是否有新行。
- 用户问“重新运行会议 X 的摘要” → `list` 找到作业 ID，`run <job-id>` 进行重放。如果再次失败，`show <job-id>` 检查错误并 `fetch --meeting-id` 干运行解析工件。
- 用户问“将会议 X 添加到流水线” → 通常你不会这样做——流水线是基于订阅的，而非针对单个会议。如果他们想要一个特定的过去会议摘要，使用 `fetch` 拉取文字记录 + 作业创建后 `run`。

## 关键陷阱：Graph 订阅在 72 小时后过期

Microsoft Graph 将 webhook 订阅限制在 72 小时，并且 **不会自动续订**。如果未安排 `maintain-subscriptions`，在手动创建订阅 3 天后，会议通知将静默停止到达。

当用户报告“流水线昨天还能工作，但今天没有收到任何东西”时：
1. 运行 `hermes teams-pipeline subscriptions` —— 如果为空或所有条目的 `expirationDateTime` 已过去，那就是原因。
2. 使用上面显示的 `subscribe` 重新创建。
3. **立即设置自动化续订**，通过 `hermes cron add`、systemd 定时器或普通 crontab。运维手册 `/docs/guides/operate-teams-meeting-pipeline#automating-subscription-renewal-required-for-production` 提供了所有三种选项。12 小时间隔是安全的（相对于 72 小时限制有 6 倍余量）。

## 其他陷阱

- **文字记录尚不可用。** Teams 在会议结束后需要一些时间来生成文字记录工件。对刚刚结束的会议使用 `fetch --meeting-id` 可能返回空。等待 2-5 分钟后重试，或让 Graph webhook 自然驱动摄入。
- **交付模式不匹配。** 如果摘要已生成（`list` 显示成功）但未到达 Teams 中，检查 `platforms.teams.extra.delivery_mode` 以及匹配的目标配置（`incoming_webhook_url` 或 `chat_id` 或 `team_id`+`channel_id`）。写入器从 config.yaml 或 `TEAMS_*` 环境变量读取这些配置。
- **Graph 应用程序权限。** 令牌获取正常（`token-health` 通过）但当权限已添加而管理员同意未重新授予时，Graph API 调用返回 401/403。让用户重新访问 Azure 门户中的应用注册并再次点击“授予管理员同意”。

## 相关文档

当用户需要超出此技能涵盖范围的更多信息时，请指向他们：
- Azure 应用注册指南：`/docs/guides/microsoft-graph-app-registration`
- 完整的流水线设置：`/docs/user-guide/messaging/teams-meetings`
- 运维手册（续订自动化、故障排除、上线清单）：`/docs/guides/operate-teams-meeting-pipeline`
- Webhook 监听器设置：`/docs/user-guide/messaging/msgraph-webhook`