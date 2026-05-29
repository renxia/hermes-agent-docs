---
sidebar_position: 1
title: "Nous Portal"
description: "一次订阅，300+ 前沿模型，工具门户，以及 Nous Chat — 运行 Hermes Agent 的推荐方式"
---

# Nous Portal

[Nous Portal](https://portal.nousresearch.com) 是 Nous Research 的统一订阅门户，也是**运行 Hermes Agent 的推荐方式**。一次 OAuth 登录即可取代您需要手动对接每个模型实验室、搜索 API、图像生成器和浏览器提供商时，在多个账户、API 密钥和计费关系之间的周旋。

如果您只有一件事的时间进行设置，那就设置这个。最快捷的路径：

```bash
hermes setup --portal
```

这条命令会执行 Portal OAuth 登录，在 `config.yaml` 中将 Nous 设置为您的推理提供商，并开启工具门户。命令执行完毕后，您就可以立即使用 `hermes chat` 了。

还没有订阅？[portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription) — 注册账户，然后回来运行上面的命令。

## 订阅包含什么

### 300+ 前沿模型，一张账单

Portal 代理了来自整个生态系统的精选智能体模型目录——费用直接从您的 Nous 订阅中扣除，而不是为每个实验室单独充值。

| 系列 | 模型 |
|--------|--------|
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
| **Hermes** | Hermes-4-70B, Hermes-4-405B (聊天模型，[请参阅下方说明](#关于-hermes-4)) |
| **+ 所有其他** | 280+ 个额外模型——完整的智能体前沿 |

底层路由通过 OpenRouter 进行，因此模型的可用性和故障转移行为与您直接使用 OpenRouter 密钥时一致——只是费用从您的 Nous 订阅中扣除。您可以在会话中途使用 `/model` 在 Claude Sonnet 4.6（用于代码）和 Gemini 3 Pro（用于长上下文）之间切换——无需新凭证，无需充值，也不会出现意外的零余额错误。

### Nous 工具门户

同一订阅还解锁了[工具门户](/user-guide/features/tool-gateway)，它将 Hermes Agent 的工具调用路由到 Nous 管理的基础设施。五个后端，一次登录：

| 工具 | 合作伙伴 | 功能 |
|------|---------|--------------|
| **网页搜索与提取** | Firecrawl | 智能体级别的搜索和全文提取。无需 Firecrawl API 密钥，无需费心管理速率限制。 |
| **图像生成** | FAL | 一个端点下包含九个模型：FLUX 2 Klein 9B, FLUX 2 Pro, Z-Image Turbo, Nano Banana Pro (Gemini 3 Pro Image), GPT Image 1.5, GPT Image 2, Ideogram V3, Recraft V4 Pro, Qwen Image。 |
| **文本转语音** | OpenAI TTS | 无需单独的 OpenAI 密钥即可使用高质量 TTS。支持跨消息平台的[语音模式](/user-guide/features/voice-mode)。 |
| **云端浏览器自动化** | Browser Use | 用于 `browser_navigate`、`browser_click`、`browser_type`、`browser_vision` 的无头 Chromium 会话。无需 Browserbase 账户。 |
| **云端终端沙盒** | Modal | 用于代码执行的无服务器终端沙盒（可选附加组件）。 |

如果没有门户，接入上述每个工具意味着需要一个 Firecrawl 账户、一个 FAL 账户、一个 Browser Use 账户、一个 OpenAI 密钥和一个 Modal 账户——五次独立的注册、五个独立的控制台、五套独立的充值流程。有了门户，所有这一切都通过一个订阅进行路由。

您也可以仅启用特定的门户工具（例如，网页搜索但不启用图像生成）——请参阅下方的[将门户与您自己的后端混合使用](#将门户与您自己的后端混合使用)。

### Nous Chat

您的 Portal 账户还包含 [chat.nousresearch.com](https://chat.nousresearch.com) 的访问权限——这是 Nous Research 的网页聊天界面，拥有相同的模型目录。当您离开终端或进行非智能体对话工作时，这很有用。

### 无需在配置文件中存放凭证

因为所有路由都通过一个 OAuth 认证的 Portal 会话进行，所以您不会积累一个包含十几个长期 API 密钥的 `.env` 文件。位于 `~/.hermes/auth.json` 的刷新令牌是磁盘上唯一的凭证，Hermes 会根据每个请求从中生成短期 JWT——请参阅下方的[令牌处理](#令牌处理)。

### 跨平台一致性

[原生 Windows 版本](/user-guide/windows-native)仍处于早期测试阶段，且每个工具的 API 密钥设置是其薄弱环节——在 Windows 上安装 Firecrawl 账户、FAL 账户、Browser Use 账户和获取 OpenAI 密钥是构建一个有用智能体过程中摩擦最大的部分。Portal 订阅解决了这个问题：一次 OAuth 即可覆盖模型和所有门户工具，因此 Windows 用户无需手动配置四个后端，就能获得与 macOS/Linux 相同的体验。

## 关于 Hermes 4 的说明

Nous Research 自家的 **Hermes 4** 系列模型 (Hermes-4-70B, Hermes-4-405B) 可以通过 Portal 以大幅折扣价使用。这些是**前沿的混合推理聊天模型**——在数学、科学、指令遵循、模式遵循、角色扮演和长文写作方面表现出色。

然而，**不建议在 Hermes 智能体内部使用它们**。Hermes 4 是针对聊天和推理调优的，而不是智能体所依赖的快速工具调用循环。请将它们用于 [Nous Chat](https://chat.nousresearch.com)、研究工作流，或通过其他工具的[订阅代理](/user-guide/features/subscription-proxy)——但对于智能体工作，请从目录中选择一个前沿的智能体模型：

```bash
/model anthropic/claude-sonnet-4.6     # 最佳通用智能体模型
/model openai/gpt-5.5-pro              # 强大的推理 + 工具调用能力
/model google/gemini-3-pro-preview     # 巨大的上下文窗口
/model deepseek/deepseek-v4-pro        # 高性价比的编码模型
```

Portal 自己的[模型信息页面](https://portal.nousresearch.com/info)也有同样的警告，所以这不是 Hermes 方面的意见——这是 Nous Research 的官方指导。

## 设置

### 全新安装 — 一键命令

```bash
hermes setup --portal
```

此命令将一次性完成全部设置：

1.  打开浏览器访问 portal.nousresearch.com 进行 OAuth 登录
2.  将刷新令牌存储在 `~/.hermes/auth.json`
3.  在 `~/.hermes/config.yaml` 中将 Nous 设为您的推理提供商
4.  开启工具网关（网络、图像、TTS、浏览器路由）
5.  让您返回终端，准备好运行 `hermes chat`

如果您还没有订阅，请先在 [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription) 注册。

### 已有安装 — 添加 Portal 与其他提供商并存

如果您已经配置了 Hermes 使用 OpenRouter、Anthropic 或其他提供商，并且想在它们旁边添加 Portal：

```bash
hermes model
# 从提供商列表中选择 “Nous Portal”
# 浏览器打开，登录，完成
```

您现有的提供商配置保持不变。您可以在会话中通过 `/model` 或在会话间通过 `hermes model` 在它们之间切换——Portal 成为您可用的提供商之一，而不是唯一的一个。

### 无头 / SSH / 远程设置

OAuth 需要浏览器，但环回回调运行在运行 Hermes 的机器上。对于远程主机，请参阅 [SSH / 远程主机上的 OAuth](/guides/oauth-over-ssh)——与任何其他基于 OAuth 的提供商（例如 `ssh -L` 端口转发，`--manual-paste` 用于像 Cloud Shell / Codespaces 这样的纯浏览器环境）相同的模式也适用于 Portal。

### 配置文件设置

如果您使用 [Hermes 配置文件](/user-guide/profiles)，Portal 刷新令牌将通过共享令牌存储自动在所有配置文件中共享。在任何配置文件上登录一次，其余的就会自动获取——无需为每个配置文件重复 OAuth 流程。

## 日常使用 Portal

### 检查连接状态

```bash
hermes portal status     # 登录状态、订阅信息、模型 + 网关路由
hermes portal tools      # 详细的工具网关目录及每个工具的路由
hermes portal open       # 在浏览器中打开订阅管理页面
```

`hermes portal status` (或简写为 `hermes portal`) 为您提供高级概览：

```
  Nous Portal
  ───────────
  认证:    ✓ 已登录
  Portal:  https://portal.nousresearch.com
  模型:    ✓ 使用 Nous 作为推理提供商

  工具网关
  ────────────
  网页搜索与提取    通过 Nous Portal
  图像生成          通过 Nous Portal
  文本转语音        通过 Nous Portal
  浏览器自动化      通过 Nous Portal
  云端终端          未配置
```

### 切换模型

在会话内部：

```bash
/model anthropic/claude-sonnet-4.6
/model openai/gpt-5.5-pro
/model google/gemini-3-pro-preview
```

或打开选择器：

```bash
/model
# 使用方向键，回车确认选择
```

在会话外部（完整的设置向导，添加新提供商时很有用）：

```bash
hermes model
```

### 混合使用网关和您自己的后端

如果您已经有一个，比如 Browserbase 账户，并且想在通过 Nous 路由网页搜索和图像生成的同时继续使用它，这是支持的。使用 `hermes tools` 为每个工具选择后端：

```bash
hermes tools
# → 网页搜索       → “Nous 订阅”
# → 图像生成       → “Nous 订阅”
# → 浏览器         → “Browserbase”  (您现有的密钥)
# → TTS            → “Nous 订阅”
```

工具网关是按工具选择加入的，不是全有或全无。有关完整的按工具配置矩阵，请参阅[工具网关文档](/user-guide/features/tool-gateway)。

### 订阅管理

随时管理您的计划、查看使用情况或升级/取消：

- **网页:** [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription)
- **CLI 快捷方式:** `hermes portal open` (在默认浏览器中打开同一页面)
## 配置参考

运行 `hermes setup --portal` 后，`~/.hermes/config.yaml` 将如下所示：

```yaml
model:
  provider: nous
  default: anthropic/claude-sonnet-4.6     # 或您选择的其他模型
  base_url: https://inference-api.nousresearch.com/v1
```

工具网关设置位于其各自工具的部分下：

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

OAuth 刷新令牌单独存储在 `~/.hermes/auth.json`（不在 `config.yaml` 中——凭证和配置设计上是分开的）。

## 令牌处理

Hermes 在每次推理调用时，会从您存储的 Portal 刷新令牌中铸造一个短时效的 JWT，而不是复用一个长期的 API 密钥。令牌生命周期是完全自动的——刷新、铸造、在临时 401 错误时重试——您永远不会看到它。

如果 Portal 使刷新令牌失效（密码更改、手动撤销、会话过期），失效的刷新令牌将被**本地隔离**，这样 Hermes 会停止重放它，您也不会看到一连串相同的 401 错误。下一次调用会显示一条清晰的“需要重新认证”消息。运行 `hermes auth add nous` 重新登录；隔离会在下次成功登录时自动清除。

## 故障排除

### `hermes portal status` 显示“未登录”

您尚未完成 OAuth 流程，或者您的刷新令牌已被清除。运行：

```bash
hermes auth add nous --type oauth
```

或使用 `hermes model` 并重新选择 Nous Portal。

### 会话中途收到“需要重新认证”消息

您的 Portal 刷新令牌已失效（密码更改、手动撤销或会话过期）。运行 `hermes auth add nous`，您的下一个请求将使用新凭证。旧令牌上的任何隔离会在成功重新登录时自动清除。

### 想要使用 Portal 未提供的特定提供商模型

Portal 通过 OpenRouter 进行代理，因此 OpenRouter 支持的任何模型通常都可用。如果某个特定模型没有出现在 `/model` 中，请尝试直接使用 OpenRouter 风格的标识符：

```bash
/model anthropic/claude-opus-4.6
```

如果模型确实缺失，请[提交问题](https://github.com/NousResearch/hermes-agent/issues)——我们将 Portal 的目录呈现给 Hermes，缺失通常意味着我们可以更新的路由配置。

### 账单未出现在我的 Portal 账户上

首先检查 `hermes portal status`——如果显示您使用的是不同的提供商（例如 `模型: 当前为 openrouter` 而不是 `使用 Nous 作为推理提供商`），则您的本地配置已偏移。运行 `hermes model`，选择 Nous Portal，下一个请求将通过您的订阅进行路由。

## 另请参阅

- **[工具网关](/user-guide/features/tool-gateway)** — 每个网关工具的完整详细信息、按工具配置和定价
- **[订阅代理](/user-guide/features/subscription-proxy)** — 在非 Hermes 工具（其他智能体、脚本、第三方客户端）中使用您的 Portal 订阅
- **[语音模式](/user-guide/features/voice-mode)** — 使用 Portal 的 OpenAI TTS 进行语音对话
- **[AI 提供商](/integrations/providers)** — 如果您想比较替代方案，完整的提供商目录
- **[SSH 上的 OAuth](/guides/oauth-over-ssh)** — 从远程主机或纯浏览器环境登录
- **[配置文件](/user-guide/profiles)** — 共享一个 Portal 登录的多个 Hermes 配置