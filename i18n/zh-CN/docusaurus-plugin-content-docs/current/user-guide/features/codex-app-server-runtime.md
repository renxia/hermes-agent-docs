---
title: Codex App-Server Runtime (optional)
sidebar_label: Codex App-Server Runtime
---

# Codex App-Server Runtime

Hermes 可以选择性地将 `openai/*` 和 `openai-codex/*` 的轮次交给 [Codex CLI app-server](https://github.com/openai/codex) 来处理，而非运行自身的工具循环。启用后，终端命令、文件编辑、沙箱隔离以及 MCP 工具调用都将在 Codex 的运行时内执行——Hermes 则成为包裹其外的外壳（会话数据库、斜杠命令、网关、记忆和技能审查）。

此为**仅可选启用**。除非你手动切换该标志，否则 Hermes 的默认行为不会改变。Hermes 绝不会自动将你的会话路由到此运行时。

:::tip
未使用 OpenAI Codex？`hermes setup --portal` 可通过一步操作配置使用 Claude/Gemini 等非 Codex 后端。参见 [Nous Portal](/integrations/nous-portal)。
:::

## 使用原因

- 使用 **ChatGPT 订阅**运行 OpenAI 智能体轮次（无需 API 密钥），采用与 Codex CLI 相同的认证流程。
- 使用 **Codex 自身的工具集和沙箱**——`shell` 用于终端/读取/写入/搜索，`apply_patch` 用于结构化编辑，`update_plan` 用于规划，均在 seatbelt/landlock 沙箱内运行。
- **原生 Codex 插件**——Linear、GitHub、Gmail、Calendar、Canva 等——通过 `codex plugin` 安装后会自动迁移并在你的 Hermes 会话中激活。
- **Hermes 更丰富的工具一并提供**——web_search、web_extract、浏览器自动化、视觉、图像生成、技能和 TTS 通过 MCP 回调工作。Codex 对未内置的工具会回调至 Hermes 获取。
- **记忆和技能提示保持生效**——Codex 的事件被投射到 Hermes 的消息形态中，使自我改进循环看到一份看似正常的对话记录。

## 模型实际拥有的工具

这是大多数用户首先想了解的部分。当此运行时开启时，执行你这一轮的模型拥有三个独立的工具来源：

### 1. Codex 的内置工具集（始终开启）

这些随 `codex app-server` 本身一起提供——不涉及 Hermes、不涉及 MCP、不涉及插件。运行时启动后立即可用全部五个工具：

- **`shell`** — 在沙箱内运行任意 shell 命令。模型通过它来读取文件（`cat`、`head`、`tail`）、写入文件（`echo > foo`、heredocs）、搜索文件（`find`、`rg`、`grep`）、浏览目录（`ls`、`cd`）、运行构建、管理进程，以及执行你会在 bash 中做的任何其他操作。
- **`apply_patch`** — 以 Codex 的补丁格式应用结构化的多文件 diff。模型用它来进行非平凡的代码编辑（添加函数、跨文件重构）；对于一次性写入，shell heredocs 仍然可用。
- **`update_plan`** — Codex 内部的待办/计划追踪器。相当于 Hermes 的 `todo` 工具，但完全在 Codex 运行时内部管理。
- **`view_image`** — 将本地图像文件加载到对话中，使模型可以看到它。
- **`web_search`** — 配置后 Codex 拥有自己的内置网络搜索。Hermes 还通过下面的回调暴露了 `web_search`（基于 Firecrawl）；模型选择它更偏好的那个。

因此，**任何你会通过终端执行的操作——读/写/搜索/查找/运行——Codex 都能原生完成**。沙箱配置文件（启用运行时默认为 `:workspace`）控制哪些路径可写。

### 2. 原生 Codex 插件（从你的 `codex plugin` 安装自动迁移）

当你启用运行时时，Hermes 会查询 Codex 的 `plugin/list` RPC，并为每个已安装的插件写入一个 `[plugins."<name>@openai-curated"]` 条目。插件本身由 Codex 管理，并通过 Codex 自己的 UI 完成一次授权。

示例（OpenClaw 帖子中称之为"值得做 YouTube 视频"的那些）：

- **Linear** — 查找/更新 issue
- **GitHub** — 搜索代码、查看 PR、评论
- **Gmail** — 读取/发送邮件
- **Google Calendar** — 创建/查找事件
- **Outlook 日历/邮件** — 通过 Microsoft 连接器实现相同的功能
- **Canva** — 设计生成
- ...以及你通过 `codex plugin marketplace add openai-curated` + `codex plugin install ...` 安装的任何其他插件

不会被迁移的内容：
- 你尚未安装的插件——请先在 Codex 中安装它们。
- ChatGPT 应用市场条目（`app/list`）——这些已通过你的账户认证在 Codex 内部启用。

### 3. Hermes 工具回调（MCP 服务器，在 `~/.codex/config.toml` 中注册）

Hermes 将自身注册为 MCP 服务器，以便 Codex 可以回调调用 Codex 未内置的工具。通过回调可用：

- **`web_search`** / **`web_extract`** — 基于 Firecrawl；对于结构化内容，通常比直接抓取更干净。
- **`browser_navigate` / `browser_click` / `browser_type` / `browser_press` / `browser_snapshot` / `browser_scroll` / `browser_back` / `browser_get_images` / `browser_console` / `browser_vision`** — 通过 Camofox 或 Browserbase 实现的完整浏览器自动化。
- **`vision_analyze`** — 调用独立的视觉模型来检查图像（不同于 Codex 的 `view_image`，后者是将图像加载到对话中）。
- **`image_generate`** — 通过 Hermes 的 image_gen 插件链生成图像。
- **`skill_view` / `skills_list`** — 读取 Hermes 的技能库。
- **`text_to_speech`** — 通过 Hermes 配置的提供商实现 TTS。

当模型需要这些工具之一时，Codex 通过 stdio MCP 生成 `hermes_tools_mcp_server` 子进程，调用通过 `model_tools.handle_function_call()` 分发（与 Hermes 默认运行时的代码路径相同），结果作为标准 MCP 响应返回给 Codex。

### 此运行时不可用的工具

以下四个 Hermes 工具需要运行中的 AIAgent 上下文（循环内状态）来分发，而无状态的 MCP 回调无法驱动它们。需要其中任何一个时，请切换回默认运行时（`/codex-runtime auto`）：

- **`delegate_task`** — 生成子智能体
- **`memory`** — Hermes 的持久化记忆存储
- **`session_search`** — 跨会话搜索
- **`todo`** — Hermes 的待办存储（Codex 的 `update_plan` 是运行时的等价物）

## 工作流功能（`/goal`、看板、定时任务）

### `/goal`（Ralph 循环）

**在此运行时上可用。** 目标以会话 ID 为键持久化存储在 `state_meta` 中，延续提示作为普通用户消息通过 `run_conversation()` 反馈回去，Codex 原生执行下一轮。目标评判器通过辅助客户端运行（在 config.yaml 中通过 `auxiliary.goal_judge` 配置），独立于当前活跃的运行时。当 Codex 在审批上停滞时，评判器的"被阻止，需要用户输入"判定是一个干净的退出方式。

**需要注意的一点：** 每个延续提示都是一个新的 Codex 轮次，这意味着 Codex 会从头重新评估命令审批策略。如果你正在执行一个涉及大量写入的长期目标，预计会看到比单一会话任务更多的审批提示。设置 `default_permissions = ":workspace"`（Hermes 在启用运行时自动完成此操作），这样简单的工作区写入不需要提示。

### 看板（多智能体 worktree 分发）

**在此运行时上可用，但有一个微妙的依赖。** 看板分发器将每个工作者作为独立的 `hermes chat -q` 子进程生成，该进程读取用户的配置——这意味着如果 `model.openai_runtime: codex_app_server` 被全局设置，工作者也会在 Codex 运行时上启动。

在 Codex 运行时工作者内部可用的功能：
- Codex 的完整工具集（shell、apply_patch、update_plan、view_image、web_search）— 工作者原生执行其实际任务工作
- 已迁移的 Codex 插件——Linear、GitHub 等
- 用于浏览器_*、视觉、image_gen、技能、TTS 的 Hermes 工具回调

由于 MCP 回调暴露了它们，同样可用的功能：
- **`kanban_complete` / `kanban_block` / `kanban_comment` / `kanban_heartbeat`** — 工作者交接工具。这些工具从环境变量 `HERMES_KANBAN_TASK` 读取（由分发器设置），正确控制访问权限，并写入由 `HERMES_KANBAN_DB` 固定的每个看板 SQLite 数据库。如果回调中没有这些工具，此运行时上的工作者可以完成任务但无法报告，直到分发器超时。
- **`kanban_show` / `kanban_list`** — 只读的看板查询，供工作者检查自己的上下文。
- **`kanban_create` / `kanban_unblock` / `kanban_link`** — 仅编排者操作。供在 Codex 运行时上运行的编排智能体需要分发新任务时使用。

看板工具由分发器设置的 `HERMES_KANBAN_TASK` 环境变量控制——该变量传播到 Codex 子进程（Codex 继承环境），再传播到生成的 `hermes-tools` MCP 服务器子进程。因此工具能看到正确的任务 ID 并正确控制访问。对于 Codex app-server 工作者，当 `HERMES_KANBAN_TASK` 存在时，Hermes 还会传递狭窄的 app-server 沙箱覆盖配置：保持 `workspace-write` 沙箱，将**看板数据库目录加上分发器固定的每个看板路径**添加为额外的可写根目录（`HERMES_KANBAN_WORKSPACES_ROOT`、`HERMES_KANBAN_WORKSPACE`、旧版 `HERMES_KANBAN_ROOT`——去重，DB 目录优先），并默认保持网络禁用。这避免了脆弱的 `:danger-no-sandbox` 权宜方案，同时允许 `kanban_complete` / `kanban_block` 更新看板数据库**并且**允许工作者在位于数据库目录外的工作区挂载下写入报告/产物（例如在独立驱动器上的 `/media/.../kanban-workspaces/...`——[issue #27941](https://github.com/NousResearch/hermes-agent/issues/27941)）。

### 定时任务

**未专门测试。** 定时任务通过 `cronjob` → `AIAgent.run_conversation` 运行，与 CLI 相同的代码路径。如果定时任务的配置设置了 `openai_runtime: codex_app_server`，它将在 Codex 上运行。相同的工具可用性规则适用——Codex 内置 + 插件 + MCP 回调可用，智能体循环工具（delegate_task、memory、session_search、todo）不可用。如果你的定时任务依赖这些工具，请将定时任务限定在默认运行时的配置文件上。

## 权衡对比

|  | Hermes 默认运行时 | Codex app-server（可选） |
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
| Codex `update_plan`（运行时内待办） | — | 是（Codex 内置） |
| Codex `view_image`（加载图像到对话） | — | 是（Codex 内置） |
| Codex 沙箱（seatbelt/landlock，配置文件） | — | 是（Codex 内置） |
| ChatGPT 订阅认证 | — | 是（通过 `openai-codex` 提供商） |
| 原生 Codex 插件（Linear、GitHub 等） | — | 是（自动迁移） |
| 用户 MCP 服务器 | 是 | 是（自动迁移到 Codex） |
| 记忆 + 技能审查（后台） | 是 | 是（通过条目投影） |
| 多轮对话 | 是 | 是 |
| `/goal`（Ralph 循环） | 是 | 是 |
| 看板工作者分发 | 是 | 是（通过回调） |
| 看板编排者工具 | 是 | 是（通过回调） |
| 所有网关平台 | 是 | 是 |
| 非 OpenAI 提供商 | 是 | 不适用——限定于 OpenAI/Codex 范围 |

## 前置条件

1. **安装 Codex CLI：**
   ```bash
   npm i -g @openai/codex
   codex --version   # 0.130.0 或更新版本
   ```
2. **Codex OAuth 登录。** Codex 子进程读取 `~/.codex/auth.json`。两种填充方式：
   ```bash
   codex login                  # 将令牌写入 ~/.codex/auth.json
   ```
   Hermes 自己的 `hermes auth login codex` 写入 `~/.hermes/auth.json`——那是一个独立的会话。如果你还没有，请**单独运行 `codex login`**。

3. **（可选）安装你想要的 Codex 插件。** 当你启用运行时时，Hermes 会自动迁移你已通过 Codex CLI 安装的策划插件：
   ```bash
   codex plugin marketplace add openai-curated
   # 然后通过 Codex 的 TUI，安装 Linear / GitHub / Gmail / 等
   ```
   Hermes 将发现它们并自动将 `[plugins."<name>@openai-curated"]` 条目写入 `~/.codex/config.toml`。

## 启用

在 Hermes 会话中：

```
/codex-runtime codex_app_server
```

该命令：
- 验证 `codex` CLI 是否已安装（若未安装则提示安装）。
- 将 `model.openai_runtime: codex_app_server` 持久化到你的 config.yaml。
- 将用户 MCP 服务器从 `~/.hermes/config.yaml` 迁移到 `~/.codex/config.toml`。
- **发现并迁移已安装的原生 Codex 插件**（Linear、GitHub、Gmail、Calendar、Canva 等），通过查询 Codex 的 `plugin/list` RPC 实现。
- **将 Hermes 自身的工具注册为 MCP 服务器**，以便 codex 子进程可以回调使用 codex 未内置的工具。
- **写入 `default_permissions = ":workspace"`**，使沙箱允许在工作区内写入而无需每次操作都弹出提示。
- 告知你迁移了什么内容。在**下一次**会话生效——当前缓存的智能体保持先前的运行时以确保提示缓存有效。

同义词：`/codex-runtime on`、`/codex-runtime off`、`/codex-runtime auto`。

查看当前状态而不做任何更改：
```
/codex-runtime
```

你也可以在 `~/.hermes/config.yaml` 中手动设置：
```yaml
model:
  openai_runtime: codex_app_server   # 默认值为 "auto"（即 Hermes 运行时）
```

## 自我改进循环（记忆 + 技能触发机制）

Hermes 的后台自我改进在计数器达到阈值时触发：

- 每 10 个用户提示 → 一个分叉的审查智能体会查看对话并决定是否应将任何内容保存到记忆中。
- 单轮中每 10 次工具迭代 → 类似机制，但针对技能（`skill_manage` 写入）。

**两者在 codex 运行时上均保持工作。** codex 路径将每个已完成的 `commandExecution` / `fileChange` / `mcpToolCall` / `dynamicToolCall` 项目投射为合成的 `assistant tool_call` + `tool` 结果消息，因此在审查运行时，它看到的结构与默认 Hermes 运行时相同。

关联机制如何保持等效：

| | 默认运行时 | Codex 运行时 |
|---|---|---|
| `_turns_since_memory` 递增 | 在 run_conversation 前置循环中按用户提示计数 | 相同代码路径，在提前返回之前 |
| `_iters_since_skill` 递增 | 在 chat-completions 循环中按工具迭代计数 | 在 codex 轮次返回后通过 `turn.tool_iterations` 计数 |
| 记忆触发（`_turns_since_memory >= _memory_nudge_interval`） | 在前置循环中计算，响应后触发 | 在前置循环中计算，传递给 codex 辅助函数 |
| 技能触发（`_iters_since_skill >= _skill_nudge_interval`） | 循环后计算 | codex 轮次后计算 |
| `_spawn_background_review(messages_snapshot=..., review_memory=..., review_skills=...)` | 任一触发条件满足时调用 | 任一触发条件满足时同样调用 |

一个细节：审查分叉本身需要调用 Hermes 的智能体循环工具（`memory`、`skill_manage`），这需要 Hermes 自身的分发机制。因此，当父智能体使用 `codex_app_server` 时，审查分叉会**降级为 `codex_responses`**——相同的 OAuth 凭证，相同的 `openai-codex` 提供商，但直接与 OpenAI 的 Responses API 通信，以便 Hermes 拥有循环控制权且智能体循环工具正常工作。这对用户不可见。

最终效果：启用 codex 运行时后，你的记忆 + 技能触发机制将完全照常运行。

## 审批机制

Codex 在执行命令或应用补丁前会请求审批。这些会被转换为 Hermes 标准的"危险命令"提示：

```
╭───────────────────────────────────────╮
│ 危险命令                              │
│                                       │
│ /bin/bash -lc 'echo hello > foo.txt'  │
│                                       │
│ ❯ 1. 允许一次                         │
│   2. 允许本次会话                     │
│   3. 拒绝                             │
│                                       │
│ Codex 请求在 /your/cwd 执行           │
╰───────────────────────────────────────╯
```

- **允许一次** → 批准此单个命令。
- **允许本次会话** → Codex 不会对类似命令再次提示审批。
- **拒绝** → 命令被拒绝；Codex 继续以只读模式运行。

对于 `apply_patch`（文件编辑）审批，当 codex 通过对应的 `fileChange` 条目提供数据时，Hermes 会显示变更摘要（`1 add, 1 update: /tmp/new.py, /tmp/old.py`）。

## 权限配置文件

Codex 有三个内置权限配置文件：
- `:read-only` — 不允许写入；每条 shell 命令都需要审批
- `:workspace` — 允许在当前工作区内无需提示即可写入（启用运行时时 Hermes 的默认值）
- `:danger-no-sandbox` — 完全没有沙箱（除非你了解其含义，否则不要使用）

你可以在 Hermes 管理块之外的 `~/.codex/config.toml` 中覆盖默认值：

```toml
default_permissions = ":read-only"
```

（只要覆盖内容位于 `# managed by hermes-agent` 标记之外，Hermes 将在重新迁移时保留你的覆盖。）

## 辅助任务与 ChatGPT 订阅 token 消耗

当此运行时与 `openai-codex` 提供商一起启用时，**辅助任务（标题生成、上下文压缩、视觉自动检测、后台自我改进审查分叉）默认也会通过你的 ChatGPT 订阅进行**，因为 Hermes 的辅助客户端在没有设置每任务覆盖时使用主提供商/模型。

这并非 `codex_app_server` 特有的——现有的 `codex_responses` 路径也是如此——但在这里更明显，因为你明确选择了订阅计费。

要将特定辅助任务路由到更便宜/不同的模型，在 `~/.hermes/config.yaml` 中设置显式覆盖：

```yaml
auxiliary:
  title_generation:
    provider: openrouter
    model: google/gemini-3-flash-preview
  compression:
    provider: openrouter
    model: google/gemini-3-flash-preview
  vision:
    provider: openrouter
    model: google/gemini-3-flash-preview
  goal_judge:
    provider: openrouter
    model: google/gemini-3-flash-preview
```

自我改进审查分叉通过 `_current_main_runtime()` 继承主运行时，Hermes 会自动将其从 `codex_app_server` 降级为 `codex_responses`（以便分叉可以实际调用 `memory` 和 `skill_manage`——Hermes 自己的智能体循环工具）。除非你已将辅助任务路由到其他地方，否则该分叉仍使用你的订阅认证。

## 安全编辑 `~/.codex/config.toml`

Hermes 将其管理的所有内容包裹在两个标记注释之间：

```toml
# managed by hermes-agent — `hermes codex-runtime migrate` 重新生成此部分
default_permissions = ":workspace"
[mcp_servers.filesystem]
...
[plugins."github@openai-curated"]
...
# end hermes-agent managed section
```

该块**之外**的任何内容都属于你。重新运行迁移（通过 `/codex-runtime codex_app_server` 或无论何时切换运行时）会原地替换管理的块，但逐字保留其上方的用户内容。这意味着你可以：

- 添加 Hermes 不知道的自己的 MCP 服务器
- 如果你希望被提示，将 `default_permissions` 覆盖为 `:read-only`
- 配置 codex 专用选项（模型、提供商、otel 等）
- 在 `[permissions.<name>]` 表中添加用户定义的权限配置文件

你在管理块**内部**添加的任何内容在下次迁移时都会被覆盖。如果你需要编辑管理块才能实现的调整，请提交 issue，我们会添加该开关。

## 多配置文件/多租户设置

默认情况下，Hermes 无论激活哪个 Hermes 配置文件，都会将 codex 子进程指向 `~/.codex/`。这意味着 `hermes -p work` 和 `hermes -p personal` 共享相同的 Codex 认证、插件和配置。对大多数用户来说这是正确的行为——与直接运行 `codex` CLI 的行为一致。

如果你需要按配置文件隔离 Codex（独立的认证、独立的已安装插件、独立的配置），请按配置文件显式设置 `CODEX_HOME`。最干净的方式是指向你 `HERMES_HOME` 下的目录：

```bash
# 在工作配置文件内，你可以这样包装 hermes：
CODEX_HOME=~/.hermes/profiles/work/codex hermes chat
```

你需要用该 `CODEX_HOME` 设置重新运行一次 `codex login`，以便 OAuth 令牌存储在配置文件范围内的位置。之后，`hermes -p work` 将在隔离的 Codex 状态上运行。

我们不会自动限定范围，因为移动现有用户的 `~/.codex/` 会静默地使其 Codex CLI 认证失效——任何已经运行过 `codex login` 的用户都必须重新认证。选择加入比让用户感到意外更安全。

## HOME 环境变量透传

Hermes 在生成 codex app-server 子进程时**不会**重写 `HOME`（我们使用 `os.environ.copy()` 并仅覆盖 `CODEX_HOME` 和 `RUST_LOG`）。这意味着：

- codex 通过其 `shell` 工具运行的命令能看到真实的 `HOME`，并正确找到 `~/.gitconfig`、`~/.gh/`、`~/.aws/`、`~/.npmrc` 等。
- Codex 的内部状态通过 `CODEX_HOME` 保持隔离（默认指向 `~/.codex/`）。

这与 OpenClaw 经过早期实验后确定的边界一致：隔离 Codex 的状态，不动用户的主目录。（参见 openclaw/openclaw#81562。）

## MCP 服务器迁移

Hermes 的 `mcp_servers` 配置会自动转换为 Codex 期望的 TOML 格式。迁移在每次启用运行时运行，且是幂等的——重新运行会替换管理的部分，但保留任何用户编辑的 Codex 配置。

可转换的内容：

| Hermes (`config.yaml`) | Codex (`config.toml`) |
|---|---|
| `command` + `args` + `env` | stdio 传输 |
| `url` + `headers` | streamable_http 传输 |
| `timeout` | `tool_timeout_sec` |
| `connect_timeout` | `startup_timeout_sec` |
| `enabled: false` | `enabled = false` |

不迁移的内容：
- Hermes 特有的键如 `sampling`（Codex 的 MCP 客户端没有对应项——这些会随每个服务器的警告丢弃）。

## 原生 Codex 插件迁移

通过 `codex plugin` 安装的插件（Linear、GitHub、Gmail、Calendar、Canva 等）通过 Codex 的 `plugin/list` RPC 被发现。对于每个 `installed: true` 的插件，Hermes 写入一个 `[plugins."<name>@openai-curated"]` 块，在你的 Hermes 会话中启用它。

这意味着：当你的朋友说"我在 Codex CLI 中配置了 Calendar 和 GitHub"并启用 Hermes 的 codex 运行时，Hermes 会自动激活那些插件。无需重新配置。

**不**迁移的内容：
- 你尚未安装的插件——请先在 Codex 中安装。
- codex 报告 `availability != AVAILABLE` 的插件（安装损坏、OAuth 过期、已从市场下架等）。这些会被跳过，以避免写入在激活时会失败的配置。
- ChatGPT 应用市场条目（每账户的 `app/list` 结果——这些已通过你的账户认证在 codex 内部启用）。
- 插件 OAuth —— 你在 Codex 本身中授权每个插件一次；Hermes 不碰凭证。

## Hermes 工具回调（新的 MCP 服务器）

Codex 的内置工具集涵盖 shell/文件操作/补丁，但没有网页搜索、浏览器自动化、视觉、图像生成等。为了在 codex 轮次中保持这些可用，Hermes 在 `~/.codex/config.toml` 中注册自己为 MCP 服务器：

```toml
[mcp_servers.hermes-tools]
command = "/path/to/python"
args = ["-m", "agent.transports.hermes_tools_mcp_server"]
env = { HERMES_HOME = "/your/.hermes", PYTHONPATH = "...", HERMES_QUIET = "1" }
startup_timeout_sec = 30.0
tool_timeout_sec = 600.0
```

当模型调用 `web_search`（或另一个暴露的 Hermes 工具）时，codex 通过 stdio 生成 `hermes_tools_mcp_server` 子进程，请求通过 `model_tools.handle_function_call()` 调度，结果像任何其他 MCP 响应一样投射回 codex。

**通过回调可用的工具：** `web_search`、`web_extract`、`browser_navigate`、`browser_click`、`browser_type`、`browser_press`、`browser_snapshot`、`browser_scroll`、`browser_back`、`browser_get_images`、`browser_console`、`browser_vision`、`vision_analyze`、`image_generate`、`skill_view`、`skills_list`、`text_to_speech`。

**不可用的工具：** `delegate_task`、`memory`、`session_search`、`todo`。这些需要运行的 AIAgent 上下文来调度（循环中的状态），无状态的 MCP 回调无法驱动它们。当你需要这些工具时，使用默认的 Hermes 运行时（`/codex-runtime auto`）。

## 禁用

随时可以切换回：

```
/codex-runtime auto
```

在下次会话生效。Codex 管理的代码块保留在 `~/.codex/config.toml` 中，因此你无需担心重新启用时会丢失配置 — 或者你也可以手动删除它。

## 限制

此运行时是**可选测试版**。截至 Hermes Agent 2026.5 + Codex CLI 0.130.0 验证通过的功能：

- 多轮对话
- 通过 Hermes UI 进行 `commandExecution` 和 `fileChange`（apply_patch）审批
- MCP 工具调用（已针对 `@modelcontextprotocol/server-filesystem` 和新的 `hermes-tools` 回调验证）
- 原生 Codex 插件迁移（已针对 Linear / GitHub / Calendar 清单验证）
- 拒绝/取消路径
- 开关切换周期
- 记忆和技能提示计数器（已通过集成测试实时验证）
- Hermes 通过 codex 进行 web_search（已实时验证："OpenAI Codex CLI – Getting Started" 端到端返回）

已知限制：

- **Hermes 认证和 codex 认证是独立的会话。** 你需要同时执行 `codex login` 和 `hermes auth login codex` 才能获得最流畅的用户体验（运行时使用 codex 的会话进行 LLM 调用）。这是 Hermes 中 `_import_codex_cli_tokens` 的一个有意设计选择 — Hermes 不会与 codex CLI 共享 OAuth 状态，以避免在令牌刷新时互相干扰。
- **`delegate_task`、`memory`、`session_search`、`todo` 在此运行时不可用。** 它们需要运行中的 AIAgent 上下文，而无状态的 MCP 回调无法提供。需要这些功能时使用 `/codex-runtime auto`。
- **当 codex 未跟踪变更集时，审批提示中不会显示内联补丁预览。** Codex 的 `fileChange` 审批参数并不总是携带变更集。Hermes 会在可能时从相应的 `item/started` 通知中缓存数据，但如果审批在项目流式传输完成之前到达，提示将回退到 codex 提供的任何 `reason`。
- **次秒级取消无法保证。** 流中中断（codex 响应时按 Ctrl+C）通过 `turn/interrupt` 发送，但如果 codex 已经刷新了最终消息，你仍然会收到响应。

如果发现 bug，请[提交 issue](https://github.com/NousResearch/hermes-agent/issues) 并附上 `hermes logs --since 5m` 的输出。在标题中注明 `codex-runtime` 以便快速分类处理。

## 架构

```
                ┌─── Hermes shell (CLI / TUI / gateway) ───┐
                │  sessions DB · slash commands · memory   │
                │  & skill review · cron · session pickers │
                └──┬──────────────────────────────────────┬┘
                   │ user_message               final     │
                   ▼                            text +    │
        ┌──────────────────────────────────┐   projected  │
        │  AIAgent.run_conversation()       │   messages   │
        │   if api_mode == codex_app_server │              │
        │     → CodexAppServerSession       │              │
        │   else: chat_completions / codex_responses (默认)
        └────┬─────────────────────────────┘              │
             │ JSON-RPC over stdio                        │
             ▼                                            │
        ┌──────────────────────────────────┐              │
        │  codex app-server (子进程)         │──────────────┘
        │   thread/start, turn/start        │
        │   item/* notifications            │
        │   shell + apply_patch + update_plan│
        │   view_image + sandbox            │
        │   ┌─────────────────────────┐     │
        │   │  MCP client             │     │
        │   │  ├─ user MCP servers    │     │
        │   │  ├─ native plugins      │     │
        │   │  │   (linear, github,   │     │
        │   │  │    gmail, calendar,  │     │
        │   │  │    canva, ...)       │     │
        │   │  └─ hermes-tools ───────┼─────────────────┐
        │   │       (callback to     │     │           │
        │   │        Hermes' richer  │     │           │
        │   │        tools)          │     │           │
        │   └─────────────────────────┘     │           │
        └──────────────────────────────────┘           │
                                                        │
                                                        ▼
        ┌──────────────────────────────────────────────────────────┐
        │  hermes_tools_mcp_server.py (按需启动的子进程)              │
        │   web_search, web_extract, browser_*, vision_analyze,    │
        │   image_generate, skill_view, skills_list, text_to_speech│
        └──────────────────────────────────────────────────────────┘
```

有关实现细节，请参见 [PR #24182](https://github.com/NousResearch/hermes-agent/pull/24182) 和 [Codex app-server 协议 README](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md)。