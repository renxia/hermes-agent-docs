---
sidebar_position: 11
sidebar_label: "插件"
title: "插件"
description: "通过插件系统扩展 Hermes 的自定义工具、钩子和集成"
---

# 插件

Hermes 有一个插件系统，用于在不修改核心代码的情况下添加自定义工具、钩子和集成。

如果您想为自己、您的团队或某个项目创建一个自定义工具，这通常是正确的途径。开发者指南中的[添加工具](/developer-guide/adding-tools)页面是针对位于 `tools/` 和 `toolsets.py` 中的内置 Hermes 核心工具。

**→ [构建 Hermes 插件](/guides/build-a-hermes-plugin)** — 包含完整工作示例的分步指南。

## 快速概览

将一个包含 `plugin.yaml` 和 Python 代码的目录放入 `~/.hermes/plugins/`：

```
~/.hermes/plugins/my-plugin/
├── plugin.yaml      # 清单文件
├── __init__.py      # register() — 将模式连接到处理程序
├── schemas.py       # 工具模式（LLM 看到的内容）
└── tools.py         # 工具处理程序（调用时运行的内容）
```

启动 Hermes — 您的工具会出现在内置工具旁边。模型可以立即调用它们。

### 最小工作示例

这是一个完整的插件，它添加了一个 `hello_world` 工具，并通过钩子记录每次工具调用。

**`~/.hermes/plugins/hello-world/plugin.yaml`**

```yaml
name: hello-world
version: "1.0"
description: 一个最小示例插件
```

**`~/.hermes/plugins/hello-world/__init__.py`**

```python
"""最小 Hermes 插件 — 注册一个工具和一个钩子。"""

import json


def register(ctx):
    # --- 工具: hello_world ---
    schema = {
        "name": "hello_world",
        "description": "为给定的名字返回友好的问候。",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "要问候的名字",
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
        description="为给定的名字返回友好的问候。",
    )

    # --- 钩子: 记录每次工具调用 ---
    def on_tool_call(tool_name, params, result):
        print(f"[hello-world] 工具被调用: {tool_name}")

    ctx.register_hook("post_tool_call", on_tool_call)
```

将这两个文件放入 `~/.hermes/plugins/hello-world/`，重新启动 Hermes，模型就可以立即调用 `hello_world`。该钩子会在每次工具调用后打印一行日志。

位于 `./.hermes/plugins/` 下的项目本地插件默认是禁用的。仅通过设置 `HERMES_ENABLE_PROJECT_PLUGINS=true`（在启动 Hermes 之前）来为受信任的仓库启用它们。

# 插件能力

下方每个 `ctx.*` API 均可在插件的 `register(ctx)` 函数内部使用。

| 能力 | 使用方式 |
|------|----------|
| 添加工具 | `ctx.register_tool(name=..., toolset=..., schema=..., handler=...)` |
| 添加钩子 | `ctx.register_hook("post_tool_call", callback)` |
| 添加斜杠命令 | `ctx.register_command(name, handler, description)` — 在CLI和网关会话中添加 `/name` |
| 从命令调度工具 | `ctx.dispatch_tool(name, args)` — 调用已注册的工具，并自动配置父级智能体上下文 |
| 添加CLI命令 | `ctx.register_cli_command(name, help, setup_fn, handler_fn)` — 添加 `hermes <插件> <子命令>` |
| 注入消息 | `ctx.inject_message(content, role="user")` — 参见[注入消息](#注入消息) |
| 附带数据文件 | `Path(__file__).parent / "data" / "file.yaml"` |
| 打包技能 | `ctx.register_skill(name, path)` — 命名空间为 `插件:技能`，通过 `skill_view("插件:技能")` 加载 |
| 基于环境变量控制 | 在 `plugin.yaml` 中设置 `requires_env: [API_KEY]` — 在 `hermes plugins install` 时提示 |
| 通过pip分发 | `[project.entry-points."hermes_agent.plugins"]` |
| 注册网关平台（Discord, Telegram, IRC等） | `ctx.register_platform(name, label, adapter_factory, check_fn, ...)` — 参见[添加平台适配器](/developer-guide/adding-platform-adapters) |
| 注册图像生成后端 | `ctx.register_image_gen_provider(provider)` — 参见[图像生成提供者插件](/developer-guide/image-gen-provider-plugin) |
| 注册视频生成后端 | `ctx.register_video_gen_provider(provider)` — 参见[视频生成提供者插件](/developer-guide/video-gen-provider-plugin) |
| 注册上下文压缩引擎 | `ctx.register_context_engine(engine)` — 参见[上下文引擎插件](/developer-guide/context-engine-plugin) |
| 注册记忆后端 | 在 `plugins/memory/<name>/__init__.py` 中子类化 `MemoryProvider` — 参见[记忆提供者插件](/developer-guide/memory-provider-plugin)（使用单独的发现系统） |
| 运行主机拥有的LLM调用 | `ctx.llm.complete(...)` / `ctx.llm.complete_structured(...)` — 借用用户的活跃模型和认证进行一次性补全，支持可选的JSON模式验证。参见[插件LLM访问](/developer-guide/plugin-llm-access) |
| 注册推理后端（LLM提供者） | 在 `plugins/model-providers/<name>/__init__.py` 中调用 `register_provider(ProviderProfile(...))` — 参见[模型提供者插件](/developer-guide/model-provider-plugin)（使用单独的发现系统） |

## 插件发现

| 来源 | 路径 | 用途 |
|------|------|------|
| 内置 | `<repo>/plugins/` | 随Hermes一起分发 — 参见[内置插件](/user-guide/features/built-in-plugins) |
| 用户 | `~/.hermes/plugins/` | 个人插件 |
| 项目 | `.hermes/plugins/` | 项目特定插件（需要设置 `HERMES_ENABLE_PROJECT_PLUGINS=true`） |
| pip | `hermes_agent.plugins` entry_points | 分发的包 |
| Nix | `services.hermes-agent.extraPlugins` / `extraPythonPackages` | NixOS声明式安装 — 参见[Nix设置](/getting-started/nix-setup#plugins) |

后发现的来源会在名称冲突时覆盖先前来源，因此与内置插件同名的用户插件会替换它。

### 插件子类别

在每个来源内部，Hermes还识别子类别目录，这些目录将插件路由到专门的发现系统：

| 子目录 | 包含内容 | 发现系统 |
|--------|----------|----------|
| `plugins/`（根目录） | 通用插件 — 工具、钩子、斜杠命令、CLI命令、打包技能 | `PluginManager`（类型：`standalone` 或 `backend`） |
| `plugins/platforms/<name>/` | 网关通道适配器（`ctx.register_platform()`） | `PluginManager`（类型：`platform`，更深层一级） |
| `plugins/image_gen/<name>/` | 图像生成后端（`ctx.register_image_gen_provider()`） | `PluginManager`（类型：`backend`，更深层一级） |
| `plugins/memory/<name>/` | 记忆提供者（子类化 `MemoryProvider`） | **独立加载器** 位于 `plugins/memory/__init__.py`（类型：`exclusive` — 同一时间仅一个活跃） |
| `plugins/context_engine/<name>/` | 上下文压缩引擎（`ctx.register_context_engine()`） | **独立加载器** 位于 `plugins/context_engine/__init__.py`（同一时间仅一个活跃） |
| `plugins/model-providers/<name>/` | LLM提供者配置（`register_provider(ProviderProfile(...))`） | **独立加载器** 位于 `providers/__init__.py`（首次调用 `get_provider_profile()` 时懒加载扫描） |

位于 `~/.hermes/plugins/model-providers/<name>/` 和 `~/.hermes/plugins/memory/<name>/` 的用户插件会覆盖同名的内置插件 — 在 `register_provider()` / `register_memory_provider()` 中遵循最后写入者胜出原则。放入一个目录，即可替换内置插件，无需编辑仓库。

子类别插件会在 `hermes plugins list` 和交互式 `hermes plugins` UI 中，根据其**路径派生键**显示 — 例如 `observability/langfuse`、`image_gen/openai`、`platforms/teams`。该键（而非清单中的 `name:`）是你传递给 `hermes plugins enable …` / `disable …` 的值，也是需要在 `config.yaml` 的 `plugins.enabled` 下添加的字符串。

## 插件默认禁用（少数例外）

**通用插件和用户安装的后端默认禁用** — 发现机制会找到它们（因此它们会出现在 `hermes plugins` 和 `/plugins` 中），但任何带钩子或工具的插件在加载前，都需要你将其名称添加到 `~/.hermes/config.yaml` 的 `plugins.enabled` 中。这可以防止第三方代码在未经你明确同意的情况下运行。

```yaml
plugins:
  enabled:
    - my-tool-plugin
    - disk-cleanup
  disabled:       # 可选的拒绝列表 — 如果名称同时出现在两个列表中，此列表始终生效
    - noisy-plugin
```

切换状态的三种方式：

```bash
hermes plugins                    # 交互式切换（空格键选中/取消选中）
hermes plugins enable <name>      # 添加到允许列表
hermes plugins disable <name>     # 从允许列表移除并添加到禁用列表
```

执行 `hermes plugins install owner/repo` 后，系统会询问 `立即启用 'name'？[y/N]` — 默认为否。跳过脚本安装提示可使用 `--enable` 或 `--no-enable`。

### 允许列表不控制的范围

有几类插件绕过 `plugins.enabled` — 它们是Hermes内置表面的一部分，如果默认禁用会破坏基本功能：

| 插件类型 | 激活方式 |
|----------|----------|
| **内置平台插件**（`plugins/platforms/` 下的IRC、Teams等） | 自动加载，以便每个随附的网关通道都可用。实际通道通过 `config.yaml` 中的 `gateway.platforms.<name>.enabled` 启用。 |
| **内置后端**（`plugins/image_gen/` 下的图像生成提供者等） | 自动加载，以便默认后端“开箱即用”。选择通过 `config.yaml` 中的 `<category>.provider` 进行（例如 `image_gen.provider: openai`）。 |
| **记忆提供者**（`plugins/memory/`） | 所有发现的提供者；其中一个是活跃的，通过 `config.yaml` 中的 `memory.provider` 选择。 |
| **上下文引擎**（`plugins/context_engine/`） | 所有发现的引擎；其中一个活跃的，通过 `config.yaml` 中的 `context.engine` 选择。 |
| **模型提供者**（`plugins/model-providers/`） | `plugins/model-providers/` 下所有内置提供者在首次调用 `get_provider_profile()` 时发现并注册。用户每次通过 `--provider` 或 `config.yaml` 选择一个。 |
| **Pip安装的 `backend` 插件** | 通过 `plugins.enabled` 启用（与通用插件相同）。 |
| **用户安装的平台**（`~/.hermes/plugins/platforms/` 下） | 通过 `plugins.enabled` 启用 — 第三方网关适配器需要明确同意。 |

简而言之：**内置的“始终可用”基础设施自动加载；第三方通用插件需要用户选择启用。** `plugins.enabled` 允许列表专门用于控制用户放入 `~/.hermes/plugins/` 的任意代码。

### 现有用户迁移

当你升级到具有选择启用插件功能的Hermes版本（配置模式v21+）时，任何已经安装在 `~/.hermes/plugins/` 下且未在 `plugins.disabled` 中的用户插件都会**自动被纳入** `plugins.enabled`。你现有的设置将继续工作。内置独立插件**不会**被自动纳入 — 即使是现有用户也必须明确选择启用。（内置的平台/后端插件从来不需要纳入，因为它们从未被限制过。）

## 可用钩子

插件可以为这些生命周期事件注册回调。请参阅 **[事件钩子页面](/user-guide/features/hooks#plugin-hooks)** 获取完整详情、回调签名和示例。

| 钩子 | 触发时机 |
|------|----------|
| [`pre_tool_call`](/user-guide/features/hooks#pre_tool_call) | 在任何工具执行之前 |
| [`post_tool_call`](/user-guide/features/hooks#post_tool_call) | 在任何工具返回之后 |
| [`pre_llm_call`](/user-guide/features/hooks#pre_llm_call) | 每轮对话一次，在大语言模型循环开始之前——可以返回 `{"context": "..."}` 来[向用户消息中注入上下文](/user-guide/features/hooks#pre_llm_call) |
| [`post_llm_call`](/user-guide/features/hooks#post_llm_call) | 每轮对话一次，在大语言模型循环结束后（仅限成功轮次） |
| [`on_session_start`](/user-guide/features/hooks#on_session_start) | 新会话创建时（仅首轮） |
| [`on_session_end`](/user-guide/features/hooks#on_session_end) | 每次 `run_conversation` 调用结束时 + CLI 退出处理程序 |
| [`on_session_finalize`](/user-guide/features/hooks#on_session_finalize) | CLI/网关终止活跃会话时（`/new`、垃圾回收、CLI 退出） |
| [`on_session_reset`](/user-guide/features/hooks#on_session_reset) | 网关切换新的会话密钥时（`/new`、`/reset`、`/clear`、空闲轮换） |
| [`subagent_stop`](/user-guide/features/hooks#subagent_stop) | 每个子智能体在 `delegate_task` 完成后执行一次 |
| [`pre_gateway_dispatch`](/user-guide/features/hooks#pre_gateway_dispatch) | 网关接收到用户消息后，在认证和分发之前。返回 `{"action": "skip" \| "rewrite" \| "allow", ...}` 以影响流程。 |

## 插件类型

Hermes 有四种插件：

| 类型 | 功能 | 选择方式 | 位置 |
|------|------|----------|------|
| **通用插件** | 添加工具、钩子、斜杠命令、CLI 命令 | 多选（启用/禁用） | `~/.hermes/plugins/` |
| **记忆提供器** | 替换或增强内置记忆功能 | 单选（一次只能激活一个） | `plugins/memory/` |
| **上下文引擎** | 替换内置的上下文压缩器 | 单选（一次只能激活一个） | `plugins/context_engine/` |
| **模型提供器** | 声明推理后端（OpenRouter、Anthropic 等） | 多注册，通过 `--provider` / `config.yaml` 选择 | `plugins/model-providers/` |

记忆提供器和上下文引擎是**提供器插件**——每种类型一次只能激活一个。模型提供器也是插件，但许多可以同时加载；用户通过 `--provider` 或 `config.yaml` 一次选择一个。通用插件可以任意组合启用。

## 可插拔接口 — 各功能对应的开发指南

上表展示了四种类别，但在"通用插件"类别中，`PluginContext` 暴露了多个不同的扩展点 —— 此外 Hermes 还接受 Python 插件系统之外的扩展（配置驱动的后端、Shell 钩子命令、外部服务器等）。请使用下表找到你想构建的内容对应的文档：

| 想要添加… | 实现方式 | 编写指南 |
|---|---|---|
| LLM 可调用的**工具** | Python 插件 — `ctx.register_tool()` | [构建 Hermes 插件](/guides/build-a-hermes-plugin) · [添加工具](/developer-guide/adding-tools) |
| **生命周期钩子**（LLM 前/后、会话开始/结束、工具过滤器） | Python 插件 — `ctx.register_hook()` | [钩子参考](/user-guide/features/hooks) · [构建 Hermes 插件](/guides/build-a-hermes-plugin) |
| 用于 CLI / 网关的**斜杠命令** | Python 插件 — `ctx.register_command()` | [构建 Hermes 插件](/guides/build-a-hermes-plugin) · [扩展 CLI](/developer-guide/extending-the-cli) |
| `hermes <thing>` 的**子命令** | Python 插件 — `ctx.register_cli_command()` | [扩展 CLI](/developer-guide/extending-the-cli) |
| 插件附带的**技能** | Python 插件 — `ctx.register_skill()` | [创建技能](/developer-guide/creating-skills) |
| **推理后端**（LLM 提供商：OpenAI 兼容、Codex、Anthropic-Messages、Bedrock） | 提供商插件 — 在 `plugins/model-providers/<name>/` 中调用 `register_provider(ProviderProfile(...))` | **[模型提供商插件](/developer-guide/model-provider-plugin)** · [添加提供商](/developer-guide/adding-providers) |
| **网关通道**（Discord / Telegram / IRC / Teams 等） | 平台插件 — 在 `plugins/platforms/<name>/` 中调用 `ctx.register_platform()` | [添加平台适配器](/developer-guide/adding-platform-adapters) |
| **记忆后端**（Honcho、Mem0、Supermemory 等） | 记忆插件 — 在 `plugins/memory/<name>/` 中继承 `MemoryProvider` 子类 | [记忆提供商插件](/developer-guide/memory-provider-plugin) |
| **上下文压缩策略** | 上下文引擎插件 — `ctx.register_context_engine()` | [上下文引擎插件](/developer-guide/context-engine-plugin) |
| **图像生成后端**（DALL·E、SDXL 等） | 后端插件 — `ctx.register_image_gen_provider()` | [图像生成提供商插件](/developer-guide/image-gen-provider-plugin) |
| **视频生成后端**（Veo、Kling、Pixverse、Grok-Imagine、Runway 等） | 后端插件 — `ctx.register_video_gen_provider()` | [视频生成提供商插件](/developer-guide/video-gen-provider-plugin) |
| **TTS 后端**（任何 CLI — Piper、VoxCPM、Kokoro、xtts、语音克隆脚本等） | 配置驱动（推荐）— 在 `config.yaml` 的 `tts.providers.<name>` 下声明，设置 `type: command`。或 Python 后端插件 — 对于需要更多功能（超出 Shell 模板能力）的 Python SDK / 流式引擎，可使用 `ctx.register_tts_provider()`。 | [TTS 设置](/user-guide/features/tts#custom-command-providers) · [Python 插件指南](/user-guide/features/tts#python-plugin-providers) |
| **STT 后端**（任何 CLI — whisper.cpp、自定义 whisper 二进制文件、本地 ASR CLI） | 配置驱动（推荐）— 在 `config.yaml` 的 `stt.providers.<name>` 下声明，设置 `type: command`；或设置 `HERMES_LOCAL_STT_COMMAND` 作为旧版单命令快捷方式。或 Python 后端插件 — 对于 Python SDK 引擎（OpenRouter、SenseAudio、Gemini-STT 等），可使用 `ctx.register_transcription_provider()`。 | [STT 设置](/user-guide/features/tts#stt-custom-command-providers) · [Python 插件指南](/user-guide/features/tts#python-plugin-providers-stt) |
| **通过 MCP 使用外部工具**（文件系统、GitHub、Linear、Notion、任何 MCP 服务器） | 配置驱动 — 在 `config.yaml` 中声明 `mcp_servers.<name>`，设置 `command:` / `url:`。Hermes 会自动发现服务器的工具并将其与内置工具一起注册。 | [MCP](/user-guide/features/mcp) |
| **额外的技能来源**（自定义 GitHub 仓库、私有技能索引） | CLI — `hermes skills tap add <repo>` | [技能中心](/user-guide/features/skills#skills-hub) · [发布自定义 tap](/user-guide/features/skills#publishing-a-custom-skill-tap) |
| **网关事件钩子**（在 `gateway:startup`、`session:start`、`agent:end`、`command:*` 时触发） | 将 `HOOK.yaml` + `handler.py` 放入 `~/.hermes/hooks/<name>/` | [事件钩子](/user-guide/features/hooks#gateway-event-hooks) |
| **Shell 钩子**（在事件发生时运行 Shell 命令 — 通知、审计日志、桌面提醒） | 配置驱动 — 在 `config.yaml` 的 `hooks:` 下声明 | [Shell 钩子](/user-guide/features/hooks#shell-hooks) |

:::note
并非所有扩展都是 Python 插件。部分扩展接口有意采用**配置驱动的 Shell 命令**（TTS、STT、Shell 钩子），这样你已有的任何 CLI 无需编写 Python 即可成为插件。另一些是**外部服务器**（MCP），智能体会连接到这些服务器并自动注册其中的工具。还有一些是**拖放目录**（网关钩子），拥有自己的清单格式。请选择适合你用例的集成方式对应的扩展接口；上表中的编写指南均涵盖了占位符、发现机制和示例。
:::

## NixOS 声明式插件

在 NixOS 上，可以通过模块选项声明式安装插件 —— 无需执行 `hermes plugins install`。详见 **[Nix 设置指南](/getting-started/nix-setup#plugins)**。

```nix
services.hermes-agent = {
  # 目录插件（包含 plugin.yaml 的源码树）
  extraPlugins = [ (pkgs.fetchFromGitHub { ... }) ];
  # 入口插件（pip 包）
  extraPythonPackages = [ (pkgs.python312Packages.buildPythonPackage { ... }) ];
  # 在配置中启用
  settings.plugins.enabled = [ "my-plugin" ];
};
```

声明式插件以 `nix-managed-` 前缀创建符号链接 —— 它们与手动安装的插件共存，从 Nix 配置中移除时会自动清理。

## 管理插件

```bash
hermes plugins                                       # 统一交互式 UI
hermes plugins list                                  # 表格：已启用 / 已禁用 / 未启用
hermes plugins install user/repo                     # 从 Git 安装，然后提示 是否启用？[y/N]
hermes plugins install user/repo --enable            # 安装并启用（无提示）
hermes plugins install user/repo --no-enable         # 安装但保持禁用（无提示）
hermes plugins update my-plugin                      # 拉取最新版本
hermes plugins remove my-plugin                      # 卸载
hermes plugins enable my-plugin                      # 添加到允许列表（扁平插件）
hermes plugins enable observability/langfuse         # 添加到允许列表（子类别插件）
hermes plugins disable my-plugin                     # 从允许列表移除并添加到禁用列表
```

对于子类别目录下的插件（例如 `plugins/observability/langfuse/`、`plugins/image_gen/openai/`），请使用完整的 `<category>/<plugin>` 键 —— 这正是 `hermes plugins list` 在 **Name** 列中显示的内容。

### 交互式 UI

不带参数运行 `hermes plugins` 会打开一个组合交互界面：

```
Plugins
  ↑↓ navigate  SPACE toggle  ENTER configure/confirm  ESC done

  General Plugins
 → [✓] my-tool-plugin — Custom search tool
   [ ] webhook-notifier — Event hooks
   [ ] disk-cleanup — Auto-cleanup of ephemeral files [bundled]
   [ ] observability/langfuse — Trace turns / LLM calls / tools to Langfuse [bundled]

  Provider Plugins
     Memory Provider          ▸ honcho
     Context Engine           ▸ compressor
```

- **通用插件区域** — 复选框，使用空格键切换。勾选 = 在 `plugins.enabled` 中，未勾选 = 在 `plugins.disabled` 中（显式关闭）。
- **提供商插件区域** — 显示当前选择。按回车键进入单选选择器，选择一个活跃的提供商。
- 内置插件在同一列表中显示，带有 `[bundled]` 标签。

提供商插件的选择保存到 `config.yaml`：

```yaml
memory:
  provider: "honcho"      # 空字符串 = 仅使用内置

context:
  engine: "compressor"    # 默认内置压缩器
```

### 已启用 vs. 已禁用 vs. 未启用

插件处于以下三种状态之一：

| 状态 | 含义 | 在 `plugins.enabled` 中？ | 在 `plugins.disabled` 中？ |
|---|---|---|---|
| `enabled` | 下次会话加载 | 是 | 否 |
| `disabled` | 显式关闭 — 即使同时在 `enabled` 中也不会加载 | （无关） | 是 |
| `not enabled` | 已发现但从未启用 | 否 | 否 |

新安装或内置插件的默认状态为 `not enabled`。`hermes plugins list` 显示所有三种不同状态，以便你区分哪些是被显式关闭的，哪些只是等待启用。

在运行中的会话中，`/plugins` 显示当前已加载的插件。

## 注入消息

插件可以使用 `ctx.inject_message()` 向活动对话中注入消息：

```python
ctx.inject_message("New data arrived from the webhook", role="user")
```

**函数签名:** `ctx.inject_message(content: str, role: "user" = "user") -> bool`

工作原理：

- 如果智能体处于**空闲状态**（等待用户输入），消息将作为下一个输入排队，并开始新的对话轮次。
- 如果智能体正在**执行中**（正在运行），消息将中断当前操作——这与用户输入新消息并按下回车键的效果相同。
- 对于非 `"user"` 角色，内容前会加上 `[角色]` 前缀（例如 `[system] ...`）。
- 如果消息成功排队则返回 `True`，如果没有可用的 CLI 引用（例如在网关模式下）则返回 `False`。

此功能使远程控制查看器、消息桥接器或 webhook 接收器等插件能够从外部源向对话中注入消息。

:::注意
`inject_message` 仅在 CLI 模式下可用。在网关模式下，没有 CLI 引用，该方法将返回 `False`。
:::

参阅**[完整指南](/guides/build-a-hermes-plugin)** 了解处理函数契约、格式规范、钩子行为、错误处理和常见错误。