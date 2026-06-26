---
sidebar_position: 9
---

# 添加平台适配器

本指南涵盖如何向 Hermes 网关添加新的消息平台。平台适配器将 Hermes 连接到外部消息服务（Telegram、Discord、企业微信等），使用户能够通过该服务与智能体进行交互。

:::tip
有两种添加平台的方式：
- **插件**（推荐用于社区/第三方）：将插件目录放入 `~/.hermes/plugins/` — 无需修改任何核心代码。请参见下面的[插件路径](#plugin-path-recommended)。
- **内置**：需要修改代码、配置和文档中的 20 多个文件。请使用下面的[内置清单](#step-by-step-checklist-built-in-path)。
:::

## 架构概览

```
用户 ↔ 消息平台 ↔ 平台适配器 ↔ 网关运行器 ↔ AI智能体
```

每个适配器都继承自 `gateway/platforms/base.py` 中的 `BasePlatformAdapter`，并实现以下方法：

- **`connect()`** — 建立连接（WebSocket、长轮询、HTTP 服务器等）*（抽象方法）*
- **`disconnect()`** — 干净地关闭 *（抽象方法）*
- **`send()`** — 向聊天发送文本消息 *（抽象方法）*
- **`send_typing()`** — 显示输入指示器（可选覆盖）
- **`get_chat_info()`** — 返回聊天元数据（可选覆盖）

入站消息由适配器接收并通过 `self.handle_message(event)` 转发，该方法由基类路由到网关运行器。

## 插件路径（推荐）

插件系统允许你在不修改任何 Hermes 核心代码的情况下添加平台适配器。你的插件是一个包含两个文件的目录：

```
~/.hermes/plugins/my-platform/
  plugin.yaml      # 插件元数据
  adapter.py       # 适配器类 + register() 入口点
```

### plugin.yaml

插件元数据。`requires_env` 和 `optional_env` 块会自动填充 `hermes config` UI 条目（参见下文[在 Hermes 配置中展示环境变量](#在-hermes-配置中展示环境变量)）。

```yaml
name: my-platform
label: My Platform
kind: platform
version: 1.0.0
description: My custom messaging platform adapter
author: Your Name
requires_env:
  - MY_PLATFORM_TOKEN          # 裸字符串即可
  - name: MY_PLATFORM_CHANNEL  # 或使用丰富的字典以获得更好的 UX
    description: "Channel to join"
    prompt: "Channel"
    password: false
optional_env:
  - name: MY_PLATFORM_HOME_CHANNEL
    description: "Default channel for cron delivery"
    password: false
```

### adapter.py

```python
import os
from gateway.platforms.base import (
    BasePlatformAdapter, SendResult, MessageEvent, MessageType,
)
from gateway.config import Platform, PlatformConfig


class MyPlatformAdapter(BasePlatformAdapter):
    def __init__(self, config: PlatformConfig):
        super().__init__(config, Platform("my_platform"))
        extra = config.extra or {}
        self.token = os.getenv("MY_PLATFORM_TOKEN") or extra.get("token", "")

    async def connect(self) -> bool:
        # 连接平台 API，启动监听器
        self._mark_connected()
        return True

    async def disconnect(self) -> None:
        self._mark_disconnected()

    async def send(self, chat_id, content, reply_to=None, metadata=None):
        # 通过平台 API 发送消息
        return SendResult(success=True, message_id="...")

    async def get_chat_info(self, chat_id):
        return {"name": chat_id, "type": "dm"}


def check_requirements() -> bool:
    return bool(os.getenv("MY_PLATFORM_TOKEN"))


def validate_config(config) -> bool:
    extra = getattr(config, "extra", {}) or {}
    return bool(os.getenv("MY_PLATFORM_TOKEN") or extra.get("token"))


def _env_enablement() -> dict | None:
    token = os.getenv("MY_PLATFORM_TOKEN", "").strip()
    channel = os.getenv("MY_PLATFORM_CHANNEL", "").strip()
    if not (token and channel):
        return None
    seed = {"token": token, "channel": channel}
    home = os.getenv("MY_PLATFORM_HOME_CHANNEL")
    if home:
        seed["home_channel"] = {"chat_id": home, "name": "Home"}
    return seed


def register(ctx):
    """插件入口点 —— 由 Hermes 插件系统调用。"""
    ctx.register_platform(
        name="my_platform",
        label="My Platform",
        adapter_factory=lambda cfg: MyPlatformAdapter(cfg),
        check_fn=check_requirements,
        validate_config=validate_config,
        required_env=["MY_PLATFORM_TOKEN"],
        install_hint="pip install my-platform-sdk",
        # 环境变量驱动的自动配置 —— 在适配器构建之前从环境变量
        # 填充 PlatformConfig.extra。参见下文"环境变量驱动的自动
        # 配置"部分。
        env_enablement_fn=_env_enablement,
        # Cron 主频道投递支持。允许 deliver=my_platform 的 cron
        # 任务无需编辑 cron/scheduler.py 即可路由。参见下文"Cron 投递"
        # 部分。
        cron_deliver_env_var="MY_PLATFORM_HOME_CHANNEL",
        # 每平台用户授权环境变量
        allowed_users_env="MY_PLATFORM_ALLOWED_USERS",
        allow_all_env="MY_PLATFORM_ALLOW_ALL_USERS",
        # 用于智能分块的消息长度限制（0 = 无限制）
        max_message_length=4000,
        # 注入系统提示词的 LLM 指导
        platform_hint=(
            "You are chatting via My Platform. "
            "It supports markdown formatting."
        ),
        # 显示
        emoji="💬",
    )

    # 可选：注册平台专用工具
    ctx.register_tool(
        name="my_platform_search",
        toolset="my_platform",
        schema={...},
        handler=my_search_handler,
    )
```

### 配置

用户在 `config.yaml` 中配置平台：

```yaml
gateway:
  platforms:
    my_platform:
      enabled: true
      extra:
        token: "..."
        channel: "#general"
```

或通过环境变量（适配器在 `__init__` 中读取）。

### 插件系统自动处理的内容

当你调用 `ctx.register_platform()` 时，以下集成点会自动处理 —— 无需更改核心代码：

| 集成点 | 工作原理 |
|---|---|
| 网关适配器创建 | 在内置 if/elif 链之前检查注册表 |
| 配置解析 | `Platform._missing_()` 接受任意平台名称 |
| 已连接平台验证 | 调用注册表 `validate_config()` |
| 用户授权 | 检查 `allowed_users_env` / `allow_all_env` |
| 纯环境变量自动启用 | `env_enablement_fn` 填充 `PlatformConfig.extra` + `home_channel` |
| YAML 配置桥接 | `apply_yaml_config_fn` 将 `config.yaml` 键转换为环境变量 / extras |
| Cron 投递 | `cron_deliver_env_var` 使 `deliver=<name>` 生效 |
| `hermes config` UI 条目 | `plugin.yaml` 中的 `requires_env` / `optional_env` 自动填充 |
| send_message 工具 | 通过实时网关适配器路由 |
| Webhook 跨平台投递 | 检查已知平台的注册表 |
| `/update` 命令访问 | `allow_update_command` 标志 |
| 频道目录 | 插件平台包含在枚举中 |
| 系统提示词提示 | `platform_hint` 注入 LLM 上下文 |
| 消息分块 | `max_message_length` 用于智能拆分 |
| PII 脱敏 | `pii_safe` 标志 |
| `hermes status` | 以 `(plugin)` 标签显示插件平台 |
| `hermes gateway setup` | 插件平台出现在设置菜单中 |
| `hermes tools` / `hermes skills` | 插件平台在每平台配置中 |
| 令牌锁定（多配置文件） | 在 `connect()` 中使用 `acquire_scoped_lock()` |
| 孤立配置警告 | 插件缺失时的描述性日志 |

## 环境变量驱动的自动配置

大多数用户通过将环境变量放入 `~/.hermes/.env` 来设置平台，而不是编辑 `config.yaml`。`env_enablement_fn` 钩子允许你的插件在适配器构建**之前**获取这些环境变量，使得 `hermes gateway status`、`get_connected_platforms()` 和 cron 投递无需实例化平台 SDK 即可看到正确的状态。

```python
def _env_enablement() -> dict | None:
    """从环境变量填充 PlatformConfig.extra。

    由平台注册表在 load_gateway_config() 期间调用。
    当平台未达到最低配置要求时返回 None —— 调用方随后跳过自动启用。
    返回字典以填充 extras。

    特殊的 'home_channel' 键被提取并成为 PlatformConfig 上的
    一个适当的 HomeChannel 数据类；其他每个键都被合并到
    PlatformConfig.extra 中。
    """
    token = os.getenv("MY_PLATFORM_TOKEN", "").strip()
    channel = os.getenv("MY_PLATFORM_CHANNEL", "").strip()
    if not (token and channel):
        return None
    seed = {"token": token, "channel": channel}
    home = os.getenv("MY_PLATFORM_HOME_CHANNEL")
    if home:
        seed["home_channel"] = {
            "chat_id": home,
            "name": os.getenv("MY_PLATFORM_HOME_CHANNEL_NAME", "Home"),
        }
    return seed


def register(ctx):
    ctx.register_platform(
        name="my_platform",
        label="My Platform",
        adapter_factory=lambda cfg: MyPlatformAdapter(cfg),
        check_fn=check_requirements,
        validate_config=validate_config,
        env_enablement_fn=_env_enablement,
        # ... 其他字段
    )
```


## YAML→env 配置桥接

一些用户更喜欢设置 `config.yaml` 键（如 `my_platform.require_mention`、`my_platform.allowed_channels` 等），而不是环境变量。`apply_yaml_config_fn` 钩子允许你的插件自行完成这一翻译，而不是强迫核心 `gateway/config.py` 了解你平台的 YAML 模式。

```python
import os

def _apply_yaml_config(yaml_cfg: dict, platform_cfg: dict) -> dict | None:
    """将 config.yaml `my_platform:` 键翻译为环境变量 / extras。

    yaml_cfg     —— 完整的顶层解析后的 config.yaml 字典
    platform_cfg —— 平台自身的子字典（yaml_cfg.get("my_platform", {})）

    可以直接修改 os.environ（使用 `not os.getenv(...)` 保护以
    保持 env > YAML 优先级）和/或返回一个字典以合并到
    PlatformConfig.extra。返回 None 或 {} 表示无 extras。
    """
    if "require_mention" in platform_cfg and not os.getenv("MY_PLATFORM_REQUIRE_MENTION"):
        os.environ["MY_PLATFORM_REQUIRE_MENTION"] = str(platform_cfg["require_mention"]).lower()
    allowed = platform_cfg.get("allowed_channels")
    if allowed is not None and not os.getenv("MY_PLATFORM_ALLOWED_CHANNELS"):
        if isinstance(allowed, list):
            allowed = ",".join(str(v) for v in allowed)
        os.environ["MY_PLATFORM_ALLOWED_CHANNELS"] = str(allowed)
    return None  # 无需合并到 PlatformConfig.extra 的额外内容

def register(ctx):
    ctx.register_platform(
        name="my_platform",
        ...,
        apply_yaml_config_fn=_apply_yaml_config,
    )
```

该钩子在 `load_gateway_config()` 中通用共享键循环（处理 `unauthorized_dm_behavior`、`notice_delivery`、`reply_prefix`、`require_mention` 等常见键）之后、`_apply_env_overrides()` 之前调用，因此你的插件只需桥接**平台专用**键。

钩子中抛出的异常会被吞没并以 debug 级别记录 —— 行为异常的插件永远不会中止网关配置加载。


## Cron 投递

要允许 `deliver=my_platform` 的 cron 任务路由到已配置的主频道，请将 `cron_deliver_env_var` 设置为保存默认聊天/房间/频道 ID 的环境变量名称：

```python
ctx.register_platform(
    name="my_platform",
    ...
    cron_deliver_env_var="MY_PLATFORM_HOME_CHANNEL",
)
```

调度器在解析 `deliver=my_platform` 任务的主目标时读取此环境变量，并且在类 `_KNOWN_DELIVERY_PLATFORMS` 检查中将平台视为有效的 cron 目标。如果你的 `env_enablement_fn` 填充了 `home_channel` 字典（见上文），则该值优先 —— `cron_deliver_env_var` 是环境变量填充之前运行的 cron 任务的回退方案。

### 进程外 cron 投递

`cron_deliver_env_var` 使你的平台成为公认的 `deliver=` 目标。要使实际发送在 cron 任务于网关独立进程中运行（即 `hermes cron run` 独立于 `hermes gateway`）时成功，请注册 `standalone_sender_fn`：

```python
async def _standalone_send(
    pconfig,
    chat_id,
    message,
    *,
    thread_id=None,
    media_files=None,
    force_document=False,
):
    """打开临时连接 / 获取新令牌，发送，然后关闭。"""
    # ... 打开连接，发送消息，返回结果 ...
    return {"success": True, "message_id": "..."}
    # 或 {"error": "..."}

ctx.register_platform(
    name="my_platform",
    ...
    cron_deliver_env_var="MY_PLATFORM_HOME_CHANNEL",
    standalone_sender_fn=_standalone_send,
)
```

为什么需要这个钩子：内置平台（Telegram、Discord、Slack 等）在 `tools/send_message_tool.py` 中提供了直接的 REST 辅助工具，因此 cron 可以在不在同一进程中持有网关的情况下完成投递。插件平台历来依赖 `_gateway_runner_ref()`，该函数在网关进程外返回 None，因此如果没有 `standalone_sender_fn`，cron 端的发送将失败，报错 `No live adapter for platform '<name>'`。

该函数接收与实时适配器相同的 `pconfig` 和 `chat_id`，加上可选的 `thread_id`、`media_files` 和 `force_document` 关键字参数。返回 `{"success": True, "message_id": ...}` 被视为成功投递；返回 `{"error": "..."}` 会在 cron 的 `delivery_errors` 中显示消息。函数内部抛出的异常会被调度器捕获并报告为 `Plugin standalone send failed: <reason>`。参考实现位于 `plugins/platforms/{irc,teams,google_chat}/adapter.py`。

---
title: Surfacing Env Vars in `hermes config`
description: How to declare environment variables in plugin.yaml so the hermes config CLI auto-discovers them for setup
slug: surfacing-env-vars-in-hermes-config
---

## 在 `hermes config` 中展示环境变量

`hermes_cli/config.py` 在导入时扫描 `plugins/platforms/*/plugin.yaml`，并根据 `requires_env` 和（可选的）`optional_env` 块自动填充 `OPTIONAL_ENV_VARS`。请使用 rich-dict 格式来提供完整的描述、提示、密码标记和 URL——CLI 设置界面会自动获取这些信息，无需额外工作。

```yaml
# plugins/platforms/my_platform/plugin.yaml
name: my_platform-platform
label: My Platform
kind: platform
version: 1.0.0
description: >
  My Platform gateway adapter for Hermes Agent.
author: Your Name
requires_env:
  - name: MY_PLATFORM_TOKEN
    description: "Bot API token from the My Platform console"
    prompt: "My Platform bot token"
    url: "https://my-platform.example.com/bots"
    password: true
  - name: MY_PLATFORM_CHANNEL
    description: "Channel to join (e.g. #hermes)"
    prompt: "Channel"
    password: false
optional_env:
  - name: MY_PLATFORM_HOME_CHANNEL
    description: "Default channel for cron delivery (defaults to MY_PLATFORM_CHANNEL)"
    prompt: "Home channel (or empty)"
    password: false
  - name: MY_PLATFORM_ALLOWED_USERS
    description: "Comma-separated user IDs allowed to talk to the bot"
    prompt: "Allowed users (comma-separated)"
    password: false
```

**支持的字典键：** `name`（必填）、`description`、`prompt`、`url`、`password`（布尔值；省略时自动从 `*_TOKEN` / `*_SECRET` / `*_KEY` / `*_PASSWORD` / `*_JSON` 后缀推断）、`category`（默认为 `"messaging"`）。

裸字符串条目（`- MY_PLATFORM_TOKEN`）仍然有效——它们会从插件的 `label` 自动派生通用描述。如果 `OPTIONAL_ENV_VARS` 中已存在同名变量的硬编码条目，则硬编码条目优先（向后兼容）；plugin.yaml 形式作为后备。

## 平台特定的慢 LLM 用户体验

某些平台的约束条件会改变慢 LLM 响应的呈现方式：

- **LINE** 会发放一个*回复令牌*，该令牌在入站事件后约 60 秒过期，仅限一次性使用。使用该令牌回复是免费的；回退到按量计费的 Push API 则不免费。如果 LLM 在截止时间前未完成，选择是"消耗付费的 Push 配额"还是"在令牌过期前用回复令牌做点更聪明的事情"。
- **WhatsApp** 在 24 小时后会将会话标记为非活跃状态，此后仅接受模板消息。
- **SMS** 没有输入提示或渐进式更新的概念——长响应只会看起来像机器人离线了。

这些是基础 `BasePlatformAdapter` 无法预料的真实约束。插件接口有意留出了空间，让适配器可以在基础输入循环之上叠加平台特定的用户体验，而无需扩展 kwargs 列表。

### 模式：子类化 `_keep_typing` 以叠加飞行中 UX

`BasePlatformAdapter._keep_typing` 是输入提示心跳——它在 LLM 生成响应时作为后台任务运行，并在响应发送后取消。要在某个阈值叠加平台特定行为（例如在 45 秒时发送"仍在思考"气泡），请在适配器中重写 `_keep_typing`，在 `super()._keep_typing()` 旁边调度你自己的任务，并在 `finally` 中清理：

```python
class LineAdapter(BasePlatformAdapter):
    async def _keep_typing(self, chat_id: str, *args, **kwargs) -> None:
        if self.slow_response_threshold <= 0:
            await super()._keep_typing(chat_id, *args, **kwargs)
            return

        async def _fire_at_threshold() -> None:
            try:
                await asyncio.sleep(self.slow_response_threshold)
            except asyncio.CancelledError:
                raise
            # 平台特定工作在此处——对于 LINE，使用缓存的回复令牌
            # 发送一个 Template Buttons "Get answer" 气泡，
            # 以便用户稍后可以通过 postback 回调获取
            # 新的（免费的）回复令牌来拉取缓存的响应。
            await self._send_slow_response_button(chat_id)

        side_task = asyncio.create_task(_fire_at_threshold())
        try:
            await super()._keep_typing(chat_id, *args, **kwargs)
        finally:
            if not side_task.done():
                side_task.cancel()
                try:
                    await side_task
                except (asyncio.CancelledError, Exception):
                    pass
```

关键点：

- **始终 `await super()._keep_typing(...)`。** 输入心跳本身是有用的——不要替换它，而是在其之上叠加。
- **在 `finally` 中清理旁路任务。** 当 LLM 完成（或 `/stop` 取消运行）时，网关会取消输入任务。你的旁路任务也必须响应取消，否则它会残留并可能在响应已发送之后触发。
- **配合 `interrupt_session_activity`** 在用户发出 `/stop` 时解决任何孤立的 UX 状态。对于 LINE，这意味着将 postback 缓存条目从 `PENDING` 转为 `ERROR`，使持久的 "Get answer" 按钮显示"运行被中断"消息而不是循环等待。

### 模式：子类化 `send` 以通过缓存路由而非立即发送

如果你的慢响应 UX 缓存了响应以供后续检索（LINE 的 postback 流程），你的 `send` 重写需要识别三种模式：

1. **此聊天的 postback 待处理中** → 将响应缓存到 request_id 下，不发送任何可见内容。
2. **系统繁忙确认**（`⚡ Interrupting`、`⏳ Queued`、`⏩ Steered`）→ 绕过缓存直接发送，让用户看到网关对其输入的响应。
3. **正常响应** → 通过回复令牌或推送照常发送。

```python
async def send(self, chat_id: str, content: str, **kw) -> SendResult:
    if _is_system_bypass(content):
        return await self._send_text_chunks(chat_id, content, force_push=False)
    pending_rid = self._pending_buttons.get(chat_id)
    if pending_rid:
        self._cache.set_ready(pending_rid, content)
        return SendResult(success=True, message_id=pending_rid)
    return await self._send_text_chunks(chat_id, content, force_push=False)
```

`_SYSTEM_BYPASS_PREFIXES` 是网关自身的繁忙确认前缀（`⚡`、`⏳`、`⏩`、`💾`）。始终让这些消息可见，无论缓存 UX 状态如何。

### 何时适合使用此模式

在以下情况下使用输入循环重写方法：

- 平台的出站 API 有严格的时间窗口约束（一次性回复令牌、过期的粘性会话等），且
- 在该平台上*可见的飞行中气泡*是可接受的 UX。

在以下情况下使用更简单的 `slow_response_threshold = 0` 始终推送路径：

- 平台没有有意义的免费与付费区分，或
- 用户社区更喜欢"加载中……加载完成……DONE"的静默后响应，而非交互式中间气泡。

LINE 支持两种方式：阈值默认为 45 秒以支持免费 postback 拉取，而 `LINE_SLOW_RESPONSE_THRESHOLD=0` 则回退到"始终推送"。

### 参考实现

参见 `plugins/platforms/line/adapter.py` 了解完整的 LINE postback 实现——一个 `RequestCache` 状态机（`PENDING → READY → DELIVERED`，加上 `/stop` 对应的 `ERROR`），一个在阈值触发 Template Buttons 气泡的 `_keep_typing` 重写，一个通过缓存路由的 `send` 重写，以及一个解决孤立 PENDING 条目的 `interrupt_session_activity` 重写。

### 参考实现（插件路径）

参见仓库中的 `plugins/platforms/irc/` 获取完整的工作示例——一个零外部依赖的完整异步 IRC 适配器。`plugins/platforms/teams/` 涵盖 Bot Framework / Adaptive Cards，`plugins/platforms/google_chat/` 涵盖基于 OAuth 的 REST API，`plugins/platforms/line/` 涵盖具有平台特定慢 LLM UX 的 webhook 驱动 Messaging API。

## 分步检查清单（内置路径）

:::note
此检查清单适用于将平台直接添加到 Hermes 核心代码库的场景——通常由核心贡献者对官方支持的平台执行此操作。社区/第三方平台应使用上方[插件路径](#plugin-path-recommended)。
:::

### 1. 平台枚举

在 `gateway/config.py` 的 `Platform` 枚举中添加您的平台：

```python
class Platform(str, Enum):
    # ... 现有平台 ...
    NEWPLAT = "newplat"
```

### 2. 适配器文件

创建 `plugins/platforms/newplat/adapter.py`：

```python
from gateway.config import Platform, PlatformConfig
from gateway.platforms.base import (
    BasePlatformAdapter, MessageEvent, MessageType, SendResult,
)

def check_newplat_requirements() -> bool:
    """如果依赖可用则返回 True。"""
    return SOME_SDK_AVAILABLE

class NewPlatAdapter(BasePlatformAdapter):
    def __init__(self, config: PlatformConfig):
        super().__init__(config, Platform.NEWPLAT)
        # 从 config.extra 字典中读取配置
        extra = config.extra or {}
        self._api_key = extra.get("api_key") or os.getenv("NEWPLAT_API_KEY", "")

    async def connect(self) -> bool:
        # 建立连接，启动轮询/webhook
        self._mark_connected()
        return True

    async def disconnect(self) -> None:
        self._running = False
        self._mark_disconnected()

    async def send(self, chat_id, content, reply_to=None, metadata=None):
        # 通过平台 API 发送消息
        return SendResult(success=True, message_id="...")

    async def get_chat_info(self, chat_id):
        return {"name": chat_id, "type": "dm"}
```

对于入站消息，构建一个 `MessageEvent` 并调用 `self.handle_message(event)`：

```python
source = self.build_source(
    chat_id=chat_id,
    chat_name=name,
    chat_type="dm",  # 或 "group"
    user_id=user_id,
    user_name=user_name,
)
event = MessageEvent(
    text=content,
    message_type=MessageType.TEXT,
    source=source,
    message_id=msg_id,
)
await self.handle_message(event)
```

### 3. 网关配置（`gateway/config.py`）

三个接入点：

1. **`get_connected_platforms()`** — 添加对您平台所需凭证的检查
2. **`load_gateway_config()`** — 添加 token 环境映射条目：`Platform.NEWPLAT: "NEWPLAT_TOKEN"`
3. **`_apply_env_overrides()`** — 将所有 `NEWPLAT_*` 环境变量映射到配置

### 4. 网关运行器（`gateway/run.py`）

五个接入点：

1. **`_create_adapter()`** — 添加 `elif platform == Platform.NEWPLAT:` 分支
2. **`_is_user_authorized()` allowed_users 映射** — `Platform.NEWPLAT: "NEWPLAT_ALLOWED_USERS"`
3. **`_is_user_authorized()` allow_all 映射** — `Platform.NEWPLAT: "NEWPLAT_ALLOW_ALL_USERS"`
4. **早期环境检查 `_allowlist` 元组** — 添加 `"NEWPLAT_ALLOWED_USERS"`
5. **早期环境检查 `_allow_all` 元组** — 添加 `"NEWPLAT_ALLOW_ALL_USERS"`
6. **`_UPDATE_ALLOWED_PLATFORMS` 冻结集** — 添加 `Platform.NEWPLAT`

### 5. 跨平台投递

1. **`gateway/platforms/webhook.py`** — 将 `"newplat"` 添加到投递类型元组
2. **`cron/scheduler.py`** — 添加到 `_KNOWN_DELIVERY_PLATFORMS` 冻结集和 `_deliver_result()` 平台映射

### 6. CLI 集成

1. **`hermes_cli/config.py`** — 将所有 `NEWPLAT_*` 变量添加到 `_EXTRA_ENV_KEYS`
2. **`hermes_cli/gateway.py`** — 添加 `_PLATFORMS` 列表条目，包含键、标签、表情符号、token 变量、设置说明和变量
3. **`hermes_cli/platforms.py`** — 添加 `PlatformInfo` 条目，包含标签和默认工具集（由 `skills_config` 和 `tools_config` TUI 使用）
4. **`hermes_cli/setup.py`** — 添加 `_setup_newplat()` 函数（可委托给 `gateway.py`）并将元组添加到消息平台列表
5. **`hermes_cli/status.py`** — 添加平台检测条目：`"NewPlat": ("NEWPLAT_TOKEN", "NEWPLAT_HOME_CHANNEL")`
6. **`hermes_cli/dump.py`** — 将 `"newplat": "NEWPLAT_TOKEN"` 添加到平台检测字典

### 7. 工具

1. **`tools/send_message_tool.py`** — 将 `"newplat": Platform.NEWPLAT` 添加到平台映射
2. **`tools/cronjob_tools.py`** — 将 `newplat` 添加到投递目标描述字符串

### 8. 工具集

1. **`toolsets.py`** — 添加 `"hermes-newplat"` 工具集定义及其 `_HERMES_CORE_TOOLS`
2. **`toolsets.py`** — 将 `"hermes-newplat"` 添加到 `"hermes-gateway"` 的 includes 列表

### 9. 可选：平台提示

**`agent/prompt_builder.py`** — 如果您的平台有特定的渲染限制（不支持 markdown、消息长度限制等），向 `_PLATFORM_HINTS` 字典添加条目。这会将平台特定的指导注入系统提示词：

```python
_PLATFORM_HINTS = {
    # ...
    "newplat": (
        "You are chatting via NewPlat. It supports markdown formatting "
        "but has a 4000-character message limit."
    ),
}
```

并非所有平台都需要提示——仅在智能体的行为应有所不同时才添加。

### 10. 测试

创建 `tests/gateway/test_newplat.py`，覆盖：

- 从配置构建适配器
- 消息事件构建
- 发送方法（模拟外部 API）
- 平台特定功能（加密、路由等）

### 11. 文档

| 文件 | 添加内容 |
|------|-------------|
| `website/docs/user-guide/messaging/newplat.md` | 完整的平台设置页面 |
| `website/docs/user-guide/messaging/index.md` | 平台对比表、架构图、工具集表、安全部分、下一步链接 |
| `website/docs/reference/environment-variables.md` | 所有 NEWPLAT_* 环境变量 |
| `website/docs/reference/toolsets-reference.md` | hermes-newplat 工具集 |
| `website/docs/integrations/index.md` | 平台链接 |
| `website/sidebars.ts` | 文档页面的侧边栏条目 |
| `website/docs/developer-guide/architecture.md` | 适配器数量 + 列表 |
| `website/docs/developer-guide/gateway-internals.md` | 适配器文件列表 |

## 对等审计

在将新平台 PR 标记为完成之前，对照一个已建立的平台运行对等审计：

```bash
# 查找所有引用参考平台的 .py 文件
search_files "bluebubbles" output_mode="files_only" file_glob="*.py"

# 查找所有引用新平台的 .py 文件
search_files "newplat" output_mode="files_only" file_glob="*.py"

# 第一个集合中存在但第二个集合中不存在的文件即为潜在遗漏
```

对 `.md` 和 `.ts` 文件重复此过程。调查每个遗漏——是平台枚举（需要更新）还是平台特定引用（跳过）？

## 常见模式

### 长轮询适配器

如果您的适配器使用长轮询（如 Telegram 或微信），使用轮询循环任务：

```python
async def connect(self):
    self._poll_task = asyncio.create_task(self._poll_loop())
    self._mark_connected()

async def _poll_loop(self):
    while self._running:
        messages = await self._fetch_updates()
        for msg in messages:
            await self.handle_message(self._build_event(msg))
```

### 回调/Webhook 适配器

如果平台将消息推送到您的端点（如企业微信回调），运行 HTTP 服务器：

```python
async def connect(self):
    self._app = web.Application()
    self._app.router.add_post("/callback", self._handle_callback)
    # ... 启动 aiohttp 服务器
    self._mark_connected()

async def _handle_callback(self, request):
    event = self._build_event(await request.text())
    await self._message_queue.put(event)
    return web.Response(text="success")  # 立即确认
```

对于有严格响应截止时间的平台（例如企业微信的 5 秒限制），始终立即确认，稍后再通过 API 主动投递智能体的回复。智能体会话运行时间为 3–30 分钟——在回调响应窗口内进行内联回复是不可行的。

### Token 锁

如果适配器持有带有唯一凭证的持久连接，请添加作用域锁以防止两个配置文件使用同一凭证：

```python
from gateway.status import acquire_scoped_lock, release_scoped_lock

async def connect(self):
    if not acquire_scoped_lock("newplat", self._token):
        logger.error("Token 已被另一个配置文件使用")
        return False
    # ... 连接

async def disconnect(self):
    release_scoped_lock("newplat", self._token)
```

## 参考实现

| 适配器 | 模式 | 复杂度 | 适用于 |
|---------|---------|------------|-------------------|
| `bluebubbles.py` | REST + webhook | 中等 | 简单 REST API 集成 |
| `weixin.py` | 长轮询 + CDN | 高 | 媒体处理、加密 |
| `wecom_callback.py` | 回调/webhook | 中等 | HTTP 服务器、AES 加密、多应用 |
| `plugins/platforms/irc/adapter.py` | 长轮询 + IRC 协议 | 高 | 功能完整的插件适配器，带作用域 token 锁 |