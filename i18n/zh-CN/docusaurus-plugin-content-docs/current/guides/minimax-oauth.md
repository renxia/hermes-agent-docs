---
sidebar_position: 15
title: "MiniMax OAuth"
description: "通过浏览器 OAuth 登录 MiniMax，在 Hermes 智能体中使用 MiniMax-M2.7 模型——无需 API 密钥"
---

# MiniMax OAuth

Hermes 智能体通过基于浏览器的 OAuth 登录流程支持 **MiniMax**，使用与 [MiniMax 门户](https://www.minimax.io)相同的凭据。无需 API 密钥或信用卡——登录一次，Hermes 会自动刷新您的会话。

传输层复用了 `anthropic_messages` 适配器（MiniMax 在 `/anthropic` 路径提供了一个兼容 Anthropic Messages 的端点），因此所有现有的工具调用、流式传输和上下文功能无需任何适配器更改即可正常工作。

## 概览

| 项目 | 值 |
|------|-------|
| 提供商 ID | `minimax-oauth` |
| 显示名称 | MiniMax (OAuth) |
| 认证类型 | 浏览器 OAuth (PKCE 设备码流程) |
| 传输协议 | Anthropic Messages 兼容 (`anthropic_messages`) |
| 模型 | `MiniMax-M2.7`, `MiniMax-M2.7-highspeed` |
| 全球端点 | `https://api.minimax.io/anthropic` |
| 中国端点 | `https://api.minimaxi.com/anthropic` |
| 需要环境变量 | 否 (`MINIMAX_API_KEY` 对此提供商**无效**) |

## 前提条件

- Python 3.9+
- 已安装 Hermes 智能体
- 拥有一个 MiniMax 账户，位于 [minimax.io](https://www.minimax.io) (全球) 或 [minimaxi.com](https://www.minimaxi.com) (中国)
- 本地机器上可用的浏览器（或使用 `--no-browser` 进行远程会话）

## 快速开始

```bash
# 启动提供商和模型选择器
hermes model
# → 从提供商列表中选择 "MiniMax (OAuth)"
# → Hermes 会打开您的浏览器至 MiniMax 授权页面
# → 在浏览器中批准访问
# → 选择一个模型 (MiniMax-M2.7 或 MiniMax-M2.7-highspeed)
# → 开始聊天

hermes
```

首次登录后，凭据将存储在 `~/.hermes/auth.json` 中，并在每次会话开始前自动刷新。

## 手动登录

您可以不通过模型选择器直接触发登录：

```bash
hermes auth add minimax-oauth
```

### 中国区

如果您的账户在中國平台上 (`minimaxi.com`)，请使用中国区 OAuth 提供商 ID `minimax-cn`，或者跳过 OAuth 直接配置 `MINIMAX_CN_API_KEY` / `MINIMAX_CN_BASE_URL`。旧版文档中描述的 `--region cn` 标志**未**接入 CLI 的参数解析器；请改用 `minimax-cn` 提供商：

```bash
hermes auth add minimax-cn --type oauth   # 如果您的 CN 账户支持 OAuth
# 或者更简单：
echo 'MINIMAX_CN_API_KEY=your-key' >> ~/.hermes/.env
```

### 远程 / 无头会话

在服务器或没有浏览器的容器上：

```bash
hermes auth add minimax-oauth --no-browser
```

Hermes 将打印验证 URL 和用户码——在任意设备上打开该 URL，并在提示时输入代码。

## OAuth 流程

Hermes 对 MiniMax OAuth 端点实现了 PKCE 设备码流程：

1.  Hermes 生成一个 PKCE 验证器 / 质询对以及一个随机状态值。
2.  它向 `{base_url}/oauth/code` 发送 POST 请求，附带质询，并接收 `user_code` 和 `verification_uri`。
3.  您的浏览器打开 `verification_uri`。如果提示，输入 `user_code`。
4.  Hermes 轮询 `{base_url}/oauth/token`，直到令牌到达（或截止日期过去）。
5.  令牌（`access_token`、`refresh_token`、过期时间）保存在 `~/.hermes/auth.json` 的 `minimax-oauth` 键下。

令牌刷新（标准 OAuth `refresh_token` 授予）在每次会话开始时，当访问令牌距离过期不足 60 秒时自动运行。

## 检查登录状态

```bash
hermes doctor
```

`◆ Auth Providers` 部分会显示：

```
✓ MiniMax OAuth  (已登录，区域=全球)
```

或者，如果未登录：

```
⚠ MiniMax OAuth  (未登录)
```

## 切换模型

```bash
hermes model
# → 选择 "MiniMax (OAuth)"
# → 从模型列表中选取
```

或直接设置模型：

```bash
hermes config set model MiniMax-M2.7
hermes config set provider minimax-oauth
```

## 配置参考

登录后，`~/.hermes/config.yaml` 将包含类似以下内容的条目：

```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-oauth
  base_url: https://api.minimax.io/anthropic
```

### 区域端点

| 提供商 ID | 门户 | 推理端点 |
|-------------|--------|-------------------|
| `minimax-oauth` (全球) | `https://api.minimax.io` | `https://api.minimax.io/anthropic` |
| `minimax-cn` (中国) | `https://api.minimaxi.com` | `https://api.minimaxi.com/anthropic` |

### 提供商别名

以下所有标识均解析为 `minimax-oauth`：

```bash
hermes --provider minimax-oauth    # 规范
hermes --provider minimax-portal   # 别名
hermes --provider minimax-global   # 别名
hermes --provider minimax_oauth    # 别名（下划线形式）
```

## 环境变量

`minimax-oauth` 提供商**不**使用 `MINIMAX_API_KEY` 或 `MINIMAX_BASE_URL`。这些变量仅用于基于 API 密钥的 `minimax` 和 `minimax-cn` 提供商。

| 变量 | 效果 |
|----------|--------|
| `MINIMAX_API_KEY` | 仅由 `minimax` 提供商使用——对 `minimax-oauth` 忽略 |
| `MINIMAX_CN_API_KEY` | 仅由 `minimax-cn` 提供商使用——对 `minimax-oauth` 忽略 |

要将 `minimax-oauth` 设为活动提供商，请在 `config.yaml` 中设置 `model.provider: minimax-oauth`（使用 `hermes setup` 进行引导式设置），或在单次调用中传递 `--provider minimax-oauth`：

```bash
hermes --provider minimax-oauth
```

## 模型

| 模型 | 最佳用途 |
|-------|----------|
| `MiniMax-M2.7` | 长上下文推理，复杂工具调用 |
| `MiniMax-M2.7-highspeed` | 更低延迟，轻量级任务，辅助调用 |

两种模型均支持最多 200,000 个 token 的上下文。

当 `minimax-oauth` 为主要提供商时，`MiniMax-M2.7-highspeed` 也会自动用作视觉和委派任务的辅助模型。

## 故障排除

### 令牌过期——未自动重新登录

Hermes 在每次会话开始时，如果令牌距离过期不足 60 秒，则会刷新令牌。如果访问令牌已经过期（例如，长时间离线后），刷新会在下一个请求时自动发生。如果刷新失败并显示 `refresh_token_reused` 或 `invalid_grant`，Hermes 会将会话标记为需要重新登录。

当刷新失败是终局性的（HTTP 4xx、`invalid_grant`、授权被撤销等）时，Hermes 会将刷新令牌标记为失效，并在本地隔离它，以防止其不断重放注定失败的交换。智能体会显示一条“需要重新认证”的消息，并保持静默直到您重新登录。

**修复方法：**再次运行 `hermes auth add minimax-oauth` 以开始新的登录。隔离状态会在下一次成功交换时清除。

### 授权超时

设备码流程有有限的过期窗口。如果您未及时批准登录，Hermes 会引发超时错误。

**修复方法：**重新运行 `hermes auth add minimax-oauth`（或 `hermes model`）。流程将重新开始。

### 状态不匹配（可能的 CSRF）

Hermes 检测到授权服务器返回的 `state` 值与其发送的值不匹配。

**修复方法：**重新运行登录。如果问题持续，请检查是否有正在修改 OAuth 响应的代理或重定向。

### 从远程服务器登录

如果 `hermes` 无法打开浏览器窗口，请使用 `--no-browser`：

```bash
hermes auth add minimax-oauth --no-browser
```

Hermes 会打印 URL 和代码。在任意设备上打开该 URL 并在那里完成流程。

### 运行时出现“未登录到 MiniMax OAuth”错误

身份验证存储中没有 `minimax-oauth` 的凭据。您尚未登录，或者凭据文件已被删除。

**修复方法：**运行 `hermes model` 并选择 MiniMax (OAuth)，或运行 `hermes auth add minimax-oauth`。

## 注销

要删除存储的 MiniMax OAuth 凭据：

```bash
hermes auth remove minimax-oauth
```

## 另请参阅

- [AI 提供商参考](../integrations/providers.md)
- [环境变量](../reference/environment-variables.md)
- [配置](../user-guide/configuration.md)
- [hermes doctor](../reference/cli-commands.md)