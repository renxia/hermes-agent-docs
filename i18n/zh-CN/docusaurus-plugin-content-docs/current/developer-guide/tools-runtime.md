---
sidebar_position: 9
title: "工具运行时"
description: "工具注册表、工具集、调度以及终端环境的运行时行为"
---

# 工具运行时

Hermes 工具是自注册函数，被分组为工具集，并通过一个中央注册表/调度系统执行。

主要文件：

- `tools/registry.py`
- `model_tools.py`
- `toolsets.py`
- `tools/terminal_tool.py`
- `tools/environments/*`

## 工具注册模型

每个工具模块在导入时都会调用 `registry.register(...)`。

`model_tools.py` 负责导入/发现工具模块，并构建模型所使用的模式列表。

### `registry.register()` 的工作原理

`tools/` 中的每个工具文件都会在模块级别调用 `registry.register()` 来声明自身。函数签名如下：

```python
registry.register(
    name="terminal",               # 唯一工具名称（用于 API 模式）
    toolset="terminal",            # 该工具所属的工具集
    schema={...},                  # OpenAI 函数调用模式（描述、参数）
    handler=handle_terminal,       # 当工具被调用时执行的函数
    check_fn=check_terminal,       # 可选：返回 True/False 表示是否可用
    requires_env=["SOME_VAR"],     # 可选：需要的环境变量（用于 UI 显示）
    is_async=False,                # 处理程序是否为异步协程
    description="运行命令",        # 人类可读的描述
    emoji="💻",                    # 用于加载/进度显示的 emoji
)
```

每次调用都会创建一个 `ToolEntry`，并存储在单例 `ToolRegistry._tools` 字典中，以工具名称为键。如果不同工具集之间发生名称冲突，则会记录警告，后注册的条目将生效。

### 发现机制：`discover_builtin_tools()`

当导入 `model_tools.py` 时，它会调用 `tools/registry.py` 中的 `discover_builtin_tools()`。该函数使用 AST 解析扫描每个 `tools/*.py` 文件，查找包含顶层 `registry.register()` 调用的模块，然后导入它们：

```python
# tools/registry.py（简化版）
def discover_builtin_tools(tools_dir=None):
    tools_path = Path(tools_dir) if tools_dir else Path(__file__).parent
    for path in sorted(tools_path.glob("*.py")):
        if path.name in {"__init__.py", "registry.py", "mcp_tool.py"}:
            continue
        if _module_registers_tools(path):  # AST 检查是否存在顶层 registry.register()
            importlib.import_module(f"tools.{path.stem}")
```

这种自动发现机制意味着新的工具文件会被自动获取——无需手动维护列表。AST 检查仅匹配顶层的 `registry.register()` 调用（而非函数内部的调用），因此 `tools/` 中的辅助模块不会被导入。

每次导入都会触发模块的 `registry.register()` 调用。可选工具中的错误（例如图像生成缺少 `fal_client`）会被捕获并记录——它们不会阻止其他工具加载。

在核心工具发现之后，还会发现 MCP 工具和插件工具：

1. **MCP 工具** — `tools.mcp_tool.discover_mcp_tools()` 读取 MCP 服务器配置，并注册来自外部服务器的工具。
2. **插件工具** — `hermes_cli.plugins.discover_plugins()` 加载用户/项目/pip 插件，这些插件可能会注册额外的工具。

## 工具可用性检查（`check_fn`）

每个工具都可以选择性地提供一个 `check_fn`——即可调用对象，当工具可用时返回 `True`，否则返回 `False`。常见的检查包括：

- **API 密钥存在**——例如，用于网络搜索的 `lambda: bool(os.environ.get("SERP_API_KEY"))`
- **服务正在运行**——例如，检查 Honcho 服务器是否已配置
- **二进制文件已安装**——例如，验证浏览器工具所需的 `playwright` 是否可用

当 `registry.get_definitions()` 为模型构建模式列表时，它会运行每个工具的 `check_fn()`：

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
- 检查结果**每次调用都会缓存**——如果多个工具共享相同的 `check_fn`，则只运行一次。
- `check_fn()` 中的异常被视为“不可用”（故障安全）。
- `is_toolset_available()` 方法检查工具集的 `check_fn` 是否通过，用于 UI 显示和工具集解析。

## 工具集解析

工具集是具名工具捆绑包。Hermes 通过以下方式解析它们：

- 显式启用/禁用工具集列表
- 平台预设（`hermes-cli`、`hermes-telegram` 等）
- 动态 MCP 工具集
- 精选的专用工具集，如 `hermes-acp`

### `get_tool_definitions()` 如何过滤工具

主要入口点是 `model_tools.get_tool_definitions(enabled_toolsets, disabled_toolsets, quiet_mode)`：

1. **如果提供了 `enabled_toolsets`**——仅包含来自这些工具集的工具。每个工具集名称通过 `resolve_toolset()` 解析，后者将复合工具集展开为单个工具名称。

2. **如果提供了 `disabled_toolsets`**——从所有工具集开始，然后减去被禁用的工具集。

3. **如果两者都未提供**——包含所有已知工具集。

4. **注册表过滤**——解析后的工具名称集传递给 `registry.get_definitions()`，后者应用 `check_fn` 过滤并返回 OpenAI 格式的模式。

5. **动态模式修补**——过滤后，`execute_code` 和 `browser_navigate` 模式会动态调整，仅引用实际通过过滤的工具（防止模型对不可用工具产生幻觉）。

### 旧版工具集名称

带有 `_tools` 后缀的旧工具集名称（例如 `web_tools`、`terminal_tools`）通过 `_LEGACY_TOOLSET_MAP` 映射到其现代工具名称，以实现向后兼容。

## 调度

在运行时，工具通过中央注册表进行调度，某些智能体级别工具（如内存/待办事项/会话搜索处理）具有智能体循环异常。

### 调度流程：模型 tool_call → 处理程序执行

当模型返回 `tool_call` 时，流程如下：

```
带有 tool_call 的模型响应
    ↓
run_agent.py 智能体循环
    ↓
model_tools.handle_function_call(name, args, task_id, user_task)
    ↓
[智能体循环工具？] → 由智能体循环直接处理（待办事项、内存、会话搜索、委派任务）
    ↓
[插件预钩子] → invoke_hook("pre_tool_call", ...)
    ↓
registry.dispatch(name, args, **kwargs)
    ↓
按名称查找 ToolEntry
    ↓
[异步处理程序？] → 通过 _run_async() 桥接
[同步处理程序？]  → 直接调用
    ↓
返回结果字符串（或 JSON 错误）
    ↓
[插件后钩子] → invoke_hook("post_tool_call", ...)
```

### 错误包装

所有工具执行都在两个级别进行错误处理包装：

1. **`registry.dispatch()`**——捕获处理程序中的任何异常，并返回 `{"error": "工具执行失败：异常类型：消息"}` 作为 JSON。

2. **`handle_function_call()`**——在整个调度周围包装一个次要的 try/except，返回 `{"error": "执行工具名称时出错：消息"}`。

这确保模型始终收到格式良好的 JSON 字符串，而不会收到未处理的异常。

### 智能体循环工具

四种工具在注册表调度之前被拦截，因为它们需要智能体级别的状态（TodoStore、MemoryStore 等）：

- `todo` —— 规划/任务跟踪
- `memory` —— 持久化内存写入
- `session_search` —— 跨会话召回
- `delegate_task` —— 创建子智能体会话

这些工具的模式仍注册在注册表中（用于 `get_tool_definitions`），但如果调度以某种方式直接到达它们，其处理程序会返回一个存根错误。

### 异步桥接

当工具处理程序是异步时，`_run_async()` 将其桥接到同步调度路径：

- **CLI 路径（无运行循环）**——使用持久事件循环以保持缓存的异步客户端处于活动状态
- **网关路径（运行循环）**——启动一个使用 `asyncio.run()` 的一次性线程
- **工作线程（并行工具）**——使用存储在线程本地存储中的每线程持久循环

## DANGEROUS_PATTERNS 审批流程

终端工具集成了 `tools/approval.py` 中定义的危险命令审批系统：

1. **模式检测**——`DANGEROUS_PATTERNS` 是一个 `(正则表达式, 描述)` 元组列表，涵盖破坏性操作：
   - 递归删除（`rm -rf`）
   - 文件系统格式化（`mkfs`、`dd`）
   - SQL 破坏性操作（`DROP TABLE`、不带 `WHERE` 的 `DELETE FROM`）
   - 系统配置覆盖（`> /etc/`）
   - 服务操作（`systemctl stop`）
   - 远程代码执行（`curl | sh`）
   - 分叉炸弹、进程终止等

2. **检测**——在执行任何终端命令之前，`detect_dangerous_command(command)` 会检查所有模式。

3. **审批提示**——如果找到匹配项：
   - **CLI 模式**——交互式提示要求用户批准、拒绝或永久允许
   - **网关模式**——异步审批回调将请求发送到消息传递平台
   - **智能审批**——可选地，辅助 LLM 可以自动批准匹配模式的低风险命令（例如，`rm -rf node_modules/` 是安全的，但匹配“递归删除”）

4. **会话状态**——审批按会话跟踪。一旦您为会话批准了“递归删除”，后续的 `rm -rf` 命令就不会再次提示。

5. **永久允许列表**——“永久允许”选项将模式写入 `config.yaml` 的 `command_allowlist`，在会话之间持久化。

## 终端/运行时环境

终端系统支持多个后端：

- 本地
- docker
- ssh
- singularity
- modal
- daytona
- vercel_sandbox

它还支持：

- 每任务当前工作目录覆盖
- 后台进程管理
- PTY 模式
- 危险命令的审批回调

## 并发

工具调用可能根据工具组合和交互要求按顺序或并发执行。

## 相关文档

- [工具集参考](../reference/toolsets-reference.md)
- [内置工具参考](../reference/tools-reference.md)
- [智能体循环内部机制](./agent-loop.md)
- [ACP 内部机制](./acp-internals.md)