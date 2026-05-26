---
sidebar_position: 3
title: "智能体循环内部机制"
description: "深入解析AIAgent执行流程、API模式、工具调用、回调函数与容错行为"
---

# 智能体循环内部机制

核心编排引擎是 `run_agent.py` 中的 `AIAgent` 类——一个超过 15,000 行代码的庞然大物，负责处理从提示词组装到工具调度、再到服务商故障切换的所有流程。

## 核心职责

`AIAgent` 主要负责：

- 通过 `prompt_builder.py` 组装有效的系统提示词与工具模式
- 选择正确的 API 服务商/模式（如 chat_completions、codex_responses、anthropic_messages）
- 执行可中断的模型调用并支持取消操作
- 执行工具调用（支持顺序执行或通过线程池并发执行）
- 以 OpenAI 消息格式维护对话历史记录
- 处理上下文压缩、重试机制与备用模型切换
- 跟踪父子智能体间的迭代次数预算
- 在上下文丢失前刷新持久化记忆

## 两个入口点

```python
# 简单接口 —— 返回最终响应字符串
response = agent.chat("修复 main.py 中的 bug")

# 完整接口 —— 返回包含消息、元数据、使用情况统计的字典
result = agent.run_conversation(
    user_message="修复 main.py 中的 bug",
    system_message=None,           # 如果省略则自动构建
    conversation_history=None,      # 如果省略则从会话自动加载
    task_id="task_abc123"
)
```

`chat()` 是 `run_conversation()` 的一个轻量封装，用于从结果字典中提取 `final_response` 字段。

## API 模式

Hermes 支持三种 API 执行模式，通过提供者选择、显式参数和基础 URL 启发式规则进行解析：

| API 模式 | 用途 | 客户端类型 |
|----------|----------|-------------|
| `chat_completions` | OpenAI 兼容端点（OpenRouter、自定义、大多数提供者） | `openai.OpenAI` |
| `codex_responses` | OpenAI Codex / Responses API | `openai.OpenAI`（使用 Responses 格式） |
| `anthropic_messages` | 原生 Anthropic Messages API | 通过适配器调用的 `anthropic.Anthropic` |

该模式决定了消息格式化方式、工具调用结构、响应解析方式以及缓存/流式传输机制。所有三种模式在 API 调用前后都会统一到相同的内部消息格式（OpenAI 风格的 `role`/`content`/`tool_calls` 字典）。

**模式解析顺序：**
1. 显式 `api_mode` 构造函数参数（最高优先级）
2. 提供者特定检测（例如，`anthropic` 提供者 → `anthropic_messages`）
3. 基础 URL 启发式规则（例如，`api.anthropic.com` → `anthropic_messages`）
4. 默认值：`chat_completions`

## 对话轮次生命周期

智能体循环的每次迭代遵循以下序列：

```text
run_conversation()
  1. 如果未提供则生成 task_id
  2. 将用户消息附加到对话历史记录
  3. 构建或复用缓存的系统提示词 (prompt_builder.py)
  4. 检查是否需要预压缩（超过上下文窗口的 50%）
  5. 从对话历史记录构建 API 消息
     - chat_completions：原样使用 OpenAI 格式
     - codex_responses：转换为 Responses API 输入项
     - anthropic_messages：通过 anthropic_adapter.py 转换
  6. 注入临时提示词层（预算警告、上下文压力）
  7. 如果在 Anthropic 上则应用提示词缓存标记
  8. 进行可中断的 API 调用 (_interruptible_api_call)
  9. 解析响应：
     - 如果包含 tool_calls：执行它们，附加结果，循环回步骤 5
     - 如果是文本响应：持久化会话，如需刷新内存，然后返回
```

### 消息格式

所有消息在内部均使用 OpenAI 兼容格式：

```python
{"role": "system", "content": "..."}
{"role": "user", "content": "..."}
{"role": "assistant", "content": "...", "tool_calls": [...]}
{"role": "tool", "tool_call_id": "...", "content": "..."}
```

推理内容（来自支持扩展思维的模型）存储在 `assistant_msg["reasoning"]` 中，并可选地通过 `reasoning_callback` 显示。

### 消息交替规则

智能体循环强制执行严格的消息角色交替：

- 在系统消息之后：`User → Assistant → User → Assistant → ...`
- 在工具调用期间：`Assistant (with tool_calls) → Tool → Tool → ... → Assistant`
- **绝不**允许两个连续的 assistant 消息
- **绝不**允许两个连续的 user 消息
- **只有** `tool` 角色可以拥有连续条目（并行工具结果）

提供者会验证这些序列并拒绝格式错误的历史记录。

## 可中断的 API 调用

API 请求被包装在 `_interruptible_api_call()` 中，它在后台线程中运行实际的 HTTP 调用，同时监控中断事件：

```text
┌────────────────────────────────────────────────────┐
│  主线程                  API 线程                  │
│                                                    │
│   等待:                      HTTP POST             │
│    - 响应就绪           ───▶  发送给提供者         │
│    - 中断事件                                       │
│    - 超时                                           │
└────────────────────────────────────────────────────┘
```

当中断发生时（用户发送新消息、`/stop` 命令或信号）：
- API 线程被丢弃（响应被丢弃）
- 智能体可以处理新输入或干净地关闭
- 不会有部分响应被注入对话历史记录

## 工具执行

### 顺序执行与并发执行

当模型返回工具调用时：

- **单个工具调用** → 直接在主线程中执行
- **多个工具调用** → 通过 `ThreadPoolExecutor` 并发执行
  - 例外：标记为交互式的工具（例如 `clarify`）强制顺序执行
  - 结果会按照原始的工具调用顺序重新插入，无论完成顺序如何

### 执行流程

```text
对于每个 response.tool_calls 中的 tool_call:
    1. 从 tools/registry.py 解析处理函数
    2. 触发 pre_tool_call 插件钩子
    3. 检查是否为危险命令 (tools/approval.py)
       - 如果是：调用 approval_callback，等待用户确认
    4. 使用参数和 task_id 执行处理函数
    5. 触发 post_tool_call 插件钩子
    6. 将 {"role": "tool", "content": result} 附加到历史记录
```

### 智能体级工具

某些工具在到达 `handle_function_call()` *之前*会被 `run_agent.py` 拦截：

| 工具 | 拦截原因 |
|------|--------------------|
| `todo` | 读取/写入智能体本地的任务状态 |
| `memory` | 写入具有字符限制的持久化内存文件 |
| `session_search` | 通过智能体的会话数据库查询会话历史 |
| `delegate_task` | 生成具有隔离上下文的子智能体 |

这些工具直接修改智能体状态，并返回合成的工具结果，而不通过注册表。

## 回调接口

`AIAgent` 支持平台特定的回调，以在 CLI、网关和 ACP 集成中实现实时进度更新：

| 回调 | 触发时机 | 使用方 |
|----------|-----------|---------|
| `tool_progress_callback` | 每个工具执行前/后 | CLI 旋转指示器，网关进度消息 |
| `thinking_callback` | 当模型开始/停止思考时 | CLI “思考中...” 指示器 |
| `reasoning_callback` | 当模型返回推理内容时 | CLI 推理显示，网关推理块 |
| `clarify_callback` | 当调用 `clarify` 工具时 | CLI 输入提示，网关交互消息 |
| `step_callback` | 每个完整的智能体轮次之后 | 网关步骤跟踪，ACP 进度 |
| `stream_delta_callback` | 每个流式传输的 token（启用时） | CLI 流式显示 |
| `tool_gen_callback` | 当从流中解析出工具调用时 | CLI 旋转指示器中的工具预览 |
| `status_callback` | 状态变化（思考中、执行中等） | ACP 状态更新 |

## 预算和回退行为

### 迭代预算

智能体通过 `IterationBudget` 跟踪迭代次数：

- 默认值：90 次迭代（可通过 `agent.max_turns` 配置）
- 每个智能体都有自己的预算。子智能体获得独立的预算，上限为 `delegation.max_iterations`（默认 50）—— 父智能体 + 子智能体的总迭代次数可以超过父智能体的上限
- 达到 100% 时，智能体停止并返回已完成工作的摘要

### 回退模型

当主模型失败时（429 速率限制、5xx 服务器错误、401/403 认证错误）：

1. 检查配置中的 `fallback_providers` 列表
2. 按顺序尝试每个回退提供者
3. 成功后，使用新提供者继续对话
4. 遇到 401/403 时，在回退失败前尝试刷新凭据

回退系统也独立覆盖辅助任务 —— 视觉、压缩和网络提取各自拥有自己的回退链，可通过 `auxiliary.*` 配置节进行配置。

## 压缩与持久化

### 压缩触发时机

- **预压缩**（API 调用前）：如果对话超过模型上下文窗口的 50%
- **网关自动压缩**：如果对话超过 85%（更激进，在对话轮次之间运行）

### 压缩期间发生什么

1. 首先将内存刷新到磁盘（防止数据丢失）
2. 中间的对话轮次被总结成紧凑的摘要
3. 最后 N 条消息被完整保留（`compression.protect_last_n`，默认值：20）
4. 工具调用/结果消息对被保持在一起（永不拆分）
5. 生成新的会话谱系 ID（压缩创建一个“子”会话）

### 会话持久化

每个对话轮次之后：
- 消息被保存到会话存储（通过 `hermes_state.py` 使用 SQLite）
- 内存更改被刷新到 `MEMORY.md` / `USER.md`
- 稍后可通过 `/resume` 或 `hermes chat --resume` 恢复会话

## 关键源文件

| 文件 | 用途 |
|------|---------|
| `run_agent.py` | AIAgent 类 —— 完整的智能体循环 |
| `agent/prompt_builder.py` | 从内存、技能、上下文文件、个性组装系统提示词 |
| `agent/context_engine.py` | ContextEngine 抽象基类 —— 可插拔的上下文管理 |
| `agent/context_compressor.py` | 默认引擎 —— 有损摘要算法 |
| `agent/prompt_caching.py` | Anthropic 提示词缓存标记和缓存指标 |
| `agent/auxiliary_client.py` | 用于辅助任务（视觉、摘要）的辅助 LLM 客户端 |
| `model_tools.py` | 工具模式集合，`handle_function_call()` 调度 |
## 相关文档

- [提供者运行时解析](./provider-runtime.md)
- [提示词组装](./prompt-assembly.md)
- [上下文压缩与提示词缓存](./context-compression-and-caching.md)
- [工具运行时](./tools-runtime.md)
- [架构概述](./architecture.md)