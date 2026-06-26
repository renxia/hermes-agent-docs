---
sidebar_position: 16
title: "Google Gemini"
description: "Use Hermes Agent with Google Gemini — native AI Studio API, API-key setup, tool calling, streaming, and quota guidance"
---

# Google Gemini

Hermes 智能体原生支持 Google Gemini，使用 **Google AI Studio / Gemini API**——而非 OpenAI 兼容端点。这使得 Hermes 能够将内部 OpenAI 格式的消息和工具循环转换为 Gemini 原生的 `generateContent` API，同时保留工具调用、流式输出、多模态输入以及 Gemini 特有的响应元数据。

## 前置条件

- **Google AI Studio API 密钥**——在 [aistudio.google.com/apikey](https://aistudio.google.com/apikey) 创建
- **已启用计费的 Google Cloud 项目**——推荐用于智能体使用。Gemini 的免费层级对于长时间运行的智能体会话来说太小了，因为 Hermes 每个用户轮次可能会进行多次模型调用。
- **已安装 Hermes**——原生 Gemini 提供程序无需额外的 Python 包。

:::tip API 密钥路径
设置 `GOOGLE_API_KEY` 或 `GEMINI_API_KEY`。Hermes 会为 `gemini` 提供程序检查这两个名称。
:::

## 快速开始

```bash
# 添加你的 Gemini API 密钥
echo "GOOGLE_API_KEY=..." >> ~/.hermes/.env

# 选择 Gemini 作为你的提供程序
hermes model
# → 选择 "More providers..." → "Google AI Studio"
# → Hermes 检查你的密钥层级并显示 Gemini 模型
# → 选择一个模型

# 开始对话
hermes chat
```

如果你更倾向于直接编辑配置，使用原生 Gemini API 基础 URL：

```yaml
model:
  default: gemini-3-flash-preview
  provider: gemini
  base_url: https://generativelanguage.googleapis.com/v1beta
```

## 配置

运行 `hermes model` 后，你的 `~/.hermes/config.yaml` 将包含：

```yaml
model:
  default: gemini-3-flash-preview
  provider: gemini
  base_url: https://generativelanguage.googleapis.com/v1beta
```

在 `~/.hermes/.env` 中：

```bash
GOOGLE_API_KEY=...
```

### 原生 Gemini API

推荐的端点是：

```text
https://generativelanguage.googleapis.com/v1beta
```

Hermes 检测到此端点并创建其原生 Gemini 适配器。在内部，Hermes 仍然将智能体循环保持在 OpenAI 格式的消息中，然后将每个请求转换为 Gemini 的原生模式：

- `messages[]` → Gemini `contents[]`
- 系统提示词 → Gemini `systemInstruction`
- 工具模式 → Gemini `functionDeclarations`
- 工具结果 → Gemini `functionResponse` 部分
- 流式响应 → 供 Hermes 循环使用的 OpenAI 格式流式块

:::note Gemini 3 思维签名
对于 Gemini 3 的工具使用，Hermes 保留附加到函数调用部分的 `thoughtSignature` 值，并在下一个工具轮次中重放它们。这涵盖了多步智能体工作流中验证关键路径。

Gemini 3 也可能将思维签名附加到其他响应部分。Hermes 的原生适配器目前针对智能体工具循环进行了优化，因此尚未以完整的部分级保真度重放每个非工具调用签名。
:::

### 优先使用原生端点

Google 还提供了一个 OpenAI 兼容端点：

```text
https://generativelanguage.googleapis.com/v1beta/openai/
```

对于 Hermes 智能体会话，请优先使用上面的原生 Gemini 端点。Hermes 包含一个原生 Gemini 适配器，因此能够将多轮工具使用、工具调用结果、流式输出、多模态输入和 Gemini 响应元数据直接映射到 Gemini 的 `generateContent` API。当你特别需要 OpenAI API 兼容性时，OpenAI 兼容端点仍然有用。

如果你之前将 `GEMINI_BASE_URL` 设置为了 `/openai` URL，请删除或更改它：

```bash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

## 可用模型

`hermes model` 选择器显示 Hermes 提供程序注册表中维护的 Gemini 模型。常见选择包括：

| 模型 | ID | 说明 |
|-------|----|-------|
| Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview` | 可用时最强大的预览模型 |
| Gemini 3 Pro Preview | `gemini-3-pro-preview` | 强大的推理和编程模型 |
| Gemini 3 Flash Preview | `gemini-3-flash-preview` | 推荐的速度与能力默认平衡选项 |
| Gemini 3.1 Flash Lite Preview | `gemini-3.1-flash-lite-preview` | 可用时最快/最低成本选项 |

模型可用性会随时间变化。如果某个模型消失或未对你的密钥启用，请再次运行 `hermes model` 并从当前列表中选择一个。

:::info 模型 ID
使用 Gemini 的原生模型 ID，如 `gemini-3-flash-preview`，而非 OpenRouter 风格的 ID（如 `google/gemini-3-flash-preview`），当 `provider: gemini` 时。
:::

### 最新别名

Google 为 Pro 和 Flash Gemini 系列发布了动态别名。当你希望 Google 自动推进模型而无需更改 Hermes 配置时，`gemini-pro-latest` 和 `gemini-flash-latest` 非常有用。

| 别名 | 当前跟踪 | 说明 |
|-------|------------------|-------|
| `gemini-pro-latest` | 最新的 Gemini Pro 模型 | 当你想要 Google 当前的 Pro 默认值时最佳 |
| `gemini-flash-latest` | 最新的 Gemini Flash 模型 | 当你想要 Google 当前的 Flash 默认值时最佳 |

```yaml
model:
  default: gemini-pro-latest
  provider: gemini
  base_url: https://generativelanguage.googleapis.com/v1beta
```

如果你需要严格的复现性，请优先使用显式模型 ID，如 `gemini-3.1-pro-preview` 或 `gemini-3-flash-preview`。

### 通过 Gemini API 使用 Gemma

Google 还通过 Gemini API 提供 Gemma 模型。Hermes 将这些识别为 Google 模型，但会在默认模型选择器中隐藏极低吞吐量的 Gemma 条目，以免新用户不小心为长时间运行的智能体会话选择了评估层级的模型。

有用的评估 ID 包括：

| 模型 | ID | 说明 |
|-------|----|-------|
| Gemma 4 31B IT | `gemma-4-31b-it` | 较大的 Gemma 模型；用于兼容性和质量评估 |
| Gemma 4 26B A4B IT | `gemma-4-26b-a4b-it` | 可用时较小的活跃参数变体 |

这些模型最好作为 Gemini API 密钥上的评估选项。Google 的 Gemma API 定价仅限免费层级，使用上限远低于生产级 Gemini 模型，因此持续的 Hermes 智能体使用通常应转向付费 Gemini 模型、自托管部署或具有适当配额的其他提供程序。

要使用选择器中隐藏的 Gemma 模型，请直接设置：

```yaml
model:
  default: gemma-4-31b-it
  provider: gemini
  base_url: https://generativelanguage.googleapis.com/v1beta
```

## 会话中途切换模型

在对话中使用 `/model` 命令：

```text
/model gemini-3-flash-preview
/model gemini-flash-latest
/model gemini-3-pro-preview
/model gemini-pro-latest
/model gemma-4-31b-it
/model gemini-3.1-flash-lite-preview
```

如果你尚未配置 Gemini，请退出会话并先运行 `hermes model`。`/model` 在已配置的提供程序和模型之间切换；它不会收集新的 API 密钥。

## 诊断

```bash
hermes doctor
```

诊断检查：

- `GOOGLE_API_KEY` 或 `GEMINI_API_KEY` 是否可用
- 配置的提供程序凭证是否可以被解析

## 网关（消息平台）

Gemini 可与所有 Hermes 网关平台（Telegram、Discord、Slack、WhatsApp、LINE、飞书等）配合使用。将 Gemini 配置为你的提供程序，然后正常启动网关：

```bash
hermes gateway setup
hermes gateway start
```

网关读取 `config.yaml` 并使用相同的 Gemini 提供程序配置。

## 故障排除

### "Gemini native client requires an API key"

Hermes 无法找到可用的 API 密钥。请将以下之一添加到 `~/.hermes/.env`：

```bash
GOOGLE_API_KEY=...
# 或
GEMINI_API_KEY=...
```

然后再次运行 `hermes model`。

### "This Google API key is on the free tier"

Hermes 在设置期间会探测 Gemini API 密钥。免费层级配额可能在几个智能体轮次后就会耗尽，因为工具调用、重试、压缩和辅助任务可能需要多次模型调用。

在与你的密钥关联的 Google Cloud 项目上启用计费，如果需要则重新生成密钥，然后运行：

```bash
hermes model
```

### "404 model not found"

所选模型对你的账户、区域或密钥不可用。请再次运行 `hermes model` 并从当前列表中选择另一个 Gemini 模型。

### Gemma 模型未显示在 `hermes model` 中

Hermes 可能默认在选择器中隐藏低吞吐量的 Gemma 模型。如果你确实想评估一个，请直接在 `~/.hermes/config.yaml` 中设置模型 ID。

### Gemma 上出现 "429 quota exceeded"

通过 Gemini API 提供的 Gemma 模型对评估很有用，但其 Gemini API 免费层级上限较低。请将它们用于兼容性测试，然后切换到付费 Gemini 模型或另一个提供程序以进行持续的智能体会话。

### 配置了 OpenAI 兼容端点

检查 `~/.hermes/.env` 中是否有：

```bash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
```

将其更改为原生端点或删除覆盖：

```bash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

### 工具调用因模式错误而失败

升级 Hermes 并重新运行 `hermes model`。原生 Gemini 适配器会为 Gemini 更严格的函数声明格式清理工具模式；旧版本或自定义端点可能不具备此功能。

## 相关

- [AI 提供程序](/integrations/providers)
- [配置](/user-guide/configuration)
- [回退提供程序](/user-guide/features/fallback-providers)
- [AWS Bedrock](/guides/aws-bedrock)——使用 AWS 凭证的原生云集提供程序集成