---
sidebar_position: 7
title: "会话"
description: "会话持久化、恢复、搜索、管理以及各平台会话跟踪"
---

# 会话

Hermes Agent 会自动将每次对话保存为会话。会话支持对话恢复、跨会话搜索和完整的对话历史管理。

## 会话工作原理

每次对话——无论是来自 CLI、Telegram、Discord、Slack、WhatsApp、Signal、Matrix 还是任何其他消息平台——都会作为会话存储，包含完整的消息历史。会话在两个互补的系统中进行跟踪：

1. **SQLite 数据库** (`~/.hermes/state.db`) — 结构化会话元数据，配备 FTS5 全文搜索
2. **JSONL 记录** (`~/.hermes/sessions/`) — 包含工具调用的原始对话记录（网关）

SQLite 数据库存储：
- 会话 ID、源平台、用户 ID
- **会话标题**（唯一的、人类可读的名称）
- 模型名称和配置
- 系统提示快照
- 完整消息历史（角色、内容、工具调用、工具结果）
- Token 计数（输入/输出）
- 时间戳（started_at、ended_at）
- 父会话 ID（用于压缩触发的会话分割）

### 会话来源

每个会话都标记有其源平台：

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
| `wecom` | 企业微信 |
| `weixin` | 微信（个人微信） |
| `bluebubbles` | 通过 BlueBubbles macOS 服务器的 Apple iMessage |
| `qqbot` | 通过官方 API v2 的 QQ 机器人（腾讯 QQ） |
| `homeassistant` | Home Assistant 对话 |
| `webhook` | 传入的 webhook |
| `api-server` | API 服务器请求 |
| `acp` | ACP 编辑器集成 |
| `cron` | 定时的 cron 任务 |
| `batch` | 批处理运行 |

## CLI 会话恢复

使用 `--continue` 或 `--resume` 从 CLI 恢复之前的对话：

### 继续上一个会话

```bash
# 恢复最近的 CLI 会话
hermes --continue
hermes -c

# 或使用 chat 子命令
hermes chat --continue
hermes chat -c
```

这会从 SQLite 数据库中查找最近的 `cli` 会话并加载其完整的对话历史。

### 按名称恢复

如果您为会话设置了标题（见下文的[会话命名](#会话命名)），可以按名称恢复：

```bash
# 恢复命名会话
hermes -c "我的项目"

# 如果存在变体（我的项目、我的项目 #2、我的项目 #3），
# 这会自动恢复最新的一个
hermes -c "我的项目"   # → 恢复 "我的项目 #3"
```

### 恢复特定会话

```bash
# 按 ID 恢复特定会话
hermes --resume 20250305_091523_a1b2c3d4
hermes -r 20250305_091523_a1b2c3d4

# 按标题恢复
hermes --resume "重构认证"

# 或使用 chat 子命令
hermes chat --resume 20250305_091523_a1b2c3d4
```

会话 ID 在您退出 CLI 会话时显示，也可以通过 `hermes sessions list` 找到。

### 恢复时的对话回顾

当您恢复会话时，Hermes 在输入提示之前会以样式化面板显示之前对话的紧凑回顾：

<img className="docs-terminal-figure" src="/img/docs/session-recap.svg" alt="恢复 Hermes 会话时显示的先前对话回顾面板的样式化预览。" />
<p className="docs-figure-caption">恢复模式显示一个紧凑的回顾面板，包含最近的用户和助手对话，然后返回到实时提示。</p>

回顾内容：
- 显示**用户消息**（金色 `●`）和**助手响应**（绿色 `◆`）
- **截断**长消息（用户消息 300 字符，助手响应 200 字符/3 行）
- **折叠**工具调用为计数和工具名称（例如 `[3 个工具调用：terminal、web_search]`）
- **隐藏**系统消息、工具结果和内部推理
- **限制**为最近 10 次交流，并显示 "... N 条更早的消息 ..." 指示器
- 使用**暗淡样式**与活跃对话区分

要禁用回顾并保持最小单行行为，在 `~/.hermes/config.yaml` 中设置：

```yaml
display:
  resume_display: minimal   # 默认：full
```

:::tip
会话 ID 遵循格式 `YYYYMMDD_HHMMSS_<8-char-hex>`，例如 `20250305_091523_a1b2c3d4`。您可以通过 ID 或标题恢复——两者都支持 `-c` 和 `-r`。
:::

## 会话命名

为会话设置人类可读的标题，以便轻松查找和恢复。

### 自动生成的标题

Hermes 在第一次交流后会自动为每个会话生成一个简短的描述性标题（3-7 个词）。这在后台线程中使用快速辅助模型运行，因此不会增加延迟。当您使用 `hermes sessions list` 或 `hermes sessions browse` 浏览会话时，会看到自动生成的标题。

自动标题生成每个会话只触发一次，如果您已经手动设置了标题，则会跳过。

### 手动设置标题

在任何聊天会话（CLI 或网关）中使用 `/title` 斜杠命令：

```
/title 我的研究项目
```

标题会立即应用。如果会话尚未在数据库中创建（例如，您在发送第一条消息之前运行 `/title`），它会被排队并在会话开始时应用。

您也可以从命令行重命名现有会话：

```bash
hermes sessions rename 20250305_091523_a1b2c3d4 "重构认证模块"
```

### 标题规则

- **唯一**——没有两个会话可以共享相同的标题
- **最多 100 个字符**——保持列表输出整洁
- **已清理**——控制字符、零宽度字符和 RTL 覆盖会被自动去除
- **普通 Unicode 字符可以**——表情符号、CJK、重音字符都可以使用

### 压缩时的自动谱系

当会话上下文被压缩时（通过 `/compress` 手动或自动），Hermes 会创建一个新的继续会话。如果原始会话有标题，新会话会自动获得编号标题：

```
"我的项目" → "我的项目 #2" → "我的项目 #3"
```

当您按名称恢复（`hermes -c "我的项目"`）时，它会自动选择谱系中最近的会话。

### 消息平台中的 /title

`/title` 命令在所有网关平台（Telegram、Discord、Slack、WhatsApp）中都可以使用：

- `/title 我的研究` — 设置会话标题
- `/title` — 显示当前标题

## 会话管理命令

Hermes 通过 `hermes sessions` 提供完整的会话管理命令集：

### 列出会话

```bash
# 列出最近的会话（默认：最近 20 个）
hermes sessions list

# 按平台过滤
hermes sessions list --source telegram

# 显示更多会话
hermes sessions list --limit 50
```

当会话有标题时，输出显示标题、预览和相对时间戳：

```
标题                  预览                                  最后活跃时间   ID
────────────────────────────────────────────────────────────────────────────────────────────────
重构认证       帮我重构认证模块                   2小时前        20250305_091523_a
我的项目 #3          能检查测试失败吗？                  昨天     20250304_143022_e
—                      拉斯维加斯的天气怎么样？          3天前        20250303_101500_f
```

当会话没有标题时，使用更简单的格式：

```
预览                                            最后活跃时间   来源    ID
──────────────────────────────────────────────────────────────────────────────────────
帮我重构认证模块                   2小时前        cli    20250305_091523_a
拉斯维加斯的天气怎么样？                    3天前        tele   20250303_101500_f
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
# 删除特定会话（需要确认）
hermes sessions delete 20250305_091523_a1b2c3d4

# 无需确认删除
hermes sessions delete 20250305_091523_a1b2c3d4 --yes
```

### 重命名会话

```bash
# 设置或更改会话标题
hermes sessions rename 20250305_091523_a1b2c3d4 "调试认证流程"

# CLI 中多词标题不需要引号
hermes sessions rename 20250305_091523_a1b2c3d4 调试认证流程
```

如果标题已被另一个会话使用，会显示错误。

### 清理旧会话

```bash
# 删除超过 90 天的已结束会话（默认）
hermes sessions prune

# 自定义年龄阈值
hermes sessions prune --older-than 30

# 仅清理特定平台的会话
hermes sessions prune --source telegram --older-than 60

# 跳过确认
hermes sessions prune --older-than 30 --yes
```

:::info
清理仅删除**已结束**的会话（已明确结束或自动重置的会话）。活跃会话永远不会被清理。
:::

### 会话统计

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

对于更深入的分析——token 使用情况、成本估算、工具分解和活动模式——使用 [`hermes insights`](/docs/reference/cli-commands#hermes-insights)。

## 会话搜索工具

代理有一个内置的 `session_search` 工具，使用 SQLite 的 FTS5 引擎对所有过去的对话执行全文搜索。

### 工作原理

1. FTS5 搜索匹配的消息，按相关性排序
2. 按会话分组结果，取前 N 个唯一会话（默认 3 个）
3. 加载每个会话的对话，截断到约 100K 字符，以匹配为中心
4. 发送到快速摘要模型以生成聚焦摘要
5. 返回每个会话的摘要，包含元数据和周围上下文

### FTS5 查询语法

搜索支持标准 FTS5 查询语法：

- 简单关键词：`docker deployment`
- 短语：`"exact phrase"`
- 布尔：`docker OR kubernetes`、`python NOT java`
- 前缀：`deploy*`

### 使用时机

代理被提示自动使用会话搜索：

> *"当用户引用过去对话中的内容或您怀疑存在相关先验上下文时，使用 session_search 来回忆它，而不是要求他们重复。"*

## 各平台会话跟踪

### 网关会话

在消息平台上，会话通过从消息源构建的确定性会话键进行键控：

| 聊天类型 | 默认键格式 | 行为 |
|-----------|--------------------|----------|
| Telegram 私信 | `agent:main:telegram:dm:<chat_id>` | 每个私信聊天一个会话 |
| Discord 私信 | `agent:main:discord:dm:<chat_id>` | 每个私信聊天一个会话 |
| WhatsApp 私信 | `agent:main:whatsapp:dm:<chat_id>` | 每个私信聊天一个会话 |
| 群聊 | `agent:main:<platform>:group:<chat_id>:<user_id>` | 当平台暴露用户 ID 时，群内每个用户一个会话 |
| 群聊线程/主题 | `agent:main:<platform>:group:<chat_id>:<thread_id>` | 所有线程参与者的共享会话（默认）。使用 `thread_sessions_per_user: true` 时为每个用户一个会话。 |
| 频道 | `agent:main:<platform>:channel:<chat_id>:<user_id>` | 当平台暴露用户 ID 时，频道内每个用户一个会话 |

当 Hermes 无法获取共享聊天的参与者标识符时，它会回退到该房间的一个共享会话。

### 共享 vs 隔离群组会话

默认情况下，Hermes 在 `config.yaml` 中使用 `group_sessions_per_user: true`。这意味着：

- Alice 和 Bob 可以在同一个 Discord 频道中与 Hermes 对话，而不共享记录历史
- 一个用户的长时间工具密集型任务不会污染另一个用户的上下文窗口
- 中断处理也保持每个用户独立，因为运行代理键与隔离会话键匹配

如果您想要一个共享的"房间大脑"，请设置：

```yaml
group_sessions_per_user: false
```

这会将群组/频道恢复为每个房间一个共享会话，保留共享对话上下文，但也共享 token 成本、中断状态和上下文增长。

### 会话重置策略

网关会话根据可配置策略自动重置：

- **idle**——在 N 分钟不活动后重置
- **daily**——每天在特定时间重置
- **both**——在任一条件先满足时重置（空闲或每日）
- **none**——从不自动重置

在会话自动重置之前，代理会获得一轮机会来保存对话中的任何重要记忆或技能。

具有**活跃后台进程**的会话永远不会自动重置，无论策略如何。

## 存储位置

| 内容 | 路径 | 描述 |
|------|------|-------------|
| SQLite 数据库 | `~/.hermes/state.db` | 所有会话元数据 + 带 FTS5 的消息 |
| 网关记录 | `~/.hermes/sessions/` | 每个会话的 JSONL 记录 + sessions.json 索引 |
| 网关索引 | `~/.hermes/sessions/sessions.json` | 将会话键映射到活跃会话 ID |

SQLite 数据库使用 WAL 模式支持并发读取器和单个写入器，这很适合网关的多平台架构。

### 数据库架构

`state.db` 中的关键表：

- **sessions**——会话元数据（id、source、user_id、model、title、timestamps、token counts）。标题有唯一索引（允许 NULL 标题，只有非 NULL 必须唯一）。
- **messages**——完整消息历史（role、content、tool_calls、tool_name、token_count）
- **messages_fts**——用于消息内容全文搜索的 FTS5 虚拟表

## 会话过期和清理

### 自动清理

- 网关会话根据配置的重置策略自动重置
- 重置前，代理保存过期会话中的记忆和技能
- 已结束的会话保留在数据库中直到被清理

### 手动清理

```bash
# 清理超过 90 天的会话
hermes sessions prune

# 删除特定会话
hermes sessions delete <session_id>

# 清理前导出（备份）
hermes sessions export backup.jsonl
hermes sessions prune --older-than 30 --yes
```

:::tip
数据库增长缓慢（典型：数百个会话 10-15 MB）。清理主要用于删除您不再需要用于搜索回忆的旧对话。
:::