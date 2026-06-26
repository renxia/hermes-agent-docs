---
sidebar_position: 1
title: "Run Hermes Agent with Nous Portal"
description: "Start-to-finish walkthrough: subscribe, set up, switch models, enable gateway tools, and verify routing"
---

# 通过 Nous Portal 运行 Hermes 智能体

本指南将带你完整体会 Hermes 智能体在 [Nous Portal](https://portal.nousresearch.com) 订阅中的运行流程——从注册到验证每个工具的路由是否正确。如果你只想了解 Portal 的概况和订阅内容，请参见 [Nous Portal 集成页面](/integrations/nous-portal)。本页是任务脚本。

## 前置条件

- 已安装 Hermes 智能体（[快速入门](/getting-started/quickstart)）
- 你所设置的机器上有网页浏览器（或通过 SSH 端口转发——参见 [OAuth over SSH](/guides/oauth-over-ssh)）
- 大约 5 分钟

你**不需要**：OpenAI 密钥、Anthropic 密钥、Firecrawl 账户、FAL 账户、Browser Use 账户或任何其他供应商凭证。这就是全部意义所在。

## 1. 获取订阅

打开 [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription)，注册并选择一个方案。

已经订阅了？跳到第 2 步。

## 2. 运行一次性设置

```bash
hermes setup --portal
```

这一条命令完成五件事：

1. 打开浏览器访问 portal.nousresearch.com 进行 OAuth 登录
2. 将刷新令牌存储在 `~/.hermes/auth.json` 中
3. 在 `~/.hermes/config.yaml` 中设置 `model.provider: nous`
4. 选择一个默认的智能体模型（`anthropic/claude-sonnet-4.6` 或类似版本）
5. 开启工具网关（Tool Gateway），用于网页搜索、图像生成、语音合成和浏览器自动化

完成后，你将回到终端，准备开始对话。

### 如果我是通过 SSH 连接到服务器的呢？

OAuth 需要浏览器，但回环回调运行在 Hermes 所在的那台机器上。两种方案：

```bash
# 方案 A：SSH 端口转发（推荐）
ssh -N -L 8642:127.0.0.1:8642 user@remote-host    # 在本地终端执行
hermes setup --portal                              # 在远程机器上，在本地浏览器中打开打印出的 URL

# 方案 B：手动粘贴（适用于 Cloud Shell、Codespaces、EC2 Instance Connect）
hermes auth add nous --type oauth --manual-paste
# 然后重新运行 `hermes setup --portal` 来配置提供方和网关
```

完整的操作流程，包括 ProxyJump 链路、mosh/tmux 和 ControlMaster 注意事项，请参见 [OAuth over SSH / 远程主机](/guides/oauth-over-ssh)。

## 3. 验证是否成功

```bash
hermes portal info
```

你应该看到：

```
  Nous Portal
  ───────────
  Auth:    ✓ 已登录
  Portal:  https://portal.nousresearch.com
  Model:   ✓ 使用 Nous 作为推理提供方

  Tool Gateway
  ────────────
  网页搜索与提取  通过 Nous Portal
  图像生成        通过 Nous Portal
  语音合成        通过 Nous Portal
  浏览器自动化    通过 Nous Portal
```

如果任何一行显示的不是"通过 Nous Portal"，或者认证行显示"未登录"，请跳转到下方的[故障排除](#故障排除)部分。

## 4. 运行你的第一次对话

```bash
hermes chat
```

尝试一个能同时测试模型和工具网关的任务：

```
嘿，搜索"Hermes 智能体 发布说明"并总结前 3 条结果。
```

你应该看到 Hermes 调用 `web_search`（由 Firecrawl 支持，通过网关）并返回摘要。如果搜索运行正常且回复合理，你就完成了——Portal 已端到端配置完毕。

## 5. 选择你真正想要的模型

`hermes setup --portal` 允许你在设置过程中选择一个模型，但订阅的意义在于访问完整的目录——随时可以在会话中用 `/model` 切换：

```bash
/model anthropic/claude-sonnet-4.6     # 最佳通用智能体
/model openai/gpt-5.4                  # 强大的推理 + 工具调用
/model google/gemini-2.5-pro           # 超大上下文窗口
/model deepseek/deepseek-v3.2          # 高性价比编码模型
/model anthropic/claude-opus-4.6       # 处理难题的重磅模型
```

或者弹出选择器来浏览：

```bash
/model
```

永久选择不同的默认模型：

```bash
# 在终端中，不在任何会话内
hermes config set model.default anthropic/claude-sonnet-4.6
```

### 智能体任务不要选择 Hermes-4

Hermes-4-70B 和 Hermes-4-405B 在 Portal 上以深度折扣提供，但它们是**对话/推理模型**，并非针对工具调用调优。它们在多步智能体循环中会表现吃力。请通过 [Nous Chat](https://chat.nousresearch.com) 将它们用于对话/研究工作，或通过[订阅代理](/user-guide/features/subscription-proxy)从非智能体工具中使用。对于 Hermes 智能体本身，请坚持使用上述前沿智能体模型。

Portal 本身的[信息页面](https://portal.nousresearch.com/info)也有此警告——这是 Nous 官方的指导，不仅仅是 Hermes 侧的建议。

## 6.（可选）自定义工具网关路由

网关是按工具选择加入的，而非全有或全无。如果你已经有 Browserbase 账户并希望继续使用，同时将网页搜索和图像生成路由到 Nous，这是支持的：

```bash
hermes tools
# → 网页搜索       → "Nous 订阅"     （推荐）
# → 图像生成       → "Nous 订阅"     （推荐）
# → 浏览器         → "Browserbase"   （你已有的密钥）
# → 语音合成       → "Nous 订阅"     （推荐）
```

这些行即使在未登录 Nous Portal 之前就会出现在 `hermes tools` 中——如果你在未选择" Nous 订阅"但无活跃会话的情况下选择它，Hermes 会内联运行 Portal 登录（不会改变你的推理提供方或其他工具）。

用以下命令验证你的组合：

```bash
hermes portal tools
```

你将看到每个工具的路由情况——通过订阅路由的显示 `通过 Nous Portal`，使用自有密钥的显示合作方名称（`browserbase`、`firecrawl` 等）。

## 7.（可选）启用语音模式

由于工具网关包含 OpenAI TTS，[语音模式](/user-guide/features/voice-mode)无需单独的 OpenAI 密钥即可工作：

```bash
hermes setup voice
# → 为 TTS 选择 "Nous 订阅"
# → 选择一个语音转文本后端（本地 faster-whisper 免费，无需设置）
```

然后在任何消息平台会话中（Telegram、Discord、Signal 等），发送语音消息，Hermes 将转录它，做出回应，并用合成语音回复——全部通过你的 Portal 订阅完成。

## 8.（可选）Cron + 始终在线的工作流

Portal 订阅对 [cron 任务](/user-guide/features/cron)和[批处理](/user-guide/features/batch-processing)的工作方式与交互式聊天相同——OAuth 刷新令牌会自动复用。无需额外设置；只需安排 cron 任务，它们将从你的订阅中计费。

```bash
hermes cron create "每天上午 9 点" \
  "搜索 AI 新闻并总结 5 个最重要的故事" \
  --name "每日 AI 新闻"
```

cron 任务在无人值守的情况下运行，调用模型 + 网页搜索 + 摘要全部通过你的 Portal 订阅完成。

## 配置文件和多用户设置

如果你使用 [Hermes 配置文件](/user-guide/profiles)（例如每个项目单独的配置），Portal 刷新令牌会通过共享令牌存储自动在所有配置文件间共享。在任何配置文件中登录一次，其余配置文件会自动获取。

对于多个人类共享一台机器的团队设置，每个人类都有自己的 Portal 账户 → 每个主目录保存自己的 `~/.hermes/auth.json` → 用户之间不共享令牌。这是正确的边界。

## 故障排除

### `hermes portal info` 在 `hermes setup --portal` 后显示"未登录"

OAuth 流程未完成。重新运行：

```bash
hermes portal
```

如果你的浏览器没有打开或回调失败，你可能在远程/无头主机上——参见 [OAuth over SSH](/guides/oauth-over-ssh) 了解端口转发和手动粘贴的解决方案。

### 显示"Model: currently openrouter"（或其他提供方）而非"使用 Nous 作为推理提供方"

你的本地配置偏移了。OAuth 成功了，但 `model.provider` 仍指向另一个提供方。修复方法：

```bash
hermes config set model.provider nous
```

或者交互式地：

```bash
hermes model
# 选择 Nous Portal
```

用 `hermes portal info` 重新验证。

### 工具网关工具显示合作方名称而非"通过 Nous Portal"

每个工具的配置覆盖了网关。运行：

```bash
hermes tools
# 为任何你希望网关路由的工具选择 "Nous 订阅"
```

有些用户有意混合使用——例如，通过 Nous 路由网页搜索但使用自己的 Browserbase 密钥来使用浏览器。如果这是有意为之，请不要修改。如果不是，此命令可以修复。

### 会话中途出现"需要重新认证"

你的 Portal 刷新令牌已失效（密码更改、手动撤销、会话过期）。该令牌现在已在本地隔离，因此 Hermes 不会无休止地重放它。只需重新登录：

```bash
hermes auth add nous
```

隔离在成功重新登录后会自动清除。

### 我想要的模型不在 `/model` 选择器中

Portal 目录镜像了 OpenRouter 的模型列表（300+）。如果缺少某个模型，请尝试直接输入 OpenRouter 风格的标识符：

```bash
/model anthropic/claude-opus-4.6
/model openai/o1-2025-12-17
```

如果某个模型确实不可用，请[提交 issue](https://github.com/NousResearch/hermes-agent/issues)——大多数缺口是我们可以更新的路由配置。

### 计费未出现在我的 Portal 账户上

`hermes portal info` 会告诉你你实际上是通过 Portal 还是其他提供方路由的。常见原因：

- `model.provider` 设置为 `openrouter`/`anthropic`/等，而非 `nous`
- OAuth 刷新失败，回退到了另一个已配置的提供方
- 多个 Hermes 配置文件，你使用了错误的那个（请检查 `hermes profile list`）

### 想要撤销并重新开始

```bash
hermes auth logout nous       # 清除本地刷新令牌
# 然后重新运行设置，或从 Portal 网页界面移除订阅
```

## 简而言之，你能获得什么

| 无 Portal | 有 Portal |
|-----------|-----------|
| `.env` 中有 1 个 OpenRouter / Anthropic / OpenAI 密钥 | 1 个 OAuth 刷新令牌，无 `.env` 密钥 |
| 1 个 Firecrawl 密钥用于网页 | 网页通过网关路由 |
| 1 个 FAL 密钥用于图像生成 | 图像生成通过网关路由 |
| 1 个 Browser Use / Browserbase 密钥用于浏览器 | 浏览器通过网关路由 |
| 1 个 OpenAI 密钥用于 TTS / 语音模式 | TTS 通过网关路由 |
| 5 个独立仪表板、充值、发票 | 1 个订阅，1 张发票 |
| 跨机器：复制所有 5 个密钥 | 跨机器：重新 OAuth 一次 |

就是这样。如果你已经在用其中两个以上的后端，订阅本身就物超所值。

## 另请参阅

- **[Nous Portal 集成页面](/integrations/nous-portal)** — 订阅内容概览
- **[工具网关 (Tool Gateway)](/user-guide/features/tool-gateway)** — 每个网关路由工具的详细信息
- **[订阅代理 (Subscription proxy)](/user-guide/features/subscription-proxy)** — 从非 Hermes 工具使用 Portal 订阅
- **[语音模式 (Voice mode)](/user-guide/features/voice-mode)** — 在 Portal 订阅上设置语音对话
- **[OAuth over SSH](/guides/oauth-over-ssh)** — 远程/无头登录模式
- **[配置文件 (Profiles)](/user-guide/profiles)** — 在多个 Hermes 配置间共享一个 Portal 登录