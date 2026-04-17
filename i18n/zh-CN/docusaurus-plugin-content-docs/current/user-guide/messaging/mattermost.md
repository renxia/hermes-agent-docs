---
sidebar_position: 8
title: "Mattermost"
description: "将 Hermes Agent 设置为 Mattermost 机器人"
---

# Mattermost 设置

Hermes Agent 作为机器人集成到 Mattermost 中，让您可以通过私信或团队频道与您的 AI 助手聊天。Mattermost 是一个自托管的开源 Slack 替代品——您在自己的基础设施上运行它，从而完全控制您的数据。该机器人通过 Mattermost 的 REST API (v4) 和 WebSocket 连接以获取实时事件，通过 Hermes Agent 管道处理消息（包括工具使用、记忆和推理），并实时响应。它支持文本、文件附件、图像和斜杠命令。

无需外部 Mattermost 库——适配器使用 `aiohttp`，这已经是 Hermes 的依赖项。

在设置之前，这是大多数人想知道的部分：一旦 Hermes 进入您的 Mattermost 实例，它会如何表现。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| **私信 (DMs)** | Hermes 会回复每一条消息。无需 `@提及`。每条私信都有自己的会话。 |
| **公开/私有频道** | 当您 `@提及` 它时，Hermes 会回复。如果没有提及，Hermes 会忽略该消息。 |
| **主题串 (Threads)** | 如果设置了 `MATTERMOST_REPLY_MODE=thread`，Hermes 会在您消息下回复一个主题串。主题串的上下文与父频道隔离。 |
| **包含多个用户的共享频道** | 默认情况下，Hermes 在频道内为每个用户隔离会话历史记录。同一频道中的两人对话，除非您明确禁用，否则不会共享一个完整的记录。 |

:::tip
如果您希望 Hermes 以主题串对话（嵌套在您的原始消息下）的方式回复，请设置 `MATTERMOST_REPLY_MODE=thread`。默认值是 `off`，这会在频道中发送扁平化的消息。
:::

### Mattermost 中的会话模型

默认情况下：

- 每个私信都有自己的会话
- 每个主题串都有自己的会话命名空间
- 共享频道中的每个用户都在该频道内拥有自己的会话

这由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

只有当您明确希望整个频道共享一个对话时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话对于协作频道很有用，但也意味着：

- 用户共享上下文增长和 token 成本
- 一个人的长时间、工具密集型任务可能会使其他所有人的上下文膨胀
- 一个人的进行中的运行可能会打断同一频道中另一个人后续的跟进操作

本指南将引导您完成完整的设置过程——从 Mattermost 上创建机器人到发送您的第一条消息。

## 步骤 1：启用机器人账户

在您创建机器人之前，必须在 Mattermost 服务器上启用机器人账户。

1. 以 **系统管理员** 身份登录 Mattermost。
2. 导航到 **系统控制台** → **集成** → **机器人账户**。
3. 将 **启用机器人账户创建** 设置为 **true**。
4. 点击 **保存**。

:::info
如果您没有系统管理员权限，请要求您的 Mattermost 管理员启用机器人账户并为您创建一个。
:::

## 步骤 2：创建机器人账户

1. 在 Mattermost 中，点击 **☰** 菜单（左上角）→ **集成** → **机器人账户**。
2. 点击 **添加机器人账户**。
3. 填写详细信息：
   - **用户名**: 例如 `hermes`
   - **显示名称**: 例如 `Hermes Agent`
   - **描述**: 可选
   - **角色**: `成员` 即可
4. 点击 **创建机器人账户**。
5. Mattermost 将显示 **机器人令牌**。**请立即复制它。**

:::warning[令牌仅显示一次]
机器人令牌在创建机器人账户时只显示一次。如果您丢失了它，您需要从机器人账户设置中重新生成它。切勿公开分享您的令牌或将其提交到 Git——任何拥有此令牌的人都对该机器人拥有完全控制权。
:::

将令牌存储在安全的地方（例如密码管理器）。您在第 5 步需要它。

:::tip
您也可以使用**个人访问令牌**而不是机器人账户。前往 **个人资料** → **安全** → **个人访问令牌** → **创建令牌**。如果您希望 Hermes 以您自己的用户身份而不是单独的机器人用户身份发布消息，这非常有用。
:::

## 步骤 3：将机器人添加到频道

机器人必须是您希望它回复的任何频道的成员：

1. 打开您希望机器人所在的频道。
2. 点击频道名称 → **添加成员**。
3. 搜索您的机器人用户名（例如 `hermes`）并添加它。

对于私信，只需与机器人开启一个私信即可——它将能够立即回复。

## 步骤 4：查找您的 Mattermost 用户 ID

Hermes Agent 使用您的 Mattermost 用户 ID 来控制谁可以与机器人互动。要查找它：

1. 点击您的 **头像**（左上角）→ **个人资料**。
2. 您的用户 ID 显示在个人资料对话框中——点击它进行复制。

您的用户 ID 是一个 26 个字符的字母数字字符串，例如 `3uo8dkh1p7g1mfk49ear5fzs5c`。

:::warning
您的用户 ID **不是**您的用户名。用户名是 `@` 后面的内容（例如 `@alice`）。用户 ID 是 Mattermost 内部使用的长字母数字标识符。
:::

**替代方法**: 您还可以通过 API 获取您的用户 ID：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-mattermost-server/api/v4/users/me | jq .id
```

:::tip
要获取**频道 ID**：点击频道名称 → **查看信息**。频道 ID 显示在信息面板中。如果您想手动设置主频道，您需要它。
:::

## 步骤 5：配置 Hermes Agent

### 选项 A：交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

当提示时，选择 **Mattermost**，然后按照要求粘贴您的服务器 URL、机器人令牌和用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# 必需
MATTERMOST_URL=https://mm.example.com
MATTERMOST_TOKEN=***
MATTERMOST_ALLOWED_USERS=3uo8dkh1p7g1mfk49ear5fzs5c

# 多个允许用户（逗号分隔）
# MATTERMOST_ALLOWED_USERS=3uo8dkh1p7g1mfk49ear5fzs5c,8fk2jd9s0a7bncm1xqw4tp6r3e

# 可选：回复模式（thread 或 off，默认：off）
# MATTERMOST_REPLY_MODE=thread

# 可选：无需 @提及即可回复（默认：true = 需要提及）
# MATTERMOST_REQUIRE_MENTION=false

# 可选：无需 @提及回复的频道（逗号分隔的频道 ID）
# MATTERMOST_FREE_RESPONSE_CHANNELS=channel_id_1,channel_id_2
```

`~/.hermes/config.yaml` 中的可选行为设置：

```yaml
group_sessions_per_user: true
```

- `group_sessions_per_user: true` 在共享频道和主题串内保持每个参与者的上下文隔离

### 启动网关

配置完成后，启动 Mattermost 网关：

```bash
hermes gateway
```

机器人应该在几秒钟内连接到您的 Mattermost 服务器。发送一条消息——无论是私信还是在已添加机器人的频道中——进行测试。

:::tip
您可以在后台运行 `hermes gateway` 或将其作为 systemd 服务运行以实现持久化操作。有关详细信息，请参阅部署文档。
:::

## 主频道 (Home Channel)

您可以指定一个“主频道”，机器人可以在其中发送主动消息（例如定时任务输出、提醒和通知）。设置它有两种方法：

### 使用斜杠命令

在任何机器人存在的 Mattermost 频道中输入 `/sethome`。该频道将成为主频道。

### 手动配置

将以下内容添加到您的 `~/.hermes/.env`：

```bash
MATTERMOST_HOME_CHANNEL=abc123def456ghi789jkl012mn
```

用实际的频道 ID 替换此 ID（点击频道名称 → 查看信息 → 复制 ID）。

## 回复模式 (Reply Mode)

`MATTERMOST_REPLY_MODE` 设置控制 Hermes 如何发布回复：

| 模式 | 行为 |
|------|----------|
| `off` (默认) | Hermes 在频道中发布扁平化消息，就像普通用户一样。 |
| `thread` | Hermes 在您原始消息下回复一个主题串。当来回对话很多时，保持频道整洁。 |

在您的 `~/.hermes/.env` 中设置：

```bash
MATTERMOST_REPLY_MODE=thread
```

## 提及行为 (Mention Behavior)

默认情况下，机器人仅在被 `@提及` 时在频道中回复。您可以更改此设置：

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `MATTERMOST_REQUIRE_MENTION` | `true` | 设置为 `false` 可使机器人回复频道中的所有消息（私信始终有效）。 |
| `MATTERMOST_FREE_RESPONSE_CHANNELS` | _(无)_ | 逗号分隔的频道 ID，即使 `require_mention` 为 true，机器人也会在这些频道中无需 `@提及` 即可回复。 |

要在 Mattermost 中查找频道 ID：打开频道，点击频道名称标题，并在 URL 或频道详情中查找 ID。

当机器人被 `@提及` 时，提及会自动在处理消息之前被剥离。

## 故障排除

### 机器人未回复消息

**原因**: 机器人不是频道的成员，或者 `MATTERMOST_ALLOWED_USERS` 没有包含您的用户 ID。

**修复**: 将机器人添加到频道（频道名称 → 添加成员 → 搜索机器人）。验证您的用户 ID 是否在 `MATTERMOST_ALLOWED_USERS` 中。重启网关。

### 403 禁止错误

**原因**: 机器人令牌无效，或者机器人没有在频道中发布消息的权限。

**修复**: 检查您的 `.env` 文件中的 `MATTERMOST_TOKEN` 是否正确。确保机器人账户没有被停用。验证机器人是否已添加到频道。如果使用的是个人访问令牌，请确保您的账户具有所需的权限。

### WebSocket 断开连接 / 重连循环

**原因**: 网络不稳定、Mattermost 服务器重启，或防火墙/代理对 WebSocket 连接存在问题。

**修复**: 适配器会自动使用指数退避（2秒 → 60秒）进行重连。检查您服务器的 WebSocket 配置——反向代理（nginx, Apache）需要配置 WebSocket 升级头。验证没有防火墙阻止 Mattermost 服务器上的 WebSocket 连接。

对于 nginx，请确保您的配置包含：

```nginx
location /api/v4/websocket {
    proxy_pass http://mattermost-backend;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 600s;
}
```

### 启动时出现“身份验证失败”

**原因**: 令牌或服务器 URL 不正确。

**修复**: 验证 `MATTERMOST_URL` 是否指向您的 Mattermost 服务器（包含 `https://`，无尾随斜杠）。检查 `MATTERMOST_TOKEN` 是否有效——尝试使用 curl：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-server/api/v4/users/me
```

如果返回您机器人的用户信息，则令牌有效。如果返回错误，请重新生成令牌。

### 机器人离线

**原因**: Hermes 网关没有运行，或未能连接。

**修复**: 检查 `hermes gateway` 是否正在运行。查看终端输出中的错误消息。常见问题：URL 错误、令牌过期、Mattermost 服务器无法访问。

### “用户未授权” / 机器人忽略您

**原因**: 您的用户 ID 不在 `MATTERMOST_ALLOWED_USERS` 中。

**修复**: 将您的用户 ID 添加到 `~/.hermes/.env` 的 `MATTERMOST_ALLOWED_USERS` 中，并重启网关。请记住：用户 ID 是一个 26 个字符的字母数字字符串，而不是您的 `@用户名`。

## 频道级提示 (Per-Channel Prompts)

为特定的 Mattermost 频道分配临时的系统提示。该提示在每个回合运行时注入——绝不会持久化到记录历史中——因此更改会立即生效。

```yaml
mattermost:
  channel_prompts:
    "channel_id_abc123": |
      你是一名研究助理。专注于学术来源、
      引用和简洁的综合。
    "channel_id_def456": |
      代码审查模式。对边缘情况和
      性能影响要精确。
```

键是 Mattermost 频道 ID（在频道 URL 或通过 API 查找）。匹配频道中的所有消息都会被注入临时的系统指令提示。

## 安全性

:::warning
始终设置 `MATTERMOST_ALLOWED_USERS` 以限制谁可以与机器人互动。如果没有设置，网关默认会拒绝所有用户，这是一种安全措施。只添加您信任的人的用户 ID——授权用户对代理的能力拥有完全访问权限，包括工具使用和系统访问。
:::

有关保护您的 Hermes Agent 部署的更多信息，请参阅 [安全指南](../security.md)。

## 备注

- **自托管友好**: 可用于任何自托管的 Mattermost 实例。无需 Mattermost Cloud 账户或订阅。
- **无额外依赖**: 适配器使用 `aiohttp` 处理 HTTP 和 WebSocket，这已包含在 Hermes Agent 中。
- **兼容团队版**: 可与 Mattermost 团队版（免费）和企业版一起使用。