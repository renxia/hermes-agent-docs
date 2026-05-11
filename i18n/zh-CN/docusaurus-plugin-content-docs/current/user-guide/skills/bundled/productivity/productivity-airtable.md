---
title: "Airtable — 通过 curl 使用 Airtable REST API"
sidebar_label: "Airtable"
description: "通过 curl 使用 Airtable REST API"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 从该技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# Airtable

通过 curl 使用 Airtable REST API。支持记录的增删改查、筛选及更新插入。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/productivity/airtable` |
| 版本 | `1.1.0` |
| 作者 | community |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Airtable`, `生产力`, `数据库`, `API` |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Airtable — 基地、表格与记录

通过 `terminal` 工具直接使用 `curl` 与 Airtable 的 REST API 交互。无需 MCP 服务器，无需 OAuth 流程，无需 Python SDK — 只需 `curl` 和一个个人访问令牌。

## 前提条件

1.  在 https://airtable.com/create/tokens 创建一个 **个人访问令牌**（令牌以 `pat...` 开头）。
2.  授予以下权限（至少）：
    *   `data.records:read` — 读取行
    *   `data.records:write` — 创建 / 更新 / 删除行
    *   `schema.bases:read` — 列出基地和表格
3.  **重要提示：** 在同一个令牌界面，将您要访问的每个基地添加到令牌的 **访问** 列表中。PAT 按基地范围限定 — 有效的令牌用于错误的基地会返回 `403`。
4.  将令牌存储在 `~/.hermes/.env`（或通过 `hermes setup`）：
    ```
    AIRTABLE_API_KEY=pat_your_token_here
    ```

> 注意：旧版 `key...` API 密钥已于 2024 年 2 月弃用。现在只有 PAT 和 OAuth 令牌有效。

## API 基础

- **端点：** `https://api.airtable.com/v0`
- **认证头：** `Authorization: Bearer $AIRTABLE_API_KEY`
- **所有请求** 使用 JSON（任何 POST/PATCH/PUT 主体使用 `Content-Type: application/json`）。
- **对象 ID：** 基地 `app...`，表格 `tbl...`，记录 `rec...`，字段 `fld...`。ID 永不改变；名称可以改变。在自动化中优先使用 ID。
- **速率限制：** 每基地 5 请求/秒。`429` → 退避。在单一基地上的突发请求将被限制。

基础 curl 模式：
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?maxRecords=5" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

`-s` 抑制 curl 的进度条 — 为每次调用保持设置，以便工具输出对 Hermes 保持清晰。通过 `python3 -m json.tool`（始终存在）或 `jq`（如果已安装）管道输出以获得可读的 JSON。

## 字段类型（请求主体格式）

| 字段类型 | 写入格式 |
|---|---|
| 单行文本 | `"Name": "hello"` |
| 长文本 | `"Notes": "multi\nline"` |
| 数字 | `"Score": 42` |
| 复选框 | `"Done": true` |
| 单选 | `"Status": "Todo"`（名称必须已存在，除非 `typecast: true`） |
| 多选 | `"Tags": ["urgent", "bug"]` |
| 日期 | `"Due": "2026-04-01"` |
| 日期时间 (UTC) | `"At": "2026-04-01T14:30:00.000Z"` |
| URL / 邮箱 / 电话 | `"Link": "https://…"` |
| 附件 | `"Files": [{"url": "https://…"}]`（Airtable 会抓取并重新托管） |
| 关联记录 | `"Owner": ["recXXXXXXXXXXXXXX"]`（记录 ID 数组） |
| 用户 | `"AssignedTo": {"id": "usrXXXXXXXXXXXXXX"}` |

在创建/更新主体的顶层传递 `"typecast": true`，可以让 Airtable 自动转换值（例如，动态创建一个新选项，将 `"42"` → `42`）。

## 常用查询

### 列出令牌可见的基地
```bash
curl -s "https://api.airtable.com/v0/meta/bases" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

### 列出基地的表格 + 模式
```bash
curl -s "https://api.airtable.com/v0/meta/bases/$BASE_ID/tables" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```
在修改操作之前使用 — 确认确切的字段名称和 ID，显示选择字段的 `options.choices`，并显示主字段名称。

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

### 筛选记录 (filterByFormula)
Airtable 公式必须 URL 编码。让 Python 标准库来做 — 永远不要手动编码：
```bash
FORMULA="{Status}='Todo'"
ENC=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$FORMULA")
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?filterByFormula=$ENC&maxRecords=20" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```

常用公式模式：
- 精确匹配：`{Email}='user@example.com'`
- 包含：`FIND('bug', LOWER({Title}))`
- 多个条件：`AND({Status}='Todo', {Priority}='High')`
- 或：`OR({Owner}='alice', {Owner}='bob')`
- 非空：`NOT({Assignee}='')`
- 日期比较：`IS_AFTER({Due}, TODAY())`

### 排序 + 选择特定字段
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?sort%5B0%5D%5Bfield%5D=Priority&sort%5B0%5D%5Bdirection%5D=asc&fields%5B%5D=Name&fields%5B%5D=Status" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```
查询参数中的方括号必须 URL 编码（`%5B` / `%5D`）。

### 使用命名视图
```bash
curl -s "https://api.airtable.com/v0/$BASE_ID/$TABLE?view=Grid%20view&maxRecords=50" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" | python3 -m json.tool
```
视图在服务器端应用其保存的筛选和排序。

## 常用修改操作

### 创建一条记录
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
批量端点限制为 **每请求 10 条记录**。对于更大的插入，以 10 条为一批循环，并短暂休眠以遵守 5 请求/秒/基地的限制。

### 更新一条记录 (PATCH — 合并，保留未更改的字段)
```bash
curl -s -X PATCH "https://api.airtable.com/v0/$BASE_ID/$TABLE/$RECORD_ID" \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"Status":"Done"}}' | python3 -m json.tool
```

### 按合并字段进行 Upsert (无需 ID)
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
`performUpsert` 创建合并字段值为新记录的记录，修补合并字段值已存在的记录。非常适合幂等同步。

### 删除一条记录
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

列表端点每页最多返回 **100 条记录**。如果响应包含 `"offset": "..."`，在下次调用时传回它。循环直到该字段不存在：

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

1.  **确认认证。** `curl -s -o /dev/null -w "%{http_code}\n" https://api.airtable.com/v0/meta/bases -H "Authorization: Bearer $AIRTABLE_API_KEY"` — 期望返回 `200`。
2.  **找到基地。** 列出基地（如上步骤）或在令牌缺少 `schema.bases:read` 时，直接向用户询问 `app...` ID。
3.  **检查模式。** `GET /v0/meta/bases/$BASE_ID/tables` — 在进行任何修改之前，在会话中本地缓存确切的字段名称和主字段名称。
4.  **先读后写。** 对于“更新 Y 条件下的 X”，首先使用 `filterByFormula` 解析 `rec...` ID，然后使用 `PATCH /v0/$BASE_ID/$TABLE/$RECORD_ID`。永远不要猜测记录 ID。
5.  **批量写入。** 将相关的创建操作合并到一个 10 条记录的 POST 中，以保持在 5 请求/秒的预算内。
6.  **破坏性操作。** 删除无法通过 API 撤销。如果用户说“删除所有 X”，回显筛选条件 + 记录计数，并在执行前确认。

## 常见陷阱

- **`filterByFormula` 必须 URL 编码。** 包含空格或非 ASCII 字符的字段名也需要编码（`{My Field}` → `%7BMy%20Field%7D`）。使用 Python 标准库（如上模式）— 永远不要手动转义。
- **空字段在响应中被省略。** 缺少 `"Assignee"` 键并不意味着该字段不存在 — 它意味着此记录的值为空。在得出字段缺失的结论之前，请检查模式（步骤 3）。
- **PATCH 与 PUT。** `PATCH` 将提供的字段合并到记录中。`PUT` 完全替换记录，并清除您未包含的任何字段。默认使用 `PATCH`。
- **单选选项必须存在。** 当 `Shipping` 不在字段的选项列表中时，写入 `"Status": "Shipping"` 会报错 `INVALID_MULTIPLE_CHOICE_OPTIONS`，除非您传递 `"typecast": true`（这会自动创建选项）。
- **按基地的令牌范围。** 在一个基地上返回 `403` 而另一个基地正常，意味着令牌的访问列表不包含该基地 — 这不是范围或认证问题。请用户前往 https://airtable.com/create/tokens 授予访问权限。
- **速率限制是按基地，不是按令牌。** 在 `baseA` 上 5 请求/秒，在 `baseB` 上 5 请求/秒是可以的；仅在 `baseA` 上 6 请求/秒将被限制。监控 `429` 响应上的 `Retry-After` 头。

## 对 Hermes 的重要说明

- **始终使用 `terminal` 工具配合 `curl`。** 请勿使用 `web_extract`（它无法发送认证头）或 `browser_navigate`（需要界面认证且速度缓慢）。
- **当此技能加载时，`AIRTABLE_API_KEY` 会从 `~/.hermes/.env` 自动流入子进程**——无需在每次 `curl` 调用前重新导出它。
- **在公式中谨慎处理花括号。** 在 heredoc 正文中，`{Status}` 是字面量。在 shell 参数中，在 `{...}` 花括号展开上下文之外，`{Status}` 是安全的——但在将动态字符串拼接进 URL 前，请通过 `python3 urllib.parse.quote` 进行处理。
- **使用 `python3 -m json.tool` 进行格式化输出**（始终可用），而非 `jq`（可选）。仅在需要过滤/投影时才考虑使用 `jq`。
- **分页是逐页进行的，而非全局性的。** Airtable 的 100 条记录上限是硬性限制；无法提高。请使用 `offset` 进行循环，直到该字段不再出现。
- **请阅读非 2xx 响应中的 `errors` 数组**——Airtable 会返回诸如 `AUTHENTICATION_REQUIRED`、`INVALID_PERMISSIONS`、`MODEL_ID_NOT_FOUND`、`INVALID_MULTIPLE_CHOICE_OPTIONS` 这样的结构化错误代码，它们能准确告知问题所在。