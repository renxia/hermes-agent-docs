---
title: 网络搜索与提取
description: 使用多个后端提供商搜索网络并提取页面内容 — 包括免费的自托管 SearXNG。
sidebar_label: 网络搜索
sidebar_position: 6
---

# 网络搜索与提取

Hermes 智能体包含两个由多个提供商支持的、可供模型调用的网络工具：

- **`web_search`** — 搜索网络并返回排序后的结果
- **`web_extract`** — 从一个或多个 URL 获取并提取可读内容

两者都通过单一的后端选择进行配置。提供商可通过 `hermes tools` 选择，或直接在 `config.yaml` 中设置。

## 后端

| 提供商 | 环境变量 | 搜索 | 提取 | 免费额度 |
|----------|---------|--------|---------|-----------|
| **Firecrawl** (默认) | `FIRECRAWL_API_KEY` | ✔ | ✔ | 500 积分/月 |
| **SearXNG** | `SEARXNG_URL` | ✔ | — | ✔ 免费 (自托管) |
| **Brave Search (免费版)** | `BRAVE_SEARCH_API_KEY` | ✔ | — | 2,000 次查询/月 |
| **DDGS (DuckDuckGo)** | — (无需密钥) | ✔ | — | ✔ 免费 |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ | 1,000 次搜索/月 |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ | 1,000 次搜索/月 |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ | 付费 |
| **xAI (Grok)** | `XAI_API_KEY` 或 `hermes auth login xai-oauth` | ✔ | — | 付费 (SuperGrok 或按 token 计费) |

Brave Search、DDGS 和 xAI **仅支持搜索** — 当你还需要 `web_extract` 功能时，请将它们中的任何一个与 Firecrawl/Tavily/Exa/Parallel 组合使用。DDGS 底层使用 [`ddgs` Python 包](https://pypi.org/project/ddgs/)；如果尚未安装，请运行 `pip install ddgs`（或让 Hermes 在首次使用时懒安装它）。xAI 在 Responses API 上运行 Grok 的服务器端 `web_search` 工具 — 结果是由 LLM 生成的，而非基于索引，因此标题、描述和 URL 选择都是模型输出（参见下面的 [信任模型注意事项](#xai-grok)）。

**按能力拆分：** 你可以独立地为搜索和提取使用不同的提供商 — 例如，搜索使用 SearXNG（免费），提取使用 Firecrawl。请参阅下方的[按能力配置](#按能力配置)。

:::tip Nous 订阅用户
如果你拥有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，可以通过 **[工具网关](tool-gateway.md)** 使用网络搜索和提取功能，它由托管的 Firecrawl 支持 — 无需 API 密钥。新安装可以运行 `hermes setup --portal` 来登录并一次性启用所有网关工具；现有安装可以通过 `hermes tools` 仅切换网络功能。
:::

---

## `web_extract` 如何处理长页面

后端返回原始页面 markdown，内容可能非常庞大（论坛帖子、文档网站、包含嵌入式评论的新闻文章）。为了保持您的上下文窗口可用并降低成本，`web_extract` 会将返回的内容通过 **`web_extract` 辅助模型** 处理后再交给智能体。行为完全由页面大小驱动：

| 页面大小（字符） | 处理方式 |
|------------------------|--------------|
| 小于 5,000 | 原样返回 — 不调用 LLM，完整 markdown 传递给智能体 |
| 5,000 – 500,000 | 通过 `web_extract` 辅助模型进行单次摘要，输出上限约 5,000 字符 |
| 500,000 – 2,000,000 | 分块处理：拆分为 100k 字符的块，并行摘要每个块，然后合成最终摘要（约 5,000 字符） |
| 超过 2,000,000 | 拒绝处理，并提示使用更精确的源 URL |

摘要会保留引号、代码块和关键事实的原始格式 — 它是一个内容压缩器，而非改写器。如果摘要生成失败或超时，Hermes 会回退到原始内容的前 ~5,000 个字符，而不是返回无用的错误。

### 由哪个模型执行摘要？

`web_extract` 辅助任务。默认情况下（`auxiliary.web_extract.provider: "auto"`），这是您的**主聊天模型** — 与 `hermes model` 使用的提供者、模型相同。这对于大多数设置来说没问题，但在昂贵的推理模型（如 Opus、MiniMax M2.7 等）上，每次长页面提取都会增加显著的成本。

要将提取摘要路由到便宜、快速的模型，而不受主模型影响：

```yaml
# ~/.hermes/config.yaml
auxiliary:
  web_extract:
    provider: openrouter
    model: google/gemini-3-flash-preview
    timeout: 360       # 秒；如果遇到摘要超时，请调高此值
```

或进行交互式选择：`hermes model` → **配置辅助模型** → `web_extract`。

参见[辅助模型](/user-guide/configuration#auxiliary-models)获取完整参考和按任务覆盖的模式。

### 当摘要造成阻碍时

如果您特别需要原始、未经摘要的页面内容 — 例如，您正在抓取一个结构化的页面，而 LLM 摘要可能会丢弃重要字段 — 请改用 `browser_navigate` + `browser_snapshot`。浏览器工具返回实时的可访问性树，没有辅助模型的改写（但受其自身对巨大页面 8,000 字符快照上限的限制）。

---

## 设置

### 通过 `hermes tools` 快速设置

运行 `hermes tools`，导航到 **Web 搜索与提取**，然后选择一个提供者。向导会提示所需的 URL 或 API 密钥，并将其写入您的配置。

```bash
hermes tools
```

---

### Firecrawl（默认）

功能齐全的搜索和提取。推荐大多数用户使用。

```bash
# ~/.hermes/.env
FIRECRAWL_API_KEY=fc-your-key-here
```

在 [firecrawl.dev](https://firecrawl.dev) 获取密钥。免费套餐包含每月 500 个积分。

**自托管 Firecrawl：** 将其指向您自己的实例，而非云端 API：

```bash
# ~/.hermes/.env
FIRECRAWL_API_URL=http://localhost:3002
```

当设置了 `FIRECRAWL_API_URL` 时，API 密钥是可选的（通过 `USE_DB_AUTHENTICATION=false` 禁用服务器认证）。

---

### SearXNG（免费，自托管）

SearXNG 是一个尊重隐私的开源元搜索引擎，聚合了 70 多个搜索引擎的结果。**无需 API 密钥** — 只需将 Hermes 指向一个运行中的 SearXNG 实例。

SearXNG **仅用于搜索** — `web_extract` 需要单独的提取提供者。

#### 选项 A — 使用 Docker 自托管（推荐）

这将为您提供一个没有速率限制的私有实例。

**1. 创建一个工作目录：**

```bash
mkdir -p ~/searxng/searxng
cd ~/searxng
```

**2. 写入一个 `docker-compose.yml` 文件：**

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

打开 `~/searxng/searxng/settings.yml` 文件，找到 `formats` 块（大约在第 84 行）：

```yaml
# 之前（默认 — JSON 禁用）：
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

**6. 验证是否工作：**

```bash
curl -s "http://localhost:8888/search?q=test&format=json" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"results\"])} results')"
```

您应该会看到类似 `10 results` 的输出。如果您收到 `403 Forbidden` 错误，说明 JSON 格式仍然被禁用 — 请重新检查第 4 步。

**7. 配置 Hermes：**

```bash
# ~/.hermes/.env
SEARXNG_URL=http://localhost:8888
```

然后在 `~/.hermes/config.yaml` 中选择 SearXNG 作为搜索后端：

```yaml
web:
  search_backend: "searxng"
```

或通过 `hermes tools` → Web 搜索与提取 → SearXNG 进行设置。

---

#### 选项 B — 使用公共实例

公共 SearXNG 实例列表可在 [searx.space](https://searx.space/) 找到。筛选那些**启用了 JSON 格式**的实例（在表格中显示）。

```bash
# ~/.hermes/.env
SEARXNG_URL=https://searx.example.com
```

:::caution 公共实例
公共实例有速率限制，正常运行时间不稳定，并且可能随时禁用 JSON 格式。对于生产用途，强烈建议自托管。
:::

---

#### 将 SearXNG 与提取提供者配对

SearXNG 处理搜索；您需要为 `web_extract` 提供单独的提供者。使用按功能划分的密钥：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "searxng"
  extract_backend: "firecrawl"   # 或 tavily, exa, parallel
```

通过此配置，Hermes 对所有搜索查询使用 SearXNG，对 URL 提取使用 Firecrawl — 结合了免费搜索和高质量提取。

---

### Tavily

AI 优化的搜索和提取，拥有慷慨的免费套餐。

```bash
# ~/.hermes/.env
TAVILY_API_KEY=tvly-your-key-here
```

在 [app.tavily.com](https://app.tavily.com/home) 获取密钥。免费套餐包含每月 1,000 次搜索。

---

### Exa

具有语义理解能力的神经搜索。适用于研究和查找概念相关内容。

```bash
# ~/.hermes/.env
EXA_API_KEY=your-exa-key-here
```

在 [exa.ai](https://exa.ai) 获取密钥。免费套餐包含每月 1,000 次搜索。

---

### Parallel

AI 原生搜索和提取，具备深度研究能力。

```bash
# ~/.hermes/.env
PARALLEL_API_KEY=your-parallel-key-here
```

在 [parallel.ai](https://parallel.ai) 获取访问权限。

---

### xAI (Grok) {#xai-grok}

通过 Grok 服务器端的 [web_search 工具](https://docs.x.ai/developers/tools/web-search) 在 Responses API 上路由 `web_search`。Grok 执行实际搜索，并将顶部结果作为结构化 JSON 返回。

适用于两种凭据路径 — 无需新的环境变量，无需新的设置向导：

```bash
# ~/.hermes/.env （环境变量路径）
XAI_API_KEY=sk-xai-your-key-here
```

或适用于 SuperGrok 订阅用户：

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
    model: grok-4.3              # web_search 所需的推理模型（默认）
    allowed_domains:             # 可选，最多 5 个 — 与 excluded_domains 互斥
      - arxiv.org
    excluded_domains:            # 可选，最多 5 个
      - example-spam.com
    timeout: 90                  # 秒（默认）
```

**仅用于搜索** — 如果您还需要 `web_extract`，请与 Firecrawl / Tavily / Exa / Parallel 配对。遇到 401 错误时，提供者会执行一次强制 OAuth 令牌刷新并重试（覆盖窗口期内的撤销和主动过期检查无法解码的不透明令牌）；环境变量凭据会跳过重试。

:::caution 信任模型
与返回原始搜索引擎结果的基于索引的提供者（如 Brave、Tavily、Exa）不同，xAI 是一个 LLM，它选择显示哪些 URL 并自行编写标题和描述。查询的*内容*会影响输出，因此精心构造的恶意查询（例如，通过智能体获取的不可信上游输入注入）原则上可以引导 Grok 输出攻击者选择的 URL。像对待任何模型生成的链接一样对待返回的 URL — 在获取前进行验证，特别是如果查询来自不可信输入。
:::

---

## 配置

### 单后端

为所有网络功能设置一个供应商：

```yaml
# ~/.hermes/config.yaml
web:
  backend: "searxng"   # firecrawl | searxng | brave-free | ddgs | tavily | exa | parallel | xai
```

### 按功能配置

为搜索和内容提取使用不同的供应商。这允许您组合免费搜索（SearXNG）与付费内容提取供应商，反之亦然：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "searxng"     # 供 web_search 使用
  extract_backend: "firecrawl"  # 供 web_extract 使用
```

当按功能的键为空时，两者都会回退到 `web.backend`。当 `web.backend` 也为空时，后端会根据当前存在的 API 密钥/URL 进行自动检测。

**优先顺序（按功能）：**
1. `web.search_backend` / `web.extract_backend` (明确指定的功能)
2. `web.backend` (共享回退)
3. 从环境变量自动检测

### 自动检测

如果未明确配置后端，Hermes 会根据设置了哪些凭据，按顺序选择第一个可用的：

| 存在的凭据 | 自动选择的后端 |
|--------------------|-----------------------|
| `FIRECRAWL_API_KEY` 或 `FIRECRAWL_API_URL` | firecrawl |
| `PARALLEL_API_KEY` | parallel |
| `TAVILY_API_KEY` | tavily |
| `EXA_API_KEY` | exa |
| `SEARXNG_URL` | searxng |

xAI 网页搜索**不在**自动检测链中——设置了 `XAI_API_KEY`（或通过 xAI Grok OAuth 登录）并不会自动将网络流量路由到 xAI，因为这些凭据也用于推理 / TTS / 图像生成，用户可能希望网络功能使用其他后端。请通过 `web.backend: "xai"` 显式启用。

---

## 验证您的设置

运行 `hermes setup` 查看检测到了哪个网络后端：

```
✅ 网络搜索与内容提取 (searxng)
```

或通过命令行界面检查：

```bash
# 激活虚拟环境并直接运行网络工具模块
source ~/.hermes/hermes-agent/.venv/bin/activate
python -m tools.web_tools
```

这将打印活动的后端及其状态：

```
✅ 网络后端: searxng
   使用 SearXNG (仅搜索): http://localhost:8888
```

---

## 故障排除

### `web_search` 返回 `{"success": false}`

- 检查 `SEARXNG_URL` 是否可达：`curl -s "http://localhost:8888/search?q=test&format=json"`
- 如果收到 HTTP 403 错误，说明 JSON 格式被禁用——在 `settings.yml` 的 `formats` 列表中添加 `json` 并重启
- 如果收到连接错误，容器可能未运行：`docker ps | grep searxng`

### `web_extract` 显示 "search-only backend"

SearXNG 无法提取 URL 内容。将 `web.extract_backend` 设置为支持内容提取的供应商：

```yaml
web:
  search_backend: "searxng"
  extract_backend: "firecrawl"  # 或 tavily / exa / parallel
```

### SearXNG 返回 0 条结果

一些公共实例禁用了某些搜索引擎或类别。尝试：
- 不同的查询词
- 从 [searx.space](https://searx.space/) 选择另一个公共实例
- 自托管您自己的实例以获得可靠的结果

### 在公共实例上被限速

切换到自托管实例（参见上面的[选项 A](#option-a--使用-docker-自托管-推荐)）。使用 Docker，您自己的实例没有速率限制。

### `web_extract` 返回截断内容并附带 "summarization timed out" 说明

辅助模型未在配置的超时时间内完成摘要。可以：
- 在 `config.yaml` 中增加 `auxiliary.web_extract.timeout`（新安装默认为 360 秒，如果缺少该键则为 30 秒）
- 将 `web_extract` 辅助任务切换到更快的模型（例如 `google/gemini-3-flash-preview`）——参见 [`web_extract` 如何处理长页面](#how-web_extract-handles-long-pages)
- 对于不适合使用摘要的页面，改用 `browser_navigate`

---

## 可选技能：`searxng-search`

对于需要直接通过 `curl` 使用 SearXNG 的智能体（例如当网络工具集不可用时作为备选方案），请安装 `searxng-search` 可选技能：

```bash
hermes skills install official/research/searxng-search
```

这将添加一项技能，教会智能体如何：
- 通过 `curl` 或 Python 调用 SearXNG JSON API
- 按类别过滤（`general`、`news`、`science` 等）
- 处理分页和错误情况
- 当 SearXNG 不可达时优雅地回退