---
sidebar_position: 5
title: "将 Hermes 作为 Python 库使用"
description: "将 AIAgent 嵌入到您自己的 Python 脚本、Web 应用或自动化流程中——无需 CLI"
---

# 将 Hermes 作为 Python 库使用

Hermes 不仅仅是一个 CLI 工具。您可以直接导入 `AIAgent` 并将其在您自己的 Python 脚本、Web 应用程序或自动化流程中进行编程使用。本指南将向您展示如何操作。

---

## 安装

直接从仓库安装 Hermes：

```bash
pip install git+https://github.com/NousResearch/hermes-agent.git
```

或者使用 [uv](https://docs.astral.sh/uv/)：

```bash
uv pip install git+https://github.com/NousResearch/hermes-agent.git
```

您也可以将其固定在 `requirements.txt` 中：

```text
hermes-agent @ git+https://github.com/NousResearch/hermes-agent.git
```

:::tip
使用 Hermes 作为库时，需要与 CLI 使用相同的环境变量。最少需要设置 `OPENROUTER_API_KEY`（如果使用直接提供商访问，则为 `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`）。
:::

---

## 基本用法

使用 Hermes 最简单的方法是 `chat()` 方法——传入消息，返回一个字符串：

```python
from run_agent import AIAgent

agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    quiet_mode=True,
)
response = agent.chat("法国的首都是哪里？")
print(response)
```

`chat()` 内部处理完整的对话循环——工具调用、重试、所有内容——并只返回最终的文本响应。

:::warning
在代码中嵌入 Hermes 时，务必设置 `quiet_mode=True`。否则，代理会打印 CLI 旋转器、进度指示器和其他终端输出，这会使您的应用程序输出混乱。
:::

---

## 完全对话控制

如需对对话进行更精细的控制，请直接使用 `run_conversation()`。它返回一个包含完整响应、消息历史记录和元数据的字典：

```python
agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    quiet_mode=True,
)

result = agent.run_conversation(
    user_message="搜索最近的 Python 3.13 特性",
    task_id="my-task-1",
)

print(result["final_response"])
print(f"交换的消息数量: {len(result['messages'])}")
```

返回的字典包含：
- **`final_response`** — 代理的最终文本回复
- **`messages`** — 完整的消息历史记录（系统、用户、助手、工具调用）
- **`task_id`** — 用于 VM 隔离的任务标识符

您还可以传入自定义的系统消息，该消息将覆盖该调用的临时系统提示：

```python
result = agent.run_conversation(
    user_message="解释快速排序",
    system_message="你是一名计算机科学导师。请使用简单的类比。",
)
```

---

## 配置工具

使用 `enabled_toolsets` 或 `disabled_toolsets` 控制代理可以访问哪些工具集：

```python
# 仅启用网络工具（浏览、搜索）
agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    enabled_toolsets=["web"],
    quiet_mode=True,
)

# 启用所有工具，但禁用终端访问
agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    disabled_toolsets=["terminal"],
    quiet_mode=True,
)
```

:::tip
当您需要一个最小化、锁定化的代理时（例如，仅用于研究机器人的网络搜索），请使用 `enabled_toolsets`。当您需要大部分功能但需要限制特定功能时（例如，在共享环境中禁用终端访问），请使用 `disabled_toolsets`。
:::

---

## 多轮对话

通过在后续调用中传递消息历史记录来维护多轮对话状态：

```python
agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    quiet_mode=True,
)

# 第一轮
result1 = agent.run_conversation("我的名字是 Alice")
history = result1["messages"]

# 第二轮 — 代理记住上下文
result2 = agent.run_conversation(
    "我的名字是什么？",
    conversation_history=history,
)
print(result2["final_response"])  # "您的名字是 Alice。"
```

`conversation_history` 参数接受前一个结果中的 `messages` 列表。代理会在内部复制它，因此您的原始列表永远不会被修改。

---

## 保存轨迹

启用轨迹保存功能，以 ShareGPT 格式捕获对话记录——这对于生成训练数据或调试非常有用：

```python
agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    save_trajectories=True,
    quiet_mode=True,
)

agent.chat("写一个用于排序列表的 Python 函数")
# 以 ShareGPT 格式保存到 trajectory_samples.jsonl
```

每次对话都会作为单行 JSONL 追加，这使得从自动化运行中收集数据集变得很容易。

---

## 自定义系统提示

使用 `ephemeral_system_prompt` 设置自定义系统提示，它指导代理的行为，但**不会**保存到轨迹文件中（保持您的训练数据干净）：

```python
agent = AIAgent(
    model="anthropic/claude-sonnet-4",
    ephemeral_system_prompt="你是一名 SQL 专家。只回答数据库问题。",
    quiet_mode=True,
)

response = agent.chat("我如何编写一个 JOIN 查询？")
print(response)
```

这非常适合构建专业化的代理——代码审查员、文档撰写员、SQL 助手——它们都使用相同的底层工具集。

---

## 批量处理

对于并行运行多个提示，Hermes 包含 `batch_runner.py`。它管理具有适当资源隔离的并发 `AIAgent` 实例：

```bash
python batch_runner.py --input prompts.jsonl --output results.jsonl
```

每个提示都会获得自己的 `task_id` 和隔离环境。如果您需要自定义批量逻辑，可以使用 `AIAgent` 直接构建：

```python
import concurrent.futures
from run_agent import AIAgent

prompts = [
    "解释递归",
    "什么是哈希表？",
    "垃圾回收是如何工作的？",
]

def process_prompt(prompt):
    # 为每个任务创建一个新的代理以确保线程安全
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
始终为每个线程或任务创建一个**新的 `AIAgent` 实例**。该代理维护内部状态（对话历史、工具会话、迭代计数器），这些状态不能在并发调用中共享。
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

### CI/CD 管道步骤

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
    f"请审查此 PR 差异，查找错误、安全问题和风格问题：\n\n{diff}"
)
print(review)
```

---

## 关键构造函数参数

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `model` | `str` | `"anthropic/claude-opus-4.6"` | OpenRouter 格式的模型名称 |
| `quiet_mode` | `bool` | `False` | 抑制 CLI 输出 |
| `enabled_toolsets` | `List[str]` | `None` | 白名单指定的工具集 |
| `disabled_toolsets` | `List[str]` | `None` | 黑名单指定的工具集 |
| `save_trajectories` | `bool` | `False` | 将对话保存到 JSONL 文件 |
| `ephemeral_system_prompt` | `str` | `None` | 自定义系统提示（不保存到轨迹文件） |
| `max_iterations` | `int` | `90` | 每个对话的最大工具调用迭代次数 |
| `skip_context_files` | `bool` | `False` | 是否跳过加载 AGENTS.md 文件 |
| `skip_memory` | `bool` | `False` | 是否禁用持久化内存读写 |
| `api_key` | `str` | `None` | API 密钥（回退到环境变量） |
| `base_url` | `str` | `None` | 自定义 API 端点 URL |
| `platform` | `str` | `None` | 平台提示（例如 `"discord"`、`"telegram"` 等） |

---

## 重要注意事项

:::tip
- 如果您不希望工作目录中的 `AGENTS.md` 文件被加载到系统提示中，请设置 **`skip_context_files=True`**。
- 设置 **`skip_memory=True`** 可以防止代理读取或写入持久化内存——这对于无状态的 API 端点是推荐的做法。
- `platform` 参数（例如 `"discord"`、`"telegram"`）注入了特定平台的格式提示，使代理能够调整其输出风格。
:::

:::warning
- **线程安全**: 为每个线程或任务创建一个 `AIAgent`。切勿在并发调用中共享一个实例。
- **资源清理**: 当对话结束时，代理会自动清理资源（终端会话、浏览器实例）。如果您在一个长期运行的进程中运行，请确保每个对话都能正常完成。
- **迭代限制**: 默认的 `max_iterations=90` 是比较宽松的。对于简单的问答用例，考虑将其降低（例如，`max_iterations=10`），以防止工具调用循环失控并控制成本。
:::