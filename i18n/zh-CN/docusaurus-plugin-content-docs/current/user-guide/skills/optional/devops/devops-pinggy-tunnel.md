title: Pinggy Tunnel — Zero-install localhost tunnels over SSH via Pinggy
sidebar_label: "Pinggy Tunnel"
description: "Zero-install localhost tunnels over SSH via Pinggy"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Pinggy Tunnel

通过 Pinggy 零安装的 SSH 本地主机隧道。

## Skill metadata

| | |
|---|---|
| Source | Optional — install with `hermes skills install official/devops/pinggy-tunnel` |
| Path | `optional-skills/devops/pinggy-tunnel` |
| Version | `0.1.0` |
| Author | Teknium (teknium1)，Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `Pinggy`, `Tunnel`, `Networking`, `SSH`, `Webhook`, `Localhost` |
| Related skills | `cloudflared-quick-tunnel`, `webhook-subscriptions` |

## Key Paths & Config

```
~/.hermes/config.yaml       Main configuration
~/.hermes/.env              API keys and secrets (under $HERMES_HOME if set)
$HERMES_HOME
```

# Pinggy Tunnel Skill

将本地服务（开发服务器、webhook 接收器、MCP 端点、演示）通过 Pinggy SSH 反向隧道暴露给公网。无需安装守护进程——用户的标准 SSH 客户端连接到 `a.pinggy.io:443`，Pinggy 则返回一个公共的 HTTP/HTTPS URL。

免费套餐：60 分钟隧道，随机子域名，无需注册。专业版（$3/月）需要令牌才能选择加入。

## 使用场景

- 用户要求“暴露本地服务”、“分享我的开发服务器”、“让这个 URL 公开”、“隧道端口 N”、“获取 webhook 的公共 URL”。
- 在本地任务中需要接收 webhook 回调（Stripe、GitHub、Discord、AgentMail）。
- 与远程方分享一次性的 HTTP 演示（MCP 服务器、Ollama/vLLM 端点、仪表板）。
- 主机拥有 SSH 但没有 `cloudflared` / `ngrok` 二进制文件，安装这些工具过于繁琐。

如果主机已配置 `cloudflared`，请优先使用 `cloudflared-quick-tunnel` 技能——Cloudflare quick tunnels 不会过期。

## 先决条件

- PATH 中有 `ssh` (`ssh -V`)。Linux、macOS 和 Windows 10 及更高版本均默认自带。无需其他安装。
- 在隧道启动之前，本地服务必须监听在 `127.0.0.1:<port>` 上。Pinggy 会返回 URL，但在本地源启动前会显示 502 错误。

可选：

- 用于付费专业版功能的 `PINGGY_TOKEN` 环境变量（持久化子域名、自定义域名、多个隧道、无 60 分钟限制）。免费套餐无需凭证。

## 快速参考

```bash
# 端口 8000 的纯 HTTP/HTTPS 隧道（免费套餐）
ssh -p 443 -o StrictHostKeyChecking=no -o ServerAliveInterval=30 \
    -R0:localhost:8000 free@a.pinggy.io

# TCP 隧道（数据库、原始 SSH 等）
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:5432 tcp@a.pinggy.io

# TLS 隧道（Pinggy 无法解密——请在源端提供自己的证书）
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:443 tls@a.pinggy.io

# 基本身份验证网关 (b:user:pass)
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:8000 \
    "b:admin:secret+free@a.pinggy.io"

# Bearer token 网关 (k:token)
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:8000 \
    "k:mysecrettoken+free@a.pinggy.io"

# IP 白名单 (w:CIDR)
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:8000 \
    "w:203.0.113.0/24+free@a.pinggy.io"

# 启用 CORS + 强制 HTTPS 重定向
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:8000 \
    "co+x:https+free@a.pinggy.io"

# 专业版（持久 URL，无 60 分钟限制）
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:8000 "$PINGGY_TOKEN+a.pinggy.io"
```

## 流程 — 启动隧道并获取 URL

模型应该使用 `terminal` 工具。隧道必须在分享期间保持活动状态，因此应将其作为后台进程运行，并从标准输出解析公共 URL。

### 1. 确认本地源已启动

```bash
curl -sI http://127.0.0.1:8000/ | head -1
# 预期返回 HTTP/1.x 200（或任何非连接被拒绝的响应）
```

如果还没有服务在监听，请先启动它（例如：`python3 -m http.server 8000 --bind 127.0.0.1`）。Pinggy 会愉快地返回一个指向虚无的 URL——直到本地源启动，用户才会看到 502 错误。

### 2. 将隧道作为后台进程启动

使用 `terminal(background=True)` 并将输出捕获到一个日志文件（Pinggy 在标准输出上打印 URL，然后保持连接打开）：

```bash
LOG=/tmp/pinggy-8000.log
nohup ssh -p 443 \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -R0:localhost:8000 free@a.pinggy.io \
    > "$LOG" 2>&1 &
echo $! > /tmp/pinggy-8000.pid
```

`StrictHostKeyChecking=no` + `UserKnownHostsFile=/dev/null` 跳过了首次运行时的主机密钥提示。`ServerAliveInterval=30` 防止 SSH 会话被空闲 NAT 终止。

### 3. 从日志中解析 URL

```bash
sleep 4
grep -oE 'https://[a-z0-9-]+\.[a-z]+\.pinggy\.link' /tmp/pinggy-8000.log | head -1
```

预期输出如下：

```
You are not authenticated.
Your tunnel will expire in 60 minutes.
http://yqycl-98-162-69-48.a.free.pinggy.link
https://yqycl-98-162-69-48.a.free.pinggy.link
```

将 `https://...pinggy.link` URL 提供给用户。

### 4. 验证

```bash
curl -sI https://<the-url>/ | head -3
# 预期返回 200/302/本地源实际返回的任何状态码
```

如果收到 `502 Bad Gateway`，则 SSH 会话已启动，但本地源未监听——请先修复步骤 1。

### 5. 清理

```bash
kill "$(cat /tmp/pinggy-8000.pid)"
# 或者，如果 pid 文件丢失：
pkill -f 'ssh -p 443 .* free@a\.pinggy\.io'
```

如果从 `terminal(background=True)` 中获得了 `session_id`，请优先使用 `process(action='kill', session_id=...)`。

## 通过用户名关键词进行访问控制

Pinggy 将控制标志堆叠到 SSH 用户名中，用 `+` 分隔。当包含 `+` 时，始终引用整个 `user@host` 参数：

| 关键词 | 作用 |
|---------|--------|
| `b:user:pass` | HTTP 基本身份验证网关 |
| `k:token` | Bearer-token 头网关（`Authorization: Bearer <token>`） |
| `w:CIDR` | IP 白名单（单个 IP 或 CIDR，可重复） |
| `co` | 添加 `Access-Control-Allow-Origin: *` (CORS) |
| `x:https` | 强制 HTTPS — HTTP 到 HTTPS 的自动重定向 |
| `a:Name:Value` | 添加请求头 |
| `u:Name:Value` | 更新请求头 |
| `r:Name` | 移除请求头 |
| `qr` | 将 URL 以二维码形式打印到标准输出（对移动端分享很有用） |

自由组合使用：`"b:admin:secret+co+x:https+free@a.pinggy.io"`。

## Web Debugger（可选）

Pinggy 可以将入站流量镜像到 `localhost:4300` 进行检查。向 SSH 命令添加一个本地转发：

```bash
ssh -p 443 -L4300:localhost:4300 -R0:localhost:8000 free@a.pinggy.io
```

然后打开浏览器中的 `http://localhost:4300`，即可查看实时的请求/响应对。

## 陷阱（Pitfalls）

- **免费套餐的 60 分钟硬限制。** SSH 会话将在 60 分钟时终止；URL 将失效。对于更长的分享，请使用 `PINGGY_TOKEN`（专业版）或使用 Shell 循环自动重启（请注意，免费套餐每次重启 URL 都会改变）。
- **免费套餐的 URL 是随机的，并且在重启后会改变。** 不要收藏它，不要将其粘贴到配置文件中。每次都从日志重新解析。
- **并发免费隧道限制为每个源 IP 一个。** 从同一台机器启动第二个隧道通常会杀死第一个。专业版可以解除此限制。
- **用户名中的 `+` 必须被引用。** 裸的 `ssh ... b:admin:secret+free@a.pinggy.io` 在 bash 中有效，但在处理 `+` 的 shell 或在程序化组装时会出错。始终用双引号包裹。
- **不要在没有访问控制标志的情况下隧道传输任何敏感数据。** 裸的 HTTP 隧道任何人只要有 URL 就可以访问。对于非公共服务，请使用 `b:`、`k:` 或 `w:`。
- **`process(action='log')` 可能会错过 SSH 横幅输出。** Pinggy 会打印 URL，然后 SSH 会话进入交互模式。始终重定向到日志文件并直接 `grep` 该文件——与 `cloudflared-quick-tunnel` 相同的模式。
- **首次运行时的主机密钥提示。**默认的 OpenSSH 配置会要求用户接受 Pinggy 的主机密钥。对于无人值守（unattended）运行，请始终传递 `-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`。
- **TCP 和 TLS 隧道返回 `<subdomain>.a.pinggy.online:<port>` 对，而不是 HTTPS URL。** 需要使用不同的正则表达式（`tcp://` 和端口）进行解析。不要假设所有 Pinggy 隧道都是 HTTP。
- **专业模式需要令牌作为用户名，而不仅仅是一个标志。** 使用 `"$PINGGY_TOKEN+a.pinggy.io"`（不要加 `free@`）。有了令牌，您还可以添加 `:persistent` 以获得稳定的子域名——请参阅 `pinggy.io/docs/`。

## 菜谱 (Recipes)

将本地源与 Pinggy 隧道结合的复合模式。每个菜谱都是自包含的——启动源，启动隧道，解析 URL，将其返回给用户。

### 菜谱 1 — 接收 webhook 回调

当外部服务（Stripe、GitHub、Discord、AgentMail 等）需要在本地任务期间向可公开访问的 URL 发送 POST 请求时使用此菜谱。

```bash
# 1. 微型捕获服务器：每个请求都会被追加到 /tmp/webhook-hits.log
cat >/tmp/webhook-server.py <<'PY'
import http.server, json, datetime, pathlib
LOG = pathlib.Path("/tmp/webhook-hits.log")
class H(http.server.BaseHTTPRequestHandler):
    def _capture(self):
        n = int(self.headers.get("content-length") or 0)
        body = self.rfile.read(n).decode("utf-8", "replace") if n else ""
        rec = {"t": datetime.datetime.utcnow().isoformat(), "path": self.path,
               "method": self.command, "headers": dict(self.headers), "body": body}
        with LOG.open("a") as f: f.write(json.dumps(rec) + "\n")
        self.send_response(200); self.send_header("content-type","application/json")
        self.end_headers(); self.wfile.write(b'{"ok":true}\n')
    def do_GET(self): self._capture()
    def do_POST(self): self._capture()
    def log_message(self,*a,**k): pass
http.server.HTTPServer(("127.0.0.1", 18080), H).serve_forever()
PY
nohup python3 /tmp/webhook-server.py >/tmp/webhook-server.log 2>&1 &
echo $! >/tmp/webhook-server.pid

# 2. 隧道 — 使用 bearer-token 网关，以防止随机用户污染捕获日志
nohup ssh -p 443 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o ServerAliveInterval=30 \
    -R0:localhost:18080 "k:$(openssl rand -hex 12)+free@a.pinggy.io" \
    >/tmp/webhook-pinggy.log 2>&1 &
echo $! >/tmp/webhook-pinggy.pid
sleep 5
URL=$(grep -oE 'https://[a-z0-9-]+\.[a-z]+\.pinggy\.link' /tmp/webhook-pinggy.log | head -1)
echo "Webhook URL: $URL"

# 3. 在智能体工作期间，观察请求是否到达
tail -f /tmp/webhook-hits.log
```

将 `$URL` 提供给需要调用您的服务。清理：`kill $(cat /tmp/webhook-server.pid) $(cat /tmp/webhook-pinggy.pid)`。

### 菜谱 2 — 通过 HTTP/SSE 暴露 MCP 服务器

当远程 MCP 客户端（另一台机器上的 Claude Desktop、队友的编辑器等）需要访问本地机器上运行的 MCP 服务器时使用此菜谱。仅适用于支持 HTTP 传输的 MCP 服务器——不支持 stdio 模式的服务器。

```bash
# 1. 以 HTTP 模式启动 MCP 服务器（示例：端口 8765 的 FastMCP 服务器）
nohup python3 my_mcp_server.py --transport http --port 8765 \
    >/tmp/mcp-server.log 2>&1 &
echo $! >/tmp/mcp-server.pid

# 2. 使用 bearer token 进行隧道——MCP 流量不应该对互联网开放
TOKEN=$(openssl rand -hex 16)
nohup ssh -p 443 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o ServerAliveInterval=30 \
    -R0:localhost:8765 "k:$TOKEN+free@a.pinggy.io" \
    >/tmp/mcp-pinggy.log 2>&1 &
echo $! >/tmp/mcp-pinggy.pid
sleep 5
URL=$(grep -oE 'https://[a-z0-9-]+\.[a-z]+\.pinggy\.link' /tmp/mcp-pinggy.log | head -1)
echo "MCP URL: $URL"
echo "Bearer token: $TOKEN"
```

远程客户端使用 `Authorization: Bearer $TOKEN` 连接到 `$URL`。Hermes 自身的原生 MCP 客户端配置：`{"transport": "http", "url": "<URL>", "headers": {"Authorization": "Bearer <TOKEN>"}}`。

### 菜谱 3 — 暴露本地 LLM 端点（Ollama / vLLM / llama.cpp）

将本地模型与远程调用者（另一个智能体、手机、队友）分享。Ollama 监听 `:11434`，vLLM 和 llama.cpp 通常监听 `:8000`。

```bash
# 前提条件：模型服务器已在 127.0.0.1:11434 上运行（Ollama 默认）
TOKEN=$(openssl rand -hex 16)
nohup ssh -p 443 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o ServerAliveInterval=30 \
    -R0:localhost:11434 "k:$TOKEN+co+free@a.pinggy.io" \
    >/tmp/llm-pinggy.log 2>&1 &
echo $! >/tmp/llm-pinggy.pid
sleep 5
URL=$(grep -oE 'https://[a-z0-9-]+\.[a-z]+\.pinggy\.link' /tmp/llm-pinggy.log | head -1)
echo "Endpoint: $URL"
echo "Token:    $TOKEN"

# 验证
curl -s "$URL/api/tags" -H "Authorization: Bearer $TOKEN" | head
```

`co` 启用了 CORS，因此浏览器调用者可以访问该端点。对于仅后端使用的调用者，请去掉 `co`。对于 OpenAI 兼容的 vLLM/llama.cpp 端点，调用者使用基础 URL `$URL/v1` 并带上 `Authorization: Bearer $TOKEN`——但请注意，Pinggy 会剥离/替换请求体中的内容，因此模型服务器本身会看到 Pinggy 的令牌；本地服务器应配置为忽略身份验证（它已经在 `127.0.0.1` 上）并让 Pinggy 进行网关控制。

### 菜谱 4 — 使用一次性密码分享开发服务器

这是“让队友试用我正在运行的应用程序”的最快模式。随机密码，打印一次，在你按 Ctrl-C 时终止。

```bash
PASS=$(openssl rand -base64 12 | tr -d '+/=' | head -c 12)
echo "Dev server password: $PASS"
ssh -p 443 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o ServerAliveInterval=30 \
    -R0:localhost:3000 "b:dev:$PASS+co+x:https+free@a.pinggy.io"
# URL 会打印到终端。分享 URL + 密码。按 Ctrl-C 进行清理。
```

`b:dev:$PASS` 使用 HTTP 基本身份验证网关来保护 URL。`x:https` 强制 TLS。`co` 为 SPA 前端添加 CORS。

## 验证

```bash
# 端到端测试：启动一个简单的源站，隧道化它，访问它，然后关闭
python3 -m http.server 18000 --bind 127.0.0.1 >/tmp/origin.log 2>&1 &
ORIGIN_PID=$!

nohup ssh -p 443 \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -R0:localhost:18000 free@a.pinggy.io >/tmp/pinggy-verify.log 2>&1 &
SSH_PID=$!

sleep 5
URL=$(grep -oE 'https://[a-z0-9-]+\.[a-z]+\.pinggy\.link' /tmp/pinggy-verify.log | head -1)
echo "URL: $URL"
curl -sI "$URL/" | head -1

kill "$SSH_PID" "$ORIGIN_PID"
```

预期结果：一个 `pinggy.link` URL 和 curl 头信息中的 `HTTP/2 200`。