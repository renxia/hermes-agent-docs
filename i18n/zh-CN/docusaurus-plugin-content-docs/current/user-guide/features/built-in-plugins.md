---
sidebar_position: 12
sidebar_label: "内置插件"
title: "内置插件"
description: "随 Hermes 智能体附带的插件，通过生命周期钩子自动运行——包括磁盘清理等"
---

# 内置插件

Hermes 附带了一小部分打包在代码仓库中的插件。它们位于 `<repo>/plugins/<name>/` 目录下，会随 `~/.hermes/plugins/` 中用户安装的插件一同自动加载。它们使用与第三方插件相同的插件接口——钩子、工具、斜杠命令——只是维护在代码树内。

有关通用插件系统，请参阅 [插件](/user-guide/features/plugins) 页面；若要编写自己的插件，请参阅 [构建 Hermes 插件](/guides/build-a-hermes-plugin)。

## 发现机制如何工作

`PluginManager` 会按顺序扫描四个来源：

1.  **打包的** —— `<repo>/plugins/<name>/`（本页所记录的）
2.  **用户的** —— `~/.hermes/plugins/<name>/`
3.  **项目的** —— `./.hermes/plugins/<name>/`（需要设置 `HERMES_ENABLE_PROJECT_PLUGINS=1`）
4.  **Pip 入口点** —— `hermes_agent.plugins`

名称冲突时，后面的来源优先——例如一个名为 `disk-cleanup` 的用户插件将替代打包的同名插件。

`plugins/memory/` 和 `plugins/context_engine/` 被故意排除在打包扫描之外。这些目录使用其自己的发现路径，因为记忆提供者和上下文引擎是通过 `hermes memory setup` 或配置中的 `context.engine` 设置的单一选择提供者。

## 捆绑插件需手动启用

捆绑插件默认处于禁用状态。系统可以发现它们（它们会显示在 `hermes plugins list` 和交互式 `hermes plugins` 界面中），但在您显式启用之前，不会加载任何插件：

```bash
hermes plugins enable disk-cleanup
```

或通过 `~/.hermes/config.yaml`：

```yaml
plugins:
  enabled:
    - disk-cleanup
```

这与用户安装插件所用的机制相同。捆绑插件永远不会自动启用——无论是全新安装，还是现有用户升级到更新的 Hermes 版本。您总是需要显式选择启用。

要再次关闭捆绑插件：

```bash
hermes plugins disable disk-cleanup
# 或者：从 config.yaml 的 plugins.enabled 中移除它
```

## 当前提供的插件

该仓库在 `plugins/` 目录下提供这些捆绑插件。所有插件都是可选启用的——通过 `hermes plugins enable <name>` 启用。

| 插件 | 类型 | 用途 |
|---|---|---|
| `disk-cleanup` | 钩子 + 斜杠命令 | 自动跟踪临时文件并在会话结束时清理它们 |
| `security-guidance` | 钩子 | 在 `write_file`/`patch` 时对危险代码进行模式匹配，并附加安全警告（或阻止）——25 条规则（对 Anthropic 的 `claude-plugins-official` 模式进行的 Apache-2.0 协议分支） |
| `observability/langfuse` | 钩子 | 将轮次 / LLM 调用 / 工具执行追踪到 [Langfuse](https://langfuse.com) |
| `spotify` | 后端（7 个工具） | 原生 Spotify 播放、队列、搜索、播放列表、专辑、曲库 |
| `google_meet` | 独立 | 加入 Meet 通话、实时字幕转录、可选的实时双工音频 |
| `image_gen/openai` | 图像后端 | OpenAI `gpt-image-2` 图像生成后端（FAL 的替代方案） |
| `image_gen/openai-codex` | 图像后端 | 通过 Codex OAuth 使用 OpenAI 图像生成 |
| `image_gen/xai` | 图像后端 | xAI `grok-2-image` 后端 |
| `hermes-achievements` | 仪表板标签页 | 基于您真实的 Hermes 会话历史生成的 Steam 风格可收集徽章 |
| `kanban/dashboard` | 仪表板标签页 | 用于多智能体调度器的看板界面 UI —— 任务、评论、扇出、看板切换。参见 [Kanban 多智能体](./kanban.md)。 |

内存提供程序（`plugins/memory/*`）和上下文引擎（`plugins/context_engine/*`）在[内存提供程序](./memory-providers.md)页面单独列出——它们分别通过 `hermes memory` 和 `hermes plugins` 管理。以下是两个基于长期运行钩子的插件的详细说明。

### disk-cleanup

自动跟踪并移除会话期间创建的临时文件——测试脚本、临时输出、日志文件、陈旧的 Chrome 配置文件——无需智能体记住调用工具。

**工作原理：**

| 钩子 | 行为 |
|---|---|
| `post_tool_call` | 当 `write_file` / `terminal` / `patch` 在 `HERMES_HOME` 或 `/tmp/hermes-*` 内创建匹配 `test_*`、`tmp_*` 或 `*.test.*` 的文件时，静默地将其跟踪为 `test` / `temp` / `cron-output`。 |
| `on_session_end` | 如果该轮次中自动跟踪了任何测试文件，则运行安全的 `quick` 清理并记录一行摘要。否则保持静默。 |

**删除规则：**

| 类别 | 阈值 | 确认要求 |
|---|---|---|
| `test` | 每次会话结束 | 从不 |
| `temp` | 跟踪后 >7 天 | 从不 |
| `cron-output` | 跟踪后 >14 天 | 从不 |
| HERMES_HOME 下的空目录 | 总是 | 从不 |
| `research` | >30 天，且超过最新 10 个 | 总是（仅限深度清理） |
| `chrome-profile` | 跟踪后 >14 天 | 总是（仅限深度清理） |
| 文件 >500 MB | 永不自动 | 总是（仅限深度清理） |

**斜杠命令** — `/disk-cleanup` 在 CLI 和网关会话中均可用：

```
/disk-cleanup status                     # 分类明细 + 前 10 大文件
/disk-cleanup dry-run                    # 预览，不删除
/disk-cleanup quick                      # 立即运行安全清理
/disk-cleanup deep                       # quick + 列出需要确认的项目
/disk-cleanup track <路径> <类别>        # 手动跟踪
/disk-cleanup forget <路径>              # 停止跟踪（不删除）
```

**状态** — 所有数据存储在 `$HERMES_HOME/disk-cleanup/`：

| 文件 | 内容 |
|---|---|
| `tracked.json` | 跟踪的路径及其类别、大小和时间戳 |
| `tracked.json.bak` | 上述文件的原子写入备份 |
| `cleanup.log` | 追加写入的审计日志，记录每次跟踪 / 跳过 / 拒绝 / 删除操作 |

**安全性** — 清理操作仅处理 `HERMES_HOME` 或 `/tmp/hermes-*` 下的路径。Windows 挂载点（`/mnt/c/...`）会被拒绝。已知的顶级状态目录（`logs/`、`memories/`、`sessions/`、`cron/`、`cache/`、`skills/`、`plugins/`、`disk-cleanup/` 本身）即使为空也不会被移除——全新安装不会在首次会话结束时被清空。

**启用：** `hermes plugins enable disk-cleanup`（或在 `hermes plugins` 界面中勾选）。

**再次禁用：** `hermes plugins disable disk-cleanup`。

### security-guidance

在文件写入时进行快速模式匹配的安全警告。当智能体的 `write_file` / `patch` / `skill_manage` 调用中携带匹配已知危险代码模式的内容时——例如 `pickle.load`、不使用 `SafeLoader` 的 `yaml.load`、`eval(`、`os.system`、`subprocess(..., shell=True)`、JS 的 `child_process.exec`、React 的 `dangerouslySetInnerHTML`、原始 `.innerHTML =` / `.outerHTML =` / `document.write`、Node 的 `crypto.createCipher`、AES ECB 模式、禁用 TLS 验证、易受 XXE 攻击的 `xml.etree` / `minidom` 解析器、没有 SRI 的 `<script src="//..." >`、没有 `weights_only=True` 的 `torch.load`、GitHub Actions `${{ github.event.* }}` 注入——该插件会将一个 `⚠️ 安全指导` 块附加到工具的执行结果中。

文件仍然会被写入。模型在下一轮次的工具消息中读取该警告，然后可以选择修复代码，或记录为何该构造在此上下文中是安全的。模式匹配存在一定的误报率，因此默认行为是警告（而不是阻止）。

**覆盖范围：** 共 25 条规则，涵盖不安全的反序列化、命令注入、XSS 漏洞、加密陷阱、XXE、供应链（SRI）以及 CI/CD 工作流注入。模式数据是对 [Anthropic 的 `claude-plugins-official`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/security-guidance/hooks) 进行的逐字 Apache-2.0 协议分支——有关归属信息，请参阅插件的 `LICENSE` 和 `NOTICE` 文件。

**模式：**

| 环境变量 | 效果 |
|---|---|
| （未设置） | **警告模式**（默认）—— 文件被写入，警告附加到结果中 |
| `SECURITY_GUIDANCE_BLOCK=1` | **阻止模式** —— 写入被拒绝，警告作为阻止原因返回 |
| `SECURITY_GUIDANCE_DISABLE=1` | 关闭开关 —— 插件加载但不执行任何操作 |

**启用：** `hermes plugins enable security-guidance`（或在 `hermes plugins` 界面中勾选）。

**再次禁用：** `hermes plugins disable security-guidance`。

**尚未实现的功能：** 上游的 Anthropic 插件还有另外两层功能——对每个接触文件的智能体轮次进行 LLM 差异审查，以及在提交时进行跨文件数据流追踪的代理审查。目前这两项功能都未移植。智能体已经可以通过 `delegate_task` 按需运行这些审查。

### observability/langfuse

将 Hermes 的轮次、LLM 调用和工具调用追踪到 [Langfuse](https://langfuse.com)——一个开源的 LLM 可观测性平台。每个轮次一个跨度，每次 API 调用一个生成，每次工具调用一个工具观察。使用量总计、按类型的 token 计数和成本估算均来自 Hermes 的规范 `agent.usage_pricing` 数字，因此 Langfuse 仪表板看到的分解（输入 / 输出 / `cache_read_input_tokens` / `cache_creation_input_tokens` / `reasoning_tokens`）与 `hermes logs` 中显示的一致。

该插件采用容错开放设计：未安装 SDK、无凭据或 Langfuse 出现瞬时错误——所有这些情况都会在钩子中变成静默的无操作。智能体循环永远不会受到影响。

**设置：**

```bash
pip install langfuse
hermes plugins enable observability/langfuse
```

或在交互式 `hermes plugins` 界面中勾选。然后将凭据放入 `~/.hermes/.env`：

```bash
HERMES_LANGFUSE_PUBLIC_KEY=pk-lf-...
HERMES_LANGFUSE_SECRET_KEY=sk-lf-...
HERMES_LANGFUSE_BASE_URL=https://cloud.langfuse.com   # 或您的自托管 URL
```

**工作原理：**

| 钩子 | 行为 |
|---|---|
| `pre_api_request` / `pre_llm_call` | 打开（或复用）一个每轮次的根跨度 "Hermes turn"。为此次 API 调用启动一个 `generation` 子观察，并将序列化的近期消息作为输入。 |
| `post_api_request` / `post_llm_call` | 关闭生成，附加 `usage_details`、`cost_details`、`finish_reason`、助手输出和工具调用。如果没有工具调用且内容非空，则关闭该轮次。 |
| `pre_tool_call` | 启动一个 `tool` 子观察，包含经过清理的 `args`。 |
| `post_tool_call` | 关闭工具观察，包含经过清理的 `result`。`read_file` 的有效载荷会被摘要（头部 + 尾部 + 省略的行数），以便大型文件读取保持在 `HERMES_LANGFUSE_MAX_CHARS` 限制内。 |

会话分组基于 Hermes 会话 ID（或子智能体的任务 ID），通过 `langfuse.propagate_attributes` 实现，因此单次 `hermes chat` 会话中的所有内容都位于同一个 Langfuse 会话下。

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
| `HERMES_LANGFUSE_MAX_CHARS` | `12000` | 每个字段的消息内容 / 工具参数 / 工具结果截断长度 |
| `HERMES_LANGFUSE_DEBUG` | `false` | 向 `agent.log` 输出详细的插件日志 |

Hermes 前缀和标准 SDK 环境变量（`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`、`LANGFUSE_BASE_URL`）均可接受——当两者都设置时，Hermes 前缀的优先。

**性能：** Langfuse 客户端在首次钩子调用后被缓存。如果缺少凭据或 SDK，该决定也会被缓存——后续钩子会快速返回，无需重新检查环境变量或重新加载配置。

**禁用：** `hermes plugins disable observability/langfuse`。插件模块仍会被发现，但直到您重新启用前，不会运行任何模块代码。

### google_meet

让智能体能够**加入、转录并参与 Google Meet 通话**——记录会议笔记、会后总结讨论内容、跟进特定事项，并（可选地）通过 TTS 将回复语音输入通话。

**新增功能：**

- 一个无头虚拟参与者，使用浏览器自动化加入 Meet URL
- 通过配置的 STT 提供商对会议音频进行实时转录
- 一套 `meet_summarize` / `meet_speak` / `meet_followup` 工具集，智能体可调用以对其听到的内容采取行动
- 会议结束后产生的制品（转录稿、按发言人归属的笔记、行动项）保存在 `~/.hermes/cache/google_meet/<meeting_id>/` 下

**设置：**

```bash
hermes plugins enable google_meet
# 首次使用时会提示您通过插件的 OAuth 流程登录——
# 需要一个拥有 Meet 访问权限的 Google 帐户。
# 如果会议设置了“仅受邀参与者可加入”，则可能需要主持人批准。
```

从聊天中使用：

> “加入 meet.google.com/abc-defg-hij 并做笔记。通话结束后，给我发送一份包含行动项的摘要。”

智能体启动会议加入，在通话进行时将转录内容流式传输回其上下文，并在会议结束时（或当您告知其停止时）生成一份结构化摘要。

**适用场景：** 定期召开的站立会议，您希望有一个机器人来为异步参与者转录和总结；需要结构化笔记的访谈式会议；以及任何您原本需要使用 Fireflies / Otter / Grain 的场景。如果您不希望 AI 在场监听——就不要启用它。

**禁用：** `hermes plugins disable google_meet`。任何缓存的转录稿和录音将保留在 `~/.hermes/cache/google_meet/` 中，直到您手动删除。

### hermes-achievements

为仪表板添加了一个 **Steam 风格的成就标签页** —— 60 多个可收集、分等级的徽章，根据您真实的 Hermes 会话历史生成。涵盖工具链能力、调试模式、氛围编程连续天数、技能/内存使用情况、模型/提供商多样性、生活风格习惯（周末和夜间会话）。最初由 [@PCinkusz](https://github.com/PCinkusz) 作为外部插件编写；现纳入主仓库，以便与 Hermes 功能变更保持同步。

**工作原理：**

- 在仪表板后端扫描您整个 `~/.hermes/state.db` 的会话历史
- 每个会话的统计信息通过 `(started_at, last_active)` 指纹进行缓存，因此后续扫描仅重新分析新的或已更改的会话
- 首次扫描在后台线程中运行——仪表板永远不会阻塞等待它，即使数据库中有数千个会话
- 解锁状态持久化到 `$HERMES_HOME/plugins/hermes-achievements/state.json`

**等级进度：** 铜 → 银 → 金 → 钻石 → 奥林匹斯。每张卡片都提供一个“计数标准”部分，列出正在跟踪的确切指标。

**成就状态：**

| 状态 | 含义 |
|---|---|
| 已解锁 | 至少达到一个等级 |
| 已发现 | 已知成就，进度可见，尚未获得 |
| 秘密 | 在您的历史记录中检测到第一个相关信号之前隐藏 |

**API** — 路由挂载在 `/api/plugins/hermes-achievements/` 下：

| 端点 | 用途 |
|---|---|
| `GET /achievements` | 完整目录，包含每个徽章的解锁状态（首次冷扫描运行时返回待处理占位符） |
| `GET /scan-status` | 后台扫描器的状态：`idle` / `running` / `failed`、上次耗时、运行次数 |
| `GET /recent-unlocks` | 最近解锁的 20 个徽章，最新在前 |
| `GET /sessions/{id}/badges` | 主要在一个特定会话中获得的徽章 |
| `POST /rescan` | 手动同步重新扫描（阻塞；用于用户点击重新扫描按钮时） |
| `POST /reset-state` | 清除解锁历史和缓存快照 |

**状态文件** — 位于 `$HERMES_HOME/plugins/hermes-achievements/` 下：

| 文件 | 内容 |
|---|---|
| `state.json` | 解锁历史：您获得了哪些徽章以及何时获得。在 Hermes 更新间保持稳定。 |
| `scan_snapshot.json` | 上次完成的扫描有效载荷（仪表板加载时立即提供） |
| `scan_checkpoint.json` | 按指纹键控的每会话统计信息缓存（使热重新扫描快速） |

**性能说明：**

- 对约 8,000 个会话的冷扫描需要几分钟。它在首次仪表板请求时在后台线程中运行；UI 会看到待处理占位符并轮询 `/scan-status`。
- **冷扫描期间的增量结果** —— 扫描器每约 250 个会话发布一次部分快照，因此每次仪表板刷新都会随着扫描进展显示更多徽章解锁，而不是长时间盯着空白界面。
- 热重新扫描会为每个 `started_at` + `last_active` 指纹与检查点匹配的会话复用其统计信息——即使在大型历史记录上也能在几秒内完成。
- 内存中快照 TTL 为 120 秒；过时的请求会立即提供旧快照并触发后台刷新。您永远不会因为 TTL 过期而等待加载动画。

**启用：** 无需额外启用——`hermes-achievements` 是一个纯仪表板插件（无生命周期钩子，无模型可见工具）。它在首次启动时自动注册为 `hermes dashboard` 中的一个标签页。`plugins.enabled` 配置仅控制生命周期/工具插件；仪表板插件纯粹通过其 `dashboard/manifest.json` 进行发现。

**退出：** 删除或重命名 `plugins/hermes-achievements/dashboard/manifest.json`，或使用同名的用户插件覆盖它（在 `~/.hermes/plugins/hermes-achievements/` 中不提供仪表板）。插件在 `$HERMES_HOME/plugins/hermes-achievements/` 下的状态文件会保留——重新安装会保留您的解锁历史。

## 添加捆绑插件

捆绑插件的编写方式与其他Hermes插件完全相同——请参阅[构建Hermes插件](/guides/build-a-hermes-plugin)。唯一的区别是：

- 目录位于 `<repo>/plugins/<name>/`，而非 `~/.hermes/plugins/<name>/`
- 在 `hermes plugins list` 命令中，清单来源会显示为 `bundled`
- 同名用户插件将覆盖捆绑版本

当插件满足以下条件时，适合将其设为捆绑插件：

- 没有可选依赖项（或者它们已是 `pip install .[all]` 的依赖项）
- 其行为对大多数用户有益，且采用“默认启用、可选择退出”的方式，而非“默认禁用、可选择加入”
- 其逻辑涉及生命周期钩子，否则智能体必须记得手动调用
- 它能补充核心功能，但又不会扩展模型可见的工具表面

反例——应保持为用户可安装插件而非捆绑插件的情况包括：需要API密钥的第三方集成、小众工作流、大型依赖树，以及任何会默认显著改变智能体行为的内容。