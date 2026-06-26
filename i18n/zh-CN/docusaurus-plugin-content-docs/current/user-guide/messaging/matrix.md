---
sidebar_position: 9
title: Matrix
description: "Set up Hermes Agent as a Matrix bot"
---

# Matrix 设置

Hermes 智能体与 Matrix 集成，Matrix 是一个开放的、联邦式的消息协议。Matrix 允许您运行自己的家庭服务器（homeserver），或使用 matrix.org 等公共服务器——无论哪种方式，您都掌握着自己通信的控制权。该机器人通过 `mautrix` Python SDK 连接，通过 Hermes 智能体管道（包括工具使用、记忆和推理）处理消息，并实时响应。它支持文本、文件附件、图像、音频、视频以及可选的端到端加密（E2EE）。

Hermes 可与任何 Matrix 家庭服务器（homeserver）配合使用——无论是 Synapse、Conduit、Dendrite 还是 matrix.org。

在设置之前，这是大多数人想知道的部分：一旦连接好，Hermes 会如何表现。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| **私聊 (DMs)** | Hermes 会响应每一条消息。无需 `@提及`。每个私聊都有自己的会话。设置 `MATRIX_DM_MENTION_THREADS=true`，当机器人被在私聊中 `@提及` 时，它将开始一个话题串。 |
| **群组 (Rooms)** | 默认情况下，Hermes 需要 `@提及` 才能响应。设置 `MATRIX_REQUIRE_MENTION=false` 或将房间 ID 添加到 `MATRIX_FREE_RESPONSE_ROOMS` 以实现自由回复的群组。房间邀请会自动接受。 |
| **话题串 (Threads)** | Hermes 支持 Matrix 话题串（MSC3440）。如果您在一个话题串中回复，Hermes 会保持该话题串与主房间时间线的隔离。机器人已参与的话题串无需再次提及即可进行回复。 |
| **自动生成话题串** | 默认情况下，Hermes 会为它在群组中响应的每条消息自动创建一个话题串。这有助于保持对话的独立性。设置 `MATRIX_AUTO_THREAD=false` 来禁用此功能。设置 `MATRIX_DM_AUTO_THREAD=true`（默认为 false）也可以为私聊消息自动创建话题串——这与仅在私聊中被 `@提及` 时才开始话题串的 `MATRIX_DM_MENTION_THREADS` 是不同的。 |
| **命令** | 当您的 Matrix 客户端发送时，Hermes 会接受正常的 `/commands`。如果您的客户端将 `/` 保留给本地命令，请使用 `!commands`；Hermes 会将已知的 `!command` 别名标准化为 `/command`。 |
| **交互式控制** | 危险命令的批准和 `/model` 的选择可以使用 Matrix 反应（reactions）。批准反应可以限制在请求该操作的用户身上。 |
| **思维和工具活动** | 当网关进度（gateway progress）启用时，Matrix 会使用带话题串、可编辑的思维/工具活动面板，因此更新内容不会淹没主房间时间线。 |
| **包含多个用户的共享房间** | 默认情况下，Hermes 在房间内为每个用户隔离会话历史记录。除非您明确禁用此功能，否则两个人在同一个房间中交谈时不会共享同一份转录记录。 |

:::tip
该机器人被邀请时会自动加入群组。只需将该机器人的 Matrix 用户邀请到任何一个房间，它就会加入并开始响应。
:::

## 能力矩阵

此表格基于 Matrix 适配器的能力声明和 Matrix 测试覆盖率。E2EE（端到端加密）是基于模式的，因为部署者可以选择是否禁用、机会性地使用或强制要求加密房间。

| Capability | Matrix |
|------------|--------|
| text | yes |
| threads | yes |
| reactions | yes |
| approvals | yes |
| model picker | yes |
| thinking panes | yes |
| images | yes |
| multiple images | yes |
| files | yes |
| voice/audio | yes |
| video | yes |
| E2EE | off / optional / required |
| diagnostics | yes |

### Matrix 中的会话模型

默认情况下：

- 每个私聊（DM）都有自己的会话。
- 每个线程都有自己的会话命名空间。
- 共享房间中的每个用户都有该房间内的独立会话。

这由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您明确想要为整个房间设置一个共享对话时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话对于协作房间可能很有用，但这同时也意味着：

- 用户们共享上下文增长和代币成本。
- 某个人耗时的、重度依赖工具的任务可能会使其他所有人的上下文膨胀。
- 某个人正在进行的任务可能会打断同一房间内另一个人后续的操作。

### 提及和线程配置

您可以通过环境变量或 `config.yaml` 配置提及和自动线程行为：

```yaml
matrix:
  require_mention: true           # 在房间中要求 @提及（默认值：true）
  allowed_users:                  # 允许触发智能体轮次的 Matrix 用户
    - "@alice:matrix.org"
  allowed_rooms:                  # 允许触发智能体轮次的 Matrix 房间
    - "!abc123:matrix.org"
  free_response_rooms:            # 免除提及要求的房间
    - "!abc123:matrix.org"
  ignore_user_patterns:           # 需要忽略的桥接/应用服务幽灵用户
    - "^@telegram_"
    - "^@whatsapp_"
  process_notices: false          # 默认忽略 m.notice
  session_scope: room             # auto|room|thread; 对于项目房间，推荐使用 room
  auto_thread: true               # 为回复自动创建线程（默认值：true）
  dm_mention_threads: false       # 在 DM 中 @提及时是否创建线程（默认值：false）
```

或者通过环境变量：

```bash
MATRIX_REQUIRE_MENTION=true
MATRIX_ALLOWED_USERS=@alice:matrix.org
MATRIX_ALLOWED_ROOMS=!abc123:matrix.org
MATRIX_FREE_RESPONSE_ROOMS=!abc123:matrix.org,!def456:matrix.org
MATRIX_IGNORE_USER_PATTERNS='^@telegram_,^@whatsapp_'
MATRIX_PROCESS_NOTICES=false
MATRIX_SESSION_SCOPE=room       # 对于稳定的项目房间上下文，推荐使用此设置
MATRIX_AUTO_THREAD=true
MATRIX_DM_MENTION_THREADS=false
MATRIX_REACTIONS=true          # 默认值：true — 处理过程中的表情符号反应
MATRIX_ALLOW_ROOM_MENTIONS=false
```

:::tip 取消禁用反应
`MATRIX_REACTIONS=false` 会关闭机器人对传入消息所做的处理生命周期内表情符号反应（👀/✅/❌）。这对于反应事件嘈杂或并非所有参与客户端都支持的房间特别有用。
:::

:::tip 房间范围内的提及
Hermes 会为明确的 Matrix ID，例如 `@alice:example.org` 发送结构化的 Matrix 用户提及。默认情况下，禁用房间范围内的 `@room` 通知；仅在允许机器人通知所有人的房间中设置 `MATRIX_ALLOW_ROOM_MENTIONS=true`。
:::

:::note
如果您是从没有 `MATRIX_REQUIRE_MENTION` 的版本升级而来，该机器人以前会响应房间中的所有消息。要保留这种行为，请设置 `MATRIX_REQUIRE_MENTION=false`。
:::

### 项目房间隔离

如果您在多个项目房间中使用同一个 Matrix 机器人，请配置稳定的房间范围会话：

```bash
MATRIX_SESSION_SCOPE=room
MATRIX_AUTO_THREAD=false
```

`MATRIX_SESSION_SCOPE` 支持以下选项：

| Scope | 行为 |
|-------|----------|
| `auto` | 向后兼容的默认设置。现有的 `MATRIX_AUTO_THREAD` 行为控制合成线程。 |
| `room` | 未分线程的房间消息保留在同一个稳定的房间会话中。真实的 Matrix 线程仍使用其线程根。 |
| `thread` | 未分线程的房间消息从触发事件 ID 合成一个线程/会话。 |

Hermes 现在会在智能体提示中包含当前的 Matrix 房间名称、房间 ID、主题、消息 ID 和一个 Matrix 房间边界注释。`/status` 也会显示当前的 Matrix 房间/会话范围，除非您明确使用 `/resume --cross-room <session name>`，否则 `/resume` 不会静默地恢复来自另一个 Matrix 房间的命名会话。

`MATRIX_SESSION_SCOPE=room` 控制着房间/线程通道。现有的 `group_sessions_per_user` 设置仍然控制该房间内的用户是否共享该通道。使用 `group_sessions_per_user: true`（默认值），Alice 和 Bob 会获得独立的 Project B 会话。使用 `group_sessions_per_user: false`，该房间将有一个共享的 Project B 记录。

本指南将引导您完成完整的设置过程——从创建机器人账户到发送第一条消息。

## 第 1 步：创建机器人账户

机器人需要一个 Matrix 用户账户。有几种方法可以做到这一点：

### 选项 A：在您的家庭服务器上注册（推荐）

如果您运行自己的家庭服务器（Synapse, Conduit, Dendrite）：

1. 使用管理 API 或注册工具创建一个新用户：

```bash
# Synapse 示例
register_new_matrix_user -c /etc/synapse/homeserver.yaml http://localhost:8008
```

2. 选择一个用户名，例如 `hermes`——完整的用户 ID 将是 `@hermes:your-server.org`。

### 选项 B：使用 matrix.org 或其他公共家庭服务器

1. 访问 [Element Web](https://app.element.io) 并创建一个新账户。
2. 为您的机器人选择一个用户名（例如 `hermes-bot`）。

### 选项 C：使用您自己的账户

您也可以将 Hermes 作为自己的用户运行。这意味着机器人以您的身份发布消息——这对于个人助理特别有用。

## 第 2 步：获取访问令牌

Hermes 需要一个访问令牌才能与家庭服务器进行身份验证。您有两种选择：

### 选项 A：访问令牌（推荐）

获取令牌的最可靠方法：

**通过 Element：**
1. 使用机器人账户登录 [Element](https://app.element.io)。
2. 转到 **设置** → **帮助和关于**。
3. 向下滚动并展开 **高级** — 访问令牌就在那里显示。
4. **立即复制它。**

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

响应中包含一个 `access_token` 字段——请复制它。

:::warning [保护好您的访问令牌]
访问令牌赋予了对机器人 Matrix 账户的完全访问权限。切勿公开分享或将其提交到 Git。如果泄露，请通过注销该用户的所有会话来撤销它。
:::

### 选项 B：密码登录

您不必提供访问令牌，而是可以提供 Hermes 的用户 ID 和密码。Hermes 会在启动时自动登录。这更简单，但意味着密码存储在您的 `.env` 文件中。

```bash
MATRIX_USER_ID=@hermes:your-server.org
MATRIX_PASSWORD=your-password
```

## 第 3 步：查找您的 Matrix 用户 ID

Hermes **智能体** 使用您的 Matrix 用户 ID 来控制谁可以与机器人进行交互。Matrix 用户 ID 遵循 `@用户名:服务器` 的格式。

要查找您的用户 ID：

1. 打开 [Element](https://app.element.io)（或您喜欢的 Matrix 客户端）。
2. 点击您的头像 → **设置**。
3. 您的用户 ID 显示在个人资料的顶部（例如 `@alice:matrix.org`）。

:::tip
Matrix 用户 ID 总是以 `@` 开头，并且包含一个 `:` 后跟服务器名称。例如：`@alice:matrix.org`、`@bob:your-server.com`。
:::

## 第 4 步：配置 Hermes 智能体

### 选项 A：交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

当提示时，选择 **Matrix**，然后提供您的家庭服务器 URL、访问令牌（或用户 ID + 密码）以及允许的用户 ID。

### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env` 文件中：

**使用访问令牌：**

```bash
# 必需
MATRIX_HOMESERVER=https://matrix.example.org
MATRIX_ACCESS_TOKEN=***

# 可选：用户 ID（如果省略，则从令牌自动检测）
# MATRIX_USER_ID=@hermes:matrix.example.org

# 安全性：限制谁可以与机器人交互
MATRIX_ALLOWED_USERS=@alice:matrix.example.org

# 可选：限制哪些房间可以触发智能体
MATRIX_ALLOWED_ROOMS=!abc123:matrix.example.org

# 多个允许的用户（逗号分隔）
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

## 私有部署加固

对于私有的 Matrix 部署，请设置用户和房间的允许列表。如果 `MATRIX_ALLOWED_USERS` 未设置，任何能够进入已加入房间并能联系到机器人的发送者都将触发一个智能体轮次。如果 `MATRIX_ALLOWED_ROOMS` 未设置，则机器人加入的任何房间都可能触发一个智能体轮次。锁定部署应同时设置两者：

```bash
MATRIX_ALLOWED_USERS=@alice:matrix.example.org,@bob:matrix.example.org
MATRIX_ALLOWED_ROOMS=!ops:matrix.example.org,!dmroom:matrix.example.org
```

桥接和应用服务部署需要额外的循环保护。Hermes 默认忽略自己的事件、本地部分以 `_` 开头的 Matrix 应用服务式用户、重复的事件 ID、旧的启动事件、编辑替换事件以及 `m.notice` 事件。当您的桥使用不同的命名约定时，请添加特定的部署幽灵模式：

```bash
MATRIX_IGNORE_USER_PATTERNS='^@telegram_,^@slack_,^@whatsapp_'
```

只有在可信的人工工作流程确实发送 `m.notice` 时，才启用通知：

```bash
MATRIX_PROCESS_NOTICES=true
```

默认禁用整个房间的传出通知。除非机器人被明确允许使用 `@room` 来唤醒整个房间，否则请保持 `MATRIX_ALLOW_ROOM_MENTIONS=false`。

诊断和调试负载会屏蔽 Matrix 访问令牌、恢复密钥、设备标识符和消息正文。媒体下载限制为 Matrix `mxc://` 内容 URI，并且当它们超过 `MATRIX_MAX_MEDIA_BYTES` 时会被拒绝。请将联邦房间和不受信任的家庭服务器视为不可信输入：保持房间允许列表严格，优先使用 DM 或私有房间进行重度任务，并避免授权桥接幽灵或应用服务傀儡为允许用户。

`~/.hermes/config.yaml` 中的可选行为设置：

```yaml
group_sessions_per_user: true
```

- `group_sessions_per_user: true` 使每个参与者的上下文在共享房间内保持隔离。

### 启动网关

配置完成后，请启动 Matrix 网关：

```bash
hermes gateway
```

机器人应该会在几秒钟内连接到您的家庭服务器并开始同步。发送一条消息——无论是 DM 还是在它已加入的房间中发送——进行测试。

:::tip 您可以将 `hermes gateway` 在后台运行或作为 systemd 服务来持久运行。请参阅部署文档以获取详细信息。
:::

## 端到端加密 (E2EE)

Hermes 支持 Matrix 端到端加密，因此您可以在加密房间中与您的机器人聊天。

### 要求

E2EE 需要 `mautrix` 库以及加密扩展和 `libolm` C 库：

```bash
# 安装支持 E2EE 的 mautrix
pip install 'mautrix[encryption]'

# 或使用 hermes 扩展进行安装
cd ~/.hermes/hermes-agent && uv pip install -e ".[matrix]"
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
MATRIX_E2EE_MODE=required
```

`MATRIX_E2EE_MODE` 支持以下选项：

| 模式 | 行为 |
|------|----------|
| `off` | 不初始化 Matrix E2EE。 |
| `optional` | 在有可用依赖时尝试 E2EE，但如果加密无法初始化，则保持非加密房间功能正常。 |
| `required` | 如果没有 E2EE 依赖或加密设置，则关闭（Fail closed）。 |

可选模式在加密设置不可用时可能会回退到非 E2EE 操作。而必需模式则会关闭而不是静默降级。

为了向后兼容性，`MATRIX_ENCRYPTION=true` 仍然启用必需的 E2EE 行为。

当启用 E2EE 时，Hermes 会：

- 在 `~/.hermes/platforms/matrix/store/` (旧版安装: `~/.hermes/matrix/store/`) 中存储加密密钥
- 在首次连接时上传设备密钥
- 自动解密传入的消息并加密传出的消息
- 在被邀请时自动加入加密房间

### Matrix 工具和控制

在 Matrix 会话中，Hermes 向智能体暴露了特定的 Matrix 工具：

- `matrix_send_reaction`
- `matrix_redact_message`
- `matrix_create_room`
- `matrix_invite_user`
- `matrix_fetch_history`
- `matrix_set_presence`

这些工具的作用域限定在 Matrix 上下文内，不可用于非 Matrix 工具集。管理员级别的工具默认是禁用的：消息审查需要 `MATRIX_TOOLS_ALLOW_REDACTION=true`，邀请需要 `MATRIX_TOOLS_ALLOW_INVITES=true`，房间创建需要 `MATRIX_TOOLS_ALLOW_ROOM_CREATE=true`。公共房间创建还需要 `MATRIX_ALLOW_PUBLIC_ROOMS=true`。
默认情况下，Matrix 工具仅限于当前的 Matrix 房间。明确的跨房间目标需要 `MATRIX_TOOLS_ALLOW_CROSS_ROOM=true`；消息审查和邀请类的跨房间操作还需 `MATRIX_TOOLS_ALLOW_CROSS_ROOM_DESTRUCTIVE=true`。如果设置了 `MATRIX_ALLOWED_ROOMS`，Matrix 工具可能只能针对这些房间进行操作。

反应控制功能使用：

- ✅ 一次性批准
- ♾️ 始终批准
- ❌ 否决
- 用于 `/model` 选择的数字反应

如果您有意希望房间内的任何授权 Matrix 用户都能操作审批/模型选择器提示，请设置 `MATRIX_APPROVAL_REQUIRE_SENDER=false`。默认情况下，当 Hermes 知道谁请求了该操作时，则限制为请求者。

### 媒体限制

Hermes 通过 Matrix 媒体 API 上传和下载 Matrix 图像、文件、音频和视频。多个生成的图像被作为一个有序的逻辑批次发送，从而保持跨批次的标题和线程上下文。

默认情况下，超过 100 MB 的 Matrix 媒体会在上传/下载前被拒绝。可以通过以下方式覆盖此限制：

```bash
MATRIX_MAX_MEDIA_BYTES=104857600
```

传入的媒体必须使用 Matrix `mxc://` 内容 URI。Hermes 会拒绝 Matrix 事件中任意的 HTTP(S) 媒体 URL，以避免将一个联邦房间变成一个不受限制的下载器。

## Synapse 集成测试

Hermes 提供了一个可选的 Synapse harness 用于本地验证：

```bash
docker compose -f tests/e2e/matrix_synapse_gateway/docker-compose.yml up -d
HERMES_MATRIX_SYNAPSE_INTEGRATION=1 \
  scripts/run_tests.sh -m "integration and matrix_synapse" \
  tests/e2e/matrix_synapse_gateway/test_gateway.py
docker compose -f tests/e2e/matrix_synapse_gateway/docker-compose.yml down -v
```

该 harness 通过 Synapse 的共享密钥注册创建临时用户，并覆盖私有房间的发送/接收、命名房间的邀请/加入、媒体上传/下载、机器人响应交付以及启动时的旧事件过滤。E2EE 的烟雾测试单独标记为 `matrix_e2ee`，以便它可以在开发者机器上保持可选状态。

### 交叉签名验证（推荐）

如果您的 Matrix 账户启用了交叉签名（Element 中的默认设置），请设置恢复密钥，以便机器人可以在启动时自我签名其设备。否则，其他 Matrix 客户端在设备密钥轮换后可能会拒绝与机器人共享加密会话。

```bash
MATRIX_RECOVERY_KEY=EsT... 您的恢复密钥
```

**在哪里找到它：** 在 Element 中，转到 **设置** → **安全和隐私** → **加密** → 您的恢复密钥（也称为“安全密钥”）。这是您首次设置交叉签名时被要求保存的密钥。

每次启动时，如果设置了 `MATRIX_RECOVERY_KEY`，Hermes 就会从 Homeserver 的安全秘密存储中导入交叉签名密钥并对当前设备进行签名。这是一种幂等且安全的永久启用状态。

如果 Hermes 自行生成了一个新的 Matrix 恢复密钥，它绝不会记录原始密钥。在启动前设置 `MATRIX_RECOVERY_KEY_OUTPUT_FILE=/secure/path/matrix-recovery-key.txt` 以写入一个生成的密钥（文件模式为 `0600`）；如果文件已存在，则不会被覆盖。

:::warning[删除加密存储]
如果您删除了 `~/.hermes/platforms/matrix/store/crypto.db` 文件，机器人就会失去其加密身份。简单地使用相同的设备 ID 重新启动**并不能**完全恢复——Homeserver 仍然保留了用旧身份密钥签名的一次性密钥，而对等节点无法建立新的 Olm 会话。

Hermes 在启动时会检测到这种情况，并拒绝启用 E2EE，日志中会显示：“device XXXX has stale one-time keys on the server signed with a previous identity key”（设备 XXXX 在服务器上拥有使用先前身份密钥签名的过期一次性密钥）。

**最简单的恢复方法：生成一个新的访问令牌**（这将获得一个没有过期密钥历史记录的新设备 ID）。请参阅下文“从旧版本升级并使用 E2EE”部分。这是最可靠的路径，可以避免触碰 Homeserver 数据库。

**手动恢复**（高级操作——保留相同的设备 ID）：

1. 停止 Synapse 并从其数据库中删除旧设备：
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
   或者通过 Synapse 管理 API（注意 URL 编码的用户 ID）：
   ```bash
   curl -X DELETE -H "Authorization: Bearer ADMIN_TOKEN" \
     'https://your-server/_synapse/admin/v2/users/%40hermes%3Ayour-server/devices/DEVICE_ID'
   ```
   注意：通过管理 API 删除设备也可能使相关的访问令牌失效。您可能需要随后生成一个新的令牌。

2. 删除本地加密存储并重新启动 Hermes：
   ```bash
   rm -f ~/.hermes/platforms/matrix/store/crypto.db*
   # 重新启动 hermes
   ```

其他 Matrix 客户端（Element, matrix-commander）可能会缓存旧的设备密钥。恢复后，请在 Element 中输入 `/discardsession` 以强制与机器人建立新的加密会话。
:::

:::info
如果未安装 `mautrix[encryption]` 或缺少 `libolm`，机器人会自动回退到纯（非加密）客户端。您将在日志中看到警告信息。
:::

## Home Room

你可以指定一个“主房间”（home room），机器人（bot）会向该房间发送主动消息（例如定时任务输出、提醒和通知）。有两种设置方法：

### 使用斜杠命令 (Slash Command)

在任何有此机器人的 Matrix 房间中输入 `/sethome`。该房间即成为主房间。
如果你的 Matrix 客户端拦截了斜杠命令，请改用 `!sethome`。

### 手动配置 (Manual Configuration)

将以下内容添加到你的 `~/.hermes/.env`：

```bash
MATRIX_HOME_ROOM=!abc123def456:matrix.example.org
```

## 房间允许列表（`allowed_rooms`）

限制机器人只能在固定的 Matrix 房间集合中活动。设置后，机器人**只**会在其 ID 出现在列表中的房间中回应——来自任何其他房间的消息都会被静默忽略，即使提到了机器人。

**私聊 (DMs) 是豁免此过滤的**，因此授权用户始终可以一对一地联系到机器人。

```yaml
matrix:
  allowed_rooms:
    - "!abc123def456:matrix.example.org"
    - "!opsroom789:matrix.example.org"
```

或者通过环境变量（逗号分隔）：

```bash
MATRIX_ALLOWED_ROOMS="!abc123def456:matrix.example.org,!opsroom789:matrix.example.org"
```

行为说明：

- 空白/未设置 → 无限制（默认）。
- 非空 → 房间 ID 必须在列表中。此检查在任何其他门控（提及要求、发送者允许列表等）之前运行。
- 请使用房间的**内部 ID** (`!abc...:server`)，而不是其别名（`#room:server`）。你可以在 Element 中通过“房间”→“设置”→“高级”找到房间的内部 ID。

另请参阅：[admin/user 斜杠命令拆分](../../reference/slash-commands.md#permissions-and-adminuser-split)。

:::tip
要查找房间 ID：在 Element 中，进入该房间 → **设置** → **高级** → 即可看到**内部房间 ID**（以 `!` 开头）。
:::

## Matrix 中的命令

Hermes 支持与它在其他消息平台上的支持相同的网关命令，包括 `/commands`、`/model`、`/stop`、`/queue`、`/steer`、`/goal`、`/subgoal`、`/background`、`/bg`、`/btw`、`/tasks` 和 `/yolo`。

某些 Matrix 客户端会保留开头的 `/` 用于本地客户端命令，可能不会将未知的斜杠命令发送到房间中。在这种情况下，请使用 `!` 作为 Matrix 安全的别名：

```text
!commands
!model
!model gpt-5.5 --provider openrouter
!queue continue with the next task
!stop
```

只有当 `!command` 是网关知晓、注册插件命令或已安装技能命令时，Hermes 才会对其进行标准化。普通的感叹词，例如 `!important`，仍然是普通聊天消息。

## 故障排除 (Troubleshooting)

### 机器人没有对消息做出回应

**原因**: 机器人尚未加入房间，`MATRIX_ALLOWED_USERS` 中不包含你的用户 ID，`MATRIX_ALLOWED_ROOMS` 中不包含该房间，或者房间消息中没有提及机器人。

**修复**: 将机器人邀请到房间——它会自动接受邀请。请验证你的用户 ID 是否在 `MATRIX_ALLOWED_USERS` 中（使用完整的 `@user:server` 格式），并且如果配置了允许列表，则房间 ID 是否在 `MATRIX_ALLOWED_ROOMS` 中。在房间中提及机器人或将该房间添加到 `MATRIX_FREE_RESPONSE_ROOMS`。重启网关。

### 机器人加入房间但静默丢弃所有消息（时钟偏差）

**原因**: 主机的系统时钟超前于实际时间。Matrix 适配器对来自初始同步重放的事件应用了一个 5 秒启动容忍过滤器（`event_ts < startup_ts - 5`），以忽略这些事件。当墙上时钟超前时，每个传入事件看起来都“比启动更老”，在到达消息处理器之前就被丢弃了——机器人看起来已连接但从未回复。请参阅 [#12614](https://github.com/NousResearch/hermes-agent/issues/12614)。

**症状**: 网关日志显示 `Matrix: dropped N live events as 'too old' more than 30s after startup`（矩阵：在启动后 30 秒以上丢弃了 N 个“太旧”的实时事件）。

**修复**: 使用 NTP 同步主机时钟并重启机器人：

```bash
# Debian/Ubuntu
sudo timedatectl set-ntp true
timedatectl status   # 确认显示 "System clock synchronized: yes"

# macOS
sudo sntp -sS time.apple.com
```

### 启动时出现“Failed to authenticate” / “whoami failed”错误

**原因**: 访问令牌或主服务器 URL 不正确。

**修复**: 验证 `MATRIX_HOMESERVER` 指向你的主服务器（包含 `https://`，不带尾随斜杠）。检查 `MATRIX_ACCESS_TOKEN` 是否有效——尝试使用 curl：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-server/_matrix/client/v3/account/whoami
```

如果这返回了你的用户信息，则令牌有效。如果它返回错误，请生成一个新的令牌。

### “mautrix not installed” 错误

**原因**: `mautrix` Python 包未安装。

**修复**: 安装它：

```bash
pip install 'mautrix[encryption]'
```

或者使用 Hermes 扩展包：

```bash
cd ~/.hermes/hermes-agent && uv pip install -e ".[matrix]"
```

### 加密错误 / “could not decrypt event”

**原因**: 缺少加密密钥，未安装 `libolm`，或机器人的设备不被信任。

**修复**:
1. 验证你的系统上已安装 `libolm`（请参阅上面的 E2EE 部分）。
2. 确保 `.env` 中设置了 `MATRIX_ENCRYPTION=true`。
3. 在你的 Matrix 客户端（Element）中，进入机器人的个人资料 -> 会话 (Sessions) -> 验证/信任机器人的设备。
4. 如果机器人刚刚加入一个加密房间，它只能解密*之后*它加入的消息。旧消息是无法访问的。

### 从旧版本升级并使用 E2EE

:::tip
如果你也手动删除了 `crypto.db`，请参阅 E2EE 部分中的“删除加密存储”警告——有额外的步骤来清除主服务器上的过期一次性密钥。
:::

如果你以前使用 `MATRIX_ENCRYPTION=true` 的 Hermes，并正在升级到一个使用新的基于 SQLite 的加密存储的版本，那么机器人的加密身份已经发生了变化。你的 Matrix 客户端（Element）可能会缓存旧的设备密钥，并拒绝与机器人共享加密会话。

**症状**: 机器人连接上并显示日志中的“E2EE enabled”（E2EE 已启用），但所有消息都显示“could not decrypt event”（无法解密事件），而机器人从未回复。

**发生了什么**: 旧的加密状态（来自以前的 `matrix-nio` 或基于序列化的 `mautrix` 后端）与新的 SQLite 加密存储不兼容。机器人创建了一个全新的加密身份，但你的 Matrix 客户端仍然缓存着旧密钥，因此无法与一个密钥已更改的设备共享房间的加密会话。这是一个 Matrix 的安全功能——客户端会将同一设备的身份密钥发生变化视为可疑情况。

**修复**（一次性迁移）：

1. **生成一个新的访问令牌**以获得新的设备 ID。最简单的方法：

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

2. **删除旧的加密状态**：

   ```bash
   rm -f ~/.hermes/platforms/matrix/store/crypto.db
   rm -f ~/.hermes/platforms/matrix/store/crypto_store.*
   ```

3. **设置你的恢复密钥**（如果你使用交叉签名——大多数 Element 用户都使用）。添加到 `~/.hermes/.env`：

   ```bash
   MATRIX_RECOVERY_KEY=EsT... your recovery key here
   ```

   这使得机器人可以在启动时使用交叉签名密钥进行自我签名，从而让 Element 立即信任新设备。如果没有这个设置，Element 可能会将新设备视为未经验证并拒绝共享加密会话。在 Element 中，进入**设置** → **安全与隐私** → **加密**下查找你的恢复密钥。

4. **强制你的 Matrix 客户端轮换加密会话**。在 Element 中，打开与机器人的私聊房间，然后输入 `/discardsession`。这会强制 Element 创建一个新的加密会话并与机器人的新设备共享它。

5. **重启网关**:

   ```bash
   hermes gateway run
   ```

   如果设置了 `MATRIX_RECOVERY_KEY`，你应该在日志中看到 `Matrix: cross-signing verified via recovery key`（矩阵：通过恢复密钥验证交叉签名）。

6. **发送一条新消息**。机器人应该能够解密并正常回复。

:::note
迁移后，*在此次升级之前*发送的消息将无法被解密——旧的加密密钥已经消失了。这只影响过渡期；新消息可以正常工作。
:::

:::tip
**新安装的用户不受此影响。** 只有如果你有一个使用旧版 Hermes 的有效 E2EE 设置并正在进行升级时，才需要执行此迁移。

**为什么需要新的访问令牌？** 每个 Matrix 访问令牌都绑定到一个特定的设备 ID。重复使用相同的设备 ID 但使用了新的加密密钥，会导致其他 Matrix 客户端不信任该设备（它们将身份密钥的变化视为潜在的安全漏洞）。一个新的访问令牌会获得一个新的设备 ID，没有陈旧的密钥历史，因此其他客户端会立即信任它。
:::

## Proxy Mode (E2EE on macOS)

Matrix E2EE 需要 `libolm`，而 `libolm` 不支持在 macOS ARM64（Apple Silicon）上编译。`hermes-agent[matrix]` 扩展仅限 Linux。如果你在使用 macOS，代理模式（proxy mode）允许你在 Linux VM 上的 Docker 容器中运行 E2EE，而实际的智能体则原生运行在 macOS 上，可以完全访问你的本地文件、内存和技能。

### 工作原理

```
macOS (宿主机):
  └─ hermes gateway
       ├─ api_server adapter ← 在 0.0.0.0:8642 上监听
       ├─ AIAgent ← 单一真相来源
       ├─ 会话、内存、技能
       └─ 本地文件访问（Obsidian, 项目等）

Linux VM (Docker):
  └─ hermes gateway (代理模式)
       ├─ Matrix adapter ← E2EE 解密/加密
       └─ HTTP forward → macOS:8642/v1/chat/completions
           (不涉及 LLM API 密钥，不涉及智能体，不进行推理)
```

Docker 容器只处理 Matrix 协议 + E2EE。当一条消息到达时，它会解密消息并通过标准的 HTTP 请求转发给宿主机。宿主机运行智能体，调用工具，生成响应，然后将其流式传输回来。容器负责加密并将响应发送回 Matrix。所有会话都是统一的——CLI、Matrix、Telegram 和任何其他平台共享相同的内存和对话历史记录。

### 第 1 步：配置宿主机 (macOS)

启用 API 服务器，以便宿主机可以接受来自 Docker 容器的传入请求。

添加到 `~/.hermes/.env`：

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=your-secret-key-here
API_SERVER_HOST=0.0.0.0
```

- `API_SERVER_HOST=0.0.0.0` 会绑定到所有接口，从而使 Docker 容器能够访问它。
- `API_SERVER_KEY` 是非回环绑定所需的。请选择一个强大的随机字符串。
- API 服务器默认在 8642 端口上运行（如果需要，可以通过 `API_SERVER_PORT` 进行更改）。

启动网关：

```bash
hermes gateway
```

你应该看到 API 服务器与你配置的任何其他平台一起启动。请验证它是否可以从 VM 访问：

```bash
# 从 Linux VM
curl http://<mac-ip>:8642/health
```

### 第 2 步：配置 Docker 容器 (Linux VM)

该容器需要 Matrix 凭证和代理 URL。它不需要 LLM API 密钥。

**`docker-compose.yml`:**

```yaml
services:
  hermes-matrix:
    build: .
    environment:
      # Matrix 凭证
      MATRIX_HOMESERVER: "https://matrix.example.org"
      MATRIX_ACCESS_TOKEN: "syt_..."
      MATRIX_ALLOWED_USERS: "@you:matrix.example.org"
      MATRIX_ENCRYPTION: "true"
      MATRIX_DEVICE_ID: "HERMES_BOT"

      # 代理模式 — 转发到宿主机智能体
      GATEWAY_PROXY_URL: "http://192.168.1.100:8642"
      GATEWAY_PROXY_KEY: "your-secret-key-here"
    volumes:
      - ./matrix-store:/root/.hermes/platforms/matrix/store
```

**`Dockerfile`:**

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y libolm-dev && rm -rf /var/lib/apt/lists/*
RUN cd ~/.hermes/hermes-agent && uv pip install -e ".[matrix]"

CMD ["hermes", "gateway"]
```

这就是整个容器。不需要 OpenRouter、Anthropic 或任何推理提供商的 API 密钥。

### 第 3 步：启动两者

1. 先启动宿主机网关：
   ```bash
   hermes gateway
   ```

2. 启动 Docker 容器：
   ```bash
   docker compose up -d
   ```

3. 在加密的 Matrix 房间中发送消息。容器解密它，将其转发给宿主机，然后流式传输响应回来。

### 配置参考

代理模式是在**容器端**（即轻量级的网关）配置的：

| 设置 | 描述 |
|---------|-------------|
| `GATEWAY_PROXY_URL` | 远程 Hermes API 服务器的 URL (例如：`http://192.168.1.100:8642`) |
| `GATEWAY_PROXY_KEY` | 用于身份验证的 Bearer token (必须与宿主机上的 `API_SERVER_KEY` 匹配) |
| `gateway.proxy_url` | 与 `GATEWAY_PROXY_URL` 相同，但用于 `config.yaml` |

宿主机端需要：

| 设置 | 描述 |
|---------|-------------|
| `API_SERVER_ENABLED` | 设置为 `true` |
| `API_SERVER_KEY` | Bearer token (与容器共享) |
| `API_SERVER_HOST` | 设置为 `0.0.0.0` 以便网络访问 |
| `API_SERVER_PORT` | 端口号 (默认: `8642`) |

### 可用于任何平台

代理模式并非仅限于 Matrix。任何平台适配器都可以使用它——在任何网关实例上设置 `GATEWAY_PROXY_URL`，它就会转发到远程智能体，而不是本地运行一个。这对于需要在不同环境（网络隔离、E2EE 要求、资源限制）中运行平台适配器的任何部署都非常有用。

:::tip
会话连续性通过 `X-Hermes-Session-Id` 标头来维护。宿主机的 API 服务器通过此 ID 跟踪会话，因此对话可以像与本地智能体一样跨消息保持一致。
:::

:::note
**限制 (v1)：** 来自远程智能体的工具进度消息不会被回传——用户只能看到流式传输的最终响应，而看不到单个工具调用。危险命令审批提示是在宿主机端处理的，不会转发给 Matrix 用户。这些问题将在未来的更新中解决。
:::

### 机器人连接并发送，但忽略传入的消息

**原因**: Matrix 事件处理器仅在通过 mautrix 的 `handle_sync()` 机制分派同步负载时才会触发。一个从不调用 `handle_sync()` 的原始 `client.sync()` 轮询可能会使适配器保持连接状态（发送功能正常），而传入的消息永远不会到达 `_on_room_message`。

**修复**: Hermes 使用了一个显式的同步循环，它在初始同步和每一次增量同步响应时都调用 `client.handle_sync()`。这与上游问题 #7914 和已关闭的 PR #37807 的诊断相匹配，但它保留了 Hermes 自己的后台维护任务（房间加入跟踪、邀请处理、E2EE 密钥共享），而不是将完整的生命周期委托给 `client.start()`。如果网关重启后传入消息仍然失败，请验证处理器是否在第一次同步之前注册，并检查日志中是否有 `sync event dispatch error`。

### 同步问题 / 机器人落后

**原因**: 长时间运行的工具执行可能会延迟同步循环，或者 Homeserver 运行缓慢。

**修复**: 同步循环会在出错时自动重试 5 秒。请检查 Hermes 日志中的与同步相关的警告。如果机器人持续落后，请确保你的 homeserver 具有足够的资源。

### 机器人离线

**原因**: Hermes 网关没有运行，或者它未能连接。

**修复**: 检查 `hermes gateway` 是否正在运行。查看终端输出以查找错误消息。常见问题：Homeserver URL 错误、访问令牌过期、homeserver 不可达。

### “用户不被允许” / 机器人忽略你

**原因**: 你的用户 ID 不在 `MATRIX_ALLOWED_USERS` 中。

**修复**: 将你的用户 ID 添加到 `~/.hermes/.env` 中的 `MATRIX_ALLOWED_USERS`，并重启网关。请使用完整的 `@user:server` 格式。

### 机器人忽略整个房间

**原因**: 设置了 `MATRIX_ALLOWED_ROOMS` 并且当前房间 ID 不在列表中，或者该房间要求提及（mention），而消息中没有提到机器人。

**修复**: 将房间 ID 添加到 `MATRIX_ALLOWED_ROOMS` 中，或者如果这是一个私人部署，则移除房间白名单。要在 Element 中查找房间 ID，请打开房间设置并检查“高级”选项。

### 桥接消息循环或回显

**原因**: 一个桥接/应用服务正在将机器人的输出作为新的用户消息进行中继，或者一个桥接使用了非标准的幽灵用户 ID。

**修复**: 将桥接的幽灵用户排除在 `MATRIX_ALLOWED_USERS` 之外，添加匹配的 `MATRIX_IGNORE_USER_PATTERNS` 条目，除非通知是可信工作流程的一部分，否则将 `MATRIX_PROCESS_NOTICES=false`。

## 安全性

:::warning
始终设置 `MATRIX_ALLOWED_USERS`，并且对于共享/私有部署，设置 `MATRIX_ALLOWED_ROOMS`。如果没有这些设置，任何可以在加入的房间中向机器人发送消息的人都可能触发该智能体。只授权你信任的人和房间——授权用户对智能体的能力拥有完全访问权限，包括工具使用和系统访问。
:::

有关保护你的 Hermes 智能体部署的更多信息，请参阅 [安全指南](../security.md)。

## 说明

- **任何 homeserver**: 可与 Synapse、Conduit、Dendrite、matrix.org 或任何符合规范的 Matrix homeserver 配合使用。无需特定的 homeserver 软件。
- **联邦制 (Federation)**: 如果你使用的是联邦 homeserver，机器人可以与来自其他服务器的用户进行通信——只需将他们的完整 `@user:server` ID 添加到 `MATRIX_ALLOWED_USERS` 中即可。
- **自动加入**: 机器人会自动接受房间邀请并加入。它在加入后立即开始响应。
- **媒体支持**: Hermes 可以发送和接收图片、音频、视频和文件附件。媒体会使用 Matrix 内容存储库 API 上传到你的 homeserver。
- **原生语音消息 (MSC3245)**: Matrix 适配器会自动为传出的语音消息添加 `org.matrix.msc3245.voice` 标志。这意味着 TTS 响应和语音音频在支持 MSC3245 的 Element 和其他客户端中被渲染为**原生语音气泡**，而不是通用的音频文件附件。传入的带有 MSC3245 标志的语音消息也会被正确识别并路由到语音转文字稿。无需配置——这会自动工作。