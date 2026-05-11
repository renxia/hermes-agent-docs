---
title: "Arxiv — 通过关键词、作者、类别或ID搜索arXiv论文"
sidebar_label: "Arxiv"
description: "通过关键词、作者、类别或ID搜索arXiv论文"
---

{/* 此页面由网站脚本/scripts/generate-skill-docs.py从技能的SKILL.md文件自动生成。请编辑源文件SKILL.md，而非此页面。 */}

# Arxiv

通过关键词、作者、类别或ID搜索arXiv论文。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/research/arxiv` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `研究`, `Arxiv`, `论文`, `学术`, `科学`, `API` |
| 相关技能 | [`ocr-and-documents`](/docs/user-guide/skills/bundled/productivity/productivity-ocr-and-documents) |

:::info
以下是Hermes在此技能触发时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# arXiv 研究

通过其免费的REST API搜索和获取arXiv学术论文。无需API密钥，无依赖项 — 只需curl即可。

## 快速参考

| 操作 | 命令 |
|--------|---------|
| 搜索论文 | `curl "https://export.arxiv.org/api/query?search_query=all:QUERY&max_results=5"` |
| 获取特定论文 | `curl "https://export.arxiv.org/api/query?id_list=2402.03300"` |
| 阅读摘要 (网页) | `web_extract(urls=["https://arxiv.org/abs/2402.03300"])` |
| 阅读全文 (PDF) | `web_extract(urls=["https://arxiv.org/pdf/2402.03300"])` |

## 搜索论文

API返回Atom XML。使用 `grep`/`sed` 解析，或通过 `python3` 传输以获得整洁输出。

### 基础搜索

```bash
curl -s "https://export.arxiv.org/api/query?search_query=all:GRPO+reinforcement+learning&max_results=5"
```

### 整洁输出 (将XML解析为可读格式)

```bash
curl -s "https://export.arxiv.org/api/query?search_query=all:GRPO+reinforcement+learning&max_results=5&sortBy=submittedDate&sortOrder=descending" | python3 -c "
import sys, xml.etree.ElementTree as ET
ns = {'a': 'http://www.w3.org/2005/Atom'}
root = ET.parse(sys.stdin).getroot()
for i, entry in enumerate(root.findall('a:entry', ns)):
    title = entry.find('a:title', ns).text.strip().replace('\n', ' ')
    arxiv_id = entry.find('a:id', ns).text.strip().split('/abs/')[-1]
    published = entry.find('a:published', ns).text[:10]
    authors = ', '.join(a.find('a:name', ns).text for a in entry.findall('a:author', ns))
    summary = entry.find('a:summary', ns).text.strip()[:200]
    cats = ', '.join(c.get('term') for c in entry.findall('a:category', ns))
    print(f'{i+1}. [{arxiv_id}] {title}')
    print(f'   Authors: {authors}')
    print(f'   Published: {published} | Categories: {cats}')
    print(f'   Abstract: {summary}...')
    print(f'   PDF: https://arxiv.org/pdf/{arxiv_id}')
    print()
"
```

## 搜索查询语法

| 前缀 | 搜索范围 | 示例 |
|--------|----------|---------|
| `all:` | 所有字段 | `all:transformer+attention` |
| `ti:` | 标题 | `ti:large+language+models` |
| `au:` | 作者 | `au:vaswani` |
| `abs:` | 摘要 | `abs:reinforcement+learning` |
| `cat:` | 分类 | `cat:cs.AI` |
| `co:` | 注释 | `co:accepted+NeurIPS` |

### 布尔运算符

```
# AND (使用 + 时的默认操作)
search_query=all:transformer+attention

# OR
search_query=all:GPT+OR+all:BERT

# AND NOT
search_query=all:language+model+ANDNOT+all:vision

# 精确短语
search_query=ti:"chain+of+thought"

# 组合
search_query=au:hinton+AND+cat:cs.LG
```

## 排序与分页

| 参数 | 选项 |
|-----------|---------|
| `sortBy` | `relevance`, `lastUpdatedDate`, `submittedDate` |
| `sortOrder` | `ascending`, `descending` |
| `start` | 结果偏移量 (基于0) |
| `max_results` | 结果数量 (默认10，最多30000) |

```bash
# cs.AI 领域最新的10篇论文
curl -s "https://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=10"
```

## 获取特定论文

```bash
# 通过 arXiv ID
curl -s "https://export.arxiv.org/api/query?id_list=2402.03300"

# 多篇论文
curl -s "https://export.arxiv.org/api/query?id_list=2402.03300,2401.12345,2403.00001"
```

## BibTeX 生成

获取论文元数据后，生成BibTeX条目：

&#123;% raw %&#125;
```bash
curl -s "https://export.arxiv.org/api/query?id_list=1706.03762" | python3 -c "
import sys, xml.etree.ElementTree as ET
ns = {'a': 'http://www.w3.org/2005/Atom', 'arxiv': 'http://arxiv.org/schemas/atom'}
root = ET.parse(sys.stdin).getroot()
entry = root.find('a:entry', ns)
if entry is None: sys.exit('Paper not found')
title = entry.find('a:title', ns).text.strip().replace('\n', ' ')
authors = ' and '.join(a.find('a:name', ns).text for a in entry.findall('a:author', ns))
year = entry.find('a:published', ns).text[:4]
raw_id = entry.find('a:id', ns).text.strip().split('/abs/')[-1]
cat = entry.find('arxiv:primary_category', ns)
primary = cat.get('term') if cat is not None else 'cs.LG'
last_name = entry.find('a:author', ns).find('a:name', ns).text.split()[-1]
print(f'@article{{{last_name}{year}_{raw_id.replace(\".\", \"\")},')
print(f'  title     = {{{title}}},')
print(f'  author    = {{{authors}}},')
print(f'  year      = {{{year}}},')
print(f'  eprint    = {{{raw_id}}},')
print(f'  archivePrefix = {{arXiv}},')
print(f'  primaryClass  = {{{primary}}},')
print(f'  url       = {{https://arxiv.org/abs/{raw_id}}}')
print('}')
"
```
&#123;% endraw %&#125;

## 阅读论文内容

找到论文后，阅读它：

```
# 摘要页 (快速，含元数据和摘要)
web_extract(urls=["https://arxiv.org/abs/2402.03300"])

# 全文 (PDF → 通过Firecrawl转换的Markdown)
web_extract(urls=["https://arxiv.org/pdf/2402.03300"])
```

关于本地PDF处理，请参见 `ocr-and-documents` 技能。

## 常用分类

| 分类 | 领域 |
|----------|-------|
| `cs.AI` | 人工智能 |
| `cs.CL` | 计算与语言 (NLP) |
| `cs.CV` | 计算机视觉 |
| `cs.LG` | 机器学习 |
| `cs.CR` | 密码学与安全 |
| `stat.ML` | 机器学习 (统计) |
| `math.OC` | 优化与控制 |
| `physics.comp-ph` | 计算物理 |

完整列表：https://arxiv.org/category_taxonomy

## 辅助脚本

`scripts/search_arxiv.py` 脚本处理XML解析并提供整洁输出：

```bash
python scripts/search_arxiv.py "GRPO reinforcement learning"
python scripts/search_arxiv.py "transformer attention" --max 10 --sort date
python scripts/search_arxiv.py --author "Yann LeCun" --max 5
python scripts/search_arxiv.py --category cs.AI --sort date
python scripts/search_arxiv.py --id 2402.03300
python scripts/search_arxiv.py --id 2402.03300,2401.12345
```

无依赖项 — 仅使用Python标准库。

---

## Semantic Scholar (引用、相关论文、作者档案)

arXiv不提供引用数据或推荐。为此请使用 **Semantic Scholar API** — 免费，基础使用无需密钥 (1请求/秒)，返回JSON。

### 获取论文详情及引用数

```bash
# 通过 arXiv ID
curl -s "https://api.semanticscholar.org/graph/v1/paper/arXiv:2402.03300?fields=title,authors,citationCount,referenceCount,influentialCitationCount,year,abstract" | python3 -m json.tool

# 通过 Semantic Scholar 论文 ID 或 DOI
curl -s "https://api.semanticscholar.org/graph/v1/paper/DOI:10.1234/example?fields=title,citationCount"
```

### 获取某论文的引用 (谁引用了它)

```bash
curl -s "https://api.semanticscholar.org/graph/v1/paper/arXiv:2402.03300/citations?fields=title,authors,year,citationCount&limit=10" | python3 -m json.tool
```

### 获取某论文的参考文献 (它引用了谁)

```bash
curl -s "https://api.semanticscholar.org/graph/v1/paper/arXiv:2402.03300/references?fields=title,authors,year,citationCount&limit=10" | python3 -m json.tool
```

### 搜索论文 (arXiv搜索的替代方案，返回JSON)

```bash
curl -s "https://api.semanticscholar.org/graph/v1/paper/search?query=GRPO+reinforcement+learning&limit=5&fields=title,authors,year,citationCount,externalIds" | python3 -m json.tool
```

### 获取论文推荐

```bash
curl -s -X POST "https://api.semanticscholar.org/recommendations/v1/papers/" \
  -H "Content-Type: application/json" \
  -d '{"positivePaperIds": ["arXiv:2402.03300"], "negativePaperIds": []}' | python3 -m json.tool
```

### 作者档案

```bash
curl -s "https://api.semanticscholar.org/graph/v1/author/search?query=Yann+LeCun&fields=name,hIndex,citationCount,paperCount" | python3 -m json.tool
```

### 常用的 Semantic Scholar 字段

`title`, `authors`, `year`, `abstract`, `citationCount`, `referenceCount`, `influentialCitationCount`, `isOpenAccess`, `openAccessPdf`, `fieldsOfStudy`, `publicationVenue`, `externalIds` (包含 arXiv ID, DOI 等)

---

## 完整研究工作流程

1.  **发现**: `python scripts/search_arxiv.py "your topic" --sort date --max 10`
2.  **评估影响力**: `curl -s "https://api.semanticscholar.org/graph/v1/paper/arXiv:ID?fields=citationCount,influentialCitationCount"`
3.  **阅读摘要**: `web_extract(urls=["https://arxiv.org/abs/ID"])`
4.  **阅读全文**: `web_extract(urls=["https://arxiv.org/pdf/ID"])`
5.  **查找相关工作**: `curl -s "https://api.semanticscholar.org/graph/v1/paper/arXiv:ID/references?fields=title,citationCount&limit=20"`
6.  **获取推荐**: 向Semantic Scholar推荐端点发送POST请求
7.  **跟踪作者**: `curl -s "https://api.semanticscholar.org/graph/v1/author/search?query=NAME"`

## 速率限制

| API | 速率 | 认证 |
|-----|------|------|
| arXiv | ~1 请求 / 3 秒 | 无需 |
| Semantic Scholar | 1 请求 / 秒 | 无需 (使用API密钥可达100请求/秒) |

## 注意事项

-   arXiv返回Atom XML — 使用辅助脚本或解析代码片段以获得整洁输出
-   Semantic Scholar返回JSON — 通过 `python3 -m json.tool` 管道传输以提高可读性
-   arXiv ID格式：旧格式 (`hep-th/0601001`) 与新格式 (`2402.03300`)
-   PDF: `https://arxiv.org/pdf/{id}` — 摘要: `https://arxiv.org/abs/{id}`
-   HTML (如可用): `https://arxiv.org/html/{id}`
-   关于本地PDF处理，请参见 `ocr-and-documents` 技能

## ID 版本管理

- `arxiv.org/abs/1706.03762` 始终解析到**最新**版本
- `arxiv.org/abs/1706.03762v1` 指向一个**特定的**、不可变的版本
- 生成引用时，请保留你实际阅读的版本后缀，以防止引用漂移（后续版本可能对内容做出重大修改）
- API 的 `<id>` 字段返回带版本的 URL（例如 `http://arxiv.org/abs/1706.03762v7`）

## 已撤回的论文

论文在提交后可能会被撤回。发生这种情况时：
- `<summary>` 字段包含撤回通知（查找 "withdrawn" 或 "retracted"）
- 元数据字段可能不完整
- 在将某篇论文视为有效论文之前，请务必检查其摘要