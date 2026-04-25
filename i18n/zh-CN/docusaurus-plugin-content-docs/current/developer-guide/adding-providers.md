---
sidebar_position: 5
title: "添加提供商"
description: "如何为 Hermes 智能体添加新的推理提供商 — 认证、运行时解析、CLI 流程、适配器、测试和文档"
---

# 添加提供商

Hermes 已经可以通过自定义提供商路径与任何兼容 OpenAI 的端点通信。除非您希望为该服务提供一流的 UX，否则请不要添加内置提供商：

- 特定于提供商的认证或令牌刷新
- 精选模型目录
- 设置 / `hermes model` 菜单项
- `provider:model` 语法的提供商别名
- 需要适配器的非 OpenAI API 结构

如果提供商仅仅是“另一个兼容 OpenAI 的基础 URL 和 API 密钥”，则命名自定义提供商可能就足够了。

## 心智模型

内置提供商必须在多个层级上保持一致：

1. `hermes_cli/auth.py` 决定如何查找凭据。
2. `hermes_cli/runtime_provider.py` 将其转换为运行时数据：
   - `provider`
   - `api_mode`
   - `base_url`
   - `api_key`
   - `source`
3. `run_agent.py` 使用 `api_mode` 决定如何构建和发送请求。
4. `hermes_cli/models.py` 和 `hermes_cli/main.py` 使提供商在 CLI 中可见。（`hermes_cli/setup.py` 自动委托给 `main.py` — 无需更改。）
5. `agent/auxiliary_client.py` 和 `agent/model_metadata.py` 保持辅助任务和令牌预算功能正常运行。

关键的抽象是 `api_mode`。

- 大多数提供商使用 `chat_completions`。
- Codex 使用 `codex_responses`。
- Anthropic 使用 `anthropic_messages`。
- 新的非 OpenAI 协议通常意味着添加新的适配器和新的 `api_mode` 分支。

## 首先选择实现路径

### 路径 A — 兼容 OpenAI 的提供商

当提供商接受标准聊天完成式请求时使用此路径。

典型工作：

- 添加认证元数据
- 添加模型目录 / 别名
- 添加运行时解析
- 添加 CLI 菜单连接
- 添加辅助模型默认值
- 添加测试和用户文档

通常不需要新的适配器或新的 `api_mode`。

### 路径 B — 原生提供商

当提供商的行为不像 OpenAI 聊天完成时，使用此路径。

当前树中的示例：

- `codex_responses`
- `anthropic_messages`

此路径包括路径 A 的所有内容，外加：

- `agent/` 中的提供商适配器
- `run_agent.py` 的分支用于请求构建、调度、使用情况提取、中断处理和响应标准化
- 适配器测试

## 文件清单

### 每个内置提供商必需的文件

1. `hermes_cli/auth.py`
2. `hermes_cli/models.py`
3. `hermes_cli/runtime_provider.py`
4. `hermes_cli/main.py`
5. `agent/auxiliary_client.py`
6. `agent/model_metadata.py`
7. 测试
8. `website/docs/` 下的面向用户的文档

:::tip
无需修改 `hermes_cli/setup.py`。设置向导将提供商/模型选择委托给 `main.py` 中的 `select_provider_and_model()` — 在此处添加的任何提供商都会自动在 `hermes setup` 中可用。
:::

### 原生 / 非 OpenAI 提供商的额外文件

10. `agent/<provider>_adapter.py`
11. `run_agent.py`
12. 如果提供商 SDK 必需，则为 `pyproject.toml`

## 步骤 1：选择一个规范提供商 ID

选择一个单一的提供商 ID 并在所有地方使用它。

仓库中的示例：

- `openai-codex`
- `kimi-coding`
- `minimax-cn`

该 ID 应出现在以下位置：

- `hermes_cli/auth.py` 中的 `PROVIDER_REGISTRY`
- `hermes_cli/models.py` 中的 `_PROVIDER_LABELS`
- `hermes_cli/auth.py` 和 `hermes_cli/models.py` 中的 `_PROVIDER_ALIASES`
- `hermes_cli/main.py` 中的 CLI `--provider` 选项
- 设置 / 模型选择分支
- 辅助模型默认值
- 测试

如果这些文件中的 ID 不同，提供商可能会感觉半连接：认证可能有效，但 `/model`、设置或运行时解析可能会静默忽略它。

## 步骤 2：在 `hermes_cli/auth.py` 中添加认证元数据

对于 API 密钥提供商，向 `PROVIDER_REGISTRY` 添加一个 `ProviderConfig` 条目，包含：

- `id`
- `name`
- `auth_type="api_key"`
- `inference_base_url`
- `api_key_env_vars`
- 可选的 `base_url_env_var`

还要向 `_PROVIDER_ALIASES` 添加别名。

使用现有提供商作为模板：

- 简单 API 密钥路径：Z.AI、MiniMax
- 带端点检测的 API 密钥路径：Kimi、Z.AI
- 原生令牌解析：Anthropic
- OAuth / 认证存储路径：Nous、OpenAI Codex

此处要回答的问题：

- Hermes 应该检查哪些环境变量，以及优先级顺序是什么？
- 提供商是否需要基础 URL 覆盖？
- 是否需要端点探测或令牌刷新？
- 当凭据缺失时，认证错误应该说什么？

如果提供商需要的不仅仅是“查找 API 密钥”，请添加专用的凭据解析器，而不是将逻辑塞入不相关的分支。

## 步骤 3：在 `hermes_cli/models.py` 中添加模型目录和别名

更新提供商目录，使提供商在菜单中和 `provider:model` 语法中可用。

典型编辑：

- `_PROVIDER_MODELS`
- `_PROVIDER_LABELS`
- `_PROVIDER_ALIASES`
- `list_available_providers()` 中提供商显示顺序
- 如果提供商支持实时 `/models` 获取，则为 `provider_model_ids()`

如果提供商暴露了实时模型列表，请优先使用它，并将 `_PROVIDER_MODELS` 保留为静态回退。

此文件还使以下输入能够正常工作：

```text
anthropic:claude-sonnet-4-6
kimi:model-name
```

如果此处缺少别名，提供商可能正确认证但仍会在 `/model` 解析中失败。

## 步骤 4：在 `hermes_cli/runtime_provider.py` 中解析运行时数据

`resolve_runtime_provider()` 是由 CLI、网关、cron、ACP 和辅助客户端共享的路径。

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

如果提供商兼容 OpenAI，`api_mode` 通常应保持为 `chat_completions`。

注意 API 密钥优先级。Hermes 已包含避免将 OpenRouter 密钥泄露给不相关端点的逻辑。新提供商也应明确说明哪个密钥发送到哪个基础 URL。

## 步骤 5：在 `hermes_cli/main.py` 中连接 CLI

直到提供商出现在交互式 `hermes model` 流程中，它才可见。

更新 `hermes_cli/main.py` 中的以下内容：

- `provider_labels` 字典
- `select_provider_and_model()` 中的 `providers` 列表
- 提供商调度（`if selected_provider == ...`）
- `--provider` 参数选项
- 如果提供商支持这些流程，则为登录/注销选项
- `_model_flow_<provider>()` 函数，或重用 `_model_flow_api_key_provider()`（如果适用）

:::tip
无需修改 `hermes_cli/setup.py` — 它调用 `main.py` 中的 `select_provider_and_model()`，因此您的新提供商会自动出现在 `hermes model` 和 `hermes setup` 中。
:::

## 步骤 6：保持辅助调用正常工作

与此相关的两个文件：

### `agent/auxiliary_client.py`

如果是直接 API 密钥提供商，请向 `_API_KEY_PROVIDER_AUX_MODELS` 添加廉价 / 快速默认辅助模型。

辅助任务包括：

- 视觉摘要
- Web 提取摘要
- 上下文压缩摘要
- 会话搜索摘要
- 内存刷新

如果提供商没有合理的辅助默认值，侧边任务可能会严重回退，或者意外使用昂贵的主模型。

### `agent/model_metadata.py`

为提供商模型的上下文长度添加数据，以保持令牌预算、压缩阈值和限制合理。

## 步骤 7：如果提供商是原生的，添加适配器和 `run_agent.py` 支持

如果提供商不是简单的聊天完成，请在 `agent/<provider>_adapter.py` 中隔离提供商特定的逻辑。

保持 `run_agent.py` 专注于编排。它应该调用适配器辅助函数，而不是在整个文件中内联构建提供商负载。

原生提供商通常需要在这些位置进行工作：

### 新适配器文件

典型职责：

- 构建 SDK / HTTP 客户端
- 解析令牌
- 将 OpenAI 风格对话消息转换到提供商的请求格式
- 如果需要，转换工具模式
- 将提供商响应标准化为 `run_agent.py` 期望的内容
- 提取使用情况和完成原因数据

### `run_agent.py`

搜索 `api_mode` 并审计每个开关点。至少验证：

- `__init__` 选择新的 `api_mode`
- 客户端构建适用于提供商
- `_build_api_kwargs()` 知道如何格式化请求
- `_interruptible_api_call()` 调度到正确的客户端调用
- 中断 / 重建路径有效
- 响应验证接受提供商的形状
- 完成原因提取正确
- 令牌使用情况提取正确
- 回退模型激活可以干净地切换到新提供商
- 摘要生成和内存刷新路径仍然有效

还要搜索 `run_agent.py` 中的 `self.client.`。任何假设标准 OpenAI 客户端存在的代码路径在原生提供商使用不同的客户端对象或 `self.client = None` 时都可能损坏。

### 提示缓存和提供商特定的请求字段

提示缓存和提供商特定的旋钮很容易回归。

树中已有的示例：

- Anthropic 有原生的提示缓存路径
- OpenRouter 获得提供商路由字段
- 并非每个提供商都应接收每个请求侧选项

添加原生提供商时，请仔细检查 Hermes 是否只发送提供商实际理解的字段。

## 步骤 8：测试

至少接触保护提供商连接的测试。

常见位置：

- `tests/test_runtime_provider_resolution.py`
- `tests/test_cli_provider_resolution.py`
- `tests/test_cli_model_command.py`
- `tests/test_setup_model_selection.py`
- `tests/test_provider_parity.py`
- `tests/test_run_agent.py`
- 原生提供商为 `tests/test_<provider>_adapter.py`

对于仅文档示例，确切文件集可能不同。关键是覆盖：

- 认证解析
- CLI 菜单 / 提供商选择
- 运行时提供商解析
- 代理执行路径
- provider:model 解析
- 任何适配器特定的消息转换

禁用 xdist 运行测试：

```bash
source venv/bin/activate
python -m pytest tests/test_runtime_provider_resolution.py tests/test_cli_provider_resolution.py tests/test_cli_model_command.py tests/test_setup_model_selection.py -n0 -q
```

对于更深层更改，推送前运行完整套件：

```bash
source venv/bin/activate
python -m pytest tests/ -n0 -q
```

## 步骤 9：实时验证

测试后，运行真实冒烟测试。

```bash
source venv/bin/activate
python -m hermes_cli.main chat -q "Say hello" --provider your-provider --model your-model
```

如果您更改了菜单，还要测试交互式流程：

```bash
source venv/bin/activate
python -m hermes_cli.main model
python -m hermes_cli.main setup
```

对于原生提供商，不仅要验证纯文本响应，至少要验证一个工具调用。

## 步骤 10：更新面向用户的文档

如果提供商打算作为一流选项发布，还要更新用户文档：

- `website/docs/getting-started/quickstart.md`
- `website/docs/user-guide/configuration.md`
- `website/docs/reference/environment-variables.md`

开发人员可以完美地连接提供商，但仍可能让用户无法发现所需的环境变量或设置流程。

## 兼容 OpenAI 的提供商清单

如果提供商是标准聊天完成时使用此清单。

- [ ] 在 `hermes_cli/auth.py` 中添加 `ProviderConfig`
- [ ] 在 `hermes_cli/auth.py` 和 `hermes_cli/models.py` 中添加别名
- [ ] 在 `hermes_cli/models.py` 中添加模型目录
- [ ] 在 `hermes_cli/runtime_provider.py` 中添加运行时分支
- [ ] 在 `hermes_cli/main.py` 中添加 CLI 连接（setup.py 自动继承）
- [ ] 在 `agent/auxiliary_client.py` 中添加辅助模型
- [ ] 在 `agent/model_metadata.py` 中添加上下文长度
- [ ] 更新运行时 / CLI 测试
- [ ] 更新用户文档

## 原生提供商清单

当提供商需要新的协议路径时使用此清单。

- [ ] OpenAI 兼容清单中的所有项目
- [ ] 在 `agent/<provider>_adapter.py` 中添加适配器
- [ ] 在 `run_agent.py` 中支持新的 `api_mode`
- [ ] 中断 / 重建路径有效
- [ ] 使用情况和完成原因提取有效
- [ ] 回退路径有效
- [ ] 添加适配器测试
- [ ] 通过实时冒烟测试

## 常见陷阱

### 1. 添加到认证但未添加到模型解析

这使得凭据正确解析，而 `/model` 和 `provider:model` 输入失败。

### 2. 忘记 `config["model"]` 可以是字符串或字典

许多提供商选择代码必须规范化这两种形式。

### 3. 假设需要内置提供商

如果服务只是兼容 OpenAI，自定义提供商可能已经用更少的维护解决了用户问题。

### 4. 忘记辅助路径

主聊天路径可能有效，但由于辅助路由从未更新，摘要、内存刷新或视觉助手可能会失败。

### 5. 原生提供商分支隐藏在 `run_agent.py` 中

搜索 `api_mode` 和 `self.client.`。不要假设明显的请求路径是唯一路径。

### 6. 将 OpenRouter 特有的旋钮发送给其他提供商

像提供商路由这样的字段只属于支持它们的提供商。

### 7. 更新 `hermes model` 但未更新 `hermes setup`

两个流程都需要了解提供商。

## 实施时的良好搜索目标

如果您正在查找提供商触及的所有位置，请搜索这些符号：

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

- [提供商运行时解析](./provider-runtime.md)
- [架构](./architecture.md)
- [贡献指南](./contributing.md)