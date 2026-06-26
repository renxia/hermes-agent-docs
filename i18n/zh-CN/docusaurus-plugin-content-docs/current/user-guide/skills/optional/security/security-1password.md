---
title: 1Password — 设置和使用 1Password CLI (op)
sidebar_label: 1Password
description: 设置和使用 1Password CLI (op)
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 1Password

设置和使用 1Password CLI (op)。在安装 CLI、启用桌面应用集成、登录以及为命令读取/注入秘密信息时使用。

## Skill metadata

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/security/1password` 安装 |
| Path | `optional-skills/security/1password` |
| Version | `1.0.0` |
| Author | arceus77-7, enhanced by Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `security`, `secrets`, `1password`, `op`, `cli` |

## Reference: full SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# 1Password CLI

当用户需要通过 1Password 而非明文环境变量或文件来管理秘密信息时，请使用此技能。

## Requirements (要求)

- 1Password 账户
- 已安装 1Password CLI (`op`)
- 以下之一：桌面应用集成、服务账户令牌 (`OP_SERVICE_ACCOUNT_TOKEN`) 或 Connect 服务器
- `tmux` 可用，以在 Hermes 终端调用期间进行稳定的身份验证会话（仅限桌面应用流程）

## When to Use (何时使用)

- 安装或配置 1Password CLI
- 使用 `op signin` 进行登录
- 读取秘密信息引用，例如 `op://Vault/Item/field`
- 使用 `op inject` 将秘密信息注入到配置文件/模板中
- 通过 `op run` 使用秘密环境变量运行命令

## Authentication Methods (身份验证方法)

### Service Account (推荐用于 Hermes)

在 `${HERMES_HOME:-~/.hermes}/.env` 中设置 `OP_SERVICE_ACCOUNT_TOKEN`（首次加载时，技能将提示用户输入）。
无需桌面应用。支持 `op read`、`op inject` 和 `op run`。

```bash
export OP_SERVICE_ACCOUNT_TOKEN="your-token-here"
op whoami  # 验证 — 应显示 Type: SERVICE_ACCOUNT
```

### Desktop App Integration (交互式)

1. 在 1Password 桌面应用中启用：设置 → Developer（开发者）→ Integrate with 1Password CLI（与 1Password CLI 集成）
2. 确保应用程序已解锁
3. 运行 `op signin` 并批准生物识别提示

### Connect Server (自托管)

```bash
export OP_CONNECT_HOST="http://localhost:8080"
export OP_CONNECT_TOKEN="your-connect-token"
```

## Setup (设置)

1. 安装 CLI：

```bash
# macOS
brew install 1password-cli

# Linux (官方软件包/安装文档)
# 请参阅 references/get-started.md 以获取特定发行版的链接。

# Windows (winget)
winget install AgileBits.1Password.CLI
```

2. 验证：

```bash
op --version
```

3. 选择上述一种身份验证方法并进行配置。

## Hermes Execution Pattern (桌面应用流程)

Hermes 终端命令默认是非交互式的，并且在调用之间可能会丢失身份验证上下文。
为了可靠地使用支持桌面应用集成的 `op`，请在一个专用的 tmux 会话中运行登录和秘密操作。

注意：在使用 `OP_SERVICE_ACCOUNT_TOKEN` 时不需要此步骤——该令牌会自动跨终端调用保持有效。

```bash
SOCKET_DIR="${TMPDIR:-/tmp}/hermes-tmux-sockets"
mkdir -p "$SOCKET_DIR"
SOCKET="$SOCKET_DIR/hermes-op.sock"
SESSION="op-auth-$(date +%Y%m%d-%H%M%S)"

tmux -S "$SOCKET" new -d -s "$SESSION" -n shell

# 登录（在桌面应用提示时批准）
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "eval \"\$(op signin --account my.1password.com)\"" Enter

# 验证身份
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "op whoami" Enter

# 示例读取
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "op read 'op://Private/Npmjs/one-time password?attribute=otp'" Enter

# 需要时捕获输出
tmux -S "$SOCKET" capture-pane -p -J -t "$SESSION":0.0 -S -200

# 清理
tmux -S "$SOCKET" kill-session -t "$SESSION"
```

## Common Operations (常见操作)

### Read a secret (读取秘密信息)

```bash
op read "op://app-prod/db/password"
```

### Get OTP (获取一次性密码)

```bash
op read "op://app-prod/npm/one-time password?attribute=otp"
```

### Inject into template (注入到模板中)

```bash
echo "db_password: {{ op://app-prod/db/password }}" | op inject
```

### Run a command with secret env var (使用秘密环境变量运行命令)

```bash
export DB_PASSWORD="op://app-prod/db/password"
op run -- sh -c '[ -n "$DB_PASSWORD" ] && echo "DB_PASSWORD is set" || echo "DB_PASSWORD missing"'
```

## Guardrails (安全防护措施)

- 除非用户明确要求，否则绝不向用户打印原始秘密信息。
- 优先使用 `op run` / `op inject` 而不是将秘密信息写入文件。
- 如果命令因“account is not signed in”（账户未登录）而失败，请在同一个 tmux 会话中再次运行 `op signin`。
- 如果无法使用桌面应用集成（无头/CI），请使用服务账户令牌流程。

## CI / Headless note (CI/无头模式说明)

对于非交互式使用，请使用 `OP_SERVICE_ACCOUNT_TOKEN` 进行身份验证，避免使用交互式的 `op signin`。
服务账户需要 CLI v2.18.0+。

## References (参考资料)

- `references/get-started.md`
- `references/cli-examples.md`
- https://developer.1password.com/docs/cli/
- https://developer.1password.com/docs/service-accounts/