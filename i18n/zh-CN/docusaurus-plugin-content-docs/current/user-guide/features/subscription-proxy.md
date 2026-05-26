---
sidebar_position: 15
title: "订阅代理"
description: "使用您的 Nous 订阅（或其他 OAuth 提供商）作为外部应用的 OpenAI 兼容端点"
---

# 订阅代理

订阅代理是一个本地 HTTP 服务器，它允许外部应用——OpenViking、Karakeep、Open WebUI，以及任何支持 OpenAI 兼容聊天补全的工具——使用您由 Hermes 管理的提供商订阅作为其 LLM 端点。代理会附上正确的凭据（并自动刷新），因此应用永远不需要静态的 API 密钥。

这与 [API 服务器](./api-server.md) 不同：

| | API 服务器 | 订阅代理 |
|---|---|---|
| 提供内容 | 您的智能体（全套工具、记忆、技能） | 原始模型推理 |
| 使用场景 | "将 Hermes 用作聊天后端" | "在另一个应用中使用我的 Portal 订阅" |
| 认证方式 | 您的 `API_SERVER_KEY` | 任何承载令牌（代理会附加真实的那个） |
| 工具调用 | 是——智能体会运行工具 | 否——仅透传 |

当您需要将**智能体**作为后端时，请使用 API 服务器。当您只是想通过订阅使用**模型本身**时，请使用代理。

## 快速开始

### 1. 登录您的提供商（一次性）

```bash
hermes login nous
```

这将打开您的浏览器以完成 Nous Portal OAuth 流程。Hermes 将刷新令牌存储在 `~/.hermes/auth.json`——所有 Hermes 提供商登录都存放在这里。

### 2. 启动代理

```bash
hermes proxy start
```

```
正在启动 Hermes 代理，连接 Nous Portal
  监听地址：  http://127.0.0.1:8645/v1
  转发至：（根据您的订阅按请求解析）
  在客户端使用任何承载令牌——代理会附上您的真实凭据。
```

在前台保持此进程运行。如果您希望它在注销后继续运行，可以使用 `tmux`、`nohup` 或 systemd 单元。

### 3. 将您的应用指向它

任何 OpenAI 兼容的应用配置都接受相同的三个参数：

```
Base URL:   http://127.0.0.1:8645/v1
API key:    任意值（例如 "sk-unused"）
Model:      Hermes-4-70B    # 或 Hermes-4.3-36B, Hermes-4-405B
```

代理会忽略来自您应用的 `Authorization` 头，并在上游请求中附上您真实的 Portal 凭据。当承载令牌接近过期时，刷新会自动发生。

## 可用的提供商

```bash
hermes proxy providers
```

目前已包含：`nous`（Nous Portal）。可以通过在 `hermes_cli/proxy/adapters/` 中实现 `UpstreamAdapter` 接口来添加更多 OAuth 提供商。

## 检查状态

```bash
hermes proxy status
```

```
Hermes 代理上游适配器

  [nous    ] Nous Portal — 就绪（承载令牌过期时间 2026-05-15T06:43:21Z）
```

如果您看到 `未登录`，请运行 `hermes login nous`。如果您看到 `凭据需要处理`，说明您的刷新令牌已被撤销（罕见——通常发生在您从 Portal 网页界面注销后）——只需重新运行 `hermes login nous`。

## 允许的路径

代理仅转发上游实际提供的路径。对于 Nous Portal：

| 路径 | 用途 |
|------|------|
| `/v1/chat/completions` | 聊天补全（流式和非流式） |
| `/v1/completions` | 传统文本补全 |
| `/v1/embeddings` | 嵌入 |
| `/v1/models` | 模型列表 |

其他路径（如 `/v1/images/generations`、`/v1/audio/speech` 等）将返回 404，并附带明确的错误提示，指出允许的路径。这可以防止意外的客户端向上游发送奇怪的请求。

## 配置 OpenViking 使用 Portal

[OpenViking](https://github.com/volcengine/OpenViking) 是一个上下文数据库，需要一个 LLM 提供商来支持其 VLM（用于提取记忆的视觉/语言模型）和嵌入模型。通过代理，您可以将其 `vlm.api_base` 指向本地代理：

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

然后在一个终端中启动代理，同时运行 `openviking-server`：

```bash
# 终端 1
hermes proxy start

# 终端 2
openviking-server
```

OpenViking 的 VLM 调用现在将通过您的 Portal 订阅进行。嵌入模型方面仍需要自己的提供商——Portal 确实提供 `/v1/embeddings` 服务，但可用的模型取决于您的订阅层级支持哪些；请查看 `portal.nousresearch.com/models`。

## 配置 Karakeep（或任何书签/摘要应用）

[Karakeep](https://karakeep.app/) 使用一个兼容 OpenAI 的 API 进行书签摘要。在其配置中：

```bash
# Karakeep .env
OPENAI_API_BASE_URL=http://127.0.0.1:8645/v1
OPENAI_API_KEY=any-non-empty-string
INFERENCE_TEXT_MODEL=Hermes-4-70B
```

相同的模式适用于 Open WebUI、LobeChat、NextChat 或任何其他 OpenAI 兼容客户端。

## 在局域网中暴露

默认情况下，代理绑定 `127.0.0.1`（仅限本地主机）。要让网络中的其他机器使用它：

```bash
hermes proxy start --host 0.0.0.0 --port 8645
```

⚠ **请注意：** 现在您网络中的任何人都可以使用您的 Portal 订阅。代理本身没有认证——它接受任何承载令牌。如果您要将其暴露到可信网络之外，请使用防火墙、VPN 或带有适当身份验证的反向代理。

## 速率限制

您 Portal 订阅层级的 RPM/TPM 限制在整个代理上适用。代理不会分发或池化——它使用您全部订阅配额的单一承载令牌。使用情况可在 [portal.nousresearch.com](https://portal.nousresearch.com) 监控。

## 架构

代理有意设计得非常精简。每个请求：

1. 从您的应用接收 `POST /v1/chat/completions`
2. 查找适配器的当前凭据（如果即将过期则刷新）
3. 原样转发请求体，并附上 `Authorization: Bearer <新生成的密钥>`
4. 将响应流原封不动地传回（SSE 格式保留）

不进行转换。不记录请求体内容。没有智能体循环。代理是一个附带凭据的透传通道。

## 未来：更多 OAuth 提供商

适配器系统是可插拔的。添加新提供商（例如 HuggingFace、GitHub Copilot 的聊天端点、通过 OAuth 的 Anthropic）需要在 `hermes_cli/proxy/adapters/<provider>.py` 中实现 `UpstreamAdapter` 并在 `adapters/__init__.py` 中注册。在协议级别上不是 OpenAI 兼容的提供商（例如 Anthropic Messages API）将需要一个转换层，这超出了当前架构的范围。