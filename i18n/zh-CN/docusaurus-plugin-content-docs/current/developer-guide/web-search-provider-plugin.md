---
sidebar_position: 12
title: "网页搜索提供商插件"
description: "如何为 Hermes 智能体构建一个网页搜索/提取/抓取后端插件"
---

# 构建网页搜索提供商插件

网页搜索提供商插件注册一个后端，用于处理 `web_search`、`web_extract` 以及（可选的）深度抓取工具调用。内置的提供商——Firecrawl、SearXNG、Tavily、Exa、Parallel、Brave Search（免费层）、xAI 和 DDGS——都以 `plugins/web/<name>/` 下的插件形式提供。你可以通过在它们旁边放置一个目录来添加一个新的，或者覆盖一个内置的。

:::tip
网页搜索是 Hermes 支持的几种**后端插件**之一。其他的（拥有各自的抽象基类）有[图像生成提供商插件](/developer-guide/image-gen-provider-plugin)、[视频生成提供商插件](/developer-guide/video-gen-provider-plugin)、[记忆提供商插件](/developer-guide/memory-provider-plugin)、[上下文引擎插件](/developer-guide/context-engine-plugin)和[模型提供商插件](/developer-guide/model-provider-plugin)。通用的工具/钩子/CLI插件位于[构建 Hermes 插件](/guides/build-a-hermes-plugin)中。
:::

## 发现机制如何工作

Hermes 在三个位置扫描网页搜索后端：

1.  **内置** — `<repo>/plugins/web/<name>/` （随着 `kind: backend` 自动加载，始终可用）
2.  **用户** — `~/.hermes/plugins/web/<name>/` （通过 `plugins.enabled` 或 `hermes plugins enable <name>` 选择启用）
3.  **Pip** — 声明了 `hermes_agent.plugins` 入口点的包

每个插件的 `register(ctx)` 函数调用 `ctx.register_web_search_provider(...)` —— 这会将实例放入 `agent/web_search_registry.py` 中的注册表。每种能力的活动提供商由配置决定：

| 能力 | 配置键 | 回退到 |
|---|---|---|
| `web_search` | `web.search_backend` | `web.backend` |
| `web_extract` | `web.extract_backend` | `web.backend` |
| `web_extract` 中的深度抓取模式 | `web.extract_backend` | `web.backend` |

当两个键都未设置时，Hermes 会根据环境中存在的任何 API 密钥/URL 自动检测后端。`hermes tools` 可以引导用户完成选择。

```
plugins/web/my-backend/
├── __init__.py     # register() 入口点
├── provider.py     # WebSearchProvider 子类
└── plugin.yaml     # 清单，包含 kind: backend 和 provides_web_providers
```

`brave_free/` 和 `ddgs/` 是树内最小的参考实现——`brave_free` 用于需要 API 密钥、仅提供搜索的智能体，`ddgs` 用于无需密钥、延迟安装其 SDK 的智能体。

## WebSearchProvider 抽象基类

继承 `agent.web_search_provider.WebSearchProvider`。唯一必须实现的成员是 `name`、`is_available()`，以及您决定实现的 `search()` / `extract()` / `crawl()` 中的任意一个。

```python
# plugins/web/my-backend/provider.py
from __future__ import annotations

import os
from typing import Any, Dict, List

from agent.web_search_provider import WebSearchProvider


class MyBackendWebSearchProvider(WebSearchProvider):
    """Minimal search-only provider against the My Backend HTTP API."""

    @property
    def name(self) -> str:
        # Stable id used in web.search_backend / web.extract_backend / web.backend
        # config keys. Lowercase, no spaces; hyphens permitted.
        return "my-backend"

    @property
    def display_name(self) -> str:
        # Human label shown in `hermes tools`. Defaults to `name`.
        return "My Backend"

    def is_available(self) -> bool:
        # Cheap check — env var present, optional dep importable, etc.
        # MUST NOT make network calls (runs on every `hermes tools` paint).
        return bool(os.getenv("MY_BACKEND_API_KEY", "").strip())

    def supports_search(self) -> bool:
        return True

    def supports_extract(self) -> bool:
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

        # Response shape is fixed — see "Response shape" below.
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
    """Plugin entry point — called once at load time."""
    ctx.register_web_search_provider(MyBackendWebSearchProvider())
```

## plugin.yaml

```yaml
name: web-my-backend
version: 1.0.0
description: "我的后端网页搜索 — Bearer 认证 REST API"
author: 您的名字
kind: backend
provides_web_providers:
  - my-backend
requires_env:
  - MY_BACKEND_API_KEY
```

| 键 | 用途 |
|---|---|
| `kind: backend` | 将插件通过后端加载路径进行路由 |
| `provides_web_providers` | 此插件注册的智能体 `name` 列表 — 用于让加载器即使在 `register()` 运行前也能在 `hermes tools` 中宣传该插件 |
| `requires_env` | 在 `hermes plugins install` 期间进行交互式凭据提示（详细格式请参阅[构建 Hermes 插件](/guides/build-a-hermes-plugin#gate-on-environment-variables)） |

## 抽象基类参考

完整合约在 `agent/web_search_provider.py`。您可以覆盖的方法：

| 成员 | 是否必须 | 默认值 | 用途 |
|---|---|---|---|
| `name` | ✅ | — | 用于 `web.*_backend` 配置的稳定标识符 |
| `display_name` | — | `name` | 在 `hermes tools` 中显示的标签 |
| `is_available()` | ✅ | — | 轻量级可用性检查 — 环境变量、可选依赖项 |
| `supports_search()` | — | `True` | `web_search` 路由的能力标志 |
| `supports_extract()` | — | `False` | `web_extract` 路由的能力标志 |
| `search(query, limit)` | 条件性 | 抛出异常 | 当 `supports_search()` 返回 `True` 时必需 |
| `extract(urls, **kwargs)` | 条件性 | 抛出异常 | 当 `supports_extract()` 返回 `True` 时必需 |

智能体可以从单个类宣传多种能力 — Firecrawl、Tavily、Exa 和 Parallel 都同时实现了搜索和提取。Brave Search 和 DDGS 仅提供搜索；SearXNG 是仅提供搜索的智能体，并且有一个有据可查的“与提取智能体配对”的工作流程。

## 响应形状

工具包装器期望一个固定的信封，这样它就不需要在后端之间进行转换。

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
            "error": str,        # 可选，仅在每个 URL 失败时出现
        },
        ...
    ],
}
```

**任一能力失败：**

```python
{"success": False, "error": "人类可读的错误信息"}
```

`search()` 和 `extract()` 都可以是 `async def` — 调度器通过 `inspect.iscoroutinefunction` 检测协程函数并相应地进行等待。执行阻塞 I/O（HTTP、SDK 调用）的同步实现对于小型后端来说是可以的；调度器会处理线程。

## 能力标志

Hermes 根据 `supports_*` 标志将调用路由到正确的智能体。一个常见的多智能体配置：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "brave-free"     # 仅搜索，快速，每月免费 2k 次
  extract_backend: "firecrawl"     # 提取 + 爬取，付费配额
```

当 `web.search_backend` 或 `web.extract_backend` 未设置时，两者都会回退到 `web.backend`。当后者也未设置时，Hermes 会根据环境变量的存在，选择第一个支持所请求能力的可用智能体。

如果您的智能体仅支持一种能力，请将其他标志保持为默认值（`False`），注册表将在该工具上跳过它 — 当用户仅将 X 用于搜索并请求智能体提取时，不会看到误导性的“智能体 X 失败”错误。

## Hermes 如何将其接入工具

`web_search` 和 `web_extract` 工具位于 `tools/web_tools.py` 中。调用时它们会：

1. 读取相关的配置键（`web_search` 对应 `web.search_backend`，`web_extract` 对应 `web.extract_backend`）
2. 向注册表请求具有该 `name` 的智能体
3. 检查 `is_available()` 和匹配的 `supports_*()` 标志
4. 调度到 `search()` / `extract()` / `crawl()`，如果该方法是协程则进行等待
5. 将响应信封进行 JSON 序列化并交还给 LLM

错误作为工具结果出现；由 LLM 决定如何解释它们。如果没有注册智能体（或每个可用的智能体都未能通过能力检查），该工具将返回一个有帮助的错误，指向 `hermes tools`。

## 延迟安装可选依赖项

如果您的智能体封装了第三方 SDK（就像 DDGS 封装了 `ddgs` 包一样），请不要在模块顶层使用 `import`。请在 `is_available()` 或 `search()` 内部使用 `tools.lazy_deps.ensure(...)` — Hermes 会在首次使用时安装该包，并受 `security.allow_lazy_installs` 控制。请参阅[构建 Hermes 插件 → 延迟安装](/guides/build-a-hermes-plugin#lazy-install-optional-python-dependencies)了解安全模型。

## 参考实现

- **`plugins/web/brave_free/`** — 小巧，需要 API 密钥，仅提供搜索的 HTTP 智能体。很好的起点模板。
- **`plugins/web/ddgs/`** — 无需密钥的智能体，延迟安装其 SDK。适用于封装 Python 包的后端模式。
- **`plugins/web/firecrawl/`** — 全功能多能力智能体（搜索 + 提取 + 爬取），支持多种格式模式。
- **`plugins/web/searxng/`** — 自托管，通过 URL 配置，无需认证的后端。
- **`plugins/web/xai/`** — 通过 Grok 服务器端的 `web_search` 工具实现的 LLM 支持的搜索。展示了如何复用现有的 OAuth/环境变量凭据界面（`tools/xai_http.py`）而无需添加新的环境变量，以及如何编写一个遵守无网络契约的轻量级 `is_available()`。

## 通过 pip 分发

```toml
# pyproject.toml
[project.entry-points."hermes_agent.plugins"]
my-backend-web = "my_backend_web_package"
```

`my_backend_web_package` 必须暴露一个顶层的 `register` 函数。完整设置请参阅通用插件指南中的[通过 pip 分发](/guides/build-a-hermes-plugin#distribute-via-pip)。

## 相关页面

- [网页搜索](/user-guide/features/web-search) — 面向用户的功能文档和每个后端的配置
- [插件概览](/user-guide/features/plugins) — 所有插件类型一览
- [构建 Hermes 插件](/guides/build-a-hermes-plugin) — 通用工具/钩子/斜杠命令指南