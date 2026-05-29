---
sidebar_position: 7
title: "电子邮件"
description: "通过 IMAP/SMTP 将 Hermes 智能体设置为电子邮件助手"
---

# 电子邮件设置

Hermes 可以使用标准的 IMAP 和 SMTP 协议接收和回复电子邮件。向智能体的地址发送一封电子邮件，它就会在邮件线程中回复——无需特殊客户端或机器人 API。支持 Gmail、Outlook、Yahoo、Fastmail 或任何支持 IMAP/SMTP 的提供商。

:::info 仅网关适配器：无外部依赖
本页介绍的是电子邮件网关适配器，它使用 Python 内置的 `imaplib`、`smtplib` 和 `email` 模块。此网关路径不需要任何额外的包或外部服务。
:::

这与捆绑的 [Himalaya 电子邮件技能](/docs/user-guide/skills/bundled/email/email-himalaya) 不同，后者允许智能体通过终端命令管理电子邮件，并且需要外部的 `himalaya` CLI 加上 Himalaya 配置文件。

| 用例 | 需要配置什么 | 外部依赖 |
|---|---|---|
| 让用户向 Hermes 智能体发送电子邮件并收到回复 | 本页介绍的电子邮件网关适配器 | 除了一个 IMAP/SMTP 电子邮件账户外，无需其他 |
| 让智能体通过终端工具检查、撰写、移动和管理邮箱邮件 | Himalaya 电子邮件技能 | `himalaya` CLI 和 `~/.config/himalaya/config.toml` |

---

## 前提条件

- **一个专用的电子邮件账户**用于你的 Hermes 智能体（不要使用你的个人邮箱）
- 电子邮件账户已**启用 IMAP**
- 如果使用 Gmail 或其他启用双重身份验证（2FA）的提供商，需要**一个应用专用密码**

### Gmail 设置

1. 在你的 Google 账户上启用双重身份验证
2. 前往 [应用专用密码](https://myaccount.google.com/apppasswords)
3. 创建一个新的应用专用密码（选择“邮件”或“其他”）
4. 复制生成的 16 位密码——你将用它代替常规密码

### Outlook / Microsoft 365

1. 前往 [安全设置](https://account.microsoft.com/security)
2. 如果尚未启用，请启用双重身份验证
3. 在“其他安全选项”下创建应用专用密码
4. IMAP 主机：`outlook.office365.com`，SMTP 主机：`smtp.office365.com`

### 其他提供商

大多数电子邮件提供商都支持 IMAP/SMTP。请查阅你的提供商文档以获取：
- IMAP 主机和端口（通常是使用 SSL 的 993 端口）
- SMTP 主机和端口（通常是使用 STARTTLS 的 587 端口）
- 是否需要应用专用密码

---

## 步骤 1：配置 Hermes

最简单的方式：

```bash
hermes gateway setup
```

从平台菜单中选择 **Email**。向导会提示你输入电子邮件地址、密码、IMAP/SMTP 主机以及允许的发送者列表。

### 手动配置

添加到 `~/.hermes/.env`：

```bash
# 必需
EMAIL_ADDRESS=hermes@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop    # 应用专用密码（不是你的常规密码）
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_SMTP_HOST=smtp.gmail.com

# 安全（推荐）
EMAIL_ALLOWED_USERS=your@email.com,colleague@work.com

# 可选
EMAIL_IMAP_PORT=993                    # 默认：993 (IMAP SSL)
EMAIL_SMTP_PORT=587                    # 默认：587 (SMTP STARTTLS)
EMAIL_POLL_INTERVAL=15                 # 收件箱检查间隔秒数（默认：15）
EMAIL_HOME_ADDRESS=your@email.com      # 定时任务的默认投递目标
```

---

## 步骤 2：启动网关

```bash
hermes gateway              # 在前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅限 Linux：开机系统服务
```

启动时，适配器会：
1. 测试 IMAP 和 SMTP 连接
2. 将所有现有收件箱邮件标记为“已读”（仅处理新邮件）
3. 开始轮询新邮件

---

## 工作原理

### 接收消息

适配器以可配置的间隔（默认：15 秒）轮询 IMAP 收件箱中的未读消息。对于每封新邮件：

- **主题行**将作为上下文包含在内（例如，`[主题: 部署到生产环境]`）
- **回复邮件**（主题以 `Re:` 开头）会跳过主题前缀——邮件线程上下文已建立
- **附件**将被本地缓存：
  - 图像 (JPEG, PNG, GIF, WebP) → 可用于视觉工具
  - 文档 (PDF, ZIP 等) → 可用于文件访问
- **纯 HTML 邮件**会去除标签以提取纯文本
- **自发邮件**将被过滤掉以防止回复循环
- **自动/noreply 发件人**将被静默忽略——包括 `noreply@`、`mailer-daemon@`、`bounce@`、`no-reply@` 以及带有 `Auto-Submitted`、`Precedence: bulk` 或 `List-Unsubscribe` 头的邮件

### 发送回复

回复通过 SMTP 发送，并使用正确的邮件线程标识：

- **In-Reply-To** 和 **References** 头用于维护线程
- **主题行**会保留 `Re:` 前缀（避免双重 `Re: Re:`）
- **Message-ID** 使用智能体的域名生成
- 响应以纯文本（UTF-8）形式发送

### 文件附件

智能体可以在回复中发送文件附件。在响应中包含 `MEDIA:/path/to/file`，该文件就会附加到外发邮件中。

### 跳过附件

要忽略所有传入的附件（用于恶意软件防护或节省带宽），请将以下内容添加到你的 `config.yaml`：

```yaml
platforms:
  email:
    skip_attachments: true
```

启用后，在负载解码前会跳过附件和内联部分。邮件正文文本仍会正常处理。

---

## 访问控制

电子邮件访问遵循与所有其他 Hermes 平台相同的模式：

1. **设置了 `EMAIL_ALLOWED_USERS`** → 仅处理来自这些地址的邮件
2. **未设置允许列表** → 未知发送者会收到一个配对码
3. **`EMAIL_ALLOW_ALL_USERS=true`** → 接受任何发送者（请谨慎使用）

:::warning
**务必配置 `EMAIL_ALLOWED_USERS`。** 如果没有它，任何知道智能体电子邮件地址的人都可以发送命令。智能体默认具有终端访问权限。
:::

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| 启动时出现 **“IMAP 连接失败”** | 验证 `EMAIL_IMAP_HOST` 和 `EMAIL_IMAP_PORT`。确保账户已启用 IMAP。对于 Gmail，请在设置 → 转发和 POP/IMAP 中启用它。 |
| 启动时出现 **“SMTP 连接失败”** | 验证 `EMAIL_SMTP_HOST` 和 `EMAIL_SMTP_PORT`。检查密码是否正确（Gmail 请使用应用专用密码）。 |
| **未收到邮件** | 检查 `EMAIL_ALLOWED_USERS` 是否包含发件人的电子邮件。检查垃圾邮件文件夹——一些提供商会将自动回复标记为垃圾邮件。 |
| **“身份验证失败”** | 对于 Gmail，你必须使用应用专用密码，而不是常规密码。请确保首先启用了双重身份验证。 |
| **重复回复** | 确保只有一个网关实例正在运行。检查 `hermes gateway status`。 |
| **响应缓慢** | 默认轮询间隔为 15 秒。使用 `EMAIL_POLL_INTERVAL=5` 来减少间隔以获得更快的响应（但会增加 IMAP 连接）。 |
| **回复未形成线程** | 适配器使用 In-Reply-To 头。一些电子邮件客户端（尤其是基于 Web 的）可能无法正确地将自动消息与线程关联。 |

---

## 安全

:::warning
**使用专用的电子邮件账户。** 不要使用你的个人邮箱——智能体会将密码存储在 `.env` 文件中，并通过 IMAP 拥有完整的收件箱访问权限。
:::

- 使用**应用专用密码**代替主密码（对于启用双重身份验证的 Gmail 是必需的）
- 设置 `EMAIL_ALLOWED_USERS` 以限制谁可以与智能体交互
- 密码存储在 `~/.hermes/.env` — 请保护好此文件（`chmod 600`）
- 默认情况下，IMAP 使用 SSL（端口 993），SMTP 使用 STARTTLS（端口 587）——连接是加密的

---

## 环境变量参考

| 变量 | 必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `EMAIL_ADDRESS` | 是 | — | 智能体的电子邮件地址 |
| `EMAIL_PASSWORD` | 是 | — | 电子邮件密码或应用专用密码 |
| `EMAIL_IMAP_HOST` | 是 | — | IMAP 服务器主机（例如 `imap.gmail.com`） |
| `EMAIL_SMTP_HOST` | 是 | — | SMTP 服务器主机（例如 `smtp.gmail.com`） |
| `EMAIL_IMAP_PORT` | 否 | `993` | IMAP 服务器端口 |
| `EMAIL_SMTP_PORT` | 否 | `587` | SMTP 服务器端口 |
| `EMAIL_POLL_INTERVAL` | 否 | `15` | 收件箱检查间隔秒数 |
| `EMAIL_ALLOWED_USERS` | 否 | — | 以逗号分隔的允许发件人地址列表 |
| `EMAIL_HOME_ADDRESS` | 否 | — | 定时任务的默认投递目标 |
| `EMAIL_ALLOW_ALL_USERS` | 否 | `false` | 允许所有发件人（不推荐） |