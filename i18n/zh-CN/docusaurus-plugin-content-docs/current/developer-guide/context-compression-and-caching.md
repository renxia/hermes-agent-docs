# 上下文压缩与缓存

Hermes 智能体采用双重压缩系统以及 Anthropic 提示缓存，以在长对话中高效管理上下文窗口的使用。

源文件：`agent/context_engine.py`（ABC）、`agent/context_compressor.py`（默认引擎）、`agent/prompt_caching.py`、`gateway/run.py`（会话卫生）、`run_agent.py`（搜索 `_compress_context`）

## 可插拔的上下文引擎

上下文管理基于 `ContextEngine` ABC（`agent/context_engine.py`）构建。内置的 `ContextCompressor` 是默认实现，但插件可以将其替换为其他引擎（例如无损上下文管理）。

```yaml
context:
  engine: "compressor"    # 默认 — 内置有损摘要
  engine: "lcm"           # 示例 — 提供无损上下文的插件
```

该引擎负责：
- 决定何时触发压缩（`should_compress()`）
- 执行压缩（`compress()`）
- 可选择性地暴露智能体可调用的工具（例如 `lcm_grep`）
- 跟踪来自 API 响应的令牌使用情况

选择由 `config.yaml` 中的 `context.engine` 配置驱动。解析顺序如下：
1. 检查 `plugins/context_engine/<name>/` 目录
2. 检查通用插件系统（`register_context_engine()`）
3. 回退到内置的 `ContextCompressor`

插件引擎**永远不会自动激活**——用户必须显式地将 `context.engine` 设置为插件的名称。默认的 `"compressor"` 始终使用内置实现。

可通过 `hermes plugins` → 提供者插件 → 上下文引擎进行配置，或直接编辑 `config.yaml`。

有关构建上下文引擎插件的详细信息，请参阅[上下文引擎插件](/docs/developer-guide/context-engine-plugin)。

## 双重压缩系统

Hermes 拥有两个独立运行的压缩层：

```
                     ┌──────────────────────────┐
  传入消息           │   网关会话卫生处理       │  在达到上下文 85% 时触发
  ─────────────────► │   (智能体前，粗略估算)   │  针对大型会话的安全网
                     └─────────────┬────────────┘
                                   │
                                   ▼
                     ┌──────────────────────────┐
                     │   智能体上下文压缩器     │  在达到上下文 50% 时触发（默认）
                     │   (循环内，实际令牌数)   │  常规上下文管理
                     └──────────────────────────┘
```

### 1. 网关会话卫生处理（85% 阈值）

位于 `gateway/run.py` 中（搜索 `Session hygiene: auto-compress`）。这是一个在**智能体处理消息前**运行的**安全网**。它可防止会话在轮次之间变得过大时（例如 Telegram/Discord 中的隔夜累积）导致 API 调用失败。

- **阈值**：固定为模型上下文长度的 85%
- **令牌来源**：优先使用上一轮 API 报告的实际令牌数；若不可用，则回退到基于字符的粗略估算（`estimate_messages_tokens_rough`）
- **触发条件**：仅当 `len(history) >= 4` 且启用了压缩时触发
- **目的**：捕获那些逃过了智能体自身压缩器的会话

网关卫生处理的阈值有意设置得比智能体的压缩器更高。将其设置为 50%（与智能体相同）会导致在长网关会话中每一轮都过早触发压缩。

### 2. 智能体上下文压缩器（50% 阈值，可配置）

位于 `agent/context_compressor.py` 中。这是**主要的压缩系统**，它在智能体的工具循环内部运行，并能访问准确的、API 报告的令牌计数。


## 配置

所有压缩设置均从 `config.yaml` 文件的 `compression` 键下读取：

```yaml
compression:
  enabled: true              # 启用/禁用压缩（默认：true）
  threshold: 0.50            # 上下文窗口的比例（默认：0.50 = 50%）
  target_ratio: 0.20         # 保留为尾部的阈值比例（默认：0.20）
  protect_last_n: 20         # 最小受保护的尾部消息数（默认：20）

# 摘要模型/提供商在 auxiliary 下配置：
auxiliary:
  compression:
    model: null              # 覆盖摘要所用模型（默认：自动检测）
    provider: auto           # 提供商："auto"、"openrouter"、"nous"、"main" 等
    base_url: null           # 自定义 OpenAI 兼容端点
```

### 参数详情

| 参数 | 默认值 | 范围 | 描述 |
|-----------|---------|-------|-------------|
| `threshold` | `0.50` | 0.0-1.0 | 当提示令牌数 ≥ `threshold × context_length` 时触发压缩 |
| `target_ratio` | `0.20` | 0.10-0.80 | 控制尾部保护令牌预算：`threshold_tokens × target_ratio` |
| `protect_last_n` | `20` | ≥1 | 始终保留的最近消息的最小数量 |
| `protect_first_n` | `3` | （硬编码） | 系统提示 + 首次交互始终保留 |

### 计算值（针对默认设置下 200K 上下文的模型）

```
context_length       = 200,000
threshold_tokens     = 200,000 × 0.50 = 100,000
tail_token_budget    = 100,000 × 0.20 = 20,000
max_summary_tokens   = min(200,000 × 0.05, 12,000) = 10,000
```


## 压缩算法

`ContextCompressor.compress()` 方法遵循一个四阶段算法：

### 阶段 1：修剪旧工具结果（廉价，无需调用 LLM）

受保护尾部之外、长度超过 200 字符的旧工具结果将被替换为：
```
[旧工具输出已清除以节省上下文空间]
```

这是一个廉价的预处理步骤，可以从冗长的工具输出（文件内容、终端输出、搜索结果）中节省大量令牌。

### 阶段 2：确定边界

```
┌─────────────────────────────────────────────────────────────┐
│  消息列表                                                   │
│                                                             │
│  [0..2]  ← protect_first_n（系统 + 首次交互）               │
│  [3..N]  ← 中间轮次 → 将被摘要                              │
│  [N..end] ← 尾部（基于令牌预算或 protect_last_n）           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

尾部保护是**基于令牌预算的**：从末尾开始反向遍历，累积令牌直到预算耗尽。如果预算保护的 message 数量少于 `protect_last_n`，则回退到固定的 `protect_last_n` 数量。

边界会对齐，以避免拆分 `tool_call`/`tool_result` 组。`_align_boundary_backward()` 方法会跳过连续的工具结果，以找到其父级助手消息，从而保持组的完整性。

### 阶段 3：生成结构化摘要

:::warning 摘要模型的上下文长度
摘要模型必须拥有**至少与主智能体模型一样大**的上下文窗口。整个中间部分会在一次 `call_llm(task="compression")` 调用中发送给摘要模型。如果摘要模型的上下文较小，API 会返回一个上下文长度错误 —— `_generate_summary()` 会捕获该错误，记录警告，并返回 `None`。此时，压缩器会**不带摘要地**丢弃中间轮次，从而静默地丢失对话上下文。这是导致压缩质量下降的最常见原因。
:::

中间轮次会使用辅助 LLM 和一个结构化模板进行摘要：

```
## 目标
[用户试图完成的任务]

## 约束与偏好
[用户偏好、编码风格、约束、重要决策]

## 进度
### 已完成
[已完成的工作 — 具体文件路径、运行的命令、结果]
### 进行中
[当前正在进行的工作]
### 受阻
[遇到的任何阻碍或问题]

## 关键决策
[重要的技术决策及其原因]

## 相关文件
[读取、修改或创建的文件 — 每个文件附简要说明]

## 后续步骤
[接下来需要发生的事情]

## 关键上下文
[特定值、错误消息、配置详情]
```

摘要预算会根据被压缩内容的数量进行缩放：
- 公式：`content_tokens × 0.20`（`_SUMMARY_RATIO` 常量）
- 最小值：2,000 令牌
- 最大值：`min(context_length × 0.05, 12,000)` 令牌

### 阶段 4：组装压缩后的消息

压缩后的消息列表包括：
1. 头部消息（在首次压缩时，系统提示后附加一条注释）
2. 摘要消息（选择角色以避免连续相同角色违规）
3. 尾部消息（未修改）

`_sanitize_tool_pairs()` 会清理孤立的 `tool_call`/`tool_result` 对：
- 引用已移除调用的工具结果 → 被移除
- 其结果已被移除的工具调用 → 注入存根结果

### 迭代式重新压缩

在后续的压缩中，会将之前的摘要传递给 LLM，并指示其**更新**该摘要，而不是从头开始重新摘要。这可以在多次压缩中保留信息 —— 项目从“进行中”移至“已完成”，添加新的进度，并移除过时的信息。

压缩器实例上的 `_previous_summary` 字段会存储上一次摘要的文本，以实现此目的。


## 压缩前后示例

### 压缩前（45 条消息，约 95K 令牌）

```
[0] system:    "你是一个乐于助人的助手..."（系统提示）
[1] user:      "帮我搭建一个 FastAPI 项目"
[2] assistant: <tool_call> terminal: mkdir project </tool_call>
[3] tool:      "目录已创建"
[4] assistant: <tool_call> write_file: main.py </tool_call>
[5] tool:      "文件已写入 (2.3KB)"
    ... 30 多轮文件编辑、测试、调试 ...
[38] assistant: <tool_call> terminal: pytest </tool_call>
[39] tool:      "8 通过, 2 失败\n..."  (5KB 输出)
[40] user:      "修复失败的测试"
[41] assistant: <tool_call> read_file: tests/test_api.py </tool_call>
[42] tool:      "import pytest\n..."  (3KB)
[43] assistant: "我发现了测试固件的问题..."
[44] user:      "太好了，还要加上错误处理"
```

### 压缩后（25 条消息，约 45K 令牌）

```
[0] system:    "你是一个乐于助人的助手...
               [注：部分早期对话轮次已被压缩...]"
[1] user:      "帮我搭建一个 FastAPI 项目"
[2] assistant: "[上下文压缩] 早期轮次已被压缩...

               ## 目标
               搭建一个包含测试和错误处理的 FastAPI 项目

               ## 进度
               ### 已完成
               - 创建项目结构：main.py, tests/, requirements.txt
               - 在 main.py 中实现了 5 个 API 端点
               - 在 tests/test_api.py 中编写了 10 个测试用例
               - 10 个测试中有 8 个通过

               ### 进行中
               - 修复 2 个失败的测试 (test_create_user, test_delete_user)

               ## 相关文件
               - main.py — 包含 5 个端点的 FastAPI 应用
               - tests/test_api.py — 10 个测试用例
               - requirements.txt — fastapi, pytest, httpx

               ## 后续步骤
               - 修复失败的测试固件
               - 添加错误处理"
[3] user:      "修复失败的测试"
[4] assistant: <tool_call> read_file: tests/test_api.py </tool_call>
[5] tool:      "import pytest\n..."
[6] assistant: "我发现了测试固件的问题..."
[7] user:      "太好了，还要加上错误处理"
```

## 提示缓存（Anthropic）

来源：`agent/prompt_caching.py`

通过在多次对话中缓存对话前缀，将输入令牌成本降低约75%。使用 Anthropic 的 `cache_control` 断点。

### 策略：system_and_3

Anthropic 允许每个请求最多设置 4 个 `cache_control` 断点。Hermes 使用“system_and_3”策略：

```
断点 1：系统提示（在所有对话轮次中保持不变）
断点 2：倒数第三条非系统消息  ─┐
断点 3：倒数第二条非系统消息   ├─ 滚动窗口
断点 4：最后一条非系统消息     ─┘
```

### 工作原理

`apply_anthropic_cache_control()` 深度复制消息并注入 `cache_control` 标记：

```python
# 缓存标记格式
marker = {"type": "ephemeral"}
# 或者设置 1 小时 TTL：
marker = {"type": "ephemeral", "ttl": "1h"}
```

标记根据内容类型的不同以不同方式应用：

| 内容类型 | 标记位置 |
|-------------|-------------------|
| 字符串内容 | 转换为 `[{"type": "text", "text": ..., "cache_control": ...}]` |
| 列表内容 | 添加到最后一个元素的字典中 |
| 空/None | 添加为 `msg["cache_control"]` |
| 工具消息 | 添加为 `msg["cache_control"]`（仅限原生 Anthropic） |

### 缓存感知设计模式

1. **稳定的系统提示**：系统提示是断点 1，并在所有对话轮次中被缓存。避免在对话中途修改它（压缩仅在第一次压缩时附加一条注释）。

2. **消息顺序很重要**：缓存命中需要前缀匹配。在中间添加或删除消息会使之后的所有内容缓存失效。

3. **压缩缓存交互**：压缩后，压缩区域的缓存会失效，但系统提示缓存仍然保留。滚动的 3 条消息窗口会在 1-2 轮对话内重新建立缓存。

4. **TTL 选择**：默认为 `5m`（5 分钟）。对于用户在对话轮次之间休息的长时间运行会话，请使用 `1h`。

### 启用提示缓存

提示缓存在以下情况下自动启用：
- 模型是 Anthropic Claude 模型（通过模型名称检测）
- 提供商支持 `cache_control`（原生 Anthropic API 或 OpenRouter）

```yaml
# config.yaml — TTL 可配置（必须为 "5m" 或 "1h"）
prompt_caching:
  cache_ttl: "5m"
```

CLI 在启动时显示缓存状态：
```
💾 提示缓存：已启用（通过 OpenRouter 的 Claude，5m TTL）
```

## 上下文压力警告

智能体在达到压缩阈值的 85% 时发出上下文压力警告（不是上下文的 85% —— 而是阈值的 85%，而阈值本身是上下文的 50%）：

```
⚠️  上下文已达到压缩阈值的 85%（42,500/50,000 个令牌）
```

压缩后，如果使用量降至阈值的 85% 以下，警告状态将被清除。如果压缩未能将使用量降至警告级别以下（对话过于密集），警告将持续存在，但不会再次触发压缩，直到再次超过阈值。