---
title: "Github Auth — GitHub auth setup: HTTPS tokens, SSH keys, gh CLI login"
sidebar_label: "Github Auth"
description: "GitHub 身份验证设置：HTTPS 令牌、SSH 密钥、gh CLI 登录"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Github Auth

GitHub 身份验证设置：HTTPS 令牌、SSH 密钥、gh CLI 登录。

## Skill metadata

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/github/github-auth` |
| Version | `1.1.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `GitHub`, `Authentication`, `Git`, `gh-cli`, `SSH`, `Setup` |
| Related skills | [`github-pr-workflow`](/docs/user-guide/skills/bundled/github/github-github-pr-workflow), [`github-code-review`](/docs/user-guide/skills/bundled/github/github-github-code-review), [`github-issues`](/docs/user-guide/skills/bundled/github/github-github-issues), [`github-repo-management`](/docs/user-guide/skills/bundled/github/github-github-repo-management) |

## Reference: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时的指令。
:::

# GitHub 身份验证设置

本技能设置了身份验证，使智能体能够与 GitHub 仓库、PR、问题和 CI 进行交互。它涵盖两种路径：

- **`git` (始终可用)** — 使用 HTTPS 个人访问令牌或 SSH 密钥
- **`gh` CLI (如果已安装)** — 更丰富的 GitHub API 访问，具有更简单的身份验证流程

## 检测流程

当用户要求你与 GitHub 协作时，请先运行此检查：

```bash
# 检查可用功能
git --version
gh --version 2>/dev/null || echo "gh 未安装"

# 检查是否已认证
gh auth status 2>/dev/null || echo "gh 未认证"
git config --global credential.helper 2>/dev/null || echo "未设置 git 凭证助手"
```

**决策树：**
1. 如果 `gh auth status` 显示已认证 → 你没问题，使用 `gh` 来处理所有事情
2. 如果安装了 `gh` 但未认证 → 使用下面的“gh auth”方法
3. 如果未安装 `gh` → 使用下面的“git-only”方法（无需 sudo）

---

## 方法 1: Git-Only 身份验证 (无 gh，无 sudo)

这在任何安装了 `git` 的机器上都有效。不需要 root 权限。

### 选项 A: HTTPS + 个人访问令牌 (推荐)

这是最可移植的方法——在哪里都可以使用，无需 SSH 配置。

**步骤 1: 创建个人访问令牌**

请用户前往：**https://github.com/settings/tokens**

- 点击“Generate new token (classic)”（生成新令牌）
- 给它起一个名字，例如 "hermes-agent"
- 选择范围权限 (scopes)：
  - `repo` (完整的仓库访问权限 — 读取、写入、推送、PR)
  - `workflow` (触发和管理 GitHub Actions)
  - `read:org` (如果处理组织仓库)
- 设置过期时间（90 天是一个不错的默认值）
- 复制令牌——它将不会再次显示

**步骤 2: 配置 git 以存储令牌**

```bash
# 设置凭证助手以缓存凭据
# "store" 将数据保存到 ~/.git-credentials (纯文本，简单，持久)
git config --global credential.helper store

# 现在执行一个触发身份验证的测试操作 — git 将提示输入凭据
# 用户名: <他们的github用户名>
# 密码: <粘贴个人访问令牌，而不是他们的 GitHub 密码>
git ls-remote https://github.com/<their-username>/<any-repo>.git
```

输入凭证一次后，它们就会被保存并用于所有未来的操作。

**替代方案：缓存助手 (凭据从内存中过期)**

```bash
# 将数据缓存在内存中 8 小时（28800 秒）而不是保存到磁盘
git config --global credential.helper 'cache --timeout=28800'
```

**替代方案：在远程 URL 中直接设置令牌 (按仓库配置)**

```bash
# 将令牌嵌入到远程 URL 中 (完全避免凭证提示)
git remote set-url origin https://<username>:<token>@github.com/<owner>/<repo>.git
```

**步骤 3: 配置 git 身份**

```bash
# 对于提交操作必需 — 设置姓名和电子邮件
git config --global user.name "Their Name"
git config --global user.email "their-email@example.com"
```

**步骤 4: 验证**

```bash
# 测试推送权限 (现在这应该无需任何提示即可工作)
git ls-remote https://github.com/<their-username>/<any-repo>.git

# 验证身份
git config --global user.name
git config --global user.email
```

### 选项 B: SSH 密钥身份验证

适合那些偏爱 SSH 或已经设置好密钥的用户。

**步骤 1: 检查现有 SSH 密钥**

```bash
ls -la ~/.ssh/id_*.pub 2>/dev/null || echo "未找到 SSH 密钥"
```

**步骤 2: 如果需要，生成密钥**

```bash
# 生成一个 ed25519 密钥 (现代、安全、快速)
ssh-keygen -t ed25519 -C "their-email@example.com" -f ~/.ssh/id_ed25519 -N ""

# 显示公钥，供用户添加到 GitHub
cat ~/.ssh/id_ed25519.pub
```

请用户将公钥添加到：**https://github.com/settings/keys**
- 点击“New SSH key”（新 SSH 密钥）
- 粘贴公钥内容
- 给它起一个标题，例如 "hermes-agent&lt;machine-name>"

**步骤 3: 测试连接**

```bash
ssh -T git@github.com
# 预期结果: "Hi <username>! You've successfully authenticated..."
```

**步骤 4: 配置 git 以使用 SSH 访问 GitHub**

```bash
# 将 HTTPS 的 GitHub URL 重写为 SSH (自动完成)
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

**步骤 5: 配置 git 身份**

```bash
git config --global user.name "Their Name"
git config --global user.email "their-email@example.com"
```

---

## 方法 2: gh CLI 身份验证

如果安装了 `gh`，它可以在一个步骤中处理 API 访问和 Git 凭据。

### 交互式浏览器登录 (桌面端)

```bash
gh auth login
# 选择: GitHub.com
# 选择: HTTPS
# 通过浏览器进行身份验证
```

### 基于令牌的登录 (无头/SSH 服务器)

```bash
echo "<THEIR_TOKEN>" | gh auth login --with-token

# 通过 gh 设置 Git 凭据
gh auth setup-git
```

### 验证

```bash
gh auth status
```

---

## 不使用 gh 的 GitHub API 调用

当 `gh` 不可用时，您仍然可以使用带个人访问令牌的 `curl` 来调用完整的 GitHub API。这是其他 GitHub 技能实现回退机制的方式。

### 设置用于 API 调用的令牌

```bash
# 选项 1: 导出为环境变量 (首选 — 使其不出现在命令中)
export GITHUB_TOKEN="<token>"

# 然后在 curl 调用中使用：
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user
```

### 从 Git 凭据中提取令牌

如果已配置 Git 凭据（通过 `credential.helper store`），则可以提取该令牌：

```bash
# 从 git 凭证存储中读取
grep "github.com" ~/.git-credentials 2>/dev/null | head -1 | sed 's|https://[^:]*:\([^@]*\)@.*|\1|'
```

### 助手：检测身份验证方法

在任何 GitHub 工作流程的开头使用此模式：

```bash
# 先尝试 gh，然后回退到 git + curl
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  echo "AUTH_METHOD=gh"
elif [ -n "$GITHUB_TOKEN" ]; then
  echo "AUTH_METHOD=curl"
elif _hermes_env="${HERMES_HOME:-$HOME/.hermes}/.env"; [ -f "$_hermes_env" ] && grep -q "^GITHUB_TOKEN=" "$_hermes_env"; then
  export GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" "$_hermes_env" | head -1 | cut -d= -f2 | tr -d '\n\r')
  echo "AUTH_METHOD=curl"
elif grep -q "github.com" ~/.git-credentials 2>/dev/null; then
  export GITHUB_TOKEN=$(grep "github.com" ~/.git-credentials | head -1 | sed 's|https://[^:]*:\([^@]*\)@.*|\1|')
  echo "AUTH_METHOD=curl"
else
  echo "AUTH_METHOD=none"
  echo "需要先设置身份验证"
fi
```

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| `git push` 要求密码 | GitHub 已禁用密码认证。请使用个人访问令牌作为密码，或切换到 SSH |
| `remote: Permission to X denied` | 令牌可能缺少 `repo` 范围权限 — 使用正确的权限重新生成 |
| `fatal: Authentication failed` | 缓存的凭证可能已过期 — 运行 `git credential reject` 然后重新进行身份验证 |
| `ssh: connect to host github.com port 22: Connection refused` | 尝试通过 HTTPS 端口使用 SSH：将 `~/.ssh/config` 中添加 `Host github.com`，设置 `Port 443` 和 `Hostname ssh.github.com` |
| 凭证未持久化 | 检查 `git config --global credential.helper` — 必须是 `store` 或 `cache` |
| 多个 GitHub 账户 | 使用 SSH，为每个主机别名在 `~/.ssh/config` 中设置不同的密钥，或使用按仓库配置的凭据 URL |
| `gh: command not found` + 无 sudo | 使用上面的 Git-only 方法 1 — 不需要安装 |