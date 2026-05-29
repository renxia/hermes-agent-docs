---
title: "Github 代码审查 — 通过 gh 或 REST 审查 PR：差异、行内评论"
sidebar_label: "Github 代码审查"
description: "通过 gh 或 REST 审查 PR：差异、行内评论"
---

{/* 此页面由网站脚本 /docs/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。*/}

# Github 代码审查

通过 gh 或 REST 审查 PR：差异、行内评论。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/github/github-code-review` |
| 版本 | `1.1.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `GitHub`, `代码审查`, `Pull-Requests`, `Git`, `质量` |
| 相关技能 | [`github-auth`](/docs/user-guide/skills/bundled/github/github-github-auth), [`github-pr-workflow`](/docs/user-guide/skills/bundled/github/github-github-pr-workflow) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# GitHub 代码审查

在推送前对本地更改进行代码审查，或审查 GitHub 上的拉取请求。此技能大部分使用纯 `git`——仅在涉及 PR 级别交互时才需要区分 `gh` / `curl`。

## 前提条件

- 已通过 GitHub 认证（参见 `github-auth` 技能）
- 位于一个 Git 仓库内

### 设置（用于 PR 交互）

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

## 1. 审查本地更改（推送前）

这纯粹使用 `git`——在任何地方都适用，无需 API。

### 获取差异

```bash
# 已暂存的更改（即将提交的内容）
git diff --staged

# 相对 main 的所有更改（PR 将包含的内容）
git diff main...HEAD

# 仅文件名
git diff main...HEAD --name-only

# 统计摘要（每个文件的插入/删除数）
git diff main...HEAD --stat
```

### 审查策略

1.  **首先了解整体情况：**

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
```

2.  **逐个文件审查** —— 对已更改的文件使用 `read_file` 以获得完整上下文，并使用差异查看更改内容：

```bash
git diff main...HEAD -- src/auth/login.py
```

3.  **检查常见问题：**

```bash
# 遗留的调试语句、TODO、console.logs
git diff main...HEAD | grep -n "print(\|console\.log\|TODO\|FIXME\|HACK\|XXX\|debugger"

# 意外暂存的大文件
git diff main...HEAD --stat | sort -t'|' -k2 -rn | head -10

# 密钥或凭据模式
git diff main...HEAD | grep -in "password\|secret\|api_key\|token.*=\|private_key"

# 合并冲突标记
git diff main...HEAD | grep -n "<<<<<<\|>>>>>>\|======="
```

4.  **向用户展示结构化反馈**。

### 审查输出格式

审查本地更改时，按此结构展示发现：

```
## 代码审查摘要

### 严重问题
- **src/auth.py:45** — SQL 注入：用户输入直接传递给查询。
  建议：使用参数化查询。

### 警告
- **src/models/user.py:23** — 密码以明文存储。使用 bcrypt 或 argon2。
- **src/api/routes.py:112** — 登录端点未设置速率限制。

### 建议
- **src/utils/helpers.py:8** — 与 `src/core/utils.py:34` 的逻辑重复。请整合。
- **tests/test_auth.py** — 缺少边缘情况：过期令牌测试。

### 看起来不错
- 中间件层职责分离清晰
- 正常路径的测试覆盖率良好
```

---

## 2. 审查 GitHub 上的拉取请求

### 查看 PR 详情

**使用 gh：**

```bash
gh pr view 123
gh pr diff 123
gh pr diff 123 --name-only
```

**使用 git + curl：**

```bash
PR_NUMBER=123

# 获取 PR 详情
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER \
  | python3 -c "
import sys, json
pr = json.load(sys.stdin)
print(f\"Title: {pr['title']}\")
print(f\"Author: {pr['user']['login']}\")
print(f\"Branch: {pr['head']['ref']} -> {pr['base']['ref']}\")
print(f\"State: {pr['state']}\")
print(f\"Body:\n{pr['body']}\")"

# 列出已更改的文件
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/files \
  | python3 -c "
import sys, json
for f in json.load(sys.stdin):
    print(f\"{f['status']:10} +{f['additions']:-4} -{f['deletions']:-4}  {f['filename']}\")"
```

### 在本地检出 PR 以进行完整审查

这适用于纯 `git`——无需 `gh`：

```bash
# 获取 PR 分支并检出
git fetch origin pull/123/head:pr-123
git checkout pr-123

# 现在您可以使用 read_file、search_files、运行测试等。

# 查看相对于基础分支的差异
git diff main...pr-123
```

**使用 gh（快捷方式）：**

```bash
gh pr checkout 123
```

### 在 PR 上留下评论

**一般 PR 评论 — 使用 gh：**

```bash
gh pr comment 123 --body "总体看起来不错，下面有一些建议。"
```

**一般 PR 评论 — 使用 curl：**

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/$PR_NUMBER/comments \
  -d '{"body": "总体看起来不错，下面有一些建议。"}'
```

### 留下行内审查评论

**单个行内评论 — 使用 gh（通过 API）：**

```bash
HEAD_SHA=$(gh pr view 123 --json headRefOid --jq '.headRefOid')

gh api repos/$OWNER/$REPO/pulls/123/comments \
  --method POST \
  -f body="这可以通过列表推导式简化。" \
  -f path="src/auth/login.py" \
  -f commit_id="$HEAD_SHA" \
  -f line=45 \
  -f side="RIGHT"
```

**单个行内评论 — 使用 curl：**

```bash
# 获取头部提交 SHA
HEAD_SHA=$(curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['sha'])")

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/comments \
  -d "{
    \"body\": \"这可以通过列表推导式简化。\",
    \"path\": \"src/auth/login.py\",
    \"commit_id\": \"$HEAD_SHA\",
    \"line\": 45,
    \"side\": \"RIGHT\"
  }"
```

### 提交正式审查（批准 / 请求更改）

**使用 gh：**

```bash
gh pr review 123 --approve --body "看起来不错！"
gh pr review 123 --request-changes --body "请查看行内评论。"
gh pr review 123 --comment --body "一些建议，没有阻塞性问题。"
```

**使用 curl — 原子性提交的多评论审查：**

```bash
HEAD_SHA=$(curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['sha'])")

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/reviews \
  -d "{
    \"commit_id\": \"$HEAD_SHA\",
    \"event\": \"COMMENT\",
    \"body\": \"来自 Hermes 智能体的代码审查\",
    \"comments\": [
      {\"path\": \"src/auth.py\", \"line\": 45, \"body\": \"使用参数化查询以防止 SQL 注入。\"},
      {\"path\": \"src/models/user.py\", \"line\": 23, \"body\": \"在存储前使用 bcrypt 对密码进行哈希。\"},
      {\"path\": \"tests/test_auth.py\", \"line\": 1, \"body\": \"添加针对过期令牌边缘情况的测试。\"}
    ]
  }"
```

事件值：`"APPROVE"`、`"REQUEST_CHANGES"`、`"COMMENT"`

`line` 字段指的是文件*新*版本中的行号。对于删除的行，使用 `"side": "LEFT"`。

---

## 3. 审查检查清单

执行代码审查（本地或 PR）时，系统性地检查：

### 正确性
- 代码是否符合其声称的功能？
- 是否处理了边缘情况（空输入、null、大数据、并发访问）？
- 错误路径是否处理得当？

### 安全性
- 没有硬编码的密钥、凭据或 API 密钥
- 对面向用户的输入进行输入验证
- 没有 SQL 注入、XSS 或路径遍历漏洞
- 在需要的地方进行身份验证/授权检查

### 代码质量
- 命名清晰（变量、函数、类）
- 没有不必要的复杂性或过早的抽象
- DRY（Don't Repeat Yourself）——没有应提取的重复逻辑
- 函数职责单一（单一职责原则）

### 测试
- 新代码路径是否经过测试？
- 是否覆盖了正常路径和错误情况？
- 测试是否可读和可维护？

### 性能
- 没有 N+1 查询或不必要的循环
- 在有益的地方使用适当的缓存
- 在异步代码路径中没有阻塞操作

### 文档
- 公共 API 已文档化
- 非显而易见的逻辑有解释“为什么”的注释
- 如果行为改变，README 已更新

---

## 4. 推送前审查工作流程

当用户要求您“审查代码”或“推送前检查”时：

1. `git diff main...HEAD --stat` —— 查看更改范围
2. `git diff main...HEAD` —— 阅读完整差异
3. 对于每个已更改的文件，如果需要更多上下文则使用 `read_file`
4. 应用上述检查清单
5. 以结构化格式展示发现（严重问题 / 警告 / 建议 / 看起来不错）
6. 如果发现严重问题，提议在用户推送前修复

---

## 5. PR 审查工作流程（端到端）

当用户要求您“审查 PR #N”、“看看这个 PR”或给您一个 PR URL 时，请遵循此步骤：

### 步骤 1：设置环境

```bash
source "${HERMES_HOME:-$HOME/.hermes}/skills/github/github-auth/scripts/gh-env.sh"
# 或者运行此技能顶部的内联设置块
```

### 步骤 2：收集 PR 上下文

获取 PR 元数据、描述和已更改文件列表，以便在深入代码之前了解范围。

**使用 gh：**
```bash
gh pr view 123
gh pr diff 123 --name-only
gh pr checks 123
```

**使用 curl：**
```bash
PR_NUMBER=123

# PR 详情（标题、作者、描述、分支）
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER

# 带行数的已更改文件
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER/files
```

### 步骤 3：在本地检出 PR

这让您可以完全访问 `read_file`、`search_files`，以及运行测试的能力。

```bash
git fetch origin pull/$PR_NUMBER/head:pr-$PR_NUMBER
git checkout pr-$PR_NUMBER
```

### 步骤 4：阅读差异并理解更改

```bash
# 相对于基础分支的完整差异
git diff main...HEAD

# 或对于大型 PR 逐个文件进行
git diff main...HEAD --name-only
# 然后对每个文件：
git diff main...HEAD -- path/to/file.py
```

对于每个已更改的文件，使用 `read_file` 查看更改周围的完整上下文——仅靠差异可能会遗漏仅在周围代码中可见的问题。

### 步骤 5：在本地运行自动化检查（如适用）

```bash
# 如果有测试套件则运行测试
python -m pytest 2>&1 | tail -20
# 或：npm test, cargo test, go test ./..., 等等。

# 如果配置了 linter 则运行
ruff check . 2>&1 | head -30
# 或：eslint, clippy, 等等。
```

### 步骤 6：应用审查检查清单（第 3 节）

逐个类别检查：正确性、安全性、代码质量、测试、性能、文档。

### 步骤 7：将审查结果发布到 GitHub

收集您的发现，并作为带有行内评论的正式审查提交。

**使用 gh：**
```bash
# 如果没有问题 — 批准
gh pr review $PR_NUMBER --approve --body "由 Hermes 智能体审查。代码看起来很整洁——测试覆盖率良好，没有安全问题。"

# 如果发现问题 — 请求更改并附带行内评论
gh pr review $PR_NUMBER --request-changes --body "发现一些问题——请查看行内评论。"
```

**使用 curl — 带多个行内评论的原子性审查：**
```bash
HEAD_SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['sha'])")

# 构建审查 JSON — 事件为 APPROVE、REQUEST_CHANGES 或 COMMENT
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER/reviews \
  -d "{
    \"commit_id\": \"$HEAD_SHA\",
    \"event\": \"REQUEST_CHANGES\",
    \"body\": \"## Hermes 智能体审查\n\n发现 2 个问题，1 个建议。请查看行内评论。\",
    \"comments\": [
      {\"path\": \"src/auth.py\", \"line\": 45, \"body\": \"🔴 **严重：** 用户输入直接传递给 SQL 查询——请使用参数化查询。\"},
      {\"path\": \"src/models.py\", \"line\": 23, \"body\": \"⚠️ **警告：** 密码存储未进行哈希。\"},
      {\"path\": \"src/utils.py\", \"line\": 8, \"body\": \"💡 **建议：** 这与 core/utils.py:34 的逻辑重复。\"}
    ]
  }"
```

### 步骤 8：同时发布摘要评论

除了行内评论外，还留下一个顶层摘要，以便 PR 作者能一览全貌。使用 `references/review-output-template.md` 中的审查输出格式。

**使用 gh：**
```bash
gh pr comment $PR_NUMBER --body "$(cat <<'EOF'
## 代码审查摘要

**判定：请求更改**（2 个问题，1 个建议）

### 🔴 严重问题
- **src/auth.py:45** — SQL 注入漏洞

### ⚠️ 警告
- **src/models.py:23** — 明文密码存储

### 💡 建议
- **src/utils.py:8** — 逻辑重复，考虑整合

### ✅ 看起来不错
- API 设计清晰
- 中间件层错误处理良好

---
*由 Hermes 智能体审查*
EOF
)"
```

### 步骤 9：清理

```bash
git checkout main
git branch -D pr-$PR_NUMBER
```

### 决策：批准 vs 请求更改 vs 评论

- **批准** — 没有严重或警告级别的问题，只有小建议或一切正常
- **请求更改** — 存在任何严重或警告级别的问题，应在合并前修复
- **评论** — 观察和建议，但没有阻塞性问题（当您不确定或 PR 是草稿时使用）