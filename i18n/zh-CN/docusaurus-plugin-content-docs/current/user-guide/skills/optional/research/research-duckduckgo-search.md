---
title: "Duckduckgo 搜索 — 通过 DuckDuckGo 免费网页搜索 — 文本、新闻、图片、视频"
sidebar_label: "Duckduckgo 搜索"
description: "通过 DuckDuckGo 免费网页搜索 — 文本、新闻、图片、视频"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从该技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Duckduckgo 搜索

通过 DuckDuckGo 免费网页搜索 — 文本、新闻、图片、视频。无需 API 密钥。安装时优先使用 `ddgs` 命令行工具；仅在确认当前运行环境中 `ddgs` 可用后，才使用 Python DDGS 库。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/research/duckduckgo-search` 安装 |
| 路径 | `optional-skills/research/duckduckgo-search` |
| 版本 | `1.3.0` |
| 作者 | gamedevCloudy |
| 许可证 | MIT |
| 标签 | `search`, `duckduckgo`, `web-search`, `free`, `fallback` |
| 相关技能 | [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是当技能激活时，智能体看到的指令。
:::

# DuckDuckGo 搜索

使用 DuckDuckGo 进行免费网页搜索。**无需 API 密钥。**

当 `web_search` 不可用或不合适时（例如未设置 `FIRECRAWL_API_KEY` 时）优先使用。当明确需要 DuckDuckGo 结果时，也可用作独立的搜索路径。

## 检测流程

在选择方法之前，请检查实际可用的内容：

```bash
# 检查 CLI 可用性
command -v ddgs >/dev/null && echo "DDGS_CLI=已安装" || echo "DDGS_CLI=缺失"
```

决策树：
1. 如果已安装 `ddgs` CLI，优先使用 `terminal` + `ddgs`
2. 如果缺少 `ddgs` CLI，不要假设 `execute_code` 可以导入 `ddgs`
3. 如果用户明确需要 DuckDuckGo，请先在相关环境中安装 `ddgs`
4. 否则回退到内置的 web/浏览器工具

重要运行时说明：
- 终端和 `execute_code` 是独立的运行环境
- 成功的 shell 安装不能保证 `execute_code` 可以导入 `ddgs`
- 切勿假设 `execute_code` 中已预装第三方 Python 包

## 安装

仅在明确需要 DuckDuckGo 搜索且运行环境尚未提供 `ddgs` 时才安装它。

```bash
# Python 包 + CLI 入口点
pip install ddgs

# 验证 CLI
ddgs --help
```

如果工作流依赖于 Python 导入，请在使用 `from ddgs import DDGS` 之前，验证同一运行环境是否可以导入 `ddgs`。

## 方法 1：CLI 搜索（首选）

当 `ddgs` 命令存在时，通过 `terminal` 使用它。这是首选路径，因为它避免了对 `execute_code` 沙箱是否安装了 `ddgs` Python 包的假设。

```bash
# 文本搜索
ddgs text -q "python async programming" -m 5

# 新闻搜索
ddgs news -q "artificial intelligence" -m 5

# 图片搜索
ddgs images -q "landscape photography" -m 10

# 视频搜索
ddgs videos -q "python tutorial" -m 5

# 带区域过滤
ddgs text -q "best restaurants" -m 5 -r us-en

# 仅最近结果 (d=天, w=周, m=月, y=年)
ddgs text -q "latest AI news" -m 5 -t w

# 用于解析的 JSON 输出
ddgs text -q "fastapi tutorial" -m 5 -o json
```

### CLI 标志

| 标志 | 描述 | 示例 |
|------|-------------|---------|
| `-q` | 查询 — **必需** | `-q "搜索词"` |
| `-m` | 最大结果数 | `-m 5` |
| `-r` | 区域 | `-r us-en` |
| `-t` | 时间限制 | `-t w` (周) |
| `-s` | 安全搜索 | `-s off` |
| `-o` | 输出格式 | `-o json` |

## 方法 2：Python API（仅在验证后使用）

仅在验证 `ddgs` 已安装在该 Python 运行环境后，才在 `execute_code` 或其他 Python 运行环境中使用 `DDGS` 类。不要默认假设 `execute_code` 包含第三方包。

安全措辞：
- “如果需要，请在安装或验证包后，使用 `execute_code` 和 `ddgs`”

避免说：
- “`execute_code` 包含 `ddgs`”
- “DuckDuckGo 搜索在 `execute_code` 中默认工作”

**重要：** `max_results` 必须始终作为**关键字参数**传递 — 位置参数用法会在所有方法上引发错误。

### 文本搜索

最佳用途：一般研究、公司、文档。

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

最佳用途：时事、突发新闻、最新更新。

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

### 图片搜索

最佳用途：视觉参考、产品图片、图表。

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

最佳用途：教程、演示、讲解。

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
|--------|----------|------------|
| `text()` | 一般研究、公司 | title, href, body |
| `news()` | 时事、更新 | date, title, source, body, url |
| `images()` | 视觉、图表 | title, image, thumbnail, url |
| `videos()` | 教程、演示 | title, content, duration, provider |

## 工作流：搜索然后提取

DuckDuckGo 返回标题、URL 和摘要 — 而不是完整页面内容。要获取完整页面内容，请先搜索，然后使用 `web_extract`、浏览器工具或 curl 提取最相关的 URL。

CLI 示例：

```bash
ddgs text -q "fastapi deployment guide" -m 3 -o json
```

Python 示例（仅在验证该运行环境中已安装 `ddgs` 后）：

```python
from ddgs import DDGS

with DDGS() as ddgs:
    results = list(ddgs.text("fastapi deployment guide", max_results=3))
    for r in results:
        print(r["title"], "->", r["href"])
```

然后使用 `web_extract` 或其他内容检索工具提取最佳 URL。

## 局限性

- **速率限制**：DuckDuckGo 可能在多次快速请求后进行限流。如有需要，请在搜索之间添加短暂延迟。
- **无内容提取**：`ddgs` 返回摘要，而非完整页面内容。请使用 `web_extract`、浏览器工具或 curl 获取完整文章/页面。
- **结果质量**：通常良好，但可配置性低于 Firecrawl 的搜索。
- **可用性**：DuckDuckGo 可能会阻止来自某些云 IP 的请求。如果搜索返回为空，请尝试不同的关键词或等待几秒钟。
- **字段可变性**：返回字段可能因结果或 `ddgs` 版本而异。对可选字段使用 `.get()` 以避免 `KeyError`。
- **独立运行环境**：在终端中成功安装 `ddgs` 并不意味着 `execute_code` 可以自动导入它。

## 故障排除

| 问题 | 可能原因 | 解决方法 |
|---------|--------------|------------|
| `ddgs: command not found` | shell 环境中未安装 CLI | 安装 `ddgs`，或改用内置的 web/浏览器工具 |
| `ModuleNotFoundError: No module named 'ddgs'` | Python 运行环境未安装该包 | 在准备该运行环境之前，请勿在此使用 Python DDGS |
| 搜索无返回结果 | 临时速率限制或查询不佳 | 等待几秒，重试，或调整查询 |
| CLI 工作但 `execute_code` 导入失败 | 终端和 `execute_code` 是不同的运行环境 | 继续使用 CLI，或单独准备 Python 运行环境 |

## 陷阱

- **`max_results` 仅限关键字参数**：`ddgs.text("query", 5)` 会引发错误。请使用 `ddgs.text("query", max_results=5)`。
- **不要假设 CLI 存在**：在使用前检查 `command -v ddgs`。
- **不要假设 `execute_code` 可以导入 `ddgs`**：除非该运行环境已单独准备，否则 `from ddgs import DDGS` 可能会因 `ModuleNotFoundError` 而失败。
- **包名**：包名为 `ddgs`（以前为 `duckduckgo-search`）。请使用 `pip install ddgs` 安装。
- **不要混淆 `-q` 和 `-m`** (CLI)：`-q` 用于查询，`-m` 用于最大结果数。
- **空结果**：如果 `ddgs` 未返回任何内容，可能是被限流了。请等待几秒后重试。

## 验证环境

已在 `ddgs==9.11.2` 语义下验证示例。现在，技能指南将 CLI 可用性和 Python 导入可用性视为独立问题，因此文档化的工作流与实际运行时行为相匹配。