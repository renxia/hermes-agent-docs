---
sidebar_position: 4
title: "记忆提供器"
description: "外部记忆提供器插件 — Honcho, OpenViking, Mem0, Hindsight, Holographic, RetainDB, ByteRover, Supermemory"
---

# 记忆提供器

Hermes 智能体附带 8 个外部记忆提供器插件，它们能为智能体提供超越内置 MEMORY.md 和 USER.md 的持久化、跨会话知识。同一时间只能激活 **一个** 外部提供器 —— 内置记忆会与其始终保持同时激活状态。

## 快速开始

```bash
hermes memory setup      # 交互式选择器 + 配置
hermes memory status     # 检查当前激活的提供器
hermes memory off        # 禁用外部提供器
```

您也可以通过 `hermes plugins` → 提供器插件 → 记忆提供器 来选择激活的记忆提供器。

或者在 `~/.hermes/config.yaml` 中手动设置：

```yaml
memory:
  provider: openviking   # 或 honcho, mem0, hindsight, holographic, retaindb, byterover, supermemory
```

## 工作原理

当记忆提供商处于活动状态时，Hermes 会自动：

1.  **注入提供商上下文**到系统提示中（提供商所知的内容）
2.  **预取相关记忆**在每轮对话之前（后台、非阻塞）
3.  **同步对话轮次**到提供商，在每次响应之后
4.  **在会话结束时提取记忆**（对于支持此功能的提供商）
5.  **将内置记忆写入**镜像到外部提供商
6.  **添加提供商特定的工具**，以便智能体可以搜索、存储和管理记忆

内置记忆（MEMORY.md / USER.md）继续像以前一样工作。外部提供商是附加的。

## 可用提供商

### Honcho

AI 原生的跨会话用户建模，具备辩证推理、会话范围上下文注入、语义搜索和持久化结论功能。基础上下文现在除了用户表征和对等卡片外，还包括会话摘要，让智能体能了解已经讨论过的内容。

| | |
|---|---|
| **最适用于** | 需要跨会话上下文、用户与智能体对齐的多智能体系统 |
| **要求** | `pip install honcho-ai` + [API 密钥](https://app.honcho.dev) 或自托管实例 |
| **数据存储** | Honcho 云或自托管 |
| **成本** | Honcho 定价（云）/ 免费（自托管） |

**工具（5 个）：** `honcho_profile`（读取/更新对等卡片），`honcho_search`（语义搜索），`honcho_context`（会话上下文——摘要、表征、卡片、消息），`honcho_reasoning`（LLM 合成），`honcho_conclude`（创建/删除结论）

**架构：** 两层上下文注入——基础层（会话摘要 + 表征 + 对等卡片，在 `contextCadence` 时刷新）加上辩证补充（LLM 推理，在 `dialecticCadence` 时刷新）。辩证会根据基础上下文是否存在，自动选择冷启动提示（一般用户事实）或暖启动提示（会话范围上下文）。

**三个正交配置旋钮**独立控制成本和深度：

-   `contextCadence` — 基础层刷新的频率（API 调用频率）
-   `dialecticCadence` — 辩证 LLM 触发的频率（LLM 调用频率）
-   `dialecticDepth` — 每次辩证调用的 `.chat()` 传递次数（1-3，推理深度）

**设置向导：**
```bash
hermes memory setup        # 选择 "honcho" — 运行 Honcho 特定的设置后配置
```

旧的 `hermes honcho setup` 命令仍然有效（现在重定向到 `hermes memory setup`），但只有在 Honcho 被选为活动记忆提供商后才会注册。

**配置：** `$HERMES_HOME/honcho.json`（配置文件本地）或 `~/.honcho/config.json`（全局）。解析顺序：`$HERMES_HOME/honcho.json` > `~/.hermes/honcho.json` > `~/.honcho/config.json`。参见 [配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md) 和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。

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
| `dialecticDepth` | `1` | 每次辩证调用的 `.chat()` 传递次数。限制为 1-3。第 0 次：冷/暖提示，第 1 次：自我审核，第 2 次：调和 |
| `dialecticDepthLevels` | `null` | 可选的每轮推理级别数组，例如 `["minimal", "low", "medium"]`。覆盖比例默认值 |
| `dialecticReasoningLevel` | `'low'` | 基础推理级别：`minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 当为 `true` 时，模型可通过工具参数在每次调用中覆盖推理级别 |
| `dialecticMaxChars` | `600` | 注入系统提示的辩证结果最大字符数 |
| `recallMode` | `'hybrid'` | `hybrid`（自动注入 + 工具），`context`（仅注入），`tools`（仅工具） |
| `writeFrequency` | `'async'` | 何时刷新消息：`async`（后台线程），`turn`（同步），`session`（结束时批量处理），或整数 N |
| `saveMessages` | `true` | 是否将消息持久化到 Honcho API |
| `observationMode` | `'directional'` | `directional`（全开）或 `unified`（共享池）。可通过 `observation` 对象覆盖 |
| `messageMaxChars` | `25000` | 每条消息的最大字符数（超出则分块） |
| `dialecticMaxInputChars` | `10000` | `peer.chat()` 辩证查询输入的最大字符数 |
| `sessionStrategy` | `'per-directory'` | `per-directory`、`per-repo`、`per-session`、`global` |

</details>

<details>
<summary>最小 honcho.json（云）</summary>

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

Honcho 将对话建模为对等方交换消息——每个 Hermes 配置文件有一个用户对等方加一个 AI 对等方，它们共享一个工作区。工作区是共享环境：用户对等方在配置文件间是全局的，每个 AI 对等方都有自己的身份。每个 AI 对等方根据自己的观察建立独立的表征/卡片，因此 `coder` 配置文件保持以代码为中心，而 `writer` 配置文件面对同一个用户时保持编辑导向。

映射如下：

| 概念 | 含义 |
|---------|-----------|
| **工作区** | 共享环境。一个工作区下的所有 Hermes 配置文件看到相同的用户身份。 |
| **用户对等方** (`peerName`) | 人类。在工作区内的配置文件间共享。 |
| **AI 对等方** (`aiPeer`) | 每个 Hermes 配置文件一个。主键 `hermes` → 默认；其他使用 `hermes.<profile>`。 |
| **观察** | 控制 Honcho 从谁的消息中建模什么的每对等方开关。`directional`（默认，四个全开）或 `unified`（单一观察者池）。 |

### 新配置文件，新的 Honcho 对等方

```bash
hermes profile create coder --clone
```

`--clone` 会在 `honcho.json` 中创建一个 `hermes.coder` 主机块，其中 `aiPeer: "coder"`，共享 `workspace`，继承 `peerName`、`recallMode`、`writeFrequency`、`observation` 等。AI 对等方会在 Honcho 中预先创建，以便在第一条消息之前就存在。

### 现有配置文件，回填 Honcho 对等方

```bash
hermes honcho sync
```

扫描每个 Hermes 配置文件，为任何没有主机块的配置文件创建一个，从默认的 `hermes` 块继承设置，并预先创建新的 AI 对等方。幂等——跳过已有主机块的配置文件。

### 每配置文件观察

每个主机块可以独立覆盖观察配置。示例：一个代码导向的配置文件，其中 AI 对等方观察用户但不进行自我建模：

```json
"hermes.coder": {
  "aiPeer": "coder",
  "observation": {
    "user": { "observeMe": true, "observeOthers": true },
    "ai":   { "observeMe": false, "observeOthers": true }
  }
}
```

**观察开关（每个对等方一组）：**

| 开关 | 效果 |
|--------|--------|
| `observeMe` | Honcho 根据此对等方自身消息建立其表征 |
| `observeOthers` | 此对等方观察另一个对等方的消息（为跨对等方推理提供信息） |

通过 `observationMode` 设置的预设：

-   **`"directional"`**（默认）— 四个标志全开。完全相互观察；启用跨对等方辩证。
-   **`"unified"`** — 用户 `observeMe: true`，AI `observeOthers: true`，其余为 false。单一观察者池；AI 建模用户但不建模自身，用户对等方只进行自我建模。

通过 [Honcho 控制面板](https://app.honcho.dev) 设置的服务器端开关优先于本地默认值——在会话初始化时同步回来。

有关完整的观察参考，请参见 [Honcho 页面](./honcho.md#observation-directional-vs-unified)。

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

参见 [配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md) 和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。


---

### OpenViking

字节跳动旗下的火山引擎提供的上下文数据库，具备文件系统式知识层次结构、分层检索和自动将记忆提取为 6 个类别。

| | |
|---|---|
| **最适用于** | 具有结构化浏览的自托管知识管理 |
| **要求** | `pip install openviking` + 运行服务器 |
| **数据存储** | 自托管（本地或云） |
| **成本** | 免费（开源，AGPL-3.0） |

**工具：** `viking_search`（语义搜索），`viking_read`（分层：摘要/概览/全文），`viking_browse`（文件系统导航），`viking_remember`（存储事实），`viking_add_resource`（摄取 URL/文档）

**设置：**
```bash
# 首先启动 OpenViking 服务器
pip install openviking
openviking-server

# 然后配置 Hermes
hermes memory setup    # 选择 "openviking"
# 或手动：
hermes config set memory.provider openviking
echo "OPENVIKING_ENDPOINT=http://localhost:1933" >> ~/.hermes/.env
```

**关键特性：**
-   分层上下文加载：L0 (~100 令牌) → L1 (~2k) → L2 (全文)
-   在会话提交时自动提取记忆（个人资料、偏好、实体、事件、案例、模式）
-   `viking://` URI 方案用于分层知识浏览

---

### Mem0

服务器端 LLM 事实提取，支持语义搜索、重排序和自动去重。

| | |
|---|---|
| **最适用于** | 免手动的记忆管理 — Mem0 自动处理提取 |
| **要求** | `pip install mem0ai` + API 密钥 |
| **数据存储** | Mem0 云 |
| **成本** | Mem0 定价 |

**工具：** `mem0_profile`（所有已存记忆），`mem0_search`（语义搜索 + 重排序），`mem0_conclude`（存储逐字事实）

**设置：**
```bash
hermes memory setup    # 选择 "mem0"
# 或手动：
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

长期记忆，具备知识图谱、实体解析和多策略检索。`hindsight_reflect` 工具提供了其他提供商所没有的跨记忆综合功能。自动保留完整的对话轮次（包括工具调用），并支持会话级文档跟踪。

| | |
|---|---|
| **最适用于** | 基于知识图谱的召回和实体关系 |
| **要求** | 云：来自 [ui.hindsight.vectorize.io](https://ui.hindsight.vectorize.io) 的 API 密钥。本地：LLM API 密钥（OpenAI、Groq、OpenRouter 等） |
| **数据存储** | Hindsight 云或本地嵌入式 PostgreSQL |
| **成本** | Hindsight 定价（云）或免费（本地） |

**工具：** `hindsight_retain`（带实体提取的存储），`hindsight_recall`（多策略搜索），`hindsight_reflect`（跨记忆综合）

**设置：**
```bash
hermes memory setup    # 选择 "hindsight"
# 或手动：
hermes config set memory.provider hindsight
echo "HINDSIGHT_API_KEY=your-key" >> ~/.hermes/.env
```

设置向导会自动安装依赖项，并且只安装所选模式所需的内容（`hindsight-client` 用于云，`hindsight-all` 用于本地）。需要 `hindsight-client >= 0.4.22`（如果过时，会在会话开始时自动升级）。

**本地模式 UI：** `hindsight-embed -p hermes ui start`

**配置：** `$HERMES_HOME/hindsight/config.json`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `mode` | `cloud` | `cloud` 或 `local` |
| `bank_id` | `hermes` | 记忆库标识符 |
| `recall_budget` | `mid` | 召回彻底性：`low` / `mid` / `high` |
| `memory_mode` | `hybrid` | `hybrid`（上下文 + 工具），`context`（仅自动注入），`tools`（仅工具） |
| `auto_retain` | `true` | 自动保留对话轮次 |
| `auto_recall` | `true` | 每轮对话前自动召回记忆 |
| `retain_async` | `true` | 在服务器上异步处理保留操作 |
| `retain_context` | `conversation between Hermes Agent and the User` | 已保留记忆的上下文标签 |
| `retain_tags` | — | 应用于已保留记忆的默认标签；与每次调用的工具标签合并 |
| `retain_source` | — | 附加到已保留记忆的可选 `metadata.source` |
| `retain_user_prefix` | `User` | 自动保留的对话记录中用户发言前的标签 |
| `retain_assistant_prefix` | `Assistant` | 自动保留的对话记录中助手发言前的标签 |
| `recall_tags` | — | 用于召回过滤的标签 |

有关完整配置参考，请参见 [插件 README](https://github.com/NousResearch/hermes-agent/blob/main/plugins/memory/hindsight/README.md)。

---

### Holographic

本地 SQLite 事实存储，支持 FTS5 全文搜索、信任评分，以及用于组合代数查询的 HRR（全息简化表示）。

| | |
|---|---|
| **最适用于** | 纯本地记忆，具备高级检索功能，无外部依赖 |
| **要求** | 无（SQLite 始终可用）。NumPy 可选，用于 HRR 代数。 |
| **数据存储** | 本地 SQLite |
| **成本** | 免费 |

**工具：** `fact_store`（9 个操作：添加、搜索、探查、关联、推理、反驳、更新、移除、列表），`fact_feedback`（有帮助/无帮助评分，用于训练信任评分）

**设置：**
```bash
hermes memory setup    # 选择 "holographic"
# 或手动：
hermes config set memory.provider holographic
```

**配置：** `config.yaml` 中 `plugins.hermes-memory-store` 下

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `db_path` | `$HERMES_HOME/memory_store.db` | SQLite 数据库路径 |
| `auto_extract` | `false` | 会话结束时自动提取事实 |
| `default_trust` | `0.5` | 默认信任评分 (0.0–1.0) |

**独特能力：**
-   `probe` — 特定于实体的代数召回（关于某人/某物的所有事实）
-   `reason` — 跨多个实体的组合 AND 查询
-   `contradict` — 自动检测冲突事实
-   信任评分，带有不对称反馈（+0.05 有帮助 / -0.10 无帮助）

---

### RetainDB

云记忆 API，支持混合搜索（向量 + BM25 + 重排序）、7 种记忆类型和增量压缩。

| | |
|---|---|
| **最适用于** | 已经使用 RetainDB 基础设施的团队 |
| **要求** | RetainDB 账户 + API 密钥 |
| **数据存储** | RetainDB 云 |
| **成本** | 每月 20 美元 |

**工具：** `retaindb_profile`（用户资料），`retaindb_search`（语义搜索），`retaindb_context`（任务相关上下文），`retaindb_remember`（带类型 + 重要性的存储），`retaindb_forget`（删除记忆）

**设置：**
```bash
hermes memory setup    # 选择 "retaindb"
# 或手动：
hermes config set memory.provider retaindb
echo "RETAINDB_API_KEY=your-key" >> ~/.hermes/.env
```

---

### ByteRover

通过 `brv` CLI 实现持久化记忆——具有分层检索（模糊文本 → LLM 驱动搜索）的层次知识树。本地优先，可选云同步。

| | |
|---|---|
| **最适用于** | 希望拥有便携、本地优先记忆并具备 CLI 的开发者 |
| **要求** | ByteRover CLI (`npm install -g byterover-cli` 或 [安装脚本](https://byterover.dev)) |
| **数据存储** | 本地（默认）或 ByteRover 云（可选同步） |
| **成本** | 免费（本地）或 ByteRover 定价（云） |

**工具：** `brv_query`（搜索知识树），`brv_curate`（存储事实/决策/模式），`brv_status`（CLI 版本 + 树统计）

**设置：**
```bash
# 首先安装 CLI
curl -fsSL https://byterover.dev/install.sh | sh

# 然后配置 Hermes
hermes memory setup    # 选择 "byterover"
# 或手动：
hermes config set memory.provider byterover
```

**关键特性：**
-   自动预压缩提取（在上下文压缩丢弃见解之前保存它们）
-   知识树存储在 `$HERMES_HOME/byterover/`（配置文件范围）
-   SOC2 Type II 认证的云同步（可选）

---

### Supermemory

语义长期记忆，具备资料召回、语义搜索、显式记忆工具，以及通过 Supermemory 图形 API 在会话结束时进行对话摄取。

| | |
|---|---|
| **最适用于** | 具有用户画像和会话级图谱构建的语义召回 |
| **要求** | `pip install supermemory` + [API 密钥](https://supermemory.ai) |
| **数据存储** | Supermemory 云 |
| **成本** | Supermemory 定价 |

**工具：** `supermemory_store`（保存显式记忆），`supermemory_search`（语义相似度搜索），`supermemory_forget`（按 ID 或最佳匹配查询遗忘），`supermemory_profile`（持久化资料 + 近期上下文）

**设置：**
```bash
hermes memory setup    # 选择 "supermemory"
# 或手动：
hermes config set memory.provider supermemory
echo 'SUPERMEMORY_API_KEY=***' >> ~/.hermes/.env
```

**配置：** `$HERMES_HOME/supermemory.json`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `container_tag` | `hermes` | 用于搜索和写入的容器标签。支持 `{identity}` 模板以实现配置文件范围标签。 |
| `auto_recall` | `true` | 在对话轮次前注入相关记忆上下文 |
| `auto_capture` | `true` | 在每次响应后存储清理后的用户-助手对话轮次 |
| `max_recall_results` | `10` | 格式化为上下文的最大召回项数 |
| `profile_frequency` | `50` | 在首轮对话及每 N 轮后包含资料事实 |
| `capture_mode` | `all` | 默认跳过微小或琐碎的对话轮次 |
| `search_mode` | `hybrid` | 搜索模式：`hybrid`、`memories` 或 `documents` |
| `api_timeout` | `5.0` | SDK 和摄取请求的超时时间 |

**环境变量：** `SUPERMEMORY_API_KEY`（必需），`SUPERMEMORY_CONTAINER_TAG`（覆盖配置）。

**关键特性：**
-   自动上下文围栏——从已捕获的轮次中剥离召回的记忆，以防止递归记忆污染
-   会话结束时的对话摄取，用于更丰富的图谱级知识构建
-   在首轮对话及可配置间隔注入资料事实
-   琐碎消息过滤（跳过“好的”、“谢谢”等）
-   **配置文件范围容器** — 在 `container_tag` 中使用 `{identity}`（例如 `hermes-{identity}` → `hermes-coder`）以按 Hermes 配置文件隔离记忆
-   **多容器模式** — 启用 `enable_custom_container_tags` 并使用 `custom_containers` 列表，让智能体跨命名容器读写。自动操作（同步、预取）保留在主容器上。

<details>
<summary>多容器示例</summary>

```json
{
  "container_tag": "hermes",
  "enable_custom_container_tags": true,
  "custom_containers": ["project-alpha", "shared-knowledge"],
  "custom_container_instructions": "使用 project-alpha 存储编码上下文。"
}
```

</details>

**支持：** [Discord](https://supermemory.link/discord) · [support@supermemory.com](mailto:support@supermemory.com)

---

## 提供商对比

| 提供商 | 存储 | 成本 | 工具 | 依赖项 | 独特功能 |
|----------|---------|------|-------|-------------|----------------|
| **Honcho** | 云端 | 付费 | 5 | `honcho-ai` | 辩证法用户建模 + 会话级上下文 |
| **OpenViking** | 自托管 | 免费 | 5 | `openviking` + 服务器 | 文件系统层级 + 分层加载 |
| **Mem0** | 云端 | 付费 | 3 | `mem0ai` | 服务端大语言模型提取 |
| **Hindsight** | 云端/本地 | 免费/付费 | 3 | `hindsight-client` | 知识图谱 + 反思综合 |
| **Holographic** | 本地 | 免费 | 2 | 无 | HRR 代数 + 信任评分 |
| **RetainDB** | 云端 | 每月 $20 | 5 | `requests` | 增量压缩 |
| **ByteRover** | 本地/云端 | 免费/付费 | 3 | `brv` CLI | 预压缩提取 |
| **Supermemory** | 云端 | 付费 | 4 | `supermemory` | 上下文隔离 + 会话图谱摄入 + 多容器 |

## 配置文件隔离

每个提供商的数据基于[配置文件](/docs/user-guide/profiles)进行隔离：

- **本地存储提供商**（Holographic，ByteRover）使用 `$HERMES_HOME/` 路径，该路径因配置文件而异
- **配置文件提供商**（Honcho，Mem0，Hindsight，Supermemory）将配置存储在 `$HERMES_HOME/`，因此每个配置文件拥有自己的凭证
- **云端提供商**（RetainDB）自动推导基于配置文件的项目名称
- **环境变量提供商**（OpenViking）通过每个配置文件的 `.env` 文件进行配置

## 构建内存提供商

请参阅[开发者指南：内存提供商插件](/docs/developer-guide/memory-provider-plugin)了解如何创建自定义提供商。