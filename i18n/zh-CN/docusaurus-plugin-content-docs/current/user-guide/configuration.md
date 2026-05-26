---
sidebar_position: 2
title: "配置"
description: "配置 Hermes 智能体 — config.yaml、提供商、模型、API 密钥等"
---

# 配置

所有设置都存储在 `~/.hermes/` 目录中，便于访问。

## 目录结构

```text
~/.hermes/
├── config.yaml     # 设置（模型、终端、TTS、压缩等）
├── .env            # API 密钥和机密信息
├── auth.json       # OAuth 提供商凭证（Nous Portal 等）
├── SOUL.md         # 主要智能体身份（系统提示中的插槽 #1）
├── memories/       # 持久化记忆（MEMORY.md、USER.md）
├── skills/         # 智能体创建的技能（通过 skill_manage 工具管理）
├── cron/           # 定时任务
├── sessions/       # 网关会话
└── logs/           # 日志（errors.log、gateway.log — 机密信息已自动删除）
```

## 管理配置

```bash
hermes config              # 查看当前配置
hermes config edit         # 在编辑器中打开 config.yaml
hermes config set KEY VAL  # 设置特定的值
hermes config check        # 检查缺失的选项（更新后）
hermes config migrate      # 交互式添加缺失的选项

# 示例：
hermes config set model anthropic/claude-opus-4
hermes config set terminal.backend docker
hermes config set OPENROUTER_API_KEY sk-or-...  # 保存到 .env
```

:::tip
`hermes config set` 命令会自动将值路由到正确的文件——API 密钥保存到 `.env`，其他所有配置保存到 `config.yaml`。
:::

## 配置优先级

设置按以下顺序解析（优先级从高到低）：

1. **CLI 参数** — 例如 `hermes chat --model anthropic/claude-sonnet-4`（每次调用覆盖）
2. **`~/.hermes/config.yaml`** — 所有非敏感设置的主配置文件
3. **`~/.hermes/.env`** — 环境变量的回退；**必须**用于存储密钥（API 密钥、令牌、密码）
4. **内置默认值** — 当没有设置任何值时使用的硬编码安全默认值

:::info 经验法则
密钥（API 密钥、机器人令牌、密码）放在 `.env` 中。其他所有内容（模型、终端后端、压缩设置、内存限制、工具集）放在 `config.yaml` 中。当两者都设置时，非敏感设置以 `config.yaml` 为准。
:::

## 环境变量替换

你可以在 `config.yaml` 中使用 `${VAR_NAME}` 语法引用环境变量：

```yaml
auxiliary:
  vision:
    api_key: ${GOOGLE_API_KEY}
    base_url: ${CUSTOM_VISION_URL}

delegation:
  api_key: ${DELEGATION_KEY}
```

单个值中可以使用多个引用：`url: "${HOST}:${PORT}"`。如果引用的变量未设置，占位符将保持原样（`${UNDEFINED_VAR}` 保持不变）。仅支持 `${VAR}` 语法——裸 `$VAR` 不会被展开。

关于 AI 提供商设置（OpenRouter、Anthropic、Copilot、自定义端点、自托管 LLM、备用模型等），请参阅 [AI 提供商](/integrations/providers)。

### 提供商超时

你可以为提供商设置 `providers.<id>.request_timeout_seconds` 来配置提供商级别的请求超时，也可以设置 `providers.<id>.models.<model>.timeout_seconds` 来覆盖特定模型的超时。这适用于每个传输方式（OpenAI-wire、原生 Anthropic、Anthropic 兼容）上的主轮换客户端、备用链、凭据轮换后的重建，以及（对于 OpenAI-wire）每请求的超时参数——因此配置的值优先于旧版的 `HERMES_API_TIMEOUT` 环境变量。

你也可以设置 `providers.<id>.stale_timeout_seconds` 用于非流式的过期调用检测器，以及 `providers.<id>.models.<model>.stale_timeout_seconds` 用于特定模型的覆盖。这优先于旧版的 `HERMES_API_CALL_STALE_TIMEOUT` 环境变量。

如果不设置这些值，则保留旧版默认值（`HERMES_API_TIMEOUT=1800`秒，`HERMES_API_CALL_STALE_TIMEOUT=300`秒，原生 Anthropic 900秒）。目前不适用于 AWS Bedrock（`bedrock_converse` 和 AnthropicBedrock SDK 路径都使用 boto3，有自己的超时配置）。请参阅 [`cli-config.yaml.example`](https://github.com/NousResearch/hermes-agent/blob/main/cli-config.yaml.example) 中的注释示例。

## 终端后端配置

Hermes 支持七种终端后端。每种后端决定了智能体的 shell 命令实际在哪里执行——本地机器、Docker 容器、通过 SSH 连接的远程服务器、Modal 云沙箱（直接或通过 Nous 管理的网关）、Daytona 工作区、Vercel 沙箱，或 Singularity/Apptainer 容器。

```yaml
terminal:
  backend: local    # local | docker | ssh | modal | daytona | vercel_sandbox | singularity
  cwd: "."          # 网关/定时任务的工作目录（CLI 始终使用启动目录）
  timeout: 180      # 每个命令的超时时间（秒）
  env_passthrough: []  # 要转发到沙箱执行的环境变量名称（terminal + execute_code）
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"  # Singularity 后端的容器镜像
  modal_image: "nikolaik/python-nodejs:python3.11-nodejs20"                 # Modal 后端的容器镜像
  daytona_image: "nikolaik/python-nodejs:python3.11-nodejs20"               # Daytona 后端的容器镜像
```

对于 Modal、Daytona 和 Vercel 沙箱等云沙箱，`container_persistent: true` 表示 Hermes 将尝试在沙箱重新创建之间保留文件系统状态。它不保证相同的实时沙箱、PID 空间或后台进程会在稍后继续运行。

### 后端概览

| 后端 | 命令运行位置 | 隔离级别 | 最适合 |
|---------|-------------------|-----------|----------|
| **local** | 直接在你的机器上 | 无 | 开发、个人使用 |
| **docker** | 单个持久化 Docker 容器（跨会话、`/new`、子智能体共享） | 完全（命名空间、cap-drop） | 安全沙箱、CI/CD |
| **ssh** | 通过 SSH 连接的远程服务器 | 网络边界 | 远程开发、高性能硬件 |
| **modal** | Modal 云沙箱 | 完全（云 VM） | 临时云计算、评估 |
| **daytona** | Daytona 工作区 | 完全（云容器） | 托管云开发环境 |
| **vercel_sandbox** | Vercel 沙箱 | 完全（云微 VM） | 具有快照支持的文件系统持久性的云执行 |
| **singularity** | Singularity/Apptainer 容器 | 命名空间（--containall） | HPC 集群、共享机器 |

### 本地后端

默认选项。命令直接在你的机器上运行，没有隔离。无需特殊设置。

```yaml
terminal:
  backend: local
```

:::warning
智能体拥有与你的用户帐户相同的文件系统访问权限。使用 `hermes tools` 禁用你不需要的工具，或切换到 Docker 进行沙箱隔离。
:::

### Docker 后端

在具有安全加固的 Docker 容器内运行命令（所有能力被丢弃、无权限提升、PID 限制）。

**单个持久化容器，而非每个命令一个容器。** Hermes 在首次使用时启动一个长期存活的容器，并通过 `docker exec` 将每个终端、文件和 `execute_code` 调用路由到同一个容器——跨会话、`/new`、`/reset` 和 `delegate_task` 子智能体——在 Hermes 进程的整个生命周期内。工作目录变更、安装的包和 `/workspace` 中的文件在工具调用之间保持，就像本地 shell 一样。容器在关闭时停止并移除。有关详情，请参阅下面的**容器生命周期**。

```yaml
terminal:
  backend: docker
  docker_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  docker_mount_cwd_to_workspace: false  # 将启动目录挂载到 /workspace
  docker_run_as_host_user: false   # 参见下面的"以宿主用户运行容器"
  docker_forward_env:              # 转发到容器中的环境变量
    - "GITHUB_TOKEN"
  docker_volumes:                  # 宿主目录挂载
    - "/home/user/projects:/workspace/projects"
    - "/home/user/data:/data:ro"   # :ro 表示只读
  docker_extra_args:               # 追加到 `docker run` 的额外标志（原样附加）
    - "--gpus=all"
    - "--network=host"

  # 资源限制
  container_cpu: 1                 # CPU 核心数（0 = 无限制）
  container_memory: 5120           # MB（0 = 无限制）
  container_disk: 51200            # MB（需要 XFS+pquota 上的 overlay2）
  container_persistent: true       # 跨会话持久化 /workspace 和 /root
```

**`terminal.docker_extra_args`**（也可通过 `TERMINAL_DOCKER_EXTRA_ARGS='["--gpus=all"]'` 覆盖）允许你传递 Hermes 没有作为一等键暴露的任意 `docker run` 标志——`--gpus`、`--network`、`--add-host`、替代的 `--security-opt` 覆盖等。每个条目必须是字符串；列表最后附加到组装的 `docker run` 调用中，因此如果需要可以覆盖 Hermes 的默认值。请谨慎使用——与沙箱加固冲突的标志（能力丢弃、`--user`、工作区绑定挂载）会悄然削弱隔离性。

**要求：** 已安装并运行 Docker Desktop 或 Docker Engine。Hermes 探测 `$PATH` 加上常见的 macOS 安装位置（`/usr/local/bin/docker`、`/opt/homebrew/bin/docker`、Docker Desktop 应用包）。原生支持 Podman：设置 `HERMES_DOCKER_BINARY=podman`（或完整路径）在两者都安装时强制使用它。

**容器生命周期：** Hermes 为每个终端和文件工具调用复用一个长期存活的容器（`docker run -d ... sleep 2h`），跨会话、`/new`、`/reset` 和 `delegate_task` 子智能体，在 Hermes 进程的整个生命周期内。命令通过 `docker exec` 使用登录 shell 运行，因此工作目录变更、安装的包和 `/workspace` 中的文件都从一个工具调用保持到下一个。容器在 Hermes 关闭时（或当空闲扫描回收它时）停止并移除。

通过 `delegate_task(tasks=[...])` 生成的并行子智能体共享这一个容器——并发的 `cd`、环境变量变更和对同一路径的写入会冲突。如果子智能体需要一个隔离的沙箱，它必须通过 `register_task_env_overrides()` 注册每个任务的镜像覆盖，RL 和基准测试环境（TerminalBench2、HermesSweEnv 等）会自动为其每个任务的 Docker 镜像执行此操作。

**安全加固：**
- `--cap-drop ALL`，仅添加回 `DAC_OVERRIDE`、`CHOWN`、`FOWNER`
- `--security-opt no-new-privileges`
- `--pids-limit 256`
- `/tmp`（512MB）、`/var/tmp`（256MB）、`/run`（64MB）的大小限制 tmpfs

**凭据转发：** `docker_forward_env` 中列出的环境变量首先从你的 shell 环境解析，然后回退到 `~/.hermes/.env`。技能还可以声明 `required_environment_variables`，这些会自动合并。

### SSH 后端

通过 SSH 在远程服务器上运行命令。使用 ControlMaster 进行连接复用（5 分钟空闲保活）。默认启用持久化 shell——状态（cwd、环境变量）在命令之间保持。

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
|----------|---------|-------------|
| `TERMINAL_SSH_PORT` | `22` | SSH 端口 |
| `TERMINAL_SSH_KEY` | （系统默认） | SSH 私钥路径 |
| `TERMINAL_SSH_PERSISTENT` | `true` | 启用持久化 shell |

**工作原理：** 在初始化时使用 `BatchMode=yes` 和 `StrictHostKeyChecking=accept-new` 连接。持久化 shell 在远程主机上保持一个 `bash -l` 进程存活，通过临时文件进行通信。需要 `stdin_data` 或 `sudo` 的命令会自动回退到一次性模式。

### Modal 后端

在 [Modal](https://modal.com) 云沙箱中运行命令。每个任务获得一个可配置 CPU、内存和磁盘的隔离 VM。文件系统可以在会话间快照/恢复。

```yaml
terminal:
  backend: modal
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB（5GB）
  container_disk: 51200            # MB（50GB）
  container_persistent: true       # 快照/恢复文件系统
```

**必需：** `MODAL_TOKEN_ID` + `MODAL_TOKEN_SECRET` 环境变量，或 `~/.modal.toml` 配置文件。

**持久性：** 启用后，沙箱文件系统在清理时进行快照，在下次会话时恢复。快照记录在 `~/.hermes/modal_snapshots.json` 中。这保留的是文件系统状态，而非活动进程、PID 空间或后台任务。

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

**持久性：** 启用后，沙箱在清理时停止（而非删除），在下次会话时恢复。沙箱名称遵循 `hermes-{task_id}` 的模式。

**磁盘限制：** Daytona 强制最大 10 GiB。超过此值的请求会被限制并发出警告。

### Vercel 沙箱后端

在 [Vercel 沙箱](https://vercel.com/docs/vercel-sandbox) 云微 VM 中运行命令。Hermes 使用标准的终端和文件工具接口；没有 Vercel 特定的面向模型的工具。

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

**必需认证：** 配置访问令牌认证，需要同时设置 `VERCEL_TOKEN`、`VERCEL_PROJECT_ID` 和 `VERCEL_TEAM_ID`。这是在 Render、Railway、Docker 和类似宿主上部署和正常长期运行的 Hermes 进程所支持的设置。

对于一次性本地开发，Hermes 也接受短期 Vercel OIDC 令牌：

```bash
VERCEL_OIDC_TOKEN="$(vc project token <project-name>)" hermes chat
```

从已链接的 Vercel 项目目录中，你可以省略项目名称：

```bash
VERCEL_OIDC_TOKEN="$(vc project token)" hermes chat
```

OIDC 令牌是短期的，不应作为文档化的部署路径使用。

**运行时：** `terminal.vercel_runtime` 支持 `node24`、`node22` 和 `python3.13`。如果未设置，Hermes 默认使用 `node24`。

**持久性：** 当 `container_persistent: true` 时，Hermes 在清理期间对沙箱文件系统进行快照，并在之后为同一任务从该快照恢复沙箱。快照内容可以包括复制到沙箱中的 Hermes 同步凭据、技能和缓存文件。这仅保留文件系统状态；不保留活动沙箱身份、PID 空间、shell 状态或运行中的后台进程。

**后台命令：** `terminal(background=true)` 使用 Hermes 的通用非本地后台进程流程。你可以在沙箱存活期间通过常规进程工具生成、轮询、等待、查看日志和终止进程。Hermes 不在清理或重启后提供原生的 Vercel 分离进程恢复。

**磁盘大小：** Vercel 沙箱目前不支持 Hermes 的 `container_disk` 资源配置。请将 `container_disk` 留空或保持共享默认值 `51200`；非默认值会导致诊断和后端创建失败，而不是被静默忽略。

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

**镜像处理：** Docker URL（`docker://...`）会自动转换为 SIF 文件并缓存。现有的 `.sif` 文件直接使用。

**临时目录：** 按以下顺序解析：`TERMINAL_SCRATCH_DIR` → `TERMINAL_SANDBOX_DIR/singularity` → `/scratch/$USER/hermes-agent`（HPC 惯例） → `~/.hermes/sandboxes/singularity`。

**隔离：** 使用 `--containall --no-home` 进行完整的命名空间隔离，不挂载宿主主目录。

### 常见终端后端问题

如果终端命令立即失败或终端工具被报告为禁用：

- **Local** — 无特殊要求。入门时最安全的默认选项。
- **Docker** — 运行 `docker version` 验证 Docker 是否正常工作。如果失败，修复 Docker 或执行 `hermes config set terminal.backend local`。
- **SSH** — `TERMINAL_SSH_HOST` 和 `TERMINAL_SSH_USER` 都必须设置。如果缺少任何一个，Hermes 会记录明确的错误。
- **Modal** — 需要 `MODAL_TOKEN_ID` 环境变量或 `~/.modal.toml`。运行 `hermes doctor` 检查。
- **Daytona** — 需要 `DAYTONA_API_KEY`。Daytona SDK 处理服务器 URL 配置。
- **Singularity** — 需要 `$PATH` 中有 `apptainer` 或 `singularity`。在 HPC 集群中常见。

如有疑问，将 `terminal.backend` 设置回 `local` 并首先验证命令是否能在那里运行。

### 远程到宿主的文件同步（清理时）

对于 **SSH**、**Modal** 和 **Daytona** 后端（任何智能体的工作树位于运行 Hermes 的宿主机之外的情况），Hermes 跟踪智能体在远程沙箱内修改的文件，并在会话清理/沙箱清理时，**将修改过的文件同步回宿主机** `~/.hermes/cache/remote-syncs/<session-id>/` 目录下。

- 触发条件：会话关闭、`/new`、`/reset`、网关消息超时、`delegate_task` 子智能体使用远程后端时完成。
- 覆盖智能体修改的整个目录树，不仅仅是它显式打开的文件。添加、编辑和删除都会被捕获。
- 当你去查找时，远程沙箱可能已经被销毁；本地的 `~/.hermes/cache/remote-syncs/…` 副本是智能体更改内容的权威记录。
- 大型二进制输出（模型检查点、原始数据集）受大小限制——同步会跳过超过 `file_sync_max_mb`（默认 `100`）的文件。如果期望返回更大的制品，请增大此值。

```yaml
terminal:
  file_sync_max_mb: 100     # 默认——同步每个文件最大 100 MB
  file_sync_enabled: true   # 默认——设置为 false 完全跳过同步
```

这就是你从临时云沙箱（会话结束后被销毁）中恢复结果的方式，无需显式告知智能体 `scp` 或 `modal volume put` 每个制品。

### Docker 卷挂载

使用 Docker 后端时，`docker_volumes` 允许你将宿主目录共享给容器。每个条目使用标准的 Docker `-v` 语法：`host_path:container_path[:options]`。

```yaml
terminal:
  backend: docker
  docker_volumes:
    - "/home/user/projects:/workspace/projects"   # 读写（默认）
    - "/home/user/datasets:/data:ro"              # 只读
    - "/home/user/.hermes/cache/documents:/output" # 网关可见的导出
```

这适用于：
- 向智能体**提供文件**（数据集、配置、参考代码）
- 从智能体**接收文件**（生成的代码、报告、导出）
- **共享工作区**，你和智能体都可以访问相同的文件

如果你使用消息网关并希望智能体通过 `MEDIA:/...` 发送生成的文件，建议使用专用的宿主可见导出挂载，例如 `/home/user/.hermes/cache/documents:/output`。

- 在 Docker 内将文件写入 `/output/...`
- 在 `MEDIA:` 中发出**宿主路径**，例如：
  `MEDIA:/home/user/.hermes/cache/documents/report.txt`
- **不要**发出 `/workspace/...` 或 `/output/...`，除非该确切路径对宿主上的网关进程也存在

:::warning
YAML 重复键会静默覆盖先前的值。如果你已经有一个 `docker_volumes:` 块，请将新的挂载合并到同一个列表中，而不是在文件后面添加另一个 `docker_volumes:` 键。
:::

也可以通过环境变量设置：`TERMINAL_DOCKER_VOLUMES='["/host:/container"]'`（JSON 数组）。

### Docker 凭据转发

默认情况下，Docker 终端会话不会继承任意宿主凭据。如果你需要在容器中使用特定令牌，请将其添加到 `terminal.docker_forward_env`。

```yaml
terminal:
  backend: docker
  docker_forward_env:
    - "GITHUB_TOKEN"
    - "NPM_TOKEN"
```

Hermes 首先从当前 shell 解析每个列出的变量，然后回退到 `~/.hermes/.env`（如果曾通过 `hermes config set` 保存）。

:::warning
`docker_forward_env` 中列出的任何内容都会对容器内运行的命令可见。只转发你愿意暴露给终端会话的凭据。
:::

### 以宿主用户身份运行容器

默认情况下，Docker 容器以 `root`（UID 0）身份运行。在 `/workspace` 或其他绑定挂载中创建的文件最终由宿主上的 root 拥有，因此会话结束后你需要 `sudo chown` 才能从宿主编辑器编辑它们。`terminal.docker_run_as_host_user` 标志解决了这个问题：

```yaml
terminal:
  backend: docker
  docker_run_as_host_user: true   # 默认：false
```

启用后，Hermes 将 `--user $(id -u):$(id -g)` 附加到 `docker run` 命令，以便写入绑定挂载目录（`/workspace`、`/root`、`docker_volumes` 中的任何路径）的文件由你的宿主用户拥有，而非 root。权衡是：容器不再能 `apt install` 或写入 root 拥有的路径如 `/root/.npm`——如果两者都需要，请使用 `HOME` 由非 root 用户拥有的基础镜像（或在镜像构建时添加所需工具）。

将此项保持为 `false`（默认）以获得向后兼容的行为。当你的工作流主要是"编辑挂载的宿主文件"并且你厌倦了 `sudo chown -R` 时，将其开启。

### 可选：将启动目录挂载到 `/workspace`

Docker 沙箱默认保持隔离。除非你明确选择加入，否则 Hermes **不会**将当前宿主工作目录传递到容器中。

在 `config.yaml` 中启用：

```yaml
terminal:
  backend: docker
  docker_mount_cwd_to_workspace: true
```

启用后：
- 如果你从 `~/projects/my-app` 启动 Hermes，该宿主目录将被绑定挂载到 `/workspace`
- Docker 后端从 `/workspace` 启动
- 文件工具和终端命令都看到相同的挂载项目

禁用时，除非你通过 `docker_volumes` 显式挂载内容，否则 `/workspace` 保持沙箱自有。

安全权衡：
- `false` 保持沙箱边界
- `true` 给予沙箱对你启动 Hermes 的目录的直接访问权限

仅在你有意让容器操作实时宿主文件时使用此选项。

### 持久化 Shell

默认情况下，每个终端命令在自己的子进程中运行——工作目录、环境变量和 shell 变量在命令之间重置。当**持久化 shell** 启用时，单个长期运行的 bash 进程在 `execute()` 调用之间保持存活，使状态在命令之间保持。

这对于 **SSH 后端**最有用，它还消除了每个命令的连接开销。持久化 shell **对 SSH 默认启用**，对本地后端禁用。

```yaml
terminal:
  persistent_shell: true   # 默认——为 SSH 启用持久化 shell
```

要禁用：

```bash
hermes config set terminal.persistent_shell false
```

**在命令之间保持的内容：**
- 工作目录（`cd /tmp` 对下一个命令保持）
- 导出的环境变量（`export FOO=bar`）
- Shell 变量（`MY_VAR=hello`）

**优先级：**

| 级别 | 变量 | 默认值 |
|-------|----------|---------|
| 配置 | `terminal.persistent_shell` | `true` |
| SSH 覆盖 | `TERMINAL_SSH_PERSISTENT` | 遵循配置 |
| 本地覆盖 | `TERMINAL_LOCAL_PERSISTENT` | `false` |

每个后端的环境变量优先级最高。如果你也想在本地后端上使用持久化 shell：

```bash
export TERMINAL_LOCAL_PERSISTENT=true
```

:::note
需要 `stdin_data` 或 sudo 的命令会自动回退到一次性模式，因为持久化 shell 的 stdin 已被 IPC 协议占用。
:::

有关每个后端的详情，请参阅[代码执行](features/code-execution.md)和 [README 的终端部分](features/tools.md)。

## 技能设置

技能可以通过其 SKILL.md 的 frontmatter 来声明自己的配置设置。这些是非敏感值（路径、偏好、域名设置），存储在 `config.yaml` 的 `skills.config` 命名空间下。

```yaml
skills:
  config:
    myplugin:
      path: ~/myplugin-data   # 示例——每个技能定义自己的键
```

**技能设置的工作原理：**

- `hermes config migrate` 扫描所有已启用的技能，找到未配置的设置，并提供提示引导您进行配置
- `hermes config show` 在 "技能设置" 下显示所有技能设置及其所属的技能
- 当技能加载时，其解析后的配置值会自动注入到技能上下文中

**手动设置配置值：**

```bash
hermes config set skills.config.myplugin.path ~/myplugin-data
```

有关如何在您自己的技能中声明配置设置的详细信息，请参阅 [创建技能 — 配置设置](/developer-guide/creating-skills#config-settings-configyaml)。

### 防护智能体创建的技能写入

当智能体使用 `skill_manage` 创建、编辑、补丁或删除技能时，Hermes 可以选择扫描新的/更新的内容是否存在危险的关键词模式（凭据收集、明显的提示注入、泄露指令）。扫描器**默认关闭**——实际智能体工作流中合法地提及 `~/.ssh/` 或 `$OPENAI_API_KEY` 的情况太频繁地误触发了启发式规则。如果您希望在智能体的技能写入生效前由扫描器提示您确认，请将其重新开启：

```yaml
skills:
  guard_agent_created: true   # 默认：false
```

开启后，任何被标记的 `skill_manage` 写入操作都会作为带有扫描器理由的审批提示浮现。被接受的写入会生效；被拒绝的写入会向智能体返回解释性错误。

## 内存配置

```yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # ~800 个 token
  user_char_limit: 1375     # ~500 个 token
```

## 文件读取安全性

控制单次 `read_file` 调用可返回的最大内容量。超过限制的读取将被拒绝，并会提示智能体使用 `offset` 和 `limit` 参数来获取更小范围的内容。这可以防止单次读取一个已压缩的 JS 文件或大型数据文件时，内容过多地填充上下文窗口。

```yaml
file_read_max_chars: 100000  # 默认值 —— 约 25-35K 个 token
```

如果你使用的模型上下文窗口较大且经常读取大文件，可以调高此值。对于小上下文模型，调低此值可以保持读取效率：

```yaml
# 大上下文模型 (200K+)
file_read_max_chars: 200000

# 小型本地模型 (16K 上下文)
file_read_max_chars: 30000
```

智能体也会自动对文件读取进行去重 —— 如果同一个文件区域被读取了两次，且文件内容未更改，则会返回一个轻量级的存根，而不是重新发送全部内容。这会在上下文压缩后重置，以便智能体在内容被摘要后可以重新读取文件。

## 工具输出截断限制

三个相关的上限控制了 Hermes 在截断工具输出前允许返回的原始内容量：

```yaml
tool_output:
  max_bytes: 50000        # 终端输出上限 (字符数)
  max_lines: 2000         # 读取文件分页上限
  max_line_length: 2000   # 读取文件行视图中，每行的字符上限
```

- **`max_bytes`** — 当一个 `terminal` 命令产生的标准输出/错误总字符数超过此限制时，Hermes 会保留前 40% 和后 60% 的内容，并在它们之间插入一个 `[OUTPUT TRUNCATED]` 通知。默认值为 `50000`（约占典型分词器的 12-15K 个 token）。
- **`max_lines`** — 单次 `read_file` 调用中 `limit` 参数的上限。超过此限制的请求会被自动调整，以防单次读取过多内容。默认值为 `2000`。
- **`max_line_length`** — 当 `read_file` 输出带行号的视图时，每行的最大字符数。超过此限制的行将被截断，并在末尾附加 `... [truncated]`。默认值为 `2000`。

对于上下文窗口大、能够承受更多单次原始输出的模型，可以调高这些限制。对于小上下文模型，调低它们可以使工具结果更紧凑：

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

要在所有平台（CLI 和各个网关平台）中统一禁用特定的工具集，请将它们的名称列在 `agent.disabled_toolsets` 下：

```yaml
agent:
  disabled_toolsets:
    - memory       # 隐藏记忆工具及 MEMORY_GUIDANCE 注入
    - web          # 在所有地方禁用 web_search / web_extract
```

此设置**优先于**每个平台的工具配置（由 `hermes tools` 生成的 `platform_toolsets`），因此即使某个平台的保存配置中仍然列出了该工具集，此处列出的工具集也会被移除。当你想要一个“在所有地方关闭 X 功能”的总开关，而不是去编辑 `hermes tools` UI 中 15 个以上的平台配置行时，请使用此选项。

将此列表留空或省略该键，表示不执行任何操作。

## Git 工作区隔离

为在同一代码仓库上并行运行多个智能体启用隔离的 git 工作区：

```yaml
worktree: true    # 始终创建工作区（等同于 hermes -w）
# worktree: false # 默认值 —— 仅在传递了 -w 标志时才创建
```

启用后，每个 CLI 会话都会在 `.worktrees/` 目录下创建一个全新的工作区，并拥有自己的分支。智能体可以在其中编辑文件、提交、推送和创建 PR，而不会相互干扰。干净的工作区在退出时会被移除；而存在未提交更改的工作区则会保留，以便手动恢复。

你也可以通过项目根目录下的 `.worktreeinclude` 文件列出需要复制到工作区中的、已被 git 忽略的文件：

```
# .worktreeinclude
.env
.venv/
node_modules/
```

## 上下文压缩

Hermes 会自动压缩冗长的对话，以确保其内容不超过你模型的上下文窗口限制。压缩摘要的生成是一个独立的 LLM 调用 —— 你可以将其指向任何供应商或端点。

所有压缩设置均位于 `config.yaml` 文件中（不使用环境变量）。

### 完整参考

```yaml
compression:
  enabled: true                                     # 开启或关闭压缩
  threshold: 0.50                                   # 当上下文使用率达到此百分比时进行压缩
  target_ratio: 0.20                                # 保留为最近尾部内容的比例（基于阈值）
  protect_last_n: 20                                # 保留不被压缩的最近消息最小数量
  hygiene_hard_message_limit: 400                   # 网关安全阀 —— 见下文

# 摘要模型/供应商的配置位于 auxiliary 下：
auxiliary:
  compression:
    model: ""                                       # 留空 = 使用主聊天模型。如需更便宜/更快的压缩，可覆盖此项，例如 "google/gemini-3-flash-preview"。
    provider: "auto"                                # 供应商："auto", "openrouter", "nous", "codex", "main" 等。
    base_url: null                                  # 自定义的 OpenAI 兼容端点（将覆盖 provider 设置）
```

:::info 旧版配置迁移
包含 `compression.summary_model`、`compression.summary_provider` 和 `compression.summary_base_url` 的旧版配置，在首次加载时会自动迁移至 `auxiliary.compression.*`（配置版本 17）。无需手动操作。
:::

`hygiene_hard_message_limit` 是一个仅在网关中生效的**预压缩安全阀**。拥有数千条消息的失控会话可能会在正常的基于上下文百分比的阈值触发前就达到模型的上下文限制；当消息数量超过此上限时，Hermes 会强制进行压缩，无论 token 使用量如何。默认值为 `400` —— 对于长时间会话很常见的平台，可以调高此值；若要强制进行更激进的压缩，则可调低此值。在运行中的网关上编辑此值会在下一条消息时生效（见下文）。

:::tip 网关对压缩和上下文长度的热重载
在近期版本中，在运行中的网关上编辑 `config.yaml` 中的 `model.context_length` 或任何 `compression.*` 键，会在下一条消息时生效 —— 无需重启网关，无需 `/reset`，也无需轮换会话。缓存的智能体签名包含了这些键，因此网关在检测到变化时会透明地重建智能体。API 密钥和工具/技能配置仍然需要通过常规的重载路径。
:::

### 常见配置

**默认（自动检测）—— 无需配置：**
```yaml
compression:
  enabled: true
  threshold: 0.50
```
使用你的主供应商和主模型。如果你想在比主聊天模型更便宜的模型上进行压缩，可以按任务覆盖（例如，设置 `auxiliary.compression.provider: openrouter` + `model: google/gemini-2.5-flash`）。

**强制使用特定供应商**（基于 OAuth 或 API 密钥）：
```yaml
auxiliary:
  compression:
    provider: nous
    model: gemini-3-flash
```
适用于任何供应商：`nous`, `openrouter`, `codex`, `anthropic`, `main` 等。

**自定义端点**（自托管、Ollama、zai、DeepSeek 等）：
```yaml
auxiliary:
  compression:
    model: glm-4.7
    base_url: https://api.z.ai/api/coding/paas/v4
```
指向一个自定义的 OpenAI 兼容端点。使用 `OPENAI_API_KEY` 进行认证。

### 三个调节项的相互作用

| `auxiliary.compression.provider` | `auxiliary.compression.base_url` | 结果 |
|---------------------|---------------------|--------|
| `auto`（默认） | 未设置 | 自动检测可用的最佳供应商 |
| `nous` / `openrouter` 等 | 未设置 | 强制使用该供应商及其认证 |
| 任意值 | 已设置 | 直接使用自定义端点（忽略 provider 设置） |

:::warning 摘要模型上下文长度要求
摘要模型的上下文窗口**必须**至少与你主智能体模型的上下文窗口一样大。压缩器会将对话的中间部分完整地发送给摘要模型 —— 如果该模型的上下文窗口小于主模型的，摘要调用将因上下文长度错误而失败。发生这种情况时，中间的对话轮次将被**静默丢弃而无摘要**，从而丢失对话上下文。如果你覆盖了模型，请务必确认其上下文长度满足或超过你主模型的上下文长度。
:::

## 上下文引擎

上下文引擎控制在接近模型的 token 限制时如何管理对话。内置的 `compressor` 引擎使用有损摘要（参见 [上下文压缩](/developer-guide/context-compression-and-caching)）。插件引擎可以用替代策略来替换它。

```yaml
context:
  engine: "compressor"    # 默认 —— 内置的有损摘要引擎
```

要使用插件引擎（例如，用于无损上下文管理的 LCM）：

```yaml
context:
  engine: "lcm"          # 必须与插件的名称匹配
```

插件引擎**永远不会被自动激活** —— 你必须显式地将 `context.engine` 设置为插件的名称。可以通过 `hermes plugins` → Provider Plugins → Context Engine 来浏览和选择可用的引擎。

有关记忆插件的类似单选系统，请参阅 [记忆供应商](/user-guide/features/memory-providers)。

## 迭代预算压力

当智能体在执行需要多次工具调用的复杂任务时，可能会在未察觉预算耗尽的情况下用完其迭代预算（默认：90轮）。预算压力会在接近限制时自动警告模型：

| 阈值 | 等级 | 模型看到的信息 |
|------|------|---------------|
| **70%** | 注意 | `[BUDGET: 63/90. 27 iterations left. Start consolidating.]` |
| **90%** | 警告 | `[BUDGET WARNING: 81/90. Only 9 left. Respond NOW.]` |

警告是注入到最后一个工具结果的 JSON 中（作为 `_budget_warning` 字段），而非作为单独的消息——这保留了提示缓存，且不会中断对话结构。

```yaml
agent:
  max_turns: 90                # 每次对话轮次的最大迭代次数（默认：90）
  api_max_retries: 3           # 备用提供商介入前，每个提供商的重试次数（默认：3）
```

预算压力默认启用。智能体作为工具结果的一部分自然看到警告，鼓励其整合工作并在耗尽迭代次数前给出响应。

当迭代预算完全耗尽时，CLI 会向用户显示通知：`⚠ Iteration budget reached (90/90) — response may be incomplete`。如果在活动工作期间预算用完，智能体会在停止前生成一份已完成工作的总结。

`agent.api_max_retries` 控制了在备用提供商切换介入**之前**，Hermes 在瞬时错误（速率限制、连接中断、5xx）下重试某个提供商 API 调用的次数。默认为 `3` —— 总共四次尝试。如果您配置了[备用提供商](/user-guide/features/fallback-providers)并希望更快地进行故障切换，可将此值设为 `0`，这样主提供商上第一次出现瞬时错误就会立即移交给备用提供商，而不是在不稳定的端点上反复重试。

### API 超时

Hermes 为流式调用设置了单独的超时层级，并为非流式调用设置了过时检测器。仅当您保留其隐式默认值时，过时检测器才会为本地提供商自动调整。

| 超时类型 | 默认值 | 本地提供商 | 配置 / 环境变量 |
|---------|--------|-----------|----------------|
| 套接字读取超时 | 120秒 | 自动提高至1800秒 | `HERMES_STREAM_READ_TIMEOUT` |
| 流式连接过时检测 | 180秒 | 自动禁用 | `HERMES_STREAM_STALE_TIMEOUT` |
| 非流式调用过时检测 | 300秒 | 保持隐式时自动禁用 | `providers.<id>.stale_timeout_seconds` 或 `HERMES_API_CALL_STALE_TIMEOUT` |
| API调用（非流式） | 1800秒 | 不变 | `providers.<id>.request_timeout_seconds` / `timeout_seconds` 或 `HERMES_API_TIMEOUT` |

**套接字读取超时**控制了 httpx 等待从提供商接收下一个数据块的时间。本地 LLM 在大上下文的预填充阶段可能需要数分钟才会产生第一个 token，因此当 Hermes 检测到本地端点时，会将此时间提高到 30 分钟。如果您显式设置了 `HERMES_STREAM_READ_TIMEOUT`，则无论端点检测结果如何，都会始终使用该值。

**流式连接过时检测**会终止那些只收到 SSE 保持活动 ping 但无实际内容的连接。对于本地提供商，此项完全禁用，因为它们在预填充期间不会发送保持活动 ping。

**非流式调用过时检测**会终止长时间无响应的非流式调用。默认情况下，Hermes 在本地端点上禁用此功能，以避免长时间预填充期间的误报。如果您显式设置了 `providers.<id>.stale_timeout_seconds`、`providers.<id>.models.<model>.stale_timeout_seconds` 或 `HERMES_API_CALL_STALE_TIMEOUT`，则即使在本地端点上也会采用该显式值。

## 上下文压力警告

与迭代预算压力不同，上下文压力跟踪对话距离**压缩阈值**的接近程度——这是触发上下文压缩以总结较旧消息的时间点。这有助于您和智能体了解对话何时变长。

| 进度 | 级别 | 发生情况 |
|------|------|----------|
| **≥ 60%** 达到阈值 | 信息 | CLI 显示青色进度条；网关发送信息性通知 |
| **≥ 85%** 达到阈值 | 警告 | CLI 显示粗体黄色条；网关警告压缩即将发生 |

在 CLI 中，上下文压力在工具输出反馈中显示为进度条：

```
  ◐ context ████████████░░░░░░░░ 62% to compaction  48k threshold (50%) · approaching compaction
```

在消息平台上，会发送纯文本通知：

```
◐ Context: ████████████░░░░░░░░ 62% to compaction (threshold: 50% of window).
```

如果禁用了自动压缩，警告会告知您上下文可能会被截断。

上下文压力是自动的——无需配置。它纯粹作为面向用户的通知触发，不会修改消息流或向模型上下文中注入任何内容。

## 凭证池策略

当您为同一提供商拥有多个 API 密钥或 OAuth 令牌时，请配置轮换策略：

```yaml
credential_pool_strategies:
  openrouter: round_robin    # 循环均匀使用密钥
  anthropic: least_used      # 始终选择使用最少的密钥
```

选项：`fill_first`（默认）、`round_robin`、`least_used`、`random`。完整文档请参阅[凭证池](/user-guide/features/credential-pools)。

## 提示缓存

Hermes 在活动提供商支持时会自动启用跨会话提示缓存——无需用户配置。

对于**原生 Anthropic**、**OpenRouter** 和 **Nous Portal** 上的 Claude，Hermes 会在系统提示和技能块上附加带有 1 小时 TTL（`ttl: "1h"`）的 `cache_control` 断点。在新小时内的首次发送需支付全额输入费率；同一小时内任何后续会话的发送将以折扣的缓存读取速率从缓存中获取。这意味着系统提示、加载的技能内容以及任何长上下文包含的早期部分，会在 `hermes` 会话和分叉的子智能体之间在第一个小时内被重用。

Qwen Cloud（阿里云 DashScope）上游将缓存 TTL 上限设为 5 分钟，因此 Hermes 在那里改用 5 分钟断点 TTL。其他通过第三方的 Claude 路径（AWS Bedrock、Azure Foundry）会回退到提供商自身的缓存默认值。xAI Grok 使用单独的会话固定对话 ID 机制——请参阅 [xAI 提示缓存](/integrations/providers#xai-grok--responses-api--prompt-caching)。

没有禁用缓存的开关——缓存始终开启，即使在单轮对话中也能节省成本，因为仅系统提示本身就占据了输入令牌数量的相当一部分。

## 辅助模型

Hermes 将“辅助”模型用于图像分析、网页摘要、浏览器屏幕截图分析、会话标题生成和上下文压缩等辅助任务。默认情况下（`auxiliary.*.provider: "auto"`），Hermes 会将每个辅助任务路由到您的**主聊天模型**——即您在 `hermes model` 中选择的相同提供商/模型。您无需配置任何内容即可开始使用，但请注意，在昂贵的推理模型（Opus、MiniMax M2.7 等）上，辅助任务会增加可观的成本。如果您希望无论主模型如何，辅助任务都能快速且廉价地运行，请明确设置 `auxiliary.<task>.provider` 和 `auxiliary.<task>.model`（例如，在 OpenRouter 上使用 Gemini Flash 进行视觉和网页提取）。

:::note 为什么 "auto" 使用您的主模型
早期版本会将聚合器用户（OpenRouter、Nous Portal）分流到廉价的提供商端默认设置。这令人意外——付费订阅聚合器的用户会看到不同的模型处理他们的辅助流量。`auto` 现在对所有人使用主模型，并且 `config.yaml` 中的每个任务覆盖设置仍然有效（请参阅下方的[完整辅助配置参考](#full-auxiliary-config-reference)）。
:::

### 交互式配置辅助模型

无需手动编辑 YAML，只需运行 `hermes model` 并从菜单中选择**“配置辅助模型”**。您将获得一个交互式的每个任务选择器：

```
$ hermes model
→ Configure auxiliary models

[ ] vision               currently: auto / main model
[ ] web_extract          currently: auto / main model
[ ] title_generation     currently: openrouter / google/gemini-3-flash-preview
[ ] compression          currently: auto / main model
[ ] approval             currently: auto / main model
[ ] triage_specifier     currently: auto / main model
[ ] kanban_decomposer    currently: auto / main model
[ ] profile_describer    currently: auto / main model
```

选择一个任务，选择一个提供商（OAuth 流程会打开浏览器；API 密钥提供商则会提示），选择一个模型。更改将保存到 `config.yaml` 中的 `auxiliary.<task>.*`。与主模型选择器机制相同——无需学习额外的语法。

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

| 键 | 功能 | 默认值 |
|----|------|--------|
| `provider` | 用于身份验证和路由的提供商 | `"auto"` |
| `model` | 请求使用的模型 | 提供商的默认值 |
| `base_url` | 自定义 OpenAI 兼容端点（覆盖提供商） | 未设置 |

当设置了 `base_url` 时，Hermes 会忽略提供商并直接调用该端点（使用 `api_key` 或 `OPENAI_API_KEY` 进行身份验证）。当仅设置了 `provider` 时，Hermes 使用该提供商的内置身份验证和基础 URL。

可用于辅助任务的提供商：`auto`、`main`，加上[提供商注册表](/reference/environment-variables)中的任何提供商——`openrouter`、`nous`、`openai-codex`、`copilot`、`copilot-acp`、`anthropic`、`gemini`、`google-gemini-cli`、`qwen-oauth`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`minimax-oauth`、`deepseek`、`nvidia`、`xai`、`xai-oauth`、`ollama-cloud`、`alibaba`、`bedrock`、`huggingface`、`arcee`、`xiaomi`、`kilocode`、`opencode-zen`、`opencode-go`、`ai-gateway`、`azure-foundry`——或者您 `custom_providers` 列表中任何命名的自定义提供商（例如 `provider: "beans"`）。

:::tip MiniMax OAuth
`minimax-oauth` 通过浏览器 OAuth 登录（无需 API 密钥）。运行 `hermes model` 并选择 **MiniMax (OAuth)** 进行身份验证。辅助任务会自动使用 `MiniMax-M2.7-highspeed`。详情请参阅 [MiniMax OAuth 指南](../guides/minimax-oauth.md)。
:::

:::tip xAI Grok OAuth
`xai-oauth` 通过浏览器 OAuth 登录，适用于 SuperGrok 和 X Premium+ 订阅者（无需 API 密钥）。运行 `hermes model` 并选择 **xAI Grok OAuth (SuperGrok / Premium+)** 进行身份验证。相同的 OAuth 令牌可用于所有直接访问 xAI 的界面（聊天、辅助任务、TTS、图像生成、视频生成、转录）。详情请参阅 [xAI Grok OAuth 指南](../guides/xai-grok-oauth.md)，如果 Hermes 位于远程主机上，请参阅 [通过 SSH/远程主机进行 OAuth](../guides/oauth-over-ssh.md)。
:::

:::warning `"main"` 仅用于辅助任务
`"main"` 提供商选项意味着“使用我的主智能体使用的任何提供商”——它仅在 `auxiliary:`、`compression:` 和 `fallback_model:` 配置中有效。它**不是**您顶层 `model.provider` 设置的有效值。如果您使用自定义 OpenAI 兼容端点，请在您的 `model:` 部分设置 `provider: custom`。有关所有主模型提供商选项，请参阅 [AI 提供商](/integrations/providers)。
:::

### 完整辅助配置参考

```yaml
auxiliary:
  # 图像分析（vision_analyze 工具 + 浏览器屏幕截图）
  vision:
    provider: "auto"           # "auto", "openrouter", "nous", "codex", "main" 等
    model: ""                  # 例如 "openai/gpt-4o", "google/gemini-2.5-flash"
    base_url: ""               # 自定义 OpenAI 兼容端点（覆盖提供商）
    api_key: ""                # 用于 base_url 的 API 密钥（回退到 OPENAI_API_KEY）
    timeout: 120               # 秒 — LLM API 调用超时；视觉负载需要较宽裕的超时时间
    download_timeout: 30       # 秒 — 图像 HTTP 下载；对于慢速连接可增加

  # 网页摘要 + 浏览器页面文本提取
  web_extract:
    provider: "auto"
    model: ""                  # 例如 "google/gemini-2.5-flash"
    base_url: ""
    api_key: ""
    timeout: 360               # 秒（6分钟）— 每次尝试的 LLM 摘要

  # 危险命令批准分类器
  approval:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30                # 秒

  # 上下文压缩超时（与 compression.* 配置分开）
  compression:
    timeout: 120               # 秒 — 压缩总结长对话，需要更多时间

  # 技能中心 — 技能匹配和搜索
  skills_hub:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

  # MCP 工具调度
  mcp:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

  # 看板分诊指定器 — `hermes kanban specify <id>`（或仪表板
  # 看板上 Triage 列卡上的✨指定按钮）使用此槽位
  # 将单行描述展开为具体规格，并将任务提升至
  # `todo`。廉价快速的模型在这里效果很好；规格展开
  # 内容短，不需要推理深度。
  triage_specifier:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 120
```

:::tip
每个辅助任务都有一个可配置的 `timeout`（以秒为单位）。默认值：vision 120 秒，web_extract 360 秒，approval 30 秒，compression 120 秒。如果您对辅助任务使用慢速本地模型，请增加这些值。视觉任务还有一个单独的 `download_timeout`（默认 30 秒），用于 HTTP 图像下载——对于慢速连接或自托管图像服务器，请增加此值。
:::

:::info
上下文压缩有其自身的 `compression:` 块用于阈值，以及一个 `auxiliary.compression:` 块用于模型/提供商设置——请参阅上方的[上下文压缩](#context-compression)。回退模型使用 `fallback_model:` 块——请参阅[回退模型](/integrations/providers#fallback-model)。这三者都遵循相同的 provider/model/base_url 模式。
:::

### OpenRouter 路由与辅助任务的 Pareto Code

当辅助任务解析为 OpenRouter（无论是显式设置还是通过 `provider: "main"`，而您的主智能体在 OpenRouter 上时），主智能体的 `provider_routing` 和 `openrouter.min_coding_score` 设置**不会传播**——按设计，每个辅助任务都是独立的。要为特定辅助任务设置 OpenRouter 提供商偏好或使用 [Pareto Code 路由器](/integrations/providers#openrouter-pareto-code-router)，请通过 `extra_body` 为每个任务单独设置：

```yaml
auxiliary:
  compression:
    provider: openrouter
    model: openrouter/pareto-code         # 对此任务使用 Pareto Code 路由器
    extra_body:
      provider:                            # OpenRouter 提供商路由偏好
        order: [anthropic, google]         # 按此顺序尝试这些提供商
        sort: throughput                   # 或 "price" | "latency"
        # only: [anthropic]                # 限制到特定提供商
        # ignore: [deepinfra]              # 排除特定提供商
      plugins:                             # OpenRouter Pareto Code 路由器旋钮
        - id: pareto-router
          min_coding_score: 0.5            # 0.0–1.0；越高表示编码能力越强
```

其结构与 OpenRouter 在聊天完成请求体中接受的格式一致。Hermes 会逐字转发整个 `extra_body`，因此在 [openrouter.ai/docs](https://openrouter.ai/docs) 中记录的任何其他 OpenRouter 请求体字段都以相同方式工作。

### 更改视觉模型

要使用 GPT-4o 代替 Gemini Flash 进行图像分析：

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
| `"auto"` | 最佳可用（默认）。视觉任务会尝试 OpenRouter → Nous → Codex。 | — |
| `"openrouter"` | 强制 OpenRouter — 路由到任何模型（Gemini、GPT-4o、Claude 等） | `OPENROUTER_API_KEY` |
| `"nous"` | 强制 Nous Portal | `hermes auth` |
| `"codex"` | 强制 Codex OAuth（ChatGPT 账户）。支持视觉（gpt-5.3-codex）。 | `hermes model` → Codex |
| `"minimax-oauth"` | 强制 MiniMax OAuth（浏览器登录，无需 API 密钥）。辅助任务使用 MiniMax-M2.7-highspeed。 | `hermes model` → MiniMax (OAuth) |
| `"xai-oauth"` | 强制 xAI Grok OAuth（适用于 SuperGrok 或 X Premium+ 订阅者的浏览器登录，无需 API 密钥）。相同的 OAuth 令牌覆盖聊天、TTS、图像、视频和转录。 | `hermes model` → xAI Grok OAuth (SuperGrok / Premium+) |
| `"main"` | 使用您活动的自定义/主端点。这可能来自 `OPENAI_BASE_URL` + `OPENAI_API_KEY`，或通过 `hermes model` / `config.yaml` 保存的自定义端点。适用于 OpenAI、本地模型或任何 OpenAI 兼容 API。**仅用于辅助任务——对 `model.provider` 无效。** | 自定义端点凭据 + 基础 URL |

当您希望辅助任务绕过默认路由器时，主提供商目录中的直接 API 密钥提供商也可在此处使用。一旦配置了 `GMI_API_KEY`，`gmi` 即有效：

```yaml
auxiliary:
  compression:
    provider: "gmi"
    model: "anthropic/claude-opus-4.6"
```

对于 GMI 辅助路由，请使用 GMI 的 `/v1/models` 端点返回的精确模型 ID。

### 常见设置

**使用直接自定义端点**（对于本地/自托管 API，比 `provider: "main"` 更清晰）：
```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 优先于 `provider`，因此这是将辅助任务路由到特定端点的最明确方式。对于直接端点覆盖，Hermes 使用配置的 `api_key` 或回退到 `OPENAI_API_KEY`；它不会为该自定义端点重用 `OPENROUTER_API_KEY`。

**为视觉任务使用 OpenAI API 密钥：**
```yaml
# 在 ~/.hermes/.env 中：
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_API_KEY=sk-...

auxiliary:
  vision:
    provider: "main"
    model: "gpt-4o"       # 或 "gpt-4o-mini" 以获得更低成本
```

**为视觉任务使用 OpenRouter**（路由到任何模型）：
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
运行 `hermes model` 并选择 **MiniMax (OAuth)** 以登录并自动设置此项。对于中国区域，基础 URL 将为 `https://api.minimaxi.com/anthropic`。完整步骤请参阅 [MiniMax OAuth 指南](../guides/minimax-oauth.md)。

**使用本地/自托管模型：**
```yaml
auxiliary:
  vision:
    provider: "main"      # 使用您的活动自定义端点
    model: "my-local-model"
```

`provider: "main"` 使用 Hermes 用于正常聊天的任何提供商——无论是命名的自定义提供商（例如 `beans`）、内置提供商如 `openrouter`，还是旧版 `OPENAI_BASE_URL` 端点。

:::tip
如果您使用 Codex OAuth 作为主模型提供商，视觉任务会自动工作——无需额外配置。Codex 包含在视觉的自动检测链中。
:::

:::warning
**视觉任务需要多模态模型。** 如果您设置 `provider: "main"`，请确保您的端点支持多模态/视觉——否则图像分析将失败。
:::

### 环境变量（旧版）

辅助模型也可以通过环境变量配置。然而，`config.yaml` 是首选方法——它更易于管理，并支持包括 `base_url` 和 `api_key` 在内的所有选项。

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

压缩和回退模型设置仅在 config.yaml 中可用。

:::tip
运行 `hermes config` 可以查看您当前的辅助模型设置。只有当覆盖值与默认值不同时才会显示。
:::

```yaml
---
title: "Reasoning Effort 与 Tool-Use Enforcement 配置"
description: "控制智能体的推理强度和工具调用强制执行"
slug: reasoning-effort-tool-use-enforcement
---
```

## 推理强度

控制模型在响应前进行多少"思考"：

```yaml
agent:
  reasoning_effort: ""   # 空值 = 中等（默认）。选项：none、minimal、low、medium、high、xhigh（最大）
```

未设置时（默认），推理强度默认为"中等"——这是一个平衡的级别，适合大多数任务。设置特定值会覆盖它——更高的推理强度在复杂任务上会产生更好的结果，但代价是更多的 token 消耗和延迟。

你也可以在运行时使用 `/reasoning` 命令更改推理强度：

```
/reasoning           # 显示当前强度级别和状态
/reasoning high      # 将推理强度设置为高
/reasoning none      # 禁用推理
/reasoning show      # 在每次响应上方显示模型思考过程
/reasoning hide      # 隐藏模型思考过程
```

## 工具调用强制执行

某些模型偶尔会将预期操作描述为文本，而不是实际发起工具调用（例如"我会运行测试..."而不是实际调用终端）。工具调用强制执行会注入系统提示引导，促使模型回到实际调用工具的状态。

```yaml
agent:
  tool_use_enforcement: "auto"   # "auto" | true | false | ["model-substring", ...]
```

| 值 | 行为 |
|-------|----------|
| `"auto"`（默认） | 为匹配以下模式的模型启用：`gpt`、`codex`、`gemini`、`gemma`、`grok`。对所有其他模型禁用（Claude、DeepSeek、Qwen 等）。 |
| `true` | 始终启用，无论使用什么模型。当你注意到当前模型描述操作而非执行操作时非常有用。 |
| `false` | 始终禁用，无论使用什么模型。 |
| `["gpt", "codex", "qwen", "llama"]` | 仅当模型名称包含列表中的某个子字符串时启用（不区分大小写）。 |

### 注入内容

启用后，系统提示中可能会添加三层引导：

1. **通用工具调用强制执行**（所有匹配的模型）——指示模型立即发起工具调用而不是描述意图，持续工作直到任务完成，并且永远不要以未来操作的承诺结束一个回合。

2. **OpenAI 执行规范**（仅限 GPT 和 Codex 模型）——针对 GPT 特定失败模式的额外引导：在部分结果上放弃工作、跳过先决条件查询、产生幻觉而不是使用工具，以及未经验证就声明"完成"。

3. **Google 操作指南**（仅限 Gemini 和 Gemma 模型）——简洁性、绝对路径、并行工具调用以及先验证再编辑的模式。

这些对用户是透明的，只影响系统提示。本身已经可靠使用工具的模型（如 Claude）不需要这些引导，这就是为什么 `"auto"` 会排除它们。

### 何时启用

如果你使用的模型不在默认自动列表中，并且注意到它经常描述它*将会*做什么而不是实际去做，请设置 `tool_use_enforcement: true` 或将该模型的子字符串添加到列表中：

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
    speed: 1.0                  # 速度乘数（API 限制范围 0.25–4.0）
    base_url: "https://api.openai.com/v1"  # 覆盖 OpenAI 兼容的 TTS 端点
  minimax:
    speed: 1.0                  # 语音速度乘数
    # base_url: ""              # 可选：覆盖 OpenAI 兼容的 TTS 端点
  mistral:
    model: "voxtral-mini-tts-2603"
    voice_id: "c69964a6-ab8b-4f8a-9465-ec0925096ec8"  # Paul - 中性（默认）
  gemini:
    model: "gemini-2.5-flash-preview-tts"   # 或 gemini-2.5-pro-preview-tts
    voice: "Kore"               # 30 种预置声音：Zephyr, Puck, Kore, Enceladus 等
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

这控制着 `text_to_speech` 工具以及语音模式下的语音回复（CLI 或消息网关中的 `/voice tts`）。

**速度后备优先级：** 提供商特定速度（如 `tts.edge.speed`）→ 全局 `tts.speed` → 默认值 `1.0`。设置全局 `tts.speed` 可对所有提供商应用统一速度，或按提供商单独覆盖以进行精细控制。

## 显示设置

```yaml
display:
  tool_progress: all      # off | new | all | verbose
  tool_progress_command: false  # 在消息网关中启用 /verbose 斜杠命令
  platforms: {}           # 每平台显示覆盖（见下文）
  tool_progress_overrides: {}  # 已弃用 — 请改用 display.platforms
  interim_assistant_messages: true  # 网关：将自然的中途助手更新作为独立消息发送
  skin: default           # 内置或自定义 CLI 皮肤（参见 user-guide/features/skins）
  personality: "kawaii"  # 旧版装饰字段，仍在某些摘要中显示
  compact: false          # 紧凑输出模式（减少空白）
  resume_display: full    # full（恢复时显示之前的消息）| minimal（仅一行）
  bell_on_complete: false # 智能体完成时播放终端铃声（适合长时间任务）
  show_reasoning: false   # 在每个回复上方显示模型推理/思考（用 /reasoning show|hide 切换）
  streaming: false        # 将 token 实时流式传输到终端（实时输出）
  show_cost: false        # 在 CLI 状态栏中显示预估费用（$）
  timestamps: false       # 为 true 时，在 CLI / TUI 对话记录中为用户和助手标签加上 [HH:MM] 时间戳前缀
  tool_preview_length: 0  # 工具调用预览的最大字符数（0 = 无限制，显示完整路径/命令）
  runtime_footer:         # 网关：在最终回复中附加运行时上下文页脚
    enabled: false
    fields: ["model", "context_pct", "cwd"]
  file_mutation_verifier: true    # 当 write_file/patch 调用在本轮失败时，附加提示性页脚
  language: en            # 静态消息的 UI 语言（审批提示、部分网关回复）。en | zh | zh-hant | ja | de | es | fr | tr | uk | af | ko | it | ga | pt | ru | hu
```

### 文件变更验证器

当 `display.file_mutation_verifier` 为 `true`（默认）时，如果在本轮中 `write_file` 或 `patch` 调用失败，且该路径从未被成功的写入操作覆盖，Hermes 会在助手的最终回复中附加一行提示。这可以捕获"批量并行补丁，一半静默失败，模型却总结为成功"这类过度声称，而无需您在每次编辑后手动运行 `git status`。

示例页脚：

```
⚠️ 文件变更验证器：本轮有 3 个文件未被修改，尽管上述表述可能另有暗示。请运行 `git status` 或 `read_file` 确认。
  • concepts/automatic-organization.md — [patch] 未找到 old_string 的匹配项
  • concepts/lora.md — [patch] 未找到 old_string 的匹配项
  • concepts/rag-pipeline.md — [patch] 未找到 old_string 的匹配项
```

设置 `file_mutation_verifier: false`（或 `HERMES_FILE_MUTATION_VERIFIER=0`）可抑制此页脚。验证器仅在轮次结束时存在真正的失败时才会触发——如果模型在同轮中重试失败的补丁并成功，则不会为该文件触发。

### 静态消息的 UI 语言

`display.language` 设置翻译一小组面向用户的静态消息——CLI 审批提示、少数网关斜杠命令回复（例如重启排空通知、"审批已过期"、"目标已清除"）。它**不会**翻译智能体回复、日志行、工具输出、错误追踪信息或斜杠命令描述——这些保持英文。如果您希望智能体用其他语言回复，只需在提示词或系统消息中告诉它即可。

支持的值：`en`（默认）、`zh`（简体中文）、`ja`（日语）、`de`（德语）、`es`（西班牙语）、`fr`（法语）、`tr`（土耳其语）、`uk`（乌克兰语）。未知值会回退为英文。

您也可以通过 `HERMES_LANGUAGE` 环境变量按会话设置，该变量会覆盖配置值。

```yaml
display:
  language: zh   # CLI 审批提示将显示为中文
```

| 模式 | 显示内容 |
|------|-------------|
| `off` | 静默 — 仅显示最终回复 |
| `new` | 仅在工具切换时显示工具指示器 |
| `all` | 每次工具调用都显示简短预览（默认） |
| `verbose` | 完整参数、结果和调试日志 |

在 CLI 中，使用 `/verbose` 循环切换这些模式。要在消息平台（Telegram、Discord、Slack 等）中使用 `/verbose`，请在上方的 `display` 部分设置 `tool_progress_command: true`。该命令随后会循环切换模式并保存到配置。

### 运行时元数据页脚（仅限网关）

当 `display.runtime_footer.enabled: true` 时，Hermes 会在每个网关轮次的**最终**消息中附加一个小型运行时上下文页脚——与 CLI 状态栏显示的信息相同（模型、上下文百分比、工作目录、会话持续时间、token 数、费用）。默认关闭；如果您的团队希望每条回复都包含来源信息，可按网关选择启用。

```yaml
display:
  runtime_footer:
    enabled: true
    fields: ["model", "context_pct", "cwd"]   # 可选：model, context_pct, cwd, duration, tokens, cost
```

`/footer` 斜杠命令可在任何会话中运行时切换此设置。

附加到 Telegram/Discord/Slack 回复的示例页脚：

```
— claude-opus-4.7 · 12 次工具调用 · 2 分 14 秒 · $0.042
```

只有轮次的**最终**消息会附加页脚；中间更新保持简洁。

### 每平台进度覆盖

不同平台有不同的详细度需求。例如，Signal 无法编辑消息，因此每次进度更新都会成为一条独立消息——很嘈杂。使用 `display.platforms` 设置每平台模式：

```yaml
display:
  tool_progress: all          # 全局默认
  platforms:
    signal:
      tool_progress: 'off'    # 在 Signal 上静默进度
    telegram:
      tool_progress: verbose  # 在 Telegram 上显示详细进度
    slack:
      tool_progress: 'off'    # 在共享 Slack 工作区保持安静
```

没有覆盖的平台会回退到全局 `tool_progress` 值。有效的平台键：`telegram`、`discord`、`slack`、`signal`、`whatsapp`、`matrix`、`mattermost`、`email`、`sms`、`homeassistant`、`dingtalk`、`feishu`、`wecom`、`weixin`、`bluebubbles`、`qqbot`。旧版 `display.tool_progress_overrides` 键仍可加载以保持向后兼容，但已被弃用，首次加载时会迁移到 `display.platforms`。

`interim_assistant_messages` 仅限网关。启用后，Hermes 会将已完成的中途助手更新作为独立聊天消息发送。这与 `tool_progress` 独立，不需要网关流式传输。

## 隐私

```yaml
privacy:
  redact_pii: false  # 从LLM上下文中剥离个人身份信息（仅限网关）
```

当 `redact_pii` 设为 `true` 时，网关会在支持的平台上，在将系统提示发送给LLM之前，从中删除个人身份信息：

| 字段 | 处理方式 |
|-------|-----------|
| 电话号码（WhatsApp/Signal上的用户ID） | 哈希处理为 `user_<12字符SHA256哈希值>` |
| 用户ID | 哈希处理为 `user_<12字符SHA256哈希值>` |
| 聊天ID | 数字部分哈希处理，平台前缀保留 (`telegram:<哈希值>`) |
| 主频道ID | 数字部分哈希处理 |
| 用户名 | **不受影响**（用户自选，公开可见） |

**平台支持：** 脱敏处理适用于 WhatsApp、Signal 和 Telegram。Discord 和 Slack 被排除，因为它们的提及系统 (`<@user_id>`) 要求在LLM上下文中使用真实ID。

哈希处理是确定性的——同一用户总是映射到相同的哈希值，因此模型在群聊中仍能区分用户。路由和传递功能在内部使用原始值。

## 语音转文本 (STT)

```yaml
stt:
  provider: "local"            # "local" | "groq" | "openai" | "mistral"
  local:
    model: "base"              # tiny, base, small, medium, large-v3
  openai:
    model: "whisper-1"         # whisper-1 | gpt-4o-mini-transcribe | gpt-4o-transcribe
  # model: "whisper-1"         # 旧版兼容键，仍然有效
```

提供方行为：

- `local` 使用在您机器上运行的 `faster-whisper`。请通过 `pip install faster-whisper` 单独安装。
- `groq` 使用 Groq 的 Whisper 兼容端点，并读取 `GROQ_API_KEY`。
- `openai` 使用 OpenAI 语音 API，并读取 `VOICE_TOOLS_OPENAI_KEY`。

如果请求的提供方不可用，Hermes 会按以下顺序自动回退：`local` → `groq` → `openai`。

Groq 和 OpenAI 的模型覆盖通过环境变量配置：

```bash
STT_GROQ_MODEL=whisper-large-v3-turbo
STT_OPENAI_MODEL=whisper-1
GROQ_BASE_URL=https://api.groq.com/openai/v1
STT_OPENAI_BASE_URL=https://api.openai.com/v1
```

## 语音模式（命令行界面）

```yaml
voice:
  record_key: "ctrl+b"         # CLI 内的按键录音快捷键
  max_recording_seconds: 120    # 长时间录音的硬性停止时限
  auto_tts: false               # 当 /voice on 时，自动启用语音回复
  beep_enabled: true            # 在 CLI 语音模式下播放录音开始/结束提示音
  silence_threshold: 200        # 语音检测的 RMS 阈值
  silence_duration: 3.0         # 自动停止前的静默秒数
```

在命令行中使用 `/voice on` 以启用麦克风模式，使用 `record_key` 开始/停止录音，并使用 `/voice tts` 切换语音回复。有关端到端设置和平台特定行为，请参阅[语音模式](/user-guide/features/voice-mode)。

## 流式传输

在收到响应时立即将 token 流式传输到终端或消息平台，而不是等待完整响应。

### 命令行流式传输

```yaml
display:
  streaming: true         # 实时将 token 流式传输到终端
  show_reasoning: true    # 同时流式传输推理/思考 token（可选）
```

启用后，响应会逐个 token 出现在流式传输框内。工具调用仍会静默捕获。如果提供商不支持流式传输，系统将自动回退到正常显示模式。

### 网关流式传输（Telegram、Discord、Slack）

```yaml
streaming:
  enabled: true           # 启用渐进式消息编辑
  transport: edit         # "edit"（渐进式消息编辑）或 "off"
  edit_interval: 0.3      # 消息编辑之间的间隔秒数
  buffer_threshold: 40    # 强制刷新编辑前的字符数
  cursor: " ▉"            # 流式传输期间显示的光标
  fresh_final_after_seconds: 60   # 当预览消息存在超过此时间时，发送全新的最终消息（Telegram）；0 = 始终就地编辑
```

启用后，机器人会在第一个 token 到达时发送一条消息，然后随着更多 token 的到达逐步编辑该消息。不支持消息编辑的平台（Signal、电子邮件、Home Assistant）会在首次尝试时被自动检测——该会话的流式传输会被优雅地禁用，不会产生大量消息。

如果希望在渐进式 token 编辑之外实现独立的自然中间回合助手更新，请设置 `display.interim_assistant_messages: true`。

**溢出处理：** 如果流式传输的文本超过平台的消息长度限制（约 4096 个字符），当前消息会被最终确定，并自动开始一条新消息。

**全新最终消息（Telegram）：** Telegram 的 `editMessageText` 会保留原始消息的时间戳，因此长时间运行的流式回复即使完成后也会保持第一个 token 的时间戳。当 `fresh_final_after_seconds > 0`（默认为 `60`）时，完成的回复将作为全新消息发送（尽力删除过时的预览），以便 Telegram 显示的时间戳反映完成时间。较短的预览仍会就地最终确定。设置为 `0` 以始终就地编辑。

:::note
流式传输默认是禁用的。在 `~/.hermes/config.yaml` 中启用它来体验流式传输用户体验。
:::

## 群聊会话隔离

控制共享聊天是保持每个房间一个会话还是每个参与者一个会话：

```yaml
group_sessions_per_user: true  # true = 群组/频道中按用户隔离，false = 每个聊天一个共享会话
```

- `true` 是默认且推荐的设置。在 Discord 频道、Telegram 群组、Slack 频道以及类似的共享环境中，当平台提供用户 ID 时，每个发送者都会获得自己的会话。
- `false` 会回退到旧的共享房间行为。如果您明确希望 Hermes 将一个频道视为一个协作对话，这可能很有用，但它也意味着用户共享上下文、token 成本和中断状态。
- 私信不受影响。Hermes 仍然像往常一样通过聊天/私信 ID 来索引私信。
- 无论哪种设置，线程都与其父频道隔离；当设置为 `true` 时，每个参与者在线程内也会获得自己的会话。

有关行为细节和示例，请参阅[会话](/user-guide/sessions)和 [Discord 指南](/user-guide/messaging/discord)。

## 未授权私信行为

控制当未知用户发送私信时 Hermes 的行为：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `pair` 是默认行为。Hermes 拒绝访问，但会在私信中回复一个一次性配对码。
- `ignore` 会静默丢弃未授权的私信。
- 平台特定部分会覆盖全局默认值，因此您可以在大多数平台上保持配对启用，同时让某个平台更安静。

## 快速命令

定义自定义命令，这些命令要么运行 shell 命令而不调用 LLM，要么将一个斜杠命令别名到另一个。执行快速命令不消耗 token，并且对于消息平台（Telegram、Discord 等）进行快速服务器检查或实用脚本非常有用。

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

用法：在命令行或任何消息平台中输入 `/status`、`/disk`、`/update`、`/gpu` 或 `/restart`。`exec` 命令在主机上本地运行并直接返回输出——不调用 LLM，不消耗 token。`alias` 命令会重写为配置的斜杠命令目标。

- **30 秒超时** — 长时间运行的命令会被终止并显示错误消息
- **优先级** — 快速命令在技能命令之前被检查，因此您可以覆盖技能名称
- **自动补全** — 快速命令在调度时解析，不会显示在内置的斜杠命令自动补全表中
- **类型** — 支持的类型为 `exec` 和 `alias`；其他类型会显示错误
- **处处适用** — 命令行、Telegram、Discord、Slack、WhatsApp、Signal、电子邮件、Home Assistant

仅包含字符串的提示快捷方式不是有效的快速命令。要创建可重复使用的提示工作流，请创建一个技能或别名到现有的斜杠命令。

## 人类延迟

在消息平台中模拟类似人类的响应节奏：

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
  mode: project                # project（默认）| strict
  timeout: 300                 # 最大执行时间（秒）
  max_tool_calls: 50           # 代码执行期间的最大工具调用次数
```

**`mode`** 控制脚本的工作目录和 Python 解释器：

- **`project`**（默认）— 脚本在会话的工作目录中运行，使用当前活动虚拟环境/conda 环境的 python。项目依赖（`pandas`、`torch`、项目包）和相对路径（`.env`、`./data.csv`）会自然解析，与 `terminal()` 所见一致。
- **`strict`** — 脚本在临时暂存目录中运行，使用 `sys.executable`（Hermes 自己的 python）。最大程度的可重复性，但项目依赖和相对路径不会解析。

环境变量清洗（剥离 `*_API_KEY`、`*_TOKEN`、`*_SECRET`、`*_PASSWORD`、`*_CREDENTIAL`、`*_PASSWD`、`*_AUTH`）和工具白名单在两种模式下完全相同——切换模式不会改变安全状态。

## 网络搜索后端

`web_search`、`web_extract` 和 `web_crawl` 工具支持五种后端提供商。在 `config.yaml` 或通过 `hermes tools` 配置后端：

```yaml
web:
  backend: firecrawl    # firecrawl | searxng | parallel | tavily | exa

  # 或使用按功能细分的键来混合提供商（例如，免费搜索 + 付费提取）：
  search_backend: "searxng"
  extract_backend: "firecrawl"
```

| 后端 | 环境变量 | 搜索 | 提取 | 抓取 |
|---------|---------|--------|---------|-------|
| **Firecrawl**（默认） | `FIRECRAWL_API_KEY` | ✔ | ✔ | ✔ |
| **SearXNG** | `SEARXNG_URL` | ✔ | — | — |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ | — |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ | ✔ |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ | — |

**后端选择：** 如果未设置 `web.backend`，后端将根据可用的 API 密钥自动检测。如果只设置了 `SEARXNG_URL`，则使用 SearXNG。如果只设置了 `EXA_API_KEY`，则使用 Exa。如果只设置了 `TAVILY_API_KEY`，则使用 Tavily。如果只设置了 `PARALLEL_API_KEY`，则使用 Parallel。否则，Firecrawl 是默认后端。

**SearXNG** 是一个免费的、自托管的、尊重隐私的元搜索引擎，可查询 70 多个搜索引擎。无需 API 密钥——只需将 `SEARXNG_URL` 设置为您的实例（例如 `http://localhost:8080`）。SearXNG 仅支持搜索；`web_extract` 和 `web_crawl` 需要单独的提取提供商（设置 `web.extract_backend`）。有关 Docker 设置说明，请参阅[网络搜索设置指南](/user-guide/features/web-search)。

**自托管 Firecrawl：** 将 `FIRECRAWL_API_URL` 设置为指向您自己的实例。当设置了自定义 URL 时，API 密钥变为可选（在服务器上设置 `USE_DB_AUTHENTICATION=***` 以禁用认证）。

**Parallel 搜索模式：** 设置 `PARALLEL_SEARCH_MODE` 以控制搜索行为——`fast`、`one-shot` 或 `agentic`（默认：`agentic`）。

**Exa：** 在 `~/.hermes/.env` 中设置 `EXA_API_KEY`。支持 `category` 过滤（`company`、`research paper`、`news`、`people`、`personal site`、`pdf`）以及域名/日期过滤。

## 浏览器

配置浏览器自动化行为：

```yaml
browser:
  inactivity_timeout: 120        # 自动关闭空闲会话前的无活动时间（秒）
  command_timeout: 30             # 浏览器命令（截图、导航等）的超时时间（秒）
  record_sessions: false         # 自动将浏览器会话录制为 WebM 视频，保存到 ~/.hermes/browser_recordings/
  # 可选的 CDP 覆盖 —— 设置后，Hermes 将直接连接到您自己的 Chromium 系列浏览器（通过 /browser connect），而不是启动一个无头浏览器。
  cdp_url: ""
  # 对话监控器 —— 控制当附加 CDP 后端（Browserbase、通过 /browser connect 连接的本地 Chromium 系列浏览器）时，如何处理原生 JS 对话框（alert / confirm / prompt）。在 Camofox 和默认的本地智能体浏览器模式下会被忽略。
  dialog_policy: must_respond    # must_respond | auto_dismiss | auto_accept
  dialog_timeout_s: 300          # 在 must_respond 策略下的安全自动关闭时间（秒）
  camofox:
    managed_persistence: false   # 设为 true 时，Camofox 会话将在重启后保留 cookie/登录状态
    user_id: ""                  # 可选，由外部管理的 Camofox userId
    session_key: ""              # 可选，Hermes 创建标签页时发送的会话密钥
    adopt_existing_tab: false    # 在为此身份创建新标签页前，尝试重用现有标签页
```

**对话策略：**

- `must_respond`（默认） —— 捕获对话框，将其显示在 `browser_snapshot.pending_dialogs` 中，并等待智能体调用 `browser_dialog(action=...)`。若经过 `dialog_timeout_s` 秒后无响应，对话框将被自动关闭，以防止页面的 JS 线程永久阻塞。
- `auto_dismiss` —— 捕获并立即关闭。事后智能体仍可在 `browser_snapshot.recent_dialogs` 中看到 `closed_by="auto_policy"` 的对话记录。
- `auto_accept` —— 捕获并立即接受。适用于具有激进 `beforeunload` 提示的页面。

完整的对话工作流程请参见 [浏览器功能页面](./features/browser.md#browser_dialog)。

浏览器工具集支持多个提供商。关于 Browserbase、Browser Use 和本地 Chromium 系列 CDP 设置的详细信息，请参阅 [浏览器功能页面](/user-guide/features/browser)。

## 时区

使用 IANA 时区字符串覆盖服务器本地时区。影响日志中的时间戳、定时任务调度以及系统提示中的时间注入。

```yaml
timezone: "America/New_York"   # IANA 时区（默认："" = 服务器本地时间）
```

支持的值：任何 IANA 时区标识符（例如 `America/New_York`、`Europe/London`、`Asia/Kolkata`、`UTC`）。留空或省略则使用服务器本地时间。

## Discord

为消息网关配置Discord特定行为：

```yaml
discord:
  require_mention: true          # 在服务器频道中需要@提及才能响应
  free_response_channels: ""     # 智能体无需@提及即可响应的频道ID列表（逗号分隔）
  auto_thread: true              # 在频道中被@提及时自动创建话题
```

- `require_mention` — 当设置为`true`（默认值）时，智能体在服务器频道中只有在被@提及BotName时才会响应。私信则无需提及即可响应。
- `free_response_channels` — 频道ID的逗号分隔列表，智能体在这些频道中会响应每条消息，无需被提及。
- `auto_thread` — 当设置为`true`（默认值）时，在频道中的提及会自动为对话创建一个话题，保持频道整洁（类似于Slack的话题功能）。

## Security

预执行安全扫描与密钥脱敏：

```yaml
security:
  redact_secrets: false          # 脱敏工具输出和日志中的API密钥模式（默认关闭）
  tirith_enabled: true           # 为终端命令启用Tirith安全扫描
  tirith_path: "tirith"          # tirith二进制文件的路径（默认为：$PATH中的"tirith"）
  tirith_timeout: 5              # 等待tirith扫描的超时时间（秒）
  tirith_fail_open: true         # 如果tirith不可用则允许执行命令
  website_blocklist:             # 参见下方“网站黑名单”部分
    enabled: false
    domains: []
    shared_files: []
```

- `redact_secrets` — 当设置为`true`时，会在工具输出进入对话上下文和日志之前，自动检测并脱敏看起来像API密钥、令牌和密码的模式。**默认关闭** — 如果您经常在工具输出中处理真实凭据并希望增加一层安全保障，请显式设置为`true`以开启此功能。
- `tirith_enabled` — 当设置为`true`时，终端命令在执行前会通过[Tirith](https://github.com/sheeki03/tirith)进行扫描，以检测潜在危险操作。
- `tirith_path` — tirith二进制文件的路径。如果tirith安装在非标准位置，请设置此项。
- `tirith_timeout` — 等待tirith扫描的最大秒数。如果扫描超时，命令将继续执行。
- `tirith_fail_open` — 当设置为`true`（默认值）时，如果tirith不可用或失败，则允许命令执行。设置为`false`可在tirith无法验证时阻止命令执行。

## 网站黑名单

阻止智能体的Web和浏览器工具访问特定域名：

```yaml
security:
  website_blocklist:
    enabled: false               # 启用URL拦截（默认：false）
    domains:                     # 被拦截的域名模式列表
      - "*.internal.company.com"
      - "admin.example.com"
      - "*.local"
    shared_files:                # 从外部文件加载额外规则
      - "/etc/hermes/blocked-sites.txt"
```

启用后，任何匹配被拦截域名模式的URL都会在Web或浏览器工具执行之前被拒绝。这适用于`web_search`、`web_extract`、`browser_navigate`以及任何访问URL的工具。

域名规则支持：
- 精确域名：`admin.example.com`
- 通配符子域名：`*.internal.company.com`（拦截所有子域名）
- 顶级域名通配符：`*.local`

共享文件每行包含一个域名规则（空行和`#`开头的注释会被忽略）。缺失或无法读取的文件会记录警告，但不会禁用其他Web工具。

策略会缓存30秒，因此配置更改会快速生效，无需重启。

## 智能审批

控制Hermes如何处理潜在危险的命令：

```yaml
approvals:
  mode: manual   # manual | smart | off
```

| 模式 | 行为 |
|------|------|
| `manual`（默认） | 在执行任何被标记的命令前提示用户。在命令行界面中，显示交互式审批对话框。在消息传递中，将挂起的审批请求加入队列。 |
| `smart` | 使用辅助LLM评估被标记的命令是否真正危险。低风险命令会自动批准，并具有会话级持久性。真正有风险的命令会升级给用户处理。 |
| `off` | 跳过所有审批检查。等同于`HERMES_YOLO_MODE=true`。**请谨慎使用。** |

智能模式对于减少审批疲劳特别有用——它让智能体在安全操作上能更自主地工作，同时仍能捕捉真正具有破坏性的命令。

:::warning
设置`approvals.mode: off`会禁用终端命令的所有安全检查。请仅在受信任、沙盒化的环境中使用此设置。
:::

## 检查点

在破坏性文件操作前自动创建文件系统快照。详情请参阅[检查点与回滚](/user-guide/checkpoints-and-rollback)。

```yaml
checkpoints:
  enabled: false                 # 启用自动检查点（也可通过：hermes chat --checkpoints）。默认：false（需手动开启）。
  max_snapshots: 20              # 每个目录保留的最大检查点数量（默认：20）
```

## 委派

为delegate工具配置子智能体行为：

```yaml
delegation:
  # model: "google/gemini-3-flash-preview"  # 覆盖模型（为空则继承父智能体）
  # provider: "openrouter"                  # 覆盖提供商（为空则继承父智能体）
  # base_url: "http://localhost:1234/v1"    # 直接连接的OpenAI兼容端点（优先于provider设置）
  # api_key: "local-key"                    # 用于base_url的API密钥（回退到OPENAI_API_KEY）
  # api_mode: ""                            # base_url的线路协议："chat_completions"、"codex_responses"或"anthropic_messages"。为空则根据URL自动检测（例如/anthropic后缀 → anthropic_messages）。对于启发式无法检测的非标准端点，请显式设置。
  max_concurrent_children: 3                # 每个批次并行运行的子智能体数量（下限为1，无上限）。也可通过DELEGATION_MAX_CONCURRENT_CHILDREN环境变量设置。
  max_spawn_depth: 1                        # 委派树深度上限（1-3，超出范围会被自动修正）。1 = 平坦（默认）：父智能体生成叶子智能体，叶子智能体不能再次委派。2 = 编排者子智能体可以生成叶子孙智能体。3 = 三级深度。
  orchestrator_enabled: true                # 全局开关。当为false时，忽略role="orchestrator"，无论max_spawn_depth设置如何，每个子智能体都被强制为叶子智能体。
```

**子智能体提供商:模型覆盖：** 默认情况下，子智能体继承父智能体的提供商和模型。设置`delegation.provider`和`delegation.model`可以将子智能体路由到不同的提供商:模型组合——例如，为范围狭窄的子任务使用廉价/快速的模型，而您的主智能体运行昂贵的推理模型。

**直接端点覆盖：** 如果您希望使用明显的自定义端点路径，请设置`delegation.base_url`、`delegation.api_key`和`delegation.model`。这将直接将子智能体发送到该OpenAI兼容端点，并且优先级高于`delegation.provider`。如果省略`delegation.api_key`，Hermes将仅回退到`OPENAI_API_KEY`。

**线路协议 (`api_mode`)：** Hermes会根据`delegation.base_url`自动检测线路协议（例如，以`/anthropic`结尾的路径 → `anthropic_messages`；Codex / 原生Anthropic / Kimi-coding主机名保留其现有检测）。对于启发式无法分类的端点——例如Azure AI Foundry、MiniMax、智谱GLM或代理Anthropic风格后端的LiteLLM代理——请显式设置`delegation.api_mode`为`chat_completions`、`codex_responses`或`anthropic_messages`之一。保留为空（默认）以保持自动检测。

委派提供商使用与CLI/网关启动相同的凭据解析方式。支持所有已配置的提供商：`openrouter`、`nous`、`copilot`、`zai`、`kimi-coding`、`minimax`、`minimax-cn`。当设置了提供商时，系统会自动解析正确的基础URL、API密钥和API模式——无需手动配置凭据。

**优先级：** 配置中的`delegation.base_url` → 配置中的`delegation.provider` → 父智能体的提供商（继承）。配置中的`delegation.model` → 父智能体的模型（继承）。仅设置`model`而不设置`provider`只会更改模型名称，同时保留父智能体的凭据（适用于在同一提供商（如OpenRouter）内切换模型）。

**宽度和深度：** `max_concurrent_children`限制每个批次并行运行的子智能体数量（默认`3`，下限为1，无上限）。也可通过`DELEGATION_MAX_CONCURRENT_CHILDREN`环境变量设置。当模型提交的`tasks`数组长度超过此上限时，`delegate_task`会返回一个解释该限制的工具错误，而不是静默截断。`max_spawn_depth`控制委派树深度（限制在1-3）。默认值为`1`时，委派是平坦的：子智能体不能生成孙智能体，并且传递`role="orchestrator"`会被静默降级为`leaf`。提升到`2`以便编排者子智能体可以生成叶子孙智能体；`3`用于三级树。智能体通过`role="orchestrator"`在每次调用时选择编排；`orchestrator_enabled: false`会强制将每个子智能体都设回叶子智能体，无论其他设置如何。成本呈指数级增长——当`max_spawn_depth: 3`且`max_concurrent_children: 3`时，树可以达到3×3×3 = 27个并发叶子智能体。使用模式请参阅[子智能体委派 → 深度限制与嵌套编排](features/delegation.md#depth-limit-and-nested-orchestration)。

## 澄清

配置澄清提示行为：

```yaml
澄清:
  超时: 120                 # 等待用户澄清回复的秒数
```

## 上下文文件 (SOUL.md, AGENTS.md)

Hermes 使用两种不同的上下文范围：

| 文件 | 用途 | 范围 |
|------|------|------|
| `SOUL.md` | **主要智能体身份** — 定义智能体是什么（系统提示中的位置 #1） | `~/.hermes/SOUL.md` 或 `$HERMES_HOME/SOUL.md` |
| `.hermes.md` / `HERMES.md` | 项目特定指令（最高优先级） | 遍历至 git 根目录 |
| `AGENTS.md` | 项目特定指令、编码规范 | 递归目录遍历 |
| `CLAUDE.md` | Claude Code 上下文文件（同样被检测） | 仅限工作目录 |
| `.cursorrules` | Cursor IDE 规则（同样被检测） | 仅限工作目录 |
| `.cursor/rules/*.mdc` | Cursor 规则文件（同样被检测） | 仅限工作目录 |

- **SOUL.md** 是智能体的主要身份。它占据系统提示中的位置 #1，完全取代内置的默认身份。编辑它以完全自定义智能体是谁。
- 如果 SOUL.md 缺失、为空或无法加载，Hermes 会回退到内置的默认身份。
- **项目上下文文件使用优先级系统** — 只加载一种类型（首次匹配生效）：`.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`。SOUL.md 始终独立加载。
- **AGENTS.md** 是分层的：如果子目录也有 AGENTS.md，所有文件都会被合并。
- 如果默认的 `SOUL.md` 尚不存在，Hermes 会自动生成一个。
- 所有加载的上下文文件都限制在 20,000 个字符内，并进行智能截断。

另请参阅：
- [个性与 SOUL.md](/user-guide/features/personality)
- [上下文文件](/user-guide/features/context-files)

## 工作目录

| 上下文 | 默认值 |
|---------|---------|
| **CLI (`hermes`)** | 运行命令的当前目录 |
| **消息网关** | 主目录 `~` （可通过 `MESSAGING_CWD` 覆盖） |
| **Docker / Singularity / Modal / SSH** | 容器或远程机器内的用户主目录 |

覆盖工作目录：
```bash
# 在 ~/.hermes/.env 或 ~/.hermes/config.yaml 中：
消息网关会话工作目录=/home/myuser/projects    # 消息网关会话
终端会话工作目录=/workspace                # 所有终端会话
```