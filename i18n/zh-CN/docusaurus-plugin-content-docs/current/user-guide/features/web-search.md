---
title: 网页搜索与提取
description: 使用多个后端提供商搜索网页、提取页面内容和爬取网站 — 包括免费的自托管 SearXNG。
sidebar_label: 网页搜索
sidebar_position: 6
---

# 网页搜索与提取

Hermes 智能体包含两个由模型调用的网络工具，由多个提供商支持：

- **`web_search`** — 搜索网络并返回排名结果
- **`web_extract`** — 从一个或多个 URL 获取并提取可读内容（当后端支持时，内置深度爬取功能）

两者都通过统一的后端选择进行配置。提供商可通过 `hermes tools` 选择，或直接在 `config.yaml` 中设置。递归爬取能力（Firecrawl/Tavily）通过 `web_extract` 而非单独的 `web_crawl` 工具来暴露。

## 后端

| 提供商 | 环境变量 | 搜索 | 提取 | 爬取 | 免费额度 |
|----------|---------|--------|---------|-------|-----------|
| **Firecrawl** (默认) | `FIRECRAWL_API_KEY` | ✔ | ✔ | ✔ | 500 积分/月 |
| **SearXNG** | `SEARXNG_URL` | ✔ | — | — | ✔ 免费 (自托管) |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ | ✔ | 1000 次搜索/月 |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ | — | 1000 次搜索/月 |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ | — | 付费 |

**按功能拆分：** 你可以独立使用不同的提供商进行搜索和提取 — 例如，用 SearXNG（免费）进行搜索，用 Firecrawl 进行提取。请参见下方的[按功能配置](#按功能配置)部分。

:::tip Nous 订阅用户
如果你拥有付费的 [Nous 门户](https://portal.nousresearch.com) 订阅，网页搜索和提取可通过 **[工具网关](tool-gateway.md)** 使用，由托管的 Firecrawl 提供 — 无需 API 密钥。运行 `hermes tools` 即可启用。
:::

---

## `web_extract` 如何处理长页面

后端返回原始页面 Markdown，内容可能非常庞大（论坛帖子、文档站、带评论的新闻文章）。为了保持您的上下文窗口可用并降低成本，`web_extract` 在将内容交给智能体前，会通过 **`web_extract` 辅助模型** 处理返回的内容。其行为完全由大小驱动：

| 页面大小（字符数） | 处理方式 |
|------------------|---------|
| 小于 5,000 | 原样返回——无 LLM 调用，完整 Markdown 传递给智能体 |
| 5,000 – 500,000 | 通过 `web_extract` 辅助模型进行单次摘要，输出限制在约 5,000 字符 |
| 500,000 – 2,000,000 | 分块处理：拆分为 100k 字符块，并行摘要每个块，然后合成最终摘要（约 5,000 字符） |
| 超过 2,000,000 | 拒绝处理，并提示使用带聚焦提取指令的 `web_crawl` 或更具体的来源 |

摘要会保留引用、代码块和关键事实的原始格式——它是一个内容压缩器，而非复述器。如果摘要失败或超时，Hermes 会回退到原始内容的前约 5,000 个字符，而非无用的错误。

### 由哪个模型执行摘要？

由 `web_extract` 辅助任务执行。默认情况下（`auxiliary.web_extract.provider: "auto"`），这是您的**主聊天模型**——与 `hermes model` 使用相同的提供商和模型。对于大多数设置来说这没问题，但在昂贵的推理模型（如 Opus、MiniMax M2.7 等）上，每次长页面提取都会增加显著的成本。

要将提取摘要路由到廉价、快速的模型，无论您的主模型是什么：

```yaml
# ~/.hermes/config.yaml
auxiliary:
  web_extract:
    provider: openrouter
    model: google/gemini-3-flash-preview
    timeout: 360       # 秒；如果遇到摘要超时，请调高此值
```

或交互式选择：`hermes model` → **配置辅助模型** → `web_extract`。

请参阅 [辅助模型](/docs/user-guide/configuration#auxiliary-models) 获取完整参考和每任务覆盖模式。

### 当摘要造成干扰时

如果您特别需要原始的、未经摘要的页面内容——例如，您正在抓取一个结构化页面，而 LLM 摘要可能会遗漏重要字段——请改用 `browser_navigate` + `browser_snapshot`。浏览器工具返回实时无障碍树，不会经过辅助模型重写（但在处理巨大页面时，其自身的快照上限为 8,000 字符）。

---

## 设置

### 通过 `hermes tools` 快速设置

运行 `hermes tools`，导航到 **网络搜索与提取**，然后选择一个提供商。向导会提示您输入所需的 URL 或 API 密钥，并将其写入您的配置。

```bash
hermes tools
```

---

### Firecrawl（默认）

功能全面的搜索、提取和爬取。推荐给大多数用户。

```bash
# ~/.hermes/.env
FIRECRAWL_API_KEY=fc-your-key-here
```

在 [firecrawl.dev](https://firecrawl.dev) 获取密钥。免费层包含每月 500 个积分。

**自托管 Firecrawl：** 指向您自己的实例，而非云 API：

```bash
# ~/.hermes/.env
FIRECRAWL_API_URL=http://localhost:3002
```

当设置了 `FIRECRAWL_API_URL` 时，API 密钥是可选的（通过 `USE_DB_AUTHENTICATION=false` 禁用服务器认证）。

---

### SearXNG（免费，自托管）

SearXNG 是一个注重隐私的开源元搜索引擎，聚合了 70 多个搜索引擎的结果。**无需 API 密钥**——只需将 Hermes 指向一个正在运行的 SearXNG 实例。

SearXNG **仅用于搜索**——`web_extract`（包括其爬取模式）需要单独的提取提供商。

#### 选项 A — 使用 Docker 自托管（推荐）

这为您提供一个无速率限制的私有实例。

**1. 创建一个工作目录：**

```bash
mkdir -p ~/searxng/searxng
cd ~/searxng
```

**2. 编写一个 `docker-compose.yml`：**

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
# 之前（默认 — 禁用 JSON）：
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

您应该看到类似 `10 results` 的输出。如果收到 `403 Forbidden`，则 JSON 格式仍被禁用——请重新检查步骤 4。

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

或通过 `hermes tools` → 网络搜索与提取 → SearXNG 进行设置。

---

#### 选项 B — 使用公共实例

公共 SearXNG 实例列表可在 [searx.space](https://searx.space/) 找到。筛选启用了 **JSON 格式** 的实例（表中显示）。

```bash
# ~/.hermes/.env
SEARXNG_URL=https://searx.example.com
```

:::caution 公共实例
公共实例有速率限制、不稳定的运行时间，并且可能随时禁用 JSON 格式。对于生产用途，强烈建议自托管。
:::

---

#### 将 SearXNG 与提取提供商配对

SearXNG 处理搜索；您需要为 `web_extract`（包括任何深度爬取模式）提供单独的提供商。使用按能力划分的键：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "searxng"
  extract_backend: "firecrawl"   # 或 tavily, exa, parallel
```

使用此配置，Hermes 对所有搜索查询使用 SearXNG，对 URL 提取使用 Firecrawl——将免费搜索与高质量提取相结合。

---

### Tavily

AI 优化的搜索、提取和爬取，具有慷慨的免费层。

```bash
# ~/.hermes/.env
TAVILY_API_KEY=tvly-your-key-here
```

在 [app.tavily.com](https://app.tavily.com/home) 获取密钥。免费层包含每月 1,000 次搜索。

---

### Exa

具有语义理解的神经搜索。适合研究和寻找概念相关的内容。

```bash
# ~/.hermes/.env
EXA_API_KEY=your-exa-key-here
```

在 [exa.ai](https://exa.ai) 获取密钥。免费层包含每月 1,000 次搜索。

---

### Parallel

具有深度研究能力的 AI 原生搜索和提取。

```bash
# ~/.hermes/.env
PARALLEL_API_KEY=your-parallel-key-here
```

在 [parallel.ai](https://parallel.ai) 获取访问权限。

---

## 配置

### 单后端

为所有网络功能设置一个提供商：

```yaml
# ~/.hermes/config.yaml
web:
  backend: "searxng"   # firecrawl | searxng | tavily | exa | parallel
```

### 按能力配置

为搜索和提取使用不同的提供商。这使您可以将免费搜索（SearXNG）与付费提取提供商结合使用，反之亦然：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "searxng"     # 用于 web_search
  extract_backend: "firecrawl"  # 用于 web_extract（及其深度爬取模式）
```

当按能力划分的键为空时，两者都会回退到 `web.backend`。当 `web.backend` 也为空时，后端将根据当前存在的 API 密钥/URL 自动检测。

**优先顺序（按能力）：**
1. `web.search_backend` / `web.extract_backend`（明确的按能力划分）
2. `web.backend`（共享回退）
3. 从环境变量自动检测

### 自动检测

如果未显式配置后端，Hermes 将根据已设置的凭据选择第一个可用的后端：

| 存在的凭据 | 自动选择的后端 |
|-----------|--------------|
| `FIRECRAWL_API_KEY` 或 `FIRECRAWL_API_URL` | firecrawl |
| `PARALLEL_API_KEY` | parallel |
| `TAVILY_API_KEY` | tavily |
| `EXA_API_KEY` | exa |
| `SEARXNG_URL` | searxng |

---

## 验证您的设置

运行 `hermes setup` 来查看检测到的网页后端是什么：

```
✅ 网页搜索与提取 (searxng)
```

或通过命令行检查：

```bash
# 激活虚拟环境并直接运行网页工具模块
source ~/.hermes/hermes-agent/.venv/bin/activate
python -m tools.web_tools
```

这将打印活动的后端及其状态：

```
✅ 网页后端: searxng
   正在使用 SearXNG (仅搜索): http://localhost:8888
```

---

## 故障排除

### `web_search` 返回 `{"success": false}`

- 检查 `SEARXNG_URL` 是否可达：`curl -s "http://localhost:8888/search?q=test&format=json"`
- 如果收到 HTTP 403 错误，则 JSON 格式被禁用 — 请在 `settings.yml` 的 `formats` 列表中添加 `json` 并重启
- 如果出现连接错误，容器可能未运行：`docker ps | grep searxng`

### `web_extract` 提示“仅搜索后端”

SearXNG 无法提取 URL 内容。将 `web.extract_backend` 设置为支持提取的提供商：

```yaml
web:
  search_backend: "searxng"
  extract_backend: "firecrawl"  # 或 tavily / exa / parallel
```

### SearXNG 返回 0 个结果

一些公共实例禁用了某些搜索引擎或类别。尝试：
- 使用不同的查询
- 从 [searx.space](https://searx.space/) 使用不同的公共实例
- 自行托管您自己的实例以获得可靠的结果

### 在公共实例上被限速

切换到自行托管的实例（参见上文 [选项 A](#选项-a--使用-docker-自行托管-推荐)）。使用 Docker，您自己的实例没有速率限制。

### `web_extract` 返回截断内容并带有“摘要超时”说明

辅助模型未在配置的超时时间内完成摘要。您可以：

- 在 `config.yaml` 中提高 `auxiliary.web_extract.timeout`（全新安装默认为 360 秒，如果键缺失则为 30 秒）
- 将 `web_extract` 辅助任务切换到更快的模型（例如 `google/gemini-3-flash-preview`）— 参见 [`web_extract` 如何处理长页面](#web_extract-如何处理长页面)
- 对于不适合使用摘要的页面，改用 `browser_navigate`

---

## 可选技能：`searxng-search`

对于需要通过 `curl` 直接使用 SearXNG 的智能体（例如，当网页工具集不可用时作为备选方案），请安装 `searxng-search` 可选技能：

```bash
hermes skills install official/research/searxng-search
```

这将添加一项技能，教会智能体如何：
- 通过 `curl` 或 Python 调用 SearXNG JSON API
- 按类别（`general`、`news`、`science` 等）进行筛选
- 处理分页和错误情况
- 当 SearXNG 不可达时优雅地降级