---
sidebar_position: 1
title: "Nous Portal"
description: "One subscription, 300+ frontier models, the Tool Gateway, and Nous Chat — the recommended way to run Hermes Agent"
---

# Nous Portal

[Nous Portal](https://portal.nousresearch.com) 是 Nous Research 的统一订阅入口，也是**运行 Hermes 智能体的推荐方式**。一次 OAuth 登录即可替代在各大模型实验室、搜索 API、图像生成器和浏览器提供商之间分别管理账户、API 密钥和账单关系的繁琐操作。

如果你只有一项配置的时间，就配置这个。最快路径：

```bash
hermes setup --portal
```

该命令会完成 Portal OAuth 登录，让你选择一个 Nous 模型，在 `config.yaml` 中将 Nous 设为推理提供商，并开启 Tool Gateway。之后你就可以立即使用 `hermes chat` 了。

还没有订阅？[portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription) — 注册后再回来运行上面的命令。

## 订阅包含的内容

### 300+ 前沿模型，统一账单

Portal 代理了来自整个生态系统的精选智能体模型目录 — 费用从你的 Nous 订阅中扣除，无需为每个实验室单独管理额度。

| 系列 | 模型 |
|--------|------|
| **Anthropic Claude** | Opus 4.7, Opus 4.6, Sonnet 4.6, Haiku 4.5 |
| **OpenAI** | GPT-5.5, GPT-5.5 Pro, GPT-5.4 Mini, GPT-5.4 Nano, GPT-5.3 Codex |
| **Google Gemini** | Gemini 3 Pro Preview, Gemini 3 Flash Preview, Gemini 3.1 Pro Preview, Gemini 3.1 Flash Lite Preview |
| **DeepSeek** | DeepSeek V4 Pro |
| **Qwen** | Qwen3.7-Max, Qwen3.6-35B-A3B |
| **Kimi / Moonshot** | Kimi K2.6 |
| **GLM / Zhipu** | GLM-5.1 |
| **MiniMax** | MiniMax M2.7 |
| **xAI** | Grok 4.3 |
| **NVIDIA** | Nemotron-3 Super 120B-A12B |
| **Tencent** | Hunyuan 3 Preview |
| **Xiaomi** | MiMo V2.5 Pro |
| **StepFun** | Step 3.5 Flash |
| **Hermes** | Hermes-4-70B, Hermes-4-405B（对话，参见[下方说明](#关于-hermes-4 的说明)） |
| **+ 其他所有模型** | 280+ 额外模型 — 完整的前沿智能体阵容 |

路由在底层通过 OpenRouter 完成，因此模型可用性和故障转移行为与使用 OpenRouter 密钥时一致 — 只是费用从你的 Nous 订阅中扣除。在会话中途用 `/model` 在 Claude Sonnet 4.6（用于代码）和 Gemini 3 Pro（用于长上下文）之间切换 — 无需新凭证，无需充值，不会出现余额为零的意外错误。

### Nous Tool Gateway

同一订阅还解锁了 [Tool Gateway](/user-guide/features/tool-gateway)，将 Hermes 智能体的工具调用通过 Nous 管理的基础设施进行路由。五个后端，一次登录：

| 工具 | 合作方 | 功能 |
|------|--------|------|
| **网络搜索与提取** | Firecrawl | 智能体级别的搜索和整页提取。无需 Firecrawl API 密钥，无需操心速率限制。 |
| **图像生成** | FAL | 一个端点下九种模型：FLUX 2 Klein 9B, FLUX 2 Pro, Z-Image Turbo, Nano Banana Pro（Gemini 3 Pro Image）, GPT Image 1.5, GPT Image 2, Ideogram V3, Recraft V4 Pro, Qwen Image。 |
| **文本转语音** | OpenAI TTS | 高质量 TTS，无需单独的 OpenAI 密钥。支持跨消息平台的[语音模式](/user-guide/features/voice-mode)。 |
| **云浏览器自动化** | Browser Use | 无头 Chromium 会话，支持 `browser_navigate`、`browser_click`、`browser_type`、`browser_vision`。无需 Browserbase 账户。 |
| **云终端沙箱** | Modal | 用于代码执行的无服务器终端沙箱（可选附加组件）。 |

没有 Gateway 的话，接入每一项工具意味着需要 Firecrawl 账户、FAL 账户、Browser Use 账户、OpenAI 密钥和 Modal 账户 — 五次独立注册、五个独立仪表盘、五个独立充值流程。有了 Gateway，所有这些都通过一个订阅路由。

你也可以只启用特定的 Gateway 工具（例如只启用网络搜索而不启用图像生成）— 参见下方[将 Gateway 与自己的后端混合使用](#将-gateway-与自己的后端混合使用)。

### Nous Chat

你的 Portal 账户还包含 [chat.nousresearch.com](https://chat.nousresearch.com) — Nous Research 的网页聊天界面，使用相同的模型目录。当你在终端之外，或进行非智能体对话工作时非常有用。

### 你的 dotfiles 中不再有凭证

因为一切通过一次 OAuth 认证的 Portal 会话路由，你不必在 `.env` 文件中积累十几个长期有效的 API 密钥。磁盘上唯一的凭证是 `~/.hermes/auth.json` 中的刷新令牌，Hermes 会基于它为每个请求生成短期 JWT — 参见下方[令牌处理](#令牌处理)。

### 跨平台一致性

[原生 Windows 版](/user-guide/windows-native) 中，逐个工具设置 API 密钥是最棘手的地方 — 在 Windows 上配置 Firecrawl 账户、FAL 账户、Browser Use 账户、OpenAI 密钥是搭建一个可用智能体过程中摩擦最大的部分。Portal 订阅消除了这些障碍：一次 OAuth 覆盖模型和所有 Gateway 工具，因此 Windows 用户可以获得与 macOS/Linux 相同的体验，无需手动配置四个后端。

## 关于 Hermes 4 的说明

Nous Research 自家的 **Hermes 4** 系列（Hermes-4-70B、Hermes-4-405B）可通过 Portal 以大幅折扣价获取。这些是**前沿混合推理聊天模型**——擅长数学、科学、指令遵循、模式遵循、角色扮演和长文本写作。

但**不建议在 Hermes 智能体中使用**。Hermes 4 针对聊天和推理进行了调优，而非智能体所依赖的快速工具调用循环。请将其用于 [Nous Chat](https://chat.nousresearch.com)、研究工作流，或通过 [订阅代理](/user-guide/features/subscription-proxy) 从其他工具调用——但对于智能体工作，请从目录中选择一个前沿智能体模型：

```bash
/model anthropic/claude-sonnet-4.6     # 最佳通用智能体模型
/model openai/gpt-5.5-pro              # 强大的推理 + 工具调用
/model google/gemini-3-pro-preview     # 超大上下文窗口
/model deepseek/deepseek-v4-pro        # 高性价比编码模型
```

Portal 自身的 [模型信息页面](https://portal.nousresearch.com/info) 也有同样的警告，因此这不是 Hermes 端的意见——而是 Nous Research 的官方指导。

## 设置

### 全新安装——一条命令

```bash
hermes setup --portal
```

这将一次性完成全部设置：

1. 打开浏览器访问 portal.nousresearch.com 进行 OAuth 登录
2. 将刷新令牌存储在 `~/.hermes/auth.json` 中
3. 允许你从精选列表中选择 Nous 模型（或跳过以保留当前模型）
4. 将 Nous 设置为 `~/.hermes/config.yaml` 中的推理提供商（选择模型时）
5. 开启工具网关（网页、图像、TTS、浏览器路由）
6. 返回你的终端，随时可以 `hermes chat`

如果你还没有订阅，请先前往 [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription) 注册。

### 已有安装——将 Portal 与其他提供商并列使用

如果你已经配置了 Hermes 并使用了 OpenRouter、Anthropic 或其他提供商，想要在此基础上添加 Portal：

```bash
hermes model
# 从提供商列表中选择 "Nous Portal"
# 浏览器打开，登录，完成
```

你现有的提供商配置保持不变。你可以在会话中用 `/model` 切换，或在会话间用 `hermes model` 切换——Portal 成为你可用的提供商之一，而非唯一的提供商。

### 无头 / SSH / 远程设置

OAuth 需要浏览器，但回环回调运行在 Hermes 所在的机器上。对于远程主机，请参阅 [OAuth over SSH / 远程主机](/guides/oauth-over-ssh)——Portal 的模式与任何其他基于 OAuth 的提供商相同（`ssh -L` 端口转发、适用于 Cloud Shell / Codespaces 等仅浏览器环境的 `--manual-paste`）。

### 配置文件设置

如果你使用 [Hermes 配置文件](/user-guide/profiles)，Portal 刷新令牌会通过共享令牌存储在所有配置文件间自动共享。在任何配置文件上登录一次，其余配置文件会自动获取——无需为每个配置文件重复 OAuth 流程。

## 日常使用 Portal

### 检查已配置的内容

```bash
hermes portal            # 登录到 Nous Portal + 完成设置（一次性引导）
hermes portal info       # 登录状态、订阅信息、模型 + 网关路由
hermes portal status     # `portal info` 的别名
hermes portal tools      # 详细的工具网关目录及每个工具的路由
hermes portal open       # 在浏览器中打开订阅管理页面
```

`hermes portal`（无子命令）是 `hermes auth add nous --type oauth` 的人类可读别名——它会让你登录，选择 Nous 模型，将 Nous 设置为推理提供商，并提供工具网关选择加入（与 `hermes setup --portal` 相同，也与首次快速设置中的 Nous 流程相同）。

`hermes portal info` 提供高层概览：

```
  Nous Portal
  ───────────
  Auth:    ✓ 已登录
  Portal:  https://portal.nousresearch.com
  Model:   ✓ 使用 Nous 作为推理提供商

  工具网关
  ────────────
  网页搜索与提取  通过 Nous Portal
  图像生成        通过 Nous Portal
  文本转语音      通过 Nous Portal
  浏览器自动化    通过 Nous Portal
  云终端          未配置
```

### 切换模型

在会话内：

```bash
/model anthropic/claude-sonnet-4.6
/model openai/gpt-5.5-pro
/model google/gemini-3-pro-preview
```

或打开选择器：

```bash
/model
# 方向键，回车选择
```

在会话外（完整的设置向导，添加新提供商时有用）：

```bash
hermes model
```

### 将网关与自己的后端混合使用

如果你已经有例如 Browserbase 账户，并希望继续使用它，同时将网页搜索和图像生成路由到 Nous，这是支持的。使用 `hermes tools` 为每个工具选择后端：

```bash
hermes tools
# → 网页搜索       → "Nous Subscription"
# → 图像生成       → "Nous Subscription"
# → 浏览器          → "Browserbase"  (你已有的密钥)
# → TTS            → "Nous Subscription"
```

工具网关是按工具选择加入的，而非全有或全无。无论你是否登录了 Nous Portal，托管后端都会显示在 `hermes tools` 中——如果你在认证前选择了 "Nous Subscription"，Hermes 会内联运行 Portal 登录（它不会更改你的推理提供商或影响你的其他工具）。完整的逐工具配置矩阵请参阅 [工具网关文档](/user-guide/features/tool-gateway)。

### 订阅管理

随时管理你的套餐、查看用量或升级/取消：

- **网页：** [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription)
- **CLI 快捷方式：** `hermes portal open`（在默认浏览器中打开同一页面）

## 配置参考

执行 `hermes setup --portal` 后，`~/.hermes/config.yaml` 将如下所示：

```yaml
model:
  provider: nous
  default: anthropic/claude-sonnet-4.6     # 或你选择的任何模型
  base_url: https://inference-api.nousresearch.com/v1
```

工具网关设置位于各自对应的工具部分下：

```yaml
web:
  backend: nous       # 网页搜索/提取通过工具网关路由

image_gen:
  provider: nous

tts:
  provider: nous

browser:
  backend: nous
```

OAuth 刷新令牌单独存储在 `~/.hermes/auth.json` 中（不在 `config.yaml` 中——凭证和配置按设计分开保存）。

## 令牌处理

Hermes 在每次推理调用时从你存储的 Portal 刷新令牌生成一个短期 JWT，而非重复使用长期 API 密钥。令牌生命周期完全自动——刷新、生成、遇到临时 401 时重试——你永远不会看到它。

如果 Portal 使刷新令牌失效（密码更改、手动撤销、会话过期），失效的刷新令牌会被**本地隔离**，因此 Hermes 会停止重放它，你不会看到一连串相同的 401 错误。下一次调用会显示明确的"需要重新认证"消息。运行 `hermes auth add nous` 重新登录；隔离将在下次成功登录时清除。

## 故障排除

### `hermes portal info` 显示"未登录"

你尚未完成 OAuth 流程，或你的刷新令牌已被清除。运行：

```bash
hermes portal
```

或使用 `hermes model` 重新选择 Nous Portal。

### 会话中出现"需要重新认证"消息

你的 Portal 刷新令牌已失效（密码更改、手动撤销或会话过期）。运行 `hermes auth add nous`，你的下一次请求将使用新凭证。旧令牌上的任何隔离将在成功重新登录时自动清除。

### 想要使用 Portal 未暴露的特定提供商模型

Portal 通过 OpenRouter 进行代理，因此 OpenRouter 支持的任何模型通常都可用。如果某个特定模型未出现在 `/model` 中，请直接尝试 OpenRouter 风格的标识符：

```bash
/model anthropic/claude-opus-4.6
```

如果某个模型确实缺失，请 [提交 issue](https://github.com/NousResearch/hermes-agent/issues)——我们将 Portal 的目录呈现给 Hermes，缺失通常意味着我们可以更新路由配置。

### 账单未出现在我的 Portal 账户上

首先检查 `hermes portal info`——如果它显示你正在使用不同的提供商（`Model: currently openrouter` 而非 `using Nous as inference provider`），你的本地配置已偏移。运行 `hermes model`，选择 Nous Portal，下一次请求将通过你的订阅路由。

## 另请参阅

- **[工具网关](/user-guide/features/tool-gateway)** ——每个网关工具、逐工具配置和定价的完整详情
- **[订阅代理](/user-guide/features/subscription-proxy)** ——从非 Hermes 工具（其他智能体、脚本、第三方客户端）使用你的 Portal 订阅
- **[语音模式](/user-guide/features/voice-mode)** ——使用 Portal 的 OpenAI TTS 进行语音对话
- **[AI 提供商](/integrations/providers)** ——如果你想比较替代方案，请查看完整的提供商目录
- **[OAuth over SSH](/guides/oauth-over-ssh)** ——从远程主机或仅浏览器环境登录
- **[配置文件](/user-guide/profiles)** ——共享一个 Portal 登录的多个 Hermes 配置