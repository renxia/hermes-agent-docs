---
sidebar_position: 5
title: "Adding Providers"
description: "How to add a new inference provider to Hermes Agent — auth, runtime resolution, CLI flows, adapters, tests, and docs"
---

# 添加 Provider

Hermes 已经能够通过自定义 provider 路径与任何兼容 OpenAI 的端点进行通信。除非你希望为该服务提供一流的用户体验，否则不要添加内置 provider：

- provider 专用的认证或 token 刷新机制
- 精选的模型目录
- 设置 / `hermes model` 菜单条目
- 用于 `provider:model` 语法的 provider 别名
- 需要适配器的非 OpenAI API 结构

如果该 provider 仅仅是"另一个兼容 OpenAI 的基础 URL 和 API 密钥"，一个命名的自定义 provider 可能就足够了。

## 心智模型

一个内置 provider 需要在多个层面上保持一致：

1. `hermes_cli/auth.py` 决定如何查找凭证。
2. `hermes_cli/runtime_provider.py` 将其转化为运行时数据：
   - `provider`
   - `api_mode`
   - `base_url`
   - `api_key`
   - `source`
3. `run_agent.py` 使用 `api_mode` 决定请求的构建和发送方式。
4. `hermes_cli/models.py` 和 `hermes_cli/main.py` 使 provider 在 CLI 中显示。（`hermes_cli/setup.py` 会自动委托给 `main.py` —— 无需在那里做任何更改。）
5. `agent/auxiliary_client.py` 和 `agent/model_metadata.py` 确保辅助任务和 token 预算功能正常运行。

重要的抽象概念是 `api_mode`。

- 大多数 provider 使用 `chat_completions`。
- Codex 使用 `codex_responses`。
- Anthropic 使用 `anthropic_messages`。
- 一个新的非 OpenAI 协议通常意味着需要添加一个新的适配器和一个新的 `api_mode` 分支。

## 先选择实现路径

### 路径 A — 兼容 OpenAI 的提供商

当提供商接受标准 chat-completions 风格的请求时使用此路径。

典型工作包括：

- 添加认证元数据
- 添加模型目录 / 别名
- 添加运行时解析
- 添加 CLI 菜单接线
- 添加辅助模型默认值
- 添加测试和用户文档

通常不需要新的适配器或新的 `api_mode`。

### 路径 B — 原生提供商

当提供商的行为不像 OpenAI chat completions 时使用此路径。

当前代码树中的示例：

- `codex_responses`
- `anthropic_messages`

此路径包含路径 A 的所有内容，加上：

- `agent/` 中的提供商适配器
- `run_agent.py` 中用于请求构建、分发、用量提取、中断处理和响应规范化的分支
- 适配器测试

## 文件清单

### 每个内置提供商都需要

1. `hermes_cli/auth.py`
2. `hermes_cli/models.py`
3. `hermes_cli/runtime_provider.py`
4. `hermes_cli/main.py`
5. `agent/auxiliary_client.py`
6. `agent/model_metadata.py`
7. 测试
8. `website/docs/` 下的用户文档

:::tip
`hermes_cli/setup.py` **不需要**修改。设置向导将提供商/模型选择委托给 `main.py` 中的 `select_provider_and_model()` — 在那里添加的任何提供商都会自动在 `hermes setup` 中可用。
:::

### 原生 / 非 OpenAI 提供商额外需要

10. `agent/<provider>_adapter.py`
11. `run_agent.py`
12. 如果需要提供商 SDK，则修改 `pyproject.toml`

## 快速路径：简单的 API Key 提供商

如果你的提供商只是一个使用单个 API Key 认证的兼容 OpenAI 的端点，你不需要触碰 `auth.py`、`runtime_provider.py`、`main.py` 或完整清单中的任何其他文件。

你只需要：

1. 在 `plugins/model-providers/<your-provider>/` 下创建一个插件目录，包含：
   - `__init__.py` — 在模块级别调用 `register_provider(profile)`
   - `plugin.yaml` — 清单文件（名称、类型: model-provider、版本、描述）
2. 就这样。提供商插件在首次调用 `get_provider_profile()` 或 `list_providers()` 时会自动加载 — 捆绑插件（本仓库）和用户插件（位于 `$HERMES_HOME/plugins/model-providers/`）都会被拾取。

当你添加一个插件并调用 `register_provider()` 时，以下接线会自动完成：

1. `auth.py` 中的 `PROVIDER_REGISTRY` 条目（凭证解析、环境变量查找）
2. `api_mode` 设置为 `chat_completions`
3. `base_url` 从配置或声明的环境变量获取
4. `env_vars` 按优先级顺序检查 API Key
5. 为该提供商注册 `fallback_models` 列表
6. `--provider` CLI 标志接受提供商 ID
7. `hermes model` 菜单包含该提供商
8. `hermes setup` 向导自动委托给 `main.py`
9. `provider:model` 别名语法可用
10. 运行时解析器返回正确的 `base_url` 和 `api_key`
11. `--provider <name>` CLI 标志接受提供商 ID
12. 回退模型激活可以干净地切换到该提供商

用户插件（位于 `$HERMES_HOME/plugins/model-providers/<name>/`）会覆盖同名的捆绑插件（在 `register_provider()` 中后者优先）— 因此第三方可以 monkey-patch 或替换任何内置配置文件而无需编辑仓库。

参考 `plugins/model-providers/nvidia/` 或 `plugins/model-providers/gmi/` 作为模板，并查看完整的[模型提供商插件指南](/developer-guide/model-provider-plugin)以获取字段参考、钩子习惯用法和端到端示例。

## 完整路径：OAuth 和复杂提供商

当你的提供商需要以下任何一项时，使用下面的完整清单：

- OAuth 或令牌刷新（Nous Portal、Codex、Qwen Portal、Copilot）
- 需要新适配器的非 OpenAI API 形式（Anthropic Messages、Codex Responses）
- 自定义端点检测或多区域探测（z.ai、Kimi）
- 精选的静态模型目录或实时 `/models` 获取
- 具有自定义认证流程的提供商专属 `hermes model` 菜单条目

## 步骤 1：选择一个规范的提供商 ID

选择一个单一的提供商 ID，并在各处使用。

仓库中的示例：

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

如果这些文件之间的 ID 不一致，提供商会感觉像是接了一半线：认证可能正常工作，但 `/model`、设置或运行时解析可能会静默遗漏它。

## 步骤 2：在 `hermes_cli/auth.py` 中添加认证元数据

对于 API Key 提供商，在 `PROVIDER_REGISTRY` 中添加一个 `ProviderConfig` 条目，包含：

- `id`
- `name`
- `auth_type="api_key"`
- `inference_base_url`
- `api_key_env_vars`
- 可选的 `base_url_env_var`

同时在 `_PROVIDER_ALIASES` 中添加别名。

使用现有提供商作为模板：

- 简单 API Key 路径：Z.AI、MiniMax
- 带端点检测的 API Key 路径：Kimi、Z.AI
- 原生令牌解析：Anthropic
- OAuth / auth-store 路径：Nous、OpenAI Codex

这里需要回答的问题：

- Hermes 应该检查哪些环境变量，按什么优先级顺序？
- 提供商是否需要 base-URL 覆盖？
- 它是否需要端点探测或令牌刷新？
- 凭证缺失时认证错误应该显示什么？

如果提供商需要的不仅仅是"查找 API Key"，请添加一个专用的凭证解析器，而不是将逻辑塞进不相关的分支中。

## 步骤 3：在 `hermes_cli/models.py` 中添加模型目录和别名

更新提供商目录，使提供商能在菜单和 `provider:model` 语法中正常工作。

典型编辑：

- `_PROVIDER_MODELS`
- `_PROVIDER_LABELS`
- `_PROVIDER_ALIASES`
- `list_available_providers()` 中的提供商显示顺序
- 如果提供商支持实时 `/models` 获取，则编辑 `provider_model_ids()`

如果提供商公开了实时模型列表，优先使用该列表，并将 `_PROVIDER_MODELS` 作为静态回退。

该文件还使以下输入能够工作：

```text
anthropic:claude-sonnet-4-6
kimi:model-name
```

如果这里缺少别名，提供商可能认证正确但在 `/model` 解析中仍然失败。

## 步骤 4：在 `hermes_cli/runtime_provider.py` 中解析运行时数据

`resolve_runtime_provider()` 是 CLI、网关、cron、ACP 和辅助客户端使用的共享路径。

添加一个分支，返回至少包含以下内容的字典：

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

注意 API Key 的优先级。Hermes 已经包含了避免将 OpenRouter Key 泄露到无关端点的逻辑。新的提供商应同样明确地将哪个 Key 发送到哪个 base URL。

## 步骤 5：在 `hermes_cli/main.py` 中接通 CLI

提供商在交互式 `hermes model` 流程中出现之前是不可发现的。

在 `hermes_cli/main.py` 中更新以下内容：

- `provider_labels` 字典
- `select_provider_and_model()` 中的 `providers` 列表
- 提供商分发（`if selected_provider == ...`）
- `--provider` 参数选项
- 如果提供商支持这些流程，则更新登录/注销选项
- 一个 `_model_flow_<provider>()` 函数，或如果合适则复用 `_model_flow_api_key_provider()`

:::tip
`hermes_cli/setup.py` 不需要修改 — 它调用了 `main.py` 中的 `select_provider_and_model()`，因此你的新提供商自动出现在 `hermes model` 和 `hermes setup` 中。
:::

## 步骤 6：保持辅助调用正常工作

这里有两个关键文件：

### `agent/auxiliary_client.py`

如果这是直接的 API Key 提供商，在 `_API_KEY_PROVIDER_AUX_MODELS` 中添加一个便宜/快速的默认辅助模型。

辅助任务包括：

- 视觉摘要
- 网页提取摘要
- 上下文压缩摘要
- 会话搜索摘要
- 记忆刷新

如果提供商没有合理的辅助默认值，辅助任务可能回退不佳或意外使用昂贵的主模型。

### `agent/model_metadata.py`

添加提供商模型的上下文长度，使令牌预算、压缩阈值和限制保持合理。

## 步骤 7：如果提供商是原生的，添加适配器和 `run_agent.py` 支持

如果提供商不是普通的 chat completions，将提供商特定逻辑隔离在 `agent/<provider>_adapter.py` 中。

让 `run_agent.py` 专注于编排。它应该调用适配器帮助函数，而不是在整个文件中内联构建提供商载荷。

原生提供商通常需要在以下位置进行工作：

### 新适配器文件

典型职责：

- 构建 SDK / HTTP 客户端
- 解析令牌
- 将 OpenAI 风格的对话消息转换为提供商的请求格式
- 如有需要，转换工具模式
- 将提供商响应规范化为 `run_agent.py` 期望的格式
- 提取用量和 finish-reason 数据

### `run_agent.py`

搜索 `api_mode` 并审计每个切换点。至少验证：

- `__init__` 选择新的 `api_mode`
- 客户端构建适用于该提供商
- `_build_api_kwargs()` 知道如何格式化请求
- `_interruptible_api_call()` 分发到正确的客户端调用
- 中断 / 客户端重建路径有效
- 响应验证接受该提供商的格式
- finish-reason 提取正确
- 令牌用量提取正确
- 回退模型激活可以干净地切换到新提供商
- 摘要生成和记忆刷新路径仍然有效

同时搜索 `run_agent.py` 中的 `self.client.`。任何假设标准 OpenAI 客户端存在的代码路径，在使用不同客户端对象或 `self.client = None` 的原生提供商时都可能损坏。

### 提示缓存和提供商特定请求字段

提示缓存和提供商特定的旋钮很容易回归。

代码树中已有的示例：

- Anthropic 有原生提示缓存路径
- OpenRouter 获得提供商路由字段
- 并非每个提供商都应接收每个请求端选项

添加原生提供商时，请仔细检查 Hermes 只发送该提供商实际理解的字段。

## 步骤 8：测试

至少触及保护提供商接线的测试。

常见位置：

- `tests/hermes_cli/test_runtime_provider_resolution.py`
- `tests/cli/test_cli_provider_resolution.py`
- `tests/hermes_cli/test_model_switch_custom_providers.py`（及相邻的 `tests/hermes_cli/test_model_switch_*.py`）
- `tests/hermes_cli/test_setup_model_provider.py`
- `tests/run_agent/test_provider_parity.py`
- `tests/run_agent/test_run_agent.py`
- 原生提供商的 `tests/test_<provider>_adapter.py`

对于仅文档示例，确切的文件集可能有所不同。重点是覆盖：

- 认证解析
- CLI 菜单 / 提供商选择
- 运行时提供商解析
- 智能体执行路径
- provider:model 解析
- 任何适配器特定的消息转换

使用 xdist 禁用运行测试：

```bash
source venv/bin/activate
python -m pytest tests/hermes_cli/test_runtime_provider_resolution.py tests/cli/test_cli_provider_resolution.py tests/hermes_cli/test_setup_model_provider.py tests/run_agent/test_provider_parity.py -n0 -q
```

对于更深层的更改，推送前运行完整套件：

```bash
source venv/bin/activate
python -m pytest tests/ -n0 -q
```

## 步骤 9：实时验证

测试完成后，运行一次真实的冒烟测试。

```bash
source venv/bin/activate
python -m hermes_cli.main chat -q "Say hello" --provider your-provider --model your-model
```

如果你修改了菜单，还要测试交互式流程：

```bash
source venv/bin/activate
python -m hermes_cli.main model
python -m hermes_cli.main setup
```

对于原生提供方，至少要验证一次工具调用，而不仅仅是纯文本响应。

## 步骤 10：更新面向用户的文档

如果该提供方打算作为一等选项发布，也要更新用户文档：

- `website/docs/getting-started/quickstart.md`
- `website/docs/user-guide/configuration.md`
- `website/docs/reference/environment-variables.md`

开发者可能完美地接入了提供方，却仍然让用户无法发现所需的环境变量或设置流程。

## OpenAI 兼容提供方清单

当提供方是标准 chat completions 时使用此清单。

- [ ] 在 `hermes_cli/auth.py` 中添加了 `ProviderConfig`
- [ ] 在 `hermes_cli/auth.py` 和 `hermes_cli/models.py` 中添加了别名
- [ ] 在 `hermes_cli/models.py` 中添加了模型目录
- [ ] 在 `hermes_cli/runtime_provider.py` 中添加了运行时分支
- [ ] 在 `hermes_cli/main.py` 中添加了 CLI 接入（setup.py 会自动继承）
- [ ] 在 `agent/auxiliary_client.py` 中添加了辅助模型
- [ ] 在 `agent/model_metadata.py` 中添加了上下文长度
- [ ] 更新了运行时 / CLI 测试
- [ ] 更新了用户文档

## 原生提供方清单

当提供方需要新的协议路径时使用此清单。

- [ ] OpenAI 兼容清单中的所有内容
- [ ] 在 `agent/<provider>_adapter.py` 中添加了适配器
- [ ] 在 `run_agent.py` 中支持了新的 `api_mode`
- [ ] 中断 / 重建路径正常工作
- [ ] 用量和完成原因提取正常工作
- [ ] 回退路径正常工作
- [ ] 添加了适配器测试
- [ ] 实时冒烟测试通过

## 常见陷阱

### 1. 将提供方添加到了认证但未添加到模型解析

这会导致凭证能正确解析，而 `/model` 和 `provider:model` 输入却失败。

### 2. 忘记 `config["model"]` 可以是字符串或字典

大量提供方选择代码都需要对两种形式进行规范化处理。

### 3. 假设必须使用内置提供方

如果该服务只是 OpenAI 兼容的，自定义提供方可能已经以更少的维护成本解决了用户问题。

### 4. 忘记辅助路径

主聊天路径可能正常工作，但摘要、记忆刷新或视觉辅助功能会因为辅助路由从未更新而失败。

### 5. 原生提供方分支隐藏在 `run_agent.py` 中

搜索 `api_mode` 和 `self.client.`。不要假设明显的请求路径是唯一的路径。

### 6. 将仅属于 OpenRouter 的开关发送给其他提供方

提供方路由等字段只属于支持它们的提供方。

### 7. 更新了 `hermes model` 但未更新 `hermes setup`

两个流程都需要知道该提供方的信息。

## 实现时的良好搜索目标

如果你在查找提供方涉及的所有位置，可以搜索以下符号：

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

- [提供方运行时解析](./provider-runtime.md)
- [架构](./architecture.md)
- [贡献指南](./contributing.md)