---
sidebar_position: 4
title: "记忆提供商"
description: "外部记忆提供商插件 — Honcho, OpenViking, Mem0, Hindsight, Holographic, RetainDB, ByteRover, Supermemory"
---

# 记忆提供商

Hermes Agent 内置了 8 个外部记忆提供商插件，这些插件为 Agent 提供了持久的、跨会话的知识，这些知识超出了内置的 MEMORY.md 和 USER.md 的范围。每次只能激活 **一个** 外部提供商 — 内置记忆始终与外部提供商并行激活。

## 快速入门

```bash
hermes memory setup      # 交互式选择器 + 配置
hermes memory status     # 检查当前激活的提供商
hermes memory off        # 禁用外部提供商
```

您也可以通过 `hermes plugins` → Provider Plugins → Memory Provider 来选择活动的记忆提供商。

或者在 `~/.hermes/config.yaml` 中手动设置：

```yaml
memory:
  provider: openviking   # 或 honcho, mem0, hindsight, holographic, retaindb, byterover, supermemory
```

## 工作原理

当激活记忆提供商时，Hermes 会自动执行以下操作：

1. **将提供商上下文注入** 系统提示（提供商知道什么）
2. **预取相关记忆**（每次轮次前，后台非阻塞）
3. **同步对话轮次** 到提供商（每次响应后）
4. **会话结束时提取记忆**（适用于支持此功能的提供商）
5. **镜像内置记忆写入** 到外部提供商
6. **添加提供商特定的工具** 使 Agent 能够搜索、存储和管理记忆

内置记忆（MEMORY.md / USER.md）将继续像以前一样工作。外部提供商是增量的。

## 可用提供商

### Honcho

具有方源推理、会话范围上下文注入、语义搜索和持久结论的 AI 原生跨会话用户建模。基础上下文现在包括会话摘要、用户表示和同伴卡片，使 Agent 了解已讨论的内容。

| | |
|---|---|
| **最适合** | 具有跨会话上下文的多 Agent 系统，用户-Agent 对齐 |
| **要求** | `pip install honcho-ai` + [API 密钥](https://app.honcho.dev) 或自托管实例 |
| **数据存储** | Honcho Cloud 或自托管 |
| **成本** | Honcho 定价（云端）/ 免费（自托管） |

**工具 (5个):** `honcho_profile` (读取/更新同伴卡片), `honcho_search` (语义搜索), `honcho_context` (会话上下文 — 摘要、表示、卡片、消息), `honcho_reasoning` (LLM 合成), `honcho_conclude` (创建/删除结论)

**架构:** 两层上下文注入 — 基础层（会话摘要 + 表示 + 同伴卡片，在 `contextCadence` 时刷新）加上方源补充（LLM 推理，在 `dialecticCadence` 时刷新）。方源根据基础上下文是否存在，自动选择冷启动提示（通用用户事实）与热提示（会话范围上下文）之间的提示。

**三个正交的配置旋钮** 可独立控制成本和深度：

- `contextCadence` — 基础层刷新频率（API 调用频率）
- `dialecticCadence` — 方源 LLM 触发频率（LLM 调用频率）
- `dialecticDepth` — 每次方源调用中的 `.chat()` 次数（1–3，推理深度）

**设置向导:**
```bash
hermes honcho setup        # (旧命令) 
# 或
hermes memory setup        # 选择 "honcho"
```

**配置:** `$HERMES_HOME/honcho.json` (profile-local) 或 `~/.honcho/config.json` (global)。解析顺序：`$HERMES_HOME/honcho.json` > `~/.hermes/honcho.json` > `~/.honcho/config.json`。请参阅 [配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md) 和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。

<details>
<summary>完整配置参考</summary>

| Key | Default | Description |
|-----|---------|-------------|
| `apiKey` | -- | 来自 [app.honcho.dev](https://app.honcho.dev) 的 API 密钥 |
| `baseUrl` | -- | 自托管 Honcho 的基础 URL |
| `peerName` | -- | 用户同伴身份 |
| `aiPeer` | host key | AI 同伴身份（每个 profile 一个） |
| `workspace` | host key | 共享工作区 ID |
| `contextTokens` | `null` (无限制) | 每轮自动注入上下文的 Token 预算。在单词边界处截断 |
| `contextCadence` | `1` | `context()` API 调用之间的最小轮次间隔（基础层刷新） |
| `dialecticCadence` | `3` | `peer.chat()` LLM 调用之间的最小轮次间隔。仅适用于 `hybrid`/`context` 模式 |
| `dialecticDepth` | `1` | 每次方源调用中的 `.chat()` 次数。限制 1–3。Pass 0: 冷/热提示, Pass 1: 自我审计, Pass 2: 协调 |
| `dialecticDepthLevels` | `null` | 每轮可选的推理级别数组，例如 `["minimal", "low", "medium"]`。覆盖比例默认值 |
| `dialecticReasoningLevel` | `'low'` | 基础推理级别: `minimal`, `low`, `medium`, `high`, `max` |
| `dialecticDynamic` | `true` | 当为 `true` 时，模型可以通过工具参数覆盖每次调用的推理级别 |
| `dialecticMaxChars` | `600` | 注入系统提示的方源结果的最大字符数 |
| `recallMode` | `'hybrid'` | `hybrid` (自动注入 + 工具), `context` (仅注入), `tools` (仅工具) |
| `writeFrequency` | `'async'` | 何时刷新消息: `async` (后台线程), `turn` (同步), `session` (结束时批量), 或整数 N |
| `saveMessages` | `true` | 是否将消息持久化到 Honcho API |
| `observationMode` | `'directional'` | `directional` (全部) 或 `unified` (共享池)。使用 `observation` 对象覆盖 |
| `messageMaxChars` | `25000` | 每条消息的最大字符数（超出时分块） |
| `dialecticMaxInputChars` | `10000` | 方源查询输入到 `peer.chat()` 的最大字符数 |
| `sessionStrategy` | `'per-directory'` | `per-directory`, `per-repo`, `per-session`, `global` |

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
如果您之前使用了 `hermes honcho setup`，您的配置和所有服务器端数据都完好无损。只需通过设置向导重新启用，或手动设置 `memory.provider: honcho` 即可通过新系统重新激活。
:::

**多 Agent / Profile:**

每个 Hermes profile 都会获得自己的 Honcho AI 同伴，同时共享同一个工作区——所有 profile 看到相同的用户表示，但每个 Agent 构建其自己的身份和观察结果。

```bash
hermes profile create coder --clone   # 创建 honcho 同伴 "coder"，继承自默认配置
```

`--clone` 的作用：在 `honcho.json` 中创建一个 `hermes.coder` 主机块，设置 `aiPeer: "coder"`，共享 `workspace`，继承 `peerName`、`recallMode`、`writeFrequency`、`observation` 等。该同伴会在 Honcho 中预先创建，确保在发送第一条消息前就存在。

对于在 Honcho 设置之前创建的 profile：

```bash
hermes honcho sync   # 扫描所有 profile，为任何缺失的 host 块创建它们
```

这会继承默认 `hermes` host 块的设置，并为每个 profile 创建新的 AI 同伴。幂等性——会跳过已拥有 host 块的 profile。

<details>
<summary>完整的 honcho.json 示例 (多 profile)</summary>

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
      "dialecticCadence": 3,
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

请参阅 [配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md) 和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。

---

### OpenViking

Volcengine (ByteDance) 的上下文数据库，具有文件系统风格的知识层次结构、分层检索和自动提取到 6 个类别的记忆。

| | |
|---|---|
| **最适合** | 具有结构化浏览的自托管知识管理 |
| **要求** | `pip install openviking` + 运行服务器 |
| **数据存储** | 自托管（本地或云端） |
| **成本** | 免费（开源，AGPL-3.0） |

**工具:** `viking_search` (语义搜索), `viking_read` (分层: 摘要/概述/完整), `viking_browse` (文件系统导航), `viking_remember` (存储事实), `viking_add_resource` (摄取 URL/文档)

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
```

**关键功能:**
- 分层上下文加载：L0 (~100 tokens) → L1 (~2k) → L2 (完整)
- 会话提交时自动记忆提取（profile、偏好、实体、事件、案例、模式）
- 用于层次化知识浏览的 `viking://` URI 方案

---

### Mem0

服务器端 LLM 事实提取，具备语义搜索、重排序和自动去重功能。

| | |
|---|---|
| **最适合** | 无需人工干预的记忆管理 — Mem0 自动处理提取 |
| **要求** | `pip install mem0ai` + API 密钥 |
| **数据存储** | Mem0 Cloud |
| **成本** | Mem0 定价 |

**工具:** `mem0_profile` (所有存储的记忆), `mem0_search` (语义搜索 + 重排序), `mem0_conclude` (存储逐字事实)

**设置:**
```bash
hermes memory setup    # 选择 "mem0"
# 或手动:
hermes config set memory.provider mem0
echo "MEM0_API_KEY=your-key" >> ~/.hermes/.env
```

**配置:** `$HERMES_HOME/mem0.json`

| Key | Default | Description |
|-----|---------|-------------|
| `user_id` | `hermes-user` | 用户标识符 |
| `agent_id` | `hermes` | Agent 标识符 |

---

### Hindsight

具有知识图谱、实体解析和多策略检索的长期记忆。`hindsight_reflect` 工具提供了其他任何提供商不具备的跨记忆合成能力。自动保留完整的对话轮次（包括工具调用），并进行会话级别的文档跟踪。

| | |
|---|---|
| **最适合** | 基于知识图谱的召回，包含实体关系 |
| **要求** | 云端：来自 [ui.hindsight.vectorize.io](https://ui.hindsight.vectorize.io) 的 API 密钥。本地：LLM API 密钥（OpenAI, Groq, OpenRouter 等）。 |
| **数据存储** | Hindsight Cloud 或本地嵌入式 PostgreSQL |
| **成本** | Hindsight 定价（云端）或免费（本地） |

**工具:** `hindsight_retain` (带实体提取存储), `hindsight_recall` (多策略搜索), `hindsight_reflect` (跨记忆合成)

**设置:**
```bash
hermes memory setup    # 选择 "hindsight"
# 或手动:
hermes config set memory.provider hindsight
echo "HINDSIGHT_API_KEY=your-key" >> ~/.hermes/.env
```

设置向导会自动安装依赖项，并且只安装所选模式所需的组件（云端使用 `hindsight-client`，本地使用 `hindsight-all`）。需要 `hindsight-client >= 0.4.22`（如果过时，在会话开始时自动升级）。

**本地模式 UI:** `hindsight-embed -p hermes ui start`

**配置:** `$HERMES_HOME/hindsight/config.json`

| Key | Default | Description |
|-----|---------|-------------|
| `mode` | `cloud` | `cloud` 或 `local` |
| `bank_id` | `hermes` | 记忆库标识符 |
| `recall_budget` | `mid` | 召回彻底程度: `low` / `mid` / `high` |
| `memory_mode` | `hybrid` | `hybrid` (上下文 + 工具), `context` (仅自动注入), `tools` (仅工具) |
| `auto_retain` | `true` | 自动保留对话轮次 |
| `auto_recall` | `true` | 每次轮次前自动召回记忆 |
| `retain_async` | `true` | 在服务器上异步处理保留 |
| `tags` | — | 存储记忆时应用的标签 |
| `recall_tags` | — | 用于召回过滤的标签 |

有关完整的配置参考，请参阅 [插件 README](https://github.com/NousResearch/hermes-agent/blob/main/plugins/memory/hindsight/README.md)。

---

### Holographic

本地 SQLite 事实存储，具备 FTS5 全文搜索、信任评分和 HRR（Holographic Reduced Representations）用于组合代数查询。

| | |
|---|---|
| **最适合** | 仅本地记忆，具备高级检索，无外部依赖 |
| **要求** | 无（SQLite 始终可用）。NumPy 可选，用于 HRR 代数。 |
| **数据存储** | 本地 SQLite |
| **成本** | 免费 |

**工具:** `fact_store` (9 个操作: add, search, probe, related, reason, contradict, update, remove, list), `fact_feedback` (有帮助/无帮助评分，用于训练信任评分)

**设置:**
```bash
hermes memory setup    # 选择 "holographic"
# 或手动:
hermes config set memory.provider holographic
```

**配置:** `plugins.hermes-memory-store` 下的 `config.yaml`

| Key | Default | Description |
|-----|---------|-------------|
| `db_path` | `$HERMES_HOME/memory_store.db` | SQLite 数据库路径 |
| `auto_extract` | `false` | 会话结束时自动提取事实 |
| `default_trust` | `0.5` | 默认信任分数 (0.0–1.0) |

**独特功能:**
- `probe` — 实体特定的代数召回（关于一个人/事物的全部事实）
- `reason` — 跨多个实体的组合 AND 查询
- `contradict` — 自动检测冲突的事实
- 带有非对称反馈的信任评分（+0.05 有帮助 / -0.10 无帮助）

---

### RetainDB

云记忆 API，具备混合搜索（向量 + BM25 + 重排序）、7 种记忆类型和增量压缩。

| | |
|---|---|
| **最适合** | 已使用 RetainDB 基础设施的团队 |
| **要求** | RetainDB 账户 + API 密钥 |
| **数据存储** | RetainDB Cloud |
| **成本** | $20/月 |

**工具:** `retaindb_profile` (用户 profile), `retaindb_search` (语义搜索), `retaindb_context` (任务相关上下文), `retaindb_remember` (带类型 + 重要性存储), `retaindb_forget` (删除记忆)

**设置:**
```bash
hermes memory setup    # 选择 "retaindb"
# 或手动:
hermes config set memory.provider retaindb
echo "RETAINDB_API_KEY=your-key" >> ~/.hermes/.env
```

---

### ByteRover

通过 `brv` CLI 实现的持久记忆 — 具有分层知识树和分层检索（模糊文本 → LLM 驱动搜索）。本地优先，可选云同步。

| | |
|---|---|
| **最适合** | 需要可移植、本地优先记忆并使用 CLI 的开发者 |
| **要求** | ByteRover CLI (`npm install -g byterover-cli` 或 [安装脚本](https://byterover.dev)) |
| **数据存储** | 本地（默认）或 ByteRover Cloud（可选同步） |
| **成本** | 免费（本地）或 ByteRover 定价（云端） |

**工具:** `brv_query` (搜索知识树), `brv_curate` (存储事实/决策/模式), `brv_status` (CLI 版本 + 树统计)

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
- 自动预压缩提取（在上下文压缩丢弃它们之前保存洞察）
- 知识树存储在 `$HERMES_HOME/byterover/` (profile-scoped)
- SOC2 Type II 认证的云同步（可选）

---

### Supermemory

语义长期记忆，具备 profile 召回、语义搜索、显式记忆工具和通过 Supermemory 图形 API 进行的会话结束对话摄取。

| | |
|---|---|
| **最适合** | 具有用户画像和会话级别图构建的语义召回 |
| **要求** | `pip install supermemory` + [API 密钥](https://supermemory.ai) |
| **数据存储** | Supermemory Cloud |
| **成本** | Supermemory 定价 |

**工具:** `supermemory_store` (保存显式记忆), `supermemory_search` (语义相似性搜索), `supermemory_forget` (按 ID 或最佳匹配查询遗忘), `supermemory_profile` (持久 profile + 最近上下文)

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
| `container_tag` | `hermes` | 用于搜索和写入的容器标签。支持 `{identity}` 模板用于 profile-scoped 标签。 |
| `auto_recall` | `true` | 在轮次前注入相关记忆上下文 |
| `auto_capture` | `true` | 在每次响应后存储清理过的用户-助手轮次 |
| `max_recall_results` | `10` | 格式化为上下文的最大召回项数 |
| `profile_frequency` | `50` | 在第一轮和每 N 轮包含 profile 事实 |
| `capture_mode` | `all` | 默认跳过微小或琐碎的轮次 |
| `search_mode` | `hybrid` | 搜索模式: `hybrid`, `memories`, 或 `documents` |
| `api_timeout` | `5.0` | SDK 和摄取请求的超时时间 |

**环境变量:** `SUPERMEMORY_API_KEY` (必需), `SUPERMEMORY_CONTAINER_TAG` (覆盖配置)。

**关键功能:**
- 自动上下文围栏 — 从捕获的轮次中剥离召回的记忆，防止递归记忆污染
- 会话结束对话摄取，用于更丰富的图级知识构建
- 在第一轮和可配置的间隔注入 profile 事实
- 琐碎消息过滤（跳过 "ok", "thanks" 等）
- **Profile-scoped 容器** — 在 `container_tag` 中使用 `{identity}` (例如 `hermes-{identity}` → `hermes-coder`) 来隔离每个 Hermes profile 的记忆
- **多容器模式** — 启用 `enable_custom_container_tags` 并提供 `custom_containers` 列表，允许 Agent 在命名容器之间读写。自动操作（同步、预取）仍保留在主容器上。

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

---

## 提供商比较

| 提供商 | 存储 | 成本 | 工具 | 依赖项 | 独特功能 |
|----------|---------|------|-------|-------------|----------------|
| **Honcho** | 云端 | 付费 | 5 | `honcho-ai` | 方源用户建模 + 会话范围上下文 |
| **OpenViking** | 自托管 | 免费 | 5 | `openviking` + 服务器 | 文件系统层次结构 + 分层加载 |
| **Mem0** | 云端 | 付费 | 3 | `mem0ai` | 服务器端 LLM 提取 |
| **Hindsight** | 云端/本地 | 免费/付费 | 3 | `hindsight-client` | 知识图谱 + 反射合成 |
| **Holographic** | 本地 | 免费 | 2 | 无 | HRR 代数 + 信任评分 |
| **RetainDB** | 云端 | $20/月 | 5 | `requests` | 增量压缩 |
| **ByteRover** | 本地/云端 | 免费/付费 | 3 | `brv` CLI | 预压缩提取 |
| **Supermemory** | 云端 | 付费 | 4 | `supermemory` | 上下文围栏 + 会话图摄取 + 多容器 |

## Profile 隔离

每个提供商的数据都按 [profile](/docs/user-guide/profiles) 隔离：

- **本地存储提供商** (Holographic, ByteRover) 使用 `$HERMES_HOME/` 路径，该路径根据 profile 不同而不同。
- **配置文件提供商** (Honcho, Mem0, Hindsight, Supermemory) 将配置存储在 `$HERMES_HOME/`，因此每个 profile 都有自己的凭证。
- **云提供商** (RetainDB) 自动推导出 profile 范围的项目名称。
- **环境变量提供商** (OpenViking) 通过每个 profile 的 `.env` 文件进行配置。

## 构建记忆提供商

请参阅 [开发者指南：记忆提供商插件](/docs/developer-guide/memory-provider-plugin) 了解如何创建自己的插件。