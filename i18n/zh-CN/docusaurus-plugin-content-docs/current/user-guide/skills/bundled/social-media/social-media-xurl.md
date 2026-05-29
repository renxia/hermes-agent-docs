---
title: "Xurl — 通过 xurl CLI 访问 X/Twitter：发帖、搜索、私信、媒体、v2 API"
sidebar_label: "Xurl"
description: "通过 xurl CLI 访问 X/Twitter：发帖、搜索、私信、媒体、v2 API"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Xurl

通过 xurl CLI 访问 X/Twitter：发帖、搜索、私信、媒体、v2 API。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/social-media/xurl` |
| 版本 | `1.1.1` |
| 作者 | xdevplatform + openclaw + Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos |
| 标签 | `twitter`, `x`, `social-media`, `xurl`, `official-api` |

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# xurl — X (Twitter) API 官方 CLI

`xurl` 是 X 开发者平台的官方 CLI 工具，用于访问 X API。它支持常见操作的快捷命令，并支持通过原始 curl 风格访问任何 v2 端点。所有命令都会将 JSON 输出到标准输出。

此技能用于：
- 发布、回复、引用、删除帖子
- 搜索帖子和查看时间线/提及
- 点赞、转发、书签
- 关注、取关、屏蔽、静音
- 私信
- 媒体上传（图片和视频）
- 原始访问任何 X API v2 端点
- 多应用 / 多账户工作流

此技能取代了旧的 `xitter` 技能（它封装了一个第三方 Python CLI）。`xurl` 由 X 开发者平台团队维护，支持带自动刷新的 OAuth 2.0 PKCE，并覆盖了更大的 API 表面。

---

## 密钥安全（强制）

在智能体/LLM 会话内操作时的关键规则：

- **永远不要**读取、打印、解析、总结、上传或发送 `~/.xurl` 到 LLM 上下文。
- **永远不要**要求用户在聊天中粘贴凭证/令牌。
- 用户必须在自己的机器上手动填写 `~/.xurl` 的密钥。在 Docker 中，这必须是 Hermes 工具子进程看到的 `~`；请参阅下方的 Docker 说明。
- **永远不要**在智能体会话中推荐或执行带有内联密钥的认证命令。
- **永远不要**在智能体会话中使用 `--verbose` / `-v` — 它可能暴露认证头/令牌。
- 要验证凭证是否存在，只使用：`xurl auth status`。

智能体命令中被禁止的标志（它们接受内联密钥）：
`--bearer-token`, `--consumer-key`, `--consumer-secret`, `--access-token`, `--token-secret`, `--client-id`, `--client-secret`

应用凭证注册和凭证轮换必须由用户在智能体会话外手动完成。注册凭证后，用户在智能体会话外通过 `xurl auth oauth2` 进行认证。令牌以 YAML 格式持久化到 `~/.xurl`。每个应用都有隔离的令牌。OAuth 2.0 令牌会自动刷新。

---

## 安装

选择一种方法。在 Linux 上，shell 脚本或 `go install` 最简单。

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

如果 `xurl` 已安装但 `auth status` 显示没有应用或令牌，用户需要手动完成认证 — 请参阅下一节。

---

## 一次性用户设置（用户在智能体外运行这些步骤）

这些步骤必须由用户直接执行，**不能**由智能体执行，因为它们涉及粘贴密钥。引导用户查看此块；不要为他们执行。

1. 在 https://developer.x.com/en/portal/dashboard 创建或打开一个应用。
2. 将重定向 URI 设置为 `http://localhost:8080/callback`。
3. 复制应用的 Client ID 和 Client Secret。
4. 在本地注册应用（用户运行此命令）：
   ```bash
   xurl auth apps add my-app --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
   ```
5. 进行认证（指定 `--app` 将令牌绑定到你的应用）：
   ```bash
   xurl auth oauth2 --app my-app
   ```
   （这将打开一个浏览器，进行 OAuth 2.0 PKCE 流程。）

   如果 X 返回 `UsernameNotFound` 错误或在 OAuth 后的 `/2/users/me` 查询中返回 403，请显式传递你的用户名（xurl v1.1.0+）：
   ```bash
   xurl auth oauth2 --app my-app YOUR_USERNAME
   ```
   这会将令牌绑定到你的用户名，并跳过有问题的 `/2/users/me` 调用。
6. 将应用设置为默认，以便所有命令都使用它：
   ```bash
   xurl auth default my-app
   ```
7. 验证：
   ```bash
   xurl auth status
   xurl whoami
   ```

完成此操作后，智能体可以使用下面的任何命令，无需进一步设置。OAuth 2.0 令牌会自动刷新。

> **常见陷阱：** 如果你从 `xurl auth oauth2` 中省略了 `--app my-app`，OAuth 令牌将被保存到内置的 `default` 应用配置文件中 — 该配置文件没有 client-id 或 client-secret。命令将因认证错误而失败，即使 OAuth 流程看起来成功了。如果你遇到此问题，请重新运行 `xurl auth oauth2 --app my-app` 和 `xurl auth default my-app`。

> **Docker HOME 陷阱：** 在官方 Hermes Docker 布局中，`/opt/data` 是 `HERMES_HOME`，但 Hermes 工具子进程使用 `/opt/data/home` 作为 `HOME`。这意味着对于 Hermes 运行的 `xurl` 命令，`~/.xurl` 解析为 `/opt/data/home/.xurl`，而不是 `/opt/data/.xurl`。使用相同的 HOME 运行用户设置：
> ```bash
> HOME=/opt/data/home xurl auth apps add my-app --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
> HOME=/opt/data/home xurl auth oauth2 --app my-app YOUR_USERNAME
> HOME=/opt/data/home xurl auth default my-app YOUR_USERNAME
> HOME=/opt/data/home xurl auth status
> ```
> 如果 `HOME=/opt/data xurl auth status` 成功但 `HOME=/opt/data/home xurl auth status` 显示没有应用或令牌，那么 Hermes 工具调用将看不到凭证。

---

## 快速参考

| 操作 | 命令 |
| --- | --- |
| 发帖 | `xurl post "Hello world!"` |
| 回复 | `xurl reply POST_ID "Nice post!"` |
| 引用 | `xurl quote POST_ID "My take"` |
| 删除帖子 | `xurl delete POST_ID` |
| 读取帖子 | `xurl read POST_ID` |
| 搜索帖子 | `xurl search "QUERY" -n 10` |
| 我是谁 | `xurl whoami` |
| 查找用户 | `xurl user @handle` |
| 主页时间线 | `xurl timeline -n 20` |
| 提及 | `xurl mentions -n 10` |
| 点赞 / 取消点赞 | `xurl like POST_ID` / `xurl unlike POST_ID` |
| 转发 / 撤销转发 | `xurl repost POST_ID` / `xurl unrepost POST_ID` |
| 添加书签 / 移除 | `xurl bookmark POST_ID` / `xurl unbookmark POST_ID` |
| 列出书签 / 点赞 | `xurl bookmarks -n 10` / `xurl likes -n 10` |
| 关注 / 取消关注 | `xurl follow @handle` / `xurl unfollow @handle` |
| 关注中 / 粉丝 | `xurl following -n 20` / `xurl followers -n 20` |
| 屏蔽 / 取消屏蔽 | `xurl block @handle` / `xurl unblock @handle` |
| 静音 / 取消静音 | `xurl mute @handle` / `xurl unmute @handle` |
| 发送私信 | `xurl dm @handle "message"` |
| 列出私信 | `xurl dms -n 10` |
| 上传媒体 | `xurl media upload path/to/file.mp4` |
| 媒体状态 | `xurl media status MEDIA_ID` |
| 列出应用 | `xurl auth apps list` |
| 移除应用 | `xurl auth apps remove NAME` |
| 设置默认应用 | `xurl auth default APP_NAME [USERNAME]` |
| 按请求指定应用 | `xurl --app NAME /2/users/me` |
| 认证状态 | `xurl auth status` |

注意：
- `POST_ID` 也接受完整 URL（例如 `https://x.com/user/status/1234567890`）— xurl 会提取 ID。
- 用户名可以带或不带前导 `@`。

---

## 命令详情

### 发帖

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

### 读取与搜索

```bash
xurl read 1234567890
xurl read https://x.com/user/status/1234567890

xurl search "golang"
xurl search "from:elonmusk" -n 20
xurl search "#buildinpublic lang:en" -n 15
```

### 用户、时间线、提及

```bash
xurl whoami
xurl user elonmusk
xurl user @XDevelopers

xurl timeline -n 25
xurl mentions -n 20
```

### 互动

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

### 社交图谱

```bash
xurl follow @XDevelopers
xurl unfollow @XDevelopers

xurl following -n 50
xurl followers -n 50

# 另一个用户的图谱
xurl following --of elonmusk -n 20
xurl followers --of elonmusk -n 20

xurl block @spammer
xurl unblock @spammer
xurl mute @annoying
xurl unmute @annoying
```

### 私信

```bash
xurl dm @someuser "Hey, saw your post!"
xurl dms -n 25
```

### 媒体上传

```bash
# 自动检测类型
xurl media upload photo.jpg
xurl media upload video.mp4

# 显式类型/类别
xurl media upload --media-type image/jpeg --category tweet_image photo.jpg

# 视频需要服务器端处理 — 检查状态（或轮询）
xurl media status MEDIA_ID
xurl media status --wait MEDIA_ID

# 完整工作流
xurl media upload meme.png                  # 返回媒体 ID
xurl post "lol" --media-id MEDIA_ID
```

---

## 原始 API 访问

快捷命令涵盖了常见操作。对于其他任何操作，可以使用原始 curl 风格模式访问任何 X API v2 端点：

```bash
# GET
xurl /2/users/me

# 带 JSON 主体的 POST
xurl -X POST /2/tweets -d '{"text":"Hello world!"}'

# DELETE / PUT / PATCH
xurl -X DELETE /2/tweets/1234567890

# 自定义头
xurl -H "Content-Type: application/json" /2/some/endpoint

# 强制流式传输
xurl -s /2/tweets/search/stream

# 完整 URL 也可以
xurl https://api.x.com/2/users/me
```

---

## 全局标志

| 标志 | 简写 | 描述 |
| --- | --- | --- |
| `--app` | | 使用特定的已注册应用（覆盖默认设置） |
| `--auth` | | 强制认证类型：`oauth1`、`oauth2` 或 `app` |
| `--username` | `-u` | 使用哪个 OAuth2 账户（如果存在多个） |
| `--verbose` | `-v` | **在智能体会话中被禁止** — 会泄露认证头 |
| `--trace` | `-t` | 添加 `X-B3-Flags: 1` 跟踪头 |

---

## 流式传输

流式传输端点将自动检测。已知端点包括：

- `/2/tweets/search/stream`
- `/2/tweets/sample/stream`
- `/2/tweets/sample10/stream`

使用 `-s` 选项可强制对任何端点启用流式传输。

---

## 输出格式

所有命令均将 JSON 输出到 stdout。其结构镜像 X API v2：

```json
{ "data": { "id": "1234567890", "text": "Hello world!" } }
```

错误信息也是 JSON 格式：

```json
{ "errors": [ { "message": "Not authorized", "code": 403 } ] }
```

---

## 常见工作流

### 发布带图片的推文
```bash
xurl media upload photo.jpg
xurl post "看看这张照片！" --media-id MEDIA_ID
```

### 回复对话
```bash
xurl read https://x.com/user/status/1234567890
xurl reply 1234567890 "这是我的想法..."
```

### 搜索与互动
```bash
xurl search "感兴趣的话题" -n 10
xurl like 帖子ID
xurl reply 帖子ID "说得真好！"
```

### 检查活动
```bash
xurl whoami
xurl mentions -n 20
xurl timeline -n 20
```

### 多个应用（凭据需预先手动配置）
```bash
xurl auth default prod alice               # 生产应用，alice 用户
xurl --app staging /2/users/me             # 针对测试环境的一次性操作
```

---

## 错误处理

- 任何错误均返回非零退出码。
- API 错误仍以 JSON 格式打印到 stdout，因此您可以解析它们。
- 认证错误 → 请用户在智能体对话之外重新运行 `xurl auth oauth2`。
- 需要调用者用户 ID 的命令（点赞、转发、收藏、关注等）将通过 `/2/users/me` 自动获取。此处的认证失败会呈现为认证错误。

---

## 智能体工作流

1.  验证前提条件：`xurl --help` 和 `xurl auth status`。
2.  **检查默认应用是否拥有凭据。** 解析 `auth status` 的输出。默认应用以 `▸` 标记。如果默认应用显示 `oauth2: (none)` 但另一个应用拥有有效的 oauth2 用户，请告知用户运行 `xurl auth default <该应用名>` 来修复。这是最常见的配置错误——用户添加了一个自定义名称的应用，但从未将其设为默认，因此 xurl 一直尝试使用空的 `default` 配置文件。
3.  如果认证完全缺失，请停止并引导用户参阅“一次性用户设置”部分——不要尝试自行注册应用或传递密钥。
4.  从低成本的读取操作开始（`xurl whoami`、`xurl user @handle`、`xurl search ... -n 3`）以确认可达性。
5.  在执行任何写入操作（发布、回复、点赞、转发、私信、关注、屏蔽、删除）之前，确认目标帖子/用户以及用户的意图。
6.  直接使用 JSON 输出——每个响应已经是结构化的。
7.  切勿将 `~/.xurl` 的内容粘贴回对话中。

---

## 故障排除

| 症状 | 原因 | 解决方法 |
| --- | --- | --- |
| OAuth 流程成功后出现认证错误 | 令牌保存到了 `default` 应用（无 client-id/secret）而非您命名的应用 | `xurl auth oauth2 --app my-app` 然后 `xurl auth default my-app` |
| OAuth 期间出现 `unauthorized_client` | 在 X 仪表板中将应用类型设为“原生应用” | 在用户认证设置中更改为“Web 应用、自动化应用或机器人” |
| OAuth 后立即在 `/2/users/me` 上出现 `UsernameNotFound` 或 403 | X 无法从 `/2/users/me` 稳定返回用户名 | 重新运行 `xurl auth oauth2 --app my-app YOUR_USERNAME` (xurl v1.1.0+) 以显式传递句柄 |
| 每个请求都返回 401 | 令牌已过期或默认应用设置错误 | 检查 `xurl auth status` — 确认 `▸` 指向拥有 oauth2 令牌的应用 |
| `client-forbidden` / `client-not-enrolled` | X 平台注册问题 | 仪表板 → 应用 → 管理 → 移至“按使用付费”套餐 → 生产环境 |
| `CreditsDepleted` | X API 余额为 $0 | 在开发者控制台 → 计费中购买额度（最低 $5） |
| 图片上传时出现 `media processing failed` | 默认类别为 `amplify_video` | 添加 `--category tweet_image --media-type image/png` |
| X 仪表板中有两个“客户端密钥”值 | UI 错误——第一个实际上是客户端 ID | 在“密钥和令牌”页面确认；ID 以 `MTpjaQ` 结尾 |

---

## 备注

-   **速率限制：** X 对每个端点强制执行速率限制。429 错误意味着需要等待并重试。写入端点（发布、回复、点赞、转发）的限制比读取端点更严格。
-   **权限范围：** OAuth 2.0 令牌使用广泛的权限范围。特定操作上的 403 错误通常意味着令牌缺少某个权限范围——请用户重新运行 `xurl auth oauth2`。
-   **令牌刷新：** OAuth 2.0 令牌会自动刷新。无需操作。
-   **多个应用：** 每个应用都有独立的凭据/令牌。使用 `xurl auth default` 或 `--app` 切换。
-   **每个应用多个账户：** 使用 `-u / --username` 选择，或使用 `xurl auth default APP USER` 设置默认值。
-   **令牌存储：** `~/.xurl` 是 YAML 文件。在 Docker 中，请使用 Hermes 子进程的 HOME 目录（官方镜像中为 `/opt/data/home`），以便令牌存储在 `/opt/data/home/.xurl` 下。切勿读取或发送此文件至 LLM 上下文。
-   **成本：** X API 访问通常在有实质性使用需求时需要付费。许多故障都是套餐/权限问题，而非代码问题。

---

## 归属

-   上游 CLI：https://github.com/xdevplatform/xurl （X 开发者平台团队，Chris Park 等）
-   上游智能体技能：https://github.com/openclaw/openclaw/blob/main/skills/xurl/SKILL.md
-   Hermes 适配版：为符合 Hermes 技能规范重新格式化；安全防护条款原样保留。