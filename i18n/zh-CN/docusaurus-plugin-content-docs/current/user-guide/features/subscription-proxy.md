---
sidebar_position: 15
title: "Subscription Proxy"
description: "Use your Nous Portal subscription (or other OAuth provider) as an OpenAI-compatible endpoint for external apps"
---

# Subscription Proxy

订阅代理是一个本地 HTTP 服务器，允许外部应用——OpenViking、Karakeep、Open WebUI，任何支持 OpenAI 兼容 chat completions 协议的应用——使用你由 Hermes 管理的提供商订阅作为其 LLM 端点。代理会自动附加正确的凭证（并自动刷新），因此应用永远不需要静态 API 密钥。

这与 [API 服务器](./api-server.md) 不同：

| | API 服务器 | 订阅代理 |
|---|---|---|
| 提供内容 | 你的智能体（完整工具集、记忆、技能） | 原始模型推理 |
| 使用场景 | "将 Hermes 用作聊天后端" | "在另一个应用中使用我的 Portal 订阅" |
| 认证方式 | 你的 `API_SERVER_KEY` | 任意 bearer（代理会附加真实凭证） |
| 工具调用 | 支持——智能体会执行工具 | 不支持——仅透传 |

当你希望将**智能体**作为后端时，使用 API 服务器。当你只想通过订阅使用**模型**时，使用代理。

## 快速开始

### 1. 登录你的提供商（一次性）

```bash
hermes portal
```

这会打开浏览器进行 Nous Portal OAuth 流程。Hermes 会将刷新令牌存储在 `~/.hermes/auth.json`——与所有 Hermes 提供商登录信息存放的位置相同。

### 2. 启动代理

```bash
hermes proxy start
```

```
Starting Hermes proxy for Nous Portal
  Listening on:  http://127.0.0.1:8645/v1
  Forwarding to: (resolved per-request from your subscription)
  Use any bearer token in the client — the proxy attaches your real credential.
```

在前台保持运行。如果需要它在注销后继续运行，可使用 `tmux`、`nohup` 或 systemd 单元。

### 3. 将应用指向它

任何兼容 OpenAI 的应用配置都需要相同的三要素：

```
Base URL:   http://127.0.0.1:8645/v1
API key:    任意值（如 "sk-unused"）
Model:      Hermes-4-70B    # 或 Hermes-4.3-36B, Hermes-4-405B
```

代理会忽略来自你应用的 `Authorization` 请求头，并将你的真实 Portal 凭证附加到上游请求中。当 bearer 令牌接近过期时会自动刷新。

## 可用的提供商

```bash
hermes proxy providers
```

当前已提供的：`nous`（Nous Portal）和 `xai`（xAI / Grok）。更多 OAuth 提供商可通过在 `hermes_cli/proxy/adapters/` 中实现 `UpstreamAdapter` 接口来添加。

## 检查状态

```bash
hermes proxy status
```

```
Hermes proxy upstream adapters

  [nous    ] Nous Portal — ready (bearer expires 2026-05-15T06:43:21Z)
```

如果看到 `not logged in`，请运行 `hermes portal`。如果看到 `credentials need attention`，说明你的刷新令牌已被撤销（很少见——如果你从 Portal 网页端注销则可能发生）——只需重新运行 `hermes portal`。

## 允许的路径

代理仅转发上游实际服务的路径。对于 Nous Portal：

| 路径 | 用途 |
|------|---------|
| `/v1/chat/completions` | Chat completions（流式 + 非流式） |
| `/v1/completions` | 传统文本补全 |
| `/v1/embeddings` | 嵌入向量 |
| `/v1/models` | 模型列表 |

其他路径（`/v1/images/generations`、`/v1/audio/speech` 等）将返回 404 并附带明确的错误提示，指向允许的路径。这可以防止客户端向上游发送异常请求。

## 配置 OpenViking 以使用 Portal

[OpenViking](https://github.com/volcengine/OpenViking) 是一个上下文数据库，需要 LLM 提供商来支持其 VLM（用于提取记忆的视觉/语言模型）和嵌入模型。通过代理，你可以将其 `vlm.api_base` 指向你的本地代理：

编辑 `~/.openviking/ov.conf`：

```json
{
  "vlm": {
    "provider": "openai",
    "model": "Hermes-4-70B",
    "api_base": "http://127.0.0.1:8645/v1",
    "api_key": "unused-proxy-attaches-real-creds"
  }
}
```

然后在终端中启动代理，同时运行 `openviking-server`：

```bash
# 终端 1
hermes proxy start

# 终端 2
openviking-server
```

OpenViking 的 VLM 调用现在将通过你的 Portal 订阅进行。嵌入模型端仍需要其自己的提供商——Portal 确实提供 `/v1/embeddings`，但模型选择取决于你的套餐支持哪些；请查看 `portal.nousresearch.com/models`。

## 配置 Karakeep（或任何书签/摘要应用）

[Karakeep](https://karakeep.app/) 接受兼容 OpenAI 的 API 来进行书签摘要。在其配置中：

```bash
# Karakeep .env
OPENAI_API_BASE_URL=http://127.0.0.1:8645/v1
OPENAI_API_KEY=any-non-empty-string
INFERENCE_TEXT_MODEL=Hermes-4-70B
```

同样的模式也适用于 Open WebUI、LobeChat、NextChat 或任何其他兼容 OpenAI 的客户端。

## 在局域网中暴露

默认情况下代理绑定 `127.0.0.1`（仅本机访问）。要允许网络中的其他机器使用：

```bash
hermes proxy start --host 0.0.0.0 --port 8645
```

⚠ **注意：** 网络中的任何人均可使用你的 Portal 订阅。代理本身没有认证机制——它接受任何 bearer 令牌。如果要在信任网络之外暴露，请使用防火墙、VPN 或具有适当认证的反向代理。

## 速率限制

你的 Portal 套餐的 RPM/TPM 限制适用于整个代理。代理不会扇出或做连接池——它使用单一 bearer 令牌，共享你的全部订阅配额。使用情况可在 [portal.nousresearch.com](https://portal.nousresearch.com) 监控。

## 架构

代理被有意设计为最简形态。每个请求的处理流程：

1. 接收来自你应用的 `POST /v1/chat/completions`
2. 查找适配器当前的凭证（如果即将过期则刷新）
3. 原样转发请求体，并附加 `Authorization: Bearer <minted-key>`
4. 将响应原样流式返回（保留 SSE）

无转换。无请求体日志记录。无智能体循环。代理是一个附加凭证的透传通道。

## 未来：更多 OAuth 提供商

适配器系统是可插拔的。添加新提供商（如 HuggingFace、GitHub Copilot 的聊天端点、通过 OAuth 的 Anthropic）需要在 `hermes_cli/proxy/adapters/<provider>.py` 中实现 `UpstreamAdapter` 并在 `adapters/__init__.py` 中注册。协议级别不兼容 OpenAI 的提供商（如 Anthropic Messages API）需要一层转换，这超出了当前架构的范围。