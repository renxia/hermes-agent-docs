---
sidebar_position: 8
title: "Mattermost"
description: "设置 Hermes 智能体作为 Mattermost 机器人"
---

# Mattermost 设置

Hermes 智能体作为一个机器人与 Mattermost 集成，让您可以通过私信或团队频道与 AI 助手聊天。Mattermost 是一个自托管、开源的 Slack 替代方案——您可以在自己的基础设施上运行它，完全掌控您的数据。该机器人通过 Mattermost 的 REST API (v4) 和 WebSocket 进行实时事件连接，通过 Hermes 智能体管道（包括工具使用、记忆和推理）处理消息，并实时响应。它支持文本、文件附件、图片和斜杠命令。

无需外部 Mattermost 库——适配器使用的是 Hermes 已有的依赖 `aiohttp`。

在设置之前，这是大多数人想知道的部分：Hermes 进入您的 Mattermost 实例后如何表现。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| **私信** | Hermes 会回复每一条消息。无需 `@提及`。每个私信都有独立的会话。 |
| **公共/私有频道** | 当您 `@提及` Hermes 时，它会回复。如果没有提及，Hermes 会忽略该消息。 |
| **帖子** | 如果 `MATTERMOST_REPLY_MODE=thread`，Hermes 会在您消息的帖子中回复。帖子上下文与父频道保持隔离。 |
| **包含多个用户的共享频道** | 默认情况下，Hermes 会为频道内的每个用户隔离会话历史。在同一频道中交谈的两个人不会共享一个对话记录，除非您明确禁用此功能。 |

:::tip
如果您希望 Hermes 以帖子对话的形式回复（嵌套在原始消息下方），请设置 `MATTERMOST_REPLY_MODE=thread`。默认为 `off`，即在频道中发送平铺消息。
:::

### Mattermost 中的会话模型

默认情况下：

- 每个私信都有独立的会话
- 每个帖子都有独立的会话命名空间
- 共享频道中的每个用户在该频道内都有自己的会话

这由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您明确希望为整个频道设置一个共享对话时，才将其设为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话对于协作频道可能很有用，但它们也意味着：

- 用户共享上下文增长和代币成本
- 一个人冗长的、大量使用工具的任务可能会膨胀其他每个人的上下文
- 一个人正在执行的运行可能会在同一频道中中断其他人的后续操作

本指南将引导您完成完整的设置过程——从在 Mattermost 上创建您的机器人到发送您的第一条消息。

## 步骤 1：启用机器人账户

在创建机器人账户之前，必须在您的 Mattermost 服务器上启用它们。

1.  以 **系统管理员** 身份登录 Mattermost。
2.  前往 **系统控制台** → **集成** → **机器人账户**。
3.  将 **启用机器人账户创建** 设置为 **true**。
4.  点击 **保存**。

:::info
如果您没有系统管理员权限，请让您的 Mattermost 管理员为您启用机器人账户并创建一个。
:::

## 步骤 2：创建机器人账户

1.  在 Mattermost 中，点击 **☰** 菜单（左上角）→ **集成** → **机器人账户**。
2.  点击 **添加机器人账户**。
3.  填写详细信息：
    - **用户名**：例如 `hermes`
    - **显示名称**：例如 `Hermes 智能体`
    - **描述**：可选
    - **角色**：`成员` 权限通常足够
4.  点击 **创建机器人账户**。
5.  Mattermost 将显示 **机器人令牌**。**请立即复制它。**

:::warning[令牌仅显示一次]
机器人令牌仅在创建机器人账户时显示一次。如果丢失，您需要从机器人账户设置中重新生成。切勿公开分享您的令牌或将其提交到 Git —— 任何拥有此令牌的人都可以完全控制该机器人。
:::

请将令牌安全存储（例如，使用密码管理器）。您将在步骤 5 中需要它。

:::tip
您也可以使用 **个人访问令牌** 代替机器人账户。前往 **个人资料** → **安全** → **个人访问令牌** → **创建令牌**。如果您希望 Hermes 以您自己的用户身份而不是独立的机器人用户身份发帖，这将非常有用。
:::

## 步骤 3：将机器人添加到频道

机器人需要成为您希望其响应的任何频道的成员：

1.  打开您希望添加机器人的频道。
2.  点击频道名称 → **添加成员**。
3.  搜索您的机器人用户名（例如 `hermes`）并添加。

对于私信，只需打开与机器人的私信对话即可 —— 它将能够立即响应。

## 步骤 4：查找您的 Mattermost 用户 ID

Hermes 智能体使用您的 Mattermost 用户 ID 来控制谁可以与机器人交互。查找方法如下：

1.  点击您的 **头像**（左上角）→ **个人资料**。
2.  您的用户 ID 显示在个人资料对话框中 —— 点击它即可复制。

您的用户 ID 是一个 26 位的字母数字字符串，例如 `3uo8dkh1p7g1mfk49ear5fzs5c`。

:::warning
您的用户 ID **不是** 您的用户名。用户名是出现在 `@` 之后的内容（例如 `@alice`）。用户 ID 是 Mattermost 内部使用的长字母数字标识符。
:::

**备选方案**：您也可以通过 API 获取用户 ID：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-mattermost-server/api/v4/users/me | jq .id
```

:::tip
要获取 **频道 ID**：点击频道名称 → **查看信息**。频道 ID 将显示在信息面板中。如果您想手动设置主频道，将需要此 ID。
:::

## 步骤 5：配置 Hermes 智能体

### 选项 A：交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

当提示时选择 **Mattermost**，然后在要求时粘贴您的服务器 URL、机器人令牌和用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# 必填
MATTERMOST_URL=https://mm.example.com
MATTERMOST_TOKEN=***
MATTERMOST_ALLOWED_USERS=3uo8dkh1p7g1mfk49ear5fzs5c

# 多个允许的用户（逗号分隔）
# MATTERMOST_ALLOWED_USERS=3uo8dkh1p7g1mfk49ear5fzs5c,8fk2jd9s0a7bncm1xqw4tp6r3e

# 可选：回复模式（thread 或 off，默认：off）
# MATTERMOST_REPLY_MODE=thread

# 可选：无需 @提及即响应（默认：true = 需要提及）
# MATTERMOST_REQUIRE_MENTION=false

# 可选：机器人无需 @提及即响应的频道（逗号分隔的频道 ID）
# MATTERMOST_FREE_RESPONSE_CHANNELS=channel_id_1,channel_id_2
```

在 `~/.hermes/config.yaml` 中的可选行为设置：

```yaml
group_sessions_per_user: true
```

- `group_sessions_per_user: true` 在共享频道和线程中隔离每个参与者的上下文。

### 启动网关

配置完成后，启动 Mattermost 网关：

```bash
hermes gateway
```

机器人应在几秒钟内连接到您的 Mattermost 服务器。向它发送一条消息（无论是私信还是已添加机器人的频道）进行测试。

:::tip
您可以在后台或作为 systemd 服务运行 `hermes gateway` 以实现持久操作。详情请参阅部署文档。
:::

## 主频道

您可以指定一个“主频道”，机器人将在其中发送主动消息（例如定时任务输出、提醒和通知）。有两种方式可以设置：

### 使用斜杠命令

在机器人存在的任何 Mattermost 频道中输入 `/sethome`。该频道将成为主频道。

### 手动配置

将此添加到您的 `~/.hermes/.env`：

```bash
MATTERMOST_HOME_CHANNEL=abc123def456ghi789jkl012mn
```

将 ID 替换为实际的频道 ID（点击频道名称 → 查看信息 → 复制 ID）。

## 回复模式

`MATTERMOST_REPLY_MODE` 设置控制 Hermes 如何发布回复：

| 模式 | 行为 |
|------|------|
| `off`（默认） | Hermes 在频道中像普通用户一样发送普通消息。 |
| `thread` | Hermes 在您原始消息的线程中回复。当有大量来回对话时，可保持频道整洁。 |

在您的 `~/.hermes/.env` 中设置：

```bash
MATTERMOST_REPLY_MODE=thread
```

## 提及行为

默认情况下，机器人仅在被 `@提及时` 才在频道中响应。您可以更改此设置：

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `MATTERMOST_REQUIRE_MENTION` | `true` | 设置为 `false` 以响应频道中的所有消息（私信始终有效）。 |
| `MATTERMOST_FREE_RESPONSE_CHANNELS` | _(无)_ | 逗号分隔的频道 ID，即使在 require_mention 为 true 时，机器人也会在这些频道中无需 `@提及` 即响应。 |

在 Mattermost 中查找频道 ID：打开频道，点击频道名称标题，在 URL 或频道详细信息中查找 ID。

当机器人被 `@提及时`，提及将在处理前自动从消息中剥离。

## 频道允许列表 (`allowed_channels`)

将机器人限制在一组固定的 Mattermost 频道中。设置后，机器人**仅**响应 ID 出现在列表中的频道 —— 来自任何其他频道的消息都会被静默忽略，即使机器人被 `@提及`。

**私信不受此过滤器限制**，因此授权用户始终可以通过私信联系到机器人。

```yaml
mattermost:
  allowed_channels:
    - "abc123def456ghi789jkl012mno"   # #ops
    - "xyz987uvw654rst321opq098nml"   # #incident-response
```

或通过环境变量设置（逗号分隔）：

```bash
MATTERMOST_ALLOWED_CHANNELS="abc123def456ghi789jkl012mno,xyz987uvw654rst321opq098nml"
```

行为：

- 空 / 未设置 → 无限制（完全向后兼容）。
- 非空 → 频道 ID 必须在列表中，否则消息会在运行任何其他门控（提及要求、`MATTERMOST_FREE_RESPONSE_CHANNELS` 等）之前被丢弃。
- 通过 Mattermost UI 查找频道 ID → 频道标题 → “查看信息”，或从频道 URL 中读取。

另请参见：[管理员/用户斜杠命令拆分](../../reference/slash-commands.md#permissions-and-adminuser-split)。

## 故障排除

### 机器人不响应消息

**原因**：机器人不是频道成员，或 `MATTERMOST_ALLOWED_USERS` 不包含您的用户 ID。

**解决方法**：将机器人添加到频道（频道名称 → 添加成员 → 搜索机器人）。验证您的用户 ID 是否在 `MATTERMOST_ALLOWED_USERS` 中。重启网关。

### 403 禁止错误

**原因**：机器人令牌无效，或机器人无权在该频道发布消息。

**解决方法**：检查 `.env` 文件中的 `MATTERMOST_TOKEN` 是否正确。确保机器人账户未被停用。验证机器人已被添加到频道。如果使用个人访问令牌，请确保您的账户拥有所需权限。

### WebSocket 断开连接 / 重连循环

**原因**：网络不稳定、Mattermost 服务器重启，或防火墙/代理的 WebSocket 连接问题。

**解决方法**：适配器会自动以指数退避方式重连（2秒 → 60秒）。检查您服务器的 WebSocket 配置 —— 反向代理（nginx、Apache）需要配置 WebSocket 升级头。验证没有防火墙阻止 Mattermost 服务器上的 WebSocket 连接。

对于 nginx，确保您的配置包含：

```nginx
location /api/v4/websocket {
    proxy_pass http://mattermost-backend;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 600s;
}
```

### 启动时出现 "Failed to authenticate" 错误

**原因**：令牌或服务器 URL 不正确。

**解决方法**：验证 `MATTERMOST_URL` 指向您的 Mattermost 服务器（包含 `https://`，无尾部斜杠）。检查 `MATTERMOST_TOKEN` 是否有效 —— 尝试用 curl 测试：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-server/api/v4/users/me
```

如果返回了您的机器人用户信息，则令牌有效。如果返回错误，请重新生成令牌。

### 机器人离线

**原因**：Hermes 网关未运行，或连接失败。

**解决方法**：检查 `hermes gateway` 是否正在运行。查看终端输出中的错误消息。常见问题：URL 错误、令牌过期、Mattermost 服务器不可达。

### "User not allowed" / 机器人忽略你

**原因**：您的用户 ID 不在 `MATTERMOST_ALLOWED_USERS` 中。

**解决方法**：将您的用户 ID 添加到 `~/.hermes/.env` 中的 `MATTERMOST_ALLOWED_USERS` 并重启网关。请记住：用户 ID 是一个 26 位的字母数字字符串，而不是您的 `@用户名`。

## 按频道提示

为特定的 Mattermost 频道分配临时系统提示。该提示在运行时每次交互时注入——永远不会被保存到对话历史中——因此更改会立即生效。

```yaml
mattermost:
  channel_prompts:
    "channel_id_abc123": |
      你是一个研究助手。专注于学术来源、
      引用和简洁的综合。
    "channel_id_def456": |
      代码审查模式。精确关注边界情况
      和性能影响。
```

键是 Mattermost 频道 ID（可在频道 URL 或通过 API 中找到）。匹配频道中的所有消息都会被注入提示，作为临时系统指令。

## 安全

:::warning
始终设置 `MATTERMOST_ALLOWED_USERS` 以限制谁可以与智能体交互。如果没有设置，网关会出于安全考虑默认拒绝所有用户。只添加你信任的用户的用户 ID——授权用户可以完全访问智能体的功能，包括工具使用和系统访问。
:::

有关保护你的 Hermes 智能体部署的更多信息，请参阅[安全指南](../security.md)。

## 注意事项

- **友好自托管**：适用于任何自托管的 Mattermost 实例。无需 Mattermost Cloud 账户或订阅。
- **无额外依赖**：该适配器使用 `aiohttp` 进行 HTTP 和 WebSocket 通信，这已包含在 Hermes 智能体中。
- **兼容团队版**：适用于 Mattermost 团队版（免费版）和企业版。