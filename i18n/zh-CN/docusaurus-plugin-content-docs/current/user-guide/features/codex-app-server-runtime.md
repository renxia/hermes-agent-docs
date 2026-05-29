---
title: Codex App-Server Runtime (可选)
sidebar_label: Codex App-Server Runtime
---

# Codex App-Server Runtime

Hermes 可以选择将 `openai/*` 和 `openai-codex/*` 轮次交给 [Codex CLI app-server](https://github.com/openai/codex) 处理，而不是运行自己的工具循环。启用后，终端命令、文件编辑、沙箱化和 MCP 工具调用都在 Codex 的运行时内执行——Hermes 则成为其外壳（会话数据库、斜杠命令、网关、记忆与技能审核）。

这是**仅限选择加入**的功能。除非你主动切换标志，否则默认的 Hermes 行为不会改变。Hermes 永远不会自动将你路由到此运行时。

:::tip
不使用 OpenAI Codex？`hermes setup --portal` 可以一步配置使用 Claude/Gemini 等非 Codex 后端。详见 [Nous 门户](/integrations/nous-portal)。
:::

## 原因

- 使用与 Codex CLI 相同的认证流程，针对你的 **ChatGPT 订阅**（无需 API 密钥）运行 OpenAI 智能体轮次。
- 使用 **Codex 自己的工具集和沙箱**——用于终端读写搜索的 `shell`、用于结构化编辑的 `apply_patch`、用于规划的 `update_plan`，全部在 seatbelt/landlock 沙箱化环境中运行。
- **原生 Codex 插件**——通过 `codex plugin` 安装的 Linear、GitHub、Gmail、Calendar、Canva 等——会被自动迁移并激活在你的 Hermes 会话中。
- **Hermes 更丰富的工具也随之而来**——web_search、web_extract、浏览器自动化、视觉、图像生成、技能和 TTS 通过 MCP 回调运行。Codex 会回调 Hermes 以获取其没有内置的工具。
- **记忆与技能提示持续有效**——Codex 的事件被投射到 Hermes 的消息结构中，因此自我改进循环会看到一份看起来正常的记录。

## 模型实际拥有哪些工具

这是大多数用户首先想知道的部分。当此运行时开启时，执行您当前轮次的模型拥有三个独立的工具来源：

### 1. Codex 的内置工具集（始终开启）

这些工具随 `codex app-server` 本身一起提供——不涉及 Hermes、MCP 或插件。运行时启动后，所有五个工具立即可用：

- **`shell`** — 在沙箱内执行任意 shell 命令。这是模型读取文件（`cat`、`head`、`tail`）、写入文件（`echo > foo`、heredocs）、搜索文件（`find`、`rg`、`grep`）、导航目录（`ls`、`cd`）、运行构建、管理进程以及您在 bash 中会做的任何其他事情的方式。
- **`apply_patch`** — 应用 Codex 补丁格式的结构化多文件差异。模型使用此工具进行非简单代码编辑（添加函数、跨文件重构）；shell heredocs 仍可用于一次性写入。
- **update_plan`** — Codex 的内部待办事项/计划跟踪器。相当于 Hermes 的 `todo` 工具，但完全在 Codex 的运行时内管理。
- **`view_image`** — 将本地图像文件加载到对话中，以便模型可以看到它。
- **`web_search`** — Codex 配置后拥有自己的内置网络搜索。Hermes 也通过下面的回调暴露 `web_search`（由 Firecrawl 支持）；模型会择优选择。

所以，**任何您通过终端会做的事情——读取/写入/搜索/查找/运行——Codex 都原生支持**。沙箱配置文件（默认为 `:workspace`，当您启用运行时时）控制哪些内容可写。

### 2. 原生 Codex 插件（从您的 `codex plugin` 安装自动迁移）

当您启用运行时时，Hermes 会查询 Codex 的 `plugin/list` RPC，并为您安装的每个插件写入一个 `[plugins."<name>@openai-curated"]` 条目。插件本身由 Codex 管理，并通过 Codex 自己的 UI 进行一次性授权。

示例（OpenClaw 论坛中被誉为“值得做成 YouTube 视频”的那些）：

- **Linear** — 查找/更新问题
- **GitHub** — 搜索代码、查看 PR、评论
- **Gmail** — 读取/发送邮件
- **Google 日历** — 创建/查找活动
- **Outlook 日历/邮件** — 通过 Microsoft 连接器实现相同功能
- **Canva** — 设计生成
- ...以及任何其他您通过 `codex plugin marketplace add openai-curated` + `codex plugin install ...` 安装的插件

**未迁移的内容：**
- 您尚未安装的插件——请先在 Codex 中安装它们。
- ChatGPT 应用市场条目（`app/list`）——由于您的账户认证，这些在 Codex 内已默认启用。

### 3. Hermes 工具回调（MCP 服务器，在 `~/.codex/config.toml` 中注册）

Hermes 将自身注册为一个 MCP 服务器，以便 Codex 可以为其自身未提供的工具进行回调。通过回调可用的工具：

- **`web_search`** / **`web_extract`** — 由 Firecrawl 支持；对于结构化内容，比直接爬取更干净。
- **`browser_navigate` / `browser_click` / `browser_type` / `browser_press` / `browser_snapshot` / `browser_scroll` / `browser_back` / `browser_get_images` / `browser_console` / `browser_vision`** — 通过 Camofox 或 Browserbase 进行完整的浏览器自动化。
- **`vision_analyze`** — 调用单独的视觉模型来检查图像（不同于 Codex 的 `view_image`，后者是将图像加载到对话中）。
- **`image_generate`** — 通过 Hermes 的 image_gen 插件链生成图像。
- **`skill_view` / `skills_list`** — 从 Hermes 的技能库读取。
- **`text_to_speech`** — 通过 Hermes 配置的提供程序进行 TTS。

当模型需要这些工具时，Codex 会通过 stdio MCP 生成 `hermes_tools_mcp_server` 子进程，调用通过 `model_tools.handle_function_call()` 分派（与 Hermes 默认运行时相同的代码路径），结果像任何其他 MCP 响应一样返回给 Codex。

### 此运行时上不可用的工具

以下四个 Hermes 工具需要运行中的 AIAgent 上下文（循环中状态）才能分派，而无状态的 MCP 回调无法驱动它们。当您需要其中任何一个时，请切回默认运行时（`/codex-runtime auto`）：

- **`delegate_task`** — 生成子智能体
- **`memory`** — Hermes 的持久化记忆存储
- **`session_search`** — 跨会话搜索
- **`todo`** — Hermes 的待办事项存储（Codex 的 `update_plan` 是运行时内的等效工具）

## 工作流功能（`/goal`、看板、定时任务）

### `/goal`（Ralph 循环）

**在此运行时上有效。** 目标按会话 ID 持久化存储在 `state_meta` 中，续写提示作为普通用户消息通过 `run_conversation()` 反馈，Codex 原生执行下一轮。目标评审通过辅助客户端运行（通过 config.yaml 中的 `auxiliary.goal_judge` 配置），与当前激活的运行时无关。如果 Codex 在审批上停滞，评审的“已阻塞，需要用户输入”裁决是一个干净的退出路径。

**需要注意的一点：** 每次续写提示都是一个全新的 Codex 轮次，这意味着 Codex 会从头重新评估命令审批策略。如果您正在执行一个涉及大量写入的长时目标，预期会比单次会话内任务看到更多的审批提示。设置 `default_permissions = ":workspace"`（当您启用运行时时，Hermes 会自动执行此操作），这样简单的写入工作区操作就不会提示。

### 看板（多智能体工作树分派）

**在此运行时上有效，但有一个细微的依赖关系。** 看板调度器将每个工作者生成为一个独立的 `hermes chat -q` 子进程，该进程读取用户的配置——这意味着如果全局设置了 `model.openai_runtime: codex_app_server`，工作者也会在 Codex 运行时上启动。

在 Codex 运行时工作者内部有效的内容：
- Codex 的完整工具集（shell、apply_patch、update_plan、view_image、web_search）——工作者原生执行其实际任务工作。
- 已迁移的 Codex 插件——Linear、GitHub 等。
- 用于浏览器操作、视觉、图像生成、技能、TTS 的 Hermes 工具回调。

由于 MCP 回调暴露了它们，以下工具也有效：
- **`kanban_complete` / `kanban_block` / `kanban_comment` / `kanban_heartbeat`** — 工作者交接工具。这些工具从环境变量读取 `HERMES_KANBAN_TASK`（由调度器设置），正确控制访问权限，并写入由 `HERMES_KANBAN_DB` 固定的每块看板 SQLite 数据库。如果回调中没有这些工具，在此运行时上的工作者可以执行任务但无法报告，会挂起直到调度器超时。
- **`kanban_show` / `kanban_list`** — 只读看板查询，供工作者检查自身上下文。
- **`kanban_create` / `kanban_unblock` / `kanban_link`** — 仅限协调器的操作。供运行在 Codex 运行时上、需要分派新任务的协调器智能体使用。

看板工具由调度器设置的 `HERMES_KANBAN_TASK` 环境变量控制——该变量传播到 Codex 子进程（Codex 继承环境变量），并从那里传播到生成的 `hermes-tools` MCP 服务器子进程。因此工具能看到正确的任务 ID 并正确控制访问。对于 Codex app-server 工作者，当存在 `HERMES_KANBAN_TASK` 时，Hermes 还会传递窄范围的 app-server 沙箱覆盖：保持 `workspace-write` 沙箱化，添加**看板数据库目录以及调度器固定的每个看板路径**作为额外的可写根目录（`HERMES_KANBAN_WORKSPACES_ROOT`、`HERMES_KANBAN_WORKSPACE`、遗留的 `HERMES_KANBAN_ROOT` —— 去重后，数据库目录优先），并默认保持网络禁用。这避免了脆弱的 `:danger-no-sandbox` 变通方案，同时允许 `kanban_complete` / `kanban_block` 更新看板数据库 **并** 允许工作者在位于数据库目录之外的工作区挂载点下写入报告/制品（例如在单独驱动器上的 `/media/.../kanban-workspaces/...` —— [问题 #27941](https://github.com/NousResearch/hermes-agent/issues/27941)）。

### 定时任务

**未专门测试。** 定时任务通过 `cronjob` → `AIAgent.run_conversation` 运行，与 CLI 是相同的代码路径。如果定时任务的配置中有 `openai_runtime: codex_app_server`，它将在 Codex 上运行。相同的工具可用性规则适用——Codex 内置工具 + 插件 + MCP 回调有效，智能体循环工具（delegate_task、memory、session_search、todo）无效。如果您的定时任务依赖这些，请将定时任务限定到使用默认运行时的配置文件。

## 权衡对比

|  | Hermes 默认运行时 | Codex app-server（可选） |
|---|---|---|
| `delegate_task` 子智能体 | 有效 | 不可用 — 需要智能体循环上下文 |
| `memory`、`session_search`、`todo` | 有效 | 不可用 — 需要智能体循环上下文 |
| `web_search`、`web_extract` | 有效 | 有效（通过 MCP 回调） |
| 浏览器自动化（Camofox/Browserbase） | 有效 | 有效（通过 MCP 回调） |
| `vision_analyze`、`image_generate` | 有效 | 有效（通过 MCP 回调） |
| `skill_view`、`skills_list` | 有效 | 有效（通过 MCP 回调） |
| `text_to_speech` | 有效 | 有效（通过 MCP 回调） |
| Codex `shell`（终端/读/写/搜索/查找/运行） | — | 有效（Codex 内置） |
| Codex `apply_patch`（结构化多文件编辑） | — | 有效（Codex 内置） |
| Codex `update_plan`（运行时内待办事项） | — | 有效（Codex 内置） |
| Codex `view_image`（将图像加载到对话中） | — | 有效（Codex 内置） |
| Codex 沙箱（seatbelt/landlock，配置文件） | — | 有效（Codex 内置） |
| ChatGPT 订阅认证 | — | 有效（通过 `openai-codex` 提供程序） |
| 原生 Codex 插件（Linear、GitHub 等） | — | 有效（自动迁移） |
| 用户 MCP 服务器 | 有效 | 有效（自动迁移至 Codex） |
| 记忆 + 技能审查（后台） | 有效 | 有效（通过项投影） |
| 多轮对话 | 有效 | 有效 |
| `/goal`（Ralph 循环） | 有效 | 有效 |
| 看板工作者分派 | 有效 | 有效（通过回调） |
| 看板协调器工具 | 有效 | 有效（通过回调） |
| 所有网关平台 | 有效 | 有效 |
| 非 OpenAI 提供程序 | 有效 | 不适用 — 限 OpenAI/Codex 范围 |

## 先决条件

1.  **已安装 Codex CLI：**
    ```bash
    npm i -g @openai/codex
    codex --version   # 0.130.0 或更新版本
    ```
2.  **Codex OAuth 登录。** Codex 子进程会读取 `~/.codex/auth.json`。两种方式来填充它：
    ```bash
    codex login                  # 将令牌写入 ~/.codex/auth.json
    ```
    Hermes 自身的 `hermes auth login codex` 会写入 `~/.hermes/auth.json` —— 这是一个独立的会话。如果尚未操作，请**单独运行 `codex login`**。

3.  **（可选）安装所需的 Codex 插件。** 当您启用运行时，Hermes 会自动迁移您已通过 Codex CLI 安装的任何策展插件：
    ```bash
    codex plugin marketplace add openai-curated
    # 然后通过 Codex 的 TUI 安装 Linear / GitHub / Gmail 等插件。
    ```
    Hermes 会发现它们并自动将 `[plugins."<name>@openai-curated"]` 条目写入 `~/.codex/config.toml`。

## 启用

在 Hermes 会话中：

```
/codex-runtime codex_app_server
```

此命令将：
*   验证 `codex` CLI 已安装（如果未安装，会阻止并提示安装）。
*   将 `model.openai_runtime: codex_app_server` 持久化到您的 config.yaml。
*   将用户 MCP 服务器从 `~/.hermes/config.yaml` 迁移到 `~/.codex/config.toml`。
*   **通过查询 Codex 的 `plugin/list` RPC，发现并迁移已安装的原生 Codex 插件**（Linear、GitHub、Gmail、日历、Canva 等）。
*   **将 Hermes 自身的工具注册为一个 MCP 服务器**，以便 Codex 子进程可以回调调用那些 Codex 未自带的工具。
*   **写入 `default_permissions = ":workspace"`**，以允许沙箱在工作区内写入，而无需对每个操作进行提示。
*   告知您迁移了哪些内容。变更将在**下一次**会话时生效 —— 当前缓存的智能体会保留先前的运行时，因此提示缓存保持有效。

同义命令：`/codex-runtime on`、`/codex-runtime off`、`/codex-runtime auto`。

要检查当前状态而不做任何更改：
```
/codex-runtime
```

您也可以在 `~/.hermes/config.yaml` 中手动设置：
```yaml
model:
  openai_runtime: codex_app_server   # 默认为 "auto" (= Hermes 运行时)
```

## 自我提升循环（记忆+技能微调）

Hermes 的后台自我提升功能会在达到特定计数阈值时触发：

- 每 10 个用户提示 → 会分叉出一个审查智能体查看对话，并决定是否应将任何内容保存到记忆中。
- 单次对话中的每 10 次工具迭代 → 同样的逻辑，但针对技能（即 `skill_manage` 写入操作）。

**两者在 Codex 运行时上持续工作。** Codex 路径会将每个完成的 `commandExecution` / `fileChange` / `mcpToolCall` / `dynamicToolCall` 项投射为一个合成的 `assistant tool_call` + `tool` 结果消息，因此在审查运行时，它看到的结构与在默认 Hermes 运行时上看到的完全相同。

接线如何保持等效：

| | 默认运行时 | Codex 运行时 |
|---|---|---|
| `_turns_since_memory` 递增 | 每个用户提示，在 run_conversation 预循环中 | 相同代码路径，在早期返回之前 |
| `_iters_since_skill` 递增 | 聊天完成循环中每次工具迭代后 | Codex 对话返回后，由 `turn.tool_iterations` 完成 |
| 记忆触发器 (`_turns_since_memory >= _memory_nudge_interval`) | 在预循环中计算，响应后触发 | 在预循环中计算，传递给 Codex 辅助函数 |
| 技能触发器 (`_iters_since_skill >= _skill_nudge_interval`) | 循环后计算 | Codex 对话后计算 |
| `_spawn_background_review(messages_snapshot=..., review_memory=..., review_skills=...)` | 当任一触发器触发时调用 | 当任一触发器触发时，以相同方式调用 |

一个细节：审查分叉本身需要调用 Hermes 的智能体循环工具（`memory`, `skill_manage`），这些工具需要 Hermes 自己的调度。因此，当父智能体运行在 `codex_app_server` 上时，审查分叉会被**降级为 `codex_responses`** — 使用相同的 OAuth 凭据、相同的 `openai-codex` 提供商，但直接与 OpenAI 的 Responses API 通信，以便 Hermes 能够控制循环，并且智能体循环工具可以正常工作。这对用户是不可见的。

最终效果是：启用 Codex 运行时后，你的记忆+技能微调功能将继续像以前一样正常触发。

## 审批如何工作

Codex 在执行命令或应用补丁之前会请求批准。这些会被翻译成 Hermes 标准的 "危险命令" 提示：

```
╭───────────────────────────────────────╮
│ 危险命令                             │
│                                       │
│ /bin/bash -lc 'echo hello > foo.txt'  │
│                                       │
│ ❯ 1. 允许一次                         │
│   2. 为本次会话允许                   │
│   3. 拒绝                             │
│                                       │
│ Codex 请求在 /your/cwd 中执行        │
╰───────────────────────────────────────╯
```

- **允许一次** → 仅批准此单条命令。
- **为本次会话允许** → Codex 将不再为类似命令提示。
- **拒绝** → 命令被拒绝；Codex 继续以只读模式运行。

对于 `apply_patch`（文件编辑）审批，当 Codex 通过相应的 `fileChange` 项提供数据时，Hermes 会显示变更摘要（例如：`1 个新增，1 个更新：/tmp/new.py, /tmp/old.py`）。

## 权限配置文件

Codex 有三个内置权限配置文件：
- `:read-only` — 不允许写入；每个 shell 命令都需要批准。
- `:workspace` — 允许在当前工作区内写入，无需提示（启用运行时时的 Hermes 默认设置）。
- `:danger-no-sandbox` — 完全没有沙盒（除非你清楚自己在做什么，否则不要使用此选项）。

你可以在 Hermes 管理的块之外，通过 `~/.codex/config.toml` 覆盖默认设置：

```toml
default_permissions = ":read-only"
```

（只要你的覆盖内容位于 `# managed by hermes-agent` 标记之外，Hermes 在重新迁移时会保留你的覆盖。）

## 辅助任务和 ChatGPT 订阅令牌成本

当此运行时通过 `openai-codex` 提供商启用时，**辅助任务（标题生成、上下文压缩、视觉自动检测、后台自我提升审查分叉）默认也会流经你的 ChatGPT 订阅**，因为 Hermes 的辅助客户端在没有设置每任务覆盖时，会使用主要提供商/模型。

这并非 `codex_app_server` 特有的情况——现有的 `codex_responses` 路径也是如此——但在这里更明显，因为你显式选择了订阅计费。

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

自我提升审查分叉通过 `_current_main_runtime()` 继承主运行时，并且 Hermes 会自动将其从 `codex_app_server` 降级为 `codex_responses`（这样分叉才能实际调用 `memory` 和 `skill_manage` —— Hermes 自己的智能体循环工具）。除非你已将辅助任务路由到其他地方，否则该分叉仍会使用你的订阅身份验证。

## 安全编辑 `~/.codex/config.toml`

Hermes 将其管理的所有内容包裹在两个标记注释之间：

```toml
# managed by hermes-agent — `hermes codex-runtime migrate` regenerates this section
default_permissions = ":workspace"
[mcp_servers.filesystem]
...
[plugins."github@openai-curated"]
...
# end hermes-agent managed section
```

**在该块之外**的任何内容都是你的。重新运行迁移（通过 `/codex-runtime codex_app_server` 或在你切换运行时时）会就地替换管理块，但会逐字保留其上方和下方的用户内容。这意味着你可以：

- 添加 Hermes 不知道的你自己的 MCP 服务器。
- 如果你希望得到提示，可以将 `default_permissions` 覆盖为 `:read-only`。
- 配置 Codex 特有的选项（模型、提供商、otel 等）。
- 在 `[permissions.<name>]` 表中添加用户定义的权限配置文件。

**在管理块内**添加的任何内容都将在下次迁移时被覆盖。如果你需要调整并必须编辑管理块，请提交一个 issue，我们会添加相应的调节选项。

## 多配置文件/多租户设置

默认情况下，无论哪个 Hermes 配置文件处于活动状态，Hermes 都会将 Codex 子进程指向 `~/.codex/`。这意味着 `hermes -p work` 和 `hermes -p personal` 共享相同的 Codex 身份验证、插件和配置。对大多数用户来说，这是正确的行为——这与直接运行 `codex` CLI 的行为一致。

如果你希望每个配置文件拥有独立的 Codex 环境（独立的身份验证、独立安装的插件、独立的配置），请为每个配置文件显式设置 `CODEX_HOME`。最干净的方法是指向 `HERMES_HOME` 下的一个目录：

```bash
# 在 work 配置文件内部，你可能会这样包装 hermes：
CODEX_HOME=~/.hermes/profiles/work/codex hermes chat
```

你需要在设置了该 `CODEX_HOME` 的情况下运行一次 `codex login`，以便 OAuth 令牌存储在配置文件作用域的位置。之后，`hermes -p work` 将在独立的 Codex 状态下运行。

我们没有自动设置此作用域，因为移动现有用户的 `~/.codex/` 会使其 Codex CLI 身份验证无声失效——任何已经运行过 `codex login` 的用户都将不得不重新进行身份验证。选择性加入比让用户感到意外更安全。

## HOME 环境变量传递

Hermes 在生成 codex app-server 子进程时**不会**重写 `HOME`（我们使用 `os.environ.copy()` 并且只覆盖 `CODEX_HOME` 和 `RUST_LOG`）。这意味着：

- Codex 通过其 `shell` 工具运行的命令可以看到真实的用户 `HOME`，并能正确找到 `~/.gitconfig`、`~/.gh/`、`~/.aws/`、`~/.npmrc` 等。
- Codex 的内部状态通过 `CODEX_HOME`（默认指向 `~/.codex/`）保持隔离。

这与 OpenClaw 在早期实验后得出的边界一致：隔离 Codex 的状态，不动用户的主目录。（参见 openclaw/openclaw#81562。）

## MCP 服务器迁移

Hermes 的 `mcp_servers` 配置会自动转换为 Codex 期望的 TOML 格式。迁移在每次启用运行时时运行，并且是幂等的——重新运行会替换管理部分，但会保留任何用户编辑的 Codex 配置。

转换内容：

| Hermes (`config.yaml`) | Codex (`config.toml`) |
|---|---|
| `command` + `args` + `env` | stdio 传输 |
| `url` + `headers` | 可流式传输的 HTTP 传输 |
| `timeout` | `tool_timeout_sec` |
| `connect_timeout` | `startup_timeout_sec` |
| `enabled: false` | `enabled = false` |

未迁移的内容：
- Hermes 特有的键，如 `sampling`（Codex 的 MCP 客户端没有等效项——这些会被丢弃并给出每服务器的警告）。

## 本地 Codex 插件迁移

通过 `codex plugin` 安装的插件（Linear、GitHub、Gmail、Calendar、Canva 等）通过 Codex 的 `plugin/list` RPC 发现。对于每个 `installed: true` 的插件，Hermes 会编写一个 `[plugins."<name>@openai-curated"]` 块，在您的 Hermes 会话中启用它。

这意味着：当您的朋友说“我在我的 Codex CLI 中设置了 Calendar 和 GitHub”并启用 Hermes 的 codex 运行时，Hermes 会自动激活这些插件。无需重新配置。

未迁移的内容：
- 您尚未安装的插件 — 请先在 Codex 中安装它们。
- Codex 报告 `availability != AVAILABLE` 的插件（安装损坏、OAuth 过期、从市场移除等）。这些会被跳过，以避免编写会在激活时失败的配置。
- ChatGPT 应用商店条目（每账户的 `app/list` 结果 — 这些已通过您的账户认证在 codex 内启用）。
- 插件 OAuth — 您在 Codex 本身中对每个插件进行一次授权；Hermes 不会接触凭据。

## Hermes 工具回调（新的 MCP 服务器）

Codex 的内置工具集涵盖 shell/文件操作/补丁，但没有 Web 搜索、浏览器自动化、视觉、图像生成等。为了在 codex 轮次中保持这些工具可用，Hermes 将自身注册为 `~/.codex/config.toml` 中的 MCP 服务器：

```toml
[mcp_servers.hermes-tools]
command = "/path/to/python"
args = ["-m", "agent.transports.hermes_tools_mcp_server"]
env = { HERMES_HOME = "/your/.hermes", PYTHONPATH = "...", HERMES_QUIET = "1" }
startup_timeout_sec = 30.0
tool_timeout_sec = 600.0
```

当模型调用 `web_search`（或其他暴露的 Hermes 工具）时，codex 通过 stdio 生成 `hermes_tools_mcp_server` 子进程，请求通过 `model_tools.handle_function_call()` 分派，结果像任何其他 MCP 响应一样投影回 codex。

**通过回调可用的工具：** `web_search`、`web_extract`、`browser_navigate`、`browser_click`、`browser_type`、`browser_press`、`browser_snapshot`、`browser_scroll`、`browser_back`、`browser_get_images`、`browser_console`、`browser_vision`、`vision_analyze`、`image_generate`、`skill_view`、`skills_list`、`text_to_speech`。

**不可用的工具：** `delegate_task`、`memory`、`session_search`、`todo`。这些需要正在运行的 AIAgent 上下文来分派（循环中状态），无状态的 MCP 回调无法驱动它们。当您需要这些功能时，请使用默认的 Hermes 运行时（`/codex-runtime auto`）。

## 禁用

可随时切换回来：

```
/codex-runtime auto
```

在下一个会话中生效。Codex 托管的块保留在 `~/.codex/config.toml` 中，因此您以后可以重新启用而不会丢失配置 — 或者如果愿意，也可以手动删除它。

## 限制

此运行时为**可选测试版**。截至 Hermes Agent 2026.5 + Codex CLI 0.130.0 的工作状态：

- 多轮对话
- 通过 Hermes UI 进行 `commandExecution` 和 `fileChange` (apply_patch) 审批
- MCP 工具调用（已通过 `@modelcontextprotocol/server-filesystem` 和新的 `hermes-tools` 回调验证）
- 本地 Codex 插件迁移（已通过 Linear / GitHub / Calendar 库存验证）
- 拒绝/取消路径
- 开/关切换循环
- 记忆和技能引导计数器（通过集成测试实时验证）
- 通过 codex 进行的 Hermes web_search（实时验证：“OpenAI Codex CLI – Getting Started” 端到端返回）

已知限制：

- **Hermes 认证和 codex 认证是独立的会话。** 为了获得最干净的用户体验，您需要同时运行 `codex login` 和 `hermes auth login codex`（运行时使用 codex 的会话进行 LLM 调用）。这是 Hermes `_import_codex_cli_tokens` 中的刻意设计选择 — Hermes 不会与 codex CLI 共享 OAuth 状态，以避免在令牌刷新时相互冲突。
- **`delegate_task`、`memory`、`session_search`、`todo` 在此运行时不可用。** 它们需要正在运行的 AIAgent 上下文，无状态的 MCP 回调无法提供。当您需要这些功能时，请使用 `/codex-runtime auto`。
- **当 codex 不跟踪变更集时，审批提示中没有内联补丁预览。** Codex 的 `fileChange` 审批参数并不总是携带变更集。Hermes 会在可能的情况下缓存来自相应 `item/started` 通知的数据，但如果审批在项目流式传输之前到达，提示会回退到 codex 提供的任何 `reason`。
- **亚秒级取消不被保证。** 中途流中断（在 codex 响应期间按 Ctrl+C）通过 `turn/interrupt` 发送，但如果 codex 已经刷新了最终消息，您仍然会收到响应。

如果您发现了错误，请[提交一个问题](https://github.com/NousResearch/hermes-agent/issues)，并附上 `hermes logs --since 5m` 的输出。在标题中提及 `codex-runtime` 以便于分类。

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
        │   │       (回调到          │     │           │
        │   │        Hermes 更丰富    │     │           │
        │   │        的工具)          │     │           │
        │   └─────────────────────────┘     │           │
        └──────────────────────────────────┘           │
                                                        │
                                                        ▼
        ┌──────────────────────────────────────────────────────────┐
        │  hermes_tools_mcp_server.py (按需子进程)                  │
        │   web_search, web_extract, browser_*, vision_analyze,    │
        │   image_generate, skill_view, skills_list, text_to_speech│
        └──────────────────────────────────────────────────────────┘
```

有关实现细节，请参阅 [PR #24182](https://github.com/NousResearch/hermes-agent/pull/24182) 和 [Codex app-server 协议 README](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md)。