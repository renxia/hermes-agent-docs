---
sidebar_position: 13
title: "委派与并行工作"
description: "何时以及如何使用子智能体委派——用于并行研究、代码审查和多文件工作的模式"
---

# 委派与并行工作

Hermes可以生成隔离的子智能体来并行处理任务。每个子智能体拥有自己的对话、终端会话和工具集。只有最终的摘要会被传回——中间的工具调用永远不会进入您的上下文窗口。

完整的功能参考，请参阅[子智能体委派](/user-guide/features/delegation)。

---

## 何时进行委派

**适合委派的情况：**
- 推理密集型的子任务（调试、代码审查、研究综合）
- 可能会导致中间数据淹没您上下文的任务
- 并行的独立工作流（同时研究A和B）
- 希望智能体以无偏见方式接触的“全新上下文”任务

**使用其他方式：**
- 单次工具调用 → 直接使用工具即可
- 步骤间有逻辑的机械性多步骤工作 → `execute_code`
- 需要用户交互的任务 → 子智能体无法使用 `clarify`
- 快速的文件编辑 → 直接进行
- 必须在当前轮次结束后继续运行的持久性长期工作 → `cronjob` 或 `terminal(background=True, notify_on_complete=True)`。`delegate_task` 是**同步的**：如果父轮次被中断，活跃的子智能体将被取消，其工作也将被丢弃。

---

# 并行研究模式

同时研究三个主题并获取结构化摘要：

```
并行研究以下三个主题：
1. 浏览器之外的 WebAssembly 当前状态
2. 2025 年 RISC-V 服务器芯片采用情况
3. 实际量子计算应用

聚焦近期发展和关键参与者。
```

在幕后，Hermes 使用：

```python
delegate_task(tasks=[
    {
        "goal": "研究 2025 年浏览器之外的 WebAssembly",
        "context": "聚焦：运行时 (Wasmtime, Wasmer)、云/边缘用例、WASI 进展",
        "toolsets": ["web"]
    },
    {
        "goal": "研究 RISC-V 服务器芯片采用情况",
        "context": "聚焦：已出货的服务器芯片、采用的云提供商、软件生态系统",
        "toolsets": ["web"]
    },
    {
        "goal": "研究实际量子计算应用",
        "context": "聚焦：纠错突破、真实世界用例、关键公司",
        "toolsets": ["web"]
    }
])
```

三者并发执行。每个子智能体独立搜索网络并返回摘要。父智能体随后将它们整合成一份连贯的简报。

---

## 模式：代码审查

将安全审查委托给一个拥有全新上下文的子智能体，该智能体能够以无偏见的方式审视代码：

```
审查 src/auth/ 目录下的身份验证模块，检查安全问题。
检查 SQL 注入、JWT 验证问题、密码处理和会话管理。修复发现的任何问题并运行测试。
```

关键在于 `context` 字段——它必须包含子智能体所需的所有信息：

```python
delegate_task(
    goal="审查 src/auth/ 的安全问题并修复发现的问题",
    context="""项目位于 /home/user/webapp。使用 Python 3.11、Flask、PyJWT、bcrypt。
    身份验证文件：src/auth/login.py、src/auth/jwt.py、src/auth/middleware.py
    测试命令：pytest tests/auth/ -v
    聚焦：SQL 注入、JWT 验证、密码哈希、会话管理。
    修复发现的问题并验证测试通过。""",
    toolsets=["terminal", "file"]
)
```

:::warning 上下文问题
子智能体**完全不了解**你们的对话内容。它们是从零开始的。如果你委托“修复我们一直在讨论的那个 bug”，子智能体完全不知道你指的是哪个 bug。务必明确传递文件路径、错误信息、项目结构和约束条件。
:::

---

## 模式：比较方案

并行评估针对同一问题的多种方案，然后选择最优方案：

```
我需要为我们的 Django 应用添加全文搜索功能。并行评估三种方案：
1. PostgreSQL tsvector（内置）
2. 通过 django-elasticsearch-dsl 使用 Elasticsearch
3. 通过 meilisearch-python 使用 Meilisearch

针对每种方案评估：设置复杂度、查询能力、资源需求和维护开销。比较它们并推荐一个。
```

每个子智能体独立研究一个选项。由于它们是隔离的，不存在交叉污染——每个评估都基于其自身优点。父智能体获取所有三个摘要并进行比较。

---

## 模式：多文件重构

将大型重构任务拆分给并行子智能体处理，每个负责代码库的不同部分：

```python
delegate_task(tasks=[
    {
        "goal": "将所有 API 端点处理程序重构为使用新的响应格式",
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
        旧解析方式：result = response.json()["data"]
        新解析方式：result = response.json()["data"]（键名相同，但增加状态码检查）
        同时更新 sdk/python/tests/test_client.py""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "更新 API 文档以反映新的响应格式",
        "context": """项目位于 /home/user/api-server。
        文档位于：docs/api/。格式：带代码示例的 Markdown。
        将所有响应示例从旧格式更新为新格式。
        在 docs/api/overview.md 中添加“响应格式”部分，解释其 schema。""",
        "toolsets": ["terminal", "file"]
    }
])
```

:::tip
每个子智能体拥有自己的终端会话。它们可以在同一个项目目录上工作而不会相互干扰——只要它们编辑的是不同的文件。如果两个子智能体可能会修改同一个文件，请在并行工作完成后自己处理该文件。
:::

---

## 模式：收集后分析

使用 `execute_code` 进行机械性数据收集，然后委托推理密集型的分析任务：

```python
# 步骤 1：机械性收集（execute_code 更适合这里——无需推理）
execute_code("""
from hermes_tools import web_search, web_extract

results = []
for query in ["AI funding Q1 2026", "AI startup acquisitions 2026", "AI IPOs 2026"]:
    r = web_search(query, limit=5)
    for item in r["data"]["web"]:
        results.append({"title": item["title"], "url": item["url"], "desc": item["description"]})

# 从前 5 个最相关的结果中提取完整内容
urls = [r["url"] for r in results[:5]]
content = web_extract(urls)

# 保存供分析步骤使用
import json
with open("/tmp/ai-funding-data.json", "w") as f:
    json.dump({"search_results": results, "extracted": content["results"]}, f)
print(f"收集了 {len(results)} 条结果，提取了 {len(content['results'])} 个页面内容")
""")

# 步骤 2：推理密集型分析（委托更合适）
delegate_task(
    goal="分析 AI 资金数据并撰写市场报告",
    context="""原始数据位于 /tmp/ai-funding-data.json，包含关于 2026 年第一季度 AI 资金、
    收购和 IPO 的搜索结果和提取的网页内容。
    撰写一份结构化的市场报告：关键交易、趋势、重要参与者和展望。
    聚焦超过 1 亿美元的交易。""",
    toolsets=["terminal", "file"]
)
```

这通常是最高效的模式：`execute_code` 以低成本处理 10 多个连续的工具调用，然后一个子智能体在干净的上下文中执行单次昂贵的推理任务。

---

## 工具集选择

根据子智能体的需求选择工具集：

| 任务类型 | 工具集 | 原因 |
|----------|--------|------|
| 网络研究 | `["web"]` | 仅需 web_search + web_extract |
| 代码工作 | `["terminal", "file"]` | Shell 访问 + 文件操作 |
| 全栈开发 | `["terminal", "file", "web"]` | 除消息传递外的所有功能 |
| 只读分析 | `["file"]` | 仅能读取文件，无 Shell |

限制工具集可以让子智能体保持专注，并防止意外的副作用（例如研究子智能体运行 Shell 命令）。

---

## 约束条件

- **默认 3 个并行任务**：批处理默认为 3 个并发子智能体（通过 config.yaml 中的 `delegation.max_concurrent_children` 配置，无硬上限，仅下限为 1）
- **嵌套委托为可选功能**：叶子子智能体（默认）不能调用 `delegate_task`、`clarify`、`memory`、`send_message` 或 `execute_code`。编排器子智能体（`role="orchestrator"`）保留 `delegate_task` 以进行进一步委托，但仅当 `delegation.max_spawn_depth` 提升到默认值 1 以上时才可使用（支持 1-3）；其他四个功能仍被阻止。通过 `delegation.orchestrator_enabled: false` 全局禁用。

### 调整并发度和深度

| 配置 | 默认值 | 范围 | 效果 |
|------|--------|------|------|
| `max_concurrent_children` | 3 | >=1 | 每次 `delegate_task` 调用的并行批大小 |
| `max_spawn_depth` | 1 | 1-3 | 可以产生进一步委托的层级数 |

示例：使用嵌套子智能体运行 30 个并行工作者：

```yaml
delegation:
  max_concurrent_children: 30
  max_spawn_depth: 2
```

- **独立的终端** — 每个子智能体拥有自己的终端会话，具有独立的工作目录和状态
- **无对话历史** — 子智能体仅能看到父智能体在调用 `delegate_task` 时传递的 `goal` 和 `context`
- **默认 50 次迭代** — 对于简单任务，可以将 `max_iterations` 设置得较低以节省成本
- **非持久化** — `delegate_task` 是同步的，并在父智能体回合内运行。如果父智能体被中断（新用户消息、`/stop`、`/new`），所有活动子智能体都会被取消（`status="interrupted"`），其工作将被丢弃。对于必须在当前回合之后存续的工作，请使用 `cronjob` 或 `terminal(background=True, notify_on_complete=True)`。

---
## 技巧

**目标要具体。** “修复 bug”过于模糊。“修复 api/handlers.py 第 47 行的 TypeError，该行中 process_request() 从 parse_body() 接收到了 None”为子智能体提供了足够的信息来开展工作。

**包含文件路径。** 子智能体不知道你的项目结构。始终包含相关文件、项目根目录和测试命令的绝对路径。

**利用委托实现上下文隔离。** 有时你需要一个全新的视角。委托迫使你清晰地阐述问题，子智能体则在没有你们对话中积累的假设的情况下面对它。

**检查结果。** 子智能体的摘要仅仅是摘要。如果子智能体说“已修复 bug 且测试通过”，请通过亲自运行测试或查看差异来验证。

---
*完整的委托参考文档——所有参数、ACP 集成和高级配置——请参见[子智能体委托](/user-guide/features/delegation)。*