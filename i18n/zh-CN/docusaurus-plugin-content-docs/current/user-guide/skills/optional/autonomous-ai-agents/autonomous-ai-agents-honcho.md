---
title: "Honcho"
sidebar_label: "Honcho"
description: "使用 Hermes 配置和使用 Honcho 记忆——跨会话用户建模、多配置文件对等隔离、观察配置、辩证推理、会话摘要……"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Honcho

使用 Hermes 配置和使用 Honcho 记忆——跨会话用户建模、多配置文件对等隔离、观察配置、辩证推理、会话摘要以及上下文预算执行。在设置 Honcho、排查记忆问题、管理 Honcho 对等体的配置文件，或调整观察、回忆和辩证设置时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/autonomous-ai-agents/honcho` 安装 |
| 路径 | `optional-skills/autonomous-ai-agents/honcho` |
| 版本 | `2.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 标签 | `Honcho`, `Memory`, `Profiles`, `Observation`, `Dialectic`, `User-Modeling`, `Session-Summary` |
| 相关技能 | [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Hermes 的 Honcho 记忆

Honcho 提供原生 AI 跨会话用户建模。它在对话中学习用户是谁，并为每个 Hermes 配置文件提供其自己的对等身份，同时共享用户的统一视图。

## 何时使用

- 设置 Honcho（云端或自托管）
- 排查记忆不工作 / 对等体不同步问题
- 创建多配置文件设置，其中每个智能体都有自己的 Honcho 对等体
- 调整观察、回忆、辩证深度或写入频率设置
- 了解 5 个 Honcho 工具的作用以及何时使用它们
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
hermes honcho status    # 显示已解析的配置、连接测试、对等信息
```

## 架构

### 基础上下文注入

当 Honcho 将上下文注入系统提示（在 `hybrid` 或 `context` 回忆模式下）时，它会按以下顺序组装基础上下文块：

1. **会话摘要** —— 当前会话迄今为止的简短摘要（放在最前面，以便模型立即获得对话连续性）
2. **用户表示** —— Honcho 对用户的累积模型（偏好、事实、模式）
3. **AI 对等体卡片** —— 此 Hermes 配置文件的 AI 对等体的身份卡片

会话摘要由 Honcho 在每一轮开始时自动生成（当存在先前会话时）。它让模型有一个良好的开始，而无需重播完整历史。

### 冷启动 / 热启动提示选择

Honcho 自动在两种提示策略之间选择：

| 条件 | 策略 | 发生什么 |
|-----------|----------|--------------|
| 无先前会话或空表示 | **冷启动** | 轻量级介绍提示；跳过摘要注入；鼓励模型了解用户 |
| 现有表示和/或会话历史 | **热启动** | 完整基础上下文注入（摘要 → 表示 → 卡片）；更丰富的系统提示 |

您无需配置此功能 —— 它基于会话状态自动进行。

### 对等体

Honcho 将对话建模为**对等体**之间的交互。Hermes 每个会话创建两个对等体：

- **用户对等体** (`peerName`)：代表人类。Honcho 从观察到的消息构建用户表示。
- **AI 对等体** (`aiPeer`)：代表此 Hermes 实例。每个配置文件获得其自己的 AI 对等体，以便智能体发展独立的视图。

### 观察

每个对等体有两个观察切换开关，控制 Honcho 从什么中学习：

| 切换 | 它的作用 |
|--------|-------------|
| `observeMe` | 对等体自己的消息被观察（构建自我表示） |
| `observeOthers` | 其他对等体的消息被观察（构建跨对等体理解） |

默认：所有四个切换开关**开启**（完全双向观察）。

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
|--------|------|----|----------|
| `"directional"`（默认） | me:开启, others:开启 | me:开启, others:开启 | 多智能体，完整记忆 |
| `"unified"` | me:开启, others:关闭 | me:关闭, others:开启 | 单智能体，仅用户建模 |

在 [Honcho 仪表板](https://app.honcho.dev) 中更改的设置会在会话初始化时同步回来 —— 服务器端配置优先于本地默认值。

### 会话

Honcho 会话限定消息和观察结果的范围。策略选项：

| 策略 | 行为 |
|----------|----------|
| `per-directory`（默认） | 每个工作目录一个会话 |
| `per-repo` | 每个 git 仓库根目录一个会话 |
| `per-session` | 每次 Hermes 运行新建一个 Honcho 会话 |
| `global` | 所有目录共享单个会话 |

手动覆盖：`hermes honcho map my-project-name`

### 回忆模式

智能体如何访问 Honcho 记忆：

| 模式 | 是否自动注入上下文？ | 工具是否可用？ | 用例 |
|------|---------------------|-----------------|----------|
| `hybrid`（默认） | 是 | 是 | 智能体决定何时使用工具 vs 自动上下文 |
| `context` | 是 | 否（隐藏） | 最小 token 成本，无工具调用 |
| `tools` | 否 | 是 | 智能体显式控制所有记忆访问 |

## 三个正交旋钮

Honcho 的辩证行为由三个独立维度控制。每个维度都可以调整而不影响其他维度：

### 节奏（何时）

控制辩证和上下文调用**发生的频率**。

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `contextCadence` | `1` | 上下文 API 调用之间的最小轮数 |
| `dialecticCadence` | `2` | 辩证 API 调用之间的最小轮数。推荐 1–5 |
| `injectionFrequency` | `every-turn` | `every-turn` 或 `first-turn` 用于基础上下文注入 |

更高的节奏值会使辩证 LLM 触发频率降低。`dialecticCadence: 2` 表示引擎每隔一轮触发一次。将其设置为 `1` 则每轮都触发。

### 深度（多少）

控制 Honcho 每次查询执行**多少轮**辩证推理。

| 键 | 默认值 | 范围 | 描述 |
|-----|---------|-------|-------------|
| `dialecticDepth` | `1` | 1-3 | 每次查询的辩证推理轮数 |
| `dialecticDepthLevels` | -- | 数组 | 可选的每深度轮次级别覆盖（见下文） |

`dialecticDepth: 2` 表示 Honcho 运行两轮辩证综合。第一轮产生初步答案；第二轮对其进行精炼。

`dialecticDepthLevels` 允许您独立设置每轮的推理级别：

```json
{
  "dialecticDepth": 3,
  "dialecticDepthLevels": ["low", "medium", "high"]
}
```

如果省略 `dialecticDepthLevels`，则轮次使用从 `dialecticReasoningLevel`（基础）派生的**比例级别**：

| 深度 | 通过级别 |
|-------|-------------|
| 1 | [基础] |
| 2 | [最小, 基础] |
| 3 | [最小, 基础, 低] |

这保持了早期轮次的低成本，同时在最终综合中使用完整深度。

**会话开始时的深度。** 会话开始前的预热会在第 1 轮之前在后台运行完整配置的 `dialecticDepth`。冷对等体的单轮预热通常返回稀疏输出 —— 多轮深度会在用户说话之前运行审计/协调周期。第 1 轮直接消耗预热结果；如果预热未及时完成，第 1 轮将回退到具有有界超时的同步调用。

### 级别（多难）

控制每轮辩证推理的**强度**。

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `dialecticReasoningLevel` | `low` | `minimal`, `low`, `medium`, `high`, `max` |
| `dialecticDynamic` | `true` | 当 `true` 时，模型可以将 `reasoning_level` 传递给 `honcho_reasoning` 以覆盖每次调用的默认值。`false` = 始终使用 `dialecticReasoningLevel`，忽略模型覆盖 |

更高级别产生更丰富的综合，但在 Honcho 后端消耗更多 token。

## 多配置文件设置

每个 Hermes 配置文件获得其自己的 Honcho AI 对等体，同时共享相同的工作区（用户上下文）。这意味着：

- 所有配置文件看到相同的用户表示
- 每个配置文件构建其自己的 AI 身份和观察结果
- 一个配置文件写入的结论可通过共享工作区被其他配置文件看到

### 创建带有 Honcho 对等体的配置文件

```bash
hermes profile create coder --clone
# 创建 hermes.coder 主机块，AI 对等体 "coder"，从默认值继承配置
```

`--clone` 对 Honcho 的作用：
1. 在 `honcho.json` 中创建 `hermes.coder` 主机块
2. 设置 `aiPeer: "coder"`（配置文件名称）
3. 从默认值继承 `workspace`, `peerName`, `writeFrequency`, `recallMode` 等
4. 在 Honcho 中急切创建对等体，使其在第一条消息之前存在

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

| 工具 | LLM 调用？ | 成本 | 何时使用 |
|------|-----------|------|----------|
| `honcho_profile` | 否 | 最小 | 在对话开始时快速获取事实快照，或快速查找姓名/角色/偏好 |
| `honcho_search` | 否 | 低 | 获取特定过去事实以自行推理 —— 原始摘录，无综合 |
| `honcho_context` | 否 | 低 | 完整会话上下文快照：摘要、表示、卡片、最近消息 |
| `honcho_reasoning` | 是 | 中–高 | 由 Honcho 的辩证引擎综合的自然语言问题 |
| `honcho_conclude` | 否 | 最小 | 写入或删除持久事实；传递 `peer: "ai"` 以获取 AI 自我知识 |

### `honcho_profile`
读取或更新对等体卡片 —— 精选的关键事实（姓名、角色、偏好、沟通风格）。传递 `card: [...]` 以更新；省略以读取。无 LLM 调用。

### `honcho_search`
对存储的上下文进行特定对等体的语义搜索。返回按相关性排名的原始摘录，无综合。默认 800 token，最大 2000。当您

## 智能体使用模式

当 Honcho 记忆功能启用时，Hermes 的使用指南。

### 对话开始时

```
1. honcho_profile                  → 快速预热，无 LLM 成本
2. 若上下文看起来较薄弱 → honcho_context  （完整快照，仍无 LLM 调用）
3. 若需要深度综合 → honcho_reasoning  （调用 LLM，请谨慎使用）
```

请勿在每一轮对话中都调用 `honcho_reasoning`。自动注入机制已处理持续的上下文刷新。仅当您确实需要基础上下文无法提供的综合洞察时，才使用推理工具。

### 当用户分享需要记住的内容时

```
honcho_conclude conclusion="<具体、可执行的事实>"
```

良好的结论示例：“偏好代码示例而非文字解释”、“正在开展一个截至 2026 年 4 月的 Rust 异步项目”
不良的结论示例：“用户提到了 Rust”（过于模糊）、“用户似乎懂技术”（已包含在表征中）

### 当用户询问过往上下文 / 您需要回忆具体细节时

```
honcho_search query="<主题>"       → 快速，无 LLM，适用于查找具体事实
honcho_context                       → 包含摘要 + 消息的完整快照
honcho_reasoning query="<问题>"     → 综合答案，在搜索不足时使用
```

### 何时使用 `peer: "ai"`

使用 AI 对等目标来构建和查询智能体自身的自我认知：
- `honcho_conclude conclusion="我在解释架构时往往比较啰嗦" peer="ai"` — 自我纠正
- `honcho_reasoning query="我通常如何处理模糊请求？" peer="ai"` — 自我审计
- `honcho_profile peer="ai"` — 查看自身身份卡

### 何时不应调用工具

在 `hybrid` 和 `context` 模式下，基础上下文（用户表征 + 身份卡 + 会话摘要）会在每一轮对话前自动注入。请勿重复获取已注入的内容。仅在以下情况调用工具：
- 您需要注入上下文中没有的内容
- 用户明确要求您回忆或检查记忆
- 您正在就新内容撰写结论

### 节奏感知

工具侧的 `honcho_reasoning` 与自动注入辩证法具有相同的成本。在显式调用工具后，自动注入节奏会重置 — 避免在同一轮对话中重复计费。

## 配置参考

配置文件：`$HERMES_HOME/honcho.json`（针对特定配置文件）或 `~/.honcho/config.json`（全局）。

### 关键设置

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `apiKey` | -- | API 密钥（[获取一个](https://app.honcho.dev)） |
| `baseUrl` | -- | 自托管 Honcho 的基础 URL |
| `peerName` | -- | 用户对等身份 |
| `aiPeer` | host key | AI 对等身份 |
| `workspace` | host key | 共享工作区 ID |
| `recallMode` | `hybrid` | `hybrid`、`context` 或 `tools` |
| `observation` | 全部开启 | 每个对等的 `observeMe`/`observeOthers` 布尔值 |
| `writeFrequency` | `async` | `async`、`turn`、`session` 或整数 N |
| `sessionStrategy` | `per-directory` | `per-directory`、`per-repo`、`per-session`、`global` |
| `messageMaxChars` | `25000` | 每条消息的最大字符数（超出时分块） |

### 辩证法设置

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `dialecticReasoningLevel` | `low` | `minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 根据查询复杂度自动提升推理级别。`false` = 固定级别 |
| `dialecticDepth` | `1` | 每次查询的辩证法轮数（1-3） |
| `dialecticDepthLevels` | -- | 可选的每轮级别数组，例如 `["low", "high"]` |
| `dialecticMaxInputChars` | `10000` | 辩证法查询输入的最大字符数 |

### 上下文预算与注入

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `contextTokens` | 无限制 | 组合基础上下文注入（摘要 + 表征 + 身份卡）的最大 token 数。选择加入限制 — 省略表示无限制，设置为整数以限制注入大小。 |
| `injectionFrequency` | `every-turn` | `every-turn` 或 `first-turn` |
| `contextCadence` | `1` | 上下文 API 调用之间的最小轮数 |
| `dialecticCadence` | `2` | 辩证法 LLM 调用之间的最小轮数（建议 1–5） |

`contextTokens` 预算在注入时强制执行。如果会话摘要 + 表征 + 身份卡超出预算，Honcho 会首先裁剪摘要，然后裁剪表征，保留身份卡。这可防止在长时间会话中上下文膨胀。

### 记忆-上下文清理

Honcho 在注入前会清理 `memory-context` 块，以防止提示注入和格式错误内容：

- 剥离用户撰写的结论中的 XML/HTML 标签
- 规范化空白字符和控制字符
- 截断超过 `messageMaxChars` 的单个结论
- 转义可能破坏系统提示结构的定界符序列

此修复解决了包含标记或特殊字符的原始用户结论可能破坏注入上下文块的边缘情况。

## 故障排除

### “Honcho 未配置”
运行 `hermes honcho setup`。确保 `~/.hermes/config.yaml` 中包含 `memory.provider: honcho`。

### 记忆在会话间未持久化
检查 `hermes honcho status` — 确认 `saveMessages: true` 且 `writeFrequency` 不是 `session`（仅在退出时写入）。

### 配置文件未获得其自身的对等
创建时使用 `--clone`：`hermes profile create <名称> --clone`。对于现有配置文件：`hermes honcho sync`。

### 仪表板中的观察更改未生效
观察配置会在每次会话初始化时从服务器同步。在 Honcho UI 中更改设置后，请启动新会话。

### 消息被截断
超过 `messageMaxChars`（默认 25k）的消息会自动分块并标记 `[continued]`。如果您经常遇到此问题，请检查工具结果或技能内容是否导致消息大小膨胀。

### 上下文注入过大
如果您看到关于超出上下文预算的警告，请降低 `contextTokens` 或减少 `dialecticDepth`。当预算紧张时，会话摘要会首先被裁剪。

### 会话摘要缺失
会话摘要要求当前 Honcho 会话中至少有一轮先前的对话。在冷启动（新会话，无历史记录）时，会省略摘要，Honcho 会改用冷启动提示策略。

## CLI 命令

| 命令 | 描述 |
|---------|-------------|
| `hermes honcho setup` | 交互式设置向导（云端/本地、身份、观察、回忆、会话） |
| `hermes honcho status` | 显示已解析的配置、连接测试、活动配置文件的用户对等信息 |
| `hermes honcho enable` | 为活动配置文件启用 Honcho（必要时创建主机块） |
| `hermes honcho disable` | 为活动配置文件禁用 Honcho |
| `hermes honcho peer` | 显示或更新对等名称（`--user <名称>`、`--ai <名称>`、`--reasoning <级别>`） |
| `hermes honcho peers` | 显示所有配置文件的对等身份 |
| `hermes honcho mode` | 显示或设置回忆模式（`hybrid`、`context`、`tools`） |
| `hermes honcho tokens` | 显示或设置 token 预算（`--context <N>`、`--dialectic <N>`） |
| `hermes honcho sessions` | 列出已知的目录到会话名称映射 |
| `hermes honcho map <名称>` | 将当前工作目录映射到 Honcho 会话名称 |
| `hermes honcho identity` | 设置 AI 对等身份或显示两个对等表征 |
| `hermes honcho sync` | 为所有尚未拥有主机块的 Hermes 配置文件创建主机块 |
| `hermes honcho migrate` | 从 OpenClaw 原生记忆迁移到 Hermes + Honcho 的分步指南 |
| `hermes memory setup` | 通用记忆提供程序选择器（选择 "honcho" 会运行相同的向导） |
| `hermes memory status` | 显示活动的记忆提供程序及其配置 |
| `hermes memory off` | 禁用外部记忆提供程序 |