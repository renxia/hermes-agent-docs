---
sidebar_position: 15
title: "Web 控制面板"
description: "基于浏览器的控制面板，用于管理配置、API 密钥、会话、日志、分析、定时任务和技能"
---

# Web 控制面板

Web 控制面板是一个基于浏览器的用户界面，用于管理您的 Hermes 智能体安装。您可以通过简洁的 Web 界面配置设置、管理 API 密钥并监控会话，而无需编辑 YAML 文件或运行 CLI 命令。

:::tip
托管模式认证使用 Nous Portal OAuth；如果您还希望控制面板与真实后端通信，`hermes setup --portal` 命令也会配置好模型和工具网关。请参阅 [Nous Portal](/integrations/nous-portal)。
:::

## 快速开始

```bash
hermes dashboard
```

此命令会启动一个本地 Web 服务器，并在您的浏览器中打开 `http://127.0.0.1:9119`。控制面板完全在您的机器上运行——数据不会离开本地主机。

### 选项

| 标志 | 默认值 | 描述 |
|------|---------|-------------|
| `--port` | `9119` | Web 服务器运行端口 |
| `--host` | `127.0.0.1` | 绑定地址 |
| `--no-open` | — | 不自动打开浏览器 |
| `--insecure` | 关闭 | 允许绑定到非本地主机地址（**危险** — 会在网络上暴露 API 密钥；需配合防火墙和强认证使用） |
| `--tui` | 关闭 | 启用浏览器内的聊天标签页（通过 PTY/WebSocket 嵌入 `hermes --tui`）。或者设置 `HERMES_DASHBOARD_TUI=1`。 |

```bash
# 自定义端口
hermes dashboard --port 8080

# 绑定到所有接口（在共享网络上请谨慎使用）
hermes dashboard --host 0.0.0.0

# 启动但不打开浏览器
hermes dashboard --no-open

# 启用浏览器内的聊天标签页
hermes dashboard --tui
```

## 先决条件

默认的 `hermes-agent` 安装不包含 HTTP 栈或 PTY 辅助程序——这些是可选附加组件。**Web 仪表板** 需要 FastAPI 和 Uvicorn（`web` 额外组件）。**聊天** 选项卡还需要 `ptyprocess` 来在伪终端后生成嵌入式 TUI（在 POSIX 上是 `pty` 额外组件）。使用以下命令安装两者：

```bash
pip install 'hermes-agent[web,pty]'
```

`web` 额外组件会安装 FastAPI/Uvicorn；`pty` 会安装 `ptyprocess`（POSIX）或 `pywinpty`（原生 Windows——请注意嵌入式 TUI 本身仍需要 WSL）。`pip install hermes-agent[all]` 包含所有额外组件，如果您还需要消息/语音等功能，这是最简单的途径。

当您在缺少依赖项的情况下运行 `hermes dashboard` 时，它会提示您需要安装什么。如果前端尚未构建且 `npm` 可用，它会在首次启动时自动构建。

聊天选项卡在普通 `hermes dashboard` 启动时默认是关闭的。使用 `hermes dashboard --tui` 启动仪表板，或在想要嵌入式浏览器聊天窗格时设置 `HERMES_DASHBOARD_TUI=1`。

## 页面

### 状态

登录页面显示您安装的实时概览：

- **智能体版本** 和发布日期
- **网关状态** — 运行中/已停止，PID，已连接的平台及其状态
- **活跃会话** — 过去 5 分钟内活跃的会话计数
- **最近会话** — 最近 20 个会话的列表，包括模型、消息计数、令牌使用情况和对话预览

状态页面每 5 秒自动刷新一次。

### 聊天

**聊天** 选项卡将完整的 Hermes TUI（与通过 `hermes --tui` 获得的界面相同）直接嵌入到浏览器中。您在终端 TUI 中可以做的所有事情——斜杠命令、模型选择器、工具调用卡、Markdown 流式传输、澄清/授权/审批提示、皮肤主题——在这里都完全相同，因为仪表板正在运行真实的 TUI 二进制文件，并通过 [xterm.js](https://xtermjs.org/) 及其 WebGL 渲染器呈现其 ANSI 输出，以实现像素级精确的单元格布局。

**工作原理：**

- `/api/pty` 打开一个使用仪表板会话令牌进行身份验证的 WebSocket
- 服务器在 POSIX 伪终端后生成 `hermes --tui`
- 按键传输到 PTY；ANSI 输出流回浏览器
- xterm.js 的 WebGL 渲染器将每个单元格绘制到整数像素网格；鼠标跟踪（SGR 1006）、宽字符（Unicode 11）和方框绘制字形都原生呈现
- 调整浏览器窗口大小会通过 `@xterm/addon-fit` 插件调整 TUI 大小

**恢复现有会话：** 从 **会话** 选项卡，点击任意会话旁边的播放图标 (▶)。这将跳转到 `/chat?resume=<id>` 并使用 `--resume` 启动 TUI，加载完整历史记录。

**先决条件：**

- Node.js（与 `hermes --tui` 要求相同；TUI 包在首次启动时构建）
- `ptyprocess` — 由 `pty` 额外组件安装（`pip install 'hermes-agent[web,pty]'`，或 `[all]` 包含两者）
- POSIX 内核（Linux、macOS 或 WSL2）。`/chat` 终端窗格特别需要 POSIX PTY——原生 Windows Python 没有等效项，因此在原生 Windows 安装上，仪表板的其余部分（会话、作业、指标、配置编辑器）可以工作，但 `/chat` 选项卡会显示一个横幅，告诉您该功能需使用 WSL2。

关闭浏览器选项卡后，PTy 会在服务器上被干净地回收。重新打开会生成一个全新的会话。

### 配置

一个基于表单的 `config.yaml` 编辑器。所有 150 多个配置字段均从 `DEFAULT_CONFIG` 自动发现，并组织成选项卡类别：

- **模型** — 默认模型、提供商、基本 URL、推理设置
- **终端** — 后端（本地/docker/ssh/modal）、超时时间、Shell 偏好设置
- **显示** — 皮肤、工具进度、恢复显示、加载指示器设置
- **智能体** — 最大迭代次数、网关超时、服务层级
- **委派** — 子智能体限制、推理努力程度
- **记忆** — 提供商选择、上下文注入设置
- **审批** — 危险命令审批模式（ask/yolo/deny）
- 以及更多——config.yaml 的每个部分都有对应的表单字段

具有已知有效值的字段（终端后端、皮肤、审批模式等）呈现为下拉菜单。布尔值呈现为开关。其他所有内容都是文本输入框。

**操作：**

- **保存** — 立即更改写入 `config.yaml`
- **重置为默认值** — 将所有字段恢复为其默认值（在您单击保存之前不会保存）
- **导出** — 将当前配置下载为 JSON
- **导入** — 上传 JSON 配置文件以替换当前值

:::tip
配置更改将在下一个智能体会话或网关重启后生效。Web 仪表板编辑的是与 `hermes config set` 和网关读取的同一个 `config.yaml` 文件。
:::

### API 密钥

管理存储 API 密钥和凭据的 `.env` 文件。密钥按类别分组：

- **LLM 提供商** — OpenRouter、Anthropic、OpenAI、DeepSeek 等
- **工具 API 密钥** — Browserbase、Firecrawl、Tavily、ElevenLabs 等
- **消息平台** — Telegram、Discord、Slack 机器人令牌等
- **智能体设置** — 非机密环境变量，如 `API_SERVER_ENABLED`

每个密钥显示：
- 它是否当前已设置（附带值的编辑预览）
- 用途描述
- 指向提供商注册/密钥页面的链接
- 用于设置或更新值的输入字段
- 用于删除它的删除按钮

高级/不常用的密钥默认隐藏在切换开关后面。

### 会话

浏览和检查所有智能体会话。每行显示会话标题、来源平台图标（CLI、Telegram、Discord、Slack、cron）、模型名称、消息计数、工具调用计数以及上次活跃的时间。实时会话用脉冲徽章标记。

- **搜索** — 使用 FTS5 在所有消息内容中进行全文搜索。结果会显示高亮片段，展开时自动滚动到第一个匹配的消息。
- **展开** — 点击会话加载其完整消息历史记录。消息按角色（用户、助手、系统、工具）进行颜色编码，并以 Markdown 形式呈现，支持语法高亮。
- **工具调用** — 带有工具调用的助手消息会显示可折叠的块，其中包含函数名称和 JSON 参数。
- **删除** — 使用垃圾桶图标删除会话及其消息历史记录。

### 日志

查看智能体、网关和错误日志文件，支持过滤和实时跟踪。

- **文件** — 在 `agent`、`errors` 和 `gateway` 日志文件之间切换
- **级别** — 按日志级别过滤：ALL、DEBUG、INFO、WARNING 或 ERROR
- **组件** — 按来源组件过滤：全部、网关、智能体、工具、cli 或 cron
- **行数** — 选择要显示的行数（50、100、200 或 500）
- **自动刷新** — 切换实时跟踪，每 5 秒轮询一次新的日志行
- **颜色编码** — 日志行按严重性着色（错误为红色，警告为黄色，调试为暗淡）

### 分析

从会话历史计算的使用情况和成本分析。选择一个时间段（7、30 或 90 天）以查看：

- **摘要卡片** — 总令牌数（输入/输出）、缓存命中百分比、总估算或实际成本，以及总会话数及日均值
- **每日令牌图表** — 堆叠条形图，显示每天的输入和输出令牌使用情况，悬停工具提示显示细分和成本
- **每日细分表** — 日期、会话计数、输入令牌、输出令牌、缓存命中率以及每天的成本
- **按模型细分** — 表格显示每个使用的模型、其会话计数、令牌使用情况和估算成本

### 定时任务

创建和管理计划定时任务，这些任务按循环计划运行智能体提示。

- **创建** — 填写名称（可选）、提示、cron 表达式（例如 `0 9 * * *`）和交付目标（本地、Telegram、Discord、Slack 或电子邮件）
- **作业列表** — 每个作业显示其名称、提示预览、计划表达式、状态徽章（启用/暂停/错误）、交付目标、上次运行时间和下次运行时间
- **暂停/恢复** — 在活动和暂停状态之间切换作业
- **立即触发** — 在其正常计划之外立即执行作业
- **删除** — 永久删除定时任务

### 技能

浏览、搜索和切换技能与工具集。技能从 `~/.hermes/skills/` 加载，并按类别分组。

- **搜索** — 按名称、描述或类别过滤技能和工具集
- **类别过滤器** — 点击类别药丸以缩小列表范围（例如 MLOps、MCP、红队、AI）
- **切换** — 使用开关启用或禁用单个技能。更改将在下一个会话中生效。
- **工具集** — 单独的部分显示内置工具集（文件操作、Web 浏览等），包括其活动/非活动状态、设置要求和包含的工具列表

:::warning 安全
Web 仪表板读取和写入您的 `.env` 文件，其中包含 API 密钥和机密信息。默认情况下，它绑定到 `127.0.0.1` —— 仅可从您的本地机器访问。如果您绑定到 `0.0.0.0`，您网络上的任何人都可以查看和修改您的凭据。仪表板本身没有身份验证。
:::

## `/reload` 斜杠命令

仪表盘 PR 也为交互式 CLI 添加了 `/reload` 斜杠命令。在通过 Web 仪表盘（或直接编辑 `.env`）更改 API 密钥后，可在活动的 CLI 会话中使用 `/reload` 来获取更改，无需重启：

```
You → /reload
  Reloaded .env (3 var(s) updated)
```

此操作会将 `~/.hermes/.env` 重新读取到运行中进程的环境。当您通过仪表盘添加了新的提供商密钥并希望立即使用时，此功能非常有用。

## REST API

Web 仪表盘暴露了一个 REST API 供前端使用。您也可以直接调用这些端点进行自动化操作：

### GET /api/status

返回智能体版本、网关状态、平台状态和活动会话数。

### GET /api/sessions

返回最近 20 个会话及其元数据（模型、token 数量、时间戳、预览）。

### GET /api/config

以 JSON 格式返回当前 `config.yaml` 的内容。

### GET /api/config/defaults

返回默认配置值。

### GET /api/config/schema

返回一个描述每个配置字段的模式——类型、描述、类别以及适用的选择选项。前端使用此模式为每个字段渲染正确的输入小部件。

### PUT /api/config

保存新的配置。请求体：`{"config": {...}}`。

### GET /api/env

返回所有已知的环境变量及其设置/未设置状态、脱敏值、描述和类别。

### PUT /api/env

设置一个环境变量。请求体：`{"key": "VAR_NAME", "value": "secret"}`。

### DELETE /api/env

删除一个环境变量。请求体：`{"key": "VAR_NAME"}`。

### GET /api/sessions/\{session_id\}

返回单个会话的元数据。

### GET /api/sessions/\{session_id\}/messages

返回一个会话的完整消息历史记录，包括工具调用和时间戳。

### GET /api/sessions/search

跨消息内容进行全文搜索。查询参数：`q`。返回匹配的会话 ID 及高亮显示的片段。

### DELETE /api/sessions/\{session_id\}

删除一个会话及其消息历史记录。

### GET /api/logs

返回日志行。查询参数：`file`（agent/errors/gateway）、`lines`（数量）、`level`、`component`。

### GET /api/analytics/usage

返回 token 使用量、成本和会话分析。查询参数：`days`（默认 30）。响应包含每日细分和按模型聚合的数据。

### GET /api/cron/jobs

返回所有已配置的定时任务及其状态、计划和运行历史。

### POST /api/cron/jobs

创建一个新的定时任务。请求体：`{"prompt": "...", "schedule": "0 9 * * *", "name": "...", "deliver": "local"}`。

### POST /api/cron/jobs/\{job_id\}/pause

暂停一个定时任务。

### POST /api/cron/jobs/\{job_id\}/resume

恢复一个已暂停的定时任务。

### POST /api/cron/jobs/\{job_id\}/trigger

在计划之外立即触发一个定时任务。

### DELETE /api/cron/jobs/\{job_id\}

删除一个定时任务。

### GET /api/skills

返回所有技能及其名称、描述、类别和启用状态。

### PUT /api/skills/toggle

启用或禁用一个技能。请求体：`{"name": "skill-name", "enabled": true}`。

### GET /api/tools/toolsets

返回所有工具集及其标签、描述、工具列表以及活动/已配置状态。

## OAuth 认证（网关模式）

当仪表板绑定到公共地址（即 `127.0.0.1` / `localhost` 以外的地址）时，Hermes 智能体会启用一个基于 OAuth 的认证网关。每个请求都必须携带一个经过验证的会话 Cookie，否则将通过 Nous 研究门户执行完整的 OAuth 流程进行重定向。

这适用于托管部署（通常是 Fly.io），仪表板可通过公共互联网访问。操作者所有、绑定到回环地址的仪表板不受影响。

### 网关何时启用

| 标志 | 认证网关 | 使用场景 |
|------|----------|----------|
| `hermes dashboard`（默认 — 绑定到 `127.0.0.1`） | 关闭 | 本地开发 |
| `hermes dashboard --host 0.0.0.0` | **开启** | 生产环境 / Fly.io 部署 |
| `hermes dashboard --host 192.168.1.10 --insecure` | 关闭 | 受信任的局域网；用户选择使用旧版会话令牌认证 |

当且仅当以下条件满足时，网关开启：

1. 绑定的主机地址不是 `127.0.0.1`、`::1`、`localhost` 或 `0.0.0.0`，**并且**
2. **没有** 设置 `--insecure` 标志。

设置 `--insecure` 会保留现有的单进程会话令牌行为 —— 不执行 OAuth 流程，不需要任何提供者插件。仅在您信任所有客户端的网络中使用此选项。

### 失败关闭语义

如果网关应启用，但**未**注册任何 `DashboardAuthProvider`（没有 Nous 插件，也没有自定义插件），`hermes dashboard` 会拒绝绑定并显示明确的错误信息。不存在“默认拒绝但接受所有”的回退机制 —— 配置错误的网关仪表板永远不会启动。

### 默认提供者：Nous 研究

捆绑的 `plugins/dashboard_auth/nous` 插件**始终被安装**并自动加载。当配置了客户端 ID 时，它会自动注册一个名为 `nous` 的 `DashboardAuthProvider`。

#### 配置

该插件从两个来源读取配置，当环境变量被设置为非空值时，其优先级更高：

**`config.yaml`** — 权威配置来源：

```yaml
dashboard:
  oauth:
    client_id: agent:01HXYZ…             # 必需项，用于启用网关
    portal_url: https://portal.nousresearch.com  # 可选；默认为生产环境地址
```

**环境变量** — 操作者覆盖配置：

| 环境变量 | 覆盖目标 | 格式 | 提供方 |
|---------|-----------|------|--------|
| `HERMES_DASHBOARD_OAUTH_CLIENT_ID` | `dashboard.oauth.client_id` | `agent:{instance_id}` | Nous 研究门户在 Fly.io 部署时配置 |
| `HERMES_DASHBOARD_PORTAL_URL` | `dashboard.oauth.portal_url` | URL（默认值：`https://portal.nousresearch.com`） | 门户 — 仅在使用测试环境或自定义部署时覆盖 |

根据 Hermes 智能体的惯例（`~/.hermes/.env` 仅用于 API 密钥/机密），对于本地开发、本地部署以及任何您直接控制的部署，**推荐在 `config.yaml` 中设置这些值**。环境变量路径的存在是为了让 Fly.io 的平台机密注入能够推送每个部署的 `client_id`，而无需任何人编辑镜像内的 `config.yaml` —— 这是其主要目的。

空环境值被视为未设置，因此一个已配置但未填充的 Fly 机密不会意外覆盖有效的 `config.yaml` 条目。

如果两个来源都没有提供 `client_id`，插件会报告具体原因，并且仪表板的失败关闭绑定错误会明确告诉您需要修复什么：

```
Refusing to bind dashboard to 0.0.0.0 — the OAuth auth gate engages on
non-loopback binds, but no auth providers are registered.

Bundled providers reported these issues:
  • nous: HERMES_DASHBOARD_OAUTH_CLIENT_ID is not set (and
    dashboard.oauth.client_id in config.yaml is empty). The Nous Portal
    provisions this env var (shape 'agent:{instance_id}') when it
    deploys a Hermes Agent instance — set it to your provisioned
    client id (either as an env var or under dashboard.oauth.client_id
    in config.yaml), or pass --insecure to skip the OAuth gate entirely.

Or pass --insecure to skip the auth gate (NOT recommended on untrusted
networks).
```

### 公共 URL 覆盖

默认情况下，仪表板根据请求重建 OAuth 回调 URL — `X-Forwarded-Host` + `X-Forwarded-Proto` + `X-Forwarded-Prefix`（当 uvicorn 配置了 `proxy_headers=True` 时，该网关下 `start_server` 会启用此设置）。这在 Fly.io 上开箱即用，因为它会正确设置所有这三个头信息。

对于部署在未可靠转发这些头信息的反向代理后面（手动 nginx 设置、本地入口、使用部分代理链的自定义域名 Fly 部署）的情况，请设置 `dashboard.public_url`（或 `HERMES_DASHBOARD_PUBLIC_URL`）为仪表板可达的**完整公共 URL**：

```yaml
dashboard:
  public_url: "https://dashboard.example.com/hermes"
```

设置后，OAuth 回调 URL 将严格按照 `<public_url>/auth/callback` 来构造 — 在该代码路径上会忽略 `X-Forwarded-Prefix`，因为操作者已明确声明了公共 URL。这是有意为之：在前缀已经包含在 `public_url` 中的常见情况下，再添加前缀会导致双重前缀。

与其他仪表板设置的优先级相同 — 环境变量优先于 `config.yaml`：

| 来源 | 覆盖路径 | 何时使用 |
|------|----------|----------|
| `config.yaml` 中的 `dashboard.public_url` | `HERMES_DASHBOARD_PUBLIC_URL` | 本地开发/本地部署（权威配置） |
| `HERMES_DASHBOARD_PUBLIC_URL` 环境变量 | — | Fly.io 平台机密 / CI |
| （未设置） | — | 默认 — 从 `X-Forwarded-*` 头信息重建 |

验证会拒绝缺少 `http://` / `https://` 协议前缀、缺少主机、或包含引号/尖括号/空白字符/控制字符的值。格式错误的值会静默回退到头信息重建，以确保登录流程继续工作，而不是将用户导向恶意 URL。

> **注意：** `public_url` 仅覆盖 OAuth 回调 URL。`Secure` Cookie 标志仍由 `request.url.scheme`（在 `proxy_headers` 下由 `X-Forwarded-Proto` 决定）控制，因此在 TLS 终止的公共部署上使用 `http://` 的 `public_url` 会产生非 Secure 的 Cookie。这是操作者可能犯的错误 — 请将 `public_url` 与上游适当的 TLS 终止配合使用。

### OAuth 流程

提供者实现了 [Nous 研究门户 OAuth 合约 v1](https://github.com/NousResearch/nous-account-service/blob/main/docs/agent-dashboard-oauth-contract.md) — 带有 PKCE (S256) 的授权码授予流程：

1. 用户在没有会话 Cookie 的情况下访问 `/` → 网关重定向到 `/login`。
2. 登录页面显示“使用 Nous 研究账户继续”按钮 → `/auth/login?provider=nous`。
3. 服务器将 PKCE 状态存储在一个短期 Cookie 中，并将用户重定向到 `https://portal.nousresearch.com/oauth/authorize?…`。
4. 用户在门户完成身份验证，落地到 `/auth/callback?code=…&state=…`。
5. 服务器在 `POST /api/oauth/token` 处用代码换取访问令牌，根据门户的 JWKS (`/.well-known/jwks.json`) 验证 JWT 签名，并设置 `hermes_session_at` Cookie。
6. 用户被重定向回 `/`（或通过 `next=` 查询参数回到原始深度链接路径）。

访问令牌的 TTL 为 15 分钟。**在合约 v1 中没有刷新令牌** — 当令牌过期时，SPA 的 fetch 包装器会检测到 401 响应，并执行整页导航返回 `/login` 重新运行流程。

### 设置的 Cookie

| 名称 | 生命周期 | 备注 |
|------|----------|------|
| `hermes_session_at` | 令牌 TTL（15 分钟） | HttpOnly, SameSite=Lax, 当使用 HTTPS 时设置 Secure 标志 |
| `hermes_session_pkce` | 10 分钟 | HttpOnly；在往返过程中保存 PKCE 验证器和提供者提示信息 |
| `hermes_session_rt` | 在 v1 中未使用 | 为未来兼容性保留；当 `refresh_token` 为空时不写入 |

所有三个 Cookie 的路径均为 `Path=/`，且 `SameSite=Lax`。当仪表板通过 HTTPS 访问时（通过请求 URL 方案检测 — 在 `proxy_headers=True` 下遵循 Fly 的 TLS 终止器设置的 `X-Forwarded-Proto`），会设置 `Secure` 标志。

### 注销

侧边栏小部件显示`已通过 nous 登录，用户：<user_id…>`并带有注销图标。点击它会 POST 到 `/auth/logout`，该操作会清除所有仪表板认证 Cookie 并重定向回 `/login`。

### 审计日志

每次登录开始、成功、失败和会话验证失败都会以 JSON 行写入 `$HERMES_HOME/logs/dashboard-auth.log`。敏感字段（`access_token`、`refresh_token`、`code`、`code_verifier`、`state`、`Authorization` 头）在记录前会被编辑。

### 自定义提供者

要接入一个非 Nous 的 OAuth 提供者（例如 Google、GitHub、自定义 OIDC），请创建一个注册了 `DashboardAuthProvider` 的插件：

```python
# ~/.hermes/plugins/dashboard-auth-myidp/__init__.py
from hermes_cli.dashboard_auth import DashboardAuthProvider, Session, LoginStart

class MyIdPProvider(DashboardAuthProvider):
    name = "myidp"
    display_name = "My Identity Provider"

    def start_login(self, *, redirect_uri): ...
    def complete_login(self, *, code, state, code_verifier, redirect_uri): ...
    def verify_session(self, *, access_token): ...
    def refresh_session(self, *, refresh_token): ...
    def revoke_session(self, *, refresh_token): ...

def register(ctx):
    ctx.register_dashboard_auth_provider(MyIdPProvider())
```

登录页面会列出所有已注册的提供者；可以叠加多个提供者，用户在 `/login` 处选择一个。

### 验证网关是否开启

```bash
# 快速环境变量路径 (Fly.io 格式)。HERMES_DASHBOARD_PORTAL_URL 是
# 可选项 — 默认为生产环境地址。
HERMES_DASHBOARD_OAUTH_CLIENT_ID=agent:test \
  hermes dashboard --host 0.0.0.0

# 或者通过 config.yaml 设置（推荐用于本地开发/本地部署）：
#
#   dashboard:
#     oauth:
#       client_id: agent:test
#
# 然后只需运行：
hermes dashboard --host 0.0.0.0

# 访问 /api/status 查看网关状态：
curl -s http://127.0.0.1:9119/api/status | jq '.auth_required, .auth_providers'
# true
# ["nous"]
```

仪表板的 React StatusPage 在“Web 服务器”下显示相同的字段。侧边栏的 AuthWidget 在您登录后会显示当前身份。

## CORS

Web 服务器将 CORS 限制为仅允许本地源：

- `http://localhost:9119` / `http://127.0.0.1:9119`（生产环境）
- `http://localhost:3000` / `http://127.0.0.1:3000`
- `http://localhost:5173` / `http://127.0.0.1:5173`（Vite 开发服务器）

如果您在自定义端口上运行服务器，该源将自动添加。

## 开发

如果您正在为 Web 仪表盘前端贡献代码：

```bash
# 终端 1：启动后端 API
hermes dashboard --no-open

# 终端 2：启动带有热更新的 Vite 开发服务器
cd web/
npm install
npm run dev
```

位于 `http://localhost:5173` 的 Vite 开发服务器会将 `/api` 请求代理到位于 `http://127.0.0.1:9119` 的 FastAPI 后端。

前端使用 React 19、TypeScript、Tailwind CSS v4 和 shadcn/ui 风格组件构建。生产环境的构建产物输出到 `hermes_cli/web_dist/`，由 FastAPI 服务器作为静态单页应用提供服务。

## 更新时自动构建

当您运行 `hermes update` 时，如果系统已安装 `npm`，Web 前端将自动重新构建。这能保持仪表盘与代码更新同步。如果未安装 `npm`，更新过程将跳过前端构建，而 `hermes dashboard` 将在首次启动时进行构建。

## 主题与插件

仪表盘内置六个主题，并可通过用户自定义主题、插件选项卡和后端 API 路由进行扩展——所有这些都可以通过拖放方式实现，无需克隆仓库。

**实时切换主题**：通过顶部标题栏——点击语言切换器旁边的调色板图标。选择将持久化到 `config.yaml` 中的 `dashboard.theme`，并在页面加载时恢复。

内置主题：

| 主题 | 特性 |
|------|------|
| **Hermes Teal** (`default`) | 深青绿色 + 奶油色，系统字体，舒适间距 |
| **Hermes Teal (Large)** (`default-large`) | 与默认主题相同，但使用 18px 文字和更宽敞的间距 |
| **Midnight** (`midnight`) | 深蓝紫色，Inter + JetBrains Mono 字体 |
| **Ember** (`ember`) | 暖调的深红色 + 古铜色，Spectral 衬线字体 + IBM Plex Mono 字体 |
| **Mono** (`mono`) | 灰度，IBM Plex 字体，紧凑 |
| **Cyberpunk** (`cyberpunk`) | 黑色背景配霓虹绿，Share Tech Mono 字体 |
| **Rosé** (`rose`) | 粉色 + 象牙白，Fraunces 衬线字体，宽敞 |

要构建您自己的主题、添加插件选项卡、注入壳层插槽或暴露插件特定的 REST 端点，请参阅 **[扩展仪表盘](./extending-the-dashboard)** — 完整指南涵盖：

- 主题 YAML 模式 — 调色板、排版、布局、资源、组件样式、颜色覆盖、自定义 CSS
- 布局变体 — `standard`、`cockpit`、`tiled`
- 插件清单、SDK、壳层插槽、页面作用域插槽（无需覆盖即可向内置页面注入小部件）、后端 FastAPI 路由
- 完整的主题加插件综合演练（Strike Freedom 驾驶舱演示）
- 发现、重新加载和故障排除