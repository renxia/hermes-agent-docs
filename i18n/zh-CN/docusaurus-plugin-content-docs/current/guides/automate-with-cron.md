---
sidebar_position: 11
title: "Automate Anything with Cron"
description: "Real-world automation patterns using Hermes cron — monitoring, reports, pipelines, and multi-skill workflows"
---

# 使用 Cron 自动化一切

[每日简报机器人教程](/guides/daily-briefing-bot) 涵盖了基础知识。本指南将深入介绍五种真实世界的自动化模式，你可以将其应用到自己的工作流中。

有关完整的功能参考，请参阅 [定时任务 (Cron)](/user-guide/features/cron)。

:::info 核心概念
Cron 任务在全新的智能体会话中运行，对你当前的聊天没有任何记忆。提示词必须是**完全自包含的**——包含智能体需要知道的所有信息。
:::

:::tip 不需要 LLM？你有两个零 token 的选项。
- **循环看门狗**：脚本已经生成了确切的消息（内存告警、磁盘告警、心跳检测）：使用 [纯脚本 cron 任务](/guides/cron-script-only)。相同的调度器，无需 LLM。你可以让 Hermes 在聊天中帮你设置一个——`cronjob` 工具知道何时选择 `no_agent=True` 并为你编写脚本。
- **从已在运行的脚本中触发一次性任务**（CI 步骤、post-commit 钩子、部署脚本、外部调度的监控）：使用 [`hermes send`](/guides/pipe-script-output) 将 stdout 或文件直接管道传送到 Telegram / Discord / Slack 等，无需设置 cron 条目。
:::

---

## 模式 1：网站变更监控

监控 URL 的变更，仅在内容发生变化时通知你。

`script` 参数是这里的秘密武器。一个 Python 脚本在每次执行前运行，其 stdout 成为智能体的上下文。脚本处理机械化的工作（抓取、对比）；智能体处理推理（这个变更有趣吗？）。

创建监控脚本：

```bash
mkdir -p ~/.hermes/scripts
```

```python title="~/.hermes/scripts/watch-site.py"
import hashlib, json, os, urllib.request

URL = "https://example.com/pricing"
STATE_FILE = os.path.expanduser("~/.hermes/scripts/.watch-site-state.json")

# 抓取当前内容
req = urllib.request.Request(URL, headers={"User-Agent": "Hermes-Monitor/1.0"})
content = urllib.request.urlopen(req, timeout=30).read().decode()
current_hash = hashlib.sha256(content.encode()).hexdigest()

# 加载上次状态
prev_hash = None
if os.path.exists(STATE_FILE):
    with open(STATE_FILE) as f:
        prev_hash = json.load(f).get("hash")

# 保存当前状态
with open(STATE_FILE, "w") as f:
    json.dump({"hash": current_hash, "url": URL}, f)

# 输出给智能体
if prev_hash and prev_hash != current_hash:
    print(f"CHANGE DETECTED on {URL}")
    print(f"Previous hash: {prev_hash}")
    print(f"Current hash: {current_hash}")
    print(f"\nCurrent content (first 2000 chars):\n{content[:2000]}")
else:
    print("NO_CHANGE")
```

设置 cron 任务：

```bash
/cron add "every 1h" "If the script output says CHANGE DETECTED, summarize what changed on the page and why it might matter. If it says NO_CHANGE, respond with just [SILENT]." --script ~/.hermes/scripts/watch-site.py --name "Pricing monitor" --deliver telegram
```

:::tip [SILENT] 技巧
对于 cron 监控任务，指示智能体在没有变化时仅回复 `[SILENT]`。Cron 投递将 `[SILENT]` 视为静默标记，因此你只会在真正有事情发生时收到通知——安静时段不会收到垃圾信息。
:::

---

## 模式 2：每周报告

从多个来源编译信息，生成格式化的摘要。每周运行一次，投递到你的主频道。

```bash
/cron add "0 9 * * 1" "Generate a weekly report covering:

1. Search the web for the top 5 AI news stories from the past week
2. Search GitHub for trending repositories in the 'machine-learning' topic
3. Check Hacker News for the most discussed AI/ML posts

Format as a clean summary with sections for each source. Include links.
Keep it under 500 words — highlight only what matters." --name "Weekly AI digest" --deliver telegram
```

从 CLI：

```bash
hermes cron create "0 9 * * 1" \
  "Generate a weekly report covering the top AI news, trending ML GitHub repos, and most-discussed HN posts. Format with sections, include links, keep under 500 words." \
  --name "Weekly AI digest" \
  --deliver telegram
```

`0 9 * * 1` 是标准 cron 表达式：每周一上午 9:00。

---

## 模式 3：GitHub 仓库监控

监控仓库的新 issue、PR 或发布。

```bash
/cron add "every 6h" "Check the GitHub repository NousResearch/hermes-agent for:
- New issues opened in the last 6 hours
- New PRs opened or merged in the last 6 hours
- Any new releases

Use the terminal to run gh commands:
  gh issue list --repo NousResearch/hermes-agent --state open --json number,title,author,createdAt --limit 10
  gh pr list --repo NousResearch/hermes-agent --state all --json number,title,author,createdAt,mergedAt --limit 10

Filter to only items from the last 6 hours. If nothing new, respond with [SILENT].
Otherwise, provide a concise summary of the activity." --name "Repo watcher" --deliver discord
```

:::warning 自包含提示词
注意提示词中包含了确切的 `gh` 命令。Cron 智能体对之前的运行或你的偏好没有记忆——要详细说明一切。
:::

---

## 模式 4：数据采集管道

定期抓取数据、保存到文件，并随时间检测趋势。此模式将脚本（用于采集）与智能体（用于分析）结合。

```python title="~/.hermes/scripts/collect-prices.py"
import json, os, urllib.request
from datetime import datetime

DATA_DIR = os.path.expanduser("~/.hermes/data/prices")
os.makedirs(DATA_DIR, exist_ok=True)

# 抓取当前数据（示例：加密货币价格）
url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
data = json.loads(urllib.request.urlopen(url, timeout=30).read())

# 追加到历史文件
entry = {"timestamp": datetime.now().isoformat(), "prices": data}
history_file = os.path.join(DATA_DIR, "history.jsonl")
with open(history_file, "a") as f:
    f.write(json.dumps(entry) + "\n")

# 加载近期历史用于分析
lines = open(history_file).readlines()
recent = [json.loads(l) for l in lines[-24:]]  # 最近 24 个数据点

# 输出给智能体
print(f"Current: BTC=${data['bitcoin']['usd']}, ETH=${data['ethereum']['usd']}")
print(f"Data points collected: {len(lines)} total, showing last {len(recent)}")
print(f"\nRecent history:")
for r in recent[-6:]:
    print(f"  {r['timestamp']}: BTC=${r['prices']['bitcoin']['usd']}, ETH=${r['prices']['ethereum']['usd']}")
```

```bash
/cron add "every 1h" "Analyze the price data from the script output. Report:
1. Current prices
2. Trend direction over the last 6 data points (up/down/flat)
3. Any notable movements (>5% change)

If prices are flat and nothing notable, respond with [SILENT].
If there's a significant move, explain what happened." \
  --script ~/.hermes/scripts/collect-prices.py \
  --name "Price tracker" \
  --deliver telegram
```

脚本处理机械化的采集工作；智能体添加推理层。

---

## 模式 5：多技能工作流

将技能链接起来，完成复杂的定时任务。技能在提示词执行前按顺序加载。

```bash
# 使用 arxiv 技能查找论文，然后使用 obsidian 技能保存笔记
/cron add "0 8 * * *" "Search arXiv for the 3 most interesting papers on 'language model reasoning' from the past day. For each paper, create an Obsidian note with the title, authors, abstract summary, and key contribution." \
  --skill arxiv \
  --skill obsidian \
  --name "Paper digest"
```

直接从工具调用：

```python
cronjob(
    action="create",
    skills=["arxiv", "obsidian"],
    prompt="Search arXiv for papers on 'language model reasoning' from the past day. Save the top 3 as Obsidian notes.",
    schedule="0 8 * * *",
    name="Paper digest",
    deliver="local"
)
```

技能按顺序加载——先 `arxiv`（教智能体如何搜索论文），然后 `obsidian`（教如何写笔记）。提示词将它们串联起来。

---

## 管理你的任务

```bash
# 列出所有活跃任务
/cron list

# 立即触发任务（用于测试）
/cron run <job_id>

# 暂停任务而不删除
/cron pause <job_id>

# 编辑运行中任务的调度或提示词
/cron edit <job_id> --schedule "every 4h"
/cron edit <job_id> --prompt "Updated task description"

# 向现有任务添加或移除技能
/cron edit <job_id> --skill arxiv --skill obsidian
/cron edit <job_id> --clear-skills

# 永久移除任务
/cron remove <job_id>
```

---

## 投递目标

`--deliver` 标志控制结果的投递位置：

| 目标 | 示例 | 使用场景 |
|--------|---------|----------|
| `origin` | `--deliver origin` | 创建任务的同一聊天（默认） |
| `local` | `--deliver local` | 仅保存到本地文件 |
| `telegram` | `--deliver telegram` | 你的 Telegram 主频道 |
| `discord` | `--deliver discord` | 你的 Discord 主频道 |
| `slack` | `--deliver slack` | 你的 Slack 主频道 |
| 特定聊天 | `--deliver telegram:-1001234567890` | 特定的 Telegram 群组 |
| 话题线程 | `--deliver telegram:-1001234567890:17585` | 特定的 Telegram 话题线程 |

---

## 提示

**让提示词自包含。** Cron 任务中的智能体对你的对话没有任何记忆。在提示词中直接包含 URL、仓库名称、格式偏好和投递指令。

**善用 `[SILENT]`。** 对于监控任务，加入类似"如果没有变化，仅回复 `[SILENT]`"的指令。不要让智能体在安静情况下解释 token——cron 将 `[SILENT]` 视为投递抑制标记。

**使用脚本采集数据。** `script` 参数让 Python 脚本处理枯燥的部分（HTTP 请求、文件 I/O、状态跟踪）。智能体只看到脚本的 stdout 并对其应用推理。这比让智能体自己抓取更便宜、更可靠。

**用 `/cron run` 测试。** 在等待调度触发之前，使用 `/cron run <job_id>` 立即执行并验证输出是否正确。

**调度表达式。** 支持的格式：相对延迟（`30m`）、间隔（`every 2h`）、标准 cron 表达式（`0 9 * * *`）和 ISO 时间戳（`2025-06-15T09:00:00`）。不支持自然语言如 `daily at 9am`——请改用 `0 9 * * *`。

---

*有关完整的 cron 参考——所有参数、边缘情况和内部机制——请参阅 [定时任务 (Cron)](/user-guide/features/cron)。*