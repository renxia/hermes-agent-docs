---
sidebar_position: 14
title: "API Server"
description: "将 hermes-agent 作为 OpenAI 兼容 API 暴露，供任意前端使用"
---

# API Server

API server 将 hermes-agent 公开为 OpenAI 兼容的 HTTP 端点。任何支持 OpenAI 格式的前端（如 Open WebUI、LobeChat、LibreChat、NextChat、ChatBox 等数百种）都可以连接到 hermes-agent 并将其用作后端。

您的代理会使用其全部工具集（终端、文件操作、网络搜索、记忆、技能等）处理请求并返回最终响应。在流式传输时，工具进度指示器会内联显示，使前端能够实时展示代理正在执行的操作。

## 快速开始

### 1. 启用 API server

在 `~/.hermes/.env` 中添加以下内容：

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=change-me-local-dev
# 可选：仅当浏览器需要直接调用 Hermes 时才设置
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

将任何 OpenAI 兼容客户端指向 `http://localhost:8642/v1`：

```bash
# 使用 curl 测试
curl http://localhost:8642/v1/chat/completions \
  -H "Authorization: Bearer change-me-local-dev" \
  -H "Content-Type: application/json" \
  -d '{"model": "hermes-agent", "messages": [{"role": "user", "content": "Hello!"}]}'
```

或者连接 Open WebUI、LobeChat 或其他任何前端——有关分步说明，请参见 [Open WebUI 集成指南](/docs/user-guide/messaging/open-webui)。

## 端点

### POST /v1/chat/completions

标准的 OpenAI Chat Completions 格式。无状态——完整的对话内容通过 `messages` 数组包含在每个请求中。

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

**流式传输** (`"stream": true`)：返回按 token 分割的 Server-Sent Events (SSE)。对于 **Chat Completions**，流使用标准的 `chat.completion.chunk` 事件以及 Hermes 的自定义 `hermes.tool.progress` 事件来展示工具启动的用户体验。对于 **Responses**，流使用 OpenAI Responses 事件类型，例如 `response.created`、`response.output_text.delta`、`response.output_item.added`、`response.output_item.done` 和 `response.completed`。

**流中的工具进度：**
- **Chat Completions**：Hermes 发出 `event: hermes.tool.progress` 事件以在不污染持久化助手文本的情况下实现工具启动的可视化。
- **Responses**：Hermes 在 SSE 流期间发出规范原生的 `function_call` 和 `function_call_output` 输出项，因此客户端可以实时渲染结构化的工具 UI。

### POST /v1/responses

OpenAI Responses API 格式。支持通过 `previous_response_id` 在服务器端维护对话状态——服务器存储完整的对话历史记录（包括工具调用和结果），因此无需客户端管理即可保留多轮上下文。

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

#### 使用 previous_response_id 的多轮对话

将响应链接起来以在整个过程中保持完整上下文（包括工具调用）：

```json
{
  "input": "Now show me the README",
  "previous_response_id": "resp_abc123"
}
```

服务器会从存储的响应链重建完整的对话——所有之前的工具调用和结果都会被保留。链式请求还共享同一个会话，因此多轮对话在仪表板和会话历史记录中显示为单个条目。

#### 命名对话

使用 `conversation` 参数而不是跟踪响应 ID：

```json
{"input": "Hello", "conversation": "my-project"}
{"input": "What's in src/?", "conversation": "my-project"}
{"input": "Run the tests", "conversation": "my-project"}
```

服务器会自动链接到该对话中最新的响应。类似于网关会话的 `/title` 命令。

### GET /v1/responses/\{id\}

通过 ID 检索之前存储的响应。

### DELETE /v1/responses/\{id\}

删除一个存储的响应。

### GET /v1/models

列出可用的代理模型。广告模型名称默认为 [profile](/docs/user-guide/profiles) 名称（或默认配置文件的 `hermes-agent`）。大多数前端都需要此功能进行模型发现。

### GET /health

健康检查。返回 `{"status": "ok"}`。对于期望 `/v1/` 前缀的 OpenAI 兼容客户端，也可通过 **GET /v1/health** 访问。

### GET /health/detailed

扩展健康检查，还会报告活动会话、运行中的代理和资源使用情况。适用于监控/可观测性工具。

## Runs API（流式传输友好替代方案）

除了 `/v1/chat/completions` 和 `/v1/responses` 之外，服务器还提供 **runs** API，用于长时对话场景，其中客户端希望订阅进度事件而不是自行管理流式传输。

### POST /v1/runs

创建一个新的代理运行。返回一个可用于订阅进度事件的 `run_id`。

### GET /v1/runs/\{run_id\}/events

运行的工具调用进度、token 增量以及生命周期事件的 Server-Sent Events 流。专为仪表板和厚客户端设计，可在不丢失状态的情况下附加/分离。

## Jobs API（后台计划任务）

服务器提供一个轻量级的 jobs CRUD 接口，用于从远程客户端管理计划的/后台代理运行。所有端点都受相同的 bearer 身份验证保护。

### GET /api/jobs

列出所有计划的任务。

### POST /api/jobs

创建一个新的计划任务。请求体接受与 `hermes cron` 相同的格式——提示词、计划、技能、提供程序覆盖和交付目标。

### GET /api/jobs/\{job_id\}

获取单个任务的定义和上次运行状态。

### PATCH /api/jobs/\{job_id\}

更新现有任务的部分字段（提示词、计划等）。支持部分更新合并。

### DELETE /api/jobs/\{job_id\}

删除任务。同时取消任何正在进行的运行。

### POST /api/jobs/\{job_id\}/pause

暂停任务而不删除它。下次计划运行的时间戳会被挂起，直到恢复为止。

### POST /api/jobs/\{job_id\}/resume

恢复之前暂停的任务。

### POST /api/jobs/\{job_id\}/run

立即触发任务运行，不受计划限制。

## 系统提示词处理

当前端发送 `system` 消息（Chat Completions）或 `instructions` 字段（Responses API）时，hermes-agent **将其叠加在其核心系统提示词之上**。您的代理仍保留所有工具、记忆和技能——前端的系统提示词会添加额外的指令。

这意味着您可以针对特定前端自定义行为而不会失去能力：
- Open WebUI 系统提示词："You are a Python expert. Always include type hints."
- 代理仍然拥有终端、文件工具、网络搜索、记忆等功能。

## 身份验证

通过 `Authorization` 头使用 Bearer token 认证：

```
Authorization: Bearer ***
```

通过 `API_SERVER_KEY` 环境变量配置密钥。如果您需要浏览器直接调用 Hermes，还需设置 `API_SERVER_CORS_ORIGINS` 为明确的允许列表。

:::warning 安全警告
API server 对 hermes-agent 的全部工具集拥有完全访问权限，**包括终端命令**。当绑定到非环回地址（如 `0.0.0.0`）时，`API_SERVER_KEY` **必须设置**。同时应将 `API_SERVER_CORS_ORIGINS` 设置为窄范围，以控制浏览器访问。

默认绑定地址（`127.0.0.1`）仅限本地使用。浏览器访问默认禁用；仅在明确信任的来源时才启用。
:::

## 配置

### 环境变量

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `API_SERVER_ENABLED` | `false` | 启用 API server |
| `API_SERVER_PORT` | `8642` | HTTP 服务器端口 |
| `API_SERVER_HOST` | `127.0.0.1` | 绑定地址（默认仅限 localhost） |
| `API_SERVER_KEY` | _(none)_ | Bearer token 认证密钥 |
| `API_SERVER_CORS_ORIGINS` | _(none)_ | 逗号分隔的允许浏览器来源 |
| `API_SERVER_MODEL_NAME` | _(profile name)_ | `/v1/models` 上的模型名称。默认为 profile 名称，或默认配置文件的 `hermes-agent` |

### config.yaml

```yaml
# 暂不支持 — 请使用环境变量。
# config.yaml 支持将在未来版本中提供。
```

## 安全头部

所有响应都包含安全头部：
- `X-Content-Type-Options: nosniff` — 防止 MIME 类型嗅探
- `Referrer-Policy: no-referrer` — 防止 referrer 泄露

## CORS

API server **默认不启用**浏览器 CORS。

如需直接浏览器访问，请设置明确的允许列表：

```bash
API_SERVER_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

当启用 CORS 时：
- **预检响应** 包含 `Access-Control-Max-Age: 600`（10 分钟缓存）
- **SSE 流式响应** 包含 CORS 头部，以确保浏览器 EventSource 客户端正常工作
- **`Idempotency-Key`** 是允许的请求头部——客户端可以发送它以实现去重（响应会根据 key 缓存 5 分钟）

大多数文档记载的前端（如 Open WebUI）都是服务器到服务器的连接，完全不需要 CORS。

## 兼容前端

任何支持 OpenAI API 格式的前端都适用。已测试/文档化的集成：

| 前端 | Stars | 连接方式 |
|----------|-------|------------|
| [Open WebUI](/docs/user-guide/messaging/open-webui) | 126k | 完整指南可用 |
| LobeChat | 73k | 自定义提供程序端点 |
| LibreChat | 34k | librechat.yaml 中的自定义端点 |
| AnythingLLM | 56k | 通用 OpenAI 提供程序 |
| NextChat | 87k | BASE_URL 环境变量 |
| ChatBox | 39k | API Host 设置 |
| Jan | 26k | 远程模型配置 |
| HF Chat-UI | 8k | OPENAI_BASE_URL |
| big-AGI | 7k | 自定义端点 |
| OpenAI Python SDK | — | `OpenAI(base_url="http://localhost:8642/v1")` |
| curl | — | 直接 HTTP 请求 |

## 使用配置文件的 Multi-User 设置

要为多个用户提供各自独立的 Hermes 实例（独立配置、记忆、技能），请使用 [profiles](/docs/user-guide/profiles)：

```bash
# 为每个用户创建配置文件
hermes profile create alice
hermes profile create bob

# 为每个配置文件配置不同的 API server 端口
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

每个配置文件的 API server 会自动将配置文件名称作为模型 ID 发布：

- `http://localhost:8643/v1/models` → 模型 `alice`
- `http://localhost:8644/v1/models` → 模型 `bob`

在 Open WebUI 中，将它们添加为单独的连接。模型下拉菜单会显示 `alice` 和 `bob` 作为不同的模型，每个都由完全隔离的 Hermes 实例支持。有关详细信息，请参见 [Open WebUI 指南](/docs/user-guide/messaging/open-webui#multi-user-setup-with-profiles)。

## 限制

- **响应存储** —— 存储的响应（用于 `previous_response_id`）会持久化到 SQLite 并在网关重启后保留。最多存储 100 个响应（LRU 淘汰）。
- **不支持文件上传** —— 目前 API 还不支持通过上传文件进行视觉/文档分析。
- **Model 字段为装饰性** —— 请求中的 `model` 字段被接受，但实际使用的 LLM 模型是在 config.yaml 中服务器端配置的。

## Proxy Mode

API server 同时也是 **gateway proxy mode** 的后端。当另一个 Hermes gateway 实例配置了指向此 API server 的 `GATEWAY_PROXY_URL` 时，它会将所有消息转发到这里而不是自己运行代理。这实现了拆分部署——例如，一个处理 Matrix E2EE 的 Docker 容器可以中继到主机侧的代理。

完整设置指南请参见 [Matrix Proxy Mode](/docs/user-guide/messaging/matrix#proxy-mode-e2ee-on-macos)。