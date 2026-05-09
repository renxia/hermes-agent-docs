---
sidebar_position: 12
sidebar_label: "内置插件"
title: "内置插件"
description: "Hermes Agent 自带的插件，通过生命周期钩子自动运行 — 如磁盘清理等"
---

# 内置插件

Hermes 随仓库捆绑了一小部分插件。它们位于 `<repo>/plugins/<name>/` 目录下，并会与用户安装的插件（位于 `~/.hermes/plugins/`）一同自动加载。它们使用与第三方插件相同的插件接口 — 钩子、工具、斜杠命令 — 只是维护在项目树内。

请参阅 [插件](/docs/user-guide/features/plugins) 页面了解通用插件系统，以及 [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin) 页面来编写您自己的插件。

## 发现机制如何工作

`PluginManager` 按顺序扫描四个来源：

1. **捆绑插件** — `<repo>/plugins/<name>/`（本文档所描述的内容）
2. **用户插件** — `~/.hermes/plugins/<name>/`
3. **项目插件** — `./.hermes/plugins/<name>/`（需设置 `HERMES_ENABLE_PROJECT_PLUGINS=1`）
4. **Pip 入口点** — `hermes_agent.plugins`

当出现名称冲突时，后面的来源会覆盖前面的 — 例如，名为 `disk-cleanup` 的用户插件会替换捆绑的同名插件。

`plugins/memory/` 和 `plugins/context_engine/` 目录被故意排除在捆绑插件扫描之外。这些目录使用其自身的发现路径，因为内存提供者和上下文引擎是通过配置文件中的 `hermes memory setup` / `context.engine` 配置的单选提供者。

## 捆绑插件需手动启用

捆绑插件随程序一起发布，但默认处于禁用状态。Discovery 会发现它们（它们会出现在 `hermes plugins list` 和交互式 `hermes plugins` 用户界面中），但除非你明确启用它们，否则不会加载：

```bash
hermes plugins enable disk-cleanup
```

或通过 `~/.hermes/config.yaml` 文件：

```yaml
plugins:
  enabled:
    - disk-cleanup
```

这与用户安装的插件使用相同的机制。捆绑插件永远不会自动启用——无论是全新安装，还是现有用户升级到较新版本的 Hermes。你始终需要明确选择启用。

要再次关闭捆绑插件：

```bash
hermes plugins disable disk-cleanup
# 或者：从 config.yaml 中的 plugins.enabled 列表中移除它
```

## 当前捆绑的插件

该仓库在 `plugins/` 目录下捆绑了以下插件。所有插件都需要手动启用——通过 `hermes plugins enable <name>` 启用。

| 插件 | 类型 | 用途 |
|---|---|---|
| `disk-cleanup` | 钩子 + 斜杠命令 | 自动跟踪临时文件并在会话结束时清理它们 |
| `observability/langfuse` | 钩子 | 将回合 / LLM 调用 / 工具调用追踪到 [Langfuse](https://langfuse.com) |
| `spotify` | 后端（7 个工具） | 原生 Spotify 播放、队列、搜索、播放列表、专辑、音乐库 |
| `google_meet` | 独立 | 加入 Meet 通话、实时字幕转录、可选的实时双向音频 |
| `image_gen/openai` | 图像后端 | OpenAI `gpt-image-2` 图像生成后端（FAL 的替代方案） |
| `image_gen/openai-codex` | 图像后端 | 通过 Codex OAuth 使用 OpenAI 图像生成 |
| `image_gen/xai` | 图像后端 | xAI `grok-2-image` 后端 |
| `hermes-achievements` | 仪表板标签页 | 根据你的真实 Hermes 会话历史生成的 Steam 风格可收集徽章 |
| `example-dashboard` | 仪表板示例 | 用于 [扩展仪表板](./extending-the-dashboard.md) 的参考仪表板插件 |
| `strike-freedom-cockpit` | 仪表板皮肤 | 示例自定义仪表板皮肤 |

记忆提供者（`plugins/memory/*`）和上下文引擎（`plugins/context_engine/*`）在 [记忆提供者](./memory-providers.md) 中单独列出——它们分别通过 `hermes memory` 和 `hermes plugins` 管理。以下是两个长期运行的基于钩子的插件的详细信息。

### disk-cleanup

自动跟踪并删除在会话期间创建的临时文件——测试脚本、临时输出、cron 日志、过时的 Chrome 配置文件——无需智能体记住调用工具。

**工作原理：**

| 钩子 | 行为 |
|---|---|
| `post_tool_call` | 当 `write_file` / `terminal` / `patch` 在 `HERMES_HOME` 或 `/tmp/hermes-*` 中创建匹配 `test_*`、`tmp_*` 或 `*.test.*` 的文件时，将其静默跟踪为 `test` / `temp` / `cron-output`。 |
| `on_session_end` | 如果在该回合期间自动跟踪了任何测试文件，则运行安全的 `quick` 清理并记录一行摘要。否则保持静默。 |

**删除规则：**

| 类别 | 阈值 | 确认 |
|---|---|---|
| `test` | 每次会话结束时 | 从不 |
| `temp` | 自跟踪起 >7 天 | 从不 |
| `cron-output` | 自跟踪起 >14 天 | 从不 |
| `HERMES_HOME` 下的空目录 | 总是 | 从不 |
| `research` | >30 天，且不在最新的 10 个文件内 | 总是（仅深度清理） |
| `chrome-profile` | 自跟踪起 >14 天 | 总是（仅深度清理） |
| 文件 >500 MB | 从不自动删除 | 总是（仅深度清理） |

**斜杠命令** —— `/disk-cleanup` 在 CLI 和网关会话中均可用：

```
/disk-cleanup status                     # 分类统计 + 最大的 10 个文件
/disk-cleanup dry-run                    # 预览但不删除
/disk-cleanup quick                      # 立即运行安全清理
/disk-cleanup deep                       # quick + 列出需要确认的项目
/disk-cleanup track <path> <category>    # 手动跟踪
/disk-cleanup forget <path>              # 停止跟踪（不删除）
```

**状态** —— 所有数据都存储在 `$HERMES_HOME/disk-cleanup/` 下：

| 文件 | 内容 |
|---|---|
| `tracked.json` | 跟踪的路径及其类别、大小和时间戳 |
| `tracked.json.bak` | 上述文件的原子写入备份 |
| `cleanup.log` | 仅追加的审计日志，记录每次跟踪 / 跳过 / 拒绝 / 删除操作 |

**安全性** —— 清理操作只会触及 `HERMES_HOME` 或 `/tmp/hermes-*` 下的路径。Windows 挂载（`/mnt/c/...`）会被拒绝。众所周知的顶级状态目录（`logs/`、`memories/`、`sessions/`、`cron/`、`cache/`、`skills/`、`plugins/`、`disk-cleanup/` 本身）即使为空也永远不会被移除——全新安装不会在第一次会话结束时被清空。

**启用：** `hermes plugins enable disk-cleanup`（或在 `hermes plugins` 中勾选复选框）。

**再次禁用：** `hermes plugins disable disk-cleanup`。

### observability/langfuse

将 Hermes 回合、LLM 调用和工具调用追踪到 [Langfuse](https://langfuse.com)——一个开源的 LLM 可观测性平台。每个回合一个 span，每次 API 调用一个 generation，每次工具调用一个工具观察。使用总量、每类 token 计数和成本估算来自 Hermes 的标准 `agent.usage_pricing` 数据，因此 Langfuse 仪表板看到的细分（输入 / 输出 / `cache_read_input_tokens` / `cache_creation_input_tokens` / `reasoning_tokens`）与 `hermes logs` 中显示的相同。

该插件是“失败开放”的：未安装 SDK、无凭据或 Langfuse 出现瞬时错误——所有这些情况在钩子中都会变成静默的无操作。智能体循环永远不会受到影响。

**设置（交互式——推荐）：**

```bash
hermes tools          # → Langfuse 可观测性 → 云端或自托管
```

向导会收集你的密钥，`pip install` `langfuse` SDK，并将 `observability/langfuse` 添加到 `plugins.enabled` 中。重启 Hermes 后，下一个回合就会发送追踪数据。

**设置（手动）：**

```bash
pip install langfuse
hermes plugins enable observability/langfuse
```

然后将凭据放入 `~/.hermes/.env`：

```bash
HERMES_LANGFUSE_PUBLIC_KEY=pk-lf-...
HERMES_LANGFUSE_SECRET_KEY=sk-lf-...
HERMES_LANGFUSE_BASE_URL=https://cloud.langfuse.com   # 或你的自托管 URL
```

**工作原理：**

| 钩子 | 行为 |
|---|---|
| `pre_api_request` / `pre_llm_call` | 打开（或重用）每个回合的根 span “Hermes turn”。为此 API 调用启动一个 `generation` 子观察，并将序列化的最近消息作为输入。 |
| `post_api_request` / `post_llm_call` | 关闭 generation，附加 `usage_details`、`cost_details`、`finish_reason`、助手输出 + 工具调用。如果没有工具调用且内容非空，则关闭该回合。 |
| `pre_tool_call` | 使用经过清理的 `args` 启动一个 `tool` 子观察。 |
| `post_tool_call` | 使用经过清理的 `result` 关闭工具观察。`read_file` 的负载会被摘要（开头 + 结尾 + 省略行数），以便巨大的文件读取保持在 `HERMES_LANGFUSE_MAX_CHARS` 限制内。 |

会话分组通过 Hermes 会话 ID（或子智能体的任务 ID）使用 `langfuse.propagate_attributes`，因此单个 `hermes chat` 会话中的所有数据都位于一个 Langfuse 会话下。

**验证：**

```bash
hermes plugins list                 # observability/langfuse 应显示“enabled”
hermes chat -q "hello"              # 在 Langfuse UI 中检查“Hermes turn”追踪
```

**可选调优**（在 `.env` 中）：

| 变量 | 默认值 | 用途 |
|---|---|---|
| `HERMES_LANGFUSE_ENV` | — | 追踪的环境标签（`production`、`staging`，…） |
| `HERMES_LANGFUSE_RELEASE` | — | 发布/版本标签 |
| `HERMES_LANGFUSE_SAMPLE_RATE` | `1.0` | 传递给 SDK 的采样率（0.0–1.0） |
| `HERMES_LANGFUSE_MAX_CHARS` | `12000` | 消息内容 / 工具参数 / 工具结果的每个字段截断长度 |
| `HERMES_LANGFUSE_DEBUG` | `false` | 向 `agent.log` 输出详细的插件日志 |

Hermes 前缀和标准 SDK 环境变量（`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`、`LANGFUSE_BASE_URL`）都被接受——当两者都设置时，Hermes 前缀的变量优先。

**性能：** Langfuse 客户端在第一次钩子调用后被缓存。如果凭据或 SDK 缺失，该决定也会被缓存——后续的钩子会快速返回，而无需重新检查环境变量或重新加载配置。

**禁用：** `hermes plugins disable observability/langfuse`。插件模块仍会被发现，但在你重新启用之前，不会运行任何模块代码。

### google_meet

让智能体**加入、转录并参与 Google Meet 通话**——在会议中做笔记，通话后总结来回讨论的内容，跟进特定要点，并（可选）通过 TTS 将回复说出来加入通话。

**它添加了什么：**

- 一个无头虚拟参与者，使用浏览器自动化加入 Meet URL
- 通过配置的 STT 提供程序对会议音频进行实时转录
- 一套 `meet_summarize` / `meet_speak` / `meet_followup` 工具，智能体调用这些工具来对听到的内容采取行动
- 会后工件（转录稿、带说话人标注的笔记、行动项）保存在 `~/.hermes/cache/google_meet/<meeting_id>/` 下

**设置：**

```bash
hermes plugins enable google_meet
# 首次使用时提示你通过插件的 OAuth 流程登录 —
# 需要一个具有 Meet 访问权限的 Google 账户。如果会议强制执行“只有受邀参与者才能加入”，则可能需要主持人批准。
```

从聊天中使用：

> “加入 meet.google.com/abc-defg-hij 并做笔记。通话结束后，向我发送一份包含行动项的总结。”

智能体启动会议加入，在通话进行时将其上下文中的转录流返回，并在会议结束时（或你告诉它停止时）生成结构化总结。

**何时使用：** 你希望机器人为异步参与者转录 + 总结的定期站会；你希望获得结构化笔记的取证式访谈；任何你原本需要 Fireflies / Otter / Grain 的情况。当你不希望 AI 旁听时——不要启用它。

**禁用：** `hermes plugins disable google_meet`。任何缓存的转录和录音会保留在 `~/.hermes/cache/google_meet/` 中，直到你手动删除它们。

### hermes-achievements

向仪表板添加一个 **Steam 风格的成就标签页**——60+ 个可收集的分级徽章，根据你的真实 Hermes 会话历史生成。工具链壮举、调试模式、氛围编码连胜、技能/记忆使用情况、模型/提供商多样性、生活方式怪癖（周末和夜间会话）。最初由 [@PCinkusz](https://github.com/PCinkusz) 作为外部插件编写；现已纳入主线，以便与 Hermes 功能更改保持同步。

**工作原理：**

- 在仪表板后端扫描你整个 `~/.hermes/state.db` 会话历史
- 每个会话的统计信息通过 `(started_at, last_active)` 指纹缓存，因此只有新的或已更改的会话才会在后续扫描中重新分析
- 首次扫描在后台线程中运行——仪表板永远不会阻塞等待它，即使数据库中有数千个会话
- 解锁状态持久化到 `$HERMES_HOME/plugins/hermes-achievements/state.json`

**等级进度：** 铜 → 银 → 金 → 钻石 → 奥林匹亚。每张卡片都暴露一个“什么算数”部分，列出正在跟踪的确切指标。

**成就状态：**

| 状态 | 含义 |
|---|---|
| 已解锁 | 至少获得一个等级 |
| 已发现 | 已知成就，进度可见，但尚未获得 |
| 秘密 | 直到 Hermes 在你的历史中检测到第一个相关信号之前都隐藏 |

**API** —— 路由挂载在 `/api/plugins/hermes-achievements/` 下：

| 端点 | 用途 |
|---|---|
| `GET /achievements` | 完整目录，包含每个徽章的解锁状态（在首次冷扫描运行时返回一个待处理的占位符） |
| `GET /scan-status` | 后台扫描器的状态：`idle` / `running` / `failed`，上次持续时间，运行次数 |
| `GET /recent-unlocks` | 最近解锁的二十个徽章，最新的在前 |
| `GET /sessions/{id}/badges` | 主要在一个特定会话中获得的徽章 |
| `POST /rescan` | 手动同步重新扫描（阻塞；当用户点击重新扫描按钮时使用） |
| `POST /reset-state` | 清除解锁历史和缓存的快照 |

**状态文件** —— 位于 `$HERMES_HOME/plugins/hermes-achievements/` 下：

| 文件 | 内容 |
|---|---|
| `state.json` | 解锁历史：你获得了哪些徽章以及何时获得。在 Hermes 更新中保持稳定。 |
| `scan_snapshot.json` | 上次完成的扫描负载（在仪表板加载时立即提供） |
| `scan_checkpoint.json` | 通过指纹索引的每个会话的统计信息缓存（使热重新扫描快速） |

**性能说明：**

- 对约 8,000 个会话进行冷扫描需要几分钟。它在首次仪表板请求时在后台线程中运行；UI 看到一个待处理的占位符并轮询 `/scan-status`。
- **冷扫描期间的增量结果** —— 扫描器每约 250 个会话发布一个部分快照，因此每次仪表板刷新都会在扫描进行时显示更多已解锁的徽章。无需盯着零值看一分钟。
- 热重新扫描为每个 `started_at` + `last_active` 指纹与检查点匹配的会话重用每个会话的统计信息——即使在大历史记录上也能在几秒钟内完成。
- 内存中快照的 TTL 为 120 秒；过时的请求会立即提供旧快照并触发后台刷新。你永远不会仅仅因为 TTL 过期而等待加载动画。

**启用：** 无需启用 —— `hermes-achievements` 是一个仅限仪表板的插件（无生命周期钩子，无模型可见工具）。它会在首次启动时自动注册为 `hermes dashboard` 中的一个标签页。`plugins.enabled` 配置仅控制生命周期/工具插件；仪表板插件纯粹通过其 `dashboard/manifest.json` 被发现。

**选择退出：** 删除或重命名 `plugins/hermes-achievements/dashboard/manifest.json`，或者在 `~/.hermes/plugins/hermes-achievements/` 中使用同名用户插件覆盖它，该插件不发布任何仪表板。插件在 `$HERMES_HOME/plugins/hermes-achievements/` 下的状态文件会保留——重新安装会保留你的解锁历史。

## 添加一个捆绑插件

捆绑插件的编写方式与其他 Hermes 插件完全相同——请参阅[构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)。唯一的区别在于：

- 目录位于 `<repo>/plugins/<name>/` 而不是 `~/.hermes/plugins/<name>/`
- 在 `hermes plugins list` 中，清单源报告为 `bundled`
- 同名用户插件会覆盖捆绑版本

以下情况适合将插件设为捆绑插件：

- 没有可选依赖项（或者它们已经是 `pip install .[all]` 的依赖项）
- 该行为使大多数用户受益，并且是默认启用（可选择退出）而非默认禁用（可选择加入）
- 其逻辑与生命周期钩子相关联，否则智能体必须记得调用这些钩子
- 它补充了核心功能，但不会扩大模型可见的工具范围

反例（应保持为用户可安装插件，而非捆绑插件）：带有 API 密钥的第三方集成、小众工作流、大型依赖树，以及任何会显著改变智能体默认行为的内容。