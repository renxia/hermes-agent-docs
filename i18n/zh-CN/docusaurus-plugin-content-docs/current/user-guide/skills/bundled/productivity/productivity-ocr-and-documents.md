---
title: "OCR与文档 — 从PDF/扫描件提取文本 (pymupdf, marker-pdf)"
sidebar_label: "OCR与文档"
description: "从PDF/扫描件提取文本 (pymupdf, marker-pdf)"
---

{/* 此页面由网站脚本 generate-skill-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# OCR与文档

从PDF/扫描件提取文本 (pymupdf, marker-pdf)。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/productivity/ocr-and-documents` |
| 版本 | `2.3.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `PDF`, `文档`, `研究`, `Arxiv`, `文本提取`, `OCR` |
| 相关技能 | [`powerpoint`](/docs/user-guide/skills/bundled/productivity/productivity-powerpoint) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes加载的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# PDF与文档提取

对于DOCX文件：使用 `python-docx`（解析实际文档结构，比OCR好得多）。
对于PPTX文件：请参阅 `powerpoint` 技能（使用 `python-pptx` 并支持完整幻灯片/备注）。
本技能涵盖 **PDF和扫描文档**。

## 步骤1：是否有远程URL？

如果文档有URL，**始终首先尝试 `web_extract`**：

```
web_extract(urls=["https://arxiv.org/pdf/2402.03300"])
web_extract(urls=["https://example.com/report.pdf"])
```

这会通过Firecrawl处理PDF到Markdown的转换，无需本地依赖。

仅在以下情况使用本地提取：文件是本地的、`web_extract` 失败，或者您需要批处理。

## 步骤2：选择本地提取器

| 功能 | pymupdf (~25MB) | marker-pdf (~3-5GB) |
|---------|-----------------|---------------------|
| **基于文本的PDF** | ✅ | ✅ |
| **扫描版PDF (OCR)** | ❌ | ✅ (90+种语言) |
| **表格** | ✅ (基础) | ✅ (高精度) |
| **公式 / LaTeX** | ❌ | ✅ |
| **代码块** | ❌ | ✅ |
| **表单** | ❌ | ✅ |
| **移除页眉/页脚** | ❌ | ✅ |
| **阅读顺序检测** | ❌ | ✅ |
| **图片提取** | ✅ (嵌入式) | ✅ (带上下文) |
| **图片转文本 (OCR)** | ❌ | ✅ |
| **EPUB** | ✅ | ✅ |
| **Markdown输出** | ✅ (通过pymupdf4llm) | ✅ (原生，质量更高) |
| **安装大小** | ~25MB | ~3-5GB (PyTorch + 模型) |
| **速度** | 即时 | ~1-14秒/页 (CPU)，~0.2秒/页 (GPU) |

**决策**：除非您需要OCR、公式、表单或复杂的版面分析，否则请使用pymupdf。

如果用户需要marker的能力但系统缺少约5GB的可用磁盘空间：
> "此文档需要OCR/高级提取（marker-pdf），这需要大约5GB空间来存放PyTorch和模型。您的系统有 [X]GB 可用空间。选项：清理空间，提供URL以便我能使用 `web_extract`，或者我可以尝试pymupdf，它适用于基于文本的PDF，但不适用于扫描文档或公式。"

---

## pymupdf (轻量级)

```bash
pip install pymupdf pymupdf4llm
```

**通过辅助脚本**：
```bash
python scripts/extract_pymupdf.py document.pdf              # 纯文本
python scripts/extract_pymupdf.py document.pdf --markdown    # Markdown
python scripts/extract_pymupdf.py document.pdf --tables      # 表格
python scripts/extract_pymupdf.py document.pdf --images out/ # 提取图片
python scripts/extract_pymupdf.py document.pdf --metadata    # 标题、作者、页数
python scripts/extract_pymupdf.py document.pdf --pages 0-4   # 特定页面
```

**内联执行**：
```bash
python3 -c "
import pymupdf
doc = pymupdf.open('document.pdf')
for page in doc:
    print(page.get_text())
"
```

---

## marker-pdf (高质量OCR)

```bash
# 首先检查磁盘空间
python scripts/extract_marker.py --check

pip install marker-pdf
```

**通过辅助脚本**：
```bash
python scripts/extract_marker.py document.pdf                # Markdown
python scripts/extract_marker.py document.pdf --json         # 带元数据的JSON
python scripts/extract_marker.py document.pdf --output_dir out/  # 保存图片
python scripts/extract_marker.py scanned.pdf                 # 扫描版PDF (OCR)
python scripts/extract_marker.py document.pdf --use_llm      # LLM增强精度
```

**命令行** (随marker-pdf安装)：
```bash
marker_single document.pdf --output_dir ./output
marker /path/to/folder --workers 4    # 批量处理
```

---

## Arxiv 论文

```
# 仅摘要 (快速)
web_extract(urls=["https://arxiv.org/abs/2402.03300"])

# 完整论文
web_extract(urls=["https://arxiv.org/pdf/2402.03300"])

# 搜索
web_search(query="arxiv GRPO 强化学习 2026")
```

## 分割、合并与搜索

pymupdf 可以原生处理这些操作 — 使用 `execute_code` 或内联Python：

```python
# 分割：提取第1-5页到一个新PDF
import pymupdf
doc = pymupdf.open("report.pdf")
new = pymupdf.open()
for i in range(5):
    new.insert_pdf(doc, from_page=i, to_page=i)
new.save("pages_1-5.pdf")
```

```python
# 合并多个PDF
import pymupdf
result = pymupdf.open()
for path in ["a.pdf", "b.pdf", "c.pdf"]:
    result.insert_pdf(pymupdf.open(path))
result.save("merged.pdf")
```

```python
# 跨所有页面搜索文本
import pymupdf
doc = pymupdf.open("report.pdf")
for i, page in enumerate(doc):
    results = page.search_for("revenue")
    if results:
        print(f"第 {i+1} 页：找到 {len(results)} 处匹配")
        print(page.get_text("text"))
```

无需额外依赖 — pymupdf 在一个包内涵盖了分割、合并、搜索和文本提取。

---

## 备注

- `web_extract` 始终是URL的首选
- pymupdf 是安全的默认选择 — 即时、无需模型、处处可用
- marker-pdf 用于OCR、扫描文档、公式、复杂版面 — 仅在需要时安装
- 两个辅助脚本都接受 `--help` 参数以查看完整用法
- marker-pdf 首次使用时会将约2.5GB的模型下载到 `~/.cache/huggingface/`
- 对于Word文档：`pip install python-docx`（比OCR好 — 解析实际结构）
- 对于PowerPoint：请参阅 `powerpoint` 技能（使用python-pptx）