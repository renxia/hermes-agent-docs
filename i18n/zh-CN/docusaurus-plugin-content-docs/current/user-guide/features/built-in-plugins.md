---
sidebar_position: 12
sidebar_label: "内置插件"
title: "内置插件"
description: "与 Hermes 智能体一同发布的插件，通过生命周期钩子自动运行——例如磁盘清理及相关功能"
---

# 内置插件

Hermes 附带了一组小型插件，与代码库一同发布。它们位于 `<repo>/plugins/<name>/` 目录下，并在 `~/.hermes/plugins/` 中随用户安装的插件一起自动加载。它们使用与第三方插件相同的插件接口——钩子、工具、斜杠命令——只是在代码树内进行维护。

请参阅[插件](/user-guide/features/plugins)页面了解通用插件系统，并阅读[构建 Hermes 插件](/guides/build-a-hermes-plugin)来编写你自己的插件。

## 发现机制如何运作

`PluginManager` 按顺序扫描四个来源：

1.  **内置** — `<repo>/plugins/<name>/`（本页文档所述内容）
2.  **用户** — `~/.hermes/plugins/<name>/`
3.  **项目** — `./.hermes/plugins/<name>/`（需要设置 `HERMES_ENABLE_PROJECT_PLUGINS=1`）
4.  **Pip 入口点** — `hermes_agent.plugins`

当名称冲突时，后面的来源优先——一个名为 `disk-cleanup` 的用户插件会替换掉内置插件。

`plugins/memory/` 和 `plugins/context_engine/` 目录被有意排除在内置扫描之外。这些目录使用它们自己的发现路径，因为内存提供者和上下文引擎是单选提供者，通过 `hermes memory setup` 或配置中的 `context.engine` 进行配置。

---
title: "捆绑插件"
description: "按需启用 Hermes 内置的捆绑插件，如磁盘清理、可观测性、Google Meet、成就系统等。"
slug: "bundled-plugins"
---

## 捆绑插件需按需启用

捆绑插件默认是禁用的。发现机制会找到它们（它们会出现在 `hermes plugins list` 和交互式的 `hermes plugins` 界面中），但没有一个会被加载，除非你显式启用它们：

```bash
hermes plugins enable disk-cleanup
```

或者通过 `~/.hermes/config.yaml`：

```yaml
plugins:
  enabled:
    - disk-cleanup
```

这与用户安装的插件使用的机制相同。捆绑插件永远不会自动启用——无论是全新安装，还是现有用户升级到新版 Hermes 时。你总是需要显式地选择启用。

要再次关闭一个捆绑插件：

```bash
hermes plugins disable disk-cleanup
# 或：从 config.yaml 的 plugins.enabled 中移除它
```

## 当前已发布插件

该仓库在 `plugins/` 下发布了这些捆绑插件。所有都是按需启用的——通过 `hermes plugins enable <name>` 来启用。

| 插件 | 类型 | 用途 |
|---|---|---|
| `disk-cleanup` | 钩子 + 斜杠命令 | 自动追踪临时文件，并在会话结束时清理 |
| `observability/langfuse` | 钩子 | 将对话轮次 / LLM 调用 / 工具调用追踪到 [Langfuse](https://langfuse.com) |
| `spotify` | 后端（7 个工具） | 原生 Spotify 播放、队列、搜索、播放列表、专辑、库 |
| `google_meet` | 独立插件 | 加入 Meet 通话、实时字幕转录、可选实时双向音频 |
| `image_gen/openai` | 图像后端 | OpenAI `gpt-image-2` 图像生成后端（FAL 的替代方案） |
| `image_gen/openai-codex` | 图像后端 | 通过 Codex OAuth 进行 OpenAI 图像生成 |
| `image_gen/xai` | 图像后端 | xAI `grok-2-image` 后端 |
| `hermes-achievements` | 仪表板标签页 | 根据你的真实 Hermes 会话历史生成的 Steam 风格可收集徽章 |
| `kanban/dashboard` | 仪表板标签页 | 用于多智能体调度器的看板 UI——任务、评论、扇出、板切换。参见 [Kanban Multi-Agent](./kanban.md)。 |

内存提供程序 (`plugins/memory/*`) 和上下文引擎 (`plugins/context_engine/*`) 在 [Memory Providers](./memory-providers.md) 中单独列出——它们分别通过 `hermes memory` 和 `hermes plugins` 进行管理。以下将详细介绍这两个基于长期运行钩子的插件。

### disk-cleanup

自动追踪并移除会话期间创建的临时文件——测试脚本、临时输出、定时任务日志、过期的 Chrome 配置文件——无需智能体记得调用工具。

**工作原理：**

| 钩子 | 行为 |
|---|---|
| `post_tool_call` | 当 `write_file` / `terminal` / `patch` 在 `HERMES_HOME` 或 `/tmp/hermes-*` 内创建了匹配 `test_*`、`tmp_*` 或 `*.test.*` 的文件时，将其静默追踪为 `test` / `temp` / `cron-output` 类别。 |
| `on_session_end` | 如果本轮对话中自动追踪了任何测试文件，则运行安全的 `quick` 清理并记录一行摘要。否则保持静默。 |

**删除规则：**

| 类别 | 阈值 | 确认 |
|---|---|---|
| `test` | 每次会话结束时 | 从不 |
| `temp` | 追踪后超过 7 天 | 从不 |
| `cron-output` | 追踪后超过 14 天 | 从不 |
| HERMES_HOME 下的空目录 | 总是 | 从不 |
| `research` | 超过 30 天，且超出最新的 10 个 | 总是（仅深度清理） |
| `chrome-profile` | 追踪后超过 14 天 | 总是（仅深度清理） |
| 大于 500 MB 的文件 | 从不自动 | 总是（仅深度清理） |

**斜杠命令** — `/disk-cleanup` 在 CLI 和网关会话中均可用：

```
/disk-cleanup status                     # 分类明细 + 最大的 10 个文件
/disk-cleanup dry-run                    # 预览但不删除
/disk-cleanup quick                      # 立即运行安全清理
/disk-cleanup deep                       # quick + 列出需要确认的项目
/disk-cleanup track <path> <category>    # 手动追踪
/disk-cleanup forget <path>              # 停止追踪（不删除）
```

**状态** — 所有数据都保存在 `$HERMES_HOME/disk-cleanup/`：

| 文件 | 内容 |
|---|---|
| `tracked.json` | 带有类别、大小和时间戳的已追踪路径 |
| `tracked.json.bak` | 上述文件的原子写入备份 |
| `cleanup.log` | 每次追踪/跳过/拒绝/删除操作的仅追加审计日志 |

**安全性** — 清理操作只会触及 `HERMES_HOME` 或 `/tmp/hermes-*` 下的路径。Windows 挂载点（如 `/mnt/c/...`）会被拒绝。已知的顶级状态目录（`logs/`、`memories/`、`sessions/`、`cron/`、`cache/`、`skills/`、`plugins/`、`disk-cleanup/` 本身）即使为空也永远不会被删除——全新安装不会在第一次会话结束时被清空。

**启用：** `hermes plugins enable disk-cleanup`（或在 `hermes plugins` 中勾选复选框）。

**再次禁用：** `hermes plugins disable disk-cleanup`。

### observability/langfuse

将 Hermes 的对话轮次、LLM 调用和工具调用追踪到 [Langfuse](https://langfuse.com)——一个开源的 LLM 可观测性平台。每轮对话一个 span，每次 API 调用一个 generation，每次工具调用一个 tool 观测。使用量统计、按类型分的 token 计数和成本估算均来自 Hermes 规范的 `agent.usage_pricing` 数据，因此 Langfuse 仪表板看到的细分数据（输入/输出/`cache_read_input_tokens`/`cache_creation_input_tokens`/`reasoning_tokens`）与 `hermes logs` 中显示的相同。

该插件是 fail-open 的：未安装 SDK、没有凭据或 Langfuse 出现临时错误——所有情况在钩子中都会变成一个静默的无操作。智能体循环不会受到影响。

**设置：**

```bash
pip install langfuse
hermes plugins enable observability/langfuse
```

或在交互式 `hermes plugins` 界面中勾选复选框。然后在 `~/.hermes/.env` 中放入凭据：

```bash
HERMES_LANGFUSE_PUBLIC_KEY=pk-lf-...
HERMES_LANGFUSE_SECRET_KEY=sk-lf-...
HERMES_LANGFUSE_BASE_URL=https://cloud.langfuse.com   # 或你的自托管 URL
```

**工作原理：**

| 钩子 | 行为 |
|---|---|
| `pre_api_request` / `pre_llm_call` | 为每轮对话打开（或重用）一个根 span “Hermes turn”。为本次 API 调用启动一个 `generation` 子观测，将序列化的最近消息作为输入。 |
| `post_api_request` / `post_llm_call` | 关闭 generation，附加 `usage_details`、`cost_details`、`finish_reason`、助手输出和工具调用。如果没有工具调用且内容非空，则关闭该轮对话。 |
| `pre_tool_call` | 使用清理过的 `args` 启动一个 `tool` 子观测。 |
| `post_tool_call` | 使用清理过的 `result` 关闭 tool 观测。`read_file` 的有效载荷会被总结（头尾行+省略的行数），以便大型文件读取保持在 `HERMES_LANGFUSE_MAX_CHARS` 限制内。 |

会话分组通过 `langfuse.propagate_attributes` 基于 Hermes 会话 ID（或子智能体的任务 ID），因此单个 `hermes chat` 会话中的所有内容都位于同一个 Langfuse 会话下。

**验证：**

```bash
hermes plugins list                 # observability/langfuse 应显示 "enabled"
hermes chat -q "hello"              # 在 Langfuse UI 中检查是否有 "Hermes turn" 追踪
```

**可选调优**（在 `.env` 中）：

| 变量 | 默认值 | 用途 |
|---|---|---|
| `HERMES_LANGFUSE_ENV` | — | 追踪上的环境标签（`production`、`staging`、…） |
| `HERMES_LANGFUSE_RELEASE` | — | 发布/版本标签 |
| `HERMES_LANGFUSE_SAMPLE_RATE` | `1.0` | 传递给 SDK 的采样率（0.0–1.0） |
| `HERMES_LANGFUSE_MAX_CHARS` | `12000` | 对消息内容/工具参数/工具结果的按字段截断 |
| `HERMES_LANGFUSE_DEBUG` | `false` | 详细插件日志输出到 `agent.log` |

Hermes 前缀和标准 SDK 环境变量（`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`、`LANGFUSE_BASE_URL`）均可接受——当两者都设置时，Hermes 前缀优先。

**性能：** Langfuse 客户端在首次钩子调用后被缓存。如果凭据或 SDK 缺失，该决定也会被缓存——后续钩子会快速返回，无需重新检查环境变量或重新加载配置。

**禁用：** `hermes plugins disable observability/langfuse`。插件模块仍会被发现，但在你重新启用之前不会运行任何模块代码。

### google_meet

让智能体**加入、转录并参与 Google Meet 通话**——记录会议笔记，会后总结讨论内容，跟进具体要点，并（可选地）通过 TTS 在通话中语音回复。

**新增功能：**

- 一个使用浏览器自动化加入 Meet URL 的无头虚拟参与者
- 通过配置的 STT 提供程序进行会议音频的实时转录
- 一个 `meet_summarize` / `meet_speak` / `meet_followup` 工具集，智能体调用它们来对其听到的内容采取行动
- 会议后生成的产物（转录文本、带说话人归属的笔记、行动项）保存在 `~/.hermes/cache/google_meet/<meeting_id>/` 下

**设置：**

```bash
hermes plugins enable google_meet
# 首次使用时提示你通过插件的 OAuth 流程登录——
# 需要一个具有 Meet 访问权限的 Google 帐户。如果会议强制要求
# "仅受邀参与者可加入"，则可能需要主持人批准。
```

在聊天中使用：

> "加入 meet.google.com/abc-defg-hij 并做笔记。通话结束后，发送一份包含行动项的摘要给我。"

智能体启动会议加入，随着通话进行将转录流回其上下文，并在会议结束时（或你指示它停止时）生成结构化摘要。

**使用场景：** 你希望有一个机器人异步转录和总结的定期站会；你希望有结构化笔记的证人证词式访谈；任何你原本需要 Fireflies / Otter / Grain 的场景。当你不希望有 AI 旁听时——不要启用它。

**禁用：** `hermes plugins disable google_meet`。任何缓存的转录和录音都会保留在 `~/.hermes/cache/google_meet/` 中，直到你手动删除。

### hermes-achievements

为仪表板添加一个 **Steam 风格的成就标签页** —— 基于你真实的 Hermes 会话历史生成的 60 多个可收集、分层的徽章。工具链成就、调试模式、氛围编程连续记录、技能/内存使用、模型/提供程序多样性、生活化特征（周末和夜间会话）。最初由 [@PCinkusz](https://github.com/PCinkusz) 作为外部插件开发；现引入仓库内，以便与 Hermes 功能变更保持同步。

**工作原理：**

- 在仪表板后端扫描你整个 `~/.hermes/state.db` 会话历史
- 每个会话的统计信息通过 `(started_at, last_active)` 指纹缓存，因此只有新的或变化的会话在后续扫描中才会重新分析
- 首次扫描在后台线程中运行——仪表板永远不会阻塞等待它，即使在拥有数千个会话的数据库上也是如此
- 解锁状态持久化到 `$HERMES_HOME/plugins/hermes-achievements/state.json`

**等级进阶：** 铜 → 银 → 金 → 钻石 → 奥林匹亚。每个卡片都有一个“计数标准”部分，列出正在追踪的确切指标。

**成就状态：**

| 状态 | 含义 |
|---|---|
| 已解锁 | 至少达成一个等级 |
| 已发现 | 已知成就，进度可见，尚未获得 |
| 隐藏 | 在 Hermes 检测到你历史记录中的首个相关信号之前隐藏 |

**API** — 路由挂载在 `/api/plugins/hermes-achievements/` 下：

| 端点 | 用途 |
|---|---|
| `GET /achievements` | 完整目录，包含每个徽章的解锁状态（首次冷扫描运行时返回待处理占位符） |
| `GET /scan-status` | 后台扫描器状态：`idle` / `running` / `failed`，上次耗时，运行次数 |
| `GET /recent-unlocks` | 最近解锁的二十个徽章，最新的在前 |
| `GET /sessions/{id}/badges` | 主要在一个特定会话中获得的徽章 |
| `POST /rescan` | 手动同步重新扫描（阻塞；用于用户点击重新扫描按钮时） |
| `POST /reset-state` | 清除解锁历史和缓存快照 |

**状态文件** — 位于 `$HERMES_HOME/plugins/hermes-achievements/`：

| 文件 | 内容 |
|---|---|
| `state.json` | 解锁历史：你获得了哪些徽章以及何时获得。在 Hermes 更新后保持稳定。 |
| `scan_snapshot.json` | 上次完成的扫描有效载荷（仪表板加载时立即提供） |
| `scan_checkpoint.json` | 按指纹索引的每个会话统计缓存（使热重新扫描快速） |

**性能说明：**

- 对约 8,000 个会话的冷扫描需要几分钟。它在仪表板首次请求时在后台线程中运行；UI 会看到一个待处理的占位符并轮询 `/scan-status`。
- **冷扫描期间的增量结果** — 扫描器每约 250 个会话发布一次部分快照，因此每次仪表板刷新时，随着扫描进行会显示更多徽章被解锁。不会长时间盯着零数据。
- 热重新扫描会重用其 `started_at` + `last_active` 指纹与检查点匹配的每个会话的统计信息——即使在大型历史记录上也能在几秒内完成。
- 内存快照 TTL 为 120 秒；过期的请求会立即提供旧快照并触发后台刷新。你永远不会因为 TTL 过期而等待加载圈。

**启用：** 无需启用 — `hermes-achievements` 是一个纯仪表板插件（无生命周期钩子，无模型可见工具）。它在首次启动时自动注册为 `hermes dashboard` 中的一个标签页。`plugins.enabled` 配置仅控制生命周期/工具插件；仪表板插件纯粹通过其 `dashboard/manifest.json` 被发现。

**选择退出：** 删除或重命名 `plugins/hermes-achievements/dashboard/manifest.json`，或者在 `~/.hermes/plugins/hermes-achievements/` 中使用一个同名的、不提供仪表板的用户插件覆盖它。该插件在 `$HERMES_HOME/plugins/hermes-achievements/` 下的状态文件会保留——重新安装会保留你的解锁历史。

## 添加捆绑插件

捆绑插件的编写方式与其他任何 Hermes 插件完全相同——请参阅 [构建 Hermes 插件](/guides/build-a-hermes-plugin)。唯一的区别在于：

- 目录位于 `<repo>/plugins/<name>/` 而非 `~/.hermes/plugins/<name>/`
- 清单源在 `hermes plugins list` 命令输出中显示为 `bundled`
- 用户安装的同名插件将覆盖捆绑版本

符合以下条件的插件适合作为捆绑插件：

- 没有可选依赖项（或它们已是 `pip install .[all]` 的依赖项）
- 该功能对大多数用户有益，且设计为可选退出而非可选启用
- 其逻辑与生命周期钩子紧密相关，否则智能体需要记住调用这些钩子
- 它补充了核心功能，但未扩展模型可见的工具表面

反面例子——应保持为用户可安装插件而非捆绑的插件包括：需要 API 密钥的第三方集成、特定工作流、大型依赖树，以及任何会默认显著改变智能体行为的插件。