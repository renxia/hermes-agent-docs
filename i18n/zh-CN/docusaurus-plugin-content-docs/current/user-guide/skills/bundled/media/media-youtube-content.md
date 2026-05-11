---
title: "YouTube 内容 — 将 YouTube 转录稿转化为摘要、主题帖、博客"
sidebar_label: "YouTube 内容"
description: "将 YouTube 转录稿转化为摘要、主题帖、博客"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# YouTube 内容

将 YouTube 转录稿转化为摘要、主题帖、博客。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/media/youtube-content` |
| 平台 | linux, macos, windows |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# YouTube 内容工具

## 使用时机

当用户分享 YouTube URL 或视频链接、要求总结视频、请求转录稿，或希望从任何 YouTube 视频中提取并重新格式化内容时使用。将转录稿转化为结构化内容（章节、摘要、帖子、博客文章）。

从 YouTube 视频中提取转录稿，并将其转换为有用的格式。

## 设置

```bash
pip install youtube-transcript-api
```

## 辅助脚本

`SKILL_DIR` 是包含此 SKILL.md 文件的目录。脚本接受任何标准的 YouTube URL 格式、短链接 (youtu.be)、短视频、嵌入链接、直播链接，或原始的 11 字符视频 ID。

```bash
# JSON 输出（包含元数据）
python3 SKILL_DIR/scripts/fetch_transcript.py "https://youtube.com/watch?v=VIDEO_ID"

# 纯文本（适合传递给进一步处理）
python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --text-only

# 带时间戳
python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --timestamps

# 指定语言及回退链
python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --language tr,en
```

## 输出格式

获取转录稿后，根据用户的要求进行格式化：

- **章节**：按主题转折点分组，输出带时间戳的章节列表
- **摘要**：对整个视频的简洁概述（5-10 句话）
- **章节摘要**：每个章节配有一段简短摘要
- **主题帖**：Twitter/X 主题帖格式 — 编号的帖子，每条不超过 280 字符
- **博客文章**：包含标题、章节和关键要点的完整文章
- **引述**：带时间戳的值得注意的引述

### 示例 — 章节输出

```
00:00 引言 — 主持人以问题陈述开场
03:45 背景 — 先前的工作及现有解决方案为何不足
12:20 核心方法 — 所提出方法的逐步讲解
24:10 结果 — 基准比较和关键要点
31:55 问答 — 观众关于可扩展性和后续步骤的问题
```

## 工作流程

1.  **获取**：使用辅助脚本 `--text-only --timestamps` 获取转录稿。
2.  **验证**：确认输出非空且为预期语言。如果为空，不带 `--language` 重试以获取任何可用转录稿。如果仍为空，告知用户该视频可能禁用了转录稿。
3.  **按需分块**：如果转录稿超过约 50K 字符，将其拆分为重叠的块（约 40K 字符，2K 重叠），并在合并前对每个块进行摘要。
4.  **转化**：转换为用户请求的输出格式。如果用户未指定格式，则默认为摘要。
5.  **验证**：在呈现之前，重新阅读转化后的输出，检查连贯性、时间戳正确性和完整性。

## 错误处理

- **转录稿已禁用**：告知用户；建议他们检查视频页面是否提供字幕。
- **私密/不可用的视频**：传达错误信息并请用户验证 URL。
- **无匹配语言**：不带 `--language` 重试以获取任何可用转录稿，然后告知用户实际语言。
- **依赖缺失**：运行 `pip install youtube-transcript-api` 并重试。