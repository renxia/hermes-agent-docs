# 上下文压缩与缓存

Hermes Agent 使用双重压缩系统和 Anthropic 提示缓存来高效管理跨越长时间对话的上下文窗口使用量。

源文件：`agent/context_engine.py` (ABC)，`agent/context_compressor.py` (默认引擎)，
`agent/prompt_caching.py`，`gateway/run.py` (会话卫生)，`run_agent.py` (搜索 `_compress_context`)


## 可插件化上下文引擎

上下文管理基于 `ContextEngine` ABC (`agent/context_engine.py`)。内置的 `ContextCompressor` 是默认实现，但插件可以用替代引擎替换它（例如，无损上下文管理）。

```yaml
context:
  engine: "compressor"    # 默认 — 内置的损失性摘要
  engine: "lcm"           # 示例 — 提供无损上下文的插件
```

该引擎负责：
- 决定何时触发压缩 (`should_compress()`)
- 执行压缩 (`compress()`)
- 可选地暴露智能体可以调用的工具（例如，`lcm_grep`）
- 跟踪来自 API 响应的 token 使用量

选择通过 `config.yaml` 中的 `context.engine` 进行配置。解析顺序如下：
1. 检查 `plugins/context_engine/<name>/` 目录
2. 检查通用插件系统 (`register_context_engine()`)
3. 降级到内置的 `ContextCompressor`

插件引擎**绝不会自动激活** — 用户必须显式地将 `context.engine` 设置为插件的名称。默认的 `"compressor"` 始终使用内置引擎。

通过 `hermes plugins` → Provider Plugins → Context Engine 进行配置，或直接编辑 `config.yaml`。

要构建上下文引擎插件，请参阅 [Context Engine Plugins](/docs/developer-guide/context-engine-plugin)。

## 双重压缩系统

Hermes 有两个独立运行的压缩层：

```
                     ┌──────────────────────────┐
  传入消息   │   网关会话卫生 │  在上下文达到 85% 时触发
  ─────────────────► │   (预智能体，粗估) │  大型会话的安全网
                     └─────────────┬────────────┘
                                   │
                                   ▼
                     ┌──────────────────────────┐
                     │   智能体 ContextCompressor │  在上下文达到 50% 时触发 (默认)
                     │   (循环内，真实 token)  │  正常的上下文管理
                     └──────────────────────────┘
```

### 1. 网关会话卫生 (85% 阈值)

位于 `gateway/run.py` (搜索 `Session hygiene: auto-compress`)。这是一个**安全网**，
在智能体处理消息之前运行。它防止了在回合之间（例如，Telegram/Discord 的过夜积累）
会话增长过大时发生的 API 失败。

- **阈值**: 固定为模型上下文长度的 85%
- **Token 源**: 优先使用上个回合实际报告的 API token；如果不足，则回退
  到粗略的基于字符的估算 (`estimate_messages_tokens_rough`)
- **触发条件**: 仅当 `len(history) >= 4` 且启用了压缩时触发
- **目的**: 捕获逃脱了智能体自身压缩器的会话

网关卫生阈值故意设置得高于智能体的压缩器。
将其设置为 50%（与智能体相同）会导致在长网关会话的每个回合都过早压缩。

### 2. 智能体 ContextCompressor (50% 阈值，可配置)

位于 `agent/context_compressor.py`。这是**主要的压缩系统**，它在智能体的工具循环内运行，并可以访问准确的、
API 报告的 token 计数。


## 配置

所有压缩设置都从 `config.yaml` 的 `compression` 键下读取：

```yaml
compression:
  enabled: true              # 启用/禁用压缩 (默认: true)
  threshold: 0.50            # 上下文窗口的比例 (默认: 0.50 = 50%)
  target_ratio: 0.20         # 保留作为尾部内容的比例 (默认: 0.20)
  protect_last_n: 20         # 最小保护尾部消息数 (默认: 20)

# 摘要模型/提供商在 auxiliary 下配置：
auxiliary:
  compression:
    model: null              # 摘要模型的覆盖 (默认: 自动检测)
    provider: auto           # 提供商: "auto", "openrouter", "nous", "main", 等。
    base_url: null           # 自定义 OpenAI 兼容端点
```

### 参数详情

| 参数 | 默认值 | 范围 | 描述 |
|-----------|---------|-------|-------------|
| `threshold` | `0.50` | 0.0-1.0 | 当提示 token ≥ `threshold × context_length` 时触发压缩 |
| `target_ratio` | `0.20` | 0.10-0.80 | 控制尾部保护 token 预算: `threshold_tokens × target_ratio` |
| `protect_last_n` | `20` | ≥1 | 始终保留的最近消息最小数量 |
| `protect_first_n` | `3` | (硬编码) | 系统提示 + 首次交互始终保留 |

### 计算值 (基于 200K 上下文模型的默认值)

```
context_length       = 200,000
threshold_tokens     = 200,000 × 0.50 = 100,000
tail_token_budget    = 100,000 × 0.20 = 20,000
max_summary_tokens   = min(200,000 × 0.05, 12,000) = 10,000
```


## 压缩算法

`ContextCompressor.compress()` 方法遵循一个四阶段算法：

### 阶段 1: 修剪旧工具结果 (廉价，无需 LLM 调用)

受保护尾部之外的旧工具结果（>200 字符）被替换为：
```
[旧工具输出已清除以节省上下文空间]
```

这是一个廉价的预处理步骤，可以节省大量来自冗长工具输出（文件内容、终端输出、搜索结果）的 token。

### 阶段 2: 确定边界

```
┌─────────────────────────────────────────────────────────────┐
│  消息列表                                              │
│                                                             │
│  [0..2]  ← protect_first_n (系统 + 首次交互)        │
│  [3..N]  ← 中间回合 → 摘要化                        │
│  [N..end] ← 尾部 (按 token 预算 或 protect_last_n)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

尾部保护是**基于 token 预算**的：从末尾向后遍历，累积 token 直到预算耗尽。如果预算保护的消息少于固定 `protect_last_n` 计数，则回退到固定计数。

边界对齐以避免分割 `tool_call`/`tool_result` 组。
`_align_boundary_backward()` 方法会跳过连续的工具结果，以找到父助手的消息，从而保持组的完整性。

### 阶段 3: 生成结构化摘要

:::warning 摘要模型上下文长度
摘要模型必须具有**至少与主智能体模型相同大小**的上下文窗口。整个中间部分在一个 `call_llm(task="compression")` 调用中发送给摘要模型。如果摘要模型的上下文较小，API 将返回上下文长度错误 — `_generate_summary()` 会捕获此错误，记录警告，并返回 `None`。压缩器随后会**不带摘要**地删除中间回合，从而静默地丢失对话上下文。这是导致压缩质量下降的最常见原因。
:::

中间回合使用辅助 LLM 和结构化模板进行摘要：

```
## 目标
[用户试图完成什么]

## 约束与偏好
[用户偏好、编码风格、约束、重要决策]

## 进展
### 已完成
[已完成的工作 — 具体文件路径、运行的命令、结果]
### 进行中
[当前正在进行的工作]
### 阻塞
[遇到的任何阻塞或问题]

## 关键决策
[重要的技术决策及其原因]

## 相关文件
[已读取、修改或创建的文件 — 附带简短说明]

## 下一步
[接下来需要做什么]

## 关键上下文
[特定值、错误消息、配置详情]
```

摘要预算根据要压缩的内容量进行缩放：
- 公式：`content_tokens × 0.20` (即 `_SUMMARY_RATIO` 常量)
- 最小值：2,000 tokens
- 最大值：`min(context_length × 0.05, 12,000)` tokens

### 阶段 4: 组装压缩消息

压缩后的消息列表包含：
1. 头部消息（在首次压缩时，系统提示会附加一条说明）
2. 摘要消息（选择的角色以避免连续相同角色的违规）
3. 尾部消息（未修改）

孤立的 `tool_call`/`tool_result` 对由 `_sanitize_tool_pairs()` 清理：
- 引用已移除调用的工具结果 → 被移除
- 结果被移除的工具调用 → 注入存根结果

### 迭代再压缩

在后续压缩中，前一次的摘要会被传递给 LLM，并指示其**更新**摘要，而不是从头开始摘要。这在多次压缩中保留了信息——项目从“进行中”移动到“已完成”，增加了新的进展，并移除了过时的信息。

压缩器实例上的 `_previous_summary` 字段用于存储此目的的上次摘要文本。


## 压缩前后示例

### 压缩前 (45 条消息，约 95K token)

```
[0] system:    "您是一个有用的助手..." (系统提示)
[1] user:      "帮我设置一个 FastAPI 项目"
[2] assistant: <tool_call> terminal: mkdir project </tool_call>
[3] tool:      "目录已创建"
[4] assistant: <tool_call> write_file: main.py </tool_call>
[5] tool:      "文件已写入 (2.3KB)"
    ... 更多文件编辑、测试、调试的 30 个回合 ...
[38] assistant: <tool_call> terminal: pytest </tool_call>
[39] tool:      "8 passed, 2 failed\n..."  (5KB 输出)
[40] user:      "修复失败的测试"
[41] assistant: <tool_call> read_file: tests/test_api.py </tool_call>
[42] tool:      "import pytest\n..."  (3KB)
[43] assistant: "我看到了测试夹具的问题..."
[44] user:      "很好，还要添加错误处理"
```

### 压缩后 (25 条消息，约 45K token)

```
[0] system:    "您是一个有用的助手...
               [注意：一些早期的对话回合已被压缩...]"
[1] user:      "帮我设置一个 FastAPI 项目"
[2] assistant: "[上下文压缩] 早期的回合已被压缩...

               ## 目标
               使用测试和错误处理设置一个 FastAPI 项目

               ## 进展
               ### 已完成
               - 创建了项目结构：main.py, tests/, requirements.txt
               - 在 main.py 中实现了 5 个 API 端点
               - 在 tests/test_api.py 中编写了 10 个测试用例
               - 8/10 测试通过

               ### 进行中
               - 修复 2 个失败的测试 (test_create_user, test_delete_user)

               ## 相关文件
               - main.py — 带有 5 个端点的 FastAPI 应用
               - tests/test_api.py — 10 个测试用例
               - requirements.txt — fastapi, pytest, httpx

               ## 下一步
               - 修复失败的测试夹具
               - 添加错误处理"
[3] user:      "修复失败的测试"
[4] assistant: <tool_call> read_file: tests/test_api.py </tool_call>
[5] tool:      "import pytest\n..."
[6] assistant: "我看到了测试夹具的问题..."
[7] user:      "很好，还要添加错误处理"
```


## 提示缓存 (Anthropic)

源：`agent/prompt_caching.py`

通过缓存对话前缀，将多回合对话的输入 token 成本降低约 75%。使用 Anthropic 的 `cache_control` 断点。

### 策略：system_and_3

Anthropic 允许每个请求最多有 4 个 `cache_control` 断点。Hermes 使用 "system_and_3" 策略：

```
断点 1: 系统提示           (所有回合都稳定)
断点 2: 倒数第二个非系统消息  ─┐
断点 3: 倒数第三个非系统消息   ├─ 滚动窗口
断点 4: 最后一个非系统消息          ─┘
```

### 工作原理

`apply_anthropic_cache_control()` 对消息进行深度复制，并注入 `cache_control` 标记：

```python
# 缓存标记格式
marker = {"type": "ephemeral"}
# 或对于 1 小时 TTL:
marker = {"type": "ephemeral", "ttl": "1h"}
```

根据内容类型，标记应用方式不同：

| 内容类型 | 标记位置 |
|-------------|-------------------|
| 字符串内容 | 转换为 `[{"type": "text", "text": ..., "cache_control": ...}]` |
| 列表内容 | 添加到最后一个元素的字典中 |
| None/空 | 作为 `msg["cache_control"]` 添加 |
| 工具消息 | 作为 `msg["cache_control"]` 添加 (原生 Anthropic 专用) |

### 缓存感知设计模式

1. **稳定的系统提示**: 系统提示是断点 1，并在所有回合中缓存。避免在对话中途修改它（压缩只在首次压缩时附加说明）。

2. **消息顺序很重要**: 缓存命中需要前缀匹配。在中间添加或删除消息会使之后的所有缓存失效。

3. **压缩缓存交互**: 压缩后，压缩区域的缓存失效，但系统提示的缓存得以保留。滚动 3 条消息的窗口在 1-2 个回合内重新建立缓存。

4. **TTL 选择**: 默认是 `5m`（5 分钟）。如果用户在回合之间休息，应使用 `1h`。

### 启用提示缓存

当满足以下条件时，会自动启用提示缓存：
- 模型是 Anthropic Claude 模型（通过模型名称检测）
- 提供商支持 `cache_control` (原生 Anthropic API 或 OpenRouter)

```yaml
# config.yaml — TTL 可配置
model:
  cache_ttl: "5m"   # "5m" 或 "1h"
```

CLI 在启动时显示缓存状态：
```
💾 提示缓存：已启用 (通过 OpenRouter 的 Claude，5m TTL)
```


## 上下文压力警告

智能体在达到压缩阈值的 85% 时发出上下文压力警告
（不是上下文的 85% — 而是阈值的 85%，而阈值本身是上下文的 50%）：

```
⚠️  上下文已达到压缩阈值的 85% (42,500/50,000 tokens)
```

压缩后，如果使用量降至阈值的 85% 以下，警告状态将被清除。如果压缩未能将使用量降低到警告水平以下（对话过于密集），警告将持续存在，但只有当阈值再次超出时，压缩才会重新触发。