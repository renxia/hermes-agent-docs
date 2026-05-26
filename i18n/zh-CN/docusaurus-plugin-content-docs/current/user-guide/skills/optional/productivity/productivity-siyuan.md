---
title: "思源笔记"
sidebar_label: "思源笔记"
description: "思源笔记 API，用于通过 curl 在自托管知识库中搜索、读取、创建和管理内容块与文档"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 思源笔记

思源笔记 API，用于通过 curl 在自托管知识库中搜索、读取、创建和管理内容块与文档。

## 技能元数据

| | |
|---|---|
| Source | 可选 — 通过 `hermes skills install official/productivity/siyuan` 安装 |
| Path | `optional-skills/productivity/siyuan` |
| Version | `1.0.0` |
| Author | FEUAZUR |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `SiYuan`, `笔记`, `知识库`, `PKM`, `API` |
| Related skills | [`obsidian`](/user-guide/skills/bundled/note-taking/note-taking-obsidian), [`notion`](/user-guide/skills/bundled/productivity/productivity-notion) |

## 参考：完整的 SKILL.md 文件

:::info
以下是当触发此技能时，Hermes 加载的完整技能定义。这是技能处于活动状态时智能体看到的指令。
:::

# 思源笔记 API

通过 curl 使用 [思源笔记](https://github.com/siyuan-note/siyuan) 的内核 API，来在自托管知识库中搜索、读取、创建、更新和删除内容块与文档。无需额外工具——只需 curl 和 API 令牌即可。

## 前置条件

1. 安装并运行思源笔记（桌面版或 Docker 版）
2. 获取您的 API 令牌：**设置 > 关于 > API 令牌**
3. 将其存储到 `~/.hermes/.env` 文件中：
   ```
   SIYUAN_TOKEN=your_token_here
   SIYUAN_URL=http://127.0.0.1:6806
   ```
   `SIYUAN_URL` 默认值为 `http://127.0.0.1:6806`（如果未设置）。

## API 基础

所有思源笔记 API 调用都是 **带有 JSON 请求体的 POST 请求**。每个请求都遵循此模式：

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/..." \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"param": "value"}'
```

响应为 JSON 格式，结构如下：
```json
{"code": 0, "msg": "", "data": { ... }}
```
`code: 0` 表示成功。任何其他值均表示错误——请检查 `msg` 以获取详细信息。

**ID 格式：** 思源笔记的 ID 形如 `20210808180117-6v0mkxr`（14 位时间戳 + 7 位字母数字字符）。

## 快速参考

| 操作 | 端点 |
|-----------|----------|
| 全文搜索 | `/api/search/fullTextSearchBlock` |
| SQL 查询 | `/api/query/sql` |
| 读取块 | `/api/block/getBlockKramdown` |
| 读取子块 | `/api/block/getChildBlocks` |
| 获取路径 | `/api/filetree/getHPathByID` |
| 获取属性 | `/api/attr/getBlockAttrs` |
| 列出笔记本 | `/api/notebook/lsNotebooks` |
| 列出文档 | `/api/filetree/listDocsByPath` |
| 创建笔记本 | `/api/notebook/createNotebook` |
| 创建文档 | `/api/filetree/createDocWithMd` |
| 追加块 | `/api/block/appendBlock` |
| 更新块 | `/api/block/updateBlock` |
| 重命名文档 | `/api/filetree/renameDocByID` |
| 设置属性 | `/api/attr/setBlockAttrs` |
| 删除块 | `/api/block/deleteBlock` |
| 删除文档 | `/api/filetree/removeDocByID` |
| 导出为 Markdown | `/api/export/exportMdContent` |

## 常用操作

### 搜索（全文）

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/search/fullTextSearchBlock" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "会议笔记", "page": 0}' | jq '.data.blocks[:5]'
```

### 搜索（SQL）

直接查询块数据库。仅 SELECT 语句是安全的。

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/query/sql" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stmt": "SELECT id, content, type, box FROM blocks WHERE content LIKE '\''%关键词%'\'' AND type='\''p'\'' LIMIT 20"}' | jq '.data'
```

常用列：`id`, `parent_id`, `root_id`, `box` (笔记本 ID), `path`, `content`, `type`, `subtype`, `created`, `updated`。

### 读取块内容

以 Kramdown（类似 Markdown）格式返回块内容。

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/block/getBlockKramdown" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "20210808180117-6v0mkxr"}' | jq '.data.kramdown'
```

### 读取子块

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/block/getChildBlocks" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "20210808180117-6v0mkxr"}' | jq '.data'
```

### 获取人类可读路径

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/filetree/getHPathByID" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "20210808180117-6v0mkxr"}' | jq '.data'
```

### 获取块属性

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/attr/getBlockAttrs" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "20210808180117-6v0mkxr"}' | jq '.data'
```

### 列出笔记本

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/notebook/lsNotebooks" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.data.notebooks[] | {id, name, closed}'
```

### 列出笔记本中的文档

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/filetree/listDocsByPath" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notebook": "笔记本ID", "path": "/"}' | jq '.data.files[] | {id, name}'
```

### 创建文档

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/filetree/createDocWithMd" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notebook": "笔记本ID",
    "path": "/会议笔记/2026-03-22",
    "markdown": "# 会议笔记\n\n- 讨论了项目时间线\n- 分配了任务"
  }' | jq '.data'
```

### 创建笔记本

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/notebook/createNotebook" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "我的新笔记本"}' | jq '.data.notebook.id'
```

### 向文档追加块

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/block/appendBlock" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentID": "文档或块的ID",
    "data": "在末尾添加的新段落。",
    "dataType": "markdown"
  }' | jq '.data'
```

同样可用：`/api/block/prependBlock`（参数相同，在开头插入）和 `/api/block/insertBlock`（使用 `previousID` 而不是 `parentID`，以在特定块之后插入）。

### 更新块内容

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/block/updateBlock" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "块ID",
    "data": "此处为更新后的内容。",
    "dataType": "markdown"
  }' | jq '.data'
```

### 重命名文档

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/filetree/renameDocByID" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "文档ID", "title": "新标题"}'
```

### 设置块属性

自定义属性必须以 `custom-` 为前缀：

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/attr/setBlockAttrs" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "块ID",
    "attrs": {
      "custom-status": "已审阅",
      "custom-priority": "高"
    }
  }'
```

### 删除块

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/block/deleteBlock" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "块ID"}'
```

删除整个文档：使用 `/api/filetree/removeDocByID`，参数为 `{"id": "文档ID"}`。
删除笔记本：使用 `/api/notebook/removeNotebook`，参数为 `{"notebook": "笔记本ID"}`。

### 将文档导出为 Markdown

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/export/exportMdContent" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "文档ID"}' | jq -r '.data.content'
```

## 块类型

SQL 查询中常见的 `type` 值：

| 类型 | 描述 |
|------|-------------|
| `d` | 文档（根块） |
| `p` | 段落 |
| `h` | 标题 |
| `l` | 列表 |
| `i` | 列表项 |
| `c` | 代码块 |
| `m` | 数学块 |
| `t` | 表格 |
| `b` | 引述块 |
| `s` | 超级块 |
| `html` | HTML 块 |

## 注意事项

- **所有端点都是 POST 请求** ——即使是只读操作。请勿使用 GET。
- **SQL 安全**：仅使用 SELECT 查询。INSERT/UPDATE/DELETE/DROP 是危险的，绝不应发送。
- **ID 验证**：ID 符合模式 `YYYYMMDDHHmmss-xxxxxxx`。拒绝任何其他格式。
- **错误响应**：在处理 `data` 之前，始终检查响应中的 `code != 0`。
- **大型文档**：块内容和导出结果可能非常大。在 SQL 中使用 `LIMIT`，并通过 `jq` 管道提取所需内容。
- **笔记本 ID**：操作特定笔记本时，请先通过 `lsNotebooks` 获取其 ID。

## 替代方案：MCP 服务器

如果您更喜欢原生集成而不是 curl，可以安装思源笔记 MCP 服务器：

```yaml
# 在 ~/.hermes/config.yaml 的 mcp_servers 部分下：
mcp_servers:
  siyuan:
    command: npx
    args: ["-y", "@porkll/siyuan-mcp"]
    env:
      SIYUAN_TOKEN: "your_token"
      SIYUAN_URL: "http://127.0.0.1:6806"
```