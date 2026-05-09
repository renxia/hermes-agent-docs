---
sidebar_position: 16
title: "Google Gemini"
description: "使用 Hermes 智能体与 Google Gemini 配合 — 原生 AI Studio API、API 密钥设置、OAuth 选项、工具调用、流式传输和配额指南"
---

# Google Gemini

Hermes 智能体支持将 Google Gemini 作为原生提供商，使用 **Google AI Studio / Gemini API** — 而非兼容 OpenAI 的端点。这使得 Hermes 能够将其内部 OpenAI 风格的消息和工具循环转换为 Gemini 原生的 `generateContent` API，同时保留工具调用、流式传输、多模态输入以及 Gemini 特有的响应元数据。

Hermes 还支持一个独立的 **Google Gemini (OAuth)** 提供商，该提供商使用与 Google Gemini CLI 相同的 Cloud Code Assist 后端。对于风险最低的官方 API 路径，请使用 API 密钥提供商 (`gemini`)。

## 先决条件

- **Google AI Studio API 密钥** — 在 [aistudio.google.com/apikey](https://aistudio.google.com/apikey) 创建一个
- **启用计费的 Google Cloud 项目** — 建议用于智能体。Gemini 的免费层级对于长时间运行的智能体会话来说太小，因为 Hermes 可能在每个用户轮次中进行多次模型调用。
- **已安装 Hermes** — 原生 Gemini 提供商无需额外的 Python 包。

:::tip API 密钥路径
设置 `GOOGLE_API_KEY` 或 `GEMINI_API_KEY`。Hermes 会检查 `gemini` 提供商的这两个名称。
:::

## 快速开始

```bash
# 添加你的 Gemini API 密钥
echo "GOOGLE_API_KEY=..." >> ~/.hermes/.env

# 选择 Gemini 作为你的提供商
hermes model
# → 选择“更多提供商...” → “Google AI Studio”
# → Hermes 检查你的密钥层级并显示 Gemini 模型
# → 选择一个模型

# 开始聊天
hermes chat
```

如果你更喜欢直接编辑配置文件，请使用原生的 Gemini API 基础 URL：

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

并且在 `~/.hermes/.env` 中：

```bash
GOOGLE_API_KEY=...
```

### 原生 Gemini API

推荐的端点是：

```text
https://generativelanguage.googleapis.com/v1beta
```

Hermes 会检测此端点并创建其原生 Gemini 适配器。在内部，Hermes 仍然将智能体循环保持在 OpenAI 格式的消息中，然后将每个请求转换为 Gemini 的原生模式：

- `messages[]` → Gemini `contents[]`
- 系统提示 → Gemini `systemInstruction`
- 工具模式 → Gemini `functionDeclarations`
- 工具结果 → Gemini `functionResponse` 部分
- 流式响应 → 为 Hermes 循环提供 OpenAI 格式的流块

:::note Gemini 3 思维签名
对于 Gemini 3 工具使用，Hermes 会保留附加到函数调用部分的 `thoughtSignature` 值，并在下一个工具轮次中重放它们。这涵盖了多步智能体工作流中关键的验证路径。

Gemini 3 也可能将思维签名附加到其他响应部分。Hermes 的原生适配器目前针对智能体工具循环进行了优化，因此尚未以完全的部分级保真度重放每个非工具调用的签名。
:::

### 优先使用原生端点

Google 还暴露了一个与 OpenAI 兼容的端点：

```text
https://generativelanguage.googleapis.com/v1beta/openai/
```

对于 Hermes 智能体会话，请优先使用上述原生 Gemini 端点。Hermes 包含一个原生 Gemini 适配器，因此它可以直接将多轮工具使用、工具调用结果、流式传输、多模态输入和 Gemini 响应元数据映射到 Gemini 的 `generateContent` API。当你特别需要 OpenAI API 兼容性时，与 OpenAI 兼容的端点仍然有用。

如果你之前将 `GEMINI_BASE_URL` 设置为 `/openai` URL，请将其删除或更改：

```bash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

### OAuth 提供商

Hermes 还有一个 `google-gemini-cli` 提供商：

```bash
hermes model
# → 选择“Google Gemini (OAuth)”
```

这使用浏览器 PKCE 登录和 Cloud Code Assist 后端。这对于想要 Gemini CLI 风格 OAuth 的用户可能有用，但 Hermes 会显示一个显式警告，因为 Google 可能将第三方软件使用 Gemini CLI OAuth 客户端视为违反政策。对于生产环境或最低风险使用，请优先使用上述 API 密钥提供商。

## 可用模型

`hermes model` 选择器显示 Hermes 提供商注册表中维护的 Gemini 模型。常见选择包括：

| 模型 | ID | 说明 |
|-------|----|-------|
| Gemini 3.1 Pro 预览版 | `gemini-3.1-pro-preview` | 可用时最强大的预览模型 |
| Gemini 3 Pro 预览版 | `gemini-3-pro-preview` | 强大的推理和编码模型 |
| Gemini 3 Flash 预览版 | `gemini-3-flash-preview` | 推荐的速度和能力平衡的默认选择 |
| Gemini 3.1 Flash Lite 预览版 | `gemini-3.1-flash-lite-preview` | 可用时最快/成本最低的选项 |

模型可用性会随时间变化。如果某个模型消失或未为你的密钥启用，请再次运行 `hermes model` 并从当前列表中选择一个。

:::info 模型 ID
当 `provider: gemini` 时，请使用 Gemini 的原生模型 ID，例如 `gemini-3-flash-preview`，而不是 OpenRouter 风格的 ID，例如 `google/gemini-3-flash-preview`。
:::

### 最新别名

Google 为 Pro 和 Flash Gemini 系列发布了移动别名。当你希望 Google 自动推进模型而无需更改 Hermes 配置时，`gemini-pro-latest` 和 `gemini-flash-latest` 很有用。

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

如果你需要严格的再现性，请优先使用显式模型 ID，例如 `gemini-3.1-pro-preview` 或 `gemini-3-flash-preview`。

### 通过 Gemini API 使用 Gemma

Google 还通过 Gemini API 暴露 Gemma 模型。Hermes 将这些识别为 Google 模型，但会从默认模型选择器中隐藏吞吐量非常低的 Gemma 条目，因此新用户不会意外地为长时间运行的智能体会话选择评估层级的模型。

有用的评估 ID 包括：

| 模型 | ID | 说明 |
|-------|----|-------|
| Gemma 4 31B IT | `gemma-4-31b-it` | 更大的 Gemma 模型；可用于兼容性和质量评估 |
| Gemma 4 26B A4B IT | `gemma-4-26b-a4b-it` | 可用时更小的活跃参数变体 |

这些模型最好被视为 Gemini API 密钥上的评估选项。Google 的 Gemma API 定价仅适用于免费层级，并且使用上限与生产级 Gemini 模型相比很低，因此持续的 Hermes 智能体使用通常应转移到付费 Gemini 模型、自托管部署或具有适当配额的其他提供商。

要使用在选择器中隐藏的 Gemma 模型，请直接设置它：

```yaml
model:
  default: gemma-4-31b-it
  provider: gemini
  base_url: https://generativelanguage.googleapis.com/v1beta
```

## 会话中切换模型

在对话期间使用 `/model` 命令：

```text
/model gemini-3-flash-preview
/model gemini-flash-latest
/model gemini-3-pro-preview
/model gemini-pro-latest
/model gemma-4-31b-it
/model gemini-3.1-flash-lite-preview
```

如果你尚未配置 Gemini，请退出会话并首先运行 `hermes model`。`/model` 在已配置的提供商和模型之间切换；它不会收集新的 API 密钥。

## 诊断

```bash
hermes doctor
```

诊断检查：

- `GOOGLE_API_KEY` 或 `GEMINI_API_KEY` 是否可用
- 是否存在 `google-gemini-cli` 的 Gemini OAuth 凭据
- 配置的提供商凭据是否可以解析

对于 OAuth 配额使用，请在 Hermes 会话中运行此命令：

```text
/gquota
```

`/gquota` 适用于 `google-gemini-cli` OAuth 提供商，而不是 AI Studio API 密钥提供商。

## 网关（消息平台）

Gemini 与所有 Hermes 网关平台（Telegram、Discord、Slack、WhatsApp、LINE、飞书等）配合使用。将 Gemini 配置为你的提供商，然后正常启动网关：

```bash
hermes gateway setup
hermes gateway start
```

网关读取 `config.yaml` 并使用相同的 Gemini 提供商配置。

## 故障排除

### “Gemini 原生客户端需要 API 密钥”

Hermes 找不到可用的 API 密钥。将以下之一添加到 `~/.hermes/.env`：

```bash
GOOGLE_API_KEY=...
# 或
GEMINI_API_KEY=...
```

然后再次运行 `hermes model`。

### “此 Google API 密钥处于免费层级”

Hermes 在设置期间探测 Gemini API 密钥。由于工具使用、重试、压缩和辅助任务可能需要多次模型调用，免费层级的配额可能在几次智能体轮次后耗尽。

在附加到你密钥的 Google Cloud 项目上启用计费，如果需要，请重新生成密钥，然后运行：

```bash
hermes model
```

### “404 模型未找到”

所选模型对你的账户、区域或密钥不可用。再次运行 `hermes model` 并从当前列表中选择另一个 Gemini 模型。

### Gemma 模型未在 `hermes model` 中显示

Hermes 默认可能会从选择器中隐藏低吞吐量的 Gemma 模型。如果你有意要评估一个，请直接在 `~/.hermes/config.yaml` 中设置模型 ID。

### Gemma 上“429 超出配额”

通过 Gemini API 暴露的 Gemma 模型可用于评估，但其 Gemini API 免费层级的上限很低。将它们用于兼容性测试，然后切换到付费 Gemini 模型或其他提供商以进行持续的智