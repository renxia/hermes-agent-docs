---
title: "Rest Graphql 调试 — 调试 REST/GraphQL API：状态码、认证、模式、复现"
sidebar_label: "Rest Graphql 调试"
description: "调试 REST/GraphQL API：状态码、认证、模式、复现"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。*/}

# Rest Graphql 调试

调试 REST/GraphQL API：状态码、认证、模式、复现。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/software-development/rest-graphql-debug` 安装 |
| 路径 | `optional-skills/software-development/rest-graphql-debug` |
| 版本 | `1.2.0` |
| 作者 | eren-karakus0 |
| 许可证 | MIT |
| 标签 | `api`, `rest`, `graphql`, `http`, `debugging`, `testing`, `curl`, `integration` |
| 相关技能 | [`系统化调试`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging), [`测试驱动开发`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development) |

:::info
以下是 Hermes 在此技能触发时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# API 测试与调试

通过 Hermes 工具驱动 REST 和 GraphQL 诊断 —— 使用 `terminal` 进行 `curl`，使用 `execute_code` 运行 Python `requests`，使用 `web_extract` 获取供应商文档。在猜测修复方案之前，先定位故障层。

## 何时使用

- API 返回意外的状态码或响应体
- 认证失败（令牌刷新后出现 401/403，OAuth，API 密钥）
- 在 Postman 中正常但在代码中失败
- Webhook / 回调集成调试
- 构建或审查 API 集成测试
- 速率限制或分页问题

跳过 UI 渲染、数据库查询调优或 DNS/防火墙基础架构（进行升级处理）。

## 核心原则

**先隔离故障层，再修复。** 一个 200 OK 可能隐藏损坏的数据。一个 500 错误可能掩盖了一个字符的认证错误。按顺序检查链条；永远不要跳过步骤。

```
1. 连接性   → 我们能连接到主机吗？
1.5 超时    → 连接慢还是读取慢？
2. TLS/SSL  → 证书有效且受信任吗？
3. 认证     → 凭据正确且未过期吗？
4. 请求格式 → 负载结构是否匹配服务器预期？
5. 响应解析 → 我们的代码能否接受返回的内容？
6. 语义     → 数据的含义是否符合我们的假设？
```

## 5 分钟快速入门

### 通过终端进行 REST 请求

```python
# 详细的请求/响应交换
terminal('curl -v https://api.example.com/users/1')

# 带 JSON 的 POST 请求
terminal("""curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"name":"test","email":"test@example.com"}'""")

# 仅获取响应头
terminal('curl -sI https://api.example.com/health')

# 美化打印 JSON
terminal('curl -s https://api.example.com/users | python3 -m json.tool')
```

### 通过终端进行 GraphQL 请求

```python
terminal("""curl -X POST https://api.example.com/graphql \\
  -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"query":"{ user(id: 1) { name email } }"}'""")
```

**GraphQL 注意事项：** 服务器通常在查询失败时也返回 HTTP 200。无论状态码如何，都要检查 `errors` 字段：

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
        print(f"GraphQL error: {err['message']} (path: {err.get('path')})")
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

### 步骤 1 — 连接性

```python
terminal('nslookup api.example.com')
terminal('curl -v --connect-timeout 5 https://api.example.com/health')
```

故障点：DNS 无法解析、防火墙、需要 VPN、缺少代理。

### 步骤 1.5 — 超时

区分*无法连接*和*能连接但慢*：

```python
terminal('''curl -w "dns:%{time_namelookup}s connect:%{time_connect}s tls:%{time_appconnect}s ttfb:%{time_starttransfer}s total:%{time_total}s\\n" \\
  -o /dev/null -s https://api.example.com/endpoint''')
```

在 Python 中，总是传递一个元组超时参数 —— `requests` 没有默认值，会永远挂起：

```python
execute_code('''
import requests
from requests.exceptions import ConnectTimeout, ReadTimeout
try:
    requests.get(url, timeout=(3.05, 30))
except ConnectTimeout:
    print("无法连接到主机 — DNS、防火墙、VPN 问题")
except ReadTimeout:
    print("已连接但服务器响应慢")
''')
```

诊断：高 `time_connect` 表示网络/防火墙问题；`time_connect` 低但 `time_starttransfer` 高表示服务器响应慢。

### 步骤 2 — TLS/SSL

```python
terminal('curl -vI https://api.example.com 2>&1 | grep -E "SSL|subject|expire|issuer"')
```

故障点：证书过期、自签名证书、主机名不匹配、缺少 CA 证书包。仅在临时调试时使用 `-k`，切勿在代码中使用。

### 步骤 3 — 认证

```python
# 令牌有效性检查
terminal('curl -s -o /dev/null -w "%{http_code}\\n" -H "Authorization: Bearer $TOKEN" https://api.example.com/me')

# 解码 JWT exp 声明 —— 正确处理 base64url 填充
execute_code('''
import json, base64, os
tok = os.environ["TOKEN"]
payload = tok.split(".")[1]
payload += "=" * (-len(payload) % 4)
print(json.dumps(json.loads(base64.urlsafe_b64decode(payload)), indent=2))
''')
```

检查清单：
- 令牌过期了吗？（JWT 中的 `exp` 声明）
- 方案正确吗？Bearer 与 Basic 与 Token 与 `X-Api-Key`
- 环境正确吗？在生产环境使用预发布环境的密钥是常见错误
- API 密钥是在请求头中还是在查询参数中（`?api_key=…`）？

### 步骤 4 — 请求格式

```python
terminal("""curl -v -X POST https://api.example.com/endpoint \\
  -H 'Content-Type: application/json' \\
  -d '{"key":"value"}' 2>&1""")
```

**Content-Type / 请求体不匹配 —— 无声的 415/400 错误：**

```python
# 错误 —— data= 发送表单编码，但请求头声明为 JSON
requests.post(url, data='{"k":"v"}', headers={"Content-Type": "application/json"})

# 正确 —— json= 自动设置请求头并进行序列化
requests.post(url, json={"k": "v"})

# 错误 —— Accept 声明为 XML，但代码调用 .json()
requests.get(url, headers={"Accept": "text/xml"})

# 正确 —— 让 requests 构建带边界的 multipart
requests.post(url, files={"file": open("doc.pdf", "rb")})
```

常见问题：表单编码与 JSON 混淆、缺少必填字段、使用了错误的 HTTP 方法、未编码的查询参数。

### 步骤 5 — 响应解析

在调用 `.json()` 之前，务必检查 content-type：

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
    print(f"意外的 content-type {ct!r}，响应体={resp.text[:500]!r}")
''')
```

故障点：期望 JSON 但收到 HTML 错误页面、空响应体、错误的字符集。

### 步骤 6 — 语义验证

解析干净了 —— 但数据*正确*吗？

- `"status": "active"` 的含义是否符合你的代码预期？
- 响应中的 ID 是否与请求的 ID 匹配？
- 时间戳是否在预期的时区？
- 分页是否返回了所有结果，还是只有第一页？

## HTTP 状态码应对手册

### 401 Unauthorized — 凭据缺失或无效

1. `Authorization` 请求头实际存在吗？（用 `curl -v` 确认）
2. 令牌正确且未过期？
3. 认证方案正确吗？（`Bearer` vs `Basic` vs `Token`）
4. 一些 API 使用查询参数（`?api_key=…`）而非请求头。

### 403 Forbidden — 已认证但无权限

1. 令牌具有所需的范围/权限吗？
2. 资源是否属于不同的账户？
3. IP 白名单阻止了你？
4. 浏览器中的 CORS 问题？（检查 `Access-Control-Allow-Origin`）

### 404 Not Found — 资源不存在或 URL 错误

1. 路径正确吗？（尾部斜杠、拼写错误、版本前缀）
2. 资源 ID 是否存在？
3. API 版本正确吗（`/v1/` vs `/v2/`）？
4. 基础 URL 正确吗（预发布环境 vs 生产环境）？

### 409 Conflict — 状态冲突

1. 资源是否已存在（重复创建）？
2. `ETag` / `If-Match` 是否过时？
3. 被其他进程并发修改了？

### 422 Unprocessable Entity — JSON 有效，但数据无效

错误响应体通常会指出有问题的字段。检查：
- 字段类型（字符串 vs 整数，日期格式）
- 必填 vs 可选
- 枚举值是否在允许的集合内

### 429 Too Many Requests — 速率受限

检查 `Retry-After` 和 `X-RateLimit-*` 响应头。指数退避：

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

### 5xx — 服务器端错误，通常不是你的错

- **500** — 服务器 Bug。捕获关联 ID，向提供商提交工单。
- **502** — 上游服务宕机。退避后重试。
- **503** — 过载/维护中。检查状态页面。
- **504** — 上游超时。减少负载或增加超时时间。

对于所有 5xx 错误：进行带抖动的退避，若持续发生则发出警报。

## 分页与幂等性

**分页。** 验证你是否获取了*所有*结果。查找 `next_cursor`、`next_page`、`total_count`。两种模式：
- 偏移量（`?limit=100&offset=200`）—— 简单，但如果数据变动可能会跳过项目。
- 游标（`?cursor=abc123`）—— 对于实时或大型数据集是首选。

**幂等性。** 对于非幂等操作（POST），发送 `Idempotency-Key: <uuid>`，这样重试不会导致重复扣款/重复创建。对于支付和订单是强制性的。

## 契约验证

在上线前捕获模式变更：

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
            errors.append(f"{field}: 期望 {expected.__name__}，得到 {type(data[field]).__name__}")
    return errors

resp = requests.get(f"{BASE}/users/1", headers=HEADERS, timeout=10)
issues = validate_user(resp.json())
if issues:
    print(f"契约违规: {issues}")
''')
```

在 API 升级后、集成新的第三方服务时，或在 CI 冒烟测试中运行。

## 关联ID

始终捕获提供商的请求ID——这是获得供应商支持的最快途径：

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
    print(f"failed status={resp.status_code} req_id={request_id} ts={resp.headers.get('Date')}")
''')
```

**供应商错误报告模板：**

```
端点：    POST /api/v1/orders
请求ID：  req_abc123xyz
时间戳：   2026-03-17T14:30:00Z
状态码：   500
预期结果：  201 及订单对象
实际结果：  500 {"error":"internal server error"}
重现步骤：   curl -X POST … (认证: <REDACTED>)
```

## 回归测试模板

将以下内容放入 `tests/` 目录并通过 `terminal('pytest tests/test_api_smoke.py -v')` 运行：

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
- 永远不要记录完整的令牌。脱敏处理：`Bearer <REDACTED>`。
- 永远不要在脚本中硬编码令牌。从环境变量（`os.environ["API_TOKEN"]`）或 `~/.hermes/.env` 读取。
- 如果令牌出现在日志、错误消息或 git 历史记录中，立即轮换。

### 安全日志记录

```python
def redact_auth(headers: dict) -> dict:
    sensitive = {"authorization", "x-api-key", "cookie", "set-cookie"}
    return {k: ("<REDACTED>" if k.lower() in sensitive else v) for k, v in headers.items()}
```

### 泄露检查清单

- [ ] **URL中的凭据。** 查询字符串中的 API 密钥会出现在服务器日志、浏览器历史记录、引用头中——应使用请求头。
- [ ] **错误响应中的PII。** `404 on /users/123` 不应揭示用户是否存在（枚举风险）。
- [ ] **生产环境中的堆栈跟踪。** 500 错误不应泄露文件路径、框架版本。
- [ ] **内部主机名/IP。** 错误信息中不应出现 `10.x.x.x`、`internal-api.corp.local`。
- [ ] **回显的令牌。** 一些 API 会在错误详情中包含认证令牌。请验证它们是否这样做。
- [ ] **详细的 `Server` / `X-Powered-By` 头。** 堆栈信息泄露。注意安全审查。

## 智能体工具模式

### terminal — 用于 curl, dig, openssl

```python
terminal('curl -sI https://api.example.com')
terminal('openssl s_client -connect api.example.com:443 -servername api.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates')
```

### execute_code — 用于多步骤 Python 流程

当调试范围涉及 认证 → 获取 → 分页 → 验证 时，使用 `execute_code`。变量在脚本期间持续存在，结果打印到标准输出，没有在上下文中泄露令牌的风险：

```python
execute_code('''
import os, requests

token = os.environ["API_TOKEN"]
base  = "https://api.example.com"
H     = {"Authorization": f"Bearer {token}"}

# 1. 认证
me = requests.get(f"{base}/me", headers=H, timeout=10)
print(f"认证状态 {me.status_code}")

# 2. 分页
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

### delegate_task — 用于完整的 CRUD 测试扫描

```python
delegate_task(
    goal="测试 /api/v1/users 的所有 CRUD 端点",
    context="""
遵循 rest-graphql-debug 技能（optional-skills/software-development/rest-graphql-debug）。
基础 URL：https://api.example.com
认证：使用来自 API_TOKEN 环境变量的 Bearer 令牌。

对于每个动词（POST, GET, PATCH, DELETE）：
  - 正常路径：断言状态码 + 响应架构
  - 错误情况：400, 404, 422
  - 为任何失败记录一个重现 curl 命令（脱敏处理令牌）

输出：每个端点的通过/失败状态 + 失败的关联 ID。
""",
    toolsets=["terminal", "file"],
)
```

## 输出格式

报告发现时：

```
## 发现
端点：    POST /api/v1/users
状态码：   422 Unprocessable Entity
请求ID：   req_abc123xyz

## 重现步骤
curl -X POST https://api.example.com/api/v1/users \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <REDACTED>' \
  -d '{"name":"test"}'

## 根本原因
缺少必填字段 `email`。服务器验证在处理前即拒绝。

## 修复方案
-d '{"name":"test","email":"test@example.com"}'
```

## 相关

- `systematic-debugging` — 隔离出故障的 API 层后，定位代码的根本原因
- `test-driven-development` — 在发布修复前编写回归测试