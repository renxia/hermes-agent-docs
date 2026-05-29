---
sidebar_position: 15
title: "订阅代理"
description: "使用您的 Nous Portal 订阅（或其他 OAuth 提供商）作为外部应用的 OpenAI 兼容端点"
---

# 订阅代理

订阅代理是一个本地 HTTP 服务器，它允许外部应用程序——无论是 OpenViking、Karakeep、Open WebUI，还是任何支持 OpenAI 兼容聊天完成接口的应用——使用您通过 Hermes 管理的提供商订阅作为其 LLM 端点。代理会附加正确的凭证（并自动刷新），这样应用就无需静态 API 密钥。

这与 [API 服务器](./api-server.md) 不同：

| | API 服务器 | 订阅代理 |
|---|---|---|
| 服务内容 | 您的智能体（完整工具集、记忆、技能） | 原始模型推理 |
| 使用场景 | "使用 Hermes 作为聊天后端" | "在另一个应用中使用我的 Portal 订阅" |
| 认证 | 您的 `API_SERVER_KEY` | 任何承载令牌（代理附加真实的那个） |
| 工具调用 | 是 — 智能体运行工具 | 否 — 仅直通 |

当您想要**智能体**作为后端时，请使用 API 服务器。当您只想通过您的订阅使用**模型**时，请使用代理。

## 快速开始

### 1. 登录您的提供商（一次性操作）

```bash
hermes auth add nous
```

这将打开您的浏览器进行 Nous Portal OAuth 流程。Hermes 会将刷新令牌存储在 `~/.hermes/auth.json` 中——所有 Hermes 提供商的登录信息都保存在这里。

### 2. 启动代理

```bash
hermes proxy start
```

```
正在为 Nous Portal 启动 Hermes 代理
  监听地址：  http://127.0.0.1:8645/v1
  转发目标：  （根据您的订阅按每个请求解析）
  在客户端中使用任何承载令牌 — 代理会附加您的真实凭证。
```

让此命令在前台持续运行。如果您希望它在您注销后继续运行，请使用 `tmux`、`nohup` 或 systemd 服务单元。

### 3. 将您的应用指向它

任何 OpenAI 兼容应用的配置都使用相同的三要素：

```
基本 URL：    http://127.0.0.1:8645/v1
API 密钥：    任意值（例如 "sk-unused"）
模型：        Hermes-4-70B    # 或 Hermes-4.3-36B, Hermes-4-405B
```

代理会忽略来自您应用的 `Authorization` 头，并将您真实的 Portal 凭证附加到上游请求中。当承载令牌即将过期时，刷新会自动发生。

## 可用的提供商

```bash
hermes proxy providers
```

当前已内置：`nous`（Nous Portal）和 `xai`（xAI / Grok）。可以通过在 `hermes_cli/proxy/adapters/` 中实现 `UpstreamAdapter` 接口来添加更多 OAuth 提供商。

## 检查状态

```bash
hermes proxy status
```

```
Hermes 代理上游适配器

  [nous    ] Nous Portal — 就绪（承载令牌过期时间 2026-05-15T06:43:21Z）
```

如果您看到 `未登录`，请运行 `hermes auth add nous`。如果您看到 `凭证需要处理`，表示您的刷新令牌已被吊销（这种情况很少见——当您从 Portal 网页界面退出登录时可能发生）——只需重新运行 `hermes auth add nous`。

## 允许的路径

代理仅转发上游实际提供的路径。对于 Nous Portal：

| 路径 | 用途 |
|------|------|
| `/v1/chat/completions` | 聊天完成（流式 + 非流式） |
| `/v1/completions` | 传统文本完成 |
| `/v1/embeddings` | 嵌入 |
| `/v1/models` | 模型列表 |

其他路径（例如 `/v1/images/generations`、`/v1/audio/speech` 等）将返回 404 错误，并清晰指出允许的路径。这可以防止杂散客户端向上游泄漏奇怪的请求。

## 配置 OpenViking 以使用 Portal

[OpenViking](https://github.com/volcengine/OpenViking) 是一个上下文数据库，需要 LLM 提供商来支持其 VLM（用于提取记忆的视觉/语言模型）和嵌入模型。通过代理，您可以将其 `vlm.api_base` 指向本地代理：

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

然后在一个终端中与 `openviking-server` 一起启动代理：

```bash
# 终端 1
hermes proxy start

# 终端 2
openviking-server
```

现在，OpenViking 的 VLM 调用将通过您的 Portal 订阅进行。嵌入模型方面仍然需要其自己的提供商——Portal 确实提供 `/v1/embeddings`，但模型选择取决于您的套餐支持哪些；请查看 `portal.nousresearch.com/models`。

## 配置 Karakeep（或任何书签/摘要应用）

[Karakeep](https://karakeep.app/) 接受 OpenAI 兼容的 API 来进行书签摘要。在其配置中：

```bash
# Karakeep .env
OPENAI_API_BASE_URL=http://127.0.0.1:8645/v1
OPENAI_API_KEY=any-non-empty-string
INFERENCE_TEXT_MODEL=Hermes-4-70B
```

相同的模式适用于 Open WebUI、LobeChat、NextChat 或任何其他 OpenAI 兼容客户端。

## 在局域网暴露

默认情况下，代理绑定 `127.0.0.1`（仅本地主机）。要允许网络上的其他机器使用它：

```bash
hermes proxy start --host 0.0.0.0 --port 8645
```

⚠ **请注意：** 现在您网络上的任何人都可以使用您的 Portal 订阅。代理本身没有认证机制——它接受任何承载令牌。如果您将此服务暴露到可信网络之外，请使用防火墙、VPN 或具有适当认证的反向代理。

## 速率限制

您的 Portal 套餐的 RPM/TPM 限制适用于整个代理。代理不会进行扇出或合并——它是一个承载您完整订阅配额的单一承载令牌。在 [portal.nousresearch.com](https://portal.nousresearch.com) 监控使用情况。

## 架构

代理的设计初衷就是保持简洁。每个请求的处理流程：

1.  接收来自您应用的 `POST /v1/chat/completions`
2.  查找适配器的当前凭证（如果即将过期则刷新）
3.  原样转发请求体，并附加 `Authorization: Bearer <minted-key>`
4.  原样流式传回响应（保留 SSE）

无转换。不记录请求体。无智能体循环。代理是一个附加凭证的直通通道。

## 未来：更多 OAuth 提供商

适配器系统是可插拔的。添加新提供商（例如 HuggingFace、GitHub Copilot 的聊天端点、通过 OAuth 的 Anthropic）需要在 `hermes_cli/proxy/adapters/<provider>.py` 中实现 `UpstreamAdapter` 并在 `adapters/__init__.py` 中注册它。那些在协议层面与 OpenAI 不兼容的提供商（例如 Anthropic Messages API）将需要一个转换层，这超出了当前形式的范围。