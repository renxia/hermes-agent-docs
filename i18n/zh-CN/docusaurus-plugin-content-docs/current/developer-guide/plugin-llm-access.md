---
sidebar_position: 11
title: "插件大语言模型访问"
description: "通过 ctx.llm 在插件内运行任何大语言模型调用——对话或结构化、同步或异步。宿主控制认证、默认关闭的信任门控、可选的 JSON Schema 验证。"
---

# 插件大语言模型访问

`ctx.llm` 是插件调用大语言模型的推荐方式。
无论是聊天补全、结构化信息提取、同步还是异步，无论是否包含图像——接口一致、信任门控相同、凭证由宿主管理。

当插件需要执行涉及模型、但不属于智能体对话一部分的操作时，就会使用此功能。例如：一个将工具错误信息改写为非技术人员可读内容的钩子；一个在消息入队前进行翻译的网关适配器；一个用于摘要长文本粘贴的斜杠命令；一个对昨日活动进行评分并写入状态板一行记录的定时任务；或者一个判断消息是否值得唤醒智能体处理的预过滤器。

这些都是智能体无需介入的作业。它们只需要一次大语言模型调用、一个类型化的结果，然后就完成。

## 最简调用示例

```python
result = ctx.llm.complete(messages=[{"role": "user", "content": "ping"}])
return result.text
```

这就是整个 API 的一行调用。无需密钥、无需配置提供商、无需初始化 SDK。插件运行于用户当前使用的提供商和模型之上——当用户切换提供商时，插件会自动跟随。

## 一个更完整的聊天示例

```python
result = ctx.llm.complete(
    messages=[
        {"role": "system", "content": "将错误重写为一个非工程师也能采取行动的简短句子。"},
        {"role": "user",   "content": traceback_text},
    ],
    max_tokens=64,
    purpose="hooks.error-rewrite",
)
return result.text
```

`purpose` 是一个自由格式的审计字符串——它会出现在 `agent.log` 和 `result.audit` 中，这样运维人员就可以看到哪个插件发起了哪个调用。对于经常触发的操作，虽然可选但推荐使用。

## 结构化输出

当插件需要类型化的答案时，切换到结构化通道：

```python
result = ctx.llm.complete_structured(
    instructions="对此支持回复进行紧急度评分（0-1）并选择一个类别。",
    input=[{"type": "text", "text": message_body}],
    json_schema=TRIAGE_SCHEMA,
    purpose="support.triage",
    temperature=0.0,
    max_tokens=128,
)

if result.parsed["urgency"] > 0.8:
    await dispatch_to_oncall(result.parsed["category"], message_body)
```

宿主向提供者请求 JSON 输出，本地解析作为备用方案，如果安装了 `jsonschema` 则根据你的模式进行验证，并在 `result.parsed` 上返回一个 Python 对象。如果模型无法生成有效的 JSON，`result.parsed` 将为 `None`，而 `result.text` 则携带原始响应。

## 此通道为你提供什么

* **一次调用，四种形态。** `complete()` 用于聊天，`complete_structured()` 用于类型化 JSON，`acomplete()` 和 `acomplete_structured()` 用于 asyncio。相同的参数，相同的结果对象。
* **宿主拥有凭据。** OAuth 令牌、刷新流程、凭据池、每个任务的辅助覆盖——Hermes 已有的每个凭据概念都适用。插件永远看不到令牌；宿主通过 `result.audit` 将调用归属回去。
* **有界。** 单次同步或异步调用。没有流式传输，没有工具循环，没有需要管理的对话状态。声明输入，获取结果，返回。
* **失败即关闭的信任。** 一个你从未配置过的插件不能自行选择其提供者、模型、智能体或存储的凭据。默认姿态是“使用用户正在使用的。”运维人员在 `config.yaml` 中为每个插件选择加入特定的覆盖。

## 快速入门

下面是两个完整的插件——一个聊天，一个结构化。它们都在一个 `register(ctx)` 函数中发布，并且无需任何外部配置即可针对用户当前活动的模型运行。

### 聊天补全 — `/tldr`

```python
def register(ctx):
    ctx.register_command(
        name="tldr",
        handler=lambda raw: _tldr(ctx, raw),
        description="将提供的文本总结为一个段落。",
        args_hint="<文本>",
    )


def _tldr(ctx, raw_args: str) -> str:
    text = raw_args.strip()
    if not text:
        return "用法: /tldr <要总结的文本>"
    result = ctx.llm.complete(
        messages=[
            {"role": "system",
             "content": "将用户的文本总结为一个紧凑的段落。无需开场白。"},
            {"role": "user", "content": text},
        ],
        max_tokens=256,
        temperature=0.3,
        purpose="tldr",
    )
    return result.text
```

`result.text` 是模型的响应；`result.usage` 携带 token 计数；`result.provider` 和 `result.model` 携带归属信息。

### 结构化提取 — `/paste-to-tasks`

```python
def register(ctx):
    ctx.register_command(
        name="paste-to-tasks",
        handler=lambda raw: _paste_to_tasks(ctx, raw),
        description="将自由格式的会议记录转化为结构化的任务。",
        args_hint="<文本>",
    )


_TASKS_SCHEMA = {
    "type": "object",
    "properties": {
        "tasks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "owner":  {"type": "string"},
                    "action": {"type": "string"},
                    "due":    {"type": "string", "description": "ISO日期或留空"},
                },
                "required": ["action"],
            },
        },
    },
    "required": ["tasks"],
}


def _paste_to_tasks(ctx, raw_args: str) -> str:
    if not raw_args.strip():
        return "用法: /paste-to-tasks <会议记录>"
    result = ctx.llm.complete_structured(
        instructions=(
            "从这些会议记录中提取具体的行动项。"
            "每个可操作的行对应一个任务。如果未指定负责人，则将 'owner' 留空。"
        ),
        input=[{"type": "text", "text": raw_args}],
        json_schema=_TASKS_SCHEMA,
        schema_name="meeting.tasks",
        purpose="paste-to-tasks",
        temperature=0.0,
        max_tokens=512,
    )
    if result.parsed is None:
        return f"无法解析响应。原始输出：\n{result.text}"
    lines = [f"- [{t.get('owner') or '?'}] {t['action']}" for t in result.parsed["tasks"]]
    return "\n".join(lines) or "(未找到任务)"
```

第三个实际例子（这次包含图像输入）位于 [`hermes-example-plugins`](https://github.com/NousResearch/hermes-example-plugins/tree/main/plugin-llm-example) 仓库（参考插件的伴生仓库——未与 hermes-agent 本身捆绑）。关于异步接口（使用 `acomplete()` / `acomplete_structured()` 配合 `asyncio.gather()`），请参阅同一仓库中的 [`plugin-llm-async-example`](https://github.com/NousResearch/hermes-example-plugins/tree/main/plugin-llm-async-example)。

## 何时使用哪个

| 你想要… | 使用 |
|---|---|
| 自由格式的文本响应（翻译、总结、重写、生成） | `complete()` |
| 多轮提示（系统 + 少样本示例 + 用户） | `complete()` |
| 返回一个根据模式验证过的类型化字典 | `complete_structured()` |
| 图像或文本输入，并返回一个类型化字典 | `complete_structured()` |
| 从异步代码中发起相同的调用（网关适配器、异步钩子） | `acomplete()` / `acomplete_structured()` |

其他所有内容——提供者选择、模型解析、身份验证、回退、超时、视觉路由——在所有四个函数中都是相同的。

## API 接口

`ctx.llm` 是 `agent.plugin_llm.PluginLlm` 的一个实例。

### `complete()`

```python
result = ctx.llm.complete(
    messages=[{"role": "user", "content": "你好"}],
    provider=None,         # 可选，受控 — Hermes 提供者 ID（例如 "openrouter"）
    model=None,            # 可选，受控 — 该提供者期望的任何字符串
    temperature=None,
    max_tokens=None,
    timeout=None,          # 秒
    agent_id=None,         # 可选，受控
    profile=None,          # 可选，受控 — 显式的身份验证配置文件名称
    purpose="optional-audit-string",
)
# → PluginLlmCompleteResult(text, provider, model, agent_id, usage, audit)
```

普通的聊天补全。`messages` 是标准的 OpenAI 格式——一个包含 `{"role": "...", "content": "..."}` 字典的列表。多轮提示（系统 + 少样本用户/助手对 + 最终用户）的工作方式与使用 OpenAI SDK 完全相同。

`provider=` 和 `model=` 是独立的，并且遵循与宿主主配置（`model.provider` + `model.model`）相同的格式。只设置 `model=` 可以在用户当前活动的提供者上使用不同的模型。两者都设置则完全切换提供者。任何一个参数未经运维人员选择加入都会引发 `PluginLlmTrustError`。

### `complete_structured()`

```python
result = ctx.llm.complete_structured(
    instructions="你想要提取的内容。",
    input=[
        {"type": "text",  "text": "..."},
        {"type": "image", "data": b"...", "mime_type": "image/png"},
        {"type": "image", "url":  "https://..."},
    ],
    json_schema={...},     # 可选 — 触发解析结果 + 验证
    json_mode=False,       # 如果没有模式，设置为 True 以请求 JSON 输出
    schema_name=None,      # 可选，人类可读的模式名称
    system_prompt=None,
    provider=None,         # 可选，受控
    model=None,            # 可选，受控
    temperature=None,
    max_tokens=None,
    timeout=None,
    agent_id=None,
    profile=None,
    purpose=None,
)
# → PluginLlmStructuredResult(text, provider, model, agent_id,
#                             usage, parsed, content_type, audit)
```

输入是类型化的文本或图像块（原始字节会自动编码为 base64 的 `data:` URL）。当提供了 `json_schema` 或 `json_mode=True` 时，宿主通过 `response_format` 请求 JSON 输出，本地解析作为备用方案，如果安装了 `jsonschema` 则根据你的模式进行验证。

* `result.content_type == "json"` — `result.parsed` 是一个与你的模式匹配的 Python 对象。
* `result.content_type == "text"` — 解析或验证失败；检查 `result.text` 获取原始模型响应。

### 异步

```python
result = await ctx.llm.acomplete(messages=...)
result = await ctx.llm.acomplete_structured(instructions=..., input=...)
```

参数和结果类型与其同步对应函数相同。从网关适配器、异步钩子或任何已经在 asyncio 循环上运行的插件代码中使用这些。

### 结果属性

```python
@dataclass
class PluginLlmCompleteResult:
    text: str                    # 助手的响应
    provider: str                # 例如 "openrouter", "anthropic"
    model: str                   # 提供者为此次调用返回的内容
    agent_id: str                # 使用了哪个智能体的模型/身份验证
    usage: PluginLlmUsage        # 令牌 + 缓存 + 成本估算
    audit: Dict[str, Any]        # plugin_id, purpose, profile

@dataclass
class PluginLlmStructuredResult(PluginLlmCompleteResult):
    parsed: Optional[Any]        # 当 content_type == "json" 时为 JSON 对象
    content_type: str            # "json" 或 "text"
    # audit 也在提供时携带 schema_name
```

当提供者返回这些字段时，`usage` 携带 `input_tokens`、`output_tokens`、`total_tokens`、`cache_read_tokens`、`cache_write_tokens` 和 `cost_usd`。

## 信任门控

默认行为是失败即关闭。在没有 `plugins.entries` 配置块的情况下，插件可以：

*   针对用户当前活动的提供者和模型，运行四种方法中的任意一种，
*   设置请求塑形参数（`temperature`、`max_tokens`、`timeout`、`system_prompt`、`purpose`、`messages`、`instructions`、`input`、`json_schema`），

…仅此而已。`provider=`、`model=`、`agent_id=` 和 `profile=` 参数会引发 `PluginLlmTrustError`，直到操作员选择启用。

**大多数插件永远不需要这个配置块。** 一个仅调用 `ctx.llm.complete(messages=...)` 且不进行任何覆盖的插件，会针对用户当前活动的配置运行，无需任何配置。下面的代码块仅当一个插件特别希望绑定到与用户不同的模型或提供者时才相关。

```yaml
plugins:
  entries:
    my-plugin:
      llm:
        # 允许此插件选择一个不同的 Hermes 提供者
        # （必须是 Hermes 已知的提供者 —— 名称与 `hermes model` 和 config.yaml 中的 model.provider 相同）。
        allow_provider_override: true

        # 可选地限制允许的提供者。使用 ["*"] 表示任何。
        allowed_providers:
          - openrouter
          - anthropic

        # 允许此插件请求特定的模型。
        allow_model_override: true

        # 可选地限制允许的模型。使用 ["*"] 表示任何。
        # 模型按照插件发送的任何字符串进行字面匹配 —— Hermes 不会进行任何查找。
        allowed_models:
          - openai/gpt-4o-mini
          - anthropic/claude-3-5-haiku

        # 允许跨智能体调用（罕见）。
        allow_agent_id_override: false

        # 允许插件请求特定的已存储认证配置
        # （例如，同一提供者上的不同 OAuth 账户）。
        allow_profile_override: false
```

插件ID是扁平插件的清单 `name:` 字段，或是嵌套插件（`image_gen/openai`、`memory/honcho` 等）的路径派生键。

### 门控强制执行的内容

| 覆盖项          | 默认状态 | 配置键                           |
| --------------- | -------- | -------------------------------- |
| `provider=`     | 拒绝     | `allow_provider_override: true`  |
| ↳ 允许列表      | —        | `allowed_providers: [...]`       |
| `model=`        | 拒绝     | `allow_model_override: true`     |
| ↳ 允许列表      | —        | `allowed_models: [...]`          |
| `agent_id=`     | 拒绝     | `allow_agent_id_override: true`  |
| `profile=`      | 拒绝     | `allow_profile_override: true`   |

每个覆盖项都是独立门控的。授予 `allow_model_override` **不会** 同时授予 `allow_provider_override` —— 一个被信任可以选择模型的插件，除非也获得了提供者门控，否则仍然绑定于用户当前活动的提供者。

### 门控不需要强制执行的内容

*   请求塑形参数 —— `temperature`、`max_tokens`、`timeout`、`system_prompt`、`purpose`、`messages`、`instructions`、`input`、`json_schema`、`schema_name`、`json_mode` —— 始终允许；它们不选择凭证或路由。
*   默认拒绝的态势意味着一个未配置的插件仍然可以完成有用的工作 —— 它只是针对当前活动的提供者和模型运行。操作员仅对那些需要更精细路由的插件，才需要考虑 `plugins.entries`。

## 宿主负责的事项

以下是 `ctx.llm` 为您处理的完整事项列表，您无需关心：

*   **提供者解析。** 从用户的配置中读取 `model.provider` 和 `model.model`（或在受信任时使用显式覆盖）。
*   **认证。** 从 `~/.hermes/auth.json` / 环境变量中拉取 API 密钥、OAuth 令牌或刷新令牌，包括在配置了凭证池时的池化凭证。插件永远看不到它们。
*   **视觉路由。** 当提供图像输入且用户的活动文本模型仅为纯文本时，宿主会自动回退到已配置的视觉模型。
*   **回退链。** 如果用户的主提供者返回 5xx 或 429 错误，请求会经过 Hermes 通常的聚合器感知回退机制，然后才向插件返回错误。
*   **超时。** 尊重您的 `timeout=` 参数，回退到 `auxiliary.<task>.timeout` 配置或全局辅助默认值。
*   **JSON 塑形。** 当您请求 JSON 时，向提供者发送 `response_format`，如果提供者返回代码围栏的响应，则从本地重新解析。
*   **Schema 验证。** 当安装了 `jsonschema` 时，会根据您的 `json_schema` 进行验证；否则记录一行调试日志并跳过严格验证。
*   **审计日志。** 每次调用都会向 `agent.log` 写入一条 INFO 级别日志，包含插件ID、提供者/模型、用途和令牌总数。

## 插件负责的事项

*   **请求形状。** 对于聊天是 `messages`，对于结构化请求是 `instructions` + `input`。插件构建提示；宿主运行它。
*   **Schema。** 您希望返回的任何形状。宿主不会为您推断。
*   **错误处理。** `complete_structured()` 在输入为空和 schema 验证失败时引发 `ValueError`。当信任门控拒绝覆盖时，会触发 `PluginLlmTrustError`。其他情况（提供者 5xx、未配置凭证、超时）会引发 `auxiliary_client.call_llm()` 引发的任何异常。
*   **成本。** 每次调用都针对用户的付费提供者运行。不要不考虑令牌花费就对每条网关消息循环调用 `complete()`。

## 这在插件体系中的位置

现有的 `ctx.*` 方法扩展了现有的 Hermes 子系统：

| `ctx.register_tool` | 添加智能体可以调用的工具 |
| `ctx.register_platform` | 接入新的网关适配器 |
| `ctx.register_image_gen_provider` | 替换图像生成后端 |
| `ctx.register_memory_provider` | 替换记忆后端 |
| `ctx.register_context_engine` | 替换上下文压缩器 |
| `ctx.register_hook` | 观察生命周期事件 |

`ctx.llm` 是第一个允许插件在不依赖上述任何方法的情况下，*在带外*运行与用户交谈的相同模型的接口。这是它唯一的工作。如果您的插件需要注册一个智能体调用的工具，请使用 `register_tool`。如果它需要响应生命周期事件，请使用 `register_hook`。如果它需要进行自己的模型调用 —— 无论出于何种原因，结构化与否 —— 请使用 `ctx.llm`。

## 参考

*   实现：[`agent/plugin_llm.py`](https://github.com/NousResearch/hermes-agent/blob/main/agent/plugin_llm.py)
*   测试：[`tests/agent/test_plugin_llm.py`](https://github.com/NousResearch/hermes-agent/blob/main/tests/agent/test_plugin_llm.py)
*   参考插件（配套仓库）：
    *   [`plugin-llm-example`](https://github.com/NousResearch/hermes-example-plugins/tree/main/plugin-llm-example) —— 带图像输入的同步结构化提取
    *   [`plugin-llm-async-example`](https://github.com/NousResearch/hermes-example-plugins/tree/main/plugin-llm-async-example) —— 使用 `asyncio.gather()` 的异步示例
*   辅助客户端（底层引擎）：参见 [提供者运行时](/developer-guide/provider-runtime)。