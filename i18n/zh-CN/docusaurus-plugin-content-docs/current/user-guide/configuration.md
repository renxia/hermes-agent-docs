---
sidebar_position: 2
title: "配置"
description: "配置 Hermes 智能体 — config.yaml、提供者、模型、API 密钥等"
---

# 配置

所有设置均存储在 `~/.hermes/` 目录中，便于访问。

## 目录结构

```text
~/.hermes/
├── config.yaml     # 设置（模型、终端、TTS、压缩等）
├── .env            # API 密钥和机密信息
├── auth.json       # OAuth 提供者凭据（Nous Portal 等）
├── SOUL.md         # 主智能体身份（系统提示中的槽位 #1）
├── memories/       # 持久化记忆（MEMORY.md、USER.md）
├── skills/         # 智能体创建的技能（通过 skill_manage 工具管理）
├── cron/           # 定时任务
├── sessions/       # 网关会话
└── logs/           # 日志（errors.log、gateway.log — 机密信息自动脱敏）
```

## 管理配置

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
`hermes config set` 命令会自动将值路由到正确的文件 — API 密钥保存到 `.env`，其余保存到 `config.yaml`。
:::

## 配置优先级

设置按以下顺序解析（优先级从高到低）：

1. **CLI 参数** — 例如 `hermes chat --model anthropic/claude-sonnet-4`（每次调用的覆盖）
2. **`~/.hermes/config.yaml`** — 所有非机密设置的主要配置文件
3. **`~/.hermes/.env`** — 环境变量的后备；**必需**用于机密信息（API 密钥、令牌、密码）
4. **内置默认值** — 当未设置其他值时使用的硬编码安全默认值

:::info 经验法则
机密信息（API 密钥、机器人令牌、密码）放在 `.env` 中。其他所有内容（模型、终端后端、压缩设置、内存限制、工具集）放在 `config.yaml` 中。当两者都设置时，`config.yaml` 对非机密设置具有优先权。
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

单个值中的多个引用有效：`url: "${HOST}:${PORT}"`。如果引用的变量未设置，占位符将保持原样（`${UNDEFINED_VAR}` 保持不变）。仅支持 `${VAR}` 语法 — 裸 `$VAR` 不会被展开。

有关 AI 提供者设置（OpenRouter、Anthropic、Copilot、自定义端点、自托管 LLM、后备模型等），请参阅 [AI 提供者](/docs/integrations/providers)。

### 提供者超时

您可以为提供者设置 `providers.<id>.request_timeout_seconds` 以设置全提供者请求超时，以及 `providers.<id>.models.<model>.timeout_seconds` 以设置模型特定的覆盖。适用于每次传输（OpenAI-wire、原生 Anthropic、Anthropic 兼容）上的主轮转客户端、后备链、凭据轮换后的重建，以及（对于 OpenAI-wire）每次请求的超时关键字参数 — 因此配置的值会覆盖传统的 `HERMES_API_TIMEOUT` 环境变量。

您还可以为非流式陈旧调用检测器设置 `providers.<id>.stale_timeout_seconds`，以及 `providers.<id>.models.<model>.stale_timeout_seconds` 以设置模型特定的覆盖。这会覆盖传统的 `HERMES_API_CALL_STALE_TIMEOUT` 环境变量。

留空这些设置将保持传统默认值（`HERMES_API_TIMEOUT=1800` 秒，`HERMES_API_CALL_STALE_TIMEOUT=300` 秒，原生 Anthropic 900 秒）。目前未针对 AWS Bedrock 进行连接（`bedrock_converse` 和 AnthropicBedrock SDK 路径均使用 boto3 及其自身的超时配置）。请参阅 [`cli-config.yaml.example`](https://github.com/NousResearch/hermes-agent/blob/main/cli-config.yaml.example) 中的注释示例。

## 终端后端配置

Hermes 支持六种终端后端。每个后端决定智能体的 shell 命令实际执行的位置 — 您的本地机器、Docker 容器、通过 SSH 的远程服务器、Modal 云沙箱、Daytona 工作区或 Singularity/Apptainer 容器。

```yaml
terminal:
  backend: local    # local | docker | ssh | modal | daytona | singularity
  cwd: "."          # 工作目录（"." = 本地当前目录，容器为 "/root"）
  timeout: 180      # 每次命令超时（秒）
  env_passthrough: []  # 要转发到沙箱执行的环境变量名（终端 + execute_code）
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"  # Singularity 后端的容器镜像
  modal_image: "nikolaik/python-nodejs:python3.11-nodejs20"                 # Modal 后端的容器镜像
  daytona_image: "nikolaik/python-nodejs:python3.11-nodejs20"               # Daytona 后端的容器镜像
```

对于云沙箱（如 Modal 和 Daytona），`container_persistent: true` 表示 Hermes 将尝试在沙箱重建时保留文件系统状态。它不保证相同的活动沙箱、PID 空间或后台进程稍后仍在运行。

### 后端概览

| 后端 | 命令运行位置 | 隔离性 | 最佳用途 |
|---------|-------------------|-----------|----------|
| **local** | 您的机器直接 | 无 | 开发、个人使用 |
| **docker** | Docker 容器 | 完全（命名空间、cap-drop） | 安全沙箱、CI/CD |
| **ssh** | 通过 SSH 的远程服务器 | 网络边界 | 远程开发、强大硬件 |
| **modal** | Modal 云沙箱 | 完全（云 VM） | 临时云计算、评估 |
| **daytona** | Daytona 工作区 | 完全（云容器） | 托管云开发环境 |
| **singularity** | Singularity/Apptainer 容器 | 命名空间（--containall） | HPC 集群、共享机器 |

### 本地后端

默认值。命令直接在您的机器上运行，无隔离。无需特殊设置。

```yaml
terminal:
  backend: local
```

:::warning
智能体拥有与您的用户账户相同的文件系统访问权限。使用 `hermes tools` 禁用您不想要的工具，或切换到 Docker 进行沙箱化。
:::

### Docker 后端

在具有安全加固的 Docker 容器内运行命令（所有能力被丢弃，无权限提升，PID 限制）。

```yaml
terminal:
  backend: docker
  docker_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  docker_mount_cwd_to_workspace: false  # 将启动目录挂载到 /workspace
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

**要求：** 已安装并运行 Docker Desktop 或 Docker Engine。Hermes 会探测 `$PATH` 以及常见的 macOS 安装位置（`/usr/local/bin/docker`、`/opt/homebrew/bin/docker`、Docker Desktop 应用包）。

**容器生命周期：** 每个会话启动一个长期运行的容器（`docker run -d ... sleep 2h`）。命令通过登录 shell 的 `docker exec` 运行。清理时，容器被停止并移除。

**安全加固：**
- `--cap-drop ALL`，仅添加回 `DAC_OVERRIDE`、`CHOWN`、`FOWNER`
- `--security-opt no-new-privileges`
- `--pids-limit 256`
- `/tmp`（512MB）、`/var/tmp`（256MB）、`/run`（64MB）的大小限制 tmpfs

**凭据转发：** `docker_forward_env` 中列出的环境变量首先从您的 shell 环境解析，然后从 `~/.hermes/.env` 解析。技能也可以声明 `required_environment_variables`，这些变量会自动合并。

### SSH 后端

通过 SSH 在远程服务器上运行命令。使用 ControlMaster 进行连接重用（5 分钟空闲保持活动）。默认启用持久化 shell — 状态（工作目录、环境变量）在命令之间保持。

```yaml
terminal:
  backend: ssh
  persistent_shell: true           # 保持长期运行的 bash 会话（默认：true）
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

**工作原理：** 初始化时使用 `BatchMode=yes` 和 `StrictHostKeyChecking=accept-new` 连接。持久化 shell 在远程主机上保持单个 `bash -l` 进程活动，通过临时文件进行通信。需要 `stdin_data` 或 `sudo` 的命令会自动回退到一次性模式。

### Modal 后端

在 [Modal](https://modal.com) 云沙箱中运行命令。每个任务获得一个具有可配置 CPU、内存和磁盘的隔离 VM。文件系统可以跨会话快照/恢复。

```yaml
terminal:
  backend: modal
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB（5GB）
  container_disk: 51200            # MB（50GB）
  container_persistent: true       # 快照/恢复文件系统
```

**必需：** `MODAL_TOKEN_ID` + `MODAL_TOKEN_SECRET` 环境变量，或 `~/.modal.toml` 配置文件。

**持久化：** 启用时，沙箱文件系统在清理时快照，并在下次会话时恢复。快照跟踪在 `~/.hermes/modal_snapshots.json` 中。这保留了文件系统状态，而不是活动进程、PID 空间或后台作业。

**凭据文件：** 自动从 `~/.hermes/`（OAuth 令牌等）挂载，并在每次命令前同步。

### Daytona 后端

在 [Daytona](https://daytona.io) 托管工作区中运行命令。支持停止/恢复以实现持久化。

```yaml
terminal:
  backend: daytona
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB → 转换为 GiB
  container_disk: 10240            # MB → 转换为 GiB（最大 10 GiB）
  container_persistent: true       # 停止/恢复而非删除
```

**必需：** `DAYTONA_API_KEY` 环境变量。

**持久化：** 启用时，沙箱在清理时停止（而非删除），并在下次会话时恢复。沙箱名称遵循模式 `hermes-{task_id}`。

**磁盘限制：** Daytona 强制执行 10 GiB 最大值。超过此值的请求会被限制并发出警告。

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

**要求：** `$PATH` 中的 `apptainer` 或 `singularity` 二进制文件。

**镜像处理：** Docker URL（`docker://...`）自动转换为 SIF 文件并缓存。现有的 `.sif` 文件直接使用。

**临时目录：** 按顺序解析：`TERMINAL_SCRATCH_DIR` → `TERMINAL_SANDBOX_DIR/singularity` → `/scratch/$USER/hermes-agent`（HPC 约定）→ `~/.hermes/sandboxes/singularity`。

**隔离：** 使用 `--containall --no-home` 实现完全命名空间隔离，不挂载主机 home 目录。

### 常见终端后端问题

如果终端命令立即失败或报告终端工具被禁用：

- **本地** — 无特殊要求。开始时的最安全默认值。
- **Docker** — 运行 `docker version` 验证 Docker 是否工作。如果失败，修复 Docker 或 `hermes config set terminal.backend local`。
- **SSH** — 必须设置 `TERMINAL_SSH_HOST` 和 `TERMINAL_SSH_USER`。如果任一缺失，Hermes 会记录清晰的错误。
- **Modal** — 需要 `MODAL_TOKEN_ID` 环境变量或 `~/.modal.toml`。运行 `hermes doctor` 检查。
- **Daytona** — 需要 `DAYTONA_API_KEY`。Daytona SDK 处理服务器 URL 配置。
- **Singularity** — 需要 `$PATH` 中的 `apptainer` 或 `singularity`。在 HPC 集群上常见。

如有疑问，请将 `terminal.backend` 设置回 `local`，并首先验证命令是否在那里运行。

### Docker 卷挂载

使用 Docker 后端时，`docker_volumes` 允许您与容器共享主机目录。每个条目使用标准 Docker `-v` 语法：`host_path:container_path[:options]`。

```yaml
terminal:
  backend: docker
  docker_volumes:
    - "/home/user/projects:/workspace/projects"   # 读写（默认）
    - "/home/user/datasets:/data:ro"              # 只读
    - "/home/user/.hermes/cache/documents:/output" # 网关可见的导出
```

这很有用：
- **向智能体提供文件**（数据集、配置、参考代码）
- **从智能体接收文件**（生成的代码、报告、导出）
- **共享工作区**，您和智能体都可以访问相同的文件

如果使用消息网关并希望智能体通过 `MEDIA:/...` 发送生成的文件，请优先使用专用的主机可见导出挂载，例如 `/home/user/.hermes/cache/documents:/output`。

- 在 Docker 内将文件写入 `/output/...`
- 在 `MEDIA:` 中发出**主机路径**，例如：`MEDIA:/home/user/.hermes/cache/documents/report.txt`
- **不要**发出 `/workspace/...` 或 `/output/...`，除非该确切路径在主机上对网关进程也存在

:::warning
YAML 重复键会静默覆盖较早的键。如果您已有 `docker_volumes:` 块，请将新挂载合并到同一列表中，而不是在文件后面添加另一个 `docker_volumes:` 键。
:::

也可以通过环境变量设置：`TERMINAL_DOCKER_VOLUMES='["/host:/container"]'`（JSON 数组）。

### Docker 凭据转发

默认情况下，Docker 终端会话不会继承任意主机凭据。如果您需要在容器内有特定令牌，请将其添加到 `terminal.docker_forward_env`。

```yaml
terminal:
  backend: docker
  docker_forward_env:
    - "GITHUB_TOKEN"
    - "NPM_TOKEN"
```

Hermes 首先从您当前的 shell 解析每个列出的变量，如果通过 `hermes config set` 保存，则回退到 `~/.hermes/.env`。

:::warning
`docker_forward_env` 中列出的任何内容对容器内运行的命令都可见。仅转发您愿意暴露给终端会话的凭据。
:::

### 可选：将启动目录挂载到 `/workspace`

Docker 沙箱默认保持隔离。除非您明确选择加入，否则 Hermes **不会**将您当前的主机工作目录传递到容器中。

在 `config.yaml` 中启用：

```yaml
terminal:
  backend: docker
  docker_mount_cwd_to_workspace: true
```

启用时：
- 如果您从 `~/projects/my-app` 启动 Hermes，该主机目录将绑定挂载到 `/workspace`
- Docker 后端从 `/workspace` 开始
- 文件工具和终端命令都看到相同的挂载项目

禁用时，除非您通过 `docker_volumes` 明确挂载某些内容，否则 `/workspace` 保持沙箱所有。

安全权衡：
- `false` 保留沙箱边界
- `true` 让沙箱直接访问您启动 Hermes 的目录

仅当您有意希望容器处理活动主机文件时，才使用选择加入。

### 持久化 Shell

默认情况下，每个终端命令在其自己的子进程中运行 — 工作目录、环境变量和 shell 变量在命令之间重置。启用**持久化 shell** 时，单个长期运行的 bash 进程在 `execute()` 调用之间保持活动，以便状态在命令之间保持。

这对于 **SSH 后端**最有用，它还消除了每次命令的连接开销。持久化 shell **默认对 SSH 启用**，对本地后端禁用。

```yaml
terminal:
  persistent_shell: true   # 默认 — 为 SSH 启用持久化 shell
```

要禁用：

```bash
hermes config set terminal.persistent_shell false
```

**命令之间保持的内容：**
- 工作目录（`cd /tmp` 对下一个命令保持）
- 导出的环境变量（`export FOO=bar`）
- Shell 变量（`MY_VAR=hello`）

**优先级：**

| 级别 | 变量 | 默认值 |
|-------|----------|---------|
| 配置 | `terminal.persistent_shell` | `true` |
| SSH 覆盖 | `TERMINAL_SSH_PERSISTENT` | 遵循配置 |
| 本地覆盖 | `TERMINAL_LOCAL_PERSISTENT` | `false` |

每个后端的环境变量具有最高优先级。如果您也希望在本地后端使用持久化 shell：

```bash
export TERMINAL_LOCAL_PERSISTENT=true
```

:::note
需要 `stdin_data` 或 sudo 的命令会自动回退到一次性模式，因为持久化 shell 的 stdin 已被 IPC 协议占用。
:::

有关每个后端的详细信息，请参阅 [代码执行](features/code-execution.md) 和 [README 的终端部分](features/tools.md)。

## 技能设置

技能可以通过其 SKILL.md 前言声明自己的配置设置。这些是非机密值（路径、首选项、域设置），存储在 `config.yaml` 的 `skills.config` 命名空间下。

```yaml
skills:
  config:
    myplugin:
      path: ~/myplugin-data   # 示例 — 每个技能定义其自己的键
```

**技能设置如何工作：**

- `hermes config migrate` 扫描所有启用的技能，找到未配置的设置，并提示您
- `hermes config show` 在“技能设置”下显示所有技能设置及其所属技能
- 技能加载时，其解析的配置值会自动注入技能上下文

**手动设置值：**

```bash
hermes config set skills.config.myplugin.path ~/myplugin-data
```

有关在您自己的技能中声明配置设置的详细信息，请参阅 [创建技能 — 配置设置](/docs/developer-guide/creating-skills#config-settings-configyaml)。

## 内存配置

```yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # ~800 个令牌
  user_char_limit: 1375     # ~500 个令牌
```

## 文件读取安全

控制单个 `read_file` 调用可以返回多少内容。超过限制