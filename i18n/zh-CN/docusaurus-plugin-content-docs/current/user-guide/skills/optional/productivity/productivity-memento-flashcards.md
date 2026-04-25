---
title: "Memento Flashcards — 间隔重复记忆卡片系统"
sidebar_label: "Memento Flashcards"
description: "间隔重复记忆卡片系统"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Memento Flashcards

间隔重复记忆卡片系统。根据事实或文本创建卡片，使用自由文本答案与记忆卡片进行对话并由智能体评分，根据 YouTube 字幕生成测验，通过自适应调度复习到期的卡片，并以 CSV 格式导出/导入卡组。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/productivity/memento-flashcards` 安装 |
| 路径 | `optional-skills/productivity/memento-flashcards` |
| 版本 | `1.0.0` |
| 作者 | Memento AI |
| 许可证 | MIT |
| 平台 | macos, linux |
| 标签 | `教育`, `记忆卡片`, `间隔重复`, `学习`, `测验`, `YouTube` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Memento 闪卡 — 间隔重复闪卡技能

## 概述

Memento 为您提供一个基于本地文件的闪卡系统，支持间隔重复调度。
用户可以自由文本回答闪卡问题，并由智能体对回答进行评分，然后安排下一次复习。
当用户想要以下操作时，可以使用此技能：

- **记住一个事实** — 将任何陈述转换为问答式闪卡
- **使用间隔重复学习** — 复习到期的卡片，采用自适应间隔和智能体评分的自由文本答案
- **从 YouTube 视频测验** — 获取字幕并生成包含 5 个问题的测验
- **管理卡组** — 将卡片组织到集合中，导出/导入 CSV

所有卡片数据都存储在一个 JSON 文件中。无需外部 API 密钥 — 您（智能体）直接生成闪卡内容和测验问题。

Memento 闪卡面向用户的响应风格：
- 仅使用纯文本。回复用户时不要使用 Markdown 格式。
- 保持复习和测验反馈简洁、中立。避免额外表扬、鼓励或冗长解释。

## 何时使用

当用户想要以下操作时，请使用此技能：
- 将事实保存为闪卡以便日后复习
- 使用间隔重复复习到期的卡片
- 从 YouTube 视频字幕生成测验
- 导入、导出、检查或删除闪卡数据

不要将此技能用于一般问答、编码帮助或非记忆任务。

## 快速参考

| 用户意图 | 操作 |
|---|---|
| “记住 X” / “将此保存为闪卡” | 生成问答卡片，调用 `memento_cards.py add` |
| 发送一个事实但未提及闪卡 | 询问“要我将此保存为 Memento 闪卡吗？” — 仅在确认后创建 |
| “创建一张闪卡” | 询问问题、答案、集合；调用 `memento_cards.py add` |
| “复习我的卡片” | 调用 `memento_cards.py due`，逐张展示卡片 |
| “给我关于 [YouTube URL] 的测验” | 调用 `youtube_quiz.py fetch VIDEO_ID`，生成 5 个问题，调用 `memento_cards.py add-quiz` |
| “导出我的卡片” | 调用 `memento_cards.py export --output PATH` |
| “从 CSV 导入卡片” | 调用 `memento_cards.py import --file PATH --collection NAME` |
| “显示我的统计信息” | 调用 `memento_cards.py stats` |
| “删除一张卡片” | 调用 `memento_cards.py delete --id ID` |
| “删除一个集合” | 调用 `memento_cards.py delete-collection --collection NAME` |

## 卡片存储

卡片存储在以下位置的 JSON 文件中：

```
~/.hermes/skills/productivity/memento-flashcards/data/cards.json
```

**切勿直接编辑此文件。** 始终使用 `memento_cards.py` 子命令。脚本会处理原子写入（写入临时文件，然后重命名）以防止损坏。

首次使用时，文件会自动创建。

## 流程

### 从事实创建卡片

### 激活规则

并非每个事实陈述都应成为闪卡。请使用以下三层检查：

1. **明确意图** — 用户提到“memento”、“flashcard”、“remember this”、“save this card”、“add a card”或类似明确要求闪卡的措辞 → **直接创建卡片**，无需确认。
2. **隐含意图** — 用户发送一个事实陈述但未提及闪卡（例如：“光速为 299,792 km/s”） → **先询问**：“要我将此保存为 Memento 闪卡吗？” 仅在用户确认后创建卡片。
3. **无意图** — 消息是编码任务、问题、指令、正常对话，或明显不是要记忆的事实 → **完全不要激活此技能**。让其他技能或默认行为处理。

当激活被确认后（第 1 层直接确认，第 2 层在确认后），生成一张闪卡：

**步骤 1：** 将陈述转换为问答对。内部使用此格式：

```
将事实陈述转换为正面-背面配对。
返回恰好两行：
Q: <问题文本>
A: <答案文本>

陈述: "{statement}"
```

规则：
- 问题应测试对关键事实的回忆
- 答案应简洁直接

**步骤 2：** 调用脚本存储卡片：

```bash
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py add \
  --question "第二次世界大战是哪一年结束的？" \
  --answer "1945" \
  --collection "历史"
```

如果用户未指定集合，则使用 `"通用"` 作为默认值。

脚本输出 JSON 以确认创建的卡片。

### 手动创建卡片

当用户明确要求创建闪卡时，请询问他们：
1. 问题（卡片正面）
2. 答案（卡片背面）
3. 集合名称（可选 — 默认为 `"通用"`）

然后如上所述调用 `memento_cards.py add`。

### 复习到期卡片

当用户想要复习时，获取所有到期的卡片：

```bash
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py due
```

这将返回一个 JSON 数组，包含 `next_review_at <= now` 的卡片。如果需要集合过滤：

```bash
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py due --collection "历史"
```

**复习流程（自由文本评分）：**

以下是您必须遵循的**确切交互模式示例**。用户回答后，您对其进行评分，告诉他们正确答案，然后对卡片进行评级。

**交互示例：**

> **智能体：** 柏林墙是哪一年倒塌的？
>
> **用户：** 1991
>
> **智能体：** 不完全正确。柏林墙于 1989 年倒塌。下次复习时间是明天。
> *（智能体调用：memento_cards.py rate --id ABC --rating hard --user-answer "1991"）*
>
> 下一个问题：谁是第一个登上月球的人？

**规则：**

1. 仅显示问题。等待用户回答。
2. 收到他们的答案后，将其与预期答案进行比较并评分：
   - **正确** → 用户答对了关键事实（即使措辞不同）
   - **部分正确** → 方向正确但遗漏了核心细节
   - **错误** → 错误或离题
3. **您必须告诉用户正确答案以及他们的表现。** 保持简短并使用纯文本。使用此格式：
   - 正确：“正确。答案：{answer}。下次复习在 7 天后。”
   - 部分正确：“接近了。答案：{answer}。{他们遗漏的内容}。下次复习在 3 天后。”
   - 错误：“不完全正确。答案：{answer}。下次复习明天。”
4. 然后调用评级命令：正确→简单，部分正确→良好，错误→困难。
5. 然后显示下一个问题。

```bash
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py rate \
  --id CARD_ID --rating easy --user-answer "用户所说内容"
```

**切勿跳过步骤 3。** 在继续之前，用户必须始终看到正确答案和反馈。

如果没有到期的卡片，请告诉用户：“目前没有需要复习的卡片。稍后再检查！”

**退休覆盖：** 用户随时可以说“退休此卡片”以永久将其从复习中移除。对此使用 `--rating retire`。

### 间隔重复算法

评级决定下次复习间隔：

| 评级 | 间隔 | ease_streak | 状态变更 |
|---|---|---|---|
| **困难** | +1 天 | 重置为 0 | 保持学习中 |
| **良好** | +3 天 | 重置为 0 | 保持学习中 |
| **简单** | +7 天 | +1 | 如果 ease_streak >= 3 → 已退休 |
| **退休** | 永久 | 重置为 0 | → 已退休 |

- **学习中：** 卡片处于活跃轮换中
- **已退休：** 卡片不会出现在复习中（用户已掌握或手动退休）
- 连续三次“简单”评级会自动退休一张卡片

### YouTube 测验生成

当用户发送 YouTube URL 并想要测验时：

**步骤 1：** 从 URL 中提取视频 ID（例如，从 `https://www.youtube.com/watch?v=dQw4w9WgXcQ` 中提取 `dQw4w9WgXcQ`）。

**步骤 2：** 获取字幕：

```bash
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/youtube_quiz.py fetch VIDEO_ID
```

这将返回 `{"title": "...", "transcript": "..."}` 或错误。

如果脚本报告 `missing_dependency`，请告诉用户安装它：
```bash
pip install youtube-transcript-api
```

**步骤 3：** 从字幕生成 5 个测验问题。请使用以下规则：

```
您正在为播客剧集创建一个包含 5 个问题的测验。
仅返回一个恰好包含 5 个对象的 JSON 数组。
每个对象必须包含键 'question' 和 'answer'。

选择标准：
- 优先考虑重要、令人惊讶或基础的事实。
- 跳过填充内容、显而易见细节和需要大量上下文的事实。
- 切勿返回是非题。
- 切勿仅询问日期。

问题规则：
- 每个问题必须测试恰好一个离散事实。
- 使用清晰、无歧义的措辞。
- 优先使用“什么”、“谁”、“多少”、“哪个”。
- 避免开放式“描述”或“解释”提示。

答案规则：
- 每个答案必须少于 240 个字符。
- 以答案本身开头，而非前言。
- 仅在需要时添加最少的澄清细节。
```

使用字幕的前 15,000 个字符作为上下文。自行生成问题（您是 LLM）。

**步骤 4：** 验证输出是否为有效的 JSON，恰好包含 5 项，每项都有非空的 `question` 和 `answer` 字符串。如果验证失败，请重试一次。

**步骤 5：** 存储测验卡片：

```bash
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py add-quiz \
  --video-id "VIDEO_ID" \
  --questions '[{"question":"...","answer":"..."},...]' \
  --collection "测验 - 剧集标题"
```

脚本通过 `video_id` 去重 — 如果该视频的卡片已存在，则跳过创建并报告现有卡片。

**步骤 6：** 使用相同的自由文本评分流程逐张展示问题：
1. 显示“问题 1/5：...”并等待用户回答。切勿包含答案或任何关于揭示它的提示。
2. 等待用户用自己的话回答
3. 使用评分提示对他们的答案进行评分（参见“复习到期卡片”部分）
4. **重要：在执行任何其他操作之前，您必须回复用户并提供反馈。** 显示评分、正确答案以及卡片下次到期时间。切勿静默跳过到下一个问题。保持简短并使用纯文本。示例：“不完全正确。答案：{answer}。下次复习明天。”
5. **显示反馈后**，调用评级命令，然后在同一消息中显示下一个问题：
```bash
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py rate \
  --id CARD_ID --rating easy --user-answer "用户所说内容"
```
6. 重复。每个答案在下一个问题之前都必须收到可见反馈。

### 导出/导入 CSV

**导出：**
```bash
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py export \
  --output ~/flashcards.csv
```

生成一个包含 3 列的 CSV：`question,answer,collection`（无标题行）。

**导入：**
```bash
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py import \
  --file ~/flashcards.csv \
  --collection "已导入"
```

读取包含列的 CSV：问题、答案，以及可选的集合（第 3 列）。如果缺少集合列，则使用 `--collection` 参数。

### 统计信息

```bash
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py stats
```

返回包含以下内容的 JSON：
- `total`：卡片总数
- `learning`：活跃轮换中的卡片
- `retired`：已掌握的卡片
- `due_now`：目前需要复习的卡片
- `collections`：按集合名称细分

## 陷阱

- **切勿直接编辑 `cards.json`** —— 始终使用脚本子命令，以避免文件损坏
- **字幕获取失败** —— 某些 YouTube 视频没有英文字幕或字幕功能被禁用；请通知用户并建议其尝试其他视频
- **可选依赖项** —— `youtube_quiz.py` 需要 `youtube-transcript-api`；如果缺少该依赖，请提示用户运行 `pip install youtube-transcript-api`
- **大量导入** —— 包含数千行的 CSV 导入可以正常工作，但 JSON 输出可能非常冗长；请为用户总结结果
- **视频 ID 提取** —— 同时支持 `youtube.com/watch?v=ID` 和 `youtu.be/ID` 两种 URL 格式

## 验证

直接验证辅助脚本：

```bash
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py stats
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py add --question "法国的首都是什么？" --answer "巴黎" --collection "常识"
python3 ~/.hermes/skills/productivity/memento-flashcards/scripts/memento_cards.py due
```

如果您正在从代码仓库检出进行测试，请运行：

```bash
pytest tests/skills/test_memento_cards.py tests/skills/test_youtube_quiz.py -q
```

智能体级别验证：
- 开始复习，并确认反馈为纯文本、简洁，且总是在下一张卡片之前包含正确答案
- 运行 YouTube 测验流程，并确认每个答案在下一题出现前都会收到可见反馈