title: "Notion — Notion API + ntn CLI: 页面、数据库、Markdown 和工作者"
sidebar_label: "Notion"
description: "Notion API + ntn CLI: 页面、数据库、Markdown 和工作者"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Notion

Notion API + ntn CLI: 页面、数据库、Markdown 和工作者。

## 技能元数据

| | |
|---|---|
| Source | Bundled (内置的，默认安装) |
| Path | `skills/productivity/notion` |
| Version | `2.0.0` |
| Author | community |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `Notion`, `生产力`, `笔记`, `数据库`, `API`, `CLI`, `工作者` |

## 关键路径和配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥和秘密信息（如果设置了 $HERMES_HOME）
$HERMES_HOME
```

# Notion

可以通过两种方式与 Notion 对接。同一个集成令牌适用于这两种方式——请根据可用性进行选择。

◆ **`ntn` CLI** — Notion 官方命令行工具。语法更简洁，支持单行文件上传，Workers 所必需。截至 2026 年 5 月份仅支持 macOS + Linux（Windows 支持“即将推出”）。**安装后默认使用。**
◆ **HTTP + curl** — 在所有地方都有效，包括 Windows。当 `ntn` 未安装时**默认回退方案**。

## 设置

### 1. 获取集成令牌（两种路径均必需）

1. 访问 https://notion.so/my-integrations 创建一个集成
2. 复制 API 密钥（以 `ntn_` 或 `secret_` 开头）
3. 存储在 `${HERMES_HOME:-~/.hermes}/.env` 中：
   ```
   NOTION_API_KEY=ntn_your_key_here
   ```
4. **将目标页面/数据库与集成共享**到 Notion：页面菜单 `...` → `连接到 (Connect to)` → 您的集成名称。如果没有这一步，即使该页面存在，API 也会返回 404 错误。

### 2. 安装 `ntn`（macOS / Linux 的首选路径）

```bash
# 推荐方式
curl -fsSL https://ntn.dev | bash

# 或通过 npm (需要 Node 22+，npm 10+)
npm install --global ntn

ntn --version    # 验证安装
```

**跳过 `ntn login` — 请使用集成令牌。** 这可以在无浏览器的情况下进行操作：
```bash
export NOTION_API_TOKEN=$NOTION_API_KEY      # ntn 读取 NOTION_API_TOKEN
export NOTION_KEYRING=0                       # 不要尝试使用操作系统密钥链
```

将这些导出命令添加到您的 shell 配置文件（或添加到 `${HERMES_HOME:-~/.hermes}/.env`）中，以便每次会话都能继承它们。

### 3. 在运行时选择路径

```bash
if command -v ntn >/dev/null 2>&1; then
  # 使用 ntn
else
  # 回退到 curl
fi
```

Windows 用户：请跳过第 2 步，直到原生 `ntn` 发布为止——路径 B 可以正常工作。如果您现在想要 CLI 的便捷性，请在 WSL2 中安装 `ntn`。

## API 基础知识

所有 HTTP 请求都需要指定 `Notion-Version: 2025-09-03`。`ntn` 会为您处理这一点。在这个版本中，用户所说的“数据库”在 API 中被称为**数据源 (data sources)**。

## 路径 A — `ntn` CLI（首选，macOS / Linux）

### 原生 API 调用（curl 的简写）
```bash
ntn api v1/users                                  # GET
ntn api v1/pages parent[page_id]=abc123 \         # POST 带有内联主体
  properties[title][0][text][content]="Notes"
ntn api v1/pages/abc123 -X PATCH archived:=true   # PATCH；:= 表示非字符串类型（布尔值/数字/null）
```

语法说明：
- `key=value` — 字符串字段
- `key[nested]=value` — 嵌套对象字段
- `key:=value` — 类型赋值（布尔值、数字、null、数组）

### 搜索
```bash
ntn api v1/search query="page title"
```

### 读取页面元数据
```bash
ntn api v1/pages/{page_id}
```

### 以 Markdown 形式读取页面（智能体友好）
```bash
ntn api v1/pages/{page_id}/markdown
```

### 以块 (blocks) 的形式读取页面
```bash
ntn api v1/blocks/{page_id}/children
```

### 从 Markdown 创建页面
```bash
ntn api v1/pages \
  parent[page_id]=xxx \
  properties[title][0][text][content]="Notes from meeting" \
  markdown="# Agenda

- Q3 roadmap
- Hiring"
```

### 使用 Markdown 补丁更新页面
```bash
ntn api v1/pages/{page_id}/markdown -X PATCH \
  markdown="## Update

Shipped the prototype."
```

### 查询数据库（数据源）
```bash
ntn api v1/data_sources/{data_source_id}/query -X POST \
  filter[property]=Status filter[select][equals]=Active
```

对于包含 `sorts`、多个过滤条款或复合逻辑的复杂查询，请通过管道（pipe）输入 JSON：
```bash
echo '{"filter": {"property": "Status", "select": {"equals": "Active"}}, "sorts": [{"property": "Date", "direction": "descending"}]}' | \
  ntn api v1/data_sources/{data_source_id}/query -X POST --json -
```

### 文件上传（单行命令 — CLI 的最大优势）
```bash
ntn files create < photo.png
ntn files create --external-url https://example.com/photo.png
ntn files list
```

与 3 步 HTTP 流程（创建上传 → PUT 字节流 → 参考引用）进行比较。

### 有用的环境变量
| 变量 | 作用 |
|---|---|
| `NOTION_API_TOKEN` | 认证令牌（覆盖密钥链）— 请将其设置为您的集成令牌 |
| `NOTION_KEYRING=0` | 在 `~/.config/notion/auth.json` 而非操作系统密钥链中进行基于文件的凭证存储 |
| `NOTION_WORKSPACE_ID` | 跳过工作区选择提示 |

## 路径 B — HTTP + curl（跨平台，Windows 默认）

所有请求都遵循此模式：

```bash
curl -s -X GET "https://api.notion.com/v1/..." \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json"
```

在 Windows 上，随 Windows 10+ 附带的 `curl` 可以直接使用。PowerShell 用户也可以使用 `Invoke-RestMethod`。

### 搜索
```bash
curl -s -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"query": "page title"}'
```

### 读取页面元数据
```bash
curl -s "https://api.notion.com/v1/pages/{page_id}" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03"
```

### 以 Markdown 形式读取页面（智能体友好）

这比块 JSON 更容易喂给模型。

```bash
curl -s "https://api.notion.com/v1/pages/{page_id}/markdown" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03"
```

### 以块 (blocks) 的形式读取页面（当您需要结构时）
```bash
curl -s "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03"
```

### 从 Markdown 创建页面

`POST /v1/pages` 接受一个 `markdown` 主体参数。

```bash
curl -s -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"page_id": "xxx"},
    "properties": {"title": [{"text": {"content": "Notes from meeting"}}]},
    "markdown": "# Agenda\n\n- Q3 roadmap\n- Hiring\n\n## Decisions\n- Ship MVP Friday"
  }'
```

### 使用 Markdown 补丁更新页面
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/{page_id}/markdown" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"markdown": "## Update\n\nShipped the prototype."}'
```

### 在数据库中创建页面（类型化属性）
```bash
curl -s -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"database_id": "xxx"},
    "properties": {
      "Name": {"title": [{"text": {"content": "New Item"}}]},
      "Status": {"select": {"name": "Todo"}}
    }
  }'
```

### 查询数据库（数据源）
```bash
curl -s -X POST "https://api.notion.com/v1/data_sources/{data_source_id}/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {"property": "Status", "select": {"equals": "Active"}},
    "sorts": [{"property": "Date", "direction": "descending"}]
  }'
```

### 创建数据库
```bash
curl -s -X POST "https://api.notion.com/v1/data_sources" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"page_id": "xxx"},
    "title": [{"text": {"content": "My Database"}}],
    "properties": {
      "Name": {"title": {}},
      "Status": {"select": {"options": [{"name": "Todo"}, {"name": "Done"}]}},
      "Date": {"date": {}}
    }
  }'
```

### 更新页面属性
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/{page_id}" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Status": {"select": {"name": "Done"}}}}'
```

### 向页面追加块 (Append blocks to a page)
```bash
curl -s -X PATCH "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "children": [
      {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": "Hello from Hermes!"}}]}}
    ]
  }'
```

### 文件上传（3 步流程）
```bash
# 1. 创建上传
curl -s -X POST "https://api.notion.com/v1/file_uploads" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"filename": "photo.png", "content_type": "image/png"}'

# 2. 将字节流 PUT 到上面返回的 upload_url
curl -s -X PUT "{upload_url}" --data-binary @photo.png

# 3. 在页面/块负载中引用 {file_upload_id}
```

## 属性类型 (Property Types)

数据库项的常见属性格式：

- **标题 (Title):** `{"title": [{"text": {"content": "..."}}]}`
- **富文本 (Rich text):** `{"rich_text": [{"text": {"content": "..."}}]}`
- **单选 (Select):** `{"select": {"name": "Option"}}`
- **多选 (Multi-select):** `{"multi_select": [{"name": "A"}, {"name": "B"}]}`
- **日期 (Date):** `{"date": {"start": "2026-01-15", "end": "2026-01-16"}}`
- **复选框 (Checkbox):** `{"checkbox": true}`
- **数字 (Number):** `{"number": 42}`
- **URL:** `{"url": "https://..."}`
- **电子邮件 (Email):** `{"email": "user@example.com"}`
- **关系 (Relation):** `{"relation": [{"id": "page_id"}]}`

## API 版本 2025-09-03 — 数据库 vs 数据源

- **数据库已成为数据源。** 使用 `/data_sources/` 端点进行查询和检索。
- **每个数据库有两个 ID：** `database_id` 和 `data_source_id`。
  - 创建页面时使用 `database_id`: `parent: {"database_id": "..."}`
  - 查询时使用 `data_source_id`: `POST /v1/data_sources/{id}/query`
- 搜索结果以 `"object": "data_source"` 的形式返回数据库，并包含 `data_source_id` 字段。

## Notion Workers（高级功能，需要 `ntn`）

Workers 是 Notion 为您托管的 TypeScript 程序。一个 Worker 可以暴露任何组合：
- **同步 (Syncs)** — 定期地将外部 API 的数据拉取到 Notion 数据库中（默认 30 分钟）。
- **工具 (Tools)** — 在 Notion 的自定义智能体 (Custom Agents) 中显示为可调用工具。
- **Webhook** — 从外部服务（GitHub、Stripe 等）接收 HTTP 事件并进行操作。

**计划/平台限制：**
- CLI 在所有计划上均有效。**部署 Workers 需要 Business 或 Enterprise 级别。**
- `ntn` 截至 2026 年 5 月份仅支持 macOS/Linux。Windows 用户需要 WSL2 或等待原生支持。
- 免费使用直到 2026 年 8 月 11 日；之后将根据 Notion 积分进行计费。

### 最小化 Worker

```bash
ntn workers new my-worker      # 创建骨架
cd my-worker
# 编辑 src/index.ts
ntn workers deploy --name my-worker
```

`src/index.ts`:
```typescript
import { Worker } from "@notionhq/workers";

const worker = new Worker();
export default worker;

worker.tool("greet", {
  title: "Greet a User",
  description: "Returns a friendly greeting",
  inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  execute: async ({ name }) => `Hello, ${name}!`,
});
```

### Webhook 功能

```typescript
worker.webhook("onGithubPush", {
  title: "GitHub Push Handler",
  execute: async (events, { notion }) => {
    for (const event of events) {
      // event.body, event.rawBody (用于签名验证), event.headers
      console.log("got delivery", event.deliveryId);
    }
  },
});
```

部署后：`ntn workers webhooks list` 会显示 Notion 生成的 URL。请将该 URL 视为一个秘密信息——除非您添加了签名验证，否则任何人拥有它都可以 POST 事件。

### Worker 生命周期命令

```bash
ntn workers deploy
ntn workers list
ntn workers exec <capability-key> -d '{"name": "world"}'
ntn workers sync trigger <key>            # 立即运行一次同步
ntn workers sync pause <key>
ntn workers env set GITHUB_WEBHOOK_SECRET=...
ntn workers runs list                     # 最近的调用记录
ntn workers runs logs <run-id>
ntn workers webhooks list
```

当被要求构建 Worker 时，请使用 `ntn workers new` 创建骨架，在 `src/index.ts` 中编写代码，使用 `ntn workers env set` 设置任何秘密信息，然后部署。Notion 的文档（https://developers.notion.com/workers）涵盖了完整的 API 表面。

## 选择正确的路径

| 任务 | mac / Linux | Windows |
|---|---|---|
| 读取/写入页面、搜索、查询数据库 | `ntn api ...` | curl |
| 为智能体读取页面以进行摘要 | `ntn api v1/pages/{id}/markdown` | curl `/markdown` endpoint |
| 上传文件 | `ntn files create < file` | 3-step HTTP flow |
| 一次性 API 探索 | `ntn api ...` | curl |
| 构建由 Notion 托管的同步/webhook/智能体工具 | `ntn workers ...` | WSL2 + `ntn workers ...` |

## 说明

*   页面/数据库 ID 是 UUID（有或无连字符——均可接受）。
*   速率限制：平均约 3 个请求/秒。CLI 不会绕过此限制。
*   API 无法设置数据库**视图**过滤器——这仅限于用户界面（UI）。
*   创建数据源时，请使用 `"is_inline": true` 以将其嵌入到页面中。
*   始终向 curl 传递 `-s` 参数以抑制进度条（使智能体输出更清晰）。
*   读取时，请通过 `jq` 处理 JSON：`... | jq '.results[0].properties'`。
*   Notion 现在也提供了 MCP 服务器（`Notion MCP`，比旧版本在数据库操作上能耗约节省 91% 的令牌）——如果你想在一个会话中实现流式 Notion 访问，可以通过 Hermes 的 MCP 支持来连接它，但上述路径对于大多数一次性任务来说已经足够了。