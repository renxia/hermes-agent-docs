---
sidebar_position: 1
title: "使用 Nous Portal 运行 Hermes 智能体"
description: "从入门到精通：订阅、设置、切换模型、启用网关工具并验证路由"
---

# 使用 Nous Portal 运行 Hermes 智能体

本指南将引导您从头到尾在 [Nous Portal](https://portal.nousresearch.com) 订阅上运行 Hermes 智能体——从注册到验证每个工具是否正确路由。如果您只想了解 Portal 是什么以及订阅包含哪些内容，请参阅 [Nous Portal 集成页面](/integrations/nous-portal)。本页面是任务脚本。

## 前提条件

- 已安装 Hermes 智能体（[快速入门](/getting-started/quickstart)）
- 设置机器上有一个网页浏览器（或使用 SSH 端口转发——参见 [通过 SSH 的 OAuth](/guides/oauth-over-ssh)）
- 大约 5 分钟时间

您**不需要**：OpenAI 密钥、Anthropic 密钥、Firecrawl 账户、FAL 账户、Browser Use 账户或任何其他供应商专用凭据。这正是其核心优势所在。

## 1. 获取订阅

打开 [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription)，注册并选择一个计划。

已有订阅？直接跳到第 2 步。

## 2. 运行一次性设置

```bash
hermes setup --portal
```

这个单一命令执行五项操作：

1. 在浏览器中打开 portal.nousresearch.com 进行 OAuth 登录
2. 将刷新令牌存储在 `~/.hermes/auth.json`
3. 在 `~/.hermes/config.yaml` 中设置 `model.provider: nous`
4. 选择一个默认的智能体模型 (`anthropic/claude-sonnet-4.6` 或类似模型)
5. 启用工具网关，用于网页搜索、图片生成、文本转语音和浏览器自动化

完成后，你将回到终端，准备开始对话。

### 如果我通过 SSH 连接到服务器怎么办？

OAuth 需要浏览器，但回调在运行 Hermes 的机器上。有两个选项：

```bash
# 选项 A：SSH 端口转发（推荐）
ssh -N -L 8642:127.0.0.1:8642 user@remote-host    # 在本地终端
hermes setup --portal                              # 在远程主机上，将打印的 URL 在本地浏览器中打开

# 选项 B：手动粘贴（适用于 Cloud Shell、Codespaces、EC2 实例连接）
hermes auth add nous --type oauth --manual-paste
# 然后重新运行 `hermes setup --portal` 来连接提供商 + 网关
```

参阅 [通过 SSH / 远程主机进行 OAuth](/guides/oauth-over-ssh) 获取完整指南，包括 ProxyJump 链、mosh/tmux 和 ControlMaster 注意事项。

## 3. 验证设置成功

```bash
hermes portal status
```

你应该会看到：

```
  Nous Portal
  ───────────
  Auth:    ✓ 已登录
  Portal:  https://portal.nousresearch.com
  Model:   ✓ 使用 Nous 作为推理提供商

  Tool Gateway
  ────────────
  Web search & extract  via Nous Portal
  Image generation      via Nous Portal
  Text-to-speech        via Nous Portal
  Browser automation    via Nous Portal
```

如果任何行显示的不是 "via Nous Portal" 或认证行显示 "not logged in"，请跳转到下面的[故障排除](#troubleshooting)。

## 4. 运行你的第一次对话

```bash
hermes chat
```

尝试一些既能测试模型又能测试工具网关的内容：

```
嘿，帮我搜索网页“Hermes Agent 发布说明”并总结前 3 条结果。
```

你应该会看到 Hermes 调用 `web_search`（基于 Firecrawl，通过网关）并给出摘要回复。如果搜索运行正常且回复合理，那么你已完成设置 — Portal 已端到端连接。

## 5. 选择你真正想要的模型

`hermes setup --portal` 之后的默认设置是一个合理的通用模型，但订阅的全部意义在于访问完整的模型目录。在会话中通过 `/model` 切换：

```bash
/model anthropic/claude-sonnet-4.6     # 最佳通用智能体模型
/model openai/gpt-5.4                  # 强大的推理 + 工具调用能力
/model google/gemini-2.5-pro           # 超大上下文窗口
/model deepseek/deepseek-v3.2          # 高性价比的编程模型
/model anthropic/claude-opus-4.6       # 处理复杂问题的重量级模型
```

或者弹出选择器进行浏览：

```bash
/model
```

永久设置不同的默认模型：

```bash
# 在终端中，不在任何会话内
hermes config set model.default anthropic/claude-sonnet-4.6
```

### 不要选择 Hermes-4 进行智能体工作

Hermes-4-70B 和 Hermes-4-405B 可在 Portal 上以深度折扣获得，但它们是**聊天/推理模型**，不是经过工具调用微调的。它们在多步骤智能体循环中会遇到困难。可以通过 [Nous Chat](https://chat.nousresearch.com) 进行对话/研究工作，或通过[订阅代理](/user-guide/features/subscription-proxy) 从非智能体工具使用它们。对于 Hermes Agent 本身，请坚持使用上述前沿的智能体模型。

Portal 自己的[信息页面](https://portal.nousresearch.com/info)也带有这个警告 — 这是 Nous 的官方指导，而不仅仅是 Hermes 方面的意见。

## 6. （可选）自定义工具网关路由

网关是按工具选择性启用的，不是全有或全无。如果你已有 Browserbase 帐户，并希望继续使用它，同时通过 Nous 路由网页搜索和图片生成，这是支持的：

```bash
hermes tools
# → Web search       → "Nous Subscription"     (推荐)
# → Image generation → "Nous Subscription"     (推荐)
# → Browser          → "Browserbase"           (你现有的密钥)
# → TTS              → "Nous Subscription"     (推荐)
```

验证你的组合：

```bash
hermes portal tools
```

你将看到按工具路由的情况 — 对于通过订阅路由的显示 `via Nous Portal`，对于使用你自己密钥的显示合作伙伴名称（`browserbase`、`firecrawl` 等）。

## 7. （可选）启用语音模式

因为工具网关包含了 OpenAI TTS，[语音模式](/user-guide/features/voice-mode) 无需单独的 OpenAI 密钥即可工作：

```bash
hermes setup voice
# → 为 TTS 选择 "Nous Subscription"
# → 选择一个语音转文本后端（本地 faster-whisper 是免费的，无需设置）
```

然后在任何消息平台会话中（Telegram、Discord、Signal 等），发送语音消息，Hermes 将转录、回复，并用合成语音回答 — 全部使用你的 Portal 订阅。

## 8. （可选）Cron + 常驻工作流

Portal 订阅对于 [cron 任务](/user-guide/features/cron) 和[批量处理](/user-guide/features/batch-processing) 的工作方式与交互式聊天相同 — OAuth 刷新令牌会自动重用。无需额外设置；只需安排 cron 任务，它们将从你的订阅中计费。

```bash
hermes cron add "每日AI新闻摘要" "每天上午9点" \
  "搜索网页上的顶级AI新闻并总结5条最重要的报道"
```

cron 任务将无人值守运行，调用模型 + 网页搜索 + 摘要，全部通过你的 Portal 订阅完成。

## 配置文件和多用户设置

如果你使用 [Hermes 配置文件](/user-guide/profiles)（例如每个项目单独配置），Portal 刷新令牌会通过共享令牌存储自动在所有配置文件间共享。在任何配置文件上登录一次，其余的会自动获取。

对于多个人共享一台机器的团队设置，每个人有自己的 Portal 帐户 → 每个主目录有自己的 `~/.hermes/auth.json` → 用户之间不共享令牌。这是正确的边界。

## 故障排除

### `hermes setup --portal` 后 `hermes portal status` 显示 "not logged in"

OAuth 流程未完成。重新运行：

```bash
hermes auth add nous --type oauth
```

如果你的浏览器未打开或回调失败，你可能在远程/无头主机上 — 参阅 [通过 SSH 进行 OAuth](/guides/oauth-over-ssh) 了解端口转发和手动粘贴的解决方法。

### "Model: currently openrouter"（或其他提供商）而不是 "using Nous as inference provider"

你的本地配置偏移了。OAuth 成功了，但 `model.provider` 仍然指向其他提供商。修复：

```bash
hermes config set model.provider nous
```

或交互式操作：

```bash
hermes model
# 选择 Nous Portal
```

使用 `hermes portal status` 重新验证。

### 工具网关工具显示合作伙伴名称而不是 "via Nous Portal"

按工具配置覆盖了网关。运行：

```bash
hermes tools
# 为任何你希望通过网关路由的工具选择 "Nous Subscription"
```

一些用户有意混合使用 — 例如通过 Nous 路由网页搜索，但为浏览器使用自己的 Browserbase 密钥。如果是有意的，请保持不变。如果不是，此命令可以修复。

### 会话中显示 "Re-authentication required"

你的 Portal 刷新令牌已失效（密码更改、手动撤销、会话过期）。令牌现在已被本地隔离，因此 Hermes 不会无休止地重播它。只需重新登录：

```bash
hermes auth add nous
```

成功重新登录后，隔离会自动清除。

### 我想要的模型不在 `/model` 选择器中

Portal 目录镜像了 OpenRouter 的模型列表（300+）。如果某个模型缺失，请尝试直接输入 OpenRouter 风格的标识符：

```bash
/model anthropic/claude-opus-4.6
/model openai/o1-2025-12-17
```

如果模型确实不可用，[提交一个 issue](https://github.com/NousResearch/hermes-agent/issues) — 大多数差距都是我们可以更新的路由配置。

### 计费未出现在我的 Portal 帐户中

`hermes portal status` 会告诉你是否实际通过 Portal 路由或其他提供商。常见原因：

- `model.provider` 设置为 `openrouter`/`anthropic`/等，而不是 `nous`
- OAuth 刷新失败，回退到其他已配置的提供商
- 多个 Hermes 配置文件中使用了错误的一个（检查 `hermes profile current`）

### 想要撤销并重新开始

```bash
hermes auth remove nous       # 清除本地刷新令牌
# 然后重新运行设置或从 Portal 网页界面移除订阅
```

## 这将为你带来什么，用数字说明

| 没有 Portal | 有 Portal |
|----------------|-------------|
| 在 `.env` 中有 1 个 OpenRouter / Anthropic / OpenAI 密钥 | 1 个 OAuth 刷新令牌，没有 `.env` 密钥 |
| 1 个用于网页的 Firecrawl 密钥 | 网页通过网关路由 |
| 1 个用于图片生成的 FAL 密钥 | 图片生成通过网关路由 |
| 1 个用于浏览器的 Browser Use / Browserbase 密钥 | 浏览器通过网关路由 |
| 1 个用于 TTS / 语音模式的 OpenAI 密钥 | TTS 通过网关路由 |
| 5 个独立的仪表板、充值、发票 | 1 个订阅、1 张发票 |
| 跨机器：复制所有 5 个密钥 | 跨机器：重新进行一次 OAuth |

这就是交易。如果你反正使用两个以上的后端，订阅费用就能回本。

## 参见

- **[Nous 门户集成页面](/integrations/nous-portal)** — 订阅内容概览
- **[工具网关](/user-guide/features/tool-gateway)** — 每个网关路由工具的完整详情
- **[订阅代理](/user-guide/features/subscription-proxy)** — 从非 Hermes 工具使用您的门户订阅
- **[语音模式](/user-guide/features/voice-mode)** — 在门户订阅上设置语音对话
- **[基于 SSH 的 OAuth](/guides/oauth-over-ssh)** — 远程/无界面登录模式
- **[配置文件](/user-guide/profiles)** — 在多个 Hermes 配置间共享同一个门户登录