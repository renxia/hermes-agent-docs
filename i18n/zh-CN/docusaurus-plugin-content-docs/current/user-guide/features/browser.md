---
title: 浏览器自动化
description: 通过多个提供商控制浏览器，本地 Chrome 通过 CDP，或用于网页交互、表单填写、数据抓取等的云浏览器。
sidebar_label: 浏览器
sidebar_position: 5
---

# 浏览器自动化

Hermes Agent 包含一套完整的浏览器自动化工具集，支持多种后端选项：

- **Browserbase 云模式** 通过 [Browserbase](https://browserbase.com) 提供托管云浏览器和反机器人工具
- **Browser Use 云模式** 通过 [Browser Use](https://browser-use.com) 作为替代的云浏览器提供商
- **Firecrawl 云模式** 通过 [Firecrawl](https://firecrawl.dev) 提供内置数据抓取功能的云浏览器
- **Camofox 本地模式** 通过 [Camofox](https://github.com/jo-inc/camofox-browser) 实现本地反检测浏览（基于 Firefox 的指纹伪装）
- **通过 CDP 连接本地 Chrome** — 使用 `/browser connect` 将浏览器工具连接到您自己的 Chrome 实例
- **本地浏览器模式** 通过 `agent-browser` CLI 和本地 Chromium 安装实现

在所有模式下，代理都可以导航网站、与页面元素交互、填写表单并提取信息。

## 概览

页面以**可访问性树**（文本快照）形式表示，非常适合 LLM 代理。交互式元素会获得 ref ID（如 `@e1`、`@e2`），代理可以用它们进行点击和输入操作。

主要功能：

- **多提供商云执行** — Browserbase、Browser Use 或 Firecrawl — 无需本地浏览器
- **本地 Chrome 集成** — 通过 CDP 连接到正在运行的 Chrome 进行实时浏览
- **内置隐身功能** — 随机指纹、验证码解决、住宅代理（Browserbase）
- **会话隔离** — 每个任务都有独立的浏览器会话
- **自动清理** — 不活跃会话在超时后自动关闭
- **视觉分析** — 截图 + AI 分析实现视觉理解

## 设置

:::tip Nous 订阅用户
如果您拥有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，可以通过 **[Tool Gateway](tool-gateway.md)** 使用浏览器自动化功能而无需单独 API 密钥。运行 `hermes model` 或 `hermes tools` 即可启用。
:::

### Browserbase 云模式

要使用 Browserbase 管理的云浏览器，请添加：

```bash
# 添加到 ~/.hermes/.env
BROWSERBASE_API_KEY=***
BROWSERBASE_PROJECT_ID=your-project-id-here
```

在 [browserbase.com](https://browserbase.com) 获取您的凭据。

### Browser Use 云模式

要将 Browser Use 用作云浏览器提供商，请添加：

```bash
# 添加到 ~/.hermes/.env
BROWSER_USE_API_KEY=***
```

在 [browser-use.com](https://browser-use.com) 获取您的 API 密钥。Browser Use 通过其 REST API 提供云浏览器。如果同时设置了 Browserbase 和 Browser Use 凭据，将优先使用 Browserbase。

### Firecrawl 云模式

要将 Firecrawl 用作云浏览器提供商，请添加：

```bash
# 添加到 ~/.hermes/.env
FIRECRAWL_API_KEY=fc-***
```

在 [firecrawl.dev](https://firecrawl.dev) 获取您的 API 密钥。然后将 Firecrawl 选择为您的浏览器提供商：

```bash
hermes setup tools
# → 浏览器自动化 → Firecrawl
```

可选设置：

```bash
# 自托管 Firecrawl 实例（默认：https://api.firecrawl.dev）
FIRECRAWL_API_URL=http://localhost:3002

# 会话 TTL（秒）（默认：300）
FIRECRAWL_BROWSER_TTL=600
```

### Camofox 本地模式

[Camofox](https://github.com/jo-inc/camofox-browser) 是一个自托管的 Node.js 服务器，包装了 Camoufox（一个带有 C++ 指纹伪装的 Firefox 分支）。它提供无云依赖的本地反检测浏览。

```bash
# 安装和运行
git clone https://github.com/jo-inc/camofox-browser && cd camofox-browser
npm install && npm start   # 首次运行时会下载 Camoufox（约 300MB）

# 或通过 Docker
docker run -d --network host -e CAMOFOX_PORT=9377 jo-inc/camofox-browser
```

然后在 `~/.hermes/.env` 中设置：

```bash
CAMOFOX_URL=http://localhost:9377
```

或通过 `hermes tools` → 浏览器自动化 → Camofox 配置。

当设置了 `CAMOFOX_URL` 时，所有浏览器工具都会自动通过 Camofox 路由，而不是 Browserbase 或 agent-browser。

#### 持久化浏览器会话

默认情况下，每个 Camofox 会话都会获得随机身份 — Cookie 和登录状态不会在代理重启之间保留。要启用持久化浏览器会话，请在 `~/.hermes/config.yaml` 中添加以下内容：

```yaml
browser:
  camofox:
    managed_persistence: true
```

然后完全重启 Hermes 以加载新配置。

:::warning 嵌套路径很重要
Hermes 读取的是 `browser.camofox.managed_persistence`，**不是**顶层的 `managed_persistence`。常见的错误是写成：

```yaml
# ❌ 错误 — Hermes 会忽略此设置
managed_persistence: true
```

如果标志放在错误的路径下，Hermes 会静默回退到随机的临时 `userId`，每次会话都会丢失登录状态。
:::

##### Hermes 的作用
- 向 Camofox 发送确定性的 profile-scoped `userId`，以便服务器可以在会话间重用相同的 Firefox 配置文件。
- 跳过清理时的服务端上下文销毁，使 Cookie 和登录状态在代理任务间保持。
- 将 `userId` 限定到活动 Hermes profile，因此不同的 Hermes profile 会获得不同的浏览器配置文件（profile 隔离）。

##### Hermes 不做的事情
- 它不会强制 Camofox 服务器持久化。Hermes 只发送稳定的 `userId`；服务器必须通过将该 `userId` 映射到持久的 Firefox 配置文件目录来遵守它。
- 如果您的 Camofox 服务器构建将每个请求视为临时请求（例如总是调用 `browser.newContext()` 而不加载存储的配置文件），Hermes 无法使这些会话持久化。请确保您运行的是支持基于 userId 的配置文件持久化的 Camofox 构建版本。

##### 验证是否正常工作

1. 启动 Hermes 和您的 Camofox 服务器。
2. 在浏览器任务中打开 Google（或其他登录站点）并手动登录。
3. 正常结束浏览器任务。
4. 开始新的浏览器任务。
5. 再次打开同一站点 — 您应该仍然处于登录状态。

如果在步骤 5 中被登出，则 Camofox 服务器没有遵守稳定的 `userId`。请仔细检查您的配置路径，确认编辑 `config.yaml` 后完全重启了 Hermes，并验证您的 Camofox 服务器版本支持按用户持久化配置文件。

##### 状态存储位置

Hermes 从 profile-scoped 目录 `~/.hermes/browser_auth/camofox/`（或非默认配置下的 `$HERMES_HOME` 等效目录）派生稳定的 `userId`。实际的浏览器配置文件数据存储在 Camofox 服务器端，以该 `userId` 为键。要完全重置持久化配置文件，请在 Camofox 服务器上清除它并删除相应 Hermes profile 的状态目录。

#### VNC 实时视图

当 Camofox 以 headed 模式运行（显示可见浏览器窗口）时，会在其健康检查响应中暴露 VNC 端口。Hermes 会自动发现这一点，并在导航响应中包含 VNC URL，使您可以共享链接来观看浏览器实时操作。

### 通过 CDP 连接本地 Chrome（`/browser connect`）

除了云提供商，您还可以通过 Chrome DevTools Protocol (CDP) 将 Hermes 浏览器工具连接到您自己的正在运行的 Chrome 实例。当您希望实时查看代理的操作、与需要您自己 Cookie/会话的页面交互，或避免云浏览器费用时，这很有用。

:::note
`/browser connect` 是一个**交互式 CLI 斜杠命令** — 它不由网关分发。如果在 WebUI、Telegram、Discord 或其他网关聊天中尝试运行它，消息将作为纯文本发送给代理，命令不会执行。请从终端启动 Hermes（`hermes` 或 `hermes chat`），并在那里发出 `/browser connect` 命令。
:::

在 CLI 中使用：

```
/browser connect              # 连接到 ws://localhost:9222 的 Chrome
/browser connect ws://host:port  # 连接到特定的 CDP 端点
/browser status               # 检查当前连接
/browser disconnect            # 分离并返回云/本地模式
```

如果 Chrome 没有已启用远程调试的运行实例，Hermes 会尝试自动启动它，使用 `--remote-debugging-port=9222`。

:::tip
要手动启动启用了 CDP 的 Chrome，请使用专用的 user-data-dir，这样即使 Chrome 已经使用您的常规配置文件运行，调试端口也能正确打开：

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

**为什么需要 `--user-data-dir`？** 如果没有它，在常规 Chrome 实例已经运行时启动 Chrome 通常会打开现有进程的新窗口 — 但该现有进程并非以 `--remote-debugging-port` 启动，因此端口 9222 永远不会打开。专用的 user-data-dir 会强制创建新的 Chrome 进程，其中调试端口实际监听。`--no-first-run --no-default-browser-check` 会跳过新配置文件的首次启动向导。
:::

通过 CDP 连接后，所有浏览器工具（`browser_navigate`、`browser_click` 等）都会在您的实时 Chrome 实例上操作，而不是启动云会话。

### 本地浏览器模式

如果您未设置任何云凭据且不使用 `/browser connect`，Hermes 仍可通过由 `agent-browser` 驱动的本地 Chromium 安装使用浏览器工具。

### 可选环境变量

```bash
# 住宅代理以提高验证码解决能力（默认："true"）
BROWSERBASE_PROXIES=true

# 高级隐身功能，使用自定义 Chromium — 需要 Scale Plan（默认："false"）
BROWSERBASE_ADVANCED_STEALTH=false

# 断开后重新连接会话 — 需要付费计划（默认："true"）
BROWSERBASE_KEEP_ALIVE=true

# 自定义会话超时时间（毫秒）（默认：项目默认值）
# 示例：600000（10分钟），1800000（30分钟）
BROWSERBASE_SESSION_TIMEOUT=600000

# 不活跃超时时间（秒）自动清理前等待时间（默认：120）
BROWSER_INACTIVITY_TIMEOUT=120
```

### 安装 agent-browser CLI

```bash
npm install -g agent-browser
# 或在仓库中本地安装：
npm install
```

:::info
`browser` 工具集必须包含在您的配置的 `toolsets` 列表中，或通过 `hermes config set toolsets '["hermes-cli", "browser"]'` 启用。
:::

## 可用工具

### `browser_navigate`

导航到 URL。必须在任何其他浏览器工具之前调用。初始化 Browserbase 会话。

```
导航到 https://github.com/NousResearch
```

:::tip
对于简单的信息检索，优先使用 `web_search` 或 `web_extract` — 它们更快且更便宜。当您需要**与页面交互**（点击按钮、填写表单、处理动态内容）时使用浏览器工具。
:::

### `browser_snapshot`

获取当前页面可访问性树的文本快照。返回带有 ref ID（如 `@e1`、`@e2`）的交互式元素，可用于 `browser_click` 和 `browser_type`。

- **`full=false`**（默认）：仅显示交互式元素的紧凑视图
- **`full=true`**：完整页面内容

超过 8000 个字符的快照会自动由 LLM 总结。

### `browser_click`

点击由快照中的 ref ID 标识的元素。

```
点击 @e5 按下 "Sign In" 按钮
```

### `browser_type`

在输入字段中输入文本。先清空字段，然后输入新文本。

```
在搜索字段 @e3 中输入 "hermes agent"
```

### `browser_scroll`

向上或向下滚动页面以查看更多内容。

```
向下滚动查看更多结果
```

### `browser_press`

按下键盘按键。适用于提交表单或导航。

```
按 Enter 提交表单
```

支持的按键：`Enter`、`Tab`、`Escape`、`ArrowDown`、`ArrowUp` 等。

### `browser_back`

返回到浏览器历史记录中的上一页。

### `browser_get_images`

列出当前页面上的所有图片及其 URL 和 alt 文本。适用于查找要分析的图片。

### `browser_vision`

拍摄截图并使用视觉 AI 进行分析。当文本快照无法捕获重要视觉信息时使用 — 特别适用于验证码、复杂布局或视觉验证挑战。

截图会持久保存，并返回文件路径以及 AI 分析结果。在消息平台（Telegram、Discord、Slack、WhatsApp）上，您可以要求代理分享截图 — 它会通过 `MEDIA:` 机制作为原生照片附件发送。

```
这个图表显示了什么？
```

截图存储在 `~/.hermes/cache/screenshots/` 中，24 小时后自动清理。

### `browser_console`

获取浏览器控制台输出（日志/警告/错误消息）和未捕获的 JavaScript 异常。对于检测可访问性树中不显示的静默 JS 错误至关重要。

```
检查浏览器控制台是否有 JavaScript 错误
```

使用 `clear=True` 在读取后清除控制台，以便后续调用只显示新消息。

### `browser_cdp`

原始的 Chrome DevTools Protocol 直通 — 其他工具未覆盖的浏览器操作的逃生舱口。用于原生对话框处理、iframe 范围评估、Cookie/网络控制，或代理需要的任何 CDP 动词。

**仅在会话开始时可访问 CDP 端点时可用** — 这意味着 `/browser connect` 已连接到正在运行的 Chrome，或 `browser.cdp_url` 已在 `config.yaml` 中设置。默认的本地 agent-browser 模式、Camofox 和云提供商（Browserbase、Browser Use、Firecrawl）目前不向此工具暴露 CDP — 云提供商有每会话的 CDP URL，但实时会话路由是后续功能。

**CDP 方法参考：** https://chromedevtools.github.io/devtools-protocol/ — 代理可以使用 `web_extract` 提取特定方法的页面来查找参数和返回形状。

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

# 获取所有 Cookie
browser_cdp(method="Network.getAllCookies")
```

浏览器级方法（`Target.*`、`Browser.*`、`Storage.*`）省略 `target_id`。页面级方法（`Page.*`、`Runtime.*`、`DOM.*`、`Emulation.*`）需要来自 `Target.getTargets` 的 `target_id`。每次调用都是独立的 — 调用之间不保持会话。

## 实用示例

### 填写网页表单

```
用户：使用我的邮箱 john@example.com 在 example.com 注册账户

代理工作流程：
1. browser_navigate("https://example.com/signup")
2. browser_snapshot()  → 看到带 ref 的表单字段
3. browser_type(ref="@e3", text="john@example.com")
4. browser_type(ref="@e5", text="SecurePass123")
5. browser_click(ref="@e8")  → 点击 "Create Account"
6. browser_snapshot()  → 确认成功
```

### 研究动态内容

```
用户：现在 GitHub 上有哪些热门仓库？

代理工作流程：
1. browser_navigate("https://github.com/trending")
2. browser_snapshot(full=true)  → 读取热门仓库列表
3. 返回格式化结果
```

## 会话录制

自动将浏览器会话录制为 WebM 视频文件：

```yaml
browser:
  record_sessions: true  # 默认：false
```

启用后，录制会在第一次 `browser_navigate` 时自动开始，并在会话关闭时保存到 `~/.hermes/browser_recordings/`。在本地和云（Browserbase）模式下都有效。超过 72 小时的录制片段会自动清理。

## 隐身功能

Browserbase 提供自动隐身功能：

| 功能 | 默认 | 说明 |
|---------|---------|-------|
| 基础隐身 | 始终开启 | 随机指纹、视窗随机化、验证码解决 |
| 住宅代理 | 开启 | 通过住宅 IP 路由以获得更好访问 |
| 高级隐身 | 关闭 | 自定义 Chromium 构建，需要 Scale Plan |
| 保持连接 | 开启 | 网络中断后重新连接会话 |

:::note
如果您的计划中不提供付费功能，Hermes 会自动回退 — 首先禁用 `keepAlive`，然后是代理 — 因此免费计划仍可浏览。
:::

## 会话管理

- 每个任务通过 Browserbase 获得隔离的浏览器会话
- 会话会在不活跃后自动清理（默认：2 分钟）
- 后台线程每 30 秒检查一次过期会话
- 进程退出时运行紧急清理以防止孤儿会话
- 会话通过 Browserbase API 释放（`REQUEST_RELEASE` 状态）

## 限制

- **基于文本的交互** — 依赖于可访问性树，而非像素坐标
- **快照大小** — 大页面可能被截断或在 8000 字符处由 LLM 总结
- **会话超时** — 云会话根据您的提供商计划设置过期
- **成本** — 云会话消耗提供商信用额度；会话在对话结束时或在不活跃后自动清理。使用 `/browser connect` 进行免费的本地浏览。
- **无文件下载** — 无法从浏览器下载文件