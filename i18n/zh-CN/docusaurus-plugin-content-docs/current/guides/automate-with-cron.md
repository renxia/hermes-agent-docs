---
sidebar_position: 11
title: "使用 Cron 自动化一切"
description: "使用 Hermes cron 的真实自动化模式 — 监控、报告、流水线和多技能工作流"
---

# 使用 Cron 自动化一切

[每日简报机器人教程](/guides/daily-briefing-bot)涵盖了基础知识。本指南更进一步 — 介绍了五个你可以用于自己工作流的真实自动化模式。

完整功能参考，请参阅[计划任务 (Cron)](/user-guide/features/cron)。

:::info 核心概念
Cron 任务运行在全新的智能体会话中，没有当前聊天的记忆。提示词必须是**完全自包含的** — 包含智能体需要知道的所有信息。
:::

:::tip 不需要 LLM？你有两个零 token 选项。
- **周期性监视器**，其中脚本已经产生确切的消息（内存警报、磁盘警报、心跳）：使用[纯脚本 Cron 任务](/guides/cron-script-only)。相同的调度器，没有 LLM。你可以在聊天中让 Hermes 为你设置一个 — `cronjob` 工具知道何时选择 `no_agent=True` 并为你编写脚本。
- **来自已运行脚本的一次性任务**（CI 步骤、提交后钩子、部署脚本、外部调度的监控器）：使用 [`hermes send`](/guides/pipe-script-output) 将标准输出或文件直接管道传输到 Telegram / Discord / Slack 等，无需设置 cron 条目。
:::

---

## 模式 1：网站变更监控

监视 URL 是否发生变化，并且只在内容不同时获得通知。

这里的 `script` 参数是秘密武器。每次执行前会运行一个 Python 脚本，其标准输出会作为智能体的上下文。脚本处理机械工作（获取、比较差异）；智能体处理推理（这个变更有趣吗？）。

创建监控脚本：

```bash
mkdir -p ~/.hermes/scripts
```

```python title="~/.hermes/scripts/watch-site.py"
import hashlib, json, os, urllib.request

URL = "https://example.com/pricing"
STATE_FILE = os.path.expanduser("~/.hermes/scripts/.watch-site-state.json")

# 获取当前内容
req = urllib.request.Request(URL, headers={"User-Agent": "Hermes-Monitor/1.0"})
content = urllib.request.urlopen(req, timeout=30).read().decode()
current_hash = hashlib.sha256(content.encode()).hexdigest()

# 加载先前状态
prev_hash = None
if os.path.exists(STATE_FILE):
    with open(STATE_FILE) as f:
        prev_hash = json.load(f).get("hash")

# 保存当前状态
with open(STATE_FILE, "w") as f:
    json.dump({"hash": current_hash, "url": URL}, f)

# 输出供智能体使用
if prev_hash and prev_hash != current_hash:
    print(f"CHANGE DETECTED on {URL}")
    print(f"Previous hash: {prev_hash}")
    print(f"Current hash: {current_hash}")
    print(f"\nCurrent content (first 2000 chars):\n{content[:2000]}")
else:
    print("NO_CHANGE")
```

设置 Cron 任务：

```bash
/cron add "every 1h" "If the script output says CHANGE DETECTED, summarize what changed on the page and why it might matter. If it says NO_CHANGE, respond with just [SILENT]." --script ~/.hermes/scripts/watch-site.py --name "Pricing monitor" --deliver telegram
```

:::tip [SILENT] 技巧
当智能体的最终响应包含 `[SILENT]` 时，消息推送会被抑制。这意味着你只会在实际发生某些事情时收到通知 — 在安静时段不会收到垃圾信息。
:::

---

## 模式二：周报

从多个来源汇总信息，生成格式化的摘要。每周运行一次，并发送到您的主频道。

```bash
/cron add "0 9 * * 1" "生成一份周报，涵盖：

1. 搜索网络，获取过去一周的5大AI新闻
2. 在GitHub上搜索'machine-learning'话题下的热门代码仓库
3. 检查Hacker News上讨论最多的AI/ML帖子

格式为清晰的摘要，每个来源一个板块。包含链接。
保持在500字以内——只突出重点。" --name "Weekly AI digest" --deliver telegram
```

通过命令行：

```bash
hermes cron create "0 9 * * 1" \
  "生成一份周报，涵盖主要AI新闻、热门ML GitHub仓库和最受讨论的HN帖子。按板块格式化，包含链接，控制在500字以内。" \
  --name "Weekly AI digest" \
  --deliver telegram
```

`0 9 * * 1`是一个标准的cron表达式：每周一上午9:00。

---

## 模式三：GitHub 仓库监视器

监控仓库的新议题、拉取请求或发布。

```bash
/cron add "every 6h" "检查GitHub仓库NousResearch/hermes-agent：
- 过去6小时内新开的议题
- 过去6小时内新开或已合并的拉取请求
- 任何新的发布

使用终端运行gh命令：
  gh issue list --repo NousResearch/hermes-agent --state open --json number,title,author,createdAt --limit 10
  gh pr list --repo NousResearch/hermes-agent --state all --json number,title,author,createdAt,mergedAt --limit 10

仅筛选过去6小时内的条目。如果没有新的内容，请回复[SILENT]。
否则，请提供一份简洁的活动摘要。" --name "Repo watcher" --deliver discord
```

:::warning 自包含提示
请注意提示中包含了确切的`gh`命令。定时智能体没有先前运行或您的偏好的记忆——请把一切都详细说明清楚。
:::

---

## 模式四：数据收集管道

按固定间隔抓取数据，保存到文件，并检测随时间变化的趋势。此模式结合了脚本（用于收集）和智能体（用于分析）。

```python title="~/.hermes/scripts/collect-prices.py"
import json, os, urllib.request
from datetime import datetime

DATA_DIR = os.path.expanduser("~/.hermes/data/prices")
os.makedirs(DATA_DIR, exist_ok=True)

# 获取当前数据（示例：加密货币价格）
url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
data = json.loads(urllib.request.urlopen(url, timeout=30).read())

# 追加到历史记录文件
entry = {"timestamp": datetime.now().isoformat(), "prices": data}
history_file = os.path.join(DATA_DIR, "history.jsonl")
with open(history_file, "a") as f:
    f.write(json.dumps(entry) + "\n")

# 加载最近的历史记录用于分析
lines = open(history_file).readlines()
recent = [json.loads(l) for l in lines[-24:]]  # 最近24个数据点

# 输出供智能体使用
print(f"当前价格: BTC=${data['bitcoin']['usd']}, ETH=${data['ethereum']['usd']}")
print(f"已收集数据点: 共{len(lines)}个，显示最近{len(recent)}个")
print(f"\n最近历史记录:")
for r in recent[-6:]:
    print(f"  {r['timestamp']}: BTC=${r['prices']['bitcoin']['usd']}, ETH=${r['prices']['ethereum']['usd']}")
```

```bash
/cron add "every 1h" "分析脚本输出的价格数据。报告：
1. 当前价格
2. 最近6个数据点的趋势方向（上升/下降/平稳）
3. 任何显著变动（变化>5%）

如果价格平稳且没有显著变动，请回复[SILENT]。
如果有重大变动，请解释发生了什么。" \
  --script ~/.hermes/scripts/collect-prices.py \
  --name "Price tracker" \
  --deliver telegram
```

脚本负责机械性的收集工作；智能体则添加推理分析层。

---

## 模式五：多技能工作流

将技能串联起来，用于复杂的定时任务。技能会在提示执行前按顺序加载。

```bash
# 使用arxiv技能查找论文，然后使用obsidian技能保存笔记
/cron add "0 8 * * *" "在arXiv上搜索过去一天关于'语言模型推理'的3篇最有趣的论文。为每篇论文创建一个Obsidian笔记，包括标题、作者、摘要总结和主要贡献。" \
  --skill arxiv \
  --skill obsidian \
  --name "Paper digest"
```

直接从工具调用：

```python
cronjob(
    action="create",
    skills=["arxiv", "obsidian"],
    prompt="在arXiv上搜索过去一天关于'语言模型推理'的论文。将前3篇保存为Obsidian笔记。",
    schedule="0 8 * * *",
    name="Paper digest",
    deliver="local"
)
```

技能按顺序加载——先是`arxiv`（教会智能体如何搜索论文），然后是`obsidian`（教会智能体如何写笔记）。提示将它们串联起来。

---

## 管理您的任务

```bash
# 列出所有活动任务
/cron list

# 立即触发一个任务（用于测试）
/cron run <job_id>

# 暂停任务而不删除
/cron pause <job_id>

# 编辑正在运行的任务的调度或提示
/cron edit <job_id> --schedule "every 4h"
/cron edit <job_id> --prompt "更新的任务描述"

# 为现有任务添加或移除技能
/cron edit <job_id> --skill arxiv --skill obsidian
/cron edit <job_id> --clear-skills

# 永久删除一个任务
/cron remove <job_id>
```

---

## 交付目标

`--deliver` 标志控制结果的去向：

| 目标 | 示例 | 用例 |
|------|------|------|
| `origin` | `--deliver origin` | 与创建任务的同一个聊天（默认） |
| `local` | `--deliver local` | 仅保存到本地文件 |
| `telegram` | `--deliver telegram` | 您的Telegram主频道 |
| `discord` | `--deliver discord` | 您的Discord主频道 |
| `slack` | `--deliver slack` | 您的Slack主频道 |
| 指定聊天 | `--deliver telegram:-1001234567890` | 指定的Telegram群组 |
| 按话题线程 | `--deliver telegram:-1001234567890:17585` | 指定的Telegram话题线程 |

---

## 提示

**让提示自包含。** 定时任务中的智能体没有您对话的记忆。请在提示中直接包含URL、仓库名称、格式偏好和交付指令。

**自由使用`[SILENT]`。** 对于监控任务，请始终包含类似“如果没有变化，请回复`[SILENT]`”的指令。这可以防止通知噪音。

**使用脚本进行数据收集。** `script`参数允许Python脚本处理枯燥的部分（HTTP请求、文件I/O、状态跟踪）。智能体只能看到脚本的标准输出并对其应用推理。这比让智能体自己去抓取更便宜、更可靠。

**使用`/cron run`进行测试。** 在等待调度触发之前，请使用`/cron run <job_id>`立即执行并验证输出是否符合预期。

**调度表达式。** 支持的格式：相对延迟（`30m`）、间隔（`every 2h`）、标准cron表达式（`0 9 * * *`）和ISO时间戳（`2025-06-15T09:00:00`）。不支持自然语言如`daily at 9am`——请改用`0 9 * * *`。

---

*有关完整的定时任务参考——所有参数、边缘情况和内部机制，请参见[定时任务 (Cron)](/user-guide/features/cron)。*