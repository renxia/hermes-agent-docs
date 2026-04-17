---
sidebar_position: 11
sidebar_label: "插件"
title: "插件"
description: "通过插件系统使用自定义工具、钩子和集成功能来扩展 Hermes"
---

# 插件

Hermes 拥有一个插件系统，允许用户在不修改核心代码的情况下添加自定义工具、钩子和集成功能。

**→ [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)** — 包含完整工作示例的逐步指南。

## 快速概览

将包含 `plugin.yaml` 和 Python 代码的目录放入 `~/.hermes/plugins/`：

```
~/.hermes/plugins/my-plugin/
├── plugin.yaml      # manifest (清单)
├── __init__.py      # register() — 将模式连接到处理器
├── schemas.py       # 工具模式 (LLM 可见的内容)
└── tools.py         # 工具处理器 (调用时执行的内容)
```

启动 Hermes — 您的工具将与内置工具并列显示。模型可以立即调用它们。

### 最小工作示例

这是一个完整的插件，它添加了一个 `hello_world` 工具，并通过一个钩子记录了每一次工具调用。

**`~/.hermes/plugins/hello-world/plugin.yaml`**

```yaml
name: hello-world
version: "1.0"
description: 一个最小示例插件
```

**`~/.hermes/plugins/hello-world/__init__.py`**

```python
"""最小 Hermes 插件 — 注册一个工具和一个钩子。"""


def register(ctx):
    # --- 工具: hello_world ---
    schema = {
        "name": "hello_world",
        "description": "为给定名称返回友好的问候语。",
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

    def handle_hello(params):
        name = params.get("name", "World")
        return f"Hello, {name}! 👋  (来自 hello-world 插件)"

    ctx.register_tool("hello_world", schema, handle_hello)

    # --- 钩子: 记录每次工具调用 ---
    def on_tool_call(tool_name, params, result):
        print(f"[hello-world] tool called: {tool_name}")

    ctx.register_hook("post_tool_call", on_tool_call)
```

将这两个文件放入 `~/.hermes/plugins/hello-world/`，重启 Hermes，模型就可以立即调用 `hello_world`。该钩子会在每次工具调用后打印一条日志行。

项目本地的插件位于 `./.hermes/plugins/` 下，默认是禁用的。只有在启动 Hermes 之前设置 `HERMES_ENABLE_PROJECT_PLUGINS=true`，才能为受信任的仓库启用它们。

## 插件功能

| 功能 | 如何实现 |
|-----------|-----|
| 添加工具 | `ctx.register_tool(name, schema, handler)` |
| 添加钩子 | `ctx.register_hook("post_tool_call", callback)` |
| 添加斜杠命令 | `ctx.register_command(name, handler, description)` — 在 CLI 和网关会话中添加 `/name` |
| 添加 CLI 命令 | `ctx.register_cli_command(name, help, setup_fn, handler_fn)` — 添加 `hermes <plugin> <subcommand>` |
| 注入消息 | `ctx.inject_message(content, role="user")` — 参见 [注入消息](#injecting-messages) |
| 发送数据文件 | `Path(__file__).parent / "data" / "file.yaml"` |
| 捆绑技能 | `ctx.register_skill(name, path)` — 命名空间为 `plugin:skill`，通过 `skill_view("plugin:skill")` 加载 |
| 基于环境变量进行门控 | 在 plugin.yaml 中设置 `requires_env: [API_KEY]` — 在运行 `hermes plugins install` 时提示 |
| 通过 pip 分发 | `[project.entry-points."hermes_agent.plugins"]` |

## 插件发现

| 源 | 路径 | 用例 |
|--------|------|----------|
| 用户 | `~/.hermes/plugins/` | 个人插件 |
| 项目 | `.hermes/plugins/` | 项目特定插件（需要设置 `HERMES_ENABLE_PROJECT_PLUGINS=true`） |
| pip | `hermes_agent.plugins` entry_points | 分发包 |

## 可用钩子

插件可以为这些生命周期事件注册回调。有关完整详情、回调签名和示例，请参阅 **[事件钩子页面](/docs/user-guide/features/hooks#plugin-hooks)**。

| 钩子 | 触发时机 |
|------|-----------|
| [`pre_tool_call`](/docs/user-guide/features/hooks#pre_tool_call) | 在任何工具执行之前 |
| [`post_tool_call`](/docs/user-guide/features/hooks#post_tool_call) | 任何工具返回之后 |
| [`pre_llm_call`](/docs/user-guide/features/hooks#pre_llm_call) | 每个回合开始时，在 LLM 循环之前 — 可以返回 `{"context": "..."}` 将 [上下文注入到用户消息中](/docs/user-guide/features/hooks#pre_llm_call) |
| [`post_llm_call`](/docs/user-guide/features/hooks#post_llm_call) | 每个回合结束时，在 LLM 循环之后（仅成功回合） |
| [`on_session_start`](/docs/user-guide/features/hooks#on_session_start) | 创建新会话（仅第一个回合） |
| [`on_session_end`](/docs/user-guide/features/hooks#on_session_end) | 每次 `run_conversation` 调用结束 + CLI 退出处理器 |

## 插件类型

Hermes 有三种类型的插件：

| 类型 | 功能 | 选择方式 | 位置 |
|------|-------------|-----------|----------|
| **通用插件** | 添加工具、钩子、斜杠命令、CLI 命令 | 多选（启用/禁用） | `~/.hermes/plugins/` |
| **内存提供者** | 替换或增强内置内存 | 单选（一个活动） | `plugins/memory/` |
| **上下文引擎** | 替换内置上下文压缩器 | 单选（一个活动） | `plugins/context_engine/` |

内存提供者和上下文引擎是**提供者插件**——同一时间只能激活其中一种类型。通用插件可以以任何组合启用。

## 管理插件

```bash
hermes plugins                  # 统一的交互式 UI
hermes plugins list             # 显示启用/禁用状态的表格视图
hermes plugins install user/repo  # 从 Git 安装
hermes plugins update my-plugin   # 拉取最新版本
hermes plugins remove my-plugin   # 卸载
hermes plugins enable my-plugin   # 重新启用禁用的插件
hermes plugins disable my-plugin  # 禁用而不删除
```

### 交互式 UI

运行 `hermes plugins` 不带参数会打开一个复合交互式屏幕：

```
Plugins
  ↑↓ 导航  SPACE 切换  ENTER 配置/确认  ESC 完成

  通用插件
 → [✓] my-tool-plugin — 自定义搜索工具
   [ ] webhook-notifier — 事件钩子

  提供者插件
     内存提供者          ▸ honcho
     上下文引擎           ▸ compressor
```

- **通用插件部分** — 使用复选框，通过 SPACE 切换
- **提供者插件部分** — 显示当前选择。按 ENTER 进入单选选择器，您可以在其中选择一个活动的提供者。

提供者插件的选择保存在 `config.yaml` 中：

```yaml
memory:
  provider: "honcho"      # 空字符串 = 仅内置
context:
  engine: "compressor"    # 默认内置压缩器
```

### 禁用通用插件

禁用的插件仍然安装，但在加载时会被跳过。禁用的列表存储在 `config.yaml` 的 `plugins.disabled` 下：

```yaml
plugins:
  disabled:
    - my-noisy-plugin
```

在运行会话中，`/plugins` 会显示当前加载了哪些插件。

## 注入消息

插件可以使用 `ctx.inject_message()` 将消息注入到当前的对话中：

```python
ctx.inject_message("新数据来自 Webhook", role="user")
```

**签名:** `ctx.inject_message(content: str, role: str = "user") -> bool`

工作原理：

- 如果代理处于**空闲**状态（等待用户输入），该消息将作为下一个输入排队，并开始一个新的回合。
- 如果代理处于**进行中**状态（正在积极运行），该消息会中断当前的操作 — 这与用户输入新消息并按回车键的行为相同。
- 对于非 `"user"` 角色，内容会加上前缀 `[role]`（例如：`[system] ...`）。
- 如果消息成功排队，则返回 `True`；如果没有可用的 CLI 参考（例如在网关模式下），则返回 `False`。

这使得像远程控制查看器、消息桥接器或 Webhook 接收器这样的插件能够从外部源向对话中馈送消息。

:::note
`inject_message` 仅在 CLI 模式下可用。在网关模式下，没有 CLI 参考，该方法返回 `False`。
:::

有关处理器契约、模式格式、钩子行为、错误处理和常见错误，请参阅 **[完整指南](/docs/guides/build-a-hermes-plugin)**。