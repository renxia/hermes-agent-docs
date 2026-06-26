---
title: "Siyuan"
sidebar_label: "Siyuan"
description: "SiYuan Note API for searching, reading, creating, and managing blocks and documents in a self-hosted knowledge base via curl"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Siyuan

SiYuan Note API for searching, reading, creating, and managing blocks and documents in a self-hosted knowledge base via curl.

## Skill metadata

| | |
|---|---|
| Source | Optional — install with `hermes skills install official/productivity/siyuan` |
| Path | `optional-skills/productivity/siyuan` |
| Version | `1.0.0` |
| Author | FEUAZUR |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `SiYuan`, `Notes`, `Knowledge Base`, `PKM`, `API` |
| Related skills | [`obsidian`](/docs/user-guide/skills/bundled/note-taking/note-taking-obsidian), [`notion`](/docs/user-guide/skills/bundled/productivity/productivity-notion) |

## Reference: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# SiYuan Note API

使用 curl 通过 [SiYuan](https://github.com/siyuan-note/siyuan) kernel API 来搜索、读取、创建、更新和删除自托管知识库中的块（blocks）和文档（documents）。无需额外的工具——只需要 curl 和一个 API 令牌。

## Prerequisites (先决条件)

1. 安装并运行 SiYuan（桌面版或 Docker）。
2. 获取您的 API 令牌：**设置 > 关于 > API 令牌**。
3. 将其存储在 `${HERMES_HOME:-~/.hermes}/.env` 中：
   ```
   SIYUAN_TOKEN=your_token_here
   SIYUAN_URL=http://127.0.0.1:6806
   ```
   如果未设置，`SIYUAN_URL` 默认为 `http://127.0.0.1:6806`。

## API Basics (API 基础)

所有 SiYuan API 调用都必须是 **POST 请求并带有 JSON 主体**。每个请求都遵循以下模式：

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/..." \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"param": "value"}'
```

响应是带有以下结构的 JSON：
```json
{"code": 0, "msg": "", "data": { ... }}
```
`code: 0` 表示成功。任何其他值都表示错误——请检查 `msg` 以获取详细信息。

**ID 格式:** SiYuan ID 类似于 `20210808180117-6v0mkxr`（14 位数字时间戳 + 7 个字母数字字符）。

## Quick Reference (快速参考)

| Operation (操作) | Endpoint (端点) |
|-----------|----------|
| Full-text search (全文搜索) | `/api/search/fullTextSearchBlock` |
| SQL query (SQL 查询) | `/api/query/sql` |
| Read block (读取块) | `/api/block/getBlockKramdown` |
| Read children (读取子块) | `/api/block/getChildBlocks` |
| Get path (获取路径) | `/api/filetree/getHPathByID` |
| Get attributes (获取属性) | `/api/attr/getBlockAttrs` |
| List notebooks (列出笔记本) | `/api/notebook/lsNotebooks` |
| List documents (列出文档) | `/api/filetree/listDocsByPath` |
| Create notebook (创建笔记本) | `/api/notebook/createNotebook` |
| Create document (创建文档) | `/api/filetree/createDocWithMd` |
| Append block (追加块) | `/api/block/appendBlock` |
| Update block (更新块) | `/api/block/updateBlock` |
| Rename document (重命名文档) | `/api/filetree/renameDocByID` |
| Set attributes (设置属性) | `/api/attr/setBlockAttrs` |
| Delete block (删除块) | `/api/block/deleteBlock` |
| Delete document (删除文档) | `/api/filetree/removeDocByID` |
| Export as Markdown (导出为 Markdown) | `/api/export/exportMdContent` |

## Common Operations (常用操作)

### Search (Full-Text) (全文搜索)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/search/fullTextSearchBlock" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "meeting notes", "page": 0}' | jq '.data.blocks[:5]'
```

### Search (SQL) (SQL 查询)

直接查询块数据库。只有 SELECT 语句是安全的。

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/query/sql" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stmt": "SELECT id, content, type, box FROM blocks WHERE content LIKE '\''%keyword%'\'' AND type='\''p'\'' LIMIT 20"}' | jq '.data'
```

有用字段：`id`, `parent_id`, `root_id`, `box` (笔记本 ID), `path`, `content`, `type`, `subtype`, `created`, `updated`。

### Read Block Content (读取块内容)

返回 Kramdown（类似 Markdown）格式的块内容。

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/block/getBlockKramdown" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "20210808180117-6v0mkxr"}' | jq '.data.kramdown'
```

### Read Child Blocks (读取子块)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/block/getChildBlocks" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "20210808180117-6v0mkxr"}' | jq '.data'
```

### Get Human-Readable Path (获取人类可读路径)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/filetree/getHPathByID" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "20210808180117-6v0mkxr"}' | jq '.data'
```

### Get Block Attributes (获取块属性)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/attr/getBlockAttrs" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "20210808180117-6v0mkxr"}' | jq '.data'
```

### List Notebooks (列出笔记本)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/notebook/lsNotebooks" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.data.notebooks[] | {id, name, closed}'
```

### List Documents in a Notebook (列出笔记本中的文档)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/filetree/listDocsByPath" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notebook": "NOTEBOOK_ID", "path": "/"}' | jq '.data.files[] | {id, name}'
```

### Create a Document (创建文档)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/filetree/createDocWithMd" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notebook": "NOTEBOOK_ID",
    "path": "/Meeting Notes/2026-03-22",
    "markdown": "# Meeting Notes\n\n- Discussed project timeline\n- Assigned tasks"
  }' | jq '.data'
```

### Create a Notebook (创建笔记本)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/notebook/createNotebook" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My New Notebook"}' | jq '.data.notebook.id'
```

### Append Block to Document (向文档追加块)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/block/appendBlock" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentID": "DOCUMENT_OR_BLOCK_ID",
    "data": "New paragraph added at the end.",
    "dataType": "markdown"
  }' | jq '.data'
```

另有 `/api/block/prependBlock`（参数相同，在开头插入）和 `/api/block/insertBlock`（使用 `previousID` 而非 `parentID` 来在特定块之后插入）。

### Update Block Content (更新块内容)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/block/updateBlock" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "BLOCK_ID",
    "data": "Updated content here.",
    "dataType": "markdown"
  }' | jq '.data'
```

### Rename a Document (重命名文档)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/filetree/renameDocByID" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "DOCUMENT_ID", "title": "New Title"}'
```

### Set Block Attributes (设置块属性)

自定义属性必须以 `custom-` 开头：

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/attr/setBlockAttrs" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "BLOCK_ID",
    "attrs": {
      "custom-status": "reviewed",
      "custom-priority": "high"
    }
  }'
```

### Delete a Block (删除块)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/block/deleteBlock" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "BLOCK_ID"}'
```

要删除整个文档：使用 `/api/filetree/removeDocByID` 并传入 `{"id": "DOC_ID"}`。
要删除笔记本：使用 `/api/notebook/removeNotebook` 并传入 `{"notebook": "NOTEBOOK_ID"}`。

### Export Document as Markdown (将文档导出为 Markdown)

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/export/exportMdContent" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "DOCUMENT_ID"}' | jq -r '.data.content'
```

## Block Types (块类型)

SQL 查询中常见的 `type` 值：

| Type | Description (描述) |
|------|-------------|
| `d` | Document (文档/根块) |
| `p` | Paragraph (段落) |
| `h` | Heading (标题) |
| `l` | List (列表) |
| `i` | List item (列表项) |
| `c` | Code block (代码块) |
| `m` | Math block (数学块) |
| `t` | Table (表格) |
| `b` | Blockquote (引用块) |
| `s` | Super block (超级块) |
| `html` | HTML block (HTML 块) |

## Pitfalls (潜在陷阱)

- **所有端点都是 POST** ——即使是只读操作。不要使用 GET。
- **SQL 安全性**: 只使用 SELECT 查询。INSERT/UPDATE/DELETE/DROP 是危险的，绝不应该发送。
- **ID 验证**: ID 必须匹配 `YYYYMMDDHHmmss-xxxxxxx` 的模式。拒绝任何其他格式。
- **错误响应**: 在处理 `data` 之前，务必检查响应中的 `code != 0`。
- **大型文档**: 块内容和导出结果可能会非常大。在 SQL 中使用 `LIMIT` 并通过 `jq` 进行管道传输，以仅提取所需的内容。
- **笔记本 ID**: 当操作特定笔记本时，请先通过 `lsNotebooks` 获取其 ID。

## Alternative: MCP Server (替代方案：MCP 服务器)

如果您更喜欢原生集成而不是 curl，请安装 SiYuan MCP 服务器：

```yaml
# 在 ~/.hermes/config.yaml 的 mcp_servers 下方配置：
mcp_servers:
  siyuan:
    command: npx
    args: ["-y", "@porkll/siyuan-mcp"]
    env:
      SIYUAN_TOKEN: "your_token"
      SIYUAN_URL: "http://127.0.0.1:6806"
```