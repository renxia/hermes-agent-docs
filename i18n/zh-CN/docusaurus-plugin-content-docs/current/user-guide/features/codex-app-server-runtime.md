---
title: Codex 应用服务器运行时（可选）
sidebar_label: Codex 应用服务器运行时
---

# Codex 应用服务器运行时

Hermes 可以选择将 `openai/*` 和 `openai-codex/*` 轮次交给 [Codex CLI 应用服务器](https://github.com/openai/codex) 处理，而不是运行其自身的工具循环。启用后，终端命令、文件编辑、沙盒化和 MCP 工具调用都在 Codex 的运行时内执行——Hermes 成为围绕它的外壳（会话数据库、斜杠命令、网关、记忆和技能审查）。

此功能**仅供选择性启用**。除非您切换该标志，否则默认的 Hermes 行为保持不变。Hermes 永远不会自动将您路由到此运行时。

## 为何使用

- 使用 Codex CLI 所用的相同认证流程，针对您的 **ChatGPT 订阅**运行 OpenAI 智能体轮次（无需 API 密钥）。
- 使用 **Codex 自身的工具集和沙盒**——`shell` 用于终端/读写/搜索，`apply_patch` 用于结构化编辑，`update_plan` 用于规划，所有这些都在 seatbelt/landlock 沙盒中运行。
- **原生 Codex 插件**——通过 `codex plugin` 安装的 Linear、GitHub、Gmail、Calendar、Canva 等——会自动迁移并在您的 Hermes 会话中激活。
- **Hermes 更丰富的工具随之而来**——web_search、web_extract、浏览器自动化、视觉、图像生成、技能和 TTS 通过 MCP 回调工作。Codex 会回传调用 Hermes 来获取其未内置的工具。
- **记忆和技能提示持续有效**——Codex 的事件被投影到 Hermes 的消息结构中，因此自我改进循环看到的是看起来正常的对话记录。

## 模型实际拥有的工具

这是大多数用户首先想知道的部分。当此运行时启用时，执行您回合的模型拥有三个独立的工具来源：

### 1. Codex 的内置工具集（始终启用）

这些随 `codex app-server` 本身一同提供——不涉及 Hermes、MCP 或插件。运行时启动后，以下五个工具立即可用：

- **`shell`** — 在沙箱内运行任意 shell 命令。这是模型读取文件（`cat`、`head`、`tail`）、写入文件（`echo > foo`、heredocs）、搜索文件（`find`、`rg`、`grep`）、导航目录（`ls`、`cd`）、运行构建、管理进程以及在 bash 中执行任何其他操作的方式。
- **`apply_patch`** — 以 Codex 的补丁格式应用结构化的多文件差异。模型将此用于非简单的代码编辑（添加函数、跨文件重构）；shell heredocs 仍可用于一次性写入。
- **`update_plan`** — codex 内部的待办事项/计划跟踪器。相当于 Hermes 的 `todo` 工具，但完全在 codex 的运行时内管理。
- **`view_image`** — 将本地图像文件加载到对话中，以便模型可以看到它。
- **`web_search`** — codex 在配置后拥有自己的内置网络搜索。Hermes 也通过下面的回调函数暴露 `web_search`（由 Firecrawl 支持）；模型会选择它偏好的那个。

因此，**任何您通过终端可以做的事情——读取/写入/搜索/查找/运行——codex 都能原生完成**。沙箱配置文件（启用运行时默认为 `:workspace`）控制哪些是可写的。

### 2. 原生 Codex 插件（从您的 `codex plugin` 安装自动迁移）

当您启用运行时，Hermes 会查询 codex 的 `plugin/list` RPC，并为您安装的每个插件写入一个 `[plugins."<name>@openai-curated"]` 条目。插件本身由 codex 管理，并通过 codex 自身的 UI 进行一次性授权。

示例（OpenClaw 线程中强调为"值得做成 YouTube 视频"的那些）：

- **Linear** — 查找/更新问题
- **GitHub** — 搜索代码、查看 PR、评论
- **Gmail** — 读取/发送邮件
- **Google 日历** — 创建/查找活动
- **Outlook 日历/邮件** — 通过 Microsoft 连接器实现类似功能
- **Canva** — 设计生成
- ...以及您通过 `codex plugin marketplace add openai-curated` + `codex plugin install ...` 安装的任何其他工具。

**未迁移的内容：**
- 您尚未安装的插件——请先在 Codex 中安装它们。
- ChatGPT 应用商店条目（`app/list`）——这些已通过您的账户认证在 codex 内启用。

### 3. Hermes 工具回调（MCP 服务器，在 `~/.codex/config.toml` 中注册）

Hermes 将自身注册为 MCP 服务器，以便 codex 可以回调获取 codex 未提供的工具。通过回调可用的工具有：

- **`web_search`** / **`web_extract`** — 由 Firecrawl 支持；对于结构化内容，通常比抓取更简洁。
- **`browser_navigate` / `browser_click` / `browser_type` / `browser_press` / `browser_snapshot` / `browser_scroll` / `browser_back` / `browser_get_images` / `browser_console` / `browser_vision`** — 通过 Camofox 或 Browserbase 实现完整的浏览器自动化。
- **`vision_analyze`** — 调用单独的视觉模型来检查图像（不同于 codex 的 `view_image`，后者将图像加载到对话中）。
- **`image_generate`** — 通过 Hermes 的 image_gen 插件链生成图像。
- **`skill_view` / `skills_list`** — 从 Hermes 的技能库中读取。
- **`text_to_speech`** — 通过 Hermes 配置的提供者实现 TTS。

当模型需要这些工具时，codex 会通过 stdio MCP 生成 `hermes_tools_mcp_server` 子进程，调用通过 `model_tools.handle_function_call()` 分派（与 Hermes 默认运行时相同的代码路径），结果像任何其他 MCP 响应一样返回给 codex。

### 此运行时上不可用的工具

以下四个 Hermes 工具需要正在运行的 AIAgent 上下文（循环中状态）来分派，而无状态的 MCP 回调无法驱动它们。当您需要其中任何工具时，请切换回默认运行时（`/codex-runtime auto`）：

- **`delegate_task`** — 生成子智能体
- **`memory`** — Hermes 的持久化内存存储
- **`session_search`** — 跨会话搜索
- **`todo`** — Hermes 的待办事项存储（codex 的 `update_plan` 是运行时内的等效工具）

## 工作流特性（`/goal`、看板、定时任务）

### `/goal`（Ralph 循环）

**在此运行时上有效。** 目标在 `state_meta` 中按会话 ID 持久化，延续提示通过 `run_conversation()` 作为普通用户消息反馈，codex 原生执行下一回合。目标判定器通过辅助客户端运行（在 config.yaml 中通过 `auxiliary.goal_judge` 配置），独立于活动的运行时。如果 codex 在审批上停滞不前，判定器的"已阻塞，需要用户输入"裁决是一个干净的退出点。

**需要意识到的一点：** 每个延续提示都是一个全新的 codex 回合，这意味着 codex 会从头重新评估命令审批策略。如果您正在执行一个包含大量写入操作的长期运行目标，请预期比单个会话内任务看到更多的审批提示。设置 `default_permissions = ":workspace"`（当您启用运行时时，Hermes 会自动执行此操作），这样简单的工作区写入就不需要提示。

### 看板（多智能体工作树分派）

**在此运行时上有效，但存在一个微妙的依赖关系。** 看板调度器将每个工作线程生成为一个单独的 `hermes chat -q` 子进程，该子进程读取用户的配置——这意味着如果全局设置了 `model.openai_runtime: codex_app_server`，工作线程也将在 codex 运行时上启动。

在 codex 运行时工作线程内有效的内容：
- Codex 的完整工具集（shell、apply_patch、update_plan、view_image、web_search）——工作线程原生地执行其实际任务
- 迁移后的 codex 插件——Linear、GitHub 等
- 用于 browser_*、vision、image_gen、skills、TTS 的 Hermes 工具回调

由于 MCP 回调暴露了它们，以下内容也同样有效：
- **`kanban_complete` / `kanban_block` / `kanban_comment` / `kanban_heartbeat`** — 工作线程交接工具。这些工具从环境变量 `HERMES_KANBAN_TASK`（由调度器设置）中读取，正确控制访问，并写入由 `HERMES_KANBAN_DB` 固定的每板 SQLite 数据库。如果没有回调中的这些工具，此运行时上的工作线程可以执行其任务，但无法报告返回，会一直挂起直到调度器超时。
- **`kanban_show` / `kanban_list`** — 只读板查询，供工作线程检查其自身上下文。
- **`kanban_create` / `kanban_unblock` / `kanban_link`** — 仅限编排器的操作。适用于运行在 codex 运行时上、需要分派新任务的编排器智能体。

看板工具由调度器设置的 `HERMES_KANBAN_TASK` 环境变量控制——该变量会传播到 codex 子进程（codex 继承环境变量），并从那里传播到生成的 `hermes-tools` MCP 服务器子进程。因此，工具可以看到正确的任务 ID 并正确进行访问控制。对于 Codex app-server 工作线程，当存在 `HERMES_KANBAN_TASK` 时，Hermes 还会传递窄范围的 app-server 沙箱覆盖：保持 `workspace-write` 沙箱，将**板数据库目录以及调度器固定的每个看板路径**添加为额外的可写根目录（`HERMES_KANBAN_WORKSPACES_ROOT`、`HERMES_KANBAN_WORKSPACE`、旧版 `HERMES_KANBAN_ROOT` — 去重，DB 目录优先），并默认保持网络禁用。这避免了脆弱的 `:danger-no-sandbox` 解决方案，同时允许 `kanban_complete` / `kanban_block` 更新板数据库，**并且**允许工作线程在位于数据库目录之外的工作区挂载点下写入报告/工件（例如单独驱动器上的 `/media/.../kanban-workspaces/...` — [issue #27941](https://github.com/NousResearch/hermes-agent/issues/27941)）。

### 定时任务

**未经专门测试。** 定时任务通过 `cronjob` → `AIAgent.run_conversation` 运行，与 CLI 相同的代码路径。如果定时任务的配置中设置了 `openai_runtime: codex_app_server`，它将在 codex 上运行。相同的工具可用性规则适用——codex 内置工具 + 插件 + MCP 回调有效，智能体循环工具（delegate_task、memory、session_search、todo）无效。如果您的定时任务依赖于后者，请将定时任务限定到使用默认运行时的配置文件。

## 权衡

| | Hermes 默认运行时 | Codex app-server（选择启用） |
|---|---|---|
| `delegate_task` 子智能体 | 是 | 不可用——需要智能体循环上下文 |
| `memory`、`session_search`、`todo` | 是 | 不可用——需要智能体循环上下文 |
| `web_search`、`web_extract` | 是 | 是（通过 MCP 回调） |
| 浏览器自动化（Camofox/Browserbase） | 是 | 是（通过 MCP 回调） |
| `vision_analyze`、`image_generate` | 是 | 是（通过 MCP 回调） |
| `skill_view`、`skills_list` | 是 | 是（通过 MCP 回调） |
| `text_to_speech` | 是 | 是（通过 MCP 回调） |
| Codex `shell`（终端/读/写/搜索/查找/运行） | — | 是（Codex 内置） |
| Codex `apply_patch`（结构化多文件编辑） | — | 是（Codex 内置） |
| Codex `update_plan`（运行时内待办事项） | — | 是（Codex 内置） |
| Codex `view_image`（将图像加载到对话中） | — | 是（Codex 内置） |
| Codex 沙箱（seatbelt/landlock，配置文件） | — | 是（Codex 内置） |
| ChatGPT 订阅认证 | — | 是（通过 `openai-codex` 提供者） |
| 原生 Codex 插件（Linear、GitHub 等） | — | 是（自动迁移） |
| 用户 MCP 服务器 | 是 | 是（自动迁移到 codex） |
| 记忆 + 技能审查（后台） | 是 | 是（通过项目投影） |
| 多轮对话 | 是 | 是 |
| `/goal`（Ralph 循环） | 是 | 是 |
| 看板工作线程分派 | 是 | 是（通过回调） |
| 看板编排器工具 | 是 | 是（通过回调） |
| 所有网关平台 | 是 | 是 |
| 非 OpenAI 提供者 | 是 | 不适用——限定于 OpenAI/Codex |

# 为 Codex 启用运行时

## 前提条件

1. **已安装 Codex CLI：**
   ```bash
   npm i -g @openai/codex
   codex --version   # 0.130.0 或更新版本
   ```
2. **Codex OAuth 登录。** Codex 子进程会读取 `~/.codex/auth.json`。有两种方式来填充它：
   ```bash
   codex login                  # 将令牌写入 ~/.codex/auth.json
   ```
   Hermes 自己的 `hermes auth login codex` 会写入 `~/.hermes/auth.json` — 这是一个独立的会话。如果您尚未登录，请**单独运行 `codex login`**。

3. **（可选）安装您想要的 Codex 插件。** 当您启用该运行时，Hermes 会自动迁移您已通过 Codex CLI 安装的任何精选插件：
   ```bash
   codex plugin marketplace add openai-curated
   # 然后通过 codex 的文本用户界面，安装 Linear / GitHub / Gmail 等
   ```
   Hermes 会通过查询 Codex 的 `plugin/list` RPC 发现它们，并将 `[plugins."<name>@openai-curated"]` 条目自动写入 `~/.codex/config.toml`。

## 启用

在 Hermes 会话中：

```
/codex-runtime codex_app_server
```

该命令会：
- 验证 `codex` CLI 是否已安装（如果未安装，会阻止并给出安装提示）。
- 将 `model.openai_runtime: codex_app_server` 持久化到您的 config.yaml 中。
- 将用户 MCP 服务器从 `~/.hermes/config.yaml` 迁移到 `~/.codex/config.toml`。
- **发现并迁移已安装的原生 Codex 插件**（Linear、GitHub、Gmail、日历、Canva 等），通过查询 Codex 的 `plugin/list` RPC 实现。
- **将 Hermes 自己的工具注册为一个 MCP 服务器**，以便 Codex 子进程可以回调获取 Codex 未附带的工具。
- **写入 `default_permissions = ":workspace"`**，以便沙箱允许在工作区内写入，而无需为每个操作提示。
- 告知您迁移了哪些内容。更改将在**下一个**会话生效 — 当前缓存的智能体会保持先前的运行时，以便提示缓存保持有效。

同义词：`/codex-runtime on`、`/codex-runtime off`、`/codex-runtime auto`。

要检查当前状态而不做任何更改：
```
/codex-runtime
```

您也可以在 `~/.hermes/config.yaml` 中手动设置：
```yaml
model:
  openai_runtime: codex_app_server   # 默认为 "auto"（即 Hermes 运行时）
```

## 自我改进循环（记忆 + 技能微调）

Hermes 的后台自我改进在达到计数阈值时触发：

- 每 10 个用户提示 → 一个分叉的审查智能体会查看对话，判断是否有任何内容应保存到记忆。
- 每 10 次单轮内的工具迭代 → 同样的逻辑，但针对技能（通过 `skill_manage` 写入）。

**两者在 Codex 运行时上均持续工作。** Codex 路径将每个完成的 `commandExecution` / `fileChange` / `mcpToolCall` / `dynamicToolCall` 项投射为一个合成的 `assistant tool_call` + `tool` 结果消息，因此当审查运行时，它看到的形状与在默认 Hermes 运行时上看到的相同。

接线如何保持等效：

| | 默认运行时 | Codex 运行时 |
|---|---|---|
| `_turns_since_memory` 递增 | 每次用户提示，在 `run_conversation` 循环之前 | 相同代码路径，在提前返回之前 |
| `_iters_since_skill` 递增 | 每次聊天补全循环中的工具迭代 | 在 Codex 轮次返回后，由 `turn.tool_iterations` 处理 |
| 记忆触发 (`_turns_since_memory >= _memory_nudge_interval`) | 在循环前计算，在响应后触发 | 在循环前计算，传递给 Codex 辅助函数 |
| 技能触发 (`_iters_since_skill >= _skill_nudge_interval`) | 在循环后计算 | 在 Codex 轮次后计算 |
| `_spawn_background_review(messages_snapshot=..., review_memory=..., review_skills=...)` | 当任一触发器触发时调用 | 当任一触发器触发时以相同方式调用 |

一个细节：审查分叉本身需要调用 Hermes 的智能体循环工具（`memory`、`skill_manage`），这些工具需要 Hermes 自己的调度。因此，当父智能体位于 `codex_app_server` 上时，审查分叉会**降级为 `codex_responses`** — 使用相同的 OAuth 凭据，相同的 `openai-codex` 提供商，但直接与 OpenAI 的 Responses API 通信，以便 Hermes 拥有循环且智能体循环工具能正常工作。这对用户是透明的。

净效果：启用 Codex 运行时，你的记忆和技能微调将完全像往常一样继续触发。

## 审批如何工作

Codex 在执行命令或应用补丁前会请求批准。这些会被转换为 Hermes 标准的“危险命令”提示：

```
╭───────────────────────────────────────╮
│ 危险命令                              │
│                                       │
│ /bin/bash -lc 'echo hello > foo.txt'  │
│                                       │
│ ❯ 1. 允许一次                          │
│   2. 允许本次会话                      │
│   3. 拒绝                             │
│                                       │
│ Codex 请求在 /your/cwd 执行            │
╰───────────────────────────────────────╯
```

- **允许一次** → 批准此单条命令。
- **允许本次会话** → Codex 将不会为类似命令再次提示。
- **拒绝** → 命令被拒绝；Codex 以只读模式继续。

对于 `apply_patch`（文件编辑）审批，当 Codex 通过相应的 `fileChange` 项提供数据时，Hermes 会显示更改摘要（`1 个添加，1 个更新：/tmp/new.py, /tmp/old.py`）。

## 权限配置文件

Codex 有三个内置权限配置文件：
- `:read-only` — 无写入；每条 shell 命令都需要批准
- `:workspace` — 允许在当前工作区内写入，无需提示（启用运行时时 Hermes 的默认设置）
- `:danger-no-sandbox` — 完全无沙箱（除非你理解其含义，否则不要使用）

你可以在 Hermes 管理的块之外，在 `~/.codex/config.toml` 中覆盖默认设置：

```toml
default_permissions = ":read-only"
```

（只要你的覆盖位于 `# managed by hermes-agent` 标记之外，Hermes 在重新迁移时会保留它。）

## 辅助任务和 ChatGPT 订阅令牌成本

当此运行时使用 `openai-codex` 提供商时，**辅助任务（标题生成、上下文压缩、视觉自动检测、后台自我改进审查分叉）默认也会流经你的 ChatGPT 订阅**，因为 Hermes 的辅助客户端在没有设置每任务覆盖时，会使用主提供商/模型。

这并非 `codex_app_server` 特有的 — 对于现有的 `codex_responses` 路径也是如此 — 但在这里更显眼，因为你明确选择了订阅计费。

要将特定辅助任务路由到更便宜/不同的模型，请在 `~/.hermes/config.yaml` 中设置显式覆盖：

```yaml
auxiliary:
  title_generation:
    provider: openrouter
    model: google/gemini-3-flash-preview
  context_compression:
    provider: openrouter
    model: google/gemini-3-flash-preview
  vision_detect:
    provider: openrouter
    model: google/gemini-3-flash-preview
  goal_judge:
    provider: openrouter
    model: google/gemini-3-flash-preview
```

自我改进审查分叉通过 `_current_main_runtime()` 继承主运行时，Hermes 会自动将其从 `codex_app_server` 降级为 `codex_responses`（这样分叉才能实际调用 `memory` 和 `skill_manage` — Hermes 自己的智能体循环工具）。该分叉仍然使用你的订阅认证，除非你已将辅助任务路由到其他地方。

## 安全编辑 `~/.codex/config.toml`

Hermes 在两个标记注释之间包裹它管理的所有内容：

```toml
# managed by hermes-agent — `hermes codex-runtime migrate` regenerates this section
default_permissions = ":workspace"
[mcp_servers.filesystem]
...
[plugins."github@openai-curated"]
...
# end hermes-agent managed section
```

在该块**之外**的任何内容都是你自己的。重新运行迁移（通过 `/codex-runtime codex_app_server` 或当你切换运行时开启时）会就地替换受管理的块，但会逐字保留其上下的用户内容。这意味着你可以：

- 添加 Hermes 不知道的你自己的 MCP 服务器
- 如果你更喜欢被提示，可以将 `default_permissions` 覆盖为 `:read-only`
- 配置仅 Codex 的选项（模型、提供商、otel 等）
- 在 `[permissions.<name>]` 表中添加用户定义的权限配置文件

你添加到受管理块**内部**的任何内容都将在下次迁移时被覆盖。如果你需要一个需要编辑受管理块的调整，请提交一个问题，我们会添加相应的开关。

## 多配置文件/多租户设置

默认情况下，无论哪个 Hermes 配置文件处于活动状态，Hermes 都会将 Codex 子进程指向 `~/.codex/`。这意味着 `hermes -p work` 和 `hermes -p personal` 共享相同的 Codex 认证、插件和配置。对大多数用户来说，这是正确的行为 — 它与直接运行 `codex` CLI 的行为一致。

如果你想要每个配置文件的 Codex 隔离（独立的认证、独立安装的插件、独立的配置），请为每个配置文件显式设置 `CODEX_HOME`。最干净的方法是指向你 `HERMES_HOME` 下的一个目录：

```bash
# 在 work 配置文件内，你可能会包装 hermes：
CODEX_HOME=~/.hermes/profiles/work/codex hermes chat
```

你需要在设置了该 `CODEX_HOME` 的情况下运行一次 `codex login`，以便 OAuth 令牌落在配置文件范围的位置。之后，`hermes -p work` 将在隔离的 Codex 状态上运行。

我们没有自动执行此范围界定，因为移动现有用户的 `~/.codex/` 会默默地使其 Codex CLI 认证失效 — 任何已经运行过 `codex login` 的用户都将不得不重新进行身份验证。选择加入比让用户感到意外更安全。

## HOME 环境变量透传

Hermes 在生成 codex app-server 子进程时**不会**重写 `HOME`（我们使用 `os.environ.copy()` 并且只覆盖 `CODEX_HOME` 和 `RUST_LOG`）。这意味着：

- Codex 通过其 `shell` 工具运行的命令会看到真实的用户 `HOME`，并能正确找到 `~/.gitconfig`、`~/.gh/`、`~/.aws/`、`~/.npmrc` 等。
- Codex 的内部状态通过 `CODEX_HOME`（默认指向 `~/.codex/`）保持隔离。

这符合 OpenClaw 在早期实验后得出的边界：隔离 Codex 的状态，不打扰用户的家目录。（参见 openclaw/openclaw#81562。）

## MCP 服务器迁移

Hermes 的 `mcp_servers` 配置会被自动转换为 Codex 期望的 TOML 格式。迁移在每次你启用运行时时运行，并且是幂等的 — 重新运行会替换受管理的部分，但会保留任何用户编辑的 Codex 配置。

什么会被转换：

| Hermes (`config.yaml`) | Codex (`config.toml`) |
|---|---|
| `command` + `args` + `env` | stdio 传输 |
| `url` + `headers` | streamable_http 传输 |
| `timeout` | `tool_timeout_sec` |
| `connect_timeout` | `startup_timeout_sec` |
| `enabled: false` | `enabled = false` |

什么不会被迁移：
- Hermes 特有的键，如 `sampling`（Codex 的 MCP 客户端没有等价物 — 这些会随每个服务器的警告一起被丢弃）。

## 原生 Codex 插件迁移

通过 `codex plugin` 安装的插件（如 Linear、GitHub、Gmail、Calendar、Canva 等）通过 Codex 的 `plugin/list` RPC 发现。对于每个 `installed: true` 的插件，Hermes 会写入一个 `[plugins."<name>@openai-curated"]` 代码块，在您的 Hermes 会话中启用它。

这意味着：当您的朋友说“我在 Codex CLI 中设置了 Calendar 和 GitHub”并且他们启用了 Hermes 的 codex 运行时，Hermes 会自动激活这些插件。无需重新配置。

未迁移的内容：
- 您尚未安装的插件 — 请先在 Codex 中安装它们。
- Codex 报告 `availability != AVAILABLE` 的插件（安装损坏、OAuth 过期、已从市场移除等）。为避免写入会在激活时失败的配置，这些插件会被跳过。
- ChatGPT 应用商店条目（每个账户的 `app/list` 结果 — 这些已通过您的账户认证在 codex 内启用）。
- 插件 OAuth — 您在 Codex 本身中授权每个插件一次；Hermes 不处理凭证。

## Hermes 工具回调（新的 MCP 服务器）

Codex 的内置工具集涵盖 shell/文件操作/补丁，但没有网络搜索、浏览器自动化、视觉、图像生成等功能。为了在 codex 交互中保持这些功能可用，Hermes 将自己注册为 `~/.codex/config.toml` 中的 MCP 服务器：

```toml
[mcp_servers.hermes-tools]
command = "/path/to/python"
args = ["-m", "agent.transports.hermes_tools_mcp_server"]
env = { HERMES_HOME = "/your/.hermes", PYTHONPATH = "...", HERMES_QUIET = "1" }
startup_timeout_sec = 30.0
tool_timeout_sec = 600.0
```

当模型调用 `web_search`（或另一个暴露的 Hermes 工具）时，codex 通过 stdio 生成 `hermes_tools_mcp_server` 子进程，请求通过 `model_tools.handle_function_call()` 分发，结果像任何其他 MCP 响应一样投射回 codex。

**可通过回调使用的工具：** `web_search`、`web_extract`、`browser_navigate`、`browser_click`、`browser_type`、`browser_press`、`browser_snapshot`、`browser_scroll`、`browser_back`、`browser_get_images`、`browser_console`、`browser_vision`、`vision_analyze`、`image_generate`、`skill_view`、`skills_list`、`text_to_speech`。

**不可用的工具：** `delegate_task`、`memory`、`session_search`、`todo`。这些需要运行中的 AIAgent 上下文来分发（循环中间状态），而无状态的 MCP 回调无法驱动它们。当您需要这些时，请使用默认的 Hermes 运行时（`/codex-runtime auto`）。

## 禁用

随时切回：

```
/codex-runtime auto
```

在下一个会话中生效。Codex 托管的代码块保留在 `~/.codex/config.toml` 中，因此您可以稍后重新启用而不会丢失配置 — 或者如果您愿意，可以手动删除它。

## 局限性

此运行时为**选择加入测试版**。基于 Hermes Agent 2026.5 + Codex CLI 0.130.0 验证：

- 多轮对话
- 通过 Hermes UI 进行 `commandExecution` 和 `fileChange`（apply_patch）批准
- MCP 工具调用（通过 `@modelcontextprotocol/server-filesystem` 和新的 `hermes-tools` 回调验证）
- 原生 Codex 插件迁移（通过 Linear / GitHub / Calendar 库存验证）
- 拒绝/取消路径
- 开关切换循环
- 记忆和技能提示计数器（通过集成测试实时验证）
- 通过 codex 的 Hermes web_search（实时验证："OpenAI Codex CLI – Getting Started" 端到端返回）

已知限制：

- **Hermes 认证和 codex 认证是分开的会话。** 为了获得最顺畅的用户体验，您需要同时执行 `codex login` 和 `hermes auth login codex`（运行时使用 codex 的会话进行 LLM 调用）。这是 Hermes `_import_codex_cli_tokens` 中有意的设计选择 — Hermes 不会与 codex CLI 共享 OAuth 状态，以避免在令牌刷新时相互干扰。
- **在此运行时上，`delegate_task`、`memory`、`session_search`、`todo` 不可用。** 它们需要运行中的 AIAgent 上下文，而无状态的 MCP 回调无法提供。当您需要这些时，请使用 `/codex-runtime auto`。
- **当 codex 不跟踪变更集时，批准提示中不会内联显示补丁预览。** Codex 的 `fileChange` 批准参数并不总是携带变更集。Hermes 会在可能的情况下缓存来自相应 `item/started` 通知的数据，但如果批准在该项目流式传输之前到达，提示会回退到 codex 提供的任何 `reason`。
- **不能保证亚秒级取消。** 流中断（在 codex 响应时按 Ctrl+C）通过 `turn/interrupt` 发送，但如果 codex 已经刷新了最终消息，您仍会收到响应。

如果您发现错误，请[提交问题](https://github.com/NousResearch/hermes-agent/issues)，并附上 `hermes logs --since 5m` 的输出。在标题中提及 `codex-runtime` 以便于分类。

## 架构

```
                ┌─── Hermes shell (CLI / TUI / gateway) ───┐
                │  会话数据库 · 斜杠命令 · 记忆            │
                │  & 技能审查 · 定时任务 · 会话选择器       │
                └──┬──────────────────────────────────────┬┘
                   │ user_message               最终       │
                   ▼                            文本 +     │
        ┌──────────────────────────────────┐   投射的      │
        │  AIAgent.run_conversation()       │   消息        │
        │   if api_mode == codex_app_server │              │
        │     → CodexAppServerSession       │              │
        │   else: chat_completions / codex_responses (默认)
        └────┬─────────────────────────────┘              │
             │ 通过 stdio 的 JSON-RPC                     │
             ▼                                            │
        ┌──────────────────────────────────┐              │
        │  codex app-server (子进程)         │──────────────┘
        │   thread/start, turn/start        │
        │   item/* 通知                     │
        │   shell + apply_patch + update_plan│
        │   view_image + sandbox            │
        │   ┌─────────────────────────┐     │
        │   │  MCP 客户端             │     │
        │   │  ├─ 用户 MCP 服务器     │     │
        │   │  ├─ 原生插件            │     │
        │   │  │   (linear, github,   │     │
        │   │  │    gmail, calendar,  │     │
        │   │  │    canva, ...)       │     │
        │   │  └─ hermes-tools ───────┼─────────────────┐
        │   │       (回调至           │     │           │
        │   │        Hermes 更丰富的  │     │           │
        │   │        工具)            │     │           │
        │   └─────────────────────────┘     │           │
        └──────────────────────────────────┘           │
                                                        │
                                                        ▼
        ┌──────────────────────────────────────────────────────────┐
        │  hermes_tools_mcp_server.py (按需生成的子进程)              │
        │   web_search, web_extract, browser_*, vision_analyze,    │
        │   image_generate, skill_view, skills_list, text_to_speech│
        └──────────────────────────────────────────────────────────┘
```

有关实现细节，请参阅 [PR #24182](https://github.com/NousResearch/hermes-agent/pull/24182) 和 [Codex app-server 协议 README](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md)。