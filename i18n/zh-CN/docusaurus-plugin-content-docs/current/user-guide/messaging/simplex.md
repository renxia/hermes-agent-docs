# SimpleX Chat

[SimpleX Chat](https://simplex.chat/) 是一款私密的去中心化通讯平台，用户在此拥有对联系人和群组的控制权。与其他平台不同，SimpleX不分配持久性用户ID——每个联系人通过连接时生成的不透明内部ID进行识别，这使其成为最私密的通讯工具之一。

> 运行 `hermes gateway setup` 并选择 **SimpleX** 以获得引导式教程。

## 前提条件

- **simplex-chat** CLI 已安装并作为守护进程运行
- Python包 **websockets**（通过 `pip install websockets` 安装）

## 安装 simplex-chat

从 [simplex-chat GitHub releases](https://github.com/simplex-chat/simplex-chat/releases) 页面下载最新版本：

```bash
# Linux / macOS 二进制文件
curl -L https://github.com/simplex-chat/simplex-chat/releases/latest/download/simplex-chat-ubuntu-22_04-x86-64 -o simplex-chat
chmod +x simplex-chat
```

SimpleX Chat项目未为聊天客户端发布预构建的Docker镜像；如需在Docker下运行，请从 [simplex-chat 仓库](https://github.com/simplex-chat/simplex-chat) 源代码构建。

## 启动守护进程

```bash
simplex-chat -p 5225
```

守护进程默认在 `ws://127.0.0.1:5225` 监听 WebSocket 连接。

## 配置 Hermes

### 通过设置向导

```bash
hermes setup gateway
```

选择 **SimpleX Chat** 并按照提示操作。

### 通过环境变量

将以下内容添加到 `~/.hermes/.env`：

```
SIMPLEX_WS_URL=ws://127.0.0.1:5225
SIMPLEX_ALLOWED_USERS=<contact-id-1>,<contact-id-2>
SIMPLEX_HOME_CHANNEL=<contact-id>
```

| 变量 | 必需 | 描述 |
|---|---|---|
| `SIMPLEX_WS_URL` | 是 | simplex-chat 守护进程的 WebSocket URL |
| `SIMPLEX_ALLOWED_USERS` | 推荐 | 允许使用智能体的联系人ID列表，以逗号分隔 |
| `SIMPLEX_ALLOW_ALL_USERS` | 可选 | 设为 `true` 以允许所有联系人（请谨慎使用） |
| `SIMPLEX_HOME_CHANNEL` | 可选 | 用于 cron 任务交付的默认联系人ID |
| `SIMPLEX_HOME_CHANNEL_NAME` | 可选 | 主频道的友好标签 |

## 查找您的联系人ID

启动守护进程后，打开与智能体联系人的对话。联系人ID将出现在会话日志中，或通过 `hermes send_message action=list` 获取。

## 授权

默认情况下**所有联系人均被拒绝**。您必须：

1. 将 `SIMPLEX_ALLOWED_USERS` 设置为逗号分隔的联系人ID列表，或
2. 使用 **DM 配对** —— 向机器人发送任意消息，它将回复一个配对码。通过 `hermes gateway pair` 输入该码。

## 将 SimpleX 与 cron 任务结合使用

```python
cronjob(
    action="create",
    schedule="every 1h",
    deliver="simplex",          # 使用 SIMPLEX_HOME_CHANNEL
    prompt="检查警报并汇总。"
)
```

或指定特定联系人：

```python
send_message(target="simplex:<contact-id>", message="完成！")
```

## 隐私说明

- SimpleX 从不透露电话号码或电子邮件地址——联系人使用不透明ID
- Hermes 与守护进程之间的连接是本地 WebSocket（`ws://127.0.0.1:5225`）——数据不会离开您的机器
- 消息在到达守护进程前，已通过 SimpleX 协议进行端到端加密

## 故障排除

**“无法连接到守护进程”** —— 确保 `simplex-chat -p 5225` 正在运行且端口与 `SIMPLEX_WS_URL` 匹配。

**“websockets 未安装”** —— 运行 `pip install websockets`。

**未收到消息** —— 检查联系人ID是否在 `SIMPLEX_ALLOWED_USERS` 列表中，或通过 DM 配对批准他们。