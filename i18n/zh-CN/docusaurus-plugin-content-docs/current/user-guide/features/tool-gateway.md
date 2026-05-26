---
title: "Nous 工具网关"
description: "一次订阅，尽享所有工具。网页搜索、图像生成、TTS 以及云浏览器——所有功能均通过 Nous Portal 路由，无需额外 API 密钥。"
sidebar_label: "工具网关"
sidebar_position: 2
---

# Nous 工具网关

**一次订阅。内置所有工具。**

工具网包含于每个付费 [Nous Portal](https://portal.nousresearch.com) 订阅中。它通过 Nous 已运行的基础设施来路由 Hermes 的工具调用——网页搜索、图像生成、文本转语音以及云浏览器自动化——因此您无需为了使其智能体变得有用而单独在 Firecrawl、FAL、OpenAI、Browser Use 或任何其他平台注册账户。

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '1.5rem 0'}}>
  <a href="https://portal.nousresearch.com/manage-subscription" style={{background: 'var(--ifm-color-primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>开始或管理订阅 →</a>
</div>

## 包含内容

| | 工具 | 您将获得 |
|---|---|---|
| 🔍 | **网页搜索与提取** | 通过 Firecrawl 实现的智能体级网页搜索和整页提取。无需担心速率限制——网关会处理扩缩容。 |
| 🎨 | **图像生成** | 一个端点下包含九个模型：**FLUX 2 Klein 9B**、**FLUX 2 Pro**、**Z-Image Turbo**、**Nano Banana Pro**（Gemini 3 Pro Image）、**GPT Image 1.5**、**GPT Image 2**、**Ideogram V3**、**Recraft V4 Pro**、**Qwen Image**。可通过标志按次选择，或让 Hermes 默认使用 FLUX 2 Klein。 |
| 🔊 | **文本转语音** | OpenAI TTS 语音已集成到 `text_to_speech` 工具中。可将语音消息放入 Telegram，为流水线生成音频，为任何内容添加旁白。 |
| 🌐 | **云浏览器自动化** | 通过 Browser Use 提供的无头 Chromium 会话。`browser_navigate`、`browser_click`、`browser_type`、`browser_vision`——所有驱动智能体的基本操作，无需拥有 Browserbase 账户。 |

所有四项功能均按用量计费，计入您的 Nous 订阅。可任意组合使用——例如，将网关用于网页和图像，同时保留自己的 ElevenLabs 密钥用于 TTS，或将所有功能路由至 Nous。

## 为何推出此功能

构建一个能真正*做事*的智能体，意味着要拼接 5 个以上的 API 订阅——每个都有自己的注册、速率限制、计费方式和特殊之处。网关将其整合为一个账户：

- **一张账单。** 支付 Nous 费用；其余交给我们处理。
- **一次注册。** 无需管理 Firecrawl、FAL、Browser Use 或 OpenAI 音频账户。
- **一个密钥。** 您的 Nous Portal OAuth 覆盖所有工具。
- **同等质量。** 使用与直接密钥路由相同的后端——只是由我们统一接入。

您随时可以按工具、按需自行接入密钥。网关并非锁定，而是一条捷径。

## 快速上手

全新安装的最快路径：

```bash
hermes setup --portal     # Nous OAuth，将 Nous 设为提供商，并一次性开启工具网关
```

已经配置过 Hermes？只需切换提供商：

```bash
hermes model              # 选择 Nous Portal —— Hermes 会提议为您开启工具网关
```

当您选择 Nous Portal 时，Hermes 会提议开启工具网关。接受后即完成设置——所有支持的工具在下次运行时均将生效。

可随时检查哪些工具处于活动状态：

```bash
hermes portal status      # Portal 认证 + 工具网关路由摘要
hermes portal tools       # 网关目录，包含每个工具的当前路由
hermes status             # 完整系统状态（工具网关是其中一个部分）
```

`hermes portal status` 会显示类似如下的部分：

```
◆ Nous 工具网关
  Nous Portal     ✓ 受管工具可用
  网页工具       ✓ 通过 Nous 订阅激活
  图像生成       ✓ 通过 Nous 订阅激活
  TTS             ✓ 通过 Nous 订阅激活
  浏览器         ○ 通过 Browser Use 密钥激活
```

标记为"通过 Nous 订阅激活"的工具正在通过网关。其他任何工具则使用您自己的密钥。

## 适用条件

工具网关是**付费订阅**功能。免费层级的 Nous 账户可以使用 Portal 进行推理，但不包含受管工具——[升级您的计划](https://portal.nousresearch.com/manage-subscription) 以解锁网关。

## 灵活搭配

网关可按工具分别启用。只为所需工具开启：

- **所有工具通过 Nous** —— 最简单；一次订阅，搞定。
- **网关用于网页 + 图像，自行接入 TTS** —— 保留您的 ElevenLabs 语音，其余交给我们。
- **网关仅用于您没有密钥的功能** —— “我已经为 Browserbase 付费，但不想再注册 Firecrawl 账户” 这种情况完全可以。

可随时通过以下命令切换任何工具：

```bash
hermes tools          # 交互式选择器，用于每个工具类别
```

选择工具，将 **Nous Subscription** 选为提供商（或您偏好的任何直接提供商）。无需编辑配置文件。

## 使用单个图像模型

图像生成默认使用 FLUX 2 Klein 9B 以求速度。您可以通过向 `image_generate` 工具传递模型 ID 来按次调用覆盖：

| 模型 | ID | 适用场景 |
|---|---|---|
| FLUX 2 Klein 9B | `fal-ai/flux-2/klein/9b` | 快速，良好的默认选项 |
| FLUX 2 Pro | `fal-ai/flux-2/pro` | 更高保真度的 FLUX |
| Z-Image Turbo | `fal-ai/z-image/turbo` | 风格化，速度快 |
| Nano Banana Pro | `fal-ai/gemini-3-pro-image` | 谷歌 Gemini 3 Pro Image |
| GPT Image 1.5 | `fal-ai/gpt-image-1/5` | OpenAI 图像生成，文本+图像 |
| GPT Image 2 | `fal-ai/gpt-image-2` | OpenAI 最新版 |
| Ideogram V3 | `fal-ai/ideogram/v3` | 强提示词遵循 + 排版 |
| Recraft V4 Pro | `fal-ai/recraft/v4/pro` | 矢量风格，平面设计 |
| Qwen Image | `fal-ai/qwen-image` | 阿里巴巴多模态 |

此列表会不断更新 —— `hermes tools` → 图像生成 中显示当前实时列表。

---

## 配置参考

大多数用户无需触碰此部分——`hermes model` 和 `hermes tools` 以交互方式涵盖了所有工作流程。本节适用于直接编写 config.yaml 或脚本化配置。

### 按工具 `use_gateway` 标志

每个工具的配置块接受一个 `use_gateway` 布尔值：

```yaml
web:
  backend: firecrawl
  use_gateway: true

image_gen:
  use_gateway: true

tts:
  provider: openai
  use_gateway: true

browser:
  cloud_provider: browser-use
  use_gateway: true
```

优先级：`use_gateway: true` 将通过 Nous 路由，无论 `.env` 中是否有直接密钥。`use_gateway: false`（或省略）将优先使用直接密钥（如果可用），仅当没有直接密钥时才回退到网关。

### 禁用网关

```yaml
web:
  use_gateway: false   # Hermes 现在将使用 .env 中的 FIRECRAWL_API_KEY
```

当您通过 `hermes tools` 选择非网关提供商时，该标志会自动清除，因此通常会为您处理。

### 自托管网关（高级）

运行您自己的 Nous 兼容网关？在 `~/.hermes/.env` 中覆盖端点：

```bash
TOOL_GATEWAY_DOMAIN=your-domain.example.com
TOOL_GATEWAY_SCHEME=https
TOOL_GATEWAY_USER_TOKEN=your-token        # 通常由 Portal 登录自动填充
FIRECRAWL_GATEWAY_URL=https://...         # 特别覆盖单个端点
```

这些旋钮用于自定义基础设施设置（企业部署、开发环境）。普通订阅者无需设置它们。

## 常见问题

### 它是否兼容 Telegram / Discord / 其他消息网关？

是的。工具网关在工具执行层工作，而非 CLI 层。每个能够调用工具的接口——CLI、Telegram、Discord、Slack、IRC、Teams、API 服务器，等等——都能透明地受益。

### 如果我的订阅过期会怎样？

通过网关路由的工具将停止工作，直到您续订或通过 `hermes tools` 换入直接 API 密钥。Hermes 会显示明确的错误，指向 Portal。

### 我能查看每个工具的使用情况或成本吗？

可以——[Nous Portal 仪表板](https://portal.nousresearch.com) 按工具细分使用情况，以便您查看是什么在驱动您的账单。

### Modal（无服务器终端）是否包含在内？

Modal 可作为 Nous 订阅的**可选附加组件**使用，并非默认工具网关捆绑包的一部分。当您需要用于 shell 执行的远程沙盒时，可通过 `hermes setup terminal` 或在 `config.yaml` 中直接配置。

### 启用网关后，我需要删除现有的 API 密钥吗？

不需要——将它们保留在 `.env` 中。当 `use_gateway: true` 时，Hermes 跳过直接密钥并使用网关。将标志切换回 `false`，您的密钥将重新成为数据源。网关并非锁定。