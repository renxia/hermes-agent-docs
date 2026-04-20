---
sidebar_position: 9
sidebar_label: "构建插件"
title: "构建 Hermes 插件"
description: "逐步指南：使用工具、钩子、数据文件和技能构建完整的 Hermes 插件"
---

# 构建 Hermes 插件

本指南将引导您从零开始构建一个完整的 Hermes 插件。到结束时，您将拥有一个功能齐全的插件，包含多个工具、生命周期钩子、打包的数据文件以及一个捆绑的技能文件——涵盖插件系统支持的所有内容。

## 您将构建的内容

一个**计算器**插件，包含两个工具：
- `calculate` — 计算数学表达式（如 `2**16`、`sqrt(144)`、`pi * 5**2`）
- `unit_convert` — 单位转换（如 `100 F → 37.78 C`、`5 km → 3.11 mi`）

此外，还有一个记录每次工具调用的钩子，以及一个捆绑的技能文件。

## 第 1 步：创建插件目录

```bash
mkdir -p ~/.hermes/plugins/calculator
cd ~/.hermes/plugins/calculator
```

## 第 2 步：编写清单文件

创建 `plugin.yaml`：

```yaml
name: calculator
version: 1.0.0
description: 数学计算器 — 计算表达式并转换单位
provides_tools:
  - calculate
  - unit_convert
provides_hooks:
  - post_tool_call
```

这告诉 Hermes：“我是一个名为 calculator 的插件，我提供工具和钩子。” `provides_tools` 和 `provides_hooks` 字段是插件注册的列表。

可选字段，您可以添加：
```yaml
author: 您的姓名
requires_env:          # 根据环境变量启用加载；安装时提示输入
  - SOME_API_KEY       # 简单格式 — 如果缺失则禁用插件
  - name: OTHER_KEY    # 富文本格式 — 安装时显示描述/URL
    description: "Other 服务的密钥"
    url: "https://other.com/keys"
    secret: true
```

## 第 3 步：编写工具模式

创建 `schemas.py` — 这是 LLM 读取的内容，用于决定何时调用您的工具：

```python
"""工具模式 — LLM 看到的内容。"""

CALCULATE = {
    "name": "calculate",
    "description": (
        "计算数学表达式的结果并返回。"
        "支持算术（+、-、*、/、**）、函数（sqrt、sin、cos、"
        "log、abs、round、floor、ceil）和常量（pi、e）。"
        "用户询问任何数学问题时都使用此工具。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "expression": {
                "type": "string",
                "description": "要计算的数学表达式（例如 '2**10'、'sqrt(144)'）",
            },
        },
        "required": ["expression"],
    },
}

UNIT_CONVERT = {
    "name": "unit_convert",
    "description": (
        "在单位之间转换数值。支持长度（m、km、mi、ft、in）、"
        "重量（kg、lb、oz、g）、温度（C、F、K）、数据（B、KB、MB、GB、TB）"
        "和时间（s、min、hr、day）。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "value": {
                "type": "number",
                "description": "要转换的数字值",
            },
            "from_unit": {
                "type": "string",
                "description": "源单位（例如 'km'、'lb'、'F'、'GB'）",
            },
            "to_unit": {
                "type": "string",
                "description": "目标单位（例如 'mi'、'kg'、'C'、'MB'）",
            },
        },
        "required": ["value", "from_unit", "to_unit"],
    },
}
```

**为什么模式很重要：** `description` 字段是 LLM 决定何时使用您的工具的方式。请具体说明它的作用以及何时使用它。`parameters` 定义了 LLM 传递的参数。

## 第 4 步：编写工具处理程序

创建 `tools.py` — 这是 LLM 调用工具时实际执行的代码：

```python
"""工具处理程序 — LLM 调用每个工具时运行的代码。"""

import json
import math

# 安全的数学全局变量 — 无文件或网络访问权限
_SAFE_MATH = {
    "abs": abs, "round": round, "min": min, "max": max,
    "pow": pow, "sqrt": math.sqrt, "sin": math.sin, "cos": math.cos,
    "tan": math.tan, "log": math.log, "log2": math.log2, "log10": math.log10,
    "floor": math.floor, "ceil": math.ceil,
    "pi": math.pi, "e": math.e,
    "factorial": math.factorial,
}


def calculate(args: dict, **kwargs) -> str:
    """安全地计算数学表达式。

    处理程序规则：
    1. 接收 args（dict）— LLM 传递的参数
    2. 执行操作
    3. 返回 JSON 字符串 — 始终如此，即使出错也是如此
    4. 接受 **kwargs 以实现向前兼容
    """
    expression = args.get("expression", "").strip()
    if not expression:
        return json.dumps({"error": "未提供表达式"})

    try:
        result = eval(expression, {"__builtins__": {}}, _SAFE_MATH)
        return json.dumps({"expression": expression, "result": result})
    except ZeroDivisionError:
        return json.dumps({"expression": expression, "error": "除零错误"})
    except Exception as e:
        return json.dumps({"expression": expression, "error": f"无效：{e}"})


# 转换表 — 值以基本单位表示
_LENGTH = {"m": 1, "km": 1000, "mi": 1609.34, "ft": 0.3048, "in": 0.0254, "cm": 0.01}
_WEIGHT = {"kg": 1, "g": 0.001, "lb": 0.453592, "oz": 0.0283495}
_DATA = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3, "TB": 1024**4}
_TIME = {"s": 1, "ms": 0.001, "min": 60, "hr": 3600, "day": 86400}


def _convert_temp(value, from_u, to_u):
    # 归一化为摄氏度
    c = {"F": (value - 32) * 5/9, "K": value - 273.15}.get(from_u, value)
    # 转换为目标单位
    return {"F": c * 9/5 + 32, "K": c + 273.15}.get(to_u, c)


def unit_convert(args: dict, **kwargs) -> str:
    """在单位之间转换。"""
    value = args.get("value")
    from_unit = args.get("from_unit", "").strip()
    to_unit = args.get("to_unit", "").strip()

    if value is None or not from_unit or not to_unit:
        return json.dumps({"error": "需要 value、from_unit 和 to_unit"})

    try:
        # 温度
        if from_unit.upper() in {"C","F","K"} and to_unit.upper() in {"C","F","K"}:
            result = _convert_temp(float(value), from_unit.upper(), to_unit.upper())
            return json.dumps({"input": f"{value} {from_unit}", "result": round(result, 4),
                             "output": f"{round(result, 4)} {to_unit}"})

        # 基于比例的转换
        for table in (_LENGTH, _WEIGHT, _DATA, _TIME):
            lc = {k.lower(): v for k, v in table.items()}
            if from_unit.lower() in lc and to_unit.lower() in lc:
                result = float(value) * lc[from_unit.lower()] / lc[to_unit.lower()]
                return json.dumps({"input": f"{value} {from_unit}",
                                 "result": round(result, 6),
                                 "output": f"{round(result, 6)} {to_unit}"})

        return json.dumps({"error": f"无法转换 {from_unit} → {to_unit}"})
    except Exception as e:
        return json.dumps({"error": f"转换失败：{e}"})
```

**处理程序的关键规则：**
1. **签名：** `def my_handler(args: dict, **kwargs) -> str`
2. **返回：** 始终为 JSON 字符串。成功和错误都应如此。
3. **永不抛出：** 捕获所有异常，改为返回错误 JSON。
4. **接受 `**kwargs`：** Hermes 将来可能会传递额外的上下文。

## 第 5 步：编写注册代码

创建 `__init__.py` — 这会将模式连接到处理程序：

```python
"""计算器插件 — 注册。"""

import logging

from . import schemas, tools

logger = logging.getLogger(__name__)

# 通过钩子跟踪工具使用情况
_call_log = []

def _on_post_tool_call(tool_name, args, result, task_id, **kwargs):
    """钩子：每次工具调用后运行（不仅是我们的工具）。"""
    _call_log.append({"tool": tool_name, "session": task_id})
    if len(_call_log) > 100:
        _call_log.pop(0)
    logger.debug("工具已调用：%s（会话 %s）", tool_name, task_id)


def register(ctx):
    """将模式连接到处理程序并注册钩子。"""
    ctx.register_tool(name="calculate",    toolset="calculator",
                      schema=schemas.CALCULATE,    handler=tools.calculate)
    ctx.register_tool(name="unit_convert", toolset="calculator",
                      schema=schemas.UNIT_CONVERT, handler=tools.unit_convert)

    # 此钩子对所有工具调用都有效，而不仅仅是我们的工具
    ctx.register_hook("post_tool_call", _on_post_tool_call)
```

**`register()` 的作用：**
- 启动时恰好调用一次
- `ctx.register_tool()` 将您的工具放入注册表 — 模型立即就能看到它
- `ctx.register_hook()` 订阅生命周期事件
- `ctx.register_cli_command()` 注册 CLI 子命令（例如 `hermes my-plugin <subcommand>`）
- 如果此函数崩溃，插件将被禁用，但 Hermes 会继续正常运行

## 第 6 步：测试它

启动 Hermes：

```bash
hermes
```

您应该在横幅的工具列表中看到 `calculator: calculate, unit_convert`。

尝试这些提示：
```
2 的 16 次方是多少？
将 100 华氏度转换为摄氏度
2 乘以 pi 的平方根是多少？
1.5 太字节等于多少千兆字节？
```

检查插件状态：
```
/plugins
```

输出：
```
插件（1）：
  ✓ calculator v1.0.0（2 个工具，1 个钩子）
```

## 您的插件的最终结构

```
~/.hermes/plugins/calculator/
├── plugin.yaml      # "我是 calculator，我提供工具和钩子"
├── __init__.py      # 连接：模式 → 处理程序，注册钩子
├── schemas.py       # LLM 读取的内容（描述 + 参数规范）
└── tools.py         # 实际运行的内容（calculate、unit_convert 函数）
```

四个文件，清晰分离：
- **清单**声明插件是什么
- **模式**为 LLM 描述工具
- **处理程序**实现实际逻辑
- **注册**连接所有内容

## 插件还能做什么？

### 发送数据文件

将任何文件放在您的插件目录中，并在导入时读取它们：

```python
# 在 tools.py 或 __init__.py 中
from pathlib import Path

_PLUGIN_DIR = Path(__file__).parent
_DATA_FILE = _PLUGIN_DIR / "data" / "languages.yaml"

with open(_DATA_FILE) as f:
    _DATA = yaml.safe_load(f)
```

### 捆绑技能

插件可以发送技能文件，代理通过 `skill_view("plugin:skill")` 加载它们。在您的 `__init__.py` 中注册它们：

```
~/.hermes/plugins/my-plugin/
├── __init__.py
├── plugin.yaml
└── skills/
    ├── my-workflow/
    │   └── SKILL.md
    └── my-checklist/
        └── SKILL.md
```

```python
from pathlib import Path

def register(ctx):
    skills_dir = Path(__file__).parent / "skills"
    for child in sorted(skills_dir.iterdir()):
        skill_md = child / "SKILL.md"
        if child.is_dir() and skill_md.exists():
            ctx.register_skill(child.name, skill_md)
```

现在代理可以使用命名空间名称加载您的技能：

```python
skill_view("my-plugin:my-workflow")   # → 插件版本
skill_view("my-workflow")              # → 内置版本（不变）
```

**关键属性：**
- 插件技能是**只读**的 — 它们不会进入 `~/.hermes/skills/` 且无法通过 `skill_manage` 编辑。
- 插件技能**不会**出现在系统提示的 `<available_skills>` 索引中 — 它们是显式加载的。
- 裸技能名称不受影响 — 命名空间防止与内置技能冲突。
- 当代理加载插件技能时，会附加一个捆绑上下文横幅，列出同一插件中的其他技能。

:::tip 旧模式
旧的 `shutil.copy2` 模式（将技能复制到 `~/.hermes/skills/`）仍然有效，但与内置技能存在名称冲突风险。对于新插件，请优先使用 `ctx.register_skill()`。
:::

### 根据环境变量启用

如果您的插件需要 API 密钥：

```yaml
# plugin.yaml — 简单格式（向后兼容）
requires_env:
  - WEATHER_API_KEY
```

如果未设置 `WEATHER_API_KEY`，插件将被禁用并显示明确消息。无崩溃，无代理错误 — 只是“天气插件已禁用（缺少：WEATHER_API_KEY）”。

当用户运行 `hermes plugins install` 时，他们会**交互式提示**任何缺失的 `requires_env` 变量。值会自动保存到 `.env`。

为了获得更好的安装体验，请使用带有描述和注册 URL 的富文本格式：

```yaml
# plugin.yaml — 富文本格式
requires_env:
  - name: WEATHER_API_KEY
    description: "OpenWeather 的 API 密钥"
    url: "https://openweathermap.org/api"
    secret: true
```

| 字段 | 必需 | 描述 |
|-------|----------|-------------|
| `name` | 是 | 环境变量名称 |
| `description` | 否 | 安装提示时显示给用户 |
| `url` | 否 | 获取凭据的位置 |
| `secret` | 否 | 如果为 `true`，输入会被隐藏（如密码字段） |

两种格式可以在同一列表中混合使用。已设置的变量会被静默跳过。

### 条件工具可用性

对于依赖可选库的工具：

```python
ctx.register_tool(
    name="my_tool",
    schema={...},
    handler=my_handler,
    check_fn=lambda: _has_optional_lib(),  # False = 工具对模型隐藏
)
```

### 注册多个钩子

```python
def register(ctx):
    ctx.register_hook("pre_tool_call", before_any_tool)
    ctx.register_hook("post_tool_call", after_any_tool)
    ctx.register_hook("pre_llm_call", inject_memory)
    ctx.register_hook("on_session_start", on_new_session)
    ctx.register_hook("on_session_end", on_session_end)
```

### 钩子参考

每个钩子都在 **[事件钩子参考](/docs/user-guide/features/hooks#plugin-hooks)** 中有完整文档 — 回调签名、参数表、确切触发时间以及示例。这里是摘要：

| 钩子 | 触发时机 | 回调签名 | 返回值 |
|------|-----------|-------------------|---------|
| [`pre_tool_call`](/docs/user-guide/features/hooks#pre_tool_call) | 任何工具执行前 | `tool_name: str, args: dict, task_id: str` | 忽略 |
| [`post_tool_call`](/docs/user-guide/features/hooks#post_tool_call) | 任何工具返回后 | `tool_name: str, args: dict, result: str, task_id: str` | 忽略 |
| [`pre_llm_call`](/docs/user-guide/features/hooks#pre_llm_call) | 每轮一次，工具调用循环前 | `session_id: str, user_message: str, conversation_history: list, is_first_turn: bool, model: str, platform: str` | [上下文注入](#pre_llm_call-context-injection) |
| [`post_llm_call`](/docs/user-guide/features/hooks#post_llm_call) | 每轮一次，工具调用循环后（仅成功轮次） | `session_id: str, user_message: str, assistant_response: str, conversation_history: list, model: str, platform: str` | 忽略 |
| [`on_session_start`](/docs/user-guide/features/hooks#on_session_start) | 新会话创建时（仅第一轮） | `session_id: str, model: str, platform: str` | 忽略 |
| [`on_session_end`](/docs/user-guide/features/hooks#on_session_end) | 每个 `run_conversation` 调用结束 + CLI 退出 | `session_id: str, completed: bool, interrupted: bool, model: str, platform: str` | 忽略 |
| [`on_session_finalize`](/docs/user-guide/features/hooks#on_session_finalize) | CLI/网关关闭活动会话 | `session_id: str \| None, platform: str` | 忽略 |
| [`on_session_reset`](/docs/user-guide/features/hooks#on_session_reset) | 网关切换新会话密钥（`/new`、`/reset`） | `session_id: str, platform: str` | 忽略 |

大多数钩子是观察者模式 — 它们的返回值被忽略。例外是 `pre_llm_call`，它可以向对话注入上下文。

所有回调都应接受 `**kwargs` 以实现向前兼容性。如果钩子回调崩溃，会被记录并跳过。其他钩子和代理继续正常运行。

### `pre_llm_call` 上下文注入

这是唯一重要的钩子。当 `pre_llm_call` 回调返回带有 `"context"` 键的字典（或普通字符串），Hermes 会将该文本注入**当前轮次的用户消息**。这是内存插件、RAG 集成、防护栏以及任何需要向模型提供额外上下文的插件的机制。

#### 返回格式

```python
# 带有 context 键的字典
return {"context": "回忆的记忆：\n- 用户喜欢深色模式\n- 最后项目：hermes-agent"}

# 普通字符串（等同于上面的字典形式）
return "回忆的记忆：\n- 用户喜欢深色模式"

# 返回 None 或不返回 → 无注入（仅观察者）
return None
```

任何非 None、非空返回值，且带有 `"context"` 键（或普通非空字符串）都会被收集并追加到当前轮次的用户消息中。

#### 注入如何工作

注入的上下文被追加到**用户消息**，而不是系统提示。这是有意的设计选择：

- **提示缓存保留** — 系统提示在每轮保持相同。Anthropic 和 OpenRouter 缓存系统提示前缀，因此保持其稳定可节省多轮对话中 75%+ 的输入标记。如果插件修改系统提示，每轮都会成为缓存未命中。
- **临时性** — 注入仅在 API 调用时发生。对话历史中的原始用户消息从未被修改，且会话数据库中不持久化任何内容。
- **系统提示是 Hermes 的领域** — 它包含模型特定指导、工具执行规则、个性说明以及缓存的技能内容。插件在与用户输入一起贡献上下文，而不是更改代理的核心指令。

#### 示例：内存回忆插件

```python
"""内存插件 — 从向量存储回忆相关上下文。"""

import httpx

MEMORY_API = "https://your-memory-api.example.com"

def recall_context(session_id, user_message, is_first_turn, **kwargs):
    """每轮 LLM 调用前调用。返回回忆的内存。"""
    try:
        resp = httpx.post(f"{MEMORY_API}/recall", json={
            "session_id": session_id,
            "query": user_message,
        }, timeout=3)
        memories = resp.json().get("results", [])
        if not memories:
            return None  # 无内容可注入

        text = "从之前会话回忆的上下文：\n"
        text += "\n".join(f"- {m['text']}" for m in memories)
        return {"context": text}
    except Exception:
        return None  # 静默失败，不破坏代理

def register(ctx):
    ctx.register_hook("pre_llm_call", recall_context)
```

#### 示例：防护栏插件

```python
"""防护栏插件 — 强制执行内容策略。"""

POLICY = """您必须在此会话中遵循以下内容策略：
- 绝不能生成访问工作目录外文件系统的代码
- 执行破坏性操作前始终警告
- 拒绝涉及个人数据提取的请求"""

def inject_guardrails(**kwargs):
    """每轮注入策略文本。"""
    return {"context": POLICY}

def register(ctx):
    ctx.register_hook("pre_llm_call", inject_guardrails)
```

#### 示例：仅观察者钩子（无注入）

```python
"""分析插件 — 跟踪轮次元数据而不注入上下文。"""

import logging
logger = logging.getLogger(__name__)

def log_turn(session_id, user_message, model, is_first_turn, **kwargs):
    """每轮 LLM 调用前触发。返回 None — 无上下文注入。"""
    logger.info("轮次：session=%s model=%s first=%s msg_len=%d",
                session_id, model, is_first_turn, len(user_message or ""))
    # 无返回值 → 无注入

def register(ctx):
    ctx.register_hook("pre_llm_call", log_turn)
```

#### 多个插件返回上下文

当多个插件从 `pre_llm_call` 返回上下文时，它们的输出会用双换行符连接，并一起追加到用户消息中。顺序按插件发现顺序（按插件目录名称字母排序）。

### 注册 CLI 命令

插件可以添加自己的 `hermes <plugin>` 子命令树：

```python
def _my_command(args):
    """处理程序：hermes my-plugin <subcommand>。"""
    sub = getattr(args, "my_command", None)
    if sub == "status":
        print("一切正常！")
    elif sub == "config":
        print("当前配置：...")
    else:
        print("用法：hermes my-plugin <status|config>")

def _setup_argparse(subparser):
    """构建 hermes my-plugin 的 argparse 树。"""
    subs = subparser.add_subparsers(dest="my_command")
    subs.add_parser("status", help="显示插件状态")
    subs.add_parser("config", help="显示插件配置")
    subparser.set_defaults(func=_my_command)

def register(ctx):
    ctx.register_tool(...)
    ctx.register_cli_command(
        name="my-plugin",
        help="管理我的插件",
        setup_fn=_setup_argparse,
        handler_fn=_my_command,
    )
```

注册后，用户可以运行 `hermes my-plugin status`、`hermes my-plugin config` 等。

**内存提供程序插件**使用约定方法：在插件的 `cli.py` 文件中添加 `register_cli(subparser)` 函数。内存插件发现系统会自动找到它 — 无需 `ctx.register_cli_command()` 调用。详情参见 [内存提供程序插件指南](/docs/developer-guide/memory-provider-plugin#adding-cli-commands)。

**活动提供程序门控：** 仅当提供程序是配置中活动的 `memory.provider` 时，内存插件 CLI 命令才会出现。如果用户尚未设置您的提供程序，您的 CLI 命令不会 clutter 帮助输出。

### 注册斜杠命令

插件可以注册会话内斜杠命令 — 用户在对话中键入的命令（如 `/lcm status` 或 `/ping`）。这些在 CLI 和网关（Telegram、Discord 等）中都有效。

```python
def _handle_status(raw_args: str) -> str:
    """处理程序：/mystatus — 带有关键字后的所有内容。"""
    if raw_args.strip() == "help":
        return "用法：/mystatus [help|check]"
    return "插件状态：所有系统运行正常"

def register(ctx):
    ctx.register_command(
        "mystatus",
        handler=_handle_status,
        description="显示插件状态",
    )
```

注册后，用户可以在任何会话中键入 `/mystatus`。命令会出现在自动补全、`/help` 输出和 Telegram 机器人菜单中。

**签名：** `ctx.register_command(name: str, handler: Callable, description: str = "")`

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `name` | `str` | 不带前导斜杠的命令名（例如 `"lcm"`、`"mystatus"`） |
| `handler` | `Callable[[str], str \| None]` | 用原始参数字符串调用。也可以是 `async`。 |
| `description` | `str` | 显示在 `/help`、自动补全和 Telegram 机器人菜单中 |

**与 `register_cli_command()` 的关键区别：**

| | `register_command()` | `register_cli_command()` |
|---|---|---|
| 调用方式 | 会话中的 `/name` | 终端中的 `hermes name` |
| 适用位置 | CLI 会话、Telegram、Discord 等 | 仅终端 |
| 处理程序接收 | 原始参数字符串 | argparse `Namespace` |
| 用例 | 诊断、状态、快速操作 | 复杂子命令树、设置向导 |

**冲突保护：** 如果插件尝试注册与内置命令冲突的名称（`help`、`model`、`new` 等），注册会被静默拒绝并记录警告。内置命令始终优先。

**异步处理程序：** 网关分发会自动检测并等待异步处理程序，因此您可以使用同步或异步函数：

```python
async def _handle_check(raw_args: str) -> str:
    result = await some_async_operation()
    return f"检查结果：{result}"

def register(ctx):
    ctx.register_command("check", handler=_handle_check, description="运行异步检查")
```

:::tip
本指南涵盖**通用插件**（工具、钩子、斜杠命令、CLI 命令）。对于专用插件类型，请参见：
- [内存提供程序插件](/docs/developer-guide/memory-provider-plugin) — 跨会话知识后端
- [上下文引擎插件](/docs/developer-guide/context-engine-plugin) — 替代上下文管理策略
:::

### 通过 pip 分发

为了公开分享插件，请在 Python 包中添加入口点：

```toml
# pyproject.toml
[project.entry-points."hermes_agent.plugins"]
my-plugin = "my_plugin_package"
```

```bash
pip install hermes-plugin-calculator
# 下次启动 hermes 时自动发现插件
```

## 常见错误

**处理程序未返回 JSON 字符串：**
```python
# 错误 — 返回字典
def handler(args, **kwargs):
    return {"result": 42}

# 正确 — 返回 JSON 字符串
def handler(args, **kwargs):
    return json.dumps({"result": 42})
```

**处理程序签名中缺少 `**kwargs`：**
```python
# 错误 — 如果 Hermes 传递额外上下文会中断
def handler(args):
    ...

# 正确
def handler(args, **kwargs):
    ...
```

**处理程序抛出异常：**
```python
# 错误 — 异常传播，工具调用失败
def handler(args, **kwargs):
    result = 1 / int(args["value"])  # ZeroDivisionError!
    return json.dumps({"result": result})

# 正确 — 捕获并返回错误 JSON
def handler(args, **kwargs):
    try:
        result = 1 / int(args.get("value", 0))
        return json.dumps({"result": result})
    except Exception as e:
        return json.dumps({"error": str(e)})
```

**模式描述过于模糊：**
```python
# 坏 — 模型不知道何时使用它
"description": "做事情"

# 好 — 模型确切知道何时及如何使用
"description": "计算数学表达式。用于算术、三角、对数。支持：+、-、*、/、**、sqrt、sin、cos、log、pi、e。"
```