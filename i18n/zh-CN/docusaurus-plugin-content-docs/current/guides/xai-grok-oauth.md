---
sidebar_position: 16
title: "xAI Grok OAuth (SuperGrok / X Premium+)"
description: "Sign in with your SuperGrok or X Premium+ subscription to use Grok models in Hermes Agent — no API key required"
---

# xAI Grok OAuth (SuperGrok / X Premium+)

Hermes 智能体通过浏览器 OAuth 登录流程支持 xAI Grok，登录地址为 [accounts.x.ai](https://accounts.x.ai)，可使用 **SuperGrok 订阅**（[grok.com](https://x.ai/grok)）或 **X Premium+ 订阅**（关联的 X 账号）。无需 `XAI_API_KEY` — 登录一次后，Hermes 会在后台自动刷新您的会话。

当您使用具有 Premium+ 订阅的 X 账号登录时，xAI 会自动将订阅状态关联到您的 xAI 会话，因此 OAuth 流程与直接订阅 SuperGrok 的用户完全相同。

传输层复用了 `codex_responses` 适配器（xAI 暴露了一个 Responses 风格的端点），因此推理、工具调用、流式传输和提示缓存均无需任何适配器更改即可正常工作。

Hermes 中所有直接面向 xAI 的功能界面也复用同一个 OAuth Bearer 令牌 — TTS、图片生成、视频生成和转录 — 因此一次登录即可覆盖全部四项功能。

## 概览

| 项目 | 值 |
|------|-------|
| 提供商 ID | `xai-oauth` |
| 显示名称 | xAI Grok OAuth (SuperGrok / X Premium+) |
| 认证类型 | 浏览器 OAuth 2.0 PKCE（回环回调） |
| 传输协议 | xAI Responses API（`codex_responses`） |
| 默认模型 | `grok-build-0.1` |
| 端点 | `https://api.x.ai/v1` |
| 认证服务器 | `https://accounts.x.ai` |
| 需要环境变量 | 否（此提供商**不使用** `XAI_API_KEY`） |
| 订阅 | [SuperGrok](https://x.ai/grok) 或 [X Premium+](https://x.com/i/premium_sign_up) — 请参阅下方说明 |

## 前置条件

- Python 3.9+
- 已安装 Hermes 智能体
- 你的 xAI 账户已激活 **SuperGrok** 订阅，**或**你登录的 X 账户已激活 **X Premium+** 订阅（xAI 会自动关联订阅）
- 本地机器上有浏览器可用（远程会话可使用 `--no-browser`）

:::warning xAI 可能按层级限制 OAuth API 访问
xAI 的后端对其 OAuth API 表面执行自有允许列表，已知会拒绝标准 SuperGrok 订阅用户并返回 `HTTP 403`（参见 issue [#26847](https://github.com/NousResearch/hermes-agent/issues/26847)），即使应用内订阅处于激活状态。如果 OAuth 在浏览器中登录成功但推理返回 403，请设置 `XAI_API_KEY` 并切换到 API Key 路径（`provider: xai`）——该路径目前不受相同门控限制。
:::

## 快速开始

```bash
# 启动提供者和模型选择器
hermes model
# → 从提供者列表中选择 "xAI Grok OAuth (SuperGrok / X Premium+)"
# → Hermes 打开浏览器访问 accounts.x.ai
# → 在浏览器中批准访问
# → 选择一个模型（grok-build-0.1 在顶部）
# → 开始对话

hermes
```

首次登录后，凭证存储在 `~/.hermes/auth.json` 中，并在过期前自动刷新。

## 手动登录

你可以跳过模型选择器直接触发登录：

```bash
hermes auth add xai-oauth
```

### 远程 / 无头会话

在无浏览器的服务器、容器或 SSH 会话中，Hermes 会检测到远程环境并打印授权 URL 而不是打开浏览器。

**重要说明：** 环回监听器仍在远程机器上的 `127.0.0.1:56121` 运行。xAI 重定向需要到达*该*监听器，因此在笔记本电脑上打开该 URL 将失败（`无法建立连接。我们无法访问您的应用。`），除非你转发端口：

```bash
# 在本地机器的另一个终端中：
ssh -N -L 56121:127.0.0.1:56121 user@remote-host

# 然后在远程机器的 SSH 会话中：
hermes auth add xai-oauth --no-browser
# 在本地浏览器中打印的授权 URL。
```

通过跳板机 / 堡垒机：添加 `-J jump-user@jump-host`。

完整分步指南请参阅 [OAuth over SSH / Remote Hosts](./oauth-over-ssh.md)，包括 ProxyJump 链、mosh/tmux 和 ControlMaster 注意事项。

### 仅浏览器的远程环境（Cloud Shell、Codespaces、EC2 Instance Connect）

如果你没有常规 SSH 客户端（例如你在 GCP Cloud Shell、GitHub Codespaces、AWS EC2 Instance Connect、Gitpod 或其他基于控制台的浏览器中运行 Hermes），则无法使用上述 `ssh -L` 方法。请改用 `--manual-paste`——Hermes 会跳过环回监听器，让你直接从浏览器粘贴失败的回调 URL：

```bash
hermes auth add xai-oauth --manual-paste
# 或通过模型选择器：
hermes model --manual-paste
```

完整操作指南请参阅 [OAuth over SSH / Remote Hosts](./oauth-over-ssh.md#browser-only-remote-cloud-shell--codespaces--ec2-instance-connect)。包含 [#26923](https://github.com/NousResearch/hermes-agent/issues/26923) 的回归修复。

如果授权页面直接在页面上渲染授权代码（xAI 在当前基于控制台浏览器上的行为），而不是重定向到你的 `127.0.0.1:56121/callback`，则在 `Callback URL:` 提示处**仅粘贴纯代码值**——Hermes 同时接受完整 URL、纯 `?code=...&state=...` 查询片段或纯代码。

## 登录工作原理

1. Hermes 打开浏览器访问 `accounts.x.ai`。
2. 你登录（或确认现有会话）并批准访问。
3. xAI 重定向回 Hermes，令牌保存到 `~/.hermes/auth.json`。
4. 此后，Hermes 在后台刷新访问令牌——你保持登录状态，直到执行 `hermes auth logout xai-oauth` 或从 xAI 账户设置中撤销访问权限。

## 检查登录状态

```bash
hermes doctor
```

`◆ Auth Providers` 部分将显示每个提供者的当前状态，包括 `xai-oauth`。

## 切换模型

```bash
hermes model
# → 选择 "xAI Grok OAuth (SuperGrok / X Premium+)"
# → 从模型列表中选择（grok-build-0.1 固定在顶部）
```

或直接设置模型：

```bash
hermes config set model.default grok-build-0.1
hermes config set model.provider xai-oauth
```

## 配置参考

登录后，`~/.hermes/config.yaml` 将包含：

```yaml
model:
  default: grok-build-0.1
  provider: xai-oauth
  base_url: https://api.x.ai/v1
```

### 提供者别名

以下所有别名都解析为 `xai-oauth`：

```bash
hermes --provider xai-oauth        # 标准形式
hermes --provider grok-oauth       # 别名
hermes --provider x-ai-oauth       # 别名
hermes --provider xai-grok-oauth   # 别名
```

## 直连 xAI 工具（TTS / 图像 / 视频 / 转录 / X 搜索）

通过 OAuth 登录后，每个直连 xAI 工具自动复用相同的 bearer 令牌——**无需单独设置**，除非你更愿意使用 API Key。

要为每个工具选择后端：

```bash
hermes tools
# → 文本转语音       → "xAI TTS"
# → 图像生成         → "xAI Grok Imagine (image)"
# → 视频生成         → "xAI Grok Imagine"
# → X (Twitter) 搜索 → "xAI Grok OAuth (SuperGrok / X Premium+)"
```

如果 OAuth 令牌已存储，选择器会确认并跳过凭证提示。如果 OAuth 和 `XAI_API_KEY` 均未设置，选择器提供三选一菜单：OAuth 登录、粘贴 API Key 或跳过。

:::note 视频生成默认关闭
`video_gen` 工具集默认禁用。在智能体可以调用 `video_generate` 之前，需在 `hermes tools` → `🎬 Video Generation`（按空格键）中启用。否则智能体可能回退到内置的 ComfyUI 技能，该技能也标记了视频生成功能。
:::

:::note 当 xAI 凭证存在时 X 搜索自动启用
每当配置了 xAI 凭证（SuperGrok / X Premium+ OAuth 令牌或 `XAI_API_KEY`）时，`x_search` 工具集自动启用。如果不需要此功能，可通过 `hermes tools` → `🐦 X (Twitter) Search`（按空格键）显式禁用。该工具通过 xAI 内置的 `x_search` Responses API 路由——它**既**支持你的 SuperGrok / X Premium+ OAuth 登录，也支持付费 `XAI_API_KEY`，当两者都配置时优先使用 OAuth（使用你的订阅配额而非 API 开销）。当未配置 xAI 凭证时，无论工具集是否启用，工具架构都对模型隐藏。
:::

### 模型

| 工具 | 模型 | 说明 |
|------|-------|-------|
| 聊天 | `grok-build-0.1` | 默认；通过 OAuth 登录时自动选择 |
| 聊天 | `grok-4.3` | 之前的默认值 |
| 聊天 | `grok-4.20-0309-reasoning` | 推理变体 |
| 聊天 | `grok-4.20-0309-non-reasoning` | 非推理变体 |
| 聊天 | `grok-4.20-multi-agent-0309` | 多智能体变体 |
| 图像 | `grok-imagine-image` | 默认；约 5–10 秒 |
| 图像 | `grok-imagine-image-quality` | 更高保真度；约 10–20 秒 |
| 视频 | `grok-imagine-video` | 文本转视频 |
| 视频 | `grok-imagine-video-1.5-preview` | 图转视频；旧别名 `grok-imagine-video-1.5-2026-05-30` |
| TTS | (默认语音) | xAI `/v1/tts` 端点 |

聊天目录实时来自磁盘上的 `models.dev` 缓存；新的 xAI 版本在该缓存刷新后自动出现。`grok-build-0.1` 始终固定在列表顶部。

## 环境变量

| 变量 | 效果 |
|----------|--------|
| `XAI_BASE_URL` | 覆盖默认的 `https://api.x.ai/v1` 端点（极少需要）。 |

要将 xAI 设为当前活动提供者，在 `config.yaml` 中设置 `model.provider: xai-oauth`（使用 `hermes setup` 进行引导流程）或单次调用时传递 `--provider xai-oauth`。

## 故障排除

### 令牌过期——未自动重新登录

Hermes 会在每次会话前刷新令牌，并在收到 401 时响应式刷新。如果刷新失败并返回 `invalid_grant`（刷新令牌已被撤销或账户被轮换），Hermes 会显示类型化的重新认证消息而不是崩溃。

当刷新失败为终态错误（HTTP 4xx、`invalid_grant`、已撤销的授权等）时，Hermes 会将刷新令牌标记为失效并在本地隔离——后续调用会跳过注定失败的刷新尝试，而不是反复触发相同的 401。智能体显示一条"需要重新认证"消息并保持待命，直到你重新登录。

**修复方法：** 重新运行 `hermes auth add xai-oauth` 以开始全新登录。隔离状态在下一次成功交换时清除。

### 授权超时

环回监听器有有限的过期窗口（默认 180 秒）。如果你未及时批准登录，Hermes 会引发超时错误。

**修复方法：** 重新运行 `hermes auth add xai-oauth`（或 `hermes model`）。流程重新开始。

### 状态不匹配（可能的 CSRF）

Hermes 检测到授权服务器返回的 `state` 值与发送的值不匹配。

**修复方法：** 重新运行登录。如果持续存在，请检查是否有代理或重定向修改了 OAuth 响应。

### 从远程服务器登录

在 SSH 或容器会话中，Hermes 打印授权 URL 而不是打开浏览器。环回回调监听器仍绑定在远程主机上的 `127.0.0.1:56121`——你的笔记本电脑的浏览器无法访问它，除非通过 SSH 本地转发：

```bash
# 本地机器，单独的终端：
ssh -N -L 56121:127.0.0.1:56121 user@remote-host

# 远程机器：
hermes auth add xai-oauth --no-browser
```

完整操作指南（跳板机、mosh/tmux、端口冲突）：[OAuth over SSH / Remote Hosts](./oauth-over-ssh.md)。

### 成功登录后 HTTP 403（层级 / 权益）

OAuth 在浏览器中完成，令牌已保存，但推理或令牌刷新返回 `HTTP 403` 并附带类似 *"The caller does not have permission to execute the specified operation"* 的消息。

这**不是**令牌过期问题——重新运行 `hermes model` 不会改变状况。已知 xAI 的后端会将 OAuth API 访问限制在特定 SuperGrok 层级，即使应用内订阅处于激活状态（issue [#26847](https://github.com/NousResearch/hermes-agent/issues/26847)）。

**修复方法：** 设置 `XAI_API_KEY` 并切换到 API Key 路径：

```bash
export XAI_API_KEY=xai-...
hermes config set model.provider xai
```

或如果需要使用 OAuth 路线，在 [x.ai/grok](https://x.ai/grok) 升级你的订阅。

### 运行时出现"No xAI credentials found"错误

认证存储中没有 `xai-oauth` 条目，也未设置 `XAI_API_KEY`。你尚未登录，或凭证文件已被删除。

**修复方法：** 运行 `hermes model` 并选择 xAI Grok OAuth 提供者，或运行 `hermes auth add xai-oauth`。

## 登出

要删除所有已存储的 xAI Grok OAuth 凭证：

```bash
hermes auth logout xai-oauth
```

这会清除 `auth.json` 中的单一 OAuth 条目以及 `xai-oauth` 的任何凭证池行。如果只想删除单个池条目，使用 `hermes auth remove xai-oauth <index|id|label>`（运行 `hermes auth list xai-oauth` 查看）。

## 另请参阅

- [OAuth over SSH / Remote Hosts](./oauth-over-ssh.md) — 如果 Hermes 与你的浏览器在不同机器上，此为必读
- [AI Providers reference](../integrations/providers.md)
- [Environment Variables](../reference/environment-variables.md)
- [Configuration](../user-guide/configuration.md)
- [Voice & TTS](../user-guide/features/tts.md)