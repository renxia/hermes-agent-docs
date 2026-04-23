---
sidebar_position: 13
title: "委派与并行工作"
description: "何时以及如何使用子智能体委派 —— 并行研究、代码审查和多文件工作的模式"
---

# 委派与并行工作

Hermes 可以生成隔离的子智能体来并行处理任务。每个子智能体都拥有独立的对话、终端会话和工具集。只有最终摘要会返回 —— 中间的工具调用绝不会进入你的上下文窗口。

如需完整的功能参考，请参阅 [子智能体委派](/docs/user-guide/features/delegation)。

---

## 何时委派

**适合委派的任务：**
- 重度推理的子任务（调试、代码审查、研究综合）
- 会产生大量中间数据从而淹没上下文的
- 并行的独立工作流（同时研究 A 和 B）
- 需要全新上下文的任務，希望智能体在无偏见的情况下进行处理

**使用其他方式：**
- 单次工具调用 → 直接使用工具即可
- 步骤间带有逻辑的机械式多步工作 → `execute_code`
- 需要用户交互的任务 → 子智能体无法使用 `clarify`
- 快速文件编辑 → 直接操作即可

---

## 模式：并行研究

同时研究三个主题，并获取结构化的摘要：

```
并行研究以下三个主题：
1. 浏览器外的 WebAssembly 现状
2. 2025 年 RISC-V 服务器芯片的采用情况
3. 实用的量子计算应用

重点关注最新进展和关键参与者。
```

在后台，Hermes 使用：

```python
delegate_task(tasks=[
     {
         "goal": "研究 2025 年浏览器外的 WebAssembly",
         "context": "重点关注：运行时（Wasmtime, Wasmer）、云/边缘用例、WASI 进展",
         "toolsets": ["web"]
     },
     {
         "goal": "研究 RISC-V 服务器芯片的采用情况",
         "context": "重点关注：服务器芯片出货、云提供商采用情况、软件生态系统",
         "toolsets": ["web"]
     },
     {
         "goal": "研究实用的量子计算应用",
         "context": "重点关注：纠错突破、实际用例、关键公司",
         "toolsets": ["web"]
     }
])
```

这三个任务将并发运行。每个子智能体独立搜索网络并返回摘要。父智能体随后将它们综合成一份连贯的简报。

---

## 模式：代码审查

将安全审查委派给一个拥有全新上下文的子智能体，使其不带预设偏见地审查代码：

```
审查 src/auth/ 中的身份验证模块是否存在安全问题。
检查 SQL 注入、JWT 验证问题、密码处理，
以及会话管理。修复发现的问题并运行测试。
```

关键在于 `context` 字段 —— 它必须包含子智能体所需的一切信息：

```python
delegate_task(
    goal="审查 src/auth/ 的安全问题并修复发现的问题",
    context="""项目位于 /home/user/webapp。Python 3.11, Flask, PyJWT, bcrypt。
    身份验证文件：src/auth/login.py, src/auth/jwt.py, src/auth/middleware.py
    测试命令：pytest tests/auth/ -v
    重点关注：SQL 注入、JWT 验证、密码哈希、会话管理。
    修复发现的问题并验证测试通过。""",
    toolsets=["terminal", "file"]
)
```

:::warning 上下文问题
子智能体对你的对话**一无所知**。它们是完全从零开始的。如果你委派“修复我们刚才讨论的那个 bug”，子智能体根本不知道你说的是哪个 bug。务必明确传递文件路径、错误信息、项目结构和约束条件。
:::

---

## 模式：比较备选方案

并行评估解决同一问题的多种方法，然后选择最佳方案：

```
我需要为我们的 Django 应用添加全文搜索。并行评估三种方法：
1. PostgreSQL tsvector（内置）
2. 通过 django-elasticsearch-dsl 使用 Elasticsearch
3. 通过 meilisearch-python 使用 Meilisearch

针对每种方法：评估设置复杂度、查询能力、资源需求和维护开销。比较它们并推荐一种。
```

每个子智能体独立研究一个选项。由于它们是隔离的，因此不会产生交叉污染 —— 每项评估都基于其自身优势独立存在。父智能体获取所有三个摘要并进行比较。

---

## 模式：多文件重构

将大型重构任务拆分给并行的子智能体，每个子智能体负责代码库的不同部分：

```python
delegate_task(tasks=[
     {
         "goal": "重构所有 API 端点处理器以使用新的响应格式",
         "context": """项目位于 /home/user/api-server。
        文件：src/handlers/users.py, src/handlers/auth.py, src/handlers/billing.py
        旧格式：return {"data": result, "status": "ok"}
        新格式：return APIResponse(data=result, status=200).to_dict()
        导入：from src.responses import APIResponse
        运行测试：pytest tests/handlers/ -v""",
         "toolsets": ["terminal", "file"]
     },
     {
         "goal": "更新所有客户端 SDK 方法以处理新的响应格式",
         "context": """项目位于 /home/user/api-server。
        文件：sdk/python/client.py, sdk/python/models.py
        旧解析：result = response.json()["data"]
        新解析：result = response.json()["data"]（键相同，但增加状态码检查）
        同时更新 sdk/python/tests/test_client.py""",
         "toolsets": ["terminal", "file"]
     },
     {
         "goal": "更新 API 文档以反映新的响应格式",
         "context": """项目位于 /home/user/api-server。
        文档位于：docs/api/。格式：带有代码示例的 Markdown。
        将所有响应示例从旧格式更新为新格式。
        在 docs/api/overview.md 中添加一个“响应格式”部分来解释架构。""",
         "toolsets": ["terminal", "file"]
     }
])
```

:::tip
每个子智能体都拥有独立的终端会话。它们可以在同一个项目目录下工作而不会互相干扰 —— 只要它们编辑的是不同的文件。如果两个子智能体可能会修改同一个文件，请在并行工作完成后亲自处理该文件。
:::

---

## 模式：先收集后分析

使用 `execute_code` 进行机械式数据收集，然后委派重度推理的分析任务：

```python
# 步骤 1：机械式收集（此处使用 execute_code 更好 —— 无需推理）
execute_code("""
from hermes_tools import web_search, web_extract

results = []
for query in ["AI funding Q1 2026", "AI startup acquisitions 2026", "AI IPOs 2026"]:
    r = web_search(query, limit=5)
    for item in r["data"]["web"]:
        results.append({"title": item["title"], "url": item["url"], "desc": item["description"]})

# 提取前 5 个最相关结果的完整内容
urls = [r["url"] for r in results[:5]]
content = web_extract(urls)

# 保存以供分析步骤使用
import json
with open("/tmp/ai-funding-data.json", "w") as f:
    json.dump({"search_results": results, "extracted": content["results"]}, f)
print(f"已收集 {len(results)} 条结果，提取了 {len(content['results'])} 个页面")
""")

# 步骤 2：重度推理分析（此处使用委派更好）
delegate_task(
    goal="分析 AI 资金数据并撰写市场报告",
    context="""位于 /tmp/ai-funding-data.json 的原始数据包含搜索结果和
    关于 2026 年第一季度 AI 资金、收购和 IPO 的提取网页。
    撰写一份结构化的市场报告：关键交易、趋势、知名参与者，
    以及前景。重点关注超过 1 亿美元的交易。""",
    toolsets=["terminal", "file"]
)
```

这通常是最高效的模式：`execute_code` 以较低成本处理 10 多次顺序工具调用，随后子智能体在干净的上下文中执行单次高成本的推理任务。

---

## 工具集选择

根据子智能体的需求选择工具集：

| 任务类型 | 工具集 | 原因 |
|-----------|----------|-----|
| 网络研究 | `["web"]` | 仅使用 web_search + web_extract |
| 代码工作 | `["terminal", "file"]` | Shell 访问 + 文件操作 |
| 全栈开发 | `["terminal", "file", "web"]` | 除消息传递外的所有功能 |
| 只读分析 | `["file"]` | 仅能读取文件，无 Shell 权限 |

限制工具集能让子智能体保持专注，并防止意外副作用（例如研究子智能体执行 Shell 命令）。

---

## 约束条件

- **默认 3 个并行任务** —— 批次默认包含 3 个并发子智能体（可通过 `config.yaml` 中的 `delegation.max_concurrent_children` 配置 —— 无硬性上限，仅设下限为 1）
- **嵌套委派为可选开启** —— 叶节点子智能体（默认）无法调用 `delegate_task`、`clarify`、`memory`、`send_message` 或 `execute_code`。编排型子智能体（`role="orchestrator"`）保留 `delegate_task` 以进行进一步委派，但仅当 `delegation.max_spawn_depth` 超过默认值 1 时（支持 1-3）；其余四项仍被阻止。可通过 `delegation.orchestrator_enabled: false` 全局禁用。
- **独立终端** —— 每个子智能体拥有独立的终端会话，包含独立的工作目录和状态
- **无对话历史** —— 子智能体仅能看到父智能体在调用 `delegate_task` 时传递的 `goal` 和 `context`
- **默认 50 次迭代** —— 对于简单任务，将 `max_iterations` 设置得更低以节省成本

---

## 提示

**目标要具体。** “修复 bug” 过于模糊。“修复 api/handlers.py 第 47 行的 TypeError，其中 process_request() 从 parse_body() 接收到了 None” 能为子智能体提供足够的操作依据。

**包含文件路径。** 子智能体不了解你的项目结构。务必包含相关文件、项目根目录的绝对路径以及测试命令。

**利用委派实现上下文隔离。** 有时你需要全新的视角。委派迫使你清晰地阐述问题，子智能体将在此基础上进行处理，而不会受到你对话中积累的预设假设的影响。

**检查结果。** 子智能体的摘要仅仅是摘要。如果子智能体表示“已修复 bug 且测试通过”，请亲自运行测试或查看代码差异进行验证。

---

*如需完整的委派参考 —— 所有参数、ACP 集成和高级配置 —— 请参阅 [子智能体委派](/docs/user-guide/features/delegation)。*