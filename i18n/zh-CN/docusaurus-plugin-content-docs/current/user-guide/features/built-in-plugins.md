---
sidebar_position: 12
sidebar_label: "内置插件"
title: "内置插件"
description: "随 Hermes 智能体一起提供的插件，它们通过生命周期钩子自动运行——例如 disk-cleanup 等。"
---

# 内置插件

Hermes 随仓库捆绑了一套小型插件。它们位于 `<repo>/plugins/<name>/` 下，并与用户安装在 `~/.hermes/plugins/` 中的插件一起自动加载。它们使用的插件接口与第三方插件相同——钩子、工具、斜杠命令——只是保持在代码库内部维护。

请参阅 [插件](/user-guide/features/plugins) 页面了解通用的插件系统，并参考 [构建一个 Hermes 插件](/guides/build-a-hermes-plugin) 来编写你自己的。

## 工作原理

PluginManager 会按顺序扫描四个来源：

1. **捆绑的** — `<repo>/plugins/<name>/`（本页面所描述的内容）
2. **用户** — `~/.hermes/plugins/<name>/`
3. **项目** — `./.hermes/plugins/<name>/`（需要设置 `HERMES_ENABLE_PROJECT_PLUGINS=1`）
4. **Pip 入口点** — `hermes_agent.plugins`

发生名称冲突时，后来的来源将获胜——一个名为 disk-cleanup 的用户插件将替换捆绑的插件。

`plugins/memory/` 和 `plugins/context_engine/` 被故意排除在捆绑扫描之外。这些目录使用了自己的发现路径，因为内存提供者和上下文引擎是通过配置中的 `hermes memory setup` / `context.engine` 进行配置的单选提供者。

## 捆绑插件是可选启用的

捆绑插件默认处于禁用状态。发现功能会找到它们（它们出现在 `hermes plugins list` 和交互式的 `hermes plugins` UI 中），但除非您明确启用它们，否则任何插件都不会加载：

```bash
hermes plugins enable disk-cleanup
```

或者通过 `~/.hermes/config.yaml`：

```yaml
plugins:
  enabled:
    - disk-cleanup
```

这是用户安装插件所使用的相同机制。捆绑插件绝不会自动启用——无论是首次安装，还是现有用户升级到较新的 Hermes 版本。您总是需要明确选择启用它们。

要再次关闭一个捆绑插件：

```bash
hermes plugins disable disk-cleanup
# 或：从 config.yaml 的 plugins.enabled 中移除它
```

## 当前提供的插件

仓库中包含了这些位于 `plugins/` 下的捆绑插件。所有插件均需手动启用——通过运行 `hermes plugins enable <name>` 来启用它们。

| 插件 | 类型 | 用途 |
|---|---|---|
| `disk-cleanup` | hooks + 命令行 | 自动跟踪临时文件并在会话结束时清理它们 |
| `security-guidance` | hooks | 对 `write_file`/`patch` 进行模式匹配，检测危险代码并附加安全警告（或阻止）— 25 条规则（Apache-2.0 对 Anthropic 的 `claude-plugins-official` 模式的派生） |
| `observability/langfuse` | hooks | 将回合、LLM 调用/工具调用跟踪到 [Langfuse](https://langfuse.com) |
| `observability/nemo_relay` | hooks | 将可观测性事件（回合/LLM 调用/工具调用）中继到 NVIDIA NeMo 端点 |
| `teams_pipeline` | standalone | Microsoft Teams 会议管道 — 基于 Graph，以转录为先的会议摘要 |
| `spotify` | 后端 (7 个工具) | 原生 Spotify 播放、队列、搜索、播放列表、专辑、库 |
| `google_meet` | standalone | 加入 Meet 会议，实时字幕转录，可选实时双向音频 |
| `image_gen/openai` | 图像后端 | OpenAI `gpt-image-2` 图像生成后端（FAL 的替代方案） |
| `image_gen/openai-codex` | 图像后端 | 通过 Codex OAuth 进行 OpenAI 图像生成 |
| `image_gen/xai` | 图像后端 | xAI `grok-2-image` 后端 |
| `hermes-achievements` | 控制面板标签页 | 根据您的真实 Hermes 会话历史记录生成的 Steam 式收藏徽章 |
| `kanban/dashboard` | 控制面板标签页 | 用于多智能体调度器的看板 UI — 任务、评论、扇出（fan-out）、板切换。参见 [Kanban Multi-Agent](./kanban.md)。 |

内存提供者（`plugins/memory/*`）和上下文引擎（`plugins/context_engine/*`）已在 [Memory Providers](./memory-providers.md) 中单独列出——它们分别通过 `hermes memory` 和 `hermes plugins` 进行管理。以下是这两个长期运行的基于 hooks 的插件的完整细节。

### disk-cleanup

自动跟踪和移除会话期间创建的临时文件——测试脚本、临时输出、cron 日志、陈旧的 Chrome 配置文件——无需智能体记得调用工具。

**工作原理：**

| Hook | 行为 |
|---|---|
| `post_tool_call` | 当 `write_file` / `terminal` / `patch` 在 `HERMES_HOME` 或 `/tmp/hermes-*` 内创建匹配 `test_*`、`tmp_*` 或 `*.test.*` 的文件时，将其静默跟踪为 `test` / `temp` / `cron-output`。 |
| `on_session_end` | 如果在回合期间有任何测试文件被自动跟踪，则运行安全的 `quick` 清理并记录一行摘要。否则保持静默。 |

**删除规则：**

| 类别 | 阈值 | 确认 |
|---|---|---|
| `test` | 每个会话结束时 | 从不 |
| `temp` | 跟踪超过 7 天 | 从不 |
| `cron-output` | 跟踪超过 14 天 | 从不 |
| HERMES_HOME 下的空目录 | 始终 | 从不 |
| `research` | 超过 30 天，超出最新的 10 个 | 总是（深度扫描） |
| `chrome-profile` | 跟踪超过 14 天 | 总是（深度扫描） |
| 大于 500 MB 的文件 | 从不自动 | 总是（深度扫描） |

**命令行工具** — `/disk-cleanup` 可在 CLI 和网关会话中使用：

```
/disk-cleanup status                     # 细分 + 10 个最大的文件
/disk-cleanup dry-run                    # 预览，不删除
/disk-cleanup quick                      # 立即运行安全清理
/disk-cleanup deep                       # quick + 列出需要确认的项目
/disk-cleanup track <path> <category>    # 手动跟踪
/disk-cleanup forget <path>              # 停止跟踪（不删除）
```

**状态** — 所有内容都保存在 `$HERMES_HOME/disk-cleanup/` 下：

| 文件 | 内容 |
|---|---|
| `tracked.json` | 包含路径、类别、大小和时间戳的已跟踪文件 |
| `tracked.json.bak` | 上述内容的原子写入备份 |
| `cleanup.log` | 每个跟踪 / 跳过 / 拒绝 / 删除操作的追加审计日志 |

**安全性** — 清理功能只处理 `HERMES_HOME` 或 `/tmp/hermes-*` 下的路径。会挂载的 Windows 驱动器（`/mnt/c/...`）将被拒绝。众所知的顶级状态目录（`logs/`、`memories/`、`sessions/`、`cron/`、`cache/`、`skills/`、`plugins/`、`disk-cleanup/` 本身）即使为空也不会被删除——首次会话结束时不会进行彻底清理。

**启用：** `hermes plugins enable disk-cleanup`（或在 `hermes plugins` 中勾选）。

**再次禁用：** `hermes plugins disable disk-cleanup`。

### security-guidance

对文件写入操作进行快速的模式匹配安全警告。当智能体的 `write_file` / `patch` / `skill_manage` 调用包含与已知危险代码模式（如 `pickle.load`、未带 `SafeLoader` 的 `yaml.load`、`eval(`、`os.system`、`subprocess(..., shell=True)`、JS `child_process.exec`、React `dangerouslySetInnerHTML`、原始的 `.innerHTML =` / `.outerHTML =` / `document.write`、Node `crypto.createCipher`、AES ECB 模式、禁用 TLS 验证、易受 XXE 攻击的 `xml.etree` / `minidom` 解析器、缺少 SRI 的 `<script src="//..." >`、未带 `weights_only=True` 的 `torch.load`、GitHub Actions `${{ github.event.* }}` 注入）的内容时，该插件会将一个 `⚠️ 安全指南` 块附加到工具的结果中。

文件仍然会被写入。模型会在下一个回合的工具消息中读取警告，并可以选择修复代码或说明为什么这个结构在当前上下文中是安全的。模式匹配具有非微不足道的误报率，这就是默认设置为“警告”（而不是“阻止”）的原因。

**覆盖范围：** 共 25 条规则，涵盖不安全的反序列化、命令注入、XSS 漏洞点、加密陷阱、XXE、供应链（SRI）和 CI/CD 工作流注入。模式数据是 [Anthropic's `claude-plugins-official`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/security-guidance/hooks) 的逐字 Apache-2.0 派生——请参阅插件的 `LICENSE` 和 `NOTICE` 文件以获取归属信息。

**模式：**

| 环境变量 | 效果 |
|---|---|
| (未设置) | **警告模式**（默认）— 文件被写入，结果中附加警告 |
| `SECURITY_GUIDANCE_BLOCK=1` | **阻止模式** — 拒绝写入，将警告作为阻止的原因返回 |
| `SECURITY_GUIDANCE_DISABLE=1` | 终止开关 — 插件加载但什么都不做 |

**启用：** `hermes plugins enable security-guidance`（或在 `hermes plugins` 中勾选）。

**再次禁用：** `hermes plugins disable security-guidance`。

**它不做什么（目前）：** 上游 Anthropic 插件还有两个额外的层级——一个针对触摸文件的每个智能体回合的 LLM 差异审查，以及一个跨文件数据流的智能体提交时审查。这些功能均未移植。智能体可以通过 `delegate_task` 随时运行这些审查。

### observability/langfuse

将 Hermes 的回合、LLM 调用和工具调用跟踪到 [Langfuse](https://langfuse.com)——一个开源的 LLM 可观测性平台。每个回合一个 Span，每次 API 调用一个生成记录（generation），每次工具调用一个工具观察（tool observation）。使用量、每种类型的 token 计数和成本估算均来自 Hermes 的标准 `agent.usage_pricing` 数据，因此 Langfuse 控制面板看到的细分（输入 / 输出 / `cache_read_input_tokens` / `cache_creation_input_tokens` / `reasoning_tokens`）与出现在 `hermes logs` 中的数据一致。

该插件是容错的：没有安装 SDK、没有凭证或 Langfuse 瞬时错误，都会导致 hook 中静默地不执行任何操作（no-op）。智能体循环不会受到影响。

**设置（交互式 — 推荐）：**

```bash
hermes tools          # → Langfuse 可观测性 → 云端或自托管
```

向导会收集您的密钥，`pip install` `langfuse` SDK，并将 `observability/langfuse` 添加到 `plugins.enabled` 中。重启 Hermes 后，下一个回合就会发送一个跟踪记录。

**设置（手动）：**

```bash
pip install langfuse
hermes plugins enable observability/langfuse
```

然后将凭证放入 `~/.hermes/.env`：

```bash
HERMES_LANGFUSE_PUBLIC_KEY=pk-lf-...
HERMES_LANGFUSE_SECRET_KEY=sk-lf-...
HERMES_LANGFUSE_BASE_URL=https://cloud.langfuse.com   # 或您的自托管 URL
```

**工作原理：**

| Hook | 行为 |
|---|---|
| `pre_api_request` / `pre_llm_call` | 打开（或重用）一个“Hermes 回合”的每回合根 Span。为本次 API 调用启动一个 `generation` 子观察，将序列化的最近消息作为输入。 |
| `post_api_request` / `post_llm_call` | 关闭生成记录，附加 `usage_details`、`cost_details`、`finish_reason`、助手输出 + 工具调用。如果没有工具调用且内容非空，则关闭该回合。 |
| `pre_tool_call` | 启动一个带有消毒后 `args` 的 `tool` 子观察。 |
| `post_tool_call` | 关闭工具观察，附带消毒后的 `result`。对于文件读取（read_file）的 payload 进行摘要（头部 + 尾部 + 省略行数），以确保大型文件读取不会超过 `HERMES_LANGFUSE_MAX_CHARS`。 |

会话分组键基于 Hermes 会话 ID（或子智能体的任务 ID），通过 `langfuse.propagate_attributes` 实现，因此单个 `hermes chat` 会话中的所有内容都属于一个 Langfuse 会话。

**验证：**

```bash
hermes plugins list                 # observability/langfuse 应显示“enabled”
hermes chat -q "hello"              # 检查 Langfuse UI 中是否有“Hermes 回合”的跟踪记录
```

**可选调整（在 `.env` 中）：**

| 变量 | 默认值 | 用途 |
|---|---|---|
| `HERMES_LANGFUSE_ENV` | — | 追踪记录的环境标签（`production`、`staging` 等） |
| `HERMES_LANGFUSE_RELEASE` | — | 版本/发布标签 |
| `HERMES_LANGFUSE_SAMPLE_RATE` | `1.0` | 传递给 SDK 的采样率 (0.0–1.0) |
| `HERMES_LANGFUSE_MAX_CHARS` | `12000` | 消息内容 / 工具参数 / 工具结果的字段级截断限制 |
| `HERMES_LANGFUSE_DEBUG` | `false` | 到 `agent.log` 的冗余插件日志记录 |

Hermes 前缀和标准的 SDK 环境变量（`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`、`LANGFUSE_BASE_URL`）均被接受——如果两者都设置了，则以 Hermes 前缀为准。

**性能：** Langfuse 客户端在第一次调用 hook 后会被缓存。如果缺少凭证或 SDK，该决定也会被缓存——后续的 hook 会快速返回，而不会重新检查环境变量或重新加载配置。

**禁用：** `hermes plugins disable observability/langfuse`。插件模块仍然会被发现，但除非您重新启用，否则不会运行任何模块代码。

### google_meet

让智能体能够**加入、转录和参与 Google Meet 会议**——在会议上做笔记，事后总结来回对话，跟进特定要点，并且（可选地）通过 TTS 将回复声传回会议中。

**它提供的功能：**

*   一个使用浏览器自动化技术加入 Meet URL 的无头虚拟参与者
*   通过配置的 STT 提供商对会议音频进行实时转录
*   一套 `meet_summarize` / `meet_speak` / `meet_followup` 工具，供智能体调用以处理其听到的内容
*   会后产物（转录、带说话者归属的笔记、待办事项）保存在 `~/.hermes/cache/google_meet/<meeting_id>/` 下

**设置：**

```bash
hermes plugins enable google_meet
# 在首次使用时，它会提示您通过插件的 OAuth 流程进行登录——
# 需要一个具有 Meet 访问权限的 Google 账户。如果会议强制要求“仅限受邀参与者加入”，则可能需要主机方的批准。
```

聊天中的用法示例：

> “加入 meet.google.com/abc-defg-hij 并做笔记。会议结束后，给我发送一份包含待办事项的摘要。”

智能体会启动会议加入流程，在会议进行过程中将转录内容流式传输回其上下文，并在会议结束时（或您指示它停止时）生成结构化的摘要。

**何时使用：** 适用于希望机器人进行转录和总结以供异步参与者使用的定期站会；适用于需要结构化笔记的沉积访谈；任何您原本需要 Fireflies / Otter / Grain 的情况。如果您宁愿没有 AI 在场——请不要启用它。

**禁用：** `hermes plugins disable google_meet`。任何缓存的转录和录音都将保留在 `~/.hermes/cache/google_meet/` 中，直到您手动删除它们。

### hermes-achievements

为控制面板添加一个 **Steam 式成就标签页**——根据您的真实 Hermes 会话历史记录生成的 60+ 个可收集、分级的徽章。包括工具链壮举、调试模式、氛围编码（vibe-coding）的连胜、技能/内存使用情况、模型/提供商多样性、生活习惯怪癖（周末和夜间会话）。最初由 [@PCinkusz](https://github.com/PCinkusz) 作为外部插件编写；现已集成到主线，以确保与 Hermes 的功能变化保持同步。

**工作原理：**

*   扫描您整个 `~/.hermes/state.db` 会话历史记录（在控制面板后端）
*   每个会话的统计数据都通过 `(started_at, last_active)` 指纹识别进行缓存，因此只有新或已更改的会话会在后续扫描中重新分析
*   首次扫描在一个后台线程中运行——即使数据库包含数千个会话，控制面板也不会等待它完成。
*   解锁状态持久化到 `$HERMES_HOME/plugins/hermes-achievements/state.json`

**等级提升：** 青铜 → 白银 → 黄金 → 钻石 → 奥林匹克级。每个卡片都显示一个“计数标准”部分，列出正在跟踪的确切指标。

**成就状态：**

| 状态 | 含义 |
|---|---|
| Unlocked (已解锁) | 已达成至少一个等级 |
| Discovered (已发现) | 已知的成就，可见进度，但尚未获得 |
| Secret (秘密) | 在 Hermes 检测到您历史记录中的第一个相关信号之前是隐藏的 |

**API** — 路由挂载在 `/api/plugins/hermes-achievements/` 下：

| 端点 | 用途 |
|---|---|
| `GET /achievements` | 完整的目录，包含每个徽章的解锁状态（在首次冷启动扫描运行时会返回一个待定占位符） |
| `GET /scan-status` | 后台扫描器的状态：`idle` / `running` / `failed`，上次持续时间，运行次数 |
| `GET /recent-unlocks` | 最近解锁的 20 个徽章，按新旧排序 |
| `GET /sessions/{id}/badges` | 主要在特定会话中获得的徽章 |
| `POST /rescan` | 手动同步重扫描（会阻塞；当用户点击重扫按钮时使用） |
| `POST /reset-state` | 清除解锁历史记录和缓存快照 |

**状态文件** — 位于 `$HERMES_HOME/plugins/hermes-achievements/` 下：

| 文件 | 内容 |
|---|---|
| `state.json` | 解锁历史记录：您获得了哪些徽章以及何时。跨 Hermes 更新保持稳定。 |
| `scan_snapshot.json` | 上次完成扫描的 payload（在控制面板加载时立即提供） |
| `scan_checkpoint.json` | 按指纹键控的每个会话统计数据缓存（使热重扫快速） |

**性能说明：**

*   对约 8,000 个会话的冷启动扫描需要几分钟。它在首次请求控制面板时在一个后台线程中运行；UI 会显示一个待定的占位符并轮询 `/scan-status`。
*   **冷启动期间的增量结果** — 扫描器每隔约 250 个会话就会发布一个部分快照，因此每次刷新控制面板时，随着扫描的进展，都会显示更多已解锁的徽章。不会长时间盯着零星。
*   热重扫会重用每个会话的统计数据（基于 `started_at` + `last_active` 指纹），即使在大型历史记录上也能在几秒内完成。
*   内存快照的 TTL 是 120 秒；过期的请求会立即提供旧的快照并触发后台刷新。您永远不会因为 TTL 过期而等待一个加载指示器（spinner）。

**启用：** 无需启用——`hermes-achievements` 是一个仅限控制面板的插件（没有生命周期 hooks，没有模型可见的工具）。它在首次启动时会自动注册为 `hermes dashboard` 中的一个标签页。`plugins.enabled` 配置只限制生命周期/工具插件；控制面板插件是通过它们的 `dashboard/manifest.json` 文件被发现的。

**选择退出：** 删除或重命名 `plugins/hermes-achievements/dashboard/manifest.json`，或者用同名但没有控制面板功能的自定义用户插件覆盖它（该用户插件位于 `~/.hermes/plugins/hermes-achievements/`）。该插件在 `$HERMES_HOME/plugins/hermes-achievements/` 下的状态文件会保留下来——重新安装不会丢失您的解锁历史记录。

## 添加捆绑插件

捆绑插件的编写方式与任何其他 Hermes 插件完全相同——请参阅[构建一个 Hermes 插件](/guides/build-a-hermes-plugin)。唯一的区别在于：

- 目录位于 `<repo>/plugins/<name>/`，而不是 `~/.hermes/plugins/<name>/`
- 在 `hermes plugins list` 中，清单源报告为 `bundled`
- 具有相同名称的用户插件会覆盖捆绑版本

当满足以下条件时，该插件是进行打包的良好候选对象：

- 它没有可选依赖项（或者这些依赖项已经是 `pip install .[all]` 的依赖）。
- 它的行为能使大多数用户受益，并且是选择退出（opt-out）而不是选择进入（opt-in）。
- 它的逻辑与生命周期钩子挂钩，否则智能体需要记住调用这些钩子。
- 它补充了核心功能，而不会扩展模型可见的工具表面。

反例——这些内容应该保持为用户可安装的插件，而不是捆绑：带有 API 密钥的第三方集成、小众工作流程、大型依赖树、任何会默认有意义地改变智能体行为的事物。