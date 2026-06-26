---
sidebar_position: 5
title: "WhatsApp"
description: "设置 Hermes 智能体为 WhatsApp 机器人，通过内置的 Baileys 桥接器实现"
---

# WhatsApp 设置

Hermes 通过基于 **Baileys** 的内置桥接器连接到 WhatsApp。这并非通过官方 WhatsApp Business API 实现，而是通过模拟 WhatsApp Web 会话来实现。无需 Meta 开发者账户或进行业务验证。

> 运行 `hermes gateway setup` 并选择 **WhatsApp** 以获得引导式操作流程。

:::tip 两个 WhatsApp 集成
本页面是关于 **Baileys 桥接器** 的——设置快速、适用于个人账户，不需要公共 URL，但存在封号风险。

如果您正在运行一个真实的商业机器人并需要稳定性，请参阅 **[WhatsApp Business Cloud API 指南](./whatsapp-cloud.md)**。这是官方 Meta 支持的路径：没有账户被封禁的风险，但需要 Meta 商业账户和公共 Webhook URL。

这两个适配器也可以同时针对不同的电话号码运行，如果您有此需求。
:::

:::warning 非官方 API — 封号风险
WhatsApp **不**正式支持 Business API 之外的第三方机器人。使用第三方桥接器存在一定的账户限制风险。为将风险降至最低：
- **为机器人使用专用电话号码**（而不是您的个人号码）
- **不要发送批量/垃圾信息**——保持对话式的使用方式
- **不要自动化外发消息**给未先发起对话的人
:::

:::warning WhatsApp Web 协议更新
WhatsApp 会定期更新其 Web 协议，这可能会暂时导致与第三方桥接器的兼容性中断。发生这种情况时，Hermes 将会更新桥接器依赖项。如果机器人在 WhatsApp 更新后停止工作，请拉取最新的 Hermes 版本并重新配对。
:::

## 两种模式

| 模式 | 工作原理 | 最适合 |
|------|-------------|----------|
| **独立的机器人号码**（推荐） | 为机器人指定一个电话号码。人们直接向该号码发送消息。 | 清晰的用户体验，多用户，较低的封号风险 |
| **个人自聊** | 使用您自己的 WhatsApp 账户。您给自己发送消息以与智能体对话。 | 快速设置，单用户，测试 |

---

## 先决条件

- **Node.js v18+** 和 **npm** — WhatsApp 桥接器作为 Node.js 进程运行
- **一台安装了 WhatsApp 的手机**（用于扫描二维码）

与旧的浏览器驱动型桥接器不同，当前的基于 Baileys 的桥接器**不需要**本地 Chromium 或 Puppeteer 依赖堆栈。

---

## 第 1 步：运行设置向导

```bash
hermes whatsapp
```

该向导将：

1. 询问您想要哪种模式（**机器人**或**自聊**）
2. 如果需要，则安装桥接器依赖项
3. 在您的终端中显示一个 **二维码**
4. 等待您扫描它

**如何扫描二维码：**

1. 在手机上打开 WhatsApp
2. 进入 **设置 → 链接的设备 (Linked Devices)**
3. 点击 **链接设备 (Link a Device)**
4. 将摄像头对准终端中的二维码

配对完成后，向导将确认连接并退出。您的会话会自动保存。

:::tip
如果二维码看起来模糊不清，请确保您的终端至少有 60 列宽，并且支持 Unicode。您也可以尝试使用不同的终端模拟器。
:::

---

## 第 2 步：获取第二个电话号码（机器人模式）

对于机器人模式，您需要一个尚未在 WhatsApp 上注册的电话号码。有三种选择：

| 选项 | 成本 | 说明 |
|--------|------|-------|
| **Google Voice** | 免费 | 仅限美国。访问 [voice.google.com](https://voice.google.com)。通过 Google Voice 应用使用短信验证 WhatsApp。 |
| **预付费 SIM 卡** | $5–15 一次性费用 | 任何运营商。激活、验证 WhatsApp，然后该 SIM 卡可以放在抽屉里。号码必须保持活跃（每 90 天拨打一次电话）。 |
| **VoIP 服务** | 免费–$5/月 | TextNow, TextFree 或类似服务。有些 VoIP 号码被 WhatsApp 屏蔽——如果第一个不成功，请尝试几个。 |

获取号码后：

1. 在手机上安装 WhatsApp（或使用支持双 SIM 的 WhatsApp Business 应用）
2. 使用 WhatsApp 注册新号码
3. 运行 `hermes whatsapp` 并扫描来自该 WhatsApp 账户的二维码

---

## 第 3 步：配置 Hermes

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# Required (必需)
WHATSAPP_ENABLED=true
WHATSAPP_MODE=bot                          # "bot" 或 "self-chat"

# Access control（访问控制）——选择以下选项之一：
WHATSAPP_ALLOWED_USERS=15551234567         # 逗号分隔的电话号码（带国家代码，不带 +）
# WHATSAPP_ALLOWED_USERS=*                 # 或者使用 * 来允许所有人
# WHATSAPP_ALLOW_ALL_USERS=true            # 或者设置此标志（与 * 效果相同）
```

:::tip 全部允许简写
设置 `WHATSAPP_ALLOWED_USERS=*` 允许**所有**发送者（等同于 `WHATSAPP_ALLOW_ALL_USERS=true`）。
这与 [Signal 群组白名单](/reference/environment-variables) 一致。
如果想使用配对流程，请删除这两个变量，并依赖 [DM 配对系统](/user-guide/security#dm-pairing-system)。
:::

在 `~/.hermes/config.yaml` 中的可选行为设置：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `unauthorized_dm_behavior: pair` 是全局默认值。未知的 DM 发送者会收到一个配对代码。
- `whatsapp.unauthorized_dm_behavior: ignore` 使 WhatsApp 对未经授权的 DM 保持沉默，这对于私人号码通常是更好的选择。

然后启动网关：

```bash
hermes gateway              # 前台运行 (Foreground)
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅限 Linux：系统级启动服务
```

网关将使用保存的会话自动启动 WhatsApp 桥接器。

---

## 会话持久性

Baileys 桥接器将其会话保存在 `~/.hermes/platforms/whatsapp/session` 下。这意味着：

- **会话可以存活重启** — 您不必每次都重新扫描二维码
- 会话数据包括加密密钥和设备凭证
- **请勿共享或提交此会话目录** — 它赋予了对 WhatsApp 账户的完全访问权限

---

## 重新配对 (Re-pairing)

如果会话中断（手机重置、WhatsApp 更新、手动解除链接），您将在网关日志中看到连接错误。要修复它：

```bash
hermes whatsapp
```

这会生成一个新的二维码。再次扫描后，会话就会重新建立。网关会自动处理**临时**断开连接（网络抖动、手机短暂离线）并进行重连逻辑。

---

## 语音消息

Hermes 支持 WhatsApp 的语音功能：

- **接收消息 (Incoming):** 语音消息（`.ogg` opus）将使用配置的 STT 提供商自动转录：本地 `faster-whisper`、Groq Whisper (`GROQ_API_KEY`) 或 OpenAI Whisper (`VOICE_TOOLS_OPENAI_KEY`)
- **发送消息 (Outgoing):** TTS 回复述为 MP3 音频文件附件发送
- 默认情况下，智能体回复会以 "⚕ **Hermes Agent**" 开头。您可以在 `config.yaml` 中自定义或禁用此功能：

```yaml
# ~/.hermes/config.yaml
whatsapp:
  reply_prefix: ""                          # 空字符串可禁用标题
  # reply_prefix: "🤖 *My Bot*\n──────\n"  # 自定义前缀（支持 \n 换行符）
```

---

## 消息格式化与投递

WhatsApp 支持**流式（渐进式）回复**——就像 Discord 和 Telegram 一样，AI 生成文本时机器人会实时编辑其消息。在内部，WhatsApp 被归类为 TIER_MEDIUM 的投递能力平台。

### 分块 (Chunking)

长回复会被自动分割成多个消息，每个分块限制在 **4,096 个字符**（WhatsApp 的实际显示限制）。您无需进行任何配置——网关会处理分割并按顺序发送分块。

### WhatsApp 兼容的 Markdown

AI 回复述中的标准 Markdown 会被自动转换为 WhatsApp 的原生格式：

| Markdown | WhatsApp | 渲染效果 |
|----------|----------|------------|
| `**bold**` | `*bold*` | **bold** |
| `~~strikethrough~~` | `~strikethrough~` | ~~strikethrough~~ |
| `# Heading` | `*Heading*` | 粗体文本（没有原生标题） |
| `[link text](url)` | `link text (url)` | 行内 URL |

代码块和行内代码被原样保留，因为 WhatsApp 原生支持三反引号格式。

### 工具进度 (Tool Progress)

当智能体调用工具（网页搜索、文件操作等）时，WhatsApp 会显示实时进度指示器，表明哪个工具正在运行。这默认启用——无需配置。

### 消息批处理（防抖/Debounce）

WhatsApp 单独投递每条消息，因此快速的消息爆发（转发批次、粘贴分割、多行文本）否则会触发每次片段的独立智能体调用——造成令牌浪费并产生多个不连贯的回复。适配器会缓冲来自同一聊天的连续文本消息，并在短暂的静默期后（默认 **5s**，对于非常长的片段可延长至 **10s**）将它们作为一条合并请求分派。通过 `config.yaml` 进行调整：

```yaml
# ~/.hermes/config.yaml
gateway:
  platforms:
    whatsapp:
      extra:
        text_batch_delay_seconds: 5.0         # 冲刷批次前的静默期
        text_batch_split_delay_seconds: 10.0  # 分割阈值附近的延时
```

设置 `text_batch_delay_seconds: 0` 可立即分派每条消息（禁用批处理）。

---

## 故障排除 (Troubleshooting)

| 问题 | 解决方案 |
|---------|----------|
| **二维码无法扫描** | 确保终端足够宽（60+ 列）。尝试使用不同的终端。请确保您正在从正确的 WhatsApp 账户进行扫描（机器人号码，而不是个人号码）。 |
| **二维码过期** | 二维码大约每 20 秒刷新一次。如果超时，请重启 `hermes whatsapp`。 |
| **会话未持久化** | 检查 `~/.hermes/platforms/whatsapp/session` 是否存在且可写。如果是容器化的，请将其挂载为持久卷。 |
| **意外登出** | WhatsApp 会在长时间不活动后解除设备链接。保持手机开机并连接到网络，如果需要，再使用 `hermes whatsapp` 进行重新配对。 |
| **桥接器崩溃或重连循环** | 重新启动网关，更新 Hermes，如果会话被 WhatsApp 协议更改所作废，则进行重新配对。 |
| **WhatsApp 更新后机器人停止工作** | 更新 Hermes 以获取最新的桥接器版本，然后重新配对。 |
| **macOS: "Node.js 未安装" 但终端中运行 node 可用** | launchd 服务不会继承您的 shell PATH。请运行 `hermes gateway install` 将当前 PATH 重新快照到 plist 中，然后运行 `hermes gateway start`。有关详细信息，请参阅 [Gateway Service 文档](./index.md#macos-launchd)。 |
| **未收到消息** | 验证 `WHATSAPP_ALLOWED_USERS` 是否包含发送者的号码（带国家代码，不含 `+` 或空格），或者将其设置为 `*` 以允许所有人。在 `.env` 中设置 `WHATSAPP_DEBUG=true` 并重启网关，以在 `bridge.log` 中查看原始消息事件。 |
| **机器人向陌生人回复配对代码** | 如果您希望未经授权的 DM 被静默忽略而不是接收配对代码，请在 `~/.hermes/config.yaml` 中设置 `whatsapp.unauthorized_dm_behavior: ignore`。 |

---

## 安全性 (Security)

:::warning
**配置访问控制**后再投入使用。设置 `WHATSAPP_ALLOWED_USERS` 以指定电话号码（包括国家代码，不带 `+`），使用 `*` 允许所有人，或设置 `WHATSAPP_ALLOW_ALL_USERS=true`。如果没有这些设置中的任何一个，网关将**拒绝所有传入消息**作为安全措施。
:::

默认情况下，未经授权的 DM 仍然会收到一个配对代码回复。如果您希望私人 WhatsApp 号码对陌生人保持完全沉默，请设置：

```yaml
whatsapp:
  unauthorized_dm_behavior: ignore
```

- `~/.hermes/platforms/whatsapp/session` 目录包含完整的会话凭证——请像保护密码一样保护它。
- 设置文件权限：`chmod 700 ~/.hermes/platforms/whatsapp/session`
- 使用**专用电话号码**来运行机器人，以隔离个人账户的风险
- 如果怀疑被泄露，请在 WhatsApp 中解除设备链接 → 设置 → 链接的设备
- 日志中的电话号码已被部分屏蔽，但请审查您的日志保留策略