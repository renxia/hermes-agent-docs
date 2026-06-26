---
sidebar_position: 10
title: "Model Provider Plugins"
description: "How to build a model provider (inference backend) plugin for Hermes Agent"
---

# 构建模型提供者插件

模型提供者插件声明一个推理后端——一个 OpenAI 兼容端点、一个 Anthropic Messages 服务器、一个 Codex 风格的 Responses API，或一个 Bedrock 原生接口——Hermes 可以通过它将 `AIAgent` 调用进行路由。每个内置提供者（OpenRouter、Anthropic、GMI、DeepSeek、Nvidia ……）都以这些插件之一的形态发布。第三方可以通过在 `$HERMES_HOME/plugins/model-providers/` 下放置一个目录来添加自己的插件，无需对仓库做任何更改。

:::tip
模型提供者插件是第三类**提供者插件**。其他两类是[记忆提供者插件](/developer-guide/memory_provider-plugin)（跨会话知识）和[上下文引擎插件](/developer-guide/context-engine-plugin)（上下文压缩策略）。这三者都遵循相同的"放置目录、声明配置文件、无需编辑仓库"模式。
:::

## 发现机制如何运作

`providers/__init__.py._discover_providers()` 在任意代码首次调用 `get_provider_profile()` 或 `list_providers()` 时惰性执行。发现顺序如下：

1. **内置插件** — `<repo>/plugins/model-providers/<name>/` — 随 Hermes 一起发布
2. **用户插件** — `$HERMES_HOME/plugins/model-providers/<name>/` — 放入任意目录；后续会话无需重启即可生效
3. **遗留单文件** — `<repo>/providers/<name>.py` — 为树外可编辑安装保留的向后兼容方式

**用户插件会覆盖同名的内置插件**，因为 `register_provider()` 采用最后写入者优先策略。放置一个 `$HERMES_HOME/plugins/model-providers/gmi/` 目录即可替换内置的 GMI 配置文件，无需触碰仓库。

## 目录结构

```
plugins/model-providers/my-provider/
├── __init__.py       # 在模块级别调用 register_provider(profile)
├── plugin.yaml       # kind: model-provider + 元数据（可选但推荐）
└── README.md         # 设置说明（可选）
```

唯一必需的文件是 `__init__.py`。`plugin.yaml` 被 `hermes plugins` 用于内省，也被通用 PluginManager 用于将插件路由到正确的加载器；如果没有它，通用加载器会回退到源文本启发式方法。

## 最小示例 — 简单的 API-key 提供者

```python
# plugins/model-providers/acme-inference/__init__.py
from providers import register_provider
from providers.base import ProviderProfile

acme = ProviderProfile(
    name="acme-inference",
    aliases=("acme",),
    display_name="Acme Inference",
    description="Acme — 兼容 OpenAI 的直接 API",
    signup_url="https://acme.example.com/keys",
    env_vars=("ACME_API_KEY", "ACME_BASE_URL"),
    base_url="https://api.acme.example.com/v1",
    auth_type="api_key",
    default_aux_model="acme-small-fast",
    fallback_models=(
        "acme-large-v3",
        "acme-medium-v3",
        "acme-small-fast",
    ),
)

register_provider(acme)
```

```yaml
# plugins/model-providers/acme-inference/plugin.yaml
name: acme-inference
kind: model-provider
version: 1.0.0
description: Acme Inference — 兼容 OpenAI 的直接 API
author: Your Name
```

就是这样。放入这两个文件后，以下**自动接线**无需任何其他编辑：

| 集成 | 位置 | 获取内容 |
|---|---|---|
| 凭证解析 | `hermes_cli/auth.py` | 从 profile 填充 `PROVIDER_REGISTRY["acme-inference"]` |
| `--provider` CLI 标志 | `hermes_cli/main.py` | 接受 `acme-inference` |
| `hermes model` 选择器 | `hermes_cli/models.py` | 出现在 `CANONICAL_PROVIDERS` 中，模型列表从 `{base_url}/models` 获取 |
| `hermes doctor` | `hermes_cli/doctor.py` | 对 `ACME_API_KEY` + `{base_url}/models` 进行健康检查 |
| `hermes setup` | `hermes_cli/config.py` | `ACME_API_KEY` 出现在 `OPTIONAL_ENV_VARS` 和设置向导中 |
| URL 反向映射 | `agent/model_metadata.py` | 主机名 → 提供者名称，用于自动检测 |
| 辅助模型 | `agent/auxiliary_client.py` | 使用 `default_aux_model` 进行压缩/摘要 |
| 运行时解析 | `hermes_cli/runtime_provider.py` | 返回正确的 `base_url`、`api_key`、`api_mode` |
| 传输层 | `agent/transports/chat_completions.py` | Profile 路径通过 `prepare_messages` / `build_extra_body` / `build_api_kwargs_extras` 生成 kwargs |

## ProviderProfile 字段

完整定义见 `providers/base.py`。最常用的字段：

| 字段 | 类型 | 用途 |
|---|---|---|
| `name` | str | 规范 id — 匹配 `config.yaml` 中的 `model.provider` 和 `--provider` 标志 |
| `aliases` | `tuple[str, ...]` | 由 `get_provider_profile()` 解析的替代名称（如 `grok` → `xai`） |
| `api_mode` | str | `chat_completions` \| `codex_responses` \| `anthropic_messages` \| `bedrock_converse` |
| `display_name` | str | 在 `hermes model` 选择器中显示的人工标签 |
| `description` | str | 选择器副标题 |
| `signup_url` | str | 首次运行时显示（"在此获取 API 密钥"） |
| `env_vars` | `tuple[str, ...]` | 按优先级排列的 API 密钥环境变量；最后的 `*_BASE_URL` 条目用作用户 base-URL 覆盖 |
| `base_url` | str | 默认推理端点 |
| `models_url` | str | 显式目录 URL（回退到 `{base_url}/models`） |
| `auth_type` | str | `api_key` \| `oauth_device_code` \| `oauth_external` \| `copilot` \| `aws_sdk` \| `external_process` |
| `fallback_models` | `tuple[str, ...]` | 实时目录获取失败时显示的精选列表 |
| `default_headers` | `dict[str, str]` | 随每个请求发送（如 Copilot 的 `Editor-Version`） |
| `fixed_temperature` | Any | `None` = 使用调用方的值；`OMIT_TEMPERATURE` 哨兵 = 完全不发送 temperature（Kimi） |
| `default_max_tokens` | `int \| None` | 提供者级别的 max_tokens 上限（Nvidia: 16384） |
| `default_aux_model` | str | 用于辅助任务（压缩、视觉、摘要）的廉价模型 |

## 可重写的钩子

对于非平凡的特殊情况，可子类化 `ProviderProfile`：

```python
from typing import Any
from providers.base import ProviderProfile

class AcmeProfile(ProviderProfile):
    def prepare_messages(self, messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """提供者特定的消息预处理。在 codex 清理之后、
        开发者角色交换之前运行。默认：直接透传。"""
        # 示例：Qwen 将纯文本内容标准化为 parts 数组
        # 并注入 cache_control；Kimi 重写 tool-call JSON
        return messages

    def build_extra_body(self, *, session_id=None, **context) -> dict:
        """提供者特定的 extra_body 字段，合并到 API 调用中。
        上下文包括：session_id, provider_preferences, model, base_url,
        reasoning_config。默认：空字典。"""
        # 示例：OpenRouter 的 provider-preferences 块，
        # Gemini 的 thinking_config 翻译。
        return {}

    def build_api_kwargs_extras(self, *, reasoning_config=None, **context):
        """返回 (extra_body_additions, top_level_kwargs)。当某些字段
        需要放在顶层（Kimi 的 reasoning_effort，OpenRouter 的 adaptive
        Anthropic 模型的 verbosity）而某些需要放在 extra_body 中
        （OpenRouter 的 reasoning 字典）时使用。默认：({}, {})。"""
        return {}, {}

    def fetch_models(self, *, api_key=None, timeout=8.0) -> list[str] | None:
        """实时目录获取。默认使用 Bearer 认证访问
        {models_url 或 base_url}/models。重写以支持：自定义认证
        （Anthropic）、无 REST 端点（Bedrock → None）、
        公开/未认证目录（OpenRouter）。"""
        return super().fetch_models(api_key=api_key, timeout=timeout)
```

## 钩子参考示例

查看这些内置插件以了解惯用写法：

| 插件 | 查看原因 |
|---|---|
| `plugins/model-providers/openrouter/` | 带有 provider preferences 的聚合器，公开模型目录 |
| `plugins/model-providers/gemini/` | `thinking_config` 翻译（原生 + OpenAI 兼容嵌套形式） |
| `plugins/model-providers/kimi-coding/` | `OMIT_TEMPERATURE`、`extra_body.thinking`、顶层 `reasoning_effort` |
| `plugins/model-providers/qwen-oauth/` | 消息标准化、`cache_control` 注入、VL 高分辨率 |
| `plugins/model-providers/nous/` | 归属标签、"禁用时省略推理" |
| `plugins/model-providers/custom/` | Ollama `num_ctx` + `think: false` 特殊情况 |
| `plugins/model-providers/bedrock/` | `api_mode="bedrock_converse"`，`fetch_models` 返回 None（无 REST 端点） |

## 用户覆盖 — 无需编辑仓库即可替换内置提供者

假设你想将 `gmi` 指向你的私有测试环境端点。创建 `~/.hermes/plugins/model-providers/gmi/__init__.py`：

```python
from providers import register_provider
from providers.base import ProviderProfile

register_provider(ProviderProfile(
    name="gmi",
    aliases=("gmi-cloud", "gmicloud"),
    env_vars=("GMI_API_KEY",),
    base_url="https://gmi-staging.internal.example.com/v1",
    auth_type="api_key",
    default_aux_model="google/gemini-3.1-flash-lite-preview",
))
```

下次会话时，`get_provider_profile("gmi").base_url` 将返回测试环境 URL。无需仓库补丁，无需重新构建。因为用户插件在内置插件之后被发现，用户的 `register_provider()` 调用优先生效。

## api_mode 选择

识别四种值。Hermes 根据以下条件选择：

1. 用户显式覆盖（设置时 `config.yaml` 中的 `model.api_mode`）
2. OpenCode 的每模型分发（Zen 和 Go 的 `opencode_model_api_mode`）
3. URL 自动检测 — `/anthropic` 后缀 → `anthropic_messages`，`api.openai.com` → `codex_responses`，`api.x.ai` → `codex_responses`，Kimi 域名上的 `/coding` → `chat_completions`
4. 当 URL 检测无结果时，**Profile 的 `api_mode`** 作为回退
5. 默认 `chat_completions`

将 `profile.api_mode` 设置为你提供者默认使用的值 — 它充当提示。用户的 URL 覆盖仍然优先。

## 认证类型

| `auth_type` | 含义 | 使用者 |
|---|---|---|
| `api_key` | 单个环境变量携带静态 API 密钥 | 大多数提供者 |
| `oauth_device_code` | 设备码 OAuth 流程 | — |
| `oauth_external` | 用户在别处登录，令牌存入 `auth.json` | Anthropic OAuth、MiniMax OAuth、Qwen Portal、Nous Portal |
| `copilot` | GitHub Copilot 令牌刷新周期 | 仅 `copilot` 插件 |
| `aws_sdk` | AWS SDK 凭证链（IAM 角色、profile、环境） | 仅 `bedrock` 插件 |
| `external_process` | 认证由智能体生成的子进程处理 | 仅 `copilot-acp` 插件 |

`auth_type` 决定了哪些代码路径将你的提供者视为"简单的 API-key 提供者" — 如果它不是 `api_key`，PluginManager 仍会记录清单，但 Hermes 的 CLI 级别自动化（doctor 检查、`--provider` 标志、设置向导委托）可能会跳过它。

## 发现时机

提供者发现是**惰性**的 — 由进程中第一次 `get_provider_profile()` 或 `list_providers()` 调用触发。实际上这在启动早期就会发生（`auth.py` 模块加载时会急切地扩展 `PROVIDER_REGISTRY`）。如果你需要验证你的插件是否已加载，运行：

```bash
hermes doctor
```

— 一个成功的 `auth_type="api_key"` profile 将出现在提供者连接性部分，带有 `/models` 探测。

对于编程式检查：

```python
from providers import list_providers
for p in list_providers():
    print(p.name, p.base_url, p.api_mode)
```

## 测试你的插件

将 `HERMES_HOME` 指向临时目录，这样不会污染你的真实配置：

```bash
export HERMES_HOME=/tmp/hermes-plugin-test
mkdir -p $HERMES_HOME/plugins/model-providers/my-provider
cat > $HERMES_HOME/plugins/model-providers/my-provider/__init__.py <<'EOF'
from providers import register_provider
from providers.base import ProviderProfile
register_provider(ProviderProfile(
    name="my-provider",
    env_vars=("MY_API_KEY",),
    base_url="https://api.my-provider.example.com/v1",
    auth_type="api_key",
))
EOF

export MY_API_KEY=your-test-key
hermes -z "hello" --provider my-provider -m some-model
```

## 通用 PluginManager 集成

通用 `PluginManager`（`hermes plugins` 操作的对象）**能看到** model-provider 插件但不会导入它们 — `providers/__init__.py` 拥有它们的生命周期。管理器记录清单用于内省，并按 `kind: model-provider` 分类。当你将一个未标记的用户插件放入 `$HERMES_HOME/plugins/` 中，而该插件恰好使用 `ProviderProfile` 调用 `register_provider` 时，管理器会通过源文本启发式方法自动将其强制转换为 `kind: model-provider` — 因此即使没有 `plugin.yaml`，插件仍然能正确路由。

## 通过 pip 分发

与任何 Hermes 插件一样，模型提供者可以作为 pip 包发布。在你的 `pyproject.toml` 中添加一个入口点：

```toml
[project.entry-points."hermes_agent.plugins"]
acme-inference = "acme_hermes_plugin:register"
```

……其中 `acme_hermes_plugin:register` 是一个调用 `register_provider(profile)` 的函数。通用的 PluginManager 会在 `discover_and_load()` 期间自动发现入口点插件。对于 `kind: model-provider` pip 插件，你仍需要在清单中声明该类型（或依赖源文本启发式规则）。

完整的入口点配置请参阅[构建 Hermes 插件](/guides/build-a-hermes-plugin#distribute-via-pip)。

## 相关页面

- [提供者运行时](/developer-guide/provider-runtime) — 解析优先级 + 各层读取配置的位置
- [添加提供者](/developer-guide/adding-providers) — 新推理后端的端到端检查清单（涵盖快速插件路径和完整的 CLI/认证集成）
- [记忆提供者插件](/developer-guide/memory-provider-plugin)
- [上下文引擎插件](/developer-guide/context-engine-plugin)
- [构建 Hermes 插件](/guides/build-a-hermes-plugin) — 通用插件编写指南