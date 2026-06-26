---
sidebar_position: 15
title: "Web Dashboard"
description: "浏览器版管理面板，用于管理配置、API密钥、MCP服务器、消息配对、Webhooks、网关、内存、凭证、会话、日志、分析、定时任务和技能"
---

# Web Dashboard

Web Dashboard 是一个用于管理您的 Hermes 智能体安装的基于浏览器的 UI。您无需编辑 YAML 文件或运行 CLI 命令，即可从干净的 Web 界面配置设置、管理 API 密钥并监控会话。

:::tip
托管模式认证使用 Nous Portal OAuth；如果您还希望仪表板与真实的后端进行通信，`hermes setup --portal` 也会连接模型和工具网关。请参阅 [Nous Portal](/integrations/nous-portal)。
:::

## Quick Start

```bash
hermes dashboard
```

这会启动一个本地 Web 服务器，并在您的浏览器中打开 `http://127.0.0.1:9119`。该仪表板完全在您的机器上运行——没有任何数据会离开 localhost。

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | `9119` | 运行 Web 服务器的端口 |
| `--host` | `127.0.0.1` | 绑定地址 |
| `--no-open` | — | 不自动打开浏览器 |
| `--insecure` | off | 允许绑定到非 localhost 主机 (**危险** — 会在网络上暴露 API 密钥；请与防火墙和强认证配对) |
| `--isolated` | off | 当从命名配置文件（`worker dashboard`）启动时，而不是路由到机器仪表板，则运行专用的按配置文件划分的服务器 |

```bash
# 自定义端口
hermes dashboard --port 8080

# 绑定到所有接口（在共享网络上使用需谨慎）
hermes dashboard --host 0.0.0.0

# 不打开浏览器即启动
hermes dashboard --no-open
```

## 管理多个配置档案 (Profiles)

仪表板是一个**机器级别**的管理界面：一台服务器管理这台机器上的所有[配置档案](../profiles.md)。一个位于侧边栏的配置档案切换器（当存在多个配置档案时可见）决定了管理页面读取和写入哪个配置档案——Config、API 密钥、技能、MCP、模型和聊天标签页都遵循此设置。当选择了非仪表板自身的配置档案时，琥珀色的横幅会显示正在管理的配置档案名称，以确保写入目标不会产生歧义。

选择存储在 URL 中（`?profile=<name>`），因此像 `http://127.0.0.1:9119/skills?profile=worker` 这样的深度链接会带着预选定的切换器加载并能通过刷新保持状态。

从配置档案别名启动仪表板，而不是启动第二个服务器，而是路由到机器级别的仪表板：

```bash
worker dashboard
# → 已经在运行: 在 ?profile=worker 处打开浏览器
# → 未运行: 带着 "worker" 预选定启动机器仪表板
```

添加 `--isolated` 参数可以退出此功能，并运行一个仅针对该配置档案的专用服务器（这是在统一之前的功能——如果您故意暴露具有不同身份验证的不同配置档案的仪表板时非常有用）。

**聊天 (Chat)** 标签页也遵循此设置：一个限定范围的聊天会使用所选配置档案的 `HERMES_HOME` 启动其 PTY 子进程，因此对话将使用该配置档案的模型、技能、内存和会话历史。切换配置档案会开始一个新的终端会话。

哪些内容是针对每个配置档案且**不会**被切换器吸收：网关进程（通过 `hermes -p <name> gateway …` 进行管理）、每个配置档案的会话数据库以及定时任务调度程序（Cron 页面已经使用自己的过滤器跨所有配置档案进行聚合）。

## 先决条件 (Prerequisites)

默认的 `hermes-agent` 安装包不包含 HTTP 堆栈或 PTY 辅助工具——这些都是可选的额外功能。**Web 仪表板**需要 FastAPI 和 Uvicorn (`web` 额外功能)。**聊天**标签页还需要 `ptyprocess` 来在伪终端后启动嵌入式 TUI (`pty` POSIX 额外功能)。使用以下命令安装两者：

```bash
cd ~/.hermes/hermes-agent && uv pip install -e ".[web,pty]"
```

`web` 额外功能会拉取 FastAPI/Uvicorn；`pty` 会拉取 `ptyprocess` (POSIX) 或 `pywinpty` (原生 Windows——请注意，嵌入式 TUI 本身仍然需要 WSL)。使用 `cd ~/.hermes/hermes-agent && uv pip install -e ".[all]"` 可以包含所有额外功能，如果还想使用消息传递/语音等功能，这是最简单的路径。

如果您在没有依赖项的情况下运行 `hermes dashboard`，它会告诉您需要安装什么。如果前端尚未构建，并且有 `npm` 可用，它将在首次启动时自动构建。

聊天标签页是每次 `hermes dashboard` 启动的一部分——嵌入式浏览器聊天窗格（在 PTY/WebSocket 上运行 TUI）始终可用，无需额外的标志。

## 页面 (Pages)

### 状态 (Status)

落地页显示您的安装实时概览：

- **智能体版本**和发布日期
- **网关状态**——正在运行/已停止、PID、连接的平台及其状态
- **活动会话**——过去 5 分钟内活动的会话计数
- **最近会话**——包含模型、消息数、令牌使用量和对话预览的 20 个最新会话列表

状态页面每 5 秒自动刷新一次。

### 聊天 (Chat)

**聊天**标签页将完整的 Hermes TUI（与 `hermes --tui` 获得的相同界面）直接嵌入到浏览器中。您在终端 TUI 中能做的一切——斜杠命令、模型选择器、工具调用卡片、Markdown 流式传输、澄清/sudo/批准提示、皮肤主题化——都可以在这里完全一致地工作，因为仪表板正在运行真实的 TUI 二进制文件，并通过 [xterm.js](https://xtermjs.org/) 及其 WebGL 渲染器将 ANSI 输出渲染成像素完美的单元格布局。

**工作原理：**

- `/api/pty` 打开一个使用仪表板会话令牌进行身份验证的 WebSocket
- 服务器在 POSIX 伪终端后启动 `hermes --tui`
-按键输入传输到 PTY；ANSI 输出流式传输回浏览器
-xterm.js 的 WebGL 渲染器将每个单元格绘制成一个整数像素网格；鼠标跟踪 (SGR 1006)、宽字符 (Unicode 11) 和框线图形都原生渲染
-调整浏览器窗口大小会通过 `@xterm/addon-fit` 附加组件来调整 TUI

**恢复现有会话：** 从**会话**标签页，点击任何会话旁边的播放图标（▶）。这将跳转到 `/chat?resume=<id>` 并使用 `--resume` 启动 TUI，加载完整的历史记录。

**会话切换器（右侧边栏）：** 聊天标签页在其旁边的一个细窄的右侧边栏中带有自己的 ChatGPT 式对话列表，因此您可以不离开页面地切换对话。该边栏将模型选择器堆叠在顶部，会话列表直接位于其下方；终端占据屏幕的大部分空间。列表中显示了针对活动配置档案的最近期会话——标题（回退到消息预览）、相对上次活动时间、消息数和非 CLI 会话的来源渠道。点击任何一行即可原地恢复它（终端会重新生成该对话的历史记录）；活动的会话会被高亮显示。**新聊天**会开始一个新的会话，刷新控件会重新拉取列表。此边栏是只读的，用于切换——删除、重命名和批量清理仍然在**会话**标签页上进行。在窄屏上，它会折叠成一个滑出面板。

**先决条件：**

- Node.js（与 `hermes --tui` 相同的要求；TUI 包会在首次启动时构建）
- `ptyprocess`——由 `pty` 额外功能安装（`cd ~/.hermes/hermes-agent && uv pip install -e ".[web,pty]"`, 或 `[all]` 都涵盖了）
- POSIX 内核（Linux、macOS 或 WSL2）。`/chat` 终端窗格特别需要一个 POSIX PTY——原生 Windows Python 没有等效物，因此在原生 Windows 安装上，仪表板的其他部分（会话、任务、指标、配置编辑器）都可以正常工作，但 `/chat` 标签页将显示一个横幅提示您使用 WSL2 来实现此功能。

关闭浏览器标签页后，PTY 会被服务器干净地回收。重新打开会启动一个新的会话。

要指示 [Hermes Desktop](#connecting-hermes-desktop-to-a-remote-backend) 连接到另一台机器上运行的仪表板而不是它自己的捆绑后端，请参阅下面的远程后端部分。

### 连接 Hermes Desktop 到远程后端 (Connecting Hermes Desktop to a remote backend)

Hermes Desktop 通常会启动自己的本地后端，但它也可以通过**设置 → 网关 → 远程网关**附加到在远程机器（虚拟机、家庭实验室设备等）上运行的仪表板。这是“Desktop 说后端已就绪，但聊天从未工作”报告最常见的原因，因为 Desktop 的就绪性检查所验证的内容少于实时聊天连接实际需要的。

:::info 先决条件：必须在远程主机上运行一个 `hermes dashboard`
Desktop 连接的“远程后端”**就是一个**在远程机器上运行的 `hermes dashboard` 进程——即本页面所描述的同一台服务器。在任何步骤之前，它都必须处于运行且可达的状态；Desktop 会连接到它，而不是为它启动。请确保它在 `systemd`/`tmux`/等服务下运行，以便它能存活下来并抵抗重启。**网关**（Telegram/Discord/Slack/等）是一个*独立的*长期运行进程——如果您依赖消息通道，请独立地启动它；它不是 Desktop 应用连接的对象。
:::

Desktop 的“远程后端已就绪”探针只命中 `GET /api/status`，这是一个公共端点——只要主机上任何仪表板正在运行，它就会回答。实时聊天连接是到 `/api/ws`（以及 `/api/pty`）的一个**独立** WebSocket，而该套接字受到两个状态探针从未触及的检查：

1. **您必须经过身份验证。** 当仪表板绑定到一个非回环地址时，它会激活其身份验证网关。请用用户名和密码保护它（捆绑的[用户名/密码提供者](#usernamepassword-provider-no-oauth-idp)）；Desktop 一次性登录并使用单个使用票据来重用由此产生的会话。如果没有配置提供者，非回环仪表板在启动时**关闭失败**。
2. **绑定主机必须允许客户端并且匹配 Host 标头。** 回环绑定（`127.0.0.1`）只接受回环客户端，因此无论凭证如何，远程机器都会在套接字层被拒绝。请绑定到一个非回环地址（`--host 0.0.0.0`），以便对等 IP 保护允许远程客户端通过。您在 Desktop 中输入的远程 URL 必须能到达它所绑定的同一主机——DNS 重绑定网关要求 Host 标头匹配。

#### 远程仪表板设置 (Remote dashboard setup)

设置用户名和密码，然后运行绑定到可达地址的仪表板。对于 `systemd` 服务：

```ini
[Service]
EnvironmentFile=%h/.hermes/.env
ExecStart=/path/to/venv/bin/python -m hermes_cli.main dashboard \
    --host 0.0.0.0 --port 9119 --no-open
```

其中 `~/.hermes/.env` 包含：

```bash
HERMES_DASHBOARD_BASIC_AUTH_USERNAME=admin
HERMES_DASHBOARD_BASIC_AUTH_PASSWORD=choose-a-strong-password
HERMES_DASHBOARD_BASIC_AUTH_SECRET=<32+ 个随机字节; openssl rand -base64 32>
```

然后，在 Desktop 中输入**远程 URL**（例如 `http://VM_IP:9119`）并使用该用户名和密码**登录**。请参阅[用户名/密码提供者](#usernamepassword-provider-no-oauth-idp) 部分以获取完整的配置界面。

:::tip 在重试之前验证网关
从任何机器上，检查仪表板是否提供了用户名/密码提供者：

```bash
curl -s http://VM_IP:9119/api/status | jq '.auth_required, .auth_providers'
# true
# ["basic"]
```

- `auth_required: true` 且提供者列表中有 `"basic"` → Desktop 的**登录**流程将有效。
- `auth_required: false` → 绑定是回环的，或者网关没有激活。请绑定到一个非回环地址。
- `auth_required: true` 但没有 `"basic"` 提供者 → 用户名/密码环境变量未加载。请先修复这些问题。
:::

如果 `/api/status` 显示网关已启用且包含 `"basic"` 提供者，但您登录后 Desktop **仍然**无法连接，那么问题超出了基本设置——获取一份新的 `desktop.log`（设置 → 网关 → 打开日志）以及同一重试窗口内的仪表板日志，并查找 `/api/ws` 的关闭代码（4403 = 请求网关拒绝聊天 WS，例如 Host/peer 不匹配；4401 = WS 票据未通过身份验证）。

### 配置 (Config)

一个用于 `config.yaml` 的基于表单的编辑器。所有 150+ 个配置字段都从 `DEFAULT_CONFIG` 自动发现并组织到分标签的类别中：

![配置管理页面 — 左侧的区域过滤器，右侧的自动发现字段](/img/dashboard/admin-config.png)

- **模型 (model)** — 默认模型、提供者、基础 URL、推理设置
- **终端 (terminal)** — 后端（本地/docker/ssh/modal）、超时、Shell 偏好设置
- **显示 (display)** — 皮肤、工具进度、恢复显示、旋转器设置
- **智能体 (agent)** — 最大迭代次数、网关超时、服务层级
- **委派 (delegation)** — 子智能体限制、推理努力程度
- **内存 (memory)** — 提供者选择、上下文注入设置
- **批准 (approvals)** — 危险命令批准模式（询问/yolo/拒绝）
- 以及更多——config.yaml 的每个部分都有相应的表单字段

具有已知有效值的字段（终端后端、皮肤、批准模式等）渲染为下拉菜单。布尔值渲染为开关。其他所有内容都是文本输入。

**操作：**

- **保存 (Save)** — 立即将更改写入 `config.yaml`
- **重置为默认值 (Reset to defaults)** — 将所有字段恢复到默认值（点击保存前不会保存）
- **导出 (Export)** — 将当前配置下载为 JSON
- **导入 (Import)** — 上传一个 JSON 配置文件以替换当前值

:::tip
配置更改将在下一个智能体会话或网关重启时生效。Web 仪表板编辑的是与 `hermes config set` 和网关读取的同一个 `config.yaml` 文件。
:::

### API 密钥 (API Keys)

管理存储 API 密钥和凭据的 `.env` 文件。密钥按类别分组：

- **LLM 提供者** — OpenRouter, Anthropic, OpenAI, DeepSeek 等。
- **工具 API 密钥** — Browserbase, Firecrawl, Tavily, ElevenLabs 等。
- **消息平台** — Telegram, Discord, Slack bot tokens 等。
- **智能体设置 (Agent Settings)** — 非秘密环境变量，如 `API_SERVER_ENABLED`

每个密钥都显示：
- 它是否已设置（带有值的脱敏预览）
- 它的用途描述
- 一个链接到提供者的注册/密钥页面
- 用于设置或更新值的输入字段
- 一个删除按钮用于移除它

高级/不常用的密钥默认是隐藏的，位于一个切换开关后。

### 会话 (Sessions)

浏览和检查所有智能体会话。每一行都显示会话标题、来源平台图标（CLI, Telegram, Discord, Slack, cron）、模型名称、消息计数、工具调用计数以及上次活动时间。实时会话会有一个脉动的徽章标记。

- **搜索 (Search)** — 使用 FTS5 对所有消息内容进行全文搜索。结果显示高亮片段，并在展开时自动滚动到第一个匹配的消息。
- **统计信息 (Stats)** — 一个摘要栏显示总会话数、存储中活动的数量、归档计数、总消息数以及按来源的细分。
- **展开 (Expand)** — 点击一个会话以加载其完整的消息历史记录。消息按角色（用户、助手、系统、工具）着色，并作为带有语法高亮的 Markdown 渲染。
- **工具调用 (Tool calls)** — 包含工具调用的助手消息会显示具有函数名和 JSON 参数的可折叠块。
- **重命名 (Rename)** — 在线设置或清除会话的标题（铅笔图标）。
- **导出 (Export)** — 将一个会话（元数据 + 完整消息历史记录）下载为 JSON（下载图标）。
- **修剪 (Prune)** — “修剪旧会话”按钮删除 N 天以前结束的会话。
- **删除 (Delete)** — 使用垃圾桶图标移除一个会话及其消息历史记录。

![会话管理页面 — 统计栏、修剪和每行重命名/导出/删除](/img/dashboard/admin-sessions.png)

### 日志 (Logs)

查看带有过滤和实时尾随的智能体、网关和错误日志文件。

- **文件 (File)** — 在 `agent`、`errors` 和 `gateway` 日志文件之间切换
- **级别 (Level)** — 按日志级别过滤：ALL, DEBUG, INFO, WARNING 或 ERROR
- **组件 (Component)** — 按来源组件过滤：all, gateway, agent, tools, cli 或 cron
- **行数 (Lines)** — 选择要显示的行数（50、100、200 或 500）
- **自动刷新 (Auto-refresh)** — 切换每 5 秒轮询新日志行的实时尾随功能
- **颜色编码 (Color-coded)** — 日志行按严重性着色（错误为红色，警告为黄色，调试为暗色）

### 分析 (Analytics)

从会话历史计算使用量和成本。选择一个时间段（7、30 或 90 天）来查看：

- **摘要卡片** — 总令牌数（输入/输出）、缓存命中百分比、总估算或实际成本以及每日平均值的总会话计数
- **每日令牌图表** — 显示每天输入和输出令牌使用量的堆叠条形图，悬停提示显示细分和成本
- **每日细分表格** — 日期、会话数、输入令牌、输出令牌、缓存命中率和每日成本
- **按模型细分** — 显示使用的每个模型、其会话数、令牌使用量和估算成本的表格

### 定时任务 (Cron)

创建和管理在定期时间运行智能体提示的定时任务。

- **创建 (Create)** — 填写名称（可选）、提示、cron 表达式（例如 `0 9 * * *`）和交付目标（本地、Telegram、Discord, Slack 或电子邮件）
- **任务列表 (Job list)** — 每个任务都显示其名称、提示预览、调度表达式、状态徽章（已启用/已暂停/错误）、交付目标、上次运行时间和下次运行时间
- **暂停 / 恢复 (Pause / Resume)** — 在活动和暂停状态之间切换一个任务
- **编辑 (Edit)** — 打开一个预填充的模态框来更改任务的提示、调度、名称或交付目标
- **立即触发 (Trigger now)** — 立即执行一个不在正常时间表内的任务
- **删除 (Delete)** — 永久移除一个定时任务

### 配置档案 (Profiles)

创建和管理[配置档案](../profiles.md)——拥有自己配置、技能和会话的隔离 Hermes 实例。

- **配置档案卡片** — 每个都显示其模型/提供者、技能计数、网关状态、描述和徽章（活动、默认、别名）
- **创建 (Create)** — 名称 + 可选地从默认值克隆 / 克隆所有内容 / 无捆绑技能，描述和模型；专用配置档案构建器页面（`/profiles/new`）提供了完整的流程（模型、MCPs、技能）。
- **管理技能和工具 (Manage skills & tools)** — 跳转到针对该配置档案的技能页面（设置侧边栏的配置档案切换器）。
- **设置为活动 (Set as active)** — 翻转**未来的 CLI/网关运行**所选择的粘性默认值（与 `hermes profile use` 相同）。这*不*改变仪表板管理的内容——那是配置档案切换器的工作。
- **编辑模型 / 描述 / SOUL** — 直接在该配置档案中进行编辑
- **重命名 / 删除 (Rename / Delete)** — 仅限命名的配置档案

### 技能 (Skills)

浏览、搜索和切换已安装的技能和工具集，并从中心库安装新的技能。技能是从 `~/.hermes/skills/` 加载的，并按类别分组。

- **搜索 (Search)** — 按名称、描述或类别过滤已安装的技能和工具集。
- **类别过滤器 (Category filter)** — 点击类别药丸以缩小列表（例如 MLOps, MCP, Red Teaming, AI）。
- **切换 (Toggle)** — 使用开关启用或禁用单个技能。更改将在下一个会话中生效。
- **工具集 (Toolsets)** — 一个单独的视图显示内置工具集（文件操作、网页浏览等）及其活动/非活动状态、设置要求和包含的工具列表。
- **浏览中心库 (Browse hub)** — 第三个视图搜索所有来源的技能中心（与 `hermes skills search` 相同），通过标识符安装任何结果，并提供实时安装日志，以及一个“更新所有”按钮来刷新已安装的技能。

![技能管理页面 — 浏览中心库视图：搜索、安装和更新](/img/dashboard/admin-skills-hub.png)

### MCP

在没有 CLI 的情况下管理[MCP](/integrations/mcp) 服务器。这与 `hermes mcp` 读取的 `config.yaml` 中的同一 `mcp_servers` 块相同。

**您的 MCP 服务器：**

- **添加 (Add)** — 注册一个 HTTP/SSE 服务器（URL）或一个 stdio 服务器（命令 + 参数），并提供可选的 `KEY=VALUE` 环境变量用于 stdio 服务器。
- **启用 / 禁用 (Enable / disable)** — 在不删除它的情况下切换服务器的开启或关闭状态。被禁用的服务器仍保留在配置中，以便您稍后可以重新启用它。将在下一次网关重启时生效。
- **测试 (Test)** — 连接到服务器、列出其工具并断开连接——验证智能体依赖它之前的连接。
- **移除 (Remove)** — 从配置中删除一个服务器。
- 秘密形式的环境变量在列表视图中会被脱敏。

**目录 (Catalog):** 浏览 Nous 批准的 MCP 服务器（捆绑的 `optional-mcps/` 目录）并一键安装其中任何一个。需要 API 密钥的项目会提示您输入，这些值将存入 `.env`。这与 `hermes mcp catalog` / `hermes mcp install` 使用的目录相同。

![MCP 管理页面 — 您的服务器及其启用/禁用切换，以及安装目录](/img/dashboard/admin-mcp.png)

### Webhooks (网络钩子)

管理动态[网络钩子订阅](/user-guide/messaging/webhooks)。消息传递设置中必须先启用网络钩子平台；如果未启用，页面会提供提示。

- **创建 (Create)** — 名称、描述、事件过滤器、交付目标、可选的直接交付模式和智能体提示。创建时，页面会显示路由 URL 和一次性 HMAC 密钥供复制。
- **启用 / 禁用 (Enable / disable)** — 切换订阅的开启或关闭状态。被禁用的路由仍保留在订阅文件中，但网关会拒绝它们的传入事件（403）。网关会热重载该文件，因此更改将在下一个事件中生效——无需重启。
- **列表 (List)** — 每个订阅都显示其 URL、事件和交付目标。
- **删除 (Delete)** — 移除一个订阅。

![Webhooks 管理页面 — 带有启用/禁用切换的订阅](/img/dashboard/admin-webhooks.png)

### 配对 (Pairing)

在没有 CLI 的情况下批准和撤销消息用户——远程管理员如何将 Telegram/Discord/等用户加入到配对网关。与 `hermes pairing` 完全一致。

- **待定请求 (Pending requests)** — 每个都显示平台、代码、用户和年龄，并有一个“批准”按钮。
- **已批准用户 (Approved users)** — 每个都显示平台和用户，并有一个“撤销”按钮。
- **清除待定 (Clear pending)** — 丢弃所有未完成的配对代码。

![配对管理页面](/img/dashboard/admin-pairing.png)

### 通道 (Channels)

从浏览器连接到任何消息平台——与 `hermes setup gateway` 完全一致。该页面列出了所有支持的通道（Telegram, Discord, Slack, Matrix, Mattermost, WhatsApp, Signal, BlueBubbles/iMessage, Email, SMS/Twilio, DingTalk, Feishu/Lark, WeCom, WeChat, QQ Bot, Yuanbao，以及 API 服务器和网络钩子端点）及其实时连接状态。

- **配置 (Configure)** — 打开一个包含通道所需的精确字段（bot token、app token、服务器 URL、白名单等）的平台特定表单。秘密以密码输入的形式渲染并被存储为脱敏；留空字段将保留现有值。必填字段均有标记和验证。一个“设置指南”链接指向该平台的凭证文档。
- **启用 / 禁用 (Enable / disable)** — 切换通道的开启或关闭状态。凭证仍保存在磁盘上；只有活动状态发生了变化。
- **测试 (Test)** — 检查通道是否已配置、已启用，并且网关正在报告实时连接。
- **重启网关 (Restart gateway)** — 凭证被写入 `~/.hermes/.env` 和启用的标志被写入 `config.yaml`；网关会在下一次重启时连接每个启用的通道，您可以直接从页面上触发此操作。

![通道管理页面 — 所有消息平台的状态、启用切换和平台特定设置表单](/img/dashboard/admin-channels.png)

### 系统 (System)

一个用于安装级别操作的集中式管理面板：

- **主机 (Host)** — 实时系统统计信息：操作系统 / 内核、架构、主机名、Python 和 Hermes 版本、CPU 核心数 + 利用率、内存、Hermes home 的磁盘使用量、正常运行时间和负载平均值。（CPU/内存/磁盘来自 `psutil`，如果已安装；身份字段始终显示。）Hermes 版本会显示一个**更新状态徽章**（最新 / N 个提交落后）和一个**检查更新**按钮。当 Git 或 pip 安装中可用更新时，一个**立即更新**按钮会在运行 `hermes update` 于后台之前弹出一个确认对话框——显示您将拉取多少次提交。对于 Docker/Nix/Homebrew 安装，仪表板无法原地应用更新，因此会显示正确的外部命令。
- **Nous Portal** — 登录状态、活动的推理提供者和工具网关路由表（哪些工具通过 Portal 而不是本地运行），以及管理订阅的链接。是 `hermes portal` 的只读镜像。
- **技能策展人 (Skill curator)** — 后台技能维护状态（活动 / 已暂停，间隔，上次运行）。包含暂停/恢复和立即运行按钮。镜像 `hermes curator`。
- **网关 (Gateway)** — 启动、停止和重启消息网关，显示实时状态（正在运行/已停止、PID、状态）。
- **内存 (Memory)** — 选择外部内存提供者（或仅内置），并重置内置的 `MEMORY.md` / `USER.md` 存储。
- **凭证池 (Credential pool)** — 添加和移除智能体轮询使用的旋转 API 密钥（按提供者）。密钥在列表中被脱敏；原始值只到达智能体。
- **操作 (Operations)** — 运行 `doctor`，进行安全审计，创建备份，从备份归档恢复、更新技能、显示系统提示词大小细分、生成支持转储或迁移配置以供已退役的设置使用。每个操作都会启动一个后台动作，其实时日志流式传输到页面上。
- **检查点 (Checkpoints)** — 查看 `/rollback` 影子存储的大小并修剪它。
- **Shell hooks（Shell 钩子）** — 列出配置的钩子及其同意状态 + 可执行状态，**创建**一个钩子（事件、命令、匹配器、超时，带有选择加入的同意授予），并移除一个。钩子运行任意命令，因此创建表单会附带安全警告，并且钩子只有在获得同意后才会触发。

![系统管理页面 — 主机统计信息和 Nous Portal 状态](/img/dashboard/admin-system-top.png)

![系统管理页面 — 技能策展人、网关、内存和凭证池](/img/dashboard/admin-system-curator.png)

![系统管理页面 — 操作、检查点和 Shell 钩子](/img/dashboard/admin-system-ops.png)

创建 Shell 钩子（注意同意复选框和运行任意命令的警告）：

![新 Shell 钩子模态框](/img/dashboard/admin-hook-create.png)

:::warning 安全
Web 仪表板会读取和写入您的 `.env` 文件，其中包含 API 密钥和秘密信息。它默认绑定到 `127.0.0.1`——只能从本地机器访问。如果您绑定到 `0.0.0.0`，网络上的任何人都可以查看和修改您的凭证。仪表板本身没有身份验证。
:::

## `/reload` 命令行命令

仪表板 PR 还为交互式 CLI 添加了 `/reload` 命令。在通过 Web 仪表板（或直接编辑 `.env`）更改 API 密钥后，请在活动的 CLI 会话中使用 `/reload` 来拾取这些更改，而无需重启：

```
You → /reload
  Reloaded .env (3 var(s) updated)
```

这会将 `~/.hermes/.env` 重新读取到运行进程的环境中。当您通过仪表板添加了新的提供商密钥并希望立即使用它时，这非常有用。

## REST API

Web 仪表板会暴露一个 REST API，供前端调用。您也可以直接调用这些端点以实现自动化：

:::tip Profile-scoped endpoints
管理端点族——`/api/config`、`/api/env`、`/api/skills`、`/api/tools/toolsets`、`/api/mcp` 和 `/api/model/{info,options,auxiliary,set}`——接受可选的 `?profile=<name>` 查询参数（或用于写入的 JSON 主体中的 `"profile"`），该参数将读取/写入范围限定到该配置文件的 `HERMES_HOME`。省略则默认为仪表板自身的配置文件。未知配置文件名会返回 `404`。`/api/pty` WebSocket 也接受相同的参数，用于在选定的配置文件下生成聊天。
:::

### GET /api/status

返回智能体版本、网关状态、平台状态和活动会话计数。

### GET /api/sessions

返回包含元数据（模型、令牌计数、时间戳、预览）的最近 20 个会话。

### GET /api/config

以 JSON 格式返回当前的 `config.yaml` 内容。

### GET /api/config/defaults

返回默认配置值。

### GET /api/config/schema

返回描述每个配置字段（类型、描述、类别和适用选项）的模式。前端使用此信息为每个字段渲染正确的输入小部件。

### PUT /api/config

保存新的配置。主体：`{"config": {...}}`。

### GET /api/env

返回所有已知的环境变量及其设置/未设置状态、被屏蔽的值、描述和类别。

### PUT /api/env

设置一个环境变量。主体：`{"key": "VAR_NAME", "value": "secret"}`。

### DELETE /api/env

移除一个环境变量。主体：`{"key": "VAR_NAME"}`。

### GET /api/sessions/{session_id}

返回单个会话的元数据。

### GET /api/sessions/{session_id}/messages

返回会话的完整消息历史记录，包括工具调用和时间戳。

### GET /api/sessions/search

跨消息内容的全文搜索。查询参数：`q`。返回带有高亮片段的匹配会话 ID。

### DELETE /api/sessions/{session_id}

删除一个会话及其消息历史记录。

### GET /api/logs

返回日志行。查询参数：`file` (智能体/错误/网关)、`lines` (计数)、`level`、`component`。

### GET /api/analytics/usage

返回令牌使用量、成本和会话分析。查询参数：`days` (默认为 30)。响应包括每日细分和按模型聚合的数据。

### GET /api/cron/jobs

返回所有配置的定时任务及其状态、计划和运行历史记录。

### POST /api/cron/jobs

创建一个新的定时任务。主体：`{"prompt": "...", "schedule": "0 9 * * *", "name": "...", "deliver": "local"}`。

### POST /api/cron/jobs/{job_id}/pause

暂停一个定时任务。

### POST /api/cron/jobs/{job_id}/resume

恢复一个已暂停的定时任务。

### POST /api/cron/jobs/{job_id}/trigger

立即触发一个定时任务，使其脱离其既定计划。

### DELETE /api/cron/jobs/{job_id}

删除一个定时任务。

### GET /api/skills

返回所有技能及其名称、描述、类别和启用状态。

### PUT /api/skills/toggle

启用或禁用一个技能。主体：`{"name": "skill-name", "enabled": true}`。

### GET /api/tools/toolsets

返回所有工具集及其标签、描述、工具列表以及活动/配置状态。

### 管理端点 (Admin endpoints)

这些端点为 MCP、通道、Webhooks、配对和系统页面提供支持。它们都位于 `/api/` 的同一身份验证门槛之后。

| 方法 & 路径 | 用途 |
|---------------|---------|
| `GET /api/mcp/servers` | 列出已配置的 MCP 服务器（环境变量已被屏蔽） |
| `POST /api/mcp/servers` | 添加一个服务器。主体：`{name, url?, command?, args?, env?, auth?}` |
| `POST /api/mcp/servers/{name}/test` | 连接、列出工具、断开连接 |
| `PUT /api/mcp/servers/{name}/enabled` | 启用/禁用一个服务器 |
| `DELETE /api/mcp/servers/{name}` | 移除一个服务器 |
| `GET /api/mcp/catalog` | 浏览 Nous 批准的 MCP 目录 |
| `POST /api/mcp/catalog/install` | 安装一个目录条目（需要相应的环境变量） |
| `GET /api/messaging/platforms` | 列出所有消息通道及其状态 + 每个平台的设置字段 |
| `PUT /api/messaging/platforms/{id}` | 配置一个通道。主体：`{enabled?, env?, clear_env?}` (环境变量写入 `.env`，启用状态写入 `config.yaml`) |
| `POST /api/messaging/platforms/{id}/test` | 报告一个通道是否已配置、已启用和已连接 |
| `GET /api/pairing` | 列出待定 + 已批准的消息用户 |
| `POST /api/pairing/approve` | 批准一个代码。主体：`{platform, code}` |
| `POST /api/pairing/revoke` | 撤销一个用户。主体：`{platform, user_id}` |
| `POST /api/pairing/clear-pending` | 清除所有待定的代码 |
| `GET /api/webhooks` | 列出订阅 + 平台启用状态 |
| `POST /api/webhooks` | 创建一个订阅（返回一次性密钥） |
| `DELETE /api/webhooks/{name}` | 移除一个订阅 |
| `GET /api/credentials/pool` | 列出池化的轮换密钥（已屏蔽） |
| `POST /api/credentials/pool` | 添加一个密钥。主体：`{provider, api_key, label?}` |
| `DELETE /api/credentials/pool/{provider}/{index}` | 移除一个密钥（基于 1 的索引） |
| `GET /api/memory` | 活动提供商 + 可用提供商 + 内置文件大小 |
| `PUT /api/memory/provider` | 选择一个提供商（为空则仅限内置） |
| `POST /api/memory/reset` | 重置内置内存。主体：`{target: all\|memory\|user}` |
| `POST /api/gateway/start` · `/stop` · `/restart` | 网关生命周期（在后台运行） |
| `POST /api/ops/doctor` · `/security-audit` · `/backup` · `/import` | 诊断和维护（在后台运行；通过 `/api/actions/{name}/status` 查看日志） |
| `GET /api/ops/hooks` | 配置的 Shell Hooks + 白名单状态 |
| `GET /api/ops/checkpoints` · `POST .../prune` | 检查/修剪 `/rollback` 存储 |
| `POST /api/ops/hooks` · `DELETE /api/ops/hooks` | 创建/移除一个 Shell Hook（需同意） |
| `GET /api/system/stats` | 主机统计信息——操作系统、CPU、内存、磁盘、正常运行时间 |
| `GET /api/hermes/update/check` | 报告更新可用性（已提交落后，安装方法），但不应用。对于落后的 git/pip 安装，还会返回一个 `commits` 列表（`sha`、`summary`、`author`、`at`）说明更改了什么。`?force=1` 可清除 6 小时缓存 |
| `GET /api/curator` · `PUT .../paused` · `POST .../run` | 技能策展人状态 + 暂停/恢复 + 运行 |
| `GET /api/portal` | Nous Portal 身份验证 + 工具网关路由（只读） |
| `POST /api/ops/prompt-size` · `/dump` · `/config-migrate` | 诊断（在后台运行） |
| `PUT /api/webhooks/{name}/enabled` | 启用/禁用一个 webhook 路由 |
| `POST /api/skills/hub/install` · `/uninstall` · `/update` | 技能中心操作（在后台运行） |
| `GET /api/skills/hub/search` | 在所有来源中搜索技能中心 |
| `GET /api/sessions/stats` | 会话存储统计信息 |
| `PATCH /api/sessions/{id}` | 重命名/归档一个会话 |
| `GET /api/sessions/{id}/export` | 导出单个会话（元数据 + 消息）为 JSON |
| `POST /api/sessions/prune` | 删除超过 N 天的已结束会话 |
| `PUT /api/cron/jobs/{id}` | 编辑一个定时任务的提示/计划/名称/交付方式 |

## 身份验证（受控模式）

当仪表板绑定到公共地址或非回环地址（即除 `127.0.0.1` / `localhost` 以外的任何地址）时，Hermes Agent 会启用一个身份验证门禁。每个请求都必须携带经过验证的会话 cookie，否则将被重定向到登录页面。内置了三种提供者：

- **[用户名/密码](#usernamepassword-provider-no-oauth-idp)** — 最简单的将身份验证应用于自托管/本地部署/家庭实验室仪表板的方法。无需外部身份提供者。**仅在受信任的网络或 VPN 后面使用——不可用于公共互联网暴露。**
- **[OAuth (Nous Portal)](#default-provider-nous-research)** — 适用于托管部署和任何可通过公共互联网访问的仪表板，也是 [连接 Hermes Desktop 到远程后端](#connecting-hermes-desktop-to-a-remote-backend) 的推荐路径。每次登录都会与您的 Nous 账户进行验证，因此这是适合面向互联网使用的提供者。
- **[自托管 OIDC](#self-hosted-oidc-provider)** — 用于通过标准的 OpenID Connect（Keycloak, Auth0, Okta, Google, GitHub 通过 OIDC 网桥等）引入您自己的身份提供者。不涉及 Nous Portal；当由符合规范的 OIDC 服务器进行前端代理时，适用于公共互联网暴露。

绑定到回环地址的操作员仪表板不受影响——无需身份验证，也无登录页面。

### 门禁启用条件

| Flags | Auth gate (身份验证门禁) | Use case (使用场景) |
|-------|-----------|----------|
| `hermes dashboard` (默认 — 绑定到 `127.0.0.1`) | OFF (关闭) | 本地开发 |
| `hermes dashboard --host 0.0.0.0` | **ON** (开启) | 远程/生产环境 — 使用用户名/密码提供者或 OAuth 进行保护 |

门禁只有在以下两个条件都满足时才会启用：

1. 绑定主机不是 `127.0.0.1`、`::1`、`localhost` 或 `0.0.0.0`，并且
2. `--insecure` 标志**未**设置。

:::danger `--insecure` 会禁用身份验证
`--insecure` 会跳过门禁，提供一个未经身份验证的仪表板，该仪表板会读取/写入您的 `.env` 文件（API 密钥、秘密）。它允许运行智能体命令。**切勿将其用于远程连接。** 要将仪表板暴露给另一台机器，请配置 [用户名/密码提供者](#usernamepassword-provider-no-oauth-idp)（或 OAuth），并关闭 `--insecure`。该标志仅作为完全受信任、有防火墙的单主机网络上的最后手段逃生舱口存在。
:::

### 故障安全语义 (Fail-closed semantics)

如果门禁本应启用，但没有注册 `DashboardAuthProvider`（没有 Nous 插件，没有自定义插件），则 `hermes dashboard` 会拒绝绑定并给出明确的错误消息。不存在“默认拒绝但接受所有”的回退机制——一个配置错误的受控仪表板将永远不会启动。

当您**交互式地**运行 `hermes dashboard --host 0.0.0.0`（真实的终端）并且尚未配置任何提供者时，Hermes 不仅会失败——它还会提供现场设置一个的选项：选择**用户名和密码**（写入 `config.yaml` 中的 `dashboard.basic_auth`，您将在几秒内运行）或**OAuth**（引导至 `hermes dashboard register`）。非交互式调用者——Docker/s6、CI、管道运行——会跳过提示并触发上述的故障安全错误，因此无人值守部署仍然不会在没有身份验证的情况下启动。

### 默认提供者：Nous Research

捆绑的 `plugins/dashboard_auth/nous` 插件**始终已安装**并自动加载。当配置了客户端 ID 时，它会自动注册一个名为 `nous` 的 `DashboardAuthProvider`。

由于每次登录都与 Nous Portal 进行验证并受到您的 Nous 账户保护，**Nous 提供者是适合将仪表板暴露给公共互联网的选项。**

#### 注册仪表板

要使用 Nous 提供者，您需要一个 OAuth 客户端 ID（格式为 `agent:{id}`）。有两种获取方式：

- **CLI — `hermes dashboard register`。** 在仪表板所在的宿主机上运行它。它会解析您现有的 Nous 登录（如果未登录，请先运行 `hermes setup`），将一个自托管的 OAuth 客户端注册到 Portal，并将 `HERMES_DASHBOARD_OAUTH_CLIENT_ID` 写入 `~/.hermes/.env` 文件中。可选标志：`--name`（人类可读标签，否则自动生成）和 `--redirect-uri`（面向互联网主机的公共 HTTPS 回调 URL）。

  ```bash
  hermes dashboard register
  # ✓ Registered dashboard "swift_falcon"
  # …writes HERMES_DASHBOARD_OAUTH_CLIENT_ID to ~/.hermes/.env
  ```

- **GUI — 本地仪表板页面。** 在 Nous Portal 中打开 [`/local-dashboards`](https://portal.nousresearch.com/local-dashboards) 以从浏览器注册、命名、管理和撤销自托管仪表板。将生成的 `agent:{id}` 客户端 ID 复制到 `HERMES_DASHBOARD_OAUTH_CLIENT_ID`（env）或 `dashboard.oauth.client_id`（config.yaml）。您也可以在此处撤销通过 CLI 注册的仪表板。

#### 配置

该插件从两个地方读取配置，如果设置了环境变量则以环境变量为准：

**`config.yaml`** — 标准配置源：

```yaml
dashboard:
  oauth:
    client_id: agent:01HXYZ…             # 必需的门禁启用条件
```

**环境变量** — 操作员覆盖项：

| Env var | Overrides (覆盖项) | Format (格式) | Provisioned by (由谁提供) |
|---------|-----------|--------|----------------|
| `HERMES_DASHBOARD_OAUTH_CLIENT_ID` | `dashboard.oauth.client_id` | `agent:{instance_id}` | `hermes dashboard register` |

根据 Hermes Agent 的约定（`~/.hermes/.env` 仅用于 API 密钥/秘密），**推荐在 `config.yaml` 中设置这些值**，适用于本地开发、本地部署和您直接控制的任何部署。环境变量路径的存在是为了让托管平台的秘密注入功能能够在不要求任何人编辑镜像内部 `config.yaml` 的情况下推送每个部署的 `client_id`——这就是它的主要用途。

空的环境变量值被视为未设置，因此一个已提供但内容未填充的平台秘密不能意外地覆盖有效的 `config.yaml` 条目。

如果任一来源都没有提供客户端 ID，插件会报告具体原因，而仪表板的故障安全绑定错误将告诉您需要修复什么：

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

#### 示例：Nous Research

从已登录的 Hermes 安装到受 Nous 门禁保护的仪表板，只需三步。

**1. 登录并注册仪表板。** `hermes dashboard register` 使用您现有的 Nous 登录来提供一个 OAuth 客户端，并将 `HERMES_DASHBOARD_OAUTH_CLIENT_ID` 写入 `~/.hermes/.env`：

```bash
hermes setup            # 如果尚未登录到 Nous Portal
hermes dashboard register
# ✓ Registered dashboard "swift_falcon"
# …writes HERMES_DASHBOARD_OAUTH_CLIENT_ID to ~/.hermes/.env
```

**2. 在可达的地址上运行仪表板。** 一个非回环绑定且未设置 `--insecure` 会启用 OAuth 门禁，而刚刚写入的 `client_id` 将激活 `nous` 提供者：

```bash
hermes dashboard --host 0.0.0.0 --port 9119 --no-open
```

**3. 登录。** 打开 `http://<host>:9119/`，您将被重定向到 `/login`。点击 **Sign in with Nous Research** → 在 Portal 上进行身份验证 → 返回已认证的仪表板。从任何机器验证门禁：

```bash
curl -s http://<host>:9119/api/status | jq '.auth_required, .auth_providers'
# true
# ["nous"]
```

`GET /api/auth/me` 随后返回经过验证的会话（`provider: nous`）。对于面向互联网的主机，请使用 `--redirect-uri https://hermes.example.com/auth/callback` 进行注册，并设置 `HERMES_DASHBOARD_PUBLIC_URL`，以便 OAuth 回调解析到您的公共 URL（参见 [Public URL override](#public-url-override)）。

### 用户名/密码提供者（无 OAuth IDP）

如果您不想配置 OAuth 身份提供者——即一个自托管的“在我的仪表板上放个密码”部署——捆绑的 `plugins/dashboard_auth/basic` 插件会注册一个名为 `basic` 的 `DashboardAuthProvider`，它使用**用户名和密码**进行身份验证，而不是 OAuth 重定向。

它接入与 OAuth 提供者相同的门禁：在非回环绑定且未设置 `--insecure` 时门禁启用，登录页面为该提供者渲染一个凭证表单（而不是“使用 X 登录”按钮），并且从登录之后的所有下游功能——会话 cookie、透明刷新、WS 票据、登出、审计日志——都与 OAuth 路径相同。会话是提供者自己铸造的无状态 HMAC 签名令牌，因此**不需要数据库和外部 IDP**。密码哈希使用 stdlib `scrypt`（不依赖第三方）。

:::warning 仅在受信任的网络上使用 — 不适用于公共互联网
用户名/密码提供者旨在用于**受信任网络**上的自托管/本地部署/家庭实验室仪表板，或仅通过 **VPN** 可达。它保护的是一个共享凭证，而没有外部身份提供者、MFA 或用户级别的账户，因此**不适合直接暴露给公共互联网的仪表板**。对于面向互联网的仪表板，请使用 [Nous Research 提供者](#default-provider-nous-research)（或您自己的 [自托管 OIDC](#self-hosted-oidc-provider) / [自定义 OAuth](#custom-providers) 提供者）代替。
:::

#### 配置

与 Nous 提供者一样，它从 `config.yaml` 读取（标准配置源），如果设置了环境变量则以环境变量为准。仅当配置了 `username` 加上 `password_hash`（首选）或 `password` 时才会激活——否则它是一个空操作，因此 OAuth 用户和回环/`--insecure` 操作员不受影响。

**`config.yaml`：**

```yaml
dashboard:
  basic_auth:
    username: admin
    # 首选 — 存储时无明文密码。使用以下命令计算：
    #   python -c "from plugins.dashboard_auth.basic import hash_password; print(hash_password('PW'))"
    password_hash: "scrypt$16384$8$1$…$…"
    # ...或明文密码（在加载时内存哈希；存储时安全性较低）：
    # password: "s3cret"
    secret: "<32+ random bytes, base64 or hex>"  # 令牌签名密钥
    session_ttl_seconds: 43200                    # 可选；访问令牌的生命周期（默认 12 小时）
```

**环境变量覆盖项：**

| Env var | Overrides (覆盖项) | Notes (说明) |
|---------|-----------|-------|
| `HERMES_DASHBOARD_BASIC_AUTH_USERNAME` | `dashboard.basic_auth.username` | 必需的激活条件 |
| `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD_HASH` | `dashboard.basic_auth.password_hash` | 首选（存储时无明文） |
| `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD` | `dashboard.basic_auth.password` | 明文；**覆盖 config 中的 `password_hash`**，以便您可以通过环境变量进行轮换 |
| `HERMES_DASHBOARD_BASIC_AUTH_SECRET` | `dashboard.basic_auth.secret` | 令牌签名密钥 |
| `HERMES_DASHBOARD_BASIC_AUTH_TTL_SECONDS` | `dashboard.basic_auth.session_ttl_seconds` | 访问令牌的生命周期 |

:::caution 为稳定的会话设置明确的 `secret`
当 `secret` 为空时，系统会生成一个随机的进程级签名密钥。这对单个进程是没问题的，但这意味着**每次重启都会使所有会话失效**，并且会话**不会跨多个工作进程**。请为可重启/多工作进程部署设置明确的 `secret`。
:::

`/auth/password-login` 端点对客户端 IP 进行速率限制（默认 10 次尝试/分钟 → HTTP 429），并对未知用户和错误的密码返回一个通用的 `401 Invalid credentials`，因此它不能被用作用户名枚举的工具。

#### 示例：用户名/密码

从零到在受信任网络上拥有密码门禁仪表板，只需三步。

**1. 在 `~/.hermes/.env` 中设置凭证。** 哈希密码以确保存储时没有明文密码，并设置一个稳定的签名密钥以使会话存活：

```bash
# 计算您选择的密码的 scrypt 哈希：
HASH=$(python -c "from plugins.dashboard_auth.basic import hash_password; print(hash_password('choose-a-strong-password'))")

cat >> ~/.hermes/.env <<EOF
HERMES_DASHBOARD_BASIC_AUTH_USERNAME=admin
HERMES_DASHBOARD_BASIC_AUTH_PASSWORD_HASH=$HASH
HERMES_DASHBOARD_BASIC_AUTH_SECRET=$(openssl rand -base64 32)
EOF
chmod 600 ~/.hermes/.env
```

**2. 在可达的地址上运行仪表板。** 一个非回环绑定且未设置 `--insecure` 会启用门禁，用户名 + 哈希将激活 `basic` 提供者：

```bash
hermes dashboard --host 0.0.0.0 --port 9119 --no-open
```

**3. 登录。** 打开 `http://<host>:9119/`，您将被重定向到 `/login`——一个**凭证表单**（而不是“使用 X 登录”按钮）。输入 `admin` / 密码 → 进入已认证的仪表板。从任何机器验证门禁：

```bash
curl -s http://<host>:9119/api/status | jq '.auth_required, .auth_providers'
# true
# ["basic"]
```

`GET /api/auth/me` 随后返回经过验证的会话（`provider: basic`）。请将此功能置于 VPN 后面——参见上面的警告；对于公共主机，请使用 [Nous Research 提供者](#default-provider-nous-research) 或 [自托管 OIDC](#self-hosted-oidc-provider) 提供者。

#### 创建您自己的密码提供者

`basic` 只是一个扩展点的实现。任何插件都可以注册一个密码提供者：在 `DashboardAuthProvider` 子类上设置 `supports_password = True`，并实现 `complete_password_login(*, username, password) -> Session`（拒绝时抛出 `InvalidCredentialsError`，如果后端存储不可用则抛出 `ProviderError`）。OAuth 的 `start_login` / `complete_login` 方法可以留作纯密码提供者的 `NotImplementedError` 存根。这是用于 LDAP-bind、凭证数据库或任何其他非重定向身份验证方案的路径——框架会为您处理表单、路由、cookie 和刷新功能。

### 自托管 OIDC 提供者

如果您运行自己的身份提供者，捆绑的 `plugins/dashboard_auth/self_hosted` 插件使用**标准的 OpenID Connect** 对仪表板进行身份验证——无需针对特定 IDP 的代码，也不涉及 Nous Portal。它与任何符合规范的 OIDC 服务器兼容：

> **Authentik · Keycloak · Zitadel · Authelia · Auth0 · Okta · Google · …**

与 Nous 提供者一样，它会自动加载，并且仅在其配置完成后才注册，因此对于回环/`--insecure` 仪表板来说是空操作。

#### 配置

配置一个**发行方 (issuer)** 和一个 **客户端 ID**（一个公共 PKCE 客户端——无需客户端密钥）。该插件会从 `{issuer}/.well-known/openid-configuration` 获取 IDP 的 `authorization_endpoint`、`token_endpoint` 和 `jwks_uri`，因此您永远不需要硬编码端点 URL。

**`config.yaml`** — 标准配置源：

```yaml
dashboard:
  oauth:
    provider: self-hosted
    self_hosted:
      issuer: https://auth.example.com/application/o/hermes/   # 必需的
      client_id: hermes-dashboard                              # 必需的
      scopes: "openid profile email"                           # 可选（这是默认值）
```

**环境变量覆盖项** — 操作员覆盖项（如果设置了非空值，则环境变量覆盖 `config.yaml`；空值被视为未设置）：

| Env var | Overrides (覆盖项) | Notes (说明) |
|---------|-----------|-------|
| `HERMES_DASHBOARD_OIDC_ISSUER` | `dashboard.oauth.self_hosted.issuer` | OIDC 发行方 URL — 必需的 |
| `HERMES_DASHBOARD_OIDC_CLIENT_ID` | `dashboard.oauth.self_hosted.client_id` | 公共客户端 ID — 必需的 |
| `HERMES_DASHBOARD_OIDC_SCOPES` | `dashboard.oauth.self_hosted.scopes` | 默认为 `openid profile email` |

在您的 IDP 中，注册一个**公共**应用程序/客户端，使用授权码 + PKCE (S256) 授权，并将仪表板的回调地址添加为允许的重定向 URI。回调地址是 `<dashboard public URL>/auth/callback`（参见 [Public URL override](#public-url-override)，了解仪表板如何在代理后推导出其公共 URL）。

#### 它验证什么

该提供者会根据发现的 `jwks_uri` 对 OpenID Connect **ID 令牌** (RS256/ES256) 进行验证，并要求 `iss` 和 `aud` 声明与您配置的 `issuer` 和 `client_id` 相匹配。标准的 OIDC 声明映射到仪表板会话：

| Session field | Claim(s) (声明) |
|---------------|----------|
| `user_id` | `sub` (必需) |
| `email` | `email` |
| `display_name` | `name` → `preferred_username` → `nickname` → `email` |
| `org_id` | `org_id` / `organization`，否则为联合后的 `groups` |

ID 令牌用于建立身份——访问令牌被视为不透明的（OIDC 规范不要求它是一个 JWT）。端点 URL 必须是 HTTPS（允许本地开发使用回环地址的 `http://`），并且发现文档中声明的 `issuer` 必须与您配置的一致（容忍尾随斜杠的区别）。当 IDP 发出刷新令牌时，它们用于通过标准的 `refresh_token` 授权进行静默重新认证；登出操作会调用 IDP 的 RFC 7009 `revocation_endpoint` 端点。

> **保密客户端**（拥有 `client_secret` 的客户端）尚未支持——请配置一个公共 + PKCE 客户端，这是面向浏览器的仪表板的典型选择。

#### 示例：Keycloak

[Keycloak](https://www.keycloak.org/) 是最容易设置的一个自托管 OIDC 服务器，可用于本地测试——它以单个容器的形式在开发模式下运行（内存数据库），并暴露教科书式的 OIDC 发现功能。本指南将带您从零到拥有一个可工作的仪表板登录状态。

**1. 使用预配置的域进行 Keycloak 运行。** 将此域导出保存为 `realm-hermes.json`——它定义了一个 `hermes` 域，一个**公共 PKCE 客户端**（`hermes-dashboard`）和一个测试用户，所有内容都在启动时导入，因此管理员 UI 上无需点击任何按钮：

```json
{
  "realm": "hermes",
  "enabled": true,
  "clients": [
    {
      "clientId": "hermes-dashboard",
      "name": "Hermes Agent Dashboard",
      "enabled": true,
      "publicClient": true,
      "standardFlowEnabled": true,
      "protocol": "openid-connect",
      "redirectUris": ["http://localhost:9119/auth/callback"],
      "webOrigins": ["http://localhost:9119"],
      "attributes": { "pkce.code.challenge.method": "S256" }
    }
  ],
  "users": [
    {
      "username": "testuser",
      "enabled": true,
      "emailVerified": true,
      "email": "testuser@example.com",
      "firstName": "Test",
      "lastName": "User",
      "credentials": [
        { "type": "password", "value": "testpassword", "temporary": false }
      ]
    }
  ]
}
```

启动它（Keycloak 26+），将该文件挂载到导入目录：

```bash
docker run --rm -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  -v "$PWD/realm-hermes.json:/opt/keycloak/data/import/realm-hermes.json:ro" \
  quay.io/keycloak/keycloak:26.0 \
  start-dev --import-realm
```

一旦它启动，该域就会在 `http://localhost:8080/realms/hermes/.well-known/openid-configuration` 处宣传标准的 OIDC 发现信息（发行方为 `http://localhost:8080/realms/hermes`）。管理员控制台位于 `http://localhost:8080/` (`admin` / `admin`)。

**2. 指向仪表板。** 自托管插件允许使用回环地址的 `http://` 发行方（任何非回环地址都需要 HTTPS），因此本地 Keycloak 可以直接使用：

```bash
export HERMES_DASHBOARD_OIDC_ISSUER="http://localhost:8080/realms/hermes"
export HERMES_DASHBOARD_OIDC_CLIENT_ID="hermes-dashboard"
export HERMES_DASHBOARD_PUBLIC_URL="http://localhost:9119"
hermes dashboard --host 0.0.0.0 --port 9119 --no-open
```

`HERMES_DASHBOARD_PUBLIC_URL` 告诉仪表板其 OAuth 回调是 `http://localhost:9119/auth/callback`——这正是域注册的重定向 URI。绑定到 `0.0.0.0`（非回环绑定）且未设置 `--insecure` 是启用 OAuth 门禁的原因。

**3. 登录。** 打开 `http://localhost:9119/`，您将被重定向到 `/login`。点击 **Sign in with Self-Hosted OIDC** → 在 Keycloak 上以 `testuser` / `testpassword` 进行身份验证 → 返回已认证的仪表板。侧边栏会显示“作为 Test User 登录自托管”，并且 `GET /api/auth/me` 返回经过验证的会话（`provider: self-hosted`, `email: testuser@example.com`）。

> 如果您在不同的主机/端口上绑定或浏览，请将该源的
> `…/auth/callback` 添加到客户端的**有效重定向 URI**中（Keycloak 管理控制台 > Clients → hermes-dashboard → Settings）。相同的模式适用于 Authentik、Zitadel、Authelia 和其他 OIDC 服务器——只是发行方 URL 和客户端注册 UI 不同。

### Public URL override (公共 URL 覆盖)

默认情况下，仪表板会从请求中重建 OAuth 回调 URL — `X-Forwarded-Host` + `X-Forwarded-Proto` + `X-Forwarded-Prefix`（当 uvicorn 配置了 `proxy_headers=True` 时启用，而 `start_server` 在门禁下启用了此功能）。这在后端代理正确设置所有三个头信息的情况下可以正常工作。

对于那些无法可靠转发这些头的部署（手动 nginx 设置、本地入站网关、带有部分代理链的自定义域名部署），请将 `dashboard.public_url`（或 `HERMES_DASHBOARD_PUBLIC_URL`）设置为仪表板被访问到的**完整公共 URL**：

```yaml
dashboard:
  public_url: "https://dashboard.example.com/hermes"
```

设置后，OAuth 回调 URL 将成为 `<public_url>/auth/callback`——完全一致。在这一代码路径中会忽略 `X-Forwarded-Prefix`，因为操作员已经明确声明了公共 URL。这是故意的：如果堆叠前缀，则会在公共 URL 中已包含前缀的情况下进行二次前缀化。

与其他的仪表板设置具有相同的优先级——环境变量覆盖 `config.yaml`：

| Surface (配置源) | Override path (覆盖路径) | When to use (何时使用) |
|---------|---------------|-------------|
| `dashboard.public_url` in `config.yaml` | `HERMES_DASHBOARD_PUBLIC_URL` | 本地开发 / 本地部署（标准配置） |
| `HERMES_DASHBOARD_PUBLIC_URL` env var | — | 托管平台秘密 / CI |
| (unset) | — | 默认——从 `X-Forwarded-*` 头信息重建 |

验证会拒绝没有 `http://` / `https://` 方案、没有主机名或包含引号/尖角符/空格/控制字符的值。一个格式错误的数值会静默地回退到头信息重建，而不是将用户分派到一个恶意的 URL 上，从而使登录流程保持正常运行。

> **注意：** `public_url` 只覆盖 OAuth 回调 URL。`Secure` cookie 标志仍然由 `request.url.scheme`（在 `proxy_headers=True` 下的上游 TLS 终止器中的 `X-Forwarded-Proto`）控制，因此一个使用 `http://` 的公共 TLS 终止部署上的 `public_url` 将会产生非 Secure cookie。这是一个操作员需要注意的陷阱——请将 `public_url` 与正确的上游 TLS 终止功能配对。

### OAuth 流程

该提供者实现了 [Nous Portal OAuth 合同 v1](https://github.com/NousResearch/nous-account-service/blob/main/docs/agent-dashboard-oauth-contract.md) — 使用 PKCE (S256) 的授权码授权：

1. 用户访问 `/` 但没有会话 cookie → 门禁重定向到 `/login`。
2. 登录页面显示“使用 Nous Research 继续”按钮 → `/auth/login?provider=nous`。
3. 服务器将 PKCE 状态存储在一个短期 cookie 中，并将用户重定向到 `https://portal.nousresearch.com/oauth/authorize?…`。
4. 用户使用 Portal 进行身份验证，并到达 `/auth/callback?code=…&state=…`。
5. 服务器在 `POST /api/oauth/token` 处用代码交换访问令牌，根据 Portal 的 JWKS (`/.well-known/jwks.json`) 验证 JWT 签名，并设置 `hermes_session_at` cookie。
6. 用户被重定向到 `/`（或通过 `next=` 查询参数重定向到原始的深度链接路径）。

访问令牌具有 15 分钟的 TTL。**合同 v1 中没有刷新令牌**——当令牌过期时，SPA 的获取包装器会检测到 401 错误并全页面导航回 `/login` 以重新运行流程。

### 设置的 Cookies

| Name | Lifetime (生命周期) | Notes (说明) |
|------|----------|-------|
| `hermes_session_at` | Token TTL (15 min) | HttpOnly, SameSite=Lax, Secure-when-HTTPS |
| `hermes_session_pkce` | 10 min | HttpOnly；在往返过程中保存 PKCE 验证器 + 提供者提示 |
| `hermes_session_rt` | v1 中未使用 | 保留用于未来兼容性；当 `refresh_token` 为空时不会写入 |

所有三个 cookie 的 `Path=/` 和 `SameSite=Lax`。当仪表板通过 HTTPS 访问时（通过请求 URL 方案检测到——遵循 `proxy_headers=True` 下上游 TLS 终止器的 `X-Forwarded-Proto`），则设置 `Secure` 标志。

### 登出 (Logout)

侧边栏小部件显示 `作为 <user_id…> 通过 nous 登录` 以及一个登出图标。点击它会 POST `/auth/logout`，该操作会清除所有仪表板身份验证 cookie 并重定向回 `/login`。

### 审计日志 (Audit log)

每次登录的开始、成功、失败和会话验证失败都会作为 JSON 行写入 `$HERMES_HOME/logs/dashboard-auth.log`。敏感字段（`access_token`、`refresh_token`、`code`、`code_verifier`、`state`、`Authorization` 标头）在记录之前会被屏蔽。

### 自定义提供者 (Custom providers)

要插入非 Nous OAuth 提供者（例如 Google, GitHub, 自定义 OIDC），请创建一个注册 `DashboardAuthProvider` 的插件：

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

登录页面会列出所有已注册的提供者；可以堆叠多个提供者，用户在 `/login` 处选择一个。

### 验证门禁是否启用

```bash
# 快速环境变量路径。
HERMES_DASHBOARD_OAUTH_CLIENT_ID=agent:test \
  hermes dashboard --host 0.0.0.0

# 或通过 config.yaml 的等效方式（本地开发/本地部署推荐）：
#
#   dashboard:
#     oauth:
#       client_id: agent:test
#
# 然后只需：
hermes dashboard --host 0.0.0.0

# 访问 /api/status 查看门禁状态：
curl -s http://127.0.0.1:9119/api/status | jq '.auth_required, .auth_providers'
# true
# ["nous"]
```

仪表板的 React StatusPage 在“Web server”下显示相同的字段。一个侧边栏 AuthWidget 会在您登录后展示当前的身份信息。

## 连接 Hermes Desktop 到远程后端

Hermes Desktop 可以驱动运行在另一台机器上的 Hermes 后端（可以是 VPS、家庭服务器或通过 Tailscale 部署的 Mini）。在应用中，这位于 **设置 → 网关 → 远程网关** 下，需要提供一个 **远程 URL** 和一种 **登录** 的方式。（关于桌面应用本身——安装、设置、聊天——请参阅 [Hermes Desktop](/user-guide/desktop) 页面。）

您使用捆绑的身份验证提供程序之一来保护远程仪表板，而桌面应用则针对后端所宣传的任一提供程序进行登录。对于可达超出本机之外的后端（VPS、公共主机、任何面向互联网的服务），推荐的提供程序是 **OAuth (Nous Portal)**（在 [`hermes dashboard register`](#registering-a-dashboard) 中注册它，并使用 *Sign in with Nous Research* 登录）。捆绑的 [用户名/密码提供程序](#usernamepassword-provider-no-oauth-idp) 是在后端位于受信任局域网或仅可通过 VPN 访问时的最快选项，但**不适合直接暴露给公共互联网**。将仪表板绑定到非回环地址会激活其身份验证门；一旦登录，桌面应用会自动重用聊天 WebSocket 会话——无需复制或粘贴令牌。

下面的配方使用了用户名/密码路径，因为它在受信任的网络上最快；有关 OAuth 路径，请参阅 [默认提供程序：Nous Research](#default-provider-nous-research)。

### 在后端（远程机器）上

```bash
# 1. 在 ~/.hermes/.env (secrets 文件, 0600) 中设置仪表板登录凭据。
cat >> ~/.hermes/.env <<'EOF'
HERMES_DASHBOARD_BASIC_AUTH_USERNAME=admin
HERMES_DASHBOARD_BASIC_AUTH_PASSWORD=choose-a-strong-password
# 推荐：一个稳定的签名密钥，以确保会话在重启后仍有效。
HERMES_DASHBOARD_BASIC_AUTH_SECRET=$(openssl rand -base64 32)
EOF
chmod 600 ~/.hermes/.env

# 2. 运行绑定到可达地址的仪表板。非回环绑定会激活身份验证门；用户名/密码提供程序负责登录。
hermes dashboard --no-open --host 0.0.0.0 --port 9119
```

偏好不存储明文？请使用 `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD_HASH` 和 scrypt 哈希，而不是密码——有关完整的说明，请参阅 [用户名/密码提供程序](#usernamepassword-provider-no-oauth-idp)。

如果您以 systemd 服务运行仪表板，当单元配置了 `EnvironmentFile=%h/.hermes/.env` 时，`~/.hermes/.env` 会被自动读取，因此凭据会在启动时加载到环境中。

:::warning
仪表板会读取和写入您的 `.env`（API 密钥、密钥），并且可以运行智能体命令。此处显示的**用户名/密码**设置适用于受信任的网络——切勿将受密码保护的仪表板直接暴露给开放互联网。将其置于 VPN 之后。Tailscale [https://tailscale.com/](https://tailscale.com/) 是一个干净的选择：绑定到机器的 tailscale IP（`--host <tailscale-ip>`），并使用 `http://<tailscale-ip>:9119` 作为远程 URL。只有位于您的 tailnet 上的设备才能访问它。若要通过公共互联网访问后端，请改用 **OAuth (Nous Portal)** 提供程序。
:::

### 在 Hermes Desktop 中

**设置 → 网关 → 远程网关：**

- **远程 URL** — `http://<backend-host>:9119`（如果使用反向代理，则支持 `/hermes` 等路径前缀）
- **登录** — 应用会检测到用户名/密码网关并显示一个 **登录** 按钮；点击它并输入第 1 步中的凭据。
- **保存并重新连接** — 将桌面 Shell 切换到远程后端

当后端设置了 `HERMES_DASHBOARD_BASIC_AUTH_SECRET` 时，会话会自动刷新并能存活于重启之后。

### 环境变量覆盖

除了应用内的设置外，您还可以在启动桌面应用之前通过环境变量指定后端。当设置了 `HERMES_DESKTOP_REMOTE_URL` 后，它将覆盖保存的应用内 URL（网关设置面板会显示一个“环境变量覆盖”徽章并禁用编辑）；您仍然需要从面板中**登录**您的用户名和密码。

| 环境变量 | 值 |
|---------|-------|
| `HERMES_DESKTOP_REMOTE_URL` | `http://<backend-host>:9119` |

### 故障排除

- **“远程网关不完整”** — 您尚未输入远程 URL。
- **使用 401 / “凭据无效”进行登录失败** — 用户名或密码与后端的 `HERMES_DASHBOARD_BASIC_AUTH_USERNAME` / `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD` 不匹配。后端对未知用户和错误的密码返回相同的通用错误，因此请同时检查两者。使用 `curl -s http://<host>:9119/api/status | jq '.auth_required, .auth_providers'` 确认网关——它应该报告 `true` 并包含 `"basic"`。
- **没有“登录”按钮 — 它要求提供会话令牌** — 用户名/密码提供程序未激活（`/api/status` 不会列出 `"basic"`）。请确保设置了用户名和密码（或密码哈希），并且仪表板进程已加载它们。
- **每次重启都已登出** — 请将 `HERMES_DASHBOARD_BASIC_AUTH_SECRET` 设置为一个稳定的值；否则，签名密钥会在每次启动时重新生成。
- **连接被拒绝 / 超时** — 后端绑定到 `127.0.0.1`（默认）而不是可达地址，或者防火墙/VPN 正在阻止该端口。请绑定到 `0.0.0.0` 或 tailscale IP 并打开端口以供您的受信任网络访问。

## CORS

Web 服务器仅将 CORS 限制在本地主机源上：

- `http://localhost:9119` / `http://127.0.0.1:9119` (生产环境)
- `http://localhost:3000` / `http://127.0.0.1:3000`
- `http://localhost:5173` / `http://127.0.0.1:5173` (Vite 开发服务器)

如果您在自定义端口上运行服务器，该源会自动添加。

## 开发

如果您正在贡献于 Web 仪表板前端：

```bash
# Terminal 1: 启动后端 API
hermes dashboard --no-open

# Terminal 2: 启动带 HMR 的 Vite 开发服务器
cd web/
npm install
npm run dev
```

Vite 开发服务器在 `http://localhost:5173` 上代理 `/api` 请求到 FastAPI 后端（`http://127.0.0.1:9119`）。

前端使用 React 19、TypeScript、Tailwind CSS v4 和 shadcn/ui-style 组件构建。生产构建输出到 `hermes_cli/web_dist/`，由 FastAPI 服务器作为静态 SPA 提供服务。

## 更新时的自动构建

当您运行 `hermes update` 时，如果安装了 `npm`，Web 前端将自动重建。这确保仪表板与代码更新保持同步。如果未安装 `npm`，则更新会跳过前端构建，而 `hermes dashboard` 会在首次启动时进行构建。

## 主题和插件

该仪表板自带六种内置主题，并且可以通过用户定义的ธี目、插件标签页和后端 API 路由进行扩展——所有内容均可即插即用，无需克隆仓库。

**实时切换主题** — 点击语言切换器旁边的调色板图标。选择会保存在 `config.yaml` 的 `dashboard.theme` 下，并在页面加载时恢复。

**独立更改字体** — 从同一个选择器进行操作——位于主题列表下方的 **字体** 部分将覆盖任何活动主题的 UI 字体。该选择在主题切换中保持（`config.yaml` → `dashboard.font`）；请选择 **Theme default** 以清除它并返回到当前主题自身的字体。

内置主题：

| 主题 | 特征 |
|-------|-----------|
| **Hermes Teal** (`default`) | 深青色 + 奶油色，系统字体，舒适的间距 |
| **Hermes Teal (Large)** (`default-large`) | 与默认相同，但文本为 18px，间距更宽敞 |
| **Midnight** (`midnight`) | 深蓝色-紫色，Inter + JetBrains Mono |
| **Ember** (`ember`) | 暖红色 + 青铜色，Spectral serif + IBM Plex Mono |
| **Mono** (`mono`) | 灰度，IBM Plex，紧凑型 |
| **Cyberpunk** (`cyberpunk`) | 黑底霓虹绿，Share Tech Mono |
| **Rosé** (`rose`) | 粉色 + 米白色，Fraunces serif，宽敞 |

要构建自己的主题、添加插件标签页、注入 Shell 插槽或暴露特定于插件的 REST 端点，请参阅 **[扩展仪表板](./extending-the-dashboard)** — 这份完整的指南涵盖了：

- 主题 YAML 模式——调色板、排版、布局、资源、组件样式、颜色覆盖、自定义 CSS
- 布局变体——`standard`（标准）、`cockpit`（驾驶舱）、`tiled`（平铺）
- 插件清单、SDK、Shell 插槽、页面范围插槽（在不覆盖内置页面元素的情况下注入小部件）、后端 FastAPI 路由
- 一份完整的“主题+插件”综合指南（Strike Freedom 驾驶舱演示）
- 发现、重新加载和故障排除