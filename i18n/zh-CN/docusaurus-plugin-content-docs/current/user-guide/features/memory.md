---
sidebar_position: 3
title: "持久化记忆"
description: "Hermes 智能体如何跨会话记忆 — MEMORY.md、USER.md 与会话搜索"
---

# 持久化记忆

Hermes 智能体拥有有限的、精心管理的记忆，并能在不同会话间保持。这使其能够记住你的偏好、项目、环境以及学到的知识。

## 工作原理

智能体的记忆由两个文件构成：

| 文件 | 用途 | 字符限制 |
|------|------|----------|
| **MEMORY.md** | 智能体的个人笔记 — 环境事实、规范、学到的东西 | 2,200 字符 (~800 个令牌) |
| **USER.md** | 用户档案 — 你的偏好、沟通风格、期望 | 1,375 字符 (~500 个令牌) |

两者均存储在 `~/.hermes/memories/` 中，并在会话开始时作为冻结快照注入到系统提示中。智能体通过 `memory` 工具管理自己的记忆 — 它可以添加、替换或删除条目。

:::info
字符限制使记忆保持专注。当记忆空间已满时，智能体会整合或替换条目，以便为新信息腾出空间。
:::

## 记忆在系统提示中的呈现方式

在每次会话开始时，记忆条目会从磁盘加载并渲染为冻结块注入系统提示：

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
- 一个显示存储区域（MEMORY 或 USER PROFILE）的标题
- 使用百分比和字符数，以便智能体了解容量
- 单个条目由 `§`（节符号）分隔符分隔
- 条目可以是多行的

**冻结快照模式：** 系统提示注入在会话开始时捕获一次，并在会话期间永不改变。这是有意为之的 — 它保留了大语言模型的前缀缓存以提高性能。当智能体在会话期间添加/删除记忆条目时，更改会立即持久化到磁盘，但直到下次会话开始时才会出现在系统提示中。工具响应始终显示实时状态。

## 记忆工具操作

智能体使用 `memory` 工具执行以下操作：

- **add** — 添加新的记忆条目
- **replace** — 用更新后的内容替换现有条目（通过 `old_text` 使用子字符串匹配）
- **remove** — 删除不再相关的条目（通过 `old_text` 使用子字符串匹配）

没有 `read` 操作 — 记忆内容在会话开始时自动注入系统提示。智能体将其记忆视为其对话上下文的一部分。

### 子字符串匹配

`replace` 和 `remove` 操作使用简短的唯一子字符串匹配 — 你不需要完整的条目文本。`old_text` 参数只需要是能唯一标识一个条目的子字符串：

```python
# 如果记忆包含 "User prefers dark mode in all editors"
memory(action="replace", target="memory",
       old_text="dark mode",
       content="User prefers light mode in VS Code, dark mode in terminal")
```

如果子字符串匹配多个条目，将返回错误，要求更具体的匹配。

## 两种目标详解

### `memory` — 智能体的个人笔记

用于智能体需要记住的关于环境、工作流程和经验教训的信息：

- 环境事实（操作系统、工具、项目结构）
- 项目规范和配置
- 发现的工具怪癖和解决方法
- 已完成的任务日志条目
- 成功的技能和技术

### `user` — 用户档案

用于用户身份、偏好和沟通风格的信息：

- 姓名、角色、时区
- 沟通偏好（简洁 vs 详细，格式偏好）
- 忌讳和需要避免的事情
- 工作流程习惯
- 技术技能水平

## 应保存与应跳过的内容

### 保存这些（主动保存）

智能体会自动保存 — 你无需请求。它会在学到以下信息时保存：

- **用户偏好：** "我更喜欢 TypeScript 而不是 JavaScript" → 保存到 `user`
- **环境事实：** "此服务器运行 Debian 12 和 PostgreSQL 16" → 保存到 `memory`
- **更正：** "Docker 命令不要用 `sudo`，用户已在 docker 组中" → 保存到 `memory`
- **规范：** "项目使用制表符，行宽 120 字符，Google 风格文档字符串" → 保存到 `memory`
- **已完成的工作：** "2026-01-15 将数据库从 MySQL 迁移到了 PostgreSQL" → 保存到 `memory`
- **明确的请求：** "记住我的 API 密钥每月轮换一次" → 保存到 `memory`

### 跳过这些

- **琐碎/显而易见的信息：** "用户问了关于 Python 的问题" — 太模糊，没有用
- **容易重新发现的事实：** "Python 3.12 支持 f-string 嵌套" — 可以通过网络搜索找到
- **原始数据转储：** 大型代码块、日志文件、数据表 — 太大不适合记忆
- **特定于会话的临时信息：** 临时文件路径、一次性的调试上下文
- **上下文文件中已有的信息：** SOUL.md 和 AGENTS.md 的内容

## 容量管理

记忆有严格的字符限制以保持系统提示的边界：

| 存储 | 限制 | 典型条目数 |
|------|------|------------|
| memory | 2,200 字符 | 8-15 条目 |
| user | 1,375 字符 | 5-10 条目 |

### 记忆空间已满时会发生什么

当你尝试添加一个会超出限制的条目时，工具会返回一个错误：

```json
{
  "success": false,
  "error": "Memory at 2,100/2,200 chars. Adding this entry (250 chars) would exceed the limit. Replace or remove existing entries first.",
  "current_entries": ["..."],
  "usage": "2,100/2,200"
}
```

智能体随后应该：
1. 读取当前条目（在错误响应中显示）
2. 识别可以删除或整合的条目
3. 使用 `replace` 将相关条目合并为更短的版本
4. 然后 `add` 新条目

**最佳实践：** 当记忆容量超过 80%（在系统提示头部可见）时，在添加新条目前先整合现有条目。例如，将三个独立的 "项目使用 X" 条目合并为一个综合性的项目描述条目。

### 良好记忆条目的实际示例

**紧凑、信息密集的条目效果最佳：**

```
# 好的：打包多个相关事实
User runs macOS 14 Sonoma, uses Homebrew, has Docker Desktop and Podman. Shell: zsh with oh-my-zsh. Editor: VS Code with Vim keybindings.

# 好的：具体、可操作的规范
Project ~/code/api uses Go 1.22, sqlc for DB queries, chi router. Run tests with 'make test'. CI via GitHub Actions.

# 好的：附带上下文的经验教训
The staging server (10.0.1.50) needs SSH port 2222, not 22. Key is at ~/.ssh/staging_ed25519.

# 坏的：太模糊
User has a project.

# 坏的：太冗长
On January 5th, 2026, the user asked me to look at their project which is
located at ~/code/api. I discovered it uses Go version 1.22 and...
```

## 重复预防

记忆系统会自动拒绝完全重复的条目。如果你尝试添加已存在的内容，它会返回成功，并附带 "未添加重复项" 的消息。

## 安全扫描

记忆条目在接受前会扫描注入和泄露模式，因为它们会被注入到系统提示中。匹配威胁模式（提示注入、凭证泄露、SSH 后门）或包含不可见 Unicode 字符的内容将被阻止。

## 会话搜索

除了 MEMORY.md 和 USER.md，智能体还可以使用 `session_search` 工具搜索其过去的对话：

- 所有 CLI 和消息会话都存储在 SQLite (`~/.hermes/state.db`) 中，并带有 FTS5 全文搜索
- 搜索查询返回数据库中的实际消息 — 没有大语言模型的摘要，没有截断
- 智能体可以找到几周前讨论过的事情，即使它们不在其活动记忆中
- 智能体还可以在其找到的任何会话中向前/向后滚动浏览

```bash
hermes sessions list    # 浏览过去的会话
```

参见 [会话搜索工具](/user-guide/sessions#session-search-tool) 了解三种调用形式（发现 / 滚动 / 浏览）和响应格式。

### session_search 与 memory 的比较

| 功能 | 持久化记忆 | 会话搜索 |
|------|------------|----------|
| **容量** | 总计约 1,300 个令牌 | 无限制（所有会话） |
| **速度** | 即时（在系统提示中） | FTS5 查询约 20ms，滚动约 1ms |
| **成本** | 每个提示中的令牌成本 | 免费 — 无大语言模型调用 |
| **用例** | 始终可用的关键事实 | 查找特定的过往对话 |
| **管理** | 由智能体手动管理 | 自动 — 存储所有会话 |
| **令牌成本** | 每会话固定（约 1,300 个令牌） | 按需（需要时搜索） |

**记忆** 用于应始终在上下文中的关键事实。**会话搜索** 用于 "我们上周讨论过 X 吗？" 这类查询，智能体需要回忆过去对话中的具体细节。

## 配置

```yaml
# 在 ~/.hermes/config.yaml 中
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # ~800 个令牌
  user_char_limit: 1375     # ~500 个令牌
```

## 外部记忆提供商

为了获得超越 MEMORY.md 和 USER.md 的更深入、持久的记忆，Hermes 附带了 8 个外部记忆提供商插件 — 包括 Honcho、OpenViking、Mem0、Hindsight、Holographic、RetainDB、ByteRover 和 Supermemory。

外部提供商与内置记忆**并行运行**（从不替代），并增加了诸如知识图谱、语义搜索、自动事实提取和跨会话用户建模等功能。

```bash
hermes memory setup      # 选择一个提供商并进行配置
hermes memory status     # 检查当前活动的提供商
```

详见 [记忆提供商](./memory-providers.md) 指南，了解每个提供商的完整详情、设置说明和对比。