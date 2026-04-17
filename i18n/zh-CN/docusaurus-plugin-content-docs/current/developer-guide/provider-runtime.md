---
sidebar_position: 4
title: "提供程序运行时解析"
description: "Hermes 如何在运行时解析提供程序、凭证、API 模式和辅助模型"
---

# 提供程序运行时解析

Hermes 使用一个共享的提供程序运行时解析器，用于以下组件：

- CLI
- 网关 (gateway)
- 定时任务 (cron jobs)
- ACP
- 辅助模型调用

主要实现：

- `hermes_cli/runtime_provider.py` — 凭证解析，`_resolve_custom_runtime()`
- `hermes_cli/auth.py` — 提供程序注册表，`resolve_provider()`
- `hermes_cli/model_switch.py` — 共享的 `/model` 切换流程（CLI + 网关）
- `agent/auxiliary_client.py` — 辅助模型路由

如果您尝试添加一个新的一等推理提供程序，请阅读 [添加提供程序](./adding-providers.md) 并参考本页面。

## 解析优先级

从宏观角度来看，提供程序解析遵循以下顺序：

1. 明确的 CLI/运行时请求
2. `config.yaml` 模型/提供程序配置
3. 环境变量
4. 提供程序特定的默认值或自动解析

这个顺序很重要，因为 Hermes 将保存的模型/提供程序选择视为正常运行的“事实来源”。这可以防止过时的 shell 导出值悄无声息地覆盖用户在 `hermes model` 中最后选择的端点。

## 提供程序

当前的提供程序家族包括：

- AI 网关 (Vercel)
- OpenRouter
- Nous Portal
- OpenAI Codex
- Copilot / Copilot ACP
- Anthropic (原生)
- Google / Gemini
- 阿里巴巴 / DashScope
- DeepSeek
- Z.AI
- Kimi / Moonshot
- MiniMax
- MiniMax China
- Kilo Code
- Hugging Face
- OpenCode Zen / OpenCode Go
- 自定义 (`provider: custom`) — 任何 OpenAI 兼容端点的第一类提供程序
- 命名自定义提供程序 (`config.yaml` 中的 `custom_providers` 列表)

## 运行时解析输出

运行时解析器返回的数据包括：

- `provider`
- `api_mode`
- `base_url`
- `api_key`
- `source`
- 特定于提供程序的元数据，例如过期/刷新信息

## 为什么这很重要

此解析器是 Hermes 能够在以下组件之间共享认证/运行时逻辑的主要原因：

- `hermes chat`
- 网关消息处理
- 在全新会话中运行的定时任务
- ACP 编辑器会话
- 辅助模型任务

## AI 网关

在 `~/.hermes/.env` 中设置 `AI_GATEWAY_API_KEY`，并使用 `--provider ai-gateway` 运行。Hermes 会从网关的 `/models` 端点获取可用模型，并筛选出支持工具使用的语言模型。

## OpenRouter、AI 网关和自定义 OpenAI 兼容基础 URL

当存在多个提供程序密钥（例如 `OPENROUTER_API_KEY`、`AI_GATEWAY_API_KEY` 和 `OPENAI_API_KEY`）时，Hermes 包含逻辑以避免将错误的 API 密钥泄露给自定义端点。

每个提供程序的 API 密钥都限定在其自己的基础 URL：

- `OPENROUTER_API_KEY` 仅发送到 `openrouter.ai` 端点
- `AI_GATEWAY_API_KEY` 仅发送到 `ai-gateway.vercel.sh` 端点
- `OPENAI_API_KEY` 用于自定义端点和作为备用选项

Hermes 还区分以下两者：

- 用户选择的真实自定义端点
- 当未配置自定义端点时使用的 OpenRouter 备用路径

这种区别对于以下情况尤为重要：

- 本地模型服务器
- 非 OpenRouter/非 AI 网关的 OpenAI 兼容 API
- 不重新运行设置即可切换提供程序
- 即使当前 shell 中未导出 `OPENAI_BASE_URL`，仍应保持工作的配置保存的自定义端点

## 原生 Anthropic 路径

Anthropic 不再仅仅是“通过 OpenRouter”可用了。

当提供程序解析选择 `anthropic` 时，Hermes 使用：

- `api_mode = anthropic_messages`
- 原生的 Anthropic Messages API
- `agent/anthropic_adapter.py` 进行转换

原生 Anthropic 的凭证解析现在优先使用可刷新（refreshable）的 Claude Code 凭证，而不是复制的环境变量令牌。实际上这意味着：

- 当 Claude Code 凭证包含可刷新认证时，它们被视为首选来源
- 手动设置的 `ANTHROPIC_TOKEN` / `CLAUDE_CODE_OAUTH_TOKEN` 值仍然作为明确的覆盖值有效
- Hermes 在调用原生 Messages API 之前会预先刷新 Anthropic 凭证
- Hermes 仍然会在重建 Anthropic 客户端后，针对 401 错误进行一次重试，作为备用路径

## OpenAI Codex 路径

Codex 使用单独的 Responses API 路径：

- `api_mode = codex_responses`
- 专用的凭证解析和认证存储支持

## 辅助模型路由

诸如以下任务：

- 视觉 (vision)
- 网页提取摘要 (web extraction summarization)
- 上下文压缩摘要 (context compression summaries)
- 会话搜索摘要 (session search summarization)
- 技能中心操作 (skills hub operations)
- MCP 辅助操作 (MCP helper operations)
- 内存刷新 (memory flushes)

可以使用自己的提供程序/模型路由，而不是主对话模型。

当辅助任务配置了 `main` 提供程序时，Hermes 通过与正常聊天相同的共享运行时路径解析它。实际上这意味着：

- 环境变量驱动的自定义端点仍然有效
- 通过 `hermes model` / `config.yaml` 保存的自定义端点也有效
- 辅助路由可以区分真实的保存的自定义端点和 OpenRouter 的备用路径

## 备用模型

Hermes 支持配置的备用模型/提供程序对，允许在主模型遇到错误时进行运行时故障转移。

### 内部工作原理

1. **存储**: `AIAgent.__init__` 存储 `fallback_model` 字典并设置 `_fallback_activated = False`。

2. **触发点**: 在 `run_agent.py` 的主重试循环中的三个地方调用 `_try_activate_fallback()`：
   - 在对无效 API 响应（无选择、缺少内容）达到最大重试次数后
   - 在不可重试的客户端错误（HTTP 401、403、404）时
   - 在对瞬态错误（HTTP 429、500、502、503）达到最大重试次数后

3. **激活流程** (`_try_activate_fallback`):
   - 如果已激活或未配置，立即返回 `False`
   - 从 `auxiliary_client.py` 调用 `resolve_provider_client()` 来构建具有正确认证的新客户端
   - 确定 `api_mode`：openai-codex 为 `codex_responses`，anthropic 为 `anthropic_messages`，其他所有情况为 `chat_completions`
   - 原地替换：`self.model`, `self.provider`, `self.base_url`, `self.api_mode`, `self.client`, `self._client_kwargs`
   - 对于 Anthropic 备用：构建原生的 Anthropic 客户端，而不是 OpenAI 兼容的
   - 重新评估提示缓存（OpenRouter 上为 Claude 模型启用）
   - 设置 `_fallback_activated = True` — 防止再次触发
   - 将重试计数器重置为 0 并继续循环

4. **配置流程**:
   - CLI: `cli.py` 读取 `CLI_CONFIG["fallback_model"]` → 传递给 `AIAgent(fallback_model=...)`
   - 网关: `gateway/run.py._load_fallback_model()` 读取 `config.yaml` → 传递给 `AIAgent`
   - 验证: `provider` 和 `model` 键都必须非空，否则备用功能禁用

### 不支持备用功能的情况

- **子代理委托** (`tools/delegate_tool.py`): 子代理继承父级的提供程序，但不继承备用配置
- **定时任务** (`cron/`): 使用固定的提供程序运行，没有备用机制
- **辅助任务**: 使用自己的独立提供程序自动检测链（参见上文辅助模型路由）

### 测试覆盖率

请参阅 `tests/test_fallback_model.py`，了解涵盖所有支持的提供程序、单次调用语义和边缘情况的全面测试。

## 相关文档

- [Agent Loop Internals](./agent-loop.md)
- [ACP Internals](./acp-internals.md)
- [Context Compression & Prompt Caching](./context-compression-and-caching.md)