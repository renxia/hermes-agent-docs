---
sidebar_position: 7
title: "Docker"
description: "在 Docker 中运行 Hermes 智能体，并将 Docker 用作终端后端"
---

# Hermes 智能体 — Docker

Docker 与 Hermes 智能体有两种不同的交互方式：

1. **在 Docker 中运行 Hermes** — 智能体本身运行在一个容器内（本页面的主要关注点）
2. **将 Docker 用作终端后端** — 智能体运行在宿主机上，但每个命令都在一个单独的、持久的 Docker 沙箱容器中执行，该容器在整个 Hermes 进程生命周期内（包括工具调用、`/new` 和子智能体）持续存在（参见 [配置 → Docker 后端](./configuration.md#docker-backend)）

本页面介绍的是选项 1。容器将所有用户数据（配置、API 密钥、会话、技能、记忆）存储在一个从宿主机挂载到 `/opt/data` 的目录中。镜像本身是无状态的，可以通过拉取新版本进行升级，而不会丢失任何配置。

## 快速开始

如果您是首次运行 Hermes 智能体，请在宿主机上创建一个数据目录，并以交互方式启动容器以运行设置向导：

```sh
mkdir -p ~/.hermes
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent setup
```

这将带您进入设置向导，向导会提示您输入 API 密钥，并将其写入 `~/.hermes/.env`。您只需执行此操作一次。强烈建议此时为网关设置一个聊天系统以使其正常工作。

## 以网关模式运行

配置完成后，在后台运行容器，将其作为持久化网关（Telegram、Discord、Slack、WhatsApp 等）：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  nousresearch/hermes-agent gateway run
```

端口 8642 用于暴露网关的 [OpenAI 兼容 API 服务器](./features/api-server.md) 和健康检查端点。如果你仅使用聊天平台（如 Telegram、Discord 等），则该端口是可选的；但如果你希望仪表板或外部工具能够访问网关，则必须开放此端口。

注意：API 服务器受 `API_SERVER_ENABLED=true` 控制。若要在容器内部将服务暴露到 `127.0.0.1` 以外的地址，请同时设置 `API_SERVER_HOST=0.0.0.0` 和一个 `API_SERVER_KEY`（至少 8 个字符 —— 可使用 `openssl rand -hex 32` 生成）。示例如下：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  -e API_SERVER_ENABLED=true \
  -e API_SERVER_HOST=0.0.0.0 \
  -e API_SERVER_KEY=your_api_key_here \
  -e API_SERVER_CORS_ORIGINS='*' \
  nousresearch/hermes-agent gateway run
```

在互联网可访问的机器上开放任何端口都存在安全风险。除非你理解相关风险，否则不应这样做。

## 运行仪表板

内置的 Web 仪表板作为可选的辅助进程，在与网关相同的容器内运行。设置 `HERMES_DASHBOARD=1` 并开放端口 `9119`，与网关的 `8642` 端口一起使用：

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

入口点脚本会先在后台启动 `hermes dashboard`（以非 root 用户 `hermes` 身份运行），然后再执行主命令。在 `docker logs` 中，仪表板的输出会带有 `[dashboard]` 前缀，便于与网关日志区分。

| 环境变量 | 说明 | 默认值 |
|---------------------|-------------|---------|
| `HERMES_DASHBOARD` | 设为 `1`（或 `true` / `yes`）以在主命令旁启动仪表板 | *（未设置 —— 不启动仪表板）* |
| `HERMES_DASHBOARD_HOST` | 仪表板 HTTP 服务器的绑定地址 | `0.0.0.0` |
| `HERMES_DASHBOARD_PORT` | 仪表板 HTTP 服务器的端口 | `9119` |
| `HERMES_DASHBOARD_TUI` | 设为 `1` 以启用浏览器内嵌的聊天标签页（通过 PTY/WebSocket 嵌入 `hermes --tui`） | *（未设置）* |

默认的 `HERMES_DASHBOARD_HOST=0.0.0.0` 是主机通过发布端口访问仪表板所必需的；在这种情况下，入口点脚本会自动向 `hermes dashboard` 传递 `--insecure` 参数。如果你希望将仪表板限制为仅容器内部访问（例如在 sidecar 模式的反向代理后），可将其覆盖为 `127.0.0.1`。

:::note
仪表板辅助进程**不受监督** —— 如果它崩溃，将保持停止状态，直到容器重启。不支持将其作为独立容器运行：仪表板的网关存活检测需要与网关进程共享 PID 命名空间。
:::

## 交互式运行（CLI 聊天）

要对正在运行的数据目录打开交互式聊天会话：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent
```

或者，如果你已经通过（例如 Docker Desktop）在运行的容器中打开了终端，只需运行：

```sh
/opt/hermes/.venv/bin/hermes
```

## 持久化卷

`/opt/data` 卷是 Hermes 所有状态的唯一真实来源。它映射到主机上的 `~/.hermes/` 目录，并包含以下内容：

| 路径 | 内容 |
|------|----------|
| `.env` | API 密钥和机密信息 |
| `config.yaml` | 所有 Hermes 配置 |
| `SOUL.md` | 智能体人格/身份 |
| `sessions/` | 对话历史 |
| `memories/` | 持久化记忆存储 |
| `skills/` | 已安装技能 |
| `cron/` | 定时任务定义 |
| `hooks/` | 事件钩子 |
| `logs/` | 运行时日志 |
| `skins/` | 自定义 CLI 皮肤 |

:::warning
切勿同时针对同一数据目录运行两个 Hermes **网关**容器 —— 会话文件和记忆存储并非为并发写入而设计。
:::

## 多配置文件支持

Hermes 支持[多个配置文件](../reference/profile-commands.md) —— 即独立的 `~/.hermes/` 目录，允许你从单个安装中运行多个独立的智能体（不同的 SOUL、技能、记忆、会话、凭据）。**在 Docker 下运行时，不建议使用 Hermes 内置的多配置文件功能。**

相反，推荐的模式是**每个配置文件使用一个容器**，每个容器将其自己的主机目录绑定挂载为 `/opt/data`：

```sh
# 工作配置文件
docker run -d \
  --name hermes-work \
  --restart unless-stopped \
  -v ~/.hermes-work:/opt/data \
  -p 8642:8642 \
  nousresearch/hermes-agent gateway run

# 个人配置文件
docker run -d \
  --name hermes-personal \
  --restart unless-stopped \
  -v ~/.hermes-personal:/opt/data \
  -p 8643:8642 \
  nousresearch/hermes-agent gateway run
```

为何在 Docker 中选择独立容器而非配置文件：

- **隔离性** —— 每个容器拥有独立的文件系统、进程表和资源限制。一个配置文件中的崩溃、依赖变更或失控会话不会影响其他配置文件。
- **独立生命周期** —— 可分别升级、重启、暂停或回滚每个智能体（`docker restart hermes-work` 不会影响 `hermes-personal`）。
- **清晰的端口和网络分离** —— 每个网关绑定自己的主机端口；不存在聊天平台或 API 服务器之间的串扰风险。
- **更简单的思维模型** —— 容器即配置文件。备份、迁移和权限管理均遵循绑定挂载的目录，无需记忆额外的 `--profile` 标志。
- **避免并发写入风险** —— 上述关于切勿对同一数据目录运行两个网关的警告同样适用于单个容器内的多个配置文件。

在 Docker Compose 中，只需为每个配置文件声明一个服务，并指定不同的 `container_name`、`volumes` 和 `ports`：

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

## 环境变量转发

API 密钥从容器内的 `/opt/data/.env` 文件中读取。你也可以直接传递环境变量：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -e OPENAI_API_KEY="sk-..." \
  nousresearch/hermes-agent
```

直接的 `-e` 标志会覆盖 `.env` 文件中的值。这在 CI/CD 或密钥管理器集成中非常有用，可以避免将密钥存储在磁盘上。

## Docker Compose 示例

对于同时运行网关和仪表板的持久化部署，使用 `docker-compose.yaml` 非常方便：

```yaml
services:
  hermes:
    image: nousresearch/hermes-agent:latest
    container_name: hermes
    restart: unless-stopped
    command: gateway run
    ports:
      - "8642:8642"   # 网关 API
      - "9119:9119"   # 仪表板（仅在 HERMES_DASHBOARD=1 时可访问）
    volumes:
      - ~/.hermes:/opt/data
    environment:
      - HERMES_DASHBOARD=1
      # 取消注释以转发特定环境变量，而非使用 .env 文件：
      # - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      # - OPENAI_API_KEY=${OPENAI_API_KEY}
      # - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"
```

使用 `docker compose up -d` 启动，并使用 `docker compose logs -f` 查看日志。仪表板输出带有 `[dashboard]` 前缀，便于从网关日志中过滤。

## 资源限制

Hermes 容器需要适度的资源。建议最低配置：

| 资源 | 最低要求 | 推荐配置 |
|----------|---------|-------------|
| 内存 | 1 GB | 2–4 GB |
| CPU | 1 核 | 2 核 |
| 磁盘（数据卷） | 500 MB | 2+ GB（随会话/技能增长） |

浏览器自动化（Playwright/Chromium）是最消耗内存的功能。如果你不需要浏览器工具，1 GB 内存足够。启用浏览器工具时，请至少分配 2 GB 内存。

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

- 安装了所有 Hermes 依赖的 Python 3（`uv pip install -e ".[all]"`）
- Node.js + npm（用于浏览器自动化和 WhatsApp 桥接）
- 安装了 Chromium 的 Playwright（`npx playwright install --with-deps chromium --only-shell`）
- ripgrep、ffmpeg、git 和 tini 作为系统工具
- **`docker-cli`** —— 使容器内运行的智能体能够驱动主机的 Docker 守护进程（绑定挂载 `/var/run/docker.sock` 以启用），用于 `docker build`、`docker run`、容器检查等操作
- **`openssh-client`** —— 支持从容器内部使用 [SSH 终端后端](/docs/user-guide/configuration#ssh-backend)。SSH 后端会调用系统的 `ssh` 二进制文件；若无此组件，容器化安装中将静默失败
- WhatsApp 桥接（`scripts/whatsapp-bridge/`）

入口点脚本（`docker/entrypoint.sh`）在首次运行时初始化数据卷：
- 创建目录结构（`sessions/`、`memories/`、`skills/` 等）
- 如果不存在 `.env` 文件，则复制 `.env.example` → `.env`
- 如果缺少默认的 `config.yaml`，则复制
- 如果缺少默认的 `SOUL.md`，则复制
- 使用基于清单的方式同步捆绑技能（保留用户编辑）
- 当 `HERMES_DASHBOARD=1` 时，可选择性地在后台作为辅助进程启动 `hermes dashboard`（参见[运行仪表板](#running-the-dashboard)）
- 然后使用你传递的任何参数运行 `hermes`

:::warning
除非你在命令链中保留 `/opt/hermes/docker/entrypoint.sh`，否则不要覆盖镜像的入口点。入口点会在创建网关状态文件之前将 root 权限降级为 `hermes` 用户。默认情况下，禁止在官方镜像中以 root 身份启动 `hermes gateway run`，因为这可能导致 `/opt/data` 中遗留 root 拥有的文件，从而破坏后续的仪表板或网关启动。仅当你明确接受该风险时，才设置 `HERMES_ALLOW_ROOT_GATEWAY=1`。
:::

## 升级

拉取最新镜像并重新创建容器。您的数据目录将保持不变。

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

## 技能文件和凭据文件

当使用 Docker 作为执行环境时（不是上述方法，而是当智能体在 Docker 沙箱内运行命令时 — 参见[配置 → Docker 后端](./configuration.md#docker-backend)），Hermes 会为所有工具调用重用一个长期运行的容器，并自动将技能目录（`~/.hermes/skills/`）以及技能声明的任何凭据文件以只读卷的形式绑定挂载到该容器中。技能脚本、模板和引用在沙箱内无需手动配置即可使用，并且由于容器在 Hermes 进程的整个生命周期内持续存在，您安装的任何依赖项或写入的文件都会在下次工具调用时保留。

SSH 和 Modal 后端也会发生相同的同步操作 — 技能文件和凭据文件会在每次命令执行前通过 rsync 或 Modal 挂载 API 上传。

## 连接到本地推理服务器（vLLM、Ollama 等）

当在 Docker 中运行 Hermes 且您的推理服务器（vLLM、Ollama、text-generation-inference 等）也在主机上或另一个容器中运行时，网络连接需要特别注意。

### Docker Compose（推荐）

将两个服务放在同一个 Docker 网络中。这是最可靠的方法：

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

然后在您的 `~/.hermes/config.yaml` 中，使用**容器名称**作为主机名：

```yaml
model:
  provider: custom
  model: my-model
  base_url: http://vllm:8000/v1
  api_key: "none"
```

:::tip 要点
- 使用**容器名称**（`vllm`）作为主机名 — 而不是 `localhost` 或 `127.0.0.1`，它们指的是 Hermes 容器本身。
- `model` 值必须与您传递给 vLLM 的 `--served-model-name` 匹配。
- 将 `api_key` 设置为任何非空字符串（vLLM 需要该头部，但默认情况下不会验证它）。
- **不要**在 `base_url` 中包含尾随斜杠。
:::

### 独立 Docker 运行（不使用 Compose）

如果您的推理服务器直接在主机上运行（不在 Docker 中），请在 macOS/Windows 上使用 `host.docker.internal`，或在 Linux 上使用 `--network host`：

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

**Linux（主机网络）：**

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

:::warning 使用 `--network host` 时，`-p` 标志将被忽略 — 所有容器端口都会直接暴露在主机上。
:::

### 验证连接性

从 Hermes 容器内部确认推理服务器是否可达：

```sh
docker exec hermes curl -s http://vllm:8000/v1/models
```

您应该会看到一个列出您提供模型的 JSON 响应。如果失败，请检查：

1. 两个容器是否在同一个 Docker 网络中（`docker network inspect hermes-net`）
2. 推理服务器是否在 `0.0.0.0` 上监听，而不是 `127.0.0.1`
3. 端口号是否匹配

### Ollama

Ollama 的工作方式相同。如果 Ollama 在主机上运行，请使用 `host.docker.internal:11434`（macOS/Windows）或 `127.0.0.1:11434`（Linux 配合 `--network host`）。如果 Ollama 在其自己的容器中运行，并且与 Hermes 在同一个 Docker 网络中：

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
- 缺少或无效的 `.env` 文件 — 首先以交互模式运行以完成设置
- 如果运行时有暴露端口，则可能存在端口冲突

### “权限被拒绝”错误

容器的入口点通过 `gosu` 将权限降级为非 root 用户 `hermes`（UID 10000）。如果您的主机 `~/.hermes/` 目录由不同的 UID 拥有，请设置 `HERMES_UID`/`HERMES_GID` 以匹配您的主机用户，或确保数据目录可写：

```sh
chmod -R 755 ~/.hermes
```

### 浏览器工具不工作

Playwright 需要共享内存。请在您的 Docker 运行命令中添加 `--shm-size=1g`：

```sh
docker run -d \
  --name hermes \
  --shm-size=1g \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

### 网关在网络问题后无法重新连接

`--restart unless-stopped` 标志会处理大多数瞬时故障。如果网关卡住，请重启容器：

```sh
docker restart hermes
```

### 检查容器健康状况

```sh
docker logs --tail 50 hermes          # 最近日志
docker run -it --rm nousresearch/hermes-agent:latest version     # 验证版本
docker stats hermes                    # 资源使用情况
```