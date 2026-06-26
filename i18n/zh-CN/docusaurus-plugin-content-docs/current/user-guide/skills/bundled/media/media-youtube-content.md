Youtube Content — YouTube transcripts to summaries, threads, blogs
sidebar_label: Youtube Content
description: YouTube transcripts to summaries, threads, blogs
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Youtube Content

YouTube 视频转摘要、帖子和博客。

## Skill metadata

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/media/youtube-content` |
| Platforms | linux, macos, windows |

## Reference: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# YouTube Content Tool

## When to use

当用户分享 YouTube URL 或视频链接、要求总结视频、请求字幕或希望从任何 YouTube 视频中提取和重新格式化内容时使用。将字幕转换为结构化内容（章节、摘要、帖子）。

从 YouTube 视频中提取字幕并将其转换为有用的格式。

## Setup

使用 `uv`，以便依赖项安装到运行辅助脚本的同一 Hermes 管理环境中：

```bash
uv pip install youtube-transcript-api
```

## Helper Script

`SKILL_DIR` 是包含此 SKILL.md 文件的目录。该脚本接受任何标准的 YouTube URL 格式、短链接 (youtu.be)、 Shorts、嵌入式内容、直播链接或原始的 11 位视频 ID。

```bash
# JSON 输出，包含元数据
uv run python3 SKILL_DIR/scripts/fetch_transcript.py "https://youtube.com/watch?v=VIDEO_ID"

# 纯文本（适用于管道传输到进一步处理）
uv run python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --text-only

# 带时间戳
uv run python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --timestamps

# 指定语言并设置回退链
uv run python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --language tr,en
```

## Output Formats

获取字幕后，根据用户的要求进行格式化：

- **Chapters (章节)**：按主题划分，输出带时间戳的章节列表
- **Summary (摘要)**：对整个视频的简洁 5-10 句概述
- **Chapter summaries (章节摘要)**：每个章节都附带一段简短摘要
- **Thread (帖子串)**：Twitter/X 帖子格式——编号帖子，每个帖子少于 280 个字符
- **Blog post (博客文章)**：包含标题、部分和关键要点的完整文章
- **Quotes (引言)**：带有时间戳的值得注意的引言

### Example — Chapters Output (章节输出示例)

```
00:00 Introduction — host opens with the problem statement (介绍 — 主持人提出问题陈述)
03:45 Background — prior work and why existing solutions fall short (背景 — 先前的研究以及现有解决方案的不足之处)
12:20 Core method — walkthrough of the proposed approach (核心方法 — 对所提方法的走读)
24:10 Results — benchmark comparisons and key takeaways (结果 — 基准比较和关键要点)
31:55 Q&A — audience questions on scalability and next steps (问答 — 观众关于可扩展性和下一步的提问)
```

## Workflow (工作流程)

1. **Fetch (获取)**：使用 `uv run python3` 和 `--text-only --timestamps` 通过辅助脚本获取字幕。
2. **Validate (验证)**：确认输出非空且语言正确。如果为空，则尝试不带 `--language` 参数重试，以获取任何可用的字幕。如果仍然为空，则告知用户视频可能禁用了字幕。
3. **Chunk if needed (按块分割)**：如果字幕超过约 50K 个字符，则将其分割成重叠的块（~40K，2K 重叠），并在合并前对每个块进行摘要。
4. **Transform (转换)**：转换为所需的输出格式。如果用户未指定格式，则默认为摘要。
5. **Verify (核实)**：重新阅读转换后的输出，检查其连贯性、正确的时间戳和完整性，然后再展示。

## Error Handling (错误处理)

- **Transcript disabled (字幕禁用)**：告知用户；建议他们检查视频页面上是否有可用字幕。
- **Private/unavailable video (私人/不可用视频)**：转达错误信息并要求用户验证 URL。
- **No matching language (无匹配语言)**：尝试不带 `--language` 参数重试，以获取任何可用的字幕，然后将实际语言告知用户。
- **Dependency missing (依赖项缺失)**：运行 `uv pip install youtube-transcript-api` 并重试。