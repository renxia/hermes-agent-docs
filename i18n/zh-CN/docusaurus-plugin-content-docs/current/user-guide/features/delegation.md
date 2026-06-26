---
sidebar_position: 7
title: "Subagent Delegation"
description: "Spawn isolated child agents for parallel workstreams with delegate_task"
---

# 子智能体委托

`delegate_task` 工具可生成具有独立上下文、受限工具集和独立终端会话的子 AIAgent 实例。每个子智能体获得全新的对话并独立工作——仅其最终摘要会进入父智能体的上下文。

## 单任务

```python
delegate_task(
    goal="Debug why tests fail",
    context="Error: assertion in test_foo.py line 42",
    toolsets=["terminal", "file"]
)
```

## 并行批处理

默认最多 3 个并发子智能体（可配置，无硬性上限）：

```python
delegate_task(tasks=[
    {"goal": "Research topic A", "toolsets": ["web"]},
    {"goal": "Research topic B", "toolsets": ["web"]},
    {"goal": "Fix the build", "toolsets": ["terminal", "file"]}
])
```

## 子智能体上下文如何工作

:::warning 关键：子智能体一无所知
子智能体以**全新的对话**启动。它们对父智能体的对话历史、之前的工具调用或委托前讨论的任何内容一无所知。子智能体的唯一上下文来自父智能体调用 `delegate_task` 时填充的 `goal` 和 `context` 字段。
:::

这意味着父智能体必须在调用时传递子智能体所需的**一切**：

```python
# 糟糕——子智能体完全不知道"错误"是什么
delegate_task(goal="Fix the error")

# 良好——子智能体拥有所需的全部上下文
delegate_task(
    goal="Fix the TypeError in api/handlers.py",
    context="""The file api/handlers.py has a TypeError on line 47:
    'NoneType' object has no attribute 'get'.
    The function process_request() receives a dict from parse_body(),
    but parse_body() returns None when Content-Type is missing.
    The project is at /home/user/myproject and uses Python 3.11."""
)
```

子智能体收到一个基于你的目标和上下文构建的聚焦系统提示，指示其完成任务并提供结构化摘要，包括做了什么、发现了什么、修改了哪些文件以及遇到了哪些问题。

## 实际示例

### 并行研究

同时研究多个主题并收集摘要：

```python
delegate_task(tasks=[
    {
        "goal": "Research the current state of WebAssembly in 2025",
        "context": "Focus on: browser support, non-browser runtimes, language support",
        "toolsets": ["web"]
    },
    {
        "goal": "Research the current state of RISC-V adoption in 2025",
        "context": "Focus on: server chips, embedded systems, software ecosystem",
        "toolsets": ["web"]
    },
    {
        "goal": "Research quantum computing progress in 2025",
        "context": "Focus on: error correction breakthroughs, practical applications, key players",
        "toolsets": ["web"]
    }
])
```

### 代码审查 + 修复

将审查和修复工作流委托给一个全新的上下文：

```python
delegate_task(
    goal="Review the authentication module for security issues and fix any found",
    context="""Project at /home/user/webapp.
    Auth module files: src/auth/login.py, src/auth/jwt.py, src/auth/middleware.py.
    The project uses Flask, PyJWT, and bcrypt.
    Focus on: SQL injection, JWT validation, password handling, session management.
    Fix any issues found and run the test suite (pytest tests/auth/).""",
    toolsets=["terminal", "file"]
)
```

### 多文件重构

委托一个会淹没父智能体上下文的大型重构任务：

```python
delegate_task(
    goal="Refactor all Python files in src/ to replace print() with proper logging",
    context="""Project at /home/user/myproject.
    Use the 'logging' module with logger = logging.getLogger(__name__).
    Replace print() calls with appropriate log levels:
    - print(f"Error: ...") -> logger.error(...)
    - print(f"Warning: ...") -> logger.warning(...)
    - print(f"Debug: ...") -> logger.debug(...)
    - Other prints -> logger.info(...)
    Don't change print() in test files or CLI output.
    Run pytest after to verify nothing broke.""",
    toolsets=["terminal", "file"]
)
```

## 批处理模式详情

当你提供一个 `tasks` 数组时，子智能体会使用线程池**并行**运行：

- **最大并发数：** 默认 3 个任务（可通过 `delegation.max_concurrent_children` 配置或 `DELEGATION_MAX_CONCURRENT_CHILDREN` 环境变量设置；下限为 1，无硬性上限）。超过限制的批次会返回工具错误，而非静默截断。
- **线程池：** 使用 `ThreadPoolExecutor`，以上配置的并发数作为最大工作线程数
- **进度显示：** 在 CLI 模式下，树形视图实时显示每个子智能体的工具调用及每个任务的完成行。在网关模式下，进度被批量传递到父智能体的进度回调
- **结果排序：** 结果按任务索引排序以匹配输入顺序，无论完成顺序如何
- **中断传播：** 中断父智能体（例如发送新消息）会中断所有活跃的子智能体

单任务委托直接运行，无线程池开销。

## 模型覆盖

你可以通过 `config.yaml` 为子智能体配置不同的模型——适合将简单任务委托给更便宜/更快的模型：

```yaml
# 在 ~/.hermes/config.yaml 中
delegation:
  model: "google/gemini-flash-2.0"    # 用于子智能体的更便宜模型
  provider: "openrouter"              # 可选：将子智能体路由到不同的提供商
```

如果省略，子智能体使用与父智能体相同的模型。

## 工具集选择提示

`toolsets` 参数控制子智能体可以访问哪些工具。根据任务选择：

| 工具集模式 | 使用场景 |
|----------------|----------|
| `["terminal", "file"]` | 代码工作、调试、文件编辑、构建 |
| `["web"]` | 研究、事实核查、文档查找 |
| `["terminal", "file", "web"]"]` | 全栈任务（默认） |
| `["file"]` | 只读分析、不执行的代码审查 |
| `["terminal"]` | 系统管理、进程管理 |

无论指定如何，某些工具集对子智能体是禁用的：
- `delegation` ——对叶子子智能体（默认）禁用。对于 `role="orchestrator"` 的子智能体保留，受 `max_spawn_depth` 限制——见下文[深度限制和嵌套编排](#深度限制和嵌套编排)。
- `clarify` ——子智能体不能与用户交互
- `memory` ——不能写入共享持久化记忆
- `code_execution` ——子智能体应逐步推理
- `send_message` ——不产生跨平台副作用（例如发送 Telegram 消息）

## 最大迭代次数

每个子智能体都有一个迭代限制（默认：50），控制其可以进行多少轮工具调用：

```python
delegate_task(
    goal="Quick file check",
    context="Check if /etc/nginx/nginx.conf exists and print its first 10 lines",
    max_iterations=10  # 简单任务，不需要太多轮次
)
```

## 子智能体超时

默认情况下，子智能体**没有墙钟超时限制**。子智能体仅因其实际操作而失败——API 错误、工具错误或达到其迭代预算——而不会因委托级别的计时器而失败。早期版本曾附带硬上限（300 秒，后改为 600 秒），不断在任务进行中点杀死正常工作的子智能体：深度代码审查、大型研究分支和慢推理模型通常需要超过 10 分钟，同时一直在稳步推进。

真正卡住的子智能体仍然会被检测到：当子智能体无进展（无 API 调用、无工具启动）时，心跳陈旧监视器会停止刷新父智能体的活动状态，让网关非活动超时触发真正卡住的worker。

如果你仍然需要硬上限（例如对无人值守的定时任务委托进行成本控制），可以按安装选择启用：

```yaml
delegation:
  child_timeout_seconds: 0     # 默认：0 = 无超时
  # child_timeout_seconds: 1800  # 选择启用硬上限（下限 30 秒）
```

正值对每个子智能体强制执行硬墙钟限制；`0` 或负值则禁用。

:::tip 零调用超时的诊断转储
配置了硬上限后，如果子智能体在**零**次 API 调用后超时（通常是：提供商不可达、认证失败或工具模式被拒绝），`delegate_task` 会将结构化诊断信息写入 `~/.hermes/logs/subagent-timeout-<session>-<timestamp>.log`，包含子智能体的配置快照、凭据解析跟踪和任何早期错误信息。比之前的静默超时行为更容易定位根因。
:::

## 监控运行中的子智能体（`/agents`）

TUI 附带一个 `/agents` 覆盖层（别名 `/tasks`），将递归的 `delegate_task` 分支转变为一流的审计界面：

- 按父智能体分组的运行中和最近完成的子智能体的实时树形视图
- 每个分支的费用、令牌和文件操作汇总
- 终止和暂停控制——取消特定子智能体而不中断其兄弟
- 事后审查：即使在子智能体已返回父智能体后，也可以逐步查看每个子智能体的逐轮历史

经典 CLI 仅将 `/agents` 打印为文本摘要；TUI 中覆盖层才真正大放异彩。参见 [TUI — 斜杠命令](/user-guide/tui#slash-commands)。

## 深度限制和嵌套编排

默认情况下，委托是**扁平的**：父智能体（深度 0）生成子智能体（深度 1），这些子智能体不能再委托。这可以防止失控的递归委托。

对于多阶段工作流（研究 → 综合，或对子问题进行并行编排），父智能体可以生成**编排器**子智能体，这些子智能体*可以*委托自己的worker：

```python
delegate_task(
    goal="Survey three code review approaches and recommend one",
    role="orchestrator",  # 允许该子智能体生成自己的worker
    context="...",
)
```

- `role="leaf"`（默认）：子智能体不能进一步委托——与扁平委托行为相同。
- `role="orchestrator"`：子智能体保留 `delegation` 工具集。受 `delegation.max_spawn_depth` 控制（默认 **1** = 扁平，因此在默认值下 `role="orchestrator"` 无效）。将 `max_spawn_depth` 提升到 2 以允许编排器子智能体生成叶子孙智能体；3+ 用于更深的树。没有上限——成本是实际限制。
- `delegation.orchestrator_enabled: false`：全局开关，强制所有子智能体为 `leaf`，无论 `role` 参数如何。

**费用警告：** 在 `max_spawn_depth: 3` 和 `max_concurrent_children: 3` 下，树可以达到 3×3×3 = 27 个并发叶子智能体。每增加一级都会倍增支出——请谨慎提高 `max_spawn_depth`。

## 生命周期和持久性

:::warning delegate_task 是同步的——非持久化的
`delegate_task` 在**父智能体的当前轮次内运行**。它会阻塞父智能体，直到每个子智能体完成（或被取消）。它**不是**后台任务队列：

- 如果父智能体被中断（用户发送新消息、`/stop`、`/new`），所有活跃的子智能体都会被取消并返回 `status="interrupted"`。它们的进行中工作会被丢弃。
- 子智能体在父智能体轮次结束后**不会**继续运行。
- 被取消的子智能体会返回结构化结果（`status="interrupted"`，`exit_reason="interrupted"`），但由于父智能体也被中断，该结果通常无法进入用户可见的回复。

对于**必须承受中断或超越当前轮次的持久化长时间运行工作**，请使用：

- `cronjob`（action=`create`）——调度独立的智能体运行；不受父智能体轮次中断的影响。
- `terminal(background=True, notify_on_complete=True)` ——长时间运行的 shell 命令，在智能体做其他事情时继续运行。
:::

## 关键特性

- 每个子智能体获得**独立的终端会话**（与父智能体分离）
- **嵌套委托是选择启用的**——只有 `role="orchestrator"` 的子智能体才能进一步委托，且仅在 `max_spawn_depth` 从默认值 1（扁平）提升时。可通过 `orchestrator_enabled: false` 全局禁用。
- 叶子子智能体**不能**调用：`delegate_task`、`clarify`、`memory`、`send_message`、`execute_code`。编排器子智能体保留 `delegate_task`，但仍不能使用后四个。
- **中断传播**——中断父智能体会中断所有活跃的子智能体（包括编排器下的孙智能体）
- 只有最终摘要进入父智能体的上下文，保持令牌使用高效
- 子智能体继承父智能体的**API 密钥、提供商配置和凭据池**（支持速率限制时的密钥轮换）

## 委托 vs execute_code

| 因素 | delegate_task | execute_code |
|--------|--------------|-------------|
| **推理能力** | 完整的 LLM 推理循环 | 仅执行 Python 代码 |
| **上下文** | 全新的独立对话 | 无对话，仅有脚本 |
| **工具访问** | 所有未被阻止的工具，带推理能力 | 通过 RPC 访问 7 个工具，无推理 |
| **并行性** | 默认 3 个并发子智能体（可配置） | 单一脚本 |
| **适用场景** | 需要判断力的复杂任务 | 机械式多步骤流水线 |
| **Token 开销** | 较高（完整 LLM 循环） | 较低（仅返回标准输出） |
| **用户交互** | 无（子智能体无法追问） | 无 |

**经验法则：** 当子任务需要推理、判断或多步骤问题解决时，使用 `delegate_task`。当需要机械式数据处理或脚本化工作流时，使用 `execute_code`。

## 配置

```yaml
# 在 ~/.hermes/config.yaml 中
delegation:
  max_iterations: 50                        # 每个子智能体的最大轮次（默认：50）
  # max_concurrent_children: 3              # 每批并行子智能体数量（默认：3）
  # max_spawn_depth: 1                      # 树深度（下限 1，无上限，默认 1 = 扁平结构）。设为 2 以允许编排器智能体生成叶智能体；3+ 用于更深的树结构。
  # orchestrator_enabled: true              # 禁用可强制所有子智能体为叶角色。
  model: "google/gemini-3-flash-preview"             # 可选的提供商/模型覆盖
  provider: "openrouter"                             # 可选的内置提供商
  api_mode: anthropic_messages                       # 可选；从 base_url 自动检测 anthropic_messages 端点

# 或者直接使用自定义端点而非提供商：
delegation:
  model: "qwen2.5-coder"
  base_url: "http://localhost:1234/v1"
  api_key: "local-key"
  # api_mode: "anthropic_messages"  # 可选。base_url 的 Wire 协议覆盖（"chat_completions"、"codex_responses" 或 "anthropic_messages"）。留空则从 URL 自动检测（例如 /anthropic 后缀）。对于启发式规则无法分类的端点（Azure AI Foundry、MiniMax、Zhipu GLM、LiteLLM 代理等），需显式设置。
```

当 `base_url` 指向兼容 Anthropic 的端点时——例如以 `/anthropic` 结尾的路径、Azure Foundry Claude 路由或 MiniMax `/anthropic` 代理——`api_mode` 会被自动检测为 `anthropic_messages`，子智能体将使用正确的 Wire 格式，无需额外设置。当自动检测判断错误时（极少见），需显式设置 `api_mode`。

:::tip
智能体将根据任务复杂度自动处理委托。您无需明确要求它进行委托——它会在合适的时候自动执行。
:::