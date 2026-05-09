---
title: "Github 认证 — GitHub 认证设置：HTTPS 令牌、SSH 密钥、gh CLI 登录"
sidebar_label: "Github 认证"
description: "GitHub 认证设置：HTTPS 令牌、SSH 密钥、gh CLI 登录"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Github 认证

GitHub 认证设置：HTTPS 令牌、SSH 密钥、gh CLI 登录。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/github/github-auth` |
| 版本 | `1.1.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 标签 | `GitHub`, `认证`, `Git`, `gh-cli`, `SSH`, `设置` |
| 相关技能 | [`github-pr-workflow`](/docs/user-guide/skills/bundled/github/github-github-pr-workflow), [`github-code-review`](/docs/user-guide/skills/bundled/github/github-github-code-review), [`github-issues`](/docs/user-guide/skills/bundled/github/github-github-issues), [`github-repo-management`](/docs/user-guide/skills/bundled/github/github-github-repo-management) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是当技能激活时智能体看到的指令。
:::

# GitHub 认证设置

此技能设置认证，以便智能体可以与 GitHub 仓库、PR、议题和 CI 进行交互。它涵盖两条路径：

- **`git`（始终可用）** — 使用 HTTPS 个人访问令牌或 SSH 密钥
- **`gh` CLI（如果已安装）** — 通过更简单的认证流程获得更丰富的 GitHub API 访问权限

## 检测流程

当用户要求你处理 GitHub 相关任务时，请先运行以下检查：

```bash
# 检查可用工具
git --version
gh --version 2>/dev/null || echo "gh 未安装"

# 检查是否已认证
gh auth status 2>/dev/null || echo "gh 未认证"
git config --global credential.helper 2>/dev/null || echo "无 git 凭据助手"
```

**决策树：**
1. 如果 `gh auth status` 显示已认证 → 一切就绪，对所有操作使用 `gh`
2. 如果 `gh` 已安装但未认证 → 使用下面的 "gh auth" 方法
3. 如果 `gh` 未安装 → 使用下面的 "仅 git" 方法（无需 sudo）

---

## 方法 1：仅 Git 认证（无 gh，无 sudo）

此方法适用于任何安装了 `git` 的机器。无需 root 权限。

### 选项 A：使用个人访问令牌的 HTTPS（推荐）

这是最具可移植性的方法 — 随处可用，无需 SSH 配置。

**步骤 1：创建个人访问令牌**

指导用户访问：**https://github.com/settings/tokens**

- 点击 "Generate new token (classic)"
- 为其命名，例如 "hermes-agent"
- 选择权限范围：
  - `repo`（完整的仓库访问权限 — 读取、写入、推送、PR）
  - `workflow`（触发和管理 GitHub Actions）
  - `read:org`（如果处理组织仓库）
- 设置过期时间（90 天是一个不错的默认值）
- 复制令牌 — 它将不再显示

**步骤 2：配置 git 以存储令牌**

```bash
# 设置凭据助手以缓存凭据
# "store" 将其保存到 ~/.git-credentials（明文，简单且持久）
git config --global credential.helper store

# 现在执行一个触发认证的操作 — git 将提示输入凭据
# 用户名：<他们的 GitHub 用户名>
# 密码：<粘贴个人访问令牌，而非他们的 GitHub 密码>
git ls-remote https://github.com/<他们的用户名>/<任意仓库>.git
```

输入一次凭据后，它们将被保存并用于所有未来操作。

**替代方案：缓存助手（凭据在内存中过期）**

```bash
# 在内存中缓存 8 小时（28800 秒），而非保存到磁盘
git config --global credential.helper 'cache --timeout=28800'
```

**替代方案：直接在远程 URL 中设置令牌（每个仓库）**

```bash
# 将令牌嵌入远程 URL（完全避免凭据提示）
git remote set-url origin https://<用户名>:<令牌>@github.com/<所有者>/<仓库>.git
```

**步骤 3：配置 git 身份**

```bash
# 提交所必需 — 设置姓名和邮箱
git config --global user.name "他们的姓名"
git config --global user.email "他们的邮箱@example.com"
```

**步骤 4：验证**

```bash
# 测试推送权限（现在这应该无需任何提示即可工作）
git ls-remote https://github.com/<他们的用户名>/<任意仓库>.git

# 验证身份
git config --global user.name
git config --global user.email
```

### 选项 B：SSH 密钥认证

适合偏好 SSH 或已设置密钥的用户。

**步骤 1：检查现有 SSH 密钥**

```bash
ls -la ~/.ssh/id_*.pub 2>/dev/null || echo "未找到 SSH 密钥"
```

**步骤 2：如需则生成密钥**

```bash
# 生成 ed25519 密钥（现代、安全、快速）
ssh-keygen -t ed25519 -C "他们的邮箱@example.com" -f ~/.ssh/id_ed25519 -N ""

# 显示公钥供其添加到 GitHub
cat ~/.ssh/id_ed25519.pub
```

指导用户在以下位置添加公钥：**https://github.com/settings/keys**
- 点击 "New SSH key"
- 粘贴公钥内容
- 为其命名，例如 "hermes-agent-<机器名>"

**步骤 3：测试连接**

```bash
ssh -T git@github.com
# 预期输出："Hi <用户名>! You've successfully authenticated..."
```

**步骤 4：配置 git 以用于 GitHub 的 SSH**

```bash
# 自动将 HTTPS GitHub URL 重写为 SSH
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

**步骤 5：配置 git 身份**

```bash
git config --global user.name "他们的姓名"
git config --global user.email "他们的邮箱@example.com"
```

---

## 方法 2：gh CLI 认证

如果已安装 `gh`，它可以在一步中处理 API 访问和 git 凭据。

### 交互式浏览器登录（桌面端）

```bash
gh auth login
# 选择：GitHub.com
# 选择：HTTPS
# 通过浏览器认证
```

### 基于令牌的登录（无头环境 / SSH 服务器）

```bash
echo "<他们的令牌>" | gh auth login --with-token

# 通过 gh 设置 git 凭据
gh auth setup-git
```

### 验证

```bash
gh auth status
```

---

## 在无 gh 的情况下使用 GitHub API

当 `gh` 不可用时，你仍可使用带有个人访问令牌的 `curl` 访问完整的 GitHub API。其他 GitHub 技能正是通过此方式实现其备用方案的。

### 为 API 调用设置令牌

```bash
# 选项 1：导出为环境变量（推荐 — 避免将其包含在命令中）
export GITHUB_TOKEN="<令牌>"

# 然后在 curl 调用中使用：
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user
```

### 从 Git 凭据中提取令牌

如果 git 凭据已配置（通过 credential.helper store），可以提取令牌：

```bash
# 从 git 凭据存储中读取
grep "github.com" ~/.git-credentials 2>/dev/null | head -1 | sed 's|https://[^:]*:\([^@]*\)@.*|\1|'
```

### 辅助工具：检测认证方法

在任何 GitHub 工作流开始时使用此模式：

```bash
# 先尝试 gh，回退到 git + curl
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  echo "AUTH_METHOD=gh"
elif [ -n "$GITHUB_TOKEN" ]; then
  echo "AUTH_METHOD=curl"
elif [ -f ~/.hermes/.env ] && grep -q "^GITHUB_TOKEN=" ~/.hermes/.env; then
  export GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" ~/.hermes/.env | head -1 | cut -d= -f2 | tr -d '\n\r')
  echo "AUTH_METHOD=curl"
elif grep -q "github.com" ~/.git-credentials 2>/dev/null; then
  export GITHUB_TOKEN=$(grep "github.com" ~/.git-credentials | head -1 | sed 's|https://[^:]*:\([^@]*\)@.*|\1|')
  echo "AUTH_METHOD=curl"
else
  echo "AUTH_METHOD=none"
  echo "需要先设置认证"
fi
```

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| `git push` 要求输入密码 | GitHub 已禁用密码认证。请使用个人访问令牌作为密码，或切换到 SSH |
| `remote: Permission to X denied` | 令牌可能缺少 `repo` 权限 — 使用正确的权限重新生成 |
| `fatal: Authentication failed` | 缓存的凭据可能已过期 — 运行 `git credential reject` 然后重新认证 |
| `ssh: connect to host github.com port 22: Connection refused` | 尝试通过 HTTPS 端口使用 SSH：在 `~/.ssh/config` 中添加 `Host github.com` 并设置 `Port 443` 和 `Hostname ssh.github.com` |
| 凭据未持久化 | 检查 `git config --global credential.helper` — 必须为 `store` 或 `cache` |
| 多个 GitHub 账户 | 在 `~/.ssh/config` 中对每个主机别名使用不同的 SSH 密钥，或为每个仓库使用凭据 URL |
| `gh: command not found` + 无 sudo | 使用上面的仅 git 方法 1 — 无需安装 |