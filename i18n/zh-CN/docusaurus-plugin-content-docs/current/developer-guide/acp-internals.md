---
sidebar_position: 2
title: "ACP 内部机制"
description: "ACP 适配器的工作原理：生命周期、会话、事件桥接、权限审批与工具渲染"
---

# ACP 内部机制

ACP 适配器将 Hermes 同步的 `AIAgent` 封装在一个异步的 JSON-RPC 标准输入/输出服务器中。

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
  -> 配置标准错误日志
  -> 构建 HermesACPAgent 实例
  -> acp.run_agent(agent, use_unstable_protocol=True)
```

标准输出专用于 ACP JSON-RPC 传输。人类可读的日志输出到标准错误。

## 主要组件

### `HermesACPAgent`

`acp_adapter/server.py` 实现了 ACP 智能体协议。

职责：

- 初始化/认证
- 会话的新建/加载/恢复/分叉/列表/取消方法
- 提示执行
- 会话模型切换
- 将同步 AIAgent 回调连接到 ACP 异步通知

### `SessionManager`

`acp_adapter/session.py` 跟踪活跃的 ACP 会话。

每个会话存储：

- `session_id`
- `agent`
- `cwd`
- `model`
- `history`
- `cancel_event`

该管理器是线程安全的，并支持：

- 创建
- 获取
- 移除
- 分叉
- 列表
- 清理
- cwd 更新

### 事件桥接

`acp_adapter/events.py` 将 AIAgent 回调转换为 ACP 的 `session_update` 事件。

桥接的回调：

- `tool_progress_callback`
- `thinking_callback`（当前在 ACP 桥接中设置为 `None`——推理过程通过 `step_callback` 转发）
- `step_callback`

因为 `AIAgent` 在工作线程中运行，而 ACP I/O 位于主事件循环上，所以桥接使用：

```python
asyncio.run_coroutine_threadsafe(...)
```

### 权限桥接

`acp_adapter/permissions.py` 将危险的终端审批提示适配为 ACP 权限请求。

映射：

- `allow_once` -> Hermes `once`
- `allow_always` -> Hermes `always`
- 拒绝选项 -> Hermes `deny`

超时和桥接失败默认为拒绝。

### 工具渲染助手

`acp_adapter/tools.py` 将 Hermes 工具映射到 ACP 工具类型，并构建面向编辑器的内容。

示例：

- `patch` / `write_file` -> 文件差异
- `terminal` -> shell 命令文本
- `read_file` / `search_files` -> 文本预览
- 大结果 -> 为 UI 安全而截断的文本块

## 会话生命周期

```text
new_session(cwd)
  -> 创建 SessionState
  -> 创建 AIAgent(platform="acp", enabled_toolsets=["hermes-acp"])
  -> 将 task_id/session_id 绑定到 cwd 覆盖

prompt(..., session_id)
  -> 从 ACP 内容块中提取文本
  -> 重置取消事件
  -> 安装回调 + 审批桥接
  -> 在 ThreadPoolExecutor 中运行 AIAgent
  -> 更新会话历史
  -> 发送最终智能体消息块
```

### 取消

`cancel(session_id)`：

- 设置会话取消事件
- 在可用时调用 `agent.interrupt()`
- 导致提示响应返回 `stop_reason="cancelled"`

### 分叉

`fork_session()` 将消息历史记录深拷贝到一个新的活跃会话中，保留对话状态，同时让分叉拥有自己的会话 ID 和 cwd。

## 提供者/认证行为

ACP 不实现自己的认证存储。

相反，它复用 Hermes 的运行时解析器：

- `acp_adapter/auth.py`
- `hermes_cli/runtime_provider.py`

因此，ACP 会宣告并使用当前配置的 Hermes 提供者/凭据。

## 工作目录绑定

ACP 会话携带一个编辑器 cwd。

会话管理器通过任务范围的终端/文件覆盖，将该 cwd 绑定到 ACP 会话 ID，因此文件和终端工具相对于编辑器工作区操作。

## 重复的同名工具调用

事件桥接按工具名称跟踪工具 ID 的先进先出队列，而不仅仅是每个名称一个 ID。这对以下情况很重要：

- 并行的同名调用
- 一个步骤中重复的同名调用

如果没有先进先出队列，完成事件将附加到错误的工具调用。

## 审批回调恢复

ACP 在提示执行期间临时在终端工具上安装审批回调，然后恢复之前的回调。这避免了将 ACP 会话特定的审批处理程序永久地安装在全局。

## 当前限制

- ACP 会话被持久化到共享的 `~/.hermes/state.db` (SessionDB)，并可在进程重启后透明地恢复；它们会出现在 `session_search` 中
- 非文本提示块目前在请求文本提取时被忽略
- 面向编辑器的用户体验因 ACP 客户端实现而异

## 相关文件

- `tests/acp/` — ACP 测试套件
- `toolsets.py` — `hermes-acp` 工具集定义
- `hermes_cli/main.py` — `hermes acp` CLI 子命令
- `pyproject.toml` — `[acp]` 可选依赖 + `hermes-acp` 脚本