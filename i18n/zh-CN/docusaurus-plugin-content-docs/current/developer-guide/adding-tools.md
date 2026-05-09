---
sidebar_position: 2
title: "添加工具"
description: "如何向 Hermes 智能体添加新工具 —— 模式、处理函数、注册与工具集"
---

# 添加工具

在编写工具之前，请先问自己：**这应该是一个[技能](creating-skills.md)吗？**

:::warning 仅限内置核心工具
本页介绍如何向代码库本身添加**内置 Hermes 工具**。
如果您希望拥有一个个人使用、项目本地或自定义工具，且**无需修改 Hermes 核心代码**，请使用插件方式：

- [插件](/docs/user-guide/features/plugins)
- [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)

大多数自定义工具创建应优先选择插件方式。仅当您明确希望在 `tools/` 和 `toolsets.py` 中发布新的内置工具时，才遵循本页说明。
:::

当某项能力可通过指令 + Shell 命令 + 现有工具（如 arXiv 搜索、Git 工作流、Docker 管理、PDF 处理）表达时，请将其设为**技能**。

当需要与 API 密钥、自定义处理逻辑、二进制数据处理或流式传输（如浏览器自动化、TTS、视觉分析）进行端到端集成时，请将其设为**工具**。

## 概览

添加工具涉及**两个文件**：

1. **`tools/your_tool.py`** —— 处理函数、模式、检查函数、`registry.register()` 调用  
2. **`toolsets.py`** —— 将工具名称添加到 `_HERMES_CORE_TOOLS`（或特定工具集）

任何包含顶层 `registry.register()` 调用的 `tools/*.py` 文件都会在启动时自动被发现 —— 无需手动维护导入列表。

## 步骤 1：创建内置工具文件

每个工具文件都遵循相同的结构：

```python
# tools/weather_tool.py
"""天气工具 —— 查询某地的当前天气。"""

import json
import os
import logging

logger = logging.getLogger(__name__)


# --- 可用性检查 ---

def check_weather_requirements() -> bool:
    """如果工具的依赖项可用，则返回 True。"""
    return bool(os.getenv("WEATHER_API_KEY"))


# --- 处理函数 ---

def weather_tool(location: str, units: str = "metric") -> str:
    """获取某地的天气信息。返回 JSON 字符串。"""
    api_key = os.getenv("WEATHER_API_KEY")
    if not api_key:
        return json.dumps({"error": "WEATHER_API_KEY 未配置"})
    try:
        # ... 调用天气 API ...
        return json.dumps({"location": location, "temp": 22, "units": units})
    except Exception as e:
        return json.dumps({"error": str(e)})


# --- 模式 ---

WEATHER_SCHEMA = {
    "name": "weather",
    "description": "获取某地的当前天气。",
    "parameters": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "城市名称或坐标（例如 'London' 或 '51.5,-0.1'）"
            },
            "units": {
                "type": "string",
                "enum": ["metric", "imperial"],
                "description": "温度单位（默认：公制）",
                "default": "metric"
            }
        },
        "required": ["location"]
    }
}


# --- 注册 ---

from tools.registry import registry

registry.register(
    name="weather",
    toolset="weather",
    schema=WEATHER_SCHEMA,
    handler=lambda args, **kw: weather_tool(
        location=args.get("location", ""),
        units=args.get("units", "metric")),
    check_fn=check_weather_requirements,
    requires_env=["WEATHER_API_KEY"],
)
```

### 关键规则

:::danger 重要
- 处理函数**必须**返回 JSON 字符串（通过 `json.dumps()`），绝不能返回原始字典  
- 错误**必须**以 `{"error": "message"}` 形式返回，绝不能抛出异常  
- `check_fn` 在构建工具定义时被调用 —— 如果返回 `False`，该工具将被静默排除  
- `handler` 接收 `(args: dict, **kwargs)`，其中 `args` 是 LLM 的工具调用参数  
:::

## 步骤 2：将内置工具添加到工具集

在 `toolsets.py` 中添加工具名称：

```python
# 如果它应在所有平台（CLI + 消息传递）上可用：
_HERMES_CORE_TOOLS = [
    ...
    "weather",  # <-- 在此处添加
]

# 或者创建一个新的独立工具集：
"weather": {
    "description": "天气查询工具",
    "tools": ["weather"],
    "includes": []
},
```

## ~~步骤 3：添加发现导入~~（不再需要）

包含顶层 `registry.register()` 调用的工具模块会通过 `tools/registry.py` 中的 `discover_builtin_tools()` 自动被发现。无需手动维护导入列表 —— 只需在 `tools/` 中创建您的文件，它将在启动时被自动加载。

## 异步处理函数

如果您的处理函数需要异步代码，请使用 `is_async=True` 标记：

```python
async def weather_tool_async(location: str) -> str:
    async with aiohttp.ClientSession() as session:
        ...
    return json.dumps(result)

registry.register(
    name="weather",
    toolset="weather",
    schema=WEATHER_SCHEMA,
    handler=lambda args, **kw: weather_tool_async(args.get("location", "")),
    check_fn=check_weather_requirements,
    is_async=True,  # 注册表会自动调用 _run_async()
)
```

注册表会透明地处理异步桥接 —— 您永远不需要自己调用 `asyncio.run()`。

## 需要 task_id 的处理函数

管理每会话状态的工具会通过 `**kwargs` 接收 `task_id`：

```python
def _handle_weather(args, **kw):
    task_id = kw.get("task_id")
    return weather_tool(args.get("location", ""), task_id=task_id)

registry.register(
    name="weather",
    ...
    handler=_handle_weather,
)
```

## 智能体循环拦截工具

某些工具（`todo`、`memory`、`session_search`、`delegate_task`）需要访问每会话的智能体状态。这些工具会在到达注册表之前被 `run_agent.py` 拦截。注册表仍保存其模式，但如果绕过拦截，`dispatch()` 会返回一个后备错误。

## 可选：设置向导集成

如果您的工具需要 API 密钥，请将其添加到 `hermes_cli/config.py`：

```python
OPTIONAL_ENV_VARS = {
    ...
    "WEATHER_API_KEY": {
        "description": "用于天气查询的天气 API 密钥",
        "prompt": "天气 API 密钥",
        "url": "https://weatherapi.com/",
        "tools": ["weather"],
        "password": True,
    },
}
```

## 检查清单

- [ ] 已创建包含处理函数、模式、检查函数和注册的工具文件  
- [ ] 已在 `toolsets.py` 中添加到适当的工具集  
- [ ] 确认这确实应该是一个内置/核心工具，而不是插件  
- [ ] 处理函数返回 JSON 字符串，错误以 `{"error": "..."}` 形式返回  
- [ ] 可选：已将 API 密钥添加到 `hermes_cli/config.py` 的 `OPTIONAL_ENV_VARS`  
- [ ] 可选：已添加到 `toolset_distributions.py` 以支持批处理  
- [ ] 已通过 `hermes chat -q "Use the weather tool for London"` 测试