---
title: 网页搜索与提取
description: 通过多种后端提供者搜索网页、提取页面内容并爬取网站——包括免费的自托管SearXNG。
sidebar_label: 网页搜索
sidebar_position: 6
---

# 网页搜索与提取

Hermes智能体包含两个由多种提供者支持的模型可调用网页工具：

- **`web_search`** —— 搜索网页并返回排序结果
- **`web_extract`** —— 从一个或多个URL获取并提取可读内容（当后端提供时，内置深度爬取支持）

两者都通过单一后端选择进行配置。提供者可通过 `hermes tools` 选择或在 `config.yaml` 中直接设置。递归爬取功能（Firecrawl/Tavily）通过 `web_extract` 而非单独的 `web_crawl` 工具暴露。

## 后端

| 提供者 | 环境变量 | 搜索 | 提取 | 爬取 | 免费额度 |
|----------|---------|--------|---------|-------|-----------|
| **Firecrawl**（默认） | `FIRECRAWL_API_KEY` | ✔ | ✔ | ✔ | 500积分/月 |
| **SearXNG** | `SEARXNG_URL` | ✔ | — | — | ✔ 免费（自托管） |
| **Brave Search（免费版）** | `BRAVE_SEARCH_API_KEY` | ✔ | — | — | 2,000次查询/月 |
| **DDGS (DuckDuckGo)** | —（无需密钥） | ✔ | — | — | ✔ 免费 |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ | ✔ | 1,000次搜索/月 |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ | — | 1,000次搜索/月 |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ | — | 付费 |
| **xAI (Grok)** | `XAI_API_KEY` 或 `hermes auth login xai-oauth` | ✔ | — | — | 付费（SuperGrok或按令牌计费） |

Brave Search、DDGS和xAI**仅提供搜索功能**——当您同时需要 `web_extract` 时，请将它们中的任何一个与Firecrawl/Tavily/Exa/Parallel配对使用。DDGS底层使用 [`ddgs` Python包](https://pypi.org/project/ddgs/)；如果尚未安装，请运行 `pip install ddgs`（或让Hermes在首次使用时懒加载安装）。xAI在Responses API上运行Grok的服务器端 `web_search` 工具——结果是LLM生成的而非索引支持的，因此标题、描述和URL选择都是模型输出（请参阅下面的[信任模型注意事项](#xai-grok)）。

**按功能拆分：** 您可以独立地为搜索和提取使用不同的提供者——例如，搜索使用SearXNG（免费），提取使用Firecrawl。请参阅下面的[按功能配置](#按功能配置)。

:::tip Nous订阅用户
如果您拥有付费的[Nous Portal](https://portal.nousresearch.com)订阅，则可通过**[工具网关](tool-gateway.md)**使用网页搜索和提取功能（通过托管的Firecrawl）——无需API密钥。新安装可以运行 `hermes setup --portal` 登录并一次开启所有网关工具；现有安装可以通过 `hermes tools` 仅切换网页工具。
:::

---

## `web_extract` 如何处理长页面

后端返回原始页面 Markdown，其内容可能非常庞大（论坛帖子、文档站、包含嵌入式评论的新闻文章）。为保持您的上下文窗口可用并控制成本，`web_extract` 会通过 **`web_extract` 辅助模型** 处理返回的内容，然后再将其交给智能体。其行为完全由页面大小决定：

| 页面大小（字符数） | 发生什么 |
|------------------------|--------------|
| 少于 5,000 | 原样返回 — 不进行 LLM 调用，完整的 Markdown 将发送给智能体 |
| 5,000 – 500,000 | 通过 `web_extract` 辅助模型进行单次摘要，输出上限约为 5,000 个字符 |
| 500,000 – 2,000,000 | 分块处理：将页面分割为 100K 字符的块，并行地对每个块进行摘要，然后合成最终摘要（约 5,000 个字符） |
| 超过 2,000,000 | 拒绝处理，并提示使用带有聚焦提取指令或更具体来源的 `web_crawl` |

摘要会保留引号、代码块和关键事实的原始格式 —— 它是一个内容压缩器，而不是释义器。如果摘要生成失败或超时，Hermes 会回退到原始内容的前约 5,000 个字符，而不是返回一个无用的错误。

### 使用哪个模型进行摘要？

由 `web_extract` 辅助任务处理。默认情况下（`auxiliary.web_extract.provider: "auto"`），这将是您的**主聊天模型** —— 与 `hermes model` 使用相同的提供商和模型。这对于大多数设置来说没问题，但在昂贵的推理模型（如 Opus、MiniMax M2.7 等）上，每次长页面提取都会增加显著的成本。

若要将提取摘要路由到廉价、快速的模型（无论您的主模型是什么）：

```yaml
# ~/.hermes/config.yaml
auxiliary:
  web_extract:
    provider: openrouter
    model: google/gemini-3-flash-preview
    timeout: 360       # 秒；如果遇到摘要超时，可调高此值
```

或进行交互式选择：`hermes model` → **配置辅助模型** → `web_extract`。

完整参考和按任务覆盖模式，请参阅[辅助模型](/user-guide/configuration#auxiliary-models)。

### 何时摘要会成为阻碍

如果您特别需要原始的、未经摘要的页面内容（例如，您正在抓取一个结构化页面，而 LLM 摘要可能会丢失重要字段），请改用 `browser_navigate` + `browser_snapshot`。浏览器工具返回实时的可访问性树，而不会经过辅助模型重写（但对于巨大的页面，它有其自身的 8,000 字符快照上限）。

---

## 设置

### 通过 `hermes tools` 快速设置

运行 `hermes tools`，导航到 **Web Search & Extract**，并选择一个提供者。向导会提示所需的 URL 或 API 密钥，并将其写入您的配置文件。

```bash
hermes tools
```

---

### Firecrawl（默认）

功能全面的搜索、提取和爬取工具。推荐给大多数用户。

```bash
# ~/.hermes/.env
FIRECRAWL_API_KEY=fc-your-key-here
```

在 [firecrawl.dev](https://firecrawl.dev) 获取密钥。免费套餐包含每月 500 个积分。

**自托管 Firecrawl：** 将其指向您自己的实例，而不是云 API：

```bash
# ~/.hermes/.env
FIRECRAWL_API_URL=http://localhost:3002
```

当设置了 `FIRECRAWL_API_URL` 时，API 密钥是可选的（使用 `USE_DB_AUTHENTICATION=false` 禁用服务器认证）。

---

### SearXNG（免费、自托管）

SearXNG 是一个尊重隐私的开源元搜索引擎，聚合了 70 多个搜索引擎的结果。**无需 API 密钥** —— 只需将 Hermes 指向一个运行中的 SearXNG 实例。

SearXNG **仅支持搜索** —— `web_extract`（包括其爬取模式）需要单独的提取提供者。

#### 选项 A — 使用 Docker 自托管（推荐）

这为您提供了一个没有速率限制的私有实例。

**1. 创建一个工作目录：**

```bash
mkdir -p ~/searxng/searxng
cd ~/searxng
```

**2. 写入一个 `docker-compose.yml`：**

```yaml
# ~/searxng/docker-compose.yml
services:
  searxng:
    image: searxng/searxng:latest
    container_name: searxng
    ports:
      - "8888:8080"
    volumes:
      - ./searxng:/etc/searxng:rw
    environment:
      - SEARXNG_BASE_URL=http://localhost:8888/
    restart: unless-stopped
```

**3. 启动容器：**

```bash
docker compose up -d
```

**4. 启用 JSON API 格式：**

SearXNG 默认禁用 JSON 输出。复制生成的配置并启用它：

```bash
# 从容器中复制自动生成的配置
docker cp searxng:/etc/searxng/settings.yml ~/searxng/searxng/settings.yml
```

打开 `~/searxng/searxng/settings.yml` 并找到 `formats` 块（大约在第 84 行）：

```yaml
# 之前（默认 —— JSON 禁用）：
formats:
  - html

# 之后（为 Hermes 启用 JSON）：
formats:
  - html
  - json
```

**5. 重启以应用更改：**

```bash
docker cp ~/searxng/searxng/settings.yml searxng:/etc/searxng/settings.yml
docker restart searxng
```

**6. 验证其是否工作：**

```bash
curl -s "http://localhost:8888/search?q=test&format=json" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"results\"])} results')"
```

您应该会看到类似 `10 results` 的输出。如果您收到 `403 Forbidden` 错误，则 JSON 格式仍然被禁用 —— 请重新检查第 4 步。

**7. 配置 Hermes：**

```bash
# ~/.hermes/.env
SEARXNG_URL=http://localhost:8888
```

然后在 `~/.hermes/config.yaml` 中将 SearXNG 选为搜索后端：

```yaml
web:
  search_backend: "searxng"
```

或通过 `hermes tools` → Web Search & Extract → SearXNG 进行设置。

---

#### 选项 B — 使用公共实例

公共 SearXNG 实例列表可在 [searx.space](https://searx.space/) 上找到。通过**启用 JSON 格式**（在表格中显示）的实例进行筛选。

```bash
# ~/.hermes/.env
SEARXNG_URL=https://searx.example.com
```

:::caution 公共实例
公共实例存在速率限制、可用性不稳定，并且可能随时禁用 JSON 格式。强烈建议自托管用于生产环境。
:::

---

#### 将 SearXNG 与提取提供者配对

SearXNG 负责搜索；您需要一个单独的提供者来执行 `web_extract`（包括任何深度爬取模式）。使用按功能划分的密钥：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "searxng"
  extract_backend: "firecrawl"   # 或 tavily, exa, parallel
```

使用此配置，Hermes 将对所有搜索查询使用 SearXNG，对 URL 提取使用 Firecrawl —— 将免费搜索与高质量提取相结合。

---

### Tavily

AI 优化的搜索、提取和爬取，拥有慷慨的免费额度。

```bash
# ~/.hermes/.env
TAVILY_API_KEY=tvly-your-key-here
```

在 [app.tavily.com](https://app.tavily.com/home) 获取密钥。免费套餐包含每月 1,000 次搜索。

---

### Exa

具有语义理解能力的神经搜索。适用于研究和查找概念相关的内容。

```bash
# ~/.hermes/.env
EXA_API_KEY=your-exa-key-here
```

在 [exa.ai](https://exa.ai) 获取密钥。免费套餐包含每月 1,000 次搜索。

---

### Parallel

AI 原生的搜索与提取，具备深度研究能力。

```bash
# ~/.hermes/.env
PARALLEL_API_KEY=your-parallel-key-here
```

在 [parallel.ai](https://parallel.ai) 获取访问权限。

---

### xAI (Grok) {#xai-grok}

通过 Responses API 上 Grok 的服务器端 [web_search 工具](https://docs.x.ai/developers/tools/web-search) 路由 `web_search`。Grok 执行实际搜索并将排名靠前的结果作为结构化 JSON 返回。

支持两种凭据路径 —— 无需新的环境变量，无需新的设置向导：

```bash
# ~/.hermes/.env（环境变量路径）
XAI_API_KEY=sk-xai-your-key-here
```

或对于 SuperGrok 订阅者：

```bash
hermes auth login xai-oauth
```

然后选择 xAI 作为搜索后端：

```yaml
# ~/.hermes/config.yaml
web:
  backend: "xai"
```

**可选配置项：**

```yaml
web:
  backend: "xai"
  xai:
    model: grok-4.3              # web_search 需要的推理模型（默认值）
    allowed_domains:             # 可选，最多 5 个 —— 与 excluded_domains 互斥
      - arxiv.org
    excluded_domains:            # 可选，最多 5 个
      - example-spam.com
    timeout: 90                  # 秒（默认值）
```

**仅限搜索** —— 如果您还需要 `web_extract`，请与 Firecrawl / Tavily / Exa / Parallel 配对使用。遇到 401 错误时，提供者会执行一次强制 OAuth 令牌刷新并重试（覆盖窗口期撤销和主动过期检查无法解码的透明令牌）；环境变量凭据跳过重试。

:::caution 信任模型
与返回原始搜索引擎结果的基于索引的提供者（Brave、Tavily、Exa）不同，xAI 是一个 LLM，它自行选择要展示哪些 URL 并编写标题和描述。查询的*内容*会影响输出，因此恶意构造的查询（例如，通过智能体拾取的不可信上游输入注入）原则上可以引导 Grok 发出攻击者选择的 URL。像对待任何模型生成的链接一样对待返回的 URL —— 在获取之前进行验证，尤其是当查询来自不可信输入时。
:::

---

## 配置

### 单一后端

为所有网络功能设置一个提供商：

```yaml
# ~/.hermes/config.yaml
web:
  backend: "searxng"   # firecrawl | searxng | brave-free | ddgs | tavily | exa | parallel | xai
```

### 按功能配置

为搜索和内容提取使用不同的提供商。这样你可以将免费搜索（SearXNG）与付费提取提供商组合使用，反之亦然：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "searxng"     # 供 web_search 使用
  extract_backend: "firecrawl"  # 供 web_extract（及其深度抓取模式）使用
```

当按功能设置的键为空时，两者都会回退到 `web.backend`。当 `web.backend` 也为空时，后端将根据环境中存在的 API 密钥或 URL 进行自动检测。

**优先级顺序（按功能）：**
1.  `web.search_backend` / `web.extract_backend` （显式按功能配置）
2.  `web.backend` （共享的回退配置）
3.  从环境变量自动检测

### 自动检测

如果未显式配置后端，Hermes 会根据已设置的凭据，选择第一个可用的后端：

| 存在的凭据                                   | 自动选择的后端 |
| -------------------------------------------- | -------------- |
| `FIRECRAWL_API_KEY` 或 `FIRECRAWL_API_URL`   | firecrawl      |
| `PARALLEL_API_KEY`                           | parallel       |
| `TAVILY_API_KEY`                             | tavily         |
| `EXA_API_KEY`                                | exa            |
| `SEARXNG_URL`                                | searxng        |

xAI 网页搜索 **不在** 自动检测链中 —— 即使设置了 `XAI_API_KEY`（或通过 xAI Grok OAuth 登录），也不会自动将网络流量路由到 xAI，因为这些凭据也用于推理/文本转语音/图像生成，并且用户可能希望为网页功能使用不同的后端。请通过 `web.backend: "xai"` 显式选择加入。

---

## 验证你的设置

运行 `hermes setup` 查看检测到了哪个网页后端：

```
✅ Web Search & Extract (searxng)
```

或通过 CLI 检查：

```bash
# 激活虚拟环境并直接运行网页工具模块
source ~/.hermes/hermes-agent/.venv/bin/activate
python -m tools.web_tools
```

这会打印出活动的后端及其状态：

```
✅ Web backend: searxng
   Using SearXNG (search only): http://localhost:8888
```

---

## 故障排除

### `web_search` 返回 `{"success": false}`

- 检查 `SEARXNG_URL` 是否可达：`curl -s "http://localhost:8888/search?q=test&format=json"`
- 如果你收到 HTTP 403 错误，说明 JSON 格式被禁用——请在 `settings.yml` 的 `formats` 列表中添加 `json`，然后重启服务
- 如果你收到连接错误，容器可能没有运行：`docker ps | grep searxng`

### `web_extract` 显示 "search-only backend"

SearXNG 无法提取 URL 内容。请将 `web.extract_backend` 设置为支持内容提取的提供商：

```yaml
web:
  search_backend: "searxng"
  extract_backend: "firecrawl"  # 或 tavily / exa / parallel
```

### SearXNG 返回 0 个结果

一些公共实例禁用了某些搜索引擎或类别。尝试：
- 换一个查询词
- 从 [searx.space](https://searx.space/) 换一个不同的公共实例
- 自己托管实例以获得可靠结果

### 在公共实例上遇到速率限制

切换到自托管实例（参见上面的[选项 A](#option-a--self-host-with-docker-recommended)）。使用 Docker，你自己的实例没有速率限制。

### `web_extract` 返回截断的内容，并带有“摘要超时”提示

辅助模型未在配置的超时时间内完成摘要。可以：

- 在 `config.yaml` 中提高 `auxiliary.web_extract.timeout`（新安装默认 360 秒，如果键缺失则为 30 秒）
- 将 `web_extract` 的辅助任务切换到更快的模型（例如 `google/gemini-3-flash-preview`）——参见 [`web_extract` 如何处理长页面](#how-web_extract-handles-long-pages)
- 对于摘要不适用的页面，请改用 `browser_navigate`

---

## 可选技能：`searxng-search`

对于需要通过 `curl` 直接使用 SearXNG 的智能体（例如，当网页工具集不可用时作为回退），请安装 `searxng-search` 可选技能：

```bash
hermes skills install official/research/searxng-search
```

这会添加一个技能，教智能体如何：
- 通过 `curl` 或 Python 调用 SearXNG JSON API
- 按类别（`general`, `news`, `science` 等）过滤
- 处理分页和错误情况
- 当 SearXNG 不可达时优雅地回退