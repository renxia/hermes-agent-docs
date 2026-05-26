---
sidebar_position: 16
title: "元宝"
description: "通过 WebSocket 网关将 Hermes 智能体连接到元宝企业通讯平台"
---

# 元宝

将 Hermes 连接到腾讯的企业通讯平台[元宝](https://yuanbao.tencent.com/)。该适配器使用 WebSocket 网关实现实时消息传递，并支持点对点（C2C）和群组会话。

:::info
元宝是主要在腾讯及企业环境中使用的企业通讯平台。它采用 WebSocket 进行实时通信，基于 HMAC 的身份验证，并支持包括图片、文件和语音消息在内的富媒体。
:::

## 先决条件

- 具有创建机器人权限的元宝账户
- 元宝的 APP_ID 和 APP_SECRET（来自平台管理员）
- Python 包：`websockets` 和 `httpx`
- 如需媒体支持：`aiofiles`

安装所需的依赖项：

```bash
pip install websockets httpx aiofiles
```

## 设置

### 1. 在元宝中创建一个Bot

1. 从 [https://yuanbao.tencent.com/](https://yuanbao.tencent.com/) 下载元宝应用
2. 在应用中，前往 **PAI → 我的Bot** 并创建一个新的Bot
3. Bot创建完成后，复制 **APP_ID** 和 **APP_SECRET**

### 2. 运行设置向导

配置元宝的最简单方式是通过交互式设置向导：

```bash
hermes gateway setup
```

在提示时选择 **元宝**。该向导将：

1. 询问您的 APP_ID
2. 询问您的 APP_SECRET
3. 自动保存配置

:::tip
WebSocket URL 和 API Domain 内置了合理的默认值。您只需提供 APP_ID 和 APP_SECRET 即可开始。
:::

### 3. 配置环境变量

初始设置后，请在 `~/.hermes/.env` 中验证这些变量：

```bash
# 必需
YUANBAO_APP_ID=your-app-id
YUANBAO_APP_SECRET=your-app-secret
YUANBAO_WS_URL=wss://api.yuanbao.example.com/ws
YUANBAO_API_DOMAIN=https://api.yuanbao.example.com

# 可选：Bot账户ID（通常通过签名令牌自动获取）
# YUANBAO_BOT_ID=your-bot-id

# 可选：内部路由环境（例如：test/staging/production）
# YUANBAO_ROUTE_ENV=production

# 可选：用于定时任务/通知的主频道（格式：direct:<account> 或 group:<group_code>）
YUANBAO_HOME_CHANNEL=direct:bot_account_id
YUANBAO_HOME_CHANNEL_NAME="Bot 通知"

# 可选：限制访问（旧版，请参阅下方访问控制获取更精细的策略）
YUANBAO_ALLOWED_USERS=user_account_1,user_account_2
```

### 4. 启动网关

```bash
hermes gateway
```

该适配器将连接到元宝 WebSocket 网关，使用 HMAC 签名进行认证，并开始处理消息。

## 功能

- **WebSocket 网关** — 实时双向通信
- **HMAC 认证** — 使用 APP_ID/APP_SECRET 进行安全请求签名
- **C2C 消息** — 用户与Bot之间的直接对话
- **群组消息** — 在群聊中的对话
- **媒体支持** — 通过 COS（云对象存储）支持图片、文件和语音消息
- **Markdown 格式化** — 消息会自动根据元宝的大小限制进行分块
- **消息去重** — 防止重复处理同一消息
- **心跳/保活** — 维持 WebSocket 连接稳定性
- **输入指示器** — 在智能体处理时显示“正在输入...”状态
- **自动重连** — 通过指数退避处理 WebSocket 断开连接
- **群组信息查询** — 获取群组详情和成员列表
- **贴纸/表情支持** — 在对话中发送 TIMFaceElem 贴纸和表情
- **自动设置主频道** — 第一个向Bot发消息的用户自动成为主频道所有者
- **慢响应通知** — 当智能体处理时间超过预期时发送等待消息

## 配置选项

### 聊天ID格式

元宝根据会话类型使用带前缀的标识符：

| 聊天类型 | 格式 | 示例 |
|-----------|--------|---------|
| 私聊消息 (C2C) | `direct:<account>` | `direct:user123` |
| 群组消息 | `group:<group_code>` | `group:grp456` |

### 媒体上传

元宝适配器通过 COS（腾讯云对象存储）自动处理媒体上传：

- **图片**：支持 JPEG、PNG、GIF、WebP
- **文件**：支持所有常见文档类型
- **语音**：支持 WAV、MP3、OGG

媒体 URL 在上传前会自动验证和下载，以防止 SSRF 攻击。

## 主频道

在元宝的任何聊天（私聊或群组）中使用 `/sethome` 命令来指定其为 **主频道**。定时任务（cron 作业）会将其结果投递到此频道。

:::tip 自动设置主频道
如果未配置主频道，第一个向Bot发消息的用户将自动成为主频道所有者。如果当前主频道是群聊，则第一个私聊将升级为私聊频道。
:::

您也可以在 `~/.hermes/.env` 中手动设置：

```bash
YUANBAO_HOME_CHANNEL=direct:user_account_id
# 或者对于群组：
# YUANBAO_HOME_CHANNEL=group:group_code
YUANBAO_HOME_CHANNEL_NAME="我的Bot更新"
```

### 示例：设置主频道

1. 在元宝中开始与Bot的对话
2. 发送命令：`/sethome`
3. Bot 回复："主频道已设置为 [chat_name]，ID 为 [chat_id]。定时任务将投递到此处。"
4. 未来的定时任务和通知将发送到此频道

### 示例：定时任务投递

创建一个定时任务：

```bash
/cron "0 9 * * *" 检查服务器状态
```

计划输出将每天早上 9 点投递到您的元宝主频道。

## 使用技巧

### 开始对话

在元宝中向Bot发送任何消息：

```
你好
```

Bot将在同一个对话线程中回复。

### 可用命令

所有标准 Hermes 命令均适用于元宝：

| 命令 | 描述 |
|---------|-------------|
| `/new` | 开始一个全新对话 |
| `/model [provider:model]` | 显示或更改模型 |
| `/sethome` | 将此聊天设置为主频道 |
| `/status` | 显示会话信息 |
| `/help` | 显示可用命令 |

### 发送文件

要向Bot发送文件，只需直接在元宝聊天中附加文件。Bot将自动下载并处理文件附件。

您也可以在附件中包含消息：

```
请分析这份文档
```

### 接收文件

当您要求Bot创建或导出文件时，它会将文件直接发送到您的元宝聊天。

## 故障排除

### Bot在线但不响应消息

**原因**：WebSocket 握手期间认证失败。

**解决方法**：
1. 验证 APP_ID 和 APP_SECRET 是否正确
2. 检查 WebSocket URL 是否可访问
3. 确保Bot账户具有适当的权限
4. 查看网关日志：`tail -f ~/.hermes/logs/gateway.log`

### “连接被拒绝”错误

**原因**：WebSocket URL 不可达或不正确。

**解决方法**：
1. 验证 WebSocket URL 格式（应以 `wss://` 开头）
2. 检查到元宝 API 域的网络连接
3. 确认防火墙允许 WebSocket 连接
4. 测试 URL：`curl -I https://[YUANBAO_API_DOMAIN]`

### 媒体上传失败

**原因**：COS 凭据无效或媒体服务器不可达。

**解决方法**：
1. 验证 API_DOMAIN 是否正确
2. 检查是否为您的Bot启用了媒体上传权限
3. 确保媒体文件可访问且未损坏
4. 与平台管理员检查 COS 存储桶配置

### 消息未投递到主频道

**原因**：主频道 ID 格式不正确或定时任务未触发。

**解决方法**：
1. 验证 YUANBAO_HOME_CHANNEL 格式是否正确
2. 使用 `/sethome` 命令自动检测正确格式进行测试
3. 使用 `/status` 检查定时任务计划
4. 验证Bot在目标聊天中具有发送权限

### 频繁断开连接

**原因**：WebSocket 连接不稳定或网络不可靠。

**解决方法**：
1. 检查网关日志中的错误模式
2. 在连接设置中增加心跳超时
3. 确保到元宝 API 的网络连接稳定
4. 考虑启用详细日志：`HERMES_LOG_LEVEL=debug`

## 访问控制

元宝支持针对私聊和群组对话的精细访问控制：

```bash
# 私聊策略：open (默认) | allowlist | disabled
YUANBAO_DM_POLICY=open
# 允许向Bot发送私聊的用户ID，用逗号分隔（仅当DM_POLICY=allowlist时使用）
YUANBAO_DM_ALLOW_FROM=user_id_1,user_id_2

# 群组策略：open (默认) | allowlist | disabled
YUANBAO_GROUP_POLICY=open
# 允许的群组代码，用逗号分隔（仅当GROUP_POLICY=allowlist时使用）
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

元宝有最大消息大小限制。Hermes 会自动通过具有 Markdown 感知的分割方式对大型响应进行分块（尊重代码围栏、表格和段落边界）。

### 连接参数

以下连接参数内置于适配器中，并具有合理的默认值：

| 参数 | 默认值 | 描述 |
|-----------|---------------|-------------|
| WebSocket 连接超时 | 15 秒 | 等待 WebSocket 握手的时间 |
| 心跳间隔 | 30 秒 | 保持连接存活的 ping 频率 |
| 最大重连尝试次数 | 100 | 最大重连尝试次数 |
| 重连退避 | 1s → 60s (指数) | 重连尝试之间的等待时间 |
| 应答心跳间隔 | 2 秒 | 发送 RUNNING 状态的频率 |
| 发送超时 | 30 秒 | 出站 WebSocket 消息的超时时间 |

:::note
这些值目前无法通过环境变量配置。它们针对典型的元宝部署进行了优化。
:::

### 详细日志

启用调试日志以排除连接问题：

```bash
HERMES_LOG_LEVEL=debug hermes gateway
```

## 与其他功能的集成

### 定时任务

在元宝上安排运行的任务：

```
/cron "0 */4 * * *" 报告系统健康状况
```

结果将投递到您的主频道。

### 后台任务

运行长时间操作而不阻塞对话：

```
/background 分析存档中的所有文件
```

### 跨平台消息

从 CLI 向元宝发送消息：

```bash
hermes chat -q "发送 '来自CLI的问候' 到 yuanbao:group:group_code"
```

## 相关文档

- [消息网关概述](./index.md)
- [斜杠命令参考](/reference/slash-commands)
- [定时任务](/user-guide/features/cron)
- [后台会话](/user-guide/cli#background-sessions)