---
sidebar_position: 9
sidebar_label: "构建插件"
title: "构建一个 Hermes 插件"
description: "构建一个包含工具、钩子、数据文件和技能的完整 Hermes 插件的分步指南"
---

# 构建一个 Hermes 插件

本指南将引导你从头开始构建一个完整的 Hermes 插件。完成后，你将拥有一个包含多个工具、生命周期钩子、附带的数据文件以及一个打包技能的可用插件——涵盖了插件系统支持的所有功能。

:::info 不确定需要哪个指南？
Hermes 有几个不同的可插拔接口——有些使用 Python `register_*` API，有些是配置驱动或目录直接放入式的。请先使用此表格定位：

| 如果你想添加… | 请阅读 |
|---|---|
| 自定义工具、钩子、斜杠命令、技能或 CLI 子命令 | **本指南**（通用插件接口） |
| 一个 **LLM / 推理后端**（新的提供商） | [模型提供商插件](/docs/developer-guide/model-provider-plugin) |
| 一个 **网关通道**（Discord/Telegram/IRC/Teams 等） | [添加平台适配器](/docs/developer-guide/adding-platform-adapters) |
| 一个 **记忆后端**（Honcho/Mem0/Supermemory 等） | [记忆提供商插件](/docs/developer-guide/memory-provider-plugin) |
| 一个 **上下文压缩引擎** | [上下文引擎插件](/docs/developer-guide/context-engine-plugin) |
| 一个 **图像生成后端** | [图像生成提供商插件](/docs/developer-guide/image-gen-provider-plugin) |
| 一个 **TTS 后端**（任何 CLI — Piper, VoxCPM, Kokoro, 语音克隆等） | [TTS 自定义命令提供商](/docs/user-guide/features/tts#custom-command-providers) — 配置驱动，无需 Python |
| 一个 **STT 后端**（自定义 whisper / ASR CLI） | [语音消息转录](/docs/user-guide/features/tts#voice-message-transcription-stt) — 将 `HERMES_LOCAL_STT_COMMAND` 设置为 shell 模板 |
| **通过 MCP 的外部工具**（文件系统、GitHub、Linear 或任何 MCP 服务器） | [MCP](/docs/user-guide/features/mcp) — 在 `config.yaml` 中声明 `mcp_servers.<name>` |
| **网关事件钩子**（在启动、会话事件、命令时触发） | [事件钩子](/docs/user-guide/features/hooks#gateway-event-hooks) — 将 `HOOK.yaml` + `handler.py` 放入 `~/.hermes/hooks/<name>/` |
| **Shell 钩子**（在事件上运行 shell 命令） | [Shell 钩子](/docs/user-guide/features/hooks#shell-hooks) — 在 `config.yaml` 的 `hooks:` 下声明 |
| **额外的技能源**（自定义 GitHub 仓库、私有技能索引） | [技能](/docs/user-guide/features/skills) — `hermes skills tap add <repo>` · [发布一个 tap](/docs/user-guide/features/skills#publishing-a-custom-skill-tap) |
| 一个一等公民的 **核心** 推理提供商（非插件） | [添加提供商](/docs/developer-guide/adding-providers) |

查看完整的[可插拔接口表格](/docs/user-guide/features/plugins#pluggable-interfaces--where-to-go-for-each)，以获取所有扩展接口的整合视图，包括配置驱动（TTS, STT, MCP, shell 钩子）和目录直接放入式（网关钩子）样式。
:::

## 你将构建什么

一个 **计算器** 插件，包含两个工具：
- `calculate` — 评估数学表达式（`2**16`， `sqrt(144)`， `pi * 5**2`）
- `unit_convert` — 单位转换（`100 F → 37.78 C`， `5 km → 3.11 mi`）

此外，还有一个记录每次工具调用的钩子，以及一个打包的技能文件。

## 步骤 1：创建插件目录

```bash
mkdir -p ~/.hermes/plugins/calculator
cd ~/.hermes/plugins/calculator
```

## 步骤 2：编写清单文件

创建 `plugin.yaml`：

```yaml
name: calculator
version: 1.0.0
description: 数学计算器 — 计算表达式和单位转换
provides_tools:
  - calculate
  - unit_convert
provides_hooks:
  - post_tool_call
```

这告诉 Hermes："我是一个名为 calculator 的插件，我提供工具和钩子。" `provides_tools` 和 `provides_hooks` 字段是插件注册内容的列表。

可选的额外字段：
```yaml
author: Your Name
requires_env:          # 根据环境变量控制加载；安装时会提示
  - SOME_API_KEY       # 简单格式 — 如果缺少则禁用插件
  - name: OTHER_KEY    # 丰富格式 — 安装时显示描述和网址
    description: "Key for the Other service"
    url: "https://other.com/keys"
    secret: true
```

## 步骤 3：编写工具模式

创建 `schemas.py` — 这是大语言模型读取以决定何时调用你的工具的内容：

```python
"""工具模式 — 大语言模型所看到的内容。"""

CALCULATE = {
    "name": "calculate",
    "description": (
        "计算数学表达式并返回结果。"
        "支持算术运算（+、-、*、/、**）、函数（sqrt、sin、cos、"
        "log、abs、round、floor、ceil）和常量（pi、e）。"
        "用于用户提出的任何数学计算。"
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
        "在不同单位之间转换数值。支持长度（m、km、mi、ft、in）、"
        "重量（kg、lb、oz、g）、温度（C、F、K）、数据（B、KB、MB、GB、TB）"
        "和时间（s、min、hr、day）。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "value": {
                "type": "number",
                "description": "要转换的数值",
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

**为什么模式很重要：** `description` 字段决定了大语言模型何时使用你的工具。请具体说明工具的功能和使用场景。`parameters` 定义了大语言模型传递的参数。

## 步骤 4：编写工具处理函数

创建 `tools.py` — 这是大语言模型调用你的工具时实际执行的代码：

```python
"""工具处理函数 — 大语言模型调用每个工具时运行的代码。"""

import json
import math

# 表达式求值的安全全局变量 — 无文件/网络访问权限
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

    处理函数规则：
    1. 接收 args（字典）— 大语言模型传递的参数
    2. 执行任务
    3. 返回 JSON 字符串 — 始终如此，即使出错
    4. 接受 **kwargs 以保持前向兼容性
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


# 转换表 — 值为基本单位
_LENGTH = {"m": 1, "km": 1000, "mi": 1609.34, "ft": 0.3048, "in": 0.0254, "cm": 0.01}
_WEIGHT = {"kg": 1, "g": 0.001, "lb": 0.453592, "oz": 0.0283495}
_DATA = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3, "TB": 1024**4}
_TIME = {"s": 1, "ms": 0.001, "min": 60, "hr": 3600, "day": 86400}


def _convert_temp(value, from_u, to_u):
    # 标准化为摄氏度
    c = {"F": (value - 32) * 5/9, "K": value - 273.15}.get(from_u, value)
    # 转换为目标单位
    return {"F": c * 9/5 + 32, "K": c + 273.15}.get(to_u, c)


def unit_convert(args: dict, **kwargs) -> str:
    """在不同单位之间转换。"""
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

        # 基于比率的转换
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

**处理函数的关键规则：**
1. **签名：** `def my_handler(args: dict, **kwargs) -> str`
2. **返回值：** 始终返回 JSON 字符串，无论成功还是失败。
3. **永不抛出异常：** 捕获所有异常，改为返回错误 JSON。
4. **接受 `**kwargs`：** Hermes 未来可能会传递额外的上下文。

## 步骤 5：编写注册逻辑

创建 `__init__.py` — 这将模式与处理函数连接起来：

```python
"""Calculator 插件 — 注册。"""

import logging

from . import schemas, tools

logger = logging.getLogger(__name__)

# 通过钩子跟踪工具使用情况
_call_log = []

def _on_post_tool_call(tool_name, args, result, task_id, **kwargs):
    """钩子：在每次工具调用后运行（不仅仅是我们的工具）。"""
    _call_log.append({"tool": tool_name, "session": task_id})
    if len(_call_log) > 100:
        _call_log.pop(0)
    logger.debug("工具已调用: %s (会话 %s)", tool_name, task_id)


def register(ctx):
    """将模式连接到处理函数并注册钩子。"""
    ctx.register_tool(name="calculate",    toolset="calculator",
                      schema=schemas.CALCULATE,    handler=tools.calculate)
    ctx.register_tool(name="unit_convert", toolset="calculator",
                      schema=schemas.UNIT_CONVERT, handler=tools.unit_convert)

    # 此钩子对所有工具调用触发，不仅仅是我们的工具
    ctx.register_hook("post_tool_call", _on_post_tool_call)
```

**`register()` 的作用：**
- 启动时恰好调用一次
- `ctx.register_tool()` 将你的工具放入注册表 — 模型会立即看到它
- `ctx.register_hook()` 订阅生命周期事件
- `ctx.register_cli_command()` 注册 CLI 子命令（例如 `hermes my-plugin <subcommand>`）
- `ctx.register_command()` 注册会话内斜杠命令（例如在 CLI / 网关聊天中使用 `/myplugin <args>`）— 参见下方[注册斜杠命令](#register-slash-commands)
- `ctx.dispatch_tool(name, arguments)` — 使用父智能体的上下文（审批、凭证、task_id）自动连接，调用任何其他工具（内置工具或来自其他插件的工具）。适用于需要调用 `terminal`、`read_file` 或任何其他工具的斜杠命令处理函数，就像模型直接调用它们一样。
- 如果此函数崩溃，插件将被禁用，但 Hermes 会正常继续运行

**`dispatch_tool` 示例 — 一个运行工具的斜杠命令：**

```python
def handle_scan(ctx, argstr):
    """通过注册表调用终端工具来实现 /scan 命令。"""
    result = ctx.dispatch_tool("terminal", {"command": f"find . -name '{argstr}'"})
    return result  # 返回给调用者的聊天界面

def register(ctx):
    ctx.register_command("scan", handle_scan, help="查找匹配 glob 模式的文件")
```

被调度的工具会经过正常的审批、脱敏和预算流程 — 这是一个真正的工具调用，而不是绕过这些流程的捷径。

## 第 6 步：测试它

启动 Hermes：

```bash
hermes
```

你应该能在横幅的工具列表中看到 `calculator: calculate, unit_convert`。

尝试以下提示：
```
2的16次方是多少？
将100华氏度转换为摄氏度
2乘以π的平方根是多少？
1.5太字节等于多少吉字节？
```

检查插件状态：
```
/plugins
```

输出：
```
Plugins (1):
  ✓ calculator v1.0.0 (2 tools, 1 hooks)
```

### 插件发现调试

如果你的插件没有显示 —— 或者显示了但无法加载 —— 请设置 `HERMES_PLUGINS_DEBUG=1` 以在 stderr 上获得详细的发现日志：

```bash
HERMES_PLUGINS_DEBUG=1 hermes plugins list
```

对于每个插件来源（捆绑、用户、项目、入口点），你会看到：

- 扫描了哪些目录以及每个目录产生了多少清单
- 对于每个清单：解析后的键、名称、类型、来源、磁盘路径
- 跳过原因：`disabled via config`、`not enabled in config`、`exclusive plugin`、`no plugin.yaml, depth cap reached`
- 加载时：正在导入的插件，以及 `register(ctx)` 注册内容（工具、钩子、斜杠命令、CLI 命令）的一行摘要
- 解析失败时：异常的完整回溯（YAML 扫描器错误等）
- `register()` 失败时：完整的回溯，指向 `__init__.py` 中引发错误的行

当设置了环境变量时，相同的日志也会以 WARNING 级别（仅失败）和 DEBUG 级别（所有内容）写入 `~/.hermes/logs/agent.log`。因此，如果你无法使用环境变量运行（例如从网关内部运行），请改为跟踪日志文件：

```bash
hermes logs --level WARNING | grep -i plugin
```

插件不出现的常见原因：

- **未在配置中启用** —— 插件是可选加入的。运行 `hermes plugins enable <name>`（名称来自 `plugins list` 的输出，对于嵌套布局，可以是 `<category>/<plugin>`）。
- **目录布局错误** —— 必须是 `~/.hermes/plugins/<plugin-name>/plugin.yaml`（扁平）或 `~/.hermes/plugins/<category>/<plugin-name>/plugin.yaml`（最多一层类别嵌套）。任何更深的层次都会被忽略。
- **缺少 `__init__.py`** —— 插件目录需要同时包含 `plugin.yaml` 和包含 `register(ctx)` 函数的 `__init__.py`。
- **错误的 `kind`** —— 网关适配器需要在其清单中指定 `kind: platform`。内存提供程序被自动检测为 `kind: exclusive`，并通过 `memory.provider` 配置进行路由，而不是通过 `plugins.enabled`。

## 你的插件最终结构

```
~/.hermes/plugins/calculator/
├── plugin.yaml      # “我是 calculator，我提供工具和钩子”
├── __init__.py      # 连接：模式 → 处理程序，注册钩子
├── schemas.py       # LLM 读取的内容（描述 + 参数规范）
└── tools.py         # 运行的内容（calculate、unit_convert 函数）
```

四个文件，职责清晰分离：
- **清单** 声明插件是什么
- **模式** 为 LLM 描述工具
- **处理程序** 实现实际逻辑
- **注册** 连接所有内容

## 插件还能做什么？

### 传递数据文件

将任何文件放在插件目录中，并在导入时读取它们：

```python
# 在 tools.py 或 __init__.py 中
from pathlib import Path

_PLUGIN_DIR = Path(__file__).parent
_DATA_FILE = _PLUGIN_DIR / "data" / "languages.yaml"

with open(_DATA_FILE) as f:
    _DATA = yaml.safe_load(f)
```

### 捆绑技能

插件可以打包技能文件，智能体通过 `skill_view("plugin:skill")` 加载它们。在你的 `__init__.py` 中注册它们：

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

智能体现在可以通过其带命名空间的名称加载你的技能：

```python
skill_view("my-plugin:my-workflow")   # → 插件的版本
skill_view("my-workflow")              # → 内置版本（未改变）
```

**关键属性：**
*   插件技能是**只读的** — 它们不会进入 `~/.hermes/skills/`，也无法通过 `skill_manage` 进行编辑。
*   插件技能**未**列在系统提示词的 `<available_skills>` 索引中 — 它们需要显式加载。
*   裸技能名称不受影响 — 命名空间防止了与内置技能的冲突。
*   当智能体加载插件技能时，会预先添加一个横幅，列出同一插件中的同级技能。

:::tip 旧有模式
旧的 `shutil.copy2` 模式（将技能复制到 `~/.hermes/skills/`）仍然有效，但存在与内置技能的名称冲突风险。对于新插件，建议使用 `ctx.register_skill()`。
:::

### 基于环境变量的门控

如果你的插件需要 API 密钥：

```yaml
# plugin.yaml — 简单格式（向后兼容）
requires_env:
  - WEATHER_API_KEY
```

如果 `WEATHER_API_KEY` 未设置，插件将被禁用，并显示清晰的消息。不会崩溃，也不会在智能体中产生错误 — 只会显示 "Plugin weather disabled (missing: WEATHER_API_KEY)"。

当用户运行 `hermes plugins install` 时，系统会**交互式地提示**用户输入所有缺失的 `requires_env` 变量。值会自动保存到 `.env` 文件中。

为了获得更好的安装体验，可以使用带有描述和注册 URL 的富格式：

```yaml
# plugin.yaml — 富格式
requires_env:
  - name: WEATHER_API_KEY
    description: "API key for OpenWeather"
    url: "https://openweathermap.org/api"
    secret: true
```

| 字段 | 是否必需 | 描述 |
|-------|----------|-------------|
| `name` | 是 | 环境变量名称 |
| `description` | 否 | 在安装提示期间显示给用户 |
| `url` | 否 | 获取凭证的位置 |
| `secret` | 否 | 如果为 `true`，输入将被隐藏（类似密码字段） |

可以在同一列表中混合使用两种格式。已设置的变量会被静默跳过。

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

每个钩子在 **[事件钩子参考](/docs/user-guide/features/hooks#plugin-hooks)** 中都有完整文档 — 包括回调签名、参数表、确切的触发时机和示例。以下是摘要：

| 钩子 | 触发时机 | 回调签名 | 返回值 |
|------|-----------|-------------------|---------|
| [`pre_tool_call`](/docs/user-guide/features/hooks#pre_tool_call) | 任何工具执行之前 | `tool_name: str, args: dict, task_id: str` | 忽略 |
| [`post_tool_call`](/docs/user-guide/features/hooks#post_tool_call) | 任何工具返回之后 | `tool_name: str, args: dict, result: str, task_id: str, duration_ms: int` | 忽略 |
| [`pre_llm_call`](/docs/user-guide/features/hooks#pre_llm_call) | 每轮一次，在工具调用循环之前 | `session_id: str, user_message: str, conversation_history: list, is_first_turn: bool, model: str, platform: str` | [上下文注入](#pre_llm_call-上下文注入) |
| [`post_llm_call`](/docs/user-guide/features/hooks#post_llm_call) | 每轮一次，在工具调用循环之后（仅成功的轮次） | `session_id: str, user_message: str, assistant_response: str, conversation_history: list, model: str, platform: str` | 忽略 |
| [`on_session_start`](/docs/user-guide/features/hooks#on_session_start) | 新会话创建（仅第一轮） | `session_id: str, model: str, platform: str` | 忽略 |
| [`on_session_end`](/docs/user-guide/features/hooks#on_session_end) | 每次 `run_conversation` 调用结束 + CLI 退出时 | `session_id: str, completed: bool, interrupted: bool, model: str, platform: str` | 忽略 |
| [`on_session_finalize`](/docs/user-guide/features/hooks#on_session_finalize) | CLI/网关终止活动会话时 | `session_id: str \| None, platform: str` | 忽略 |
| [`on_session_reset`](/docs/user-guide/features/hooks#on_session_reset) | 网关交换新会话密钥时（`/new`、`/reset`） | `session_id: str, platform: str` | 忽略 |

大多数钩子是触发后即忘的观察者 — 它们的返回值被忽略。例外是 `pre_llm_call`，它可以向对话中注入上下文。

所有回调都应接受 `**kwargs` 以实现前向兼容性。如果钩子回调崩溃，它会被记录并跳过。其他钩子和智能体会继续正常运行。

### `pre_llm_call` 上下文注入

这是唯一一个其返回值起作用的钩子。当 `pre_llm_call` 回调返回一个带有 `"context"` 键的字典（或一个纯字符串）时，Hermes 会将该文本注入到**当前轮次的用户消息**中。这是内存插件、RAG 集成、护栏以及任何需要为模型提供额外上下文的插件的机制。

#### 返回格式

```python
# 带有 context 键的字典
return {"context": "回忆的记忆：\n- 用户偏好深色模式\n- 上一个项目：hermes-agent"}

# 纯字符串（等同于上面的字典形式）
return "回忆的记忆：\n- 用户偏好深色模式"

# 返回 None 或不返回 → 不注入（仅观察）
return None
```

任何非 None、非空且带有 `"context"` 键（或纯非空字符串）的返回值都会被收集并附加到当前轮次的用户消息中。

#### 注入如何工作

注入的上下文是附加到**用户消息**上的，而不是系统提示词。这是一个刻意的设计选择：

*   **提示词缓存保持** — 系统提示词在各轮次间保持不变。Anthropic 和 OpenRouter 缓存系统提示词前缀，因此保持稳定可以在多轮对话中节省 75% 以上的输入 token。如果插件修改系统提示词，每一轮都会导致缓存未命中。
*   **临时性** — 注入仅在 API 调用时发生。对话历史中的原始用户消息永远不会被修改，也不会持久化到会话数据库中。
*   **系统提示词是 Hermes 的地盘** — 它包含特定于模型的指导、工具强制规则、个性指令和缓存的技能内容。插件与用户的输入一起贡献上下文，而不是通过改变智能体的核心指令。

#### 示例：内存召回插件

```python
"""内存插件 — 从向量存储中召回相关上下文。"""

import httpx

MEMORY_API = "https://your-memory-api.example.com"

def recall_context(session_id, user_message, is_first_turn, **kwargs):
    """在每次 LLM 轮次前调用。返回召回的记忆。"""
    try:
        resp = httpx.post(f"{MEMORY_API}/recall", json={
            "session_id": session_id,
            "query": user_message,
        }, timeout=3)
        memories = resp.json().get("results", [])
        if not memories:
            return None  # 无需注入

        text = "从之前的会话中召回的上下文：\n"
        text += "\n".join(f"- {m['text']}" for m in memories)
        return {"context": text}
    except Exception:
        return None  # 静默失败，不中断智能体

def register(ctx):
    ctx.register_hook("pre_llm_call", recall_context)
```

#### 示例：护栏插件

```python
"""护栏插件 — 强制执行内容策略。"""

POLICY = """本次会话你必须遵循以下内容策略：
- 绝不生成访问工作目录外文件系统的代码
- 在执行破坏性操作前总是发出警告
- 拒绝涉及个人数据提取的请求"""

def inject_guardrails(**kwargs):
    """向每一轮注入策略文本。"""
    return {"context": POLICY}

def register(ctx):
    ctx.register_hook("pre_llm_call", inject_guardrails)
```

#### 示例：仅观察的钩子（无注入）

```python
"""分析插件 — 跟踪轮次元数据，不注入上下文。"""

import logging
logger = logging.getLogger(__name__)

def log_turn(session_id, user_message, model, is_first_turn, **kwargs):
    """在每次 LLM 调用前触发。返回 None — 不注入上下文。"""
    logger.info("轮次: 会话=%s 模型=%s 首次=%s 消息长度=%d",
                session_id, model, is_first_turn, len(user_message or ""))
    # 不返回 → 不注入

def register(ctx):
    ctx.register_hook("pre_llm_call", log_turn)
```

#### 多个插件返回上下文

当多个插件从 `pre_llm_call` 返回上下文时，它们的输出会用双换行符连接，并一起附加到用户消息中。顺序遵循插件发现顺序（按插件目录名字母顺序排列）。

### 注册 CLI 命令

插件可以添加自己的 `hermes <plugin>` 子命令树：

```python
def _my_command(args):
    """处理 hermes my-plugin <subcommand>。"""
    sub = getattr(args, "my_command", None)
    if sub == "status":
        print("一切正常！")
    elif sub == "config":
        print("当前配置：...")
    else:
        print("用法：hermes my-plugin <status|config>")

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

**内存提供者插件**使用基于约定的方法：在插件的 `cli.py` 文件中添加一个 `register_cli(subparser)` 函数。内存插件发现系统会自动找到它 — 不需要调用 `ctx.register_cli_command()`。详见[内存提供者插件指南](/docs/developer-guide/memory-provider-plugin#adding-cli-commands)。

**活跃提供者门控：** 内存插件的 CLI 命令仅在其提供者是配置中活跃的 `memory.provider` 时才会出现。如果用户没有设置你的提供者，你的 CLI 命令不会干扰帮助输出。

### 注册斜杠命令

插件可以注册会话内的斜杠命令 — 用户在对话期间输入的命令（如 `/lcm status` 或 `/ping`）。这些命令在 CLI 和网关（Telegram、Discord 等）中均有效。

```python
def _handle_status(raw_args: str) -> str:
    """处理 /mystatus — 调用时带有命令名称后的所有内容。"""
    if raw_args.strip() == "help":
        return "用法：/mystatus [help|check]"
    return "插件状态：所有系统正常"

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
| `name` | `str` | 不带前导斜杠的命令名称（例如 `"lcm"`、`"mystatus"`） |
| `handler` | `Callable[[str], str \| None]` | 以原始参数字符串调用。也可以是 `async`。 |
| `description` | `str` | 显示在 `/help`、自动补全和 Telegram 机器人菜单中 |

**与 `register_cli_command()` 的主要区别：**

| | `register_command()` | `register_cli_command()` |
|---|---|---|
| 调用方式为 | 会话中的 `/name` | 终端中的 `hermes name` |
| 工作环境 | CLI 会话、Telegram、Discord 等 | 仅终端 |
| 处理器接收 | 原始参数字符串 | argparse `Namespace` |
| 使用场景 | 诊断、状态、快速操作 | 复杂的子命令树、设置向导 |

**冲突保护：** 如果插件尝试注册与内置命令（`help`、`model`、`new` 等）冲突的名称，注册将被静默拒绝并记录警告。内置命令始终优先。

**异步处理器：** 网关调度会自动检测并等待异步处理器，因此你可以使用同步或异步函数：

```python
async def _handle_check(raw_args: str) -> str:
    result = await some_async_operation()
    return f"检查结果: {result}"

def register(ctx):
    ctx.register_command("check", handler=_handle_check, description="运行异步检查")
```

### 从斜杠命令调度工具

需要编排工具（通过 `delegate_task` 生成子智能体、调用 `file_edit` 等）的斜杠命令处理器应使用 `ctx.dispatch_tool()`，而不是深入框架内部。父智能体上下文（工作区提示、旋转器、模型继承）会自动连接。

```python
def register(ctx):
    def _handle_deliver(raw_args: str):
        result = ctx.dispatch_tool(
            "delegate_task",
            {
                "goal": raw_args,
                "toolsets": ["terminal", "file", "web"],
            },
        )
        return result

    ctx.register_command(
        "deliver",
        handler=_handle_deliver,
        description="将一个目标委托给子智能体",
    )
```

**签名：** `ctx.dispatch_tool(name: str, args: dict, *, parent_agent=None) -> str`

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `name` | `str` | 工具注册表中注册的工具名称（例如 `"delegate_task"`、`"file_edit"`） |
| `args` | `dict` | 工具参数，与模型发送的格式相同 |
| `parent_agent` | `Agent \| None` | 可选覆盖。省略时，从当前 CLI 智能体解析（或在网关模式下优雅降级） |

**运行时行为：**

*   **CLI 模式：** `parent_agent` 从活动的 CLI 智能体解析，因此工作区提示、旋转器和模型选择会按预期继承。
*   **网关模式：** 没有 CLI 智能体，因此工具会优雅降级 — 工作区从 `TERMINAL_CWD` 读取，不显示旋转器。
*   **显式覆盖：** 如果调用者显式传递 `parent_agent=`，则该值会被尊重且不会被覆盖。

这是从插件命令进行工具调度的公共、稳定接口。插件不应深入 `ctx._cli_ref.agent` 或类似的私有状态。

:::tip
本指南涵盖**通用插件**（工具、钩子、斜杠命令、CLI 命令）。以下部分概述了每种专用插件类型的编写模式；每个部分都链接到其完整的指南以获取字段参考和示例。
:::

## 专业插件类型

Hermes 在通用表面之外还提供五种专业插件类型。每种插件均作为目录存放于 `plugins/<类别>/<名称>/`（捆绑发布）或 `~/.hermes/plugins/<类别>/<名称>/`（用户自定义）。不同类别的契约有所差异——请选择你需要的类型，然后阅读其完整指南。

### 模型提供者插件 — 添加 LLM 后端

将配置文件放入 `plugins/model-providers/<名称>/` 目录：

```python
# plugins/model-providers/acme/__init__.py
from providers import register_provider
from providers.base import ProviderProfile

register_provider(ProviderProfile(
    name="acme",
    aliases=("acme-inference",),
    display_name="Acme Inference",
    env_vars=("ACME_API_KEY", "ACME_BASE_URL"),
    base_url="https://api.acme.example.com/v1",
    auth_type="api_key",
    default_aux_model="acme-small-fast",
    fallback_models=("acme-large-v3", "acme-medium-v3"),
))
```

```yaml
# plugins/model-providers/acme/plugin.yaml
name: acme-provider
kind: model-provider
version: 1.0.0
description: Acme Inference — 兼容 OpenAI 的直接 API
```

在任何代码首次调用 `get_provider_profile()` 或 `list_providers()` 时延迟发现——`auth.py`、`config.py`、`doctor.py`、`models.py`、`runtime_provider.py` 以及聊天补全传输层会自动连接到它。用户插件可通过名称覆盖捆绑插件。

**完整指南：** [模型提供者插件](/docs/developer-guide/model-provider-plugin) — 字段参考、可覆盖的钩子（`prepare_messages`、`build_extra_body`、`build_api_kwargs_extras`、`fetch_models`）、api_mode 选择、授权类型、测试。

### 平台插件 — 添加网关渠道

将适配器放入 `plugins/platforms/<名称>/` 目录：

```python
# plugins/platforms/myplatform/adapter.py
from gateway.platforms.base import BasePlatformAdapter

class MyPlatformAdapter(BasePlatformAdapter):
    async def connect(self): ...
    async def send(self, chat_id, text): ...
    async def disconnect(self): ...

def check_requirements():
    import os
    return bool(os.environ.get("MYPLATFORM_TOKEN"))

def _env_enablement():
    import os
    tok = os.getenv("MYPLATFORM_TOKEN", "").strip()
    if not tok:
        return None
    return {"token": tok}

def register(ctx):
    ctx.register_platform(
        name="myplatform",
        label="MyPlatform",
        adapter_factory=lambda cfg: MyPlatformAdapter(cfg),
        check_fn=check_requirements,
        required_env=["MYPLATFORM_TOKEN"],
        # 从环境变量自动填充 PlatformConfig.extra，以便纯环境变量的设置
        # 在无需 SDK 实例化的情况下显示在 `hermes gateway status` 中。
        env_enablement_fn=_env_enablement,
        # 启用定时任务投递：`deliver=myplatform` 路由到此变量。
        cron_deliver_env_var="MYPLATFORM_HOME_CHANNEL",
        emoji="💬",
        platform_hint="您正在通过 MyPlatform 聊天。请保持回复简洁。",
    )
```

```yaml
# plugins/platforms/myplatform/plugin.yaml
name: myplatform-platform
label: MyPlatform
kind: platform
version: 1.0.0
description: MyPlatform 网关适配器
requires_env:
  - name: MYPLATFORM_TOKEN
    description: "来自 MyPlatform 控制台的机器人令牌"
    password: true
optional_env:
  - name: MYPLATFORM_HOME_CHANNEL
    description: "用于定时任务投递的默认频道"
    password: false
```

**完整指南：** [添加平台适配器](/docs/developer-guide/adding-platform-adapters) — 完整的 `BasePlatformAdapter` 契约、消息路由、授权网关、设置向导集成。请查看 `plugins/platforms/irc/` 获取一个仅使用标准库的可用示例。

### 内存提供者插件 — 添加跨会话知识后端

将 `MemoryProvider` 的实现放入 `plugins/memory/<名称>/` 目录：

```python
# plugins/memory/my-memory/__init__.py
from agent.memory_provider import MemoryProvider

class MyMemoryProvider(MemoryProvider):
    @property
    def name(self) -> str:
        return "my-memory"

    def is_available(self) -> bool:
        import os
        return bool(os.environ.get("MY_MEMORY_API_KEY"))

    def initialize(self, session_id: str, **kwargs) -> None:
        self._session_id = session_id

    def sync_turn(self, user_message, assistant_response, **kwargs) -> None:
        ...

    def prefetch(self, query: str, **kwargs) -> str | None:
        ...

def register(ctx):
    ctx.register_memory_provider(MyMemoryProvider())
```

内存提供者为单选模式 — 同一时间只有一个处于活动状态，通过 `config.yaml` 中的 `memory.provider` 进行选择。

**完整指南：** [内存提供者插件](/docs/developer-guide/memory-provider-plugin) — 完整的 `MemoryProvider` 抽象基类、线程契约、配置文件隔离、通过 `cli.py` 注册命令行命令。

### 上下文引擎插件 — 替换上下文压缩器

```python
# plugins/context_engine/my-engine/__init__.py
from agent.context_engine import ContextEngine

class MyContextEngine(ContextEngine):
    @property
    def name(self) -> str:
        return "my-engine"

    def should_compress(self, messages, model) -> bool: ...
    def compress(self, messages, model) -> list[dict]: ...

def register(ctx):
    ctx.register_context_engine(MyContextEngine())
```

上下文引擎为单选模式 — 通过 `config.yaml` 中的 `context.engine` 进行选择。

**完整指南：** [上下文引擎插件](/docs/developer-guide/context-engine-plugin)。

### 图像生成后端

将提供者放入 `plugins/image_gen/<名称>/` 目录：

```python
# plugins/image_gen/my-imggen/__init__.py
from agent.image_gen_provider import ImageGenProvider

class MyImageGenProvider(ImageGenProvider):
    @property
    def name(self) -> str:
        return "my-imggen"

    def is_available(self) -> bool: ...
    def generate(self, prompt: str, **kwargs) -> str: ...   # 返回图像路径

def register(ctx):
    ctx.register_image_gen_provider(MyImageGenProvider())
```

```yaml
# plugins/image_gen/my-imggen/plugin.yaml
name: my-imggen
kind: backend
version: 1.0.0
description: 自定义图像生成后端
```

**完整指南：** [图像生成提供者插件](/docs/developer-guide/image-gen-provider-plugin) — 完整的 `ImageGenProvider` 抽象基类、`list_models()` / `get_setup_schema()` 元数据、`success_response()`/`error_response()` 辅助函数、base64 与 URL 输出、用户覆盖、pip 分发。

**参考示例：** `plugins/image_gen/openai/`（通过 OpenAI SDK 使用 DALL-E / GPT-Image）、`plugins/image_gen/openai-codex/`、`plugins/image_gen/xai/`（Grok 图像生成）。

## 非Python扩展界面

Hermes也接受完全不是Python插件的扩展。这些扩展在[可插拔接口表](/docs/user-guide/features/plugins#pluggable-interfaces--where-to-go-for-each)中展示；以下各节简要概述每种扩展的创建方式。

### MCP服务器 — 注册外部工具

模型上下文协议（MCP）服务器无需任何Python插件即可将其自身工具注册到Hermes中。在 `~/.hermes/config.yaml` 中声明它们：

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    timeout: 120

  linear:
    url: "https://mcp.linear.app/sse"
    auth:
      type: "oauth"
```

Hermes在启动时连接到每个服务器，列出其工具，并将它们与内置工具一起注册。LLM看到的它们与任何其他工具完全一样。**完整指南：** [MCP](/docs/user-guide/features/mcp)。

### 网关事件钩子 — 在生命周期事件时触发

将清单文件和处理程序放入 `~/.hermes/hooks/<name>/`：

```yaml
# ~/.hermes/hooks/long-task-alert/HOOK.yaml
name: long-task-alert
description: 当长时间任务完成时发送推送通知
events:
  - agent:end
```

```python
# ~/.hermes/hooks/long-task-alert/handler.py
async def handle(event_type: str, context: dict) -> None:
    if context.get("duration_seconds", 0) > 120:
        # 发送通知...
        pass
```

事件包括 `gateway:startup`、`session:start`、`session:end`、`session:reset`、`agent:start`、`agent:step`、`agent:end` 以及通配符 `command:*`。钩子中的错误会被捕获并记录——它们永远不会阻塞主流程。

**完整指南：** [网关事件钩子](/docs/user-guide/features/hooks#gateway-event-hooks)。

### Shell钩子 — 在工具调用时运行Shell命令

如果你只想在工具触发时运行一个脚本（用于通知、审计日志、桌面警报、自动格式化），可以在 `config.yaml` 中使用shell钩子——无需Python：

```yaml
hooks:
  - event: post_tool_call
    command: "notify-send '工具已运行: {tool_name}'"
    when:
      tools: [terminal, patch, write_file]
```

支持与Python插件钩子相同的事件（`pre_tool_call`、`post_tool_call`、`pre_llm_call`、`post_llm_call`、`on_session_start`、`on_session_end`、`pre_gateway_dispatch`），并为 `pre_tool_call` 的阻塞决策提供结构化的JSON输出支持。

**完整指南：** [Shell钩子](/docs/user-guide/features/hooks#shell-hooks)。

### 技能源 — 添加自定义技能注册表

如果你维护着一个技能的GitHub仓库（或者想从内置源之外的社区索引拉取），可以将其添加为一个**tap**：

```bash
hermes skills tap add myorg/skills-repo
hermes skills search my-workflow --source myorg/skills-repo
hermes skills install myorg/skills-repo/my-workflow
```

发布你自己的tap只需要一个包含 `skills/<skill-name>/SKILL.md` 目录结构的GitHub仓库——无需服务器或注册表。

**完整指南：** [技能中心](/docs/user-guide/features/skills#skills-hub) · [发布自定义tap](/docs/user-guide/features/skills#publishing-a-custom-skill-tap)（仓库结构、最小示例、非默认路径、信任级别）。

### 通过命令模板实现TTS / STT

任何读写音频或文本的CLI都可以通过 `config.yaml` 插入——无需Python代码：

```yaml
tts:
  provider: voxcpm
  providers:
    voxcpm:
      type: command
      command: "voxcpm --ref ~/voice.wav --text-file {input_path} --out {output_path}"
      output_format: mp3
      voice_compatible: true
```

对于语音转文字（STT），将 `HERMES_LOCAL_STT_COMMAND` 指向一个shell模板。支持的占位符：`{input_path}`、`{output_path}`、`{format}`、`{voice}`、`{model}`、`{speed}`（TTS）；`{input_path}`、`{output_dir}`、`{language}`、`{model}`（STT）。任何与路径交互的CLI都自动成为插件。

**完整指南：** [TTS自定义命令提供程序](/docs/user-guide/features/tts#custom-command-providers) · [STT](/docs/user-guide/features/tts#voice-message-transcription-stt)。
## 通过pip分发

为了公开分享插件，请在你的Python包中添加一个入口点：

```toml
# pyproject.toml
[project.entry-points."hermes_agent.plugins"]
my-plugin = "my_plugin_package"
```

```bash
pip install hermes-plugin-calculator
# 插件在下次 hermes 启动时自动发现
```

## 为NixOS分发

NixOS用户可以通过声明式方式安装你的插件，如果你提供了带有入口点的 `pyproject.toml`：

**入口点插件**（推荐用于分发）：
```nix
# 用户的 configuration.nix
services.hermes-agent.extraPythonPackages = [
  (pkgs.python312Packages.buildPythonPackage {
    pname = "my-plugin";
    version = "1.0.0";
    src = pkgs.fetchFromGitHub {
      owner = "you";
      repo = "hermes-my-plugin";
      rev = "v1.0.0";
      hash = "sha256-...";  # nix-prefetch-url --unpack
    };
    format = "pyproject";
    build-system = [ pkgs.python312Packages.setuptools ];
  })
];
```

**目录插件**（不需要 `pyproject.toml`）：
```nix
services.hermes-agent.extraPlugins = [
  (pkgs.fetchFromGitHub {
    owner = "you";
    repo = "hermes-my-plugin";
    rev = "v1.0.0";
    hash = "sha256-...";
  })
];
```

请参阅 [Nix安装指南](/docs/getting-started/nix-setup#plugins)，获取完整的文档，包括overlay用法和冲突检查。

## 常见错误

**处理程序没有返回JSON字符串：**
```python
# 错误 — 返回了字典
def handler(args, **kwargs):
    return {"result": 42}

# 正确 — 返回JSON字符串
def handler(args, **kwargs):
    return json.dumps({"result": 42})
```

**处理程序签名中缺少 `**kwargs`：**
```python
# 错误 — 如果Hermes传递额外的上下文将会中断
def handler(args):
    ...

# 正确
def handler(args, **kwargs):
    ...
```

**处理程序引发异常：**
```python
# 错误 — 异常传播，工具调用失败
def handler(args, **kwargs):
    result = 1 / int(args["value"])  # ZeroDivisionError!
    return json.dumps({"result": result})

# 正确 — 捕获并返回错误JSON
def handler(args, **kwargs):
    try:
        result = 1 / int(args.get("value", 0))
        return json.dumps({"result": result})
    except Exception as e:
        return json.dumps({"error": str(e)})
```

**Schema描述过于模糊：**
```python
# 不好 — 模型不知道何时使用它
"description": "做些事情"

# 好 — 模型清楚知道何时以及如何使用
"description": "计算一个数学表达式。用于算术、三角函数、对数运算。支持：+、-、*、/、**、sqrt、sin、cos、log、pi、e。"
```