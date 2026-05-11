---
title: "运维 Teams 会议管道"
description: "Microsoft Teams 会议管道的运维手册、上线检查清单和操作工作表"
---

# 运维 Teams 会议管道

在您已通过 [Teams 会议设置](/docs/user-guide/messaging/teams-meetings) 启用此功能后，请使用本指南。

本页面涵盖：
- 操作员命令行流程
- 常规订阅维护
- 故障分类
- 上线检查
- 部署工作表

## 核心操作员命令

### 验证配置快照

```bash
hermes teams-pipeline validate
```

在进行任何配置更改后，请首先运行此命令。

### 检查令牌健康状况

```bash
hermes teams-pipeline token-health
hermes teams-pipeline token-health --force-refresh
```

当您怀疑认证状态过时时，请使用 `--force-refresh`。

### 检查订阅

```bash
hermes teams-pipeline subscriptions
```

### 续订即将过期的订阅

```bash
hermes teams-pipeline maintain-subscriptions
hermes teams-pipeline maintain-subscriptions --dry-run
```

### 自动续订订阅（生产环境必须配置）

**Microsoft Graph 订阅最长 72 小时后过期。** 如果没有任何机制续订它们，会议通知将在 3 天后静默停止，管道看起来就像“损坏”了。这是任何基于 Graph 的集成面临的首要运维故障模式。

您必须定期运行 `maintain-subscriptions`。请从以下三个选项中选择一个：

#### 选项 1：Hermes cron（如果您已经运行 Hermes 网关，则推荐使用）

Hermes 自带一个内置的 cron 调度器。`--no-agent` 模式将脚本作为作业运行（而不是使用 LLM），`--script` 必须指向 `~/.hermes/scripts/` 下的一个文件。首先创建脚本：

```bash
mkdir -p ~/.hermes/scripts
cat > ~/.hermes/scripts/maintain-teams-subscriptions.sh <<'EOF'
#!/usr/bin/env bash
exec hermes teams-pipeline maintain-subscriptions
EOF
chmod +x ~/.hermes/scripts/maintain-teams-subscriptions.sh
```

然后注册一个仅脚本的 cron 作业，每 12 小时运行一次（为 72 小时过期窗口提供了 6 倍的缓冲）：

```bash
hermes cron create "0 */12 * * *" \
  --name "teams-pipeline-maintain-subscriptions" \
  --no-agent \
  --script maintain-teams-subscriptions.sh \
  --deliver local
```

验证其是否已注册并检查下次运行时间：

```bash
hermes cron list
hermes cron status        # 调度器状态
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

设置好调度计划后，在第一次计划运行后检查续订活动：

```bash
hermes teams-pipeline subscriptions   # 应显示过期时间已延长
hermes teams-pipeline maintain-subscriptions --dry-run   # 大多数时候应显示"0 个即将过期"
```

如果您发现 Graph webhook 在大约 72 小时后神秘地“停止工作”，请首先检查这一点：续订作业是否实际运行了？

### 检查最近的作业

```bash
hermes teams-pipeline list
hermes teams-pipeline list --status failed
hermes teams-pipeline show <job-id>
```

### 重放一个已存储的作业

```bash
hermes teams-pipeline run <job-id>
```

### 模拟获取会议产出物

```bash
hermes teams-pipeline fetch --meeting-id <meeting-id>
hermes teams-pipeline fetch --join-web-url "<join-url>"
```

## 常规运维手册

### 初始设置后

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
- 验证 Teams 投递目标是否仍是正确的聊天或频道

### 更改 webhook URL 或投递目标前

- 更新公开通知 URL 或 Teams 目标配置
- 运行 `hermes teams-pipeline validate`
- 续订或重新创建受影响的订阅
- 确认新事件到达预期的接收端

## 故障分类

### 没有作业被创建

检查：
- `msgraph_webhook` 是否已启用
- 公开通知 URL 是否指向 `/msgraph/webhook`
- 订阅中的客户端状态是否与 `MSGRAPH_WEBHOOK_CLIENT_STATE` 匹配
- 远程订阅是否仍然存在且未过期

### 作业卡在重试状态或在摘要生成前失败

检查：
- 转录权限和可用性
- 录音权限和产出物可用性
- 如果启用了录音回退，检查 `ffmpeg` 是否可用
- Graph 令牌健康状况

### 摘要已生成但未投递到 Teams

检查：
- `platforms.teams.enabled: true`
- `delivery_mode`
- 如果使用 webhook 模式，检查 `incoming_webhook_url`
- 如果使用 Graph 模式，检查 `chat_id` 或 `team_id` 加上 `channel_id`
- 如果使用 Graph 发布，检查 Teams 认证配置

### 重复或意外的重放

检查：
- 您是否使用 `hermes teams-pipeline run` 手动重放了一个作业
- 该会议的接收端记录是否已存在
- 您是否在本地配置中故意启用了重新发送路径

## 上线检查清单

- [ ] Graph 凭据存在且正确
- [ ] `msgraph_webhook` 已启用且可从公共互联网访问
- [ ] `MSGRAPH_WEBHOOK_CLIENT_STATE` 已设置且与订阅匹配
- [ ] 已创建转录订阅
- [ ] 如果需要 STT 回退，已创建录音订阅
- [ ] 如果启用了录音回退，已安装 `ffmpeg`
- [ ] Teams 出站投递目标已配置并验证
- [ ] Notion 和 Linear 接收端仅在实际需要时配置
- [ ] `hermes teams-pipeline validate` 返回一个 OK 快照
- [ ] `hermes teams-pipeline token-health --force-refresh` 成功
- [ ] **`maintain-subscriptions` 已安排调度**（Hermes cron、systemd 定时器或 crontab — 参见[自动续订订阅](#自动续订订阅（生产环境必须配置）)）。不进行此操作，Graph 订阅将在 72 小时内静默过期。
- [ ] 一个真实的端到端会议事件已产生一个存储作业
- [ ] 至少一个摘要已到达预期的投递接收端

## 投递模式决策指南

| 模式 | 使用场景 | 权衡 |
|------|----------|------|
| `incoming_webhook` | 您只需要简单地发布到 Teams | 设置最简单，控制力较弱 |
| `graph` | 您需要通过 Graph 发布到频道或聊天 | 控制力更强，需要更多认证和目标配置 |

## 操作员工作表

在上线前填写此表：

| 项目 | 值 |
|------|---|
| 公开通知 URL | |
| Graph 租户 ID | |
| Graph 客户端 ID | |
| Webhook 客户端状态 | |
| 转录资源订阅 | |
| 录音资源订阅 | |
| Teams 投递模式 | |
| Teams 聊天 ID 或 团队/频道 | |
| Notion 数据库 ID | |
| Linear 团队 ID | |
| 存储路径覆盖（如果有） | |
| 每日检查负责人 | |

## 变更审查工作表

在更改部署前使用此表：

| 问题 | 答案 |
|------|------|
| 我们是否要更改公共 webhook URL？ | |
| 我们是否要轮换 Graph 凭据？ | |
| 我们是否要更改 Teams 投递模式？ | |
| 我们是否要迁移到新的 Teams 聊天或频道？ | |
| 订阅是否需要重新创建或续订？ | |
| 我们是否需要进行一次全新的端到端验证运行？ | |

## 相关文档

- [Teams 会议设置](/docs/user-guide/messaging/teams-meetings)
- [Microsoft Teams 机器人设置](/docs/user-guide/messaging/teams)