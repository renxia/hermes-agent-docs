---
sidebar_position: 1
title: "通过 Nous Portal 运行 Hermes 智能体"
description: "从入门到完成的完整指南：订阅、设置、切换模型、启用网关工具及验证路由"
---

# 通过 Nous Portal 运行 Hermes 智能体

本指南将带您逐步完成在 [Nous Portal](https://portal.nousresearch.com) 订阅上运行 Hermes 智能体的全过程——从注册到验证每个工具是否正确路由。如果您只想了解 Portal 的概况及其订阅内容，请参阅 [Nous Portal 集成页面](/integrations/nous-portal)。本页面是任务操作手册。

## 前提条件

- 已安装 Hermes 智能体（[快速入门](/getting-started/quickstart)）
- 设置所用的机器上需配备网页浏览器（或通过 SSH 端口转发——参见 [通过 SSH 进行 OAuth 认证](/guides/oauth-over-ssh)）
- 大约 5 分钟时间

您**无需**准备：OpenAI 密钥、Anthropic 密钥、Firecrawl 账户、FAL 账户、Browser Use 账户，或任何其他供应商特定的凭证。这正是其优势所在。

## 1. 获取订阅

打开 [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription)，注册并选择一个计划。

已经订阅了？跳到步骤 2。

## 2. 运行一次性设置

```bash
hermes setup --portal
```

这个单一命令会执行五件事：

1.  打开您的浏览器至 portal.nousresearch.com 进行 OAuth 登录
2.  将刷新令牌存储在 `~/.hermes/auth.json`
3.  在 `~/.hermes/config.yaml` 中设置 `model.provider: nous`
4.  选择一个默认的智能体模型（`anthropic/claude-sonnet-4.6` 或类似）
5.  为网页搜索、图像生成、语音合成（TTS）和浏览器自动化开启工具网关

完成后，您会回到终端，准备好进行对话。

### 如果我通过 SSH 连接到服务器怎么办？

OAuth 需要浏览器，但回环回调运行在运行 Hermes 的机器上。有两个选项：

```bash
# 选项 A：SSH 端口转发（首选）
ssh -N -L 8642:127.0.0.1:8642 user@remote-host    # 在本地终端中
hermes setup --portal                              # 在远程机器上，将打印的 URL 在本地浏览器中打开

# 选项 B：手动粘贴（适用于 Cloud Shell、Codespaces、EC2 Instance Connect）
hermes auth add nous --type oauth --manual-paste
# 然后重新运行 `hermes setup --portal` 以连接提供商 + 网关
```

查看 [通过 SSH / 远程主机进行 OAuth 训练](/guides/oauth-over-ssh)，了解完整的演练，包括 ProxyJump 链、mosh/tmux 和 ControlMaster 注意事项。

## 3. 验证设置成功

```bash
hermes portal status
```

您应该看到：

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

如果任何行显示的不是 "via Nous Portal"，或者认证行显示 "not logged in"，请跳转到下方的[故障排除](#troubleshooting)。

## 4. 运行您的第一次对话

```bash
hermes chat
```

尝试一个能同时测试模型和工具网关的命令：

```
嘿，在网上搜索“Hermes Agent release notes”并总结前 3 个结果。
```

您应该会看到 Hermes 调用 `web_search`（基于 Firecrawl，通过网关）并返回摘要。如果搜索运行正常且响应合理，您就完成了 — Portal 已经端到端连接好。

## 5. 选择您真正想要的模型

`hermes setup --portal` 之后的默认设置是一个合理的通用模型，但订阅的全部意义在于访问完整目录。在会话过程中使用 `/model` 进行切换：

```bash
/model anthropic/claude-sonnet-4.6     # 最佳通用智能体
/model openai/gpt-5.4                  # 强大的推理 + 工具调用
/model google/gemini-2.5-pro           # 巨大的上下文窗口
/model deepseek/deepseek-v3.2          # 高性价比的编码器
/model anthropic/claude-opus-4.6       # 适用于解决难题的重量级模型
```

或者弹出选择器进行浏览：

```bash
/model
```

永久选择不同的默认模型：

```bash
# 在您的终端中，在任何会话之外
hermes config set model.default anthropic/claude-sonnet-4.6
```

### 不要为智能体工作选择 Hermes-4

Hermes-4-70B 和 Hermes-4-405B 在 Portal 上可以以大幅折扣获得，但它们是**聊天/推理模型**，并非针对工具调用进行了调优。它们会在多步智能体循环中表现挣扎。请通过 [Nous Chat](https://chat.nousresearch.com) 用于对话/研究工作，或通过 [订阅代理](/user-guide/features/subscription-proxy) 从非智能体工具中使用它们。对于 Hermes Agent 本身，请坚持使用上述前沿智能体模型。

Portal 自己的 [信息页面](https://portal.nousresearch.com/info) 也包含了这个警告 — 这是官方的 Nous 指导，而不仅仅是 Hermes 方面的意见。

## 6. （可选）自定义工具网关路由

网关是按工具选择性加入的，而非全有或全无。如果您已经有一个 Browserbase 账户，并且希望在将网页搜索和图像生成路由通过 Nous 的同时继续使用它，这是支持的：

```bash
hermes tools
# → Web search       → "Nous Subscription"     （推荐）
# → Image generation → "Nous Subscription"     （推荐）
# → Browser          → "Browserbase"           （您现有的密钥）
# → TTS              → "Nous Subscription"     （推荐）
```

验证您的混合设置：

```bash
hermes portal tools
```

您将看到每个工具的路由 — `via Nous Portal` 表示那些通过订阅路由的工具，而合作伙伴名称（`browserbase`、`firecrawl` 等）表示那些使用您自己密钥的工具。

## 7. （可选）启用语音模式

因为工具网关包含了 OpenAI TTS，所以 [语音模式](/user-guide/features/voice-mode) 无需单独的 OpenAI 密钥即可工作：

```bash
hermes setup voice
# → 为 TTS 选择 "Nous Subscription"
# → 选择一个语音转文本后端（本地 faster-whisper 是免费的，无需设置）
```

然后在任何消息平台会话（Telegram、Discord、Signal 等）中，发送语音消息，Hermes 将转录它、做出回应，并用合成语音回复 — 全部使用您的 Portal 订阅。

## 8. （可选）定时任务 + 始终在线工作流

Portal 订阅适用于 [定时任务](/user-guide/features/cron) 和 [批处理](/user-guide/features/batch-processing)，其工作方式与交互式聊天相同 — OAuth 刷新令牌会自动重用。无需额外设置；只需安排定时任务，它们就会从您的订阅中计费。

```bash
hermes cron create "every day at 9am" \
  "Search the web for top AI news and summarize the 5 most important stories" \
  --name "Daily AI news"
```

该定时任务无人值守运行，通过您的 Portal 订阅调用模型 + 网页搜索 + 摘要功能。

## 配置文件与多用户设置

如果您使用 [Hermes 配置文件](/user-guide/profiles)（例如，每个项目一个单独的配置），Portal 刷新令牌会通过共享令牌存储在所有配置文件中自动共享。在任何一个配置文件上登录一次，其余配置文件会自动获取。

对于多个用户共享一台机器的团队设置，每个用户都有自己的 Portal 账户 → 每个主目录保存自己的 `~/.hermes/auth.json` → 不会在用户之间共享令牌。这是正确的边界。

## 故障排除

### `hermes portal status` 在 `hermes setup --portal` 后显示 "not logged in"

OAuth 流程未完成。重新运行它：

```bash
hermes auth add nous --type oauth
```

如果您的浏览器没有打开或回调失败，您可能是在远程/无头主机上 — 参见 [通过 SSH 进行 OAuth 训练](/guides/oauth-over-ssh) 了解端口转发和手动粘贴的解决方法。

### "Model: currently openrouter"（或其他提供商）而不是 "using Nous as inference provider"

您的本地配置发生了漂移。OAuth 成功了，但 `model.provider` 仍然指向不同的提供商。修复方法：

```bash
hermes config set model.provider nous
```

或交互式操作：

```bash
hermes model
# 选择 Nous Portal
```

使用 `hermes portal status` 重新验证。

### 工具网关的工具显示合作伙伴名称而不是 "via Nous Portal"

每工具的配置覆盖了网关。运行：

```bash
hermes tools
# 为您想要通过网关路由的任何工具选择 "Nous Subscription"
```

有些用户故意混合使用 — 例如，将网页搜索路由通过 Nous，但为浏览器使用自己的 Browserbase 密钥。如果是故意的，请保持原样。如果不是，此命令可以修复它。

### 会话中出现 "Re-authentication required"

您的 Portal 刷新令牌已被撤销（密码更改、手动撤销、会话过期）。该令牌现在在本地被隔离，因此 Hermes 不会无休止地重放它。只需重新登录：

```bash
hermes auth add nous
```

成功重新登录后，隔离会自动清除。

### 我想要的模型不在 `/model` 选择器中

Portal 目录反映了 OpenRouter 的模型列表（300+）。如果模型缺失，请尝试直接输入 OpenRouter 风格的 slug：

```bash
/model anthropic/claude-opus-4.6
/model openai/o1-2025-12-17
```

如果模型确实不可用，[提交一个 issue](https://github.com/NousResearch/hermes-agent/issues) — 大多数差距是我们可以更新的路由配置。

### 账单没有出现在我的 Portal 账户上

`hermes portal status` 会告诉您是否实际上通过 Portal 路由，还是通过其他提供商。常见原因：

- `model.provider` 设置为 `openrouter`/`anthropic`/等，而不是 `nous`
- OAuth 刷新失败，回退到另一个已配置的提供商
- 多个 Hermes 配置文件，而您使用的是错误的一个（检查 `hermes profile current`）

### 想要撤销并重新开始

```bash
hermes auth remove nous       # 清除本地刷新令牌
# 然后重新运行设置或从 Portal 网页界面移除订阅
```

## 这为您带来了什么，用简单的数字说明

| 没有 Portal | 有 Portal |
|------------|-----------|
| 在 `.env` 中有 1 个 OpenRouter / Anthropic / OpenAI 密钥 | 1 个 OAuth 刷新令牌，无需 `.env` 密钥 |
| 1 个用于网页搜索的 Firecrawl 密钥 | 网页搜索通过网关路由 |
| 1 个用于图像生成的 FAL 密钥 | 图像生成通过网关路由 |
| 1 个用于浏览器的 Browser Use / Browserbase 密钥 | 浏览器通过网关路由 |
| 1 个用于 TTS / 语音模式的 OpenAI 密钥 | TTS 通过网关路由 |
| 5 个独立的仪表板、充值、发票 | 1 份订阅，1 张发票 |
| 跨机器：复制所有 5 个密钥 | 跨机器：重新进行一次 OAuth |

这就是全部。如果您无论如何都在使用其中两个以上的后端，订阅本身就物有所值了。

## 另请参阅

- **[Nous Portal 集成页面](/integrations/nous-portal)** — 订阅包含内容的概述
- **[工具网关](/user-guide/features/tool-gateway)** — 所有网关路由工具的完整详情
- **[订阅代理](/user-guide/features/subscription-proxy)** — 在非 Hermes 工具中使用您的 Portal 订阅
- **[语音模式](/user-guide/features/voice-mode)** — 在 Portal 订阅上设置语音对话
- **[SSH 上的 OAuth](/guides/oauth-over-ssh)** — 远程/无头登录模式
- **[配置文件](/user-guide/profiles)** — 在多个 Hermes 配置间共享一个 Portal 登录