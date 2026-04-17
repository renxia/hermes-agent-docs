---
sidebar_position: 99
title: "Honcho Memory"
description: "AI-native persistent memory via Honcho — dialectic reasoning, multi-agent user modeling, and deep personalization"
---

# Honcho Memory

[Honcho](https://github.com/plastic-labs/honcho) 是一个 AI 原生的内存后端，它在 Hermes 内置的内存系统之上增加了辩证推理和深度用户建模能力。Honcho 不仅仅是简单的键值存储，它通过对对话进行推理，维护着用户运行模型——包括他们的偏好、沟通风格、目标和模式。

:::info Honcho 是内存提供程序插件
Honcho 已集成到 [Memory Providers](./memory-providers.md) 系统中。以下所有功能都可通过统一的内存提供程序接口使用。
:::

## Honcho 增加了哪些功能

| 功能 | 内置内存 | Honcho |
|-----------|----------------|--------|
| 会话间持久化 | ✔ 基于文件的 MEMORY.md/USER.md | ✔ 服务器端，通过 API |
| 用户画像 | ✔ 手动代理策展 | ✔ 自动辩证推理 |
| 会话摘要 | — | ✔ 会话范围的上下文注入 |
| 多代理隔离 | — | ✔ 每个对等体（peer）的独立画像 |
| 观察模式 | — | ✔ 统一或定向观察 |
| 结论（推导洞察） | — | ✔ 服务器端模式推理 |
| 历史搜索 | ✔ FTS5 会话搜索 | ✔ 基于结论的语义搜索 |

**辩证推理 (Dialectic reasoning)**：在每次对话轮次（由 `dialecticCadence` 控制）之后，Honcho 会分析整个交流过程，并推导出关于用户偏好、习惯和目标的洞察。这些洞察会随着时间积累，使代理对用户的理解深度超越了用户明确陈述的内容。该辩证推理支持多轮深度分析（1–3 轮），并具备自动冷/热提示词选择功能——冷启动查询侧重于用户一般事实，而热查询则优先考虑会话范围的上下文。

**会话范围上下文 (Session-scoped context)**：基础上下文现在除了用户表示和对等体卡片外，还包括会话摘要。这使代理了解当前会话中已经讨论过的内容，从而减少重复并实现连续性。

**多代理画像 (Multi-agent profiles)**：当多个 Hermes 实例与同一用户交流时（例如，一个代码助手和一个个人助理），Honcho 会维护独立的“对等体”画像。每个对等体只能看到自己的观察和结论，从而防止上下文交叉污染。

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

请在 [honcho.dev](https://honcho.dev) 获取 API 密钥。

## 架构

### 两层上下文注入

在每个轮次（使用 `hybrid` 或 `context` 模式时），Honcho 会组装两层上下文注入到系统提示词中：

1. **基础上下文 (Base context)** — 会话摘要、用户表示、用户对等体卡片、AI 自我表示和 AI 身份卡片。在 `contextCadence` 间隔刷新。这是“用户是谁”的层级。
2. **辩证补充 (Dialectic supplement)** — 关于用户当前状态和需求的 LLM 合成推理。在 `dialecticCadence` 间隔刷新。这是“现在什么最重要”的层级。

这两层上下文会被连接起来，并根据 `contextTokens` 预算进行截断（如果设置了）。

### 冷/热提示词选择

辩证推理会自动在两种提示词策略之间选择：

- **冷启动 (Cold start)**（尚无基础上下文）：通用查询——“这个人是谁？他们的偏好、目标和工作风格是什么？”
- **热会话 (Warm session)**（存在基础上下文）：会话范围查询——“鉴于到目前为止本会话中讨论的内容，关于这个用户哪些上下文最相关？”

这根据基础上下文是否已填充自动发生。

### 三个正交配置旋钮

成本和深度由三个独立的旋钮控制：

| 旋钮 | 控制内容 | 默认值 |
|------|----------|---------|
| `contextCadence` | 每次调用 `context()` API 的轮次间隔（基础层刷新） | `1` |
| `dialecticCadence` | 每次调用 `peer.chat()` LLM 的轮次间隔（辩证层刷新） | `3` |
| `dialecticDepth` | 每次辩证调用中的 `.chat()` 轮次数（1–3） | `1` |

这些旋钮是正交的——你可以实现频繁的上下文刷新搭配不频繁的辩证推理，或者实现低频率的深度多轮辩证推理。示例：`contextCadence: 1, dialecticCadence: 5, dialecticDepth: 2` 表示每轮刷新基础上下文，每 5 轮运行一次辩证推理，每次辩证推理进行 2 轮。

### 辩证深度（多轮）

当 `dialecticDepth` > 1 时，每次辩证调用都会运行多轮 `.chat()` 过程：

- **第 0 轮 (Pass 0)**：冷启动或热启动提示词（见上文）
- **第 1 轮 (Pass 1)**：自我审计——识别初始评估中的差距，并综合最近会话的证据
- **第 2 轮 (Pass 2)**：调和——检查先前轮次之间的矛盾，并生成最终综合结果

每一轮都会使用一个比例推理级别（早期轮次级别较低，主轮次级别为基础）。可以使用 `dialecticDepthLevels` 覆盖每轮的级别——例如，对于深度为 3 的运行，可以使用 `["minimal", "medium", "high"]`。

如果前一轮返回了强信号（长、结构化的输出），则轮次会提前中止，因此深度为 3 不一定意味着 3 次 LLM 调用。

## 配置选项

Honcho 配置在 `~/.honcho/config.json`（全局）或 `$HERMES_HOME/honcho.json`（本地画像）中。设置向导会帮你处理这些。

### 完整配置参考

| Key | Default | Description |
|-----|---------|-------------|
| `contextTokens` | `null` (无限制) | 每轮自动注入上下文的 Token 预算。设置为整数（例如 1200）进行限制。在词边界处截断 |
| `contextCadence` | `1` | 每次调用 `context()` API 的最小轮次间隔（基础层刷新） |
| `dialecticCadence` | `3` | 每次调用 `peer.chat()` LLM 的最小轮次间隔（辩证层）。在 `tools` 模式下，不适用——模型会明确调用 |
| `dialecticDepth` | `1` | 每次辩证调用中的 `.chat()` 轮次数。限制为 1–3 |
| `dialecticDepthLevels` | `null` | 每轮可选的推理级别数组，例如 `["minimal", "low", "medium"]`。覆盖比例默认值 |
| `dialecticReasoningLevel` | `'low'` | 基础推理级别：`minimal`（最小）、`low`（低）、`medium`（中）、`high`（高）、`max`（最大） |
| `dialecticDynamic` | `true` | 当为 `true` 时，模型可以通过工具参数覆盖每次调用的推理级别 |
| `dialecticMaxChars` | `600` | 注入到系统提示词中的辩证结果的最大字符数 |
| `recallMode` | `'hybrid'` | `hybrid`（自动注入 + 工具）、`context`（仅注入）、`tools`（仅工具） |
| `writeFrequency` | `'async'` | 何时刷新消息：`async`（后台线程）、`turn`（同步）、`session`（会话结束时批量）、或整数 N |
| `saveMessages` | `true` | 是否将消息持久化到 Honcho API |
| `observationMode` | `'directional'` | `directional`（全部开启）或 `unified`（共享池）。使用 `observation` 对象进行精细控制 |
| `messageMaxChars` | `25000` | 通过 `add_messages()` 发送的消息最大字符数。超出时会分块 |
| `dialecticMaxInputChars` | `10000` | 用于向 `peer.chat()` 输入辩证查询的最大字符数 |
| `sessionStrategy` | `'per-directory'` | `per-directory`（每个目录）、`per-repo`（每个仓库）、`per-session`（每个会话）或 `global`（全局） |

**会话策略 (Session strategy)** 控制 Honcho 会话如何映射到你的工作流程：
- `per-session` — 每次运行 `hermes` 都会获得一个新的会话。干净的开始，通过工具进行记忆存储。推荐给新用户。
- `per-directory` — 每个工作目录对应一个 Honcho 会话。上下文会跨运行积累。
- `per-repo` — 每个 Git 仓库对应一个会话。
- `global` — 所有目录共享一个会话。

**召回模式 (Recall mode)** 控制记忆如何流入对话：
- `hybrid` — 上下文自动注入系统提示词 **并且** 可用工具（模型决定何时查询）。
- `context` — 仅自动注入，工具隐藏。
- `tools` — 仅工具，无自动注入。代理必须显式调用 `honcho_reasoning`、`honcho_search` 等。

**每个召回模式的设置：**

| Setting | `hybrid` | `context` | `tools` |
|---------|----------|-----------|---------|
| `writeFrequency` | 刷新消息 | 刷新消息 | 刷新消息 |
| `contextCadence` | 控制基础上下文刷新 | 控制基础上下文刷新 | 不适用——无注入 |
| `dialecticCadence` | 控制自动 LLM 调用 | 控制自动 LLM 调用 | 不适用——模型显式调用 |
| `dialecticDepth` | 每次调用多轮 | 每次调用多轮 | 不适用——模型显式调用 |
| `contextTokens` | 限制注入 | 限制注入 | 不适用——无注入 |
| `dialecticDynamic` | 控制模型覆盖 | 不适用（无工具） | 控制模型覆盖 |

在 `tools` 模式下，模型完全掌控一切——它会在需要时，以它选择的任何 `reasoning_level` 调用 `honcho_reasoning`。周期和预算设置仅适用于具有自动注入（`hybrid` 和 `context`）的模式。

## 工具 (Tools)

当 Honcho 作为内存提供程序激活时，五个工具可用：

| Tool | Purpose |
|------|---------|
| `honcho_profile` | 读取或更新对等体卡片 — 传入 `card`（事实列表）进行更新，省略则读取 |
| `honcho_search` | 对上下文进行语义搜索 — 原始摘录，无 LLM 综合 |
| `honcho_context` | 完整的会话上下文 — 摘要、表示、卡片、最近消息 |
| `honcho_reasoning` | 来自 Honcho LLM 的综合答案 — 传入 `reasoning_level`（minimal/low/medium/high/max）控制深度 |
| `honcho_conclude` | 创建或删除结论 — 传入 `conclusion` 创建，`delete_id` 删除（仅限 PII） |

## CLI 命令

```bash
hermes honcho status          # 连接状态、配置和关键设置
hermes honcho setup           # 交互式设置向导
hermes honcho strategy        # 显示或设置会话策略
hermes honcho peer            # 更新多代理设置的对等体名称
hermes honcho mode            # 显示或设置召回模式
hermes honcho tokens          # 显示或设置上下文 Token 预算
hermes honcho identity        # 显示 Honcho 对等体身份
hermes honcho sync            # 为所有画像同步主机块
hermes honcho enable          # 启用 Honcho
hermes honcho disable         # 禁用 Honcho
```

## 从 `hermes honcho` 迁移

如果你之前使用了独立的 `hermes honcho setup`：

1. 你现有的配置（`honcho.json` 或 `~/.honcho/config.json`）将被保留
2. 你的服务器端数据（记忆、结论、用户画像）完好无损
3. 在 config.yaml 中设置 `memory.provider: honcho` 即可重新激活

无需重新登录或重新设置。运行 `hermes memory setup` 并选择 "honcho"——向导会自动检测你现有的配置。

## 完整文档

请参阅 [Memory Providers — Honcho](./memory-providers.md#honcho) 获取完整参考。