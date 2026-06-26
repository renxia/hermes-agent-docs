---
title: Airtable — Airtable REST API via curl
sidebar_label: Airtable
description: 通过curl访问Airtable REST API
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Airtable

通过curl访问Airtable REST API。记录的CRUD操作、过滤和更新。

## Skill metadata

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/productivity/airtable` |
| Version | `1.1.0` |
| Author | community |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `Airtable`, `Productivity`, `Database`, `API` |

## Reference: full SKILL.md

:::info
以下是Hermes在触发此技能时加载的完整技能定义。这是智能体（agent）在技能激活时的指令。
:::

# Airtable — 基础、表格和记录

使用`terminal`工具通过`curl`直接操作Airtable的REST API。无需MCP服务器，无需OAuth流程，无需Python SDK——只需要`curl`和一个个人访问令牌。

## 前提条件

1. 在https://airtable.com/create/tokens 创建一个**个人访问令牌（PAT）**（令牌以`pat...`开头）。
2. 授予这些权限（最低要求）：
   - `data.records:read` — 读取行
   - `data.records:write` — 创建/更新/删除行
   - `schema.bases:read` — 列出基础和表格
3. **重要提示：** 在同一个令牌UI中，将所有想要访问的基础添加到该令牌的**Access（访问权限）**列表中。PAT是按基础范围限定的——在错误的基准上使用的有效令牌会返回`403`。
4. 将令牌存储在`${HERMES_HOME:-~/.hermes}/.env`中（或通过`hermes setup`）：
   ```
   AIRTABLE_API_KEY=pat_your_token_here
   ```

> 注意：旧的`key...` API密钥已于2024年2月弃用。目前只能使用PAT和OAuth令牌。

## API基础知识

- **Endpoint（端点）:** `https://api.airtable.com/v0`
- **Auth header（授权头）:** `Authorization: Bearer $AIRTABLE_API_KEY`
- **所有请求**都使用JSON（对于任何POST/PATCH/PUT体，请使用`Content-Type: application/json`）。
- **对象ID:** 基础（bases）`app...`，表格（tables）`tbl...`，记录（records）`rec...`，字段（fields）`fld...`。ID永不改变；名称可以。在自动化中使用ID更佳。
- **速率限制:** 每个基础5个请求/秒。收到`429`时应进行退避（back off）。对单个基础的突发操作会被限速。

基础curl模式：
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?maxRecords=5" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

`-s`用于抑制curl的进度条——请始终设置它，以确保工具输出对Hermes保持干净。通过`python3 -m json.tool`（总是存在）或`jq`（如果已安装）进行管道处理，以便获得可读的JSON。

## 字段类型（请求体形状）

| 字段类型 | 写入形状 |
|---|---|
| 单行文本 (Single line text) | `"Name": "hello"` |
| 长文本 (Long text) | `"Notes": "multi\nline"` |
| 数字 (Number) | `"Score": 42` |
| 复选框 (Checkbox) | `"Done": true` |
| 单选 (Single select) | `"Status": "Todo"` (除非`typecast: true`，否则名称必须已存在) |
| 多选 (Multi-select) | `"Tags": ["urgent", "bug"]` |
| 日期 (Date) | `"Due": "2026-04-01"` |
| 日期时间 (DateTime, UTC) | `"At": "2026-04-01T14:30:00.000Z"` |
| URL / Email / Phone | `"Link": "https://…"` |
| 文件附件 (Attachment) | `"Files": [{"url": "https://…"}]` (Airtable会获取+重新托管) |
| 链接记录 (Linked record) | `"Owner": ["recXXXXXXXXXXXXXX"]` (记录ID数组) |
| 用户 (User) | `"AssignedTo": {"id": "usrXXXXXXXXXXXXXX"}` |

在创建/更新体的顶层传递`"typecast": true`，让Airtable自动强制转换值（例如，即时创建一个新的选择选项，将`"42"`转换为`42`）。

## 常用查询

### 列出令牌可见的基础
```bash
curl -s "https://api.airtable.com/v0/meta/bases" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

### 列出基础的表格和模式（Schema）
```bash
curl -s "https://api.airtable.com/v0/meta/bases/$BASE_ID/tables" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```
在进行任何修改操作之前使用此功能——它会确认精确的字段名称和ID，显示选择字段的`options.choices`，并显示主字段的名称。

### 列出记录（前10条）
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?maxRecords=10" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

### 获取单个记录
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE/$RECORD_ID" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

### 过滤记录（filterByFormula）
Airtable的公式必须进行URL编码。让Python标准库来完成——切勿手动编码：
```bash
FORMULA="{Status}='Todo'"
ENC=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$FORMULA")
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?filterByFormula=$ENC&maxRecords=20" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

有用的公式模式：
- 精确匹配：`{Email}='user@example.com'`
- 包含：`FIND('bug', LOWER({Title}))`
- 多重条件：`AND({Status}='Todo', {Priority}='High')`
- 或（OR）：`OR({Owner}='alice', {Owner}='bob')`
- 非空：`NOT({Assignee}='')`
- 日期比较：`IS_AFTER({Due}, TODAY())`

### 排序 + 选择特定字段
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?sort%5B0%5D%5Bfield%5D=Priority&sort%5B0%5D%5Bdirection%5D=asc&fields%5B%5D=Name&fields%5B%5D=Status" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```
查询参数中的方括号**必须**进行URL编码（`%5B` / `%5D`）。

### 使用命名视图 (Named view)
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?view=Grid%20view&maxRecords=50" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```
视图会在服务器端应用其保存的过滤和排序。

## 常用修改操作 (Mutations)

### 创建记录
```bash
curl -s -X POST "https://api.airtable.com/v0/$BASE_ID/$TABLE" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"Name":"New task","Status":"Todo","Priority":"High"}}' | python3 -m json.tool
```

### 在一次调用中创建多达10条记录
```bash
curl -s -X POST "https://api.airtable.com/v0/$BASE_ID/$TABLE" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "typecast": true,
    "records": [
      {"fields": {"Name": "Task A", "Status": "Todo"}},
      {"fields": {"Name": "Task B", "Status": "In progress"}}
    ]
  }' | python3 -m json.tool
```
批量端点限制为**每请求10条记录**。对于更大的插入量，请分批（每次10条）进行循环操作，并短暂休眠以遵守5 req/sec/base的预算。

### 更新记录 (PATCH — 合并，保留未更改的字段)
```bash
curl -s -X PATCH "https://api.airtable.com/v0/$BASE_ID/$TABLE/$RECORD_ID" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"Status":"Done"}}' | python3 -m json.tool
```

### 通过合并字段进行Upsert（无需ID）
```bash
curl -s -X PATCH "https://api.airtable.com/v0/$BASE_ID/$TABLE" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "performUpsert": {"fieldsToMergeOn": ["Email"]},
    "records": [
      {"fields": {"Email": "user@example.com", "Status": "Active"}}
    ]
  }' | python3 -m json.tool
```
`performUpsert`会创建那些合并字段值新的记录，并更新那些合并字段值已存在的记录。这对于幂等同步非常有用。

### 删除记录
```bash
curl -s -X DELETE "https://api.airtable.com/v0/$BASE_ID/$TABLE/$RECORD_ID" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

### 在一次调用中删除多达10条记录
```bash
curl -s -X DELETE "https://api.airtable.com/v0/$BASE_ID/$TABLE?records%5B%5D=rec1&records%5B%5D=rec2" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

## 分页 (Pagination)

列表端点最多返回**每页100条记录**。如果响应中包含`"offset": "..."`，则将其传递给下一次调用。循环直到该字段不存在：

```bash
OFFSET=""
while :; do
  URL="https://api.airtable.com/v0/$BASE_ID/$TABLE?pageSize=100"
  [ -n "$OFFSET" ] && URL="$URL&offset=$OFFSET"
  RESP=$(curl -s "$URL" -H "Authorization: Bearer $AIRTABLE_API_KEY")
  echo "$RESP" | python3 -c 'import json,sys; d=json.load(sys.stdin); [print(r["id"], r["fields"].get("Name","")) for r in d["records"]]'
  OFFSET=$(echo "$RESP" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("offset",""))')
  [ -z "$OFFSET" ] && break
done
```

## 典型的Hermes工作流程

1. **确认授权。** `curl -s -o /dev/null -w "%{http_code}\n" https://api.airtable.com/v0/meta/bases -H "Authorization: Bearer $AIRTABLE_API_KEY"` — 期望返回`200`。
2. **查找基础。** 列出基础（上一步）或如果令牌缺少`schema.bases:read`权限，则直接询问用户`app...` ID。
3. **检查模式（Schema）。** `GET /v0/meta/bases/$BASE_ID/tables` — 在进行任何修改操作之前，将精确的字段名称和主字段名称缓存到会话中。
4. **写入前读取。** 对于“更新X，条件为Y”，先使用`filterByFormula`来解析`rec...` ID，然后执行`PATCH /v0/$BASE_ID/$TABLE/$RECORD_ID`。切勿猜测记录ID。
5. **批量写入。** 将相关的创建操作合并到一次10条记录的POST请求中，以保持在5 req/sec的预算之内。
6. **破坏性操作。** 删除操作无法通过API撤销。如果用户说“删除所有X”，请回显过滤条件+记录计数，并在执行前进行确认。

## 潜在陷阱 (Pitfalls)

- **`filterByFormula`必须进行URL编码。** 包含空格或非ASCII字符的字段名也需要编码（例如：`{My Field}` → `%7BMy%20Field%7D`）。请使用Python标准库（上述模式）——切勿手动转义。
- **空字段会被省略。** 缺少`"Assignee"`键并不意味着该字段不存在——它只意味着此记录的值为空。在得出某个字段缺失的结论之前，请检查模式（步骤3）。
- **PATCH vs PUT。** `PATCH`会将提供的字段合并到记录中。`PUT`会完全替换记录，并清除所有未包含的字段。默认使用`PATCH`。
- **单选选项必须存在。** 如果`Shipping`不在字段的选项列表中，而你写入`"Status": "Shipping"`，则会返回`INVALID_MULTIPLE_CHOICE_OPTIONS`错误，除非你传递了`"typecast": true`（它会自动创建该选项）。
- **按基础范围限定的令牌。** 一个基础返回`403`而另一个正常工作，这意味着令牌的访问权限列表中不包含该基础——这不是范围或授权问题。请将用户引导至https://airtable.com/create/tokens进行授予权限。
- **速率限制是针对每个基础，而不是针对整个令牌。** `baseA`上的5 req/sec和`baseB`上的5 req/sec是没问题的；但如果`baseA`单独达到6 req/sec，就会被限速。请监控`429`响应中的`Retry-After`标头。

## 对Hermes的重要说明

- **始终使用`terminal`工具配合`curl`。** 不要使用`web_extract`（它无法发送授权头）或`browser_navigate`（需要UI授权且速度慢）。
- **`AIRTABLE_API_KEY`会自动从`${HERMES_HOME:-~/.hermes}/.env`流式传输到子进程中**，当此技能加载时——无需在每次`curl`调用前重新导出它。
- **请仔细转义公式中的花括号。** 在heredoc体中，`{Status}`是字面量。在shell参数中，`{Status}`在非`{...}`的展开上下文之外是安全的——但仍需通过`python3 urllib.parse.quote`将动态字符串传递后再拼接进URL。
- **使用`python3 -m json.tool`进行美观打印**（总是存在），而不是`jq`（可选）。只有当你需要过滤/投影时才考虑使用`jq`。
- **分页是按页进行的，而非全局的。** Airtable的100条记录限制是一个硬性上限；无法提高它。请使用`offset`进行循环，直到该字段缺失。
- **阅读非2xx响应中的`errors`数组**——Airtable会返回结构化的错误代码，例如`AUTHENTICATION_REQUIRED`、`INVALID_PERMISSIONS`、`MODEL_ID_NOT_FOUND`、`INVALID_MULTIPLE_CHOICE_OPTIONS`，这些代码会准确地告诉你哪里出了问题。