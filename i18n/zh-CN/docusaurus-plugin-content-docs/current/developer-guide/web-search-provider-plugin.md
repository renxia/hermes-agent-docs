---
sidebar_position: 12
title: "Web Search Provider Plugins"
description: "How to build a web-search/extract/crawl backend plugin for Hermes Agent"
---

# 构建 Web Search Provider 插件

Web Search Provider 插件用于注册一个后端，为 `web_search`、`web_extract` 以及（可选的）深度爬取工具调用提供服务。内置的 Provider —— Firecrawl、SearXNG、Tavily、Exa、Parallel、Brave Search（免费版）、xAI 和 DDGS —— 均以插件形式存放在 `plugins/web/<name>/` 下。你可以通过在与它们同级的位置添加目录来新增一个插件，或覆盖一个内置插件。

:::tip
Web Search 是 Hermes 支持的几种**后端插件**之一。其他插件（各有其 ABC）包括 [Image Generation Provider 插件](/developer-guide/image-gen-provider-plugin)、[Video Generation Provider 插件](/developer-guide/video-gen-provider-plugin)、[Memory Provider 插件](/developer-guide/memory-provider-plugin)、[Context Engine 插件](/developer-guide/context-engine-plugin) 和 [Model Provider 插件](/developer-guide/model-provider-plugin)。通用的工具/钩子/CLI 插件位于 [构建 Hermes 插件](/guides/build-a-hermes-plugin)。
:::

## 发现机制

Hermes 在三个位置扫描 Web Search 后端：

1. **内置** —— `<repo>/plugins/web/<name>/`（以 `kind: backend` 自动加载，始终可用）
2. **用户** —— `~/.hermes/plugins/web/<name>/`（通过 `plugins.enabled` 或 `hermes plugins enable <name>` 按需启用）
3. **Pip** —— 声明了 `hermes_agent.plugins` 入口点的包

每个插件的 `register(ctx)` 函数会调用 `ctx.register_web_search_provider(...)` —— 这将把实例注册到 `agent/web_search_registry.py` 的注册表中。每个能力的活跃 Provider 由配置决定：

| 能力 | 配置键 | 回退到 |
|---|---|---|
| `web_search` | `web.search_backend` | `web.backend` |
| `web_extract` | `web.extract_backend` | `web.backend` |
| `web_extract` 内的深度爬取模式 | `web.extract_backend` | `web.backend` |

当两个键都未设置时，Hermes 会根据环境中存在的 API 密钥/URL 自动检测后端。`hermes tools` 会引导用户完成选择。

## 目录结构

```
plugins/web/my-backend/
├── __init__.py     # register() 入口点
├── provider.py     # WebSearchProvider 子类
└── plugin.yaml     # 包含 kind: backend 和 provides_web_providers 的清单文件
```

`brave_free/` 和 `ddgs/` 是最小的树内参考实现 —— `brave_free` 适用于需要 API 密钥的纯搜索 Provider，`ddgs` 适用于无需密钥、延迟安装其 SDK 的 Provider。

## WebSearchProvider ABC

继承 `agent.web_search_provider.WebSearchProvider`。唯一必须实现的成员是 `name`、`is_available()` 以及你实现的 `search()` / `extract()` 之一。（深度爬取不是独立的方法 —— 它是 `extract()` 的一种模式。）

```python
# plugins/web/my-backend/provider.py
from __future__ import annotations

import os
from typing import Any, Dict, List

from agent.web_search_provider import WebSearchProvider


class MyBackendWebSearchProvider(WebSearchProvider):
    """针对 My Backend HTTP API 的最小化纯搜索 Provider。"""

    @property
    def name(self) -> str:
        # 用于 web.search_backend / web.extract_backend / web.backend
        # 配置键的稳定标识符。小写，不允许空格；允许连字符。
        return "my-backend"

    @property
    def display_name(self) -> str:
        # 在 `hermes tools` 中显示的人类可读标签。默认为 `name`。
        return "My Backend"

    def is_available(self) -> bool:
        # 低成本检查 —— 环境变量是否存在、可选依赖是否可导入等。
        # 禁止发起网络请求（在每次 `hermes tools` 渲染时运行）。
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

        # 响应结构是固定的 —— 参见下文"响应结构"。
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
description: "My Backend web search — Bearer-auth REST API"
author: Your Name
kind: backend
provides_web_providers:
  - my-backend
requires_env:
  - MY_BACKEND_API_KEY
```

| 键 | 用途 |
|---|---|
| `kind: backend` | 将插件路由到后端加载路径 |
| `provides_web_providers` | 此插件注册的 Provider `name` 列表 —— 加载器用于在 `hermes tools` 中宣传该插件，即使在 `register()` 运行之前也可用 |
| `requires_env` | 在 `hermes plugins install` 期间的交互式凭据提示（丰富格式请参阅 [构建 Hermes 插件](/guides/build-a-hermes-plugin#gate-on-environment-variables)） |

## ABC 参考

完整契约在 `agent/web_search_provider.py` 中。你可以重写的成员：

| 成员 | 是否必需 | 默认值 | 用途 |
|---|---|---|---|
| `name` | ✅ | — | 用于 `web.*_backend` 配置的稳定标识符 |
| `display_name` | — | `name` | 在 `hermes tools` 中显示的标签 |
| `is_available()` | ✅ | — | 低成本可用性检查 —— 环境变量、可选依赖 |
| `supports_search()` | — | `True` | `web_search` 路由的能力标志 |
| `supports_extract()` | — | `False` | `web_extract` 路由的能力标志 |
| `search(query, limit)` | 条件性 | 抛出异常 | 当 `supports_search()` 返回 `True` 时必需 |
| `extract(urls, **kwargs)` | 条件性 | 抛出异常 | 当 `supports_extract()` 返回 `True` 时必需 |

Provider 可以从单个类宣传多种能力 —— Firecrawl、Tavily、Exa 和 Parallel 都同时实现了搜索和提取。Brave Search 和 DDGS 仅支持搜索；SearXNG 仅支持搜索，并有文档说明"将其与提取 Provider 配对"的工作流。

## 响应结构

工具包装器期望一个固定的信封结构，这样它就不需要在后端之间进行转换。

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
            "error": str,        # 可选，仅在单个 URL 失败时
        },
        ...
    ],
}
```

**任一能力，失败时：**

```python
{"success": False, "error": "人类可读的消息"}
```

`search()` 和 `extract()` 都可以是 `async def` —— 调度器通过 `inspect.iscoroutinefunction` 检测协程函数并相应地进行等待。执行阻塞 I/O（HTTP、SDK 调用）的同步实现对于小型后端来说没有问题；调度器会处理线程。

## 能力标志

Hermes 根据 `supports_*` 标志将调用路由到正确的 Provider。一个常见的多 Provider 配置：

```yaml
# ~/.hermes/config.yaml
web:
  search_backend: "brave-free"     # 仅搜索，快速，免费 2k/月
  extract_backend: "firecrawl"     # 提取 + 爬取，付费配额
```

当 `web.search_backend` 或 `web.extract_backend` 未设置时，两者都会回退到 `web.backend`。当该值也未设置时，Hermes 会根据环境变量存在情况选择第一个支持所请求能力的可用 Provider。

如果你的 Provider 仅支持一种能力，请将其他标志保持默认值（`False`），注册表会跳过该工具 —— 用户不会看到误导性的"Provider X 失败"错误，因为他们只在搜索时使用 X，却要求智能体执行提取。

## Hermes 如何将其接入工具

`web_search` 和 `web_extract` 工具位于 `tools/web_tools.py` 中。在调用时它们会：

1. 读取相关配置键（`web_search` 对应 `web.search_backend`，`web_extract` 对应 `web.extract_backend`）
2. 向注册表请求具有该 `name` 的 Provider
3. 检查 `is_available()` 和匹配的 `supports_*()` 标志
4. 分发到 `search()` / `extract()`（深度爬取作为 `extract()` 内的一种模式运行），如果方法是协程则进行等待
5. 对响应信封进行 JSON 序列化并返回给 LLM

错误作为工具结果呈现；LLM 决定如何解释它们。如果没有注册任何 Provider（或所有可用的 Provider 都未通过能力检查），工具会返回一个指向 `hermes tools` 的有用错误。

## 延迟安装可选依赖

如果你的 Provider 封装了第三方 SDK（如 DDGS 封装了 `ddgs` 包），不要在模块顶层 `import`。在 `is_available()` 或 `search()` 内使用 `tools.lazy_deps.ensure(...)` —— Hermes 会在首次使用时安装该包，受 `security.allow_lazy_installs` 控制。安全模型请参阅 [构建 Hermes 插件 → 延迟安装](/guides/build-a-hermes-plugin#lazy-install-optional-python-dependencies)。

## 参考实现

- **`plugins/web/brave_free/`** —— 小型、需要 API 密钥的纯搜索 HTTP Provider。良好的起始模板。
- **`plugins/web/ddgs/`** —— 无需密钥、延迟安装其 SDK 的 Provider。适用于封装 Python 包的后端。
- **`plugins/web/firecrawl/`** —— 完整的多能力 Provider（搜索 + 提取 + 爬取），支持多种格式模式。
- **`plugins/web/searxng/`** —— 自托管、通过 URL 配置、无需认证的后端。
- **`plugins/web/xai/`** —— 通过 Grok 服务端的 `web_search` 工具实现的 LLM 驱动搜索。展示了如何复用现有的 OAuth/环境变量凭据体系（`tools/xai_http.py`）而无需添加新环境变量，以及如何编写一个遵守无网络契约的低成本 `is_available()`。

## 通过 pip 分发

```toml
# pyproject.toml
[project.entry-points."hermes_agent.plugins"]
my-backend-web = "my_backend_web_package"
```

`my_backend_web_package` 必须暴露一个顶层 `register` 函数。完整设置请参阅通用插件指南中的 [通过 pip 分发](/guides/build-a-hermes-plugin#distribute-via-pip)。

## 相关页面

- [Web Search](/user-guide/features/web-search) —— 面向用户的功能文档和各后端配置
- [插件概览](/user-guide/features/plugins) —— 所有插件类型一览
- [构建 Hermes 插件](/guides/build-a-hermes-plugin) —— 通用工具/钩子/斜杠命令指南