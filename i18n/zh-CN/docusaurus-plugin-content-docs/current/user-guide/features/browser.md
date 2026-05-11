---
title: 浏览器自动化
description: 通过多种供应商控制浏览器，使用本地Chrome通过CDP连接，或使用云浏览器进行网页交互、填写表单、抓取数据等。
sidebar_label: 浏览器
sidebar_position: 5
---

# 浏览器自动化

Hermes智能体包含一套完整的浏览器自动化工具集，提供多种后端选项：

- **Browserbase云模式** — 通过 [Browserbase](https://browserbase.com) 提供托管云浏览器和反机器人工具
- **Browser Use云模式** — 通过 [Browser Use](https://browser-use.com) 作为替代的云浏览器供应商
- **Firecrawl云模式** — 通过 [Firecrawl](https://firecrawl.dev) 提供内置抓取功能的云浏览器
- **Camofox本地模式** — 通过 [Camofox](https://github.com/jo-inc/camofox-browser) 进行本地反检测浏览（基于Firefox的指纹伪装）
- **通过CDP连接本地Chrome** — 使用 `/browser connect` 命令将浏览器工具连接到您自己的Chrome实例
- **本地浏览器模式** — 通过 `agent-browser` CLI 和本地Chromium安装实现

在所有模式下，智能体都可以导航网站、与页面元素交互、填写表单并提取信息。

## 概述

页面以**可访问性树**（基于文本的快照）形式表示，非常适合大语言模型智能体使用。交互元素会获得引用ID（如 `@e1`, `@e2`），智能体使用这些ID进行点击和输入操作。

主要功能：

- **多供应商云执行** — Browserbase、Browser Use 或 Firecrawl — 无需本地浏览器
- **本地Chrome集成** — 通过CDP附加到您正在运行的Chrome，实现手动浏览
- **内置隐身功能** — 随机指纹、验证码解决、住宅代理（Browserbase）
- **会话隔离** — 每个任务都有其独立的浏览器会话
- **自动清理** — 不活跃的会话将在超时后关闭
- **视觉分析** — 截图 + AI分析，用于视觉理解

## 设置

:::tip Nous 订阅用户
若您拥有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，您可以通过 **[工具网关](tool-gateway.md)** 使用浏览器自动化功能，无需额外的 API 密钥。运行 `hermes model` 或 `hermes tools` 以启用该功能。
:::

### Browserbase 云端模式

要使用 Browserbase 托管的云端浏览器，请添加：

```bash
# 添加至 ~/.hermes/.env
BROWSERBASE_API_KEY=***
BROWSERBASE_PROJECT_ID=your-project-id-here
```

在 [browserbase.com](https://browserbase.com) 获取您的凭证。

### Browser Use 云端模式

要使用 Browser Use 作为您的云端浏览器提供商，请添加：

```bash
# 添加至 ~/.hermes/.env
BROWSER_USE_API_KEY=***
```

在 [browser-use.com](https://browser-use.com) 获取您的 API 密钥。Browser Use 通过其 REST API 提供云端浏览器。如果同时设置了 Browserbase 和 Browser Use 的凭证，Browserbase 将具有优先权。

### Firecrawl 云端模式

要使用 Firecrawl 作为您的云端浏览器提供商，请添加：

```bash
# 添加至 ~/.hermes/.env
FIRECRAWL_API_KEY=fc-***
```

在 [firecrawl.dev](https://firecrawl.dev) 获取您的 API 密钥。然后选择 Firecrawl 作为您的浏览器提供商：

```bash
hermes setup tools
# → 浏览器自动化 → Firecrawl
```

可选设置：

```bash
# 自托管 Firecrawl 实例 (默认: https://api.firecrawl.dev)
FIRECRAWL_API_URL=http://localhost:3002

# 会话 TTL（秒）(默认: 300)
FIRECRAWL_BROWSER_TTL=600
```

### 混合路由：云端用于公网 URL，本地用于局域网/localhost

当配置了云端提供商时，Hermes 会为解析到私有/回环/局域网地址的 URL（`localhost`、`127.0.0.1`、`192.168.x.x`、`10.x.x.x`、`172.16-31.x.x`、`*.local`、`*.lan`、`*.internal`、IPv6 回环地址 `::1`、链路本地地址 `169.254.x.x`）自动启动一个 **本地 Chromium 边车**。在同一对话中，公网 URL 将继续使用云端提供商。

这解决了常见的“我正在本地开发但使用 Browserbase”工作流 — 智能体可以截取您在 `http://localhost:3000` 的仪表盘截图，**同时**抓取 `https://github.com`，而您无需切换提供商或禁用 SSRF 保护。云端提供商永远看不到私有 URL。

此功能**默认开启**。要禁用它（所有 URL 都将发往已配置的云端提供商，与之前一样）：

```yaml
# ~/.hermes/config.yaml
browser:
  cloud_provider: browserbase
  auto_local_for_private_urls: false
```

禁用自动路由后，私有 URL 会被拒绝并返回错误 `"Blocked: URL targets a private or internal address"`，除非您同时设置 `browser.allow_private_urls: true`（这会允许云端提供商尝试访问它们 — 通常不会成功，因为 Browserbase 等无法访问您的局域网）。

要求：本地边车使用的命令行工具与纯本地模式相同，即 `agent-browser` CLI，因此您需要安装它（`hermes setup tools → 浏览器自动化` 会自动安装）。导航后从公网 URL 重定向到私有地址的操作仍然会被阻止（您不能利用重定向至内部的技巧通过公网路径访问您的局域网）。

### Camofox 本地模式

[Camofox](https://github.com/jo-inc/camofox-browser) 是一个自托管的 Node.js 服务器，它封装了 Camoufox（一个带有 C++ 指纹欺骗功能的 Firefox 分支）。它提供了无云依赖的本地反检测浏览功能。

```bash
# 首先克隆 Camofox 浏览器服务器
git clone https://github.com/jo-inc/camofox-browser
cd camofox-browser

# 使用 Docker 和默认容器设置进行构建并启动
# (自动检测架构：M1/M2 上为 aarch64，Intel 上为 x86_64)
make up

# 停止并移除默认容器
make down

# 强制进行干净重建（例如，升级 VERSION/RELEASE 之后）
make reset

# 仅下载二进制文件而不构建
make fetch

# 显式覆盖架构或版本
make up ARCH=x86_64
make up VERSION=135.0.1 RELEASE=beta.24
```

`make up` 会立即启动默认容器。如果您需要自定义运行时设置，例如更大的 Node 堆、VNC 或持久化配置文件目录，请先构建镜像，然后自行运行：

```bash
# 构建镜像而不启动默认容器
make build

# 启用持久化、VNC 实时视图和更大的 Node 堆
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

启用 VNC 后，浏览器将在有头模式下运行，您可以在浏览器中通过 `http://localhost:6080` (noVNC) 实时观看。您也可以使用原生 VNC 客户端连接到 `localhost:5901`。

如果您之前运行过 `make up`，请在启动自定义容器之前停止并移除该默认容器：

```bash
make down
# 然后运行上面的自定义 docker run 命令
```

然后在 `~/.hermes/.env` 中设置：

```bash
CAMOFOX_URL=http://localhost:9377
```

或者通过 `hermes tools` → 浏览器自动化 → Camofox 进行配置。

当设置了 `CAMOFOX_URL` 时，所有浏览器工具将自动通过 Camofox 路由，而不是使用 Browserbase 或 agent-browser。

#### 持久化浏览器会话

默认情况下，每个 Camofox 会话都会获得一个随机身份 — cookies 和登录状态不会在智能体重启后保留。要启用持久化浏览器会话，请将以下内容添加到 `~/.hermes/config.yaml`：

```yaml
browser:
  camofox:
    managed_persistence: true
```

然后完全重启 Hermes 以使新配置生效。

:::warning 嵌套路径很重要
Hermes 读取的是 `browser.camofox.managed_persistence`，**而不是**顶层的 `managed_persistence`。一个常见的错误是写成：

```yaml
# ❌ 错误 — Hermes 会忽略此项
managed_persistence: true
```

如果该标志放置在了错误的路径，Hermes 会静默回退到一个随机的临时 `userId`，您的登录状态将在每次会话时丢失。
:::

##### Hermes 执行的操作
- 向 Camofox 发送一个确定性的、基于配置文件作用域的 `userId`，以便服务器可以在会话间复用同一个 Firefox 配置文件。
- 跳过清理时服务端的上下文销毁，从而在智能体任务之间保留 cookies 和登录状态。
- 将 `userId` 的作用域限定在活动的 Hermes 配置文件，因此不同的 Hermes 配置文件会获得不同的浏览器配置文件（配置文件隔离）。

##### Hermes 不执行的操作
- 它不会强制在 Camofox 服务器上启用持久化。Hermes 仅发送一个稳定的 `userId`；服务器必须通过将该 `userId` 映射到一个持久化的 Firefox 配置文件目录来遵守它。
- 如果您的 Camofox 服务器构建将每个请求都视为临时性的（例如，总是调用 `browser.newContext()` 而不加载存储的配置文件），Hermes 无法使这些会话持久化。请确保您运行的是实现了基于 userId 的配置文件持久化的 Camofox 构建版本。

##### 验证是否生效

1.  启动 Hermes 和您的 Camofox 服务器。
2.  在浏览器任务中打开 Google（或任何需要登录的网站）并手动登录。
3.  正常结束该浏览器任务。
4.  启动一个新的浏览器任务。
5.  再次打开同一个网站 — 您应该仍然处于登录状态。

如果第 5 步使您登出，说明 Camofox 服务器没有遵守稳定的 `userId`。请仔细检查您的配置路径，确认在编辑 `config.yaml` 后完全重启了 Hermes，并验证您的 Camofox 服务器版本支持基于用户 ID 的持久化配置文件。

##### 状态存储位置

Hermes 从基于配置文件作用域的目录 `~/.hermes/browser_auth/camofox/`（或对于非默认配置文件，`$HERMES_HOME` 下的等效目录）派生出稳定的 `userId`。实际的浏览器配置文件数据存储在 Camofox 服务器端，由该 `userId` 作为键标识。要完全重置一个持久化配置文件，请在 Camofox 服务器上清除它，并移除对应的 Hermes 配置文件的状态目录。

#### VNC 实时视图

当 Camofox 在有头模式（带有可见的浏览器窗口）下运行时，它会在其健康检查响应中暴露一个 VNC 端口。Hermes 会自动发现此信息并将 VNC URL 包含在导航响应中，这样智能体就可以分享一个链接供您实时观看浏览器。

### 通过 CDP 连接本地 Chrome（`/browser connect`）

您可以不使用云端提供商，而是通过 Chrome DevTools Protocol (CDP) 将 Hermes 浏览器工具附加到您自己运行的 Chrome 实例上。当您希望实时查看智能体的操作、与需要您自己 cookies/会话的页面交互，或希望避免云端浏览器费用时，这非常有用。

:::note
`/browser connect` 是一个 **交互式 CLI 斜杠命令** — 它不会由网关调度。如果您尝试在 WebUI、Telegram、Discord 或其他网关聊天中运行它，该消息将作为纯文本发送给智能体，命令不会执行。请从终端启动 Hermes（`hermes` 或 `hermes chat`）并在那里执行 `/browser connect`。
:::

在 CLI 中，使用：

```
/browser connect              # 连接到 ws://localhost:9222 的 Chrome
/browser connect ws://host:port  # 连接到特定的 CDP 端点
/browser status               # 检查当前连接状态
/browser disconnect           # 断开连接并返回到云端/本地模式
```

如果 Chrome 尚未启用远程调试运行，Hermes 将尝试使用 `--remote-debugging-port=9222` 自动启动它。

:::tip
要手动启动启用了 CDP 的 Chrome，请使用一个专用的 `user-data-dir`，这样即使您的普通配置文件已经运行了 Chrome，调试端口也能实际启动：

```bash
# Linux
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=$HOME/.hermes/chrome-debug \
  --no-first-run \
  --no-default-browser-check &

# macOS
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.hermes/chrome-debug" \
  --no-first-run \
  --no-default-browser-check &
```

然后启动 Hermes CLI 并运行 `/browser connect`。

**为什么要用 `--user-data-dir`？** 不使用它的话，在普通的 Chrome 实例已经运行的情况下启动 Chrome 通常会在现有进程上打开一个新窗口 — 而那个现有进程不是以 `--remote-debugging-port` 启动的，所以 9222 端口永远不会打开。专用的 user-data-dir 会强制启动一个全新的 Chrome 进程，调试端口会在该进程中实际监听。`--no-first-run --no-default-browser-check` 会跳过新配置文件的首次启动向导。
:::

当通过 CDP 连接时，所有浏览器工具（`browser_navigate`、`browser_click` 等）将在您活跃的 Chrome 实例上操作，而不是启动云端会话。

### WSL2 + Windows Chrome：推荐使用 MCP 而非 `/browser connect`

如果 Hermes 运行在 WSL2 内部，但您想要控制的 Chrome 窗口运行在 Windows 主机上，`/browser connect` 通常不是最佳选择。

原因：

- `/browser connect` 要求 Hermes 本身能够访问到一个可用的 CDP 端点
- 现代 Chrome 实时调试会话通常暴露的是一个仅限主机本地的端点，这与经典的 `9222` 端口不同，无法直接从 WSL 访问
- 即使 Windows Chrome 是可调试的，最简洁的集成方式通常是让一个 Windows 侧的浏览器 MCP 服务器附加到 Chrome，然后让 Hermes 与该 MCP 服务器通信

对于这种设置，推荐通过 Hermes MCP 支持使用 `chrome-devtools-mcp`。

有关实际设置，请参阅 MCP 指南：

- [在 Hermes 中使用 MCP](../../guides/use-mcp-with-hermes.md#wsl2-bridge-hermes-in-wsl-to-windows-chrome)

### 本地浏览器模式

如果您**没有**设置任何云端凭证，也没有使用 `/browser connect`，Hermes 仍然可以通过由 `agent-browser` 驱动的本地 Chromium 安装来使用浏览器工具。

### 可选环境变量

```bash
# 用于更好地解决验证码的住宅代理 (默认: "true")
BROWSERBASE_PROXIES=true

# 使用自定义 Chromium 的高级隐身 - 需要 Scale 计划 (默认: "false")
BROWSERBASE_ADVANCED_STEALTH=false

# 断开连接后重新连接会话 - 需要付费计划 (默认: "true")
BROWSERBASE_KEEP_ALIVE=true

# 自定义会话超时时间（毫秒）(默认: 项目默认值)
# 示例: 600000 (10分钟), 1800000 (30分钟)
BROWSERBASE_SESSION_TIMEOUT=600000

# 自动清理前的不活动超时时间（秒）(默认: 120)
BROWSER_INACTIVITY_TIMEOUT=120
```

### 安装 agent-browser CLI

```bash
npm install -g agent-browser
# 或在仓库中本地安装：
npm install
```

:::info
`browser` 工具集必须包含在您配置的 `toolsets` 列表中，或者通过 `hermes config set toolsets '["hermes-cli", "browser"]'` 启用。
:::

## 可用工具

### `browser_navigate`

导航至指定网址。必须在调用任何其他浏览器工具之前调用，用于初始化 Browserbase 会话。

```
导航到 https://github.com/NousResearch
```

:::tip
对于简单的信息检索，建议优先使用 `web_search` 或 `web_extract` —— 它们更快且成本更低。仅当您需要**与页面交互**（点击按钮、填写表单、处理动态内容）时才使用浏览器工具。
:::

### `browser_snapshot`

获取当前页面可访问性树的文本快照。返回带有引用 ID（如 `@e1`、`@e2`）的交互式元素，供 `browser_click` 和 `browser_type` 使用。

- **`full=false`**（默认）：紧凑视图，仅显示交互式元素
- **`full=true`**：完整的页面内容

超过 8000 字符的快照将由 LLM 自动摘要处理。

### `browser_click`

点击快照中通过其引用 ID 标识的元素。

```
点击 @e5 以按下"登录"按钮
```

### `browser_type`

在输入字段中键入文本。首先清空字段，然后键入新文本。

```
在搜索字段 @e3 中输入 "hermes agent"
```

### `browser_scroll`

向上或向下滚动页面以显示更多内容。

```
向下滚动查看更多结果
```

### `browser_press`

按下键盘按键。用于提交表单或导航。

```
按 Enter 提交表单
```

支持的按键：`Enter`、`Tab`、`Escape`、`ArrowDown`、`ArrowUp` 等。

### `browser_back`

导航回浏览器历史记录中的上一页。

### `browser_get_images`

列出当前页面上所有图片的 URL 和替代文本。用于查找需要分析的图片。

### `browser_vision`

截取屏幕截图并使用视觉 AI 进行分析。当文本快照无法捕获重要视觉信息时使用此工具——对于验证码、复杂布局或视觉验证挑战特别有用。

截图将被持久保存，并且文件路径将与 AI 分析结果一起返回。在消息平台（Telegram、Discord、Slack、WhatsApp）上，您可以要求智能体分享截图——它将通过 `MEDIA:` 机制作为原生照片附件发送。

```
这个页面上的图表显示了什么？
```

截图存储在 `~/.hermes/cache/screenshots/` 中，并在 24 小时后自动清理。

### `browser_console`

获取浏览器控制台输出（日志/警告/错误消息）和当前页面中未捕获的 JavaScript 异常。对于检测在可访问性树中不显示的隐式 JS 错误至关重要。

```
检查浏览器控制台是否有任何 JavaScript 错误
```

使用 `clear=True` 可在读取后清除控制台，以便后续调用仅显示新消息。

`browser_console` 在使用 `expression` 参数调用时也会评估 JavaScript —— 形式与 DevTools 控制台相同，结果经过解析返回（JSON 序列化对象变为字典；原始值保持原始）。

```
browser_console(expression="document.querySelector('h1').textContent")
browser_console(expression="JSON.stringify(performance.timing)")
```

当当前会话有 CDP 管理器活动时（通常适用于任何已对支持 CDP 的后端执行过 `browser_navigate` 的会话），评估通过管理器的持久 WebSocket 运行——没有子进程启动成本。否则，将回退到标准智能体-浏览器 CLI 路径。无论哪种方式行为相同；只有延迟会发生变化。

### `browser_cdp`

原始 Chrome DevTools Protocol 直通——用于处理其他工具未涵盖的浏览器操作的应急手段。用于原生对话框处理、iframe 作用域评估、cookie/网络控制，或智能体需要的任何 CDP 动词。

**仅当会话启动时可达 CDP 端点时可用** —— 意味着 `/browser connect` 已连接到正在运行的 Chrome，或在 `config.yaml` 中设置了 `browser.cdp_url`。默认的本地智能体浏览器模式、Camofox 和云提供商（Browserbase、Browser Use、Firecrawl）目前不向此工具公开 CDP——云提供商有每会话 CDP URL，但实时会话路由是后续工作。

**CDP 方法参考：** https://chromedevtools.github.io/devtools-protocol/ —— 智能体可以 `web_extract` 特定方法的页面以查找参数和返回结构。

常见模式：

```
# 列出标签页（浏览器级别，无 target_id）
browser_cdp(method="Target.getTargets")

# 处理标签页上的原生 JS 对话框
browser_cdp(method="Page.handleJavaScriptDialog",
            params={"accept": true, "promptText": ""},
            target_id="<tabId>")

# 在特定标签页中评估 JS
browser_cdp(method="Runtime.evaluate",
            params={"expression": "document.title", "returnByValue": true},
            target_id="<tabId>")

# 获取所有 cookies
browser_cdp(method="Network.getAllCookies")
```

浏览器级方法（`Target.*`、`Browser.*`、`Storage.*`）省略 `target_id`。页面级方法（`Page.*`、`Runtime.*`、`DOM.*`、`Emulation.*`）需要来自 `Target.getTargets` 的 `target_id`。每个无状态调用都是独立的——会话在调用之间不持久化。

**跨域 iframe：** 传递 `frame_id`（来自 `browser_snapshot.frame_tree.children[]`，其中 `is_oopif=true`）以将 CDP 调用路由到管理器针对该 iframe 的实时会话。这是在 Browserbase 上跨域 iframe 内部运行 `Runtime.evaluate` 的方式，因为无状态 CDP 连接会遇到签名 URL 过期问题。示例：

```
browser_cdp(
  method="Runtime.evaluate",
  params={"expression": "document.title", "returnByValue": True},
  frame_id="<frame_id from browser_snapshot>",
)
```

同源 iframe 不需要 `frame_id` —— 改为从顶层 `Runtime.evaluate` 使用 `document.querySelector('iframe').contentDocument`。

### `browser_dialog`

响应原生 JS 对话框（`alert` / `confirm` / `prompt` / `beforeunload`）。在此工具存在之前，对话框会静默阻塞页面的 JavaScript 线程，后续的 `browser_*` 调用会挂起或抛出异常；现在智能体在 `browser_snapshot` 输出中看到挂起的对话框并进行显式响应。

**工作流程：**
1.  调用 `browser_snapshot`。如果有对话框阻塞页面，它会显示为 `pending_dialogs: [{"id": "d-1", "type": "alert", "message": "..."}]`。
2.  调用 `browser_dialog(action="accept")` 或 `browser_dialog(action="dismiss")`。对于 `prompt()` 对话框，传递 `prompt_text="..."` 以提供响应。
3.  重新快照——`pending_dialogs` 为空；页面的 JS 线程已恢复。

**检测通过持久 CDP 管理器自动发生** —— 每个任务一个 WebSocket，订阅 Page/Runtime/Target 事件。管理器还会在快照中填充 `frame_tree` 字段，以便智能体可以看到当前页面的 iframe 结构，包括跨域（OOPIF）iframe。

**可用性矩阵：**

| 后端 | 通过 `pending_dialogs` 检测 | 响应（`browser_dialog` 工具） |
|---|---|---|
| 本地 Chrome（通过 `/browser connect` 或 `browser.cdp_url`） | ✓ | ✓ 完整工作流程 |
| Browserbase | ✓ | ✓ 完整工作流程（通过注入的 XHR 桥接） |
| Camofox / 默认本地智能体浏览器 | ✗ | ✗（无 CDP 端点） |

**在 Browserbase 上的工作原理。** Browserbase 的 CDP 代理在服务器端约 10ms 内自动关闭真正的原生对话框，因此我们无法使用 `Page.handleJavaScriptDialog`。管理器通过 `Page.addScriptToEvaluateOnNewDocument` 注入一个小脚本，用同步 XHR 覆盖 `window.alert`/`confirm`/`prompt`。我们通过 `Fetch.enable` 拦截这些 XHR——页面的 JS 线程在 XHR 上保持阻塞，直到我们调用 `Fetch.fulfillRequest` 并传递智能体的响应。`prompt()` 返回值原样传回页面 JS。

**对话框策略** 在 `config.yaml` 的 `browser.dialog_policy` 下配置：

| 策略 | 行为 |
|--------|----------|
| `must_respond`（默认） | 捕获，在快照中显示，等待显式 `browser_dialog()` 调用。安全自动关闭在 `browser.dialog_timeout_s`（默认 300 秒）后，因此有缺陷的智能体不会永远停滞。 |
| `auto_dismiss` | 捕获，立即关闭。智能体仍然会在 `browser_state` 历史记录中看到对话框，但无需采取行动。 |
| `auto_accept` | 捕获，立即接受。对于导航具有激进 `beforeunload` 提示的页面很有用。 |

`browser_snapshot.frame_tree` 内部的**帧树**上限为 30 帧，OOPIF 深度为 2，以在广告繁多的页面上保持负载有界。当达到限制时，会出现 `truncated: true` 标志；需要完整树的智能体可以使用 `browser_cdp` 并调用 `Page.getFrameTree`。

## 实践示例

### 填写网页表单

```
用户：在 example.com 上用我的邮箱 john@example.com 注册一个账户

智能体工作流程：
1. browser_navigate("https://example.com/signup")
2. browser_snapshot()  → 看到带引用标签的表单字段
3. browser_type(ref="@e3", text="john@example.com")
4. browser_type(ref="@e5", text="SecurePass123")
5. browser_click(ref="@e8")  → 点击“创建账户”
6. browser_snapshot()  → 确认成功
```

### 研究动态内容

```
用户：目前 GitHub 上最热门的趋势仓库是什么？

智能体工作流程：
1. browser_navigate("https://github.com/trending")
2. browser_snapshot(full=true)  → 读取趋势仓库列表
3. 返回格式化的结果
```

## 会话录制

自动将浏览器会话录制为 WebM 视频文件：

```yaml
browser:
  record_sessions: true  # 默认: false
```

启用后，录制会在首次 `browser_navigate` 调用时自动开始，并在会话关闭时保存到 `~/.hermes/browser_recordings/` 目录。在本地和云端（Browserbase）模式下均可工作。超过 72 小时的录制文件会自动清理。

## 隐身功能

Browserbase 提供自动隐身能力：

| 功能         | 默认值 | 说明                                           |
|--------------|--------|------------------------------------------------|
| 基础隐身     | 始终开启 | 随机指纹、视口随机化、验证码解决               |
| 住宅代理     | 开启   | 通过住宅 IP 路由以获得更好的访问权限           |
| 高级隐身     | 关闭   | 自定义 Chromium 构建，需要 Scale 套餐          |
| 保活         | 开启   | 网络中断后会话重新连接                         |

:::note
如果您当前的套餐不支持付费功能，Hermes 会自动降级 — 首先禁用 `keepAlive`，然后禁用代理 — 因此即使使用免费套餐，浏览功能仍然可用。
:::
## 会话管理

- 每个任务通过 Browserbase 获取一个隔离的浏览器会话
- 会话在闲置后会自动清理（默认：2 分钟）
- 一个后台线程每 30 秒检查一次过期会话
- 进程退出时运行紧急清理，以防止孤立会话
- 会话通过 Browserbase API 释放（设置为 `REQUEST_RELEASE` 状态）

## 限制

- **基于文本的交互** — 依赖于无障碍树，而非像素坐标
- **快照大小** — 大型页面可能会在 8000 字符处被截断或由 LLM 进行摘要
- **会话超时** — 云端会话根据您的提供商套餐设置到期
- **成本** — 云端会话消耗提供商积分；当对话结束或闲置后，会话会自动清理。使用 `/browser connect` 进行免费的本地浏览。
- **不支持文件下载** — 无法从浏览器下载文件