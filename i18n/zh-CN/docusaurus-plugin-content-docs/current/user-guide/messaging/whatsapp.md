---
sidebar_position: 5
title: "WhatsApp"
description: "通过内置的 Baileys 桥接将 Hermes 智能体设置为 WhatsApp 机器人"
---

# WhatsApp 设置

Hermes 通过一个基于 **Baileys** 的内置桥接连接到 WhatsApp。其工作原理是模拟一个 WhatsApp Web 会话——**而非**通过官方的 WhatsApp Business API。无需 Meta 开发者账户或企业验证。

> 运行 `hermes gateway setup` 并选择 **WhatsApp**，即可获得引导式设置流程。

:::warning 非官方 API — 封号风险
WhatsApp **并非**官方支持 Business API 之外的第三方机器人。使用第三方桥接存在账户被限制的小风险。为降低风险：
- **使用专用手机号码**用于机器人（不要使用个人号码）
- **不要发送批量/垃圾信息** — 保持对话式使用
- **不要向未主动发消息的人自动发送消息**
:::

:::warning WhatsApp Web 协议更新
WhatsApp 会定期更新其 Web 协议，这可能会暂时中断与第三方桥接的兼容性。此时，Hermes 将更新桥接依赖。如果在 WhatsApp 更新后机器人停止工作，请拉取最新的 Hermes 版本并重新配对。
:::

## 两种模式

| 模式 | 工作原理 | 最适用于 |
|------|----------|----------|
| **单独的机器人号码**（推荐） | 为机器人指定一个专用手机号码。用户直接向该号码发消息。 | 清晰的用户体验、多用户、较低封号风险 |
| **个人自我聊天** | 使用您自己的 WhatsApp。您向自己发消息以与智能体交谈。 | 快速设置、单用户、测试 |

---

# WhatsApp 集成

## 前提条件

- **Node.js v18+** 和 **npm** — WhatsApp 网桥以 Node.js 进程运行
- **一部安装了 WhatsApp 的手机**（用于扫描二维码）

与旧版基于浏览器的网桥不同，当前基于 Baileys 的网桥**不需要**本地的 Chromium 或 Puppeteer 依赖栈。

---

## 步骤 1：运行设置向导

```bash
hermes whatsapp
```

向导将会：

1. 询问你想要的模式（**bot** 或 **self-chat**）
2. 如有需要，安装网桥依赖
3. 在你的终端中显示一个 **二维码**
4. 等待你扫描它

**如何扫描二维码：**

1. 在你的手机上打开 WhatsApp
2. 进入 **设置 → 已关联的设备**
3. 点击 **关联新设备**
4. 将你的摄像头对准终端中的二维码

配对成功后，向导会确认连接并退出。你的会话会自动保存。

:::tip
如果二维码显示混乱，请确保你的终端至少有 60 列宽并且支持 Unicode。你也可以尝试使用不同的终端模拟器。
:::

---

## 步骤 2：获取第二个手机号（Bot 模式）

对于 bot 模式，你需要一个尚未注册 WhatsApp 的手机号。有三个选择：

| 选项 | 费用 | 备注 |
|------|------|------|
| **Google Voice** | 免费 | 仅限美国。在 [voice.google.com](https://voice.google.com) 获取号码。通过 Google Voice 应用的短信验证 WhatsApp。 |
| **预付费 SIM 卡** | $5–15 一次性费用 | 任何运营商。激活后验证 WhatsApp，之后 SIM 卡可以放在抽屉里。号码需保持活跃（每 90 天打一次电话）。 |
| **VoIP 服务** | 免费–$5/月 | TextNow, TextFree 或类似服务。一些 VoIP 号码会被 WhatsApp 封禁——如果第一个不行，可以尝试几个。 |

获取号码后：

1. 在一部手机上安装 WhatsApp（或使用支持双卡的 WhatsApp Business 应用）
2. 用新号码注册 WhatsApp
3. 运行 `hermes whatsapp` 并从该 WhatsApp 账户扫描二维码

---

## 步骤 3：配置 Hermes

将以下内容添加到你的 `~/.hermes/.env` 文件中：

```bash
# 必需
WHATSAPP_ENABLED=true
WHATSAPP_MODE=bot                          # "bot" 或 "self-chat"

# 访问控制 — 选择以下其中一个选项：
WHATSAPP_ALLOWED_USERS=15551234567         # 用逗号分隔的手机号（包含国家代码，不含 +）
# WHATSAPP_ALLOWED_USERS=*                 # 或使用 * 允许所有人
# WHATSAPP_ALLOW_ALL_USERS=true            # 或设置此标志（效果与 * 相同）
```

:::tip 允许全部的快捷方式
设置 `WHATSAPP_ALLOWED_USERS=*` 将允许**所有**发送者（等同于 `WHATSAPP_ALLOW_ALL_USERS=true`）。
这与 [Signal 群组允许列表](/reference/environment-variables) 一致。
如果要使用配对流程，请移除这两个变量，并依赖
[DM 配对系统](/user-guide/security#dm-pairing-system)。
:::

可选行为设置在 `~/.hermes/config.yaml` 中：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `unauthorized_dm_behavior: pair` 是全局默认值。未知私信发送者会收到配对码。
- `whatsapp.unauthorized_dm_behavior: ignore` 使 WhatsApp 对未授权的私信保持静默，这对于私人号码通常是更好的选择。

然后启动网关：

```bash
hermes gateway              # 前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅限 Linux：开机时启动的系统服务
```

网关会使用保存的会话自动启动 WhatsApp 网桥。

---

## 会话持久性

Baileys 网桥将会话保存在 `~/.hermes/platforms/whatsapp/session` 下。这意味着：

- **会话在重启后依然存在** — 你不需要每次都重新扫描二维码
- 会话数据包括加密密钥和设备凭据
- **不要分享或提交这个会话目录** — 它授予了对 WhatsApp 账户的完全访问权限

---

## 重新配对

如果会话中断（手机重置、WhatsApp 更新、手动取消关联），你会在网关日志中看到连接错误。要修复它：

```bash
hermes whatsapp
```

这会生成一个新的二维码。再次扫描它，会话就会重新建立。网关会通过重连逻辑自动处理**临时性**断连（网络波动、手机短暂离线）。

---

## 语音消息

Hermes 支持 WhatsApp 上的语音功能：

- **传入：** 语音消息（`.ogg` opus 格式）会使用配置的 STT 提供商自动转录：本地的 `faster-whisper`、Groq Whisper（`GROQ_API_KEY`）或 OpenAI Whisper（`VOICE_TOOLS_OPENAI_KEY`）
- **传出：** TTS 响应会以 MP3 音频文件附件发送
- 智能体（Agent）响应默认带有前缀 "⚕ **Hermes Agent**"。你可以在 `config.yaml` 中自定义或禁用此设置：

```yaml
# ~/.hermes/config.yaml
whatsapp:
  reply_prefix: ""                          # 空字符串会禁用标题头
  # reply_prefix: "🤖 *My Bot*\n──────\n"  # 自定义前缀（支持 \n 表示换行）
```

---

## 消息格式化与传递

WhatsApp 支持**流式（渐进式）响应** — 机器人会随着 AI 生成文本实时编辑其消息，就像 Discord 和 Telegram 一样。在内部，WhatsApp 在传递能力方面被归类为 TIER_MEDIUM 平台。

### 分块

长响应会自动在 **4,096 个字符**处分割成多条消息（WhatsApp 的实际显示限制）。你不需要配置任何东西 — 网关会处理分割并按顺序发送分块。

### WhatsApp 兼容的 Markdown

AI 响应中的标准 Markdown 会自动转换为 WhatsApp 的原生格式：

| Markdown | WhatsApp | 渲染效果 |
|----------|----------|----------|
| `**粗体**` | `*粗体*` | **粗体** |
| `~~删除线~~` | `~删除线~` | ~~删除线~~ |
| `# 标题` | `*标题*` | 粗体文本（无原生标题） |
| `[链接文本](网址)` | `链接文本 (网址)` | 内联 URL |

代码块和内联代码会原样保留，因为 WhatsApp 原生支持三重反引号格式。

### 工具进度

当智能体调用工具（网络搜索、文件操作等）时，WhatsApp 会显示实时进度指示器，表明正在运行哪个工具。此功能默认启用 — 无需配置。

---

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| **二维码无法扫描** | 确保终端足够宽（60+ 列）。尝试使用不同的终端。确保你是从正确的 WhatsApp 账户（bot 号码，而非个人账号）扫描。 |
| **二维码过期** | 二维码每约 20 秒刷新一次。如果超时，请重启 `hermes whatsapp`。 |
| **会话无法持久化** | 检查 `~/.hermes/platforms/whatsapp/session` 是否存在并且可写。如果使用容器化，请将其作为持久卷挂载。 |
| **意外登出** | WhatsApp 会在长时间不活动后取消关联设备。保持手机开机并连接到网络，如果需要，使用 `hermes whatsapp` 重新配对。 |
| **网桥崩溃或重连循环** | 重启网关，更新 Hermes，如果会话因 WhatsApp 协议更改而失效，请重新配对。 |
| **WhatsApp 更新后机器人停止工作** | 更新 Hermes 以获取最新的网桥版本，然后重新配对。 |
| **macOS: "Node.js not installed" 但 node 在终端中可用** | launchd 服务不会继承你的 shell PATH。运行 `hermes gateway install` 以将你当前的 PATH 重新快照到 plist 中，然后运行 `hermes gateway start`。详情请参阅 [网关服务文档](./index.md#macos-launchd)。 |
| **消息无法接收** | 验证 `WHATSAPP_ALLOWED_USERS` 包含了发送者的号码（包含国家代码，不含 `+` 或空格），或将其设置为 `*` 以允许所有人。在 `.env` 中设置 `WHATSAPP_DEBUG=true` 并重启网关，以在 `bridge.log` 中查看原始消息事件。 |
| **机器人用配对码回复陌生人** | 如果你想让未授权的私信被静默忽略，而不是回复配对码，请在 `~/.hermes/config.yaml` 中设置 `whatsapp.unauthorized_dm_behavior: ignore`。 |

---

## 安全

:::warning
在上线前**配置访问控制**。使用 `WHATSAPP_ALLOWED_USERS` 设置特定的
手机号码（包含国家代码，不带 `+`），使用 `*` 允许所有人，或设置
`WHATSAPP_ALLOW_ALL_USERS=true`。如果不设置任何这些，网关会出于安全措施
**拒绝所有传入消息**。
:::

默认情况下，未授权的私信仍会收到配对码回复。如果你想让一个私密的 WhatsApp 号码对陌生人完全静默，请设置：

```yaml
whatsapp:
  unauthorized_dm_behavior: ignore
```

- `~/.hermes/platforms/whatsapp/session` 目录包含完整的会话凭据 — 请像保护密码一样保护它
- 设置文件权限：`chmod 700 ~/.hermes/platforms/whatsapp/session`
- 为机器人使用一个**专用手机号**，以隔离风险，避免与你的个人账户关联
- 如果怀疑被泄露，从 WhatsApp → 设置 → 已关联的设备 中取消关联该设备
- 日志中的手机号会被部分编辑，但请检查你的日志保留策略