---
sidebar_position: 13
title: "仅脚本定时任务（无 LLM）"
description: "完全跳过 LLM 的经典看门狗定时任务 —— 脚本按计划运行，其标准输出会被发送到您的消息平台。内存告警、磁盘告警、CI 心跳、定期健康检查。"
---

# 仅脚本定时任务

有时您已经确切知道要发送什么消息。您不需要智能体进行推理 —— 您只需要一个脚本按计时器运行，并且其输出（如果有）能到达 Telegram / Discord / Slack / Signal。

Hermes 称之为**无智能体模式**。它是去除了 LLM 的 cron 系统。

```
   ┌──────────────────┐          ┌──────────────────┐
   │ 调度器触发       │  每隔    │ 运行脚本         │
   │ (每 N 分钟)      │ ──────▶ │ (bash 或 python) │
   └──────────────────┘          └──────────────────┘
                                          │
                                          │ 标准输出
                                          ▼
                                 ┌──────────────────┐
                                 │ 消息分发路由     │
                                 │ (telegram/disc…) │
                                 └──────────────────┘
```

- **无 LLM 调用。** 零 token，零智能体循环，零模型开销。
- **脚本即任务。** 脚本决定是否告警。输出内容 → 消息被发送。无输出 → 静默触发。
- **Bash 或 Python。** `.sh` / `.bash` 文件在 `/bin/bash` 下运行；任何其他扩展名在当前 Python 解释器下运行。`~/.hermes/scripts/` 中的任何内容均可接受。
- **相同的调度器。** 与 LLM 任务共存于 `cronjob` 中 —— 暂停、恢复、列出、日志和消息分发目标设置都以相同方式工作。

## 何时使用

在以下情况下使用无智能体模式：

- **内存 / 磁盘 / GPU 看门狗。** 每 5 分钟运行一次，仅在阈值被突破时告警。
- **CI 钩子。** 部署完成 → 发布提交 SHA。构建失败 → 发送日志的最后 100 行。
- **定期指标。** “上午 9 点每日 Stripe 收入” 可通过简单的 API 调用 + 美观打印实现。
- **外部事件轮询器。** 检查 API，在状态变化时告警。
- **心跳。** 每 N 分钟向仪表板发送一次心跳，以证明主机处于活动状态。

当您**需要智能体决定**要说什么时，请使用普通（由 LLM 驱动）的定时任务 —— 总结长文档、从信息流中挑选有趣的内容、起草友好的人类消息。无智能体路径适用于脚本的标准输出本身即为消息的情况。

## 通过聊天创建一个

无智能体模式真正的优势在于，智能体本身可以为你设置监控脚本——无需编辑器，无需 shell，也无需记住 CLI 参数。你只需描述你的需求，Hermes 就会编写脚本、安排调度，并告知你它何时运行。

### 示例对话记录

> **你：** 每 5 分钟检查一次内存使用率，如果超过 85% 就通过 Telegram 通知我
>
> **Hermes：** *(编写 `~/.hermes/scripts/memory-watchdog.sh`，然后调用 `cronjob(...)` 并设置 `no_agent=true`)*
>
> 已设置。每 5 分钟运行一次，仅当内存使用率超过 85% 时向 Telegram 发送警报。脚本：`memory-watchdog.sh`。任务 ID：`abc123`。

在底层，智能体进行了两次工具调用：

```python
# 1. 编写检查脚本
write_file(
    path="~/.hermes/scripts/memory-watchdog.sh",
    content='''#!/usr/bin/env bash
ram_pct=$(free | awk '/^Mem:/ {printf "%d", $3 * 100 / $2}')
if [ "$ram_pct" -ge 85 ]; then
  echo "RAM ${ram_pct}% on $(hostname)"
fi
# 标准输出为空 = 静默滴答；不发送消息。
''',
)

# 2. 安排调度 — no_agent=True 会在每次滴答时跳过 LLM
cronjob(
    action="create",
    schedule="every 5m",
    script="memory-watchdog.sh",
    no_agent=True,
    deliver="telegram",
    name="memory-watchdog",
)
```

从那时起，每次滴答都是免费的：调度器运行脚本，如果其标准输出非空，则将其管道传输到 Telegram，并且永远不会触及模型。

### 智能体为你决定的内容

当你提出类似“当 X 时提醒我”或“每 N 分钟检查 Y 并告诉我 Z 是否成立”的请求时，Hermes 的 `cronjob` 工具描述会指示它在消息内容完全由脚本决定时始终使用 `no_agent=True`。当请求需要推理时（例如“总结新问题”、“挑选最有趣的标题”、“起草友好的提醒”），它会回退到正常的由 LLM 驱动的流程。

你无需自己指定 `--no-agent`。只需描述行为即可。

### 通过聊天管理监控脚本

智能体可以暂停、恢复、编辑和删除任务，就像创建它们一样：

> **你：** 今晚暂停内存监控脚本
>
> **Hermes：** *(调用 `cronjob(action='pause', job_id='abc123')`)*
>
> 已暂停。使用“turn it back on”或通过 `hermes cron resume abc123` 恢复。

> **你：** 将其更改为每 15 分钟一次
>
> **Hermes：** *(调用 `cronjob(action='update', job_id='abc123', schedule='every 15m')`)*

整个生命周期（创建 / 列出 / 更新 / 暂停 / 恢复 / 立即运行 / 删除）都可供智能体使用，而无需你学习任何 CLI 命令。

## 通过 CLI 创建一个

更喜欢使用 shell？CLI 路径可以用三个命令实现相同的结果：

```bash
# 1. 编写你的脚本
cat > ~/.hermes/scripts/memory-watchdog.sh <<'EOF'
#!/usr/bin/env bash
# 当内存使用率超过 85% 时发出警报。否则保持静默。
RAM_PCT=$(free | awk '/^Mem:/ {printf "%d", $3 * 100 / $2}')
if [ "$RAM_PCT" -ge 85 ]; then
  echo "⚠ RAM ${RAM_PCT}% on $(hostname)"
fi
# 标准输出为空 = 静默运行；不发送消息。
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
hermes cron run <job_id>    # 运行一次以进行测试
```

就是这样。没有提示词，没有技能，没有模型。


## 脚本输出如何映射到交付目标

| 脚本行为 | 结果 |
|-----------------|--------|
| 退出码为 0，标准输出非空 | 标准输出原样交付 |
| 退出码为 0，标准输出为空 | 静默滴答 — 不交付 |
| 退出码为 0，标准输出的最后一行包含 `{"wakeAgent": false}` | 静默滴答（与 LLM 任务共享门控） |
| 非零退出码 | 错误警报会被交付（因此损坏的监控脚本不会静默失败） |
| 脚本超时 | 错误警报会被交付 |

“空输出时静默”的行为是经典监控脚本模式的关键：脚本可以自由地每分钟运行一次，但只有当某些内容真正需要关注时，通道才会看到消息。

## 脚本规则

脚本必须位于 `~/.hermes/scripts/` 目录中。这在任务创建时和运行时都会被强制执行 — 绝对路径、`~/` 扩展和路径遍历模式（`../`）都会被拒绝。该目录与 LLM 任务使用的预检查脚本门控共享。

解释器选择依据文件扩展名：

| 扩展名 | 解释器 |
|-----------|-------------|
| `.sh`, `.bash` | `/bin/bash` |
| 其他任何扩展名 | `sys.executable`（当前 Python） |

我们有意**不**支持 `#!/...` shebang — 保持解释器集合明确且小巧可以减少调度器信任的表面。

## 调度语法

与其他所有 cron 任务相同：

```bash
hermes cron create "every 5m"        # 间隔
hermes cron create "every 2h"
hermes cron create "0 9 * * *"       # 标准 cron：每天上午 9 点
hermes cron create "30m"             # 一次性：30 分钟后运行一次
```

请参阅 [cron 功能参考](/docs/user-guide/features/cron) 以获取完整的语法。

## 交付目标

`--deliver` 接受网关所知的所有内容。一些常见的形式：

```bash
--deliver telegram                       # 平台主频道
--deliver telegram:-1001234567890        # 特定聊天
--deliver telegram:-1001234567890:17585  # 特定 Telegram 论坛主题
--deliver discord:#ops
--deliver slack:#engineering
--deliver signal:+15551234567
--deliver local                          # 仅保存到 ~/.hermes/cron/output/
```

对于使用机器人令牌的交付平台（Telegram、Discord、Slack、Signal、SMS、WhatsApp），在脚本运行时**不需要**运行网关 — 工具会直接使用 `~/.hermes/.env` / `~/.hermes/config.yaml` 中已有的凭据调用每个平台的 REST 端点。

## 编辑和生命周期

```bash
hermes cron list                                    # 查看所有任务
hermes cron pause <job_id>                          # 停止触发，保留定义
hermes cron resume <job_id>
hermes cron edit <job_id> --schedule "every 10m"    # 调整频率
hermes cron edit <job_id> --agent                   # 切换到 LLM 模式
hermes cron edit <job_id> --no-agent --script …     # 切换回来
hermes cron remove <job_id>                         # 删除它
```

所有适用于 LLM 任务的操作（暂停、恢复、手动触发、交付目标更改）也适用于无智能体任务。

## 实际示例：磁盘空间警报

```bash
cat > ~/.hermes/scripts/disk-alert.sh <<'EOF'
#!/usr/bin/env bash
# 当 / 或 /home 使用率超过 90% 时发出警报。
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

当两个文件系统都低于 90% 时保持静默；当一个文件系统填满时，仅为超过阈值的每个文件系统触发一行警报。

## 与其他模式的比较

| 方法 | 运行内容 | 适用场景 |
|----------|-----------|-------------|
| `hermes send`（一次性） | 任何管道传输给它的 shell 命令 | 临时交付或作为外部调度器（systemd、launchd）的动作 |
| `cronjob --no-agent`（本页） | 你的脚本按照 Hermes 的调度运行 | 不需要推理的重复性监控脚本 / 警报 / 指标 |
| `cronjob`（默认，LLM） | 智能体（可选预检查脚本） | 当消息内容需要对数据进行推理时 |
| OS cron + `hermes send` | 你的脚本按照 OS 的调度运行 | 当 Hermes 可能不健康时（你正在监控的对象） |

对于必须在*即使网关宕机时*也能触发的关键系统健康监控脚本，请继续使用 OS 级 cron + 普通的 `curl` 或 `hermes send` 调用 — 这些作为独立的 OS 进程运行，不依赖于 Hermes 是否正常运行。当被监控的对象是外部时，网关内调度器是正确的选择。
## 相关文档

- [使用 Cron 自动化一切](/docs/guides/automate-with-cron) — 由 LLM 驱动的 cron 模式。
- [计划任务 (Cron) 参考](/docs/user-guide/features/cron) — 完整的调度语法、生命周期、交付路由。
- [使用 `hermes send` 管道传输脚本输出](/docs/guides/pipe-script-output) — 适用于临时脚本的一次性对应物。
- [网关内部机制](/docs/developer-guide/gateway-internals) — 交付路由器内部机制。