---
sidebar_position: 2
title: "ACP Internals"
description: "How the ACP adapter works: lifecycle, sessions, event bridge, approvals, and tool rendering"
---

# ACP 内部机制

ACP 适配器将 Hermes 的同步 `AIAgent` 封装在一个异步 JSON-RPC stdio 服务器中。

关键实现文件：

- `acp_adapter/entry.py`
- `acp_adapter/server.py`
- `acp_adapter/session.py`
- `acp_adapter/events.py`
- `acp_adapter/permissions.py`
- `acp_adapter/tools.py`
- `acp_adapter/auth.py`
- `acp_registry/agent.json`

## 启动流程 (Boot flow)

```text
hermes acp / hermes-acp / python -m acp_adapter
  -> acp_adapter.entry.main()
  -> load ~/.hermes/.env
  -> configure stderr logging
  -> construct HermesACPAgent
  -> acp.run_agent(agent)
```

Stdout 专用于 ACP JSON-RPC 传输。人类可读的日志输出到 stderr。

## 主要组件 (Major components)

### `HermesACPAgent`

`acp_adapter/server.py` 实现了 ACP 智能体协议。

职责：

- 初始化 / 身份验证
- 新建/加载/恢复/派生/列出/取消会话方法
- 提示执行
- 会话模型切换
- 将同步 AIAgent 回调连接到 ACP 异步通知

### `SessionManager`

`acp_adapter/session.py` 跟踪活动的 ACP 会话。

每个会话存储：

- `session_id`
- `agent`
- `cwd`
- `model`
- `history`
- `cancel_event`

该管理器是线程安全的，并支持：

- 创建 (create)
- 获取 (get)
- 删除 (remove)
- 派生 (fork)
- 列出 (list)
- 清理 (cleanup)
- cwd 更新

### 事件桥接 (Event bridge)

`acp_adapter/events.py` 将 AIAgent 回调转换为 ACP 的 `session_update` 事件。

桥接的回调：

- `tool_progress_callback`
- `thinking_callback`
- `step_callback`
- `message_callback`

由于 `AIAgent` 在工作线程中运行，而 ACP I/O 运行在主事件循环上，因此该桥接使用了：

```python
asyncio.run_coroutine_threadsafe(...)
```

### 权限桥接 (Permission bridge)

`acp_adapter/permissions.py` 将危险的终端批准提示适配为 ACP 权限请求。

映射关系：

- `allow_once` -> Hermes `once`
- `allow_always` -> Hermes `always`
- 拒绝选项 -> Hermes `deny`

超时和桥接失败默认拒绝。

### 工具渲染辅助函数 (Tool rendering helpers)

`acp_adapter/tools.py` 将 Hermes 工具映射到 ACP 工具类型，并构建供编辑器使用的内容。

示例：

- `patch` / `write_file` -> 文件差异 (file diffs)
- `terminal` -> Shell 命令文本
- `read_file` / `search_files` -> 文本预览
- 大结果 -> 为保证 UI 安全而截断的文本块

## 会话生命周期 (Session lifecycle)

```text
new_session(cwd)
  -> 创建 SessionState
  -> 创建 AIAgent(platform="acp", enabled_toolsets=["hermes-acp"])
  -> 将 task_id/session_id 绑定到 cwd 覆盖
```

```text
prompt(..., session_id)
  -> 从 ACP 内容块中提取文本
  -> 重置取消事件
  -> 安装回调 + 批准桥接
  -> 在 ThreadPoolExecutor 中运行 AIAgent
  -> 更新会话历史
  -> 发射最终的智能体消息块
```

### 取消 (Cancelation)

`cancel(session_id)`：

- 设置会话取消事件
- 可用时调用 `agent.interrupt()`
- 导致提示响应返回 `stop_reason="cancelled"`

### 派生 (Forking)

`fork_session()` 将消息历史深度复制到新的活动会话中，在保留对话状态的同时，为派生会话提供独立的会话 ID 和 cwd。

## Provider/auth 行为

ACP 没有实现自己的认证存储。

相反，它重用了 Hermes 的运行时解析器：

- `acp_adapter/auth.py`
- `hermes_cli/runtime_provider.py`

因此，ACP 声明并使用当前配置的 Hermes Provider/凭证。

## 工作目录绑定 (Working directory binding)

ACP 会话携带一个编辑器 cwd。

会话管理器通过任务范围的终端/文件覆盖，将该 cwd 绑定到 ACP 会话 ID，从而使文件和终端工具相对于编辑器工作区运行。

## 重复同名工具调用 (Duplicate same-name tool calls)

事件桥接跟踪的是每个工具名称的 FIFO 工具 ID，而不仅仅是每个名称的一个 ID。这对于以下情况很重要：

- 并行同名调用
- 单步重复同名调用

如果没有 FIFO 队列，完成事件将附加到错误的工具调用上。

## 批准回调恢复 (Approval callback restoration)

ACP 在提示执行期间临时在终端工具上安装一个批准回调，然后在之后恢复之前的回调。这避免了 ACP 会话特定的批准处理程序永久性地安装在全局。

## 当前限制 (Current limitations)

- 从 ACP 服务器的角度来看，ACP 会话是进程本地的
- 当前忽略非文本的提示块，用于请求文本提取
- 编辑器特定的用户体验因 ACP 客户端实现而异

## 相关文件 (Related files)

- `tests/acp/` — ACP 测试套件
- `toolsets.py` — `hermes-acp` 工具集定义
- `hermes_cli/main.py` — `hermes acp` CLI 子命令
- `pyproject.toml` — `[acp]` 可选依赖 + `hermes-acp` 脚本