---
sidebar_position: 2
sidebar_label: "Google Workspace"
title: "Google Workspace — Gmail, Calendar, Drive, Sheets & Docs"
description: "通过 OAuth2 身份验证的 Google API，实现发送电子邮件、管理日历事件、搜索云端硬盘、读取/写入表格和访问文档"
---

# Google Workspace 技能

为 Hermes 提供的 Gmail、日历、云端硬盘、联系人、表格和文档集成。使用 OAuth2 实现自动令牌刷新。如果可用，优先使用 [Google Workspace CLI (`gws`)](https://github.com/googleworkspace/cli) 以获得更广泛的覆盖范围，否则回退到 Google 的 Python 客户端库。

**技能路径:** `skills/productivity/google-workspace/`

## 设置

设置是完全由智能体驱动的——请 Hermes 设置 Google Workspace，它将引导您完成每个步骤。流程如下：

1. **创建 Google Cloud 项目**并启用所需的 API（Gmail、日历、云端硬盘、表格、文档、People）。
2. **创建 OAuth 2.0 凭据**（桌面应用类型）并下载客户端密钥 JSON 文件。
3. **授权**——Hermes 会生成一个身份验证 URL，您在浏览器中批准后粘贴重定向 URL。
4. **完成**——从那时起令牌将自动刷新。

:::tip 仅限电子邮件用户
如果您只需要电子邮件（不需要日历/云端硬盘/表格），请改用 **himalaya** 技能——它支持 Gmail 应用密码，只需 2 分钟。无需 Google Cloud 项目。
:::

## Gmail

### 搜索

```bash
$GAPI gmail search "is:unread" --max 10
$GAPI gmail search "from:boss@company.com newer_than:1d"
$GAPI gmail search "has:attachment filename:pdf newer_than:7d"
```

返回包含每个消息的 `id`、`from`、`subject`、`date`、`snippet` 和 `labels` 的 JSON。

### 读取

```bash
$GAPI gmail get MESSAGE_ID
```

返回完整的邮件正文（文本优先，回退到 HTML）。

### 发送

```bash
# 基础发送
$GAPI gmail send --to user@example.com --subject "Hello" --body "Message text"

# HTML 电子邮件
$GAPI gmail send --to user@example.com --subject "Report" \
  --body "<h1>Q4 Results</h1><p>Details here</p>" --html

# 自定义 From 标头（显示名称 + 电子邮件）
$GAPI gmail send --to user@example.com --subject "Hello" \
  --from '"Research Agent" <user@example.com>' --body "Message text"

# 带抄送 (CC)
$GAPI gmail send --to user@example.com --cc "team@example.com" \
  --subject "Update" --body "FYI"
```

### 自定义 From 标头

`--from` 标志允许您自定义发送邮件时的发件人显示名称。当多个智能体共享同一个 Gmail 帐户，但您希望收件人看到不同的名称时，这非常有用：

```bash
# 智能体 1
$GAPI gmail send --to client@co.com --subject "Research Summary" \
  --from '"Research Agent" <shared@company.com>' --body "..."

# 智能体 2
$GAPI gmail send --to client@co.com --subject "Code Review" \
  --from '"Code Assistant" <shared@company.com>' --body "..."
```

**工作原理:** `--from` 值被设置为 MIME 消息上的 RFC 5322 `From` 标头。Gmail 允许在没有额外配置的情况下自定义您自己身份验证的电子邮件地址的显示名称。收件人可以看到自定义的显示名称（例如“Research Agent”），而电子邮件地址保持不变。

**重要提示:** 如果您在 `--from` 中使用了*不同的电子邮件地址*（而不是经过身份验证的帐户），Gmail 要求该地址已配置为 Gmail 设置 → 帐户 → 以此身份发送邮件中的 [Send As alias](https://support.google.com/mail/answer/22370)。

`--from` 标志适用于 `send` 和 `reply`：

```bash
$GAPI gmail reply MESSAGE_ID \
  --from '"Support Bot" <shared@company.com>' --body "We're on it"
```

### 回复信

```bash
$GAPI gmail reply MESSAGE_ID --body "Thanks, that works for me."
```

自动串联回复（设置 `In-Reply-To` 和 `References` 标头）并使用原始消息的线程 ID。

### 标签 (Labels)

```bash
# 列出所有标签
$GAPI gmail labels

# 添加/移除标签
$GAPI gmail modify MESSAGE_ID --add-labels LABEL_ID
$GAPI gmail modify MESSAGE_ID --remove-labels UNREAD
```

## 日历 (Calendar)

```bash
# 列出事件（默认为接下来的 7 天）
$GAPI calendar list
$GAPI calendar list --start 2026-03-01T00:00:00Z --end 2026-03-07T23:59:59Z

# 创建事件（需要时区）
$GAPI calendar create --summary "Team Standup" \
  --start 2026-03-01T10:00:00-07:00 --end 2026-03-01T10:30:00-07:00

# 带地点和参会者
$GAPI calendar create --summary "Lunch" \
  --start 2026-03-01T12:00:00Z --end 2026-03-01T13:00:00Z \
  --location "Cafe" --attendees "alice@co.com,bob@co.com"

# 删除事件
$GAPI calendar delete EVENT_ID
```

:::warning
日历时间**必须**包含时区偏移量（例如 `-07:00`）或使用 UTC (`Z`)。像 `2026-03-01T10:00:00` 这样的裸日期时间是模糊的，将被视为 UTC。
:::

## 云端硬盘 (Drive)

```bash
$GAPI drive search "quarterly report" --max 10
$GAPI drive search "mimeType='application/pdf'" --raw-query --max 5
```

## 表格 (Sheets)

```bash
# 读取范围
$GAPI sheets get SHEET_ID "Sheet1!A1:D10"

# 写入范围
$GAPI sheets update SHEET_ID "Sheet1!A1:B2" --values '[["Name","Score"],["Alice","95"]]'

# 追加行
$GAPI sheets append SHEET_ID "Sheet1!A:C" --values '[["new","row","data"]]'
```

## 文档 (Docs)

```bash
$GAPI docs get DOC_ID
```

返回文档标题和完整文本内容。

## 联系人 (Contacts)

```bash
$GAPI contacts list --max 20
```

## 输出格式

所有命令均返回 JSON。每个服务的关键字段：

| 命令 | 字段 |
|---------|--------|
| `gmail search` | `id`, `threadId`, `from`, `to`, `subject`, `date`, `snippet`, `labels` |
| `gmail get` | `id`, `threadId`, `from`, `to`, `subject`, `date`, `labels`, `body` |
| `gmail send/reply` | `status`, `id`, `threadId` |
| `calendar list` | `id`, `summary`, `start`, `end`, `location`, `description`, `htmlLink` |
| `calendar create` | `status`, `id`, `summary`, `htmlLink` |
| `drive search` | `id`, `name`, `mimeType`, `modifiedTime`, `webViewLink` |
| `contacts list` | `name`, `emails`, `phones` |
| `sheets get` | 单元格值的二维数组 |

## 故障排除

| 问题 | 修复方法 |
|---------|-----|
| `NOT_AUTHENTICATED` | 运行设置（请 Hermes 设置 Google Workspace） |
| `REFRESH_FAILED` | 令牌已被撤销——重新运行授权步骤 |
| `HttpError 403: Insufficient Permission` | 缺少权限范围——撤销并使用正确的服务重新授权 |
| `HttpError 403: Access Not Configured` | API 未在 Google Cloud Console 中启用 |
| `ModuleNotFoundError` | 使用 `--install-deps` 运行设置脚本 |