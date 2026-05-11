---
title: "Notion — 通过curl使用Notion API：页面、数据库、区块、搜索"
sidebar_label: "Notion"
description: "通过curl使用Notion API：页面、数据库、区块、搜索"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Notion

通过curl使用Notion API：页面、数据库、区块、搜索。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/productivity/notion` |
| 版本 | `1.0.0` |
| 作者 | 社区 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Notion`, `生产力`, `笔记`, `数据库`, `API` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的说明。
:::

# Notion API

通过 curl 使用 Notion API 来创建、读取、更新页面、数据库（数据源）和区块。无需额外工具——只需 curl 和一个 Notion API 密钥。

## 前提条件

1.  在 https://notion.so/my-integrations 创建一个集成
2.  复制 API 密钥（以 `ntn_` 或 `secret_` 开头）
3.  将其存储在 `~/.hermes/.env` 中：
    ```
    NOTION_API_KEY=ntn_你的密钥
    ```
4.  **重要：** 在 Notion 中将目标页面/数据库共享给你的集成（点击 "..." → "连接到" → 你的集成名称）

## API 基础

所有请求都使用此模式：

```bash
curl -s -X GET "https://api.notion.com/v1/..." \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json"
```

`Notion-Version` 请求头是必需的。此技能使用 `2025-09-03`（最新版本）。在此版本中，数据库在 API 中被称为“数据源”。

## 常见操作

### 搜索

```bash
curl -s -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"query": "页面标题"}'
```

### 获取页面

```bash
curl -s "https://api.notion.com/v1/pages/{页面ID}" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03"
```

### 获取页面内容（区块）

```bash
curl -s "https://api.notion.com/v1/blocks/{页面ID}/children" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03"
```

### 在数据库中创建页面

```bash
curl -s -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"database_id": "xxx"},
    "properties": {
      "Name": {"title": [{"text": {"content": "新项目"}}]},
      "Status": {"select": {"name": "待办"}}
    }
  }'
```

### 查询数据库

```bash
curl -s -X POST "https://api.notion.com/v1/data_sources/{数据源ID}/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {"property": "Status", "select": {"equals": "激活"}},
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
    "title": [{"text": {"content": "我的数据库"}}],
    "properties": {
      "Name": {"title": {}},
      "Status": {"select": {"options": [{"name": "待办"}, {"name": "完成"}]}},
      "Date": {"date": {}}
    }
  }'
```

### 更新页面属性

```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/{页面ID}" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Status": {"select": {"name": "完成"}}}}'
```

### 向页面添加内容

```bash
curl -s -X PATCH "https://api.notion.com/v1/blocks/{页面ID}/children" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "children": [
      {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": "来自 Hermes 的问候！"}}]}}
    ]
  }'
```

## 属性类型

数据库项目的常见属性格式：

- **标题：** `{"title": [{"text": {"content": "..."}}]}`
- **富文本：** `{"rich_text": [{"text": {"content": "..."}}]}`
- **单选：** `{"select": {"name": "选项"}}`
- **多选：** `{"multi_select": [{"name": "A"}, {"name": "B"}]}`
- **日期：** `{"date": {"start": "2026-01-15", "end": "2026-01-16"}}`
- **复选框：** `{"checkbox": true}`
- **数字：** `{"number": 42}`
- **URL：** `{"url": "https://..."}`
- **邮箱：** `{"email": "user@example.com"}`
- **关联：** `{"relation": [{"id": "页面ID"}]}`

## API 版本 2025-09-03 的主要区别

- **数据库 → 数据源：** 对于查询和检索，请使用 `/data_sources/` 端点
- **两个 ID：** 每个数据库都有一个 `database_id` 和一个 `data_source_id`
    - 创建页面时使用 `database_id` (`parent: {"database_id": "..."}`)
    - 查询时使用 `data_source_id` (`POST /v1/data_sources/{id}/query`)
- **搜索结果：** 数据库返回为 `"object": "data_source"` 及其 `data_source_id`

## 注意事项

- 页面/数据库 ID 是 UUID（带或不带连字符）
- 速率限制：平均约 3 次请求/秒
- API 无法设置数据库视图过滤器——这仅限 UI
- 创建数据源时使用 `is_inline: true` 以将其嵌入页面
- 给 curl 添加 `-s` 标志以隐藏进度条（对 Hermes 更清晰的输出）
- 通过 `jq` 管道输出以获取可读的 JSON：`... | jq '.results[0].properties'`