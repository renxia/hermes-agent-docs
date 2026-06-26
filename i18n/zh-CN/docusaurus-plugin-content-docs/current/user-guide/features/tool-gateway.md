---
title: "Nous Tool Gateway"
description: "One subscription, every tool. Web search, image generation, TTS, and cloud browsers — all routed through Nous Portal with no extra API keys."
sidebar_label: "Tool Gateway"
sidebar_position: 2
---

# Nous Tool Gateway

**一次订阅，所有工具尽在掌握。**

工具网关已包含在每个付费的 [Nous Portal](https://portal.nousresearch.com) 订阅中。它将 Hermes 的工具调用——网页搜索、图像生成、文本转语音和云端浏览器自动化——路由到 Nous 已在运行的基础设施上，因此你无需再为了让你智能体变得有用而单独注册 Firecrawl、FAL、OpenAI、Browser Use 等其他服务。

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '1.5rem 0'}}>
  <a href="https://portal.nousresearch.com/manage-subscription" style={{background: 'var(--ifm-color-primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>开始或管理订阅 →</a>
</div>

## 包含内容

| | 工具 | 你能获得 |
|---|---|---|
| 🔍 | **网页搜索与提取** | 智能体级别的网页搜索和通过 Firecrawl 实现的整页提取。无需担心速率限制——网关负责扩展。 |
| 🎨 | **图像生成** | 一个端点下提供九种模型：**FLUX 2 Klein 9B**、**FLUX 2 Pro**、**Z-Image Turbo**、**Nano Banana Pro**（Gemini 3 Pro Image）、**GPT Image 1.5**、**GPT Image 2**、**Ideogram V3**、**Recraft V4 Pro**、**Qwen Image**。可通过参数在每次生成时选择，或让 Hermes 默认使用 FLUX 2 Klein。 |
| 🔊 | **文本转语音** | OpenAI TTS 语音已接入 `text_to_speech` 工具。在 Telegram 中发送语音消息、为流水线生成音频、为任何内容朗读。 |
| 🌐 | **云端浏览器自动化** | 通过 Browser Use 实现无头 Chromium 会话。`browser_navigate`、`browser_click`、`browser_type`、`browser_vision`——所有驱动智能体的原语工具，无需 Browserbase 账户。 |

所有四项均按用量计费，从你的 Nous 订阅中扣除。可以任意组合使用——在通过网络和图像运行网关的同时，保留你自己的 ElevenLabs 密钥用于 TTS，或将一切路由到 Nous。

## 为什么需要它

构建一个真正*能做事*的智能体意味着要拼接 5 个以上的 API 订阅——每个都有自己的注册流程、速率限制、计费方式和特殊情况。网关将其整合为一个账户：

- **一份账单。** 向 Nous 付费；我们处理其余一切。
- **一次注册。** 无需管理 Firecrawl、FAL、Browser Use 或 OpenAI 音频账户。
- **一个密钥。** 你的 Nous Portal OAuth 覆盖所有工具。
- **同等质量。** 与使用直接密钥路径相同的后端——只是由我们提供前端服务。

随时可以引入你自己的密钥——可以按工具随时选择。网关不是锁定，而是一条捷径。

## 开始使用

有三种方式进入——选择最适合你当前情况的：

```bash
hermes setup --portal     # 全新安装：Nous OAuth + 设置 Nous 为提供商 + 一次性开启工具网关
```

```bash
hermes model              # 将推理提供商切换到 Nous Portal——Hermes 随后会提示你为所有工具开启网关
```

```bash
hermes tools              # 按工具启用网关——为你想要的任意工具选择「Nous Subscription」
```

`hermes setup --portal` 和 `hermes model` 是一步到位的路径：登录一次，可选择将所有工具切换到网关。`hermes tools` 是单点式路径——只开启你想要的工具，逐个操作。

**你无需先登录。** 使用 `hermes tools` 时，Nous 管理的后端（网页搜索、图像、视频、TTS、浏览器）始终会显示在列表中，即使你从未登录过 Nous Portal。选择一个后，Hermes 会当场运行 Portal 登录流程（如果你尚未认证）——无需提前运行 `hermes model`。如果你的 Nous OAuth 已激活，选择后端将立即启用，无需额外提示。此路径仅登录并开启你选择的那一个工具——它**不会**切换你的推理提供商，也**不会**提示你为其他所有工具启用网关。

随时查看当前激活状态：

```bash
hermes portal info        # Portal 认证 + 工具网关路由摘要
hermes portal tools       # 网关目录及每个工具的当前路由
hermes status             # 完整系统状态（工具网关是其中一个部分）
```

`hermes portal info` 会显示如下部分：

```
◆ Nous Tool Gateway
  Nous Portal     ✓ 托管工具可用
  Web tools       ✓ 通过 Nous 订阅激活
  Image gen       ✓ 通过 Nous 订阅激活
  TTS             ✓ 通过 Nous 订阅激活
  Browser         ○ 通过 Browser Use 密钥激活
```

标记为「通过 Nous 订阅激活」的工具正通过网关路由。其他任何工具使用的是你自己的密钥。

## 使用资格

工具网关是**付费订阅**功能。免费层级的 Nous 账户可以使用 Portal 进行推理，但不包含托管工具——[升级你的套餐](https://portal.nousresearch.com/manage-subscription)以解锁网关。

部分账户还享有**免费工具池**——一小部分托管工具额度，可在无需付费订阅的情况下覆盖网关工具调用。当有免费池可用时，网关会显示它并在首次使用时显示设置提示，以便你选择加入并立即开始使用托管工具。

## 混合搭配

网关是按工具的。仅为你想要的内容开启：

- **所有工具通过 Nous**——最简便；一份订阅，搞定。
- **网页 + 图像走网关，自带 TTS**——保留你的 ElevenLabs 语音，让 Nous 处理其余部分。
- **仅对你没有密钥的工具使用网关**——"我已经付费使用 Browserbase，但不想注册 Firecrawl 账户"完全没问题。

随时通过以下方式切换任意工具：

```bash
hermes tools          # 每个工具类别的交互式选择器
```

选择工具，选择 **Nous Subscription** 作为提供商（或你偏好的任何直接提供商）。无需编辑配置文件。如果你尚未登录 Nous Portal，选择 **Nos Subscription** 会当场启动 Portal 登录——无需先通过 `hermes model` 进行认证。

## 使用单个图像模型

图像生成默认使用 FLUX 2 Klein 9B 以提高速度。通过将模型 ID 传递给 `image_generate` 工具来覆盖默认值：

| 模型 | ID | 最适用于 |
|---|---|---|
| FLUX 2 Klein 9B | `fal-ai/flux-2/klein/9b` | 快速，良好的默认选择 |
| FLUX 2 Pro | `fal-ai/flux-2-pro` | 更高保真度的 FLUX |
| Z-Image Turbo | `fal-ai/z-image/turbo` | 风格化，快速 |
| Nano Banana Pro | `fal-ai/nano-banana-pro` | Google Gemini 3 Pro Image |
| GPT Image 1.5 | `fal-ai/gpt-image-1.5` | OpenAI 图像生成，文本+图像 |
| GPT Image 2 | `fal-ai/gpt-image-2` | OpenAI 最新版本 |
| Ideogram V3 | `fal-ai/ideogram/v3` | 强大的提示词遵循能力 + 字体排版 |
| Recraft V4 Pro | `fal-ai/recraft/v4/pro/text-to-image` | 矢量风格，平面设计 |
| Qwen Image | `fal-ai/qwen-image` | 阿里巴巴多模态 |

模型集合会不断演进——`hermes tools` → Image Generation 会显示当前实时列表。

---

## 配置参考

大多数用户无需手动操作——`hermes model` 和 `hermes tools` 已交互式覆盖所有工作流。本节面向直接编写 config.yaml 或脚本化配置的用户。

### 按工具的 `use_gateway` 标志

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

优先级：`use_gateway: true` 会路由到 Nous，忽略 `.env` 中的任何直接密钥。`use_gateway: false`（或缺失）在可用时使用直接密钥，仅在不存在任何直接密钥时才回退到网关。

### 禁用网关

```yaml
web:
  use_gateway: false   # Hermes 现在使用 .env 中的 FIRECRAWL_API_KEY
```

当你选择非网关提供商时，`hermes tools` 会自动清除该标志，因此这通常会自动完成。

### 自托管网关（高级）

运行你自己的兼容 Nous 的网关？在 `~/.hermes/.env` 中覆盖端点：

```bash
TOOL_GATEWAY_DOMAIN=your-domain.example.com
TOOL_GATEWAY_SCHEME=https
TOOL_GATEWAY_USER_TOKEN=your-token        # 通常从 Portal 登录自动填充
FIRECRAWL_GATEWAY_URL=https://...         # 专门覆盖某一个端点
```

这些选项用于自定义基础设施配置（企业部署、开发环境）。普通订阅用户无需设置。

## 常见问题

### 能否与 Telegram / Discord / 其他消息网关配合使用？

可以。工具网关在工具执行层运行，而非 CLI。每个能调用工具的接口——CLI、Telegram、Discord、Slack、IRC、Teams、API 服务器，任何东西——都能透明地从中受益。

### 如果我的订阅到期会怎样？

通过网关路由的工具将停止工作，直到你续订或通过 `hermes tools` 替换为直接 API 密钥。Hermes 会显示明确的错误提示，指向 Portal。

### 能否查看每个工具的用量或费用？

可以——[Nous Portal 仪表板](https://portal.nousresearch.com)按工具细分用量，让你了解是什么在驱动你的账单。

### 是否包含 Modal（无服务器终端）？

Modal 作为 Nous 订阅的**可选附加组件**提供，不属于默认工具网关套件。当你需要远程沙箱来执行 shell 时，可通过 `hermes setup terminal` 或直接配置 `config.yaml` 来启用。

### 启用网关后需要删除我现有的 API 密钥吗？

不需要——将它们保留在 `.env` 中。当 `use_gateway: true` 时，Hermes 跳过直接密钥，使用网关。将标志切换回 `false`，你的密钥将再次成为来源。网关不是锁定。