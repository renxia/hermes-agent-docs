---
sidebar_position: 11
sidebar_label: "插件"
title: "插件"
description: "通过插件系统为Hermes添加自定义工具、钩子和集成"
---

# 插件

Hermes 提供了一个插件系统，用于在不修改核心代码的情况下添加自定义工具、钩子和集成。

如果你想为自己、你的团队或某个项目创建一个自定义工具，这通常是正确的途径。开发者指南中的[添加工具](/docs/developer-guide/adding-tools)页面是针对内置的、位于`tools/`和`toolsets.py`中的Hermes核心工具的。

**→ [构建Hermes插件](/docs/guides/build-a-hermes-plugin)** — 分步指南与完整可运行的示例。

## 快速概览

将一个包含`plugin.yaml`和Python代码的目录放入`~/.hermes/plugins/`：

```
~/.hermes/plugins/my-plugin/
├── plugin.yaml      # 清单文件
├── __init__.py      # register() — 将模式(schema)连接到处理程序
├── schemas.py       # 工具模式 (LLM所见)
└── tools.py         # 工具处理程序 (被调用时执行的逻辑)
```

启动Hermes — 你的工具将与内置工具一同出现。模型可以立即调用它们。

### 最小可运行示例

这是一个完整的插件，它添加了一个`hello_world`工具，并通过一个钩子记录每次工具调用。

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

将这两个文件放入`~/.hermes/plugins/hello-world/`，重启Hermes，模型便可以立即调用`hello_world`。该钩子会在每次工具调用后打印一行日志。

默认情况下，位于`./.hermes/plugins/`下的项目本地插件是禁用的。只有在启动Hermes之前设置`HERMES_ENABLE_PROJECT_PLUGINS=true`，才能仅为受信任的仓库启用它们。

## 插件能做什么

下方每个 `ctx.*` API 都可在插件的 `register(ctx)` 函数内使用。

| 功能 | 使用方法 |
|------|----------|
| 添加工具 | `ctx.register_tool(name=..., toolset=..., schema=..., handler=...)` |
| 添加钩子 | `ctx.register_hook("post_tool_call", callback)` |
| 添加斜杠命令 | `ctx.register_command(name, handler, description)` — 在 CLI 和网关会话中添加 `/name` |
| 从命令派发工具 | `ctx.dispatch_tool(name, args)` — 使用父智能体上下文自动连接，调用已注册的工具 |
| 添加 CLI 命令 | `ctx.register_cli_command(name, help, setup_fn, handler_fn)` — 添加 `hermes <plugin> <subcommand>` |
| 注入消息 | `ctx.inject_message(content, role="user")` — 参见[注入消息](#注入消息) |
| 包含数据文件 | `Path(__file__).parent / "data" / "file.yaml"` |
| 捆绑技能 | `ctx.register_skill(name, path)` — 命名空间为 `plugin:skill`，通过 `skill_view("plugin:skill")` 加载 |
| 依赖环境变量 | 在 plugin.yaml 中设置 `requires_env: [API_KEY]` — 在 `hermes plugins install` 期间提示 |
| 通过 pip 分发 | `[project.entry-points."hermes_agent.plugins"]` |
| 注册网关平台（Discord, Telegram, IRC 等） | `ctx.register_platform(name, label, adapter_factory, check_fn, ...)` — 参见[添加平台适配器](/docs/developer-guide/adding-platform-adapters) |
| 注册图像生成后端 | `ctx.register_image_gen_provider(provider)` — 参见[图像生成提供商插件](/docs/developer-guide/image-gen-provider-plugin) |
| 注册上下文压缩引擎 | `ctx.register_context_engine(engine)` — 参见[上下文引擎插件](/docs/developer-guide/context-engine-plugin) |
| 注册内存后端 | 在 `plugins/memory/<name>/__init__.py` 中子类化 `MemoryProvider` — 参见[内存提供商插件](/docs/developer-guide/memory-provider-plugin)（使用独立的发现系统） |
| 运行主机拥有的 LLM 调用 | `ctx.llm.complete(...)` / `ctx.llm.complete_structured(...)` — 借用用户的当前模型和认证，进行带可选 JSON 模式验证的一次性补全。参见[插件 LLM 访问](/docs/developer-guide/plugin-llm-access) |
| 注册推理后端（LLM 提供商） | 在 `plugins/model-providers/<name>/__init__.py` 中调用 `register_provider(ProviderProfile(...))` — 参见[模型提供商插件](/docs/developer-guide/model-provider-plugin)（使用独立的发现系统） |

## 插件发现

| 来源 | 路径 | 用例 |
|------|------|------|
| 内置 | `<repo>/plugins/` | 随 Hermes 提供 — 参见[内置插件](/docs/user-guide/features/built-in-plugins) |
| 用户 | `~/.hermes/plugins/` | 个人插件 |
| 项目 | `.hermes/plugins/` | 项目特定插件（需要设置 `HERMES_ENABLE_PROJECT_PLUGINS=true`） |
| pip | `hermes_agent.plugins` 入口点 | 分发包 |
| Nix | `services.hermes-agent.extraPlugins` / `extraPythonPackages` | NixOS 声明式安装 — 参见[Nix 设置](/docs/getting-started/nix-setup#plugins) |

后来的来源在名称冲突时覆盖较早的来源，因此与内置插件同名的用户插件会替换它。

### 插件子类别

在每个来源内，Hermers 还识别将插件路由到专门发现系统的子类别目录：

| 子目录 | 包含内容 | 发现系统 |
|--------|----------|----------|
| `plugins/`（根目录） | 通用插件 — 工具、钩子、斜杠命令、CLI 命令、捆绑技能 | `PluginManager`（类型：`standalone` 或 `backend`） |
| `plugins/platforms/<name>/` | 网关通道适配器（`ctx.register_platform()`） | `PluginManager`（类型：`platform`，更深一级） |
| `plugins/image_gen/<name>/` | 图像生成后端（`ctx.register_image_gen_provider()`） | `PluginManager`（类型：`backend`，更深一级） |
| `plugins/memory/<name>/` | 内存提供商（子类化 `MemoryProvider`） | `plugins/memory/__init__.py` 中的**专用加载程序**（类型：`exclusive` — 同一时间只有一个激活） |
| `plugins/context_engine/<name>/` | 上下文压缩引擎（`ctx.register_context_engine()`） | `plugins/context_engine/__init__.py` 中的**专用加载程序**（同一时间只有一个激活） |
| `plugins/model-providers/<name>/` | LLM 提供商配置文件（`register_provider(ProviderProfile(...))`） | `providers/__init__.py` 中的**专用加载程序**（在第一次 `get_provider_profile()` 调用时懒扫描） |

位于 `~/.hermes/plugins/model-providers/<name>/` 和 `~/.hermes/plugins/memory/<name>/` 的用户插件会覆盖同名的内置插件 — 在 `register_provider()` / `register_memory_provider()` 中，后写者胜出。放入一个目录即可替换内置插件，无需修改仓库。

## 插件默认是选择启用（少数例外）

**通用插件和用户安装的后端默认是禁用的** — 发现机制会找到它们（因此它们会出现在 `hermes plugins` 和 `/plugins` 命令中），但除非你将插件名称添加到 `~/.hermes/config.yaml` 中的 `plugins.enabled` 列表，否则任何带钩子或工具的插件都不会加载。这可以防止第三方代码在未经你明确同意的情况下运行。

```yaml
plugins:
  enabled:
    - my-tool-plugin
    - disk-cleanup
  disabled:       # 可选拒绝列表 — 如果名称同时出现在两个列表中，则此列表始终生效
    - noisy-plugin
```

三种切换状态的方式：

```bash
hermes plugins                    # 交互式切换（按空格键选中/取消选中）
hermes plugins enable <name>      # 添加到允许列表
hermes plugins disable <name>     # 从允许列表移除 + 添加到禁用列表
```

执行 `hermes plugins install owner/repo` 后，会询问 `立即启用 'name'？ [y/N]` — 默认为否。要跳过此提示进行脚本化安装，可使用 `--enable` 或 `--no-enable`。

### 允许列表不控制的内容

有几类插件绕过 `plugins.enabled` — 它们是 Hermes 内置表面的一部分，如果默认被禁止，会破坏基本功能：

| 插件类别 | 其激活方式 |
|----------|------------|
| **内置平台插件**（`plugins/platforms/` 下的 IRC、Teams 等） | 自动加载，以便所有随附的网关通道都可用。具体通道通过 `config.yaml` 中的 `gateway.platforms.<name>.enabled` 启用。 |
| **内置后端**（`plugins/image_gen/` 等下的图像生成提供商） | 自动加载，以便默认后端“开箱即用”。选择通过 `config.yaml` 中的 `<category>.provider` 进行（例如 `image_gen.provider: openai`）。 |
| **内存提供商**（`plugins/memory/`） | 全部被发现；由 `config.yaml` 中的 `memory.provider` 选择其中一个激活。 |
| **上下文引擎**（`plugins/context_engine/`） | 全部被发现；由 `config.yaml` 中的 `context.engine` 选择其中一个激活。 |
| **模型提供商**（`plugins/model-providers/`） | `plugins/model-providers/` 下的所有内置提供商都会在第一次 `get_provider_profile()` 调用时发现并注册。用户通过 `--provider` 或 `config.yaml` 一次选择一个。 |
| **通过 pip 安装的 `backend` 类型插件** | 通过 `plugins.enabled` 选择启用（与通用插件相同）。 |
| **用户安装的平台**（`~/.hermes/plugins/platforms/` 下） | 通过 `plugins.enabled` 选择启用 — 第三方网关适配器需要明确同意。 |

简而言之：**内置的“始终有效”基础设施自动加载；第三方通用插件是选择启用的。** `plugins.enabled` 允许列表是专门针对用户放入 `~/.hermes/plugins/` 的任意代码的门控。

### 现有用户的迁移

当你升级到具有选择启用插件功能的 Hermes 版本（配置架构 v21+）时，任何已经安装在 `~/.hermes/plugins/` 下且未出现在 `plugins.disabled` 中的用户插件都会被**自动豁免**进入 `plugins.enabled` 列表。你现有的设置将继续工作。内置独立插件不会被豁免 — 即使是现有用户也必须明确选择启用。（内置的平台/后端插件从未需要豁免，因为它们从未被门控。）

## 可用钩子

插件可以为这些生命周期事件注册回调。详见 **[事件钩子页面](/docs/user-guide/features/hooks#plugin-hooks)**，获取完整详情、回调签名和示例。

| 钩子 | 触发时机 |
|------|----------|
| [`pre_tool_call`](/docs/user-guide/features/hooks#pre_tool_call) | 在任何工具执行之前 |
| [`post_tool_call`](/docs/user-guide/features/hooks#post_tool_call) | 在任何工具返回之后 |
| [`pre_llm_call`](/docs/user-guide/features/hooks#pre_llm_call) | 每个轮次一次，在LLM循环之前——可返回 `{"context": "..."}` 以 [向用户消息注入上下文](/docs/user-guide/features/hooks#pre_llm_call) |
| [`post_llm_call`](/docs/user-guide/features/hooks#post_llm_call) | 每个轮次一次，在LLM循环之后（仅限成功的轮次） |
| [`on_session_start`](/docs/user-guide/features/hooks#on_session_start) | 新会话创建时（仅第一个轮次） |
| [`on_session_end`](/docs/user-guide/features/hooks#on_session_end) | 每次 `run_conversation` 调用结束 + CLI退出处理程序 |
| [`on_session_finalize`](/docs/user-guide/features/hooks#on_session_finalize) | CLI/网关拆除一个活跃会话（`/new`，垃圾回收，CLI退出） |
| [`on_session_reset`](/docs/user-guide/features/hooks#on_session_reset) | 网关换入新的会话密钥（`/new`，`/reset`，`/clear`，空闲轮换） |
| [`subagent_stop`](/docs/user-guide/features/hooks#subagent_stop) | `delegate_task` 完成后，每个子项一次 |
| [`pre_gateway_dispatch`](/docs/user-guide/features/hooks#pre_gateway_dispatch) | 网关收到用户消息后，在认证 + 调度之前。返回 `{"action": "skip" \| "rewrite" \| "allow", ...}` 以影响流程。 |

## 插件类型

Hermes 有四种插件：

| 类型 | 功能 | 选择方式 | 位置 |
|------|------|----------|------|
| **通用插件** | 添加工具、钩子、斜杠命令、CLI命令 | 多选（启用/禁用） | `~/.hermes/plugins/` |
| **记忆提供器** | 替换或增强内置记忆 | 单选（一次一个活跃） | `plugins/memory/` |
| **上下文引擎** | 替换内置上下文压缩器 | 单选（一次一个活跃） | `plugins/context_engine/` |
| **模型提供器** | 声明推理后端（OpenRouter, Anthropic, …） | 多注册，通过 `--provider` / `config.yaml` 选取 | `plugins/model-providers/` |

记忆提供器和上下文引擎是**提供器插件** —— 每种类型一次只能有一个处于活跃状态。模型提供器也是插件，但许多可以同时加载；用户通过 `--provider` 或 `config.yaml` 一次选取一个。通用插件可以任意组合启用。

## 可插拔接口 — 各功能对应入口

上表展示了四种插件类别，但在“通用插件”中，`PluginContext` 提供了多个不同的扩展点 — 并且 Hermes 也接受 Python 插件系统之外的扩展（基于配置的后端、通过 Shell 挂接的命令、外部服务器等）。请使用下表查找您想要构建内容的对应文档：

| 想要添加… | 实现方式 | 编写指南 |
|---|---|---|
| 一个 LLM 可以调用的 **工具** | Python 插件 — `ctx.register_tool()` | [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin) · [添加工具](/docs/developer-guide/adding-tools) |
| 一个 **生命周期钩子** (LLM 前/后、会话开始/结束、工具过滤器) | Python 插件 — `ctx.register_hook()` | [钩子参考](/docs/user-guide/features/hooks) · [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin) |
| 一个用于 CLI / 网关的 **斜杠命令** | Python 插件 — `ctx.register_command()` | [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin) · [扩展 CLI](/docs/developer-guide/extending-the-cli) |
| 一个用于 `hermes <thing>` 的 **子命令** | Python 插件 — `ctx.register_cli_command()` | [扩展 CLI](/docs/developer-guide/extending-the-cli) |
| 你的插件附带的 **技能** | Python 插件 — `ctx.register_skill()` | [创建技能](/docs/developer-guide/creating-skills) |
| 一个 **推理后端** (LLM 提供商：OpenAI 兼容、Codex、Anthropic-Messages、Bedrock) | 提供商插件 — 在 `plugins/model-providers/<name>/` 中调用 `register_provider(ProviderProfile(...))` | **[模型提供商插件](/docs/developer-guide/model-provider-plugin)** · [添加提供商](/docs/developer-guide/adding-providers) |
| 一个 **网关通道** (Discord / Telegram / IRC / Teams / 等) | 平台插件 — 在 `plugins/platforms/<name>/` 中调用 `ctx.register_platform()` | [添加平台适配器](/docs/developer-guide/adding-platform-adapters) |
| 一个 **记忆后端** (Honcho、Mem0、Supermemory…) | 记忆插件 — 在 `plugins/memory/<name>/` 中继承 `MemoryProvider` | [记忆提供商插件](/docs/developer-guide/memory-provider-plugin) |
| 一种 **上下文压缩策略** | 上下文引擎插件 — `ctx.register_context_engine()` | [上下文引擎插件](/docs/developer-guide/context-engine-plugin) |
| 一个 **图像生成后端** (DALL·E、SDXL…) | 后端插件 — `ctx.register_image_gen_provider()` | [图像生成提供商插件](/docs/developer-guide/image-gen-provider-plugin) |
| 一个 **TTS 后端** (任何 CLI — Piper、VoxCPM、Kokoro、xtts、声音克隆脚本…) | 配置驱动 — 在 `config.yaml` 中声明 `tts.providers.<name>` 并设置 `type: command` | [TTS 设置](/docs/user-guide/features/tts#custom-command-providers) |
| 一个 **STT 后端** (自定义 whisper 二进制、本地 ASR CLI) | 配置驱动 — 将 `HERMES_LOCAL_STT_COMMAND` 环境变量设置为 shell 模板 | [语音消息转录 (STT)](/docs/user-guide/features/tts#voice-message-transcription-stt) |
| 通过 MCP 的 **外部工具** (文件系统、GitHub、Linear、Notion、任意 MCP 服务器) | 配置驱动 — 在 `config.yaml` 中声明 `mcp_servers.<name>` 并设置 `command:` / `url:`。Hermes 会自动发现服务器的工具并与内置工具一同注册。 | [MCP](/docs/user-guide/features/mcp) |
| **额外的技能源** (自定义 GitHub 仓库、私有技能索引) | CLI — `hermes skills tap add <repo>` | [技能中心](/docs/user-guide/features/skills#skills-hub) · [发布自定义 tap](/docs/user-guide/features/skills#publishing-a-custom-skill-tap) |
| **网关事件钩子** (在 `gateway:startup`、`session:start`、`agent:end`、`command:*` 时触发) | 将 `HOOK.yaml` 和 `handler.py` 放入 `~/.hermes/hooks/<name>/` 目录 | [事件钩子](/docs/user-guide/features/hooks#gateway-event-hooks) |
| **Shell 钩子** (在事件发生时运行 shell 命令 — 通知、审计日志、桌面提醒) | 配置驱动 — 在 `config.yaml` 中的 `hooks:` 部分声明 | [Shell 钩子](/docs/user-guide/features/hooks#shell-hooks) |

:::note
并非所有扩展都是 Python 插件。一些扩展接口特意采用 **配置驱动的 shell 命令**（TTS、STT、Shell 钩子），这样你已有的任何 CLI 都可以无需编写 Python 就成为插件。其他则是 **外部服务器**（MCP），智能体会连接到它们并自动注册工具。还有一些是 **可放入的目录**（网关钩子），拥有自己的清单格式。请根据您的用例选择合适的集成方式；上表中的编写指南均涵盖了占位符、发现机制和示例。
:::

## NixOS 声明式插件

在 NixOS 上，可以通过模块选项声明式地安装插件 — 无需运行 `hermes plugins install`。详情请参阅 **[Nix 设置指南](/docs/getting-started/nix-setup#plugins)**。

```nix
services.hermes-agent = {
  # 目录插件 (包含 plugin.yaml 的源码树)
  extraPlugins = [ (pkgs.fetchFromGitHub { ... }) ];
  # 入口点插件 (pip 包)
  extraPythonPackages = [ (pkgs.python312Packages.buildPythonPackage { ... }) ];
  # 在配置中启用
  settings.plugins.enabled = [ "my-plugin" ];
};
```

声明式插件会以 `nix-managed-` 前缀创建符号链接 — 它们与手动安装的插件共存，并在从 Nix 配置中移除时自动清理。

## 管理插件

```bash
hermes plugins                               # 统一的交互式界面
hermes plugins list                          # 表格：已启用 / 已禁用 / 未启用
hermes plugins install user/repo             # 从 Git 安装，然后提示是否启用？ [y/N]
hermes plugins install user/repo --enable    # 安装并启用（无提示）
hermes plugins install user/repo --no-enable # 安装但保持禁用（无提示）
hermes plugins update my-plugin              # 拉取最新版本
hermes plugins remove my-plugin              # 卸载
hermes plugins enable my-plugin              # 添加到允许列表
hermes plugins disable my-plugin             # 从允许列表移除并添加到禁用列表
```

### 交互式界面

不带参数运行 `hermes plugins` 会打开一个组合的交互式屏幕：

```
插件
  ↑↓ 导航  SPACE 切换  ENTER 配置/确认  ESC 完成

  通用插件
 → [✓] my-tool-plugin — 自定义搜索工具
   [ ] webhook-notifier — 事件钩子
   [ ] disk-cleanup — 自动清理临时文件 [内置]

  提供商插件
     记忆提供商          ▸ honcho
     上下文引擎           ▸ compressor
```

- **通用插件部分** — 复选框，按空格键切换。勾选 = 在 `plugins.enabled` 中，未勾选 = 在 `plugins.disabled` 中（显式关闭）。
- **提供商插件部分** — 显示当前选择。按回车键进入单选选择器，您可以在其中选择一个活动提供商。
- 内置插件以 `[bundled]` 标签出现在同一个列表中。

提供商插件的选择保存在 `config.yaml` 中：

```yaml
memory:
  provider: "honcho"      # 空字符串 = 仅使用内置

context:
  engine: "compressor"    # 默认内置的压缩器
```

### 已启用 vs 已禁用 vs 均不是

插件处于三种状态之一：

| 状态 | 含义 | 在 `plugins.enabled` 中？ | 在 `plugins.disabled` 中？ |
|---|---|---|---|
| `enabled` | 在下个会话加载 | 是 | 否 |
| `disabled` | 显式关闭 — 即使同时在 `enabled` 中也不会加载 | （无关） | 是 |
| `not enabled` | 已发现但从未选择启用 | 否 | 否 |

新安装或内置插件的默认状态是 `not enabled`。`hermes plugins list` 会显示所有三种不同状态，以便您区分哪些是被显式关闭的，哪些只是等待启用的。

在运行中的会话里，`/plugins` 会显示当前加载的插件。

## 注入消息

插件可以使用 `ctx.inject_message()` 将消息注入活动对话：

```python
ctx.inject_message("New data arrived from the webhook", role="user")
```

**函数签名：** `ctx.inject_message(content: str, role: str = "user") -> bool`

工作原理：

- 如果智能体处于 **空闲**（等待用户输入），消息会作为下一个输入排队，并开始新的一轮对话。
- 如果智能体 **处于轮次中**（正在运行），消息会中断当前操作 — 与用户输入新消息并按回车键效果相同。
- 对于非 `"user"` 角色，内容会以 `[role]` 为前缀（例如 `[system] ...`）。
- 如果消息成功入队则返回 `True`，如果没有可用的 CLI 引用（例如在网关模式下）则返回 `False`。

这使得像远程控制查看器、消息桥接或 webhook 接收器之类的插件能够从外部源将消息传入对话。

:::note
`inject_message` 仅在 CLI 模式下可用。在网关模式下，没有 CLI 引用，该方法会返回 `False`。
:::

请参阅 **[完整指南](/docs/guides/build-a-hermes-plugin)**，了解处理器契约、数据格式、钩子行为、错误处理和常见错误。