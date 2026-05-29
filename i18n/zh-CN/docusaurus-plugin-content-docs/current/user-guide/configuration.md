---
sidebar_position: 2
title: "配置"
description: "配置 Hermes 智能体 — config.yaml、提供商、模型、API 密钥等"
---

# 配置

所有设置都存储在 `~/.hermes/` 目录中，便于访问。

:::tip 获取可运行的 `config.yaml` 的最简路径
运行 `hermes setup --portal` —— 一次 OAuth 登录即可为你设置一个模型提供商和所有四个工具网关工具，无需手动编辑 YAML。Portal 订阅用户还能在按量计费的提供商上享受九折优惠。详见 [Nous Portal](/integrations/nous-portal)。
:::

## 目录结构

```text
~/.hermes/
├── config.yaml     # 设置（模型、终端、TTS、压缩等）
├── .env            # API 密钥和秘密信息
├── auth.json       # OAuth 提供商凭证（Nous Portal 等）
├── SOUL.md         # 主要智能体身份（系统提示词中的槽位 #1）
├── memories/       # 持久化记忆（MEMORY.md、USER.md）
├── skills/         # 智能体创建的技能（通过 skill_manage 工具管理）
├── cron/           # 定时任务
├── sessions/       # 网关会话
└── logs/           # 日志（errors.log、gateway.log —— 秘密信息会被自动隐去）
```

# 配置管理

```bash
hermes config              # 查看当前配置
hermes config edit         # 在编辑器中打开 config.yaml
hermes config set KEY VAL  # 设置特定值
hermes config check        # 检查缺失的选项（更新后）
hermes config migrate      # 交互式添加缺失选项

# 示例：
hermes config set model anthropic/claude-opus-4
hermes config set terminal.backend docker
hermes config set OPENROUTER_API_KEY sk-or-...  # 保存到 .env
```

:::tip
`hermes config set` 命令会自动将值路由到正确的文件 — API 密钥保存到 `.env`，其他所有内容保存到 `config.yaml`。
:::

## 配置优先级

设置按以下顺序解析（优先级从高到低）：

1.  **CLI 参数** — 例如，`hermes chat --model anthropic/claude-sonnet-4`（每次调用时的覆盖）
2.  **`~/.hermes/config.yaml`** — 所有非机密设置的主要配置文件
3.  **`~/.hermes/.env`** — 环境变量的后备；**必须**用于存储机密信息（API 密钥、令牌、密码）
4.  **内置默认值** — 当没有其他设置时，硬编码的安全默认值

:::info 经验法则
机密信息（API 密钥、机器人令牌、密码）放在 `.env` 中。其他所有内容（模型、终端后端、压缩设置、内存限制、工具集）放在 `config.yaml` 中。如果两者都设置了，对于非机密设置，`config.yaml` 优先。
:::

## 环境变量替换

您可以在 `config.yaml` 中使用 `${VAR_NAME}` 语法引用环境变量：

```yaml
auxiliary:
  vision:
    api_key: ${GOOGLE_API_KEY}
    base_url: ${CUSTOM_VISION_URL}

delegation:
  api_key: ${DELEGATION_KEY}
```

单个值中支持多个引用：`url: "${HOST}:${PORT}"`。如果引用的变量未设置，占位符将按字面意思保留（`${UNDEFINED_VAR}` 保持原样）。仅支持 `${VAR}` 语法 — 裸 `$VAR` 不会被展开。

有关 AI 提供商设置（OpenRouter、Anthropic、Copilot、自定义端点、自托管 LLM、回退模型等），请参阅 [AI 提供商](/integrations/providers)。

### 提供商超时

您可以为提供商设置全局请求超时 `providers.<id>.request_timeout_seconds`，以及为模型设置特定覆盖 `providers.<id>.models.<model>.timeout_seconds`。适用于每种传输方式（OpenAI 线路、原生 Anthropic、Anthropic 兼容）上的主轮询客户端、回退链、凭据轮换后的重建，以及（对于 OpenAI 线路）的每请求超时参数 — 因此配置值优先于旧的 `HERMES_API_TIMEOUT` 环境变量。

您还可以为非流式陈旧调用检测器设置 `providers.<id>.stale_timeout_seconds`，以及为模型设置特定覆盖 `providers.<id>.models.<model>.stale_timeout_seconds`。这优先于旧的 `HERMES_API_CALL_STALE_TIMEOUT` 环境变量。

如果未设置这些值，则保留旧的默认值（`HERMES_API_TIMEOUT=1800`秒，`HERMES_API_CALL_STALE_TIMEOUT=300`秒，原生 Anthropic 900秒）。目前尚未为 AWS Bedrock 配线（`bedrock_converse` 和 AnthropicBedrock SDK 路径都使用 boto3 及其自身的超时配置）。请参阅 [`cli-config.yaml.example`](https://github.com/NousResearch/hermes-agent/blob/main/cli-config.yaml.example) 中的注释示例。

## 终端后端配置

Hermes 支持六种终端后端。每种后端决定了智能体的 shell 命令实际在哪里执行 — 本地机器、Docker 容器、通过 SSH 连接的远程服务器、Modal 云沙箱（直接或通过 Nous 管理的网关）、Daytona 工作区，或 Singularity/Apptainer 容器。

```yaml
terminal:
  backend: local    # local | docker | ssh | modal | daytona | singularity
  cwd: "."          # 网关/定时任务的工作目录（CLI 始终使用启动目录）
  timeout: 180      # 每条命令的超时时间（秒）
  env_passthrough: []  # 要转发到沙箱执行环境的环境变量名称（终端 + execute_code）
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"  # Singularity 后端的容器镜像
  modal_image: "nikolaik/python-nodejs:python3.11-nodejs20"                 # Modal 后端的容器镜像
  daytona_image: "nikolaik/python-nodejs:python3.11-nodejs20"               # Daytona 后端的容器镜像
```

对于 Modal 和 Daytona 等云沙箱，`container_persistent: true` 意味着 Hermes 将尝试在沙箱重建时保留文件系统状态。它不保证同一个活动沙箱、PID 空间或后台进程稍后仍会运行。

### 后端概述

| 后端 | 命令运行位置 | 隔离性 | 最适用于 |
|------|--------------|--------|----------|
| **local** | 直接在您的机器上 | 无 | 开发、个人使用 |
| **docker** | 单个持久化 Docker 容器（在会话、`/new`、子智能体间共享） | 完全（命名空间、cap-drop） | 安全沙箱、CI/CD |
| **ssh** | 通过 SSH 连接的远程服务器 | 网络边界 | 远程开发、高性能硬件 |
| **modal** | Modal 云沙箱 | 完全（云虚拟机） | 临时云计算、评估 |
| **daytona** | Daytona 工作区 | 完全（云容器） | 托管云开发环境 |
| **singularity** | Singularity/Apptainer 容器 | 命名空间（--containall） | HPC 集群、共享机器 |

### 本地后端

默认后端。命令直接在您的机器上运行，无隔离。无需特殊设置。

```yaml
terminal:
  backend: local
```

:::warning
智能体拥有与您的用户账户相同的文件系统访问权限。使用 `hermes tools` 禁用您不需要的工具，或切换到 Docker 进行沙箱隔离。
:::

### Docker 后端

在具有安全加固（所有能力已移除、无权限提升、PID 限制）的 Docker 容器内运行命令。

**单个持久化容器，在所有 Hermes 进程间共享。** Hermes 在首次使用时启动一个长寿命容器，并将每个终端、文件和 `execute_code` 调用通过 `docker exec` 路由到该同一容器 — 跨会话、`/new`、`/reset` 和 `delegate_task` 子智能体。工作目录更改、已安装的包、`/workspace` 中的文件以及**后台进程**都从一个工具调用延续到下一个，从一个 Hermes 进程延续到下一个。当您关闭 TUI 会话、运行 `/quit` 或启动新的 `hermes` 调用时，容器继续运行，下一个 Hermes 进程通过带标签的查找复用它。有关确切的拆除规则，请参见下面的**容器生命周期**。

```yaml
terminal:
  backend: docker
  docker_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  docker_mount_cwd_to_workspace: false  # 将启动目录挂载到 /workspace
  docker_run_as_host_user: false   # 参见下面的“以主机用户身份运行容器”
  docker_forward_env:              # 要转发到容器中的主机环境变量
    - "GITHUB_TOKEN"
  docker_env:                      # 要注入的字面环境变量（KEY=value）
    DEBUG: "1"
    PYTHONUNBUFFERED: "1"
  docker_volumes:                  # 主机目录挂载
    - "/home/user/projects:/workspace/projects"
    - "/home/user/data:/data:ro"   # :ro 表示只读
  docker_extra_args:               # 追加到 `docker run` 的额外标志（按字面意思）
    - "--gpus=all"
    - "--network=host"

  # 资源限制
  container_cpu: 1                 # CPU 核心数（0 = 无限制）
  container_memory: 5120           # MB（0 = 无限制）
  container_disk: 51200            # MB（需要 XFS+pquota 上的 overlay2）
  container_persistent: true       # 持久化 /workspace 和 /root 的绑定挂载目录

  # 跨进程容器复用（默认值符合“一个在会话间共享的长寿命容器”的约定 — 参见容器生命周期）。
  docker_persist_across_processes: true   # 在 Hermes 重启时复用容器
  docker_orphan_reaper: true              # 启动时清理被遗弃的 Exited 容器

  # 跨后端生命周期设置（也适用于 docker）
  timeout: 180                     # 每条命令的超时时间（秒）
  lifetime_seconds: 300            # 空闲回收窗口；也用于 2× 孤儿回收阈值
```

**`docker_env`** 与 **`docker_forward_env`**：前者注入您在配置中指定的字面 `KEY=value` 对（值存在于您的 `config.yaml` 中，或通过 `TERMINAL_DOCKER_ENV='{"DEBUG":"1"}'` 作为 JSON 字典传递）。后者从您的 shell 或 `~/.hermes/.env` 转发值，因此实际的机密信息永远不会出现在配置文件中。使用 `docker_forward_env` 传递令牌，使用 `docker_env` 传递容器需要的静态开关。

**`terminal.docker_extra_args`**（也可通过 `TERMINAL_DOCKER_EXTRA_ARGS='["--gpus=all"]'` 覆盖）允许您传递 Hermes 未作为一级键公开的任意 `docker run` 标志 — `--gpus`、`--network`、`--add-host`、替代的 `--security-opt` 覆盖等。每个条目必须是字符串；该列表最后附加到组装的 `docker run` 调用中，因此可以在需要时覆盖 Hermes 的默认值。谨慎使用 — 与沙箱加固（能力移除、`--user`、工作区绑定挂载）冲突的标志会静默地削弱隔离性。

**要求：** Docker Desktop 或 Docker Engine 已安装并运行。Hermes 会探测 `$PATH` 加上常见的 macOS 安装位置（`/usr/local/bin/docker`、`/opt/homebrew/bin/docker`、Docker Desktop 应用程序包）。默认支持 Podman：当两者都安装时，设置 `HERMES_DOCKER_BINARY=podman`（或完整路径）以强制使用它。

#### 容器生命周期

每个由 Hermes 管理的容器都带有三个标签，以便后续进程（以及孤儿回收器）可以识别它：

- `hermes-agent=1` — 标记为 Hermes 管理
- `hermes-task-id=<sanitized task_id>` — 按任务键进行复用探测
- `hermes-profile=<sanitized profile name>` — 将复用和回收范围限定到活动的 Hermes 配置文件

启动时，Hermes 运行 `docker ps --filter label=hermes-task-id=<id> --filter label=hermes-profile=<profile>`，并在找到现有容器时**附加到该容器**。如果容器处于 `exited` 状态（例如在 Docker 守护进程重启后），它会通过 `docker start` 启动并复用 — 文件系统状态和任何已安装的包会保留，但容器内的后台进程不会保留。

当 Hermes 进程退出时 — `/quit`、关闭 TUI 会话、网关关闭，甚至是 SIGKILL — 在默认模式下，容器的清理路径是**空操作**。容器继续运行。下一个 Hermes 进程通过标签探测在毫秒内附加到它。这是“一个在会话间共享的长寿命容器”约定所要求的行为：这是后台进程（npm 监视器、开发服务器、长时间运行的 pytest）能在会话间存活的唯一方式。

**容器仅在以下情况下被拆除（停止并 `docker rm -f`）：**

| 触发条件 | 触发时间 |
|----------|----------|
| `docker_persist_across_processes: false` | 显式的按进程隔离。每次 `cleanup()` 都执行 `stop` + `rm -f`。与 #20561 问题之前的行为匹配。 |
| 空闲回收器（`lifetime_seconds`，默认 300 秒） | 仅当环境设置为 `persist_across_processes=false` 时。持久模式环境的操作为空；容器在空闲扫描中存活。 |
| 下次启动时的孤儿回收器 | 清理比 `2 × lifetime_seconds`（默认 600 秒 = 10 分钟）更旧的、处于 **Exited** 状态的 hermes 标签容器，范围限定到当前配置文件。**运行中的容器永远不会被触及** — 保证兄弟进程安全。设置 `docker_orphan_reaper: false` 以禁用。 |
| 用户直接操作 | `docker rm -f`、`docker system prune`、Docker Desktop 重启。我们不设置 `--restart=always`，因此主机重启会使容器处于 `Exited` 状态（其 CoW 层会存活并在下次启动时复用，但后台进程会消失）。 |

需要了解的边缘情况：

- **容器内 PID 1 的 OOM 终止**会使容器转换到 `Exited` 状态。下次复用时会 `docker start` 它；文件系统状态存活，后台进程不会存活。
- **切换配置文件**会隔离容器 — 标记为 `hermes-profile=work` 的容器对于运行在 `hermes-profile=research` 下的 Hermes 进程是不可见的。孤儿回收器也是按配置文件范围的，因此跨配置文件的容器不会被意外回收，但在您再次在其原始配置文件下启动 Hermes 之前，它们也不会被自动清理。

通过 `delegate_task(tasks=[...])` 生成的并行子智能体共享这一个容器 — 并发的 `cd`、环境变量更改以及对同一路径的写入将发生冲突。如果子智能体需要一个隔离的沙箱，它必须通过 `register_task_env_overrides()` 注册每个任务的镜像覆盖，RL 和基准测试环境（TerminalBench2、HermesSweEnv 等）会为其每个任务的 Docker 镜像自动执行此操作。

**安全加固：**
- 使用 `--cap-drop ALL`，仅添加回 `DAC_OVERRIDE`、`CHOWN`、`FOWNER`
- `--security-opt no-new-privileges`
- `--pids-limit 256`
- 为 `/tmp`（512MB）、`/var/tmp`（256MB）、`/run`（64MB）设置大小受限的 tmpfs

**凭据转发：** 列在 `docker_forward_env` 中的环境变量首先从您的 shell 环境中解析，然后回退到 `~/.hermes/.env`（如果通过 `hermes config set` 保存）。技能也可以声明 `required_environment_variables`，这些变量会自动合并。

#### 环境变量覆盖

`terminal:` 下的每个键都有一个形式为 `TERMINAL_<KEY_UPPERCASE>` 的环境变量覆盖。Docker 后端最有用的环境变量覆盖：

| 环境变量 | 映射到 | 说明 |
|----------|--------|------|
| `TERMINAL_DOCKER_IMAGE` | `docker_image` | 基础镜像 |
| `TERMINAL_DOCKER_FORWARD_ENV` | `docker_forward_env` | JSON 数组：`'["GITHUB_TOKEN","OPENAI_API_KEY"]'` |
| `TERMINAL_DOCKER_ENV` | `docker_env` | JSON 字典：`'{"DEBUG":"1"}'` |
| `TERMINAL_DOCKER_VOLUMES` | `docker_volumes` | `"host:container[:ro]"` 字符串的 JSON 数组 |
| `TERMINAL_DOCKER_EXTRA_ARGS` | `docker_extra_args` | JSON 数组 |
| `TERMINAL_DOCKER_MOUNT_CWD_TO_WORKSPACE` | `docker_mount_cwd_to_workspace` | `true` / `false` |
| `TERMINAL_DOCKER_RUN_AS_HOST_USER` | `docker_run_as_host_user` | `true` / `false` |
| `TERMINAL_DOCKER_PERSIST_ACROSS_PROCESSES` | `docker_persist_across_processes` | `true` / `false` — 默认 `true` |
| `TERMINAL_DOCKER_ORPHAN_REAPER` | `docker_orphan_reaper` | `true` / `false` — 默认 `true` |
| `TERMINAL_CONTAINER_CPU` | `container_cpu` | CPU 核心数 |
| `TERMINAL_CONTAINER_MEMORY` | `container_memory` | MB |
| `TERMINAL_CONTAINER_DISK` | `container_disk` | MB |
| `TERMINAL_CONTAINER_PERSISTENT` | `container_persistent` | `true` / `false` — 控制绑定挂载的工作区目录，与 `docker_persist_across_processes` 不同 |
| `TERMINAL_LIFETIME_SECONDS` | `lifetime_seconds` | 空闲回收窗口 |
| `TERMINAL_TIMEOUT` | `timeout` | 每条命令的超时时间 |
| `HERMES_DOCKER_BINARY` | _无_ | 强制使用特定的 docker/podman 二进制路径 |

### SSH 后端

通过 SSH 在远程服务器上运行命令。使用 ControlMaster 进行连接复用（5 分钟空闲保持活动）。默认启用持久 shell — 状态（cwd、环境变量）在命令间保留。

```yaml
terminal:
  backend: ssh
  persistent_shell: true           # 保持一个长寿命的 bash 会话（默认：true）
```

**必需的环境变量：**

```bash
TERMINAL_SSH_HOST=my-server.example.com
TERMINAL_SSH_USER=ubuntu
```

**可选：**

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `TERMINAL_SSH_PORT` | `22` | SSH 端口 |
| `TERMINAL_SSH_KEY` | （系统默认） | SSH 私钥路径 |
| `TERMINAL_SSH_PERSISTENT` | `true` | 启用持久 shell |

**工作原理：** 初始化时使用 `BatchMode=yes` 和 `StrictHostKeyChecking=accept-new` 进行连接。持久 shell 在远程主机上保持一个单独的 `bash -l` 进程存活，通过临时文件进行通信。需要 `stdin_data` 或 `sudo` 的命令会自动回退到单次模式。

### Modal 后端

在 [Modal](https://modal.com) 云沙箱中运行命令。每个任务获得一个具有可配置 CPU、内存和磁盘的隔离虚拟机。文件系统可以在会话间快照/恢复。

```yaml
terminal:
  backend: modal
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB（5GB）
  container_disk: 51200            # MB（50GB）
  container_persistent: true       # 快照/恢复文件系统
```

**必需：** 环境变量 `MODAL_TOKEN_ID` + `MODAL_TOKEN_SECRET`，或 `~/.modal.toml` 配置文件。

**持久性：** 启用后，沙箱文件系统在清理时被快照，并在下次会话时恢复。快照记录在 `~/.hermes/modal_snapshots.json` 中。这保留文件系统状态，而非活动进程、PID 空间或后台任务。

**凭据文件：** 自动从 `~/.hermes/` 挂载（OAuth 令牌等），并在每次命令前同步。

### Daytona 后端

在 [Daytona](https://daytona.io) 托管工作区中运行命令。支持停止/恢复以实现持久性。

```yaml
terminal:
  backend: daytona
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB → 转换为 GiB
  container_disk: 10240            # MB → 转换为 GiB（最大 10 GiB）
  container_persistent: true       # 停止/恢复而非删除
```

**必需：** `DAYTONA_API_KEY` 环境变量。

**持久性：** 启用后，沙箱在清理时被停止（而非删除），并在下次会话时恢复。沙箱名称遵循 `hermes-{task_id}` 的模式。

**磁盘限制：** Daytona 强制最大 10 GiB。超出此限制的请求将被截断并发出警告。

### Singularity/Apptainer 后端

在 [Singularity/Apptainer](https://apptainer.org) 容器中运行命令。专为 Docker 不可用的 HPC 集群和共享机器设计。

```yaml
terminal:
  backend: singularity
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB
  container_persistent: true       # 可写覆盖层在会话间持久化
```

**要求：** `$PATH` 中有 `apptainer` 或 `singularity` 二进制文件。

**镜像处理：** Docker URL（`docker://...`）会自动转换为 SIF 文件并缓存。现有的 `.sif` 文件会被直接使用。

**临时目录：** 按顺序解析：`TERMINAL_SCRATCH_DIR` → `TERMINAL_SANDBOX_DIR/singularity` → `/scratch/$USER/hermes-agent`（HPC 惯例） → `~/.hermes/sandboxes/singularity`。

**隔离性：** 使用 `--containall --no-home` 以实现完整的命名空间隔离，而不挂载主机主目录。

### 常见终端后端问题

如果终端命令立即失败或终端工具报告为已禁用：

- **本地** — 无特殊要求。入门时最安全的默认选项。
- **Docker** — 运行 `docker version` 以验证 Docker 是否正常工作。如果失败，请修复 Docker 或执行 `hermes config set terminal.backend local`。
- **SSH** — `TERMINAL_SSH_HOST` 和 `TERMINAL_SSH_USER` 都必须设置。如果任一缺失，Hermes 会记录清晰的错误。
- **Modal** — 需要 `MODAL_TOKEN_ID` 环境变量或 `~/.modal.toml`。运行 `hermes doctor` 进行检查。
- **Daytona** — 需要 `DAYTONA_API_KEY`。Daytona SDK 处理服务器 URL 配置。
- **Singularity** — 需要 `$PATH` 中有 `apptainer` 或 `singularity`。在 HPC 集群上很常见。

如有疑问，请将 `terminal.backend` 设置回 `local`，并首先验证命令是否在那里运行。

### 拆卸时的远程到主机文件同步

对于 **SSH**、**Modal** 和 **Daytona** 后端（任何智能体的工作树位于与运行 Hermes 的主机不同的机器上的情况），Hermes 会跟踪智能体在远程沙箱内修改的文件，并在会话拆卸/沙箱清理时，**将修改后的文件同步回主机**，位置在 `~/.hermes/cache/remote-syncs/<session-id>/` 下。

- 触发于：会话关闭、`/new`、`/reset`、网关消息超时、当子智能体使用远程后端时的 `delegate_task` 子智能体完成。
- 涵盖智能体修改的整个目录树，而不仅仅是它显式打开的文件。捕获添加、编辑和删除操作。
- 当您去查找时，远程沙箱可能已被拆卸；本地的 `~/.hermes/cache/remote-syncs/…` 副本是智能体更改内容的权威记录。
- 大的二进制输出（模型检查点、原始数据集）受大小限制 — 同步会跳过超过 `file_sync_max_mb`（默认 `100`）的文件。如果您期望返回更大的工件，请调高该值。

```yaml
terminal:
  file_sync_max_mb: 100     # 默认 — 同步每个文件最大 100 MB
  file_sync_enabled: true   # 默认 — 设置为 false 可完全跳过同步
```

这是您从会话结束后被销毁的临时云沙箱中恢复结果的方式，无需告诉智能体显式地对每个工件执行 `scp` 或 `modal volume put`。

### Docker 卷挂载

使用 Docker 后端时，`docker_volumes` 允许您与容器共享主机目录。每个条目使用标准的 Docker `-v` 语法：`host_path:container_path[:options]`。

```yaml
terminal:
  backend: docker
  docker_volumes:
    - "/home/user/projects:/workspace/projects"   # 读写（默认）
    - "/home/user/datasets:/data:ro"              # 只读
    - "/home/user/.hermes/cache/documents:/output" # 网关可见的导出
```

这在以下情况很有用：
- **向智能体提供文件**（数据集、配置、参考代码）
- **从智能体接收文件**（生成的代码、报告、导出）
- **共享工作区**，您和智能体访问相同的文件

如果您使用消息网关并希望智能体通过 `MEDIA:/...` 发送生成的文件，最好使用专用的主机可见导出挂载，例如 `/home/user/.hermes/cache/documents:/output`。

- 在 Docker 内部将文件写入 `/output/...`
- 在 `MEDIA:` 中发出**主机路径**，例如：
  `MEDIA:/home/user/.hermes/cache/documents/report.txt`
- **不要**发出 `/workspace/...` 或 `/output/...`，除非该路径在主机上对网关进程也存在

:::warning
YAML 重复键会静默覆盖先前的键。如果您已经有一个 `docker_volumes:` 块，请将新的挂载合并到同一个列表中，而不是在文件后面添加另一个 `docker_volumes:` 键。
:::

也可以通过环境变量设置：`TERMINAL_DOCKER_VOLUMES='["/host:/container"]'`（JSON 数组）。

### Docker 凭据转发

默认情况下，Docker 终端会话不继承任意主机凭据。如果您需要容器内的特定令牌，请将其添加到 `terminal.docker_forward_env`。

```yaml
terminal:
  backend: docker
  docker_forward_env:
    - "GITHUB_TOKEN"
    - "NPM_TOKEN"
```

Hermes 首先从您当前的 shell 解析每个列出的变量，如果它是通过 `hermes config set` 保存的，则回退到 `~/.hermes/.env`。

:::warning
`docker_forward_env` 中列出的任何内容都会对容器内运行的命令可见。只转发您愿意暴露给终端会话的凭据。
:::

### 以主机用户身份运行容器

默认情况下，Docker 容器以 `root`（UID 0）身份运行。在 `/workspace` 或其他绑定挂载中创建的文件在主机上归 root 所有，因此会话后您必须执行 `sudo chown` 才能从主机编辑器编辑它们。`terminal.docker_run_as_host_user` 标志解决了这个问题：

```yaml
terminal:
  backend: docker
  docker_run_as_host_user: true   # 默认：false
```

启用后，Hermes 将 `--user $(id -u):$(id -g)` 附加到 `docker run` 命令，以便写入绑定挂载目录（`/workspace`、`/root`、`docker_volumes` 中的任何内容）的文件归您的主机用户所有，而不是 root。权衡：容器将无法再 `apt install` 或写入 root 拥有的路径，如 `/root/.npm` — 如果您需要两者，可以使用其 `HOME` 由非 root 用户拥有的基础镜像（或在镜像构建时添加您需要的工具）。

为了向后兼容的行为，请将此设置为 `false`（默认）。当您的工作流主要是“编辑挂载的主机文件”并且您厌倦了 `sudo chown -R` 时，请打开它。

### 可选：将启动目录挂载到 `/workspace`

Docker 沙箱默认保持隔离。除非您显式选择加入，否则 Hermes **不会**将您当前的主机工作目录传递到容器中。

在 `config.yaml` 中启用它：

```yaml
terminal:
  backend: docker
  docker_mount_cwd_to_workspace: true
```

启用时：
- 如果您从 `~/projects/my-app` 启动 Hermes，该主机目录将被绑定挂载到 `/workspace`
- Docker 后端从 `/workspace` 启动
- 文件工具和终端命令都看到同一个挂载的项目

禁用时，`/workspace` 保持沙箱所有，除非您通过 `docker_volumes` 显式挂载某些内容。

安全权衡：
- `false` 保留沙箱边界
- `true` 使沙箱可以访问您启动 Hermes 的目录

仅当您有意让容器处理活动主机文件时，才使用选择加入。

### 持久 Shell

默认情况下，每条终端命令都在其自己的子进程中运行 — 工作目录、环境变量和 shell 变量在命令间重置。当**持久 shell** 启用时，一个长寿命的 bash 进程会在 `execute()` 调用间保持存活，以便状态在命令间保留。

这对 **SSH 后端** 最有用，它还消除了每条命令的连接开销。持久 shell 对于 **SSH 默认启用**，对于本地后端默认禁用。

```yaml
terminal:
  persistent_shell: true   # 默认 — 为 SSH 启用持久 shell
```

要禁用：

```bash
hermes config set terminal.persistent_shell false
```

**在命令间保留的内容：**
- 工作目录（`cd /tmp` 对下一条命令保持）
- 导出的环境变量（`export FOO=bar`）
- shell 变量（`MY_VAR=hello`）

**优先级：**

| 级别 | 变量 | 默认值 |
|------|------|--------|
| 配置 | `terminal.persistent_shell` | `true` |
| SSH 覆盖 | `TERMINAL_SSH_PERSISTENT` | 遵循配置 |
| 本地覆盖 | `TERMINAL_LOCAL_PERSISTENT` | `false` |

每后端的环境变量具有最高优先级。如果您希望在本地后端上也启用持久 shell：

```bash
export TERMINAL_LOCAL_PERSISTENT=true
```

:::note
需要 `stdin_data` 或 sudo 的命令会自动回退到单次模式，因为持久 shell 的 stdin 已被 IPC 协议占用。
:::

有关每个后端的详细信息，请参见 [代码执行](features/code-execution.md) 和 [自述文件中的终端部分](features/tools.md)。

## 技能设置

技能可以通过其 SKILL.md 的前置声明来定义自己的配置设置。这些是非机密值（路径、偏好、域设置），存储在 `config.yaml` 中的 `skills.config` 命名空间下。

```yaml
skills:
  config:
    myplugin:
      path: ~/myplugin-data   # 示例 — 每个技能定义自己的键
```

**技能设置的工作原理：**

- `hermes config migrate` 会扫描所有已启用的技能，找到未配置的设置，并提示你是否进行配置
- `hermes config show` 会在 "技能设置" 下显示所有技能设置及其所属的技能
- 当技能加载时，其已解析的配置值会自动注入到技能上下文中

**手动设置值：**

```bash
hermes config set skills.config.myplugin.path ~/myplugin-data
```

关于如何在自己的技能中声明配置设置的详细信息，请参阅 [创建技能 — 配置设置](/developer-guide/creating-skills#config-settings-configyaml)。

### 对智能体创建的技能写入进行防护

当智能体使用 `skill_manage` 来创建、编辑、修补或删除技能时，Hermes 可以选择性地扫描新/更新内容中的危险关键词模式（凭据收集、明显的提示注入、数据外泄指令）。该扫描器**默认关闭**——实际智能体工作流中合法地涉及 `~/.ssh/` 或提及 `$OPENAI_API_KEY` 的情况过于频繁地触发此启发式规则。如果你希望在智能体的技能写入生效前让扫描器提示你，请将其重新打开：

```yaml
skills:
  guard_agent_created: true   # 默认值：false
```

开启后，任何被标记的 `skill_manage` 写入操作都会作为审批提示显示，并附带扫描器的判断依据。接受的写入操作会生效；拒绝的写入操作会向智能体返回一条解释性错误信息。

## 内存配置

```yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # 约 800 个 token
  user_char_limit: 1375     # 约 500 个 token
```

## 文件读取安全

控制单个 `read_file` 调用可以返回的内容量。超出限制的读取请求将被拒绝，并返回一条错误信息，告知智能体使用 `offset` 和 `limit` 来读取更小的范围。这可以防止一次读取一个压缩的 JS 包或大型数据文件而导致上下文窗口溢出。

```yaml
file_read_max_chars: 100000  # 默认值 —— 约 25-35K 个词元
```

如果你使用的是具有大上下文窗口的模型，并且需要频繁读取大文件，可以调高此值。如果使用的是小上下文模型，为了保持读取效率，可以调低此值：

```yaml
# 大上下文模型 (200K+)
file_read_max_chars: 200000

# 小型本地模型 (16K 上下文)
file_read_max_chars: 30000
```

智能体还会自动去重文件读取 —— 如果同一个文件区域被读取两次且文件未更改，则会返回一个轻量级存根，而不是重新发送内容。这会在上下文压缩时重置，以便在内容被总结后，智能体可以重新读取文件。

## 工具输出截断限制

三个相关的上限控制着 Hermes 在截断前，单个工具可以返回多少原始输出：

```yaml
tool_output:
  max_bytes: 50000        # 终端输出上限（字符数）
  max_lines: 2000         # read_file 分页上限
  max_line_length: 2000   # read_file 行号视图中的每行上限
```

- **`max_bytes`** — 当一个 `terminal` 命令产生的 stdout/stderr 合计字符数超过此值时，Hermes 会保留前 40% 和后 60%，并在它们之间插入 `[OUTPUT TRUNCATED]` 提示。默认值 `50000`（在典型分词器下约 12-15K 个词元）。
- **`max_lines`** — 单次 `read_file` 调用中 `limit` 参数的上限。超过此值的请求会被钳制，以防止单次读取溢出上下文窗口。默认值 `2000`。
- **`max_line_length`** — 当 `read_file` 发出行号视图时应用的每行上限。超过此长度的行会被截断为此字符数，后跟 `... [truncated]`。默认值 `2000`。

对于具有大上下文窗口的模型，可以提高这些限制以获取更多单次调用的原始输出。对于小上下文模型，为了保持工具结果紧凑，请降低这些限制：

```yaml
# 大上下文模型 (200K+)
tool_output:
  max_bytes: 150000
  max_lines: 5000

# 小型本地模型 (16K 上下文)
tool_output:
  max_bytes: 20000
  max_lines: 500
```

## 全局工具集禁用

要在一个地方同时禁用 CLI 和所有网关平台上的特定工具集，请在 `agent.disabled_toolsets` 下列出它们的名称：

```yaml
agent:
  disabled_toolsets:
    - memory       # 隐藏 memory 工具 + MEMORY_GUIDANCE 注入
    - web          # 任何地方都不允许 web_search / web_extract
```

此设置在每平台工具配置（由 `hermes tools` 写入的 `platform_toolsets`）**之后**应用，因此此处列出的工具集将始终被移除 —— 即使某个平台的已保存配置仍然列出了它。当你想要一个“在所有地方关闭 X”的统一开关，而不是在 `hermes tools` UI 中编辑 15+ 个平台行时，请使用此功能。

将列表留空或省略该键，将不执行任何操作。

## Git 工作树隔离

为在同一个仓库上并行运行多个智能体，启用隔离的 Git 工作树：

```yaml
worktree: true    # 始终创建工作树（与 hermes -w 相同）
# worktree: false # 默认 —— 仅在传递 -w 标志时生效
```

启用后，每个 CLI 会话会在 `.worktrees/` 下创建一个新的工作树和独立的分支。智能体可以编辑文件、提交、推送和创建 PR，而不会相互干扰。干净的工作树在退出时被移除；脏的工作树会被保留以供手动恢复。

你还可以通过在仓库根目录的 `.worktreeinclude` 文件列出要复制到工作树中的 gitignore 文件：

```
# .worktreeinclude
.env
.venv/
node_modules/
```

## 上下文压缩

Hermes 会自动压缩长对话，以保持在模型的上下文窗口内。压缩摘要器是一个单独的 LLM 调用 —— 你可以将其指向任何提供商或端点。

所有压缩设置都在 `config.yaml` 中（无环境变量）。

### 完整参考

```yaml
compression:
  enabled: true                                     # 开关压缩
  threshold: 0.50                                   # 在达到上下文限制的此百分比时压缩
  target_ratio: 0.20                                # 作为最近尾部保留的阈值比例
  protect_last_n: 20                                # 保持未压缩的最小最近消息数
  protect_first_n: 3                                # 跨压缩固定的非系统头部消息数 (0 = 不固定任何)
  hygiene_hard_message_limit: 400                   # 网关安全阀 —— 见下文

# 摘要模型/提供商在 auxiliary 下配置：
auxiliary:
  compression:
    model: ""                                       # 空 = 使用主聊天模型。可覆盖，例如 "google/gemini-3-flash-preview" 以使用更便宜/快速的压缩模型。
    provider: "auto"                                # 提供商："auto"、"openrouter"、"nous"、"codex"、"main" 等。
    base_url: null                                  # 自定义 OpenAI 兼容端点（覆盖提供商）
```

:::info 旧版配置迁移
旧版配置中包含 `compression.summary_model`、`compression.summary_provider` 和 `compression.summary_base_url`，会在首次加载时（配置版本 17）自动迁移到 `auxiliary.compression.*`。无需手动操作。
:::

`hygiene_hard_message_limit` 是一个仅限网关的**预压缩安全阀**。具有数千条消息的失控会话可能在正常百分比阈值触发之前就达到模型上下文限制；当消息数量超过此上限时，Hermes 会强制压缩，无论词元使用量如何。默认值 `400` —— 对于长时间会话很常见的平台，可以调高此值；为了强制更激进的压缩，可以调低此值。在运行中的网关上编辑此值将在下一条消息时生效（见下文）。

`protect_first_n` 控制了在每次压缩中固定的**非系统**头部消息数量。默认值 `3` —— 开头的用户/助手交流会在每次摘要器传递中保留下来，以便原始目标保持可见。在长时间运行的滚动压缩会话中，如果开头的对话已不再相关，请设置 `protect_first_n: 0` 以仅固定系统提示 + 摘要 + 尾部。系统提示本身无论此设置如何都会被保留。

:::tip 网关对压缩和上下文长度的热重载
在最新版本中，在运行中的网关上编辑 `config.yaml` 中的 `model.context_length` 或任何 `compression.*` 键将在下一条消息时生效 —— 无需网关重启，无需 `/reset`，无需会话轮换。缓存的智能体签名包含这些键，因此网关在检测到更改时会透明地重建智能体。API 密钥和工具/技能配置仍然需要通常的重载路径。
:::

### 常见设置

**默认（自动检测）—— 无需配置：**
```yaml
compression:
  enabled: true
  threshold: 0.50
```
使用你的主提供商和主模型。如果希望在比主聊天模型更便宜的模型上进行压缩，可以按任务覆盖（例如 `auxiliary.compression.provider: openrouter` + `model: google/gemini-2.5-flash`）。

**强制指定提供商**（基于 OAuth 或 API 密钥）：
```yaml
auxiliary:
  compression:
    provider: nous
    model: gemini-3-flash
```
适用于任何提供商：`nous`、`openrouter`、`codex`、`anthropic`、`main` 等。

**自定义端点**（自托管、Ollama、zai、DeepSeek 等）：
```yaml
auxiliary:
  compression:
    model: glm-4.7
    base_url: https://api.z.ai/api/coding/paas/v4
```
指向自定义的 OpenAI 兼容端点。使用 `OPENAI_API_KEY` 进行身份验证。

### 三个调节旋钮如何相互作用

| `auxiliary.compression.provider` | `auxiliary.compression.base_url` | 结果 |
|---------------------|---------------------|--------|
| `auto`（默认） | 未设置 | 自动检测最佳可用提供商 |
| `nous` / `openrouter` 等 | 未设置 | 强制使用该提供商，使用其认证信息 |
| 任意 | 已设置 | 直接使用自定义端点（忽略 provider 设置） |

:::warning 摘要模型上下文长度要求
摘要模型**必须**具有至少与主智能体模型一样大的上下文窗口。压缩器会将对话的完整中间部分发送给摘要模型 —— 如果该模型的上下文窗口小于主模型的，摘要调用将因上下文长度错误而失败。发生这种情况时，中间对话轮将**被丢弃且不进行总结**，从而悄悄丢失对话上下文。如果你覆盖了模型，请验证其上下文长度是否满足或超过主模型的要求。
:::

## 上下文引擎

上下文引擎控制当接近模型的词元限制时如何管理对话。内置的 `compressor` 引擎使用有损摘要（参见[上下文压缩](/developer-guide/context-compression-and-caching)）。插件引擎可以将其替换为替代策略。

```yaml
context:
  engine: "compressor"    # 默认 — 内置有损摘要
```

要使用插件引擎（例如，用于无损上下文管理的 LCM）：

```yaml
context:
  engine: "lcm"          # 必须与插件名称匹配
```

插件引擎**从不自动激活** — 你必须明确地将 `context.engine` 设置为插件名称。可以通过 `hermes plugins` → 提供商插件 → 上下文引擎 来浏览和选择可用引擎。

参见[记忆提供商](/user-guide/features/memory-providers)了解针对记忆插件的类似单选系统。

## 迭代预算压力

当智能体正在处理一个涉及许多工具调用的复杂任务时，它可能会在不知情的情况下耗尽其迭代预算（默认：90 轮）。预算压力会在接近限制时自动警告模型：

| 阈值 | 级别 | 模型看到的内容 |
|-----------|-------|---------------------|
| **70%** | 注意 | `[BUDGET: 63/90. 27 iterations left. Start consolidating.]` |
| **90%** | 警告 | `[BUDGET WARNING: 81/90. Only 9 left. Respond NOW.]` |

警告是作为 `_budget_warning` 字段注入到最后一个工具结果的 JSON 中，而不是作为单独的消息 — 这样可以保留提示缓存，不会破坏对话结构。

```yaml
agent:
  max_turns: 90                # 每次对话轮次的最大迭代次数（默认：90）
  api_max_retries: 3           # 回退切换启用前，每个提供商的重试次数（默认：3）
```

预算压力默认是启用的。智能体会自然地看到作为工具结果一部分的警告，这鼓励它在耗尽迭代次数前整合其工作并给出响应。

当迭代预算完全耗尽时，CLI 会向用户显示一条通知：`⚠ Iteration budget reached (90/90) — response may be incomplete`。如果在活动工作期间预算耗尽，智能体将在停止前生成已完成工作的摘要。

`agent.api_max_retries` 控制在**回退提供商切换**启用之前，Hermes 对提供商 API 调用在瞬态错误（速率限制、连接中断、5xx）下重试的次数。默认值为 `3` — 总共四次尝试。如果你配置了[回退提供商](/user-guide/features/fallback-providers)，并希望更快地进行故障转移，请将此值降至 `0`，这样你的主要提供商上的第一个瞬态错误将立即移交给回退提供商，而不是针对不稳定的端点反复重试。

### API 超时

Hermes 为流式传输设置了单独的超时层，并为非流式调用设置了陈旧检测器。仅当你将本地提供商的陈旧检测器保持在它们隐式默认值时，才会自动调整。

| 超时 | 默认值 | 本地提供商 | 配置 / 环境变量 |
|---------|---------|----------------|--------------|
| 套接字读取超时 | 120秒 | 自动提高到 1800秒 | `HERMES_STREAM_READ_TIMEOUT` |
| 陈旧流检测 | 180秒 | 自动禁用 | `HERMES_STREAM_STALE_TIMEOUT` |
| 陈旧非流检测 | 300秒 | 保持隐式时自动禁用 | `providers.<id>.stale_timeout_seconds` 或 `HERMES_API_CALL_STALE_TIMEOUT` |
| API 调用（非流式） | 1800秒 | 不变 | `providers.<id>.request_timeout_seconds` / `timeout_seconds` 或 `HERMES_API_TIMEOUT` |

**套接字读取超时**控制 httpx 等待来自提供商的下一个数据块的时间。本地 LLM 在大上下文预填充生成第一个词元之前可能需要几分钟，因此当 Hermes 检测到本地端点时，会将此超时提高到 30 分钟。如果你明确设置了 `HERMES_STREAM_READ_TIMEOUT`，则无论端点检测如何，该值始终会被使用。

**陈旧流检测**会终止那些接收 SSE 心跳但没有任何实际内容的连接。对于本地提供商，此功能被完全禁用，因为它们在预填充期间不发送心跳。

**陈旧非流检测**会终止那些长时间没有产生响应的非流式调用。默认情况下，Hermes 在本地端点上禁用此功能，以避免在长时间预填充期间出现误报。如果你明确设置了 `providers.<id>.stale_timeout_seconds`、`providers.<id>.models.<model>.stale_timeout_seconds` 或 `HERMES_API_CALL_STALE_TIMEOUT`，则即使在本地端点上，也会遵守该明确值。

## 上下文压力警告

与迭代预算压力分开，上下文压力追踪对话距离**压缩阈值**有多远——即触发上下文压缩以总结旧消息的时点。这有助于您和智能体了解对话何时变得冗长。

| 进度 | 级别 | 发生情况 |
|----------|-------|-------------|
| **≥ 60%** 至阈值 | 信息 | CLI显示青色进度条；网关发送信息通知 |
| **≥ 85%** 至阈值 | 警告 | CLI显示醒目的黄色进度条；网关警告压缩即将发生 |

在CLI中，上下文压力在工具输出流中显示为进度条：
```
  ◐ context ████████████░░░░░░░░ 62% to compaction  48k threshold (50%) · approaching compaction
```
在消息平台上，会发送纯文本通知：
```
◐ Context: ████████████░░░░░░░░ 62% to compaction (threshold: 50% of window).
```
如果禁用了自动压缩，警告会告知上下文可能被截断。

上下文压力是自动的——无需配置。它纯粹作为面向用户的通知触发，不会修改消息流或向模型的上下文中注入任何内容。

## 凭据池策略

当您为同一提供商拥有多个API密钥或OAuth令牌时，请配置轮换策略：

```yaml
credential_pool_strategies:
  openrouter: round_robin    # 循环均匀地使用密钥
  anthropic: least_used      # 始终选择使用最少的密钥
```

选项：`fill_first`（默认）、`round_robin`、`least_used`、`random`。完整文档请参阅[凭据池](/user-guide/features/credential-pools)。

## 提示缓存

当活动提供商支持时，Hermes会自动开启跨会话提示缓存——无需用户配置。

对于**原生Anthropic**、**OpenRouter**和**Nous Portal**上的Claude，Hermes会在系统提示和技能块上附加带有1小时TTL（`ttl: "1h"`）的`cache_control`断点。在新的一小时内首次发送需支付全额输入费率；同一小时内后续跨任何会话的发送将按折扣的缓存读取费率从缓存中拉取。这意味着系统提示、加载的技能内容以及任何长上下文包含的开头部分将在第一个小时内跨`hermes`会话和分叉的子智能体中被重用。

Qwen Cloud（阿里云DashScope）的上游将缓存TTL限制在5分钟，因此Hermes在那里使用5分钟的断点TTL。其他通过第三方访问Claude的路径（AWS Bedrock、Azure Foundry）会退回到提供商自身的缓存默认设置。xAI Grok使用单独的会话绑定会话-ID机制——请参阅[xAI提示缓存](/integrations/providers#xai-grok--responses-api--prompt-caching)。

没有禁用此功能的选项——缓存始终开启，即使在单轮对话中也能节省成本，因为系统提示本身就占输入标记数的显著比例。

## 辅助模型

Hermes使用“辅助”模型执行图像分析、网页摘要、浏览器截图分析、会话标题生成和上下文压缩等附带任务。默认情况下（`auxiliary.*.provider: "auto"`），Hermes将每个辅助任务路由到您的**主聊天模型**——即您在`hermes model`中选择的相同提供商/模型。您无需配置任何东西即可开始使用，但请注意，在昂贵的推理模型（Opus、MiniMax M2.7等）上，辅助任务会增加显著成本。如果您希望无论主模型如何，都能获得廉价且快速的附带任务，请显式设置`auxiliary.<task>.provider`和`auxiliary.<task>.model`（例如，使用OpenRouter上的Gemini Flash进行视觉和网页提取）。

:::note 为何“auto”使用您的主模型
早期版本会将聚合器用户（OpenRouter、Nous Portal）分流到提供商端的默认廉价模型。这令人意外——为聚合器订阅付费的用户会看到不同的模型处理他们的辅助流量。`auto`现在对所有人都使用主模型，并且`config.yaml`中的每任务覆盖仍然有效（参见下方[完整辅助配置参考](#完整辅助配置参考)）。
:::

### 交互式配置辅助模型

无需手动编辑YAML，运行`hermes model`并从菜单中选择**“配置辅助模型”**。您将获得一个交互式的逐任务选择器：

```
$ hermes model
→ 配置辅助模型

[ ] vision               当前: auto / 主模型
[ ] web_extract          当前: auto / 主模型
[ ] title_generation     当前: openrouter / google/gemini-3-flash-preview
[ ] compression          当前: auto / 主模型
[ ] approval             当前: auto / 主模型
[ ] triage_specifier     当前: auto / 主模型
[ ] kanban_decomposer    当前: auto / 主模型
[ ] profile_describer    当前: auto / 主模型
```

选择一个任务，选择一个提供商（OAuth流程会打开浏览器；API密钥提供商则提示输入），选择一个模型。更改将持久化到`config.yaml`中的`auxiliary.<task>.*`。这与主模型选择器使用相同的机制——无需学习额外语法。

### 视频教程

<div style={{position: 'relative', width: '100%', aspectRatio: '16 / 9', marginBottom: '1.5rem'}}>
  <iframe
    src="https://www.youtube.com/embed/NoF-YajElIM"
    title="Hermes Agent — 辅助模型教程"
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0}}
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

### 通用配置模式

Hermes中的每个模型槽位——辅助任务、压缩、回退——都使用相同的三个旋钮：

| 键 | 作用 | 默认值 |
|-----|-------------|---------|
| `provider` | 用于身份验证和路由的提供商 | `"auto"` |
| `model` | 要请求的模型 | 提供商默认值 |
| `base_url` | 自定义兼容OpenAI的端点（覆盖提供商） | 未设置 |

当设置`base_url`时，Hermes会忽略提供商并直接调用该端点（使用`api_key`或`OPENAI_API_KEY`进行身份验证）。当仅设置`provider`时，Hermes会使用该提供商的内置身份验证和基础URL。

辅助任务的可用提供商：`auto`、`main`，以及[提供商注册表](/reference/environment-variables)中的任何提供商——`openrouter`、`nous`、`openai-codex`、`copilot`、`copilot-acp`、`anthropic`、`gemini`、`google-gemini-cli`、`qwen-oauth`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`minimax-oauth`、`deepseek`、`nvidia`、`xai`、`xai-oauth`、`ollama-cloud`、`alibaba`、`bedrock`、`huggingface`、`arcee`、`xiaomi`、`kilocode`、`opencode-zen`、`opencode-go`、`azure-foundry`——或您`custom_providers`列表中的任何命名自定义提供商（例如`provider: "beans"`）。

:::tip MiniMax OAuth
`minimax-oauth`通过浏览器OAuth登录（无需API密钥）。运行`hermes model`并选择**MiniMax (OAuth)**进行认证。辅助任务会自动使用`MiniMax-M2.7-highspeed`。请参阅[MiniMax OAuth指南](../guides/minimax-oauth.md)。
:::

:::tip xAI Grok OAuth
`xai-oauth`为SuperGrok和X Premium+订阅者通过浏览器OAuth登录（无需API密钥）。运行`hermes model`并选择**xAI Grok OAuth (SuperGrok / Premium+)**进行认证。同一个OAuth令牌会重用于所有直接连接到xAI的表面（聊天、辅助任务、TTS、图像生成、视频生成、转录）。请参阅[xAI Grok OAuth指南](../guides/xai-grok-oauth.md)，如果Hermes在远程主机上，请参阅[通过SSH/远程主机进行OAuth](../guides/oauth-over-ssh.md)。
:::

:::warning `"main"`仅用于辅助任务
`"main"`提供商选项表示“使用我的主智能体使用的任何提供商”——它仅在`auxiliary:`、`compression:`和`fallback_model:`配置中有效。它**不是**您顶级`model.provider`设置的有效值。如果您使用自定义的兼容OpenAI的端点，请在`model:`部分设置`provider: custom`。有关所有主模型提供商选项，请参阅[AI提供商](/integrations/providers)。
:::

### 完整辅助配置参考

```yaml
auxiliary:
  # 图像分析（vision_analyze工具 + 浏览器截图）
  vision:
    provider: "auto"           # "auto", "openrouter", "nous", "codex", "main" 等
    model: ""                  # 例如 "openai/gpt-4o", "google/gemini-2.5-flash"
    base_url: ""               # 自定义兼容OpenAI的端点（覆盖提供商）
    api_key: ""                # 用于base_url的API密钥（回退到OPENAI_API_KEY）
    timeout: 120               # 秒 — LLM API调用超时；视觉负载需要充裕的超时时间
    download_timeout: 30       # 秒 — 图像HTTP下载；对于慢速连接请增加此值

  # 网页摘要 + 浏览器页面文本提取
  web_extract:
    provider: "auto"
    model: ""                  # 例如 "google/gemini-2.5-flash"
    base_url: ""
    api_key: ""
    timeout: 360               # 秒（6分钟） — 每次尝试的LLM摘要化

  # 危险命令审批分类器
  approval:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30                # 秒

  # 上下文压缩超时（独立于compression.*配置）
  compression:
    timeout: 120               # 秒 — 压缩会总结长对话，需要更多时间

  # 技能中心 — 技能匹配与搜索
  skills_hub:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

  # MCP工具调度
  mcp:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

  # 看板分流指定器 — `hermes kanban specify <id>`（或仪表盘上
  # Triage列卡片的✨指定按钮）使用此槽位将一行描述扩展为具体规范
  # 并将任务提升到`todo`。廉价快速的模型在此处效果很好；规范扩展
  # 内容较短且不需要推理深度。
  triage_specifier:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 120
```

:::tip
每个辅助任务都有一个可配置的`timeout`（以秒为单位）。默认值：vision 120秒，web_extract 360秒，approval 30秒，compression 120秒。如果您使用慢速本地模型执行辅助任务，请增加这些值。Vision还有一个单独的`download_timeout`（默认30秒）用于HTTP图像下载——对于慢速连接或自托管图像服务器，请增加此值。
:::

:::info
上下文压缩有其自己的`compression:`块用于阈值，以及一个`auxiliary.compression:`块用于模型/提供商设置——请参阅上方的[上下文压缩](#上下文压缩)。回退模型使用`fallback_model:`块——请参阅[回退模型](/integrations/providers#fallback-providers)。这三者都遵循相同的provider/model/base_url模式。
:::

### 辅助任务的OpenRouter路由和Pareto Code

当辅助任务解析为OpenRouter时（无论是显式设置还是通过`provider: "main"`且您的主智能体在OpenRouter上），主智能体的`provider_routing`和`openrouter.min_coding_score`设置**不会传播**——设计上，每个辅助任务都是独立的。要为特定辅助任务设置OpenRouter提供商偏好或使用[Pareto Code路由器](/integrations/providers#openrouter-pareto-code-router)，请通过`extra_body`逐任务设置：

```yaml
auxiliary:
  compression:
    provider: openrouter
    model: openrouter/pareto-code         # 使用Pareto Code路由器执行此任务
    extra_body:
      provider:                            # OpenRouter提供商路由偏好
        order: [anthropic, google]         # 按顺序尝试这些提供商
        sort: throughput                   # 或 "price" | "latency"
        # only: [anthropic]                # 限制到特定提供商
        # ignore: [deepinfra]              # 排除特定提供商
      plugins:                             # OpenRouter Pareto Code路由器旋钮
        - id: pareto-router
          min_coding_score: 0.5            # 0.0–1.0；越高表示要求更强的编码能力
```

其结构与OpenRouter在聊天完成请求体中接受的格式一致。Hermes会原样转发整个`extra_body`，因此任何其他在[openrouter.ai/docs](https://openrouter.ai/docs)文档中记录的OpenRouter请求体字段都可以同样使用。

### 更改视觉模型

要使用GPT-4o代替Gemini Flash进行图像分析：

```yaml
auxiliary:
  vision:
    model: "openai/gpt-4o"
```

或通过环境变量（在`~/.hermes/.env`中）：

```bash
AUXILIARY_VISION_MODEL=openai/gpt-4o
```

### 提供商选项

这些选项适用于**辅助任务配置**（`auxiliary:`、`compression:`、`fallback_model:`），而不适用于您的主`model.provider`设置。

| 提供商 | 描述 | 要求 |
|----------|-------------|-------------|
| `"auto"` | 可用的最佳选择（默认）。Vision尝试OpenRouter → Nous → Codex。 | — |
| `"openrouter"` | 强制使用OpenRouter — 路由到任何模型（Gemini、GPT-4o、Claude等） | `OPENROUTER_API_KEY` |
| `"nous"` | 强制使用Nous Portal | `hermes auth` |
| `"codex"` | 强制使用Codex OAuth（ChatGPT账户）。支持视觉（gpt-5.3-codex）。 | `hermes model` → Codex |
| `"minimax-oauth"` | 强制使用MiniMax OAuth（浏览器登录，无需API密钥）。辅助任务使用MiniMax-M2.7-highspeed。 | `hermes model` → MiniMax (OAuth) |
| `"xai-oauth"` | 强制使用xAI Grok OAuth（为SuperGrok或X Premium+订阅者浏览器登录，无需API密钥）。同一个OAuth令牌涵盖聊天、TTS、图像、视频和转录。 | `hermes model` → xAI Grok OAuth (SuperGrok / Premium+) |
| `"main"` | 使用您活动的自定义/主端点。这可以来自`OPENAI_BASE_URL` + `OPENAI_API_KEY`，或通过`hermes model` / `config.yaml`保存的自定义端点。适用于OpenAI、本地模型或任何兼容OpenAI的API。**仅限辅助任务 — 对`model.provider`无效。** | 自定义端点凭据 + 基础URL |

当您希望绕过默认路由器执行附带任务时，主提供商目录中的直接API密钥提供商在此处也同样适用。配置`GMI_API_KEY`后，`gmi`即有效：

```yaml
auxiliary:
  compression:
    provider: "gmi"
    model: "anthropic/claude-opus-4.6"
```

对于GMI辅助路由，请使用GMI的`/v1/models`端点返回的确切模型ID。

### 常见设置

**使用直接自定义端点**（对于本地/自托管API，比`provider: "main"`更清晰）：
```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url`优先于`provider`，因此这是将辅助任务路由到特定端点的最明确方式。对于直接端点覆盖，Hermes使用配置的`api_key`或回退到`OPENAI_API_KEY`；它不会为该自定义端点重用`OPENROUTER_API_KEY`。

**使用OpenAI API密钥进行视觉处理：**
```yaml
# 在 ~/.hermes/.env 中：
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_API_KEY=sk-...

auxiliary:
  vision:
    provider: "main"
    model: "gpt-4o"       # 或 "gpt-4o-mini" 更便宜
```

**使用OpenRouter进行视觉处理**（路由到任何模型）：
```yaml
auxiliary:
  vision:
    provider: "openrouter"
    model: "openai/gpt-4o"      # 或 "google/gemini-2.5-flash" 等
```

**使用Codex OAuth**（ChatGPT Pro/Plus账户 — 无需API密钥）：
```yaml
auxiliary:
  vision:
    provider: "codex"     # 使用您的ChatGPT OAuth令牌
    # 模型默认为 gpt-5.3-codex（支持视觉）
```

**使用MiniMax OAuth**（浏览器登录，无需API密钥）：
```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-oauth
  base_url: https://api.minimax.io/anthropic
```
运行`hermes model`并选择**MiniMax (OAuth)**进行登录和自动设置。对于中国大陆地区，基础URL将是`https://api.minimaxi.com/anthropic`。完整操作步骤请参阅[MiniMax OAuth指南](../guides/minimax-oauth.md)。

**使用本地/自托管模型：**
```yaml
auxiliary:
  vision:
    provider: "main"      # 使用您活动的自定义端点
    model: "my-local-model"
```

`provider: "main"`使用Hermes用于正常聊天的任何提供商——无论是命名的自定义提供商（例如`beans`），还是内置提供商如`openrouter`，或是旧的`OPENAI_BASE_URL`端点。

:::tip
如果您使用Codex OAuth作为主模型提供商，视觉功能可自动工作——无需额外配置。Codex包含在视觉处理的自动检测链中。
:::

:::warning
**视觉处理需要多模态模型。** 如果您设置`provider: "main"`，请确保您的端点支持多模态/视觉——否则图像分析将失败。
:::

### 环境变量（旧版）

辅助模型也可以通过环境变量配置。但是，`config.yaml`是首选方法——它更易于管理并支持所有选项，包括`base_url`和`api_key`。

| 设置 | 环境变量 |
|---------|---------------------|
| Vision 提供商 | `AUXILIARY_VISION_PROVIDER` |
| Vision 模型 | `AUXILIARY_VISION_MODEL` |
| Vision 端点 | `AUXILIARY_VISION_BASE_URL` |
| Vision API密钥 | `AUXILIARY_VISION_API_KEY` |
| Web extract 提供商 | `AUXILIARY_WEB_EXTRACT_PROVIDER` |
| Web extract 模型 | `AUXILIARY_WEB_EXTRACT_MODEL` |
| Web extract 端点 | `AUXILIARY_WEB_EXTRACT_BASE_URL` |
| Web extract API密钥 | `AUXILIARY_WEB_EXTRACT_API_KEY` |

压缩和回退模型设置仅在config.yaml中配置。

:::tip
运行`hermes config`以查看您当前的辅助模型设置。覆盖项仅在与默认值不同时才会显示。
:::

## 推理强度

控制模型在响应前进行多少“思考”：

```yaml
agent:
  reasoning_effort: ""   # 空值 = 中等（默认）。选项：none, minimal, low, medium, high, xhigh（最大）
```

未设置时（默认），推理强度默认为“中等”——这是一个适用于大多数任务的平衡级别。设置一个值会覆盖它——更高的推理强度在复杂任务上能提供更好的结果，但代价是消耗更多令牌并增加延迟。

你也可以使用 `/reasoning` 命令在运行时更改推理强度：

```
/reasoning           # 显示当前强度级别并显示状态
/reasoning high      # 将推理强度设置为 high
/reasoning none      # 禁用推理
/reasoning show      # 在每个响应上方显示模型思考过程
/reasoning hide      # 隐藏模型思考过程
```

## 工具使用强制

某些模型偶尔会以文本形式描述意图的动作，而不是实际调用工具（例如说“我会运行测试……”而不是实际调用终端）。工具使用强制会向系统提示注入指导，引导模型回归到实际调用工具的行为。

```yaml
agent:
  tool_use_enforcement: "auto"   # "auto" | true | false | ["model-substring", ...]
```

| 值 | 行为 |
|-------|----------|
| `"auto"`（默认） | 对匹配以下模式的模型启用：`gpt`、`codex`、`gemini`、`gemma`、`grok`。对所有其他模型（Claude、DeepSeek、Qwen 等）禁用。 |
| `true` | 无论模型如何，始终启用。如果你注意到当前模型描述意图而不是执行操作，此选项很有用。 |
| `false` | 无论模型如何，始终禁用。 |
| `["gpt", "codex", "qwen", "llama"]` | 仅当模型名称包含所列子字符串之一时启用（不区分大小写）。 |

### 注入内容

启用时，可能会向系统提示添加三层指导：

1. **通用工具使用强制**（所有匹配的模型）——指示模型立即进行工具调用，而不是描述意图，持续工作直到任务完成，并且绝不以未来行动的承诺结束对话。

2. **OpenAI 执行规范**（仅限 GPT 和 Codex 模型）——针对 GPT 特定失败模式的额外指导：在部分结果时放弃工作、跳过前置查询、不使用工具而是产生幻觉、以及在未验证的情况下宣布“完成”。

3. **Google 操作指导**（仅限 Gemini 和 Gemma 模型）——简洁性、绝对路径、并行工具调用以及编辑前验证模式。

这些对用户是透明的，只影响系统提示。已经可靠使用工具的模型（如 Claude）不需要此指导，这就是为什么 `"auto"` 会排除它们。

### 何时启用

如果你使用的模型不在默认自动列表中，并且注意到它经常描述它 *将会* 做什么而不是实际去做，请设置 `tool_use_enforcement: true` 或将模型子字符串添加到列表中：

```yaml
agent:
  tool_use_enforcement: ["gpt", "codex", "gemini", "grok", "my-custom-model"]
```

# TTS 配置

```yaml
tts:
  provider: "edge"              # "edge" | "elevenlabs" | "openai" | "minimax" | "mistral" | "gemini" | "xai" | "neutts"
  speed: 1.0                    # 全局速度倍增器（所有提供商的回退值）
  edge:
    voice: "en-US-AriaNeural"   # 322 种声音，74 种语言
    speed: 1.0                  # 速度倍增器（转换为百分比速率，例如 1.5 → +50%）
  elevenlabs:
    voice_id: "pNInz6obpgDQGcFmaJgB"
    model_id: "eleven_multilingual_v2"
  openai:
    model: "gpt-4o-mini-tts"
    voice: "alloy"              # alloy, echo, fable, onyx, nova, shimmer
    speed: 1.0                  # 速度倍增器（API 限制在 0.25–4.0 之间）
    base_url: "https://api.openai.com/v1"  # 用于兼容 OpenAI 的 TTS 端点的覆盖地址
  minimax:
    speed: 1.0                  # 语音速度倍增器
    # base_url: ""              # 可选：用于兼容 OpenAI 的 TTS 端点的覆盖地址
  mistral:
    model: "voxtral-mini-tts-2603"
    voice_id: "c69964a6-ab8b-4f8a-9465-ec0925096ec8"  # Paul - 中性（默认）
  gemini:
    model: "gemini-2.5-flash-preview-tts"   # 或 gemini-2.5-pro-preview-tts
    voice: "Kore"               # 30 种预置声音：Zephyr, Puck, Kore, Enceladus 等。
  xai:
    voice_id: "eve"             # xAI TTS 声音
    language: "en"              # ISO 639-1
    sample_rate: 24000
    bit_rate: 128000            # MP3 比特率
    # base_url: "https://api.x.ai/v1"
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
```

这控制了 `text_to_speech` 工具和语音模式下的回复（CLI 中的 `/voice tts` 或消息网关）。

**速度回退层级：** 特定于提供商的速度（例如 `tts.edge.speed`）→ 全局 `tts.speed` → 默认值 `1.0`。设置全局 `tts.speed` 可为所有提供商应用统一速度，或按提供商覆盖以进行细粒度控制。

## 显示设置

```yaml
display:
  tool_progress: all      # off | new | all | verbose
  tool_progress_command: false  # 在消息网关中启用 /verbose 斜杠命令
  platforms: {}           # 每个平台的显示覆盖（见下文）
  tool_progress_overrides: {}  # 已弃用 — 请改用 display.platforms
  interim_assistant_messages: true  # 网关：将自然的中间轮次助手更新作为单独消息发送
  skin: default           # 内置或自定义 CLI 皮肤（参见 user-guide/features/skins）
  personality: "kawaii"  # 旧版美化字段，在某些摘要中仍会显示
  compact: false          # 紧凑输出模式（减少空白）
  resume_display: full    # full（恢复时显示先前的消息）| minimal（仅显示一行）
  bell_on_complete: false # 智能体完成时播放终端铃声（适用于长任务）
  show_reasoning: false   # 在每个回复上方显示模型推理/思考（用 /reasoning show|hide 切换）
  streaming: false        # 在终端中实时流式传输 token（实时输出）
  show_cost: false        # 在 CLI 状态栏中显示估算的 $ 成本
  timestamps: false       # 如果为 true，则在 CLI / TUI 会话记录中为用户和助手标签添加 [HH:MM] 时间戳
  tool_preview_length: 0  # 工具调用预览的最大字符数（0 = 无限制，显示完整路径/命令）
  runtime_footer:         # 网关：在最终回复中附加运行时上下文页脚
    enabled: false
    fields: ["model", "context_pct", "cwd"]
  file_mutation_verifier: true    # 当 write_file/patch 调用失败时附加咨询性页脚
  language: en            # 静态消息的 UI 语言（审批提示、某些网关回复）。en | zh | zh-hant | ja | de | es | fr | tr | uk | af | ko | it | ga | pt | ru | hu
```

### 文件修改验证器

当 `display.file_mutation_verifier` 为 `true`（默认值）时，如果本轮中有 `write_file` 或 `patch` 调用失败且未被对同一路径的成功写入所覆盖，Hermes 会在助手的最终响应中附加一行咨询性消息。这可以捕捉到“一批并行补丁，一半悄悄失败，模型却总结为成功”这类过度声称的情况，无需您在每次编辑后手动运行 `git status`。

示例页脚：

```
⚠️ 文件修改验证器：本轮有 3 个文件未被修改，尽管上述任何措辞可能暗示其他情况。运行 `git status` 或 `read_file` 进行确认。
  • concepts/automatic-organization.md — [patch] 未找到 old_string 的匹配项
  • concepts/lora.md — [patch] 未找到 old_string 的匹配项
  • concepts/rag-pipeline.md — [patch] 未找到 old_string 的匹配项
```

设置 `file_mutation_verifier: false`（或 `HERMES_FILE_MUTATION_VERIFIER=0`）可禁止显示此页脚。验证器仅在轮次结束时存在真正的失败时才会触发 — 如果模型在同一轮次中重试失败的补丁并成功，则不会针对该文件触发。

### 静态消息的 UI 语言

`display.language` 设置翻译一小组静态用户面向消息 — CLI 审批提示、少量网关斜杠命令回复（例如，重启排空通知、“审批已过期”、“目标已清除”）。它**不**翻译智能体回复、日志行、工具输出、错误回溯或斜杠命令描述 — 这些内容保持英文。如果您希望智能体本身用另一种语言回复，只需在提示或系统消息中告知即可。

支持的值：`en`（默认）、`zh`（简体中文）、`ja`（日语）、`de`（德语）、`es`（西班牙语）、`fr`（法语）、`tr`（土耳其语）、`uk`（乌克兰语）。未知值回退为英文。

您也可以使用 `HERMES_LANGUAGE` 环境变量按会话设置此值，它会覆盖配置值。

```yaml
display:
  language: zh   # CLI 审批提示显示为中文
```

| 模式 | 您会看到什么 |
|------|-------------|
| `off` | 静默 — 仅最终回复 |
| `new` | 仅当工具更改时显示工具指示器 |
| `all` | 每个工具调用带简短预览（默认） |
| `verbose` | 完整参数、结果和调试日志 |

在 CLI 中，用 `/verbose` 循环切换这些模式。要在消息平台（Telegram、Discord、Slack 等）中使用 `/verbose`，请在上面的 `display` 部分设置 `tool_progress_command: true`。该命令随后将循环切换模式并保存到配置。

### 运行时元数据页脚（仅限网关）

当 `display.runtime_footer.enabled: true` 时，Hermes 会在每个网关轮次的**最终**消息后附加一个小的运行时上下文页脚 — 与 CLI 在其状态栏中显示的信息相同（模型、上下文百分比、工作目录、会话持续时间、令牌数、成本）。默认关闭；如果您的团队希望每个回复都包含来源信息，可按网关选择加入。

```yaml
display:
  runtime_footer:
    enabled: true
    fields: ["model", "context_pct", "cwd"]   # 任意：model, context_pct, cwd, duration, tokens, cost
```

在任何会话中，`/footer` 斜杠命令可在运行时切换此设置。

附加到 Telegram/Discord/Slack 回复的示例页脚：

```
— claude-opus-4.7 · 12 次工具调用 · 2分14秒 · $0.042
```

仅轮次的**最终**消息会获得页脚；中间更新保持简洁。

### 每个平台的进度覆盖

不同的平台有不同的详细程度需求。例如，Signal 无法编辑消息，因此每次进度更新都会成为单独的消息 — 很嘈杂。使用 `display.platforms` 设置每平台模式：

```yaml
display:
  tool_progress: all          # 全局默认
  platforms:
    signal:
      tool_progress: 'off'    # 在 Signal 上静默进度
    telegram:
      tool_progress: verbose  # 在 Telegram 上显示详细进度
    slack:
      tool_progress: 'off'    # 在共享的 Slack 工作区中保持安静
```

没有覆盖的平台回退到全局 `tool_progress` 值。有效的平台键：`telegram`、`discord`、`slack`、`signal`、`whatsapp`、`matrix`、`mattermost`、`email`、`sms`、`homeassistant`、`dingtalk`、`feishu`、`wecom`、`weixin`、`bluebubbles`、`qqbot`。旧版 `display.tool_progress_overrides` 键仍会加载以保持向后兼容，但已弃用，并在首次加载时迁移到 `display.platforms`。

`interim_assistant_messages` 仅限网关。启用后，Hermes 会将已完成的中间轮次助手更新作为单独的聊天消息发送。这与 `tool_progress` 独立，并且不需要网关流式传输。

## 隐私

```yaml
privacy:
  redact_pii: false  # 在 LLM 上下文中隐藏个人身份信息（仅网关）
```

当 `redact_pii` 为 `true` 时，网关会在支持的平台上将系统提示中的个人身份信息移除后再发送给 LLM：

| 字段 | 处理方式 |
|-------|-----------|
| 电话号码（WhatsApp/Signal 的用户ID） | 哈希为 `user_<12字符sha256>` |
| 用户ID | 哈希为 `user_<12字符sha256>` |
| 聊天ID | 数字部分哈希，平台前缀保留（`telegram:<哈希>`） |
| 主频道ID | 数字部分哈希 |
| 用户名 | **不受影响**（用户自选，公开可见） |

**平台支持：** 脱敏适用于 WhatsApp、Signal 和 Telegram。Discord 和 Slack 被排除，因为它们的提及系统（`<@user_id>`）需要在 LLM 上下文中使用真实 ID。

哈希是确定性的——同一用户始终映射到相同的哈希，因此模型仍可在群聊中区分用户。路由和内部投递仍使用原始值。

## 语音转文字 (STT)

```yaml
stt:
  provider: "local"            # "local" | "groq" | "openai" | "mistral"
  local:
    model: "base"              # tiny, base, small, medium, large-v3
  openai:
    model: "whisper-1"         # whisper-1 | gpt-4o-mini-transcribe | gpt-4o-transcribe
  # model: "whisper-1"         # 仍支持的旧版回退键
```

提供商行为：

- `local` 使用在您的机器上运行的 `faster-whisper`。请单独通过 `pip install faster-whisper` 安装。
- `groq` 使用 Groq 的 Whisper 兼容端点，并读取 `GROQ_API_KEY`。
- `openai` 使用 OpenAI 语音 API，并读取 `VOICE_TOOLS_OPENAI_KEY`。

如果请求的提供商不可用，Hermes 会按此顺序自动回退：`local` → `groq` → `openai`。

Groq 和 OpenAI 的模型覆盖由环境变量驱动：

```bash
STT_GROQ_MODEL=whisper-large-v3-turbo
STT_OPENAI_MODEL=whisper-1
GROQ_BASE_URL=https://api.groq.com/openai/v1
STT_OPENAI_BASE_URL=https://api.openai.com/v1
```

## 语音模式（CLI）

```yaml
voice:
  record_key: "ctrl+b"         # CLI 内按住说话键
  max_recording_seconds: 120    # 长时间录音的硬停止
  auto_tts: false               # 当使用 /voice on 时自动启用语音回复
  beep_enabled: true            # 在 CLI 语音模式下播放录音开始/停止提示音
  silence_threshold: 200        # 语音检测的均方根阈值
  silence_duration: 3.0         # 自动停止前的静音秒数
```

在 CLI 中使用 `/voice on` 启用麦克风模式，`record_key` 开始/停止录音，`/voice tts` 切换语音回复。有关端到端设置和平台特定行为，请参阅[语音模式](/user-guide/features/voice-mode)。

## 流式传输

在终端或消息平台上流式传输 token，而不是等待完整响应。

### CLI 流式传输

```yaml
display:
  streaming: true         # 实时向终端流式传输 token
  show_reasoning: true    # 同时流式传输推理/思考 token（可选）
```

启用后，响应会逐个 token 出现在流式传输框中。工具调用仍会静默捕获。如果提供商不支持流式传输，系统会自动回退到正常显示。

### 网关流式传输（Telegram、Discord、Slack）

```yaml
streaming:
  enabled: true           # 启用渐进式消息编辑
  transport: edit         # "edit"（渐进式消息编辑）或 "off"
  edit_interval: 0.3      # 消息编辑间隔秒数
  buffer_threshold: 40    # 强制刷新前的字符数
  cursor: " ▉"            # 流式传输期间显示的光标
  fresh_final_after_seconds: 60   # 当预览消息过时时（Telegram）发送新的最终消息；0 = 始终就地编辑
```

启用后，机器人会在收到第一个 token 时发送一条消息，然后随着更多 token 到达而逐步编辑。不支持消息编辑的平台（Signal、Email、Home Assistant）会在首次尝试时自动检测——该会话的流式传输会被优雅地禁用，不会产生大量消息。

若需在流式 token 编辑之外单独获得自然的轮内助手更新，请设置 `display.interim_assistant_messages: true`。

**溢出处理：** 如果流式传输的文本超过平台的消息长度限制（约 4096 个字符），当前消息将被最终确定，并自动开始新消息。

**最终新消息（Telegram）：** Telegram 的 `editMessageText` 会保留原始消息时间戳，因此长时间运行的流式回复即使在完成后仍会保持第一个 token 的时间戳。当 `fresh_final_after_seconds > 0`（默认为 `60`）时，完成的回复将作为全新消息发送（并尽力删除陈旧的预览），以便 Telegram 的可见时间戳反映完成时间。简短的预览仍会就地完成。设置为 `0` 则始终就地编辑。

:::note
流式传输默认禁用。在 `~/.hermes/config.yaml` 中启用它以尝试流式传输用户体验。
:::

## 群聊会话隔离

控制共享聊天是保持每个房间一个对话还是每个参与者一个对话：

```yaml
group_sessions_per_user: true  # true = 在群组/频道中按用户隔离，false = 每个聊天一个共享会话
```

- `true` 是默认且推荐的设置。在 Discord 频道、Telegram 群组、Slack 频道等共享上下文中，当平台提供用户 ID 时，每个发送者都会获得自己的会话。
- `false` 会恢复到旧的共享房间行为。如果你明确希望 Hermes 将频道视为一个协作对话，这可能很有用，但这也意味着用户会共享上下文、token 成本和中断状态。
- 直接消息不受影响。Hermes 仍然像往常一样通过聊天/DM ID 来标识 DM。
- 无论哪种方式，线程都与其父频道隔离；当设置为 `true` 时，每个参与者在线程内也会获得自己的会话。

有关行为详情和示例，请参阅[会话](/user-guide/sessions)和 [Discord 指南](/user-guide/messaging/discord)。

## 未授权 DM 行为

控制当未知用户发送直接消息时 Hermes 的行为：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `pair` 是默认值。Hermes 拒绝访问，但在 DM 中回复一个一次性配对码。
- `ignore` 会静默丢弃未授权的 DM。
- 平台特定部分会覆盖全局默认值，因此你可以广泛启用配对，同时让某个平台更安静。

## 快速命令

定义自定义命令，这些命令可以运行 shell 命令而不调用 LLM，或者将一个斜杠命令别名为另一个。执行快速命令不消耗 token，可用于消息平台（Telegram、Discord 等）进行快速服务器检查或实用脚本。

```yaml
quick_commands:
  status:
    type: exec
    command: systemctl status hermes-agent
  disk:
    type: exec
    command: df -h /
  update:
    type: exec
    command: cd ~/.hermes/hermes-agent && git pull && pip install -e .
  gpu:
    type: exec
    command: nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total --format=csv,noheader
  restart:
    type: alias
    target: /gateway restart
```

用法：在 CLI 或任何消息平台中键入 `/status`、`/disk`、`/update`、`/gpu` 或 `/restart`。`exec` 命令在本地主机上运行并直接返回输出——不调用 LLM，不消耗 token。`alias` 命令会重写为配置的斜杠命令目标。

- **30 秒超时** — 长时间运行的命令会被终止并显示错误消息
- **优先级** — 快速命令在技能命令之前检查，因此你可以覆盖技能名称
- **自动补全** — 快速命令在分发时解析，不会显示在内置的斜杠命令自动补全表中
- **类型** — 支持的类型为 `exec` 和 `alias`；其他类型会显示错误
- **通用** — CLI、Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant

仅包含字符串的提示快捷方式不是有效的快速命令。对于可重用的提示工作流，请创建一个技能或别名到现有的斜杠命令。

## 人类延迟

在消息平台上模拟类似人类的响应节奏：

```yaml
human_delay:
  mode: "off"                  # off | natural | custom
  min_ms: 800                  # 最小延迟（自定义模式）
  max_ms: 2500                 # 最大延迟（自定义模式）
```

## 代码执行

配置 `execute_code` 工具：

```yaml
code_execution:
  mode: project                # project (默认) | strict
  timeout: 300                 # 最大执行时间（秒）
  max_tool_calls: 50           # 代码执行内的最大工具调用次数
```

**`mode`** 控制脚本的工作目录和 Python 解释器：

- **`project`**（默认）— 脚本在会话的工作目录中运行，使用活动的 virtualenv/conda 环境的 python。项目依赖项（`pandas`、`torch`、项目包）和相对路径（`.env`、`./data.csv`）会自然解析，与 `terminal()` 看到的一致。
- **`strict`** — 脚本在临时暂存目录中运行，使用 `sys.executable`（Hermes 自己的 python）。可重现性最高，但项目依赖项和相对路径将无法解析。

环境清理（剥离 `*_API_KEY`、`*_TOKEN`、`*_SECRET`、`*_PASSWORD`、`*_CREDENTIAL`、`*_PASSWD`、`*_AUTH`）和工具白名单在两种模式下完全相同——切换模式不会改变安全状况。

## 网络搜索后端

`web_search` 和 `web_extract` 工具支持五种后端提供商。在 `config.yaml` 中或通过 `hermes tools` 配置后端：

```yaml
web:
  backend: firecrawl    # firecrawl | searxng | parallel | tavily | exa

  # 或者使用按功能分类的密钥来混合提供商（例如，免费搜索 + 付费提取）：
  search_backend: "searxng"
  extract_backend: "firecrawl"
```

| 后端 | 环境变量 | 搜索 | 提取 |
|---------|---------|--------|---------|
| **Firecrawl**（默认） | `FIRECRAWL_API_KEY` | ✔ | ✔ |
| **SearXNG** | `SEARXNG_URL` | ✔ | — |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ |

**后端选择：** 如果未设置 `web.backend`，后端将从可用的 API 密钥中自动检测。如果仅设置 `SEARXNG_URL`，则使用 SearXNG。如果仅设置 `EXA_API_KEY`，则使用 Exa。如果仅设置 `TAVILY_API_KEY`，则使用 Tavily。如果仅设置 `PARALLEL_API_KEY`，则使用 Parallel。否则 Firecrawl 为默认。

**SearXNG** 是一个免费、自托管、尊重隐私的元搜索引擎，可查询 70 多个搜索引擎。无需 API 密钥——只需将 `SEARXNG_URL` 设置为你的实例（例如，`http://localhost:8080`）。SearXNG 仅支持搜索；`web_extract` 需要单独的提取提供商（设置 `web.extract_backend`）。有关 Docker 设置说明，请参阅[网络搜索设置指南](/user-guide/features/web-search)。

**自托管 Firecrawl：** 设置 `FIRECRAWL_API_URL` 指向你自己的实例。当设置了自定义 URL 时，API 密钥变为可选（在服务器上设置 `USE_DB_AUTHENTICATION=***` 以禁用身份验证）。

**并行搜索模式：** 设置 `PARALLEL_SEARCH_MODE` 以控制搜索行为——`fast`、`one-shot` 或 `agentic`（默认：`agentic`）。

**Exa：** 在 `~/.hermes/.env` 中设置 `EXA_API_KEY`。支持 `category` 过滤（`company`、`research paper`、`news`、`people`、`personal site`、`pdf`）以及域/日期过滤器。

## 浏览器

配置浏览器自动化行为：

```yaml
browser:
  inactivity_timeout: 120        # 空闲会话自动关闭前的秒数
  command_timeout: 30             # 浏览器命令（截图、导航等）的超时时间（秒）
  record_sessions: false         # 自动将浏览器会话录制为 WebM 视频，保存至 ~/.hermes/browser_recordings/
  # 可选的 CDP 覆盖 — 设置后，Hermes 将直接连接到您自己的
  # Chromium 系列浏览器（通过 /browser connect），而不是启动无头浏览器。
  cdp_url: ""
  # 对话框监管器 — 控制当附加 CDP 后端时（Browserbase、通过 /browser connect 连接的本地 Chromium 系列
  # 浏览器），如何处理原生 JS 对话框（alert / confirm / prompt）。在 Camofox 和默认的本地 agent-browser 模式下会被忽略。
  dialog_policy: must_respond    # must_respond | auto_dismiss | auto_accept
  dialog_timeout_s: 300          # must_respond 下的安全自动关闭时间（秒）
  camofox:
    managed_persistence: false   # 为 true 时，Camofox 会话会在重启间保持 cookie/登录状态
    user_id: ""                  # 可选的外部管理的 Camofox 用户 ID
    session_key: ""              # Hermes 创建标签页时发送的可选会话密钥
    adopt_existing_tab: false    # 为此身份复用现有标签页，而不是创建新标签页
```

**对话框策略：**

- `must_respond`（默认） — 捕获对话框，在 `browser_snapshot.pending_dialogs` 中显示，并等待智能体调用 `browser_dialog(action=...)`。如果 `dialog_timeout_s` 秒后无响应，对话框将被自动关闭，以防止页面的 JS 线程永久阻塞。
- `auto_dismiss` — 捕获后立即关闭。事后，智能体仍可在 `browser_snapshot.recent_dialogs` 中看到该对话框记录，其中 `closed_by="auto_policy"`。
- `auto_accept` — 捕获后立即接受。适用于具有激进 `beforeunload` 提示的页面。

请参阅[浏览器功能页面](./features/browser.md#browser_dialog)了解完整的对话框工作流程。

该浏览器工具集支持多个提供商。有关 Browserbase、Browser Use 和本地 Chromium 系列 CDP 设置的详细信息，请参阅[浏览器功能页面](/user-guide/features/browser)。

## 时区

使用 IANA 时区字符串覆盖服务器本地时区。影响日志、定时任务和系统提示时间注入中的时间戳。

```yaml
timezone: "America/New_York"   # IANA 时区（默认值："" = 服务器本地时间）
```

支持的值：任何 IANA 时区标识符（例如 `America/New_York`、`Europe/London`、`Asia/Kolkata`、`UTC`）。留空或省略则使用服务器本地时间。

## Discord

为消息网关配置 Discord 特定行为：

```yaml
discord:
  require_mention: true          # 在服务器频道中，需要 @提及才能响应
  free_response_channels: ""     # 逗号分隔的频道 ID，智能体在这些频道无需 @提及即可响应
  auto_thread: true              # 在频道中 @提及时自动创建线程
```

- `require_mention` — 当设为 `true`（默认值）时，智能体仅在服务器频道中通过 `@BotName` 被提及时才响应。私信始终无需提及即可工作。
- `free_response_channels` — 逗号分隔的频道 ID 列表，智能体会响应这些频道中的每一条消息，无需提及。
- `auto_thread` — 当设为 `true`（默认值）时，在频道中的提及会自动为对话创建一个线程，保持频道整洁（类似于 Slack 线程）。

## Security

执行前的安全扫描与密钥脱敏：

```yaml
security:
  redact_secrets: false          # 在工具输出和日志中脱敏 API 密钥模式（默认关闭）
  tirith_enabled: true           # 为终端命令启用 Tirith 安全扫描
  tirith_path: "tirith"          # tirith 二进制文件的路径（默认：$PATH 中的 "tirith"）
  tirith_timeout: 5              # 等待 Tirith 扫描完成的超时秒数
  tirith_fail_open: true         # 如果 Tirith 不可用，是否允许命令执行
  website_blocklist:             # 请参阅下方的“网站黑名单”部分
    enabled: false
    domains: []
    shared_files: []
```

- `redact_secrets` — 当设为 `true` 时，在工具输出进入对话上下文和日志之前，会自动检测并脱敏看起来像 API 密钥、令牌和密码的模式。**默认关闭** — 如果你经常在工具输出中处理真实凭据并希望增加一层安全网，请启用此选项。需显式设置为 `true` 以开启。
- `tirith_enabled` — 当设为 `true` 时，终端命令在执行前会由 [Tirith](https://github.com/sheeki03/tirith) 进行扫描，以检测潜在的危险操作。
- `tirith_path` — tirith 二进制文件的路径。如果 tirith 安装在非标准位置，请设置此项。
- `tirith_timeout` — 等待 Tirith 扫描的最大秒数。如果扫描超时，命令将继续执行。
- `tirith_fail_open` — 当设为 `true`（默认值）时，如果 Tirith 不可用或失败，将允许命令执行。设为 `false` 以在 Tirith 无法验证命令时阻止执行。

## 网站黑名单

阻止智能体的网页和浏览器工具访问特定域名：

```yaml
security:
  website_blocklist:
    enabled: false               # 启用 URL 阻止（默认：false）
    domains:                     # 受阻域名模式列表
      - "*.internal.company.com"
      - "admin.example.com"
      - "*.local"
    shared_files:                # 从外部文件加载额外规则
      - "/etc/hermes/blocked-sites.txt"
```

启用后，任何匹配受阻域名模式的 URL 都会在网页或浏览器工具执行前被拒绝。这适用于 `web_search`、`web_extract`、`browser_navigate` 以及任何访问 URL 的工具。

域名规则支持：
- 精确域名：`admin.example.com`
- 通配符子域名：`*.internal.company.com`（阻止所有子域名）
- 顶级域名通配符：`*.local`

共享文件每行包含一个域名规则（忽略空行和 `#` 注释）。缺失或无法读取的文件会记录警告，但不会禁用其他网页工具。

该策略缓存 30 秒，因此配置更改无需重启即可快速生效。

## 智能审批

控制 Hermes 如何处理潜在的危险命令：

```yaml
approvals:
  mode: manual   # manual | smart | off
```

| 模式 | 行为 |
|------|------|
| `manual`（默认） | 在执行任何标记的命令前提示用户。在 CLI 中，显示一个交互式审批对话框。在消息应用中，将审批请求排队等待处理。 |
| `smart` | 使用一个辅助 LLM 来评估标记的命令是否确实危险。低风险命令会自动批准，并具有会话级别的持久性。真正危险的命令会被升级给用户处理。 |
| `off` | 跳过所有审批检查。等同于 `HERMES_YOLO_MODE=true`。**请谨慎使用。** |

智能模式对于减少审批疲劳特别有用 — 它让智能体能在安全操作上更自主地工作，同时仍能捕获真正具有破坏性的命令。

:::warning
设置 `approvals.mode: off` 会禁用终端命令的所有安全检查。仅在受信任的沙箱环境中使用此设置。
:::



## 检查点

在破坏性文件操作之前自动创建文件系统快照。详情请参阅 [检查点与回滚](/user-guide/checkpoints-and-rollback)。

```yaml
checkpoints:
  enabled: false                 # 启用自动检查点（也可通过：hermes chat --checkpoints）。默认：false（需手动启用）。
  max_snapshots: 20              # 每个目录保留的最大检查点数（默认：20）
```


## 委托

为委托工具配置子智能体行为：

```yaml
delegation:
  # model: "google/gemini-3-flash-preview"  # 覆盖模型（空值 = 继承父级）
  # provider: "openrouter"                  # 覆盖提供商（空值 = 继承父级）
  # base_url: "http://localhost:1234/v1"    # 直接连接 OpenAI 兼容端点（优先于 provider）
  # api_key: "local-key"                    # base_url 的 API 密钥（回退到 OPENAI_API_KEY）
  # api_mode: ""                            # base_url 的线路协议："chat_completions"、"codex_responses" 或 "anthropic_messages"。空值 = 根据 URL 自动检测（例如 /anthropic 后缀 → anthropic_messages）。对于启发式无法检测的非标准端点，请显式设置。
  max_concurrent_children: 3                # 每批并行的子任务数（最小值为 1，无上限）。也可通过 DELEGATION_MAX_CONCURRENT_CHILDREN 环境变量设置。
  max_spawn_depth: 1                        # 委托树深度上限（1-3，会进行限制）。1 = 平坦（默认）：父级生成无法再委托的叶子节点。2 = 编排器子任务可以生成叶子孙任务。3 = 三个层级。
  orchestrator_enabled: true                # 全局开关。设为 false 时，role="orchestrator" 将被忽略，且无论 max_spawn_depth 设置如何，每个子任务都被强制为叶子节点。
```

**子智能体提供商:模型覆盖：** 默认情况下，子智能体继承父智能体的提供商和模型。设置 `delegation.provider` 和 `delegation.model` 可将子智能体路由到不同的提供商:模型对 — 例如，使用廉价/快速的模型处理范围狭窄的子任务，而主智能体运行昂贵的推理模型。

**直接端点覆盖：** 如果你想使用明显的自定义端点路径，请设置 `delegation.base_url`、`delegation.api_key` 和 `delegation.model`。这会将子智能体直接发送到该 OpenAI 兼容端点，并且优先于 `delegation.provider`。如果省略 `delegation.api_key`，Hermes 将仅回退到 `OPENAI_API_KEY`。

**线路协议 (`api_mode`)：** Hermes 会根据 `delegation.base_url` 自动检测线路协议（例如路径以 `/anthropic` 结尾 → `anthropic_messages`；Codex / 原生 Anthropic / Kimi-coding 主机名保持其现有检测）。对于启发式无法分类的端点 — 例如 Azure AI Foundry、MiniMax、智谱 GLM 或代理 Anthropic 后端的 LiteLLM 代理 — 请显式设置 `delegation.api_mode` 为 `chat_completions`、`codex_responses` 或 `anthropic_messages` 之一。留空（默认值）以保持自动检测。

委托提供商使用与 CLI/网关启动相同的凭据解析。支持所有已配置的提供商：`openrouter`、`nous`、`copilot`、`zai`、`kimi-coding`、`minimax`、`minimax-cn`。设置提供商后，系统会自动解析正确的 base URL、API 密钥和 API 模式 — 无需手动配置凭据。

**优先级：** 配置中的 `delegation.base_url` → 配置中的 `delegation.provider` → 父级提供商（继承）。配置中的 `delegation.model` → 父级模型（继承）。仅设置 `model` 而不设置 `provider` 只会更改模型名称，同时保留父级的凭据（适用于在 OpenRouter 等同一提供商内切换模型）。

**宽度与深度：** `max_concurrent_children` 限制每批并行运行的子智能体数量（默认为 `3`，最小为 1，无上限）。也可通过 `DELEGATION_MAX_CONCURRENT_CHILDREN` 环境变量设置。当模型提交的任务数组 (`tasks`) 长度超过此限制时，`delegate_task` 会返回一个解释该限制的工具错误，而不是静默截断。`max_spawn_depth` 控制委托树的深度（限制在 1-3）。默认为 `1` 时，委托是平坦的：子任务无法生成孙任务，传递 `role="orchestrator"` 会静默降级为 `leaf`。提升到 `2` 可让编排器子任务生成叶子孙任务；`3` 则为三层树。智能体通过在每次调用中传递 `role="orchestrator"` 来选择编排；`orchestrator_enabled: false` 会强制每个子任务回到叶子节点，无论设置如何。成本按乘法增长 — 当 `max_spawn_depth: 3` 且 `max_concurrent_children: 3` 时，树可达到 3×3×3 = 27 个并发叶子智能体。有关使用模式，请参阅 [子智能体委托 → 深度限制与嵌套编排](features/delegation.md#depth-limit-and-nested-orchestration)。

## 配置澄清提示行为

```yaml
clarify:
  timeout: 120                 # 等待用户澄清响应的超时时间（秒）
```

## 上下文文件（SOUL.md, AGENTS.md）

Hermes 使用两种不同的上下文范围：

| 文件 | 用途 | 范围 |
|------|------|------|
| `SOUL.md` | **主要智能体身份** — 定义智能体是谁（系统提示中的插槽 #1） | `~/.hermes/SOUL.md` 或 `$HERMES_HOME/SOUL.md` |
| `.hermes.md` / `HERMES.md` | 项目特定指令（最高优先级） | 向上遍历到 git 根目录 |
| `AGENTS.md` | 项目特定指令、编码规范 | 递归目录遍历 |
| `CLAUDE.md` | Claude Code 上下文文件（也会被检测） | 仅工作目录 |
| `.cursorrules` | Cursor IDE 规则（也会被检测） | 仅工作目录 |
| `.cursor/rules/*.mdc` | Cursor 规则文件（也会被检测） | 仅工作目录 |

- **SOUL.md** 是智能体的主要身份。它占据系统提示中的插槽 #1，完全替换内置的默认身份。编辑它可以完全自定义智能体是谁。
- 如果 SOUL.md 缺失、为空或无法加载，Hermes 将回退到内置的默认身份。
- **项目上下文文件使用优先级系统** — 只加载一种类型（首次匹配即生效）：`.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`。SOUL.md 总是独立加载。
- **AGENTS.md** 是分层的：如果子目录也有 AGENTS.md，它们会被组合在一起。
- 如果默认的 `SOUL.md` 不存在，Hermes 会自动创建一个。
- 所有加载的上下文文件都限制在 20,000 个字符内，并进行智能截断。

另请参阅：
- [个性与 SOUL.md](/user-guide/features/personality)
- [上下文文件](/user-guide/features/context-files)

## 工作目录

| 上下文 | 默认目录 |
|---------|---------|
| **命令行（`hermes`）** | 运行命令时的当前目录 |
| **消息网关** | 主目录 `~`（可通过 `MESSAGING_CWD` 覆盖） |
| **Docker / Singularity / Modal / SSH** | 容器或远程机器内的用户主目录 |

覆盖工作目录：
```bash
# 在 ~/.hermes/.env 或 ~/.hermes/config.yaml 中：
MESSAGING_CWD=/home/myuser/projects    # 网关会话
TERMINAL_CWD=/workspace                # 所有终端会话
```