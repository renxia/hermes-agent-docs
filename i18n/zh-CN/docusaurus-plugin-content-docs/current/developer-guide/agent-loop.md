---
sidebar_position: 3
title: "Agent Loop Internals"
description: "Detailed walkthrough of AIAgent execution, API modes, tools, callbacks, and fallback behavior"
---

# 智能体循环内部机制

核心编排引擎是 `run_agent.py` 中的 `AIAgent` 类——一个大型文件，负责从提示词组装到工具分发再到提供商故障转移的所有事务。

## 核心职责

`AIAgent` 负责以下事项：

- 通过 `prompt_builder.py` 组装有效的系统提示词和工具模式
- 选择正确的提供商/API 模式（chat_completions、codex_responses、anthropic_messages）
- 进行可中断的模型调用，支持取消操作
- 执行工具调用（通过线程池顺序或并发执行）
- 以 OpenAI 消息格式维护对话历史
- 处理压缩、重试和备用模型切换
- 跟踪父智能体和子智能体的迭代预算
- 在上下文丢失前刷新持久化内存

## 两个入口

```python
# 简单接口——返回最终响应字符串
response = agent.chat("修复 main.py 中的错误")

# 完整接口——返回包含消息、元数据、使用统计的字典
result = agent.run_conversation(
    user_message="修复 main.py 中的错误",
    system_message=None,           # 如省略则自动构建
    conversation_history=None,      # 如省略则从会话自动加载
    task_id="task_abc123"
)
```

`chat()` 是 `run_conversation()` 的薄封装，从结果字典中提取 `final_response` 字段。

## API 模式

Hermes 支持三种 API 执行模式，通过提供商选择、显式参数和 base URL 启发式方法解析：

| API 模式 | 用于 | 客户端类型 |
|----------|------|-------------|
| `chat_completions` | OpenAI 兼容端点（OpenRouter、自定义、大多数提供商） | `openai.OpenAI` |
| `codex_responses` | OpenAI Codex / Responses API | 使用 Responses 格式的 `openai.OpenAI` |
| `anthropic_messages` | 原生 Anthropic Messages API | 通过适配器调用的 `anthropic.Anthropic` |

该模式决定了消息的格式化方式、工具调用的结构、响应的解析方式以及缓存/流式传输的工作方式。这三种模式在 API 调用前后都汇聚到相同的内部消息格式（OpenAI 风格的 `role`/`content`/`tool_calls` 字典）。

**模式解析顺序：**
1. 显式 `api_mode` 构造函数参数（最高优先级）
2. 提供商特定检测（例如，`anthropic` 提供商 → `anthropic_messages`）
3. base URL 启发式方法（例如，`api.anthropic.com` → `anthropic_messages`）
4. 默认：`chat_completions`

## 轮次生命周期

智能体循环的每次迭代遵循以下顺序：

```text
run_conversation()
  1. 如未提供则生成 task_id
  2. 将用户消息追加到对话历史
  3. 构建或复用缓存的系统提示词（prompt_builder.py）
  4. 检查是否需要预检压缩（>50% 上下文）
  5. 从对话历史构建 API 消息
     - chat_completions：直接使用 OpenAI 格式
     - codex_responses：转换为 Responses API 输入项
     - anthropic_messages：通过 anthropic_adapter.py 转换
  6. 注入临时提示词层（预算警告、上下文压力）
  7. 如使用 Anthropic 则应用提示词缓存标记
  8. 进行可中断的 API 调用（_interruptible_api_call）
  9. 解析响应：
     - 如果包含 tool_calls：执行它们，追加结果，回到步骤 5 循环
     - 如果是文本响应：持久化会话，如需要则刷新内存，返回
```

### 消息格式

所有消息内部使用 OpenAI 兼容格式：

```python
{"role": "system", "content": "..."}
{"role": "user", "content": "..."}
{"role": "assistant", "content": "...", "tool_calls": [...]}
{"role": "tool", "tool_call_id": "...", "content": "..."}
```

推理内容（来自支持扩展思考的模型）存储在 `assistant_msg["reasoning"]` 中，可通过 `reasoning_callback` 选择性地显示。

### 消息交替规则

智能体循环强制执行严格的消息角色交替：

- 系统消息之后：`用户 → 智能体 → 用户 → 智能体 → ...`
- 工具调用期间：`智能体（含 tool_calls）→ 工具 → 工具 → ... → 智能体`
- **绝不能** 有两个连续的智体体消息
- **绝不能** 有两个连续的用户消息
- **只有** `tool` 角色可以有连续条目（并行工具结果）

提供商会验证这些序列，拒绝格式错误的历史记录。

## 可中断的 API 调用

API 请求封装在 `_interruptible_api_call()` 中，该函数在后台线程中运行实际 HTTP 调用，同时监控中断事件：

```text
┌────────────────────────────────────────────────────┐
│  主线程                        API 线程             │
│                                                    │
│   等待：                       HTTP POST           │
│    - 响应就绪           ───▶   发往提供商          │
│    - 中断事件                                  │
│    - 超时                                       │
└────────────────────────────────────────────────────┘
```

当被中断时（用户发送新消息、`/stop` 命令或信号）：
- API 线程被放弃（响应被丢弃）
- 智能体可以处理新输入或干净地关闭
- 不会将部分响应注入对话历史

## 工具执行

### 顺序与并发

当模型返回工具调用时：

- **单个工具调用** → 在主线程中直接执行
- **多个工具调用** → 通过 `ThreadPoolExecutor` 并发执行
  - 例外：标记为交互式的工具（例如 `clarify`）强制顺序执行
  - 结果按原始工具调用顺序重新插入，与完成顺序无关

### 执行流程

```text
for each tool_call in response.tool_calls:
    1. 从 tools/registry.py 解析处理程序
    2. 触发 pre_tool_call 插件钩子
    3. 检查是否为危险命令（tools/approval.py）
       - 如为危险：调用 approval_callback，等待用户
    4. 使用参数 + task_id 执行处理程序
    5. 触发 post_tool_call 插件钩子
    6. 将 {"role": "tool", "content": result} 追加到历史
```

### 智能体级别的工具

某些工具在到达 `handle_function_call()` 之前被 `run_agent.py` *拦截*：

| 工具 | 为何被拦截 |
|------|--------------------|
| `todo` | 读取/写入智能体本地的任务状态 |
| `memory` | 写入带字符限制的持久化内存文件 |
| `session_search` | 通过智能体的会话数据库查询会话历史 |
| `delegate_task` | 生成具有隔离上下文的子智能体 |

这些工具直接修改智能体状态并返回合成的工具结果，不经过注册表。

## 回调接口

`AIAgent` 支持特定平台的回调，用于在 CLI、网关和 ACP 集成中实现实时进度：

| 回调 | 触发时机 | 用于 |
|----------|-----------|---------|
| `tool_progress_callback` | 每次工具执行前后 | CLI 旋转指示器、网关进度消息 |
| `thinking_callback` | 模型开始/停止思考时 | CLI "思考中..." 指示器 |
| `reasoning_callback` | 模型返回推理内容时 | CLI 推理显示、网关推理块 |
| `clarify_callback` | 调用 `clarify` 工具时 | CLI 输入提示、网关交互消息 |
| `step_callback` | 每个完整的智能体轮次后 | 网关步骤跟踪、ACP 进度 |
| `stream_delta_callback` | 每个流式令牌（启用时） | CLI 流式显示 |
| `tool_gen_callback` | 从流中解析出工具调用时 | CLI 旋转指示器中的工具预览 |
| `status_callback` | 状态变化时（思考、执行等） | ACP 状态更新 |

## 预算与回退行为

### 迭代预算

智能体通过 `IterationBudget` 跟踪迭代：

- 默认：90 次迭代（可通过 `agent.max_turns` 配置）
- 每个智能体获得自己的预算。子智能体获得独立预算，上限为 `delegation.max_iterations`（默认 50）——父智能体与子智能体的总迭代次数可以超过父智能体的上限
- 达到 100% 时，智能体停止并返回已完成工作的摘要

### 备用模型

当主模型失败时（429 速率限制、5xx 服务器错误、401/403 认证错误）：

1. 检查配置中的 `fallback_providers` 列表
2. 按顺序尝试每个备用提供商
3. 成功时，使用新提供商继续对话
4. 遇到 401/403 时，在故障转移前尝试刷新凭证

回退系统还独立覆盖辅助任务——视觉、压缩和网页提取各自拥有自己的回退链，可通过 `auxiliary.*` 配置部分进行配置。

## 压缩与持久化

### 触发压缩的时机

- **预检**（API 调用前）：如果对话超过模型上下文窗口的 50%
- **网关自动压缩**：如果对话超过 85%（更激进，在轮次之间运行）

### 压缩期间发生的情况

1. 内存首先刷新到磁盘（防止数据丢失）
2. 中间的对话轮次被摘要为紧凑的总结
3. 最后 N 条消息保持完整（`compression.protect_last_n`，默认：20）
4. 工具调用/结果消息对保持在一起（绝不拆分）
5. 生成新的会话血统 ID（压缩创建"子"会话）

### 会话持久化

每次轮次后：
- 消息保存到会话存储（通过 `hermes_state.py` 使用 SQLite）
- 内存变更刷新到 `MEMORY.md` / `USER.md`
- 会话可通过 `/resume` 或 `hermes chat --resume` 恢复

## 关键源文件

| 文件 | 用途 |
|------|---------|
| `run_agent.py` | AIAgent 类——完整的智能体循环 |
| `agent/prompt_builder.py` | 从内存、技能、上下文文件、个性组装系统提示词 |
| `agent/context_engine.py` | ContextEngine ABC——可插拔的上下文管理 |
| `agent/context_compressor.py` | 默认引擎——有损摘要算法 |
| `agent/prompt_caching.py` | Anthropic 提示词缓存标记和缓存指标 |
| `agent/auxiliary_client.py` | 用于辅助任务（视觉、摘要）的辅助 LLM 客户端 |
| `model_tools.py` | 工具模式收集、`handle_function_call()` 分发 |

## 相关文档

- [提供商运行时解析](./provider-runtime.md)
- [提示词组装](./prompt-assembly.md)
- [上下文压缩与提示词缓存](./context-compression-and-caching.md)
- [工具运行时](./tools-runtime.md)
- [架构概览](./architecture.md)