---
sidebar_position: 9
---

# 添加平台适配器

本指南介绍如何为 Hermes 网关添加新的消息平台。平台适配器将 Hermes 连接到外部消息服务（如 Telegram、Discord、WeCom 等），以便用户可以通过该服务与智能体交互。

:::tip
添加平台有两种方式：
- **插件**（推荐用于社区/第三方）：将插件目录放入 `~/.hermes/plugins/` — 无需修改核心代码。请参见下面的[插件路径（推荐）](#plugin-path-recommended)。
- **内置**：修改代码、配置和文档中的 20 多个文件。请参见下面的[分步清单](#step-by-step-checklist)。
:::

## 架构概览

```
用户 ↔ 消息平台 ↔ 平台适配器 ↔ 网关运行器 ↔ 智能体
```

每个适配器都继承自 `gateway/platforms/base.py` 中的 `BasePlatformAdapter` 并实现以下方法：

- **`connect()`** — 建立连接（WebSocket、长轮询、HTTP 服务器等）*（抽象方法）*
- **`disconnect()`** — 清理并关闭连接 *（抽象方法）*
- **`send()`** — 向聊天发送文本消息 *（抽象方法）*
- **`send_typing()`** — 显示正在输入指示器（可选重写）
- **`get_chat_info()`** — 返回聊天元数据（可选重写）

入站消息由适配器接收并通过 `self.handle_message(event)` 转发，基类会将其路由到网关运行器。

## 插件路径（推荐）

插件系统允许您在不修改任何核心 Hermes 代码的情况下添加平台适配器。您的插件是一个包含两个文件的目录：

```
~/.hermes/plugins/my-platform/
  PLUGIN.yaml      # 插件元数据
  adapter.py       # 适配器类 + register() 入口点
```

### PLUGIN.yaml

插件元数据。`requires_env` 和 `optional_env` 块会自动填充 `hermes config` UI 条目（参见下面的[在 hermes config 中展示环境变量](#在-hermes-config-中展示环境变量)）。

```yaml
name: my-platform
label: 我的平台
kind: platform
version: 1.0.0
description: 我的自定义消息平台适配器
author: 您的姓名
requires_env:
  - MY_PLATFORM_TOKEN          # 纯字符串即可
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
    """插件入口点 — 由 Hermes 插件系统调用。"""
    ctx.register_platform(
        name="my_platform",
        label="我的平台",
        adapter_factory=lambda cfg: MyPlatformAdapter(cfg),
        check_fn=check_requirements,
        validate_config=validate_config,
        required_env=["MY_PLATFORM_TOKEN"],
        install_hint="pip install my-platform-sdk",
        # 环境变量驱动的自动配置 — 在构建适配器之前，从环境变量填充 PlatformConfig.extra。
        # 参见下面的“环境变量驱动的自动配置”部分。
        env_enablement_fn=_env_enablement,
        # 定时任务主频道投递支持。允许 deliver=my_platform 定时任务路由，
        # 而无需编辑 cron/scheduler.py。参见下面的“定时任务投递”部分。
        cron_deliver_env_var="MY_PLATFORM_HOME_CHANNEL",
        # 每个平台特定的用户授权环境变量
        allowed_users_env="MY_PLATFORM_ALLOWED_USERS",
        allow_all_env="MY_PLATFORM_ALLOW_ALL_USERS",
        # 智能分块的消息长度限制（0 = 无限制）
        max_message_length=4000,
        # 注入到系统提示中的 LLM 指导
        platform_hint=(
            "您正在通过我的平台进行聊天。"
            "它支持 Markdown 格式化。"
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

当您调用 `ctx.register_platform()` 时，以下集成点会自动为您处理 — 无需修改核心代码：

| 集成点 | 工作原理 |
|---|---|
| 网关适配器创建 | 在内置 if/elif 链之前检查注册表 |
| 配置解析 | `Platform._missing_()` 接受任何平台名称 |
| 已连接平台验证 | 调用注册表 `validate_config()` |
| 用户授权 | 检查 `allowed_users_env` / `allow_all_env` |
| 仅环境变量自动启用 | `env_enablement_fn` 填充 `PlatformConfig.extra` + `home_channel` |
| 定时任务投递 | `cron_deliver_env_var` 使 `deliver=<name>` 生效 |
| `hermes config` UI 条目 | `plugin.yaml` 中的 `requires_env` / `optional_env` 自动填充 |
| send_message 工具 | 通过活动的网关适配器路由 |
| Webhook 跨平台投递 | 检查注册表以识别已知平台 |
| `/update` 命令访问 | `allow_update_command` 标志 |
| 频道目录 | 插件平台包含在枚举中 |
| 系统提示提示 | `platform_hint` 注入到 LLM 上下文 |
| 消息分块 | `max_message_length` 用于智能拆分 |
| PII 脱敏 | `pii_safe` 标志 |
| `hermes status` | 显示带有 `(plugin)` 标签的插件平台 |
| `hermes gateway setup` | 插件平台出现在设置菜单中 |
| `hermes tools` / `hermes skills` | 插件平台出现在每个平台的配置中 |
| 令牌锁定（多配置文件） | 在您的 `connect()` 中使用 `acquire_scoped_lock()` |
| 孤立配置警告 | 当插件缺失时，记录描述性日志 |

## 环境变量驱动的自动配置

大多数用户通过在 `~/.hermes/.env` 中放置环境变量来设置平台，而不是编辑 `config.yaml`。`env_enablement_fn` 钩子允许您的插件在适配器构建**之前**获取这些环境变量，因此 `hermes gateway status`、`get_connected_platforms()` 和定时任务投递可以看到正确的状态，而无需实例化平台 SDK。

```python
def _env_enablement() -> dict | None:
    """从环境变量填充 PlatformConfig.extra。

    在 load_gateway_config() 期间由平台注册表调用。
    当平台未进行最低限度配置时，返回 None — 调用者随后跳过自动启用。
    返回一个字典以填充 extras。

    特殊的 'home_channel' 键会被提取并成为 PlatformConfig 上的一个适当的 HomeChannel 数据类；
    其他所有键都会合并到 PlatformConfig.extra 中。
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
        label="我的平台",
        adapter_factory=lambda cfg: MyPlatformAdapter(cfg),
        check_fn=check_requirements,
        validate_config=validate_config,
        env_enablement_fn=_env_enablement,
        # ... 其他字段
    )
```

## 定时任务投递

要让 `deliver=my_platform` 定时任务路由到已配置的主频道，请将 `cron_deliver_env_var` 设置为保存默认聊天/房间/频道 ID 的环境变量名称：

```python
ctx.register_platform(
    name="my_platform",
    ...
    cron_deliver_env_var="MY_PLATFORM_HOME_CHANNEL",
)
```

调度器在解析 `deliver=my_platform` 任务的主目标时读取此环境变量，并在 `_KNOWN_DELIVERY_PLATFORMS` 风格的检查中将该平台视为有效的定时任务目标。如果您的 `env_enablement_fn` 填充了一个 `home_channel` 字典（参见上文），则该字典优先 — `cron_deliver_env_var` 是环境变量填充之前运行的定时任务的回退选项。

## 在 `hermes config` 中展示环境变量

`hermes_cli/config.py` 在导入时扫描 `plugins/platforms/*/plugin.yaml`，并自动从 `requires_env` 和（可选的）`optional_env` 块填充 `OPTIONAL_ENV_VARS`。使用富字典形式可以提供适当的描述、提示、密码标志和 URL — CLI 设置 UI 会免费获取它们。

```yaml
# plugins/platforms/my_platform/plugin.yaml
name: my_platform-platform
label: 我的平台
kind: platform
version: 1.0.0
description: >
  Hermes 智能体的我的平台网关适配器。
author: 您的姓名
requires_env:
  - name: MY_PLATFORM_TOKEN
    description: "来自我的平台控制台的机器人 API 令牌"
    prompt: "我的平台机器人令牌"
    url: "https://my-platform.example.com/bots"
    password: true
  - name: MY_PLATFORM_CHANNEL
    description: "要加入的频道（例如 #hermes）"
    prompt: "频道"
    password: false
optional_env:
  - name: MY_PLATFORM_HOME_CHANNEL
    description: "用于定时任务投递的默认频道（默认为 MY_PLATFORM_CHANNEL）"
    prompt: "主频道（或留空）"
    password: false
  - name: MY_PLATFORM_ALLOWED_USERS
    description: "允许与机器人对话的逗号分隔的用户 ID"
    prompt: "允许的用户（逗号分隔）"
    password: false
```

**支持的字典键：** `name`（必需）、`description`、`prompt`、`url`、`password`（布尔值；当省略时，会根据 `*_TOKEN` / `*_SECRET` / `*_KEY` / `*_PASSWORD` / `*_JSON` 后缀自动检测）、`category`（默认为 `"messaging"`）。

纯字符串条目（`- MY_PLATFORM_TOKEN`）仍然有效 — 它们会从插件的 `label` 自动派生一个通用描述。如果 `OPTIONAL_ENV_VARS` 中已经存在相同变量的硬编码条目，则该条目优先（向后兼容）；plugin.yaml 形式作为回退。

### 参考实现

请参阅仓库中的 `plugins/platforms/irc/` 以获取完整的工作示例 — 一个完全异步的 IRC 适配器，无需外部依赖。

---

## 分步清单（内置路径）

:::note
此清单适用于将平台直接添加到 Hermes 核心代码库中——通常由核心贡献者为官方支持的平台执行。社区/第三方平台应使用上述[插件路径](#plugin-path-recommended)。
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
    """如果依赖项可用，则返回 True。"""
    return SOME_SDK_AVAILABLE

class NewPlatAdapter(BasePlatformAdapter):
    def __init__(self, config: PlatformConfig):
        super().__init__(config, Platform.NEWPLAT)
        # 从 config.extra 字典读取配置
        extra = config.extra or {}
        self._api_key = extra.get("api_key") or os.getenv("NEWPLAT_API_KEY", "")

    async def connect(self) -> bool:
        # 建立连接，开始轮询/接收 Webhook
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

1. **`get_connected_platforms()`** — 添加对你平台所需凭据的检查
2. **`load_gateway_config()`** — 添加令牌环境变量映射项：`Platform.NEWPLAT: "NEWPLAT_TOKEN"`
3. **`_apply_env_overrides()`** — 将所有 `NEWPLAT_*` 环境变量映射到配置

### 4. 网关运行器 (`gateway/run.py`)

五个接触点：

1. **`_create_adapter()`** — 添加一个 `elif platform == Platform.NEWPLAT:` 分支
2. **`_is_user_authorized()` allowed_users 映射** — `Platform.NEWPLAT: "NEWPLAT_ALLOWED_USERS"`
3. **`_is_user_authorized()` allow_all 映射** — `Platform.NEWPLAT: "NEWPLAT_ALLOW_ALL_USERS"`
4. **早期环境变量检查 `_any_allowlist` 元组** — 添加 `"NEWPLAT_ALLOWED_USERS"`
5. **早期环境变量检查 `_allow_all` 元组** — 添加 `"NEWPLAT_ALLOW_ALL_USERS"`
6. **`_UPDATE_ALLOWED_PLATFORMS` 冻结集合** — 添加 `Platform.NEWPLAT`

### 5. 跨平台投递

1. **`gateway/platforms/webhook.py`** — 将 `"newplat"` 添加到投递类型元组
2. **`cron/scheduler.py`** — 添加到 `_KNOWN_DELIVERY_PLATFORMS` 冻结集合和 `_deliver_result()` 平台映射

### 6. CLI 集成

1. **`hermes_cli/config.py`** — 将所有 `NEWPLAT_*` 变量添加到 `_EXTRA_ENV_KEYS`
2. **`hermes_cli/gateway.py`** — 在 `_PLATFORMS` 列表中添加条目，包含键、标签、表情符号、令牌变量、设置说明和变量
3. **`hermes_cli/platforms.py`** — 添加 `PlatformInfo` 条目，包含标签和默认工具集（由 `skills_config` 和 `tools_config` TUI 使用）
4. **`hermes_cli/setup.py`** — 添加 `_setup_newplat()` 函数（可委托给 `gateway.py`）并将元组添加到消息平台列表
5. **`hermes_cli/status.py`** — 添加平台检测条目：`"NewPlat": ("NEWPLAT_TOKEN", "NEWPLAT_HOME_CHANNEL")`
6. **`hermes_cli/dump.py`** — 在平台检测字典中添加 `"newplat": "NEWPLAT_TOKEN"`

### 7. 工具

1. **`tools/send_message_tool.py`** — 在平台映射中添加 `"newplat": Platform.NEWPLAT`
2. **`tools/cronjob_tools.py`** — 在投递目标描述字符串中添加 `newplat`

### 8. 工具集

1. **`toolsets.py`** — 添加 `"hermes-newplat"` 工具集定义，包含 `_HERMES_CORE_TOOLS`
2. **`toolsets.py`** — 将 `"hermes-newplat"` 添加到 `"hermes-gateway"` 包含列表中

### 9. 可选：平台提示

**`agent/prompt_builder.py`** — 如果你的平台有特定的渲染限制（无 Markdown、消息长度限制等），请在 `_PLATFORM_HINTS` 字典中添加一个条目。这会将特定于平台的指导注入到系统提示中：

```python
_PLATFORM_HINTS = {
    # ...
    "newplat": (
        "你正在通过 NewPlat 聊天。它支持 Markdown 格式，"
        "但消息长度限制为 4000 个字符。"
    ),
}
```

并非所有平台都需要提示——仅在智能体的行为应有所不同时才添加。

### 10. 测试

创建 `tests/gateway/test_newplat.py`，覆盖以下内容：

- 从配置构建适配器
- 构建消息事件
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

在将新平台 PR 标记为完成之前，请针对一个已建立的平台运行对等审计：

```bash
# 查找所有提及参考平台的 .py 文件
search_files "bluebubbles" output_mode="files_only" file_glob="*.py"

# 查找所有提及新平台的 .py 文件
search_files "newplat" output_mode="files_only" file_glob="*.py"

# 第一个集合中存在但第二个集合中不存在的任何文件都是潜在缺口
```

对 `.md` 和 `.ts` 文件重复此操作。调查每个缺口——它是平台枚举（需要更新）还是特定于平台的引用（跳过）？

## 常见模式

### 长轮询适配器

如果你的适配器使用长轮询（如 Telegram 或 Weixin），请使用轮询循环任务：

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

如果平台将消息推送到你的端点（如 WeCom 回调），请运行一个 HTTP 服务器：

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

对于具有严格响应截止日期的平台（例如 WeCom 的 5 秒限制），请始终立即确认，并通过 API 主动投递智能体的回复。智能体会话运行 3–30 分钟——在回调响应窗口内进行内联回复是不可行的。

### 令牌锁

如果适配器持有具有唯一凭据的持久连接，请添加一个作用域锁，以防止两个配置文件使用相同的凭据：

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

| 适配器 | 模式 | 复杂度 | 良好参考 |
|---------|---------|------------|-------------------|
| `bluebubbles.py` | REST + Webhook | 中等 | 简单 REST API 集成 |
| `weixin.py` | 长轮询 + CDN | 高 | 媒体处理、加密 |
| `wecom_callback.py` | 回调/Webhook | 中等 | HTTP 服务器、AES 加密、多应用 |
| `telegram.py` | 长轮询 + Bot API | 高 | 具有群组、线程的完整功能适配器 |