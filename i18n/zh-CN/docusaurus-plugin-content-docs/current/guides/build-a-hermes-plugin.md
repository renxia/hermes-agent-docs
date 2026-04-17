---
sidebar_position: 9
sidebar_label: "构建插件"
title: "构建 Hermes 插件"
description: "分步指南，教你如何使用工具、钩子、数据文件和技能构建完整的 Hermes 插件"
---

# 构建 Hermes 插件

本指南将带你从零开始构建一个完整的 Hermes 插件。完成之后，你将拥有一个包含多个工具、生命周期钩子、已打包数据文件和集成技能的可用插件——这涵盖了插件系统支持的一切功能。

## 你正在构建什么

一个具有两个工具的 **计算器** 插件：
- `calculate` — 评估数学表达式（例如 `2**16`、`sqrt(144)`、`pi * 5**2`）
- `unit_convert` — 在不同单位之间进行转换（例如 `100 F → 37.78 C`、`5 km → 3.11 mi`）

此外，还包含一个记录每次工具调用的钩子，以及一个打包的技能文件。

## 步骤 1: 创建插件目录

```bash
mkdir -p ~/.hermes/plugins/calculator
cd ~/.hermes/plugins/calculator
```

## 步骤 2: 编写清单文件 (Manifest)

创建 `plugin.yaml`：

```yaml
name: calculator
version: 1.0.0
description: 数学计算器 — 评估表达式和转换单位
provides_tools:
  - calculate
  - unit_convert
provides_hooks:
  - post_tool_call
```

这告诉 Hermes：“我是一个名为 calculator 的插件，我提供了工具和钩子。” `provides_tools` 和 `provides_hooks` 字段是插件注册的内容列表。

你可以添加的可选字段：
```yaml
author: Your Name
requires_env:          # 在安装过程中加载环境变量；提示用户设置
  - SOME_API_KEY       # 简单格式 — 如果缺少此键，插件将禁用
  - name: OTHER_KEY    # 丰富格式 — 在安装时显示描述/URL
    description: "Other 服务的密钥"
    url: "https://other.com/keys"
    secret: true
```

## 步骤 3: 编写工具模式 (Tool Schemas)

创建 `schemas.py` — 这是 LLM 用于决定何时调用你工具的依据：

```python
"""工具模式 — LLM 可见的内容。"""

CALCULATE = {
    "name": "calculate",
    "description": (
        "评估数学表达式并返回结果。支持算术 (+, -, *, /, **)、函数 (sqrt, sin, cos, "
        "log, abs, round, floor, ceil) 和常数 (pi, e)。当用户询问任何数学问题时使用此工具。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "expression": {
                "type": "string",
                "description": "需要评估的数学表达式 (例如：'2**10', 'sqrt(144)')",
            },
        },
        "required": ["expression"],
    },
}

UNIT_CONVERT = {
    "name": "unit_convert",
    "description": (
        "在单位之间转换数值。支持长度 (m, km, mi, ft, in)、重量 (kg, lb, oz, g)、温度 (C, F, K)、数据 (B, KB, MB, GB, TB) 和时间 (s, min, hr, day)。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "value": {
                "type": "number",
                "description": "需要转换的数值",
            },
            "from_unit": {
                "type": "string",
                "description": "源单位 (例如：'km', 'lb', 'F', 'GB')",
            },
            "to_unit": {
                "type": "string",
                "description": "目标单位 (例如：'mi', 'kg', 'C', 'MB')",
            },
        },
        "required": ["value", "from_unit", "to_unit"],
    },
}
```

**模式的重要性：** `description` 字段是 LLM 决定何时使用你的工具的依据。你需要明确说明工具的功能和使用场景。`parameters` 定义了 LLM 传递的参数结构。

## 步骤 4: 编写工具处理器 (Tool Handlers)

创建 `tools.py` — 这是当 LLM 调用你的工具时实际执行的代码：

```python
"""工具处理器 — LLM 调用每个工具时运行的代码。"""

import json
import math

# 表达式评估的安全全局变量 — 不允许文件/网络访问
_SAFE_MATH = {
    "abs": abs, "round": round, "min": min, "max": max,
    "pow": pow, "sqrt": math.sqrt, "sin": math.sin, "cos": math.cos,
    "tan": math.tan, "log": math.log, "log2": math.log2, "log10": math.log10,
    "floor": math.floor, "ceil": math.ceil,
    "pi": math.pi, "e": math.e,
    "factorial": math.factorial,
}


def calculate(args: dict, **kwargs) -> str:
    """安全评估数学表达式。

    处理器规则：
    1. 接收 args (dict) — LLM 传递的参数
    2. 执行工作
    3. 返回 JSON 字符串 — 始终如此，即使出错
    4. 接受 **kwargs 以保持向后兼容性
    """
    expression = args.get("expression", "").strip()
    if not expression:
        return json.dumps({"error": "未提供表达式"})

    try:
        result = eval(expression, {"__builtins__": {}}, _SAFE_MATH)
        return json.dumps({"expression": expression, "result": result})
    except ZeroDivisionError:
        return json.dumps({"expression": expression, "error": "除以零"})
    except Exception as e:
        return json.dumps({"expression": expression, "error": f"无效: {e}"})


# 转换表 — 单位均基于基础单位
_LENGTH = {"m": 1, "km": 1000, "mi": 1609.34, "ft": 0.3048, "in": 0.0254, "cm": 0.01}
_WEIGHT = {"kg": 1, "g": 0.001, "lb": 0.453592, "oz": 0.0283495}
_DATA = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3, "TB": 1024**4}
_TIME = {"s": 1, "ms": 0.001, "min": 60, "hr": 3600, "day": 86400}


def _convert_temp(value, from_u, to_u):
    # 归一化到摄氏度
    c = {"F": (value - 32) * 5/9, "K": value - 273.15}.get(from_u, value)
    # 转换为目标单位
    return {"F": c * 9/5 + 32, "K": c + 273.15}.get(to_u, c)


def unit_convert(args: dict, **kwargs) -> str:
    """在单位之间进行转换。"""
    value = args.get("value")
    from_unit = args.get("from_unit", "").strip()
    to_unit = args.get("to_unit", "").strip()

    if value is None or not from_unit or not to_unit:
        return json.dumps({"error": "需要值、源单位和目标单位"})

    try:
        # 温度转换
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
        return json.dumps({"error": f"转换失败: {e}"})
```

**处理器关键规则：**
1. **签名：** `def my_handler(args: dict, **kwargs) -> str`
2. **返回值：** 始终是 JSON 字符串。成功和错误都一样。
3. **绝不抛出异常：** 捕获所有异常，返回错误 JSON 即可。
4. **接受 `**kwargs`：** Hermes 未来可能会传递额外的上下文。

## 步骤 5: 编写注册文件

创建 `__init__.py` — 此文件负责将模式与处理器连接起来：

```python
"""计算器插件 — 注册文件。"""

import logging

from . import schemas, tools

logger = logging.getLogger(__name__)

# 通过钩子跟踪工具使用情况
_call_log = []

def _on_post_tool_call(tool_name, args, result, task_id, **kwargs):
    """钩子：在每次工具调用后运行（不只是我们自己的）。"""
    _call_log.append({"tool": tool_name, "session": task_id})
    if len(_call_log) > 100:
        _call_log.pop(0)
    logger.debug("工具调用: %s (会话 %s)", tool_name, task_id)


def register(ctx):
    """连接模式到处理器并注册钩子。"""
    ctx.register_tool(name="calculate",    toolset="calculator",
                      schema=schemas.CALCULATE,    handler=tools.calculate)
    ctx.register_tool(name="unit_convert", toolset="calculator",
                      schema=schemas.UNIT_CONVERT, handler=tools.unit_convert)

    # 此钩子会为所有工具调用触发，不只是我们自己的
    ctx.register_hook("post_tool_call", _on_post_tool_call)
```

**`register()` 的作用：**
- 仅在启动时调用一次。
- `ctx.register_tool()` 将你的工具放入注册表——模型会立即看到它。
- `ctx.register_hook()` 订阅生命周期事件。
- `ctx.register_cli_command()` 注册一个命令行子命令（例如：`hermes my-plugin <subcommand>`）。
- 如果此函数崩溃，插件将被禁用，但 Hermes 仍能正常运行。

## 步骤 6: 测试它

启动 Hermes：

```bash
hermes
```

你应该在横幅的工具列表中看到 `calculator: calculate, unit_convert`。

尝试以下提示：
```
2 的 16 次方是多少？
将 100 华氏度转换为摄氏度
2 平方根乘以 pi 是多少？
1.5 TB 有多少 GB？
```

检查插件状态：
```
/plugins
```

输出：
```
插件 (1):
  ✓ calculator v1.0.0 (2 个工具, 1 个钩子)
```

## 你的插件最终结构

```
~/.hermes/plugins/calculator/
├── plugin.yaml      # "我是 calculator，我提供工具和钩子"
├── __init__.py      # 连接：模式 → 处理器，注册钩子
├── schemas.py       # LLM 读取的内容（描述 + 参数规范）
└── tools.py         # 实际运行的内容（calculate, unit_convert 函数）
```

四个文件，清晰分离：
- **清单文件 (Manifest)** 声明了插件是什么。
- **模式 (Schemas)** 为 LLM 描述工具。
- **处理器 (Handlers)** 实现实际逻辑。
- **注册文件 (Registration)** 连接所有组件。

## 插件还能做什么？

### 发送数据文件

将任何文件放入插件目录，并在导入时读取它们：

```python
# 在 tools.py 或 __init__.py 中
from pathlib import Path

_PLUGIN_DIR = Path(__file__).parent
_DATA_FILE = _PLUGIN_DIR / "data" / "languages.yaml"

with open(_DATA_FILE) as f:
    _DATA = yaml.safe_load(f)
```

### 打包技能 (Bundle Skills)

插件可以发送技能文件，代理通过 `skill_view("plugin:skill")` 加载它们。在 `__init__.py` 中注册它们：

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

代理现在可以使用其命名空间名称加载你的技能：

```python
skill_view("my-plugin:my-workflow")   # → 插件版本
skill_view("my-workflow")              # → 内置版本 (不变)
```

**关键属性：**
- 插件技能是**只读**的 — 它们不会进入 `~/.hermes/skills/`，也无法通过 `skill_manage` 编辑。
- 插件技能不会列在系统提示的 `<available_skills>` 索引中 — 它们是可选的显式加载。
- 裸技能名称不受影响 — 命名空间防止与内置技能发生冲突。
- 当代理加载插件技能时，会在开头添加一个打包上下文横幅，列出来自同一插件的兄弟技能。

:::tip 遗留模式
旧的 `shutil.copy2` 模式（将技能复制到 `~/.hermes/skills/`）仍然有效，但会与内置技能产生命名冲突风险。对于新插件，请优先使用 `ctx.register_skill()`。
:::

### 环境变量门控 (Gate on environment variables)

如果你的插件需要 API 密钥：

```yaml
# plugin.yaml — 简单格式 (向后兼容)
requires_env:
  - WEATHER_API_KEY
```

如果未设置 `WEATHER_API_KEY`，插件将禁用，并给出明确消息。不会崩溃，代理也不会报错——只会显示“插件 weather 已禁用 (缺少: WEATHER_API_KEY)”。

当用户运行 `hermes plugins install` 时，系统会**交互式地**提示用户设置任何缺失的 `requires_env` 变量。值会自动保存到 `.env`。

为了获得更好的安装体验，请使用带有描述和注册 URL 的丰富格式：

```yaml
# plugin.yaml — 丰富格式
requires_env:
  - name: WEATHER_API_KEY
    description: "OpenWeather 的 API 密钥"
    url: "https://openweathermap.org/api"
    secret: true
```

| 字段 | 是否必需 | 描述 |
|-------|----------|-------------|
| `name` | 是 | 环境变量名称 |
| `description` | 否 | 在安装提示时显示给用户 |
| `url` | 否 | 获取凭证的地址 |
| `secret` | 否 | 如果为 `true`，输入将被隐藏（像密码字段） |

两种格式可以在同一列表中混合使用。已设置的变量将被静默跳过。

### 条件工具可用性

对于依赖可选库的工具：

```python
ctx.register_tool(
    name="my_tool",
    schema={...},
    handler=my_handler,
    check_fn=lambda: _has_optional_lib(),  # False = 工具从模型中隐藏
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

每个钩子都在 **[事件钩子参考](/docs/user-guide/features/hooks#plugin-hooks)** 中有完整的文档说明——回调签名、参数表、触发时机和示例。以下是摘要：

| 钩子 | 触发时机 | 回调签名 | 返回值 |
|------|-----------|-------------------|---------|
| [`pre_tool_call`](/docs/user-guide/features/hooks#pre_tool_call) | 任何工具执行之前 | `tool_name: str, args: dict, task_id: str` | 忽略 |
| [`post_tool_call`](/docs/user-guide/features/hooks#post_tool_call) | 任何工具返回之后 | `tool_name: str, args: dict, result: str, task_id: str` | 忽略 |
| [`pre_llm_call`](/docs/user-guide/features/hooks#pre_llm_call) | 每个回合开始前，工具调用循环之前 | `session_id: str, user_message: str, conversation_history: list, is_first_turn: bool, model: str, platform: str` | [上下文注入](#pre_llm_call-context-injection) |
| [`post_llm_call`](/docs/user-guide/features/hooks#post_llm_call) | 每个回合结束时，工具调用循环之后（仅成功回合） | `session_id: str, user_message: str, assistant_response: str, conversation_history: list, model: str, platform: str` | 忽略 |
| [`on_session_start`](/docs/user-guide/features/hooks#on_session_start) | 创建新会话时（仅第一回合） | `session_id: str, model: str, platform: str` | 忽略 |
| [`on_session_end`](/docs/user-guide/features/hooks#on_session_end) | 每次 `run_conversation` 调用结束 + CLI 退出 | `session_id: str, completed: bool, interrupted: bool, model: str, platform: str` | 忽略 |
| [`pre_api_request`](/docs/user-guide/features/hooks#pre_api_request) | 向 LLM 提供商发送每次 HTTP 请求之前 | `method: str, url: str, headers: dict, body: dict` | 忽略 |
| [`post_api_request`](/docs/user-guide/features/hooks#post_api_request) | 从 LLM 提供商接收每次 HTTP 响应之后 | `method: str, url: str, status_code: int, response: dict` | 忽略 |

大多数钩子都是“发送即忘”的观察者 — 它们的返回值会被忽略。例外是 `pre_llm_call`，它可以将上下文注入到对话中。

所有回调都应接受 `**kwargs` 以保持向后兼容性。如果钩子回调崩溃，它会被记录并跳过。其他钩子和代理仍能正常继续。

### `pre_llm_call` 上下文注入

这是唯一返回值重要的钩子。当 `pre_llm_call` 回调返回一个包含 `"context"` 键的字典（或纯字符串）时，Hermes 会将该文本注入到**当前回合的用户消息**中。这是内存插件、RAG 集成、护栏和任何需要向模型提供额外上下文的插件的机制。

#### 返回格式

```python
# 包含 context 键的字典
return {"context": "召回的记忆:\n- 用户偏好深色模式\n- 上个项目: hermes-agent"}

# 纯字符串（等同于上述字典形式）
return "召回的记忆:\n- 用户偏好深色模式"

# 返回 None 或不返回 → 不进行注入（仅观察者）
return None
```

任何非 None、非空且包含 `"context"` 键（或纯非空字符串）的返回值都会被收集并追加到当前回合的用户消息中。

#### 注入工作原理

注入的上下文追加到**用户消息**，而不是系统提示。这是一个故意的设计选择：

- **保护提示缓存** — 系统提示在回合间保持不变。Anthropic 和 OpenRouter 会缓存系统提示前缀，因此保持其稳定可以节省多轮对话中 75%+ 的输入 token。如果插件修改了系统提示，每个回合都会导致缓存未命中。
- **临时性** — 注入只发生在 API 调用时。对话历史中的原始用户消息永远不会被修改，也不会持久化到会话数据库。
- **系统提示是 Hermes 的领域** — 它包含模型特定的指导、工具强制规则、个性化指令和缓存的技能内容。插件是在用户输入旁边贡献上下文，而不是通过改变代理的核心指令。

#### 示例：记忆召回插件

```python
"""记忆插件 — 从向量存储召回相关上下文。"""

import httpx

MEMORY_API = "https://your-memory-api.example.com"

def recall_context(session_id, user_message, is_first_turn, **kwargs):
    """在每个 LLM 回合前调用。返回召回的记忆。"""
    try:
        resp = httpx.post(f"{MEMORY_API}/recall", json={
            "session_id": session_id,
            "query": user_message,
        }, timeout=3)
        memories = resp.json().get("results", [])
        if not memories:
            return None  # 没有内容需要注入

        text = "召回了来自先前会话的上下文:\n"
        text += "\n".join(f"- {m['text']}" for m in memories)
        return {"context": text}
    except Exception:
        return None  # 静默失败，不中断代理

def register(ctx):
    ctx.register_hook("pre_llm_call", recall_context)
```

#### 示例：护栏插件

```python
"""护栏插件 — 强制执行内容策略。"""

POLICY = """本次会话必须遵循以下内容策略：
- 绝不能生成访问工作目录外部文件系统的代码
- 执行破坏性操作前必须发出警告
- 拒绝涉及个人数据提取的请求"""

def inject_guardrails(**kwargs):
    """将策略文本注入到每个回合。"""
    return {"context": POLICY}

def register(ctx):
    ctx.register_hook("pre_llm_call", inject_guardrails)
```

#### 示例：仅观察者钩子（无注入）

```python
"""分析插件 — 跟踪回合元数据，不注入上下文。"""

import logging
logger = logging.getLogger(__name__)

def log_turn(session_id, user_message, model, is_first_turn, **kwargs):
    """在每次 LLM 调用前触发。返回 None — 不注入上下文。"""
    logger.info("回合: session=%s model=%s first=%s msg_len=%d",
                session_id, model, is_first_turn, len(user_message or ""))
    # 无返回值 → 不注入

def register(ctx):
    ctx.register_hook("pre_llm_call", log_turn)
```

#### 多个插件返回上下文

当多个插件从 `pre_llm_call` 返回上下文时，它们的输出会用双换行符连接，并一起追加到用户消息中。顺序遵循插件发现顺序（按插件目录名称字母顺序）。

### 注册 CLI 命令

插件可以添加自己的 `hermes <plugin>` 子命令树：

```python
def _my_command(args):
    """hermes my-plugin <subcommand> 的处理器。"""
    sub = getattr(args, "my_command", None)
    if sub == "status":
        print("一切正常！")
    elif sub == "config":
        print("当前配置: ...")
    else:
        print("用法: hermes my-plugin <status|config>")

def _setup_argparse(subparser):
    """为 hermes my-plugin 构建 argparse 树。"""
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

**内存提供者插件** 使用约定式方法：在插件的 `cli.py` 文件中添加一个 `register_cli(subparser)` 函数。内存插件发现系统会自动找到它——无需调用 `ctx.register_cli_command()`。有关详细信息，请参阅 [内存提供者插件指南](/docs/developer-guide/memory-provider-plugin#adding-cli-commands)。

**活动提供者门控：** 内存插件的 CLI 命令仅在它们的提供者是配置中活动的 `memory.provider` 时才出现。如果用户没有设置你的提供者，你的 CLI 命令就不会使帮助输出混乱。

### 注册斜杠命令 (Slash Commands)

插件可以注册会话内的斜杠命令——用户在对话中输入的命令（如 `/lcm status` 或 `/ping`）。这些命令在 CLI 和网关（Telegram、Discord 等）中都有效。

```python
def _handle_status(raw_args: str) -> str:
    """/mystatus 的处理器 — 接收命令名后的所有参数。"""
    if raw_args.strip() == "help":
        return "用法: /mystatus [help|check]"
    return "插件状态: 所有系统正常"

def register(ctx):
    ctx.register_command(
        "mystatus",
        handler=_handle_status,
        description="显示插件状态",
    )
```

注册后，用户可以在任何会话中输入 `/mystatus`。该命令会出现在自动补全、`/help` 输出和 Telegram 机器人菜单中。

**签名：** `ctx.register_command(name: str, handler: Callable, description: str = "")`

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `name` | `str` | 不带斜杠的命令名称 (例如："lcm", "mystatus") |
| `handler` | `Callable[[str], str \| None]` | 接收原始参数字符串。也可以是 `async` 的。 |
| `description` | `str` | 在 `/help`、自动补全和 Telegram 机器人菜单中显示 |

**与 `register_cli_command()` 的关键区别：**

| | `register_command()` | `register_cli_command()` |
|---|---|---|
| 调用方式 | 在会话中输入 `/name` | 在终端中输入 `hermes name` |
| 工作范围 | CLI 会话、Telegram、Discord 等 | 仅限终端 |
| 处理器接收 | 原始参数字符串 | argparse `Namespace` |
| 用例 | 诊断、状态、快速操作 | 复杂的子命令树、设置向导 |

**冲突保护：** 如果插件尝试注册与内置命令（`help`、`model`、`new` 等）冲突的名称，注册将被静默拒绝并发出日志警告。内置命令始终具有最高优先级。

**异步处理器：** 网关分派器会自动检测并等待异步处理器，因此你可以使用同步或异步函数：

```python
async def _handle_check(raw_args: str) -> str:
    result = await some_async_operation()
    return f"检查结果: {result}"

def register(ctx):
    ctx.register_command("check", handler=_handle_check, description="运行异步检查")
```

:::tip
本指南涵盖了**通用插件**（工具、钩子、斜杠命令、CLI 命令）。对于专业化的插件类型，请参阅：
- [内存提供者插件](/docs/developer-guide/memory-provider-plugin) — 跨会话知识后端
- [上下文引擎插件](/docs/developer-guide/context-engine-plugin) — 替代的上下文管理策略
:::

### 通过 pip 分发

要公开分享插件，请在 Python 包中添加一个入口点：

```toml
# pyproject.toml
[project.entry-points."hermes_agent.plugins"]
my-plugin = "my_plugin_package"
```

```bash
pip install hermes-plugin-calculator
# 插件在下次 hermes 启动时自动发现
```

## 常见错误

**处理器没有返回 JSON 字符串：**
```python
# 错误 — 返回一个字典
def handler(args, **kwargs):
    return {"result": 42}

# 正确 — 返回一个 JSON 字符串
def handler(args, **kwargs):
    return json.dumps({"result": 42})
```

**处理器签名中缺少 `**kwargs`：**
```python
# 错误 — 如果 Hermes 传递了额外上下文，将崩溃
def handler(args):
    ...

# 正确
def handler(args, **kwargs):
    ...
```

**处理器抛出异常：**
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
# 差 — 模型不知道何时使用它
"description": "做一些事情"

# 好 — 模型确切知道何时以及如何使用
"description": "评估数学表达式。用于算术、三角函数、对数。支持：+, -, *, /, **, sqrt, sin, cos, log, pi, e。"
```