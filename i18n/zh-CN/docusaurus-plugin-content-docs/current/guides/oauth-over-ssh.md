---
sidebar_position: 17
title: "通过 SSH / 远程主机进行 OAuth"
description: "当 Hermes 运行在远程机器、容器或跳板机后面时，如何完成基于浏览器的 OAuth（xAI、Spotify、MCP 服务器）"
---

# 通过 SSH / 远程主机进行 OAuth

一些 Hermes 提供商 — **xAI Grok OAuth**、**Spotify** 和**远程 MCP 服务器**（Linear、Sentry、Atlassian、Asana、Figma 等）— 使用*本地回环重定向* OAuth 流程。认证服务器将你的浏览器重定向到 `http://127.0.0.1:<port>/callback`，这样由 Hermes 启动的一个小型 HTTP 监听器就能捕获授权码。

当 Hermes 和你的浏览器在同一台机器上时，这可以完美工作。但一旦它们不在同一台机器上就会失败：你笔记本电脑的浏览器尝试访问**你笔记本电脑**上的 `127.0.0.1`，但监听器绑定在**远程服务器**的 `127.0.0.1` 上。

解决方法是一行 SSH 本地端口转发命令 — **或者**，当你没有真正的 SSH 客户端时（GCP Cloud Shell、GitHub Codespaces、EC2 Instance Connect、Gitpod、基于浏览器的 Web IDE），使用在 [#26923](https://github.com/NousResearch/hermes-agent/issues/26923) 中引入的新 `--manual-paste` 标志。

## 简要说明

```bash
# 在你的本地机器（笔记本电脑）上，打开一个新的终端窗口：
ssh -N -L 56121:127.0.0.1:56121 user@remote-host

# 在远程机器上你现有的 SSH 会话中：
hermes auth add xai-oauth --no-browser
# → Hermes 打印一个授权 URL。在你笔记本电脑的浏览器中打开它。
# → 你的浏览器重定向到 127.0.0.1:56121/callback，隧道将请求转发
#   给远程监听器，登录完成。
```

端口 `56121` 是 xAI OAuth 使用的端口。对于 Spotify，请将其替换为 `43827`。Hermes 会在 `Waiting for callback on ...` 行上打印它绑定的确切端口 — 从那里复制。

## 仅限浏览器远程环境 (Cloud Shell / Codespaces / EC2 Instance Connect)

如果你没有常规的 SSH 客户端——例如你正在 GCP Cloud Shell、GitHub Codespaces、AWS EC2 Instance Connect、Gitpod 或其他基于浏览器的控制台内运行 Hermes——则上述 SSH 隧道不可用。请改用 `--manual-paste`：

```bash
hermes auth add xai-oauth --manual-paste
# → Hermes 会打印一个授权 URL。在你笔记本电脑的浏览器中打开它。
# → 在浏览器中批准授权。跳转到 127.0.0.1:56121/callback 的页面加载失败
#   ——这是预期行为。
# → 从失败页面的地址栏中复制完整的 URL。
# → 将其粘贴回终端的 "Callback URL:" 提示处。
```

此标志同样适用于集成的模型选择器 `hermes model --manual-paste`。Hermes 互换地接受三种回调粘贴形式：完整的 URL、裸 `?code=...&state=...` 查询片段，或者——当上游同意页面在页面内直接显示授权码而不是进行重定向时（例如 xAI 在基于浏览器的控制台上当前的行为）——直接粘贴裸授权码值本身。

Hermes 在这两种路径中使用**相同的 PKCE 验证器、状态和随机数**，因此上游 OAuth 流程在字节上是完全相同的——`--manual-paste` 纯粹是回调跳转的传输方式变更，并非安全性降级。

## 哪些提供商需要此功能

| 提供商 | 环回端口 | 需要隧道吗？ |
|----------|---------------|----------------|
| `xai-oauth` (Grok SuperGrok) | `56121` | 是，当 Hermes 在远程主机上时 |
| Spotify | `43827` | 是，当 Hermes 在远程主机上时 |
| MCP 服务器 (`auth: oauth`) | 每个服务器自动分配 | 是，当 Hermes 在远程主机上时 |
| `anthropic` (Claude Pro/Max) | 不适用 | 否 —— 粘贴授权码流程 |
| `openai-codex` (ChatGPT Plus/Pro) | 不适用 | 否 —— 设备码流程 |
| `minimax`, `nous-portal` | 不适用 | 否 —— 设备码流程 |

如果你的提供商不在表格中，则不需要隧道。

## MCP 服务器

远程 MCP 服务器 (Linear, Sentry, Atlassian, Asana, Figma 等) 使用相同的环回重定向流程。Hermes 为每个服务器自动选择一个空闲端口，并在 OAuth 流程启动时打印授权 URL——无论是在启动时（当 `mcp_servers:` 中出现新服务器时），还是在你运行 `hermes mcp login <server>` 时。

你有两种方式可以从远程主机完成认证：

**方式 1 — 粘贴重定向 URL（无需设置，随处可用）。** 在交互式终端上，Hermes 会提示你粘贴重定向 URL，同时运行本地监听器。在浏览器中批准后，跳转到 `http://127.0.0.1:<port>/callback` 的页面会显示连接错误——这是预期行为。从**浏览器地址栏中复制完整 URL** 并粘贴到 Hermes 提示处：

```
  MCP OAuth: 需要授权。
  在浏览器中打开此 URL：

    https://mcp.linear.app/authorize?response_type=code&...

  或者将重定向 URL 粘贴到此处（或 ?code=...&state=... 部分），然后按回车键：
> https://mcp.linear.app/callback?code=abc123&state=xyz
  从粘贴内容中获取授权码——正在完成流程。
```

也接受裸 `?code=...&state=...` 查询字符串。这适用于任何带有 `auth: oauth` 的 MCP 服务器，且无需更改 SSH 配置。

**方式 2 — SSH 端口转发（与 xAI / Spotify 相同）。** Hermes 在 SSH 会话提示中打印它绑定的确切端口。在你的笔记本电脑上打开另一个终端：

```bash
ssh -N -L <port>:127.0.0.1:<port> user@remote-host
```

然后照常在浏览器中打开授权 URL；重定向将通过隧道转发，监听器会接收到它。当你需要流程无人值守完成（例如，脚本化的重新认证，无法进行交互式粘贴）时使用此方式。

**陷阱 —— 30 秒的配置重载竞争。** 如果你在运行中的 Hermes 会话内部编辑 `~/.hermes/config.yaml` 来添加一个 OAuth MCP 服务器，CLI 会以 30 秒的超时自动重载 MCP 连接。这不足以完成交互式 OAuth 流程，重载将会放弃。请从一个新终端使用 `hermes mcp login <server>` —— 它没有这种限制，并会等待整整 5 分钟供你粘贴回来。

## 为什么监听器不能直接绑定 0.0.0.0

xAI 和 Spotify 都会根据允许列表验证 `redirect_uri` 参数。两者都要求环回形式（`http://127.0.0.1:<exact-port>/callback`）。将监听器绑定到 `0.0.0.0` 或其他端口会导致认证服务器因重定向 URI 不匹配而拒绝请求。SSH 隧道保持环回 URI 端到端完整。

## 分步指南：单次 SSH 跳转

### 1. 从你的本地机器启动隧道

```bash
# xAI Grok OAuth (端口 56121)
ssh -N -L 56121:127.0.0.1:56121 user@remote-host

# 或者用于 Spotify (端口 43827)
ssh -N -L 43827:127.0.0.1:43827 user@remote-host
```

`-N` 表示“不要打开远程 shell，只保持隧道开启。”在登录期间保持此终端运行。

### 2. 在另一个 SSH 会话中，运行认证命令

```bash
ssh user@remote-host
hermes auth add xai-oauth --no-browser
# 或用于 Spotify：
# hermes auth add spotify --no-browser
```

Hermes 检测到 SSH 会话，跳过浏览器自动打开，并打印一个授权 URL 以及一行 `Waiting for callback on http://127.0.0.1:<port>/callback`。

### 3. 在你的本地浏览器中打开 URL

从远程终端复制授权 URL 并粘贴到你笔记本电脑的浏览器中。批准同意屏幕。认证服务器会重定向到 `http://127.0.0.1:<port>/callback`。你的浏览器命中隧道，请求被转发给远程监听器，然后 Hermes 打印 `Login successful!`。

一旦看到成功提示行，你就可以拆除隧道（在第一个终端中按 Ctrl+C）。

## 分步指南：通过跳转机

如果你通过堡垒机/跳转主机连接到 Hermes，请使用 SSH 内置的 `-J`（ProxyJump）：

```bash
ssh -N -L 56121:127.0.0.1:56121 -J jump-user@jump-host user@final-host
```

这会将 SSH 连接链通过跳转主机，而无需将环回端口放在跳转机本身上。你笔记本电脑上的本地 `127.0.0.1:56121` 直接隧道到最终远程主机上的 `127.0.0.1:56121`。

对于不支持 `-J` 的旧版 OpenSSH，长格式为：

```bash
ssh -N \
    -o "ProxyCommand=ssh -W %h:%p jump-user@jump-host" \
    -L 56121:127.0.0.1:56121 \
    user@final-host
```

## Mosh, tmux, ssh ControlMaster

隧道是底层 SSH 连接的属性。如果你通过 mosh 会话在 `tmux` 内运行 Hermes，mosh 的漫游不会携带 `-L` 转发。请为 `-L` 隧道**单独**打开一个普通的 SSH 会话——这是认证流程期间必须保持存活的连接。你交互式的 mosh/tmux 会话可以正常继续运行 Hermes。

如果你使用 `ssh -o ControlMaster=auto`，多路复用连接上的端口转发将共享主连接的生命周期。如果隧道没有建立，请重启主连接：

```bash
ssh -O exit user@remote-host
ssh -N -L 56121:127.0.0.1:56121 user@remote-host
```

## 故障排除

### `bind [127.0.0.1]:56121: Address already in use`

你笔记本电脑上某个进程正在使用该端口。可能是之前的隧道没有干净地关闭，或者一个本地 Hermes 也在监听它。找到并终止该进程：

```bash
# macOS / Linux
lsof -iTCP:56121 -sTCP:LISTEN
kill <PID>
```

然后重试 `ssh -L` 命令。

### "Could not establish connection. We couldn't reach your app." (xAI)

当 xAI 的授权页面重定向到 `127.0.0.1:<port>/callback` 但无法到达监听器时，会显示此信息。可能是隧道没有运行，端口错误，或者你使用的是 Hermes 上一次运行时打印的端口（如果首选端口繁忙，端口可能会自动递增——始终读取最新的 `Waiting for callback on ...` 行）。

### `xAI authorization timed out waiting for the local callback`

根本原因与上述相同——重定向从未返回。检查隧道是否仍然存活（`ssh -N` 不显示输出，因此请查看你启动它的终端），如果需要请重启它，并重新运行 `hermes auth add xai-oauth --no-browser`。

### 令牌存放在错误的 `~/.hermes` 中

令牌会写入运行 `hermes auth add ...` 的 Linux 用户下。如果你的网关/systemd 服务以不同的用户身份运行（例如 `root` 或一个专用的 `hermes` 用户），请以**该**用户身份进行认证，以便令牌存入他们的 `~/.hermes/auth.json`。使用 `sudo -u hermes -i` 或等效命令。
## 另请参阅

- [xAI Grok OAuth](./xai-grok-oauth.md)
- [Spotify (`Running over SSH`)](../user-guide/features/spotify.md#running-over-ssh--in-a-headless-environment)
- [原生 MCP 客户端（OAuth 部分）](../user-guide/features/mcp.md#oauth-authenticated-http-servers)
- [SSH `-J` / ProxyJump (手册页)](https://man.openbsd.org/ssh#J)