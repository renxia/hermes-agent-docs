---
sidebar_position: 6
title: "Teams 会议"
description: "使用 Microsoft Graph Webhook 设置 Microsoft Teams 会议摘要处理管道"
---

# Microsoft Teams 会议

当您希望 Hermes 接收 Microsoft Graph 会议事件，优先获取转录稿，在必要时回退到录音加语音转文字，并向下游接收方提供结构化摘要时，请使用 Teams 会议管道。

前提条件：请参阅 [Microsoft Teams](./teams.md) 了解底层机器人/凭证设置。

> 运行 `hermes gateway setup` 并选择 **Teams Meetings** 以获取引导式设置流程。

本页面侧重于设置与启用：
- Graph 凭证
- Webhook 监听器配置
- Teams 投递模式
- 管道配置结构

有关日常运维、上线检查和操作员工作表，请使用专用指南：[运维 Teams 会议管道](/guides/operate-teams-meeting-pipeline)。

## 此功能的作用

该管道：
1. 接收 Microsoft Graph Webhook 事件
2. 解析会议信息，并优先选择转录稿
3. 在没有可用转录稿时，回退到录音下载并加语音转文字
4. 在本地存储持久化的任务状态和接收方记录
5. 可将摘要写入 Notion、Linear 和 Microsoft Teams

操作员操作通过 CLI 进行（`teams-pipeline` 子命令由 `teams_pipeline` 插件注册——可通过 `hermes plugins enable teams_pipeline` 启用，或在 `config.yaml` 中设置 `plugins.enabled: [teams_pipeline]`）：

```bash
hermes teams-pipeline validate
hermes teams-pipeline list
hermes teams-pipeline maintain-subscriptions
```

## 前提条件

在启用会议管道之前，请确保您已具备：

- 一个正常工作的 Hermes 安装实例
- 现有的 [Microsoft Teams 机器人设置](/user-guide/messaging/teams)（如果您需要 Teams 出站投递）
- 带有所需权限的 Microsoft Graph 应用程序凭证，用于您计划订阅的会议资源
- 一个 Microsoft Graph 可以调用的公共 HTTPS URL 用于 Webhook 投递
- 如果需要录音加语音转文字回退，请安装 `ffmpeg`

## 步骤 1：添加 Microsoft Graph 凭证

将 Graph 应用专用凭证添加到 `~/.hermes/.env`：

```bash
MSGRAPH_TENANT_ID=<租户-ID>
MSGRAPH_CLIENT_ID=<客户端-ID>
MSGRAPH_CLIENT_SECRET=<客户端-密钥>
```

这些凭证用于：
- Graph 客户端基础库
- 订阅维护命令
- 会议解析和工件获取
- 当您未提供专用 Teams 访问令牌时，基于 Graph 的 Teams 出站投递

## 步骤 2：启用 Graph Webhook 监听器

Webhook 监听器是一个名为 `msgraph_webhook` 的网关平台。至少需要启用它并设置一个客户端状态值：

```bash
MSGRAPH_WEBHOOK_ENABLED=true
MSGRAPH_WEBHOOK_HOST=127.0.0.1
MSGRAPH_WEBHOOK_PORT=8646
MSGRAPH_WEBHOOK_CLIENT_STATE=<随机共享密钥>
MSGRAPH_WEBHOOK_ACCEPTED_RESOURCES=communications/onlineMeetings
```

监听器暴露端点：
- `/msgraph/webhook` 用于 Graph 通知
- `/health` 用于简单的健康检查

您需要将公共 HTTPS 端点路由到该监听器。例如，如果您的公共域名是 `https://ops.example.com`，则您的 Graph 通知 URL 通常是：

```text
https://ops.example.com/msgraph/webhook
```

## 步骤 3：配置 Teams 投递与管道行为

会议管道从现有的 `teams` 平台条目读取其运行时配置。管道特定的配置项位于 `teams.extra.meeting_pipeline` 下。Teams 出站投递保持在正常的 Teams 平台配置面。

`~/.hermes/config.yaml` 示例：

```yaml
platforms:
  msgraph_webhook:
    enabled: true
    extra:
      host: 127.0.0.1
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

      # 出站摘要投递
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

如果您将监听器绑定到非回环主机（如 `0.0.0.0`），则还必须将 `allowed_source_cidrs` 设置为 Microsoft 的 Webhook 出口 IP 范围。回环绑定（`127.0.0.1` / `::1`）是用于开发隧道和本地反向代理的预期设置。

## Teams 投递模式

该管道在现有的 Teams 插件内支持两种 Teams 摘要投递模式。

### `incoming_webhook`

当您希望简单地将 Webhook 帖子发送到 Teams，而不需要通过 Graph 创建频道消息时使用此模式。

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

当您希望 Hermes 通过 Microsoft Graph 将摘要发布到 Teams 聊天或频道时使用此模式。

支持的目标：
- `chat_id`
- `team_id` + `channel_id`
- `team_id` + `home_channel`（作为现有 Teams 平台的回退）

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

或者，如果您在 Docker 中运行 Hermes，请像您已有的部署方式一样启动网关。

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

:::warning Graph 订阅会在 72 小时后过期

Microsoft Graph 将 Webhook 订阅期限上限设为 72 小时，并且不会自动续订。您**必须**在上线前安排运行 `hermes teams-pipeline maintain-subscriptions`，否则在任何手动创建订阅的三天后，通知将静默停止。请参阅运维手册中的[自动化订阅续订](/guides/operate-teams-meeting-pipeline#automating-subscription-renewal-required-for-production)——有三种选择（Hermes 定时任务、systemd 定时器、普通 crontab）。

:::

有关订阅维护和日常运维流程，请继续阅读指南：[运维 Teams 会议管道](/guides/operate-teams-meeting-pipeline)。

## 验证

运行内置的验证快照：

```bash
hermes teams-pipeline validate
```

有用的辅助检查：

```bash
hermes teams-pipeline token-health
hermes teams-pipeline subscriptions
```

## 故障排查

| 问题 | 检查内容 |
|------|----------|
| Graph Webhook 验证失败 | 确认公共 URL 正确且可达，并且 Graph 调用的是准确的 `/msgraph/webhook` 路径 |
| 任务未出现在 `hermes teams-pipeline list` 中 | 确认 `msgraph_webhook` 已启用，并且订阅指向了正确的通知 URL |
| 转录稿优先始终失败 | 检查 Graph 对转录资源的权限，以及该会议的转录工件是否存在 |
| 录音回退失败 | 确认 `ffmpeg` 已安装，并且 Graph 应用可以访问录音工件 |
| Teams 摘要投递失败 | 重新检查 `delivery_mode`、目标 ID 和 Teams 认证配置 |

## 相关文档

- [Microsoft Teams 机器人设置](/user-guide/messaging/teams)
- [运维 Teams 会议管道](/guides/operate-teams-meeting-pipeline)