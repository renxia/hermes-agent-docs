---
sidebar_position: 11
title: "使用 Cron 实现自动化一切"
description: "使用 Hermes cron 实现的真实世界自动化模式——监控、报告、管道和多技能工作流"
---

# 使用 Cron 实现自动化一切

[每日简报机器人教程](/docs/guides/daily-briefing-bot) 涵盖了基础知识。本指南内容更深入——介绍了五个你可以为自己的工作流调整的真实世界自动化模式。

要查看完整的特性参考，请参阅 [定时任务 (Cron)](/docs/user-guide/features/cron)。

:::info 关键概念
Cron 任务在全新的 Agent 会话中运行，不会保留你当前聊天的记忆。提示词必须是**完全自包含的**——必须包含 Agent 需要知道的一切信息。
:::

---

## 模式 1：网站变更监控

监控一个 URL 的变化，只有当内容发生不同时才会收到通知。

`script` 参数是这里的秘密武器。一个 Python 脚本会在每次执行前运行，其标准输出 (stdout) 会成为 Agent 的上下文。脚本负责处理机械工作（获取、比对）；而 Agent 则负责处理推理工作（这个变化是否值得关注？）。

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

# 加载上一个状态
prev_hash = None
if os.path.exists(STATE_FILE):
    with open(STATE_FILE) as f:
        prev_hash = json.load(f).get("hash")

# 保存当前状态
with open(STATE_FILE, "w") as f:
    json.dump({"hash": current_hash, "url": URL}, f)

# 输出给 Agent
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
/cron add "every 1h" "如果脚本输出显示 CHANGE DETECTED，请总结页面发生了哪些变化以及为什么这可能很重要。如果显示 NO_CHANGE，则仅回复 [SILENT]。" --script ~/.hermes/scripts/watch-site.py --name "定价监控器" --deliver telegram
```

:::tip [SILENT] 技巧
当 Agent 的最终回复包含 `[SILENT]` 时，交付将被抑制。这意味着只有当真正发生事情时你才会收到通知——不会在安静的时段收到垃圾信息。
:::

---

## 模式 2：周报

将来自多个来源的信息整理成格式化的摘要。此任务每周运行一次，并将结果发送到你的主频道。

```bash
/cron add "0 9 * * 1" "生成一份周报，涵盖以下内容：

1. 搜索过去一周排名前 5 的 AI 新闻故事
2. 在 GitHub 上搜索 'machine-learning' 主题下的热门仓库
3. 检查 Hacker News 上讨论最多的 AI/ML 帖子

以清晰的摘要格式呈现，并为每个来源设置章节。包含链接。
内容控制在 500 字以内——只强调重要的信息。" --name "周 AI 摘要" --deliver telegram
```

通过 CLI：

```bash
hermes cron create "0 9 * * 1" \
  "生成一份周报，涵盖顶级 AI 新闻、热门 ML GitHub 仓库和讨论最多的 HN 帖子。使用章节格式，包含链接，内容控制在 500 字以内。" \
  --name "周 AI 摘要" \
  --deliver telegram
```

`0 9 * * 1` 是一个标准的 cron 表达式：每周一上午 9:00。

---

## 模式 3：GitHub 仓库监控器

监控仓库是否有新的 Issue、PR 或发布。

```bash
/cron add "every 6h" "检查 GitHub 仓库 NousResearch/hermes-agent 的以下内容：
- 过去 6 小时新增的 Issue
- 过去 6 小时新增或合并的 PR
- 任何新的发布

使用终端运行 gh 命令：
  gh issue list --repo NousResearch/hermes-agent --state open --json number,title,author,createdAt --limit 10
  gh pr list --repo NousResearch/hermes-agent --state all --json number,title,author,createdAt,mergedAt --limit 10

筛选出过去 6 小时内的项目。如果没有新的，回复 [SILENT]。
否则，提供一份关于活动情况的简洁摘要。" --name "仓库监控器" --deliver discord
```

:::warning 自包含的提示词
请注意，提示词中包含了精确的 `gh` 命令。Cron Agent 没有前次运行或你偏好的记忆——必须把所有内容都写清楚。
:::

---

## 模式 4：数据采集管道

在定期间隔采集数据，保存到文件，并检测随时间变化的趋势。此模式结合了脚本（用于采集）和 Agent（用于分析）。

```python title="~/.hermes/scripts/collect-prices.py"
import json, os, urllib.request
from datetime import datetime

DATA_DIR = os.path.expanduser("~/.hermes/data/prices")
os.makedirs(DATA_DIR, exist_ok=True)

# 获取当前数据（示例：加密货币价格）
url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
data = json.loads(urllib.request.urlopen(url, timeout=30).read())

# 追加到历史文件
entry = {"timestamp": datetime.now().isoformat(), "prices": data}
history_file = os.path.join(DATA_DIR, "history.jsonl")
with open(history_file, "a") as f:
    f.write(json.dumps(entry) + "\n")

# 加载最近的历史记录用于分析
lines = open(history_file).readlines()
recent = [json.loads(l) for l in lines[-24:]]  # 最近 24 个数据点

# 输出给 Agent
print(f"Current: BTC=${data['bitcoin']['usd']}, ETH=${data['ethereum']['usd']}")
print(f"Data points collected: {len(lines)} total, showing last {len(recent)}")
print(f"\nRecent history:")
for r in recent[-6:]:
    print(f"  {r['timestamp']}: BTC=${r['prices']['bitcoin']['usd']}, ETH=${r['prices']['ethereum']['usd']}")
```

```bash
/cron add "every 1h" "分析脚本输出的价格数据。报告内容：
1. 当前价格
2. 过去 6 个数据点的趋势方向（上涨/下跌/平稳）
3. 任何值得注意的波动（>5% 变化）

如果价格平稳且没有明显变化，回复 [SILENT]。
如果发生重大变动，请解释发生了什么。" \
  --script ~/.hermes/scripts/collect-prices.py \
  --name "价格追踪器" \
  --deliver telegram
```

脚本负责机械采集；Agent 则增加了推理层。

---

## 模式 5：多技能工作流

将多个技能连接起来，执行复杂的定时任务。技能会在提示词执行前按顺序加载。

```bash
# 使用 arxiv 技能查找论文，然后使用 obsidian 技能保存笔记
/cron add "0 8 * * *" "搜索过去一天内关于 '语言模型推理' 的 3 篇最有趣的论文。对于每篇论文，创建一个包含标题、作者、摘要总结和关键贡献的 Obsidian 笔记。" \
  --skill arxiv \
  --skill obsidian \
  --name "论文摘要"
```

直接从工具调用：

```python
cronjob(
    action="create",
    skills=["arxiv", "obsidian"],
    prompt="搜索过去一天内关于 '语言模型推理' 的论文。将前 3 篇保存为 Obsidian 笔记。",
    schedule="0 8 * * *",
    name="论文摘要",
    deliver="local"
)
```

技能会按顺序加载——`arxiv` 首先（教会 Agent 如何搜索论文），然后是 `obsidian`（教会如何撰写笔记）。提示词将它们联系在一起。

---

## 管理你的任务

```bash
# 列出所有活动的任务
/cron list

# 立即触发任务（用于测试）
/cron run <job_id>

# 暂停任务但不删除它
/cron pause <job_id>

# 编辑正在运行任务的计划或提示词
/cron edit <job_id> --schedule "every 4h"
/cron edit <job_id> --prompt "更新后的任务描述"

# 向现有任务添加或移除技能
/cron edit <job_id> --skill arxiv --skill obsidian
/cron edit <job_id> --clear-skills

# 永久删除任务
/cron remove <job_id>
```

---

## 交付目标

`--deliver` 标志控制结果发送到哪里：

| 目标 | 示例 | 用例 |
|--------|---------|----------|
| `origin` | `--deliver origin` | 创建任务的聊天（默认） |
| `local` | `--deliver local` | 仅保存到本地文件 |
| `telegram` | `--deliver telegram` | 你的 Telegram 主频道 |
| `discord` | `--deliver discord` | 你的 Discord 主频道 |
| `slack` | `--deliver slack` | 你的 Slack 主频道 |
| 特定聊天 | `--deliver telegram:-1001234567890` | 一个特定的 Telegram 群组 |
| 线程化 | `--deliver telegram:-1001234567890:17585` | 一个特定的 Telegram 主题线程 |

---

## 提示

**使提示词自包含。** Cron 任务中的 Agent 没有你对话的记忆。请将 URL、仓库名称、格式偏好和交付说明直接包含在提示词中。

**大量使用 `[SILENT]`。** 对于监控任务，始终包含“如果没有变化，回复 `[SILENT]`”之类的说明。这可以防止通知噪音。

**使用脚本进行数据采集。** `script` 参数允许 Python 脚本处理枯燥的部分（HTTP 请求、文件 I/O、状态跟踪）。Agent 只看到脚本的 stdout，并对其进行推理。这比让 Agent 自己进行获取更经济、更可靠。

**使用 `/cron run` 进行测试。** 在等待计划触发之前，使用 `/cron run <job_id>` 立即执行，并验证输出是否正确。

**计划表达式。** 支持的格式：相对延迟 (`30m`)、间隔 (`every 2h`)、标准 cron 表达式 (`0 9 * * *`) 和 ISO 时间戳 (`2025-06-15T09:00:00`)。不支持自然语言，如 `daily at 9am`——请使用 `0 9 * * *` 代替。

---

*有关完整的 Cron 参考——所有参数、边缘情况和内部机制——请参阅 [定时任务 (Cron)](/docs/user-guide/features/cron)。*