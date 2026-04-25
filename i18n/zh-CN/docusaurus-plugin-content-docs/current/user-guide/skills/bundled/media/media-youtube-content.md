---
title: "Youtube 内容"
sidebar_label: "Youtube 内容"
description: "获取 YouTube 视频字幕并将其转换为结构化内容（章节、摘要、推文串、博客文章）"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Youtube 内容

获取 YouTube 视频字幕并将其转换为结构化内容（章节、摘要、推文串、博客文章）。当用户分享 YouTube 链接或视频地址、要求总结视频、请求字幕，或希望从任意 YouTube 视频中提取并重新格式化内容时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/media/youtube-content` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# YouTube 内容工具

从 YouTube 视频中提取字幕并将其转换为有用的格式。

## 设置

```bash
pip install youtube-transcript-api
```

## 辅助脚本

`SKILL_DIR` 是包含此 SKILL.md 文件的目录。该脚本接受任何标准 YouTube 链接格式、短链接（youtu.be）、短视频、嵌入链接、直播链接，或原始的 11 位字符视频 ID。

```bash
# 输出 JSON 格式（包含元数据）
python3 SKILL_DIR/scripts/fetch_transcript.py "https://youtube.com/watch?v=VIDEO_ID"

# 纯文本输出（适合进一步处理）
python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --text-only

# 包含时间戳
python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --timestamps

# 指定语言（带回退链）
python3 SKILL_DIR/scripts/fetch_transcript.py "URL" --language tr,en
```

## 输出格式

获取字幕后，根据用户请求的格式进行转换：

- **章节**：按主题变化分组，输出带时间戳的章节列表
- **摘要**：对整个视频的 5-10 句话简明概述
- **章节摘要**：每个章节附带简短段落摘要
- **推文串**：Twitter/X 推文串格式 — 编号帖子，每条不超过 280 字符
- **博客文章**：包含标题、章节和关键要点的完整文章
- **引用**：带时间戳的 notable 引用

### 示例 — 章节输出

```
00:00 引言 — 主持人开场提出问题陈述
03:45 背景 — 先前工作及现有解决方案不足之处
12:20 核心方法 — 对提出方法的逐步讲解
24:10 结果 — 基准比较和关键要点
31:55 问答环节 — 观众关于可扩展性和后续步骤的提问
```

## 工作流程

1. **获取**：使用辅助脚本并添加 `--text-only --timestamps` 参数获取字幕。
2. **验证**：确认输出非空且为预期语言。如果为空，则去掉 `--language` 参数重试以获取任意可用字幕。如果仍为空，告知用户该视频可能已禁用字幕。
3. **分块（如需要）**：如果字幕超过约 50K 字符，将其拆分为重叠块（约 40K 字符，重叠 2K），分别总结各块后再合并。
4. **转换**：转换为用户请求的输出格式。如果用户未指定格式，则默认为摘要。
5. **验证**：重新阅读转换后的输出，检查连贯性、时间戳正确性和完整性，再呈现给用户。

## 错误处理

- **字幕已禁用**：告知用户；建议其检查视频页面是否有字幕可用。
- **私有/不可用视频**：转达错误信息，并请用户核实链接。
- **无匹配语言**：去掉 `--language` 参数重试以获取任意可用字幕，然后告知用户实际语言。
- **依赖缺失**：运行 `pip install youtube-transcript-api` 并重试。