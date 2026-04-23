---
sidebar_position: 7
title: "Docker"
description: "在 Docker 中运行 Hermes 智能体，并使用 Docker 作为终端后端"
---

# Hermes 智能体 — Docker

Docker 与 Hermes 智能体有两种不同的交互方式：

1. **在 Docker 中运行 Hermes** — 智能体本身运行在容器内（本页面的主要内容）
2. **Docker 作为终端后端** — 智能体运行在宿主机上，但在 Docker 沙箱中执行命令（参见 [配置 → terminal.backend](./configuration.md)）

本页面介绍第 1 种方式。容器将所有用户数据（配置、API 密钥、会话、技能、记忆）存储在从宿主机挂载到 `/opt/data` 的单个目录中。镜像本身是无状态的，可以通过拉取新版本进行升级，而不会丢失任何配置。

## 快速开始

如果你是首次运行 Hermes 智能体，请在宿主机上创建一个数据目录，并以交互方式启动容器以运行设置向导：

```sh
mkdir -p ~/.hermes
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent setup
```

这将使你进入设置向导，向导会提示你输入 API 密钥并将其写入 `~/.hermes/.env`。你只需执行此操作一次。强烈建议此时为网关设置一个聊天系统。

## 以网关模式运行

配置完成后，将容器作为持久网关（Telegram、Discord、Slack、WhatsApp 等）在后台运行：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  nousresearch/hermes-agent gateway run
```

端口 8642 暴露了网关的 [OpenAI 兼容 API 服务器](./api-server.md) 和健康检查端点。如果你仅使用聊天平台（Telegram、Discord 等），则此端口是可选的；但如果你希望仪表板或外部工具能够访问网关，则必须开放此端口。

在互联网暴露的机器上开放任何端口都存在安全风险。除非你了解相关风险，否则不应这样做。

## 运行仪表板

内置的 Web 仪表板可以作为单独的容器与网关并行运行。

要将仪表板作为其自己的容器运行，请将其指向网关的健康检查端点，以便它可以在容器之间检测网关状态：

```sh
docker run -d \
  --name hermes-dashboard \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 9119:9119 \
  -e GATEWAY_HEALTH_URL=http://$HOST_IP:8642 \
  nousresearch/hermes-agent dashboard
```

将 `$HOST_IP` 替换为运行网关容器的机器的 IP 地址（例如 `192.168.1.100`），或者如果两个容器共享一个网络，则使用 Docker 网络主机名（参见下面的 [Compose 示例](#docker-compose-example)）。

| 环境变量 | 描述 | 默认值 |
|---------------------|-------------|---------|
| `GATEWAY_HEALTH_URL` | 网关 API 服务器的基础 URL，例如 `http://gateway:8642` | *（未设置 — 仅本地 PID 检查）* |
| `GATEWAY_HEALTH_TIMEOUT` | 健康探测超时时间（秒） | `3` |

如果没有设置 `GATEWAY_HEALTH_URL`，仪表板将回退到本地进程检测 — 这仅在网关运行在同一容器或同一主机上时才有效。

## 交互式运行（CLI 聊天）

要针对正在运行的数据目录打开交互式聊天会话：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent
```

## 持久化卷

`/opt/data` 卷是 Hermes 所有状态的唯一真实来源。它映射到宿主机的 `~/.hermes/` 目录，并包含：

| 路径 | 内容 |
|------|----------|
| `.env` | API 密钥和机密 |
| `config.yaml` | 所有 Hermes 配置 |
| `SOUL.md` | 智能体个性/身份 |
| `sessions/` | 对话历史 |
| `memories/` | 持久化记忆存储 |
| `skills/` | 已安装的技能 |
| `cron/` | 定时任务定义 |
| `hooks/` | 事件钩子 |
| `logs/` | 运行时日志 |
| `skins/` | 自定义 CLI 皮肤 |

:::warning
切勿同时针对同一数据目录运行两个 Hermes **网关**容器 — 会话文件和记忆存储并非为并发写入访问而设计。与网关并行运行仪表板容器是安全的，因为仪表板仅读取数据。
:::

## 环境变量转发

API 密钥从容器内的 `/opt/data/.env` 读取。你也可以直接传递环境变量：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -e OPENAI_API_KEY="sk-..." \
  nousresearch/hermes-agent
```

直接的 `-e` 标志会覆盖 `.env` 中的值。这对于 CI/CD 或机密管理器集成非常有用，因为你不想将密钥存储在磁盘上。

## Docker Compose 示例

对于同时包含网关和仪表板的持久化部署，`docker-compose.yaml` 非常方便：

```yaml
services:
  hermes:
    image: nousresearch/hermes-agent:latest
    container_name: hermes
    restart: unless-stopped
    command: gateway run
    ports:
      - "8642:8642"
    volumes:
      - ~/.hermes:/opt/data
    networks:
      - hermes-net
    # 取消注释以转发特定环境变量，而不是使用 .env 文件：
    # environment:
    #   - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    #   - OPENAI_API_KEY=${OPENAI_API_KEY}
    #   - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"

  dashboard:
    image: nousresearch/hermes-agent:latest
    container_name: hermes-dashboard
    restart: unless-stopped
    command: dashboard --host 0.0.0.0
    ports:
      - "9119:9119"
    volumes:
      - ~/.hermes:/opt/data
    environment:
      - GATEWAY_HEALTH_URL=http://hermes:8642
    networks:
      - hermes-net
    depends_on:
      - hermes
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"

networks:
  hermes-net:
    driver: bridge
```

使用 `docker compose up -d` 启动，并使用 `docker compose logs -f` 查看日志。

## 资源限制

Hermes 容器需要适度的资源。建议的最小值：

| 资源 | 最小值 | 推荐值 |
|----------|---------|-------------|
| 内存 | 1 GB | 2–4 GB |
| CPU | 1 核 | 2 核 |
| 磁盘（数据卷） | 500 MB | 2+ GB（随会话/技能增长） |

浏览器自动化（Playwright/Chromium）是最消耗内存的功能。如果你不需要浏览器工具，1 GB 就足够了。如果启用了浏览器工具，请至少分配 2 GB。

在 Docker 中设置限制：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  --memory=4g --cpus=2 \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

## Dockerfile 的作用

官方镜像基于 `debian:13.4`，并包含：

- 安装了所有 Hermes 依赖项的 Python 3（`pip install -e ".[all]"`）
- Node.js + npm（用于浏览器自动化和 WhatsApp 桥接）
- 安装了 Chromium 的 Playwright（`npx playwright install --with-deps chromium`）
- ripgrep 和 ffmpeg 作为系统实用程序
- WhatsApp 桥接（`scripts/whatsapp-bridge/`）

入口点脚本（`docker/entrypoint.sh`）在首次运行时引导数据卷：
- 创建目录结构（`sessions/`、`memories/`、`skills/` 等）
- 如果不存在 `.env`，则复制 `.env.example` → `.env`
- 如果缺少默认的 `config.yaml`，则复制
- 如果缺少默认的 `SOUL.md`，则复制
- 使用基于清单的方法同步捆绑的技能（保留用户编辑）
- 然后使用你传递的任何参数运行 `hermes`

## 升级

拉取最新镜像并重新创建容器。你的数据目录保持不变。

```sh
docker pull nousresearch/hermes-agent:latest
docker rm -f hermes
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

或使用 Docker Compose：

```sh
docker compose pull
docker compose up -d
```

## 技能和凭据文件

当使用 Docker 作为执行环境时（不是上述方法，而是当智能体在 Docker 沙箱中运行命令时），Hermes 会自动将技能目录（`~/.hermes/skills/`）和技能声明的任何凭据文件以只读卷的形式绑定挂载到容器中。这意味着技能脚本、模板和引用在沙箱内可用，无需手动配置。

SSH 和 Modal 后端也会发生相同的同步 — 每次命令执行前，技能和凭据文件都会通过 rsync 或 Modal 挂载 API 上传。

## 故障排除

### 容器立即退出

检查日志：`docker logs hermes`。常见原因：
- 缺少或无效的 `.env` 文件 — 首先以交互方式运行以完成设置
- 如果运行时有暴露的端口，则可能存在端口冲突

### “权限被拒绝”错误

容器默认以 root 用户运行。如果你的宿主机 `~/.hermes/` 是由非 root 用户创建的，权限应该可以正常工作。如果出现错误，请确保数据目录可写：

```sh
chmod -R 755 ~/.hermes
```

### 浏览器工具无法工作

Playwright 需要共享内存。在你的 Docker 运行命令中添加 `--shm-size=1g`：

```sh
docker run -d \
  --name hermes \
  --shm-size=1g \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

### 网关在网络问题后无法重新连接

`--restart unless-stopped` 标志可以处理大多数瞬时故障。如果网关卡住，请重启容器：

```sh
docker restart hermes
```

### 检查容器健康状况

```sh
docker logs --tail 50 hermes          # 最近日志
docker run -it --rm nousresearch/hermes-agent:latest version     # 验证版本
docker stats hermes                    # 资源使用情况
```