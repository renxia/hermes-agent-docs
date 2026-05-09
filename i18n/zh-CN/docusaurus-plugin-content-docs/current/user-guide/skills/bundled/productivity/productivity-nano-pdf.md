---
title: "Nano Pdf — 通过 nano-pdf 命令行工具编辑 PDF 文本/错别字/标题（自然语言指令）"
sidebar_label: "Nano Pdf"
description: "通过 nano-pdf 命令行工具编辑 PDF 文本/错别字/标题（自然语言指令）"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Nano Pdf

通过 nano-pdf 命令行工具（自然语言指令）编辑 PDF 文本、错别字或标题。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/productivity/nano-pdf` |
| 版本 | `1.0.0` |
| 作者 | community |
| 许可证 | MIT |
| 标签 | `PDF`, `文档`, `编辑`, `自然语言处理`, `效率工具` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。当技能处于活动状态时，智能体看到的指令即为此内容。
:::

# nano-pdf

使用自然语言指令编辑 PDF。指定一个页面并描述需要进行的更改。

## 先决条件

```bash
# 使用 uv 安装（推荐 — Hermes 中已默认提供）
uv pip install nano-pdf

# 或使用 pip
pip install nano-pdf
```

## 使用方法

```bash
nano-pdf edit <file.pdf> <page_number> "<instruction>"
```

## 示例

```bash
# 更改第 1 页的标题
nano-pdf edit deck.pdf 1 "将标题更改为 'Q3 业绩' 并修正副标题中的错别字"

# 更新特定页面的日期
nano-pdf edit report.pdf 3 "将日期从 1 月更新为 2026 年 2 月"

# 修正内容
nano-pdf edit contract.pdf 2 "将客户名称从 'Acme Corp' 更改为 'Acme Industries'"
```

## 注意事项

- 页码可能基于 0 或基于 1，具体取决于版本 — 如果编辑操作作用于错误的页面，请尝试使用 ±1 重试
- 编辑后务必验证输出 PDF（可使用 `read_file` 检查文件大小，或手动打开查看）
- 该工具底层使用大语言模型 — 需要 API 密钥（请查看 `nano-pdf --help` 获取配置说明）
- 适用于文本更改；复杂的版式修改可能需要采用其他方法