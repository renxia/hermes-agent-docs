---
sidebar_position: 13
title: "委派与并行工作"
description: "何时以及如何使用子智能体委派——用于并行研究、代码审查和多个文件工作的模式"
---

# 委派与并行工作

Hermes 可以生成独立的子智能体来并行处理任务。每个子智能体都有自己的对话、终端会话和工具集。只有最终的摘要会返回——中间的工具调用永远不会进入您的上下文窗口。

有关完整功能参考，请参阅[子智能体委派](/docs/user-guide/features/delegation)。

---

## 何时委派

**适合委派的任务：**
- 推理密集型子任务（调试、代码审查、研究综合）
- 会因中间数据而淹没上下文的任务
- 并行独立工作流（同时研究 A 和 B）
- 需要全新上下文的任务，希望智能体在没有偏见的情况下处理

**使用其他方式：**
- 单个工具调用 → 直接使用工具
- 步骤间有逻辑的机械式多步工作 → `execute_code`
- 需要用户交互的任务 → 子智能体无法使用 `clarify`
- 快速文件编辑 → 直接进行编辑
- 必须比当前轮次持续更久的持久性长时间运行工作 → `cronjob` 或 `terminal(background=True, notify_on_complete=True)`。`delegate_task` 是**同步的**：如果父轮次被中断，活动的子智能体将被取消，其工作将被丢弃。

---

## 模式：并行研究

同时研究三个主题并获得结构化摘要：

```
并行研究以下三个主题：
1. 浏览器之外的 WebAssembly 现状
2. 2025 年 RISC-V 服务器芯片的采用情况
3. 实用量子计算应用

重点关注最新进展和主要参与者。
```

幕后，Hermes 使用：

```python
delegate_task(tasks=[
    {
        "goal": "研究 2025 年浏览器之外的 WebAssembly",
        "context": "重点关注：运行时（Wasmtime、Wasmer）、云/边缘用例、WASI 进展",
        "toolsets": ["web"]
    },
    {
        "goal": "研究 RISC-V 服务器芯片的采用情况",
        "context": "重点关注：已发货的服务器芯片、采用该技术的云提供商、软件生态系统",
        "toolsets": ["web"]
    },
    {
        "goal": "研究实用量子计算应用",
        "context": "重点关注：纠错突破、真实用例、关键公司",
        "toolsets": ["web"]
    }
])
```

三个任务并发运行。每个子智能体独立搜索网络并返回摘要。父智能体随后将它们综合成一份连贯的简报。

---

## 模式：代码审查

将安全审查委派给一个上下文全新的子智能体，使其在没有先入为主观念的情况下审查代码：

```
审查 src/auth/ 目录下的身份验证模块是否存在安全问题。
检查 SQL 注入、JWT 验证问题、密码处理
和会话管理。修复发现的所有问题并运行测试。
```

关键在于 `context` 字段——它必须包含子智能体所需的一切信息：

```python
delegate_task(
    goal="审查 src/auth/ 目录下的安全问题并修复发现的问题",
    context="""项目位于 /home/user/webapp。Python 3.11，Flask，PyJWT，bcrypt。
    身份验证文件：src/auth/login.py、src/auth/jwt.py、src/auth/middleware.py
    测试命令：pytest tests/auth/ -v
    重点关注：SQL 注入、JWT 验证、密码哈希、会话管理。
    修复发现的问题并验证测试通过。""",
    toolsets=["terminal", "file"]
)
```

:::warning 上下文问题
子智能体对你的对话**一无所知**。它们从零开始。如果你委派“修复我们讨论的 bug”，子智能体不知道你指的是哪个 bug。始终显式传递文件路径、错误消息、项目结构和约束条件。
:::

---

## 模式：比较替代方案

并行评估同一问题的多种方法，然后选择最佳方案：

```
我需要为我们的 Django 应用添加全文搜索功能。并行评估三种方法：
1. PostgreSQL tsvector（内置）
2. 通过 django-elasticsearch-dsl 使用 Elasticsearch
3. 通过 meilisearch-python 使用 Meilisearch

针对每种方法评估：设置复杂性、查询能力、资源需求
和维护开销。比较它们并推荐一种。
```

每个子智能体独立研究一个选项。由于它们彼此隔离，因此不会相互干扰——每个评估都基于其自身的优点。父智能体获得所有三个摘要并进行比较。

---

## 模式：多文件重构

将大型重构任务拆分给并行运行的子智能体，每个子智能体处理代码库的不同部分：

```python
delegate_task(tasks=[
    {
        "goal": "重构所有 API 端点处理程序以使用新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文件：src/handlers/users.py、src/handlers/auth.py、src/handlers/billing.py
        旧格式：return {"data": result, "status": "ok"}
        新格式：return APIResponse(data=result, status=200).to_dict()
        导入：from src.responses import APIResponse
        完成后运行测试：pytest tests/handlers/ -v""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "更新所有客户端 SDK 方法以处理新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文件：sdk/python/client.py、sdk/python/models.py
        旧解析：result = response.json()["data"]
        新解析：result = response.json()["data"]（相同键，但添加状态码检查）
        同时更新 sdk/python/tests/test_client.py""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "更新 API 文档以反映新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文档位置：docs/api/。格式：带代码示例的 Markdown。
        将所有响应示例从旧格式更新为新格式。
        在 docs/api/overview.md 中添加“响应格式”部分以解释模式。""",
        "toolsets": ["terminal", "file"]
    }
])
```

:::tip
每个子智能体获得其独立的终端会话。只要它们编辑不同的文件，就可以在同一项目目录中工作而不会相互干扰。如果两个子智能体可能触及同一文件，请在并行工作完成后自行处理该文件。
:::

---

## 模式：先收集再分析

使用 `execute_code` 进行机械数据收集，然后将需要大量推理的分析委派出去：

```python
# 步骤 1：机械收集（此处更适合使用 execute_code —— 无需推理）
execute_code("""
from hermes_tools import web_search, web_extract

results = []
for query in ["AI funding Q1 2026", "AI startup acquisitions 2026", "AI IPOs 2026"]:
    r = web_search(query, limit=5)
    for item in r["data"]["web"]:
        results.append({"title": item["title"], "url": item["url"], "desc": item["description"]})

# 提取前 5 个最相关结果的全部内容
urls = [r["url"] for r in results[:5]]
content = web_extract(urls)

# 保存以供分析步骤使用
import json
with open("/tmp/ai-funding-data.json", "w") as f:
    json.dump({"search_results": results, "extracted": content["results"]}, f)
print(f"收集了 {len(results)} 个结果，提取了 {len(content['results'])} 页内容")
""")

# 步骤 2：需要大量推理的分析（此处更适合委派）
delegate_task(
    goal="分析 AI 融资数据并撰写市场报告",
    context="""/tmp/ai-funding-data.json 中的原始数据包含关于 2026 年第一季度 AI 融资、收购和 IPO 的搜索结果和提取的网页内容。
    撰写一份结构化市场报告：关键交易、趋势、 notable 参与者
    和展望。重点关注超过 1 亿美元的交易。""",
    toolsets=["terminal", "file"]
)
```

这通常是最有效的模式：`execute_code` 以较低成本处理 10 多个顺序工具调用，然后子智能体以清晰的上下文执行单一昂贵的推理任务。

---

## 工具集选择

根据子智能体的需求选择工具集：

| 任务类型 | 工具集 | 原因 |
|----------|--------|------|
| 网络研究 | `["web"]` | 仅 web_search + web_extract |
| 代码工作 | `["terminal", "file"]` | Shell 访问 + 文件操作 |
| 全栈 | `["terminal", "file", "web"]` | 除消息传递外的所有功能 |
| 只读分析 | `["file"]` | 只能读取文件，无 Shell 权限 |

限制工具集可使子智能体保持专注，并防止意外的副作用（例如研究子智能体运行 Shell 命令）。

---

## 约束条件

- **默认 3 个并行任务**：批次默认为 3 个并发子智能体（可通过 config.yaml 中的 `delegation.max_concurrent_children` 配置，无硬性上限，只有 1 的下限）
- **嵌套委派需显式启用**：叶级子智能体（默认）无法调用 `delegate_task`、`clarify`、`memory`、`send_message` 或 `execute_code`。编排器子智能体（`role="orchestrator"`）保留 `delegate_task` 以进行进一步委派，但仅当 `delegation.max_spawn_depth` 提高到默认值 1 以上时（支持 1-3）；其他四个仍被阻止。可通过 `delegation.orchestrator_enabled: false` 全局禁用。

### 调整并发性和深度

| 配置 | 默认值 | 范围 | 效果 |
|------|--------|------|------|
| `max_concurrent_children` | 3 | >=1 | 每次 `delegate_task` 调用的并行批次大小 |
| `max_spawn_depth` | 1 | 1-3 | 可进一步派生的委派层级数 |

示例：使用嵌套子智能体运行 30 个并行工作线程：

```yaml
delegation:
  max_concurrent_children: 30
  max_spawn_depth: 2
```

- **独立终端** —— 每个子智能体获得其独立的终端会话，具有单独的工作目录和状态
- **无对话历史记录** —— 子智能体仅看到父智能体调用 `delegate_task` 时传递的 `goal` 和 `context`
- **默认 50 次迭代** —— 对于简单任务，可将 `max_iterations` 设置得更低以节省成本
- **非持久化** —— `delegate_task` 是同步的，并在父级回合内运行。如果父级被中断（新用户消息、`/stop`、`/new`），所有活跃的子任务将被取消（`status="interrupted"`），其工作将被丢弃。对于必须跨越当前回合的工作，请使用 `cronjob` 或 `terminal(background=True, notify_on_complete=True)`。

---
## 提示

**目标要具体。** “修复 bug” 过于模糊。“修复 api/handlers.py 第 47 行中 process_request() 从 parse_body() 接收 None 导致的 TypeError” 能为子智能体提供足够的信息。

**包含文件路径。** 子智能体不知道你的项目结构。始终包含相关文件的绝对路径、项目根目录和测试命令。

**使用委派实现上下文隔离。** 有时你需要一个全新的视角。委派迫使你清晰地阐明问题，而子智能体在没有对话中积累的假设的情况下处理它。

**检查结果。** 子智能体摘要仅此而已 —— 摘要。如果子智能体说“修复了 bug 且测试通过”，请通过自己运行测试或阅读差异来验证。

---

*有关完整的委派参考 —— 所有参数、ACP 集成和高级配置 —— 请参阅 [子智能体委派](/docs/user-guide/features/delegation)。*