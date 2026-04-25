---
title: "思源"
sidebar_label: "思源"
description: "通过 curl 调用自托管知识库中的思源笔记 API，实现搜索、读取、创建和管理块和文档"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 思源

通过 curl 调用 [思源笔记](https://github.com/siyuan-note/siyuan) 内核 API，实现搜索、读取、创建、更新和删除自托管知识库中的块和文档。无需额外工具——只需 curl 和一个 API 令牌。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/productivity/siyuan` 安装 |
| 路径 | `optional-skills/productivity/siyuan` |
| 版本 | `1.0.0` |
| 作者 | FEUAZUR |
| 许可证 | MIT |
| 标签 | `SiYuan`, `笔记`, `知识库`, `PKM`, `API` |
| 相关技能 | [`obsidian`](/docs/user-guide/skills/bundled/note-taking/note-taking-obsidian), [`notion`](/docs/user-guide/skills/bundled/productivity/productivity-notion) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是当技能激活时智能体看到的指令。
:::

# 思源笔记 API

使用 [思源笔记](https://github.com/siyuan-note/siyuan) 内核 API 通过 curl 搜索、读取、创建、更新和删除自托管知识库中的块和文档。无需额外工具——只需 curl 和一个 API 令牌。

## 先决条件

1. 安装并运行思源笔记（桌面版或 Docker）
2. 获取您的 API 令牌：**设置 > 关于 > API 令牌**
3. 将其存储在 `~/.hermes/.env` 中：
   ```
   SIYUAN_TOKEN=your_token_here
   SIYUAN_URL=http://127.0.0.1:6806
   ```
   如果未设置，`SIYUAN_URL` 默认为 `http://127.0.0.1:6806`。

## API 基础

所有思源笔记 API 调用都是 **POST 请求并携带 JSON 请求体**。每个请求都遵循此模式：

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/..." \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"param": "value"}'
```

响应是 JSON 格式，结构如下：
```json
{"code": 0, "msg": "", "data": { ... }}
```
`code: 0` 表示成功。任何其他值都表示错误——请检查 `msg` 以获取详细信息。

**ID 格式：** 思源笔记 ID 的格式类似于 `20210808180117-6v0mkxr`（14 位时间戳 + 7 位字母数字字符）。

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

## 常见操作

### 搜索（全文）

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/search/fullTextSearchBlock" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "会议记录", "page": 0}' | jq '.data.blocks[:5]'
```

### 搜索（SQL）

直接查询块数据库。仅 SELECT 语句是安全的。

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/query/sql" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stmt": "SELECT id, content, type, box FROM blocks WHERE content LIKE '\''%关键词%'\'' AND type='\''p'\'' LIMIT 20"}' | jq '.data'
```

有用的列：`id`, `parent_id`, `root_id`, `box`（笔记本 ID）, `path`, `content`, `type`, `subtype`, `created`, `updated`。

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
  -d '{"notebook": "NOTEBOOK_ID", "path": "/"}' | jq '.data.files[] | {id, name}'
```

### 创建文档

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/filetree/createDocWithMd" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notebook": "NOTEBOOK_ID",
    "path": "/会议记录/2026-03-22",
    "markdown": "# 会议记录\n\n- 讨论了项目时间线\n- 分配了任务"
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
    "parentID": "DOCUMENT_OR_BLOCK_ID",
    "data": "在末尾添加的新段落。",
    "dataType": "markdown"
  }' | jq '.data'
```

也可用：`/api/block/prependBlock`（参数相同，插入到开头）和 `/api/block/insertBlock`（使用 `previousID` 而非 `parentID` 在特定块之后插入）。

### 更新块内容

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/block/updateBlock" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "BLOCK_ID",
    "data": "此处为更新后的内容。",
    "dataType": "markdown"
  }' | jq '.data'
```

### 重命名文档

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/filetree/renameDocByID" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "DOCUMENT_ID", "title": "新标题"}'
```

### 设置块属性

自定义属性必须以 `custom-` 为前缀：

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/attr/setBlockAttrs" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "BLOCK_ID",
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
  -d '{"id": "BLOCK_ID"}'
```

要删除整个文档：使用 `/api/filetree/removeDocByID` 并传入 `{"id": "DOC_ID"}`。
要删除笔记本：使用 `/api/notebook/removeNotebook` 并传入 `{"notebook": "NOTEBOOK_ID"}`。

### 将文档导出为 Markdown

```bash
curl -s -X POST "${SIYUAN_URL:-http://127.0.0.1:6806}/api/export/exportMdContent" \
  -H "Authorization: Token $SIYUAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "DOCUMENT_ID"}' | jq -r '.data.content'
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
| `b` | 块引用 |
| `s` | 超级块 |
| `html` | HTML 块 |

## 陷阱

- **所有端点都是 POST**——即使是只读操作。请勿使用 GET。
- **SQL 安全性**：仅使用 SELECT 查询。INSERT/UPDATE/DELETE/DROP 是危险的，绝不应发送。
- **ID 验证**：ID 必须匹配模式 `YYYYMMDDHHmmss-xxxxxxx`。拒绝任何其他格式。
- **错误响应**：在处理 `data` 之前，始终检查响应中的 `code != 0`。
- **大型文档**：块内容和导出结果可能非常大。在 SQL 中使用 `LIMIT` 并通过 `jq` 管道仅提取您需要的内容。
- **笔记本 ID**：处理特定笔记本时，请先通过 `lsNotebooks` 获取其 ID。

## 替代方案：MCP 服务器

如果您更喜欢原生集成而非 curl，请安装思源笔记 MCP 服务器：

```yaml
# 在 ~/.hermes/config.yaml 的 mcp_servers 下：
mcp_servers:
  siyuan:
    command: npx
    args: ["-y", "@porkll/siyuan-mcp"]
    env:
      SIYUAN_TOKEN: "your_token"
      SIYUAN_URL: "http://127.0.0.1:6806"
```