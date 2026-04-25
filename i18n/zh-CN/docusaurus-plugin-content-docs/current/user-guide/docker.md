---
sidebar_position: 7
title: "Docker"
description: "在 Docker 中运行 Hermes 智能体，以及将 Docker 用作终端后端"
---

# Hermes 智能体 — Docker

Docker 与 Hermes 智能体有两种不同的交互方式：

1. **在 Docker 中运行 Hermes** —— 智能体本身运行在容器内（本页面的重点）
2. **Docker 作为终端后端** —— 智能体运行在主机上，但在 Docker 沙箱中执行命令（参见 [配置 → terminal.backend](./configuration.md)）

本文档介绍第一种方式。容器将所有用户数据（配置、API 密钥、会话、技能、记忆）存储在一个从宿主机挂载的目录 `/opt/data` 中。镜像本身是状态无关的，可以通过拉取新版本来升级，而不会丢失任何配置。

## 快速开始

如果你是第一次运行 Hermes 智能体，请在宿主机上创建一个数据目录，并交互式地启动容器以运行设置向导：

```sh
mkdir -p ~/.hermes
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent setup
```

这将进入设置向导，它会提示你输入 API 密钥并将其写入 `~/.hermes/.env`。只需操作一次。强烈建议此时为网关配置一个聊天系统以支持其正常工作。

## 以网关模式运行

配置完成后，以后台模式运行容器作为持久化网关（Telegram、Discord、Slack、WhatsApp 等）：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  nousresearch/hermes-agent gateway run
```

端口 8642 暴露了网关的 [OpenAI 兼容 API 服务器](./api-server.md) 和健康检查端点。如果你只使用聊天平台（Telegram、Discord 等），这是可选的；但如果你想使用仪表板或外部工具访问网关，则是必需的。

在互联网-facing机器上打开端口存在安全风险。除非你了解相关风险，否则不应这样做。

## 运行仪表板

内置的 Web 仪表板可以作为独立容器与网关并行运行。

要以独立容器运行仪表板，请将其指向网关的健康检查端点，以便跨容器检测网关状态：

```sh
docker run -d \
  --name hermes-dashboard \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 9119:9119 \
  -e GATEWAY_HEALTH_URL=http://$HOST_IP:8642 \
  nousresearch/hermes-agent dashboard
```

将 `$HOST_IP` 替换为运行网关容器的机器 IP 地址（例如 `192.168.1.100`），或者如果使用 Docker 网络共享网络，则使用容器主机名（参见下面的 [Docker Compose 示例](#docker-compose-example)）。

| 环境变量 | 描述 | 默认值 |
|---------------------|-------------|---------|
| `GATEWAY_HEALTH_URL` | 网关 API 服务器的基础 URL，例如 `http://gateway:8642` | *(未设置 — 仅本地 PID 检查)* |
| `GATEWAY_HEALTH_TIMEOUT` | 健康探测超时时间（秒） | `3` |

如果没有设置 `GATEWAY_HEALTH_URL`，仪表板会回退到本地进程检测 —— 这仅在网关与仪表板运行在同一容器或同一主机上时有效。

## 交互式运行（CLI 聊天）

要打开一个针对正在运行的数据目录的交互式聊天会话：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent
```

或者，如果你已经通过 Docker Desktop 等方式在运行的容器中打开了终端，只需运行：

```sh
/opt/hermes/.venv/bin/hermes
```

## 持久化卷

`/opt/data` 卷是所有 Hermes 状态的单一真实来源。它映射到宿主机的 `~/.hermes/` 目录，包含：

| 路径 | 内容 |
|------|----------|
| `.env` | API 密钥和机密信息 |
| `config.yaml` | 所有 Hermes 配置 |
| `SOUL.md` | 智能体个性/身份 |
| `sessions/` | 对话历史记录 |
| `memories/` | 持久化记忆存储 |
| `skills/` | 已安装的技能 |
| `cron/` | 计划任务定义 |
| `hooks/` | 事件钩子 |
| `logs/` | 运行时日志 |
| `skins/` | 自定义 CLI 皮肤 |

:::warning
切勿同时将两个 Hermes **网关** 容器指向同一个数据目录 —— 会话文件和记忆存储未设计用于并发写入。与网关并行运行仪表板容器是安全的，因为仪表板仅读取数据。
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

直接使用 `-e` 标志会覆盖 `.env` 中的值。这在 CI/CD 或密钥管理器集成中很有用，当你不希望密钥保存在磁盘上时。

## Docker Compose 示例

对于同时部署网关和仪表板的持久化方案，`docker-compose.yaml` 非常方便：

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
    # 取消注释以下行以通过 .env 文件转发特定环境变量：
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

Hermes 容器需要中等资源。推荐最小值：

| 资源 | 最小值 | 推荐值 |
|----------|---------|-------------|
| 内存 | 1 GB | 2–4 GB |
| CPU | 1 核心 | 2 核心 |
| 磁盘（数据卷） | 500 MB | 2+ GB（随会话/技能增长） |

浏览器自动化（Playwright/Chromium）是最耗内存的功能。如果不需要浏览器工具，1 GB 足够。启用浏览器工具时，至少分配 2 GB。

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

官方镜像是基于 `debian:13.4` 构建的，包含：

- Python 3 及所有 Hermes 依赖项（`pip install -e ".[all]"`）
- Node.js + npm（用于浏览器自动化和 WhatsApp 桥接）
- Playwright 及 Chromium（`npx playwright install --with-deps chromium`）
- ripgrep 和 ffmpeg 作为系统工具
- WhatsApp 桥接脚本（`scripts/whatsapp-bridge/`）

入口脚本（`docker/entrypoint.sh`）会在首次运行时引导数据卷：
- 创建目录结构（`sessions/`、`memories/`、`skills/` 等）
- 如果没有 `.env` 文件，则复制 `.env.example` → `.env`
- 如果没有 `config.yaml`，则复制默认配置
- 如果没有 `SOUL.md`，则复制默认人格文件
- 使用基于清单的方式同步捆绑技能（保留用户修改）
- 然后使用你传入的任何参数运行 `hermes`

## 升级

拉取最新镜像并重建容器。你的数据目录保持不变。

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

当使用 Docker 作为执行环境时（不是上述方法，而是当智能体在 Docker 沙箱中运行命令时），Hermes 会自动将技能目录（`~/.hermes/skills/`）以及技能声明的任何凭据文件作为只读卷绑定挂载到容器中。这意味着技能脚本、模板和引用在沙箱内立即可用，无需手动配置。

SSH 和 Modal 后端也采用相同的同步机制 —— 在每个命令执行前，技能和凭据文件会通过 rsync 或 Modal 挂载 API 上传。

## 故障排除

### 容器立即退出

检查日志：`docker logs hermes`。常见原因：
- 缺少或无效的 `.env` 文件 —— 首先交互式运行以完成设置
- 如果暴露端口，可能存在端口冲突

### "Permission denied" 错误

容器默认以 root 身份运行。如果你的宿主机 `~/.hermes/` 是由非 root 用户创建的，权限应该正常。如果出现错误，请确保数据目录可写：

```sh
chmod -R 755 ~/.hermes
```

### 浏览器工具不工作

Playwright 需要共享内存。在你的 Docker run 命令中添加 `--shm-size=1g`：

```sh
docker run -d \
  --name hermes \
  --shm-size=1g \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

### 网关在网络问题后无法重连

`--restart unless-stopped` 标志可以处理大多数临时故障。如果网关卡住，重启容器：

```sh
docker restart hermes
```

### 检查容器健康状态

```sh
docker logs --tail 50 hermes          # 最近日志
docker run -it --rm nousresearch/hermes-agent:latest version     # 验证版本
docker stats hermes                    # 资源使用情况
```