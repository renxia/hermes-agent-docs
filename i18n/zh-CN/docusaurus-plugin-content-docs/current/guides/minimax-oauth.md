---
sidebar_position: 15
title: "MiniMax OAuth"
description: "通过浏览器 OAuth 登录 MiniMax 并在 Hermes 智能体中使用 MiniMax-M2.7 模型 — 无需 API 密钥"
---

# MiniMax OAuth

Hermes 智能体支持通过基于浏览器的 OAuth 登录流程使用 **MiniMax**，使用与 [MiniMax 门户](https://www.minimax.io) 相同的凭据。无需 API 密钥或信用卡 — 只需登录一次，Hermes 会自动刷新您的会话。

该传输层复用 `anthropic_messages` 适配器（MiniMax 在 `/anthropic` 路径下提供了一个兼容 Anthropic Messages 的端点），因此所有现有的工具调用、流式传输和上下文功能都无需任何适配器更改即可正常工作。

## 概览

| 项目 | 值 |
|------|-------|
| 提供商 ID | `minimax-oauth` |
| 显示名称 | MiniMax (OAuth) |
| 认证类型 | 浏览器 OAuth（PKCE 设备码流程） |
| 传输层 | 兼容 Anthropic Messages (`anthropic_messages`) |
| 模型 | `MiniMax-M2.7`、`MiniMax-M2.7-highspeed` |
| 全球端点 | `https://api.minimax.io/anthropic` |
| 中国大陆端点 | `https://api.minimaxi.com/anthropic` |
| 是否需要环境变量 | 否（此提供商**不使用** `MINIMAX_API_KEY`） |

## 先决条件

- Python 3.9+
- 已安装 Hermes 智能体
- 拥有 [minimax.io](https://www.minimax.io)（全球）或 [minimaxi.com](https://www.minimaxi.com)（中国大陆）的 MiniMax 账户
- 本地机器上可用的浏览器（或使用 `--no-browser` 进行远程会话）

## 快速开始

```bash
# 启动提供商和模型选择器
hermes model
# → 从提供商列表中选择 "MiniMax (OAuth)"
# → Hermes 将打开您的浏览器并跳转到 MiniMax 授权页面
# → 在浏览器中批准访问
# → 选择一个模型（MiniMax-M2.7 或 MiniMax-M2.7-highspeed）
# → 开始对话

hermes
```

首次登录后，凭据将存储在 `~/.hermes/auth.json` 下，并在每次会话前自动刷新。

## 手动登录

您可以绕过模型选择器直接触发登录：

```bash
hermes auth add minimax-oauth
```

### 中国大陆区域

如果您的账户位于中国大陆平台（`minimaxi.com`），请传递 `--region cn`：

```bash
hermes auth add minimax-oauth --region cn
```

### 远程 / 无头会话

在没有浏览器的服务器或容器上：

```bash
hermes auth add minimax-oauth --no-browser
```

Hermes 将打印验证 URL 和用户代码 — 在任何设备上打开该 URL，并在提示时输入代码。

## OAuth 流程

Hermes 针对 MiniMax OAuth 端点实现了 PKCE 设备码流程：

1. Hermes 生成一个 PKCE 验证器/挑战对和一个随机状态值。
2. 它向 `{base_url}/oauth/code` 发送 POST 请求并附带挑战，收到一个 `user_code` 和 `verification_uri`。
3. 您的浏览器将打开 `verification_uri`。如果提示，请输入 `user_code`。
4. Hermes 轮询 `{base_url}/oauth/token`，直到令牌到达（或超时）。
5. 令牌（`access_token`、`refresh_token`、过期时间）将保存到 `~/.hermes/auth.json` 下的 `minimax-oauth` 键中。

当访问令牌距离过期时间不足 60 秒时，令牌刷新（标准 OAuth `refresh_token` 授权）会在每次会话启动时自动运行。

## 检查登录状态

```bash
hermes doctor
```

`◆ 认证提供商` 部分将显示：

```
✓ MiniMax OAuth  (已登录, region=global)
```

或，如果未登录：

```
⚠ MiniMax OAuth  (未登录)
```

## 切换模型

```bash
hermes model
# → 选择 "MiniMax (OAuth)"
# → 从模型列表中选择
```

或直接设置模型：

```bash
hermes config set model MiniMax-M2.7
hermes config set provider minimax-oauth
```

## 配置参考

登录后，`~/.hermes/config.yaml` 将包含类似以下条目：

```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-oauth
  base_url: https://api.minimax.io/anthropic
```

### `--region` 标志

| 值 | 门户 | 推理端点 |
|-------|--------|-------------------|
| `global`（默认） | `https://api.minimax.io` | `https://api.minimax.io/anthropic` |
| `cn` | `https://api.minimaxi.com` | `https://api.minimaxi.com/anthropic` |

### 提供商别名

以下所有选项均解析为 `minimax-oauth`：

```bash
hermes --provider minimax-oauth    # 标准形式
hermes --provider minimax-portal   # 别名
hermes --provider minimax-global   # 别名
hermes --provider minimax_oauth    # 别名（下划线形式）
```

## 环境变量

`minimax-oauth` 提供商**不使用** `MINIMAX_API_KEY` 或 `MINIMAX_BASE_URL`。这些变量仅适用于基于 API 密钥的 `minimax` 和 `minimax-cn` 提供商。

| 变量 | 效果 |
|----------|--------|
| `MINIMAX_API_KEY` | 仅由 `minimax` 提供商使用 — 对 `minimax-oauth` 忽略 |
| `MINIMAX_CN_API_KEY` | 仅由 `minimax-cn` 提供商使用 — 对 `minimax-oauth` 忽略 |

要在运行时强制使用 `minimax-oauth` 提供商：

```bash
HERMES_INFERENCE_PROVIDER=minimax-oauth hermes
```

## 模型

| 模型 | 最适合 |
|-------|----------|
| `MiniMax-M2.7` | 长上下文推理、复杂工具调用 |
| `MiniMax-M2.7-highspeed` | 更低延迟、轻量级任务、辅助调用 |

两个模型均支持最多 200,000 个 token 的上下文。

当 `minimax-oauth` 为主要提供商时，`MiniMax-M2.7-highspeed` 也会自动用作视觉和委托任务的辅助模型。

## 故障排除

### 令牌已过期 — 未自动重新登录

如果访问令牌距离过期时间不足 60 秒，Hermes 会在每次会话启动时刷新令牌。如果访问令牌已经过期（例如，长时间离线后），则会在下次请求时自动进行刷新。如果刷新失败并返回 `refresh_token_reused` 或 `invalid_grant`，Hermes 会将该会话标记为需要重新登录。

**解决方法：** 再次运行 `hermes auth add minimax-oauth` 以开始新的登录流程。

### 授权超时

设备码流程具有有限的超时窗口。如果您未及时批准登录，Hermes 将抛出超时错误。

**解决方法：** 重新运行 `hermes auth add minimax-oauth`（或 `hermes model`）。流程将重新开始。

### 状态不匹配（可能的 CSRF 攻击）

Hermes 检测到授权服务器返回的 `state` 值与其发送的值不匹配。

**解决方法：** 重新运行登录流程。如果问题持续存在，请检查是否有代理或重定向正在修改 OAuth 响应。

### 从远程服务器登录

如果 `hermes` 无法打开浏览器窗口，请使用 `--no-browser`：

```bash
hermes auth add minimax-oauth --no-browser
```

Hermes 将打印 URL 和代码。在任何设备上打开该 URL 并在那里完成流程。

### 运行时出现“未登录 MiniMax OAuth”错误

认证存储中没有 `minimax-oauth` 的凭据。您可能尚未登录，或凭据文件已被删除。

**解决方法：** 运行 `hermes model` 并选择 MiniMax (OAuth)，或运行 `hermes auth add minimax-oauth`。

## 退出登录

要删除存储的 MiniMax OAuth 凭据：

```bash
hermes auth remove minimax-oauth
```

## 另见

- [AI 提供商参考](../integrations/providers.md)
- [环境变量](../reference/environment-variables.md)
- [配置](../user-guide/configuration.md)
- [hermes doctor](../reference/cli-commands.md)