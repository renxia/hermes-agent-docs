---
sidebar_position: 15
title: "Web Dashboard"
description: "Browser-based dashboard for managing configuration, API keys, sessions, logs, analytics, cron jobs, and skills"
---

# Web Dashboard

Web Dashboard 是一个基于浏览器的用户界面，用于管理您的 Hermes Agent 安装。您无需编辑 YAML 文件或运行 CLI 命令，即可通过简洁的 Web 界面配置设置、管理 API 密钥和监控会话。

## 快速开始

```bash
hermes dashboard
```

这会启动一个本地 Web 服务器，并在您的浏览器中打开 `http://127.0.0.1:9119`。仪表板完全在您的机器上运行——不会有任何数据离开本地主机（localhost）。

### 选项

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | `9119` | Web 服务器运行的端口 |
| `--host` | `127.0.0.1` | 绑定地址 |
| `--no-open` | — | 不自动打开浏览器 |

```bash
# 自定义端口
hermes dashboard --port 8080

# 绑定到所有接口（在共享网络上请谨慎使用）
hermes dashboard --host 0.0.0.0

# 不打开浏览器即启动
hermes dashboard --no-open
```

## 先决条件

Web Dashboard 需要 FastAPI 和 Uvicorn。使用以下命令安装它们：

```bash
pip install hermes-agent[web]
```

如果您使用 `pip install hermes-agent[all]` 安装，则 Web 依赖项已包含。

当您在没有依赖项的情况下运行 `hermes dashboard` 时，它会告诉您需要安装什么。如果前端尚未构建，并且 `npm` 可用，它将在首次启动时自动构建。

## 页面

### 状态 (Status)

着陆页显示了您的安装的实时概览：

- **Agent 版本** 和发布日期
- **网关状态** — 运行/停止、PID、连接的平台及其状态
- **活动会话** — 过去 5 分钟内活跃的会话计数
- **最近会话** — 包含最近 20 个会话列表，包括模型、消息计数、令牌使用量和对话预览

状态页面每 5 秒自动刷新一次。

### 配置 (Config)

这是一个用于编辑 `config.yaml` 的基于表单的编辑器。所有 150 多个配置字段都从 `DEFAULT_CONFIG` 自动发现，并组织成分标签的类别：

- **model** — 默认模型、提供商、基础 URL、推理设置
- **terminal** — 后端（本地/docker/ssh/modal）、超时、Shell 偏好设置
- **display** — 皮肤、工具进度、恢复显示、旋转器设置
- **agent** — 最大迭代次数、网关超时、服务层级
- **delegation** — 子 Agent 限制、推理努力程度
- **memory** — 提供商选择、上下文注入设置
- **approvals** — 危险命令批准模式（询问/yolo/拒绝）
- 更多 — `config.yaml` 的每个部分都有相应的表单字段

具有已知有效值（终端后端、皮肤、批准模式等）的字段会渲染为下拉菜单。布尔值渲染为开关。其他所有内容都是文本输入框。

**操作：**

- **保存 (Save)** — 立即将更改写入 `config.yaml`
- **重置为默认值 (Reset to defaults)** — 将所有字段恢复到默认值（直到您点击保存才会实际保存）
- **导出 (Export)** — 将当前配置下载为 JSON
- **导入 (Import)** — 上传 JSON 配置文件以替换当前值

:::tip
配置更改将在下一次 Agent 会话或网关重启时生效。Web Dashboard 编辑的正是 `hermes config set` 和网关读取的同一个 `config.yaml` 文件。
:::

### API 密钥 (API Keys)

管理存储 API 密钥和凭证的 `.env` 文件。密钥按类别分组：

- **LLM 提供商** — OpenRouter、Anthropic、OpenAI、DeepSeek 等。
- **工具 API 密钥** — Browserbase、Firecrawl、Tavily、ElevenLabs 等。
- **消息平台** — Telegram、Discord、Slack bot token 等。
- **Agent 设置** — 非秘密环境变量，如 `API_SERVER_ENABLED`

每个密钥显示：
- 当前是否设置（并显示了经过脱敏的预览值）
- 描述其用途
- 链接到提供商的注册/密钥页面
- 用于设置或更新值的输入字段
- 用于删除密钥的删除按钮

高级/不常用的密钥默认隐藏在开关后面。

### 会话 (Sessions)

浏览和检查所有 Agent 会话。每行显示会话标题、来源平台图标（CLI、Telegram、Discord、Slack、cron）、模型名称、消息计数、工具调用计数以及上次活跃时间。实时会话会用脉冲徽章标记。

- **搜索 (Search)** — 使用 FTS5 对所有消息内容进行全文搜索。结果会显示高亮片段，并在展开时自动滚动到第一个匹配消息。
- **展开 (Expand)** — 点击会话以加载完整的消息历史记录。消息按角色（用户、助手、系统、工具）进行颜色编码，并渲染为带有语法高亮的 Markdown 格式。
- **工具调用 (Tool calls)** — 带有工具调用的助手消息会显示可折叠块，包含函数名称和 JSON 参数。
- **删除 (Delete)** — 使用垃圾桶图标删除会话及其消息历史记录。

### 日志 (Logs)

查看带有过滤和实时跟踪功能的 Agent、网关和错误日志文件。

- **文件 (File)** — 在 `agent`、`errors` 和 `gateway` 日志文件之间切换
- **级别 (Level)** — 按日志级别过滤：ALL、DEBUG、INFO、WARNING 或 ERROR
- **组件 (Component)** — 按源组件过滤：all、gateway、agent、tools、cli 或 cron
- **行数 (Lines)** — 选择要显示的行数（50、100、200 或 500）
- **自动刷新 (Auto-refresh)** — 切换每 5 秒轮询一次新日志行的实时跟踪功能
- **颜色编码 (Color-coded)** — 日志行按严重性着色（错误为红色，警告为黄色，调试为暗色）

### 分析 (Analytics)

从会话历史记录计算的使用量和成本分析。选择一个时间周期（7、30 或 90 天）查看：

- **摘要卡片 (Summary cards)** — 总令牌数（输入/输出）、缓存命中百分比、总预估或实际成本以及每日平均的会话总数
- **每日令牌图表 (Daily token chart)** — 堆叠条形图，显示每日的输入和输出令牌使用量，鼠标悬停时显示细分和成本
- **每日明细表 (Daily breakdown table)** — 日期、会话数、输入令牌数、输出令牌数、缓存命中率和成本
- **按模型细分 (Per-model breakdown)** — 显示使用的每个模型、其会话数、令牌使用量和预估成本的表格

### Cron

创建和管理定期运行 Agent 提示的计划 Cron 任务。

- **创建 (Create)** — 填写名称（可选）、提示、Cron 表达式（例如 `0 9 * * *`）和交付目标（本地、Telegram、Discord、Slack 或电子邮件）
- **任务列表 (Job list)** — 每个任务显示其名称、提示预览、计划表达式、状态徽章（启用/暂停/错误）、交付目标、上次运行时间和下次运行时间
- **暂停/恢复 (Pause / Resume)** — 在活动和暂停状态之间切换任务
- **立即触发 (Trigger now)** — 在其正常计划之外立即执行任务
- **删除 (Delete)** — 永久删除 Cron 任务

### Skills

浏览、搜索和切换技能和工具集。技能从 `~/.hermes/skills/` 加载，并按类别分组。

- **搜索 (Search)** — 按名称、描述或类别过滤技能和工具集
- **类别筛选 (Category filter)** — 点击类别标签缩小列表范围（例如 MLOps、MCP、红队测试、AI）
- **切换 (Toggle)** — 使用开关启用或禁用单个技能。更改将在下次会话中生效。
- **工具集 (Toolsets)** — 一个单独的部分显示内置工具集（文件操作、网页浏览等），包括其活动/非活动状态、设置要求和包含的工具列表

:::warning 安全警告
Web Dashboard 读取和写入您的 `.env` 文件，其中包含 API 密钥和秘密凭证。它默认绑定到 `127.0.0.1`——只能从您的本地机器访问。如果您绑定到 `0.0.0.0`，网络上的任何人都可以查看和修改您的凭证。该仪表板本身没有认证机制。
:::

## `/reload` 斜杠命令

Dashboard 的 PR 还为交互式 CLI 添加了一个 `/reload` 斜杠命令。在通过 Web Dashboard（或直接编辑 `.env`）更改 API 密钥后，在活动的 CLI 会话中使用 `/reload` 可以无需重启即可加载更改：

```
You → /reload
  Reloaded .env (3 var(s) updated)
```

这会将 `~/.hermes/.env` 重新读取到正在运行进程的环境中。当您通过 Dashboard 添加了新的提供商密钥并希望立即使用它时，这非常有用。

## REST API

Web Dashboard 暴露了一个 REST API，供前端消费。您也可以直接调用这些端点进行自动化：

### GET /api/status

返回 Agent 版本、网关状态、平台状态和活动会话计数。

### GET /api/sessions

返回最近的 20 个会话及其元数据（模型、令牌计数、时间戳、预览）。

### GET /api/config

以 JSON 格式返回当前的 `config.yaml` 内容。

### GET /api/config/defaults

返回默认的配置值。

### GET /api/config/schema

返回描述每个配置字段的模式——包括类型、描述、类别和适用选择选项。前端使用此信息为每个字段渲染正确的输入控件。

### PUT /api/config

保存新的配置。Body: `{"config": {...}}`。

### GET /api/env

返回所有已知的环境变量及其设置/未设置状态、脱敏值、描述和类别。

### PUT /api/env

设置一个环境变量。Body: `{"key": "VAR_NAME", "value": "secret"}`。

### DELETE /api/env

移除一个环境变量。Body: `{"key": "VAR_NAME"}`。

### GET /api/sessions/\{session_id\}

返回单个会话的元数据。

### GET /api/sessions/\{session_id\}/messages

返回会话的完整消息历史记录，包括工具调用和时间戳。

### GET /api/sessions/search

跨消息内容的全文搜索。查询参数：`q`。返回包含高亮片段的匹配会话 ID。

### DELETE /api/sessions/\{session_id\}

删除会话及其消息历史记录。

### GET /api/logs

返回日志行。查询参数：`file` (agent/errors/gateway)、`lines` (数量)、`level`、`component`。

### GET /api/analytics/usage

返回令牌使用量、成本和会话分析。查询参数：`days` (默认 30)。响应包括每日明细和按模型聚合数据。

### GET /api/cron/jobs

返回所有配置的 Cron 任务及其状态、计划和运行历史。

### POST /api/cron/jobs

创建新的 Cron 任务。Body: `{"prompt": "...", "schedule": "0 9 * * *", "name": "...", "deliver": "local"}`。

### POST /api/cron/jobs/\{job_id\}/pause

暂停一个 Cron 任务。

### POST /api/cron/jobs/\{job_id\}/resume

恢复一个已暂停的 Cron 任务。

### POST /api/cron/jobs/\{job_id\}/trigger

立即触发一个 Cron 任务，脱离其正常计划。

### DELETE /api/cron/jobs/\{job_id\}

删除一个 Cron 任务。

### GET /api/skills

返回所有技能及其名称、描述、类别和启用状态。

### PUT /api/skills/toggle

启用或禁用一个技能。Body: `{"name": "skill-name", "enabled": true}`。

### GET /api/tools/toolsets

返回所有工具集及其标签、描述、工具列表和活动/配置状态。

## CORS

Web 服务器将 CORS 限制为本地主机源：

- `http://localhost:9119` / `http://127.0.0.1:9119` (生产环境)
- `http://localhost:3000` / `http://127.0.0.1:3000`
- `http://localhost:5173` / `http://127.0.0.1:5173` (Vite 开发服务器)

如果您的服务器运行在自定义端口上，该源会自动添加。

## 开发 (Development)

如果您正在为 Web Dashboard 前端贡献代码：

```bash
# 终端 1：启动后端 API
hermes dashboard --no-open

# 终端 2：启动带有 HMR 的 Vite 开发服务器
cd web/
npm install
npm run dev
```

Vite 开发服务器在 `http://localhost:5173` 代理 `/api` 请求到 FastAPI 后端 `http://127.0.0.1:9119`。

前端使用 React 19、TypeScript、Tailwind CSS v4 和 shadcn/ui-style 组件构建。生产构建输出到 `hermes_cli/web_dist/`，该目录由 FastAPI 服务器作为静态 SPA 提供服务。

## 自动更新构建 (Automatic Build on Update)

当您运行 `hermes update` 时，如果 `npm` 可用，Web 前端会自动重建。这确保了仪表板与代码更新保持同步。如果未安装 `npm`，则更新会跳过前端构建，而 `hermes dashboard` 将在首次启动时执行构建。

## 主题 (Themes)

仪表板支持视觉主题，可以改变颜色、覆盖效果和整体感觉。您可以在标题栏实时切换主题——点击语言切换器旁边的调色板图标。

### 内置主题 (Built-in Themes)

| Theme | Description |
|-------|-------------|
| **Hermes Teal** | 经典深青色（默认） |
| **Midnight** | 深蓝紫，带有清爽的强调色 |
| **Ember** | 温暖的深红色和青铜色 |
| **Mono** | 干净的灰度，极简风格 |
| **Cyberpunk** | 黑底霓虹绿 |
| **Rosé** | 柔和的粉色和温暖的象牙白 |

主题选择会持久化到 `config.yaml` 的 `dashboard.theme` 下，并在页面加载时恢复。

### 自定义主题 (Custom Themes)

在 `~/.hermes/dashboard-themes/` 创建一个 YAML 文件：

```yaml
# ~/.hermes/dashboard-themes/ocean.yaml
name: ocean
label: Ocean
description: Deep sea blues with coral accents

colors:
  background: "#0a1628"
  foreground: "#e0f0ff"
  card: "#0f1f35"
  card-foreground: "#e0f0ff"
  primary: "#ff6b6b"
  primary-foreground: "#0a1628"
  secondary: "#152540"
  secondary-foreground: "#e0f0ff"
  muted: "#1a2d4a"
  muted-foreground: "#7899bb"
  accent: "#1f3555"
  accent-foreground: "#e0f0ff"
  destructive: "#fb2c36"
  destructive-foreground: "#fff"
  success: "#4ade80"
  warning: "#fbbf24"
  border: "color-mix(in srgb, #ff6b6b 15%, transparent)"
  input: "color-mix(in srgb, #ff6b6b 15%, transparent)"
  ring: "#ff6b6b"
  popover: "#0f1f35"
  popover-foreground: "#e0f0ff"

overlay:
  noiseOpacity: 0.08
  noiseBlendMode: color-dodge
  warmGlowOpacity: 0.15
  warmGlowColor: "rgba(255,107,107,0.2)"
```

这 21 个颜色令牌直接映射到仪表板中使用的 CSS 自定义属性。自定义主题所有字段都是必需的。`overlay` 部分是可选的——它控制颗粒纹理和环境发光效果。

创建文件后请刷新仪表板。自定义主题将与内置主题一起出现在主题选择器中。

### 主题 API (Theme API)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/themes` | GET | 列出可用主题 + 当前活动名称 |
| `/api/dashboard/theme` | PUT | 设置活动主题。Body: `{"name": "midnight"}` |