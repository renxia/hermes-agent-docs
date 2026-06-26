---
sidebar_position: 7
title: "Docker"
description: "Running Hermes Agent in Docker and using Docker as a terminal backend"
---

# Hermes Agent — Docker

Docker 与 Hermes 智能体有两种不同的交集方式：

1. **在 Docker 中运行 Hermes** — 智能体本身运行在容器内（本页主要关注点）
2. **Docker 作为终端后端** — 智能体运行在你的主机上，但所有命令都在一个单独的、持久化的 Docker 沙盒容器中执行，该容器在工具调用、`/new` 和子智能体的整个 Hermes 进程生命周期内持续存在（参见 [配置 → Docker 后端](./configuration.md#docker-backend)）

本页涵盖选项 1。容器将所有用户数据（配置、API 密钥、会话、技能、记忆）存储在主机挂载到 `/opt/data` 的单个目录中。镜像本身是无状态的，可以通过拉取新版本进行升级而不会丢失任何配置。

## 快速开始

如果这是你第一次运行 Hermes 智能体，请在主机上创建一个数据目录，然后以交互方式启动容器来运行设置向导：

:::caution 安装命令请避免使用基于浏览器的 VPS 控制台
部分 VPS 提供商（Hetzner Cloud 及其他一些提供商）提供基于浏览器的控制台用于管理主机。这些控制台在传输特殊字符时存在问题——`:` 可能被接收为 `;`，`@` 可能被错误渲染，非英语键盘布局的情况更糟——这会静默地破坏 `docker run` 参数，如 `-v ~/.hermes:/opt/data`、`-e KEY=value` 以及粘贴的 API 密钥/令牌。

**建议通过 SSH 连接**（`ssh root@<host>`）以确保复制粘贴的安全性。如果必须使用浏览器控制台，请手动输入命令而非粘贴，并在按回车前仔细检查结果中的每一个 `:`、`@`、`=` 和 `/`。
:::

```sh
mkdir -p ~/.hermes
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent setup
```

这将进入设置向导，提示你输入 API 密钥并将其写入 `~/.hermes/.env`。你只需要执行一次此操作。强烈建议此时为网关设置一个聊天系统。

:::tip
在容器内运行一次 `hermes setup --portal` — refresh token 会持久化存储在挂载的 `~/.hermes` 卷中。参见 [Nous Portal](/integrations/nous-portal)。
:::

## 以网关模式运行

配置完成后，将容器作为持久化网关（Telegram、Discord、Slack、WhatsApp 等）在后台运行：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  nousresearch/hermes-agent gateway run
```

端口 8642 暴露了网关的 [OpenAI 兼容 API 服务器](./features/api-server.md) 和健康检查端点。如果你只使用聊天平台（Telegram、Discord 等），它是可选的，但如果你希望仪表盘或外部工具访问网关，则是必需的。

:::tip 网关以受控方式运行
在官方 Docker 镜像中，`gateway run` **由 s6-overlay 自动监控**：如果网关进程崩溃，它会在几秒内自动重启而不会丢失容器，并且仪表盘（当设置了 `HERMES_DASHBOARD=1` 时）也受到一并监控。`gateway run` CMD 进程本身是一个 `sleep infinity` 心跳，保持容器存活，而 s6 管理实际的网关进程——因此 `docker stop` 仍然可以干净地关闭所有服务，而 `docker logs` 显示受控网关的输出。

你会在 `docker logs` 中看到一行确认升级的提示信息。若要选择退出——恢复历史上的"网关是容器主进程，容器退出 = 网关退出"语义——可传入 `--no-supervise` 或设置 `HERMES_GATEWAY_NO_SUPERVISE=1`。选择退出对于希望容器随网关状态码退出的 CI 烟雾测试很有用；对于生产部署，受控的默认行为明显更优。

此行为仅适用于基于 s6 的镜像。早期（基于 tini 的）镜像仍然将 `gateway run` 作为前台主进程运行。
:::

:::note 网关日志去向
完整路由映射（按配置文件网关、仪表盘、启动协调器、容器级 `docker logs`）请参见下文 [日志去向](#where-the-logs-go) 章节。
:::

:::note 无人值守网关的工具循环硬停止
`tool_loop_guardrails.hard_stop_enabled` 设置默认为 `false`，这对于交互式 CLI 和 TUI 会话是合理的，因为用户可以看到重复的工具调用警告。在无人值守的网关或服务器部署中，仅靠警告可能无法阻止陷入重复工具调用循环的智能体。需要熔断器行为的运营商应在配置文件的 `config.yaml` 中显式启用硬停止：

```yaml
tool_loop_guardrails:
  hard_stop_enabled: true
  hard_stop_after:
    exact_failure: 5
    idempotent_no_progress: 5
```
:::

注意：API 服务器的启用取决于 `API_SERVER_ENABLED=true`。要在容器内将其暴露到 `127.0.0.1` 之外，还需设置 `API_SERVER_HOST=0.0.0.0` 和 `API_SERVER_KEY`（至少 8 个字符——使用 `openssl rand -hex 32` 生成）。示例：

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

在面向公网的机器上开放任何端口都存在安全风险。除非你了解相关风险，否则不应这样做。

## 运行仪表盘

内置 Web 仪表盘作为受控的 s6-rc 服务与网关在同一容器中运行。设置 `HERMES_DASHBOARD=1` 来启动它：

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

仪表盘由 s6 监控——如果崩溃，`s6-supervise` 会在短暂退避后自动重启。仪表盘的 stdout/stderr 会转发到 `docker logs <container>`（无前缀；网关自身的输出现在存放在按配置文件划分的 s6-log 文件中——参见下文 [日志去向](#where-the-logs-go)——因此两个流不会冲突）。

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `HERMES_DASHBOARD` | 设为 `1`（或 `true` / `yes`）以启用受控仪表盘服务 | *(未设置——服务已注册但保持关闭)* |
| `HERMES_DASHBOARD_HOST` | 仪表盘 HTTP 服务器的绑定地址 | `0.0.0.0` |
| `HERMES_DASHBOARD_PORT` | 仪表盘 HTTP 服务器的端口 | `9119` |
| `HERMES_DASHBOARD_INSECURE` | **已弃用/无效。** 过去用于绕过认证门控；自 2026 年 6 月安全加固起不再禁用认证。非回环绑定始终需要认证提供方 | *(已忽略——请改为配置提供方)* |

容器内的仪表盘默认绑定 `0.0.0.0`——否则，已发布的 `-p 9119:9119` 端口将无法从宿主机访问。若需将绑定限制为容器回环地址（用于 Sidecar/反向代理场景），可设置 `HERMES_DASHBOARD_HOST=127.0.0.1`。

当以下两个条件同时满足时，仪表盘的认证门控自动启用：

1. 绑定主机为非回环地址（例如容器内的默认值 `0.0.0.0`），**且**
2. 已注册 `DashboardAuthProvider` 插件。

有三种内置方式满足第二个条件：

- **用户名/密码**——对于受信任网络或 VPN 后面的自托管/本地/家庭实验室容器最简单：设置 `HERMES_DASHBOARD_BASIC_AUTH_USERNAME` + `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD`（以及用于重启稳定会话的 `HERMES_DASHBOARD_BASIC_AUTH_SECRET`）。不适合直接暴露到公网。
- **OAuth（Nous Portal）**——用于托管/公开部署：当设置了 `HERMES_DASHBOARD_OAUTH_CLIENT_ID` 时，`dashboard_auth/nous` 提供方自动激活。
- **自托管 OIDC**——通过标准 OpenID Connect 对你的自有身份提供方进行认证：当设置了 `HERMES_DASHBOARD_OIDC_ISSUER` + `HERMES_DASHBOARD_OIDC_CLIENT_ID` 时，`dashboard_auth/self_hosted` 提供方激活。

无论选择哪种方式，门控都会在访问任何受保护路由之前将调用者重定向到登录页面。有关所有三种提供方的信息，请参见 [Web 仪表盘 → 认证](features/web-dashboard.md#authentication-gated-mode)。

如果未注册提供方且绑定为非回环地址，仪表盘**启动时会以特定错误提示缺失的环境变量而失败关闭**。不再有绕过方式可以在公共绑定上以未认证方式提供仪表盘：`HERMES_DASHBOARD_INSECURE=1` 现在是已弃用的无效设置（记录警告并忽略）。请配置提供方，或绑定 `HERMES_DASHBOARD_HOST=127.0.0.1` 并通过 SSH 隧道/Tailscale 访问仪表盘。

:::warning 为何移除 `--insecure`
未认证的公共仪表盘是 2026 年 6 月 MCP 配置持久化攻击活动的入口点：互联网扫描器访问了暴露的仪表盘（和 OpenAI API 服务器），驱使智能体植入 SSH 密钥后门。认证门控现在对每个非回环绑定都是强制性的。对于受信任的局域网/家庭实验室设备，内置的用户名/密码提供方（`HERMES_DASHBOARD_BASIC_AUTH_USERNAME` + `_PASSWORD`）是零基础设施的满足方式。
:::

将仪表盘作为独立容器运行**确实受支持**，前提是该容器共享宿主机的 PID 和网络命名空间（例如 `network_mode: host`，如仓库自身的 `docker-compose.yml` 所做——参见其 `dashboard` 服务）。其网关存活检测要求与网关进程共享 PID 命名空间，因此该限制仅适用于在没有共享 PID 命名空间的隔离桥接网络容器中运行的仪表盘。

## 交互式运行（CLI 聊天）

要打开针对已运行数据目录的交互式聊天会话：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent
```

或者，如果你已经打开了运行中容器的终端（例如通过 Docker Desktop），只需运行：

```sh
/opt/hermes/.venv/bin/hermes
```

## 持久化卷

`/opt/data` 卷是所有 Hermes 状态的唯一真实来源。它映射到宿主机的 `~/.hermes/` 目录，包含：

| 路径 | 内容 |
|------|------|
| `.env` | API 密钥和机密 |
| `config.yaml` | 所有 Hermes 配置 |
| `SOUL.md` | 智能体人格/身份 |
| `sessions/` | 对话历史 |
| `memories/` | 持久化记忆存储 |
| `skills/` | 已安装的技能 |
| `home/` | Hermes 工具子进程（`git`、`ssh`、`gh`、`npm` 和技能 CLI）的按配置文件 HOME |
| `cron/` | 计划任务定义 |
| `hooks/` | 事件钩子 |
| `logs/` | 运行时日志 |
| `skins/` | 自定义 CLI 皮肤 |

### 不可变安装树

在托管和发布的 Docker 镜像中，`/opt/hermes` 是已安装的应用程序树。它由 root 所有且对运行时 `hermes` 用户只读，因此智能体轮次、网关会话、仪表盘操作以及常规的 `docker exec hermes hermes ...` 命令都无法就地编辑核心源代码、捆绑的 `.venv`、`node_modules` 或 TUI 包。

所有可变 Hermes 状态都属于 `/opt/data`：配置、`.env`、配置文件、技能、记忆、会话、日志、仪表盘上传、插件以及其他用户管理的文件。镜像还禁用了运行时 `.pyc` 写入和 Hermes 惰性依赖安装到 `/opt/hermes`；发布镜像所需的平台依赖应烘焙到新镜像构建中。

在托管/发布镜像上，智能体的自我改进范围限定在 `/opt/data` 下的技能、记忆、插件和配置。`/opt/hermes` 下的已安装核心源代码是不可变的；核心更改通过仓库的 PR 完成，并通过更新镜像发布，而不是通过实时编辑运行中的安装。

如果运营商需要修复或检查 `/opt/data` 以外的文件，应有意识地使用 root shell。`hermes` 垫片通常会将 `docker exec hermes hermes ...` 降级回运行时用户；当你明确需要 root 语义时，可设置 `HERMES_DOCKER_EXEC_AS_ROOT=1` 进行一次性 root 调用。

在 `~` 下存储凭据的技能 CLI 必须针对子进程 HOME 进行初始化，而不仅仅是数据卷根目录。例如，[xurl 技能](./skills/bundled/social-media/social-media-xurl.md) 将 OAuth 状态存储在 `~/.xurl` 中；在官方 Docker 布局中，Hermes 工具调用将其读取为 `/opt/data/home/.xurl`，因此使用 `HOME=/opt/data/home` 运行手动 xurl 认证，并使用 `HOME=/opt/data/home xurl auth status` 验证。

:::
永远不要同时针对同一数据目录运行两个 Hermes **网关**容器——会话文件和记忆存储不支持并发写入访问。
:::

## 多配置文件支持

Hermes 支持[多配置文件](../reference/profile-commands.md)——独立的 `~/.hermes/` 子目录，让你可以在单一安装中运行相互独立的智能体（不同的 SOUL、技能、记忆、会话、凭据）。**在官方 Docker 镜像中，s6 监督树将每个配置文件视为一等公民的受监督服务**，因此推荐的部署方式是**一个容器承载所有配置文件**。

每个通过 `hermes profile create <name>` 创建的配置文件都会获得：

- 在 `/run/service/gateway-<name>/` 处获得一个专用的 s6 服务槽位，由运行时动态注册——无需重建容器。
- 崩溃时自动重启，由 `s6-supervise` 进行退避管理。
- 位于 `${HERMES_HOME}/logs/gateways/<name>/current` 的按配置文件轮转日志（10 个归档 × 每个 1 MB）。
- 跨容器重启的状态持久化：启动时协调器从每个配置文件目录读取 `gateway_state.json`，仅对上次记录状态为 `running` 的配置文件恢复槽位。只有你显式停止（`hermes gateway stop`）的网关才会在重启后保持停止状态——容器重启、镜像升级或意外退出会将记录状态保留为 `running`，因此网关会在下次启动时自动启动。

你在宿主机上使用的生命周期命令在容器内部同样适用：

```sh
# 创建配置文件——注册 gateway-<name> s6 槽位。
docker exec hermes hermes profile create coder

# 启动/停止/重启——分发到 s6-svc；网关生命周期在 docker 重启后依然存活。
docker exec hermes hermes -p coder gateway start
docker exec hermes hermes -p coder gateway stop
docker exec hermes hermes -p coder gateway restart

# 状态——在容器内报告 `Manager: s6 (container supervisor)`。
docker exec hermes hermes -p coder gateway status

# 删除配置文件——同时拆除 s6 槽位。
docker exec hermes hermes profile delete coder
```

在底层，容器内的 `hermes gateway start/stop/restart` 会被拦截并路由到针对正确服务目录的 `s6-svc`；你无需直接学习 s6 命令。如需查看原始监督器状态，可使用 `/command/s6-svstat /run/service/gateway-<name>`（注意 `/command/` 仅在监督树生成的进程的 PATH 中可用——当通过 `docker exec` 调用时，请传入绝对路径）。

### 从容器外部访问多个配置文件

从外部到达配置文件网关的两个不同入口，行为各不相同——不要混淆它们：

**Hermes Desktop（及 Web 仪表板）。** Desktop 应用的**远程网关**连接与 `hermes dashboard` 后端（默认**端口 9119**，由 `HERMES_DASHBOARD=1` 启用）通信——*而非* OpenAI API 服务器。一个 Dashboard 后端为**所有**并置的配置文件提供服务：应用的配置文件切换器在每次请求时发送目标配置文件，后端在磁盘上打开该配置文件的 `HERMES_HOME`。因此，对于 Desktop，你**不需要**为每个配置文件配置第二个端口——或第二个连接——一个 `:9119` 连接通过切换器即可覆盖所有配置文件。

**OpenAI 兼容 API 客户端（Open WebUI、LobeChat、`/v1/...`）。** 这些客户端与每个配置文件的 **API 服务器**通信，该服务器**在所有配置文件中绑定端口 8642**（从 `API_SERVER_PORT` / `platforms.api_server.extra.port` 解析——没有自动分配，也没有 `config.yaml`/`gateway.port` 键）。如果你想让客户端到达*特定的*第二个配置文件，需要在**它自己的** `.env` 中为该配置文件指定一个不同的 `API_SERVER_PORT`，否则它的网关也会尝试绑定 8642 并与默认配置文件冲突：

```sh
# 创建配置文件（注册其 gateway-<name> s6 槽位）
docker exec hermes hermes profile create work

# 将其 API 服务器指向一个可用端口（写入配置文件自己的 .env）
cat >> /opt/data/profiles/work/.env <<'EOF'
API_SERVER_ENABLED=true
API_SERVER_PORT=8643
EOF

docker exec hermes hermes -p work gateway restart
```

将 `API_SERVER_PORT` 保留在每个配置文件**自己的** `.env` 中，切勿放在容器级的 `environment:` 块中——全局值会强制所有配置文件使用同一端口，导致冲突。使用桥接网络时，在 `docker-compose.yml` 中发布额外端口（`- "8643:8643"`）；使用 `network_mode: host` 时，该端口已在宿主机上可达。默认配置文件的 8642 连接不受影响。

### 为什么使用一个容器承载多个配置文件，而非多个容器

在 s6 迁移之前，"每个配置文件一个容器"是推荐的模式，因为容器内没有监督器来管理多个网关。有了 s6 作为 PID 1 后，这已不再必要，且单容器布局在几乎所有维度上都更简单：

| | 一个容器，多个配置文件 | 每个配置文件一个容器 |
|---|---|---|
| 磁盘开销 | 一个镜像、一个捆绑的 venv、一个 Playwright 缓存 | N 个镜像 / N 个缓存 |
| 内存开销 | 共享的 Python 解释器缓存、共享的 node_modules | 每个容器重复 |
| 配置文件创建 | `docker exec ... hermes profile create <name>`（数秒） | 新的 `docker run` 调用 + 端口分配 + 绑定挂载配置 |
| 按配置文件崩溃恢复 | `s6-supervise` 自动重启 | Docker 的 `--restart unless-stopped`（更慢，会杀死同级工作） |
| 日志 | 通过 `s6-log` 的按配置文件轮转文件，加上容器启动审计日志 | 每个容器的 `docker logs <name>`——无内置轮转 |
| 备份 | 一个 `~/.hermes` 目录 | N 个需要协调的目录 |

默认配置文件（`default`）总是在首次启动时注册，因此新容器出厂即附带一个受监督的网关。其他配置文件纯属运行时添加。

### 何时确实需要单独的容器

配置文件内置于容器是默认方式。仅在你有特定原因时才为每个配置文件运行单独的容器：

- **按工作负载进行资源隔离**——例如，配置文件 A 中失控的浏览器工具会话不应导致配置文件 B 的 OOM。容器可以为你提供每个配置文件的 `--memory` / `--cpus`。
- **独立的镜像固定**——不同工作负载使用不同的上游镜像标签。
- **网络分段**——每个配置文件使用不同的 Docker 网络（例如，一个面向客户，一个内部使用）。
- **合规 / 爆炸半径**——不同的凭据绝不在 OS 级进程树中共享。

在这些情况下，为每个配置文件声明一个独立的服务，使用不同的 `container_name`、`volumes` 和 `ports`：

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

[持久化卷](#persistent-volumes)中的警告仍然适用：绝不要同时将两个容器指向同一个 `~/.hermes` 目录。每个容器内的 s6 监督器管理自己的配置文件集；跨容器共享数据卷会破坏会话文件和记忆存储。

## 日志去向

s6 容器有四个不同的日志输出面，"为什么我的网关在 `docker logs` 中不显示任何内容"是一个常见的意外情况。速查表：

| 来源 | 输出位置 | 读取方式 |
|---|---|---|
| **每个配置文件的网关**（`hermes gateway run` 及 s6 下各配置文件网关） | 同时输出到两个位置：`docker logs <container>`（实时，无前缀）**和** `${HERMES_HOME}/logs/gateways/<profile>/current`（轮转日志，ISO-8601 时间戳，10 个归档 × 每个 1 MB） | `docker logs -f hermes` 或在宿主机上执行 `tail -F ~/.hermes/logs/gateways/default/current` |
| **仪表板**（当 `HERMES_DASHBOARD=1` 时） | `docker logs <container>`（无前缀） | `docker logs -f hermes` — 与网关日志行交错显示 |
| **启动协调器**（记录每次容器启动时恢复了哪些配置文件网关） | `${HERMES_HOME}/logs/container-boot.log`（仅追加的审计日志） | `tail -F ~/.hermes/logs/container-boot.log` |
| **通用 Hermes 日志**（`agent.log`、`errors.log`） | `${HERMES_HOME}/logs/`（感知配置文件） | `docker exec hermes hermes logs --follow [--level WARNING] [--session <id>]` |

两个值得注意的实际影响：

- `logs/gateways/<profile>/current` 中的文件副本在容器重启后仍然保留。`docker logs` 仅保留当前容器生命周期内的输出（且在 `docker rm` 时会被清除）；轮转文件则保留在绑定挂载的卷上。
- 启动协调器的审计行格式为 `<iso-timestamp> profile=<name> prior_state=<state> action=<registered|started>`，因此执行 `grep profile=coder ~/.hermes/logs/container-boot.log` 可以快速查看给定配置文件上次被恢复的时间以及 s6 是否自动启动了它。

## 环境变量传递

API 密钥从容器内的 `/opt/data/.env` 读取。你也可以直接传递环境变量：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -e OPENAI_API_KEY="sk-..." \
  nousresearch/hermes-agent
```

直接的 `-e` 标志会覆盖 `.env` 中的值。这适用于 CI/CD 或密钥管理器集成场景，避免将密钥存储在磁盘上。

:::note 寻找 Docker 作为**终端后端**？
本页涵盖在 Docker 内运行 Hermes 本身。如果你希望 Hermes 在 Docker 沙盒容器内执行智能体的 `terminal` / `execute_code` 调用（一个在 Hermes 进程间共享的长生命周期容器 — 参见 issue #20561），那是一个独立的配置块 — `terminal.backend: docker` 加上 `terminal.docker_image`、`terminal.docker_volumes`、`terminal.docker_forward_env`、`terminal.docker_env`、`terminal.docker_run_as_host_user`、`terminal.docker_extra_args`、`terminal.docker_persist_across_processes` 和 `terminal.docker_orphan_reaper`。完整配置集（包括容器生命周期规则）请参见 [配置 → Docker 后端](configuration.md#docker-backend)。
:::

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
      - "9119:9119"   # 仪表板（仅在 HERMES_DASHBOARD=1 时可达）
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

使用 `docker compose up -d` 启动，使用 `docker compose logs -f` 查看日志。受监控网关的 stdout 也会同时输出到卷上的 `${HERMES_HOME}/logs/gateways/<profile>/current` — 完整的路由映射请参见 [日志去向](#where-the-logs-go)。

## 可选：Linux 桌面音频桥接

Docker 中的语音模式需要两个独立的条件才能工作：必须允许 Hermes 探测容器内的音频设备，且容器必须能够访问宿主机的音频服务器。以下设置适用于暴露 PulseAudio 兼容套接字的 Linux 桌面系统，包括许多 PipeWire 配置。

:::caution
这是一个 Linux 桌面变通方案，而非通用的 Docker Desktop 功能。当你宿主机音频已经正常工作，并希望在 Hermes 容器内使用 CLI 语音模式时，此方案适用。如果 Hermes 仍然报告 `Running inside Docker container -- no audio devices`，请使用包含 Docker 音频探测支持的构建版本以支持 `PULSE_SERVER` / `PIPEWIRE_REMOTE`。
:::

首先，在你的 Compose 文件旁边创建一个 ALSA 配置：

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

在 Compose 中使用该镜像，并传递宿主机用户的 PulseAudio 套接字和 cookie：

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

使用宿主机的 UID/GID 启动，以便容器进程可以访问每用户的音频套接字：

```sh
export HERMES_UID="$(id -u)"
export HERMES_GID="$(id -g)"
docker compose up -d --build
```

验证容器内 PortAudio 能看到的内容：

```sh
docker exec hermes /opt/hermes/.venv/bin/python -c "import sounddevice as sd; print(sd.query_devices())"
```

## 资源限制

Hermes 容器需要适度的资源。建议最低配置如下：

| 资源 | 最低值 | 推荐值 |
|------|--------|--------|
| 内存 | 1 GB | 2–4 GB |
| CPU | 1 核 | 2 核 |
| 磁盘（数据卷） | 500 MB | 2+ GB（随会话/技能增长） |

浏览器自动化（Playwright/Chromium）是最消耗内存的功能。如果不需要浏览器工具，1 GB 已足够。启用浏览器工具时，请至少分配 2 GB。

在 Docker 中设置限制：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  --memory=4g --cpus=2 \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

## Dockerfile 做了什么

官方镜像基于 `debian:13.4`，包含以下内容：

- Python 3.13，依赖通过 `uv sync --frozen --no-install-project` 从 lockfile 同步，对应内置的 extras（`all`、`messaging`、Anthropic/Bedrock/Azure 身份验证、Hindsight、Matrix），然后以无依赖可编辑方式安装 Hermes 本身。
- Node.js 22 + npm（用于浏览器自动化、WhatsApp 桥接、TUI/桌面捆绑包以及工作区构建工具）
- Playwright 与 Chromium（`npx playwright install --with-deps chromium --only-shell`）
- ripgrep、ffmpeg、git 和 `xz-utils` 作为系统工具
- **`docker-cli`** — 使容器内运行的智能体可以驱动宿主机的 Docker 守护进程（通过挂载 `/var/run/docker.sock` 来选择启用），用于 `docker build`、`docker run`、容器检查等。
- **`openssh-client`** — 支持从容器内使用 [SSH 终端后端](/user-guide/configuration#ssh-backend)。SSH 后端的实现依赖于系统 `ssh` 二进制文件；缺少此包时，容器化安装中会静默失败。
- WhatsApp 桥接（`scripts/whatsapp-bridge/`）
- **[`s6-overlay`](https://github.com/just-containers/s6-overlay) v3** 作为 PID 1（取代了旧版的 `tini`）— 监控仪表板和各个配置文件对应的网关，崩溃时自动回收僵尸进程并转发信号。

镜像在运行时将 `/opt/hermes` 视为不可变的安装目录。必须在 Docker 镜像构建阶段内置可选的 Python extras、Node 工作区和 TUI 资源；运行时惰性安装已被禁用，以防止受监控的网关和 `docker exec hermes …` 命令尝试将依赖产物写回只读的源码目录。

容器的 `ENTRYPOINT` 是 s6-overlay 的 `/init`。启动时依次执行：
1. 以 root 身份运行 `/etc/cont-init.d/01-hermes-setup`（即 `docker/stage2-hook.sh`）：可选的 UID/GID 重映射，修复卷属主，在首次启动时生成 `.env` / `config.yaml` / `SOUL.md`，除非设置了 `HERMES_SKIP_CONFIG_MIGRATION=1` 否则运行非交互式配置模式迁移，同步内置技能。
2. 运行 `/etc/cont-init.d/02-reconcile-profiles`（即 `hermes_cli.container_boot`）：遍历 `$HERMES_HOME/profiles/<name>/`，在 `/run/service/gateway-<profile>/` 下重建对应配置文件的网关 s6 服务槽位，并自动启动上次记录状态为 `running` 的网关（参见[配置文件级网关监控](#配置文件级网关监控)）。
3. 启动静态的 `main-hermes` 和 `dashboard` s6-rc 服务。
4. 将容器的 CMD 作为主程序 exec 执行（`/opt/hermes/docker/main-wrapper.sh`），该脚本路由用户传递给 `docker run` 的参数：
   - 无参数 → `hermes`（默认）
   - 第一个参数是 PATH 上的可执行文件（如 `sleep`、`bash`）→ 直接 exec 执行
   - 其他情况 → `hermes <args>`（子命令透传）
   当该主程序退出时，容器随之退出，并返回其退出码。

:::warning 相较于 pre-s6 镜像的破坏性变更
容器的 ENTRYPOINT 现在是 `/init`（s6-overlay），而非 `/usr/bin/tini`。所有五种已记录的 `docker run` 调用模式（无参数、`chat -q "…"`、`sleep infinity`、`bash`、`--tui`）行为与基于 tini 的镜像完全一致。如果你的下游封装依赖 tini 特定的信号处理或硬编码了 `/usr/bin/tini --` 调用，请锁定到之前的镜像标签。

:::warning 权限模型
不要覆盖镜像入口点，除非你在命令链中保留 `/init`（或等价的旧版 `docker/entrypoint.sh` 封装，它会转发到 stage2 钩子）。s6-overlay 的 `/init` 以 root 运行以便在首次启动时 chown 卷，然后通过 `s6-setuidgid` 为每个受监控服务和主程序降级到 `hermes` 用户。在官方镜像中以 root 身份启动 `hermes gateway run` 默认会被拒绝，因为它可能在 `/opt/data` 中留下 root 所有的文件，导致后续仪表板或网关启动失败。仅在你有意接受该风险时设置 `HERMES_ALLOW_ROOT_GATEWAY=1`。
:::

### `docker exec` 自动降级到 `hermes` 用户

`docker exec hermes <cmd>` 默认在容器内以 root 运行，但镜像在 `/opt/hermes/bin/hermes`（PATH 中最靠前）提供了一个薄层封装，能检测 root 调用者并通过 `s6-setuidgid hermes` 透明地重新执行。因此 `docker exec hermes login`、`docker exec hermes profile create …`、`docker exec hermes setup` 等命令写入的文件都归 UID 10000 所有 — 即可被受监控的网关读取 — 无需额外的 `--user` 标志。非 root 调用者（受监控进程本身、`docker exec --user hermes`、容器内的 kanban 子智能体）会命中短路逻辑，直接 exec 执行 venv 二进制文件，因此热路径上没有额外开销。

如果你特别需要保留 root 语义的 `docker exec`（诊断会话、检查仅 root 可访问的状态、`/opt/data` 之外恰好归 root 所有的文件），可以按每次调用选择退出：

```sh
docker exec -e HERMES_DOCKER_EXEC_AS_ROOT=1 hermes <cmd>
```

该封装接受 `1` / `true` / `yes`（不区分大小写）。其他任何值 — 包括 `=0` 这样的拼写错误 — 都会回退到降级逻辑，因此不可能静默退出。如果 `s6-setuidgid` 不可用（自定义构建中移除了 s6-overlay），该封装会拒绝以 root 运行并以退出码 126 终止，从而暴露损坏的权限模型，而不是回退到历史遗留问题（即 `docker exec hermes login` 会以 `root:root` 写入 `auth.json`，导致受监控网关在每次聊天平台消息时认证失败）。

### 配置文件级网关监控

每个通过 `hermes profile create <name>` 创建的配置文件都会在 `/run/service/gateway-<name>/` 自动注册一个 s6 监控的网关服务，支持跨容器重启的状态持久化自动重启。面向用户的操作流程和生命周期命令请参见上面的[多配置文件支持](#多-profile-support)。

**相较于 pre-s6 镜像的监控优势：**

- 网关崩溃后 `s6-supervise` 会在约 1 秒退避后自动重启。
- 通过 `HERMES_DASHBOARD=1` 启用时，仪表板在同一监控树下受监控，享受同样的自动重启待遇。
- `docker restart`、镜像升级（`docker compose up -d --force-recreate`）和意外退出都会保留运行中的网关：cont-init 协调器读取 `$HERMES_HOME/profiles/<name>/gateway_state.json`，如果上次记录的状态是 `running`，则重新启动该槽位。只有显式执行 `hermes gateway stop` 才会记录 `stopped` 状态并在重启期间保持网关停止；重启或升级时容器/s6 发出的 SIGTERM 被视为"仍在运行"，会自动重启。
- 各配置文件的网关日志持久化在 `$HERMES_HOME/logs/gateways/<profile>/current`（由 `s6-log` 轮转），协调器的操作会追加到每次启动的 `$HERMES_HOME/logs/container-boot.log`。完整路由映射请参见[日志去向](#where-the-logs-go)。

容器内的 `hermes status` 会报告 `Manager: s6 (container supervisor)`。使用 `/command/s6-svstat /run/service/gateway-<name>` 查看原始监控器视图（注意 `/command/` 仅在监控树进程的 PATH 中可用；从 `docker exec` 调用时请使用绝对路径）。

## 升级

拉取最新镜像并重新创建容器。您的数据目录将保持不变，容器会在启动网关前对挂载的 `$HERMES_HOME/config.yaml` 执行非交互式的配置模式迁移。当需要迁移时，Hermes 会首先在 `config.yaml` 和 `.env` 旁边写入带时间戳的备份。

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

仅当您需要在让新镜像重写配置之前手动检查或迁移持久化配置时，才设置 `HERMES_SKIP_CONFIG_MIGRATION=1`。

## 技能和凭证文件

当使用 Docker 作为执行环境时（不是上面的方法，而是当智能体在 Docker 沙箱内运行命令时——参见 [配置 → Docker 后端](./configuration.md#docker-backend)），Hermes 会复用单个长期存在的容器来处理所有工具调用，并自动将技能目录（`~/.hermes/skills/`）和技能声明的所有凭证文件作为只读卷挂载到该容器中。技能脚本、模板和引用在沙箱内无需手动配置即可使用，并且由于容器在 Hermes 进程的整个生命周期内持续存在，您安装的任何依赖项或写入的文件在下次工具调用时仍然保留。

SSH 和 Modal 后端也会进行相同的同步——技能和凭证文件在每个命令执行前通过 rsync 或 Modal 挂载 API 上传。

## 在容器中安装更多工具

官方镜像附带了一套精选的实用工具（参见 [Dockerfile 的功能](#what-the-dockerfile-does)），但并非智能体可能需要的每个工具都预装了。有以下五种推荐方法，按工作量和持久性递增排列。

### npm 或 Python 工具——使用 `npx` 或 `uvx`

对于发布到 npm 或 PyPI 的任何工具，指示 Hermes 通过 `npx`（npm）或 `uvx`（Python）运行它，并将该命令记录到其持久化记忆中。如果工具需要配置文件或凭证，指示将其放到 `/opt/data` 下（例如 `/opt/data/<tool>/config.yaml`）。

依赖项按需获取并在容器的整个生命周期内缓存。写入 `/opt/data` 下的配置在容器重启后仍然保留，因为它存在于挂载的主机目录上。包缓存在 `docker rm` 后会重建，但 `npx` 和 `uvx` 在下次工具运行时会透明地重新获取。

### 其他工具（apt 包、二进制文件）——安装并记住

对于 npm 或 PyPI 之外的任何工具——`apt` 包、预构建二进制文件中、镜像中尚不存在的语言运行时——指示 Hermes 如何安装它（例如 `apt-get update && apt-get install -y <package>`），并告诉它记住安装命令。该工具在容器的剩余生命周期内持续存在，Hermes 会在容器重启后下次需要该工具时重新运行安装命令。

这适合安装快速且偶尔使用的工具。对于持续使用的工具，请优先选择下一种方法。

### 持久化安装——构建派生镜像

当工具必须在每次容器启动时立即可用、无需重新安装延迟时，构建一个继承自 `nousresearch/hermes-agent` 的新镜像，并在其中安装该工具：

```dockerfile
FROM nousresearch/hermes-agent:latest

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends <your-package> \
    && rm -rf /var/lib/apt/lists/*
USER hermes
```

构建它并替代官方镜像使用：

```sh
docker build -t my-hermes:latest .
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  my-hermes:latest gateway run
```

入口点脚本和 `/opt/data` 语义保持不变，因此本页其余部分仍然适用。拉取较新的上游 `nousresearch/hermes-agent` 时记得重新构建镜像。

### 复杂工具或多服务栈——运行 Sidecar 容器

对于自带服务（数据库、Web 服务器、队列、无头浏览器集群）或过于沉重而无法放在 Hermes 容器内的工具，请在共享 Docker 网络上作为独立容器运行。Hermes 通过容器名称访问 sidecar，与访问本地推理服务器的方式相同（参见 [连接本地推理服务器](#connecting-to-local-inference-servers-vllm-ollama-etc)）。

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

从 Hermes 容器内部，sidecar 可通过 `http://my-tool:<port>` 访问（或其提供的任何协议）。这种模式使每个服务的生命周期、资源限制和升级节奏保持独立，并避免 Hermes 镜像因仅一个工具所需的依赖而膨胀。

### 广泛有用的工具——提交 Issue 或 Pull Request

如果某个工具可能对大多数 Hermes 智能体用户有用，请考虑向上游贡献，而不是在私有派生镜像中维护。在 [hermes-agent 仓库](https://github.com/NousResearch/hermes-agent) 上提交 issue 或 pull request，描述该工具及其使用场景。被捆绑到官方镜像中的工具惠及所有用户，并避免了下游分支的维护开销。

## 连接本地推理服务器（vLLM、Ollama 等）

当在 Docker 中运行 Hermes 且您的推理服务器（vLLM、Ollama、text-generation-inference 等）也在主机上或另一个容器中运行时，网络连接需要特别注意。

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

:::tip 要点
- 使用**容器名称**（`vllm`）作为主机名——不要用 `localhost` 或 `127.0.0.1`，它们指向 Hermes 容器自身。
- `model` 值必须与传递给 vLLM 的 `--served-model-name` 匹配。
- 将 `api_key` 设置为任意非空字符串（vLLM 需要该请求头但默认不验证）。
- 在 `base_url` 中**不要**包含尾部斜杠。
:::

### 独立 Docker 运行（无 Compose）

如果您的推理服务器直接运行在主机上（不在 Docker 中），在 macOS/Windows 上使用 `host.docker.internal`，在 Linux 上使用 `--network host`：

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

:::warning 使用 `--network host` 时，`-p` 标志被忽略——所有容器端口直接暴露在主机上。
:::

### 验证连接

从 Hermes 容器内部确认推理服务器可达：

```sh
docker exec hermes curl -s http://vllm:8000/v1/models
```

您应该看到列出您服务的模型的 JSON 响应。如果失败，请检查：

1. 两个容器在同一 Docker 网络上（`docker network inspect hermes-net`）
2. 推理服务器监听在 `0.0.0.0`，而非 `127.0.0.1`
3. 端口号匹配

### Ollama

Ollama 的工作方式相同。如果 Ollama 在主机上运行，使用 `host.docker.internal:11434`（macOS/Windows）或 `127.0.0.1:11434`（带 `--network host` 的 Linux）。如果 Ollama 在自己的容器中运行且在同一 Docker 网络上：

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
- 缺少或无效的 `.env` 文件——先交互式运行以完成设置
- 使用暴露端口时出现端口冲突

### "权限被拒绝"错误

容器的 stage2 钩子通过 `s6-setuidgid` 在每个受监管服务内将权限降级为非 root 的 `hermes` 用户（UID 10000）。如果您的主机 `~/.hermes/` 由不同的 UID 拥有，请设置 `HERMES_UID`/`HERMES_GID`——或其 `PUID`/`PGID` 别名，以保持与 LinuxServer.io 和 NAS 镜像的一致性——来匹配您的主机用户，或确保数据目录可写：

```sh
chmod -R 755 ~/.hermes
```

在 NAS（UGOS、Synology、unRAID）上，数据目录通常是一个由容器无法 `chown` 的主机 UID 拥有的**绑定挂载**。将 `PUID`/`PGID`（或 `HERMES_UID`/`HERMES_GID`）设置为该主机用户，使运行时以挂载的所有者而非 UID 10000 运行：

```sh
docker run -d \
  --name hermes \
  -e PUID=1000 -e PGID=10 \
  -v /volume1/docker/hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

`docker exec hermes <cmd>` 也会自动降级到 UID 10000——详情及每次调用的退出方式请参见 [`docker exec` 自动降级到 `hermes` 用户](#docker-exec-automatically-drops-to-the-hermes-user)。

### 浏览器工具无法使用

Playwright 需要共享内存。在 Docker run 命令中添加 `--shm-size=1g`：

```sh
docker run -d \
  --name hermes \
  --shm-size=1g \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

### 网络问题后网关无法重连

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