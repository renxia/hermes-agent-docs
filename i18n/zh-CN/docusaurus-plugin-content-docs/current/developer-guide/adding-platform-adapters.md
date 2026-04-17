---
sidebar_position: 9
---

# 添加平台适配器

本指南介绍了如何在 Hermes 网关中添加新的消息平台。平台适配器将 Hermes 连接到外部消息服务（如 Telegram、Discord、WeCom 等），从而使用户能够通过该服务与智能体进行交互。

:::tip
添加平台适配器涉及代码、配置和文档中 20 多个文件。请将本指南作为检查清单使用——适配器文件本身通常只占工作量的 40%。
:::

## 架构概述

```
用户 ↔ 消息平台 ↔ 平台适配器 ↔ 网关运行器 ↔ AIAgent
```

每个适配器都扩展自 `gateway/platforms/base.py` 中的 `BasePlatformAdapter`，并实现了以下方法：

- **`connect()`** — 建立连接（WebSocket、长轮询、HTTP 服务器等）
- **`disconnect()`** — 清理关闭
- **`send()`** — 向聊天发送文本消息
- **`send_typing()`** — 显示输入状态（可选）
- **`get_chat_info()`** — 返回聊天元数据

入站消息由适配器接收，并通过 `self.handle_message(event)` 转发给网关运行器。

## 循序渐进的检查清单

### 1. 平台枚举 (Platform Enum)

在 `gateway/config.py` 的 `Platform` 枚举中添加您的平台：

```python
class Platform(str, Enum):
    # ... existing platforms ...
    NEWPLAT = "newplat"
```

### 2. 适配器文件 (Adapter File)

创建 `gateway/platforms/newplat.py`：

```python
from gateway.config import Platform, PlatformConfig
from gateway.platforms.base import (
    BasePlatformAdapter, MessageEvent, MessageType, SendResult,
)

def check_newplat_requirements() -> bool:
    """Return True if dependencies are available."""
    return SOME_SDK_AVAILABLE

class NewPlatAdapter(BasePlatformAdapter):
    def __init__(self, config: PlatformConfig):
        super().__init__(config, Platform.NEWPLAT)
        # Read config from config.extra dict
        extra = config.extra or {}
        self._api_key = extra.get("api_key") or os.getenv("NEWPLAT_API_KEY", "")

    async def connect(self) -> bool:
        # Set up connection, start polling/webhook
        self._mark_connected()
        return True

    async def disconnect(self) -> None:
        self._running = False
        self._mark_disconnected()

    async def send(self, chat_id, content, reply_to=None, metadata=None):
        # Send message via platform API
        return SendResult(success=True, message_id="...")

    async def get_chat_info(self, chat_id):
        return {"name": chat_id, "type": "dm"}
```

对于入站消息，构建一个 `MessageEvent` 并调用 `self.handle_message(event)`：

```python
source = self.build_source(
    chat_id=chat_id,
    chat_name=name,
    chat_type="dm",  # or "group"
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

三个修改点：

1. **`get_connected_platforms()`** — 添加检查您的平台所需的凭证
2. **`load_gateway_config()`** — 添加令牌环境变量映射：`Platform.NEWPLAT: "NEWPLAT_TOKEN"`
3. **`_apply_env_overrides()`** — 将所有 `NEWPLAT_*` 环境变量映射到配置

### 4. 网关运行器 (`gateway/run.py`)

五个修改点：

1. **`_create_adapter()`** — 添加 `elif platform == Platform.NEWPLAT:` 分支
2. **`_is_user_authorized()` allowed_users 映射** — `Platform.NEWPLAT: "NEWPLAT_ALLOWED_USERS"`
3. **`_is_user_authorized()` allow_all 映射** — `Platform.NEWPLAT: "NEWPLAT_ALLOW_ALL_USERS"`
4. **早期环境变量检查 `_any_allowlist` 元组** — 添加 `"NEWPLAT_ALLOWED_USERS"`
5. **早期环境变量检查 `_allow_all` 元组** — 添加 `"NEWPLAT_ALLOW_ALL_USERS"`
6. **`_UPDATE_ALLOWED_PLATFORMS` frozenset** — 添加 `Platform.NEWPLAT`

### 5. 跨平台投递

1. **`gateway/platforms/webhook.py`** — 将 `"newplat"` 添加到投递类型元组中
2. **`cron/scheduler.py`** — 将其添加到 `_KNOWN_DELIVERY_PLATFORMS` frozenset 和 `_deliver_result()` 平台映射中

### 6. CLI 集成

1. **`hermes_cli/config.py`** — 将所有 `NEWPLAT_*` 变量添加到 `_EXTRA_ENV_KEYS`
2. **`hermes_cli/gateway.py`** — 在 `_PLATFORMS` 列表中添加条目，包含 key、label、emoji、token_var、setup_instructions 和 vars
3. **`hermes_cli/platforms.py`** — 添加 `PlatformInfo` 条目，包含 label 和 default_toolset（用于 `skills_config` 和 `tools_config` TUI）
4. **`hermes_cli/setup.py`** — 添加 `_setup_newplat()` 函数（可以委托给 `gateway.py`）并将元组添加到消息平台列表中
5. **`hermes_cli/status.py`** — 添加平台检测条目：`"NewPlat": ("NEWPLAT_TOKEN", "NEWPLAT_HOME_CHANNEL")`
6. **`hermes_cli/dump.py`** — 将 `"newplat": "NEWPLAT_TOKEN"` 添加到平台检测字典中

### 7. 工具 (Tools)

1. **`tools/send_message_tool.py`** — 在平台映射中添加 `"newplat": Platform.NEWPLAT`
2. **`tools/cronjob_tools.py`** — 将 `newplat` 添加到投递目标描述字符串中

### 8. 工具集 (Toolsets)

1. **`toolsets.py`** — 添加包含 `_HERMES_CORE_TOOLS` 的 `"hermes-newplat"` 工具集定义
2. **`toolsets.py`** — 将 `"hermes-newplat"` 添加到 `"hermes-gateway"` includes 列表中

### 9. 可选：平台提示 (Platform Hints)

**`agent/prompt_builder.py`** — 如果您的平台有特定的渲染限制（无 Markdown、消息长度限制等），请向 `_PLATFORM_HINTS` 字典添加一个条目。这会将平台特定的指导注入到系统提示中：

```python
_PLATFORM_HINTS = {
    # ...
    "newplat": (
        "您正在通过 NewPlat 聊天。它支持 Markdown 格式化 "
        "但有 4000 个字符的消息限制。"
    ),
}
```

并非所有平台都需要提示——只有当智能体的行为需要不同时才添加。

### 10. 测试 (Tests)

创建 `tests/gateway/test_newplat.py`，涵盖以下内容：

- 从配置构建适配器
- 消息事件构建
- 发送方法（模拟外部 API）
- 平台特定功能（加密、路由等）

### 11. 文档 (Documentation)

| 文件 | 需添加内容 |
|------|-------------|
| `website/docs/user-guide/messaging/newplat.md` | 完整的平台设置页面 |
| `website/docs/user-guide/messaging/index.md` | 平台比较表、架构图、工具集表、安全部分、下一步链接 |
| `website/docs/reference/environment-variables.md` | 所有 NEWPLAT_* 环境变量 |
| `website/docs/reference/toolsets-reference.md` | hermes-newplat 工具集 |
| `website/docs/integrations/index.md` | 平台链接 |
| `website/sidebars.ts` | 文档页面的侧边栏条目 |
| `website/docs/developer-guide/architecture.md` | 适配器计数 + 列表 |
| `website/docs/developer-guide/gateway-internals.md` | 适配器文件列表 |

## 对齐审计 (Parity Audit)

在将新的平台 PR 标记为完成之前，请针对一个已建立的平台运行对齐审计：

```bash
# 查找提及参考平台的每个 .py 文件
search_files "bluebubbles" output_mode="files_only" file_glob="*.py"

# 查找提及新平台的每个 .py 文件
search_files "newplat" output_mode="files_only" file_glob="*.py"

# 第一组中有但第二组没有的文件是潜在的缺失点
```

对 `.md` 和 `.ts` 文件重复此操作。调查每个缺失点——它是平台枚举（需要更新）还是平台特定参考（跳过）？

## 常见模式 (Common Patterns)

### 长轮询适配器 (Long-Poll Adapters)

如果您的适配器使用长轮询（如 Telegram 或 Weixin），请使用轮询循环任务：

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

### 回调/Webhook 适配器 (Callback/Webhook Adapters)

如果平台将消息推送到您的端点（如 WeCom Callback），请运行一个 HTTP 服务器：

```python
async def connect(self):
    self._app = web.Application()
    self._app.router.add_post("/callback", self._handle_callback)
    # ... start aiohttp server
    self._mark_connected()

async def _handle_callback(self, request):
    event = self._build_event(await request.text())
    await self._message_queue.put(event)
    return web.Response(text="success")  # 立即确认
```

对于具有严格响应时限的平台（例如 WeCom 的 5 秒限制），始终立即确认，并稍后通过 API 主动投递智能体的回复。智能体会话持续 3-30 分钟——在回调响应窗口内进行内联回复是不可行的。

### 令牌锁 (Token Locks)

如果适配器持有一个具有唯一凭证的持久连接，请添加一个作用域锁以防止两个配置文件使用相同的凭证：

```python
from gateway.status import acquire_scoped_lock, release_scoped_lock

async def connect(self):
    if not acquire_scoped_lock("newplat", self._token):
        logger.error("Token already in use by another profile")
        return False
    # ... connect

async def disconnect(self):
    release_scoped_lock("newplat", self._token)
```

## 参考实现 (Reference Implementations)

| 适配器 | 模式 | 复杂度 | 适用于参考 |
|---------|---------|------------|-------------------|
| `bluebubbles.py` | REST + webhook | 中等 | 简单的 REST API 集成 |
| `weixin.py` | 长轮询 + CDN | 高 | 媒体处理、加密 |
| `wecom_callback.py` | 回调/webhook | 中等 | HTTP 服务器、AES 加密、多应用 |
| `telegram.py` | 长轮询 + Bot API | 高 | 具有群组、线程的全功能适配器 |