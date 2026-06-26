---
sidebar_position: 4
title: "Provider Runtime Resolution"
description: "How Hermes resolves providers, credentials, API modes, and auxiliary models at runtime"
---

# 提供商运行时解析

Hermes 在以下模块之间共享一个提供商运行时解析器：

- CLI
- 网关
- cron 任务
- ACP
- 辅助模型调用

主要实现：

- `hermes_cli/runtime_provider.py` — 凭证解析，`_resolve_custom_runtime()`
- `hermes_cli/auth.py` — 提供商注册表，`resolve_provider()`
- `hermes_cli/model_switch.py` — 共享的 `/model` 切换管道（CLI + 网关）
- `agent/auxiliary_client.py` — 辅助模型路由
- `providers/` — ABC + 注册表入口点（`ProviderProfile`、`register_provider`、`get_provider_profile`、`list_providers`）
- `plugins/model-providers/<name>/` — 每个提供商的插件（捆绑），声明 `api_mode`、`base_url`、`env_vars`、`fallback_models`，并在首次访问时自行注册到注册表中。用户插件位于 `$HERMES_HOME/plugins/model-providers/<name>/`，会覆盖同名的捆绑插件。

`providers/` 中的 `get_provider_profile()` 根据给定的提供商 ID 返回一个 `ProviderProfile`。`runtime_provider.py` 在解析时调用此函数，以获取规范的 `base_url`、`env_vars` 优先级列表、`api_mode` 和 `fallback_models`，而无需在多个文件中重复这些数据。只需在 `plugins/model-providers/<your-provider>/`（或 `$HERMES_HOME/plugins/model-providers/<your-provider>/`）下添加一个调用 `register_provider()` 的新插件，`runtime_provider.py` 就能识别它——解析器本身不需要任何分支逻辑。

如果你想添加一个新的第一方推理提供商，请在阅读本页的同时参阅[添加提供商](./adding-providers.md)和[模型提供商插件指南](./model-provider-plugin.md)。

## 解析优先级

从高层次来看，提供商解析使用以下优先级顺序：

1. 显式的 CLI/运行时请求
2. `config.yaml` 中的模型/提供商配置
3. 环境变量
4. 提供商特定的默认值或自动解析

这个顺序很重要，因为 Hermes 将已保存的模型/提供商选择视为正常运行时的真实来源。这可以防止过时的 shell 导出静默覆盖用户在 `hermes model` 中最后选择的端点。

## 提供商

当前提供商系列包括（完整捆绑集请参见 `plugins/model-providers/`）：

- OpenRouter
- Nous Portal
- OpenAI Codex
- Copilot / Copilot ACP
- Anthropic（原生）
- Google / Gemini（`gemini`）
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
- xAI（Grok）
- Arcee
- GMI Cloud
- StepFun
- Qwen OAuth
- Xiaomi
- Ollama Cloud
- LM Studio
- Tencent TokenHub
- 自定义（`provider: custom`）— 适用于任何 OpenAI 兼容端点的首选提供商
- 命名自定义提供商（config.yaml 中的 `custom_providers` 列表）

## 运行时解析的输出

运行时解析器返回的数据包括：

- `provider`
- `api_mode`
- `base_url`
- `api_key`
- `source`
- 提供商特定的元数据，如过期/刷新信息

## 为什么这很重要

这个解析器是 Hermes 能够在以下模块之间共享认证/运行时逻辑的主要原因：

- `hermes chat`
- 网关消息处理
- 在新会话中运行的 cron 任务
- ACP 编辑器会话
- 辅助模型任务

## OpenRouter 和自定义 OpenAI 兼容 base URL

Hermes 包含逻辑以避免在存在多个提供商密钥时将错误的 API 密钥泄露到自定义端点（例如 `OPENROUTER_API_KEY` 和 `OPENAI_API_KEY`）。

每个提供商的 API 密钥作用域限定为其自己的 base URL：

- `OPENROUTER_API_KEY` 仅发送到 `openrouter.ai` 端点
- `OPENAI_API_KEY` 用于自定义端点，并作为后备

Hermes 还区分以下两种情况：

- 用户选择的真实自定义端点
- 未配置自定义端点时使用的 OpenRouter 后备路径

这种区分在以下场景中尤其重要：

- 本地模型服务器
- 非 OpenRouter 的 OpenAI 兼容 API
- 无需重新运行设置即可切换提供商
- 即使当前 shell 中未导出 `OPENAI_BASE_URL`，config 保存的自定义端点仍应正常工作

## 原生 Anthropic 路径

Anthropic 不再只是"通过 OpenRouter"。

当提供商解析选择 `anthropic` 时，Hermes 使用：

- `api_mode = anthropic_messages`
- 原生 Anthropic Messages API
- `agent/anthropic_adapter.py` 进行转换

原生 Anthropic 的凭证解析现在在两者同时存在时，优先使用可刷新的 Claude Code 凭证而非复制的环境令牌。实际上这意味着：

- 当 Claude Code 凭证文件包含可刷新认证时，它们被视为首选来源
- 手动设置的 `ANTHROPIC_TOKEN` / `CLAUDE_CODE_OAUTH_TOKEN` 值仍可作为显式覆盖使用
- Hermes 在原生 Messages API 调用之前预先检查 Anthropic 凭证刷新
- Hermes 在重建 Anthropic 客户端后遇到 401 时仍会重试一次，作为后备路径

## OpenAI Codex 路径

Codex 使用独立的 Responses API 路径：

- `api_mode = codex_responses`
- 专用凭证解析和认证存储支持

## 辅助模型路由

以下辅助任务：

- 视觉
- 网页提取摘要
- 上下文压缩摘要
- 技能中心操作
- MCP 辅助操作
- 内存刷新

可以使用自己的提供商/模型路由，而非主对话模型。

当辅助任务配置为提供商 `main` 时，Hermes 通过与正常聊天相同的共享运行时路径解析该配置。实际上这意味着：

- 环境驱动的自定义端点仍然有效
- 通过 `hermes model` / `config.yaml` 保存的自定义端点也有效
- 辅助路由能够区分真实保存的自定义端点和 OpenRouter 后备

## 后备模型

Hermes 支持配置的后备提供商链——当主模型遇到错误时，按顺序尝试的 `(provider, model)` 条目列表。旧版的单对 `fallback_model` 字典仍被接受以保持向后兼容（并在首次写入时迁移）。

### 内部工作原理

1. **存储**：`AIAgent.__init__` 存储 `fallback_model` 字典并将 `_fallback_activated` 设置为 `False`。

2. **触发点**：`_try_activate_fallback()` 在 `run_agent.py` 的主重试循环中的三个位置被调用：
   - 在无效 API 响应（None 选项、缺少内容）达到最大重试次数后
   - 在不可重试的客户端错误（HTTP 401、403、404）时
   - 在瞬时错误（HTTP 429、500、502、503）达到最大重试次数后

3. **激活流程**（`_try_activate_fallback`）：
   - 如果已激活或未配置，立即返回 `False`
   - 调用 `auxiliary_client.py` 中的 `resolve_provider_client()` 以构建带有适当认证的新客户端
   - 确定 `api_mode`：openai-codex 使用 `codex_responses`，anthropic 使用 `anthropic_messages`，其他所有使用 `chat_completions`
   - 就地替换：`self.model`、`self.provider`、`self.base_url`、`self.api_mode`、`self.client`、`self._client_kwargs`
   - 对于 anthropic 后备：构建原生 Anthropic 客户端而非 OpenAI 兼容客户端
   - 重新评估提示缓存（OpenRouter 上的 Claude 模型启用）
   - 设置 `_fallback_activated = True` — 防止再次触发
   - 将重试计数重置为 0 并继续循环

4. **配置流程**：
   - CLI：`cli.py` 读取 `CLI_CONFIG["fallback_model"]` → 传递给 `AIAgent(fallback_model=...)`
   - 网关：`gateway/run.py._load_fallback_model()` 读取 `config.yaml` → 传递给 `AIAgent`
   - 验证：`provider` 和 `model` 键都必须非空，否则后备被禁用

### 不支持后备的功能

- **子智能体委托**（`tools/delegate_tool.py`）：子智能体继承父智能体的提供商配置，但不继承后备配置
- **辅助任务**：使用自己独立的提供商自动检测链（见上文辅助模型路由）

Cron 任务**确实**支持后备：`run_job()` 从 `config.yaml` 读取 `fallback_providers`（或旧版的 `fallback_model`）并传递给 `AIAgent(fallback_model=...)`，与网关的 `_load_fallback_model()` 模式一致。请参阅 [Cron 内部机制](./cron-internals.md)。

### 测试覆盖

后备行为在多个测试套件中进行了验证：

- `tests/run_agent/test_fallback_credential_isolation.py` — 主模型和后备模型之间的凭证隔离
- `tests/hermes_cli/test_fallback_cmd.py` — `/fallback` CLI 命令
- `tests/gateway/test_fallback_eviction.py` — 网关对失败提供商的驱逐

## 相关文档

- [智能体循环内部机制](./agent-loop.md)
- [ACP 内部机制](./acp-internals.md)
- [上下文压缩与提示缓存](./context-compression-and-caching.md)