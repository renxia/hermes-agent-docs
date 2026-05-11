---
title: "Nano Pdf — 通过 nano-pdf CLI（自然语言提示）编辑 PDF 文本/错别字/标题"
sidebar_label: "Nano Pdf"
description: "通过 nano-pdf CLI（自然语言提示）编辑 PDF 文本/错别字/标题"
---

{/* 本页面由网站脚本 generate-skill-docs.py 根据该技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Nano Pdf

通过 nano-pdf CLI（自然语言提示）编辑 PDF 文本/错别字/标题。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/productivity/nano-pdf` |
| 版本 | `1.0.0` |
| 作者 | 社区 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `PDF`、`文档`、`编辑`、`NLP`、`生产力` |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的操作说明。
:::

# nano-pdf

使用自然语言指令编辑 PDF。指向页面并描述要更改的内容。

## 前提条件

```bash
# 使用 uv 安装（推荐 — Hermes 中已可用）
uv pip install nano-pdf

# 或使用 pip
pip install nano-pdf
```

## 用法

```bash
nano-pdf edit <文件.pdf> <页码> "<指令>"
```

## 示例

```bash
# 更改第 1 页的标题
nano-pdf edit deck.pdf 1 "将标题更改为 'Q3 Results'，并修复副标题中的错别字"

# 更新特定页面上的日期
nano-pdf edit report.pdf 3 "将日期从一月更新为二月 2026"

# 修正内容
nano-pdf edit contract.pdf 2 "将客户名称从 'Acme Corp' 更改为 'Acme Industries'"
```

## 备注

- 页码可能是 0 起始或 1 起始，具体取决于版本 — 如果编辑命中错误页面，请尝试 ±1 重试
- 编辑后始终验证输出的 PDF（使用 `read_file` 检查文件大小，或打开它）
- 该工具底层使用了 LLM — 需要 API 密钥（检查 `nano-pdf --help` 了解配置）
- 适用于文本更改；复杂的布局修改可能需要其他方法