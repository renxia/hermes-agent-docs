---
sidebar_position: 99
title: "Honcho Memory"
description: "AI-native persistent memory via Honcho — dialectic reasoning, multi-agent user modeling, and deep personalization"
---

# Honcho Memory

[Honcho](https://github.com/plastic-labs/honcho) 是一个 AI 原生的记忆后端，在 Hermes 内置记忆系统之上增加了辩证推理和深度用户建模。Honcho 不会简单地做键值存储，而是通过对对话的事后推理，持续维护一个关于用户是谁的模型——包括他们的偏好、沟通风格、目标和行为模式。

:::info Honcho 是一个记忆提供插件
Honcho 已集成到 [记忆提供程序](./memory-providers.md) 系统中。以下所有功能均可通过统一的记忆提供程序接口使用。
:::

## Honcho 带来的增强

| 能力 | 内置记忆 | Honcho |
|-----------|----------------|--------|
| 跨会话持久化 | ✔ 基于文件的 MEMORY.md/USER.md | ✔ 基于服务端的 API |
| 用户画像 | ✔ 手动智能体策划 | ✔ 自动辩证推理 |
| 会话摘要 | — | ✔ 会话范围的上下文注入 |
| 多智能体隔离 | — | ✔ 按对等体画像分离 |
| 观察模式 | — | ✔ 统一或有方向的观察 |
| 结论（派生洞察） | — | ✔ 基于服务端的模式推理 |
| 跨历史搜索 | ✔ FTS5 会话搜索 | ✔ 基于结论的语义搜索 |

**辩证推理**：在每一轮对话之后（由 `dialecticCadence` 控制），Honcho 会分析这次交互，推导出关于用户偏好、习惯和目标的洞察。这些洞察不断累积，使智能体对用户产生越来越深入的理解，超越用户明确表达的内容。辩证推理支持多轮深度（1-3 轮）并自动选择冷/热提示——冷启动查询聚焦于用户的通用事实，而热查询则优先处理会话范围的上下文。

**会话范围上下文**：基础上下文现在除了用户画像和对等体卡片外，还包括会话摘要。这使智能体能够了解当前会话中已经讨论过的内容，减少重复并实现连续性。

**多智能体画像**：当多个 Hermes 实例与同一用户交互时（例如，一个编码助手和一个个人助手），Honcho 会维护独立的"对等体"画像。每个对等体只能看到自己的观察和结论，防止上下文交叉污染。

## 设置

```bash
hermes memory setup    # 从提供者列表中选择 "honcho"
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

### 双层上下文注入

每一轮（在 `hybrid` 或 `context` 模式下），Honcho 会组装两层上下文注入到系统提示词中：

1. **基础上下文** — 会话摘要、用户表征、用户同伴卡片、AI 自我表征和 AI 身份卡片。按 `contextCadence` 刷新。这是"这个用户是谁"层。
2. **辩证补充** — LLM 综合推理用户当前状态和需求的结果。按 `dialecticCadence` 刷新。这是"现在什么最重要"层。

两层内容被拼接后截断至 `contextTokens` 预算（如果已设置）。

### 冷/热提示词选择

辩证层自动在两种提示词策略之间进行选择：

- **冷启动**（尚无基础上下文）：通用查询 — "这个人是谁？他们的偏好、目标和工作风格是什么？"
- **热会话**（基础上下文已存在）：会话范围查询 — "鉴于本次会话中到目前为止讨论的内容，关于该用户最相关的上下文是什么？"

这会根据基础上下文是否已填充而自动发生。

### 三个正交配置旋钮

成本和深度由三个独立旋钮控制：

| 旋钮 | 控制内容 | 默认值 |
|------|----------|---------|
| `contextCadence` | `context()` API 调用之间的轮数（基础层刷新） | `1` |
| `dialecticCadence` | `peer.chat()` LLM 调用之间的轮数（辩证层刷新） | `2`（推荐 1–5） |
| `dialecticDepth` | 每次辩证调用的 `.chat()` 传递次数（1–3） | `1` |

它们是正交的 — 你可以频繁刷新上下文但较少运行辩证层，或者以高频率运行深度多传递辩证层。示例：`contextCadence: 1, dialecticCadence: 5, dialecticDepth: 2` 每轮刷新基础上下文，每 5 轮运行一次辩证层，每次辩证运行进行 2 次传递。

### 辩证深度（多传递）

当 `dialecticDepth` > 1 时，每次辩证调用会运行多次 `.chat()` 传递：

- **第 0 次传递**：冷或热提示词（见上文）
- **第 1 次传递**：自我审计 — 识别初始评估中的空白，并综合近期会话中的证据
- **第 2 次传递**：调和 — 检查先前传递之间的矛盾并产出最终综合结果

每次传递使用比例推理级别（早期传递较轻量，主传递使用基础级别）。可通过 `dialecticDepthLevels` 覆盖每次传递的级别 — 例如，深度 3 运行可设置为 `["minimal", "medium", "high"]`。

如果前一次传递返回了强信号（较长的结构化输出），传递会提前退出，因此深度 3 并不总是意味着 3 次 LLM 调用。

### 会话启动预热

在会话初始化时，Honcho 在后台以完整配置的 `dialecticDepth` 触发一次辩证调用，并将结果直接交给第 1 轮的上下文组装。冷同伴上的单传递预热通常返回较薄的输出 — 多传递深度运行在用户开口之前就完成了审计/调和循环。如果预热在第 1 轮时尚未就绪，第 1 轮将回退到带有限超时的同步调用。

### 查询自适应推理级别

自动注入的辩证层按查询长度缩放 `dialecticReasoningLevel`：≥120 字符时 +1 级，≥400 字符时 +2 级，上限为 `reasoningLevelCap`（默认 `"high"`）。设置 `reasoningHeuristic: false` 可禁用此功能，将每次自动调用固定为 `dialecticReasoningLevel`。可用级别：`minimal`、`low`、`medium`、`high`、`max`。

## 配置选项

Honcho 在 `~/.honcho/config.json`（全局）或 `$HERMES_HOME/honcho.json`（配置文件本地）中配置。设置向导会为你处理这些。

### 带认证的自托管 Honcho

当将 Hermes 指向自托管的 Honcho 服务器时，`hermes honcho setup`（以及 `hermes memory setup`）会在基础 URL 之后要求输入**本地 JWT / bearer 令牌**。粘贴一个使用服务器 `AUTH_JWT_SECRET`（Honcho compose 环境变量）签名的 JWT 以启用认证访问；对于以 `AUTH_USE_AUTH=false` 运行的服务器则留空。本地令牌存储在主机块下（`honcho.json` 中的 `hosts.<host>.apiKey`），与任何云 `apiKey` 分开，因此你之后可以切换 `Cloud or local?` 提示回 `cloud` 而不会丢失任一凭证。

### 完整配置参考

| 键 | 默认值 | 说明 |
|-----|---------|-------------|
| `contextTokens` | `null`（无上限） | 每轮自动注入上下文的 token 预算。设为整数（如 1200）以设限。在词边界处截断 |
| `contextCadence` | `1` | `context()` API 调用之间的最少轮数（基础层刷新） |
| `dialecticCadence` | `2` | `peer.chat()` LLM 调用之间的最少轮数（辩证层）。推荐 1–5。在 `tools` 模式下，无关紧要 — 模型显式调用 |
| `dialecticDepth` | `1` | 每次辩证调用的 `.chat()` 传递次数。限制在 1–3 |
| `dialecticDepthLevels` | `null` | 每次传递的可选推理级别数组，如 `["minimal", "low", "medium"]`。覆盖比例默认值 |
| `dialecticReasoningLevel` | `'low'` | 基础推理级别：`minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 为 `true` 时，模型可通过工具参数每次调用覆盖推理级别 |
| `dialecticMaxChars` | `600` | 注入系统提示词的辩证结果最大字符数 |
| `recallMode` | `'hybrid'` | `hybrid`（自动注入 + 工具）、`context`（仅注入）、`tools`（仅工具） |
| `writeFrequency` | `'async'` | 刷新消息的时机：`async`（后台线程）、`turn`（同步）、`session`（结束时批量）或整数 N |
| `saveMessages` | `true` | 是否将消息持久化到 Honcho API |
| `observationMode` | `'directional'` | `directional`（全部开启）或 `unified`（共享池）。可用 `observation` 对象覆盖以进行细粒度控制 |
| `messageMaxChars` | `25000` | 通过 `add_messages()` 发送的每条消息的最大字符数。超出时分块 |
| `dialecticMaxInputChars` | `10000` | 传入 `peer.chat()` 的辩证查询输入的最大字符数 |
| `sessionStrategy` | `'per-directory'` | `per-directory`、`per-repo`、`per-session` 或 `global` |
| `pinUserPeer` | `false` | 仅网关。设为 `true` 时，每个平台用户折叠为 `peerName` |
| `userPeerAliases` | `{}` | 仅网关。运行时 ID 到同伴的映射（`{"7654321": "alice"}`）。多对一 |
| `runtimePeerPrefix` | `""` | 仅网关。无别名匹配时，为未知运行时 ID 添加命名空间（`telegram_7654321`） |

**会话策略**控制 Honcho 会话如何映射到你的工作：
- `per-session` — 每次 `hermes` 运行获得一个全新会话。干净启动，通过工具使用记忆。推荐给新用户。
- `per-directory` — 每个工作目录一个 Honcho 会话。上下文跨运行累积。
- `per-repo` — 每个 git 仓库一个会话。
- `global` — 跨所有目录的单一会话。

**回忆模式**控制记忆如何流入对话：
- `hybrid` — 上下文自动注入系统提示词且工具可用（模型决定何时查询）。
- `context` — 仅自动注入，工具隐藏。
- `tools` — 仅工具，无自动注入。智能体必须显式调用 `honcho_reasoning`、`honcho_search` 等。

**每种回忆模式的设置：**

| 设置 | `hybrid` | `context` | `tools` |
|---------|----------|-----------|---------|
| `writeFrequency` | 刷新消息 | 刷新消息 | 刷新消息 |
| `contextCadence` | 控制基础上下文刷新 | 控制基础上下文刷新 | 无关紧要 — 无注入 |
| `dialecticCadence` | 控制自动 LLM 调用 | 控制自动 LLM 调用 | 无关紧要 — 模型显式调用 |
| `dialecticDepth` | 每次调用多传递 | 每次调用多传递 | 无关紧要 — 模型显式调用 |
| `contextTokens` | 限制注入 | 限制注入 | 无关紧要 — 无注入 |
| `dialecticDynamic` | 控制模型覆盖 | 不适用（无工具） | 控制模型覆盖 |

在 `tools` 模式下，模型完全自主控制 — 它想要在什么时候调用 `honcho_reasoning` 都可以，选择任何它想要的 `reasoning_level`。频率和预算设置仅适用于带自动注入的模式（`hybrid` 和 `context`）。

## 网关身份映射

这些设置仅在运行 [Hermes 网关](../../developer-guide/gateway-internals.md) 时才有意义 — 用户通过平台原生运行时 ID（Telegram UID、Discord snowflake、Slack 用户）到达网关的单一入口点。CLI、TUI 和桌面会话没有运行时 ID，始终解析为 `peerName`，因此在网关之外这些键不起作用。

设置向导会检测是否有网关平台连接，如果没有则完全跳过此步骤。运行时，它会问一个问题 — *谁在使用这个网关？* — 并据此推导出键值：

| 回答 | 结果 |
|--------|--------|
| **只有我** | `pinUserPeer: true` — 每个非智能体网关用户折叠为你的同伴。Pin 覆盖所有别名，因此仅当不需要任何用户端身份拥有自己的同伴时才选择此选项。如果不同的智能体到达网关且每个都需要不同的同伴，请**不要** pin — 保持 `pinUserPeer: false` 并通过 `userPeerAliases`（`[e]` 编辑器）映射它们 |
| **我 + 其他人**（共享） | `pinUserPeer: false` + `userPeerAliases` 将你的运行时 ID 映射到 `peerName` — 你保留共享历史，其他人获得自己的同伴 |
| **只有其他人** | `pinUserPeer: false`，可选 `runtimePeerPrefix` — 每个用户获得自己的同伴 |

在提示符处选择 `[e]` 以直接设置这三个键。

解析器从上到下尝试这些键，先匹配先得：`pinUserPeer` → `userPeerAliases[id]` → `runtimePeerPrefix + id` → 原始运行时 ID → `peerName` → 会话键回退。

:::warning 取消 Pin 会使共享记忆孤立
将 `pinUserPeer` 从 `true` 翻转为 `false` 不会迁移数据 — 在 `peerName` 下累积的记忆保留在那里，平台用户解析为全新的空同伴。为了保持你自己的连续性，请选择**共享**路径，使你的运行时 ID 别名回到 `peerName`。向导在检测到此转换时会自动提供此引导。
:::

:::note 已弃用的键
`pinPeerName` 是 `pinUserPeer` 的旧版别名 — 仍会读取以保持向后兼容（两者都设置时 `pinUserPeer` 优先），但不会再写入。重新运行设置会将其迁移到规范键上。
:::

## 观察（定向模式 vs. 统一模式）

Honcho 将对话建模为对等体之间交换消息。每个对等体有两个观察开关，与 Honcho 的 `SessionPeerConfig` 一一对应：

| 开关 | 效果 |
|--------|--------|
| `observeMe` | Honcho 从该对等体自身的消息中构建其表征 |
| `observeOthers` | 该对等体观察另一个对等体的消息（为跨对等体推理提供输入） |

两个对等体 × 两个开关 = 四个标志位。`observationMode` 是一个简写预设：

| 预设 | 用户标志位 | AI 标志位 | 语义 |
|--------|-----------|----------|-----------|
| `"directional"`（默认） | me: on, others: on | me: on, others: on | 完全双向观察。启用跨对等体辩证——"根据用户所说和 AI 的回复，AI 对用户了解了什么。" |
| `"unified"` | me: on, others: off | me: off, others: on | 共享池语义——AI 仅观察用户的消息，用户对等体仅自我建模。单一观察者池。 |

通过显式的 `observation` 块覆盖预设，可实现逐对等体控制：

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
| AI 不应从自身回复中重新建模用户 | `"ai": {"observeMe": true, "observeOthers": false}` |
| AI 对等体的强人设不应从自我观察中更新 | `"ai": {"observeMe": false, "observeOthers": true}` |

通过 [Honcho 仪表盘](https://app.honcho.dev) 设置的服务器端开关优先于本地默认值——Hermes 在会话初始化时将其同步回来。

## 工具

当 Honcho 作为记忆提供者处于激活状态时，以下五个工具可用：

| 工具 | 用途 |
|------|---------|
| `honcho_profile` | 读取或更新对等体卡片——传入 `card`（事实列表）以更新，省略则读取 |
| `honcho_search` | 对上下文进行语义搜索——原始摘录，无 LLM 综合 |
| `honcho_context` | 完整会话上下文——摘要、表征、卡片、最近消息 |
| `honcho_reasoning` | 来自 Honcho LLM 的综合回答——传入 `reasoning_level`（minimal/low/medium/high/max）控制深度 |
| `honcho_conclude` | 创建或删除结论——传入 `conclusion` 以创建，传入 `delete_id` 以删除（仅限 PII） |

## CLI 命令

`hermes honcho` 子命令**仅在 Honcho 为激活的记忆提供者时注册**（`config.yaml` 中 `memory.provider: honcho`）。全新安装时，使用 `hermes memory setup honcho` 直接配置 Honcho（或运行 `hermes memory setup` 从列表中选择）；`hermes honcho` 子命令将在下次调用时出现。

```bash
hermes memory setup honcho    # 直接配置 Honcho（激活前可用）
hermes honcho status          # 连接状态、配置和关键设置
hermes honcho setup           # 重定向至 `hermes memory setup`（激活后别名）
hermes honcho strategy        # 查看或设置会话策略（per-session/per-directory/per-repo/global）
hermes honcho peer            # 查看或更新对等体名称及辩证推理级别
hermes honcho mode            # 查看或设置回忆模式（hybrid/context/tools）
hermes honcho tokens          # 查看或设置上下文和辩证的 token 预算
hermes honcho identity        # 初始化或查看 AI 对等体的 Honcho 身份
hermes honcho sync            # 将 Honcho 配置同步到所有现有配置文件
hermes honcho peers           # 查看所有配置文件中的对等体身份
hermes honcho sessions        # 列出已知的 Honcho 会话映射
hermes honcho map             # 将当前目录映射到 Honcho 会话名称
hermes honcho enable          # 为当前激活的配置文件启用 Honcho
hermes honcho disable         # 为当前激活的配置文件禁用 Honcho
hermes honcho migrate         # 从 openclaw-honcho 逐步迁移指南
```

## 从 `hermes honcho` 迁移

如果之前使用的是独立的 `hermes honcho setup`：

1. 现有配置（`honcho.json` 或 `~/.honcho/config.json`）保留不变
2. 服务器端数据（记忆、结论、用户配置文件）保持完整
3. 在 config.yaml 中设置 `memory.provider: honcho` 即可重新激活

无需重新登录或重新设置。运行 `hermes memory setup` 并选择 "honcho"——向导会检测您的现有配置。

## 完整文档

请参阅 [记忆提供者 — Honcho](./memory-providers.md#honcho) 获取完整参考。