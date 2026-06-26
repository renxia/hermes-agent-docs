---
sidebar_position: 6
title: "Signal"
description: "通过 signal-cli daemon 设置 Hermes 智能体为 Signal 消息传递机器人"
---

# Signal 设置

Hermes 通过运行在 HTTP 模式下的 [signal-cli](https://github.com/AsamK/signal-cli) daemon 连接到 Signal。适配器通过 SSE（Server-Sent Events，服务器发送事件）实时流式传输消息，并通过 JSON-RPC 发送响应。

Signal 是最注重隐私的主流消息传递工具——默认端到端加密、开源协议、最小化元数据收集。这使其成为安全敏感的智能体工作流理想的选择。

:::info 无需新的 Python 依赖
Signal 适配器使用 `httpx`（Hermes 的核心依赖）进行所有通信。不需要额外的 Python 包。您只需要外部安装 signal-cli。
:::

---

## 先决条件

- **signal-cli** — 基于 Java 的 Signal 客户端 ([GitHub](https://github.com/AsamK/signal-cli))
- **Java 17+** 运行时环境 — 由 signal-cli 要求
- **一个安装了 Signal 的电话号码**（用于作为次要设备进行链接）

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
signal-cli 不在 apt 或 snap 仓库中。上述 Linux 安装是从 [GitHub 发布版](https://github.com/AsamK/signal-cli/releases) 直接下载的。
:::

---

## 第 1 步：链接您的 Signal 账户

Signal-cli 作为**已链接设备**运行——类似于 WhatsApp Web，但针对 Signal。您的手机仍是主设备。

```bash
# 生成一个链接 URI（显示二维码或链接）
signal-cli link -n "HermesAgent"
```

1. 打开手机上的 **Signal**
2. 进入 **设置 → 已链接设备 (Linked Devices)**
3. 点击 **链接新设备 (Link New Device)**
4. 扫描二维码或输入 URI

---

## 第 2 步：启动 signal-cli Daemon

```bash
# 将 +1234567890 替换为您的 Signal 电话号码（E.164 格式）
signal-cli --account +1234567890 daemon --http 127.0.0.1:8080
```

:::tip
保持它在后台运行。您可以使用 `systemd`、`tmux`、`screen` 或将其作为服务运行。
:::

验证它是否正在运行：

```bash
curl http://127.0.0.1:8080/api/v1/check
# 应返回: {"versions":{"signal-cli":...}}
```

---

## 第 3 步：配置 Hermes

最简单的方法是：

```bash
hermes gateway setup
```

从平台菜单中选择 **Signal**。向导式设置程序将执行以下操作：

1. 检查是否安装了 signal-cli
2. 提示 HTTP URL（默认值：`http://127.0.0.1:8080`）
3. 测试与 daemon 的连接性
4. 询问您的账户电话号码
5. 配置允许的用户和访问策略

### 手动配置

添加到 `~/.hermes/.env`：

```bash
# 必需项
SIGNAL_HTTP_URL=http://127.0.0.1:8080
SIGNAL_ACCOUNT=+1234567890

# 安全设置（推荐）
SIGNAL_ALLOWED_USERS=+1234567890,+0987654321    # 用逗号分隔的 E.164 号码或 UUID

# 可选
SIGNAL_GROUP_ALLOWED_USERS=groupId1,groupId2     # 启用群组（省略则禁用，* 表示所有）
SIGNAL_HOME_CHANNEL=+1234567890                  # Cron 作业的默认交付目标
```

然后启动网关：

```bash
hermes gateway              # 前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅限 Linux: 开机时系统服务
```

---

## 访问控制

### 私聊 (DM) 访问

私聊访问遵循所有其他 Hermes 平台相同的模式：

1. **设置了 `SIGNAL_ALLOWED_USERS`** → 只有这些用户才能发送消息
2. **未设置允许列表** → 未知晓的用户会收到一个 DM 配对码（通过 `hermes pairing approve signal CODE` 进行批准）
3. **`SIGNAL_ALLOW_ALL_USERS=true`** → 任何人都可以发送消息（请谨慎使用）

### 群组访问

群组访问由 `SIGNAL_GROUP_ALLOWED_USERS` 环境变量控制：

| 配置 | 行为 |
|---|---|
| 未设置（默认） | 所有群组消息均被忽略。机器人只响应私聊消息。 |
| 设置了群组 ID | 只监控指定的群组（例如，`groupId1,groupId2`）。 |
| 设置为 `*` | 机器人会回复它所属于的任何群组。 |

---

## 功能特性

### 附件 (Attachments)

适配器支持双向发送和接收媒体内容。

**传入消息** (用户 → 智能体):

- **图片** — PNG, JPEG, GIF, WebP（通过魔术字节自动检测）
- **音频** — MP3, OGG, WAV, M4A（如果配置了 Whisper，则会转录语音消息）
- **文档** — PDF, ZIP 和其他文件类型

**传出消息** (智能体 → 用户):

智能体可以通过响应中的 `MEDIA:` 标签发送媒体文件。支持以下交付方法：

- **图片** — `send_multiple_images` 和 `send_image_file` 会以 Signal 原生附件的形式发送 PNG, JPEG, GIF, WebP
- **语音** — `send_voice` 以附件形式发送音频文件 (OGG, MP3, WAV, M4A, AAC)
- **视频** — `send_video` 发送 MP4 视频文件
- **文档** — `send_document` 发送任何文件类型（PDF, ZIP 等）

所有传出媒体都通过 Signal 的标准附件 API。与某些平台不同，Signal 在协议级别上不区分语音消息和文件附件。

附件大小限制：**100 MB**（双向）。
:::warning
**Signal 服务器会对附件上传进行限速**，适配器使用调度程序来处理多张图片发送，将图片分批成 32 张一组，并限制上传以匹配 Signal 服务器的策略。
:::

### 原生格式化、回复引用和反应 (Reactions)

Signal 消息以**原生格式**显示，而不是字面上的 markdown 字符。适配器会将 markdown（`**粗体**`、`*斜体*`、`` `代码` ``、`~~删除线~~`、`||剧透||`、标题）转换为 Signal 的 `bodyRanges`，从而使文本在接收者的客户端上以真实样式显示，而不是作为可见的 `**` / `` ` `` 字符。

**回复引用 (Reply quotes)。** 当 Hermes 回复某个特定消息时，它会发布一个原生回复，引用原始消息——这与 Signal 用户自己使用“回复”功能时看到的 UI 效果是一致的。对于对传入消息所产生的回复，这是自动完成的。

**反应 (Reactions)。** 智能体可以通过标准的反应 API 对消息做出反应；这些反应在 Signal 中显示为参考消息上的表情符号，而不是额外的文本。

这一切都不需要额外的配置——它在新版本的 signal-cli 中默认提供。如果您的 `signal-cli` 版本过旧，Hermes 会回退到纯文本交付并记录一次性警告。

### 输入状态指示 (Typing Indicators)

机器人会在处理消息时发送输入状态指示，每 8 秒刷新一次。

### 工具进度显示 (Tool Progress Display)

Signal 不支持编辑已发送的消息。因此，即使启用了 `/verbose` 模式，Hermes 也会在 Signal 上抑制网关的工具进度气泡，并为该平台保留一个非 `off` 的模式。

您仍然可以在 CLI 中看到工具活动，最终的 Signal 回复函中可以包含正常的助手输出。如果您需要在聊天中获得实时的每个工具进度，请使用支持消息编辑功能的即时通讯平台。

### 电话号码脱敏 (Phone Number Redaction)

所有电话号码都会在日志中自动脱敏：
- `+15551234567` → `+155****4567`
- 这适用于 Hermes 网关日志和全局脱敏系统。

### 个人笔记（单号设置）(Note to Self - Single-Number Setup)

如果您将 signal-cli 作为您自己手机号码上的**已链接次要设备**运行（而不是使用单独的机器人号码），您可以通过 Signal 的“个人笔记”（Note to Self）功能与 Hermes 进行交互。

只需从您的手机向自己发送一条消息——signal-cli 就会接收到，而 Hermes 会在同一对话中进行回复。

**工作原理：**
- “个人笔记”消息以 `syncMessage.sentMessage` 信封的形式到达
-适配器检测这些消息是否是发给机器人自身账户的，并将其作为常规传入消息进行处理
-回声保护（发送时间戳跟踪）防止无限循环——机器人的回复会被自动过滤掉

**无需额外的配置。** 只要 `SIGNAL_ACCOUNT` 与您的电话号码匹配，它就会自动工作。

### 健康监控 (Health Monitoring)

适配器会监控 SSE 连接，如果发生以下情况会自动重新连接：
- 连接中断（带有指数退避：2s → 60s）
- 检测到 120 秒内没有活动（ping signal-cli 进行验证）

---

## 故障排除 (Troubleshooting)

| 问题 | 解决方案 |
|---|---|
| **设置过程中“无法连接到 signal-cli”** | 确保 signal-cli daemon 正在运行：`signal-cli --account +YOUR_NUMBER daemon --http 127.0.0.1:8080` |
| **未收到消息** | 检查 `SIGNAL_ALLOWED_USERS` 是否包含发送者的 E.164 格式号码（带 `+` 前缀）。 |
| **“PATH 上找不到 signal-cli”** | 安装 signal-cli 并确保它在 PATH 中，或者使用 Docker。 |
| **连接持续中断** | 检查 signal-cli 日志中的错误。确保已安装 Java 17+。 |
| **群组消息被忽略** | 配置 `SIGNAL_GROUP_ALLOWED_USERS` 以指定群组 ID，或设置为 `*` 以允许所有群组。 |
| **机器人无人回复** | 配置 `SIGNAL_ALLOWED_USERS`、使用 DM 配对，或者如果您需要更广泛的访问权限，则通过网关策略显式允许所有用户。 |
| **重复消息** | 确保只有一个 signal-cli 实例正在监听您的电话号码。 |

---

## 安全性 (Security)

:::warning
**务必配置访问控制。** 机器人默认具有终端级别的访问权限。如果没有设置 `SIGNAL_ALLOWED_USERS` 或进行 DM 配对，网关将出于安全考虑拒绝所有传入消息。
:::

- 所有日志输出中的电话号码都已脱敏
- 使用 DM 配对或显式允许列表来安全地引入新用户
- 除非您特别需要群组支持，否则请保持群组功能禁用，或者只允许信任的群组
- Signal 的端到端加密保护消息内容在传输过程中是安全的
- `~/.local/share/signal-cli/` 中的 signal-cli 会话数据包含账户凭证——请像对待密码一样保护它

---

## 环境变量参考 (Environment Variables Reference)

| 变量 | 是否必需 | 默认值 | 描述 |
|---|---|---|---|
| `SIGNAL_HTTP_URL` | 是 | — | signal-cli HTTP 端点 |
| `SIGNAL_ACCOUNT` | 是 | — | 机器人电话号码（E.164） |
| `SIGNAL_ALLOWED_USERS` | 否 | — | 用逗号分隔的电话号码/UUID |
| `SIGNAL_GROUP_ALLOWED_USERS` | 否 | — | 要监控的群组 ID，或 `*` 表示所有（省略则禁用群组） |
| `SIGNAL_ALLOW_ALL_USERS` | 否 | `false` | 允许任何用户进行交互（跳过允许列表） |
| `SIGNAL_HOME_CHANNEL` | 否 | — | Cron 作业的默认交付目标 |