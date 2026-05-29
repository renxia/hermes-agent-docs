---
sidebar_position: 16
title: "xAI Grok OAuth (SuperGrok / X Premium+)"
description: "使用您的 SuperGrok 或 X Premium+ 订阅在 Hermes 智能体中登录并使用 Grok 模型 —— 无需 API 密钥"
---

# xAI Grok OAuth (SuperGrok / X Premium+)

Hermes 智能体支持通过针对 [accounts.x.ai](https://accounts.x.ai) 的基于浏览器的 OAuth 登录流程来使用 xAI Grok，您可以使用 **SuperGrok 订阅** ([grok.com](https://x.ai/grok)) 或 **X Premium+ 订阅**（关联的 X 账户）。无需 `XAI_API_KEY` —— 登录一次，Hermes 会在后台自动刷新您的会话。

当您使用拥有 Premium+ 的 X 账户登录时，xAI 会自动将订阅状态链接到您的 xAI 会话，因此其 OAuth 流程与直接 SuperGrok 订阅者完全相同。

该传输层复用了 `codex_responses` 适配器（xAI 提供了一个类似 Responses 风格的端点），因此推理、工具调用、流式传输和提示缓存无需对适配器进行任何更改即可工作。

Hermes 中所有直接面向 xAI 的服务（TTS、图像生成、视频生成和转录）也会复用同一个 OAuth 令牌，因此一次登录即可覆盖全部四项功能。

## 概览

| 项目 | 值 |
|------|---|
| 提供商 ID | `xai-oauth` |
| 显示名称 | xAI Grok OAuth (SuperGrok / X Premium+) |
| 认证类型 | 浏览器 OAuth 2.0 PKCE（本地回环回调） |
| 传输层 | xAI Responses API (`codex_responses`) |
| 默认模型 | `grok-4.3` |
| 端点 | `https://api.x.ai/v1` |
| 认证服务器 | `https://accounts.x.ai` |
| 需要环境变量 | 否 (`XAI_API_KEY` **不**用于此提供商) |
| 订阅 | [SuperGrok](https://x.ai/grok) 或 [X Premium+](https://x.com/i/premium_sign_up) — 请参阅下方说明 |

## 先决条件

- Python 3.9+
- 已安装 Hermes 智能体
- 拥有有效的 **SuperGrok** 订阅（在您的 xAI 账户上），**或**拥有 **X Premium+** 订阅（在您登录的 X 账户上）（xAI 会自动关联订阅）
- 本地机器上有可用的浏览器（或使用 `--no-browser` 进行远程会话）

:::warning xAI 可能会根据层级限制 OAuth API 访问权限
xAI 的后端对 OAuth API 表面有自己的允许列表，并且已观察到会拒绝标准 SuperGrok 订阅者，返回 `HTTP 403`（参见 issue [#26847](https://github.com/NousResearch/hermes-agent/issues/26847)），即使应用内订阅是活跃的。如果 OAuth 登录在浏览器中成功，但推理返回 403，请设置 `XAI_API_KEY` 并切换到 API 密钥路径（`provider: xai`）——目前该表面不受相同限制。
:::

## 快速开始

```bash
# 启动提供商和模型选择器
hermes model
# → 从提供商列表中选择 "xAI Grok OAuth (SuperGrok / X Premium+)"
# → Hermes 会在浏览器中打开 accounts.x.ai
# → 在浏览器中批准访问
# → 选择一个模型（grok-4.3 位于顶部）
# → 开始聊天

hermes
```

首次登录后，凭据会存储在 `~/.hermes/auth.json` 下，并在过期前自动刷新。

## 手动登录

您可以在不通过模型选择器的情况下触发登录：

```bash
hermes auth add xai-oauth
```

### 远程 / 无头会话

在服务器、容器或没有浏览器的 SSH 会话中，Hermes 会检测远程环境并打印授权 URL，而不是打开浏览器。

**重要提示：** 回环监听器仍然在远程机器的 `127.0.0.1:56121` 上运行。xAI 的重定向需要能访问到*该*监听器，因此在您的笔记本电脑上打开该 URL 会失败（`无法建立连接。我们无法访问您的应用。`），除非您进行端口转发：

```bash
# 在您本地机器的一个独立终端中：
ssh -N -L 56121:127.0.0.1:56121 user@remote-host

# 然后在远程机器的 SSH 会话中：
hermes auth add xai-oauth --no-browser
# 在您的本地浏览器中打开打印出的授权 URL。
```

通过跳板机 / 堡垒机：添加 `-J jump-user@jump-host`。

有关完整的分步指南，包括 ProxyJump 链、mosh/tmux 和 ControlMaster 注意事项，请参阅 [通过 SSH / 远程主机进行 OAuth](./oauth-over-ssh.md)。

### 仅浏览器的远程环境（Cloud Shell、Codespaces、EC2 Instance Connect）

如果您没有常规的 SSH 客户端（例如，您在 GCP Cloud Shell、GitHub Codespaces、AWS EC2 Instance Connect、Gitpod 或其他基于浏览器的控制台中运行 Hermes），上述 `ssh -L` 方法不可用。请改用 `--manual-paste` —— Hermes 会跳过回环监听器，允许您直接从浏览器粘贴失败的回调 URL：

```bash
hermes auth add xai-oauth --manual-paste
# 或者通过模型选择器：
hermes model --manual-paste
```

有关完整的演练，请参阅 [通过 SSH / 远程主机进行 OAuth](./oauth-over-ssh.md#仅浏览器的远程环境-cloud-shell--codespaces--ec2-instance-connect)。针对 [#26923](https://github.com/NousResearch/hermes-agent/issues/26923) 的回归修复。

如果同意页面直接在页面上呈现授权代码（xAI 在基于浏览器的控制台上的当前行为），而不是重定向到您的 `127.0.0.1:56121/callback`，请在 `Callback URL:` 提示符下粘贴**仅代码值** —— Hermes 接受完整 URL、裸 `?code=...&state=...` 查询片段或裸代码。

## 登录工作原理

1.  Hermes 将您的浏览器打开到 `accounts.x.ai`。
2.  您登录（或确认现有会话）并批准访问。
3.  xAI 重定向回 Hermes，令牌会保存到 `~/.hermes/auth.json`。
4.  此后，Hermes 会在后台刷新访问令牌——您会保持登录状态，直到执行 `hermes auth remove xai-oauth` 或从您的 xAI 账户设置中撤销访问权限。

## 检查登录状态

```bash
hermes doctor
```

`◆ Auth Providers` 部分将显示每个提供商的当前状态，包括 `xai-oauth`。

## 切换模型

```bash
hermes model
# → 选择 "xAI Grok OAuth (SuperGrok / X Premium+)"
# → 从模型列表中选择（grok-4.3 固定在顶部）
```

或直接设置模型：

```bash
hermes config set model.default grok-4.3
hermes config set model.provider xai-oauth
```

## 配置参考

登录后，`~/.hermes/config.yaml` 将包含：

```yaml
model:
  default: grok-4.3
  provider: xai-oauth
  base_url: https://api.x.ai/v1
```

### 提供商别名

以下所有条目都解析为 `xai-oauth`：

```bash
hermes --provider xai-oauth        # 规范名称
hermes --provider grok-oauth       # 别名
hermes --provider x-ai-oauth       # 别名
hermes --provider xai-grok-oauth   # 别名
```

## 直接访问 xAI 的工具（TTS / 图像 / 视频 / 转录 / X 搜索）

通过 OAuth 登录后，每个直接访问 xAI 的工具都会自动重用相同的 Bearer 令牌——**无需单独设置**，除非您更愿意使用 API 密钥。

要为每个工具选择后端：

```bash
hermes tools
# → 文本转语音       → "xAI TTS"
# → 图像生成         → "xAI Grok Imagine (image)"
# → 视频生成         → "xAI Grok Imagine"
# → X (Twitter) 搜索 → "xAI Grok OAuth (SuperGrok / X Premium+)"
```

如果已存储 OAuth 令牌，选择器会确认并跳过凭据提示。如果 OAuth 和 `XAI_API_KEY` 均未设置，选择器会提供一个三选一的菜单：OAuth 登录、粘贴 API 密钥或跳过。

:::note 视频生成默认关闭
`video_gen` 工具集默认处于禁用状态。在智能体能够调用 `video_generate` 之前，请在 `hermes tools` → `🎬 Video Generation`（按空格键）中启用它。否则智能体可能会回退到捆绑的 ComfyUI 技能，该技能也标记为用于视频生成。
:::

:::note 当存在 xAI 凭据时，X 搜索会自动启用
只要配置了 xAI 凭据（SuperGrok / X Premium+ OAuth 令牌或 `XAI_API_KEY`），`x_search` 工具集就会自动启用。如果您不希望这样，请通过 `hermes tools` → `🐦 X (Twitter) Search`（按空格键）显式禁用。该工具通过 xAI 内置的 `x_search` Responses API 进行路由——它适用于**无论是**您的 SuperGrok / X Premium+ OAuth 登录**还是**付费的 `XAI_API_KEY`，并且当两者都配置时优先使用 OAuth（使用您的订阅配额而不是 API 消耗）。当未配置 xAI 凭据时，无论工具集是否启用，模型都无法看到该工具模式。
:::

### 模型

| 工具 | 模型 | 备注 |
|------|-------|-------|
| 聊天 | `grok-4.3` | 默认；通过 OAuth 登录时自动选择 |
| 聊天 | `grok-4.20-0309-reasoning` | 推理变体 |
| 聊天 | `grok-4.20-0309-non-reasoning` | 非推理变体 |
| 聊天 | `grok-4.20-multi-agent-0309` | 多智能体变体 |
| 图像 | `grok-imagine-image` | 默认；约 5–10 秒 |
| 图像 | `grok-imagine-image-quality` | 更高保真度；约 10–20 秒 |
| 视频 | `grok-imagine-video` | 文本生成视频和图像生成视频；最多 7 张参考图像 |
| TTS | (默认语音) | xAI `/v1/tts` 端点 |

聊天目录实时从磁盘上的 `models.dev` 缓存派生；新的 xAI 发布版本会在该缓存刷新后自动出现。`grok-4.3` 始终固定在列表顶部。

## 环境变量

| 变量 | 效果 |
|----------|--------|
| `XAI_BASE_URL` | 覆盖默认的 `https://api.x.ai/v1` 端点（很少需要）。 |

要选择 xAI 作为活动提供商，请在 `config.yaml` 中设置 `model.provider: xai-oauth`（使用 `hermes setup` 进行引导流程）或在单次调用中传递 `--provider xai-oauth`。

## 故障排除

### 令牌过期 — 未自动重新登录

Hermes 在每次会话前以及在收到 401 响应时被动地刷新令牌。如果刷新因 `invalid_grant`（刷新令牌已被撤销，或账户已轮换）而失败，Hermes 会显示一条明确的重新认证消息，而不是崩溃。

当刷新失败是永久性的（HTTP 4xx、`invalid_grant`、授权被撤销等）时，Hermes 会将刷新令牌标记为失效并在本地隔离它——后续调用会跳过注定失败的刷新尝试，而不是重复播放相同的 401 错误。智能体会显示一条“需要重新认证”的消息，并在您再次登录之前保持静默。

**修复：** 再次运行 `hermes auth add xai-oauth` 以开始新的登录。隔离状态会在下一次成功交换后清除。

### 授权超时

回环监听器有一个有限的过期窗口（默认 180 秒）。如果您没有及时批准登录，Hermes 会引发超时错误。

**修复：** 重新运行 `hermes auth add xai-oauth`（或 `hermes model`）。流程将重新开始。

### 状态不匹配（可能的 CSRF）

Hermes 检测到授权服务器返回的 `state` 值与其发送的不匹配。

**修复：** 重新运行登录。如果问题持续存在，请检查是否有代理或重定向正在修改 OAuth 响应。

### 从远程服务器登录

在 SSH 或容器会话中，Hermes 会打印授权 URL 而不是打开浏览器。回环回调监听器仍然在远程主机上绑定 `127.0.0.1:56121` —— 您的笔记本电脑浏览器如果没有 SSH 本地转发就无法访问它：

```bash
# 本地机器，独立终端：
ssh -N -L 56121:127.0.0.1:56121 user@remote-host

# 远程机器：
hermes auth add xai-oauth --no-browser
```

完整演练（跳板机、mosh/tmux、端口冲突）：[通过 SSH / 远程主机进行 OAuth](./oauth-over-ssh.md)。

### 登录成功后出现 HTTP 403（层级 / 权限）

OAuth 在浏览器中完成，令牌已保存，但推理或令牌刷新返回 `HTTP 403`，消息类似于 *“调用者没有权限执行指定的操作”*。

这**不是**陈旧令牌的问题——重新运行 `hermes model` 不会改变它。尽管应用内订阅是活跃的，但已观察到 xAI 的后端将 OAuth API 访问限制在特定的 SuperGrok 层级（问题 [#26847](https://github.com/NousResearch/hermes-agent/issues/26847)）。

**修复：** 设置 `XAI_API_KEY` 并切换到 API 密钥路径：

```bash
export XAI_API_KEY=xai-...
hermes config set model.provider xai
```

如果 OAuth 路径是必需的，请在 [x.ai/grok](https://x.ai/grok) 升级您的订阅。

### 运行时出现“未找到 xAI 凭据”错误

认证存储中没有 `xai-oauth` 条目，也没有设置 `XAI_API_KEY`。您尚未登录，或者凭据文件已被删除。

**修复：** 运行 `hermes model` 并选择 xAI Grok OAuth 提供商，或运行 `hermes auth add xai-oauth`。

## 注销登录

要移除所有已存储的 xAI Grok OAuth 凭据：

```bash
hermes auth logout xai-oauth
```

此操作将清除 `auth.json` 中的单例 OAuth 条目以及 `xai-oauth` 的所有凭证池行。如果您只想删除单个池条目（运行 `hermes auth list xai-oauth` 可查看），请使用 `hermes auth remove xai-oauth <索引|ID|标签>`。

## 另请参见

- [通过 SSH / 远程主机进行 OAuth](./oauth-over-ssh.md) — 如果 Hermes 与您的浏览器不在同一台机器上，这是必读内容
- [AI 服务商参考](../integrations/providers.md)
- [环境变量](../reference/environment-variables.md)
- [配置](../user-guide/configuration.md)
- [语音与文字转语音](../user-guide/features/tts.md)