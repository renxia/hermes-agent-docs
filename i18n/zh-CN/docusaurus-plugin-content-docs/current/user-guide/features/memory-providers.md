---
sidebar_position: 4
title: "Memory Providers"
description: "External memory provider plugins — Honcho, OpenViking, Mem0, Hindsight, Holographic, RetainDB, ByteRover, Supermemory"
---

# 内存提供者 (Memory Providers)

Hermes 智能体附带了 8 个外部内存提供者插件，这些插件为智能体提供了超越内置的 MEMORY.md 和 USER.md 的持久化、跨会话知识。同一时间只能有一个外部提供者处于活动状态——内置内存始终与它一起工作。

## 快速入门 (Quick Start)

```bash
hermes memory setup      # interactive picker + configuration
hermes memory status     # check what's active
hermes memory off        # disable external provider
```

您也可以通过 `hermes plugins` → Provider Plugins → Memory Provider 来选择活动的内存提供者。

或者在 `~/.hermes/config.yaml` 中手动设置：

```yaml
memory:
  provider: openviking   # or honcho, mem0, hindsight, holographic, retaindb, byterover, supermemory
```

## 工作原理

当激活了记忆提供者后，Hermes 会自动执行以下操作：

1. **将提供者上下文注入**系统提示（即提供者所知晓的信息）
2. **在每次对话轮次前预取相关记忆**（后台、非阻塞）
3. **将对话轮次同步到提供者**以供每次响应使用
4. **在会话结束时提取记忆**（适用于支持此功能的提供者）
5. **镜像内置的记忆写入**到外部提供者
6. **添加特定于提供者的工具**，使智能体能够搜索、存储和管理记忆

内置记忆（MEMORY.md / USER.md）将继续像以前一样工作。外部提供者是附加功能。

## 可用提供者

### Honcho

具有辩证推理、会话范围的上下文注入、语义搜索和持久性结论的 AI 原生跨会话用户建模。基础上下文现在包括会话摘要、用户表示和同伴卡片，使智能体了解已经讨论过的内容。

| | |
|---|---|
| **最适合** | 具有跨会话上下文的多智能体系统、用户-智能体对齐 |
| **要求** | `pip install honcho-ai` + [API 密钥](https://app.honcho.dev) 或自托管实例 |
| **数据存储** | Honcho Cloud 或自托管 |
| **成本** | Honcho 定价（云）/ 免费（自托管） |

**工具 (5个):** `honcho_profile` (读取/更新同伴卡片), `honcho_search` (语义搜索), `honcho_context` (会话上下文 — 摘要、表示、卡片、消息), `honcho_reasoning` (LLM 合成), `honcho_conclude` (创建/删除结论)

**架构:** 两层上下文注入——基础层（会话摘要 + 表示 + 同伴卡片，在 `contextCadence` 时刷新）加上辩证补充（LLM 推理，在 `dialecticCadence` 时刷新）。辩证推理根据基础上下文是否存在，自动选择冷启动提示（通用用户事实）与热提示（会话范围的上下文）。

**三个正交配置旋钮**独立控制成本和深度：

- `contextCadence` — 基础层刷新的频率（API 调用频率）
- `dialecticCadence` — 辩证 LLM 触发的频率（LLM 调用频率）
- `dialecticDepth` — 每个辩证调用所需的 `.chat()` 次数（1–3，推理深度）

自动注入的辩证推理还根据查询长度来调整其推理级别（查询越长 → 推理越深，上限为 `reasoningLevelCap`）；请参阅 [查询自适应推理级别](./honcho.md#query-adaptive-reasoning-level)。

**设置向导:**
```bash
hermes memory setup        # 选择 "honcho" — 运行 Honcho 特定的后设
```

遗留的 `hermes honcho setup` 命令仍然有效（它现在重定向到 `hermes memory setup`），但只有在选择 Honcho 作为活动的记忆提供者之后才会被注册。

**配置:** `$HERMES_HOME/honcho.json` (本地配置文件) 或 `~/.honcho/config.json` (全局)。解析顺序：`$HERMES_HOME/honcho.json` > `~/.hermes/honcho.json` > `~/.honcho/config.json`。请参阅 [配置参考](https://github.com/NousResearch/hermes-agent/blob/main/plugins/memory/honcho/README.md) 和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。

<details>
<summary>完整配置参考</summary>

| Key | Default | Description |
|-----|---------|-------------|
| `apiKey` | -- | 来自 [app.honcho.dev](https://app.honcho.dev) 的 API 密钥 |
| `baseUrl` | -- | 自托管 Honcho 的基础 URL |
| `peerName` | -- | 用户同伴身份 |
| `aiPeer` | host key | AI 同伴身份（每个配置文件一个） |
| `workspace` | host key | 共享工作区 ID |
| `contextTokens` | `null` (无限制) | 每个轮次自动注入上下文的令牌预算。在单词边界处截断 |
| `contextCadence` | `1` | `context()` API 调用之间的最小轮数（基础层刷新） |
| `dialecticCadence` | `2` | `peer.chat()` LLM 调用之间的最小轮数。推荐 1–5。仅适用于 `hybrid`/`context` 模式 |
| `dialecticDepth` | `1` | 每个辩证调用所需的 `.chat()` 次数。限制在 1–3。第 0 次：冷/热提示，第 1 次：自我审计，第 2 次：协调 |
| `dialecticDepthLevels` | `null` | 每个次数的可选推理级别数组，例如 `["minimal", "low", "medium"]`。覆盖比例默认值 |
| `dialecticReasoningLevel` | `'low'` | 基础推理级别: `minimal`, `low`, `medium`, `high`, `max` |
| `dialecticDynamic` | `true` | 为 `true` 时，模型可以通过工具参数在每次调用时覆盖推理级别 |
| `dialecticMaxChars` | `600` | 注入到系统提示中的辩证结果最大字符数 |
| `recallMode` | `'hybrid'` | `hybrid` (自动注入 + 工具), `context` (仅注入), `tools` (仅工具) |
| `writeFrequency` | `'async'` | 消息的刷新时机: `async` (后台线程), `turn` (同步), `session` (结束时批量), 或整数 N |
| `saveMessages` | `true` | 是否将消息持久化到 Honcho API |
| `observationMode` | `'directional'` | `directional` (全部开启) 或 `unified` (共享池)。使用 `observation` 对象覆盖 |
| `messageMaxChars` | `25000` | 每个消息的最大字符数（如果超过则分块） |
| `dialecticMaxInputChars` | `10000` | 对 `peer.chat()` 的辩证查询输入最大字符数 |
| `sessionStrategy` | `'per-directory'` | `per-directory`, `per-repo`, `per-session`, `global` |
| `pinUserPeer` | `false` | 仅限网关。当为 `true` 时，每个非智能体网关用户都坍缩到 `peerName`；此引脚会覆盖所有别名 |
| `userPeerAliases` | `{}` | 仅限网关。将运行时 ID 映射到同伴（例如 `{"7654321": "alice"}`）。多对一 |
| `runtimePeerPrefix` | `""` | 仅限网关。当没有别名匹配时，为未映射的运行时 ID 添加命名空间（例如 `telegram_7654321`） |

</details>

<details>
<summary>最小 honcho.json (云端)</summary>

```json
{
  "apiKey": "your-key-from-app.honcho.dev",
  "hosts": {
    "hermes": {
      "enabled": true,
      "aiPeer": "hermes",
      "peerName": "your-name",
      "workspace": "hermes"
    }
  }
}
```

</details>

<details>
<summary>最小 honcho.json (自托管)</summary>

```json
{
  "baseUrl": "http://localhost:8000",
  "hosts": {
    "hermes": {
      "enabled": true,
      "aiPeer": "hermes",
      "peerName": "your-name",
      "workspace": "hermes"
    }
  }
}
```

</details>

:::tip 从 `hermes honcho` 迁移
如果您以前使用 `hermes honcho setup`，您的配置和所有服务器端数据都是完整的。只需再次通过设置向导启用，或手动设置 `memory.provider: honcho` 以通过新系统重新激活。
:::

**多同伴设置:**

Honcho 将对话建模为交换消息的同伴——每个 Hermes 配置文件都包含一个用户同伴和一个 AI 同伴，所有人都共享一个工作区。工作区是共享环境：用户同伴在所有配置中都是全局的，每个 AI 同伴都是其自身的身份。每个 AI 同伴都会根据自己的观察结果构建独立的表示/卡片，因此 `coder` 配置保持代码导向，而 `writer` 配置则针对同一用户进行编辑审查。

映射关系:

| 概念 | 是什么 |
|---------|-----------|
| **工作区** | 共享环境。所有处于一个工作区下的 Hermes 配置都看到相同的用户身份。 |
| **用户同伴** (`peerName`) | 人类。在工作区内跨配置共享。 |
| **AI 同伴** (`aiPeer`) | 每个 Hermes 配置一个。`hermes` 主机键 → 默认；其他为 `hermes.<profile>`。 |
| **观察结果** | 控制 Honcho 从谁的消息中建模什么的同伴级开关。`directional` (默认，全部开启) 或 `unified` (单一观察者池)。 |

### 新配置，新的 Honcho 同伴

```bash
hermes profile create coder --clone
```

`--clone` 在 `honcho.json` 中创建一个具有 `aiPeer: "coder"`、共享 `workspace`、继承 `peerName`、`recallMode`、`writeFrequency`、`observation` 等属性的 `hermes.coder` 主机块。AI 同伴在 Honcho 中被积极创建，因此在第一条消息出现之前就存在了。

### 现有配置，回填 Honcho 同伴

```bash
hermes honcho sync
```

扫描每个 Hermes 配置，为所有没有主机块的配置创建主机块，继承默认 `hermes` 块的设置，并积极创建新的 AI 同伴。幂等性——跳过已具有主机块的配置。

### 单配置观察结果

每个主机块都可以独立地覆盖观察结果配置。示例：一个专注于代码的配置，其中 AI 同伴观察用户但自身不进行建模：

```json
"hermes.coder": {
  "aiPeer": "coder",
  "observation": {
    "user": { "observeMe": true, "observeOthers": true },
    "ai":   { "observeMe": false, "observeOthers": true }
  }
}
```

**观察结果开关（每个同伴一组）:**

| 开关 | 效果 |
|--------|--------|
| `observeMe` | Honcho 从自己的消息中构建该同伴的表示 |
| `observeOthers` | 该同伴观察其他同伴的消息（提供跨同伴推理） |

通过 `observationMode` 进行预设:

- **`"directional"`** (默认) — 所有四个标志都开启。完全相互观察；启用跨同伴辩证推理。
- **`"unified"`** — 用户 `observeMe: true`，AI `observeOthers: true`，其余为 false。单一观察者池；AI 建模用户但不对自己进行建模，用户同伴仅自我建模。

服务器端的开关会覆盖本地默认值——在会话初始化时同步回来。

请参阅 [Honcho 页面](./honcho.md#observation-directional-vs-unified) 以获取完整的观察结果参考。

### 网关身份映射

上述的同伴模型涵盖 CLI、TUI 和桌面会话，其中每次对话都解析为 `peerName`。网关（[../../developer-guide/gateway-internals.md](https://github.com/NousResearch/hermes-agent/blob/main/plugins/memory/honcho/README.md)）增加了第二个轴：用户以平台原生的运行时 ID（Telegram UID、Discord snowflake、Slack 用户）到达，而三个键决定每个 ID 映射到哪个同伴。

| Key | Effect |
|-----|--------|
| `pinUserPeer: true` | 每个非智能体网关用户都坍缩到 `peerName`。此引脚首先被检查，因此它会覆盖所有别名——仅在没有用户侧身份需要自己的同伴时才使用 |
| `userPeerAliases` | 将特定的运行时 ID 映射到同伴（例如 `{"7654321": "alice"}`）。用于路由不同的身份——包括每个都携带自己同伴的智能体 |
| `runtimePeerPrefix` | 为任何未映射的运行时 ID 添加命名空间（例如 `telegram_7654321`），以防止具有相似 ID 的平台发生冲突 |

在非网关场景下，这些键不起作用。只有当它检测到连接的网关平台时，`hermes memory setup` 才会提示它们。请参阅 [Honcho 页面](./honcho.md#gateway-identity-mapping) 以获取解析器梯子和设置流程。

<details>
<summary>完整的 honcho.json 示例 (多配置)</summary>

```json
{
  "apiKey": "your-key",
  "workspace": "hermes",
  "peerName": "eri",
  "hosts": {
    "hermes": {
      "enabled": true,
      "aiPeer": "hermes",
      "workspace": "hermes",
      "peerName": "eri",
      "recallMode": "hybrid",
      "writeFrequency": "async",
      "sessionStrategy": "per-directory",
      "observation": {
        "user": { "observeMe": true, "observeOthers": true },
        "ai": { "observeMe": true, "observeOthers": true }
      },
      "dialecticReasoningLevel": "low",
      "dialecticDynamic": true,
      "dialecticCadence": 2,
      "dialecticDepth": 1,
      "dialecticMaxChars": 600,
      "contextCadence": 1,
      "messageMaxChars": 25000,
      "saveMessages": true
    },
    "hermes.coder": {
      "enabled": true,
      "aiPeer": "coder",
      "workspace": "hermes",
      "peerName": "eri",
      "recallMode": "tools",
      "observation": {
        "user": { "observeMe": true, "observeOthers": false },
        "ai": { "observeMe": true, "observeOthers": true }
      }
    },
    "hermes.writer": {
      "enabled": true,
      "aiPeer": "writer",
      "workspace": "hermes",
      "peerName": "eri"
    }
  },
  "sessions": {
    "/home/user/myproject": "myproject-main"
  }
}
```

</details>

请参阅 [配置参考](https://github.com/NousResearch/hermes-agent/blob/main/plugins/memory/honcho/README.md) 和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。

---

### OpenViking

由 Volcengine (ByteDance) 提供的上下文数据库，具有文件系统式的知识层次结构、分级检索和自动将记忆提取到 6 个类别。

| | |
|---|---|
| **最适合** | 带有结构化浏览的自托管知识管理 |
| **要求** | `pip install openviking` + 运行服务器 |
| **数据存储** | 自托管（本地或云） |
| **成本** | 免费（开源，AGPL-3.0） |

**工具:** `viking_search` (语义搜索), `viking_read` (分级: 摘要/概览/完整), `viking_browse` (文件系统导航), `viking_remember` (存储事实), `viking_add_resource` (摄取 URL/文档)

**设置:**
```bash
# 首先启动 OpenViking 服务器
pip install openviking
openviking-server

# 然后配置 Hermes
hermes memory setup    # 选择 "openviking"
# 或手动:
hermes config set memory.provider openviking
echo "OPENVIKING_ENDPOINT=http://localhost:1933" >> ~/.hermes/.env
# 认证服务器应使用用户/管理员 API 密钥:
echo "OPENVIKING_API_KEY=..." >> ~/.hermes/.env
```

**关键功能:**
- 分级上下文加载：L0 (~100 tokens) → L1 (~2k) → L2 (完整)
- 会话提交时的自动记忆提取（配置、偏好设置、实体、事件、案例、模式）
- 用于层次化知识浏览的 `viking://` URI 方案

`OPENVIKING_ACCOUNT` 和 `OPENVIKING_USER` 用于本地/信任模式。
`OPENVIKING_AGENT` 是 OpenViking 中 Hermes 的同伴 ID，用于同伴范围的记忆。

---

### Mem0

带有语义搜索、重排序和自动去重的服务器端 LLM 事实提取。支持 Mem0 Platform（云）和 OSS（自托管）两种模式。

| | |
|---|---|
| **最适合** | 无需干预的记忆管理 — Mem0 自动处理提取 |
| **要求** | `pip install mem0ai` + API 密钥（平台）或 LLM/向量存储（OSS） |
| **数据存储** | Mem0 Cloud (平台) 或自托管 (OSS) |
| **成本** | Mem0 定价（平台）/ 免费（OSS） |

**工具 (5个):** `mem0_list` (列出所有记忆，分页), `mem0_search` (语义搜索，平台模式下带重排序), `mem0_add` (存储逐字事实), `mem0_update` (按 ID 更新), `mem0_delete` (按 ID 删除)

**设置（平台）:**
```bash
hermes memory setup    # 选择 "mem0" → "Platform"
# 或手动:
hermes config set memory.provider mem0
echo "MEM0_API_KEY=your-key" >> ~/.hermes/.env
```

**设置（OSS）:**
```bash
hermes memory setup    # 选择 "mem0" → "Open Source (自托管)"
# 或通过标志:
hermes memory setup mem0 --mode oss --oss-llm openai --oss-llm-key sk-... --oss-vector qdrant
```

预览而不写入文件:
```bash
hermes memory setup mem0 --mode oss --oss-llm-key sk-... --dry-run
```

**配置:** `$HERMES_HOME/mem0.json` (行为设置)。只有秘密 `MEM0_API_KEY` 属于 `~/.hermes/.env`。

| Key | Default | Description |
|-----|---------|-------------|
| `mode` | `platform` | `platform` (Mem0 Cloud) 或 `oss` (自托管) |
| `user_id` | `hermes-user` | 用户标识符 |
| `agent_id` | `hermes` | 智能体标识符 |
| `rerank` | `true` | 为相关性重排搜索结果（仅限平台模式） |

**OSS 支持的提供者:**

| Component | Providers |
|-----------|-----------|
| LLM | openai, ollama |
| Embedder | openai, ollama |
| Vector Store | qdrant (本地/服务器), pgvector |

**切换模式:** 重新运行 `hermes memory setup mem0 --mode <platform|oss>` 或直接编辑 `mem0.json`。

---

### Hindsight

具有知识图谱、实体解析和多策略检索的长时记忆。`hindsight_reflect` 工具提供了其他任何提供者都无法提供的跨记忆合成。自动保留完整的对话轮次（包括工具调用），并进行会话级别的文档跟踪。

| | |
|---|---|
| **最适合** | 基于知识图谱的召回和实体关系 |
| **要求** | 云端: 来自 [ui.hindsight.vectorize.io](https://ui.hindsight.vectorize.io) 的 API 密钥。本地: LLM API 密钥 (OpenAI, Groq, OpenRouter 等)。 |
| **数据存储** | Hindsight Cloud 或本地嵌入式 PostgreSQL |
| **成本** | Hindsight 定价（云）或免费（本地） |

**工具:** `hindsight_retain` (带实体提取的存储), `hindsight_recall` (多策略搜索), `hindsight_reflect` (跨记忆合成)

**设置:**
```bash
hermes memory setup    # 选择 "hindsight"
# 或手动:
hermes config set memory.provider hindsight
echo "HINDSIGHT_API_KEY=your-key" >> ~/.hermes/.env
```

设置向导会自动安装依赖项，并且只安装所选模式所需的组件（云端为 `hindsight-client`，本地为 `hindsight-all`）。要求 `hindsight-client >= 0.4.22`（如果过时则在会话开始时自动升级）。

**本地模式 UI:** `hindsight-embed -p hermes ui start`

**配置:** `$HERMES_HOME/hindsight/config.json`

| Key | Default | Description |
|-----|---------|-------------|
| `mode` | `cloud` | `cloud` 或 `local` |
| `bank_id` | `hermes` | 记忆库标识符 |
| `recall_budget` | `mid` | 召回彻底程度: `low` / `mid` / `high` |
| `memory_mode` | `hybrid` | `hybrid` (上下文 + 工具), `context` (仅自动注入), `tools` (仅工具) |
| `auto_retain` | `true` | 自动保留对话轮次 |
| `auto_recall` | `true` | 在每次轮次前自动召回记忆 |
| `retain_async` | `true` | 在服务器端异步处理保留 |
| `retain_context` | `Hermes 智能体与用户之间的对话` | 保留记忆的上下文标签 |
| `retain_tags` | — | 应用于保留记忆的默认标签；与每次调用的工具标签合并 |
| `retain_source` | — | 可选的附加到保留记忆的 `metadata.source` |
| `retain_user_prefix` | `User` | 用于自动保留转录中用户轮次的标签 |
| `retain_assistant_prefix` | `Assistant` | 用于自动保留转录中助手轮次的标签 |
| `recall_tags` | — | 用于过滤的标签 |

请参阅 [插件 README](https://github.com/NousResearch/hermes-agent/blob/main/plugins/memory/hindsight/README.md) 以获取完整的配置参考。

---

### Holographic

本地 SQLite 事实存储，具有 FTS5 全文搜索、信任评分和 HRR（Holographic Reduced Representations）用于组合代数查询。

| | |
|---|---|
| **最适合** | 仅限本地的记忆，具有高级检索功能，无需外部依赖 |
| **要求** | 无（SQLite 始终可用）。HRR 代数可选 NumPy。 |
| **数据存储** | 本地 SQLite |
| **成本** | 免费 |

**工具:** `fact_store` (9个操作: 添加, 搜索, 探测, 相关, 推理, 矛盾, 更新, 删除, 列出), `fact_feedback` (有帮助/无帮助评分，用于训练信任分数)

**设置:**
```bash
hermes memory setup    # 选择 "holographic"
# 或手动:
hermes config set memory.provider holographic
```

**配置:** 位于 `plugins.hermes-memory-store` 下的 `config.yaml`

| Key | Default | Description |
|-----|---------|-------------|
| `db_path` | `$HERMES_HOME/memory_store.db` | SQLite 数据库路径 |
| `auto_extract` | `false` | 会话结束时的自动提取事实 |
| `default_trust` | `0.5` | 默认信任分数 (0.0–1.0) |

**独特功能:**
- `probe` — 特定于实体的代数召回（关于某人/事物的全部事实）
- `reason` — 跨多个实体的组合 AND 查询
- `contradict` — 冲突事实的自动化检测
- 带不对称反馈的信任评分（+0.05 有帮助 / -0.10 无帮助）

---

### RetainDB

带有混合搜索（向量 + BM25 + 重排序）、7 种记忆类型和增量压缩的云记忆 API。

| | |
|---|---|
| **最适合** | 已使用 RetainDB 基础设施的团队 |
| **要求** | RetainDB 账户 + API 密钥 |
| **数据存储** | RetainDB Cloud |
| **成本** | $20/月 |

**工具:** `retaindb_profile` (用户配置), `retaindb_search` (语义搜索), `retaindb_context` (任务相关的上下文), `retaindb_remember` (带类型 + 重要性的存储), `retaindb_forget` (删除记忆)

**设置:**
```bash
hermes memory setup    # 选择 "retaindb"
# 或手动:
hermes config set memory.provider retaindb
echo "RETAINDB_API_KEY=your-key" >> ~/.hermes/.env
```

---

### ByteRover

通过 `brv` CLI 实现的持久记忆——具有分级检索（模糊文本 → LLM 驱动搜索）的知识树。本地优先，可选云同步。

| | |
|---|---|
| **最适合** | 希望拥有便携式、本地优先记忆和 CLI 的开发者 |
| **要求** | ByteRover CLI (`npm install -g byterover-cli` 或 [安装脚本](https://byterover.dev)) |
| **数据存储** | 本地（默认）或 ByteRover Cloud（可选同步） |
| **成本** | 免费（本地）或 ByteRover 定价（云） |

**工具:** `brv_query` (搜索知识树), `brv_curate` (存储事实/决策/模式), `brv_status` (CLI 版本 + 树统计信息)

**设置:**
```bash
# 首先安装 CLI
curl -fsSL https://byterover.dev/install.sh | sh

# 然后配置 Hermes
hermes memory setup    # 选择 "byterover"
# 或手动:
hermes config set memory.provider byterover
```

**关键功能:**
- 自动预压缩提取（在上下文压缩将其丢弃之前保存见解）
- 知识树存储在 `$HERMES_HOME/byterover/` (配置范围)
- SOC2 Type II 认证的云同步（可选）

---

### Supermemory

语义长时记忆，具有配置召回、语义搜索、显式记忆工具和通过 Supermemory 图谱 API 进行会话结束对话摄取。

| | |
|---|---|
| **最适合** | 具备用户画像和会话级别图谱构建的语义召回 |
| **要求** | `pip install supermemory` + [API 密钥](https://supermemory.ai) |
| **数据存储** | Supermemory Cloud |
| **成本** | Supermemory 定价 |

**工具:** `supermemory_store` (保存显式记忆), `supermemory_search` (语义相似性搜索), `supermemory_forget` (按 ID 或最佳匹配查询遗忘), `supermemory_profile` (持久化配置 + 最近上下文)

**设置:**
```bash
hermes memory setup    # 选择 "supermemory"
# 或手动:
hermes config set memory.provider supermemory
echo 'SUPERMEMORY_API_KEY=***' >> ~/.hermes/.env
```

**配置:** `$HERMES_HOME/supermemory.json`

| Key | Default | Description |
|-----|---------|-------------|
| `container_tag` | `hermes` | 用于搜索和写入的容器标签。支持 `{identity}` 模板用于配置范围的标签。 |
| `auto_recall` | `true` | 在轮次前注入相关的记忆上下文 |
| `auto_capture` | `true` | 在每次响应后存储清理过的用户-助手对话 |
| `max_recall_results` | `10` | 格式化为上下文的最大召回项数 |
| `profile_frequency` | `50` | 在第一轮和每 N 轮中包含配置事实 |
| `capture_mode` | `all` | 默认跳过微小或琐碎的对话轮次 |
| `search_mode` | `hybrid` | 搜索模式: `hybrid`, `memories` 或 `documents` |
| `api_timeout` | `5.0` | SDK 和摄取请求的超时时间 |

**环境变量:** `SUPERMEMORY_API_KEY` (必需), `SUPERMEMORY_CONTAINER_TAG` (覆盖配置)。

**关键功能:**
- 自动上下文围栏——从捕获的轮次中剥离召回的记忆，以防止递归的记忆污染。
- 全会话摄取——整个对话在会话边界上一次性发送。
- 会话结束对话摄取（到 `/v4/conversations`）以实现更丰富的配置 + 图谱构建。
- 在第一轮和可配置的间隔内注入配置事实。
- **配置范围的容器**——使用 `container_tag` 中的 `{identity}` (例如 `hermes-{identity}` → `hermes-coder`) 来隔离每个 Hermes 配置的记忆。
- **多容器模式**——通过启用 `enable_custom_container_tags` 并提供一个 `custom_containers` 列表，允许智能体跨命名容器进行读取/写入。自动操作保留在主容器上。

<details>
<summary>多容器示例</summary>

```json
{
  "container_tag": "hermes",
  "enable_custom_container_tags": true,
  "custom_containers": ["project-alpha", "shared-knowledge"],
  "custom_container_instructions": "使用 project-alpha 进行编码上下文。"
}
```

</details>

**支持:** [Discord](https://supermemory.link/discord) · [support@supermemory.com](mailto:support@supermemory.com)

### Memori

使用 Memori Cloud 的结构化长时记忆，具有后台完成轮次捕获、工具感知的轮次上下文以及用于事实、摘要、配额、注册和反馈的显式召回工具。

| | |
|---|---|
| **最适合** | 智能体控制的召回，带有结构化的项目和会话归属 |
| **要求** | `pip install hermes-memori` + `hermes-memori install` + [Memori API 密钥](https://app.memorilabs.ai/signup) |
| **数据存储** | Memori Cloud |
| **成本** | Memori 定价 |

**工具:** `memori_recall` (搜索长时记忆), `memori_recall_summary` (摘要上下文), `memori_quota` (使用情况/配额), `memori_signup` (请求注册电子邮件), `memori_feedback` (发送集成反馈)

**设置:**
```bash
pip install hermes-memori
hermes-memori install
hermes config set memory.provider memori
hermes memory setup
```

## 服务提供方对比

| Provider | Storage | Cost | Tools | Dependencies | Unique Feature |
|----------|---------|------|-------|-------------|----------------|
| **Honcho** | Cloud | Paid | 5 | `honcho-ai` | Dialectic user modeling + session-scoped context |
| **OpenViking** | Self-hosted | Free | 5 | `openviking` + server | Filesystem hierarchy + tiered loading |
| **Mem0** | Cloud/Self-hosted | Free/Paid | 5 | `mem0ai` | Server-side LLM extraction + OSS mode |
| **Hindsight** | Cloud/Local | Free/Paid | 3 | `hindsight-client` | Knowledge graph + reflect synthesis |
| **Holographic** | Local | Free | 2 | None | HRR algebra + trust scoring |
| **RetainDB** | Cloud | $20/mo | 5 | `requests` | Delta compression |
| **ByteRover** | Local/Cloud | Free/Paid | 3 | `brv` CLI | Pre-compression extraction |
| **Supermemory** | Cloud | Paid | 4 | `supermemory` | Context fencing + session graph ingest + multi-container |
| **Memori** | Cloud | Free/Paid | 5 | `hermes-memori` | Tool-aware memory + structured recall |

## 配置文件隔离

每个提供方的数据都针对[配置文件](/user-guide/profiles)进行了隔离：

*   **本地存储提供方** (Holographic, ByteRover) 使用不同的 `$HERMES_HOME/` 路径，以区分每个配置文件。
*   **配置文件提供方** (Honcho, Mem0, Hindsight, Supermemory) 将配置存储在 `$HERMES_HOME/` 中，因此每个配置文件都有自己的凭证。
*   **云提供方** (RetainDB) 会自动推导出与配置文件相关的项目名称。
*   **环境变量提供方** (OpenViking) 是通过每个配置文件的 `.env` 文件进行配置的。

## 构建内存提供方

请参阅[开发者指南：内存提供方插件](/developer-guide/memory-provider-plugin)，了解如何创建自己的。