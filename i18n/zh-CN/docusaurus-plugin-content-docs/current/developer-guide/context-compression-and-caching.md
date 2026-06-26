# 上下文压缩与缓存

Hermes 智能体采用双压缩系统和 Anthropic 提示缓存机制，以在长对话中高效管理上下文窗口的使用。

源文件：`agent/context_engine.py`（ABC）、`agent/context_compressor.py`（默认引擎）、`agent/prompt_caching.py`、`gateway/run.py`（会话维护）、`run_agent.py`（搜索 `_compress_context`）


## 可插拔上下文引擎

上下文管理基于 `ContextEngine` ABC（`agent/context_engine.py`）构建。内置的 `ContextCompressor` 是默认实现，但插件可以用替代引擎（例如无损上下文管理）来替换它。

```yaml
context:
  engine: "compressor"    # 默认 — 内置有损摘要
  engine: "lcm"           # 示例 — 提供无损上下文的插件
```

该引擎负责：
- 决定何时触发压缩（`should_compress()`）
- 执行压缩（`compress()`）
- 可选地暴露智能体可调用的工具（例如 `lcm_grep`）
- 追踪 API 响应中的 token 使用量

通过 `config.yaml` 中的 `context.engine` 以配置驱动方式选择。解析顺序：
1. 检查 `plugins/context_engine/<name>/` 目录
2. 检查通用插件系统（`register_context_engine()`）
3. 回退到内置的 `ContextCompressor`

插件引擎**永远不会自动激活**——用户必须显式将 `context.engine` 设置为插件名称。默认值 `"compressor"` 始终使用内置引擎。

通过 `hermes plugins` → Provider Plugins → Context Engine 进行配置，或直接编辑 `config.yaml`。

关于如何构建上下文引擎插件，请参阅[上下文引擎插件](/developer-guide/context-engine-plugin)。

## 双重压缩系统

Hermes 拥有两个独立运行的压缩层：

```
                     ┌──────────────────────────┐
  传入消息           │   网关会话清理            │  在上下文达到 85% 时触发
  ─────────────────► │   （智能体前置，粗略估算）│  为大型会话提供安全网
                     └─────────────┬────────────┘
                                   │
                                   ▼
                     ┌──────────────────────────┐
                     │   智能体 ContextCompressor │  在上下文达到 50% 时触发（默认）
                     │   （循环内，真实 token）   │  常规上下文管理
                     └──────────────────────────┘
```

### 1. 网关会话清理（85% 阈值）

位于 `gateway/run.py` 中（搜索 `Session hygiene: auto-compress`）。这是一个**安全网**，在智能体处理消息之前运行。它防止会话在轮次之间（例如 Telegram/Discord 中的夜间累积）增长过大而导致 API 失败。

- **阈值**：固定为模型上下文长度的 85%
- **Token 来源**：优先使用上一轮 API 报告的实际 token 数；回退到粗略的基于字符的估算（`estimate_messages_tokens_rough`）
- **触发条件**：仅在 `len(history) >= 4` 且压缩已启用时触发
- **用途**：捕获逃脱了智能体自身压缩器的会话

网关清理阈值故意设置得比智能体的压缩器更高。将其设置为 50%（与智能体相同）会导致在长网关会话中每一轮都过早触发压缩。

### 2. 智能体 ContextCompressor（50% 阈值，可配置）

位于 `agent/context_compressor.py` 中。这是**主要的压缩系统**，在智能体的工具循环内运行，可访问准确的 API 报告的 token 计数。

## 配置

所有压缩设置从 `config.yaml` 中的 `compression` 键读取：

```yaml
compression:
  enabled: true              # 启用/禁用压缩（默认：true）
  threshold: 0.50            # 上下文窗口的比例（默认：0.50 = 50%）
  target_ratio: 0.20         # 保留多少阈值作为尾部（默认：0.20）
  protect_last_n: 20         # 最小保护的尾部消息数（默认：20）
  codex_gpt55_autoraise: true  # Codex OAuth 上的 gpt-5.5：将触发阈值提升至 85%（默认：true）

# 摘要模型/提供方在 auxiliary 下配置：
auxiliary:
  compression:
    model: null              # 覆盖摘要使用的模型（默认：自动检测）
    provider: auto           # 提供方："auto"、"openrouter"、"nous"、"main" 等
    base_url: null           # 自定义 OpenAI 兼容端点
```

### 参数详情

| 参数 | 默认值 | 范围 | 说明 |
|-----------|---------|-------|-------------|
| `threshold` | `0.50` | 0.0-1.0 | 当 prompt token ≥ `threshold × context_length` 时触发压缩 |
| `target_ratio` | `0.20` | 0.10-0.80 | 控制尾部保护 token 预算：`threshold_tokens × target_ratio` |
| `protect_last_n` | `20` | ≥1 | 始终保留的最近消息的最小数量 |
| `protect_first_n` | `3` | （硬编码） | 系统提示 + 首次交互始终保留 |
| `codex_gpt55_autoraise` | `true` | bool | 对 ChatGPT Codex OAuth 路由上的 gpt-5.5，将触发阈值提升至 85%（见下文）。设为 `false` 可保持全局 `threshold` |

### Codex gpt-5.5 阈值自动提升

ChatGPT Codex OAuth 后端将 gpt-5.5 硬限制在 **272K** 上下文窗口（同一标识符在 OpenAI 直接 API 和 OpenRouter 上暴露 1.05M，在 GitHub Copilot 上为 400K）。在默认 50% 触发阈值下，压缩将在约 ~136K 时触发——仅为模型实际可用窗口的一半。当活动路由为 Codex OAuth（`provider: openai-codex`）且模型为 gpt-5.5 时，Hermes 将触发阈值提升至 **85%**（~231K）并打印一次性通知及退出命令。仅此确切路由受影响；任何其他提供方上的 gpt-5.5 均保持全局 `threshold`。要恢复为全局值：

```bash
hermes config set compression.codex_gpt55_autoraise false
```

### 计算值（以默认配置下 200K 上下文模型为例）

```
context_length       = 200,000
threshold_tokens     = 200,000 × 0.50 = 100,000
tail_token_budget    = 100,000 × 0.20 = 20,000
max_summary_tokens   = min(200,000 × 0.05, 12,000) = 10,000
```

:::note 阈值来源于主模型的上下文窗口
`threshold_tokens` 始终为 `threshold × context_length`，其中 `context_length` 是**主智能体模型**的上下文窗口——而非辅助/摘要模型的。在默认 `0.50` 下，262,144 token 模型的阈值为 `262,144 × 0.50 = 131,072`。该数字接近常见的"128K 上下文"纯属百分比的巧合，并不意味着辅助模型的窗口是触发条件。辅助模型的上下文窗口是一个独立的问题——见下文"摘要模型上下文长度"警告，了解它如何影响是否能生成摘要，而非压缩何时触发。
:::


## 压缩算法

`ContextCompressor.compress()` 方法遵循一个 4 阶段算法：

### 阶段 1：清理旧工具结果（低成本，无 LLM 调用）

保护尾部之外的旧工具结果（>200 字符）被替换为：
```
[旧的工具输出已清除以节省上下文空间]
```

这是一个低成本的预处理步骤，可从冗长的工具输出（文件内容、终端输出、搜索结果）中节省大量 token。

### 阶段 2：确定边界

```
┌─────────────────────────────────────────────────────────────┐
│  消息列表                                                    │
│                                                             │
│  [0..2]  ← protect_first_n（系统提示 + 首次交互）            │
│  [3..N]  ← 中间轮次 → 将被摘要                               │
│  [N..end] ← 尾部（基于 token 预算或 protect_last_n）         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

尾部保护基于 **token 预算**：从末尾向后遍历，累积 token 直到预算耗尽。如果预算保护的消息数少于设定值，则回退到固定的 `protect_last_n` 数量。

边界经过对齐以避免拆分 tool_call/tool_result 组。`_align_boundary_backward()` 方法跳过连续的工具结果以找到父智能体消息，保持组完整。

### 阶段 3：生成结构化摘要

:::warning 摘要模型上下文长度
摘要模型的上下文窗口必须**至少与主智能体模型的一样大**。整个中间部分在单次 `call_llm(task="compression")` 调用中发送给摘要模型。如果摘要模型的上下文较小，API 将返回上下文长度错误——`_generate_summary()` 会捕获该错误，记录警告并返回 `None`。然后压缩器将丢弃中间轮次**且不生成摘要**，静默丢失对话上下文。这是压缩质量下降的最常见原因。
:::

中间轮次使用辅助 LLM 和结构化模板进行摘要：

```
## 目标
[用户试图完成什么]

## 约束与偏好
[用户偏好、编码风格、约束、重要决策]

## 进度
### 已完成
[已完成的工作——具体文件路径、运行的命令、结果]
### 进行中
[当前正在进行的工作]
### 已阻塞
[遇到的任何阻塞或问题]

## 关键决策
[重要的技术决策及其原因]

## 相关文件
[读取、修改或创建的文件——每个文件附简要说明]

## 后续步骤
[接下来需要做什么]

## 关键上下文
[具体值、错误消息、配置详情]
```

摘要预算随压缩内容量的增加而扩展：
- 公式：`content_tokens × 0.20`（`_SUMMARY_RATIO` 常量）
- 最小值：2,000 tokens
- 最大值：`min(context_length × 0.05, 12,000)` tokens

### 阶段 4：组装压缩后的消息

压缩后的消息列表为：
1. 头部消息（首次压缩时系统提示附加说明）
2. 摘要消息（选择角色以避免连续相同角色违规）
3. 尾部消息（未修改）

孤立的 tool_call/tool_result 对由 `_sanitize_tool_pairs()` 清理：
- 引用已删除调用的工具结果 → 移除
- 其结果已被移除的工具调用 → 注入存根结果

### 迭代重压缩

在后续压缩中，前一次摘要将与 LLM 一起传递，并指示其进行**更新**而非从头重新摘要。这跨多次压缩保留了信息——项目从"进行中"移至"已完成"，添加新进度，并移除过时信息。

压缩器实例上的 `_previous_summary` 字段存储上次摘要文本以供此用途。


## 压缩前后示例

### 压缩前（45 条消息，约 95K tokens）

```
[0] system:    "You are a helpful assistant..."（系统提示）
[1] user:      "Help me set up a FastAPI project"
[2] assistant: <tool_call> terminal: mkdir project </tool_call>
[3] tool:      "directory created"
[4] assistant: <tool_call> write_file: main.py </tool_call>
[5] tool:      "file written (2.3KB)"
    ... 30 more turns of file editing, testing, debugging ...
[38] assistant: <tool_call> terminal: pytest </tool_call>
[39] tool:      "8 passed, 2 failed\n..."  (5KB output)
[40] user:      "Fix the failing tests"
[41] assistant: <tool_call> read_file: tests/test_api.py </tool_call>
[42] tool:      "import pytest\n..."  (3KB)
[43] assistant: "I see the issue with the test fixtures..."
[44] user:      "Great, also add error handling"
```

### 压缩后（25 条消息，约 45K tokens）

```
[0] system:    "You are a helpful assistant...
               [Note: Some earlier conversation turns have been compacted...]"
[1] user:      "Help me set up a FastAPI project"
[2] assistant: "[CONTEXT COMPACTION] Earlier turns were compacted...

               ## Goal
               Set up a FastAPI project with tests and error handling

               ## Progress
               ### Done
               - Created project structure: main.py, tests/, requirements.txt
               - Implemented 5 API endpoints in main.py
               - Wrote 10 test cases in tests/test_api.py
               - 8/10 tests passing

               ### In Progress
               - Fixing 2 failing tests (test_create_user, test_delete_user)

               ## Relevant Files
               - main.py — FastAPI app with 5 endpoints
               - tests/test_api.py — 10 test cases
               - requirements.txt — fastapi, pytest, httpx

               ## Next Steps
               - Fix failing test fixtures
               - Add error handling"
[3] user:      "Fix the failing tests"
[4] assistant: <tool_call> read_file: tests/test_api.py </tool_call>
[5] tool:      "import pytest\n..."
[6] assistant: "I see the issue with the test fixtures..."
[7] user:      "Great, also add error handling"
```

## 提示词缓存 (Anthropic)

Source: `agent/prompt_caching.py`

通过缓存对话前缀，在多轮对话中减少约 75% 的输入 token 成本。使用 Anthropic 的 `cache_control` 断点。

### 策略: system_and_3

Anthropic 每次请求最多允许 4 个 `cache_control` 断点。Hermes 使用 "system_and_3" 策略：

```
断点 1: 系统提示词           (在所有轮次中保持稳定)
断点 2: 倒数第 3 条非系统消息  ─┐
断点 3: 倒数第 2 条非系统消息   ├─ 滚动窗口
断点 4: 最后 1 条非系统消息    ─┘
```

### 工作原理

`apply_anthropic_cache_control()` 对消息进行深拷贝并注入
`cache_control` 标记：

```python
# 缓存标记格式
marker = {"type": "ephemeral"}
# 或使用 1 小时 TTL：
marker = {"type": "ephemeral", "ttl": "1h"}
```

标记的应用方式因内容类型而异：

| 内容类型 | 标记位置 |
|---------|---------|
| 字符串内容 | 转换为 `[{"type": "text", "text": ..., "cache_control": ...}]` |
| 列表内容 | 添加到最后一个元素的字典中 |
| 无/空内容 | 添加为 `msg["cache_control"]` |
| 工具消息 | 添加为 `msg["cache_control"]`（仅限原生 Anthropic） |

### 缓存感知设计模式

1. **稳定的系统提示词**: 系统提示词作为断点 1，在所有轮次中被缓存。避免在对话中途对其进行变更（压缩仅在首次压缩时追加提示）。

2. **消息顺序很重要**: 缓存命中需要前缀匹配。在中间添加或删除消息会使之后的所有缓存失效。

3. **压缩缓存交互**: 压缩后，压缩区域的缓存失效，但系统提示词缓存保留。滚动 3 条消息窗口在 1-2 轮内重新建立缓存。

4. **TTL 选择**: 默认值为 `5m`（5 分钟）。对于用户在轮次之间休息的长时使用场景，使用 `1h`。

### 启用提示词缓存

在以下情况下自动启用提示词缓存：
- 模型为 Anthropic Claude 模型（通过模型名称检测）
- 提供商支持 `cache_control`（原生 Anthropic API 或 OpenRouter）

```yaml
# config.yaml — TTL 可配置（必须为 "5m" 或 "1h"）
prompt_caching:
  cache_ttl: "5m"
```

CLI 在启动时显示缓存状态：
```
💾 Prompt caching: ENABLED (Claude via OpenRouter, 5m TTL)
```


## 上下文压力警告

中间上下文压力警告已被移除（参见 `run_agent.py` 中的迭代预算块，其中注明："无中间压力警告——它们会导致模型在复杂任务上过早'放弃'"）。当提示词 token 达到配置的 `compression.threshold`（默认 50%）时直接触发压缩，无前置警告步骤；网关会话清理作为辅助安全网，在模型上下文窗口的 85% 处触发。