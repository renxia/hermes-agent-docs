---
sidebar_position: 16
title: "Google Gemini"
description: "将 Hermes 智能体与 Google Gemini 搭配使用——原生 AI Studio API、API 密钥设置、OAuth 选项、工具调用、流式传输及配额指南"
---

# Google Gemini

Hermes 智能体通过 **Google AI Studio / Gemini API** 原生支持 Google Gemini——而非 OpenAI 兼容端点。这使得 Hermes 能够将其内部 OpenAI 格式的消息和工具循环转换为 Gemini 原生的 `generateContent` API，同时保留工具调用、流式传输、多模态输入以及 Gemini 专属的响应元数据。

Hermes 还支持一个单独的 **Google Gemini (OAuth)** 提供商，它使用与 Google Gemini CLI 相同的 Cloud Code Assist 后端。请使用 API 密钥提供商 (`gemini`) 以获得最低风险的官方 API 路径。

## 前提条件

- **Google AI Studio API 密钥** — 在 [aistudio.google.com/apikey](https://aistudio.google.com/apikey) 创建一个
- **启用计费的 Google Cloud 项目** — 推荐用于智能体用途。Gemini 的免费套餐对于长时间运行的智能体会话来说太小，因为 Hermes 可能会在每个用户回合中发起多次模型调用。
- **已安装 Hermes** — 原生 Gemini 提供商不需要额外的 Python 包。

:::tip API 密钥路径
设置 `GOOGLE_API_KEY` 或 `GEMINI_API_KEY`。Hermes 会为 `gemini` 提供商检查这两个名称。
:::

## 快速入门

```bash
# 添加你的 Gemini API 密钥
echo "GOOGLE_API_KEY=..." >> ~/.hermes/.env

# 选择 Gemini 作为你的提供商
hermes model
# → 选择 "更多提供商..." → "Google AI Studio"
# → Hermes 会检查你的密钥层级并显示 Gemini 模型
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

运行 `hermes model` 后，你的 `~/.hermes/config.yaml` 文件将包含：

```yaml
model:
  default: gemini-3-flash-preview
  provider: gemini
  base_url: https://generativelanguage.googleapis.com/v1beta
```

以及 `~/.hermes/.env` 文件：

```bash
GOOGLE_API_KEY=...
```

### 原生 Gemini API

推荐的端点是：

```text
https://generativelanguage.googleapis.com/v1beta
```

Hermes 会检测到这个端点并创建其原生的 Gemini 适配器。在内部，Hermes 仍然将智能体循环保持在 OpenAI 格式的消息中，然后将每个请求转换为 Gemini 的原生模式：

- `messages[]` → Gemini `contents[]`
- 系统提示词 → Gemini `systemInstruction`
- 工具模式 → Gemini `functionDeclarations`
- 工具结果 → Gemini `functionResponse` 部分
- 流式响应 → 用于 Hermes 循环的 OpenAI 格式流块

:::note 关于 Gemini 3 的思考签名
对于 Gemini 3 的工具使用，Hermes 会保留附加在 function-call 部分的 `thoughtSignature` 值，并在下一个工具调用回合中重放它们。这覆盖了对多步智能体工作流至关重要的验证路径。

Gemini 3 也可能在其他响应部分附加思考签名。Hermes 的原生适配器目前针对智能体工具循环进行了优化，因此它还没有以完整的部件级保真度重放每一个非工具调用的签名。
:::

### 优先使用原生端点

Google 也提供了一个与 OpenAI 兼容的端点：

```text
https://generativelanguage.googleapis.com/v1beta/openai/
```

对于 Hermes 智能体会话，请优先使用上面提到的原生 Gemini 端点。Hermes 包含原生的 Gemini 适配器，因此可以将多轮工具使用、工具调用结果、流式传输、多模态输入以及 Gemini 响应元数据直接映射到 Gemini 的 `generateContent` API 上。当你确实需要 OpenAI API 兼容性时，OpenAI 兼容的端点仍然有用。

如果你之前将 `GEMINI_BASE_URL` 设置为了 `/openai` URL，请将其移除或更改：

```bash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

### OAuth 提供商

Hermes 还有一个 `google-gemini-cli` 提供商：

```bash
hermes model
# → 选择 "Google Gemini (OAuth)"
```

这使用浏览器 PKCE 登录和 Cloud Code Assist 后端。对于希望使用 Gemini CLI 风格 OAuth 的用户可能很有用，但 Hermes 会显示明确的警告，因为 Google 可能将第三方软件使用 Gemini CLI OAuth 客户端视为违反政策。对于生产环境或最低风险的使用，请优先选择上面的 API 密钥提供商。

## 可用模型

`hermes model` 选择器会显示 Hermes 提供商注册表中维护的 Gemini 模型。常见选项包括：

| 模型 | ID | 备注 |
|------|----|------|
| Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview` | 可用时最强大的预览模型 |
| Gemini 3 Pro Preview | `gemini-3-pro-preview` | 强大的推理和编码模型 |
| Gemini 3 Flash Preview | `gemini-3-flash-preview` | 推荐的默认选项，兼顾速度和能力 |
| Gemini 3.1 Flash Lite Preview | `gemini-3.1-flash-lite-preview` | 可用时最快/最低成本的选项 |

模型的可用性会随时间变化。如果某个模型消失或未为你的密钥启用，请再次运行 `hermes model` 并从当前列表中选择一个。

:::info 关于模型 ID
当使用 `provider: gemini` 时，请使用 Gemini 的原生模型 ID，例如 `gemini-3-flash-preview`，而不是 OpenRouter 风格的 ID，如 `google/gemini-3-flash-preview`。
:::

### 最新别名

Google 会为 Pro 和 Flash Gemini 系列发布滚动别名。`gemini-pro-latest` 和 `gemini-flash-latest` 当你希望 Google 自动升级模型而无需更改你的 Hermes 配置时很有用。

| 别名 | 当前跟踪 | 备注 |
|------|----------|------|
| `gemini-pro-latest` | 最新的 Gemini Pro 模型 | 当你需要 Google 当前的 Pro 默认模型时最合适 |
| `gemini-flash-latest` | 最新的 Gemini Flash 模型 | 当你需要 Google 当前的 Flash 默认模型时最合适 |

```yaml
model:
  default: gemini-pro-latest
  provider: gemini
  base_url: https://generativelanguage.googleapis.com/v1beta
```

如果需要严格的可重现性，请优先使用明确的模型 ID，例如 `gemini-3.1-pro-preview` 或 `gemini-3-flash-preview`。

### 通过 Gemini API 使用 Gemma

Google 也通过 Gemini API 提供 Gemma 模型。Hermes 将这些识别为 Google 模型，但会将吞吐量很低的 Gemma 条目从默认的模型选择器中隐藏，以免新用户意外为长时间运行的智能体会话选择一个评估级的模型。

有用的评估 ID 包括：

| 模型 | ID | 备注 |
|------|----|------|
| Gemma 4 31B IT | `gemma-4-31b-it` | 更大的 Gemma 模型；适用于兼容性和质量评估 |
| Gemma 4 26B A4B IT | `gemma-4-26b-a4b-it` | 可用时更小的激活参数变体 |

这些模型最好被视为 Gemini API 密钥上的评估选项。Google 的 Gemma API 定价仅限免费层，与生产级 Gemini 模型相比使用上限较低，因此持续的 Hermes 智能体使用通常应转向付费 Gemini 模型、自托管部署或具有适当配额的其他提供商。

要使用从选择器中隐藏的 Gemma 模型，请直接设置：

```yaml
model:
  default: gemma-4-31b-it
  provider: gemini
  base_url: https://generativelanguage.googleapis.com/v1beta
```

## 在会话中切换模型

在对话中使用 `/model` 命令：

```text
/model gemini-3-flash-preview
/model gemini-flash-latest
/model gemini-3-pro-preview
/model gemini-pro-latest
/model gemma-4-31b-it
/model gemini-3.1-flash-lite-preview
```

如果你尚未配置 Gemini，请退出会话并先运行 `hermes model`。`/model` 在已配置的提供商和模型之间切换；它不会收集新的 API 密钥。

## 诊断

```bash
hermes doctor
```

诊断工具会检查：

- `GOOGLE_API_KEY` 或 `GEMINI_API_KEY` 是否可用
- `google-gemini-cli` 的 Gemini OAuth 凭证是否存在
- 配置的提供商凭证是否可以解析

要查看 OAuth 配额使用情况，在 Hermes 会话内运行：

```text
/gquota
```

`/gquota` 适用于 `google-gemini-cli` OAuth 提供商，不适用于 AI Studio API 密钥提供商。

## 网关（消息平台）

Gemini 可与所有 Hermes 网关平台（Telegram、Discord、Slack、WhatsApp、LINE、飞书等）配合使用。将 Gemini 配置为你的提供商，然后正常启动网关：

```bash
hermes gateway setup
hermes gateway start
```

网关会读取 `config.yaml` 并使用相同的 Gemini 提供商配置。

## 故障排除

### "Gemini 原生客户端需要 API 密钥"

Hermes 找不到可用的 API 密钥。在 `~/.hermes/.env` 中添加以下其中之一：

```bash
GOOGLE_API_KEY=...
# 或
GEMINI_API_KEY=...
```

然后再次运行 `hermes model`。

### "此 Google API 密钥处于免费层级"

Hermes 在设置期间会探测 Gemini API 密钥。免费层级的配额可能在几次智能体交互后就耗尽，因为工具使用、重试、压缩和辅助任务可能需要多次模型调用。

在附加到你密钥的 Google Cloud 项目上启用计费，如果需要则重新生成密钥，然后运行：

```bash
hermes model
```

### "404 模型未找到"

所选模型对你的账户、区域或密钥不可用。再次运行 `hermes model` 并从当前列表中选择另一个 Gemini 模型。

### Gemma 模型未显示在 `hermes model` 中

Hermes 可能默认将低吞吐量的 Gemma 模型从选择器中隐藏。如果你有意想评估其中一个，请直接在 `~/.hermes/config.yaml` 中设置模型 ID。

### Gemma 上出现 "429 配额超限"

通过 Gemini API 暴露的 Gemma 模型适用于评估，但它们的 Gemini API 免费层级上限较低。将它们用于兼容性测试，然后为持续的智能体会话切换到付费的 Gemini 模型或其他提供商。

### 配置了 OpenAI 兼容端点

检查 `~/.hermes/.env` 中是否有：

```bash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
```

将其更改为原生端点或移除覆盖：

```bash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

### OAuth 登录警告

`google-gemini-cli` 提供商使用 Gemini CLI / Cloud Code Assist OAuth 流程。Hermes 在启动前会发出警告，因为这与官方的 AI Studio API 密钥路径不同。使用 `provider: gemini` 配合 `GOOGLE_API_KEY` 来进行官方的 API 密钥集成。

### 工具调用因模式错误失败

升级 Hermes 并重新运行 `hermes model`。原生的 Gemini 适配器会为 Gemini 更严格的函数声明格式清理工具模式；较旧的构建版本或自定义端点可能无法做到这一点。

## 相关内容

- [AI 提供商](/integrations/providers)
- [配置](/user-guide/configuration)
- [后备提供商](/user-guide/features/fallback-providers)
- [AWS Bedrock](/guides/aws-bedrock) — 使用 AWS 凭证的原生云提供商集成