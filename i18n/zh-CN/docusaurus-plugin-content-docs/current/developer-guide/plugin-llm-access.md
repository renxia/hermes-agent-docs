---
sidebar_position: 11
title: "插件 LLM 访问"
description: "通过 ctx.llm 在插件内部执行任意 LLM 调用 —— 聊天或结构化，同步或异步。宿主拥有认证，信任门默认关闭，可选 JSON Schema 验证。"
---

# 插件 LLM 访问

`ctx.llm` 是插件进行 LLM 调用的官方支持方式。
聊天补全、结构化提取、同步、异步、带图或不带图 —— 接口统一，信任门一致，凭证由宿主管理。

当插件需要执行涉及模型但又不属于智能体对话一部分的操作时，就会使用此方法。例如：将工具错误信息重写为非技术人员可读格式的钩子；在消息入队前进行翻译的网关适配器；对长段粘贴内容进行摘要的斜杠命令；对昨日活动进行评分并写入状态栏一行字的定时任务；以及决定某条消息是否值得唤醒智能体的前置过滤器。

这些都是智能体不应直接参与的后台任务。它们只需要一次 LLM 调用、一个类型化的回答，然后就完成了。

## 最小的调用示例

```python
result = ctx.llm.complete(messages=[{"role": "user", "content": "ping"}])
return result.text
```

这一行代码就构成了整个 API。无需密钥，无需供应商配置，无需 SDK 初始化。插件会基于用户当前使用的供应商和模型运行 —— 当用户切换供应商时，插件会自动跟随。

## 更完整的聊天示例

```python
result = ctx.llm.complete(
    messages=[
        {"role": "system", "content": "Rewrite errors as one short sentence a non-engineer can act on."},
        {"role": "user",   "content": traceback_text},
    ],
    max_tokens=64,
    purpose="hooks.error-rewrite",
)
return result.text
```

`purpose` 是一个自由格式的审计字符串 — 它会显示在 `agent.log` 以及 `result.audit` 中，这样运维人员就能看到是哪个插件发起了哪个调用。对于任何频繁触发的调用，它是可选但推荐的。

## 结构化输出

当插件需要一个类型化的答案时，请切换到结构化通道：

```python
result = ctx.llm.complete_structured(
    instructions="Score this support reply for urgency (0–1) and pick a category.",
    input=[{"type": "text", "text": message_body}],
    json_schema=TRIAGE_SCHEMA,
    purpose="support.triage",
    temperature=0.0,
    max_tokens=128,
)

if result.parsed["urgency"] > 0.8:
    await dispatch_to_oncall(result.parsed["category"], message_body)
```

主机向提供商请求 JSON 输出，作为备用方案在本地解析，如果安装了 `jsonschema`，则根据你的模式进行验证，并在 `result.parsed` 上返回一个 Python 对象。如果模型无法生成有效的 JSON，`result.parsed` 为 `None`，并且 `result.text` 保存原始响应。

## 此通道提供的能力

* **一次调用，四种形式。** `complete()` 用于聊天，`complete_structured()` 用于类型化 JSON，`acomplete()` 和 `acomplete_structured()` 用于 asyncio。相同的参数，相同的返回结果对象。
* **主机托管凭据。** OAuth 令牌、刷新流程、凭据池、按任务的辅助覆盖 — Hermes 已有的每个凭据概念都适用。插件永远看不到令牌；主机通过 `result.audit` 将调用归因回来。
* **有界。** 单次同步或异步调用。没有流式传输，没有工具循环，没有需要管理的会话状态。陈述输入，获得结果，返回。
* **失败即关闭的信任。** 一个你从未配置过的插件无法自行选择其提供商、模型、智能体或存储的凭据。默认姿态是"使用用户正在使用的"。运维人员通过 `config.yaml` 中的每个插件条目选择启用特定覆盖。

## 快速开始

下面两个完整的插件 — 一个聊天，一个结构化。它们都包含在一个 `register(ctx)` 函数中，并且无需任何外部配置即可针对用户当前激活的模型运行。

### 聊天补全 — `/tldr`

```python
def register(ctx):
    ctx.register_command(
        name="tldr",
        handler=lambda raw: _tldr(ctx, raw),
        description="Summarise the supplied text in one paragraph.",
        args_hint="<text>",
    )


def _tldr(ctx, raw_args: str) -> str:
    text = raw_args.strip()
    if not text:
        return "Usage: /tldr <text to summarise>"
    result = ctx.llm.complete(
        messages=[
            {"role": "system",
             "content": "Summarise the user's text in one tight paragraph. No preamble."},
            {"role": "user", "content": text},
        ],
        max_tokens=256,
        temperature=0.3,
        purpose="tldr",
    )
    return result.text
```

`result.text` 是模型的响应；`result.usage` 携带 token 计数；`result.provider` 和 `result.model` 携带归因信息。

### 结构化提取 — `/paste-to-tasks`

```python
def register(ctx):
    ctx.register_command(
        name="paste-to-tasks",
        handler=lambda raw: _paste_to_tasks(ctx, raw),
        description="Turn freeform meeting notes into structured tasks.",
        args_hint="<text>",
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
                    "due":    {"type": "string", "description": "ISO date or empty"},
                },
                "required": ["action"],
            },
        },
    },
    "required": ["tasks"],
}


def _paste_to_tasks(ctx, raw_args: str) -> str:
    if not raw_args.strip():
        return "Usage: /paste-to-tasks <meeting notes>"
    result = ctx.llm.complete_structured(
        instructions=(
            "Extract concrete action items from these meeting notes. "
            "One task per actionable line. If no owner is named, leave 'owner' blank."
        ),
        input=[{"type": "text", "text": raw_args}],
        json_schema=_TASKS_SCHEMA,
        schema_name="meeting.tasks",
        purpose="paste-to-tasks",
        temperature=0.0,
        max_tokens=512,
    )
    if result.parsed is None:
        return f"Couldn't parse a response. Raw output:\n{result.text}"
    lines = [f"- [{t.get('owner') or '?'}] {t['action']}" for t in result.parsed["tasks"]]
    return "\n".join(lines) or "(no tasks found)"
```

第三个示例，这次使用图像输入，位于 [`hermes-example-plugins`](https://github.com/NousResearch/hermes-example-plugins/tree/main/plugin-llm-example) 仓库（参考插件的伴生仓库 — 不与 hermes-agent 本身捆绑）。关于异步接口（`acomplete()` / `acomplete_structured()` 与 `asyncio.gather()`），请参阅同一仓库中的 [`plugin-llm-async-example`](https://github.com/NousResearch/hermes-example-plugins/tree/main/plugin-llm-async-example)。

## 何时使用哪个

| 你需要… | 选择 |
|---|---|
| 自由格式的文本响应（翻译、摘要、重写、生成） | `complete()` |
| 多轮提示（系统 + 少样本示例 + 用户） | `complete()` |
| 返回一个根据模式验证的类型化字典 | `complete_structured()` |
| 图像或文本输入，并返回一个类型化字典 | `complete_structured()` |
| 从异步代码发起相同的调用（网关适配器、异步钩子） | `acomplete()` / `acomplete_structured()` |

其他所有内容 — 提供商选择、模型解析、认证、回退、超时、视觉路由 — 在所有四种方法中都是相同的。

## API 接口

`ctx.llm` 是 `agent.plugin_llm.PluginLlm` 的一个实例。

### `complete()`

```python
result = ctx.llm.complete(
    messages=[{"role": "user", "content": "Hi"}],
    provider=None,         # 可选，受限制 — Hermes 提供商 ID（例如 "openrouter"）
    model=None,            # 可选，受限制 — 该提供商期望的任意字符串
    temperature=None,
    max_tokens=None,
    timeout=None,          # 秒
    agent_id=None,         # 可选，受限制
    profile=None,          # 可选，受限制 — 显式认证配置文件名称
    purpose="optional-audit-string",
)
# → PluginLlmCompleteResult(text, provider, model, agent_id, usage, audit)
```

普通的聊天补全。`messages` 是标准的 OpenAI 格式 — 一个 `{"role": "...", "content": "..."}` 字典列表。多轮提示（系统 + 少样本用户/助手对 + 最终用户）的工作方式与使用 OpenAI SDK 时完全相同。

`provider=` 和 `model=` 是独立的，并遵循与主机主配置相同的格式（`model.provider` + `model.model`）。仅设置 `model=` 以使用用户当前激活的提供商及其上的不同模型。同时设置两者可完全切换提供商。如果没有运维人员的启用，任一参数都会引发 `PluginLlmTrustError`。

### `complete_structured()`

```python
result = ctx.llm.complete_structured(
    instructions="What you want extracted.",
    input=[
        {"type": "text",  "text": "..."},
        {"type": "image", "data": b"...", "mime_type": "image/png"},
        {"type": "image", "url":  "https://..."},
    ],
    json_schema={...},     # 可选 — 触发解析后的结果 + 验证
    json_mode=False,       # 在没有模式的情况下设置为 True 以要求返回 JSON
    schema_name=None,      # 可选的人类可读模式名称
    system_prompt=None,
    provider=None,         # 可选，受限制
    model=None,            # 可选，受限制
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

输入是类型化的文本或图像块（原始字节会自动 base64 编码为 `data:` URL）。当提供了 `json_schema` 或 `json_mode=True` 时，主机通过 `response_format` 请求 JSON 输出，作为备用方案在本地解析，如果安装了 `jsonschema`，则根据你的模式进行验证。

* `result.content_type == "json"` — `result.parsed` 是一个符合你模式的 Python 对象。
* `result.content_type == "text"` — 解析或验证失败；检查 `result.text` 获取原始模型响应。

### 异步

```python
result = await ctx.llm.acomplete(messages=...)
result = await ctx.llm.acomplete_structured(instructions=..., input=...)
```

参数和返回类型与其同步对应方法相同。从网关适配器、异步钩子或任何已经在 asyncio 循环上运行的插件代码中使用这些方法。

### 结果属性

```python
@dataclass
class PluginLlmCompleteResult:
    text: str                    # 助手的响应
    provider: str                # 例如 "openrouter", "anthropic"
    model: str                   # 提供商为此调用返回的模型
    agent_id: str                # 使用了哪个智能体的模型/认证
    usage: PluginLlmUsage        # token + 缓存 + 成本估算
    audit: Dict[str, Any]        # plugin_id, purpose, profile

@dataclass
class PluginLlmStructuredResult(PluginLlmCompleteResult):
    parsed: Optional[Any]        # 当 content_type == "json" 时为 JSON 对象
    content_type: str            # "json" 或 "text"
    # audit 在提供时也携带 schema_name
```

`usage` 携带 `input_tokens`、`output_tokens`、`total_tokens`、`cache_read_tokens`、`cache_write_tokens`，以及当提供商返回这些字段时的 `cost_usd`。

## 信任关卡

默认行为是关闭失败模式。如果没有 `plugins.entries` 配置块，插件可以：

*   针对用户当前的提供商和模型运行四种方法中的任意一种，
*   设置请求塑造参数（`temperature`、`max_tokens`、`timeout`、`system_prompt`、`purpose`、`messages`、`instructions`、`input`、`json_schema`），

…仅此而已。在运营者选择启用之前，`provider=`、`model=`、`agent_id=` 和 `profile=` 参数会引发 `PluginLlmTrustError`。

**大多数插件永远不需要此部分。** 仅调用 `ctx.llm.complete(messages=...)` 而不进行任何覆盖的插件，会针对用户当前活动的提供商和模型运行，并且无需配置即可工作。下面的代码块仅在插件特别希望绑定到与用户不同的模型或提供商时才相关。

```yaml
plugins:
  entries:
    my-plugin:
      llm:
        # 允许此插件选择不同的 Hermes 提供商
        # （必须是 Hermes 已知的提供商之一 —— 与 `hermes model` 和 config.yaml 中的 model.provider 名称相同）。
        allow_provider_override: true

        # 可选地限制提供商。使用 ["*"] 表示任何。
        allowed_providers:
          - openrouter
          - anthropic

        # 允许此插件请求特定的模型。
        allow_model_override: true

        # 可选地限制模型。使用 ["*"] 表示任何。
        # 模型是按插件发送的字符串精确匹配的 —— Hermes 不会进行任何查找。
        allowed_models:
          - openai/gpt-4o-mini
          - anthropic/claude-3-5-haiku

        # 允许跨智能体调用（罕见）。
        allow_agent_id_override: false

        # 允许插件请求特定的已存储身份验证配置文件
        # （例如，同一提供商上的不同 OAuth 账户）。
        allow_profile_override: false
```

插件 id 是扁平插件的清单 `name:` 字段，或者是嵌套插件的路径派生键（`image_gen/openai`、`memory/honcho` 等）。

### 关卡强制执行的内容

| 覆盖项         | 默认值 | 配置键                           |
| -------------- | ------ | -------------------------------- |
| `provider=`    | 拒绝   | `allow_provider_override: true`  |
| ↳ 允许列表     | —      | `allowed_providers: [...]`       |
| `model=`       | 拒绝   | `allow_model_override: true`     |
| ↳ 允许列表     | —      | `allowed_models: [...]`          |
| `agent_id=`    | 拒绝   | `allow_agent_id_override: true`  |
| `profile=`     | 拒绝   | `allow_profile_override: true`   |

每个覆盖项都是独立控制的。授予 `allow_model_override` **不会**同时授予 `allow_provider_override` —— 一个被信任选择模型的插件仍然绑定到用户当前的提供商，除非它也获得了提供商关卡的授权。

### 关卡不需要强制执行的内容

*   请求塑造参数 —— `temperature`、`max_tokens`、`timeout`、`system_prompt`、`purpose`、`messages`、`instructions`、`input`、`json_schema`、`schema_name`、`json_mode` —— 总是允许的；它们不涉及凭证或路由的选择。
*   默认的拒绝策略意味着未配置的插件仍然可以执行有用的工作 —— 它只是针对当前活动的提供商和模型运行。运营者只需要为那些需要更精细路由的插件考虑 `plugins.entries`。

## 宿主负责的内容

以下是 `ctx.llm` 为插件处理的事项完整列表，因此您无需自行处理：

*   **提供商解析。** 从用户配置（或受信任时的显式覆盖）中读取 `model.provider` + `model.model`。
*   **身份验证。** 从 `~/.hermes/auth.json` / 环境变量中获取 API 密钥、OAuth 令牌或刷新令牌，包括配置了凭证池的情况。插件永远看不到它们。
*   **视觉路由。** 当提供了图像输入而用户当前的文本模型仅支持文本时，宿主会自动回退到已配置的视觉模型。
*   **回退链。** 如果用户的主提供商返回 5xx 或 429 错误，请求将通过 Hermes 通常的、具备聚合器感知能力的回退机制，然后才向插件返回错误。
*   **超时。** 遵守您的 `timeout=` 参数，如果未指定，则回退到 `auxiliary.<task>.timeout` 配置或全局辅助默认值。
*   **JSON 塑形。** 当您请求 JSON 时，向提供商发送 `response_format`，如果提供商返回了代码围栏格式的响应，则在本地重新解析。
*   **模式验证。** 当安装了 `jsonschema` 时，根据您的 `json_schema` 进行验证；否则记录调试日志并跳过严格验证。
*   **审计日志。** 每次调用都会在 `agent.log` 中写入一条 INFO 级别的记录，包含插件 id、提供商/模型、用途和令牌总计。

## 插件负责的内容

*   **请求结构。** 用于聊天的 `messages`，用于结构化请求的 `instructions` + `input`。插件构建提示词；宿主运行它。
*   **模式。** 您期望返回的任何结构。宿主不会为您推断它。
*   **错误处理。** `complete_structured()` 在输入为空或模式验证失败时引发 `ValueError`。当信任关卡拒绝覆盖时，会触发 `PluginLlmTrustError`。其他任何情况（提供商 5xx、未配置凭证、超时）会引发 `auxiliary_client.call_llm()` 所引发的任何错误。
*   **成本。** 每次调用都针对用户的付费提供商运行。不要不加思考地为每个网关消息循环调用 `complete()` 而不考虑令牌消耗。

## 这在插件接口中的位置

现有的 `ctx.*` 方法扩展了现有的 Hermes 子系统：

| `ctx.register_tool` | 添加智能体可以调用的工具 |
| `ctx.register_platform` | 连接新的网关适配器 |
| `ctx.register_image_gen_provider` | 替换图像生成后端 |
| `ctx.register_memory_provider` | 替换记忆后端 |
| `ctx.register_context_engine` | 替换上下文压缩器 |
| `ctx.register_hook` | 观察生命周期事件 |

`ctx.llm` 是第一个让插件能够*带外*运行与用户正在交谈的相同模型的接口，无需上述任何操作。这是它唯一的工作。如果您的插件需要注册一个智能体调用的工具，请使用 `register_tool`。如果它需要响应生命周期事件，请使用 `register_hook`。如果它需要进行自己的模型调用——无论出于何种原因，结构化与否——请使用 `ctx.llm`。

## 参考

*   实现：[`agent/plugin_llm.py`](https://github.com/NousResearch/hermes-agent/blob/main/agent/plugin_llm.py)
*   测试：[`tests/agent/test_plugin_llm.py`](https://github.com/NousResearch/hermes-agent/blob/main/tests/agent/test_plugin_llm.py)
*   参考插件（配套仓库）：
    *   [`plugin-llm-example`](https://github.com/NousResearch/hermes-example-plugins/tree/main/plugin-llm-example) —— 带图像输入的同步结构化提取
    *   [`plugin-llm-async-example`](https://github.com/NousResearch/hermes-example-plugins/tree/main/plugin-llm-async-example) —— 使用 `asyncio.gather()` 的异步示例
*   辅助客户端（底层引擎）：参见 [提供商运行时](/docs/developer-guide/provider-runtime)。