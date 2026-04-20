---
sidebar_position: 13
title: "委托与并行工作"
description: "何时以及如何使用子智能体委托 — 用于并行研究、代码审查和多文件工作的模式"
---

# 委托与并行工作

Hermes 可以生成隔离的子智能体来并行处理任务。每个子智能体都有自己独立的对话、终端会话和工具集。只有最终总结会返回给你 —— 中间工具调用绝不会进入你的上下文窗口。

有关完整功能参考，请参见 [子智能体委托](/docs/user-guide/features/delegation)。

---

## 何时进行委托

**适合委托的候选任务：**
- 需要大量推理的子任务（调试、代码审查、研究综合）
- 会导致上下文被中间数据淹没的任务
- 并行的独立工作流（同时研究 A 和 B）
- 需要全新上下文的任务，你希望智能体不带偏见地处理

**其他选择：**
- 单个工具调用 → 直接使用该工具
- 有逻辑步骤间的机械性多步工作 → `execute_code`
- 需要用户交互的任务 → 子智能体无法使用 `clarify`
- 快速文件编辑 → 直接操作

---

## 模式：并行研究

同时研究三个主题并获得结构化摘要：

```
并行研究以下三个主题：
1. 浏览器外 WebAssembly 的现状
2. 2025 年 RISC-V 服务器芯片的采用情况
3. 实用的量子计算应用

重点关注最新发展动态和关键参与者。
```

幕后，Hermes 使用：

```python
delegate_task(tasks=[
    {
        "goal": "研究 2025 年浏览器外的 WebAssembly",
        "context": "重点关注：运行时（Wasmtime、Wasmer）、云/边缘用例、WASI 进展",
        "toolsets": ["web"]
    },
    {
        "goal": "研究 RISC-V 服务器芯片的采用情况",
        "context": "重点关注：已发货的服务器芯片、云提供商采用情况、软件生态系统",
        "toolsets": ["web"]
    },
    {
        "goal": "研究实用的量子计算应用",
        "context": "重点关注：纠错突破、实际应用案例、关键公司",
        "toolsets": ["web"]
    }
])
```

三者并发运行。每个子智能体独立搜索网络并返回摘要。父智能体随后将它们合成为连贯简报。

---

## 模式：代码审查

将安全审查委托给一个全新上下文的子智能体，让它不带预设地审查代码：

```
审查 src/auth/ 目录下的认证模块是否存在安全问题。
检查 SQL 注入、JWT 验证问题、密码处理和会话管理。
修复发现的问题并运行测试。
```

关键在于 `context` 字段 —— 必须包含子智能体所需的所有信息：

```python
delegate_task(
    goal="审查 src/auth/ 目录下的安全问题并修复发现的问题",
    context="""项目位于 /home/user/webapp。Python 3.11，Flask，PyJWT，bcrypt。
    认证相关文件：src/auth/login.py，src/auth/jwt.py，src/auth/middleware.py
    测试命令：pytest tests/auth/ -v
    重点关注：SQL 注入、JWT 验证、密码哈希、会话管理。
    修复发现的问题并确保测试通过。""",
    toolsets=["terminal", "file"]
)
```

:::warning 上下文问题
子智能体对你的对话**一无所知**。它们从零开始。如果你委托“修复我们讨论过的 bug”，子智能体不知道你说的是什么 bug。始终明确传递文件路径、错误信息、项目结构和约束条件。
:::

---

## 模式：比较替代方案

并行评估同一问题的多种方法，然后选择最佳方案：

```
我需要为 Django 应用添加全文搜索功能。并行评估三种方法：
1. PostgreSQL tsvector（内置）
2. 通过 django-elasticsearch-dsl 使用 Elasticsearch
3. 通过 meilisearch-python 使用 Meilisearch

对每种方法：设置复杂度、查询能力、资源需求和运维开销。进行比较并推荐一种。
```

每个子智能体独立研究一种选项。由于它们是隔离的，不存在交叉污染 —— 每种评估都基于自身优势。父智能体获得所有三种摘要并进行比较。

---

## 模式：多文件重构

将大型重构任务拆分为多个子智能体并行处理，每个子智能体负责代码库的不同部分：

```python
delegate_task(tasks=[
    {
        "goal": "将所有 API 端点处理器重构为使用新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文件：src/handlers/users.py，src/handlers/auth.py，src/handlers/billing.py
        旧格式：return {"data": result, "status": "ok"}
        新格式：return APIResponse(data=result, status=200).to_dict()
        导入：from src.responses import APIResponse
        完成后运行测试：pytest tests/handlers/ -v""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "更新所有客户端 SDK 方法以处理新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文件：sdk/python/client.py，sdk/python/models.py
        旧解析方式：result = response.json()["data"]
        新解析方式：result = response.json()["data"]（键名相同，但增加状态码检查）
        同时更新 sdk/python/tests/test_client.py""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "更新 API 文档以反映新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文档位置：docs/api/。格式：带代码示例的 Markdown。
        将所有响应示例从旧格式更新为新格式。
        在 docs/api/overview.md 中添加“响应格式”章节解释 schema。""",
        "toolsets": ["terminal", "file"]
    }
])
```

:::tip
每个子智能体都有自己的终端会话。它们可以在同一个项目目录下工作而互不干扰 —— 只要它们编辑不同的文件即可。如果两个子智能体可能修改同一个文件，请在并行工作完成后自行处理该文件。
:::

---

## 模式：先收集后分析

使用 `execute_code` 进行机械性数据收集，然后将需要大量推理的分析委托出去：

```python
# 第 1 步：机械性收集（这里更适合 execute_code —— 不需要推理）
execute_code("""
from hermes_tools import web_search, web_extract

results = []
for query in ["AI 融资 Q1 2026", "AI 初创企业收购 2026", "AI IPO 2026"]:
    r = web_search(query, limit=5)
    for item in r["data"]["web"]:
        results.append({"title": item["title"], "url": item["url"], "desc": item["description"]})

# 提取最相关的 5 个结果的全部内容
urls = [r["url"] for r in results[:5]]
content = web_extract(urls)

# 为分析步骤保存数据
import json
with open("/tmp/ai-funding-data.json", "w") as f:
    json.dump({"search_results": results, "extracted": content["results"]}, f)
print(f"收集了 {len(results)} 条结果，提取了 {len(content['results'])} 页内容")
""")

# 第 2 步：需要大量推理的分析（这里更适合委托）
delegate_task(
    goal="分析 AI 融资数据并撰写市场报告",
    context="""原始数据位于 /tmp/ai-funding-data.json，包含关于 2026 年第一季度 AI 融资、收购和 IPO 的搜索结果和网页提取内容。
    撰写结构化市场报告：主要交易、趋势、重要参与者和发展前景。
    重点关注超过 1 亿美元的交易。""",
    toolsets=["terminal", "file"]
)
```

这通常是最有效的模式：`execute_code` 廉价地处理 10 多次顺序工具调用，然后子智能体在一个干净上下文中执行单次昂贵推理任务。

---

## 工具集选择

根据子智能体需要什么来选择工具集：

| 任务类型 | 工具集 | 原因 |
|-----------|----------|-----|
| 网络研究 | `["web"]` | 仅 web_search + web_extract |
| 代码工作 | `["terminal", "file"]` | Shell 访问 + 文件操作 |
| 全栈工作 | `["terminal", "file", "web"]` | 除消息传递外的所有功能 |
| 只读分析 | `["file"]` | 只能读取文件，不能执行 shell 命令 |

限制工具集可以让子智能体保持专注，防止意外副作用（例如研究子智能体运行 shell 命令）。

---

## 约束条件

- **默认 3 个并行任务** —— 批次默认为 3 个并发子智能体（可通过 config.yaml 中的 `delegation.max_concurrent_children` 配置）
- **无嵌套** —— 子智能体不能调用 `delegate_task`、`clarify`、`memory`、`send_message` 或 `execute_code`
- **独立终端** —— 每个子智能体获得自己的终端会话，拥有独立的工作目录和状态
- **无对话历史** —— 子智能体只能看到你在 `goal` 和 `context` 中提供的信息
- **默认 50 次迭代** —— 对于简单任务，设置较低的 `max_iterations` 以节省成本

---

## 提示

**目标要具体明确。** “修复 bug”太模糊。 “修复 api/handlers.py 第 47 行 process_request() 接收 None 的 TypeError（来自 parse_body()）”为子智能体提供了足够的工作依据。

**包含文件路径。** 子智能体不知道你的项目结构。始终提供相关文件的绝对路径、项目根目录和测试命令。

**利用委托实现上下文隔离。** 有时你需要全新视角。委托迫使你清晰地表述问题，子智能体会不带你在对话中形成的假设来处理它。

**检查结果。** 子智能体摘要只是摘要。如果子智能体说“修复了 bug 且测试通过”，请自行运行测试或查看 diff 来验证。

---

*有关完整的委托参考 —— 所有参数、ACP 集成和高级配置 —— 请参见 [Subagent Delegation](/docs/user-guide/features/delegation)。*