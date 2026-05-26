---
sidebar_position: 9
---

# 添加平台适配器

本指南介绍如何为 Hermes 网关添加新的消息平台。平台适配器将 Hermes 连接到外部消息服务（如 Telegram、Discord、企业微信等），以便用户可以通过该服务与智能体进行交互。

:::tip
添加平台有两种方式：
- **插件**（适用于社区/第三方推荐）：将插件目录放入 `~/.hermes/plugins/` — 无需修改任何核心代码。请参阅下方[插件路径（推荐）](#插件路径推荐)。
- **内置**：需要修改代码、配置和文档中的 20 多个文件。请使用下方[内置检查清单](#逐步检查清单)。
:::

## 架构概览

```
用户 ↔ 消息平台 ↔ 平台适配器 ↔ 网关运行器 ↔ AIAgent
```

每个适配器都继承自 `gateway/platforms/base.py` 中的 `BasePlatformAdapter` 并实现以下方法：

- **`connect()`** — 建立连接（WebSocket、长轮询、HTTP 服务器等）*（抽象方法）*
- **`disconnect()`** — 清理关闭 *（抽象方法）*
- **`send()`** — 向聊天发送文本消息 *（抽象方法）*
- **`send_typing()`** — 显示输入中指示器（可选覆盖）
- **`get_chat_info()`** — 返回聊天元数据（可选覆盖）

入站消息由适配器接收，并通过 `self.handle_message(event)` 转发，该方法由基类路由到网关运行器。

## 插件路径（推荐）

插件系统允许您添加平台适配器，而无需修改任何核心 Hermes 代码。您的插件是一个包含两个文件的目录：

```
~/.hermes/plugins/my-platform/
  PLUGIN.yaml      # 插件元数据
  adapter.py       # 适配器类 + register() 入口点
```

### PLUGIN.yaml

插件元数据。`requires_env` 和 `optional_env` 块会自动填充 `hermes config` UI 条目（参见下面的[在 hermes config 中显示环境变量](#在-hermes-config-中显示环境变量)）。

```yaml
name: my-platform
label: My Platform
kind: platform
version: 1.0.0
description: 我的自定义消息平台适配器
author: Your Name
requires_env:
  - MY_PLATFORM_TOKEN          # 简单字符串格式可用
  - name: MY_PLATFORM_CHANNEL  # 或使用富字典以获得更好的用户体验
    description: "要加入的频道"
    prompt: "频道"
    password: false
optional_env:
  - name: MY_PLATFORM_HOME_CHANNEL
    description: "用于定时任务投递的默认频道"
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
        # 连接到平台 API，启动监听器
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
    """插件入口点 - 由 Hermes 插件系统调用。"""
    ctx.register_platform(
        name="my_platform",
        label="My Platform",
        adapter_factory=lambda cfg: MyPlatformAdapter(cfg),
        check_fn=check_requirements,
        validate_config=validate_config,
        required_env=["MY_PLATFORM_TOKEN"],
        install_hint="pip install my-platform-sdk",
        # 基于环境的自动配置 - 在构建适配器之前，从环境变量生成 PlatformConfig.extra。
        # 请参见下面的“基于环境的自动配置”部分。
        env_enablement_fn=_env_enablement,
        # 定时任务主频道投递支持。允许 `deliver=my_platform` 的定时任务无需编辑 cron/scheduler.py 即可路由。
        # 请参见下面的“定时任务投递”部分。
        cron_deliver_env_var="MY_PLATFORM_HOME_CHANNEL",
        # 每个平台的用户授权环境变量
        allowed_users_env="MY_PLATFORM_ALLOWED_USERS",
        allow_all_env="MY_PLATFORM_ALLOW_ALL_USERS",
        # 智能分块的消息长度限制 (0 = 无限制)
        max_message_length=4000,
        # 注入系统提示的 LLM 引导
        platform_hint=(
            "您正在通过 My Platform 聊天。"
            "它支持 Markdown 格式。"
        ),
        # 显示
        emoji="💬",
    )

    # 可选：注册平台特定工具
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

当您调用 `ctx.register_platform()` 时，系统会为您处理以下集成点——无需更改核心代码：

| 集成点 | 工作方式 |
|---|---|
| 网关适配器创建 | 注册表在内置的 if/elif 链之前被检查 |
| 配置解析 | `Platform._missing_()` 接受任何平台名称 |
| 已连接平台验证 | 调用注册表的 `validate_config()` |
| 用户授权 | 检查 `allowed_users_env` / `allow_all_env` |
| 仅环境自动启用 | `env_enablement_fn` 生成 `PlatformConfig.extra` + `home_channel` |
| YAML 配置桥接 | `apply_yaml_config_fn` 将 `config.yaml` 键转换为环境变量/额外配置 |
| 定时任务投递 | `cron_deliver_env_var` 使 `deliver=<name>` 生效 |
| `hermes config` UI 条目 | `plugin.yaml` 中的 `requires_env` / `optional_env` 自动填充 |
| send_message 工具 | 通过活动的网关适配器路由 |
| Webhook 跨平台投递 | 检查注册表以识别已知平台 |
| `/update` 命令访问 | `allow_update_command` 标志 |
| 频道目录 | 插件平台包含在枚举中 |
| 系统提示提示 | `platform_hint` 注入 LLM 上下文 |
| 消息分块 | `max_message_length` 用于智能分割 |
| PII 脱敏 | `pii_safe` 标志 |
| `hermes status` | 显示带 `(plugin)` 标签的插件平台 |
| `hermes gateway setup` | 插件平台出现在设置菜单中 |
| `hermes tools` / `hermes skills` | 每个平台配置中的插件平台 |
| 令牌锁（多配置文件） | 在您的 `connect()` 中使用 `acquire_scoped_lock()` |
| 孤立配置警告 | 插件缺失时的描述性日志 |

## 基于环境的自动配置

大多数用户通过将环境变量放入 `~/.hermes/.env` 来设置平台，而不是编辑 `config.yaml`。`env_enablement_fn` 钩子允许您的插件在构建适配器**之前**获取这些环境变量，因此 `hermes gateway status`、`get_connected_platforms()` 和定时任务投递可以看到正确的状态，而无需实例化平台 SDK。

```python
def _env_enablement() -> dict | None:
    """从环境变量生成 PlatformConfig.extra。

    在 load_gateway_config() 期间由平台注册表调用。
    当平台未进行最低限度配置时返回 None - 调用者随后跳过自动启用。
    返回一个字典以生成额外配置。

    特殊的 'home_channel' 键会被提取并成为 PlatformConfig 上的适当
    HomeChannel 数据类；其他每个键都合并到 PlatformConfig.extra 中。
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


## YAML→环境变量配置桥接

有些用户更喜欢通过 `config.yaml` 键（`my_platform.require_mention`、`my_platform.allowed_channels` 等）而不是环境变量来设置。`apply_yaml_config_fn` 钩子让您的插件拥有这个转换，而不是强制核心 `gateway/config.py` 了解您平台的 YAML 模式。

```python
import os

def _apply_yaml_config(yaml_cfg: dict, platform_cfg: dict) -> dict | None:
    """将 config.yaml 中的 `my_platform:` 键转换为环境变量/额外配置。

    yaml_cfg     — 解析后的完整顶级 config.yaml 字典
    platform_cfg — 平台自身的子字典 (yaml_cfg.get("my_platform", {}))

    可以直接修改 os.environ（使用 `not os.getenv(...)` 保护以保持 env > YAML 优先级），
    和/或返回一个要合并到 PlatformConfig.extra 的字典。返回 None 或 {} 表示没有额外配置。
    """
    if "require_mention" in platform_cfg and not os.getenv("MY_PLATFORM_REQUIRE_MENTION"):
        os.environ["MY_PLATFORM_REQUIRE_MENTION"] = str(platform_cfg["require_mention"]).lower()
    allowed = platform_cfg.get("allowed_channels")
    if allowed is not None and not os.getenv("MY_PLATFORM_ALLOWED_CHANNELS"):
        if isinstance(allowed, list):
            allowed = ",".join(str(v) for v in allowed)
        os.environ["MY_PLATFORM_ALLOWED_CHANNELS"] = str(allowed)
    return None  # 没有需要合并到 PlatformConfig.extra 的内容

def register(ctx):
    ctx.register_platform(
        name="my_platform",
        ...,
        apply_yaml_config_fn=_apply_yaml_config,
    )
```

该钩子在 `load_gateway_config()` 期间，在通用共享键循环（处理如 `unauthorized_dm_behavior`、`notice_delivery`、`reply_prefix`、`require_mention` 等通用键）之后、`_apply_env_overrides()` 之前被调用，因此您的插件只需要桥接**平台特定**的键。

该钩子引发的异常会被捕获并在调试级别记录——行为异常的插件永远不会中止网关配置加载。

## 定时投递

要让 `deliver=my_platform` 类型的定时任务路由到配置的主频道，请将 `cron_deliver_env_var` 设置为包含默认聊天/房间/频道 ID 的环境变量名称：

```python
ctx.register_platform(
    name="my_platform",
    ...
    cron_deliver_env_var="MY_PLATFORM_HOME_CHANNEL",
)
```

调度器在解析 `deliver=my_platform` 任务的投递目标时会读取此环境变量，同时在 `_KNOWN_DELIVERY_PLATFORMS` 风格的检查中将该平台视为有效的定时任务投递目标。如果您的 `env_enablement_fn` 填充了 `home_channel` 字典（参见上文），则该字典的值将优先——`cron_deliver_env_var` 是针对在环境变量填充之前运行的定时任务的后备方案。

### 进程外定时投递

`cron_deliver_env_var` 使您的平台成为被识别的 `deliver=` 目标。要使定时任务在与网关分离的进程中运行时（即 `hermes cron run` 与 `hermes gateway` 分开运行）实际发送成功，请注册一个 `standalone_sender_fn`：

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
    """打开临时连接/获取新令牌，发送，然后关闭。"""
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

为什么需要这个钩子：内置平台（Telegram、Discord、Slack 等）在 `tools/send_message_tool.py` 中提供了直接的 REST 辅助函数，因此定时任务无需与网关保持在同一进程中即可投递。插件平台历来依赖 `_gateway_runner_ref()`，该函数在网关进程外部返回 `None`，因此如果没有 `standalone_sender_fn`，定时任务端的发送将失败并显示 `No live adapter for platform '<name>'`。

该函数接收与活动适配器相同的 `pconfig` 和 `chat_id`，以及可选的 `thread_id`、`media_files` 和 `force_document` 关键字参数。返回 `{"success": True, "message_id": ...}` 被视为投递成功；返回 `{"error": "..."}` 会在定时任务的 `delivery_errors` 中显示该消息。函数内引发的异常会被调度器捕获并报告为 `Plugin standalone send failed: <reason>`。参考实现位于 `plugins/platforms/{irc,teams,google_chat}/adapter.py`。

## 在 `hermes config` 中展示环境变量

`hermes_cli/config.py` 在导入时会扫描 `plugins/platforms/*/plugin.yaml`，并根据 `requires_env` 和（可选的）`optional_env` 块自动填充 `OPTIONAL_ENV_VARS`。使用丰富的字典形式可以提供适当的描述、提示、密码标志和 URL——CLI 设置界面会免费拾取它们。

```yaml
# plugins/platforms/my_platform/plugin.yaml
name: my_platform-platform
label: 我的平台
kind: platform
version: 1.0.0
description: >
  用于 Hermes 智能体的我的平台网关适配器。
author: 您的名字
requires_env:
  - name: MY_PLATFORM_TOKEN
    description: "来自我的平台控制台的 Bot API 令牌"
    prompt: "我的平台 bot 令牌"
    url: "https://my-platform.example.com/bots"
    password: true
  - name: MY_PLATFORM_CHANNEL
    description: "要加入的频道（例如 #hermes）"
    prompt: "频道"
    password: false
optional_env:
  - name: MY_PLATFORM_HOME_CHANNEL
    description: "定时投递的默认频道（默认为 MY_PLATFORM_CHANNEL）"
    prompt: "主频道（或留空）"
    password: false
  - name: MY_PLATFORM_ALLOWED_USERS
    description: "允许与 bot 交谈的用户 ID（逗号分隔）"
    prompt: "允许的用户（逗号分隔）"
    password: false
```

**支持的字典键：** `name`（必需），`description`，`prompt`，`url`，`password`（布尔值；省略时根据 `*_TOKEN` / `*_SECRET` / `*_KEY` / `*_PASSWORD` / `*_JSON` 后缀自动检测），`category`（默认为 `"messaging"`）。

裸字符串条目（`- MY_PLATFORM_TOKEN`）仍然有效——它们会获得一个根据插件的 `label` 自动生成的通用描述。如果 `OPTIONAL_ENV_VARS` 中已经存在针对同一变量的硬编码条目，则硬编码条目优先（向后兼容）；plugin.yaml 形式充当后备方案。

## 平台特定的慢速LLM用户体验

一些平台的限制条件会改变慢速LLM响应的呈现方式：

- **LINE** 会发出一个一次性*回复令牌*，该令牌在入站事件后约60秒过期。使用该令牌回复是免费的；回退到付费的推送API则不是。如果LLM在截止时间前未完成，选择就是"消耗付费推送配额"或"在回复令牌过期前做些更聪明的事"。
- **WhatsApp** 在24小时后将会话标记为不活跃，此后仅接受模板消息。
- **SMS** 没有输入指示器或渐进式更新的概念——长时间的响应看起来就像是机器人离线了。

这些是基础的 `BasePlatformAdapter` 无法预见的真实限制。插件接口有意留出空间，允许适配器在基础的输入循环之上叠加平台特定的用户体验，而无需扩展kwarg列表。

### 模式：子类化 `_keep_typing` 以叠加进行中的UX

`BasePlatformAdapter._keep_typing` 是输入指示器的心跳——它在LLM生成响应期间作为后台任务运行，并在响应交付时被取消。要在某个阈值（例如在45秒时发送"仍在思考"气泡）叠加平台特定行为，请在你的适配器中覆盖 `_keep_typing`，在 `super()._keep_typing()` 旁边安排你自己的任务，并在 `finally` 中将其拆除：

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
            # 这里执行平台特定的工作——对于LINE，发送一个模板
            # 按钮"获取答案"气泡，使用缓存的回复令牌
            # 以便用户稍后可以通过一个
            # 来自回传回调的新（免费）回复令牌获取缓存的响应。
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

要点：

- **始终 `await super()._keep_typing(...)`。** 输入心跳本身很有用——不要替换它，要在其上叠加。
- **在 `finally` 中拆除侧边任务。** 当LLM完成（或 `/stop` 取消运行）时，网关会取消输入任务。你的侧边任务也必须遵守该取消，否则它会遗留下来，并可能在响应已交付后触发。
- **与 `interrupt_session_activity` 配对**，以在用户发出 `/stop` 时解决任何孤立的UX状态。对于LINE，这意味着将回传缓存条目从 `PENDING` 转换为 `ERROR`，以便持久的"获取答案"按钮发送"运行已中断"消息，而不是循环。

### 模式：子类化 `send` 以通过缓存路由，而非立即发送

如果你的慢速响应UX将响应缓存以供稍后检索（LINE的回传流程），你的 `send` 覆盖需要识别三种模式：

1. **此聊天有活动的挂起回传** → 将响应缓存在request_id下，不发送任何可见内容。
2. **系统忙碌确认** (`⚡ Interrupting`, `⏳ Queued`, `⏩ Steered`) → 绕过缓存并可见地发送，以便用户看到网关对其输入的响应。
3. **正常响应** → 像往常一样通过回复令牌或推送发送。

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

`_SYSTEM_BYPASS_PREFIXES` 是网关自己的忙碌确认前缀（`⚡`, `⏳`, `⏩`, `💾`）。无论缓存的UX状态如何，始终让这些内容可见通过。

### 此模式适用的情况

在以下情况下使用输入循环覆盖方法：

- 平台的出站API有硬性时间窗口限制（一次性回复令牌、过期的粘性会话等）**且**
- 在该平台上，*可见的进行中气泡* 是可接受的用户体验。

在以下情况下使用更简单的 `slow_response_threshold = 0` 始终推送路径：

- 平台没有有意义的免费与付费区别，**或**
- 用户社区更喜欢"加载中…加载中…完成"的沉默-然后-响应，而不是交互式的中间气泡。

LINE 两者都支持：阈值默认为45秒以进行免费回传获取，`LINE_SLOW_RESPONSE_THRESHOLD=0` 则恢复为"始终推送回退"。

### 参考实现

有关完整的LINE回传实现，请参见 `plugins/platforms/line/adapter.py`——一个 `RequestCache` 状态机（`PENDING → READY → DELIVERED`，加上用于 `/stop` 的 `ERROR`），一个在阈值时触发模板按钮气泡的 `_keep_typing` 覆盖，一个通过缓存路由的 `send` 覆盖，以及一个解决孤立PENDING条目的 `interrupt_session_activity` 覆盖。

### 参考实现（插件路径）

有关完整的工作示例，请参见代码库中的 `plugins/platforms/irc/` —— 一个具有零外部依赖的全异步IRC适配器。`plugins/platforms/teams/` 涵盖 Bot Framework / Adaptive Cards，`plugins/platforms/google_chat/` 涵盖基于OAuth的REST API，`plugins/platforms/line/` 涵盖具有平台特定慢速LLM UX的 webhook 驱动的消息API。

---

## 分步检查清单（内置路径）

:::note
此检查清单用于直接向 Hermes 核心代码库添加平台——通常由官方支持平台的核心贡献者完成。社区/第三方平台应使用上方的 [插件路径](#plugin-path-recommended)。
:::

### 1. 平台枚举

将你的平台添加到 `gateway/config.py` 中的 `Platform` 枚举中：

```python
class Platform(str, Enum):
    # ... 现有平台 ...
    NEWPLAT = "newplat"
```

### 2. 适配器文件

创建 `gateway/platforms/newplat.py`：

```python
from gateway.config import Platform, PlatformConfig
from gateway.platforms.base import (
    BasePlatformAdapter, MessageEvent, MessageType, SendResult,
)

def check_newplat_requirements() -> bool:
    """如果依赖项可用，返回 True。"""
    return SOME_SDK_AVAILABLE

class NewPlatAdapter(BasePlatformAdapter):
    def __init__(self, config: PlatformConfig):
        super().__init__(config, Platform.NEWPLAT)
        # 从 config.extra 字典中读取配置
        extra = config.extra or {}
        self._api_key = extra.get("api_key") or os.getenv("NEWPLAT_API_KEY", "")

    async def connect(self) -> bool:
        # 设置连接，启动轮询/网络钩子
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

### 3. 网关配置 (`gateway/config.py`)

三个接触点：

1. **`get_connected_platforms()`** — 为你的平台所需凭据添加检查
2. **`load_gateway_config()`** — 添加令牌环境变量映射条目：`Platform.NEWPLAT: "NEWPLAT_TOKEN"`
3. **`_apply_env_overrides()`** — 将所有 `NEWPLAT_*` 环境变量映射到配置

### 4. 网关运行器 (`gateway/run.py`)

五个接触点：

1. **`_create_adapter()`** — 添加一个 `elif platform == Platform.NEWPLAT:` 分支
2. **`_is_user_authorized()` allowed_users 映射** — `Platform.NEWPLAT: "NEWPLAT_ALLOWED_USERS"`
3. **`_is_user_authorized()` allow_all 映射** — `Platform.NEWPLAT: "NEWPLAT_ALLOW_ALL_USERS"`
4. **早期环境检查 `_any_allowlist` 元组** — 添加 `"NEWPLAT_ALLOWED_USERS"`
5. **早期环境检查 `_allow_all` 元组** — 添加 `"NEWPLAT_ALLOW_ALL_USERS"`
6. **`_UPDATE_ALLOWED_PLATFORMS` 冻结集合** — 添加 `Platform.NEWPLAT`

### 5. 跨平台交付

1. **`gateway/platforms/webhook.py`** — 在交付类型元组中添加 `"newplat"`
2. **`cron/scheduler.py`** — 添加到 `_KNOWN_DELIVERY_PLATFORMS` 冻结集合和 `_deliver_result()` 平台映射中

### 6. CLI 集成

1. **`hermes_cli/config.py`** — 将所有 `NEWPLAT_*` 变量添加到 `_EXTRA_ENV_KEYS`
2. **`hermes_cli/gateway.py`** — 向 `_PLATFORMS` 列表添加条目，包括键、标签、表情符号、令牌变量、设置说明和变量
3. **`hermes_cli/platforms.py`** — 添加 `PlatformInfo` 条目，包括标签和默认工具集（由 `skills_config` 和 `tools_config` TUI 使用）
4. **`hermes_cli/setup.py`** — 添加 `_setup_newplat()` 函数（可以委托给 `gateway.py`），并将元组添加到消息平台列表
5. **`hermes_cli/status.py`** — 添加平台检测条目：`"NewPlat": ("NEWPLAT_TOKEN", "NEWPLAT_HOME_CHANNEL")`
6. **`hermes_cli/dump.py`** — 在平台检测字典中添加 `"newplat": "NEWPLAT_TOKEN"`

### 7. 工具

1. **`tools/send_message_tool.py`** — 向平台映射中添加 `"newplat": Platform.NEWPLAT`
2. **`tools/cronjob_tools.py`** — 在交付目标描述字符串中添加 `newplat`

### 8. 工具集

1. **`toolsets.py`** — 添加 `"hermes-newplat"` 工具集定义，包含 `_HERMES_CORE_TOOLS`
2. **`toolsets.py`** — 将 `"hermes-newplat"` 添加到 `"hermes-gateway"` 的 includes 列表中

### 9. 可选：平台提示

**`agent/prompt_builder.py`** — 如果你的平台有特定的渲染限制（无 Markdown、消息长度限制等），请向 `_PLATFORM_HINTS` 字典添加一个条目。这会将平台特定的指导注入到系统提示中：

```python
_PLATFORM_HINTS = {
    # ...
    "newplat": (
        "你正在通过 NewPlat 进行聊天。它支持 Markdown 格式"
        "但消息有 4000 个字符的限制。"
    ),
}
```

并非所有平台都需要提示——仅当智能体的行为应有所不同时才添加。

### 10. 测试

创建 `tests/gateway/test_newplat.py`，涵盖：

- 从配置构建适配器
- 消息事件构建
- 发送方法（模拟外部 API）
- 平台特定功能（加密、路由等）

### 11. 文档

| 文件 | 需要添加的内容 |
|------|----------------|
| `website/docs/user-guide/messaging/newplat.md` | 完整的平台设置页面 |
| `website/docs/user-guide/messaging/index.md` | 平台对比表、架构图、工具集表、安全部分、后续步骤链接 |
| `website/docs/reference/environment-variables.md` | 所有 NEWPLAT_* 环境变量 |
| `website/docs/reference/toolsets-reference.md` | hermes-newplat 工具集 |
| `website/docs/integrations/index.md` | 平台链接 |
| `website/sidebars.ts` | 文档页面的侧边栏条目 |
| `website/docs/developer-guide/architecture.md` | 适配器数量 + 列表 |
| `website/docs/developer-guide/gateway-internals.md` | 适配器文件列表 |

## 对等性审计

在将新的平台 PR 标记为完成之前，针对一个已建立的平台运行对等性审计：

```bash
# 查找每个提到参考平台的 .py 文件
search_files "bluebubbles" output_mode="files_only" file_glob="*.py"

# 查找每个提到新平台的 .py 文件
search_files "newplat" output_mode="files_only" file_glob="*.py"

# 第一个集合中有但第二个中没有的文件是一个潜在的差距
```

对 `.md` 和 `.ts` 文件重复此操作。调查每个差距——它是平台枚举（需要更新）还是平台特定参考（跳过）？

## 常见模式

### 长轮询适配器

如果你的适配器使用长轮询（如 Telegram 或微信），请使用轮询循环任务：

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

### 回调/网络钩子适配器

如果平台将消息推送到你的端点（如企业微信回调），请运行一个 HTTP 服务器：

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

对于有严格响应截止时间的平台（例如企业微信的 5 秒限制），请始终立即确认，并稍后通过 API 主动交付智能体的回复。智能体会话运行时间为 3-30 分钟——在回调响应窗口内进行内联回复是不可行的。

### 令牌锁

如果适配器持有具有唯一凭据的持久连接，请添加作用域锁以防止两个配置文件使用相同的凭据：

```python
from gateway.status import acquire_scoped_lock, release_scoped_lock

async def connect(self):
    if not acquire_scoped_lock("newplat", self._token):
        logger.error("令牌已被另一个配置文件使用")
        return False
    # ... 连接

async def disconnect(self):
    release_scoped_lock("newplat", self._token)
```

## 参考实现

| 适配器 | 模式 | 复杂度 | 适合作为参考 |
|--------|------|--------|-------------|
| `bluebubbles.py` | REST + 网络钩子 | 中等 | 简单的 REST API 集成 |
| `weixin.py` | 长轮询 + CDN | 高 | 媒体处理、加密 |
| `wecom_callback.py` | 回调/网络钩子 | 中等 | HTTP 服务器、AES 加密、多应用 |
| `telegram.py` | 长轮询 + Bot API | 高 | 具有群组、线程的完整功能适配器 |