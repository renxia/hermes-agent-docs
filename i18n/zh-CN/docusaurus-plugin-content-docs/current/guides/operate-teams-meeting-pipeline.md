---
title: "操作 Teams 会议管道"
description: "Microsoft Teams 会议管道的运行手册、上线清单和操作员工作表"
---

# 操作 Teams 会议管道

在已从 [Teams 会议](/docs/user-guide/messaging/teams-meetings) 启用该功能后，请使用此指南。

本页涵盖：
- 操作员 CLI 流程
- 常规订阅维护
- 故障排查
- 上线前检查
- 上线工作表

## 核心操作员命令

### 验证配置快照

```bash
hermes teams-pipeline validate
```

在任何配置更改后首先使用此命令。

### 检查令牌健康状况

```bash
hermes teams-pipeline token-health
hermes teams-pipeline token-health --force-refresh
```

当您怀疑身份验证状态过期时，请使用 `--force-refresh`。

### 检查订阅

```bash
hermes teams-pipeline subscriptions
```

### 续订即将过期的订阅

```bash
hermes teams-pipeline maintain-subscriptions
hermes teams-pipeline maintain-subscriptions --dry-run
```

### 自动续订订阅（生产环境必需）

**Microsoft Graph 订阅最多 72 小时过期。** 如果没有续订，会议通知将在 3 天后静默停止，管道看起来"坏了"。这是任何基于 Graph 的集成的第一大操作故障模式。

您必须按计划运行 `maintain-subscriptions`。选择以下三个选项之一：

#### 选项 1：Hermes cron（如果您已运行 Hermes 网关，则推荐）

Hermes 附带内置的 cron 调度程序。添加一个仅运行脚本的 cron 作业，每 12 小时运行一次（为 72 小时过期窗口提供 6 倍余量）：

```bash
hermes cron add \
  --name "teams-pipeline-maintain-subscriptions" \
  --schedule "0 */12 * * *" \
  --script-only \
  --command "hermes teams-pipeline maintain-subscriptions"
```

验证其已注册并检查下次运行时间：

```bash
hermes cron list
hermes cron show teams-pipeline-maintain-subscriptions
```

#### 选项 2：systemd 定时器（推荐用于 Linux 生产部署）

创建 `/etc/systemd/system/hermes-teams-pipeline-maintain.service`：

```ini
[Unit]
Description=Hermes Teams 管道订阅维护
After=network-online.target

[Service]
Type=oneshot
User=hermes
EnvironmentFile=/etc/hermes/env
ExecStart=/usr/local/bin/hermes teams-pipeline maintain-subscriptions
```

以及 `/etc/systemd/system/hermes-teams-pipeline-maintain.timer`：

```ini
[Unit]
Description=每 12 小时运行一次 Hermes Teams 管道订阅维护

[Timer]
OnBootSec=5min
OnUnitActiveSec=12h
Persistent=true

[Install]
WantedBy=timers.target
```

启用：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hermes-teams-pipeline-maintain.timer
systemctl list-timers hermes-teams-pipeline-maintain.timer
```

#### 选项 3：普通 crontab

```cron
0 */12 * * * /usr/local/bin/hermes teams-pipeline maintain-subscriptions >> /var/log/hermes/teams-pipeline-maintain.log 2>&1
```

确保 cron 环境具有 `MSGRAPH_*` 凭据。最简单的修复方法：在 crontab 调用的包装脚本顶部 source `~/.hermes/.env`。

#### 验证续订是否正常工作

设置计划后，在第一次计划运行后检查续订活动：

```bash
hermes teams-pipeline subscriptions   # 应显示 expirationDateTime 已提前
hermes teams-pipeline maintain-subscriptions --dry-run   # 大多数时间应显示"0 即将过期"
```

如果您发现您的 Graph webhook 在恰好约 72 小时后神秘地"停止工作"，这是首先要检查的事项：续订作业是否实际运行？

### 检查最近作业

```bash
hermes teams-pipeline list
hermes teams-pipeline list --status failed
hermes teams-pipeline show <job-id>
```

### 重放存储的作业

```bash
hermes teams-pipeline run <job-id>
```

### 试运行会议工件获取

```bash
hermes teams-pipeline fetch --meeting-id <meeting-id>
hermes teams-pipeline fetch --join-web-url "<join-url>"
```

## 常规运行手册

### 首次设置后

按顺序运行以下命令：

```bash
hermes teams-pipeline validate
hermes teams-pipeline token-health --force-refresh
hermes teams-pipeline subscriptions
```

然后触发或等待一个真实的会议事件并确认：

```bash
hermes teams-pipeline list
hermes teams-pipeline show <job-id>
```

### 每日或定期检查

- 运行 `hermes teams-pipeline maintain-subscriptions --dry-run`
- 检查 `hermes teams-pipeline list --status failed`
- 验证 Teams 传递目标仍是正确的聊天或频道

### 在更改 webhook URL 或传递目标之前

- 更新公共通知 URL 或 Teams 目标配置
- 运行 `hermes teams-pipeline validate`
- 续订或重新创建受影响的订阅
- 确认新事件到达预期的接收器

## 故障排查

### 没有创建作业

检查：
- `msgraph_webhook` 已启用
- 公共通知 URL 指向 `/msgraph/webhook`
- 订阅中的客户端状态与 `MSGRAPH_WEBHOOK_CLIENT_STATE` 匹配
- 订阅在远程仍存在且未过期

### 作业停留在重试状态或在总结前失败

检查：
- 转录权限和可用性
- 录制权限和工件可用性
- 如果启用了录制回退，`ffmpeg` 是否可用
- Graph 令牌健康状况

### 已生成摘要但未传递到 Teams

检查：
- `platforms.teams.enabled: true`
- `delivery_mode`
- webhook 模式的 `incoming_webhook_url`
- Graph 模式的 `chat_id` 或 `team_id` 加上 `channel_id`
- 如果使用 Graph 发布，Teams 身份验证配置

### 重复或意外的重放

检查：
- 是否使用 `hermes teams-pipeline run` 手动重放了作业
- 该会议的接收器记录是否已存在
- 是否在本地配置中故意启用了重新发送路径

## 上线清单

- [ ] Graph 凭据存在且正确
- [ ] `msgraph_webhook` 已启用且可从公共互联网访问
- [ ] `MSGRAPH_WEBHOOK_CLIENT_STATE` 已设置且与订阅匹配
- [ ] 已创建转录订阅
- [ ] 如果 STT 回退是必需的，已创建录制订阅
- [ ] 如果启用了录制回退，已安装 `ffmpeg`
- [ ] Teams 出站传递目标已配置并验证
- [ ] 仅在实际需要时配置 Notion 和 Linear 接收器
- [ ] `hermes teams-pipeline validate` 返回 OK 快照
- [ ] `hermes teams-pipeline token-health --force-refresh` 成功
- [ ] **已安排 `maintain-subscriptions`**（Hermes cron、systemd 定时器或 crontab — 参见 [自动续订订阅](#automating-subscription-renewal-required-for-production)）。没有此操作，Graph 订阅将在 72 小时内静默过期。
- [ ] 一个真实的端到端会议事件已生成存储的作业
- [ ] 至少一个摘要已到达预期的传递接收器

## 传递模式决策指南

| 模式 | 使用场景 | 权衡 |
|------|----------|------|
| `incoming_webhook` | 您只需要简单发布到 Teams | 设置最简单，控制较少 |
| `graph` | 您需要通过 Graph 发布到频道或聊天 | 更多控制，更多身份验证和目标配置 |

## 操作员工作表

在上线前填写此表：

| 项目 | 值 |
|------|-------|
| 公共通知 URL | |
| Graph 租户 ID | |
| Graph 客户端 ID | |
| Webhook 客户端状态 | |
| 转录资源订阅 | |
| 录制资源订阅 | |
| Teams 传递模式 | |
| Teams 聊天 ID 或团队/频道 | |
| Notion 数据库 ID | |
| Linear 团队 ID | |
| 存储路径覆盖（如果有） | |
| 每日检查负责人 | |

## 变更审查工作表

在更改部署前使用此表：

| 问题 | 答案 |
|----------|--------|
| 我们是否要更改公共 webhook URL？ | |
| 我们是否要轮换 Graph 凭据？ | |
| 我们是否要更改 Teams 传递模式？ | |
| 我们是否要移动到新的 Teams 聊天或频道？ | |
| 订阅是否需要重新创建或续订？ | |
| 我们是否需要一次全新的端到端验证运行？ | |

## 相关文档

- [Teams 会议设置](/docs/user-guide/messaging/teams-meetings)
- [Microsoft Teams 机器人设置](/docs/user-guide/messaging/teams)