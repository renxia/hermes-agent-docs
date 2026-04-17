---
sidebar_position: 7
title: "子代理委托"
description: "使用 delegate_task 为并行工作流生成隔离的子代理"
---

# 子代理委托

`delegate_task` 工具会生成具有隔离上下文、受限工具集和独立终端会话的子 AIAgent 实例。每个子代理都会获得一次全新的对话，并独立工作——只有其最终的摘要会进入父级的上下文。

## 单任务

```python
delegate_task(
    goal="调试测试失败的原因",
    context="错误：test_foo.py 第 42 行断言失败",
    toolsets=["terminal", "file"]
)
```

## 并行批处理

最多可支持 3 个并发子代理：

```python
delegate_task(tasks=[
    {"goal": "研究主题 A", "toolsets": ["web"]},
    {"goal": "研究主题 B", "toolsets": ["web"]},
    {"goal": "修复构建", "toolsets": ["terminal", "file"]}
])
```

## 子代理上下文的工作原理

:::warning 关键：子代理一无所知
子代理从一个**完全全新的对话**开始。它们对父级的对话历史、先前的工具调用或委托之前讨论的任何内容没有任何了解。子代理唯一的上下文来自于您提供的 `goal` 和 `context` 字段。
:::

这意味着您必须传入子代理所需的**所有信息**：

```python
# 错误示例 - 子代理不知道“错误”是什么
delegate_task(goal="修复错误")

# 正确示例 - 子代理拥有所有需要的上下文
delegate_task(
    goal="修复 api/handlers.py 中的 TypeError",
    context="""文件 api/handlers.py 在第 47 行存在 TypeError:
    'NoneType' 对象没有 'get' 属性。
    函数 process_request() 从 parse_body() 接收一个字典，
    但当 Content-Type 缺失时，parse_body() 返回 None。
    项目位于 /home/user/myproject，并使用 Python 3.11。"""
)
```

子代理会接收一个由您的目标和上下文构建的聚焦系统提示，指示它完成任务，并提供一份结构化的摘要，说明它做了什么、发现了什么、修改了哪些文件以及遇到了哪些问题。

## 实际示例

### 并行研究

同时研究多个主题并收集摘要：

```python
delegate_task(tasks=[
    {
        "goal": "研究 2025 年 WebAssembly 的当前状态",
        "context": "重点关注：浏览器支持、非浏览器运行时、语言支持",
        "toolsets": ["web"]
    },
    {
        "goal": "研究 2025 年 RISC-V 采用的当前状态",
        "context": "重点关注：服务器芯片、嵌入式系统、软件生态系统",
        "toolsets": ["web"]
    },
    {
        "goal": "研究 2025 年量子计算的进展",
        "context": "重点关注：纠错突破、实际应用、主要参与者",
        "toolsets": ["web"]
    }
])
```

### 代码审查 + 修复

将审查和修复工作流委托给一个全新的上下文：

```python
delegate_task(
    goal="审查认证模块是否存在安全问题并修复任何发现的问题",
    context="""项目位于 /home/user/webapp。
    认证模块文件：src/auth/login.py, src/auth/jwt.py, src/auth/middleware.py。
    项目使用 Flask, PyJWT 和 bcrypt。
    重点关注：SQL 注入、JWT 验证、密码处理、会话管理。
    修复发现的任何问题，并运行测试套件 (pytest tests/auth/)。""",
    toolsets=["terminal", "file"]
)
```

### 多文件重构

委托一个大型重构任务，避免使父级上下文过载：

```python
delegate_task(
    goal="重构 src/ 中的所有 Python 文件，将 print() 替换为适当的日志记录",
    context="""项目位于 /home/user/myproject。
    使用 'logging' 模块，并设置 logger = logging.getLogger(__name__)。
    将 print() 调用替换为适当的日志级别：
    - print(f"Error: ...") -> logger.error(...)
    - print(f"Warning: ...") -> logger.warning(...)
    - print(f"Debug: ...") -> logger.debug(...)
    - 其他 print -> logger.info(...)
    不要更改测试文件或 CLI 输出中的 print()。
    完成后运行 pytest 进行验证，确保没有代码中断。""",
    toolsets=["terminal", "file"]
)
```

## 批处理模式详情

当您提供一个 `tasks` 数组时，子代理将使用线程池**并行**运行：

- **最大并发数：** 3 个任务（如果 `tasks` 数组更长，将截断到 3 个）
- **线程池：** 使用 `ThreadPoolExecutor`，设置 `MAX_CONCURRENT_CHILDREN = 3` 工作线程
- **进度显示：** 在 CLI 模式下，树状视图会实时显示每个子代理的工具调用，并显示每个任务的完成行。在网关模式下，进度会进行批处理，并转发到父级的进度回调。
- **结果排序：** 结果将按任务索引排序，与输入顺序匹配，与完成顺序无关。
- **中断传播：** 中断父级（例如发送新消息）将中断所有活动的子代理。

单任务委托直接运行，没有线程池开销。

## 模型覆盖

您可以通过 `config.yaml` 为子代理配置不同的模型——这对于将简单任务委托给成本更低/速度更快的模型非常有用：

```yaml
# 在 ~/.hermes/config.yaml 中
delegation:
  model: "google/gemini-flash-2.0"    # 子代理的更便宜的模型
  provider: "openrouter"              # 可选：将子代理路由到不同的提供商
```

如果省略，子代理将使用与父级相同的模型。

## 工具集选择提示

`toolsets` 参数控制子代理可访问的工具。请根据任务选择：

| 工具集模式 | 用例 |
|----------------|----------|
| `["terminal", "file"]` | 代码工作、调试、文件编辑、构建 |
| `["web"]` | 研究、事实核查、文档查找 |
| `["terminal", "file", "web"]` | 全栈任务（默认） |
| `["file"]` | 只读分析、不执行的代码审查 |
| `["terminal"]` | 系统管理、进程管理 |

无论您指定什么，某些工具集对子代理都是**始终禁用**的：
- `delegation` — 禁止递归委托（防止无限生成）
- `clarify` — 子代理不能与用户交互
- `memory` — 不允许写入共享持久内存
- `code_execution` — 子代理应分步推理
- `send_message` — 不允许跨平台副作用（例如发送 Telegram 消息）

## 最大迭代次数

每个子代理都有一个迭代限制（默认为 50），控制它可以执行多少次工具调用：

```python
delegate_task(
    goal="快速文件检查",
    context="检查 /etc/nginx/nginx.conf 是否存在，并打印其前 10 行",
    max_iterations=10  # 简单任务，不需要太多轮次
)
```

## 深度限制

委托有**深度限制为 2**——父级（深度 0）可以生成子级（深度 1），但子级不能进一步委托。这可以防止失控的递归委托链。

## 关键属性

- 每个子代理都拥有**自己的终端会话**（与父级分离）
- **无嵌套委托**——子代理不能进一步委托（没有孙代理）
- 子代理**不能**调用：`delegate_task`、`clarify`、`memory`、`send_message`、`execute_code`
- **中断传播**——中断父级会中断所有活动的子代理
- 只有最终摘要进入父级上下文，保持了高效的 Token 使用
- 子代理继承了父级的**API 密钥、提供商配置和凭证池**（在速率限制时支持密钥轮换）

## 委托 vs execute_code

| 因素 | delegate_task | execute_code |
|--------|--------------|-------------|
| **推理能力** | 完整的 LLM 推理循环 | 仅 Python 代码执行 |
| **上下文** | 隔离的全新对话 | 无对话，仅脚本 |
| **工具访问** | 所有非禁用工具，并进行推理 | 通过 RPC 的 7 个工具，无推理 |
| **并行性** | 最多 3 个并发子代理 | 单个脚本 |
| **适用场景** | 需要判断力的复杂任务 | 机械的多步骤管道 |
| **Token 成本** | 较高（完整的 LLM 循环） | 较低（仅返回 stdout） |
| **用户交互** | 无（子代理不能澄清） | 无 |

**经验法则：** 当子任务需要推理、判断或多步骤问题解决时，使用 `delegate_task`。当您需要机械数据处理或脚本化工作流程时，使用 `execute_code`。

## 配置

```yaml
# 在 ~/.hermes/config.yaml 中
delegation:
  max_iterations: 50                        # 每个子代理的最大轮次（默认为 50）
  default_toolsets: ["terminal", "file", "web"]  # 默认工具集
  model: "google/gemini-3-flash-preview"             # 可选的提供商/模型覆盖
  provider: "openrouter"                             # 可选的内置提供商

# 或者使用直接的自定义端点代替 provider:
delegation:
  model: "qwen2.5-coder"
  base_url: "http://localhost:1234/v1"
  api_key: "local-key"
```

:::tip
代理会根据任务的复杂性自动处理委托。您不需要明确要求它委托——当它认为合适时，它会自动执行。
:::