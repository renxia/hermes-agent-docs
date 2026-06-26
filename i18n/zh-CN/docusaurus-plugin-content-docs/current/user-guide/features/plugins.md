---
sidebar_position: 11
sidebar_label: "Plugins"
title: "Plugins"
description: "通过插件系统使用自定义工具、钩子和集成来扩展 Hermes"
---

# Plugins

Hermes 提供了一个插件系统，用于添加自定义工具、钩子和集成，而无需修改核心代码。

如果你想为自己、你的团队或某个项目创建自定义工具，这通常是正确的路径。开发者指南中的[添加工具](/developer-guide/adding-tools)页面适用于位于 `tools/` 和 `toolsets.py` 中的内置 Hermes 核心工具。

**→ [构建 Hermes 插件](/guides/build-a-hermes-plugin)** — 包含完整可运行示例的分步指南。

## 快速概览

将一个包含 `plugin.yaml` 和 Python 代码的目录放入 `~/.hermes/plugins/`：

```
~/.hermes/plugins/my-plugin/
├── plugin.yaml      # 清单文件
├── __init__.py      # register() — 将 schema 连接到处理程序
├── schemas.py       # 工具 schema（LLM 看到的内容）
└── tools.py         # 工具处理程序（调用时执行的内容）
```

启动 Hermes — 你的工具会与内置工具一起出现。模型可以立即调用它们。

### 最小可运行示例

以下是一个完整的插件，添加了一个 `hello_world` 工具，并通过钩子记录每次工具调用。

**`~/.hermes/plugins/hello-world/plugin.yaml`**

```yaml
name: hello-world
version: "1.0"
description: A minimal example plugin
```

**`~/.hermes/plugins/hello-world/__init__.py`**

```python
"""Minimal Hermes plugin — registers a tool and a hook."""

import json


def register(ctx):
    # --- Tool: hello_world ---
    schema = {
        "name": "hello_world",
        "description": "Returns a friendly greeting for the given name.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name to greet",
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
        description="Return a friendly greeting for the given name.",
    )

    # --- Hook: log every tool call ---
    def on_tool_call(tool_name, params, result):
        print(f"[hello-world] tool called: {tool_name}")

    ctx.register_hook("post_tool_call", on_tool_call)
```

将这两个文件放入 `~/.hermes/plugins/hello-world/`，重启 Hermes，模型就可以立即调用 `hello_world`。钩子会在每次工具调用后打印一行日志。

位于 `./.hermes/plugins/` 下的项目级插件默认是禁用的。仅对受信任的仓库启用，在启动 Hermes 之前设置 `HERMES_ENABLE_PROJECT_PLUGINS=true`。

## 插件能做什么

以下每个 `ctx.*` API 在插件的 `register(ctx)` 函数中均可用。

| 能力 | 实现方式 |
|-----------|-----|
| 添加工具 | `ctx.register_tool(name=..., toolset=..., schema=..., handler=...)` |
| 添加钩子 | `ctx.register_hook("post_tool_call", callback)` |
| 添加斜杠命令 | `ctx.register_command(name, handler, description)` — 在 CLI 和网关会话中添加 `/name` |
| 从命令派发工具 | `ctx.dispatch_tool(name, args)` — 调用已注册的工具，自动注入父智能体上下文 |
| 添加 CLI 命令 | `ctx.register_cli_command(name, help, setup_fn, handler_fn)` — 添加 `hermes <plugin> <subcommand>` |
| 注入消息 | `ctx.inject_message(content, role="user")` — 参见[注入消息](#注入消息) |
| 附带数据文件 | `Path(__file__).parent / "data" / "file.yaml"` |
| 打包技能 | `ctx.register_skill(name, path)` — 命名空间为 `plugin:skill`，通过 `skill_view("plugin:skill")` 加载 |
| 基于环境变量设置门槛 | plugin.yaml 中的 `requires_env: [API_KEY]` — 在 `hermes plugins install` 期间提示 |
| 通过 pip 分发 | `[project.entry-points."hermes_agent.plugins"]` |
| 注册网关平台（Discord、Telegram、IRC 等） | `ctx.register_platform(name, label, adapter_factory, check_fn, ...)` — 参见[添加平台适配器](/developer-guide/adding-platform-adapters) |
| 注册图像生成后端 | `ctx.register_image_gen_provider(provider)` — 参见[图像生成提供者插件](/developer-guide/image-gen-provider-plugin) |
| 注册视频生成后端 | `ctx.register_video_gen_provider(provider)` — 参见[视频生成提供者插件](/developer-guide/video-gen-provider-plugin) |
| 注册上下文压缩引擎 | `ctx.register_context_engine(engine)` — 参见[上下文引擎插件](/developer-guide/context-engine-plugin) |
| 注册记忆后端 | 在 `plugins/memory/<name>/__init__.py` 中继承 `MemoryProvider` — 参见[记忆提供者插件](/developer-guide/memory-provider-plugin)（使用独立的发现系统） |
| 执行宿主所属的 LLM 调用 | `ctx.llm.complete(...)` / `ctx.llm.complete_structured(...)` — 借用用户的活跃模型 + 认证，执行一次性补全，可选 JSON schema 验证。参见[插件 LLM 访问](/developer-guide/plugin-llm-access) |
| 注册推理后端（LLM 提供者） | 在 `plugins/model-providers/<name>/__init__.py` 中执行 `register_provider(ProviderProfile(...))` — 参见[模型提供者插件](/developer-guide/model-provider-plugin)（使用独立的发现系统） |

## 插件发现

| 来源 | 路径 | 使用场景 |
|--------|------|----------|
| 内置 | `<repo>/plugins/` | 随 Hermes 一起发布 — 参见[内置插件](/user-guide/features/built-in-plugins) |
| 用户 | `~/.hermes/plugins/` | 个人插件 |
| 项目 | `.hermes/plugins/` | 项目专用插件（需要 `HERMES_ENABLE_PROJECT_PLUGINS=true`） |
| pip | `hermes_agent.plugins` entry_points | 分发的包 |
| Nix | `services.hermes-agent.extraPlugins` / `extraPythonPackages` | NixOS 声明式安装 — 参见[Nix 设置](/getting-started/nix-setup#plugins) |

在名称冲突时，后发现的来源覆盖先发现的来源，因此与内置插件同名的用户插件会替换它。

### 插件子类别

在每个来源内，Hermes 还能识别将插件路由到专门发现系统的子类别目录：

| 子目录 | 包含内容 | 发现系统 |
|---|---|---|
| `plugins/`（根目录） | 通用插件 — 工具、钩子、斜杠命令、CLI 命令、内置技能 | `PluginManager`（类型：`standalone` 或 `backend`） |
| `plugins/platforms/<name>/` | 网关频道适配器（`ctx.register_platform()`） | `PluginManager`（类型：`platform`，深一层） |
| `plugins/image_gen/<name>/` | 图像生成后端（`ctx.register_image_gen_provider()`） | `PluginManager`（类型：`backend`，深一层） |
| `plugins/memory/<name>/` | 记忆提供者（继承 `MemoryProvider`） | `plugins/memory/__init__.py` 中的**独立加载器**（类型：`exclusive` — 一次仅激活一个） |
| `plugins/context_engine/<name>/` | 上下文压缩引擎（`ctx.register_context_engine()`） | `plugins/context_engine/__init__.py` 中的**独立加载器**（一次仅激活一个） |
| `plugins/model-providers/<name>/` | LLM 提供者配置（`register_provider(ProviderProfile(...))`） | `providers/__init__.py` 中的**独立加载器**（在首次调用 `get_provider_profile()` 时惰性扫描） |

位于 `~/.hermes/plugins/model-providers/<name>/` 和 `~/.hermes/plugins/memory/<name>/` 的用户插件会覆盖同名的内置插件 — 在 `register_provider()` / `register_memory_provider()` 中遵循最后写入者优先原则。只需放入一个目录，即可替换内置版本，无需任何仓库编辑。

## 插件是可选的（少数例外）

**通用插件和用户安装的后端默认处于禁用状态** — 发现系统能找到它们（因此它们会显示在 `hermes plugins` 和 `/plugins` 中），但包含钩子或工具的内容不会加载，除非你将插件名称添加到 `~/.hermes/config.yaml` 的 `plugins.enabled` 中。这可以防止第三方代码在未经你明确同意的情况下运行。

```yaml
plugins:
  enabled:
    - my-tool-plugin
    - disk-cleanup
  disabled:       # 可选的拒绝列表 — 如果某名称同时出现在两个列表中，此项始终优先
    - noisy-plugin
```

三种切换方式：

```bash
hermes plugins                    # 交互式切换（空格键勾选/取消勾选）
hermes plugins enable <name>      # 添加到允许列表
hermes plugins disable <name>     # 从允许列表移除并添加到禁用列表
```

执行 `hermes plugins install owner/repo` 后，系统会询问 `是否立即启用 'name'？[y/N]` — 默认为否。使用 `--enable` 或 `--no-enable` 可在脚本化安装中跳过此提示。

### 允许列表不限制的内容

有几类插件绕过了 `plugins.enabled` — 它们是 Hermes 内置功能的一部分，如果默认关闭将破坏基本功能：

| 插件类型 | 激活方式 |
|---|---|
| **内置平台插件**（`plugins/platforms/` 下的 IRC、Teams 等） | 自动加载，使每个随网关频道可用。实际频道通过 `config.yaml` 中的 `gateway.platforms.<name>.enabled` 开启。 |
| **内置后端**（`plugins/image_gen/` 下的图像生成提供者等） | 自动加载，使默认后端"开箱即用"。通过 `config.yaml` 中的 `<category>.provider` 进行选择（例如 `image_gen.provider: openai`）。 |
| **记忆提供者**（`plugins/memory/`） | 所有发现的插件均加载；通过 `config.yaml` 中的 `memory.provider` 选择恰好一个激活。 |
| **上下文引擎**（`plugins/context_engine/`） | 所有发现的插件均加载；通过 `config.yaml` 中的 `context.engine` 选择一个激活。 |
| **模型提供者**（`plugins/model-providers/`） | `plugins/model-providers/` 下的所有内置提供者在首次调用 `get_provider_profile()` 时自动发现并注册。用户通过 `--provider` 或 `config.yaml` 每次选择一个。 |
| **pip 安装的 `backend` 插件** | 通过 `plugins.enabled` 选择启用（与通用插件相同）。 |
| **用户安装的平台**（位于 `~/.hermes/plugins/platforms/` 下） | 通过 `plugins.enabled` 选择启用 — 第三方网关适配器需要明确同意。 |

简而言之：**内置的"始终可用"基础设施自动加载；第三方通用插件是选择启用的。** `plugins.enabled` 允许列表专门针对用户放入 `~/.hermes/plugins/` 的任意代码充当门槛。

### 现有用户的迁移

当你升级到具有选择启用插件功能的 Hermes 版本（配置 schema v21+）时，已安装在 `~/.hermes/plugins/` 下且未在 `plugins.disabled` 中的任何用户插件将**自动纳入** `plugins.enabled`。你现有的配置继续有效。内置独立插件**不会**被纳入 — 即使是现有用户也必须明确选择启用。（内置平台/后端插件从不需要被纳入，因为它们从未被限制过。）

## 可用钩子

插件可以为这些生命周期事件注册回调。详情、回调签名和示例请参阅**[事件钩子页面](/user-guide/features/hooks#plugin-hooks)**。

| 钩子 | 触发时机 |
|------|-----------|
| [`pre_tool_call`](/user-guide/features/hooks#pre_tool_call) | 任何工具执行之前 |
| [`post_tool_call`](/user-guide/features/hooks#post_tool_call) | 任何工具返回之后 |
| [`pre_llm_call`](/user-guide/features/hooks#pre_llm_call) | 每轮一次，在 LLM 循环之前 — 可返回 `{"context": "..."}` 以[向用户消息注入上下文](/user-guide/features/hooks#pre_llm_call) |
| [`post_llm_call`](/user-guide/features/hooks#post_llm_call) | 每轮一次，在 LLM 循环之后（仅成功轮次） |
| [`on_session_start`](/user-guide/features/hooks#on_session_start) | 创建新会话时（仅首轮） |
| [`on_session_end`](/user-guide/features/hooks#on_session_end) | 每次 `run_conversation` 调用结束时 + CLI 退出处理 |
| [`on_session_finalize`](/user-guide/features/hooks#on_session_finalize) | CLI/网关拆除活动会话时（`/new`、GC、CLI 退出） |
| [`on_session_reset`](/user-guide/features/hooks#on_session_reset) | 网关换入新会话密钥时（`/new`、`/reset`、`/clear`、空闲轮换） |
| [`subagent_stop`](/user-guide/features/hooks#subagent_stop) | `delegate_task` 完成后，每个子智能体触发一次 |
| [`pre_gateway_dispatch`](/user-guide/features/hooks#pre_gateway_dispatch) | 网关收到用户消息时，在认证 + 派发之前。返回 `{"action": "skip" \| "rewrite" \| "allow", ...}` 以影响流程。 |

## 插件类型

Hermes 有四种插件：

| 类型 | 功能 | 选择模式 | 位置 |
|------|-------------|-----------|----------|
| **通用插件** | 添加工具、钩子、斜杠命令、CLI 命令 | 多选（启用/禁用） | `~/.hermes/plugins/` |
| **记忆提供者** | 替换或增强内置记忆 | 单选（一个激活） | `plugins/memory/` |
| **上下文引擎** | 替换内置上下文压缩器 | 单选（一个激活） | `plugins/context_engine/` |
| **模型提供者** | 声明推理后端（OpenRouter、Anthropic、……） | 多注册，通过 `--provider` / `config.yaml` 选取 | `plugins/model-providers/` |

记忆提供者和上下文引擎是**提供者插件**——每种类型同时只能激活一个。模型提供者也是插件，但多个可以同时加载；用户通过 `--provider` 或 `config.yaml` 每次选取一个。通用插件可以任意组合启用。

## 可插拔接口——各类型对应去向

上表展示了四种插件类别，但在"通用插件"中，`PluginContext` 暴露了多个不同的扩展点——同时 Hermes 也接受 Python 插件系统之外的扩展（配置驱动的后端、shell 钩入的命令、外部服务器等）。使用下表找到适合你构建目标的文档：

| 想要添加…… | 方式 | 开发指南 |
|---|---|---|
| LLM 可调用的**工具** | Python 插件——`ctx.register_tool()` | [构建 Hermes 插件](/guides/build-a-hermes-plugin) · [添加工具](/developer-guide/adding-tools) |
| **生命周期钩子**（pre/post LLM、session start/end、工具过滤） | Python 插件——`ctx.register_hook()` | [钩子参考](/user-guide/features/hooks) · [构建 Hermes 插件](/guides/build-a-hermes-plugin) |
| CLI / 网关的**斜杠命令** | Python 插件——`ctx.register_command()` | [构建 Hermes 插件](/guides/build-a-hermes-plugin) · [扩展 CLI](/developer-guide/extending-the-cli) |
| `hermes <thing>` 的**子命令** | Python 插件——`ctx.register_cli_command()` | [扩展 CLI](/developer-guide/extending-the-cli) |
| 插件附带的捆绑**技能** | Python 插件——`ctx.register_skill()` | [创建技能](/developer-guide/creating-skills) |
| **推理后端**（LLM 提供者：OpenAI-compat、Codex、Anthropic-Messages、Bedrock） | 提供者插件——在 `plugins/model-providers/<name>/` 中调用 `register_provider(ProviderProfile(...))` | **[模型提供者插件](/developer-guide/model-provider-plugin)** · [添加提供者](/developer-guide/adding-providers) |
| **网关频道**（Discord / Telegram / IRC / Teams / 等） | 平台插件——在 `plugins/platforms/<name>/` 中调用 `ctx.register_platform()` | [添加平台适配器](/developer-guide/adding-platform-adapters) |
| **记忆后端**（Honcho、Mem0、Supermemory、……） | 记忆插件——在 `plugins/memory/<name>/` 中继承 `MemoryProvider` | [记忆提供者插件](/developer-guide/memory-provider-plugin) |
| **上下文压缩策略** | 上下文引擎插件——`ctx.register_context_engine()` | [上下文引擎插件](/developer-guide/context-engine-plugin) |
| **图像生成后端**（DALL·E、SDXL、……） | 后端插件——`ctx.register_image_gen_provider()` | [图像生成提供者插件](/developer-guide/image-gen-provider-plugin) |
| **视频生成后端**（Veo、Kling、Pixverse、Grok-Imagine、Runway、……） | 后端插件——`ctx.register_video_gen_provider()` | [视频生成提供者插件](/developer-guide/video-gen-provider-plugin) |
| **TTS 后端**（任意 CLI——Piper、VoxCPM、Kokoro、xtts、voice-cloning 脚本、……） | 配置驱动（推荐）——在 `config.yaml` 中 `tts.providers.<name>` 下用 `type: command` 声明。或 Python 后端插件——需要 shell 模板之外的 Python SDK / 流式引擎时使用 `ctx.register_tts_provider()`。 | [TTS 设置](/user-guide/features/tts#custom-command-providers) · [Python 插件指南](/user-guide/features/tts#python-plugin-providers) |
| **STT 后端**（任意 CLI——whisper.cpp、自定义 whisper 二进制、本地 ASR CLI） | 配置驱动（推荐）——在 `config.yaml` 中 `stt.providers.<name>` 下用 `type: command` 声明，或设置 `HERMES_LOCAL_STT_COMMAND` 作为旧版单命令的应急方案。或 Python 后端插件——适用于 Python SDK 引擎（OpenRouter、SenseAudio、Gemini-STT 等）使用 `ctx.register_transcription_provider()`。 | [STT 设置](/user-guide/features/tts#stt-custom-command-providers) · [Python 插件指南](/user-guide/features/tts#python-plugin-providers-stt) |
| **通过 MCP 的外部工具**（文件系统、GitHub、Linear、Notion、任意 MCP 服务器） | 配置驱动——在 `config.yaml` 中声明 `mcp_servers.<name>` 并设置 `command:` / `url:`。Hermes 自动发现服务器的工具并与内置工具一起注册。 | [MCP](/user-guide/features/mcp) |
| **额外技能来源**（自定义 GitHub 仓库、私有技能索引） | CLI——`hermes skills tap add <repo>` | [技能中心](/user-guide/features/skills#skills-hub) · [发布自定义 tap](/user-guide/features/skills#publishing-a-custom-skill-tap) |
| **网关事件钩子**（在 `gateway:startup`、`session:start`、`agent:end`、`command:*` 时触发） | 将 `HOOK.yaml` + `handler.py` 放入 `~/.hermes/hooks/<name>/` | [事件钩子](/user-guide/features/hooks#gateway-event-hooks) |
| **Shell 钩子**（事件触发 shell 命令——通知、审计日志、桌面提醒） | 配置驱动——在 `config.yaml` 中 `hooks:` 下声明 | [Shell 钩子](/user-guide/features/hooks#shell-hooks) |

:::note
并非一切都是 Python 插件。部分扩展面有意使用 **配置驱动的 shell 命令**（TTS、STT、shell 钩子），让你已有的任何 CLI 无需编写 Python 即可成为插件。其他是**外部服务器**（MCP），智能体连接后自动注册其中的工具。还有一些是**放入式目录**（网关钩子），有自己的清单格式。根据你的使用场景选择合适的扩展面；上表中的开发指南均涵盖占位符、发现机制和小例子。
:::

## NixOS 声明式插件

在 NixOS 上，可以通过模块选项声明式安装插件——无需 `hermes plugins install`。详情请参阅 **[Nix 设置指南](/getting-started/nix-setup#plugins)**。

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

声明式插件以 `nix-managed-` 前缀符号链接——它们与手动安装的插件共存，在从 Nix 配置中移除时自动清理。

## 管理插件

```bash
hermes plugins                               # 统一的交互式界面
hermes plugins list                          # 表格：已启用 / 已禁用 / 未启用
hermes plugins install user/repo             # 从 Git 安装，然后提示 启用？[y/N]
hermes plugins install user/repo --enable    # 安装并启用（无提示）
hermes plugins install user/repo --no-enable # 安装但保持禁用（无提示）
hermes plugins update my-plugin              # 拉取最新版本
hermes plugins remove my-plugin              # 卸载
hermes plugins enable my-plugin              # 加入允许列表
hermes plugins disable my-plugin             # 从允许列表移除并加入禁用列表
```

### 交互式界面

不带参数运行 `hermes plugins` 会打开一个组合式交互界面：

```
Plugins
  ↑↓ 导航  SPACE 切换  ENTER 配置/确认  ESC 完成

  General Plugins
 → [✓] my-tool-plugin — 自定义搜索工具
   [ ] webhook-notifier — 事件钩子
   [ ] disk-cleanup — 自动清理临时文件 [bundled]

  Provider Plugins
     Memory Provider          ▸ honcho
     Context Engine           ▸ compressor
```

- **通用插件部分**——复选框，用 SPACE 切换。勾选 = 在 `plugins.enabled` 中，未勾选 = 在 `plugins.disabled` 中（显式关闭）。
- **提供者插件部分**——显示当前选择。按 ENTER 进入无线电选择器，选择一个激活的提供者。
- 捆绑插件以 `[bundled]` 标签显示在同一列表中。

提供者插件的选择保存到 `config.yaml`：

```yaml
memory:
  provider: "honcho"      # 空字符串 = 仅内置

context:
  engine: "compressor"    # 默认内置压缩器
```

### 已启用 vs. 已禁用 vs. 未启用

插件处于以下三种状态之一：

| 状态 | 含义 | 在 `plugins.enabled` 中？ | 在 `plugins.disabled` 中？ |
|---|---|---|---|
| `enabled` | 下次会话加载 | 是 | 否 |
| `disabled` | 显式关闭——即使在 `enabled` 中也不会加载 | （无关） | 是 |
| `not enabled` | 已发现但从未选择加入 | 否 | 否 |

新安装的或捆绑的插件默认为 `not enabled`。`hermes plugins list` 显示所有三种不同状态，以便你区分哪些被显式关闭、哪些只是等待启用。

在运行中的会话中，`/plugins` 显示当前加载的插件。

## 注入消息

插件可以使用 `ctx.inject_message()` 向活跃对话注入消息：

```python
ctx.inject_message("New data arrived from the webhook", role="user")
```

**签名：** `ctx.inject_message(content: str, role: str = "user") -> bool`

工作原理：

- 如果智能体**空闲**（等待用户输入），消息被排队作为下一个输入并开始新一轮对话。
- 如果智能体**在对话中**（正在运行），消息会中断当前操作——效果等同于用户输入新消息并按下回车。
- 对于非 `"user"` 角色，内容会加上 `[role]` 前缀（例如 `[system] ...`）。
- 如果消息成功排队则返回 `True`，如果无 CLI 引用可用（例如在网关模式下）则返回 `False`。

这使得远程控制查看器、消息桥接器或 webhook 接收器等插件可以从外部来源向对话注入消息。

:::note
`inject_message` 仅在 CLI 模式下可用。在网关模式下，无 CLI 引用，该方法返回 `False`。
:::

请参阅**[完整指南](/guides/build-a-hermes-plugin)**了解处理程序契约、schema 格式、钩子行为、错误处理和常见错误。