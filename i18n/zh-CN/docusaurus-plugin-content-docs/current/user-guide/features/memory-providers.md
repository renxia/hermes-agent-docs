---
sidebar_position: 4
title: "记忆提供商"
description: "外部记忆提供商插件——Honcho、OpenViking、Mem0、Hindsight、Holographic、RetainDB、ByteRover、Supermemory"
---

# 记忆提供商

Hermes智能体自带8个外部记忆提供商插件，这些插件为智能体提供了超越内置MEMORY.md和USER.md的持久化、跨会话知识。**同一时间只能启用一个外部提供商**——内置记忆将始终与其同时处于活动状态。

## 快速开始

```bash
hermes memory setup      # 交互式选择器 + 配置
hermes memory status     # 检查当前活动状态
hermes memory off        # 禁用外部提供商
```

您也可以通过 `hermes plugins` → 提供商插件 → 记忆提供商 来选择活动记忆提供商。

或在 `~/.hermes/config.yaml` 中手动设置：

```yaml
memory:
  provider: openviking   # 或 honcho, mem0, hindsight, holographic, retaindb, byterover, supermemory
```

## 工作原理

当记忆提供方处于活动状态时，Hermes 会自动：

1. **将提供方上下文**注入系统提示词（提供方所知的信息）
2. **在每轮对话前预取相关记忆**（后台，非阻塞）
3. **在每次响应后将对话轮次同步**到提供方
4. **在会话结束时提取记忆**（对于支持此功能的提供方）
5. **将内置记忆写入**镜像到外部提供方
6. **添加提供方特定的工具**，以便智能体能够搜索、存储和管理记忆

内置记忆（MEMORY.md / USER.md）将继续像以前一样工作。外部提供方是附加功能。

## 可用提供方

### Honcho

AI 原生的跨会话用户建模，具备辩证推理、会话范围上下文注入、语义搜索和持久化结论功能。基础上下文现在除了用户表示和对等卡片外，还包括会话摘要，使智能体能够了解已讨论过的内容。

| | |
|---|---|
| **最适合** | 具有跨会话上下文、用户-智能体对齐的多智能体系统 |
| **要求** | `pip install honcho-ai` + [API 密钥](https://app.honcho.dev) 或自托管实例 |
| **数据存储** | Honcho 云或自托管 |
| **成本** | Honcho 定价（云端）/ 免费（自托管） |

**工具 (5)：** `honcho_profile`（读取/更新对等卡片）、`honcho_search`（语义搜索）、`honcho_context`（会话上下文 — 摘要、表示、卡片、消息）、`honcho_reasoning`（LLM 合成）、`honcho_conclude`（创建/删除结论）

**架构：** 两层上下文注入 — 基础层（会话摘要 + 表示 + 对等卡片，在 `contextCadence` 上刷新）加上辩证补充（LLM 推理，在 `dialecticCadence` 上刷新）。辩证过程会根据基础上下文是否存在，自动选择冷启动提示（一般用户事实）与热启动提示（会话范围上下文）。

**三个正交配置旋钮**独立控制成本和深度：

- `contextCadence` — 基础层刷新频率（API 调用频率）
- `dialecticCadence` — 辩证 LLM 启动频率（LLM 调用频率）
- `dialecticDepth` — 每次辩证调用执行的 `.chat()` 传递次数（1-3，推理深度）

**设置向导：**
```bash
hermes memory setup        # 选择 "honcho" — 运行 Honcho 特定的设置后操作
```

旧版 `hermes honcho setup` 命令仍然有效（现在会重定向到 `hermes memory setup`），但仅在将 Honcho 选为活动记忆提供方后才会注册。

**配置：** `$HERMES_HOME/honcho.json`（配置文件本地）或 `~/.honcho/config.json`（全局）。解析顺序：`$HERMES_HOME/honcho.json` > `~/.hermes/honcho.json` > `~/.honcho/config.json`。请参阅[配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md)和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。

<details>
<summary>完整配置参考</summary>

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `apiKey` | -- | 来自 [app.honcho.dev](https://app.honcho.dev) 的 API 密钥 |
| `baseUrl` | -- | 自托管 Honcho 的基础 URL |
| `peerName` | -- | 用户对等身份 |
| `aiPeer` | host key | AI 对等身份（每个配置文件一个） |
| `workspace` | host key | 共享工作区 ID |
| `contextTokens` | `null`（无上限） | 每轮自动注入上下文的令牌预算。在单词边界处截断 |
| `contextCadence` | `1` | `context()` API 调用之间的最小轮次（基础层刷新） |
| `dialecticCadence` | `2` | `peer.chat()` LLM 调用之间的最小轮次。建议 1-5。仅适用于 `hybrid`/`context` 模式 |
| `dialecticDepth` | `1` | 每次辩证调用执行的 `.chat()` 传递次数。限制为 1-3。传递 0：冷/热提示，传递 1：自我审计，传递 2：调和 |
| `dialecticDepthLevels` | `null` | 每个传递的可选推理级别数组，例如 `["minimal", "low", "medium"]`。覆盖比例默认值 |
| `dialecticReasoningLevel` | `'low'` | 基础推理级别：`minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 当为 `true` 时，模型可通过工具参数覆盖每次调用的推理级别 |
| `dialecticMaxChars` | `600` | 注入系统提示词的辩证结果最大字符数 |
| `recallMode` | `'hybrid'` | `hybrid`（自动注入 + 工具）、`context`（仅注入）、`tools`（仅工具） |
| `writeFrequency` | `'async'` | 刷新消息的时间：`async`（后台线程）、`turn`（同步）、`session`（结束时批量处理）或整数 N |
| `saveMessages` | `true` | 是否将消息持久化到 Honcho API |
| `observationMode` | `'directional'` | `directional`（全部开启）或 `unified`（共享池）。可通过 `observation` 对象覆盖 |
| `messageMaxChars` | `25000` | 每条消息的最大字符数（超过则分块） |
| `dialecticMaxInputChars` | `10000` | 输入到 `peer.chat()` 的辩证查询最大字符数 |
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
如果您之前使用过 `hermes honcho setup`，您的配置和所有服务器端数据都完好无损。只需通过设置向导再次重新启用，或手动设置 `memory.provider: honcho` 即可通过新系统重新激活。
:::

**多对等设置：**

Honcho 将对话建模为对等方交换消息 — 每个 Hermes 配置文件有一个用户对等方加上一个 AI 对等方，都共享一个工作区。工作区是共享环境：用户对等方在配置文件之间是全局的，每个 AI 对等方有自己的身份。每个 AI 对等方根据自己的观察构建独立的表示/卡片，因此 `coder` 配置文件保持以代码为导向，而 `writer` 配置文件针对同一用户保持以编辑为导向。

映射关系：

| 概念 | 它是什么 |
|---------|-----------|
| **工作区** | 共享环境。一个工作区下的所有 Hermes 配置文件都看到相同的用户身份。 |
| **用户对等方** (`peerName`) | 人类。在工作区的配置文件间共享。 |
| **AI 对等方** (`aiPeer`) | 每个 Hermes 配置文件一个。主机键 `hermes` → 默认值；`hermes.<profile>` 用于其他。 |
| **观察** | 每个对等方的切换，控制 Honcho 从谁的消息建模。`directional`（默认，全部四个开启）或 `unified`（单观察者池）。 |

### 新配置文件，新 Honcho 对等方

```bash
hermes profile create coder --clone
```

`--clone` 在 `honcho.json` 中创建 `hermes.coder` 主机块，包含 `aiPeer: "coder"`、共享 `workspace`、继承的 `peerName`、`recallMode`、`writeFrequency`、`observation` 等。AI 对等方在 Honcho 中被急切创建，因此在第一条消息之前就已存在。

### 现有配置文件，回填 Honcho 对等方

```bash
hermes honcho sync
```

扫描每个 Hermes 配置文件，为任何没有主机块的配置文件创建主机块，从默认 `hermes` 块继承设置，并急切地创建新的 AI 对等方。幂等 — 跳过已有主机块的配置文件。

### 每个配置文件的观察

每个主机块可以独立覆盖观察配置。示例：一个专注于代码的配置文件，其中 AI 对等方观察用户但不自我建模：

```json
"hermes.coder": {
  "aiPeer": "coder",
  "observation": {
    "user": { "observeMe": true, "observeOthers": true },
    "ai":   { "observeMe": false, "observeOthers": true }
  }
}
```

**观察切换（每个对等方一组）：**

| 切换 | 效果 |
|--------|--------|
| `observeMe` | Honcho 从此对等方自身消息构建其表示 |
| `observeOthers` | 此对等方观察另一对等方的消息（为跨对等方推理提供数据） |

通过 `observationMode` 预设：

- **`"directional"`**（默认）— 四个标志全部开启。完全相互观察；启用跨对等方辩证。
- **`"unified"`** — 用户 `observeMe: true`，AI `observeOthers: true`，其余为 false。单观察者池；AI 对用户建模但不对自身建模，用户对等方仅自我建模。

通过 [Honcho 仪表板](https://app.honcho.dev) 设置的服务器端切换优先于本地默认值 — 在会话初始化时同步回来。

请参阅 [Honcho 页面](./honcho.md#observation-directional-vs-unified) 获取完整的观察参考。

<details>
<summary>完整 honcho.json 示例（多配置文件）</summary>

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

请参阅[配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md)和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。


---

### OpenViking

字节跳动火山引擎的上下文数据库，具有文件系统式知识层次结构、分层检索和自动记忆提取功能，可提取为 6 个类别。

| | |
|---|---|
| **最适合** | 具有结构化浏览的自托管知识管理 |
| **要求** | `pip install openviking` + 运行服务器 |
| **数据存储** | 自托管（本地或云端） |
| **成本** | 免费（开源，AGPL-3.0） |

**工具：** `viking_search`（语义搜索）、`viking_read`（分层：摘要/概述/全文）、`viking_browse`（文件系统导航）、`viking_remember`（存储事实）、`viking_add_resource`（摄入 URL/文档）

**设置：**
```bash
# 首先启动 OpenViking 服务器
pip install openviking
openviking-server

# 然后配置 Hermes
hermes memory setup    # 选择 "openviking"
# 或手动设置：
hermes config set memory.provider openviking
echo "OPENVIKING_ENDPOINT=http://localhost:1933" >> ~/.hermes/.env
```

**主要功能：**
- 分层上下文加载：L0 (~100 令牌) → L1 (~2k) → L2 (全文)
- 会话提交时自动记忆提取（个人资料、偏好、实体、事件、案例、模式）
- `viking://` URI 方案用于分层知识浏览

---

### Mem0

服务器端 LLM 事实提取，具备语义搜索、重排序和自动去重功能。

| | |
|---|---|
| **最适合** | 免手动记忆管理 — Mem0 自动处理提取 |
| **要求** | `pip install mem0ai` + API 密钥 |
| **数据存储** | Mem0 云 |
| **成本** | Mem0 定价 |

**工具：** `mem0_profile`（所有存储的记忆）、`mem0_search`（语义搜索 + 重排序）、`mem0_conclude`（逐字存储事实）

**设置：**
```bash
hermes memory setup    # 选择 "mem0"
# 或手动设置：
hermes config set memory.provider mem0
echo "MEM0_API_KEY=your-key" >> ~/.hermes/.env
```

**配置：** `$HERMES_HOME/mem0.json`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `user_id` | `hermes-user` | 用户标识符 |
| `agent_id` | `hermes` | 智能体标识符 |

---

### Hindsight

具有知识图谱、实体解析和多策略检索功能的长期记忆。`hindsight_reflect` 工具提供其他提供方不具备的跨记忆综合能力。自动保留完整的对话轮次（包括工具调用），并具备会话级文档跟踪。

| | |
|---|---|
| **最适合** | 基于知识图谱的检索，具有实体关系 |
| **要求** | 云端：来自 [ui.hindsight.vectorize.io](https://ui.hindsight.vectorize.io) 的 API 密钥。本地：LLM API 密钥（OpenAI, Groq, OpenRouter 等） |
| **数据存储** | Hindsight 云或本地嵌入式 PostgreSQL |
| **成本** | Hindsight 定价（云端）或免费（本地） |

**工具：** `hindsight_retain`（带实体提取的存储）、`hindsight_recall`（多策略搜索）、`hindsight_reflect`（跨记忆综合）

**设置：**
```bash
hermes memory setup    # 选择 "hindsight"
# 或手动设置：
hermes config set memory.provider hindsight
echo "HINDSIGHT_API_KEY=your-key" >> ~/.hermes/.env
```

设置向导会自动安装依赖项，并且只为所选模式安装所需内容（`hindsight-client` 用于云端，`hindsight-all` 用于本地）。需要 `hindsight-client >= 0.4.22`（如果过时，会在会话开始时自动升级）。

**本地模式 UI：** `hindsight-embed -p hermes ui start`

**配置：** `$HERMES_HOME/hindsight/config.json`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `mode` | `cloud` | `cloud` 或 `local` |
| `bank_id` | `hermes` | 记忆库标识符 |
| `recall_budget` | `mid` | 检索彻底性：`low` / `mid` / `high` |
| `memory_mode` | `hybrid` | `hybrid`（上下文 + 工具）、`context`（仅自动注入）、`tools`（仅工具） |
| `auto_retain` | `true` | 自动保留对话轮次 |
| `auto_recall` | `true` | 在每轮对话前自动检索记忆 |
| `retain_async` | `true` | 在服务器上异步处理保留操作 |
| `retain_context` | `conversation between Hermes Agent and the User` | 保留记忆的上下文标签 |
| `retain_tags` | — | 应用于保留记忆的默认标签；与每次调用的工具标签合并 |
| `retain_source` | — | 附加到保留记忆的可选 `metadata.source` |
| `retain_user_prefix` | `User` | 自动保留记录中用户轮次前的标签 |
| `retain_assistant_prefix` | `Assistant` | 自动保留记录中助手轮次前的标签 |
| `recall_tags` | — | 检索时用于过滤的标签 |

请参阅[插件 README](https://github.com/NousResearch/hermes-agent/blob/main/plugins/memory/hindsight/README.md) 获取完整配置参考。

---

### Holographic

本地 SQLite 事实存储，具备 FTS5 全文搜索、信任评分和 HRR（全息简化表示）用于组合代数查询。

| | |
|---|---|
| **最适合** | 具有高级检索的纯本地记忆，无外部依赖 |
| **要求** | 无（SQLite 始终可用）。NumPy 可选用于 HRR 代数。 |
| **数据存储** | 本地 SQLite |
| **成本** | 免费 |

**工具：** `fact_store`（9 种操作：添加、搜索、探查、关联、推理、矛盾、更新、删除、列出）、`fact_feedback`（有帮助/无帮助评分，用于训练信任分数）

**设置：**
```bash
hermes memory setup    # 选择 "holographic"
# 或手动设置：
hermes config set memory.provider holographic
```

**配置：** `plugins.hermes-memory-store` 下的 `config.yaml`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `db_path` | `$HERMES_HOME/memory_store.db` | SQLite 数据库路径 |
| `auto_extract` | `false` | 会话结束时自动提取事实 |
| `default_trust` | `0.5` | 默认信任分数（0.0-1.0） |

**独特功能：**
- `probe` — 实体特定代数检索（关于某人/某物的所有事实）
- `reason` — 跨多个实体的组合 AND 查询
- `contradict` — 自动检测矛盾事实
- 具有不对称反馈的信任评分（有帮助 +0.05 / 无帮助 -0.10）

---

### RetainDB

云记忆 API，具备混合搜索（向量 + BM25 + 重排序）、7 种记忆类型和增量压缩功能。

| | |
|---|---|
| **最适合** | 已使用 RetainDB 基础设施的团队 |
| **要求** | RetainDB 账户 + API 密钥 |
| **数据存储** | RetainDB 云 |
| **成本** | $20/月 |

**工具：** `retaindb_profile`（用户配置文件）、`retaindb_search`（语义搜索）、`retaindb_context`（任务相关上下文）、`retaindb_remember`（带类型和重要性的存储）、`retaindb_forget`（删除记忆）

**设置：**
```bash
hermes memory setup    # 选择 "retaindb"
# 或手动设置：
hermes config set memory.provider retaindb
echo "RETAINDB_API_KEY=your-key" >> ~/.hermes/.env
```

---

### ByteRover

通过 `brv` CLI 实现持久记忆 — 具有分层知识树和分层检索（模糊文本 → LLM 驱动搜索）功能。本地优先，可选云同步。

| | |
|---|---|
| **最适合** | 希望使用 CLI 的可移植、本地优先记忆的开发者 |
| **要求** | ByteRover CLI (`npm install -g byterover-cli` 或 [安装脚本](https://byterover.dev)) |
| **数据存储** | 本地（默认）或 ByteRover 云（可选同步） |
| **成本** | 免费（本地）或 ByteRover 定价（云端） |

**工具：** `brv_query`（搜索知识树）、`brv_curate`（存储事实/决策/模式）、`brv_status`（CLI 版本 + 树统计）

**设置：**
```bash
# 首先安装 CLI
curl -fsSL https://byterover.dev/install.sh | sh

# 然后配置 Hermes
hermes memory setup    # 选择 "byterover"
# 或手动设置：
hermes config set memory.provider byterover
```

**主要功能：**
- 自动预压缩提取（在上下文压缩丢弃见解之前保存它们）
- 知识树存储在 `$HERMES_HOME/byterover/`（配置文件范围）
- SOC2 Type II 认证云同步（可选）

---

### Supermemory

语义长期记忆，具备配置文件检索、语义搜索、显式记忆工具，以及通过 Supermemory 图形 API 在会话结束时摄取对话功能。

| | |
|---|---|
| **最适合** | 具有用户配置和会话级图形构建的语义检索 |
| **要求** | `pip install supermemory` + [API 密钥](https://supermemory.ai) |
| **数据存储** | Supermemory 云 |
| **成本** | Supermemory 定价 |

**工具：** `supermemory_store`（保存显式记忆）、`supermemory_search`（语义相似性搜索）、`supermemory_forget`（按 ID 或最佳匹配查询遗忘）、`supermemory_profile`（持久配置文件 + 近期上下文）

**设置：**
```bash
hermes memory setup    # 选择 "supermemory"
# 或手动设置：
hermes config set memory.provider supermemory
echo 'SUPERMEMORY_API_KEY=***' >> ~/.hermes/.env
```

**配置：** `$HERMES_HOME/supermemory.json`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `container_tag` | `hermes` | 用于搜索和写入的容器标签。支持 `{identity}` 模板用于配置文件范围的标签。 |
| `auto_recall` | `true` | 在轮次前注入相关记忆上下文 |
| `auto_capture` | `true` | 在每次响应后存储清理后的用户-助手轮次 |
| `max_recall_results` | `10` | 格式化到上下文中的最大检索项数 |
| `profile_frequency` | `50` | 在第一轮和每 N 轮包含配置文件事实 |
| `capture_mode` | `all` | 默认跳过微小或琐碎的轮次 |
| `search_mode` | `hybrid` | 搜索模式：`hybrid`、`memories` 或 `documents` |
| `api_timeout` | `5.0` | SDK 和摄取请求的超时时间 |

**环境变量：** `SUPERMEMORY_API_KEY`（必需），`SUPERMEMORY_CONTAINER_TAG`（覆盖配置）。

**主要功能：**
- 自动上下文围栏 — 从捕获的轮次中剥离检索到的记忆，以防止递归记忆污染
- 会话结束时摄取对话，用于更丰富的图形级知识构建
- 在第一轮和可配置间隔注入配置文件事实
- 琐碎消息过滤（跳过 "ok"、"thanks" 等）
- **配置文件范围容器** — 在 `container_tag` 中使用 `{identity}`（例如 `hermes-{identity}` → `hermes-coder`）以隔离每个 Hermes 配置文件的记忆
- **多容器模式** — 启用 `enable_custom_container_tags` 和 `custom_containers` 列表，允许智能体跨命名容器读写。自动操作（同步、预取）保留在主容器上。

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

### Memori

使用 Memori 云的结构化长期记忆，具备后台完成轮次捕获、工具感知轮次上下文，以及用于事实、摘要、配额、注册和反馈的显式检索工具。

| | |
|---|---|
| **最适合** | 具有结构化项目和会话归因的智能体控制检索 |
| **要求** | `pip install hermes-memori` + `hermes-memori install` + [Memori API 密钥](https://app.memorilabs.ai/signup) |
| **数据存储** | Memori 云 |
| **成本** | Memori 定价 |

**工具：** `memori_recall`（搜索长期记忆）、`memori_recall_summary`（摘要上下文）、`memori_quota`（使用量/配额）、`memori_signup`（请求注册邮件）、`memori_feedback`（发送集成反馈）

**设置：**
```bash
pip install hermes-memori
hermes-memori install
hermes config set memory.provider memori
hermes memory setup
```

---

## 供应商比较

| 供应商 | 存储方式 | 费用 | 工具数 | 依赖项 | 独特功能 |
|----------|---------|------|-------|-------------|----------------|
| **Honcho** | 云端 | 付费 | 5 | `honcho-ai` | 辩证用户建模 + 会话级上下文 |
| **OpenViking** | 自托管 | 免费 | 5 | `openviking` + 服务器 | 文件系统层级 + 分层加载 |
| **Mem0** | 云端 | 付费 | 3 | `mem0ai` | 服务器端大语言模型提取 |
| **Hindsight** | 云端/本地 | 免费/付费 | 3 | `hindsight-client` | 知识图谱 + 反思综合 |
| **Holographic** | 本地 | 免费 | 2 | 无 | HRR 代数 + 信任评分 |
| **RetainDB** | 云端 | $20/月 | 5 | `requests` | 增量压缩 |
| **ByteRover** | 本地/云端 | 免费/付费 | 3 | `brv` 命令行界面 | 预压缩提取 |
| **Supermemory** | 云端 | 付费 | 4 | `supermemory` | 上下文围栏 + 会话图谱摄取 + 多容器 |
| **Memori** | 云端 | 免费/付费 | 5 | `hermes-memori` | 工具感知记忆 + 结构化召回 |

## 配置隔离

每个供应商的数据按[配置文件](/user-guide/profiles)隔离：

- **本地存储供应商**（Holographic, ByteRover）使用 `$HERMES_HOME/` 路径，该路径因配置文件而异
- **配置文件供应商**（Honcho, Mem0, Hindsight, Supermemory）将配置存储在 `$HERMES_HOME/` 中，因此每个配置文件拥有自己的凭据
- **云端供应商**（RetainDB）自动派生基于配置文件的项目名称
- **环境变量供应商**（OpenViking）通过每个配置文件的 `.env` 文件进行配置

## 构建记忆供应商

请参阅[开发者指南：记忆供应商插件](/developer-guide/memory-provider-plugin)了解如何创建您自己的供应商。