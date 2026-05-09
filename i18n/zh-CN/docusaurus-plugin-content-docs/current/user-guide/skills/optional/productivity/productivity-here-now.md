---
title: "Here.Now — 将静态网站发布到 {slug}"
sidebar_label: "Here.Now"
description: "将静态网站发布到 {slug}"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Here.Now

将静态网站发布到 &#123;slug&#125;.here.now，并将私有文件存储在云盘中，以便智能体之间进行交接。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/productivity/here-now` 安装 |
| 路径 | `optional-skills/productivity/here-now` |
| 版本 | `1.15.3` |
| 作者 | here.now |
| 许可证 | MIT |
| 平台 | macos, linux |
| 标签 | `here.now`, `herenow`, `publish`, `deploy`, `hosting`, `static-site`, `web`, `share`, `URL`, `drive`, `storage` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# here.now

here.now 允许智能体们发布网站并将私有文件存储在云盘中。

将 here.now 用于两项任务：

- **网站**：在 `{slug}.here.now` 发布网站和文件。
- **云盘**：在云文件夹中存储私有智能体文件。

## 当前文档

**在回答有关 here.now 功能、特性或工作流程的问题之前，请阅读当前文档：**

→ **https://here.now/docs**

请阅读文档：

- 在对话中首次涉及 here.now 的交互时
- 每当用户询问如何执行某项操作时
- 每当用户询问什么是可能的、受支持的或推荐的
- 在告知用户某个功能不受支持之前

需要查阅当前文档的主题（不要仅依赖本地技能文本）：

- 云盘和云盘共享
- 自定义域名
- 支付和支付门控
- 分叉
- 代理路由和服务变量
- 句柄和链接
- 限制和配额
- 单页应用（SPA）路由
- 错误处理和修复
- 功能可用性

**如果文档与实时 API 行为不一致，请以实时 API 行为为准。**

如果文档获取失败或超时，请继续使用本地技能和实时 API/脚本输出。对于正在进行的操作，优先采用实时 API 行为。

## 要求

- 必需的二进制文件：`curl`, `file`, `jq`
- 可选环境变量：`$HERENOW_API_KEY`
- 可选云盘令牌变量：`$HERENOW_DRIVE_TOKEN`
- 可选凭据文件：`~/.herenow/credentials`
- 技能辅助路径：
  - `${HERMES_SKILL_DIR}/scripts/publish.sh` 用于发布网站
  - `${HERMES_SKILL_DIR}/scripts/drive.sh` 用于私有云盘存储

## 创建一个网站

```bash
PUBLISH="${HERMES_SKILL_DIR}/scripts/publish.sh"
bash "$PUBLISH" {文件或目录} --client hermes
```

输出实时 URL（例如 `https://bright-canvas-a7k2.here.now/`）。

其底层是一个三步流程：创建/更新 -> 上传文件 -> 完成。在完成之前，网站不会上线。

如果没有 API 密钥，这将创建一个 **匿名网站**，有效期为 24 小时。
如果保存了 API 密钥，则网站是永久的。

**文件结构：** 对于 HTML 网站，请将 `index.html` 放在您要发布的目录的根目录下，而不是子目录中。目录的内容将成为网站的根目录。例如，发布 `my-site/`，其中存在 `my-site/index.html` — 不要发布包含 `my-site/` 的父文件夹。

您也可以发布没有任何 HTML 的原始文件。单个文件将获得一个丰富的自动查看器（图像、PDF、视频、音频）。多个文件将获得一个自动生成的目录列表，包含文件夹导航和图像库。

## 更新现有网站

```bash
PUBLISH="${HERMES_SKILL_DIR}/scripts/publish.sh"
bash "$PUBLISH" {文件或目录} --slug {slug} --client hermes
```

在更新匿名网站时，脚本会自动从 `.herenow/state.json` 加载 `claimToken`。传递 `--claim-token {token}` 以覆盖。

经过身份验证的更新需要保存的 API 密钥。

## 使用云盘

当用户希望为智能体文件提供私有云存储时，请使用云盘：文档、上下文、内存、计划、资产、媒体、研究、代码，以及任何其他不应作为网站发布但需要持久化的内容。

每个已登录的账户都有一个名为 `My Drive` 的默认云盘。

```bash
DRIVE="${HERMES_SKILL_DIR}/scripts/drive.sh"
bash "$DRIVE" default
bash "$DRIVE" ls "My Drive"
bash "$DRIVE" put "My Drive" notes/today.md --from ./notes/today.md
bash "$DRIVE" cat "My Drive" notes/today.md
bash "$DRIVE" share "My Drive" --perms write --prefix notes/ --ttl 7d
```

使用限定范围的云盘令牌进行智能体之间的交接。如果您收到一个 `herenow_drive` 共享块，请使用其 `token` 作为 `Authorization: Bearer <token>` 与 `api_base` 进行通信，如果存在 `pathPrefix`，请遵守它，并在写入时保留 ETag。`pathPrefix` 为 `null` 表示对整个云盘具有完全访问权限。如果该技能可用，请优先使用 `drive.sh`；否则直接调用列出的 API 操作。

## API 密钥存储

发布脚本从以下来源读取 API 密钥（第一个匹配项生效）：

1. `--api-key {key}` 标志（仅用于 CI/脚本 — 避免在交互式使用中使用）
2. `$HERENOW_API_KEY` 环境变量
3. `~/.herenow/credentials` 文件（建议智能体使用此方式）

要存储密钥，请将其写入凭据文件：

```bash
mkdir -p ~/.herenow && echo "{API_KEY}" > ~/.herenow/credentials && chmod 600 ~/.herenow/credentials
```

**重要提示**：收到 API 密钥后，请立即保存 — 自己运行上述命令。不要要求用户手动运行它。避免在交互式会话中通过 CLI 标志（例如 `--api-key`）传递密钥；凭据文件是首选的存储方法。

切勿将凭据或本地状态文件（`~/.herenow/credentials`、`.herenow/state.json`）提交到源代码控制。

## 获取 API 密钥

要从匿名（24 小时）网站升级为永久网站：

1. 向用户索取他们的电子邮件地址。
2. 请求一次性登录码：

```bash
curl -sS https://here.now/api/auth/agent/request-code \
  -H "content-type: application/json" \
  -d '{"email": "user@example.com"}'
```

3. 告诉用户：“请检查您的收件箱，查找来自 here.now 的登录码，并将其粘贴到这里。”
4. 验证代码并获取 API 密钥：

```bash
curl -sS https://here.now/api/auth/agent/verify-code \
  -H "content-type: application/json" \
  -d '{"email":"user@example.com","code":"ABCD-2345"}'
```

5. 自行保存返回的 `apiKey`（不要要求用户执行此操作）：

```bash
mkdir -p ~/.herenow && echo "{API_KEY}" > ~/.herenow/credentials && chmod 600 ~/.herenow/credentials
```

## 状态文件

每次创建或更新网站后，脚本都会在工作目录中写入 `.herenow/state.json`：

```json
{
  "publishes": {
    "bright-canvas-a7k2": {
      "siteUrl": "https://bright-canvas-a7k2.here.now/",
      "claimToken": "abc123",
      "claimUrl": "https://here.now/claim?slug=bright-canvas-a7k2&token=abc123",
      "expiresAt": "2026-02-18T01:00:00.000Z"
    }
  }
}
```

在创建或更新网站之前，您可以检查此文件以查找之前的 slug。
将 `.herenow/state.json` 视为仅内部缓存。
切勿将此本地文件路径作为 URL 呈现，也切勿将其用作身份验证模式、过期时间或声明 URL 的真实来源。

## 如何告知用户

对于已发布的网站：

- 始终分享当前脚本运行中的 `siteUrl`。
- 读取并遵循脚本 stderr 中的 `publish_result.*` 行，以确定身份验证模式。
- 当 `publish_result.auth_mode=authenticated` 时：告知用户该网站是**永久的**，并保存到他们的账户中。不需要声明 URL。
- 当 `publish_result.auth_mode=anonymous` 时：告知用户该网站**将在 24 小时后过期**。分享声明 URL（如果 `publish_result.claim_url` 非空且以 `https://` 开头），以便他们可以永久保留它。警告用户声明令牌只会返回一次，无法恢复。
- 切勿告知用户检查 `.herenow/state.json` 以获取声明 URL 或身份验证状态。

对于云盘：

- 不要将云盘文件描述为公共 URL。
- 告知用户云盘内容是私有的，除非使用限定范围的令牌共享。
- 当与其他智能体共享访问权限时，优先使用具有狭窄 `pathPrefix` 和短 TTL 的限定范围令牌。

## publish.sh 选项

| 标志                   | 描述                                  |
| ---------------------- | -------------------------------------------- |
| `--slug {slug}`        | 更新现有网站而不是创建新网站               |
| `--claim-token {token}`| 覆盖匿名更新的声明令牌                     |
| `--title {text}`       | 查看器标题（非 HTML 网站）                 |
| `--description {text}` | 查看器描述                                 |
| `--ttl {seconds}`      | 设置过期时间（仅限经过身份验证的用户）     |
| `--client {name}`      | 用于归因的智能体名称（例如 `hermes`）      |
| `--base-url {url}`     | API 基础 URL（默认：`https://here.now`）   |
| `--allow-nonherenow-base-url` | 允许向非默认的 `--base-url` 发送身份验证 |
| `--api-key {key}`      | API 密钥覆盖（优先使用凭据文件）           |
| `--spa`                | 启用 SPA 路由（为未知路径提供 index.html） |
| `--forkable`           | 允许其他人分叉此网站                       |

## 超越 publish.sh

对于云盘操作，请使用 `drive.sh` 或云盘 API。对于更广泛的账户和网站管理 — 删除、元数据、密码、支付、域名、句柄、链接、变量、代理路由、分叉、复制等 — 请参阅当前文档：

→ **https://here.now/docs**

完整文档：https://here.now/docs