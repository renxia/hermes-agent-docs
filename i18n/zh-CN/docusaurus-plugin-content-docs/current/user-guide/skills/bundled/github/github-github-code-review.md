---
title: "Github 代码审查 — 通过 gh 或 REST 审查 PR：差异、行内评论"
sidebar_label: "Github 代码审查"
description: "通过 gh 或 REST 审查 PR：差异、行内评论"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Github 代码审查

通过 gh 或 REST 审查 PR：差异、行内评论。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/github/github-code-review` |
| 版本 | `1.1.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `GitHub`, `Code-Review`, `Pull-Requests`, `Git`, `Quality` |
| 相关技能 | [`github-auth`](/docs/user-guide/skills/bundled/github/github-github-auth), [`github-pr-workflow`](/docs/user-guide/skills/bundled/github/github-github-pr-workflow) |

:::info
以下是Hermes加载此技能时看到的完整技能定义。当技能处于活动状态时，智能体看到的就是这些指令。
:::

# GitHub 代码审查

在推送前对本地更改进行代码审查，或审查GitHub上的开放拉取请求。此技能的大部分内容使用普通 `git` — `gh`/`curl` 的分割只在与拉取请求级别的交互时才重要。

## 前提条件

- 已通过GitHub身份验证（参见 `github-auth` 技能）
- 位于git仓库内部

### 设置（用于PR交互）

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

这是纯 `git` 操作——在任何地方都有效，不需要API。

### 获取差异

```bash
# 暂存的更改（将要提交的内容）
git diff --staged

# 相对于main分支的所有更改（PR将包含的内容）
git diff main...HEAD

# 仅显示文件名
git diff main...HEAD --name-only

# 统计摘要（每个文件的插入/删除行数）
git diff main...HEAD --stat
```

### 审查策略

1.  **先看全貌：**

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
```

2.  **逐文件审查** — 对已更改文件使用 `read_file` 以获取完整上下文，并使用差异查看更改了什么：

```bash
git diff main...HEAD -- src/auth/login.py
```

3.  **检查常见问题：**

```bash
# 残留的调试语句、TODO、console.logs
git diff main...HEAD | grep -n "print(\|console\.log\|TODO\|FIXME\|HACK\|XXX\|debugger"

# 意外暂存的大文件
git diff main...HEAD --stat | sort -t'|' -k2 -rn | head -10

# 密钥或凭证模式
git diff main...HEAD | grep -in "password\|secret\|api_key\|token.*=\|private_key"

# 合并冲突标记
git diff main...HEAD | grep -n "<<<<<<\|>>>>>>\|======="
```

4.  **向用户呈现结构化反馈**。

### 审查输出格式

审查本地更改时，按此结构呈现发现：

```
## 代码审查摘要

### 严重问题
- **src/auth.py:45** — SQL注入：用户输入直接传递给查询。
  建议：使用参数化查询。

### 警告
- **src/models/user.py:23** — 密码以明文存储。请使用bcrypt或argon2。
- **src/api/routes.py:112** — 登录端点未设置速率限制。

### 建议
- **src/utils/helpers.py:8** — 与 `src/core/utils.py:34` 逻辑重复。建议合并。
- **tests/test_auth.py** — 缺少边界情况：过期令牌测试。

### 看起来不错
- 中间件层中关注点分离清晰
- 正常路径的测试覆盖良好
```

---

## 2. 在GitHub上审查拉取请求

### 查看PR详情

**使用 gh:**

```bash
gh pr view 123
gh pr diff 123
gh pr diff 123 --name-only
```

**使用 git + curl:**

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

# 列出已更改文件
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/files \
  | python3 -c "
import sys, json
for f in json.load(sys.stdin):
    print(f\"{f['status']:10} +{f['additions']:-4} -{f['deletions']:-4}  {f['filename']}\")"
```

### 在本地签出PR进行完整审查

这使用纯 `git` 即可——不需要 `gh`：

```bash
# 获取PR分支并签出
git fetch origin pull/123/head:pr-123
git checkout pr-123

# 现在你可以使用 read_file, search_files, 运行测试等。

# 查看相对于基础分支的差异
git diff main...pr-123
```

**使用 gh (快捷方式):**

```bash
gh pr checkout 123
```

### 在PR上留下评论

**通用PR评论 — 使用 gh:**

```bash
gh pr comment 123 --body "总体看起来不错，下面是一些建议。"
```

**通用PR评论 — 使用 curl:**

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/$PR_NUMBER/comments \
  -d '{"body": "总体看起来不错，下面是一些建议。"}'
```

### 留下行内审查评论

**单个行内评论 — 使用 gh (通过API):**

```bash
HEAD_SHA=$(gh pr view 123 --json headRefOid --jq '.headRefOid')

gh api repos/$OWNER/$REPO/pulls/123/comments \
  --method POST \
  -f body="这可以用列表推导式简化。" \
  -f path="src/auth/login.py" \
  -f commit_id="$HEAD_SHA" \
  -f line=45 \
  -f side="RIGHT"
```

**单个行内评论 — 使用 curl:**

```bash
# 获取head commit SHA
HEAD_SHA=$(curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['sha'])")

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/comments \
  -d "{
    \"body\": \"这可以用列表推导式简化。\",
    \"path\": \"src/auth/login.py\",
    \"commit_id\": \"$HEAD_SHA\",
    \"line\": 45,
    \"side\": \"RIGHT\"
  }"
```

### 提交正式审查（批准 / 请求更改）

**使用 gh:**

```bash
gh pr review 123 --approve --body "LGTM!"
gh pr review 123 --request-changes --body "请参见行内评论。"
gh pr review 123 --comment --body "一些建议，没有阻塞性问题。"
```

**使用 curl — 原子性提交多评论审查：**

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
    \"body\": \"来自Hermes智能体的代码审查\",
    \"comments\": [
      {\"path\": \"src/auth.py\", \"line\": 45, \"body\": \"使用参数化查询以防止SQL注入。\"},
      {\"path\": \"src/models/user.py\", \"line\": 23, \"body\": \"在存储前使用bcrypt对密码进行哈希处理。\"},
      {\"path\": \"tests/test_auth.py\", \"line\": 1, \"body\": \"为过期令牌边界情况添加测试。\"}
    ]
  }"
```

事件值：`"APPROVE"`, `"REQUEST_CHANGES"`, `"COMMENT"`

`line` 字段指的是文件 *新* 版本中的行号。对于已删除的行，请使用 `"side": "LEFT"`。

---

## 3. 审查检查清单

执行代码审查（本地或PR）时，请系统地检查：

### 正确性
- 代码是否按其声明的方式工作？
- 是否处理了边界情况（空输入、null、大数据、并发访问）？
- 错误路径是否处理得当？

### 安全性
- 没有硬编码的密钥、凭证或API密钥
- 对面向用户的输入进行输入验证
- 没有SQL注入、XSS或路径遍历漏洞
- 在需要的地方进行身份验证/授权检查

### 代码质量
- 命名清晰（变量、函数、类）
- 没有不必要的复杂性或过早抽象
- DRY — 没有应提取的重复逻辑
- 函数聚焦（单一职责）

### 测试
- 新的代码路径是否经过测试？
- 正常路径和错误情况是否覆盖？
- 测试是否可读且可维护？

### 性能
- 没有N+1查询或不必要的循环
- 在有益的地方适当缓存
- 在异步代码路径中没有阻塞操作

### 文档
- 公开的API有文档说明
- 非显而易见的逻辑有解释“为什么”的注释
- 如果行为已更改，则更新README

---

## 4. 推送前审查工作流

当用户要求你“审查代码”或“在推送前检查”时：

1. `git diff main...HEAD --stat` — 查看更改范围
2. `git diff main...HEAD` — 阅读完整差异
3. 对于每个已更改的文件，如果需要更多上下文，请使用 `read_file`
4. 应用上面的检查清单
5. 按结构化格式呈现发现（严重问题 / 警告 / 建议 / 看起来不错）
6. 如果发现严重问题，提供在用户推送前修复它们

---

## 5. PR审查工作流（端到端）

当用户要求你“审查PR #N”、“看看这个PR”或给你一个PR URL时，请遵循此方案：

### 步骤 1：设置环境

```bash
source "${HERMES_HOME:-$HOME/.hermes}/skills/github/github-auth/scripts/gh-env.sh"
# 或运行此技能顶部的内联设置块
```

### 步骤 2：收集PR上下文

获取PR元数据、描述和已更改文件列表，以在深入代码之前了解范围。

**使用 gh:**
```bash
gh pr view 123
gh pr diff 123 --name-only
gh pr checks 123
```

**使用 curl:**
```bash
PR_NUMBER=123

# PR详情（标题、作者、描述、分支）
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER

# 已更改文件及行数统计
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER/files
```

### 步骤 3：在本地签出PR

这使你可以完全访问 `read_file`、`search_files` 以及运行测试的能力。

```bash
git fetch origin pull/$PR_NUMBER/head:pr-$PR_NUMBER
git checkout pr-$PR_NUMBER
```

### 步骤 4：阅读差异并理解更改

```bash
# 相对于基础分支的完整差异
git diff main...HEAD

# 或对于大型PR，逐文件查看
git diff main...HEAD --name-only
# 然后对于每个文件：
git diff main...HEAD -- path/to/file.py
```

对于每个已更改的文件，使用 `read_file` 查看更改周围的完整上下文——仅靠差异可能会遗漏只有在周围代码中才能看到的问题。

### 步骤 5：在本地运行自动化检查（如适用）

```bash
# 如果有测试套件，运行测试
python -m pytest 2>&1 | tail -20
# 或：npm test, cargo test, go test ./..., 等等。

# 如果配置了linter，运行它
ruff check . 2>&1 | head -30
# 或：eslint, clippy, 等等。
```

### 步骤 6：应用审查检查清单（第3节）

逐一检查每个类别：正确性、安全性、代码质量、测试、性能、文档。

### 步骤 7：将审查发布到GitHub

收集你的发现，并作为包含行内评论的正式审查提交。

**使用 gh:**
```bash
# 如果没有问题 — 批准
gh pr review $PR_NUMBER --approve --body "由Hermes智能体审查。代码看起来很干净——测试覆盖良好，无安全问题。"

# 如果发现问题 — 请求更改并附带行内评论
gh pr review $PR_NUMBER --request-changes --body "发现一些问题——请参见行内评论。"
```

**使用 curl — 包含多个行内评论的原子审查：**
```bash
HEAD_SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['sha'])")

# 构建审查JSON — 事件为 APPROVE, REQUEST_CHANGES 或 COMMENT
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER/reviews \
  -d "{
    \"commit_id\": \"$HEAD_SHA\",
    \"event\": \"REQUEST_CHANGES\",
    \"body\": \"## Hermes智能体审查\n\n发现2个问题，1个建议。请参见行内评论。\",
    \"comments\": [
      {\"path\": \"src/auth.py\", \"line\": 45, \"body\": \"🔴 **严重：** 用户输入直接传递给SQL查询——请使用参数化查询。\"},
      {\"path\": \"src/models.py\", \"line\": 23, \"body\": \"⚠️ **警告：** 密码未经哈希处理即存储。\"},
      {\"path\": \"src/utils.py\", \"line\": 8, \"body\": \"💡 **建议：** 这与core/utils.py:34的逻辑重复。\"}
    ]
  }"
```

### 步骤 8：同时发布摘要评论

除了行内评论外，还要留下一个顶层摘要，以便PR作者可以一目了然地了解全貌。使用 `references/review-output-template.md` 中的审查输出格式。

**使用 gh:**
```bash
gh pr comment $PR_NUMBER --body "$(cat <<'EOF'

## 代码审查摘要

**结论：要求修改**（2个问题，1个建议）

### 🔴 严重问题
- **src/auth.py:45** — SQL注入漏洞

### ⚠️ 警告
- **src/models.py:23** — 明文密码存储

### 💡 建议
- **src/utils.py:8** — 重复逻辑，建议整合

### ✅ 状态良好
- 清晰的API设计
- 中间件层错误处理良好

---
*由 Hermes 智能体 审核*
EOF
)"
```

### 步骤 9：清理

```bash
git checkout main
git branch -D pr-$PR_NUMBER
```

### 决策：批准 vs 要求修改 vs 评论

- **批准** — 无严重或警告级别问题，仅有小建议或全部通过
- **要求修改** — 任何合并前应修复的严重或警告级别问题
- **评论** — 观察与建议，但无阻塞性内容（当不确定或PR为草稿时使用）