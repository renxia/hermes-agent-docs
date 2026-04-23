---
sidebar_position: 7
title: "子智能体委派"
description: "使用 delegate_task 创建隔离的子智能体以并行处理工作流"
---

# 子智能体委派

`delegate_task` 工具会创建具有隔离上下文、受限工具集和独立终端会话的子 AIAgent 实例。每个子智能体都会获得全新的对话并独立工作——只有其最终摘要会进入父智能体的上下文。

## 单个任务

```python
delegate_task(
    goal="调试测试失败的原因",
    context="错误：test_foo.py 第 42 行断言失败",
    toolsets=["terminal", "file"]
)
```

## 并行批处理

默认最多 3 个并发子智能体（可配置，无硬性上限）：

```python
delegate_task(tasks=[
    {"goal": "研究主题 A", "toolsets": ["web"]},
    {"goal": "研究主题 B", "toolsets": ["web"]},
    {"goal": "修复构建", "toolsets": ["terminal", "file"]}
])
```

## 子智能体上下文如何工作

:::warning 关键：子智能体一无所知
子智能体以**完全全新的对话**开始。他们对父智能体的对话历史、之前的工具调用或委派前讨论的任何内容一无所知。子智能体的唯一上下文来自父智能体调用 `delegate_task` 时填充的 `goal` 和 `context` 字段。
:::

这意味着父智能体必须在调用中传递子智能体所需的**所有内容**：

```python
# 错误 - 子智能体不知道“错误”是什么
delegate_task(goal="修复错误")

# 正确 - 子智能体拥有所需的所有上下文
delegate_task(
    goal="修复 api/handlers.py 中的 TypeError",
    context="""文件 api/handlers.py 第 47 行存在 TypeError：
    'NoneType' 对象没有属性 'get'。
    函数 process_request() 从 parse_body() 接收一个字典，
    但当 Content-Type 缺失时，parse_body() 返回 None。
    项目位于 /home/user/myproject，使用 Python 3.11。"""
)
```

子智能体会收到一个由你的目标和上下文构建的专注系统提示，指示其完成任务，并提供其执行的操作、发现的内容、修改的文件以及遇到的任何问题的结构化摘要。

## 实际示例

### 并行研究

同时研究多个主题并收集摘要：

```python
delegate_task(tasks=[
    {
        "goal": "研究 2025 年 WebAssembly 的现状",
        "context": "重点关注：浏览器支持、非浏览器运行时、语言支持",
        "toolsets": ["web"]
    },
    {
        "goal": "研究 2025 年 RISC-V 的采用情况",
        "context": "重点关注：服务器芯片、嵌入式系统、软件生态系统",
        "toolsets": ["web"]
    },
    {
        "goal": "研究 2025 年量子计算的进展",
        "context": "重点关注：纠错突破、实际应用、关键参与者",
        "toolsets": ["web"]
    }
])
```

### 代码审查 + 修复

将审查并修复的工作流委派给一个全新的上下文：

```python
delegate_task(
    goal="审查身份验证模块的安全问题并修复发现的任何问题",
    context="""项目位于 /home/user/webapp。
    身份验证模块文件：src/auth/login.py、src/auth/jwt.py、src/auth/middleware.py。
    该项目使用 Flask、PyJWT 和 bcrypt。
    重点关注：SQL 注入、JWT 验证、密码处理、会话管理。
    修复发现的任何问题并运行测试套件 (pytest tests/auth/)。""",
    toolsets=["terminal", "file"]
)
```

### 多文件重构

委派一个大型重构任务，以免淹没父智能体的上下文：

```python
delegate_task(
    goal="重构 src/ 中所有 Python 文件，将 print() 替换为适当的日志记录",
    context="""项目位于 /home/user/myproject。
    使用 'logging' 模块，logger = logging.getLogger(__name__)。
    将 print() 调用替换为适当的日志级别：
    - print(f"Error: ...") -> logger.error(...)
    - print(f"Warning: ...") -> logger.warning(...)
    - print(f"Debug: ...") -> logger.debug(...)
    - 其他 print -> logger.info(...)
    不要更改测试文件或 CLI 输出中的 print()。
    之后运行 pytest 以验证没有破坏任何内容。""",
    toolsets=["terminal", "file"]
)
```

## 批处理模式详情

当你提供 `tasks` 数组时，子智能体会使用线程池**并行**运行：

- **最大并发数：** 默认 3 个任务（可通过 `delegation.max_concurrent_children` 或 `DELEGATION_MAX_CONCURRENT_CHILDREN` 环境变量配置；下限为 1，无硬性上限）。超过限制的批次会返回工具错误，而不是被静默截断。
- **线程池：** 使用 `ThreadPoolExecutor`，并将配置的并发限制作为最大工作线程数
- **进度显示：** 在 CLI 模式下，树状视图会实时显示每个子智能体的工具调用，并带有每个任务的完成行。在网关模式下，进度会被分批并中继到父智能体的进度回调
- **结果排序：** 结果按任务索引排序，以匹配输入顺序，而不管完成顺序如何
- **中断传播：** 中断父智能体（例如，发送新消息）会中断所有活跃的子智能体

单任务委派直接运行，无需线程池开销。

## 模型覆盖

你可以通过 `config.yaml` 为子智能体配置不同的模型——这对于将简单任务委派给更便宜/更快的模型很有用：

```yaml
# 在 ~/.hermes/config.yaml 中
delegation:
  model: "google/gemini-flash-2.0"    # 为子智能体使用更便宜的模型
  provider: "openrouter"              # 可选：将子智能体路由到不同的提供商
```

如果省略，子智能体会使用与父智能体相同的模型。

## 工具集选择提示

`toolsets` 参数控制子智能体可以访问哪些工具。根据任务选择：

| 工具集模式 | 使用场景 |
|----------------|----------|
| `["terminal", "file"]` | 代码工作、调试、文件编辑、构建 |
| `["web"]` | 研究、事实核查、文档查找 |
| `["terminal", "file", "web"]` | 全栈任务（默认） |
| `["file"]` | 只读分析、无需执行的代码审查 |
| `["terminal"]` | 系统管理、进程管理 |

无论指定什么，某些工具集都会被阻止用于子智能体：
- `delegation` — 对叶子子智能体（默认）被阻止。为 `role="orchestrator"` 子智能体保留，受 `max_spawn_depth` 限制 — 参见下面的[深度限制和嵌套编排](#depth-limit-and-nested-orchestration)。
- `clarify` — 子智能体无法与用户交互
- `memory` — 无法写入共享持久内存
- `code_execution` — 子智能体应逐步推理
- `send_message` — 无跨平台副作用（例如，发送 Telegram 消息）

## 最大迭代次数

每个子智能体都有一个迭代限制（默认：50），用于控制它可以进行多少次工具调用轮次：

```python
delegate_task(
    goal="快速文件检查",
    context="检查 /etc/nginx/nginx.conf 是否存在并打印其前 10 行",
    max_iterations=10  # 简单任务，不需要很多轮次
)
```

## 深度限制和嵌套编排

默认情况下，委派是**扁平的**：父智能体（深度 0）创建子智能体（深度 1），而这些子智能体无法进一步委派。这可以防止失控的递归委派。

对于多阶段工作流（研究 → 综合，或对子问题的并行编排），父智能体可以创建**编排器**子智能体，这些子智能体*可以*委派自己的工作器：

```python
delegate_task(
    goal="调查三种代码审查方法并推荐一种",
    role="orchestrator",  # 允许此子智能体创建自己的工作器
    context="...",
)
```

- `role="leaf"`（默认）：子智能体无法进一步委派 — 与扁平委派行为相同。
- `role="orchestrator"`：子智能体保留 `delegation` 工具集。受 `delegation.max_spawn_depth` 限制（默认 **1** = 扁平，因此在默认情况下 `role="orchestrator"` 无效）。将 `max_spawn_depth` 提高到 2 以允许编排器子智能体创建叶子孙智能体；提高到 3 以允许三层（上限）。
- `delegation.orchestrator_enabled: false`：全局关闭开关，强制每个子智能体为 `leaf`，无论 `role` 参数如何。

**成本警告：** 使用 `max_spawn_depth: 3` 和 `max_concurrent_children: 3` 时，树可以达到 3×3×3 = 27 个并发叶子智能体。每增加一层都会使支出倍增 — 请有意提高 `max_spawn_depth`。

## 关键属性

- 每个子智能体都会获得其**自己的终端会话**（与父智能体分离）
- **嵌套委派是选择性的** — 只有 `role="orchestrator"` 子智能体可以进一步委派，并且只有在 `max_spawn_depth` 从其默认值 1（扁平）提高时才可以。使用 `orchestrator_enabled: false` 全局禁用。
- 叶子子智能体**无法**调用：`delegate_task`、`clarify`、`memory`、`send_message`、`execute_code`。编排器子智能体保留 `delegate_task`，但仍无法使用其他四个。
- **中断传播** — 中断父智能体会中断所有活跃的子智能体（包括编排器下的孙智能体）
- 只有最终摘要会进入父智能体的上下文，从而保持令牌使用效率
- 子智能体继承父智能体的** API 密钥、提供商配置和凭据池**（支持在速率限制时轮换密钥）

## 委派 vs execute_code

| 因素 | delegate_task | execute_code |
|--------|--------------|-------------|
| **推理** | 完整的 LLM 推理循环 | 仅 Python 代码执行 |
| **上下文** | 全新的隔离对话 | 无对话，仅脚本 |
| **工具访问** | 所有非阻塞工具（带推理） | 通过 RPC 的 7 个工具，无推理 |
| **并行性** | 默认 3 个并发子智能体（可配置） | 单个脚本 |
| **最适合** | 需要判断的复杂任务 | 机械的多步骤管道 |
| **令牌成本** | 较高（完整 LLM 循环） | 较低（仅返回 stdout） |
| **用户交互** | 无（子智能体无法澄清） | 无 |

**经验法则：** 当子任务需要推理、判断或多步骤问题解决时，使用 `delegate_task`。当你需要机械数据处理或脚本化工作流时，使用 `execute_code`。

## 配置

```yaml
# 在 ~/.hermes/config.yaml 中
delegation:
  max_iterations: 50                        # 每个子智能体的最大轮次（默认：50）
  # max_concurrent_children: 3              # 每批并行子智能体（默认：3）
  # max_spawn_depth: 1                      # 树深度（1-3，默认 1 = 扁平）。提高到 2 以允许编排器子智能体创建叶子；提高到 3 以允许三层。
  # orchestrator_enabled: true              # 禁用以强制所有子智能体为叶子角色。
  model: "google/gemini-3-flash-preview"             # 可选的提供商/模型覆盖
  provider: "openrouter"                             # 可选的内置提供商

# 或者使用直接的自定义端点而不是提供商：
delegation:
  model: "qwen2.5-coder"
  base_url: "http://localhost:1234/v1"
  api_key: "local-key"
```

:::tip
智能体会根据任务复杂性自动处理委派。你无需明确要求它委派 — 当有意义时，它会自动执行。
:::