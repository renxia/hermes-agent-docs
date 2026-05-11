---
title: "Github 认证 — GitHub 身份验证设置：HTTPS 令牌、SSH 密钥、gh CLI 登录"
sidebar_label: "Github 认证"
description: "GitHub 身份验证设置：HTTPS 令牌、SSH 密钥、gh CLI 登录"
---

{/* 此页面由网站脚本 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非本页面。*/}

# Github 认证

GitHub 身份验证设置：HTTPS 令牌、SSH 密钥、gh CLI 登录。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/github/github-auth` |
| 版本 | `1.1.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `GitHub`, `Authentication`, `Git`, `gh-cli`, `SSH`, `Setup` |
| 相关技能 | [`github-pr-workflow`](/docs/user-guide/skills/bundled/github/github-github-pr-workflow), [`github-code-review`](/docs/user-guide/skills/bundled/github/github-github-code-review), [`github-issues`](/docs/user-guide/skills/bundled/github/github-github-issues), [`github-repo-management`](/docs/user-guide/skills/bundled/github/github-github-repo-management) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# GitHub 身份验证设置

此技能设置身份验证，以便智能体能够操作 GitHub 仓库、PR、Issue 和 CI。它涵盖两种途径：

- **`git`（始终可用）** — 使用 HTTPS 个人访问令牌或 SSH 密钥
- **`gh` CLI（如已安装）** — 提供更丰富的 GitHub API 访问权限，且认证流程更简单

## 检测流程

当用户要求你操作 GitHub 时，请先运行以下检查：

```bash
# 检查可用工具
git --version
gh --version 2>/dev/null || echo "gh 未安装"

# 检查是否已认证
gh auth status 2>/dev/null || echo "gh 未认证"
git config --global credential.helper 2>/dev/null || echo "无 git 凭据助手"
```

**决策树：**
1. 如果 `gh auth status` 显示已认证 → 没问题，对所有操作都使用 `gh`
2. 如果 `gh` 已安装但未认证 → 使用下方的 "gh auth" 方法
3. 如果 `gh` 未安装 → 使用下方的 "仅 git" 方法（无需 sudo）

---

## 方法 1：仅 Git 认证（无 gh，无需 sudo）

适用于任何安装了 `git` 的机器。不需要 root 权限。

### 选项 A：使用个人访问令牌的 HTTPS 方式（推荐）

这是最通用的方法 — 适用于任何环境，无需配置 SSH。

**步骤 1：创建个人访问令牌**

告诉用户前往：**https://github.com/settings/tokens**

- 点击 "Generate new token (classic)"
- 为其命名，例如 "hermes-agent"
- 选择权限范围：
  - `repo`（完整的仓库访问权限 — 读、写、推送、PR）
  - `workflow`（触发和管理 GitHub Actions）
  - `read:org`（如果操作组织仓库）
- 设置有效期（90 天是个不错的默认值）
- 复制令牌 — 它不会再次显示

**步骤 2：配置 git 存储令牌**

```bash
# 设置凭据助手以缓存凭据
# "store" 会以明文保存到 ~/.git-credentials（简单，持久化）
git config --global credential.helper store

# 现在执行一个会触发认证的测试操作 — git 将提示输入凭据
# 用户名：<他们的 GitHub 用户名>
# 密码：<粘贴个人访问令牌，而不是他们的 GitHub 密码>
git ls-remote https://github.com/<他们的用户名>/<任意仓库>.git
```

输入凭据一次后，它们将被保存并用于所有后续操作。

**备选方案：缓存助手（凭据在内存中过期）**

```bash
# 在内存中缓存 8 小时（28800 秒），而不是保存到磁盘
git config --global credential.helper 'cache --timeout=28800'
```

**备选方案：直接在远程 URL 中设置令牌（针对单个仓库）**

```bash
# 将令牌嵌入远程 URL（完全避免凭据提示）
git remote set-url origin https://<用户名>:<令牌>@github.com/<所有者>/<仓库>.git
```

**步骤 3：配置 git 身份标识**

```bash
# 提交时需要 — 设置姓名和邮箱
git config --global user.name "他们的姓名"
git config --global user.email "他们的邮箱@example.com"
```

**步骤 4：验证**

```bash
# 测试推送访问权限（现在应该无需任何提示即可工作）
git ls-remote https://github.com/<他们的用户名>/<任意仓库>.git

# 验证身份标识
git config --global user.name
git config --global user.email
```

### 选项 B：SSH 密钥认证

适用于偏好 SSH 或已设置好密钥的用户。

**步骤 1：检查现有 SSH 密钥**

```bash
ls -la ~/.ssh/id_*.pub 2>/dev/null || echo "未找到 SSH 密钥"
```

**步骤 2：如有需要，生成密钥**

```bash
# 生成 ed25519 密钥（现代、安全、快速）
ssh-keygen -t ed25519 -C "他们的邮箱@example.com" -f ~/.ssh/id_ed25519 -N ""

# 显示公钥供他们添加到 GitHub
cat ~/.ssh/id_ed25519.pub
```

告诉用户将公钥添加到：**https://github.com/settings/keys**
- 点击 "New SSH key"
- 粘贴公钥内容
- 为其命名，例如 "hermes-agent-&lt;机器名>"

**步骤 3：测试连接**

```bash
ssh -T git@github.com
# 预期输出："Hi <用户名>! You've successfully authenticated..."
```

**步骤 4：配置 git 为 GitHub 使用 SSH**

```bash
# 自动将 HTTPS GitHub URL 重写为 SSH
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

**步骤 5：配置 git 身份标识**

```bash
git config --global user.name "他们的姓名"
git config --global user.email "他们的邮箱@example.com"
```

---

## 方法 2：gh CLI 认证

如果 `gh` 已安装，它可以一步完成 API 访问和 git 凭据的处理。

### 交互式浏览器登录（桌面端）

```bash
gh auth login
# 选择：GitHub.com
# 选择：HTTPS
# 通过浏览器认证
```

### 基于令牌的登录（无头模式 / SSH 服务器）

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

## 不使用 gh 调用 GitHub API

当 `gh` 不可用时，你仍然可以使用 `curl` 配合个人访问令牌访问完整的 GitHub API。其他 GitHub 技能实现其回退方案时也使用这种方法。

### 为 API 调用设置令牌

```bash
# 选项 1：导出为环境变量（首选 — 避免在命令中出现）
export GITHUB_TOKEN="<令牌>"

# 然后在 curl 调用中使用：
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user
```

### 从 Git 凭据中提取令牌

如果 git 凭据已通过 `credential.helper store` 配置，可以提取令牌：

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
|------|----------|
| `git push` 要求输入密码 | GitHub 已禁用密码认证。请使用个人访问令牌作为密码，或切换到 SSH |
| `remote: Permission to X denied` | 令牌可能缺少 `repo` 权限范围 — 请使用正确的权限范围重新生成 |
| `fatal: Authentication failed` | 缓存的凭据可能已过时 — 运行 `git credential reject` 然后重新认证 |
| `ssh: connect to host github.com port 22: Connection refused` | 尝试通过 HTTPS 端口使用 SSH：在 `~/.ssh/config` 中添加 `Host github.com`，设置 `Port 443` 和 `Hostname ssh.github.com` |
| 凭据未持久化 | 检查 `git config --global credential.helper` — 必须设置为 `store` 或 `cache` |
| 多个 GitHub 账户 | 在 `~/.ssh/config` 中为不同的主机别名使用不同的密钥，或使用针对每个仓库的凭据 URL |
| `gh: command not found` 且无 sudo 权限 | 使用上面的仅 git 方法 1 — 无需安装 |