---
sidebar_position: 3
title: "智能体循环内部机制"
description: "详细解析AIAgent的执行流程、API模式、工具调用、回调函数和回退行为"
---

# 智能体循环内部机制

核心编排引擎是 `run_agent.py` 中的 `AIAgent` 类——约10,700行代码，负责从提示词组装到工具调度再到提供程序故障转移的所有操作。

## 核心职责

`AIAgent` 负责：

- 通过 `prompt_builder.py` 组装有效的系统提示词和工具模式
- 选择正确的提供程序/API模式（chat_completions、codex_responses、anthropic_messages）
- 进行可中断的模型调用并具备取消支持
- 执行工具调用（顺序或并发，通过线程池）
- 以OpenAI消息格式维护对话历史
- 处理压缩、重试和备用模型切换
- 跨父级和子级智能体跟踪迭代预算
- 在上下文丢失前刷新持久化内存

## 两个入口点

```python
# 简单接口 — 返回最终响应字符串
response = agent.chat("修复 main.py 中的 bug")

# 完整接口 — 返回包含消息、元数据和使用统计信息的字典
result = agent.run_conversation(
    user_message="修复 main.py 中的 bug",
    system_message=None,           # 如果省略则自动构建
    conversation_history=None,      # 如果省略则从会话中自动加载
    task_id="task_abc123"
)
```

`chat()` 是 `run_conversation()` 的轻量级包装器，用于提取结果字典中的 `final_response` 字段。

## API 模式

Hermes 支持三种 API 执行模式，这些模式由提供程序选择、显式参数和基本 URL 启发式方法决定：

| API 模式 | 用途 | 客户端类型 |
|----------|----------|-------------|
| `chat_completions` | OpenAI 兼容端点（OpenRouter、自定义、大多数提供程序） | `openai.OpenAI` |
| `codex_responses` | OpenAI Codex / Responses API | 使用 Responses 格式的 `openai.OpenAI` |
| `anthropic_messages` | 原生 Anthropic Messages API | 通过适配器使用的 `anthropic.Anthropic` |

该模式决定了消息如何格式化、工具调用如何结构化、响应如何解析以及缓存/流式传输如何工作。这三种模式在 API 调用前后都收敛为相同的内部消息格式（OpenAI 风格的 `role`/`content`/`tool_calls` 字典）。

**模式解析顺序：**
1. 显式的 `api_mode` 构造函数参数（最高优先级）
2. 提供程序特定检测（例如，`anthropic` 提供程序 → `anthropic_messages`）
3. 基本 URL 启发式方法（例如，`api.anthropic.com` → `anthropic_messages`）
4. 默认值：`chat_completions`

## 回合生命周期

每个智能体循环迭代的执行顺序如下：

```text
run_conversation()
  1. 如果没有提供则生成 task_id
  2. 将用户消息附加到对话历史
  3. 构建或重用缓存的系统提示词（prompt_builder.py）
  4. 检查是否需要预压缩（超过50%上下文）
  5. 从对话历史构建 API 消息
     - chat_completions：按原样使用 OpenAI 格式
     - codex_responses：转换为 Responses API 输入项
     - anthropic_messages：通过 anthropic_adapter.py 转换
  6. 注入临时提示层（预算警告、上下文压力）
  7. 如果在 Anthropic 上则应用提示缓存标记
  8. 进行可中断的 API 调用 (_interruptible_api_call)
  9. 解析响应：
     - 如果有 tool_calls：执行它们，附加结果，回到步骤 5
     - 如果是文本响应：持久化会话，如果需要则刷新内存，返回
```

### 消息格式

所有消息在内部都使用 OpenAI 兼容格式：

```python
{"role": "system", "content": "..."}
{"role": "user", "content": "..."}
{"role": "assistant", "content": "...", "tool_calls": [...]}
{"role": "tool", "tool_call_id": "...", "content": "..."}
```

推理内容（来自支持扩展思考的模型）存储在 `assistant_msg["reasoning"]` 中，并可通过 `reasoning_callback` 选择性地显示。

### 消息交替规则

智能体循环强制执行严格的消息角色交替：

- 系统消息后：`User → Assistant → User → Assistant → ...`
- 工具调用期间：`Assistant (with tool_calls) → Tool → Tool → ... → Assistant`
- **绝不**连续出现两个 assistant 消息
- **绝不**连续出现两个 user 消息
- **仅** `tool` 角色可以有连续的条目（并行工具结果）

提供商会验证这些序列并拒绝格式错误的对话历史。

## 可中断的 API 调用

API 请求被包装在 `_interruptible_api_call()` 中，该函数在实际 HTTP 调用在后台线程中运行的同时监控中断事件：

```text
┌────────────────────────────────────────────────────┐
│  主线程                  API 线程           │
│                                                    │
│   等待：                     HTTP POST           │
│    - 响应就绪       ───▶   发送到提供程序         │
│    - 中断事件                               │
│    - 超时                                       │
└────────────────────────────────────────────────────┘
```

当发生中断时（用户发送新消息、`/stop` 命令或信号）：
- API 线程被放弃（响应被丢弃）
- 智能体可以处理新输入或干净地关闭
- 不会将部分响应注入对话历史

## 工具执行

### 顺序 vs 并发

当模型返回工具调用时：

- **单个工具调用** → 在主线程中直接执行
- **多个工具调用** → 通过 `ThreadPoolExecutor` 并发执行
  - 例外：标记为交互式的工具（例如，`clarify`）强制顺序执行
  - 无论完成顺序如何，结果都会按原始工具调用的顺序重新插入

### 执行流程

```text
for each tool_call in response.tool_calls:
    1. 从 tools/registry.py 解析处理程序
    2. 触发 pre_tool_call 插件钩子
    3. 检查是否为危险命令（tools/approval.py）
       - 如果是危险的：调用 approval_callback，等待用户确认
    4. 使用参数 + task_id 执行处理程序
    5. 触发 post_tool_call 插件钩子
    6. 将 {"role": "tool", "content": result} 附加到历史记录
```

### 智能级工具

某些工具会在到达 `handle_function_call()` 之前被 `run_agent.py` *拦截*：

| 工具 | 为何拦截 |
|------|--------------------|
| `todo` | 读取/写入智能体本地的任务状态 |
| `memory` | 写入带有字符限制的持久化内存文件 |
| `session_search` | 通过智能体的会话数据库查询会话历史 |
| `delegate_task` | 用隔离的上下文启动子智能体(s) |

这些工具直接修改智能体状态并返回合成工具结果，而无需经过注册中心。

## 回调接口

`AIAgent` 支持平台特定的回调函数，可实现 CLI、网关和 ACP 集成中的实时进度显示：

| 回调函数 | 触发时机 | 使用者 |
|----------|-----------|---------|
| `tool_progress_callback` | 每次工具执行前后 | CLI 旋转器、网关进度消息 |
| `thinking_callback` | 模型开始/停止思考时 | CLI "正在思考..." 指示器 |
| `reasoning_callback` | 模型返回推理内容时 | CLI 推理显示、网关推理块 |
| `clarify_callback` | 调用 `clarify` 工具时 | CLI 输入提示、网关交互式消息 |
| `step_callback` | 每次完整的智能体回合后 | 网关步骤跟踪、ACP 进度 |
| `stream_delta_callback` | 每个流式传输令牌（启用时） | CLI 流式传输显示 |
| `tool_gen_callback` | 从流中解析出工具调用时 | CLI 工具预览（在旋转器中） |
| `status_callback` | 状态变化（思考、执行等） | ACP 状态更新 |

## 预算和回退行为

### 迭代预算

智能体通过 `IterationBudget` 跟踪迭代次数：

- 默认值：90 次迭代（可通过 `agent.max_turns` 配置）
- 每个智能体都有自己的预算。子智能体获得独立的预算，上限为 `delegation.max_iterations`（默认值 50）——父级 + 子级智能体的总迭代次数可能超过父级的限制
- 达到 100% 时，智能体停止并返回已完成工作的摘要

### 备用模型

当主模型失败时（429 速率限制、5xx 服务器错误、401/403 认证错误）：

1. 检查配置中的 `fallback_providers` 列表
2. 按顺序尝试每个备用提供程序
3. 成功时，与新提供程序继续对话
4. 遇到 401/403 时，尝试刷新凭据后再回退

备用系统也独立覆盖辅助任务——视觉、压缩、网页提取和会话搜索各自都有通过 `auxiliary.*` 配置部分配置的独立备用链。

## 压缩和持久化

### 压缩触发条件

- **预压缩**（API 调用前）：如果对话超过模型上下文窗口的 50%
- **网关自动压缩**：如果对话超过 85%（更激进，在回合之间运行）

### 压缩过程中的操作

1. 首先将内存刷新到磁盘（防止数据丢失）
2. 将中间对话回合总结为紧凑摘要
3. 保留最后 N 条消息不变（`compression.protect_last_n`，默认值：20）
4. 保持工具调用/结果消息对在一起（绝不分隔）
5. 生成新的会话谱系 ID（压缩创建"子"会话）

### 会话持久化

每轮结束后：
- 消息保存到会话存储（通过 `hermes_state.py` 的 SQLite）
- 内存更改刷新到 `MEMORY.md` / `USER.md`
- 会话可通过 `/resume` 或 `hermes chat --resume` 稍后恢复

## 关键源文件

| 文件 | 用途 |
|------|---------|
| `run_agent.py` | AIAgent 类 — 完整的智能体循环（~10,700 行） |
| `agent/prompt_builder.py` | 从内存、技能、上下文文件和个性组装系统提示词 |
| `agent/context_engine.py` | ContextEngine ABC — 可插拔的上下文管理 |
| `agent/context_compressor.py` | 默认引擎 — 有损摘要算法 |
| `agent/prompt_caching.py` | Anthropic 提示缓存标记和缓存指标 |
| `agent/auxiliary_client.py` | 辅助 LLM 客户端（用于侧边任务，如视觉、摘要） |
| `model_tools.py` | 工具模式收集、`handle_function_call()` 调度 |

## 相关文档

- [提供程序运行时解析](./provider-runtime.md)
- [提示词组装](./prompt-assembly.md)
- [上下文压缩与提示缓存](./context-compression-and-caching.md)
- [工具运行时](./tools-runtime.md)
- [架构概览](./architecture.md)