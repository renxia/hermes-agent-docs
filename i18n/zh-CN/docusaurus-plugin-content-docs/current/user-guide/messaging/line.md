sidebar_position: 17
title: "LINE"
description: "将 Hermes 智能体设置为 LINE 消息 API 机器人"
---

# LINE 设置

通过官方的 LINE Messaging API，以 [LINE](https://line.me/) 机器人身份运行 Hermes 智能体。适配器作为捆绑的平台插件存在于 `plugins/platforms/line/` 下——无需核心代码修改，只需像启用其他任何平台一样启用它即可。

LINE 是日本、台湾和泰国的主流消息应用。如果您的用户居住在那里，这就是他们联系到您的方式。

> 运行 `hermes gateway setup` 并选择 **LINE** 以获得引导式操作流程。

## 机器人的响应方式

| 上下文 | 行为 |
|---------|----------|
| **1:1 聊天** (`U` ID) | 对每条消息进行响应 |
| **群聊** (`C` ID) | 当群组在允许列表中时进行响应 |
| **多用户房间** (`R` ID) | 当房间在允许列表中时进行响应 |

所有传入的文本、图像、音频、视频、文件、贴纸和位置信息都得到了处理。传出的文本首先使用**免费回复令牌**（一次性使用，~60秒窗口），当令牌过期后会回退到计费的推送 API。

---

## 第 1 步：创建 LINE Messaging API 通道

1. 访问 [LINE Developers Console](https://developers.line.biz/console/)。
2. 创建一个提供商（Provider），然后在其中创建一个**Messaging API** 通道。
3. 从该通道的**基本设置**标签页，复制**通道密钥 (Channel secret)**。
4. 从**Messaging API** 标签页，滚动到**通道访问令牌（长期有效）(Channel access token (long-lived))**并点击**签发 (Issue)**。复制此令牌。
5. 在 **Messaging API** 标签页中，同时禁用**自动回复消息 (Auto-reply messages)** 和**欢迎消息 (Greeting messages)**，以防止它们与您的智能体回复发生冲突。

---

## 第 2 步：暴露 Webhook 端口

LINE 通过公共 HTTPS 提供 Webhooks。默认端口是 `8646`——如果需要，请使用 `LINE_PORT` 进行覆盖。

```bash
# Cloudflare Tunnel（推荐用于生产环境 — 固定主机名）
cloudflared tunnel --url http://localhost:8646

# ngrok（适合开发）
ngrok http 8646

# devtunnel
devtunnel create hermes-line --allow-anonymous
devtunnel port create hermes-line -p 8646 --protocol https
devtunnel host hermes-line
```

复制 `https://...` URL——您将将其设置为下面的 Webhook URL。**在测试期间保持隧道运行**。对于生产环境，请设置一个固定的 Cloudflare 命名隧道，以确保 Webhook URL 不会在重启时改变。

---

## 第 3 步：配置 Hermes

添加到 `~/.hermes/.env`：

```env
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LONG_LIVED_TOKEN
LINE_CHANNEL_SECRET=YOUR_CHANNEL_SECRET

# 允许列表 — 至少包含以下一项（或对于开发环境使用 LINE_ALLOW_ALL_USERS=true）
LINE_ALLOWED_USERS=U1234567890abcdef...           # 用逗号分隔的 U 前缀 ID
LINE_ALLOWED_GROUPS=C1234567890abcdef...          # 可选群组 ID
LINE_ALLOWED_ROOMS=R1234567890abcdef...           # 可选房间 ID

# 必需项，用于发送图像/音频/视频 — 即隧道解析到的公共 HTTPS 基 URL。如果没有它，send_image/voice/video 将会拒绝操作。
LINE_PUBLIC_URL=https://my-tunnel.example.com
```

然后在 `~/.hermes/config.yaml` 中：

```yaml
gateway:
  platforms:
    line:
      enabled: true
```

这就足够了——`gateway/config.py` 中的捆绑插件扫描会自动识别 `plugins/platforms/line/`。无需编辑 `Platform.LINE` 枚举，也无需注册 `_create_adapter`。

---

## 第 4 步：设置 Webhook URL

回到 LINE 控制台：

1. 打开您的通道 → **Messaging API** 标签页。
2. 在 **Webhook settings** → **Webhook URL** 下，粘贴 `https://<your-tunnel>/line/webhook`（注意 `/line/webhook` 路径——适配器在其中监听）。
3. 点击**验证 (Verify)**。LINE 会 ping 该 URL；您应该看到一个 200 状态码。
4. 将 **Use webhook** 切换到 **On**。

---

## 第 5 步：运行网关

```bash
hermes gateway
```

智能体日志显示：

```
LINE: webhook listening on 0.0.0.0:8646/line/webhook (public: https://my-tunnel.example.com)
```

从 LINE 应用中将机器人添加为好友（扫描通道**Messaging API**标签页中的二维码）并发送一条消息。

---

## 慢速 LLM 响应

LINE 的回复令牌是单次使用的，在传入事件发生后大约 60 秒内过期。如果 LLM 反应缓慢，就无法及时回复，这通常会强制进行付费的推送 API 调用。

当 LLM 运行时间超过 `LINE_SLOW_RESPONSE_THRESHOLD` 秒（默认值为 `45`）时，适配器会消耗原始回复令牌来发送一个**模板按钮 (Template Buttons)** 气泡：

> 🤔 仍在思考。点击下方按钮，在准备好后获取答案。
>
> [ 获取答案 ]

用户可以在方便的时候点击**Get answer**——这个回传（postback）会提供一个新的回复令牌，适配器使用该令牌来发送缓存的答案（仍然是免费的）。

状态机：`PENDING → READY → DELIVERED`，以及用于取消运行的 `ERROR`。未完成的 PENDING 会在 `/stop` 之后解析为“运行在完成前被中断”，从而防止持久按钮无限循环。

要禁用回传按钮并始终使用推送回退（Push-fallback）功能，请设置：

```env
LINE_SLOW_RESPONSE_THRESHOLD=0
```

为了可靠地触发回传流程，请抑制会消耗回复令牌的闲聊内容：

```yaml
# ~/.hermes/config.yaml
display:
  interim_assistant_messages: false
  platforms:
    line:
      tool_progress: off
```

---

## Cron / 通知交付

```env
LINE_HOME_CHANNEL=Uxxxxxxxxxxxxxxxxxxxx     # 默认交付目标
```

带有 `deliver: line` 的定时任务会路由到 `LINE_HOME_CHANNEL`。适配器提供了一个独立的推送专用发送器，因此即使 cron 在网关之外的独立进程中运行，定时任务也能正常工作。

---

## 环境变量参考

| 变量 | 是否必需 | 默认值 | 描述 |
|---|---|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | 是 | — | 通道长期访问令牌 |
| `LINE_CHANNEL_SECRET` | 是 | — | 通道密钥（HMAC-SHA256 Webhook 验证） |
| `LINE_HOST` | 否 | `0.0.0.0` | Webhook 绑定主机 |
| `LINE_PORT` | 否 | `8646` | Webhook 绑定端口 |
| `LINE_PUBLIC_URL` | 用于媒体 | — | 公共 HTTPS 基 URL；用于图像/音频/视频发送的必需项 |
| `LINE_ALLOWED_USERS` | 任选一项 | — | 用逗号分隔的用户 ID（U 前缀） |
| `LINE_ALLOWED_GROUPS` | 任选一项 | — | 用逗号分隔的群组 ID（C 前缀） |
| `LINE_ALLOWED_ROOMS` | 任选一项 | — | 用逗号分隔的房间 ID（R 前缀） |
| `LINE_ALLOW_ALL_USERS` | 仅开发环境 | `false` | 完全跳过允许列表 |
| `LINE_HOME_CHANNEL` | 否 | — | 默认的 Cron / 通知交付目标 |
| `LINE_SLOW_RESPONSE_THRESHOLD` | 否 | `45` | 回传按钮触发前的秒数（`0` = 已禁用） |
| `LINE_PENDING_TEXT` | 否 | "🤔 仍在思考…" | 与回传按钮一起显示的气泡文本 |
| `LINE_BUTTON_LABEL` | 否 | "获取答案" | 按钮标签 |
| `LINE_DELIVERED_TEXT` | 否 | "已回复 ✅" | 当再次点击已交付的按钮时显示的回复内容 |
| `LINE_INTERRUPTED_TEXT` | 否 | "运行在完成前被中断。" | 当点击 `/stop` 的孤立按钮时显示的回复内容 |

---

## 故障排除

**Webhook 验证时出现“invalid signature”。** 您是否错误地复制了 `Channel secret`，或者您的隧道重写了请求体？请先使用 `curl -i https://<tunnel>/line/webhook/health` 进行验证——这应该返回 `{"status":"ok","platform":"line"}`。

**机器人未在群组中接收到任何消息。** 请检查 `LINE_ALLOWED_GROUPS` 是否包含相应的 `C...` 群组 ID。要查找群组 ID，请发送一条测试消息，然后 grep `~/.hermes/logs/gateway.log` 查找 `LINE: rejecting unauthorized source`——被拒绝的源字典中包含这些 ID。

**`send_image` 失败并提示“LINE_PUBLIC_URL must be set”。** LINE 的 Messaging API 不接受二进制上传——图像、音频和视频必须是可访问的 HTTPS URL。请将 `LINE_PUBLIC_URL` 设置为隧道的公共主机名，适配器将自动从 `/line/media/<token>/<filename>` 提供文件服务。

**回传按钮从未出现。** 要么 LLM 的响应速度快于 `LINE_SLOW_RESPONSE_THRESHOLD`，要么另一个气泡（工具进度、流式传输）抢先消耗了回复令牌。请参阅“慢速 LLM 响应”下的抑制块。

**“already in use by another profile”。** 同一个通道访问令牌被绑定到另一个正在运行的 Hermes 配置文件上。请停止另一个网关，或使用单独的一个通道。

---

## 限制

* **气泡和长度上限。** 每个 LINE 文本气泡有 5000 个字符的限制。较长的回复会被智能地分块（chunked），分成最多 5 个气泡，跨越一次 Reply/Push 调用，尽可能在自然边界处分割。
* **不支持原生消息编辑。** LINE 没有编辑消息 API——流式响应总是发送新的气泡，而不会编辑先前的气泡。
* **不支持 Markdown 渲染。**粗体（`**`）、斜体（`*`）、代码围栏和标题都作为字面字符显示。适配器在发送前会移除它们；URL 会被保留（`[label](url)` 会变成 `label (url)`）。
* **加载指示仅限 DM。**LINE 拒绝为群组和房间提供聊天/加载 API，因此输入状态指示只会在 1:1 聊天中显示。