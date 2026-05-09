---
sidebar_position: 11
sidebar_label: "插件"
title: "插件"
description: "通过插件系统使用自定义工具、钩子和集成扩展 Hermes"
---

# 插件

Hermes 拥有一个插件系统，可在不修改核心代码的情况下添加自定义工具、钩子和集成。

如果你想为自己、你的团队或某个项目创建一个自定义工具，
这通常是正确的路径。开发者指南中的
[添加工具](/docs/developer-guide/adding-tools) 页面适用于内置于 Hermes 核心的工具，
这些工具位于 `tools/` 和 `toolsets.py` 中。

**→ [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)** —— 包含完整可运行示例的分步指南。

## 快速概览

将一个包含 `plugin.yaml` 和 Python 代码的目录放入 `~/.hermes/plugins/`：

```
~/.hermes/plugins/my-plugin/
├── plugin.yaml      # 清单
├── __init__.py      # register() —— 将模式连接到处理程序
├── schemas.py       # 工具模式（LLM 所看到的）
└── tools.py         # 工具处理程序（调用时运行的内容）
```

启动 Hermes —— 你的工具将出现在内置工具旁边。模型可以立即调用它们。

### 最小可运行示例

以下是一个完整的插件，它添加了一个 `hello_world` 工具，并通过一个钩子记录每次工具调用。

**`~/.hermes/plugins/hello-world/plugin.yaml`**

```yaml
name: hello-world
version: "1.0"
description: 一个最小示例插件
```

**`~/.hermes/plugins/hello-world/__init__.py`**

```python
"""最小 Hermes 插件 —— 注册一个工具和一个钩子。"""

import json


def register(ctx):
    # --- 工具: hello_world ---
    schema = {
        "name": "hello_world",
        "description": "为给定的名称返回一个友好的问候。",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "要问候的名称",
                }
            },
            "required": ["name"],
        },
    }

    def handle_hello(params, **kwargs):
        del kwargs
        name = params.get("name", "World")
        return json.dumps({"success": True, "greeting": f"Hello, {name}!"})

    ctx.register_tool(
        name="hello_world",
        toolset="hello_world",
        schema=schema,
        handler=handle_hello,
        description="为给定的名称返回一个友好的问候。",
    )

    # --- 钩子: 记录每次工具调用 ---
    def on_tool_call(tool_name, params, result):
        print(f"[hello-world] 工具被调用: {tool_name}")

    ctx.register_hook("post_tool_call", on_tool_call)
```

将这两个文件放入 `~/.hermes/plugins/hello-world/`，重启 Hermes，模型就可以立即调用 `hello_world`。该钩子会在每次工具调用后打印一行日志。

默认情况下，位于 `./.hermes/plugins/` 下的项目本地插件是禁用的。只有在启动 Hermes 前设置 `HERMES_ENABLE_PROJECT_PLUGINS=true`，才能为受信任的仓库启用它们。

## 插件可以做什么

以下每个 `ctx.*` API 都可在插件的 `register(ctx)` 函数内使用。

| 功能 | 实现方式 |
|-----------|-----|
| 添加工具 | `ctx.register_tool(name=..., toolset=..., schema=..., handler=...)` |
| 添加钩子 | `ctx.register_hook("post_tool_call", callback)` |
| 添加斜杠命令 | `ctx.register_command(name, handler, description)` — 在 CLI 和网关会话中添加 `/name` |
| 从命令分发工具 | `ctx.dispatch_tool(name, args)` — 调用已注册的工具，并自动连接父智能体上下文 |
| 添加 CLI 命令 | `ctx.register_cli_command(name, help, setup_fn, handler_fn)` — 添加 `hermes <plugin> <subcommand>` |
| 注入消息 | `ctx.inject_message(content, role="user")` — 参见[注入消息](#injecting-messages) |
| 分发数据文件 | `Path(__file__).parent / "data" / "file.yaml"` |
| 捆绑技能 | `ctx.register_skill(name, path)` — 命名空间为 `plugin:skill`，通过 `skill_view("plugin:skill")` 加载 |
| 基于环境变量控制 | 在 plugin.yaml 中设置 `requires_env: [API_KEY]` — 在 `hermes plugins install` 期间提示 |
| 通过 pip 分发 | `[project.entry-points."hermes_agent.plugins"]` |
| 注册网关平台（Discord、Telegram、IRC 等） | `ctx.register_platform(name, label, adapter_factory, check_fn, ...)` — 参见[添加平台适配器](/docs/developer-guide/adding-platform-adapters) |
| 注册图像生成后端 | `ctx.register_image_gen_provider(provider)` — 参见[图像生成提供者插件](/docs/developer-guide/image-gen-provider-plugin) |
| 注册上下文压缩引擎 | `ctx.register_context_engine(engine)` — 参见[上下文引擎插件](/docs/developer-guide/context-engine-plugin) |
| 注册记忆后端 | 在 `plugins/memory/<name>/__init__.py` 中继承 `MemoryProvider` — 参见[记忆提供者插件](/docs/developer-guide/memory-provider-plugin)（使用独立的发现系统） |
| 注册推理后端（大语言模型提供者） | 在 `plugins/model-providers/<name>/__init__.py` 中调用 `register_provider(ProviderProfile(...))` — 参见[模型提供者插件](/docs/developer-guide/model-provider-plugin)（使用独立的发现系统） |

## 插件发现机制

| 来源 | 路径 | 使用场景 |
|--------|------|----------|
| 内置 | `<repo>/plugins/` | 随 Hermes 一起分发 — 参见[内置插件](/docs/user-guide/features/built-in-plugins) |
| 用户 | `~/.hermes/plugins/` | 个人插件 |
| 项目 | `.hermes/plugins/` | 项目专用插件（需设置 `HERMES_ENABLE_PROJECT_PLUGINS=true`） |
| pip | `hermes_agent.plugins` entry_points | 分发的软件包 |
| Nix | `services.hermes-agent.extraPlugins` / `extraPythonPackages` | NixOS 声明式安装 — 参见[Nix 配置](/docs/getting-started/nix-setup#plugins) |

同名插件中，后发现的来源会覆盖先前的来源，因此与内置插件同名的用户插件会替换内置插件。

### 插件子类别

在每个来源中，Hermes 还会识别子类别目录，将插件路由到专门的发现系统：

| 子目录 | 包含内容 | 发现系统 |
|---|---|---|
| `plugins/`（根目录） | 通用插件 — 工具、钩子、斜杠命令、CLI 命令、捆绑技能 | `PluginManager`（类型：`standalone` 或 `backend`） |
| `plugins/platforms/<name>/` | 网关通道适配器（`ctx.register_platform()`） | `PluginManager`（类型：`platform`，深入一级） |
| `plugins/image_gen/<name>/` | 图像生成后端（`ctx.register_image_gen_provider()`） | `PluginManager`（类型：`backend`，深入一级） |
| `plugins/memory/<name>/` | 记忆提供者（继承 `MemoryProvider`） | **独立加载器**，位于 `plugins/memory/__init__.py`（类型：`exclusive` — 一次只能激活一个） |
| `plugins/context_engine/<name>/` | 上下文压缩引擎（`ctx.register_context_engine()`） | **独立加载器**，位于 `plugins/context_engine/__init__.py`（一次只能激活一个） |
| `plugins/model-providers/<name>/` | 大语言模型提供者配置（`register_provider(ProviderProfile(...))`） | **独立加载器**，位于 `providers/__init__.py`（在首次调用 `get_provider_profile()` 时惰性扫描） |

位于 `~/.hermes/plugins/model-providers/<name>/` 和 `~/.hermes/plugins/memory/<name>/` 的用户插件会覆盖同名的内置插件 — 在 `register_provider()` / `register_memory_provider()` 中采用“最后写入者获胜”原则。只需放入一个目录，即可替换内置插件，无需修改仓库。

## 插件默认不启用（少数例外）

**通用插件和用户安装的后端默认处于禁用状态** — 发现机制会找到它们（因此它们会出现在 `hermes plugins` 和 `/plugins` 中），但除非你将插件名称添加到 `~/.hermes/config.yaml` 的 `plugins.enabled` 列表中，否则任何包含钩子或工具的插件都不会加载。这可以防止第三方代码在未经你明确同意的情况下运行。

```yaml
plugins:
  enabled:
    - my-tool-plugin
    - disk-cleanup
  disabled:       # 可选的拒绝列表 — 如果名称同时出现在两个列表中，此列表优先
    - noisy-plugin
```

三种切换状态的方式：

```bash
hermes plugins                    # 交互式切换（按空格键勾选/取消勾选）
hermes plugins enable <name>      # 添加到允许列表
hermes plugins disable <name>     # 从允许列表移除 + 添加到禁用列表
```

执行 `hermes plugins install owner/repo` 后，系统会询问 `立即启用 'name' 吗？[y/N]` — 默认为否。使用 `--enable` 或 `--no-enable` 可在脚本化安装时跳过此提示。

### 允许列表不控制的内容

有几类插件会绕过 `plugins.enabled` — 它们是 Hermes 内置功能的一部分，如果默认被禁用，将破坏基本功能：

| 插件类型 | 激活方式 |
|---|---|
| **内置平台插件**（`plugins/platforms/` 下的 IRC、Teams 等） | 自动加载，确保每个分发的网关通道都可用。实际通道通过 `config.yaml` 中的 `gateway.platforms.<name>.enabled` 开启。 |
| **内置后端**（`plugins/image_gen/` 下的图像生成提供者等） | 自动加载，确保默认后端“开箱即用”。选择通过 `config.yaml` 中的 `<category>.provider` 进行（例如 `image_gen.provider: openai`）。 |
| **记忆提供者**（`plugins/memory/`） | 全部被发现；只有一个处于激活状态，由 `config.yaml` 中的 `memory.provider` 选择。 |
| **上下文引擎**（`plugins/context_engine/`） | 全部被发现；一个处于激活状态，由 `config.yaml` 中的 `context.engine` 选择。 |
| **模型提供者**（`plugins/model-providers/`） | 全部 33 个提供者在首次调用 `get_provider_profile()` 时被发现和注册。用户通过 `--provider` 或 `config.yaml` 一次选择一个。 |
| **通过 pip 安装的 `backend` 插件** | 通过 `plugins.enabled` 选择启用（与通用插件相同）。 |
| **用户安装的平台**（位于 `~/.hermes/plugins/platforms/` 下） | 通过 `plugins.enabled` 选择启用 — 第三方网关适配器需要明确同意。 |

简而言之：**内置的“开箱即用”基础设施会自动加载；第三方通用插件需要选择启用。** `plugins.enabled` 允许列表专门用于控制用户放入 `~/.hermes/plugins/` 的任意代码。

### 现有用户的迁移

当你升级到具有选择启用插件功能的 Hermes 版本（配置架构 v21+）时，任何已安装在 `~/.hermes/plugins/` 下且未在 `plugins.disabled` 中的用户插件都会**自动继承**到 `plugins.enabled` 中。你现有的设置将继续正常工作。内置的独立插件不会继承 — 即使是现有用户也必须明确选择启用。（内置平台/后端插件从未需要继承，因为它们从未被限制。）

## 可用钩子

插件可以注册这些生命周期事件的回调函数。有关完整详细信息、回调函数签名和示例，请参阅**[事件钩子页面](/docs/user-guide/features/hooks#plugin-hooks)**。

| 钩子 | 触发时机 |
|------|-----------|
| [`pre_tool_call`](/docs/user-guide/features/hooks#pre_tool_call) | 在任何工具执行之前 |
| [`post_tool_call`](/docs/user-guide/features/hooks#post_tool_call) | 在任何工具返回之后 |
| [`pre_llm_call`](/docs/user-guide/features/hooks#pre_llm_call) | 每轮一次，在 LLM 循环之前 — 可以返回 `{"context": "..."}` 以[将上下文注入用户消息](/docs/user-guide/features/hooks#pre_llm_call) |
| [`post_llm_call`](/docs/user-guide/features/hooks#post_llm_call) | 每轮一次，在 LLM 循环之后（仅成功轮次） |
| [`on_session_start`](/docs/user-guide/features/hooks#on_session_start) | 创建新会话时（仅第一轮） |
| [`on_session_end`](/docs/user-guide/features/hooks#on_session_end) | 每次 `run_conversation` 调用结束 + CLI 退出处理程序 |
| [`on_session_finalize`](/docs/user-guide/features/hooks#on_session_finalize) | CLI/网关拆除一个活动会话时（`/new`、GC、CLI 退出） |
| [`on_session_reset`](/docs/user-guide/features/hooks#on_session_reset) | 网关交换新的会话密钥时（`/new`、`/reset`、`/clear`、空闲轮换） |
| [`subagent_stop`](/docs/user-guide/features/hooks#subagent_stop) | 每次子智能体在 `delegate_task` 完成后 |
| [`pre_gateway_dispatch`](/docs/user-guide/features/hooks#pre_gateway_dispatch) | 网关收到用户消息后，在认证 + 分发之前。返回 `{"action": "skip" \| "rewrite" \| "allow", ...}` 以影响流程。 |

## 插件类型

Hermes 有四种插件：

| 类型 | 功能 | 选择方式 | 位置 |
|------|-------------|-----------|----------|
| **通用插件** | 添加工具、钩子、斜杠命令、CLI 命令 | 多选（启用/禁用） | `~/.hermes/plugins/` |
| **记忆提供者** | 替换或增强内置记忆 | 单选（一个激活） | `plugins/memory/` |
| **上下文引擎** | 替换内置上下文压缩器 | 单选（一个激活） | `plugins/context_engine/` |
| **模型提供者** | 声明一个推理后端（OpenRouter、Anthropic……） | 多注册，通过 `--provider` / `config.yaml` 选择 | `plugins/model-providers/` |

记忆提供者和上下文引擎是**提供者插件** — 每种类型一次只能激活一个。模型提供者也是插件，但可以同时加载多个；用户通过 `--provider` 或 `config.yaml` 每次选择一个。通用插件可以按任意组合启用。

## 可插拔接口 — 各插件类型对应的文档

上表列出了四种插件类别，但在“通用插件”（General plugins）中，`PluginContext` 暴露了多个不同的扩展点 — 此外，Hermes 还支持 Python 插件系统之外的扩展方式（例如基于配置的推理后端、挂钩 Shell 命令、外部服务器等）。请使用此表格查找与您要构建的内容对应的正确文档：

| 要添加…… | 方式 | 开发指南 |
|---|---|---|
| LLM 可调用的**工具** | Python 插件 — `ctx.register_tool()` | [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin) · [添加工具](/docs/developer-guide/adding-tools) |
| **生命周期钩子**（LLM 调用前后、会话开始/结束、工具过滤器） | Python 插件 — `ctx.register_hook()` | [钩子参考](/docs/user-guide/features/hooks) · [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin) |
| CLI / 网关的**斜杠命令** | Python 插件 — `ctx.register_command()` | [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin) · [扩展 CLI](/docs/developer-guide/extending-the-cli) |
| `hermes <thing>` 的**子命令** | Python 插件 — `ctx.register_cli_command()` | [扩展 CLI](/docs/developer-guide/extending-the-cli) |
| 插件捆绑的**技能** | Python 插件 — `ctx.register_skill()` | [创建技能](/docs/developer-guide/creating-skills) |
| **推理后端**（LLM 提供商：OpenAI 兼容、Codex、Anthropic-Messages、Bedrock） | 提供商插件 — 在 `plugins/model-providers/<name>/` 中调用 `register_provider(ProviderProfile(...))` | **[模型提供商插件](/docs/developer-guide/model-provider-plugin)** · [添加提供商](/docs/developer-guide/adding-providers) |
| **网关通道**（Discord / Telegram / IRC / Teams / 等） | 平台插件 — 在 `plugins/platforms/<name>/` 中调用 `ctx.register_platform()` | [添加平台适配器](/docs/developer-guide/adding-platform-adapters) |
| **记忆后端**（Honcho、Mem0、Supermemory …） | 记忆插件 — 在 `plugins/memory/<name>/` 中继承 `MemoryProvider` | [记忆提供商插件](/docs/developer-guide/memory-provider-plugin) |
| **上下文压缩策略** | 上下文引擎插件 — `ctx.register_context_engine()` | [上下文引擎插件](/docs/developer-guide/context-engine-plugin) |
| **图像生成后端**（DALL·E、SDXL …） | 后端插件 — `ctx.register_image_gen_provider()` | [图像生成提供商插件](/docs/developer-guide/image-gen-provider-plugin) |
| **TTS 后端**（任意 CLI — Piper、VoxCPM、Kokoro、xtts、语音克隆脚本 …） | 基于配置 — 在 `config.yaml` 中声明 `tts.providers.<name>`，并设置 `type: command` | [TTS 设置](/docs/user-guide/features/tts#custom-command-providers) |
| **STT 后端**（自定义 whisper 二进制文件、本地 ASR CLI） | 基于配置 — 将环境变量 `HERMES_LOCAL_STT_COMMAND` 设置为 Shell 模板 | [语音消息转录 (STT)](/docs/user-guide/features/tts#voice-message-transcription-stt) |
| **通过 MCP 的外部工具**（文件系统、GitHub、Linear、Notion、任意 MCP 服务器） | 基于配置 — 在 `config.yaml` 中声明 `mcp_servers.<name>`，并指定 `command:` / `url:`。Hermes 会自动发现该服务器的工具并将其与内置工具一起注册。 | [MCP](/docs/user-guide/features/mcp) |
| **额外的技能源**（自定义 GitHub 仓库、私有技能索引） | CLI — `hermes skills tap add <repo>` | [技能中心](/docs/user-guide/features/skills#skills-hub) · [发布自定义 tap](/docs/user-guide/features/skills#publishing-a-custom-skill-tap) |
| **网关事件钩子**（在 `gateway:startup`、`session:start`、`agent:end`、`command:*` 时触发） | 将 `HOOK.yaml` + `handler.py` 放入 `~/.hermes/hooks/<name>/` | [事件钩子](/docs/user-guide/features/hooks#gateway-event-hooks) |
| **Shell 钩子**（在事件发生时运行 Shell 命令 — 通知、审计日志、桌面提醒） | 基于配置 — 在 `config.yaml` 中声明 `hooks:` | [Shell 钩子](/docs/user-guide/features/hooks#shell-hooks) |

:::note
并非所有扩展都是 Python 插件。某些扩展接口 intentionally 使用**基于配置的 Shell 命令**（如 TTS、STT、Shell 钩子），这样您现有的任何 CLI 工具无需编写 Python 代码即可成为插件。其他扩展则是**外部服务器**（如 MCP），智能体连接到这些服务器并自动注册其中的工具。还有一些是**即插即用目录**（如网关钩子），它们有自己的清单格式。请根据您的用例选择合适的扩展接口；上表中的每个开发指南都涵盖了占位符、发现机制和示例。
:::

## NixOS 声明式插件

在 NixOS 上，可以通过模块选项以声明式方式安装插件 — 无需执行 `hermes plugins install`。详见 **[Nix 设置指南](/docs/getting-started/nix-setup#plugins)**。

```nix
services.hermes-agent = {
  # 目录插件（包含 plugin.yaml 的源码树）
  extraPlugins = [ (pkgs.fetchFromGitHub { ... }) ];
  # 入口点插件（pip 包）
  extraPythonPackages = [ (pkgs.python312Packages.buildPythonPackage { ... }) ];
  # 在配置中启用
  settings.plugins.enabled = [ "my-plugin" ];
};
```

声明式插件会以 `nix-managed-` 前缀创建符号链接 — 它们与手动安装的插件共存，并在从 Nix 配置中移除后自动清理。

## 管理插件

```bash
hermes plugins                               # 统一的交互式 UI
hermes plugins list                          # 表格：已启用 / 已禁用 / 未启用
hermes plugins install user/repo             # 从 Git 安装，然后提示是否启用？[y/N]
hermes plugins install user/repo --enable    # 安装并启用（无提示）
hermes plugins install user/repo --no-enable # 安装但保持禁用状态（无提示）
hermes plugins update my-plugin              # 拉取最新版本
hermes plugins remove my-plugin              # 卸载
hermes plugins enable my-plugin              # 添加到允许列表
hermes plugins disable my-plugin             # 从允许列表中移除 + 添加到禁用列表
```

### 交互式 UI

不带参数运行 `hermes plugins` 会打开一个复合交互式界面：

```
插件
  ↑↓ 导航  SPACE 切换  ENTER 配置/确认  ESC 完成

  通用插件
 → [✓] my-tool-plugin — 自定义搜索工具
   [ ] webhook-notifier — 事件钩子
   [ ] disk-cleanup — 临时文件自动清理 [bundled]

  提供商插件
     记忆提供商          ▸ honcho
     上下文引擎           ▸ compressor
```

- **通用插件部分** — 复选框，使用 SPACE 切换。选中 = 在 `plugins.enabled` 中，未选中 = 在 `plugins.disabled` 中（显式关闭）。
- **提供商插件部分** — 显示当前选择。按 ENTER 进入单选选择器，您可以在其中选择一个活跃的提供商。
- 捆绑插件在同一列表中显示，并带有 `[bundled]` 标签。

提供商插件的选择会保存到 `config.yaml`：

```yaml
memory:
  provider: "honcho"      # 空字符串 = 仅使用内置

context:
  engine: "compressor"    # 默认内置压缩器
```

### 已启用 vs. 已禁用 vs. 未启用

插件处于以下三种状态之一：

| 状态 | 含义 | 是否在 `plugins.enabled` 中？ | 是否在 `plugins.disabled` 中？ |
|---|---|---|---|
| `enabled` | 下次会话时加载 | 是 | 否 |
| `disabled` | 显式关闭 — 即使也在 `enabled` 中也不会加载 | （无关） | 是 |
| `not enabled` | 已发现但从未选择启用 | 否 | 否 |

新安装或捆绑插件的默认状态是 `not enabled`。`hermes plugins list` 会显示所有三种不同的状态，以便您区分哪些是显式关闭的，哪些只是等待启用。

在运行中的会话中，`/plugins` 命令会显示当前已加载的插件。

## 注入消息

插件可以使用 `ctx.inject_message()` 将消息注入到当前对话中：

```python
ctx.inject_message("来自 Webhook 的新数据", role="user")
```

**签名：** `ctx.inject_message(content: str, role: str = "user") -> bool`

工作原理：

- 如果智能体**空闲**（等待用户输入），消息将作为下一个输入排队，并开始新的一轮交互。
- 如果智能体**正在处理中**（ actively running），消息将中断当前操作 — 等同于用户输入新消息并按 Enter。
- 对于非 `"user"` 角色，内容会加上 `[role]` 前缀（例如 `[system] ...`）。
- 如果消息成功排队，返回 `True`；如果无 CLI 引用（例如在网关模式下），则返回 `False`。

这使得远程控制查看器、消息桥接器或 Webhook 接收器等插件能够从外部源向对话中注入消息。

:::note
`inject_message` 仅在 CLI 模式下可用。在网关模式下，没有 CLI 引用，该方法返回 `False`。
:::

有关处理程序约定、模式格式、钩子行为、错误处理以及常见错误的完整指南，请参阅 **[完整指南](/docs/guides/build-a-hermes-plugin)**。