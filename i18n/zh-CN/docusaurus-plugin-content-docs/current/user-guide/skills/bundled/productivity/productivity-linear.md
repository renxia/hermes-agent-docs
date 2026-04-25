---
title: "Linear — 通过 GraphQL API 管理 Linear 问题、项目和团队"
sidebar_label: "Linear"
description: "通过 GraphQL API 管理 Linear 问题、项目和团队"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Linear

通过 GraphQL API 管理 Linear 问题、项目和团队。创建、更新、搜索和组织问题。使用 API 密钥认证（无需 OAuth）。所有操作均通过 curl 完成 — 无依赖项。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/productivity/linear` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 标签 | `Linear`, `项目管理`, `问题`, `GraphQL`, `API`, `效率` |

## 参考：完整的 SKILL.md

:::info
以下是触发此技能时 Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Linear — 问题与项目管理

使用 `curl` 通过 GraphQL API 直接管理 Linear 问题、项目和团队。无需 MCP 服务器、无需 OAuth 流程、无需额外依赖。

## 设置

1. 从 **Linear 设置 > API > 个人 API 密钥** 获取个人 API 密钥
2. 在环境中设置 `LINEAR_API_KEY`（通过 `hermes setup` 或您的环境配置）

## API 基础

- **端点：** `https://api.linear.app/graphql`（POST）
- **认证头：** `Authorization: $LINEAR_API_KEY`（API 密钥前不加 "Bearer" 前缀）
- **所有请求均为 POST**，且 `Content-Type: application/json`
- **UUID 和短标识符**（例如 `ENG-123`）均可用于 `issue(id:)`

基本 curl 模式：
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ viewer { id name } }"}' | python3 -m json.tool
```

## 工作流状态

Linear 使用带有 `type` 字段的 `WorkflowState` 对象。**6 种状态类型：**

| 类型 | 描述 |
|------|-------------|
| `triage` | 需要审查的传入问题 |
| `backlog` | 已确认但尚未计划 |
| `unstarted` | 已计划/就绪但尚未开始 |
| `started` | 正在积极处理中 |
| `completed` | 已完成 |
| `canceled` | 不会执行 |

每个团队都有其命名的状态（例如，“进行中”对应类型 `started`）。要更改问题的状态，您需要目标状态的 `stateId`（UUID）——请先查询工作流状态。

**优先级值：** 0 = 无，1 = 紧急，2 = 高，3 = 中，4 = 低

## 常见查询

### 获取当前用户
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ viewer { id name email } }"}' | python3 -m json.tool
```

### 列出团队
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ teams { nodes { id name key } } }"}' | python3 -m json.tool
```

### 列出团队的工作流状态
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ workflowStates(filter: { team: { key: { eq: \"ENG\" } } }) { nodes { id name type } } }"}' | python3 -m json.tool
```

### 列出问题（前 20 个）
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ issues(first: 20) { nodes { identifier title priority state { name type } assignee { name } team { key } url } pageInfo { hasNextPage endCursor } } }"}' | python3 -m json.tool
```

### 列出分配给我的问题
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ viewer { assignedIssues(first: 25) { nodes { identifier title state { name type } priority url } } } }"}' | python3 -m json.tool
```

### 获取单个问题（通过标识符如 ENG-123）
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ issue(id: \"ENG-123\") { id identifier title description priority state { id name type } assignee { id name } team { key } project { name } labels { nodes { name } } comments { nodes { body user { name } createdAt } } url } }"}' | python3 -m json.tool
```

### 通过文本搜索问题
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ issueSearch(query: \"bug login\", first: 10) { nodes { identifier title state { name } assignee { name } url } } }"}' | python3 -m json.tool
```

### 按状态类型过滤问题
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ issues(filter: { state: { type: { in: [\"started\"] } } }, first: 20) { nodes { identifier title state { name } assignee { name } } } }"}' | python3 -m json.tool
```

### 按团队和负责人过滤
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ issues(filter: { team: { key: { eq: \"ENG\" } }, assignee: { email: { eq: \"user@example.com\" } } }, first: 20) { nodes { identifier title state { name } priority } } }"}' | python3 -m json.tool
```

### 列出项目
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ projects(first: 20) { nodes { id name description progress lead { name } teams { nodes { key } } url } } }"}' | python3 -m json.tool
```

### 列出团队成员
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ users { nodes { id name email active } } }"}' | python3 -m json.tool
```

### 列出标签
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ issueLabels { nodes { id name color } } }"}' | python3 -m json.tool
```

## 常见变更操作

### 创建问题
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier title url } } }",
    "variables": {
      "input": {
        "teamId": "TEAM_UUID",
        "title": "修复登录 Bug",
        "description": "用户无法通过 SSO 登录",
        "priority": 2
      }
    }
  }' | python3 -m json.tool
```

### 更新问题状态
首先从上述工作流状态查询中获取目标状态的 UUID，然后：
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { issueUpdate(id: \"ENG-123\", input: { stateId: \"STATE_UUID\" }) { success issue { identifier state { name type } } } }"}' | python3 -m json.tool
```

### 分配问题
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { issueUpdate(id: \"ENG-123\", input: { assigneeId: \"USER_UUID\" }) { success issue { identifier assignee { name } } } }"}' | python3 -m json.tool
```

### 设置优先级
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { issueUpdate(id: \"ENG-123\", input: { priority: 1 }) { success issue { identifier priority } } }"}' | python3 -m json.tool
```

### 添加评论
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { commentCreate(input: { issueId: \"ISSUE_UUID\", body: \"已调查。根本原因是 X。\" }) { success comment { id body } } }"}' | python3 -m json.tool
```

### 设置截止日期
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { issueUpdate(id: \"ENG-123\", input: { dueDate: \"2026-04-01\" }) { success issue { identifier dueDate } } }"}' | python3 -m json.tool
```

### 为问题添加标签
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { issueUpdate(id: \"ENG-123\", input: { labelIds: [\"LABEL_UUID_1\", \"LABEL_UUID_2\"] }) { success issue { identifier labels { nodes { name } } } } }"}' | python3 -m json.tool
```

### 将问题添加到项目
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { issueUpdate(id: \"ENG-123\", input: { projectId: \"PROJECT_UUID\" }) { success issue { identifier project { name } } } }"}' | python3 -m json.tool
```

### 创建项目
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation($input: ProjectCreateInput!) { projectCreate(input: $input) { success project { id name url } } }",
    "variables": {
      "input": {
        "name": "Q2 认证重构",
        "description": "使用 OAuth2 和 PKCE 替换旧版认证",
        "teamIds": ["TEAM_UUID"]
      }
    }
  }' | python3 -m json.tool
```

## 分页

Linear 使用 Relay 风格的游标分页：

```bash
# 第一页
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ issues(first: 20) { nodes { identifier title } pageInfo { hasNextPage endCursor } } }"}' | python3 -m json.tool

# 下一页 — 使用上一响应中的 endCursor
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ issues(first: 20, after: \"CURSOR_FROM_PREVIOUS\") { nodes { identifier title } pageInfo { hasNextPage endCursor } } }"}' | python3 -m json.tool
```

默认页面大小：50。最大：250。始终使用 `first: N` 限制结果数量。

## 筛选参考

比较器：`eq`、`neq`、`in`、`nin`、`lt`、`lte`、`gt`、`gte`、`contains`、`startsWith`、`containsIgnoreCase`

使用 `or: [...]` 组合筛选条件以实现 OR 逻辑（筛选对象内默认为 AND 逻辑）。

## 典型工作流程

1. **查询团队** 以获取团队 ID 和密钥
2. **查询目标团队的工作流状态** 以获取状态 UUID
3. **列出或搜索问题** 以查找需要处理的内容
4. **创建问题**，需提供团队 ID、标题、描述、优先级
5. **更新状态**，通过将 `stateId` 设置为目标工作流状态
6. **添加评论** 以跟踪进度
7. **标记完成**，通过将 `stateId` 设置为团队的“已完成”类型状态

## 速率限制

- 每个 API 密钥每小时 5,000 次请求
- 每小时 3,000,000 复杂度点数
- 使用 `first: N` 限制结果数量并降低复杂度成本
- 监控响应头 `X-RateLimit-Requests-Remaining`

## 重要说明

- 始终使用 `terminal` 工具配合 `curl` 进行 API 调用 — 切勿使用 `web_extract` 或 `browser`
- 始终检查 GraphQL 响应中的 `errors` 数组 — HTTP 200 仍可能包含错误
- 如果在创建问题时省略 `stateId`，Linear 将默认使用第一个待办事项状态
- `description` 字段支持 Markdown
- 使用 `python3 -m json.tool` 或 `jq` 格式化 JSON 响应以提高可读性