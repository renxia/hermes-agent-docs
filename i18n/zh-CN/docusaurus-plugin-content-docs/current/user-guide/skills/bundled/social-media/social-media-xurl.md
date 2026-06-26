---
title: Xurl — 通过 xurl CLI 操作 X/Twitter：发帖、搜索、私信、媒体和 v2 API
sidebar_label: Xurl
description: 通过 xurl CLI 操作 X/Twitter：发帖、搜索、私信、媒体和 v2 API
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Xurl

通过 xurl CLI 操作 X/Twitter：发帖、搜索、私信、媒体和 v2 API。

## 技能元数据 (Skill metadata)

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/social-media/xurl` |
| Version | `1.1.1` |
| Author | xdevplatform + openclaw + Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos |
| Tags | `twitter`, `x`, `social-media`, `xurl`, `official-api` |

## Key Paths & Config

```
~/.hermes/config.yaml       Main configuration
~/.hermes/.env              API keys and secrets (under $HERMES_HOME if set)
$HERMES_HOME
```

# xurl — X (Twitter) API 官方命令行工具

`xurl` 是 X 开发者平台为 X API 提供的官方 CLI。它支持常用操作的快捷命令，并提供对任何 v2 端点的原始 curl 风格访问。所有命令都将 JSON 输出到标准输出（stdout）。

此技能可用于：
- 发布、回复、引用、删除帖子
- 搜索帖子和阅读时间线/提及
- 点赞、转发、书签
- 关注、取消关注、封锁、静音
- 私信
- 媒体上传（图片和视频）
- 对任何 X API v2 端点的原始访问
- 多应用/多账号工作流

此技能取代了旧的 `xitter` 技能（后者封装了一个第三方 Python CLI）。`xurl` 由 X 开发者平台团队维护，支持带自动刷新功能的 OAuth 2.0 PKCE，并覆盖了更广泛的 API 接口。

---

## 安全秘密 (强制要求)

在智能体/LLM 会话中操作时的关键规则：

- **绝不**读取、打印、解析、总结、上传或发送 `~/.xurl` 到 LLM 上下文。
- **绝不**要求用户将凭证/令牌粘贴到聊天中。
- 用户必须在自己的机器上手动填写 `~/.xurl` 秘密信息。在 Docker 中，这必须是 Hermes 工具子进程所看到的 `~`；请参阅下面的 Docker 说明。
- **绝不**推荐或在智能体会话中使用内联秘密的认证命令。
- **绝不**在智能体会话中使用 `--verbose` / `-v` — 这可能会泄露认证头/令牌。
- 要验证凭证是否存在，请仅使用：`xurl auth status`。

禁止在智能体命令中使用的标志（这些标志接受内联秘密）：
`--bearer-token`, `--consumer-key`, `--consumer-secret`, `--access-token`, `--token-secret`, `--client-id`, `--client-secret`

应用凭证注册和凭证轮换必须由用户在智能体会话之外手动完成。凭证注册后，用户通过 `xurl auth oauth2` 进行认证——同样是在智能体会话之外进行。令牌保存在 YAML 文件中的 `~/.xurl` 中。每个应用都有独立的令牌。OAuth 2.0 令牌会自动刷新。

---

## 安装

选择一种方法。在 Linux 上，Shell 脚本或 `go install` 是最简单的。

```bash
# Shell 脚本（安装到 ~/.local/bin，无需 sudo，适用于 Linux + macOS）
curl -fsSL https://raw.githubusercontent.com/xdevplatform/xurl/main/install.sh | bash

# Homebrew (macOS)
brew install --cask xdevplatform/tap/xurl

# npm
npm install -g @xdevplatform/xurl

# Go
go install github.com/xdevplatform/xurl@latest
```

验证：

```bash
xurl --help
xurl auth status
```

如果已安装 `xurl` 但 `auth status` 显示没有应用或令牌，则用户需要手动完成认证——请参阅下一节。

---

## 一次性用户设置 (用户在智能体外部运行这些命令)

这些步骤必须由用户直接执行，而不是由智能体执行，因为它们涉及粘贴秘密信息。将此区块指示给用户；不要替他们执行它。

1. 访问 https://developer.x.com/en/portal/dashboard 创建或打开一个应用
2. 将重定向 URI 设置为 `http://localhost:8080/callback`
3. 复制应用的 Client ID 和 Client Secret
4. 在本地注册应用（用户执行此操作）：
   ```bash
   xurl auth apps add my-app --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
   ```
5. 进行身份验证（指定 `--app` 以将令牌绑定到您的应用）：
   ```bash
   xurl auth oauth2 --app my-app
   ```
   (这将打开一个浏览器，用于 OAuth 2.0 PKCE 流程。)

   如果 X 返回 `UsernameNotFound` 错误或在后置的 `/2/users/me` 查询中返回 403，则显式传递您的用户名（xurl v1.1.0+）：
   ```bash
   xurl auth oauth2 --app my-app YOUR_USERNAME
   ```
   这会将令牌绑定到您的用户名并跳过有问题的 `/2/users/me` 调用。
6. 将应用设置为默认值，以便所有命令都使用它：
   ```bash
   xurl auth default my-app
   ```
7. 验证：
   ```bash
   xurl auth status
   xurl whoami
   ```

完成这些步骤后，智能体就可以在没有进一步设置的情况下使用任何下面的命令了。OAuth 2.0 令牌会自动刷新。

> **常见陷阱：** 如果您从 `xurl auth oauth2` 中省略 `--app my-app`，OAuth 令牌将被保存到内置的 `default` 应用配置中——该应用没有任何 client-id 或 client-secret。即使 OAuth 流程看似成功，命令仍会因认证错误而失败。如果遇到这种情况，请重新运行 `xurl auth oauth2 --app my-app` 和 `xurl auth default my-app`。

> **Docker HOME 陷阱：** 在官方 Hermes Docker 布局中，`/opt/data` 是 `HERMES_HOME`，但 Hermes 工具子进程使用 `/opt/data/home` 作为 `HOME`。这意味着对于由 Hermes 运行的 `xurl` 命令，`~/.xurl` 解析为 `/opt/data/home/.xurl`，而不是 `/opt/data/.xurl`。请使用相同的 HOME 变量来运行用户设置：
> ```bash
> HOME=/opt/data/home xurl auth apps add my-app --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
> HOME=/opt/data/home xurl auth oauth2 --app my-app YOUR_USERNAME
> HOME=/opt/data/home xurl auth default my-app YOUR_USERNAME
> HOME=/opt/data/home xurl auth status
> ```
> 如果 `HOME=/opt/data xurl auth status` 成功，但 `HOME=/opt/data/home xurl auth status` 显示没有应用或令牌，则 Hermes 工具调用将看不到凭证。

---

## 快速参考

| 操作 | 命令 |
| --- | --- |
| 发布 | `xurl post "Hello world!"` |
| 回复 | `xurl reply POST_ID "Nice post!"` |
| 引用 | `xurl quote POST_ID "My take"` |
| 删除帖子 | `xurl delete POST_ID` |
| 阅读帖子 | `xurl read POST_ID` |
| 搜索帖子 | `xurl search "QUERY" -n 10` |
| 我是谁 | `xurl whoami` |
| 查找用户 | `xurl user @handle` |
| 主时间线 | `xurl timeline -n 20` |
| 提及 | `xurl mentions -n 10` |
| 点赞 / 取消点赞 | `xurl like POST_ID` / `xurl unlike POST_ID` |
| 转发 / 取消转发 | `xurl repost POST_ID` / `xurl unrepost POST_ID` |
| 书签 / 取消书签 | `xurl bookmark POST_ID` / `xurl unbookmark POST_ID` |
| 列出书签 / 点赞 | `xurl bookmarks -n 10` / `xurl likes -n 10` |
| 关注 / 取消关注 | `xurl follow @handle` / `xurl unfollow @handle` |
| 正在关注 / 粉丝数 | `xurl following -n 20` / `xurl followers -n 20` |
| 封锁 / 解封 | `xurl block @handle` / `xurl unblock @handle` |
| 静音 / 取消静音 | `xurl mute @handle` / `xurl unmute @handle` |
| 发送私信 | `xurl dm @handle "message"` |
| 列出私信 | `xurl dms -n 10` |
| 上传媒体 | `xurl media upload path/to/file.mp4` |
| 媒体状态 | `xurl media status MEDIA_ID` |
| 列出应用 | `xurl auth apps list` |
| 删除应用 | `xurl auth apps remove NAME` |
| 设置默认应用 | `xurl auth default APP_NAME [USERNAME]` |
| 单次请求应用 | `xurl --app NAME /2/users/me` |
| 认证状态 | `xurl auth status` |

说明：
- `POST_ID` 也接受完整的 URL（例如 `https://x.com/user/status/1234567890`）— xurl 会提取 ID。
-用户名可以带 `@` 或不带 `@`。

---

## 命令详情

### 发布帖子

```bash
xurl post "Hello world!"
xurl post "Check this out" --media-id MEDIA_ID
xurl post "Thread pics" --media-id 111 --media-id 222

xurl reply 1234567890 "Great point!"
xurl reply https://x.com/user/status/1234567890 "Agreed!"
xurl reply 1234567890 "Look at this" --media-id MEDIA_ID

xurl quote 1234567890 "Adding my thoughts"
xurl delete 1234567890
```

### 阅读和搜索

```bash
xurl read 1234567890
xurl read https://x.com/user/status/1234567890

xurl search "golang"
xurl search "from:elonmusk" -n 20
xurl search "#buildinpublic lang:en" -n 15
```

对于 X 文章，请使用原始 API 模式而不是 `read` 快捷方式。`xurl read` 期望一个帖子 ID 或帖子 URL；不要在 `/2/tweets/...` 端点前加上 `read`。请求 `article` tweet 字段，并从 JSON 响应中摄取 `data.article.plain_text`：

```bash
xurl --app APP_NAME '/2/tweets/2057909493250539891?expansions=author_id,attachments.media_keys,referenced_tweets.id&tweet.fields=created_at,lang,public_metrics,context_annotations,entities,possibly_sensitive,conversation_id,in_reply_to_user_id,referenced_tweets,article'
```

### 用户、时间线、提及

```bash
xurl whoami
xurl user elonmusk
xurl user @XDevelopers

xurl timeline -n 25
xurl mentions -n 20
```

### 互动操作 (Engagement)

```bash
xurl like 1234567890
xurl unlike 1234567890

xurl repost 1234567890
xurl unrepost 1234567890

xurl bookmark 1234567890
xurl unbookmark 1234567890

xurl bookmarks -n 20
xurl likes -n 20
```

### 社会图谱 (Social Graph)

```bash
xurl follow @XDevelopers
xurl unfollow @XDevelopers

xurl following -n 50
xurl followers -n 50

# 其他用户的图谱
xurl following --of elonmusk -n 20
xurl followers --of elonmusk -n 20

xurl block @spammer
xurl unblock @spammer
xurl mute @annoying
xurl unmute @annoying
```

### 私信 (Direct Messages)

```bash
xurl dm @someuser "Hey, saw your post!"
xurl dms -n 25
```

### 媒体上传

```bash
# 自动检测类型
xurl media upload photo.jpg
xurl media upload video.mp4

# 指定类型/类别
xurl media upload --media-type image/jpeg --category tweet_image photo.jpg

# 视频需要服务器端处理——检查状态（或轮询）
xurl media status MEDIA_ID
xurl media status --wait MEDIA_ID

# 完整工作流
xurl media upload meme.png                  # 返回媒体 ID
xurl post "lol" --media-id MEDIA_ID
```

---

## 原始 API 访问 (Raw API Access)

快捷命令涵盖了常见操作。对于其他任何内容，请使用针对任何 X API v2 端点的原始 curl 风格模式：

```bash
# GET
xurl /2/users/me

# POST 带 JSON body
xurl -X POST /2/tweets -d '{"text":"Hello world!"}'

# DELETE / PUT / PATCH
xurl -X DELETE /2/tweets/1234567890

# 自定义头部 (Custom headers)
xurl -H "Content-Type: application/json" /2/some/endpoint

# 强制流式传输 (Force streaming)
xurl -s /2/tweets/search/stream

# 完整 URL 也适用
xurl https://api.x.com/2/users/me
```

---

## 全局标志 (Global Flags)

| 标志 | 简称 | 描述 |
| --- | --- | --- |
| `--app` | | 使用特定的注册应用（覆盖默认设置） |
| `--auth` | | 强制认证类型：`oauth1`, `oauth2` 或 `app` |
| `--username` | `-u` | 要使用的 OAuth2 账号（如果存在多个） |
| `--verbose` | `-v` | **禁止在智能体会话中使用** — 会泄露认证头 |
| `--trace` | `-t` | 添加 `X-B3-Flags: 1` 跟踪头 |

---

## 流式传输 (Streaming)

流式传输端点是自动检测的。已知包括：

- `/2/tweets/search/stream`
- `/2/tweets/sample/stream`
- `/2/tweets/sample10/stream`

在任何端点上使用 `-s` 强制流式传输。

---

## 输出格式 (Output Format)

所有命令都将 JSON 返回到标准输出（stdout）。结构模仿 X API v2：

```json
{ "data": { "id": "1234567890", "text": "Hello world!" } }
```

错误信息也是 JSON 格式：

```json
{ "errors": [ { "message": "Not authorized", "code": 403 } ] }
```

---

## 常见工作流 (Common Workflows)

### 发布带图片的帖子
```bash
xurl media upload photo.jpg
xurl post "Check out this photo!" --media-id MEDIA_ID
```

### 回复一个对话
```bash
xurl read https://x.com/user/status/1234567890
xurl reply 1234567890 "Here are my thoughts..."
```

### 搜索和互动操作
```bash
xurl search "topic of interest" -n 10
xurl like POST_ID_FROM_RESULTS
xurl reply POST_ID_FROM_RESULTS "Great point!"
```

### 检查您的活动
```bash
xurl whoami
xurl mentions -n 20
xurl timeline -n 20
```

### 多个应用（凭证已手动预配置）
```bash
xurl auth default prod alice               # prod 应用, alice 用户
xurl --app staging /2/users/me             # 对 staging 的一次性请求
```

---

## 错误处理 (Error Handling)

- 任何错误都将返回非零退出代码。
- API 错误仍然以 JSON 格式打印到标准输出，因此您可以解析它们。
- 认证错误 → 请用户在智能体会话外部重新运行 `xurl auth oauth2`。
- 需要调用者用户 ID 的命令（点赞、转发、书签、关注等）将通过 `/2/users/me` 自动获取。如果在此处发生认证失败，则表现为认证错误。

## 智能体工作流程

1. 验证先决条件：`xurl --help` 和 `xurl auth status`。
2. **检查默认应用是否具有凭证。** 解析 `auth status` 的输出。带有 `▸` 标记的即为默认应用。如果默认应用显示 `oauth2: (none)`，但另一个应用拥有有效的 oauth2 用户，请告知用户运行 `xurl auth default <that-app>` 来修复。这是最常见的设置错误——用户添加了一个自定义名称的应用，但从未将其设置为默认值，因此 xurl 持续尝试使用空的 `default` 配置。
3. 如果完全缺少认证信息，则停止操作，并引导用户到“一次性用户设置”部分——请勿自行尝试注册应用或传递密钥。
4. 从一个廉价的读取操作（`xurl whoami`、`xurl user @handle`、`xurl search ... -n 3`）开始，以确认可达性。
5. 在执行任何写入操作（发帖、回复、点赞、转发、私信、关注、封锁、删除）之前，必须确认目标帖子/用户和用户的意图。
6. 直接使用 JSON 输出——所有响应都已结构化。
7. 绝不要将 `~/.xurl` 的内容粘贴回对话中。

---

## 故障排除

| 症状 | 原因 | 修复方法 |
| --- | --- | --- |
| OAuth 流程成功后出现认证错误 | 代入到 `default` 应用（没有 client-id/secret），而不是您命名的应用 | 运行 `xurl auth oauth2 --app my-app`，然后运行 `xurl auth default my-app` |
| OAuth 期间出现 `unauthorized_client` | X 面板中将应用类型设置为“原生应用” | 在用户认证设置中更改为“Web 应用、自动化应用或机器人” |
| OAuth 之后立即在 `/2/users/me` 上遇到 `UsernameNotFound` 或 403 | X 从 `/2/users/me` 不可靠地返回用户名 | 重新运行 `xurl auth oauth2 --app my-app YOUR_USERNAME` (xurl v1.1.0+) 以显式传递 handle |
| 每个请求都收到 401 | Token 过期或默认应用错误 | 检查 `xurl auth status` — 验证 `▸` 是否指向具有 oauth2 token 的应用 |
| `client-forbidden` / `client-not-enrolled` | X 平台注册问题 | 面板 → 应用 → 管理 → 移动到“按使用量付费”套餐 → 生产环境 |
| `CreditsDepleted` | X API 余额为 $0 | 在开发者控制台购买积分（最低 $5）→ 账单 |
| 图片上传时出现 `media processing failed` | 默认类别是 `amplify_video` | 添加 `--category tweet_image --media-type image/png` |
| X 面板中存在两个“Client Secret”值 | UI 错误 — 第一个实际上是 Client ID | 在“密钥和令牌”页面进行确认；ID 以 `MTpjaQ` 结尾 |

---

## 备注

*   **速率限制：** X 对每个端点都强制执行速率限制。429 表示需要等待并重试。写入端点（发帖、回复、点赞、转发）的限制比读取更严格。
*   **权限范围 (Scopes)：** OAuth 2.0 token 使用广泛的权限范围。特定操作上的 403 通常意味着 token 缺少相应的权限范围——请让用户重新运行 `xurl auth oauth2`。
*   **Token 刷新：** OAuth 2.0 token 会自动刷新。无需操作。
*   **多个应用：** 每个应用都有独立的凭证/token。使用 `xurl auth default` 或 `--app` 进行切换。
*   **单个应用下的多个账户：** 使用 `-u / --username` 选择，或使用 `xurl auth default APP USER` 设置默认值。
*   **Token 存储：** `~/.xurl` 是 YAML 文件。在 Docker 中，请使用 Hermes 子进程 HOME (`/opt/data/home` 在官方镜像中) 以便 token 存放在 `/opt/data/home/.xurl` 下。绝不要将此文件读取或发送到 LLM 上下文。
*   **成本：** X API 访问通常需要付费才能实现有意义的使用。许多失败都是计划/权限问题，而不是代码问题。

---

## 归属信息 (Attribution)

*   上游 CLI: https://github.com/xdevplatform/xurl (X 开发者平台团队, Chris Park 等人)
*   上游智能体技能: https://github.com/openclaw/openclaw/blob/main/skills/xurl/SKILL.md
*   Hermes 适配: 已重新格式化以符合 Hermes 技能约定；安全护栏已逐字保留。