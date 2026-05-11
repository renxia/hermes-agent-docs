---
title: "Searxng Search — 基于 SearXNG 的免费元搜索 — 汇聚 70 多个搜索引擎的结果"
sidebar_label: "Searxng Search"
description: "基于 SearXNG 的免费元搜索 — 汇聚 70 多个搜索引擎的结果"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从该技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Searxng Search

基于 [SearXNG](https://searxng.org/) 的免费元搜索 — 一个尊重隐私、可自托管的搜索聚合器，可同时查询 70 多个搜索引擎。

使用公共实例**无需 API 密钥**。也可自行托管以获得完全控制权。当主要网络搜索工具集（`FIRECRAWL_API_KEY`）未配置时，它将自动作为备选方案出现。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/research/searxng-search` 安装 |
| 路径 | `optional-skills/research/searxng-search` |
| 版本 | `1.0.0` |
| 作者 | hermes-agent |
| 许可证 | MIT |
| 平台 | linux, macos |
| 标签 | `search`, `searxng`, `meta-search`, `self-hosted`, `free`, `fallback` |
| 相关技能 | [`duckduckgo-search`](/docs/user-guide/skills/optional/research/research-duckduckgo-search), [`domain-intel`](/docs/user-guide/skills/optional/research/research-domain-intel) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是当技能处于活动状态时，智能体看到的指令。
:::

# SearXNG Search

使用 [SearXNG](https://searxng.org/) 进行免费元搜索 — 一个尊重隐私、可自托管的搜索聚合器，可同时查询 70 多个搜索引擎。

**无需 API 密钥**（使用公共实例时）。也可自行托管以获得完全控制权。当主要网络搜索工具集（`FIRECRAWL_API_KEY`）未配置时，它将自动作为备选方案出现。

## 配置

SearXNG 需要一个 `SEARXNG_URL` 环境变量，指向你的 SearXNG 实例：

```bash
# 公共实例（无需设置）
SEARXNG_URL=https://searxng.example.com

# 自托管 SearXNG
SEARXNG_URL=http://localhost:8888
```

如果未配置任何实例，此技能将不可用，智能体会退回到其他搜索选项。

## 检测流程

在选择方法之前，先检查实际可用的情况：

```bash
# 检查 SEARXNG_URL 是否已设置并且实例可达
curl -s --max-time 5 "${SEARXNG_URL}/search?q=test&format=json" | head -c 200
```

决策树：
1.  如果设置了 `SEARXNG_URL` 且实例响应，则使用 SearXNG
2.  如果 `SEARXNG_URL` 未设置或不可达，则退回使用其他可用的搜索工具
3.  如果用户特别需要 SearXNG，则帮助他们设置实例或寻找一个公共实例

## 方法一：通过 curl 使用 CLI（首选）

通过 `terminal` 使用 `curl` 调用 SearXNG 的 JSON API。这避免了假设安装了任何特定的 Python 包。

```bash
# 文本搜索（JSON 输出）
curl -s --max-time 10 \
  "${SEARXNG_URL}/search?q=python+async+programming&format=json&engines=google,bing&limit=10"

# 关闭安全搜索
curl -s --max-time 10 \
  "${SEARXNG_URL}/search?q=example&format=json&safesearch=0"

# 特定类别（general, news, science 等）
curl -s --max-time 10 \
  "${SEARXNG_URL}/search?q=AI+news&format=json&categories=news"
```

### 常用 CLI 标志

| 标志 | 描述 | 示例 |
|------|-------------|---------|
| `q` | 查询字符串（URL 编码） | `q=python+async` |
| `format` | 输出格式：`json`, `csv`, `rss` | `format=json` |
| `engines` | 以逗号分隔的引擎名称 | `engines=google,bing,ddg` |
| `limit` | 每个引擎的最大结果数（默认 10） | `limit=5` |
| `categories` | 按类别筛选 | `categories=news,science` |
| `safesearch` | 0=无, 1=适度, 2=严格 | `safesearch=0` |
| `time_range` | 筛选：`day`, `week`, `month`, `year` | `time_range=week` |

### 解析 JSON 结果

```bash
# 从 JSON 中提取标题和 URL
curl -s --max-time 10 "${SEARXNG_URL}/search?q=fastapi&format=json&limit=5" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
for r in data.get('results', []):
    print(r.get('title',''))
    print(r.get('url',''))
    print(r.get('content','')[:200])
    print()
"
```

每个结果返回：`title`, `url`, `content`（摘要）, `engine`, `parsed_url`, `img_src`, `thumbnail`, `author`, `published_date`

## 方法二：通过 `requests` 使用 Python API

使用 `requests` 库直接从 Python 调用 SearXNG 的 REST API：

```python
import os, requests, urllib.parse

base_url = os.environ.get("SEARXNG_URL", "")
if not base_url:
    raise RuntimeError("SEARXNG_URL 未设置")

query = "fastapi deployment guide"
params = {
    "q": query,
    "format": "json",
    "limit": 5,
    "engines": "google,bing",
}

resp = requests.get(f"{base_url}/search", params=params, timeout=10)
resp.raise_for_status()
data = resp.json()

for r in data.get("results", []):
    print(r["title"])
    print(r["url"])
    print(r.get("content", "")[:200])
    print()
```

## 方法三：使用 searxng-data Python 包

要进行更结构化的访问，可安装 `searxng-data` 包：

```bash
pip install searxng-data
```

```python
from searxng_data import engines

# 列出可用的引擎
print(engines.list_engines())
```

注意：此包仅提供引擎元数据，而非搜索 API 本身。

## 自托管 SearXNG

要运行你自己的 SearXNG 实例：

```bash
# 使用 Docker
docker run -d -p 8888:8080 \
  -v $(pwd)/searxng:/etc/searxng \
  searxng/searxng:latest

# 然后设置
SEARXNG_URL=http://localhost:8888
```

或通过 pip 安装：
```bash
pip install searxng
# 编辑 /etc/searxng/settings.yml
searxng-run
```

公共 SearXNG 实例可在以下地址找到：
- `https://searxng.example.com`（替换为任意公共实例）

## 工作流：先搜索后提取

SearXNG 返回标题、URL 和摘要，而不是完整的页面内容。要获取完整的页面内容，先进行搜索，然后使用 `web_extract`、浏览器工具或 `curl` 提取最相关的 URL。

```bash
# 搜索相关页面
curl -s "${SEARXNG_URL}/search?q=fastapi+deployment&format=json&limit=3"
# 输出：包含标题和 URL 的结果列表

# 然后使用 web_extract 提取最佳 URL
```

## 局限性

- **实例可用性**：如果 SearXNG 实例宕机或不可达，搜索将失败。始终检查 `SEARXNG_URL` 是否已设置且实例可达。
- **无内容提取**：SearXNG 返回摘要，而非完整页面内容。对于完整文章，请使用 `web_extract`、浏览器工具或 `curl`。
- **速率限制**：一些公共实例会限制请求。自行托管可避免此问题。
- **引擎覆盖范围**：可用的引擎取决于 SearXNG 实例的配置。某些引擎可能被禁用。
- **结果时效性**：元搜索聚合外部引擎 — 结果的新鲜度取决于这些引擎。

## 疑难解答

| 问题 | 可能原因 | 解决方法 |
|---------|--------------|------------|
| `SEARXNG_URL` 未设置 | 未配置实例 | 使用公共 SearXNG 实例或设置自己的实例 |
| 连接被拒绝 | 实例未运行或 URL 错误 | 检查 URL 是否正确且实例正在运行 |
| 结果为空 | 实例阻止了该查询 | 尝试不同的实例或自行托管 |
| 响应缓慢 | 公共实例负载过高 | 自行托管或使用负载较低的公共实例 |
| 不支持 `json` 格式 | SearXNG 版本过旧 | 尝试 `format=rss` 或升级 SearXNG |

## 注意事项

- **始终设置 `SEARXNG_URL`**：没有它，技能将无法运行。
- **对查询进行 URL 编码**：在 curl 中，空格和特殊字符必须进行 URL 编码，或在 Python 中使用 `urllib.parse.quote()`。
- **使用 `format=json`**：默认格式可能不是机器可读的。始终明确请求 JSON。
- **设置超时**：始终使用 `--max-time` 或 `timeout=` 以避免在不可达的实例上挂起。
- **自托管最佳**：公共实例可能会宕机、限制速率或进行屏蔽。自托管实例更可靠。

## 实例发现

如果未设置 `SEARXNG_URL` 且用户询问 SearXNG，请帮助他们：
1.  寻找一个公共 SearXNG 实例（搜索“public searxng instance”）
2.  使用 Docker 或 pip 设置自己的实例

公共实例列表位于：https://searxng.org/