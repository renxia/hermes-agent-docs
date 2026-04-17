---
sidebar_position: 9
title: "工具运行时"
description: "工具注册表、工具集、分派和终端环境的运行时行为"
---

# 工具运行时

Hermes 工具是分组到工具集中的自注册函数，并通过中央注册表/分派系统执行。

主要文件：

- `tools/registry.py`
- `model_tools.py`
- `toolsets.py`
- `tools/terminal_tool.py`
- `tools/environments/*`

## 工具注册模型

每个工具模块在导入时都会调用 `registry.register(...)`。

`model_tools.py` 负责导入/发现工具模块，并构建模型使用的模式列表。

### `registry.register()` 的工作原理

`tools/` 中的每个工具文件都会在模块级别调用 `registry.register()` 来声明自身。函数签名如下：

```python
registry.register(
    name="terminal",               # 唯一的工具名称（用于 API 模式）
    toolset="terminal",            # 该工具所属的工具集
    schema={...},                  # OpenAI 函数调用模式（描述、参数）
    handler=handle_terminal,       # 当工具被调用时执行的函数
    check_fn=check_terminal,       # 可选：返回 True/False 以检查可用性
    requires_env=["SOME_VAR"],     # 可选：所需的环境变量（用于 UI 显示）
    is_async=False,                # 处理器是否为异步协程
    description="Run commands",    # 人类可读的描述
    emoji="💻",                    # 用于转圈/进度显示的表情符号
)
```

每次调用都会创建一个存储在单例 `ToolRegistry._tools` 字典中的 `ToolEntry`，并以工具名称作为键。如果工具集之间发生名称冲突，系统会记录警告，并且后一次的注册会覆盖前一次的注册。

### 发现机制：`discover_builtin_tools()`

当导入 `model_tools.py` 时，它会调用 `tools/registry.py` 中的 `discover_builtin_tools()`。此函数使用 AST 解析扫描每个 `tools/*.py` 文件，以查找包含顶级 `registry.register()` 调用的模块，然后导入它们：

```python
# tools/registry.py (简化版)
def discover_builtin_tools(tools_dir=None):
    tools_path = Path(tools_dir) if tools_dir else Path(__file__).parent
    for path in sorted(tools_path.glob("*.py")):
        if path.name in {"__init__.py", "registry.py", "mcp_tool.py"}:
            continue
        if _module_registers_tools(path):  # AST 检查顶级 registry.register()
            importlib.import_module(f"tools.{path.stem}")
```

这种自动发现机制意味着新的工具文件会自动被拾取——无需手动维护列表。AST 检查只匹配顶级 `registry.register()` 调用（不匹配函数内部的调用），因此 `tools/` 中的辅助模块不会被导入。

每次导入都会触发模块的 `registry.register()` 调用。可选工具中的错误（例如，图像生成缺少 `fal_client`）会被捕获并记录——它们不会阻止其他工具加载。

在核心工具发现之后，还会发现 MCP 工具和插件工具：

1. **MCP 工具** — `tools.mcp_tool.discover_mcp_tools()` 读取 MCP 服务器配置，并注册来自外部服务器的工具。
2. **插件工具** — `hermes_cli.plugins.discover_plugins()` 加载用户/项目/pip 插件，这些插件可能会注册额外的工具。

## 工具可用性检查（`check_fn`）

每个工具可以选择提供一个 `check_fn`——一个可调用函数，当工具可用时返回 `True`，否则返回 `False`。典型的检查包括：

- **API 密钥是否存在** — 例如，用于网络搜索的 `lambda: bool(os.environ.get("SERP_API_KEY"))`
- **服务是否运行** — 例如，检查 Honcho 服务器是否已配置
- **二进制文件是否安装** — 例如，验证浏览器工具是否可用 `playwright`

当 `registry.get_definitions()` 构建模型模式列表时，它会运行每个工具的 `check_fn()`：

```python
# 简化自 registry.py
if entry.check_fn:
    try:
        available = bool(entry.check_fn())
    except Exception:
        available = False   # 异常 = 不可用
    if not available:
        continue            # 完全跳过此工具
```

关键行为：
- 检查结果是**每次调用缓存的**——如果多个工具共享相同的 `check_fn`，它只会运行一次。
- `check_fn()` 中的异常被视为“不可用”（故障安全）。
- `is_toolset_available()` 方法检查工具集的 `check_fn` 是否通过，用于 UI 显示和工具集解析。

## 工具集解析

工具集是命名工具的捆绑包。Hermes 通过以下方式解析它们：

- 显式的启用/禁用工具集列表
- 平台预设（`hermes-cli`、`hermes-telegram` 等）
- 动态 MCP 工具集
- 精心策划的特殊用途集合，如 `hermes-acp`

### `get_tool_definitions()` 如何过滤工具

主要的入口点是 `model_tools.get_tool_definitions(enabled_toolsets, disabled_toolsets, quiet_mode)`：

1. **如果提供了 `enabled_toolsets`** — 只包含这些工具集中的工具。每个工具集名称都通过 `resolve_toolset()` 解析，该函数会将复合工具集扩展为单个工具名称。

2. **如果提供了 `disabled_toolsets`** — 从所有工具集开始，然后减去禁用的工具集。

3. **如果两者都没有** — 包含所有已知的工具集。

4. **注册表过滤** — 解析后的工具名称集合被传递给 `registry.get_definitions()`，该函数应用 `check_fn` 过滤并返回 OpenAI 格式的模式。

5. **动态模式补丁** — 过滤后，`execute_code` 和 `browser_navigate` 的模式会被动态调整，仅引用实际通过过滤的工具（防止模型幻觉出不可用的工具）。

### 遗留工具集名称

带有 `_tools` 后缀的旧工具集名称（例如 `web_tools`、`terminal_tools`）通过 `_LEGACY_TOOLSET_MAP` 映射到其现代工具名称，以实现向后兼容性。

## 分派（Dispatch）

在运行时，工具通过中央注册表进行分派，对于一些代理级别的工具（例如内存/待办事项/会话搜索处理）则有代理循环的例外。

### 分派流程：模型工具调用 → 处理器执行

当模型返回一个 `tool_call` 时，流程如下：

```
模型返回 tool_call
    ↓
run_agent.py 代理循环
    ↓
model_tools.handle_function_call(name, args, task_id, user_task)
    ↓
[代理循环工具？] → 由代理循环直接处理（todo, memory, session_search, delegate_task）
    ↓
[插件预钩子] → invoke_hook("pre_tool_call", ...)
    ↓
registry.dispatch(name, args, **kwargs)
    ↓
根据名称查找 ToolEntry
    ↓
[异步处理器？] → 通过 _run_async() 桥接
[同步处理器？]  → 直接调用
    ↓
返回结果字符串（或 JSON 错误）
    ↓
[插件后钩子] → invoke_hook("post_tool_call", ...)
```

### 错误封装

所有工具执行都在两个级别进行了错误处理封装：

1. **`registry.dispatch()`** — 捕获处理器中的任何异常，并返回 `{"error": "Tool execution failed: ExceptionType: message"}` JSON。

2. **`handle_function_call()`** — 用一个二次的 try/except 封装整个分派过程，返回 `{"error": "Error executing tool_name: message"}`。

这确保了模型始终收到格式良好的 JSON 字符串，而不会收到未处理的异常。

### 代理循环工具

有四个工具在注册表分派之前被拦截，因为它们需要代理级别的状态（TodoStore、MemoryStore 等）：

- `todo` — 规划/任务跟踪
- `memory` — 持久内存写入
- `session_search` — 跨会话召回
- `delegate_task` — 启动子代理会话

这些工具的模式仍然注册在注册表中（用于 `get_tool_definitions`），但它们的处理器如果分派意外地到达它们，则返回一个存根错误。

### 异步桥接

当工具处理器是异步的，`_run_async()` 会将其桥接到同步分派路径：

- **CLI 路径（无运行循环）** — 使用持久事件循环来保持缓存的异步客户端存活
- **Gateway 路径（运行循环）** — 使用 `asyncio.run()` 启动一个可处置的线程
- **工作线程（并行工具）** — 使用存储在线程局部存储中的每个线程的持久循环

## DANGEROUS_PATTERNS 批准流程

终端工具集成了定义在 `tools/approval.py` 中的危险命令批准系统：

1. **模式检测** — `DANGEROUS_PATTERNS` 是一个包含 `(regex, description)` 元组的列表，用于覆盖破坏性操作：
   - 递归删除（`rm -rf`）
   - 文件系统格式化（`mkfs`、`dd`）
   - SQL 破坏性操作（没有 `WHERE` 的 `DROP TABLE`、`DELETE FROM`）
   - 系统配置覆盖（`> /etc/`）
   - 服务操作（`systemctl stop`）
   - 远程代码执行（`curl | sh`）
   - 进程炸弹、进程杀死等。

2. **检测** — 在执行任何终端命令之前，`detect_dangerous_command(command)` 会对照所有模式进行检查。

3. **批准提示** — 如果找到匹配项：
   - **CLI 模式** — 一个交互式提示要求用户批准、拒绝或永久允许
   - **Gateway 模式** — 一个异步批准回调将请求发送到消息平台
   - **智能批准** — 可选地，一个辅助 LLM 可以自动批准匹配模式的低风险命令（例如，`rm -rf node_modules/` 是安全的，但匹配了“递归删除”）

4. **会话状态** — 批准是按会话跟踪的。一旦你为某个会话批准了“递归删除”，后续的 `rm -rf` 命令就不会再次提示。

5. **永久白名单** — “永久允许”选项会将该模式写入 `config.yaml` 的 `command_allowlist`，并在会话间持久化。

## 终端/运行时环境

终端系统支持多种后端：

- local
- docker
- ssh
- singularity
- modal
- daytona

它还支持：

- 每个任务的当前工作目录覆盖
- 后台进程管理
- PTY 模式
- 危险命令的批准回调

## 并发性

工具调用可能按顺序或并发执行，具体取决于工具组合和交互需求。

## 相关文档

- [工具集参考](../reference/toolsets-reference.md)
- [内置工具参考](../reference/tools-reference.md)
- [代理循环内部机制](./agent-loop.md)
- [ACP 内部机制](./acp-internals.md)