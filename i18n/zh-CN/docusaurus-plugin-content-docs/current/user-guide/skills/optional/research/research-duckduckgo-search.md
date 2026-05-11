---
title: "Duckduckgo Search — 通过 DuckDuckGo 的免费网络搜索 — 文本、新闻、图像、视频"
sidebar_label: "Duckduckgo Search"
description: "通过 DuckDuckGo 的免费网络搜索 — 文本、新闻、图像、视频"
---

{/* 此页面由网站脚本 `website/scripts/generate-skill-docs.py` 从技能的 `SKILL.md` 自动生成。请编辑源文件 `SKILL.md`，而非此页面。 */}

# Duckduckgo Search

通过 DuckDuckGo 的免费网络搜索 — 文本、新闻、图像、视频。无需 API 密钥。优先使用已安装的 `ddgs` 命令行工具；仅在确认 `ddgs` 在当前运行时中可用后，才使用 Python DDGS 库。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/research/duckduckgo-search` 安装 |
| 路径 | `optional-skills/research/duckduckgo-search` |
| 版本 | `1.3.0` |
| 作者 | gamedevCloudy |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `search`, `duckduckgo`, `web-search`, `free`, `fallback` |
| 相关技能 | [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指示。
:::

# DuckDuckGo Search

使用 DuckDuckGo 进行免费网络搜索。**无需 API 密钥。**

当 `web_search` 不可用或不适合时（例如，当 `FIRECRAWL_API_KEY` 未设置时），优先使用此工具。也可以在特别希望获取 DuckDuckGo 结果时，作为独立的搜索路径使用。

## 检测流程

在选择方法之前，先检查实际可用的内容：

```bash
# 检查 CLI 可用性
command -v ddgs >/dev/null && echo "DDGS_CLI=installed" || echo "DDGS_CLI=missing"
```

决策树：
1.  如果安装了 `ddgs` CLI，优先使用 `terminal` + `ddgs`
2.  如果缺少 `ddgs` CLI，不要假设 `execute_code` 能够导入 `ddgs`
3.  如果用户特别想要 DuckDuckGo，请先在相关环境中安装 `ddgs`
4.  否则，回退到内置的 web/browser 工具

重要的运行时说明：
- 终端和 `execute_code` 是独立的运行时环境
- 成功的 shell 安装并不能保证 `execute_code` 能够导入 `ddgs`
- 永远不要假设第三方 Python 包在 `execute_code` 内部是预装的

## 安装

仅在明确需要 DuckDuckGo 搜索且运行时尚未提供时，才安装 `ddgs`。

```bash
# Python 包 + CLI 入口点
pip install ddgs

# 验证 CLI
ddgs --help
```

如果工作流依赖于 Python 导入，请在使用 `from ddgs import DDGS` 之前，验证同一运行时是否可以导入 `ddgs`。

## 方法 1：CLI 搜索（首选）

当 `ddgs` 命令存在时，通过 `terminal` 使用它。这是首选路径，因为它避免了假设 `execute_code` 沙箱已安装 `ddgs` Python 包。

```bash
# 文本搜索
ddgs text -q "python async programming" -m 5

# 新闻搜索
ddgs news -q "artificial intelligence" -m 5

# 图像搜索
ddgs images -q "landscape photography" -m 10

# 视频搜索
ddgs videos -q "python tutorial" -m 5

# 带区域过滤器
ddgs text -q "best restaurants" -m 5 -r us-en

# 仅限最近结果 (d=天, w=周, m=月, y=年)
ddgs text -q "latest AI news" -m 5 -t w

# 用于解析的 JSON 输出
ddgs text -q "fastapi tutorial" -m 5 -o json
```

### CLI 标志

| 标志 | 描述 | 示例 |
|------|------|------|
| `-q` | 查询 — **必需** | `-q "search terms"` |
| `-m` | 最大结果数 | `-m 5` |
| `-r` | 区域 | `-r us-en` |
| `-t` | 时间限制 | `-t w` (周) |
| `-s` | 安全搜索 | `-s off` |
| `-o` | 输出格式 | `-o json` |

## 方法 2：Python API（仅在验证后使用）

仅在验证 `execute_code` 或其他 Python 运行时中已安装 `ddgs` 后，才使用其中的 `DDGS` 类。不要假设 `execute_code` 默认包含第三方包。

安全措辞：
- “在安装或验证包（如果需要）后，使用 `execute_code` 配合 `ddgs`”

避免说：
- “`execute_code` 包含 `ddgs`”
- “DuckDuckGo 搜索在 `execute_code` 中默认可用”

**重要提示：** `max_results` 必须始终作为**关键字参数**传递 —— 所有方法中的位置用法都会引发错误。

### 文本搜索

最适合：一般研究、公司、文档。

```python
from ddgs import DDGS

with DDGS() as ddgs:
    for r in ddgs.text("python async programming", max_results=5):
        print(r["title"])
        print(r["href"])
        print(r.get("body", "")[:200])
        print()
```

返回：`title`, `href`, `body`

### 新闻搜索

最适合：当前事件、突发新闻、最新更新。

```python
from ddgs import DDGS

with DDGS() as ddgs:
    for r in ddgs.news("AI regulation 2026", max_results=5):
        print(r["date"], "-", r["title"])
        print(r.get("source", ""), "|", r["url"])
        print(r.get("body", "")[:200])
        print()
```

返回：`date`, `title`, `body`, `url`, `image`, `source`

### 图像搜索

最适合：视觉参考、产品图片、图表。

```python
from ddgs import DDGS

with DDGS() as ddgs:
    for r in ddgs.images("semiconductor chip", max_results=5):
        print(r["title"])
        print(r["image"])
        print(r.get("thumbnail", ""))
        print(r.get("source", ""))
        print()
```

返回：`title`, `image`, `thumbnail`, `url`, `height`, `width`, `source`

### 视频搜索

最适合：教程、演示、解释者。

```python
from ddgs import DDGS

with DDGS() as ddgs:
    for r in ddgs.videos("FastAPI tutorial", max_results=5):
        print(r["title"])
        print(r.get("content", ""))
        print(r.get("duration", ""))
        print(r.get("provider", ""))
        print(r.get("published", ""))
        print()
```

返回：`title`, `content`, `description`, `duration`, `provider`, `published`, `statistics`, `uploader`

### 快速参考

| 方法 | 使用场景 | 关键字段 |
|------|----------|----------|
| `text()` | 一般研究、公司 | title, href, body |
| `news()` | 当前事件、更新 | date, title, source, body, url |
| `images()` | 视觉内容、图表 | title, image, thumbnail, url |
| `videos()` | 教程、演示 | title, content, duration, provider |

## 工作流：搜索然后提取

DuckDuckGo 返回标题、URL 和摘要 —— 而非完整的页面内容。要获取完整页面内容，先搜索，然后使用 `web_extract`、浏览器工具或 curl 提取最相关的 URL。

CLI 示例：

```bash
ddgs text -q "fastapi deployment guide" -m 3 -o json
```

Python 示例，仅在验证该运行时中已安装 `ddgs` 后使用：

```python
from ddgs import DDGS

with DDGS() as ddgs:
    results = list(ddgs.text("fastapi deployment guide", max_results=3))
    for r in results:
        print(r["title"], "->", r["href"])
```

然后使用 `web_extract` 或其他内容检索工具提取最佳 URL。

## 限制

- **速率限制**：在多次快速请求后，DuckDuckGo 可能会进行限流。如果需要，可在搜索之间添加短暂延迟。
- **无内容提取**：`ddgs` 返回摘要，而非完整页面内容。使用 `web_extract`、浏览器工具或 curl 获取完整的文章/页面。
- **结果质量**：通常很好，但比 Firecrawl 的搜索可配置性更低。
- **可用性**：DuckDuckGo 可能会阻止来自某些云 IP 的请求。如果搜索返回空，请尝试不同的关键词或等待几秒钟。
- **字段可变性**：返回的字段可能在结果或 `ddgs` 版本之间有所不同。对可选字段使用 `.get()` 以避免 `KeyError`。
- **独立的运行时**：在终端中成功安装 `ddgs` 并不自动意味着 `execute_code` 可以导入它。

## 故障排除

| 问题 | 可能原因 | 解决方法 |
|------|----------|----------|
| `ddgs: command not found` | CLI 未安装在 shell 环境中 | 安装 `ddgs`，或改用内置的 web/browser 工具 |
| `ModuleNotFoundError: No module named 'ddgs'` | Python 运行时未安装该包 | 在该运行时准备好之前，不要在那里使用 Python DDGS |
| 搜索返回无结果 | 临时速率限制或查询不佳 | 等待几秒钟，重试，或调整查询 |
| CLI 有效但 `execute_code` 导入失败 | 终端和 `execute_code` 是不同的运行时 | 继续使用 CLI，或单独准备 Python 运行时 |

## 陷阱

- **`max_results` 仅限关键字参数**：`ddgs.text("query", 5)` 会引发错误。使用 `ddgs.text("query", max_results=5)`。
- **不要假设 CLI 存在**：使用前检查 `command -v ddgs`。
- **不要假设 `execute_code` 可以导入 `ddgs`**：`from ddgs import DDGS` 可能会因 `ModuleNotFoundError` 而失败，除非该运行时是单独准备的。
- **包名**：包名是 `ddgs`（之前是 `duckduckgo-search`）。使用 `pip install ddgs` 安装。
- **不要混淆 `-q` 和 `-m`** (CLI)：`-q` 用于查询，`-m` 用于最大结果数。
- **空结果**：如果 `ddgs` 未返回任何内容，它可能已被限流。等待几秒钟后重试。

## 验证依据

已根据 `ddgs==9.11.2` 语义验证了示例。技能指南现在将 CLI 可用性和 Python 导入可用性视为独立问题，因此文档记录的工作流与实际运行时行为相匹配。