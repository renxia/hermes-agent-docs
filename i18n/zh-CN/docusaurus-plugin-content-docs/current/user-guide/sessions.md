---
sidebar_position: 7
title: "会话"
description: "会话持久化、恢复、搜索、管理及按平台追踪会话"
---

# 会话

Hermes 智能体会自动将每次对话保存为一个会话。会话支持对话恢复、跨会话搜索以及完整的对话历史管理。

## 会话如何工作

每一次对话——无论是来自CLI、Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Teams还是任何其他消息平台——都作为一个包含完整消息历史记录的会话进行存储。会话在两个互补的系统中进行追踪：

1.  **SQLite数据库** (`~/.hermes/state.db`) — 结构化的会话元数据，支持FTS5全文搜索
2.  **JSONL转录文件** (`~/.hermes/sessions/`) — 原始对话转录记录，包括工具调用（网关）

SQLite数据库存储：
-   会话ID、来源平台、用户ID
-   **会话标题**（唯一、人类可读的名称）
-   模型名称和配置
-   系统提示词快照
-   完整的消息历史记录（角色、内容、工具调用、工具结果）
-   Token计数（输入/输出）
-   时间戳（started_at, ended_at）
-   父会话ID（用于压缩触发的会话拆分）

### 会话来源

每个会话都标注有其来源平台：

| 来源        | 描述                                |
|-------------|-------------------------------------|
| `cli`       | 交互式命令行 (`hermes` 或 `hermes chat`) |
| `telegram`  | Telegram即时通讯                    |
| `discord`   | Discord服务器/私信                   |
| `slack`     | Slack工作空间                       |
| `whatsapp`  | WhatsApp即时通讯                    |
| `signal`    | Signal即时通讯                      |
| `matrix`    | Matrix房间和私信                     |
| `mattermost`| Mattermost频道                      |
| `email`     | 电子邮件 (IMAP/SMTP)                |
| `sms`       | 通过Twilio发送的短信                 |
| `dingtalk`  | 钉钉                                |
| `feishu`    | 飞书                                |
| `wecom`     | 企业微信                             |
| `weixin`    | 微信（个人）                         |
| `bluebubbles`| 通过BlueBubbles macOS服务器实现的苹果iMessage |
| `qqbot`     | QQ机器人 (腾讯QQ) 通过官方API v2    |
| `homeassistant`| 家庭助理对话                      |
| `webhook`   | 传入的网络钩子                      |
| `api-server`| API服务器请求                       |
| `acp`       | ACP编辑器集成                        |
| `cron`      | 定时任务                             |
| `batch`     | 批处理运行                           |

## CLI 会话恢复

使用 `--continue` 或 `--resume` 从 CLI 恢复之前的对话：

### 继续上次会话

```bash
# 恢复最近一次 CLI 会话
hermes --continue
hermes -c

# 或者使用 chat 子命令
hermes chat --continue
hermes chat -c
```

此命令将从 SQLite 数据库中查找最近的 `cli` 会话，并加载其完整的对话历史。

### 按名称恢复

如果你为会话命名了（参见下方的[会话命名](#会话命名)部分），你可以按名称恢复它：

```bash
# 恢复一个命名会话
hermes -c "my project"

# 如果存在多个版本（my project, my project #2, my project #3），
# 这将自动恢复最新版本
hermes -c "my project"   # → 恢复 "my project #3"
```

### 恢复特定会话

```bash
# 按 ID 恢复特定会话
hermes --resume 20250305_091523_a1b2c3d4
hermes -r 20250305_091523_a1b2c3d4

# 按标题恢复
hermes --resume "refactoring auth"

# 或者使用 chat 子命令
hermes chat --resume 20250305_091523_a1b2c3d4
```

会话 ID 在你退出 CLI 会话时显示，也可以通过 `hermes sessions list` 命令找到。

### 恢复时的对话回顾

当你恢复一个会话时，Hermes 会在输入提示符之前，在一个样式化的面板中显示一个上次对话的紧凑回顾：

<img className="docs-terminal-figure" src="/img/docs/session-recap.svg" alt="当恢复一个 Hermes 会话时显示的“上一次对话”回顾面板的样式化预览。" />
<p className="docs-figure-caption">恢复模式会显示一个包含最近用户和助手轮次的紧凑回顾面板，然后将你带回实时提示符。</p>

回顾内容：
- 显示**用户消息**（金色 `●`）和**助手回复**（绿色 `◆`）
- **截断**长消息（用户消息 300 字符，助手消息 200 字符 / 3 行）
- **折叠**工具调用为一个计数和工具名称（例如 `[3 tool calls: terminal, web_search]`）
- **隐藏**系统消息、工具结果和内部推理过程
- **上限**为最近的 10 轮交互，并附有“... N earlier messages ...”指示器
- 使用**暗淡样式**以区分于活跃对话

要禁用回顾并保持单行显示行为，可在 `~/.hermes/config.yaml` 中设置：

```yaml
display:
  resume_display: minimal   # 默认: full
```

:::tip
会话 ID 的格式为 `YYYYMMDD_HHMMSS_<hex>` — CLI/TUI 会话使用 6 位十六进制后缀（例如 `20250305_091523_a1b2c3`），网关会话使用 8 位后缀（例如 `20250305_091523_a1b2c3d4`）。你可以通过 ID（完整或唯一前缀）或标题恢复 — 两者都适用于 `-c` 和 `-r`。
:::

## 跨平台交接

在 CLI 会话中使用 `/handoff <platform>` 将实时对话转移到一个消息平台的主频道。智能体将从 CLI 中断的地方继续——相同的会话 ID、完整的角色感知对话记录、工具调用等。

```bash
# 在 CLI 会话内
/handoff telegram
```

工作原理：

1.  CLI 验证 `<platform>` 已启用并已设置主频道（在目标聊天中运行一次 `/sethome` 进行配置）。
2.  CLI 将会话标记为挂起并**阻塞轮询网关**。如果智能体正在响应中，它会拒绝——请等待当前回复完成后再操作。
3.  网关监视器接管交接，并向目标适配器请求一个新的线程：
    - **Telegram** — 打开一个新的论坛话题（如果聊天中启用了 Bot API 9.4+ 话题模式，则为私信话题；或论坛超级群组话题）。
    - **Discord** — 在主文本频道下创建一个 1440 分钟自动归档的线程。
    - **Slack** — 发布一条种子消息，并使用其 `ts` 作为线程锚点。
    - **WhatsApp / Signal / Matrix / SMS** — 没有原生线程，直接回退到主频道。
4.  网关将目标键重新绑定到你现有的 CLI 会话 ID，然后伪造一个合成用户轮次，要求智能体确认并总结。回复将落在新线程中。
5.  当网关确认成功后，CLI 会打印一个 `/resume` 提示并干净地退出：
    ```
    ↻ 交接完成。该会话现在在 telegram 上处于活跃状态。
      以后在此 CLI 上恢复它，请使用：/resume my-session-title
    ```
6.  从那时起，对话便存在于该平台上。在新线程中回复——任何经该频道授权的用户共享同一会话，并且之后线程中的任何真实用户消息都会无缝加入，因为线程会话的键不包含 `user_id`。

**恢复回 CLI：** 当你想回到桌面时，只需运行 `/resume <title>`（或从 shell 运行 `hermes -r "<title>"`），然后从平台中断的地方继续。

**失败模式：**
- 未配置主频道 → CLI 拒绝并给出 `/sethome` 提示。
- 平台未启用 / 网关未运行 → CLI 在 60 秒后超时并显示清晰消息，你的 CLI 会话保持完整。
- 线程创建失败（权限、未开启话题模式）→ 直接回退到主频道并完成；没有线程隔离，但交接本身有效。
- `adapter.send` 失败（速率限制、临时 API 错误）→ 交接被标记为失败并附带原因；行会被清除以便你可以重试。

**值得了解的限制：** 对于不支持线程且使用多用户群组主频道的平台，合成轮次作为类似私信的会话进行处理。这对于自用私信主频道（典型设置）有效，但对于真正的共享群聊并非理想。线程功能覆盖了 Telegram / Discord / Slack — 这是迄今为止最常见的场景 — 因此大多数设置不会遇到此问题。

## 会话命名

为会话设置人类可读的标题，以便你轻松查找和恢复它们。

### 自动生成的标题

Hermes 会在第一次交互后为每个会话自动生成一个简短的描述性标题（3-7 个单词）。这在后台线程中使用快速辅助模型运行，因此不会增加延迟。当你使用 `hermes sessions list` 或 `hermes sessions browse` 浏览会话时，会看到自动生成的标题。

自动标题每个会话只触发一次，如果你已经手动设置了标题，则会跳过。

### 手动设置标题

在任何聊天会话（CLI 或网关）中使用 `/title` 斜杠命令：

```
/title my research project
```

标题会立即应用。如果该会话尚未在数据库中创建（例如，你在发送第一条消息之前运行了 `/title`），它会排队并在会话启动时应用。

你也可以从命令行重命名现有会话：

```bash
hermes sessions rename 20250305_091523_a1b2c3d4 "refactoring auth module"
```

### 标题规则

- **唯一性** — 两个会话不能共享相同的标题
- **最多 100 个字符** — 保持列表输出整洁
- **已净化** — 控制字符、零宽字符和 RTL 覆盖会被自动剥离
- **正常的 Unicode 可以** — 表情符号、中日韩字符、带重音的字符都有效

### 压缩时自动生成谱系

当一个会话的上下文被压缩（通过 `/compress` 手动或自动触发）时，Hermes 会创建一个新的延续会话。如果原始会话有标题，新会话会自动获得一个带编号的标题：

```
"my project" → "my project #2" → "my project #3"
```

当你按名称恢复（`hermes -c "my project"`）时，它会自动选择该谱系中最新的会话。

### 消息平台中的 /title

`/title` 命令适用于所有网关平台（Telegram、Discord、Slack、WhatsApp）：

- `/title My Research` — 设置会话标题
- `/title` — 显示当前标题

## 会话管理命令

Hermes 通过 `hermes sessions` 提供了一整套会话管理命令：

### 列出会话

```bash
# 列出最近的会话（默认：最近 20 个）
hermes sessions list

# 按平台筛选
hermes sessions list --source telegram

# 显示更多会话
hermes sessions list --limit 50
```

当会话有标题时，输出显示标题、预览和相对时间戳：

```
Title                  Preview                                  Last Active   ID
────────────────────────────────────────────────────────────────────────────────────────────────
refactoring auth       Help me refactor the auth module please   2h ago        20250305_091523_a
my project #3          Can you check the test failures?          yesterday     20250304_143022_e
—                      What's the weather in Las Vegas?          3d ago        20250303_101500_f
```

当没有会话有标题时，使用更简单的格式：

```
Preview                                            Last Active   Src    ID
──────────────────────────────────────────────────────────────────────────────────────
Help me refactor the auth module please             2h ago        cli    20250305_091523_a
What's the weather in Las Vegas?                    3d ago        tele   20250303_101500_f
```

### 导出会话

```bash
# 将所有会话导出到 JSONL 文件
hermes sessions export backup.jsonl

# 导出特定平台的会话
hermes sessions export telegram-history.jsonl --source telegram

# 导出单个会话
hermes sessions export session.jsonl --session-id 20250305_091523_a1b2c3d4
```

导出的文件每行包含一个 JSON 对象，包含完整的会话元数据和所有消息。

### 删除会话

```bash
# 删除特定会话（带确认）
hermes sessions delete 20250305_091523_a1b2c3d4

# 删除而不确认
hermes sessions delete 20250305_091523_a1b2c3d4 --yes
```

### 重命名会话

```bash
# 设置或更改会话的标题
hermes sessions rename 20250305_091523_a1b2c3d4 "debugging auth flow"

# CLI 中的多词标题不需要引号
hermes sessions rename 20250305_091523_a1b2c3d4 debugging auth flow
```

如果该标题已被另一个会话使用，将显示错误。

### 清理旧会话

```bash
# 删除超过 90 天的已结束会话（默认）
hermes sessions prune

# 自定义时间阈值
hermes sessions prune --older-than 30

# 仅清理特定平台的会话
hermes sessions prune --source telegram --older-than 60

# 跳过确认
hermes sessions prune --older-than 30 --yes
```

:::info
清理只删除**已结束**的会话（已明确结束或自动重置的会话）。活跃会话永远不会被清理。
:::

### 会话统计

```bash
hermes sessions stats
```

输出：

```
Total sessions: 142
Total messages: 3847
  cli: 89 sessions
  telegram: 38 sessions
  discord: 15 sessions
Database size: 12.4 MB
```

要获取更深入的分析——令牌使用量、成本估算、工具分类和活动模式——请使用 [`hermes insights`](/docs/reference/cli-commands#hermes-insights)。

## 会话搜索工具

智能体内置了 `session_search` 工具，它使用 SQLite 的 FTS5 引擎在所有过往对话中执行全文搜索。

### 工作原理

1.  FTS5 按相关性搜索匹配的消息
2.  按会话分组，取前 N 个唯一会话（默认为 3）
3.  加载每个会话的对话内容，以匹配内容为中心截取约 100K 字符
4.  发送给快速总结模型进行聚焦摘要
5.  返回带有元数据和上下文的每个会话摘要

### FTS5 查询语法

搜索支持标准的 FTS5 查询语法：

-   简单关键词：`docker deployment`
-   短语：`"exact phrase"`
-   布尔逻辑：`docker OR kubernetes`，`python NOT java`
-   前缀匹配：`deploy*`

### 使用时机

智能体会自动被提示使用会话搜索：

> *"当用户引用了过往对话中的内容，或者您怀疑存在相关的先前上下文时，请使用 session_search 来回忆它，然后再要求用户重复。"*

## 跨平台会话跟踪

### 网关会话

在消息平台上，会话通过一个由消息来源构建的确定性会话键来标识：

| 聊天类型         | 默认键格式                                                                 | 行为                                                                                                   |
|------------------|----------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Telegram 私聊    | `agent:main:telegram:dm:<chat_id>`                                         | 每个私聊一个会话                                                                                       |
| Discord 私聊     | `agent:main:discord:dm:<chat_id>`                                          | 每个私聊一个会话                                                                                       |
| WhatsApp 私聊    | `agent:main:whatsapp:dm:<canonical_identifier>`                            | 每个私聊用户一个会话（当存在映射时，LID/电话别名会合并为一个身份）                                       |
| 群组聊天         | `agent:main:<platform>:group:<chat_id>:<user_id>`                          | 当平台暴露用户 ID 时，群组内每个用户一个会话                                                            |
| 群组线程/话题    | `agent:main:<platform>:group:<chat_id>:<thread_id>`                        | 默认为所有线程参与者共享一个会话。当 `thread_sessions_per_user: true` 时，每个用户一个会话。              |
| 频道             | `agent:main:<platform>:channel:<chat_id>:<user_id>`                        | 当平台暴露用户 ID 时，频道内每个用户一个会话                                                            |

当 Hermes 无法为共享聊天获取参与者标识符时，它会回退到为该房间使用一个共享会话。

### 共享与隔离的群组会话

默认情况下，Hermes 在 `config.yaml` 中使用 `group_sessions_per_user: true`。这意味着：

-   Alice 和 Bob 可以在同一个 Discord 频道中与 Hermes 对话，而不会共享对话历史
-   一个用户的长时间、工具密集型任务不会污染另一个用户的上下文窗口
-   由于正在运行的智能体键与隔离的会话键匹配，中断处理也保持为每个用户独立

如果您想要一个共享的“房间大脑”，请设置：

```yaml
group_sessions_per_user: false
```

这会将群组/频道回退到每个房间一个共享会话，这保留了共享的对话上下文，但也会共享代币成本、中断状态和上下文增长。

### 会话重置策略

网关会话会根据可配置的策略自动重置：

-   **idle** — 在 N 分钟不活动后重置
-   **daily** — 在每天特定时间重置
-   **both** — 在先触发者（不活动或每日）时重置
-   **none** — 从不自动重置

在会话被自动重置之前，智能体会获得一个回合来保存对话中的任何重要记忆或技能。

具有**活跃后台进程**的会话，无论策略如何，都永远不会自动重置。

## 存储位置

| 内容         | 路径                          | 描述                                 |
|--------------|-------------------------------|--------------------------------------|
| SQLite 数据库 | `~/.hermes/state.db`          | 所有会话元数据 + 带 FTS5 的消息       |
| 网关对话记录 | `~/.hermes/sessions/`         | 每个会话的 JSONL 对话记录 + sessions.json 索引 |
| 网关索引     | `~/.hermes/sessions/sessions.json` | 将会话键映射到活跃的会话 ID            |

SQLite 数据库使用 WAL 模式以实现并发读取和单一写入，这非常适合网关的多平台架构。

### 数据库模式

`state.db` 中的关键表：

-   **sessions** — 会话元数据（id, source, user_id, model, title, timestamps, token counts）。标题有唯一索引（允许 NULL 标题，仅非 NULL 必须唯一）。
-   **messages** — 完整的消息历史（role, content, tool_calls, tool_name, token_count）
-   **messages_fts** — 用于跨消息内容全文搜索的 FTS5 虚拟表

## 会话过期与清理

### 自动清理

-   网关会话根据配置的重置策略自动重置
-   在重置之前，智能体会保存即将过期会话中的记忆和技能
-   可选自动清理：当 `sessions.auto_prune` 为 `true` 时，已结束的会话若超过 `sessions.retention_days`（默认 90 天），会在 CLI/网关启动时被清理
-   在实际删除了行的清理之后，会执行 `VACUUM` 操作 `state.db` 以回收磁盘空间（普通的 DELETE 操作不会缩小 SQLite 文件）
-   清理最多每 `sessions.min_interval_hours`（默认 24 小时）运行一次；上次运行的时间戳记录在 `state.db` 本身中，因此在同一个 `HERMES_HOME` 下的所有 Hermes 进程间共享

默认为 **关闭** — 会话历史对于 `session_search` 回忆很有价值，静默删除可能会让用户感到意外。在 `~/.hermes/config.yaml` 中启用：

```yaml
sessions:
  auto_prune: true          # 启用 — 默认为 false
  retention_days: 90        # 保留已结束的会话这么多天
  vacuum_after_prune: true  # 在一次清理扫描后回收磁盘空间
  min_interval_hours: 24    # 不要更频繁地重新运行此扫描
```

活跃的会话永远不会被自动清理，无论其存在多久。

### 手动清理

```bash
# 清理早于 90 天的会话
hermes sessions prune

# 删除特定会话
hermes sessions delete <session_id>

# 清理前导出（备份）
hermes sessions export backup.jsonl
hermes sessions prune --older-than 30 --yes
```

:::tip
数据库增长缓慢（典型情况：数百个会话占用 10-15 MB），并且会话历史支持跨过往对话的 `session_search` 回忆，因此自动清理默认是禁用的。如果您正在运行繁重的网关/计划任务工作负载，其中 `state.db` 已显著影响性能（观察到的故障模式：拥有约 1000 个会话的 384 MB state.db 减慢了 FTS5 插入和 `/resume` 列表速度），请启用它。使用 `hermes sessions prune` 进行一次性清理，无需启用自动扫描。
:::