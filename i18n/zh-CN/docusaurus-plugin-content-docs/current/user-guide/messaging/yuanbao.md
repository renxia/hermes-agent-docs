---
sidebar_position: 16
title: "Yuanbao"
description: "通过 WebSocket 网关将 Hermes 智能体连接到元宝企业消息平台"
---

# 元宝

将 Hermes 连接到[元宝](https://yuanbao.tencent.com/)，腾讯的企业消息平台。该适配器使用 WebSocket 网关进行实时消息传递，并支持直接（C2C）和群组对话。

:::info
元宝是一个主要在企业内部和腾讯环境中使用的企业消息平台。它使用 WebSocket 进行实时通信，基于 HMAC 的身份验证，并支持包括图片、文件和语音消息在内的富媒体。
:::

## 先决条件

- 具有机器人创建权限的元宝账户
- 元宝 APP_ID 和 APP_SECRET（来自平台管理员）
- Python 包：`websockets` 和 `httpx`
- 对于媒体支持：`aiofiles`

安装所需的依赖项：

```bash
pip install websockets httpx aiofiles
```

## 设置

### 1. 在元宝中创建机器人

1. 从 [https://yuanbao.tencent.com/](https://yuanbao.tencent.com/) 下载元宝应用
2. 在应用中，进入 **PAI → 我的机器人** 并创建一个新机器人
3. 机器人创建完成后，复制 **APP_ID** 和 **APP_SECRET**

### 2. 运行设置向导

配置元宝最简单的方法是通过交互式设置：

```bash
hermes gateway setup
```

提示时选择 **元宝**。向导将：

1. 询问您的 APP_ID
2. 询问您的 APP_SECRET
3. 自动保存配置

:::提示
WebSocket URL 和 API 域名已内置合理的默认值。您只需提供 APP_ID 和 APP_SECRET 即可开始使用。
:::

### 3. 配置环境变量

初始设置完成后，请验证 `~/.hermes/.env` 中的以下变量：

```bash
# 必需
YUANBAO_APP_ID=your-app-id
YUANBAO_APP_SECRET=your-app-secret
YUANBAO_WS_URL=wss://api.yuanbao.example.com/ws
YUANBAO_API_DOMAIN=https://api.yuanbao.example.com

# 可选：机器人账户 ID（通常通过 sign-token 自动获取）
# YUANBAO_BOT_ID=your-bot-id

# 可选：内部路由环境（例如 test/staging/production）
# YUANBAO_ROUTE_ENV=production

# 可选：定时任务/通知的主频道（格式：direct:<account> 或 group:<group_code>）
YUANBAO_HOME_CHANNEL=direct:bot_account_id
YUANBAO_HOME_CHANNEL_NAME="机器人通知"

# 可选：限制访问（旧版，请参阅下文的访问控制以了解细粒度策略）
YUANBAO_ALLOWED_USERS=user_account_1,user_account_2
```

### 4. 启动网关

```bash
hermes gateway
```

适配器将连接到元宝 WebSocket 网关，使用 HMAC 签名进行身份验证，并开始处理消息。

## 功能特性

- **WebSocket 网关** — 实时双向通信
- **HMAC 身份验证** — 使用 APP_ID/APP_SECRET 进行安全请求签名
- **C2C 消息** — 用户与机器人之间的直接对话
- **群组消息** — 群聊中的对话
- **媒体支持** — 通过 COS（云对象存储）支持图片、文件和语音消息
- **Markdown 格式化** — 消息会根据元宝的大小限制自动分块
- **消息去重** — 防止重复处理相同消息
- **心跳/保活** — 维持 WebSocket 连接稳定性
- **输入指示器** — 智能体处理时显示“正在输入…”状态
- **自动重连** — 处理 WebSocket 断开连接，采用指数退避策略
- **群组信息查询** — 获取群组详情和成员列表
- **贴纸/表情支持** — 在对话中发送 TIMFaceElem 贴纸和表情
- **自动设置主频道** — 第一个向机器人发送消息的用户会自动被设为主频道所有者
- **慢响应通知** — 当智能体响应时间超过预期时发送等待消息

## 配置选项

### 聊天 ID 格式

元宝根据对话类型使用带前缀的标识符：

| 聊天类型 | 格式 | 示例 |
|----------|------|------|
| 直接消息 (C2C) | `direct:<account>` | `direct:user123` |
| 群组消息 | `group:<group_code>` | `group:grp456` |

### 媒体上传

元宝适配器通过 COS（腾讯云对象存储）自动处理媒体上传：

- **图片**：支持 JPEG、PNG、GIF、WebP
- **文件**：支持所有常见文档类型
- **语音**：支持 WAV、MP3、OGG

媒体 URL 在上传前会自动验证和下载，以防止 SSRF 攻击。

## 主频道

在任何元宝聊天（私信或群组）中使用 `/sethome` 命令将其指定为**主频道**。定时任务（cron 作业）会将结果发送到该频道。

:::提示 自动设置主频道
如果未配置主频道，则第一个向机器人发送消息的用户将自动被设为主频道所有者。如果当前主频道是群聊，则第一个私信会将其升级为直接频道。
:::

您也可以在 `~/.hermes/.env` 中手动设置：

```bash
YUANBAO_HOME_CHANNEL=direct:user_account_id
# 或对于群组：
# YUANBAO_HOME_CHANNEL=group:group_code
YUANBAO_HOME_CHANNEL_NAME="我的机器人更新"
```

### 示例：设置主频道

1. 在元宝中与机器人开始对话
2. 发送命令：`/sethome`
3. 机器人回复：“主频道已设置为 [chat_name]，ID 为 [chat_id]。定时任务将发送到此位置。”
4. 未来的定时任务和通知将发送到此频道

### 示例：定时任务投递

创建一个定时任务：

```bash
/cron "0 9 * * *" 检查服务器状态
```

计划的输出将每天上午 9 点发送到您的元宝主频道。

## 使用技巧

### 开始对话

在元宝中向机器人发送任意消息：

```
你好
```

机器人将在同一对话线程中回复。

### 可用命令

所有标准 Hermes 命令都适用于元宝：

| 命令 | 描述 |
|------|------|
| `/new` | 开始新对话 |
| `/model [provider:model]` | 显示或更改模型 |
| `/sethome` | 将此聊天设为主频道 |
| `/status` | 显示会话信息 |
| `/help` | 显示可用命令 |

### 发送文件

要向机器人发送文件，只需在元宝聊天中直接附加文件。机器人将自动下载并处理文件附件。

您也可以在附件中包含消息：

```
请分析此文档
```

### 接收文件

当您要求机器人创建或导出文件时，它会直接将文件发送到您的元宝聊天中。

## 故障排除

### 机器人在线但不响应消息

**原因**：WebSocket 握手期间身份验证失败。

**解决方法**：
1. 验证 APP_ID 和 APP_SECRET 是否正确
2. 检查 WebSocket URL 是否可访问
3. 确保机器人账户具有适当权限
4. 查看网关日志：`tail -f ~/.hermes/logs/gateway.log`

### “连接被拒绝”错误

**原因**：WebSocket URL 不可达或不正确。

**解决方法**：
1. 验证 WebSocket URL 格式（应以 `wss://` 开头）
2. 检查到元宝 API 域名的网络连接
3. 确认防火墙允许 WebSocket 连接
4. 使用以下命令测试 URL：`curl -I https://[YUANBAO_API_DOMAIN]`

### 媒体上传失败

**原因**：COS 凭据无效或媒体服务器不可达。

**解决方法**：
1. 验证 API_DOMAIN 是否正确
2. 检查是否为机器人启用了媒体上传权限
3. 确保媒体文件可访问且未损坏
4. 与平台管理员核对 COS 存储桶配置

### 消息未投递到主频道

**原因**：主频道 ID 格式不正确或定时任务未触发。

**解决方法**：
1. 验证 YUANBAO_HOME_CHANNEL 是否为正确格式
2. 使用 `/sethome` 命令测试以自动检测正确格式
3. 使用 `/status` 检查定时任务计划
4. 验证机器人在目标聊天中是否具有发送权限

### 频繁断开连接

**原因**：WebSocket 连接不稳定或网络不可靠。

**解决方法**：
1. 检查网关日志中的错误模式
2. 在连接设置中增加心跳超时时间
3. 确保到元宝 API 的稳定网络连接
4. 考虑启用详细日志记录：`HERMES_LOG_LEVEL=debug`

## 访问控制

元宝支持对私信和群组对话进行细粒度访问控制：

```bash
# 私信策略：open（默认）| allowlist | disabled
YUANBAO_DM_POLICY=open
# 允许私信机器人的用户 ID（逗号分隔，仅在 DM_POLICY=allowlist 时使用）
YUANBAO_DM_ALLOW_FROM=user_id_1,user_id_2

# 群组策略：open（默认）| allowlist | disabled
YUANBAO_GROUP_POLICY=open
# 允许的群组代码（逗号分隔，仅在 GROUP_POLICY=allowlist 时使用）
YUANBAO_GROUP_ALLOW_FROM=group_code_1,group_code_2
```

这些也可以在 `config.yaml` 中设置：

```yaml
platforms:
  yuanbao:
    extra:
      dm_policy: allowlist
      dm_allow_from: "user1,user2"
      group_policy: open
      group_allow_from: ""
```

## 高级配置

### 消息分块

元宝有最大消息大小限制。Hermes 会自动将大型回复分块，采用 Markdown 感知的分割方式（尊重代码围栏、表格和段落边界）。

### 连接参数

以下连接参数已内置于适配器中，并具有合理的默认值：

| 参数 | 默认值 | 描述 |
|------|--------|------|
| WebSocket 连接超时 | 15 秒 | 等待 WS 握手的时间 |
| 心跳间隔 | 30 秒 | 保持连接活跃的 Ping 频率 |
| 最大重连尝试次数 | 100 | 最大重连尝试次数 |
| 重连退避 | 1秒 → 60秒（指数） | 重连尝试之间的等待时间 |
| 回复心跳间隔 | 2 秒 | RUNNING 状态发送频率 |
| 发送超时 | 30 秒 | 出站 WS 消息的超时时间 |

:::注意
这些值目前无法通过环境变量配置。它们已针对典型的元宝部署进行了优化。
:::

### 详细日志记录

启用调试日志以排查连接问题：

```bash
HERMES_LOG_LEVEL=debug hermes gateway
```

## 与其他功能集成

### 定时任务

安排元宝上运行的任务：

```
/cron "0 */4 * * *" 报告系统健康状况
```

结果将发送到您的主频道。

### 后台任务

运行长时间操作而不会阻塞对话：

```
/background 分析档案中的所有文件
```

### 跨平台消息

从 CLI 向元宝发送消息：

```bash
hermes chat -q "Send 'Hello from CLI' to yuanbao:group:group_code"
```

## 相关文档

- [消息网关概述](./index.md)
- [斜杠命令参考](/docs/reference/slash-commands.md)
- [定时任务](/docs/user-guide/features/cron-jobs.md)
- [后台任务](/docs/guides/tips.md#background-tasks)