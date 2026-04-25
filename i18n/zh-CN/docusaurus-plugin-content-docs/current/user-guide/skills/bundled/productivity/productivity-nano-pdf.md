---
title: "Nano Pdf — 使用 nano-pdf CLI 通过自然语言指令编辑 PDF"
sidebar_label: "Nano Pdf"
description: "使用 nano-pdf CLI 通过自然语言指令编辑 PDF"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Nano Pdf

使用 nano-pdf CLI 通过自然语言指令编辑 PDF。修改文本、修正错别字、更新标题，以及对特定页面进行内容更改，无需手动编辑。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/productivity/nano-pdf` |
| 版本 | `1.0.0` |
| 作者 | 社区 |
| 许可证 | MIT |
| 标签 | `PDF`, `文档`, `编辑`, `NLP`, `生产力` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# nano-pdf

使用自然语言指令编辑 PDF。指定一个页面并描述要进行的更改。

## 先决条件

```bash
# 使用 uv 安装（推荐 — Hermes 中已提供）
uv pip install nano-pdf

# 或使用 pip
pip install nano-pdf
```

## 用法

```bash
nano-pdf edit <file.pdf> <page_number> "<instruction>"
```

## 示例

```bash
# 更改第 1 页的标题
nano-pdf edit deck.pdf 1 "将标题更改为 'Q3 结果' 并修正副标题中的错别字"

# 更新特定页面的日期
nano-pdf edit report.pdf 3 "将日期从 1 月更新为 2026 年 2 月"

# 修正内容
nano-pdf edit contract.pdf 2 "将客户名称从 'Acme Corp' 更改为 'Acme Industries'"
```

## 注意事项

- 页码可能是从 0 开始或从 1 开始，具体取决于版本 — 如果编辑影响了错误的页面，请尝试使用 ±1 重试
- 编辑后始终验证输出 PDF（使用 `read_file` 检查文件大小，或打开它）
- 该工具在底层使用了 LLM — 需要 API 密钥（查看 `nano-pdf --help` 了解配置）
- 适用于文本更改；复杂的版式修改可能需要不同的方法