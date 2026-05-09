---
title: 浏览器自动化
description: 通过多个提供商、本地 Chrome（通过 CDP）或云浏览器控制浏览器，实现网页交互、表单填写、数据抓取等功能。
sidebar_label: 浏览器
sidebar_position: 5
---

# 浏览器自动化

Hermes 智能体包含一套完整的浏览器自动化工具集，支持多种后端选项：

- **Browserbase 云模式**：通过 [Browserbase](https://browserbase.com) 使用托管云浏览器和反机器人检测工具
- **Browser Use 云模式**：通过 [Browser Use](https://browser-use.com) 作为替代的云浏览器提供商
- **Firecrawl 云模式**：通过 [Firecrawl](https://firecrawl.dev) 使用内置抓取功能的云浏览器
- **Camofox 本地模式**：通过 [Camofox](https://github.com/jo-inc/camofox-browser) 实现本地反检测浏览（基于 Firefox 的指纹伪装）
- **本地 Chrome（通过 CDP）**：使用 `/browser connect` 将浏览器工具连接到您自己的 Chrome 实例
- **本地浏览器模式**：通过 `agent-browser` 命令行工具和本地 Chromium 安装

在所有模式下，智能体都可以导航网站、与页面元素交互、填写表单并提取信息。

## 概述

页面以**无障碍树**（基于文本的快照）的形式表示，非常适合 LLM 智能体使用。交互元素会获得引用 ID（如 `@e1`、`@e2`），智能体使用这些 ID 进行点击和输入操作。

核心功能：

- **多提供商云执行** — Browserbase、Browser Use 或 Firecrawl — 无需本地浏览器
- **本地 Chrome 集成** — 通过 CDP 连接到您正在运行的 Chrome，实现手动浏览
- **内置隐身功能** — 随机指纹、验证码解决、住宅代理（Browserbase）
- **会话隔离** — 每个任务都有独立的浏览器会话
- **自动清理** — 超时后自动关闭非活动会话
- **视觉分析** — 截图 + AI 分析，实现视觉理解

## 设置

:::tip Nous 订阅用户
如果您拥有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，则可以通过 **[工具网关](tool-gateway.md)** 使用浏览器自动化功能，无需单独提供 API 密钥。运行 `hermes model` 或 `hermes tools` 即可启用该功能。
:::

### Browserbase 云模式

要使用 Browserbase 托管的云浏览器，请添加：

```bash
# 添加到 ~/.hermes/.env
BROWSERBASE_API_KEY=***
BROWSERBASE_PROJECT_ID=your-project-id-here
```

在 [browserbase.com](https://browserbase.com) 获取您的凭据。

### Browser Use 云模式

要使用 Browser Use 作为您的云浏览器提供商，请添加：

```bash
# 添加到 ~/.hermes/.env
BROWSER_USE_API_KEY=***
```

在 [browser-use.com](https://browser-use.com) 获取您的 API 密钥。Browser Use 通过其 REST API 提供云浏览器。如果同时设置了 Browserbase 和 Browser Use 的凭据，则优先使用 Browserbase。

### Firecrawl 云模式

要使用 Firecrawl 作为您的云浏览器提供商，请添加：

```bash
# 添加到 ~/.hermes/.env
FIRECRAWL_API_KEY=fc-***
```

在 [firecrawl.dev](https://firecrawl.dev) 获取您的 API 密钥。然后选择 Firecrawl 作为您的浏览器提供商：

```bash
hermes setup tools
# → 浏览器自动化 → Firecrawl
```

可选设置：

```bash
# 自托管 Firecrawl 实例（默认值：https://api.firecrawl.dev）
FIRECRAWL_API_URL=http://localhost:3002

# 会话 TTL（生存时间），单位为秒（默认值：300）
FIRECRAWL_BROWSER_TTL=600
```

### 混合路由：公共 URL 使用云模式，局域网/本地主机使用本地模式

当配置了云提供商时，Hermes 会自动启动一个**本地 Chromium 辅助进程**，用于解析到私有/环回/局域网地址的 URL（`localhost`、`127.0.0.1`、`192.168.x.x`、`10.x.x.x`、`172.16-31.x.x`、`*.local`、`*.lan`、`*.internal`、IPv6 环回地址 `::1`、链路本地地址 `169.254.x.x`）。公共 URL 仍会在同一对话中使用云提供商。

这解决了常见的“我正在本地开发但使用 Browserbase”的工作流程——智能体可以截取您在 `http://localhost:3000` 上的仪表板屏幕截图，并抓取 `https://github.com`，而无需您切换提供商或禁用 SSRF 防护。云提供商永远不会看到私有 URL。

该功能**默认开启**。要禁用它（所有 URL 都转到配置的云提供商，如之前一样）：

```yaml
# ~/.hermes/config.yaml
browser:
  cloud_provider: browserbase
  auto_local_for_private_urls: false
```

禁用自动路由后，私有 URL 将被拒绝，并返回 `"Blocked: URL targets a private or internal address"`，除非您同时设置 `browser.allow_private_urls: true`（这会让云提供商尝试访问这些 URL——通常不起作用，因为 Browserbase 等无法访问您的局域网）。

要求：本地辅助进程使用与纯本地模式相同的 `agent-browser` CLI，因此您需要安装它（`hermes setup tools → 浏览器自动化` 会自动安装）。从公共 URL 导航后重定向到私有地址的情况仍会被阻止（您无法使用重定向到内部的技巧通过公共路径访问您的局域网）。

### Camofox 本地模式

[Camofox](https://github.com/jo-inc/camofox-browser) 是一个自托管的 Node.js 服务器，封装了 Camoufox（一个带有 C++ 指纹伪装的 Firefox 分支）。它提供本地反检测浏览功能，无需依赖云服务。

```bash
# 首先克隆 Camofox 浏览器服务器
git clone https://github.com/jo-inc/camofox-browser
cd camofox-browser

# 使用默认容器设置通过 Docker 构建并启动
# （自动检测架构：M1/M2 上为 aarch64，Intel 上为 x86_64）
make up

# 停止并移除默认容器
make down

# 强制重新构建（例如，升级 VERSION/RELEASE 后）
make reset

# 仅下载二进制文件，不构建
make fetch

# 显式覆盖架构或版本
make up ARCH=x86_64
make up VERSION=135.0.1 RELEASE=beta.24
```

`make up` 会立即启动默认容器。如果您需要自定义运行时设置，例如更大的 Node 堆、VNC 或持久化配置文件目录，请先构建镜像，然后自行运行：

```bash
# 构建镜像，但不启动默认容器
make build

# 启动时启用持久化、VNC 实时视图和更大的 Node 堆
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

启用 VNC 后，浏览器将以有头模式运行，您可以在浏览器中通过 `http://localhost:6080`（noVNC）实时观看。您也可以将原生 VNC 客户端连接到 `localhost:5901`。

如果您已经运行了 `make up`，请在启动自定义容器之前停止并移除该默认容器：

```bash
make down
# 然后运行上面的自定义 docker run 命令
```

然后在 `~/.hermes/.env` 中设置：

```bash
CAMOFOX_URL=http://localhost:9377
```

或通过 `hermes tools` → 浏览器自动化 → Camofox 进行配置。

当设置了 `CAMOFOX_URL` 时，所有浏览器工具都会自动通过 Camofox 路由，而不是通过 Browserbase 或 agent-browser。

#### 持久化浏览器会话

默认情况下，每个 Camofox 会话都会获得一个随机身份——Cookie 和登录状态不会在智能体重启后保留。要启用持久化浏览器会话，请将以下内容添加到 `~/.hermes/config.yaml`：

```yaml
browser:
  camofox:
    managed_persistence: true
```

然后完全重启 Hermes 以加载新配置。

:::warning 嵌套路径很重要
Hermes 读取的是 `browser.camofox.managed_persistence`，**而不是**顶层的 `managed_persistence`。一个常见错误是写成：

```yaml
# ❌ 错误 — Hermes 会忽略此设置
managed_persistence: true
```

如果该标志放置在错误的路径下，Hermes 会静默回退到随机的临时 `userId`，您的登录状态将在每次会话中丢失。
:::

##### Hermes 会做什么
- 向 Camofox 发送一个确定性的、基于配置文件的 `userId`，以便服务器可以在多个会话中重用相同的 Firefox 配置文件。
- 在清理时跳过服务器端上下文销毁，以便 Cookie 和登录状态在智能体任务之间保留。
- 将 `userId` 限定为当前活跃的 Hermes 配置文件，因此不同的 Hermes 配置文件会获得不同的浏览器配置文件（配置文件隔离）。

##### Hermes 不会做什么
- 它不会强制 Camofox 服务器启用持久化。Hermes 仅发送一个稳定的 `userId`；服务器必须通过将该 `userId` 映射到持久的 Firefox 配置文件目录来遵守它。
- 如果您的 Camofox 服务器构建将每个请求都视为临时的（例如，总是调用 `browser.newContext()` 而不加载存储的配置文件），则 Hermes 无法使这些会话持久化。请确保您运行的是实现了基于 userId 的配置文件持久化的 Camofox 构建版本。

##### 验证是否生效

1. 启动 Hermes 和您的 Camofox 服务器。
2. 在浏览器任务中打开 Google（或任何需要登录的网站）并手动登录。
3. 正常结束浏览器任务。
4. 启动一个新的浏览器任务。
5. 再次打开同一网站——您应该仍然处于登录状态。

如果第 5 步导致您被登出，则说明 Camofox 服务器没有遵守稳定的 `userId`。请仔细检查您的配置路径，确认您在编辑 `config.yaml` 后已完全重启 Hermes，并验证您的 Camofox 服务器版本是否支持按用户持久化配置文件。

##### 状态存储位置

Hermes 从基于配置文件的目录 `~/.hermes/browser_auth/camofox/`（或非默认配置文件下的 `$HERMES_HOME` 对应目录）派生出稳定的 `userId`。实际的浏览器配置文件数据由 Camofox 服务器端存储，并以该 `userId` 为键。要完全重置持久化配置文件，请在 Camofox 服务器上清除它，并删除相应的 Hermes 配置文件状态目录。

#### VNC 实时视图

当 Camofox 在有头模式下运行（带有可见的浏览器窗口）时，它会在其健康检查响应中暴露一个 VNC 端口。Hermes 会自动发现此端口，并在导航响应中包含 VNC URL，以便智能体可以分享一个链接供您实时观看浏览器。

### 通过 CDP 连接本地 Chrome（`/browser connect`）

除了使用云提供商外，您还可以通过 Chrome DevTools 协议（CDP）将 Hermes 浏览器工具附加到您自己运行的 Chrome 实例上。当您希望实时查看智能体的操作、与需要您自己的 Cookie/会话的页面交互，或避免云浏览器成本时，这非常有用。

:::note
`/browser connect` 是一个**交互式 CLI 斜杠命令**——它不是由网关分发的。如果您尝试在 WebUI、Telegram、Discord 或其他网关聊天中运行它，消息将作为纯文本发送给智能体，且命令不会执行。请从终端启动 Hermes（`hermes` 或 `hermes chat`），然后在那里发出 `/browser connect` 命令。
:::

在 CLI 中使用：

```
/browser connect              # 连接到位于 ws://localhost:9222 的 Chrome
/browser connect ws://host:port  # 连接到特定的 CDP 端点
/browser status               # 检查当前连接状态
/browser disconnect            # 断开连接并返回到云/本地模式
```

如果 Chrome 尚未以远程调试模式运行，Hermes 将尝试使用 `--remote-debugging-port=9222` 自动启动它。

:::tip
要手动启动启用 CDP 的 Chrome，请使用专用的 user-data-dir，以便即使 Chrome 已使用您的常规配置文件运行，调试端口也能实际启动：

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

**为什么需要 `--user-data-dir`？** 如果没有它，在常规 Chrome 实例已运行时启动 Chrome 通常会打开现有进程的新窗口——而该现有进程并未以 `--remote-debugging-port` 启动，因此端口 9222 永远不会打开。专用的 user-data-dir 会强制启动一个新的 Chrome 进程，在该进程中调试端口实际监听。`--no-first-run --no-default-browser-check` 会跳过新配置文件的首屏向导。
:::

通过 CDP 连接后，所有浏览器工具（`browser_navigate`、`browser_click` 等）都会在您实时的 Chrome 实例上操作，而不是启动云会话。

### WSL2 + Windows Chrome：优先使用 MCP 而非 `/browser connect`

如果 Hermes 运行在 WSL2 内部，但您要控制的 Chrome 窗口运行在 Windows 主机上，那么 `/browser connect` 通常不是最佳路径。

原因如下：

- `/browser connect` 期望 Hermes 自身能够访问可用的 CDP 端点
- 现代 Chrome 实时调试会话通常暴露一个主机本地端点，该端点无法像经典的 `9222` 端口那样直接从 WSL 访问
- 即使 Windows Chrome 可调试，最干净的集成方式通常也是让 Windows 端的浏览器 MCP 服务器连接到 Chrome，并让 Hermes 与该 MCP 服务器通信

对于这种设置，请优先通过 Hermes 的 MCP 支持使用 `chrome-devtools-mcp`。

请参阅 MCP 指南以了解实际设置方法：

- [在 Hermes 中使用 MCP](../../guides/use-mcp-with-hermes.md#wsl2-bridge-hermes-in-wsl-to-windows-chrome)

### 本地浏览器模式

如果您**没有**设置任何云凭据且未使用 `/browser connect`，Hermes 仍可通过 `agent-browser` 驱动的本地 Chromium 安装使用浏览器工具。

### 可选环境变量

```bash
# 使用住宅代理以获得更好的 CAPTCHA 解决能力（默认值："true"）
BROWSERBASE_PROXIES=true

# 使用自定义 Chromium 实现高级隐身 — 需要 Scale 计划（默认值："false"）
BROWSERBASE_ADVANCED_STEALTH=false

# 断开后重新连接会话 — 需要付费计划（默认值："true"）
BROWSERBASE_KEEP_ALIVE=true

# 自定义会话超时时间，单位为毫秒（默认值：项目默认值）
# 示例：600000（10 分钟），1800000（30 分钟）
BROWSERBASE_SESSION_TIMEOUT=600000

# 自动清理前的空闲超时时间，单位为秒（默认值：120）
BROWSER_INACTIVITY_TIMEOUT=120
```

### 安装 agent-browser CLI

```bash
npm install -g agent-browser
# 或在仓库中本地安装：
npm install
```

:::info
`browser` 工具集必须包含在您的配置中的 `toolsets` 列表中，或通过 `hermes config set toolsets '["hermes-cli", "browser"]'` 启用。
:::

## 可用工具

### `browser_navigate`

导航至指定 URL。必须在调用其他浏览器工具前执行。用于初始化 Browserbase 会话。

```
导航至 https://github.com/NousResearch
```

:::提示
如需简单获取信息，请优先使用 `web_search` 或 `web_extract` —— 它们速度更快且成本更低。当您需要**与页面交互**（点击按钮、填写表单、处理动态内容）时，才使用浏览器工具。
:::

### `browser_snapshot`

获取当前页面的文本化可访问性树快照。返回带有 ref ID（如 `@e1`、`@e2`）的交互元素，以便与 `browser_click` 和 `browser_type` 配合使用。

- **`full=false`**（默认）：仅显示交互元素的紧凑视图  
- **`full=true`**：显示完整页面内容

超过 8000 字符的快照将由 LLM 自动摘要。

### `browser_click`

点击快照中 ref ID 标识的元素。

```
点击 @e5 以按下“登录”按钮
```

### `browser_type`

在输入框中输入文本。首先清空字段，然后输入新文本。

```
在搜索框 @e3 中输入“hermes agent”
```

### `browser_scroll`

向上或向下滚动页面以显示更多内容。

```
向下滚动查看更多结果
```

### `browser_press`

按下键盘按键。适用于提交表单或导航。

```
按下 Enter 提交表单
```

支持的按键：`Enter`、`Tab`、`Escape`、`ArrowDown`、`ArrowUp` 等。

### `browser_back`

返回浏览器历史中的上一页。

### `browser_get_images`

列出当前页面所有图片及其 URL 和替代文本。适用于查找待分析的图片。

### `browser_vision`

截取屏幕截图并通过视觉 AI 分析。当文本快照无法捕获重要视觉信息时（尤其是验证码、复杂布局或视觉验证场景），此工具非常有用。

截图将持久保存，并随 AI 分析结果一起返回文件路径。在消息平台（Telegram、Discord、Slack、WhatsApp）上，可要求智能体共享截图 —— 截图将通过 `MEDIA:` 机制以原生图片附件形式发送。

```
此页面上的图表显示了什么？
```

截图存储在 `~/.hermes/cache/screenshots/` 中，并在 24 小时后自动清理。

### `browser_console`

获取浏览器控制台输出（日志/警告/错误消息）及当前页面未捕获的 JavaScript 异常。对于检测未出现在可访问性树中的静默 JS 错误至关重要。

```
检查浏览器控制台是否有任何 JavaScript 错误
```

使用 `clear=True` 可在读取后清除控制台，以便后续调用仅显示新消息。

### `browser_cdp`

原始 Chrome DevTools Protocol 透传 —— 用于其他工具未覆盖的浏览器操作的“逃生舱”。适用于原生对话框处理、iframe 范围求值、Cookie/网络控制，或智能体所需的任何 CDP 动词。

**仅在会话启动时可访问 CDP 端点时可用** —— 即 `/browser connect` 已连接到运行中的 Chrome，或已在 `config.yaml` 中设置 `browser.cdp_url`。默认本地智能体-浏览器模式 Camofox 及云服务提供商（Browserbase、Browser Use、Firecrawl）当前未向此工具暴露 CDP —— 云服务提供商虽有每会话 CDP URL，但实时会话路由为后续功能。

**CDP 方法参考：** https://chromedevtools.github.io/devtools-protocol/ —— 智能体可通过 `web_extract` 提取特定方法页面以查询参数和返回结构。

常见模式：

```
# 列出标签页（浏览器级，无 target_id）
browser_cdp(method="Target.getTargets")

# 处理标签页上的原生 JS 对话框
browser_cdp(method="Page.handleJavaScriptDialog",
            params={"accept": true, "promptText": ""},
            target_id="<tabId>")

# 在特定标签页中执行 JS
browser_cdp(method="Runtime.evaluate",
            params={"expression": "document.title", "returnByValue": true},
            target_id="<tabId>")

# 获取所有 Cookie
browser_cdp(method="Network.getAllCookies")
```

浏览器级方法（`Target.*`、`Browser.*`、`Storage.*`）省略 `target_id`。页面级方法（`Page.*`、`Runtime.*`、`DOM.*`、`Emulation.*`）需从 `Target.getTargets` 获取 `target_id`。每次无状态调用相互独立 —— 会话不会在调用间持续。

**跨域 iframe：** 传递 `frame_id`（来自 `browser_snapshot.frame_tree.children[]` 中 `is_oopif=true` 的项），以通过该 iframe 对应的管理器实时会话路由 CDP 调用。这正是 Browserbase 上跨域 iframe 内 `Runtime.evaluate` 的工作方式，若无此机制，无状态 CDP 连接将因签名 URL 过期而失败。示例：

```
browser_cdp(
  method="Runtime.evaluate",
  params={"expression": "document.title", "returnByValue": True},
  frame_id="<frame_id from browser_snapshot>",
)
```

同源 iframe 无需 `frame_id` —— 可在顶级 `Runtime.evaluate` 中使用 `document.querySelector('iframe').contentDocument` 替代。

### `browser_dialog`

响应原生 JS 对话框（`alert` / `confirm` / `prompt` / `beforeunload`）。在此工具出现前，对话框会静默阻塞页面 JavaScript 线程，导致后续 `browser_*` 调用挂起或抛出异常；现在智能体可在 `browser_snapshot` 输出中看到待处理对话框并显式响应。

**工作流程：**
1. 调用 `browser_snapshot`。若页面被对话框阻塞，将显示为 `pending_dialogs: [{"id": "d-1", "type": "alert", "message": "..."}]`。
2. 调用 `browser_dialog(action="accept")` 或 `browser_dialog(action="dismiss")`。对于 `prompt()` 对话框，传递 `prompt_text="..."` 以提供响应。
3. 重新获取快照 —— `pending_dialogs` 为空；页面 JS 线程已恢复。

**检测通过持久 CDP 管理器自动完成** —— 每个任务一个 WebSocket，订阅 Page/Runtime/Target 事件。管理器还会在快照中填充 `frame_tree` 字段，使智能体可查看当前页面的 iframe 结构（包括跨域 OOPIF iframe）。

**可用性矩阵：**

| 后端 | 通过 `pending_dialogs` 检测 | 响应（`browser_dialog` 工具） |
|---|---|---|
| 本地 Chrome（通过 `/browser connect` 或 `browser.cdp_url`） | ✓ | ✓ 完整流程 |
| Browserbase | ✓ | ✓ 完整流程（通过注入的 XHR 桥接） |
| Camofox / 默认本地智能体-浏览器 | ✗ | ✗（无 CDP 端点） |

**Browserbase 上的工作原理。** Browserbase 的 CDP 代理会在约 10ms 内于服务端自动关闭真实原生对话框，因此无法使用 `Page.handleJavaScriptDialog`。管理器通过 `Page.addScriptToEvaluateOnNewDocument` 注入一小段脚本，将 `window.alert`/`confirm`/`prompt` 重写为同步 XHR。我们通过 `Fetch.enable` 拦截这些 XHR —— 页面 JS 线程在 XHR 上保持阻塞，直到我们调用 `Fetch.fulfillRequest` 并传入智能体的响应。`prompt()` 返回值原样往返回页面 JS。

**对话框策略** 在 `config.yaml` 的 `browser.dialog_policy` 下配置：

| 策略 | 行为 |
|--------|----------|
| `must_respond`（默认） | 捕获、在快照中呈现、等待显式 `browser_dialog()` 调用。安全自动关闭（`browser.dialog_timeout_s`，默认 300 秒），防止 buggy 智能体无限期阻塞。 |
| `auto_dismiss` | 捕获、立即关闭。智能体仍可在 `browser_state` 历史中看到对话框，但无需操作。 |
| `auto_accept` | 捕获、立即接受。适用于导航含频繁 `beforeunload` 提示的页面。 |

`browser_snapshot.frame_tree` 内的 **Frame 树** 限制为最多 30 个 frame 且 OOPIF 深度为 2，以控制广告密集型页面的负载大小。当达到限制时，`truncated: true` 标志将显示；需要完整树结构的智能体可使用 `browser_cdp` 配合 `Page.getFrameTree`。

## 实用示例

### 填写网页表单

```
用户：使用我的邮箱 john@example.com 在 example.com 上注册一个账户

智能体工作流程：
1. browser_navigate("https://example.com/signup")
2. browser_snapshot()  → 查看带有引用的表单字段
3. browser_type(ref="@e3", text="john@example.com")
4. browser_type(ref="@e5", text="SecurePass123")
5. browser_click(ref="@e8")  → 点击“创建账户”
6. browser_snapshot()  → 确认成功
```

### 研究动态内容

```
用户：GitHub 上现在有哪些热门仓库？

智能体工作流程：
1. browser_navigate("https://github.com/trending")
2. browser_snapshot(full=true)  → 读取热门仓库列表
3. 返回格式化结果
```

## 会话录制

自动将会话录制为 WebM 视频文件：

```yaml
browser:
  record_sessions: true  # 默认值：false
```

启用后，录制会在第一次 `browser_navigate` 时自动开始，并在会话关闭时保存到 `~/.hermes/browser_recordings/`。本地和云端（Browserbase）模式均支持。超过 72 小时的录制文件会自动清理。

## 隐身功能

Browserbase 提供自动隐身功能：

| 功能 | 默认值 | 说明 |
|---------|---------|-------|
| 基础隐身 | 始终开启 | 随机指纹、视口随机化、验证码解决 |
| 住宅代理 | 开启 | 通过住宅 IP 路由以获得更好的访问 |
| 高级隐身 | 关闭 | 自定义 Chromium 构建，需要 Scale 计划 |
| 保持连接 | 开启 | 网络中断后会话重新连接 |

:::note
如果您的计划中没有付费功能，Hermes 会自动回退——首先禁用 `keepAlive`，然后是代理——因此即使在免费计划上，浏览仍然可以工作。
:::

## 会话管理

- 每个任务通过 Browserbase 获得一个隔离的浏览器会话
- 会话在闲置后会自动清理（默认：2 分钟）
- 后台线程每 30 秒检查一次过期会话
- 进程退出时运行紧急清理，以防止会话孤立
- 会话通过 Browserbase API（`REQUEST_RELEASE` 状态）释放

## 限制

- **基于文本的交互** — 依赖辅助功能树，而非像素坐标
- **快照大小** — 大型页面可能会被截断或在 8000 字符处由 LLM 总结
- **会话超时** — 云端会话根据您的提供商计划设置过期
- **成本** — 云端会话消耗提供商积分；会话在对话结束或闲置后会自动清理。使用 `/browser connect` 进行免费的本地浏览。
- **无法下载文件** — 无法从浏览器下载文件