---
title: "Notion — Notion API + ntn CLI: 页面、数据库、Markdown、Workers"
sidebar_label: "Notion"
description: "Notion API + ntn CLI: 页面、数据库、Markdown、Workers"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Notion

Notion API + ntn CLI: 页面、数据库、Markdown、Workers。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/productivity/notion` |
| 版本 | `2.0.0` |
| 作者 | 社区 |
| 许可 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Notion`, `生产力`, `笔记`, `数据库`, `API`, `CLI`, `Workers` |

:::info
以下是 Hermes 加载此技能时看到的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Notion

通过两种方式与 Notion 交互。相同的集成令牌对两者均有效——根据可用性选择。

◆ **`ntn` CLI** — Notion 官方 CLI。语法更短，支持单行文件上传，Workers 必需。截至 2026 年 5 月，仅支持 macOS + Linux（Windows 支持 "即将推出"）。**安装后的默认选项。**
◆ **HTTP + curl** — 在包括 Windows 的所有平台上有效。当 `ntn` 未安装时的**默认回退方案**。

## 设置

### 1. 获取集成令牌（两种路径均必需）

1. 在 https://notion.so/my-integrations 创建集成
2. 复制 API 密钥（以 `ntn_` 或 `secret_` 开头）
3. 存储在 `~/.hermes/.env` 中：
   ```
   NOTION_API_KEY=ntn_your_key_here
   ```
4. 在 Notion 中**将目标页面/数据库与集成共享**：页面菜单 `...` → `Connect to` → 你的集成名称。没有这一步，即使页面存在，API 也会对该页面返回 404。

### 2. 安装 `ntn`（macOS / Linux 上的首选路径）

```bash
# 推荐
curl -fsSL https://ntn.dev | bash

# 或通过 npm（需要 Node 22+，npm 10+）
npm install --global ntn

ntn --version    # 验证安装
```

**跳过 `ntn login` — 改用集成令牌。** 此方法支持无头操作，无需浏览器：
```bash
export NOTION_API_TOKEN=$NOTION_API_KEY      # ntn 读取 NOTION_API_TOKEN
export NOTION_KEYRING=0                       # 不尝试使用操作系统密钥链
```

将这些导出命令添加到你的 shell 配置文件（或 `~/.hermes/.env`），以便每个会话都能继承。

### 3. 运行时选择路径

```bash
if command -v ntn >/dev/null 2>&1; then
  # 使用 ntn
else
  # 回退到 curl
fi
```

Windows 用户：在原生 `ntn` 发布前完全跳过第 2 步——路径 B 运行良好。如果你现在想要 CLI 的便利性，可以在 WSL2 中安装 `ntn`。

## API 基础

所有 HTTP 请求都必须包含 `Notion-Version: 2025-09-03`。`ntn` 会为你处理这个。在此版本中，用户所称的 "数据库" 在 API 中称为**数据源**。

## 路径 A — `ntn` CLI（首选，macOS / Linux）

### 原始 API 调用（curl 的简写）
```bash
ntn api v1/users                                  # GET
ntn api v1/pages parent[page_id]=abc123 \         # POST 带内联主体
  properties[title][0][text][content]="Notes"
ntn api v1/pages/abc123 -X PATCH archived:=true   # PATCH; := 表示非字符串类型（布尔/数字/空值）
```

语法说明：
- `key=value` — 字符串字段
- `key[nested]=value` — 嵌套对象字段
- `key:=value` — 类型化赋值（布尔值、数字、空值、数组）

### 搜索
```bash
ntn api v1/search query="page title"
```

### 读取页面元数据
```bash
ntn api v1/pages/{page_id}
```

### 以 Markdown 格式读取页面（对智能体友好）
```bash
ntn api v1/pages/{page_id}/markdown
```

### 以块形式读取页面内容
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

### 用 Markdown 更新页面
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

对于包含 `sorts`、多个过滤条件或复合逻辑的复杂查询，通过管道传入 JSON：
```bash
echo '{"filter": {"property": "Status", "select": {"equals": "Active"}}, "sorts": [{"property": "Date", "direction": "descending"}]}' | \
  ntn api v1/data_sources/{data_source_id}/query -X POST --json -
```

### 文件上传（单行命令——CLI 的最大优势）
```bash
ntn files create < photo.png
ntn files create --external-url https://example.com/photo.png
ntn files list
```

与三步 HTTP 流程（创建上传 → PUT 字节 → 引用）相比。

### 有用的环境变量
| 变量 | 效果 |
|---|---|
| `NOTION_API_TOKEN` | 认证令牌（覆盖密钥链）——设置为你的集成令牌 |
| `NOTION_KEYRING=0` | 使用基于文件的凭证存储在 `~/.config/notion/auth.json`，而不是操作系统密钥链 |
| `NOTION_WORKSPACE_ID` | 跳过工作区选择器提示 |

## 路径 B — HTTP + curl（跨平台，Windows 默认）

所有请求都遵循此模式：

```bash
curl -s -X GET "https://api.notion.com/v1/..." \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json"
```

在 Windows 上，Windows 10+ 附带的 `curl` 可直接使用。PowerShell 用户也可以使用 `Invoke-RestMethod`。

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

### 以 Markdown 格式读取页面（对智能体友好）

比块 JSON 更容易输入给模型。

```bash
curl -s "https://api.notion.com/v1/pages/{page_id}/markdown" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03"
```

### 以块形式读取页面内容（当你需要结构时）
```bash
curl -s "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03"
```

### 从 Markdown 创建页面

`POST /v1/pages` 接受一个 `markdown` 请求体参数。

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

### 用 Markdown 更新页面
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/{page_id}/markdown" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"markdown": "## Update\n\nShipped the prototype."}'
```

### 在数据库中创建页面（带类型的属性）
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

### 向页面追加块
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

### 文件上传（三步流程）
```bash
# 1. 创建上传
curl -s -X POST "https://api.notion.com/v1/file_uploads" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"filename": "photo.png", "content_type": "image/png"}'

# 2. 将字节 PUT 到上面返回的 upload_url
curl -s -X PUT "{upload_url}" --data-binary @photo.png

# 3. 在页面/块有效负载中引用 {file_upload_id}
```

## 属性类型

数据库项目的常见属性格式：

- **Title（标题）:** `{"title": [{"text": {"content": "..."}}]}`
- **Rich text（富文本）:** `{"rich_text": [{"text": {"content": "..."}}]}`
- **Select（选择）:** `{"select": {"name": "Option"}}`
- **Multi-select（多选）:** `{"multi_select": [{"name": "A"}, {"name": "B"}]}`
- **Date（日期）:** `{"date": {"start": "2026-01-15", "end": "2026-01-16"}}`
- **Checkbox（复选框）:** `{"checkbox": true}`
- **Number（数字）:** `{"number": 42}`
- **URL（网址）:** `{"url": "https://..."}`
- **Email（邮箱）:** `{"email": "user@example.com"}`
- **Relation（关联）:** `{"relation": [{"id": "page_id"}]}`

## API 版本 2025-09-03 — 数据库 vs 数据源

- **数据库已变为数据源。** 请使用 `/data_sources/` 端点进行查询和检索。
- **每个数据库有两个 ID：** `database_id` 和 `data_source_id`。
  - 创建页面时使用 `database_id`：`parent: {"database_id": "..."}`
  - 查询时使用 `data_source_id`：`POST /v1/data_sources/{id}/query`
- 搜索会将数据库作为 `"object": "data_source"` 返回，并包含 `data_source_id` 字段。

## Notion Workers（高级功能，需要 `ntn`）

Workers 是 Notion 为你托管的 TypeScript 程序。一个 worker 可以暴露以下任意组合：
- **同步** — 按计划（默认 30 分钟）从外部 API 将数据拉取到 Notion 数据库。
- **工具** — 作为可调用工具出现在 Notion 的自定义智能体中。
- **Webhooks** — 接收来自外部服务（GitHub、Stripe 等）的 HTTP 事件，并在 Notion 中执行操作。

**计划 / 平台限制：**
- CLI 在所有计划上均可使用。**部署 Workers 需要商业版或企业版。**
- 截至 2026 年 5 月，`ntn` 仅支持 macOS/Linux。Windows 用户需要使用 WSL2 或等待原生支持。
- 在 2026 年 8 月 11 日前免费；之后将根据 Notion 积分计量收费。

### 最小化 Worker

```bash
ntn workers new my-worker      # 脚手架
cd my-worker
# 编辑 src/index.ts
ntn workers deploy --name my-worker
```

`src/index.ts`：
```typescript
import { Worker } from "@notionhq/workers";

const worker = new Worker();
export default worker;

worker.tool("greet", {
  title: "问候用户",
  description: "返回一个友好的问候",
  inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  execute: async ({ name }) => `你好，${name}！`,
});
```

### Webhook 功能

```typescript
worker.webhook("onGithubPush", {
  title: "GitHub 推送处理器",
  execute: async (events, { notion }) => {
    for (const event of events) {
      // event.body, event.rawBody（用于签名验证），event.headers
      console.log("收到投递", event.deliveryId);
    }
  },
});
```

部署后：`ntn workers webhooks list` 会显示 Notion 生成的 URL。将该 URL 视为机密 — 除非你添加了签名验证，否则任何拥有该 URL 的人都可以发送 POST 事件。

### Worker 生命周期命令

```bash
ntn workers deploy
ntn workers list
ntn workers exec <capability-key> -d '{"name": "world"}'
ntn workers sync trigger <key>            # 立即运行同步
ntn workers sync pause <key>
ntn workers env set GITHUB_WEBHOOK_SECRET=...
ntn workers runs list                     # 近期调用记录
ntn workers runs logs <run-id>
ntn workers webhooks list
```

当被要求构建一个 Worker 时，请使用 `ntn workers new` 创建脚手架，在 `src/index.ts` 中编写代码，使用 `ntn workers env set` 设置任何密钥，然后部署。Notion 的文档（https://developers.notion.com/workers）涵盖了完整的 API 接口。

## Notion 风格 Markdown（用于 `/markdown` 端点）

标准 CommonMark 加上用于 Notion 特定块的 XML 类标签。使用**制表符**进行缩进。

**超出 CommonMark 的块：**
```
<callout icon="🎯" color="blue_bg">
	在**周五**前交付 MVP。
</callout>

<details color="gray">
<summary>切换标题</summary>
	子内容缩进一个制表符
</details>

<columns>
	<column>左侧</column>
	<column>右侧</column>
</columns>

<table_of_contents color="gray"/>
```

**行内：**
- 提及：`<mention-user url="..."/>`，`<mention-page url="...">标题</mention-page>`，`<mention-date start="2026-05-15"/>`
- 下划线：`<span underline="true">文本</span>`
- 颜色：`<span color="blue">文本</span>` 或块级 `{color="blue"}` 用于第一行
- 数学公式：行内 `$x^2$`，块级 `$$ ... $$`
- 引用：`[^https://example.com]`

**颜色：** `gray brown orange yellow green blue purple pink red`，加上用于背景的 `*_bg` 变体。

标题 5/6 会折叠为 H4。多个 `>` 行会渲染为单独的引用块 — 要在单个 `>` 中使用 `<br>` 进行多行引用。

## 选择正确的路径

| 任务 | Mac / Linux | Windows |
|---|---|---|
| 读取/写入页面、搜索、查询数据库 | `ntn api ...` | curl |
| 读取页面供智能体总结 | `ntn api v1/pages/{id}/markdown` | curl `/markdown` 端点 |
| 上传文件 | `ntn files create < file` | 三步 HTTP 流程 |
| 一次性 API 探索 | `ntn api ...` | curl |
| 构建由 Notion 托管的同步 / webhook / 智能体工具 | `ntn workers ...` | WSL2 + `ntn workers ...` |

## 注意事项

- 页面/数据库 ID 是 UUID（可以带或不带连字符 — 两种格式均可接受）。
- 速率限制：平均约每秒 3 个请求。CLI 无法绕过此限制。
- API 无法设置数据库**视图**过滤器 — 这仅限于用户界面。
- 创建数据源时使用 `"is_inline": true` 以将其嵌入页面。
- 使用 curl 时始终传递 `-s` 以抑制进度条（使智能体输出更清晰）。
- 读取时通过 `jq` 管道传递 JSON：`... | jq '.results[0].properties'`。
- Notion 现在还提供了一个 MCP 服务器（`Notion MCP`，在数据库操作上比以前版本节省约 91% 的令牌）— 如果你想在会话内通过流式访问 Notion，可以通过 Hermes 的 MCP 支持进行连接，但上述路径对于大多数一次性任务已经足够。