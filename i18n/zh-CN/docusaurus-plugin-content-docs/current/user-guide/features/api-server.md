---
sidebar_position: 14
title: "API 服务器"
description: "将 hermes-智能体 暴露为兼容 OpenAI 的 API，供任何前端使用"
---

# API 服务器

API 服务器将 hermes-智能体 暴露为一个兼容 OpenAI 的 HTTP 端点。任何使用 OpenAI 格式的前端——如 Open WebUI、LobeChat、LibreChat、NextChat、ChatBox 等数百种——都可以连接到 hermes-智能体 并将其用作后端。

您的智能体会使用其完整的工具集（终端、文件操作、网络搜索、记忆、技能）来处理请求并返回最终响应。在流式传输时，工具进度指示器会内联显示，以便前端可以展示智能体正在做什么。

:::tip 一个后端覆盖模型+工具
要使 API 服务器有用，Hermes 本身需要配置模型提供商和工具后端。一个 [Nous Portal](/user-guide/features/tool-gateway) 订阅即可处理两者——通过 Tool Gateway 提供 300 多个模型以及网络/图像/语音合成/浏览器工具。在启动 API 服务器和前端（如 Open WebUI 或 LobeChat）之前，只需运行一次 `hermes setup --portal`，即可获得一个完全装备了工具的后端。
:::

## 快速开始

### 1. 启用 API 服务器

添加到 `~/.hermes/.env`：

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=change-me-local-dev
# 可选：仅当浏览器必须直接调用 Hermes 时
# API_SERVER_CORS_ORIGINS=http://localhost:3000
```

### 2. 启动网关

```bash
hermes gateway
```

您将看到：

```
[API 服务器] API 服务器正在监听 http://127.0.0.1:8642
```

### 3. 连接前端

将任何兼容 OpenAI 的客户端指向 `http://localhost:8642/v1`：

```bash
# 使用 curl 测试
curl http://localhost:8642/v1/chat/completions \
  -H "Authorization: Bearer change-me-local-dev" \
  -H "Content-Type: application/json" \
  -d '{"model": "hermes-智能体", "messages": [{"role": "user", "content": "你好！"}]}'
```

或者连接 Open WebUI、LobeChat 或任何其他前端——有关分步说明，请参阅 [Open WebUI 集成指南](/user-guide/messaging/open-webui)。

## 端点

### POST /v1/chat/completions

标准 OpenAI 聊天补全格式。无状态 — 完整的对话内容通过 `messages` 数组包含在每个请求中。

**请求：**
```json
{
  "model": "hermes-agent",
  "messages": [
    {"role": "system", "content": "你是一名 Python 专家。"},
    {"role": "user", "content": "写一个斐波那契函数"}
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
    "message": {"role": "assistant", "content": "这是一个斐波那契函数..."},
    "finish_reason": "stop"
  }],
  "usage": {"prompt_tokens": 50, "completion_tokens": 200, "total_tokens": 250}
}
```

**内联图片输入：** 用户消息可以将 `content` 发送为 `text` 和 `image_url` 部分的数组。支持远程 `http(s)` URL 和 `data:image/...` URL：

```json
{
  "model": "hermes-agent",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "这张图片里有什么？"},
        {"type": "image_url", "image_url": {"url": "https://example.com/cat.png", "detail": "high"}}
      ]
    }
  ]
}
```

上传的文件（`file` / `input_file` / `file_id`）和非图片 `data:` URL 将返回 `400 unsupported_content_type`。

**流式传输** (`"stream": true`)：返回服务器推送事件（SSE），逐个令牌发送响应块。对于**聊天补全**，流使用标准的 `chat.completion.chunk` 事件加上 Hermes 自定义的 `hermes.tool.progress` 事件，以实现工具启动的用户体验。对于**响应**，流使用 OpenAI Responses 事件类型，如 `response.created`、`response.output_text.delta`、`response.output_item.added`、`response.output_item.done` 和 `response.completed`。

**流中的工具进度**：
- **聊天补全**：Hermes 发出 `event: hermes.tool.progress` 以显示工具启动的可见性，而不会污染持久化的助手文本。
- **响应**：Hermes 在 SSE 流期间发出规范原生的 `function_call` 和 `function_call_output` 输出项，因此客户端可以实时渲染结构化的工具 UI。

### POST /v1/responses

OpenAI Responses API 格式。通过 `previous_response_id` 支持服务器端对话状态 — 服务器存储完整的对话历史（包括工具调用和结果），因此多轮上下文得以保留，客户端无需管理它。

**请求：**
```json
{
  "model": "hermes-agent",
  "input": "我的项目里有哪些文件？",
  "instructions": "你是一个有用的编程助手。",
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
    {"type": "message", "role": "assistant", "content": [{"type": "output_text", "text": "你的项目有..."}]}
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
        {"type": "input_text", "text": "描述这个截图。"},
        {"type": "input_image", "image_url": "data:image/png;base64,iVBORw0K..."}
      ]
    }
  ]
}
```

上传的文件（`input_file` / `file_id`）和非图片 `data:` URL 将返回 `400 unsupported_content_type`。

#### 使用 previous_response_id 进行多轮对话

链接响应以在轮次之间维护完整上下文（包括工具调用）：

```json
{
  "input": "现在显示 README 给我",
  "previous_response_id": "resp_abc123"
}
```

服务器从存储的响应链重建完整的对话 — 所有之前的工具调用和结果都被保留。链接的请求也共享相同的会话，因此多轮对话在仪表盘和会话历史中显示为单个条目。

#### 命名对话

使用 `conversation` 参数代替跟踪响应 ID：

```json
{"input": "你好", "conversation": "my-project"}
{"input": "src/ 里有什么？", "conversation": "my-project"}
{"input": "运行测试", "conversation": "my-project"}
```

服务器自动链接到该对话中的最新响应。类似于网关会话的 `/title` 命令。

### GET /v1/responses/\{id\}

通过 ID 检索先前存储的响应。

### DELETE /v1/responses/\{id\}

删除存储的响应。

### GET /v1/models

将智能体列为可用模型。宣传的模型名称默认为 [配置文件](/user-guide/profiles) 名称（默认配置文件为 `hermes-agent`）。大多数前端进行模型发现时需要此端点。

### GET /v1/capabilities

返回 API 服务器稳定表面的机器可读描述，供外部 UI、编排器和插件桥使用。

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

在集成仪表盘、浏览器 UI 或控制平面时使用此端点，以便它们能够发现正在运行的 Hermes 版本是否支持运行、流式传输、取消和会话连续性，而不依赖私有的 Python 内部实现。

### GET /health

健康检查。返回 `{"status": "ok"}`。对于期望 `/v1/` 前缀的 OpenAI 兼容客户端，也可在 **GET /v1/health** 使用。

### GET /health/detailed

扩展健康检查，还报告活动会话、正在运行的智能体和资源使用情况。适用于监控/可观测性工具。

## 运行 API（对流式传输友好的替代方案）

除了 `/v1/chat/completions` 和 `/v1/responses`，服务器还暴露了一个 **运行** API，适用于客户端希望订阅进度事件而不是自己管理流式传输的长会话。

### POST /v1/runs

创建一个新的智能体运行。返回一个 `run_id`，可用于订阅进度事件。

```json
{
  "run_id": "run_abc123",
  "status": "started"
}
```

运行接受一个简单的 `input` 字符串以及可选的 `session_id`、`instructions`、`conversation_history` 或 `previous_response_id`。当提供 `session_id` 时，Hermes 会在运行状态中显示它，以便外部 UI 可以将其运行与其自身的对话 ID 关联起来。

### GET /v1/runs/\{run_id\}

轮询当前运行状态。这适用于需要状态但不想保持 SSE 连接打开的仪表盘，或在导航后需要重新连接的 UI。

```json
{
  "object": "hermes.run",
  "run_id": "run_abc123",
  "status": "completed",
  "session_id": "space-session",
  "model": "hermes-agent",
  "output": "完成。",
  "usage": {"input_tokens": 50, "output_tokens": 200, "total_tokens": 250}
}
```

在终端状态（`completed`、`failed` 或 `cancelled`）之后，状态会短暂保留以供轮询和 UI 调解。

### GET /v1/runs/\{run_id\}/events

服务器推送事件流，包含运行的工具调用进度、令牌增量和生命周期事件。专为希望附加/分离而不丢失状态的仪表盘和客户端设计。

### POST /v1/runs/\{run_id\}/stop

中断正在运行的智能体轮次。端点立即返回 `{"status": "stopping"}`，同时 Hermes 要求活动智能体在下一个安全中断点停止。

## 任务 API（后台计划工作）

服务器暴露了一个轻量级的任务 CRUD 界面，用于从远程客户端管理计划的/后台智能体运行。所有端点都受相同的承载认证保护。

### GET /api/jobs

列出所有计划的任务。

### POST /api/jobs

创建一个新的计划任务。请求体接受与 `hermes cron` 相同的结构 — 提示、计划、技能、提供者覆盖、交付目标。

### GET /api/jobs/\{job_id\}

获取单个任务的定义和上次运行状态。

### PATCH /api/jobs/\{job_id\}

更新现有任务的字段（提示、计划等）。部分更新会被合并。

### DELETE /api/jobs/\{job_id\}

删除任务。同时取消任何正在进行的运行。

### POST /api/jobs/\{job_id\}/pause

暂停任务而不删除它。计划的下次运行时间戳将被暂停，直到恢复。

### POST /api/jobs/\{job_id\}/resume

恢复先前暂停的任务。

### POST /api/jobs/\{job_id\}/run

立即触发任务运行，不按计划执行。

## Sessions API（通过 REST 进行会话控制）

外部 UI 可以通过 REST 管理 Hermes 会话，无需启动仪表盘。所有端点均受 `API_SERVER_KEY` 保护，位于 `/api/sessions/*` 路径下。

| 方法 | 路径 | 描述 |
|--------|------|-------------|
| `GET` | `/api/sessions` | 列出会话（分页 — `limit`、`offset`、`source`、`include_children`） |
| `POST` | `/api/sessions` | 创建一个空会话 |
| `GET` | `/api/sessions/{id}` | 读取会话元数据 |
| `PATCH` | `/api/sessions/{id}` | 更新标题或 `end_reason` |
| `DELETE` | `/api/sessions/{id}` | 删除一个会话 |
| `GET` | `/api/sessions/{id}/messages` | 获取一个会话的消息历史 |
| `POST` | `/api/sessions/{id}/fork` | 通过 `SessionDB` 衍生会话分支（匹配 CLI `/branch` 语义） |
| `POST` | `/api/sessions/{id}/chat` | 运行一个同步智能体回合 |
| `POST` | `/api/sessions/{id}/chat/stream` | 基于单个回合的 SSE 包装 — 发出 `assistant.delta`、`tool.started`、`tool.completed`、`run.completed` 事件 |

`/v1/capabilities` 通过 `session_*` 功能标志和 `endpoints.session_*` 条目广播完整的接口信息，以便外部 UI 检测支持情况并安全地回退。`chat` 和 `chat/stream` 请求体支持内联图像（多模态感知路径）。

```bash
# 分叉一个会话并运行一个回合
curl -X POST http://localhost:8642/api/sessions/$ID/fork \
  -H "Authorization: Bearer $API_SERVER_KEY" \
  -d '{"title": "探索替代路径"}'

# 通过 SSE 流式传输一个回合
curl -N -X POST http://localhost:8642/api/sessions/$ID/chat/stream \
  -H "Authorization: Bearer $API_SERVER_KEY" \
  -d '{"input": "过去一小时改了哪些文件？"}'
```

## 技能与工具集发现

`GET /v1/skills` 和 `GET /v1/toolsets` 允许外部客户端通过 REST 确定性地枚举智能体的能力，而无需询问模型。两者均为只读，并受 `API_SERVER_KEY` 保护。

```bash
curl http://localhost:8642/v1/skills \
  -H "Authorization: Bearer $API_SERVER_KEY"
# → [{"name": "github-pr-workflow", "description": "...", "category": "..."}, ...]

curl http://localhost:8642/v1/toolsets \
  -H "Authorization: Bearer $API_SERVER_KEY"
# → [{"name": "core", "label": "...", "description": "...", "enabled": true,
#     "configured": true, "tools": ["read_file", "write_file", ...]}, ...]
```

`/v1/skills` 返回技能中心内部使用的相同元数据。`/v1/toolsets` 返回为 `api_server` 平台解析的工具集，包含每个工具集展开的具体 `tools` 列表。两者均在 `/v1/capabilities` 的 `endpoints.*` 下广播。

## 长期内存作用域（`X-Hermes-Session-Key`）

像 Open WebUI 这样的多用户前端需要一个稳定的、**独立于**会话记录作用域 `X-Hermes-Session-Key`（在 `/new` 时轮换）的、每通道标识符，用于长期内存（如 Honcho 等）。在 `/v1/chat/completions`、`/v1/responses` 或 `/v1/runs` 上通过 `X-Hermes-Session-Key` 传递，Hermes 会将其线程传递给 `AIAgent(gateway_session_key=...)`，Honcho 内存提供者使用它来推导稳定的作用域。

```http
POST /v1/chat/completions HTTP/1.1
Authorization: Bearer ***
X-Hermes-Session-Id: transcript-alpha
X-Hermes-Session-Key: agent:main:webui:dm:user-42
```

规则：最大 256 个字符，拒绝控制字符（`\r`、`\n`、`\x00`），该值在响应中回显（JSON + SSE）。`/v1/capabilities` 通过 `"session_key_header": "X-Hermes-Session-Key"` 广播支持。如果没有该键，Honcho 的 `per-session` 策略会为每个 `session_id` 产生不同的作用域 — 这正是 Hermes 之前的行为。

## 系统提示处理

当前端发送 `system` 消息（Chat Completions）或 `instructions` 字段（Responses API）时，hermes-agent **将其叠加**在其核心系统提示之上。您的智能体保留其所有工具、内存和技能 — 前端的系统提示添加额外的指令。

这意味着您可以为每个前端定制行为而不丢失能力：
- Open WebUI 系统提示："你是一位 Python 专家。始终包含类型提示。"
- 智能体仍然拥有终端、文件工具、网络搜索、内存等。

## 认证

通过 `Authorization` 请求头进行 Bearer 令牌认证：

```
Authorization: Bearer ***
```

通过 `API_SERVER_KEY` 环境变量配置密钥。如果您需要浏览器直接调用 Hermes，还需将 `API_SERVER_CORS_ORIGINS` 设置为明确的允许列表。

:::warning 安全性
API 服务器提供对 hermes-agent 工具集的完全访问权限，**包括终端命令**。`API_SERVER_KEY` 是**每次部署所必需的**，包括默认绑定在 `127.0.0.1` 上的回环绑定。在您明确允许浏览器调用者时，请将 `API_SERVER_CORS_ORIGINS` 设置得较窄以控制浏览器访问。
:::

## 配置

### 环境变量

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `API_SERVER_ENABLED` | `false` | 启用 API 服务器 |
| `API_SERVER_PORT` | `8642` | HTTP 服务器端口 |
| `API_SERVER_HOST` | `127.0.0.1` | 绑定地址（默认仅限本地主机） |
| `API_SERVER_KEY` | _（必需）_ | 用于认证的 Bearer 令牌 |
| `API_SERVER_CORS_ORIGINS` | _（无）_ | 逗号分隔的允许浏览器来源 |
| `API_SERVER_MODEL_NAME` | _（配置文件名）_ | `/v1/models` 上的模型名称。默认为配置文件名，对于默认配置文件则为 `hermes-agent`。 |

### config.yaml

```yaml
# 尚不支持 — 请使用环境变量。
# config.yaml 支持将在未来版本中提供。
```

## 安全头

所有响应都包含安全头：
- `X-Content-Type-Options: nosniff` — 防止 MIME 类型嗅探
- `Referrer-Policy: no-referrer` — 防止引用来源泄漏

## CORS

API 服务器**默认不启用**浏览器 CORS。

要进行直接的浏览器访问，请设置明确的允许列表：

```bash
API_SERVER_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

启用 CORS 时：
- **预检响应**包含 `Access-Control-Max-Age: 600`（10 分钟缓存）
- **SSE 流式响应**包含 CORS 头，以便浏览器 EventSource 客户端正常工作
- **`Idempotency-Key`** 是一个允许的请求头 — 客户端可以发送它以进行去重（响应按键缓存 5 分钟）

大多数有文档记载的前端（如 Open WebUI）以服务器到服务器的方式连接，根本不需要 CORS。

## 兼容前端

任何支持 OpenAI API 格式的前端都可以工作。已测试/有文档记录的集成：

| 前端 | 星标数 | 连接 |
|----------|-------|------------|
| [Open WebUI](/user-guide/messaging/open-webui) | 126k | 有完整指南 |
| LobeChat | 73k | 自定义提供者端点 |
| LibreChat | 34k | 在 librechat.yaml 中设置自定义端点 |
| AnythingLLM | 56k | 通用 OpenAI 提供者 |
| NextChat | 87k | BASE_URL 环境变量 |
| ChatBox | 39k | API Host 设置 |
| Jan | 26k | 远程模型配置 |
| HF Chat-UI | 8k | OPENAI_BASE_URL |
| big-AGI | 7k | 自定义端点 |
| OpenAI Python SDK | — | `OpenAI(base_url="http://localhost:8642/v1")` |
| curl | — | 直接的 HTTP 请求 |

## 使用配置文件的多用户设置

要为多个用户提供其自己隔离的 Hermes 实例（独立的配置、内存、技能），请使用[配置文件](/user-guide/profiles)：

```bash
# 为每个用户创建一个配置文件
hermes profile create alice
hermes profile create bob

# 为每个配置文件的 API 服务器配置不同的端口。API_SERVER_* 是环境
# 变量（不是 config.yaml 键），因此将它们写入每个配置文件的 .env：
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

每个配置文件的 API 服务器会自动将配置文件名称作为模型 ID 进行广播：

- `http://localhost:8643/v1/models` → 模型 `alice`
- `http://localhost:8644/v1/models` → 模型 `bob`

在 Open WebUI 中，将每个添加为单独的连接。模型下拉菜单将显示 `alice` 和 `bob` 作为不同的模型，每个都由一个完全隔离的 Hermes 实例支持。详情请参见 [Open WebUI 指南](/user-guide/messaging/open-webui#multi-user-setup-with-profiles)。

## 限制

- **响应存储** — 存储的响应（用于 `previous_response_id`）持久化在 SQLite 中，并在网关重启后保留。最多存储 100 个响应（LRU 淘汰）。
- **无文件上传** — 在 `/v1/chat/completions` 和 `/v1/responses` 上均支持内联图像，但不支持通过 API 上传文件（`file`、`input_file`、`file_id`）和非图像文档输入。
- **模型字段仅作装饰** — 请求中的 `model` 字段会被接受，但实际使用的 LLM 模型在 config.yaml 中的服务端配置。

## 代理模式

API 服务器也作为**网关代理模式**的后端。当另一个 Hermes 网关实例配置了 `GATEWAY_PROXY_URL` 指向此 API 服务器时，它会将所有消息转发到这里，而不是运行自己的智能体。这支持分离部署 — 例如，一个处理 Matrix 端到端加密的 Docker 容器中继到宿主机侧的智能体。

设置指南请参见 [Matrix 代理模式](/user-guide/messaging/matrix#proxy-mode-e2ee-on-macos)。