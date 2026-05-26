---
sidebar_position: 7
title: "Docker"
description: "在 Docker 中运行 Hermes 智能体，并将 Docker 用作终端后端"
---

# Hermes 智能体 — Docker

Docker 与 Hermes 智能体的结合主要有两种方式：

1. **在 Docker 内运行 Hermes** — 智能体本身运行在一个容器中（这是本页的主要焦点）
2. **Docker 作为终端后端** — 智能体运行在您的宿主机上，但每个命令都在一个单一的、持久的 Docker 沙盒容器内执行。这个容器会在智能体生命周期内的工具调用、`/new` 操作和子智能体之间持续存在（详见 [配置 → Docker 后端](./configuration.md#docker-backend)）

本页介绍第 1 种方式。容器将所有用户数据（配置、API 密钥、会话、技能、记忆）存储在从宿主机挂载到 `/opt/data` 的单个目录中。镜像本身是无状态的，可以通过拉取新版本进行升级，而不会丢失任何配置。

## 快速开始

如果这是您第一次运行 Hermes 智能体，请在宿主机上创建一个数据目录，并以交互方式启动容器来运行设置向导：

```sh
mkdir -p ~/.hermes
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent setup
```

这将引导您进入设置向导，它会提示您输入 API 密钥，并将其写入 `~/.hermes/.env`。您只需执行此操作一次。强烈建议在此时为网关设置一个聊天系统以便正常工作。

## 以网关模式运行

配置完成后，在后台将容器作为持久化网关运行（支持 Telegram、Discord、Slack、WhatsApp 等）：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  nousresearch/hermes-agent gateway run
```

端口 8642 暴露了网关的 [OpenAI 兼容 API 服务器](./features/api-server.md) 和健康检查端点。如果你只使用聊天平台（Telegram、Discord 等），它是可选的；但如果你希望仪表盘或外部工具能够访问网关，则必须使用此端口。

注意：API 服务器受 `API_SERVER_ENABLED=true` 控制。若要将其暴露到容器内部的 `127.0.0.1` 之外，还需设置 `API_SERVER_HOST=0.0.0.0` 和一个 `API_SERVER_KEY`（最少 8 个字符——可以用 `openssl rand -hex 32` 生成）。示例：

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

在面向互联网的机器上开放任何端口都存在安全风险。除非你了解相关风险，否则不应这样做。

## 运行仪表盘

内置的 Web 仪表盘作为网关同一容器内的可选侧进程运行。设置 `HERMES_DASHBOARD=1` 即可在容器回环地址（`127.0.0.1`）上默认运行仪表盘：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  -e HERMES_DASHBOARD=1 \
  nousresearch/hermes-agent gateway run
```

入口脚本会在 `exec` 执行主命令之前，以后台方式（以非 root 的 `hermes` 用户身份）启动 `hermes dashboard`。仪表盘的输出在 `docker logs` 中以 `[dashboard]` 为前缀，便于与网关日志区分开。

| 环境变量 | 描述 | 默认值 |
|---------------------|-------------|---------|
| `HERMES_DASHBOARD` | 设置为 `1`（或 `true` / `yes`）可在启动主命令的同时启动仪表盘 | *（未设置——不启动仪表盘）* |
| `HERMES_DASHBOARD_HOST` | 仪表盘 HTTP 服务器的绑定地址 | `127.0.0.1` |
| `HERMES_DASHBOARD_PORT` | 仪表盘 HTTP 服务器的端口 | `9119` |
| `HERMES_DASHBOARD_TUI` | 设置为 `1` 可在浏览器中暴露 Chat 标签页（通过 PTY/WebSocket 嵌入的 `hermes --tui`） | *（未设置）* |

默认情况下，仪表盘保持在回环地址上，以避免将未经身份验证的 Web 界面暴露在网络上。若需有意发布它，请设置 `HERMES_DASHBOARD_HOST=0.0.0.0` 并配置你自己的可信网络边界/反向代理。这种情况下，你必须通过在命令路径中传递主机/标志来显式添加 `--insecure` 行为（入口脚本不再自动启用不安全模式）。

:::note
仪表盘作为容器内受监管的 s6 服务运行。如果
仪表盘进程崩溃，s6-overlay 会在短暂退避后自动重启它——你会看到一个新 PID，
无需重启容器。日志和崩溃输出可通过
`docker logs <container>` 查看（s6 将服务的 stdout/stderr 转发到那里）。

不支持将仪表盘作为单独容器运行：其
网关活性检测需要与网关进程共享 PID 命名空间。
:::

## 交互式运行（CLI 聊天）

要对正在运行的数据目录打开一个交互式聊天会话：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent
```

或者，如果你已经在运行的容器中打开了一个终端（例如通过 Docker Desktop），只需运行：

```sh
/opt/hermes/.venv/bin/hermes
```

## 持久化卷

`/opt/data` 卷是所有 Hermes 状态的唯一真实来源。它映射到主机的 `~/.hermes/` 目录，并包含：

| 路径 | 内容 |
|------|----------|
| `.env` | API 密钥和秘密 |
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
切勿同时运行两个 Hermes **网关**容器指向同一个数据目录——会话文件和记忆存储不设计用于并发写入访问。
:::

## 多配置文件支持

Hermes 支持[多个配置文件](../reference/profile-commands.md)——独立的 `~/.hermes/` 目录，允许你从单一安装运行独立的智能体（不同的 SOUL、技能、记忆、会话、凭据）。**在 Docker 下运行时，不建议使用 Hermes 内置的多配置文件功能。**

推荐的做法是 **每个配置文件一个容器**，每个容器将其各自的主机目录绑定挂载为 `/opt/data`：

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

在 Docker 中使用独立容器而非配置文件的原因：

- **隔离性** —— 每个容器拥有自己的文件系统、进程表和资源限制。一个配置文件中的崩溃、依赖更改或失控会话不会影响另一个。
- **独立生命周期** —— 可以单独升级、重启、暂停或回滚每个智能体（`docker restart hermes-work` 不会触及 `hermes-personal`）。
- **干净的端口和网络分离** —— 每个网关绑定自己的主机端口；不存在聊天平台或 API 服务器之间串扰的风险。
- **更简单的思维模型** —— 容器 *就是* 配置文件。备份、迁移和权限都遵循绑定挂载的目录，无需记住额外的 `--profile` 标志。
- **避免并发写入风险** —— 上面关于永远不要对同一数据目录运行两个网关的警告，同样适用于单个容器内的配置文件。

在 Docker Compose 中，这意味着为每个配置文件声明一个服务，并指定不同的 `container_name`、`volumes` 和 `ports`：

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

API 密钥从容器内的 `/opt/data/.env` 读取。你也可以直接传递环境变量：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -e OPENAI_API_KEY="sk-..." \
  nousresearch/hermes-agent
```

直接的 `-e` 标志会覆盖 `.env` 文件中的值。这对于 CI/CD 或密钥管理器集成很有用，在这些场景中你不希望密钥存在于磁盘上。

:::note 寻找 Docker 作为 **终端后端**？
本页面介绍如何在 Docker 内运行 Hermes 本身。如果你希望 Hermes 在 Docker 沙箱容器内执行智能体的 `terminal` / `execute_code` 调用（每个 Hermes 进程对应一个持久化容器），那是单独的配置部分——`terminal.backend: docker` 加上 `terminal.docker_image`、`terminal.docker_volumes`、`terminal.docker_forward_env`、`terminal.docker_run_as_host_user` 和 `terminal.docker_extra_args`。有关完整设置，请参见 [配置 → Docker 后端](configuration.md#docker-backend)。
:::

## Docker Compose 示例

对于同时包含网关和仪表盘的持久化部署，使用 `docker-compose.yaml` 很方便：

```yaml
services:
  hermes:
    image: nousresearch/hermes-agent:latest
    container_name: hermes
    restart: unless-stopped
    command: gateway run
    ports:
      - "8642:8642"   # 网关 API
      - "9119:9119"   # 仪表盘（仅在 HERMES_DASHBOARD=1 时可达）
    volumes:
      - ~/.hermes:/opt/data
    environment:
      - HERMES_DASHBOARD=1
      # 取消注释以转发特定环境变量，而不是使用 .env 文件：
      # - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      # - OPENAI_API_KEY=${OPENAI_API_KEY}
      # - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"
```

使用 `docker compose up -d` 启动，并通过 `docker compose logs -f` 查看日志。仪表盘输出带有 `[dashboard]` 前缀，便于从网关日志中过滤出来。

## 资源限制

Hermes 容器需要适度的资源。建议最低配置如下：

| 资源       | 最低要求 | 推荐配置   |
|------------|----------|------------|
| 内存       | 1 GB     | 2–4 GB     |
| CPU        | 1 核     | 2 核       |
| 磁盘（数据卷） | 500 MB   | 2+ GB（随会话/技能增长） |

浏览器自动化（Playwright/Chromium）是内存消耗最大的功能。如果您不需要浏览器工具，1 GB 就足够了。如果启用浏览器工具，请至少分配 2 GB。

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

官方镜像基于 `debian:13.4`，包含以下内容：

- Python 3 及所有 Hermes 依赖项（`uv pip install -e ".[all]"`）
- Node.js + npm（用于浏览器自动化和 WhatsApp 桥接）
- 带有 Chromium 的 Playwright（`npx playwright install --with-deps chromium --only-shell`）
- 系统工具：ripgrep、ffmpeg、git 和 `xz-utils`
- **`docker-cli`** — 以便容器内运行的智能体可以驱动宿主机的 Docker 守护进程（绑定挂载 `/var/run/docker.sock` 以启用）用于 `docker build`、`docker run`、容器检查等操作。
- **`openssh-client`** — 启用容器内的 [SSH 终端后端](/user-guide/configuration#ssh-backend)。SSH 后端调用系统 `ssh` 二进制文件；没有它，在容器化安装中会静默失败。
- WhatsApp 桥接（`scripts/whatsapp-bridge/`）
- **[`s6-overlay`](https://github.com/just-containers/s6-overlay) v3** 作为 PID 1（替代旧的 `tini`）— 监督仪表板和按配置文件划分的网关，在崩溃时自动重启，回收僵尸子进程，并转发信号。

容器的 `ENTRYPOINT` 是 s6-overlay 的 `/init`。启动时它会：
1. 以 root 身份运行 `/etc/cont-init.d/01-hermes-setup`（即 `docker/stage2-hook.sh`）：可选的 UID/GID 重映射，修复卷所有权，首次启动时生成 `.env` / `config.yaml` / `SOUL.md`，同步打包的技能。
2. 运行 `/etc/cont-init.d/02-reconcile-profiles`（即 `hermes_cli.container_boot`）：遍历 `$HERMES_HOME/profiles/<name>/`，在 `/run/service/gateway-<profile>/` 下重新创建按配置文件划分的网关 s6 服务插槽，并且仅自动启动那些最后记录状态为 `running` 的（参见 [按配置文件划分的网关监督](#per-profile-gateway-supervision)）。
3. 启动静态的 `main-hermes` 和 `dashboard` s6-rc 服务。
4. 将容器的 CMD 作为主程序执行（`/opt/hermes/docker/main-wrapper.sh`），它将路由用户传递给 `docker run` 的参数：
   - 无参数 → `hermes`（默认）
   - 第一个参数是 PATH 上的可执行文件（例如 `sleep`、`bash`）→ 直接执行它
   - 其他任何参数 → `hermes <args>`（子命令透传）
   当主程序退出时，容器随之退出，并带有其退出代码。

:::warning 与 pre-s6 镜像相比的破坏性变更
容器 ENTRYPOINT 现在是 `/init`（s6-overlay），而不是 `/usr/bin/tini`。所有五种已记录的 `docker run` 调用模式（无参数、`chat -q "…"`、`sleep infinity`、`bash`、`--tui`）的行为与基于 tini 的镜像完全相同。如果您有依赖于 tini 特定信号行为或硬编码 `/usr/bin/tini --` 调用的下游包装器，请固定到之前的镜像标签。
:::

:::warning 权限模型
除非您在命令链中保留 `/init`（或者等效地，转发到第二阶段钩子的旧版 `docker/entrypoint.sh` 否则不要覆盖镜像入口点。s6-overlay 的 `/init` 以 root 身份运行，以便在首次启动时 chown 卷，然后通过 `s6-setuidgid` 为每个监督服务以及主程序降级到 `hermes` 用户。在官方镜像中以 root 身份启动 `hermes gateway run` 默认会被拒绝，因为它可能在 `/opt/data` 中留下 root 拥有的文件，并破坏后续仪表板或网关的启动。仅当您有意识地接受该风险时，才设置 `HERMES_ALLOW_ROOT_GATEWAY=1`。
:::

### 按配置文件划分的网关监督

在容器内部，使用 `hermes profile create <name>` 创建的每个配置文件会自动获得一个在 `/run/service/gateway-<name>/` 注册的 s6 监督网关服务。您在宿主机上运行的生命周期命令工作方式相同：

```sh
hermes profile create coder            # 注册 gateway-coder s6 插槽
hermes -p coder gateway start          # s6-svc -u  → 受监督的网关
hermes -p coder gateway stop           # s6-svc -d  → 服务停止
hermes -p coder gateway restart        # s6-svc -t  → 向监督进程发送 SIGTERM
hermes profile delete coder            # 拆除 s6 插槽
```

**与 pre-s6 镜像相比的监督优势：**

- 网关崩溃由 `s6-supervise` 在约 1 秒退避后自动重启。
- 仪表板崩溃会自动重启（设置 `HERMES_DASHBOARD=1` 以启动它）。
- `docker restart` 会保留正在运行的网关：容器初始化协调器读取 `$HERMES_HOME/profiles/<name>/gateway_state.json`，如果最后记录的状态是 `running`，则重新启动该插槽。停止的网关保持停止状态。
- 按配置文件划分的网关日志持久保存在 `$HERMES_HOME/logs/gateways/<profile>/current`（由 `s6-log` 轮转），协调器的操作会在每次启动时追加到 `$HERMES_HOME/logs/container-boot.log`。

容器内的 `hermes status` 会报告 `Manager: s6 (container supervisor)`。使用 `/command/s6-svstat /run/service/gateway-<name>` 查看原始监督进程视图（注意 `/command/` 仅在监督树进程的 PATH 中；通过 `docker exec` 调用时请传递绝对路径）。

## 升级

拉取最新镜像并重建容器。您的数据目录不受影响。

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

当使用 Docker 作为执行环境时（不是上述方法，而是当智能体在 Docker 沙箱内运行命令时——参见 [配置 → Docker 后端](./configuration.md#docker-backend)），Hermes 会为所有工具调用复用一个长期运行的容器，并自动将技能目录 (`~/.hermes/skills/`) 以及技能声明的任何凭证文件作为只读卷绑定挂载到该容器中。技能脚本、模板和参考资料在沙箱内无需手动配置即可使用，并且由于容器在 Hermes 进程的生命周期内持续存在，您安装的任何依赖项或编写的任何文件都会保留到下一次工具调用时。

对于 SSH 和 Modal 后端也会进行同样的同步——技能和凭证文件在每次命令执行前会通过 rsync 或 Modal 挂载 API 上传。

## 在容器中安装更多工具

官方镜像附带了一组精选的实用工具（参见 [Dockerfile 的作用](#what-the-dockerfile-does)），但并非智能体可能需要的每个工具都已预安装。这里有五种推荐方法，按所需精力和持久性递增排序。

### npm 或 Python 工具 — 使用 `npx` 或 `uvx`

对于发布到 npm 或 PyPI 的任何工具，指示 Hermes 通过 `npx`（npm）或 `uvx`（Python）运行它，并在其持久化内存中记住该命令。如果工具需要配置文件或凭证，指示它将其放置在 `/opt/data` 下（例如 `/opt/data/<tool>/config.yaml`）。

依赖项按需获取，并在容器的生命周期内缓存。写入 `/opt/data` 下的配置在容器重启后依然存在，因为它位于绑定挂载的宿主机目录上。包缓存本身会在 `docker rm` 后重建，但 `npx` 和 `uvx` 会在下次工具运行时透明地重新获取。

### 其他工具（apt 包、二进制文件）— 安装并记住

对于 npm 或 PyPI 之外的任何内容 —— `apt` 包、预构建的二进制文件、镜像中尚未包含的语言运行时 —— 指示 Hermes 如何安装它（例如 `apt-get update && apt-get install -y <package>`），并告诉它记住安装命令。该工具将在容器的剩余生命周期内持续存在，并且 Hermes 在下次需要该工具时会在容器重启后重新运行安装命令。

这非常适合安装快速且偶尔使用的工具。对于频繁使用的工具，建议使用下一种方法。

### 持久化安装 — 构建派生镜像

当某个工具必须在每次容器启动时立即可用且没有重新安装延迟时，构建一个继承自 `nousresearch/hermes-agent` 的新镜像，并在某一层中安装该工具：

```dockerfile
FROM nousresearch/hermes-agent:latest

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends <your-package> \
    && rm -rf /var/lib/apt/lists/*
USER hermes
```

构建它并用其替代官方镜像使用：

```sh
docker build -t my-hermes:latest .
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  my-hermes:latest gateway run
```

入口点脚本和 `/opt/data` 语义保持不变，因此本页其余部分仍然适用。记得在拉取更新的上游 `nousresearch/hermes-agent` 时重新构建镜像。

### 复杂工具或多服务栈 — 运行 sidecar 容器

对于自带服务（数据库、Web 服务器、消息队列、无头浏览器集群）的工具，或者过于庞大而不适合存在于 Hermes 容器内的工具，请在共享的 Docker 网络上将它们作为单独的容器运行。Hermes 通过容器名称访问 sidecar，就像它访问本地推理服务器一样（参见 [连接本地推理服务器](#connecting-to-local-inference-servers-vllm-ollama-etc)）。

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

在 Hermes 容器内部，可以通过 `http://my-tool:<port>`（或其使用的任何协议）访问 sidecar。这种模式使得每个服务的生命周期、资源限制和升级节奏相互独立，并避免了因仅某个工具所需的依赖项而导致 Hermes 镜像臃肿。

### 广泛有用的工具 — 提交问题或拉取请求

如果某个工具可能对大多数 Hermes 智能体用户有用，请考虑将其贡献给上游，而不是将其保留在私有的派生镜像中。在 [hermes-agent 仓库](https://github.com/NousResearch/hermes-agent) 上提交一个问题或拉取请求，描述该工具及其用例。被纳入官方镜像的工具将惠及所有用户，并避免下游分支的维护开销。
## 连接本地推理服务器（vLLM、Ollama 等）

当在 Docker 中运行 Hermes 且您的推理服务器（vLLM、Ollama、text-generation-inference 等）也在宿主机上或另一个容器中运行时，网络连接需要特别注意。

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

然后在您的 `~/.hermes/config.yaml` 中，使用**容器名称**作为主机名：

```yaml
model:
  provider: custom
  model: my-model
  base_url: http://vllm:8000/v1
  api_key: "none"
```

:::tip 关键点
- 使用**容器名称** (`vllm`) 作为主机名 —— 而不是 `localhost` 或 `127.0.0.1`，它们指向 Hermes 容器自身。
- `model` 的值必须与您传递给 vLLM 的 `--served-model-name` 相匹配。
- 将 `api_key` 设置为任何非空字符串（vLLM 需要该头信息，但默认情况下不验证它）。
- 在 `base_url` 中**不要**包含尾部斜杠。
:::

### 独立 Docker 运行（无 Compose）

如果您的推理服务器直接在宿主机上运行（不在 Docker 中），在 macOS/Windows 上使用 `host.docker.internal`，或在 Linux 上使用 `--network host`：

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

**Linux（宿主机网络模式）：**

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

:::warning 使用 `--network host` 时，`-p` 标志会被忽略 —— 所有容器端口都会直接暴露在宿主机上。
:::

### 验证连接性

从 Hermes 容器内部，确认推理服务器可达：

```sh
docker exec hermes curl -s http://vllm:8000/v1/models
```

您应该看到一个 JSON 响应，其中列出了您提供的模型。如果失败，请检查：

1. 两个容器是否在同一个 Docker 网络上 (`docker network inspect hermes-net`)
2. 推理服务器是否监听 `0.0.0.0`，而不是 `127.0.0.1`
3. 端口号是否匹配

### Ollama

Ollama 的工作方式相同。如果 Ollama 运行在宿主机上，在 macOS/Windows 上使用 `host.docker.internal:11434`，或在 Linux（使用 `--network host`）上使用 `127.0.0.1:11434`。如果 Ollama 在同一个 Docker 网络上自己的容器中运行：

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
- 缺少或无效的 `.env` 文件 —— 请先以交互方式运行以完成设置
- 如果运行时暴露端口，可能存在端口冲突

### “权限被拒绝” 错误

容器的 stage2 钩子通过 `s6-setuidgid` 在每个受监督的服务内部将权限降级给非 root 用户 `hermes`（UID 10000）。如果您的宿主机 `~/.hermes/` 属于不同的 UID，请设置 `HERMES_UID`/`HERMES_GID` 以匹配您的宿主机用户，或确保数据目录可写：

```sh
chmod -R 755 ~/.hermes
```

### 浏览器工具不工作

Playwright 需要共享内存。在您的 Docker 运行命令中添加 `--shm-size=1g`：

```sh
docker run -d \
  --name hermes \
  --shm-size=1g \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

### 网关在网络问题后未重新连接

`--restart unless-stopped` 标志可处理大多数瞬时故障。如果网关卡住，请重启容器：

```sh
docker restart hermes
```

### 检查容器健康状态

```sh
docker logs --tail 50 hermes          # 最近日志
docker run -it --rm nousresearch/hermes-agent:latest version     # 验证版本
docker stats hermes                    # 资源使用情况
```