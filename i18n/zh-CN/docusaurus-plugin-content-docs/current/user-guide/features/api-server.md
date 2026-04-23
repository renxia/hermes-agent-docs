---
sidebar_position: 14
title: "API 服务器"
description: "将 hermes-智能体 暴露为兼容 OpenAI 的 API，供任意前端使用"
---

# API 服务器

API 服务器将 hermes-智能体 暴露为兼容 OpenAI 的 HTTP 端点。任何支持 OpenAI 格式的前端——如 Open WebUI、LobeChat、LibreChat、NextChat、ChatBox 等数百种前端——均可连接 hermes-智能体 并将其用作后端。

您的智能体使用其完整工具集（终端、文件操作、网络搜索、记忆、技能）处理请求，并返回最终响应。在流式传输时，工具进度指示器会内联显示，以便前端展示智能体正在执行的操作。

## 快速开始

### 1. 启用 API 服务器

添加到 `~/.hermes/.env`：

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=change-me-local-dev
# 可选：仅当浏览器必须直接调用 Hermes 时设置
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

将任意兼容 OpenAI 的客户端指向 `http://localhost:8642/v1`：

```bash
# 使用 curl 测试
curl http://localhost:8642/v1/chat/completions \
  -H "Authorization: Bearer change-me-local-dev" \
  -H "Content-Type: application/json" \
  -d '{"model": "hermes-agent", "messages": [{"role": "user", "content": "Hello!"}]}'
```

或者连接 Open WebUI、LobeChat 或其他任意前端——请参阅 [Open WebUI 集成指南](/docs/user-guide/messaging/open-webui) 获取分步说明。

## 端点

### POST /v1/chat/completions

标准 OpenAI 聊天补全格式。无状态——每次请求通过 `messages` 数组包含完整对话。

**请求：**
```json
{
  "model": "hermes-agent",
  "messages": [
    {"role": "system", "content": "You are a Python expert."},
    {"role": "user", "content": "Write a fibonacci function"}
  ],
  "stream": false
}
```

**响应：**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1710000000,
  "model": "hermes-agent",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "Here's a fibonacci function..."},
    "finish_reason": "stop"
  }],
  "usage": {"prompt_tokens": 50, "completion_tokens": 200, "total_tokens": 250}
}
```

**内联图像输入：** 用户消息可将 `content` 作为 `text` 和 `image_url` 部分的数组发送。支持远程 `http(s)` URL 和 `data:image/...` URL：

```json
{
  "model": "hermes-agent",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "What is in this image?"},
        {"type": "image_url", "image_url": {"url": "https://example.com/cat.png", "detail": "high"}}
      ]
    }
  ]
}
```

上传的文件（`file` / `input_file` / `file_id`）和非图像 `data:` URL 返回 `400 unsupported_content_type`。

**流式传输**（`"stream": true`）：返回服务器推送事件（SSE），包含逐令牌的响应块。对于 **聊天补全**，流使用标准的 `chat.completion.chunk` 事件，以及 Hermes 自定义的 `hermes.tool.progress` 事件以显示工具启动状态。对于 **响应**，流使用 OpenAI Responses 事件类型，例如 `response.created`、`response.output_text.delta`、`response.output_item.added`、`response.output_item.done` 和 `response.completed`。

**流中的工具进度：**
- **聊天补全**：Hermes 在工具启动时发出 `event: hermes.tool.progress` 事件，以便在不污染持久化助手文本的情况下显示工具启动状态。
- **响应**：Hermes 在 SSE 流期间发出规范原生的 `function_call` 和 `function_call_output` 输出项，因此客户端可以实时渲染结构化的工具 UI。

### POST /v1/responses

OpenAI Responses API 格式。通过 `previous_response_id` 支持服务端对话状态——服务器存储完整的对话历史（包括工具调用和结果），因此无需客户端管理即可保留多轮上下文。

**请求：**
```json
{
  "model": "hermes-agent",
  "input": "What files are in my project?",
  "instructions": "You are a helpful coding assistant.",
  "store": true
}
```

**响应：**
```json
{
  "id": "resp_abc123",
  "object": "response",
  "status": "completed",
  "model": "hermes-agent",
  "output": [
    {"type": "function_call", "name": "terminal", "arguments": "{\"command\": \"ls\"}", "call_id": "call_1"},
    {"type": "function_call_output", "call_id": "call_1", "output": "README.md src/ tests/"},
    {"type": "message", "role": "assistant", "content": [{"type": "output_text", "text": "Your project has..."}]}
  ],
  "usage": {"input_tokens": 50, "output_tokens": 200, "total_tokens": 250}
}
```

**内联图像输入：** `input[].content` 可包含 `input_text` 和 `input_image` 部分。支持远程 URL 和 `data:image/...` URL：

```json
{
  "model": "hermes-agent",
  "input": [
    {
      "role": "user",
      "content": [
        {"type": "input_text", "text": "Describe this screenshot."},
        {"type": "input_image", "image_url": "data:image/png;base64,iVBORw0K..."}
      ]
    }
  ]
}
```

上传的文件（`input_file` / `file_id`）和非图像 `data:` URL 返回 `400 unsupported_content_type`。

#### 使用 previous_response_id 实现多轮对话

链式响应以在轮次间保持完整上下文（包括工具调用）：

```json
{
  "input": "Now show me the README",
  "previous_response_id": "resp_abc123"
}
```

服务器从存储的响应链重建完整对话——所有先前的工具调用和结果均被保留。链式请求还共享同一会话，因此多轮对话在仪表板和会话历史中显示为单个条目。

#### 命名对话

使用 `conversation` 参数而非跟踪响应 ID：

```json
{"input": "Hello", "conversation": "my-project"}
{"input": "What's in src/?", "conversation": "my-project"}
{"input": "Run the tests", "conversation": "my-project"}
```

服务器自动链接到该对话中的最新响应。类似于网关会话的 `/title` 命令。

### GET /v1/responses/\{id\}

通过 ID 检索先前存储的响应。

### DELETE /v1/responses/\{id\}

删除存储的响应。

### GET /v1/models

将智能体列为可用模型。公布的模型名称默认为 [配置文件](/docs/user-guide/profiles) 名称（或默认配置文件的 `hermes-agent`）。大多数前端需要此端点以发现模型。

### GET /health

健康检查。返回 `{"status": "ok"}`。对于期望 `/v1/` 前缀的兼容 OpenAI 的客户端，也可通过 **GET /v1/health** 访问。

### GET /health/detailed

扩展健康检查，还报告活跃会话、运行中的智能体和资源使用情况。适用于监控/可观测性工具。

## Runs API（流式友好的替代方案）

除了 `/v1/chat/completions` 和 `/v1/responses`，服务器还暴露 **runs** API，适用于长时会话，客户端可订阅进度事件，而无需自行管理流式传输。

### POST /v1/runs

创建新的智能体运行。返回可用于订阅进度事件的 `run_id`。

### GET /v1/runs/\{run_id\}/events

该运行的服务器推送事件流，包含工具调用进度、令牌增量和生命周期事件。专为仪表板和希望在不丢失状态的情况下附加/分离的厚客户端设计。

## Jobs API（后台定时任务）

服务器暴露轻量级 jobs CRUD 接口，用于从远程客户端管理定时/后台智能体运行。所有端点均受同一 Bearer 认证保护。

### GET /api/jobs

列出所有定时任务。

### POST /api/jobs

创建新的定时任务。请求体接受与 `hermes cron` 相同的结构——提示词、调度、技能、提供程序覆盖、交付目标。

### GET /api/jobs/\{job_id\}

获取单个任务的定义和上次运行状态。

### PATCH /api/jobs/\{job_id\}

更新现有任务的字段（提示词、调度等）。部分更新将被合并。

### DELETE /api/jobs/\{job_id\}

删除任务。同时取消任何正在进行的运行。

### POST /api/jobs/\{job_id\}/pause

暂停任务而不删除它。下次计划运行的时间戳将被挂起，直到恢复。

### POST /api/jobs/\{job_id\}/resume

恢复先前暂停的任务。

### POST /api/jobs/\{job_id\}/run

立即触发任务运行，不受调度限制。

## 系统提示处理

当前端发送 `system` 消息（聊天补全）或 `instructions` 字段（Responses API）时，hermes-智能体 **将其叠加** 在其核心系统提示之上。您的智能体保留所有工具、记忆和技能——前端的系统提示仅添加额外指令。

这意味着您可以针对每个前端自定义行为，而不会丢失能力：
- Open WebUI 系统提示：“你是一位 Python 专家。始终包含类型提示。”
- 智能体仍拥有终端、文件工具、网络搜索、记忆等。

## 认证

通过 `Authorization` 头进行 Bearer 令牌认证：

```
Authorization: Bearer ***
```

通过 `API_SERVER_KEY` 环境变量配置密钥。如果浏览器需要直接调用 Hermes，还需将 `API_SERVER_CORS_ORIGINS` 设置为明确的允许列表。

:::warning 安全
API 服务器提供对 hermes-智能体 工具集的完全访问权限，**包括终端命令**。当绑定到非环回地址（如 `0.0.0.0`）时，**必须设置 `API_SERVER_KEY`**。同时请将 `API_SERVER_CORS_ORIGINS` 范围保持狭窄，以控制浏览器访问。

默认绑定地址（`127.0.0.1`）仅用于本地使用。默认情况下禁用浏览器访问；仅在明确信任的来源时启用。
:::

## 配置

### 环境变量

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `API_SERVER_ENABLED` | `false` | 启用 API 服务器 |
| `API_SERVER_PORT` | `8642` | HTTP 服务器端口 |
| `API_SERVER_HOST` | `127.0.0.1` | 绑定地址（默认仅限本地） |
| `API_SERVER_KEY` | _(无)_ | 用于认证的 Bearer 令牌 |
| `API_SERVER_CORS_ORIGINS` | _(无)_ | 逗号分隔的允许浏览器来源 |
| `API_SERVER_MODEL_NAME` | _(配置文件名称)_ | `/v1/models` 上的模型名称。默认为配置文件名称，或默认配置文件的 `hermes-agent`。 |

### config.yaml

```yaml
# 尚未支持 — 请使用环境变量。
# config.yaml 支持将在未来版本中提供。
```

## 安全头

所有响应均包含安全头：
- `X-Content-Type-Options: nosniff` — 防止 MIME 类型嗅探
- `Referrer-Policy: no-referrer` — 防止引荐来源泄露

## CORS

API 服务器默认**不启用**浏览器 CORS。

如需直接浏览器访问，请设置明确的允许列表：

```bash
API_SERVER_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

启用 CORS 时：
- **预检响应** 包含 `Access-Control-Max-Age: 600`（10 分钟缓存）
- **SSE 流式响应** 包含 CORS 头，以便浏览器 EventSource 客户端正常工作
- **`Idempotency-Key`** 是允许的请求头 — 客户端可发送它以进行去重（响应按键缓存 5 分钟）

大多数文档化的前端（如 Open WebUI）采用服务端到服务端连接，完全不需要 CORS。

## 兼容前端

任何支持 OpenAI API 格式的前端均可使用。已测试/文档化的集成：

| 前端 | Stars | 连接方式 |
|----------|-------|------------|
| [Open WebUI](/docs/user-guide/messaging/open-webui) | 126k | 完整指南可用 |
| LobeChat | 73k | 自定义提供程序端点 |
| LibreChat | 34k | librechat.yaml 中的自定义端点 |
| AnythingLLM | 56k | 通用 OpenAI 提供程序 |
| NextChat | 87k | BASE_URL 环境变量 |
| ChatBox | 39k | API 主机设置 |
| Jan | 26k | 远程模型配置 |
| HF Chat-UI | 8k | OPENAI_BASE_URL |
| big-AGI | 7k | 自定义端点 |
| OpenAI Python SDK | — | `OpenAI(base_url="http://localhost:8642/v1")` |
| curl | — | 直接 HTTP 请求 |

## 使用配置文件的多用户设置

要为多个用户提供各自隔离的 Hermes 实例（独立配置、记忆、技能），请使用 [配置文件](/docs/user-guide/profiles)：

```bash
# 为每个用户创建配置文件
hermes profile create alice
hermes profile create bob

# 为每个配置文件在不同端口配置 API 服务器
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

每个配置文件的 API 服务器自动将配置文件名称作为模型 ID 公布：

- `http://localhost:8643/v1/models` → 模型 `alice`
- `http://localhost:8644/v1/models` → 模型 `bob`

在 Open WebUI 中，将每个实例添加为单独连接。模型下拉菜单将显示 `alice` 和 `bob` 作为不同的模型，每个均由完全隔离的 Hermes 实例支持。详见 [Open WebUI 指南](/docs/user-guide/messaging/open-webui#multi-user-setup-with-profiles)。

## 限制

- **响应存储** — 存储的响应（用于 `previous_response_id`）持久化在 SQLite 中，并在网关重启后保留。最多存储 100 个响应（LRU 淘汰）。
- **不支持文件上传** — `/v1/chat/completions` 和 `/v1/responses` 均支持内联图像，但通过 API 不支持上传文件（`file`、`input_file`、`file_id`）和非图像文档输入。
- **model 字段仅为装饰性** — 请求中的 `model` 字段被接受，但实际使用的 LLM 模型在服务端的 config.yaml 中配置。

## 代理模式

API 服务器还作为 **网关代理模式** 的后端。当另一个 Hermes 网关实例配置为 `GATEWAY_PROXY_URL` 指向此 API 服务器时，它会将所有消息转发至此，而非运行自己的智能体。这支持拆分部署 — 例如，处理 Matrix E2EE 的 Docker 容器将消息中继到主机端的智能体。

详见 [Matrix 代理模式](/docs/user-guide/messaging/matrix#proxy-mode-e2ee-on-macos) 获取完整设置指南。