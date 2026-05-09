---
sidebar_position: 2
title: "ACP 内部机制"
description: "ACP 适配器的工作原理：生命周期、会话、事件桥接、审批机制与工具渲染"
---

# ACP 内部机制

ACP 适配器将 Hermes 的同步 `AIAgent` 封装为一个异步 JSON-RPC stdio 服务器。

关键实现文件：

- `acp_adapter/entry.py`
- `acp_adapter/server.py`
- `acp_adapter/session.py`
- `acp_adapter/events.py`
- `acp_adapter/permissions.py`
- `acp_adapter/tools.py`
- `acp_adapter/auth.py`
- `acp_registry/agent.json`

## 启动流程

```text
hermes acp / hermes-acp / python -m acp_adapter
  -> acp_adapter.entry.main()
  -> 加载 ~/.hermes/.env
  -> 配置 stderr 日志
  -> 构造 HermesACPAgent
  -> acp.run_agent(agent, use_unstable_protocol=True)
```

标准输出（stdout）保留用于 ACP JSON-RPC 传输。人类可读的日志输出到标准错误（stderr）。

## 主要组件

### `HermesACPAgent`

`acp_adapter/server.py` 实现了 ACP 智能体协议。

职责包括：

- 初始化 / 身份验证
- 新建/加载/恢复/分叉/列出/取消会话方法
- 提示执行
- 会话模型切换
- 将同步 AIAgent 回调接入 ACP 异步通知

### `SessionManager`

`acp_adapter/session.py` 跟踪活跃的 ACP 会话。

每个会话存储：

- `session_id`（会话 ID）
- `agent`（智能体）
- `cwd`（当前工作目录）
- `model`（模型）
- `history`（历史记录）
- `cancel_event`（取消事件）

管理器是线程安全的，并支持以下操作：

- 创建
- 获取
- 移除
- 分叉
- 列出
- 清理
- 工作目录更新

### 事件桥接

`acp_adapter/events.py` 将 AIAgent 回调转换为 ACP 的 `session_update` 事件。

桥接的回调包括：

- `tool_progress_callback`
- `thinking_callback`
- `step_callback`
- `message_callback`

由于 `AIAgent` 在工作线程中运行，而 ACP 的 I/O 操作位于主事件循环上，因此桥接使用：

```python
asyncio.run_coroutine_threadsafe(...)
```

### 权限桥接

`acp_adapter/permissions.py` 将危险的终端审批提示适配为 ACP 权限请求。

映射关系：

- `allow_once` -> Hermes 的 `once`
- `allow_always` -> Hermes 的 `always`
- 拒绝选项 -> Hermes 的 `deny`

超时或桥接失败时默认拒绝。

### 工具渲染辅助

`acp_adapter/tools.py` 将 Hermes 工具映射为 ACP 工具类型，并构建面向编辑器的内容。

示例：

- `patch` / `write_file` -> 文件差异
- `terminal` -> Shell 命令文本
- `read_file` / `search_files` -> 文本预览
- 大型结果 -> 截断的文本块（以确保 UI 安全）

## 会话生命周期

```text
new_session(cwd)
  -> 创建 SessionState
  -> 创建 AIAgent(platform="acp", enabled_toolsets=["hermes-acp"])
  -> 将 task_id/session_id 绑定至 cwd 覆盖

prompt(..., session_id)
  -> 从 ACP 内容块中提取文本
  -> 重置取消事件
  -> 安装回调 + 审批桥接
  -> 在线程池执行器中运行 AIAgent
  -> 更新会话历史
  -> 发送最终的智能体消息块
```

### 取消

`cancel(session_id)`：

- 设置会话取消事件
- 在可用时调用 `agent.interrupt()`
- 导致提示响应返回 `stop_reason="cancelled"`

### 分叉

`fork_session()` 将消息历史深度复制到一个新的活跃会话中，保留对话状态，同时为分叉分配其独立的会话 ID 和工作目录。

## 提供者/身份验证行为

ACP 不实现自己的身份验证存储。

而是复用 Hermes 的运行时解析器：

- `acp_adapter/auth.py`
- `hermes_cli/runtime_provider.py`

因此，ACP 会声明并使用当前配置的 Hermes 提供者/凭据。

## 工作目录绑定

ACP 会话携带编辑器的工作目录（cwd）。

会话管理器通过任务作用域的终端/文件覆盖将该 cwd 绑定至 ACP 会话 ID，从而使文件和终端工具相对于编辑器工作空间进行操作。

## 同名工具调用的重复问题

事件桥接按工具名称 FIFO（先进先出）方式跟踪工具 ID，而不仅仅是为每个名称保留一个 ID。这对于以下情况至关重要：

- 并发的同名调用
- 单步中重复的同名调用

若无 FIFO 队列，完成事件将附加到错误的工具调用上。

## 审批回调恢复

ACP 在提示执行期间临时在终端工具上安装审批回调，之后恢复之前的回调。这可避免永久性地全局安装特定于 ACP 会话的审批处理器。

## 当前限制

- ACP 会话持久化到共享的 `~/.hermes/state.db`（SessionDB），并在进程重启后透明恢复；它们会出现在 `session_search` 中
- 非文本提示块目前在请求文本提取时被忽略
- 编辑器特定的用户体验因 ACP 客户端实现而异

## 相关文件

- `tests/acp/` — ACP 测试套件
- `toolsets.py` — `hermes-acp` 工具集定义
- `hermes_cli/main.py` — `hermes acp` CLI 子命令
- `pyproject.toml` — `[acp]` 可选依赖项 + `hermes-acp` 脚本