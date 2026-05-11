---
sidebar_position: 17
title: "LINE"
description: "将 Hermes 智能体设置为 LINE 消息 API 机器人"
---

# LINE 设置

通过官方 LINE 消息 API 将 Hermes 智能体作为 [LINE](https://line.me/) 机器人运行。该适配器作为一个捆绑的平台插件位于 `plugins/platforms/line/` 下 —— 无需修改核心代码，只需像启用其他平台一样启用它即可。

LINE 是日本、台湾和泰国的主流消息应用。如果你的用户在那里，这就是他们联系你的方式。

## 机器人如何响应

| 上下文 | 行为 |
|---------|----------|
| **1:1 聊天**（`U` ID） | 响应每条消息 |
| **群聊**（`C` ID） | 当群组在允许列表中时响应 |
| **多用户房间**（`R` ID） | 当房间在允许列表中时响应 |

接收的文本、图片、音频、视频、文件、贴纸和位置信息都会被处理。发送的文本**优先使用免费的回复令牌**（一次性使用，约 60 秒有效窗口），当令牌过期后，才会回退到按量计费的推送 API。

---

## 步骤 1：创建 LINE 消息 API 频道

1.  前往 [LINE 开发者控制台](https://developers.line.biz/console/)。
2.  创建一个 Provider，然后在其中创建一个 **消息 API** 频道。
3.  在频道的 **基本设置** 选项卡中，复制 **频道密钥**。
4.  在 **消息 API** 选项卡中，滚动到 **频道访问令牌（长期）** 并点击 **发行**。复制该令牌。
5.  在 **消息 API** 选项卡中，同时禁用 **自动回复消息** 和 **问候消息**，以免它们与你的机器人回复冲突。

---

## 步骤 2：暴露 webhook 端口

LINE 通过公共 HTTPS 传递 webhook。默认端口是 `8646` —— 如果需要，可以使用 `LINE_PORT` 覆盖。

```bash
# Cloudflare Tunnel（推荐用于生产环境 —— 固定主机名）
cloudflared tunnel --url http://localhost:8646

# ngrok（适用于开发）
ngrok http 8646

# devtunnel
devtunnel create hermes-line --allow-anonymous
devtunnel port create hermes-line -p 8646 --protocol https
devtunnel host hermes-line
```

复制 `https://...` URL —— 你将在下面将其设置为 webhook URL。测试期间**保持隧道运行**。对于生产环境，请设置一个固定的 Cloudflare 命名隧道，这样 webhook URL 在重启时就不会改变。

---

## 步骤 3：配置 Hermes

添加到 `~/.hermes/.env`：

```env
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LONG_LIVED_TOKEN
LINE_CHANNEL_SECRET=YOUR_CHANNEL_SECRET

# 允许列表 —— 至少设置其中一个（或设置 LINE_ALLOW_ALL_USERS=true 用于开发）
LINE_ALLOWED_USERS=U1234567890abcdef...           # 逗号分隔的 U 前缀 ID
LINE_ALLOWED_GROUPS=C1234567890abcdef...          # 可选的群组 ID
LINE_ALLOWED_ROOMS=R1234567890abcdef...           # 可选的房间 ID

# 发送图片/音频/视频所需 —— 隧道解析到的公共 HTTPS 基础 URL。
# 如果没有它，send_image/voice/video 将拒绝执行。
LINE_PUBLIC_URL=https://my-tunnel.example.com
```

然后在 `~/.hermes/config.yaml` 中：

```yaml
gateway:
  platforms:
    line:
      enabled: true
```

这样就足够了 —— `gateway/config.py` 中的捆绑插件扫描会自动加载 `plugins/platforms/line/`。无需编辑 `Platform.LINE` 枚举，也无需注册 `_create_adapter`。

---

## 步骤 4：设置 webhook URL

回到 LINE 控制台：

1.  打开你的频道 → **消息 API** 选项卡。
2.  在 **Webhook 设置** → **Webhook URL** 下，粘贴 `https://<your-tunnel>/line/webhook`（注意 `/line/webhook` 路径 —— 适配器在此处监听）。
3.  点击 **验证**。LINE 会 ping 该 URL；你应该能看到一个 200 状态码。
4.  将 **使用 webhook** 开关切换到 **开启**。

---

## 步骤 5：运行网关

```bash
hermes gateway
```

智能体日志将显示：

```
LINE: webhook 监听于 0.0.0.0:8646/line/webhook (公共地址: https://my-tunnel.example.com)
```

从 LINE 应用中添加机器人为好友（扫描频道 **消息 API** 选项卡中的二维码）并给它发送一条消息。

---

## LLM 响应缓慢

LINE 的回复令牌是一次性使用的，并在入站事件后大约 60 秒过期。响应慢的 LLM 无法及时回复，这通常会导致使用付费的推送 API 调用。

当 LLM 运行时间超过 `LINE_SLOW_RESPONSE_THRESHOLD` 秒（默认 `45`）时，适配器会消耗原始回复令牌来发送一个 **模板按钮** 气泡：

> 🤖 仍在思考中。准备好后请点击下方获取答案。
>
> [ 获取答案 ]

用户在方便时点击 **获取答案** —— 这个回传动作会提供一个*新的*回复令牌，适配器使用它来发送缓存的答案（仍然免费）。

状态机：`PENDING → READY → DELIVERED`，另外对于已取消的运行有 `ERROR` 状态（孤立的 PENDING 状态在 `/stop` 后会解析为“运行在完成前被中断。”，以防止持久按钮循环）。

要禁用回传按钮并始终回退到推送 API：

```env
LINE_SLOW_RESPONSE_THRESHOLD=0
```

为了可靠地触发回传流程，需要抑制那些可能在达到阈值前就消耗掉回复令牌的提示信息：

```yaml
# ~/.hermes/config.yaml
display:
  interim_assistant_messages: false
  platforms:
    line:
      tool_progress: off
```

---

## 定时任务 / 通知传递

```env
LINE_HOME_CHANNEL=Uxxxxxxxxxxxxxxxxxxxx     # 默认传递目标
```

带有 `deliver: line` 的定时任务会路由到 `LINE_HOME_CHANNEL`。适配器附带一个独立的纯推送发送器，因此即使定时任务在与网关不同的进程中运行，也能正常工作。

---

## 环境变量参考

| 变量 | 是否必需 | 默认值 | 描述 |
|---|---|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | 是 | — | 长期频道访问令牌 |
| `LINE_CHANNEL_SECRET` | 是 | — | 频道密钥（用于 HMAC-SHA256 webhook 验证） |
| `LINE_HOST` | 否 | `0.0.0.0` | Webhook 绑定主机 |
| `LINE_PORT` | 否 | `8646` | Webhook 绑定端口 |
| `LINE_PUBLIC_URL` | 媒体发送必需 | — | 公共 HTTPS 基础 URL；发送图片/音频/视频所需 |
| `LINE_ALLOWED_USERS` | 至少设置一个 | — | 逗号分隔的用户 ID（U 前缀） |
| `LINE_ALLOWED_GROUPS` | 至少设置一个 | — | 逗号分隔的群组 ID（C 前缀） |
| `LINE_ALLOWED_ROOMS` | 至少设置一个 | — | 逗号分隔的房间 ID（R 前缀） |
| `LINE_ALLOW_ALL_USERS` | 仅开发用 | `false` | 完全跳过允许列表 |
| `LINE_HOME_CHANNEL` | 否 | — | 默认定时任务 / 通知传递目标 |
| `LINE_SLOW_RESPONSE_THRESHOLD` | 否 | `45` | 回传按钮触发前的等待秒数（`0` = 禁用） |
| `LINE_PENDING_TEXT` | 否 | "🤖 仍在思考中…" | 与回传按钮一起显示的气泡文本 |
| `LINE_BUTTON_LABEL` | 否 | "获取答案" | 按钮标签 |
| `LINE_DELIVERED_TEXT` | 否 | "已回复 ✅" | 当再次点击已传递的按钮时的回复 |
| `LINE_INTERRUPTED_TEXT` | 否 | "运行在完成前被中断。" | 当点击 `/stop` 后的孤立按钮时的回复 |

---

## 故障排除

**"invalid signature" webhook 验证错误。** `频道密钥` 复制错误，或者你的隧道修改了请求体。先用 `curl -i https://<tunnel>/line/webhook/health` 验证 —— 应该返回 `{"status":"ok","platform":"line"}`。

**机器人在群组中收不到任何消息。** 检查 `LINE_ALLOWED_GROUPS` 是否包含 `C...` 群组 ID。要查找群组 ID，发送一条测试消息并搜索 `~/.hermes/logs/gateway.log` 中的 `LINE: rejecting unauthorized source` —— 被拒绝的源字典中包含该 ID。

**`send_image` 失败并提示 "LINE_PUBLIC_URL must be set"。** LINE 的消息 API 不接受二进制上传 —— 图片、音频和视频必须是可访问的 HTTPS URL。将 `LINE_PUBLIC_URL` 设置为隧道的公共主机名，适配器将自动从 `/line/media/<token>/<filename}` 提供文件服务。

**回传按钮从未出现。** 要么 LLM 响应速度比 `LINE_SLOW_RESPONSE_THRESHOLD` 快，要么另一个气泡（工具进度、流式输出）先消耗了回复令牌。参见“LLM 响应缓慢”下的抑制配置部分。

**"already in use by another profile"。** 同一个频道访问令牌已绑定到另一个正在运行的 Hermes 配置文件。停止另一个网关或使用单独的频道。

---

## 限制

* **每个块只能有一个气泡。** 每个 LINE 文本气泡限制为 5000 个字符，并且每次回复/推送调用最多发送 5 个气泡。较长的回复将被截断并附加省略号。
* **无法编辑原生消息。** LINE 没有编辑消息 API —— 流式响应总是发送新的气泡，从不编辑之前的气泡。
* **无 Markdown 渲染。** 粗体（`**`）、斜体（`*`）、代码块和标题会显示为字面字符。适配器在发送前会去除它们；URL 会保留（`[label](url)` 变为 `label (url)`）。
* **加载指示器仅限私聊。** LINE 拒绝对群组和房间使用聊天/加载 API，因此打字指示器仅在 1:1 聊天中显示。