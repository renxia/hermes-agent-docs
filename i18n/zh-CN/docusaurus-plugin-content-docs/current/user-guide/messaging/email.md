---
sidebar_position: 7
title: "电子邮件"
description: "通过 IMAP/SMTP 将 Hermes Agent 设置为电子邮件助手"
---

# 电子邮件设置

Hermes 可以使用标准的 IMAP 和 SMTP 协议接收和回复电子邮件。只需向代理的地址发送电子邮件，它就会在线程内回复——无需特殊的客户端或机器人 API。支持 Gmail、Outlook、Yahoo、Fastmail 或任何支持 IMAP/SMTP 的提供商。

:::info 无外部依赖
电子邮件适配器使用 Python 内置的 `imaplib`、`smtplib` 和 `email` 模块。不需要额外的包或外部服务。
:::

---

## 先决条件

- **专用的电子邮件账户** 用于您的 Hermes 代理（不要使用您的个人邮箱）
- 电子邮件账户必须**启用 IMAP**
- 如果使用 Gmail 或其他支持 2FA 的提供商，需要**应用密码**

### Gmail 设置

1. 在您的 Google 账户上启用两步验证
2. 访问 [应用专用密码](https://myaccount.google.com/apppasswords)
3. 创建一个新的应用专用密码（选择“邮件”或“其他”）
4. 复制 16 位密码——您将使用此密码代替您的常规密码

### Outlook / Microsoft 365

1. 访问 [安全设置](https://account.microsoft.com/security)
2. 如果尚未激活，请启用 2FA
3. 在“附加安全选项”下创建应用专用密码
4. IMAP 主机：`outlook.office365.com`，SMTP 主机：`smtp.office365.com`

### 其他提供商

大多数电子邮件提供商都支持 IMAP/SMTP。请查阅您提供商的文档，了解以下信息：
- IMAP 主机和端口（通常是使用 SSL 的 993 端口）
- SMTP 主机和端口（通常是使用 STARTTLS 的 587 端口）
- 是否需要应用专用密码

---

## 步骤 1：配置 Hermes

最简单的方法是：

```bash
hermes gateway setup
```

从平台菜单中选择 **Email**。向导将提示您输入电子邮件地址、密码、IMAP/SMTP 主机和允许的发送者。

### 手动配置

添加到 `~/.hermes/.env`：

```bash
# 必需
EMAIL_ADDRESS=hermes@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop    # 应用密码（不是您的常规密码）
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_SMTP_HOST=smtp.gmail.com

# 安全（推荐）
EMAIL_ALLOWED_USERS=your@email.com,colleague@work.com

# 可选
EMAIL_IMAP_PORT=993                    # 默认：993 (IMAP SSL)
EMAIL_SMTP_PORT=587                    # 默认：587 (SMTP STARTTLS)
EMAIL_POLL_INTERVAL=15                 # 收件箱检查间隔（秒，默认：15）
EMAIL_HOME_ADDRESS=your@email.com      # 定时任务的默认目标地址
```

---

## 步骤 2：启动网关

```bash
hermes gateway              # 前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅限 Linux：系统启动服务
```

启动时，适配器会：
1. 测试 IMAP 和 SMTP 连接
2. 将所有现有收件箱消息标记为“已读”（仅处理新邮件）
3. 开始轮询新消息

---

## 工作原理

### 接收消息

适配器会以可配置的间隔（默认：15 秒）轮询 IMAP 收件箱中的未读消息。对于每封新邮件：

- **主题行**作为上下文包含（例如：`[主题: 部署到生产环境]`）
- **回复邮件**（主题以 `Re:` 开头）会跳过主题前缀——线程上下文已建立
- **附件**会本地缓存：
  - 图像（JPEG、PNG、GIF、WebP）→ 可供视觉工具使用
  - 文档（PDF、ZIP 等）→ 可供文件访问
- **纯 HTML 邮件**会剥离标签以提取纯文本
- **自发消息**会被过滤掉，以防止回复循环
- **自动化/发件人地址**会被静默忽略——例如 `noreply@`、`mailer-daemon@`、`bounce@`、`no-reply@`，以及带有 `Auto-Submitted`、`Precedence: bulk` 或 `List-Unsubscribe` 头部的邮件

### 发送回复

回复通过 SMTP 发送，并包含正确的邮件线程信息：

- **In-Reply-To** 和 **References** 头部保持了线程连续性
- **主题行**保留 `Re:` 前缀（不会出现双重 `Re: Re:`）
- **Message-ID** 使用代理的域名生成
- 回复以纯文本（UTF-8）形式发送

### 文件附件

代理可以在回复中发送文件附件。在回复中包含 `MEDIA:/path/to/file`，文件就会附加到发送的电子邮件中。

### 跳过附件

要忽略所有传入的附件（用于恶意软件保护或节省带宽），请将以下内容添加到您的 `config.yaml`：

```yaml
platforms:
  email:
    skip_attachments: true
```

启用后，附件和内联部分将在负载解码之前被跳过。电子邮件正文文本仍会正常处理。

---

## 访问控制

电子邮件访问遵循所有其他 Hermes 平台的相同模式：

1. **设置 `EMAIL_ALLOWED_USERS`** → 仅处理来自这些地址的邮件
2. **未设置白名单** → 未知发送者会收到配对代码
3. **`EMAIL_ALLOW_ALL_USERS=true`** → 接受任何发送者（请谨慎使用）

:::warning
**始终配置 `EMAIL_ALLOWED_USERS`。** 如果没有它，任何知道代理电子邮件地址的人都可以发送命令。默认情况下，代理拥有终端访问权限。
:::

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| 启动时出现 **“IMAP 连接失败”** | 验证 `EMAIL_IMAP_HOST` 和 `EMAIL_IMAP_PORT`。确保账户已启用 IMAP。对于 Gmail，请在设置 → 转发和 POP/IMAP 中启用它。 |
| 启动时出现 **“SMTP 连接失败”** | 验证 `EMAIL_SMTP_HOST` 和 `EMAIL_SMTP_PORT`。检查密码是否正确（对于 Gmail，请使用应用专用密码）。 |
| **未收到消息** | 检查 `EMAIL_ALLOWED_USERS` 是否包含发送者的电子邮件。检查垃圾邮件文件夹——某些提供商会标记自动回复。 |
| **“认证失败”** | 对于 Gmail，您必须使用应用专用密码，而不是常规密码。请确保首先启用了 2FA。 |
| **重复回复** | 确保只运行一个网关实例。检查 `hermes gateway status`。 |
| **响应缓慢** | 默认轮询间隔为 15 秒。使用 `EMAIL_POLL_INTERVAL=5` 可以加快响应速度（但会增加 IMAP 连接）。 |
| **回复未保持线程** | 适配器使用 In-Reply-To 头部。某些电子邮件客户端（尤其是基于网页的）可能无法与自动化消息正确关联线程。 |

---

## 安全性

:::warning
**使用专用的电子邮件账户。** 不要使用您的个人邮箱——代理将密码存储在 `.env` 中，并通过 IMAP 拥有完整的收件箱访问权限。
:::

- 使用**应用专用密码**代替主密码（Gmail 启用 2FA 时必需）
- 设置 `EMAIL_ALLOWED_USERS` 来限制可以与代理交互的用户
- 密码存储在 `~/.hermes/.env` 中——请保护此文件（`chmod 600`）
- IMAP 默认使用 SSL（端口 993），SMTP 默认使用 STARTTLS（端口 587）——连接是加密的

---

## 环境变量参考

| 变量 | 是否必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `EMAIL_ADDRESS` | 是 | — | 代理的电子邮件地址 |
| `EMAIL_PASSWORD` | 是 | — | 电子邮件密码或应用专用密码 |
| `EMAIL_IMAP_HOST` | 是 | — | IMAP 服务器主机（例如：`imap.gmail.com`） |
| `EMAIL_SMTP_HOST` | 是 | — | SMTP 服务器主机（例如：`smtp.gmail.com`） |
| `EMAIL_IMAP_PORT` | 否 | `993` | IMAP 服务器端口 |
| `EMAIL_SMTP_PORT` | 否 | `587` | SMTP 服务器端口 |
| `EMAIL_POLL_INTERVAL` | 否 | `15` | 收件箱检查间隔（秒） |
| `EMAIL_ALLOWED_USERS` | 否 | — | 逗号分隔的允许发送者地址 |
| `EMAIL_HOME_ADDRESS` | 否 | — | 定时任务的默认目标地址 |
| `EMAIL_ALLOW_ALL_USERS` | 否 | `false` | 允许所有发送者（不推荐） |