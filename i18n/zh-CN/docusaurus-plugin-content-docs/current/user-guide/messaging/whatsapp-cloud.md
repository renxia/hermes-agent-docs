sidebar_position: 6
title: "WhatsApp Business (Cloud API)"
description: "通过 Meta 官方的 Business Cloud API 设置 Hermes Agent 为 WhatsApp 机器人"
---

# WhatsApp Business Cloud API 设置

Hermes 可以通过 Meta **官方** 的 WhatsApp Business Cloud API 连接到 WhatsApp。这是生产级别的路径：不需要 Node.js 桥接子进程，不需要二维码，没有封号风险。

作为交换条件：

- 您需要一个 **Meta Business 账户**（而不是个人 WhatsApp）。
- 该机器人运行在一个专用的商家电话号码上，而不是您的个人号码。
- Hermes 网关需要一个 **公共 HTTPS URL**，以便 Meta 可以通过 webhook 交付入站消息。
- 超过用户上次消息的 24 小时后回复需要预先批准的 **模板**（这是 Meta 的“客户服务窗口”规则，而非 Hermes 的限制）。

如果这些限制不适合您的用例，[Baileys bridge 集成](./whatsapp.md) 是另一种选择——个人账户，不需要公共 URL，但属于非官方且有被封号风险。

:::tip 我应该使用哪个？
- **Cloud API (本指南)** — 运行真正的商业机器人，需要稳定性，可以接受 Meta 验证和模板文件工作
- **[Baileys bridge](./whatsapp.md)** — 个人项目、快速演示、单用户设置，愿意承担机器人电话号码被封号的风险
:::

---

## 快速入门

```bash
hermes whatsapp-cloud
```

该向导会引导您完成每一个凭证（验证每个凭证时都会进行，这能捕获到 #1 的设置陷阱——将电话号码粘贴到“Phone Number ID”字段中），并为需要在向导外部完成的部分打印出确切的后续说明（启动 cloudflared、配置 Meta 的 webhook 仪表板）。

本页面的其余部分是手动参考资料。

## 先决条件

1. **Meta Business 账户**。请在 [business.facebook.com](https://business.facebook.com/) 创建一个。
2. **启用了 WhatsApp 的 Meta 应用**。请参阅下文“创建 Meta 应用”。
3. **一种将本地端口暴露给公共互联网的方法**，并支持 HTTPS。推荐使用 Cloudflare Tunnel (`cloudflared`) — 免费、无需端口转发、无需域名。ngrok、带有反向代理和 TLS 的自有域名，或直接绑定到公共 IP 的 VPS 都适用。
4. **可选但推荐**: 在 `PATH` 中安装 ffmpeg，这样出站语音消息才能渲染成原生的 WhatsApp 语音笔记气泡（绿色波形），而不是 MP3 音频附件。如果缺少它，Hermes 会优雅地降级。

---

## 创建 Meta 应用

1. 访问 [developers.facebook.com/apps](https://developers.facebook.com/apps) → **创建应用**。
2. 选择用例：“**通过 WhatsApp 与客户连接**” → **下一步**。
3. 选择或创建商业组合。请查看发布要求。确认 → **创建应用**。
4. 创建后，您将进入“自定义用例 → 连接到 WhatsApp → 快速启动”。点击 **开始使用 API** → 您现在处于 **API 设置** 页面。
5. 确保已链接 WhatsApp Business Account (WABA)。如果您在第 3 步中创建了新的组合，系统会自动创建一个。请在 API 设置页面进行验证。

您需要从仪表板获取以下值——向导会按此顺序提示它们：

| Value | 在仪表板中的位置 | 字段形状 | 说明 |
|---|---|---|---|
| **Phone Number ID** | 应用仪表板 → WhatsApp → API 设置 → “From” 下方 | 数字，15-17 位数 | **不是**电话号码本身。第 1 个设置错误是粘贴实际的电话号码。 |
| **Access Token** | 应用仪表板 → WhatsApp → API 设置 → “生成访问令牌” | 以 `EAA` 开头，100+ 个字符 | 临时令牌有效期为 24 小时 — 请参阅下文“永久令牌”以了解生产环境的用法。 |
| **App Secret** | 应用仪表板 → 设置 → 基本信息 → 点击 App secret 旁边的“显示” | 32 位小写十六进制 | 用于验证传入 Webhook 签名。如果没有它，入站消息将收到 503 错误拒绝。 |
| **App ID** (可选) | 应用仪表板 → 设置 → 基本信息 | 数字，15-16 位数 | 对消息传递不是必需的，但对分析很有用。 |
| **WABA ID** (可选) | 应用仪表板 → WhatsApp → API 设置 → 顶部附近 | 数字，15+ 位数 | 对消息传递不是必需的，但对分析很有用。 |

---

## 永久令牌（生产环境）

临时访问令牌在 **24 小时** 后过期，这意味着今天生成的令牌明天就无法使用。对于生产部署，请使用 **系统用户永久令牌**：

1. 访问 [business.facebook.com/latest/settings](https://business.facebook.com/latest/settings) → **系统用户**（左侧边栏）。
2. **添加** → 名称（例如 `hermes-bot`）→ 角色：**管理员**。
3. 选择新用户 → **分配资源**:
   - 选择您的应用 → 在“完全控制”下切换 **管理应用**。
   - 选择您的 WhatsApp 账户 → 在“完全控制”下切换 **管理 WhatsApp Business Accounts**。
   - 点击 **分配资源**。
4. 使用以下权限**生成令牌**:
   - `business_management`
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. 设置 **令牌有效期: 永不过期**。
6. 复制令牌 → 在 `~/.hermes/.env` 中更新 `WHATSAPP_CLOUD_ACCESS_TOKEN` → 重启网关。

系统用户令牌除非您明确撤销，否则不会过期。

---

## 将 Hermes 暴露给互联网

Cloud API 通过 HTTPS POST 将入站消息传递到您的 Webhook URL — 这意味着 Hermes 网关必须可以从 Meta 的服务器访问。有三种常见的方法：

### Cloudflare Tunnel（推荐）

免费，无需端口转发，适用于 Windows / macOS / Linux。它作为独立进程与网关一起运行。

**安装:**

```bash
# Windows
winget install Cloudflare.cloudflared

# macOS
brew install cloudflared

# Linux
# 从 https://github.com/cloudflare/cloudflared/releases 下载二进制文件
```

**运行一个快速隧道**（无需 Cloudflare 账户 — 会给您一个 `https://<random>.trycloudflare.com` URL）：

```bash
cloudflared tunnel --url http://localhost:8090
```

记下显示的 URL — 这就是您将提供给 Meta 的。

:::warning 快速隧道会轮换
免费的快速隧道 URL 会在每次重启 `cloudflared` 时都改变。如需稳定的 URL，请使用 `cloudflared tunnel login` 登录并创建一个命名隧道。免费的 Cloudflare 账户可以获得无限数量的命名隧道 — 请参阅 [Cloudflare 文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) 以了解命名隧道的工作流程。
:::

### ngrok

```bash
ngrok http 8090
```

免费套餐在每次重启时都会显示不同的 URL。付费套餐会给您一个稳定的子域名。

### 您自己的域名 + 反向代理

如果您已经拥有带有 TLS 证书（Caddy、nginx 等）的服务器，请将路由指向 `localhost:8090`。这是最稳定的生产选项，但需要现有的基础设施。

---

## 在 Meta 端配置 Webhook

隧道运行后：

1. 记下您的隧道打印出的公共 URL — 例如 `https://abc123.trycloudflare.com`。
2. 生成一个**验证令牌** — 向导会使用 `secrets.token_urlsafe(32)` 为您完成此操作；如果您手动配置，请运行：
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   将其保存在 `~/.hermes/.env` 中作为 `WHATSAPP_CLOUD_VERIFY_TOKEN`。
3. 启动 Hermes 网关：`hermes gateway`。
4. 在 Meta 应用仪表板 → **WhatsApp → 配置**（或根据 UI 版本选择 **用例 → 自定义 → 配置**）→ 点击 Webhook 部分的 **编辑**。
5. 填写：
   - **Callback URL**: `https://abc123.trycloudflare.com/whatsapp/webhook`
   - **Verify Token**: 第 2 步中的字符串（必须完全匹配）
6. 点击 **验证并保存**。Meta 会使用 GET 请求访问您的 URL，网关会回显挑战信息，Meta 就会将 Webhook 标记为已验证。
7. 在 **Webhook fields** 下，点击 **Manage** → 订阅 **messages** 字段。这告诉 Meta 实际将入站消息传递给您的 Webhook。

**手动验证循环（从第三个终端）:**

```bash
TUNNEL="https://abc123.trycloudflare.com"
VERIFY="<your verify token>"

# 应打印 HTTP 200 和 "hello" 主体
curl -i "$TUNNEL/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=$VERIFY&hub.challenge=hello"

# 健康检查端点 — 应显示 verify_token_configured: true 和 app_secret_configured: true
curl "$TUNNEL/health"
```

---

## 收件人白名单（Meta 端）

在开发模式下（应用通过应用审核之前），Meta 会限制您的机器人可以向哪些号码发送消息：

1. 应用仪表板 → WhatsApp → API 设置 → **To** 下拉菜单。
2. 点击 **管理电话号码列表**。
3. 添加您想要发送消息的电话号码（您自己的、团队成员的、友好的测试人员）。Meta 会通过 SMS 或 WhatsApp 向每个号码发送一个 6 位验证码。

开发模式下最多支持 5 个号码。进入应用审核后，此限制将被移除。

---

## 白名单（Hermes 端）

除了 Meta 的收件人白名单外，Hermes 还有自己的平台级白名单，它控制**智能体处理哪些入站消息**。请添加到 `~/.hermes/.env`：

```bash
# 用逗号分隔的电话号码，包含国家代码，不要使用 '+' / 空格 / 横杠
WHATSAPP_CLOUD_ALLOWED_USERS=15551234567,15557654321

# 或者允许所有人（仅在与 Meta 的收件人白名单结合使用时才安全）
# WHATSAPP_CLOUD_ALLOW_ALL_USERS=true
```

向导会在第 6 步设置此项。如果没有白名单，**所有入站消息都将被拒绝** — 这是故意的，这样即使收件人白名单被放宽，机器人也不会被随机号码调用。

---

## 美化机器人的 WhatsApp 资料

WhatsApp 会在聊天标题和联系人列表中显示您的机器人名称和头像。这些信息无法通过 Cloud API 设置——它们存储在 Meta 的商业管理平台中。

一旦您的机器人投入使用，请前往 **[business.facebook.com/wa/manage/phone-numbers](https://business.facebook.com/wa/manage/phone-numbers/)**，点击您的电话号码，您将找到：

| 内容 | 位置 | 说明 |
|---|---|---|
| **显示名称** | 电话号码页面顶部 | 名称更改需要经过 Meta 的名称审核流程（约 24–48 小时）。 |
| **头像** | 电话号码页面顶部 | 方形图片，推荐 ≥640×640px。立即更新。 |
| **简介 / description / website / email / hours / category** | “编辑资料”按钮 | 这些信息会显示在用户点击机器人名称时的信息面板中。属于外观美化范畴。 |
| **验证徽章** (绿色对勾) | 商业管理 → 安全中心 → 开始验证 | 需要 Meta 单独的业务验证流程。 |

`hermes whatsapp-cloud` 向导会在设置结束时打印这些链接。这些都不是机器人运行所必需的——它们只是关于您的机器人如何呈现给用户的纯粹美化功能。

---

## 配置参考

所有设置都保存在 `~/.hermes/.env` 中。**粗体**表示必填的值。

| Variable | Default | Description |
|---|---|---|
| **`WHATSAPP_CLOUD_PHONE_NUMBER_ID`** | — | API 设置中的 15-17 位数字 ID。**不是**电话号码。 |
| **`WHATSAPP_CLOUD_ACCESS_TOKEN`** | — | Meta 访问令牌（以 `EAA` 开头）。临时 24 小时或系统用户永久。 |
| **`WHATSAPP_CLOUD_APP_SECRET`** | — | 来自设置 → 基本信息的 32 位十六进制。如果没有它，入站消息将收到 503 错误拒绝。 |
| **`WHATSAPP_CLOUD_VERIFY_TOKEN`** | — | 用于 GET 握手过程的共享密钥。由向导自动生成。 |
| **`WHATSAPP_CLOUD_ALLOWED_USERS`** | — | 允许发送消息给机器人的逗号分隔 wa_ids。 |
| `WHATSAPP_CLOUD_ALLOW_ALL_USERS` | `false` | 设置为 `true` 以绕过白名单。 |
| `WHATSAPP_CLOUD_APP_ID` | — | 可选，用于未来的分析集成。 |
| `WHATSAPP_CLOUD_WABA_ID` | — | 可选，用于未来的分析集成。 |
| `WHATSAPP_CLOUD_WEBHOOK_HOST` | `0.0.0.0` | Webhook 服务器绑定的接口。 |
| `WHATSAPP_CLOUD_WEBHOOK_PORT` | `8090` | Webhook 服务器绑定的端口。必须与您的隧道转发的端口匹配。 |
| `WHATSAPP_CLOUD_WEBHOOK_PATH` | `/whatsapp/webhook` | Meta POST 的 URL 路径。 |
| `WHATSAPP_CLOUD_API_VERSION` | `v20.0` | Meta Graph API 版本。仅当 Meta 文档推荐更新版本时才覆盖。 |
| `WHATSAPP_CLOUD_HOME_CHANNEL` | — | 用于作为机器人主通道的 wa_id（用于定时任务等）。 |

您可以同时启用 Baileys (`whatsapp`) 和 Cloud (`whatsapp_cloud`) 适配器，针对不同的电话号码进行操作。

## 功能特性

### 入站消息 (Inbound)

- **文本消息** — 直接传递给智能体。
- **图片** — 自动下载并附加到智能体的输入中。具有原生视觉能力的模型（Claude, GPT-4o, Gemini 等）会直接读取图片；非视觉模型则接收一个自动生成的文本描述。
- **语音备忘录** — 自动下载为 `.ogg` 文件，通过您配置的 STT 提供商（本地 faster-whisper、OpenAI/Nous、Groq 等）进行转录，然后作为文本传递给智能体。
- **文档** — 自动下载。小型可读文本文件（`.txt`, `.md`, `.json`, `.py`, `.csv` 等），大小不超过 100KB 会被内联到智能体的输入中，使其无需工具调用即可读取。较大的文件会被本地缓存供智能体其他工具使用。
- **按钮点击** — 当用户点击机器人之前发送的按钮（澄清选择、命令批准、斜杠命令确认）时，该点击会直接路由到相应的处理程序。过期的点击消息将退化为普通的文本输入。
- **回复上下文** — 当用户回复机器人之前的消息时，智能体会看到原始消息作为上下文。

### 出站消息 (Outbound)

- **文本** — markdown 会自动转换为 WhatsApp 的特定语法（`**粗体**` → `*粗体*`，`~~删除线~~` → `~删除线~`，标题 → 粗体，`[链接](url)` → `链接 (url)`）。长消息会按 4096 个字符/块进行分割。
- **图片** — 支持智能体生成的图片和本地图片文件，均作为原生照片附件发送。
- **语音消息** — TTS（文本转语音）输出通过 ffmpeg 转换为 WhatsApp 的原生语音备忘录气泡（绿色波形）。如果未安装 ffmpeg，则退化为 MP3 音频附件。详情请参阅下方的“语音消息”。
- **视频/文档** — 都支持，作为原生附件发送。

### 交互式用户体验 (Interactive UX)

当智能体调用这些流程时，Hermes 会使用 WhatsApp 的原生交互式消息——而不是使用“回复数字”的提示，而是使用点击回答按钮：

- **`clarify` 工具** — 多项选择题会渲染为快速回复按钮（1–3 个选项）或一个可点击打开的列表表单（4+ 个选项）。选择“✏️ 其他”允许用户输入自由格式的答案，智能体将此作为解决方案接收。
- **危险命令批准** — 当智能体的终端/代码执行遇到受限命令时，用户会看到 `✅ 批准` / `❌ 拒绝` 按钮，而无需输入 `/approve` 或 `/deny`。
- **斜杠命令确认** — 像 `/reload-mcp` 这样的特权命令会显示 `✅ 一次性批准` / `🔒 始终` / `❌ 取消` 按钮。

所有交互式提示在按钮无法渲染时（例如在旧版 WhatsApp 客户端上）都会优雅地降级为纯文本。

### 读取收据和输入指示器 (Read receipts and typing indicator)

Hermes 会立即确认入站消息：

- 您的消息一旦网关接收，就会显示**蓝色双重勾号**。
- 在您的 WhatsApp 聊天中，机器人的名称会显示**“正在输入…”**，直到智能体准备好回复。
- 当机器人发送第一条回复消息时，输入指示器会自动消失。

这使得用户可以清楚地知道机器人是否已看到他们的消息，或者它仍在处理回复。

### 语音消息 (Voice messages)

WhatsApp 会区分“语音备忘录”（绿色波形气泡）和通用的音频文件附件。区别纯粹是编解码器：语音备忘录需要是 `audio/ogg` 格式并使用 `opus` 编码。

Hermes TTS 生成 MP3。有两种路径：

- **在 PATH 中有 ffmpeg**（推荐）— 出站 TTS 会被转换并作为正确的语音备忘录到达。安装方法：
  - Windows: `winget install Gyan.FFmpeg`
  - macOS: `brew install ffmpeg`
  - Linux: 使用包管理器
- **没有 ffmpeg** — 出站 TTS 作为 MP3 音频附件到达。播放正常，只是看起来不像语音备忘录。网关日志中会触发一次警告，以便您知晓。

您可以通过健康检查端点来检查网关是否找到了 ffmpeg：

```bash
curl http://localhost:8090/health
# 查找 "ffmpeg_present": true
```

---

## 已知限制 (Known limitations)

### 24 小时对话窗口

Meta 只允许在用户最后一条入站消息后的 24 小时内发送**自由格式的消息**。超过此窗口，Meta 的 API 只接受预先批准的**消息模板**。

**这意味着什么：**

- 反馈式聊天（用户私信 → 机器人回复在 24 小时内 → 用户回复 → ...）可以永久进行。这涵盖了 >95% 的正常机器人使用场景。
- **在间隔超过 24 小时的后才发送给 WhatsApp 的定时任务 (Cron jobs)** 将因 Graph 错误代码 `131047`（“重新参与消息”）而失败。
- **耗时超过 24 小时的长运行 `delegate_task` 异步结果** 会以相同的方式失败。
- **将外部事件路由到 WhatsApp 的 Webhook 订阅者** 在用户最近没有私信机器人时会失败。

Hermes 会在其系统提示中警告智能体这个窗口期，因此模型在安排延迟消息时会提及这一点。

消息模板支持（用于超期发送的解决方案）尚未在 Hermes 中实现。如果需要此功能，请 [打开一个问题](https://github.com/NousResearch/hermes-agent/issues) — 它已计划中，但正在等待明确的需求信号。

### 群聊 (Group chats)

云 API 对群组支持有限（能力受 Meta 限制）。Hermes 的 `whatsapp_cloud` 适配器目前仅在 v1 中处理**私信**。如果需要群聊，请使用 Baileys 桥接器。

### 出站速率限制 (Outbound rate limit)

Meta 的默认吞吐量是**每条业务电话号码 80 条消息/秒**，并提供升级选项。Hermes 目前不进行客户端强制执行——极高容量的消息发送可能会达到 Meta 的限制。

---

## 故障排除 (Troubleshooting)

### Meta 控制台中出现“URL 无法验证”的设置验证失败

几乎总是以下几种情况之一：

- **隧道 URL 错误或已过期** — cloudflared quick tunnels 会轮换。获取一个新的 URL 并更新 `.env` 和 Meta 的控制台。
- **验证令牌不匹配** — `~/.hermes/.env` 中的 `WHATSAPP_CLOUD_VERIFY_TOKEN` 必须与您输入到 Meta 控制台中的内容完全一致。先运行上面的 curl 探测来确认网关的本地验证握手是否正常工作。
- **网关未运行** — 检查 `hermes gateway` 是否已启动。
- **未设置 App Secret** — 没有它，Hermes 会拒绝带有 503 错误的入站 POST 请求。Meta 将此解释为“无法验证”。

### `graph error 100`: 对象 ID '...' 不存在

您将电话号码（10-11 位数字）粘贴到 `WHATSAPP_CLOUD_PHONE_NUMBER_ID` 中，而不是电话号码 ID（Meta 的 15-17 位内部 ID）。请重新检查 API 设置页面——电话号码 ID 显示在“From”下拉菜单的*下方*。

现在向导功能会通过验证器捕获这种情况，但如果您是手动配置，了解这一点仍然有益。

### `graph error 190`: 身份验证错误 (Authentication Error)

您的访问令牌无效。子代码：

- `subcode 463` — 令牌已过期。临时令牌有效期为 24 小时。请重新生成或切换到系统用户永久令牌（参见上文）。
- `subcode 467` — 令牌已被作废（撤销或密码更改）。
- 其他 190 — 生成令牌时没有所需的权限。请确保选择了所有三个（`business_management`、`whatsapp_business_messaging`、`whatsapp_business_management`）。

### `graph error 131047`: 重新参与消息 (Re-engagement message)

24 小时对话窗口已过期（参见“已知限制”）。请：

- 要求用户先私信机器人以重新开启窗口。
- 等待消息模板支持在 Hermes 中实现。

### 入站消息: `media metadata fetch failed (status=401)`

与出站端点的相同 401 根本原因（`graph error 190`）— 访问令牌无效或已过期。请修复令牌。

### 机器人回复显示为原始 JSON / 工具调用泄露 (Tool-call leakage)

常见原因：为 `whatsapp_cloud` 配置的工具集缺少智能体想要调用的工具。请检查 `hermes tools list` 并验证平台是否正在使用 `hermes-whatsapp`（默认的 Cloud 适配器工具集，与 Baileys 相同）。

如果模型发出的是工具调用形状的文本而不是结构化调用，通常意味着工具集实际上是空的。请参阅 `hermes_cli/platforms.py` 查看平台到默认工具集的映射。

### STT（语音备忘录转录）返回空值 / “无法转录”

默认的 `stt.provider: local` 需要 `pip install faster-whisper`。如果您是 Nous 订阅者，可以通过 Meta 的托管音频网关来路由 STT：

```bash
hermes config set stt.provider openai
hermes config set stt.use_gateway true
hermes gateway restart
```

这使用您的 Nous Portal 访问令牌，而不是需要单独的 OpenAI 密钥。

---

## 安全注意事项 (Security notes)

- **将 App Secret 视为密码** — 任何拥有它的人都可以伪造 Hermes 会接受的有效 webhook 有效载荷。
- **验证令牌是一个共享秘密** — 泄露的风险较低（最坏的情况是有人可以将 Meta 的 webhook 重新订阅到他们自己的不同 URL），但仍应避免提交它。
- **访问令牌即您的机器人身份** — 系统用户令牌等同于长期有效的 API 密钥。如果部署被泄露，请立即轮换。
- **当设置了 `WHATSAPP_CLOUD_APP_SECRET` 时，Webhook 端点只接受经过签名的请求** — 即使在开发环境中也应保持设置。否则，网关会拒绝带有 HTTP 503 的入站交付。
- **`/health` 端点是非身份验证的** — 它安全地暴露，因为它只报告配置是否存在（布尔值），而不是值的具体内容。但如果您宁愿不公开它，请在反向代理/隧道层限制访问。

---

## 与 Baileys 桥接器的比较 (Comparison to the Baileys bridge)

| | Baileys (`hermes whatsapp`) | Cloud API (`hermes whatsapp-cloud`) |
|---|---|---|
| 账号类型 | 个人 | 企业 |
| 设置 | QR 代码扫描 | Meta 应用 + WABA + 令牌 |
| 依赖项 | Node.js + npm | 纯 Python (httpx + aiohttp) |
| 流程 | 管理的 Node 子进程 | aiohttp webhook 服务器 |
| 是否需要公共 URL？ | 否 | 是 |
| 账号封禁风险 | 有（非官方 API） | 无（官方支持） |
| 入站消息 | 定时轮询 Node 桥接器 | 来自 Meta 的 Webhook POST |
| 出站消息 | 本地桥接器 → Baileys | HTTPS 到 graph.facebook.com |
| 群聊 | 完全支持 | 仅限私信（v1） |
| 24 小时窗口 | 无限制 | 硬性规则 — 超期后需要模板 |
| 语音备忘录 (出站) | 原生 | 需要 ffmpeg，否则退化为 MP3 |
| 读取收据 | 否 | 是（蓝色双重勾号） |
| 输入指示器 | 否 | 是（回复时自动消失） |
| 交互式按钮 | 仅文本降级 | 原生（澄清、批准、斜杠确认） |
| 生产使用 | 有风险（Meta 可能封禁） | 为此设计 |

大多数用于个人项目的 Hermes 用户倾向于 Baileys。大多数用于客户服务的机器人用户倾向于 Cloud API。

---

## 另请参阅 (See also)

- [Meta 的官方 WhatsApp Business Cloud API 文档](https://developers.facebook.com/documentation/business-messaging/whatsapp/) — 底层平台、定价、应用审核和 Meta 端点速率限制的权威参考资料。
- [WhatsApp（Baileys 桥接器）设置](whatsapp.md) — 个人项目的替代集成方案。
- [消息平台概览](index.md) — 所有消息集成的总览。