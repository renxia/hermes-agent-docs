---
sidebar_position: 3
title: "Persistent Memory"
description: "How Hermes Agent remembers across sessions — MEMORY.md, USER.md, and session search"
---

# 持久化记忆

Hermes 智能体拥有有限且经过精心管理的记忆，可在不同会话间持久保存。这使得它能够记住您的偏好、项目、环境以及已学习的内容。

## 工作原理

两个文件构成了智能体的记忆：

| 文件 | 用途 | 字符限制 |
|------|---------|------------|
| **MEMORY.md** | 智能体的个人笔记 — 环境事实、约定、已学习的内容 | 2,200 字符（约 800 个 token） |
| **USER.md** | 用户档案 — 您的偏好、沟通风格、期望 | 1,375 字符（约 500 个 token） |

两者均存储在 `~/.hermes/memories/` 中，并在会话开始时被作为冻结快照注入系统提示。智能体通过 `memory` 工具管理自身记忆 — 可以添加、替换或删除条目。

:::info
字符限制使记忆保持聚焦。记忆**不会**自动压缩：当写入操作超出限制时，`memory` 工具会返回错误而非静默丢弃条目。随后智能体会自行腾出空间 — 在同一轮中整合或删除条目后重试（详见[记忆满时会发生什么](#记忆满时会发生什么)）。请注意，`replace` 同样受限制约束：将一个条目替换为更长的条目仍可能导致溢出，因此必须缩短新内容（或删除另一个条目）以适应限制。
:::

## 记忆在系统提示词中的呈现方式

每次会话开始时，记忆条目会从磁盘加载并渲染到系统提示词中，形成一个冻结块：

```
══════════════════════════════════════════════
MEMORY (your personal notes) [67% — 1,474/2,200 chars]
══════════════════════════════════════════════
User's project is a Rust web service at ~/code/myapi using Axum + SQLx
§
This machine runs Ubuntu 22.04, has Docker and Podman installed
§
User prefers concise responses, dislikes verbose explanations
```

格式包括：
- 显示存储区（MEMORY 或 USER PROFILE）的标题头
- 使用百分比和字符数，以便智能体了解容量
- 各个条目以 `§`（分节符）分隔
- 条目可以是多行的

**冻结快照模式：** 系统提示词注入在会话开始时捕获一次，会话期间不再更改。这是有意为之——为了性能，它保留了 LLM 的前缀缓存。当智能体在会话中添加/删除记忆条目时，更改会立即持久化到磁盘，但直到下次会话开始才会出现在系统提示词中。工具响应始终显示实时状态。

## 记忆工具操作

智能体使用 `memory` 工具执行以下操作：

- **add** — 添加新记忆条目
- **replace** — 用更新后的内容替换现有条目（通过 `old_text` 进行子字符串匹配）
- **remove** — 删除不再相关的条目（通过 `old_text` 进行子字符串匹配）

没有 `read` 操作——记忆内容在会话开始时自动注入到系统提示词中。智能体将记忆视为其对话上下文的一部分。

### 子字符串匹配

`replace` 和 `remove` 操作使用短唯一子字符串匹配——你不需要完整的条目文本。`old_text` 参数只需是一个能唯一定位一个条目的子字符串：

```python
# 如果记忆中包含 "User prefers dark mode in all editors"
memory(action="replace", target="memory",
       old_text="dark mode",
       content="User prefers light mode in VS Code, dark mode in terminal")
```

如果子字符串匹配到多个条目，将返回错误，要求提供更具体的匹配。

## 两个目标详解

### `memory` — 智能体的个人笔记

用于智能体需要记住的关于环境、工作流和经验教训的信息：

- 环境信息（操作系统、工具、项目结构）
- 项目约定和配置
- 发现的工具特性和变通方法
- 已完成任务的日记条目
- 有效的技能和技术

### `user` — 用户档案

用于关于用户身份、偏好和沟通风格的信息：

- 姓名、角色、时区
- 沟通偏好（简洁 vs 详细、格式偏好）
- 忌讳和需要避免的事项
- 工作流习惯
- 技术水平

## 什么该保存 vs 跳过

### 这些需要保存（主动保存）

智能体自动保存——你不需要提出要求。当了解到以下信息时会自动保存：

- **用户偏好：** "I prefer TypeScript over JavaScript" → 保存到 `user`
- **环境信息：** "This server runs Debian 12 with PostgreSQL 16" → 保存到 `memory`
- **纠正：** "Don't use `sudo` for Docker commands, user is in docker group" → 保存到 `memory`
- **约定：** "Project uses tabs, 120-char line width, Google-style docstrings" → 保存到 `memory`
- **已完成的工作：** "Migrated database from MySQL to PostgreSQL on 2026-01-15" → 保存到 `memory`
- **明确请求：** "Remember that my API key rotation happens monthly" → 保存到 `memory`

### 这些需要跳过

- **琐碎/显而易见的信息：** "User asked about Python" — 太模糊没有用处
- **容易重新发现的事实：** "Python 3.12 supports f-string nesting" — 可以网络搜索
- **原始数据转储：** 大段代码、日志文件、数据表格 — 对记忆来说太大
- **会话特定的临时信息：** 临时文件路径、一次性调试上下文
- **上下文中已有的信息：** SOUL.md 和 AGENTS.md 的内容

## 容量管理

记忆有严格的字符限制以保持系统提示词有界：

| 存储区 | 限制 | 典型条目数 |
|--------|------|-----------|
| memory | 2,200 字符 | 8-15 条 |
| user | 1,375 字符 | 5-10 条 |

### 记忆已满时会发生什么

当你尝试添加超出限制的条目时，工具会返回错误：

```json
{
  "success": false,
  "error": "Memory at 2,100/2,200 chars. Adding this entry (250 chars) would exceed the limit. Consolidate now: use 'replace' to merge overlapping entries into shorter ones or 'remove' stale or less important entries (see current_entries below), then retry this add — all in this turn.",
  "current_entries": ["..."],
  "usage": "2,100/2,200"
}
```

智能体随后应该：
1. 读取当前条目（显示在错误响应中）
2. 识别可以删除或合并的条目
3. 使用 `replace` 将相关条目合并为更短的版本
4. 然后 `add` 新条目

**最佳实践：** 当记忆超过 80% 容量时（在系统提示词标题头中可见），在添加新条目之前先合并条目。例如，将三个独立的"项目使用 X"条目合并为一个全面的项目描述条目。

### 好的记忆条目实用示例

**紧凑、信息密集的条目效果最好：**

```
# Good: 包含多个相关事实
User runs macOS 14 Sonoma, uses Homebrew, has Docker Desktop and Podman. Shell: zsh with oh-my-zsh. Editor: VS Code with Vim keybindings.

# Good: 具体、可操作的约定
Project ~/code/api uses Go 1.22, sqlc for DB queries, chi router. Run tests with 'make test'. CI via GitHub Actions.

# Good: 带有上下文的经验教训
The staging server (10.0.1.50) needs SSH port 2222, not 22. Key is at ~/.ssh/staging_ed25519.

# Bad: 太模糊
User has a project.

# Bad: 太冗长
On January 5th, 2026, the user asked me to look at their project which is
located at ~/code/api. I discovered it uses Go version 1.22 and...
```

## 重复预防

记忆系统自动拒绝完全重复的条目。如果你尝试添加已存在的内容，它会返回成功并附带"未添加重复项"的消息。

## 安全扫描

记忆条目在被接受之前会进行注入和渗出模式的扫描，因为它们会被注入到系统提示词中。匹配威胁模式（提示词注入、凭证渗出、SSH 后门）或包含不可见 Unicode 字符的内容会被阻止。

## 会话搜索

除了 MEMORY.md 和 USER.md，智能体可以使用 `session_search` 工具搜索过去的对话：

- 所有 CLI 和消息会话都存储在 SQLite（`~/.hermes/state.db`）中，支持 FTS5 全文搜索
- 搜索查询返回数据库中的实际消息——不使用 LLM 摘要，不截断
- 智能体可以找到几周前讨论过的内容，即使它们不在活动记忆中
- 智能体还可以在任何找到的会话中向前/向后滚动

```bash
hermes sessions list    # 浏览过去的会话
```

参见[会话搜索工具](/user-guide/sessions#session-search-tool)了解三种调用形式（发现 / 滚动 / 浏览）和响应格式。

### session_search vs memory

| 特性 | 持久记忆 | 会话搜索 |
|------|---------|---------|
| **容量** | 总共约 1,300 个 token | 无限制（所有会话） |
| **速度** | 即时（在系统提示词中） | 约 20ms FTS5 查询，约 1ms 滚动 |
| **成本** | 每个提示词消耗 token | 免费——无需 LLM 调用 |
| **用例** | 始终可用的关键事实 | 查找特定过去的对话 |
| **管理** | 由智能体手动管理 | 自动——所有会话都被存储 |
| **Token 成本** | 每会话固定（约 1,300 token） | 按需（搜索时才消耗） |

**记忆**用于应始终在上下文中的关键事实。**会话搜索**用于"我们上周讨论过 X 吗？"这类查询，智能体需要回忆过去对话中的具体细节。

## 配置

```yaml
# 在 ~/.hermes/config.yaml 中
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # ~800 tokens
  user_char_limit: 1375     # ~500 tokens
  write_approval: false     # false = 自由写入（默认） | true = 需要审批
```

## 控制记忆写入（`write_approval`）

默认情况下智能体自由保存记忆——包括每轮之后运行的后台自我改进审查。如果你希望在保存前先审批，设置 `memory.write_approval: true`。它是一个简单的开关，适用于**前台轮次和后台审查**：

| `write_approval` | 行为 |
|------------------|------|
| `false`（默认） | 自由写入——开关关闭（预开关行为）。 |
| `true` | 任何保存前都需要审批。在交互式 CLI 中，前台写入会内联提示你（条目足够小可以完整阅读）。在其他地方——消息平台、脚本和后台自我改进审查——写入会被**暂存**，通过 `/memory pending` 供审查。 |

> 要完全关闭记忆（不仅仅是限制它），设置 `memory_enabled: false`。

从 CLI 或任何消息平台审查暂存的写入：

```
/memory pending             # 列出暂存的记忆写入（自动的标记为 [auto]）
/memory approve <id>        # 应用一个（或 'all'）
/memory reject <id>         # 丢弃一个（或 'all'）
/memory approval on         # 打开（或关闭）开关并持久化
```

这是对"智能体保存了关于我的错误假设"这一问题的回答：设置 `write_approval: true`，每次保存——尤其是无提示的后台保存——都会等待你的确认，然后才会进入你的档案。

## 后台审查通知（`display.memory_notifications`）

每轮之后，后台自我改进审查可能会静默保存记忆或更新技能。这是 Hermes 的知情同意学习循环：重复的纠正和持久的工作流经验教训成为紧凑的记忆条目或程序性技能，而 `write_approval` 可以在它们影响未来会话之前暂存这些写入以供审查。默认情况下它会在聊天中显示一行简短的 `💾 Memory updated`，让你知道发生了这件事。控制其详细程度：

```yaml
display:
  memory_notifications: on    # off | on（默认） | verbose
```

| 值 | 行为 |
|----|------|
| `off` | 无聊天通知。审查仍然运行并仍然写入——只是你看不到相关行。 |
| `on`（默认） | 通用行，如 `💾 Memory updated`、`💾 Skill 'foo' patched`。 |
| `verbose` | 包含更改的紧凑预览，如 `💾 Memory ➕ User prefers terse replies` 或 `"old" → "new"` 技能差异片段。 |

> 这仅控制**网关**聊天通知。审查本身以及写入你的记忆/存储区不受此设置影响。通过 `display.platforms.<platform>.memory_notifications` 按平台设置。

## 在更便宜的模型上运行审查（`auxiliary.background_review`）

审查默认在您的**主聊天模型**上运行，重放对话——由于对话已经在提示缓存中预热，因此读取缓存的成本很低。在昂贵的主模型上，您可以改为在更便宜的模型上运行审查：

```yaml
auxiliary:
  background_review:
    provider: openrouter
    model: google/gemini-3-flash-preview   # auto（默认）= 主聊天模型
```

当您将其指向与主模型**不同**的模型时，审查会在该模型上运行，成本大幅降低（基准测试中约为 3–5 倍）。由于不同的模型无法复用主模型的提示缓存，分叉会自动重放对话的紧凑**摘要**（最近的轮次逐字还原 + 较早轮次的摘要），而非完整转录——从而最小化写入新缓存的内容。捕获效果：在测试中，记忆捕获与主模型审查完全相同，技能捕获几乎相同。

保持为 `auto`（或将其设置为主模型），一切不变——审查继续在主模型上运行，使用完整的热缓存重放。

## 控制技能写入（`skills.write_approval`）

技能使用相同的开/关门禁，但审查用户体验不同，因为 `SKILL.md` 太大，无法在聊天气泡中阅读：

```yaml
skills:
  write_approval: false     # false = 自由写入（默认）| true = 需要审批
```

当 `write_approval: true` 时，技能写入（创建 / 编辑 / 补丁 / 写入文件 / 删除）无论来源如何，始终**暂存**。您可以在线查看单行摘要，但完整的差异保持在带外：

```
/skills pending             # 列出暂存的技能写入 + 每条的单行摘要
/skills diff <id>           # 完整统一差异（建议在 CLI 或仪表板中查看）
/skills approve <id>        # 应用（或 'all'）
/skills reject <id>         # 丢弃（或 'all'）
/skills approval on         # 开启（或 '关闭'）门禁并持久化
```

在消息平台上，可以通过摘要 + 元数据审批技能，或者在 CLI / 仪表板上运行 `/skills diff`，或在需要查看完整更改时查看 `~/.hermes/pending/skills/<id>.json` 下的暂存文件。完整详情请参阅[门禁智能体技能写入](/user-guide/features/skills#gating-agent-skill-writes-skillswrite_approval)。


## 外部记忆提供者

对于超越 MEMORY.md 和 USER.md 的更深层持久记忆，Hermes 附带了 8 个外部记忆提供者插件——包括 Honcho、OpenViking、Mem0、Hindsight、Holographic、RetainDB、ByteRover 和 Supermemory。

外部提供者与内置记忆**并行**运行（从不取代内置记忆），并添加知识图谱、语义搜索、自动事实提取和跨会话用户建模等功能。

```bash
hermes memory setup      # 选择提供者并进行配置
hermes memory status     # 检查当前激活的内容
```

有关每个提供者的完整详情、设置说明和比较，请参阅[记忆提供者](./memory-providers.md)指南。