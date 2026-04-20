---
sidebar_position: 4
title: "内存提供程序"
description: "外部内存提供程序插件 — Honcho、OpenViking、Mem0、Hindsight、Holographic、RetainDB、ByteRover、Supermemory"
---

# 内存提供程序

Hermes Agent 附带 8 个外部内存提供程序插件，为代理提供跨会话的持久知识，超越内置的 MEMORY.md 和 USER.md。一次只能激活**一个**外部提供程序 —— 内置内存始终与其同时处于活动状态。

## 快速开始

```bash
hermes memory setup      # 交互式选择 + 配置
hermes memory status     # 检查当前激活项
hermes memory off        # 禁用外部提供程序
```

您也可以通过 `hermes plugins` → Provider Plugins → Memory Provider 来选择活动的内存提供程序。

或者在 `~/.hermes/config.yaml` 中手动设置：

```yaml
memory:
  provider: openviking   # 或 honcho, mem0, hindsight, holographic, retaindb, byterover, supermemory
```

## 工作原理

当激活内存提供程序时，Hermes 自动执行以下操作：

1. **注入提供程序上下文**到系统提示词中（提供程序已知的内容）
2. **在每个回合前预取相关记忆**（后台非阻塞）
3. **在每个响应后同步对话回合**到提供程序
4. **在会话结束时提取记忆**（适用于支持此功能的提供程序）
5. **将内置内存写入镜像到外部提供程序**
6. **添加提供程序特定工具**，使代理能够搜索、存储和管理记忆

内置内存（MEMORY.md / USER.md）继续像以前一样工作。外部提供程序是附加的。

## 可用提供程序

### Honcho

基于 AI 的跨会话用户建模，采用辩证推理、会话范围上下文注入、语义搜索和持久结论。基础上下文现在包括会话摘要以及用户表示和对等卡，使代理了解已经讨论过的内容。

| | |
|---|---|
| **最适合** | 具有跨会话上下文的多智能体系统、用户-代理对齐 |
| **需要** | `pip install honcho-ai` + [API 密钥](https://app.honcho.dev) 或自托管实例 |
| **数据存储** | Honcho Cloud 或自托管 |
| **成本** | Honcho 定价（云端）/ 免费（自托管） |

**工具（5 个）：** `honcho_profile`（读取/更新对等卡）、`honcho_search`（语义搜索）、`honcho_context`（会话上下文 — 摘要、表示、卡、消息）、`honcho_reasoning`（LLM 综合）、`honcho_conclude`（创建/删除结论）

**架构：** 双层上下文注入 — 基础层（会话摘要 + 表示 + 对等卡，在 `contextCadence` 刷新）加上辩证补充（LLM 推理，在 `dialecticCadence` 刷新）。辩证法根据基础上下文是否存在，自动选择冷启动提示（通用用户事实）与暖提示（会话范围上下文）。

**三个正交配置旋钮**独立控制成本和深度：

- `contextCadence` — 基础层刷新的频率（API 调用频率）
- `dialecticCadence` — 辩证 LLM 触发的频率（LLM 调用频率）
- `dialecticDepth` — 每次辩证调用中的 `.chat()` 次数（1–3，推理深度）

**设置向导：**
```bash
hermes honcho setup        # (旧命令)
# 或者
hermes memory setup        # 选择 "honcho"
```

**配置：** `$HERMES_HOME/honcho.json`（配置文件本地）或 `~/.honcho/config.json`（全局）。解析顺序：`$HERMES_HOME/honcho.json` > `~/.hermes/honcho.json` > `~/.honcho/config.json`。参见 [配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md) 和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。

<details>
<summary>完整的配置参考</summary>

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `apiKey` | -- | 来自 [app.honcho.dev](https://app.honcho.dev) 的 API 密钥 |
| `baseUrl` | -- | 自托管 Honcho 的基础 URL |
| `peerName` | -- | 用户对等身份 |
| `aiPeer` | host key | AI 对等身份（每个配置文件一个） |
| `workspace` | host key | 共享工作区 ID |
| `contextTokens` | `null`（无限制） | 每回合自动注入上下文的 token 预算。按单词边界截断 |
| `contextCadence` | `1` | `context()` API 调用的最小回合数（基础层刷新） |
| `dialecticCadence` | `2` | `peer.chat()` LLM 调用的最小回合数。建议 1–5。仅适用于 `hybrid`/`context` 模式 |
| `dialecticDepth` | `1` | 每次辩证调用中的 `.chat()` 次数。限制在 1–3。第 0 次：冷/暖提示，第 1 次：自我审计，第 2 次：协调 |
| `dialecticDepthLevels` | `null` | 可选数组，每轮推理级别，例如 `["minimal", "low", "medium"]`。覆盖比例默认值 |
| `dialecticReasoningLevel` | `'low'` | 基础推理级别：`minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 当 `true` 时，模型可通过工具参数覆盖每调用的推理级别 |
| `dialecticMaxChars` | `600` | 注入系统提示词的辩证结果最大字符数 |
| `recallMode` | `'hybrid'` | `hybrid`（自动注入 + 工具）、`context`（仅注入）、`tools`（仅工具） |
| `writeFrequency` | `'async'` | 何时刷新消息：`async`（后台线程）、`turn`（同步）、`session`（结束时批量）或整数 N |
| `saveMessages` | `true` | 是否将消息持久化到 Honcho API |
| `observationMode` | `'directional'` | `directional`（全部开启）或 `unified`（共享池）。通过 `observation` 对象覆盖 |
| `messageMaxChars` | `25000` | 每条消息的最大字符数（超过则分块） |
| `dialecticMaxInputChars` | `10000` | `peer.chat()` 输入的最大字符数 |
| `sessionStrategy` | `'per-directory'` | `per-directory`、`per-repo`、`per-session`、`global` |

</details>

<details>
<summary>最小 honcho.json（云端）</summary>

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
<summary>最小 honcho.json（自托管）</summary>

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
如果您之前使用 `hermes honcho setup`，您的配置和服务端数据保持不变。只需再次通过设置向导重新启用或通过手动设置 `memory.provider: honcho` 在新系统中重新激活即可。
:::

**多对等设置：**

Honcho 将对话建模为对等方交换消息 — 每个 Hermes 配置文件有一个用户对等方和一个 AI 对等方，共享一个工作区。工作区是共享环境：用户对等方在所有配置文件中是全局的，每个 AI 对等方是其自身的身份。每个 AI 对等方从其观察中构建独立的表示/卡，因此 `coder` 配置文件保持面向代码，而 `writer` 配置文件保持编辑性，针对相同的用户。

映射关系：

| 概念 | 是什么 |
|---------|-----------|
| **工作区** | 共享环境。同一工作区下的所有 Hermes 配置文件看到相同的用户身份。 |
| **用户对等方** (`peerName`) | 人类。在工作区内跨配置文件共享。 |
| **AI 对等方** (`aiPeer`) | 每个 Hermes 配置文件一个。主机密钥 `hermes` → 默认；`hermes.<profile>` 用于其他。 |
| **观察** | 控制 Honcho 从谁的消息中建模的每对等方切换。`directional`（默认，四个全开）或 `unified`（单一观察者池）。 |

### 新配置文件，新建 Honcho 对等方

```bash
hermes profile create coder --clone
```

`--clone` 在 `honcho.json` 中创建一个 `hermes.coder` 主机块，其中 `aiPeer: "coder"`，共享 `workspace`，继承 `peerName`、`recallMode`、`writeFrequency`、`observation` 等。AI 对等方会在 Honcho 中 eagerly 创建，以便在第一条消息前存在。

### 现有配置文件，回填 Honcho 对等方

```bash
hermes honcho sync
```

扫描每个 Hermes 配置文件，为没有主机的配置文件创建主机块，从默认的 `hermes` 块继承设置，并 eagerly 创建新的 AI 对等方。幂等的 — 跳过已有主机块的配置文件。

### 每配置文件观察

每个主机块可以独立覆盖观察配置。示例：一个专注于代码的配置文件，其中 AI 对等方观察用户但不进行自我建模：

```json
"hermes.coder": {
  "aiPeer": "coder",
  "observation": {
    "user": { "observeMe": true, "observeOthers": true },
    "ai":   { "observeMe": false, "observeOthers": true }
  }
}
```

**观察切换（每对等方一组）：**

| 切换 | 效果 |
|--------|--------|
| `observeMe` | Honcho 从此对等方的自身消息中构建其表示 |
| `observeOthers` | 此对等方观察其他对等方的消息（为跨对等方推理提供信息） |

通过 `observationMode` 预设：

- **`"directional"`**（默认）— 所有四个标志开启。完全相互观察；启用跨对等方辩证。
- **`"unified"`** — 用户 `observeMe: true`，AI `observeOthers: true`，其余为 false。单一观察者池；AI 对用户建模但不对自己建模，用户对等方仅进行自我建模。

通过 [Honcho 仪表板](https://app.honcho.dev) 设置的服务器端切换优先于本地默认值 — 在会话初始化时同步回传。

参见 [Honcho 页面](./honcho.md#observation-directional-vs-unified) 的完整观察参考。

<details>
<summary>完整的 honcho.json 示例（多配置文件）</summary>

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

参见 [配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md) 和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。


---

### OpenViking

火山引擎（字节跳动）提供的上下文数据库，具有类文件系统知识层次结构、分层检索和自动记忆提取到 6 个类别。

| | |
|---|---|
| **最适合** | 具有结构化浏览的自托管知识管理 |
| **需要** | `pip install openviking` + 运行中的服务器 |
| **数据存储** | 自托管（本地或云端） |
| **成本** | 免费（开源，AGPL-3.0） |

**工具：** `viking_search`（语义搜索）、`viking_read`（分层：摘要/概览/完整）、`viking_browse`（文件系统导航）、`viking_remember`（存储事实）、`viking_add_resource`（摄取 URL/文档）

**设置：**
```bash
# 首先启动 OpenViking 服务器
pip install openviking
openviking-server

# 然后配置 Hermes
hermes memory setup    # 选择 "openviking"
# 或者手动：
hermes config set memory.provider openviking
echo "OPENVIKING_ENDPOINT=http://localhost:1933" >> ~/.hermes/.env
```

**主要功能：**
- 分层上下文加载：L0 (~100 tokens) → L1 (~2k) → L2 (完整)
- 会话提交时的自动记忆提取（配置文件、偏好、实体、事件、案例、模式）
- `viking://` URI 方案用于分层知识浏览

---

### Mem0

服务器端 LLM 事实提取，具有语义搜索、重排序和自动去重。

| | |
|---|---|
| **最适合** | 无需干预的记忆管理 — Mem0 自动处理提取 |
| **需要** | `pip install mem0ai` + API 密钥 |
| **数据存储** | Mem0 Cloud |
| **成本** | Mem0 定价 |

**工具：** `mem0_profile`（所有存储的记忆）、`mem0_search`（语义搜索 + 重排序）、`mem0_conclude`（存储逐字事实）

**设置：**
```bash
hermes memory setup    # 选择 "mem0"
# 或者手动：
hermes config set memory.provider mem0
echo "MEM0_API_KEY=your-key" >> ~/.hermes/.env
```

**配置：** `$HERMES_HOME/mem0.json`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `user_id` | `hermes-user` | 用户标识符 |
| `agent_id` | `hermes` | 代理标识符 |

---

### Hindsight

具有知识图谱、实体解析和多策略检索的长期记忆。`hindsight_reflect` 工具提供跨记忆综合，这是任何其他提供程序都无法提供的功能。自动保留完整的对话回合（包括工具调用），并进行会话级文档跟踪。

| | |
|---|---|
| **最适合** | 基于知识图谱的召回，具有实体关系 |
| **需要** | 云端：[ui.hindsight.vectorize.io](https://ui.hindsight.vectorize.io) 的 API 密钥。本地：LLM API 密钥（OpenAI、Groq、OpenRouter 等） |
| **数据存储** | Hindsight Cloud 或本地嵌入式 PostgreSQL |
| **成本** | Hindsight 定价（云端）或免费（本地） |

**工具：** `hindsight_retain`（带实体提取的存储）、`hindsight_recall`（多策略搜索）、`hindsight_reflect`（跨记忆综合）

**设置：**
```bash
hermes memory setup    # 选择 "hindsight"
# 或者手动：
hermes config set memory.provider hindsight
echo "HINDSIGHT_API_KEY=your-key" >> ~/.hermes/.env
```

设置向导会自动安装依赖项，并且只安装所选模式所需的依赖项（云模式为 `hindsight-client`，本地模式为 `hindsight-all`）。需要 `hindsight-client >= 0.4.22`（如果过时，会在会话开始时自动升级）。

**本地模式 UI：** `hindsight-embed -p hermes ui start`

**配置：** `$HERMES_HOME/hindsight/config.json`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `mode` | `cloud` | `cloud` 或 `local` |
| `bank_id` | `hermes` | 记忆库标识符 |
| `recall_budget` | `mid` | 召回详尽程度：`low` / `mid` / `high` |
| `memory_mode` | `hybrid` | `hybrid`（上下文 + 工具）、`context`（仅自动注入）、`tools`（仅工具） |
| `auto_retain` | `true` | 自动保留对话回合 |
| `auto_recall` | `true` | 自动在每次回合前召回记忆 |
| `retain_async` | `true` | 在服务器上异步处理保留 |
| `tags` | — | 存储记忆时应用的标签 |
| `recall_tags` | — | 用于过滤召回的标签 |

参见 [插件 README](https://github.com/NousResearch/hermes-agent/blob/main/plugins/memory/hindsight/README.md) 的完整配置参考。

---

### Holographic

本地 SQLite 事实存储，具有 FTS5 全文搜索、信任评分和 HRR（全息约简表示）用于组合代数查询。

| | |
|---|---|
| **最适合** | 无外部依赖的本地-only 记忆，高级检索 |
| **需要** | 无需（SQLite 始终可用）。NumPy 可选用于 HRR 代数。 |
| **数据存储** | 本地 SQLite |
| **成本** | 免费 |

**工具：** `fact_store`（9 个操作：添加、搜索、探测、相关、推理、矛盾、更新、移除、列出）、`fact_feedback`（有帮助/无帮助的评分，用于训练信任分数）

**设置：**
```bash
hermes memory setup    # 选择 "holographic"
# 或者手动：
hermes config set memory.provider holographic
```

**配置：** `config.yaml` 下 `plugins.hermes-memory-store`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `db_path` | `$HERMES_HOME/memory_store.db` | SQLite 数据库路径 |
| `auto_extract` | `false` | 在会话结束时自动提取事实 |
| `default_trust` | `0.5` | 默认信任分数（0.0–1.0） |

**独特功能：**
- `probe` — 实体特定的代数召回（关于一个人/事物的所有事实）
- `reason` — 跨多个实体的组合 AND 查询
- `contradict` — 冲突事实的自动检测
- 信任评分，具有非对称反馈（有帮助 +0.05 / 无助 -0.10）

---

### RetainDB

具有混合搜索（向量 + BM25 + 重排序）、7 种记忆类型和 delta 压缩的云记忆 API。

| | |
|---|---|
| **最适合** | 已在使用 RetainDB 基础设施的团队 |
| **需要** | RetainDB 账户 + API 密钥 |
| **数据存储** | RetainDB Cloud |
| **成本** | $20/月 |

**工具：** `retaindb_profile`（用户配置文件）、`retaindb_search`（语义搜索）、`retaindb_context`（任务相关上下文）、`retaindb_remember`（带类型 + 重要性的存储）、`retaindb_forget`（删除记忆）

**设置：**
```bash
hermes memory setup    # 选择 "retaindb"
# 或者手动：
hermes config set memory.provider retaindb
echo "RETAINDB_API_KEY=your-key" >> ~/.hermes/.env
```

---

### ByteRover

通过 `brv` CLI 实现持久记忆 — 具有分层检索（模糊文本 → LLM 驱动搜索）的分层知识树。本地优先，可选云端同步。

| | |
|---|---|
| **最适合** | 希望拥有便携式、本地优先记忆的开发商，CLI 操作 |
| **需要** | ByteRover CLI（`npm install -g byterover-cli` 或 [安装脚本](https://byterover.dev)） |
| **数据存储** | 本地（默认）或 ByteRover Cloud（可选同步） |
| **成本** | 免费（本地）或 ByteRover 定价（云端） |

**工具：** `brv_query`（搜索知识树）、`brv_curate`（存储事实/决策/模式）、`brv_status`（CLI 版本 + 树统计）

**设置：**
```bash
# 首先安装 CLI
curl -fsSL https://byterover.dev/install.sh | sh

# 然后配置 Hermes
hermes memory setup    # 选择 "byterover"
# 或者手动：
hermes config set memory.provider byterover
```

**主要功能：**
- 自动预压缩提取（在上下文压缩丢弃之前保存见解）
- 知识树存储在 `$HERMES_HOME/byterover/`（配置文件范围）
- SOC2 Type II 认证云端同步（可选）

---

### Supermemory

具有配置文件召回、语义搜索、显式记忆工具和通过 Supermemory 图 API 进行会话结束对话摄取的语义长期记忆。

| | |
|---|---|
| **最适合** | 具有用户配置文件和会话级图构建的语义召回 |
| **需要** | `pip install supermemory` + [API 密钥](https://supermemory.ai) |
| **数据存储** | Supermemory Cloud |
| **成本** | Supermemory 定价 |

**工具：** `supermemory_store`（保存显式记忆）、`supermemory_search`（语义相似度搜索）、`supermemory_forget`（按 ID 或最佳匹配查询遗忘）、`supermemory_profile`（持久配置文件 + 最近上下文）

**设置：**
```bash
hermes memory setup    # 选择 "supermemory"
# 或者手动：
hermes config set memory.provider supermemory
echo 'SUPERMEMORY_API_KEY=***' >> ~/.hermes/.env
```

**配置：** `$HERMES_HOME/supermemory.json`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `container_tag` | `hermes` | 用于搜索和写入的容器标签。支持 `{identity}` 模板用于配置文件范围的标签。 |
| `auto_recall` | `true` | 在回合前注入相关记忆上下文 |
| `auto_capture` | `true` | 在每个响应后存储清理过的用户-助手回合 |
| `max_recall_results` | `10` | 格式化为上下文的最大召回项目数 |
| `profile_frequency` | `50` | 在第一回合和每 N 回合包含配置文件事实 |
| `capture_mode` | `all` | 默认跳过微小或无意义的回合 |
| `search_mode` | `hybrid` | 搜索模式：`hybrid`、`memories` 或 `documents` |
| `api_timeout` | `5.0` | SDK 和摄取请求的超时时间 |

**环境变量：** `SUPERMEMORY_API_KEY`（必需）、`SUPERMEMORY_CONTAINER_TAG`（覆盖配置）。

**主要功能：**
- 自动上下文围栏 — 剥离回忆的记忆，防止递归记忆污染
- 会话结束对话摄取，用于更丰富的图级别知识构建
- 在第一回合和可配置的间隔处注入配置文件事实
- 琐碎消息过滤（跳过 "ok"、"thanks" 等）
- **配置文件范围容器** — 在 `container_tag` 中使用 `{identity}`（例如 `hermes-{identity}` → `hermes-coder`）以隔离每个 Hermes 配置文件的记忆
- **多容器模式** — 启用 `enable_custom_container_tags` 并带有 `custom_containers` 列表，让代理在命名容器之间读写。自动操作（同步、预取）保持在主容器上。

<details>
<summary>多容器示例</summary>

```json
{
  "container_tag": "hermes",
  "enable_custom_container_tags": true,
  "custom_containers": ["project-alpha", "shared-knowledge"],
  "custom_container_instructions": "Use project-alpha for coding context."
}
```

</details>

**支持：** [Discord](https://supermemory.link/discord) · [support@supermemory.com](mailto:support@supermemory.com)

---

## 提供程序比较

| 提供程序 | 存储 | 成本 | 工具 | 依赖项 | 独特功能 |
|----------|---------|------|-------|-------------|----------------|
| **Honcho** | 云端 | 付费 | 5 | `honcho-ai` | 辩证用户建模 + 会话范围上下文 |
| **OpenViking** | 自托管 | 免费 | 5 | `openviking` + 服务器 | 文件系统层次结构 + 分层加载 |
| **Mem0** | 云端 | 付费 | 3 | `mem0ai` | 服务器端 LLM 提取 |
| **Hindsight** | 云端/本地 | 免费/付费 | 3 | `hindsight-client` | 知识图谱 + reflect 综合 |
| **Holographic** | 本地 | 免费 | 2 | 无 | HRR 代数 + 信任评分 |
| **RetainDB** | 云端 | $20/月 | 5 | `requests` | Delta 压缩 |
| **ByteRover** | 本地/云端 | 免费/付费 | 3 | `brv` CLI | 预压缩提取 |
| **Supermemory** | 云端 | 付费 | 4 | `supermemory` | 上下文围栏 + 会话图摄取 + 多容器 |

## 配置文件隔离

每个提供程序的 data 都根据 [配置文件](/docs/user-guide/profiles) 隔离：

- **本地存储提供程序**（Holographic、ByteRover）使用 `$HERMES_HOME/` 路径，这些路径因配置文件而异
- **配置文件提供程序**（Honcho、Mem0、Hindsight、Supermemory）将配置存储在 `$HERMES_HOME/`，因此每个配置文件都有自己的凭据
- **云端提供程序**（RetainDB）自动派生配置文件范围的项目名称
- **环境变量提供程序**（OpenViking）通过每个配置文件的 `.env` 文件配置

## 构建内存提供程序

参见 [开发者指南：内存提供程序插件](/docs/developer-guide/memory-provider-plugin) 了解如何创建您自己的。