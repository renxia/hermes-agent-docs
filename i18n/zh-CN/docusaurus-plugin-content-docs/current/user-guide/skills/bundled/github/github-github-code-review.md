---
title: "Github 代码审查 — 审查 PR：通过 gh 或 REST 查看差异、行内评论"
sidebar_label: "Github 代码审查"
description: "审查 PR：通过 gh 或 REST 查看差异、行内评论"
---

{/* 此页面由网站/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。*/}

# Github 代码审查

审查 PR：通过 gh 或 REST 查看差异、行内评论。

## 技能元数据

| | |
|---|---|
| 源码 | 内置 (默认安装) |
| 路径 | `skills/github/github-code-review` |
| 版本 | `1.1.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `GitHub`, `代码审查`, `Pull-Requests`, `Git`, `质量` |
| 相关技能 | [`github-auth`](/user-guide/skills/bundled/github/github-github-auth), [`github-pr-workflow`](/user-guide/skills/bundled/github/github-github-pr-workflow) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的说明。
:::

# GitHub 代码审查

在推送前对本地更改进行代码审查，或审查 GitHub 上的开放 PR。此技能的大部分内容使用纯 `git`——只有在与 PR 交互时才需要关注 `gh`/`curl` 的区别。

## 前提条件

- 已通过 GitHub 认证（参见 `github-auth` 技能）
- 位于一个 git 仓库内

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

这纯粹是 `git` 操作——在任何地方都有效，不需要 API。

### 获取差异

```bash
# 暂存的更改（即将被提交的内容）
git diff --staged

# 所有相对于 main 分支的更改（一个 PR 会包含的内容）
git diff main...HEAD

# 仅显示文件名
git diff main...HEAD --name-only

# 统计摘要（每个文件的插入/删除行数）
git diff main...HEAD --stat
```

### 审查策略

1.  **先了解整体情况：**

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
```

2.  **逐个文件审查**——对已更改的文件使用 `read_file` 以获取完整上下文，并用差异查看具体更改了什么：

```bash
git diff main...HEAD -- src/auth/login.py
```

3.  **检查常见问题：**

```bash
# 残留的调试语句、TODO、console.log
git diff main...HEAD | grep -n "print(\|console\.log\|TODO\|FIXME\|HACK\|XXX\|debugger"

# 意外暂存的大文件
git diff main...HEAD --stat | sort -t'|' -k2 -rn | head -10

# 密钥或凭证模式
git diff main...HEAD | grep -in "password\|secret\|api_key\|token.*=\|private_key"

# 合并冲突标记
git diff main...HEAD | grep -n "<<<<<<\|>>>>>>\|======="
```

4.  向用户**呈现结构化的反馈**。

### 审查输出格式

在审查本地更改时，按此结构呈现发现：

```
## 代码审查摘要

### 严重问题
- **src/auth.py:45** — SQL 注入：用户输入直接传递给查询。
  建议：使用参数化查询。

### 警告
- **src/models/user.py:23** — 密码以明文存储。使用 bcrypt 或 argon2。
- **src/api/routes.py:112** — 登录端点没有速率限制。

### 建议
- **src/utils/helpers.py:8** — 与 `src/core/utils.py:34` 的逻辑重复。可以合并。
- **tests/test_auth.py** — 缺少边缘情况：过期令牌测试。

### 表现良好
- 中间件层职责分离清晰
- 对正常流程的测试覆盖良好
```

---

## 2. 在 GitHub 上审查 Pull Request

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
print(f\"标题: {pr['title']}\")
print(f\"作者: {pr['user']['login']}\")
print(f\"分支: {pr['head']['ref']} -> {pr['base']['ref']}\")
print(f\"状态: {pr['state']}\")
print(f\"描述:\n{pr['body']}\")"

# 列出已更改的文件
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/files \
  | python3 -c "
import sys, json
for f in json.load(sys.stdin):
    print(f\"{f['status']:10} +{f['additions']:-4} -{f['deletions']:-4}  {f['filename']}\")"
```

### 在本地检出 PR 以便完整审查

这适用于纯 `git`——不需要 `gh`：

```bash
# 拉取 PR 分支并检出
git fetch origin pull/123/head:pr-123
git checkout pr-123

# 现在你可以使用 read_file、search_files、运行测试等。

# 查看相对于基础分支的差异
git diff main...pr-123
```

**使用 gh（快捷方式）：**

```bash
gh pr checkout 123
```

### 在 PR 上留下评论

**通用 PR 评论——使用 gh：**

```bash
gh pr comment 123 --body "总体看起来不错，下面是几点建议。"
```

**通用 PR 评论——使用 curl：**

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/$PR_NUMBER/comments \
  -d '{"body": "总体看起来不错，下面是几点建议。"}'
```

### 留下内联审查评论

**单个内联评论——使用 gh（通过 API）：**

```bash
HEAD_SHA=$(gh pr view 123 --json headRefOid --jq '.headRefOid')

gh api repos/$OWNER/$REPO/pulls/123/comments \
  --method POST \
  -f body="这里可以用列表推导式来简化。" \
  -f path="src/auth/login.py" \
  -f commit_id="$HEAD_SHA" \
  -f line=45 \
  -f side="RIGHT"
```

**单个内联评论——使用 curl：**

```bash
# 获取 head commit 的 SHA
HEAD_SHA=$(curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['sha'])")

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/comments \
  -d "{
    \"body\": \"这里可以用列表推导式来简化。\",
    \"path\": \"src/auth/login.py\",
    \"commit_id\": \"$HEAD_SHA\",
    \"line\": 45,
    \"side\": \"RIGHT\"
  }"
```

### 提交正式审查（批准 / 请求更改）

**使用 gh：**

```bash
gh pr review 123 --approve --body "LGTM!"
gh pr review 123 --request-changes --body "请查看内联评论。"
gh pr review 123 --comment --body "一些建议，没有阻塞性问题。"
```

**使用 curl——原子化提交的多评论审查：**

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
      {\"path\": \"src/models/user.py\", \"line\": 23, \"body\": \"存储前使用 bcrypt 对密码进行哈希处理。\"},
      {\"path\": \"tests/test_auth.py\", \"line\": 1, \"body\": \"为过期令牌边缘情况添加测试。\"}
    ]
  }"
```

事件值：`"APPROVE"`、`"REQUEST_CHANGES"`、`"COMMENT"`

`line` 字段指的是文件*新*版本中的行号。对于已删除的行，使用 `"side": "LEFT"`。

---

## 3. 审查清单

在执行代码审查（本地或 PR）时，系统性地检查：

### 正确性
- 代码是否实现了其声称的功能？
- 是否处理了边缘情况（空输入、null 值、大数据、并发访问）？
- 错误路径是否处理得当？

### 安全性
- 无硬编码的密钥、凭证或 API 密钥
- 对面向用户的输入进行了验证
- 无 SQL 注入、XSS 或路径遍历
- 在需要的地方有认证/授权检查

### 代码质量
- 命名清晰（变量、函数、类）
- 无不必要的复杂性或过早抽象
- DRY——没有应提取的重复逻辑
- 函数职责单一（单一职责原则）

### 测试
- 新的代码路径是否被测试覆盖？
- 正常路径和错误情况是否都覆盖到了？
- 测试是否可读且可维护？

### 性能
- 无 N+1 查询或不必要的循环
- 在有益的地方使用了适当的缓存
- 在异步代码路径中无阻塞操作

### 文档
- 公共 API 已文档化
- 非显而易见的逻辑有解释“为什么”的注释
- 如果行为改变，README 已更新

---

## 4. 推送前审查工作流程

当用户要求你“审查代码”或“推送前检查”时：

1.  `git diff main...HEAD --stat` —— 查看更改范围
2.  `git diff main...HEAD` —— 阅读完整差异
3.  对于每个已更改的文件，如果需要更多上下文，使用 `read_file`
4.  应用上面的清单
5.  按结构化格式（严重问题 / 警告 / 建议 / 表现良好）呈现发现
6.  如果发现严重问题，在用户推送前提出修复建议

---

## 5. PR 审查工作流程（端到端）

当用户要求你“审查 PR #N”、“看看这个 PR”，或给你一个 PR URL 时，遵循以下步骤：

### 步骤 1：设置环境

```bash
source "${HERMES_HOME:-$HOME/.hermes}/skills/github/github-auth/scripts/gh-env.sh"
# 或者运行此技能顶部的内联设置代码块
```

### 步骤 2：收集 PR 上下文

获取 PR 元数据、描述和已更改文件列表，以便在深入代码前了解范围。

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

# 带行数统计的已更改文件
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER/files
```

### 步骤 3：在本地检出 PR

这让你可以完全访问 `read_file`、`search_files`，并能够运行测试。

```bash
git fetch origin pull/$PR_NUMBER/head:pr-$PR_NUMBER
git checkout pr-$PR_NUMBER
```

### 步骤 4：阅读差异并理解更改

```bash
# 相对于基础分支的完整差异
git diff main...HEAD

# 对于大型 PR，可以逐个文件查看
git diff main...HEAD --name-only
# 然后对每个文件：
git diff main...HEAD -- path/to/file.py
```

对于每个已更改的文件，使用 `read_file` 查看更改周围的完整上下文——仅凭差异可能会错过只有在周围代码中才能看出的问题。

### 步骤 5：在本地运行自动化检查（如果适用）

```bash
# 如果有测试套件，运行测试
python -m pytest 2>&1 | tail -20
# 或：npm test, cargo test, go test ./... 等

# 如果配置了 linter，运行 linter
ruff check . 2>&1 | head -30
# 或：eslint, clippy 等
```

### 步骤 6：应用审查清单（第 3 节）

逐一检查每个类别：正确性、安全性、代码质量、测试、性能、文档。

### 步骤 7：将审查发布到 GitHub

收集你的发现，并以包含内联评论的正式审查形式提交。

**使用 gh：**
```bash
# 如果没有问题——批准
gh pr review $PR_NUMBER --approve --body "由 Hermes 智能体审查。代码看起来很干净——测试覆盖良好，无安全问题。"

# 如果发现问题——请求更改并附上内联评论
gh pr review $PR_NUMBER --request-changes --body "发现一些问题——请查看内联评论。"
```

**使用 curl——带多个内联评论的原子化审查：**
```bash
HEAD_SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['sha'])")

# 构建审查 JSON——event 为 APPROVE, REQUEST_CHANGES 或 COMMENT
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER/reviews \
  -d "{
    \"commit_id\": \"$HEAD_SHA\",
    \"event\": \"REQUEST_CHANGES\",
    \"body\": \"## Hermes 智能体审查\n\n发现 2 个问题，1 个建议。请查看内联评论。\",
    \"comments\": [
      {\"path\": \"src/auth.py\", \"line\": 45, \"body\": \"🔴 **严重问题：** 用户输入直接传递给 SQL 查询——请使用参数化查询。\"},
      {\"path\": \"src/models.py\", \"line\": 23, \"body\": \"⚠️ **警告：** 密码存储时未进行哈希处理。\"},
      {\"path\": \"src/utils.py\", \"line\": 8, \"body\": \"💡 **建议：** 这与 core/utils.py:34 的逻辑重复。\"}
    ]
  }"
```

### 步骤 8：同时发布摘要评论

除了内联评论外，留下一个顶层摘要，以便 PR 作者能一目了然地了解全貌。使用 `references/review-output-template.md` 中的审查输出格式。

**使用 gh：**
```bash
gh pr comment $PR_NUMBER --body "$(cat <<'EOF'

## 代码审查摘要

**结论: 需要修改** (2 个问题，1 个建议)

### 🔴 严重问题
- **src/auth.py:45** — SQL 注入漏洞

### ⚠️ 警告
- **src/models.py:23** — 明文密码存储

### 💡 建议
- **src/utils.py:8** — 逻辑重复，建议合并

### ✅ 没有问题
- API 设计清晰
- 中间件层错误处理良好

---
*由 Hermes 智能体审查*
EOF
)"
```

### 第 9 步: 清理

```bash
git checkout main
git branch -D pr-$PR_NUMBER
```

### 决策: 批准 vs 请求修改 vs 评论

- **批准** — 没有严重或警告级别的问题，只有轻微建议或全部通过
- **请求修改** — 存在任何严重或警告级别的问题，应在合并前修复
- **评论** — 观察和建议，但没有阻塞性问题（当你不确定或 PR 为草稿时使用）