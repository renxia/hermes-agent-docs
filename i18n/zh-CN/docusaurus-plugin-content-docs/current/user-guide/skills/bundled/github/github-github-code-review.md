---
title: "Github Code Review — Review PRs: diffs, inline comments via gh or REST"
sidebar_label: "Github 代码审查"
description: "Review PRs: diffs, inline comments via gh or REST"
---

{/* 本页面由网站/scripts/generate-skill-docs.py 根据技能的SKILL.md自动生成。请编辑源文件SKILL.md，而不是本页面。 */}

# Github 代码审查

审查PR：通过gh或REST进行差异和内联评论。

## 技能元数据

| | |
|---|---|
| 源 | 打包好的（默认安装） |
| Path | `skills/github/github-code-review` |
| Version | `1.1.0` |
| 作者 | Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `GitHub`, `Code-Review`, `Pull-Requests`, `Git`, `Quality` |
| Related skills | [`github-auth`](/docs/user-guide/skills/bundled/github/github-github-auth), [`github-pr-workflow`](/docs/user-guide/skills/bundled/github/github-pr-workflow) |

## 关键路径和配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥和秘密信息（如果设置了$HERMES_HOME）
```

# GitHub 代码审查

在推送代码之前对本地更改进行代码审查，或审查GitHub上的开放PR。本技能的大部分内容都使用纯粹的`git`——只有涉及PR级别交互时才需要区分`gh`/`curl`。

## 前提条件

- 已通过GitHub身份验证（参见`github-auth`技能）
- 位于一个Git仓库内

### 设置（针对PR交互）

```bash
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  AUTH="gh"
else
  AUTH="git"
  if [ -z "$GITHUB_TOKEN" ]; then
    if _hermes_env="${HERMES_HOME:-$HOME/.hermes}/.env"; [ -f "$_hermes_env" ] && grep -q "^GITHUB_TOKEN=" "$_hermes_env"; then
      GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" "$_hermes_env" | head -1 | cut -d= -f2 | tr -d '\n\r')
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

## 1. 审查本地更改（预推送）

这是纯粹的`git`操作——可以在任何地方使用，不需要API。

### 获取差异 (Diff)

```bash
# 已暂存的更改（将被提交的内容）
git diff --staged

# 相对于main分支的所有更改（PR可能包含的内容）
git diff main...HEAD

# 文件名のみ
git diff main...HEAD --name-only

# 统计摘要（每个文件的插入/删除量）
git diff main...HEAD --stat
```

### 审查策略

1. **先了解全局概况：**

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
```

2. **逐文件审查** — 对更改的文件使用`read_file`以获取完整上下文，并使用diff来查看具体改动：

```bash
git diff main...HEAD -- src/auth/login.py
```

3. **检查常见问题：**

```bash
# 遗留的调试语句、TODO、console.logs
git diff main...HEAD | grep -n "print(\|console\.log\|TODO\|FIXME\|HACK\|XXX\|debugger"

# 意外暂存的大文件
git diff main...HEAD --stat | sort -t'|' -k2 -rn | head -10

# 秘密或凭证模式
git diff main...HEAD | grep -in "password\|secret\|api_key\|token.*=\|private_key"

# 合并冲突标记
git diff main...HEAD | grep -n "<<<<<<\|>>>>>>\|======="
```

4. **向用户呈现结构化的反馈。**

### 审查输出格式

在审查本地更改时，请使用以下结构展示发现：

```
## 代码审查摘要

### 🔴 关键问题 (Critical)
- **src/auth.py:45** — SQL注入：用户输入直接传递给查询。
  建议：使用参数化查询。

### ⚠️ 警告 (Warnings)
- **src/models/user.py:23** — 密码以明文形式存储。请使用bcrypt或argon2。
- **src/api/routes.py:112** — 登录端点没有速率限制。

### 💡 建议 (Suggestions)
- **src/utils/helpers.py:8** — 与`src/core/utils.py:34`中的逻辑重复。请进行整合。
- **tests/test_auth.py** — 缺少过期令牌的边缘案例测试。

### ✅ 看起来不错 (Looks Good)
- 中间件层的关注点分离清晰
- 正常路径的测试覆盖良好
```

---

## 2. 审查GitHub上的拉取请求 (Pull Request, PR)

### 查看PR详情

**使用gh：**

```bash
gh pr view 123
gh pr diff 123
gh pr diff 123 --name-only
```

**使用git + curl：**

```bash
PR_NUMBER=123

# 获取PR详情
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

# 列出更改的文件
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/files \
  | python3 -c "
import sys, json
for f in json.load(sys.stdin):
    print(f\"{f['status']:10} +{f['additions']:-4} -{f['deletions']:-4}  {f['filename']}\")"
```

### 本地检出PR以进行全面审查

这可以使用纯粹的`git`完成——无需`gh`：

```bash
# 获取PR分支并检出
git fetch origin pull/123/head:pr-123
git checkout pr-123

# 现在可以使用read_file、search_files、运行测试等功能。

# 查看相对于基础分支的差异
git diff main...pr-123
```

**使用gh（快捷方式）：**

```bash
gh pr checkout 123
```

### 在PR上留下评论

**普通PR评论 — 使用gh：**

```bash
gh pr comment 123 --body "总体看起来不错，有一些建议如下。"
```

**普通PR评论 — 使用curl：**

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/$PR_NUMBER/comments \
  -d '{"body": "总体看起来不错，有一些建议如下。"}'
```

### 留下行内审查评论

**单个行内评论 — 使用gh（通过API）：**

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

**单个行内评论 — 使用curl：**

```bash
# 获取头提交的SHA
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

**使用gh：**

```bash
gh pr review 123 --approve --body "LGTM!"
gh pr review 123 --request-changes --body "请看行内评论。"
gh pr review 123 --comment --body "有一些建议，但都不是阻碍性的。"
```

**使用curl — 原子性提交多条评论的审查：**

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
    \"body\": \"赫尔墨斯智能体代码审查\",
    \"comments\": [
      {\"path\": \"src/auth.py\", \"line\": 45, \"body\": \"使用参数化查询以防止SQL注入。\"},
      {\"path\": \"src/models/user.py\", \"line\": 23, \"body\": \"在存储之前使用bcrypt哈希密码。\"},
      {\"path\": \"tests/test_auth.py\", \"line\": 1, \"body\": \"添加过期令牌的边缘案例测试。\"}
    ]
  }"
```

事件值: `"APPROVE"`, `"REQUEST_CHANGES"`, `"COMMENT"`

`line`字段指的是文件的*新版本*中的行号。对于被删除的行，请使用`"side": "LEFT"`。

---

## 3. 审查清单 (Checklist)

在进行代码审查（本地或PR）时，系统地检查以下内容：

### 正确性 (Correctness)
- 代码是否完成了它声称要做的事？
- 是否处理了边缘案例（空输入、null值、大数据、并发访问）？
- 错误路径是否得到了优雅的处理？

### 安全性 (Security)
- 是否有硬编码的秘密信息、凭证或API密钥？
- 对用户输入进行了验证。
- 没有SQL注入、XSS或路径遍历漏洞。
- 在需要的地方进行了身份验证/授权检查。

### 代码质量 (Code Quality)
- 命名清晰（变量、函数、类）。
- 没有不必要的复杂性或过早的抽象。
- DRY — 没有应该提取出来的重复逻辑。
- 函数是聚焦的（单一职责）。

### 测试 (Testing)
- 新的代码路径是否经过测试？
- 是否覆盖了正常路径和错误情况？
- 测试是否可读且易于维护？

### 性能 (Performance)
- 没有N+1查询或不必要的循环。
- 在有益的地方进行了适当的缓存。
- 异步代码路径中没有阻塞操作。

### 文档化 (Documentation)
- 公共API是否已记录。
- 非显而易见的逻辑是否有“为什么”的注释说明。
- 如果行为发生变化，README是否已更新。

---

## 4. 预推送审查工作流

当用户要求你“审查代码”或“在推送前检查”时：

1. `git diff main...HEAD --stat` — 查看更改范围
2. `git diff main...HEAD` — 阅读完整的差异
3. 对于每个更改的文件，如果需要更多上下文，请使用`read_file`
4. 应用上述清单
5. 以结构化格式（关键问题 / 警告 / 建议 / 看起来不错）呈现发现
6. 如果发现关键问题，提供修复选项，防止用户推送。

---

## 5. PR审查工作流（端到端）

当用户要求你“审查PR #N”、“看看这个PR”，或提供了PR URL时，请遵循以下流程：

### 第1步：设置环境

```bash
source "${HERMES_HOME:-$HOME/.hermes}/skills/github/github-auth/scripts/gh-env.sh"
# 或运行此技能顶部的内联设置块
```

### 第2步：收集PR上下文

获取PR的元数据、描述和更改文件列表，以便在深入代码之前了解其范围。

**使用gh：**
```bash
gh pr view 123
gh pr diff 123 --name-only
gh pr checks 123
```

**使用curl：**
```bash
PR_NUMBER=123

# PR详情（标题、作者、描述、分支）
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER

# 更改文件及其行数
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER/files
```

### 第3步：本地检出PR

这让你能够完全使用`read_file`、`search_files`和运行测试。

```bash
git fetch origin pull/$PR_NUMBER/head:pr-$PR_NUMBER
git checkout pr-$PR_NUMBER
```

### 第4步：阅读差异并理解更改

```bash
# 相对于基础分支的完整差异
git diff main...HEAD

# 或针对大PR进行逐文件检查
git diff main...HEAD --name-only
# 然后对每个文件：
git diff main...HEAD -- path/to/file.py
```

对于每个更改的文件，请使用`read_file`查看围绕更改的完整上下文——仅凭差异可能无法发现只有结合周围代码才能看到的问题。

### 第5步：本地运行自动化检查（如果适用）

```bash
# 如果有测试套件，则运行测试
python -m pytest 2>&1 | tail -20
# 或: npm test, cargo test, go test ./..., etc.

# 如果配置了linter，则运行linter
ruff check . 2>&1 | head -30
# 或: eslint, clippy, etc.
```

### 第6步：应用审查清单（第3节）

遍历每个类别：正确性、安全性、代码质量、测试、性能、文档。

### 第7步：将审查结果发布到GitHub

收集你的发现，并作为正式审查和行内评论提交。

**使用gh：**
```bash
# 如果没有问题 — 批准
gh pr review $PR_NUMBER --approve --body "已由赫尔墨斯智能体审查。代码看起来很干净——测试覆盖良好，没有安全顾虑。"

# 如果发现问题 — 请求更改并附上行内评论
gh pr review $PR_NUMBER --request-changes --body "发现了一些问题——请看行内评论。"
```

**使用curl — 原子性审查和多条行内评论：**
```bash
HEAD_SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['sha'])")

# 构建审查JSON — event为APPROVE、REQUEST_CHANGES或COMMENT
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER/reviews \
  -d "{
    \"commit_id\": \"$HEAD_SHA\",
    \"event\": \"REQUEST_CHANGES\",
    \"body\": \"## 赫尔墨斯智能体审查\\n\\n发现2个问题，1条建议。请看行内评论。\",
    \"comments\": [
      {\"path\": \"src/auth.py\", \"line\": 45, \"body\": \"🔴 **关键问题:** 用户输入直接传递给SQL查询——请使用参数化查询。\"},
      {\"path\": \"src/models.py\", \"line\": 23, \"body\": \"⚠️ **警告:** 密码未进行哈希存储。\"},
      {\"path\": \"src/utils.py\", \"line\": 8, \"body\": \"💡 **建议:** 这与core/utils.py:34中的逻辑重复。\"}
    ]
  }"
```

### 第8步：也发布一份摘要评论

除了行内评论外，请留下一个顶层摘要，以便PR作者可以一目了然地了解情况。使用`references/review-output-template.md`中的审查输出格式。

**使用gh：**
```bash
gh pr comment $PR_NUMBER --body "$(cat <<'EOF'
## 代码审查摘要

**裁决结果: 请求更改 (Changes Requested)** (2个问题, 1条建议)

### 🔴 关键问题 (Critical)
- **src/auth.py:45** — SQL注入漏洞

### ⚠️ 警告 (Warnings)
- **src/models.py:23** — 明文密码存储

### 💡 建议 (Suggestions)
- **src/utils.py:8** — 重复逻辑，请考虑整合

### ✅ 看起来不错 (Looks Good)
- 清晰的API设计
- 中间件层的错误处理良好

---
*由赫尔墨斯智能体审查*
EOF
)"
```

### 第9步：清理工作

```bash
git checkout main
git branch -D pr-$PR_NUMBER
```

### 决策：批准 vs 请求更改 vs 评论

- **批准 (Approve)** — 没有关键问题或警告级的问题，只有次要的建议或一切正常。
- **请求更改 (Request Changes)** — 任何在合并前必须修复的关键或警告级问题。
- **评论 (Comment)** — 观察和建议，但不是阻碍性的（当你不确定或PR是草稿时使用）。