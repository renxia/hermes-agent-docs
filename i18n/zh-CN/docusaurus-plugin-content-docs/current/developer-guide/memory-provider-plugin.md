---
sidebar_position: 8
title: "内存提供者插件"
description: "如何为 Hermes Agent 构建内存提供者插件"
---

# 构建内存提供者插件

内存提供者插件为 Hermes Agent 提供超越内置 MEMORY.md 和 USER.md 的持久化、跨会话知识。本指南涵盖如何构建一个内存提供者插件。

:::tip
内存提供者是两种**提供者插件**类型之一。另一种是[上下文引擎插件](/developer-guide/context-engine-plugin)，它替换了内置的上下文压缩器。两者遵循相同的模式：单选、配置驱动，通过 `hermes plugins` 管理。
:::

## 目录结构

每个内存提供者位于 `plugins/memory/<名称>/` 目录下：

```
plugins/memory/my-provider/
├── __init__.py      # MemoryProvider 实现 + register() 入口点
├── plugin.yaml      # 元数据 (名称，描述，钩子)
└── README.md        # 设置说明，配置参考，工具
```

## MemoryProvider 抽象基类

你的插件需要实现来自 `agent/memory_provider.py` 的 `MemoryProvider` 抽象基类：

```python
from agent.memory_provider import MemoryProvider

class MyMemoryProvider(MemoryProvider):
    @property
    def name(self) -> str:
        return "my-provider"

    def is_available(self) -> bool:
        """检查此提供者是否可以激活。禁止网络调用。"""
        return bool(os.environ.get("MY_API_KEY"))

    def initialize(self, session_id: str, **kwargs) -> None:
        """在智能体启动时调用一次。

        kwargs 始终包含：
          hermes_home (str): 活动的 HERMES_HOME 路径。用于存储。
        """
        self._api_key = os.environ.get("MY_API_KEY", "")
        self._session_id = session_id

    # ... 实现剩余方法
```

## 必需方法

### 核心生命周期

| 方法 | 何时调用 | 必须实现？ |
|------|---------|-----------|
| `name` (属性) | 始终 | **是** |
| `is_available()` | 智能体初始化时，激活前 | **是** — 禁止网络调用 |
| `initialize(session_id, **kwargs)` | 智能体启动时 | **是** |
| `get_tool_schemas()` | 初始化后，用于工具注入 | **是** |
| `handle_tool_call(name, args)` | 当智能体使用你的工具时 | **是** (如果你有工具) |

### 配置

| 方法 | 目的 | 必须实现？ |
|------|------|-----------|
| `get_config_schema()` | 为 `hermes memory setup` 声明配置字段 | **是** |
| `save_config(values, hermes_home)` | 将非机密配置写入本地位置 | **是** (除非仅使用环境变量) |

### 可选钩子

| 方法 | 何时调用 | 用例 |
|------|---------|------|
| `system_prompt_block()` | 系统提示组装时 | 静态提供者信息 |
| `prefetch(query)` | 每次 API 调用前 | 返回已回忆的上下文 |
| `queue_prefetch(query)` | 每次轮次后 | 为下一轮次预热 |
| `sync_turn(user, assistant)` | 每个已完成轮次后 | 持久化对话 |
| `on_session_end(messages)` | 对话结束时 | 最终提取/刷新 |
| `on_pre_compress(messages)` | 上下文压缩前 | 在丢弃前保存洞察 |
| `on_memory_write(action, target, content)` | 内置内存写入时 | 镜像到你的后端 |
| `shutdown()` | 进程退出时 | 清理连接 |

## 配置 Schema

`get_config_schema()` 返回一个字段描述符列表，供 `hermes memory setup` 使用：

```python
def get_config_schema(self):
    return [
        {
            "key": "api_key",
            "description": "My Provider API 密钥",
            "secret": True,           # -> 写入 .env
            "required": True,
            "env_var": "MY_API_KEY",   # 显式的环境变量名
            "url": "https://my-provider.com/keys",  # 获取位置
        },
        {
            "key": "region",
            "description": "服务器区域",
            "default": "us-east",
            "choices": ["us-east", "eu-west", "ap-south"],
        },
        {
            "key": "project",
            "description": "项目标识符",
            "default": "hermes",
        },
    ]
```

具有 `secret: True` 和 `env_var` 的字段将写入 `.env`。非机密字段传递给 `save_config()`。

:::tip 最小化与完整 Schema
`get_config_schema()` 中的每个字段都会在 `hermes memory setup` 期间被提示。具有众多选项的提供者应保持 schema 最小化——只包含用户**必须**配置的字段（API 密钥、必需凭证）。将可选设置记录在配置文件参考中（例如 `$HERMES_HOME/myprovider.json`），而不是在设置期间提示所有选项。这使得设置向导快速运行，同时仍然支持高级配置。参见 Supermemory 提供者的示例——它只提示 API 密钥；所有其他选项都在 `supermemory.json` 中。
:::

## 保存配置

```python
def save_config(self, values: dict, hermes_home: str) -> None:
    """将非机密配置写入你的本地位置。"""
    import json
    from pathlib import Path
    config_path = Path(hermes_home) / "my-provider.json"
    config_path.write_text(json.dumps(values, indent=2))
```

对于仅使用环境变量的提供者，保留默认的无操作实现即可。

## 插件入口点

```python
def register(ctx) -> None:
    """由内存插件发现系统调用。"""
    ctx.register_memory_provider(MyMemoryProvider())
```

## plugin.yaml

```yaml
name: my-provider
version: 1.0.0
description: "简短描述此提供者的作用。"
hooks:
  - on_session_end    # 列出你实现的钩子
```

## 线程契约

**`sync_turn()` 必须是非阻塞的。** 如果你的后端有延迟（API 调用、LLM 处理），请在守护线程中运行工作：

```python
def sync_turn(self, user_content, assistant_content):
    def _sync():
        try:
            self._api.ingest(user_content, assistant_content)
        except Exception as e:
            logger.warning("同步失败：%s", e)

    if self._sync_thread and self._sync_thread.is_alive():
        self._sync_thread.join(timeout=5.0)
    self._sync_thread = threading.Thread(target=_sync, daemon=True)
    self._sync_thread.start()
```

## 配置隔离

所有存储路径**必须**使用 `initialize()` 中的 `hermes_home` kwarg，而不是硬编码的 `~/.hermes`：

```python
# 正确 — 配置隔离
from hermes_constants import get_hermes_home
data_dir = get_hermes_home() / "my-provider"

# 错误 — 所有配置共享
data_dir = Path("~/.hermes/my-provider").expanduser()
```

## 测试

参见 `tests/agent/test_memory_plugin_e2e.py` 以获取使用真实 SQLite 提供者的完整端到端测试模式。

```python
from agent.memory_manager import MemoryManager

mgr = MemoryManager()
mgr.add_provider(my_provider)
mgr.initialize_all(session_id="test-1", platform="cli")

# 测试工具路由
result = mgr.handle_tool_call("my_tool", {"action": "add", "content": "test"})

# 测试生命周期
mgr.sync_all("user msg", "assistant msg")
mgr.on_session_end([])
mgr.shutdown_all()
```

## 添加 CLI 命令

内存提供者插件可以注册自己的 CLI 子命令树（例如 `hermes my-provider status`、`hermes my-provider config`）。这使用基于约定的发现系统——无需修改核心文件。

### 工作原理

1.  在你的插件目录中添加 `cli.py` 文件
2.  定义一个 `register_cli(subparser)` 函数来构建 argparse 树
3.  内存插件系统在启动时通过 `discover_plugin_cli_commands()` 发现它
4.  你的命令将出现在 `hermes <provider-name> <subcommand>` 下

**活动提供者门控：** 你的 CLI 命令仅在你的提供者是配置中活动的 `memory.provider` 时才会出现。如果用户未配置你的提供者，你的命令将不会显示在 `hermes --help` 中。

### 示例

```python
# plugins/memory/my-provider/cli.py

def my_command(args):
    """由 argparse 分派的处理程序。"""
    sub = getattr(args, "my_command", None)
    if sub == "status":
        print("提供者处于活动状态且已连接。")
    elif sub == "config":
        print("显示配置中...")
    else:
        print("用法：hermes my-provider <status|config>")

def register_cli(subparser) -> None:
    """构建 hermes my-provider argparse 树。

    由 discover_plugin_cli_commands() 在 argparse 设置时调用。
    """
    subs = subparser.add_subparsers(dest="my_command")
    subs.add_parser("status", help="显示提供者状态")
    subs.add_parser("config", help="显示提供者配置")
    subparser.set_defaults(func=my_command)
```

### 参考实现

参见 `plugins/memory/honcho/cli.py` 以获取包含 13 个子命令、跨配置管理（`--target-profile`）和配置读/写的完整示例。

### 带有 CLI 的目录结构

```
plugins/memory/my-provider/
├── __init__.py      # MemoryProvider 实现 + register()
├── plugin.yaml      # 元数据
├── cli.py           # register_cli(subparser) — CLI 命令
└── README.md        # 设置说明
```

## 单一提供者规则

同一时间只能有一个外部内存提供者处于活动状态。如果用户尝试注册第二个，MemoryManager 将拒绝并发出警告。这防止了工具 schema 膨胀和后端冲突。