---
sidebar_position: 5
title: "添加提供程序"
description: "如何为 Hermes 智能体添加新的推理提供程序——包括认证、运行时解析、CLI 流程、适配器、测试和文档"
---

# 添加提供程序

Hermes 已经可以通过自定义提供程序路径与任何 OpenAI 兼容的端点进行通信。除非您希望为某个服务提供一流的用户体验，否则不要添加内置提供程序：

- 提供程序特定的认证或令牌刷新
- 经过策划的模型目录
- 设置 / `hermes model` 菜单项
- `provider:model` 语法的提供程序别名
- 需要适配器的非 OpenAI API 形状

如果提供程序仅仅是“另一个 OpenAI 兼容的基础 URL 和 API 密钥”，那么一个命名的自定义提供程序可能就足够了。

## 心智模型

一个内置提供程序必须跨多个层面保持一致：

1.  `hermes_cli/auth.py` 决定如何找到凭据。
2.  `hermes_cli/runtime_provider.py` 将其转换为运行时数据：
    -   `provider`
    -   `api_mode`
    -   `base_url`
    -   `api_key`
    -   `source`
3.  `run_agent.py` 使用 `api_mode` 来决定如何构建和发送请求。
4.  `hermes_cli/models.py` 和 `hermes_cli/main.py` 使提供程序显示在 CLI 中。（`hermes_cli/setup.py` 会自动委托给 `main.py`，因此无需在此处进行任何更改。）
5.  `agent/auxiliary_client.py` 和 `agent/model_metadata.py` 负责维持辅助任务和令牌预算的正常工作。

关键的抽象概念是 `api_mode`。

-   大多数提供程序使用 `chat_completions`。
-   Codex 使用 `codex_responses`。
-   Anthropic 使用 `anthropic_messages`。
-   一个新的非 OpenAI 协议通常意味着需要添加一个新的适配器和一个新的 `api_mode` 分支。

## 选择实现路径

### 路径 A — 兼容 OpenAI 的提供方

当提供方接受标准的聊天补全风格请求时使用此路径。

典型工作包括：
- 添加身份验证元数据
- 添加模型目录/别名
- 添加运行时解析
- 添加 CLI 菜单连接
- 添加辅助模型默认值
- 添加测试和用户文档

通常你不需要新的适配器或新的 `api_mode`。

### 路径 B — 原生提供方

当提供方的行为不像 OpenAI 聊天补全时使用此路径。

当前树内示例：
- `codex_responses`
- `anthropic_messages`

此路径包含路径 A 的所有内容，外加：
- 在 `agent/` 中添加一个提供方适配器
- `run_agent.py` 中用于请求构建、调度、用量提取、中断处理和响应规范化的分支
- 适配器测试

## 文件清单

### 所有内置提供方所需

1. `hermes_cli/auth.py`
2. `hermes_cli/models.py`
3. `hermes_cli/runtime_provider.py`
4. `hermes_cli/main.py`
5. `agent/auxiliary_client.py`
6. `agent/model_metadata.py`
7. 测试
8. `website/docs/` 下的用户文档

:::tip
`hermes_cli/setup.py` **不需要**更改。设置向导将提供方/模型选择委托给 `main.py` 中的 `select_provider_and_model()` — 在那里添加的任何提供方都会自动出现在 `hermes setup` 中。
:::

### 原生/非 OpenAI 提供方的额外项

10. `agent/<provider>_adapter.py`
11. `run_agent.py`
12. 如果需要提供方 SDK，则为 `pyproject.toml`

## 快速路径：简单的 API 密钥提供方

如果你的提供方只是一个使用单个 API 密钥进行身份验证的 OpenAI 兼容端点，你不需要接触 `auth.py`、`runtime_provider.py`、`main.py` 或下面完整清单中的任何其他文件。

你只需要：
1. 在 `plugins/model-providers/<your-provider>/` 下创建一个插件目录，包含：
   - `__init__.py` — 在模块级别调用 `register_provider(profile)`
   - `plugin.yaml` — 清单文件（名称、类型：model-provider、版本、描述）
2. 就这样。提供方插件在任何地方首次调用 `get_provider_profile()` 或 `list_providers()` 时会自动加载 — 捆绑插件（此仓库）和用户位于 `$HERMES_HOME/plugins/model-providers/` 的插件都会被拾取。

当你添加插件并调用 `register_provider()` 时，以下内容会自动连接：
1. `auth.py` 中的 `PROVIDER_REGISTRY` 条目（凭据解析、环境变量查找）
2. `api_mode` 设置为 `chat_completions`
3. `base_url` 从配置或声明的环境变量获取
4. 按优先级顺序检查 `env_vars` 以获取 API 密钥
5. 为提供方注册 `fallback_models` 列表
6. `--provider` CLI 标志接受提供方 ID
7. `hermes model` 菜单包含该提供方
8. `hermes setup` 向导自动委托给 `main.py`
9. `provider:model` 别名语法有效
10. 运行时解析器返回正确的 `base_url` 和 `api_key`
11. `--provider <name>` CLI 标志接受提供方 ID
12. 回退模型激活可以干净地切换到该提供方

用户位于 `$HERMES_HOME/plugins/model-providers/<name>/` 的插件会覆盖同名的捆绑插件（在 `register_provider()` 中遵循后写入者胜出原则）— 因此第三方可以无需编辑仓库即可修补或替换任何内置配置文件。

请参阅 `plugins/model-providers/nvidia/` 或 `plugins/model-providers/gmi/` 作为模板，以及完整的[模型提供方插件指南](/developer-guide/model-provider-plugin)以获取字段参考、钩子习惯用法和端到端示例。

## 完整路径：OAuth 和复杂提供方

当你的提供方需要以下任何功能时，请使用下面的完整清单：
- OAuth 或令牌刷新（Nous Portal、Codex、Google Gemini、Qwen Portal、Copilot）
- 非 OpenAI API 形状，需要新的适配器（Anthropic Messages、Codex Responses）
- 自定义端点检测或多区域探测（z.ai、Kimi）
- 精心策划的静态模型目录或实时 `/models` 获取
- 具有定制身份验证流程的提供方特定 `hermes model` 菜单项

## 步骤 1：选择一个规范的提供方 ID

选择一个单一的提供方 ID 并在所有地方使用它。

仓库中的示例：
- `openai-codex`
- `kimi-coding`
- `minimax-cn`

该相同的 ID 应该出现在：
- `hermes_cli/auth.py` 中的 `PROVIDER_REGISTRY`
- `hermes_cli/models.py` 中的 `_PROVIDER_LABELS`
- `hermes_cli/auth.py` 和 `hermes_cli/models.py` 中的 `_PROVIDER_ALIASES`
- `hermes_cli/main.py` 中的 CLI `--provider` 选项
- 设置/模型选择分支
- 辅助模型默认值
- 测试

如果这些文件中的 ID 不同，提供方会感觉连接不完整：身份验证可能有效，但 `/model`、设置或运行时解析会静默失败。

## 步骤 2：在 `hermes_cli/auth.py` 中添加身份验证元数据

对于 API 密钥提供方，向 `PROVIDER_REGISTRY` 添加一个 `ProviderConfig` 条目，包含：
- `id`
- `name`
- `auth_type="api_key"`
- `inference_base_url`
- `api_key_env_vars`
- 可选的 `base_url_env_var`

同时向 `_PROVIDER_ALIASES` 添加别名。

以现有提供方为模板：
- 简单的 API 密钥路径：Z.AI、MiniMax
- 带端点检测的 API 密钥路径：Kimi、Z.AI
- 原生令牌解析：Anthropic
- OAuth/身份验证存储路径：Nous、OpenAI Codex

需要回答的问题：
- Hermes 应该检查哪些环境变量，优先级顺序是什么？
- 提供方需要基础 URL 覆盖吗？
- 需要端点探测或令牌刷新吗？
- 当凭据缺失时，身份验证错误信息应该说什么？

如果提供方需要的不仅仅是“查找 API 密钥”，请添加专用的凭据解析器，而不是将逻辑塞入不相关的分支。

## 步骤 3：在 `hermes_cli/models.py` 中添加模型目录和别名

更新提供方目录，以便提供方在菜单和 `provider:model` 语法中正常工作。

典型编辑包括：
- `_PROVIDER_MODELS`
- `_PROVIDER_LABELS`
- `_PROVIDER_ALIASES`
- `list_available_providers()` 中的提供方显示顺序
- 如果提供方支持实时 `/models` 获取，则为 `provider_model_ids()`

如果提供方暴露了实时模型列表，请优先使用它，并将 `_PROVIDER_MODELS` 作为静态回退。

这个文件也使得以下输入有效：
```text
anthropic:claude-sonnet-4-6
kimi:model-name
```

如果这里缺少别名，提供方可能正确验证身份，但仍然会在 `/model` 解析中失败。

## 步骤 4：在 `hermes_cli/runtime_provider.py` 中解析运行时数据

`resolve_runtime_provider()` 是 CLI、网关、定时任务、ACP 和辅助客户端使用的共享路径。

添加一个返回至少包含以下内容的字典的分支：
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

如果提供方兼容 OpenAI，`api_mode` 通常应保持 `chat_completions`。

注意 API 密钥的优先级。Hermes 已经包含避免将 OpenRouter 密钥泄漏到不相关端点的逻辑。新的提供方应该同样明确哪个密钥对应哪个基础 URL。

## 步骤 5：在 `hermes_cli/main.py` 中连接 CLI

一个提供方直到出现在交互式 `hermes model` 流程中才可被发现。

在 `hermes_cli/main.py` 中更新以下内容：
- `provider_labels` 字典
- `select_provider_and_model()` 中的 `providers` 列表
- 提供方分发（`if selected_provider == ...`）
- `--provider` 参数选项
- 如果提供方支持登录/注销流程，则为登录/注销选项
- 一个 `_model_flow_<provider>()` 函数，或者如果适用则复用 `_model_flow_api_key_provider()`

:::tip
`hermes_cli/setup.py` 不需要更改 — 它从 `main.py` 调用 `select_provider_and_model()`，因此你的新提供方会自动出现在 `hermes model` 和 `hermes setup` 中。
:::

## 步骤 6：保持辅助调用正常工作

这里有两个重要文件：

### `agent/auxiliary_client.py`

如果这是一个直接的 API 密钥提供方向 `_API_KEY_PROVIDER_AUX_MODELS` 添加一个廉价/快速的默认辅助模型。

辅助任务包括：
- 视觉摘要
- 网页提取摘要
- 上下文压缩摘要
- 会话搜索摘要
- 内存刷新

如果提供方没有合理的辅助默认值，辅助任务可能会严重回退或意外地使用昂贵的主模型。

### `agent/model_metadata.py`

添加提供方模型的上下文长度，以便令牌预算、压缩阈值和限制保持合理。

## 步骤 7：如果提供方是原生的，添加适配器和 `run_agent.py` 支持

如果提供方不是普通的聊天补全，请在 `agent/<provider>_adapter.py` 中隔离提供方特定的逻辑。

保持 `run_agent.py` 专注于编排。它应该调用适配器辅助函数，而不是在整个文件中内联手动构建提供方负载。

原生提供方通常需要在以下位置进行工作：

### 新的适配器文件

典型职责：
- 构建 SDK/HTTP 客户端
- 解析令牌
- 将 OpenAI 风格的对话消息转换为提供方的请求格式
- 如果需要，转换工具模式
- 将提供方响应规范化回 `run_agent.py` 期望的格式
- 提取用量和结束原因数据

### `run_agent.py`

搜索 `api_mode` 并审计每个切换点。至少验证：
- `__init__` 选择新的 `api_mode`
- 客户端构造适用于提供方
- `_build_api_kwargs()` 知道如何格式化请求
- `_interruptible_api_call()` 分发到正确的客户端调用
- 中断/客户端重建路径有效
- 响应验证接受提供方的形状
- 结束原因提取正确
- 令牌用量提取正确
- 回退模型激活可以干净地切换到新提供方
- 摘要生成和内存刷新路径仍然有效

同时在 `run_agent.py` 中搜索 `self.client.`。任何假设标准 OpenAI 客户端存在的代码路径，当原生提供方使用不同的客户端对象或 `self.client = None` 时，都可能中断。

### 提示缓存和提供方特定的请求字段

提示缓存和提供方特定的设置很容易回退。

树内已有的示例：
- Anthropic 有原生的提示缓存路径
- OpenRouter 获取提供方路由字段
- 并非每个提供方都应接收每个请求端选项

当你添加一个原生提供方时，请仔细检查 Hermes 是否只发送了该提供方实际理解的字段。

## 第 8 步：测试

至少需要触及负责保护提供者接线的测试。

常见位置：

- `tests/test_runtime_provider_resolution.py`
- `tests/test_cli_provider_resolution.py`
- `tests/test_cli_model_command.py`
- `tests/test_setup_model_selection.py`
- `tests/test_provider_parity.py`
- `tests/test_run_agent.py`
- `tests/test_<provider>_adapter.py` （针对原生提供者）

对于纯文档示例，具体文件集可能有所不同。关键是要覆盖：

- 认证解析
- CLI 菜单 / 提供者选择
- 运行时提供者解析
- 智能体执行路径
- 提供者:模型解析
- 任何适配器特定的消息转换

在禁用 xdist 的情况下运行测试：

```bash
source venv/bin/activate
python -m pytest tests/test_runtime_provider_resolution.py tests/test_cli_provider_resolution.py tests/test_cli_model_command.py tests/test_setup_model_selection.py -n0 -q
```

对于更深入的更改，推送前运行完整测试套件：

```bash
source venv/bin/activate
python -m pytest tests/ -n0 -q
```

## 第 9 步：实时验证

测试完成后，运行真实的冒烟测试。

```bash
source venv/bin/activate
python -m hermes_cli.main chat -q "Say hello" --provider your-provider --model your-model
```

如果更改了菜单，也测试交互式流程：

```bash
source venv/bin/activate
python -m hermes_cli.main model
python -m hermes_cli.main setup
```

对于原生提供者，除了纯文本响应外，至少验证一个工具调用。

## 第 10 步：更新面向用户的文档

如果该提供者旨在作为一级选项发布，也需要更新用户文档：

- `website/docs/getting-started/quickstart.md`
- `website/docs/user-guide/configuration.md`
- `website/docs/reference/environment-variables.md`

开发者可能完美地接线了提供者，却仍然让用户无法发现所需的环境变量或设置流程。

## OpenAI 兼容提供者检查清单

如果提供者是标准的聊天补全接口，请使用此清单。

- [ ] 在 `hermes_cli/auth.py` 中添加了 `ProviderConfig`
- [ ] 在 `hermes_cli/auth.py` 和 `hermes_cli/models.py` 中添加了别名
- [ ] 在 `hermes_cli/models.py` 中添加了模型目录
- [ ] 在 `hermes_cli/runtime_provider.py` 中添加了运行时分支
- [ ] 在 `hermes_cli/main.py` 中添加了 CLI 接线 (setup.py 自动继承)
- [ ] 在 `agent/auxiliary_client.py` 中添加了辅助模型
- [ ] 在 `agent/model_metadata.py` 中添加了上下文长度
- [ ] 更新了运行时 / CLI 测试
- [ ] 更新了用户文档

## 原生提供者检查清单

当提供者需要新的协议路径时使用。

- [ ] OpenAI 兼容清单中的所有项目
- [ ] 在 `agent/<provider>_adapter.py` 中添加了适配器
- [ ] 在 `run_agent.py` 中支持了新的 `api_mode`
- [ ] 中断 / 重建路径工作正常
- [ ] 用量和完成原因提取工作正常
- [ ] 回退路径工作正常
- [ ] 添加了适配器测试
- [ ] 实时冒烟测试通过

## 常见陷阱

### 1. 添加了提供者到认证但未添加到模型解析

这会导致凭据解析正确，而 `/model` 和 `provider:model` 输入失败。

### 2. 忘记 `config["model"]` 可以是字符串或字典

很多提供者选择代码需要规范化这两种形式。

### 3. 假设需要内置提供者

如果服务只是 OpenAI 兼容的，自定义提供者可能已经以更少的维护解决了用户问题。

### 4. 忘记辅助路径

主聊天路径可能工作正常，而摘要、内存刷新或视觉助手因辅助路由从未更新而失败。

### 5. 隐藏在 `run_agent.py` 中的原生提供者分支

搜索 `api_mode` 和 `self.client.`。不要假设明显的请求路径是唯一的。

### 6. 将 OpenRouter 专用设置发送给其他提供者

像提供者路由这样的字段仅属于支持它们的提供者。

### 7. 更新了 `hermes model` 但未更新 `hermes setup`

两个流程都需要知道该提供者。

## 实施时的良好搜索目标

如果你正在寻找提供者涉及的所有位置，请搜索这些符号：

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