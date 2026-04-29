---
sidebar_position: 15
title: "Azure AI Foundry"
description: "在 Hermes Agent 中使用 Azure AI Foundry —— 支持 OpenAI 风格和 Anthropic 风格的端点，自动检测传输协议和已部署的模型"
---

# Azure AI Foundry

Hermes Agent 将 Azure AI Foundry（以及 Azure OpenAI）作为一等提供商支持。单个 Azure 资源可以托管使用两种不同线格式的模型：

- **OpenAI 风格** —— 在类似 `https://<resource>.openai.azure.com/openai/v1` 的端点上使用 `POST /v1/chat/completions`。用于 GPT-4.x、GPT-5.x、Llama、Mistral 以及大多数开源权重模型。
- **Anthropic 风格** —— 在类似 `https://<resource>.services.ai.azure.com/anthropic` 的端点上使用 `POST /v1/messages`。当 Azure Foundry 通过 Anthropic Messages API 格式提供 Claude 模型时使用。

设置向导会探测您的端点，并自动检测其使用的传输协议、可用的部署以及每个模型的上下文长度。

## 先决条件

- 一个 Azure AI Foundry 或 Azure OpenAI 资源，且至少包含一个部署
- 该资源的 API 密钥（可在 Azure 门户的“密钥和终结点”中找到）
- 部署的终结点 URL

## 快速入门

```bash
hermes model
# → 选择 "Azure Foundry"
# → 输入您的终结点 URL
# → 输入您的 API 密钥
# Hermes 会探测终结点并自动检测传输协议和模型
# → 从列表中选择模型（或手动输入部署名称）
```

向导将执行以下操作：

1. **嗅探 URL 路径** —— 以 `/anthropic` 结尾的 URL 会被识别为 Azure Foundry Claude 路由。
2. **探测 `GET <base>/models`** —— 如果终结点返回 OpenAI 格式的模型列表，Hermes 将切换到 `chat_completions` 模式，并使用返回的部署 ID 预填充选择器。
3. **探测 Anthropic Messages 格式** —— 对于不暴露 `/models` 但接受 Anthropic Messages 格式的终结点，作为备用方案。
4. **回退到手动输入** —— 即使是拒绝所有探测的私有/受保护终结点仍可正常工作；您只需手动选择 API 模式并输入部署名称。

所选模型的上下文长度通过 Hermes 的标准元数据链（`models.dev`、提供商元数据和硬编码的模型族回退）解析，并存储在 `config.yaml` 中，以便模型能正确设置其自身的上下文窗口大小。

## 配置（写入 `config.yaml`）

运行向导后，您将看到类似以下内容：

```yaml
model:
  provider: azure-foundry
  base_url: https://my-resource.openai.azure.com/openai/v1
  api_mode: chat_completions         # 或 "anthropic_messages"
  default: gpt-5.4-mini              # 您的部署/模型名称
  context_length: 400000             # 自动检测
```

并且在 `~/.hermes/.env` 中：

```
AZURE_FOUNDRY_API_KEY=<您的-azure-key>
```

## OpenAI 风格端点（GPT、Llama 等）

Azure OpenAI 的 v1 GA 终结点接受标准的 `openai` Python 客户端，仅需少量更改：

```yaml
model:
  provider: azure-foundry
  base_url: https://my-resource.openai.azure.com/openai/v1
  api_mode: chat_completions
  default: gpt-5.4
```

重要行为：

- **GPT-5.x、codex 和 o 系列模型会自动路由到 Responses API。** Azure Foundry 将 GPT-5 / codex / o1 / o3 / o4 模型部署为仅限 Responses API —— 对它们调用 `/chat/completions` 会返回 `400 "请求的操作不受支持。"`。Hermes 会根据模型名称检测这些模型族，并透明地将 `api_mode` 升级为 `codex_responses`，即使 `config.yaml` 中仍显示 `api_mode: chat_completions`。GPT-4、GPT-4o、Llama、Mistral 和其他部署则保持在 `/chat/completions`。
- **自动使用 `max_completion_tokens`。** Azure OpenAI（与直接使用 OpenAI 相同）要求 gpt-4o、o 系列和 gpt-5.x 模型使用 `max_completion_tokens`。Hermes 会根据终结点发送正确的参数。
- **需要 `api-version` 的 v1 之前终结点。** 如果您有一个旧版基础 URL，例如 `https://<resource>.openai.azure.com/openai?api-version=2025-04-01-preview`，Hermes 会提取查询字符串并通过每次请求的 `default_query` 转发它（否则 OpenAI SDK 在拼接路径时会丢弃它）。

## Anthropic 风格端点（通过 Azure Foundry 的 Claude）

对于 Claude 部署，请使用 Anthropic 风格路由：

```yaml
model:
  provider: azure-foundry
  base_url: https://my-resource.services.ai.azure.com/anthropic
  api_mode: anthropic_messages
  default: claude-sonnet-4-6
```

重要行为：

- **从基础 URL 中去除 `/v1`。** Anthropic SDK 会在每个请求 URL 后附加 `/v1/messages` —— Hermes 会在将 URL 交给 SDK 之前去除末尾的 `/v1`，以避免出现双 `/v1` 路径。
- **通过 `default_query` 发送 `api-version`，而非附加到 URL。** Azure Anthropic 要求 `api-version` 查询字符串。将其嵌入基础 URL 会产生格式错误的路径，例如 `/anthropic?api-version=.../v1/messages`，并返回 404。Hermes 改为通过 Anthropic SDK 的 `default_query` 传递 `api-version=2025-04-15`。
- **禁用 OAuth 令牌刷新。** Azure 部署使用静态 API 密钥。应用于 Anthropic Console 的 `~/.claude/.credentials.json` OAuth 令牌刷新循环会针对 Azure 终结点显式跳过，以防止 Claude Code OAuth 令牌在会话中途覆盖您的 Azure 密钥。

## 替代方案：`provider: anthropic` + Azure 基础 URL

如果您已经配置了 `provider: anthropic`，并且只想将其指向 Azure AI Foundry 以使用 Claude，则可以完全跳过 `azure-foundry` 提供商：

```yaml
model:
  provider: anthropic
  base_url: https://my-resource.services.ai.azure.com/anthropic
  key_env: AZURE_ANTHROPIC_KEY
  default: claude-sonnet-4-6
```

并在 `~/.hermes/.env` 中设置 `AZURE_ANTHROPIC_KEY`。Hermes 会检测基础 URL 中的 `azure.com`，并绕过 Claude Code OAuth 令牌链，从而直接使用 Azure 密钥进行 `x-api-key` 认证。

`key_env` 是规范的 snake_case 字段名称；`api_key_env`（以及 camelCase 的 `keyEnv` / `apiKeyEnv`）也被接受为别名。如果同时设置了 `key_env` 和 `AZURE_ANTHROPIC_KEY`/`ANTHROPIC_API_KEY`，则以 `key_env` 命名的环境变量优先。

## 模型发现

Azure **不**提供纯 API 密钥终结点来列出您*已部署*的模型部署。部署枚举需要 Azure 资源管理器身份验证（`az cognitiveservices account deployment list`）并使用 Azure AD 主体，而非推理 API 密钥。

Hermes 可以执行的操作：

- Azure OpenAI v1 终结点（`<resource>.openai.azure.com/openai/v1`）通过 `GET /models` 暴露资源的**可用**模型目录。Hermes 使用此列表预填充模型选择器。
- Azure Foundry `/anthropic` 路由：通过 URL 路径检测，模型名称需手动输入。
- 私有/防火墙保护的终结点：手动输入，并显示友好的“无法探测”消息。

您始终可以直接输入部署名称 —— Hermes 不会根据返回的列表进行验证。

## 环境变量

| 变量 | 用途 |
|----------|---------|
| `AZURE_FOUNDRY_API_KEY` | Azure AI Foundry / Azure OpenAI 的主要 API 密钥 |
| `AZURE_FOUNDRY_BASE_URL` | 终结点 URL（通过 `hermes model` 设置；环境变量作为备用） |
| `AZURE_ANTHROPIC_KEY` | 由 `provider: anthropic` + Azure 基础 URL 使用（`ANTHROPIC_API_KEY` 的替代） |

## 故障排除

**在 gpt-5.x 部署上出现 401 未授权。**
Azure 在 `/chat/completions` 上提供 gpt-5.x，而非 `/responses`。当 URL 包含 `openai.azure.com` 时，Hermes 会自动处理此问题，但如果您看到带有 `无效 API 密钥` 正文的 401 错误，请检查 `config.yaml` 中的 `api_mode` 是否为 `chat_completions`。

**在 `/v1/messages?api-version=.../v1/messages` 上出现 404。**
这是修复前 Azure Anthropic 设置中的格式错误 URL 问题。请升级 Hermes —— 现在 `api-version` 参数通过 `default_query` 传递，而非嵌入基础 URL，因此 SDK 在拼接 URL 时不会破坏它。

**向导显示“自动检测不完整”。**
终结点拒绝了 `/models` 探测和 Anthropic Messages 探测。这对于防火墙后或具有 IP 允许列表的私有终结点是正常的。请回退到手动选择 API 模式并输入您的部署名称 —— 一切仍可正常工作，只是 Hermes 无法预填充选择器。

**选择了错误的传输协议。**
再次运行 `hermes model`，向导将重新探测。如果探测仍选择错误的模式，您可以直接编辑 `config.yaml`：

```yaml
model:
  provider: azure-foundry
  api_mode: anthropic_messages   # 或 chat_completions
```

## 相关文档

- [环境变量](/docs/reference/environment-variables)
- [配置](/docs/user-guide/configuration)
- [AWS Bedrock](/docs/guides/aws-bedrock) —— 另一个主要的云提供商集成