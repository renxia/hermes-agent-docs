---
title: "Honcho"
sidebar_label: "Honcho"
description: "配置和使用Hermes的Honcho内存——包括跨会话用户建模、多配置文件对等体隔离、观察配置、辩证推理、会话摘要和上下文预算强制执行。"
---

{/* 本页面由网站/scripts/generate-skill-docs.py 根据技能的SKILL.md自动生成。请编辑源文件SKILL.md，而不是本页面。 */}

# Honcho

配置和使用Hermes的Honcho内存——包括跨会话用户建模、多配置文件对等体隔离、观察配置、辩证推理、会话摘要和上下文预算强制执行。当设置Honcho、故障排除内存问题、与Honcho智能体管理配置文件或调整观察、召回和辩证设置时使用。

## Skill metadata

| | |
|---|---|
| Source | Optional — install with `hermes skills install official/autonomous-ai-agents/honcho` |
| Path | `optional-skills/autonomous-ai-agents/honcho` |
| Version | `2.0.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `Honcho`, `Memory`, `Profiles`, `Observation`, `Dialectic`, `User-Modeling`, `Session-Summary` |
| Related skills | [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## 关键路径和配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥和秘密信息（如果设置了$HERMES_HOME）
```

# Honcho for Hermes 的记忆功能

Honcho 提供 AI 原生的跨会话用户建模。它能了解用户在不同对话中的身份，并在共享统一的用户视图的同时，赋予每个 Hermes 配置文件其独立的同伴身份。

## 何时使用

- 设置 Honcho（云端或自托管）
- 故障排除记忆功能不工作/同伴未同步的问题
- 创建多个配置文件的设置，其中每个智能体都有自己的 Honcho 同伴
- 调整观察、回忆、辩证深度或写入频率设置
- 理解 5 个 Honcho 工具的功能及其使用时机
- 配置上下文预算和会话摘要注入

## 设置

### 云端 (app.honcho.dev)

```bash
hermes memory setup honcho
# 选择 "cloud"，粘贴来自 https://app.honcho.dev 的 API 密钥
```

### 自托管

```bash
hermes memory setup honcho
# 选择 "local"，输入基础 URL（例如 http://localhost:8000）
```

参见：https://docs.honcho.dev/v3/guides/integrations/hermes#running-honcho-locally-with-hermes

### 验证

```bash
hermes honcho status    # 显示已解析的配置、连接测试、同伴信息
```

## 架构

### 基础上下文注入

当 Honcho 将上下文注入到系统提示中（在 `hybrid` 或 `context` 回忆模式下）时，它会按以下顺序组装基础上下文块：

1. **会话摘要** -- 对当前会话的简短概览（首先放置，以便模型能立即获得对话连贯性）
2. **用户表示** -- Honcho 积累的用户模型（偏好、事实、模式）
3. **AI 同伴卡片** -- 该 Hermes 配置文件的 AI 同伴身份卡

会话摘要由 Honcho 在每个回合开始时自动生成（如果存在先前的会话）。它为模型提供了一个良好的起点，而无需重播完整的历史记录。

### 冷启动 / 热启动提示选择

Honcho 会自动在两种提示策略之间进行选择：

| 条件 | 策略 | 会发生什么 |
|-----------|----------|--------------|
| 没有先前的会话或表示为空 | **冷启动** | 轻量级的介绍性提示；跳过摘要注入；鼓励模型学习用户信息 |
| 存在表示和/或会话历史记录 | **热启动** | 完全的基础上下文注入（摘要 → 表示 → 卡片）；更丰富的系统提示 |

您无需配置此项——它是基于会话状态的自动功能。

### 同伴 (Peers)

Honcho 将对话建模为**同伴**之间的交互。Hermes 为每个会话创建两个同伴：

- **用户同伴** (`peerName`)：代表人类。Honcho 从观察到的消息中构建用户表示。
- **AI 同伴** (`aiPeer`)：代表此 Hermes 实例。每个配置文件都有自己的 AI 同伴，从而使智能体们发展出独立的观点。

### 观察 (Observation)

每个同伴都有两个控制 Honcho 从何处学习的观察开关：

| 开关 | 功能 |
|--------|-------------|
| `observeMe` | 观察该同伴自己的消息（构建自我表示） |
| `observeOthers` | 观察其他同伴的消息（构建跨同伴理解） |

默认设置：所有四个开关**开启**（完全的双向观察）。

在 `honcho.json` 中按同伴配置：

```json
{
  "observation": {
    "user": { "observeMe": true, "observeOthers": true },
    "ai":   { "observeMe": true, "observeOthers": true }
  }
}
```

或者使用简写预设：

| 预设 | 用户 (User) | AI | 用例 |
|--------|------|----|----------|
| `"directional"` (默认) | me:on, others:on | me:on, others:on | 多智能体，完整记忆 |
| `"unified"` | me:on, others:off | me:off, others:on | 单一智能体，仅用户建模 |

在 [Honcho 仪表板](https://app.honcho.dev) 中更改的设置会在会话初始化时同步回来——服务器端配置优先于本地默认设置。

### 会话 (Sessions)

Honcho 会话决定消息和观察结果落入何处。策略选项：

| 策略 | 行为 |
|----------|----------|
| `per-directory` (默认) | 每个工作目录一个会话 |
| `per-repo` | 每个 Git 仓库根目录一个会话 |
| `per-session` | 每次 Hermes 运行时一个新的 Honcho 会话 |
| `global` | 所有目录共享一个会话 |

手动覆盖：`hermes honcho map my-project-name`

### 回忆模式 (Recall Modes)

智能体访问 Honcho 记忆的方式：

| 模式 | 是否自动注入上下文？ | 可用工具？ | 用例 |
|------|---------------------|-----------------|----------|
| `hybrid` (默认) | 是 | 是 | 智能体决定何时使用工具 vs 自动上下文 |
| `context` | 是 | 否（隐藏） | 最少的 token 成本，不调用工具 |
| `tools` | 否 | 是 | 智能体显式控制所有记忆访问 |

## 三个正交维度 (Three Orthogonal Knobs)

Honcho 的辩证行为由三个独立的维度控制。每个维度都可以单独调整，而不会影响其他维度：

### 节奏 (Cadence)（何时）

控制辩证和上下文调用的**频率**。

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `contextCadence` | `1` | 上下文 API 调用之间的最小回合数 |
| `dialecticCadence` | `2` | 辩证 API 调用之间的最小回合数。推荐 1–5 |
| `injectionFrequency` | `every-turn` | 用于基础上下文注入的频率（`every-turn` 或 `first-turn`） |

更高的节奏值会更少地触发辩证 LLM。`dialecticCadence: 2` 意味着引擎每隔一个回合就运行一次。设置为 `1` 则每个回合都运行。

### 深度 (Depth)（多少次）

控制 Honcho 对每次查询执行**多少轮**辩证推理。

| 键 | 默认值 | 范围 | 描述 |
|-----|---------|-------|-------------|
| `dialecticDepth` | `1` | 1-3 | 每次查询的辩证推理轮数 |
| `dialecticDepthLevels` | -- | 数组 | 可选的每深度轮次级别覆盖设置（见下文） |

`dialecticDepth: 2` 意味着 Honcho 运行两轮辩证合成。第一轮生成初始答案；第二轮对其进行完善。

`dialecticDepthLevels` 允许您独立设置每一轮的推理级别：

```json
{
  "dialecticDepth": 3,
  "dialecticDepthLevels": ["low", "medium", "high"]
}
```

如果省略 `dialecticDepthLevels`，则轮次使用从 `dialecticReasoningLevel`（基础）派生的**比例级别**：

| 深度 | 通过级别 (Pass levels) |
|-------|-------------|
| 1 | [base] |
| 2 | [minimal, base] |
| 3 | [minimal, base, low] |

这使得早期轮次成本较低，同时在最终合成中使用完整的深度。

**会话开始时的深度。** 会话启动预热会在第 1 回合之前在后台运行完整配置的 `dialecticDepth`。冷同伴的一次性预热通常返回薄弱的结果——多遍深度则会在用户开口说话之前运行审计/协调周期。第 1 回合直接消耗预热结果；如果预热未及时完成，第 1 回合将回退到带有限超时限制的同步调用。

### 级别 (Level)（有多难）

控制每一次辩证推理的**强度**。

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `dialecticReasoningLevel` | `low` | `minimal`, `low`, `medium`, `high`, `max` |
| `dialecticDynamic` | `true` | 当为 `true` 时，模型可以将 `reasoning_level` 传递给 `honcho_reasoning` 以覆盖每次调用的默认值。`false` = 始终使用 `dialecticReasoningLevel`，忽略模型的覆盖设置 |

更高的级别会产生更丰富的合成结果，但会在 Honcho 的后端消耗更多的 token。

## 多配置文件设置

每个 Hermes 配置文件都有自己的 Honcho AI 同伴，同时共享同一个工作区（用户上下文）。这意味着：

- 所有配置文件都看到相同的用户表示
- 每个配置文件都构建自己的 AI 身份和观察结果
- 一个配置文件撰写的结论对其他配置文件可见，通过共享的工作区实现

### 创建带有 Honcho 同伴的配置文件

```bash
hermes profile create coder --clone
# 创建 hermes.coder 主块，AI 同伴为 "coder"，继承默认配置
```

`--clone` 对 Honcho 的作用：
1. 在 `honcho.json` 中创建 `hermes.coder` 主块
2. 设置 `aiPeer: "coder"`（配置文件名）
3. 继承来自默认设置的 `workspace`、`peerName`、`writeFrequency`、`recallMode` 等
4. 提前在 Honcho 中创建该同伴，使其在第一条消息到来之前就存在

### 后填现有配置文件 (Backfill)

```bash
hermes honcho sync    # 为所有尚未创建主块的配置文件创建主块
```

### 按配置文件配置

覆盖主块中的任何设置：

```json
{
  "hosts": {
    "hermes.coder": {
      "aiPeer": "coder",
      "recallMode": "tools",
      "dialecticDepth": 2,
      "observation": {
        "user": { "observeMe": true, "observeOthers": false },
        "ai": { "observeMe": true, "observeOthers": true }
      }
    }
  }
}
```

## 工具 (Tools)

智能体拥有 5 个双向的 Honcho 工具（在 `context` 回忆模式中隐藏）：

| 工具 | LLM 调用？ | 成本 | 使用时机 |
|------|-----------|------|----------|
| `honcho_profile` | 否 | 最低 | 在对话开始时或进行快速名称/角色/偏好查找时的事实快照 |
| `honcho_search` | 否 | 低 | 获取特定过去的既有事实以供自己推理——原始摘录，无合成 |
| `honcho_context` | 否 | 低 | 完整的会话上下文快照：摘要、表示、卡片、最近消息 |
| `honcho_reasoning` | 是 | 中–高 | 由 Honcho 的辩证引擎生成的自然语言问题 |
| `honcho_conclude` | 否 | 最低 | 写入或删除一个持久的事实；传递 `peer: "ai"` 用于 AI 自我认知 |

### `honcho_profile`
读取或更新同伴卡片——精选的关键事实（姓名、角色、偏好、沟通风格）。传递 `card: [...]` 进行更新；省略则进行读取。不涉及 LLM 调用。

### `honcho_search`
对特定同伴存储的上下文进行语义搜索。返回按相关性排序的原始摘录，无合成。默认 800 个 token，最大 2000 个。当您需要特定的过去事实来供自己推理，而不是一个合成答案时特别有用。

### `honcho_context`
来自 Honcho 的完整会话上下文快照——会话摘要、同伴表示、同伴卡片和最近消息。不涉及 LLM 调用。当您想一次性看到 Honcho 对当前会话和同伴所知的一切时使用。

### `honcho_reasoning`
由 Honcho 的辩证推理引擎回答的自然语言问题（Honcho 后端上的 LLM 调用）。成本更高，质量也更高。传递 `reasoning_level` 以控制深度：`minimal` (快速/廉价) → `low` → `medium` → `high` → `max` (彻底)。省略则使用配置的默认值 (`low`)。用于对用户的模式、目标或当前状态进行合成理解。

### `honcho_conclude`
写入或删除关于某个同伴的一个持久结论。传递 `conclusion: "..."` 来创建。传递 `delete_id: "..."` 来移除一个结论（用于 PII 移除——Honcho 会随着时间自动修复不正确的结论，因此仅在需要 PII 移除时才需要删除）。您**必须**传递这两个参数中的一个。

### 双向同伴定位 (Bidirectional peer targeting)

所有 5 个工具都接受一个可选的 `peer` 参数：
- `peer: "user"` (默认) — 操作用户同伴
- `peer: "ai"` — 操作此配置文件的 AI 同伴
- `peer: "<explicit-id>"` — 工作区中的任何同伴 ID

示例：
```
honcho_profile                        # 读取用户的卡片
honcho_profile peer="ai"              # 读取 AI 同伴的卡片
honcho_reasoning query="这个用户最关心什么？"
honcho_reasoning query="我的交互模式是什么？" peer="ai" reasoning_level="medium"
honcho_conclude conclusion="偏好简洁的回答"
honcho_conclude conclusion="我倾向于过度解释代码" peer="ai"
honcho_conclude delete_id="abc123"    # PII 移除
```

## 智能体使用模式

当 Honcho 内存激活时，Hermes 的指南。

### 会话开始时

```
1. honcho_profile                  → 快速预热，无 LLM 成本
2. 如果上下文信息较少 → honcho_context  (完整快照，仍不涉及 LLM)
3. 如果需要深度综合分析 → honcho_reasoning  (LLM 调用，应谨慎使用)
```

不要在每次轮次都调用 `honcho_reasoning`。自动注入功能已经处理了持续的上下文刷新。仅当您确实需要基础上下文无法提供的合成洞察力时，才使用推理工具。

### 当用户分享一些需要记住的信息时

```
honcho_conclude conclusion="<具体的、可操作的事实>"
```

好的结论示例：“偏好代码示例而非散文解释”，“正在进行一个截止到 2026 年 4 月的 Rust 异步项目”
不好的结论示例：“用户提到了 Rust”（过于模糊），“用户似乎很技术化”（这已经在表示中体现了）

### 当用户询问过去的上下文/您需要回忆具体信息时

```
honcho_search query="<主题>"       → 快速，无 LLM，适用于特定事实
honcho_context                       → 包含摘要和消息的完整快照
honcho_reasoning query="<问题>"  → 合成答案，当搜索不足时使用
```

### 何时使用 `peer: "ai"`

使用 AI 同伴（AI peer）定位来构建和查询智能体自身的自我知识：
- `honcho_conclude conclusion="我在解释架构时倾向于冗长" peer="ai"` — 自我修正
- `honcho_reasoning query="我通常如何处理模棱两可的请求？" peer="ai"` — 自我审计
- `honcho_profile peer="ai"` — 审查自己的身份卡

### 何时不调用工具

在 `hybrid` 和 `context` 模式下，基础上下文（用户表示 + 身份卡 + 会话摘要）会在每次轮次前自动注入。不要重新获取已注入的内容。仅当以下情况发生时，才调用工具：
- 您需要注入的上下文所不具备的信息
- 用户明确要求您回忆或检查内存
- 您正在对某件新事物撰写结论

### 节奏意识（Cadence awareness）

在工具侧使用 `honcho_reasoning` 与自动注入的辩证过程具有相同的成本。在显式调用工具后，自动注入的节奏会重置——避免重复收费同一轮次。

## 配置参考

配置文件：`$HERMES_HOME/honcho.json`（本地配置）或 `~/.honcho/config.json`（全局）。

### 关键设置

| Key | Default | Description |
|-----|---------|-------------|
| `apiKey` | -- | API 密钥 ([获取一个](https://app.honcho.dev)) |
| `baseUrl` | -- | 自托管 Honcho 的基础 URL |
| `peerName` | -- | 用户同伴身份 |
| `aiPeer` | host key | AI 同伴身份 |
| `workspace` | host key | 共享工作区 ID |
| `recallMode` | `hybrid` | `hybrid`、`context` 或 `tools` |
| `observation` | all on | 每个同伴的 `observeMe`/`observeOthers` 布尔值 |
| `writeFrequency` | `async` | `async`、`turn`、`session` 或整数 N |
| `sessionStrategy` | `per-directory` | `per-directory`、`per-repo`、`per-session`、`global` |
| `messageMaxChars` | `25000` | 每个消息的最大字符数（如果超过则分块） |

### 辩证设置

| Key | Default | Description |
|-----|---------|-------------|
| `dialecticReasoningLevel` | `low` | `minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 根据查询复杂度自动提升。`false` = 固定级别 |
| `dialecticDepth` | `1` | 每个查询的辩证轮次数量（1-3） |
| `dialecticDepthLevels` | -- | 可选的每轮级别数组，例如 `["low", "high"]` |
| `dialecticMaxInputChars` | `10000` | 辩证查询输入的最大字符数 |

### 上下文预算和注入

| Key | Default | Description |
|-----|---------|-------------|
| `contextTokens` | uncapped | 组合基础上下文注入（摘要 + 表示 + 身份卡）的最大令牌数。可选上限——省略则保持无限制，设置为整数以限定注入大小。 |
| `injectionFrequency` | `every-turn` | `every-turn` 或 `first-turn` |
| `contextCadence` | `1` | 上下文 API 调用之间的最小轮次间隔 |
| `dialecticCadence` | `2` | 辩证 LLM 调用之间的最小轮次间隔（推荐 1–5） |

`contextTokens` 预算在注入时强制执行。如果会话摘要 + 表示 + 身份卡超过预算，Honcho 会先修剪摘要，然后是表示，从而保留身份卡。这可以防止长期会话中的上下文爆炸。

### 内存-上下文净化（Sanitization）

Honcho 在注入之前会对 `memory-context` 区块进行净化，以防止提示词注入和格式错误的内容：

- 从用户撰写的结论中剥离 XML/HTML 标签
- 标准化空白字符和控制字符
- 截断超出 `messageMaxChars` 的单个结论
- 转义可能破坏系统提示结构的分隔符序列

此修复解决了包含标记或特殊字符的原始用户结论可能会损坏注入上下文块的边缘情况。

## 故障排除（Troubleshooting）

### “未配置 Honcho”
运行 `hermes honcho setup`。确保 `memory.provider: honcho` 存在于 `~/.hermes/config.yaml` 中。

### 内存未跨会话持久化
检查 `hermes honcho status` —— 验证 `saveMessages: true` 并且 `writeFrequency` 不是 `session`（它只在退出时写入）。

### 配置了但没有自己的同伴（Peer）
创建时使用 `--clone`：`hermes profile create <name> --clone`。对于现有配置，运行 `hermes honcho sync`。

### 仪表板上的观察设置未反映
观察配置是从服务器同步的。在 Honcho UI 中更改设置后，请启动一个新的会话。

### 消息被截断
超过 `messageMaxChars`（默认 25k）的消息会自动使用 `[continued]` 标记进行分块。如果经常遇到这种情况，请检查工具结果或技能内容是否导致消息大小膨胀。

### 上下文注入过大
如果看到上下文预算超限的警告，请降低 `contextTokens` 或减少 `dialecticDepth`。当预算紧张时，会话摘要会首先被修剪。

### 会话摘要缺失
会话摘要要求当前 Honcho 会话中至少有一次先前的轮次。在冷启动（新会话，无历史记录）时，摘要会被省略，Honcho 而是使用冷启动提示词策略。

## CLI 命令

| Command | Description |
|---------|-------------|
| `hermes honcho setup` | 交互式设置向导（云/本地、身份、观察、回忆、会话） |
| `hermes honcho status` | 显示已解析的配置、连接测试、活动配置的同伴信息 |
| `hermes honcho enable` | 为当前配置启用 Honcho（如果需要则创建 host 块） |
| `hermes honcho disable` | 为当前配置禁用 Honcho |
| `hermes honcho peer` | 显示或更新同伴名称（`--user <name>`、`--ai <name>`、`--reasoning <level>`） |
| `hermes honcho peers` | 显示所有配置中的同伴身份 |
| `hermes honcho mode` | 显示或设置回忆模式（`hybrid`、`context`、`tools`） |
| `hermes honcho tokens` | 显示或设置令牌预算（`--context <N>`、`--dialectic <N>`） |
| `hermes honcho sessions` | 列出已知的目录到会话名称的映射关系 |
| `hermes honcho map <name>` | 将当前工作目录映射到一个 Honcho 会话名称 |
| `hermes honcho identity` | 播种 AI 同伴身份或显示所有同伴表示 |
| `hermes honcho sync` | 为所有尚未创建 host 块的 Hermes 配置创建 host 块 |
| `hermes honcho migrate` | 从 OpenClaw 原生内存迁移到 Hermes + Honcho 的分步指南 |
| `hermes memory setup` | 通用的内存提供者选择器（选择“honcho”将运行相同的向导） |
| `hermes memory status` | 显示活动的内存提供者和配置 |
| `hermes memory off` | 禁用外部内存提供者 |