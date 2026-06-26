---
sidebar_position: 7
title: "会话"
description: "会话持久性、恢复、搜索、管理和跨平台会话跟踪"
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# 会话

Hermes 智能体会自动将每一次对话保存为一次会话。会话功能支持对话恢复、跨会话搜索和完整的对话历史记录管理。

## 会话的工作原理

无论是来自 CLI、Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Teams 还是任何其他消息平台上的对话，都会被存储为一个包含完整消息历史的会话。会话的跟踪信息包括：

1. **SQLite 数据库** (`~/.hermes/state.db`) — 结构化的会话元数据（支持 FTS5 全文搜索），以及完整的消息历史记录

SQLite 数据库存储的内容包括：
- 会话 ID、来源平台、用户 ID
- **会话标题**（唯一的、人类可读的名称）
- 模型名称和配置
- 系统提示词快照
- 完整消息历史记录（角色、内容、工具调用、工具结果）
- Token 计数（输入/输出）
- 时间戳（started_at, ended_at）
- 父会话 ID（用于压缩触发的会话拆分）

### 有助于上下文的信息

Hermes 会存储会话历史以便于恢复对话，但它不会不断地重新发送它所处理过的每一个字节。在每一次交互中，模型都会看到选定的系统提示词、当前的对话窗口以及 Hermes 为该轮次明确注入的任何内容。

媒体附件作为特定轮次的输入进行处理：

- 图像可以原生附加到下一次模型调用中，或者在活动模型不支持原生视觉时，被预先分析成文本描述。
- 如果配置了语音转文字功能，音频将被转录为文本。
- 文本文件可以包含其提取的文本；其他类型的文档通常以本地路径和简短备注的形式表示。
- 附件路径以及提取/派生出的文本可能会出现在转录稿中，但原始图像、音频或二进制文件的字节不会被重复复制到未来的提示词中。

例如，如果用户发送一张图片并要求 Hermes 基于此图制作表情包，Hermes 可能会使用视觉功能对该图片进行一次检查并运行一个图像处理脚本。后续的轮次不会自动地将原始 JPEG 保留到上下文中。它们只携带对话中写入的内容，例如用户的请求、简短的图像描述、本地缓存路径或最终助手的回复。

上下文增长的最常见原因并非媒体文件本身。而是冗长的文本：粘贴的转录稿、完整的日志、大型工具输出、长 diffs、重复的状态报告和详细的证明数据。应优先使用摘要、文件路径、聚焦摘录和基于工具的查找，而不是将大型工件复制到聊天中。

:::tip
当会话变得很长时，请使用 `/compress`；对于新的线程，请使用 `/new`；只有当你想要从存储中删除旧的已结束会话时，才运行 `hermes sessions prune`。压缩功能可以减少活动上下文；它不是隐私数据删除。向 `/new` 传递一个名称（例如 `/new payments-refactor`）可以在一开始就设置新会话的标题——这对于稍后使用 `/resume <name>` 或在 `/sessions` 选择器中查找非常有用。
:::

### 会话来源

每个会话都会被标记其来源平台：

| Source | Description |
|--------|-------------|
| `cli` | 命令行界面 (hermes 或 hermes chat) |
| `telegram` | Telegram 消息服务 |
| `discord` | Discord 服务器/私信 |
| `slack` | Slack 工作区 |
| `whatsapp` | WhatsApp 消息服务 |
| `signal` | Signal 消息服务 |
| `matrix` | Matrix 房间和私聊 |
| `mattermost` | Mattermost 频道 |
| `email` | 电子邮件 (IMAP/SMTP) |
| `sms` | 通过 Twilio 发送的 SMS |
| `dingtalk` | DingTalk 消息服务 |
| `feishu` | Feishu/Lark 消息服务 |
| `wecom` | WeCom (微信工作) |
| `weixin` | Weixin (个人微信) |
| `bluebubbles` | 通过 BlueBubbles macOS 服务器的 Apple iMessage |
| `qqbot` | QQ Bot (腾讯 QQ) 通过官方 API v2 |
| `homeassistant` | Home Assistant 对话 |
| `webhook` | 入站 Webhooks |
| `api-server` | API 服务器请求 |
| `acp` | ACP 编辑器集成 |
| `cron` | 定时 cron 作业 |
| `batch` | 批量处理运行 |

## CLI 会话恢复

使用 `--continue` 或 `--resume` 选项从 CLI 恢复之前的对话：

### 继续上次会话

```bash
# 恢复最近的 CLI 会话
hermes --continue
hermes -c

# 或者使用 chat 子命令
hermes chat --continue
hermes chat -c
```

这会查找 SQLite 数据库中最最近的 `cli` 会话并加载其完整的对话历史记录。

### 按名称恢复

如果您为某个会话设置了标题（参见下文[会话命名](#session-naming)），则可以按名称恢复它：

```bash
# 恢复一个命名的会话
hermes -c "我的项目"

# 如果存在谱系变体（例如：“我的项目”、“我的项目 #2”、“我的项目 #3”），
# 这将自动恢复最新的一个
hermes -c "我的项目"   # → 恢复 "我的项目 #3"
```

### 恢复特定会话

```bash
# 按 ID 恢复特定的会话
hermes --resume 20250305_091523_a1b2c3d4
hermes -r 20250305_091523_a1b2c3d4

# 按标题恢复
hermes --resume "重构认证"

# 或者使用 chat 子命令
hermes chat --resume 20250305_091523_a1b2c3d4
```

会话 ID 在您退出 CLI 会话时显示，可以使用 `hermes sessions list` 进行查找。

### 恢复时的对话回顾

当您恢复一个会话时，Hermes 会在输入提示符之前，在一个样式化的面板中显示之前的对话摘要：

<img className="docs-terminal-figure" src={useBaseUrl('/img/docs/session-recap.svg')} alt="恢复 Hermes 会话时显示的、对先前对话的风格化预览。" />
<p className="docs-figure-caption">恢复模式会显示一个包含最近用户和助手回合的紧凑摘要面板，然后返回到实时提示符。</p>

回顾内容包括：
- 显示**用户消息**（金色 `●`）和**助手回复**（绿色 `◆`）
- **截断**长消息（用户 300 个字符，助手 200 个字符 / 3 行）
- 将**工具调用**折叠成一个带有工具名称的计数（例如：`[3 次工具调用: terminal, web_search]`）
- **隐藏**系统消息、工具结果和内部推理过程
- 以最后 10 个回合为上限，并显示“... N 个更早的消息...”指示符
- 使用**低调样式**来区分活跃的对话

要禁用摘要并保持最小化的单行行为，请在 `~/.hermes/config.yaml` 中设置：

```yaml
display:
  resume_display: minimal   # 默认值: full
```

:::tip
会话 ID 遵循 `YYYYMMDD_HHMMSS_<hex>` 格式——CLI/TUI 会话使用一个 6 字符的十六进制后缀（例如：`20250305_091523_a1b2c3`），网关会话使用一个 8 字符的后缀（例如：`20250305_091523_a1b2c3d4`）。您可以通过 ID（完整或唯一前缀）或通过标题进行恢复——两者都支持 `-c` 和 `-r`。
:::

## 跨平台交接 (Cross-Platform Handoff)

使用 CLI 会话中的 `/handoff <platform>` 命令，将实时对话转移到消息平台的主频道。**智能体**会从 CLI 停止的地方精确接手——包括相同的会话 ID、完整的角色感知转录、工具调用等。

```bash
# 在 CLI 会话中执行
/handoff telegram
```

发生了什么：

1.  CLI 验证 `<platform>` 是否已启用并且是否设置了主频道（从目标聊天中运行 `/sethome` 一次以进行配置）。
2.  CLI 将会话标记为待定，并**阻塞轮询网关**。如果智能体正在回复过程中，它将拒绝操作——请先等待当前的回复完成。
3.  网关监视器接管交接，并向目标适配器请求一个新的线程：
    *   **Telegram** — 打开一个新论坛主题（如果聊天中启用了 Bot API 9.4+ 的主题模式，则为 DM 主题；否则为论坛超级群组主题）。
    *   **Discord** — 在主文本频道下创建一个 1440 分钟的自动存档线程。
    *   **Slack** — 发布一条种子消息，并使用其 `ts` 作为线程锚点。
    *   **WhatsApp / Signal / Matrix / SMS** — 没有原生线程，直接回退到主频道。
4.  网关将目标键重新绑定到您现有的 CLI 会话 ID，然后伪造一个用户回合，要求**智能体**进行确认和摘要。回复会出现在新线程中。
5.  当网关确认成功后，CLI 会打印一个 `/resume` 提示并干净地退出：

   ```
   ↻ 交接完成。该会话现在在 telegram 上激活。
     稍后使用此 CLI 中的 /resume <会话标题> 来恢复它
   ```

6.  从那时起，对话就存在于该平台上。在新线程中回复——该频道内所有授权用户都共享同一个会话，并且任何后续的真实用户消息都会无缝地加入，因为线程会话键不包含 `user_id`。

**恢复到 CLI：** 当您想回到桌面时，只需运行 `/resume <标题>`（或从 shell 运行 `hermes -r "<标题>"`）并接上平台停止的地方即可。

**失败模式：**
-   未配置主频道 → CLI 会拒绝操作并显示一个 `/sethome` 提示。
-   平台未启用/网关未运行 → CLI 在 60 秒后超时，并给出清晰的消息，您的 CLI 会话保持完整。
-   线程创建失败（权限、主题模式关闭）→ 直接回退到主频道并仍然完成；没有线程隔离，但交接本身是成功的。
-   `adapter.send` 失败（速率限制、瞬时 API 错误）→ 交接被标记为失败并附上原因；该行会清除以便您重试。

**需要了解的局限性：** 对于具有多用户群组主频道的非线程支持平台，合成的回合键会被视为 DM 风格的会话。这适用于自发消息（DM）主频道（典型设置），但对于真正共享的群聊来说并不理想。Threading（线程化）涵盖了 Telegram / Discord / Slack——这是最常见的情况——因此大多数设置都不会遇到这个问题。

## 会话命名 (Session Naming)

为会话提供人类可读的标题，以便您可以轻松查找和恢复它们。

### 自动生成的标题

Hermes 在每次对话后都会自动为每个会话生成一个简短的描述性标题（3–7 个词）。这在一个后台线程中运行，使用一个快速辅助模型，因此不会增加延迟。当您使用 `hermes sessions list` 或 `hermes sessions browse` 浏览会话时，将看到这些自动生成的标题。

自动命名只对每个会话触发一次，如果已手动设置标题则跳过。

### 手动设置标题

在任何聊天会话（CLI 或网关）中使用 `/title` 命令：

```
/title 我的研究项目
```

标题会立即应用。如果会话尚未创建在数据库中（例如，您在发送第一条消息之前运行了 `/title`），它将被排队并在会话启动后应用。

您也可以从命令行重命名现有会话：

```bash
hermes sessions rename 20250305_091523_a1b2c3d4 "重构认证模块"
```

### 标题规则

- **唯一** — 没有两个会话可以拥有相同的标题
- **最大 100 个字符** — 保持列表输出的整洁
- **已清理** — 控制字符、零宽字符和 RTL（从右到左）重写字符会自动被剥离
- **正常 Unicode 均可** — emoji、CJK、带音调的字符都可用

### 压缩时的自动谱系 (Auto-Lineage on Compression)

当一个会话的上下文被压缩时（手动通过 `/compress` 或自动），Hermes 会创建一个新的延续会话。如果原始会话有标题，则新会话会自动获得一个编号的标题：

```
"我的项目" → "我的项目 #2" → "我的项目 #3"
```

当您按名称恢复（`hermes -c "我的项目"`）时，它会自动选择谱系中最新的那个会话。

### 消息平台中的 /title

`/title` 命令在所有网关平台上（Telegram, Discord, Slack, WhatsApp）都有效：

- `/title 我的研究` — 设置会话标题
- `/title` — 显示当前标题

## 会话管理命令 (Session Management Commands)

Hermes 通过 `hermes sessions` 提供一套完整的会话管理命令：

### 列出会话

```bash
# 列出最近的会话（默认: 20 个）
hermes sessions list

# 按平台过滤
hermes sessions list --source telegram

# 显示更多会话
hermes sessions list --limit 50
```

当会话有标题时，输出将显示标题、预览和相对时间戳：

```
Title                  Preview                                  Last Active   ID
────────────────────────────────────────────────────────────────────────────────────────────────
重构认证           请帮我重构一下认证模块       2 小时前        20250305_091523_a
我的项目 #3          你能检查一下测试失败吗？      昨天     20250304_143022_e
—                      在拉斯维加斯天气如何？       3 天前        20250303_101500_f
```

当没有会话有标题时，则使用更简单的格式：

```
Preview                                            Last Active   Src    ID
──────────────────────────────────────────────────────────────────────────────────────
请帮我重构一下认证模块       2 小时前        cli    20250305_091523_a
在拉斯维加斯天气如何？      3 天前        tele   20250303_101500_f
```

### 导出会话

```bash
# 将所有会话导出到 JSONL 文件
hermes sessions export backup.jsonl

# 从特定平台导出会话
hermes sessions export telegram-history.jsonl --source telegram

# 导出单个会话
hermes sessions export session.jsonl --session-id 20250305_091523_a1b2c3d4
```

导出的文件包含每行一个 JSON 对象，其中包含完整的会话元数据和所有消息。

### 删除会话

```bash
# 删除特定的会话（带确认）
hermes sessions delete 20250305_091523_a1b2c3d4

# 不带确认地删除
hermes sessions delete 20250305_091523_a1b2c3d4 --yes
```

### 重命名会话

```bash
# 设置或更改会话的标题
hermes sessions rename 20250305_091523_a1b2c3d4 "调试认证流程"

# 多词标题在 CLI 中不需要引号
hermes sessions rename 20250305_091523_a1b2c3d4 debugging auth flow
```

如果该标题已被其他会话使用，则会显示错误。

### 修剪旧会话 (Prune Old Sessions)

```bash
# 删除超过 90 天的已结束会话（默认）
hermes sessions prune

# 自定义年龄阈值
hermes sessions prune --older-than 30

# 只修剪来自特定平台的会话
hermes sessions prune --source telegram --older-than 60

# 跳过确认
hermes sessions prune --older-than 30 --yes
```

:::info
修剪操作只删除**已结束**的会话（已被显式结束或自动重置的会话）。活跃的会话永远不会被修剪。
:::

### 会话统计信息

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

如需更深入的分析——包括令牌使用量、成本估算、工具分解和活动模式——请使用 [`hermes insights`](/reference/cli-commands#hermes-insights)。

## 会话搜索工具

该智能体具有内置的 `session_search` 工具，该工具使用 SQLite 的 FTS5 引擎对所有过去的对话进行全文搜索——并允许智能体滚动浏览其找到的任何会话。不涉及 LLM 调用、摘要或截断。每个形状都返回数据库中的实际消息。

### 三种调用形状

该工具根据你设置的参数来推断你的意图。它没有 `mode` 参数。

**1. 发现（Discovery）— 传入 `query`：**

```python
session_search(query="auth refactor", limit=3)
```

运行 FTS5，按会话血缘关系去重叠结果，返回前 N 个会话。每个结果都包含：

- `session_id`、`title`、`when`、`source`
- `snippet` — FTS5 高亮匹配摘录
- `bookend_start` — 会话的前 3 条用户+助手消息（目标/启动）
- `messages` — 围绕 FTS5 匹配的 ±5 条消息，其中包含锚定消息（上下文中的命中）
- `bookend_end` — 会话的后 3 条用户+助手消息（解决方案/决策）
- `match_message_id`、`messages_before`、`messages_after`

书本末尾信息（Bookends）与窗口结合起来，可以在不支付整个对话记录费用的情况下重建目标 → 匹配 → 解决方案。典型的墙壁时间：在真实的会话数据库上为 15–50ms。

**2. 滚动（Scroll）— 传入 `session_id` + `around_message_id`：**

```python
session_search(session_id="20260510_174648_805cc2", around_message_id=590803, window=10)
```

返回以锚点为中心，包含 ±`window` 条消息的窗口。不涉及 FTS5，没有书本末尾信息——只有切片。当你需要比默认的 ±5 窗口更多的上下文时，在发现调用之后使用此功能。

- 要**向前滚动**：将 `messages[-1].id` 作为 `around_message_id` 返回
- 要**向后滚动**：将 `messages[0].id` 作为 `around_message_id` 返回
- 边界消息会同时出现在两个窗口中，作为方向标记
- 当 `messages_before` 或 `messages_after` 小于 `window` 时，则处于会话的开始或结束

典型的墙壁时间：每次滚动调用 1–2ms。

**3. 浏览（Browse）— 无参数：**

```python
session_search()
```

返回按时间顺序排列的最近会话（标题、预览、时间戳）。当用户问“我之前在做什么”而没有指定主题时，此功能特别有用。

### FTS5 查询语法

关键词模式支持标准的 FTS5 查询语法：

- 简单关键词：`docker deployment` (FTS5 默认为 AND)
- 短语：`"exact phrase"`
- 布尔逻辑：`docker OR kubernetes`，`python NOT java`
- 前缀：`deploy*`

### 可选参数

- `sort` — `newest`（最新）或 `oldest`（最旧），在 FTS5 排名之外进行排序。如果只关注相关性排序（默认；适用于探索性回忆），则省略此项。对于“我们上次停在哪里了”这类问题，使用 `newest`；对于“X 是如何开始的”这类问题，使用 `oldest`。
- `role_filter` — 要包含的角色，用逗号分隔。发现（Discovery）默认包括 `user,assistant`（工具输出通常是噪音）。传入 `user,assistant,tool` 以包含工具输出（用于调试工具行为），或仅传入 `tool` 以搜索工具输出。

### 使用场景

智能体会被提示自动使用会话搜索：

> “当用户引用过去的对话内容，或者你怀疑存在相关的先前上下文时，请使用 session_search 来回忆它，然后再要求他们重复。”

典型的触发器包括：“我们以前做过这个”、“还记得那时吗”、“上次”、“正如我提到的”，或任何对当前窗口之外的项目/人物/概念的引用。

## 平台级会话跟踪

### 网关会话（Gateway Sessions）

在消息平台上，会话以由消息源构建的确定性会话密钥进行键控：

| 聊天类型 | 默认密钥格式 | 行为 |
|-----------|--------------------|----------|
| Telegram DM | `agent:main:telegram:dm:<chat_id>` | 每个 DM 聊天对应一个会话 |
| Discord DM | `agent:main:discord:dm:<chat_id>` | 每个 DM 聊天对应一个会话 |
| WhatsApp DM | `agent:main:whatsapp:dm:<canonical_identifier>` | 每个 DM 用户对应一个会话（当存在映射时，LID/电话别名合并为一个身份） |
| 群聊 | `agent:main:<platform>:group:<chat_id>:<user_id>` | 当平台暴露用户 ID 时，每个群内用户都对应一个会话 |
| 群组线程/话题 | `agent:main:<platform>:group:<chat_id>:<thread_id>` | 所有线程参与者共享一个会话（默认）。如果设置了 `thread_sessions_per_user: true` 则为每个用户。 |
| 频道 | `agent:main:<platform>:channel:<chat_id>:<user_id>` | 当平台暴露用户 ID 时，每个频道内用户对应一个会话 |

当 Hermes 无法获取共享聊天参与者的标识符时，它会回退到对该房间进行一次共享会话。

### 共享会话 vs. 隔离会话

默认情况下，Hermes 在 `config.yaml` 中使用 `group_sessions_per_user: true`。这意味着：

- Alice 和 Bob 都可以与 Hermes 在同一个 Discord 频道中交流，而不会共享对话历史记录
- 一个用户的长时间、重度依赖工具的任务不会污染另一个用户的上下文窗口
- 流程中断处理也保持为每个用户（因为运行的智能体键匹配隔离会话密钥）

如果你想要一个共享的“房间大脑”，请设置：

```yaml
group_sessions_per_user: false
```

这将使群组/频道恢复为每个房间的一个共享会话，这既保留了共享的对话上下文，也共享了令牌成本、中断状态和上下文增长。

### 会话重置策略

网关会话根据可配置的策略自动重置：

- **idle**（空闲）— 在 N 分钟不活动后重置
- **daily**（每日）— 每天在特定小时重置
- **both**（两者都）— 以先发生者为准（空闲或每日）
- **none**（无）— 从不自动重置

在会话被自动重置之前，智能体有机会保存对话中任何重要的记忆或技能。

具有**活动后台进程**的会话永远不会自动重置，无论策略如何。

## 存储位置

| 内容 | 路径 | 描述 |
|------|------|-------------|
| SQLite 数据库 | `~/.hermes/state.db` | 所有会话元数据 + 消息（包含 FTS5） |
| 网关消息 | `~/.hermes/state.db` | SQLite — 所有会话消息的规范存储库 |
| 网关路由索引 | `~/.hermes/sessions/sessions.json` | 将会话密钥映射到活动会话 ID（来源元数据、过期标志） |

SQLite 数据库使用 WAL 模式，支持并发读取和单个写入，这非常适合网关的多平台架构。

:::warning `sessions.json` 不是会话列表
`~/.hermes/sessions/sessions.json` 是**网关路由索引**——它将消息会话密钥（`agent:main:<platform>:...`）映射到活动会话 ID。它只包含网关/消息条目，因此如果你运行一个消息平台，你只会看到这些条目（例如 `agent:main:whatsapp:dm:...`）。

这是**正常的**，并不意味着你的 CLI 会话丢失了。
`hermes sessions list`、`/sessions` 和仪表板都读取 `state.db`，该文件包含了**所有**会话（CLI、TUI 和网关）。位于 `~/.hermes/sessions/saved/*.json` 下的 `/save` 快照是便利的导出，而不是索引。

如果 CLI 会话确实没有出现在 `hermes sessions list` 中，那么原因在于 `state.db` 没有接收到它们——请运行 `hermes sessions repair` 并留意 CLI 启动时出现的 `⚠ Session store unavailable`（会话存储不可用）警告，这表示该次运行的 SQLite 持久性失败了。
:::

:::note 遗留 JSONL 转录本
在 state.db 成为规范之前创建的会话可能在 `~/.hermes/sessions/` 中留下 `*.jsonl` 文件。Hermes 不再读取或写入这些文件。验证相应的会话存在于 state.db 后，可以安全地删除它们。
:::

### 数据库模式（Database Schema）

`state.db` 中的关键表：

- **sessions** — 会话元数据（ID、来源、用户 ID、模型、标题、时间戳、令牌计数）。标题有一个唯一索引（允许 NULL 标题，只有非 NULL 的才必须是唯一的）。
- **messages** — 完整的消息历史记录（角色、内容、工具调用、工具名称、令牌计数）
- **messages_fts** — 用于跨消息内容的 FTS5 虚拟表

## 会话过期和清理

### 自动清理

- 网关会话根据配置的重置策略自动重置。
- 在重置之前，智能体会被要求保存即将过期的会话中的任何重要记忆或技能。
- **选择加入的自动修剪（Opt-in auto-pruning）**：当 `sessions.auto_prune` 为 `true` 时，比 `sessions.retention_days`（默认 90 天）更老的已结束会话会在 CLI/网关启动时被修剪。
- 在实际删除了行记录的修剪之后，`state.db` 会被 `VACUUM` 以回收磁盘空间（SQLite 不会在普通 DELETE 时缩小文件）。
- 修剪最多每 `sessions.min_interval_hours`（默认 24 小时）运行一次；上次运行的时间戳存储在 `state.db` 内部，因此它在同一 `HERMES_HOME` 下的每个 Hermes 进程中都是共享的。

默认设置是**关闭**——会话历史对于 `session_search` 的回忆至关重要，默默地删除它们可能会让用户感到意外。请在 `~/.hermes/config.yaml` 中启用它：

```yaml
sessions:
  auto_prune: true          # 选择加入 — 默认是 false
  retention_days: 90        # 保留已结束会话的天数
  vacuum_after_prune: true  # 修剪后回收磁盘空间
  min_interval_hours: 24    # 不要比这个时间间隔更频繁地运行修剪
```

活动会话无论年龄大小，都不会被自动修剪。

### 手动清理

```bash
# 修剪超过 90 天的会话
hermes sessions prune

# 删除特定的会话
hermes sessions delete <session_id>

# 在修剪之前导出（备份）
hermes sessions export backup.jsonl
hermes sessions prune --older-than 30 --yes
```

:::tip
数据库增长缓慢（典型：数百个会话占用 10-15 MB），而会话历史为 `session_search` 的回忆提供了支持，因此自动修剪功能默认禁用。如果你的网关/cron 工作负载很重，并且 `state.db` 对性能有实质性影响（观察到的故障模式：384 MB 的 state.db 伴随约 1000 个会话减慢 FTS5 插入和 `/resume` 列表），请启用它。使用 `hermes sessions prune` 进行一次性清理，而不是开启自动修剪。
:::