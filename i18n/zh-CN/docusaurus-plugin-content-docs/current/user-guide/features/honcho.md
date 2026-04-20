---
sidebar_position: 99
title: "Honcho Memory"
description: "基于 Honcho 的 AI 原生持久记忆 —— 辩证推理、多智能体用户建模和深度个性化"
---

# Honcho Memory

[Honcho](https://github.com/plastic-labs/honcho) 是一个 AI 原生的记忆后端，它在 Hermes 内置的记忆系统之上增加了辩证推理和深度的用户建模。与简单的键值存储不同，Honcho 通过事后推理对话内容，持续维护对用户的动态建模 —— 包括其偏好、沟通风格、目标和行为模式。

:::info Honcho 是记忆提供程序插件
Honcho 已集成到 [记忆提供程序](./memory-providers.md) 系统中。以下所有功能均可通过统一的记忆提供程序接口使用。
:::

## Honcho 带来的能力

| 能力 | 内置记忆 | Honcho |
|-----------|----------------|--------|
| 跨会话持久化 | ✔ 基于文件的 MEMORY.md/USER.md | ✔ 服务端 API |
| 用户画像 | ✔ 手动代理管理 | ✔ 自动辩证推理 |
| 会话摘要 | — | ✔ 会话范围上下文注入 |
| 多代理隔离 | — | ✔ 每个代理独立配置文件 |
| 观察模式 | — | ✔ 统一或定向观察 |
| 结论（衍生洞察） | — | ✔ 服务端对模式的推理 |
| 历史搜索 | ✔ FTS5 会话搜索 | ✔ 对结论的语义搜索 |

**辩证推理**：每次对话轮次后（由 `dialecticCadence` 控制），Honcho 会分析交流内容，并推导出关于用户偏好、习惯和目标的洞察。这些洞察随时间积累，使代理对用户有越来越深入的理解，超越了用户明确表达的内容。辩证推理支持多轮深度（1–3 轮），并自动选择冷/暖提示词 —— 冷启动查询关注一般性用户事实，而暖查询则优先处理当前会话范围内的上下文。

**会话范围上下文**：基础上下文现在包含会话摘要，以及用户表示和同伴卡。这使代理能够了解当前会话中已经讨论过的内容，减少重复，实现连续性。

**多代理配置文件**：当多个 Hermes 实例与同一用户交互时（例如，一个编程助手和一个个人助手），Honcho 会为每个代理维护独立的“同伴”配置文件。每个代理只能看到自己的观察结果和结论，防止上下文交叉污染。

## 设置

```bash
hermes memory setup    # 从提供程序列表中选择 "honcho"
```

或者手动配置：

```yaml
# ~/.hermes/config.yaml
memory:
  provider: honcho
```

```bash
echo "HONCHO_API_KEY=*** >> ~/.hermes/.env
```

在 [honcho.dev](https://honcho.dev) 获取 API 密钥。

## 架构

### 双层上下文注入

在每一轮（`hybrid` 或 `context` 模式下），Honcho 会将两层上下文注入系统提示中：

1. **基础上下文** —— 会话摘要、用户表示、用户同伴卡、AI 自我表示和 AI 身份卡。在 `contextCadence` 时刷新。这是“这个用户是谁”层。
2. **辩证补充** —— LLM 合成的关于用户当前状态和需求的推理。在 `dialecticCadence` 时刷新。这是“现在最重要的是什么”层。

这两层内容会被连接起来，并根据 `contextTokens` 预算进行截断（如果设置了的话）。

### 冷/暖提示词选择

辩证推理会自动在两种提示策略之间进行选择：

- **冷启动**（尚无基础上下文）：通用查询 —— “这个人谁？他们的偏好、目标和工作方式是什么？”
- **暖会话**（存在基础上下文）：会话范围查询 —— “根据当前会话中已经讨论的内容，关于这个用户的最相关上下文是什么？”

这会根据基础上下文是否已填充自动发生。

### 三个正交配置旋钮

成本和深度由三个独立的旋钮控制：

| 旋钮 | 控制 | 默认值 |
|------|----------|---------|
| `contextCadence` | `context()` API 调用之间的轮数（基础层刷新） | `1` |
| `dialecticCadence` | `peer.chat()` LLM 调用之间的轮数（辩证层刷新） | `2`（推荐 1–5） |
| `dialecticDepth` | 每次辩证调用的 `.chat()` 轮数（1–3） | `1` |

这些是正交的 —— 你可以频繁刷新基础上下文但低频运行辩证推理，或者低频运行深度多轮辩证推理。示例：`contextCadence: 1, dialecticCadence: 5, dialecticDepth: 2` 表示每轮刷新基础上下文，每 5 轮运行一次辩证推理，每次辩证推理运行 2 轮。

### 辩证深度（多轮）

当 `dialecticDepth` > 1 时，每次辩证调用会运行多轮 `.chat()`：

- **第 0 轮**：冷或暖提示词（如上所述）
- **第 1 轮**：自我审计 —— 识别初始评估中的差距，并从最近会话中综合证据
- **第 2 轮**：调和 —— 检查各轮次之间是否存在矛盾，并生成最终的综合结果

每轮使用比例推理级别（早期轮次较轻，主轮使用基础级别）。通过 `dialecticDepthLevels` 覆盖每轮的级别 —— 例如，`["minimal", "medium", "high"]` 用于深度为 3 的运行。

如果前一轮返回强信号（长且结构化的输出），各轮会提前退出，因此深度 3 并不总是意味着 3 次 LLM 调用。

### 会话开始预加热

在会话初始化时，Honcho 会在后台以完整配置的 `dialecticDepth` 发起一次辩证调用，并将结果直接传递给第 1 轮的上下文组装。单轮预加热对冷同伴通常返回薄输出 —— 多轮深度运行会在用户说话前执行审计/调和循环。如果到第 1 轮时预加热尚未完成，第 1 轮将回退到带超时限制的同步调用。

### 查询自适应推理级别

自动注入的辩证推理会根据查询长度缩放 `dialecticReasoningLevel`：≥120 字符时 +1 级，≥400 字符时 +2 级，上限为 `reasoningLevelCap`（默认为 `"high"`）。通过 `reasoningHeuristic: false` 禁用，将所有自动调用固定到 `dialecticReasoningLevel`。可用级别：`minimal`、`low`、`medium`、`high`、`max`。

## 配置选项

Honcho 在 `~/.honcho/config.json`（全局）或 `$HERMES_HOME/honcho.json`（配置文件本地）中配置。设置向导会为您处理这些配置。

### 完整配置参考

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `contextTokens` | `null`（无限制） | 每轮自动注入上下文的令牌预算。设置为整数（例如 1200）来限制。在单词边界处截断 |
| `contextCadence` | `1` | `context()` API 调用之间的最小轮数（基础层刷新） |
| `dialecticCadence` | `2` | `peer.chat()` LLM 调用之间的最小轮数（辩证层）。推荐 1–5。在 `tools` 模式下无关 —— 模型显式调用 |
| `dialecticDepth` | `1` | 每次辩证调用的 `.chat()` 轮数。限制在 1–3 |
| `dialecticDepthLevels` | `null` | 可选的每轮推理级别数组，例如 `["minimal", "low", "medium"]`。覆盖比例默认值 |
| `dialecticReasoningLevel` | `'low'` | 基础推理级别：`minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 当 `true` 时，模型可以通过工具参数覆盖每调用的推理级别 |
| `dialecticMaxChars` | `600` | 注入系统提示的辩证结果最大字符数 |
| `recallMode` | `'hybrid'` | `hybrid`（自动注入 + 工具），`context`（仅注入），`tools`（仅工具） |
| `writeFrequency` | `'async'` | 消息刷新的时机：`async`（后台线程），`turn`（同步），`session`（结束时批量），或整数 N |
| `saveMessages` | `true` | 是否将消息持久化到 Honcho API |
| `observationMode` | `'directional'` | `directional`（全部开启）或 `unified`（共享池）。通过 `observation` 对象覆盖以实现细粒度控制 |
| `messageMaxChars` | `25000` | 通过 `add_messages()` 发送的每条消息的最大字符数。超过时会被分块 |
| `dialecticMaxInputChars` | `10000` | 辩证查询输入到 `peer.chat()` 的最大字符数 |
| `sessionStrategy` | `'per-directory'` | `per-directory`、`per-repo`、`per-session` 或 `global` |

**会话策略**控制 Honcho 会话如何映射到您的工作：
- `per-session` —— 每次 `hermes` 运行获得新会话。干净启动，通过工具记忆。推荐给新用户。
- `per-directory` —— 每个工作目录一个 Honcho 会话。跨运行累积上下文。
- `per-repo` —— 每个 git 仓库一个会话。
- `global` —— 所有目录间单一会话。

**回忆模式**控制记忆如何流入对话：
- `hybrid` —— 上下文自动注入系统提示 AND 提供工具（模型决定何时查询）。
- `context` —— 仅自动注入，隐藏工具。
- `tools` —— 仅工具，无自动注入。代理必须显式调用 `honcho_reasoning`、`honcho_search` 等。

**每种回忆模式下的设置：**

| 设置 | `hybrid` | `context` | `tools` |
|---------|----------|-----------|---------|
| `writeFrequency` | 刷新消息 | 刷新消息 | 刷新消息 |
| `contextCadence` | 控制基础上下文刷新 | 控制基础上下文刷新 | 无关 —— 无注入 |
| `dialecticCadence` | 控制自动 LLM 调用 | 控制自动 LLM 调用 | 无关 —— 模型显式调用 |
| `dialecticDepth` | 每次调用多轮 | 每次调用多轮 | 无关 —— 模型显式调用 |
| `contextTokens` | 限制注入 | 限制注入 | 无关 —— 无注入 |
| `dialecticDynamic` | 控制模型覆盖 | N/A（无工具） | 控制模型覆盖 |

在 `tools` 模式下，模型完全掌控 —— 它根据需要调用 `honcho_reasoning`，并以它选择的任何 `reasoning_level`。节奏和预算设置仅适用于有自动注入的模式（`hybrid` 和 `context`）。

## 观察（定向 vs. 统一）

Honcho 将对话建模为同伴交换消息。每个同伴有两个观察开关，与 Honcho 的 `SessionPeerConfig` 一一对应：

| 开关 | 效果 |
|--------|--------|
| `observeMe` | Honcho 根据该同伴的消息构建其表示 |
| `observeOthers` | 该同伴观察其他同伴的消息（为跨同伴推理提供数据） |

两个同伴 × 两个开关 = 四个标志。`observationMode` 是一个简写预设：

| 预设 | 用户标志 | AI 标志 | 语义 |
|--------|-----------|----------|-----------|
| `"directional"`（默认） | me: 开, others: 开 | me: 开, others: 开 | 完全相互观察。启用跨同伴辩证推理 —— “AI 基于用户所说和 AI 所回复的内容，对用户了解多少。” |
| `"unified"` | me: 开, others: 关 | me: 关, others: 开 | 共享池语义 —— AI 只观察用户的消息，用户同伴只自我建模。单一观察者池。 |

通过显式的 `observation` 块覆盖预设以实现每个同伴的控制：

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
| AI 不应从其自身回复中重新建模用户 | `"ai": {"observeMe": true, "observeOthers": false}` |
| 强人格 AI 同伴不应从自我观察中更新 | `"ai": {"observeMe": false, "observeOthers": true}` |

通过 [Honcho 仪表板](https://app.honcho.dev) 在服务端设置的开关会覆盖本地默认值 —— Hermes 在会话初始化时同步它们。

## 工具

当 Honcho 作为记忆提供程序激活时，五个工具变得可用：

| 工具 | 用途 |
|------|---------|
| `honcho_profile` | 读取或更新同伴卡 —— 传递 `card`（事实列表）来更新，省略来读取 |
| `honcho_search` | 对上下文的语义搜索 —— 原始摘录，无 LLM 合成 |
| `honcho_context` | 完整会话上下文 —— 摘要、表示、卡、最近消息 |
| `honcho_reasoning` | 来自 Honcho LLM 的合成答案 —— 传递 `reasoning_level`（minimal/low/medium/high/max）来控制深度 |
| `honcho_conclude` | 创建或删除结论 —— 传递 `conclusion` 来创建，`delete_id` 来删除（仅限 PII） |

## CLI 命令

```bash
hermes honcho status          # 连接状态、配置和关键设置
hermes honcho setup           # 交互式设置向导
hermes honcho strategy        # 显示或设置会话策略
hermes honcho peer            # 为多代理设置更新同伴名称
hermes honcho mode            # 显示或设置回忆模式
hermes honcho tokens          # 显示或设置上下文令牌预算
hermes honcho identity        # 显示 Honcho 同伴身份
hermes honcho sync            # 同步所有配置文件的 host 块
hermes honcho enable          # 启用 Honcho
hermes honcho disable         # 禁用 Honcho
```

## 从 `hermes honcho` 迁移

如果您之前使用过独立的 `hermes honcho setup`：

1. 您的现有配置（`honcho.json` 或 `~/.honcho/config.json`）被保留
2. 您的服务端数据（记忆、结论、用户配置文件）完好无损
3. 在 config.yaml 中设置 `memory.provider: honcho` 以重新激活

无需重新登录或重新设置。运行 `hermes memory setup` 并选择 "honcho" —— 向导会检测您的现有配置。

## 完整文档

完整的参考请见 [记忆提供程序 — Honcho](./memory-providers.md#honcho)。