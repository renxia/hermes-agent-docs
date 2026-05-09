---
sidebar_position: 15
---

# 企业微信回调（自建应用）

将 Hermes 连接至企业微信（Enterprise WeChat）作为自建企业应用，使用回调/网络钩子模型。

:::info 企业微信机器人 vs 企业微信回调
Hermes 支持两种企业微信集成模式：
- **[企业微信机器人](wecom.md)** — 机器人风格，通过 WebSocket 连接。设置更简单，可在群聊中使用。
- **企业微信回调**（本页）— 自建应用，接收加密的 XML 回调。在用户的企业微信侧边栏中显示为一级应用。支持多企业路由。
:::

## 工作原理

1. 您在企业微信管理控制台中注册一个自建应用  
2. 企业微信将加密的 XML 推送到您的 HTTP 回调端点  
3. Hermes 解密消息，并将其排队发送给智能体  
4. 立即确认（静默 — 用户端无显示）  
5. 智能体处理请求（通常需要 3–30 分钟）  
6. 通过企业微信 `message/send` API 主动发送回复  

## 先决条件

- 拥有管理员权限的企业微信企业账户  
- Python 包 `aiohttp` 和 `httpx`（默认安装中已包含）  
- 用于回调 URL 的公网可访问服务器（或使用 ngrok 等隧道）  

## 设置

### 1. 在企业微信中创建自建应用

1. 进入[企业微信管理控制台](https://work.weixin.qq.com/) → **应用管理** → **创建应用**  
2. 记录您的 **企业 ID**（显示在管理控制台顶部）  
3. 在应用设置中创建 **企业 Secret**  
4. 从应用概览页面记录 **应用 ID**  
5. 在 **接收消息** 下配置回调 URL：  
   - URL: `http://YOUR_PUBLIC_IP:8645/wecom/callback`  
   - Token: 生成一个随机令牌（企业微信会提供一个）  
   - EncodingAESKey: 生成一个密钥（企业微信会提供一个）  

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

（仅在 `hermes gateway install` 已注册 systemd/launchd 服务后，才使用 `hermes gateway start`。）

回调适配器将在配置的端口上启动一个 HTTP 服务器。企业微信将通过 GET 请求验证回调 URL，然后开始通过 POST 发送消息。

## 配置参考

在 `config.yaml` 的 `platforms.wecom_callback.extra` 下设置这些参数，或使用环境变量：

| 设置 | 默认值 | 描述 |
|---------|---------|-------------|
| `corp_id` | — | 企业微信企业 Corp ID（必填） |
| `corp_secret` | — | 自建应用的企业 Secret（必填） |
| `agent_id` | — | 自建应用的智能体 ID（必填） |
| `token` | — | 回调验证令牌（必填） |
| `encoding_aes_key` | — | 用于回调加密的 43 字符 AES 密钥（必填） |
| `host` | `0.0.0.0` | HTTP 回调服务器的绑定地址 |
| `port` | `8645` | HTTP 回调服务器的端口 |
| `path` | `/wecom/callback` | 回调端点的 URL 路径 |

## 多应用路由

对于运行多个自建应用的企业（例如，跨不同部门或子公司），请在 `config.yaml` 中配置 `apps` 列表：

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

用户按 `corp_id:user_id` 进行限定，以防止跨企业冲突。当用户发送消息时，适配器会记录他们所属的应用（企业），并通过正确应用的访问令牌路由回复。

## 访问控制

限制可与该应用交互的用户：

```bash
# 白名单特定用户
WECOM_CALLBACK_ALLOWED_USERS=zhangsan,lisi,wangwu

# 或允许所有用户
WECOM_CALLBACK_ALLOW_ALL_USERS=true
```

## 端点

该适配器暴露以下端点：

| 方法 | 路径 | 用途 |
|--------|------|---------|
| GET | `/wecom/callback` | URL 验证握手（企业微信在设置期间发送此请求） |
| POST | `/wecom/callback` | 加密消息回调（企业微信在此处发送用户消息） |
| GET | `/health` | 健康检查 — 返回 `{"status": "ok"}` |

## 加密

所有回调负载均使用 EncodingAESKey 通过 AES-CBC 加密。适配器处理：

- **入站**：解密 XML 负载，验证 SHA1 签名  
- **出站**：通过主动 API 发送回复（非加密回调响应）  

加密实现与腾讯官方的 WXBizMsgCrypt SDK 兼容。

## 限制

- **无流式传输** — 回复在智能体完成后以完整消息形式到达  
- **无输入指示器** — 回调模型不支持输入状态  
- **仅文本** — 目前仅支持文本消息作为输入；图像/文件/语音输入尚未实现。智能体通过企业微信平台提示了解出站媒体功能（图像、文档、视频、语音）。  
- **响应延迟** — 智能体会话需要 3–30 分钟；用户在处理完成时看到回复