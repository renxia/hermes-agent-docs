---
title: "YouTube 内容 — 将 YouTube 字幕转换为摘要、推文串、博客"
sidebar_label: "YouTube 内容"
description: "将 YouTube 字幕转换为摘要、推文串、博客"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# YouTube 内容

将 YouTube 字幕转换为摘要、推文串、博客。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/media/youtube-content` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# YouTube 内容工具

## 何时使用

当用户分享 YouTube 链接或视频链接、要求总结视频、请求字幕，或希望从任何 YouTube 视频中提取并重新格式化内容时使用。将字幕转换为结构化内容（章节、摘要、推文串、博客文章）。

从 YouTube 视频中提取字幕并将其转换为有用的格式。

## 设置

```bash
pip install youtube-transcript-api
```

## 辅助脚本

`SKILL_DIR` 是包含此 SKILL.md 文件的目录。该脚本接受任何标准 YouTube 链接格式、短链接（youtu.be）、短视频（shorts）、嵌入链接、直播链接，或原始的 11 位视频 ID。

```bash
# 输出带元数据的 JSON
python3 SKILL_DIR/scripts/fetch_transcript.py "https://youtube.com/watch?v=VIDEO_ID"

# 纯文本（适合进一步处理时管道传输）
python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --text-only

# 带时间戳
python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --timestamps

# 指定语言及回退链
python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --language tr,en
```

## 输出格式

获取字幕后，根据用户要求将其格式化：

- **章节**：按主题变化分组，输出带时间戳的章节列表
- **摘要**：对整个视频的简明 5-10 句概述
- **章节摘要**：每个章节附带简短段落摘要
- **推文串**：Twitter/X 推文串格式 — 编号帖子，每条不超过 280 字符
- **博客文章**：包含标题、章节和关键要点的完整文章
- **引用**：带时间戳的 notable 引用

### 示例 — 章节输出

```
00:00 介绍 — 主持人开场提出问题陈述
03:45 背景 — 先前工作及现有解决方案的不足之处
12:20 核心方法 — 所提方法的逐步演示
24:10 结果 — 基准比较和关键要点
31:55 问答 — 观众关于可扩展性和后续步骤的问题
```

## 工作流程

1. **获取**：使用辅助脚本 `--text-only --timestamps` 获取字幕。
2. **验证**：确认输出非空且为预期语言。若为空，则不带 `--language` 重试以获取任何可用字幕。若仍为空，告知用户该视频可能已禁用字幕。
3. **分块（如需要）**：如果字幕超过约 50K 字符，将其拆分为重叠块（约 40K，重叠 2K），分别总结各块后再合并。
4. **转换**为请求的输出格式。如果用户未指定格式，则默认为摘要。
5. **验证**：重新阅读转换后的输出，检查连贯性、时间戳正确性和完整性，然后再呈现。

## 错误处理

- **字幕已禁用**：告知用户；建议其检查视频页面是否有字幕可用。
- **私有/不可用视频**：转达错误并请用户验证链接。
- **无匹配语言**：不带 `--language` 重试以获取任何可用字幕，然后向用户说明实际语言。
- **依赖缺失**：运行 `pip install youtube-transcript-api` 并重试。