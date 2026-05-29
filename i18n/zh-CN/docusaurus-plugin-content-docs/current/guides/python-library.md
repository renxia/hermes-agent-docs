---
sidebar_position: 5
title: "将 Hermes 用作 Python 库"
description: "将 AIAgent 智能体嵌入您自己的 Python 脚本、Web 应用或自动化流程中 — 无需命令行界面"
---

# 将 Hermes 用作 Python 库

Hermes 不仅仅是一个命令行工具。您可以直接导入 `AIAgent`，并在自己的 Python 脚本、Web 应用或自动化流程中以编程方式使用它。本指南将向您展示如何操作。

---

## 安装

从仓库直接安装 Hermes：

```bash
pip install git+https://github.com/NousResearch/hermes-agent.git
```

或使用 [uv](https://docs.astral.sh/uv/)：

```bash
uv pip install git+https://github.com/NousResearch/hermes-agent.git
```

您也可以将其固定在 `requirements.txt` 文件中：

```text
hermes-agent @ git+https://github.com/NousResearch/hermes-agent.git
```

:::tip
将 Hermes 用作库时，需要使用与命令行界面相同的环境变量。至少需要设置 `OPENROUTER_API_KEY`（如果使用直连提供商，则设置 `OPENAI_API_KEY` 或 `ANTHROPIC_API_KEY`）。
:::

---

## 基本用法

使用 Hermes 最简单的方法是 `chat()` 方法 — 传递一条消息，返回一个字符串：

```python
from run_agent import AIAgent

agent = AIAgent(
    model="anthropic/claude-sonnet-4.6",
    quiet_mode=True,
)
response = agent.chat("法国的首都是什么？")
print(response)
```

`chat()` 内部处理完整的对话循环 — 工具调用、重试、一切 — 并仅返回最终的文本响应。

:::warning
将 Hermes 嵌入您自己的代码时，请务必设置 `quiet_mode=True`。否则，智能体会打印 CLI 加载动画、进度指示器和其他终端输出，这会扰乱您应用程序的输出。
:::

---

## 完全对话控制

要对对话进行更多控制，可以直接使用 `run_conversation()`。它返回一个包含完整响应、消息历史记录和元数据的字典：

```python
agent = AIAgent(
    model="anthropic/claude-sonnet-4.6",
    quiet_mode=True,
)

result = agent.run_conversation(
    user_message="搜索最近的 Python 3.13 特性",
    task_id="my-task-1",
)

print(result["final_response"])
print(f"消息交换数: {len(result['messages'])}")
```

返回的字典包含：
- **`final_response`** — 智能体的最终文本回复
- **`messages`** — 完整的消息历史记录（系统、用户、助手、工具调用）

（您传入的 `task_id` 会存储在智能体实例上以用于虚拟机隔离，但不会在返回字典中回显。）

您还可以传递一个自定义系统消息，为该次调用覆盖临时系统提示：

```python
result = agent.run_conversation(
    user_message="解释快速排序",
    system_message="您是一位计算机科学导师。请使用简单的类比。",
)
```

---

## 配置工具

使用 `enabled_toolsets` 或 `disabled_toolsets` 控制智能体可以访问哪些工具集：

```python
# 仅启用网络工具（浏览、搜索）
agent = AIAgent(
    model="anthropic/claude-sonnet-4.6",
    enabled_toolsets=["web"],
    quiet_mode=True,
)

# 启用除终端访问之外的所有功能
agent = AIAgent(
    model="anthropic/claude-sonnet-4.6",
    disabled_toolsets=["terminal"],
    quiet_mode=True,
)
```

:::tip
当您想要一个最小化、受限制的智能体（例如，仅用于网络搜索的研究机器人）时，请使用 `enabled_toolsets`。当您想要大多数功能但需要限制特定功能（例如，在共享环境中禁止终端访问）时，请使用 `disabled_toolsets`。
:::

---

## 多轮对话

通过传回消息历史记录来维持跨多轮对话的状态：

```python
agent = AIAgent(
    model="anthropic/claude-sonnet-4.6",
    quiet_mode=True,
)

# 第一轮对话
result1 = agent.run_conversation("我的名字是爱丽丝")
history = result1["messages"]

# 第二轮对话 — 智能体记得上下文
result2 = agent.run_conversation(
    "我叫什么名字？",
    conversation_history=history,
)
print(result2["final_response"])  # "您叫爱丽丝。"
```

`conversation_history` 参数接受来自先前结果的 `messages` 列表。智能体在内部会复制它，因此您的原始列表永远不会被修改。

---

## 保存轨迹

启用轨迹保存功能，以 ShareGPT 格式捕获对话 — 这对生成训练数据或调试很有用：

```python
agent = AIAgent(
    model="anthropic/claude-sonnet-4.6",
    save_trajectories=True,
    quiet_mode=True,
)

agent.chat("写一个 Python 函数来排序列表")
# 以 ShareGPT 格式保存到 trajectory_samples.jsonl
```

每段对话都作为一个单独的 JSONL 行追加，使得从自动化运行中收集数据集变得容易。

---

## 自定义系统提示

使用 `ephemeral_system_prompt` 设置一个自定义系统提示来引导智能体的行为，但该提示**不会**保存到轨迹文件中（保持您的训练数据干净）：

```python
agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    ephemeral_system_prompt="您是一位 SQL 专家。仅回答数据库问题。",
    quiet_mode=True,
)

response = agent.chat("我如何编写 JOIN 查询？")
print(response)
```

这对于构建专用智能体非常理想 — 代码审查员、文档编写员、SQL 助手 — 全部使用相同的底层工具。

---

## 批量处理

为了并行运行多个提示，Hermes 包含 `batch_runner.py`。它管理具有适当资源隔离的并发 `AIAgent` 实例：

```bash
python batch_runner.py --input prompts.jsonl --output results.jsonl
```

每个提示都有自己的 `task_id` 和隔离环境。如果您需要自定义批处理逻辑，可以直接使用 `AIAgent` 来构建：

```python
import concurrent.futures
from run_agent import AIAgent

prompts = [
    "解释递归",
    "什么是哈希表？",
    "垃圾回收是如何工作的？",
]

def process_prompt(prompt):
    # 为任务创建一个新的智能体实例以确保线程安全
    agent = AIAgent(
        model="anthropic/claude-sonnet-4",
        quiet_mode=True,
        skip_memory=True,
    )
    return agent.chat(prompt)

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    results = list(executor.map(process_prompt, prompts))

for prompt, result in zip(prompts, results):
    print(f"问: {prompt}\n答: {result}\n")
```

:::warning
务必为每个线程或任务创建一个**新的 `AIAgent` 实例**。智能体维护内部状态（对话历史、工具会话、迭代计数器），这些状态在线程间共享并不安全。
:::

---

## 集成示例

### FastAPI 端点

```python
from fastapi import FastAPI
from pydantic import BaseModel
from run_agent import AIAgent

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    model: str = "anthropic/claude-sonnet-4"

@app.post("/chat")
async def chat(request: ChatRequest):
    agent = AIAgent(
        model=request.model,
        quiet_mode=True,
        skip_context_files=True,
        skip_memory=True,
    )
    response = agent.chat(request.message)
    return {"response": response}
```

### Discord 机器人

```python
import discord
from run_agent import AIAgent

client = discord.Client(intents=discord.Intents.default())

@client.event
async def on_message(message):
    if message.author == client.user:
        return
    if message.content.startswith("!hermes "):
        query = message.content[8:]
        agent = AIAgent(
            model="anthropic/claude-sonnet-4",
            quiet_mode=True,
            skip_context_files=True,
            skip_memory=True,
            platform="discord",
        )
        response = agent.chat(query)
        await message.channel.send(response[:2000])

client.run("YOUR_DISCORD_TOKEN")
```

### CI/CD 流水线步骤

```python
#!/usr/bin/env python3
"""CI 步骤：自动审查 PR 差异。"""
import subprocess
from run_agent import AIAgent

diff = subprocess.check_output(["git", "diff", "main...HEAD"]).decode()

agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    quiet_mode=True,
    skip_context_files=True,
    skip_memory=True,
    disabled_toolsets=["terminal", "browser"],
)

review = agent.chat(
    f"审查此 PR 差异，检查错误、安全问题和风格问题:\n\n{diff}"
)
print(review)
```

---

## 关键构造器参数

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `model` | `str` | `""` | OpenRouter 格式的模型（默认为空；运行时从您的 hermes 配置解析） |
| `quiet_mode` | `bool` | `False` | 抑制 CLI 输出 |
| `enabled_toolsets` | `List[str]` | `None` | 白名单指定工具集 |
| `disabled_toolsets` | `List[str]` | `None` | 黑名单指定工具集 |
| `save_trajectories` | `bool` | `False` | 将对话保存为 JSONL |
| `ephemeral_system_prompt` | `str` | `None` | 自定义系统提示（不保存到轨迹） |
| `max_iterations` | `int` | `90` | 每次对话最大工具调用迭代次数 |
| `skip_context_files` | `bool` | `False` | 跳过加载 AGENTS.md 文件 |
| `skip_memory` | `bool` | `False` | 禁用持久化内存读写 |
| `api_key` | `str` | `None` | API 密钥（回退到环境变量） |
| `base_url` | `str` | `None` | 自定义 API 端点 URL |
| `platform` | `str` | `None` | 平台提示（`"discord"`, `"telegram"` 等） |

---

## 重要注意事项

:::tip
- 如果您不希望工作目录中的 `AGENTS.md` 文件加载到系统提示中，请设置 **`skip_context_files=True`**。
- 设置 **`skip_memory=True`** 以防止智能体读写持久化内存 — 对于无状态 API 端点建议这样做。
- `platform` 参数（例如，`"discord"`, `"telegram"`）会注入特定于平台的格式提示，使智能体能够调整其输出风格。
:::

:::warning
- **线程安全**：为每个线程或任务创建一个 `AIAgent`。切勿在并发调用间共享实例。
- **资源清理**：当对话结束时，智能体会自动清理资源（终端会话、浏览器实例）。如果您在长期进程中运行，请确保每个对话正常完成。
- **迭代限制**：默认的 `max_iterations=90` 很充足。对于简单的问答用例，考虑降低它（例如，`max_iterations=10`），以防止失控的工具调用循环并控制成本。
:::