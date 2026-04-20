---
sidebar_position: 9
title: "Matrix"
description: "将 Hermes Agent 设置为 Matrix 机器人"
---

# Matrix 设置

Hermes Agent 集成了 Matrix，这是一个开放、去中心化的消息协议。Matrix 允许您运行自己的 homeserver，或使用像 matrix.org 这样的公共服务器——无论哪种方式，您都能掌控自己的通信。该机器人通过 `mautrix` Python SDK 连接，并通过 Hermes Agent 管道（包括工具使用、记忆和推理）处理消息，并实时响应。它支持文本、文件附件、图像、音频、视频以及可选的端到端加密（E2EE）。

Hermes 可与任何 Matrix homeserver 配合使用——Synapse、Conduit、Dendrite 或 matrix.org。

在开始设置之前，这里先解答大多数人最关心的问题：Hermes 连接后是如何工作的。

## Hermes 的行为方式

| 上下文 | 行为 |
|---------|----------|
| **私信（DMs）** | Hermes 会回复每一条消息。无需 `@提及`。每条 DM 都有独立的会话。设置 `MATRIX_DM_MENTION_THREADS=true` 可在 DM 中 `@提及` 机器人时自动开启线程。 |
| **房间（Rooms）** | 默认情况下，Hermes 需要 `@提及` 才会响应。设置 `MATRIX_REQUIRE_MENTION=false` 或将房间 ID 添加到 `MATRIX_FREE_RESPONSE_ROOMS` 以启用自由响应房间。房间邀请会自动接受。 |
| **线程（Threads）** | Hermes 支持 Matrix 线程（MSC3440）。如果您在某个线程中回复，Hermes 会将线程上下文与主房间时间线隔离。已参与过的线程无需再次提及即可继续对话。 |
| **自动线程（Auto-threading）** | 默认情况下，Hermes 会在房间内为每条回复自动创建线程。这有助于保持对话的独立性。设置 `MATRIX_AUTO_THREAD=false` 可禁用此功能。 |
| **多人共享房间** | 默认情况下，Hermes 会为每个用户在房间内隔离会话历史记录。同一房间中的两人不会共享同一条目，除非您明确关闭此功能。 |

:::tip
机器人会在被邀请时自动加入房间。只需将机器人的 Matrix 用户添加到任意房间，它就会加入并开始响应。
:::

### Matrix 中的会话模型

默认情况下：

- 每条私信（DM）对应一个独立会话  
- 每个线程对应一个独立命名空间  
- 共享房间中每个用户拥有各自的内部会话  

此行为由 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您希望整个房间共享单一对话时，才将其设为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话适用于协作型房间，但也意味着：

- 所有用户共享上下文增长和 token 消耗  
- 某人的长时间工具密集型任务可能导致他人上下文膨胀  
- 同一房间内一人正在进行的操作可能打断另一人的后续操作  

### 提及与线程配置

您可以通过环境变量或 `config.yaml` 配置提及和自动线程行为：

```yaml
matrix:
  require_mention: true           # 房间内需 @提及（默认：true）
  free_response_rooms:            # 免除提及要求的房间
    - "!abc123:matrix.org"
  auto_thread: true               # 自动为回复创建线程（默认：true）
  dm_mention_threads: false       # DM 中 @ 提及时创建线程（默认：false）
```

或通过环境变量：

```bash
MATRIX_REQUIRE_MENTION=true
MATRIX_FREE_RESPONSE_ROOMS=!abc123:matrix.org,!def456:matrix.org
MATRIX_AUTO_THREAD=true
MATRIX_DM_MENTION_THREADS=false
MATRIX_REACTIONS=true          # 默认：true — 处理过程中显示表情反应
```

:::tip 关闭反应
`MATRIX_REACTIONS=false` 可关闭机器人在接收消息上发布的处理生命周期表情反应（👀/✅/❌）。适用于不支持表情事件或希望减少干扰的房间。
:::

:::note
如果您是从未设置 `MATRIX_REQUIRE_MENTION` 的旧版本升级而来，此前机器人在房间中会对所有消息做出响应。要保留此行为，请设置 `MATRIX_REQUIRE_MENTION=false`。
:::

本指南将逐步引导您完成完整设置流程——从创建机器人账户到发送第一条消息。

## 步骤 1：创建机器人账户

您需要为机器人创建一个 Matrix 用户账户。以下是几种方法：

### 选项 A：在您自己的 homeserver 上注册（推荐）

如果您运行自己的 homeserver（Synapse、Conduit、Dendrite）：

1. 使用管理 API 或注册工具创建新用户：

```bash
# Synapse 示例
register_new_matrix_user -c /etc/synapse/homeserver.yaml http://localhost:8008
```

2. 选择一个用户名，例如 `hermes`——完整用户 ID 将是 `@hermes:your-server.org`。

### 选项 B：使用 matrix.org 或其他公共 homeserver

1. 访问 [Element Web](https://app.element.io) 并创建新账户。
2. 为您的机器人选择一个用户名（例如 `hermes-bot`）。

### 选项 C：使用您自己的账户

您也可以将 Hermes 作为您的个人用户使用。这意味着机器人将以您的身份发布内容——适合个人助理场景。

## 步骤 2：获取访问令牌

Hermes 需要一个访问令牌来与 homeserver 进行身份验证。您有两种选择：

### 选项 A：访问令牌（推荐）

获取令牌最可靠的方式：

**通过 Element：**
1. 使用机器人账户登录 [Element](https://app.element.io)。
2. 进入 **设置** → **帮助与关于**。
3. 向下滚动并展开 **高级选项**——访问令牌在此处显示。
4. **立即复制它**。

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

响应中包含 `access_token` 字段——复制它。

:::warning[保护您的访问令牌]
访问令牌对机器人的 Matrix 账户拥有完全访问权限。切勿公开分享或提交到 Git。如果泄露，请通过注销该用户的所有会话来撤销它。
:::

### 选项 B：密码登录

除了提供访问令牌，您还可以向 Hermes 提供机器人的用户 ID 和密码。启动时 Hermes 将自动登录。这种方式更简单，但密码会存储在您的 `.env` 文件中。

```bash
MATRIX_USER_ID=@hermes:your-server.org
MATRIX_PASSWORD=your-password
```

## 步骤 3：查找您的 Matrix 用户 ID

Hermes Agent 使用您的 Matrix 用户 ID 来控制谁可以与机器人交互。Matrix 用户 ID 遵循格式 `@username:server`。

要找到您的用户 ID：

1. 打开 [Element](https://app.element.io)（或您偏好的 Matrix 客户端）。
2. 点击头像 → **设置**。
3. 您的用户 ID 显示在个人资料顶部（例如 `@alice:matrix.org`）。

:::tip
Matrix 用户 ID 始终以 `@` 开头，并包含一个 `:` 后跟服务器名称。例如：`@alice:matrix.org`、`@bob:your-server.com`。
:::

## 步骤 4：配置 Hermes Agent

### 选项 A：交互式设置（推荐）

运行引导式设置命令：

```bash
hermes gateway setup
```

提示选择 **Matrix**，然后提供您的 homeserver URL、访问令牌（或用户 ID + 密码），以及允许的用户 ID。

### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env` 文件中：

**使用访问令牌：**

```bash
# 必需
MATRIX_HOMESERVER=https://matrix.example.org
MATRIX_ACCESS_TOKEN=***

# 可选：用户 ID（如果省略将从令牌自动检测）
# MATRIX_USER_ID=@hermes:matrix.example.org

# 安全：限制谁能与机器人交互
MATRIX_ALLOWED_USERS=@alice:matrix.example.org

# 多个允许的用户（逗号分隔）
# MATRIX_ALLOWED_USERS=@alice:matrix.example.org,@bob:matrix.example.org
```

**使用密码登录：**

```bash
# 必需
MATRIX_HOMESERVER=https://matrix.example.org
MATRIX_USER_ID=@hermes:matrix.example.org
MATRIX_PASSWORD=***

# 安全
MATRIX_ALLOWED_USERS=@alice:matrix.example.org
```

在 `~/.hermes/config.yaml` 中设置可选行为参数：

```yaml
group_sessions_per_user: true
```

- `group_sessions_per_user: true` 确保共享房间中每位参与者的上下文相互隔离

### 启动网关

配置完成后，启动 Matrix 网关：

```bash
hermes gateway
```

机器人应在几秒钟内连接到您的 homeserver 并开始同步。发送一条消息给它——无论是私信还是已加入的房间——以进行测试。

:::tip
您可以将 `hermes gateway` 作为后台进程或 systemd 服务运行以实现持久化操作。详见部署文档。
:::

## 端到端加密（E2EE）

Hermes 支持 Matrix 端到端加密，因此您可以在加密房间中与机器人聊天。

### 要求

E2EE 需要安装了加密扩展的 `mautrix` 库以及 `libolm` C 库：

```bash
# 安装带 E2EE 支持的 mautrix
pip install 'mautrix[encryption]'

# 或使用 hermes 额外组件安装
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

在 `~/.hermes/.env` 中添加：

```bash
MATRIX_ENCRYPTION=true
```

启用 E2EE 后，Hermes：

- 将加密密钥存储在 `~/.hermes/platforms/matrix/store/`（旧版安装：`~/.hermes/matrix/store/`）
- 首次连接时会上传设备密钥
- 自动解密传入消息并加密传出消息
- 受邀时自动加入加密房间

### 交叉签名验证（推荐）

如果您的 Matrix 账户启用了交叉签名（Element 中的默认设置），请设置恢复密钥，以便机器人在启动时能够自我签署其设备。否则，其他 Matrix 客户端可能在设备密钥轮换后拒绝与该机器人共享加密会话。

```bash
MATRIX_RECOVERY_KEY=EsT... 在此处填写您的恢复密钥
```

**在哪里找到它：** 在 Element 中，前往 **设置** → **安全与隐私** → **加密** → 您的恢复密钥（也称为“安全密钥”）。这是您在首次设置交叉签名时被要求保存的密钥。

每次启动时，如果设置了 `MATRIX_RECOVERY_KEY`，Hermes 将从 homeserver 的安全秘密存储中导入交叉签名密钥，并对当前设备签名。此操作幂等且可永久启用。

:::warning[删除加密存储]
如果您删除了 `~/.hermes/platforms/matrix/store/crypto.db`，机器人将失去其加密身份。简单地重启并使用相同的设备 ID **无法**完全恢复——homeserver 仍持有用旧身份密钥签署的一次性密钥，对等方无法建立新的 Olm 会话。

Hermes 在启动时会检测到此情况并拒绝启用 E2EE，日志中将显示：`设备 XXXX 在服务器上有用先前身份密钥签署的陈旧一次性密钥`。

**最简单恢复方法：生成新的访问令牌**（获得具有无陈旧密钥历史的全新设备 ID）。参见下文“从带有 E2EE 的旧版本升级”。这是最可靠的路径，且无需接触 homeserver 数据库。

**手动恢复**（高级——保持相同设备 ID）：

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
   或通过 Synapse 管理 API（注意对用户 ID 进行 URL 编码）：
   ```bash
   curl -X DELETE -H "Authorization: Bearer ADMIN_TOKEN" \
     'https://your-server/_synapse/admin/v2/users/%40hermes%3Ayour-server/devices/DEVICE_ID'
   ```
   注意：通过管理 API 删除设备也可能使关联的访问令牌失效。之后可能需要重新生成令牌。

2. 删除本地加密存储并重启 Hermes：
   ```bash
   rm -f ~/.hermes/platforms/matrix/store/crypto.db*
   # 重启 hermes
   ```

其他 Matrix 客户端（Element、matrix-commander）可能会缓存旧设备密钥。恢复后，在 Element 中输入 `/discardsession` 可强制与机器人建立新的加密会话。
:::

:::info
如果未安装 `mautrix[encryption]` 或缺少 `libolm`，机器人将自动回退到普通（未加密）客户端。日志中会显示警告信息。
:::

## 家庭房间

您可以指定一个“家庭房间”，机器人在其中发送主动消息（如定时任务输出、提醒和通知）。有两种设置方式：

### 使用斜杠命令

在任何机器人所在的 Matrix 房间中输入 `/sethome`，该房间将成为家庭房间。

### 手动配置

在 `~/.hermes/.env` 中添加：

```bash
MATRIX_HOME_ROOM=!abc123def456:matrix.example.org
```

:::tip
要查找房间 ID：在 Element 中，进入房间 → **设置** → **高级** → 显示的 **内部房间 ID** 即为此值（以 `!` 开头）。
:::

## 故障排除

### 机器人不响应消息

**原因**：机器人尚未加入房间，或 `MATRIX_ALLOWED_USERS` 不包含您的用户 ID。

**解决方法**：邀请机器人加入房间——它会在收到邀请时自动加入。确认您的用户 ID 已在 `MATRIX_ALLOWED_USERS` 中（使用完整的 `@user:server` 格式）。重启网关。

### 启动时出现“认证失败”/“whoami 失败”

**原因**：访问令牌或 homeserver URL 不正确。

**解决方法**：验证 `MATRIX_HOMESERVER` 指向正确的 homeserver（包含 `https://`，无尾部斜杠）。检查 `MATRIX_ACCESS_TOKEN` 是否有效——尝试用 curl 测试：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-server/_matrix/client/v3/account/whoami
```

如果返回您的用户信息，则令牌有效；若返回错误，请生成新令牌。

### “mautrix 未安装”错误

**原因**：未安装 `mautrix` Python 包。

**解决方法**：安装它：

```bash
pip install 'mautrix[encryption]'
```

或使用 Hermes 额外组件：

```bash
pip install 'hermes-agent[matrix]'
```

### 加密错误 / “无法解密事件”

**原因**：缺少加密密钥、未安装 `libolm`，或机器人的设备未被信任。

**解决方法**：
1. 确认系统已安装 `libolm`（见上文 E2EE 部分）。
2. 确保在 `.env` 中设置了 `MATRIX_ENCRYPTION=true`。
3. 在您的 Matrix 客户端（Element）中，进入机器人的个人资料 → 会话 → 验证/信任机器人的设备。
4. 如果机器人刚加入加密房间，它只能解密 *加入后* 发送的消息。之前的消息无法访问。

### 从带有 E2EE 的旧版本升级

:::tip
如果您还手动删除了 `crypto.db`，请参见上文 E2EE 部分的“删除加密存储”警告——需要额外步骤清除 homeserver 上的陈旧一次性密钥。
:::

如果您之前使用 Hermes 并设置了 `MATRIX_ENCRYPTION=true`，现在升级到使用新的基于 SQLite 的加密存储的版本，机器人的加密身份已更改。您的 Matrix 客户端（Element）可能缓存了旧的设备密钥，并拒绝与机器人共享加密会话。

**症状**：机器人连接并显示“E2EE 已启用”，但所有消息都显示“无法解密事件”，且机器人从不响应。

**发生了什么**：旧的加密状态（来自之前的 `matrix-nio` 或序列化式 `mautrix` 后端）与新 SQLite 加密存储不兼容。机器人创建了全新的加密身份，但您的 Matrix 客户端仍缓存着旧密钥，且不会与密钥变更后的设备共享房间加密会话。这是 Matrix 的安全特性——客户端将相同设备的新身份密钥视为可疑。

**解决方案**（一次性迁移）：

1. **生成新的访问令牌**以获得全新设备 ID。最简单的方法：

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

2. **删除旧加密状态**：

   ```bash
   rm -f ~/.hermes/platforms/matrix/store/crypto.db
   rm -f ~/.hermes/platforms/matrix/store/crypto_store.*
   ```

3. **设置您的恢复密钥**（如果您使用交叉签名——大多数 Element 用户都使用）。在 `~/.hermes/.env` 中添加：

   ```bash
   MATRIX_RECOVERY_KEY=EsT... 在此处填写您的恢复密钥
   ```

   这使得机器人在启动时能够使用交叉签名密钥自我签名，Element 会立即信任新设备。如果没有此设置，Element 可能将新设备视为未验证并拒绝共享加密会话。在 Element 的 **设置** → **安全与隐私** → **加密** 下找到您的恢复密钥。

4. **强制您的 Matrix 客户端轮换加密会话**。在 Element 中，打开与机器人的 DM 房间并输入 `/discardsession`。这将强制 Element 创建新的加密会话并与机器人的新设备共享。

5. **重启网关**：

   ```bash
   hermes gateway run
   ```

   如果设置了 `MATRIX_RECOVERY_KEY`，日志中应显示 `Matrix: 通过恢复密钥验证交叉签名`。

6. **发送新消息**。机器人现在应能正常解密并响应。

:::note
迁移后，*升级前* 发送的消息将无法解密——旧加密密钥已丢失。这仅影响过渡阶段；新消息可正常工作。
:::

:::tip
**新安装不受影响**。此迁移仅在您曾使用旧版 Hermes 配置过正常的 E2EE 设置并计划升级时才需要。

**为什么需要新访问令牌？** 每个 Matrix 访问令牌绑定到特定设备 ID。重用相同设备 ID 但使用新加密密钥会导致其他 Matrix 客户端不信任该设备（它们将变更的身份密钥视为潜在安全威胁）。新访问令牌可获得无陈旧密钥历史的新设备 ID，因此其他客户端会立即信任它。
:::

## 代理模式（macOS 上的 E2EE）

Matrix E2EE 需要 `libolm`，而该库无法在 macOS ARM64（Apple Silicon）上编译。`hermes-agent[matrix]` 额外组件仅限 Linux。如果您使用的是 macOS，代理模式允许您在 Linux VM 上的 Docker 容器中运行 E2EE，同时在 macOS 上原生运行实际代理，从而完全访问本地文件、内存和技能。

### 工作原理

```
macOS（主机）：
  └─ hermes gateway
       ├─ api_server 适配器 ← 监听 0.0.0.0:8642
       ├─ AIAgent ← 单一事实来源
       ├─ Sessions、memory、skills
       └─ 本地文件访问（Obsidian、项目等）

Linux VM（Docker）：
  └─ hermes gateway（代理模式）
       ├─ Matrix 适配器 ← E2EE 解密/加密
       └─ HTTP 转发 → macOS:8642/v1/chat/completions
           （无 LLM API 密钥、无代理、无推理）
```

Docker 容器仅处理 Matrix 协议 + E2EE。当消息到达时，它解密消息并通过标准 HTTP 请求转发给主机。主机运行代理，调用工具，生成响应，并将其流式传输回来。容器对响应进行加密并发送到 Matrix。所有会话统一——CLI、Matrix、Telegram 及其他任何平台共享相同的内存和对话历史。

### 步骤 1：配置主机（macOS）

启用 API 服务器，使主机能够接受来自 Docker 容器的请求。

在 `~/.hermes/.env` 中添加：

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=您的密钥
API_SERVER_HOST=0.0.0.0
```

- `API_SERVER_HOST=0.0.0.0` 绑定到所有接口，以便 Docker 容器可以访问它。
- `API_SERVER_KEY` 是非回环绑定的必需项。选择一个强随机字符串。
- API 服务器默认运行在端口 8642（可通过 `API_SERVER_PORT` 更改）。

启动网关：

```bash
hermes gateway
```

您应看到 API 服务器与其他已配置的平台一同启动。从 VM 验证其可达性：

```bash
# 从 Linux VM
curl http://<mac-ip>:8642/health
```

### 步骤 2：配置 Docker 容器（Linux VM）

容器需要 Matrix 凭据和代理 URL。它**不需要** LLM API 密钥。

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

      # 代理模式 — 转发到主机代理
      GATEWAY_PROXY_URL: "http://192.168.1.100:8642"
      GATEWAY_PROXY_KEY: "您的密钥"
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

这就是整个容器。无需 OpenRouter、Anthropic 或其他推理提供商的 API 密钥。

### 步骤 3：启动两者

1. 首先启动主机网关：
   ```bash
   hermes gateway
   ```

2. 启动 Docker 容器：
   ```bash
   docker compose up -d
   ```

3. 在加密的 Matrix 房间中发送消息。容器解密消息，转发给主机，并将响应流式传输回来。

### 配置参考

代理模式在**容器端**配置（轻量级网关）：

| 设置 | 描述 |
|---------|-------------|
| `GATEWAY_PROXY_URL` | 远程 Hermes API 服务器的 URL（例如 `http://192.168.1.100:8642`） |
| `GATEWAY_PROXY_KEY` | 用于身份验证的 Bearer 令牌（必须与主机上的 `API_SERVER_KEY` 匹配） |
| `gateway.proxy_url` | 与 `GATEWAY_PROXY_URL` 相同，但在 `config.yaml` 中 |

主机端需要：

| 设置 | 描述 |
|---------|-------------|
| `API_SERVER_ENABLED` | 设为 `true` |
| `API_SERVER_KEY` | Bearer 令牌（与容器共享） |
| `API_SERVER_HOST` | 设为 `0.0.0.0` 以允许网络访问 |
| `API_SERVER_PORT` | 端口号（默认：`8642`） |

### 适用于任何平台

代理模式不仅限于 Matrix。任何平台适配器都可以使用它——在任意网关实例上设置 `GATEWAY_PROXY_URL`，它将转发到远程代理而非本地运行。这在需要将平台适配器与代理部署在不同环境时非常有用（网络隔离、E2EE 需求、资源限制）。

:::tip
会话连续性通过 `X-Hermes-Session-Id` 标头维护。主机的 API 服务器根据此 ID 跟踪会话，因此跨消息的对话会像本地代理一样持续。
:::

:::note
**局限性（v1）**：来自远程代理的工具进度消息不会中继回——用户只看到流式传输的最终响应，而非单个工具调用。危险命令批准提示在主机端处理，不会转发给 Matrix 用户。未来更新可能会解决这些问题。
:::

### 同步问题 / 机器人落后

**原因**：长时间运行的执行可能延迟同步循环，或 homeserver 较慢。

**解决方法**：同步循环会在出错时自动每 5 秒重试一次。检查 Hermes 日志中的同步相关警告。如果机器人持续落后，请确保您的 homeserver 有足够的资源。

### 机器人离线

**原因**：Hermes 网关未运行，或连接失败。

**解决方法**：确认 `hermes gateway` 正在运行。查看终端输出中的错误信息。常见问题：错误的 homeserver URL、过期的访问令牌、homeserver 不可达。

### “用户不允许”/机器人忽略您

**原因**：您的用户 ID 不在 `MATRIX_ALLOWED_USERS` 中。

**解决方法**：将您的用户 ID 添加到 `~/.hermes/.env` 中的 `MATRIX_ALLOWED_USERS` 并重启网关。使用完整的 `@user:server` 格式。

## 安全性

:::warning
始终设置 `MATRIX_ALLOWED_USERS` 以限制谁能与机器人交互。没有它，网关默认拒绝所有用户以确保安全。仅添加您信任的人的 User ID——授权用户拥有代理的全部能力，包括工具使用和系统访问权限。
:::

有关保护 Hermes Agent 部署的更多信息，请参见 [安全指南](../security.md)。

## 备注

- **任意 homeserver**：与 Synapse、Conduit、Dendrite、matrix.org 或任何符合规范的 Matrix homeserver 兼容。无需特定的 homeserver 软件。
- **联邦**：如果您使用的是联邦 homeserver，机器人可以与来自其他服务器的用户通信——只需将他们的完整 `@user:server` ID 添加到 `MATRIX_ALLOWED_USERS`。
- **自动加入**：机器人会自动接受房间邀请并加入。加入后立即开始响应。
- **媒体支持**：Hermes 可发送和接收图像、音频、视频及文件附件。媒体通过 Matrix 内容仓库 API 上传到您的 homeserver。
- **原生语音消息（MSC3245）**：Matrix 适配器会自动为外发语音消息标记 `org.matrix.msc3245.voice` 标志。这意味着 TTS 响应和语音音频会在支持 MSC3245 的 Element 等客户端中显示为**原生语音气泡**，而非通用音频附件。带有 MSC3245 标志的传入语音消息也会被正确识别并路由到语音转文字转录。无需配置——此功能自动生效。