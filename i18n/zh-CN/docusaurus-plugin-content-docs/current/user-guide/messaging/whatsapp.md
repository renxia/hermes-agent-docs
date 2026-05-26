---
sidebar_position: 5
title: "WhatsApp"
description: "通过内置的 Baileys 桥接，将 Hermes 智能体设置为 WhatsApp 机器人"
---

# WhatsApp 设置

Hermes 通过一个基于 **Baileys** 的内置桥接连接到 WhatsApp。其工作原理是模拟一个 WhatsApp 网页版会话——**并非**通过官方的 WhatsApp Business API。无需 Meta 开发者账户或企业验证。

:::warning 非官方 API — 封号风险
WhatsApp **不**官方支持 Business API 之外的第三方机器人。使用第三方桥接存在账户受限的小风险。为降低风险：
- **使用一个专用的手机号码**用于机器人（不要使用您的个人号码）
- **不要发送批量/垃圾信息** — 保持对话式使用
- **不要自动向未曾主动联系过的人发送消息**
:::

:::warning WhatsApp 网页协议更新
WhatsApp 会定期更新其网页协议，这可能会暂时中断与第三方桥接的兼容性。当这种情况发生时，Hermes 将更新桥接依赖项。如果机器人在 WhatsApp 更新后停止工作，请拉取最新的 Hermes 版本并重新配对。
:::

## 两种模式

| 模式 | 工作原理 | 适用场景 |
|------|----------|----------|
| **独立的机器人号码**（推荐） | 为机器人专用一个手机号码。人们直接向该号码发送消息。 | 清晰的用户体验，支持多用户，封号风险更低 |
| **个人自聊天** | 使用您自己的 WhatsApp。您给自己发消息来与智能体对话。 | 设置快速，单用户，用于测试 |

---

## 前提条件

- **Node.js v18+** 和 **npm** —— WhatsApp 桥接器以 Node.js 进程运行
- **一部安装了 WhatsApp 的手机**（用于扫描二维码）

与旧版浏览器驱动的桥接器不同，当前基于 Baileys 的桥接器**不需要**本地的 Chromium 或 Puppeteer 依赖栈。

---

## 步骤一：运行设置向导

```bash
hermes whatsapp
```

向导将会：

1. 询问你想要哪种模式（**bot** 或 **self-chat**）
2. 必要时安装桥接器依赖
3. 在终端中显示一个**二维码**
4. 等待你扫描

**扫描二维码的方法：**

1. 在手机上打开 WhatsApp
2. 进入 **设置 → 已关联的设备**
3. 点击 **关联新设备**
4. 将摄像头对准终端中的二维码

配对成功后，向导会确认连接并退出。你的会话将自动保存。

:::tip
如果二维码看起来是乱码，请确保你的终端宽度至少为 60 列且支持 Unicode。你也可以尝试使用不同的终端模拟器。
:::

---

## 步骤二：获取第二个电话号码（机器人模式）

对于机器人模式，你需要一个尚未在 WhatsApp 注册的电话号码。有三种选择：

| 选项 | 成本 | 备注 |
|------|------|------|
| **Google Voice** | 免费 | 仅限美国。在 [voice.google.com](https://voice.google.com) 获取号码。通过 Google Voice 应用接收短信以验证 WhatsApp。 |
| **预付费 SIM 卡** | 一次性 $5–15 | 任何运营商。激活后验证 WhatsApp，然后 SIM 卡可以闲置。号码需保持活跃（每 90 天拨打一次电话）。 |
| **VoIP 服务** | 免费 – $5/月 | TextNow、TextFree 或类似服务。部分 VoIP 号码会被 WhatsApp 封锁 —— 如果第一个不行，尝试其他几个。 |

获取号码后：

1. 在手机上安装 WhatsApp（或使用支持双卡的 WhatsApp Business 应用）
2. 使用新号码注册 WhatsApp
3. 运行 `hermes whatsapp` 并扫描该 WhatsApp 账户的二维码

---

## 步骤三：配置 Hermes

将以下内容添加到你的 `~/.hermes/.env` 文件中：

```bash
# 必需
WHATSAPP_ENABLED=true
WHATSAPP_MODE=bot                          # "bot" 或 "self-chat"

# 访问控制 — 选择以下选项之一：
WHATSAPP_ALLOWED_USERS=15551234567         # 以逗号分隔的电话号码（带国家代码，不带 +）
# WHATSAPP_ALLOWED_USERS=*                 # 或者使用 * 允许所有人
# WHATSAPP_ALLOW_ALL_USERS=true            # 或者设置此标志（效果与 * 相同）
```

:::tip 允许所有人的简写
设置 `WHATSAPP_ALLOWED_USERS=*` 允许**所有**发送者（等同于 `WHATSAPP_ALLOW_ALL_USERS=true`）。
这与 [Signal 群组允许列表](/reference/environment-variables) 保持一致。
如果想使用配对流程，请移除这两个变量，并依赖 [DM 配对系统](/user-guide/security#dm-pairing-system)。
:::

在 `~/.hermes/config.yaml` 中可选的行为设置：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `unauthorized_dm_behavior: pair` 是全局默认设置。未知的 DM 发送者会收到配对码。
- `whatsapp.unauthorized_dm_behavior: ignore` 使 WhatsApp 对未授权的 DM 保持沉默，这通常是私人号码更好的选择。

然后启动网关：

```bash
hermes gateway              # 前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅限 Linux：设置为开机系统服务
```

网关会使用保存的会话自动启动 WhatsApp 桥接器。

---

## 会话持久化

Baileys 桥接器将会话保存在 `~/.hermes/platforms/whatsapp/session` 下。这意味着：

- **会话在重启后保留** — 你不需要每次重新扫描二维码
- 会话数据包含加密密钥和设备凭证
- **不要分享或提交此会话目录** — 它授予对 WhatsApp 账户的完全访问权限

---

## 重新配对

如果会话中断（手机重置、WhatsApp 更新、手动取消关联），你会在网关日志中看到连接错误。要修复它：

```bash
hermes whatsapp
```

这会生成一个新的二维码。再次扫描，会话将重新建立。网关会自动处理**临时**断开连接（网络波动、手机短暂离线）的情况，具备重连逻辑。

---

## 语音消息

Hermes 支持 WhatsApp 语音：

- **接收：** 语音消息（`.ogg` opus 格式）会自动使用配置的 STT 提供商进行转录：本地的 `faster-whisper`、Groq Whisper（需要 `GROQ_API_KEY`）或 OpenAI Whisper（需要 `VOICE_TOOLS_OPENAI_KEY`）
- **发送：** TTS 响应以 MP3 音频文件附件的形式发送
- 智能体响应默认前缀为 "⚕ **Hermes Agent**"。你可以在 `config.yaml` 中自定义或禁用此功能：

```yaml
# ~/.hermes/config.yaml
whatsapp:
  reply_prefix: ""                          # 空字符串禁用标题
  # reply_prefix: "🤖 *My Bot*\n──────\n"  # 自定义前缀（支持 \n 换行）
```

---

## 消息格式与投递

WhatsApp 支持**流式（渐进式）响应** — 机器人在 AI 生成文本时实时编辑消息，就像 Discord 和 Telegram 一样。在内部，WhatsApp 在投递能力上被归类为 TIER_MEDIUM 平台。

### 分块

长响应会自动在每 **4,096 个字符**处分割成多条消息（WhatsApp 实际显示限制）。你无需配置任何东西 — 网关会处理分割并按顺序发送分块。

### WhatsApp 兼容 Markdown

AI 响应中的标准 Markdown 会自动转换为 WhatsApp 的原生格式：

| Markdown | WhatsApp | 渲染效果 |
|----------|----------|----------|
| `**粗体**` | `*粗体*` | **粗体** |
| `~~删除线~~` | `~删除线~` | ~~删除线~~ |
| `# 标题` | `*标题*` | 粗体文本（无原生标题） |
| `[链接文本](url)` | `链接文本 (url)` | 内联 URL |

代码块和内联代码会原样保留，因为 WhatsApp 原生支持三个反引号的格式。

### 工具进度

当智能体调用工具（网页搜索、文件操作等）时，WhatsApp 会显示实时进度指示器，显示正在运行的工具。此功能默认启用，无需配置。

---

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| **二维码无法扫描** | 确保终端足够宽（60+ 列）。尝试不同的终端。确保你是从正确的 WhatsApp 账户扫描（机器人号码，而非个人号码）。 |
| **二维码过期** | 二维码每 ~20 秒刷新一次。如果超时，请重启 `hermes whatsapp`。 |
| **会话无法持久化** | 检查 `~/.hermes/platforms/whatsapp/session` 是否存在且可写。如果是在容器中运行，请将其作为持久卷挂载。 |
| **意外登出** | WhatsApp 在长时间不活跃后会取消关联设备。保持手机开机并连接到网络，然后如果需要，使用 `hermes whatsapp` 重新配对。 |
| **桥接器崩溃或重连循环** | 重启网关，更新 Hermes，如果会话因 WhatsApp 协议更改而失效，则重新配对。 |
| **WhatsApp 更新后机器人停止工作** | 更新 Hermes 以获取最新的桥接器版本，然后重新配对。 |
| **macOS："未安装 Node.js" 但终端中 node 可用** | launchd 服务不会继承你的 shell PATH。运行 `hermes gateway install` 以将当前 PATH 重新快照到 plist 中，然后运行 `hermes gateway start`。详情请参阅 [网关服务文档](./index.md#macos-launchd)。 |
| **未接收到消息** | 验证 `WHATSAPP_ALLOWED_USERS` 是否包含发送者的号码（带国家代码，不带 `+` 或空格），或将其设置为 `*` 以允许所有人。在 `.env` 中设置 `WHATSAPP_DEBUG=true` 并重启网关，以在 `bridge.log` 中查看原始消息事件。 |
| **机器人使用配对码回复陌生人** | 如果你希望未授权的 DM 被静默忽略，请在 `~/.hermes/config.yaml` 中设置 `whatsapp.unauthorized_dm_behavior: ignore`。 |

---

## 安全性

:::warning
**在上线前配置访问控制。** 设置 `WHATSAPP_ALLOWED_USERS`，指定具体的电话号码（包括国家代码，不带 `+`），使用 `*` 允许所有人，或设置 `WHATSAPP_ALLOW_ALL_USERS=true`。如果这些都没设置，网关**会拒绝所有传入消息**作为安全措施。
:::

默认情况下，未授权的 DM 仍会收到配对码回复。如果你希望私人 WhatsApp 号码对陌生人完全保持沉默，请设置：

```yaml
whatsapp:
  unauthorized_dm_behavior: ignore
```

- `~/.hermes/platforms/whatsapp/session` 目录包含完整的会话凭证 — 请像保护密码一样保护它
- 设置文件权限：`chmod 700 ~/.hermes/platforms/whatsapp/session`
- 使用**专用电话号码**作为机器人，以将风险与你的个人账户隔离
- 如果你怀疑账户被入侵，请从 WhatsApp → 设置 → 已关联设备 中取消关联设备
- 日志中的电话号码已部分打码，但请检查你的日志保留策略