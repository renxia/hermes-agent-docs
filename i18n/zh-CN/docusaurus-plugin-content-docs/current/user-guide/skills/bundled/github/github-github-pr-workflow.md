---
title: "Github Pr Workflow — GitHub PR lifecycle: branch, commit, open, CI, merge"
sidebar_label: "Github Pr Workflow"
description: "GitHub PR lifecycle: branch, commit, open, CI, merge"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Github Pr Workflow

GitHub PR 生命周期：分支、提交、打开、CI、合并。

## Skill metadata

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/github/github-pr-workflow` |
| Version | `1.1.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `GitHub`, `Pull-Requests`, `CI/CD`, `Git`, `Automation`, `Merge` |
| Related skills | [`github-auth`](/docs/user-guide/skills/bundled/github/github-github-auth), [`github-code-review`](/docs/user-guide/skills/bundled/github/github-github-code-review) |

## Reference: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# GitHub Pull Request Workflow

完整的 PR 生命周期管理指南。每个部分都首先展示 `gh` 的用法，然后提供对于没有 `gh` 的机器使用的 `git` + `curl` 备用方案。

## Prerequisites (先决条件)

- 已通过 GitHub 进行身份验证（参见 `github-auth` 技能）
- 在一个带有 GitHub 远程仓库的 git 仓库内

### Quick Auth Detection (快速认证检测)

```bash
# Determine which method to use throughout this workflow
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  AUTH="gh"
else
  AUTH="git"
  # Ensure we have a token for API calls
  if [ -z "$GITHUB_TOKEN" ]; then
    if _hermes_env="${HERMES_HOME:-$HOME/.hermes}/.env"; [ -f "$_hermes_env" ] && grep -q "^GITHUB_TOKEN=" "$_hermes_env"; then
      GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" "$_hermes_env" | head -1 | cut -d= -f2 | tr -d '\n\r')
    elif grep -q "github.com" ~/.git-credentials 2>/dev/null; then
      GITHUB_TOKEN=$(grep "github.com" ~/.git-credentials 2>/dev/null | head -1 | sed 's|https://[^:]*:\([^@]*\)@.*|\1|')
    fi
  fi
fi
echo "Using: $AUTH"
```

### Extracting Owner/Repo from the Git Remote (从 Git 远程提取所有者/仓库)

许多 `curl` 命令都需要 `owner/repo`。请从 git 远程中提取它：

```bash
# Works for both HTTPS and SSH remote URLs
REMOTE_URL=$(git remote get-url origin)
OWNER_REPO=$(echo "$REMOTE_URL" | sed -E 's|.*github\.com[:/]||; s|\.git$||')
OWNER=$(echo "$OWNER_REPO" | cut -d/ -f1)
REPO=$(echo "$OWNER_REPO" | cut -d/ -f2)
echo "Owner: $OWNER, Repo: $REPO"
```

---

## 1. Branch Creation (分支创建)

这部分纯粹是 `git` 操作——两种方法完全相同：

```bash
# Make sure you're up to date
git fetch origin
git checkout main && git pull origin main

# Create and switch to a new branch
git checkout -b feat/add-user-authentication
```

分支命名约定：
- `feat/description` — 新功能
- `fix/description` — Bug 修复
- `refactor/description` — 代码重构
- `docs/description` — 文档
- `ci/description` — CI/CD 更改

## 2. Making Commits (进行提交)

使用智能体的文件工具（`write_file`、`patch`）来做出更改，然后提交：

```bash
# Stage specific files
git add src/auth.py src/models/user.py tests/test_auth.py

# Commit with a conventional commit message
git commit -m "feat: add JWT-based user authentication

- Add login/register endpoints
- Add User model with password hashing
- Add auth middleware for protected routes
- Add unit tests for auth flow"
```

提交信息格式（Conventional Commits）：
```
type(scope): short description

Longer explanation if needed. Wrap at 72 characters.
```

类型：`feat` (功能), `fix` (修复), `refactor` (重构), `docs` (文档), `test` (测试), `ci` (CI/CD), `chore` (杂项), `perf` (性能)

## 3. Pushing and Creating a PR (推送和创建 PR)

### Push the Branch (两种方法相同)

```bash
git push -u origin HEAD
```

### Create the PR (创建 PR)

**使用 gh:**

```bash
gh pr create \
  --title "feat: add JWT-based user authentication" \
  --body "## Summary
- Adds login and register API endpoints
- JWT token generation and validation

## Test Plan
- [ ] Unit tests pass

Closes #42"
```

选项：`--draft` (草稿), `--reviewer user1,user2` (指定评审人), `--label "enhancement"` (添加标签), `--base develop` (基础分支)

**使用 git + curl:**

```bash
BRANCH=$(git branch --show-current)

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$OWNER/$REPO/pulls \
  -d "{
    \"title\": \"feat: add JWT-based user authentication\",
    \"body\": \"## Summary\nAdds login and register API endpoints.\n\nCloses #42\",
    \"head\": \"$BRANCH\",
    \"base\": \"main\"
  }"
```

响应 JSON 中包含 PR 的 `number` — 请保存它以备用后续命令。

要创建草稿，请在 JSON body 中添加 `"draft": true`。

## 4. Monitoring CI Status (监控 CI 状态)

### Check CI Status (检查 CI 状态)

**使用 gh:**

```bash
# One-shot check (一次性检查)
gh pr checks

# Watch until all checks finish (polls every 10s) (等待所有检查完成)
gh pr checks --watch
```

**使用 git + curl:**

```bash
# Get the latest commit SHA on the current branch (获取当前分支的最新提交 SHA)
SHA=$(git rev-parse HEAD)

# Query the combined status (查询综合状态)
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/commits/$SHA/status \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"Overall: {data['state']}\")
for s in data.get('statuses', []):
    print(f\"  {s['context']}: {s['state']} - {s.get('description', '')}\")"

# Also check GitHub Actions check runs (separate endpoint) (也检查 GitHub Actions 检查运行状态)
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/commits/$SHA/check-runs \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
for cr in data.get('check_runs', []):
    print(f\"  {cr['name']}: {cr['status']} / {cr['conclusion'] or 'pending'}\")"
```

### Poll Until Complete (git + curl) (轮询直到完成)

```bash
# Simple polling loop — check every 30 seconds, up to 10 minutes (简单的轮询循环——每 30 秒检查一次，最多 10 分钟)
SHA=$(git rev-parse HEAD)
for i in $(seq 1 20); do
  STATUS=$(curl -s \
    -H "Authorization: token $GITHUB_TOKEN" \
    https://api.github.com/repos/$OWNER/$REPO/commits/$SHA/status \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['state'])")
  echo "Check $i: $STATUS"
  if [ "$STATUS" = "success" ] || [ "$STATUS" = "failure" ] || [ "$STATUS" = "error" ]; then
    break
  fi
  sleep 30
done
```

## 5. Auto-Fixing CI Failures (自动修复 CI 失败)

当 CI 失败时，进行诊断和修复。此循环适用于任一认证方法。

### Step 1: Get Failure Details (获取失败详情)

**使用 gh:**

```bash
# List recent workflow runs on this branch (列出该分支最近的工作流运行记录)
gh run list --branch $(git branch --show-current) --limit 5

# View failed logs (查看失败日志)
gh run view <RUN_ID> --log-failed
```

**使用 git + curl:**

```bash
BRANCH=$(git branch --show-current)

# List workflow runs on this branch (列出该分支的工作流运行记录)
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/actions/runs?branch=$BRANCH&per_page=5" \
  | python3 -c "
import sys, json
runs = json.load(sys.stdin)['workflow_runs']
for r in runs:
    print(f\"Run {r['id']}: {r['name']} - {r['conclusion'] or r['status']}\")"

# Get failed job logs (download as zip, extract, read) (获取失败任务日志（下载为 zip，解压，读取）)
RUN_ID=<run_id>
curl -s -L \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/actions/runs/$RUN_ID/logs \
  -o /tmp/ci-logs.zip
cd /tmp && unzip -o ci-logs.zip -d ci-logs && cat ci-logs/*.txt
```

### Step 2: Fix and Push (修复并推送)

确定问题后，使用文件工具（`patch`、`write_file`）进行修复：

```bash
git add <fixed_files>
git commit -m "fix: resolve CI failure in <check_name>"
git push
```

### Step 3: Verify (验证)

使用第 4 节中的命令重新检查 CI 状态。

### Auto-Fix Loop Pattern (自动修复循环模式)

当被要求自动修复 CI 时，请遵循此循环：

1. 检查 CI 状态 → 识别失败
2. 读取失败日志 → 理解错误
3. 使用 `read_file` + `patch`/`write_file` → 修复代码
4. `git add . && git commit -m "fix: ..." && git push`
5. 等待 CI → 重新检查状态
6. 如果仍然失败，则重复（最多尝试 3 次，然后询问用户）

## 6. Merging (合并)

**使用 gh:**

```bash
# Squash merge + delete branch (cleanest for feature branches) (压缩合并 + 删除分支（最适合功能分支的干净方式）)
gh pr merge --squash --delete-branch

# Enable auto-merge (merges when all checks pass) (启用自动合并（当所有检查通过时进行合并）)
gh pr merge --auto --squash --delete-branch
```

**使用 git + curl:**

```bash
PR_NUMBER=<number>

# Merge the PR via API (squash) (通过 API 合并 PR（压缩））
curl -s -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/merge \
  -d "{
    \"merge_method\": \"squash\",
    \"commit_title\": \"feat: add user authentication (#$PR_NUMBER)\"
  }"

# Delete the remote branch after merge (合并后删除远程分支)
BRANCH=$(git branch --show-current)
git push origin --delete $BRANCH

# Switch back to main locally (切换回本地主分支)
git checkout main && git pull origin main
git branch -d $BRANCH
```

合并方法：`"merge"` (合并提交), `"squash"` (压缩), `"rebase"` (变基)

### Enable Auto-Merge (curl) (启用自动合并（curl）)

```bash
# Auto-merge requires the repo to have it enabled in settings.
# This uses the GraphQL API since REST doesn't support auto-merge.
PR_NODE_ID=$(curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['node_id'])")

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/graphql \
  -d "{\"query\": \"mutation { enablePullRequestAutoMerge(input: {pullRequestId: \\\"$PR_NODE_ID\\\", mergeMethod: SQUASH}) { clientMutationId } }\"}"
```

## 7. Complete Workflow Example (完整工作流示例)

```bash
# 1. Start from clean main (从干净的主分支开始)
git checkout main && git pull origin main

# 2. Branch (创建分支)
git checkout -b fix/login-redirect-bug

# 3. (Agent makes code changes with file tools) ((智能体使用文件工具进行代码更改))

# 4. Commit (提交)
git add src/auth/login.py tests/test_login.py
git commit -m "fix: correct redirect URL after login

Preserves the ?next= parameter instead of always redirecting to /dashboard."

# 5. Push (推送)
git push -u origin HEAD

# 6. Create PR (picks gh or curl based on what's available) (创建 PR（根据可用性选择 gh 或 curl）)
# ... (see Section 3)

# 7. Monitor CI (see Section 4) (监控 CI（参见第 4 节）)

# 8. Merge when green (see Section 6) (当状态良好时合并（参见第 6 节）)
```

## Useful PR Commands Reference (实用 PR 命令参考)

| Action (操作) | gh | git + curl |
|--------|-----|-----------|
| List my PRs (列出我的 PR) | `gh pr list --author @me` | `curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/repos/$OWNER/$REPO/pulls?state=open"` |
| View PR diff (查看 PR 差异) | `gh pr diff` | `git diff main...HEAD` (本地) or `curl -H "Accept: application/vnd.github.diff" ...` |
| Add comment (添加评论) | `gh pr comment N --body "..."` | `curl -X POST .../issues/N/comments -d '{"body":"..."}'` |
| Request review (请求评审) | `gh pr edit N --add-reviewer user` | `curl -X POST .../pulls/N/requested_reviewers -d '{"reviewers":["user"]}'` |
| Close PR (关闭 PR) | `gh pr close N` | `curl -X PATCH .../pulls/N -d '{"state":"closed"}'` |
| Check out someone's PR (检出别人的 PR) | `gh pr checkout N` | `git fetch origin pull/N/head:pr-N && git checkout pr-N` |