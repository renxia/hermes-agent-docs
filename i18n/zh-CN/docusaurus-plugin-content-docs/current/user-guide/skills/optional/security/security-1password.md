---
title: "1Password — 设置与使用 1Password CLI (op)"
sidebar_label: "1Password"
description: "设置与使用 1Password CLI (op)"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# 1Password

设置与使用 1Password CLI (op)。当需要安装 CLI、启用桌面应用集成、登录以及为命令读取/注入密钥时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/security/1password` 安装 |
| 路径 | `optional-skills/security/1password` |
| 版本 | `1.0.0` |
| 作者 | arceus77-7, 经由 Hermes 智能体增强 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `security`, `secrets`, `1password`, `op`, `cli` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 1Password CLI

当用户希望通过 1Password 管理密钥，而不是使用明文环境变量或文件时，使用此技能。

## 需求

- 1Password 账户
- 已安装 1Password CLI (`op`)
- 以下之一：桌面应用集成、服务账户令牌 (`OP_SERVICE_ACCOUNT_TOKEN`) 或 Connect 服务器
- 需要 `tmux` 以获得稳定的已认证会话，用于 Hermes 终端调用（仅限桌面应用流程）

## 何时使用

- 安装或配置 1Password CLI
- 使用 `op signin` 登录
- 读取如 `op://Vault/Item/field` 的密钥引用
- 使用 `op inject` 将密钥注入配置/模板
- 通过 `op run` 运行带有密钥环境变量的命令

## 认证方法

### 服务账户（推荐用于 Hermes）

在 `~/.hermes/.env` 中设置 `OP_SERVICE_ACCOUNT_TOKEN`（首次加载时，技能会提示输入）。
无需桌面应用。支持 `op read`、`op inject`、`op run`。

```bash
export OP_SERVICE_ACCOUNT_TOKEN="your-token-here"
op whoami  # 验证 — 应显示 Type: SERVICE_ACCOUNT
```

### 桌面应用集成（交互式）

1. 在 1Password 桌面应用中启用：设置 → 开发者 → 与 1Password CLI 集成
2. 确保应用已解锁
3. 运行 `op signin` 并在生物识别提示中批准

### Connect 服务器（自托管）

```bash
export OP_CONNECT_HOST="http://localhost:8080"
export OP_CONNECT_TOKEN="your-connect-token"
```

## 设置

1. 安装 CLI：

```bash
# macOS
brew install 1password-cli

# Linux（官方包/安装文档）
# 请参阅 references/get-started.md 获取特定发行版的链接。

# Windows (winget)
winget install AgileBits.1Password.CLI
```

2. 验证：

```bash
op --version
```

3. 从上述方法中选择一种认证方式并进行配置。

## Hermes 执行模式（桌面应用流程）

Hermes 终端命令默认是非交互式的，并且可能在调用之间丢失认证上下文。
为了在使用桌面应用集成时可靠地使用 `op`，请在专用的 tmux 会话中运行登录和密钥操作。

注意：使用 `OP_SERVICE_ACCOUNT_TOKEN` 时 **不需要** 此步骤 — 令牌会自动在终端调用间保持。

```bash
SOCKET_DIR="${TMPDIR:-/tmp}/hermes-tmux-sockets"
mkdir -p "$SOCKET_DIR"
SOCKET="$SOCKET_DIR/hermes-op.sock"
SESSION="op-auth-$(date +%Y%m%d-%H%M%S)"

tmux -S "$SOCKET" new -d -s "$SESSION" -n shell

# 登录（当提示时在桌面应用中批准）
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "eval \"\$(op signin --account my.1password.com)\"" Enter

# 验证认证
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "op whoami" Enter

# 读取示例
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "op read 'op://Private/Npmjs/one-time password?attribute=otp'" Enter

# 需要时捕获输出
tmux -S "$SOCKET" capture-pane -p -J -t "$SESSION":0.0 -S -200

# 清理
tmux -S "$SOCKET" kill-session -t "$SESSION"
```

## 常用操作

### 读取密钥

```bash
op read "op://app-prod/db/password"
```

### 获取一次性密码

```bash
op read "op://app-prod/npm/one-time password?attribute=otp"
```

### 注入模板

```bash
echo "db_password: {{ op://app-prod/db/password }}" | op inject
```

### 运行带密钥环境变量的命令

```bash
export DB_PASSWORD="op://app-prod/db/password"
op run -- sh -c '[ -n "$DB_PASSWORD" ] && echo "DB_PASSWORD is set" || echo "DB_PASSWORD missing"'
```

## 注意事项

- 除非用户明确请求，否则永远不要将原始密钥打印回给用户。
- 优先使用 `op run` / `op inject`，而不是将密钥写入文件。
- 如果命令因 "account is not signed in" 失败，请在同一个 tmux 会话中重新运行 `op signin`。
- 如果桌面应用集成不可用（无头环境/CI），请使用服务账户令牌流程。

## CI / 无头环境说明

对于非交互式使用，请使用 `OP_SERVICE_ACCOUNT_TOKEN` 进行认证，并避免交互式的 `op signin`。
服务账户需要 CLI v2.18.0 或更高版本。

## 参考资料

- `references/get-started.md`
- `references/cli-examples.md`
- https://developer.1password.com/docs/cli/
- https://developer.1password.com/docs/service-accounts/