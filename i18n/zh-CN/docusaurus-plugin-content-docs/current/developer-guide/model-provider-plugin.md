---
sidebar_position: 10
title: "模型提供商插件"
description: "如何为 Hermes Agent 构建一个模型提供商（推理后端）插件"
---

# 构建模型提供商插件

模型提供商插件声明一个推理后端 —— 一个 OpenAI 兼容端点、一个 Anthropic Messages 服务器、一个 Codex 风格的 Responses API，或一个原生 Bedrock 接口 —— Hermes 可以通过该后端路由 `智能体` 调用。每个内置提供商（OpenRouter、Anthropic、GMI、DeepSeek、Nvidia……）都以这些插件之一的形式发布。第三方可以通过在 `$HERMES_HOME/plugins/model-providers/` 目录下放置一个目录来添加自己的提供商，而无需对代码仓库进行任何更改。

:::tip
模型提供商插件是**提供商插件**的第三种类型。其他两种是[记忆提供商插件](/docs/developer-guide/memory-provider-plugin)（跨会话知识）和[上下文引擎插件](/docs/developer-guide/context-engine-plugin)（上下文压缩策略）。这三种插件都遵循相同的“放置一个目录，声明一个配置文件，无需修改仓库”的模式。
:::

## 发现机制如何工作

`providers/__init__.py._discover_providers()` 会在任何代码首次调用 `get_provider_profile()` 或 `list_providers()` 时延迟执行。发现顺序如下：

1. **捆绑插件** — `<repo>/plugins/model-providers/<name>/` — 随 Hermes 一起发布
2. **用户插件** — `$HERMES_HOME/plugins/model-providers/<name>/` — 可放置在任何目录；后续会话无需重启
3. **旧式单文件** — `<repo>/providers/<name>.py` — 用于树外可编辑安装的向后兼容

**用户插件会覆盖同名的捆绑插件**，因为 `register_provider()` 采用“最后写入者获胜”的策略。放置一个 `$HERMES_HOME/plugins/model-providers/gmi/` 目录即可替换内置的 GMI 配置文件，而无需触及代码仓库。

## 目录结构

```
plugins/model-providers/my-provider/
├── __init__.py       # 在模块级别调用 register_provider(profile)
├── plugin.yaml       # kind: model-provider + 元数据（可选但推荐）
└── README.md         # 设置说明（可选）
```

唯一必需的文件是 `__init__.py`。`plugin.yaml` 由 `hermes plugins` 用于内省，并由通用插件管理器（PluginManager）将插件路由到正确的加载器；没有该文件时，通用加载器会回退到基于源码文本的启发式规则。

## 最小示例 — 一个简单的 API 密钥提供者

```python
# plugins/model-providers/acme-inference/__init__.py
from providers import register_provider
from providers.base import ProviderProfile

acme = ProviderProfile(
    name="acme-inference",
    aliases=("acme",),
    display_name="Acme Inference",
    description="Acme — OpenAI 兼容直连 API",
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
description: Acme Inference — OpenAI 兼容直连 API
author: 你的名字
```

就这些。只需放入这两个文件，即可实现以下**自动装配**，无需其他修改：

| 集成点 | 位置 | 获取内容 |
|---|---|---|
| 凭据解析 | `hermes_cli/auth.py` | 从 profile 填充 `PROVIDER_REGISTRY["acme-inference"]` |
| `--provider` CLI 标志 | `hermes_cli/main.py` | 接受 `acme-inference` |
| `hermes model` 选择器 | `hermes_cli/models.py` | 出现在 `CANONICAL_PROVIDERS` 中，模型列表从 `{base_url}/models` 获取 |
| `hermes doctor` | `hermes_cli/doctor.py` | 对 `ACME_API_KEY` + `{base_url}/models` 探测进行健康检查 |
| `hermes setup` | `hermes_cli/config.py` | `ACME_API_KEY` 出现在 `OPTIONAL_ENV_VARS` 和设置向导中 |
| URL 反向映射 | `agent/model_metadata.py` | 主机名 → 提供者名称（用于自动检测） |
| 辅助模型 | `agent/auxiliary_client.py` | 使用 `default_aux_model` 进行压缩/摘要 |
| 运行时解析 | `hermes_cli/runtime_provider.py` | 返回正确的 `base_url`、`api_key`、`api_mode` |
| 传输层 | `agent/transports/chat_completions.py` | Profile 路径通过 `prepare_messages` / `build_extra_body` / `build_api_kwargs_extras` 生成 kwargs |

## ProviderProfile 字段

完整定义见 `providers/base.py`。最常用的字段如下：

| 字段 | 类型 | 用途 |
|---|---|---|
| `name` | str | 规范 ID — 匹配 `--provider` 选项和 `HERMES_INFERENCE_PROVIDER` |
| `aliases` | `tuple[str, ...]` | 由 `get_provider_profile()` 解析的别名（例如 `grok` → `xai`） |
| `api_mode` | str | `chat_completions` \| `codex_responses` \| `anthropic_messages` \| `bedrock_converse` |
| `display_name` | str | 在 `hermes model` 选择器中显示的人类可读标签 |
| `description` | str | 选择器副标题 |
| `signup_url` | str | 首次运行设置时显示（“在此获取 API 密钥”） |
| `env_vars` | `tuple[str, ...]` | 按优先级排列的 API 密钥环境变量；最后的 `*_BASE_URL` 条目用作用户自定义 base URL 覆盖 |
| `base_url` | str | 默认推理端点 |
| `models_url` | str | 显式模型目录 URL（回退到 `{base_url}/models`） |
| `auth_type` | str | `api_key` \| `oauth_device_code` \| `oauth_external` \| `copilot` \| `aws_sdk` \| `external_process` |
| `fallback_models` | `tuple[str, ...]` | 当实时目录获取失败时显示的精选列表 |
| `default_headers` | `dict[str, str]` | 每次请求都发送（例如 Copilot 的 `Editor-Version`） |
| `fixed_temperature` | Any | `None` = 使用调用方值；`OMIT_TEMPERATURE` 哨兵值 = 完全不发送温度参数（Kimi） |
| `default_max_tokens` | `int \| None` | 提供者级别的最大 token 限制（Nvidia: 16384） |
| `default_aux_model` | str | 用于辅助任务（压缩、视觉、摘要）的廉价模型 |

## 可重写的钩子

对于非平凡的特殊行为，请继承 `ProviderProfile`：

```python
from typing import Any
from providers.base import ProviderProfile

class AcmeProfile(ProviderProfile):
    def prepare_messages(self, messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """提供者特定的消息预处理。在 codex 清理之后、开发者角色交换之前运行。默认：透传。"""
        # 示例：Qwen 将纯文本内容归一化为 parts 数组并注入 cache_control；Kimi 重写工具调用 JSON
        return messages

    def build_extra_body(self, *, session_id=None, **context) -> dict:
        """提供者特定的 extra_body 字段，合并到 API 调用中。
        上下文包括：session_id、provider_preferences、model、base_url、reasoning_config。默认：空字典。"""
        # 示例：OpenRouter 的 provider-preferences 块，Gemini 的 thinking_config 转换。
        return {}

    def build_api_kwargs_extras(self, *, reasoning_config=None, **context):
        """返回 (extra_body_additions, top_level_kwargs)。当某些字段需置于顶层（Kimi 的 reasoning_effort）
        而另一些置于 extra_body（OpenRouter 的 reasoning 字典）时需要此方法。默认：({}, {})。"""
        return {}, {}

    def fetch_models(self, *, api_key=None, timeout=8.0) -> list[str] | None:
        """实时目录获取。默认使用 Bearer 认证访问 {models_url or base_url}/models。
        可重写用于：自定义认证（Anthropic）、无 REST 端点（Bedrock → None）或公开/无需认证的目录（OpenRouter）。"""
        return super().fetch_models(api_key=api_key, timeout=timeout)
```

## 钩子参考示例

查看这些内置插件以了解惯用法：

| 插件 | 为何参考 |
|---|---|
| `plugins/model-providers/openrouter/` | 聚合器，含提供者偏好、公开模型目录 |
| `plugins/model-providers/gemini/` | `thinking_config` 转换（原生 + OpenAI 兼容嵌套形式） |
| `plugins/model-providers/kimi-coding/` | `OMIT_TEMPERATURE`、`extra_body.thinking`、顶层 `reasoning_effort` |
| `plugins/model-providers/qwen-oauth/` | 消息归一化、`cache_control` 注入、VL 高分辨率 |
| `plugins/model-providers/nous/` | 归属标签、“禁用时省略推理” |
| `plugins/model-providers/custom/` | Ollama 的 `num_ctx` + `think: false` 特殊行为 |
| `plugins/model-providers/bedrock/` | `api_mode="bedrock_converse"`，`fetch_models` 返回 None（无 REST 端点） |

## 用户覆盖 — 不编辑仓库即可替换内置提供者

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

下一次会话中，`get_provider_profile("gmi").base_url` 将返回测试环境 URL。无需打补丁，无需重新构建。因为用户插件在内置插件之后被发现，所以用户的 `register_provider()` 调用会胜出。

## api_mode 选择

支持四种值。Hermes 根据以下顺序选择：

1. 用户显式覆盖（`config.yaml` 中的 `model.api_mode`，若已设置）
2. OpenCode 的每模型调度（Zen 和 Go 的 `opencode_model_api_mode`）
3. URL 自动检测 — `/anthropic` 后缀 → `anthropic_messages`，`api.openai.com` → `codex_responses`，`api.x.ai` → `codex_responses`，Kimi 域名上的 `/coding` → `chat_completions`
4. **Profile 的 `api_mode`** — 当 URL 检测无结果时作为后备
5. 默认 `chat_completions`

将 `profile.api_mode` 设置为与你的提供者默认提供的模式匹配 — 它充当提示。用户的 URL 覆盖仍然优先。

## 认证类型

| `auth_type` | 含义 | 使用者 |
|---|---|---|
| `api_key` | 单个环境变量携带静态 API 密钥 | 大多数提供者 |
| `oauth_device_code` | 设备码 OAuth 流程 | — |
| `oauth_external` | 用户在其他地方登录，令牌存入 `auth.json` | Anthropic OAuth、MiniMax OAuth、Gemini Cloud Code、Qwen Portal、Nous Portal |
| `copilot` | GitHub Copilot 令牌刷新周期 | 仅 `copilot` 插件 |
| `aws_sdk` | AWS SDK 凭据链（IAM 角色、profile、env） | 仅 `bedrock` 插件 |
| `external_process` | 认证由智能体启动的子进程处理 | 仅 `copilot-acp` 插件 |

`auth_type` 决定了哪些代码路径将你的提供者视为“简单 API 密钥提供者” — 如果不是 `api_key`，插件管理器仍会记录清单，但 Hermes 的 CLI 级自动化（doctor 检查、`--provider` 标志、设置向导委托）可能会跳过它。

## 发现时机

提供者的发现是**延迟**进行的——由进程中首次调用 `get_provider_profile()` 或 `list_providers()` 触发。实际上，这通常发生在启动早期（`auth.py` 模块加载时会急切地扩展 `PROVIDER_REGISTRY`）。如果您需要验证插件是否已加载，请运行：

```bash
hermes doctor
```

——如果成功，`auth_type="api_key"` 的配置文件会出现在“提供者连接性”部分，并附带 `/models` 探测结果。

如需以编程方式检查：

```python
from providers import list_providers
for p in list_providers():
    print(p.name, p.base_url, p.api_mode)
```

## 测试您的插件

将 `HERMES_HOME` 指向一个临时目录，以免污染您的真实配置：

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

通用 `PluginManager`（即 `hermes plugins` 所操作的对象）**可以看到**模型提供者插件，但不会导入它们——`providers/__init__.py` 负责管理它们的生命周期。管理器会记录清单以供内省，并按 `kind: model-provider` 进行分类。当您将一个未标记的用户插件放入 `$HERMES_HOME/plugins/`，而该插件恰好使用 `ProviderProfile` 调用了 `register_provider`，管理器会通过源码文本启发式方法自动将其强制转换为 `kind: model-provider`——因此，即使没有 `plugin.yaml`，该插件仍能正确路由。

## 通过 pip 分发

与任何其他 Hermes 插件一样，模型提供者可以作为 pip 包发布。在您的 `pyproject.toml` 中添加一个入口点：

```toml
[project.entry-points."hermes.plugins"]
acme-inference = "acme_hermes_plugin:register"
```

……其中 `acme_hermes_plugin:register` 是一个调用 `register_provider(profile)` 的函数。通用 PluginManager 会在 `discover_and_load()` 期间发现入口点插件。对于 `kind: model-provider` 的 pip 插件，您仍需在清单中声明类型（或依赖源码文本启发式方法）。

请参阅[构建 Hermes 插件](/docs/guides/build-a-hermes-plugin#distribute-via-pip)以了解完整的入口点设置。

## 相关页面

- [提供者运行时](/docs/developer-guide/provider-runtime) —— 解析优先级 + 每一层读取配置文件的位置
- [添加提供者](/docs/developer-guide/adding-providers) —— 新推理后端的端到端检查清单（涵盖快速插件路径和完整的 CLI/身份验证集成）
- [记忆提供者插件](/docs/developer-guide/memory-provider-plugin)
- [上下文引擎插件](/docs/developer-guide/context-engine-plugin)
- [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin) —— 通用插件编写