---
sidebar_position: 7
title: "子智能体委托"
description: "通过delegate_task生成隔离的子智能体以并行处理工作流"
---

# 子智能体委托

`delegate_task` 工具能够生成具有独立上下文、受限工具集和独立终端会话的子AIAgent实例。每个子智能体都将获得全新的会话环境并独立工作——仅其最终摘要会进入父级上下文。

## 单任务示例

```python
delegate_task(
    goal="调试测试失败原因",
    context="错误：test_foo.py第42行的断言失败",
    toolsets=["终端", "文件"]
)
```

## 并行批处理

默认最多3个并发子智能体（可配置，无硬性上限）：

```python
delegate_task(tasks=[
    {"goal": "研究主题A", "toolsets": ["web"]},
    {"goal": "研究主题B", "toolsets": ["web"]},
    {"goal": "修复构建", "toolsets": ["terminal", "file"]}
])
```

## 子智能体上下文如何工作

:::warning 关键：子智能体一无所知
子智能体启动时拥有一个**完全全新的对话**。它们对父智能体的对话历史、先前的工具调用或委托前讨论的任何内容一无所知。子智能体的唯一上下文来自父智能体调用`delegate_task`时填充的`goal`和`context`字段。
:::

这意味着父智能体必须在调用时传递子智能体所需的**所有**信息：

```python
# 糟糕 - 子智能体不知道"错误"是什么
delegate_task(goal="修复错误")

# 良好 - 子智能体拥有完成任务所需的所有上下文
delegate_task(
    goal="修复 api/handlers.py 中的 TypeError",
    context="""文件 api/handlers.py 第47行有一个 TypeError：
    'NoneType' 对象没有 'get' 属性。
    函数 process_request() 从 parse_body() 接收一个字典，
    但当缺少 Content-Type 时，parse_body() 返回 None。
    项目位于 /home/user/myproject，使用 Python 3.11。"""
)
```

子智能体会收到一个基于您的目标和上下文构建的专注系统提示，指示它完成任务并提供关于所做工作、发现内容、修改的文件以及遇到的任何问题的结构化摘要。

## 实际示例

### 并行研究

同时研究多个主题并收集摘要：

```python
delegate_task(tasks=[
    {
        "goal": "研究2025年WebAssembly的现状",
        "context": "重点关注：浏览器支持、非浏览器运行时、语言支持",
        "toolsets": ["web"]
    },
    {
        "goal": "研究2025年RISC-V的采用情况",
        "context": "重点关注：服务器芯片、嵌入式系统、软件生态系统",
        "toolsets": ["web"]
    },
    {
        "goal": "研究2025年量子计算的进展",
        "context": "重点关注：纠错突破、实际应用、关键参与者",
        "toolsets": ["web"]
    }
])
```

### 代码审查 + 修复

将审查和修复工作流委托给一个全新上下文：

```python
delegate_task(
    goal="审查身份验证模块的安全问题并修复发现的问题",
    context="""项目位于 /home/user/webapp。
    身份验证模块文件：src/auth/login.py、src/auth/jwt.py、src/auth/middleware.py。
    项目使用 Flask、PyJWT 和 bcrypt。
    重点关注：SQL注入、JWT验证、密码处理、会话管理。
    修复发现的任何问题并运行测试套件（pytest tests/auth/）。""",
    toolsets=["terminal", "file"]
)
```

### 多文件重构

委托一个可能淹没父智能体上下文的大型重构任务：

```python
delegate_task(
    goal="重构 src/ 中的所有 Python 文件，将 print() 替换为适当的日志记录",
    context="""项目位于 /home/user/myproject。
    使用 'logging' 模块，logger = logging.getLogger(__name__)。
    将 print() 调用替换为适当的日志级别：
    - print(f"Error: ...") -> logger.error(...)
    - print(f"Warning: ...") -> logger.warning(...)
    - print(f"Debug: ...") -> logger.debug(...)
    - 其他 print -> logger.info(...)
    不要更改测试文件或 CLI 输出中的 print()。
    之后运行 pytest 验证没有破坏任何东西。""",
    toolsets=["terminal", "file"]
)
```

## 批处理模式详情

当您提供一个`tasks`数组时，子智能体使用线程池**并行**运行：

- **最大并发数：** 默认为3个任务（通过 `delegation.max_concurrent_children` 或 `DELEGATION_MAX_CONCURRENT_CHILDREN` 环境变量可配置；下限为1，无硬性上限）。超过限制的批次将返回工具错误，而不是被静默截断。
- **线程池：** 使用 `ThreadPoolExecutor`，以配置的并发限制作为最大工作线程数
- **进度显示：** 在 CLI 模式下，树状视图实时显示每个子智能体的工具调用，每个任务完成时有完成行。在网关模式下，进度被批量处理并传递给父智能体的进度回调。
- **结果排序：** 结果按任务索引排序，以匹配输入顺序，无论完成顺序如何。
- **中断传播：** 中断父智能体（例如，发送新消息）会中断所有活动的子智能体。

单任务委托直接运行，没有线程池开销。

## 模型覆盖

您可以通过 `config.yaml` 为子智能体配置不同的模型 - 这对于将简单任务委托给更便宜/更快的模型很有用：

```yaml
# 在 ~/.hermes/config.yaml 中
delegation:
  model: "google/gemini-flash-2.0"    # 子智能体使用更便宜的模型
  provider: "openrouter"              # 可选：将子智能体路由到不同的提供商
```

如果省略，子智能体使用与父智能体相同的模型。

## 工具集选择提示

`toolsets` 参数控制子智能体可以访问哪些工具。根据任务进行选择：

| 工具集模式 | 用例 |
|----------------|----------|
| `["terminal", "file"]` | 代码工作、调试、文件编辑、构建 |
| `["web"]` | 研究、事实核查、文档查找 |
| `["terminal", "file", "web"]` | 全栈任务（默认） |
| `["file"]` | 只读分析、无执行的代码审查 |
| `["terminal"]` | 系统管理、进程管理 |

某些工具集对子智能体是阻塞的，无论您指定什么：
- `delegation` — 对叶子子智能体阻塞（默认）。保留给 `role="orchestrator"` 的子智能体，受 `max_spawn_depth` 限制 — 参见下方的[深度限制和嵌套编排](#深度限制和嵌套编排)。
- `clarify` — 子智能体无法与用户交互
- `memory` — 不写入共享持久内存
- `code_execution` — 子智能体应逐步推理
- `send_message` — 没有跨平台副作用（例如，发送 Telegram 消息）

## 最大迭代次数

每个子智能体都有一个迭代限制（默认：50），控制它可以进行多少次工具调用轮次：

```python
delegate_task(
    goal="快速文件检查",
    context="检查 /etc/nginx/nginx.conf 是否存在并打印其前10行",
    max_iterations=10  # 简单任务，不需要很多轮次"
)
```

## 子智能体超时

如果子智能体在超过 `delegation.child_timeout_seconds` 的实际时钟秒数内保持安静，将被视为卡住而终止。默认为 **600**（10分钟）— 从早期版本的 300 秒增加，因为高推理模型在非平凡研究任务中思考中途被终止。可针对每个安装进行调整：

```yaml
delegation:
  child_timeout_seconds: 600   # 默认值
```

对于快速的本地模型可以降低；对于处理困难问题的慢速推理模型可以提高。计时器在子智能体每次进行 API 调用或工具调用时重置 — 只有真正空闲的工作进程才会触发终止。

:::tip 零调用超时时的诊断转储
如果一个子智能体超时时进行了 **零次** API 调用（通常是：提供商不可达、认证失败或工具模式被拒绝），`delegate_task` 会将一个结构化的诊断信息写入 `~/.hermes/logs/subagent-timeout-<session>-<timestamp>.log`，其中包含子智能体的配置快照、凭证解析跟踪以及任何早期错误消息。这比之前的静默超时行为更容易定位根本原因。
:::

## 监控运行中的子智能体 (`/agents`)

TUI 提供了一个 `/agents` 别名 (`/tasks`) 覆盖层，将递归的 `delegate_task` 扇出转变为一流的审计界面：

- 运行中和最近完成的子智能体的实时树状视图，按父级分组
- 每个分支的成本、token 和文件修改汇总
- 终止和暂停控制 — 可以在飞行中取消特定的子智能体而不中断其兄弟
- 事后审查：即使子智能体已返回父级，也可以逐步查看每个子智能体的逐轮历史记录

经典的 CLI 只是将 `/agents` 打印为文本摘要；TUI 是覆盖层发挥优势的地方。参见 [TUI — 斜杠命令](/user-guide/tui#slash-commands)。

## 深度限制和嵌套编排

默认情况下，委托是 **扁平的**：一个父级（深度0）生成子级（深度1），这些子级无法进一步委托。这可以防止失控的递归委托。

对于多阶段工作流（研究 → 综合，或子问题上的并行编排），父级可以生成 **编排者** 子级，这些子级 *可以* 委托自己的工作进程：

```python
delegate_task(
    goal="调研三种代码审查方法并推荐一种",
    role="orchestrator",  # 允许此子级生成自己的工作进程
    context="...",
)
```

- `role="leaf"`（默认）：子级无法进一步委托 — 与扁平委托行为相同。
- `role="orchestrator"`：子级保留 `delegation` 工具集。受 `delegation.max_spawn_depth` 限制（默认 **1** = 扁平，因此 `role="orchestrator"` 在默认设置下是无操作的）。将 `max_spawn_depth` 提高到 2 以允许编排者子级生成叶子孙级；3 为三级（上限）。
- `delegation.orchestrator_enabled: false`：全局终止开关，强制每个子级为 `leaf`，无论 `role` 参数如何。

**成本警告：** 当 `max_spawn_depth: 3` 且 `max_concurrent_children: 3` 时，树可以达到 3×3×3 = 27 个并发叶子智能体。每个额外的级别都会乘以支出 — 请有意提高 `max_spawn_depth`。

## 生命周期和持久性

:::warning delegate_task 是同步的 — 非持久
`delegate_task` **在父智能体的当前轮次内运行**。它会阻塞父智能体，直到所有子级完成（或被取消）。它**不是**后台作业队列：

- 如果父智能体被中断（用户发送新消息、`/stop`、`/new`），所有活动子级将被取消并返回 `status="interrupted"`。它们正在进行的工作将被丢弃。
- 子级在父轮次结束后**不会**继续运行。
- 被取消的子级返回一个结构化结果（`status="interrupted"`, `exit_reason="interrupted"`），但由于父级也被中断，该结果通常不会出现在用户可见的回复中。

对于必须在中断中存活或持续到当前轮次之外的 **持久性长时间运行工作**，请使用：

- `cronjob`（action=`create`）— 调度单独的智能体运行；对父级轮次中断免疫。
- `terminal(background=True, notify_on_complete=True)` — 在智能体执行其他操作时保持运行的长时间运行 shell 命令。
:::

## 关键属性

- 每个子智能体拥有**独立的终端会话**（与父智能体分离）
- **嵌套委派默认关闭** — 仅 `role="orchestrator"` 的子智能体可以在 `max_spawn_depth` 从默认值1（扁平结构）提升后进一步委派任务。通过 `orchestrator_enabled: false` 可全局禁用。
- 叶子子智能体**无法**调用：`delegate_task`、`clarify`、`memory`、`send_message`、`execute_code`。协调器子智能体保留 `delegate_task` 但仍无法使用其余四个功能。
- **中断传播** — 中断父智能体会中断所有活动的子智能体（包括协调器下的孙智能体）
- 仅最终摘要进入父智能体上下文，从而保持令牌使用效率
- 子智能体继承父智能体的 **API 密钥、提供商配置和凭据池**（从而在达到速率限制时启用密钥轮换）

## 委派 与 execute_code 对比

| 因素 | delegate_task | execute_code |
|------|--------------|-------------|
| **推理能力** | 完整的 LLM 推理循环 | 仅 Python 代码执行 |
| **上下文** | 全新的隔离对话 | 无对话，仅脚本 |
| **工具访问权限** | 所有未屏蔽的工具，带推理能力 | 通过 RPC 访问 7 个工具，无推理 |
| **并行性** | 默认 3 个并发子智能体（可配置） | 单脚本 |
| **适用场景** | 需要判断力的复杂任务 | 机械式多步骤流水线 |
| **令牌成本** | 较高（完整 LLM 循环） | 较低（仅返回 stdout） |
| **用户交互** | 无（子智能体无法澄清） | 无 |

**经验法则：** 当子任务需要推理、判断或多步问题解决时，使用 `delegate_task`。当需要机械数据处理或脚本化工作流时，使用 `execute_code`。

## 配置

```yaml
# 在 ~/.hermes/config.yaml 中配置
delegation:
  max_iterations: 50                        # 每个子任务的最大轮次（默认：50）
  # max_concurrent_children: 3              # 每批的并行子任务数（默认：3）
  # max_spawn_depth: 1                      # 树深度（1-3，默认 1 = 扁平结构）。提升至 2 以允许协调器子任务生成叶子节点；3 表示三层深度。
  # orchestrator_enabled: true              # 禁用以强制所有子任务扮演叶子角色。
  model: "google/gemini-3-flash-preview"             # 可选：提供商/模型覆盖
  provider: "openrouter"                             # 可选：内置提供商
  api_mode: anthropic_messages                       # 可选；对于 anthropic_messages 端点，根据 base_url 自动检测

# 或者，使用直接自定义端点代替提供商：
delegation:
  model: "qwen2.5-coder"
  base_url: "http://localhost:1234/v1"
  api_key: "local-key"
  # api_mode: "anthropic_messages"  # 可选。base_url 的线路协议覆盖（"chat_completions"、"codex_responses" 或 "anthropic_messages"）。留空 = 根据 URL 自动检测（例如 /anthropic 后缀）。为启发式方法无法分类的端点（Azure AI Foundry、MiniMax、智谱 GLM、LiteLLM 代理等）显式设置。
```

当 `base_url` 指向 Anthropic 兼容端点时 — 例如以 `/anthropic` 结尾的路径、Azure Foundry Claude 路由或 MiniMax `/anthropic` 代理 — `api_mode` 会被自动检测为 `anthropic_messages`，这样子智能体会使用正确的线路格式，无需您手动设置。当自动检测猜测错误时（罕见），请显式设置 `api_mode`。

:::tip
智能体会根据任务复杂性自动处理委派。您无需明确要求它委派 — 当它认为合适时就会自动执行。
:::