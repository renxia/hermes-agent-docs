---
sidebar_position: 7
title: "会话"
description: "会话持久化、恢复、搜索、管理以及各平台会话跟踪"
---

# 会话

Hermes 智能体自动将每次对话保存为一个会话。会话支持对话恢复、跨会话搜索以及完整的对话历史管理。

## 会话工作原理

每次对话——无论是来自 CLI、Telegram、Discord、Slack、WhatsApp、Signal、Matrix 还是任何其他消息平台——都会被存储为一个包含完整消息历史的会话。会话在两个互补的系统中进行跟踪：

1. **SQLite 数据库**（`~/.hermes/state.db`）—— 结构化会话元数据，支持 FTS5 全文搜索
2. **JSONL 对话记录**（`~/.hermes/sessions/`）—— 原始对话记录，包括工具调用（网关）

SQLite 数据库存储以下内容：
- 会话 ID、来源平台、用户 ID
- **会话标题**（唯一、人类可读的名称）
- 模型名称和配置
- 系统提示快照
- 完整消息历史（角色、内容、工具调用、工具结果）
- Token 计数（输入/输出）
- 时间戳（started_at、ended_at）
- 父会话 ID（用于压缩触发的会话拆分）

### 会话来源

每个会话都会标记其来源平台：

| 来源 | 描述 |
|--------|-------------|
| `cli` | 交互式 CLI（`hermes` 或 `hermes chat`） |
| `telegram` | Telegram 消息应用 |
| `discord` | Discord 服务器/私信 |
| `slack` | Slack 工作区 |
| `whatsapp` | WhatsApp 消息应用 |
| `signal` | Signal 消息应用 |
| `matrix` | Matrix 房间和私信 |
| `mattermost` | Mattermost 频道 |
| `email` | 电子邮件（IMAP/SMTP） |
| `sms` | 通过 Twilio 发送的短信 |
| `dingtalk` | 钉钉消息应用 |
| `feishu` | 飞书/Lark 消息应用 |
| `wecom` | 企业微信（WeChat Work） |
| `weixin` | 微信（个人微信） |
| `bluebubbles` | 通过 BlueBubbles macOS 服务器的 Apple iMessage |
| `qqbot` | QQ 机器人（腾讯 QQ），通过官方 API v2 |
| `homeassistant` | Home Assistant 对话 |
| `webhook` | 传入的 Webhook |
| `api-server` | API 服务器请求 |
| `acp` | ACP 编辑器集成 |
| `cron` | 定时计划任务 |
| `batch` | 批处理运行 |

## CLI 会话恢复

使用 `--continue` 或 `--resume` 从 CLI 恢复之前的对话：

### 继续上一次会话

```bash
# 恢复最近的 CLI 会话
hermes --continue
hermes -c

# 或使用 chat 子命令
hermes chat --continue
hermes chat -c
```

这将从 SQLite 数据库中查找最近的 `cli` 会话，并加载其完整的对话历史记录。

### 按名称恢复

如果您已为某个会话指定了标题（参见下面的 [会话命名](#会话命名)），则可以通过名称恢复它：

```bash
# 恢复指定名称的会话
hermes -c "my project"

# 如果存在多个同名会话（如 my project、my project #2、my project #3），
# 将自动恢复最新的一个
hermes -c "my project"   # → 恢复 "my project #3"
```

### 恢复特定会话

```bash
# 通过 ID 恢复特定会话
hermes --resume 20250305_091523_a1b2c3d4
hermes -r 20250305_091523_a1b2c3d4

# 通过标题恢复
hermes --resume "refactoring auth"

# 或使用 chat 子命令
hermes chat --resume 20250305_091523_a1b2c3d4
```

会话 ID 会在您退出 CLI 会话时显示，也可以通过 `hermes sessions list` 查看。

### 恢复时的对话摘要

当您恢复会话时，Hermes 会在输入提示符之前以样式化面板的形式显示上一次对话的简明摘要：

<img className="docs-terminal-figure" src="/img/docs/session-recap.svg" alt="恢复 Hermes 会话时显示的“上次对话”摘要面板的样式化预览。" />
<p className="docs-figure-caption">恢复模式会在返回实时提示符之前显示一个包含最近用户和助手轮次的简明摘要面板。</p>

该摘要：
- 显示**用户消息**（金色 `●`）和**助手回复**（绿色 `◆`）
- **截断**长消息（用户消息 300 字符，助手消息 200 字符 / 3 行）
- **折叠工具调用**为带工具名称的计数（例如 `[3 次工具调用：terminal, web_search]`）
- **隐藏**系统消息、工具结果和内部推理
- **限制**为最近 10 次交互，并带有“……还有 N 条更早的消息……”指示符
- 使用**暗淡样式**以区别于当前对话

若要禁用摘要并保留极简的单行行为，请在 `~/.hermes/config.yaml` 中设置：

```yaml
display:
  resume_display: minimal   # 默认值：full
```

:::tip
会话 ID 的格式为 `YYYYMMDD_HHMMSS_<8位十六进制>`，例如 `20250305_091523_a1b2c3d4`。您可以通过 ID 或标题恢复会话 —— `-c` 和 `-r` 均支持这两种方式。
:::

## 会话命名

为会话指定人类可读的标题，以便轻松查找和恢复它们。

### 自动生成标题

Hermes 会在第一次交互后自动为每个会话生成一个简短的描述性标题（3–7 个词）。此操作在后台线程中使用一个快速的辅助模型完成，因此不会增加延迟。当您使用 `hermes sessions list` 或 `hermes sessions browse` 浏览会话时，会看到自动生成的标题。

自动标题生成每个会话仅触发一次，如果您已手动设置了标题，则会跳过此步骤。

### 手动设置标题

在任何聊天会话（CLI 或网关）中使用 `/title` 斜杠命令：

```
/title my research project
```

标题会立即生效。如果会话尚未在数据库中创建（例如，您在发送第一条消息之前运行了 `/title`），则该命令会被排队，并在会话启动后应用。

您也可以从命令行重命名现有会话：

```bash
hermes sessions rename 20250305_091523_a1b2c3d4 "refactoring auth module"
```

### 标题规则

- **唯一性** —— 任意两个会话不能共享相同的标题
- **最多 100 个字符** —— 保持列表输出整洁
- **已清理** —— 控制字符、零宽字符和 RTL 覆盖字符会被自动移除
- **支持标准 Unicode** —— 表情符号、中日韩字符、带重音符号的字符均可正常使用

### 压缩时的自动继承命名

当会话的上下文被压缩时（通过 `/compress` 手动压缩或自动压缩），Hermes 会创建一个新的延续会话。如果原始会话有标题，则新会话会自动获得一个带编号的标题：

```
"my project" → "my project #2" → "my project #3"
```

当您通过名称恢复会话时（`hermes -c "my project"`），它会自动选择继承链中最新的会话。

### 消息平台中的 /title 命令

`/title` 命令在所有网关平台（Telegram、Discord、Slack、WhatsApp）中均可用：

- `/title My Research` —— 设置会话标题
- `/title` —— 显示当前标题

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

当会话有标题时，输出会显示标题、预览和相对时间戳：

```
标题                  预览                                  最后活跃时间   ID
────────────────────────────────────────────────────────────────────────────────────────────────
refactoring auth       请帮我重构 auth 模块                 2 小时前       20250305_091523_a
my project #3          你能检查一下测试失败的问题吗？       昨天           20250304_143022_e
—                      拉斯维加斯天气怎么样？               3 天前         20250303_101500_f
```

当没有会话有标题时，会使用更简单的格式：

```
预览                                            最后活跃时间   来源    ID
──────────────────────────────────────────────────────────────────────────────────────
请帮我重构 auth 模块                             2 小时前       cli     20250305_091523_a
拉斯维加斯天气怎么样？                           3 天前         tele    20250303_101500_f
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

导出的文件每行包含一个 JSON 对象，其中包含完整的会话元数据和所有消息。

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

# CLI 中多词标题无需引号
hermes sessions rename 20250305_091523_a1b2c3d4 debugging auth flow
```

如果该标题已被其他会话使用，则会显示错误。

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
清理操作仅删除**已结束**的会话（即已被显式结束或自动重置的会话）。活动会话永远不会被清理。
:::

### 会话统计信息

```bash
hermes sessions stats
```

输出：

```
总会话数：142
总消息数：3847
  cli：89 个会话
  telegram：38 个会话
  discord：15 个会话
数据库大小：12.4 MB
```

如需更深入的分析 —— 如 token 使用量、成本估算、工具调用细分和活动模式 —— 请使用 [`hermes insights`](/docs/reference/cli-commands#hermes-insights)。

## 会话搜索工具

智能体内置了一个 `session_search` 工具，可使用 SQLite 的 FTS5 引擎对所有历史对话执行全文搜索。

### 工作原理

1. FTS5 按相关性对匹配的消息进行排名搜索
2. 按会话分组结果，取前 N 个唯一会话（默认 3 个）
3. 加载每个会话的对话内容，截取以匹配内容为中心的大约 10 万字符
4. 发送至快速摘要模型以生成聚焦的摘要
5. 返回带有元数据和上下文环境的每会话摘要

### FTS5 查询语法

搜索支持标准的 FTS5 查询语法：

- 简单关键词：`docker deployment`
- 短语：`"exact phrase"`
- 布尔逻辑：`docker OR kubernetes`，`python NOT java`
- 前缀匹配：`deploy*`

### 使用时机

智能体会被提示自动使用会话搜索：

> *“当用户提及过去对话中的内容，或您怀疑存在相关的先前上下文时，请使用 session_search 回忆相关内容，而不是要求用户重复说明。”*

## 按平台跟踪会话

### 网关会话

在消息传递平台上，会话由基于消息源的确定性会话键标识：

| 聊天类型 | 默认键格式 | 行为 |
|-----------|--------------------|----------|
| Telegram 私信 | `agent:main:telegram:dm:<chat_id>` | 每个私信聊天一个会话 |
| Discord 私信 | `agent:main:discord:dm:<chat_id>` | 每个私信聊天一个会话 |
| WhatsApp 私信 | `agent:main:whatsapp:dm:<canonical_identifier>` | 每个私信用户一个会话（当存在映射时，LID/电话别名会折叠为单一身份） |
| 群聊 | `agent:main:<platform>:group:<chat_id>:<user_id>` | 当平台暴露用户 ID 时，群内每个用户一个会话 |
| 群聊线程/主题 | `agent:main:<platform>:group:<chat_id>:<thread_id>` | 所有线程参与者共享一个会话（默认）。若设置 `thread_sessions_per_user: true`，则为每个用户一个会话。 |
| 频道 | `agent:main:<platform>:channel:<chat_id>:<user_id>` | 当平台暴露用户 ID 时，频道内每个用户一个会话 |

当 Hermes 无法获取共享聊天的参与者标识符时，它会回退到为该房间创建一个共享会话。

### 共享与会话隔离的群组会话

默认情况下，Hermes 在 `config.yaml` 中使用 `group_sessions_per_user: true`。这意味着：

- Alice 和 Bob 可以在同一个 Discord 频道中与 Hermes 对话，而无需共享对话记录历史
- 一个用户长时间运行的工具密集型任务不会污染另一个用户的上下文窗口
- 中断处理也保持按用户隔离，因为运行中的智能体键与隔离的会话键匹配

如果你希望使用一个共享的“房间大脑”，请设置：

```yaml
group_sessions_per_user: false
```

这将使群组/频道回退到每个房间一个共享会话，从而保留共享的对话上下文，但也会共享 token 成本、中断状态和上下文增长。

### 会话重置策略

网关会话会根据可配置的策略自动重置：

- **空闲** — 在 N 分钟不活动后重置
- **每日** — 每天在特定小时重置
- **两者** — 在任一条件（空闲或每日）满足时重置
- **无** — 从不自动重置

在会话自动重置之前，智能体有机会保存对话中的任何重要记忆或技能。

具有**活动后台进程**的会话永远不会自动重置，无论策略如何。

## 存储位置

| 内容 | 路径 | 描述 |
|------|------|-------------|
| SQLite 数据库 | `~/.hermes/state.db` | 所有会话元数据 + 带有 FTS5 的消息 |
| 网关对话记录 | `~/.hermes/sessions/` | 每个会话的 JSONL 对话记录 + sessions.json 索引 |
| 网关索引 | `~/.hermes/sessions/sessions.json` | 将会话键映射到活动会话 ID |

SQLite 数据库使用 WAL 模式支持并发读取器和单个写入器，这非常适合网关的多平台架构。

### 数据库模式

`state.db` 中的关键表：

- **sessions** — 会话元数据（id、源、user_id、模型、标题、时间戳、token 计数）。标题具有唯一索引（允许 NULL 标题，仅非 NULL 标题必须唯一）。
- **messages** — 完整消息历史（角色、内容、tool_calls、tool_name、token_count）
- **messages_fts** — 用于在消息内容中进行全文搜索的 FTS5 虚拟表

## 会话过期和清理

### 自动清理

- 网关会话根据配置的重置策略自动重置
- 重置前，智能体保存即将过期的会话中的记忆和技能
- 选择加入的自动修剪：当 `sessions.auto_prune` 为 `true` 时，在 CLI/网关启动时会修剪早于 `sessions.retention_days`（默认 90 天）的已结束会话
- 在真正删除行的修剪操作后，`state.db` 会执行 `VACUUM` 以回收磁盘空间（SQLite 在普通 DELETE 操作后不会缩小文件）
- 修剪操作最多每 `sessions.min_interval_hours`（默认 24 小时）运行一次；上次运行的时间戳记录在 `state.db` 内部，因此在同一 `HERMES_HOME` 下的每个 Hermes 进程之间共享

默认值为**关闭** — 会话历史对于 `session_search` 召回很有价值，静默删除可能会让用户感到意外。请在 `~/.hermes/config.yaml` 中启用：

```yaml
sessions:
  auto_prune: true          # 选择加入 — 默认为 false
  retention_days: 90        # 保留已结束会话的天数
  vacuum_after_prune: true  # 在修剪扫描后回收磁盘空间
  min_interval_hours: 24    # 不要比此频率更频繁地重新运行扫描
```

活动会话永远不会被自动修剪，无论其存在时间长短。

### 手动清理

```bash
# 修剪早于 90 天的会话
hermes sessions prune

# 删除特定会话
hermes sessions delete <session_id>

# 修剪前导出（备份）
hermes sessions export backup.jsonl
hermes sessions prune --older-than 30 --yes
```

:::tip
数据库增长缓慢（典型情况：数百个会话占用 10-15 MB），且会话历史支持跨过去对话的 `session_search` 召回，因此自动修剪默认禁用。如果你运行的是重型网关/cron 工作负载，且 `state.db` 显著影响性能（观察到的故障模式：约 1000 个会话的 384 MB state.db 导致 FTS5 插入和 `/resume` 列表变慢），请启用它。使用 `hermes sessions prune` 进行一次性清理，而无需开启自动扫描。
:::