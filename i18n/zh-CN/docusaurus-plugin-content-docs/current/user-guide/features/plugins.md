---
sidebar_position: 11
sidebar_label: "插件"
title: "插件"
description: "通过插件系统使用自定义工具、钩子和集成来扩展 Hermes"
---

# 插件

Hermes 拥有一个插件系统，可以在不修改核心代码的情况下添加自定义工具、钩子和集成。

**→ [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)** —— 包含完整可运行示例的分步指南。

## 快速概览

将一个目录放入 `~/.hermes/plugins/` 中，并包含 `plugin.yaml` 和 Python 代码：

```
~/.hermes/plugins/my-plugin/
├── plugin.yaml      # 清单
├── __init__.py      # register() —— 将模式连接到处理程序
├── schemas.py       # 工具模式（LLM 所看到的）
└── tools.py         # 工具处理程序（调用时运行的内容）
```

启动 Hermes —— 您的工具将与内置工具一起出现。模型可以立即调用它们。

### 最小可运行示例

以下是一个完整的插件，它添加了一个 `hello_world` 工具，并通过钩子记录每次工具调用。

**`~/.hermes/plugins/hello-world/plugin.yaml`**

```yaml
name: hello-world
version: "1.0"
description: 一个最小示例插件
```

**`~/.hermes/plugins/hello-world/__init__.py`**

```python
"""最小 Hermes 插件 —— 注册一个工具和一个钩子。"""


def register(ctx):
    # --- 工具: hello_world ---
    schema = {
        "name": "hello_world",
        "description": "为给定的名字返回一个友好的问候。",
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

    def handle_hello(params):
        name = params.get("name", "World")
        return f"Hello, {name}! 👋  (来自 hello-world 插件)"

    ctx.register_tool("hello_world", schema, handle_hello)

    # --- 钩子: 记录每次工具调用 ---
    def on_tool_call(tool_name, params, result):
        print(f"[hello-world] 工具被调用: {tool_name}")

    ctx.register_hook("post_tool_call", on_tool_call)
```

将这两个文件放入 `~/.hermes/plugins/hello-world/`，重启 Hermes，模型就可以立即调用 `hello_world`。钩子会在每次工具调用后打印一行日志。

位于 `./.hermes/plugins/` 下的项目本地插件默认是禁用的。仅在启动 Hermes 前设置 `HERMES_ENABLE_PROJECT_PLUGINS=true` 来为受信任的仓库启用它们。

## 插件能做什么

| 功能 | 实现方式 |
|-----------|-----|
| 添加工具 | `ctx.register_tool(name, schema, handler)` |
| 添加钩子 | `ctx.register_hook("post_tool_call", callback)` |
| 添加斜杠命令 | `ctx.register_command(name, handler, description)` — 在 CLI 和网关会话中添加 `/name` |
| 添加 CLI 命令 | `ctx.register_cli_command(name, help, setup_fn, handler_fn)` — 添加 `hermes <plugin> <subcommand>` |
| 注入消息 | `ctx.inject_message(content, role="user")` — 参见 [注入消息](#injecting-messages) |
| 携带数据文件 | `Path(__file__).parent / "data" / "file.yaml"` |
| 捆绑技能 | `ctx.register_skill(name, path)` — 以 `plugin:skill` 命名空间加载，通过 `skill_view("plugin:skill")` 加载 |
| 基于环境变量控制 | 在 plugin.yaml 中设置 `requires_env: [API_KEY]` — 在 `hermes plugins install` 期间提示 |
| 通过 pip 分发 | `[project.entry-points."hermes_agent.plugins"]` |

## 插件发现机制

| 来源 | 路径 | 使用场景 |
|--------|------|----------|
| 内置 | `<repo>/plugins/` | 随 Hermes 一起发布 — 参见 [内置插件](/docs/user-guide/features/built-in-plugins) |
| 用户 | `~/.hermes/plugins/` | 个人插件 |
| 项目 | `.hermes/plugins/` | 项目专用插件（需设置 `HERMES_ENABLE_PROJECT_PLUGINS=true`） |
| pip | `hermes_agent.plugins` entry_points | 分发的软件包 |

名称冲突时，后面的来源会覆盖前面的来源，因此与内置插件同名的用户插件会替换它。

## 插件默认不启用

**所有插件 — 用户安装的、内置的或通过 pip 安装的 — 默认均为禁用状态。** 发现机制会找到它们（因此它们会出现在 `hermes plugins` 和 `/plugins` 中），但除非你将插件名称添加到 `~/.hermes/config.yaml` 的 `plugins.enabled` 中，否则不会加载任何插件。这可以防止任何带有钩子或工具的插件在未经你明确同意的情况下运行。

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
hermes plugins                    # 交互式切换（空格键勾选/取消勾选）
hermes plugins enable <name>      # 添加到允许列表
hermes plugins disable <name>     # 从允许列表中移除 + 添加到禁用列表
```

执行 `hermes plugins install owner/repo` 后，系统会询问 `立即启用 'name' 吗？[y/N]` — 默认为否。使用 `--enable` 或 `--no-enable` 可在脚本化安装时跳过提示。

### 现有用户的迁移

当你升级到具有“选择启用”插件功能的 Hermes 版本（配置 schema v21+）时，任何已安装在 `~/.hermes/plugins/` 下且未在 `plugins.disabled` 中的用户插件都会**自动继承**到 `plugins.enabled` 中。你现有的设置将继续正常工作。内置插件不会自动继承 — 即使是现有用户也必须明确选择启用。

## 可用的钩子

插件可以为这些生命周期事件注册回调函数。完整详情、回调签名和示例请参见 **[事件钩子页面](/docs/user-guide/features/hooks#plugin-hooks)**。

| 钩子 | 触发时机 |
|------|-----------|
| [`pre_tool_call`](/docs/user-guide/features/hooks#pre_tool_call) | 在任何工具执行之前 |
| [`post_tool_call`](/docs/user-guide/features/hooks#post_tool_call) | 在任何工具返回之后 |
| [`pre_llm_call`](/docs/user-guide/features/hooks#pre_llm_call) | 每轮一次，在 LLM 循环之前 — 可返回 `{"context": "..."}` 以[将上下文注入用户消息](/docs/user-guide/features/hooks#pre_llm_call) |
| [`post_llm_call`](/docs/user-guide/features/hooks#post_llm_call) | 每轮一次，在 LLM 循环之后（仅成功轮次） |
| [`on_session_start`](/docs/user-guide/features/hooks#on_session_start) | 创建新会话时（仅第一轮） |
| [`on_session_end`](/docs/user-guide/features/hooks#on_session_end) | 每次 `run_conversation` 调用结束 + CLI 退出处理程序 |
| [`pre_gateway_dispatch`](/docs/user-guide/features/hooks#pre_gateway_dispatch) | 网关收到用户消息后，在认证和分发之前。返回 `{"action": "skip" \| "rewrite" \| "allow", ...}` 以影响流程。 |

## 插件类型

Hermes 有三种插件：

| 类型 | 功能 | 选择方式 | 位置 |
|------|-------------|-----------|----------|
| **通用插件** | 添加工具、钩子、斜杠命令、CLI 命令 | 多选（启用/禁用） | `~/.hermes/plugins/` |
| **记忆提供者** | 替换或增强内置记忆 | 单选（一个激活） | `plugins/memory/` |
| **上下文引擎** | 替换内置上下文压缩器 | 单选（一个激活） | `plugins/context_engine/` |

记忆提供者和上下文引擎属于**提供者插件** — 每种类型同一时间只能有一个处于激活状态。通用插件可以任意组合启用。

## 管理插件

```bash
hermes plugins                               # 统一的交互式界面
hermes plugins list                          # 表格：已启用 / 已禁用 / 未启用
hermes plugins install user/repo             # 从 Git 安装，然后提示 启用？[y/N]
hermes plugins install user/repo --enable    # 安装并启用（无提示）
hermes plugins install user/repo --no-enable # 安装但保持禁用（无提示）
hermes plugins update my-plugin              # 拉取最新版本
hermes plugins remove my-plugin              # 卸载
hermes plugins enable my-plugin              # 添加到允许列表
hermes plugins disable my-plugin             # 从允许列表中移除 + 添加到禁用列表
```

### 交互式界面

不带参数运行 `hermes plugins` 会打开一个复合交互式界面：

```
插件
  ↑↓ 导航  空格键切换  回车键配置/确认  ESC 完成

  通用插件
 → [✓] my-tool-plugin — 自定义搜索工具
   [ ] webhook-notifier — 事件钩子
   [ ] disk-cleanup — 临时文件自动清理 [内置]

  提供者插件
     记忆提供者          ▸ honcho
     上下文引擎           ▸ compressor
```

- **通用插件部分** — 复选框，使用空格键切换。勾选 = 在 `plugins.enabled` 中，未勾选 = 在 `plugins.disabled` 中（明确关闭）。
- **提供者插件部分** — 显示当前选择。按回车键进入单选选择器，在其中选择一个激活的提供者。
- 内置插件在同一列表中显示，并带有 `[内置]` 标签。

提供者插件的选择会保存到 `config.yaml`：

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
| `已启用` | 下次会话时加载 | 是 | 否 |
| `已禁用` | 明确关闭 — 即使也在 `enabled` 中也不会加载 | （无关） | 是 |
| `未启用` | 已发现但从未选择启用 | 否 | 否 |

新安装或内置插件的默认状态为 `未启用`。`hermes plugins list` 会显示所有三种不同的状态，以便你区分哪些是明确关闭的，哪些只是等待启用。

在运行中的会话中，`/plugins` 会显示当前已加载的插件。

## 注入消息

插件可以使用 `ctx.inject_message()` 将消息注入到当前会话中：

```python
ctx.inject_message("Webhook 收到了新数据", role="user")
```

**签名：** `ctx.inject_message(content: str, role: str = "user") -> bool`

工作原理：

- 如果智能体处于**空闲状态**（等待用户输入），消息将作为下一次输入排队，并开始新一轮。
- 如果智能体处于**进行中状态**（正在运行），消息将中断当前操作 — 等同于用户输入新消息并按回车键。
- 对于非 `"user"` 角色，内容会加上 `[role]` 前缀（例如 `[system] ...`）。
- 如果消息成功排队，则返回 `True`；如果无可用 CLI 引用（例如在网关模式下），则返回 `False`。

这使得远程控制查看器、消息桥接器或 Webhook 接收器等插件能够将来自外部源的消息注入到会话中。

:::note
`inject_message` 仅在 CLI 模式下可用。在网关模式下，没有 CLI 引用，该方法返回 `False`。
:::

有关处理程序约定、schema 格式、钩子行为、错误处理和常见错误的完整指南，请参见 **[完整指南](/docs/guides/build-a-hermes-plugin)**。