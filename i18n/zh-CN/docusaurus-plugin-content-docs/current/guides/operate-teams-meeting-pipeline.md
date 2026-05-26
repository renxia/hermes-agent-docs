---
title: "运维 Teams 会议管道"
description: "Microsoft Teams 会议管道的运维手册、上线检查清单和运维人员工作表"
---

# 运维 Teams 会议管道

在通过 [Teams 会议设置](/user-guide/messaging/teams-meetings) 启用功能后，请使用本指南。

本页面涵盖：
- 运维人员 CLI 流程
- 日常订阅维护
- 故障排查
- 上线检查
- 推广工作表

## 核心运维命令

### 验证配置快照

```bash
hermes teams-pipeline validate
```

在进行任何配置更改后，请首先使用此命令。

### 检查令牌健康状况

```bash
hermes teams-pipeline token-health
hermes teams-pipeline token-health --force-refresh
```

当怀疑授权状态过期时，请使用 `--force-refresh`。

### 检查订阅

```bash
hermes teams-pipeline subscriptions
```

### 续期即将到期的订阅

```bash
hermes teams-pipeline maintain-subscriptions
hermes teams-pipeline maintain-subscriptions --dry-run
```

### 自动化订阅续期（生产环境必须）

**Microsoft Graph 订阅最长 72 小时后过期。** 如果没有进行续期操作，3 天后会议通知将悄然停止，管道看起来会"故障"。这是任何基于 Graph 的集成的第一大运营故障模式。

您**必须**定期运行 `maintain-subscriptions`。请从以下三种方案中选择一种：

#### 方案 1：Hermes cron（推荐，如果您已在运行 Hermes 网关）

Hermes 内置了 cron 调度器。`--no-agent` 模式运行脚本作为作业（而非使用 LLM），`--script` 必须指向 `~/.hermes/scripts/` 下的文件。首先创建脚本：

```bash
mkdir -p ~/.hermes/scripts
cat > ~/.hermes/scripts/maintain-teams-subscriptions.sh <<'EOF'
#!/usr/bin/env bash
exec hermes teams-pipeline maintain-subscriptions
EOF
chmod +x ~/.hermes/scripts/maintain-teams-subscriptions.sh
```

然后注册一个仅脚本的 cron 作业，每 12 小时运行一次（相对于 72 小时的过期窗口留有 6 倍余量）：

```bash
hermes cron create "0 */12 * * *" \
  --name "teams-pipeline-maintain-subscriptions" \
  --no-agent \
  --script maintain-teams-subscriptions.sh \
  --deliver local
```

验证作业已注册并检查下次运行时间：

```bash
hermes cron list
hermes cron status        # 调度器状态
```

#### 方案 2：systemd 定时器（推荐用于 Linux 生产部署）

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

#### 方案 3：普通 crontab

```cron
0 */12 * * * /usr/local/bin/hermes teams-pipeline maintain-subscriptions >> /var/log/hermes/teams-pipeline-maintain.log 2>&1
```

确保 cron 环境拥有 `MSGRAPH_*` 凭据。最简单的修复方法是：在 crontab 调用的包装脚本顶部加载 `~/.hermes/.env`。

#### 验证续期是否正常工作

设置好调度后，在第一次计划运行后检查续期活动：

```bash
hermes teams-pipeline subscriptions   # 应显示 expirationDateTime 已更新
hermes teams-pipeline maintain-subscriptions --dry-run   # 大多数时候应显示"0 项即将过期"
```

如果您发现 Graph webhook 在正好约 72 小时后神秘地"停止工作"，首先要检查的就是：续期作业是否真的运行了？

### 检查最近的作业

```bash
hermes teams-pipeline list
hermes teams-pipeline list --status failed
hermes teams-pipeline show <job-id>
```

### 重放存储的作业

```bash
hermes teams-pipeline run <job-id>
```

### 试运行会议产物获取

```bash
hermes teams-pipeline fetch --meeting-id <meeting-id>
hermes teams-pipeline fetch --join-web-url "<join-url>"
```

## 例行运维手册

### 初次设置后

按顺序运行以下命令：

```bash
hermes teams-pipeline validate
hermes teams-pipeline token-health --force-refresh
hermes teams-pipeline subscriptions
```

然后触发或等待真实的会议事件并确认：

```bash
hermes teams-pipeline list
hermes teams-pipeline show <job-id>
```

### 每日或定期检查

- 运行 `hermes teams-pipeline maintain-subscriptions --dry-run`
- 检查 `hermes teams-pipeline list --status failed`
- 验证 Teams 的投递目标仍然是正确的聊天或频道

### 更改 webhook URL 或投递目标之前

- 更新公共通知 URL 或 Teams 目标配置
- 运行 `hermes teams-pipeline validate`
- 续期或重新创建受影响的订阅
- 确认新事件已到达预期的接收器

## 故障排查

### 没有作业被创建

检查：
- `msgraph_webhook` 是否已启用
- 公共通知 URL 是否指向 `/msgraph/webhook`
- 订阅中的客户端状态是否与 `MSGRAPH_WEBHOOK_CLIENT_STATE` 匹配
- 订阅在远程是否仍然存在且未过期

### 作业停留在重试状态或在摘要生成前失败

检查：
- 转录的权限和可用性
- 录制的权限和产物可用性
- 如果启用了录制回退，检查 `ffmpeg` 的可用性
- Graph 令牌健康状况

### 摘要已生成但未投递到 Teams

检查：
- `platforms.teams.enabled: true`
- `delivery_mode`
- webhook 模式下的 `incoming_webhook_url`
- Graph 模式下的 `chat_id` 或 `team_id` 加上 `channel_id`
- 如果使用 Graph 发帖，则检查 Teams 授权配置

### 重复或意外的重放

检查：
- 是否您使用 `hermes teams-pipeline run` 手动重放了作业
- 该会议的接收器记录是否已存在
- 您是否在本地配置中故意启用了重发路径

## 上线检查清单

- [ ] Graph 凭据已存在且正确
- [ ] `msgraph_webhook` 已启用且可从公共互联网访问
- [ ] 已设置 `MSGRAPH_WEBHOOK_CLIENT_STATE` 且与订阅匹配
- [ ] 已创建转录订阅
- [ ] 如果需要 STT 回退，已创建录制订阅
- [ ] 如果启用了录制回退，已安装 `ffmpeg`
- [ ] Teams 出站投递目标已配置并验证
- [ ] Notion 和 Linear 接收器仅在确实需要时才配置
- [ ] `hermes teams-pipeline validate` 返回正常的快照
- [ ] `hermes teams-pipeline token-health --force-refresh` 成功
- [ ] **`maintain-subscriptions` 已安排调度**（Hermes cron、systemd 定时器或 crontab — 请参阅[自动化订阅续期](#automating-subscription-renewal-required-for-production)）。没有这个，Graph 订阅会在 72 小时内悄然过期。
- [ ] 一次真实的端到端会议事件已生成一个存储的作业
- [ ] 至少一个摘要已到达预期的投递接收器

## 投递模式决策指南

| 模式 | 适用场景 | 权衡 |
|------|----------|------|
| `incoming_webhook` | 您只需要简单地发布到 Teams | 设置最简单，控制较少 |
| `graph` | 您需要通过 Graph 发布到频道或聊天 | 控制更多，需要更多授权和目标配置 |

## 运维人员工作表

在推广前填写此表：

| 项目 | 值 |
|------|----|
| 公共通知 URL | |
| Graph 租户 ID | |
| Graph 客户端 ID | |
| Webhook 客户端状态 | |
| 转录资源订阅 | |
| 录制资源订阅 | |
| Teams 投递模式 | |
| Teams 聊天 ID 或团队/频道 | |
| Notion 数据库 ID | |
| Linear 团队 ID | |
| 存储路径覆盖（如有） | |
| 每日检查负责人 | |

## 变更审查工作表

在更改部署前使用此表：

| 问题 | 答案 |
|------|------|
| 我们是否正在更改公共 webhook URL？ | |
| 我们是否正在轮换 Graph 凭据？ | |
| 我们是否正在更改 Teams 投递模式？ | |
| 我们是否正在迁移到新的 Teams 聊天或频道？ | |
| 订阅是否需要重新创建或续期？ | |
| 我们是否需要进行一次全新的端到端验证运行？ | |

## 相关文档

- [Teams 会议设置](/user-guide/messaging/teams-meetings)
- [Microsoft Teams 机器人设置](/user-guide/messaging/teams)