---
sidebar_position: 15
---

# 企业微信回调（自建应用）

将 Hermes 连接到企业微信（WeCom）作为一个使用回调/网络钩子（webhook）模型的自建企业应用。

:::info 企业微信机器人与企业微信回调
Hermes 支持两种企业微信集成模式：
- **[企业微信机器人](wecom.md)** — 机器人风格，通过 WebSocket 连接。设置更简单，可在群聊中使用。
- **企业微信回调**（本页）— 自建应用，接收加密的 XML 回调。在用户的企微侧边栏显示为独立应用。支持多企业路由。
:::

另请参阅：[企业微信机器人](./wecom.md) 以了解机器人风格的集成。

> 运行 `hermes gateway setup` 并选择 **企业微信回调** 以获得引导式设置流程。

## 工作原理

1.  您在企微管理后台注册一个自建应用
2.  企微将加密的 XML 推送到您的 HTTP 回调端点
3.  Hermes 解密消息，并将其加入智能体的处理队列
4.  立即确认（静默响应 — 不会向用户显示任何内容）
5.  智能体处理请求（通常需要 3-30 分钟）
6.  回复通过企微的 `message/send` API 主动推送

## 前提条件

- 拥有管理员权限的企业微信企业账号
- `aiohttp` 和 `httpx` Python 包（默认安装已包含）
- 用于回调 URL 的可公网访问的服务器（或类似 ngrok 的隧道）

## 设置

### 1. 在企微中创建自建应用

1.  前往 [企业微信管理后台](https://work.weixin.qq.com/) → **应用** → **创建应用**
2.  记下您的 **企业 ID**（在管理后台顶部显示）
3.  在应用设置中，创建一个 **应用 Secret**
4.  从应用的概览页面记下 **Agent ID**
5.  在 **接收消息** 下，配置回调 URL：
    - URL：`http://YOUR_PUBLIC_IP:8645/wecom/callback`
    - Token：生成一个随机令牌（企微会提供一个）
    - EncodingAESKey：生成一个密钥（企微会提供一个）

### 2. 配置环境变量

添加到您的 `.env` 文件：

```bash
WECOM_CALLBACK_CORP_ID=your-corp-id
WECOM_CALLBACK_CORP_SECRET=your-corp-secret
WECOM_CALLBACK_AGENT_ID=1000002
WECOM_CALLBACK_TOKEN=your-callback-token
WECOM_CALLBACK_ENCODING_AES_KEY=your-43-char-aes-key

# 可选
WECOM_CALLBACK_HOST=0.0.0.0
WECOM_CALLBACK_PORT=8645
WECOM_CALLBACK_ALLOWED_USERS=user1,user2
```

### 3. 启动网关

```bash
hermes gateway
```

（仅在运行 `hermes gateway install` 注册了 systemd/launchd 服务后才使用 `hermes gateway start`。）

回调适配器会在配置的端口上启动一个 HTTP 服务器。企微将通过 GET 请求验证回调 URL，然后开始通过 POST 发送消息。

## 配置参考

在 `config.yaml` 的 `platforms.wecom_callback.extra` 下设置这些值，或使用环境变量：

| 设置 | 默认值 | 描述 |
|------|--------|------|
| `corp_id` | — | 企业微信企业 Corp ID（必填） |
| `corp_secret` | — | 自建应用的 Corp Secret（必填） |
| `agent_id` | — | 自建应用的 Agent ID（必填） |
| `token` | — | 回调验证令牌（必填） |
| `encoding_aes_key` | — | 43字符的 AES 密钥，用于回调加密（必填） |
| `host` | `0.0.0.0` | HTTP 回调服务器的绑定地址 |
| `port` | `8645` | HTTP 回调服务器的端口 |
| `path` | `/wecom/callback` | 回调端点的 URL 路径 |

## 多应用路由

对于运行多个自建应用的企业（例如，跨不同部门或子公司），在 `config.yaml` 中配置 `apps` 列表：

```yaml
platforms:
  wecom_callback:
    enabled: true
    extra:
      host: "0.0.0.0"
      port: 8645
      apps:
        - name: "dept-a"
          corp_id: "ww_corp_a"
          corp_secret: "secret-a"
          agent_id: "1000002"
          token: "token-a"
          encoding_aes_key: "key-a-43-chars..."
        - name: "dept-b"
          corp_id: "ww_corp_b"
          corp_secret: "secret-b"
          agent_id: "1000003"
          token: "token-b"
          encoding_aes_key: "key-b-43-chars..."
```

用户通过 `corp_id:user_id` 进行作用域划分，以防止跨企业冲突。当用户发送消息时，适配器会记录该用户所属的应用（企业），并通过正确的应用访问令牌路由回复。

## 访问控制

限制哪些用户可以与应用交互：

```bash
# 允许特定用户
WECOM_CALLBACK_ALLOWED_USERS=zhangsan,lisi,wangwu

# 或允许所有用户
WECOM_CALLBACK_ALLOW_ALL_USERS=true
```

## 端点

适配器暴露以下端点：

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/wecom/callback` | URL 验证握手（企微在设置过程中发送此请求） |
| POST | `/wecom/callback` | 加密消息回调（企微将用户消息发送到此处） |
| GET | `/health` | 健康检查 — 返回 `{"status": "ok"}` |

## 加密

所有回调负载都使用 EncodingAESKey 进行 AES-CBC 加密。适配器处理：

- **入站**：解密 XML 负载，验证 SHA1 签名
- **出站**：回复通过主动 API 发送（不使用加密回调响应）

加密实现与腾讯官方的 WXBizMsgCrypt SDK 兼容。

## 局限性

- **无流式传输** — 回复在智能体完成后作为完整消息送达
- **无输入状态指示** — 回调模型不支持输入状态
- **仅文本** — 目前仅支持文本消息输入；图片/文件/语音输入尚未实现。智能体通过企微平台提示（图片、文档、视频、语音）了解出站媒体能力。
- **响应延迟** — 智能体会话需要 3-30 分钟；用户会在处理完成时看到回复

## 故障排除

**签名验证失败。**
企微使用您在管理后台注册的 **Token** 对每个请求进行签名。Hermes 中配置的令牌与管理后台期望的令牌不匹配是最常见的原因。请重新从管理后台复制 **Token** 和 **EncodingAESKey** — 它们很容易被截断。`~/.hermes/.env` 文件中 `=` 值周围的空格也会导致签名检查失败。修复后，重启 `hermes gateway run`。

**回调 URL 不可访问 / 验证步骤失败。**
企微会访问您注册的公共 URL。请确认：
1.  您的反向代理/隧道已将 `/wecom/callback` 转发到网关的端口。
2.  管理后台中的 URL 是 HTTPS（企微拒绝纯 HTTP）。
3.  从外部网络，`curl -i https://<your-domain>/wecom/callback` 返回的不是超时（无查询参数时返回 4xx 也没问题 — 只表示监听器可达）。

**端口不可达 / 监听器未绑定。**
检查 `hermes gateway run` 日志中的绑定主机/端口。如果适配器绑定到 `127.0.0.1`，您必须用反向代理或隧道做前端 — 企微的服务器无法访问回环地址。在 `config.yaml` 中设置 `extra.host: 0.0.0.0`（如果直接暴露，还需设置 `allowed_source_cidrs`），或者保持回环地址并使用隧道，例如 Cloudflare Tunnel / nginx。