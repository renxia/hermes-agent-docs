---
title: "Pinggy 隧道 — 通过 Pinggy 提供零安装的 SSH 本地隧道"
sidebar_label: "Pinggy 隧道"
description: "通过 Pinggy 提供零安装的 SSH 本地隧道"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Pinggy 隧道

通过 Pinggy 提供零安装的 SSH 本地隧道。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/devops/pinggy-tunnel` 安装 |
| 路径 | `optional-skills/devops/pinggy-tunnel` |
| 版本 | `0.1.0` |
| 作者 | Teknium (teknium1)，Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Pinggy`，`隧道`，`网络`，`SSH`，`Webhook`，`本地主机` |
| 相关技能 | `cloudflared-quick-tunnel`，[`webhook-subscriptions`](/user-guide/skills/bundled/devops/devops-webhook-subscriptions) |

:::info
以下是Hermes在此技能触发时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Pinggy 隧道技能

使用Pinggy SSH反向隧道将本地服务（开发服务器、Webhook接收器、MCP端点、演示环境）暴露到公共互联网。无需安装守护进程——用户本机的SSH客户端连接到 `a.pinggy.io:443`，Pinggy会返回一个公网可访问的HTTP/HTTPS URL。

免费版：60分钟隧道，随机子域名，无需注册。专业版（3美元/月）是可选的，需要一个令牌。

## 何时使用

- 用户要求“暴露本地服务”、“分享我的开发服务器”、“将此URL公开”、“将端口N做隧道”、“为webhook获取公网URL”
- 在本地任务期间需要接收webhook回调（如Stripe、GitHub、Discord、AgentMail）
- 与远程方共享一次性的HTTP演示（MCP服务器、Ollama/vLLM端点、仪表盘）
- 主机已有SSH但没有`cloudflared` / `ngrok`二进制文件，且安装它们过于繁琐

如果主机已配置`cloudflared`，请优先使用`cloudflared-quick-tunnel`技能——Cloudflare快速隧道不会在60分钟后过期。

## 前提条件

- `ssh` 在PATH中（`ssh -V`）。Linux、macOS和Windows 10+系统默认已安装。无需其他安装。
- 在隧道启动前，本地服务需监听在`127.0.0.1:<port>`上。Pinggy会返回URL，但在本地源服务启动前访问将返回502错误。

可选：

- 设置`PINGGY_TOKEN`环境变量以使用付费专业版功能（持久子域名、自定义域名、多个隧道、无60分钟限制）。免费版无需任何凭据。

## 快速参考

```bash
# 为端口8000建立普通HTTP/HTTPS隧道（免费版）
ssh -p 443 -o StrictHostKeyChecking=no -o ServerAliveInterval=30 \
    -R0:localhost:8000 free@a.pinggy.io

# TCP隧道（数据库、原始SSH等）
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:5432 tcp@a.pinggy.io

# TLS隧道（Pinggy无法解密——需在源端自备证书）
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:443 tls@a.pinggy.io

# 基本身份验证网关（b:用户名:密码）
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:8000 \
    "b:admin:secret+free@a.pinggy.io"

# 无记名令牌网关（k:令牌）
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:8000 \
    "k:mysecrettoken+free@a.pinggy.io"

# IP白名单（w:CIDR）
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:8000 \
    "w:203.0.113.0/24+free@a.pinggy.io"

# 启用CORS并强制HTTPS重定向
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:8000 \
    "co+x:https+free@a.pinggy.io"

# 专业版（持久URL，无60分钟限制）
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:8000 "$PINGGY_TOKEN+a.pinggy.io"
```

## 操作流程 —— 启动隧道并获取URL

模型应使用`terminal`工具。隧道需在共享期间保持存活，因此应作为后台进程运行，并从标准输出解析公网URL。

### 1. 确认本地源服务已就绪

```bash
curl -sI http://127.0.0.1:8000/ | head -1
# 期望返回 HTTP/1.x 200 或任何非连接被拒绝的响应
```

如果尚未有服务监听，请先启动（例如 `python3 -m http.server 8000 --bind 127.0.0.1`）。Pinggy会正常返回URL，但目标无服务时用户将看到502错误。

### 2. 以后台进程方式启动隧道

使用 `terminal(background=True)` 并将输出捕获到日志文件（Pinggy会在标准输出打印URL，然后保持连接）：

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

`StrictHostKeyChecking=no` + `UserKnownHostsFile=/dev/null` 可跳过首次运行时的主机密钥确认提示。`ServerAliveInterval=30` 可防止空闲的NAT断开SSH会话。

### 3. 从日志中解析URL

```bash
sleep 4
grep -oE 'https://[a-z0-9-]+\.[a-z]+\.pinggy\.link' /tmp/pinggy-8000.log | head -1
```

预期输出如下所示：

```
You are not authenticated.
Your tunnel will expire in 60 minutes.
http://yqycl-98-162-69-48.a.free.pinggy.link
https://yqycl-98-162-69-48.a.free.pinggy.link
```

将 `https://...pinggy.link` URL提供给用户。

### 4. 验证

```bash
curl -sI https://<the-url>/ | head -3
# 期望返回 200/302 或本地源服务实际返回的任何内容
```

如果得到 `502 Bad Gateway`，说明SSH会话已建立但本地源服务未监听——请先修复步骤1。

### 5. 清理

```bash
kill "$(cat /tmp/pinggy-8000.pid)"
# 或者，如果pid文件丢失：
pkill -f 'ssh -p 443 .* free@a\.pinggy\.io'
```

如果您从 `terminal(background=True)` 获得了 `session_id`，请优先使用 `process(action='kill', session_id=...)`。

## 通过用户名关键字进行访问控制

Pinggy将控制标志用 `+` 分隔后堆叠到SSH用户名中。当用户名包含 `+` 时，请务必用引号将整个 `user@host` 参数括起来：

| 关键字 | 效果 |
|---------|--------|
| `b:user:pass` | HTTP基本身份验证网关 |
| `k:token` | 无记名令牌头网关（`Authorization: Bearer <token>`） |
| `w:CIDR` | IP白名单（单个IP或CIDR，可重复使用） |
| `co` | 添加 `Access-Control-Allow-Origin: *`（CORS） |
| `x:https` | 强制HTTPS——将HTTP自动重定向到HTTPS |
| `a:Name:Value` | 添加请求头 |
| `u:Name:Value` | 更新请求头 |
| `r:Name` | 移除请求头 |
| `qr` | 将URL的二维码打印到标准输出（便于移动端共享） |

可自由组合：`"b:admin:secret+co+x:https+free@a.pinggy.io"`。

## 网络调试器（可选）

Pinggy可以将入站流量镜像到 `localhost:4300` 以供检查。在SSH命令中添加一个本地转发：

```bash
ssh -p 443 -L4300:localhost:4300 -R0:localhost:8000 free@a.pinggy.io
```

然后在浏览器中打开 `http://localhost:4300` 即可查看实时的请求/响应对。

## 注意事项

- **免费版有60分钟的硬性时间限制。** SSH会话将在60分钟时终止，URL随即失效。对于更长时间的共享，请使用 `PINGGY_TOKEN`（专业版）或通过shell循环实现自动重启（注意免费版每次重启URL都会变化）。
- **免费版URL是随机的，且重启后会变化。** 不要将其收藏或粘贴到配置文件中。每次都需要从日志中重新解析。
- **同一源IP的免费并发隧道数限制为一个。** 从同一台机器启动第二个隧道通常会导致第一个中断。专业版无此限制。
- **用户名中的 `+` 必须用引号括起来。** 裸命令 `ssh ... b:admin:secret+free@a.pinggy.io` 在bash中可用，但在将 `+` 视为特殊字符的shell中或程序化组装时会出错。请始终用双引号括起来。
- **不带访问控制标志的隧道不要传输敏感信息。** 裸HTTP隧道对任何知道URL的人都是可达的。对于非公开服务，请使用 `b:`、`k:` 或 `w:` 进行控制。
- **`process(action='log')` 可能遗漏SSH横幅输出。** Pinggy会打印URL，然后SSH会话进入交互模式。请始终重定向到日志文件并直接 `grep` 文件内容——这与 `cloudflared-quick-tunnel` 的模式相同。
- **首次运行时的主机密钥提示。** 默认的OpenSSH配置会要求用户接受Pinggy的主机密钥。对于无人值守的运行，请始终传递 `-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`。
- **TCP和TLS隧道返回的是 `<子域名>.a.pinggy.online:<端口>` 对，而非HTTPS URL。** 需使用不同的正则表达式解析（`tcp://` 和端口号）。不要假设每个Pinggy隧道都是HTTP协议。
- **专业模式需要将令牌作为用户名，而非标志。** 使用 `"$PINGGY_TOKEN+a.pinggy.io"`（不包含 `free@`）。使用令牌时，还可以添加 `:persistent` 以获得稳定的子域名——详见 `pinggy.io/docs/`。

## 方案示例

结合本地源服务和Pinggy隧道的复合模式。每个示例都是自包含的——启动源服务，启动隧道，解析URL，将其交给用户。

### 方案 1 —— 接收webhook回调

当外部服务（如Stripe、GitHub、Discord、AgentMail等）在本地任务期间需要POST到公网可达的URL时使用此方案。

```bash
# 1. 简易的捕获服务器：每个请求都会追加到 /tmp/webhook-hits.log
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

# 2. 隧道——使用无记名令牌网关，防止随机用户污染捕获日志
nohup ssh -p 443 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o ServerAliveInterval=30 \
    -R0:localhost:18080 "k:$(openssl rand -hex 12)+free@a.pinggy.io" \
    >/tmp/webhook-pinggy.log 2>&1 &
echo $! >/tmp/webhook-pinggy.pid
sleep 5
URL=$(grep -oE 'https://[a-z0-9-]+\.[a-z]+\.pinggy\.link' /tmp/webhook-pinggy.log | head -1)
echo "Webhook URL: $URL"

# 3. 在智能体工作期间，监视请求日志
tail -f /tmp/webhook-hits.log
```

将 `$URL` 提供给需要调用您的服务。清理命令：`kill $(cat /tmp/webhook-server.pid) $(cat /tmp/webhook-pinggy.pid)`。

### 方案 2 —— 通过HTTP/SSE暴露MCP服务器

当远程MCP客户端（另一台机器上的Claude Desktop、队友的编辑器等）需要访问运行在本地的MCP服务器时使用。仅适用于使用HTTP传输的MCP服务器——stdio模式的服务器无法通过隧道暴露。

```bash
# 1. 以HTTP模式启动MCP服务器（示例：FastMCP服务器运行在端口8765）
nohup python3 my_mcp_server.py --transport http --port 8765 \
    >/tmp/mcp-server.log 2>&1 &
echo $! >/tmp/mcp-server.pid

# 2. 使用无记名令牌的隧道——MCP流量不应直接暴露到公网
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

远程客户端使用 `Authorization: Bearer $TOKEN` 连接到 `$URL`。Hermes自身的原生MCP客户端配置：`{"transport": "http", "url": "<URL>", "headers": {"Authorization": "Bearer <TOKEN>"}}`。

### 方案 3 —— 暴露本地LLM端点（Ollama / vLLM / llama.cpp）

将本地模型分享给远程调用者（另一个智能体、手机、队友）。Ollama默认监听 `:11434`，vLLM和llama.cpp通常监听 `:8000`。

```bash
# 前提：模型服务器已在 127.0.0.1:11434 上运行（Ollama默认）
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

`co` 启用CORS，以便浏览器客户端可以访问该端点。对于纯后端调用者，可去掉 `co`。对于兼容OpenAI的vLLM/llama.cpp端点，调用者使用基础URL `$URL/v1` 并携带 `Authorization: Bearer $TOKEN`——但请注意，Pinggy不会剥离或替换请求体中的任何内容，因此模型服务器本身会看到Pinggy的令牌；本地服务器应配置为忽略认证（它已在 `127.0.0.1` 上）并让Pinggy进行访问控制。

### 方案 4 —— 使用一次性密码共享开发服务器

这是最快速的“让队友操作我正在运行的应用”的模式。生成随机密码，打印一次，按Ctrl-C即终止。

```bash
PASS=$(openssl rand -base64 12 | tr -d '+/=' | head -c 12)
echo "Dev server password: $PASS"
ssh -p 443 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o ServerAliveInterval=30 \
    -R0:localhost:3000 "b:dev:$PASS+co+x:https+free@a.pinggy.io"
# URL会打印到终端。分享URL和密码。按Ctrl-C即可清理。
```

`b:dev:$PASS` 使用HTTP基本身份验证保护URL。`x:https` 强制使用TLS。`co` 为SPA前端添加CORS支持。

## 验证

```bash
# 端到端测试：启动一个简易原始服务器，建立隧道，访问测试，最后清理资源
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

预期结果：获得一个 `pinggy.link` URL，并且 curl 的头部响应为 `HTTP/2 200`。