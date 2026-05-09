---
sidebar_position: 6
title: "Signal"
description: "通过 signal-cli 守护进程将 Hermes 智能体设置为 Signal 消息机器人"
---

# Signal 设置

Hermes 通过以 HTTP 模式运行的 [signal-cli](https://github.com/AsamK/signal-cli) 守护进程连接到 Signal。该适配器通过 SSE（服务器发送事件）实时流式传输消息，并通过 JSON-RPC 发送响应。

Signal 是最注重隐私的主流消息应用——默认端到端加密，协议开源，元数据收集最少。这使其成为对安全性要求较高的智能体工作流程的理想选择。

:::info 无需新的 Python 依赖
Signal 适配器使用 `httpx`（已是 Hermes 核心依赖项）进行所有通信。无需额外的 Python 包。您只需在外部安装 signal-cli。
:::

---

## 先决条件

- **signal-cli** — 基于 Java 的 Signal 客户端（[GitHub](https://github.com/AsamK/signal-cli)）
- **Java 17+** 运行时 — signal-cli 所需
- **一个已安装 Signal 的手机号码**（用于链接为辅助设备）

### 安装 signal-cli

```bash
# macOS
brew install signal-cli

# Linux（下载最新版本）
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} \
  https://github.com/AsamK/signal-cli/releases/latest | sed 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}.tar.gz"
sudo tar xf "signal-cli-${VERSION}.tar.gz" -C /opt
sudo ln -sf "/opt/signal-cli-${VERSION}/bin/signal-cli" /usr/local/bin/
```

:::caution
signal-cli **不在** apt 或 snap 仓库中。上述 Linux 安装直接从 [GitHub 发布页](https://github.com/AsamK/signal-cli/releases) 下载。
:::

## 步骤 1：关联您的 Signal 账户

signal-cli 作为**关联设备**运行 —— 类似于 WhatsApp Web，但适用于 Signal。您的手机仍为主设备。

```bash
# 生成关联 URI（显示二维码或链接）
signal-cli link -n "HermesAgent"
```

1. 在手机上打开 **Signal**
2. 进入 **设置 → 关联设备**
3. 点击 **关联新设备**
4. 扫描二维码或输入 URI

---

## 步骤 2：启动 signal-cli 守护进程

```bash
# 将 +1234567890 替换为您的 Signal 手机号码（E.164 格式）
signal-cli --account +1234567890 daemon --http 127.0.0.1:8080
```

:::提示
请保持此进程在后台运行。您可以使用 `systemd`、`tmux`、`screen` 或将其作为服务运行。
:::

验证其是否正在运行：

```bash
curl http://127.0.0.1:8080/api/v1/check
# 应返回：{"versions":{"signal-cli":...}}
```

---

## 步骤 3：配置 Hermes

最简单的方法：

```bash
hermes gateway setup
```

从平台菜单中选择 **Signal**。向导将执行以下操作：

1. 检查是否已安装 signal-cli
2. 提示输入 HTTP URL（默认值：`http://127.0.0.1:8080`）
3. 测试与守护进程的连接
4. 询问您的账户手机号码
5. 配置允许的用户和访问策略

### 手动配置

添加到 `~/.hermes/.env`：

```bash
# 必需
SIGNAL_HTTP_URL=http://127.0.0.1:8080
SIGNAL_ACCOUNT=+1234567890

# 安全性（推荐）
SIGNAL_ALLOWED_USERS=+1234567890,+0987654321    # 逗号分隔的 E.164 号码或 UUID

# 可选
SIGNAL_GROUP_ALLOWED_USERS=groupId1,groupId2     # 启用群组（省略表示禁用，* 表示全部）
SIGNAL_HOME_CHANNEL=+1234567890                  # 定时任务的默认投递目标
```

然后启动网关：

```bash
hermes gateway              # 前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅限 Linux：开机自启系统服务
```

---

## 访问控制

### 私信访问

私信访问遵循与所有其他 Hermes 平台相同的模式：

1. **设置了 `SIGNAL_ALLOWED_USERS`** → 只有这些用户可以发送消息
2. **未设置允许列表** → 未知用户会收到一个私信配对码（通过 `hermes pairing approve signal CODE` 批准）
3. **`SIGNAL_ALLOW_ALL_USERS=true`** → 任何人都可以发送消息（谨慎使用）

### 群组访问

群组访问由环境变量 `SIGNAL_GROUP_ALLOWED_USERS` 控制：

| 配置 | 行为 |
|---------------|----------|
| 未设置（默认） | 所有群组消息均被忽略。机器人仅响应私信。 |
| 设置为群组 ID | 仅监控列出的群组（例如：`groupId1,groupId2`）。 |
| 设置为 `*` | 机器人在其所属的任何群组中都会响应。 |

---

## 功能特性

### 附件

该适配器支持双向发送和接收媒体文件。

**传入**（用户 → 智能体）：

- **图像** — PNG、JPEG、GIF、WebP（通过魔数字节自动检测）
- **音频** — MP3、OGG、WAV、M4A（如果配置了 Whisper，语音消息将被转录）
- **文档** — PDF、ZIP 及其他文件类型

**传出**（智能体 → 用户）：

智能体可以通过响应中的 `MEDIA:` 标签发送媒体文件。支持以下投递方式：

- **图像** — `send_multiple_images` 和 `send_image_file` 将 PNG、JPEG、GIF、WebP 作为原生 Signal 附件发送
- **语音** — `send_voice` 将音频文件（OGG、MP3、WAV、M4A、AAC）作为附件发送
- **视频** — `send_video` 发送 MP4 视频文件
- **文档** — `send_document` 发送任意文件类型（PDF、ZIP 等）

所有传出媒体均通过 Signal 的标准附件 API 发送。与某些平台不同，Signal 在协议层面不区分语音消息和文件附件。

附件大小限制：**100 MB**（双向）。
:::警告
**Signal 服务器会对附件上传进行速率限制**，该适配器使用调度器进行多图发送，将图像分批为每组 32 张，并限制上传速度以匹配 Signal 服务器策略。
:::

### 原生格式化、回复引用和反应

Signal 消息以**原生格式化**方式呈现，而非字面 Markdown 字符。适配器将 Markdown（`**粗体**`、`*斜体*`、`` `代码` ``、`~~删除线~~`、`||剧透||`、标题）转换为 Signal 的 `bodyRanges`，以便文本在接收方客户端上显示为真实样式，而不是可见的 `**` / `` ` `` 字符。

**回复引用。** 当 Hermes 回复特定消息时，现在会发布一条引用原始消息的原生回复 —— 与 Signal 用户自己使用“回复”时看到的 UI 效果相同。对于响应入站消息而生成的回复，此功能是自动的。

**反应。** 智能体可以通过标准反应 API 对消息做出反应；反应在 Signal 中显示为所引用消息上的表情符号反应，而不是额外的文本。

这些功能均无需额外配置 —— 在最新 signal-cli 版本中默认启用。如果您的 `signal-cli` 版本过旧，Hermes 将回退到纯文本投递，并记录一次警告。

### 输入指示器

机器人在处理消息时会发送输入指示器，每 8 秒刷新一次。

### 手机号码脱敏

所有日志中的手机号码均会自动脱敏：
- `+15551234567` → `+155****4567`
- 这适用于 Hermes 网关日志和全局脱敏系统

### 自我笔记（单号码设置）

如果您在自有手机号码上运行 signal-cli 作为**关联的次要设备**（而非单独的机器人号码），则可以通过 Signal 的“自我笔记”功能与 Hermes 交互。

只需从手机给自己发送一条消息 —— signal-cli 会接收它，Hermes 将在同一对话中回复。

**工作原理：**
- “自我笔记”消息以 `syncMessage.sentMessage` 信封形式到达
- 适配器检测到这些消息是发送给机器人自身账户的，并将其作为常规入站消息处理
- 回显保护（发送时间戳跟踪）可防止无限循环 —— 机器人自己的回复会被自动过滤掉

**无需额外配置。** 只要 `SIGNAL_ACCOUNT` 与您的手机号码匹配，此功能就会自动生效。

### 健康监控

适配器监控 SSE 连接，并在以下情况下自动重新连接：
- 连接断开（采用指数退避：2 秒 → 60 秒）
- 120 秒内无活动（ping signal-cli 以验证）

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| 设置期间出现 **“无法访问 signal-cli”** | 确保 signal-cli 守护进程正在运行：`signal-cli --account +YOUR_NUMBER daemon --http 127.0.0.1:8080` |
| **未收到消息** | 检查 `SIGNAL_ALLOWED_USERS` 是否包含发件人的号码（E.164 格式，带 `+` 前缀） |
| **“signal-cli 未在 PATH 中找到”** | 安装 signal-cli 并确保其在 PATH 中，或使用 Docker |
| **连接不断断开** | 检查 signal-cli 日志中的错误。确保已安装 Java 17+。 |
| **群组消息被忽略** | 配置 `SIGNAL_GROUP_ALLOWED_USERS` 指定特定群组 ID，或设为 `*` 以允许所有群组。 |
| **机器人不响应任何人** | 配置 `SIGNAL_ALLOWED_USERS`，使用私信配对，或通过网关策略显式允许所有用户（如果您希望更广泛的访问权限）。 |
| **重复消息** | 确保只有一个 signal-cli 实例在监听您的手机号码 |

---

## 安全

:::警告
**始终配置访问控制。** 机器人默认具有终端访问权限。如果没有设置 `SIGNAL_ALLOWED_USERS` 或私信配对，网关将出于安全考虑拒绝所有入站消息。
:::

- 所有日志输出中的手机号码均已脱敏
- 使用私信配对或显式允许列表安全地引导新用户
- 除非明确需要群组支持，否则请保持群组禁用状态，或仅允许您信任的群组
- Signal 的端到端加密保护传输中的消息内容
- `~/.local/share/signal-cli/` 中的 signal-cli 会话数据包含账户凭据 —— 请像保护密码一样保护它

---

## 环境变量参考

| 变量 | 必需 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `SIGNAL_HTTP_URL` | 是 | — | signal-cli HTTP 端点 |
| `SIGNAL_ACCOUNT` | 是 | — | 机器人手机号码（E.164） |
| `SIGNAL_ALLOWED_USERS` | 否 | — | 逗号分隔的手机号码/UUID |
| `SIGNAL_GROUP_ALLOWED_USERS` | 否 | — | 要监控的群组 ID，或 `*` 表示全部（省略表示禁用群组） |
| `SIGNAL_ALLOW_ALL_USERS` | 否 | `false` | 允许任何用户交互（跳过允许列表） |
| `SIGNAL_HOME_CHANNEL` | 否 | — | 定时任务的默认投递目标 |