---
sidebar_position: 99
title: "Honcho 记忆"
description: "通过 Honcho 实现的 AI 原生持久化记忆——辩证推理、多智能体用户建模与深度个性化"
---

# Honcho 记忆

[Honcho](https://github.com/plastic-labs/honcho) 是一个 AI 原生的记忆后端，它在 Hermes 内置的记忆系统之上，增加了辩证推理和深度用户建模能力。Honcho 并非简单的键值存储，而是通过对话结束后的分析推理，持续构建一个关于用户的动态模型——理解他们的偏好、沟通风格、目标和行为模式。

:::info Honcho 是一个记忆提供者插件
Honcho 已集成到[记忆提供者](./memory-providers.md)系统中。以下所有功能均可通过统一的记忆提供者接口使用。
:::

## Honcho 新增功能

| 功能 | 内置记忆 | Honcho |
|-----------|----------------|--------|
| 跨会话持久化 | ✔ 基于文件的 MEMORY.md/USER.md | ✔ 通过 API 实现的服务端存储 |
| 用户画像 | ✔ 智能体手动维护 | ✔ 自动辩证推理 |
| 会话摘要 | — | ✔ 会话范围的上下文注入 |
| 多智能体隔离 | — | ✔ 按对等体分离的画像 |
| 观察模式 | — | ✔ 统一或定向观察 |
| 结论（衍生洞见） | — ✔ 对模式的服务端推理 |
| 跨历史记录搜索 | ✔ FTS5 会话搜索 | ✔ 基于结论的语义搜索 |

**辩证推理**：在每轮对话结束后（由 `dialecticCadence` 控制频率），Honcho 会分析交流内容，并推导出关于用户偏好、习惯和目标的洞见。这些洞见随时间累积，赋予智能体一种超越用户明示信息的、不断深化的理解能力。辩证推理支持多轮深度分析（1-3 轮），并会自动选择冷启动或热提示模板——冷启动查询侧重于通用用户信息，而热提示查询则优先考虑会话范围的上下文。

**会话范围上下文**：基础上下文现在包含了会话摘要，与用户画像和对等体卡片一同呈现。这使得智能体能够感知当前会话中已讨论过的内容，减少重复并实现延续性。

**多智能体画像**：当多个 Hermes 实例与同一用户交互时（例如，一个编程助手和个人助手），Honcho 会维护独立的“对等体”画像。每个对等体仅能看到自己的观察和结论，从而防止上下文交叉污染。

## 设置

```bash
hermes memory setup    # 从提供商列表中选择 "honcho"
```

或手动配置：

```yaml
# ~/.hermes/config.yaml
memory:
  provider: honcho
```

```bash
echo 'HONCHO_API_KEY=***' >> ~/.hermes/.env
```

在 [honcho.dev](https://honcho.dev) 获取 API 密钥。

## 架构

### 两层上下文注入

每一回合（在 `hybrid` 或 `context` 模式下），Honcho 会组装两层上下文并注入到系统提示中：

1. **基础上下文** — 会话摘要、用户画像、用户同伴卡、AI 自我表征和 AI 身份卡。根据 `contextCadence` 刷新。这是“这是谁”的层。
2. **辩证补充** — 由 LLM 合成的关于用户当前状态和需求的推理。根据 `dialecticCadence` 刷新。这是“当前重要的是什么”的层。

两层内容会被拼接并截断至 `contextTokens` 预算（如果已设置）。

### 冷启动/暖启动提示选择

辩证层会自动在两种提示策略之间选择：

- **冷启动**（尚无基础上下文）：通用查询 — "这个人是谁？他们的偏好、目标和工作风格是什么？"
- **暖会话**（存在基础上下文）：会话范围内的查询 — "鉴于到目前为止在此会话中讨论的内容，关于此用户的哪些上下文最为相关？"

这基于基础上下文是否已填充而自动发生。

### 三个正交配置旋钮

成本和深度由三个独立的旋钮控制：

| 旋钮 | 控制内容 | 默认值 |
|------|----------|---------|
| `contextCadence` | `context()` API 调用之间的回合数（基础层刷新） | `1` |
| `dialecticCadence` | `peer.chat()` LLM 调用之间的回合数（辩证层刷新） | `2` （推荐 1–5） |
| `dialecticDepth` | 每次辩证调用执行的 `.chat()` 遍次（1–3） | `1` |

这些是正交的 — 你可以有频繁的上下文刷新配合不频繁的辩证，或者在低频率下进行深度多遍辩证。例如：`contextCadence: 1, dialecticCadence: 5, dialecticDepth: 2` 表示每回合刷新基础上下文，每 5 回合运行一次辩证，并且每次辩证运行执行 2 遍。

### 辩证深度（多遍）

当 `dialecticDepth` > 1 时，每次辩证调用会运行多个 `.chat()` 遍：

- **遍 0**：冷启动或暖提示（见上文）
- **遍 1**：自我审计 — 识别初始评估中的不足，并从近期会话中合成证据
- **遍 2**：协调 — 检查先前遍次之间的矛盾并生成最终综合

每一遍使用按比例的推理级别（早期遍较轻，主遍使用基础级别）。使用 `dialecticDepthLevels` 覆盖每遍的级别 — 例如，对于深度 3 的运行，使用 `["minimal", "medium", "high"]`。

如果先前的遍返回了强信号（长篇、结构化输出），各遍会提前退出，因此深度 3 并不总是意味着 3 次 LLM 调用。

### 会话开始预热

在会话初始化时，Honcho 会在后台以配置的完整 `dialecticDepth` 触发一次辩证调用，并将结果直接交给第 1 回合的上下文组装。对冷同伴的单遍预热通常输出较少 — 多遍深度在用户开口前运行审计/协调循环。如果预热在第 1 回合前未完成，第 1 回合将回退到一个带有有界超时的同步调用。

### 自适应推理级别

自动注入的辩证会根据查询长度调整 `dialecticReasoningLevel`：≥120 字符时 +1 级，≥400 字符时 +2 级，并限制在 `reasoningLevelCap`（默认 `"high"`）以下。设置 `reasoningHeuristic: false` 可禁用此功能，将每次自动调用固定为 `dialecticReasoningLevel`。可用级别：`minimal`、`low`、`medium`、`high`、`max`。

## 配置选项

Honcho 在 `~/.honcho/config.json`（全局）或 `$HERMES_HOME/honcho.json`（配置文件本地）中配置。设置向导会为你处理此事。

### 完整配置参考

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `contextTokens` | `null`（无上限） | 每回合自动注入上下文的 token 预算。设置为整数（例如 1200）以设定上限。在单词边界处截断 |
| `contextCadence` | `1` | `context()` API 调用之间的最小回合数（基础层刷新） |
| `dialecticCadence` | `2` | `peer.chat()` LLM 调用之间的最小回合数（辩证层）。推荐 1–5。在 `tools` 模式下无关 — 模型显式调用 |
| `dialecticDepth` | `1` | 每次辩证调用执行的 `.chat()` 遍次。限制在 1–3 之间 |
| `dialecticDepthLevels` | `null` | 可选数组，指定每遍的推理级别，例如 `["minimal", "low", "medium"]`。覆盖比例默认值 |
| `dialecticReasoningLevel` | `'low'` | 基础推理级别：`minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 当为 `true` 时，模型可通过工具参数在每次调用中覆盖推理级别 |
| `dialecticMaxChars` | `600` | 注入到系统提示中的辩证结果的最大字符数 |
| `recallMode` | `'hybrid'` | `hybrid`（自动注入 + 工具）、`context`（仅注入）、`tools`（仅工具） |
| `writeFrequency` | `'async'` | 刷新消息的时机：`async`（后台线程）、`turn`（同步）、`session`（结束时批量处理）或整数 N |
| `saveMessages` | `true` | 是否将消息持久化到 Honcho API |
| `observationMode` | `'directional'` | `directional`（全部开启）或 `unified`（共享池）。可通过 `observation` 对象覆盖以实现细粒度控制 |
| `messageMaxChars` | `25000` | 通过 `add_messages()` 发送的每条消息的最大字符数。超出则分块 |
| `dialecticMaxInputChars` | `10000` | 输入到 `peer.chat()` 的辩证查询的最大字符数 |
| `sessionStrategy` | `'per-directory'` | `per-directory`、`per-repo`、`per-session` 或 `global` |

**会话策略** 控制 Honcho 会话如何映射到你的工作：
- `per-session` — 每次 `hermes` 运行都会获得一个新的会话。干净的开始，通过工具使用记忆。推荐新用户使用。
- `per-directory` — 每个工作目录一个 Honcho 会话。上下文跨运行累积。
- `per-repo` — 每个 git 仓库一个会话。
- `global` — 跨所有目录的单一会话。

**召回模式** 控制记忆如何流入对话：
- `hybrid` — 上下文自动注入到系统提示中，并且工具可用（模型决定何时查询）。
- `context` — 仅自动注入，工具隐藏。
- `tools` — 仅工具，无自动注入。智能体必须显式调用 `honcho_reasoning`、`honcho_search` 等。

**每种召回模式的设置：**

| 设置 | `hybrid` | `context` | `tools` |
|---------|----------|-----------|---------|
| `writeFrequency` | 刷新消息 | 刷新消息 | 刷新消息 |
| `contextCadence` | 控制基础上下文刷新 | 控制基础上下文刷新 | 无关 — 无注入 |
| `dialecticCadence` | 控制自动 LLM 调用 | 控制自动 LLM 调用 | 无关 — 模型显式调用 |
| `dialecticDepth` | 每次调用多遍 | 每次调用多遍 | 无关 — 模型显式调用 |
| `contextTokens` | 限制注入 | 限制注入 | 无关 — 无注入 |
| `dialecticDynamic` | 控制模型覆盖 | N/A（无工具） | 控制模型覆盖 |

在 `tools` 模式下，模型完全掌控 — 它在需要时调用 `honcho_reasoning`，并选择它想要的任何 `reasoning_level`。节奏和预算设置仅适用于具有自动注入的模式（`hybrid` 和 `context`）。

## 观察（定向 vs. 统一）

Honcho 将对话建模为同伴交换消息。每个同伴有两个观察开关，与 Honcho 的 `SessionPeerConfig` 一一对应：

| 开关 | 效果 |
|--------|--------|
| `observeMe` | Honcho 根据此同伴自身消息构建其画像 |
| `observeOthers` | 此同伴观察其他同伴的消息（提供跨同伴推理） |

两个同伴 × 两个开关 = 四个标志。`observationMode` 是预设的简写：

| 预设 | 用户标志 | AI 标志 | 语义 |
|--------|-----------|----------|-----------|
| `"directional"` （默认） | me: on, others: on | me: on, others: on | 完全相互观察。启用跨同伴辩证 — "AI 基于用户所说和 AI 所答，对用户了解多少。" |
| `"unified"` | me: on, others: off | me: off, others: on | 共享池语义 — AI 仅观察用户消息，用户同伴仅进行自我建模。单观察者池。 |

使用显式的 `observation` 块覆盖预设以进行每同伴控制：

```json
"observation": {
  "user": { "observeMe": true,  "observeOthers": true },
  "ai":   { "observeMe": true,  "observeOthers": false }
}
```

常见模式：

| 意图 | 配置 |
|--------|--------|
| 完全观察（大多数用户） | `"observationMode": "directional"` |
| AI 不应从其自身的回复中重新建模用户 | `"ai": {"observeMe": true, "observeOthers": false}` |
| AI 同伴不应通过自我观察更新的强大人格 | `"ai": {"observeMe": false, "observeOthers": true}` |

通过 [Honcho 仪表板](https://app.honcho.dev) 设置的服务器端开关优先于本地默认值 — Hermes 在会话初始化时将其同步回来。

## 工具

当 Honcho 作为记忆提供者处于活动状态时，五个工具变得可用：

| 工具 | 用途 |
|------|---------|
| `honcho_profile` | 读取或更新同伴卡片 — 传递 `card`（事实列表）进行更新，省略则读取 |
| `honcho_search` | 基于上下文的语义搜索 — 返回原始摘录，不进行 LLM 综合 |
| `honcho_context` | 完整的会话上下文 — 摘要、表示、卡片、最近消息 |
| `honcho_reasoning` | Honcho 的 LLM 综合的答案 — 传递 `reasoning_level`（minimal/low/medium/high/max）以控制深度 |
| `honcho_conclude` | 创建或删除结论 — 传递 `conclusion` 以创建，`delete_id` 以删除（仅限个人身份信息） |

## CLI 命令

`hermes honcho` 子命令**仅在 Honcho 是活动的记忆提供者时注册**（`config.yaml` 中的 `memory.provider: honcho`）。首先运行 `hermes memory setup` 并选择 Honcho；该子命令将在下一次调用时出现。

```bash
hermes honcho status          # 连接状态、配置和关键设置
hermes honcho setup           # 重定向到 `hermes memory setup`
hermes honcho strategy        # 显示或设置会话策略（每次会话/每个目录/每个仓库/全局）
hermes honcho peer            # 显示或更新同伴名称 + 辩证推理级别
hermes honcho mode            # 显示或设置召回模式（hybrid/context/tools）
hermes honcho tokens          # 显示或设置上下文和辩证的 token 预算
hermes honcho identity        # 为 AI 同伴的 Honcho 身份生成种子或显示
hermes honcho sync            # 将 Honcho 配置同步到所有现有配置文件
hermes honcho peers           # 显示所有配置文件中的同伴身份
hermes honcho sessions        # 列出已知的 Honcho 会话映射
hermes honcho map             # 将当前目录映射到 Honcho 会话名称
hermes honcho enable          # 为活动配置文件启用 Honcho
hermes honcho disable         # 为活动配置文件禁用 Honcho
hermes honcho migrate         # 从 openclaw-honcho 迁移的分步指南
```

## 从 `hermes honcho` 迁移

如果您之前使用过独立的 `hermes honcho setup`：

1. 您现有的配置（`honcho.json` 或 `~/.honcho/config.json`）已保留
2. 您的服务器端数据（记忆、结论、用户资料）完好无损
3. 在 config.yaml 中设置 `memory.provider: honcho` 以重新激活

无需重新登录或重新设置。运行 `hermes memory setup` 并选择 "honcho" — 向导会检测到您现有的配置。

## 完整文档

请参阅[记忆提供者 — Honcho](./memory-providers.md#honcho) 获取完整参考。