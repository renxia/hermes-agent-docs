---
title: "Honcho"
sidebar_label: "Honcho"
description: "配置和使用Hermes的Honcho记忆 -- 跨会话用户建模、多配置文件同行隔离、观察配置、辩证推理、会话摘要等。"
---

{/* 此页面由website/scripts/generate-skill-docs.py从技能的SKILL.md自动生成。请编辑源SKILL.md，而非此页面。 */}

# Honcho

配置和使用Hermes的Honcho记忆 -- 跨会话用户建模、多配置文件同行隔离、观察配置、辩证推理、会话摘要和上下文预算执行。在设置Honcho、故障排除记忆、使用Honcho同行管理配置文件或调整观察、回忆和辩证设置时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/autonomous-ai-agents/honcho` 安装 |
| 路径 | `optional-skills/autonomous-ai-agents/honcho` |
| 版本 | `2.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Honcho`, `记忆`, `配置文件`, `观察`, `辩证`, `用户建模`, `会话摘要` |
| 相关技能 | [`hermes-智能体`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

:::info
以下是 Hermes 加载此技能时的完整技能定义。当技能激活时，智能体将看到这些指令。
:::

# Hermes 的 Honcho 记忆功能

Honcho 提供 AI 原生的跨会话用户建模。它跨对话学习用户信息，并为每个 Hermes 配置文件提供其专属的对等体身份，同时共享统一的用户视图。

## 何时使用

- 设置 Honcho（云端或自托管）
- 排查记忆不工作 / 对等体不同步的问题
- 创建多配置文件设置，其中每个智能体拥有自己的 Honcho 对等体
- 调整观察、回忆、辩证深度或写入频率设置
- 了解 5 个 Honcho 工具的功能及使用时机
- 配置上下文预算和会话摘要注入

## 设置

### 云端 (app.honcho.dev)

```bash
hermes honcho setup
# 选择 "cloud"，粘贴来自 https://app.honcho.dev 的 API 密钥
```

### 自托管

```bash
hermes honcho setup
# 选择 "local"，输入基础 URL（例如 http://localhost:8000）
```

参见：https://docs.honcho.dev/v3/guides/integrations/hermes#running-honcho-locally-with-hermes

### 验证

```bash
hermes honcho status    # 显示已解析的配置、连接测试、对等体信息
```

## 架构

### 基础上下文注入

当 Honcho 向系统提示词注入上下文时（在 `hybrid` 或 `context` 回忆模式下），它会按以下顺序组装基础上下文块：

1. **会话摘要** -- 当前会话至今的简短摘要（放在首位，使模型具备即时对话连续性）
2. **用户表示** -- Honcho 积累的用户模型（偏好、事实、模式）
3. **AI 对等体卡片** -- 此 Hermes 配置文件的 AI 对等体的身份卡片

会话摘要由 Honcho 在每轮对话开始时（存在先前会话时）自动生成。它让模型快速启动，无需重放全部历史。

### 冷启动 / 暖启动提示词选择

Honcho 会自动在两种提示词策略间选择：

| 条件 | 策略 | 发生情况 |
|-----------|----------|--------------|
| 无先前会话或表示为空 | **冷启动** | 轻量级介绍提示；跳过摘要注入；鼓励模型了解用户 |
| 存在表示和/或会话历史 | **暖启动** | 完整基础上下文注入（摘要 → 表示 → 卡片）；更丰富的系统提示词 |

您无需配置此项——它基于会话状态自动选择。

### 对等体

Honcho 将对话建模为**对等体**之间的交互。Hermes 为每个会话创建两个对等体：

- **用户对等体** (`peerName`)：代表人类。Honcho 根据观察到的消息构建用户表示。
- **AI 对等体** (`aiPeer`)：代表此 Hermes 实例。每个配置文件都有自己的 AI 对等体，以便智能体形成独立观点。

### 观察

每个对等体有两个观察开关，控制 Honcho 从何处学习：

| 开关 | 作用 |
|--------|-------------|
| `observeMe` | 对等体自身的消息被观察（构建自我表示） |
| `observeOthers` | 其他对等体的消息被观察（构建跨对等体理解） |

默认：所有四个开关**开启**（完全双向观察）。

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

| 预设 | 用户 | AI | 使用场景 |
|--------|------|----|----------|
| `"directional"` (默认) | me:on, others:on | me:on, others:on | 多智能体，完整记忆 |
| `"unified"` | me:on, others:off | me:off, others:on | 单一智能体，仅用户建模 |

在 [Honcho 仪表板](https://app.honcho.dev) 中更改的设置会在会话初始化时同步回来——服务器端配置优先于本地默认值。

### 会话

Honcho 会话界定消息和观察结果的归属。策略选项：

| 策略 | 行为 |
|----------|----------|
| `per-directory` (默认) | 每个工作目录一个会话 |
| `per-repo` | 每个 git 仓库根目录一个会话 |
| `per-session` | 每次 Hermes 运行新建 Honcho 会话 |
| `global` | 跨所有目录使用单一会话 |

手动覆盖：`hermes honcho map my-project-name`

### 回忆模式

智能体访问 Honcho 记忆的方式：

| 模式 | 自动注入上下文？ | 工具可用？ | 使用场景 |
|------|---------------------|-----------------|----------|
| `hybrid` (默认) | 是 | 是 | 智能体决定何时使用工具 vs 自动上下文 |
| `context` | 是 | 否（隐藏） | 最小化 token 成本，无工具调用 |
| `tools` | 否 | 是 | 智能体显式控制所有记忆访问 |

## 三个正交调节钮

Honcho 的辩证行为由三个独立维度控制。每个都可以独立调节，不影响其他：

### 节奏 (何时)

控制辩证和上下文调用发生的**频率**。

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `contextCadence` | `1` | 上下文 API 调用间的最小轮次 |
| `dialecticCadence` | `2` | 辩证 API 调用间的最小轮次。建议 1–5 |
| `injectionFrequency` | `every-turn` | `every-turn` 或 `first-turn` 用于基础上下文注入 |

更高的节奏值触发辩证 LLM 的频率更低。`dialecticCadence: 2` 意味着引擎每隔一轮触发一次。设置为 `1` 则每轮触发。

### 深度 (多少轮)

控制 Honcho 每次查询执行**多少轮**辩证推理。

| 键 | 默认值 | 范围 | 描述 |
|-----|---------|-------|-------------|
| `dialecticDepth` | `1` | 1-3 | 每次查询的辩证推理轮次 |
| `dialecticDepthLevels` | -- | 数组 | 可选的按深度轮次的级别覆盖（见下文） |

`dialecticDepth: 2` 意味着 Honcho 运行两轮辩证综合。第一轮产生初始答案；第二轮对其进行精炼。

`dialecticDepthLevels` 让您为每轮独立设置推理级别：

```json
{
  "dialecticDepth": 3,
  "dialecticDepthLevels": ["low", "medium", "high"]
}
```

如果省略 `dialecticDepthLevels`，轮次将使用从 `dialecticReasoningLevel`（基准级别）导出的**比例级别**：

| 深度 | 通过级别 |
|-------|-------------|
| 1 | [base] |
| 2 | [minimal, base] |
| 3 | [minimal, base, low] |

这使早期轮次成本较低，而在最终综合时使用完整深度。

**会话开始时的深度。** 会话开始时的预热会在后台运行配置的全部 `dialecticDepth`（在第一轮之前）。在冷对等体上进行单轮预热通常返回较薄的输出——多轮深度在用户发言前运行审计/调和循环。第一轮直接使用预热结果；如果预热未及时完成，第一轮将回退到一个有超时限制的同步调用。

### 级别 (多难)

控制每轮辩证推理的**强度**。

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `dialecticReasoningLevel` | `low` | `minimal`, `low`, `medium`, `high`, `max` |
| `dialecticDynamic` | `true` | 当为 `true` 时，模型可以向 `honcho_reasoning` 传递 `reasoning_level` 来覆盖每次调用的默认级别。`false` = 始终使用 `dialecticReasoningLevel`，模型覆盖被忽略 |

更高级别产生更丰富的综合，但在 Honcho 后端消耗更多 token。

## 多配置文件设置

每个 Hermes 配置文件拥有自己的 Honcho AI 对等体，同时共享同一工作空间（用户上下文）。这意味着：

- 所有配置文件看到相同的用户表示
- 每个配置文件构建自己的 AI 身份和观察
- 一个配置文件写入的结论对其他配置文件通过共享工作空间可见

### 创建一个带 Honcho 对等体的配置文件

```bash
hermes profile create coder --clone
# 创建主配置块 hermes.coder, AI 对等体 "coder", 从默认继承配置
```

`--clone` 为 Honcho 所做的事：
1. 在 `honcho.json` 中创建 `hermes.coder` 主配置块
2. 设置 `aiPeer: "coder"` (配置文件名称)
3. 从默认继承 `workspace`, `peerName`, `writeFrequency`, `recallMode` 等
4. 在 Honcho 中急切地创建对等体，使其在第一条消息前就存在

### 为现有配置文件回填

```bash
hermes honcho sync    # 为所有尚未有主配置块的配置文件创建主配置块
```

### 按配置文件配置

在主配置块中覆盖任何设置：

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

智能体拥有 5 个双向 Honcho 工具（在 `context` 回忆模式下隐藏）：

| 工具 | 调用 LLM？ | 成本 | 使用时机 |
|------|-----------|------|----------|
| `honcho_profile` | 否 | 极小 | 对话开始时的快速事实快照或用于快速查找名称/角色/偏好 |
| `honcho_search` | 否 | 低 | 获取特定的过往事实以自行推理——原始摘录，无综合 |
| `honcho_context` | 否 | 低 | 完整的会话上下文快照：摘要、表示、卡片、近期消息 |
| `honcho_reasoning` | 是 | 中–高 | 由 Honcho 辩证引擎综合的自然语言问题 |
| `honcho_conclude` | 否 | 极小 | 写入或删除一个持久性事实；传递 `peer: "ai"` 用于 AI 自我知识 |

### `honcho_profile`
读取或更新对等体卡片——精选的关键事实（名称、角色、偏好、沟通风格）。传递 `card: [...]` 进行更新；省略则读取。无 LLM 调用。

### `honcho_search`
针对特定对等体存储的上下文进行语义搜索。按相关性排序返回原始摘录，无综合。默认 800 token，最大 2000。当您需要特定的过往事实自行推理而非综合答案时很有用。

### `honcho_context`
来自 Honcho 的完整会话上下文快照——会话摘要、对等体表示、对等体卡片和近期消息。无 LLM 调用。当您想一次性查看 Honcho 关于当前会话和对等体的所有已知信息时使用。

### `honcho_reasoning`
由 Honcho 辩证推理引擎（Honcho 后端的 LLM 调用）回答的自然语言问题。成本更高，质量更高。传递 `reasoning_level` 控制深度：`minimal` (快速/便宜) → `low` → `medium` → `high` → `max` (彻底)。省略则使用配置的默认值 (`low`)。用于对用户模式、目标或当前状态的综合理解。

### `honcho_conclude`
写入或删除关于对等体的持久性结论。传递 `conclusion: "..."` 进行创建。传递 `delete_id: "..."` 移除一个结论（用于 PII 移除——Honcho 会随时间自我修正错误结论，因此仅 PII 需要删除）。您必须**仅**传递这两个参数之一。

### 双向对等体定向

所有 5 个工具都接受一个可选的 `peer` 参数：
- `peer: "user"` (默认) — 操作用户对等体
- `peer: "ai"` — 操作此配置文件的 AI 对等体
- `peer: "<explicit-id>"` — 工作空间中的任何对等体 ID

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

Hermes 在 Honcho 记忆激活时的指导原则。

### 对话开始时

```
1. honcho_profile                  → 快速预热，无LLM成本
2. 如果上下文看起来单薄 → honcho_context  (完整快照，仍无LLM)
3. 如果需要深度综合 → honcho_reasoning  (LLM调用，谨慎使用)
```

**不要**每轮对话都调用 `honcho_reasoning`。自动注入已经在处理持续的上下文刷新。仅在真正需要基础上下文未提供的综合洞察时使用推理工具。

### 当用户分享需要记住的内容时

```
honcho_conclude conclusion="<具体、可操作的事实>"
```

**好的结论示例**："偏好代码示例而非散文解释"，"在2026年4月前一直在进行 Rust 异步项目"
**不好的结论示例**："用户提到了 Rust"（过于模糊），"用户看起来是技术型"（已在表征中）

### 当用户询问过去的上下文 / 你需要回忆具体细节时

```
honcho_search query="<主题>"       → 快速，无LLM，适合具体事实
honcho_context                       → 包含摘要和消息的完整快照
honcho_reasoning query="<问题>"      → 综合答案，当搜索不够用时使用
```

### 何时使用 `peer: "ai"`

使用 AI 对等体定位来构建和查询智能体自身的自我认知：
- `honcho_conclude conclusion="我在解释架构时往往过于冗长" peer="ai"` — 自我纠正
- `honcho_reasoning query="我通常如何处理模糊的请求？" peer="ai"` — 自我审计
- `honcho_profile peer="ai"` — 查看自己的身份卡片

### 何时**不**调用工具

在 `hybrid` 和 `context` 模式下，基础上下文（用户表征 + 卡片 + 会话摘要）会在每轮对话前自动注入。不要重新获取已注入的内容。仅在以下情况调用工具：
- 你需要注入上下文中没有的内容
- 用户明确要求你回忆或检查记忆
- 你在写关于新事物的结论

### 节奏意识

工具端的 `honcho_reasoning` 与自动注入的辩证法成本相同。在显式工具调用后，自动注入的节奏会重置——避免在同一轮对话中双重计费。

## 配置参考

配置文件：`$HERMES_HOME/honcho.json`（配置文件级）或 `~/.honcho/config.json`（全局）。

### 关键设置

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `apiKey` | -- | API 密钥 ([获取一个](https://app.honcho.dev)) |
| `baseUrl` | -- | 自托管 Honcho 的基础 URL |
| `peerName` | -- | 用户对等体身份 |
| `aiPeer` | 主机密钥 | AI 对等体身份 |
| `workspace` | 主机密钥 | 共享工作区 ID |
| `recallMode` | `hybrid` | `hybrid`、`context` 或 `tools` |
| `observation` | 全部开启 | 每对等体 `observeMe`/`observeOthers` 布尔值 |
| `writeFrequency` | `async` | `async`、`turn`、`session` 或整数 N |
| `sessionStrategy` | `per-directory` | `per-directory`、`per-repo`、`per-session`、`global` |
| `messageMaxChars` | `25000` | 每条消息的最大字符数（超出则分块） |

### 辩证法设置

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `dialecticReasoningLevel` | `low` | `minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 根据查询复杂度自动提升推理级别。`false` = 固定级别 |
| `dialecticDepth` | `1` | 每次查询的辩证法轮数 (1-3) |
| `dialecticDepthLevels` | -- | 可选的每轮级别数组，例如 `["low", "high"]` |
| `dialecticMaxInputChars` | `10000` | 辩证法查询输入的最大字符数 |

### 上下文预算与注入

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `contextTokens` | 无上限 | 组合基础上下文注入（摘要 + 表征 + 卡片）的最大 token 数。可选上限——省略则无上限，设置为整数则限制注入大小。 |
| `injectionFrequency` | `every-turn` | `every-turn` 或 `first-turn` |
| `contextCadence` | `1` | 上下文 API 调用之间的最小对话轮数 |
| `dialecticCadence` | `2` | 辩证法 LLM 调用之间的最小对话轮数（推荐 1-5） |

`contextTokens` 预算在注入时强制执行。如果会话摘要 + 表征 + 卡片超出预算，Honcho 会先修剪摘要，然后修剪表征，保留卡片。这可以防止长会话中的上下文膨胀。

### 记忆上下文清理

Honcho 在注入前清理 `memory-context` 块，以防止提示注入和格式错误的内容：
- 从用户撰写的结论中剥离 XML/HTML 标签
- 规范化空白和控制字符
- 截断超过 `messageMaxChars` 的单个结论
- 转义可能破坏系统提示结构的分隔符序列

此修复解决了包含标记或特殊字符的原始用户结论可能破坏注入上下文块的边缘情况。

## 故障排除

### "Honcho 未配置"
运行 `hermes honcho setup`。确保 `~/.hermes/config.yaml` 中包含 `memory.provider: honcho`。

### 记忆在会话间未持久化
检查 `hermes honcho status` -- 验证 `saveMessages: true` 且 `writeFrequency` 不是 `session`（仅在退出时写入）。

### 配置文件未获得自己的对等体
创建时使用 `--clone`：`hermes profile create <name> --clone`。对于现有配置文件：`hermes honcho sync`。

### 仪表板中的观察变更未反映
观察配置在每次会话初始化时从服务器同步。在 Honcho UI 中更改设置后，请启动新会话。

### 消息被截断
超过 `messageMaxChars`（默认 25k）的消息会自动分块并带有 `[continued]` 标记。如果频繁遇到此问题，请检查工具结果或技能内容是否增大了消息大小。

### 上下文注入过大
如果看到上下文预算超限警告，请降低 `contextTokens` 或减少 `dialecticDepth`。预算紧张时，会摘要首先被修剪。

### 会话摘要缺失
会话摘要需要当前 Honcho 会话中至少有一次先前的对话轮次。在冷启动（新会话，无历史记录）时，摘要会被省略，Honcho 将改用冷启动提示策略。

## CLI 命令

| 命令 | 描述 |
|---------|-------------|
| `hermes honcho setup` | 交互式设置向导（云/本地、身份、观察、回忆、会话） |
| `hermes honcho status` | 显示已解析的配置、连接测试、活动配置文件的对等体信息 |
| `hermes honcho enable` | 为活动配置文件启用 Honcho（如需要则创建主机块） |
| `hermes honcho disable` | 为活动配置文件禁用 Honcho |
| `hermes honcho peer` | 显示或更新对等体名称 (`--user <name>`, `--ai <name>`, `--reasoning <level>`) |
| `hermes honcho peers` | 显示所有配置文件中的对等体身份 |
| `hermes honcho mode` | 显示或设置回忆模式 (`hybrid`, `context`, `tools`) |
| `hermes honcho tokens` | 显示或设置 token 预算 (`--context <N>`, `--dialectic <N>`) |
| `hermes honcho sessions` | 列出已知的目录到会话名称映射 |
| `hermes honcho map <name>` | 将当前工作目录映射到 Honcho 会话名称 |
| `hermes honcho identity` | 初始化 AI 对等体身份或显示两个对等体表征 |
| `hermes honcho sync` | 为所有尚未拥有主机块的 Hermes 配置文件创建主机块 |
| `hermes honcho migrate` | 从 OpenClaw 原生内存迁移到 Hermes + Honcho 的分步指南 |
| `hermes memory setup` | 通用内存提供程序选择器（选择 "honcho" 运行相同的向导） |
| `hermes memory status` | 显示活动内存提供程序和配置 |
| `hermes memory off` | 禁用外部内存提供程序 |