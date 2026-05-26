---
title: "Honcho"
sidebar_label: "Honcho"
description: "配置并使用 Hermes 的 Honcho 记忆功能 -- 跨会话用户建模、多档案同伴隔离、观察配置、辩证推理、会话摘要及上下文预算管理。适用于设置 Honcho、排查记忆问题、管理 Honcho 同伴档案或调整观察、召回与辩证设置。"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Honcho

配置并使用 Hermes 的 Honcho 记忆功能 -- 跨会话用户建模、多档案同伴隔离、观察配置、辩证推理、会话摘要及上下文预算管理。适用于设置 Honcho、排查记忆问题、管理 Honcho 同伴档案或调整观察、召回与辩证设置。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/autonomous-ai-agents/honcho` 安装 |
| 路径 | `optional-skills/autonomous-ai-agents/honcho` |
| 版本 | `2.0.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Honcho`, `Memory`, `Profiles`, `Observation`, `Dialectic`, `User-Modeling`, `Session-Summary` |
| 相关技能 | [`hermes-agent`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

```markdown
:::info
以下是 Hermes 加载此技能时的完整技能定义。这是技能激活时智能体看到的说明。
:::

# Hermes 的 Honcho 记忆

Honcho 提供原生 AI 的跨会话用户建模。它学习用户在不同对话中的身份，并赋予每个 Hermes 配置文件自己的对等身份，同时共享对用户的统一视图。

## 何时使用

- 设置 Honcho（云或自托管）
- 排查记忆不工作 / 对等体不同步的问题
- 创建多配置文件设置，其中每个智能体拥有自己的 Honcho 对等体
- 调整观察、回忆、辩证深度或写入频率设置
- 了解 5 个 Honcho 工具的功能及使用时机
- 配置上下文预算和会话摘要注入

## 设置

### 云 (app.honcho.dev)

```bash
hermes honcho setup
# 选择“云”，粘贴来自 https://app.honcho.dev 的 API 密钥
```

### 自托管

```bash
hermes honcho setup
# 选择“本地”，输入基础 URL（例如 http://localhost:8000）
```

参见：https://docs.honcho.dev/v3/guides/integrations/hermes#running-honcho-locally-with-hermes

### 验证

```bash
hermes honcho status    # 显示解析后的配置、连接测试、对等体信息
```

## 架构

### 基础上下文注入

当 Honcho 将上下文注入系统提示（在 `hybrid` 或 `context` 回忆模式下）时，它按以下顺序组装基础上下文块：

1. **会话摘要** -- 到目前为止当前会话的简要摘要（放在首位，以便模型具有即时的对话连续性）
2. **用户表示** -- Honcho 积累的用户模型（偏好、事实、模式）
3. **AI 对等体卡片** -- 此 Hermes 配置文件的 AI 对等体的身份卡片

会话摘要由 Honcho 在每轮开始时（当存在先前会话时）自动生成。它为模型提供一个热启动，无需重放完整历史。

### 冷/热提示选择

Honcho 会自动在两种提示策略之间选择：

| 条件 | 策略 | 发生的情况 |
|------|------|------------|
| 无先前会话或表示为空 | **冷启动** | 轻量级介绍提示；跳过摘要注入；鼓励模型了解用户 |
| 存在表示和/或会话历史 | **热启动** | 完整的基础上下文注入（摘要 → 表示 → 卡片）；更丰富的系统提示 |

您无需配置此设置——它是基于会话状态自动执行的。

### 对等体

Honcho 将对话建模为**对等体**之间的交互。Hermes 为每个会话创建两个对等体：

- **用户对等体** (`peerName`)：代表人类。Honcho 从观察到的消息中构建用户表示。
- **AI 对等体** (`aiPeer`)：代表此 Hermes 实例。每个配置文件获得自己的 AI 对等体，以便智能体发展独立视图。

### 观察

每个对等体有两个观察开关，控制 Honcho 从何处学习：

| 开关 | 功能 |
|------|------|
| `observeMe` | 观察对等体自身消息（构建自我表示） |
| `observeOthers` | 观察其他对等体的消息（构建跨对等体理解） |

默认：所有四个开关均为**开启**（完全双向观察）。

在 `honcho.json` 中按对等体配置：

```json
{
  "observation": {
    "user": { "observeMe": true, "observeOthers": true },
    "ai":   { "observeMe": true, "observeOthers": true }
  }
}
```

或使用简写预设：

| 预设 | 用户 | AI | 用例 |
|------|------|----|------|
| `"directional"` (默认) | me:on, others:on | me:on, others:on | 多智能体，完整记忆 |
| `"unified"` | me:on, others:off | me:off, others:on | 单智能体，仅用户建模 |

在 [Honcho 仪表板](https://app.honcho.dev) 中更改的设置会在会话初始化时同步回来——服务器端配置优先于本地默认值。

### 会话

Honcho 会话界定消息和观察落入的范围。策略选项：

| 策略 | 行为 |
|------|------|
| `per-directory` (默认) | 每个工作目录一个会话 |
| `per-repo` | 每个 git 仓库根目录一个会话 |
| `per-session` | 每次 Hermes 运行新建一个 Honcho 会话 |
| `global` | 跨所有目录的单一会话 |

手动覆盖：`hermes honcho map my-project-name`

### 回忆模式

智能体如何访问 Honcho 记忆：

| 模式 | 自动注入上下文？ | 工具可用？ | 用例 |
|------|-----------------|-----------|------|
| `hybrid` (默认) | 是 | 是 | 智能体决定何时使用工具与自动上下文 |
| `context` | 是 | 否（隐藏） | 最小令牌成本，无工具调用 |
| `tools` | 否 | 是 | 智能体显式控制所有记忆访问 |

## 三个正交旋钮

Honcho 的辩证行为由三个独立维度控制。每个都可以独立调整，互不影响：

### 节奏（何时）

控制辩证和上下文调用发生的**频率**。

| 键 | 默认值 | 描述 |
|----|--------|------|
| `contextCadence` | `1` | 上下文 API 调用之间的最小轮次 |
| `dialecticCadence` | `2` | 辩证 API 调用之间的最小轮次。推荐 1–5 |
| `injectionFrequency` | `every-turn` | `every-turn` 或 `first-turn` 用于基础上下文注入 |

更高的节奏值会降低辩证 LLM 的触发频率。`dialecticCadence: 2` 意味着引擎每隔一轮触发一次。设置为 `1` 则每轮触发。

### 深度（多少轮）

控制 Honcho 每次查询执行**多少轮**辩证推理。

| 键 | 默认值 | 范围 | 描述 |
|----|--------|------|------|
| `dialecticDepth` | `1` | 1-3 | 每次查询的辩证推理轮数 |
| `dialecticDepthLevels` | -- | 数组 | 可选的每轮深度级别覆盖（见下文） |

`dialecticDepth: 2` 意味着 Honcho 运行两轮辩证综合。第一轮产生初步答案；第二轮对其进行精炼。

`dialecticDepthLevels` 允许您为每轮独立设置推理级别：

```json
{
  "dialecticDepth": 3,
  "dialecticDepthLevels": ["low", "medium", "high"]
}
```

如果省略 `dialecticDepthLevels`，各轮将使用从 `dialecticReasoningLevel`（基础）派生的**比例级别**：

| 深度 | 各轮级别 |
|------|----------|
| 1 | [基础] |
| 2 | [最小, 基础] |
| 3 | [最小, 基础, 低] |

这使得早期轮次成本较低，而在最终综合时使用完整深度。

**会话开始时的深度。** 会话开始的预热会在后台运行完整的配置 `dialecticDepth`，在第 1 轮之前。冷对等体的单轮预热通常返回薄弱的输出——多轮深度在用户发言前就运行审计/协调周期。第 1 轮直接消耗预热结果；如果预热未能及时完成，第 1 轮将回退到带有界超时的同步调用。

### 级别（多难）

控制每轮辩证推理的**强度**。

| 键 | 默认值 | 描述 |
|----|--------|------|
| `dialecticReasoningLevel` | `low` | `minimal`, `low`, `medium`, `high`, `max` |
| `dialecticDynamic` | `true` | 当为 `true` 时，模型可以传递 `reasoning_level` 给 `honcho_reasoning` 以覆盖默认值（每次调用）。`false` = 始终使用 `dialecticReasoningLevel`，忽略模型覆盖 |

更高级别产生更丰富的综合，但在 Honcho 后端消耗更多令牌。

## 多配置文件设置

每个 Hermes 配置文件获得自己的 Honcho AI 对等体，同时共享相同的工作区（用户上下文）。这意味着：

- 所有配置文件看到相同的用户表示
- 每个配置文件构建自己的 AI 身份和观察
- 一个配置文件编写的结论通过共享工作区对其他配置文件可见

### 创建带有 Honcho 对等体的配置文件

```bash
hermes profile create coder --clone
# 创建主机块 hermes.coder，AI 对等体 "coder"，从默认配置继承
```

`--clone` 对 Honcho 的作用：
1. 在 `honcho.json` 中创建 `hermes.coder` 主机块
2. 设置 `aiPeer: "coder"`（配置文件名）
3. 从默认配置继承 `workspace`, `peerName`, `writeFrequency`, `recallMode` 等
4. 热切地在 Honcho 中创建对等体，使其在第一条消息之前就存在

### 回填现有配置文件

```bash
hermes honcho sync    # 为所有尚未拥有主机块的配置文件创建主机块
```

### 按配置文件配置

在主机块中覆盖任何设置：

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

## 工具

智能体有 5 个双向 Honcho 工具（在 `context` 回忆模式下隐藏）：

| 工具 | LLM 调用？ | 成本 | 使用场景 |
|------|-----------|------|----------|
| `honcho_profile` | 否 | 最小 | 对话开始时快速获取事实快照，或用于快速查找名称/角色/偏好 |
| `honcho_search` | 否 | 低 | 获取特定的过去事实以自行推理——原始摘录，无综合 |
| `honcho_context` | 否 | 低 | 完整的会话上下文快照：摘要、表示、卡片、近期消息 |
| `honcho_reasoning` | 是 | 中-高 | 由 Honcho 辩证引擎综合的自然语言问题 |
| `honcho_conclude` | 否 | 最小 | 写入或删除持久事实；传递 `peer: "ai"` 用于 AI 自我认知 |

### `honcho_profile`
读取或更新对等体卡片——精选的关键事实（名称、角色、偏好、沟通风格）。传递 `card: [...]` 进行更新；省略则读取。无 LLM 调用。

### `honcho_search`
对存储的上下文进行语义搜索，针对特定对等体。返回按相关性排序的原始摘录，无综合。默认 800 令牌，最大 2000。当您需要特定的过去事实自行推理，而非综合答案时适用。

### `honcho_context`
来自 Honcho 的完整会话上下文快照——会话摘要、对等体表示、对等体卡片和近期消息。无 LLM 调用。当您想一次性查看 Honcho 关于当前会话和对等体所知道的一切时使用。

### `honcho_reasoning`
由 Honcho 辩证推理引擎（在 Honcho 后端进行 LLM 调用）回答的自然语言问题。成本更高，质量更高。传递 `reasoning_level` 控制深度：`minimal`（快速/便宜）→ `low` → `medium` → `high` → `max`（彻底）。省略则使用配置的默认值（`low`）。用于综合理解用户的模式、目标或当前状态。

### `honcho_conclude`
写入或删除关于对等体的持久结论。传递 `conclusion: "..."` 进行创建。传递 `delete_id: "..."` 删除结论（用于 PII 移除——Honcho 会随时间自我修复错误结论，因此删除仅用于 PII）。您必须传递且仅传递两者之一。

### 双向对等体定位

所有 5 个工具都接受可选的 `peer` 参数：
- `peer: "user"` (默认) — 操作用户对等体
- `peer: "ai"` — 操作此配置文件的 AI 对等体
- `peer: "<explicit-id>"` — 工作区中的任何对等体 ID

示例：
```
honcho_profile                        # 读取用户的卡片
honcho_profile peer="ai"              # 读取 AI 对等体的卡片
honcho_reasoning query="What does this user care about most?"
honcho_reasoning query="What are my interaction patterns?" peer="ai" reasoning_level="medium"
honcho_conclude conclusion="Prefers terse answers"
honcho_conclude conclusion="I tend to over-explain code" peer="ai"
honcho_conclude delete_id="abc123"    # PII 移除
```

## 智能体使用模式

当 Honcho 记忆激活时，Hermes 的使用指南。

### 对话开始时

```
1. honcho_profile                  → 快速预热，无 LLM 成本
2. 如果上下文看起来不足 → honcho_context  (完整快照，仍无 LLM)
3. 如果需要深度综合 → honcho_reasoning  (LLM 调用，谨慎使用)
```

不要在每个回合都调用 `honcho_reasoning`。自动注入已经在处理持续的上下文刷新。仅在您确实需要基础上下文未提供的综合见解时才使用推理工具。

### 当用户分享需要记住的内容时

```
honcho_conclude conclusion="<具体、可操作的事实>"
```

好的结论示例："偏好代码示例而非文字解释"、"正在处理一个 Rust 异步项目，持续到 2026 年 4 月"
不好的结论示例："用户说了关于 Rust 的事"（太模糊）、"用户看起来很技术"（已在表示中）

### 当用户询问过去的上下文 / 您需要回忆具体细节时

```
honcho_search query="<主题>"       → 快速，无 LLM，适合具体事实
honcho_context                       → 包含摘要和消息的完整快照
honcho_reasoning query="<问题>"      → 综合答案，当搜索不够时使用
```

### 何时使用 `peer: "ai"`

使用 AI 对等目标来构建和查询智能体自身的自我知识：
- `honcho_conclude conclusion="我解释架构时倾向于冗长" peer="ai"` — 自我纠正
- `honcho_reasoning query="我通常如何处理模糊的请求？" peer="ai"` — 自我审计
- `honcho_profile peer="ai"` — 审查自己的身份卡

### 何时不调用工具

在 `hybrid` 和 `context` 模式下，基础上下文（用户表示 + 卡片 + 会话摘要）会在每个回合之前自动注入。不要重新获取已注入的内容。仅在以下情况下调用工具：
- 您需要注入的上下文中没有的内容
- 用户明确要求您回忆或检查记忆
- 您正在对新事物写结论

### 节奏意识

工具端的 `honcho_reasoning` 与自动注入辩证法共享相同的成本。在显式工具调用之后，自动注入的节奏会重置 - 避免在同一个回合双重收费。

## 配置参考

配置文件：`$HERMES_HOME/honcho.json`（配置文件特定）或 `~/.honcho/config.json`（全局）。

### 关键设置

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `apiKey` | -- | API 密钥 ([获取一个](https://app.honcho.dev)) |
| `baseUrl` | -- | 自托管 Honcho 的基础 URL |
| `peerName` | -- | 用户对等身份 |
| `aiPeer` | 主机密钥 | AI 对等身份 |
| `workspace` | 主机密钥 | 共享工作区 ID |
| `recallMode` | `hybrid` | `hybrid`、`context` 或 `tools` |
| `observation` | 全部开启 | 每对等 `observeMe`/`observeOthers` 布尔值 |
| `writeFrequency` | `async` | `async`、`turn`、`session` 或整数 N |
| `sessionStrategy` | `per-directory` | `per-directory`、`per-repo`、`per-session`、`global` |
| `messageMaxChars` | `25000` | 每条消息最大字符数（超过则分块） |

### 辩证法设置

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `dialecticReasoningLevel` | `low` | `minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 根据查询复杂度自动提升推理级别。`false` = 固定级别 |
| `dialecticDepth` | `1` | 每次查询的辩证法轮数 (1-3) |
| `dialecticDepthLevels` | -- | 可选数组，指定每轮级别，例如 `["low", "high"]` |
| `dialecticMaxInputChars` | `10000` | 辩证法查询输入的最大字符数 |

### 上下文预算与注入

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `contextTokens` | 无上限 | 合并基础上下文注入（摘要 + 表示 + 卡片）的最大 token 数。可选上限 - 省略则保持无上限，设置为整数则限制注入大小。 |
| `injectionFrequency` | `every-turn` | `every-turn` 或 `first-turn` |
| `contextCadence` | `1` | 上下文 API 调用之间的最小回合数 |
| `dialecticCadence` | `2` | 辩证法 LLM 调用之间的最小回合数 (推荐 1-5) |

`contextTokens` 预算在注入时强制执行。如果会话摘要 + 表示 + 卡片超出预算，Honcho 会先裁剪摘要，然后是表示，保留卡片。这可以防止长会话中的上下文膨胀。

### 记忆上下文净化

Honcho 在注入前会净化 `memory-context` 块，以防止提示注入和格式错误的内容：

- 从用户撰写的结论中剥离 XML/HTML 标签
- 规范化空白和控制字符
- 截断超过 `messageMaxChars` 的单个结论
- 转义可能破坏系统提示结构的定界符序列

此修复解决了原始用户结论包含标记或特殊字符可能损坏注入的上下文块的边缘情况。

## 故障排除

### "Honcho 未配置"
运行 `hermes honcho setup`。确保 `~/.hermes/config.yaml` 中包含 `memory.provider: honcho`。

### 记忆在会话间不持久
检查 `hermes honcho status` -- 验证 `saveMessages: true` 且 `writeFrequency` 不是 `session`（仅在退出时写入）。

### 配置文件未获得自己的对等身份
创建时使用 `--clone`：`hermes profile create <name> --clone`。对于现有配置文件：`hermes honcho sync`。

### 仪表板中的观察更改未反映
观察配置在每个会话初始化时从服务器同步。在 Honcho UI 中更改设置后，请启动新会话。

### 消息被截断
超过 `messageMaxChars`（默认 25k）的消息会自动分块，并带有 `[continued]` 标记。如果您经常遇到此问题，请检查工具结果或技能内容是否增大了消息大小。

### 上下文注入太大
如果您看到有关上下文预算超标的警告，请降低 `contextTokens` 或减少 `dialecticDepth`。当预算紧张时，会话摘要会首先被裁剪。

### 会话摘要缺失
会话摘要至少需要在当前 Honcho 会话中有过一轮对话。在冷启动（新会话，无历史记录）时，摘要会被省略，Honcho 会改用冷启动提示策略。

## CLI 命令

| 命令 | 描述 |
|---------|-------------|
| `hermes honcho setup` | 交互式设置向导（云端/本地、身份、观察、回忆、会话） |
| `hermes honcho status` | 显示解析后的配置、连接测试、活动配置文件的对等信息 |
| `hermes honcho enable` | 为活动配置文件启用 Honcho（如需要则创建主机块） |
| `hermes honcho disable` | 为活动配置文件禁用 Honcho |
| `hermes honcho peer` | 显示或更新对等名称 (`--user <name>`, `--ai <name>`, `--reasoning <level>`) |
| `hermes honcho peers` | 显示所有配置文件的对等身份 |
| `hermes honcho mode` | 显示或设置回忆模式 (`hybrid`, `context`, `tools`) |
| `hermes honcho tokens` | 显示或设置 token 预算 (`--context <N>`, `--dialectic <N>`) |
| `hermes honcho sessions` | 列出已知的目录到会话名称映射 |
| `hermes honcho map <name>` | 将当前工作目录映射到 Honcho 会话名称 |
| `hermes honcho identity` | 设置 AI 对等身份或显示两种对等表示 |
| `hermes honcho sync` | 为所有尚未拥有主机块的 Hermes 配置文件创建主机块 |
| `hermes honcho migrate` | 从 OpenClaw 原生内存迁移到 Hermes + Honcho 的分步指南 |
| `hermes memory setup` | 通用记忆提供程序选择器（选择 "honcho" 运行相同的向导） |
| `hermes memory status` | 显示活动记忆提供程序和配置 |
| `hermes memory off` | 禁用外部记忆提供程序 |