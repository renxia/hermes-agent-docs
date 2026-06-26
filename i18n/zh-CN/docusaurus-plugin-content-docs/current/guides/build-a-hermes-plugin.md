---
sidebar_position: 9
sidebar_label: "Build a Plugin"
title: "构建一个Hermes插件"
description: "一份逐步指南，教你如何使用工具、钩子、数据文件和技能来构建一个完整的Hermes插件"
---

# 构建一个Hermes插件

本指南将带你从零开始构建一个完整的Hermes插件。完成时，你将拥有一个功能完善的插件，它包含多个工具、生命周期钩子、已打包的数据文件和捆绑技能——这涵盖了插件系统所支持的一切内容。

:::info 不确定你需要哪份指南？
Hermes具有多个独特的可插拔接口——有些使用Python的`register_*` API，而其他则基于配置或作为目录直接放置。请先参考此映射表：

| 如果你想添加… | 阅读 |
|---|---|
| 自定义工具、钩子、斜杠命令、技能或CLI子命令 | **本指南**（通用的插件界面） |
| 一个**LLM/推理后端**（新的提供者） | [Model Provider Plugins](/developer-guide/model-provider-plugin) |
| 一个**网关通道**（Discord/Telegram/IRC/Teams等） | [Adding Platform Adapters](/developer-guide/adding-platform-adapters) |
| 一个**内存后端**（Honcho/Mem0/Supermemory等） | [Memory Provider Plugins](/developer-guide/memory-provider-plugin) |
| 一个**上下文压缩引擎** | [Context Engine Plugins](/developer-guide/context-engine-plugin) |
| 一个**图像生成后端** | [Image Generation Provider Plugins](/developer-guide/image-gen-provider-plugin) |
| 一个**视频生成后端** | [Video Generation Provider Plugins](/developer-guide/video-gen-provider-plugin) |
| 一个**TTS后端**（任何CLI——Piper、VoxCPM、Kokoro、语音克隆等） | [TTS custom command providers](/user-guide/features/tts#custom-command-providers) — 基于配置，无需Python |
| 一个**STT后端**（自定义whisper/ASR CLI） | [Voice Message Transcription](/user-guide/features/tts#voice-message-transcription-stt) — 将`HERMES_LOCAL_STT_COMMAND`设置为shell模板 |
| **通过MCP的外部工具**（文件系统、GitHub、Linear、任何MCP服务器） | [MCP](/user-guide/features/mcp) — 在`config.yaml`中声明`mcp_servers.<name>` |
| **网关事件钩子**（在启动时触发、会话事件、命令） | [Event Hooks](/user-guide/features/hooks#gateway-event-hooks) — 将`HOOK.yaml` + `handler.py`放入`~/.hermes/hooks/<name>/` |
| **Shell钩子**（在事件上运行shell命令） | [Shell Hooks](/user-guide/features/hooks#shell-hooks) — 在`config.yaml`的`hooks:`下声明 |
| **额外的技能来源**（自定义GitHub仓库、私有技能索引） | [Skills](/user-guide/features/skills) — `hermes skills tap add <repo>` · [Publishing a tap](/user-guide/features/skills#publishing-a-custom-skill-tap) |
| 一个一流的**核心**推理提供者（非插件） | [Adding Providers](/developer-guide/adding-providers) |

请查看完整的[可插拔接口表](/user-guide/features/plugins#pluggable-interfaces--where-to-go-for-each)，以获得所有扩展界面的综合视图，包括基于配置（TTS、STT、MCP、Shell钩子）和目录放置（网关钩子）的样式。
:::

## 你将构建什么

一个包含两个工具的**计算器**插件：
- `calculate` — 评估数学表达式（如`2**16`、`sqrt(144)`、`pi * 5**2`）
- `unit_convert` — 单位转换（如`100 F → 37.78 C`、`5 km → 3.11 mi`）

此外，还有一个记录每次工具调用的钩子和一个捆绑的技能文件。

## 步骤 1: 创建插件目录

```bash
mkdir -p ~/.hermes/plugins/calculator
cd ~/.hermes/plugins/calculator
```

## 步骤 2: 编写清单 (Manifest)

创建 `plugin.yaml`:

```yaml
name: calculator
version: 1.0.0
description: Math calculator — evaluate expressions and convert units
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
requires_env:          # 在安装过程中提示加载环境参数；用于检查依赖
  - SOME_API_KEY       # 简单格式 — 如果缺少则禁用插件
  - name: OTHER_KEY    # 复杂格式 — 在安装时显示描述/URL
    description: "Key for the Other service"
    url: "https://other.com/keys"
    secret: true
```

## 步骤 3: 编写工具模式 (Tool Schemas)

创建 `schemas.py` — 这是 LLM 用来决定何时调用你的工具的内容：

```python
"""工具模式（Tool schemas）— LLM 所能看到的内容。"""

CALCULATE = {
    "name": "calculate",
    "description": (
        "评估数学表达式并返回结果。 支持算术运算（+, -, *, /, **）、函数（sqrt, sin, cos, "
        "log, abs, round, floor, ceil）和常数（pi, e）。 用于用户提出的任何数学问题。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "expression": {
                "type": "string",
                "description": "要评估的数学表达式 (例如: '2**10', 'sqrt(144)')",
            },
        },
        "required": ["expression"],
    },
}

UNIT_CONVERT = {
    "name": "unit_convert",
    "description": (
        "在不同单位之间转换数值。 支持长度（m, km, mi, ft, in）、重量（kg, lb, oz, g）、温度（C, F, K）、数据（B, KB, MB, GB, TB）和时间（s, min, hr, day）。"
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
                "description": "源单位 (例如: 'km', 'lb', 'F', 'GB')",
            },
            "to_unit": {
                "type": "string",
                "description": "目标单位 (例如: 'mi', 'kg', 'C', 'MB')",
            },
        },
        "required": ["value", "from_unit", "to_unit"],
    },
}
```

**模式的重要性:** `description` 字段决定了 LLM 何时使用你的工具。请详细说明它能做什么以及何时应该使用它。`parameters` 定义了 LLM 需要传递的参数。

## 步骤 4: 编写工具处理器 (Tool Handlers)

创建 `tools.py` — 这是当 LLM 调用你的工具时实际执行的代码：

```python
"""工具处理器（Tool handlers）— 当 LLM 调用每个工具时运行的代码。"""

import json
import math

# 用于表达式安全评估的安全全局变量 — 不包含文件/网络访问权限
_SAFE_MATH = {
    "abs": abs, "round": round, "min": min, "max": max,
    "pow": pow, "sqrt": math.sqrt, "sin": math.sin, "cos": math.cos,
    "tan": math.tan, "log": math.log, "log2": math.log2, "log10": math.log10,
    "floor": math.floor, "ceil": math.ceil,
    "pi": math.pi, "e": math.e,
    "factorial": math.factorial,
}


def calculate(args: dict, **kwargs) -> str:
    """安全地评估数学表达式。

    处理器规则：
    1. 接收 args (dict) — LLM 传递的参数
    2. 执行工作
    3. 返回一个 JSON 字符串 — 无论成功还是失败，都必须如此
    4. 接受 **kwargs 以保证向后兼容性
    """
    expression = args.get("expression", "").strip()
    if not expression:
        return json.dumps({"error": "未提供表达式"})

    try:
        # 使用 _SAFE_MATH 进行受限评估
        result = eval(expression, {"__builtins__": {}}, _SAFE_MATH)
        return json.dumps({"expression": expression, "result": result})
    except ZeroDivisionError:
        return json.dumps({"expression": expression, "error": "除以零"})
    except Exception as e:
        return json.dumps({"expression": expression, "error": f"无效操作: {e}"})


# 转换表 — 值均以基础单位为基准
_LENGTH = {"m": 1, "km": 1000, "mi": 1609.34, "ft": 0.3048, "in": 0.0254, "cm": 0.01}
_WEIGHT = {"kg": 1, "g": 0.001, "lb": 0.453592, "oz": 0.0283495}
_DATA = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3, "TB": 1024**4}
_TIME = {"s": 1, "ms": 0.001, "min": 60, "hr": 3600, "day": 86400}


def _convert_temp(value, from_u, to_u):
    # 标准化到摄氏度
    c = {"F": (value - 32) * 5/9, "K": value - 273.15}.get(from_u, value)
    # 转换为目标单位
    return {"F": c * 9/5 + 32, "K": c + 273.15}.get(to_u, c)


def unit_convert(args: dict, **kwargs) -> str:
    """在不同单位之间进行转换。"""
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

        # 基于比例的转换 (Ratio-based conversions)
        for table in (_LENGTH, _WEIGHT, _DATA, _TIME):
            lc = {k.lower(): v for k, v in table.items()}
            if from_unit.lower() in lc and to_unit.lower() in lc:
                result = float(value) * lc[from_unit.lower()] / lc[to_unit.lower()]
                return json.dumps({"input": f"{value} {from_unit}",
                                 "result": round(result, 6),
                                 "output": f"{round(result, 6)} {to_unit}"})

        return json.dumps({"error": f"无法将 {from_unit} 转换为 {to_unit}"})
    except Exception as e:
        return json.dumps({"error": f"转换失败: {e}"})
```

**处理器关键规则:**
1. **签名 (Signature):** `def my_handler(args: dict, **kwargs) -> str`
2. **返回值 (Return):** 必须是 JSON 字符串。成功和错误都一样。
3. **绝不抛出异常 (Never raise):** 捕获所有异常，返回错误 JSON 而不是让程序崩溃。
4. **接受 `**kwargs`:** Hermes 未来可能会传入额外的上下文信息。

## 步骤 5: 编写注册文件 (Registration)

创建 `__init__.py` — 这将模式与处理器连接起来：

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
    logger.debug("工具被调用: %s (会话 %s)", tool_name, task_id)


def register(ctx):
    """将模式连接到处理器并注册钩子。"""
    # 注册 calculate 工具
    ctx.register_tool(name="calculate",    toolset="calculator",
                      schema=schemas.CALCULATE,    handler=tools.calculate)
    # 注册 unit_convert 工具
    ctx.register_tool(name="unit_convert", toolset="calculator",
                      schema=schemas.UNIT_CONVERT, handler=tools.unit_convert)

    # 这个钩子会针对所有工具调用（而不仅仅是我们自己的）
    ctx.register_hook("post_tool_call", _on_post_tool_call)
```

**`register()` 函数的作用:**
- 仅在启动时调用一次。
- `ctx.register_tool()` 将你的工具放入注册表 — 模型会立即看到它。
- `ctx.register_hook()` 订阅生命周期事件。
- `ctx.register_cli_command()` 注册一个 CLI 子命令（例如：`hermes my-plugin <subcommand>`）。
- `ctx.register_command()` 注册一个会话内斜杠命令（例如：在 CLI/网关聊天中的 `/myplugin <args>`）— 请参阅下方的 [注册斜杠命令](#register-slash-commands)。
- `ctx.dispatch_tool(name, arguments)` — 使用父智能体的上下文（批准、凭证、task_id）自动连接起来，调用任何其他工具（内置或来自另一个插件）。这对于需要像模型直接调用一样来调用 `terminal`、`read_file` 或任何其他工具的斜杠命令处理器特别有用。
- 如果此函数崩溃，插件将被禁用，但 Hermes 仍能正常运行。

**`dispatch_tool` 示例 — 一个运行工具的斜杠命令:**

```python
def handle_scan(ctx, raw_args: str):
    """通过注册表调用 terminal 工具来实现 /scan 命令。"""
    result = ctx.dispatch_tool("terminal", {"command": f"find . -name '{raw_args}'"})
    return result  # 返回给调用者的聊天 UI

def register(ctx):
    # 处理器接收单个 raw_args 字符串；通过 lambda 函数捕获 ctx。
    ctx.register_command(
        "scan",
        lambda raw: handle_scan(ctx, raw),
        description="查找匹配 glob 的文件",
    )
```

被调用的工具会经过正常的批准、脱敏和预算流程 — 它是一个真实的工具调用，而不是绕过这些流程的捷径。

## Step 6: Test it

启动 Hermes：

```bash
hermes
```

你应该在横幅的工具列表中看到 `calculator: calculate, unit_convert`。

尝试这些提示：
```
2 的 16 次方是多少？
将 100 华氏度转换为摄氏度
2 倍 π 的平方根是多少？
1.5 TB 有多少 GB？
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

如果你的智能体没有显示出来——或者显示了但没有加载，请设置 `HERMES_PLUGINS_DEBUG=1` 以在 stderr 上获取详细的发现日志：

```bash
HERMES_PLUGINS_DEBUG=1 hermes plugins list
```

你将看到针对每个插件源（捆绑、用户、项目、入口点）：

- 扫描了哪些目录以及每个目录产生了多少个清单文件 (manifest)
- 每个清单文件：解析后的键、名称、种类、来源、磁盘路径
- 跳过原因：`通过配置禁用`、`未在配置中启用`、`独占插件`、`没有 plugin.yaml, 深度限制已达`
- 加载时：正在导入的插件，以及 `register(ctx)` 注册内容的单行摘要（工具、钩子、斜杠命令、CLI 命令）
- 解析失败时：针对异常的完整堆栈跟踪（YAML 扫描错误等）
- `register()` 失败时：指向你的 `__init__.py` 中抛出错误的行的完整堆栈跟踪

相同的日志始终写入 `~/.hermes/logs/agent.log`，级别为 WARNING（仅失败情况）和 DEBUG（所有内容），前提是设置了环境变量。因此，如果你无法使用环境变量运行（例如，从网关内部），请转而查看日志文件：

```bash
hermes logs --level WARNING | grep -i plugin
```

插件不显示的常见原因：

- **未在配置中启用** — 插件是选择性启用的。运行 `hermes plugins enable <name>`（名称来自 `plugins list` 的输出，该输出可以是 `<category>/<plugin>` 用于嵌套布局）。
- **错误的目录布局** — 必须是 `~/.hermes/plugins/<plugin-name>/plugin.yaml` (扁平结构) 或 `~/.hermes/plugins/<category>/<plugin-name>/plugin.yaml` (最多一层类别嵌套)。更深层的将被忽略。
- **缺少 `__init__.py`** — 插件目录需要同时包含 `plugin.yaml` 和一个带有 `register(ctx)` 函数的 `__init__.py`。
- **错误的 `kind`** — 网关适配器在其清单文件中需要 `kind: platform`。内存提供者被自动检测为 `kind: exclusive`，而不是通过 `plugins.enabled` 路由到 `memory.provider` 配置中。

## 你的插件最终结构

```
~/.hermes/plugins/calculator/
├── plugin.yaml      # "我是 calculator，我提供工具和钩子"
├── __init__.py      # 连接：模式 (schemas) → 处理程序 (handlers)，注册钩子
├── schemas.py       # LLM 读取的内容（描述 + 参数规范）
└── tools.py         # 运行的内容（calculate, unit_convert 函数）
```

四个文件，清晰的分工：
- **清单文件 (Manifest)** 声明插件是什么
- **模式 (Schemas)** 描述供 LLM 使用的工具
- **处理程序 (Handlers)** 实现实际逻辑
- **注册 (Registration)** 连接所有内容

## 插件还能做什么？

### 存储数据文件

将任何文件放入您的插件目录中，并在导入时读取它们：

```python
# 在 tools.py 或 __init__.py 中
from pathlib import Path

_PLUGIN_DIR = Path(__file__).parent
_DATA_FILE = _PLUGIN_DIR / "data" / "languages.yaml"

with open(_DATA_FILE) as f:
    _DATA = yaml.safe_load(f)
```

### 捆绑技能

插件可以存储智能体通过 `skill_view("plugin:skill")` 加载的技能文件。请在 `__init__.py` 中注册它们：

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

智能体现在可以使用其命名空间名称加载您的技能：

```python
skill_view("my-plugin:my-workflow")   # → 插件版本
skill_view("my-workflow")              # → 内置版本（不变）
```

**关键属性:**
- 插件技能是**只读的** — 它们不会进入 `~/.hermes/skills/`，也无法通过 `skill_manage` 进行编辑。
- 插件技能**不会**列在系统提示词的 `<available_skills>` 索引中 — 它们是显式选择加载的。
- 基本技能名称不受影响 — 命名空间防止与内置技能发生冲突。
- 当智能体加载一个插件技能时，会添加一个捆绑上下文横幅，列出来自同一插件的同级技能。

:::tip 旧模式
旧的 `shutil.copy2` 模式（将技能复制到 `~/.hermes/skills/`）仍然有效，但存在与内置技能发生名称冲突的风险。对于新插件，请优先使用 `ctx.register_skill()`。
:::

### 基于环境变量进行门控

如果您的插件需要 API 密钥：

```yaml
# plugin.yaml — 简单格式（向后兼容）
requires_env:
  - WEATHER_API_KEY
```

如果未设置 `WEATHER_API_KEY`，则该插件会被禁用，并给出清晰的提示信息。不会崩溃，智能体中也不会有错误——只会显示“天气插件已禁用 (缺少：WEATHER_API_KEY)”。

当用户运行 `hermes plugins install` 时，系统会**交互式地提示**任何缺失的 `requires_env` 变量。值会自动保存到 `.env` 文件中。

为了获得更好的安装体验，请使用包含描述和注册 URL 的丰富格式：

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
| `description` | 否 | 在安装提示中显示给用户 |
| `url` | 否 | 获取凭证的网址 |
| `secret` | 否 | 如果为 `true`，则输入会被隐藏（类似于密码字段） |

两种格式都可以混合在一个列表中。已设置的变量将被静默跳过。

### 懒惰安装可选 Python 依赖项

如果您的插件封装了一个并非所有用户都已安装的 SDK（供应商 SDK、重量级 ML 库、特定平台包），请不要在模块顶部 `import` 它。请在工具处理器中使用 `tools.lazy_deps.ensure(...)` 助手——Hermes 会在首次使用时安装该软件包，并受用户的 `security.allow_lazy_installs` 配置进行门控。

```python
# tools.py
from tools.lazy_deps import ensure, FeatureUnavailable

def my_tool_handler(args, **kwargs):
    try:
        ensure("my-plugin.my-backend")   # key 必须在 LAZY_DEPS 中
    except FeatureUnavailable as exc:
        return {"error": str(exc)}

    import my_backend_sdk   # 现在是安全的了
    ...
```

`tools/lazy_deps.py` 中的安全模型包含两条规则：

| 规则 | 原因 |
|---|---|
| 您的功能 key 必须出现在树状结构的 `LAZY_DEPS` 白名单中 | 防止恶意配置诱骗 Hermes 安装任意软件包——只有 Hermes 本身发布的规范才符合要求 |
| 规范仅限 PyPI 名称 | 不支持 `--index-url`、`git+https://` 或文件路径。请在白名单条目中使用 PEP 440 (`"my-sdk>=1.2,<2"`) 指定版本 |

对于通过 pip 分发的第三方插件，请将可选依赖项声明为您自己的 `pyproject.toml` 中的 `[project.optional-dependencies]` 附加项，并告诉用户运行 `pip install your-plugin[backend]` — 这条路径不经过 `lazy_deps`。懒惰安装机制对于**捆绑**插件最有用，因为在每次安装时都携带一个硬依赖都会使基础 Hermes 体积膨胀。

当全局设置了 `security.allow_lazy_installs: false` 时，`ensure()` 会立即抛出 `FeatureUnavailable` 异常并提供修复提示——您的插件应该捕获它并优雅降级（返回错误结果，而不是崩溃工具循环）。

### 线程安全的懒惰单例模式

插件通常会缓存一个昂贵的对象——一个 SDK 客户端、一个 HTTP 会话、一个连接池——在首次使用时构建在一个模块级别的变量中：

```python
_client = None

def get_client():
    global _client
    if _client is not None:
        return _client
    _client = ExpensiveClient(...)   # ← TOCTOU 竞态条件
    return _client
```

这是一个陷阱。Hermes 在一个进程中运行多个线程（委派工具调用、后台工作者、自我改进的 fork），因此两个线程都可能在 `_client` 设置之前调用 `get_client()`，**两者**都通过 `is not None` 检查，**两者**都执行昂贵的构建操作，而第二次写入会覆盖第一次——从而泄露掉输家打开的任何资源（连接、文件句柄、后台线程）。

不要自己实现锁。请使用 `plugins/plugin_utils.py` 中的助手：

```python
from plugins.plugin_utils import lazy_singleton, SingletonSlot

# 零参数访问器 → 进行装饰:
@lazy_singleton
def get_client():
    return ExpensiveClient(load_config())   # 只运行一次

client = get_client()    # 线程安全
get_client.reset()       # 丢弃实例（测试/清理）


# 需要构建参数的访问器 → 使用 slot:
_slot: SingletonSlot = SingletonSlot()

def get_client(config=None):
    return _slot.get(lambda: ExpensiveClient(resolve(config)))

def reset_client():
    _slot.reset()
```

两者都使用双重检查锁定序列化并发首次调用，并且工厂函数最多只运行一次。如果工厂函数抛出异常，则不会缓存任何内容，下次调用会重试。内存插件（`plugins/memory/honcho/client.py`）是参考消费者。

> 经验法则：只要您写了 `global _something` 然后进行 `is None` 检查并执行构建操作，就应该使用这些助手之一。

### 条件工具可用性

对于依赖可选库的工具：

```python
ctx.register_tool(
    name="my_tool",
    schema={...},
    handler=my_handler,
    check_fn=lambda: _has_optional_lib(),  # False = 模型看不到该工具
)
```

### 覆盖内置工具

要用自己的实现替换一个内置工具（例如，将默认的浏览器工具替换为带头 Chrome CDP 后端，或将 `web_search` 替换为自定义的企业索引），请传入 `override=True`：

```python
def register(ctx):
    ctx.register_tool(
        name="browser_navigate",             # 与内置工具相同的名称
        toolset="plugin_my_browser",         # 您自己的工具集命名空间
        schema={...},
        handler=my_custom_navigate,
        override=True,                       # 显式选择加入
    )
```

如果没有 `override=True`，注册表将拒绝任何会遮盖来自不同工具集的现有工具的注册——这可以防止意外覆盖。此覆盖操作会被记录在 INFO 级别，因此可以在 `~/.hermes/logs/agent.log` 中进行审计。插件加载顺序晚于内置工具，因此注册顺序是正确的：您的处理器将替换内置的工具。

### 注册多个钩子 (Hooks)

```python
def register(ctx):
    ctx.register_hook("pre_tool_call", before_any_tool)
    ctx.register_hook("post_tool_call", after_any_tool)
    ctx.register_hook("pre_llm_call", inject_memory)
    ctx.register_hook("on_session_start", on_new_session)
    ctx.register_hook("on_session_end", on_session_end)
```

### 钩子参考

每个钩子都在 **[事件钩子参考](/user-guide/features/hooks#plugin-hooks)** 中有完整的文档说明——回调签名、参数表、精确的触发时机和示例。以下是总结：

| 钩子 | 何时触发 | 回调签名 | 返回值 |
|------|-----------|-------------------|---------|
| [`pre_tool_call`](/user-guide/features/hooks#pre_tool_call) | 在任何工具执行之前 | `tool_name: str, args: dict, task_id: str` | 忽略 |
| [`post_tool_call`](/user-guide/features/hooks#post_tool_call) | 在任何工具返回之后 | `tool_name: str, args: dict, result: str, task_id: str, duration_ms: int` | 忽略 |
| [`pre_llm_call`](/user-guide/features/hooks#pre_llm_call) | 每轮之前一次，在工具调用循环开始时 | `session_id: str, user_message: str, conversation_history: list, is_first_turn: bool, model: str, platform: str` | [上下文注入](#pre_llm_call-context-injection) |
| [`post_llm_call`](/user-guide/features/hooks#post_llm_call) | 每轮之后一次，在工具调用循环结束后（仅限成功的轮次） | `session_id: str, user_message: str, assistant_response: str, conversation_history: list, model: str, platform: str` | 忽略 |
| [`on_session_start`](/user-guide/features/hooks#on_session_start) | 创建新会话（仅首次轮次） | `session_id: str, model: str, platform: str` | 忽略 |
| [`on_session_end`](/user-guide/features/hooks#on_session_end) | 每次 `run_conversation` 调用结束 + CLI 退出 | `session_id: str, completed: bool, interrupted: bool, model: str, platform: str` | 忽略 |
| [`on_session_finalize`](/user-guide/features/hooks#on_session_finalize) | CLI/网关终止一个活动会话 | `session_id: str \| None, platform: str` | 忽略 |
| [`on_session_reset`](/user-guide/features/hooks#on_session_reset) | 网关切换一个新的会话 key（`/new`、`/reset`） | `session_id: str, platform: str` | 忽略 |
| `kanban_task_claimed` | 一个看板任务被认领（调度进程，在工作者启动之前） | `task_id: str, board: str \| None, assignee: str \| None, run_id: int \| None, profile_name: str` | 忽略 |
| `kanban_task_completed` | 一个看板任务完成（工作进程） | `task_id, board, assignee, run_id, profile_name, summary: str \| None` | 忽略 |
| `kanban_task_blocked` | 一个看板任务被阻塞（工作进程） | `task_id, board, assignee, run_id, profile_name, reason: str \| None` | 忽略 |

大多数钩子都是“发送即忘”的观察者——它们的返回值会被忽略。例外是 `pre_llm_call`，它可以向对话注入上下文。

所有回调都应该接受 `**kwargs` 以保证向前兼容性。如果一个钩子回调崩溃了，它将被记录并跳过。其他钩子和智能体将正常继续运行。

看板生命周期钩子在董事会数据库更改提交后才触发，因此回调函数总是能看到持久化的状态，永远不会持有 SQLite 写入锁。由于看板工作者作为独立的 `hermes -p <profile> chat -q` 子进程运行，`kanban_task_claimed` 在**调度器**进程中触发，而 `kanban_task_completed` / `kanban_task_blocked` 则在**工作者**进程中触发——请在调度器中编写钩子以集中观察每一次转换，或在工作者中进行每个任务的会话上下文。

### `pre_llm_call` 上下文注入

这是唯一返回值重要的钩子。当 `pre_llm_call` 回调返回一个包含 `"context"` 键的字典（或一个纯字符串）时，Hermes 会将该文本注入到**当前轮次的用户消息**中。这是内存插件、RAG 集成、护栏以及任何需要向模型提供额外上下文的插件所使用的机制。

#### 返回格式

```python
# 包含 context 键的字典
return {"context": "已召回的记忆:\n- 用户偏好深色模式\n- 上一个项目: hermes-agent"}

# 纯字符串（等同于上述字典形式）
return "已召回的记忆:\n- 用户偏好深色模式"

# 返回 None 或不返回 → 不进行注入（仅观察者）
return None
```

任何非 `None`、非空且包含 `"context"` 键（或一个纯非空字符串）的返回值都将被收集并附加到当前轮次的用户消息中。

#### 工作原理

注入的上下文会被追加到**用户消息**中，而不是系统提示词中。这是一个故意的设计选择：

- **提示缓存保护** — 系统提示词在所有轮次中保持不变。Anthropic 和 OpenRouter 会缓存系统提示词前缀，因此保持其稳定可以节省多轮对话中 75% 以上的输入 token。如果插件修改了系统提示词，每一轮都会导致缓存未命中。
- **瞬时性** — 注入只发生在 API 调用时。对话历史中的原始用户消息永远不会被修改，也不会持久化到会话数据库中。
- **系统提示词是 Hermes 的领域** — 它包含模型特定的指导、工具强制执行规则、个性指令和缓存的技能内容。插件是在用户输入的同时提供上下文，而不是通过更改智能体的核心指令来做到的。

#### 示例：记忆召回插件

```python
"""记忆插件 — 从向量存储中召回相关上下文。"""

import httpx

MEMORY_API = "https://your-memory-api.example.com"

def recall_context(session_id, user_message, is_first_turn, **kwargs):
    """在每次 LLM 轮次之前调用。返回召回的记忆。"""
    try:
        resp = httpx.post(f"{MEMORY_API}/recall", json={
            "session_id": session_id,
            "query": user_message,
        }, timeout=3)
        memories = resp.json().get("results", [])
        if not memories:
            return None  # 没有东西需要注入

        text = "从之前的会话中召回的上下文:\n"
        text += "\n".join(f"- {m['text']}" for m in memories)
        return {"context": text}
    except Exception:
        return None  # 静默失败，不应导致智能体崩溃

def register(ctx):
    ctx.register_hook("pre_llm_call", recall_context)
```

#### 示例：护栏插件

```python
"""护栏插件 — 执行内容策略。"""

POLICY = """您必须遵守本会话的内容策略：
- 切勿生成访问工作目录之外文件系统的代码
- 在执行破坏性操作前始终发出警告
- 拒绝涉及个人数据提取的请求"""

def inject_guardrails(**kwargs):
    """将策略文本注入到每一轮次中。"""
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
    """在每次 LLM 调用之前触发。返回 None — 不进行上下文注入。"""
    logger.info("轮次: session=%s model=%s first=%s msg_len=%d",
                session_id, model, is_first_turn, len(user_message or ""))
    # 不返回 → 不注入

def register(ctx):
    ctx.register_hook("pre_llm_call", log_turn)
```

#### 多个插件返回上下文

当多个插件从 `pre_llm_call` 返回上下文时，它们的输出将用双换行符连接起来并附加到用户消息中。顺序遵循插件发现的顺序（按插件目录名称字母排序）。

### 注册 CLI 命令

插件可以添加自己的 `hermes <plugin>` 子命令树：

```python
def _my_command(args):
    """hermes my-plugin <subcommand> 的处理器。"""
    sub = getattr(args, "my_command", None)
    if sub == "status":
        print("一切正常!")
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

**记忆提供者插件**则采用约定式方法：向您的插件 `cli.py` 文件添加一个 `register_cli(subparser)` 函数。记忆插件发现系统会自动找到它——无需调用 `ctx.register_cli_command()`。有关详细信息，请参阅 [记忆提供者插件指南](/developer-guide/memory-provider-plugin#adding-cli-commands)。

**活动提供者门控:** 记忆插件的 CLI 命令仅在它们的提供者是配置中活动的 `memory.provider` 时才会显示。如果用户尚未设置您的提供者，则您的 CLI 命令不会使帮助输出变得混乱。

### 注册斜杠（Slash）命令

插件可以注册会话内的斜杠命令——即用户在对话中输入的命令（例如 `/lcm status` 或 `/ping`）。这些命令在 CLI 和网关（Telegram、Discord 等）中均有效。

```python
def _handle_status(raw_args: str) -> str:
    """/mystatus 的处理器 — 接收命令名称后的所有内容。"""
    if raw_args.strip() == "help":
        return "用法: /mystatus [help|check]"
    return "插件状态：所有系统正常"

def register(ctx):
    ctx.register_command(
        "mystatus",
        handler=_handle_status,
        description="显示插件状态",
    )
```

注册后，用户可以在任何会话中输入 `/mystatus`。该命令将出现在自动补全、`/help` 输出和 Telegram 机器人菜单中。

**签名:** `ctx.register_command(name: str, handler: Callable, description: str = "", args_hint: str = "")`

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `name` | `str` | 不带前斜杠的命令名称（例如 `"lcm"`、`"mystatus"`） |
| `handler` | `Callable[[str], str \| None]` | 接收原始参数字符串。也可以是异步的。 |
| `description` | `str` | 显示在 `/help`、自动补全和 Telegram 机器人菜单中 |

**与 `register_cli_command()` 的关键区别:**

| | `register_command()` | `register_cli_command()` |
|---|---|---|
| 调用方式 | 在会话中输入 `/name` | 在终端中输入 `hermes name` |
| 工作范围 | CLI 会话、Telegram、Discord 等 | 仅限终端 |
| Handler 接收内容 | 原始参数字符串 | argparse `Namespace` |
| 用途场景 | 诊断、状态检查、快速操作 | 复杂的子命令树、设置向导 |

**冲突保护:** 如果插件尝试注册一个与内置命令（`help`、`model`、`new` 等）冲突的名称，则注册会被静默拒绝并发出日志警告。内置命令始终具有最高优先级。

**异步处理器:** 网关分派会自动检测并等待异步处理器，因此您可以使用同步或异步函数：

```python
async def _handle_check(raw_args: str) -> str:
    result = await some_async_operation()
    return f"检查结果: {result}"

def register(ctx):
    ctx.register_command("check", handler=_handle_check, description="运行异步检查")
```

### 从斜杠命令分派工具

需要编排工具的斜杠命令处理器（例如，通过 `delegate_task` 启动子智能体、调用 `file_edit` 等）应该使用 `ctx.dispatch_tool()` 而不是深入框架内部。父智能体的上下文（工作区提示、加载指示器、模型继承）会自动配置好。

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
        description="将目标委托给子智能体",
    )
```

**签名:** `ctx.dispatch_tool(name: str, args: dict, *, parent_agent=None) -> str`

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `name` | `str` | 在工具注册表中注册的工具名称（例如 `"delegate_task"`、`"file_edit"`） |
| `args` | `dict` | 工具参数，与模型发送的形状相同 |
| `parent_agent` | `Agent \| None` | 可选覆盖项。如果省略，则从当前的 CLI 智能体解析（或在网关模式下优雅降级） |

**运行时行为:**

- **CLI 模式:** `parent_agent` 从活动的 CLI 智能体中解析，因此工作区提示、加载指示器和模型选择会像预期一样继承。
- **网关模式:** 没有 CLI 智能体，工具将优雅降级——工作区是从配置的终端工作目录读取的，不会显示加载指示器。
- **显式覆盖:** 如果调用者明确传递 `parent_agent=`，则该值将被尊重且不会被覆盖。

这是从插件命令进行工具分派的公共、稳定接口。插件不应该深入到 `ctx._cli_ref.agent` 或类似的私有状态中。

### 在钩子内部操作（配置文件 + 工具）

`ctx._cli_ref` 仅在**交互式 CLI** 会话中被填充。在网关、非交互式的 `hermes chat -q` 运行和**看板生成的 Worker 会话**中，它都是 `None`——因此任何通过 `_cli_ref` 进行的插件逻辑都会在这些上下文中静默地不做任何事情。两个稳定、与会话无关的 API 涵盖了钩子实际需要的：

- **`ctx.profile_name`** — 活动配置文件名（例如 `"default"`，或看板工作者中的分配对象）。它源自 `HERMES_HOME`，因此无论在哪里都能正常工作，无需依赖 `_cli_ref`。
- **`ctx.dispatch_tool(name, args)`** — 调用任何已注册的工具（内置或插件），包括 `kanban_*` 工具、`delegate_task`、`terminal`、`read_file` 等。无论钩子在哪个进程中触发，它都有效。

将它们结合起来，允许看板生命周期钩子观察一次转换并对董事会进行操作，而无需触及框架内部：

```python
def register(ctx):
    def on_blocked(*, task_id, reason=None, **kw):
        # 在工作进程中运行；这里的 ctx._cli_ref 为 None。
        ctx.dispatch_tool("kanban_comment", {
            "task_id": task_id,
            "comment": f"[{ctx.profile_name}] 自动标记阻塞: {reason}",
        })
    ctx.register_hook("kanban_task_blocked", on_blocked)
```

对于运行完整的 `hermes <subcommand>`（例如 `hermes kanban show`），请通过 `ctx.dispatch_tool("terminal", {"command": "hermes kanban show ..."})` 进行外部调用——对于无头工作者会话，不存在进程内的斜杠命令桥接，工具是驱动 Hermes 的支持方式。

### 处理 Slack Block Kit 按钮点击

可以发布带有交互元素的 Block Kit 消息（按钮、溢出菜单、日期选择器等）的插件可以直接与 Slack adapter 注册点击处理器——无需对 `slack_bolt.AsyncApp` 进行猴子补丁。

```python
def register(ctx):
    async def _on_approve(ack, body, action):
        # ack 在 3 秒内 — slack_bolt 的要求。
        await ack()
        # body["channel"]["id"], body["user"]["id"], body["message"]["ts"]
        # action["action_id"], action["value"]
        sweep_id = (action.get("value") or "").split("|", 1)[-1]
        # ...执行确定性工作，然后发布后续消息。

    ctx.register_slack_action_handler("inbox_sweep_approve", _on_approve)
```

**签名:** `ctx.register_slack_action_handler(action_id, callback) -> None`

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `action_id` | `str \| re.Pattern \| dict` | 任何 `slack_bolt.App.action()` 可接受的内容：一个字面量的 `action_id`、匹配多个 ID 的编译正则表达式，或像 `{"action_id": "...", "block_id": "..."}` 这样的约束字典 |
| `callback` | async callable | 接收 `(ack, body, action)`，遵循 slack_bolt 约定 |

**运行时行为:**

- 该处理器在插件加载时排队，并在 Slack 平台连接到 adapter 时被绑定到 `slack_bolt.AsyncApp`。
- 每个回调都会被防御性地包装：如果您的处理器抛出异常，网关会记录错误并尽力而为地确认点击，以防止 Slack 重试。
- 标准的 slack_bolt 规则适用——在 3 秒内 `await ack()`，然后执行更耗时的操作。
- 对于多工作区部署，该处理器会针对任何已连接的工作区中的点击事件触发；如果需要限定行为范围，请使用 `body["team"]["id"]`。

这是插件参与 Slack 交互的公共方式。旧插件可能会打补丁 `SlackAdapter.connect`；请优先使用此 API。

:::tip
本指南涵盖**通用插件**（工具、钩子、斜杠命令、CLI 命令）。下面的部分概述了每种专业化插件的编写模式；每个都链接到其完整的指南以供字段参考和示例。
:::

## 专业插件类型

Hermes 除了通用的表面（surface）之外，还有五种专业的插件类型。它们以目录的形式存在于 `plugins/<category>/<name>/` 下（捆绑包）或 `~/.hermes/plugins/<category>/<name>/` 下（用户）。不同类别的合同要求各异——请选择您需要的类型，然后阅读其完整的指南。

### 模型提供者插件 — 添加一个 LLM 后端

将一个配置文件放入 `plugins/model-providers/<name>/`：

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
description: Acme Inference — OpenAI兼容的直接API
```

首次调用 `get_provider_profile()` 或 `list_providers()` 时才会被懒加载（Lazy-discovered）—— 包括 `auth.py`、`config.py`、`doctor.py`、`models.py`、`runtime_provider.py` 以及聊天补全（chat_completions）传输层对它的自动连接。用户插件通过名称覆盖捆绑的插件。

**完整指南：** [模型提供者插件](/developer-guide/model-provider-plugin) — 字段参考、可覆盖的钩子函数（`prepare_messages`、`build_extra_body`、`build_api_kwargs_extras`、`fetch_models`）、api模式选择、认证类型、测试。

### 平台插件 — 添加一个网关通道

将一个适配器（adapter）放入 `plugins/platforms/<name>/`：

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
        # 自动从环境变量填充 PlatformConfig.extra，这样仅依赖环境变量的设置
        # 就可以在没有 SDK 实例化的情况下显示在 `hermes gateway status` 中。
        env_enablement_fn=_env_enablement,
        # 选择性启用定时任务（cron）交付：`deliver=myplatform` 会路由到此变量。
        cron_deliver_env_var="MYPLATFORM_HOME_CHANNEL",
        emoji="💬",
        platform_hint="您正在通过 MyPlatform 进行聊天。请保持回复简洁。",
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
    description: "定时任务交付的默认频道"
    password: false
```

**完整指南：** [添加平台适配器](/developer-guide/adding-platform-adapters) — 完整的 `BasePlatformAdapter` 合同、消息路由、认证门控（auth gating）、设置向导集成。请查看 `plugins/platforms/irc/` 以获取一个仅使用标准库（stdlib-only）的示例。

### 内存提供者插件 — 添加跨会话知识后端

将 `MemoryProvider` 的实现放入 `plugins/memory/<name>/`：

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

    def sync_turn(self, user_content, assistant_content, *,
                  session_id="", messages=None) -> None:
        ...

    def prefetch(self, query, *, session_id="") -> str:
        ...

    def get_tool_schemas(self) -> list[dict]:
        return []   # 必需的 @abstractmethod — 请参阅完整指南

def register(ctx):
    ctx.register_memory_provider(MyMemoryProvider())
```

内存提供者是单选（single-select）—— 每次只激活一个，通过 `config.yaml` 中的 `memory.provider` 进行选择。

**完整指南：** [内存提供者插件](/developer-guide/memory-provider-plugin) — 完整的 `MemoryProvider` ABC、线程合同、配置隔离、通过 `cli.py` 进行命令行注册。

### 上下文引擎插件 — 替换上下文压缩器

```python
# plugins/context_engine/my-engine/__init__.py
from agent.context_engine import ContextEngine

class MyContextEngine(ContextEngine):
    @property
    def name(self) -> str:
        return "my-engine"

    def update_from_response(self, usage) -> None: ...
    def should_compress(self, prompt_tokens: int = None) -> bool: ...
    def compress(self, messages, current_tokens=None, focus_topic=None) -> list: ...

def register(ctx):
    ctx.register_context_engine(MyContextEngine())
```

上下文引擎是单选的—— 通过 `config.yaml` 中的 `context.engine` 进行选择。

**完整指南：** [上下文引擎插件](/developer-guide/context-engine-plugin)。

### 图像生成后端

将一个提供者（provider）放入 `plugins/image_gen/<name>/`：

```python
# plugins/image_gen/my-imggen/__init__.py
from agent.image_gen_provider import ImageGenProvider

class MyImageGenProvider(ImageGenProvider):
    @property
    def name(self) -> str:
        return "my-imggen"

    def is_available(self) -> bool: ...
    def generate(self, prompt: str, aspect_ratio="landscape", **kwargs) -> dict:
        # 返回 success_response(...) / error_response(...)
        ...

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

**完整指南：** [图像生成提供者插件](/developer-guide/image-gen-provider-plugin) — 完整的 `ImageGenProvider` ABC、`list_models()` / `get_setup_schema()` 元数据、`success_response()`/`error_response()` 辅助函数、base64 与 URL 输出、用户覆盖、pip 分发。

**参考示例：** `plugins/image_gen/openai/` (通过 OpenAI SDK 使用 DALL-E / GPT-Image)、`plugins/image_gen/openai-codex/`、`plugins/image_gen/xai/` (Grok 图像生成)。

## 非 Python 扩展接口

Hermes 也接受并非 Python 插件的扩展。这些扩展可以在 [可插拔接口表](/user-guide/features/plugins#pluggable-interfaces--where-to-go-for-each) 中查看；下面的部分简要概述了每种作者模式。

### MCP 服务器 — 注册外部工具

Model Context Protocol (MCP) 服务器无需任何 Python 插件即可将自己的工具注册到 Hermes。在 `~/.hermes/config.yaml` 中声明它们：

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

Hermes 在启动时连接到每个服务器，列出其工具，并将它们与内置工具一起注册。LLM 会将它们视为任何其他工具。**完整指南：** [MCP](/user-guide/features/mcp)。

### 网关事件钩子 — 在生命周期事件上触发

将一个清单（manifest）+ 处理程序（handler）放入 `~/.hermes/hooks/<name>/` 中：

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
        # 发送通知 …
        pass
```

事件包括 `gateway:startup`、`session:start`、`session:end`、`session:reset`、`agent:start`、`agent:step`、`agent:end` 和通配符 `command:*`。钩子中的错误都会被捕获并记录下来——它们绝不会阻塞主管道。

**完整指南：** [网关事件钩子](/user-guide/features/hooks#gateway-event-hooks)。

### Shell 钩子 — 在工具调用时运行 shell 命令

如果你只是想在工具触发时运行一个脚本（通知、审计日志、桌面提醒、自动格式化器），请在 `config.yaml` 中使用 shell 钩子——无需 Python：

```yaml
hooks:
  - event: post_tool_call
    command: "notify-send 'Tool ran: {tool_name}'"
    when:
      tools: [terminal, patch, write_file]
```

支持与 Python 插件钩子相同的所有事件（`pre_tool_call`、`post_tool_call`、`pre_llm_call`、`post_llm_call`、`on_session_start`、`on_session_end`、`pre_gateway_dispatch`），以及用于 `pre_tool_call` 阻塞决策的结构化 JSON 输出。

**完整指南：** [Shell 钩子](/user-guide/features/hooks#shell-hooks)。

### 技能源 — 添加自定义技能注册表

如果你维护着一套技能的 GitHub 仓库（或想从内置源之外拉取社区索引），请将其添加为一个 **tap**：

```bash
hermes skills tap add myorg/skills-repo
hermes skills search my-workflow --source myorg/skills-repo
hermes skills install myorg/skills-repo/my-workflow
```

发布自己的 tap 只需要一个包含 `skills/<skill-name>/SKILL.md` 目录的 GitHub 仓库——无需服务器或注册表。

**完整指南：** [技能中心](/user-guide/features/skills#skills-hub) · [发布自定义 tap](/user-guide/features/skills#publishing-a-custom-skill-tap) (repo 布局、最小示例、非默认路径、信任级别)。

### 通过命令模板实现 TTS / STT

任何读取/写入音频或文本的 CLI 工具都可以通过 `config.yaml` 接入——无需 Python 代码：

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

对于 STT，将 `HERMES_LOCAL_STT_COMMAND` 指向一个 shell 模板。支持的占位符包括：`{input_path}`、`{output_path}`、`{format}`、`{voice}`、`{model}`、`{speed}` (TTS)；`{input_path}`、`{output_dir}`、`{language}`、`{model}` (STT)。任何与路径交互的 CLI 工具都会自动成为一个插件。

**完整指南：** [TTS 自定义命令提供者](/user-guide/features/tts#custom-command-providers) · [STT](/user-guide/features/tts#voice-message-transcription-stt)。

## 通过 pip 分发

要公开分享插件，请在 Python 包中添加一个入口点：

```toml
# pyproject.toml
[project.entry-points."hermes_agent.plugins"]
my-plugin = "my_plugin_package"
```

```bash
pip install hermes-plugin-calculator
# 插件将在下次启动 hermes 时自动发现
```

## 为 NixOS 分发

NixOS 用户可以通过提供带有入口点的 `pyproject.toml` 来声明式地安装您的插件：

**入口点插件** (推荐用于分发):
```nix
# User's configuration.nix
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

**目录插件** (无需 `pyproject.toml`):
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

请参阅 [Nix 设置指南](/getting-started/nix-setup#plugins) 以获取完整的文档，包括覆盖率使用和冲突检查。

## 常见错误

**处理程序未返回 JSON 字符串:**
```python
# 错误 — 返回一个字典
def handler(args, **kwargs):
    return {"result": 42}

# 正确 — 返回一个 JSON 字符串
def handler(args, **kwargs):
    return json.dumps({"result": 42})
```

**处理程序签名中缺少 `**kwargs`:**
```python
# 错误 — 如果 Hermes 传递了额外的上下文，则会出错
def handler(args):
    ...

# 正确
def handler(args, **kwargs):
    ...
```

**处理程序抛出异常:**
```python
# 错误 — 异常会传播，工具调用失败
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

**模式描述过于模糊:**
```python
# 不好 — 模型不知道何时使用它
"description": "做一些事情"

# 很好 — 模型确切地知道何时以及如何使用
"description": "评估数学表达式。用于算术、三角函数、对数。支持：+, -, *, /, **, sqrt, sin, cos, log, pi, e。"
```