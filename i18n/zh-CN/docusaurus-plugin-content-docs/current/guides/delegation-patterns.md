---
sidebar_position: 13
title: "Delegation & Parallel Work"
description: "When and how to use subagent delegation — patterns for parallel research, code review, and multi-file work"
---

# 委托与并行工作

Hermes 可以生成隔离的子智能体来并行处理任务。每个子智能体拥有独立的对话、终端会话和工具集。只有最终摘要会返回——中间的工具调用永远不会进入你的上下文窗口。

完整功能参考请参阅[子智能体委托](/user-guide/features/delegation)。

---

## 何时委托

**适合委托的任务：**
- 推理密集型子任务（调试、代码审查、研究综合分析）
- 会产生大量中间数据从而溢出上下文的任务
- 并行独立工作流（同时研究 A 和 B）
- 需要无偏见处理的新上下文任务

**使用其他方式：**
- 单一工具调用 → 直接使用工具
- 步骤间有逻辑关系的多步骤机械性工作 → `execute_code`
- 需要用户交互的任务 → 子智能体无法使用 `clarify`
- 快速文件编辑 → 直接操作
- 必须跨越当前轮次持续运行的长期任务 → `cronjob` 或 `terminal(background=True, notify_on_complete=True)`。`delegate_task` 是**同步的**：如果父轮次被中断，正在运行的子任务会被取消，其工作成果也会被丢弃。

---

## 模式：并行研究

同时研究三个主题并获取结构化摘要：

```
并行研究以下三个主题：
1. WebAssembly 在浏览器之外的现状
2. RISC-V 服务器芯片在 2025 年的采用情况
3. 量子计算的实际应用

重点关注最新进展和关键参与者。
```

在后台，Hermes 使用：

```python
delegate_task(tasks=[
    {
        "goal": "Research WebAssembly outside the browser in 2025",
        "context": "Focus on: runtimes (Wasmtime, Wasmer), cloud/edge use cases, WASI progress",
        "toolsets": ["web"]
    },
    {
        "goal": "Research RISC-V server chip adoption",
        "context": "Focus on: server chips shipping, cloud providers adopting, software ecosystem",
        "toolsets": ["web"]
    },
    {
        "goal": "Research practical quantum computing applications",
        "context": "Focus on: error correction breakthroughs, real-world use cases, key companies",
        "toolsets": ["web"]
    }
])
```

三个任务同时运行。每个子智能体独立搜索网络并返回摘要。父智能体随后将它们综合成一份连贯的简报。

---

## 模式：代码审查

将安全审查委托给一个以全新上下文处理、不带先入之见地审查代码的子智能体：

```
审查 src/auth/ 中的身份验证模块，查找安全问题。
检查 SQL 注入、JWT 验证问题、密码处理和会话管理。
修复发现的问题并运行测试。
```

关键在于 `context` 字段——它必须包含子智能体所需的一切信息：

```python
delegate_task(
    goal="Review src/auth/ for security issues and fix any found",
    context="""Project at /home/user/webapp. Python 3.11, Flask, PyJWT, bcrypt.
    Auth files: src/auth/login.py, src/auth/jwt.py, src/auth/middleware.py
    Test command: pytest tests/auth/ -v
    Focus on: SQL injection, JWT validation, password hashing, session management.
    Fix issues found and verify tests pass.""",
    toolsets=["terminal", "file"]
)
```

:::warning 上下文问题
子智能体对你对话中的内容**一无所知**。它们完全从零开始。如果你委托"修复我们刚才讨论的那个 bug"，子智能体根本不知道你说的是哪个 bug。始终显式传递文件路径、错误信息、项目结构和约束条件。
:::

---

## 模式：对比备选方案

并行评估同一问题的多种方法，然后选择最佳方案：

```
我需要为我们的 Django 应用添加全文搜索。并行评估三种方案：
1. PostgreSQL tsvector（内置）
2. 通过 django-elasticsearch-dsl 使用 Elasticsearch
3. 通过 meilisearch-python 使用 Meilisearch

对每种方案评估：设置复杂度、查询能力、资源需求和维护开销。
进行对比并推荐一种。
```

每个子智能体独立研究一个选项。由于它们是隔离的，不存在交叉污染——每个评估都独立成立。父智能体获取全部三个摘要后进行对比。

---

## 模式：多文件重构

将大型重构任务拆分到并行子智能体，每个处理代码库的不同部分：

```python
delegate_task(tasks=[
    {
        "goal": "Refactor all API endpoint handlers to use the new response format",
        "context": """Project at /home/user/api-server.
        Files: src/handlers/users.py, src/handlers/auth.py, src/handlers/billing.py
        Old format: return {"data": result, "status": "ok"}
        New format: return APIResponse(data=result, status=200).to_dict()
        Import: from src.responses import APIResponse
        Run tests after: pytest tests/handlers/ -v""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "Update all client SDK methods to handle the new response format",
        "context": """Project at /home/user/api-server.
        Files: sdk/python/client.py, sdk/python/models.py
        Old parsing: result = response.json()["data"]
        New parsing: result = response.json()["data"] (same key, but add status code checking)
        Also update sdk/python/tests/test_client.py""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "Update API documentation to reflect the new response format",
        "context": """Project at /home/user/api-server.
        Docs at: docs/api/. Format: Markdown with code examples.
        Update all response examples from old format to new format.
        Add a 'Response Format' section to docs/api/overview.md explaining the schema.""",
        "toolsets": ["terminal", "file"]
    }
])
```

:::tip
每个子智能体获得独立的终端会话。它们可以在同一个项目目录中工作而不会互相干扰——前提是它们编辑的是不同的文件。如果两个子智能体可能操作同一个文件，在并行工作完成后由你自己来处理该文件。
:::

---

## 模式：先收集后分析

使用 `execute_code` 进行机械性的数据收集，然后将推理密集型分析委托出去：

```python
# 第 1 步：机械性收集（此处 execute_code 更合适——无需推理）
execute_code("""
from hermes_tools import web_search, web_extract

results = []
for query in ["AI funding Q1 2026", "AI startup acquisitions 2026", "AI IPOs 2026"]:
    r = web_search(query, limit=5)
    for item in r["data"]["web"]:
        results.append({"title": item["title"], "url": item["url"], "desc": item["description"]})

# 从最相关的 5 个结果中提取完整内容
urls = [r["url"] for r in results[:5]]
content = web_extract(urls)

# 保存以供分析步骤使用
import json
with open("/tmp/ai-funding-data.json", "w") as f:
    json.dump({"search_results": results, "extracted": content["results"]}, f)
print(f"Collected {len(results)} results, extracted {len(content['results'])} pages")
""")

# 第 2 步：推理密集型分析（此处委托更合适）
delegate_task(
    goal="Analyze AI funding data and write a market report",
    context="""Raw data at /tmp/ai-funding-data.json contains search results and
    extracted web pages about AI funding, acquisitions, and IPOs in Q1 2026.
    Write a structured market report: key deals, trends, notable players,
    and outlook. Focus on deals over $100M.""",
    toolsets=["terminal", "file"]
)
```

这通常是最有效的模式：`execute_code` 廉价地处理 10 个以上的顺序工具调用，然后一个子智能体以干净的上下文完成单一的昂贵推理任务。

---

## 工具集选择

根据子智能体的需求选择工具集：

| 任务类型 | 工具集 | 原因 |
|---------|--------|------|
| 网络研究 | `["web"]` | 仅 web_search + web_extract |
| 代码工作 | `["terminal", "file"]` | Shell 访问 + 文件操作 |
| 全栈 | `["terminal", "file", "web"]` | 除消息外的所有功能 |
| 只读分析 | `["file"]` | 只能读取文件，无 Shell |

限制工具集可以使子智能体保持专注，防止意外的副作用（例如研究型子智能体执行 Shell 命令）。

---

## 约束条件

- **默认 3 个并行任务**：批次默认并发 3 个子智能体（可通过 config.yaml 中的 `delegation.max_concurrent_children` 配置，无硬上限，下限为 1）
- **嵌套委托为可选功能**：叶子智能体（默认）无法调用 `delegate_task`、`clarify`、`memory`、`send_message` 或 `execute_code`。编排智能体（`role="orchestrator"`）保留 `delegate_task` 以进行进一步委托，但仅在 `delegation.max_spawn_depth` 被提升到默认值 1 以上时（下限 1，无上限）；其他四个工具仍被阻止。可通过 `delegation.orchestrator_enabled: false` 全局禁用。

### 调优并发与深度

| 配置 | 默认值 | 范围 | 效果 |
|------|--------|------|------|
| `max_concurrent_children` | 3 | >=1 | 每次 `delegate_task` 调用的并行批次大小 |
| `max_spawn_depth` | 1 | >=1 | 委托层级可以进一步衍生的深度 |

示例：运行 30 个并行工作器并带嵌套子智能体：

```yaml
delegation:
  max_concurrent_children: 30
  max_spawn_depth: 2
```

- **独立终端**——每个子智能体获得自己的终端会话，具有独立的工作目录和状态
- **无对话历史**——子智能体仅能看到父智能体调用 `delegate_task` 时传递的 `goal` 和 `context`
- **默认 50 次迭代**——对于简单任务可将 `max_iterations` 设置得更低以节省成本
- **非持久性**——`delegate_task` 是同步的，在父轮次内运行。如果父被中断（新用户消息、`/stop`、`/new`），所有正在运行的子任务都会被取消（`status="interrupted"`），其工作成果也会被丢弃。对于必须跨越当前轮次持续运行的任务，请使用 `cronjob` 或 `terminal(background=True, notify_on_complete=True)`。

---

## 提示

**目标要具体。** "修复 bug" 太模糊了。"修复 api/handlers.py 第 47 行的 TypeError，其中 process_request() 从 parse_body() 接收到 None" 能给子智能体提供足够的操作信息。

**包含文件路径。** 子智能体不了解你的项目结构。始终包含相关文件的绝对路径、项目根目录和测试命令。

**利用委托实现上下文隔离。** 有时你需要一个全新的视角。委托迫使你清晰地阐述问题，而子智能体会在没有你对话中积累的假设的情况下处理问题。

**检查结果。** 子智能体的摘要仅仅是摘要。如果子智能体说"已修复 bug 且测试通过"，请自己运行测试或阅读 diff 来验证。

---

*完整的委托参考——所有参数、ACP 集成和高级配置——请参阅[子智能体委托](/user-guide/features/delegation)。*