---
sidebar_position: 5
title: "添加提供方"
description: "如何为 Hermes 智能体添加新的推理提供方 — 认证、运行时解析、CLI 流程、适配器、测试和文档"
---

# 添加提供方

Hermes 已经可以通过自定义提供方路径与任何兼容 OpenAI 的端点进行通信。除非您希望为该服务提供一流的用户体验，否则请勿添加内置提供方：

- 提供方特定的认证或令牌刷新
- 精选的模型目录
- 设置 / `hermes model` 菜单项
- `provider:model` 语法的提供方别名
- 需要适配器的非 OpenAI API 形状

如果该提供方仅仅是“另一个兼容 OpenAI 的基础 URL 和 API 密钥”，那么命名自定义提供方可能就足够了。

## 心智模型

内置提供方必须在多个层面上保持一致：

1. `hermes_cli/auth.py` 决定如何查找凭据。
2. `hermes_cli/runtime_provider.py` 将其转换为运行时数据：
   - `provider`
   - `api_mode`
   - `base_url`
   - `api_key`
   - `source`
3. `run_agent.py` 使用 `api_mode` 来决定如何构建和发送请求。
4. `hermes_cli/models.py` 和 `hermes_cli/main.py` 使提供方在 CLI 中显示。（`hermes_cli/setup.py` 会自动委托给 `main.py` — 无需在那里进行更改。）
5. `agent/auxiliary_client.py` 和 `agent/model_metadata.py` 保持辅助任务和令牌预算的正常工作。

重要的抽象是 `api_mode`。

- 大多数提供方使用 `chat_completions`。
- Codex 使用 `codex_responses`。
- Anthropic 使用 `anthropic_messages`。
- 新的非 OpenAI 协议通常意味着添加一个新的适配器和一个新的 `api_mode` 分支。

## 首先选择实现路径

### 路径 A — 兼容 OpenAI 的提供方

当提供方接受标准 chat-completions 风格请求时使用此路径。

典型工作包括：

- 添加认证元数据
- 添加模型目录 / 别名
- 添加运行时解析
- 添加 CLI 菜单连接
- 添加辅助模型默认值
- 添加测试和用户文档

通常您不需要新的适配器或新的 `api_mode`。

### 路径 B — 原生提供方

当提供方行为不像 OpenAI 聊天补全时使用此路径。

当前树内的示例：

- `codex_responses`
- `anthropic_messages`

此路径包括路径 A 的所有内容，外加：

- `agent/` 中的提供方适配器
- `run_agent.py` 中用于请求构建、调度、使用情况提取、中断处理和响应规范化的分支
- 适配器测试

## 文件清单

### 每个内置提供方必需的文件

1. `hermes_cli/auth.py`
2. `hermes_cli/models.py`
3. `hermes_cli/runtime_provider.py`
4. `hermes_cli/main.py`
5. `agent/auxiliary_client.py`
6. `agent/model_metadata.py`
7. 测试
8. `website/docs/` 下的面向用户的文档

:::tip
`hermes_cli/setup.py` **不需要**更改。设置向导将提供方/模型选择委托给 `main.py` 中的 `select_provider_and_model()` — 在那里添加的任何提供方都会自动在 `hermes setup` 中可用。
:::

### 原生 / 非 OpenAI 提供方的额外文件

10. `agent/<provider>_adapter.py`
11. `run_agent.py`
12. 如果需要提供方 SDK，则需修改 `pyproject.toml`

## 快速路径：简单的 API 密钥提供方

如果您的提供方只是一个使用单个 API 密钥进行身份验证的兼容 OpenAI 的端点，则无需接触 `auth.py`、`runtime_provider.py`、`main.py` 或下面完整清单中的任何其他文件。

您所需要的只是：

1. 在 `plugins/model-providers/<your-provider>/` 下创建一个插件目录，包含：
   - `__init__.py` — 在模块级别调用 `register_provider(profile)`
   - `plugin.yaml` — 清单（名称、种类：model-provider、版本、描述）
2. 就是这样。插件会在首次调用 `get_provider_profile()` 或 `list_providers()` 时自动加载 — 捆绑插件（本仓库）和 `$HERMES_HOME/plugins/model-providers/` 下的用户插件都会被自动识别。

当您添加一个插件并调用 `register_provider()` 时，以下内容会自动连接：

1. `auth.py` 中的 `PROVIDER_REGISTRY` 条目（凭据解析、环境变量查找）
2. `api_mode` 设置为 `chat_completions`
3. `base_url` 来自配置或声明的环境变量
4. 按优先级顺序检查 `env_vars` 中的 API 密钥
5. 为提供方注册 `fallback_models` 列表
6. `--provider` CLI 标志接受提供方 ID
7. `hermes model` 菜单包含该提供方
8. `hermes setup` 向导自动委托给 `main.py`
9. `provider:model` 别名语法有效
10. 运行时解析器返回正确的 `base_url` 和 `api_key`
11. `HERMES_INFERENCE_PROVIDER` 环境变量覆盖接受提供方 ID
12. 回退模型激活可以干净地切换到该提供方

`$HERMES_HOME/plugins/model-providers/<name>/` 下的用户插件会覆盖同名捆绑插件（`register_provider()` 中采用“最后写入者获胜”策略）— 因此第三方无需编辑仓库即可对任何内置配置文件进行猴子补丁或替换。

请参考 `plugins/model-providers/nvidia/` 或 `plugins/model-providers/gmi/` 作为模板，以及完整的[模型提供方插件指南](/docs/developer-guide/model-provider-plugin)以了解字段参考、钩子惯用法和端到端示例。

## 完整路径：OAuth 和复杂提供方

当您的提供方需要以下任何功能时，请使用下面的完整清单：

- OAuth 或令牌刷新（Nous Portal、Codex、Google Gemini、Qwen Portal、Copilot）
- 需要新适配器的非 OpenAI API 形状（Anthropic Messages、Codex Responses）
- 自定义端点检测或多区域探测（z.ai、Kimi）
- 精选的静态模型目录或实时 `/models` 获取
- 具有定制认证流程的提供方特定的 `hermes model` 菜单项

## 步骤 1：选择一个规范的提供方 ID

选择一个提供方 ID 并在所有地方使用它。

仓库中的示例：

- `openai-codex`
- `kimi-coding`
- `minimax-cn`

该 ID 应出现在：

- `hermes_cli/auth.py` 中的 `PROVIDER_REGISTRY`
- `hermes_cli/models.py` 中的 `_PROVIDER_LABELS`
- `hermes_cli/auth.py` 和 `hermes_cli/models.py` 中的 `_PROVIDER_ALIASES`
- `hermes_cli/main.py` 中的 CLI `--provider` 选项
- 设置 / 模型选择分支
- 辅助模型默认值
- 测试

如果这些文件中的 ID 不一致，提供方会感觉像是只连接了一半：身份验证可能有效，但 `/model`、设置或运行时解析可能会静默忽略它。

## 步骤 2：在 `hermes_cli/auth.py` 中添加认证元数据

对于 API 密钥提供方，向 `PROVIDER_REGISTRY` 添加一个 `ProviderConfig` 条目，包含：

- `id`
- `name`
- `auth_type="api_key"`
- `inference_base_url`
- `api_key_env_vars`
- 可选的 `base_url_env_var`

同时向 `_PROVIDER_ALIASES` 添加别名。

使用现有提供方作为模板：

- 简单 API 密钥路径：Z.AI、MiniMax
- 带端点检测的 API 密钥路径：Kimi、Z.AI
- 原生令牌解析：Anthropic
- OAuth / 认证存储路径：Nous、OpenAI Codex

需要回答的问题：

- Hermes 应检查哪些环境变量，优先级顺序如何？
- 提供方是否需要 base-URL 覆盖？
- 是否需要端点探测或令牌刷新？
- 当凭据缺失时，认证错误应显示什么信息？

如果提供方需要比“查找 API 密钥”更复杂的逻辑，请添加专用的凭据解析器，而不是将逻辑塞进不相关的分支中。

## 步骤 3：在 `hermes_cli/models.py` 中添加模型目录和别名

更新提供方目录，使提供方在菜单和 `provider:model` 语法中可用。

典型编辑包括：

- `_PROVIDER_MODELS`
- `_PROVIDER_LABELS`
- `_PROVIDER_ALIASES`
- `list_available_providers()` 中提供方的显示顺序
- 如果提供方支持实时 `/models` 获取，则修改 `provider_model_ids()`

如果提供方暴露了实时模型列表，请优先使用该列表，并将 `_PROVIDER_MODELS` 保留为静态后备。

此文件还使以下输入有效：

```text
anthropic:claude-sonnet-4-6
kimi:model-name
```

如果此处缺少别名，提供方可能身份验证正确，但在 `/model` 解析时仍会失败。

## 步骤 4：在 `hermes_cli/runtime_provider.py` 中解析运行时数据

`resolve_runtime_provider()` 是 CLI、网关、cron、ACP 和辅助客户端使用的共享路径。

添加一个分支，返回至少包含以下内容的字典：

```python
{
    "provider": "your-provider",
    "api_mode": "chat_completions",  # 或您的原生模式
    "base_url": "https://...",
    "api_key": "...",
    "source": "env|portal|auth-store|explicit",
    "requested_provider": requested_provider,
}
```

如果提供方兼容 OpenAI，`api_mode` 通常应保持为 `chat_completions`。

注意 API 密钥的优先级。Hermes 已包含避免将 OpenRouter 密钥泄漏到不相关端点的逻辑。新的提供方应对哪个密钥对应哪个 base URL 同样明确。

## 步骤 5：在 `hermes_cli/main.py` 中连接 CLI

提供方在交互式 `hermes model` 流程中显示之前是不可发现的。

在 `hermes_cli/main.py` 中更新以下内容：

- `provider_labels` 字典
- `select_provider_and_model()` 中的 `providers` 列表
- 提供方调度（`if selected_provider == ...`）
- `--provider` 参数选项
- 如果提供方支持这些流程，则更新登录/注销选项
- `_model_flow_<provider>()` 函数，或如果适用则重用 `_model_flow_api_key_provider()`

:::tip
`hermes_cli/setup.py` 不需要更改 — 它调用 `main.py` 中的 `select_provider_and_model()`，因此您的新提供方会自动出现在 `hermes model` 和 `hermes setup` 中。
:::

## 步骤 6：保持辅助调用正常工作

这里有两个重要文件：

### `agent/auxiliary_client.py`

如果这是直接 API 密钥提供方，请在 `_API_KEY_PROVIDER_AUX_MODELS` 中添加一个廉价 / 快速的默认辅助模型。

辅助任务包括：

- 视觉摘要
- 网页提取摘要
- 上下文压缩摘要
- 会话搜索摘要
- 内存刷新

如果提供方没有合理的辅助默认值，侧边任务可能会回退得很糟糕，或意外使用昂贵的主模型。

### `agent/model_metadata.py`

为提供方的模型添加上下文长度，以便令牌预算、压缩阈值和限制保持合理。

## 步骤 7：如果提供方是原生的，添加适配器和 `run_agent.py` 支持

如果提供方不是普通的聊天补全，请将提供方特定的逻辑隔离在 `agent/<provider>_adapter.py` 中。

保持 `run_agent.py` 专注于编排。它应调用适配器辅助函数，而不是在整个文件中内联手动构建提供方负载。

原生提供方通常需要在以下位置进行工作：

### 新的适配器文件

典型职责：

- 构建 SDK / HTTP 客户端
- 解析令牌
- 将 OpenAI 风格的对话消息转换为提供方的请求格式
- 如果需要，转换工具模式
- 将提供方响应规范化为 `run_agent.py` 所期望的格式
- 提取使用情况和完成原因数据

### `run_agent.py`

搜索 `api_mode` 并审计每个切换点。至少验证：

- `__init__` 选择新的 `api_mode`
- 客户端构建对提供方有效
- `_build_api_kwargs()` 知道如何格式化请求
- `_interruptible_api_call()` 调度到正确的客户端调用
- 中断 / 客户端重建路径有效
- 响应验证接受提供方的形状
- 完成原因提取正确
- 令牌使用情况提取正确
- 回退模型激活可以干净地切换到新提供方
- 摘要生成和内存刷新路径仍然有效

同时在 `run_agent.py` 中搜索 `self.client.`。任何假设标准 OpenAI 客户端存在的代码路径，在原生提供方使用不同的客户端对象或 `self.client = None` 时都可能中断。

### 提示缓存和提供方特定的请求字段

提示缓存和提供方特定的旋钮很容易退化。

树内已有的示例：

- Anthropic 有原生的提示缓存路径
- OpenRouter 获取提供方路由字段
- 并非每个提供方都应接收每个请求端选项

当您添加原生提供方时，请仔细检查 Hermes 是否只发送该提供方实际理解的字段。

## 步骤 8：测试

至少需要运行用于保护提供者连接逻辑的测试。

常见位置：

- `tests/test_runtime_provider_resolution.py`
- `tests/test_cli_provider_resolution.py`
- `tests/test_cli_model_command.py`
- `tests/test_setup_model_selection.py`
- `tests/test_provider_parity.py`
- `tests/test_run_agent.py`
- `tests/test_<provider>_adapter.py`（适用于原生提供者）

对于仅文档示例，具体文件列表可能有所不同。重点是覆盖以下内容：

- 身份验证解析
- CLI 菜单 / 提供者选择
- 运行时提供者解析
- 智能体执行路径
- 提供者:模型解析
- 任何适配器特定的消息转换

禁用 xdist 运行测试：

```bash
source venv/bin/activate
python -m pytest tests/test_runtime_provider_resolution.py tests/test_cli_provider_resolution.py tests/test_cli_model_command.py tests/test_setup_model_selection.py -n0 -q
```

对于更深层次的更改，请在推送前运行完整测试套件：

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

如果更改了菜单，还需测试交互流程：

```bash
source venv/bin/activate
python -m hermes_cli.main model
python -m hermes_cli.main setup
```

对于原生提供者，还需验证至少一次工具调用，而不仅仅是纯文本响应。

## 步骤 10：更新面向用户的文档

如果该提供者旨在作为一等选项发布，还需更新用户文档：

- `website/docs/getting-started/quickstart.md`
- `website/docs/user-guide/configuration.md`
- `website/docs/reference/environment-variables.md`

开发者可能完美地连接了提供者，但仍可能导致用户无法发现所需的环境变量或设置流程。

## OpenAI 兼容提供者检查清单

如果提供者是标准聊天补全接口，请使用此清单。

- [ ] 在 `hermes_cli/auth.py` 中添加了 `ProviderConfig`
- [ ] 在 `hermes_cli/auth.py` 和 `hermes_cli/models.py` 中添加了别名
- [ ] 在 `hermes_cli/models.py` 中添加了模型目录
- [ ] 在 `hermes_cli/runtime_provider.py` 中添加了运行时分支
- [ ] 在 `hermes_cli/main.py` 中添加了 CLI 连接（setup.py 会自动继承）
- [ ] 在 `agent/auxiliary_client.py` 中添加了辅助模型
- [ ] 在 `agent/model_metadata.py` 中添加了上下文长度
- [ ] 更新了运行时 / CLI 测试
- [ ] 更新了用户文档

## 原生提供者检查清单

当提供者需要新的协议路径时，请使用此清单。

- [ ] OpenAI 兼容检查清单中的所有项
- [ ] 在 `agent/<provider>_adapter.py` 中添加了适配器
- [ ] 在 `run_agent.py` 中支持新的 `api_mode`
- [ ] 中断 / 重建路径正常工作
- [ ] 使用情况与完成原因提取正常工作
- [ ] 回退路径正常工作
- [ ] 添加了适配器测试
- [ ] 实时冒烟测试通过

## 常见陷阱

### 1. 将提供者添加到身份验证但未添加到模型解析

这会导致凭据解析正确，而 `/model` 和 `provider:model` 输入失败。

### 2. 忘记 `config["model"]` 可以是字符串或字典

许多提供者选择代码必须对这两种形式进行标准化处理。

### 3. 假设内置提供者是必需的

如果服务只是 OpenAI 兼容的，自定义提供者可能已经以更少的维护成本解决了用户问题。

### 4. 忘记辅助路径

主聊天路径可能正常工作，而摘要、内存刷新或视觉助手失败，因为辅助路由从未更新。

### 5. 原生提供者分支隐藏在 `run_agent.py` 中

搜索 `api_mode` 和 `self.client.`。不要假设显而易见的请求路径是唯一的路径。

### 6. 将仅适用于 OpenRouter 的参数发送给其他提供者

像提供者路由这样的字段只属于支持它们的提供者。

### 7. 更新了 `hermes model` 但未更新 `hermes setup`

两种流程都需要知道该提供者。

## 实现时的良好搜索目标

如果您正在寻找提供者涉及的所有位置，请搜索以下符号：

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
- [贡献指南](./contributing.md)