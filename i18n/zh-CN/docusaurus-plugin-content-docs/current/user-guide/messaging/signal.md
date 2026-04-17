---
sidebar_position: 6
title: "Signal"
description: "通过 signal-cli 守护进程设置 Hermes Agent 为 Signal 消息机器人"
---

# Signal 设置

Hermes 通过在 HTTP 模式下运行的 [signal-cli](https://github.com/AsamK/signal-cli) 守护进程连接到 Signal。适配器通过 SSE（服务器发送事件）实时流式传输消息，并通过 JSON-RPC 发送响应。

Signal 是最注重隐私的主流消息应用——默认端到端加密，开源协议，元数据收集极少。这使其成为安全敏感的 Agent 工作流的理想选择。

:::info 无需新的 Python 依赖
Signal 适配器使用 `httpx`（已是 Hermes 的核心依赖）进行所有通信。无需额外的 Python 包。您只需要外部安装 signal-cli 即可。
:::

---

## 先决条件

- **signal-cli** — 基于 Java 的 Signal 客户端 ([GitHub](https://github.com/AsamK/signal-cli))
- **Java 17+** 运行时环境 — signal-cli 所需
- **一个已安装 Signal 的手机号码**（用于作为次要设备关联）

### 安装 signal-cli

```bash
# macOS
brew install signal-cli

# Linux (下载最新版本)
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} \
  https://github.com/AsamK/signal-cli/releases/latest | sed 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}.tar.gz"
sudo tar xf "signal-cli-${VERSION}.tar.gz" -C /opt
sudo ln -sf "/opt/signal-cli-${VERSION}/bin/signal-cli" /usr/local/bin/
```

:::caution
signal-cli **不在** apt 或 snap 仓库中。上述 Linux 安装是从 [GitHub releases](https://github.com/AsamK/signal-cli/releases) 直接下载的。
:::

---

## 步骤 1：关联您的 Signal 账户

Signal-cli 作为**关联设备**工作——类似于 WhatsApp Web，但用于 Signal。您的手机仍是主要设备。

```bash
# 生成关联 URI（显示二维码或链接）
signal-cli link -n "HermesAgent"
```

1. 在您的手机上打开 **Signal**
2. 进入 **设置 → 已关联设备**
3. 点击 **关联新设备**
4. 扫描二维码或输入 URI

---

## 步骤 2：启动 signal-cli 守护进程

```bash
# 将 +1234567890 替换为您的 Signal 手机号码（E.164 格式）
signal-cli --account +1234567890 daemon --http 127.0.0.1:8080
```

:::tip
请保持此进程在后台运行。您可以使用 `systemd`、`tmux`、`screen` 或将其作为服务运行。
:::

验证其是否正在运行：

```bash
curl http://127.0.0.1:8080/api/v1/check
# 应返回: {"versions":{"signal-cli":...}}
```

---

## 步骤 3：配置 Hermes

最简单的方法：

```bash
hermes gateway setup
```

从平台菜单中选择 **Signal**。向导将执行以下操作：

1. 检查是否安装了 signal-cli
2. 提示输入 HTTP URL（默认：`http://127.0.0.1:8080`）
3. 测试与守护进程的连接性
4. 询问您的账户手机号码
5. 配置允许用户和访问策略

### 手动配置

添加到 `~/.hermes/.env`：

```bash
# 必需
SIGNAL_HTTP_URL=http://127.0.0.1:8080
SIGNAL_ACCOUNT=+1234567890

# 安全（推荐）
SIGNAL_ALLOWED_USERS=+1234567890,+0987654321    # 逗号分隔的 E.164 号码或 UUID

# 可选
SIGNAL_GROUP_ALLOWED_USERS=groupId1,groupId2     # 启用群组（省略禁用，* 表示所有）
SIGNAL_HOME_CHANNEL=+1234567890                  # 定时任务的默认接收目标
```

然后启动网关：

```bash
hermes gateway              # 前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅限 Linux：系统启动服务
```

---

## 访问控制

### 私信访问

私信访问遵循所有其他 Hermes 平台的相同模式：

1. **设置了 `SIGNAL_ALLOWED_USERS`** → 只有这些用户可以发送消息
2. **未设置白名单** → 未知用户会收到一个私信配对码（通过 `hermes pairing approve signal CODE` 批准）
3. **设置了 `SIGNAL_ALLOW_ALL_USERS=true`** → 任何人都可以发送消息（请谨慎使用）

### 群组访问

群组访问由 `SIGNAL_GROUP_ALLOWED_USERS` 环境变量控制：

| 配置 | 行为 |
|---------------|----------|
| 未设置（默认） | 所有群组消息均被忽略。机器人仅响应私信。 |
| 设置了群组 ID | 仅监控列出的群组（例如，`groupId1,groupId2`）。 |
| 设置为 `*` | 机器人会在其所属的任何群组中做出响应。 |

---

## 功能特性

### 附件

适配器支持双向发送和接收媒体。

**接收消息**（用户 → Agent）：

- **图片** — PNG、JPEG、GIF、WebP（通过魔术字节自动检测）
- **音频** — MP3、OGG、WAV、M4A（如果配置了 Whisper，语音消息将被转录）
- **文档** — PDF、ZIP 和其他文件类型

**发送消息**（Agent → 用户）：

Agent 可以通过响应中的 `MEDIA:` 标签发送媒体文件。支持以下交付方式：

- **图片** — `send_image_file` 以原生 Signal 附件形式发送 PNG、JPEG、GIF、WebP
- **语音** — `send_voice` 以附件形式发送音频文件（OGG、MP3、WAV、M4A、AAC）
- **视频** — `send_video` 发送 MP4 视频文件
- **文档** — `send_document` 发送任何文件类型（PDF、ZIP 等）

所有发送的媒体都通过 Signal 的标准附件 API。与某些平台不同，Signal 在协议级别上不区分语音消息和文件附件。

附件大小限制：**100 MB**（双向）。

### 输入指示器

机器人处理消息时会发送输入指示器，每 8 秒刷新一次。

### 手机号码脱敏

所有手机号码都会在日志中自动脱敏：
- `+15551234567` → `+155****4567`
- 这适用于 Hermes 网关日志和全局脱敏系统。

### 致自己笔记（单号码设置）

如果您将 signal-cli 作为您自己手机号码的**关联次要设备**运行（而不是单独的机器人号码），您可以通过 Signal 的“致自己笔记”功能与 Hermes 进行交互。

只需从您的手机向自己发送一条消息——signal-cli 就会捕获它，而 Hermes 会在同一对话中做出响应。

**工作原理：**
- “致自己笔记”消息以 `syncMessage.sentMessage` 封装形式到达
- 适配器检测到这些消息是发给机器人自己的账户的，并将其作为常规入站消息进行处理
- 回声保护（发送时间戳跟踪）防止无限循环——机器人自身的回复会自动过滤掉

**无需额外配置。** 只要 `SIGNAL_ACCOUNT` 与您的手机号码匹配，此功能就会自动工作。

### 健康监控

适配器监控 SSE 连接，如果发生以下情况，它会自动重新连接：
- 连接中断（带有指数退避：2秒 → 60秒）
- 检测到 120 秒内没有活动（向 signal-cli 发送心跳包进行验证）

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| 设置时遇到 **“无法连接到 signal-cli”** | 确保 signal-cli 守护进程正在运行：`signal-cli --account +您的号码 daemon --http 127.0.0.1:8080` |
| **未收到消息** | 检查 `SIGNAL_ALLOWED_USERS` 是否包含发送者的号码（E.164 格式，带 `+` 前缀） |
| **“signal-cli 未在 PATH 上找到”** | 安装 signal-cli 并确保它在您的 PATH 中，或使用 Docker |
| **连接持续中断** | 检查 signal-cli 日志中的错误。确保已安装 Java 17+。 |
| **忽略群组消息** | 使用特定的群组 ID 配置 `SIGNAL_GROUP_ALLOWED_USERS`，或使用 `*` 允许所有群组。 |
| **机器人对任何人都不响应** | 配置 `SIGNAL_ALLOWED_USERS`，使用私信配对，或如果需要更广泛的访问，通过网关策略明确允许所有用户。 |
| **重复消息** | 确保只有一个 signal-cli 实例正在监听您的手机号码 |

---

## 安全性

:::warning
**始终配置访问控制。** 默认情况下，机器人具有终端访问权限。如果没有设置 `SIGNAL_ALLOWED_USERS` 或进行私信配对，网关会出于安全考虑拒绝所有传入消息。
:::

- 所有手机号码都会在所有日志输出中脱敏
- 使用私信配对或明确的白名单来安全地添加新用户
- 除非您专门需要群组支持，否则请保持群组禁用，或仅白名单您信任的群组
- Signal 的端到端加密保护了传输中的消息内容
- `~/.local/share/signal-cli/` 中的 signal-cli 会话数据包含账户凭证——请像保护密码一样保护它

---

## 环境变量参考

| 变量 | 是否必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `SIGNAL_HTTP_URL` | 是 | — | signal-cli HTTP 端点 |
| `SIGNAL_ACCOUNT` | 是 | — | 机器人手机号码 (E.164) |
| `SIGNAL_ALLOWED_USERS` | 否 | — | 逗号分隔的手机号码/UUID |
| `SIGNAL_GROUP_ALLOWED_USERS` | 否 | — | 要监控的群组 ID，或 `*` 表示所有（省略则禁用群组） |
| `SIGNAL_ALLOW_ALL_USERS` | 否 | `false` | 允许任何用户互动（跳过白名单） |
| `SIGNAL_HOME_CHANNEL` | 否 | — | 定时任务的默认接收目标 |