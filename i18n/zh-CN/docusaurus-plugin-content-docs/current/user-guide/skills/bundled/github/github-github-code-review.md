---
title: "Github 代码审查"
sidebar_label: "Github 代码审查"
description: "通过分析 git diff、在 PR 上留下行内评论以及执行彻底的推送前审查来审查代码更改"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Github 代码审查

通过分析 git diff、在 PR 上留下行内评论以及执行彻底的推送前审查来审查代码更改。支持 gh CLI，或使用 curl 通过 git + GitHub REST API 作为备用方案。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/github/github-code-review` |
| 版本 | `1.1.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 标签 | `GitHub`, `代码审查`, `拉取请求`, `Git`, `质量` |
| 相关技能 | [`github-auth`](/docs/user-guide/skills/bundled/github/github-github-auth), [`github-pr-workflow`](/docs/user-guide/skills/bundled/github/github-github-pr-workflow) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# GitHub 代码审查

在推送之前对本地更改进行代码审查，或审查 GitHub 上的开放 PR。此技能的大部分功能使用纯 `git` —— 只有在 PR 级别的交互中，`gh`/`curl` 的区别才重要。

## 先决条件

- 已通过 GitHub 认证（参见 `github-auth` 技能）
- 位于 git 仓库内

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

这是纯 `git` —— 在所有地方都有效，无需 API。

### 获取差异

```bash
# 已暂存的更改（将要提交的内容）
git diff --staged

# 与 main 相比的所有更改（PR 将包含的内容）
git diff main...HEAD

# 仅文件名
git diff main...HEAD --name-only

# 统计摘要（每个文件的插入/删除）
git diff main...HEAD --stat
```

### 审查策略

1. **首先了解整体情况：**

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
```

2. **逐文件审查** —— 对更改的文件使用 `read_file` 以获取完整上下文，并使用差异查看更改内容：

```bash
git diff main...HEAD -- src/auth/login.py
```

3. **检查常见问题：**

```bash
# 调试语句、TODO、遗留的 console.log
git diff main...HEAD | grep -n "print(\|console\.log\|TODO\|FIXME\|HACK\|XXX\|debugger"

# 意外暂存的大文件
git diff main...HEAD --stat | sort -t'|' -k2 -rn | head -10

# 密钥或凭据模式
git diff main...HEAD | grep -in "password\|secret\|api_key\|token.*=\|private_key"

# 合并冲突标记
git diff main...HEAD | grep -n "<<<<<<\|>>>>>>\|======="
```

4. **向用户呈现结构化反馈。**

### 审查输出格式

审查本地更改时，按以下结构呈现结果：

```
## 代码审查摘要

### 严重问题
- **src/auth.py:45** —— SQL 注入：用户输入直接传递给查询。
  建议：使用参数化查询。

### 警告
- **src/models/user.py:23** —— 密码以明文存储。使用 bcrypt 或 argon2。
- **src/api/routes.py:112** —— 登录端点没有速率限制。

### 建议
- **src/utils/helpers.py:8** —— 与 `src/core/utils.py:34` 中的逻辑重复。应合并。
- **tests/test_auth.py** —— 缺少边缘情况测试：过期令牌测试。

### 看起来不错
- 中间件层关注点分离清晰
- 正常路径的测试覆盖良好
```

---

## 2. 审查 GitHub 上的 Pull Request

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
print(f\"正文:\n{pr['body']}\")"

# 列出更改的文件
curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/files \
  | python3 -c "
import sys, json
for f in json.load(sys.stdin):
    print(f\"{f['status']:10} +{f['additions']:-4} -{f['deletions']:-4}  {f['filename']}\")"
```

### 在本地检出 PR 以进行全面审查

这使用纯 `git` —— 无需 `gh`：

```bash
# 获取 PR 分支并检出
git fetch origin pull/123/head:pr-123
git checkout pr-123

# 现在可以使用 read_file、search_files、运行测试等。

# 查看与基础分支的差异
git diff main...pr-123
```

**使用 gh（快捷方式）：**

```bash
gh pr checkout 123
```

### 在 PR 上留下评论

**一般 PR 评论 —— 使用 gh：**

```bash
gh pr comment 123 --body "总体看起来不错，下面有一些建议。"
```

**一般 PR 评论 —— 使用 curl：**

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$OWNER/$REPO/issues/$PR_NUMBER/comments \
  -d '{"body": "总体看起来不错，下面有一些建议。"}'
```

### 留下行内审查评论

**单行内评论 —— 使用 gh（通过 API）：**

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

**单行内评论 —— 使用 curl：**

```bash
# 获取头提交的 SHA
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

**使用 gh：**

```bash
gh pr review 123 --approve --body "LGTM!"
gh pr review 123 --request-changes --body "参见行内评论。"
gh pr review 123 --comment --body "一些建议，没有阻碍性问题。"
```

**使用 curl —— 原子性提交多评论审查：**

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
      {\"path\": \"src/models/user.py\", \"line\": 23, \"body\": \"存储前使用 bcrypt 对密码进行哈希。\"},
      {\"path\": \"tests/test_auth.py\", \"line\": 1, \"body\": \"添加过期令牌边缘情况的测试。\"}
    ]
  }"
```

事件值：`"APPROVE"`、`"REQUEST_CHANGES"`、`"COMMENT"`

`line` 字段指的是文件*新版本*中的行号。对于已删除的行，使用 `"side": "LEFT"`。

---

## 3. 审查清单

执行代码审查（本地或 PR）时，系统地检查：

### 正确性
- 代码是否如其声称的那样工作？
- 是否处理了边缘情况（空输入、null、大数据、并发访问）？
- 错误路径是否得到妥善处理？

### 安全性
- 没有硬编码的密钥、凭据或 API 密钥
- 对用户输入进行输入验证
- 没有 SQL 注入、XSS 或路径遍历
- 在需要的地方进行身份验证/授权检查

### 代码质量
- 命名清晰（变量、函数、类）
- 没有不必要的复杂性或过早的抽象
- DRY —— 没有应提取的重复逻辑
- 函数专注（单一职责）

### 测试
- 新代码路径是否经过测试？
- 正常路径和错误情况是否都覆盖到了？
- 测试是否可读且可维护？

### 性能
- 没有 N+1 查询或不必要的循环
- 在有益的地方使用适当的缓存
- 异步代码路径中没有阻塞操作

### 文档
- 公共 API 已记录
- 非显而易见的逻辑有解释“为什么”的注释
- 如果行为发生变化，README 已更新

---

## 4. 推送前审查工作流

当用户要求你“审查代码”或“在推送前检查”时：

1. `git diff main...HEAD --stat` —— 查看更改范围
2. `git diff main...HEAD` —— 阅读完整差异
3. 对于每个更改的文件，如果需要更多上下文，请使用 `read_file`
4. 应用上述清单
5. 以结构化格式呈现结果（严重问题 / 警告 / 建议 / 看起来不错）
6. 如果发现严重问题，请在用户推送之前提供修复建议

---

## 5. PR 审查工作流（端到端）

当用户要求你“审查 PR #N”、“查看此 PR”或给你一个 PR URL 时，请遵循以下步骤：

### 步骤 1：设置环境

```bash
source "${HERMES_HOME:-$HOME/.hermes}/skills/github/github-auth/scripts/gh-env.sh"
# 或运行此技能顶部的内联设置块
```

### 步骤 2：收集 PR 上下文

获取 PR 元数据、描述和更改文件列表，以在深入代码之前了解范围。

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

# 带行数的更改文件
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER/files
```

### 步骤 3：在本地检出 PR

这让你可以完全访问 `read_file`、`search_files` 以及运行测试的能力。

```bash
git fetch origin pull/$PR_NUMBER/head:pr-$PR_NUMBER
git checkout pr-$PR_NUMBER
```

### 步骤 4：阅读差异并理解更改

```bash
# 与基础分支的完整差异
git diff main...HEAD

# 或者对于大型 PR，逐文件查看
git diff main...HEAD --name-only
# 然后对每个文件：
git diff main...HEAD -- path/to/file.py
```

对于每个更改的文件，使用 `read_file` 查看更改周围的完整上下文 —— 仅靠差异可能会遗漏只有在周围代码中才可见的问题。

### 步骤 5：在本地运行自动化检查（如果适用）

```bash
# 如果有测试套件，运行测试
python -m pytest 2>&1 | tail -20
# 或：npm test, cargo test, go test ./..., 等。

# 如果配置了，运行 linter
ruff check . 2>&1 | head -30
# 或：eslint, clippy, 等。
```

### 步骤 6：应用审查清单（第 3 节）

遍历每个类别：正确性、安全性、代码质量、测试、性能、文档。

### 步骤 7：将审查发布到 GitHub

收集你的发现，并以带有行内评论的正式审查形式提交。

**使用 gh：**
```bash
# 如果没有问题 —— 批准
gh pr review $PR_NUMBER --approve --body "由 Hermes 智能体审查。代码看起来很干净 —— 测试覆盖良好，没有安全问题。"

# 如果发现问题 —— 请求更改并附上行内评论
gh pr review $PR_NUMBER --request-changes --body "发现了一些问题 —— 参见行内评论。"
```

**使用 curl —— 带有多个行内评论的原子性审查：**
```bash
HEAD_SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['sha'])")

# 构建审查 JSON —— 事件为 APPROVE、REQUEST_CHANGES 或 COMMENT
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls/$PR_NUMBER/reviews \
  -d "{
    \"commit_id\": \"$HEAD_SHA\",
    \"event\": \"REQUEST_CHANGES\",
    \"body\": \"## Hermes 智能体审查\n\n发现 2 个问题，1 个建议。参见行内评论。\",
    \"comments\": [
      {\"path\": \"src/auth.py\", \"line\": 45, \"body\": \"🔴 **严重问题：** 用户输入直接传递给 SQL 查询 —— 使用参数化查询。\"},
      {\"path\": \"src/models.py\", \"line\": 23, \"body\": \"⚠️ **警告：** 密码存储时未进行哈希。\"},
      {\"path\": \"src/utils.py\", \"line\": 8, \"body\": \"💡 **建议：** 这与 core/utils.py:34 中的逻辑重复。\"}
    ]
  }"
```

### 步骤 8：同时发布总结评论

除了行内评论外，还要留下一个顶级总结，以便 PR 作者一目了然地了解全貌。使用 `references/review-output-template.md` 中的审查输出格式。

**使用 gh：**
```bash
gh pr comment $PR_NUMBER --body "$(cat <<'EOF'

## 代码审查摘要

**结论：请求修改**（2个问题，1条建议）

### 🔴 严重
- **src/auth.py:45** — SQL注入漏洞

### ⚠️ 警告
- **src/models.py:23** — 明文密码存储

### 💡 建议
- **src/utils.py:8** — 逻辑重复，建议合并

### ✅ 良好
- 清晰的API设计
- 中间件层良好的错误处理

---
*由 Hermes 智能体审查*
EOF
)"
```

### 步骤9：清理

```bash
git checkout main
git branch -D pr-$PR_NUMBER
```

### 决定：批准 vs 请求修改 vs 评论

- **批准** — 无严重或警告级别问题，仅有轻微建议或全部通过
- **请求修改** — 存在任何应在合并前修复的严重或警告级别问题
- **评论** — 观察和建议，但无阻碍项（当您不确定或PR为草稿时使用）