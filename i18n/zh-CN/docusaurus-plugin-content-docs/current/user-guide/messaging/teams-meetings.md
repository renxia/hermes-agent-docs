---
sidebar_position: 6
title: "Teams 会议"
description: "使用 Microsoft Graph webhook 设置 Microsoft Teams 会议摘要管线"
---

# Microsoft Teams 会议

当您希望让 Hermes 处理 Microsoft Graph 会议事件，优先获取会议记录副本，在需要时回退到录音加语音转文字，并向下游接收端传递结构化摘要时，请使用 Teams 会议管线。

本页面聚焦于设置和启用：
- Graph 凭据
- webhook 监听器配置
- Teams 传递模式
- 管线配置结构

如需了解日常运维、上线检查和操作员工作表，请参阅专用指南：[运维 Teams 会议管线](/guides/operate-teams-meeting-pipeline)。

## 功能概述

该管线：
1. 接收 Microsoft Graph webhook 事件
2. 解析会议并优先选择记录副本制品
3. 当无可用记录副本时，回退到下载录音并进行语音转文字
4. 在本地存储持久化作业状态和接收端记录
5. 可将摘要写入 Notion、Linear 和 Microsoft Teams

操作员操作保留在 CLI 中（`teams-pipeline` 子命令由 `teams_pipeline` 插件注册 —— 通过 `hermes plugins enable teams_pipeline` 或在 `config.yaml` 中设置 `plugins.enabled: [teams_pipeline]` 来启用）：

```bash
hermes teams-pipeline validate
hermes teams-pipeline list
hermes teams-pipeline maintain-subscriptions
```

## 前提条件

启用会议管线之前，请确保您已具备：

- 一个可工作的 Hermes 安装
- 现有的 [Microsoft Teams 机器人设置](/user-guide/messaging/teams)（如果您需要 Teams 出站传递）
- 具有所需权限的 Microsoft Graph 应用程序凭据，以订阅您计划的会议资源
- 一个 Microsoft Graph 可调用的公共 HTTPS URL，用于 webhook 传递
- 安装了 `ffmpeg`（如果您需要录音加语音转文字回退）

## 步骤 1：添加 Microsoft Graph 凭据

将 Graph 仅应用凭据添加到 `~/.hermes/.env`：

```bash
MSGRAPH_TENANT_ID=<tenant-id>
MSGRAPH_CLIENT_ID=<client-id>
MSGRAPH_CLIENT_SECRET=<client-secret>
```

这些凭据由以下组件使用：
- Graph 客户端基础组件
- 订阅维护命令
- 会议解析和制品获取
- 当您未提供专用 Teams 访问令牌时，用于基于 Graph 的 Teams 出站传递

## 步骤 2：启用 Graph Webhook 监听器

Webhook 监听器是一个名为 `msgraph_webhook` 的网关平台。至少需要启用它并设置一个客户端状态值：

```bash
MSGRAPH_WEBHOOK_ENABLED=true
MSGRAPH_WEBHOOK_PORT=8646
MSGRAPH_WEBHOOK_CLIENT_STATE=<random-shared-secret>
MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES=communications/onlineMeetings
```

该监听器暴露了：
- `/msgraph/webhook` 用于 Graph 通知
- `/health` 用于简单的健康检查

您需要将公共 HTTPS 端点路由到该监听器。例如，如果您的公共域名是 `https://ops.example.com`，您的 Graph 通知 URL 通常应为：

```text
https://ops.example.com/msgraph/webhook
```

## 步骤 3：配置 Teams 传递和管线行为

会议管线从现有的 `teams` 平台条目读取其运行时配置。特定于管线的配置项位于 `teams.extra.meeting_pipeline` 下。Teams 出站传递配置位于常规 Teams 平台配置界面。

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

该管线在现有的 Teams 插件内支持两种 Teams 摘要传递模式。

### `incoming_webhook`

当您希望通过 webhook 简单地发布到 Teams，而不通过 Graph 创建频道消息时，请使用此模式。

所需配置：

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

支持的目标：
- `chat_id`
- `team_id` + `channel_id`
- `team_id` + `home_channel`（用于现有 Teams 平台的回退）

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

更新配置后正常启动 Hermes：

```bash
hermes gateway run
```

或者，如果您在 Docker 中运行 Hermes，请像部署时通常所做的那样启动网关。

检查监听器：

```bash
curl http://localhost:8646/health
```

## 步骤 5：创建 Graph 订阅

使用插件 CLI 来创建和检查订阅。

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

:::warning Graph 订阅会在 72 小时后过期

Microsoft Graph 将 webhook 订阅上限设为 72 小时，并且不会自动续订。您必须在上线前安排 `hermes teams-pipeline maintain-subscriptions`，否则在任何手动创建订阅三天后，通知将悄无声息地停止。有关自动化订阅续订，请参阅操作员手册中的[自动化订阅续订（生产环境必需）](/guides/operate-teams-meeting-pipeline#automating-subscription-renewal-required-for-production)—— 有三个选项（Hermes cron、systemd 定时器、普通 crontab）。

:::

有关订阅维护和日常运维流程，请继续阅读指南：[运维 Teams 会议管线](/guides/operate-teams-meeting-pipeline)。

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

| 问题 | 检查内容 |
|------|----------|
| Graph webhook 验证失败 | 确认公共 URL 正确且可达，并且 Graph 调用的路径完全是 `/msgraph/webhook` |
| `hermes teams-pipeline list` 中未出现作业 | 确认 `msgraph_webhook` 已启用，并且订阅指向了正确的通知 URL |
| 记录副本优先获取从未成功 | 检查记录副本资源的 Graph 权限，以及该会议是否存在记录副本制品 |
| 录音回退失败 | 确认已安装 `ffmpeg`，并且 Graph 应用可以访问录音制品 |
| Teams 摘要传递失败 | 重新检查 `delivery_mode`、目标 ID 和 Teams 身份验证配置 |

## 相关文档

- [Microsoft Teams 机器人设置](/user-guide/messaging/teams)
- [运维 Teams 会议管线](/guides/operate-teams-meeting-pipeline)