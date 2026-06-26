---
sidebar_position: 14
title: "API Server"
description: "Expose hermes-agent as an OpenAI-compatible API for any frontend"
---

# API Server

API 服务器将 hermes-agent 暴露为 OpenAI 兼容的 HTTP 端点。任何支持 OpenAI 格式的前端——Open WebUI、LobeChat、LibreChat、NextChat、ChatBox 及数百种其他前端——都可以连接到 hermes-agent 并将其用作后端。

你的智能体会使用其完整工具集（终端、文件操作、网络搜索、记忆、技能）处理请求，并返回最终响应。启用流式传输时，工具进度指示器会以内联方式显示，以便前端可以展示智能体正在执行的操作。

:::tip 一个后端同时覆盖模型 + 工具
Hermes 本身需要配置好的提供商和工具后端，API 服务器才能发挥作用。[Nous Portal](/user-guide/features/tool-gateway) 订阅可以同时满足这两项需求——300 多种模型，以及通过 Tool Gateway 提供的 Web/图片/TTS/浏览器功能。在启动 API 服务器之前运行一次 `hermes setup --portal`，Open WebUI 或 LobeChat 等前端即可获得一个配备完整工具的后端。
:::

## 快速开始

### 1. 启用 API 服务器

添加到 `~/.hermes/.env`：

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=change-me-local-dev
# 可选：仅当浏览器需要直接调用 Hermes 时
# API_SERVER_CORS_ORIGINS=http://localhost:3000
```

### 2. 启动网关

```bash
hermes gateway
```

你会看到：

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

或者连接 Open WebUI、LobeChat 或任何其他前端——请参阅 [Open WebUI 集成指南](/user-guide/messaging/open-webui) 获取分步说明。

## 端点

### POST /v1/chat/completions

标准 OpenAI Chat Completions 格式。无状态——完整对话通过 `messages` 数组包含在每个请求中。

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

**内联图片输入：** 用户消息可以将 `content` 作为 `text` 和 `image_url` 部分的数组发送。支持远程 `http(s)` URL 和 `data:image/...` URL：

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

上传的文件（`file` / `input_file` / `file_id`）和非图片 `data:` URL 将返回 `400 unsupported_content_type`。

**流式传输**（`"stream": true`）：返回服务器发送事件（SSE），以逐令牌的方式返回响应块。对于 **Chat Completions**，流使用标准的 `chat.completion.chunk` 事件以及 Hermes 自定义的 `hermes.tool.progress` 事件以提供工具启动的用户体验。对于 **Responses**，流使用 OpenAI Responses 事件类型，如 `response.created`、`response.output_text.delta`、`response.output_item.added`、`response.output_item.done` 和 `response.completed`。

**流中的工具进度**：
- **Chat Completions**：Hermes 发出 `event: hermes.tool.progress` 事件以显示工具启动状态，同时不会污染持久化的助手文本。
- **Responses**：Hermes 在 SSE 流期间发出符合规范的 `function_call` 和 `function_call_output` 输出项，使客户端可以实时渲染结构化的工具 UI。

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

**内联图片输入：** `input[].content` 可以包含 `input_text` 和 `input_image` 部分。支持远程 URL 和 `data:image/...` URL：

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

上传的文件（`input_file` / `file_id`）和非图片 `data:` URL 将返回 `400 unsupported_content_type`。

#### 使用 previous_response_id 进行多轮对话

链接响应以在多个回合之间保持完整上下文（包括工具调用）：

```json
{
  "input": "Now show me the README",
  "previous_response_id": "resp_abc123"
}
```

服务器从存储的响应链重建完整对话——所有先前的工具调用和结果都会被保留。链式请求还共享同一会话，因此多轮对话在仪表板和会话历史中显示为单个条目。

#### 命名对话

使用 `conversation` 参数代替跟踪响应 ID：

```json
{"input": "Hello", "conversation": "my-project"}
{"input": "What's in src/?", "conversation": "my-project"}
{"input": "Run the tests", "conversation": "my-project"}
```

服务器自动链接到该对话中的最新响应。类似于网关会话的 `/title` 命令。

### GET /v1/responses/\{id\}

通过 ID 检索先前存储的响应。

### DELETE /v1/responses/\{id\}

删除已存储的响应。

### GET /v1/models

将智能体列为可用模型。广告中的模型名称默认为[配置文件](/user-guide/profiles)名称（或默认配置文件的 `hermes-agent`）。大多数前端需要此端点来进行模型发现。

### GET /v1/capabilities

返回 API 服务器稳定界面的机器可读描述，供外部 UI、编排器和插件桥接使用。

```json
{
  "object": "hermes.api_server.capabilities",
  "platform": "hermes-agent",
  "model": "hermes-agent",
  "auth": {"type": "bearer", "required": true},
  "features": {
    "chat_completions": true,
    "responses_api": true,
    "run_submission": true,
    "run_status": true,
    "run_events_sse": true,
    "run_stop": true
  }
}
```

在集成仪表板、浏览器 UI 或控制平面时使用此端点，以便它们可以检测正在运行的 Hermes 版本是否支持运行、流式传输、取消和会话连续性，而无需依赖私有的 Python 内部实现。

### GET /health

健康检查。返回 `{"status": "ok"}`。也可以在 **GET /v1/health** 获取，以兼容期望 `/v1/` 前缀的 OpenAI 客户端。

### GET /health/detailed

扩展健康检查，同时报告活动会话、运行中的智能体以及资源使用情况。适用于监控/可观测性工具。

## Runs API（流式传输友好的替代方案）

除了 `/v1/chat/completions` 和 `/v1/responses` 之外，服务器还公开了 **runs** API，适用于客户端希望订阅进度事件而非自行管理流式传输的长时会话。

### POST /v1/runs

创建新的智能体运行。返回可用于订阅进度事件的 `run_id`。

```json
{
  "run_id": "run_abc123",
  "status": "started"
}
```

运行接受简单的 `input` 字符串和可选的 `session_id`、`instructions`、`conversation_history` 或 `previous_response_id`。提供 `session_id` 时，Hermes 会在运行状态中显示它，以便外部 UI 可以将运行与其自己的对话 ID 关联起来。

### GET /v1/runs/\{run_id\}

轮询当前运行状态。适用于需要获取状态但无需保持 SSE 连接的仪表板，或在导航后重新连接的 UI。

```json
{
  "object": "hermes.run",
  "run_id": "run_abc123",
  "status": "completed",
  "session_id": "space-session",
  "model": "hermes-agent",
  "output": "Done.",
  "usage": {"input_tokens": 50, "output_tokens": 200, "total_tokens": 250}
}
```

在终态（`completed`、`failed` 或 `cancelled`）之后，状态会短暂保留，以便进行轮询和 UI 协调。

### GET /v1/runs/\{run_id\}/events

运行的工具调用进度、令牌增量和生命周期事件的服务器发送事件流。适用于希望附加/分离而不丢失状态的仪表板和厚客户端。

### POST /v1/runs/\{run_id\}/stop

中断正在运行的智能体回合。端点立即返回 `{"status": "stopping"}`，同时 Hermes 请求活动智能体在下一个安全中断点停止。

### POST /v1/runs/\{run_id\}/approval

解决等待人工审批的运行的待处理审批（例如，被审批策略限制的工具调用）。请求体携带审批决策；一旦记录决策，运行即恢复。此端点在 `/v1/capabilities` 中作为 `run_approval` 功能广告，以便外部 UI 可以在显示审批提示之前检测支持情况。

## Jobs API（后台调度工作）

服务器公开了一个轻量级的 Jobs CRUD 接口，用于从远程客户端管理调度的/后台智能体运行。所有端点都受相同的 bearer 认证保护。

### GET /api/jobs

列出所有调度的作业。

### POST /api/jobs

创建新的调度作业。请求体接受与 `hermes cron` 相同的形状——提示词、调度、技能、提供商覆盖、交付目标。

### GET /api/jobs/\{job_id\}

获取单个作业的定义和上次运行状态。

### PATCH /api/jobs/\{job_id\}

更新现有作业的字段（提示词、调度等）。部分更新会被合并。

### DELETE /api/jobs/\{job_id\}

删除作业。同时取消任何正在运行的执行。

### POST /api/jobs/\{job_id\}/pause

暂停作业而不删除它。下次调度运行的时间戳将被暂停，直到恢复。

### POST /api/jobs/\{job_id\}/resume

恢复先前暂停的作业。

### POST /api/jobs/\{job_id\}/run

立即触发作业运行，不按调度计划。

## Sessions API（通过 REST 控制会话）

外部 UI 可以通过 REST 管理 Hermes 会话，而无需启动仪表板。所有端点都受 `API_SERVER_KEY` 保护，位于 `/api/sessions/*` 下。

| 方法 | 路径 | 描述 |
|--------|------|-------------|
| `GET` | `/api/sessions` | 列出会话（分页——`limit`、`offset`、`source`、`include_children`） |
| `POST` | `/api/sessions` | 创建空会话 |
| `GET` | `/api/sessions/{id}` | 读取会话元数据 |
| `PATCH` | `/api/sessions/{id}` | 更新标题或 `end_reason` |
| `DELETE` | `/api/sessions/{id}` | 删除会话 |
| `GET` | `/api/sessions/{id}/messages` | 会话的消息历史 |
| `POST` | `/api/sessions/{id}/fork` | 通过 `SessionDB` 谱系分支会话（匹配 CLI `/branch` 语义） |
| `POST` | `/api/sessions/{id}/chat` | 运行单个同步智能体回合 |
| `POST` | `/api/sessions/{id}/chat/stream` | 单回合的 SSE 包装器——发出 `assistant.delta`、`tool.started`、`tool.completed`、`run.completed` 事件 |

`/v1/capabilities` 通过 `session_*` 功能标志和 `endpoints.session_*` 条目广告完整接口，以便外部 UI 可以检测支持情况并安全回退。`chat` 和 `chat/stream` 负载中支持内联图片（多模态感知路径）。

```bash
# fork a session and run one turn
curl -X POST http://localhost:8642/api/sessions/$ID/fork \
  -H "Authorization: Bearer $API_SERVER_KEY" \
  -d '{"title": "explore alt path"}'

# stream a turn over SSE
curl -N -X POST http://localhost:8642/api/sessions/$ID/chat/stream \
  -H "Authorization: Bearer $API_SERVER_KEY" \
  -d '{"input": "what files changed in the last hour?"}'
```

## 技能与工具集发现

`GET /v1/skills` 和 `GET /v1/toolsets` 允许外部客户端通过 REST 接口确定性地枚举智能体的能力，而非询问模型。两者均为只读接口，并通过 `API_SERVER_KEY` 进行访问控制。

```bash
curl http://localhost:8642/v1/skills \
  -H "Authorization: Bearer $API_SERVER_KEY"
# → [{"name": "github-pr-workflow", "description": "...", "category": "..."}, ...]

curl http://localhost:8642/v1/toolsets \
  -H "Authorization: Bearer $API_SERVER_KEY"
# → [{"name": "core", "label": "...", "description": "...", "enabled": true,
#     "configured": true, "tools": ["read_file", "write_file", ...]}, ...]
```

`/v1/skills` 返回技能中心内部使用的相同元数据。`/v1/toolsets` 返回针对 `api_server` 平台解析后的工具集，以及每个工具集展开后的具体 `tools` 列表。两者均在 `/v1/capabilities` 的 `endpoints.*` 下进行公告。

## 长期记忆作用域（`X-Hermes-Session-Key`）

像 Open WebUI 这样的多用户前端需要一个稳定的、按渠道标识的长期记忆标识符（如 Honcho 等），该标识符必须**独立于**基于会话转录的 `X-Hermes-Session-Id`（该 ID 在 `/new` 时会轮换）。在 `/v1/chat/completions`、`/v1/responses` 或 `/v1/runs` 上传递 `X-Hermes-Session-Key`，Hermes 会将其透传至 `AIAgent(gateway_session_key=...)`，Honcho 的记忆提供者据此推导出稳定的作用域。

```http
POST /v1/chat/completions HTTP/1.1
Authorization: Bearer ***
X-Hermes-Session-Id: transcript-alpha
X-Hermes-Session-Key: agent:main:webui:dm:user-42
```

规则：最多 256 个字符，控制字符（`\r`、`\n`、`\x00`）会被拒绝，该值会在响应中（JSON + SSE）回显。`/v1/capabilities` 通过 `"session_key_header": "X-Hermes-Session-Key"` 公告支持情况。若无此密钥，Honcho 的 `per-session` 策略会为每个 `session_id` 生成不同的作用域——这正是 Hermes 之前的行为。

## 系统提示处理

当前端发送 `system` 消息（Chat Completions）或 `instructions` 字段（Responses API）时，hermes-agent 会**将其叠加**在核心系统提示之上。你的智能体保留其所有工具、记忆和技能——前端的系统提示只是追加额外的指令。

这意味着你可以按前端自定义行为而不丢失能力：
- Open WebUI 系统提示："你是一位 Python 专家。始终包含类型提示。"
- 智能体仍然拥有终端、文件工具、网络搜索、记忆等。

## 认证

通过 `Authorization` 头的 Bearer 令牌认证：

```
Authorization: Bearer ***
```

通过 `API_SERVER_KEY` 环境变量配置密钥。如果需要浏览器直接调用 Hermes，还需将 `API_SERVER_CORS_ORIGINS` 设置为显式允许列表。

:::warning 安全
API 服务器提供对 hermes-agent 工具集的**完整访问权限**，**包括终端命令**。`API_SERVER_KEY` 在**所有部署中都是必需的**，包括默认绑定在 `127.0.0.1` 的回环地址。请严格限制 `API_SERVER_CORS_ORIGINS` 以控制浏览器访问，仅在明确允许浏览器调用者时开放。
:::

## 配置

### 环境变量

| 变量 | 默认值 | 说明 |
|----------|---------|-------------|
| `API_SERVER_ENABLED` | `false` | 启用 API 服务器 |
| `API_SERVER_PORT` | `8642` | HTTP 服务器端口 |
| `API_SERVER_HOST` | `127.0.0.1` | 绑定地址（默认仅限本地） |
| `API_SERVER_KEY` | _(必填)_ | 认证用 Bearer 令牌 |
| `API_SERVER_CORS_ORIGINS` | _(无)_ | 逗号分隔的允许浏览器来源 |
| `API_SERVER_MODEL_NAME` | _(配置文件名)_ | `/v1/models` 上的模型名称。默认为配置文件名，或默认配置文件的 `hermes-agent`。 |

### config.yaml

```yaml
# 尚不支持 — 请使用环境变量。
# config.yaml 支持将在未来版本中提供。
```

## 安全头

所有响应均包含安全头：
- `X-Content-Type-Options: nosniff` — 防止 MIME 类型嗅探
- `Referrer-Policy: no-referrer` — 防止来源泄露

## CORS

API 服务器默认**不启用**浏览器 CORS。

如需直接浏览器访问，请设置显式允许列表：

```bash
API_SERVER_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

启用 CORS 后：
- **预检响应**包含 `Access-Control-Max-Age: 600`（10 分钟缓存）
- **SSE 流式响应**包含 CORS 头，确保浏览器 EventSource 客户端正常工作
- **`Idempotency-Key`** 是允许的请求头——客户端可发送该头以实现去重（响应按密钥缓存 5 分钟）

大多数已记录的前端（如 Open WebUI）以服务器到服务器方式连接，完全不需要 CORS。

## 兼容前端

任何支持 OpenAI API 格式的前端均可使用。已测试/记录的集成：

| 前端 | Stars | 连接方式 |
|----------|-------|------------|
| [Open WebUI](/user-guide/messaging/open-webui) | 126k | 提供完整指南 |
| LobeChat | 73k | 自定义提供者端点 |
| LibreChat | 34k | librechat.yaml 中的自定义端点 |
| AnythingLLM | 56k | 通用 OpenAI 提供者 |
| NextChat | 87k | BASE_URL 环境变量 |
| ChatBox | 39k | API Host 设置 |
| Jan | 26k | 远程模型配置 |
| HF Chat-UI | 8k | OPENAI_BASE_URL |
| big-AGI | 7k | 自定义端点 |
| OpenAI Python SDK | — | `OpenAI(base_url="http://localhost:8642/v1")` |
| curl | — | 直接 HTTP 请求 |

## 多用户配置与配置文件

要为多个用户分配各自隔离的 Hermes 实例（独立的配置、记忆、技能），请使用[配置文件](/user-guide/profiles)：

```bash
# 为每个用户创建配置文件
hermes profile create alice
hermes profile create bob

# 为每个配置文件的 API 服务器配置不同端口。API_SERVER_* 是环境变量
# （而非 config.yaml 键），因此将它们写入每个配置文件的 .env：
cat >> ~/.hermes/profiles/alice/.env <<EOF
API_SERVER_ENABLED=true
API_SERVER_PORT=8643
API_SERVER_KEY=alice-secret
EOF

cat >> ~/.hermes/profiles/bob/.env <<EOF
API_SERVER_ENABLED=true
API_SERVER_PORT=8644
API_SERVER_KEY=bob-secret
EOF

# 启动每个配置文件的网关
hermes -p alice gateway &
hermes -p bob gateway &
```

每个配置文件的 API 服务器会自动将配置文件名称公告为模型 ID：

- `http://localhost:8643/v1/models` → 模型 `alice`
- `http://localhost:8644/v1/models` → 模型 `bob`

在 Open WebUI 中，将每个配置添加为单独的连接。模型下拉菜单将 `alice` 和 `bob` 显示为不同的模型，每个模型均由完全隔离的 Hermes 实例支持。详情请参阅 [Open WebUI 指南](/user-guide/messaging/open-webui#multi-user-setup-with-profiles)。

## 限制

- **响应存储** — 存储的响应（用于 `previous_response_id`）持久化保存在 SQLite 中，网关重启后仍然保留。最多存储 100 条响应（LRU 淘汰）。
- **不支持文件上传** — `/v1/chat/completions` 和 `/v1/responses` 均支持内联图像，但不支持上传文件（`file`、`input_file`、`file_id`）和非图像文档输入通过 API 传输。
- **模型字段仅作标识** — 请求中的 `model` 字段会被接受，但实际使用的 LLM 模型在服务器端的 config.yaml 中配置。

## 代理模式

API 服务器还可作为**网关代理模式**的后端。当另一个 Hermes 网关实例配置了指向该 API 服务器的 `GATEWAY_PROXY_URL` 时，它会将所有消息转发至此，而非运行自己的智能体。这实现了分离式部署——例如，处理 Matrix E2EE 的 Docker 容器可以中继到主机端的智能体。

完整设置指南请参阅[矩阵代理模式](/user-guide/messaging/matrix#proxy-mode-e2ee-on-macos)。