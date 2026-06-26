---
sidebar_position: 7
title: "Email"
description: "Set up Hermes Agent as an email assistant via IMAP/SMTP"
---

# 邮件设置

Hermes 可以使用标准的 IMAP 和 SMTP 协议接收和回复电子邮件。向智能体的邮箱地址发送邮件，它会在会话线程中回复——无需特殊的客户端或机器人 API。支持 Gmail、Outlook、Yahoo、Fastmail 或任何支持 IMAP/SMTP 的邮件服务商。

:::info 仅网关适配器：无外部依赖
本页介绍邮件网关适配器，该适配器使用 Python 内置的 `imaplib`、`smtplib` 和 `email` 模块。此网关路径不需要额外的软件包或外部服务。
:::

这与捆绑的 [Himalaya 邮件技能](/docs/user-guide/skills/bundled/email/email-himalaya) 是分开的，后者允许智能体通过终端命令管理邮件，需要外部 `himalaya` CLI 工具以及 Himalaya 配置文件。

| 使用场景 | 需要配置的内容 | 外部依赖 |
|---|---|---|
| 允许人们向 Hermes 智能体发送邮件并接收回复 | 本页的邮件网关适配器 | 仅需一个支持 IMAP/SMTP 的邮箱账户 |
| 允许智能体通过终端工具查看、撰写、移动和管理邮箱中的邮件 | Himalaya 邮件技能 | `himalaya` CLI 和 `~/.config/himalaya/config.toml` |

---

## 前置条件

- **一个专用邮箱账户**，用于你的 Hermes 智能体（不要使用你的个人邮箱）
- 邮箱账户上**已启用 IMAP**
- 如果使用 Gmail 或其他启用两步验证的服务商，需要**应用专用密码**

### Gmail 设置

1. 在你的 Google 账户上启用两步验证
2. 前往 [应用专用密码](https://myaccount.google.com/apppasswords)
3. 创建一个新的应用专用密码（选择"邮件"或"其他"）
4. 复制 16 位密码——你将使用此密码代替常规密码

### Outlook / Microsoft 365

1. 前往 [安全设置](https://account.microsoft.com/security)
2. 如果尚未启用，请启用两步验证
3. 在"附加安全选项"下创建应用专用密码
4. IMAP 主机：`outlook.office365.com`，SMTP 主机：`smtp.office365.com`

### 其他服务商

大多数邮件服务商都支持 IMAP/SMTP。请查阅服务商的文档了解：
- IMAP 主机和端口（通常使用 SSL 的 993 端口）
- SMTP 主机和端口（通常使用 STARTTLS 的 587 端口）
- 是否需要应用专用密码

---

## 第 1 步：配置 Hermes

最简单的方式：

```bash
hermes gateway setup
```

从平台菜单中选择 **Email**。配置向导会提示你输入邮箱地址、密码、IMAP/SMTP 主机以及允许的发件人。

### 手动配置

添加到 `~/.hermes/.env`：

```bash
# 必填
EMAIL_ADDRESS=hermes@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop    # 应用专用密码（不是你的常规密码）
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_SMTP_HOST=smtp.gmail.com

# 安全设置（推荐）
EMAIL_ALLOWED_USERS=your@email.com,colleague@work.com

# 可选
EMAIL_IMAP_PORT=993                    # 默认值：993（IMAP SSL）
EMAIL_SMTP_PORT=587                    # 默认值：587（SMTP STARTTLS）
EMAIL_POLL_INTERVAL=15                 # 收件箱检查间隔秒数（默认值：15）
EMAIL_HOME_ADDRESS=your@email.com      # cron 任务的默认投递目标
```

---

## 第 2 步：启动网关

```bash
hermes gateway              # 前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅 Linux：开机时自动启动的系统服务
```

启动时，适配器将：
1. 测试 IMAP 和 SMTP 连接
2. 将所有现有收件箱邮件标记为"已读"（仅处理新邮件）
3. 开始轮询新消息

---

## 工作原理

### 接收消息

适配器以可配置的间隔（默认：15 秒）轮询 IMAP 收件箱中的未读邮件。对于每封新邮件：

- **主题行**会作为上下文包含在内（例如：`[主题：部署到生产环境]`）
- **回复邮件**（主题以 `Re:` 开头）会跳过主题前缀——会话线程上下文已经建立
- **附件**会缓存到本地：
  - 图片（JPEG、PNG、GIF、WebP）→ 可供视觉工具使用
  - 文档（PDF、ZIP 等）→ 可供文件访问
- **纯 HTML 邮件**会去除标签以提取纯文本
- **自发邮件**会被过滤掉，以防止回复循环
- **自动发送/禁止回复的发件人**会被静默忽略——`noreply@`、`mailer-daemon@`、`bounce@`、`no-reply@`，以及带有 `Auto-Submitted`、`Precedence: bulk` 或 `List-Unsubscribe` 标头的邮件

### 发送回复

回复通过 SMTP 发送，具有正确的邮件会话线程：

- **In-Reply-To** 和 **References** 标头维护会话线程
- **主题行**保留 `Re:` 前缀（不会出现双重的 `Re: Re:`）
- **Message-ID** 使用智能体的域名生成
- 回复以纯文本（UTF-8）形式发送

### 文件附件

智能体可以在回复中发送文件附件。在回复中包含 `MEDIA:/path/to/file`，文件将附加到发出的邮件中。

### 跳过附件

要忽略所有传入附件（用于恶意软件防护或节省带宽），请在 `config.yaml` 中添加：

```yaml
platforms:
  email:
    skip_attachments: true
```

启用后，附件和内联部分将在有效负载解码前被跳过。邮件正文文本仍会正常处理。

---

## 访问控制

默认情况下，邮件访问权限比聊天类平台更为严格：

1. **设置了 `EMAIL_ALLOWED_USERS`** → 仅处理来自这些地址的邮件
2. **未设置允许列表** → 未知发件人会被静默忽略
3. **`EMAIL_ALLOW_ALL_USERS=true`** → 接受任何发件人（谨慎使用）
4. **`platforms.email.unauthorized_dm_behavior: pair`** → 未知发件人会收到配对码

:::warning
**使用专用邮箱并配置 `EMAIL_ALLOWED_USERS` 以进行正常操作。** 邮件配对是可选功能，因为共享收件箱中通常包含不相关的未读邮件，Hermes 不应默认回复这些联系人。
:::

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| 启动时出现 **"IMAP 连接失败"** | 验证 `EMAIL_IMAP_HOST` 和 `EMAIL_IMAP_PORT`。确保账户已启用 IMAP。对于 Gmail，在设置 → 转发和 POP/IMAP 中启用。 |
| 启动时出现 **"SMTP 连接失败"** | 验证 `EMAIL_SMTP_HOST` 和 `EMAIL_SMTP_PORT`。检查密码是否正确（Gmail 请使用应用专用密码）。 |
| **收不到邮件** | 检查 `EMAIL_ALLOWED_USERS` 是否包含发件人的邮箱。检查垃圾邮件文件夹——某些服务商会将自动回复标记为垃圾邮件。 |
| **"身份验证失败"** | 对于 Gmail，必须使用应用专用密码，而不是常规密码。请确保已先启用两步验证。 |
| **重复回复** | 确保只运行了一个网关实例。检查 `hermes gateway status`。 |
| **响应缓慢** | 默认轮询间隔为 15 秒。可通过设置 `EMAIL_POLL_INTERVAL=5` 加快响应速度（但会增加 IMAP 连接次数）。 |
| **回复未形成会话线程** | 适配器使用 In-Reply-To 标头。某些邮件客户端（尤其是基于网页的）可能无法正确处理自动消息的会话线程。 |

---

## 安全性

:::warning
**使用专用邮箱账户。** 不要使用你的个人邮箱——智能体将密码存储在 `.env` 中，并通过 IMAP 拥有收件箱的完全访问权限。
:::

- 使用**应用专用密码**而不是主密码（启用两步验证的 Gmail 必须使用）
- 设置 `EMAIL_ALLOWED_USERS` 以限制可以与智能体交互的用户
- 密码存储在 `~/.hermes/.env` 中——请保护此文件（`chmod 600`）
- IMAP 默认使用 SSL（993 端口），SMTP 默认使用 STARTTLS（587 端口）——连接已加密

---

## 环境变量参考

| 变量 | 必填 | 默认值 | 说明 |
|----------|----------|---------|-------------|
| `EMAIL_ADDRESS` | 是 | — | 智能体的邮箱地址 |
| `EMAIL_PASSWORD` | 是 | — | 邮箱密码或应用专用密码 |
| `EMAIL_IMAP_HOST` | 是 | — | IMAP 服务器主机（例如 `imap.gmail.com`） |
| `EMAIL_SMTP_HOST` | 是 | — | SMTP 服务器主机（例如 `smtp.gmail.com`） |
| `EMAIL_IMAP_PORT` | 否 | `993` | IMAP 服务器端口 |
| `EMAIL_SMTP_PORT` | 否 | `587` | SMTP 服务器端口 |
| `EMAIL_POLL_INTERVAL` | 否 | `15` | 收件箱检查间隔秒数 |
| `EMAIL_ALLOWED_USERS` | 否 | — | 逗号分隔的允许发件人地址 |
| `EMAIL_HOME_ADDRESS` | 否 | — | cron 任务的默认投递目标 |
| `EMAIL_ALLOW_ALL_USERS` | 否 | `false` | 允许所有发件人（不推荐） |