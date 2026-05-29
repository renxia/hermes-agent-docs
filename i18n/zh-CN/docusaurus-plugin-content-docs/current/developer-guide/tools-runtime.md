---
sidebar_position: 9
title: "工具运行时"
description: "工具注册表、工具集、调度及终端环境的运行时行为"
---

# 工具运行时

Hermes 工具是自注册函数，它们被分组到工具集中，并通过一个中央注册/调度系统执行。

主要文件：

- `tools/registry.py`
- `model_tools.py`
- `toolsets.py`
- `tools/terminal_tool.py`
- `tools/environments/*`

## 工具注册模型

每个工具模块在导入时调用 `registry.register(...)`。

`model_tools.py` 负责导入/发现工具模块，并构建模型使用的架构列表。

### `registry.register()` 工作原理

`tools/` 中的每个工具文件在模块级别调用 `registry.register()` 来声明自己。函数签名如下：

```python
registry.register(
    name="terminal",               # 唯一工具名称（用于 API 架构）
    toolset="terminal",            # 该工具所属的工具集
    schema={...},                  # OpenAI 函数调用架构（描述、参数）
    handler=handle_terminal,       # 工具被调用时执行的函数
    check_fn=check_terminal,       # 可选：返回 True/False 表示可用性
    requires_env=["SOME_VAR"],     # 可选：需要的环境变量（用于界面显示）
    is_async=False,                # 处理程序是否为异步协程
    description="Run commands",    # 人类可读描述
    emoji="💻",                    # 用于加载/进度显示的表情符号
)
```

每次调用都会创建一个 `ToolEntry`，存储在单例 `ToolRegistry._tools` 字典中，以工具名称为键。如果跨工具集出现名称冲突，系统会记录日志并以后注册的为准。

### 发现机制：`discover_builtin_tools()`

当 `model_tools.py` 被导入时，它会调用 `tools/registry.py` 中的 `discover_builtin_tools()`。此函数使用 AST 解析扫描 `tools/` 下的每个 `*.py` 文件，找到包含顶层 `registry.register()` 调用的模块，然后导入它们：

```python
# tools/registry.py (简化版)
def discover_builtin_tools(tools_dir=None):
    tools_path = Path(tools_dir) if tools_dir else Path(__file__).parent
    for path in sorted(tools_path.glob("*.py")):
        if path.name in {"__init__.py", "registry.py", "mcp_tool.py"}:
            continue
        if _module_registers_tools(path):  # AST 检查顶层 registry.register() 调用
            importlib.import_module(f"tools.{path.stem}")
```

这种自动发现机制意味着新的工具文件会被自动识别——无需维护手动列表。AST 检查仅匹配顶层的 `registry.register()` 调用（不匹配函数内部的调用），因此 `tools/` 中的辅助模块不会被导入。

每次导入都会触发模块的 `registry.register()` 调用。可选工具（例如，图像生成缺少 `fal_client`）中的错误会被捕获并记录——它们不会阻止其他工具的加载。

在核心工具发现之后，还会发现 MCP 工具和插件工具：

1.  **MCP 工具** —— `tools.mcp_tool.discover_mcp_tools()` 读取 MCP 服务器配置，并注册来自外部服务器的工具。
2.  **插件工具** —— `hermes_cli.plugins.discover_plugins()` 加载用户/项目/pip 插件，这些插件可能注册额外的工具。

## 工具可用性检查（`check_fn`）

每个工具可以选择性提供 `check_fn` —— 一个在工具可用时返回 `True`、否则返回 `False` 的可调用对象。典型的检查包括：

- **API 密钥存在** —— 例如，`lambda: bool(os.environ.get("SERP_API_KEY"))` 用于网络搜索
- **服务正在运行** —— 例如，检查 Honcho 服务器是否已配置
- **二进制文件已安装** —— 例如，为浏览器工具验证 `playwright` 是否可用

当 `registry.get_definitions()` 为模型构建模式列表时，它会运行每个工具的 `check_fn()`：

```python
# 摘自 registry.py 的简化代码
if entry.check_fn:
    try:
        available = bool(entry.check_fn())
    except Exception:
        available = False   # 异常 = 不可用
    if not available:
        continue            # 完全跳过此工具
```

关键行为：
- 检查结果在**每次调用中缓存** —— 如果多个工具共享相同的 `check_fn`，它只运行一次。
- `check_fn()` 中的异常被视为“不可用”（安全失败）。
- `is_toolset_available()` 方法检查工具集的 `check_fn` 是否通过，用于 UI 显示和工具集解析。

## 工具集解析

工具集是工具的命名集合。Hermes 通过以下方式解析它们：
- 显式启用/禁用的工具集列表
- 平台预设（`hermes-cli`、`hermes-telegram` 等）
- 动态 MCP 工具集
- 策划的特殊用途集，如 `hermes-acp`

### `get_tool_definitions()` 如何过滤工具

主要入口点是 `model_tools.get_tool_definitions(enabled_toolsets, disabled_toolsets, quiet_mode)`：

1. **如果提供了 `enabled_toolsets`** —— 只包含来自这些工具集的工具。每个工具集名称通过 `resolve_toolset()` 解析，它将复合工具集展开为各个工具名称。

2. **如果提供了 `disabled_toolsets`** —— 从所有工具集开始，然后减去禁用的那些。

3. **如果都没有提供** —— 包含所有已知的工具集。

4. **注册表过滤** —— 解析出的工具名称集合被传递给 `registry.get_definitions()`，后者应用 `check_fn` 过滤并返回 OpenAI 格式的模式。

5. **动态模式修补** —— 过滤后，`execute_code` 和 `browser_navigate` 的模式被动态调整为仅引用实际通过过滤的工具（防止模型幻觉出不可用的工具）。

### 旧版工具集名称

带有 `_tools` 后缀的旧工具集名称（例如 `web_tools`、`terminal_tools`）通过 `_LEGACY_TOOLSET_MAP` 映射到其现代工具名称，以实现向后兼容。

## 分派

在运行时，工具通过中央注册表进行分派，但某些智能体级别工具（如内存/待办事项/会话搜索处理）的智能体循环存在例外。

### 分派流程：模型 tool_call → 处理程序执行

当模型返回一个 `tool_call` 时，流程如下：

```
模型响应包含 tool_call
    ↓
run_agent.py 智能体循环
    ↓
model_tools.handle_function_call(name, args, task_id, user_task)
    ↓
[智能体循环工具？] → 由智能体循环直接处理 (todo, memory, session_search, delegate_task)
    ↓
[插件预钩子] → invoke_hook("pre_tool_call", ...)
    ↓
registry.dispatch(name, args, **kwargs)
    ↓
根据名称查找 ToolEntry
    ↓
[异步处理程序？] → 通过 _run_async() 桥接
[同步处理程序？]  → 直接调用
    ↓
返回结果字符串（或 JSON 错误）
    ↓
[插件后钩子] → invoke_hook("post_tool_call", ...)
```

### 错误包装

所有工具执行都在两个级别被错误处理包装：

1. **`registry.dispatch()`** —— 捕获处理程序的任何异常，并以 JSON 形式返回 `{"error": "Tool execution failed: ExceptionType: message"}`。
2. **`handle_function_call()`** —— 将整个分派包装在次要的 try/except 中，返回 `{"error": "Error executing tool_name: message"}`。

这确保了模型总是接收到一个格式正确的 JSON 字符串，而不是一个未处理的异常。

### 智能体循环工具

四个工具在注册表分派之前被拦截，因为它们需要智能体级别的状态（TodoStore、MemoryStore 等）：
- `todo` —— 规划/任务跟踪
- `memory` —— 持久化内存写入
- `session_search` —— 跨会话回忆
- `delegate_task` —— 生成子智能体会话

这些工具的模式仍然在注册表中注册（用于 `get_tool_definitions`），但如果分派以某种方式直接到达它们，其处理程序会返回一个存根错误。

### 异步桥接

当工具处理程序是异步的，`_run_async()` 将其桥接到同步分派路径：
- **CLI 路径（无运行循环）** —— 使用持久化事件循环来保持缓存的异步客户端存活
- **网关路径（运行循环）** —— 使用 `asyncio.run()` 启动一次性线程
- **工作线程（并行工具）** —— 使用存储在线程本地存储中的每线程持久化循环

## DANGEROUS_PATTERNS 审批流程

终端工具集成了一个定义在 `tools/approval.py` 中的危险命令审批系统：

1. **模式检测** —— `DANGEROUS_PATTERNS` 是一个 `(regex, description)` 元组列表，涵盖破坏性操作：
   - 递归删除 (`rm -rf`)
   - 文件系统格式化 (`mkfs`, `dd`)
   - SQL 破坏性操作 (`DROP TABLE`, 不带 `WHERE` 的 `DELETE FROM`)
   - 系统配置覆盖 (`> /etc/`)
   - 服务操控 (`systemctl stop`)
   - 远程代码执行 (`curl | sh`)
   - 炸弹式进程、进程终止等。

2. **检测** —— 在执行任何终端命令之前，`detect_dangerous_command(command)` 会根据所有模式进行检查。

3. **审批提示** —— 如果发现匹配项：
   - **CLI 模式** —— 交互式提示要求用户批准、拒绝或永久允许
   - **网关模式** —— 异步审批回调将请求发送到消息平台
   - **智能审批** —— 可选地，辅助 LLM 可以自动批准匹配模式的低风险命令（例如，`rm -rf node_modules/` 是安全的，但匹配“递归删除”）

4. **会话状态** —— 审批按会话跟踪。一旦您在会话中批准了“递归删除”，后续的 `rm -rf` 命令将不再提示。

5. **永久允许列表** —— “永久允许”选项会将模式写入 `config.yaml` 的 `command_allowlist`，并在会话间持久化。

## 终端/运行时环境

终端系统支持多种后端：
- 本地
- Docker
- SSH
- Singularity
- Modal
- Daytona

它还支持：
- 每个任务的 cwd 覆盖
- 后台进程管理
- PTY 模式
- 危险命令的审批回调

## 并发

工具调用可能顺序执行或并发执行，这取决于工具组合和交互需求。

## 相关文档

- [工具集参考](../reference/toolsets-reference.md)
- [内置工具参考](../reference/tools-reference.md)
- [智能体循环内部机制](./agent-loop.md)
- [ACP 内部机制](./acp-internals.md)