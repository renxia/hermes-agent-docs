---
title: Rest Graphql Debug — 调试 REST/GraphQL API：状态码、认证、模式、重现
sidebar_label: Rest Graphql Debug
description: 调试 REST/GraphQL API：状态码、认证、模式、重现
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Rest Graphql Debug

调试 REST/GraphQL API：状态码、认证、模式、重现。

## 技能元数据

| | |
|---|---|
| 源 | 可选 — 使用 `hermes skills install official/software-development/rest-graphql-debug` 安装 |
| 路径 | `optional-skills/software-development/rest-graphql-debug` |
| 版本 | `1.2.0` |
| 作者 | eren-karakus0 |
| 许可证 | MIT |
| 标签 | `api`, `rest`, `graphql`, `http`, `调试`, `测试`, `curl`, `集成` |
| 相关技能 | [`systematic-debugging`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging), [`test-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development) |

## 关键路径与配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥和秘密信息（如果设置了 $HERMES_HOME）
$HERMES_HOME
```

# API 测试与调试

通过 Hermes 工具驱动 REST 和 GraphQL 的诊断——使用 `terminal` 进行 `curl` 操作，使用 `execute_code` 进行 Python `requests` 操作，使用 `web_extract` 进行供应商文档操作。在猜测修复方案之前，先隔离失败的层级。

## 何时使用

- API 返回了意外的状态码或响应体
- 身份验证失败（刷新令牌、OAuth、API 密钥后的 401/403）
- 在 Postman 中正常但代码中失败
- Webhook / 回调集成调试
- 构建或审查 API 集成测试
- 速率限制或分页问题

跳过 UI 渲染、数据库查询优化或 DNS/防火墙基础设施（应升级）。

## 核心原则

**隔离层级，然后修复。** 200 OK 可能掩盖了错误的数据。500 可以掩盖一个字符的身份验证拼写错误。按顺序遍历整个调用链；绝不要跳过任何一步。

```
1. 连接性 (Connectivity)   → 我们能否到达主机？
1.5 超时 (Timeouts)      → 连接慢 vs 读取慢？
2. TLS/SSL        → 证书是否有效且受信任？
3. 身份验证 (Auth)           → 凭证是否正确且未过期？
4. 请求格式 (Request format) → 有载荷体形状符合服务器期望吗？
5. 响应解析 (Response parse) → 我们的代码是否接受了返回的内容？
6. 语义 (Semantics)      → 数据是否意味着我们所假设的？
```

## 五分钟快速入门

### 通过终端使用 REST

```python
# 详细请求/响应交换
terminal('curl -v https://api.example.com/users/1')

# 带 JSON 的 POST 请求
terminal("""curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"name":"test","email":"test@example.com"}'""")

# 仅获取头部信息
terminal('curl -sI https://api.example.com/health')

# 美观打印 JSON
terminal('curl -s https://api.example.com/users | python3 -m json.tool')
```

### 通过终端使用 GraphQL

```python
terminal("""curl -X POST https://api.example.com/graphql \\
  -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"query":"{ user(id: 1) { name email } }"}'""")
```

**GraphQL 的陷阱：** 服务器即使查询失败，也经常返回 HTTP 200。无论状态码如何，都必须检查 `errors` 字段：

```python
execute_code('''
import os, requests
resp = requests.post(
    "https://api.example.com/graphql",
    json={"query": "{ user(id: 1) { name email } }"},
    headers={"Authorization": f"Bearer {os.environ['TOKEN']}"},
    timeout=10,
)
data = resp.json()
if data.get("errors"):
    for err in data["errors"]:
        print(f"GraphQL 错误: {err['message']} (路径: {err.get('path')})")
print(data.get("data"))
''')
```

### 通过 execute_code 使用 Python (requests)

```python
execute_code('''
import requests
resp = requests.get(
    "https://api.example.com/users/1",
    headers={"Authorization": "Bearer <TOKEN>"},
    timeout=(3.05, 30),  # (连接, 读取)
)
print(resp.status_code, dict(resp.headers))
print(resp.text[:500])
''')
```

## 分层调试流程

### 第 1 步 — 连接性

```python
terminal('nslookup api.example.com')
terminal('curl -v --connect-timeout 5 https://api.example.com/health')
```

失败原因：DNS 未解析、防火墙、需要 VPN、缺少代理。

### 第 1.5 步 — 超时

区分“无法到达”和“已到达但缓慢”：

```python
terminal('''curl -w "dns:%{time_namelookup}s connect:%{time_connect}s tls:%{time_appconnect}s ttfb:%{time_starttransfer}s total:%{time_total}s\\n" \\
  -o /dev/null -s https://api.example.com/endpoint''')
```

在 Python 中，始终传递一个元组（tuple）作为超时设置——`requests` 没有默认值，会无限期挂起：

```python
execute_code('''
import requests
from requests.exceptions import ConnectTimeout, ReadTimeout
try:
    requests.get(url, timeout=(3.05, 30))
except ConnectTimeout:
    print("无法到达主机 — DNS、防火墙、VPN")
except ReadTimeout:
    print("已连接但服务器运行缓慢")
''')
```

诊断：`time_connect` 高表明是网络/防火墙问题；`time_starttransfer` 高而 `time_connect` 低则表明服务器运行缓慢。

### 第 2 步 — TLS/SSL

```python
terminal('curl -vI https://api.example.com 2>&1 | grep -E "SSL|subject|expire|issuer"')
```

失败原因：证书过期、自签名、主机名不匹配、缺少 CA Bundle。仅在临时调试中使用 `-k`，绝不要用于代码中。

### 第 3 步 — 身份验证 (Authentication)

```python
# 令牌有效性检查
terminal('curl -s -o /dev/null -w "%{http_code}\\n" -H "Authorization: Bearer $TOKEN" https://api.example.com/me')

# 解码 JWT 的 exp 声明 — 正确处理 base64url padding
execute_code('''
import json, base64, os
tok = os.environ["TOKEN"]
payload = tok.split(".")[1]
payload += "=" * (-len(payload) % 4)
print(json.dumps(json.loads(base64.urlsafe_b64decode(payload)), indent=2))
''')
```

检查清单：
- 令牌是否过期？（JWT 中的 `exp` 声明）
- 身份验证方案是否正确？（Bearer vs Basic vs Token vs `X-Api-Key`）
- 环境是否正确？（生产环境上的测试密钥是一个经典错误）
- API 密钥是在头部还是查询参数中？（`?api_key=…`）

### 第 4 步 — 请求格式 (Request Format)

```python
terminal("""curl -v -X POST https://api.example.com/endpoint \\
  -H 'Content-Type: application/json' \\
  -d '{"key":"value"}' 2>&1""")
```

**Content-Type / 有载荷体不匹配 — 静默的 415/400：**

```python
# 错误 — data= 发送 form-encoded，但头部信息是 JSON
requests.post(url, data='{"k":"v"}', headers={"Content-Type": "application/json"})

# 正确 — json= 会自动设置头部并序列化
requests.post(url, json={"k": "v"})

# 错误 — Accept 指定 XML，但代码调用 .json()
requests.get(url, headers={"Accept": "text/xml"})

# 正确 — 让 requests 构建带边界的 multipart
requests.post(url, files={"file": open("doc.pdf", "rb")})
```

常见问题：form-encoded 与 JSON 的混淆、缺少必需字段、错误的 HTTP 方法、未编码的查询参数。

### 第 5 步 — 响应解析 (Response Parsing)

在调用 `.json()` 之前，务必检查内容类型（content-type）：

```python
execute_code('''
import requests
resp = requests.post(url, json=payload, timeout=10)
print(f"status={resp.status_code}")
print(f"headers={dict(resp.headers)}")
ct = resp.headers.get("Content-Type", "")
if "application/json" in ct:
    print(resp.json())
else:
    print(f"意外的内容类型 {ct!r}，响应体={resp.text[:500]!r}")
''')
```

失败原因：期望 JSON 但收到 HTML 错误页面、响应体为空、字符集（charset）错误。

### 第 6 步 — 语义验证 (Semantic Validation)

解析成功了——但数据是否*正确*？

- `"status": "active"` 是否意味着你的代码所认为的含义？
- 响应中的 ID 是否与请求的 ID 相符？
- 时间戳是否在预期的时区内？
- 分页是否返回了所有结果，而不仅仅是第 1 页？

## HTTP 状态码操作手册 (HTTP Status Playbook)

### 401 未授权 (Unauthorized) — 凭证缺失或无效

1. `Authorization` 头部信息是否存在？（使用 `curl -v` 确认）
2. 令牌是否正确且未过期？
3. 身份验证方案是否正确？（Bearer vs Basic vs Token）
4. 有些 API 使用查询参数（`?api_key=…`）而不是头部。

### 403 禁止访问 (Forbidden) — 已认证但无权限

1. 令牌是否具有所需的范围/权限？
2. 资源是否属于另一个账户？
3. IP 白名单是否阻止了你？
4. CORS 是否存在？（检查 `Access-Control-Allow-Origin`）

### 404 未找到 (Not Found) — 资源不存在或 URL 错误

1. 路径是否正确？（尾部斜杠、拼写错误、版本前缀）
2. 资源 ID 是否存在？
3. API 版本是否正确？（`/v1/` vs `/v2/`）
4. 基础 URL 是否正确？（Staging vs Prod）

### 409 冲突 (Conflict) — 状态碰撞

1. 资源是否已存在（重复创建）？
2. `ETag` / `If-Match` 过时？
3. 是否有其他进程并发修改？

### 422 不可处理的实体 (Unprocessable Entity) — JSON 有效，数据无效

错误体通常会指出不良字段。检查：
- 字段类型（字符串 vs 整数、日期格式）
- 必需字段 vs 可选字段
- 允许集内的枚举值

### 429 请求过多 (Too Many Requests) — 速率限制

检查 `Retry-After` 和 `X-RateLimit-*` 头部。指数退避：

```python
execute_code('''
import time, requests

def with_backoff(method, url, **kwargs):
    for attempt in range(5):
        resp = requests.request(method, url, **kwargs)
        if resp.status_code != 429:
            return resp
        wait = int(resp.headers.get("Retry-After", 2 ** attempt))
        time.sleep(wait)
    return resp
''')
```

### 5xx — 服务器端，通常不是你的错

- **500** — 服务器错误。捕获关联 ID，并与提供商一起提交报告。
- **502** — 上游服务宕机。退避 + 重试。
- **503** — 超载/维护中。检查状态页面。
- **504** — 上游超时。减少有载荷体或提高超时时间。

对于所有 5xx：进行抖动（jitter）退避，并设置警报机制。

## 分页和幂等性 (Pagination & Idempotency)

**分页。** 验证你是否获取了*所有*结果。查找 `next_cursor`、`next_page`、`total_count`。有两种模式：
- Offset（偏移量）（`?limit=100&offset=200`）— 简单，如果数据发生变化可能会跳过某些项。
- Cursor（游标）（`?cursor=abc123`）— 对于实时或大型数据集更推荐。

**幂等性。** 对于非幂等的操作（POST），发送 `Idempotency-Key: <uuid>`，以防止重试导致重复收费/重复创建。对于支付和订单是强制性的。

## 合同契约验证 (Contract Validation)

在它到达生产环境之前捕获模式漂移：

```python
execute_code('''
import requests

def validate_user(data: dict) -> list[str]:
    errors = []
    required = {"id": int, "email": str, "created_at": str}
    for field, expected in required.items():
        if field not in data:
            errors.append(f"缺少字段: {field}")
        elif not isinstance(data[field], expected):
            errors.append(f"{field}: 期望 {expected.__name__}，实际是 {type(data[field]).__name__}")
    return errors

resp = requests.get(f"{BASE}/users/1", headers=HEADERS, timeout=10)
issues = validate_user(resp.json())
if issues:
    print(f"合同违规：{issues}")
''')
```

在 API 升级后、集成新的第三方服务时，或在 CI smoke tests 中运行。

## 关联 ID (Correlation IDs)

始终捕获提供商的请求 ID — 这是最快到达供应商支持的途径：

```python
execute_code('''
import requests
resp = requests.post(url, json=payload, headers=headers, timeout=10)
request_id = (
    resp.headers.get("X-Request-Id")
    or resp.headers.get("X-Trace-Id")
    or resp.headers.get("CF-Ray")  # Cloudflare
)
if resp.status_code >= 400:
    print(f"失败状态={resp.status_code}，请求ID={request_id}，时间戳={resp.headers.get('Date')}")
''')
```

**供应商错误报告模板：**

```
Endpoint:    POST /api/v1/orders
Request ID:  req_abc123xyz
Timestamp:   2026-03-17T14:30:00Z
Status:      500
Expected:    201 附带订单对象
Actual:      500 {"error":"internal server error"}
Repro:       curl -X POST … (auth: <REDACTED>)
```

## 回归测试模板 (Regression Test Template)

将其放入 `tests/` 并通过 `terminal('pytest tests/test_api_smoke.py -v')` 运行：

```python
import os, requests, pytest

BASE_URL = os.environ.get("API_BASE_URL", "https://api.example.com")
TOKEN    = os.environ.get("API_TOKEN", "")
HEADERS  = {"Authorization": f"Bearer {TOKEN}"}

class TestAPISmoke:
    def test_health(self):
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        assert resp.status_code == 200

    def test_list_users_returns_array(self):
        resp = requests.get(f"{BASE_URL}/users", headers=HEADERS, timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data.get("data", data), list)

    def test_get_user_required_fields(self):
        resp = requests.get(f"{BASE_URL}/users/1", headers=HEADERS, timeout=10)
        assert resp.status_code in (200, 404)
        if resp.status_code == 200:
            user = resp.json()
            assert "id" in user and "email" in user

    def test_invalid_auth_returns_401(self):
        resp = requests.get(
            f"{BASE_URL}/users",
            headers={"Authorization": "Bearer invalid-token"},
            timeout=10,
        )
        assert resp.status_code == 401
```

## 安全性

### Token 处理
- 绝不记录完整的 tokens。应替换为：`Bearer <REDACTED>`。
- 绝不在脚本中硬编码 tokens。应从环境变量（`os.environ["API_TOKEN"]`）或 `${HERMES_HOME:-~/.hermes}/.env` 读取。
- 如果 token 出现在日志、错误消息或 Git 历史记录中，请立即轮换。

### 安全日志记录

```python
def redact_auth(headers: dict) -> dict:
    sensitive = {"authorization", "x-api-key", "cookie", "set-cookie"}
    return {k: ("<REDACTED>" if k.lower() in sensitive else v) for k, v in headers.items()}
```

### 泄露检查清单
- [ ] **URL 中的凭证。** API 密钥会出现在查询字符串中，最终被服务器日志、浏览器历史记录和引用者头（referrer headers）捕获——请使用请求头（headers）。
- [ ] **错误响应中的 PII (个人身份信息)。** `404 on /users/123` 不应该泄露用户是否存在（枚举）。
- [ ] **生产环境中的堆栈跟踪。** 500 错误不应该泄露文件路径或框架版本。
- [ ] **内部主机名/IP。** 错误体中包含 `10.x.x.x` 或 `internal-api.corp.local` 等信息。
- [ ] **回显的 tokens。** 有些 API 会在错误详情中包含身份验证 token。请核实它们是否如此。
- [ ] **冗余的 `Server` / `X-Powered-By`。** 这些会泄露堆栈信息。供安全审查参考。

## Hermes 工具模式

### terminal — 用于 curl, dig, openssl

```python
terminal('curl -sI https://api.example.com')
terminal('openssl s_client -connect api.example.com:443 -servername api.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates')
```

### execute_code — 用于多步骤 Python 工作流

当调试涉及身份验证 → 获取数据 → 分页 → 验证的流程时，请使用 `execute_code`。变量会保留在脚本中，结果将打印到标准输出（stdout），您的上下文不会有 token 垃圾信息泄露的风险：

```python
execute_code('''
import os, requests

token = os.environ["API_TOKEN"]
base  = "https://api.example.com"
H     = {"Authorization": f"Bearer {token}"}

# 1. auth (身份验证)
me = requests.get(f"{base}/me", headers=H, timeout=10)
print(f"auth {me.status_code}")

# 2. paginate (分页)
all_users, cursor = [], None
while True:
    params = {"cursor": cursor} if cursor else {}
    r = requests.get(f"{base}/users", headers=H, params=params, timeout=10)
    body = r.json()
    all_users.extend(body["data"])
    cursor = body.get("next_cursor")
    if not cursor:
        break
print(f"users={len(all_users)}")
''')
```

### web_extract — 用于供应商 API 文档

与其猜测，不如拉取您正在调试的端点（endpoint）规范：

```python
web_extract(urls=["https://docs.example.com/api/v1/users"])
```

### delegate_task — 用于完整的 CRUD 测试扫描

```python
delegate_task(
    goal="测试 /api/v1/users 的所有 CRUD 端点",
    context="""
遵循 rest-graphql-debug 技能（optional-skills/software-development/rest-graphql-debug）。
基础 URL: https://api.example.com
认证：来自 API_TOKEN 环境变量的 Bearer token。

对于每个动词（POST, GET, PATCH, DELETE）：
  - 正常路径 (happy path)：断言状态码 + 响应模式
  - 错误情况：400, 404, 422
  - 对任何失败情况记录一个可重现的 curl 命令（请替换掉 tokens）

输出：每个端点的通过/失败状态 + 失败时的关联 ID。
""",
    toolsets=["terminal", "file"],
)
```

## 输出格式

报告发现时：

```
## 发现 (Finding)
Endpoint: POST /api/v1/users
Status:   422 Unprocessable Entity
Req ID:   req_abc123xyz

## 可重现步骤 (Repro)
curl -X POST https://api.example.com/api/v1/users \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <REDACTED>' \
  -d '{"name":"test"}'

## 根本原因 (Root Cause)
缺少必需的字段 `email`。服务器在处理之前进行了验证拒绝。

## 修复建议 (Fix)
-d '{"name":"test","email":"test@example.com"}'
```

## 相关内容

- `systematic-debugging` — 一旦隔离了失败的 API 层，就进行代码根本原因分析
- `test-driven-development` — 在发布修复之前编写回归测试