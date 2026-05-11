---
sidebar_position: 4
title: "提供商运行时解析"
description: "Hermes 如何在运行时解析提供商、凭证、API 模式和辅助模型"
---

# 提供商运行时解析

Hermes 在以下组件间共享一个提供商运行时解析器：

- CLI
- 网关
- 定时任务
- ACP
- 辅助模型调用

主要实现位于：

- `hermes_cli/runtime_provider.py` — 凭证解析，`_resolve_custom_runtime()`
- `hermes_cli/auth.py` — 提供商注册表，`resolve_provider()`
- `hermes_cli/model_switch.py` — 共享的 `/model` 切换管道（CLI + 网关）
- `agent/auxiliary_client.py` — 辅助模型路由
- `providers/` — ABC 和注册表入口点（`ProviderProfile`、`register_provider`、`get_provider_profile`、`list_providers`）
- `plugins/model-providers/<name>/` — 每个提供商的插件（内置），声明 `api_mode`、`base_url`、`env_vars`、`fallback_models` 并在首次访问时将自身注册到注册表。位于 `$HERMES_HOME/plugins/model-providers/<name>/` 的用户插件会覆盖同名的内置插件。

`providers/` 中的 `get_provider_profile()` 函数为给定的提供商 ID 返回一个 `ProviderProfile`。`runtime_provider.py` 在解析时调用此函数，以获取规范的 `base_url`、`env_vars` 优先级列表、`api_mode` 和 `fallback_models`，而无需在多个文件中重复这些数据。在 `plugins/model-providers/<your-provider>/`（或 `$HERMES_HOME/plugins/model-providers/<your-provider>/`）下添加一个新插件，该插件调用 `register_provider()`，就足以让 `runtime_provider.py` 识别它——无需在解析器本身中添加分支。

如果您尝试添加一个新的顶级推理提供商，请在阅读此页面的同时，阅读[添加提供商](./adding-providers.md)和[模型提供商插件指南](./model-provider-plugin.md)。

## 解析优先级

在高级别上，提供商解析使用以下顺序：

1.  显式的 CLI/运行时请求
2.  `config.yaml` 中的模型/提供商配置
3.  环境变量
4.  提供商特定的默认值或自动解析

这种顺序很重要，因为 Hermes 将保存的模型/提供商选择视为正常运行的权威来源。这可以防止过时的 shell 导出静默覆盖用户上次在 `hermes model` 中选择的端点。

## 提供商

当前的提供商家族包括（完整内置集请参见 `plugins/model-providers/`）：

- AI Gateway (Vercel)
- OpenRouter
- Nous Portal
- OpenAI Codex
- Copilot / Copilot ACP
- Anthropic (原生)
- Google / Gemini (`gemini`, `google-gemini-cli`)
- Alibaba / DashScope (`alibaba`, `alibaba-coding-plan`)
- DeepSeek
- Z.AI
- Kimi / Moonshot (`kimi-coding`, `kimi-coding-cn`)
- MiniMax (`minimax`, `minimax-cn`, `minimax-oauth`)
- Kilo Code
- Hugging Face
- OpenCode Zen / OpenCode Go
- AWS Bedrock
- Azure Foundry
- NVIDIA NIM
- xAI (Grok)
- Arcee
- GMI Cloud
- StepFun
- Qwen OAuth
- Xiaomi
- Ollama Cloud
- LM Studio
- Tencent TokenHub
- 自定义 (`provider: custom`) — 面向任何 OpenAI 兼容端点的顶级提供商
- 命名自定义提供商（config.yaml 中的 `custom_providers` 列表）

## 运行时解析的输出

运行时解析器返回如下数据：

- `provider`
- `api_mode`
- `base_url`
- `api_key`
- `source`
- 提供商特定的元数据，如过期/刷新信息

## 为什么这很重要

此解析器是 Hermes 能够在以下组件间共享认证/运行时逻辑的主要原因：

- `hermes chat`
- 网关消息处理
- 在新会话中运行的定时任务
- ACP 编辑器会话
- 辅助模型任务

## AI Gateway

在 `~/.hermes/.env` 中设置 `AI_GATEWAY_API_KEY` 并使用 `--provider ai-gateway` 运行。Hermes 从网关的 `/models` 端点获取可用模型，并筛选出支持工具调用的语言模型。

## OpenRouter、AI Gateway 和自定义 OpenAI 兼容基础 URL

Hermes 包含逻辑，以避免在存在多个提供商密钥（例如 `OPENROUTER_API_KEY`、`AI_GATEWAY_API_KEY` 和 `OPENAI_API_KEY`）时，将错误的 API 密钥泄露到自定义端点。

每个提供商的 API 密钥仅限于其自身的基础 URL：

- `OPENROUTER_API_KEY` 仅发送到 `openrouter.ai` 端点
- `AI_GATEWAY_API_KEY` 仅发送到 `ai-gateway.vercel.sh` 端点
- `OPENAI_API_KEY` 用于自定义端点，并作为后备

Hermes 还区分：

- 用户选择的真正自定义端点
- 未配置自定义端点时使用的 OpenRouter 后备路径

这种区分对于以下情况尤其重要：

- 本地模型服务器
- 非 OpenRouter / 非 AI Gateway 的 OpenAI 兼容 API
- 切换提供商而无需重新运行设置
- 即使在当前 shell 中未导出 `OPENAI_BASE_URL`，通过 config.yaml 保存的自定义端点也应能继续工作

## 原生 Anthropic 路径

Anthropic 不再仅仅是“通过 OpenRouter”使用。

当提供商解析选择 `anthropic` 时，Hermes 使用：

- `api_mode = anthropic_messages`
- 原生 Anthropic Messages API
- `agent/anthropic_adapter.py` 进行转换

原生 Anthropic 的凭证解析现在优先使用可刷新的 Claude Code 凭证，而不是复制的环境变量令牌（当两者都存在时）。在实践中这意味着：

- 当 Claude Code 凭证文件包含可刷新的认证信息时，它们被视为首选来源
- 手动设置的 `ANTHROPIC_TOKEN` / `CLAUDE_CODE_OAUTH_TOKEN` 值仍然作为显式覆盖有效
- Hermes 在发起原生 Messages API 调用前会预先刷新 Anthropic 凭证
- 作为后备路径，Hermes 在重建 Anthropic 客户端后，仍会在收到 401 错误时重试一次

## OpenAI Codex 路径

Codex 使用单独的 Responses API 路径：

- `api_mode = codex_responses`
- 专用的凭证解析和认证存储支持

## 辅助模型路由

辅助任务，例如：

- 视觉处理
- 网页提取摘要
- 上下文压缩摘要
- 会话搜索摘要
- 技能中心操作
- MCP 助手操作
- 记忆刷新

可以使用它们自己的提供商/模型路由，而不是主对话模型。

当辅助任务配置的提供商为 `main` 时，Hermes 通过与正常聊天相同的共享运行时路径解析它。在实践中这意味着：

- 环境变量驱动的自定义端点仍然有效
- 通过 `hermes model` / `config.yaml` 保存的自定义端点也有效
- 辅助路由可以区分真正保存的自定义端点和 OpenRouter 后备路径

## 后备模型

Hermes 支持配置的后备提供商链——当主模型遇到错误时，按顺序尝试的 `(provider, model)` 条目列表。为保持向后兼容，旧版的单对 `fallback_model` 字典仍被接受（并在首次写入时迁移）。

### 内部工作原理

1.  **存储**：`AIAgent.__init__` 存储 `fallback_model` 字典并设置 `_fallback_activated = False`。

2.  **触发点**：在 `run_agent.py` 的主重试循环中，从三个地方调用 `_try_activate_fallback()`：
    - 在无效 API 响应（None choices、缺失内容）达到最大重试次数后
    - 在遇到不可重试的客户端错误（HTTP 401、403、404）时
    - 在遇到瞬时错误（HTTP 429、500、502、503）达到最大重试次数后

3.  **激活流程** (`_try_activate_fallback`)：
    - 如果已激活或未配置，立即返回 `False`
    - 调用 `auxiliary_client.py` 中的 `resolve_provider_client()` 构建具有适当认证的新客户端
    - 确定 `api_mode`：`openai-codex` 使用 `codex_responses`，`anthropic` 使用 `anthropic_messages`，其他所有情况使用 `chat_completions`
    - 就地交换：`self.model`、`self.provider`、`self.base_url`、`self.api_mode`、`self.client`、`self._client_kwargs`
    - 对于 anthropic 后备：构建原生 Anthropic 客户端，而不是 OpenAI 兼容客户端
    - 重新评估提示缓存（对 OpenRouter 上的 Claude 模型启用）
    - 设置 `_fallback_activated = True` — 防止再次触发
    - 将重试计数重置为 0 并继续循环

4.  **配置流程**：
    - CLI：`cli.py` 读取 `CLI_CONFIG["fallback_model"]` → 传递给 `AIAgent(fallback_model=...)`
    - 网关：`gateway/run.py._load_fallback_model()` 读取 `config.yaml` → 传递给 `AIAgent`
    - 验证：`provider` 和 `model` 键都必须非空，否则后备功能将被禁用

### 哪些不支持后备

- **子智能体委派** (`tools/delegate_tool.py`)：子智能体继承父智能体的提供商，但不继承后备配置
- **辅助任务**：使用它们自己独立的提供商自动检测链（参见上面的辅助模型路由）

定时任务**支持**后备：`run_job()` 从 `config.yaml` 读取 `fallback_providers`（或旧版 `fallback_model`）并将其传递给 `AIAgent(fallback_model=...)`，与网关的 `_load_fallback_model()` 模式匹配。参见 [Cron 内部机制](./cron-internals.md)。

### 测试覆盖

有关涵盖所有支持的提供商、单次执行语义和边缘情况的全面测试，请参见 `tests/test_fallback_model.py`。

## 相关文档

- [智能体循环内部机制](./agent-loop.md)
- [ACP 内部机制](./acp-internals.md)
- [上下文压缩与提示缓存](./context-compression-and-caching.md)