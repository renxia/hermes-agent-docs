---
title: 网络搜索与提取
description: 使用多个后端提供商搜索网络、提取网页内容并爬取网站——包括免费的自主部署 SearXNG。
sidebar_label: 网络搜索
sidebar_position: 6
---

# 网络搜索与提取

Hermes 智能体包含三个由多个提供商支持的网络工具：

- **`web_search`** — 搜索网络并返回排序结果
- **`web_extract`** — 获取并从一个或多个 URL 中提取可读内容
- **`web_crawl`** — 递归爬取网站并返回结构化内容

这三个工具均通过单一后端选择进行配置。提供商可通过 `hermes tools` 选择，或直接设置在 `config.yaml` 中。

## 后端

| 提供商 | 环境变量 | 搜索 | 提取 | 爬取 | 免费额度 |
|--------|---------|------|------|------|----------|
| **Firecrawl**（默认） | `FIRECRAWL_API_KEY` | ✔ | ✔ | ✔ | 每月 500 积分 |
| **SearXNG** | `SEARXNG_URL` | ✔ | — | — | ✔ 免费（自主部署） |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ | ✔ | 每月 1,000 次搜索 |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ | — | 每月 1,000 次搜索 |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ | — | 付费 |

**按功能拆分：** 您可以分别为搜索和提取使用不同的提供商——例如使用 SearXNG（免费）进行搜索，使用 Firecrawl 进行提取。请参阅下方的 [按功能配置](#per-capability-configuration)。

:::tip Nous 订阅用户
如果您拥有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，则可通过 **[工具网关](tool-gateway.md)** 使用托管的 Firecrawl 进行网络搜索和提取——无需 API 密钥。运行 `hermes tools` 即可启用。
:::

---

## 设置

### 通过 `hermes tools` 快速设置

运行 `hermes tools`，导航至 **网络搜索与提取**，然后选择一个提供商。向导将提示您输入所需的 URL 或 API 密钥，并将其写入您的配置。

```bash
hermes tools
```

---

### Firecrawl（默认）

功能完整的搜索、提取和爬取。推荐给大多数用户。

```bash
# ~/.hermes/.env
FIRECRAWL_API_KEY=fc-your-key-here
```

在 [firecrawl.dev](https://firecrawl.dev) 获取密钥。免费额度包括每月 500 积分。

**自主部署 Firecrawl：** 指向您自己的实例而非云 API：

```bash
# ~/.hermes/.env
FIRECRAWL_API_URL=http://localhost:3002
```

当设置了 `FIRECRAWL_API_URL` 时，API 密钥为可选（可通过 `USE_DB_AUTHENTICATION=false` 禁用服务器认证）。

---

### SearXNG（免费，自主部署）

SearXNG 是一个尊重隐私、开源的元搜索引擎，聚合来自 70 多个搜索引擎的结果。**无需 API 密钥**——只需将 Hermes 指向一个正在运行的 SearXNG 实例。

SearXNG **仅支持搜索**——`web_extract` 和 `web_crawl` 需要单独的提取提供商。

#### 选项 A —— 使用 Docker 自主部署（推荐）

这将为您提供一个无速率限制的私有实例。

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

SearXNG 默认禁用 JSON 输出。复制生成的配置文件并启用它：

```bash
# 将自动生成的配置文件从容器中复制出来
docker cp searxng:/etc/searxng/settings.yml ~/searxng/searxng/settings.yml
```

打开 `~/searxng/searxng/settings.yml` 并找到 `formats` 块（约第 84 行）：

```yaml
# 之前（默认 — JSON 已禁用）：
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

您应看到类似 `10 results` 的输出。如果收到 `403 Forbidden`，说明 JSON 格式仍处于禁用状态——请重新检查第 4 步。

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

或通过 `hermes tools` → 网络搜索与提取 → SearXNG 设置。

---

#### 选项 B —— 使用公共实例

公共 SearXNG 实例列在 [searx.space](https://searx.space/)。请筛选出**已启用 JSON 格式**的实例（表格中会显示）。

```bash
# ~/.hermes/.env
SEARXNG_URL=https://searx.example.com
```

:::caution 公共实例
公共实例存在速率限制、运行时间不稳定，并可能随时禁用 JSON 格式。生产环境使用强烈建议自主部署。
:::

---

#### 将 SearXNG 与提取提供商配对

SearXNG 负责搜索；您需要单独的提供商来处理 `web_extract` 和 `web_crawl`。请使用按功能拆分的键：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "searxng"
  extract_backend: "firecrawl"   # 或 tavily、exa、parallel
```

使用此配置，Hermes 将使用 SearXNG 处理所有搜索查询，并使用 Firecrawl 进行 URL 提取——将免费搜索与高质量提取相结合。

---

### Tavily

针对 AI 优化的搜索、提取和爬取，提供慷慨的免费额度。

```bash
# ~/.hermes/.env
TAVILY_API_KEY=tvly-your-key-here
```

在 [app.tavily.com](https://app.tavily.com/home) 获取密钥。免费额度包括每月 1,000 次搜索。

---

### Exa

具有语义理解的神经搜索。适用于研究和查找概念相关的内容。

```bash
# ~/.hermes/.env
EXA_API_KEY=your-exa-key-here
```

在 [exa.ai](https://exa.ai) 获取密钥。免费额度包括每月 1,000 次搜索。

---

### Parallel

原生 AI 搜索与提取，具备深度研究能力。

```bash
# ~/.hermes/.env
PARALLEL_API_KEY=your-parallel-key-here
```

在 [parallel.ai](https://parallel.ai) 获取访问权限。

---

## 配置

### 单一后端

为所有网络功能设置一个提供商：

```yaml
# ~/.hermes/config.yaml
web:
  backend: "searxng"   # firecrawl | searxng | tavily | exa | parallel
```

### 按功能配置

为搜索和提取使用不同的提供商。这使您可以将免费搜索（SearXNG）与付费提取提供商结合使用，反之亦然：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "searxng"     # 用于 web_search
  extract_backend: "firecrawl"  # 用于 web_extract 和 web_crawl
```

当按功能拆分的键为空时，两者都会回退到 `web.backend`。当 `web.backend` 也为空时，后端将根据存在的 API 密钥/URL 自动检测。

**优先级顺序（按功能）：**
1. `web.search_backend` / `web.extract_backend`（显式按功能）
2. `web.backend`（共享回退）
3. 根据环境变量自动检测

### 自动检测

如果未显式配置后端，Hermes 将根据设置的凭据选择第一个可用的后端：

| 存在的凭据 | 自动选择的后端 |
|------------|----------------|
| `FIRECRAWL_API_KEY` 或 `FIRECRAWL_API_URL` | firecrawl |
| `PARALLEL_API_KEY` | parallel |
| `TAVILY_API_KEY` | tavily |
| `EXA_API_KEY` | exa |
| `SEARXNG_URL` | searxng |

---

## 验证您的设置

运行 `hermes setup` 查看检测到哪个网络后端：

```
✅ 网络搜索与提取 (searxng)
```

或通过 CLI 检查：

```bash
# 激活虚拟环境并直接运行网络工具模块
source ~/.hermes/hermes-agent/.venv/bin/activate
python -m tools.web_tools
```

这将打印当前活动的后端及其状态：

```
✅ 网络后端: searxng
   使用 SearXNG（仅搜索）: http://localhost:8888
```

---

## 故障排除

### `web_search` 返回 `{"success": false}`

- 检查 `SEARXNG_URL` 是否可达：`curl -s "http://localhost:8888/search?q=test&format=json"`
- 如果收到 HTTP 403，说明 JSON 格式被禁用——请在 `settings.yml` 的 `formats` 列表中添加 `json` 并重启
- 如果收到连接错误，容器可能未运行：`docker ps | grep searxng`

### `web_extract` 提示“仅支持搜索的后端”

SearXNG 无法提取 URL 内容。请将 `web.extract_backend` 设置为支持提取的提供商：

```yaml
web:
  search_backend: "searxng"
  extract_backend: "firecrawl"  # 或 tavily / exa / parallel
```

### SearXNG 返回 0 个结果

某些公共实例会禁用某些搜索引擎或类别。请尝试：
- 使用不同的查询
- 使用 [searx.space](https://searx.space/) 上的其他公共实例
- 自主部署您自己的实例以获得可靠结果

### 公共实例速率受限

切换到自主部署实例（参见上方的 [选项 A](#option-a--self-host-with-docker-recommended)）。使用 Docker 时，您自己的实例没有速率限制。

---

## 可选技能：`searxng-search`

对于需要直接通过 `curl` 使用 SearXNG 的智能体（例如当网络工具集不可用时作为备用方案），请安装 `searxng-search` 可选技能：

```bash
hermes skills install official/research/searxng-search
```

这将添加一个技能，教智能体如何：
- 通过 `curl` 或 Python 调用 SearXNG JSON API
- 按类别过滤（`general`、`news`、`science` 等）
- 处理分页和错误情况
- 在 SearXNG 不可达时优雅降级