---
sidebar_position: 17
title: "LINE"
description: "将Hermes智能体设置为LINE Messaging API机器人"
---

# LINE设置

通过官方LINE Messaging API将Hermes智能体作为[LINE](https://line.me/)机器人运行。该适配器作为捆绑的平台插件位于`plugins/platforms/line/`下——无需修改核心代码，像启用任何其他平台一样启用它即可。

LINE是日本、台湾和泰国的主流通讯应用。如果您的用户位于这些地区，这是他们联系您的方式。

> 运行`hermes gateway setup`并选择**LINE**以获得引导式操作指南。

## 机器人如何响应

| 上下文 | 行为 |
|---------|----------|
| **1:1聊天** (`U` ID) | 响应每条消息 |
| **群聊** (`C` ID) | 当该群在允许列表中时响应 |
| **多用户房间** (`R` ID) | 当该房间在允许列表中时响应 |

接收的文本、图片、音频、视频、文件、贴纸和位置信息都会被处理。发送文本时**优先使用免费回复令牌**（单次使用，约60秒窗口），当令牌过期后则回退到按量计费的Push API。

---

## 步骤1：创建LINE Messaging API通道

1.  前往[LINE开发者控制台](https://developers.line.biz/console/)。
2.  创建一个提供商，然后在其下创建一个**Messaging API**通道。
3.  在该通道的**基本设置**标签页中，复制**Channel secret**。
4.  在**Messaging API**标签页，滚动到**Channel access token (长期有效)**，点击**发行**。复制该令牌。
5.  在**Messaging API**标签页，还要禁用**自动回复消息**和**问候消息**，以免它们与您机器人的回复冲突。

---

## 步骤2：暴露Webhook端口

LINE通过公共HTTPS传递Webhook。默认端口是`8646`——如果需要，可以用`LINE_PORT`进行覆盖。

```bash
# Cloudflare Tunnel（推荐用于生产环境——固定主机名）
cloudflared tunnel --url http://localhost:8646

# ngrok（适用于开发）
ngrok http 8646

# devtunnel
devtunnel create hermes-line --allow-anonymous
devtunnel port create hermes-line -p 8646 --protocol https
devtunnel host hermes-line
```

复制`https://...` URL——您将在下面将其设置为Webhook URL。测试时请**保持隧道运行**。对于生产环境，设置一个固定的Cloudflare命名隧道，这样Webhook URL就不会因重启而改变。

---

## 步骤3：配置Hermes

添加到 `~/.hermes/.env` 文件：

```env
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LONG_LIVED_TOKEN
LINE_CHANNEL_SECRET=YOUR_CHANNEL_SECRET

# 允许列表 — 至少设置其中一个（或开发时设置 LINE_ALLOW_ALL_USERS=true）
LINE_ALLOWED_USERS=U1234567890abcdef...           # 以U开头的逗号分隔ID
LINE_ALLOWED_GROUPS=C1234567890abcdef...          # 可选的群组ID
LINE_ALLOWED_ROOMS=R1234567890abcdef...           # 可选的房间ID

# 发送图片/音频/视频所必需 — 隧道解析的公共HTTPS基础URL。
# 如果没有设置，send_image/voice/video 将拒绝执行。
LINE_PUBLIC_URL=https://my-tunnel.example.com
```

然后在 `~/.hermes/config.yaml` 文件中：

```yaml
gateway:
  platforms:
    line:
      enabled: true
```

这就够了——`gateway/config.py`中的捆绑插件扫描会自动识别`plugins/platforms/line/`。无需编辑`Platform.LINE`枚举，也无需在`_create_adapter`中注册。

---

## 步骤4：设置Webhook URL

返回LINE控制台：

1.  打开您的通道 → **Messaging API**标签页。
2.  在**Webhook设置** → **Webhook URL**下，粘贴 `https://<your-tunnel>/line/webhook`（注意`/line/webhook`路径——适配器在此监听）。
3.  点击**验证**。LINE会Ping该URL；您应该看到200状态码。
4.  将**使用Webhook**开关切换到**开启**。

---

## 步骤5：运行网关

```bash
hermes gateway
```

智能体日志将显示：

```
LINE: webhook listening on 0.0.0.0:8646/line/webhook (public: https://my-tunnel.example.com)
```

从LINE应用添加该机器人为好友（扫描通道**Messaging API**标签页中的二维码）并向其发送一条消息。

---

## LLM响应缓慢问题

LINE的回复令牌是单次使用，且在接收事件后约60秒过期。响应慢的LLM无法及时回复，这通常会导致需要付费的Push API调用。

当LLM运行时间超过`LINE_SLOW_RESPONSE_THRESHOLD`秒（默认`45`秒）时，适配器会消耗原始回复令牌，发送一个**模板按钮**气泡：

> 🤖 仍在思考。准备好后点击下方获取答案。
>
> [ 获取答案 ]

用户在方便时点击**获取答案**——该回传事件会传递一个*新的*回复令牌，适配器使用它来发送缓存的答案（仍然免费）。

状态机：`PENDING → READY → DELIVERED`，以及用于已取消运行的`ERROR`（孤立的PENDING状态在`/stop`后会解析为“运行在完成前被中断。”，以防止持久按钮循环）。

要禁用回传按钮并始终回退到Push发送：

```env
LINE_SLOW_RESPONSE_THRESHOLD=0
```

为了可靠地触发回传流程，请抑制那些可能在阈值前消耗掉回复令牌的闲聊：

```yaml
# ~/.hermes/config.yaml
display:
  interim_assistant_messages: false
  platforms:
    line:
      tool_progress: off
```

---

## 定时任务/通知传递

```env
LINE_HOME_CHANNEL=Uxxxxxxxxxxxxxxxxxxxx     # 默认传递目标
```

带有 `deliver: line` 的定时任务会路由到 `LINE_HOME_CHANNEL`。适配器附带一个独立的仅限Push的发送器，因此即使定时任务在与网关不同的进程中运行也能正常工作。

---

## 环境变量参考

| 变量 | 必需 | 默认值 | 描述 |
|---|---|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | 是 | — | 长期有效的通道访问令牌 |
| `LINE_CHANNEL_SECRET` | 是 | — | 通道密钥（用于HMAC-SHA256 Webhook验证） |
| `LINE_HOST` | 否 | `0.0.0.0` | Webhook绑定主机 |
| `LINE_PORT` | 否 | `8646` | Webhook绑定端口 |
| `LINE_PUBLIC_URL` | 用于媒体 | — | 公共HTTPS基础URL；发送图片/音频/视频所必需 |
| `LINE_ALLOWED_USERS` | 设置其一 | — | 逗号分隔的用户ID（以U开头） |
| `LINE_ALLOWED_GROUPS` | 设置其一 | — | 逗号分隔的群组ID（以C开头） |
| `LINE_ALLOWED_ROOMS` | 设置其一 | — | 逗号分隔的房间ID（以R开头） |
| `LINE_ALLOW_ALL_USERS` | 仅限开发 | `false` | 完全跳过允许列表 |
| `LINE_HOME_CHANNEL` | 否 | — | 默认的定时任务/通知传递目标 |
| `LINE_SLOW_RESPONSE_THRESHOLD` | 否 | `45` | 触发回传按钮的秒数（`0` = 禁用） |
| `LINE_PENDING_TEXT` | 否 | "🤔 仍在思考…" | 与回传按钮一起显示的气泡文本 |
| `LINE_BUTTON_LABEL` | 否 | "获取答案" | 按钮标签 |
| `LINE_DELIVERED_TEXT` | 否 | "已回复 ✅" | 当已交付的按钮被再次点击时的回复 |
| `LINE_INTERRUPTED_TEXT` | 否 | "运行在完成前被中断。" | 当`/stop`的孤立按钮被点击时的回复 |

---

## 故障排除

**Webhook验证时出现"invalid signature"。** `Channel secret`复制错误，或者您的隧道重写了请求体。首先使用 `curl -i https://<tunnel>/line/webhook/health` 验证——这应返回 `{"status":"ok","platform":"line"}`。

**机器人在群组中收不到消息。** 检查 `LINE_ALLOWED_GROUPS` 是否包含 `C...` 群组ID。要查找群组ID，发送一条测试消息并在 `~/.hermes/logs/gateway.log` 中搜索 `LINE: rejecting unauthorized source` ——被拒绝的源字典中包含这些ID。

**`send_image` 失败并提示"LINE_PUBLIC_URL must be set"。** LINE的Messaging API不接受二进制上传——图片、音频和视频必须是可访问的HTTPS URL。将 `LINE_PUBLIC_URL` 设置为隧道的公共主机名，适配器将自动从 `/line/media/<token>/<filename>` 提供文件服务。

**回传按钮从未出现。** 要么LLM响应速度快于 `LINE_SLOW_RESPONSE_THRESHOLD`，要么另一个气泡（工具进度、流式传输）先消耗了回复令牌。请参考“LLM响应缓慢问题”下的抑制配置。

**"already in use by another profile"。** 相同的通道访问令牌已绑定到另一个正在运行的Hermes配置文件。停止另一个网关或使用单独的通道。

---

## 限制

* **每个块一个气泡。** 每个LINE文本气泡上限为5000个字符，每次Reply/Push调用最多发送5个气泡。较长的响应将被截断并附加省略号。
* **不支持原生消息编辑。** LINE没有编辑消息API——流式响应总是发送新的气泡，从不编辑之前的气泡。
* **不支持Markdown渲染。** 粗体（`**`）、斜体（`*`）、代码块和标题会渲染为字面字符。适配器会在发送前将其去除；URL会被保留（`[label](url)` 会变成 `label (url)`）。
* **加载指示器仅限私聊。** LINE拒绝为群组和房间使用聊天/加载API，因此打字指示器仅在1:1聊天中显示。