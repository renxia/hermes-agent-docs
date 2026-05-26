---
title: "Google Workspace — 通过 gws CLI 或 Python 使用 Gmail、Calendar、Drive、Docs、Sheets"
sidebar_label: "Google Workspace"
description: "通过 gws CLI 或 Python 使用 Gmail、Calendar、Drive、Docs、Sheets"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 从技能文件 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# Google Workspace

通过 gws CLI 或 Python 使用 Gmail、Calendar、Drive、Docs、Sheets。

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
| 相关技能 | [`himalaya`](/user-guide/skills/bundled/email/email-himalaya) |

:::info
以下内容是Hermes在此技能触发时加载的完整技能定义。这是该技能激活时智能体看到的指令。
:::

# Google Workspace

Gmail、日历、云端硬盘、通讯录、Sheets 和 Docs ——通过Hermes管理的OAuth和一个轻量CLI封装。如果安装了`gws`，该技能会将其用作执行后端以获得更广泛的Google Workspace覆盖范围；否则将回退到内置的Python客户端实现。

## 参考资料

- `references/gmail-search-syntax.md` —— Gmail搜索运算符（is:unread、from:、newer_than:等）

## 脚本

- `scripts/setup.py` —— OAuth2设置（运行一次以授权）
- `scripts/google_api.py` —— 兼容性封装CLI。当可用时，它优先使用`gws`进行操作，同时保留Hermes现有的JSON输出规范。

## 首次设置

设置过程完全非交互式——您可以逐步驱动它，因此可在CLI、Telegram、Discord或任何平台上工作。

首先定义一个快捷方式：

```bash
GSETUP="python ${HERMES_HOME:-$HOME/.hermes}/skills/productivity/google-workspace/scripts/setup.py"
```

### 步骤 0：检查是否已设置

```bash
$GSETUP --check
```

如果它打印出`AUTHENTICATED`，请跳转到使用说明——设置已经完成。

### 步骤 1：分类——询问用户需要什么

在开始OAuth设置之前，询问用户两个问题：

**问题 1："您需要哪些Google服务？仅电子邮件，还是也需要日历/云端硬盘/Sheets/Docs？"**

- **仅电子邮件** → 他们根本不需要此技能。请改用`himalaya`技能——它适用于Gmail应用专用密码（设置 → 安全 → 应用专用密码），设置只需2分钟。无需Google Cloud项目。加载himalaya技能并遵循其设置说明。

- **电子邮件 + 日历** → 继续使用此技能，但在授权时使用`--services email,calendar`，这样同意屏幕只会要求他们实际需要的范围。

- **仅日历/云端硬盘/Sheets/Docs** → 继续使用此技能，并使用更窄的`--services`集，例如`calendar,drive,sheets,docs`。

- **完整的Workspace访问权限** → 继续使用此技能，并使用默认的`all`服务集。

**问题 2："您的Google帐户是否使用高级保护（登录需要硬件安全密钥）？如果不确定，您可能没有——这是您需要明确注册的功能。"**

- **否/不确定** → 正常设置。请继续下面的步骤。
- **是** → 他们的Workspace管理员必须在第4步工作之前将OAuth客户端ID添加到组织的允许应用列表中。请事先告知他们。

### 步骤 2：创建OAuth凭据（一次性，约5分钟）

告诉用户：

> 您需要一个Google Cloud OAuth客户端。这是一次性设置：
>
> 1. 创建或选择一个项目：
>    https://console.cloud.google.com/projectselector2/home/dashboard
> 2. 从API库启用所需的API：
>    https://console.cloud.google.com/apis/library
>    启用：Gmail API、Google Calendar API、Google Drive API、Google Sheets API、Google Docs API、People API
> 3. 在此处创建OAuth客户端：
>    https://console.cloud.google.com/apis/credentials
>    凭据 → 创建凭据 → OAuth 2.0 客户端 ID
> 4. 应用类型："桌面应用" → 创建
> 5. 如果应用仍处于测试阶段，请在此处将用户的Google帐户添加为测试用户：
>    https://console.cloud.google.com/auth/audience
>    受众群体 → 测试用户 → 添加用户
> 6. 下载JSON文件并告诉我文件路径
>
> 重要的Hermes CLI注意事项：如果文件路径以`/`开头，请不要在CLI中仅将裸路径作为其自己的消息发送，因为它可能被误解为斜杠命令。请将其放在句子中发送，例如：
> `JSON文件路径是：/home/user/Downloads/client_secret_....json`

一旦他们提供路径：

```bash
$GSETUP --client-secret /path/to/client_secret.json
```

如果他们粘贴的是原始客户端 ID / 客户端密钥值而不是文件路径，请自己为他们编写一个有效的桌面 OAuth JSON 文件，将其保存在明确的位置（例如 `~/Downloads/hermes-google-client-secret.json`），然后对该文件运行 `--client-secret`。

### 步骤 3：获取授权URL

使用步骤1中选择的服务集。示例：

```bash
$GSETUP --auth-url --services email,calendar --format json
$GSETUP --auth-url --services calendar,drive,sheets,docs --format json
$GSETUP --auth-url --services all --format json
```

这将返回一个包含`auth_url`字段的JSON，并将确切的URL保存到`~/.hermes/google_oauth_last_url.txt`。

此步骤的智能体规则：
- 提取`auth_url`字段，并将该确切的URL作为单行发送给用户。
- 告诉用户，批准后浏览器在`http://localhost:1`上可能会失败，这是预期的。
- 告诉他们从浏览器地址栏复制整个重定向的URL。
- 如果用户收到`Error 403: access_denied`错误，请直接将他们发送到`https://console.cloud.google.com/auth/audience`以添加自己为测试用户。

### 步骤 4：交换代码

用户将粘贴回类似`http://localhost:1/?code=4/0A...&scope=...`的URL或仅代码字符串。两者都可以。`--auth-url`步骤在本地存储一个临时的待处理OAuth会话，因此`--auth-code`稍后可以在无头系统上完成PKCE交换：

```bash
$GSETUP --auth-code "THE_URL_OR_CODE_THE_USER_PASTED" --format json
```

如果`--auth-code`因代码过期、已被使用或来自较旧的浏览器标签页而失败，它现在会返回一个新的`fresh_auth_url`。在这种情况下，请立即将新URL发送给用户，并让他们仅使用最新的浏览器重定向重试。

### 步骤 5：验证

```bash
$GSETUP --check
```

应打印出`AUTHENTICATED`。设置完成——从现在开始令牌将自动刷新。

### 注意事项

- 令牌存储在`~/.hermes/google_token.json`中，并自动刷新。
- 待处理的OAuth会话状态/验证器临时存储在`~/.hermes/google_oauth_pending.json`中，直到交换完成。
- 如果安装了`gws`，`google_api.py`会将其指向相同的`~/.hermes/google_token.json`凭据文件。用户无需运行单独的`gws auth login`流程。
- 要撤销：`$GSETUP --revoke`

## 使用方法

所有命令都通过API脚本执行。将`GAPI`设置为快捷方式：

```bash
GAPI="python ${HERMES_HOME:-$HOME/.hermes}/skills/productivity/google-workspace/scripts/google_api.py"
```

### Gmail

```bash
# 搜索（返回包含id、from、subject、date、snippet的JSON数组）
$GAPI gmail search "is:unread" --max 10
$GAPI gmail search "from:boss@company.com newer_than:1d"
$GAPI gmail search "has:attachment filename:pdf newer_than:7d"

# 读取完整消息（返回包含正文文本的JSON）
$GAPI gmail get MESSAGE_ID

# 发送
$GAPI gmail send --to user@example.com --subject "你好" --body "消息文本"
$GAPI gmail send --to user@example.com --subject "报告" --body "<h1>Q4</h1><p>详情...</p>" --html
$GAPI gmail send --to user@example.com --subject "你好" --from '"研究智能体" <user@example.com>' --body "消息文本"

# 回复（自动线程化并设置In-Reply-To）
$GAPI gmail reply MESSAGE_ID --body "谢谢，这对我有用。"
$GAPI gmail reply MESSAGE_ID --from '"支持机器人" <user@example.com>' --body "谢谢"

# 标签
$GAPI gmail labels
$GAPI gmail modify MESSAGE_ID --add-labels LABEL_ID
$GAPI gmail modify MESSAGE_ID --remove-labels UNREAD
```

### 日历

```bash
# 列出事件（默认为未来7天）
$GAPI calendar list
$GAPI calendar list --start 2026-03-01T00:00:00Z --end 2026-03-07T23:59:59Z

# 创建事件（需要带时区的ISO 8601）
$GAPI calendar create --summary "团队站会" --start 2026-03-01T10:00:00-06:00 --end 2026-03-01T10:30:00-06:00
$GAPI calendar create --summary "午餐" --start 2026-03-01T12:00:00Z --end 2026-03-01T13:00:00Z --location "咖啡馆"
$GAPI calendar create --summary "评审" --start 2026-03-01T14:00:00Z --end 2026-03-01T15:00:00Z --attendees "alice@co.com,bob@co.com"

# 删除事件
$GAPI calendar delete EVENT_ID
```

### 云端硬盘

```bash
# 搜索现有文件
$GAPI drive search "季度报告" --max 10
$GAPI drive search "mimeType='application/pdf'" --raw-query --max 5

# 获取单个文件的元数据
$GAPI drive get FILE_ID

# 上传本地文件（自动检测MIME类型）
$GAPI drive upload /path/to/report.pdf
$GAPI drive upload /path/to/image.png --name "Logo.png" --parent FOLDER_ID

# 下载（二进制文件原样下载；Google原生文件导出为合理的默认格式——Docs→pdf、Sheets→csv、Slides→pdf、Drawings→png）
$GAPI drive download FILE_ID
$GAPI drive download DOC_ID --output ~/doc.pdf
$GAPI drive download DOC_ID --export-mime text/plain --output ~/doc.txt

# 创建文件夹
$GAPI drive create-folder "报告"
$GAPI drive create-folder "Q4" --parent FOLDER_ID

# 共享
$GAPI drive share FILE_ID --email alice@example.com --role reader
$GAPI drive share FILE_ID --email alice@example.com --role writer --notify
$GAPI drive share FILE_ID --type anyone --role reader        # 任何拥有链接的人
$GAPI drive share FILE_ID --type domain --domain example.com --role reader

# 删除——默认移至废纸篓（可逆）。使用--permanent可跳过废纸篓。
$GAPI drive delete FILE_ID
$GAPI drive delete FILE_ID --permanent
```

### 通讯录

```bash
$GAPI contacts list --max 20
```

### Sheets

```bash
# 创建新的电子表格
$GAPI sheets create --title "Q4预算"
$GAPI sheets create --title "库存" --sheet-name "库存"

# 读取
$GAPI sheets get SHEET_ID "Sheet1!A1:D10"

# 写入
$GAPI sheets update SHEET_ID "Sheet1!A1:B2" --values '[["姓名","分数"],["Alice","95"]]'

# 追加行
$GAPI sheets append SHEET_ID "Sheet1!A:C" --values '[["新","行","数据"]]'
```

### Docs

```bash
# 读取
$GAPI docs get DOC_ID

# 创建新文档（可选择用正文内容初始化）
$GAPI docs create --title "会议记录"
$GAPI docs create --title "草稿" --body "第一段..."

# 向现有文档末尾追加文本
$GAPI docs append DOC_ID --text "要追加的附加内容"
```

## 输出格式

所有命令均返回 JSON。可使用 `jq` 解析或直接读取。关键字段：

- **Gmail 搜索**：`[{id, threadId, from, to, subject, date, snippet, labels}]`
- **Gmail 获取**：`{id, threadId, from, to, subject, date, labels, body}`
- **Gmail 发送/回复**：`{status: "sent", id, threadId}`
- **日历列表**：`[{id, summary, start, end, location, description, htmlLink}]`
- **日历创建**：`{status: "created", id, summary, htmlLink}`
- **云硬盘搜索**：`[{id, name, mimeType, modifiedTime, webViewLink}]`
- **云硬盘获取**：`{id, name, mimeType, modifiedTime, size, webViewLink, parents, owners}`
- **云硬盘上传**：`{status: "uploaded", id, name, mimeType, webViewLink}`
- **云硬盘下载**：`{status: "downloaded", id, name, path, mimeType}`
- **云硬盘创建文件夹**：`{status: "created", id, name, webViewLink}`
- **云硬盘共享**：`{status: "shared", permissionId, fileId, role, type}`
- **云硬盘删除**：`{status: "trashed" | "deleted", fileId, permanent}`
- **联系人列表**：`[{name, emails: [...], phones: [...]}]`
- **表格获取**：`[[cell, cell, ...], ...]`
- **表格创建**：`{status: "created", spreadsheetId, title, spreadsheetUrl}`
- **文档创建**：`{status: "created", documentId, title, url}`
- **文档追加**：`{status: "appended", documentId, inserted_at, characters}`

## 规则

1.  **未经用户确认，切勿发送邮件、创建/删除日历事件、删除云硬盘文件、共享文件或修改文档/表格。** 请先显示将要执行的操作（收件人、文件ID、内容、共享角色）并请求批准。对于 `drive delete`，默认使用回收站（可恢复），而非 `--permanent`。
2.  **首次使用前检查授权状态** — 运行 `setup.py --check`。若失败，请引导用户完成设置。
3.  **复杂查询请使用 Gmail 搜索语法参考** — 通过 `skill_view("google-workspace", file_path="references/gmail-search-syntax.md")` 加载。
4.  **日历时间必须包含时区** — 始终使用带偏移的 ISO 8601 格式（例如 `2026-03-01T10:00:00-06:00`）或 UTC (`Z`)。
5.  **遵守速率限制** — 避免快速连续的 API 调用。尽可能批量读取。

## 故障排除

| 问题 | 解决方法 |
|------|----------|
| `NOT_AUTHENTICATED` | 运行上述设置步骤 2-5 |
| `REFRESH_FAILED` | 令牌已撤销或过期 — 重新执行步骤 3-5 |
| `HttpError 403: Insufficient Permission` | 缺少 API 权限 — 运行 `$GSETUP --revoke` 然后重新执行步骤 3-5 |
| `AUTHENTICATED (partial)` 或 “令牌缺少权限” | 新的写入功能（云硬盘写入/删除、文档创建/编辑）需要重新授权。运行 `$GSETUP --revoke` 然后重新执行步骤 3-5 以授予升级后的权限。 |
| `HttpError 403: Access Not Configured` | API 未启用 — 用户需要在 Google Cloud Console 中启用它 |
| `ModuleNotFoundError` | 运行 `$GSETUP --install-deps` |
| 高级保护阻止授权 | Workspace 管理员必须将 OAuth 客户端 ID 加入白名单 |

## 撤销访问权限

```bash
$GSETUP --revoke
```