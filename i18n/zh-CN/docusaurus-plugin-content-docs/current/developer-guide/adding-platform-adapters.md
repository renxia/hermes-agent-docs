---
sidebar_position: 9
---

# 添加平台适配器

本指南涵盖如何为 Hermes 网关添加新的消息平台。平台适配器将 Hermes 连接到外部消息服务（如 Telegram、Discord、企业微信等），使用户能够通过该服务与智能体进行交互。

:::tip
添加平台有两种方式：
- **插件**（推荐用于社区/第三方）：将插件目录放入 `~/.hermes/plugins/` —— 无需修改任何核心代码。请参见下方[插件路径（推荐）](#插件路径推荐)。
- **内置**：需要修改代码、配置和文档等 20 个以上文件。请使用下方的[内置清单](#逐步检查清单)。
:::

## 架构概览

```
用户 ↔ 消息平台 ↔ 平台适配器 ↔ 网关运行器 ↔ AI智能体
```

每个适配器都扩展自 `gateway/platforms/base.py` 中的 `BasePlatformAdapter` 并实现以下方法：

- **`connect()`** — 建立连接（WebSocket、长轮询、HTTP 服务器等）*（抽象方法）*
- **`disconnect()`** — 清理并关闭连接*（抽象方法）*
- **`send()`** — 向聊天发送文本消息*（抽象方法）*
- **`send_typing()`** — 显示输入指示器（可选覆盖）
- **`get_chat_info()`** — 返回聊天元数据（可选覆盖）

入站消息由适配器接收并通过 `self.handle_message(event)` 转发，该方法由基类路由到网关运行器。

## 插件路径（推荐）

插件系统允许您添加平台适配器，而无需修改任何核心 Hermes 代码。您的插件是一个包含两个文件的目录：

```
~/.hermes/plugins/my-platform/
  PLUGIN.yaml      # 插件元数据
  adapter.py       # 适配器类 + register() 入口点
```

### PLUGIN.yaml

插件元数据。`requires_env` 和 `optional_env` 块会自动填充 `hermes config` UI 条目（请参阅下文[在 hermes config 中显示环境变量](#在-hermes-config-中显示环境变量)）。

```yaml
name: my-platform
label: My Platform
kind: platform
version: 1.0.0
description: 我的自定义消息平台适配器
author: Your Name
requires_env:
  - MY_PLATFORM_TOKEN          # 纯字符串形式可用
  - name: MY_PLATFORM_CHANNEL  # 或使用富字典以获得更好的用户体验
    description: "要加入的频道"
    prompt: "频道"
    password: false
optional_env:
  - name: MY_PLATFORM_HOME_CHANNEL
    description: "用于定时任务推送的默认频道"
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
    """插件入口点 — 由 Hermes 插件系统调用。"""
    ctx.register_platform(
        name="my_platform",
        label="My Platform",
        adapter_factory=lambda cfg: MyPlatformAdapter(cfg),
        check_fn=check_requirements,
        validate_config=validate_config,
        required_env=["MY_PLATFORM_TOKEN"],
        install_hint="pip install my-platform-sdk",
        # 环境驱动的自动配置 — 在适配器构建之前，根据环境变量
        # 设置 PlatformConfig.extra 的初始值。参见下方“环境驱动的
        # 自动配置”部分。
        env_enablement_fn=_env_enablement,
        # 定时任务主频道推送支持。允许 deliver=my_platform 的定时
        # 任务无需编辑 cron/scheduler.py 即可路由。参见下方“定时
        # 任务推送”部分。
        cron_deliver_env_var="MY_PLATFORM_HOME_CHANNEL",
        # 平台特定的用户授权环境变量
        allowed_users_env="MY_PLATFORM_ALLOWED_USERS",
        allow_all_env="MY_PLATFORM_ALLOW_ALL_USERS",
        # 智能分块的消息长度限制（0 = 无限制）
        max_message_length=4000,
        # 注入系统提示词的 LLM 指导信息
        platform_hint=(
            "您正在通过 My Platform 进行聊天。"
            "它支持 Markdown 格式。"
        ),
        # 显示
        emoji="💬",
    )

    # 可选：注册平台特定的工具
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

或通过环境变量（适配器在 `__init__` 中读取它们）。

### 插件系统自动处理的内容

当您调用 `ctx.register_platform()` 时，以下集成点将为您处理 — 无需修改核心代码：

| 集成点 | 工作原理 |
|---|---|
| 网关适配器创建 | 注册表在内置 if/elif 链之前被检查 |
| 配置解析 | `Platform._missing_()` 接受任何平台名称 |
| 已连接平台验证 | 调用注册表的 `validate_config()` |
| 用户授权 | 检查 `allowed_users_env` / `allow_all_env` |
| 纯环境变量自动启用 | `env_enablement_fn` 为 `PlatformConfig.extra` + `home_channel` 设置初始值 |
| 定时任务推送 | `cron_deliver_env_var` 使 `deliver=<name>` 生效 |
| `hermes config` UI 条目 | `plugin.yaml` 中的 `requires_env` / `optional_env` 自动填充 |
| send_message 工具 | 通过实时网关适配器路由 |
| Webhook 跨平台推送 | 检查注册表中已知平台 |
| `/update` 命令访问 | `allow_update_command` 标志 |
| 频道目录 | 插件平台包含在枚举中 |
| 系统提示词提示 | `platform_hint` 注入 LLM 上下文 |
| 消息分块 | `max_message_length` 用于智能分割 |
| PII 脱敏 | `pii_safe` 标志 |
| `hermes status` | 显示带 `(plugin)` 标签的插件平台 |
| `hermes gateway setup` | 插件平台出现在设置菜单中 |
| `hermes tools` / `hermes skills` | 插件平台在平台特定配置中 |
| 令牌锁定（多配置文件） | 在您的 `connect()` 中使用 `acquire_scoped_lock()` |
| 孤立配置警告 | 当插件缺失时出现描述性日志 |

## 环境驱动的自动配置

大多数用户通过将环境变量放入 `~/.hermes/.env` 来设置平台，而不是编辑 `config.yaml`。`env_enablement_fn` 钩子允许您的插件在适配器构建**之前**提取这些环境变量，因此 `hermes gateway status`、`get_connected_platforms()` 和定时任务推送能够看到正确的状态，而无需实例化平台 SDK。

```python
def _env_enablement() -> dict | None:
    """根据环境变量为 PlatformConfig.extra 设置初始值。
    
    由平台注册表在 load_gateway_config() 期间调用。
    当平台未进行最低配置时返回 None — 调用者随后会跳过
    自动启用。返回一个字典以设置 extras 的初始值。
    
    特殊的 'home_channel' 键会被提取并成为 PlatformConfig
    上的 HomeChannel 数据类；所有其他键合并到
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

## 定时任务推送

要让 `deliver=my_platform` 的定时任务路由到配置的主频道，请将 `cron_deliver_env_var` 设置为保存默认聊天/房间/频道 ID 的环境变量名：

```python
ctx.register_platform(
    name="my_platform",
    ...
    cron_deliver_env_var="MY_PLATFORM_HOME_CHANNEL",
)
```

调度器在解析 `deliver=my_platform` 任务的主目标时读取此环境变量，并在 `_KNOWN_DELIVERY_PLATFORMS` 风格的检查中也将该平台视为有效的定时任务目标。如果您的 `env_enablement_fn` 设置了 `home_channel` 字典（见上文），则该设置优先 — `cron_deliver_env_var` 是在环境变量设置之前运行的定时任务的后备方案。

### 进程外定时任务推送

`cron_deliver_env_var` 使您的平台成为可识别的 `deliver=` 目标。为使定时任务在独立于网关的进程中运行时（即 `hermes cron run` 与 `hermes gateway` 分开）实际发送成功，请注册 `standalone_sender_fn`：

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

为什么需要此钩子：内置平台（Telegram、Discord、Slack 等）在 `tools/send_message_tool.py` 中提供了直接的 REST 帮助程序，因此定时任务可以在不与网关保持在同一进程的情况下进行推送。插件平台历来依赖 `_gateway_runner_ref()`，该函数在网关进程外部返回 `None`，因此如果没有 `standalone_sender_fn`，定时任务端的发送将失败，错误为 `No live adapter for platform '<name>'`。

该函数接收与实时适配器相同的 `pconfig` 和 `chat_id`，以及可选的 `thread_id`、`media_files` 和 `force_document` 关键字参数。返回 `{"success": True, "message_id": ...}` 被视为推送成功；返回 `{"error": "..."}` 会将消息显示在定时任务的 `delivery_errors` 中。函数内部引发的异常会被调度器捕获并报告为 `Plugin standalone send failed: <reason>`。参考实现位于 `plugins/platforms/{irc,teams,google_chat}/adapter.py`。

## 在 `hermes config` 中暴露环境变量

`hermes_cli/config.py` 在导入时扫描 `plugins/platforms/*/plugin.yaml`，并从 `requires_env` 和（可选的）`optional_env` 块中自动填充 `OPTIONAL_ENV_VARS`。使用富字典格式来提供正确的描述、提示、密码标志和 URL——CLI 设置界面会免费获取它们。

```yaml
# plugins/platforms/my_platform/plugin.yaml
name: my_platform-platform
label: 我的平台
kind: platform
version: 1.0.0
description: >
  用于 Hermes 智能体的我的平台网关适配器。
author: 你的名字
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
    description: "定时任务投递的默认频道（默认为 MY_PLATFORM_CHANNEL）"
    prompt: "主频道（或留空）"
    password: false
  - name: MY_PLATFORM_ALLOWED_USERS
    description: "允许与 bot 交谈的用户 ID（逗号分隔）"
    prompt: "允许的用户（逗号分隔）"
    password: false
```

**支持的字典键：** `name`（必需）、`description`、`prompt`、`url`、`password`（布尔值；省略时根据 `*_TOKEN` / `*_SECRET` / `*_KEY` / `*_PASSWORD` / `*_JSON` 后缀自动检测）、`category`（默认为 `"messaging"`）。

纯字符串条目（`- MY_PLATFORM_TOKEN`）仍然有效——它们会获得一个根据插件的 `label` 自动生成的通用描述。如果同一个变量的硬编码条目已存在于 `OPTIONAL_ENV_VARS` 中，它将优先（向后兼容）；plugin.yaml 形式作为后备。

## 平台特定的慢速 LLM 用户体验

某些平台存在约束，改变了慢速 LLM 响应的呈现方式：

- **LINE** 会发出一次性*回复令牌*，该令牌在收到事件后大约 60 秒后过期。使用该令牌回复是免费的；回退到按量计费的 Push API 则不是。如果 LLM 在截止时间前未完成，选择是“消耗付费的 Push 配额”或“在令牌过期前用它做点更聪明的事”。
- **WhatsApp** 会在 24 小时后将会话标记为不活动，之后只接受模板消息。
- **SMS** 没有输入指示器或渐进更新的概念——长响应看起来就像是 bot 离线了。

这些是基础 `BasePlatformAdapter` 无法预见的真实约束。插件表面有意留出空间，让适配器可以在不扩展 kwarg 列表的情况下，在基础输入循环之上叠加平台特定的用户体验。

### 模式：子类化 `_keep_typing` 以叠加进行中的用户体验

`BasePlatformAdapter._keep_typing` 是输入指示器的心跳——它在 LLM 生成时作为后台任务运行，并在响应送达时被取消。要在某个阈值叠加平台特定行为（例如在 45 秒时发送“仍在思考”气泡），请在你的适配器中覆盖 `_keep_typing`，与 `super()._keep_typing()` 一起调度你自己的任务，并在 `finally` 中将其清理掉：

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
            # 此处进行平台特定工作——对于 LINE，使用缓存的回复令牌
            # 发送一个模板按钮“获取答案”气泡，以便用户稍后可以通过
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

- **始终 `await super()._keep_typing(...)`。** 输入心跳本身很有用——不要替换它，要在其上进行叠加。
- **在 `finally` 中清理侧边任务。** 当 LLM 完成（或 `/stop` 取消运行）时，网关会取消输入任务。你的侧边任务也必须遵守该取消，否则它会残留并在响应已送达后触发。
- **与 `interrupt_session_activity` 配对**以解决当用户发出 `/stop` 时遗留的用户体验状态。对于 LINE，这意味着将回传缓存条目从 `PENDING` 转换为 `ERROR`，这样持久的“获取答案”按钮将显示“运行被中断”的消息，而不是循环。

### 模式：子类化 `send` 以通过缓存路由，而不是立即发送

如果你的慢速响应用户体验将响应缓存以供稍后检索（LINE 的回传流程），你的 `send` 覆盖需要识别三种模式：

1. **此聊天有待处理的回传** → 将响应缓存在 request_id 下，不发送任何可见内容。
2. **系统忙碌确认**（`⚡ 中断中`、`⏳ 排队中`、`⏩ 已转向`）→ 绕过缓存并可见地发送，以便用户看到网关对其输入的响应。
3. **正常响应** → 像往常一样通过回复令牌或 Push 发送。

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

`_SYSTEM_BYPASS_PREFIXES` 是网关自己的忙碌确认前缀（`⚡`、`⏳`、`⏩`、`💾`）。无论缓存的用户体验状态如何，始终让它们可见地通过。

### 何时适用此模式

在以下情况下使用输入循环覆盖方法：

- 平台的出站 API 有严格的时间窗口约束（一次性回复令牌、过期的粘性会话等）并且
- 在该平台上，*可见的进行中气泡*是可接受的用户体验。

在以下情况下使用更简单的 `slow_response_threshold = 0`（始终走 Push 路径）：

- 平台没有有意义的免费与付费区分，或者
- 用户社区更喜欢“加载中… 加载中… 完成”这种静默后响应，而不是交互式的中间气泡。

LINE 两者都支持：阈值默认为 45 秒用于免费回传获取，而 `LINE_SLOW_RESPONSE_THRESHOLD=0` 会回退到“始终 Push 后备”。

### 参考实现

查看 `plugins/platforms/line/adapter.py` 以获取完整的 LINE 回传实现——一个 `RequestCache` 状态机（`PENDING → READY → DELIVERED`，加上用于 `/stop` 的 `ERROR`），一个在阈值时触发模板按钮气泡的 `_keep_typing` 覆盖，一个通过缓存路由的 `send` 覆盖，以及一个解决孤立 PENDING 条目的 `interrupt_session_activity` 覆盖。

### 参考实现（插件路径）

查看仓库中的 `plugins/platforms/irc/` 以获取完整的工作示例——一个具有零外部依赖的完整异步 IRC 适配器。`plugins/platforms/teams/` 涵盖了 Bot Framework / 自适应卡片，`plugins/platforms/google_chat/` 涵盖了基于 OAuth 的 REST API，而 `plugins/platforms/line/` 涵盖了具有平台特定慢速 LLM 用户体验的 webhook 驱动消息 API。

---

## 分步检查清单（内置路径）

:::note
此检查清单用于将平台直接添加到 Hermes 核心代码库 — 通常由核心贡献者为官方支持的平台完成。社区/第三方平台应使用上面的[插件路径](#plugin-path-recommended)。
:::

### 1. 平台枚举

将你的平台添加到 `gateway/config.py` 中的 `Platform` 枚举：

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
    """如果依赖项可用则返回 True。"""
    return SOME_SDK_AVAILABLE

class NewPlatAdapter(BasePlatformAdapter):
    def __init__(self, config: PlatformConfig):
        super().__init__(config, Platform.NEWPLAT)
        # 从 config.extra 字典读取配置
        extra = config.extra or {}
        self._api_key = extra.get("api_key") or os.getenv("NEWPLAT_API_KEY", "")

    async def connect(self) -> bool:
        # 建立连接，开始轮询/webhook
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
2. **`load_gateway_config()`** — 添加令牌环境映射条目：`Platform.NEWPLAT: "NEWPLAT_TOKEN"`
3. **`_apply_env_overrides()`** — 将所有 `NEWPLAT_*` 环境变量映射到配置

### 4. 网关运行器 (`gateway/run.py`)

五个接触点：

1. **`_create_adapter()`** — 添加一个 `elif platform == Platform.NEWPLAT:` 分支
2. **`_is_user_authorized()` allowed_users 映射** — `Platform.NEWPLAT: "NEWPLAT_ALLOWED_USERS"`
3. **`_is_user_authorized()` allow_all 映射** — `Platform.NEWPLAT: "NEWPLAT_ALLOW_ALL_USERS"`
4. **早期环境检查 `_any_allowlist` 元组** — 添加 `"NEWPLAT_ALLOWED_USERS"`
5. **早期环境检查 `_allow_all` 元组** — 添加 `"NEWPLAT_ALLOW_ALL_USERS"`
6. **`_UPDATE_ALLOWED_PLATFORMS` 冻结集合** — 添加 `Platform.NEWPLAT`

### 5. 跨平台传递

1. **`gateway/platforms/webhook.py`** — 将 `"newplat"` 添加到传递类型元组
2. **`cron/scheduler.py`** — 添加到 `_KNOWN_DELIVERY_PLATFORMS` 冻结集合和 `_deliver_result()` 平台映射

### 6. CLI 集成

1. **`hermes_cli/config.py`** — 将所有 `NEWPLAT_*` 变量添加到 `_EXTRA_ENV_KEYS`
2. **`hermes_cli/gateway.py`** — 将条目添加到 `_PLATFORMS` 列表，包含键、标签、表情符号、令牌变量、设置说明和变量
3. **`hermes_cli/platforms.py`** — 添加 `PlatformInfo` 条目，包含标签和默认工具集（用于 `skills_config` 和 `tools_config` TUI）
4. **`hermes_cli/setup.py`** — 添加 `_setup_newplat()` 函数（可以委托给 `gateway.py`）并将元组添加到消息平台列表
5. **`hermes_cli/status.py`** — 添加平台检测条目：`"NewPlat": ("NEWPLAT_TOKEN", "NEWPLAT_HOME_CHANNEL")`
6. **`hermes_cli/dump.py`** — 将 `"newplat": "NEWPLAT_TOKEN"` 添加到平台检测字典

### 7. 工具

1. **`tools/send_message_tool.py`** — 将 `"newplat": Platform.NEWPLAT` 添加到平台映射
2. **`tools/cronjob_tools.py`** — 将 `newplat` 添加到传递目标描述字符串

### 8. 工具集

1. **`toolsets.py`** — 添加 `"hermes-newplat"` 工具集定义，包含 `_HERMES_CORE_TOOLS`
2. **`toolsets.py`** — 将 `"hermes-newplat"` 添加到 `"hermes-gateway"` includes 列表

### 9. 可选：平台提示

**`agent/prompt_builder.py`** — 如果你的平台有特定的渲染限制（无 markdown、消息长度限制等），请在 `_PLATFORM_HINTS` 字典中添加一个条目。这会将特定平台的指导注入到系统提示中：

```python
_PLATFORM_HINTS = {
    # ...
    "newplat": (
        "You are chatting via NewPlat. It supports markdown formatting "
        "but has a 4000-character message limit."
    ),
}
```

并非所有平台都需要提示 — 只有在智能体行为应有所不同时才添加。

### 10. 测试

创建 `tests/gateway/test_newplat.py`，覆盖以下内容：

- 从配置构造适配器
- 消息事件构建
- 发送方法（模拟外部 API）
- 平台特定功能（加密、路由等）

### 11. 文档

| 文件 | 需要添加的内容 |
|------|----------------|
| `website/docs/user-guide/messaging/newplat.md` | 完整的平台设置页面 |
| `website/docs/user-guide/messaging/index.md` | 平台比较表、架构图、工具集表、安全部分、下一步链接 |
| `website/docs/reference/environment-variables.md` | 所有 NEWPLAT_* 环境变量 |
| `website/docs/reference/toolsets-reference.md` | hermes-newplat 工具集 |
| `website/docs/integrations/index.md` | 平台链接 |
| `website/sidebars.ts` | 文档页面的侧边栏条目 |
| `website/docs/developer-guide/architecture.md` | 适配器数量 + 列表 |
| `website/docs/developer-guide/gateway-internals.md` | 适配器文件列表 |
## 一致性审计

在将新平台 PR 标记为完成之前，针对一个成熟的平台运行一致性审计：

```bash
# 查找每个提及参考平台的 .py 文件
search_files "bluebubbles" output_mode="files_only" file_glob="*.py"

# 查找每个提及新平台的 .py 文件
search_files "newplat" output_mode="files_only" file_glob="*.py"

# 第一组中存在但第二组中不存在的任何文件都是潜在的差距
```

对 `.md` 和 `.ts` 文件重复此操作。调查每个差距 — 它是平台枚举（需要更新）还是特定平台引用（跳过）？

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

### 回调/Webhook 适配器

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

对于有严格响应期限的平台（例如企业微信的 5 秒限制），始终立即确认，并在之后通过 API 主动传递智能体的回复。智能体会话运行时间为 3-30 分钟 — 在回调响应窗口内进行内联回复是不可行的。

### 令牌锁

如果适配器使用唯一凭据保持持久连接，请添加一个作用域锁以防止两个配置文件使用相同的凭据：

```python
from gateway.status import acquire_scoped_lock, release_scoped_lock

async def connect(self):
    if not acquire_scoped_lock("newplat", self._token):
        logger.error("Token already in use by another profile")
        return False
    # ... 连接

async def disconnect(self):
    release_scoped_lock("newplat", self._token)
```

## 参考实现

| 适配器 | 模式 | 复杂度 | 适合参考 |
|--------|------|--------|----------|
| `bluebubbles.py` | REST + webhook | 中等 | 简单的 REST API 集成 |
| `weixin.py` | 长轮询 + CDN | 高 | 媒体处理、加密 |
| `wecom_callback.py` | 回调/webhook | 中等 | HTTP 服务器、AES 加密、多应用 |
| `telegram.py` | 长轮询 + Bot API | 高 | 全功能适配器，支持群组、主题 |