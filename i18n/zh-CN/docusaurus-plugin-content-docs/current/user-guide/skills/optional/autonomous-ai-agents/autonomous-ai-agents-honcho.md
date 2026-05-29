---
title: "Honcho"
sidebar_label: "Honcho"
description: "为 Hermes 配置和使用 Honcho 记忆——跨会话用户建模、多档案对等隔离、观察配置、辩证推理、会话摘要及上下文预算强制。用于设置 Honcho、排查记忆问题、通过 Honcho 对等方管理档案或调整观察、回忆和辩证设置时使用。"
---

{/* 本页面由网站脚本 scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。*/}

# Honcho

为 Hermes 配置和使用 Honcho 记忆——跨会话用户建模、多档案对等隔离、观察配置、辩证推理、会话摘要及上下文预算强制。用于设置 Honcho、排查记忆问题、通过 Honcho 对等方管理档案或调整观察、回忆和辩证设置时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/autonomous-ai-agents/honcho` 安装 |
| 路径 | `optional-skills/autonomous-ai-agents/honcho` |
| 版本 | `2.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Honcho`, `Memory`, `Profiles`, `Observation`, `Dialectic`, `User-Modeling`, `Session-Summary` |
| 相关技能 | [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Hermes 的 Honcho 记忆功能

Honcho 提供 AI 原生的跨会话用户建模。它跨对话学习用户信息，并在为每个 Hermes 配置文件赋予独立对等身份的同时，共享统一的用户视图。

## 适用场景

- 设置 Honcho（云或自托管）
- 排查记忆不工作/对等体不同步的问题
- 创建多配置文件设置，其中每个智能体拥有自己的 Honcho 对等体
- 调整观察、回忆、辩证深度或写入频率设置
- 了解 5 个 Honcho 工具的功能及使用时机
- 配置上下文预算和会话摘要注入

## 设置

### 云端 (app.honcho.dev)

```bash
hermes honcho setup
# 选择“云”，从 https://app.honcho.dev 粘贴 API 密钥
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

当 Honcho 将上下文注入系统提示时（在 `hybrid` 或 `context` 回忆模式下），它按以下顺序组装基础上下文块：

1.  **会话摘要** -- 到目前为止当前会话的简要摘要（放在首位，以便模型具有即时的对话连续性）
2.  **用户表示** -- Honcho 积累的用户模型（偏好、事实、模式）
3.  **AI 对等体卡片** -- 此 Hermes 配置文件的 AI 对等体身份卡

会话摘要由 Honcho 在每轮开始时（当存在先前会话时）自动生成。它为模型提供热启动，无需重放完整历史记录。

### 冷启动/热启动提示选择

Honcho 自动在两种提示策略之间选择：

| 条件 | 策略 | 发生情况 |
|------|------|----------|
| 没有先前会话或表示为空 | **冷启动** | 轻量级介绍提示；跳过摘要注入；鼓励模型了解用户 |
| 存在现有表示和/或会话历史 | **热启动** | 完整的基础上下文注入（摘要 → 表示 → 卡片）；更丰富的系统提示 |

您无需配置此项 — 它基于会话状态自动执行。

### 对等体

Honcho 将对话建模为**对等体**之间的交互。Hermes 为每个会话创建两个对等体：

-   **用户对等体** (`peerName`)：代表人类。Honcho 从观察到的消息构建用户表示。
-   **AI 对等体** (`aiPeer`)：代表此 Hermes 实例。每个配置文件都有自己的 AI 对等体，因此智能体可以发展独立的视图。

### 观察

每个对等体有两个观察开关，控制 Honcho 学习的内容：

| 开关 | 功能 |
|------|------|
| `observeMe` | 观察对等体自己的消息（构建自我表示） |
| `observeOthers` | 观察其他对等体的消息（构建跨对等体理解） |

默认设置：所有四个开关**开启**（完全双向观察）。

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
| `"directional"` (默认) | 我:开, 其他:开 | 我:开, 其他:开 | 多智能体，完整记忆 |
| `"unified"` | 我:开, 其他:关 | 我:关, 其他:开 | 单一智能体，仅用户建模 |

在 [Honcho 仪表板](https://app.honcho.dev)中更改的设置会在会话初始化时同步回来 — 服务器端配置优先于本地默认值。

### 会话

Honcho 会话定义了消息和观察的落地范围。策略选项：

| 策略 | 行为 |
|------|------|
| `per-directory` (默认) | 每个工作目录一个会话 |
| `per-repo` | 每个 Git 仓库根目录一个会话 |
| `per-session` | 每次 Hermes 运行创建新 Honcho 会话 |
| `global` | 跨所有目录的单个会话 |

手动覆盖：`hermes honcho map my-project-name`

### 回忆模式

智能体如何访问 Honcho 记忆：

| 模式 | 自动注入上下文？ | 工具可用？ | 用例 |
|------|-----------------|-----------|------|
| `hybrid` (默认) | 是 | 是 | 智能体决定何时使用工具与自动上下文 |
| `context` | 是 | 否（隐藏） | 最小令牌成本，无工具调用 |
| `tools` | 否 | 是 | 智能体显式控制所有记忆访问 |

## 三个正交旋钮

Honcho 的辩证行为由三个独立维度控制。每个维度都可以在不影响其他维度的情况下进行调整：

### 节奏（何时）

控制辩证和上下文调用发生的**频率**。

| 键 | 默认值 | 描述 |
|----|--------|------|
| `contextCadence` | `1` | 上下文 API 调用之间的最小轮数 |
| `dialecticCadence` | `2` | 辩证 API 调用之间的最小轮数。建议 1-5 |
| `injectionFrequency` | `every-turn` | 基础上下文注入使用 `every-turn` 或 `first-turn` |

较高的节奏值会减少辩证 LLM 的调用频率。`dialecticCadence: 2` 表示引擎每隔一轮触发一次。将其设置为 `1` 则每轮触发。

### 深度（多少轮）

控制 Honcho 为每个查询执行**多少轮**辩证推理。

| 键 | 默认值 | 范围 | 描述 |
|----|--------|------|------|
| `dialecticDepth` | `1` | 1-3 | 每个查询的辩证推理轮数 |
| `dialecticDepthLevels` | -- | 数组 | 可选的每深度轮级别覆盖（见下文） |

`dialecticDepth: 2` 意味着 Honcho 运行两轮辩证综合。第一轮产生初始答案；第二轮进行优化。

`dialecticDepthLevels` 允许您独立设置每轮的推理级别：

```json
{
  "dialecticDepth": 3,
  "dialecticDepthLevels": ["low", "medium", "high"]
}
```

如果省略 `dialecticDepthLevels`，各轮将使用从 `dialecticReasoningLevel`（基础）推导出的**比例级别**：

| 深度 | 传递级别 |
|------|----------|
| 1 | [基础] |
| 2 | [最小, 基础] |
| 3 | [最小, 基础, 低] |

这使得早期传递成本较低，同时在最终综合时使用完整深度。

**会话开始时的深度。** 会话开始时的预热会在第 1 轮之前在后台运行完整的已配置 `dialecticDepth`。在冷对等体上进行单次预热通常返回的输出较薄 — 多次深度运行会在用户发言前执行审计/协调循环。第 1 轮直接消耗预热结果；如果预热未及时完成，第 1 轮将回退到带有有界超时的同步调用。

### 级别（多深入）

控制每轮辩证推理的**强度**。

| 键 | 默认值 | 描述 |
|----|--------|------|
| `dialecticReasoningLevel` | `low` | `minimal`, `low`, `medium`, `high`, `max` |
| `dialecticDynamic` | `true` | 为 `true` 时，模型可以向 `honcho_reasoning` 传递 `reasoning_level` 以覆盖每次调用的默认值。`false` = 始终使用 `dialecticReasoningLevel`，忽略模型覆盖 |

较高级别会产生更丰富的综合结果，但在 Honcho 后端会消耗更多令牌。

## 多配置文件设置

每个 Hermes 配置文件都拥有自己的 Honcho AI 对等体，同时共享相同的工作区（用户上下文）。这意味着：

-   所有配置文件看到相同的用户表示
-   每个配置文件构建自己的 AI 身份和观察
-   一个配置文件写入的结论通过共享工作区对其他配置文件可见

### 创建带有 Honcho 对等体的配置文件

```bash
hermes profile create coder --clone
# 创建主机块 hermes.coder，AI 对等体 "coder"，从默认值继承配置
```

`--clone` 对 Honcho 的作用：
1.  在 `honcho.json` 中创建 `hermes.coder` 主机块
2.  设置 `aiPeer: "coder"`（配置文件名）
3.  从默认值继承 `workspace`, `peerName`, `writeFrequency`, `recallMode` 等
4.  立即在 Honcho 中创建对等体，使其在第一条消息之前就存在

### 回填现有配置文件

```bash
hermes honcho sync    # 为所有尚无主机块的配置文件创建主机块
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

| 工具 | LLM 调用？ | 成本 | 使用时机 |
|------|-----------|------|----------|
| `honcho_profile` | 否 | 最小 | 对话开始时快速获取事实快照或快速查找名称/角色/偏好 |
| `honcho_search` | 否 | 低 | 获取特定的过去事实以便自行推理 — 原始摘录，无综合 |
| `honcho_context` | 否 | 低 | 完整的会话上下文快照：摘要、表示、卡片、近期消息 |
| `honcho_reasoning` | 是 | 中-高 | 由 Honcho 的辩证引擎综合的自然语言问题 |
| `honcho_conclude` | 否 | 最小 | 写入或删除持久性事实；传递 `peer: "ai"` 以用于 AI 自我认知 |

### `honcho_profile`
读取或更新对等体卡片 — 精选的关键事实（姓名、角色、偏好、沟通风格）。传递 `card: [...]` 以更新；省略则读取。无 LLM 调用。

### `honcho_search`
针对特定对等体的已存储上下文进行语义搜索。返回按相关性排序的原始摘录，无综合。默认 800 令牌，最大 2000。当您需要特定的过去事实以便自行推理而非综合答案时很有用。

### `honcho_context`
来自 Honcho 的完整会话上下文快照 — 会话摘要、对等体表示、对等体卡片和近期消息。无 LLM 调用。当您想一次性查看 Honcho 所知的关于当前会话和对等体的所有信息时使用。

### `honcho_reasoning`
由 Honcho 的辩证推理引擎（Honcho 后端的 LLM 调用）回答的自然语言问题。成本较高，质量较好。传递 `reasoning_level` 以控制深度：`minimal`（快速/便宜）→ `low` → `medium` → `high` → `max`（全面）。省略则使用配置的默认值（`low`）。用于对用户的模式、目标或当前状态进行综合理解。

### `honcho_conclude`
写入或删除关于对等体的持久性结论。传递 `conclusion: "..."` 以创建。传递 `delete_id: "..."` 以移除结论（用于 PII 移除 — Honcho 会随时间自动修复错误结论，因此删除仅用于 PII）。您必须传递且仅传递其中一个。

### 双向对等体目标定位

所有 5 个工具都接受一个可选的 `peer` 参数：
-   `peer: "user"`（默认）— 操作用户对等体
-   `peer: "ai"` — 操作此配置文件的 AI 对等体
-   `peer: "<explicit-id>"` — 工作区中的任何对等体 ID

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

Hermes 在 Honcho 内存激活时的操作指南。

### 对话开始时

```
1. honcho_profile                  → 快速预热，无 LLM 成本
2. 若上下文信息不足 → honcho_context  (完整快照，仍无 LLM)
3. 若需深度合成 → honcho_reasoning  (LLM 调用，谨慎使用)
```

**不要**在每个轮次都调用 `honcho_reasoning`。自动注入机制已处理持续的上下文刷新。仅在您真正需要注入基础上下文未提供的合成洞察时，才使用推理工具。

### 当用户分享需要记住的内容时

```
honcho_conclude conclusion="<具体、可操作的事实>"
```

好的结论示例："偏好代码示例而非纯文字解释"、"正在处理一个 Rust 异步项目，持续到 2026 年 4 月"
不好的结论示例："用户说了关于 Rust 的事"（过于模糊）、"用户似乎懂技术"（已体现在表征中）

### 当用户询问过往上下文 / 您需要回忆具体细节时

```
honcho_search query="<主题>"       → 快速，无 LLM，适用于特定事实
honcho_context                       → 包含摘要和消息的完整快照
honcho_reasoning query="<问题>"    → 合成答案，当搜索不足时使用
```

### 何时使用 `peer: "ai"`

使用 AI 对等目标来构建和查询智能体自身的知识：
- `honcho_conclude conclusion="我解释架构时倾向于啰嗦" peer="ai"` — 自我纠正
- `honcho_reasoning query="我通常如何处理模糊请求？" peer="ai"` — 自我审查
- `honcho_profile peer="ai"` — 审查自己的身份卡

### 何时**不**调用工具

在 `hybrid` 和 `context` 模式下，基础上下文（用户表征 + 卡片 + 会话摘要）会在每个轮次前自动注入。不要重新获取已注入的内容。仅在以下情况下调用工具：
- 您需要注入上下文中没有的信息
- 用户明确要求您回忆或检查记忆
- 您正在为新内容撰写结论

### 频率意识

`honcho_reasoning` 工具调用与自动注入辩证法的消耗相同。在一次显式工具调用之后，自动注入的频率会重置，从而避免在同一次轮次中双重计费。

## 配置参考

配置文件：`$HERMES_HOME/honcho.json` (按配置文件) 或 `~/.honcho/config.json` (全局)。

### 关键设置

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `apiKey` | -- | API 密钥 ([点击获取](https://app.honcho.dev)) |
| `baseUrl` | -- | 自托管 Honcho 的基础 URL |
| `peerName` | -- | 用户对等身份 |
| `aiPeer` | host key | AI 对等身份 |
| `workspace` | host key | 共享工作区 ID |
| `recallMode` | `hybrid` | `hybrid`、`context` 或 `tools` |
| `observation` | 全部开启 | 每个对等体的 `observeMe`/`observeOthers` 布尔值 |
| `writeFrequency` | `async` | `async`、`turn`、`session` 或整数 N |
| `sessionStrategy` | `per-directory` | `per-directory`、`per-repo`、`per-session`、`global` |
| `messageMaxChars` | `25000` | 每条消息的最大字符数（超出则分块） |

### 辩证设置

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `dialecticReasoningLevel` | `low` | `minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 根据查询复杂度自动提升推理等级。`false` = 固定等级 |
| `dialecticDepth` | `1` | 每次查询的辩证轮数 (1-3) |
| `dialecticDepthLevels` | -- | 可选的每轮等级数组，例如 `["low", "high"]` |
| `dialecticMaxInputChars` | `10000` | 辩证查询输入的最大字符数 |

### 上下文预算与注入

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `contextTokens` | 无上限 | 组合基础上下文注入（摘要 + 表征 + 卡片）的最大 token 数。可选上限——省略则保持无上限，设置为整数则限制注入大小。 |
| `injectionFrequency` | `every-turn` | `every-turn` 或 `first-turn` |
| `contextCadence` | `1` | 上下文 API 调用的最小间隔轮数 |
| `dialecticCadence` | `2` | 辩证 LLM 调用的最小间隔轮数（推荐 1–5） |

`contextTokens` 预算在注入时强制执行。如果会话摘要 + 表征 + 卡片超出预算，Honcho 会首先裁剪摘要，然后裁剪表征，保留卡片。这可以防止长会话中的上下文爆炸。

### 内存上下文净化

Honcho 在注入前对 `memory-context` 块进行净化，以防止提示注入和格式错误的内容：

- 去除用户撰写的结论中的 XML/HTML 标签
- 规范化空白和控制字符
- 截断超过 `messageMaxChars` 的单个结论
- 转义可能破坏系统提示结构的定界符序列

此修复解决了原始用户结论包含标记或特殊字符可能损坏注入上下文块的边缘情况。

## 故障排除

### "Honcho not configured"
运行 `hermes honcho setup`。确保 `~/.hermes/config.yaml` 中包含 `memory.provider: honcho`。

### 记忆在会话间不持久
检查 `hermes honcho status` — 验证 `saveMessages: true` 且 `writeFrequency` 不是 `session`（`session` 仅在退出时写入）。

### 配置文件未获得自己的对等身份
创建时使用 `--clone`：`hermes profile create <name> --clone`。对于现有配置文件：`hermes honcho sync`。

### 仪表板中的观察设置更改未生效
观察配置在每次会话初始化时从服务器同步。在 Honcho 界面中更改设置后，请启动新会话。

### 消息被截断
超过 `messageMaxChars`（默认 25k）的消息会自动带有 `[continued]` 标记进行分块。如果频繁遇到此问题，请检查工具结果或技能内容是否导致消息大小膨胀。

### 上下文注入过大
如果您看到关于上下文预算超限的警告，请降低 `contextTokens` 或减少 `dialecticDepth`。当预算紧张时，会话摘要会被优先裁剪。

### 会话摘要缺失
会话摘要至少需要当前 Honcho 会话中的一个先前轮次。在冷启动（新会话，无历史记录）时，摘要将被省略，Honcho 改用冷启动提示策略。

## CLI 命令

| 命令 | 描述 |
|---------|-------------|
| `hermes honcho setup` | 交互式设置向导（云/本地、身份、观察、召回、会话） |
| `hermes honcho status` | 显示已解析的配置、连接测试、活动配置文件的对等信息 |
| `hermes honcho enable` | 为活动配置文件启用 Honcho（如需要则创建 host 块） |
| `hermes honcho disable` | 为活动配置文件禁用 Honcho |
| `hermes honcho peer` | 显示或更新对等名称 (`--user <name>`, `--ai <name>`, `--reasoning <level>`) |
| `hermes honcho peers` | 显示所有配置文件的对等身份 |
| `hermes honcho mode` | 显示或设置召回模式 (`hybrid`, `context`, `tools`) |
| `hermes honcho tokens` | 显示或设置 token 预算 (`--context <N>`, `--dialectic <N>`) |
| `hermes honcho sessions` | 列出已知的目录到会话名称的映射 |
| `hermes honcho map <name>` | 将当前工作目录映射到 Honcho 会话名称 |
| `hermes honcho identity` | 初始化 AI 对等身份或显示两个对等表征 |
| `hermes honcho sync` | 为所有尚未拥有 host 块的 Hermes 配置文件创建 host 块 |
| `hermes honcho migrate` | 从 OpenClaw 原生内存迁移到 Hermes + Honcho 的分步指南 |
| `hermes memory setup` | 通用内存提供商选择器（选择 "honcho" 将运行相同的向导） |
| `hermes memory status` | 显示活动的内存提供商和配置 |
| `hermes memory off` | 禁用外部内存提供商 |