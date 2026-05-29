---
sidebar_position: 4
title: "提供商运行时解析"
description: "Hermes如何在运行时解析提供商、凭据、API模式和辅助模型"
---

# 提供商运行时解析

Hermes 有一个跨以下组件共享的提供商运行时解析器：

- CLI
- 网关
- 定时任务
- ACP
- 辅助模型调用

主要实现位于：

- `hermes_cli/runtime_provider.py` — 凭据解析、`_resolve_custom_runtime()`
- `hermes_cli/auth.py` — 提供商注册表、`resolve_provider()`
- `hermes_cli/model_switch.py` — 共享的 `/model` 切换流程（CLI + 网关）
- `agent/auxiliary_client.py` — 辅助模型路由
- `providers/` — ABC + 注册表入口点（`ProviderProfile`、`register_provider`、`get_provider_profile`、`list_providers`）
- `plugins/model-providers/<name>/` — 各提供商的插件（内置），声明 `api_mode`、`base_url`、`env_vars`、`fallback_models` 并在首次访问时注册到注册表。位于 `$HERMES_HOME/plugins/model-providers/<name>/` 的用户插件会覆盖同名的内置插件。

`providers/` 中的 `get_provider_profile()` 函数为给定的提供商 ID 返回一个 `ProviderProfile`。`runtime_provider.py` 在解析时调用它以获取规范的 `base_url`、`env_vars` 优先级列表、`api_mode` 和 `fallback_models`，而无需在多个文件中重复这些数据。只需在 `plugins/model-providers/<your-provider>/`（或 `$HERMES_HOME/plugins/model-providers/<your-provider>/`）下添加一个新插件，并调用 `register_provider()`，`runtime_provider.py` 就能获取它——解析器本身无需添加分支。

如果你正在尝试添加一个新的第一方推理提供商，请在阅读本页的同时参阅[添加提供商](./adding-providers.md)和[模型提供商插件指南](./model-provider-plugin.md)。

## 解析优先级

从高层级来看，提供商解析使用以下顺序：

1.  显式的 CLI/运行时请求
2.  `config.yaml` 中的模型/提供商配置
3.  环境变量
4.  提供商特定的默认值或自动解析

这个顺序很重要，因为 Hermes 将保存的模型/提供商选择作为正常运行时的权威来源。这可以防止一个过时的 shell 导出静默覆盖用户上次在 `hermes model` 中选择的端点。

## 提供商

当前的提供商系列包括（完整的内置集合见 `plugins/model-providers/`）：

- OpenRouter
- Nous Portal
- OpenAI Codex
- Copilot / Copilot ACP
- Anthropic（原生）
- Google / Gemini（`gemini`、`google-gemini-cli`）
- Alibaba / DashScope（`alibaba`、`alibaba-coding-plan`）
- DeepSeek
- Z.AI
- Kimi / Moonshot（`kimi-coding`、`kimi-coding-cn`）
- MiniMax（`minimax`、`minimax-cn`、`minimax-oauth`）
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
- 自定义（`provider: custom`）— 用于任何 OpenAI 兼容端点的第一方提供商
- 命名的自定义提供商（`config.yaml` 中的 `custom_providers` 列表）

## 运行时解析的输出

运行时解析器返回如下数据：

- `provider`
- `api_mode`
- `base_url`
- `api_key`
- `source`
- 提供商特定的元数据，如过期/刷新信息

## 重要性

该解析器是 Hermes 能够在以下场景间共享认证/运行时逻辑的主要原因：

- `hermes chat`
- 网关消息处理
- 在新会话中运行的定时任务
- ACP 编辑器会话
- 辅助模型任务

## OpenRouter 和自定义 OpenAI 兼容基础 URL

Hermes 包含逻辑，以在存在多个提供商密钥时（例如 `OPENROUTER_API_KEY` 和 `OPENAI_API_KEY`），避免将错误的 API 密钥泄漏到自定义端点。

每个提供商的 API 密钥仅限于其自身的基础 URL：

- `OPENROUTER_API_KEY` 仅发送到 `openrouter.ai` 端点
- `OPENAI_API_KEY` 用于自定义端点并作为回退

Hermes 还区分：

- 用户选择的真实自定义端点
- 当未配置自定义端点时使用的 OpenRouter 回退路径

这种区分对于以下情况尤为重要：

- 本地模型服务器
- 非 OpenRouter 的 OpenAI 兼容 API
- 切换提供商而无需重新运行设置
- 通过 `hermes model` / `config.yaml` 保存的自定义端点，即使当前 shell 中未导出 `OPENAI_BASE_URL`，也应继续工作

## 原生 Anthropic 路径

Anthropic 不再仅仅是“通过 OpenRouter”。

当提供商解析选择 `anthropic` 时，Hermes 使用：

- `api_mode = anthropic_messages`
- 原生的 Anthropic Messages API
- `agent/anthropic_adapter.py` 进行转换

原生 Anthropic 的凭据解析现在倾向于使用可刷新的 Claude Code 凭据，而不是复制的环境变量令牌（当两者都存在时）。实际上这意味着：

- 当 Claude Code 凭据文件包含可刷新认证时，它们被视为首选来源
- 手动设置的 `ANTHROPIC_TOKEN` / `CLAUDE_CODE_OAUTH_TOKEN` 值仍可作为显式覆盖生效
- Hermes 在调用原生 Messages API 前会预先检查 Anthropic 凭据刷新
- 在重建 Anthropic 客户端后遇到 401 错误时，Hermes 仍会重试一次，作为回退路径

## OpenAI Codex 路径

Codex 使用一个单独的 Responses API 路径：

- `api_mode = codex_responses`
- 专用的凭据解析和认证存储支持

## 辅助模型路由

辅助任务，例如：

- 视觉处理
- 网页提取摘要
- 上下文压缩摘要
- 技能中心操作
- MCP 辅助操作
- 记忆刷新

可以使用其自身的提供商/模型路由，而不是主对话模型。

当一个辅助任务配置为使用 `main` 提供商时，Hermes 通过与正常聊天相同的共享运行时路径来解析它。实际上这意味着：

- 环境变量驱动的自定义端点仍然有效
- 通过 `hermes model` / `config.yaml` 保存的自定义端点也有效
- 辅助路由可以区分真实保存的自定义端点和 OpenRouter 回退

## 回退模型

Hermes 支持配置的回退提供商链——当主模型遇到错误时，按顺序尝试的一系列 `(provider, model)` 条目列表。为向后兼容，旧的单一 `fallback_model` 字典仍然被接受（并在首次写入时迁移）。

### 内部工作原理

1.  **存储**：`AIAgent.__init__` 存储 `fallback_model` 字典并设置 `_fallback_activated = False`。

2.  **触发点**：在 `run_agent.py` 的主重试循环中，从三个地方调用 `_try_activate_fallback()`：
    - 在对无效 API 响应（None choices、缺少内容）重试次数耗尽后
    - 在不可重试的客户端错误时（HTTP 401、403、404）
    - 在对瞬时错误（HTTP 429、500、502、503）重试次数耗尽后

3.  **激活流程** (`_try_activate_fallback`)：
    - 如果已激活或未配置，立即返回 `False`
    - 调用 `auxiliary_client.py` 中的 `resolve_provider_client()` 来构建具有正确认证的新客户端
    - 确定 `api_mode`：`codex_responses` 用于 openai-codex，`anthropic_messages` 用于 anthropic，`chat_completions` 用于其他情况
    - 原地替换：`self.model`、`self.provider`、`self.base_url`、`self.api_mode`、`self.client`、`self._client_kwargs`
    - 对于 anthropic 回退：构建原生 Anthropic 客户端，而不是 OpenAI 兼容客户端
    - 重新评估提示缓存（对 OpenRouter 上的 Claude 模型启用）
    - 设置 `_fallback_activated = True` — 防止再次触发
    - 将重试计数重置为 0 并继续循环

4.  **配置流程**：
    - CLI：`cli.py` 读取 `CLI_CONFIG["fallback_model"]` → 传递给 `AIAgent(fallback_model=...)`
    - 网关：`gateway/run.py._load_fallback_model()` 读取 `config.yaml` → 传递给 `AIAgent`
    - 验证：`provider` 和 `model` 键必须非空，否则禁用回退

### 不支持回退的情况

- **子智能体委托** (`tools/delegate_tool.py`)：子智能体继承父智能体的提供商，但不继承回退配置
- **辅助任务**：使用其自身独立的提供商自动检测链（参见上面的辅助模型路由）

定时任务 **支持**回退：`run_job()` 从 `config.yaml` 读取 `fallback_providers`（或旧的 `fallback_model`）并传递给 `AIAgent(fallback_model=...)`，与网关的 `_load_fallback_model()` 模式一致。参见[定时任务内部机制](./cron-internals.md)。

### 测试覆盖

回退行为在多个测试套件中得到了验证：

- `tests/run_agent/test_fallback_credential_isolation.py` — 主模型和回退模型之间的凭据隔离
- `tests/hermes_cli/test_fallback_cmd.py` — `/fallback` CLI 命令
- `tests/gateway/test_fallback_eviction.py` — 网关对失败提供商的驱逐

## 相关文档

- [智能体循环内部机制](./agent-loop.md)
- [ACP 内部机制](./acp-internals.md)
- [上下文压缩与提示缓存](./context-compression-and-caching.md)