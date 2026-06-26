---
title: Web Search & Extract
description: 使用多个后端提供商搜索网页并提取页面内容——包括免费自托管的 SearXNG。
sidebar_label: Web Search
sidebar_position: 6
---

# Web Search & Extract

Hermes 智能体包含两个可供模型调用的网页工具，由多个提供商提供支持：

- **`web_search`** — 搜索网页并返回排名结果
- **`web_extract`** — 从一个或多个 URL 抓取并提取可读内容

两者均通过单一后端选择进行配置。提供商可通过 `hermes tools` 选择，或直接设置在 `config.yaml` 中。

## Backends

| 提供商 | 环境变量 | 搜索 | 提取 | 免费额度 |
|----------|---------|--------|---------|-----------|
| **Firecrawl**（默认） | `FIRECRAWL_API_KEY` | ✔ | ✔ | 每月 500 积分 |
| **SearXNG** | `SEARXNG_URL` | ✔ | — | ✔ 免费（自托管） |
| **Brave Search（免费层）** | `BRAVE_SEARCH_API_KEY` | ✔ | — | 每月 2,000 次查询 |
| **DDGS（DuckDuckGo）** | —（无需密钥） | ✔ | — | ✔ 免费 |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ | 每月 1,000 次搜索 |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ | 每月 1,000 次搜索 |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ | 付费 |
| **xAI（Grok）** | `XAI_API_KEY` 或 `hermes auth login xai-oauth` | ✔ | — | 付费（SuperGrok 或按 token 计费） |

Brave Search、DDGS 和 xAI 仅支持**搜索**——当你同时需要 `web_extract` 时，可将它们与 Firecrawl/Tavily/Exa/Parallel 中的任意一个搭配使用。DDGS 底层使用 [`ddgs` Python 包](https://pypi.org/project/ddgs/)；如果尚未安装，请运行 `pip install ddgs`（或让 Hermes 在首次使用时懒加载安装）。xAI 在 Responses API 上运行 Grok 的服务端 `web_search` 工具——结果是 LLM 生成的而非基于索引的，因此标题、描述和 URL 选择均为模型输出（参见下文 [信任模型注意事项](#xai-grok)）。

**按能力拆分：** 你可以为搜索和提取分别使用不同的提供商——例如 SearXNG（免费）用于搜索，Firecrawl 用于提取。参见下文[按能力配置](#per-capability-configuration)。

:::tip Nous 订阅用户
如果你有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，网页搜索和提取可通过 **[Tool Gateway](tool-gateway.md)** 由托管的 Firecrawl 提供——无需 API 密钥。新安装可以运行 `hermes setup --portal` 登录并一次性开启所有网关工具；现有安装可以通过 `hermes tools` 仅切换网页相关功能。
:::

---

## `web_extract` 如何处理长页面

后端返回原始页面 Markdown，内容可能非常大（论坛帖子、文档网站、含嵌入评论的新闻文章）。为了保持上下文窗口可用并控制成本，`web_extract` 在将返回内容交给智能体之前，会通过 **`web_extract` 辅助模型**进行处理。行为完全由页面大小驱动：

| 页面大小（字符数） | 处理方式 |
|--------------------|----------|
| 5 000 以下 | 原样返回——无需 LLM 调用，完整 Markdown 直接到达智能体 |
| 5 000 – 500 000 | 通过 `web_extract` 辅助模型进行单轮摘要，输出上限约 5 000 字符 |
| 500 000 – 2 000 000 | 分块处理：拆分为 10 万字符的块，并行摘要每个块，然后综合生成最终摘要（约 5 000 字符） |
| 2 000 000 以上 | 拒绝处理，提示使用更精确的源 URL |

摘要保留引用、代码块和关键事实的原始格式——它是一个内容压缩器，而非释义器。如果摘要失败或超时，Hermes 会回退到原始内容的前约 5 000 字符，而非返回无用的错误。

### 摘要使用哪个模型？

`web_extract` 辅助任务。默认情况下（`auxiliary.web_extract.provider: "auto"`），使用的是你的**主聊天模型**——与 `hermes model` 相同的提供商和模型。对大多数设置来说这没问题，但在昂贵的推理模型（Opus、MiniMax M2.7 等）上，每次长页面提取都会增加可观的成本。

要将提取摘要路由到廉价、快速的模型，而不论你的主模型是什么：

```yaml
# ~/.hermes/config.yaml
auxiliary:
  web_extract:
    provider: openrouter
    model: google/gemini-3-flash-preview
    timeout: 360       # 秒；如果遇到摘要超时，请增大此值
```

或通过交互方式选择：`hermes model` → **配置辅助模型** → `web_extract`。

完整参考和按任务覆盖模式见[辅助模型](/user-guide/configuration#auxiliary-models)。

### 何时摘要会成为障碍

如果你特别需要原始的、未摘要的页面内容——例如，你正在抓取结构化页面，而 LLM 摘要会丢失重要字段——请改用 `browser_navigate` + `browser_snapshot`。浏览器工具返回实时辅助功能树，无需辅助模型重写（在超大页面受限于自身的 8 000 字符快照上限）。

---

## 设置

### 通过 `hermes tools` 快速设置

运行 `hermes tools**，导航到 **Web Search & Extract**，然后选择一个提供商。向导会提示你输入所需的 URL 或 API 密钥，并将其写入你的配置。

```bash
hermes tools
```

---

### Firecrawl（默认）

功能完整的搜索和提取。推荐给大多数用户使用。

```bash
# ~/.hermes/.env
FIRECRAWL_API_KEY=fc-your-key-here
```

在 [firecrawl.dev](https://firecrawl.dev) 获取密钥。免费套餐每月包含 500 积分。

**自托管 Firecrawl：** 指向你自己的实例而非云 API：

```bash
# ~/.hermes/.env
FIRECRAWL_API_URL=http://localhost:3002
```

设置 `FIRECRAWL_API_URL` 后，API 密钥为可选（使用 `USE_DB_AUTHENTICATION=false` 禁用服务器认证）。

---

### SearXNG（免费、自托管）

SearXNG 是一个尊重隐私的开源元搜索引擎，聚合来自 70 多个搜索引擎的结果。**无需 API 密钥**——只需将 Hermes 指向运行中的 SearXNG 实例。

SearXNG **仅支持搜索**——`web_extract` 需要单独的提取提供商。

#### 方案 A——使用 Docker 自托管（推荐）

这样你可以获得一个无速率限制的私有实例。

**1. 创建工作目录：**

```bash
mkdir -p ~/searxng/searxng
cd ~/searxng
```

**2. 编写 `docker-compose.yml`：**

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

打开 `~/searxng/searxng/settings.yml` 并找到 `formats` 块（大约第 84 行）：

```yaml
# 之前（默认——JSON 已禁用）：
formats:
  - html

# 之后（为 Hermes 启用 JSON）：
formats:
  - html
  - json
```

**5. 重启以应用：**

```bash
docker cp ~/searxng/searxng/settings.yml searxng:/etc/searxng/settings.yml
docker restart searxng
```

**6. 验证是否正常工作：**

```bash
curl -s "http://localhost:8888/search?q=test&format=json" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"results\"])} results')"
```

你应该看到类似 `10 results` 的输出。如果收到 `403 Forbidden`，说明 JSON 格式仍未启用——请重新检查步骤 4。

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

或通过 `hermes tools` → Web Search & Extract → SearXNG 设置。

---

### 方案 B——使用公共实例

公共 SearXNG 实例列在 [searx.space](https://searx.space/)。筛选已**启用 JSON 格式**的实例（在表格中显示）。

```bash
# ~/.hermes/.env
SEARXNG_URL=https://searx.example.com
```

:::caution 公共实例
公共实例有速率限制，运行时间不稳定，且可能随时禁用 JSON 格式。生产环境强烈建议自托管。
:::

---

### 将 SearXNG 与提取提供商配对

SearXNG 处理搜索；你需要一个单独的提供商来处理 `web_extract`。使用按功能划分的键：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "searxng"
  extract_backend: "firecrawl"   # 或 tavily, exa, parallel
```

使用此配置，Hermes 对所有搜索查询使用 SearXNG，对 URL 提取使用 Firecrawl——将免费搜索与高质量提取相结合。

---

### Tavily

AI 优化的搜索和提取，提供充裕的免费套餐。

```bash
# ~/.hermes/.env
TAVILY_API_KEY=tvly-your-key-here
```

在 [app.tavily.com](https://app.tavily.com/home) 获取密钥。免费套餐每月包含 1 000 次搜索。

---

### Exa

具有语义理解能力的神经搜索。适合研究和查找概念相关内容。

```bash
# ~/.hermes/.env
EXA_API_KEY=your-exa-key-here
```

在 [exa.ai](https://exa.ai) 获取密钥。免费套餐每月包含 1 000 次搜索。

---

### Parallel

具有深度研究能力的 AI 原生搜索和提取。

```bash
# ~/.hermes/.env
PARALLEL_API_KEY=your-parallel-key-here
```

在 [parallel.ai](https://parallel.ai) 获取访问权限。

---

### xAI (Grok) {#xai-grok}

通过 Grok 服务端的 [web_search 工具](https://docs.x.ai/developers/tools/web-search) 在 Responses API 上路由 `web_search`。Grok 执行实际搜索并以结构化 JSON 返回顶部结果。

支持任一凭证路径——无需新的环境变量，无需新的设置向导：

```bash
# ~/.hermes/.env（环境变量路径）
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

**可选调节项：**

```yaml
web:
  backend: "xai"
  xai:
    model: grok-build-0.1        # web_search 所需的推理模型（默认）
    allowed_domains:             # 可选，最多 5 个——与 excluded_domains 互斥
      - arxiv.org
    excluded_domains:            # 可选，最多 5 个
      - example-spam.com
    timeout: 90                  # 秒（默认）
```

**仅支持搜索**——如果你还需要 `web_extract`，请与 Firecrawl / Tavily / Exa / Parallel 配对。遇到 401 时，提供商执行一次强制 OAuth 令牌刷新并重试（覆盖中途撤销和主动过期检查无法解析的不透明令牌）；环境变量凭证跳过重试。

:::caution 信任模型
与基于索引的提供商（Brave、Tavily、Exa）返回逐字搜索引擎结果不同，xAI 是一个 LLM 自行选择要展示哪些 URL 并撰写标题和描述。查询的*内容*会影响输出，因此恶意构造的查询（例如通过智能体获取的不可信上游输入注入）在原则上可能引导 Grok 发出攻击者选择的 URL。对待返回的 URL 应像对待任何模型生成的链接一样——在获取前进行验证，尤其是当查询来自不可信输入时。
:::

---

## 配置

### 单一后端

为所有 Web 功能设置一个提供商：

```yaml
# ~/.hermes/config.yaml
web:
  backend: "searxng"   # firecrawl | searxng | brave-free | ddgs | tavily | exa | parallel | xai
```

### 按功能配置

对搜索和提取使用不同的提供商。这样可以将免费搜索（SearXNG）与付费提取提供商组合，或反之：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "searxng"     # 由 web_search 使用
  extract_backend: "firecrawl"  # 由 web_extract 使用
```

当按功能划分的键为空时，两者都会回退到 `web.backend`。当 `web.backend` 也为空时，后端根据存在的 API 密钥/URL 自动检测。

**优先级顺序（按功能）：**
1. `web.search_backend` / `web.extract_backend`（显式按功能指定）
2. `web.backend`（共享回退）
3. 从环境变量自动检测

### 自动检测

如果没有显式配置后端，Hermes 根据设置的凭证选择第一个可用的：

| 存在的凭证 | 自动选择的后端 |
|------------|----------------|
| `FIRECRAWL_API_KEY` 或 `FIRECRAWL_API_URL` | firecrawl |
| `PARALLEL_API_KEY` | parallel |
| `TAVILY_API_KEY` | tavily |
| `EXA_API_KEY` | exa |
| `SEARXNG_URL` | searxng |

xAI Web Search **不在**自动检测链中——设置了 `XAI_API_KEY`（或通过 xAI Grok OAuth 登录）不会自动将 Web 流量路由到 xAI，因为这些凭证也用于推理 / TTS / 图片生成，用户可能希望 Web 使用不同的后端。需通过 `web.backend: "xai"` 显式选择加入。

---

## 验证你的设置

运行 `hermes setup` 来检测识别到的 Web 后端：

```
✅ Web Search & Extract (searxng)
```

或者通过 CLI 检查：

```bash
# 激活 venv 并直接运行 web tools 模块
source ~/.hermes/hermes-agent/.venv/bin/activate
python -m tools.web_tools
```

这将打印出活跃的后端及其状态：

```
✅ Web backend: searxng
   Using SearXNG (search only): http://localhost:8888
```

---

## 故障排除

### `web_search` 返回 `{"success": false}`

- 检查 `SEARXNG_URL` 是否可达：`curl -s "http://localhost:8888/search?q=test&format=json"`
- 如果收到 HTTP 403，说明 JSON 格式已禁用 — 在 `settings.yml` 的 `formats` 列表中添加 `json` 并重启
- 如果收到连接错误，容器可能未运行：`docker ps | grep searxng`

### `web_extract` 提示 "search-only backend"

SearXNG 无法提取 URL 内容。将 `web.extract_backend` 设置为支持提取的提供商：

```yaml
web:
  search_backend: "searxng"
  extract_backend: "firecrawl"  # 或 tavily / exa / parallel
```

### SearXNG 返回 0 个结果

某些公共实例禁用了特定的搜索引擎或类别。请尝试：
- 使用不同的查询
- 从 [searx.space](https://searx.space/) 更换为其他公共实例
- 自行托管你自己的实例以获得可靠的结果

### 在公共实例上触发速率限制

切换到自托管实例（参见上方[选项 A](#option-a--self-host-with-docker-recommended)）。使用 Docker 时，你自己的实例没有速率限制。

### `web_extract` 返回截断内容并附带 "summarization timed out" 提示

辅助模型未在配置的超时时间内完成摘要。可以选择：

- 在 `config.yaml` 中提高 `auxiliary.web_extract.timeout` 的值（全新安装默认为 360s，如果缺少该键则为 30s）
- 将 `web_extract` 辅助任务切换到更快的模型（例如 `google/gemini-3-flash-preview`）— 参见 [web_extract 如何处理长页面](#how-web_extract-handles-long-pages)
- 对于摘要不适用的页面，改用 `browser_navigate`

---

## 可选技能：`searxng-search`

对于需要通过 `curl` 直接使用 SearXNG 的智能体（例如，在 web 工具集不可用时作为备用方案），安装 `searxng-search` 可选技能：

```bash
hermes skills install official/research/searxng-search
```

这会增加一项技能，教会智能体如何：
- 通过 `curl` 或 Python 调用 SearXNG JSON API
- 按类别过滤（`general`、`news`、`science` 等）
- 处理分页和错误情况
- 在 SearXNG 不可达时优雅降级