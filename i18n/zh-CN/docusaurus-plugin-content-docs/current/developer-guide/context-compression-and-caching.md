# 上下文压缩与缓存

Hermes 智能体采用双压缩系统和 Anthropic 提示词缓存机制，以高效管理长对话中的上下文窗口使用量。

源文件：`agent/context_engine.py`（抽象基类），`agent/context_compressor.py`（默认引擎），
`agent/prompt_caching.py`，`gateway/run.py`（会话清理），`run_agent.py`（搜索 `_compress_context`）

## 可插拔上下文引擎

上下文管理基于 `ContextEngine` 抽象基类（`agent/context_engine.py`）构建。内置的 `ContextCompressor` 是默认实现，但插件可将其替换为其他引擎（例如无损上下文管理）。

```yaml
context:
  engine: "compressor"    # 默认 — 内置有损摘要压缩
  engine: "lcm"           # 示例 — 提供无损上下文的插件
```

该引擎负责：
- 决定何时触发压缩（`should_compress()`）
- 执行压缩（`compress()`）
- 可选暴露智能体可调用的工具（如 `lcm_grep`）
- 跟踪 API 响应产生的 token 使用量

引擎选择通过 `config.yaml` 中的 `context.engine` 配置项驱动。解析顺序：
1. 检查 `plugins/context_engine/<name>/` 目录
2. 检查通用插件系统（`register_context_engine()`）
3. 回退至内置 `ContextCompressor`

插件引擎**永远不会自动激活** — 用户必须显式将 `context.engine` 设置为插件名称。默认值 `"compressor"` 始终使用内置实现。

配置方法：`hermes plugins` → 提供商插件 → 上下文引擎，或直接编辑 `config.yaml`。

有关构建上下文引擎插件，请参阅[上下文引擎插件](/developer-guide/context-engine-plugin)。

## 双重压缩系统

Hermes 有两个独立的压缩层，它们各自独立运行：

```
                     ┌──────────────────────────┐
  收到的消息         │   网关会话卫生             │  在上下文使用率达到85%时触发
  ─────────────────► │   (预智能体阶段，粗略估算) │  大型会话的安全网
                     └─────────────┬────────────┘
                                   │
                                   ▼
                     ┌──────────────────────────┐
                     │   智能体上下文压缩器       │  在上下文使用率达到50%时触发 (默认值)
                     │   (循环内，真实令牌计数)   │  常规上下文管理
                     └──────────────────────────┘
```

### 1. 网关会话卫生 (85% 阈值)

位于 `gateway/run.py` 中 (搜索 `Session hygiene: auto-compress`)。这是一个**安全网**，在智能体处理消息之前运行。它可以防止会话在轮次之间增长过大 (例如，在Telegram/Discord中隔夜累积) 时导致的API失败。

- **阈值**：固定为模型上下文长度的85%
- **令牌来源**：优先使用上一轮API报告的实际令牌数；如果不可用，则退回到基于字符的粗略估算 (`estimate_messages_tokens_rough`)
- **触发条件**：仅当 `len(history) >= 4` 且压缩功能已启用时
- **目的**：捕获那些逃过了智能体自身压缩器的会话

网关卫生阈值故意设置得比智能体的压缩器更高。将其设置为50% (与智能体相同) 会导致在长网关会话中每一轮都过早压缩。

### 2. 智能体上下文压缩器 (50% 阈值，可配置)

位于 `agent/context_compressor.py` 中。这是**主要的压缩系统**，在智能体的工具循环内运行，可以访问准确的、由API报告的令牌计数。


## 配置

所有压缩设置都从 `config.yaml` 的 `compression` 键下读取：

```yaml
compression:
  enabled: true              # 启用/禁用压缩 (默认: true)
  threshold: 0.50            # 上下文窗口占比 (默认: 0.50 = 50%)
  target_ratio: 0.20         # 保留为尾部的阈值比例 (默认: 0.20)
  protect_last_n: 20         # 最小受保护的尾部消息数 (默认: 20)

# 摘要模型/提供者在auxiliary下配置:
auxiliary:
  compression:
    model: null              # 用于摘要的模型覆盖 (默认: 自动检测)
    provider: auto           # 提供者: "auto", "openrouter", "nous", "main", 等。
    base_url: null           # 自定义OpenAI兼容端点
```

### 参数详情

| 参数 | 默认值 | 范围 | 描述 |
|------|--------|------|------|
| `threshold` | `0.50` | 0.0-1.0 | 当提示令牌数 ≥ `阈值 × 上下文长度` 时触发压缩 |
| `target_ratio` | `0.20` | 0.10-0.80 | 控制尾部保护令牌预算: `阈值令牌数 × 目标比例` |
| `protect_last_n` | `20` | ≥1 | 始终保留的最近消息的最小数量 |
| `protect_first_n` | `3` | (硬编码) | 系统提示 + 第一次交换始终保留 |

### 计算值 (针对200K上下文模型，使用默认值)

```
上下文长度       = 200,000
阈值令牌数     = 200,000 × 0.50 = 100,000
尾部令牌预算    = 100,000 × 0.20 = 20,000
最大摘要令牌数   = min(200,000 × 0.05, 12,000) = 10,000
```


## 压缩算法

`ContextCompressor.compress()` 方法遵循一个4阶段算法：

### 阶段1：修剪旧的工具结果 (低成本，无LLM调用)

受保护尾部之外的旧工具结果 (超过200个字符) 被替换为：
```
[旧的工具输出已清除以节省上下文空间]
```

这是一个低成本的预处理步骤，可以节省来自冗长工具输出 (文件内容、终端输出、搜索结果) 的大量令牌。

### 阶段2：确定边界

```
┌─────────────────────────────────────────────────────────────┐
│  消息列表                                                   │
│                                                             │
│  [0..2]  ← protect_first_n (系统提示 + 第一次交换)           │
│  [3..N]  ← 中间轮次 → 将被摘要                              │
│  [N..end] ← 尾部 (基于令牌预算 或 protect_last_n)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

尾部保护是**基于令牌预算的**：从末尾向前遍历，累积令牌直到预算耗尽。如果预算能保护的消息少于固定数量 `protect_last_n`，则回退到该固定数量。

边界会对齐，以避免拆分 tool_call/tool_result 组。`_align_boundary_backward()` 方法会跳过连续的工具结果，找到父级助手消息，保持组的完整性。

### 阶段3：生成结构化摘要

:::warning 摘要模型的上下文长度
摘要模型的上下文窗口**必须至少与主智能体模型的一样大**。整个中间部分会在单个 `call_llm(task="compression")` 调用中发送给摘要模型。如果摘要模型的上下文更小，API会返回上下文长度错误——`_generate_summary()` 会捕获它，记录一条警告，并返回 `None`。然后压缩器会**不带摘要地丢弃**中间轮次，静默丢失对话上下文。这是导致压缩质量下降的最常见原因。
:::

中间轮次使用辅助LLM和结构化模板进行摘要：

```
## 目标
[用户试图完成的任务]

## 约束与偏好
[用户偏好、编码风格、约束、重要决定]

## 进展
### 已完成
[已完成的工作——具体文件路径、运行的命令、结果]
### 进行中
[当前正在进行的工作]
### 阻塞
[遇到的任何阻碍或问题]

## 关键决策
[重要的技术决策及其原因]

## 相关文件
[读取、修改或创建的文件——附简要说明]

## 后续步骤
[接下来需要做什么]

## 关键上下文
[特定的值、错误信息、配置细节]
```

摘要预算与被压缩的内容量成比例：
- 公式：`内容令牌数 × 0.20` (常量 `_SUMMARY_RATIO`)
- 最小值：2,000 令牌
- 最大值：`min(上下文长度 × 0.05, 12,000)` 令牌

### 阶段4：组装压缩后的消息

压缩后的消息列表由以下组成：
1. 头部消息 (首次压缩时，在系统提示后附加一条说明)
2. 摘要消息 (选择角色以避免连续相同角色违规)
3. 尾部消息 (未修改)

孤立的 tool_call/tool_result 对由 `_sanitize_tool_pairs()` 清理：
- 引用已移除调用的工具结果 → 被移除
- 结果已被移除的工具调用 → 注入存根结果

### 迭代再压缩

在后续的压缩中，之前的摘要会与指令一起传递给LLM，指示它**更新**摘要而不是从头开始摘要。这在多次压缩中保留了信息——项目从“进行中”移动到“已完成”，新的进展被添加，过时的信息被移除。

压缩器实例上的 `_previous_summary` 字段存储了最后一次摘要的文本用于此目的。


## 前后示例

### 压缩前 (45条消息，约95K令牌)

```
[0] system:    "You are a helpful assistant..." (系统提示)
[1] user:      "Help me set up a FastAPI project"
[2] assistant: <tool_call> terminal: mkdir project </tool_call>
[3] tool:      "directory created"
[4] assistant: <tool_call> write_file: main.py </tool_call>
[5] tool:      "file written (2.3KB)"
    ... 30多轮文件编辑、测试、调试 ...
[38] assistant: <tool_call> terminal: pytest </tool_call>
[39] tool:      "8 passed, 2 failed\n..." (5KB输出)
[40] user:      "Fix the failing tests"
[41] assistant: <tool_call> read_file: tests/test_api.py </tool_call>
[42] tool:      "import pytest\n..." (3KB)
[43] assistant: "I see the issue with the test fixtures..."
[44] user:      "Great, also add error handling"
```

### 压缩后 (25条消息，约45K令牌)

```
[0] system:    "You are a helpful assistant...
               [注：之前的部分对话轮次已被压缩...]"
[1] user:      "Help me set up a FastAPI project"
[2] assistant: "[上下文压缩] 之前的轮次已被压缩...

               ## 目标
               设置一个带有测试和错误处理的 FastAPI 项目

               ## 进展
               ### 已完成
               - 创建了项目结构: main.py, tests/, requirements.txt
               - 在 main.py 中实现了5个API端点
               - 在 tests/test_api.py 中编写了10个测试用例
               - 8/10 个测试通过

               ### 进行中
               - 修复2个失败的测试 (test_create_user, test_delete_user)

               ## 相关文件
               - main.py — 包含5个端点的FastAPI应用
               - tests/test_api.py — 10个测试用例
               - requirements.txt — fastapi, pytest, httpx

               ## 后续步骤
               - 修复失败的测试夹具
               - 添加错误处理"
[3] user:      "Fix the failing tests"
[4] assistant: <tool_call> read_file: tests/test_api.py </tool_call>
[5] tool:      "import pytest\n..."
[6] assistant: "I see the issue with the test fixtures..."
[7] user:      "Great, also add error handling"
```

## 提示缓存（Anthropic）

来源：`agent/prompt_caching.py`

通过缓存对话前缀，在多轮对话中可将输入令牌成本降低约75%。使用Anthropic的 `cache_control` 断点。

### 策略：system_and_3

Anthropic每个请求最多允许4个 `cache_control` 断点。Hermes使用"system_and_3"策略：

```
断点 1：系统提示词         （所有轮次保持稳定）
断点 2：倒数第3条非系统消息  ─┐
断点 3：倒数第2条非系统消息   ├─ 滚动窗口
断点 4：最后一条非系统消息    ─┘
```

### 工作原理

`apply_anthropic_cache_control()` 深拷贝消息并注入 `cache_control` 标记：

```python
# 缓存标记格式
marker = {"type": "ephemeral"}
# 或者设置1小时TTL：
marker = {"type": "ephemeral", "ttl": "1h"}
```

根据内容类型，标记的应用方式不同：

| 内容类型 | 标记放置位置 |
|-------------|-------------------|
| 字符串内容 | 转换为 `[{"type": "text", "text": ..., "cache_control": ...}]` |
| 列表内容 | 添加到最后一个元素的字典中 |
| None/空值 | 作为 `msg["cache_control"]` 添加 |
| 工具消息 | 作为 `msg["cache_control"]` 添加（仅限原生Anthropic） |

### 缓存感知设计模式

1. **稳定的系统提示词**：系统提示词是断点1，在所有轮次中被缓存。避免在对话中途修改它（压缩操作仅在首次压缩时附加说明）。

2. **消息顺序很重要**：缓存命中需要前缀匹配。在中间添加或删除消息会使之后的缓存全部失效。

3. **压缩缓存交互**：压缩后，压缩区域的缓存会失效，但系统提示词的缓存仍然有效。滚动的3条消息窗口在1-2轮内重新建立缓存。

4. **TTL选择**：默认值为 `5m`（5分钟）。对于用户轮次间隔较长的长时间运行会话，请使用 `1h`。

### 启用提示缓存

当满足以下条件时，提示缓存会自动启用：
- 模型是Anthropic Claude模型（通过模型名称检测）
- 提供商支持 `cache_control`（原生Anthropic API或OpenRouter）

```yaml
# config.yaml — TTL可配置（必须为 "5m" 或 "1h"）
prompt_caching:
  cache_ttl: "5m"
```

CLI在启动时显示缓存状态：
```
💾 提示缓存：已启用（Claude通过OpenRouter，5分钟TTL）
```


## 上下文压力警告

中间的上下文压力警告已被移除（参见 `run_agent.py` 中的迭代预算块，其中指出：“没有中间压力警告——它们会导致模型在复杂任务中过早‘放弃’”）。当提示词令牌达到配置的 `compression.threshold`（默认50%）时触发压缩，且没有预先警告步骤；会话卫生作为二级安全网，在模型上下文窗口的85%处触发。