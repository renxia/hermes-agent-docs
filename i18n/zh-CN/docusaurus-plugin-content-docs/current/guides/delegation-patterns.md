---
sidebar_position: 13
title: "委派与并行工作"
description: "何时以及如何使用子智能体委派——用于并行研究、代码审查和多功能文件处理的模式"
---

# 委派与并行工作

Hermes 可以生成独立的子智能体来并行处理任务。每个子智能体都拥有自己独立的对话、终端会话和工具集。只有最终的总结会返回——中间的工具调用绝不会进入您的上下文窗口。

有关完整功能参考，请参阅[子智能体委派](/docs/user-guide/features/delegation)。

---

## 何时委派

**适合委派的任务：**
- 需要大量推理的子任务（调试、代码审查、研究综合）
- 会因中间数据而淹没上下文的任务
- 并行独立的作业流（同时研究 A 和 B）
- 需要全新上下文的任务，希望智能体在无偏见的情况下处理

**请使用其他方式：**
- 单一工具调用 → 直接使用该工具
- 步骤间带有逻辑的机械式多步骤工作 → 使用 `execute_code`
- 需要用户交互的任务 → 子智能体无法使用 `clarify`
- 快速文件编辑 → 直接进行编辑
---

## 模式：并行研究

同时研究三个主题并获得结构化摘要：

```
并行研究以下三个主题：
1. WebAssembly 在浏览器之外的应用现状
2. 2025 年 RISC-V 服务器芯片的采用情况
3. 量子计算的实际应用

重点关注最新进展和关键参与者。
```

在后台，Hermes 会执行以下操作：

```python
delegate_task(tasks=[
    {
        "goal": "研究 2025 年 WebAssembly 在浏览器之外的应用",
        "context": "重点关注：运行时（Wasmtime、Wasmer）、云/边缘用例、WASI 进展",
        "toolsets": ["web"]
    },
    {
        "goal": "研究 RISC-V 服务器芯片的采用情况",
        "context": "重点关注：已出货的服务器芯片、云服务商采用情况、软件生态系统",
        "toolsets": ["web"]
    },
    {
        "goal": "研究量子计算的实际应用",
        "context": "重点关注：纠错突破、真实用例、关键公司",
        "toolsets": ["web"]
    }
])
```

所有三个任务并行运行。每个子智能体独立搜索网络并返回摘要。父智能体随后将它们综合成一份连贯的简报。

---

## 模式：代码审查

将安全审查委托给一个上下文全新的子智能体，使其以无偏见的方式审查代码：

```
审查 src/auth/ 目录下的身份验证模块是否存在安全问题。
检查是否存在 SQL 注入、JWT 验证问题、密码处理问题以及会话管理问题。
修复发现的所有问题并运行测试。
```

关键在于 `context` 字段——它必须包含子智能体所需的一切信息：

```python
delegate_task(
    goal="审查 src/auth/ 目录下的安全问题并修复发现的问题",
    context="""项目位于 /home/user/webapp。使用 Python 3.11、Flask、PyJWT、bcrypt。
    身份验证相关文件：src/auth/login.py、src/auth/jwt.py、src/auth/middleware.py
    测试命令：pytest tests/auth/ -v
    重点关注：SQL 注入、JWT 验证、密码哈希、会话管理。
    修复发现的问题并确保测试通过。""",
    toolsets=["terminal", "file"]
)
```

:::warning 上下文问题
子智能体对你的对话**一无所知**。它们完全从零开始。如果你委托“修复我们刚才讨论的 bug”，子智能体根本不知道你指的是哪个 bug。务必显式传递文件路径、错误消息、项目结构和约束条件。
:::

---

## 模式：比较替代方案

并行评估同一问题的多种解决方案，然后选择最佳方案：

```
我需要为我们的 Django 应用添加全文搜索功能。请并行评估以下三种方案：
1. PostgreSQL tsvector（内置）
2. 通过 django-elasticsearch-dsl 使用 Elasticsearch
3. 通过 meilisearch-python 使用 Meilisearch

针对每种方案评估：设置复杂度、查询能力、资源需求以及维护开销。比较它们并推荐一种方案。
```

每个子智能体独立研究一个选项。由于它们彼此隔离，因此不会相互干扰——每种评估都基于其自身的优点。父智能体收到所有三个摘要后进行比较。

---

## 模式：多文件重构

将大型重构任务拆分给多个并行子智能体，每个子智能体负责代码库的不同部分：

```python
delegate_task(tasks=[
    {
        "goal": "将所有 API 端点处理程序重构为使用新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文件：src/handlers/users.py、src/handlers/auth.py、src/handlers/billing.py
        旧格式：return {"data": result, "status": "ok"}
        新格式：return APIResponse(data=result, status=200).to_dict()
        导入语句：from src.responses import APIResponse
        重构后运行测试：pytest tests/handlers/ -v""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "更新所有客户端 SDK 方法以适配新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文件：sdk/python/client.py、sdk/python/models.py
        旧解析方式：result = response.json()["data"]
        新解析方式：result = response.json()["data"]（键名相同，但需添加状态码检查）
        同时更新 sdk/python/tests/test_client.py""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "更新 API 文档以反映新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文档位置：docs/api/。格式：包含代码示例的 Markdown。
        将所有响应示例从旧格式更新为新格式。
        在 docs/api/overview.md 中添加“响应格式”一节，解释其结构。""",
        "toolsets": ["terminal", "file"]
    }
])
```

:::tip
每个子智能体拥有独立的终端会话。只要它们编辑的是不同文件，就可以在同一项目目录中工作而不会相互干扰。如果两个子智能体可能修改同一文件，请在并行工作完成后自行处理该文件。
:::

---

## 模式：先收集再分析

使用 `execute_code` 执行机械化的数据收集，然后将需要大量推理的分析任务委托出去：

```python
# 步骤 1：机械化收集（此处更适合使用 execute_code —— 无需推理）
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

# 保存供分析步骤使用
import json
with open("/tmp/ai-funding-data.json", "w") as f:
    json.dump({"search_results": results, "extracted": content["results"]}, f)
print(f"已收集 {len(results)} 条结果，已提取 {len(content['results'])} 页内容")
""")

# 步骤 2：需要大量推理的分析（此处更适合委托）
delegate_task(
    goal="分析 AI 融资数据并撰写市场报告",
    context="""原始数据位于 /tmp/ai-funding-data.json，包含关于 2026 年第一季度 AI 融资、收购和 IPO 的搜索结果及提取的网页内容。
    撰写一份结构化市场报告：重点交易、趋势、 notable 参与者以及展望。重点关注金额超过 1 亿美元的交易。""",
    toolsets=["terminal", "file"]
)
```

这通常是最有效的模式：`execute_code` 以低成本处理 10 多个顺序工具调用，然后由一个子智能体在干净的上下文中执行单一的高成本推理任务。

---

## 工具集选择

根据子智能体的需求选择工具集：

| 任务类型 | 工具集 | 原因 |
|----------|--------|------|
| 网络研究 | `["web"]` | 仅使用 web_search + web_extract |
| 代码工作 | `["terminal", "file"]` | Shell 访问 + 文件操作 |
| 全栈开发 | `["terminal", "file", "web"]` | 除消息传递外的所有功能 |
| 只读分析 | `["file"]` | 仅能读取文件，无法执行 Shell 命令 |

限制工具集可使子智能体保持专注，并防止意外的副作用（例如研究型子智能体执行 Shell 命令）。

---

## 约束条件

- **默认 3 个并行任务**：批次默认包含 3 个并发子智能体（可通过 config.yaml 中的 `delegation.max_concurrent_children` 配置，无硬性上限，仅有下限 1）
- **嵌套委托需显式启用**：叶节点子智能体（默认）无法调用 `delegate_task`、`clarify`、`memory`、`send_message` 或 `execute_code`。 orchestrator 子智能体（`role="orchestrator"`）保留 `delegate_task` 权限以进行进一步委托，但仅当 `delegation.max_spawn_depth` 高于默认值 1 时可用（支持 1-3 层）；其余四个操作仍被禁止。可通过 `delegation.orchestrator_enabled: false` 全局禁用。

### 调整并发度与深度

| 配置项 | 默认值 | 范围 | 效果 |
|--------|--------|------|------|
| `max_concurrent_children` | 3 | >=1 | 每次 `delegate_task` 调用的并行批次大小 |
| `max_spawn_depth` | 1 | 1-3 | 可进一步派生的委托层级数 |

示例：使用嵌套子智能体运行 30 个并行工作器：

```yaml
delegation:
  max_concurrent_children: 30
  max_spawn_depth: 2
```

- **独立终端** —— 每个子智能体拥有独立的终端会话，工作目录和状态均隔离
- **无对话历史** —— 子智能体仅能看到父智能体调用 `delegate_task` 时传递的 `goal` 和 `context`
- **默认 50 次迭代** —— 对于简单任务可降低 `max_iterations` 以节省成本

---

## 建议

**目标要具体。** “修复 bug” 过于模糊。“修复 api/handlers.py 第 47 行中 process_request() 因 parse_body() 返回 None 而引发的 TypeError” 才足以让子智能体开展工作。

**包含文件路径。** 子智能体不了解你的项目结构。务必包含相关文件的绝对路径、项目根目录以及测试命令。

**使用委托实现上下文隔离。** 有时你需要一个全新的视角。委托迫使你清晰地阐述问题，而子智能体将以无先入为主的方式处理它。

**检查结果。** 子智能体的摘要仅为其自身总结。如果子智能体声称“已修复 bug 且测试通过”，请自行运行测试或查看差异以验证。

---

*有关完整的委托参考 —— 包括所有参数、ACP 集成和高级配置 —— 请参阅 [子智能体委托](/docs/user-guide/features/delegation)。*