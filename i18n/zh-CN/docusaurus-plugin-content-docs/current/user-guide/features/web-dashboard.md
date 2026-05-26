---
sidebar_position: 15
title: "Web 仪表盘"
description: "基于浏览器的仪表盘，用于管理配置、API 密钥、会话、日志、分析、定时任务和技能"
---

# Web 仪表盘

Web 仪表盘是一个基于浏览器的用户界面，用于管理您的 Hermes 智能体安装。您可以从一个简洁的网页界面配置设置、管理 API 密钥和监控会话，而无需编辑 YAML 文件或运行 CLI 命令。

## 快速开始

```bash
hermes dashboard
```

这将启动一个本地 Web 服务器，并在您的浏览器中打开 `http://127.0.0.1:9119`。仪表盘完全在您的机器上运行 — 数据不会离开本地主机。

### 选项

| 标志 | 默认值 | 描述 |
|------|---------|-------------|
| `--port` | `9119` | 运行 Web 服务器的端口 |
| `--host` | `127.0.0.1` | 绑定地址 |
| `--no-open` | — | 不要自动打开浏览器 |
| `--insecure` | 关闭 | 允许绑定到非本地主机地址（**危险** — 会在网络上暴露 API 密钥；请配合防火墙和强身份验证使用） |
| `--tui` | 关闭 | 暴露浏览器内的聊天选项卡（通过 PTY/WebSocket 嵌入的 `hermes --tui`）。或者设置 `HERMES_DASHBOARD_TUI=1`。 |

```bash
# 自定义端口
hermes dashboard --port 8080

# 绑定到所有网络接口（在共享网络上请谨慎使用）
hermes dashboard --host 0.0.0.0

# 启动但不打开浏览器
hermes dashboard --no-open

# 启用浏览器内的聊天选项卡
hermes dashboard --tui
```

## 前提条件

默认的 `hermes-agent` 安装不包含 HTTP 协议栈或 PTY 辅助工具——这些是可选组件。**Web 仪表盘** 需要 FastAPI 和 Uvicorn（`web` 附加功能）。**聊天** 标签页还需要 `ptyprocess` 来在伪终端后启动嵌入式 TUI（在 POSIX 系统上是 `pty` 附加功能）。通过以下命令安装两者：

```bash
pip install 'hermes-agent[web,pty]'
```

`web` 附加功能会引入 FastAPI/Uvicorn；`pty` 会引入 `ptyprocess`（POSIX 系统）或 `pywinpty`（原生 Windows——注意嵌入式 TUI 本身仍需 WSL）。如果你还需要消息/语音等功能，`pip install hermes-agent[all]` 会包含所有附加功能，是最简单的安装方式。

如果你在未安装依赖的情况下运行 `hermes dashboard`，它会提示你需要安装什么。如果前端尚未构建且 `npm` 可用，它会在首次启动时自动构建。

普通的 `hermes dashboard` 启动时，聊天标签页默认是关闭的。如果你想使用嵌入式浏览器聊天窗格，请使用 `hermes dashboard --tui` 启动仪表盘或设置环境变量 `HERMES_DASHBOARD_TUI=1`。

## 页面

### 状态

着陆页显示您安装环境的实时概览：

- **智能体版本** 和发布日期
- **网关状态** —— 运行中/已停止、PID、已连接的平台及其状态
- **活跃会话** —— 过去 5 分钟内活跃的会话数量
- **近期会话** —— 列出最近 20 个会话，包括模型、消息数、令牌使用量和对话预览

状态页每 5 秒自动刷新一次。

### 聊天

**聊天** 标签页将完整的 Hermes TUI（与从 `hermes --tui` 得到的界面相同）直接嵌入浏览器。您在终端 TUI 中能做的一切——斜杠命令、模型选择器、工具调用卡片、Markdown 流式输出、澄清/提权/审批提示、皮肤主题——在此处都完全一样地工作，因为仪表盘运行的是真实的 TUI 二进制文件，并通过 [xterm.js](https://xtermjs.org/) 的 WebGL 渲染器将其 ANSI 输出渲染为像素级精准的单元格布局。

**工作原理：**

- `/api/pty` 打开一个使用仪表盘会话令牌进行身份验证的 WebSocket
- 服务器在 POSIX 伪终端后启动 `hermes --tui`
- 按键操作发送到 PTY；ANSI 输出流回浏览器
- xterm.js 的 WebGL 渲染器将每个单元格绘制到整数像素网格上；鼠标追踪（SGR 1006）、宽字符（Unicode 11）和制表符字形均原生渲染
- 调整浏览器窗口大小会通过 `@xterm/addon-fit` 插件调整 TUI 的大小

**恢复现有会话：** 在 **会话** 标签页，点击任何会话旁边的播放图标（▶）。这会跳转到 `/chat?resume=<id>`，并使用 `--resume` 参数启动 TUI，加载完整历史记录。

**前提条件：**

- Node.js（与 `hermes --tui` 要求相同；TUI 包在首次启动时构建）
- `ptyprocess` —— 由 `pty` 附加功能安装（`pip install 'hermes-agent[web,pty]'` 或 `[all]` 包含两者）
- POSIX 内核（Linux、macOS 或 WSL2）。`/chat` 终端窗格特定地需要一个 POSIX PTY —— 原生 Windows Python 没有等效项，因此在原生 Windows 安装中，仪表盘的其余部分（会话、任务、指标、配置编辑器）可以工作，但 `/chat` 标签页会显示一个横幅，告知您需要使用 WSL2 才能使用该功能。

关闭浏览器标签页后，PT

## `/reload` 斜杠命令

仪表板PR还在交互式CLI中添加了`/reload`斜杠命令。在通过Web仪表板（或直接编辑`.env`文件）更改API密钥后，可在活动的CLI会话中使用`/reload`命令来获取更改，而无需重启：

```
You → /reload
  已重新加载 .env (已更新 3 个变量)
```

此命令会将`~/.hermes/.env`重新读入正在运行的进程环境。当您通过仪表板添加了新的提供程序密钥并希望立即使用时，此功能非常有用。

## REST API

Web仪表板暴露了一个REST API，前端会消费该API。您也可以直接调用这些端点以实现自动化：

### GET /api/status

返回智能体版本、网关状态、平台状态和活跃会话计数。

### GET /api/sessions

返回最近20个会话及其元数据（模型、token计数、时间戳、预览）。

### GET /api/config

以JSON格式返回当前`config.yaml`的内容。

### GET /api/config/defaults

返回默认配置值。

### GET /api/config/schema

返回描述每个配置字段的模式——类型、描述、类别以及在适用情况下的可选值。前端使用此信息为每个字段渲染正确的输入小部件。

### PUT /api/config

保存新的配置。请求体：`{"config": {...}}`。

### GET /api/env

返回所有已知的环境变量及其设置/未设置状态、脱敏后的值、描述和类别。

### PUT /api/env

设置一个环境变量。请求体：`{"key": "VAR_NAME", "value": "secret"}`。

### DELETE /api/env

删除一个环境变量。请求体：`{"key": "VAR_NAME"}`。

### GET /api/sessions/\{session_id\}

返回单个会话的元数据。

### GET /api/sessions/\{session_id\}/messages

返回会话的完整消息历史记录，包括工具调用和时间戳。

### GET /api/sessions/search

对消息内容进行全文搜索。查询参数：`q`。返回匹配的会话ID及高亮显示的片段。

### DELETE /api/sessions/\{session_id\}

删除一个会话及其消息历史记录。

### GET /api/logs

返回日志行。查询参数：`file`（智能体/错误/网关）、`lines`（数量）、`level`、`component`。

### GET /api/analytics/usage

返回token使用量、成本和会话分析。查询参数：`days`（默认30）。响应包含每日明细和按模型聚合的数据。

### GET /api/cron/jobs

返回所有已配置的定时任务及其状态、计划和运行历史。

### POST /api/cron/jobs

创建一个新的定时任务。请求体：`{"prompt": "...", "schedule": "0 9 * * *", "name": "...", "deliver": "local"}`。

### POST /api/cron/jobs/\{job_id\}/pause

暂停一个定时任务。

### POST /api/cron/jobs/\{job_id\}/resume

恢复一个已暂停的定时任务。

### POST /api/cron/jobs/\{job_id\}/trigger

立即在计划之外触发一个定时任务。

### DELETE /api/cron/jobs/\{job_id\}

删除一个定时任务。

### GET /api/skills

返回所有技能及其名称、描述、类别和启用状态。

### PUT /api/skills/toggle

启用或禁用一个技能。请求体：`{"name": "skill-name", "enabled": true}`。

### GET /api/tools/toolsets

返回所有工具集及其标签、描述、工具列表以及活动/已配置状态。

## CORS

Web服务器将CORS限制为仅允许本地来源：

- `http://localhost:9119` / `http://127.0.0.1:9119` （生产环境）
- `http://localhost:3000` / `http://127.0.0.1:3000`
- `http://localhost:5173` / `http://127.0.0.1:5173` （Vite开发服务器）

如果您在自定义端口上运行服务器，该来源会自动添加。

## 开发

如果您正在为Web仪表板前端贡献代码：

```bash
# 终端 1: 启动后端API
hermes dashboard --no-open

# 终端 2: 启动带有HMR的Vite开发服务器
cd web/
npm install
npm run dev
```

位于 `http://localhost:5173` 的Vite开发服务器会将 `/api` 请求代理到 `http://127.0.0.1:9119` 的FastAPI后端。

前端使用React 19、TypeScript、Tailwind CSS v4和类似shadcn/ui的组件构建。生产环境构建输出到 `hermes_cli/web_dist/`，FastAPI服务器会将其作为静态SPA提供服务。

## 更新时自动构建

当您运行 `hermes update` 时，如果 `npm` 可用，Web前端会自动重新构建。这使仪表板与代码更新保持同步。如果 `npm` 未安装，更新会跳过前端构建，`hermes dashboard` 将在首次启动时进行构建。

## 主题与插件

仪表板附带六个内置主题，并且可以通过用户定义的主题、插件标签页和后端API路由进行扩展——所有这些都是可插拔的，无需克隆仓库。

**在标题栏实时切换主题** —— 点击语言切换器旁边的调色板图标。选择会持久化保存到 `config.yaml` 的 `dashboard.theme` 下，并在页面加载时恢复。

内置主题：

| 主题 | 特点 |
|-------|-----------|
| **Hermes Teal** (`default`) | 深青 + 米白，系统字体，舒适间距 |
| **Hermes Teal (Large)** (`default-large`) | 与默认主题相同，但使用18px文本和更宽敞的间距 |
| **Midnight** (`midnight`) | 深蓝紫色，Inter + JetBrains Mono 字体 |
| **Ember** (`ember`) | 温暖的绯红 + 古铜色，Spectral衬线字体 + IBM Plex Mono |
| **Mono** (`mono`) | 灰度，IBM Plex，紧凑型 |
| **Cyberpunk** (`cyberpunk`) | 黑色背景上的霓虹绿，Share Tech Mono 字体 |
| **Rosé** (`rose`) | 粉红 + 象牙白，Fraunces衬线字体，宽敞 |

要构建自己的主题、添加插件标签页、注入shell插槽，或暴露插件特定的REST端点，请参阅**[扩展仪表板](./extending-the-dashboard)** —— 完整指南涵盖：

- 主题YAML模式 —— 调色板、排版、布局、资源、componentStyles、colorOverrides、customCSS
- 布局变体 —— `standard`、`cockpit`、`tiled`
- 插件清单、SDK、shell插槽、页面作用域插槽（无需覆盖内置页面即可向其注入小部件）、后端FastAPI路由
- 主题与插件结合的完整演练（Strike Freedom驾驶舱演示）
- 发现、重载与故障排除