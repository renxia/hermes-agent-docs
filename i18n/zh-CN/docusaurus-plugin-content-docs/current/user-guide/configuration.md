---
sidebar_position: 2
title: "配置"
description: "配置 Hermes 智能体 —— config.yaml、提供商、模型、API 密钥等"
---

# 配置

所有设置都存储在 `~/.hermes/` 目录中，方便访问。

## 目录结构

```text
~/.hermes/
├── config.yaml     # 设置（模型、终端、语音合成、压缩等）
├── .env            # API 密钥和密钥
├── auth.json       # OAuth 提供商凭证（Nous Portal 等）
├── SOUL.md         # 主智能体身份（系统提示中的第 1 个槽位）
├── memories/       # 持久化记忆（MEMORY.md、USER.md）
├── skills/         # 智能体创建的技能（通过 skill_manage 工具管理）
├── cron/           # 定时任务
├── sessions/       # 网关会话
└── logs/           # 日志（errors.log、gateway.log —— 密钥自动脱敏）
```

## 配置管理

```bash
hermes config              # 查看当前配置
hermes config edit         # 在编辑器中打开 config.yaml
hermes config set KEY VAL  # 设置特定值
hermes config check        # 检查缺失选项（更新后）
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

1. **CLI 参数** — 例如 `hermes chat --model anthropic/claude-sonnet-4`（每次调用覆盖）
2. **`~/.hermes/config.yaml`** — 所有非机密设置的主要配置文件
3. **`~/.hermes/.env`** — 环境变量的后备来源；**必须**用于机密信息（API 密钥、令牌、密码）
4. **内置默认值** — 未设置任何内容时硬编码的安全默认值

:::info 经验法则
机密信息（API 密钥、机器人令牌、密码）放在 `.env` 中。其他所有内容（模型、终端后端、压缩设置、内存限制、工具集）放在 `config.yaml` 中。当两者都设置时，对于非机密设置，`config.yaml` 胜出。
:::

## 环境变量替换

您可以使用 `${VAR_NAME}` 语法在 `config.yaml` 中引用环境变量：

```yaml
auxiliary:
  vision:
    api_key: ${GOOGLE_API_KEY}
    base_url: ${CUSTOM_VISION_URL}

delegation:
  api_key: ${DELEGATION_KEY}
```

单个值中支持多个引用：`url: "${HOST}:${PORT}"`。如果引用的变量未设置，占位符将原样保留（`${UNDEFINED_VAR}` 保持不变）。仅支持 `${VAR}` 语法 — 不会展开裸露的 `$VAR`。

有关 AI 提供商设置（OpenRouter、Anthropic、Copilot、自定义端点、自托管 LLM、回退模型等），请参阅 [AI 提供商](/docs/integrations/providers)。

### 提供商超时

您可以为提供商设置 `providers.<id>.request_timeout_seconds` 以设置提供商范围的请求超时，还可以设置 `providers.<id>.models.<model>.timeout_seconds` 以进行模型特定覆盖。适用于每个传输（OpenAI 线路、原生 Anthropic、Anthropic 兼容）上的主轮询客户端、回退链、凭据轮换后的重建，以及（对于 OpenAI 线路）每个请求的超时 kwarg — 因此配置的值优先于旧版 `HERMES_API_TIMEOUT` 环境变量。

您还可以为非流式陈旧调用检测器设置 `providers.<id>.stale_timeout_seconds`，以及 `providers.<id>.models.<model>.stale_timeout_seconds` 以进行模型特定覆盖。这优先于旧版 `HERMES_API_CALL_STALE_TIMEOUT` 环境变量。

如果保留这些设置未配置，则保留旧版默认值（`HERMES_API_TIMEOUT=1800` 秒，`HERMES_API_CALL_STALE_TIMEOUT=300` 秒，原生 Anthropic 900 秒）。目前未为 AWS Bedrock 接线（`bedrock_converse` 和 AnthropicBedrock SDK 路径都使用 boto3 及其自身的超时配置）。请参阅 [`cli-config.yaml.example`](https://github.com/NousResearch/hermes-agent/blob/main/cli-config.yaml.example) 中的注释示例。

## 终端后端配置

Hermes 支持七种终端后端。每种后端决定了智能体的 shell 命令实际在哪里执行 — 您的本地机器、Docker 容器、通过 SSH 连接的远程服务器、Modal 云沙箱（直接或通过 Nous 管理的网关）、Daytona 工作区、Vercel 沙箱，或 Singularity/Apptainer 容器。

```yaml
terminal:
  backend: local    # local | docker | ssh | modal | daytona | vercel_sandbox | singularity
  cwd: "."          # 网关/定时任务的工作目录（CLI 始终使用启动目录）
  timeout: 180      # 每个命令的超时时间（秒）
  env_passthrough: []  # 要转发到沙箱执行的环境变量名称（终端 + execute_code）
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"  # Singularity 后端的容器镜像
  modal_image: "nikolaik/python-nodejs:python3.11-nodejs20"                 # Modal 后端的容器镜像
  daytona_image: "nikolaik/python-nodejs:python3.11-nodejs20"               # Daytona 后端的容器镜像
```

对于 Modal、Daytona 和 Vercel 沙箱等云沙箱，`container_persistent: true` 表示 Hermes 将尝试在沙箱重建之间保留文件系统状态。它不保证相同的活动沙箱、PID 空间或后台进程稍后仍在运行。

### 后端概览

| 后端 | 命令运行位置 | 隔离性 | 最佳用途 |
|------|-------------|--------|----------|
| **local** | 直接在您的机器上 | 无 | 开发、个人使用 |
| **docker** | 单个持久 Docker 容器（跨会话、`/new`、子智能体共享） | 完全（命名空间、能力删除） | 安全沙箱、CI/CD |
| **ssh** | 通过 SSH 连接的远程服务器 | 网络边界 | 远程开发、强大硬件 |
| **modal** | Modal 云沙箱 | 宨全（云虚拟机） | 临时云计算、评估 |
| **daytona** | Daytona 工作区 | 完全（云容器） | 托管云开发环境 |
| **vercel_sandbox** | Vercel 沙箱 | 完全（云微虚拟机） | 具有快照支持的文件系统持久性的云执行 |
| **singularity** | Singularity/Apptainer 容器 | 命名空间 (--containall) | HPC 集群、共享机器 |

### 本地后端

默认选项。命令直接在您的机器上运行，无需隔离。无需特殊设置。

```yaml
terminal:
  backend: local
```

:::warning
智能体拥有与您的用户账户相同的文件系统访问权限。使用 `hermes tools` 禁用您不需要的工具，或切换到 Docker 以实现沙箱化。
:::

### Docker 后端

在具有安全加固的 Docker 容器内运行命令（所有能力被删除、无特权提升、PID 限制）。

**单个持久容器，非每命令一个。** Hermes 在首次使用时启动一个长期运行的容器，并将每个终端、文件和 `execute_code` 调用通过 `docker exec` 路由到同一个容器 — 跨会话、`/new`、`/reset` 和 `delegate_task` 子智能体 — 在 Hermes 进程的生命周期内。工作目录更改、已安装的包和 `/workspace` 中的文件会从一个工具调用延续到下一个，就像本地 shell 一样。容器在关闭时被停止和移除。有关详细信息，请参阅下面的**容器生命周期**。

```yaml
terminal:
  backend: docker
  docker_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  docker_mount_cwd_to_workspace: false  # 将启动目录挂载到 /workspace
  docker_run_as_host_user: false   # 参见下面的“以主机用户身份运行容器”
  docker_forward_env:              # 要转发到容器的环境变量
    - "GITHUB_TOKEN"
  docker_volumes:                  # 主机目录挂载
    - "/home/user/projects:/workspace/projects"
    - "/home/user/data:/data:ro"   # :ro 表示只读

  # 资源限制
  container_cpu: 1                 # CPU 核心数（0 = 无限制）
  container_memory: 5120           # MB（0 = 无限制）
  container_disk: 51200            # MB（需要 XFS+pquota 上的 overlay2）
  container_persistent: true       # 跨会话持久化 /workspace 和 /root
```

**要求：** 已安装并运行 Docker Desktop 或 Docker Engine。Hermes 会探测 `$PATH` 以及常见的 macOS 安装位置（`/usr/local/bin/docker`、`/opt/homebrew/bin/docker`、Docker Desktop 应用程序包）。开箱即支持 Podman：设置 `HERMES_DOCKER_BINARY=podman`（或完整路径）以在两者都安装时强制使用它。

**容器生命周期：** Hermes 为每个终端和文件工具调用复用单个长期运行的容器（`docker run -d ... sleep 2h`），跨会话、`/new`、`/reset` 和 `delegate_task` 子智能体，在 Hermes 进程的生命周期内。命令通过 `docker exec` 使用登录 shell 运行，因此工作目录更改、已安装的包和 `/workspace` 中的文件都会从一个工具调用延续到下一个。容器在 Hermes 关闭时（或空闲清理回收时）被停止和移除。

通过 `delegate_task(tasks=[...])` 生成的并行子智能体共享这一个容器 — 对同一路径的并发 `cd`、环境变量更改和写入将发生冲突。如果子智能体需要隔离的沙箱，它必须通过 `register_task_env_overrides()` 注册每个任务的镜像覆盖，RL 和基准环境（TerminalBench2、HermesSweEnv 等）会自动为其每个任务的 Docker 镜像执行此操作。

**安全加固：**
- `--cap-drop ALL`，仅添加回 `DAC_OVERRIDE`、`CHOWN`、`FOWNER`
- `--security-opt no-new-privileges`
- `--pids-limit 256`
- 大小受限的 tmpfs 用于 `/tmp`（512MB）、`/var/tmp`（256MB）、`/run`（64MB）

**凭据转发：** `docker_forward_env` 中列出的环境变量首先从您的 shell 环境解析，然后如果已使用 `hermes config set` 保存，则回退到 `~/.hermes/.env`。技能还可以声明 `required_environment_variables`，这些变量会自动合并。

### SSH 后端

通过 SSH 在远程服务器上运行命令。使用 ControlMaster 进行连接复用（5 分钟空闲保活）。默认启用持久 shell — 状态（cwd、环境变量）在命令间保持。

```yaml
terminal:
  backend: ssh
  persistent_shell: true           # 保持一个长期运行的 bash 会话（默认：true）
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

**工作原理：** 在初始化时连接，使用 `BatchMode=yes` 和 `StrictHostKeyChecking=accept-new`。持久 shell 在远程主机上保持一个 `bash -l` 进程存活，通过临时文件进行通信。需要 `stdin_data` 或 `sudo` 的命令会自动回退到一次性模式。

### Modal 后端

在 [Modal](https://modal.com) 云沙箱中运行命令。每个任务获得一个具有可配置 CPU、内存和磁盘的隔离虚拟机。文件系统可以在会话之间进行快照/恢复。

```yaml
terminal:
  backend: modal
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB（5GB）
  container_disk: 51200            # MB（50GB）
  container_persistent: true       # 快照/恢复文件系统
```

**必需：** `MODAL_TOKEN_ID` + `MODAL_TOKEN_SECRET` 环境变量，或 `~/.modal.toml` 配置文件。

**持久性：** 启用后，沙箱文件系统在清理时进行快照，并在下次会话时恢复。快照跟踪在 `~/.hermes/modal_snapshots.json` 中。这保留文件系统状态，而非活动进程、PID 空间或后台作业。

**凭据文件：** 从 `~/.hermes/` 自动挂载（OAuth 令牌等），并在每个命令前同步。

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

**持久性：** 启用后，沙箱在清理时被停止（而非删除），并在下次会话时恢复。沙箱名称遵循 `hermes-{task_id}` 模式。

**磁盘限制：** Daytona 强制执行 10 GiB 的最大限制。超过此限制的请求将被限制并发出警告。

### Vercel 沙箱后端

在 [Vercel 沙箱](https://vercel.com/docs/vercel-sandbox) 云微虚拟机中运行命令。Hermes 使用常规的终端和文件工具界面；没有 Vercel 特定的面向模型的工具。

```yaml
terminal:
  backend: vercel_sandbox
  vercel_runtime: node24          # node24 | node22 | python3.13
  cwd: /vercel/sandbox            # 默认工作区根目录
  container_persistent: true      # 快照/恢复文件系统
  container_disk: 51200           # 仅共享默认值；不支持自定义磁盘
```

**必需安装：** 安装可选的 SDK 扩展：

```bash
pip install 'hermes-agent[vercel]'
```

**必需认证：** 使用所有三个 `VERCEL_TOKEN`、`VERCEL_PROJECT_ID` 和 `VERCEL_TEAM_ID` 配置访问令牌认证。这是部署和在 Render、Railway、Docker 及类似主机上正常长期运行 Hermes 进程的受支持设置。

对于一次性的本地开发，Hermes 也接受短期 Vercel OIDC 令牌：

```bash
VERCEL_OIDC_TOKEN="$(vc project token <project-name>)" hermes chat
```

从已链接的 Vercel 项目目录中，可以省略项目名称：

```bash
VERCEL_OIDC_TOKEN="$(vc project token)" hermes chat
```

OIDC 令牌是短期的，不应作为文档记录的部署路径使用。

**运行时：** `terminal.vercel_runtime` 支持 `node24`、`node22` 和 `python3.13`。如果未设置，Hermes 默认为 `node24`。

**持久性：** 当 `container_persistent: true` 时，Hermes 在清理期间对沙箱文件系统进行快照，并稍后从该快照恢复同一任务的沙箱。快照内容可以包括同步到沙箱的 Hermes 凭据、技能和缓存文件。这仅保留文件系统状态；它不保留活动的沙箱身份、PID 空间、shell 状态或正在运行的后台进程。

**后台命令：** `terminal(background=true)` 使用 Hermes 的通用非本地后台进程流程。在沙箱存活期间，您可以通过正常的进程工具生成、轮询、等待、查看日志和终止进程。Hermes 在清理或重启后不提供原生的 Vercel 分离进程恢复。

**磁盘大小：** Vercel 沙箱目前不支持 Hermes 的 `container_disk` 资源旋钮。将 `container_disk` 保留未设置或使用共享默认值 `51200`；非默认值会导致诊断和后端创建失败，而不是被静默忽略。

### Singularity/Apptainer 后端

在 [Singularity/Apptainer](https://apptainer.org) 容器中运行命令。专为 Docker 不可用的 HPC 集群和共享机器设计。

```yaml
terminal:
  backend: singularity
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB
  container_persistent: true       # 可写覆盖层跨会话持久化
```

**要求：** `$PATH` 中有 `apptainer` 或 `singularity` 二进制文件。

**镜像处理：** Docker URL（`docker://...`）会自动转换为 SIF 文件并缓存。现有的 `.sif` 文件直接使用。

**临时目录：** 按以下顺序解析：`TERMINAL_SCRATCH_DIR` → `TERMINAL_SANDBOX_DIR/singularity` → `/scratch/$USER/hermes-agent`（HPC 惯例） → `~/.hermes/sandboxes/singularity`。

**隔离：** 使用 `--containall --no-home` 进行完整的命名空间隔离，而不挂载主机主目录。

### 常见终端后端问题

如果终端命令立即失败或终端工具被报告为禁用：

- **本地** — 无特殊要求。开始时最安全的默认选项。
- **Docker** — 运行 `docker version` 以验证 Docker 是否正常工作。如果失败，请修复 Docker 或运行 `hermes config set terminal.backend local`。
- **SSH** — `TERMINAL_SSH_HOST` 和 `TERMINAL_SSH_USER` 都必须设置。如果缺少任一，Hermes 会记录清晰的错误。
- **Modal** — 需要 `MODAL_TOKEN_ID` 环境变量或 `~/.modal.toml`。运行 `hermes doctor` 进行检查。
- **Daytona** — 需要 `DAYTONA_API_KEY`。Daytona SDK 处理服务器 URL 配置。
- **Singularity** — 需要 `$PATH` 中有 `apptainer` 或 `singularity`。在 HPC 集群上很常见。

如有疑问，请将 `terminal.backend` 设置回 `local`，并首先验证命令是否在那里运行。

### 拆卸时的远程到主机文件同步

对于 **SSH**、**Modal** 和 **Daytona** 后端（任何智能体的工作树位于运行 Hermes 的主机之外的机器上的情况），Hermes 会跟踪智能体在远程沙箱内接触的文件，并在会话拆卸/沙箱清理时，**将修改后的文件同步回主机**，位于 `~/.hermes/cache/remote-syncs/<session-id>/`。

- 触发条件：会话关闭、`/new`、`/reset`、网关消息超时、当子智能体使用远程后端时的 `delegate_task` 子智能体完成。
- 覆盖智能体修改的整个树，而不仅仅是它明确打开的文件。添加、编辑和删除都被捕获。
- 当您寻找时，远程沙箱可能已被拆除；本地的 `~/.hermes/cache/remote-syncs/…` 副本是智能体更改内容的权威记录。
- 大型二进制输出（模型检查点、原始数据集）受大小限制 — 同步会跳过超过 `file_sync_max_mb`（默认 `100`）的文件。如果您期望有更大的产物返回，请增加该值。

```yaml
terminal:
  file_sync_max_mb: 100     # 默认 — 同步每个文件最多 100 MB
  file_sync_enabled: true   # 默认 — 设置 false 可完全跳过同步
```

这就是您从临时云沙箱（在会话结束后被销毁）中恢复结果的方式，而无需告诉智能体明确使用 `scp` 或 `modal volume put` 每个产物。

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

这对于以下情况很有用：
- **向智能体提供文件**（数据集、配置、参考代码）
- **从智能体接收文件**（生成的代码、报告、导出）
- **共享工作区**，您和智能体访问相同的文件

如果您使用消息网关并希望智能体通过 `MEDIA:/...` 发送生成的文件，最好使用专用的主机可见导出挂载，例如 `/home/user/.hermes/cache/documents:/output`。

- 在 Docker 内部将文件写入 `/output/...`
- 在 `MEDIA:` 中发出 **主机路径**，例如：
  `MEDIA:/home/user/.hermes/cache/documents/report.txt`
- **不要**发出 `/workspace/...` 或 `/output/...`，除非该确切路径也存在于主机上的网关进程

:::warning
YAML 重复键会静默覆盖先前的键。如果您已经有 `docker_volumes:` 块，请将新挂载合并到同一列表中，而不是在文件中稍后添加另一个 `docker_volumes:` 键。
:::

也可以通过环境变量设置：`TERMINAL_DOCKER_VOLUMES='["/host:/container"]'`（JSON 数组）。

### Docker 凭据转发

默认情况下，Docker 终端会话不会继承任意的主机凭据。如果您需要在容器内使用特定令牌，请将其添加到 `terminal.docker_forward_env`。

```yaml
terminal:
  backend: docker
  docker_forward_env:
    - "GITHUB_TOKEN"
    - "NPM_TOKEN"
```

Hermes 首先从您当前的 shell 中解析每个列出的变量，如果它已通过 `hermes config set` 保存，则回退到 `~/.hermes/.env`。

:::warning
`docker_forward_env` 中列出的任何内容都对在容器内运行的命令可见。仅转发您愿意暴露给终端会话的凭据。
:::

### 以主机用户身份运行容器

默认情况下，Docker 容器以 `root`（UID 0）身份运行。在 `/workspace` 或其他绑定挂载中创建的文件在主机上最终归 root 所有，因此在会话之后，您必须从主机编辑器编辑它们之前运行 `sudo chown`。`terminal.docker_run_as_host_user` 标志可以解决此问题：

```yaml
terminal:
  backend: docker
  docker_run_as_host_user: true   # 默认：false
```

启用后，Hermes 将 `--user $(id -u):$(id -g)` 附加到 `docker run` 命令，因此写入绑定挂载目录（`/workspace`、`/root`、`docker_volumes` 中的任何内容）的文件归您的主机用户所有，而不是 root。权衡是：容器不再能 `apt install` 或写入 root 拥有的路径（如 `/root/.npm`）— 如果您需要两者，请使用其 `HOME` 由非 root 用户拥有的基础镜像（或在镜像构建时添加您需要的工具）。

将此项保留为 `false`（默认）以获得向后兼容的行为。当您的工作流程主要是“编辑挂载的主机文件”并且您厌倦了 `sudo chown -R` 时，请将其打开。

### 可选：将启动目录挂载到 `/workspace`

Docker 沙箱默认保持隔离。除非您明确选择，否则 Hermes **不会**将您当前的主机工作目录传递到容器中。

在 `config.yaml` 中启用它：

```yaml
terminal:
  backend: docker
  docker_mount_cwd_to_workspace: true
```

启用后：
- 如果您从 `~/projects/my-app` 启动 Hermes，该主机目录将被绑定挂载到 `/workspace`
- Docker 后端从 `/workspace` 启动
- 文件工具和终端命令都看到相同的挂载项目

禁用时，`/workspace` 保持沙箱所有，除非您通过 `docker_volumes` 明确挂载某些内容。

安全权衡：
- `false` 保留沙箱边界
- `true` 赋予沙箱对您启动 Hermes 的目录的直接访问权限

仅当您有意希望容器处理活动主机文件时才使用选择加入。

### 持久 Shell

默认情况下，每个终端命令都在自己的子进程中运行 — 工作目录、环境变量和 shell 变量在命令之间重置。当启用**持久 shell** 时，一个长期运行的 bash 进程会在 `execute()` 调用之间保持存活，以便状态在命令之间保持。

这对于 **SSH 后端**最有用，因为它还消除了每个命令的连接开销。持久 shell **默认为 SSH 启用**，为本地后端禁用。

```yaml
terminal:
  persistent_shell: true   # 默认 — 为 SSH 启用持久 shell
```

要禁用：

```bash
hermes config set terminal.persistent_shell false
```

**跨命令持久化的内容：**
- 工作目录（`cd /tmp` 会延续到下一个命令）
- 导出的环境变量（`export FOO=bar`）
- Shell 变量（`MY_VAR=hello`）

**优先级：**

| 级别 | 变量 | 默认值 |
|------|------|--------|
| 配置 | `terminal.persistent_shell` | `true` |
| SSH 覆盖 | `TERMINAL_SSH_PERSISTENT` | 遵循配置 |
| 本地覆盖 | `TERMINAL_LOCAL_PERSISTENT` | `false` |

每个后端的环境变量具有最高优先级。如果您也想为本地后端启用持久 shell：

```bash
export TERMINAL_LOCAL_PERSISTENT=true
```

:::note
需要 `stdin_data` 或 sudo 的命令会自动回退到一次性模式，因为持久 shell 的 stdin 已被 IPC 协议占用。
:::

有关每个后端的详细信息，请参阅[代码执行](features/code-execution.md)和[自述文件的终端部分](features/tools.md)。

## 技能配置

技能可以通过其 SKILL.md 的前置声明来声明自身的配置设置。这些是非保密值（路径、偏好、领域设置），存储在 `config.yaml` 的 `skills.config` 命名空间下。

```yaml
skills:
  config:
    myplugin:
      path: ~/myplugin-data   # 示例 — 每个技能定义自己的键
```

**技能配置的工作原理：**

- `hermes config migrate` 会扫描所有已启用的技能，查找未配置的设置，并提供提示供您选择
- `hermes config show` 会在“技能配置”下显示所有技能设置及其所属技能
- 当技能加载时，其解析后的配置值会自动注入技能上下文

**手动设置值：**

```bash
hermes config set skills.config.myplugin.path ~/myplugin-data
```

有关在您自己的技能中声明配置设置的详情，请参阅[创建技能 — 配置设置](/docs/developer-guide/creating-skills#config-settings-configyaml)。

### 守护智能体创建的技能写入

当智能体使用 `skill_manage` 来创建、编辑、修补或删除一个技能时，Hermes 可以选择性地扫描新的/更新后的内容，查找危险的关键词模式（凭据窃取、明显的提示词注入、外泄指令）。该扫描器**默认关闭** — 那些合法地涉及 `~/.ssh/` 或提及 `$OPENAI_API_KEY` 的真实智能体工作流会过于频繁地触发启发式规则。如果您希望扫描器在智能体的技能写入生效前提醒您，可以重新打开它：

```yaml
skills:
  guard_agent_created: true   # 默认: false
```

开启后，任何被标记的 `skill_manage` 写入都会作为一个带有扫描器理由的审批提示而浮现。接受的写入会生效；被拒绝的写入会向智能体返回解释性错误。

## 内存配置

```yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # 约800个词元
  user_char_limit: 1375     # 约500个词元
```

## 文件读取安全

控制单个 `read_file` 调用可以返回的内容量。超出限制的读取将被拒绝，并伴随错误信息告知智能体需使用 `offset` 和 `limit` 来获取更小范围的内容。这防止单次读取压缩的 JS 包或大型数据文件导致上下文窗口溢出。

```yaml
file_read_max_chars: 100000  # 默认值 — 约 25-35K 个 tokens
```

如果你使用的模型上下文窗口很大且经常读取大文件，可以提高此限制。对于上下文窗口较小的模型，可以降低此限制以保持读取效率：

```yaml
# 大上下文模型 (200K+)
file_read_max_chars: 200000

# 本地小模型 (16K 上下文)
file_read_max_chars: 30000
```

智能体还会自动去重文件读取——如果同一个文件区域被读取两次且文件内容未变，则会返回一个轻量级的存根，而不是重新发送内容。这在上下文压缩后重置，以便智能体可以在其内容被总结掉后重新读取文件。

## 工具输出截断限制

三个相关的上限控制着工具在被 Hermes 截断之前可以返回多少原始输出：

```yaml
tool_output:
  max_bytes: 50000        # 终端输出上限（字符数）
  max_lines: 2000         # read_file 分页上限
  max_line_length: 2000   # read_file 行号视图中的每行上限
```

- **`max_bytes`** — 当 `terminal` 命令产生的 stdout/stderr 组合字符数超过此值时，Hermes 会保留前 40% 和后 60%，并在它们之间插入 `[OUTPUT TRUNCATED]` 提示。默认 `50000`（跨典型分词器约 12-15K tokens）。
- **`max_lines`** — 单个 `read_file` 调用中 `limit` 参数的上限。超过此值的请求将被限制，以防止单次读取淹没上下文窗口。默认 `2000`。
- **`max_line_length`** — 当 `read_file` 发出行号视图时应用的每行上限。超过此长度的行将被截断至此字符数，后跟 `... [truncated]`。默认 `2000`。

对于上下文窗口大、能承受每次调用返回更多原始输出的模型，可以提高这些限制。对于上下文窗口小的模型，可以降低它们以使工具结果保持紧凑：

```yaml
# 大上下文模型 (200K+)
tool_output:
  max_bytes: 150000
  max_lines: 5000

# 本地小模型 (16K 上下文)
tool_output:
  max_bytes: 20000
  max_lines: 500
```

## 全局工具集禁用

要在 CLI 和每个网关平台一次性禁用特定工具集，请在 `agent.disabled_toolsets` 下列出它们的名称：

```yaml
agent:
  disabled_toolsets:
    - memory       # 隐藏内存工具 + MEMORY_GUIDANCE 注入
    - web          # 任何地方都禁用 web_search / web_extract
```

这会在每个平台工具配置（由 `hermes tools` 写入的 `platform_toolsets`）**之后**应用，因此此处列出的工具集总是会被移除——即使某个平台保存的配置仍包含它。当你想要一个“在所有地方关闭 X”的单一开关，而不是在 `hermes tools` UI 中编辑 15 个以上的平台行时，请使用此选项。

将列表留空或省略该键则无效。

## Git 工作树隔离

为在同一仓库上并行运行多个智能体启用隔离的 git 工作树：

```yaml
worktree: true    # 总是创建一个工作树（等同于 hermes -w）
# worktree: false # 默认 — 仅在传递 -w 标志时
```

启用后，每个 CLI 会话会在 `.worktrees/` 下创建一个新的工作树，带有自己的分支。智能体可以编辑文件、提交、推送和创建 PR，而不会相互干扰。干净的工作树在退出时被移除；脏工作树则保留以供手动恢复。

你还可以通过仓库根目录中的 `.worktreeinclude` 列出需要复制到工作树中的 gitignore 文件：

```
# .worktreeinclude
.env
.venv/
node_modules/
```

## 上下文压缩

Hermes 会自动压缩长对话，以保持在你的模型上下文窗口内。压缩摘要器是一个单独的 LLM 调用——你可以将其指向任何提供商或端点。

所有压缩设置都位于 `config.yaml` 中（无环境变量）。

### 完整参考

```yaml
compression:
  enabled: true                                     # 开启/关闭压缩
  threshold: 0.50                                   # 在此上下文限制百分比时进行压缩
  target_ratio: 0.20                                # 作为最近尾部保留的阈值比例
  protect_last_n: 20                                # 保持未压缩的最近消息最小数量
  hygiene_hard_message_limit: 400                   # 网关安全阀 — 见下文

# 摘要模型/提供商在辅助部分配置：
auxiliary:
  compression:
    model: ""                                       # 空 = 使用主聊天模型。可用例如 "google/gemini-3-flash-preview" 进行覆盖以获得更便宜/更快的压缩。
    provider: "auto"                                # 提供商："auto"、"openrouter"、"nous"、"codex"、"main" 等。
    base_url: null                                  # 自定义 OpenAI 兼容端点（覆盖提供商）
```

:::info 旧配置迁移
包含 `compression.summary_model`、`compression.summary_provider` 和 `compression.summary_base_url` 的旧配置在首次加载时会自动迁移到 `auxiliary.compression.*`（配置版本 17）。无需手动操作。
:::

`hygiene_hard_message_limit` 是仅限网关的**预压缩安全阀**。拥有数千条消息的失控会话可能在正常的上下文百分比阈值触发之前就达到模型上下文限制；当消息数量超过此上限时，Hermes 会强制进行压缩，而不考虑 token 使用情况。默认值 `400`——对于非常长的会话是常态的平台，可以提高它；降低它则强制进行更激进的压缩。在运行的网关上编辑此值将在下一条消息时生效（见下文）。

:::tip 网关压缩和上下文长度的热重载
在最近的版本中，在运行的网关上编辑 `config.yaml` 中的 `model.context_length` 或任何 `compression.*` 键将在下一条消息时生效——无需重启网关，无需 `/reset`，无需轮换会话。缓存的智能体签名包含这些键，因此当网关检测到更改时会透明地重建智能体。API 密钥和工具/技能配置仍然需要使用常规的重新加载路径。
:::

### 常见设置

**默认（自动检测）——无需配置：**
```yaml
compression:
  enabled: true
  threshold: 0.50
```
使用你的主提供商和主模型。如果需要使用比主聊天模型更便宜的模型进行压缩，可以按任务覆盖（例如 `auxiliary.compression.provider: openrouter` + `model: google/gemini-2.5-flash`）。

**强制使用特定提供商**（基于 OAuth 或 API 密钥）：
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
指向一个自定义的 OpenAI 兼容端点。使用 `OPENAI_API_KEY` 进行认证。

### 三个旋钮如何相互作用

| `auxiliary.compression.provider` | `auxiliary.compression.base_url` | 结果 |
|---------------------|---------------------|--------|
| `auto`（默认） | 未设置 | 自动检测最佳可用提供商 |
| `nous` / `openrouter` 等 | 未设置 | 强制使用该提供商，使用其认证信息 |
| 任意 | 已设置 | 直接使用自定义端点（忽略提供商设置） |

:::warning 摘要模型上下文长度要求
摘要模型的上下文窗口**必须**至少与你的主智能体模型的一样大。压缩器会将对话的完整中间部分发送给摘要模型——如果该模型的上下文窗口小于主模型，摘要调用将因上下文长度错误而失败。发生这种情况时，中间的轮次将**在没有摘要的情况下被丢弃**，从而悄然丢失对话上下文。如果你覆盖了模型，请验证其上下文长度是否达到或超过你的主模型。
:::

## 上下文引擎

上下文引擎控制当接近模型的 token 限制时如何管理对话。内置的 `compressor` 引擎使用有损摘要（参见[上下文压缩](/docs/developer-guide/context-compression-and-caching)）。插件引擎可以用替代策略替换它。

```yaml
context:
  engine: "compressor"    # 默认 — 内置有损摘要
```

要使用插件引擎（例如，用于无损上下文管理的 LCM）：

```yaml
context:
  engine: "lcm"          # 必须与插件名称匹配
```

插件引擎**从不自动激活**——你必须显式地将 `context.engine` 设置为插件名称。可用的引擎可以通过 `hermes plugins` → Provider Plugins → Context Engine 浏览和选择。

参见[内存提供商](/docs/user-guide/features/memory-providers)了解内存插件的类似单选系统。

## 迭代预算压力

当智能体处理涉及大量工具调用的复杂任务时，它可能会在未察觉的情况下耗尽其迭代预算（默认值：90轮）。预算压力会在智能体接近限制时自动向模型发出警告：

| 阈值   | 等级   | 模型看到的信息                               |
|--------|--------|----------------------------------------------|
| **70%** | 注意   | `[预算: 63/90。剩余27次迭代。开始进行整合。]` |
| **90%** | 警告   | `[预算警告: 81/90。仅剩9次。立即响应。]`     |

警告被注入到最后一个工具结果的 JSON 中（作为 `_budget_warning` 字段），而不是作为单独的消息——这保留了提示缓存且不会破坏对话结构。

```yaml
agent:
  max_turns: 90                # 每次对话轮次的最大迭代次数（默认：90）
  api_max_retries: 3           # 触发备用提供程序切换前，每个提供程序的重试次数（默认：3）
```

预算压力默认启用。智能体在工具结果中自然地看到警告，鼓励其在耗尽迭代次数前整合工作并提供响应。

当迭代预算完全耗尽时，CLI 会向用户显示通知：`⚠ 迭代预算已用尽 (90/90) —— 响应可能不完整`。如果在活动工作期间预算耗尽，智能体将在停止前生成一份已完成工作的总结。

`agent.api_max_retries` 控制在**触发备用提供程序切换之前**，Hermes 对提供程序 API 调用的瞬时错误（速率限制、连接中断、5xx 错误）进行重试的次数。默认值为 `3`——即总共四次尝试。如果你配置了[备用提供程序](/docs/user-guide/features/fallback-providers)并希望更快地进行故障转移，将此值设为 `0`，这样主提供程序上首次出现瞬时错误时，就会立即将任务交给备用提供程序，而不是在不稳定的端点上进行多次重试尝试。

### API 超时

Hermes 对流式传输有独立的超时层，并对非流式调用设置了过时检测器。仅当本地提供程序保持其隐式默认值时，过时检测器才会自动调整。

| 超时类型           | 默认值 | 本地提供程序           | 配置 / 环境变量 |
|-------------------|--------|------------------------|-----------------|
| 套接字读取超时     | 120秒 | 自动提升至 1800秒       | `HERMES_STREAM_READ_TIMEOUT` |
| 过时流检测         | 180秒 | 自动禁用               | `HERMES_STREAM_STALE_TIMEOUT` |
| 过时非流检测       | 300秒 | 隐式设置时自动禁用     | `providers.<id>.stale_timeout_seconds` 或 `HERMES_API_CALL_STALE_TIMEOUT` |
| API 调用 (非流式) | 1800秒 | 保持不变               | `providers.<id>.request_timeout_seconds` / `timeout_seconds` 或 `HERMES_API_TIMEOUT` |

**套接字读取超时**控制 httpx 等待从提供程序获取下一个数据块的时间。本地 LLM 在生成第一个 token 前，对大型上下文进行预填充可能需要数分钟，因此当 Hermes 检测到本地端点时，会将此超时时间延长至 30 分钟。如果你明确设置了 `HERMES_STREAM_READ_TIMEOUT`，则无论端点检测结果如何，该值都会被始终使用。

**过时流检测**会终止那些只收到 SSE 保持活动信号（keep-alive pings）但没有实际内容的连接。对于本地提供程序，此功能完全禁用，因为它们在预填充期间不会发送保持活动信号。

**过时非流检测**会终止那些长时间没有产生响应的非流式调用。默认情况下，Hermes 会在本地端点上禁用此功能，以避免在长预填充期间出现误报。如果你明确设置了 `providers.<id>.stale_timeout_seconds`、`providers.<id>.models.<model>.stale_timeout_seconds` 或 `HERMES_API_CALL_STALE_TIMEOUT`，那么即使是本地端点也会遵循该明确值。

# 上下文压力警告

与迭代预算压力不同，上下文压力跟踪对话接近**压缩阈值**的程度——即触发上下文压缩以总结旧消息的临界点。这有助于您和智能体了解对话何时变得过长。

| 进度 | 级别 | 会发生什么 |
|------|------|-----------|
| **≥ 60%** 到阈值 | 信息 | CLI 显示青色进度条；网关发送信息性通知 |
| **≥ 85%** 到阈值 | 警告 | CLI 显示加粗黄色进度条；网关警告压缩即将发生 |

在 CLI 中，上下文压力显示为工具输出流中的进度条：
```
  ◐ context ████████████░░░░░░░░ 62% to compaction  48k threshold (50%) · approaching compaction
```

在消息平台上，会发送纯文本通知：
```
◐ Context: ████████████░░░░░░░░ 62% to compaction (threshold: 50% of window).
```

如果自动压缩被禁用，警告会告知您上下文可能会被截断。

上下文压力是自动的——无需配置。它纯粹作为面向用户的通知触发，不会修改消息流或向模型的上下文注入任何内容。

# 凭证池策略

当您为同一提供商拥有多个 API 密钥或 OAuth 令牌时，可配置轮换策略：

```yaml
credential_pool_strategies:
  openrouter: round_robin    # 循环使用密钥
  anthropic: least_used      # 总是使用使用最少的密钥
```

选项：`fill_first`（默认）、`round_robin`、`least_used`、`random`。请参阅[凭证池](/docs/user-guide/features/credential-pools)了解完整文档。

# 辅助模型

Hermes 使用"辅助"模型处理诸如图像分析、网页摘要、浏览器截图分析、会话标题生成和上下文压缩等辅助任务。默认情况下（`auxiliary.*.provider: "auto"`），Hermes 会将每个辅助任务路由到您的**主聊天模型**——即您在 `hermes model` 中选择的同一提供商/模型。您无需进行任何配置即可开始使用，但请注意，在昂贵的推理模型（Opus、MiniMax M2.7 等）上，辅助任务会增加可观的成本。如果您希望无论主模型如何都能使用廉价快速的辅助任务，请明确设置 `auxiliary.<task>.provider` 和 `auxiliary.<task>.model`（例如，在 OpenRouter 上使用 Gemini Flash 进行视觉和网页提取）。

:::note 为什么"auto"使用您的主模型
早期版本将聚合器用户（OpenRouter、Nous Portal）分流到一个廉价的提供商端默认值。这令人意外——为聚合器订阅付费的用户会看到不同的模型处理他们的辅助流量。`auto` 现在对所有人都使用主模型，并且 `config.yaml` 中的每个任务覆盖仍然优先（参见下方的[完整辅助配置参考](#full-auxiliary-config-reference)）。
:::

### 交互式配置辅助模型

无需手动编辑 YAML，运行 `hermes model` 并从菜单中选择**"配置辅助模型"**。您将获得一个交互式的每任务选择器：

```
$ hermes model
→ Configure auxiliary models

[ ] vision               当前: auto / 主模型
[ ] web_extract          当前: auto / 主模型
[ ] session_search       当前: openrouter / google/gemini-2.5-flash
[ ] title_generation     当前: openrouter / google/gemini-3-flash-preview
[ ] compression          当前: auto / 主模型
[ ] approval             当前: auto / 主模型
[ ] triage_specifier     当前: auto / 主模型
```

选择一个任务，选择一个提供商（OAuth 流程会打开浏览器；API 密钥提供商则提示输入），然后选择一个模型。更改将保存到 `config.yaml` 中的 `auxiliary.<task>.*`。与主模型选择器机制相同——无需学习额外语法。

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

Hermes 中的每个模型槽位——辅助任务、压缩、回退——都使用相同的三个旋钮：

| 键 | 作用 | 默认值 |
|----|------|-------|
| `provider` | 用于身份验证和路由的提供商 | `"auto"` |
| `model` | 要请求的模型 | 提供商的默认值 |
| `base_url` | 自定义的 OpenAI 兼容端点（覆盖提供商） | 未设置 |

当设置了 `base_url` 时，Hermes 会忽略提供商并直接调用该端点（使用 `api_key` 或 `OPENAI_API_KEY` 进行身份验证）。当仅设置了 `provider` 时，Hermes 使用该提供商的内置身份验证和基础 URL。

辅助任务的可用提供商：`auto`、`main`，加上[提供商注册表](/docs/reference/environment-variables)中的任何提供商——`openrouter`、`nous`、`openai-codex`、`copilot`、`copilot-acp`、`anthropic`、`gemini`、`google-gemini-cli`、`qwen-oauth`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`minimax-oauth`、`deepseek`、`nvidia`、`xai`、`ollama-cloud`、`alibaba`、`bedrock`、`huggingface`、`arcee`、`xiaomi`、`kilocode`、`opencode-zen`、`opencode-go`、`ai-gateway`、`azure-foundry`——或您 `custom_providers` 列表中的任何命名自定义提供商（例如 `provider: "beans"`）。

:::tip MiniMax OAuth
`minimax-oauth` 通过浏览器 OAuth 登录（无需 API 密钥）。运行 `hermes model` 并选择 **MiniMax (OAuth)** 进行身份验证。辅助任务会自动使用 `MiniMax-M2.7-highspeed`。请参阅 [MiniMax OAuth 指南](../guides/minimax-oauth.md)。
:::

:::warning `"main"` 仅用于辅助任务
`"main"` 提供商选项意味着"使用我的主智能体所使用的任何提供商"——它仅在 `auxiliary:`、`compression:` 和 `fallback_model:` 配置中有效。它**不是**您的顶层 `model.provider` 设置的有效值。如果您使用自定义的 OpenAI 兼容端点，请在 `model:` 部分设置 `provider: custom`。请参阅 [AI 提供商](/docs/integrations/providers) 了解所有主模型提供商选项。
:::

### 完整辅助配置参考

```yaml
auxiliary:
  # 图像分析（vision_analyze 工具 + 浏览器截图）
  vision:
    provider: "auto"           # "auto"、"openrouter"、"nous"、"codex"、"main" 等
    model: ""                  # 例如 "openai/gpt-4o"、"google/gemini-2.5-flash"
    base_url: ""               # 自定义 OpenAI 兼容端点（覆盖提供商）
    api_key: ""                # base_url 的 API 密钥（回退到 OPENAI_API_KEY）
    timeout: 120               # 秒 — LLM API 调用超时；视觉载荷需要较长的超时时间
    download_timeout: 30       # 秒 — 图像 HTTP 下载；对于慢速连接请增加此值

  # 网页摘要 + 浏览器页面文本提取
  web_extract:
    provider: "auto"
    model: ""                  # 例如 "google/gemini-2.5-flash"
    base_url: ""
    api_key: ""
    timeout: 360               # 秒（6分钟）— 每次尝试的 LLM 摘要

  # 危险命令审批分类器
  approval:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30                # 秒

  # 上下文压缩超时（与 compression.* 配置分开）
  compression:
    timeout: 120               # 秒 — 压缩会总结长对话，需要更多时间

  # 会话搜索 — 总结过去的会话匹配
  session_search:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30
    max_concurrency: 3       # 限制并行摘要以减少请求突发的 429 错误
    extra_body: {}           # 提供商特定的 OpenAI 兼容请求字段

  # 技能中心 — 技能匹配和搜索
  skills_hub:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

  # MCP 工具分发
  mcp:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

  # 看板分诊说明器 — `hermes kanban specify <id>`（或仪表板上
  # Triage 列卡片的 ✨ Specify 按钮）使用此槽位将单行描述扩展为
  # 具体的规格说明，并将任务提升到 `todo`。廉价快速的模型在此处
  # 表现良好；规格扩展是简短的，不需要深度推理。
  triage_specifier:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 120
```

:::tip
每个辅助任务都有一个可配置的 `timeout`（以秒为单位）。默认值：视觉 120 秒，网页提取 360 秒，审批 30 秒，压缩 120 秒。如果您将慢速本地模型用于辅助任务，请增加这些值。视觉还有一个单独的 `download_timeout`（默认 30 秒），用于 HTTP 图像下载——对于慢速连接或自托管图像服务器，请增加此值。
:::

:::info
上下文压缩有自己的 `compression:` 块用于阈值设置，以及一个 `auxiliary.compression:` 块用于模型/提供商设置——请参阅上方的[上下文压缩](#上下文压缩)。回退模型使用 `fallback_model:` 块——请参阅[回退模型](/docs/integrations/providers#fallback-model)。这三者都遵循相同的 provider/model/base_url 模式。
:::

### 会话搜索调优

如果您为 `auxiliary.session_search` 使用推理密集型模型，Hermes 现在为您提供两个内置控制项：

- `auxiliary.session_search.max_concurrency`：限制 Hermes 同时总结的匹配会话数量
- `auxiliary.session_search.extra_body`：在摘要调用中转发提供商特定的 OpenAI 兼容请求字段

示例：

```yaml
auxiliary:
  session_search:
    provider: "main"
    model: "glm-4.5-air"
    timeout: 60
    max_concurrency: 2
    extra_body:
      enable_thinking: false
```

当您的提供商限制请求突发速率，并且您希望 `session_search` 以牺牲部分并行性来换取稳定性时，请使用 `max_concurrency`。

仅当您的提供商记录了您希望 Hermes 为此任务传递的 OpenAI 兼容请求体字段时，才使用 `extra_body`。Hermes 会原样转发该对象。

:::warning
`extra_body` 仅在您提供商实际支持您发送的字段时才有效。如果提供商不暴露原生的 OpenAI 兼容推理关闭标志，Hermes 无法为其合成一个。
:::

### 辅助任务的 OpenRouter 路由与 Pareto Code

当辅助任务解析到 OpenRouter（无论是显式设置还是通过 `provider: "main"`，而您的主智能体在 OpenRouter 上时），主智能体的 `provider_routing` 和 `openrouter.min_coding_score` 设置**不会传播**——这是设计使然，每个辅助任务都是独立的。要为特定的辅助任务设置 OpenRouter 提供商偏好或使用 [Pareto Code 路由器](/docs/integrations/providers#openrouter-pareto-code-router)，请通过 `extra_body` 逐任务设置：

```yaml
auxiliary:
  compression:
    provider: openrouter
    model: openrouter/pareto-code         # 对此任务使用 Pareto Code 路由器
    extra_body:
      provider:                            # OpenRouter 提供商路由偏好
        order: [anthropic, google]         # 按顺序尝试这些提供商
        sort: throughput                   # 或 "price" | "latency"
        # only: [anthropic]                # 限制为特定提供商
        # ignore: [deepinfra]              # 排除特定提供商
      plugins:                             # OpenRouter Pareto Code 路由器开关
        - id: pareto-router
          min_coding_score: 0.5            # 0.0–1.0；越高 = 更强的编码能力
```

其结构与 OpenRouter 在聊天补全请求体中接受的内容一致。Hermes 原样转发整个 `extra_body`，因此在 [openrouter.ai/docs](https://openrouter.ai/docs) 文档中记录的任何其他 OpenRouter 请求体字段都以相同的方式工作。

### 更改视觉模型

要使用 GPT-4o 而非 Gemini Flash 进行图像分析：

```yaml
auxiliary:
  vision:
    model: "openai/gpt-4o"
```

或通过环境变量（在 `~/.hermes/.env` 中）：

```bash
AUXILIARY_VISION_MODEL=openai/gpt-4o
```

### 提供商选项

这些选项适用于**辅助任务配置**（`auxiliary:`、`compression:`、`fallback_model:`），而非您的主 `model.provider` 设置。

| 提供商 | 描述 | 要求 |
|--------|------|------|
| `"auto"` | 最佳可用（默认）。视觉尝试 OpenRouter → Nous → Codex。 | — |
| `"openrouter"` | 强制 OpenRouter — 路由到任何模型（Gemini、GPT-4o、Claude 等） | `OPENROUTER_API_KEY` |
| `"nous"` | 强制 Nous Portal | `hermes auth` |
| `"codex"` | 强制 Codex OAuth（ChatGPT 账户）。支持视觉（gpt-5.3-codex）。 | `hermes model` → Codex |
| `"minimax-oauth"` | 强制 MiniMax OAuth（浏览器登录，无需 API 密钥）。辅助任务使用 MiniMax-M2.7-highspeed。 | `hermes model` → MiniMax (OAuth) |
| `"main"` | 使用您活动的自定义/主端点。这可以来自 `OPENAI_BASE_URL` + `OPENAI_API_KEY` 或通过 `hermes model` / `config.yaml` 保存的自定义端点。适用于 OpenAI、本地模型或任何 OpenAI 兼容 API。**仅限辅助任务——对 `model.provider` 无效。** | 自定义端点凭据 + 基础 URL |

当您希望辅助任务绕过默认路由器时，主提供商目录中的直接 API 密钥提供商也在此处有效。一旦配置了 `GMI_API_KEY`，`gmi` 就是有效的：

```yaml
auxiliary:
  compression:
    provider: "gmi"
    model: "anthropic/claude-opus-4.6"
```

对于 GMI 辅助路由，请使用 GMI 的 `/v1/models` 端点返回的确切模型 ID。

### 常见设置

**使用直接自定义端点**（比 `provider: "main"` 更清晰，适用于本地/自托管 API）：
```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 优先于 `provider`，因此这是将辅助任务路由到特定端点的最明确方式。对于直接端点覆盖，Hermes 使用配置的 `api_key` 或回退到 `OPENAI_API_KEY`；它不会为该自定义端点重用 `OPENROUTER_API_KEY`。

**使用 OpenAI API 密钥进行视觉处理：**
```yaml
# 在 ~/.hermes/.env 中：
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_API_KEY=sk-...

auxiliary:
  vision:
    provider: "main"
    model: "gpt-4o"       # 或 "gpt-4o-mini" 以节省成本
```

**使用 OpenRouter 进行视觉处理**（路由到任何模型）：
```yaml
auxiliary:
  vision:
    provider: "openrouter"
    model: "openai/gpt-4o"      # 或 "google/gemini-2.5-flash" 等
```

**使用 Codex OAuth**（ChatGPT Pro/Plus 账户——无需 API 密钥）：
```yaml
auxiliary:
  vision:
    provider: "codex"     # 使用您的 ChatGPT OAuth 令牌
    # model 默认为 gpt-5.3-codex（支持视觉）
```

**使用 MiniMax OAuth**（浏览器登录，无需 API 密钥）：
```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-oauth
  base_url: https://api.minimax.io/anthropic
```
运行 `hermes model` 并选择 **MiniMax (OAuth)** 登录并自动设置此项。对于中国区，基础 URL 将是 `https://api.minimaxi.com/anthropic`。有关完整演练，请参阅 [MiniMax OAuth 指南](../guides/minimax-oauth.md)。

**使用本地/自托管模型：**
```yaml
auxiliary:
  vision:
    provider: "main"      # 使用您活动的自定义端点
    model: "my-local-model"
```

`provider: "main"` 使用 Hermes 用于正常聊天的任何提供商——无论是命名的自定义提供商（例如 `beans`），内置的提供商如 `openrouter`，还是传统的 `OPENAI_BASE_URL` 端点。

:::tip
如果您使用 Codex OAuth 作为主模型提供商，视觉功能将自动工作——无需额外配置。Codex 包含在视觉的自动检测链中。
:::

:::warning
**视觉需要多模态模型。** 如果您设置 `provider: "main"`，请确保您的端点支持多模态/视觉——否则图像分析将失败。
:::

### 环境变量（传统方式）

辅助模型也可以通过环境变量配置。但是，`config.yaml` 是首选方法——它更易于管理，并支持所有选项，包括 `base_url` 和 `api_key`。

| 设置 | 环境变量 |
|------|----------|
| 视觉提供商 | `AUXILIARY_VISION_PROVIDER` |
| 视觉模型 | `AUXILIARY_VISION_MODEL` |
| 视觉端点 | `AUXILIARY_VISION_BASE_URL` |
| 视觉 API 密钥 | `AUXILIARY_VISION_API_KEY` |
| 网页提取提供商 | `AUXILIARY_WEB_EXTRACT_PROVIDER` |
| 网页提取模型 | `AUXILIARY_WEB_EXTRACT_MODEL` |
| 网页提取端点 | `AUXILIARY_WEB_EXTRACT_BASE_URL` |
| 网页提取 API 密钥 | `AUXILIARY_WEB_EXTRACT_API_KEY` |

压缩和回退模型设置仅限于 config.yaml。

:::tip
运行 `hermes config` 可查看您当前的辅助模型设置。仅当覆盖值与默认值不同时才会显示。
:::

```yaml
agent:
  reasoning_effort: ""   # 空值 = 中等（默认）。选项：none, minimal, low, medium, high, xhigh（最大）
```

当未设置（默认）时，推理努力默认为“中等”——这是一个平衡的级别，适用于大多数任务。设置一个值会覆盖它——更高的推理努力在复杂任务上能产生更好的结果，但代价是更多的令牌和延迟。

您也可以在运行时使用 `/reasoning` 命令更改推理努力：

```
/reasoning           # 显示当前努力级别并显示状态
/reasoning high      # 将推理努力设置为高
/reasoning none      # 禁用推理
/reasoning show      # 在每次响应上方显示模型思考
/reasoning hide      # 隐藏模型思考
```

## 工具使用强制

某些模型偶尔会将预期的操作描述为文本，而不是进行工具调用（“我会运行测试...”而不是实际调用终端）。工具使用强制会注入系统提示引导，使模型重新回到实际调用工具的正轨。

```yaml
agent:
  tool_use_enforcement: "auto"   # "auto" | true | false | ["model-substring", ...]
```

| 值 | 行为 |
|-------|----------|
| `"auto"`（默认） | 对匹配以下名称的模型启用：`gpt`, `codex`, `gemini`, `gemma`, `grok`。对所有其他模型（Claude, DeepSeek, Qwen 等）禁用。 |
| `true` | 始终启用，无论模型如何。如果您注意到当前模型描述操作而不是执行它们，这很有用。 |
| `false` | 始终禁用，无论模型如何。 |
| `["gpt", "codex", "qwen", "llama"]` | 仅当模型名称包含列出的子字符串之一时启用（不区分大小写）。 |

### 它注入了什么

启用时，可能会向系统提示添加三层引导：

1.  **通用工具使用强制**（所有匹配的模型）——指示模型立即进行工具调用而不是描述意图，持续工作直到任务完成，并且永远不要以未来行动的承诺结束轮次。

2.  **OpenAI 执行纪律**（仅限 GPT 和 Codex 模型）——解决 GPT 特定故障模式的额外引导：在部分结果上放弃工作、跳过必要的查找、幻觉而不是使用工具，以及在未验证的情况下宣布“完成”。

3.  **Google 操作指导**（仅限 Gemini 和 Gemma 模型）——简洁性、绝对路径、并行工具调用以及编辑前验证模式。

这些对用户是透明的，并且只影响系统提示。已经可靠使用工具的模型（如 Claude）不需要这种引导，这就是为什么 `"auto"` 会排除它们。

### 何时启用它

如果您使用的模型不在默认自动列表中，并且注意到它经常描述它*会*做什么而不是实际去做，请设置 `tool_use_enforcement: true` 或将模型子字符串添加到列表中：

```yaml
agent:
  tool_use_enforcement: ["gpt", "codex", "gemini", "grok", "my-custom-model"]
```

## TTS 配置

```yaml
tts:
  provider: "edge"              # "edge" | "elevenlabs" | "openai" | "minimax" | "mistral" | "gemini" | "xai" | "neutts"
  speed: 1.0                    # 全局速度乘数（所有提供商的后备值）
  edge:
    voice: "en-US-AriaNeural"   # 322 种声音，74 种语言
    speed: 1.0                  # 速度乘数（转换为速率百分比，例如 1.5 → +50%）
  elevenlabs:
    voice_id: "pNInz6obpgDQGcFmaJgB"
    model_id: "eleven_multilingual_v2"
  openai:
    model: "gpt-4o-mini-tts"
    voice: "alloy"              # alloy, echo, fable, onyx, nova, shimmer
    speed: 1.0                  # 速度乘数（API 限制在 0.25–4.0 之间）
    base_url: "https://api.openai.com/v1"  # 可覆盖 OpenAI 兼容的 TTS 端点
  minimax:
    speed: 1.0                  # 语速乘数
    # base_url: ""              # 可选：覆盖 OpenAI 兼容的 TTS 端点
  mistral:
    model: "voxtral-mini-tts-2603"
    voice_id: "c69964a6-ab8b-4f8a-9465-ec0925096ec8"  # Paul - 中性（默认）
  gemini:
    model: "gemini-2.5-flash-preview-tts"   # 或 gemini-2.5-pro-preview-tts
    voice: "Kore"               # 30 种预置声音：Zephyr, Puck, Kore, Enceladus 等。
  xai:
    voice_id: "eve"             # xAI TTS 声音
    language: "en"              # ISO 639-1 语言代码
    sample_rate: 24000
    bit_rate: 128000            # MP3 比特率
    # base_url: "https://api.x.ai/v1"
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
```

这控制着 `text_to_speech` 工具和语音模式下的口头回复（CLI 中的 `/voice tts` 或消息网关）。

**速度后备层级：** 特定提供商的速度（例如 `tts.edge.speed`） → 全局 `tts.speed` → `1.0` 默认值。设置全局 `tts.speed` 可为所有提供商应用统一速度，或按提供商覆盖以进行精细控制。

## 显示设置

```yaml
display:
  tool_progress: all      # off | new | all | verbose
  tool_progress_command: false  # 在消息网关中启用 /verbose 斜杠命令
  platforms: {}           # 每平台显示覆盖（见下文）
  tool_progress_overrides: {}  # 已弃用 — 请改用 display.platforms
  interim_assistant_messages: true  # 网关：将自然的中间回合助手更新作为单独消息发送
  skin: default           # 内置或自定义 CLI 外观主题（参见 user-guide/features/skins）
  personality: "kawaii"  # 旧版美化字段，仍在某些摘要中显示
  compact: false          # 紧凑输出模式（更少空白）
  resume_display: full    # full（恢复时显示先前消息） | minimal（仅显示一行）
  bell_on_complete: false # 智能体完成时播放终端提示音（适用于长任务）
  show_reasoning: false   # 在每个回复上方显示模型推理/思考过程（通过 /reasoning show|hide 切换）
  streaming: false        # 将 token 流式传输到终端（实时输出）
  show_cost: false        # 在 CLI 状态栏显示预估费用（$）
  tool_preview_length: 0  # 工具调用预览的最大字符数（0 = 无限制，显示完整路径/命令）
  runtime_footer:         # 网关：在最终回复中附加运行时上下文页脚
    enabled: false
    fields: ["model", "context_pct", "cwd"]
  language: en            # 静态消息的 UI 语言（审批提示、部分网关回复）。en | zh | ja | de | es | fr | tr | uk
```

### 静态消息的 UI 语言

`display.language` 设置翻译一小组静态的用户面向消息 — CLI 审批提示、少量网关斜杠命令回复（例如，重启排空通知、“审批已过期”、“目标已清除”）。它**不会**翻译智能体回复、日志行、工具输出、错误回溯或斜杠命令描述 — 这些内容保持英文。如果您希望智能体本身用其他语言回复，只需在提示词或系统消息中告知即可。

支持的值：`en`（默认），`zh`（简体中文），`ja`（日语），`de`（德语），`es`（西班牙语），`fr`（法语），`tr`（土耳其语），`uk`（乌克兰语）。未知值将回退到英文。

您也可以通过 `HERMES_LANGUAGE` 环境变量在每个会话中设置此值，它会覆盖配置文件中的值。

```yaml
display:
  language: zh   # CLI 审批提示将显示为中文
```

| 模式 | 显示内容 |
|------|----------|
| `off` | 静默 — 仅显示最终回复 |
| `new` | 仅当工具更改时显示工具指示器 |
| `all` | 每次工具调用都显示简短预览（默认） |
| `verbose` | 显示完整参数、结果和调试日志 |

在 CLI 中，使用 `/verbose` 在这些模式间循环。要在消息平台（Telegram, Discord, Slack 等）中使用 `/verbose`，请在上面的 `display` 部分设置 `tool_progress_command: true`。该命令随后会循环切换模式并保存到配置文件。

### 运行时元数据页脚（仅限网关）

当 `display.runtime_footer.enabled: true` 时，Hermes 会在每个网关回合的**最终**消息中附加一个小的运行时上下文页脚 — 与 CLI 在其状态栏中显示的信息相同（模型、上下文百分比、当前工作目录、会话持续时间、Token 数、费用）。默认关闭；如果你的团队希望每条回复都包含来源信息，可以按网关选择启用。

```yaml
display:
  runtime_footer:
    enabled: true
    fields: ["model", "context_pct", "cwd"]   # 可选项：model, context_pct, cwd, duration, tokens, cost
```

在任何会话中，使用 `/footer` 斜杠命令可在运行时切换此功能。

附加到 Telegram/Discord/Slack 回复的示例页脚：

```
— claude-opus-4.7 · 12 次工具调用 · 2m 14s · $0.042
```

仅一个回合的**最终**消息会获得页脚；中间更新保持简洁。

### 每平台进度覆盖

不同的平台有不同的详细程度需求。例如，Signal 无法编辑消息，因此每次进度更新都会成为一条单独的消息 — 比较嘈杂。使用 `display.platforms` 来设置每平台的模式：

```yaml
display:
  tool_progress: all          # 全局默认值
  platforms:
    signal:
      tool_progress: 'off'    # 在 Signal 上静默进度
    telegram:
      tool_progress: verbose  # 在 Telegram 上显示详细进度
    slack:
      tool_progress: 'off'    # 在共享的 Slack 工作区保持安静
```

没有覆盖的平台会回退到全局 `tool_progress` 值。有效的平台键名：`telegram`, `discord`, `slack`, `signal`, `whatsapp`, `matrix`, `mattermost`, `email`, `sms`, `homeassistant`, `dingtalk`, `feishu`, `wecom`, `weixin`, `bluebubbles`, `qqbot`。旧的 `display.tool_progress_overrides` 键名仍会为向后兼容性而加载，但已弃用，并在首次加载时迁移至 `display.platforms`。

`interim_assistant_messages` 仅适用于网关。启用后，Hermes 会将已完成的中间回合助手更新作为单独的聊天消息发送。这与 `tool_progress` 无关，并且不需要网关流式传输。

## 隐私

```yaml
privacy:
  redact_pii: false  # 从 LLM 上下文中剥离个人身份信息（仅限网关）
```

当 `redact_pii` 为 `true` 时，网关会在支持的平台上将系统提示词中的个人身份信息发送给 LLM 之前进行编辑：

| 字段 | 处理方式 |
|------|----------|
| 电话号码（WhatsApp/Signal 上的用户 ID） | 哈希处理为 `user_<12位-sha256值>` |
| 用户 ID | 哈希处理为 `user_<12位-sha256值>` |
| 聊天 ID | 数字部分哈希处理，平台前缀保留（`telegram:<哈希值>`） |
| 主频道 ID | 数字部分哈希处理 |
| 用户名 / 账号名 | **不受影响**（用户自选，公开可见） |

**平台支持：** 编辑适用于 WhatsApp、Signal 和 Telegram。Discord 和 Slack 被排除在外，因为它们的提及系统（`<@user_id>`）需要在 LLM 上下文中使用真实 ID。

哈希是确定性的 — 同一个用户总是映射到相同的哈希值，因此模型仍然可以在群聊中区分用户。路由和消息传递在内部使用原始值。

## 语音转文字 (STT)

```yaml
stt:
  provider: "local"            # "local" | "groq" | "openai" | "mistral"
  local:
    model: "base"              # tiny, base, small, medium, large-v3
  openai:
    model: "whisper-1"         # whisper-1 | gpt-4o-mini-transcribe | ggpt-4o-transcribe
  # model: "whisper-1"         # 仍被支持的旧版备用键
```

提供者行为：
- `local` 使用在您的机器上运行的 `faster-whisper`。请通过 `pip install faster-whisper` 单独安装。
- `groq` 使用 Groq 的 Whisper 兼容端点，并读取 `GROQ_API_KEY`。
- `openai` 使用 OpenAI 语音 API，并读取 `VOICE_TOOLS_OPENAI_KEY`。

如果请求的提供者不可用，Hermes 将按以下顺序自动回退：`local` → `groq` → `openai`。

Groq 和 OpenAI 模型覆盖由环境变量驱动：

```bash
STT_GROQ_MODEL=whisper-large-v3-turbo
STT_OPENAI_MODEL=whisper-1
GROQ_BASE_URL=https://api.groq.com/openai/v1
STT_OPENAI_BASE_URL=https://api.openai.com/v1
```

## 语音模式 (CLI)

```yaml
voice:
  record_key: "ctrl+b"         # CLI 内的按键说话键
  max_recording_seconds: 120    # 长时间录音的硬停止限制
  auto_tts: false               # 启用 /voice on 时自动生成语音回复
  beep_enabled: true            # 在 CLI 语音模式下播放录音开始/停止提示音
  silence_threshold: 200        # 语音检测的 RMS 阈值
  silence_duration: 3.0         # 自动停止前的静音秒数
```

在 CLI 中使用 `/voice on` 启用麦克风模式，使用 `record_key` 开始/停止录音，使用 `/voice tts` 切换语音回复。有关端到端设置和特定平台的行为，请参见[语音模式](/docs/user-guide/features/voice-mode)。

## 流式传输

将令牌实时流式传输到终端或消息平台，而非等待完整响应。

### 命令行界面流式传输

```yaml
display:
  streaming: true         # 实时流式传输令牌到终端
  show_reasoning: true    # 同时流式传输推理/思考令牌（可选）
```

启用后，响应会逐令牌显示在流式传输框中。工具调用仍会静默捕获。如果提供者不支持流式传输，系统会自动回退到正常显示模式。

### 网关流式传输（Telegram, Discord, Slack）

```yaml
streaming:
  enabled: true           # 启用渐进式消息编辑
  transport: edit         # "edit"（渐进式消息编辑）或 "off"
  edit_interval: 0.3      # 消息编辑间隔（秒）
  buffer_threshold: 40    # 强制刷新编辑前的字符数
  cursor: " ▉"            # 流式传输期间显示的游标
  fresh_final_after_seconds: 60   # 预览消息过时时（Telegram）发送全新最终消息；0 = 始终就地编辑
```

启用后，机器人会在第一个令牌时发送一条消息，然后随着更多令牌到达逐步编辑它。不支持消息编辑的平台（Signal, Email, Home Assistant）会在首次尝试时自动检测——该会话的流式传输会被优雅禁用，不会产生大量消息。

若需在无渐进式令牌编辑的情况下进行独立的自然中间回合助手更新，请设置 `display.interim_assistant_messages: true`。

**溢出处理：** 如果流式传输的文本超过平台的消息长度限制（约4096个字符），当前消息会被终结，并自动开始一条新消息。

**全新最终消息（Telegram）：** Telegram 的 `editMessageText` 会保留原始消息的时间戳，因此一个长时间运行的流式回复在完成后仍会保持第一个令牌的时间戳。当 `fresh_final_after_seconds > 0`（默认 `60`）时，完成的回复会作为一条全新消息发送（尽力删除过时的预览消息），以便 Telegram 的可见时间戳反映完成时间。简短的预览仍会就地终结。设置为 `0` 则始终就地编辑。

:::note
流式传输默认禁用。在 `~/.hermes/config.yaml` 中启用它以体验流式传输用户体验。
:::

## 群聊会话隔离

控制共享聊天是每个房间保持一个对话，还是每个参与者一个对话：

```yaml
group_sessions_per_user: true  # true = 群组/频道中按用户隔离，false = 每个聊天一个共享会话
```

- `true` 是默认且推荐的设置。在 Discord 频道、Telegram 群组、Slack 频道及类似的共享上下文中，当平台提供用户 ID 时，每个发送者都会获得自己的会话。
- `false` 会恢复旧的共享房间行为。如果您明确希望 Hermes 将频道视为一个协作对话，这可能很有用，但这也意味着用户共享上下文、令牌成本和中断状态。
- 私信不受影响。Hermes 仍会像往常一样通过聊天/私信 ID 来标识私信。
- 无论哪种设置，线程都会与其父频道隔离；在 `true` 设置下，线程内的每个参与者也会获得自己的会话。

有关行为细节和示例，请参见 [会话](/docs/user-guide/sessions) 和 [Discord 指南](/docs/user-guide/messaging/discord)。

## 未授权私信行为

控制当未知用户发送私信时 Hermes 的行为：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `pair` 是默认行为。Hermes 拒绝访问，但会在私信中回复一个一次性配对码。
- `ignore` 会静默丢弃未授权的私信。
- 平台特定的配置段会覆盖全局默认值，因此您可以广泛启用配对功能，同时让某个平台保持静默。

## 快速命令

定义自定义命令，这些命令可以运行 shell 命令而无需调用大型语言模型，或者将一个斜杠命令别名到另一个。可执行快速命令零令牌消耗，适用于消息平台（Telegram, Discord 等），用于快速服务器检查或实用脚本。

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

用法：在命令行界面或任何消息平台中输入 `/status`、`/disk`、`/update`、`/gpu` 或 `/restart`。`exec` 命令在本地主机上运行并直接返回输出——无大型语言模型调用，无令牌消耗。`alias` 命令会重写为配置的斜杠命令目标。

- **30秒超时** — 长时间运行的命令会被终止并返回错误信息
- **优先级** — 快速命令会在技能命令之前检查，因此您可以覆盖技能名称
- **自动补全** — 快速命令在调度时解析，不会显示在内置的斜杠命令自动补全表中
- **类型** — 支持的类型为 `exec` 和 `alias`；其他类型会显示错误
- **处处可用** — 命令行界面、Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant

纯字符串的提示快捷方式不是有效的快速命令。对于可重用的提示工作流，请创建一个技能或别名到现有的斜杠命令。

## 人类延迟

在消息平台中模拟类人的响应节奏：

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
  mode: project                # project（默认） | strict
  timeout: 300                 # 最大执行时间（秒）
  max_tool_calls: 50           # 代码执行内的最大工具调用次数
```

**`mode`** 控制脚本的工作目录和 Python 解释器：

- **`project`**（默认）— 脚本在会话的工作目录中运行，使用活动的 virtualenv/conda 环境的 python。项目依赖（`pandas`、`torch`、项目包）和相对路径（`.env`、`./data.csv`）会自然解析，与 `terminal()` 所见一致。
- **`strict`** — 脚本在临时暂存目录中运行，使用 `sys.executable`（Hermes 自身的 python）。最大限度的可重复性，但项目依赖和相对路径无法解析。

环境清理（剥离 `*_API_KEY`、`*_TOKEN`、`*_SECRET`、`*_PASSWORD`、`*_CREDENTIAL`、`*_PASSWD`、`*_AUTH`）和工具白名单在两种模式下完全相同——切换模式不会改变安全态势。

## 网络搜索后端

`web_search`、`web_extract` 和 `web_crawl` 工具支持五个后端提供者。在 `config.yaml` 或通过 `hermes tools` 中配置后端：

```yaml
web:
  backend: firecrawl    # firecrawl | searxng | parallel | tavily | exa

  # 或使用按功能的键来混合提供者（例如，免费搜索 + 付费提取）：
  search_backend: "searxng"
  extract_backend: "firecrawl"
```

| 后端 | 环境变量 | 搜索 | 提取 | 爬取 |
|---------|---------|--------|---------|-------|
| **Firecrawl** (默认) | `FIRECRAWL_API_KEY` | ✔ | ✔ | ✔ |
| **SearXNG** | `SEARXNG_URL` | ✔ | — | — |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ | — |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ | ✔ |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ | — |

**后端选择：** 如果未设置 `web.backend`，后端会根据可用的 API 密钥自动检测。如果仅设置了 `SEARXNG_URL`，则使用 SearXNG。如果仅设置了 `EXA_API_KEY`，则使用 Exa。如果仅设置了 `TAVILY_API_KEY`，则使用 Tavily。如果仅设置了 `PARALLEL_API_KEY`，则使用 Parallel。否则 Firecrawl 是默认后端。

**SearXNG** 是一个免费、自托管、尊重隐私的元搜索引擎，可查询 70 多个搜索引擎。无需 API 密钥——只需将 `SEARXNG_URL` 设置为您的实例（例如，`http://localhost:8080`）。SearXNG 仅用于搜索；`web_extract` 和 `web_crawl` 需要单独的提取提供者（设置 `web.extract_backend`）。有关 Docker 设置说明，请参阅 [网络搜索设置指南](/docs/user-guide/features/web-search)。

**自托管 Firecrawl：** 将 `FIRECRAWL_API_URL` 设置为指向您自己的实例。当设置自定义 URL 时，API 密钥变为可选（在服务器上设置 `USE_DB_AUTHENTICATION=***` 以禁用身份验证）。

**并行搜索模式：** 设置 `PARALLEL_SEARCH_MODE` 以控制搜索行为 — `fast`、`one-shot` 或 `agentic`（默认：`agentic`）。

**Exa：** 在 `~/.hermes/.env` 中设置 `EXA_API_KEY`。支持 `category` 过滤（`company`、`research paper`、`news`、`people`、`personal site`、`pdf`）以及域名/日期过滤。

## 浏览器

配置浏览器自动化行为：

```yaml
browser:
  inactivity_timeout: 120        # 自动关闭闲置会话前的秒数
  command_timeout: 30             # 浏览器命令（截图、导航等）的超时时间（秒）
  record_sessions: false         # 将浏览器会话自动录制为WebM视频，保存至 ~/.hermes/browser_recordings/
  # 可选的 CDP 覆盖 — 设置后，Hermes 会直接连接到你自己的 Chrome（通过 /browser connect），
  # 而非启动一个无头浏览器。
  cdp_url: ""
  # 对话监控器 — 控制当连接了 CDP 后端（Browserbase、通过 /browser connect 连接的本地 Chrome）
  # 时，原生 JS 对话框（alert / confirm / prompt）的处理方式。
  # 在 Camofox 和默认的本地智能体-浏览器模式下会被忽略。
  dialog_policy: must_respond    # must_respond | auto_dismiss | auto_accept
  dialog_timeout_s: 300          # 在 must_respond 策略下的安全自动关闭时间（秒）
  camofox:
    managed_persistence: false   # 为 true 时，Camofox 会话在重启后会保留 cookies/登录状态
```

**对话策略：**

- `must_respond`（默认）— 捕获对话框，在 `browser_snapshot.pending_dialogs` 中将其显示出来，并等待智能体调用 `browser_dialog(action=...)`。如果在 `dialog_timeout_s` 秒内没有响应，对话框会被自动关闭，以防止页面的 JS 线程永远阻塞。
- `auto_dismiss` — 捕获后立即关闭。事后，智能体仍可在 `browser_snapshot.recent_dialogs` 中看到带有 `closed_by="auto_policy"` 标记的对话记录。
- `auto_accept` — 捕获后立即接受。适用于具有激进 `beforeunload` 提示的页面。

完整的对话工作流请参见 [浏览器功能页面](./features/browser.md#browser_dialog)。

浏览器工具集支持多种供应商。有关 Browserbase、Browser Use 和本地 Chrome CDP 设置的详细信息，请参阅 [浏览器功能页面](/docs/user-guide/features/browser)。

## 时区

使用 IANA 时区字符串覆盖服务器本地时区。影响日志中的时间戳、定时任务调度和系统提示时间注入。

```yaml
timezone: "America/New_York"   # IANA 时区（默认："" = 服务器本地时间）
```

支持的值：任何 IANA 时区标识符（例如 `America/New_York`、`Europe/London`、`Asia/Kolkata`、`UTC`）。留空或省略则使用服务器本地时间。

## Discord

为消息网关配置Discord特定行为：

```yaml
discord:
  require_mention: true          # 在服务器频道中需要@提及才能回复
  free_response_channels: ""     # 无需@提及即可回复的频道ID，用逗号分隔
  auto_thread: true              # 在频道中收到@提及时自动创建线程
```

- `require_mention` — 当设为 `true`（默认）时，机器人仅在服务器频道中收到 `@BotName` 提及时才回复。私信始终无需提及即可回复。
- `free_response_channels` — 用逗号分隔的频道ID列表，机器人将在这些频道中无需提及即可回复每条消息。
- `auto_thread` — 当设为 `true`（默认）时，频道中的提及将自动创建对话线程，保持频道整洁（类似于Slack的线程功能）。

## 安全

执行前安全扫描与密钥脱敏：

```yaml
security:
  redact_secrets: false          # 在工具输出和日志中脱敏API密钥模式（默认关闭）
  tirith_enabled: true           # 为终端命令启用Tirith安全扫描
  tirith_path: "tirith"          # tirith二进制文件路径（默认为$PATH中的"tirith"）
  tirith_timeout: 5              # 等待tirith扫描超时的秒数
  tirith_fail_open: true         # 如果tirith不可用，允许执行命令
  website_blocklist:             # 参见下方"网站屏蔽列表"部分
    enabled: false
    domains: []
    shared_files: []
```

- `redact_secrets` — 当设为 `true` 时，会在工具输出进入对话上下文和日志前，自动检测并脱敏看起来像API密钥、令牌和密码的模式。**默认关闭** — 如果你常在工具输出中使用真实凭据并希望有安全网，请显式设置为 `true` 以启用。
- `tirith_enabled` — 当设为 `true` 时，终端命令在执行前将由 [Tirith](https://github.com/StackGuardian/tirith) 扫描，以检测潜在危险操作。
- `tirith_path` — tirith二进制文件的路径。如果tirith安装在非标准位置，请设置此项。
- `tirith_timeout` — 等待tirith扫描的最大秒数。如果扫描超时，命令将继续执行。
- `tirith_fail_open` — 当设为 `true`（默认）时，如果tirith不可用或失败，命令将被允许执行。设置为 `false` 可在tirith无法验证时阻止命令执行。

## 网站屏蔽列表

阻止智能体的网络和浏览器工具访问特定域名：

```yaml
security:
  website_blocklist:
    enabled: false               # 启用URL屏蔽（默认：false）
    domains:                     # 屏蔽的域名模式列表
      - "*.internal.company.com"
      - "admin.example.com"
      - "*.local"
    shared_files:                # 从外部文件加载额外规则
      - "/etc/hermes/blocked-sites.txt"
```

启用后，任何匹配屏蔽域名模式的URL在网络或浏览器工具执行前将被拒绝。这适用于 `web_search`、`web_extract`、`browser_navigate` 以及任何访问URL的工具。

域名规则支持：
- 精确域名：`admin.example.com`
- 通配符子域名：`*.internal.company.com`（屏蔽所有子域名）
- 顶级域通配符：`*.local`

共享文件每行包含一个域名规则（空行和 `#` 注释会被忽略）。文件缺失或不可读会记录警告，但不会禁用其他网络工具。

策略缓存时间为30秒，因此配置更改无需重启即可快速生效。

## 智能审批

控制Hermes如何处理潜在危险命令：

```yaml
approvals:
  mode: manual   # manual | smart | off
```

| 模式 | 行为 |
|------|------|
| `manual`（默认） | 在执行任何被标记的命令前提示用户。在CLI中显示交互式审批对话框。在消息传递中，将挂起的审批请求排队。 |
| `smart` | 使用辅助LLM评估被标记的命令是否确实危险。低风险命令将被自动批准，并具有会话级持久性。真正有风险的命令将升级给用户。 |
| `off` | 跳过所有审批检查。等同于 `HERMES_YOLO_MODE=true`。**请谨慎使用。** |

智能模式对于减少审批疲劳特别有用——它让智能体在安全操作上可以更自主地工作，同时仍能捕获真正具有破坏性的命令。

:::warning
设置 `approvals.mode: off` 将禁用终端命令的所有安全检查。仅在受信任的沙盒环境中使用。
:::

## 检查点

在破坏性文件操作前自动创建文件系统快照。详见 [检查点与回滚](/docs/user-guide/checkpoints-and-rollback)。

```yaml
checkpoints:
  enabled: false                 # 启用自动检查点（亦可通过: hermes chat --checkpoints）。默认：false（需手动启用）。
  max_snapshots: 20              # 每个目录保留的最大检查点数（默认：20）
```

## 委托

配置委托工具的子智能体行为：

```yaml
delegation:
  # model: "google/gemini-3-flash-preview"  # 覆盖模型（空值=继承父级）
  # provider: "openrouter"                  # 覆盖提供商（空值=继承父级）
  # base_url: "http://localhost:1234/v1"    # 直接OpenAI兼容端点（优先级高于provider）
  # api_key: "local-key"                    # base_url的API密钥（回退到OPENAI_API_KEY）
  max_concurrent_children: 3                # 每批并行子智能体数量（下限为1，无上限）。亦可通过DELEGATION_MAX_CONCURRENT_CHILDREN环境变量设置。
  max_spawn_depth: 1                        # 委托树深度上限（1-3，自动限制）。1=扁平（默认）：父级生成叶子节点，叶子不能再委托。2=编排器子级可生成叶子孙级。3=三级。
  orchestrator_enabled: true                # 全局开关。为false时，role="orchestrator"将被忽略，每个子级无论max_spawn_depth如何都被强制为叶子节点。
```

**子智能体提供商:模型覆盖：** 默认情况下，子智能体继承父智能体的提供商和模型。设置 `delegation.provider` 和 `delegation.model` 可将子智能体路由到不同的提供商:模型对——例如，为范围狭窄的子任务使用廉价/快速的模型，而主智能体运行昂贵的推理模型。

**直接端点覆盖：** 如果你希望使用明显的自定义端点路径，请设置 `delegation.base_url`、`delegation.api_key` 和 `delegation.model`。这会将子智能体直接发送到该OpenAI兼容端点，并优先于 `delegation.provider`。如果省略 `delegation.api_key`，Hermes将仅回退到 `OPENAI_API_KEY`。

委托提供程序使用与CLI/网关启动相同的凭据解析。支持所有已配置的提供商：`openrouter`、`nous`、`copilot`、`zai`、`kimi-coding`、`minimax`、`minimax-cn`。设置提供商时，系统会自动解析正确的基础URL、API密钥和API模式——无需手动配置凭据。

**优先级：** 配置中的 `delegation.base_url` → 配置中的 `delegation.provider` → 父级提供商（继承）。配置中的 `delegation.model` → 父级模型（继承）。仅设置 `model` 而不设置 `provider` 只会更改模型名称，同时保留父级凭据（适用于在同一提供商如OpenRouter内切换模型）。

**宽度与深度：** `max_concurrent_children` 限制每批并行运行的子智能体数量（默认 `3`，下限为1，无上限）。也可通过 `DELEGATION_MAX_CONCURRENT_CHILDREN` 环境变量设置。当模型提交的 `tasks` 数组长度超过上限时，`delegate_task` 将返回解释限制的工具错误，而不是静默截断。`max_spawn_depth` 控制委托树深度（限制在1-3）。默认 `1` 时，委托是扁平的：子级不能生成孙级，传递 `role="orchestrator"` 会静默降级为 `leaf`。提高到 `2` 可使编排器子级生成叶子孙级；`3` 为三级树。智能体通过 `role="orchestrator"` 在每次调用中选择加入编排；`orchestrator_enabled: false` 会强制每个子级回退到叶子节点，无论其他设置如何。成本呈乘法增长——在 `max_spawn_depth: 3` 且 `max_concurrent_children: 3` 时，树最多可达 3×3×3 = 27 个并发叶子智能体。详见 [子智能体委托 → 深度限制与嵌套编排](features/delegation.md#depth-limit-and-nested-orchestration) 了解使用模式。

## 澄清

配置澄清提示行为：

```yaml
clarify:
  timeout: 120                 # 等待用户澄清响应的超时时间（秒）
```

## 上下文文件（SOUL.md, AGENTS.md）

Hermes 使用两种不同的上下文范围：

| 文件 | 用途 | 范围 |
|------|------|------|
| `SOUL.md` | **主要智能体身份** — 定义智能体是谁（系统提示中的插槽 #1） | `~/.hermes/SOUL.md` 或 `$HERMES_HOME/SOUL.md` |
| `.hermes.md` / `HERMES.md` | 项目特定指令（最高优先级） | 向上查找到 Git 根目录 |
| `AGENTS.md` | 项目特定指令、编码规范 | 递归目录查找 |
| `CLAUDE.md` | Claude Code 上下文文件（也会被检测到） | 仅限当前工作目录 |
| `.cursorrules` | Cursor IDE 规则（也会被检测到） | 仅限当前工作目录 |
| `.cursor/rules/*.mdc` | Cursor 规则文件（也会被检测到） | 仅限当前工作目录 |

- **SOUL.md** 是智能体的主要身份。它占据系统提示中的插槽 #1，完全替换内置的默认身份。编辑它可完全自定义智能体是谁。
- 如果 SOUL.md 缺失、为空或无法加载，Hermes 会回退到内置的默认身份。
- **项目上下文文件使用优先级系统** — 仅加载一种类型（首次匹配即生效）：`.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`。SOUL.md 总是独立加载。
- **AGENTS.md** 是分层的：如果子目录也有 AGENTS.md，所有文件都会被合并。
- 如果 SOUL.md 不存在，Hermes 会自动生成一个默认的 `SOUL.md`。
- 所有加载的上下文文件都限制在 20,000 个字符内，并采用智能截断。

另请参见：
- [个性与 SOUL.md](/docs/user-guide/features/personality)
- [上下文文件](/docs/user-guide/features/context-files)

## 工作目录

| 上下文 | 默认 |
|---------|------|
| **CLI (`hermes`)** | 运行命令时的当前目录 |
| **消息网关** | 主目录 `~`（可通过 `MESSAGING_CWD` 覆盖） |
| **Docker / Singularity / Modal / SSH** | 容器或远程机器内用户的主目录 |

覆盖工作目录：
```bash
# 在 ~/.hermes/.env 或 ~/.hermes/config.yaml 中：
MESSAGING_CWD=/home/myuser/projects    # 网关会话
TERMINAL_CWD=/workspace                # 所有终端会话
```