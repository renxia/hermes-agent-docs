---
sidebar_position: 14
title: "API Server"
description: "Expose hermes-agent as an OpenAI-compatible API for any frontend"
---

# API 服务器

API 服务器将 hermes-agent 作为一个兼容 OpenAI 格式的 HTTP 端点暴露出来。任何使用 OpenAI 格式的前端（例如 Open WebUI、LobeChat、LibreChat、NextChat、ChatBox 等，以及数百个其他应用）都可以连接到 hermes-agent 并将其用作后端。

您的智能体（agent）会处理带有完整工具集（终端、文件操作、网络搜索、记忆、技能）的请求，并返回最终响应。在流式传输（streaming）时，工具进度指示器会内联显示，以便前端了解智能体正在执行什么操作。

## 快速入门

### 1. 启用 API 服务器

添加到 `~/.hermes/.env`：

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=change-me-local-dev
# 可选：仅当浏览器必须直接调用 Hermes 时需要
# API_SERVER_CORS_ORIGINS=http://localhost:3000
```

### 2. 启动网关

```bash
hermes gateway
```

您将看到：

```
[API Server] API server listening on http://127.0.0.1:8642
```

### 3. 连接前端

将任何兼容 OpenAI 的客户端指向 `http://localhost:8642/v1`：

```bash
# 使用 curl 进行测试
curl http://localhost:8642/v1/chat/completions \
  -H "Authorization: Bearer change-me-local-dev" \
  -H "Content-Type: application/json" \
  -d '{"model": "hermes-agent", "messages": [{"role": "user", "content": "Hello!"}]}'
```

或者连接 Open WebUI、LobeChat 或任何其他前端——请参阅 [Open WebUI 集成指南](/docs/user-guide/messaging/open-webui) 获取分步说明。

## 端点（Endpoints）

### POST /v1/chat/completions

标准的 OpenAI 聊天补全（Chat Completions）格式。无状态（Stateless）——完整的对话包含在每个请求的 `messages` 数组中。

**请求:**
```json
{
  "model": "hermes-agent",
  "messages": [
    {"role": "system", "content": "你是一位 Python 专家。"},
    {"role": "user", "content": "写一个斐波那契函数"}
  ],
  "stream": false
}
```

**响应:**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1710000000,
  "model": "hermes-agent",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "这是一个斐波那契函数..."},
    "finish_reason": "stop"
  }],
  "usage": {"prompt_tokens": 50, "completion_tokens": 200, "total_tokens": 250}
}
```

**流式传输 (Streaming)** (`"stream": true`)：返回服务器发送事件（SSE），包含逐个 token 的响应块。对于**聊天补全**，流使用标准的 `chat.completion.chunk` 事件，并加上 Hermes 自定义的 `hermes.tool.progress` 事件，用于工具启动的用户体验展示。对于**响应**，流使用 OpenAI 响应事件类型，例如 `response.created`、`response.output_text.delta`、`response.output_item.added`、`response.output_item.done` 和 `response.completed`。

**流中的工具进度**:
- **聊天补全**: Hermes 发出 `event: hermes.tool.progress`，用于展示工具启动状态，而不会污染持久化的助手文本。
- **响应**: Hermes 在 SSE 流期间发出规范原生的 `function_call` 和 `function_call_output` 输出项，因此客户端可以实时渲染结构化的工具 UI。

### POST /v1/responses

OpenAI 响应（Responses）API 格式。通过 `previous_response_id` 支持服务器端对话状态——服务器存储完整的对话历史记录（包括工具调用和结果），从而在客户端无需管理的情况下保持多轮上下文。

**请求:**
```json
{
  "model": "hermes-agent",
  "input": "我的项目中有哪些文件？",
  "instructions": "你是一位乐于助人的编码助手。",
  "store": true
}
```

**响应:**
```json
{
  "id": "resp_abc123",
  "object": "response",
  "status": "completed",
  "model": "hermes-agent",
  "output": [
    {"type": "function_call", "name": "terminal", "arguments": "{\"command\": \"ls\"}", "call_id": "call_1"},
    {"type": "function_call_output", "call_id": "call_1", "output": "README.md src/ tests/"},
    {"type": "message", "role": "assistant", "content": [{"type": "output_text", "text": "你的项目包含..."}]}
  ],
  "usage": {"input_tokens": 50, "output_tokens": 200, "total_tokens": 250}
}
```

#### 使用 previous_response_id 进行多轮对话

通过链式响应来保持完整的上下文（包括工具调用）：

```json
{
  "input": "现在给我看看 README",
  "previous_response_id": "resp_abc123"
}
```

服务器会从存储的响应链中重建完整的对话——所有先前的工具调用和结果都会被保留。链式请求也会共享相同的会话，因此多轮对话在仪表板和会话历史记录中显示为一个单独的条目。

#### 命名对话 (Named conversations)

使用 `conversation` 参数而不是跟踪响应 ID：

```json
{"input": "你好", "conversation": "my-project"}
{"input": "src/里有什么？", "conversation": "my-project"}
{"input": "运行测试", "conversation": "my-project"}
```

服务器会自动将请求链式连接到该对话的最新响应。这类似于网关会话中的 `/title` 命令。

### GET /v1/responses/\{id\}

通过 ID 检索先前存储的响应。

### DELETE /v1/responses/\{id\}

删除存储的响应。

### GET /v1/models

列出可用的模型。广告的模型名称默认为 [配置文件](/docs/user-guide/features/profiles) 名称（或默认配置文件的 `hermes-agent`）。大多数前端需要此功能来进行模型发现。

### GET /health

健康检查。返回 `{"status": "ok"}`。对于期望 `/v1/` 前缀的兼容 OpenAI 客户端，也可通过 **GET /v1/health** 访问。

## 系统提示处理 (System Prompt Handling)

当前端发送 `system` 消息（聊天补全）或 `instructions` 字段（响应 API）时，hermes-agent 会将其**叠加**到其核心系统提示之上。您的智能体保留所有工具、记忆和技能——前端的系统提示只是增加了额外的指令。

这意味着您可以在不损失能力的情况下，为每个前端定制行为：
- Open WebUI 系统提示："你是一位 Python 专家。始终包含类型提示。"
- 智能体仍然拥有终端、文件工具、网络搜索、记忆等。

## 身份验证 (Authentication)

通过 `Authorization` 头部使用 Bearer token 进行认证：

```
Authorization: Bearer ***
```

通过 `API_SERVER_KEY` 环境变量配置密钥。如果您需要浏览器直接调用 Hermes，还需要将 `API_SERVER_CORS_ORIGINS` 设置为明确的允许列表。

:::warning 安全警告
API 服务器提供了对 hermes-agent 工具集的完全访问权限，**包括终端命令**。当绑定到非回环地址（如 `0.0.0.0`）时，`API_SERVER_KEY` 是**必需的**。同时，请保持 `API_SERVER_CORS_ORIGINS` 范围狭窄，以控制浏览器访问。

默认绑定地址（`127.0.0.1`）仅用于本地使用。浏览器访问默认禁用；仅对明确信任的源启用。
:::

## 配置 (Configuration)

### 环境变量

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `API_SERVER_ENABLED` | `false` | 启用 API 服务器 |
| `API_SERVER_PORT` | `8642` | HTTP 服务器端口 |
| `API_SERVER_HOST` | `127.0.0.1` | 绑定地址（默认仅限本地） |
| `API_SERVER_KEY` | _(无)_ | 用于认证的 Bearer token |
| `API_SERVER_CORS_ORIGINS` | _(无)_ | 逗号分隔的允许浏览器源 |
| `API_SERVER_MODEL_NAME` | _(配置文件名)_ | `/v1/models` 上的模型名称。默认为配置文件名，或默认配置文件的 `hermes-agent`。 |

### config.yaml

```yaml
# 尚未支持——请使用环境变量。
# config.yaml 支持将在未来版本发布。
```

## 安全头部 (Security Headers)

所有响应都包含安全头部：
- `X-Content-Type-Options: nosniff` — 防止 MIME 类型嗅探
- `Referrer-Policy: no-referrer` — 防止引用源泄露

## CORS

API 服务器默认**不**启用浏览器 CORS。

如需直接浏览器访问，请设置明确的允许列表：

```bash
API_SERVER_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

当启用 CORS 时：
- **预检响应 (Preflight responses)** 包含 `Access-Control-Max-Age: 600`（10 分钟缓存）
- **SSE 流式响应** 包含 CORS 头部，以便浏览器 EventSource 客户端正常工作
- **`Idempotency-Key`** 是允许的请求头部——客户端可以发送它进行去重（响应会按此键缓存 5 分钟）

大多数已记录的前端（如 Open WebUI）都是服务器到服务器连接，根本不需要 CORS。

## 兼容的前端 (Compatible Frontends)

任何支持 OpenAI API 格式的前端都可以使用。已测试/记录的集成包括：

| 前端 | Stars | 连接方式 |
|----------|-------|------------|
| [Open WebUI](/docs/user-guide/messaging/open-webui) | 126k | 提供完整指南 |
| LobeChat | 73k | 自定义提供商端点 |
| LibreChat | 34k | librechat.yaml 中的自定义端点 |
| AnythingLLM | 56k | 通用 OpenAI 提供商 |
| NextChat | 87k | BASE_URL 环境变量 |
| ChatBox | 39k | API Host 设置 |
| Jan | 26k | 远程模型配置 |
| HF Chat-UI | 8k | OPENAI_BASE_URL |
| big-AGI | 7k | 自定义端点 |
| OpenAI Python SDK | — | `OpenAI(base_url="http://localhost:8642/v1")` |
| curl | — | 直接 HTTP 请求 |

## 使用配置文件进行多用户设置 (Multi-User Setup with Profiles)

要为多个用户提供独立的 Hermes 实例（独立的配置、记忆、技能），请使用 [配置文件](/docs/user-guide/features/profiles)：

```bash
# 为每个用户创建配置文件
hermes profile create alice
hermes profile create bob

# 在不同端口上为每个配置文件的 API 服务器进行配置
hermes -p alice config set API_SERVER_ENABLED true
hermes -p alice config set API_SERVER_PORT 8643
hermes -p alice config set API_SERVER_KEY alice-secret

hermes -p bob config set API_SERVER_ENABLED true
hermes -p bob config set API_SERVER_PORT 8644
hermes -p bob config set API_SERVER_KEY bob-secret

# 启动每个配置文件的网关
hermes -p alice gateway &
hermes -p bob gateway &
```

每个配置文件的 API 服务器会自动将配置文件名作为模型 ID 进行广告：

- `http://localhost:8643/v1/models` → 模型 `alice`
- `http://localhost:8644/v1/models` → 模型 `bob`

在 Open WebUI 中，将它们添加为单独的连接。模型下拉菜单会显示 `alice` 和 `bob` 作为不同的模型，每个模型都由一个完全隔离的 Hermes 实例支持。详情请参阅 [Open WebUI 指南](/docs/user-guide/messaging/open-webui#multi-user-setup-with-profiles)。

## 限制 (Limitations)

- **响应存储** — 存储的响应（用于 `previous_response_id`）保存在 SQLite 中，可以存活于网关重启。最多存储 100 个响应（按 LRU 淘汰）。
- **不支持文件上传** — 通过上传文件进行的视觉/文档分析尚未通过 API 支持。
- **模型字段仅为装饰性** — 请求中的 `model` 字段会被接受，但实际使用的 LLM 模型是在服务器端通过 config.yaml 配置的。

## 代理模式 (Proxy Mode)

API 服务器也作为**网关代理模式**的后端服务。当另一个 Hermes 网关实例配置了 `GATEWAY_PROXY_URL` 指向此 API 服务器时，它会将所有消息转发到此处，而不是运行自己的智能体。这支持了分离式部署——例如，一个处理 Matrix E2EE 的 Docker 容器，并将消息转发给主机侧的智能体。

有关完整的设置指南，请参阅 [Matrix 代理模式](/docs/user-guide/messaging/matrix#proxy-mode-e2ee-on-macos)。