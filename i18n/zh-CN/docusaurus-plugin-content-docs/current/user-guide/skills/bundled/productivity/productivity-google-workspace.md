---
title: "Google Workspace — 通过 gws CLI 或 Python 使用 Gmail、日历、云盘、文档、表格"
sidebar_label: "Google Workspace"
description: "通过 gws CLI 或 Python 使用 Gmail、日历、云盘、文档、表格"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 脚本从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Google Workspace

通过 gws CLI 或 Python 使用 Gmail、日历、云盘、文档、表格。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/productivity/google-workspace` |
| 版本 | `1.1.0` |
| 作者 | Nous Research |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Google`, `Gmail`, `Calendar`, `Drive`, `Sheets`, `Docs`, `Contacts`, `Email`, `OAuth` |
| 相关技能 | [`himalaya`](/docs/user-guide/skills/bundled/email/email-himalaya) |

:::info
以下是 Hermes 触发此技能时加载的完整技能定义。这是技能激活时智能体看到的说明。
:::

# Google Workspace

Gmail、Calendar、Drive、Contacts、Sheets 和 Docs —— 通过 Hermes 管理的 OAuth 和一个轻量级 CLI 包装器实现。当安装了 `gws` 时，该技能使用它作为执行后端以获得更广泛的 Google Workspace 覆盖；否则它回退到内置的 Python 客户端实现。

## 参考资料

- `references/gmail-search-syntax.md` —— Gmail 搜索语法（is:unread、from:、newer_than: 等）

## 脚本

- `scripts/setup.py` —— OAuth2 设置（运行一次以进行授权）
- `scripts/google_api.py` —— 兼容性包装器 CLI。它在可用时优先使用 `gws` 进行操作，同时保留 Hermes 现有的 JSON 输出约定。

## 首次设置

设置过程完全非交互式——您可以逐步驱动它，使其能在 CLI、Telegram、Discord 或任何平台上运行。

首先定义一个简写：

```bash
GSETUP="python ${HERMES_HOME:-$HOME/.hermes}/skills/productivity/google-workspace/scripts/setup.py"
```

### 步骤 0：检查是否已设置

```bash
$GSETUP --check
```

如果它打印出 `AUTHENTICATED`，请跳至用法部分——设置已完成。

### 步骤 1：分流——询问用户需要什么

在开始 OAuth 设置之前，向用户询问两个问题：

**问题 1：“您需要哪些 Google 服务？只需要电子邮件，还是也需要 Calendar/Drive/Sheets/Docs？”**

- **仅电子邮件** → 他们根本不需要此技能。请改用 `himalaya` 技能——它通过 Gmail App Password（设置 → 安全 → App Passwords）工作，设置只需 2 分钟。无需 Google Cloud 项目。加载 himalaya 技能并按照其设置说明操作。

- **电子邮件 + 日历** → 继续使用此技能，但在授权时使用 `--services email,calendar`，这样同意屏幕只会请求他们实际需要的权限范围。

- **仅日历/云端硬盘/表格/文档** → 继续使用此技能，并使用更窄的 `--services` 集合，如 `calendar,drive,sheets,docs`。

- **完整的 Workspace 访问权限** → 继续使用此技能，并使用默认的 `all` 服务集。

**问题 2：“您的 Google 帐户是否使用高级保护（登录需要硬件安全密钥）？如果不确定，那您可能没有使用——这是您需要明确注册的功能。”**

- **否 / 不确定** → 正常设置。请继续下面的步骤。
- **是** → 他们的 Workspace 管理员必须在第 4 步生效之前将 OAuth 客户端 ID 添加到组织的允许应用列表中。请提前告知他们。

### 步骤 2：创建 OAuth 凭据（一次性，约 5 分钟）

告诉用户：

> 您需要一个 Google Cloud OAuth 客户端。这是一次性设置：
>
> 1.  创建或选择一个项目：
>     https://console.cloud.google.com/projectselector2/home/dashboard
> 2.  从 API 库启用所需的 API：
>     https://console.cloud.google.com/apis/library
>     启用：Gmail API、Google Calendar API、Google Drive API、
>     Google Sheets API、Google Docs API、People API
> 3.  在此处创建 OAuth 客户端：
>     https://console.cloud.google.com/apis/credentials
>     凭据 → 创建凭据 → OAuth 2.0 客户端 ID
> 4.  应用类型：“桌面应用” → 创建
> 5.  如果应用仍处于测试阶段，请在此处将用户的 Google 帐户添加为测试用户：
>     https://console.cloud.google.com/auth/audience
>     受众群体 → 测试用户 → 添加用户
> 6.  下载 JSON 文件并告诉我文件路径
>
> 重要的 Hermes CLI 注意事项：如果文件路径以 `/` 开头，请不要仅将裸路径作为其自己的消息在 CLI 中发送，因为它可能被误解为斜杠命令。请将其放在一个句子中发送，例如：
> `The JSON file path is: /home/user/Downloads/client_secret_....json`

一旦他们提供路径：

```bash
$GSETUP --client-secret /path/to/client_secret.json
```

如果他们粘贴了原始的客户端 ID / 客户端密钥值而不是文件路径，请为他们自己编写一个有效的桌面 OAuth JSON 文件，将其保存在明确的位置（例如 `~/Downloads/hermes-google-client-secret.json`），然后对该文件运行 `--client-secret`。

### 步骤 3：获取授权 URL

使用步骤 1 中选择的服务集。示例：

```bash
$GSETUP --auth-url --services email,calendar --format json
$GSETUP --auth-url --services calendar,drive,sheets,docs --format json
$GSETUP --auth-url --services all --format json
```

这将返回一个 JSON，其中包含 `auth_url` 字段，并将确切的 URL 保存到 `~/.hermes/google_oauth_last_url.txt`。

此步骤的智能体规则：
- 提取 `auth_url` 字段，并将该确切 URL 作为单行发送给用户。
- 告诉用户，批准后浏览器可能会在 `http://localhost:1` 处失败，这是预期行为。
- 告诉他们从浏览器地址栏复制完整的重定向 URL。
- 如果用户收到 `Error 403: access_denied`，直接引导他们访问 `https://console.cloud.google.com/auth/audience` 以将自己添加为测试用户。

### 步骤 4：交换代码

用户会粘贴回一个 URL，如 `http://localhost:1/?code=4/0A...&scope=...` 或仅代码字符串。两者都有效。`--auth-url` 步骤会在本地存储一个临时的挂起 OAuth 会话，以便 `--auth-code` 稍后可以在无头系统上完成 PKCE 交换：

```bash
$GSETUP --auth-code "THE_URL_OR_CODE_THE_USER_PASTED" --format json
```

如果 `--auth-code` 因代码已过期、已被使用或来自较旧的浏览器标签页而失败，它现在会返回一个新的 `fresh_auth_url`。在这种情况下，立即向用户发送新 URL，并让他们使用最新的浏览器重定向重试。

### 步骤 5：验证

```bash
$GSETUP --check
```

应打印出 `AUTHENTICATED`。设置完成——从此刻起令牌将自动刷新。

### 注意事项

- 令牌存储在 `~/.hermes/google_token.json` 并自动刷新。
- 挂起的 OAuth 会话状态/验证器临时存储在 `~/.hermes/google_oauth_pending.json`，直到交换完成。
- 如果安装了 `gws`，`google_api.py` 会将其指向相同的 `~/.hermes/google_token.json` 凭据文件。用户不需要运行单独的 `gws auth login` 流程。
- 要撤销：`$GSETUP --revoke`

## 用法

所有命令都通过 API 脚本运行。设置 `GAPI` 作为简写：

```bash
GAPI="python ${HERMES_HOME:-$HOME/.hermes}/skills/productivity/google-workspace/scripts/google_api.py"
```

### Gmail

```bash
# 搜索（返回包含 id、from、subject、date、snippet 的 JSON 数组）
$GAPI gmail search "is:unread" --max 10
$GAPI gmail search "from:boss@company.com newer_than:1d"
$GAPI gmail search "has:attachment filename:pdf newer_than:7d"

# 读取完整消息（返回包含 body text 的 JSON）
$GAPI gmail get MESSAGE_ID

# 发送
$GAPI gmail send --to user@example.com --subject "Hello" --body "Message text"
$GAPI gmail send --to user@example.com --subject "Report" --body "<h1>Q4</h1><p>Details...</p>" --html
$GAPI gmail send --to user@example.com --subject "Hello" --from '"Research Agent" <user@example.com>' --body "Message text"

# 回复（自动放入线程并设置 In-Reply-To）
$GAPI gmail reply MESSAGE_ID --body "Thanks, that works for me."
$GAPI gmail reply MESSAGE_ID --from '"Support Bot" <user@example.com>' --body "Thanks"

# 标签
$GAPI gmail labels
$GAPI gmail modify MESSAGE_ID --add-labels LABEL_ID
$GAPI gmail modify MESSAGE_ID --remove-labels UNREAD
```

### 日历

```bash
# 列出事件（默认为未来 7 天）
$GAPI calendar list
$GAPI calendar list --start 2026-03-01T00:00:00Z --end 2026-03-07T23:59:59Z

# 创建事件（需要带时区的 ISO 8601）
$GAPI calendar create --summary "Team Standup" --start 2026-03-01T10:00:00-06:00 --end 2026-03-01T10:30:00-06:00
$GAPI calendar create --summary "Lunch" --start 2026-03-01T12:00:00Z --end 2026-03-01T13:00:00Z --location "Cafe"
$GAPI calendar create --summary "Review" --start 2026-03-01T14:00:00Z --end 2026-03-01T15:00:00Z --attendees "alice@co.com,bob@co.com"

# 删除事件
$GAPI calendar delete EVENT_ID
```

### 云端硬盘

```bash
# 搜索现有文件
$GAPI drive search "quarterly report" --max 10
$GAPI drive search "mimeType='application/pdf'" --raw-query --max 5

# 获取单个文件的元数据
$GAPI drive get FILE_ID

# 上传本地文件（自动检测 MIME 类型）
$GAPI drive upload /path/to/report.pdf
$GAPI drive upload /path/to/image.png --name "Logo.png" --parent FOLDER_ID

# 下载（二进制文件原样下载；Google 原生文件导出为合理的默认格式 —— 文档→pdf，表格→csv，幻灯片→pdf，绘图→png）
$GAPI drive download FILE_ID
$GAPI drive download DOC_ID --output ~/doc.pdf
$GAPI drive download DOC_ID --export-mime text/plain --output ~/doc.txt

# 创建文件夹
$GAPI drive create-folder "Reports"
$GAPI drive create-folder "Q4" --parent FOLDER_ID

# 共享
$GAPI drive share FILE_ID --email alice@example.com --role reader
$GAPI drive share FILE_ID --email alice@example.com --role writer --notify
$GAPI drive share FILE_ID --type anyone --role reader        # 任何有链接的人
$GAPI drive share FILE_ID --type domain --domain example.com --role reader

# 删除 —— 默认移到回收站（可逆）。使用 --permanent 跳过回收站。
$GAPI drive delete FILE_ID
$GAPI drive delete FILE_ID --permanent
```

### 通讯录

```bash
$GAPI contacts list --max 20
```

### 表格

```bash
# 创建新电子表格
$GAPI sheets create --title "Q4 Budget"
$GAPI sheets create --title "Inventory" --sheet-name "Stock"

# 读取
$GAPI sheets get SHEET_ID "Sheet1!A1:D10"

# 写入
$GAPI sheets update SHEET_ID "Sheet1!A1:B2" --values '[["Name","Score"],["Alice","95"]]'

# 追加行
$GAPI sheets append SHEET_ID "Sheet1!A:C" --values '[["new","row","data"]]'
```

### 文档

```bash
# 读取
$GAPI docs get DOC_ID

# 创建新文档（可选择用正文内容初始化）
$GAPI docs create --title "Meeting Notes"
$GAPI docs create --title "Draft" --body "First paragraph..."

# 将文本追加到现有文档末尾
$GAPI docs append DOC_ID --text "Additional content to append"
```

## 输出格式

所有命令返回 JSON。可通过 `jq` 解析或直接读取。关键字段：

- **Gmail 搜索**：`[{id, threadId, from, to, subject, date, snippet, labels}]`
- **Gmail 获取**：`{id, threadId, from, to, subject, date, labels, body}`
- **Gmail 发送/回复**：`{status: "sent", id, threadId}`
- **日历列表**：`[{id, summary, start, end, location, description, htmlLink}]`
- **日历创建**：`{status: "created", id, summary, htmlLink}`
- **云端硬盘搜索**：`[{id, name, mimeType, modifiedTime, webViewLink}]`
- **云端硬盘获取**：`{id, name, mimeType, modifiedTime, size, webViewLink, parents, owners}`
- **云端硬盘上传**：`{status: "uploaded", id, name, mimeType, webViewLink}`
- **云端硬盘下载**：`{status: "downloaded", id, name, path, mimeType}`
- **云端硬盘创建文件夹**：`{status: "created", id, name, webViewLink}`
- **云端硬盘共享**：`{status: "shared", permissionId, fileId, role, type}`
- **云端硬盘删除**：`{status: "trashed" | "deleted", fileId, permanent}`
- **通讯录列表**：`[{name, emails: [...], phones: [...]}]`
- **表格获取**：`[[cell, cell, ...], ...]`
- **表格创建**：`{status: "created", spreadsheetId, title, spreadsheetUrl}`
- **文档创建**：`{status: "created", documentId, title, url}`
- **文档追加**：`{status: "appended", documentId, inserted_at, characters}`

## 规则

1. **未经用户确认，绝不发送邮件、创建/删除日历事件、删除云端硬盘文件、共享文件或修改文档/表格。** 需向用户说明即将执行的操作（收件人、文件 ID、内容、共享角色）并请求批准。对于 `drive delete`，默认使用回收站（可逆操作），而非 `--permanent`。
2. **首次使用前检查认证状态** —— 运行 `setup.py --check`。若失败，请引导用户完成设置。
3. **使用 Gmail 搜索语法参考** 进行复杂查询 —— 通过 `skill_view("google-workspace", file_path="references/gmail-search-syntax.md")` 加载。
4. **日历时间必须包含时区** —— 始终使用带偏移的 ISO 8601 格式（例如 `2026-03-01T10:00:00-06:00`）或 UTC（`Z`）。
5. **遵守速率限制** —— 避免快速连续的 API 调用。尽可能批量读取。

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| `NOT_AUTHENTICATED` | 执行上述设置步骤 2-5 |
| `REFRESH_FAILED` | 令牌已被撤销或过期 —— 重新执行步骤 3-5 |
| `HttpError 403: 权限不足` | 缺少 API 权限范围 —— 运行 `$GSETUP --revoke` 然后重新执行步骤 3-5 |
| `AUTHENTICATED (部分)` 或 "令牌缺少权限范围" | 新的写入权限（云端硬盘写入/删除、文档创建/编辑）需要重新授权。运行 `$GSETUP --revoke` 然后重新执行步骤 3-5 以授予升级后的权限范围。 |
| `HttpError 403: 未配置访问权限` | API 未启用 —— 用户需在 Google Cloud Console 中启用 |
| `ModuleNotFoundError` | 运行 `$GSETUP --install-deps` |
| 高级保护阻止认证 | Workspace 管理员必须将 OAuth 客户端 ID 加入白名单 |

## 撤销访问权限

```bash
$GSETUP --revoke
```