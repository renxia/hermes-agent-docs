---
sidebar_position: 17
title: "通过SSH/远程主机进行OAuth认证"
description: "当Hermes运行在远程机器、容器或跳板机后时，如何完成基于浏览器的OAuth（xAI、Spotify、MCP服务器）认证"
---

# 通过SSH/远程主机进行OAuth认证

部分Hermes服务提供商 —— **xAI Grok OAuth**、**Spotify** 以及 **远程MCP服务器**（Linear、Sentry、Atlassian、Asana、Figma等）—— 采用 *回环重定向* 的OAuth流程。认证服务器会将您的浏览器重定向至 `http://127.0.0.1:<端口>/callback`，从而让Hermes启动的小型HTTP监听器捕获授权码。

当Hermes和您的浏览器位于同一台机器时，这完全可行。但一旦两者分离，流程就会中断：您笔记本电脑的浏览器尝试连接 **您笔记本电脑** 上的 `127.0.0.1`，但监听器却绑定在 **远程服务器** 的 `127.0.0.1` 上。

解决方案只需一行SSH本地端口转发命令 —— 或者，当您没有真正的SSH客户端时（如GCP Cloud Shell、GitHub Codespaces、EC2 Instance Connect、Gitpod、基于浏览器的Web IDE等），可使用在 [#26923](https://github.com/NousResearch/hermes-agent/issues/26923) 中引入的新参数 `--manual-paste`。

## 简要说明

```bash
# 在本地机器（笔记本电脑）上，另开一个终端执行：
ssh -N -L 56121:127.0.0.1:56121 user@remote-host

# 在您已连接的远程机器SSH会话中执行：
hermes auth add xai-oauth --no-browser
# → Hermes会输出一个授权链接。请在笔记本电脑的浏览器中打开该链接。
# → 您的浏览器将重定向至 127.0.0.1:56121/callback，通过隧道将请求
#   转发给远程监听器，登录流程随即完成。
```

端口 `56121` 是xAI OAuth使用的默认端口。若使用Spotify，请将其替换为 `43827`。Hermes会在 `Waiting for callback on ...` 这一行输出它实际绑定的端口 —— 请从该处复制端口号。

```markdown
---
title: "仅限浏览器的远程（Cloud Shell / Codespaces / EC2 Instance Connect）"
description: "在没有常规SSH客户端的情况下，通过手动粘贴方式完成Hermes的身份验证流程。"
slug: "/hermes/docs/remote-browser-only"
---

## 仅限浏览器的远程（Cloud Shell / Codespaces / EC2 Instance Connect）

如果你没有常规的 SSH 客户端 — 例如因为你正在 GCP Cloud Shell、GitHub Codespaces、AWS EC2 Instance Connect、Gitpod 或其他基于浏览器的控制台中运行 Hermes — 那么上面的 SSH 隧道将不可用。请改用 `--manual-paste` 选项：

```bash
hermes auth add xai-oauth --manual-paste
# → Hermes 会打印一个授权链接。在你笔记本电脑的浏览器中打开它。
# → 在浏览器中批准授权。对 `127.0.0.1:56121/callback` 的重定向将会加载失败 — 这是预期行为。
# → 从失败页面的地址栏中复制**完整的 URL**。
# → 将其粘贴回终端的 "Callback URL:" 提示符后。
```

该标志同样适用于 `hermes model --manual-paste`，用于集成模型选择器。如果你不想粘贴整个 URL，只粘贴 `?code=...&state=...` 查询片段也可以。

Hermes 对两条路径使用**相同的 PKCE 验证器、状态和随机数**，因此上游的 OAuth 流程是字节相同的 — `--manual-paste` 纯粹是回调环节传输方式的改变，并不会降低安全性。

## 哪些提供商需要此功能

| 提供商 | 回环端口 | 是否需要隧道？ |
|----------|---------------|----------------|
| `xai-oauth` (Grok SuperGrok) | `56121` | 是，当 Hermes 在远程运行时 |
| Spotify | `43827` | 是，当 Hermes 在远程运行时 |
| MCP 服务器 (`auth: oauth`) | 按服务器自动选择 | 是，当 Hermes 在远程运行时 |
| `anthropic` (Claude Pro/Max) | 不适用 | 否 — 使用粘贴代码流程 |
| `openai-codex` (ChatGPT Plus/Pro) | 不适用 | 否 — 使用设备代码流程 |
| `minimax`, `nous-portal` | 不适用 | 否 — 使用设备代码流程 |

如果你的提供商不在表中，则不需要隧道。

## MCP 服务器

远程 MCP 服务器（Linear, Sentry, Atlassian, Asana, Figma 等）使用相同的回环重定向流程。Hermes 会为每个服务器自动选择一个空闲端口，并在 OAuth 流程启动时打印授权链接 — 可以在启动时（当 `mcp_servers:` 中出现新服务器时），或者当你运行 `hermes mcp login <server>` 时。

从远程主机完成授权有两种方式：

**方式 1 — 粘贴重定向 URL（无需设置，任何地方都适用）。** 在交互式终端中，Hermes 会提示你粘贴重定向 URL，同时运行本地监听器。在浏览器中批准授权后，对 `http://127.0.0.1:<端口>/callback` 的重定向会显示连接错误 — 这是预期行为。从浏览器的地址栏复制**完整的 URL** 并粘贴到 Hermes 提示符后：

```
  MCP OAuth: 需要授权。
  在浏览器中打开此 URL：

    https://mcp.linear.app/authorize?response_type=code&...

  或者在此处粘贴重定向 URL（或 `?code=...&state=...` 部分）并按回车键：
> https://mcp.linear.app/callback?code=abc123&state=xyz
  已从粘贴内容获取授权码 — 正在完成流程。
```

只粘贴 `?code=...&state=...` 查询字符串也可以。这对任何使用 `auth: oauth` 的 MCP 服务器都适用，且无需更改 SSH 配置。

**方式 2 — SSH 端口转发（与 xAI / Spotify 相同）。** Hermes 会在 SSH 会话提示中打印它绑定的确切端口。在你笔记本电脑上打开一个单独的终端：

```bash
ssh -N -L <端口>:127.0.0.1:<端口> user@remote-host
```

然后照常在浏览器中打开授权链接；重定向会通过隧道转发，监听器会捕获它。当你需要流程在无人值守的情况下完成时（例如脚本化的重新认证，无法交互式粘贴），请使用此方式。

**陷阱 — 30 秒的配置重载竞争。** 如果你在运行中的 Hermes 会话内部编辑 `~/.hermes/config.yaml` 来添加 OAuth MCP 服务器，CLI 会以 30 秒超时自动重新加载 MCP 连接。这不足以完成交互式的 OAuth 流程，重载将会放弃。请改为从一个全新的终端运行 `hermes mcp login <server>` — 它没有此类限制，会等待完整的 5 分钟供你粘贴回来。

## 为什么监听器不能直接绑定到 0.0.0.0

xAI 和 Spotify 都会根据允许列表验证 `redirect_uri` 参数。两者都要求回环形式 (`http://127.0.0.1:<精确端口>/callback`)。将监听器绑定到 `0.0.0.0` 或其他端口会导致认证服务器因重定向 URI 不匹配而拒绝请求。SSH 隧道可以端到端地保持回环 URI 不变。

## 分步指南：单 SSH 跳转

### 1. 从本地机器启动隧道

```bash
# xAI Grok OAuth (端口 56121)
ssh -N -L 56121:127.0.0.1:56121 user@remote-host

# 或者用于 Spotify (端口 43827)
ssh -N -L 43827:127.0.0.1:43827 user@remote-host
```

`-N` 表示“不打开远程 shell，只保持隧道打开。”在登录期间保持此终端运行。

### 2. 在另一个 SSH 会话中，运行认证命令

```bash
ssh user@remote-host
hermes auth add xai-oauth --no-browser
# 或者用于 Spotify:
# hermes auth add spotify --no-browser
```

Hermes 会检测到 SSH 会话，跳过自动打开浏览器，并打印一个授权链接以及一条 `Waiting for callback on http://127.0.0.1:<端口>/callback` 的信息。

### 3. 在本地浏览器中打开 URL

从远程终端复制授权链接，并粘贴到你笔记本电脑的浏览器中。批准同意屏幕。认证服务器会重定向到 `http://127.0.0.1:<端口>/callback`。你的浏览器会访问隧道，请求被转发到远程监听器，然后 Hermes 打印 `Login successful!`。

一旦你看到成功信息，就可以拆除隧道（在第一个终端中按 Ctrl+C）。

## 分步指南：通过跳板机

如果你通过堡垒机/跳板机访问 Hermes，请使用 SSH 内置的 `-J` (ProxyJump)：

```bash
ssh -N -L 56121:127.0.0.1:56121 -J jump-user@jump-host user@final-host
```

这会将 SSH 连接链接到跳板机，而不将回环端口放在跳板机本身。你笔记本电脑上的本地 `127.0.0.1:56121` 会直接隧道到最终远程主机上的 `127.0.0.1:56121`。

对于不支持 `-J` 的旧版 OpenSSH，完整形式是：

```bash
ssh -N \
    -o "ProxyCommand=ssh -W %h:%p jump-user@jump-host" \
    -L 56121:127.0.0.1:56121 \
    user@final-host
```

## Mosh, tmux, ssh ControlMaster

隧道是底层 SSH 连接的一个属性。如果你通过 mosh 会话在 `tmux` 内运行 Hermes，mosh 的漫游功能不会携带 `-L` 转发。请**仅**为 `-L` 隧道打开一个*单独的*普通 SSH 会话 — 这是认证流程期间必须保持活跃的连接。你交互式的 mosh/tmux 会话可以继续正常运行 Hermes。

如果你使用 `ssh -o ControlMaster=auto`，多路复用连接上的端口转发将共享主连接的生命周期。如果隧道没有启动，请重启主连接：

```bash
ssh -O exit user@remote-host
ssh -N -L 56121:127.0.0.1:56121 user@remote-host
```

## 故障排除

### `bind [127.0.0.1]:56121: Address already in use`

你笔记本电脑上已经有程序在使用该端口。要么之前的隧道没有干净地关闭，要么本地的 Hermes 也在监听该端口。找到并终止占用进程：

```bash
# macOS / Linux
lsof -iTCP:56121 -sTCP:LISTEN
kill <PID>
```

然后重试 `ssh -L` 命令。

### “Could not establish connection. We couldn't reach your app.” (xAI)

当 xAI 对 `127.0.0.1:<端口>/callback` 的重定向无法到达监听器时，其授权页面会显示此信息。要么隧道没有运行，要么端口错误，要么你使用的是 Hermes 上一次运行时打印的端口（如果首选端口被占用，端口可能会被自动递增 — 请始终阅读最新的 `Waiting for callback on ...` 行）。

### `xAI authorization timed out waiting for the local callback`

与上面相同的根本原因 — 重定向从未返回。检查隧道是否仍然存活（`ssh -N` 不会显示输出，所以查看你启动它的终端），如果需要则重启它，并重新运行 `hermes auth add xai-oauth --no-browser`。

### 令牌落入了错误的 `~/.hermes`

令牌会被写入运行 `hermes auth add ...` 的 Linux 用户的目录下。如果你的网关/systemd 服务以不同用户身份运行（例如 `root` 或专用的 `hermes` 用户），请以**该**用户身份进行认证，以便令牌落入他们的 `~/.hermes/auth.json`。使用 `sudo -u hermes -i` 或等效命令。

## 另请参阅

- [xAI Grok OAuth](./xai-grok-oauth.md)
- [Spotify（“通过 SSH 运行”）](../user-guide/features/spotify.md#running-over-ssh--in-a-headless-environment)
- [原生 MCP 客户端（OAuth 部分）](../user-guide/features/mcp.md#oauth-authenticated-http-servers)
- [SSH `-J` / ProxyJump（手册页）](https://man.openbsd.org/ssh#J)
```