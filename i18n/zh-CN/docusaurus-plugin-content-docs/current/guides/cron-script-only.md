---
sidebar_position: 13
title: "纯脚本定时任务（无 LLM）"
description: "经典看门狗定时任务，完全跳过 LLM —— 一个脚本按计划运行，其输出（如有）将发送到您的消息平台。内存警报、磁盘警报、CI 推送、周期性健康检查。"
---

# 纯脚本定时任务

有时您已经确切知道想要发送什么消息。您不需要智能体来推理它 —— 您只需要一个脚本定时运行，然后将其输出（如果有的话）发送到 Telegram / Discord / Slack / Signal。

Hermes 将此称为**无智能体模式**。这是定时系统减去 LLM 后的部分。

```
   ┌──────────────────┐          ┌──────────────────┐
   │ scheduler tick   │  every   │ run script       │
   │ (every N minutes)│ ──────▶ │ (bash or python) │
   └──────────────────┘          └──────────────────┘
                                          │
                                          │ stdout
                                          ▼
                                 ┌──────────────────┐
                                 │ delivery router  │
                                 │ (telegram/disc…) │
                                 └──────────────────┘
```

- **无 LLM 调用。** 零令牌，零智能体循环，零模型开销。
- **脚本即是任务。** 由脚本决定是否发出警报。产生输出 → 消息将被发送。无输出 → 静默执行。
- **Bash 或 Python。** `.sh` / `.bash` 文件在 `/bin/bash` 下运行；任何其他扩展名则在当前 Python 解释器下运行。`~/.hermes/scripts/` 目录下的任何脚本均被接受。
- **相同的调度器。** 与 LLM 任务共同存在于 `cronjob` 中 —— 暂停、恢复、列出、查看日志和目标消息传递等操作都以相同方式工作。

## 何时使用它

在以下场景使用无智能体模式：

- **内存 / 磁盘 / GPU 看门狗。** 每 5 分钟运行一次，仅在超出阈值时发出警报。
- **CI 钩子。** 部署完成 → 发布提交的 SHA。构建失败 → 发送日志的最后 100 行。
- **周期性指标。** "每日上午 9 点 Stripe 营收" 作为一个简单的 API 调用加格式化输出。
- **外部事件轮询器。** 检查 API，在状态变化时发出警报。
- **心跳检测。** 每隔 N 分钟 ping 一次仪表板，以证明主机存活。

当您需要智能体**决定**说什么时 —— 比如总结长文档、从订阅源中挑选有趣的条目、起草人性化的消息 —— 请使用普通的（由 LLM 驱动的）定时任务。无智能体模式适用于脚本的标准输出本身就是消息的情况。

## 从聊天中创建一个

无智能体模式的真正优势在于，智能体本身可以为你设置看门狗——无需编辑器、无需 Shell、无需记忆命令行标志。你描述你想要什么，赫尔墨斯会编写脚本、调度它，并告诉你它何时会触发。

### 示例对话

> **你：** 如果每 5 分钟检查一次 RAM 使用率超过 85%，就通过 Telegram 通知我
>
> **赫尔墨斯：** *(编写 `~/.hermes/scripts/memory-watchdog.sh`，然后调用 `cronjob(...)` 并设置 `no_agent=true`)*
>
> 已设置。每 5 分钟运行一次，仅在 RAM 超过 85% 时向 Telegram 发送警报。脚本：`memory-watchdog.sh`。作业 ID：`abc123`。

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
# 空标准输出 = 静默计时；不发送消息。
''',
)

# 2. 调度它 — no_agent=True 在每次计时触发时跳过 LLM
cronjob(
    action="create",
    schedule="every 5m",
    script="memory-watchdog.sh",
    no_agent=True,
    deliver="telegram",
    name="memory-watchdog",
)
```

从那时起，每次触发都是免费的：调度器运行脚本，如果标准输出非空则将其发送到 Telegram，并且从不接触模型。

### 智能体为你决定的内容

当你以“当 X 发生时提醒我”或“每 N 分钟检查 Y 并告诉我 Z”的方式表述请求时，赫尔墨斯的 `cronjob` 工具描述告诉它，只要消息内容完全由脚本确定，就使用 `no_agent=True`。当请求需要推理时（*“总结新 issue”*，*“挑选最有趣的标题”*，*“起草一条友好的提醒”*），它会回退到正常的 LLM 驱动路径。

你无需自己指定 `--no-agent`。只需描述行为即可。

### 从聊天中管理看门狗

智能体可以用与创建作业相同的方式暂停、恢复、编辑和移除作业：

> **你：** 今晚暂停内存看门狗
>
> **赫尔墨斯：** *(调用 `cronjob(action='pause', job_id='abc123')`)*
>
> 已暂停。可通过“重新开启它”或 `hermes cron resume abc123` 恢复。

> **你：** 将它改为每 15 分钟一次
>
> **赫尔墨斯：** *(调用 `cronjob(action='update', job_id='abc123', schedule='every 15m')`)*

完整的生命周期（创建/列表/更新/暂停/恢复/立即运行/移除）对智能体可用，而你无需学习任何命令行命令。

## 从 CLI 创建一个

更喜欢用 Shell？CLI 路径用三个命令给你相同的结果：

```bash
# 1. 编写你的脚本
cat > ~/.hermes/scripts/memory-watchdog.sh <<'EOF'
#!/usr/bin/env bash
# 当 RAM 使用率超过 85% 时发出警报。否则静默。
RAM_PCT=$(free | awk '/^Mem:/ {printf "%d", $3 * 100 / $2}')
if [ "$RAM_PCT" -ge 85 ]; then
  echo "⚠ RAM ${RAM_PCT}% on $(hostname)"
fi
# 空标准输出 = 静默运行；不发送消息。
EOF
chmod +x ~/.hermes/scripts/memory-watchdog.sh

# 2. 调度它
hermes cron create "every 5m" \
  --no-agent \
  --script memory-watchdog.sh \
  --deliver telegram \
  --name "memory-watchdog"

# 3. 验证
hermes cron list
hermes cron run <job_id>    # 触发一次进行测试
```

这就是全部。无需提示词、无需技能、无需模型。

## 脚本输出如何映射到投递

| 脚本行为 | 结果 |
|----------|------|
| 退出码 0，标准输出非空 | 标准输出被逐字投递 |
| 退出码 0，标准输出为空 | 静默计时 — 无投递 |
| 退出码 0，标准输出最后一行包含 `{"wakeAgent": false}` | 静默计时（与 LLM 作业共享的门控） |
| 非零退出码 | 错误警报被投递（这样出错的看门狗不会悄无声息地失败） |
| 脚本超时 | 错误警报被投递 |

“空时静默”的行为是经典看门狗模式的关键：脚本可以自由地每分钟运行一次，但频道只在实际需要注意时才会看到消息。

## 脚本规则

脚本必须位于 `~/.hermes/scripts/` 中。这在作业创建时和运行时都会被强制执行——绝对路径、`~/` 展开和路径遍历模式（`../`）会被拒绝。同一个目录与 LLM 作业使用的预检查脚本门控共享。

解释器选择依据文件扩展名：

| 扩展名 | 解释器 |
|--------|--------|
| `.sh`、`.bash` | `/bin/bash` |
| 任何其他 | `sys.executable`（当前 Python） |

我们故意**不**解析 `#!/...` shebang 行——保持解释器集显式且较小，减少了调度器信任的范围。

## 调度语法

与其他所有 cron 作业相同：

```bash
hermes cron create "every 5m"        # 间隔
hermes cron create "every 2h"
hermes cron create "0 9 * * *"       # 标准 cron：每天上午 9 点
hermes cron create "30m"             # 一次性：30 分钟后运行一次
```

完整语法请参阅 [cron 功能参考](/docs/user-user-guide/features/cron)。

## 投递目标

`--deliver` 接受网关已知的所有方式。一些常见的形式：

```bash
--deliver telegram                       # 平台主频道
--deliver telegram:-1001234567890        # 特定聊天
--deliver telegram:-1001234567890:17585  # 特定的 Telegram 论坛主题
--deliver discord:#ops
--deliver slack:#engineering
--deliver signal:+15551234567
--deliver local                          # 仅保存到 ~/.hermes/cron/output/
```

对于机器人令牌平台（Telegram、Discord、Slack、Signal、SMS、WhatsApp），脚本运行时无需运行网关——该工具直接使用 `~/.hermes/.env` / `~/.hermes/config.yaml` 中已有的凭据调用每个平台的 REST 端点。

## 编辑与生命周期

```bash
hermes cron list                                    # 查看所有作业
hermes cron pause <job_id>                          # 停止触发，保留定义
hermes cron resume <job_id>
hermes cron edit <job_id> --schedule "every 10m"    # 调整频率
hermes cron edit <job_id> --agent                   # 切换到 LLM 模式
hermes cron edit <job_id> --no-agent --script …     # 切换回来
hermes cron remove <job_id>                         # 删除它
```

适用于 LLM 作业的所有操作（暂停、恢复、手动触发、投递目标更改）也同样适用于无智能体作业。

## 完整示例：磁盘空间警报

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

当两个文件系统都低于 90% 时静默；当某个文件系统填满时，每个超过阈值的文件系统精确地触发一行消息。

## 与其他模式的比较

| 方法 | 运行内容 | 何时使用 |
|------|----------|----------|
| `cronjob --no-agent` (本页) | 你的脚本按赫尔墨斯的调度运行 | 不需要推理的周期性看门狗/警报/指标 |
| `cronjob` (默认，LLM) | 智能体（带可选的预检查脚本） | 当消息内容需要对数据进行推理时 |
| 操作系统 cron + `curl` 到 [webhook 订阅](/docs/user-guide/features/webhooks) | 你的脚本按操作系统调度运行 | 当赫尔墨斯可能不健康（你正在监控的那部分）时 |

对于必须在网关宕机时*依然触发*的关键系统健康看门狗，请使用操作系统级的 cron 配合指向赫尔墨斯 webhook 订阅（或任何其他外部警报端点）的普通 `curl`——这些作为独立的操作系统进程运行，不依赖于赫尔墨斯在线。当被监控对象是外部时，网关内调度器是正确的选择。

## 相关内容

- [使用 Cron 自动化任何事](/docs/guides/automate-with-cron) — LLM 驱动的 cron 模式。
- [计划任务 (Cron) 参考](/docs/user-guide/features/cron) — 完整的调度语法、生命周期、投递路由。
- [Webhook 订阅](/docs/user-guide/features/webhooks) — 面向外部调度器的即发即忘 HTTP 入口点。
- [网关内部机制](/docs/developer-guide/gateway-internals) — 投递路由器内部机制。