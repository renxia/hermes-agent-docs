---
sidebar_position: 1
title: "Nous Portal"
description: "一个订阅，300多个前沿模型，工具网关以及Nous Chat —— 运行Hermes智能体的推荐方式"
---

# Nous Portal

[Nous Portal](https://portal.nousresearch.com) 是Nous Research的统一订阅门户，也是**运行Hermes智能体的推荐方式**。一次OAuth登录，就能替代你在其他模型实验室、搜索API、图像生成器和浏览器提供商那里手动配置的多个独立账户、API密钥和账单关系。

如果你只有时间设置一个东西，那就设置它。最快的路径是：

```bash
hermes setup --portal
```

这条命令会运行Portal OAuth认证，将Nous设置为`config.yaml`中的推理提供商，并开启工具网关。完成后你就可以立即使用`hermes chat`了。

还没有订阅？[portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription) —— 注册后，回来运行上面的命令。

## 订阅包含什么

### 300多个前沿模型，统一账单

Portal代理了来自整个生态系统的精选智能体模型目录——费用通过您的Nous订阅扣除，而不是每个实验室一个信用余额。

| 系列 | 模型 |
|--------|--------|
| **Anthropic Claude** | Opus, Sonnet, Haiku (4.x系列) |
| **OpenAI** | GPT-5.4, o系列推理模型 |
| **Google Gemini** | 2.5 Pro, 2.5 Flash |
| **DeepSeek** | DeepSeek V3.2, DeepSeek-R1 |
| **Qwen** | Qwen3系列，Qwen Coder |
| **Kimi / Moonshot** | Kimi-K2, Kimi-Latest |
| **GLM / Zhipu** | GLM-4.6, GLM-4-Plus |
| **MiniMax** | M2.7, M1 |
| **xAI** | Grok-4, Grok-3 |
| **Hermes** | Hermes-4-70B, Hermes-4-405B (聊天模型，详见[下方说明](#关于-hermes-4)) |
| **+ 其他所有模型** | 240+ 额外模型 —— 完整的智能体前沿 |

底层路由通过OpenRouter实现，因此模型可用性和故障转移行为与您直接使用OpenRouter密钥时一致——只是费用通过您的Nous订阅扣除。在会话中使用`/model`在Claude Sonnet 4.6（用于代码）和Gemini 2.5 Pro（用于长上下文）之间切换——无需新凭证，无需充值，也不会遇到意外零余额错误。

### Nous 工具网关

同一个订阅还解锁了[工具网关](/user-guide/features/tool-gateway)，它通过Nous管理的基础设施路由Hermes智能体的工具调用。五个后端，一次登录：

| 工具 | 合作伙伴 | 功能 |
|------|---------|--------------|
| **网页搜索与提取** | Firecrawl | 智能体级的搜索和全文提取。无需Firecrawl API密钥，无需管理速率限制。 |
| **图像生成** | FAL | 一个端点下包含九个模型：FLUX 2 Klein 9B, FLUX 2 Pro, Z-Image Turbo, Nano Banana Pro (Gemini 3 Pro Image), GPT Image 1.5, GPT Image 2, Ideogram V3, Recraft V4 Pro, Qwen Image。 |
| **文本转语音** | OpenAI TTS | 无需单独的OpenAI密钥即可获得高质量的TTS。支持跨消息平台的[语音模式](/user-guide/features/voice-mode)。 |
| **云浏览器自动化** | Browser Use | 用于`browser_navigate`、`browser_click`、`browser_type`、`browser_vision`的无头Chromium会话。无需Browserbase账户。 |
| **云终端沙盒** | Modal | 用于代码执行的无服务器终端沙盒（可选附加组件）。 |

如果没有网关，要连接这些服务意味着需要一个Firecrawl账户、一个FAL账户、一个Browser Use账户、一个OpenAI密钥和一个Modal账户——五个独立的注册，五个独立的控制面板，五个独立的充值流程。有了网关，所有这些都通过一个订阅路由。

您也可以只启用特定的网关工具（例如仅启用网页搜索而不启用图像生成）——请参阅下方[将网关与您自己的后端混合使用](#将网关与您自己的后端混合使用)。

### Nous Chat

您的Portal账户还包括[chat.nousresearch.com](https://chat.nousresearch.com) —— Nous Research的网页聊天界面，拥有相同的模型目录。当您远离终端时很有用，或者用于非智能体的对话工作。

### 您的点文件中无需存放凭证

因为所有内容都通过一个经过OAuth认证的Portal会话路由，所以您不需要积累一个包含十几个长期API密钥的`.env`文件。`~/.hermes/auth.json`中的刷新令牌是磁盘上唯一的凭证，Hermes会为每个请求从中生成短期的JWT——请参阅下方[令牌处理](#令牌处理)。

### 跨平台一致性

[原生Windows版](/user-guide/windows-native)仍处于早期测试阶段，按工具配置API密钥是其粗糙之处——在Windows上安装Firecrawl账户、FAL账户、Browser Use账户和OpenAI密钥是获得一个有用智能体过程中摩擦最大的部分。Portal订阅可以平滑这一切：一次OAuth认证覆盖模型和所有网关工具，因此Windows用户无需手动配置四个后端，即可获得与macOS/Linux相同的体验。

# 关于 Hermes 4 的说明

Nous Research 自研的 **Hermes 4** 系列模型（Hermes-4-70B、Hermes-4-405B）现已在 Portal 平台以大幅折扣提供。这些是**前沿混合推理对话模型**——擅长数学、科学、指令遵循、模式遵循、角色扮演和长文本生成。

然而，**不推荐**在 Hermes Agent 内部使用它们。Hermes 4 针对对话和推理进行了优化，而非智能体所依赖的快速工具调用循环。请将它们用于 [Nous Chat](https://chat.nousresearch.com)、研究工作流，或通过[订阅代理](/user-guide/features/subscription-proxy)从其他工具访问——但对于智能体任务，请从目录中选择一个前沿的智能体模型：

```bash
/model anthropic/claude-sonnet-4.6     # 最佳通用智能体模型
/model openai/gpt-5.4                  # 强推理 + 工具调用
/model google/gemini-2.5-pro           # 超大上下文窗口
/model deepseek/deepseek-v3.2          # 高性价比编码模型
```

Portal 的官方[模型信息页面](https://portal.nousresearch.com/info)也包含同样的警告，因此这并非 Hermes 一方的观点——而是 Nous Research 的官方指引。

## 设置

### 全新安装 — 一条命令

```bash
hermes setup --portal
```

此命令将一次性完成全部设置：

1. 在浏览器中打开 portal.nousresearch.com 进行 OAuth 登录
2. 将刷新令牌存储在 `~/.hermes/auth.json`
3. 在 `~/.hermes/config.yaml` 中将 Nous 设为推理提供商
4. 启用工具网关（网络、图像、TTS、浏览器路由）
5. 返回终端，准备执行 `hermes chat`

如果您还没有订阅，请先在 [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription) 注册。

### 已有安装 — 将 Portal 添加到其他提供商旁

如果您已经将 Hermes 配置了 OpenRouter、Anthropic 或其他提供商，并希望添加 Portal：

```bash
hermes model
# 从提供商列表中选择 "Nous Portal"
# 浏览器打开，登录，完成
```

您现有的提供商配置保持不变。您可以在会话中使用 `/model` 或在会话间使用 `hermes model` 切换它们——Portal 将成为您可用的提供商之一，而非唯一选择。

### 无头 / SSH / 远程设置

OAuth 需要浏览器，但环回回调运行在 Hermes 运行的机器上。对于远程主机，请参阅 [OAuth over SSH / Remote Hosts](/guides/oauth-over-ssh)——同样的模式适用于 Portal 和任何其他基于 OAuth 的提供商（`ssh -L` 端口转发、适用于 Cloud Shell / Codespaces 等纯浏览器环境的 `--manual-paste`）。

### 配置文件设置

如果您使用 [Hermes 配置文件](/user-guide/profiles)，Portal 刷新令牌会通过共享令牌存储自动在所有配置文件中共享。在任意配置文件上登录一次，其余配置文件将自动获取——无需为每个配置文件重复 OAuth 流程。

## 日常使用 Portal

### 检查已连接的配置

```bash
hermes portal status     # 登录状态、订阅信息、模型 + 网关路由
hermes portal tools      # 详细的工具网关目录及每项工具的路由
hermes portal open       # 在浏览器中打开订阅管理页面
```

`hermes portal status`（或仅 `hermes portal`）为您提供概览：

```
  Nous Portal
  ───────────
  Auth:    ✓ 已登录
  Portal:  https://portal.nousresearch.com
  Model:   ✓ 使用 Nous 作为推理提供商

  工具网关
  ────────────
  网络搜索与提取  通过 Nous Portal
  图像生成        通过 Nous Portal
  文本转语音      通过 Nous Portal
  浏览器自动化    通过 Nous Portal
  云终端          未配置
```

### 切换模型

在会话内：

```bash
/model anthropic/claude-sonnet-4.6
/model openai/gpt-5.4
/model google/gemini-2.5-pro
```

或打开选择器：

```bash
/model
# 方向键，回车确认
```

在会话外（完整的设置向导，添加新提供商时有用）：

```bash
hermes model
```

### 将网关与您自己的后端混合使用

如果您已有 Browserbase 账户，并希望继续使用它，同时将网络搜索和图像生成路由到 Nous，这是支持的。使用 `hermes tools` 为每项工具选择后端：

```bash
hermes tools
# → 网络搜索       → "Nous Subscription"
# → 图像生成       → "Nous Subscription"
# → 浏览器         → "Browserbase"  (您现有的密钥)
# → TTS            → "Nous Subscription"
```

工具网关是按工具可选加入的，而非全选或全不选。有关完整的每项工具配置矩阵，请参阅[工具网关文档](/user-guide/features/tool-gateway)。

### 订阅管理

随时管理您的计划、查看使用情况或升级/取消：

- **网页：** [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription)
- **CLI 快捷命令：** `hermes portal open`（在默认浏览器中打开同一页面）

## 配置参考

执行 `hermes setup --portal` 后，`~/.hermes/config.yaml` 将如下所示：

```yaml
model:
  provider: nous
  default: anthropic/claude-sonnet-4.6     # 或您选择的任何模型
  base_url: https://inference.nousresearch.com/v1
```

工具网关设置位于各自的工具部分下：

```yaml
web:
  backend: nous       # 网络搜索/提取通过工具网关路由

image_gen:
  provider: nous

tts:
  provider: nous

browser:
  backend: nous
```

OAuth 刷新令牌单独存储在 `~/.hermes/auth.json`（不在 `config.yaml` 中——凭据和配置是分开存储的）。
## 令牌处理

Hermes 在每次推理调用时，使用您存储的 Portal 刷新令牌铸造一个短期 JWT，而不是重用长期 API 密钥。令牌生命周期完全自动——刷新、铸造、对临时 401 错误重试——您无需关注。

如果 Portal 使刷新令牌无效（密码更改、手动撤销、会话过期），该无效的刷新令牌将被**本地隔离**，因此 Hermes 会停止重放它，您也不会看到一连串相同的 401 错误。下一次调用会显示清晰的“需要重新认证”消息。运行 `hermes auth add nous` 重新登录；下次成功登录后，隔离将自动解除。

## 故障排除

### `hermes portal status` 显示“未登录”

您尚未完成 OAuth 流程，或您的刷新令牌已被清除。运行：

```bash
hermes auth add nous --type oauth
```

或使用 `hermes model` 并重新选择 Nous Portal。

### 会话中收到“需要重新认证”消息

您的 Portal 刷新令牌已失效（密码更改、手动撤销或会话过期）。运行 `hermes auth add nous`，您的下一个请求将使用新凭据。旧令牌上的任何隔离将在成功重新登录后自动清除。

### 想使用 Portal 未提供的特定提供商模型

Portal 通过 OpenRouter 代理，因此 OpenRouter 支持的任何模型通常都可用。如果特定模型未出现在 `/model` 中，请直接尝试 OpenRouter 风格的标识符：

```bash
/model anthropic/claude-opus-4.6
```

如果模型确实缺失，[提交问题](https://github.com/NousResearch/hermes-agent/issues)——我们会向 Hermes 展示 Portal 的目录，缺失通常意味着我们可以更新路由配置。

### 账单未出现在我的 Portal 账户中

首先检查 `hermes portal status`——如果显示您正在使用不同的提供商（`Model: currently openrouter` 而非 `using Nous as inference provider`），则您的本地配置已偏移。运行 `hermes model`，选择 Nous Portal，下一个请求将通过您的订阅路由。

## 另请参阅

- **[工具网关](/user-guide/features/tool-gateway)** — 每项网关工具的完整详情、每项工具的配置和定价
- **[订阅代理](/user-guide/features/subscription-proxy)** — 从非 Hermes 工具（其他智能体、脚本、第三方客户端）使用您的 Portal 订阅
- **[语音模式](/user-guide/features/voice-mode)** — 使用 Portal 的 OpenAI TTS 进行语音对话
- **[AI 提供商](/integrations/providers)** — 完整的提供商目录，供您比较替代方案
- **[OAuth over SSH](/guides/oauth-over-ssh)** — 从远程主机或纯浏览器环境登录
- **[配置文件](/user-guide/profiles)** — 共享一个 Portal 登录的多个 Hermes 配置