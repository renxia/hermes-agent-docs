---
sidebar_position: 6
title: "Teams 会议"
description: "使用 Microsoft Graph Webhook 设置 Microsoft Teams 会议摘要流水线"
---

# Microsoft Teams 会议

当您希望 Hermes 摄取 Microsoft Graph 会议事件、首先获取转录文本，必要时回退到录音加语音转文本（STT），并将结构化摘要传递至下游接收器时，请使用 Teams 会议流水线。

本页面重点介绍设置和启用步骤：
- Graph 凭据
- Webhook 监听器配置
- Teams 传递模式
- 流水线配置结构

有关第 2 天运维、上线检查及操作员工作表，请使用专用指南：[运维 Teams 会议流水线](/docs/guides/operate-teams-meeting-pipeline)。

## 此功能的作用

该流水线：
1. 接收 Microsoft Graph Webhook 事件
2. 解析会议，并优先使用转录文本制品
3. 当无可用转录文本时，回退到下载录音并执行语音转文本（STT）
4. 在本地存储持久化作业状态和接收器记录
5. 可将摘要写入 Notion、Linear 和 Microsoft Teams

操作员操作仍通过 CLI 进行：

```bash
hermes teams-pipeline validate
hermes teams-pipeline list
hermes teams-pipeline maintain-subscriptions
```

## 先决条件

在启用会议流水线之前，请确保您已具备：

- 正常运行的 Hermes 安装
- 现有的 [Microsoft Teams 机器人设置](/docs/user-guide/messaging/teams)（如果您需要 Teams 出站传递）
- 具有订阅计划会议资源所需权限的 Microsoft Graph 应用程序凭据
- Microsoft Graph 可调用以进行 Webhook 传递的公共 HTTPS URL
- 已安装 `ffmpeg`（如果您需要录音加语音转文本的回退方案）

## 步骤 1：添加 Microsoft Graph 凭据

将 Graph 仅限应用程序的凭据添加到 `~/.hermes/.env`：

```bash
MSGRAPH_TENANT_ID=<tenant-id>
MSGRAPH_CLIENT_ID=<client-id>
MSGRAPH_CLIENT_SECRET=<client-secret>
```

这些凭据用于：
- Graph 客户端基础组件
- 订阅维护命令
- 会议解析和制品获取
- 当您未提供专用 Teams 访问令牌时，基于 Graph 的 Teams 出站传递

## 步骤 2：启用 Graph Webhook 监听器

Webhook 监听器是一个名为 `msgraph_webhook` 的网关平台。至少，启用它并设置一个客户端状态值：

```bash
MSGRAPH_WEBHOOK_ENABLED=true
MSGRAPH_WEBHOOK_PORT=8646
MSGRAPH_WEBHOOK_CLIENT_STATE=<random-shared-secret>
MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES=communications/onlineMeetings
```

该监听器暴露以下端点：
- `/msgraph/webhook` 用于 Graph 通知
- `/health` 用于简单的健康检查

您需要将公共 HTTPS 端点路由到该监听器。例如，如果您的公共域名为 `https://ops.example.com`，则您的 Graph 通知 URL 通常为：

```text
https://ops.example.com/msgraph/webhook
```

## 步骤 3：配置 Teams 传递和流水线行为

会议流水线从其现有的 `teams` 平台条目中读取运行时配置。特定于流水线的配置项位于 `teams.extra.meeting_pipeline` 下。Teams 出站传递仍保留在常规 Teams 平台配置表面。

示例 `~/.hermes/config.yaml`：

```yaml
platforms:
  msgraph_webhook:
    enabled: true
    extra:
      port: 8646
      client_state: "replace-me"
      accepted_resources:
        - "communications/onlineMeetings"

  teams:
    enabled: true
    extra:
      client_id: "your-teams-client-id"
      client_secret: "your-teams-client-secret"
      tenant_id: "your-teams-tenant-id"

      # 出站摘要传递
      delivery_mode: "graph" # 或 incoming_webhook
      team_id: "team-id"
      channel_id: "channel-id"
      # incoming_webhook_url: "https://..."

      meeting_pipeline:
        transcript_min_chars: 80
        transcript_required: false
        transcription_fallback: true
        ffmpeg_extract_audio: true
        notion:
          enabled: false
        linear:
          enabled: false
```

## Teams 传递模式

该流水线在现有的 Teams 插件内支持两种 Teams 摘要传递模式。

### `incoming_webhook`

当您希望通过简单 Webhook 发布到 Teams，而无需通过 Graph 创建频道消息时，请使用此模式。

必需配置：

```yaml
platforms:
  teams:
    enabled: true
    extra:
      delivery_mode: "incoming_webhook"
      incoming_webhook_url: "https://..."
```

### `graph`

当您希望 Hermes 通过 Microsoft Graph 将摘要发布到 Teams 聊天或频道时，请使用此模式。

支持的目標：
- `chat_id`
- `team_id` + `channel_id`
- `team_id` + `home_channel` 回退（适用于现有 Teams 平台）

示例：

```yaml
platforms:
  teams:
    enabled: true
    extra:
      delivery_mode: "graph"
      team_id: "team-id"
      channel_id: "channel-id"
```

## 步骤 4：启动网关

更新配置后，正常启动 Hermes：

```bash
hermes gateway run
```

或者，如果您在 Docker 中运行 Hermes，请按照您部署时已有的方式启动网关。

检查监听器：

```bash
curl http://localhost:8646/health
```

## 步骤 5：创建 Graph 订阅

使用插件 CLI 创建和检查订阅。

示例：

```bash
hermes teams-pipeline subscribe \
  --resource communications/onlineMeetings/getAllTranscripts \
  --notification-url https://ops.example.com/msgraph/webhook \
  --client-state "$MSGRAPH_WEBHOOK_CLIENT_STATE"

hermes teams-pipeline subscribe \
  --resource communications/onlineMeetings/getAllRecordings \
  --notification-url https://ops.example.com/msgraph/webhook \
  --client-state "$MSGRAPH_WEBHOOK_CLIENT_STATE"
```

:::warning Graph 订阅 72 小时后过期

Microsoft Graph 将 Webhook 订阅限制为 72 小时，且不会自动续订。您必须在上线前安排 `hermes teams-pipeline maintain-subscriptions`，否则通知将在手动创建订阅三天后静默停止。请参阅操作员运行手册中的 [自动化订阅续订](/docs/guides/operate-teams-meeting-pipeline#automating-subscription-renewal-required-for-production) —— 三种选项（Hermes cron、systemd 定时器、普通 crontab）。

:::

有关订阅维护和第 2 天操作员流程，请继续阅读指南：[运维 Teams 会议流水线](/docs/guides/operate-teams-meeting-pipeline)。

## 验证

运行内置验证快照：

```bash
hermes teams-pipeline validate
```

有用的辅助检查：

```bash
hermes teams-pipeline token-health
hermes teams-pipeline subscriptions
```

## 故障排除

| 问题 | 检查项 |
|---------|---------------|
| Graph Webhook 验证失败 | 确认公共 URL 正确且可访问，且 Graph 调用的是确切的 `/msgraph/webhook` 路径 |
| 作业未出现在 `hermes teams-pipeline list` 中 | 确认 `msgraph_webhook` 已启用，且订阅指向正确的通知 URL |
| 优先使用转录文本始终失败 | 检查转录文本资源的 Graph 权限，以及该会议是否存在转录文本制品 |
| 录音回退失败 | 确认已安装 `ffmpeg`，且 Graph 应用可访问录音制品 |
| Teams 摘要传递失败 | 重新检查 `delivery_mode`、目标 ID 和 Teams 身份验证配置 |

## 相关文档

- [Microsoft Teams 机器人设置](/docs/user-guide/messaging/teams)
- [运维 Teams 会议流水线](/docs/guides/operate-teams-meeting-pipeline)