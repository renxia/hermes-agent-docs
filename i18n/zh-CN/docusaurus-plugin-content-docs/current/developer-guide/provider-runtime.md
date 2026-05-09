---
sidebar_position: 4
title: "Provider Runtime Resolution"
description: "Hermes 如何在运行时解析提供商、凭据、API 模式和辅助模型"
---

# 提供商运行时解析

Hermes 使用一个共享的提供商运行时解析器，应用于以下场景：

- CLI
- 网关
- 定时任务
- ACP
- 辅助模型调用

主要实现文件：

- `hermes_cli/runtime_provider.py` — 凭据解析，`_resolve_custom_runtime()`
- `hermes_cli/auth.py` — 提供商注册表，`resolve_provider()`
- `hermes_cli/model_switch.py` — 共享的 `/model` 切换管道（CLI + 网关）
- `agent/auxiliary_client.py` — 辅助模型路由
- `providers/` — ABC + 注册表入口点（`ProviderProfile`、`register_provider`、`get_provider_profile`、`list_providers`）
- `plugins/model-providers/<name>/` — 每个提供商的插件（捆绑），声明 `api_mode`、`base_url`、`env_vars`、`fallback_models`，并在首次访问时向注册表注册自身。位于 `$HERMES_HOME/plugins/model-providers/<name>/` 的用户插件会覆盖同名的捆绑插件。

`providers/` 中的 `get_provider_profile()` 返回给定提供商 ID 对应的 `ProviderProfile`。`runtime_provider.py` 在解析时调用此函数，以获取规范的 `base_url`、`env_vars` 优先级列表、`api_mode` 和 `fallback_models`，而无需在多个文件中重复这些数据。只需在 `plugins/model-providers/<your-provider>/`（或 `$HERMES_HOME/plugins/model-providers/<your-provider>/`）下添加一个调用 `register_provider()` 的新插件，`runtime_provider.py` 就能自动识别它 —— 解析器本身无需额外分支逻辑。

如果要添加新的第一方推理提供商，请结合本页阅读 [添加提供商](./adding-providers.md) 和 [模型提供商插件指南](./model-provider-plugin.md)。

## 解析优先级

总体而言，提供商解析遵循以下顺序：

1. 显式的 CLI/运行时请求  
2. `config.yaml` 中的模型/提供商配置  
3. 环境变量  
4. 提供商特定的默认值或自动解析  

该顺序很重要，因为 Hermes 将保存的模型/提供商选择视为正常运行时的“真相来源”。这可以防止陈旧的 shell 导出静默覆盖用户在 `hermes model` 中最后选择的端点。

## 提供商

当前支持的提供商家族包括：

- AI Gateway（Vercel）
- OpenRouter
- Nous Portal
- OpenAI Codex
- Copilot / Copilot ACP
- Anthropic（原生）
- Google / Gemini
- Alibaba / DashScope
- DeepSeek
- Z.AI
- Kimi / Moonshot
- MiniMax
- MiniMax China
- Kilo Code
- Hugging Face
- OpenCode Zen / OpenCode Go
- 自定义（`provider: custom`）— 适用于任何 OpenAI 兼容端点的第一方提供商
- 命名的自定义提供商（`config.yaml` 中的 `custom_providers` 列表）

## 运行时解析的输出

运行时解析器返回的数据包括：

- `provider`
- `api_mode`
- `base_url`
- `api_key`
- `source`
- 提供商特定的元数据，如过期/刷新信息

## 为何这很重要

该解析器是 Hermes 能够在以下场景之间共享认证/运行时逻辑的主要原因：

- `hermes chat`
- 网关消息处理
- 在新会话中运行的定时任务
- ACP 编辑器会话
- 辅助模型任务

## AI Gateway

在 `~/.hermes/.env` 中设置 `AI_GATEWAY_API_KEY`，并使用 `--provider ai-gateway` 运行。Hermes 会从网关的 `/models` 端点获取可用模型，并筛选出支持工具使用的语言模型。

## OpenRouter、AI Gateway 和自定义 OpenAI 兼容 base URL

当存在多个提供商密钥时（例如 `OPENROUTER_API_KEY`、`AI_GATEWAY_API_KEY` 和 `OPENAI_API_KEY`），Hermes 包含逻辑以避免将错误的 API 密钥泄露给自定义端点。

每个提供商的 API 密钥仅作用于其自身的 base URL：

- `OPENROUTER_API_KEY` 仅发送至 `openrouter.ai` 端点  
- `AI_GATEWAY_API_KEY` 仅发送至 `ai-gateway.vercel.sh` 端点  
- `OPENAI_API_KEY` 用于自定义端点，并作为后备选项  

Hermes 还能区分：

- 用户选择的真实自定义端点  
- 未配置自定义端点时使用的 OpenRouter 后备路径  

这种区分对于以下情况尤为重要：

- 本地模型服务器  
- 非 OpenRouter/非 AI Gateway 的 OpenAI 兼容 API  
- 切换提供商而无需重新运行设置  
- 保存在配置中的自定义端点，即使当前 shell 中未导出 `OPENAI_BASE_URL` 也应继续工作  

## 原生 Anthropic 路径

Anthropic 不再仅仅是“通过 OpenRouter”。

当提供商解析选择 `anthropic` 时，Hermes 使用：

- `api_mode = anthropic_messages`
- 原生 Anthropic Messages API
- `agent/anthropic_adapter.py` 进行转换

对于原生 Anthropic，凭据解析现在优先使用可刷新的 Claude Code 凭据，而非复制的环境令牌（如果两者都存在）。实际上这意味着：

- 当包含可刷新的认证时，Claude Code 凭据文件被视为首选来源  
- 手动设置的 `ANTHROPIC_TOKEN` / `CLAUDE_CODE_OAUTH_TOKEN` 值仍可作为显式覆盖使用  
- Hermes 在调用原生 Messages API 前会预检 Anthropic 凭据刷新  
- Hermes 在重建 Anthropic 客户端后仍会针对 401 错误重试一次，作为后备路径  

## OpenAI Codex 路径

Codex 使用独立的 Responses API 路径：

- `api_mode = codex_responses`
- 专用的凭据解析和认证存储支持

## 辅助模型路由

以下辅助任务可以使用其自身的提供商/模型路由，而非主对话模型：

- 视觉
- 网页提取摘要
- 上下文压缩摘要
- 会话搜索摘要
- 技能中心操作
- MCP 辅助操作
- 内存刷新

当辅助任务配置为使用提供商 `main` 时，Hermes 会通过与普通聊天相同的共享运行时路径进行解析。实际上这意味着：

- 环境驱动的自定义端点仍然有效  
- 通过 `hermes model` / `config.yaml` 保存的自定义端点也有效  
- 辅助路由可以区分真实保存的自定义端点与 OpenRouter 后备路径  

## 后备模型

Hermes 支持配置后备模型/提供商对，允许在主模型遇到错误时进行运行时故障转移。

### 内部工作原理

1. **存储**：`AIAgent.__init__` 存储 `fallback_model` 字典，并设置 `_fallback_activated = False`。

2. **触发点**：`_try_activate_fallback()` 在 `run_agent.py` 主重试循环的三个位置被调用：
   - 在无效 API 响应（无选择、缺少内容）达到最大重试次数后  
   - 在不可重试的客户端错误（HTTP 401、403、404）上  
   - 在瞬态错误（HTTP 429、500、502、503）达到最大重试次数后  

3. **激活流程**（`_try_activate_fallback`）：
   - 如果已激活或未配置，则立即返回 `False`  
   - 调用 `auxiliary_client.py` 中的 `resolve_provider_client()` 构建带有正确认证的新客户端  
   - 确定 `api_mode`：openai-codex 使用 `codex_responses`，anthropic 使用 `anthropic_messages`，其余使用 `chat_completions`  
   - 就地替换：`self.model`、`self.provider`、`self.base_url`、`self.api_mode`、`self.client`、`self._client_kwargs`  
   - 对于 Anthropic 后备：构建原生 Anthropic 客户端，而非 OpenAI 兼容客户端  
   - 重新评估提示缓存（在 OpenRouter 上为 Claude 模型启用）  
   - 设置 `_fallback_activated = True` —— 防止再次触发  
   - 将重试计数重置为 0 并继续循环  

4. **配置流程**：
   - CLI：`cli.py` 读取 `CLI_CONFIG["fallback_model"]` → 传递给 `AIAgent(fallback_model=...)`  
   - 网关：`gateway/run.py._load_fallback_model()` 读取 `config.yaml` → 传递给 `AIAgent`  
   - 验证：`provider` 和 `model` 键必须非空，否则后备功能被禁用  

### 不支持后备的情况

- **子智能体委托**（`tools/delegate_tool.py`）：子智能体继承父智能体的提供商，但不继承后备配置  
- **辅助任务**：使用其自身独立的提供商自动检测链（参见上文“辅助模型路由”）  

定时任务**支持**后备：`run_job()` 从 `config.yaml` 读取 `fallback_providers`（或旧版 `fallback_model`）并传递给 `AIAgent(fallback_model=...)`，与网关的 `_load_fallback_model()` 模式一致。参见 [定时任务内部机制](./cron-internals.md)。

### 测试覆盖

参见 `tests/test_fallback_model.py`，其中包含涵盖所有支持提供商、一次性语义和边缘情况的综合测试。

## 相关文档

- [智能体循环内部机制](./agent-loop.md)
- [ACP 内部机制](./acp-internals.md)
- [上下文压缩与提示缓存](./context-compression-and-caching.md)