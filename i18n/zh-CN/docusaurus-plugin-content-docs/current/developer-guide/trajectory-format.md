# 轨迹格式

Hermes Agent 将对话轨迹以 ShareGPT 兼容的 JSONL 格式保存，用于作为训练数据、调试工件和强化学习数据集。

源文件：`agent/trajectory.py`，`run_agent.py` (搜索 `_save_trajectory`)，`batch_runner.py`


## 文件命名约定

轨迹写入当前工作目录下的文件：

| 文件 | 写入时机 |
|------|------|
| `trajectory_samples.jsonl` | 成功完成的对话（`completed=True`） |
| `failed_trajectories.jsonl` | 失败或中断的对话（`completed=False`） |

批处理运行器（`batch_runner.py`）会为每个批次写入自定义输出文件（例如，`batch_001_output.jsonl`），并包含额外的元数据字段。

您可以通过 `save_trajectory()` 中的 `filename` 参数覆盖文件名。


## JSONL 条目格式

文件中的每一行都是一个自包含的 JSON 对象。有两种变体：

### CLI/交互式格式（来自 `_save_trajectory`）

```json
{
  "conversations": [ ... ],
  "timestamp": "2026-03-30T14:22:31.456789",
  "model": "anthropic/claude-sonnet-4.6",
  "completed": true
}
```

### 批处理运行器格式（来自 `batch_runner.py`）

```json
{
  "prompt_index": 42,
  "conversations": [ ... ],
  "metadata": { "prompt_source": "gsm8k", "difficulty": "hard" },
  "completed": true,
  "partial": false,
  "api_calls": 7,
  "toolsets_used": ["code_tools", "file_tools"],
  "tool_stats": {
    "terminal": {"count": 3, "success": 3, "failure": 0},
    "read_file": {"count": 2, "success": 2, "failure": 0},
    "write_file": {"count": 0, "success": 0, "failure": 0}
  },
  "tool_error_counts": {
    "terminal": 0,
    "read_file": 0,
    "write_file": 0
  }
}
```

`tool_stats` 和 `tool_error_counts` 字典被标准化，以包含所有可能的工具（来自 `model_tools.TOOL_TO_TOOLSET_MAP`），并使用零作为默认值，确保在 HuggingFace 数据集加载时，所有条目具有一致的模式（schema）。


## 对话数组（ShareGPT 格式）

`conversations` 数组使用 ShareGPT 的角色约定：

| API 角色 | ShareGPT `from` |
|----------|-----------------|
| system | `"system"` |
| user | `"human"` |
| assistant | `"gpt"` |
| tool | `"tool"` |

### 完整示例

```json
{
  "conversations": [
    {
      "from": "system",
      "value": "你是一个函数调用 AI 模型。你会在 <tools> </tools> XML 标签内获得函数签名。你可以调用一个或多个函数来协助处理用户查询。如果可用的工具与协助用户查询不相关，只需用自然对话语言回复即可。不要对要填入函数的值做假设。在调用并执行函数后，你将在 <tool_response> </tool_response> XML 标签内获得函数结果。可用的工具如下：\n<tools>\n[{\"name\": \"terminal\", \"description\": \"执行 shell 命令\", \"parameters\": {\"type\": \"object\", \"properties\": {\"command\": {\"type\": \"string\"}}}, \"required\": null}]\n</tools>\n对于每次函数调用，返回一个 JSON 对象，并使用以下 pydantic 模型 JSON 模式：\n{'title': 'FunctionCall', 'type': 'object', 'properties': {'name': {'title': 'Name', 'type': 'string'}, 'arguments': {'title': 'Arguments', 'type': 'object'}}, 'required': ['name', 'arguments']}\n每次函数调用都应包含在 <tool_call> </tool_call> XML 标签内。\n示例：\n<tool_call>\n{'name': <function-name>,'arguments': <args-dict>}\n</tool_call>"
    },
    {
      "from": "human",
      "value": "安装了什么 Python 版本？"
    },
    {
      "from": "gpt",
      "value": "<think>\n用户想知道 Python 版本。我应该运行 python3 --version。\n</think>\n<tool_call>\n{\"name\": \"terminal\", \"arguments\": {\"command\": \"python3 --version\"}}\n</tool_call>"
    },
    {
      "from": "tool",
      "value": "<tool_response>\n{\"tool_call_id\": \"call_abc123\", \"name\": \"terminal\", \"content\": \"Python 3.11.6\"}\n</tool_response>"
    },
    {
      "from": "gpt",
      "value": "<think>\n获取到版本信息。我现在可以回答用户了。\n</think>\n该系统安装了 Python 3.11.6。"
    }
  ],
  "timestamp": "2026-03-30T14:22:31.456789",
  "model": "anthropic/claude-sonnet-4.6",
  "completed": true
}
```


## 标准化规则

### 推理内容标记（Reasoning Content Markup）

轨迹转换器将所有推理内容标准化为 `<think>` 标签，无论模型最初是如何生成的：

1. **原生思考令牌**（来自 Anthropic、OpenAI o-series 等提供商的 `msg["reasoning"]` 字段）：作为 `<think>\n{reasoning}\n</think>\n` 包装，并加在内容之前。

2. **REASONING_SCRATCHPAD XML**（当原生思考被禁用，模型通过系统提示指令的 XML 进行推理时）：`<REASONING_SCRATCHPAD>` 标签通过 `convert_scratchpad_to_think()` 转换为 `<think>`。

3. **空思考块**：每个 `gpt` 回复都保证包含一个 `<think>` 块。如果未生成任何推理内容，则插入一个空块：`<think>\n</think>\n` — 这确保了训练数据的格式一致性。

### 工具调用标准化（Tool Call Normalization）

来自 API 格式的工具调用（包含 `tool_call_id`、函数名、作为 JSON 字符串的参数）被转换为 XML 包装的 JSON：

```
<tool_call>
{"name": "terminal", "arguments": {"command": "ls -la"}}
</tool_call>
```

- 参数从 JSON 字符串解析回对象（不进行双重编码）
- 如果 JSON 解析失败（不应该发生——在对话过程中已验证），则使用空 `{}` 并记录警告
- 一个助手的回复中包含多个工具调用，将在单个 `gpt` 消息中产生多个 `<tool_call>` 块

### 工具响应标准化（Tool Response Normalization）

所有跟在助手消息之后的工具结果都会被分组到一个包含 XML 包装 JSON 响应的单个 `tool` 回复中：

```
<tool_response>
{"tool_call_id": "call_abc123", "name": "terminal", "content": "此处输出"}
</tool_response>
```

- 如果工具内容看起来像 JSON（以 `{` 或 `[` 开头），则将其解析，使得 `content` 字段包含一个 JSON 对象/数组，而不是字符串
- 多个工具结果会用换行符连接在一个消息中
- 工具名称是根据位置与父级助手的 `tool_calls` 数组匹配的

### 系统消息（System Message）

系统消息在保存时生成（不从对话中获取）。它遵循 Hermes 函数调用提示模板，包含：

- 解释函数调用协议的前言
- 包含 JSON 工具定义的 `<tools>` XML 块
- `FunctionCall` 对象的模式参考
- `<tool_call>` 示例

工具定义包括 `name`、`description`、`parameters` 和 `required`（设置为 `null` 以匹配规范格式）。


## 加载轨迹（Loading Trajectories）

轨迹是标准的 JSONL — 使用任何 JSON-lines 读取器加载：

```python
import json

def load_trajectories(path: str):
    """从 JSONL 文件加载轨迹条目。"""
    entries = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                entries.append(json.loads(line))
    return entries

# 仅筛选成功的完成记录
successful = [e for e in load_trajectories("trajectory_samples.jsonl")
              if e.get("completed")]

# 提取用于训练的对话数据
training_data = [e["conversations"] for e in successful]
```

### 为 HuggingFace 数据集加载

```python
from datasets import load_dataset

ds = load_dataset("json", data_files="trajectory_samples.jsonl")
```

标准化的 `tool_stats` 模式确保所有条目具有相同的列，从而防止在数据集加载过程中出现 Arrow 模式不匹配错误。


## 控制轨迹保存（Controlling Trajectory Saving）

在 CLI 中，轨迹保存由以下内容控制：

```yaml
# config.yaml
agent:
  save_trajectories: true  # default: false
```

或者通过 `--save-trajectories` 标志。当 agent 初始化时设置 `save_trajectories=True`，`_save_trajectory()` 方法将在每个对话回合结束时被调用。

批处理运行器总是保存轨迹（这是它的主要目的）。

如果所有回合的推理内容均为零，批处理运行器会自动丢弃这些样本，以避免用非推理示例污染训练数据。