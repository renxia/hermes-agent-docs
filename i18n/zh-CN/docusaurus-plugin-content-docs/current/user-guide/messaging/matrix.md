---
sidebar_position: 9
title: "Matrix"
description: "将 Hermes 智能体配置为 Matrix 机器人"
---

# Matrix 配置

Hermes 智能体与 Matrix 集成——一个开放的、联邦式的即时通讯协议。Matrix 让你可以运行自己的主服务器，也可以使用公共服务器（如 matrix.org）——无论哪种方式，你都能掌控自己的通信。该机器人通过 `mautrix` Python SDK 连接，通过 Hermes 智能体管道（包括工具使用、记忆和推理）处理消息，并实时响应。支持文本、文件附件、图片、音频、视频，以及可选的端到端加密（E2EE）。

Hermes 兼容任何 Matrix 主服务器——Synapse、Conduit、Dendrite 或 matrix.org。

在配置之前，这是大多数人想知道的部分：Hermes 连接后的行为方式。

## Hermes 的行为方式

| 场景 | 行为 |
|------|------|
| **私信** | Hermes 会回复每条消息，无需 `@提及`。每个私信有独立的会话。设置 `MATRIX_DM_MENTION_THREADS=true` 可以在私信中 `@提及` 机器人时创建线程。 |
| **房间** | 默认情况下，Hermes 需要 `@提及` 才会回复。设置 `MATRIX_REQUIRE_MENTION=false` 或将房间 ID 添加到 `MATRIX_FREE_RESPONSE_ROOMS` 以实现自由回复。房间邀请会被自动接受。 |
| **线程** | Hermes 支持 Matrix 线程（MSC3440）。如果在线程中回复，Hermes 会将线程上下文与主房间时间线隔离。机器人已参与的线程无需 @提及。 |
| **自动线程** | 默认情况下，Hermes 会为房间中回复的每条消息自动创建线程，以保持对话隔离。设置 `MATRIX_AUTO_THREAD=false` 可禁用此功能。 |
| **多用户共享房间** | 默认情况下，Hermes 会按用户隔离房间内的会话历史。同一房间中两个用户的对话不会共享上下文，除非显式禁用此功能。 |

:::tip
机器人在被邀请时会自动加入房间。只需将机器人的 Matrix 用户邀请到任何房间，它就会加入并开始响应。
:::

### Matrix 中的会话模型

默认情况下：

- 每个私信有独立的会话
- 每个线程有独立的会话命名空间
- 共享房间中的每个用户在该房间内有独立的会话

通过 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当你明确希望整个房间共享一个对话时，才设置为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话对协作房间很有用，但同时也意味着：

- 用户共享上下文增长和 token 成本
- 某人的长任务或大量工具调用会膨胀其他人的上下文
- 某人正在进行的运行可能会中断同房间中其他人的后续操作

### 提及和线程配置

你可以通过环境变量或 `config.yaml` 配置提及和自动线程行为：

```yaml
matrix:
  require_mention: true           # 在房间中需要 @提及（默认：true）
  free_response_rooms:            # 免除提及要求的房间
    - "!abc123:matrix.org"
  auto_thread: true               # 自动为回复创建线程（默认：true）
  dm_mention_threads: false       # 在私信中被 @提及时创建线程（默认：false）
```

或通过环境变量：

```bash
MATRIX_REQUIRE_MENTION=true
MATRIX_FREE_RESPONSE_ROOMS=!abc123:matrix.org,!def456:matrix.org
MATRIX_AUTO_THREAD=true
MATRIX_DM_MENTION_THREADS=false
MATRIX_REACTIONS=true          # 默认：true — 处理期间的表情回应
```

:::tip 禁用回应
`MATRIX_REACTIONS=false` 关闭机器人在收到消息时发出的处理生命周期表情回应（👀/✅/❌）。适用于表情回应事件嘈杂或不被所有参与客户端支持的房间。
:::

:::note
如果你从没有 `MATRIX_REQUIRE_MENTION` 功能的旧版本升级，机器人之前会回复房间中的所有消息。要保留该行为，请设置 `MATRIX_REQUIRE_MENTION=false`。
:::

本指南将带你完成完整的配置流程——从创建机器人账号到发送第一条消息。

# 第一步：创建机器人账户

你需要一个用于机器人的 Matrix 用户账户。有几种方法可以实现：

### 选项 A：在您的主服务器上注册（推荐）

如果您运行自己的主服务器（Synapse, Conduit, Dendrite）：

1.  使用管理员 API 或注册工具创建新用户：

```bash
# Synapse 示例
register_new_matrix_user -c /etc/synapse/homeserver.yaml http://localhost:8008
```

2.  选择一个像 `hermes` 这样的用户名 — 完整的用户 ID 将是 `@hermes:your-server.org`。

### 选项 B：使用 matrix.org 或其他公共主服务器

1.  访问 [Element Web](https://app.element.io) 并创建一个新账户。
2.  为你的机器人选择一个用户名（例如 `hermes-bot`）。

### 选项 C：使用您自己的账户

您也可以以自己的用户身份运行 Hermes。这意味着机器人以您的名义发布消息 — 适用于个人助理。

## 第二步：获取访问令牌

Hermes 需要一个访问令牌来向主服务器进行身份验证。您有两个选择：

### 选项 A：访问令牌（推荐）

获取令牌最可靠的方式：

**通过 Element：**
1.  使用机器人账户登录 [Element](https://app.element.io)。
2.  进入 **设置** → **帮助与关于**。
3.  向下滚动并展开 **高级** — 访问令牌会显示在那里。
4.  **立即复制。**

**通过 API：**

```bash
curl -X POST https://your-server/_matrix/client/v3/login \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "@hermes:your-server.org",
    "password": "your-password"
  }'
```

响应中包含一个 `access_token` 字段 — 复制它。

:::warning[保护好您的访问令牌]
访问令牌赋予了对机器人 Matrix 账户的完全访问权限。切勿公开分享或将其提交到 Git。如果泄露，请通过注销该用户的所有会话来撤销它。
:::

### 选项 B：密码登录

除了提供访问令牌，您也可以给 Hermes 机器人用户的用户 ID 和密码。Hermes 会在启动时自动登录。这更简单，但意味着密码会存储在您的 `.env` 文件中。

```bash
MATRIX_USER_ID=@hermes:your-server.org
MATRIX_PASSWORD=your-password
```

## 第三步：找到您的 Matrix 用户 ID

Hermes 智能体使用您的 Matrix 用户 ID 来控制谁可以与机器人互动。Matrix 用户 ID 的格式为 `@username:server`。

查找您的用户 ID：

1.  打开 [Element](https://app.element.io)（或您偏好的 Matrix 客户端）。
2.  点击您的头像 → **设置**。
3.  您的用户 ID 显示在个人资料顶部（例如 `@alice:matrix.org`）。

:::tip
Matrix 用户 ID 总是以 `@` 开头，后面跟着一个 `:` 和服务器名称。例如：`@alice:matrix.org`, `@bob:your-server.com`。
:::

## 第四步：配置 Hermes 智能体

### 选项 A：交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

当提示时选择 **Matrix**，然后在询问时提供您的主服务器 URL、访问令牌（或用户 ID + 密码）以及允许的用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

**使用访问令牌：**

```bash
# 必需
MATRIX_HOMESERVER=https://matrix.example.org
MATRIX_ACCESS_TOKEN=***

# 可选：用户 ID（如果省略则从令牌自动检测）
# MATRIX_USER_ID=@hermes:matrix.example.org

# 安全性：限制谁可以与机器人互动
MATRIX_ALLOWED_USERS=@alice:matrix.example.org

# 多个允许的用户（用逗号分隔）
# MATRIX_ALLOWED_USERS=@alice:matrix.example.org,@bob:matrix.example.org
```

**使用密码登录：**

```bash
# 必需
MATRIX_HOMESERVER=https://matrix.example.org
MATRIX_USER_ID=@hermes:matrix.example.org
MATRIX_PASSWORD=***

# 安全性
MATRIX_ALLOWED_USERS=@alice:matrix.example.org
```

`~/.hermes/config.yaml` 中的可选行为设置：

```yaml
group_sessions_per_user: true
```

- `group_sessions_per_user: true` 在共享房间内保持每个参与者的上下文隔离。

### 启动网关

配置完成后，启动 Matrix 网关：

```bash
hermes gateway
```

机器人应该能在几秒钟内连接到您的主服务器并开始同步。给它发送一条消息（无论是私信还是在它已加入的房间中）进行测试。

:::tip
您可以将 `hermes gateway` 作为后台任务或 systemd 服务运行以实现持久化操作。详见部署文档。
:::

## 端到端加密 (E2EE)

Hermes 支持 Matrix 端到端加密，因此您可以在加密房间中与您的机器人聊天。

### 要求

E2EE 需要带有加密扩展的 `mautrix` 库和 `libolm` C 库：

```bash
# 安装带有 E2EE 支持的 mautrix
pip install 'mautrix[encryption]'

# 或者通过 hermes 扩展安装
pip install 'hermes-agent[matrix]'
```

您还需要在系统上安装 `libolm`：

```bash
# Debian/Ubuntu
sudo apt install libolm-dev

# macOS
brew install libolm

# Fedora
sudo dnf install libolm-devel
```

### 启用 E2EE

添加到您的 `~/.hermes/.env` 文件中：

```bash
MATRIX_ENCRYPTION=true
```

当 E2EE 启用时，Hermes 会：

- 将加密密钥存储在 `~/.hermes/platforms/matrix/store/`（旧版安装路径：`~/.hermes/matrix/store/`）
- 在首次连接时上传设备密钥
- 自动解密传入消息和加密传出消息
- 被邀请时自动加入加密房间

### 交叉签名验证（推荐）

如果您的 Matrix 账户启用了交叉签名（Element 中的默认设置），请设置恢复密钥，以便机器人可以在启动时自我签名其设备。如果不这样做，其他 Matrix 客户端在设备密钥轮换后可能会拒绝与机器人共享加密会话。

```bash
MATRIX_RECOVERY_KEY=EsT... 您的恢复密钥放在这里
```

**在哪里找到它：** 在 Element 中，进入 **设置** → **安全与隐私** → **加密** → 您的恢复密钥（也称为“安全密钥”）。这是您在首次设置交叉签名时被要求保存的密钥。

每次启动时，如果设置了 `MATRIX_RECOVERY_KEY`，Hermes 会从主服务器的安全秘密存储中导入交叉签名密钥，并对当前设备进行签名。这是幂等的，可以安全地永久启用。

:::warning[删除加密存储]
如果您删除了 `~/.hermes/platforms/matrix/store/crypto.db`，机器人将丢失其加密身份。简单地使用相同的设备 ID 重启**不会**完全恢复 — 主服务器仍然持有使用旧身份密钥签名的一次性密钥，对等方无法建立新的 Olm 会话。

Hermes 在启动时会检测到这种情况并拒绝启用 E2EE，并记录日志：`设备 XXXX 在服务器上有使用先前身份密钥签名的陈旧一次性密钥`。

**最简单的恢复方法：生成一个新的访问令牌**（这会获得一个没有陈旧密钥历史的新设备 ID）。参见下面的“从带有 E2EE 的旧版本升级”部分。这是最可靠的途径，避免触及主服务器数据库。

**手动恢复**（高级 — 保持相同的设备 ID）：

1.  停止 Synapse 并从其数据库中删除旧设备：
    ```bash
    sudo systemctl stop matrix-synapse
    sudo sqlite3 /var/lib/matrix-synapse/homeserver.db "
      DELETE FROM e2e_device_keys_json WHERE device_id = 'DEVICE_ID' AND user_id = '@hermes:your-server';
      DELETE FROM e2e_one_time_keys_json WHERE device_id = 'DEVICE_ID' AND user_id = '@hermes:your-server';
      DELETE FROM e2e_fallback_keys_json WHERE device_id = 'DEVICE_ID' AND user_id = '@hermes:your-server';
      DELETE FROM devices WHERE device_id = 'DEVICE_ID' AND user_id = '@hermes:your-server';
    "
    sudo systemctl start matrix-synapse
    ```
    或者通过 Synapse 管理员 API（注意用户 ID 需要 URL 编码）：
    ```bash
    curl -X DELETE -H "Authorization: Bearer ADMIN_TOKEN" \
      'https://your-server/_synapse/admin/v2/users/%40hermes%3Ayour-server/devices/DEVICE_ID'
    ```
    注意：通过管理员 API 删除设备也可能使关联的访问令牌失效。之后您可能需要生成一个新的令牌。

2.  删除本地加密存储并重启 Hermes：
    ```bash
    rm -f ~/.hermes/platforms/matrix/store/crypto.db*
    # 重启 hermes
    ```

其他 Matrix 客户端（Element, matrix-commander）可能缓存了旧的设备密钥。恢复后，在 Element 中输入 `/discardsession` 以强制与机器人建立新的加密会话。
:::

:::info
如果未安装 `mautrix[encryption]` 或缺少 `libolm`，机器人将自动回退到普通（未加密）客户端。您会在日志中看到一条警告。
:::

## 主房间

您可以指定一个"主房间"，机器人会在此发送主动消息（如定时任务输出、提醒和通知）。有两种设置方式：

### 使用斜杠命令

在机器人所在的任意 Matrix 房间中输入 `/sethome`。该房间即成为主房间。

### 手动配置

将以下内容添加到 `~/.hermes/.env` 文件中：

```bash
MATRIX_HOME_ROOM=!abc123def456:matrix.example.org
```

## 房间允许列表（`allowed_rooms`）

将机器人限制在一组固定的 Matrix 房间中。设置后，机器人**仅**在 ID 出现在列表中的房间内响应 — 即使机器人被提及，来自其他房间的消息也会被静默忽略。

**私聊（直接对话房间）不受此限制**，因此授权用户始终可以通过私聊与机器人沟通。

```yaml
matrix:
  allowed_rooms:
    - "!abc123def456:matrix.example.org"
    - "!opsroom789:matrix.example.org"
```

或通过环境变量设置（逗号分隔）：

```bash
MATRIX_ALLOWED_ROOMS="!abc123def456:matrix.example.org,!opsroom789:matrix.example.org"
```

行为：

- 空值/未设置 → 无限制（默认）。
- 非空 → 房间 ID 必须在列表中。此检查在**任何其他限制之前**执行（提及要求、发送者允许列表等）。
- 请使用房间的**内部 ID**（`!abc...:server`），而非别名（`#room:server`）。您可以在 Element 中通过 房间 → 设置 → 高级 找到房间的内部 ID。

另请参阅：[管理员/用户斜杠命令分离](../../reference/slash-commands.md#permissions-and-adminuser-split)。

:::tip
查找房间 ID：在 Element 中，进入目标房间 → **设置** → **高级** → 此处会显示**内部房间 ID**（以 `!` 开头）。
:::

## 故障排除

### 机器人无响应

**原因**：机器人未加入房间，或 `MATRIX_ALLOWED_USERS` 中未包含您的用户ID。

**解决**：邀请机器人加入房间 — 它会在收到邀请时自动加入。确认您的用户ID已在 `MATRIX_ALLOWED_USERS` 中（使用完整的 `@user:server` 格式）。重启网关。

### 机器人加入房间但静默丢弃每条消息（时钟偏移）

**原因**：主机的系统时钟设置超前于实际时间。Matrix 适配器应用了5秒启动宽限过滤器 (`event_ts < startup_ts - 5`) 以忽略从初始同步重放的事件。当实际时钟超前时，所有传入事件看起来都“比启动时间更早”，在到达消息处理器之前就被丢弃 — 机器人看起来已连接但从未回复。参见 [#12614](https://github.com/NousResearch/hermes-agent/issues/12614)。

**症状**：网关日志显示 `Matrix: dropped N live events as 'too old' more than 30s after startup`。

**解决**：使用 NTP 同步主机时钟并重启机器人：

```bash
# Debian/Ubuntu
sudo timedatectl set-ntp true
timedatectl status   # 确认 "System clock synchronized: yes"

# macOS
sudo sntp -sS time.apple.com
```

### 启动时出现 "Failed to authenticate" / "whoami failed" 错误

**原因**：访问令牌或 homeserver URL 不正确。

**解决**：验证 `MATRIX_HOMESERVER` 指向您的 homeserver（包含 `https://`，无尾部斜杠）。检查 `MATRIX_ACCESS_TOKEN` 是否有效 — 尝试使用 curl 测试：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-server/_matrix/client/v3/account/whoami
```

如果返回您的用户信息，则令牌有效。如果返回错误，请生成新令牌。

### "mautrix not installed" 错误

**原因**：`mautrix` Python 包未安装。

**解决**：安装它：

```bash
pip install 'mautrix[encryption]'
```

或者使用 Hermes 附加组件：

```bash
pip install 'hermes-agent[matrix]'
```

### 加密错误 / "could not decrypt event"

**原因**：缺少加密密钥，`libolm` 未安装，或机器人的设备不受信任。

**解决**：
1.  验证 `libolm` 已安装在您的系统上（参见上方的端到端加密部分）。
2.  确保在您的 `.env` 中设置了 `MATRIX_ENCRYPTION=true`。
3.  在您的 Matrix 客户端（Element）中，前往机器人的个人资料 -> 会话 -> 验证/信任机器人的设备。
4.  如果机器人刚刚加入加密房间，它只能解密在其加入*之后*发送的消息。无法访问旧消息。

### 从之前版本升级并使用端到端加密

:::tip
如果您也手动删除了 `crypto.db`，请参阅上方端到端加密部分中的“删除加密存储”警告 — 有额外的步骤来清除 homeserver 上的陈旧一次性密钥。
:::

如果您之前使用过 `MATRIX_ENCRYPTION=true` 的 Hermes，并且正在升级到使用新的基于 SQLite 加密存储的版本，则机器人的加密身份已更改。您的 Matrix 客户端（Element）可能会缓存旧的设备密钥，并拒绝与机器人共享加密会话。

**症状**：机器人已连接并在日志中显示“E2EE enabled”，但所有消息都显示“could not decrypt event”，并且机器人从不响应。

**发生了什么**：旧的加密状态（来自之前的 `matrix-nio` 或基于序列化的 `mautrix` 后端）与新的 SQLite 加密存储不兼容。机器人创建了全新的加密身份，但您的 Matrix 客户端仍然缓存着旧密钥，并且不会与密钥已更改的设备共享房间的加密会话。这是 Matrix 的安全特性 — 客户端将同一设备更改的身份密钥视为可疑。

**解决**（一次性迁移）：

1.  **生成新的访问令牌** 以获取新的设备ID。最简单的方法是：

    ```bash
    curl -X POST https://your-server/_matrix/client/v3/login \
      -H "Content-Type: application/json" \
      -d '{
        "type": "m.login.password",
        "identifier": {"type": "m.id.user", "user": "@hermes:your-server.org"},
        "password": "***",
        "initial_device_display_name": "Hermes Agent"
      }'
    ```

    复制新的 `access_token` 并更新 `~/.hermes/.env` 中的 `MATRIX_ACCESS_TOKEN`。

2.  **删除旧的加密状态**：

    ```bash
    rm -f ~/.hermes/platforms/matrix/store/crypto.db
    rm -f ~/.hermes/platforms/matrix/store/crypto_store.*
    ```

3.  **设置您的恢复密钥**（如果您使用交叉签名 — 大多数 Element 用户都这样做）。添加到 `~/.hermes/.env`：

    ```bash
    MATRIX_RECOVERY_KEY=EsT... your recovery key here
    ```

    这允许机器人在启动时使用交叉签名密钥进行自我签名，从而让 Element 立即信任新设备。如果没有这个，Element 可能会将新设备视为未验证并拒绝共享加密会话。在 Element 的 **设置** → **安全与隐私** → **加密** 中可以找到您的恢复密钥。

4.  **强制您的 Matrix 客户端轮换加密会话**。在 Element 中，打开与机器人的私聊房间并输入 `/discardsession`。这会强制 Element 创建一个新的加密会话并与机器人的新设备共享。

5.  **重启网关**：

    ```bash
    hermes gateway run
    ```

    如果设置了 `MATRIX_RECOVERY_KEY`，您应该在日志中看到 `Matrix: cross-signing verified via recovery key`。

6.  **发送一条新消息**。机器人应该能够正常解密并响应。

:::note
迁移后，在升级*之前*发送的消息无法解密 — 旧的加密密钥已丢失。这只会影响过渡期；新消息可以正常工作。
:::

:::tip
**全新安装不受影响。** 仅当您之前使用过具有端到端加密的旧版 Hermes 并且正在升级时，才需要此迁移。

**为什么需要新的访问令牌？** 每个 Matrix 访问令牌都绑定到特定的设备ID。将相同的设备ID与新的加密密钥一起使用会导致其他 Matrix 客户端不信任该设备（他们将更改的身份密钥视为潜在的安全漏洞）。新的访问令牌会获得一个新的设备ID，没有陈旧的密钥历史记录，因此其他客户端会立即信任它。
:::

## 代理模式（macOS 上的端到端加密）

Matrix 端到端加密需要 `libolm`，它无法在 macOS ARM64（Apple Silicon）上编译。`hermes-agent[matrix]` 附加组件仅限于 Linux。如果您使用 macOS，代理模式允许您在 Linux 虚拟机的 Docker 容器中运行端到端加密，而实际的智能体则在 macOS 上本地运行，可以完全访问您的本地文件、记忆和技能。

### 工作原理

```
macOS (主机):
  └─ hermes gateway
       ├─ api_server 适配器 ← 监听 0.0.0.0:8642
       ├─ AIAgent（智能体）← 唯一的数据源
       ├─ 会话、记忆、技能
       └─ 本地文件访问（Obsidian、项目等）

Linux 虚拟机 (Docker):
  └─ hermes gateway (代理模式)
       ├─ Matrix 适配器 ← 端到端加密解密/加密
       └─ HTTP 转发 → macOS:8642/v1/chat/completions
           （无 LLM API 密钥，无智能体，无推理）
```

Docker 容器仅处理 Matrix 协议 + 端到端加密。当消息到达时，它会解密消息并将文本通过标准 HTTP 请求转发给主机。主机运行智能体，调用工具，生成响应并将其流式传输回来。容器加密响应并发送到 Matrix。所有会话是统一的 — CLI、Matrix、Telegram 和任何其他平台共享相同的记忆和对话历史。

### 步骤 1：配置主机 (macOS)

启用 API 服务器，以便主机接受来自 Docker 容器的传入请求。

添加到 `~/.hermes/.env`：

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=your-secret-key-here
API_SERVER_HOST=0.0.0.0
```

-   `API_SERVER_HOST=0.0.0.0` 绑定到所有接口，以便 Docker 容器可以访问它。
-   `API_SERVER_KEY` 对于非回环绑定是必需的。选择一个强随机字符串。
-   API 服务器默认运行在端口 8642（如果需要，可通过 `API_SERVER_PORT` 更改）。

启动网关：

```bash
hermes gateway
```

您应该看到 API 服务器与您配置的任何其他平台一起启动。从虚拟机验证其可达性：

```bash
# 从 Linux 虚拟机
curl http://<mac-ip>:8642/health
```

### 步骤 2：配置 Docker 容器 (Linux 虚拟机)

容器需要 Matrix 凭据和代理 URL。它不需要 LLM API 密钥。

**`docker-compose.yml`：**

```yaml
services:
  hermes-matrix:
    build: .
    environment:
      # Matrix 凭据
      MATRIX_HOMESERVER: "https://matrix.example.org"
      MATRIX_ACCESS_TOKEN: "syt_..."
      MATRIX_ALLOWED_USERS: "@you:matrix.example.org"
      MATRIX_ENCRYPTION: "true"
      MATRIX_DEVICE_ID: "HERMES_BOT"

      # 代理模式 — 转发到主机智能体
      GATEWAY_PROXY_URL: "http://192.168.1.100:8642"
      GATEWAY_PROXY_KEY: "your-secret-key-here"
    volumes:
      - ./matrix-store:/root/.hermes/platforms/matrix/store
```

**`Dockerfile`：**

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y libolm-dev && rm -rf /var/lib/apt/lists/*
RUN pip install 'hermes-agent[matrix]'

CMD ["hermes", "gateway"]
```

这就是整个容器。不需要 OpenRouter、Anthropic 或任何推理提供商的 API 密钥。

### 步骤 3：启动两者

1.  首先启动主机网关：
    ```bash
    hermes gateway
    ```

2.  启动 Docker 容器：
    ```bash
    docker compose up -d
    ```

3.  在加密的 Matrix 房间发送消息。容器解密消息，将其转发给主机，并流式传回响应。

### 配置参考

代理模式在**容器端**（轻量级网关）配置：

| 设置 | 描述 |
|---------|-------------|
| `GATEWAY_PROXY_URL` | 远程 Hermes API 服务器的 URL（例如，`http://192.168.1.100:8642`） |
| `GATEWAY_PROXY_KEY` | 用于身份验证的 Bearer 令牌（必须与主机上的 `API_SERVER_KEY` 匹配） |
| `gateway.proxy_url` | 与 `GATEWAY_PROXY_URL` 相同，但在 `config.yaml` 中 |

主机端需要：

| 设置 | 描述 |
|---------|-------------|
| `API_SERVER_ENABLED` | 设置为 `true` |
| `API_SERVER_KEY` | Bearer 令牌（与容器共享） |
| `API_SERVER_HOST` | 设置为 `0.0.0.0` 以允许网络访问 |
| `API_SERVER_PORT` | 端口号（默认：`8642`） |

### 适用于任何平台

代理模式不仅限于 Matrix。任何平台适配器都可以使用它 — 在任何网关实例上设置 `GATEWAY_PROXY_URL`，它将转发到远程智能体而不是在本地运行一个。这对于任何平台适配器需要与智能体在不同环境中运行（网络隔离、端到端加密要求、资源限制）的部署都很有用。

:::tip
会话连续性通过 `X-Hermes-Session-Id` 头维持。主机的 API 服务器通过此 ID 跟踪会话，因此对话在消息之间持续存在，就像使用本地智能体一样。
:::

:::note
**限制 (v1)：** 来自远程智能体的工具进度消息不会被中继回 — 用户只看到流式传输的最终响应，而不是单个工具调用。危险命令批准提示在主机端处理，不会中继给 Matrix 用户。这些可以在未来的更新中解决。
:::

### 同步问题 / 机器人滞后

**原因**：长时间运行的工具执行可能会延迟同步循环，或者 homeserver 运行缓慢。

**解决**：同步循环在出错时每5秒自动重试一次。检查 Hermes 日志中是否有同步相关的警告。如果机器人持续滞后，请确保您的 homeserver 具有足够的资源。

### 机器人离线

**原因**：Hermes 网关未运行，或连接失败。

**解决**：检查 `hermes gateway` 是否正在运行。查看终端输出中的错误消息。常见问题：错误的 homeserver URL、过期的访问令牌、homeserver 不可达。

### "User not allowed" / 机器人忽略您

**原因**：您的用户ID不在 `MATRIX_ALLOWED_USERS` 中。

**解决**：将您的用户ID添加到 `~/.hermes/.env` 中的 `MATRIX_ALLOWED_USERS`，然后重启网关。使用完整的 `@user:server` 格式。

## 安全

:::warning
请务必设置 `MATRIX_ALLOWED_USERS` 以限制可与机器人交互的用户。若不设置，出于安全考虑，网关默认会拒绝所有用户访问。仅添加您信任的用户ID——授权用户将拥有对智能体全部功能的完全访问权限，包括工具使用和系统访问。
:::

关于保护您的 Hermes 智能体部署的更多信息，请参阅 [安全指南](../security.md)。

## 注意事项

- **任意主服务器**：兼容 Synapse、Conduit、Dendrite、matrix.org 或任何符合规范的 Matrix 主服务器。无需特定主服务器软件。
- **联邦**：如果您使用的是联邦主服务器，机器人可以与其他服务器的用户通信——只需将他们的完整 `@user:server` ID 添加到 `MATRIX_ALLOWED_USERS` 中即可。
- **自动加入**：机器人会自动接受房间邀请并加入。它会在加入后立即开始响应。
- **媒体支持**：Hermes 可以发送和接收图像、音频、视频和文件附件。媒体通过 Matrix 内容存储库 API 上传到您的主服务器。
- **原生语音消息 (MSC3245)**：Matrix 适配器会自动为传出的语音消息添加 `org.matrix.msc3245.voice` 标志。这意味着 TTS 响应和语音音频在 Element 及其他支持 MSC3245 的客户端中会显示为**原生气泡**，而不是通用的音频文件附件。带有 MSC3245 标志的传入语音消息也能被正确识别并路由到语音转文本转录功能。此功能无需配置，自动生效。