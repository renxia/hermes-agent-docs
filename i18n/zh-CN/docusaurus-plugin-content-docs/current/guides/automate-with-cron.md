---
sidebar_position: 11
title: "使用 Cron 自动化一切"
description: "使用 Hermes cron 实现的真实世界自动化模式 — 监控、报告、流水线以及多技能工作流"
---

# 使用 Cron 自动化一切

[每日简报机器人教程](/docs/guides/daily-briefing-bot) 涵盖了基础知识。本指南将进一步深入 — 介绍五种你可以适配到自己工作流中的真实世界自动化模式。

有关完整功能参考，请参阅[计划任务 (Cron)](/docs/user-guide/features/cron)。

:::info 关键概念
Cron 任务在全新的智能体会话中运行，不会记住你当前聊天的内容。提示词必须是**完全自包含的** — 包含智能体需要了解的所有信息。
:::

:::tip 不需要 LLM？使用无智能体模式。
对于脚本已经生成你希望发送的确切消息的重复性监控任务（内存警报、磁盘警报、CI 心跳、心跳检测），请使用[仅脚本 cron 任务](/docs/guides/cron-script-only)完全跳过 LLM。零 token 消耗，相同的调度器。你可以在聊天中让 Hermes 为你设置一个 — `cronjob` 工具知道何时选择 `no_agent=True` 并为你编写脚本。
:::

---

## 模式 1：网站变更监控器

监控一个 URL 的变更，并仅在内容发生变化时收到通知。

`script` 参数是这里的秘密武器。一个 Python 脚本会在每次执行前运行，其标准输出（stdout）将成为智能体的上下文。脚本负责机械性工作（获取、比较差异）；智能体负责推理（这个变更是否重要？）。

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

# 为智能体输出
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
/cron add "every 1h" "如果脚本输出显示 CHANGE DETECTED，请总结页面上发生了什么变化以及为什么这可能很重要。如果显示 NO_CHANGE，请仅回复 [SILENT]。" --script ~/.hermes/scripts/watch-site.py --name "价格监控器" --deliver telegram
```

:::tip [SILENT] 技巧
当智能体的最终回复包含 `[SILENT]` 时，消息传递将被抑制。这意味着你只会在实际发生情况时收到通知 — 安静时段不会有垃圾消息。
:::

## 模式 2：周报

从多个来源收集信息并整理成格式化的摘要。每周运行一次，并发送到您的主频道。

```bash
/cron add "0 9 * * 1" "生成一份涵盖以下内容的周报：

1. 搜索过去一周内排名前 5 的 AI 新闻
2. 在 GitHub 上搜索“machine-learning”主题下的热门仓库
3. 查看 Hacker News 上讨论最多的 AI/ML 帖子

按来源分节整理成清晰的摘要。包含链接。
控制在 500 字以内——只突出显示重要内容。" --name "Weekly AI digest" --deliver telegram
```

通过 CLI：

```bash
hermes cron create "0 9 * * 1" \
  "生成一份涵盖热门 AI 新闻、GitHub 上热门 ML 仓库以及 HN 上讨论最多帖子的周报。按节整理格式，包含链接，控制在 500 字以内。" \
  --name "Weekly AI digest" \
  --deliver telegram
```

`0 9 * * 1` 是一个标准的 cron 表达式：每周一上午 9:00。

---

## 模式 3：GitHub 仓库监视器

监视仓库的新 issue、PR 或 release。

```bash
/cron add "every 6h" "检查 GitHub 仓库 NousResearch/hermes-agent：
- 过去 6 小时内新创建的 issue
- 过去 6 小时内新创建或已合并的 PR
- 任何新的 release

使用终端运行 gh 命令：
  gh issue list --repo NousResearch/hermes-agent --state open --json number,title,author,createdAt --limit 10
  gh pr list --repo NousResearch/hermes-agent --state all --json number,title,author,createdAt,mergedAt --limit 10

仅筛选过去 6 小时内的项目。如果没有新内容，回复 [SILENT]。
否则，提供活动的简明摘要。" --name "Repo watcher" --deliver discord
```

:::warning 自包含提示词
注意提示词中包含了精确的 `gh` 命令。cron 智能体不会记住之前的运行记录或您的偏好——请将所有内容明确写出。
:::

---

## 模式 4：数据采集流水线

定期抓取数据，保存到文件，并检测随时间变化的趋势。此模式结合了脚本（用于采集）和智能体（用于分析）。

```python title="~/.hermes/scripts/collect-prices.py"
import json, os, urllib.request
from datetime import datetime

DATA_DIR = os.path.expanduser("~/.hermes/data/prices")
os.makedirs(DATA_DIR, exist_ok=True)

# 获取当前数据（例如：加密货币价格）
url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
data = json.loads(urllib.request.urlopen(url, timeout=30).read())

# 追加到历史文件
entry = {"timestamp": datetime.now().isoformat(), "prices": data}
history_file = os.path.join(DATA_DIR, "history.jsonl")
with open(history_file, "a") as f:
    f.write(json.dumps(entry) + "\n")

# 加载近期历史数据用于分析
lines = open(history_file).readlines()
recent = [json.loads(l) for l in lines[-24:]]  # 最近 24 个数据点

# 为智能体输出
print(f"当前：BTC=${data['bitcoin']['usd']}, ETH=${data['ethereum']['usd']}")
print(f"已采集数据点：共 {len(lines)} 个，显示最近 {len(recent)} 个")
print(f"\n近期历史：")
for r in recent[-6:]:
    print(f"  {r['timestamp']}: BTC=${r['prices']['bitcoin']['usd']}, ETH=${r['prices']['ethereum']['usd']}")
```

```bash
/cron add "every 1h" "分析脚本输出中的价格数据。报告：
1. 当前价格
2. 最近 6 个数据点的趋势方向（上涨/下跌/持平）
3. 任何显著波动（>5% 变化）

如果价格持平且无显著变化，回复 [SILENT]。
如果有显著波动，请解释发生了什么。" \
  --script ~/.hermes/scripts/collect-prices.py \
  --name "Price tracker" \
  --deliver telegram
```

脚本负责机械式采集；智能体添加推理层。

---

## 模式 5：多技能工作流

将技能串联起来完成复杂的定时任务。提示词执行前会按顺序加载技能。

```bash
# 使用 arxiv 技能查找论文，然后使用 obsidian 技能保存笔记
/cron add "0 8 * * *" "搜索 arXiv 上过去一天内关于“语言模型推理”的 3 篇最有趣的论文。为每篇论文创建一个 Obsidian 笔记，包含标题、作者、摘要摘要和关键贡献。" \
  --skill arxiv \
  --skill obsidian \
  --name "Paper digest"
```

直接通过工具调用：

```python
cronjob(
    action="create",
    skills=["arxiv", "obsidian"],
    prompt="搜索 arXiv 上过去一天内关于“语言模型推理”的论文。将前 3 篇保存为 Obsidian 笔记。",
    schedule="0 8 * * *",
    name="Paper digest",
    deliver="local"
)
```

技能按顺序加载——先加载 `arxiv`（教会智能体如何搜索论文），再加载 `obsidian`（教会如何写笔记）。提示词将它们串联起来。

---

## 管理您的任务

```bash
# 列出所有活跃任务
/cron list

# 立即触发任务（用于测试）
/cron run <job_id>

# 暂停任务但不删除
/cron pause <job_id>

# 编辑运行中任务的计划或提示词
/cron edit <job_id> --schedule "every 4h"
/cron edit <job_id> --prompt "更新后的任务描述"

# 为现有任务添加或移除技能
/cron edit <job_id> --skill arxiv --skill obsidian
/cron edit <job_id> --clear-skills

# 永久移除任务
/cron remove <job_id>
```

---

## 发送目标

`--deliver` 标志控制结果发送到哪里：

| 目标 | 示例 | 使用场景 |
|--------|---------|----------|
| `origin` | `--deliver origin` | 创建任务的同一个聊天（默认） |
| `local` | `--deliver local` | 仅保存到本地文件 |
| `telegram` | `--deliver telegram` | 您的 Telegram 主频道 |
| `discord` | `--deliver discord` | 您的 Discord 主频道 |
| `slack` | `--deliver slack` | 您的 Slack 主频道 |
| 特定聊天 | `--deliver telegram:-1001234567890` | 特定的 Telegram 群组 |
| 主题线程 | `--deliver telegram:-1001234567890:17585` | 特定的 Telegram 主题线程 |

---

## 建议

**让提示词自包含。** cron 任务中的智能体不会记住您的对话历史。请在提示词中直接包含 URL、仓库名称、格式偏好和发送指令。

**广泛使用 `[SILENT]`。** 对于监视类任务，始终包含类似“如果没有任何变化，请回复 `[SILENT]`”的指令。这可以避免通知噪音。

**使用脚本进行数据采集。** `script` 参数允许 Python 脚本处理繁琐的部分（HTTP 请求、文件 I/O、状态跟踪）。智能体仅看到脚本的标准输出，并对其应用推理。这比让智能体自己执行抓取更便宜、更可靠。

**使用 `/cron run` 进行测试。** 在等待计划触发之前，使用 `/cron run <job_id>` 立即执行并验证输出是否正确。

**计划表达式。** 支持的格式：相对延迟（`30m`）、间隔（`every 2h`）、标准 cron 表达式（`0 9 * * *`）和 ISO 时间戳（`2025-06-15T09:00:00`）。不支持“每天上午 9 点”这类自然语言——请改用 `0 9 * * *`。

---

*有关完整的 cron 参考——包括所有参数、边缘情况和内部机制——请参阅[定时任务 (Cron)](/docs/user-guide/features/cron)。*