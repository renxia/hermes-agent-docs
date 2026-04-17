---
title: "Nous 工具网关"
description: "通过您的 Nous 订阅路由网络搜索、图像生成、文本转语音和浏览器自动化——无需额外的 API 密钥"
sidebar_label: "工具网关"
sidebar_position: 2
---

# Nous 工具网关

:::tip 入门指南
工具网关包含在付费 Nous Portal 订阅中。**[管理您的订阅 →](https://portal.nousresearch.com/manage-subscription)**
:::

**工具网关 (Tool Gateway)** 允许付费 [Nous Portal](https://portal.nousresearch.com) 订阅用户通过现有订阅使用网络搜索、图像生成、文本转语音和浏览器自动化功能——无需为 Firecrawl、FAL、OpenAI 或 Browser Use 注册单独的 API 密钥。

## 功能包括

| 工具 | 功能描述 | 直接替代方案 |
|------|--------------|--------------------|
| **网络搜索与提取** | 通过 Firecrawl 搜索网络并提取页面内容 | `FIRECRAWL_API_KEY`, `EXA_API_KEY`, `PARALLEL_API_KEY`, `TAVILY_API_KEY` |
| **图像生成** | 通过 FAL 生成图像（8 个模型：FLUX 2 Klein/Pro, GPT-Image, Nano Banana Pro, Ideogram, Recraft V4 Pro, Qwen, Z-Image） | `FAL_KEY` |
| **文本转语音** | 通过 OpenAI TTS 将文本转换为语音 | `VOICE_TOOLS_OPENAI_KEY`, `ELEVENLABS_API_KEY` |
| **浏览器自动化** | 通过 Browser Use 控制云浏览器 | `BROWSER_USE_API_KEY`, `BROWSERBASE_API_KEY` |

所有四个工具的费用都计入您的 Nous 订阅。您可以启用任何组合——例如，使用网关进行网络和图像生成，同时为 TTS 保留您自己的 ElevenLabs 密钥。

## 适用性

工具网关适用于**付费** [Nous Portal](https://portal.nousresearch.com/manage-subscription) 订阅用户。免费层级账户无法使用——请[升级您的订阅](https://portal.nousresearch.com/manage-subscription)以解锁此功能。

要检查您的状态：

```bash
hermes status
```

查找 **Nous 工具网关** 部分。它显示了哪些工具通过网关处于活动状态，哪些使用直接密钥，以及哪些未配置。

## 启用工具网关

### 在模型设置期间

当您运行 `hermes model` 并选择 Nous Portal 作为提供商时，Hermes 会自动提供启用工具网关的选项：

```
您的 Nous 订阅包含工具网关。

  工具网关让您可以通过 Nous 订阅访问网络搜索、图像生成、
  文本转语音和浏览器自动化。
  无需注册单独的 API 密钥——只需选择您想要的工具。

  ○ 网络搜索与提取 (Firecrawl) — 未配置
  ○ 图像生成 (FAL) — 未配置
  ○ 文本转语音 (OpenAI TTS) — 未配置
  ○ 浏览器自动化 (Browser Use) — 未配置

  ● 启用工具网关
  ○ 跳过
```

选择 **启用工具网关** 即可完成设置。

如果您已经为某些工具设置了直接 API 密钥，提示会相应调整——您可以为所有工具启用网关（您现有的密钥仍保存在 `.env` 中，但在运行时不使用），仅为未配置的工具启用，或完全跳过。

### 通过 `hermes tools`

您也可以通过交互式工具配置逐个工具启用网关：

```bash
hermes tools
```

选择一个工具类别（Web、Browser、Image Generation 或 TTS），然后选择 **Nous Subscription** 作为提供商。这将把该工具的配置中的 `use_gateway` 设置为 `true`。

### 手动配置

直接在 `~/.hermes/config.yaml` 中设置 `use_gateway` 标志：

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

## 工作原理

当为某个工具设置了 `use_gateway: true` 时，运行时会将 API 调用路由到 Nous 工具网关，而不是使用直接 API 密钥：

1. **网络工具** — `web_search` 和 `web_extract` 使用网关的 Firecrawl 端点
2. **图像生成** — `image_generate` 使用网关的 FAL 端点
3. **TTS** — `text_to_speech` 使用网关的 OpenAI Audio 端点
4. **浏览器** — `browser_navigate` 和其他浏览器工具使用网关的 Browser Use 端点

网关使用您的 Nous Portal 凭证进行身份验证（在运行 `hermes model` 后存储在 `~/.hermes/auth.json` 中）。

### 优先级

每个工具都会首先检查 `use_gateway`：

- **`use_gateway: true`** → 通过网关路由，即使 `.env` 中存在直接 API 密钥
- **`use_gateway: false`**（或缺失）→ 如果可用，使用直接 API 密钥；仅当不存在直接密钥时，才回退到网关

这意味着您可以随时在网关和直接密钥之间切换，而无需删除您的 `.env` 凭证。

## 切换回直接密钥

要停止为特定工具使用网关：

```bash
hermes tools    # 选择工具 → 选择直接提供商
```

或者在配置中设置 `use_gateway: false`：

```yaml
web:
  backend: firecrawl
  use_gateway: false  # 现在使用 .env 中的 FIRECRAWL_API_KEY
```

当您在 `hermes tools` 中选择非网关提供商时，`use_gateway` 标志会自动设置为 `false`，以防止配置冲突。

## 检查状态

```bash
hermes status
```

**Nous 工具网关** 部分显示：

```
◆ Nous 工具网关
  Nous Portal   ✓ 可用管理工具
  Web tools       ✓ 通过 Nous 订阅激活
  Image gen       ✓ 通过 Nous 订阅激活
  TTS             ✓ 通过 Nous 订阅激活
  Browser         ○ 通过 Browser Use 密钥激活
  Modal           ○ 可通过订阅使用（可选）
```

标记为“通过 Nous 订阅激活”的工具会通过网关路由。带有自己密钥的工具会显示哪个提供商处于活动状态。

## 高级：自托管网关

对于自托管或自定义网关部署，您可以通过 `~/.hermes/.env` 中的环境变量覆盖网关端点：

```bash
TOOL_GATEWAY_DOMAIN=nousresearch.com     # 网关路由的基础域名
TOOL_GATEWAY_SCHEME=https                 # HTTP 或 HTTPS（默认：https）
TOOL_GATEWAY_USER_TOKEN=your-token        # 认证令牌（通常自动填充）
FIRECRAWL_GATEWAY_URL=https://...         # 专门覆盖 Firecrawl 端点
```

这些环境变量无论订阅状态如何，在配置中始终可见——它们对于自定义基础设施设置非常有用。

## 常见问题解答

### 我需要删除现有的 API 密钥吗？

不需要。当设置 `use_gateway: true` 时，运行时会跳过直接 API 密钥并路由到网关。您的密钥会保持在 `.env` 中，不受影响。如果您稍后禁用网关，它们将自动再次使用。

### 我可以为某些工具使用网关，为其他工具使用直接密钥吗？

可以。`use_gateway` 标志是针对每个工具的。您可以混合搭配——例如，为网络和图像生成使用网关，为 TTS 使用您自己的 ElevenLabs 密钥，为浏览器自动化使用 Browserbase。

### 如果我的订阅过期了怎么办？

通过网关路由的工具将停止工作，直到您[续订订阅](https://portal.nousresearch.com/manage-subscription)或通过 `hermes tools` 切换到直接 API 密钥。

### 网关与消息网关兼容吗？

是的。工具网关无论您是使用 CLI、Telegram、Discord 还是任何其他消息平台，都会路由工具 API 调用。它在工具运行时级别操作，而不是入口点级别。

### Modal 是否包含在内？

Modal（无服务器终端后端）作为可选附加组件包含在 Nous 订阅中。它不会被工具网关提示启用——请通过 `hermes setup terminal` 或在 `config.yaml` 中单独配置它。