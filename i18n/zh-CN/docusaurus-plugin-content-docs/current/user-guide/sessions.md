---
sidebar_position: 7
title: "会话"
description: "会话持久化、恢复、搜索、管理及跨平台会话追踪"
---

# 会话

Hermes 智能体会自动将每次对话保存为一个会话。会话功能支持对话恢复、跨会话搜索以及完整的对话历史管理。

## 会话工作原理

每一次对话——无论来自命令行界面、Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Teams 或其他任何消息平台——都会作为一个包含完整消息历史的会话被存储。会话在以下位置进行跟踪：

1. **SQLite 数据库** (`~/.hermes/state.db`) —— 结构化的会话元数据，支持 FTS5 全文搜索，以及完整的聊天历史记录

SQLite 数据库存储：
- 会话 ID、来源平台、用户 ID
- **会话标题**（唯一的、人类可读的名称）
- 模型名称与配置
- 系统提示词快照
- 完整的消息历史（角色、内容、工具调用、工具结果）
- 令牌计数（输入/输出）
- 时间戳（开始时间、结束时间）
- 父会话 ID（用于压缩触发的会话拆分）

### 什么会计入上下文

Hermes 存储会话历史以便能够恢复对话，但它不会不断地重新发送它处理过的每一个字节。在每一轮对话中，模型会看到选定的系统提示词、当前的对话窗口以及 Hermes 为该轮明确注入的任何内容。

媒体附件作为轮次范围内的输入处理：

- 图片可以原生附加到下一次模型调用中，或者在当前模型不支持原生视觉功能时，预先分析为文本描述。
- 当配置了语音转文字功能时，音频会被转录为文本。
- 文本文档可以包含其提取的文本；其他文档类型通常以保存的本地路径和简短注释的形式表示。
- 附件路径和提取/派生的文本可以出现在对话记录中，但原始的图片、音频或二进制文件字节不会被反复复制到未来的提示词中。

例如，如果用户发送一张图片并要求 Hermes 用它制作一个表情包，Hermes 可能会使用视觉功能检查该图片一次，并运行一个图像处理脚本。后续的对话轮次不会自动在上下文中携带原始 JPEG 文件。它们只携带写入对话记录中的内容，例如用户的请求、简短的图片描述、本地缓存路径或最终的助手回复。

导致上下文增长的最常见原因不是媒体文件本身，而是冗长的文本：粘贴的转录内容、完整的日志、大型工具输出、长差异报告、重复的状态更新以及详细的证据记录。请优先使用摘要、文件路径、聚焦的摘录和基于工具的查询，而不是将大型文件复制到聊天中。

:::tip
当会话变长时使用 `/compress` 命令，需要新对话线程时使用 `/new`，而 `hermes sessions prune` 命令仅在你想从存储中删除已结束的旧会话时使用。压缩会减少活动上下文；它不是隐私删除。
为 `/new` 命令传递一个名称（例如 `/new payments-refactor`）可以预先设置新会话的初始标题——这对于之后使用 `/resume <name>` 或在 `/sessions` 选择器中查找它很有用。
:::

### 会话来源

每个会话都标记有其来源平台：

| 来源 | 描述 |
|------|------|
| `cli` | 交互式命令行界面 (`hermes` 或 `hermes chat`) |
| `telegram` | Telegram 消息应用 |
| `discord` | Discord 服务器/私信 |
| `slack` | Slack 工作空间 |
| `whatsapp` | WhatsApp 消息应用 |
| `signal` | Signal 消息应用 |
| `matrix` | Matrix 聊天室和私信 |
| `mattermost` | Mattermost 频道 |
| `email` | 电子邮件 (IMAP/SMTP) |
| `sms` | 通过 Twilio 发送短信 |
| `dingtalk` | 钉钉 |
| `feishu` | 飞书 |
| `wecom` | 企业微信 |
| `weixin` | 微信 |
| `bluebubbles` | 通过 BlueBubbles macOS 服务器实现的 Apple iMessage |
| `qqbot` | QQ 机器人（腾讯QQ）通过官方 API v2 |
| `homeassistant` | Home Assistant 对话 |
| `webhook` | 入站 Webhook |
| `api-server` | API 服务器请求 |
| `acp` | ACP 编辑器集成 |
| `cron` | 计划任务 |
| `batch` | 批处理运行 |

## CLI 会话恢复

通过 `--continue` 或 `--resume` 从CLI恢复先前的对话：

### 继续上一个会话

```bash
# 恢复最近的CLI会话
hermes --continue
hermes -c

# 或使用chat子命令
hermes chat --continue
hermes chat -c
```

此命令从SQLite数据库中查找最近的 `cli` 会话并加载其完整对话历史。

### 按名称恢复

如果您已为会话命名（参见下方的[会话命名](#会话命名)部分），可以通过名称恢复：

```bash
# 按名称恢复会话
hermes -c "my project"

# 如果存在同一会话的变体（my project, my project #2, my project #3），
# 此命令将自动恢复最近的一个
hermes -c "my project"   # → 恢复 "my project #3"
```

### 恢复特定会话

```bash
# 按ID恢复特定会话
hermes --resume 20250305_091523_a1b2c3d4
hermes -r 20250305_091523_a1b2c3d4

# 按标题恢复
hermes --resume "refactoring auth"

# 或使用chat子命令
hermes chat --resume 20250305_091523_a1b2c3d4
```

会话ID会在您退出CLI会话时显示，也可以通过 `hermes sessions list` 命令找到。

### 恢复时的对话回顾

当您恢复会话时，Hermes会在输入提示符之前，在一个样式化面板中显示上次对话的简明回顾：

<img className="docs-terminal-figure" src="/img/docs/session-recap.svg" alt="恢复Hermes会话时显示的“上次对话”回顾面板样式化预览。" />
<p className="docs-figure-caption">恢复模式会显示一个简明的回顾面板，其中包含最近的用户和助手回合，然后将您返回到实时提示符。</p>

该回顾：
- 显示**用户消息**（金色 `●`）和**助手响应**（绿色 `◆`）
- **截断**长消息（用户消息300字符，助手消息200字符/3行）
- 将工具调用**折叠**为一个带有工具名称的计数（例如，`[3 tool calls: terminal, web_search]`）
- **隐藏**系统消息、工具结果和内部推理过程
- 将最后10次交换**作为上限**，并附带“... earlier messages ...”指示器
- 使用**暗淡样式**以区别于活动对话

要禁用回顾并保持最简单的一行式行为，请在 `~/.hermes/config.yaml` 中设置：

```yaml
display:
  resume_display: minimal   # 默认值: full
```

:::tip
会话ID遵循 `YYYYMMDD_HHMMSS_<hex>` 格式——CLI/TUI会话使用6字符的十六进制后缀（例如 `20250305_091523_a1b2c3`），网关会话使用8字符后缀（例如 `20250305_091523_a1b2c3d4`）。您可以通过ID（完整或唯一前缀）或标题恢复——两者都适用于 `-c` 和 `-r` 选项。
:::

## 跨平台交接

在CLI会话中使用 `/handoff <platform>` 可以将实时对话转移到消息平台的主频道。智能体将准确地从CLI离开的地方接续——相同的会话ID、完整的角色感知对话记录、工具调用等。

```bash
# 在CLI会话中
/handoff telegram
```

发生的过程：

1.  CLI验证 `<platform>` 是否已启用且设置了主频道（首次需从目标聊天运行 `/sethome` 进行配置）。
2.  CLI将会话标记为待处理状态并**阻塞轮询网关**。如果智能体正在处理中，它将拒绝——请先等待当前响应完成。
3.  网关监视器接收交接请求，并为目标适配器申请一个新的讨论线程：
    - **Telegram** —— 打开一个新的论坛主题（如果聊天中启用了Bot API 9.4+主题模式，则为DM主题；或论坛超级群组主题）。
    - **Discord** —— 在主文本频道下创建一个1440分钟自动归档的线程。
    - **Slack** —— 发布一条种子消息并将其 `ts` 时间戳用作线程锚点。
    - **WhatsApp / Signal / Matrix / SMS** —— 没有原生线程，直接回退到主频道。
4.  网关将目标平台的绑定键重新关联到您现有的CLI会话ID，然后伪造一个合成用户回合，要求智能体进行确认和总结。该回复将发送到新的线程中。
5.  当网关确认成功后，CLI会打印一个 `/resume` 提示并正常退出：

   ```
   ↻ 交接完成。该会话现在在telegram上处于活动状态。
     稍后可通过此CLI使用以下命令恢复它： /resume my-session-title
   ```

6.  从那时起，对话就在该平台上进行。请在新线程中回复——该频道中任何授权的用户都共享同一个会话，并且线程中稍后的任何真实用户消息都将无缝加入，因为线程会话的键不包含 `user_id`。

**恢复回CLI：** 当您想回到桌面时，只需运行 `/resume <title>`（或在shell中运行 `hermes -r "<title>"`），即可从平台离开的地方继续。

**故障模式：**
- 未配置主频道 → CLI会拒绝并给出 `/sethome` 提示。
- 平台未启用 / 网关未运行 → CLI在60秒后超时并显示明确消息，您的CLI会话保持不变。
- 线程创建失败（权限、主题模式关闭）→ 直接回退到主频道并仍然完成；没有线程隔离，但交接本身有效。
- `adapter.send` 失败（速率限制、瞬时API错误）→ 交接被标记为失败并附带原因；该记录被清除，以便您重试。

**值得关注的限制：** 对于具有多用户群组主频道的非线程功能平台，合成回合的键为DM风格会话。这对于自DM主频道（典型设置）有效，但对于真正共享的群聊并不理想。线程功能覆盖了Telegram / Discord / Slack——这几乎是最常见的情况——因此大多数设置都不会遇到此问题。

## 会话命名

为会话添加人类可读的标题，以便您轻松查找和恢复。

### 自动生成的标题

Hermes会在第一次交换后自动为每个会话生成一个简短的描述性标题（3–7个单词）。这会在后台线程中使用快速辅助模型运行，因此不会增加延迟。在使用 `hermes sessions list` 或 `hermes sessions browse` 浏览会话时，您会看到自动生成的标题。

自动命名每个会话仅触发一次，如果您已手动设置标题，则会跳过。

### 手动设置标题

在任何聊天会话（CLI或网关）中使用 `/title` 斜杠命令：

```
/title my research project
```

标题会立即应用。如果会话尚未在数据库中创建（例如，您在发送第一条消息之前运行 `/title`），它将被排队，并在会话开始时应用。

您也可以从命令行重命名现有会话：

```bash
hermes sessions rename 20250305_091523_a1b2c3d4 "refactoring auth module"
```

### 标题规则

- **唯一** —— 两个会话不能共享相同的标题
- **最多100个字符** —— 保持列表输出整洁
- **已清理** —— 控制字符、零宽字符和RTL覆盖字符会被自动剥离
- **正常Unicode没问题** —— 表情符号、CJK字符、带重音的字符都适用

### 压缩时的自动谱系

当会话的上下文被压缩（通过 `/compress` 手动或自动压缩）时，Hermes会创建一个新的延续会话。如果原始会话有标题，新会话会自动获得一个带编号的标题：

```
"my project" → "my project #2" → "my project #3"
```

当您按名称恢复时（`hermes -c "my project"`），它会自动选择谱系中最新的会话。

### 消息平台中的 /title

`/title` 命令在所有网关平台（Telegram、Discord、Slack、WhatsApp）上均有效：

- `/title My Research` —— 设置会话标题
- `/title` —— 显示当前标题

# 会话管理命令

Hermes 通过 `hermes sessions` 提供了一套完整的会话管理命令：

### 列出会话

```bash
# 列出最近的会话（默认：最近20个）
hermes sessions list

# 按平台筛选
hermes sessions list --source telegram

# 显示更多会话
hermes sessions list --limit 50
```

当会话有标题时，输出会显示标题、预览和相对时间戳：

```
Title                  Preview                                  Last Active   ID
────────────────────────────────────────────────────────────────────────────────────────────────
refactoring auth       Help me refactor the auth module please   2h ago        20250305_091523_a
my project #3          Can you check the test failures?          yesterday     20250304_143022_e
—                      What's the weather in Las Vegas?          3d ago        20250303_101500_f
```

当会话没有标题时，使用更简单的格式：

```
Preview                                            Last Active   Src    ID
──────────────────────────────────────────────────────────────────────────────────────
Help me refactor the auth module please             2h ago        cli    20250305_091523_a
What's the weather in Las Vegas?                    3d ago        tele   20250303_101500_f
```

### 导出会话

```bash
# 将所有会话导出为JSONL文件
hermes sessions export backup.jsonl

# 导出特定平台的会话
hermes sessions export telegram-history.jsonl --source telegram

# 导出单个会话
hermes sessions export session.jsonl --session-id 20250305_091523_a1b2c3d4
```

导出的文件每行包含一个JSON对象，包含完整的会话元数据和所有消息。

### 删除会话

```bash
# 删除特定会话（需确认）
hermes sessions delete 20250305_091523_a1b2c3d4

# 无需确认直接删除
hermes sessions delete 20250305_091523_a1b2c3d4 --yes
```

### 重命名会话

```bash
# 设置或更改会话标题
hermes sessions rename 20250305_091523_a1b2c3d4 "debugging auth flow"

# CLI中的多词标题不需要引号
hermes sessions rename 20250305_091523_a1b2c3d4 debugging auth flow
```

如果该标题已被其他会话使用，会显示错误信息。

### 清理旧会话

```bash
# 删除超过90天的已结束会话（默认）
hermes sessions prune

# 自定义时间阈值
hermes sessions prune --older-than 30

# 仅清理特定平台的会话
hermes sessions prune --source telegram --older-than 60

# 跳过确认步骤
hermes sessions prune --older-than 30 --yes
```

:::info
清理操作仅删除**已结束**的会话（已明确结束或自动重置的会话）。活跃会话永远不会被清理。
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

如需更深入的分析——如令牌使用情况、成本估算、工具分类和活动模式——请使用 [`hermes insights`](/reference/cli-commands#hermes-insights)。

## 会话搜索工具

智能体内置了一个 `session_search` 工具，该工具使用 SQLite 的 FTS5 引擎对所有历史对话进行全文搜索——并允许智能体滚动查看它找到的任何会话。无需调用LLM，无需总结，无需截断。每个返回形状都包含来自数据库的实际消息。

### 三种调用形状

工具会根据你设置的参数推断你想要什么。没有 `mode` 参数。

**1. 发现 —— 传递 `query`：**

```python
session_search(query="auth refactor", limit=3)
```

运行FTS5，按会话血统去重命中结果，返回前N个会话。每个结果包含：

- `session_id`, `title`, `when`, `source`
- `snippet` — FTS5 高亮的匹配摘录
- `bookend_start` — 会话的前3条用户+助手消息（目标/启动）
- `messages` — FTS5匹配项前后的±5条消息，并标记锚定消息（上下文中的命中项）
- `bookend_end` — 会话的最后3条用户+助手消息（解决/决策）
- `match_message_id`, `messages_before`, `messages_after`

书挡+窗口一起重建了 目标 → 匹配 → 解决 的过程，而无需支付整个记录的费用。在真实的会话数据库上，典型的墙钟时间为15-50毫秒。

**2. 滚动 —— 传递 `session_id` + `around_message_id`：**

```python
session_search(session_id="20260510_174648_805cc2", around_message_id=590803, window=10)
```

返回以锚点为中心、窗口大小为 ±`window` 的消息片段。没有FTS5，没有书挡——只是切片。在发现调用之后使用，当你需要比默认的±5消息窗口更多的上下文时。

- 要**向前**滚动：将 `messages[-1].id` 传回作为 `around_message_id`
- 要**向后**滚动：将 `messages[0].id` 传回作为 `around_message_id`
- 边界消息会在两个窗口中作为方向标记出现
- 当 `messages_before` 或 `messages_after` 小于 `window` 时，表示你已到达会话的开头或结尾

典型的墙钟时间：每次滚动调用1-2毫秒。

**3. 浏览 —— 无参数：**

```python
session_search()
```

按时间顺序返回最近的会话（标题、预览、时间戳）。当用户问“我之前在做什么”而没有指定主题时很有用。

### FTS5 查询语法

关键词模式支持标准FTS5查询语法：

- 简单关键词：`docker deployment`（FTS5默认为AND）
- 短语：`"exact phrase"`
- 布尔运算：`docker OR kubernetes`, `python NOT java`
- 前缀：`deploy*`

### 可选参数

- `sort` — `newest` 或 `oldest`，在FTS5排序基础上额外排序。省略则仅按相关性排序（默认；适合探索性回忆）。对于“我们做到哪了”类问题使用 `newest`，对于“某事是如何开始的”类问题使用 `oldest`。
- `role_filter` — 逗号分隔的要包含的角色。发现模式默认为 `user,assistant`（工具输出通常是噪音）。传递 `user,assistant,tool` 以包含工具输出（调试工具行为），或 `tool` 以仅搜索工具输出。

### 何时使用

智能体会被提示自动使用会话搜索：

> *"当用户引用过去的对话内容或你怀疑存在相关的先前上下文时，请使用 session_search 来回忆它，而不是要求他们重复。"*

典型的触发词：“我们以前做过这个”，“记得那次”，“上次”，“正如我提到的”，或者任何不在当前窗口中的对项目/人物/概念的引用。

# 每平台会话追踪

### 网关会话

在消息平台上，会话由一个基于消息来源的确定性会话键进行标识：

| 聊天类型 | 默认键格式 | 行为 |
|-----------|------------|------|
| Telegram 私聊 | `agent:main:telegram:dm:<chat_id>` | 每个私聊一个会话 |
| Discord 私聊 | `agent:main:discord:dm:<chat_id>` | 每个私聊一个会话 |
| WhatsApp 私聊 | `agent:main:whatsapp:dm:<canonical_identifier>` | 每个用户一个会话 (当存在映射时，LID/电话别名会合并为同一身份) |
| 群组聊天 | `agent:main:<platform>:group:<chat_id>:<user_id>` | 当平台暴露用户ID时，群组内按用户区分 |
| 群组线程/主题 | `agent:main:<platform>:group:<chat_id>:<thread_id>` | 所有线程参与者共享会话 (默认)。当设置 `thread_sessions_per_user: true` 时，按用户区分。 |
| 频道 | `agent:main:<platform>:channel:<chat_id>:<user_id>` | 当平台暴露用户ID时，频道内按用户区分 |

当 Hermes 无法为共享聊天获取参与者标识符时，它会回退到为该房间使用一个共享会话。

### 共享与隔离的群组会话

默认情况下，Hermes 在 `config.yaml` 中使用 `group_sessions_per_user: true`。这意味着：

- Alice 和 Bob 可以在同一个 Discord 频道中与 Hermes 对话，而不会共享对话历史
- 一个用户的长时间工具密集型任务不会污染另一个用户的上下文窗口
- 中断处理也保持按用户区分，因为运行中的智能体键与隔离会话键匹配

如果你想要一个共享的"房间大脑"，请设置：

```yaml
group_sessions_per_user: false
```

这会将群组/频道回退为每个房间一个共享会话，这保留了共享的对话上下文，但也会共享代币成本、中断状态和上下文增长。

### 会话重置策略

网关会话会根据可配置的策略自动重置：

- **idle** — 在 N 分钟不活动后重置
- **daily** — 每天在特定时间重置
- **both** — 取两者中较早发生的（闲置或每日）
- **none** — 永不自动重置

在会话被自动重置前，智能体会获得一个轮次来保存会话中任何重要的记忆或技能。

具有**活跃后台进程**的会话永远不会被自动重置，无论策略如何。

## 存储位置

| 内容 | 路径 | 描述 |
|------|------|------|
| SQLite 数据库 | `~/.hermes/state.db` | 所有会话元数据 + 带有 FTS5 的消息 |
| 网关消息 | `~/.hermes/state.db`   | SQLite — 所有会话消息的规范存储 |
| 网关路由索引 | `~/.hermes/sessions/sessions.json` | 将会话键映射到活动会话 ID (原始元数据、过期标志) |

SQLite 数据库使用 WAL 模式以支持并发读取者和单个写入者，这非常适合网关的多平台架构。

:::note 遗留的 JSONL 转录记录
在 state.db 成为规范之前创建的会话可能在 `~/.hermes/sessions/` 中留有 `*.jsonl` 文件。Hermes 不再读取或写入它们。在验证相应会话存在于 state.db 后，可以安全删除。
:::

### 数据库架构

`state.db` 中的关键表：

- **sessions** — 会话元数据 (id, source, user_id, model, title, timestamps, token counts)。标题有唯一索引 (允许 NULL 标题，仅非 NULL 标题必须唯一)。
- **messages** — 完整的消息历史 (role, content, tool_calls, tool_name, token_count)
- **messages_fts** — 用于跨消息内容进行全文搜索的 FTS5 虚拟表

## 会话过期与清理

### 自动清理

- 网关会话根据配置的重置策略自动重置
- 重置前，智能体会保存来自即将过期会话的记忆和技能
- 可选的自动修剪：当 `sessions.auto_prune` 为 `true` 时，在 CLI/网关启动时，会修剪掉比 `sessions.retention_days` (默认 90) 更老的已结束会话
- 在实际删除了行的修剪操作之后，`state.db` 会被 `VACUUM` 以回收磁盘空间 (SQLite 在普通 DELETE 操作后不会缩小文件)
- 修剪最多每 `sessions.min_interval_hours` (默认 24) 运行一次；最后运行的时间戳在 `state.db` 内部跟踪，因此同一 `HERMES_HOME` 下的所有 Hermes 进程共享

默认是**关闭**的 — 会话历史对于 `session_search` 的召回很有价值，静默删除可能会让用户意外。在 `~/.hermes/config.yaml` 中启用：

```yaml
sessions:
  auto_prune: true          # 选择启用 — 默认为 false
  retention_days: 90        # 保留已结束会话这些天
  vacuum_after_prune: true  # 在修剪扫描后回收磁盘空间
  min_interval_hours: 24    # 不要更频繁地重新运行扫描
```

无论会话存在了多久，活跃会话永远不会被自动修剪。

### 手动清理

```bash
# 修剪超过 90 天的会话
hermes sessions prune

# 删除特定会话
hermes sessions delete <session_id>

# 修剪前导出 (备份)
hermes sessions export backup.jsonl
hermes sessions prune --older-than 30 --yes
```

:::tip
数据库增长缓慢 (典型情况：数百个会话约 10-15 MB)，会话历史为跨过去对话的 `session_search` 召回提供支持，因此自动修剪默认是禁用的。如果你运行的是繁重的网关/定时任务工作负载，其中 `state.db` 正在显著影响性能 (观察到的失败模式：约 1000 个会话，384 MB 的 state.db 减慢了 FTS5 插入和 `/resume` 列表速度)，请启用它。使用 `hermes sessions prune` 进行一次性清理，而无需开启自动扫描。
:::