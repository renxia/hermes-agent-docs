title: Himalaya — Himalaya CLI: IMAP/SMTP email from terminal
sidebar_label: Himalaya
description: Himalaya CLI: IMAP/SMTP email from terminal
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Himalaya

Himalaya CLI：从终端发送 IMAP/SMTP 电子邮件。

## 技能元数据

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/email/himalaya` |
| Version | `1.1.0` |
| Author | community |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `Email`, `IMAP`, `SMTP`, `CLI`, `Communication` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整的技能定义。这是智能体在技能激活时所看到的指令。
:::

# Himalaya 电子邮件 CLI

Himalaya 是一个命令行（CLI）电子邮件客户端，它允许您使用 IMAP、SMTP、Notmuch 或 Sendmail 后端从终端管理电子邮件。

该技能独立于 Hermes 电子邮件网关适配器。网关适配器允许人们向智能体发送邮件，并使用 Hermes 内置的 IMAP/SMTP 适配器；而此技能则让智能体操作邮箱，它需要外部的 `himalaya` CLI 工具。

## 参考资料

- `references/configuration.md` (配置文件设置 + IMAP/SMTP 身份验证)
- `references/message-composition.md` (用于撰写电子邮件的 MML 语法)

## 先决条件

1. 已安装 Himalaya CLI (`himalaya --version` 进行验证)
2. 在 `~/.config/himalaya/config.toml` 处有一个配置文件
3. 配置了 IMAP/SMTP 凭证（密码需安全存储）

### 安装

```bash
# 预编译二进制文件 (Linux/macOS — 推荐)
curl -sSL https://raw.githubusercontent.com/pimalaya/himalaya/master/install.sh | PREFIX=~/.local sh

# 通过 Homebrew 在 macOS 上安装
brew install himalaya

# 或通过 cargo (任何带有 Rust 的平台)
cargo install himalaya --locked
```

## 配置设置

运行交互式向导来设置账户：

```bash
himalaya account configure
```

或者手动创建 `~/.config/himalaya/config.toml`：

```toml
[accounts.personal]
email = "you@example.com"
display-name = "Your Name"
default = true

backend.type = "imap"
backend.host = "imap.example.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "you@example.com"
backend.auth.type = "password"
backend.auth.cmd = "pass show email/imap"  # 或使用 keyring

message.send.backend.type = "smtp"
message.send.backend.host = "smtp.example.com"
message.send.backend.port = 587
message.send.backend.encryption.type = "start-tls"
message.send.backend.login = "you@example.com"
message.send.backend.auth.type = "password"
message.send.backend.auth.cmd = "pass show email/smtp"

# 文件夹别名 (himalaya v1.2.0+ 语法)。当服务器的文件夹名称与
# himalaya 的规范名称（inbox/sent/drafts/trash）不匹配时，才需要使用。
# Gmail 是常见情况——请参阅 `references/configuration.md` 中的 `[Gmail]/Sent Mail` 映射。
folder.aliases.inbox = "INBOX"
folder.aliases.sent = "Sent"
folder.aliases.drafts = "Drafts"
folder.aliases.trash = "Trash"
```

> **关于别名语法的注意事项。** 在 v1.2.0 之前，文档使用了 `[accounts.NAME.folder.alias]` 子部分（单数 `alias`）。v1.2.0 会静默忽略这种形式——TOML 解析正常，但别名解析器永远不会读取它，因此每次查找都会回退到规范名称。在 Gmail 中这意味着保存到“Sent”失败发生在 SMTP 发送成功之后，并且 `himalaya message send` 以非零状态退出。任何调用者（智能体、脚本或用户）如果对该退出代码进行重试，都将重新运行整个发送过程——包括 SMTP——从而产生重复的电子邮件给收件人。请务必使用 `folder.aliases.X` (复数形式，点分隔键，直接位于 `[accounts.NAME]` 下)。

## Hermes 集成说明

- **读取、列出、搜索、移动、删除** 所有操作都通过终端工具直接完成
- **撰写/回复/转发** — 推荐使用管道输入（`cat << EOF | himalaya template send`）以确保可靠性。交互式 `$EDITOR` 模式配合 `pty=true` + background + process tool 使用，但需要知道编辑器及其命令
- 使用 `--output json` 获取更易于程序解析的结构化输出
- `himalaya account configure` 向导需要交互式输入——请使用 PTY 模式：`terminal(command="himalaya account configure", pty=true)`

## 常用操作

### 列出文件夹

```bash
himalaya folder list
```

### 列出电子邮件

列出 INBOX 中的邮件（默认）：

```bash
himalaya envelope list
```

列出特定文件夹中的邮件：

```bash
himalaya envelope list --folder "Sent"
```

带分页的列表：

```bash
himalaya envelope list --page 1 --page-size 20
```

### 搜索电子邮件

```bash
himalaya envelope list from john@example.com subject meeting
```

### 读取邮件

按 ID 读取邮件（显示纯文本）：

```bash
himalaya message read 42
```

导出原始 MIME：

```bash
himalaya message export 42 --full
```

### 回复邮件

要从 Hermes 非交互式地回复邮件，请读取原始消息、撰写回复并进行管道传输：

```bash
# 获取回复模板，编辑它并发送
himalaya template reply 42 | sed 's/^$/\nYour reply text here\n/' | himalaya template send
```

或者手动构建回复：

```bash
cat << 'EOF' | himalaya template send
From: you@example.com
To: sender@example.com
Subject: Re: Original Subject
In-Reply-To: <original-message-id>

Your reply here.
EOF
```

回复所有人（交互式 — 需要 $EDITOR，请使用上面的模板方法）：

```bash
himalaya message reply 42 --all
```

### 转发邮件

```bash
# 获取转发模板并进行修改管道传输
himalaya template forward 42 | sed 's/^To:.*/To: newrecipient@example.com/' | himalaya template send
```

### 撰写新邮件

**非交互式（从 Hermes 使用此功能）** — 通过 stdin 管道传输消息：

```bash
cat << 'EOF' | himalaya template send
From: you@example.com
To: recipient@example.com
Subject: Test Message

Hello from Himalaya!
EOF
```

或者使用头部标志：

```bash
himalaya message write -H "To:recipient@example.com" -H "Subject:Test" "Message body here"
```

注意：`himalaya message write` 如果没有管道输入，会打开 `$EDITOR`。这配合 `pty=true` + background 模式可用，但管道传输更简单、更可靠。

### 移动/复制邮件

移动到文件夹：

```bash
himalaya message move "Archive" 42
```

复制到文件夹：

```bash
himalaya message copy "Important" 42
```

### 删除邮件

```bash
himalaya message delete 42
```

### 管理标记 (Flags)

添加标记：

```bash
himalaya flag add 42 --flag seen
```

移除标记：

```bash
himalaya flag remove 42 --flag seen
```

## 多个账户

列出账户：

```bash
himalaya account list
```

使用特定账户：

```bash
himalaya --account work envelope list
```

##附件

从消息保存附件：

```bash
himalaya attachment download 42
```

保存到特定目录：

```bash
himalaya attachment download 42 --downloads-dir ~/Downloads
```

## 输出格式

大多数命令都支持 `--output` 用于结构化输出：

```bash
himalaya envelope list --output json
himalaya envelope list --output plain
```

## 调试

启用调试日志记录：

```bash
RUST_LOG=debug himalaya envelope list
```

带回溯的完整跟踪：

```bash
RUST_LOG=trace RUST_BACKTRACE=1 himalaya envelope list
```

## 小贴士

- 使用 `himalaya --help` 或 `himalaya <command> --help` 获取详细用法。
- 消息 ID 是相对于当前文件夹的；更改文件夹后请重新列出。
- 要撰写带附件的富媒体邮件，请使用 MML 语法（参见 `references/message-composition.md`）。
- 使用 `pass`、系统密钥环或输出密码的命令来安全存储密码。