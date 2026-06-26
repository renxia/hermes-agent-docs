---
title: Browser Automation
description: Control browsers with multiple providers, local Chromium-family browsers via CDP, or cloud browsers for web interaction, form filling, scraping, and more.
sidebar_label: Browser
sidebar_position: 5
---

# 浏览器自动化

Hermes 智能体包含一套完整的浏览器自动化工具集，并提供多种后端选项：

- **Browserbase 云模式**：通过 [Browserbase](https://browserbase.com) 提供托管云浏览器和反机器人工具。
- **Browser Use 云模式**：作为另一种云浏览器提供商。
- **Firecrawl 云模式**：用于内置数据抓取的云浏览器。
- **Camofox 本地模式**：用于本地反检测浏览（基于Firefox的指纹伪造）。
- **本地Chromium系列CDP**：使用`/browser connect`将浏览器工具连接到您自己的Chrome、Brave、Chromium或Edge实例。
- **本地浏览器模式**：通过`agent-browser` CLI和本地Chromium安装实现。

在所有模式下，该智能体都可以浏览网站、与页面元素进行交互、填写表单和提取信息。

## 概述

页面以**可访问性树**（基于文本的快照）形式表示，这使其非常适合LLM智能体。交互式元素会获得引用ID（如@e1、@e2），智能体利用这些ID进行点击和输入。

主要功能：

- **多提供商云执行**：Browserbase、Browser Use 或 Firecrawl，无需本地浏览器。
- **本地Chromium系列集成**：通过CDP将工具附加到正在运行的Chrome、Brave、Chromium或Edge浏览器，进行实际操作浏览。
- **内置隐身功能**：随机指纹、CAPTCHA求解、住宅代理（Browserbase）。
- **会话隔离**：每个任务都有自己的浏览器会话。
- **自动清理**：不活动的会话会在超时后被关闭。
- **视觉分析**：截图+AI分析，实现视觉理解。

## Setup

:::tip Nous Subscribers
如果您有付费的[Nous Portal](https://portal.nousresearch.com)订阅，您可以通过**[Tool Gateway](tool-gateway.md)**使用浏览器自动化功能，而无需任何单独的API密钥。新安装的用户可以运行`hermes setup --portal`来登录并同时开启所有网关工具；现有安装用户可以通过`hermes model`或`hermes tools`选择**Nous Subscription**作为浏览器提供商。
:::

### Browserbase 云模式

要使用由Browserbase管理的云浏览器，请添加：

```bash
# Add to ~/.hermes/.env
BROWSERBASE_API_KEY=***
BROWSERBASE_PROJECT_ID=your-project-id-here
```

在[browserbase.com](https://browserbase.com)获取您的凭证。

### Browser Use 云模式

要使用Browser Use作为云浏览器提供商，请添加：

```bash
# Add to ~/.hermes/.env
BROWSER_USE_API_KEY=***
```

在[browser-use.com](https://browser-use.com)获取您的API密钥。Browser Use通过其REST API提供云浏览器。如果同时设置了Browserbase和Browser Use的凭证，则以Browserbase为优先。

### Firecrawl 云模式

要使用Firecrawl作为云浏览器提供商，请添加：

```bash
# Add to ~/.hermes/.env
FIRECRAWL_API_KEY=fc-***
```

在[firecrawl.dev](https://firecrawl.dev)获取您的API密钥。然后选择Firecrawl作为您的浏览器提供商：

```bash
hermes setup tools
# → Browser Automation → Firecrawl
```

可选设置：

```bash
# Self-hosted Firecrawl 实例（默认: https://api.firecrawl.dev）
FIRECRAWL_API_URL=http://localhost:3002

# 会话TTL（秒）（默认: 300）
FIRECRAWL_BROWSER_TTL=600
```

### 混合路由：公共 URL 使用云服务，LAN/localhost 使用本地服务

当配置了云提供商后，Hermes 会自动启动一个**本地 Chromium 伴侣进程（local Chromium sidecar）**来处理解析到私有/回环/局域网地址（`localhost`、`127.0.0.1`、`192.168.x.x`、`10.x.x.x`、`172.16-31.x.x`、`*.local`、`*.lan`、`*.internal`、IPv6回环地址`::1`、链路本地地址`169.254.x.x`）的URL。公共 URL 仍然使用云提供商进行对话。

这解决了“我在本地开发但使用了Browserbase”这一常见工作流程——**智能体**可以截取 `http://localhost:3000` 的仪表板，同时抓取 `https://github.com`，而无需你切换提供商或禁用SSRF防护。云提供商永远看不到私有 URL。

此功能**默认开启**。要禁用它（所有URL都发送到配置的云提供商，如以前一样）：

```yaml
# ~/.hermes/config.yaml
browser:
  cloud_provider: browserbase
  auto_local_for_private_urls: false
```

当自动路由被禁用时，私有 URL 会被拒绝，提示`"Blocked: URL targets a private or internal address"`，除非你也设置了`browser.allow_private_urls: true`（这允许云提供商尝试访问它们——通常不会成功，因为Browserbase等服务无法到达你的局域网）。

要求：本地伴侣进程使用与纯本地模式相同的`agent-browser` CLI，因此你需要安装它（`hermes setup tools → Browser Automation` 会自动安装）。从公共 URL 到私有地址的导航重定向仍然会被阻止（你不能通过公有路径使用“重定向到内部”的技巧来访问你的局域网）。

### Camofox 本地模式

[Camofox](https://github.com/jo-inc/camofox-browser) 是一个自托管的Node.js服务器，它包装了Camoufox（一个带有C++指纹识别欺骗的Firefox分支）。它提供本地的反检测浏览功能，无需云依赖。

```bash
# Clone the Camofox browser server first
git clone https://github.com/jo-inc/camofox-browser
cd camofox-browser

# Build and start with Docker using the default container settings
# (auto-detects arch: aarch64 on M1/M2, x86_64 on Intel)
make up

# Stop and remove the default container
make down

# Force a clean rebuild (for example, after upgrading VERSION/RELEASE)
make reset

# Just download binaries without building
make fetch

# Override arch or version explicitly
make up ARCH=x86_64
make up VERSION=135.0.1 RELEASE=beta.24
```

`make up` 会立即启动默认容器。如果你需要自定义运行时设置，例如更大的Node堆、VNC或持久化配置文件目录，请先构建镜像，然后自己运行：

```bash
# Build the image without starting the default container
make build

# Start with persistence, VNC live view, and a larger Node heap
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

启用VNC后，浏览器以带头模式（headed mode）运行，您可以在`http://localhost:6080`（noVNC）上通过浏览器实时观看。您也可以将原生VNC客户端连接到`localhost:5901`。

如果你已经运行了`make up`，请先停止并删除该默认容器，然后再启动自定义的docker run命令：

```bash
make down
# then run the custom docker run command above
```

然后在`~/.hermes/.env`中设置：

```bash
CAMOFOX_URL=http://localhost:9377
```

如果Camofox在Docker中运行，并且你想让它打开由宿主机提供的Web应用，请启用回环重写（loopback rewriting）。`CAMOFOX_URL`仍然应该指向宿主机的控制API，但页面 URL，例如 `http://127.0.0.1:3000`，必须从容器内部以 `http://host.docker.internal:3000` 的形式打开：

```yaml
# ~/.hermes/config.yaml
browser:
  camofox:
    rewrite_loopback_urls: true
    loopback_host_alias: host.docker.internal  # default; use a LAN IP if needed
```

等效的环境变量：

```bash
CAMOFOX_REWRITE_LOOPBACK_URLS=true
CAMOFOX_LOOPBACK_HOST_ALIAS=host.docker.internal
```

重写功能仅适用于带有回环主机（`localhost`、`127.0.0.1`、`::1`）的页面导航 URL。它不会更改 `CAMOFOX_URL`。对于非Docker的Camofox安装，请保持禁用状态，因为浏览器已经在宿主机上运行，且回环 URL 是正确的。

或者通过`hermes tools` → Browser Automation → Camofox 进行配置。

当设置了`CAMOFOX_URL`时，所有浏览器工具都会自动通过Camofox进行路由，而不是通过Browserbase或agent-browser。

#### 持久化浏览器会话

默认情况下，每个Camofox会话都有一个随机的身份——Cookie和登录信息不会跨智能体重启保留。要启用持久化浏览器会话，请向`~/.hermes/config.yaml`添加以下内容：

```yaml
browser:
  camofox:
    managed_persistence: true
```

然后完全重启Hermes以加载新的配置。

:::warning Nested path matters
Hermes 读取 `browser.camofox.managed_persistence`，**而不是**顶级的 `managed_persistence`。一个常见的错误是写：

```yaml
# ❌ 错误 — Hermes 会忽略此项
managed_persistence: true
```

如果该标志放置在错误的路径上，Hermes 将静默地回退到随机的临时 `userId`，你的登录状态将在每次会话中丢失。
:::

##### Hermes 的功能

*   向Camofox发送一个确定性的、限定于配置文件的 `userId`，以便服务器可以在会话之间重用相同的Firefox配置文件。
*   跳过了清理时的服务器端上下文销毁，因此在智能体任务之间，Cookie和登录信息得以保留。
*   将 `userId` 限定到活动的Hermes配置文件中，这样不同的Hermes配置文件就能获得不同的浏览器配置文件（配置文件隔离）。

##### Hermes 不具备的功能

*   它不会强制Camofox服务器持久化。Hermes 只是发送一个稳定的 `userId`；服务器必须通过将该 `userId` 映射到一个持久化的Firefox配置文件目录来响应它。
*   如果你的Camofox服务器构建版本将每次请求都视为临时性的（例如，总是调用`browser.newContext()`而没有加载存储的配置文件），Hermes 就无法使这些会话得以持久化。请确保你运行的是实现了基于userId的配置文件持久化的Camofox构建版本。

##### 验证功能是否正常工作

1.  启动Hermes和你的Camofox服务器。
2.  在浏览器任务中打开Google（或任何登录网站）并手动登录。
3.  正常结束该浏览器任务。
4.  启动一个新的浏览器任务。
5.  再次打开同一个网站——你应该仍然处于登录状态。

如果第5步你被登出，说明Camofox服务器没有响应稳定的 `userId`。请仔细检查你的配置路径，确认你在编辑`config.yaml`后完全重启了Hermes，并验证你的Camofox服务器版本是否支持基于用户的持久化配置文件。

##### 状态存储在哪里

Hermes 从限定于配置文件的目录 `~/.hermes/browser_auth/camofox/`（或对于非默认配置的 `$HERMES_HOME` 下的等效路径）推导出稳定的 `userId`。实际的浏览器配置文件数据存储在Camofox服务器端，并以该 `userId` 为键。要完全重置持久化配置文件，请在Camofox服务器上清除它，并删除相应的Hermes配置文件状态目录。

#### 外部管理的Camofox会话

当另一个应用驱动可见的Camofox浏览器（例如桌面助手、自定义集成、其他智能体）时，配置Hermes在那个相同的身份内部运行，而不是启动自己的隔离配置文件。

有三个设置来控制其行为：

| 设置 | Env var | 效果 |
|---------|---------|--------|
| `browser.camofox.user_id` | `CAMOFOX_USER_ID` | Hermes 在创建标签页时使用的Camofox `userId`。设置此项将会话置于“外部管理”模式。 |
| `browser.camofox.session_key` | `CAMOFOX_SESSION_KEY` | 发送在创建标签页时使用的 `sessionKey`（即 `listItemId`）。用于在采纳过程中匹配现有标签页。如果未设置，则默认为每个任务的值。 |
| `browser.camofox.adopt_existing_tab` | `CAMOFOX_ADOPT_EXISTING_TAB` | 如果为 true，Hermes 在首次使用时会调用 `GET /tabs?userId=<user_id>`，并在创建新标签页之前重用一个现有标签页。 |

环境变量优先于`config.yaml`。任一形式均可：

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

**设置`user_id`时的变化：**

*   Hermes 跳过了任务结束时的破坏性清理（与 `managed_persistence: true` 相同）。其他应用的标签页/Cookie/配置文件得以保留。
*   Hermes **不会**调用 `DELETE /sessions/<user_id>`——该端点会清除所有用户数据，如果它被触发，则会毁掉外部应用的会话。

**标签页采纳（Tab Adoption）的工作原理（当`adopt_existing_tab: true`时）：**

1.  在进程启动后的第一次浏览器工具调用中，Hermes 会发出 `GET /tabs?userId=<user_id>` (5秒超时)。
2.  如果响应中的任何标签页具有 `listItemId == session_key`，Hermes 就会采纳该组中最近创建的一个。
3.  否则，Hermes 就会采纳该用户（任意 `listItemId`）最近创建的标签页。
4.  如果没有标签页或请求失败，Hermes 会在下一次操作中回退到创建新标签页。

只有在会话的`tab_id`被填充后，采纳功能才会触发。如果外部应用在运行过程中关闭了被采纳的标签页，下一次浏览器工具调用将显示一个Camofox错误——Hermes 不会在每次调用时重新轮询以获取新的标签页。

**选择 `session_key`：** 如果你想让Hermes可靠地附加到一个*特定的*现有标签页，请将 `session_key` 设置为外部应用在创建它时使用的 `listItemId`。如果你保持 `session_key` 未设置而只设置了 `user_id`，Hermes 会生成一个每个任务的 `session_key` (`task_<id>`)——Hermes 将与外部应用共享 Cookie 和配置文件，但会打开自己的标签页而不是重用一个。

**并发注意事项：** 外部应用和Hermes可以同时驱动同一个Camofox `userId`，但Camofox不协调客户端之间的按标签页划分焦点。请在应用程序层（例如，外部应用暂停而Hermes运行）进行协调。

#### VNC 实时视图

当Camofox以带头模式运行时（带有可见的浏览器窗口），它会在健康检查响应中暴露一个VNC端口。Hermes 会自动发现这一点，并将VNC URL包含在导航响应中，因此智能体可以分享一个链接，供你实时观看浏览器。

### 通过 CDP 的本地 Chromium 家族浏览器（`/browser connect`）

除了云提供商之外，您还可以通过 Chrome DevTools Protocol (CDP) 将Hermes浏览器工具附加到自己正在运行的Chrome、Brave、Chromium或Edge实例上。这在你想实时看到智能体在做什么、与需要你自己的 Cookie/会话的页面进行交互，或者避免云浏览器成本时非常有用。

:::note
`/browser connect` 是一个**交互式命令行斜杠命令**——它不会被网关分派。如果你尝试在WebUI、Telegram、Discord或其他网关聊天中运行它，消息将作为纯文本发送给智能体，该命令将不会执行。请从终端启动Hermes（`hermes` 或 `hermes chat`）并在那里发出 `/browser connect` 命令。
:::

在CLI中使用：

```
/browser connect                 # 自动启动/连接到 http://127.0.0.1:9222 的本地 Chromium 家族浏览器
/browser connect ws://host:port  # 连接到特定的 CDP 端点
/browser status                  # 检查当前连接状态
/browser disconnect              # 断开连接并返回云/本地模式
```

如果浏览器尚未运行带有远程调试功能，Hermes 将尝试自动启动一个支持的 Chromium 家族浏览器，使用 `--remote-debugging-port=9222` 参数。检测包括Brave、Google Chrome、Chromium和Microsoft Edge，常见的Linux安装路径如 `/opt/brave-bin/brave` 和 `/snap/bin/brave`。

:::tip
要手动启动带有 CDP 的 Chromium 家族浏览器，请使用专用的用户数据目录（user-data-dir），这样即使浏览器已经使用正常配置文件运行，调试端口也能成功启动：

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

然后启动Hermes CLI并运行 `/browser connect`。

**为什么需要 `--user-data-dir`？** 如果没有它，当一个常规实例正在运行时启动Chromium家族浏览器，通常会打开现有进程上的新窗口——而那个现有进程并没有使用 `--remote-debugging-port` 启动，因此端口9222永远不会打开。专用的用户数据目录强制启动一个新的浏览器进程，该进程的调试端口才能真正监听。`--no-first-run --no-default-browser-check` 会跳过新配置文件的首次启动向导。
:::

通过CDP连接后，所有浏览器工具（`browser_navigate`、`browser_click`等）都在你的实时浏览器实例上操作，而不是启动一个云会话。

### WSL2 + Windows Chrome：优先使用 MCP 而非 `/browser connect`

如果Hermes运行在WSL2中，但你想要控制的Chrome窗口是在Windows宿主机上运行，那么`/browser connect` 通常不是最佳选择。

原因如下：

*   `/browser connect` 期望Hermes本身能够到达一个可用的CDP端点。
*   现代Chrome实时调试会话通常会暴露一个本地宿主机的端点，这与经典的 `9222` 端口一样，不能被WSL直接访问。
*   即使Windows Chrome是可调试的，最干净的集成方式通常是让一个Windows端的浏览器MCP服务器附加到Chrome，然后让Hermes与该MCP服务器通信。

对于这种设置，请优先通过Hermes MCP支持使用 `chrome-devtools-mcp`。

查阅 MCP 指南以了解实际设置：

*   [Use MCP with Hermes](../../guides/use-mcp-with-hermes.md#wsl2-bridge-hermes-in-wsl-to-windows-chrome)

### 本地浏览器模式

如果你**没有**设置任何云凭证，并且不使用`/browser connect`，Hermes 仍然可以通过由 `agent-browser` 驱动的本地 Chromium 安装来使用浏览器工具。

### 可选的环境变量

```bash
# Residential proxies for better CAPTCHA solving (default: "true")
BROWSERBASE_PROXIES=true

# Advanced stealth with custom Chromium — requires Scale Plan (default: "false")
BROWSERBASE_ADVANCED_STEALTH=false

# Session reconnection after disconnects — requires paid plan (default: "true")
BROWSERBASE_KEEP_ALIVE=true

# Custom session timeout in seconds (max 21600 = 6 hours) (default: project default)
# Examples: 600 (10min), 1800 (30min), 21600 (6h max)
BROWSERBASE_SESSION_TIMEOUT=1800

# Inactivity timeout before auto-cleanup in seconds (default: 120)
BROWSER_INACTIVITY_TIMEOUT=120

# Extra Chromium launch flags (comma- or newline-separated). Hermes auto-injects
# `--no-sandbox,--disable-dev-shm-usage` when it detects root or AppArmor-restricted
# unprivileged user namespaces (Ubuntu 23.10+, DGX Spark, many container images),
# so most users don't need to set this. Set it manually only if you need a flag
# Hermes doesn't add automatically; setting it disables the auto-injection.
AGENT_BROWSER_ARGS=--no-sandbox
```

### 安装 agent-browser CLI

```bash
npm install -g agent-browser
# Or install locally in the repo:
npm install
```

:::info
`browser` 工具集必须包含在配置的 `toolsets` 列表中，或通过 `hermes config set toolsets '["hermes-cli", "browser"]'` 启用。
:::

## 可用工具 (Available Tools)

### `browser_navigate`

导航到指定的 URL。必须在任何其他浏览器工具之前调用。初始化 Browserbase 会话。

```
Navigate to https://github.com/NousResearch
```

:::tip
对于简单的信息检索，请优先使用 `web_search` 或 `web_extract` — 它们更快、更便宜。当您需要与页面**互动**时（点击按钮、填写表单、处理动态内容），请使用浏览器工具。
:::

### `browser_snapshot`

获取当前页面的基于文本的无障碍树快照。返回包含 `@e1`、`@e2` 等引用 ID 的交互式元素，供 `browser_click` 和 `browser_type` 使用。

- **`full=false`** (默认): 紧凑视图，仅显示交互式元素
- **`full=true`**: 完整的页面内容

快照超过 8000 个字符的内容会被 LLM 自动摘要。

### `browser_click`

点击由快照识别出的、带有引用 ID 的元素。

```
Click @e5 to press the "Sign In" button
```

### `browser_type`

将文本输入到输入字段中。先清除该字段，然后输入新文本。

```
Type "hermes agent" into the search field @e3
```

### `browser_scroll`

滚动页面，向上或向下以显示更多内容。

```
Scroll down to see more results
```

### `browser_press`

按下键盘按键。对于提交表单或导航非常有用。

```
Press Enter to submit the form
```

支持的按键包括：`Enter`、`Tab`、`Escape`、`ArrowDown`、`ArrowUp` 等。

### `browser_back`

在浏览器历史记录中返回到上一个页面。

### `browser_get_images`

列出当前页面上的所有图片及其 URL 和替代文本。这对于查找需要分析的图片非常有用。

### `browser_vision`

拍摄截图并使用视觉 AI 进行分析。当文本快照无法捕获重要视觉信息时（例如 CAPTCHA、复杂布局或视觉验证挑战），请使用此工具。

截图会被持久保存，文件路径会和 AI 分析结果一起返回。在消息平台（Telegram, Discord, Slack, WhatsApp）上，您可以要求智能体分享截图——它将通过 `MEDIA:` 机制作为原生照片附件发送。

```
What does the chart on this page show?
```

截图存储在 `~/.hermes/cache/screenshots/` 中，并在 24 小时后自动清理。

### `browser_console`

获取当前页面的浏览器控制台输出（日志/警告/错误消息）和未捕获的 JavaScript 异常。这对于检测那些不会出现在无障碍树中的静默 JS 错误至关重要。

```
Check the browser console for any JavaScript errors
```

使用 `clear=True` 来清除控制台，这样后续的调用只会显示新的消息。

`browser_console` 在使用 `expression` 参数调用时还会评估 JavaScript — 其形状与 DevTools 控制台相同，结果会以解析后的形式返回（JSON 序列化的对象变为字典；原始值保持为原始类型）。

```
browser_console(expression="document.querySelector('h1').textContent")
browser_console(expression="JSON.stringify(performance.timing)")
```

当当前会话处于 CDP 监督者模式时（对于任何调用 `browser_navigate` 到支持 CDP 的后端的所有会话都是如此），评估将在监督者的持久 WebSocket 上运行 — 无需子进程启动成本。否则，它将回退到标准的智能体-浏览器 CLI 路径。无论哪种情况行为都相同；只是延迟不同。

### `browser_cdp`

原始的 Chrome DevTools Protocol 透传——这是用于其他工具未涵盖的浏览器操作的逃生舱口。可用于原生对话框处理、iframe 范围内的评估、Cookie/网络控制，或智能体所需的任何 CDP 方法。

**仅在会话开始时可以访问 CDP 端点时可用** — 这意味着 `/browser connect` 已连接到正在运行的 Chrome、Brave、Chromium 或 Edge 浏览器，或者 `config.yaml` 中设置了 `browser.cdp_url`。默认的本地智能体-浏览器模式（Camofox）和云提供商（Browserbase, Browser Use, Firecrawl）目前不向此工具暴露 CDP — 云提供商有会话级别的 CDP URL，但实时会话路由是一个后续工作。

**CDP 方法参考:** https://chromedevtools.github.io/devtools-protocol/ — 智能体可以 `web_extract` 特定方法的页面以查找参数和返回形状。

常见模式：

```
# 列出标签页（浏览器级别，无 target_id）
browser_cdp(method="Target.getTargets")

# 处理某个标签页上的原生 JS 对话框
browser_cdp(method="Page.handleJavaScriptDialog",
            params={"accept": true, "promptText": ""},
            target_id="<tabId>")

# 在特定标签页中评估 JS
browser_cdp(method="Runtime.evaluate",
            params={"expression": "document.title", "returnByValue": true},
            target_id="<tabId>")

# 获取所有 Cookie
browser_cdp(method="Network.getAllCookies")
```

浏览器级别的方法（`Target.*`、`Browser.*`、`Storage.*`）不需要 `target_id`。页面级别的方法（`Page.*`、`Runtime.*`、`DOM.*`、`Emulation.*`）需要从 `Target.getTargets` 获取的 `target_id`。每次无状态调用都是独立的 — 会话之间不会持久化。

**跨域 iframe:** 将 `frame_id`（来自 `browser_snapshot.frame_tree.children[]` 且 `is_oopif=true`）传递给 CDP 调用，以通过监督者的实时会话路由该 iframe。这就是在 Browserbase 上方跨域 iframe 中 `Runtime.evaluate` 的工作方式，因为无状态的 CDP 连接可能会遇到签名 URL 过期问题。示例：

```
browser_cdp(
  method="Runtime.evaluate",
  params={"expression": "document.title", "returnByValue": True},
  frame_id="<from browser_snapshot 的 frame_id>",
)
```

同源 iframe 不需要 `frame_id` — 而是从顶级 `Runtime.evaluate` 中使用 `document.querySelector('iframe').contentDocument`。

### `browser_dialog`

响应原生 JS 对话框（`alert` / `confirm` / `prompt` / `beforeunload`）。在引入此工具之前，对话框会静默地阻塞页面的 JavaScript 线程，随后的 `browser_*` 调用可能会挂起或抛出错误；现在智能体可以在 `browser_snapshot` 输出中看到待定的对话框并进行显式响应。

**工作流程:**
1. 调用 `browser_snapshot`。如果有对话框正在阻止页面，它将显示为 `pending_dialogs: [{"id": "d-1", "type": "alert", "message": "..."}]`。
2. 调用 `browser_dialog(action="accept")` 或 `browser_dialog(action="dismiss")`。对于 `prompt()` 对话框，请传递 `prompt_text="..."` 以提供响应。
3. 重新快照 — `pending_dialogs` 将为空；页面的 JS 线程已恢复。

**检测机制是自动的**，通过一个持久的 CDP 监督者实现 — 每个任务对应一个订阅了 Page/Runtime/Target 事件的 WebSocket。该监督者还会填充快照中的 `frame_tree` 字段，使智能体能够看到当前页面的 iframe 结构，包括跨域（OOPIF）iframe。

**可用性矩阵:**

| 后端 | 通过 `pending_dialogs` 检测 | 响应 (`browser_dialog` 工具) |
|---|---|---|
| 通过 `/browser connect` 或 `browser.cdp_url` 的本地 Chrome | ✓ | ✓ 完全工作流程 |
| Browserbase | ✓ | ✓ 完全工作流程（通过注入的 XHR 桥接） |
| Camofox / 默认本地智能体-浏览器 | ✗ | ✗ (没有 CDP 端点) |

**在 Browserbase 上的工作原理。** Browserbase 的 CDP 代理会在服务器端自动处理原生对话框，耗时约 10ms，因此我们不能使用 `Page.handleJavaScriptDialog`。监督者会通过 `Page.addScriptToEvaluateOnNewDocument` 注入一个小型脚本来覆盖 `window.alert`/`confirm`/`prompt`，使其与同步 XHR 通信。我们通过 `Fetch.enable` 拦截这些 XHR — 直到我们使用智能体的响应调用 `Fetch.fulfillRequest`，页面的 JS 线程就会保持阻塞在 XHR 上。`prompt()` 的返回值会原样返回到页面 JS 中。

**对话框策略** 配置在 `config.yaml` 的 `browser.dialog_policy` 下：

| 策略 | 行为 |
|--------|----------|
| `must_respond` (默认) | 捕获，显示在快照中，等待显式的 `browser_dialog()` 调用。如果智能体出错，它不会无限期地卡住，因此会进行自动处理（在 `browser.dialog_timeout_s`（默认为 300 秒）之后）。 |
| `auto_dismiss` | 捕获，立即忽略。智能体仍然会在 `browser_state` 历史记录中看到该对话框，但无需采取行动。 |
| `auto_accept` | 捕获，立即接受。当导航到带有激进 `beforeunload` 提示的页面时特别有用。 |

**Frame tree**（位于 `browser_snapshot.frame_tree` 中）被限制为 30 个框架和 2 层 OOPIF 深度，以保持在重度广告页面上的负载可控。当达到限制时，会显示一个 `truncated: true` 标志；需要完整树状图的智能体可以使用 `Page.getFrameTree` 和 `browser_cdp`。

## 实际示例 (Practical Examples)

### 填写网页表单

```
User: Sign up for an account on example.com with my email john@example.com

Agent workflow:
1. browser_navigate("https://example.com/signup")
2. browser_snapshot()  → 看到带有引用 ID 的表单字段
3. browser_type(ref="@e3", text="john@example.com")
4. browser_type(ref="@e5", text="SecurePass123")
5. browser_click(ref="@e8")  → 点击 "Create Account"
6. browser_snapshot()  → 确认成功
```

### 研究动态内容

```
User: What are the top trending repos on GitHub right now?

Agent workflow:
1. browser_navigate("https://github.com/trending")
2. browser_snapshot(full=true)  → 读取趋势仓库列表
3. 返回格式化的结果
```

## 会话录制 (Session Recording)

将浏览器会话自动录制为 WebM 视频文件：

```yaml
browser:
  record_sessions: true  # default: false
```

启用后，录制将在第一次 `browser_navigate` 时自动开始，并在会话关闭时保存到 `~/.hermes/browser_recordings/`。在本地和云（Browserbase）模式下均有效。超过 72 小时的录像将被自动清理。

## Stealth 功能 (Stealth Features)

Browserbase 提供自动的隐身功能：

| 功能 | 默认设置 | 说明 |
|---------|---------|-------|
| 基本隐身 (Basic Stealth) | 始终开启 | 随机指纹、视口随机化、CAPTCHA 求解 |
| 住宅代理 (Residential Proxies) | 开启 | 通过住宅 IP 路由，以获得更好的访问权限 |
| 高级隐身 (Advanced Stealth) | 关闭 | 定制 Chromium 构建，需要 Scale Plan |
| Keep Alive | 开启 | 网络故障后的会话重连 |

:::note
如果您的套餐中没有付费功能，Hermes 会自动回退 — 首先禁用 `keepAlive`，然后是代理 — 因此即使在免费套餐上浏览仍然有效。
:::

## 会话管理 (Session Management)

- 每个任务都通过 Browserbase 获得一个隔离的浏览器会话
- 会话会在不活动后自动清理（默认：2 分钟）
- 一个后台线程每 30 秒检查一次是否有陈旧的会话
- 在进程退出时进行紧急清理，以防止孤立会话
- 会话通过 Browserbase API (`REQUEST_RELEASE` 状态) 被释放

## 限制 (Limitations)

- **基于文本的交互** — 依赖于无障碍树，而不是像素坐标
- **快照大小** — 大型页面可能会被截断或在 8000 个字符处被 LLM 摘要
- **会话超时** — 云会话的过期时间取决于您的提供商套餐设置
- **成本** — 云会话会消耗提供商积分；当对话结束或不活动时，会话都会自动清理。使用 `/browser connect` 进行免费本地浏览。
- **不支持文件下载** — 无法从浏览器下载文件