---
sidebar_position: 12
title: "网络搜索提供商插件"
description: "如何为 Hermes 智能体构建网络搜索/提取/爬取后端插件"
---

# 构建网络搜索提供商插件

网络搜索提供商插件注册一个后端，用于处理 `web_search`、`web_extract` 以及（可选的）深度爬取工具调用。内置的提供商 —— Firecrawl、SearXNG、Tavily、Exa、Parallel、Brave Search（免费层）和 DDGS —— 都作为插件位于 `plugins/web/<name>/` 目录下。您可以通过在它们旁边放置一个新目录来添加新的提供商，或覆盖一个已捆绑的提供商。

:::tip
网络搜索是 Hermes 支持的多种**后端插件**之一。其他插件（各自有对应的抽象基类）包括[图像生成提供商插件](/developer-guide/image-gen-provider-plugin)、[视频生成提供商插件](/developer-guide/video-gen-provider-plugin)、[记忆提供商插件](/developer-guide/memory-provider-plugin)、[上下文引擎插件](/developer-guide/context-engine-plugin) 和 [模型提供商插件](/developer-guide/model-provider-plugin)。通用的工具/钩子/CLI 插件位于[构建 Hermes 插件](/guides/build-a-hermes-plugin)。
:::

## 工作原理发现机制

Hermes 在三个位置扫描网络搜索后端：

1. **捆绑的** —— `<repo>/plugins/web/<name>/`（自动加载，`kind: backend`，始终可用）
2. **用户级** —— `~/.hermes/plugins/web/<name>/`（通过 `plugins.enabled` 或 `hermes plugins enable <name>` 启用）
3. **Pip 包** —— 声明了 `hermes_agent.plugins` 入口点的包

每个插件的 `register(ctx)` 函数会调用 `ctx.register_web_search_provider(...)` —— 这会将实例注册到 `agent/web_search_registry.py` 的注册表中。每个能力对应的活跃提供商会根据配置选取：

| 能力 | 配置键 | 回退选项 |
|---|---|---|
| `web_search` | `web.search_backend` | `web.backend` |
| `web_extract` | `web.extract_backend` | `web.backend` |
| `web_extract` 内的深度爬取模式 | `web.extract_backend` | `web.backend` |

当两个配置键都未设置时，Hermes 会根据环境中存在的 API 密钥/URL 自动检测后端。`hermes tools` 命令会引导用户进行选择。

```markdown
plugins/web/my-backend/
├── __init__.py     # register() 入口点
└── plugin.yaml     # 包含 kind: backend 和 provides_web_providers 的清单
```

`brave_free/` 和 `ddgs/` 是最小的树内参考示例 —— `brave_free` 是一个需要 API 密钥的、仅提供搜索功能的提供商，`ddgs` 是一个无需密钥的、懒加载其 SDK 的提供商。

## WebSearchProvider 抽象基类

继承 `agent.web_search_provider.WebSearchProvider`。唯一必须的成员是 `name`、`is_available()` 以及你实现的 `search()` / `extract()` / `crawl()` 中的任意一个。

```python
# plugins/web/my-backend/provider.py
from __future__ import annotations

import os
from typing import Any, Dict, List

from agent.web_search_provider import WebSearchProvider


class MyBackendWebSearchProvider(WebSearchProvider):
    """针对 My Backend HTTP API 的最小化、仅搜索的提供商。"""

    @property
    def name(self) -> str:
        # 在 web.search_backend / web.extract_backend / web.backend
        # 配置键中使用的稳定 ID。小写，无空格；允许使用连字符。
        return "my-backend"

    @property
    def display_name(self) -> str:
        # 在 `hermes tools` 中显示的人类可读标签。默认为 `name`。
        return "My Backend"

    def is_available(self) -> bool:
        # 低成本检查 —— 环境变量是否存在，可选依赖是否可导入，等等。
        # 绝对不能发起网络调用（在每次绘制 `hermes tools` 时运行）。
        return bool(os.getenv("MY_BACKEND_API_KEY", "").strip())

    def supports_search(self) -> bool:
        return True

    def supports_extract(self) -> bool:
        return False

    def supports_crawl(self) -> bool:
        return False

    def search(self, query: str, limit: int = 5) -> Dict[str, Any]:
        import httpx

        api_key = os.environ["MY_BACKEND_API_KEY"]
        try:
            resp = httpx.get(
                "https://api.example.com/search",
                params={"q": query, "count": max(1, min(int(limit), 20))},
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPError as exc:
            return {"success": False, "error": str(exc)}

        # 响应结构是固定的 —— 请参见下方的“响应结构”。
        return {
            "success": True,
            "data": {
                "web": [
                    {
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "description": item.get("snippet", ""),
                        "position": idx + 1,
                    }
                    for idx, item in enumerate(data.get("results", []))
                ],
            },
        }
```

```python
# plugins/web/my-backend/__init__.py
from plugins.web.my_backend.provider import MyBackendWebSearchProvider


def register(ctx) -> None:
    """插件入口点 —— 在加载时调用一次。"""
    ctx.register_web_search_provider(MyBackendWebSearchProvider())
```

## plugin.yaml

```yaml
name: web-my-backend
version: 1.0.0
description: "My Backend 网络搜索 — Bearer-auth REST API"
author: Your Name
kind: backend
provides_web_providers:
  - my-backend
requires_env:
  - MY_BACKEND_API_KEY
```

| 键 | 用途 |
|---|---|
| `kind: backend` | 将插件路由至后端加载路径 |
| `provides_web_providers` | 此插件注册的提供商 `name` 列表 —— 加载器使用它即使在 `register()` 运行之前，也能在 `hermes tools` 中展示该插件 |
| `requires_env` | 在 `hermes plugins install` 期间交互式凭证提示（参见[构建 Hermes 插件](/guides/build-a-hermes-plugin#gate-on-environment-variables)了解富文本格式） |

## 抽象基类参考

完整契约见 `agent/web_search_provider.py`。你可以覆盖的方法：

| 成员 | 必须 | 默认值 | 用途 |
|---|---|---|---|
| `name` | ✅ | — | 在 `web.*_backend` 配置中使用的稳定 ID |
| `display_name` | — | `name` | 在 `hermes tools` 中显示的标签 |
| `is_available()` | ✅ | — | 低成本可用性检查 —— 环境变量、可选依赖 |
| `supports_search()` | — | `True` | 用于 `web_search` 路由的功能标志 |
| `supports_extract()` | — | `False` | 用于 `web_extract` 路由的功能标志 |
| `supports_crawl()` | — | `False` | 用于深度爬取模式的功能标志 |
| `search(query, limit)` | 条件必须 | 抛出异常 | 当 `supports_search()` 返回 `True` 时必须实现 |
| `extract(urls, **kwargs)` | 条件必须 | 抛出异常 | 当 `supports_extract()` 返回 `True` 时必须实现 |
| `crawl(url, **kwargs)` | 条件必须 | 抛出异常 | 当 `supports_crawl()` 返回 `True` 时必须实现 |

提供商可以从单个类宣传多种功能 —— Firecrawl、Tavily、Exa 和 Parallel 都同时实现了搜索/提取/爬取三种功能。Brave Search 和 DDGS 是仅搜索的；SearXNG 是仅搜索的，并有一个有文档记录的“让我与一个提取提供商配对”的工作流程。

## 响应结构

工具包装器期望一个固定的信封，这样它就不需要在不同的后端之间进行转换。

**搜索成功：**

```python
{
    "success": True,
    "data": {
        "web": [
            {"title": str, "url": str, "description": str, "position": int},
            ...
        ],
    },
}
```

**提取成功：**

```python
{
    "success": True,
    "data": [
        {
            "url": str,
            "title": str,
            "content": str,
            "raw_content": str,
            "metadata": dict,    # 可选
            "error": str,        # 可选，仅在单个 URL 失败时出现
        },
        ...
    ],
}
```

**任一功能失败时：**

```python
{"success": False, "error": "人类可读的错误信息"}
```

`search()` 和 `extract()` 都可以是 `async def` —— 调度器通过 `inspect.iscoroutinefunction` 检测协程函数并相应地进行等待。对于小型后端，执行阻塞 I/O（HTTP、SDK 调用）的同步实现是可行的；调度器会处理线程。

## 功能标志

Hermes 根据 `supports_*` 标志将调用路由到正确的提供商。一个常见的多提供商设置：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "brave-free"     # 仅搜索，快速，免费 2k/月
  extract_backend: "firecrawl"     # 提取 + 爬取，付费配额
```

当 `web.search_backend` 或 `web.extract_backend` 未设置时，两者都会回退到 `web.backend`。如果后者也未设置，Hermes 将基于环境变量是否存在，选择第一个支持所请求功能的可用提供商。

如果你的提供商只支持一种功能，请将其他标志保持在默认值（`False`），注册表将在该工具中跳过它 —— 用户在使用 X 仅用于搜索并请求智能体提取时，不会看到误导性的“提供商 X 失败”错误。

## Hermes 如何将其接入工具

`web_search` 和 `web_extract` 工具位于 `tools/web_tools.py`。在调用时，它们：

1.  读取相关的配置键（`web_search` 对应 `web.search_backend`，`web_extract` 对应 `web.extract_backend`）
2.  向注册表请求具有该 `name` 的提供商
3.  检查 `is_available()` 和匹配的 `supports_*()` 标志
4.  调度到 `search()` / `extract()` / `crawl()`，如果方法是协程则进行等待
5.  JSON 序列化响应信封并将其交还给大语言模型

错误会作为工具结果呈现；由大语言模型决定如何解释它们。如果没有注册任何提供商（或每个可用的提供商都未能通过功能门控），该工具将返回一个有用的错误，指向 `hermes tools`。

## 懒加载安装可选依赖

如果你的提供商包装了一个第三方 SDK（就像 DDGS 使用 `ddgs` 包那样），不要在模块顶层 `import` 它。在 `is_available()` 或 `search()` 内部使用 `tools.lazy_deps.ensure(...)` —— Hermes 将在首次使用时安装该包，受限于 `security.allow_lazy_installs` 设置。有关安全模型，请参阅[构建 Hermes 插件 → 懒加载可选 Python 依赖](/guides/build-a-hermes-plugin#lazy-install-optional-python-dependencies)。
## 参考实现

-   **`plugins/web/brave_free/`** —— 小巧，需要 API 密钥，仅搜索的 HTTP 提供商。是很好的起始模板。
-   **`plugins/web/ddgs/`** —— 无需密钥，懒加载其 SDK 的提供商。适用于包装 Python 包的后端。
-   **`plugins/web/firecrawl/`** —— 功能完整的多能力提供商（搜索 + 提取 + 爬取），具有多种格式模式。
-   **`plugins/web/searxng/`** —— 自托管，通过 URL 配置，无需认证的后端。
-   **`plugins/web/xai/`** —— 通过 Grok 服务器端的 `web_search` 工具实现的大语言模型支持的搜索。展示了如何复用现有的 OAuth/环境变量凭证接口（`tools/xai_http.py`）而不添加新的环境变量，以及如何编写一个遵守无网络契约的低成本 `is_available()`。

## 通过 pip 分发

```toml
# pyproject.toml
[project.entry-points."hermes_agent.plugins"]
my-backend-web = "my_backend_web_package"
```

`my_backend_web_package` 必须暴露一个顶层的 `register` 函数。请参阅通用插件指南中的[通过 pip 分发](/guides/build-a-hermes-plugin#distribute-via-pip)了解完整设置。

## 相关页面

-   [网络搜索](/user-guide/features/web-search) —— 用户功能文档和按后端的配置
-   [插件概述](/user-guide/features/plugins) —— 所有插件类型一览
-   [构建 Hermes 插件](/guides/build-a-hermes-plugin) —— 通用工具/钩子/斜杠命令指南
```