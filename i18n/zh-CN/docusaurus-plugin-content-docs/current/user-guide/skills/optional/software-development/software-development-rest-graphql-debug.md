---
title: "Rest GraphQL 调试 — 调试 REST/GraphQL API：状态码、认证、架构、重现"
sidebar_label: "Rest GraphQL 调试"
description: "调试 REST/GraphQL API：状态码、认证、架构、重现"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Rest GraphQL 调试

调试 REST/GraphQL API：状态码、认证、架构、重现。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/software-development/rest-graphql-debug` 安装 |
| 路径 | `optional-skills/software-development/rest-graphql-debug` |
| 版本 | `1.2.0` |
| 作者 | eren-karakus0 |
| 许可证 | MIT |
| 标签 | `api`、`rest`、`graphql`、`http`、`调试`、`测试`、`curl`、`集成` |
| 相关技能 | [`系统化调试`](/user-guide/skills/bundled/software-development/software-development-systematic-debugging)、[`测试驱动开发`](/user-guide/skills/bundled/software-development/software-development-test-driven-development) |

:::info
以下是 Hermes 加载此技能时的完整技能定义。这是技能激活时智能体看到的指令。
:::

# API 测试与调试

通过 Hermes 工具驱动 REST 和 GraphQL 诊断 —— 使用 `terminal` 运行 `curl`，使用 `execute_code` 执行 Python `requests`，使用 `web_extract` 获取供应商文档。在猜测修复方案之前，先隔离故障层。

## 使用场景

- API 返回意外的状态码或响应体
- 认证失败（令牌刷新、OAuth、API 密钥后出现 401/403）
- 在 Postman 中正常但在代码中失败
- Webhook / 回调集成调试
- 构建或审查 API 集成测试
- 速率限制或分页问题

适用于 UI 渲染、数据库查询调优或 DNS/防火墙基础设施（需升级处理）。

## 核心原则

**隔离故障层，然后修复。** 200 OK 可能隐藏损坏的数据。500 可能掩盖一个字符的认证错误。按顺序排查链路，绝不跳过任何一步。

```
1. 连接性        → 我们能访问主机吗？
1.5 超时         → 连接缓慢还是读取缓慢？
2. TLS/SSL       → 证书有效且受信任吗？
3. 认证          → 凭据正确且未过期吗？
4. 请求格式      → 载荷结构是否匹配服务器预期？
5. 响应解析      → 我们的代码是否接受返回内容？
6. 语义验证      → 数据是否符合我们的假设？
```

## 5 分钟快速入门

### 通过终端使用 REST

```python
# 详细的请求/响应交互
terminal('curl -v https://api.example.com/users/1')

# POST 请求，携带 JSON
terminal("""curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"name":"test","email":"test@example.com"}'""")

# 仅查看头部
terminal('curl -sI https://api.example.com/health')

# 美化打印 JSON
terminal('curl -s https://api.example.com/users | python3 -m json.tool')
```

### 通过终端使用 GraphQL

```python
terminal("""curl -X POST https://api.example.com/graphql \\
  -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"query":"{ user(id: 1) { name email } }"}'""")
```

**GraphQL 注意事项：** 服务器通常即使在查询失败时也会返回 HTTP 200。务必检查 `errors` 字段，无论状态码如何：

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
    timeout=(3.05, 30),  # (连接超时, 读取超时)
)
print(resp.status_code, dict(resp.headers))
print(resp.text[:500])
''')
```

## 分层调试流程

### 步骤 1 —— 连接性

```python
terminal('nslookup api.example.com')
terminal('curl -v --connect-timeout 5 https://api.example.com/health')
```

失败情况：DNS 无法解析、防火墙、需要 VPN、缺少代理。

### 步骤 1.5 —— 超时

区分 *无法访问* 与 *可访问但缓慢*：

```python
terminal('''curl -w "dns:%{time_namelookup}s connect:%{time_connect}s tls:%{time_appconnect}s ttfb:%{time_starttransfer}s total:%{time_total}s\\n" \\
  -o /dev/null -s https://api.example.com/endpoint''')
```

在 Python 中，务必传递元组超时参数 —— `requests` 没有默认值，会无限期挂起：

```python
execute_code('''
import requests
from requests.exceptions import ConnectTimeout, ReadTimeout
try:
    requests.get(url, timeout=(3.05, 30))
except ConnectTimeout:
    print("无法访问主机 —— DNS、防火墙、VPN 问题")
except ReadTimeout:
    print("已连接但服务器响应缓慢")
''')
```

诊断：`time_connect` 值高是网络/防火墙问题；`time_starttransfer` 高而 `time_connect` 低是服务器缓慢。

### 步骤 2 —— TLS/SSL

```python
terminal('curl -vI https://api.example.com 2>&1 | grep -E "SSL|subject|expire|issuer"')
```

失败情况：证书过期、自签名证书、主机名不匹配、缺少 CA 证书包。仅在临时调试时使用 `-k`，切勿在代码中使用。

### 步骤 3 —— 认证

```python
# 令牌有效性检查
terminal('curl -s -o /dev/null -w "%{http_code}\\n" -H "Authorization: Bearer $TOKEN" https://api.example.com/me')

# 解码 JWT 的 exp 声明 —— 正确处理 base64url 填充
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
- 认证方案是否正确？Bearer vs Basic vs Token vs `X-Api-Key`
- 环境是否正确？在生产环境使用预发布密钥是经典错误
- API 密钥是在头部还是查询参数（`?api_key=…`）中？

### 步骤 4 —— 请求格式

```python
terminal("""curl -v -X POST https://api.example.com/endpoint \\
  -H 'Content-Type: application/json' \\
  -d '{"key":"value"}' 2>&1""")
```

**Content-Type / 请求体不匹配 —— 导致 415/400 的沉默错误：**

```python
# 错误 —— data= 发送表单编码，头部信息错误
requests.post(url, data='{"k":"v"}', headers={"Content-Type": "application/json"})

# 正确 —— json= 自动设置头部并序列化
requests.post(url, json={"k": "v"})

# 错误 —— Accept 声明为 XML，代码却调用 .json()
requests.get(url, headers={"Accept": "text/xml"})

# 正确 —— 让 requests 构建带边界的 multipart 请求
requests.post(url, files={"file": open("doc.pdf", "rb")})
```

常见问题：表单编码 vs JSON、缺少必填字段、HTTP 方法错误、查询参数未编码。

### 步骤 5 —— 响应解析

在调用 `.json()` 之前务必检查 content-type：

```python
execute_code('''
import requests
resp = requests.post(url, json=payload, timeout=10)
print(f"状态码={resp.status_code}")
print(f"头部={dict(resp.headers)}")
ct = resp.headers.get("Content-Type", "")
if "application/json" in ct:
    print(resp.json())
else:
    print(f"意外的 content-type {ct!r}, 响应体={resp.text[:500]!r}")
''')
```

失败情况：期望 JSON 但收到 HTML 错误页面、响应体为空、字符集错误。

### 步骤 6 —— 语义验证

解析正常 —— 但数据 *正确* 吗？

- `"status": "active"` 的含义是否符合你的代码理解？
- 响应中的 ID 是否与请求的 ID 匹配？
- 时间戳是否在预期的时区？
- 分页是否返回了所有结果，还是仅第一页？

## HTTP 状态码处理手册

### 401 未授权 —— 凭据缺失或无效

1. `Authorization` 头部是否实际存在？（用 `curl -v` 确认）
2. 令牌是否正确且未过期？
3. 认证方案是否正确？（`Bearer` vs `Basic` vs `Token`）
4. 有些 API 使用查询参数（`?api_key=…`）而非头部。

### 403 禁止访问 —— 已认证但未授权

1. 令牌是否具有所需的范围/权限？
2. 资源是否属于其他账户？
3. 是否被 IP 白名单阻止？
4. 在浏览器中遇到 CORS？（检查 `Access-Control-Allow-Origin`）

### 404 未找到 —— 资源不存在或 URL 错误

1. 路径是否正确？（尾部斜杠、拼写错误、版本前缀）
2. 资源 ID 是否存在？
3. API 版本是否正确（`/v1/` vs `/v2/`）？
4. 基础 URL 是否正确（预发布 vs 生产环境）？

### 409 冲突 —— 状态冲突

1. 资源是否已存在（重复创建）？
2. `ETag` / `If-Match` 是否过期？
3. 是否被其他进程并发修改？

### 422 不可处理的实体 —— JSON 有效，但数据无效

错误响应体通常会指明有问题的字段。检查：
- 字段类型（字符串 vs 整数，日期格式）
- 必填 vs 选填
- 枚举值是否在允许范围内

### 429 请求过多 —— 速率限制

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

### 5xx —— 服务器端错误，通常不是你的错

- **500** —— 服务器错误。捕获关联 ID，向供应商报告。
- **502** —— 上游服务宕机。退避并重试。
- **503** —— 过载 / 维护中。检查状态页面。
- **504** —— 上游超时。减少载荷或增加超时时间。

对于所有 5xx：带抖动的退避，持续发生时发出警报。

## 分页与幂等性

**分页。** 验证你是否获取了 *所有* 结果。查找 `next_cursor`、`next_page`、`total_count`。两种模式：
- 偏移量（`?limit=100&offset=200`） —— 简单，但如果数据变动可能会跳过项目。
- 游标（`?cursor=abc123`） —— 适用于实时或大型数据集。

**幂等性。** 对于非幂等操作（POST），发送 `Idempotency-Key: <uuid>` 以确保重试不会导致重复扣款 / 创建。支付和订单操作必须使用。

## 契约验证

在影响生产环境之前捕获架构偏移：

```python
execute_code('''
import requests

def validate_user(data: dict) -> list[str]:
    errors = []
    required = {"id": int, "email": str, "created_at": str}
    for field, expected in required.items():
        if field not in data:
            errors.append(f"缺失字段: {field}")
        elif not isinstance(data[field], expected):
            errors.append(f"{field}: 期望 {expected.__name__}, 实际得到 {type(data[field]).__name__}")
    return errors

resp = requests.get(f"{BASE}/users/1", headers=HEADERS, timeout=10)
issues = validate_user(resp.json())
if issues:
    print(f"契约违规: {issues}")
''')
```

在 API 升级后、集成新的第三方服务时，或在 CI 冒烟测试中运行此检查。

# 相关 ID

始终捕获提供商的请求 ID —— 这是联系供应商支持的最快途径：

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
    print(f"失败 状态码={resp.status_code} 请求ID={request_id} 时间戳={resp.headers.get('Date')}")
''')
```

**供应商错误报告模板：**

```
端点：    POST /api/v1/orders
请求 ID： req_abc123xyz
时间戳：  2026-03-17T14:30:00Z
状态码：  500
预期结果：201 及订单对象
实际结果：500 {"error":"内部服务器错误"}
重现步骤：curl -X POST … (认证: <已脱敏>)
```

## 回归测试模板

将其放入 `tests/` 目录，并通过 `terminal('pytest tests/test_api_smoke.py -v')` 运行：

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

## 安全

### 令牌处理
- 切勿记录完整的令牌。请脱敏处理：`Bearer <REDACTED>`。
- 切勿在脚本中硬编码令牌。从环境变量（`os.environ["API_TOKEN"]`）或 `~/.hermes/.env` 读取。
- 如果令牌出现在日志、错误信息或 Git 历史中，请立即轮换。

### 安全日志记录

```python
def redact_auth(headers: dict) -> dict:
    sensitive = {"authorization", "x-api-key", "cookie", "set-cookie"}
    return {k: ("<REDACTED>" if k.lower() in sensitive else v) for k, v in headers.items()}
```

### 泄露检查清单

- [ ] **URL 中的凭证。** 查询字符串中的 API 密钥会出现在服务器日志、浏览器历史记录、引用来源头部 — 请使用请求头。
- [ ] **错误响应中的 PII（个人身份信息）。** `404 on /users/123` 不应透露用户是否存在（枚举攻击）。
- [ ] **生产环境中的堆栈跟踪。** 500 错误不应泄露文件路径、框架版本。
- [ ] **内部主机名/IP。** 错误信息正文中出现 `10.x.x.x`、`internal-api.corp.local`。
- [ ] **回传的令牌。** 一些 API 会在错误详情中包含认证令牌。请验证它们不会这样做。
- [ ] **详细的 `Server` / `X-Powered-By`。** 堆栈信息泄露。注意进行安全审查。

## Hermes 工具使用模式

### terminal — 用于 curl、dig、openssl

```python
terminal('curl -sI https://api.example.com')
terminal('openssl s_client -connect api.example.com:443 -servername api.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates')
```

### execute_code — 用于多步骤 Python 流程

当调试过程涉及认证 → 获取 → 分页 → 验证时，使用 `execute_code`。变量在脚本中持久存在，结果打印到标准输出，不会有令牌在你的上下文中被泄露的风险：

```python
execute_code('''
import os, requests

token = os.environ["API_TOKEN"]
base  = "https://api.example.com"
H     = {"Authorization": f"Bearer {token}"}

# 1. 认证
me = requests.get(f"{base}/me", headers=H, timeout=10)
print(f"认证状态码 {me.status_code}")

# 2. 分页获取
all_users, cursor = [], None
while True:
    params = {"cursor": cursor} if cursor else {}
    r = requests.get(f"{base}/users", headers=H, params=params, timeout=10)
    body = r.json()
    all_users.extend(body["data"])
    cursor = body.get("next_cursor")
    if not cursor:
        break
print(f"用户数={len(all_users)}")
''')
```

### web_extract — 用于供应商 API 文档

提取你正在调试的端点的规范，而不是猜测：

```python
web_extract(urls=["https://docs.example.com/api/v1/users"])
```

### delegate_task — 用于完整的 CRUD 测试覆盖

```python
delegate_task(
    goal="测试 /api/v1/users 的所有 CRUD 端点",
    context="""
遵循 rest-graphql-debug 技能 (optional-skills/software-development/rest-graphql-debug)。
基础 URL：https://api.example.com
认证：来自 API_TOKEN 环境变量的 Bearer 令牌。

对于每个 HTTP 方法 (POST, GET, PATCH, DELETE)：
  - 正常路径：断言状态码 + 响应结构
  - 错误情况：400, 404, 422
  - 为任何失败记录一个可重现的 curl 命令（令牌脱敏）

输出：每个端点的 通过/失败 状态 + 失败请求的相关 ID。
""",
    toolsets=["terminal", "file"],
)
```

## 输出格式

报告发现时：

```
## 发现
端点：POST /api/v1/users
状态码：422 Unprocessable Entity
请求 ID：req_abc123xyz

## 重现
curl -X POST https://api.example.com/api/v1/users \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <REDACTED>' \
  -d '{"name":"test"}'

## 根本原因
缺少必填字段 `email`。服务器在处理前验证失败。

## 修复
-d '{"name":"test","email":"test@example.com"}'
```

## 相关技能

- `systematic-debugging` — 一旦定位到失败的 API 层，对代码进行根本原因分析
- `test-driven-development` — 在发布修复前编写回归测试