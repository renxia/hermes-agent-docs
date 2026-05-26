---
title: 浏览器自动化
description: 通过多个提供商、基于本地 Chromium 系列浏览器的 CDP 或云端浏览器来控制浏览器，用于网页交互、表单填写、数据抓取等。
sidebar_label: 浏览器
sidebar_position: 5
---

# 浏览器自动化

Hermes 智能体包含完整的浏览器自动化工具集，提供多种后端选项：

- **Browserbase 云端模式**：通过 [Browserbase](https://browserbase.com) 使用托管云浏览器和反机器人工具
- **Browser Use 云端模式**：通过 [Browser Use](https://browser-use.com) 作为替代性云端浏览器提供商
- **Firecrawl 云端模式**：通过 [Firecrawl](https://firecrawl.dev) 使用内置数据抓取功能的云浏览器
- **Camofox 本地模式**：通过 [Camofox](https://github.com/jo-inc/camofox-browser) 进行本地反检测浏览（基于 Firefox 的指纹伪装）
- **本地 Chromium 系列 CDP**：使用 `/browser connect` 将浏览器工具连接到您正在运行的 Chrome、Brave、Chromium 或 Edge 实例
- **本地浏览器模式**：通过 `agent-browser` CLI 和本地安装的 Chromium 浏览器实现

在所有模式下，智能体均可导航网站、与页面元素交互、填写表单及提取信息。

## 概览

页面以**辅助功能树**（基于文本的快照）形式表示，这使其非常适合大语言模型智能体。交互元素会被分配引用 ID（如 `@e1`、`@e2`），智能体使用这些 ID 进行点击和输入操作。

主要功能：

- **多提供商云执行** — Browserbase、Browser Use 或 Firecrawl，无需本地浏览器
- **本地 Chromium 系列集成** — 通过 CDP 连接到您正在运行的 Chrome、Brave、Chromium 或 Edge 浏览器，实现亲自动手的浏览体验
- **内置隐蔽特性** — 随机指纹、验证码解析、住宅代理（Browserbase）
- **会话隔离** — 每个任务都有独立的浏览器会话
- **自动清理** — 不活跃的会话将在超时后关闭
- **视觉分析** — 截图 + 人工智能分析，用于视觉理解

## 配置

:::tip Nous 订阅用户
如果您拥有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，可以通过 **[工具网关](tool-gateway.md)** 使用浏览器自动化功能，无需单独的 API 密钥。新安装的客户端可运行 `hermes setup --portal` 来登录并一次性启用所有网关工具；现有安装可通过 `hermes model` 或 `hermes tools` 选择 **Nous 订阅** 作为浏览器提供商。
:::

### Browserbase 云端模式

要使用 Browserbase 托管的云端浏览器，请添加：

```bash
# 添加到 ~/.hermes/.env
BROWSERBASE_API_KEY=***
BROWSERBASE_PROJECT_ID=your-project-id-here
```

请前往 [browserbase.com](https://browserbase.com) 获取您的凭据。

### Browser Use 云端模式

要将 Browser Use 用作您的云端浏览器提供商，请添加：

```bash
# 添加到 ~/.hermes/.env
BROWSER_USE_API_KEY=***
```

请前往 [browser-use.com](https://browser-use.com) 获取您的 API 密钥。Browser Use 通过其 REST API 提供云端浏览器。如果同时设置了 Browserbase 和 Browser Use 的凭据，Browserbase 将优先使用。

### Firecrawl 云端模式

要将 Firecrawl 用作您的云端浏览器提供商，请添加：

```bash
# 添加到 ~/.hermes/.env
FIRECRAWL_API_KEY=fc-***
```

请前往 [firecrawl.dev](https://firecrawl.dev) 获取您的 API 密钥。然后选择 Firecrawl 作为您的浏览器提供商：

```bash
hermes setup tools
# → 浏览器自动化 → Firecrawl
```

可选设置：

```bash
# 自托管 Firecrawl 实例 (默认: https://api.firecrawl.dev)
FIRECRAWL_API_URL=http://localhost:3002

# 会话 TTL (秒) (默认: 300)
FIRECRAWL_BROWSER_TTL=600
```

### 混合路由：公网 URL 使用云端，局域网/本地地址使用本地

当配置了云端提供商时，Hermes 会为解析为私有/环回/局域网地址（`localhost`、`127.0.0.1`、`192.168.x.x`、`10.x.x.x`、`172.16-31.x.x`、`*.local`、`*.lan`、`*.internal`、IPv6 环回 `::1`、链路本地 `169.254.x.x`）的 URL 自动启动一个**本地 Chromium 旁路进程**。公网 URL 将在同一个对话中继续使用云端提供商。

这解决了常见的“我在本地开发但使用 Browserbase”的工作流程——智能体可以在 `http://localhost:3000` 截取您的仪表盘屏幕截图**并**抓取 `https://github.com`，而您无需切换提供商或禁用 SSRF 防护。云端提供商永远看不到私有 URL。

此功能**默认开启**。要禁用它（所有 URL 都像以前一样发送到配置的云端提供商）：

```yaml
# ~/.hermes/config.yaml
browser:
  cloud_provider: browserbase
  auto_local_for_private_urls: false
```

禁用自动路由后，私有 URL 将被拒绝，并提示 `"Blocked: URL targets a private or internal address"`，除非您还设置了 `browser.allow_private_urls: true`（这允许云端提供商尝试访问它们——通常不会工作，因为 Browserbase 等无法访问您的局域网）。

要求：本地旁路进程使用与纯本地模式相同的 `agent-browser` CLI，因此您需要安装它（`hermes setup tools → 浏览器自动化` 会自动安装）。导航后从公网 URL 重定向到私有地址的操作仍然会被阻止（您无法使用重定向到内部地址的技巧通过公网路径访问您的局域网）。

### Camofox 本地模式

[Camofox](https://github.com/jo-inc/camofox-browser) 是一个自托管的 Node.js 服务器，它包装了 Camoufox（一个带有 C++ 指纹欺骗的 Firefox 分支）。它提供本地防检测浏览，无需云依赖。

```bash
# 首先克隆 Camofox 浏览器服务器
git clone https://github.com/jo-inc/camofox-browser
cd camofox-browser

# 使用默认容器设置，通过 Docker 构建并启动
# (自动检测架构：M1/M2 上为 aarch64，Intel 上为 x86_64)
make up

# 停止并移除默认容器
make down

# 强制重新构建（例如，在升级 VERSION/RELEASE 之后）
make reset

# 仅下载二进制文件而不构建
make fetch

# 显式覆盖架构或版本
make up ARCH=x86_64
make up VERSION=135.0.1 RELEASE=beta.24
```

`make up` 会立即启动默认容器。如果您需要自定义运行时设置，例如更大的 Node 堆内存、VNC 或持久化配置目录，请先构建镜像，然后自行运行：

```bash
# 构建镜像而不启动默认容器
make build

# 使用持久化、VNC 实时视图和更大的 Node 堆内存启动
mkdir -p ~/.camofox-docker
docker run -d \
  --name camofox-browser \
  --restart unless-stopped \
  -p 9377:9377 \
  -p 6080:6080 \
  -p 5901:5900 \
  -e CAMOFOX_PORT=9377 \
  -e ENABLE_VNC=1 \
  -e VNC_BIND=0.0.0.0 \
  -e VNC_RESOLUTION=1920x1080 \
  -e MAX_OLD_SPACE_SIZE=2048 \
  -v ~/.camofox-docker:/root/.camofox \
  camofox-browser:135.0.1-aarch64
```

启用 VNC 后，浏览器将以有头模式运行，您可以通过 `http://localhost:6080`（noVNC）在您的浏览器中实时观看。您也可以将本地 VNC 客户端连接到 `localhost:5901`。

如果您之前已经运行过 `make up`，请在启动自定义容器之前先停止并移除该默认容器：

```bash
make down
# 然后运行上面的自定义 docker run 命令
```

然后在 `~/.hermes/.env` 中设置：

```bash
CAMOFOX_URL=http://localhost:9377
```

或者通过 `hermes tools` → 浏览器自动化 → Camofox 进行配置。

当设置 `CAMOFOX_URL` 后，所有浏览器工具会自动通过 Camofox 路由，而不是使用 Browserbase 或 agent-browser。

#### 持久化浏览器会话

默认情况下，每个 Camofox 会话会获得一个随机身份——cookies 和登录状态不会跨智能体重启而保留。要启用持久化浏览器会话，请在 `~/.hermes/config.yaml` 中添加以下内容：

```yaml
browser:
  camofox:
    managed_persistence: true
```

然后完全重启 Hermes 以使新配置生效。

:::warning 嵌套路径很重要
Hermes 读取的是 `browser.camofox.managed_persistence`，**不是**顶层的 `managed_persistence`。一个常见的错误是写成：

```yaml
# ❌ 错误 — Hermes 会忽略此配置
managed_persistence: true
```

如果标志放在错误的路径，Hermes 会静默地回退到一个随机的临时 `userId`，您的登录状态将在每次会话时丢失。
:::

##### Hermes 做了什么
- 向 Camofox 发送一个确定性的、配置文件作用域的 `userId`，以便服务器可以在会话间复用相同的 Firefox 配置文件。
- 在清理时跳过服务端的上下文销毁，因此 cookies 和登录状态可以在智能体任务之间保留。
- 将 `userId` 限定在活跃的 Hermes 配置文件内，因此不同的 Hermes 配置文件会获得不同的浏览器配置文件（配置文件隔离）。

##### Hermes 没有做什么
- 它不会强制 Camofox 服务器启用持久化。Hermes 只是发送一个稳定的 `userId`；服务器必须通过将该 `userId` 映射到持久化的 Firefox 配置文件目录来遵守此设置。
- 如果您的 Camofox 服务器构建版本将每个请求都视为临时性的（例如，总是调用 `browser.newContext()` 而不加载存储的配置文件），Hermes 无法使这些会话持久化。请确保您运行的是一个实现了基于 `userId` 的配置文件持久化的 Camofox 构建版本。

##### 验证它是否工作

1.  启动 Hermes 和您的 Camofox 服务器。
2.  在一个浏览器任务中打开 Google（或任何登录网站）并手动登录。
3.  正常结束该浏览器任务。
4.  启动一个新的浏览器任务。
5.  再次打开同一个网站——您应该仍然处于登录状态。

如果第 5 步将您登出，则 Camofox 服务器未遵守稳定的 `userId`。请仔细检查您的配置路径，确认在编辑 `config.yaml` 后完全重启了 Hermes，并验证您的 Camofox 服务器版本支持按用户持久化配置文件。

##### 状态存储位置

Hermes 从配置文件作用域的目录 `~/.hermes/browser_auth/camofox/`（或非默认配置文件下 `$HERMES_HOME` 对应的路径）派生稳定的 `userId`。实际的浏览器配置文件数据存储在 Camofox 服务器端，由该 `userId` 键控。要完全重置一个持久化配置文件，请在 Camofox 服务器上清除它，并移除对应 Hermes 配置文件的状态目录。

#### 外部管理的 Camofox 会话

当另一个应用程序驱动可见的 Camofox 浏览器（例如桌面助手、自定义集成、另一个智能体）时，可以配置 Hermes 在该相同身份内运行，而不是生成自己的隔离配置文件。

三个旋钮控制此行为：

| 设置 | 环境变量 | 效果 |
|---------|---------|--------|
| `browser.camofox.user_id` | `CAMOFOX_USER_ID` | Hermes 创建标签页时使用的 Camofox `userId`。设置此项会将该会话纳入“外部管理”模式。 |
| `browser.camofox.session_key` | `CAMOFOX_SESSION_KEY` | 创建标签页时发送的 `sessionKey`（也称为 `listItemId`）。用于在采用过程中匹配现有标签页。如果未设置，则默认为每个任务一个值。 |
| `browser.camofox.adopt_existing_tab` | `CAMOFOX_ADOPT_EXISTING_TAB` | 当为 `true` 时，Hermes 在首次使用时会调用 `GET /tabs?userId=<user_id>`，并在创建新标签页之前复用现有标签页。 |

环境变量优先于 `config.yaml`。两种形式都有效：

```yaml
browser:
  camofox:
    user_id: shared-camofox
    session_key: visible-tab
    adopt_existing_tab: true
```

```bash
CAMOFOX_USER_ID=shared-camofox
CAMOFOX_SESSION_KEY=visible-tab
CAMOFOX_ADOPT_EXISTING_TAB=true
```

**设置 `user_id` 后的变化：**

-   Hermes 在任务结束时跳过破坏性清理（与 `managed_persistence: true` 相同）。另一个应用程序的标签页/cookies/配置文件会保留下来。
-   Hermes **不会**调用 `DELETE /sessions/<user_id>`——该端点会清除所有用户数据，如果执行则会破坏外部应用程序的会话。

**标签页采用如何工作（当 `adopt_existing_tab: true` 时）：**

1.  在进程启动后的第一次浏览器工具调用时，Hermes 会发出 `GET /tabs?userId=<user_id>`（5 秒超时）。
2.  如果响应中的任何标签页具有 `listItemId == session_key`，Hermes 会采用该组中最近创建的那个。
3.  否则，Hermes 会采用该用户最近创建的标签页（任何 `listItemId`）。
4.  如果不存在标签页或请求失败，Hermes 将回退到在下一个操作时创建新标签页。

采用操作仅在会话的 `tab_id` 被填充之前触发。如果外部应用程序在运行过程中关闭了被采用的标签页，下一个浏览器工具调用将出现 Camofox 错误——Hermes 不会在每次调用时重新轮询以获取新标签页。

**选择 `session_key`：** 如果您希望 Hermes 可靠地附加到*特定*的现有标签页，请将 `session_key` 设置为外部应用程序创建该标签页时使用的 `listItemId`。如果您只设置 `user_id` 而不设置 `session_key`，Hermes 会为每个任务生成一个 `session_key`（`task_<id>`）——Hermes 将与外部应用程序共享 cookies 和配置文件，但会打开自己的标签页，而不是复用一个。

**并发性说明：** 外部应用程序和 Hermes 可以同时驱动相同的 Camofox `userId`，但 Camofox 不会在客户端之间协调每个标签页的焦点。请在应用层协调所有权（例如，当 Hermes 运行时外部应用程序暂停）。

#### VNC 实时视图

当 Camofox 在有头模式下运行（有可见的浏览器窗口）时，它会在其健康检查响应中暴露一个 VNC 端口。Hermes 会自动发现此端口，并将 VNC URL 包含在导航响应中，因此智能体可以分享一个链接供您实时观看浏览器。

### 通过 CDP 使用本地 Chromium 系列浏览器 (`/browser connect`)

除了云提供商，您还可以通过 Chrome DevTools Protocol (CDP) 将 Hermes 浏览器工具连接到您自己正在运行的 Chrome、Brave、Chromium 或 Edge 实例。当您想实时查看智能体的操作、与需要您自己的 cookies/会话的页面交互，或避免云浏览器成本时，这非常有用。

:::note
`/browser connect` 是一个**交互式 CLI 斜杠命令**——它不由网关调度。如果您尝试在 WebUI、Telegram、Discord 或其他网关聊天中运行它，该消息将作为纯文本发送给智能体，命令不会执行。请从终端启动 Hermes（`hermes` 或 `hermes chat`）并在那里发出 `/browser connect`。
:::

在 CLI 中，使用：

```
/browser connect                 # 自动启动/连接到位于 http://127.0.0.1:9222 的本地 Chromium 系列浏览器
/browser connect ws://host:port  # 连接到特定的 CDP 端点
/browser status                  # 检查当前连接状态
/browser disconnect              # 断开连接并返回到云/本地模式
```

如果浏览器尚未以远程调试模式运行，Hermes 将尝试自动启动一个支持的 Chromium 系列浏览器，使用 `--remote-debugging-port=9222`。检测范围包括 Brave、Google Chrome、Chromium 和 Microsoft Edge，以及常见的 Linux 安装路径，如 `/opt/brave-bin/brave` 和 `/snap/bin/brave`。

:::tip
要手动启动一个启用了 CDP 的 Chromium 系列浏览器，请使用专用的 `user-data-dir`，这样即使浏览器已经以您的普通配置文件运行，调试端口也会实际启动：

```bash
# Linux — Brave
brave-browser \
  --remote-debugging-port=9222 \
  --user-data-dir=$HOME/.hermes/chrome-debug \
  --no-first-run \
  --no-default-browser-check &

# Linux — Google Chrome
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=$HOME/.hermes/chrome-debug \
  --no-first-run \
  --no-default-browser-check &

# macOS — Brave
"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.hermes/chrome-debug" \
  --no-first-run \
  --no-default-browser-check &

# macOS — Google Chrome
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.hermes/chrome-debug" \
  --no-first-run \
  --no-default-browser-check &
```

然后启动 Hermes CLI 并运行 `/browser connect`。

**为什么需要 `--user-data-dir`？** 如果没有它，在已运行普通实例的情况下启动 Chromium 系列浏览器通常会在现有进程上打开一个新窗口——而那个现有进程没有使用 `--remote-debugging-port` 启动，因此端口 9222 永远不会打开。专用的 `user-data-dir` 会强制启动一个新的浏览器进程，其中调试端口会实际监听。`--no-first-run --no-default-browser-check` 会跳过新配置文件的首次启动向导。
:::

当通过 CDP 连接时，所有浏览器工具（`browser_navigate`、`browser_click` 等）都在您活动的浏览器实例上操作，而不是启动一个云端会话。

### WSL2 + Windows Chrome：优先使用 MCP 而非 `/browser connect`

如果 Hermes 在 WSL2 内运行，但您想控制的 Chrome 窗口运行在 Windows 主机上，`/browser connect` 通常不是最佳路径。

原因如下：

-   `/browser connect` 期望 Hermes 本身能够到达一个可用的 CDP 端点
-   现代 Chrome 实时调试会话通常暴露一个主机本地端点，该端点从 WSL 访问不像经典 `9222` 端口那样直接可达
-   即使 Windows Chrome 是可调试的，最简洁的集成方式通常是让 Windows 端的浏览器 MCP 服务器附加到 Chrome，然后让 Hermes 与该 MCP 服务器通信

对于这种设置，请优先通过 Hermes MCP 支持使用 `chrome-devtools-mcp`。

请参阅 MCP 指南了解实际设置方法：

- [在 Hermes 中使用 MCP](../../guides/use-mcp-with-hermes.md#wsl2-bridge-hermes-in-wsl-to-windows-chrome)

### 本地浏览器模式

如果您**没有**设置任何云凭据，并且不使用 `/browser connect`，Hermes 仍然可以通过由 `agent-browser` 驱动的本地 Chromium 安装来使用浏览器工具。

### 可选环境变量

```bash
# 用于更好解决验证码的住宅代理 (默认: "true")
BROWSERBASE_PROXIES=true

# 使用自定义 Chromium 的高级隐身功能 - 需要 Scale 计划 (默认: "false")
BROWSERBASE_ADVANCED_STEALTH=false

# 断开连接后重连会话 - 需要付费计划 (默认: "true")
BROWSERBASE_KEEP_ALIVE=true

# 自定义会话超时 (毫秒) (默认: 项目默认值)
# 示例: 600000 (10分钟), 1800000 (30分钟)
BROWSERBASE_SESSION_TIMEOUT=600000

# 自动清理前的不活动超时 (秒) (默认: 120)
BROWSER_INACTIVITY_TIMEOUT=120

# 额外的 Chromium 启动标志 (逗号或换行分隔)。当 Hermes 检测到 root 用户或 AppArmor 限制的
# 非特权用户命名空间 (Ubuntu 23.10+, DGX Spark, 许多容器镜像) 时，会自动注入
# `--no-sandbox,--disable-dev-shm-usage`，因此大多数用户不需要设置此项。仅当您需要 Hermes
# 未自动添加的标志时才手动设置；设置此项会禁用自动注入。
AGENT_BROWSER_ARGS=--no-sandbox
```

### 安装 agent-browser CLI

```bash
npm install -g agent-browser
# 或者在仓库中本地安装：
npm install
```

:::info
`browser` 工具集必须包含在您配置的 `toolsets` 列表中，或者通过 `hermes config set toolsets '["hermes-cli", "browser"]'` 启用。
:::

## 可用工具

### `browser_navigate`

导航至一个URL。必须在调用任何其他浏览器工具之前使用。用于初始化Browserbase会话。

```
Navigate to https://github.com/NousResearch
```

:::tip
对于简单的信息检索，建议使用 `web_search` 或 `web_extract` —— 它们更快且成本更低。当您需要**与页面交互**（点击按钮、填写表单、处理动态内容）时，才使用浏览器工具。
:::

### `browser_snapshot`

获取当前页面的无障碍树的基于文本的快照。返回带有引用ID（如 `@e1`、`@e2`）的交互式元素，这些ID可用于 `browser_click` 和 `browser_type`。

- **`full=false`**（默认）：紧凑视图，仅显示交互式元素
- **`full=true`**：完整的页面内容

超过8000字符的快照会由LLM自动摘要。

### `browser_click`

通过快照中的引用ID点击一个元素。

```
Click @e5 to press the "Sign In" button
```

### `browser_type`

向输入框中输入文本。会先清空字段，然后输入新文本。

```
Type "hermes agent" into the search field @e3
```

### `browser_scroll`

上下滚动页面以显示更多内容。

```
Scroll down to see more results
```

### `browser_press`

按下一个键盘键。用于提交表单或导航。

```
Press Enter to submit the form
```

支持的键：`Enter`、`Tab`、`Escape`、`ArrowDown`、`ArrowUp` 等。

### `browser_back`

导航回浏览器历史记录中的上一个页面。

### `browser_get_images`

列出当前页面上的所有图像及其URL和备用文本。用于查找要分析的图像。

### `browser_vision`

截取屏幕截图并使用视觉AI进行分析。当文本快照无法捕获重要视觉信息时使用此工具——对验证码、复杂布局或视觉验证挑战特别有用。

截图会持久保存，文件路径将与AI分析结果一起返回。在消息平台（Telegram、Discord、Slack、WhatsApp）上，您可以要求智能体分享截图——它将通过 `MEDIA:` 机制作为原生照片附件发送。

```
What does the chart on this page show?
```

截图存储在 `~/.hermes/cache/screenshots/` 中，并在24小时后自动清理。

### `browser_console`

获取当前页面的浏览器控制台输出（日志/警告/错误消息）和未捕获的JavaScript异常。对于检测无障碍树中未显示的隐蔽JS错误至关重要。

```
Check the browser console for any JavaScript errors
```

使用 `clear=True` 可在读取后清除控制台，以便后续调用只显示新消息。

`browser_console` 在使用 `expression` 参数调用时也会计算JavaScript——与DevTools控制台形式相同，结果会进行解析（JSON序列化的对象变为字典；原始值保持原样）。

```
browser_console(expression="document.querySelector('h1').textContent")
browser_console(expression="JSON.stringify(performance.timing)")
```

当当前会话激活了CDP监管器时（对于任何在支持CDD的后端运行过 `browser_navigate` 的会话，这很典型），评估会通过监管器的持久WebSocket运行——没有子进程启动成本。否则，将回退到标准智能体-浏览器CLI路径。两种方式行为完全一致；只有延迟会变化。

### `browser_cdp`

原始Chrome开发工具协议透传——用于处理其他工具未涵盖的浏览器操作的逃生舱。用于处理原生对话框、iframe范围内的评估、Cookie/网络控制，或智能体需要的任何CDP动词。

**仅在会话开始时可以连接CDP端点时可用**——即 `/browser connect` 已连接到正在运行的Chrome、Brave、Chromium或Edge浏览器，或 `config.yaml` 中设置了 `browser.cdp_url`。默认的本地智能体-浏览器模式、Camofox和云提供商（Browserbase、Browser Use、Firecrawl）目前不向此工具公开CDP——云提供商有每个会话的CDP URL，但实时会话路由是后续工作。

**CDP方法参考：** https://chromedevtools.github.io/devtools-protocol/ —— 智能体可以 `web_extract` 特定方法的页面来查找参数和返回格式。

常见模式：

```
# 列出标签页（浏览器级别，无target_id）
browser_cdp(method="Target.getTargets")

# 处理标签页上的原生JS对话框
browser_cdp(method="Page.handleJavaScriptDialog",
            params={"accept": true, "promptText": ""},
            target_id="<tabId>")

# 在特定标签页中评估JS
browser_cdp(method="Runtime.evaluate",
            params={"expression": "document.title", "returnByValue": true},
            target_id="<tabId>")

# 获取所有Cookie
browser_cdp(method="Network.getAllCookies")
```

浏览器级方法（`Target.*`、`Browser.*`、`Storage.*`）省略 `target_id`。页面级方法（`Page.*`、`Runtime.*`、`DOM.*`、`Emulation.*`）需要 `Target.getTargets` 返回的 `target_id`。每个无状态调用都是独立的——会话不会在调用之间持久化。

**跨域iframe：** 传递 `frame_id`（来自 `browser_snapshot.frame_tree.children[]`，其中 `is_oopif=true`）以通过监管器的实时会话将CDP调用路由到该iframe。这是在Browserbase上，无状态CDP连接会遇到签名URL过期问题时，在跨域iframe内运行 `Runtime.evaluate` 的方式。示例：

```
browser_cdp(
  method="Runtime.evaluate",
  params={"expression": "document.title", "returnByValue": True},
  frame_id="<frame_id from browser_snapshot>",
)
```

同源iframe不需要 `frame_id` —— 可以从顶层 `Runtime.evaluate` 使用 `document.querySelector('iframe').contentDocument` 代替。

### `browser_dialog`

响应原生JS对话框（`alert` / `confirm` / `prompt` / `beforeunload`）。在此工具存在之前，对话框会静默阻塞页面的JavaScript线程，后续的 `browser_*` 调用会挂起或抛出异常；现在智能体可以在 `browser_snapshot` 输出中看到待处理的对话框并显式响应。

**工作流程：**
1.  调用 `browser_snapshot`。如果对话框正在阻塞页面，它会显示为 `pending_dialogs: [{"id": "d-1", "type": "alert", "message": "..."}]`。
2.  调用 `browser_dialog(action="accept")` 或 `browser_dialog(action="dismiss")`。对于 `prompt()` 对话框，传递 `prompt_text="..."` 来提供响应。
3.  重新快照——`pending_dialogs` 为空；页面的JS线程已恢复。

**检测通过持久的CDP监管器自动进行** —— 每个任务一个WebSocket，订阅Page/Runtime/Target事件。监管器还在快照中填充一个 `frame_tree` 字段，以便智能体可以看到当前页面的iframe结构，包括跨域（OOPIF）iframe。

**可用性矩阵：**

| 后端 | 通过 `pending_dialogs` 检测 | 响应（`browser_dialog` 工具） |
|---|---|---|
| 通过 `/browser connect` 或 `browser.cdp_url` 连接的本地Chrome | ✓ | ✓ 完整工作流程 |
| Browserbase | ✓ | ✓ 完整工作流程（通过注入的XHR桥接） |
| Camofox / 默认本地智能体-浏览器 | ✗ | ✗（无CDP端点） |

**在Browserbase上如何工作。** Browserbase的CDP代理会在服务器端自动在约10ms内关闭真实的原生对话框，因此我们无法使用 `Page.handleJavaScriptDialog`。监管器通过 `Page.addScriptToEvaluateOnNewDocument` 注入一个小脚本，用同步XHR覆盖 `window.alert`/`confirm`/`prompt`。我们通过 `Fetch.enable` 拦截这些XHR——页面的JS线程会一直阻塞在XHR上，直到我们用智能体的响应调用 `Fetch.fulfillRequest`。`prompt()` 的返回值会原封不动地回传到页面JS中。

**对话框策略** 在 `config.yaml` 的 `browser.dialog_policy` 下配置：

| 策略 | 行为 |
|--------|----------|
| `must_respond`（默认） | 捕获，在快照中显示，等待显式的 `browser_dialog()` 调用。安全自动关闭，在 `browser.dialog_timeout_s`（默认300秒）后，以防有缺陷的智能体无限期阻塞。 |
| `auto_dismiss` | 捕获，立即关闭。智能体仍在 `browser_state` 历史记录中看到对话框，但无需采取行动。 |
| `auto_accept` | 捕获，立即接受。当导航带有激进 `beforeunload` 提示的页面时很有用。 |

`browser_snapshot.frame_tree` 内的**帧树**限制为最多30个帧，OOPIF深度为2，以在广告繁重的页面上保持载荷有界。当达到限制时，会出现 `truncated: true` 标志；需要完整树的智能体可以使用 `browser_cdp` 的 `Page.getFrameTree`。

## 实践示例

### 填写网络表单

```
用户：在 example.com 上用我的邮箱 john@example.com 注册账户

智能体工作流程：
1. browser_navigate("https://example.com/signup")
2. browser_snapshot()  → 查看表单字段及引用
3. browser_type(ref="@e3", text="john@example.com")
4. browser_type(ref="@e5", text="SecurePass123")
5. browser_click(ref="@e8")  → 点击"创建账户"
6. browser_snapshot()  → 确认注册成功
```

### 研究动态内容

```
用户：现在 GitHub 上最热门的趋势仓库有哪些？

智能体工作流程：
1. browser_navigate("https://github.com/trending")
2. browser_snapshot(full=true)  → 读取趋势仓库列表
3. 返回格式化结果
```

## 会话录制

自动将浏览器会话录制为 WebM 视频文件：

```yaml
browser:
  record_sessions: true  # 默认: false
```

启用后，录制会在首次调用 `browser_navigate` 时自动开始，并在会话关闭时保存到 `~/.hermes/browser_recordings/` 目录。在本地和云端（Browserbase）模式下均可工作。超过 72 小时的录制文件会被自动清理。

## 隐身功能

Browserbase 提供自动隐身功能：

| 功能         | 默认状态 | 说明                                     |
|--------------|----------|------------------------------------------|
| 基础隐身     | 始终开启 | 随机指纹、视口随机化、验证码自动解决     |
| 住宅代理     | 开启     | 通过住宅 IP 路由以获得更好的访问性       |
| 高级隐身     | 关闭     | 自定义 Chromium 构建，需使用高级计划     |
| 保持连接     | 开启     | 网络中断后自动重新连接会话               |

:::note
若您的计划不包含付费功能，Hermes 会自动回退——首先禁用 `keepAlive`，然后禁用代理——因此免费计划仍可正常使用浏览功能。
:::

## 会话管理

- 每个任务通过 Browserbase 获得一个隔离的浏览器会话
- 闲置后会话会自动清理（默认：2 分钟）
- 后台线程每 30 秒检查一次失效会话
- 进程退出时会执行紧急清理以防止孤立会话
- 会话通过 Browserbase API（`REQUEST_RELEASE` 状态）释放

## 限制

- **基于文本的交互** — 依赖于可访问性树，而非像素坐标
- **快照大小** — 大型页面可能在 8000 字符处被截断或经 LLM 总结
- **会话超时** — 云端会话的有效期取决于您的服务提供商计划设置
- **成本** — 云端会话会消耗服务商额度；对话结束或闲置后会话会自动清理。使用 `/browser connect` 进行免费本地浏览。
- **无文件下载** — 无法从浏览器下载文件