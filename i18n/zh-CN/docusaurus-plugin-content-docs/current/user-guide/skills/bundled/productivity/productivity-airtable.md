---
title: "Airtable — 通过 curl 调用 Airtable REST API"
sidebar_label: "Airtable"
description: "通过 curl 调用 Airtable REST API"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Airtable

通过 curl 调用 Airtable REST API。支持记录的增删改查（CRUD）、筛选和 upsert 操作。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/productivity/airtable` |
| 版本 | `1.1.0` |
| 作者 | 社区 |
| 许可证 | MIT |
| 标签 | `Airtable`, `效率`, `数据库`, `API` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Airtable — 数据表、表格与记录

通过 `terminal` 工具直接使用 `curl` 与 Airtable 的 REST API 进行交互。无需 MCP 服务器、无需 OAuth 流程、无需 Python SDK — 只需 `curl` 和个人访问令牌。

## 先决条件

1. 在 https://airtable.com/create/tokens 创建一个**个人访问令牌 (PAT)**（令牌以 `pat...` 开头）。
2. 授予以下权限范围（最低要求）：
   - `data.records:read` — 读取行
   - `data.records:write` — 创建 / 更新 / 删除行
   - `schema.bases:read` — 列出数据表和表格
3. **重要：** 在同一个令牌 UI 中，将您要访问的每个数据表添加到令牌的**访问权限**列表中。PAT 是按数据表进行范围限制的 — 在错误的数据表上使用有效令牌会返回 `403`。
4. 将令牌存储在 `~/.hermes/.env` 中（或通过 `hermes setup`）：
   ```
   AIRTABLE_API_KEY=pat_your_token_here
   ```

> 注意：传统的 `key...` API 密钥已于 2024 年 2 月弃用。现在仅支持 PAT 和 OAuth 令牌。

## API 基础

- **端点：** `https://api.airtable.com/v0`
- **认证头：** `Authorization: Bearer $AIRTABLE_API_KEY`
- **所有请求** 都使用 JSON（任何 POST/PATCH/PUT 请求体都需设置 `Content-Type: application/json`）。
- **对象 ID：** 数据表 `app...`，表格 `tbl...`，记录 `rec...`，字段 `fld...`。ID 永远不会改变；名称可以更改。在自动化中优先使用 ID。
- **速率限制：** 每个数据表每秒 5 次请求。收到 `429` 时应退避。对单个数据表的突发请求将被限流。

基础 curl 模式：
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?maxRecords=5" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

`-s` 用于抑制 curl 的进度条 — 每次调用都应保留此设置，以确保工具输出对 Hermes 保持清晰。通过 `python3 -m json.tool`（始终存在）或 `jq`（如果已安装）管道传输，以获得可读的 JSON。

## 字段类型（请求体格式）

| 字段类型 | 写入格式 |
|---|---|
| 单行文本 | `"Name": "hello"` |
| 长文本 | `"Notes": "multi\nline"` |
| 数字 | `"Score": 42` |
| 复选框 | `"Done": true` |
| 单选 | `"Status": "Todo"`（名称必须已存在，除非设置 `typecast: true`） |
| 多选 | `"Tags": ["urgent", "bug"]` |
| 日期 | `"Due": "2026-04-01"` |
| 日期时间 (UTC) | `"At": "2026-04-01T14:30:00.000Z"` |
| URL / 邮箱 / 电话 | `"Link": "https://…"` |
| 附件 | `"Files": [{"url": "https://…"}]`（Airtable 会获取并重新托管） |
| 关联记录 | `"Owner": ["recXXXXXXXXXXXXXX"]`（记录 ID 数组） |
| 用户 | `"AssignedTo": {"id": "usrXXXXXXXXXXXXXX"}` |

在创建/更新请求体的顶层传递 `"typecast": true`，以允许 Airtable 自动转换值（例如，动态创建新的选择选项，将 `"42"` 转换为 `42`）。

## 常见查询

### 列出令牌可访问的数据表
```bash
curl -s "https://api.airtable.com/v0/meta/bases" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

### 列出数据表的表格 + 架构
```bash
curl -s "https://api.airtable.com/v0/meta/bases/$BASE_ID/tables" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```
在修改之前使用此命令 — 确认确切的字段名称和 ID，显示选择字段的 `options.choices`，并显示主字段名称。

### 列出记录（前 10 条）
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?maxRecords=10" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

### 获取单条记录
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE/$RECORD_ID" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

### 过滤记录 (filterByFormula)
Airtable 公式必须进行 URL 编码。让 Python 标准库来完成 — 切勿手动编码：
```bash
FORMULA="{Status}='Todo'"
ENC=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$FORMULA")
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?filterByFormula=$ENC&maxRecords=20" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

有用的公式模式：
- 精确匹配：`{Email}='user@example.com'`
- 包含：`FIND('bug', LOWER({Title}))`
- 多条件：`AND({Status}='Todo', {Priority}='High')`
- 或：`OR({Owner}='alice', {Owner}='bob')`
- 非空：`NOT({Assignee}='')`
- 日期比较：`IS_AFTER({Due}, TODAY())`

### 排序 + 选择特定字段
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?sort%5B0%5D%5Bfield%5D=Priority&sort%5B0%5D%5Bdirection%5D=asc&fields%5B%5D=Name&fields%5B%5D=Status" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```
查询参数中的方括号必须进行 URL 编码（`%5B` / `%5D`）。

### 使用命名视图
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?view=Grid%20view&maxRecords=50" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```
视图会应用其保存的过滤器和排序规则（服务器端）。

## 常见变更操作

### 创建记录
```bash
curl -s -X POST "https://api.airtable.com/v0/$BASE_ID/$TABLE" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"Name":"New task","Status":"Todo","Priority":"High"}}' | python3 -m json.tool
```

### 一次调用创建最多 10 条记录
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
批量端点限制为**每次请求最多 10 条记录**。对于更大的插入操作，请以 10 条记录为一批进行循环，并短暂休眠以遵守每秒 5 次请求/数据表的限制。

### 更新记录 (PATCH — 合并，保留未更改的字段)
```bash
curl -s -X PATCH "https://api.airtable.com/v0/$BASE_ID/$TABLE/$RECORD_ID" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"Status":"Done"}}' | python3 -m json.tool
```

### 通过合并字段进行 upsert（无需 ID）
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
`performUpsert` 会为合并字段值为新的记录创建记录，为合并字段值已存在的记录打补丁。非常适合幂等同步。

### 删除记录
```bash
curl -s -X DELETE "https://api.airtable.com/v0/$BASE_ID/$TABLE/$RECORD_ID" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

### 一次调用删除最多 10 条记录
```bash
curl -s -X DELETE "https://api.airtable.com/v0/$BASE_ID/$TABLE?records%5B%5D=rec1&records%5B%5D=rec2" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

## 分页

列表端点每页最多返回 **100 条记录**。如果响应包含 `"offset": "..."`，请在下次调用时将其传回。循环直到该字段不存在：

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

## 典型的 Hermes 工作流程

1. **确认认证。** `curl -s -o /dev/null -w "%{http_code}\n" https://api.airtable.com/v0/meta/bases -H "Authorization: Bearer $AIRTABLE_API_KEY"` — 预期返回 `200`。
2. **查找数据表。** 列出数据表（如上步骤）或如果令牌缺少 `schema.bases:read` 权限，则直接询问用户 `app...` ID。
3. **检查架构。** `GET /v0/meta/bases/$BASE_ID/tables` — 在修改任何内容之前，先在会话中本地缓存确切的字段名称和主字段名称。
4. **写入前先读取。** 对于“更新满足 Y 条件的 X”，首先使用 `filterByFormula` 解析 `rec...` ID，然后执行 `PATCH /v0/$BASE_ID/$TABLE/$RECORD_ID`。切勿猜测记录 ID。
5. **批量写入。** 将相关的创建操作合并到一次最多 10 条记录的 POST 请求中，以保持在每秒 5 次请求的预算内。
6. **破坏性操作。** 删除操作无法通过 API 撤销。如果用户说“删除所有 X”，请先回显过滤器和记录计数并确认，然后再执行。

## 陷阱

- **`filterByFormula` 必须进行 URL 编码。** 包含空格或非 ASCII 字符的字段名也需要编码（`{My Field}` → `%7BMy%20Field%7D`）。使用 Python 标准库（如上模式）— 切勿手动转义。
- **空字段不会出现在响应中。** 缺少 `"Assignee"` 键并不意味着该字段不存在 — 而是表示此记录的值为空。在断定字段缺失之前，请先检查架构（步骤 3）。
- **PATCH 与 PUT。** `PATCH` 会将提供的字段合并到记录中。`PUT` 会完全替换记录，并清除您未包含的任何字段。默认使用 `PATCH`。
- **单选选项必须存在。** 当 `Shipping` 不在字段选项列表中时，写入 `"Status": "Shipping"` 会报错 `INVALID_MULTIPLE_CHOICE_OPTIONS`，除非您传递 `"typecast": true`（这会自动创建该选项）。
- **按数据表进行令牌范围限制。** 在一个数据表上返回 `403` 而在另一个数据表上正常工作，意味着令牌的访问权限列表不包含该数据表 — 这不是权限范围或认证问题。请将用户引导至 https://airtable.com/create/tokens 以授予访问权限。
- **速率限制是按数据表而非按令牌。** 在 `baseA` 上每秒 5 次请求和在 `baseB` 上每秒 5 次请求是可以的；仅在 `baseA` 上每秒 6 次请求将被限流。监控 `429` 响应中的 `Retry-After` 头。

## 关于 Hermes 的重要说明

- **始终使用 `terminal` 工具配合 `curl`。** 不要使用 `web_extract`（无法发送身份验证标头）或 `browser_navigate`（需要 UI 身份验证且速度慢）。
- **当加载此技能时，`AIRTABLE_API_KEY` 会自动从 `~/.hermes/.env` 流入子进程** — 无需在每次调用 `curl` 之前重新导出。
- **在公式中小心转义花括号。** 在 heredoc 正文中，`{Status}` 是字面量。在 shell 参数中，`{Status}` 在 `{...}` 花括号扩展上下文之外是安全的 — 但在将动态字符串拼接到 URL 之前，应通过 `python3 urllib.parse.quote` 进行处理。
- **使用 `python3 -m json.tool`（始终存在）进行美化打印**，而不是 `jq`（可选）。仅在需要过滤/投影时才使用 `jq`。
- **分页是按页进行的，而非全局的。** Airtable 的 100 条记录上限是一个硬性限制；无法提高。使用 `offset` 循环，直到该字段不存在为止。
- **读取非 2xx 响应中的 `errors` 数组** — Airtable 会返回结构化的错误代码，例如 `AUTHENTICATION_REQUIRED`、`INVALID_PERMISSIONS`、`MODEL_ID_NOT_FOUND`、`INVALID_MULTIPLE_CHOICE_OPTIONS`，这些代码会明确告知您出了什么问题。