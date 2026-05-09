---
title: "Nous 工具网关"
description: "一次订阅，全部工具。网络搜索、图像生成、TTS 和云端浏览器——全部通过 Nous Portal 路由，无需额外 API 密钥。"
sidebar_label: "工具网关"
sidebar_position: 2
---

# Nous 工具网关

**一次订阅，内置全部工具。**

工具网关包含在每一个付费 [Nous Portal](https://portal.nousresearch.com) 订阅中。它将 Hermes 的工具调用——网络搜索、图像生成、文本转语音和云端浏览器自动化——通过 Nous 已经运行的基础设施进行路由，因此你无需再注册 Firecrawl、FAL、OpenAI、Browser Use 或其他任何服务，就能让你的智能体发挥作用。

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '1.5rem 0'}}>
  <a href="https://portal.nousresearch.com/manage-subscription" style={{background: 'var(--ifm-color-primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>开始或管理订阅 →</a>
</div>

## 包含内容

| | 工具 | 你能获得什么 |
|---|---|---|
| 🔍 | **网络搜索与提取** | 通过 Firecrawl 实现智能体级别的网络搜索和全页提取。无需担心速率限制——网关会处理扩展问题。 |
| 🎨 | **图像生成** | 一个端点集成九种模型：**FLUX 2 Klein 9B**、**FLUX 2 Pro**、**Z-Image Turbo**、**Nano Banana Pro**（Gemini 3 Pro Image）、**GPT Image 1.5**、**GPT Image 2**、**Ideogram V3**、**Recraft V4 Pro**、**Qwen Image**。可通过标志每次生成时选择，或让 Hermes 默认使用 FLUX 2 Klein。 |
| 🔊 | **文本转语音** | 将 OpenAI TTS 语音接入 `text_to_speech` 工具。在 Telegram 中发送语音笔记，为流水线生成音频，为任何内容配音。 |
| 🌐 | **云端浏览器自动化** | 通过 Browser Use 实现无头 Chromium 会话。`browser_navigate`、`browser_click`、`browser_type`、`browser_vision`——所有驱动智能体的基本操作，无需 Browserbase 账户。 |

所有四项均按使用量计费，从你的 Nous 订阅中扣除。可任意组合使用——运行网关处理网络和图像，同时保留自己的 ElevenLabs 密钥用于 TTS，或将所有内容都通过 Nous 路由。

## 为何需要它

构建一个真正*能做事情*的智能体意味着要将 5 个以上的 API 订阅拼接在一起——每个都有各自的注册、速率限制、计费和特性。网关将其整合为一个账户：

- **一张账单。** 向 Nous 付款；其余由我们处理。
- **一次注册。** 无需管理 Firecrawl、FAL、Browser Use 或 OpenAI 音频账户。
- **一个密钥。** 你的 Nous Portal OAuth 涵盖所有工具。
- **相同质量。** 与直接使用密钥相同的后端——只是由我们作为前端。

随时可自带密钥——按工具，按需使用。网关并非锁定，而是捷径。

## 开始使用

```bash
hermes model          # 选择 Nous Portal 作为你的提供商
```

当你选择 Nous Portal 时，Hermes 会提供开启工具网关的选项。接受后，你便完成了设置——下一次运行时，所有支持的工具都将启用。

随时检查哪些工具处于活动状态：

```bash
hermes status
```

你将看到类似以下的部分：

```
◆ Nous 工具网关
  Nous Portal     ✓ 托管工具可用
  网络工具       ✓ 通过 Nous 订阅激活
  图像生成       ✓ 通过 Nous 订阅激活
  TTS             ✓ 通过 Nous 订阅激活
  浏览器         ○ 通过 Browser Use 密钥激活
```

标记为“通过 Nous 订阅激活”的工具正在通过网关运行。其他工具则使用你自己的密钥。

## 资格要求

工具网关是**付费订阅**功能。免费层级的 Nous 账户可使用 Portal 进行推理，但不包含托管工具——[升级你的计划](https://portal.nousresearch.com/manage-subscription)以解锁网关。

## 混合搭配

网关按工具启用。仅为所需工具开启：

- **所有工具通过 Nous** —— 最简单；一次订阅，完成。
- **网关用于网络+图像，自带 TTS** —— 保留你的 ElevenLabs 语音，其余由 Nous 处理。
- **网关仅用于你没有密钥的工具** —— “我已为 Browserbase 付费，但不想要 Firecrawl 账户”完全可行。

随时通过以下方式切换任何工具：

```bash
hermes tools          # 每个工具类别的交互式选择器
```

选择工具，选择 **Nous 订阅**作为提供商（或任何你偏好的直接提供商）。无需编辑配置文件。

## 使用单个图像模型

图像生成默认使用 FLUX 2 Klein 9B 以获得速度。通过在 `image_generate` 工具中传递模型 ID 来覆盖每次调用：

| 模型 | ID | 最适合 |
|---|---|---|
| FLUX 2 Klein 9B | `fal-ai/flux-2/klein/9b` | 快速，良好默认值 |
| FLUX 2 Pro | `fal-ai/flux-2/pro` | 更高保真度的 FLUX |
| Z-Image Turbo | `fal-ai/z-image/turbo` | 风格化，快速 |
| Nano Banana Pro | `fal-ai/gemini-3-pro-image` | Google Gemini 3 Pro Image |
| GPT Image 1.5 | `fal-ai/gpt-image-1/5` | OpenAI 图像生成，文本+图像 |
| GPT Image 2 | `fal-ai/gpt-image-2` | OpenAI 最新 |
| Ideogram V3 | `fal-ai/ideogram/v3` | 强提示 adherence + 排版 |
| Recraft V4 Pro | `fal-ai/recraft/v4/pro` | 矢量风格，平面设计 |
| Qwen Image | `fal-ai/qwen-image` | 阿里巴巴多模态 |

该集合会不断演进——`hermes tools` → 图像生成 会显示当前实时列表。

---

## 配置参考

大多数用户永远不需要接触此部分——`hermes model` 和 `hermes tools` 以交互方式涵盖所有工作流程。本节适用于直接编写 config.yaml 或脚本化设置。

### 每个工具的 `use_gateway` 标志

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

优先级：`use_gateway: true` 会通过 Nous 路由，无论 `.env` 中是否存在任何直接密钥。`use_gateway: false`（或未设置）会使用直接密钥（如果可用），仅在不存在时才会回退到网关。

### 禁用网关

```yaml
web:
  use_gateway: false   # Hermes 现在使用 .env 中的 FIRECRAWL_API_KEY
```

当你选择非网关提供商时，`hermes tools` 会自动清除该标志，因此这通常会由系统自动完成。

### 自托管网关（高级）

运行你自己的与 Nous 兼容的网关？在 `~/.hermes/.env` 中覆盖端点：

```bash
TOOL_GATEWAY_DOMAIN=your-domain.example.com
TOOL_GATEWAY_SCHEME=https
TOOL_GATEWAY_USER_TOKEN=your-token        # 通常由 Portal 登录自动填充
FIRECRAWL_GATEWAY_URL=https://...         # 专门覆盖一个端点
```

这些选项适用于自定义基础设施设置（企业部署、开发环境）。常规订阅者无需设置它们。

## 常见问题

### 它是否适用于 Telegram / Discord / 其他消息网关？

是的。工具网关在工具执行层运行，而非 CLI 层。任何可以调用工具的接口——CLI、Telegram、Discord、Slack、IRC、Teams、API 服务器等——都能透明地从中受益。

### 如果我的订阅过期会怎样？

通过网关路由的工具将停止工作，直到你续订或通过 `hermes tools` 更换为直接 API 密钥。Hermes 会显示一个清晰的错误，指向 portal。

### 我能否查看每个工具的使用情况或成本？

是的——[Nous Portal 仪表板](https://portal.nousresearch.com)会按工具细分使用情况，以便你了解是什么驱动了你的账单。

### Modal（无服务器终端）是否包含在内？

Modal 可通过 Nous 订阅作为**可选附加组件**获得，但不属于默认工具网关捆绑包的一部分。当你需要远程沙箱进行 shell 执行时，可通过 `hermes setup terminal` 或直接编辑 `config.yaml` 进行配置。

### 启用网关时，我是否需要删除现有的 API 密钥？

不需要——请将它们保留在 `.env` 中。当 `use_gateway: true` 时，Hermes 会跳过直接密钥并使用网关。将标志切换回 `false`，你的密钥将再次成为来源。网关并非锁定。