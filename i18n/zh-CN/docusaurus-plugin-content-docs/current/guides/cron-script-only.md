---
sidebar_position: 13
title: "纯脚本定时任务（无LLM）"
description: "完全跳过LLM的经典监控类定时任务——脚本按计划运行，其标准输出内容将推送到您的消息平台。内存告警、磁盘告警、CI通知、定期健康检查。"
---

# 纯脚本定时任务

有时您已经明确知道想要发送什么消息。您不需要智能体来推理它——只需要一个脚本按计时器运行，并将其输出（如果有）推送到 Telegram / Discord / Slack / Signal。

Hermes 称此为**无智能体模式**。它是减去了 LLM 的定时任务系统。

<!-- ascii-guard-ignore -->
```
   ┌──────────────────┐          ┌──────────────────┐
   │ 调度器触发       │  每N    │ 运行脚本         │
   │ （每N分钟）      │ ──────▶ │ (bash 或 python) │
   └──────────────────┘  分钟   └──────────────────┘
                                          │
                                          │ 标准输出
                                          ▼
                                 ┌──────────────────┐
                                 │ 投递路由器       │
                                 │ (telegram/disc…) │
                                 └──────────────────┘
```
<!-- ascii-guard-ignore-end -->

- **无 LLM 调用。** 零令牌消耗，零智能体循环，零模型开销。
- **脚本即任务。** 脚本决定是否发出警报。产生输出 → 消息即被发送。无输出 → 静默触发。
- **Bash 或 Python。** `.sh` / `.bash` 文件在 `/bin/bash` 下运行；任何其他扩展名的文件在当前的 Python 解释器下运行。`~/.hermes/scripts/` 目录下的任何文件均可接受。
- **相同的调度器。** 与 LLM 任务共存于 `cronjob` 中——暂停、恢复、列表、日志和投递目标设置的工作方式完全相同。

## 何时使用

请在以下场景使用无智能体模式：

- **内存/磁盘/GPU 监控。** 每 5 分钟运行一次，仅当超过阈值时发出警报。
- **CI 钩子。** 部署完成 → 发布提交 SHA。构建失败 → 发送日志的最后 100 行。
- **定期指标。** “每日 Stripe 收入（上午9点）”作为一次简单的 API 调用并格式化输出。
- **外部事件轮询器。** 检查一个 API，并在状态变化时发出警报。
- **心跳检测。** 每 N 分钟 ping 一次仪表板，以证明主机仍在运行。

当您需要智能体来**决定**说什么时——例如总结一份长文档、从订阅源中挑选有趣的条目、起草一条人性化的消息——请使用普通的（LLM 驱动的）定时任务。而无智能体路径适用于脚本的输出内容本身就是消息的场景。

## 从聊天中创建

无智能体模式真正的优势在于，智能体本身可以为您设置看门狗——无需编辑器、shell 或记住 CLI 标志。您只需描述您想要什么，Hermes 就会编写脚本、安排调度，并告知您触发时间。

### 示例对话记录

> **您：** 如果内存占用超过 85%，每 5 分钟通过 Telegram 通知我
>
> **Hermes：** *（编写 `~/.hermes/scripts/memory-watchdog.sh`，然后使用 `cronjob(...)` 并设置 `no_agent=true`）*
>
> 已设置完成。每 5 分钟运行一次，仅在内存占用超过 85% 时通过 Telegram 发出警报。脚本：`memory-watchdog.sh`。作业 ID：`abc123`。

底层实现中，智能体进行了两次工具调用：

```python
# 1. 编写检查脚本
write_file(
    path="~/.hermes/scripts/memory-watchdog.sh",
    content='''#!/usr/bin/env bash
ram_pct=$(free | awk '/^Mem:/ {printf "%d", $3 * 100 / $2}')
if [ "$ram_pct" -ge 85 ]; then
  echo "RAM ${ram_pct}% on $(hostname)"
fi
# 空的标准输出 = 静默触发；不发送任何消息。
''',
)

# 2. 安排调度 — no_agent=True 跳过每次触发时的 LLM 调用
cronjob(
    action="create",
    schedule="every 5m",
    script="memory-watchdog.sh",
    no_agent=True,
    deliver="telegram",
    name="memory-watchdog",
)
```

从此以后，每次触发都是免费的：调度器运行脚本，如果标准输出非空则将其发送到 Telegram，并且永远不会调用模型。

### 智能体为您做出的决策

当您用这样的方式描述请求时：“在 X 发生时提醒我”或“每 N 分钟检查 Y 并告诉我 Z 的情况”，Hermes 的 `cronjob` 工具描述会指引它在消息内容完全由脚本确定时使用 `no_agent=True`。当请求需要推理时（*“总结新议题”*、*“挑选最有趣的头条新闻”*、*“草拟一条友好提醒”*），它会回退到正常的 LLM 驱动路径。

您无需自己指定 `--no-agent`。只需描述行为即可。

### 从聊天中管理看门狗

智能体可以像创建一样，暂停、恢复、编辑和移除作业：

> **您：** 今晚暂停内存看门狗
>
> **Hermes：** *（调用 `cronjob(action='pause', job_id='abc123')`）*
>
> 已暂停。可通过“重新开启它”或 `hermes cron resume abc123` 恢复。

> **您：** 改为每 15 分钟一次
>
> **Hermes：** *（调用 `cronjob(action='update', job_id='abc123', schedule='every 15m')`）*

完整的生命周期（创建 / 列表 / 更新 / 暂停 / 恢复 / 立即运行 / 移除）对智能体开放，您无需学习任何 CLI 命令。

## 从 CLI 创建

更喜欢 shell？CLI 路径可以用三个命令达到相同效果：

```bash
# 1. 编写脚本
cat > ~/.hermes/scripts/memory-watchdog.sh <<'EOF'
#!/usr/bin/env bash
# 当内存使用率超过 85% 时发出警报。否则静默。
RAM_PCT=$(free | awk '/^Mem:/ {printf "%d", $3 * 100 / $2}')
if [ "$RAM_PCT" -ge 85 ]; then
  echo "⚠ RAM ${RAM_PCT}% on $(hostname)"
fi
# 空的标准输出 = 静默运行；不发送任何消息。
EOF
chmod +x ~/.hermes/scripts/memory-watchdog.sh

# 2. 安排调度
hermes cron create "every 5m" \
  --no-agent \
  --script memory-watchdog.sh \
  --deliver telegram \
  --name "memory-watchdog"

# 3. 验证
hermes cron list
hermes cron run <job_id>    # 触发一次进行测试
```

就这么简单。无需提示词、无需技能、无需模型。


## 脚本输出如何映射到投递

| 脚本行为 | 结果 |
|----------|------|
| 退出码 0，标准输出非空 | 标准输出被原样投递 |
| 退出码 0，标准输出为空 | 静默触发 — 不投递 |
| 退出码 0，标准输出最后一行包含 `{"wakeAgent": false}` | 静默触发（与 LLM 作业共享的门槛） |
| 非零退出码 | 投递错误警报（确保损坏的看门狗不会静默失败） |
| 脚本超时 | 投递错误警报 |

“为空即静默”的行为是经典看门狗模式的关键：脚本可以自由地每分钟运行一次，但只有当确实需要注意时，频道才会看到一条消息。

## 脚本规则

脚本必须存放在 `~/.hermes/scripts/` 目录中。这在作业创建时和运行时都会强制执行——绝对路径、`~/` 展开以及路径遍历模式（`../`）都会被拒绝。该目录与 LLM 作业使用的预检查脚本门槛共享。

解释器选择基于文件扩展名：

| 扩展名 | 解释器 |
|--------|--------|
| `.sh`, `.bash` | `/bin/bash` |
| 其他任何扩展名 | `sys.executable`（当前 Python 解释器） |

我们故意不识别 `#!/...` shebang 行——保持解释器集合的明确和精简，减少了调度器需要信任的范围。

## 调度语法

与所有其他定时作业相同：

```bash
hermes cron create "every 5m"        # 时间间隔
hermes cron create "every 2h"
hermes cron create "0 9 * * *"       # 标准 cron：每天上午 9 点
hermes cron create "30m"             # 一次性作业：30 分钟后运行一次
```

完整语法请参阅 [定时任务功能参考](/user-guide/features/cron)。

## 投递目标

`--deliver` 接受网关已知的所有目标。一些常见格式：

```bash
--deliver telegram                       # 平台主频道
--deliver telegram:-1001234567890        # 特定聊天
--deliver telegram:-1001234567890:17585  # 特定的 Telegram 论坛话题
--deliver discord:#ops
--deliver slack:#engineering
--deliver signal:+15551234567
--deliver local                          # 仅保存到 ~/.hermes/cron/output/
```

对于支持机器人令牌的平台（Telegram、Discord、Slack、Signal、SMS、WhatsApp），脚本运行时无需运行网关——该工具直接使用已存储在 `~/.hermes/.env` / `~/.hermes/config.yaml` 中的凭据调用每个平台的 REST 端点。

## 编辑与生命周期

```bash
hermes cron list                                    # 查看所有作业
hermes cron pause <job_id>                          # 停止触发，保留定义
hermes cron resume <job_id>
hermes cron edit <job_id> --schedule "every 10m"    # 调整频率
hermes cron edit <job_id> --agent                   # 切换为 LLM 模式
hermes cron edit <job_id> --no-agent --script …     # 切换回来
hermes cron remove <job_id>                         # 删除作业
```

适用于 LLM 作业的所有操作（暂停、恢复、手动触发、更改投递目标）同样适用于无智能体作业。

## 实际示例：磁盘空间警报

```bash
cat > ~/.hermes/scripts/disk-alert.sh <<'EOF'
#!/usr/bin/env bash
# 当 / 或 /home 空间使用率超过 90% 时发出警报。
THRESHOLD=90
df -h / /home 2>/dev/null | awk -v t="$THRESHOLD" '
  NR > 1 && $5+0 >= t {
    printf "⚠ Disk %s full on %s\n", $5, $6
  }
'
EOF
chmod +x ~/.hermes/scripts/disk-alert.sh

hermes cron create "*/15 * * * *" \
  --no-agent \
  --script disk-alert.sh \
  --deliver telegram \
  --name "disk-alert"
```

当两个文件系统使用率都低于 90% 时静默；当有文件系统空间填满时，正好为每个超过阈值的文件系统触发一行警报。

## 与其他模式的比较

| 方法 | 运行内容 | 适用场景 |
|------|----------|----------|
| `cronjob --no-agent`（本页） | 您的脚本按 Hermes 调度运行 | 不需要推理的定期看门狗 / 警报 / 指标 |
| `cronjob`（默认，LLM） | 带可选预检查脚本的智能体 | 当消息内容需要对数据进行推理时 |
| 操作系统 cron + `curl` 到 [Webhook 订阅](/user-guide/messaging/webhooks) | 您的脚本按操作系统调度运行 | 当 Hermes 可能不健康时（您正在监控的东西） |

对于必须在*网关宕机时仍能触发*的关键系统健康看门狗，请使用操作系统级别的 cron 配合指向 Hermes Webhook 订阅（或任何外部警报端点）的简单 `curl` ——这些作为独立的操作系统进程运行，不依赖于 Hermes 的运行状态。当被监控的对象是外部系统时，网关内的调度器是正确的选择。
## 相关内容

- [使用 Cron 自动化任何任务](/guides/automate-with-cron) — LLM 驱动的定时任务模式。
- [定时任务 (Cron) 参考](/user-guide/features/cron) — 完整的调度语法、生命周期、投递路由。
- [Webhook 订阅](/user-guide/messaging/webhooks) — 用于外部调度器的“即发即忘”HTTP 入口点。
- [网关内部机制](/developer-guide/gateway-internals) — 投递路由器内部实现。