---
sidebar_position: 12
sidebar_label: "内置插件"
title: "内置插件"
description: "随 Hermes 智能体一同发布、通过生命周期钩子自动运行的插件——例如磁盘清理等"
---

# 内置插件

Hermes 附带了一小组与代码仓库捆绑的插件。它们位于 `<repo>/plugins/<name>/` 目录下，并与用户安装在 `~/.hermes/plugins/` 中的插件一同自动加载。它们使用与第三方插件相同的插件接口——钩子、工具、斜杠命令——只是在代码仓库内进行维护。

关于通用插件系统，请参阅 [插件](/docs/user-guide/features/plugins) 页面；关于如何编写自己的插件，请参阅 [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)。

## 发现机制如何运作

`PluginManager` 会按顺序扫描四个来源：

1. **捆绑的** — `<repo>/plugins/<name>/` （本文档记录的内容）
2. **用户的** — `~/.hermes/plugins/<name>/`
3. **项目的** — `./.hermes/plugins/<name>/` （需要设置 `HERMES_ENABLE_PROJECT_PLUGINS=1`）
4. **Pip 入口点** — `hermes_agent.plugins`

当名称冲突时，后面的来源会覆盖前面的——一个名为 `disk-cleanup` 的用户插件将会取代捆绑的那个。

`plugins/memory/` 和 `plugins/context_engine/` 目录被有意排除在捆绑扫描之外。这些目录使用它们自己的发现路径，因为记忆提供者和上下文引擎是通过 `hermes memory setup` 或配置中的 `context.engine` 设置的单一选择提供者。

## 捆绑插件是可选启用的

捆绑插件默认禁用。发现功能会找到它们（它们会出现在 `hermes plugins list` 和交互式 `hermes plugins` UI 中），但在你明确启用之前不会加载：

```bash
hermes plugins enable disk-cleanup
```

或通过 `~/.hermes/config.yaml`：

```yaml
plugins:
  enabled:
    - disk-cleanup
```

这与用户安装的插件使用的机制相同。捆绑插件永远不会自动启用——无论是全新安装还是现有用户升级到新版本的 Hermes。你始终需要明确选择启用。

要再次关闭捆绑插件：

```bash
hermes plugins disable disk-cleanup
# 或：从 config.yaml 的 plugins.enabled 中移除
```

## 当前发布

仓库在 `plugins/` 下发布这些捆绑插件。所有都是可选的——通过 `hermes plugins enable <name>` 启用。

| 插件 | 类型 | 用途 |
|---|---|---|
| `disk-cleanup` | 钩子 + 斜杠命令 | 自动跟踪临时文件并在会话结束时清理 |
| `observability/langfuse` | 钩子 | 将轮次 / LLM 调用 / 工具调用追踪到 [Langfuse](https://langfuse.com) |
| `spotify` | 后端（7 个工具） | 原生 Spotify 播放、队列、搜索、播放列表、专辑、媒体库 |
| `google_meet` | 独立插件 | 加入 Meet 通话、实时字幕转录、可选实时双工音频 |
| `image_gen/openai` | 图像后端 | OpenAI `gpt-image-2` 图像生成后端（FAL 的替代方案） |
| `image_gen/openai-codex` | 图像后端 | 通过 Codex OAuth 使用 OpenAI 图像生成 |
| `image_gen/xai` | 图像后端 | xAI `grok-2-image` 后端 |
| `hermes-achievements` | 仪表盘标签页 | 基于你真实 Hermes 会话历史生成的 Steam 风格可收集徽章 |
| `kanban/dashboard` | 仪表盘标签页 | 用于多智能体调度器的看板板 UI——任务、评论、扇出、看板切换。参见 [Kanban 多智能体](./kanban.md)。 |

内存提供器（`plugins/memory/*`）和上下文引擎（`plugins/context_engine/*`）在[内存提供器](./memory-providers.md)页面单独列出——它们分别通过 `hermes memory` 和 `hermes plugins` 管理。以下是两个基于钩子的长期运行插件的完整详细信息。

### disk-cleanup

自动跟踪并移除会话期间创建的临时文件——测试脚本、临时输出、cron 日志、过期的 Chrome 配置文件——无需智能体记得调用工具。

**工作原理：**

| 钩子 | 行为 |
|---|---|
| `post_tool_call` | 当 `write_file` / `terminal` / `patch` 在 `HERMES_HOME` 或 `/tmp/hermes-*` 内创建匹配 `test_*`、`tmp_*` 或 `*.test.*` 的文件时，将其静默标记为 `test` / `temp` / `cron-output`。 |
| `on_session_end` | 如果本轮有任何测试文件被自动跟踪，运行安全的 `quick` 清理并记录一行摘要。否则保持静默。 |

**删除规则：**

| 类别 | 阈值 | 确认 |
|---|---|---|
| `test` | 每次会话结束 | 从不 |
| `temp` | 跟踪后超过 7 天 | 从不 |
| `cron-output` | 跟踪后超过 14 天 | 从不 |
| HERMES_HOME 下的空目录 | 始终 | 从不 |
| `research` | 超过 30 天，且超过 10 个最新项 | 始终（仅深度清理） |
| `chrome-profile` | 跟踪后超过 14 天 | 始终（仅深度清理） |
| 超过 500 MB 的文件 | 从不自动 | 始终（仅深度清理） |

**斜杠命令** — `/disk-cleanup` 在 CLI 和网关会话中均可用：

```
/disk-cleanup status                     # 细分 + 前 10 大文件
/disk-cleanup dry-run                    # 预览但不删除
/disk-cleanup quick                      # 立即运行安全清理
/disk-cleanup deep                       # quick + 列出需要确认的项
/disk-cleanup track <path> <category>    # 手动跟踪
/disk-cleanup forget <path>              # 停止跟踪（不删除）
```

**状态** — 所有数据保存在 `$HERMES_HOME/disk-cleanup/`：

| 文件 | 内容 |
|---|---|
| `tracked.json` | 带有类别、大小和时间戳的跟踪路径 |
| `tracked.json.bak` | 上述文件的原子写入备份 |
| `cleanup.log` | 每次跟踪 / 跳过 / 拒绝 / 删除的追加式审计日志 |

**安全性** — 清理只涉及 `HERMES_HOME` 或 `/tmp/hermes-*` 下的路径。Windows 挂载点（`/mnt/c/...`）会被拒绝。知名的一级状态目录（`logs/`、`memories/`、`sessions/`、`cron/`、`cache/`、`skills/`、`plugins/`、`disk-cleanup/` 本身）即使为空也永远不会被删除——全新安装不会在首次会话结束时被掏空。

**启用：** `hermes plugins enable disk-cleanup`（或在 `hermes plugins` 中勾选复选框）。

**再次禁用：** `hermes plugins disable disk-cleanup`。

### observability/langfuse

将 Hermes 的轮次、LLM 调用和工具调用追踪到 [Langfuse](https://langfuse.com)——一个开源的 LLM 可观测性平台。每轮一个 span，每次 API 调用一个 generation，每次工具调用一个 tool observation。使用量总计、按类型 token 计数和成本估算来自 Hermes 的规范 `agent.usage_pricing` 数字，因此 Langfuse 仪表盘看到的细分（输入 / 输出 / `cache_read_input_tokens` / `cache_creation_input_tokens` / `reasoning_tokens`）与 `hermes logs` 中显示的一致。

该插件采用失败开放策略：没有安装 SDK、没有凭证或 Langfuse 暂时错误——所有情况都会在钩子中静默变成无操作。智能体循环永远不会受到影响。

**设置（交互式——推荐）：**

```bash
hermes tools          # → Langfuse Observability → Cloud or Self-Hosted
```

向导会收集你的密钥，`pip install` 安装 `langfuse` SDK，并为你将 `observability/langfuse` 添加到 `plugins.enabled`。重启 Hermes，下一轮就会发送追踪。

**设置（手动）：**

```bash
pip install langfuse
hermes plugins enable observability/langfuse
```

然后将凭证放入 `~/.hermes/.env`：

```bash
HERMES_LANGFUSE_PUBLIC_KEY=pk-lf-...
HERMES_LANGFUSE_SECRET_KEY=sk-lf-...
HERMES_LANGFUSE_BASE_URL=https://cloud.langfuse.com   # 或你的自托管 URL
```

**工作原理：**

| 钩子 | 行为 |
|---|---|
| `pre_api_request` / `pre_llm_call` | 打开（或重用）一个每轮的根 span "Hermes turn"。为此 API 调用启动一个 `generation` 子观察，将序列化的最近消息作为输入。 |
| `post_api_request` / `post_llm_call` | 关闭 generation，附加 `usage_details`、`cost_details`、`finish_reason`、助手输出 + 工具调用。如果没有工具调用且内容非空，则关闭该轮。 |
| `pre_tool_call` | 启动一个带有清理后 `args` 的 `tool` 子观察。 |
| `post_tool_call` | 使用清理后的 `result` 关闭 tool 观察。`read_file` 的内容会被摘要（头 + 尾 + 省略行数），使大文件读取保持在 `HERMES_LANGFUSE_MAX_CHARS` 以下。 |

会话分组通过 `langfuse.propagate_attributes` 基于 Hermes 会话 ID（或子智能体的任务 ID），因此单个 `hermes chat` 会话中的所有内容都位于一个 Langfuse 会话下。

**验证：**

```bash
hermes plugins list                 # observability/langfuse 应显示 "enabled"
hermes chat -q "hello"              # 在 Langfuse UI 中检查是否有 "Hermes turn" 追踪
```

**可选调优**（在 `.env` 中）：

| 变量 | 默认值 | 用途 |
|---|---|---|
| `HERMES_LANGFUSE_ENV` | — | 追踪的环境标签（`production`、`staging`、…） |
| `HERMES_LANGFUSE_RELEASE` | — | 发布/版本标签 |
| `HERMES_LANGFUSE_SAMPLE_RATE` | `1.0` | 传递给 SDK 的采样率（0.0–1.0） |
| `HERMES_LANGFUSE_MAX_CHARS` | `12000` | 消息内容 / 工具参数 / 工具结果的每字段截断 |
| `HERMES_LANGFUSE_DEBUG` | `false` | 详细插件日志输出到 `agent.log` |

Hermes 前缀和标准 SDK 环境变量（`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`、`LANGFUSE_BASE_URL`）都可接受——当两者都设置时，Hermes 前缀的优先。

**性能：** Langfuse 客户端在首次钩子调用后被缓存。如果凭证或 SDK 缺失，该决策也会被缓存——后续钩子会快速返回，无需重新检查环境变量或重新加载配置。

**禁用：** `hermes plugins disable observability/langfuse`。插件模块仍会被发现，但在你重新启用之前不会运行任何模块代码。

### google_meet

让智能体**加入、转录并参与 Google Meet 通话**——对会议做笔记、会后总结讨论内容、跟进具体事项，以及（可选地）通过 TTS 在通话中语音回复。

**它提供了什么：**

- 一个使用浏览器自动化加入 Meet URL 的无头虚拟参与者
- 通过配置的 STT 提供商实时转录会议音频
- 一组 `meet_summarize` / `meet_speak` / `meet_followup` 工具集，智能体调用它们来基于听到的内容采取行动
- 会后产物（转录稿、说话者归属的笔记、行动项）保存在 `~/.hermes/cache/google_meet/<meeting_id>/`

**设置：**

```bash
hermes plugins enable google_meet
# 首次使用时提示你通过插件的 OAuth 流程登录——
# 需要一个具有 Meet 访问权限的 Google 账户。如果会议设置了
# "仅受邀参与者可加入"，可能需要主持人批准。
```

从聊天中使用：

> "加入 meet.google.com/abc-defg-hij 并做笔记。通话结束后，给我发送一份包含行动项的摘要。"

智能体启动会议加入，随着通话进行将转录内容流式传回其上下文，并在会议结束时（或你告诉它停止时）生成结构化摘要。

**何时使用：** 你希望有机器人为异步参与者转录和总结的定期站立会；你希望有结构化笔记的证词式访谈；任何你原本需要 Fireflies / Otter / Grain 的场景。当你不想让 AI 在旁听时——不要启用它。

**禁用：** `hermes plugins disable google_meet`。所有缓存的转录稿和录制内容保留在 `~/.hermes/cache/google_meet/` 中，直到你手动删除。

### hermes-achievements

在仪表盘中添加一个 **Steam 风格的成就标签页** ——基于你真实 Hermes 会话历史生成的 60+ 个可收集、分层徽章。工具链成就、调试模式、氛围编程连续记录、技能/内存使用、模型/提供商多样性、生活习惯（周末和深夜会话）。最初由 [@PCinkusz](https://github.com/PCinkuskusz) 作为外部插件编写；移入仓库以保持与 Hermes 功能变更同步。

**工作原理：**

- 在仪表盘后端扫描你整个 `~/.hermes/state.db` 会话历史
- 每个会话的统计信息按 `(started_at, last_active)` 指纹缓存，因此只有新的或变更的会话在后续扫描时重新分析
- 首次扫描在后台线程中运行——仪表盘永远不会等待它阻塞，即使有数千个会话的数据库
- 解锁状态持久化到 `$HERMES_HOME/plugins/hermes-achievements/state.json`

**等级进阶：** 铜 → 银 → 金 → 钻石 → 奥林匹亚。每张卡片都展示一个"计入条件"部分，列出正在跟踪的确切指标。

**成就状态：**

| 状态 | 含义 |
|---|---|
| 已解锁 | 至少达成一个等级 |
| 已发现 | 已知成就，进度可见，尚未获得 |
| 秘密 | 隐藏，直到 Hermes 在你的历史记录中检测到第一个相关信号 |

**API** — 路由挂载在 `/api/plugins/hermes-achievements/` 下：

| 端点 | 用途 |
|---|---|
| `GET /achievements` | 带有每枚徽章解锁状态的完整目录（首次冷扫描运行时返回待处理占位符） |
| `GET /scan-status` | 后台扫描器状态：`idle` / `running` / `failed`、上次耗时、运行次数 |
| `GET /recent-unlocks` | 最近解锁的 20 枚徽章，最新的在前 |
| `GET /sessions/{id}/badges` | 主要在一个特定会话中获得的徽章 |
| `POST /rescan` | 手动同步重新扫描（阻塞；用于用户点击重新扫描按钮时） |
| `POST /reset-state` | 清除解锁历史和缓存快照 |

**状态文件** — 位于 `$HERMES_HOME/plugins/hermes-achievements/` 下：

| 文件 | 内容 |
|---|---|
| `state.json` | 解锁历史：你已获得的徽章及获得时间。跨 Hermes 更新稳定保持。 |
| `scan_snapshot.json` | 上次完成的扫描载荷（仪表盘加载时立即提供） |
| `scan_checkpoint.json` | 按指纹键控的每会话统计缓存（使热重新扫描快速完成） |

**性能说明：**

- 对约 8,000 个会话的冷扫描需要几分钟。它在首次仪表盘请求时在后台线程中运行；UI 看到待处理占位符并轮询 `/scan-status`。
- **冷扫描期间的增量结果** ——扫描器每约 250 个会话发布一次部分快照，因此每次仪表盘刷新都会显示随着扫描进行解锁的更多徽章。不会出现盯着零的漫长等待。
- 热重新扫描对每个 `started_at` + `last_active` 指纹与检查点匹配的会话重用统计——即使在大型历史上也能在几秒内完成。
- 内存快照 TTL 为 120 秒；过期请求立即提供旧快照并启动后台刷新。你永远不会因为 TTL 过期而等待加载。

**启用：** 无需启用——`hermes-achievements` 是一个仅仪表盘插件（没有生命周期钩子，没有模型可见的工具）。它在首次启动时自动在 `hermes dashboard` 中注册为标签页。`plugins.enabled` 配置只控制生命周期/工具插件；仪表盘插件纯粹通过其 `dashboard/manifest.json` 发现。

**选择退出：** 删除或重命名 `plugins/hermes-achievements/dashboard/manifest.json`，或在 `~/.hermes/plugins/hermes-achievements/` 中使用同名但不提供仪表盘的用户插件覆盖它。`$HERMES_HOME/plugins/hermes-achievements/` 下的插件状态文件会保留——重新安装会保留你的解锁历史。

## 添加捆绑插件

捆绑插件的编写方式与其他 Hermes 插件完全相同——请参阅 [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)。唯一的区别在于：

- 目录位于 `<repo>/plugins/<name>/`，而非 `~/.hermes/plugins/<name>/`
- 在 `hermes plugins list` 中，其清单来源显示为 `bundled`
- 同名的用户插件将覆盖捆绑版本

当插件满足以下条件时，适合作为捆绑插件：

- 无额外依赖（或其依赖已包含在 `pip install .[all]` 中）
- 其功能对大多数用户有益，且属于**可选择退出**而非**可选择加入**的特性
- 其逻辑涉及生命周期钩子（否则智能体必须自行调用）
- 它增强了核心功能，但不会扩展模型可见的工具表面

反例——应保留为用户可安装插件而非捆绑的类型：需要API密钥的第三方集成、小众工作流、大型依赖树，以及任何会默认显著改变智能体行为的内容。