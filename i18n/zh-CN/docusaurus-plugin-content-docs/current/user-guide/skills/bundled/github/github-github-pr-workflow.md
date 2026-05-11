---
title: "Github Pr 工作流 — GitHub PR 生命周期：分支、提交、创建、CI、合并"
sidebar_label: "Github Pr 工作流"
description: "GitHub PR 生命周期：分支、提交、创建、CI、合并"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。 */}

# Github Pr 工作流

GitHub PR 生命周期：分支、提交、创建、CI、合并。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/github/github-pr-workflow` |
| 版本 | `1.1.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `GitHub`, `拉取请求`, `CI/CD`, `Git`, `自动化`, `合并` |
| 相关技能 | [`github-auth`](/docs/user-guide/skills/bundled/github/github-github-auth), [`github-code-review`](/docs/user-guide/skills/bundled/github/github-github-code-review) |

:::info
以下是 Hermes 加载此技能时的完整技能定义。这是技能激活时智能体看到的指令。
:::

# GitHub 拉取请求工作流程

管理 PR 生命周期的完整指南。每个部分都先展示 `gh` 的用法，然后提供没有 `gh` 时 `git` + `curl` 的备用方案。

## 前提条件

- 已通过 GitHub 认证（参见 `github-auth` 技能）
- 在一个具有 GitHub 远程的 git 仓库内

### 快速认证检测

```bash
# 确定在整个工作流程中使用哪种方法
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  AUTH="gh"
else
  AUTH="git"
  # 确保我们有用于 API 调用的令牌
  if [ -z "$GITHUB_TOKEN" ]; then
    if [ -f ~/.hermes/.env ] && grep -q "^GITHUB_TOKEN=" ~/.hermes/.env; then
      GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" ~/.hermes/.env | head -1 | cut -d= -f2 | tr -d '\n\r')
    elif grep -q "github.com" ~/.git-credentials 2>/dev/null; then
      GITHUB_TOKEN=$(grep "github.com" ~/.git-credentials 2>/dev/null | head -1 | sed 's|https://[^:]*:\([^@]*\)@.*|\1|')
    fi
  fi
fi
echo "使用: $AUTH"
```

### 从 Git 远程提取所有者/仓库

许多 `curl` 命令需要 `owner/repo`。从 git 远程提取：

```bash
# 适用于 HTTPS 和 SSH 远程 URL
REMOTE_URL=$(git remote get-url origin)
OWNER_REPO=$(echo "$REMOTE_URL" | sed -E 's|.*github\.com[:/]||; s|\.git$||')
OWNER=$(echo "$OWNER_REPO" | cut -d/ -f1)
REPO=$(echo "$OWNER_REPO" | cut -d/ -f2)
echo "所有者: $OWNER, 仓库: $REPO"
```

---

## 1. 创建分支

这部分是纯 `git` —— 两种方式都一样：

```bash
# 确保你是最新的
git fetch origin
git checkout main && git pull origin main

# 创建并切换到新分支
git checkout -b feat/add-user-authentication
```

分支命名约定：
- `feat/描述` —— 新功能
- `fix/描述` —— Bug 修复
- `refactor/描述` —— 代码重构
- `docs/描述` —— 文档
- `ci/描述` —— CI/CD 变更

## 2. 提交更改

使用智能体的文件工具 (`write_file`, `patch`) 进行更改，然后提交：

```bash
# 暂存特定文件
git add src/auth.py src/models/user.py tests/test_auth.py

# 使用常规提交信息进行提交
git commit -m "feat: 添加基于 JWT 的用户身份验证

- 添加登录/注册端点
- 添加带密码哈希的用户模型
- 添加受保护路由的身份验证中间件
- 添加身份验证流程的单元测试"
```

提交信息格式（常规提交）：
```
类型(范围): 简短描述

如有需要，可添加更长的解释。每行不超过 72 个字符。
```

类型：`feat`, `fix`, `refactor`, `docs`, `test`, `ci`, `chore`, `perf`

## 3. 推送和创建 PR

### 推送分支（两种方式相同）

```bash
git push -u origin HEAD
```

### 创建 PR

**使用 gh：**

```bash
gh pr create \
  --title "feat: 添加基于 JWT 的用户身份验证" \
  --body "## 概述
- 添加登录和注册 API 端点
- JWT 令牌的生成和验证

## 测试计划
- [ ] 单元测试通过

关闭 #42"
```

选项：`--draft`, `--reviewer user1,user2`, `--label "enhancement"`, `--base develop`

**使用 git + curl：**

```bash
BRANCH=$(git branch --show-current)

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$OWNER/$REPO/pulls \
  -d "{
    \"title\": \"feat: 添加基于 JWT 的用户身份验证\",
    \"body\": \"## 概述\n添加登录和注册 API 端点。\n\n关闭 #42\",
    \"head\": \"$BRANCH\",
    \"base\": \"main\"
  }"
```

响应 JSON 包含 PR 的 `number` —— 保存它以便后续命令使用。

要创建为草稿，在 JSON 正文中添加 `"draft": true`。

## 4. 监控 CI 状态

### 检查 CI 状态

**使用 gh：**

```bash
# 一次性检查
gh pr checks

# 监视直到所有检查完成（每 10 秒轮询一次）
gh pr checks --watch
```

**使用 git + curl：**

```bash
# 获取当前分支的最新提交 SHA
SHA=$(git rev-parse HEAD)

# 查询组合状态
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/commits/$SHA/status \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"总体状态: {data['state']}\")
for s in data.get('statuses', []):
    print(f\"  {s['context']}: {s['state']} - {s.get('description', '')}\")"

# 也检查 GitHub Actions 的检查运行（独立端点）
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/commits/$SHA/check-runs \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
for cr in data.get('check_runs', []):
    print(f\"  {cr['name']}: {cr['status']} / {cr['conclusion'] or '待处理'}\")"
```

### 轮询直到完成（git + curl）

```bash
# 简单的轮询循环 —— 每 30 秒检查一次，最多 10 分钟
SHA=$(git rev-parse HEAD)
for i in $(seq 1 20); do
  STATUS=$(curl -s \
    -H "Authorization: token $GITHUB_TOKEN" \
    https://api.github.com/repos/$OWNER/$REPO/commits/$SHA/status \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['state'])")
  echo "检查 $i: $STATUS"
  if [ "$STATUS" = "success" ] || [ "$STATUS" = "failure" ] || [ "$STATUS" = "error" ]; then
    break
  fi
  sleep 30
done
```

## 5. 自动修复 CI 失败

当 CI 失败时，进行诊断和修复。此循环适用于任何认证方法。

### 步骤 1：获取失败详情

**使用 gh：**

```bash
# 列出此分支上最近的 workflow 运行
gh run list --branch $(git branch --show-current) --limit 5

# 查看失败的日志
gh run view <运行_ID> --log-failed
```

**使用 git + curl：**

```bash
BRANCH=$(git branch --show-current)

# 列出此分支上的 workflow 运行
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/actions/runs?branch=$BRANCH&per_page=5" \
  | python3 -c "
import sys, json
runs = json.load(sys.stdin)['workflow_runs']
for r in runs:
    print(f\"运行 {r['id']}: {r['name']} - {r['conclusion'] or r['status']}\")"

# 获取失败作业的日志（下载为 zip，解压，读取）
RUN_ID=<运行_id>
curl -s -L \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/actions/runs/$RUN_ID/logs \
  -o /tmp/ci-logs.zip
cd /tmp && unzip -o ci-logs.zip -d ci-logs && cat ci-logs/*.txt
```

### 步骤 2：修复并推送

识别出问题后，使用文件工具 (`patch`, `write_file`) 进行修复：

```bash
git add <修复的文件>
git commit -m "fix: 解决 <检查名称> 中的 CI 失败"
git push
```

### 步骤 3：验证

使用上面第 4 节中的命令重新检查 CI 状态。

### 自动修复循环模式

当被要求自动修复 CI 时，遵循此循环：

1.  检查 CI 状态 → 识别失败项
2.  读取失败日志 → 理解错误
3.  使用 `read_file` + `patch`/`write_file` → 修复代码
4.  `git add . && git commit -m "fix: ..." && git push`
5.  等待 CI → 重新检查状态
6.  如果仍然失败则重复（最多尝试 3 次，然后询问用户）

## 6. 合并

**使用 gh：**

```bash
# 压缩合并 + 删除分支（对功能分支最整洁）
gh pr merge --squash --delete-branch

# 启用自动合并（当所有检查通过时合并）
gh pr merge --auto --squash --delete-branch
```

**使用 git + curl：**

```bash
PR_NUMBER=<编号>

# 通过 API 合并 PR（压缩合并）
curl -s -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/merge \
  -d "{
    \"merge_method\": \"squash\",
    \"commit_title\": \"feat: 添加用户身份验证 (#$PR_NUMBER)\"
  }"

# 合并后删除远程分支
BRANCH=$(git branch --show-current)
git push origin --delete $BRANCH

# 在本地切换回 main 分支
git checkout main && git pull origin main
git branch -d $BRANCH
```

合并方法：`"merge"`（合并提交），`"squash"`（压缩），`"rebase"`（变基）

### 启用自动合并（curl）

```bash
# 自动合并需要仓库在设置中启用此功能。
# 这里使用 GraphQL API，因为 REST 不支持自动合并。
PR_NODE_ID=$(curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['node_id'])")

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/graphql \
  -d "{\"query\": \"mutation { enablePullRequestAutoMerge(input: {pullRequestId: \\\"$PR_NODE_ID\\\", mergeMethod: SQUASH}) { clientMutationId } }\"}"
```

## 7. 完整工作流程示例

```bash
# 1. 从干净的 main 分支开始
git checkout main && git pull origin main

# 2. 创建分支
git checkout -b fix/login-redirect-bug

# 3.（智能体使用文件工具进行代码更改）

# 4. 提交
git add src/auth/login.py tests/test_login.py
git commit -m "fix: 修正登录后的重定向 URL

保留 ?next= 参数，而不是始终重定向到 /dashboard。"

# 5. 推送
git push -u origin HEAD

# 6. 创建 PR（根据可用情况选择 gh 或 curl）
# ...（参见第 3 节）

# 7. 监控 CI（参见第 4 节）

# 8. 当 CI 通过时合并（参见第 6 节）
```

## 常用 PR 命令参考

| 操作 | gh | git + curl |
|------|-----|-----------|
| 列出我的 PR | `gh pr list --author @me` | `curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/repos/$OWNER/$REPO/pulls?state=open"` |
| 查看 PR 差异 | `gh pr diff` | `git diff main...HEAD`（本地）或 `curl -H "Accept: application/vnd.github.diff" ...` |
| 添加评论 | `gh pr comment N --body "..."` | `curl -X POST .../issues/N/comments -d '{"body":"..."}'` |
| 请求审查 | `gh pr edit N --add-reviewer user` | `curl -X POST .../pulls/N/requested_reviewers -d '{"reviewers":["user"]}'` |
| 关闭 PR | `gh pr close N` | `curl -X PATCH .../pulls/N -d '{"state":"closed"}'` |
| 检出某人的 PR | `gh pr checkout N` | `git fetch origin pull/N/head:pr-N && git checkout pr-N` |