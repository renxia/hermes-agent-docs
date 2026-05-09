---
title: "Linear — Linear：通过 GraphQL + curl 管理问题、项目和团队"
sidebar_label: "Linear"
description: "Linear：通过 GraphQL + curl 管理问题、项目和团队"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Linear

Linear：通过 GraphQL + curl 管理问题、项目和团队。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/productivity/linear` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 标签 | `Linear`、`项目管理`、`问题`、`GraphQL`、`API`、`效率` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Linear — 问题与项目管理

使用 `curl` 通过 GraphQL API 直接管理 Linear 问题、项目和团队。无需 MCP 服务器、无需 OAuth 流程、无需额外依赖。

## 设置

1. 从 **Linear 设置 > 账户 > 安全与访问 > 个人 API 密钥** 获取个人 API 密钥（URL：https://linear.app/settings/account/security）。注意：组织级别的 *设置 > API* 页面仅显示 OAuth 应用和工作区成员密钥，不显示个人密钥。
2. 在环境中设置 `LINEAR_API_KEY`（通过 `hermes setup` 或您的环境配置）

## API 基础

- **端点：** `https://api.linear.app/graphql`（POST）
- **认证头：** `Authorization: $LINEAR_API_KEY`（API 密钥无需 "Bearer" 前缀）
- **所有请求均为 POST**，且 `Content-Type: application/json`
- **UUID 和短标识符**（例如 `ENG-123`）均可用于 `issue(id:)`

基础 curl 模式：
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ viewer { id name } }"}' | python3 -m json.tool
```

## Python 辅助脚本（更符合人体工程学的替代方案）

为了更快地执行单行命令而无需手写 GraphQL，此技能附带一个标准库 Python CLI，位于 `scripts/linear_api.py`。零依赖。相同认证方式（读取 `LINEAR_API_KEY`）。

```bash
SCRIPT=$(dirname "$(find ~/.hermes -path '*skills/productivity/linear/scripts/linear_api.py' 2>/dev/null | head -1)")/linear_api.py

python3 "$SCRIPT" whoami
python3 "$SCRIPT" list-teams
python3 "$SCRIPT" get-issue ENG-42
python3 "$SCRIPT" get-document 38359beef67c      # 通过 URL 中的 slugId 获取文档
python3 "$SCRIPT" raw 'query { viewer { name } }'
```

所有子命令：`whoami`、`list-teams`、`list-projects`、`list-states`、`list-issues`、`get-issue`、`search-issues`、`create-issue`、`update-issue`、`update-status`、`add-comment`、`list-documents`、`get-document`、`search-documents`、`raw`。使用 `--help` 查看标志。

使用场景：当您希望快速获得答案而无需构建 GraphQL 时使用脚本。使用 curl 的场景：当您需要脚本未封装的查询，或希望内联组合过滤器时。

## 工作流状态

Linear 使用带有 `type` 字段的 `WorkflowState` 对象。**6 种状态类型：**

| 类型 | 描述 |
|------|-------------|
| `triage` | 需要审查的传入问题 |
| `backlog` | 已确认但尚未计划 |
| `unstarted` | 已计划/准备就绪但尚未开始 |
| `started` | 正在积极处理中 |
| `completed` | 已完成 |
| `canceled` | 不会执行 |

每个团队都有其命名的状态（例如，“进行中”的类型为 `started`）。要更改问题的状态，您需要目标状态的 `stateId`（UUID）——请先查询工作流状态。

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
        "name": "Q2 认证系统 overhaul",
        "description": "使用 OAuth2 和 PKCE 替换旧版认证",
        "teamIds": ["TEAM_UUID"]
      }
    }
  }' | python3 -m json.tool
```

## 文档

线性 **文档** 是与议题（issues）一起存储的散文式文档（RFC、规范、笔记）。它们拥有自己的根查询 `documents` 和单个获取接口 `document(id:)`。

### 文档 URL 与 `slugId`

文档 URL 的格式如下：
```
https://linear.app/<workspace>/document/<slug>-<hexSlugId>
```

末尾的十六进制部分是 `slugId`。例如：`https://linear.app/nousresearch/document/rfc-hermes-permission-gateway-discord-38359beef67c` → `slugId` 为 `38359beef67c`。

**重要模式细节：** Markdown 正文位于 `content` 字段中。ProseMirror JSON 位于 `contentState` 字段中（而非 `contentData` —— 该字段不存在，API 会返回 400 错误）。

### 通过 slugId 获取文档

`document(id:)` 仅接受 UUID。要通过 URL 中的十六进制 slug 获取文档，请对集合进行筛选：

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "query($s: String!) { documents(filter: { slugId: { eq: $s } }, first: 1) { nodes { id title content contentState slugId url creator { name } project { name } updatedAt } } }", "variables": {"s": "38359beef67c"}}' \
  | python3 -m json.tool
```

或通过 Python 辅助工具：
```bash
python3 scripts/linear_api.py get-document 38359beef67c
```

### 通过 UUID 获取文档

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ document(id: \"11700cff-b514-4db3-afcc-3ed1afacba1c\") { title content url } }"}' \
  | python3 -m json.tool
```

### 列出最近的文档

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ documents(first: 25, orderBy: updatedAt) { nodes { id title slugId url updatedAt project { name } } } }"}' \
  | python3 -m json.tool
```

### 按标题搜索文档

Linear 的模式中没有 `searchDocuments` 根查询。请使用标题子字符串筛选器：

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ documents(filter: { title: { containsIgnoreCase: \"RFC\" } }, first: 25) { nodes { title slugId url } } }"}' \
  | python3 -m json.tool
```

## 分页

Linear 使用 Relay 风格的光标分页：

```bash
# 第一页
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ issues(first: 20) { nodes { identifier title } pageInfo { hasNextPage endCursor } } }"}' | python3 -m json.tool

# 下一页 —— 使用上一响应中的 endCursor
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ issues(first: 20, after: \"CURSOR_FROM_PREVIOUS\") { nodes { identifier title } pageInfo { hasNextPage endCursor } } }"}' | python3 -m json.tool
```

默认页面大小：50。最大值：250。始终使用 `first: N` 来限制结果数量。

## 筛选参考

比较符：`eq`、`neq`、`in`、`nin`、`lt`、`lte`、`gt`、`gte`、`contains`、`startsWith`、`containsIgnoreCase`

在筛选对象内，默认使用 AND 逻辑组合筛选条件。如需 OR 逻辑，请使用 `or: [...]`。

## 典型工作流程

1. **查询团队** 以获取团队 ID 和密钥
2. **查询工作流状态** 以获取目标团队的状态 UUID
3. **列出或搜索议题** 以找到需要处理的内容
4. **创建议题**，指定团队 ID、标题、描述、优先级
5. **更新状态**，将 `stateId` 设置为目标工作流状态
6. **添加评论** 以跟踪进度
7. **标记完成**，将 `stateId` 设置为团队的“已完成”类型状态

## 速率限制

- 每个 API 密钥每小时 5,000 次请求
- 每小时 3,000,000 复杂度点数
- 使用 `first: N` 限制结果数量以降低复杂度成本
- 监控响应头 `X-RateLimit-Requests-Remaining`

## 重要说明

- 始终使用 `terminal` 工具配合 `curl` 进行 API 调用 —— 切勿使用 `web_extract` 或 `browser`
- 始终检查 GraphQL 响应中的 `errors` 数组 —— HTTP 200 仍可能包含错误
- 创建议题时若省略 `stateId`，Linear 将默认为第一个待办状态（backlog state）
- `description` 字段支持 Markdown 语法
- 使用 `python3 -m json.tool` 或 `jq` 格式化 JSON 响应以提高可读性