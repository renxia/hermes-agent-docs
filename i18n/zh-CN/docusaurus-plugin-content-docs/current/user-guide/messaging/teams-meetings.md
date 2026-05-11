---
sidebar_position: 6
title: "Teams 会议"
description: "设置 Microsoft Teams 会议摘要管道与 Microsoft Graph 网钩"
---

# Microsoft Teams 会议

当您希望 Hermes 摄取 Microsoft Graph 会议事件、首先获取会议记录，在必要时回退到录音加语音转文字，并向下游接收器提供结构化摘要时，请使用 Teams 会议管道。

本页重点介绍设置和启用：
- Graph 凭据
- 网钩监听器配置
- Teams 投递模式
- 管道配置结构

关于日常运维、上线检查和操作员工作表，请使用专用指南：[运维 Teams 会议管道](/docs/guides/operate-teams-meeting-pipeline)。

## 此功能的作用

该管道：
1. 接收 Microsoft Graph 网钩事件
2. 解析会议并优先选择会议记录文件
3. 当没有可用的会议记录时，回退到录音下载加语音转文字
4. 在本地存储持久化任务状态和接收器记录
5. 可将摘要写入 Notion、Linear 和 Microsoft Teams

操作员操作保留在 CLI 中（`teams-pipeline` 子命令由 `teams_pipeline` 插件注册——可通过 `hermes plugins enable teams_pipeline` 启用，或在 `config.yaml` 中设置 `plugins.enabled: [teams_pipeline]`）：

```bash
hermes teams-pipeline validate
hermes teams-pipeline list
hermes teams-pipeline maintain-subscriptions
```

## 前提条件

启用会议管道之前，请确保您已具备：

- 正常工作的 Hermes 安装
- 如果您需要 Teams 向外投递，请先完成现有的 [Microsoft Teams 机器人设置](/docs/user-guide/messaging/teams)
- 拥有所需权限、用于订阅会议资源的 Microsoft Graph 应用程序凭据
- 一个 Microsoft Graph 可以调用的公共 HTTPS URL 用于网钩投递
- 如果您需要录音加语音转文字的回退方案，请安装 `ffmpeg`

## 步骤一：添加 Microsoft Graph 凭据

将 Graph 应用程序凭据添加到 `~/.hermes/.env`：

```bash
MSGRAPH_TENANT_ID=<tenant-id>
MSGRAPH_CLIENT_ID=<client-id>
MSGRAPH_CLIENT_SECRET=<client-secret>
```

这些凭据用于：
- Graph 客户端基础
- 订阅维护命令
- 会议解析和文件获取
- 当您未提供专用 Teams 访问令牌时，基于 Graph 的 Teams 向外投递

## 步骤二：启用 Graph 网钩监听器

网钩监听器是一个名为 `msgraph_webhook` 的网关平台。至少需要启用它并设置一个客户端状态值：

```bash
MSGRAPH_WEBHOOK_ENABLED=true
MSGRAPH_WEBHOOK_PORT=8646
MSGRAPH_WEBHOOK_CLIENT_STATE=<random-shared-secret>
MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES=communications/onlineMeetings
```

该监听器暴露：
- `/msgraph/webhook` 用于 Graph 通知
- `/health` 用于简单健康检查

您需要将您的公共 HTTPS 端点路由到该监听器。例如，如果您的公共域名是 `https://ops.example.com`，则您的 Graph 通知 URL 通常为：

```text
https://ops.example.com/msgraph/webhook
```

## 步骤三：配置 Teams 投递和管道行为

会议管道从现有的 `teams` 平台条目中读取其运行时配置。管道特定的配置项位于 `teams.extra.meeting_pipeline` 下。Teams 向外投递保持在正常的 Teams 平台配置界面中。

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

      # 向外投递摘要
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

## Teams 投递模式

该管道在现有 Teams 插件内支持两种 Teams 摘要投递模式。

### `incoming_webhook`

当您希望通过简单网钩发送到 Teams，而不通过 Graph 创建频道消息时，请使用此模式。

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
- `team_id` + `home_channel` 作为现有 Teams 平台的回退

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

## 步骤四：启动网关

更新配置后正常启动 Hermes：

```bash
hermes gateway run
```

或者，如果您在 Docker 中运行 Hermes，请按照您部署时已有的方式启动网关。

检查监听器：

```bash
curl http://localhost:8646/health
```

## 步骤五：创建 Graph 订阅

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

:::warning Graph 订阅会在 72 小时后过期

Microsoft Graph 将网钩订阅上限设定为 72 小时，并且不会自动续订。您必须在上线前安排 `hermes teams-pipeline maintain-subscriptions`，否则在任何手动创建订阅三天后，通知将悄无声息地停止。请参阅操作员运维手册中的[自动续订订阅（生产环境必需）](/docs/guides/operate-teams-meeting-pipeline#automating-subscription-renewal-required-for-production)——有三个选项（Hermes 定时任务、systemd 计时器、普通 crontab）。

:::

有关订阅维护和日常操作员流程，请继续阅读指南：[运维 Teams 会议管道](/docs/guides/operate-teams-meeting-pipeline)。

## 验证

运行内置验证快照：

```bash
hermes teams-pipeline validate
```

有用的伴随检查：

```bash
hermes teams-pipeline token-health
hermes teams-pipeline subscriptions
```

## 故障排除

| 问题 | 检查内容 |
|------|----------|
| Graph 网钩验证失败 | 确认公共 URL 正确且可达，并且 Graph 正在调用精确的 `/msgraph/webhook` 路径 |
| 任务未出现在 `hermes teams-pipeline list` 中 | 确认 `msgraph_webhook` 已启用，且订阅指向正确的通知 URL |
| 优先使用会议记录从未成功 | 检查会议记录资源的 Graph 权限以及该会议是否存在会议记录文件 |
| 录音回退失败 | 确认已安装 `ffmpeg` 且 Graph 应用可以访问录音文件 |
| Teams 摘要投递失败 | 重新检查 `delivery_mode`、目标 ID 和 Teams 认证配置 |

## 相关文档

- [Microsoft Teams 机器人设置](/docs/user-guide/messaging/teams)
- [运维 Teams 会议管道](/docs/guides/operate-teams-meeting-pipeline)