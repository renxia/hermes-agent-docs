---
sidebar_position: 5
title: "添加提供方"
description: "如何为 Hermes 智能体添加新的推理提供方 —— 认证、运行时解析、CLI 流程、适配器、测试和文档"
---

# 添加提供方

Hermes 已经可以通过自定义提供方路径与任何兼容 OpenAI 的端点进行通信。除非您想为某项服务提供一流的用户体验，否则不要添加内置提供方：

- 提供方特定的认证或令牌刷新
- 精心策划的模型目录
- 设置/`hermes model`菜单条目
- 用于`provider:model`语法的提供方别名
- 需要适配器的非 OpenAI API 形状

如果该提供方只是“另一个兼容 OpenAI 的基础 URL 和 API 密钥”，一个命名的自定义提供方可能就足够了。

## 心智模型

一个内置提供方需要在几个层面保持对齐：

1. `hermes_cli/auth.py` 决定如何查找凭据。
2. `hermes_cli/runtime_provider.py` 将其转换为运行时数据：
   - `provider`
   - `api_mode`
   - `base_url`
   - `api_key`
   - `source`
3. `run_agent.py` 使用`api_mode`来决定如何构建和发送请求。
4. `hermes_cli/models.py`和`hermes_cli/main.py`使提供方在 CLI 中显示。（`hermes_cli/setup.py`会自动委托给`main.py`——无需在那里进行更改。）
5. `agent/auxiliary_client.py`和`agent/model_metadata.py`确保辅助任务和令牌预算正常工作。

重要的抽象是`api_mode`。

- 大多数提供方使用`chat_completions`。
- Codex 使用`codex_responses`。
- Anthropic 使用`anthropic_messages`。
- 一个新的非 OpenAI 协议通常意味着需要添加一个新的适配器和一个新的`api_mode`分支。

## 先选择实现路径

### 路径 A — OpenAI 兼容提供商

当提供商接受标准的聊天补全式请求时使用此路径。

典型工作包括：

- 添加认证元数据
- 添加模型目录 / 别名
- 添加运行时解析
- 添加 CLI 菜单配置
- 添加辅助模型默认设置
- 添加测试和用户文档

通常不需要新的适配器或新的 `api_mode`。

### 路径 B — 原生提供商

当提供商的行为不像 OpenAI 聊天补全时使用此路径。

当前代码库中的示例：

- `codex_responses`
- `anthropic_messages`

此路径包含路径 A 的所有内容，外加：

- `agent/` 中的提供商适配器
- `run_agent.py` 中用于请求构建、分发、用量提取、中断处理和响应规范化的分支
- 适配器测试

## 文件检查清单

### 每个内置提供商必需

1.  `hermes_cli/auth.py`
2.  `hermes_cli/models.py`
3.  `hermes_cli/runtime_provider.py`
4.  `hermes_cli/main.py`
5.  `agent/auxiliary_client.py`
6.  `agent/model_metadata.py`
7.  测试
8.  `website/docs/` 下的用户文档

:::tip
`hermes_cli/setup.py` **无需**更改。设置向导将提供商/模型选择委托给 `main.py` 中的 `select_provider_and_model()` — 任何添加到那里的提供商都会自动出现在 `hermes setup` 中。
:::

### 原生 / 非 OpenAI 提供商的额外要求

10. `agent/<provider>_adapter.py`
11. `run_agent.py`
12. 如果需要提供商 SDK，则还需修改 `pyproject.toml`

## 快速路径：简单 API 密钥提供商

如果你的提供商只是一个使用单个 API 密钥进行身份验证的 OpenAI 兼容端点，那么你无需修改 `auth.py`、`runtime_provider.py`、`main.py` 或下面完整检查清单中的任何其他文件。

你只需要：

1.  在 `plugins/model-providers/<your-provider>/` 下创建一个插件目录，包含：
    -   `__init__.py` — 在模块级调用 `register_provider(profile)`
    -   `plugin.yaml` — 清单文件（名称、种类：model-provider、版本、描述）
2.  仅此而已。提供商插件会在任何地方首次调用 `get_provider_profile()` 或 `list_providers()` 时自动加载 — 内置插件（本代码库）和位于 `$HERMES_HOME/plugins/model-providers/` 的用户插件都会被加载。

当你添加插件并调用 `register_provider()` 时，以下内容会自动配置：

1.  `auth.py` 中的 `PROVIDER_REGISTRY` 条目（凭据解析、环境变量查找）
2.  `api_mode` 设置为 `chat_completions`
3.  `base_url` 从配置或声明的环境变量中获取
4.  按优先级顺序检查 `env_vars` 以获取 API 密钥
5.  注册提供商的 `fallback_models` 列表
6.  `--provider` CLI 标志接受提供商 ID
7.  `hermes model` 菜单包含该提供商
8.  `hermes setup` 向导自动委托给 `main.py`
9.  `provider:model` 别名语法有效
10. 运行时解析器返回正确的 `base_url` 和 `api_key`
11. `--provider <name>` CLI 标志接受提供商 ID
12. 备用模型激活可以干净地切换到该提供商

位于 `$HERMES_HOME/plugins/model-providers/<name>/` 的用户插件会覆盖同名的内置插件（在 `register_provider()` 中采用“最后写入者获胜”策略）— 因此第三方可以修补或替换任何内置配置文件，而无需编辑代码库。

参考 `plugins/model-providers/nvidia/` 或 `plugins/model-providers/gmi/` 作为模板，以及完整的[模型提供商插件指南](/developer-guide/model-provider-plugin)，获取字段参考、钩子用法和端到端示例。

## 完整路径：OAuth 和复杂提供商

当你的提供商需要以下任何功能时，使用下面的完整检查清单：

-   OAuth 或令牌刷新（Nous Portal, Codex, Google Gemini, Qwen Portal, Copilot）
-   需要新适配器的非 OpenAI API 形状（Anthropic Messages, Codex Responses）
-   自定义端点检测或多区域探测（z.ai, Kimi）
-   策划的静态模型目录或实时的 `/models` 获取
-   具有定制身份验证流程的特定于提供商的 `hermes model` 菜单项

## 步骤 1：选择一个规范的提供商 ID

选择一个单一的提供商 ID 并在所有地方使用它。

代码库中的示例：

- `openai-codex`
- `kimi-coding`
- `minimax-cn`

同一个 ID 应出现在：

- `hermes_cli/auth.py` 中的 `PROVIDER_REGISTRY`
- `hermes_cli/models.py` 中的 `_PROVIDER_LABELS`
- `hermes_cli/auth.py` 和 `hermes_cli/models.py` 中的 `_PROVIDER_ALIASES`
- `hermes_cli/main.py` 中的 CLI `--provider` 选项
- 设置 / 模型选择分支
- 辅助模型默认值
- 测试

如果这些文件中的 ID 不一致，提供商的集成将不完整：身份验证可能有效，但 `/model`、设置或运行时解析可能会悄悄失败。

## 步骤 2：在 `hermes_cli/auth.py` 中添加认证元数据

对于 API 密钥提供商，向 `PROVIDER_REGISTRY` 添加一个 `ProviderConfig` 条目，包含：

-   `id`
-   `name`
-   `auth_type="api_key"`
-   `inference_base_url`
-   `api_key_env_vars`
-   可选的 `base_url_env_var`

同时将别名添加到 `_PROVIDER_ALIASES`。

使用现有提供商作为模板：

-   简单的 API 密钥路径：Z.AI, MiniMax
-   带端点检测的 API 密钥路径：Kimi, Z.AI
-   原生令牌解析：Anthropic
-   OAuth / 认证存储路径：Nous, OpenAI Codex

需要在此处回答的问题：

-   Hermes 应检查哪些环境变量，以及按什么优先级顺序？
-   提供商是否需要 base-URL 覆盖？
-   它是否需要端点探测或令牌刷新？
-   当凭据缺失时，身份验证错误消息应该说什么？

如果提供商的需求超出了“查找一个 API 密钥”，请添加一个专用的凭据解析器，而不是将逻辑塞入不相关的分支。

## 步骤 3：在 `hermes_cli/models.py` 中添加模型目录和别名

更新提供商目录，以便在菜单和 `provider:model` 语法中正常工作。

典型编辑：

-   `_PROVIDER_MODELS`
-   `_PROVIDER_LABELS`
-   `_PROVIDER_ALIASES`
-   `list_available_providers()` 中的提供商显示顺序
-   如果提供商支持实时 `/models` 获取，则还需修改 `provider_model_ids()`

如果提供商暴露了实时模型列表，优先使用它，并将 `_PROVIDER_MODELS` 作为静态回退。

此文件也使如下输入能够正常工作：

```text
anthropic:claude-sonnet-4-6
kimi:model-name
```

如果此处缺少别名，提供商可能正确进行了身份验证，但在 `/model` 解析时仍然失败。

## 步骤 4：在 `hermes_cli/runtime_provider.py` 中解析运行时数据

`resolve_runtime_provider()` 是 CLI、网关、定时任务、ACP 和辅助客户端使用的共享路径。

添加一个分支，返回一个至少包含以下内容的字典：

```python
{
    "provider": "your-provider",
    "api_mode": "chat_completions",  # 或你的原生模式
    "base_url": "https://...",
    "api_key": "...",
    "source": "env|portal|auth-store|explicit",
    "requested_provider": requested_provider,
}
```

如果提供商兼容 OpenAI，`api_mode` 通常应保持为 `chat_completions`。

注意 API 密钥的优先级。Hermes 已经包含逻辑，以避免将 OpenRouter 密钥泄露给不相关的端点。新提供商对于哪个密钥用于哪个 base URL 应该同样明确。

## 步骤 5：在 `hermes_cli/main.py` 中配置 CLI

一个提供商只有出现在交互式的 `hermes model` 流程中才可被发现。

在 `hermes_cli/main.py` 中更新以下内容：

-   `provider_labels` 字典
-   `select_provider_and_model()` 中的 `providers` 列表
-   提供商分派（`if selected_provider == ...`）
-   `--provider` 参数选项
-   如果提供商支持登录/注销流程，则添加这些选项
-   一个 `_model_flow_<provider>()` 函数，或者如果适用，复用 `_model_flow_api_key_provider()`

:::tip
`hermes_cli/setup.py` 无需更改 — 它从 `main.py` 调用 `select_provider_and_model()`，因此你的新提供商会自动出现在 `hermes model` 和 `hermes setup` 中。
:::

## 步骤 6：保持辅助调用正常工作

这里涉及两个文件：

### `agent/auxiliary_client.py`

如果这是一个直接的 API 密钥提供商，向 `_API_KEY_PROVIDER_AUX_MODELS` 添加一个廉价/快速的默认辅助模型。

辅助任务包括：

-   视觉摘要
-   网页提取摘要
-   上下文压缩摘要
-   会话搜索摘要
-   记忆刷新

如果提供商没有合理的辅助默认值，辅助任务可能会回退到错误的模型，或者意外地使用昂贵的主模型。

### `agent/model_metadata.py`

为提供商的模型添加上下文长度，以便令牌预算、压缩阈值和限制保持合理。

## 步骤 7：如果提供商是原生的，则添加适配器和 `run_agent.py` 支持

如果提供商不是普通的聊天补全，请将特定于提供商的逻辑隔离在 `agent/<provider>_adapter.py` 中。

让 `run_agent.py` 专注于编排。它应该调用适配器帮助函数，而不是在文件各处手动构建提供商负载。

原生提供商通常需要在以下位置进行工作：

### 新的适配器文件

典型职责：

-   构建 SDK / HTTP 客户端
-   解析令牌
-   将 OpenAI 风格的对话消息转换为提供商的请求格式
-   如果需要，转换工具模式
-   将提供商响应规范化为 `run_agent.py` 期望的格式
-   提取用量和完成原因数据

### `run_agent.py`

搜索 `api_mode` 并审计每个切换点。至少要验证：

-   `__init__` 选择了新的 `api_mode`
-   客户端构建对该提供商有效
-   `_build_api_kwargs()` 知道如何格式化请求
-   `_interruptible_api_call()` 分派到正确的客户端调用
-   中断 / 客户端重建路径有效
-   响应验证接受提供商的形状
-   完成原因提取正确
-   令牌用量提取正确
-   备用模型激活可以干净地切换到新提供商
-   摘要生成和记忆刷新路径仍然有效

同时在 `run_agent.py` 中搜索 `self.client.`。任何假设标准 OpenAI 客户端存在的代码路径，当原生提供商使用不同的客户端对象或 `self.client = None` 时都可能中断。

### 提示缓存和特定于提供商的请求字段

提示缓存和特定于提供商的配置项很容易引起回归。

代码库中已有的示例：

-   Anthropic 有原生的提示缓存路径
-   OpenRouter 获取提供商路由字段
-   并非每个提供商都应该接收每个请求端选项

当你添加原生提供商时，请仔细检查 Hermes 是否只发送该提供商实际能理解的字段。

## 步骤 8：测试

至少，要接触那些保护提供者集成的测试。

常见位置：

- `tests/hermes_cli/test_runtime_provider_resolution.py`
- `tests/cli/test_cli_provider_resolution.py`
- `tests/hermes_cli/test_model_switch_custom_providers.py` (以及相邻的 `tests/hermes_cli/test_model_switch_*.py`)
- `tests/hermes_cli/test_setup_model_provider.py`
- `tests/run_agent/test_provider_parity.py`
- `tests/run_agent/test_run_agent.py`
- `tests/test_<provider>_adapter.py` 用于原生提供者

对于仅文档的示例，确切的文件集可能不同。重点是涵盖：

- 认证解析
- CLI 菜单 / 提供者选择
- 运行时提供者解析
- 智能体执行路径
- provider:model 解析
- 任何适配器特定的消息转换

禁用 xdist 运行测试：

```bash
source venv/bin/activate
python -m pytest tests/hermes_cli/test_runtime_provider_resolution.py tests/cli/test_cli_provider_resolution.py tests/hermes_cli/test_setup_model_provider.py tests/run_agent/test_provider_parity.py -n0 -q
```

对于更深入的更改，在推送前运行完整测试套件：

```bash
source venv/bin/activate
python -m pytest tests/ -n0 -q
```

## 步骤 9：实时验证

测试后，运行真实的冒烟测试。

```bash
source venv/bin/activate
python -m hermes_cli.main chat -q "Say hello" --provider your-provider --model your-model
```

如果你更改了菜单，也要测试交互式流程：

```bash
source venv/bin/activate
python -m hermes_cli.main model
python -m hermes_cli.main setup
```

对于原生提供者，至少验证一次工具调用，而不仅仅是纯文本响应。

## 步骤 10：更新面向用户的文档

如果该提供者旨在作为一等选项发布，也请更新用户文档：

- `website/docs/getting-started/quickstart.md`
- `website/docs/user-guide/configuration.md`
- `website/docs/reference/environment-variables.md`

开发者可能完美集成了提供者，却仍然让用户无法发现所需的环境变量或设置流程。

## OpenAI 兼容提供者清单

如果提供者是标准的聊天完成服务，请使用此清单。

- [ ] 在 `hermes_cli/auth.py` 中添加 `ProviderConfig`
- [ ] 在 `hermes_cli/auth.py` 和 `hermes_cli/models.py` 中添加别名
- [ ] 在 `hermes_cli/models.py` 中添加模型目录
- [ ] 在 `hermes_cli/runtime_provider.py` 中添加运行时分支
- [ ] 在 `hermes_cli/main.py` 中添加 CLI 集成（setup.py 会自动继承）
- [ ] 在 `agent/auxiliary_client.py` 中添加辅助模型
- [ ] 在 `agent/model_metadata.py` 中添加上下文长度
- [ ] 更新运行时/CLI 测试
- [ ] 更新用户文档

## 原生提供者清单

当提供者需要新的协议路径时使用此清单。

- [ ] 包含 OpenAI 兼容清单中的所有项
- [ ] 在 `agent/<provider>_adapter.py` 中添加适配器
- [ ] 在 `run_agent.py` 中支持新的 `api_mode`
- [ ] 中断/重建路径正常工作
- [ ] 用量和完成原因提取正常工作
- [ ] 回退路径正常工作
- [ ] 添加适配器测试
- [ ] 实时冒烟测试通过

## 常见陷阱

### 1. 将提供者添加到认证中但未添加到模型解析中

这会导致凭据解析正确，而 `/model` 和 `provider:model` 输入失败。

### 2. 忘记 `config["model"]` 可以是字符串或字典

许多提供者选择代码都必须规范化这两种形式。

### 3. 假设必须使用内置提供者

如果服务只是 OpenAI 兼容的，自定义提供者可能已经以更少的维护解决了用户问题。

### 4. 忘记辅助路径

主聊天路径可以工作，而摘要、内存刷新或视觉辅助可能失败，因为辅助路由从未更新。

### 5. 隐藏在 `run_agent.py` 中的原生提供者分支

搜索 `api_mode` 和 `self.client.`。不要假设显而易见的请求路径是唯一的。

### 6. 将 OpenRouter 专有参数发送给其他提供者

像提供者路由这样的字段只属于支持它们的提供者。

### 7. 更新了 `hermes model` 但未更新 `hermes setup`

两个流程都需要知道该提供者。

## 实现时的良好搜索目标

如果你正在查找提供者涉及的所有位置，请搜索这些符号：

- `PROVIDER_REGISTRY`
- `_PROVIDER_ALIASES`
- `_PROVIDER_MODELS`
- `resolve_runtime_provider`
- `_model_flow_`
- `select_provider_and_model`
- `api_mode`
- `_API_KEY_PROVIDER_AUX_MODELS`
- `self.client.`

## 相关文档

- [提供者运行时解析](./provider-runtime.md)
- [架构](./architecture.md)
- [贡献](./contributing.md)