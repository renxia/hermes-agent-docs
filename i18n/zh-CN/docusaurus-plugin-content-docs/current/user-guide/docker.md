---
sidebar_position: 7
title: "Docker"
description: "在 Docker 中运行 Hermes Agent 并使用 Docker 作为终端后端"
---

# Hermes Agent — Docker

Docker 与 Hermes Agent 的交叉点有两种不同的方式：

1. **在 Docker 中运行 Hermes** — 代理本身运行在容器内部（本页的主要焦点）
2. **使用 Docker 作为终端后端** — 代理在您的主机上运行，但执行命令在 Docker 沙箱内部（参见 [配置 → terminal.backend](./configuration.md)）

本页涵盖选项 1。容器将所有用户数据（配置、API 密钥、会话、技能、记忆）存储在一个从主机挂载到 `/opt/data` 的单个目录中。镜像本身是无状态的，可以拉取新版本进行升级，而不会丢失任何配置。

## 快速入门

如果这是您第一次运行 Hermes Agent，请在主机上创建一个数据目录，并以交互模式启动容器以运行设置向导：

```sh
mkdir -p ~/.hermes
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent setup
```

这将您带入设置向导，该向导将提示您输入 API 密钥，并将它们写入 `~/.hermes/.env`。您只需要执行一次此操作。强烈建议此时设置一个聊天系统供网关使用。

## 运行网关模式

配置完成后，作为持久化的网关在后台运行容器（Telegram、Discord、Slack、WhatsApp 等）：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  nousresearch/hermes-agent gateway run
```

端口 8642 暴露了网关的 [OpenAI 兼容 API 服务器](./api-server.md) 和健康端点。如果您只使用聊天平台（Telegram、Discord 等），则此端口是可选的；但如果您希望仪表板或外部工具能够访问网关，则必须开放。

在面向互联网的机器上打开任何端口都是一个安全风险。除非您了解这些风险，否则不应该这样做。

## 运行仪表板

内置的 Web 仪表板可以作为单独的容器与网关并行运行。

要将仪表板作为自己的容器运行，请将其指向网关的健康端点，以便它可以在容器之间检测网关状态：

```sh
docker run -d \
  --name hermes-dashboard \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 9119:9119 \
  -e GATEWAY_HEALTH_URL=http://$HOST_IP:8642 \
  nousresearch/hermes-agent dashboard
```

将 `$HOST_IP` 替换为运行网关容器的机器的 IP 地址（例如 `192.168.1.100`），或者如果两个容器共享网络，请使用 Docker 网络主机名（参见下方的 [Compose 示例](#docker-compose-example)）。

| 环境变量 | 描述 | 默认值 |
|---|-------------|---------|
| `GATEWAY_HEALTH_URL` | 网关 API 服务器的基础 URL，例如 `http://gateway:8642` | *(未设置 — 仅本地 PID 检查)* |
| `GATEWAY_HEALTH_TIMEOUT` | 健康探测超时时间（秒） | `3` |

如果没有 `GATEWAY_HEALTH_URL`，仪表板将回退到本地进程检测——这仅在网关在同一容器或同一主机上运行时有效。

## 交互式运行（CLI 聊天）

要针对正在运行的数据目录打开一个交互式聊天会话：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent
```

## 持久卷

`/opt/data` 卷是所有 Hermes 状态的单一真相来源。它映射到您主机的 `~/.hermes/` 目录，包含：

| 路径 | 内容 |
|------|----------|
| `.env` | API 密钥和秘密 |
| `config.yaml` | 所有 Hermes 配置 |
| `SOUL.md` | 代理个性/身份 |
| `sessions/` | 对话历史 |
| `memories/` | 持久记忆存储 |
| `skills/` | 已安装的技能 |
| `cron/` | 定时任务定义 |
| `hooks/` | 事件钩子 |
| `logs/` | 运行时日志 |
| `skins/` | 定制 CLI 皮肤 |

:::warning
切勿同时对同一数据目录运行两个 Hermes **网关**容器——会话文件和记忆存储并非设计用于并发写入。在网关旁边运行仪表板容器是安全的，因为仪表板只读取数据。
:::

## 环境变量转发

API 密钥从容器内部的 `/opt/data/.env` 读取。您也可以直接传递环境变量：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -e OPENAI_API_KEY="sk-..." \
  nousresearch/hermes-agent
```

直接的 `-e` 标志会覆盖 `.env` 中的值。这对于 CI/CD 或秘密管理器集成非常有用，因为您不希望密钥存储在磁盘上。

## Docker Compose 示例

对于同时使用网关和仪表板的持久部署，使用 `docker-compose.yaml` 非常方便：

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
    # 要转发特定环境变量而不是使用 .env 文件，请取消注释以下部分：
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

Hermes 容器需要适度的资源。推荐的最低配置：

| 资源 | 最低要求 | 推荐配置 |
|----------|---------|-------------|
| 内存 | 1 GB | 2–4 GB |
| CPU | 1 核 | 2 核 |
| 磁盘（数据卷） | 500 MB | 2+ GB（随会话/技能增长） |

浏览器自动化（Playwright/Chromium）是内存消耗最大的功能。如果您不需要浏览器工具，1 GB 就足够了。如果启用了浏览器工具，请至少分配 2 GB。

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

- Python 3 以及所有 Hermes 依赖项（`pip install -e ".[all]"`）
- Node.js + npm（用于浏览器自动化和 WhatsApp 桥接）
- Playwright 及其 Chromium（`npx playwright install --with-deps chromium`）
- ripgrep 和 ffmpeg 作为系统实用工具
- WhatsApp 桥接（`scripts/whatsapp-bridge/`）

入口点脚本（`docker/entrypoint.sh`）在首次运行时会初始化数据卷：
- 创建目录结构（`sessions/`、`memories/`、`skills/` 等）
- 如果不存在 `.env`，则复制 `.env.example` → `.env`
- 如果缺少，则复制默认 `config.yaml`
- 如果缺少，则复制默认 `SOUL.md`
- 使用基于清单的方法同步打包的技能（保留用户编辑）
- 然后运行 `hermes` 并使用您传递的任何参数

## 升级

拉取最新镜像并重新创建容器。您的数据目录不会受到影响。

```sh
docker pull nousresearch/hermes-agent:latest
docker rm -f hermes
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

或者使用 Docker Compose：

```sh
docker compose pull
docker compose up -d
```

## 技能和凭证文件

当使用 Docker 作为执行环境时（不是上述方法，而是代理在 Docker 沙箱内部运行命令时），Hermes 会自动将技能目录 (`~/.hermes/skills/`) 和任何由技能声明的凭证文件作为只读卷绑定挂载到容器中。这意味着技能脚本、模板和引用可以在沙箱内部使用，无需手动配置。

SSH 和 Modal 后端也执行相同的同步——在每次命令之前，技能和凭证文件会通过 rsync 或 Modal 挂载 API 上传。

## 故障排除

### 容器立即退出

检查日志：`docker logs hermes`。常见原因：
- 缺少或无效的 `.env` 文件——请先以交互模式运行以完成设置
- 端口冲突（如果暴露了端口）

### "Permission denied" 错误

容器默认以 root 身份运行。如果您的主机 `~/.hermes/` 是由非 root 用户创建的，权限应该正常工作。如果出现错误，请确保数据目录是可写的：

```sh
chmod -R 755 ~/.hermes
```

### 浏览器工具无法工作

Playwright 需要共享内存。请在 Docker 运行命令中添加 `--shm-size=1g`：

```sh
docker run -d \
  --name hermes \
  --shm-size=1g \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

### 网络问题后网关无法重新连接

`--restart unless-stopped` 标志可以处理大多数瞬时故障。如果网关卡住，请重启容器：

```sh
docker restart hermes
```

### 检查容器状态

```sh
docker logs --tail 50 hermes          # 查看最近的日志
docker run -it --rm nousresearch/hermes-agent:latest version     # 验证版本
docker stats hermes                    # 资源使用情况
```