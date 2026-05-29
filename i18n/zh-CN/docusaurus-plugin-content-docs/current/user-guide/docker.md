---
sidebar_position: 7
title: "Docker"
description: "在 Docker 中运行 Hermes 智能体，并使用 Docker 作为终端后端"
---

# Hermes 智能体 — Docker

Docker 与 Hermes 智能体的交互主要有两种不同方式：

1. **在 Docker 中运行 Hermes** — 智能体本身运行在容器内（本页主要关注点）
2. **Docker 作为终端后端** — 智能体运行在你的主机上，但将每条命令都在单个持久的 Docker 沙箱容器内执行，该容器在整个工具调用、`/new` 命令以及子智能体的生命周期内持续存在（参见 [配置 → Docker 后端](./configuration.md#docker-backend)）

本页介绍选项 1。容器将所有用户数据（配置、API 密钥、会话、技能、记忆）存储在从主机挂载到 `/opt/data` 的单个目录中。镜像本身是无状态的，可以通过拉取新版本来升级，而不会丢失任何配置。

## 快速开始

如果这是你第一次运行 Hermes 智能体，请在主机上创建一个数据目录，并以交互方式启动容器来运行设置向导：

```sh
mkdir -p ~/.hermes
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent setup
```

这将带你进入设置向导，它会提示你输入 API 密钥，并将其写入 `~/.hermes/.env`。你只需要执行一次此操作。强烈建议在此时为网关设置一个聊天系统以配合工作。

:::tip
在容器内运行一次 `hermes setup --portal` — 刷新令牌会持久保存在挂载的 `~/.hermes` 卷中。参见 [Nous 门户](/integrations/nous-portal)。
:::

## 以网关模式运行

配置完成后，在后台将容器作为持久性网关运行（Telegram、Discord、Slack、WhatsApp 等）：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  nousresearch/hermes-agent gateway run
```

端口 8642 用于暴露网关的 [OpenAI 兼容 API 服务器](./features/api-server.md) 和健康检查端点。如果仅使用聊天平台（Telegram、Discord 等），此端口为可选项；但如果需要仪表盘或外部工具访问网关，则必须使用。

:::tip 网关在监督下运行
在官方 Docker 镜像内部，`gateway run` **由 s6-overlay 自动监督**：如果网关进程崩溃，它会在几秒内自动重启，无需重启容器；当设置了 `HERMES_DASHBOARD=1` 时，仪表盘也会同时被监督。`gateway run` 的 CMD 进程本身是一个 `sleep infinity` 心跳，用于保持容器存活，而实际的网关进程则由 s6 管理——因此 `docker stop` 仍能正常关闭所有进程，但 `docker logs` 会显示被监督网关的输出。

你将在 `docker logs` 中看到一行确认升级的记录。要退出此行为——并获得历史遗留的“网关是容器主进程，容器退出即网关退出”的语义——请传入 `--no-supervise` 或设置 `HERMES_GATEWAY_NO_SUPERVISE=1`。退出选项对于需要容器随网关状态码退出的 CI 冒烟测试很有用；对于生产部署，受监督的默认行为严格更好。

此行为仅适用于基于 s6 的镜像。早期（基于 tini 的）镜像仍然将 `gateway run` 作为前台主进程运行。
:::

:::note 网关日志的去向
请参阅下方的[日志去向](#日志去向)部分，了解完整的路由映射（按配置文件划分的网关、仪表盘、启动协调器、容器范围的 `docker logs`）。
:::

注意：API 服务器受 `API_SERVER_ENABLED=true` 控制。要将容器内部的访问范围从 `127.0.0.1` 扩展到外部，还需设置 `API_SERVER_HOST=0.0.0.0` 和一个 `API_SERVER_KEY`（至少 8 个字符——可用 `openssl rand -hex 32` 生成）。示例：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  -e API_SERVER_ENABLED=true \
  -e API_SERVER_HOST=0.0.0.0 \
  -e API_SERVER_KEY="$(openssl rand -hex 32)" \
  -e API_SERVER_CORS_ORIGINS='*' \
  nousresearch/hermes-agent gateway run
```

在面向互联网的机器上开放任何端口都存在安全风险。除非您了解相关风险，否则不应这样做。

## 运行仪表盘

内置的 Web 仪表盘作为受监督的 s6-rc 服务，在同一个容器中与网关一起运行。设置 `HERMES_DASHBOARD=1` 即可启动：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  -p 9119:9119 \
  -e HERMES_DASHBOARD=1 \
  nousresearch/hermes-agent gateway run
```

仪表盘由 s6 监督——如果它崩溃，`s6-supervise` 会在短暂的退避后自动重启。仪表盘的 stdout/stderr 会转发到 `docker logs <container>`（无前缀；网关自身的输出现在位于按配置文件划分的 s6-log 文件中——参见下方的[日志去向](#日志去向)——因此两个流不会冲突）。

| 环境变量 | 描述 | 默认值 |
|---------------------|-------------|---------|
| `HERMES_DASHBOARD` | 设置为 `1`（或 `true` / `yes`）以启用受监督的仪表盘服务 | *（未设置——服务已注册但保持停止状态）* |
| `HERMES_DASHBOARD_HOST` | 仪表盘 HTTP 服务器的绑定地址 | `0.0.0.0` |
| `HERMES_DASHBOARD_PORT` | 仪表盘 HTTP 服务器的端口 | `9119` |
| `HERMES_DASHBOARD_TUI` | 设置为 `1` 以在浏览器中暴露聊天标签页（通过 PTY/WebSocket 嵌入 `hermes --tui`） | *（未设置）* |
| `HERMES_DASHBOARD_INSECURE` | 设置为 `1`（或 `true` / `yes`）以绕过 OAuth 认证门进行绑定。仅在没有 OAuth 协议的受信任网络、反向代理后使用——仪表盘会暴露 API 密钥和会话数据 | *（未设置——当注册了 `DashboardAuthProvider` 时强制执行门控）* |

容器内部的仪表盘默认绑定到 `0.0.0.0`——如果不这样设置，发布的 `-p 9119:9119` 端口将无法从宿主机访问。要将绑定限制在容器本地回环（用于 sidecar / 反向代理设置），请设置 `HERMES_DASHBOARD_HOST=127.0.0.1`。

仪表盘的 OAuth 认证门控会在以下两个条件同时满足时自动启用：

1.  绑定主机非本地回环（例如容器内部默认的 `0.0.0.0`），**且**
2.  已注册 `DashboardAuthProvider` 插件。

捆绑的 `dashboard_auth/nous` 提供程序会在设置了 `HERMES_DASHBOARD_OAUTH_CLIENT_ID` 时自动激活（参见 [Web 仪表盘 → 认证](features/web-dashboard.md)）。启用门控后，浏览器调用者将被重定向到已配置的门户 OAuth 流程，然后才能访问任何受保护的路由。

如果未注册提供程序且绑定为非本地回环，仪表盘将在**启动时安全关闭**，并显示一条指向缺失环境变量的特定错误。要明确退出门控——例如，在您自己的反向代理后部署受信任的 LAN，且没有 OAuth 协议——请设置 `HERMES_DASHBOARD_INSECURE=1`。这是**唯一**禁用门控的途径；仅绑定主机本身绝不意味着 `--insecure`（以前是这样，但那是在 OAuth 门控之前，它会默默地禁用每个容器部署的仪表盘上的门控）。

:::warning `HERMES_DASHBOARD_INSECURE=1` 会暴露 API 密钥
退出 OAuth 门控会将仪表盘的 API 表面（包括模型密钥和会话数据）提供给任何能够访问已发布端口的人。仅当您在前端有自己的身份验证层，或在您完全控制的受信任 LAN 上时才启用它。
:::

不支持将仪表盘作为单独容器运行：其网关活性检测需要与网关进程共享 PID 命名空间。

## 交互式运行（CLI 聊天）

要针对正在运行的数据目录打开一个交互式聊天会话：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent
```

或者，如果您已经打开了正在运行的容器中的终端（例如通过 Docker Desktop），只需运行：

```sh
/opt/hermes/.venv/bin/hermes
```

## 持久化卷

`/opt/data` 卷是所有 Hermes 状态的唯一真实来源。它映射到宿主机的 `~/.hermes/` 目录，包含：

| 路径 | 内容 |
|------|----------|
| `.env` | API 密钥和机密 |
| `config.yaml` | 所有 Hermes 配置 |
| `SOUL.md` | 智能体的人格/身份 |
| `sessions/` | 对话历史记录 |
| `memories/` | 持久化内存存储 |
| `skills/` | 已安装的技能 |
| `home/` | 用于 Hermes 工具子进程（`git`, `ssh`, `gh`, `npm` 和技能命令行工具）的按配置文件划分的 HOME 目录 |
| `cron/` | 计划任务定义 |
| `hooks/` | 事件钩子 |
| `logs/` | 运行时日志 |
| `skins/` | 自定义 CLI 外观 |

将凭据存储在 `~` 下的技能命令行工具必须针对子进程 HOME 目录初始化，而不仅仅是数据卷根目录。例如，[xurl 技能](./skills/bundled/social-media/social-media-xurl.md) 将 OAuth 状态存储在 `~/.xurl` 中；在官方 Docker 布局中，Hermes 工具调用将其读取为 `/opt/data/home/.xurl`，因此请使用 `HOME=/opt/data/home` 运行手动 xurl 认证，并使用 `HOME=/opt/data/home xurl auth status` 进行验证。

:::warning
切勿让两个 Hermes **网关**容器同时指向同一个数据目录——会话文件和内存存储不支持并发写入访问。
:::

## 多配置文件支持

Hermes 支持[多个配置文件](../reference/profile-commands.md)——独立的 `~/.hermes/` 子目录，让您可以从单个安装运行独立的智能体（不同的 SOUL、技能、内存、会话、凭据）。**在官方 Docker 镜像内部，s6 监督树将每个配置文件视为一等受监督服务**，因此推荐的部署方式是**一个容器托管所有配置文件**。

使用 `hermes profile create <name>` 创建的每个配置文件都会获得：

- 一个专用的 s6 服务插槽，位于 `/run/service/gateway-<name>/`，由运行时动态注册——无需重建容器。
- 崩溃后自动重启，由 `s6-supervise` 进行退避管理。
- 每个配置文件的轮转日志，位于 `${HERMES_HOME}/logs/gateways/<name>/current`（10 个存档，每个 1 MB）。
- 容器重启后状态持久化：启动时的协调器会从每个配置文件目录读取 `gateway_state.json`，并仅为上次记录状态为 `running` 的配置文件恢复其服务插槽。停止的配置文件保持停止状态。

您在宿主机上运行的生命周期命令在容器内部的工作方式相同：

```sh
# 创建配置文件 — 注册 gateway-<name> s6 插槽。
docker exec hermes hermes profile create coder

# 启动 / 停止 / 重启 — 分派 s6-svc；网关生命周期在 docker 重启后存活。
docker exec hermes hermes -p coder gateway start
docker exec hermes hermes -p coder gateway stop
docker exec hermes hermes -p coder gateway restart

# 状态 — 在容器内部报告 `Manager: s6 (container supervisor)`。
docker exec hermes hermes -p coder gateway status

# 删除配置文件 — 同时拆除 s6 插槽。
docker exec hermes hermes profile delete coder
```

在底层，容器内部的 `hermes gateway start/stop/restart` 会被拦截并路由到对应服务目录的 `s6-svc`；您无需直接学习 s6 命令。要获取原始监督器状态，请使用 `/command/s6-svstat /run/service/gateway-<name>`（注意 `/command/` 仅在监督树生成的进程的 PATH 中——从 `docker exec` 调用时，请传递绝对路径）。

### 为什么选择一个容器包含多个配置文件，而不是多个容器

在 s6 迁移之前，“每个配置文件一个容器”是推荐的模式，因为当时没有容器内监督器来管理多个网关。随着 s6 成为 PID 1，这不再是必要的，单容器布局在几乎所有方面都更简单：

| | 一个容器，多个配置文件 | 每个配置文件一个容器 |
|---|---|---|
| 磁盘开销 | 一个镜像，一个捆绑的 venv，一个 Playwright 缓存 | N 个镜像 / N 个缓存 |
| 内存开销 | 共享的 Python 解释器缓存，共享的 node_modules | 每个容器重复占用 |
| 配置文件创建 | `docker exec ... hermes profile create <name>`（秒级） | 新的 `docker run` 调用 + 端口分配 + 绑定挂载配置 |
| 每配置文件的崩溃恢复 | `s6-supervise` 自动重启 | Docker 的 `--restart unless-stopped`（更慢，会终止同级任务） |
| 日志 | 通过 `s6-log` 的每配置文件轮转文件，加上容器启动审计日志 | `docker logs <name>` 每个容器——没有内置轮转 |
| 备份 | 一个 `~/.hermes` 目录 | N 个需要协调的目录 |

默认配置文件 (`default`) 总是在首次启动时注册，因此新容器开箱即用就带有一个受监督的网关。其他配置文件是纯运行时添加。

### 何时需要单独的容器

配置文件在容器中是默认模式。只有在特定原因下才需要为每个配置文件运行单独的容器：

- **按工作负载资源隔离** —— 例如，配置文件 A 中失控的浏览器工具会话不应导致配置文件 B 内存不足。容器为您提供了 `--memory` / `--cpus` 按配置文件设置。
- **独立的镜像版本固定** —— 为每个工作负载使用不同的上游镜像标签。
- **网络分段** —— 按配置文件使用不同的 Docker 网络（例如，一个面向客户，一个内部使用）。
- **合规性/影响半径** —— 独立的凭据永不共享操作系统级别的进程树。

在这些情况下，为每个配置文件声明一个具有不同 `container_name`、`volumes` 和 `ports` 的服务：

```yaml
services:
  hermes-work:
    image: nousresearch/hermes-agent:latest
    container_name: hermes-work
    restart: unless-stopped
    command: gateway run
    ports:
      - "8642:8642"
    volumes:
      - ~/.hermes-work:/opt/data

  hermes-personal:
    image: nousresearch/hermes-agent:latest
    container_name: hermes-personal
    restart: unless-stopped
    command: gateway run
    ports:
      - "8643:8642"
    volumes:
      - ~/.hermes-personal:/opt/data
```

[持久化卷](#持久化卷)中的警告仍然适用：切勿让两个容器同时指向同一个 `~/.hermes` 目录。每个容器内部的 s6 监督器管理其自己的配置文件集；跨容器共享数据卷会损坏会话文件和内存存储。

## 日志去向

s6 容器有四个独立的日志表面，"为什么我的网关在 `docker logs` 中没有显示任何内容" 是一个常见的疑问。速查表：

| 来源 | 存放位置 | 如何读取 |
|---|---|---|
| **每个配置文件的网关** (`hermes gateway run` 和 s6 下的每个配置文件网关) | 被分两处输出：`docker logs <container>` (实时，无额外前缀) **和** `${HERMES_HOME}/logs/gateways/<profile>/current` (轮转，带 ISO-8601 时间戳，10 个存档，每个 1 MB) | 在主机上使用 `docker logs -f hermes` 或 `tail -F ~/.hermes/logs/gateways/default/current` |
| **仪表板** (当 `HERMES_DASHBOARD=1` 时) | `docker logs <container>` (无前缀) | `docker logs -f hermes` — 与网关日志交错输出 |
| **启动协调器** (记录每次容器启动时恢复了哪些配置文件网关) | `${HERMES_HOME}/logs/container-boot.log` (仅追加审计日志) | `tail -F ~/.hermes/logs/container-boot.log` |
| **通用 Hermes 日志** (`agent.log`, `errors.log`) | `${HERMES_HOME}/logs/` (配置文件感知) | `docker exec hermes hermes logs --follow [--level WARNING] [--session <id>]` |

两个值得了解的实际后果：

- `logs/gateways/<profile>/current` 处的文件副本在容器重启后依然存在。`docker logs` 仅保留当前容器生命周期内的输出（在 `docker rm` 时被清除）；轮转的文件会持久化在绑定挂载卷上。
- 启动协调器的审计行格式为 `<iso-timestamp> profile=<name> prior_state=<state> action=<registered|started>`，因此快速执行 `grep profile=coder ~/.hermes/logs/container-boot.log` 即可显示某个配置文件最后恢复的时间以及 s6 是否自动启动了它。

## 环境变量转发

API 密钥从容器内的 `/opt/data/.env` 读取。你也可以直接传递环境变量：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -e OPENAI_API_KEY="sk-..." \
  nousresearch/hermes-agent
```

直接使用 `-e` 标志会覆盖 `.env` 中的值。这对于 CI/CD 或机密管理器集成很有用，因为你不想将密钥存放在磁盘上。

:::note 寻找 Docker 作为**终端后端**？
本页涵盖了在 Docker 内运行 Hermes 本身。如果你想让 Hermes 在一个 Docker 沙盒容器内（一个在 Hermes 进程间共享的长生命周期容器 — 参见 issue #20561）执行智能体的 `terminal` / `execute_code` 调用，那是另一个单独的配置块 — `terminal.backend: docker` 加上 `terminal.docker_image`、`terminal.docker_volumes`、`terminal.docker_forward_env`、`terminal.docker_env`、`terminal.docker_run_as_host_user`、`terminal.docker_extra_args`、`terminal.docker_persist_across_processes` 和 `terminal.docker_orphan_reaper`。有关完整的设置（包括容器生命周期规则），请参阅 [配置 → Docker 后端](configuration.md#docker-backend)。
:::

## Docker Compose 示例

要实现持久化部署并同时运行网关和仪表盘，使用 `docker-compose.yaml` 会很方便：

```yaml
services:
  hermes:
    image: nousresearch/hermes-agent:latest
    container_name: hermes
    restart: unless-stopped
    command: gateway run
    ports:
      - "8642:8642"   # 网关 API
      - "9119:9119"   # 仪表盘 (仅当 HERMES_DASHBOARD=1 时可达)
    volumes:
      - ~/.hermes:/opt/data
    environment:
      - HERMES_DASHBOARD=1
      # 取消注释以传递特定环境变量，而非使用 .env 文件：
      # - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      # - OPENAI_API_KEY=${OPENAI_API_KEY}
      # - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"
```

使用 `docker compose up -d` 启动，并使用 `docker compose logs -f` 查看日志。受监管网关的标准输出也会被 tee 到卷上的 `${HERMES_HOME}/logs/gateways/<profile>/current` —— 完整路由图请参见 [日志存放位置](#where-the-logs-go)。

## 可选：Linux 桌面音频桥接

Docker 中的语音模式需要两个独立的部分才能工作：必须允许 Hermes 探测容器内的音频设备，并且容器必须能够访问宿主机的音频服务器。以下设置涵盖了暴露 PulseAudio 兼容套接字的 Linux 桌面（包括许多 PipeWire 设置）的宿主机音频管道。

:::caution
这是一个 Linux 桌面变通方案，并非通用的 Docker Desktop 功能。当您已经在宿主机上配置好音频，并希望在 Hermes 容器内使用 CLI 语音模式时，此方案很有用。如果 Hermes 仍然报告 `Running inside Docker container -- no audio devices`，请使用包含对 `PULSE_SERVER` / `PIPEWIRE_REMOTE` 的 Docker 音频探测支持的构建版本。
:::

首先，在您的 Compose 文件旁创建一个 ALSA 配置：

```conf title="asound.conf"
pcm.!default {
    type pulse
    hint {
        show on
        description "Default ALSA Output (PulseAudio)"
    }
}

pcm.pulse {
    type pulse
}

ctl.!default {
    type pulse
}
```

然后构建一个安装了 ALSA PulseAudio 插件的小型派生镜像：

```dockerfile title="Dockerfile.audio"
FROM nousresearch/hermes-agent:latest

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends libasound2-plugins \
    && rm -rf /var/lib/apt/lists/*
```

在 Compose 中使用该镜像，并传入宿主机用户的 PulseAudio 套接字和 cookie：

```yaml
services:
  hermes:
    build:
      context: .
      dockerfile: Dockerfile.audio
    image: hermes-agent-audio
    container_name: hermes
    restart: unless-stopped
    command: gateway run
    volumes:
      - ~/.hermes:/opt/data
      - /run/user/${HERMES_UID}/pulse:/run/user/${HERMES_UID}/pulse
      - ~/.config/pulse/cookie:/tmp/pulse-cookie:ro
      - ./asound.conf:/etc/asound.conf:ro
    environment:
      - HERMES_UID=${HERMES_UID}
      - HERMES_GID=${HERMES_GID}
      - XDG_RUNTIME_DIR=/run/user/${HERMES_UID}
      - PULSE_SERVER=unix:/run/user/${HERMES_UID}/pulse/native
      - PULSE_COOKIE=/tmp/pulse-cookie
```

使用宿主机的 UID/GID 启动，以便容器进程可以访问用户级的音频套接字：

```sh
export HERMES_UID="$(id -u)"
export HERMES_GID="$(id -g)"
docker compose up -d --build
```

要验证 PortAudio 在容器内检测到的内容：

```sh
docker exec hermes /opt/hermes/.venv/bin/python -c "import sounddevice as sd; print(sd.query_devices())"
```

## 资源限制

Hermes 容器需要适度的资源。推荐的最低配置：

| 资源       | 最低   | 推荐        |
|------------|--------|-------------|
| 内存       | 1 GB   | 2–4 GB      |
| CPU        | 1 核   | 2 核        |
| 磁盘（数据卷） | 500 MB | 2+ GB (随会话/技能增长) |

浏览器自动化（Playwright/Chromium）是内存消耗最大的功能。如果不需要浏览器工具，1 GB 就足够了。如果启用浏览器工具，请至少分配 2 GB。

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

官方镜像基于 `debian:13.4`，包含：

- Python 3 及所有 Hermes 依赖项 (`uv pip install -e ".[all]"`)
- Node.js + npm（用于浏览器自动化和 WhatsApp 桥接）
- 带有 Chromium 的 Playwright (`npx playwright install --with-deps chromium --only-shell`)
- ripgrep、ffmpeg、git 和 `xz-utils` 作为系统工具
- **`docker-cli`** —— 因此容器内运行的智能体可以驱动宿主机的 Docker 守护进程（绑定挂载 `/var/run/docker.sock` 以启用），用于 `docker build`、`docker run`、容器检查等操作。
- **`openssh-client`** —— 支持从容器内启用 [SSH 终端后端](/user-guide/configuration#ssh-backend)。SSH 后端会调用系统的 `ssh` 二进制文件；如果没有它，在容器化安装中会静默失败。
- WhatsApp 桥接 (`scripts/whatsapp-bridge/`)
- **[`s6-overlay`](https://github.com/just-containers/s6-overlay) v3** 作为 PID 1（替代了旧版的 `tini`） —— 监管仪表盘和每个配置文件的网关，崩溃时自动重启，回收僵尸子进程并转发信号。

容器的 `ENTRYPOINT` 是 s6-overlay 的 `/init`。启动时它会：
1. 以 root 身份运行 `/etc/cont-init.d/01-hermes-setup` (= `docker/stage2-hook.sh`)：可选的 UID/GID 重映射，修复卷的所有权，首次启动时初始化 `.env` / `config.yaml` / `SOUL.md`，同步打包的技能。
2. 运行 `/etc/cont-init.d/02-reconcile-profiles` (= `hermes_cli.container_boot`)：遍历 `$HERMES_HOME/profiles/<name>/`，在 `/run/service/gateway-<profile>/` 下重新创建每个配置文件的网关 s6 服务插槽，并且仅自动启动那些最后记录状态为 `running` 的（参见 [每个配置文件的网关监管](#per-profile-gateway-supervision)）。
3. 启动静态的 `main-hermes` 和 `dashboard` s6-rc 服务。
4. 将容器的 CMD 作为主程序执行 (`/opt/hermes/docker/main-wrapper.sh`)，它将路由用户传递给 `docker run` 的参数：
   - 无参数 → `hermes` (默认)
   - 第一个参数是 PATH 上的可执行文件（例如 `sleep`、`bash`）→ 直接执行它
   - 其他任何参数 → `hermes <args>` (子命令透传)
   当这个主程序退出时，容器也会退出，并使用其退出代码。

:::warning 与 pre-s6 镜像的破坏性变更
容器的 ENTRYPOINT 现在是 `/init` (s6-overlay)，而不是 `/usr/bin/tini`。所有五个文档记录的 `docker run` 调用模式（无参数、`chat -q "…"`、`sleep infinity`、`bash`、`--tui`）行为与基于 tini 的镜像完全相同。如果您有依赖于 tini 特定信号行为或硬编码 `/usr/bin/tini --` 调用的下游包装器，请固定到之前的镜像标签。
:::

:::warning 权限模型
除非您在命令链中保留 `/init`（或等效地，转发到第二阶段钩子的传统 `docker/entrypoint.sh` shim），否则不要覆盖镜像的入口点。s6-overlay 的 `/init` 以 root 身份运行，以便在首次启动时 chown 卷，然后通过 `s6-setuidgid` 为每个受监管的服务以及主程序降级到 `hermes` 用户。在官方镜像中以 root 身份启动 `hermes gateway run` 默认是被拒绝的，因为它可能在 `/opt/data` 中留下 root 拥有的文件，并破坏后续的仪表盘或网关启动。仅当您有意接受该风险时才设置 `HERMES_ALLOW_ROOT_GATEWAY=1`。
:::

### `docker exec` 自动降级到 `hermes` 用户

`docker exec hermes <cmd>` 默认在容器内以 root 身份运行，但镜像在 `/opt/hermes/bin/hermes` (PATH 上的最前位置) 提供了一个轻量级 shim，它能检测 root 调用者并通过 `s6-setuidgid hermes` 透明地重新执行。因此 `docker exec hermes login`、`docker exec hermes profile create …`、`docker exec hermes setup` 等命令写入的文件都属于 UID 10000 —— 即受监管的网关可读 —— 无需额外添加 `--user` 标志。非 root 调用者（受监管的进程本身、`docker exec --user hermes`、容器内的看板子智能体）会触发一个直接执行 venv 二进制文件的短路操作，因此在热路径上没有开销。

如果您特别需要保留 root 语义的 `docker exec`（诊断会话、检查仅限 root 的状态、root 恰好拥有的 `/opt/data` 之外的文件），可以按调用选择退出：

```sh
docker exec -e HERMES_DOCKER_EXEC_AS_ROOT=1 hermes <cmd>
```

该 shim 接受 `1` / `true` / `yes`（不区分大小写）。其他任何值 —— 包括拼写错误如 `=0` —— 都会回退到降级操作，因此无法实现静默选择退出。如果 `s6-setuidgid` 不可用（剥离了 s6-overlay 的自定义构建），该 shim 会拒绝以 root 身份运行并退出代码 126，从而明显暴露已损坏的权限模型，而不是回归到历史上的陷阱，即 `docker exec hermes login` 会以 `root:root` 身份写入 `auth.json`，并在每个聊天平台消息中破坏受监管网关的认证。

### 每个配置文件的网关监管

使用 `hermes profile create <name>` 创建的每个配置文件都会自动在 `/run/service/gateway-<name>/` 注册一个受 s6 监管的网关服务，并在容器重启时保持状态持久的自动重启。有关面向用户的生命周期工作流和命令，请参见上面的 [多配置文件支持](#multi-profile-support)。

**相比 pre-s6 镜像的监管优势：**

- 网关崩溃后由 `s6-supervise` 在约 1 秒退避后自动重启。
- 当使用 `HERMES_DASHBOARD=1` 启用仪表盘时，它在同一监管树上受到监管，并享受相同的自动重启处理。
- `docker restart` 保留正在运行的网关：`cont-init` 协调器读取 `$HERMES_HOME/profiles/<name>/gateway_state.json`，如果最后记录的状态是 `running`，则重新启动该插槽。已停止的网关保持停止状态。
- 每个配置文件的网关日志持久保存在 `$HERMES_HOME/logs/gateways/<profile>/current`（由 `s6-log` 轮转），协调器的操作会在每次启动时追加到 `$HERMES_HOME/logs/container-boot.log`。完整路由图请参见 [日志存放位置](#where-the-logs-go)。

容器内的 `hermes status` 报告 `Manager: s6 (container supervisor)`。使用 `/command/s6-svstat /run/service/gateway-<name>` 查看原始监管视图（注意 `/command/` 仅对监管树进程在 PATH 上；从 `docker exec` 调用时请使用绝对路径）。

## 升级

拉取最新镜像并重新创建容器。您的数据目录不受影响。

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

当使用 Docker 作为执行环境时（不是指上述方法，而是指智能体在 Docker 沙箱内运行命令时——参见 [配置 → Docker 后端](./configuration.md#docker-backend)），Hermes 会为所有工具调用复用一个长期存在的容器，并自动将技能目录（`~/.hermes/skills/`）以及技能声明的所有凭证文件以只读卷的形式绑定挂载到该容器中。技能脚本、模板和引用在沙箱内无需手动配置即可使用，并且由于容器在 Hermes 进程的生命周期内持续存在，您安装的任何依赖项或编写的文件都会保留到下一次工具调用。

同样的同步操作也适用于 SSH 和 Modal 后端——在每次命令执行前，技能和凭证文件会通过 rsync 或 Modal 挂载 API 上传。

## 在容器中安装更多工具

官方镜像包含一组精选的实用工具（参见 [Dockerfile 的作用](#what-the-dockerfile-does)），但并非智能体可能需要的所有工具都已预装。以下是五种推荐的方法，按所需努力和持久性递增的顺序排列。

### npm 或 Python 工具 — 使用 `npx` 或 `uvx`

对于发布到 npm 或 PyPI 的任何工具，指示 Hermes 通过 `npx`（npm）或 `uvx`（Python）运行它，并在其持久化记忆中记住该命令。如果工具需要配置文件或凭据，指示将其放在 `/opt/data` 下（例如 `/opt/data/<工具名>/config.yaml`）。

依赖项按需获取，并在容器的生命周期内缓存。写在 `/opt/data` 下的配置在容器重启后依然存在，因为它位于绑定挂载的宿主机目录中。包缓存本身在 `docker rm` 后会重建，但下次工具运行时 `npx` 和 `uvx` 会透明地重新获取。

### 其他工具（apt 包、二进制文件） — 安装并记住

对于 npm 或 PyPI 之外的任何工具 —— `apt` 包、预编译的二进制文件、镜像中尚未包含的语言运行时 —— 指示 Hermes 如何安装它（例如 `apt-get update && apt-get install -y <包名>`），并告知它记住安装命令。该工具将在容器的剩余生命周期内持续存在，并且当 Hermes 下次需要该工具时，会在容器重启后重新运行安装命令。

这非常适合安装迅速且偶尔使用的工具。对于经常使用的工具，建议采用下一种方法。

### 持久化安装 — 构建派生镜像

当某个工具必须在每次容器启动时立即可用，且不希望有重新安装的延迟时，可以构建一个继承自 `nousresearch/hermes-agent` 的新镜像，并在一个层中安装该工具：

```dockerfile
FROM nousresearch/hermes-agent:latest

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends <你的包名> \
    && rm -rf /var/lib/apt/lists/*
USER hermes
```

构建它并用它代替官方镜像：

```sh
docker build -t my-hermes:latest .
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  my-hermes:latest gateway run
```

入口点脚本和 `/opt/data` 的语义保持不变地继承下来，因此本页其余部分仍然适用。记得在拉取更新的上游 `nousresearch/hermes-agent` 时重新构建镜像。

### 复杂工具或多服务栈 — 运行辅助容器

对于自带服务（数据库、Web 服务器、队列、无头浏览器农场）或过于庞大而不适合放在 Hermes 容器内的工具，将它们作为独立的容器运行在共享的 Docker 网络上。Hermes 通过容器名称访问辅助容器，就像访问本地推理服务器一样（参见[连接本地推理服务器](#connecting-to-local-inference-servers-vllm-ollama-etc)）。

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

  my-tool:
    image: example/my-tool:latest
    container_name: my-tool
    restart: unless-stopped
    networks:
      - hermes-net

networks:
  hermes-net:
    driver: bridge
```

从 Hermes 容器内部，可以通过 `http://my-tool:<端口>`（或它所服务的任何协议）访问辅助容器。这种模式使每个服务的生命周期、资源限制和升级节奏保持独立，并避免将仅一个工具所需的依赖项塞进 Hermes 镜像，导致其臃肿。

### 广泛有用的工具 — 提交问题或拉取请求

如果一个工具可能对大多数 Hermes 智能体用户都有用，可以考虑将其贡献给上游，而不是将其保留在私有的派生镜像中。在 [hermes-agent 仓库](https://github.com/NousResearch/hermes-agent) 上提交一个 issue 或 pull request，描述该工具及其用例。被纳入官方镜像的工具将惠及所有用户，并避免下游分支的维护开销。

## 连接本地推理服务器（vLLM、Ollama 等）

当在 Docker 中运行 Hermes，并且您的推理服务器（vLLM、Ollama、text-generation-inference 等）也在宿主机或另一个容器中运行时，网络需要额外注意。

### Docker Compose（推荐）

将两个服务放在同一个 Docker 网络上。这是最可靠的方法：

```yaml
services:
  vllm:
    image: vllm/vllm-openai:latest
    container_name: vllm
    command: >
      --model Qwen/Qwen2.5-7B-Instruct
      --served-model-name my-model
      --host 0.0.0.0
      --port 8000
    ports:
      - "8000:8000"
    networks:
      - hermes-net
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]

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

networks:
  hermes-net:
    driver: bridge
```

然后在你的 `~/.hermes/config.yaml` 中，使用**容器名称**作为主机名：

```yaml
model:
  provider: custom
  model: my-model
  base_url: http://vllm:8000/v1
  api_key: "none"
```

:::tip 关键点
- 使用**容器名称**（`vllm`）作为主机名 —— 而不是 `localhost` 或 `127.0.0.1`，后者指向 Hermes 容器本身。
- `model` 的值必须与你传递给 vLLM 的 `--served-model-name` 相匹配。
- 将 `api_key` 设置为任何非空字符串（vLLM 需要此头部但默认不验证）。
- 在 `base_url` 中**不要**包含末尾斜杠。
:::

### 独立 Docker 运行（无 Compose）

如果您的推理服务器直接在宿主机上运行（不在 Docker 中），在 macOS/Windows 上使用 `host.docker.internal`，在 Linux 上使用 `--network host`：

**macOS / Windows：**

```sh
docker run -d \
  --name hermes \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  nousresearch/hermes-agent gateway run
```

```yaml
# config.yaml
model:
  provider: custom
  model: my-model
  base_url: http://host.docker.internal:8000/v1
  api_key: "none"
```

**Linux（宿主网络）：**

```sh
docker run -d \
  --name hermes \
  --network host \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

```yaml
# config.yaml
model:
  provider: custom
  model: my-model
  base_url: http://127.0.0.1:8000/v1
  api_key: "none"
```

:::warning 使用 `--network host` 时，`-p` 标志将被忽略 —— 所有容器端口将直接暴露在宿主机上。
:::

### 验证连接性

从 Hermes 容器内部，确认推理服务器可达：

```sh
docker exec hermes curl -s http://vllm:8000/v1/models
```

您应该会看到一个 JSON 响应，列出您提供的模型。如果此操作失败，请检查：

1.  两个容器在同一个 Docker 网络上（`docker network inspect hermes-net`）
2.  推理服务器监听 `0.0.0.0`，而不是 `127.0.0.1`
3.  端口号匹配

### Ollama

Ollama 的工作方式相同。如果 Ollama 在宿主机上运行，使用 `host.docker.internal:11434`（macOS/Windows）或 `127.0.0.1:11434`（使用 `--network host` 的 Linux）。如果 Ollama 在同一个 Docker 网络上的自己的容器中运行：

```yaml
model:
  provider: custom
  model: llama3
  base_url: http://ollama:11434/v1
  api_key: "none"
```

## 故障排除

### 容器立即退出

检查日志：`docker logs hermes`。常见原因：
- 缺少或无效的 `.env` 文件 —— 请先交互式运行以完成设置
- 如果运行时暴露端口，则存在端口冲突

### “Permission denied” 错误

容器的 stage2 钩子通过 `s6-setuidgid` 在每个受监督的服务内部将权限降级为非 root 的 `hermes` 用户（UID 10000）。如果你的宿主机 `~/.hermes/` 由不同的 UID 拥有，请设置 `HERMES_UID`/`HERMES_GID`（或其别名 `PUID`/`PGID`，以与 LinuxServer.io 和 NAS 镜像保持一致）以匹配你的宿主机用户，或者确保数据目录可写：

```sh
chmod -R 755 ~/.hermes
```

在 NAS（UGOS、Synology、unRAID）上，数据目录通常是一个**绑定挂载**，由容器无法 `chown` 的宿主机 UID 拥有。设置 `PUID`/`PGID`（或 `HERMES_UID`/`HERMES_GID`）为该宿主机用户，以便运行时作为挂载点的所有者运行，而不是作为 UID 10000：

```sh
docker run -d \
  --name hermes \
  -e PUID=1000 -e PGID=10 \
  -v /volume1/docker/hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

`docker exec hermes <命令>` 也会自动降级到 UID 10000 —— 详见 [`docker exec` 自动降级到 `hermes` 用户](#docker-exec-automatically-drops-to-the-hermes-user) 以了解详情和每次调用的禁用方法。

### 浏览器工具不工作

Playwright 需要共享内存。在你的 Docker run 命令中添加 `--shm-size=1g`：

```sh
docker run -d \
  --name hermes \
  --shm-size=1g \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

### 网关在出现网络问题后无法重新连接

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