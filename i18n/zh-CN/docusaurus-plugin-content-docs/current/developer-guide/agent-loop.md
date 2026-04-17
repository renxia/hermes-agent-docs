---
sidebar_position: 3
title: "智能体循环内部机制"
description: "AIAgent 执行、API 模式、工具、回调和故障转移行为的详细解析"
---

# 智能体循环内部机制

核心编排引擎是 `run_agent.py` 中的 `AIAgent` 类——它大约有 10,700 行代码，负责处理从提示词组装到工具分派再到提供商故障转移的方方面面。

## 核心职责

`AIAgent` 负责以下任务：

- 通过 `prompt_builder.py` 组装有效的系统提示词和工具模式（schemas）
- 选择正确的提供商/API 模式（chat_completions, codex_responses, anthropic_messages）
- 进行可中断的模型调用，并支持取消功能
- 执行工具调用（通过线程池顺序或并发执行）
- 以 OpenAI 消息格式维护对话历史记录
- 处理压缩、重试和故障转移模型切换
- 跟踪父智能体和子智能体的迭代预算
- 在上下文丢失前刷新持久化内存

## 两个入口点

```python
# 简单接口 — 返回最终响应字符串
response = agent.chat("Fix the bug in main.py")

# 完整接口 — 返回包含消息、元数据、使用统计信息的字典
result = agent.run_conversation(
    user_message="Fix the bug in main.py",
    system_message=None,           # 忽略时自动构建
    conversation_history=None,      # 忽略时从会话中自动加载
    task_id="task_abc123"
)
```

`chat()` 是 `run_conversation()` 的一个薄封装，它从结果字典中提取 `final_response` 字段。

## API 模式

Hermes 支持三种 API 执行模式，这些模式通过提供商选择、显式参数和基础 URL 启发式方法确定：

| API 模式 | 用途 | 客户端类型 |
|----------|----------|-------------|
| `chat_completions` | 兼容 OpenAI 的端点（OpenRouter、自定义、大多数提供商） | `openai.OpenAI` |
| `codex_responses` | OpenAI Codex / Responses API | `openai.OpenAI` with Responses format |
| `anthropic_messages` | 原生 Anthropic Messages API | `anthropic.Anthropic` via adapter |

模式决定了消息的格式、工具调用的结构、响应的解析方式以及缓存/流式传输的工作原理。在 API 调用之前和之后，所有三种模式都会统一到相同的内部消息格式（OpenAI 风格的 `role`/`content`/`tool_calls` 字典）。

**模式解析顺序：**
1. 显式的 `api_mode` 构造函数参数（最高优先级）
2. 提供商特定的检测（例如，`anthropic` 提供商 → `anthropic_messages`）
3. 基础 URL 启发式方法（例如，`api.anthropic.com` → `anthropic_messages`）
4. 默认值：`chat_completions`

## 回合生命周期

智能体循环的每一次迭代都遵循以下序列：

```text
run_conversation()
  1. 如果未提供，则生成 task_id
  2. 将用户消息追加到对话历史记录
  3. 构建或重用缓存的系统提示词（prompt_builder.py）
  4. 检查是否需要预检压缩（上下文超过 50%）
  5. 从对话历史记录构建 API 消息
     - chat_completions: 保持 OpenAI 格式不变
     - codex_responses: 转换为 Responses API 输入项
     - anthropic_messages: 通过 anthropic_adapter.py 转换
  6. 注入临时提示层（预算警告、上下文压力）
  7. 如果使用 Anthropic，应用提示缓存标记
  8. 发起可中断的 API 调用 (_api_call_with_interrupt)
  9. 解析响应：
     - 如果包含 tool_calls：执行它们，追加结果，循环回步骤 5
     - 如果是文本响应：持久化会话，如果需要则刷新内存，然后返回
```

### 消息格式

所有消息内部都使用兼容 OpenAI 的格式：

```python
{"role": "system", "content": "..."}
{"role": "user", "content": "..."}
{"role": "assistant", "content": "...", "tool_calls": [...]}
{"role": "tool", "tool_call_id": "...", "content": "..."}
```

推理内容（来自支持扩展思考的模型）存储在 `assistant_msg["reasoning"]` 中，并通过 `reasoning_callback` 可选地显示。

### 消息交替规则

智能体循环强制执行严格的消息角色交替：

- 系统消息之后：`用户 → 助手 → 用户 → 助手 → ...`
- 工具调用期间：`助手 (带 tool_calls) → 工具 → 工具 → ... → 助手`
- **绝不**连续出现两个助手消息
- **绝不**连续出现两个用户消息
- **只有** `tool` 角色可以连续出现（并行工具结果）

提供商会验证这些序列，并会拒绝格式错误的历史记录。

## 可中断的 API 调用

API 请求封装在 `_api_call_with_interrupt()` 中，该函数在一个后台线程中运行实际的 HTTP 调用，同时监控中断事件：

```text
┌────────────────────────────────────────────────────┐
│  主线程                  API 线程           │
│                                                    │
│   等待：                     HTTP POST           │
│    - 响应就绪     ───▶   发送给提供商         │
│    - 中断事件                               │
│    - 超时       │
└────────────────────────────────────────────────────┘
```

当被中断时（用户发送新消息、`/stop` 命令或信号）：
- API 线程被放弃（响应被丢弃）
- 智能体可以处理新的输入或干净地关闭
- 不会将部分响应注入到对话历史记录中

## 工具执行

### 顺序执行 vs 并发执行

当模型返回工具调用时：

- **单个工具调用** → 直接在主线程中执行
- **多个工具调用** → 通过 `ThreadPoolExecutor` 并发执行
  - 例外：标记为交互式（例如 `clarify`）的工具会强制顺序执行
  - 无论完成顺序如何，结果都会按原始工具调用顺序重新插入

### 执行流程

```text
for each tool_call in response.tool_calls:
    1. 从 tools/registry.py 解析处理器
    2. 触发 pre_tool_call 插件钩子
    3. 检查是否为危险命令（tools/approval.py）
       - 如果是危险的：调用 approval_callback，等待用户
    4. 使用参数 + task_id 执行处理器
    5. 触发 post_tool_call 插件钩子
    6. 将 {"role": "tool", "content": result} 追加到历史记录
```

### 智能体级工具

某些工具在到达 `handle_function_call()` 之前，就会被 `run_agent.py` 拦截：

| 工具 | 被拦截的原因 |
|------|--------------------|
| `todo` | 读取/写入智能体本地任务状态 |
| `memory` | 写入具有字符限制的持久化内存文件 |
| `session_search` | 通过智能体的会话数据库查询会话历史记录 |
| `delegate_task` | 创建具有隔离上下文的子智能体 |

这些工具直接修改智能体状态，并返回合成的工具结果，而无需经过注册表。

## 回调表面 (Callback Surfaces)

`AIAgent` 支持平台特定的回调，可在 CLI、网关和 ACP 集成中实现实时进度报告：

| 回调 | 触发时机 | 使用方 |
|----------|-----------|---------|
| `tool_progress_callback` | 每次工具执行之前/之后 | CLI 回形针、网关进度消息 |
| `thinking_callback` | 模型开始/停止思考时 | CLI "正在思考..." 指示器 |
| `reasoning_callback` | 模型返回推理内容时 | CLI 推理显示、网关推理块 |
| `clarify_callback` | 调用 `clarify` 工具时 | CLI 输入提示、网关交互消息 |
| `step_callback` | 每个完整的智能体回合之后 | 网关步骤跟踪、ACP 进度 |
| `stream_delta_callback` | 每个流式传输的 token（启用时） | CLI 流式显示 |
| `tool_gen_callback` | 从流中解析工具调用时 | CLI 回形针中的工具预览 |
| `status_callback` | 状态变化（思考、执行等） | ACP 状态更新 |

## 预算和故障转移行为

### 迭代预算

智能体通过 `IterationBudget` 跟踪迭代次数：

- 默认值：90 次迭代（可通过 `agent.max_turns` 配置）
- 每个智能体都有自己的预算。子智能体有独立的预算，上限为 `delegation.max_iterations`（默认 50）——父智能体和子智能体的总迭代次数可以超过父智能体的上限
- 当达到 100% 时，智能体停止并返回已完成工作的摘要

### 故障转移模型

当主模型失败时（429 速率限制、5xx 服务器错误、401/403 认证错误）：

1. 检查配置中的 `fallback_providers` 列表
2. 按照顺序尝试每个备用提供商
3. 成功后，使用新的提供商继续对话
4. 遇到 401/403 时，在故障转移前尝试刷新凭证

故障转移系统还独立地涵盖了辅助任务——视觉、压缩、网页提取和会话搜索，每个任务都可以通过 `auxiliary.*` 配置部分配置自己的故障转移链。

## 压缩和持久化

### 何时触发压缩

- **预检 (Preflight)**（API 调用前）：如果对话超过模型上下文窗口的 50%
- **网关自动压缩**：如果对话超过 85%（更激进，在回合之间运行）

### 压缩期间发生什么

1. 首先将内存刷新到磁盘（防止数据丢失）
2. 中间对话回合被总结成一个紧凑的摘要
3. 保留最后 N 条消息完整无损（`compression.protect_last_n`，默认：20）
4. 工具调用/结果消息对被一起保留（绝不分割）
5. 生成一个新的会话谱系 ID（压缩会创建一个“子”会话）

### 会话持久化

每个回合之后：
- 消息被保存到会话存储中（通过 `hermes_state.py` 的 SQLite）
- 内存更改被刷新到 `MEMORY.md` / `USER.md`
- 会话可以稍后通过 `/resume` 或 `hermes chat --resume` 恢复

## 关键源文件

| 文件 | 用途 |
|------|---------|
| `run_agent.py` | AIAgent 类 — 完整的智能体循环（约 10,700 行） |
| `agent/prompt_builder.py` | 从内存、技能、上下文文件、个性化信息组装系统提示词 |
| `agent/context_engine.py` | ContextEngine ABC — 可插拔的上下文管理 |
| `agent/context_compressor.py` | 默认引擎 — 有损摘要算法 |
| `agent/prompt_caching.py` | Anthropic 提示缓存标记和缓存指标 |
| `agent/auxiliary_client.py` | 用于辅助任务（视觉、摘要）的辅助 LLM 客户端 |
| `model_tools.py` | 工具模式集合，`handle_function_call()` 分派 |

## 相关文档

- [Provider Runtime Resolution](./provider-runtime.md)
- [Prompt Assembly](./prompt-assembly.md)
- [Context Compression & Prompt Caching](./context-compression-and-caching.md)
- [Tools Runtime](./tools-runtime.md)
- [Architecture Overview](./architecture.md)