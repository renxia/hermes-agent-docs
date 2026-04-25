---
title: "Google Workspace — Hermes 的 Gmail、日历、云端硬盘、联系人、表格和文档集成"
sidebar_label: "Google Workspace"
description: "Hermes 的 Gmail、日历、云端硬盘、联系人、表格和文档集成"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Google Workspace

Hermes 的 Gmail、日历、云端硬盘、联系人、表格和文档集成。使用 Hermes 管理的 OAuth2 设置，优先使用 Google Workspace CLI (`gws`) 以获得更广泛的 API 覆盖范围，否则回退到 Python 客户端库。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/productivity/google-workspace` |
| 版本 | `1.0.0` |
| 作者 | Nous Research |
| 许可证 | MIT |
| 标签 | `Google`, `Gmail`, `Calendar`, `Drive`, `Sheets`, `Docs`, `Contacts`, `Email`, `OAuth` |
| 相关技能 | [`himalaya`](/docs/user-guide/skills/bundled/email/email-himalaya) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Google Workspace

Gmail、日历、云端硬盘、通讯录、表格和文档 —— 通过 Hermes 管理的 OAuth 和一个轻量级 CLI 封装器实现。当安装 `gws` 时，该技能使用它作为执行后端以提供更广泛的 Google Workspace 覆盖；否则将回退到捆绑的 Python 客户端实现。

## 参考

- `references/gmail-search-syntax.md` — Gmail 搜索操作符（is:unread、from:、newer_than: 等）

## 脚本

- `scripts/setup.py` — OAuth2 设置（运行一次以授权）
- `scripts/google_api.py` — 兼容性封装 CLI。在可用时优先使用 `gws` 进行操作，同时保留 Hermes 现有的 JSON 输出约定。

## 首次设置

设置完全非交互式 —— 您逐步引导它，使其可在 CLI、Telegram、Discord 或任何平台上工作。

首先定义一个简写：

```bash
GSETUP="python ${HERMES_HOME:-$HOME/.hermes}/skills/productivity/google-workspace/scripts/setup.py"
```

### 步骤 0：检查是否已设置

```bash
$GSETUP --check
```

如果输出 `AUTHENTICATED`，请跳至“用法”部分 —— 设置已完成。

### 步骤 1：分类 —— 询问用户需要什么

在开始 OAuth 设置之前，向用户提出两个问题：

**问题 1：“您需要哪些 Google 服务？仅电子邮件，还是也包括日历/云端硬盘/表格/文档？”**

- **仅电子邮件** → 他们根本不需要此技能。改用 `himalaya` 技能 —— 它使用 Gmail 应用专用密码（设置 → 安全性 → 应用专用密码）并只需 2 分钟即可完成设置。无需 Google Cloud 项目。加载 himalaya 技能并按照其设置说明操作。

- **电子邮件 + 日历** → 继续使用此技能，但在授权时使用 `--services email,calendar`，以便同意屏幕仅请求他们实际需要的范围。

- **仅日历/云端硬盘/表格/文档** → 继续使用此技能，并使用更窄的 `--services` 集合，例如 `calendar,drive,sheets,docs`。

- **完整 Workspace 访问权限** → 继续使用此技能并使用默认的 `all` 服务集合。

**问题 2：“您的 Google 账户是否启用了高级保护（登录需要硬件安全密钥）？如果您不确定，可能没有启用 —— 这是您需要明确注册的功能。”**

- **否 / 不确定** → 正常设置。继续以下步骤。
- **是** → 他们的 Workspace 管理员必须将 OAuth 客户端 ID 添加到组织的允许应用列表中，步骤 4 才能正常工作。请提前告知他们这一点。

### 步骤 2：创建 OAuth 凭据（一次性，约 5 分钟）

告知用户：

> 您需要一个 Google Cloud OAuth 客户端。这是一次性设置：
>
> 1. 创建或选择一个项目：
>    https://console.cloud.google.com/projectselector2/home/dashboard
> 2. 从 API 库启用所需的 API：
>    https://console.cloud.google.com/apis/library
>    启用：Gmail API、Google Calendar API、Google Drive API、
>    Google Sheets API、Google Docs API、People API
> 3. 在此处创建 OAuth 客户端：
>    https://console.cloud.google.com/apis/credentials
>    凭据 → 创建凭据 → OAuth 2.0 客户端 ID
> 4. 应用类型：“桌面应用” → 创建
> 5. 如果应用仍处于测试阶段，请将用户的 Google 账户添加为测试用户：
>    https://console.cloud.google.com/auth/audience
>    受众 → 测试用户 → 添加用户
> 6. 下载 JSON 文件并告诉我文件路径
>
> 重要的 Hermes CLI 说明：如果文件路径以 `/` 开头，请不要仅在 CLI 中将纯路径作为单独消息发送，因为它可能被误认为是斜杠命令。请将其放在句子中发送，例如：
> `JSON 文件路径为：/home/user/Downloads/client_secret_....json`

一旦他们提供了路径：

```bash
$GSETUP --client-secret /path/to/client_secret.json
```

如果他们粘贴的是原始客户端 ID / 客户端密钥值而不是文件路径，请为他们编写一个有效的桌面 OAuth JSON 文件，将其保存在明确的位置（例如 `~/Downloads/hermes-google-client-secret.json`），然后对该文件运行 `--client-secret`。

### 步骤 3：获取授权 URL

使用步骤 1 中选择的服务集合。示例：

```bash
$GSETUP --auth-url --services email,calendar --format json
$GSETUP --auth-url --services calendar,drive,sheets,docs --format json
$GSETUP --auth-url --services all --format json
```

这将返回包含 `auth_url` 字段的 JSON，并将确切的 URL 保存到 `~/.hermes/google_oauth_last_url.txt`。

此步骤的智能体规则：
- 提取 `auth_url` 字段并将该确切 URL 作为单行发送给用户。
- 告知用户浏览器在批准后很可能在 `http://localhost:1` 上失败，这是预期行为。
- 告知他们从浏览器地址栏复制整个重定向 URL。
- 如果用户遇到 `Error 403: access_denied`，请直接将他们引导至 `https://console.cloud.google.com/auth/audience` 以将自己添加为测试用户。

### 步骤 4：交换代码

用户将粘贴回类似 `http://localhost:1/?code=4/0A...&scope=...` 的 URL 或仅粘贴代码字符串。两者均可。`--auth-url` 步骤会在本地存储临时的待处理 OAuth 会话，以便 `--auth-code` 稍后完成 PKCE 交换，即使在无头系统上也是如此：

```bash
$GSETUP --auth-code "THE_URL_OR_CODE_THE_USER_PASTED" --format json
```

如果 `--auth-code` 因代码过期、已被使用或来自较旧的浏览器标签页而失败，现在会返回一个新的 `fresh_auth_url`。在这种情况下，立即将新 URL 发送给用户，并让他们仅使用最新的浏览器重定向重试。

### 步骤 5：验证

```bash
$GSETUP --check
```

应输出 `AUTHENTICATED`。设置完成 —— 从现在开始令牌将自动刷新。

### 注意事项

- 令牌存储在 `~/.hermes/google_token.json` 中并自动刷新。
- 待处理的 OAuth 会话状态/验证器临时存储在 `~/.hermes/google_oauth_pending.json` 中，直到交换完成。
- 如果安装了 `gws`，`google_api.py` 会将其指向相同的 `~/.hermes/google_token.json` 凭据文件。用户无需运行单独的 `gws auth login` 流程。
- 撤销：`$GSETUP --revoke`

## 用法

所有命令都通过 API 脚本执行。将 `GAPI` 设为简写：

```bash
GAPI="python ${HERMES_HOME:-$HOME/.hermes}/skills/productivity/google-workspace/scripts/google_api.py"
```

### Gmail

```bash
# 搜索（返回包含 id、from、subject、date、snippet 的 JSON 数组）
$GAPI gmail search "is:unread" --max 10
$GAPI gmail search "from:boss@company.com newer_than:1d"
$GAPI gmail search "has:attachment filename:pdf newer_than:7d"

# 读取完整消息（返回包含正文文本的 JSON）
$GAPI gmail get MESSAGE_ID

# 发送
$GAPI gmail send --to user@example.com --subject "Hello" --body "Message text"
$GAPI gmail send --to user@example.com --subject "Report" --body "<h1>Q4</h1><p>Details...</p>" --html
$GAPI gmail send --to user@example.com --subject "Hello" --from '"Research Agent" <user@example.com>' --body "Message text"

# 回复（自动创建线程并设置 In-Reply-To）
$GAPI gmail reply MESSAGE_ID --body "Thanks, that works for me."
$GAPI gmail reply MESSAGE_ID --from '"Support Bot" <user@example.com>' --body "Thanks"

# 标签
$GAPI gmail labels
$GAPI gmail modify MESSAGE_ID --add-labels LABEL_ID
$GAPI gmail modify MESSAGE_ID --remove-labels UNREAD
```

### 日历

```bash
# 列出事件（默认为接下来 7 天）
$GAPI calendar list
$GAPI calendar list --start 2026-03-01T00:00:00Z --end 2026-03-07T23:59:59Z

# 创建事件（需要带时区的 ISO 8601 格式）
$GAPI calendar create --summary "Team Standup" --start 2026-03-01T10:00:00-06:00 --end 2026-03-01T10:30:00-06:00
$GAPI calendar create --summary "Lunch" --start 2026-03-01T12:00:00Z --end 2026-03-01T13:00:00Z --location "Cafe"
$GAPI calendar create --summary "Review" --start 2026-03-01T14:00:00Z --end 2026-03-01T15:00:00Z --attendees "alice@co.com,bob@co.com"

# 删除事件
$GAPI calendar delete EVENT_ID
```

### 云端硬盘

```bash
$GAPI drive search "quarterly report" --max 10
$GAPI drive search "mimeType='application/pdf'" --raw-query --max 5
```

### 通讯录

```bash
$GAPI contacts list --max 20
```

### 表格

```bash
# 读取
$GAPI sheets get SHEET_ID "Sheet1!A1:D10"

# 写入
$GAPI sheets update SHEET_ID "Sheet1!A1:B2" --values '[["Name","Score"],["Alice","95"]]'

# 追加行
$GAPI sheets append SHEET_ID "Sheet1!A:C" --values '[["new","row","data"]]'
```

### 文档

```bash
$GAPI docs get DOC_ID
```

## 输出格式

所有命令均返回 JSON。可使用 `jq` 解析或直接读取。关键字段：

- **Gmail 搜索**：`[{id, threadId, from, to, subject, date, snippet, labels}]`
- **Gmail 获取**：`{id, threadId, from, to, subject, date, labels, body}`
- **Gmail 发送/回复**：`{status: "sent", id, threadId}`
- **日历列表**：`[{id, summary, start, end, location, description, htmlLink}]`
- **日历创建**：`{status: "created", id, summary, htmlLink}`
- **云端硬盘搜索**：`[{id, name, mimeType, modifiedTime, webViewLink}]`
- **通讯录列表**：`[{name, emails: [...], phones: [...]}]`
- **表格获取**：`[[cell, cell, ...], ...]`

## 规则

1. **未经用户确认，切勿发送电子邮件或创建/删除事件。** 显示草稿内容并请求批准。
2. **首次使用前检查身份验证** — 运行 `setup.py --check`。如果失败，请引导用户完成设置。
3. **对于复杂查询，请使用 Gmail 搜索语法参考** — 使用 `skill_view("google-workspace", file_path="references/gmail-search-syntax.md")` 加载它。
4. **日历时间必须包含时区** — 始终使用带偏移量的 ISO 8601（例如 `2026-03-01T10:00:00-06:00`）或 UTC（`Z`）。
5. **遵守速率限制** — 避免连续快速调用 API。尽可能批量读取。

## 故障排除

| 问题 | 修复方法 |
|---------|-----|
| `NOT_AUTHENTICATED` | 运行上述设置步骤 2-5 |
| `REFRESH_FAILED` | 令牌已撤销或过期 — 重新执行步骤 3-5 |
| `HttpError 403: 权限不足` | 缺少 API 范围 — 执行 `$GSETUP --revoke`，然后重新执行步骤 3-5 |
| `HttpError 403: 访问未配置` | API 未启用 — 用户需要在 Google Cloud 控制台中启用它 |
| `ModuleNotFoundError` | 运行 `$GSETUP --install-deps` |
| 高级保护阻止身份验证 | 工作区管理员必须将 OAuth 客户端 ID 加入允许列表 |

## 撤销访问权限

```bash
$GSETUP --revoke
```