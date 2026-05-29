---
title: 浏览器自动化
description: 通过多个提供商、本地 Chromium 系列浏览器 (通过 CDP) 或云浏览器来控制浏览器，以进行网页交互、表单填写、数据抓取等。
sidebar_label: 浏览器
sidebar_position: 5
---

# 浏览器自动化

Hermes 智能体包含一套完整的浏览器自动化工具集，提供多种后端选项：

- **Browserbase 云模式** 通过 [Browserbase](https://browserbase.com) 提供托管云浏览器和反机器人工具
- **Browser Use 云模式** 通过 [Browser Use](https://browser-use.com) 作为替代云浏览器提供商
- **Firecrawl 云模式** 通过 [Firecrawl](https://firecrawl.dev) 提供内置抓取功能的云浏览器
- **Camofox 本地模式** 通过 [Camofox](https://github.com/jo-inc/camofox-browser) 进行本地反检测浏览 (基于 Firefox 的指纹伪装)
- **本地 Chromium 系列 CDP** — 使用 `/browser connect` 命令将浏览器工具连接到您自己的 Chrome、Brave、Chromium 或 Edge 实例
- **本地浏览器模式** 通过 `agent-browser` 命令行工具和本地 Chromium 安装实现

在所有模式下，智能体都可以导航网站、与页面元素交互、填写表单并提取信息。

## 概览

页面以**可访问性树** (基于文本的快照) 形式表示，这使其非常适合大语言模型智能体使用。交互式元素会获得引用 ID (如 `@e1`、`@e2`)，智能体使用这些 ID 进行点击和输入。

核心能力：

- **多提供商云执行** — Browserbase、Browser Use 或 Firecrawl — 无需本地浏览器
- **本地 Chromium 系列集成** — 通过 CDP 连接到您正在运行的 Chrome、Brave、Chromium 或 Edge 浏览器，实现手动浏览
- **内置隐匿功能** — 随机指纹、验证码解决、住宅代理 (Browserbase)
- **会话隔离** — 每个任务拥有独立的浏览器会话
- **自动清理** — 不活跃的会话将在超时后关闭
- **视觉分析** — 截屏 + 人工智能分析，实现视觉理解

## 设置

:::tip Nous 订阅用户
如果您拥有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，您可以通过 **[工具网关](tool-gateway.md)** 使用浏览器自动化功能，无需任何单独的 API 密钥。新安装可以运行 `hermes setup --portal` 来登录并一次性启用所有网关工具；现有安装可以通过 `hermes model` 或 `hermes tools` 选择 **Nous Subscription** 作为浏览器提供商。
:::

### Browserbase 云端模式

要使用 Browserbase 托管的云端浏览器，请添加：

```bash
# 添加到 ~/.hermes/.env
BROWSERBASE_API_KEY=***
BROWSERBASE_PROJECT_ID=your-project-id-here
```

在 [browserbase.com](https://browserbase.com) 获取您的凭证。

### Browser Use 云端模式

要将 Browser Use 用作您的云端浏览器提供商，请添加：

```bash
# 添加到 ~/.hermes/.env
BROWSER_USE_API_KEY=***
```

在 [browser-use.com](https://browser-use.com) 获取您的 API 密钥。Browser Use 通过其 REST API 提供云端浏览器。如果同时设置了 Browserbase 和 Browser Use 的凭证，Browserbase 优先。

### Firecrawl 云端模式

要将 Firecrawl 用作您的云端浏览器提供商，请添加：

```bash
# 添加到 ~/.hermes/.env
FIRECRAWL_API_KEY=fc-***
```

在 [firecrawl.dev](https://firecrawl.dev) 获取您的 API 密钥。然后选择 Firecrawl 作为您的浏览器提供商：

```bash
hermes setup tools
# → Browser Automation → Firecrawl
```

可选设置：

```bash
# 自托管的 Firecrawl 实例（默认：https://api.firecrawl.dev）
FIRECRAWL_API_URL=http://localhost:3002

# 会话 TTL，单位为秒（默认：300）
FIRECRAWL_BROWSER_TTL=600
```

### 混合路由：公共网址用云端，局域网/本地主机用本地

当配置了云端提供商时，Hermes 会为解析到私有/回环/局域网地址（`localhost`、`127.0.0.1`、`192.168.x.x`、`10.x.x.x`、`172.16-31.x.x`、`*.local`、`*.lan`、`*.internal`、IPv6 回环地址 `::1`、链路本地地址 `169.254.x.x`）的网址自动启动一个 **本地 Chromium 旁路进程**。公共网址在同一会话中继续使用云端提供商。

这解决了常见的“我在本地开发但使用 Browserbase”的工作流程——智能体可以截取您在 `http://localhost:3000` 上的仪表板截图，**并且** 抓取 `https://github.com`，无需您切换提供商或禁用 SSRF 防护。云端提供商永远不会看到私有网址。

此功能 **默认开启**。要禁用它（所有网址都像以前一样发送到配置的云端提供商）：

```yaml
# ~/.hermes/config.yaml
browser:
  cloud_provider: browserbase
  auto_local_for_private_urls: false
```

禁用自动路由后，私有网址将被拒绝并显示 `"Blocked: URL targets a private or internal address"`，除非您还设置了 `browser.allow_private_urls: true`（这会让云端提供商尝试访问它们——通常不会成功，因为 Browserbase 等无法访问您的局域网）。

要求：本地旁路进程使用与纯本地模式相同的 `agent-browser` CLI，因此您需要安装它（`hermes setup tools → Browser Automation` 会自动安装）。导航后从公共网址重定向到私有地址的情况仍然会被阻止（您无法使用重定向到内部地址的技巧通过公共路径访问您的局域网）。

### Camofox 本地模式

[Camofox](https://github.com/jo-inc/camofox-browser) 是一个自托管的 Node.js 服务器，它封装了 Camoufox（一个具有 C++ 指纹伪装功能的 Firefox 分支）。它提供本地反检测浏览，无需云依赖。

```bash
# 首先克隆 Camofox 浏览器服务器
git clone https://github.com/jo-inc/camofox-browser
cd camofox-browser

# 使用默认容器设置通过 Docker 构建并启动
# （自动检测架构：M1/M2 上为 aarch64，Intel 上为 x86_64）
make up

# 停止并移除默认容器
make down

# 强制干净重建（例如，在升级 VERSION/RELEASE 后）
make reset

# 仅下载二进制文件而不构建
make fetch

# 显式覆盖架构或版本
make up ARCH=x86_64
make up VERSION=135.0.1 RELEASE=beta.24
```

`make up` 会立即启动默认容器。如果您想要自定义运行时设置，例如更大的 Node 堆、VNC 或持久化配置文件目录，请先构建镜像，然后自行运行：

```bash
# 构建镜像但不启动默认容器
make build

# 使用持久化、VNC 实时视图和更大的 Node 堆启动
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

启用 VNC 后，浏览器将在 headed 模式下运行，您可以在浏览器中通过 `http://localhost:6080` (noVNC) 实时观看。您也可以将原生 VNC 客户端连接到 `localhost:5901`。

如果您已经运行了 `make up`，请先停止并移除该默认容器，然后再启动自定义容器：

```bash
make down
# 然后运行上面的自定义 docker run 命令
```

然后在 `~/.hermes/.env` 中设置：

```bash
CAMOFOX_URL=http://localhost:9377
```

如果 Camofox 在 Docker 中运行，并且您希望它打开由宿主机提供的 Web 应用，请启用回环地址重写。`CAMOFOX_URL` 仍应指向宿主机发布的控制 API，但页面 URL（如 `http://127.0.0.1:3000`）必须从容器内部以 `http://host.docker.internal:3000` 的形式打开：

```yaml
# ~/.hermes/config.yaml
browser:
  camofox:
    rewrite_loopback_urls: true
    loopback_host_alias: host.docker.internal  # 默认值；如需可使用局域网 IP
```

等效的环境变量：

```bash
CAMOFOX_REWRITE_LOOPBACK_URLS=true
CAMOFOX_LOOPBACK_HOST_ALIAS=host.docker.internal
```

此重写仅适用于具有回环主机（`localhost`、`127.0.0.1`、`::1`）的页面导航 URL。它不会更改 `CAMOFOX_URL`。对于非 Docker 的 Camofox 安装（浏览器已在宿主机上运行且回环 URL 正确），请保持禁用。

或通过 `hermes tools` → Browser Automation → Camofox 进行配置。

设置 `CAMOFOX_URL` 后，所有浏览器工具将自动通过 Camofox 路由，而不是 Browserbase 或 agent-browser。

#### 持久化浏览器会话

默认情况下，每个 Camofox 会话获得一个随机身份——cookies 和登录状态在智能体重启后不会保留。要启用持久化浏览器会话，请将以下内容添加到 `~/.hermes/config.yaml`：

```yaml
browser:
  camofox:
    managed_persistence: true
```

然后完全重启 Hermes 以使新配置生效。

:::warning 嵌套路径很重要
Hermes 读取 `browser.camofox.managed_persistence`，**不是** 顶层的 `managed_persistence`。一个常见的错误是写成：

```yaml
# ❌ 错误 — Hermes 会忽略这个
managed_persistence: true
```

如果标志放在错误的路径，Hermes 会静默回退到一个随机的临时 `userId`，您的登录状态将在每个会话中丢失。
:::

##### Hermes 做什么
- 向 Camofox 发送一个确定性的、作用域限定于配置文件的 `userId`，以便服务器可以在会话间重用相同的 Firefox 配置文件。
- 跳过清理时的服务器端上下文销毁，以便 cookies 和登录状态在智能体任务之间得以保留。
- 将 `userId` 的作用域限定为活动的 Hermes 配置文件，因此不同的 Hermes 配置文件获得不同的浏览器配置文件（配置文件隔离）。

##### Hermes 不做什么
- 它不会强制 Camofox 服务器进行持久化。Hermes 只发送一个稳定的 `userId`；服务器必须通过将该 `userId` 映射到持久化的 Firefox 配置文件目录来遵守它。
- 如果您的 Camofox 服务器构建将每个请求视为临时的（例如，总是调用 `browser.newContext()` 而不加载存储的配置文件），Hermes 无法使这些会话持久化。请确保您正在运行一个实现了基于 userId 的配置文件持久化的 Camofox 构建版本。

##### 验证其是否正常工作

1.  启动 Hermes 和您的 Camofox 服务器。
2.  在浏览器任务中打开 Google（或任何需要登录的网站）并手动登录。
3.  正常结束浏览器任务。
4.  启动一个新的浏览器任务。
5.  再次打开同一个网站——您应该仍然处于登录状态。

如果第 5 步将您注销，说明 Camofox 服务器没有遵守稳定的 `userId`。请仔细检查您的配置路径，确认您在编辑 `config.yaml` 后完全重启了 Hermes，并验证您的 Camofox 服务器版本支持基于用户的持久化配置文件。

##### 状态存储位置

Hermes 从作用域限定于配置文件的目录 `~/.hermes/browser_auth/camofox/`（或非默认配置文件下 `$HERMES_HOME` 下的等效目录）派生出稳定的 `userId`。实际的浏览器配置文件数据存储在 Camofox 服务器端，以该 `userId` 为键。要完全重置持久化配置文件，请在 Camofox 服务器上清除它，并移除相应 Hermes 配置文件的状态目录。

#### 外部管理的 Camofox 会话

当另一个应用程序驱动可见的 Camofox 浏览器（例如桌面助手、自定义集成、另一个智能体）时，请配置 Hermes 在该同一身份内操作，而不是生成其自己的隔离配置文件。

三个控制项管理此行为：

| 设置 | 环境变量 | 效果 |
|------|----------|------|
| `browser.camofox.user_id` | `CAMOFOX_USER_ID` | Hermes 创建标签页时使用的 Camofox `userId`。设置此项将使会话进入“外部管理”模式。 |
| `browser.camofox.session_key` | `CAMOFOX_SESSION_KEY` | 标签页创建时发送的 `sessionKey`（又称 `listItemId`）。用于在“接纳”期间匹配现有标签页。如果未设置，则默认为每个任务一个值。 |
| `browser.camofox.adopt_existing_tab` | `CAMOFOX_ADOPT_EXISTING_TAB` | 为 true 时，Hermes 在首次使用时调用 `GET /tabs?userId=<user_id>` 并在创建新标签页前重用现有标签页。 |

环境变量优先于 `config.yaml`。两种形式均可：

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

- Hermes 在任务结束时跳过破坏性清理（与 `managed_persistence: true` 相同）。另一个应用程序的标签页/cookies/配置文件得以保留。
- Hermes **不会** 调用 `DELETE /sessions/<user_id>` — 该端点会清除所有用户数据，如果触发，会摧毁外部应用程序的会话。

**标签页接纳工作原理（当 `adopt_existing_tab: true` 时）：**

1.  在进程启动后的第一次浏览器工具调用时，Hermes 发出 `GET /tabs?userId=<user_id>`（5 秒超时）。
2.  如果响应中任何标签页的 `listItemId == session_key`，Hermes 将接纳该组中最近创建的标签页。
3.  否则，Hermes 将接纳该用户（任意 `listItemId`）最近创建的标签页。
4.  如果不存在标签页或请求失败，Hermes 将回退到在下一次操作时创建新标签页。

“接纳”仅在会话的 `tab_id` 被填充之前触发。如果外部应用程序在运行过程中关闭了被接纳的标签页，下一次浏览器工具调用将出现 Camofox 错误——Hermes 不会在每次调用时重新轮询以获取新标签页。

**选择 `session_key`：** 如果您希望 Hermes 可靠地附加到一个*特定的*现有标签页，请将 `session_key` 设置为外部应用程序在创建它时使用的 `listItemId`。如果您只设置 `user_id` 而不设置 `session_key`，Hermes 会生成一个每个任务的 `session_key`（`task_<id>`）——Hermes 将与外部应用程序共享 cookies 和配置文件，但会打开自己的标签页，而不是重用现有的。

**并发说明：** 外部应用程序和 Hermes 可以同时驱动相同的 Camofox `userId`，但 Camofox 不会协调客户端之间的标签页焦点。请在应用层协调所有权（例如，当 Hermes 运行时外部应用程序暂停）。

#### VNC 实时视图

当 Camofox 以 headed 模式运行（有可见的浏览器窗口）时，它会在其健康检查响应中暴露一个 VNC 端口。Hermes 会自动发现此端口并在导航响应中包含 VNC URL，因此智能体可以共享一个链接供您实时观看浏览器。

### 通过 CDP 使用本地 Chromium 系浏览器 (`/browser connect`)

您也可以将 Hermes 浏览器工具通过 Chrome 开发者工具协议 (CDP) 附加到您自己正在运行的 Chrome、Brave、Chromium 或 Edge 实例，而不是使用云端提供商。当您想实时查看智能体在做什么、与需要您自己的 cookies/会话的页面交互，或避免云浏览器费用时，这很有用。

:::note
`/browser connect` 是一个 **交互式 CLI 斜杠命令** — 它不会由网关调度。如果您尝试在 WebUI、Telegram、Discord 或其他网关聊天中运行它，该消息将作为纯文本发送给智能体，命令将不会执行。请从终端启动 Hermes（`hermes` 或 `hermes chat`），并在那里发出 `/browser connect`。
:::

在 CLI 中，使用：

```
/browser connect                 # 自动启动/连接到本地 Chromium 系浏览器 http://127.0.0.1:9222
/browser connect ws://host:port  # 连接到特定的 CDP 端点
/browser status                  # 检查当前连接
/browser disconnect              # 断开连接并返回云端/本地模式
```

如果浏览器尚未以远程调试模式运行，Hermes 将尝试使用 `--remote-debugging-port=9222` 自动启动一个受支持的 Chromium 系浏览器。检测包括 Brave、Google Chrome、Chromium 和 Microsoft Edge，以及常见的 Linux 安装路径，如 `/opt/brave-bin/brave` 和 `/snap/bin/brave`。

:::tip
要手动启动启用了 CDP 的 Chromium 系浏览器，请使用专用的用户数据目录，这样即使浏览器已经使用您的正常配置文件运行，调试端口实际上也会开启：

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

**为什么需要 `--user-data-dir`？** 如果不使用它，在已有常规实例运行时启动 Chromium 系浏览器通常会在现有进程上打开一个新窗口——而该现有进程启动时没有 `--remote-debugging-port`，因此端口 9222 永远不会打开。专用的 user-data-dir 会强制启动一个全新的浏览器进程，调试端口实际上会在其中监听。`--no-first-run --no-default-browser-check` 会跳过新配置文件的首次启动向导。
:::

通过 CDP 连接后，所有浏览器工具（`browser_navigate`、`browser_click` 等）将在您的实时浏览器实例上操作，而不是启动云端会话。

### WSL2 + Windows Chrome：优先使用 MCP 而非 `/browser connect`

如果 Hermes 在 WSL2 内运行，但您想要控制的 Chrome 窗口运行在 Windows 宿主机上，那么 `/browser connect` 通常不是最佳路径。

原因如下：
- `/browser connect` 要求 Hermes 本身能够访问可用的 CDP 端点。
- 现代 Chrome 实时调试会话通常暴露一个仅限宿主机本地的端点，从 WSL 中无法像经典 `9222` 端口那样直接访问。
- 即使 Windows Chrome 是可调试的，最干净的集成方式通常是让 Windows 端的浏览器 MCP 服务器附加到 Chrome，然后让 Hermes 与该 MCP 服务器通信。

对于这种设置，优先通过 Hermes MCP 支持使用 `chrome-devtools-mcp`。

有关实际设置，请参见 MCP 指南：

- [在 WSL2 桥接场景下使用 Hermes MCP](../../guides/use-mcp-with-hermes.md#wsl2-bridge-hermes-in-wsl-to-windows-chrome)

### 本地浏览器模式

如果您 **没有** 设置任何云凭证，并且不使用 `/browser connect`，Hermes 仍然可以通过由 `agent-browser` 驱动的本地 Chromium 安装来使用浏览器工具。

### 可选环境变量

```bash
# 用于更好解决 CAPTCHA 的住宅代理（默认："true"）
BROWSERBASE_PROXIES=true

# 使用自定义 Chromium 的高级隐身功能 - 需要 Scale 计划（默认："false"）
BROWSERBASE_ADVANCED_STEALTH=false

# 断开连接后的会话重连 - 需要付费计划（默认："true"）
BROWSERBASE_KEEP_ALIVE=true

# 自定义会话超时时间，单位为毫秒（默认：项目默认值）
# 例如：600000（10分钟），1800000（30分钟）
BROWSERBASE_SESSION_TIMEOUT=600000

# 自动清理前的不活动超时时间，单位为秒（默认：120）
BROWSER_INACTIVITY_TIMEOUT=120

# 额外的 Chromium 启动标志（用逗号或换行分隔）。当 Hermes 检测到 root 或 AppArmor 限制的
# 非特权用户命名空间（Ubuntu 23.10+、DGX Spark、许多容器镜像）时，会自动注入
# `--no-sandbox,--disable-dev-shm-usage`，因此大多数用户不需要设置此项。仅当您需要
# Hermes 未自动添加的标志时才手动设置；设置它会禁用自动注入。
AGENT_BROWSER_ARGS=--no-sandbox
```

### 安装 agent-browser CLI

```bash
npm install -g agent-browser
# 或在仓库中本地安装：
npm install
```

:::info
`browser` 工具集必须包含在您配置的 `toolsets` 列表中，或通过 `hermes config set toolsets '["hermes-cli", "browser"]'` 启用。
:::

## 可用工具

### `browser_navigate`

导航至 URL。必须在调用任何其他浏览器工具之前调用。初始化 Browserbase 会话。

```
导航至 https://github.com/NousResearch
```

:::tip
对于简单的信息检索，优先使用 `web_search` 或 `web_extract` —— 它们更快、成本更低。当你需要**与页面交互**（点击按钮、填写表单、处理动态内容）时，才使用浏览器工具。
:::

### `browser_snapshot`

获取当前页面无障碍树的基于文本的快照。返回带有引用 ID（如 `@e1`、`@e2`）的交互元素，供 `browser_click` 和 `browser_type` 使用。

- **`full=false`**（默认）：紧凑视图，仅显示交互元素
- **`full=true`**：完整页面内容

超过 8000 个字符的快照将由 LLM 自动总结。

### `browser_click`

点击快照中由引用 ID 标识的元素。

```
点击 @e5 以按下“登录”按钮
```

### `browser_type`

在输入框中输入文本。先清除输入框，然后输入新文本。

```
在搜索框 @e3 中输入“hermes agent”
```

### `browser_scroll`

向上或向下滚动页面以显示更多内容。

```
向下滚动以查看更多结果
```

### `browser_press`

按下键盘按键。用于提交表单或导航。

```
按下 Enter 以提交表单
```

支持的按键：`Enter`、`Tab`、`Escape`、`ArrowDown`、`ArrowUp` 等。

### `browser_back`

导航回浏览器历史记录中的上一页。

### `browser_get_images`

列出当前页面上所有图片的 URL 和替代文本。用于查找要分析的图片。

### `browser_vision`

截取屏幕截图并使用视觉 AI 进行分析。当文本快照无法捕获重要视觉信息时使用此工具 —— 对于验证码、复杂布局或视觉验证挑战尤其有用。

截图会持久保存，文件路径与 AI 分析结果一起返回。在消息平台（Telegram、Discord、Slack、WhatsApp）上，你可以要求智能体分享截图 —— 通过 `MEDIA:` 机制，它将作为原生照片附件发送。

```
此页面上的图表显示了什么？
```

截图存储在 `~/.hermes/cache/screenshots/` 中，24 小时后自动清理。

### `browser_console`

获取浏览器控制台输出（日志/警告/错误消息）和当前页面未捕获的 JavaScript 异常。对于检测在无障碍树中不可见的静默 JS 错误至关重要。

```
检查浏览器控制台是否有任何 JavaScript 错误
```

使用 `clear=True` 在读取后清除控制台，这样后续调用只会显示新消息。

`browser_console` 在使用 `expression` 参数调用时也会计算 JavaScript —— 形状与 DevTools 控制台相同，结果经过解析（JSON 序列化的对象变成字典；原始值保持原始形式）。

```
browser_console(expression="document.querySelector('h1').textContent")
browser_console(expression="JSON.stringify(performance.timing)")
```

当当前会话启用了 CDP 主管（对于任何在支持 CDP 的后端上运行过 `browser_navigate` 的会话都很典型）时，计算通过主管的持久 WebSocket 运行 —— 没有子进程启动成本。否则，会通过标准智能体-浏览器 CLI 路径进行。两种方式的行为相同；只有延迟会变化。

### `browser_cdp`

原始 Chrome DevTools Protocol 直通 —— 这是用于其他工具未涵盖的浏览器操作的逃生通道。用于原生对话框处理、iframe 作用域内的计算、cookie/网络控制，或智能体需要的任何 CDP 动词。

**仅当会话开始时有可达的 CDP 端点时才可用** —— 这意味着 `/browser connect` 已连接到正在运行的 Chrome、Brave、Chromium 或 Edge 浏览器，或者在 `config.yaml` 中设置了 `browser.cdp_url`。默认的本地智能体浏览器模式、Camofox 和云提供商（Browserbase、Browser Use、Firecrawl）目前未向此工具暴露 CDP —— 云提供商有按会话的 CDP URL，但实时会话路由是后续跟进的内容。

**CDP 方法参考：** https://chromedevtools.github.io/devtools-protocol/ —— 智能体可以 `web_extract` 特定方法的页面来查阅参数和返回形状。

常见模式：

```
# 列出标签页（浏览器级别，无 target_id）
browser_cdp(method="Target.getTargets")

# 在标签页上处理原生 JS 对话框
browser_cdp(method="Page.handleJavaScriptDialog",
            params={"accept": true, "promptText": ""},
            target_id="<tabId>")

# 在特定标签页中计算 JS
browser_cdp(method="Runtime.evaluate",
            params={"expression": "document.title", "returnByValue": true},
            target_id="<tabId>")

# 获取所有 cookie
browser_cdp(method="Network.getAllCookies")
```

浏览器级方法（`Target.*`、`Browser.*`、`Storage.*`）省略 `target_id`。页面级方法（`Page.*`、`Runtime.*`、`DOM.*`、`Emulation.*`）需要来自 `Target.getTargets` 的 `target_id`。每个无状态调用都是独立的 —— 会话在调用之间不持久。

**跨源 iframe：** 传递 `frame_id`（来自 `browser_snapshot.frame_tree.children[]`，其中 `is_oopif=true`），通过主管的实时会话为该 iframe 路由 CDP 调用。这就是在 Browserbase 上如何在跨源 iframe 内部运行 `Runtime.evaluate` 的，其中无状态 CDP 连接会遇到签名 URL 过期问题。示例：

```
browser_cdp(
  method="Runtime.evaluate",
  params={"expression": "document.title", "returnByValue": True},
  frame_id="<来自 browser_snapshot 的 frame_id>",
)
```

同源 iframe 不需要 `frame_id` —— 使用顶层 `Runtime.evaluate` 中的 `document.querySelector('iframe').contentDocument` 代替。

### `browser_dialog`

响应原生 JS 对话框（`alert` / `confirm` / `prompt` / `beforeunload`）。在此工具出现之前，对话框会静默阻塞页面的 JavaScript 线程，后续的 `browser_*` 调用会挂起或抛出错误；现在智能体在 `browser_snapshot` 输出中看到待处理的对话框并明确响应。

**工作流程：**
1. 调用 `browser_snapshot`。如果对话框正在阻塞页面，它将显示为 `pending_dialogs: [{"id": "d-1", "type": "alert", "message": "..."}]`。
2. 调用 `browser_dialog(action="accept")` 或 `browser_dialog(action="dismiss")`。对于 `prompt()` 对话框，传递 `prompt_text="..."` 以提供响应。
3. 重新进行快照 —— `pending_dialogs` 为空；页面的 JS 线程已恢复。

**检测通过持久 CDP 主管自动进行** —— 每个任务一个 WebSocket，订阅 Page/Runtime/Target 事件。主管还在快照中填充 `frame_tree` 字段，以便智能体可以看到当前页面的 iframe 结构，包括跨源 (OOPIF) iframe。

**可用性矩阵：**

| 后端 | 通过 `pending_dialogs` 检测 | 响应（`browser_dialog` 工具） |
|---|---|---|
| 通过 `/browser connect` 或 `browser.cdp_url` 连接的本地 Chrome | ✓ | ✓ 完整工作流 |
| Browserbase | ✓ | ✓ 完整工作流（通过注入的 XHR 桥接） |
| Camofox / 默认本地智能体浏览器 | ✗ | ✗（无 CDP 端点） |

**在 Browserbase 上的工作原理。** Browserbase 的 CDP 代理在服务器端约 10 毫秒内自动关闭真正的原生对话框，因此我们无法使用 `Page.handleJavaScriptDialog`。主管通过 `Page.addScriptToEvaluateOnNewDocument` 注入一个小脚本，用同步 XHR 覆盖 `window.alert`/`confirm`/`prompt`。我们通过 `Fetch.enable` 拦截这些 XHR —— 页面的 JS 线程保持阻塞在 XHR 上，直到我们用智能体的响应调用 `Fetch.fulfillRequest`。`prompt()` 返回值不变地往返传递回页面 JS。

**对话框策略**在 `config.yaml` 中的 `browser.dialog_policy` 下配置：

| 策略 | 行为 |
|--------|----------|
| `must_respond`（默认） | 捕获，在快照中显示，等待明确的 `browser_dialog()` 调用。安全自动关闭在 `browser.dialog_timeout_s`（默认 300 秒）后，以防有缺陷的智能体无限期停滞。 |
| `auto_dismiss` | 捕获，立即关闭。智能体仍在 `browser_state` 历史记录中看到对话框，但无需采取行动。 |
| `auto_accept` | 捕获，立即接受。在导航带有激进 `beforeunload` 提示的页面时很有用。 |

**Frame tree** 在 `browser_snapshot.frame_tree` 内部，为限制广告繁多页面上的有效载荷大小，上限为 30 个框架和 OOPIF 深度 2。当达到限制时会显示 `truncated: true` 标志；需要完整树的智能体可以使用带有 `Page.getFrameTree` 的 `browser_cdp`。

## 实际示例

### 填写网络表单

```
用户：使用我的邮箱 john@example.com 在 example.com 注册一个账户

智能体工作流程：
1. browser_navigate("https://example.com/signup")
2. browser_snapshot()  → 看到表单字段及其引用
3. browser_type(ref="@e3", text="john@example.com")
4. browser_type(ref="@e5", text="SecurePass123")
5. browser_click(ref="@e8")  → 点击“创建账户”
6. browser_snapshot()  → 确认注册成功
```

### 研究动态内容

```
用户：目前 GitHub 上最热门的仓库是什么？

智能体工作流程：
1. browser_navigate("https://github.com/trending")
2. browser_snapshot(full=true)  → 读取热门仓库列表
3. 返回格式化结果
```

## 会话录制

自动将浏览器会话录制为 WebM 视频文件：

```yaml
browser:
  record_sessions: true  # 默认值：false
```

启用后，录制会在首次 `browser_navigate` 时自动开始，并在会话关闭时保存到 `~/.hermes/browser_recordings/`。支持本地和云端（Browserbase）两种模式。超过 72 小时的录制文件会被自动清理。

## 隐身功能

Browserbase 提供自动隐身功能：

| 功能 | 默认值 | 备注 |
|---------|---------|-------|
| 基础隐身 | 始终开启 | 随机指纹、视口随机化、验证码破解 |
| 住宅代理 | 开启 | 通过住宅 IP 路由以获得更好的访问效果 |
| 高级隐身 | 关闭 | 定制 Chromium 构建，需要 Scale 计划 |
| 保持活动 | 开启 | 网络中断后会话重连 |

:::note
如果您的计划不包含付费功能，Hermes 会自动回退 — 先禁用 `keepAlive`，再禁用代理 — 因此免费计划仍可正常浏览。
:::

## 会话管理

- 每个任务通过 Browserbase 获得一个隔离的浏览器会话
- 会话在闲置后自动清理（默认：2 分钟）
- 后台线程每 30 秒检查一次过期会话
- 进程退出时进行紧急清理以防止孤立会话
- 会话通过 Browserbase API 释放（状态为 `REQUEST_RELEASE`）

## 限制

- **基于文本的交互** — 依赖无障碍树，而非像素坐标
- **快照大小** — 大页面可能被截断或由 LLM 在 8000 字符处进行总结
- **会话超时** — 云端会话根据您的提供商计划设置过期
- **成本** — 云端会话消耗提供商额度；会话在对话结束或闲置后自动清理。使用 `/browser connect` 进行免费本地浏览。
- **无文件下载** — 无法从浏览器下载文件