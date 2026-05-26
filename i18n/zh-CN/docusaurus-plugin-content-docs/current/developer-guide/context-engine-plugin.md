---
sidebar_position: 9
title: "上下文引擎插件"
description: "如何构建一个上下文引擎插件以替换内置的ContextCompressor"
---

# 构建上下文引擎插件

上下文引擎插件使用替代策略来管理对话上下文，从而替换内置的 `ContextCompressor`。例如，一个无损上下文管理（LCM）引擎会构建知识有向无环图（DAG），而不是进行有损摘要。

## 工作原理

智能体的上下文管理基于 `ContextEngine` 抽象基类（`agent/context_engine.py`）构建。内置的 `ContextCompressor` 是其默认实现。插件引擎必须实现相同的接口。

一次只能激活**一个**上下文引擎。选择由配置驱动：

```yaml
# config.yaml
context:
  engine: "compressor"    # 默认内置引擎
  engine: "lcm"           # 激活名为 "lcm" 的插件引擎
```

插件引擎**永远不会自动激活** — 用户必须显式地将 `context.engine` 设置为插件的名称。

## 目录结构

每个上下文引擎都位于 `plugins/context_engine/<名称>/` 目录下：

```
plugins/context_engine/lcm/
├── __init__.py      # 导出ContextEngine的子类
├── plugin.yaml      # 元数据（名称，描述，版本）
└── ...              # 你的引擎所需的任何其他模块
```

## ContextEngine 抽象基类

你的引擎必须实现这些**必需**的方法：

```python
from agent.context_engine import ContextEngine

class LCMEngine(ContextEngine):

    @property
    def name(self) -> str:
        """简短标识符，例如 'lcm'。必须匹配 config.yaml 中的值。"""
        return "lcm"

    def update_from_response(self, usage: dict) -> None:
        """在每次 LLM 调用后被调用，传入使用情况字典。

        根据响应更新 self.last_prompt_tokens、self.last_completion_tokens、
        self.last_total_tokens。
        """

    def should_compress(self, prompt_tokens: int = None) -> bool:
        """如果本轮应触发压缩，返回 True。"""

    def compress(self, messages: list, current_tokens: int = None,
                 focus_topic: str = None) -> list:
        """压缩消息列表并返回一个新的（可能更短的）列表。

        返回的列表必须是有效的 OpenAI 格式消息序列。

        ``focus_topic`` 是一个可选的主题字符串，来自手动
        ``/compress <focus>``；支持引导压缩的引擎应优先保留与之相关的信息，
        其他引擎可以忽略它。
        """
```

### 你的引擎必须维护的类属性

智能体直接读取这些属性用于显示和日志记录：

```python
last_prompt_tokens: int = 0
last_completion_tokens: int = 0
last_total_tokens: int = 0
threshold_tokens: int = 0        # 触发压缩的阈值
context_length: int = 0          # 模型的完整上下文窗口长度
compression_count: int = 0       # compress() 已经运行的次数
```

### 可选方法

这些方法在抽象基类中有合理的默认值。根据需要覆盖：

| 方法 | 默认行为 | 何时覆盖 |
|------|----------|----------|
| `on_session_start(session_id, **kwargs)` | 空操作 | 当你需要加载持久化状态（如 DAG、数据库）时 |
| `on_session_end(session_id, messages)` | 空操作 | 当你需要刷新状态、关闭连接时 |
| `on_session_reset()` | 重置 token 计数器 | 当你拥有需要清除的会话特定状态时 |
| `update_model(model, context_length, ...)` | 更新 context_length + 阈值 | 当你需要在模型切换时重新计算预算时 |
| `get_tool_schemas()` | 返回 `[]` | 当你的引擎提供智能体可调用的工具时（例如 `lcm_grep`） |
| `handle_tool_call(name, args, **kwargs)` | 返回错误 JSON | 当你实现了工具处理器时 |
| `should_compress_preflight(messages)` | 返回 `False` | 当你可以进行廉价的、调用 API 前的预估时 |
| `get_status()` | 标准的 token/阈值字典 | 当你有自定义指标需要暴露时 |

## 引擎工具

上下文引擎可以暴露工具供智能体直接调用。从 `get_tool_schemas()` 返回工具模式，并在 `handle_tool_call()` 中处理调用：

```python
def get_tool_schemas(self):
    return [{
        "name": "lcm_grep",
        "description": "搜索上下文知识图谱",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "搜索查询"}
            },
            "required": ["query"],
        },
    }]

def handle_tool_call(self, name, args, **kwargs):
    if name == "lcm_grep":
        results = self._search_dag(args["query"])
        return json.dumps({"results": results})
    return json.dumps({"error": f"未知工具: {name}"})
```

引擎工具在启动时会被注入到智能体的工具列表中，并自动分发 — 无需进行注册。

## 注册方式

### 通过目录（推荐）

将你的引擎放置在 `plugins/context_engine/<名称>/` 下。`__init__.py` 必须导出一个 `ContextEngine` 的子类。发现系统会自动找到并实例化它。

### 通过通用插件系统

一个通用插件也可以注册一个上下文引擎：

```python
def register(ctx):
    engine = LCMEngine(context_length=200000)
    ctx.register_context_engine(engine)
```

只能注册一个引擎。第二个尝试注册的插件将被拒绝并收到警告。

## 生命周期

```
1. 引擎实例化（插件加载或目录发现时）
2. on_session_start() — 对话开始
3. update_from_response() — 每次 API 调用后
4. should_compress() — 每轮检查
5. compress() — 当 should_compress() 返回 True 时调用
6. on_session_end() — 会话结束（CLI 退出、/reset、网关过期）
```

`on_session_reset()` 在 `/new` 或 `/reset` 时被调用，用于清除会话特定状态而无需完全关闭引擎。

## 配置

用户通过 `hermes plugins` → 提供商插件 → 上下文引擎 选择你的引擎，或者编辑 `config.yaml`：

```yaml
context:
  engine: "lcm"   # 必须匹配你的引擎的 name 属性
```

`compression` 配置块（`compression.threshold`、`compression.protect_last_n` 等）是内置 `ContextCompressor` 特有的。如果你的引擎需要，应该定义自己的配置格式，在初始化期间从 `config.yaml` 读取。

## 测试

```python
from agent.context_engine import ContextEngine

def test_engine_satisfies_abc():
    engine = YourEngine(context_length=200000)
    assert isinstance(engine, ContextEngine)
    assert engine.name == "your-name"

def test_compress_returns_valid_messages():
    engine = YourEngine(context_length=200000)
    msgs = [{"role": "user", "content": "你好"}]
    result = engine.compress(msgs)
    assert isinstance(result, list)
    assert all("role" in m for m in result)
```

完整的抽象基类契约测试套件请见 `tests/agent/test_context_engine.py`。

## 另请参阅

- [上下文压缩与缓存](/developer-guide/context-compression-and-caching) — 内置压缩器的工作原理
- [内存提供器插件](/developer-guide/memory-provider-plugin) — 用于内存的类似单选插件系统
- [插件](/user-guide/features/plugins) — 通用插件系统概述