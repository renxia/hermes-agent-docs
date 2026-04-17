---
sidebar_position: 13
title: "委派与并行工作"
description: "何时以及如何使用子代理委派——用于并行研究、代码审查和多文件工作的模式"
---

# 委派与并行工作

Hermes 可以生成隔离的子代理来并行处理任务。每个子代理都有自己的对话、终端会话和工具集。只有最终的摘要会返回——中间的工具调用永远不会进入你的上下文窗口。

有关完整的特性参考，请参阅 [子代理委派](/docs/user-guide/features/delegation)。

---

## 何时进行委派

**适合委派的候选任务：**
- 涉及大量推理的子任务（调试、代码审查、研究综合）
- 会用中间数据充斥你的上下文的任务
- 并行独立的工作流（同时进行研究 A 和 B）
- 需要代理在没有偏见的情况下处理的全新上下文任务

**使用其他方法：**
- 单个工具调用 → 直接使用工具即可
- 带有步骤间逻辑的机械多步工作 → `execute_code`
- 需要用户交互的任务 → 子代理无法使用 `clarify`
- 快速文件编辑 → 直接进行

---

## 模式：并行研究

同时研究三个主题并获取结构化摘要：

```
并行研究以下三个主题：
1. 浏览器外的 WebAssembly 当前状态
2. 2025 年 RISC-V 服务器芯片采用情况
3. 实际量子计算应用

重点关注最新发展和关键参与者。
```

在后台，Hermes 使用：

```python
delegate_task(tasks=[
    {
        "goal": "研究 2025 年浏览器外的 WebAssembly",
        "context": "重点关注：运行时（Wasmtime、Wasmer）、云/边缘用例、WASI 进展",
        "toolsets": ["web"]
    },
    {
        "goal": "研究 RISC-V 服务器芯片采用情况",
        "context": "重点关注：出货的服务器芯片、采用的云服务提供商、软件生态系统",
        "toolsets": ["web"]
    },
    {
        "goal": "研究实际量子计算应用",
        "context": "重点关注：纠错突破、现实世界用例、关键公司",
        "toolsets": ["web"]
    }
])
```

这三个任务并发运行。每个子代理独立搜索网络并返回摘要。父代理随后将它们综合成一份连贯的简报。

---

## 模式：代码审查

将一次安全审查委派给一个全新上下文的子代理，让它在没有预设概念的情况下处理代码：

```
审查 src/auth/ 目录下的认证模块，查找安全问题。
检查 SQL 注入、JWT 验证问题、密码处理和会话管理。修复所有发现的问题并运行测试。
```

关键在于 `context` 字段——它必须包含子代理所需的一切信息：

```python
delegate_task(
    goal="审查 src/auth/ 目录下的安全问题并修复所有发现的问题",
    context="""项目位于 /home/user/webapp。Python 3.11，Flask，PyJWT，bcrypt。
    认证文件：src/auth/login.py, src/auth/jwt.py, src/auth/middleware.py
    测试命令：pytest tests/auth/ -v
    重点关注：SQL 注入、JWT 验证、密码哈希、会话管理。
    修复发现的问题并验证测试通过。""",
    toolsets=["terminal", "file"]
)
```

:::warning 上下文问题
子代理**对你的对话一无所知**。它们从完全全新的状态开始。如果你委派“修复我们正在讨论的错误”，子代理根本不知道你指的是哪个错误。始终明确传递文件路径、错误消息、项目结构和约束。
:::

---

## 模式：比较替代方案

并行评估同一问题的多种方法，然后选择最佳方案：

```
我需要在我们的 Django 应用中添加全文搜索功能。并行评估三种方法：
1. PostgreSQL tsvector（内置）
2. 通过 django-elasticsearch-dsl 的 Elasticsearch
3. 通过 meilisearch-python 的 Meilisearch

对于每种方法：设置复杂度、查询能力、资源要求和维护开销。比较它们并推荐一个。
```

每个子代理独立研究一种方案。由于它们是隔离的，因此不存在交叉污染——每次评估都是独立进行的。父代理获取所有三个摘要并进行比较。

---

## 模式：多文件重构

将一个大型重构任务拆分给多个子代理，每个子代理负责代码库的不同部分：

```python
delegate_task(tasks=[
    {
        "goal": "重构所有 API 端点处理器以使用新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文件：src/handlers/users.py, src/handlers/auth.py, src/handlers/billing.py
        旧格式：return {"data": result, "status": "ok"}
        新格式：return APIResponse(data=result, status=200).to_dict()
        导入：from src.responses import APIResponse
        运行测试后：pytest tests/handlers/ -v""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "更新所有客户端 SDK 方法以处理新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文件：sdk/python/client.py, sdk/python/models.py
        旧解析：result = response.json()["data"]
        新解析：result = response.json()["data"] (键相同，但需要添加状态码检查)
        同时更新 sdk/python/tests/test_client.py""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "更新 API 文档以反映新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文档位于：docs/api/。格式：带有代码示例的 Markdown。
        将所有响应示例从旧格式更新为新格式。
        在 docs/api/overview.md 中添加一个“响应格式”部分，解释模式。""",
        "toolsets": ["terminal", "file"]
    }
])
```

:::tip
每个子代理都有自己的终端会话。它们可以在同一个项目目录中工作而不会互相干扰——只要它们编辑的是不同的文件。如果两个子代理可能会接触到同一个文件，请在并行工作完成后自己处理该文件。
:::

---

## 模式：收集然后分析

使用 `execute_code` 进行机械数据收集，然后委派推理密集型的分析：

```python
# 步骤 1：机械收集（此处使用 execute_code 更佳——无需推理）
execute_code("""
from hermes_tools import web_search, web_extract

results = []
for query in ["AI funding Q1 2026", "AI startup acquisitions 2026", "AI IPOs 2026"]:
    r = web_search(query, limit=5)
    for item in r["data"]["web"]:
        results.append({"title": item["title"], "url": item["url"], "desc": item["description"]})

# 从最相关的前 5 个提取完整内容
urls = [r["url"] for r in results[:5]]
content = web_extract(urls)

# 保存用于分析步骤
import json
with open("/tmp/ai-funding-data.json", "w") as f:
    json.dump({"search_results": results, "extracted": content["results"]}, f)
print(f"已收集 {len(results)} 个结果，提取了 {len(content['results'])} 个页面")
""")

# 步骤 2：推理密集型分析（此处委派更佳）
delegate_task(
    goal="分析 AI 资金数据并撰写市场报告",
    context="""位于 /tmp/ai-funding-data.json 的原始数据包含关于 2026 年第一季度 AI 资金、收购和 IPO 的搜索结果和提取的网页。
    撰写一份结构化的市场报告：关键交易、趋势、值得关注的参与者和前景。重点关注超过 1 亿美元的交易。""",
    toolsets=["terminal", "file"]
)
```

这通常是最有效率的模式：`execute_code` 廉价地处理 10 多个顺序工具调用，然后子代理使用干净的上下文执行单个昂贵的推理任务。

---

## 工具集选择

根据子代理的需求选择工具集：

| 任务类型 | 工具集 | 原因 |
|-----------|----------|-----|
| 网络研究 | `["web"]` | 仅需要 web_search + web_extract |
| 代码工作 | `["terminal", "file"]` | 命令行访问 + 文件操作 |
| 全栈 | `["terminal", "file", "web"]` | 除消息传递外所有功能 |
| 只读分析 | `["file"]` | 只能读取文件，不能使用 shell |

限制工具集可以使子代理保持专注，并防止意外的副作用（例如，研究子代理运行 shell 命令）。

---

## 约束

- **默认 3 个并行任务** — 批处理默认设置为 3 个并发子代理（可通过 config.yaml 中的 `delegation.max_concurrent_children` 配置）
- **无嵌套** — 子代理不能调用 `delegate_task`、`clarify`、`memory`、`send_message` 或 `execute_code`
- **独立终端** — 每个子代理都有自己的终端会话，具有独立的工作目录和状态
- **无对话历史** — 子代理只能看到你在 `goal` 和 `context` 中提供的内容
- **默认 50 次迭代** — 对于简单任务，请设置较低的 `max_iterations` 以节省成本

---

## 提示

**在目标中要具体。** “修复错误”过于模糊。“修复 api/handlers.py 第 47 行的 TypeError，因为 process_request() 从 parse_body() 接收到 None”为子代理提供了足够的工作依据。

**包含文件路径。** 子代理不知道你的项目结构。始终包含相关文件的绝对路径、项目根目录和测试命令。

**使用委派进行上下文隔离。** 有时你需要一个全新的视角。委派迫使你清晰地阐述问题，子代理则在没有对话中积累的假设的情况下处理它。

**检查结果。** 子代理的摘要只是摘要。如果子代理说“已修复错误且测试通过”，请通过自己运行测试或阅读差异（diff）来验证。

---

*有关完整的委派参考——所有参数、ACP 集成和高级配置——请参阅 [子代理委派](/docs/user-guide/features/delegation)。*