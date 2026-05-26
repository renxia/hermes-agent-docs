# SimpleX Chat

[SimpleX Chat](https://simplex.chat/) 是一个私密、去中心化的即时通讯平台，用户拥有自己的联系人和群组。与其他平台不同，SimpleX不分配持久用户ID——每个联系人通过连接时生成的不透明内部ID来标识，这使其成为最私密的通讯工具之一。

## 前提条件

- 已安装 **simplex-chat** CLI 并作为守护进程运行
- 已安装Python包 **websockets** (`pip install websockets`)

## 安装 simplex-chat

从 [simplex-chat GitHub releases](https://github.com/simplex-chat/simplex-chat/releases) 页面下载最新版本：

```bash
# Linux / macOS 二进制文件
curl -L https://github.com/simplex-chat/simplex-chat/releases/latest/download/simplex-chat-ubuntu-22_04-x86-64 -o simplex-chat
chmod +x simplex-chat
```

SimpleX Chat 项目未为聊天客户端发布预构建的 Docker 镜像；若需在 Docker 下运行，请从 [simplex-chat 仓库](https://github.com/simplex-chat/simplex-chat) 源码构建。

## 启动守护进程

```bash
simplex-chat -p 5225
```

守护进程默认在 `ws://127.0.0.1:5225` 上监听 WebSocket 连接。

## 配置 Hermes

### 通过设置向导

```bash
hermes setup gateway
```

选择 **SimpleX Chat** 并按照提示操作。

### 通过环境变量

将以下内容添加到 `~/.hermes/.env` 文件：

```
SIMPLEX_WS_URL=ws://127.0.0.1:5225
SIMPLEX_ALLOWED_USERS=<contact-id-1>,<contact-id-2>
SIMPLEX_HOME_CHANNEL=<contact-id>
```

| 变量 | 是否必需 | 描述 |
|---|---|---|
| `SIMPLEX_WS_URL` | 是 | simplex-chat 守护进程的 WebSocket URL |
| `SIMPLEX_ALLOWED_USERS` | 推荐 | 允许使用智能体的逗号分隔联系人 ID 列表 |
| `SIMPLEX_ALLOW_ALL_USERS` | 可选 | 设置为 `true` 以允许所有联系人（请谨慎使用） |
| `SIMPLEX_HOME_CHANNEL` | 可选 | 定时任务投递的默认联系人 ID |
| `SIMPLEX_HOME_CHANNEL_NAME` | 可选 | 主频道的人类可读标签 |

## 查找您的联系人 ID

启动守护进程后，与您的智能体联系人开启对话。联系人 ID 将出现在会话日志中，或通过 `hermes send_message action=list` 命令查看。

## 授权

默认情况下 **所有联系人均被拒绝**。您必须：

1. 将 `SIMPLEX_ALLOWED_USERS` 设置为逗号分隔的联系人 ID 列表，或
2. 使用 **DM 配对** —— 向机器人发送任意消息，它将回复一个配对码。通过 `hermes gateway pair` 输入该配对码。

## 将 SimpleX 与定时任务结合使用

```python
cronjob(
    action="create",
    schedule="every 1h",
    deliver="simplex",          # 使用 SIMPLEX_HOME_CHANNEL
    prompt="检查警报并总结。"
)
```

或指定特定联系人：

```python
send_message(target="simplex:<contact-id>", message="完成！")
```

## 隐私说明

- SimpleX 绝不透露电话号码或电子邮箱地址——联系人使用不透明 ID
- Hermes 与守护进程之间的连接是本地 WebSocket (`ws://127.0.0.1:5225`)——数据不会离开您的机器
- 消息在到达守护进程之前已通过 SimpleX 协议进行端到端加密

## 故障排除

**"无法连接到守护进程"** —— 确保 `simplex-chat -p 5225` 正在运行，且端口与 `SIMPLEX_WS_URL` 匹配。

**"websockets 未安装"** —— 运行 `pip install websockets`。

**未收到消息** —— 检查联系人 ID 是否在 `SIMPLEX_ALLOWED_USERS` 列表中，或通过 DM 配对批准该联系人。