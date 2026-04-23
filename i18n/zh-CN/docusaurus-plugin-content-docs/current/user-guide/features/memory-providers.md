---
sidebar_position: 4
title: "记忆提供者"
description: "外部记忆提供者插件 — Honcho、OpenViking、Mem0、Hindsight、Holographic、RetainDB、ByteRover、Supermemory"
---

# 记忆提供者

Hermes 智能体默认附带 8 个外部记忆提供者插件，可为智能体提供超出内置 MEMORY.md 和 USER.md 的持久化、跨会话知识。**同一时间只能启用一个**外部提供者 —— 内置记忆始终与其并行生效。

## 快速开始

```bash
hermes memory setup      # 交互式选择器 + 配置
hermes memory status     # 查看当前启用的提供者
hermes memory off        # 禁用外部提供者
```

你也可以通过 `hermes plugins` → 提供者插件 → 记忆提供者 来选择当前启用的记忆提供者。

或在 `~/.hermes/config.yaml` 中手动设置：

```yaml
memory:
  provider: openviking   # 或 honcho, mem0, hindsight, holographic, retaindb, byterover, supermemory
```

## 工作原理

当记忆提供者启用后，Hermes 会自动执行以下操作：

1. **将提供者上下文注入**系统提示（提供者已知的内容）
2. **在每轮对话前预取相关记忆**（后台非阻塞）
3. **在每轮响应后将对话轮次同步**至提供者
4. **在会话结束时提取记忆**（适用于支持的提供者）
5. **将内置记忆的写入镜像**至外部提供者
6. **添加提供者专用工具**，使智能体能够搜索、存储和管理记忆

内置记忆（MEMORY.md / USER.md）仍按原有方式工作。外部提供者为叠加式增强。

## 可用提供者

### Honcho

基于 AI 的跨会话用户建模，具备辩证推理、会话范围上下文注入、语义搜索和持久化结论能力。基础上下文现在包含会话摘要，以及用户表征和同行卡片，使智能体能够感知已讨论过的内容。

| | |
|---|---|
| **最适合** | 具有跨会话上下文的多个智能体系统、用户-智能体对齐 |
| **依赖** | `pip install honcho-ai` + [API 密钥](https://app.honcho.dev) 或自托管实例 |
| **数据存储** | Honcho 云或自托管 |
| **费用** | Honcho 定价（云）/ 免费（自托管） |

**工具（5 个）：** `honcho_profile`（读取/更新同行卡片）、`honcho_search`（语义搜索）、`honcho_context`（会话上下文 — 摘要、表征、卡片、消息）、`honcho_reasoning`（LLM 合成）、`honcho_conclude`（创建/删除结论）

**架构：** 双层上下文注入 —— 基础层（会话摘要 + 表征 + 同行卡片，按 `contextCadence` 刷新）加上辩证补充层（LLM 推理，按 `dialecticCadence` 刷新）。辩证层会根据基础上下文是否存在，自动选择冷启动提示（通用用户事实）或热提示（会话范围上下文）。

**三个正交配置旋钮**可独立控制成本与深度：

- `contextCadence` — 基础层刷新频率（API 调用频率）
- `dialecticCadence` — 辩证 LLM 触发频率（LLM 调用频率）
- `dialecticDepth` — 每次辩证调用中 `.chat()` 的轮次数（1–3，推理深度）

**设置向导：**
```bash
hermes honcho setup        #（旧命令）
# 或
hermes memory setup        # 选择 "honcho"
```

**配置：** `$HERMES_HOME/honcho.json`（仅限当前配置）或 `~/.honcho/config.json`（全局）。解析顺序：`$HERMES_HOME/honcho.json` > `~/.hermes/honcho.json` > `~/.honcho/config.json`。请参阅[配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md)和[Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。

<details>
<summary>完整配置参考</summary>

| 键 | 默认值 | 说明 |
|-----|---------|-------------|
| `apiKey` | -- | 来自 [app.honcho.dev](https://app.honcho.dev) 的 API 密钥 |
| `baseUrl` | -- | 自托管 Honcho 的基础 URL |
| `peerName` | -- | 用户同行身份 |
| `aiPeer` | 主机密钥 | AI 同行身份（每个配置一个） |
| `workspace` | 主机密钥 | 共享工作空间 ID |
| `contextTokens` | `null`（无限制） | 每轮自动注入上下文的令牌预算。按词边界截断 |
| `contextCadence` | `1` | `context()` API 调用之间的最小轮次数（基础层刷新） |
| `dialecticCadence` | `2` | `peer.chat()` LLM 调用之间的最小轮次数。建议 1–5。仅适用于 `hybrid`/`context` 模式 |
| `dialecticDepth` | `1` | 每次辩证调用中 `.chat()` 的轮次数。限制为 1–3。第 0 轮：冷/热提示，第 1 轮：自我审计，第 2 轮：调和 |
| `dialecticDepthLevels` | `null` | 每轮推理级别的可选数组，例如 `["minimal", "low", "medium"]`。覆盖比例默认值 |
| `dialecticReasoningLevel` | `'low'` | 基础推理级别：`minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 当为 `true` 时，模型可通过工具参数覆盖每轮调用的推理级别 |
| `dialecticMaxChars` | `600` | 注入系统提示的辩证结果最大字符数 |
| `recallMode` | `'hybrid'` | `hybrid`（自动注入 + 工具）、`context`（仅注入）、`tools`（仅工具） |
| `writeFrequency` | `'async'` | 何时刷新消息：`async`（后台线程）、`turn`（同步）、`session`（结束时批量处理）或整数 N |
| `saveMessages` | `true` | 是否将消息持久化到 Honcho API |
| `observationMode` | `'directional'` | `directional`（全部开启）或 `unified`（共享池）。可通过 `observation` 对象覆盖 |
| `messageMaxChars` | `25000` | 每条消息的最大字符数（超出时分块） |
| `dialecticMaxInputChars` | `10000` | 辩证查询输入到 `peer.chat()` 的最大字符数 |
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
如果你之前使用过 `hermes honcho setup`，你的配置和所有服务端数据均保持不变。只需通过设置向导重新启用，或手动设置 `memory.provider: honcho` 即可通过新系统重新激活。
:::

**多同行设置：**

Honcho 将对话建模为同行间交换消息 —— 每个 Hermes 配置包含一个用户同行和一个 AI 同行，所有同行共享一个工作空间。工作空间是共享环境：用户同行在配置间全局共享，每个 AI 同行拥有独立身份。每个 AI 同行基于自身观察构建独立的表征/卡片，因此 `coder` 配置保持代码导向，而 `writer` 配置保持编辑导向，即使面对同一用户。

映射关系：

| 概念 | 含义 |
|---------|-----------|
| **工作空间** | 共享环境。同一工作空间下的所有 Hermes 配置看到相同的用户身份。 |
| **用户同行** (`peerName`) | 人类用户。在工作空间内的配置间共享。 |
| **AI 同行** (`aiPeer`) | 每个 Hermes 配置一个。主机密钥 `hermes` → 默认；`hermes.<profile>` 用于其他配置。 |
| **观察** | 每个同行的开关，控制 Honcho 从谁的消息中建模。`directional`（默认，全部开启）或 `unified`（单观察者池）。 |

### 新建配置，创建新的 Honcho 同行

```bash
hermes profile create coder --clone
```

`--clone` 会在 `honcho.json` 中创建一个 `hermes.coder` 主机块，包含 `aiPeer: "coder"`、共享 `workspace`、继承的 `peerName`、`recallMode`、`writeFrequency`、`observation` 等。AI 同行会在 Honcho 中预先创建，确保在首条消息前已存在。

### 现有配置，回填 Honcho 同行

```bash
hermes honcho sync
```

扫描每个 Hermes 配置，为缺少主机块的配置创建主机块，从默认 `hermes` 块继承设置，并预先创建新的 AI 同行。幂等操作 —— 跳过已有主机块的配置。

### 按配置独立观察

每个主机块可独立覆盖观察配置。例如：一个专注于代码的配置，其中 AI 同行观察用户但不进行自我建模：

```json
"hermes.coder": {
  "aiPeer": "coder",
  "observation": {
    "user": { "observeMe": true, "observeOthers": true },
    "ai":   { "observeMe": false, "observeOthers": true }
  }
}
```

**观察开关（每个同行一组）：**

| 开关 | 效果 |
|--------|--------|
| `observeMe` | Honcho 根据该同行自身的消息构建其表征 |
| `observeOthers` | 该同行观察另一同行的消息（用于跨同行推理） |

通过 `observationMode` 预设：

- **`"directional"`**（默认） — 全部四个标志开启。完全相互观察；启用跨同行辩证。
- **`"unified"`** — 用户 `observeMe: true`，AI `observeOthers: true`，其余为 false。单观察者池；AI 建模用户但不建模自身，用户同行仅自我建模。

通过 [Honcho 仪表板](https://app.honcho.dev) 设置的服务端开关优先级高于本地默认值 —— 在会话初始化时同步回本地。

请参阅 [Honcho 页面](./honcho.md#observation-directional-vs-unified) 获取完整的观察参考。

<details>
<summary>完整 honcho.json 示例（多配置）</summary>

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

请参阅[配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md)和[Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。

---

### OpenViking

由 Volcengine（字节跳动）提供的上下文数据库，具备类文件系统的知识层级结构、分层检索和自动记忆提取至 6 个类别的能力。

| | |
|---|---|
| **最适合** | 具有结构化浏览功能的自托管知识管理 |
| **依赖** | `pip install openviking` + 运行中的服务器 |
| **数据存储** | 自托管（本地或云） |
| **费用** | 免费（开源，AGPL-3.0） |

**工具：** `viking_search`（语义搜索）、`viking_read`（分层：摘要/概览/完整）、`viking_browse`（文件系统导航）、`viking_remember`（存储事实）、`viking_add_resource`（摄取 URL/文档）

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
- 分层上下文加载：L0（约 100 令牌）→ L1（约 2k）→ L2（完整）
- 会话提交时自动记忆提取（个人资料、偏好、实体、事件、案例、模式）
- `viking://` URI 方案用于层级知识浏览

---

### Mem0

服务端 LLM 事实提取，具备语义搜索、重排序和自动去重功能。

| | |
|---|---|
| **最适合** | 免手动记忆管理 — Mem0 自动处理提取 |
| **依赖** | `pip install mem0ai` + API 密钥 |
| **数据存储** | Mem0 云 |
| **费用** | Mem0 定价 |

**工具：** `mem0_profile`（所有存储的记忆）、`mem0_search`（语义搜索 + 重排序）、`mem0_conclude`（存储逐字事实）

**设置：**
```bash
hermes memory setup    # 选择 "mem0"
# 或手动：
hermes config set memory.provider mem0
echo "MEM0_API_KEY=your-key" >> ~/.hermes/.env
```

**配置：** `$HERMES_HOME/mem0.json`

| 键 | 默认值 | 说明 |
|-----|---------|-------------|
| `user_id` | `hermes-user` | 用户标识符 |
| `agent_id` | `hermes` | 智能体标识符 |

---

### Hindsight

具备知识图谱、实体解析和多策略检索能力的长期记忆。`hindsight_reflect` 工具提供其他提供者无法实现的跨记忆合成。自动保留完整对话轮次（包括工具调用）并具备会话级文档跟踪。

| | |
|---|---|
| **最适合** | 基于知识图谱的回忆与实体关系 |
| **依赖** | 云：来自 [ui.hindsight.vectorize.io](https://ui.hindsight.vectorize.io) 的 API 密钥。本地：LLM API 密钥（OpenAI、Groq、OpenRouter 等） |
| **数据存储** | Hindsight 云或本地嵌入式 PostgreSQL |
| **费用** | Hindsight 定价（云）或免费（本地） |

**工具：** `hindsight_retain`（带实体提取的存储）、`hindsight_recall`（多策略搜索）、`hindsight_reflect`（跨记忆合成）

**设置：**
```bash
hermes memory setup    # 选择 "hindsight"
# 或手动：
hermes config set memory.provider hindsight
echo "HINDSIGHT_API_KEY=your-key" >> ~/.hermes/.env
```

设置向导会自动安装依赖，并仅安装所选模式所需的组件（云模式安装 `hindsight-client`，本地模式安装 `hindsight-all`）。要求 `hindsight-client >= 0.4.22`（如果过时，会在会话启动时自动升级）。

**本地模式 UI：** `hindsight-embed -p hermes ui start`

**配置：** `$HERMES_HOME/hindsight/config.json`

| 键 | 默认值 | 说明 |
|-----|---------|-------------|
| `mode` | `cloud` | `cloud` 或 `local` |
| `bank_id` | `hermes` | 记忆库标识符 |
| `recall_budget` | `mid` | 回忆彻底性：`low` / `mid` / `high` |
| `memory_mode` | `hybrid` | `hybrid`（上下文 + 工具）、`context`（仅自动注入）、`tools`（仅工具） |
| `auto_retain` | `true` | 自动保留对话轮次 |
| `auto_recall` | `true` | 在每轮前自动回忆记忆 |
| `retain_async` | `true` | 在服务端异步处理保留 |
| `retain_context` | `conversation between Hermes Agent and the User` | 保留记忆的上下文标签 |
| `retain_tags` | — | 应用于保留记忆的默认标签；与每轮工具标签合并 |
| `retain_source` | — | 可选的 `metadata.source` 附加到保留记忆 |
| `retain_user_prefix` | `User` | 在自动保留的对话记录中用户轮次前使用的标签 |
| `retain_assistant_prefix` | `Assistant` | 在自动保留的对话记录中助手轮次前使用的标签 |
| `recall_tags` | — | 回忆时用于过滤的标签 |

请参阅[插件 README](https://github.com/NousResearch/hermes-agent/blob/main/plugins/memory/hindsight/README.md) 获取完整配置参考。

---

### Holographic

本地 SQLite 事实存储，具备 FTS5 全文搜索、信任评分和 HRR（全息缩减表示）以支持组合代数查询。

| | |
|---|---|
| **最适合** | 仅本地记忆，具备高级检索能力，无外部依赖 |
| **依赖** | 无（SQLite 始终可用）。HRR 代数可选 NumPy。 |
| **数据存储** | 本地 SQLite |
| **费用** | 免费 |

**工具：** `fact_store`（9 个操作：添加、搜索、探测、相关、推理、矛盾、更新、删除、列表）、`fact_feedback`（有帮助/无帮助评分，用于训练信任分数）

**设置：**
```bash
hermes memory setup    # 选择 "holographic"
# 或手动：
hermes config set memory.provider holographic
```

**配置：** `config.yaml` 中的 `plugins.hermes-memory-store`

| 键 | 默认值 | 说明 |
|-----|---------|-------------|
| `db_path` | `$HERMES_HOME/memory_store.db` | SQLite 数据库路径 |
| `auto_extract` | `false` | 会话结束时自动提取事实 |
| `default_trust` | `0.5` | 默认信任分数（0.0–1.0） |

**独特能力：**
- `probe` — 针对特定实体的代数回忆（关于某人或某物的所有事实）
- `reason` — 跨多个实体的组合 AND 查询
- `contradict` — 自动检测冲突事实
- 信任评分与不对称反馈（+0.05 有帮助 / -0.10 无帮助）

---

### RetainDB

具备混合搜索（向量 + BM25 + 重排序）、7 种记忆类型和增量压缩功能的云记忆 API。

| | |
|---|---|
| **最适合** | 已在使用 RetainDB 基础设施的团队 |
| **依赖** | RetainDB 账户 + API 密钥 |
| **数据存储** | RetainDB 云 |
| **费用** | $20/月 |

**工具：** `retaindb_profile`（用户资料）、`retaindb_search`（语义搜索）、`retaindb_context`（任务相关上下文）、`retaindb_remember`（带类型和重要性存储）、`retaindb_forget`（删除记忆）

**设置：**
```bash
hermes memory setup    # 选择 "retaindb"
# 或手动：
hermes config set memory.provider retaindb
echo "RETAINDB_API_KEY=your-key" >> ~/.hermes/.env
```

---

### ByteRover

通过 `brv` CLI 实现持久化记忆 —— 具备分层检索（模糊文本 → LLM 驱动搜索）的层级知识树。本地优先，可选云同步。

| | |
|---|---|
| **最适合** | 希望使用 CLI 实现便携、本地优先记忆的开发者 |
| **依赖** | ByteRover CLI（`npm install -g byterover-cli` 或 [安装脚本](https://byterover.dev)） |
| **数据存储** | 本地（默认）或 ByteRover 云（可选同步） |
| **费用** | 免费（本地）或 ByteRover 定价（云） |

**工具：** `brv_query`（搜索知识树）、`brv_curate`（存储事实/决策/模式）、`brv_status`（CLI 版本 + 树统计）

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
- 自动预压缩提取（在上下文压缩丢弃洞察前保存）
- 知识树存储在 `$HERMES_HOME/byterover/`（按配置隔离）
- SOC2 Type II 认证的云同步（可选）

---

### Supermemory

具备配置回忆、语义搜索、显式记忆工具和通过 Supermemory 图谱 API 在会话结束时摄取对话的语义长期记忆。

| | |
|---|---|
| **最适合** | 具备用户画像和会话级图谱构建的语义回忆 |
| **依赖** | `pip install supermemory` + [API 密钥](https://supermemory.ai) |
| **数据存储** | Supermemory 云 |
| **费用** | Supermemory 定价 |

**工具：** `supermemory_store`（保存显式记忆）、`supermemory_search`（语义相似性搜索）、`supermemory_forget`（按 ID 或最佳匹配查询遗忘）、`supermemory_profile`（持久化画像 + 近期上下文）

**设置：**
```bash
hermes memory setup    # 选择 "supermemory"
# 或手动：
hermes config set memory.provider supermemory
echo 'SUPERMEMORY_API_KEY=***' >> ~/.hermes/.env
```

**配置：** `$HERMES_HOME/supermemory.json`

| 键 | 默认值 | 说明 |
|-----|---------|-------------|
| `container_tag` | `hermes` | 用于搜索和写入的容器标签。支持 `{identity}` 模板以实现按配置隔离的标签。 |
| `auto_recall` | `true` | 在每轮前注入相关记忆上下文 |
| `auto_capture` | `true` | 在每轮响应后存储清理后的用户-助手轮次 |
| `max_recall_results` | `10` | 格式化为上下文的最大回忆项数 |
| `profile_frequency` | `50` | 在首轮和每 N 轮包含画像事实 |
| `capture_mode` | `all` | 默认跳过微小或琐碎轮次 |
| `search_mode` | `hybrid` | 搜索模式：`hybrid`、`memories` 或 `documents` |
| `api_timeout` | `5.0` | SDK 和摄取请求的超时时间 |

**环境变量：** `SUPERMEMORY_API_KEY`（必需）、`SUPERMEMORY_CONTAINER_TAG`（覆盖配置）。

**关键特性：**
- 自动上下文围栏 — 从捕获的轮次中剥离回忆的记忆，防止递归记忆污染
- 会话结束时的对话摄取，以构建更丰富的图谱级知识
- 画像事实在首轮和可配置间隔注入
- 琐碎消息过滤（跳过“ok”、“thanks”等）
- **按配置隔离的容器** — 在 `container_tag` 中使用 `{identity}`（例如 `hermes-{identity}` → `hermes-coder`）以隔离每个 Hermes 配置的记忆
- **多容器模式** — 启用 `enable_custom_container_tags` 并配合 `custom_containers` 列表，允许智能体跨命名容器读写。自动操作（同步、预取）仍保留在主容器上。

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

## 提供者对比

| 提供者 | 存储 | 费用 | 工具 | 依赖 | 独特特性 |
|----------|---------|------|-------|-------------|----------------|
| **Honcho** | 云 | 付费 | 5 | `honcho-ai` | 辩证用户建模 + 会话范围上下文 |
| **OpenViking** | 自托管 | 免费 | 5 | `openviking` + 服务器 | 文件系统层级 + 分层加载 |
| **Mem0** | 云 | 付费 | 3 | `mem0ai` | 服务端 LLM 提取 |
| **Hindsight** | 云/本地 | 免费/付费 | 3 | `hindsight-client` | 知识图谱 + 反思合成 |
| **Holographic** | 本地 | 免费 | 2 | 无 | HRR 代数 + 信任评分 |
| **RetainDB** | 云 | $20/月 | 5 | `requests` | 增量压缩 |
| **ByteRover** | 本地/云 | 免费/付费 | 3 | `brv` CLI | 预压缩提取 |
| **Supermemory** | 云 | 付费 | 4 | `supermemory` | 上下文围栏 + 会话图谱摄取 + 多容器 |

## 配置隔离

每个提供者的数据均按[配置](/docs/user-guide/profiles)隔离：

- **本地存储提供者**（Holographic、ByteRover）使用 `$HERMES_HOME/` 路径，不同配置路径不同
- **配置文件提供者**（Honcho、Mem0、Hindsight、Supermemory）将配置存储在 `$HERMES_HOME/`，因此每个配置拥有独立的凭据
- **云提供者**（RetainDB）自动派生按配置隔离的项目名称
- **环境变量提供者**（OpenViking）通过每个配置的 `.env` 文件配置

## 构建记忆提供者

请参阅[开发者指南：记忆提供者插件](/docs/developer-guide/memory-provider-plugin)了解如何创建你自己的记忆提供者。