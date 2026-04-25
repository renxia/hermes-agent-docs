---
title: "Github Issues — 创建、管理、分类和关闭 GitHub 问题"
sidebar_label: "Github Issues"
description: "创建、管理、分类和关闭 GitHub 问题"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Github Issues

创建、管理、分类和关闭 GitHub 问题。搜索现有问题、添加标签、分配人员并链接到 PR。支持使用 gh CLI，或通过 curl 调用 git + GitHub REST API 作为备用方案。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/github/github-issues` |
| 版本 | `1.1.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 标签 | `GitHub`、`Issues`、`Project-Management`、`Bug-Tracking`、`Triage` |
| 相关技能 | [`github-auth`](/docs/user-guide/skills/bundled/github/github-github-auth)、[`github-pr-workflow`](/docs/user-guide/skills/bundled/github/github-github-pr-workflow) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# GitHub Issues 管理

创建、搜索、分类和管理 GitHub Issues。每个部分首先展示 `gh` 命令，然后是 `curl` 备用方案。

## 先决条件

- 已通过 GitHub 身份验证（参见 `github-auth` 技能）
- 位于带有 GitHub 远程仓库的 git 仓库中，或显式指定仓库

### 设置

```bash
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  AUTH="gh"
else
  AUTH="git"
  if [ -z "$GITHUB_TOKEN" ]; then
    if [ -f ~/.hermes/.env ] && grep -q "^GITHUB_TOKEN=" ~/.hermes/.env; then
      GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" ~/.hermes/.env | head -1 | cut -d= -f2 | tr -d '\n\r')
    elif grep -q "github.com" ~/.git-credentials 2>/dev/null; then
      GITHUB_TOKEN=$(grep "github.com" ~/.git-credentials 2>/dev/null | head -1 | sed 's|https://[^:]*:\([^@]*\)@.*|\1|')
    fi
  fi
fi

REMOTE_URL=$(git remote get-url origin)
OWNER_REPO=$(echo "$REMOTE_URL" | sed -E 's|.*github\.com[:/]||; s|\.git$||')
OWNER=$(echo "$OWNER_REPO" | cut -d/ -f1)
REPO=$(echo "$OWNER_REPO" | cut -d/ -f2)
```

---

## 1. 查看 Issues

**使用 gh：**

```bash
gh issue list
gh issue list --state open --label "bug"
gh issue list --assignee @me
gh issue list --search "authentication error" --state all
gh issue view 42
```

**使用 curl：**

```bash
# 列出开放 issues
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/issues?state=open&per_page=20" \
  | python3 -c "
import sys, json
for i in json.load(sys.stdin):
    if 'pull_request' not in i:  # GitHub API 在 /issues 中也返回 PR
        labels = ', '.join(l['name'] for l in i['labels'])
        print(f\"#{i['number']:5}  {i['state']:6}  {labels:30}  {i['title']}\")"

# 按标签筛选
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/issues?state=open&labels=bug&per_page=20" \
  | python3 -c "
import sys, json
for i in json.load(sys.stdin):
    if 'pull_request' not in i:
        print(f\"#{i['number']}  {i['title']}\")"

# 查看特定 issue
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/42 \
  | python3 -c "
import sys, json
i = json.load(sys.stdin)
labels = ', '.join(l['name'] for l in i['labels'])
assignees = ', '.join(a['login'] for a in i['assignees'])
print(f\"#{i['number']}: {i['title']}\")
print(f\"状态: {i['state']}  标签: {labels}  负责人: {assignees}\")
print(f\"作者: {i['user']['login']}  创建时间: {i['created_at']}\")
print(f\"\n{i['body']}\")"

# 搜索 issues
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/search/issues?q=authentication+error+repo:$OWNER/$REPO" \
  | python3 -c "
import sys, json
for i in json.load(sys.stdin)['items']:
    print(f\"#{i['number']}  {i['state']:6}  {i['title']}\")"
```

## 2. 创建 Issues

**使用 gh：**

```bash
gh issue create \
  --title "登录重定向忽略 ?next= 参数" \
  --body "## 描述
登录后，用户总是跳转到 /dashboard。

## 复现步骤
1. 在未登录状态下访问 /settings
2. 被重定向到 /login?next=/settings
3. 登录
4. 实际结果：跳转到 /dashboard（应跳转到 /settings）

## 预期行为
应遵循 ?next= 查询参数。" \
  --label "bug,backend" \
  --assignee "username"
```

**使用 curl：**

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues \
  -d '{
    "title": "登录重定向忽略 ?next= 参数",
    "body": "## 描述\n登录后，用户总是跳转到 /dashboard。\n\n## 复现步骤\n1. 在未登录状态下访问 /settings\n2. 被重定向到 /login?next=/settings\n3. 登录\n4. 实际结果：跳转到 /dashboard\n\n## 预期行为\n应遵循 ?next= 查询参数。",
    "labels": ["bug", "backend"],
    "assignees": ["username"]
  }'
```

### Bug 报告模板

```
## Bug 描述
<发生了什么>

## 复现步骤
1. <步骤>
2. <步骤>

## 预期行为
<应该发生什么>

## 实际行为
<实际发生了什么>

## 环境
- 操作系统: <os>
- 版本: <version>
```

### 功能请求模板

```
## 功能描述
<你想要什么>

## 动机
<为什么这会有用>

## 建议方案
<它如何工作>

## 考虑过的替代方案
<其他方法>
```

## 3. 管理 Issues

### 添加/移除标签

**使用 gh：**

```bash
gh issue edit 42 --add-label "priority:high,bug"
gh issue edit 42 --remove-label "needs-triage"
```

**使用 curl：**

```bash
# 添加标签
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/42/labels \
  -d '{"labels": ["priority:high", "bug"]}'

# 移除标签
curl -s -X DELETE \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/42/labels/needs-triage

# 列出仓库中可用的标签
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/labels \
  | python3 -c "
import sys, json
for l in json.load(sys.stdin):
    print(f\"  {l['name']:30}  {l.get('description', '')}\")"
```

### 分配负责人

**使用 gh：**

```bash
gh issue edit 42 --add-assignee username
gh issue edit 42 --add-assignee @me
```

**使用 curl：**

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/42/assignees \
  -d '{"assignees": ["username"]}'
```

### 评论

**使用 gh：**

```bash
gh issue comment 42 --body "已调查 — 根本原因在认证中间件中。正在修复。"
```

**使用 curl：**

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/42/comments \
  -d '{"body": "已调查 — 根本原因在认证中间件中。正在修复。"}'
```

### 关闭和重新打开

**使用 gh：**

```bash
gh issue close 42
gh issue close 42 --reason "not planned"
gh issue reopen 42
```

**使用 curl：**

```bash
# 关闭
curl -s -X PATCH \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/42 \
  -d '{"state": "closed", "state_reason": "completed"}'

# 重新打开
curl -s -X PATCH \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/42 \
  -d '{"state": "open"}'
```

### 将 Issues 链接到 PRs

当 PR 合并时，如果其正文包含正确的关键词，Issues 会自动关闭：

```
Closes #42
Fixes #42
Resolves #42
```

要从 Issue 创建分支：

**使用 gh：**

```bash
gh issue develop 42 --checkout
```

**使用 git（手动等效操作）：**

```bash
git checkout main && git pull origin main
git checkout -b fix/issue-42-login-redirect
```

## 4. Issue 分类工作流

当被要求对 Issues 进行分类时：

1. **列出未分类的 Issues：**

```bash
# 使用 gh
gh issue list --label "needs-triage" --state open

# 使用 curl
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/issues?labels=needs-triage&state=open" \
  | python3 -c "
import sys, json
for i in json.load(sys.stdin):
    if 'pull_request' not in i:
        print(f\"#{i['number']}  {i['title']}\")"
```

2. **阅读并分类**每个 Issue（查看详情，理解 Bug/功能）

3. **应用标签和优先级**（参见上文“管理 Issues”）

4. **分配负责人**（如果所有者明确）

5. **添加分类注释**（如果需要）

## 5. 批量操作

对于批量操作，可将 API 调用与 Shell 脚本结合使用：

**使用 gh：**

```bash
# 关闭所有带有特定标签的 Issues
gh issue list --label "wontfix" --json number --jq '.[].number' | \
  xargs -I {} gh issue close {} --reason "not planned"
```

**使用 curl：**

```bash
# 列出带有标签的 Issue 编号，然后逐个关闭
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/issues?labels=wontfix&state=open" \
  | python3 -c "import sys,json; [print(i['number']) for i in json.load(sys.stdin)]" \
  | while read num; do
    curl -s -X PATCH \
      -H "Authorization: token $GITHUB_TOKEN" \
      https://api.github.com/repos/$OWNER/$REPO/issues/$num \
      -d '{"state": "closed", "state_reason": "not_planned"}'
    echo "已关闭 #$num"
  done
```

## 快速参考表

| 操作 | gh | curl 端点 |
|--------|-----|--------------|
| 列出 Issues | `gh issue list` | `GET /repos/{o}/{r}/issues` |
| 查看 Issue | `gh issue view N` | `GET /repos/{o}/{r}/issues/N` |
| 创建 Issue | `gh issue create ...` | `POST /repos/{o}/{r}/issues` |
| 添加标签 | `gh issue edit N --add-label ...` | `POST /repos/{o}/{r}/issues/N/labels` |
| 分配负责人 | `gh issue edit N --add-assignee ...` | `POST /repos/{o}/{r}/issues/N/assignees` |
| 评论 | `gh issue comment N --body ...` | `POST /repos/{o}/{r}/issues/N/comments` |
| 关闭 | `gh issue close N` | `PATCH /repos/{o}/{r}/issues/N` |
| 搜索 | `gh issue list --search "..."` | `GET /search/issues?q=...` |