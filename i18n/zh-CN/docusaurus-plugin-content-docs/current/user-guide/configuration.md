---
sidebar_position: 2
title: "配置"
description: "配置 Hermes 智能体 — config.yaml、提供商、模型、API 密钥等"
---

# 配置

所有设置均存储在 `~/.hermes/` 目录中，便于访问。

## 目录结构

```text
~/.hermes/
├── config.yaml     # 设置（模型、终端、TTS、压缩等）
├── .env            # API 密钥和机密信息
├── auth.json       # OAuth 提供商凭据（Nous Portal 等）
├── SOUL.md         # 主智能体身份（系统提示中的槽位 #1）
├── memories/       # 持久化记忆（MEMORY.md、USER.md）
├── skills/         # 智能体创建的技能（通过 skill_manage 工具管理）
├── cron/           # 定时任务
├── sessions/       # 网关会话
└── logs/           # 日志（errors.log、gateway.log — 机密信息自动脱敏）
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
`hermes config set` 命令会自动将值路由到正确的文件 —— API 密钥保存到 `.env`，其他所有内容保存到 `config.yaml`。
:::

## 配置优先级

设置按以下顺序解析（优先级从高到低）：

1. **命令行参数** —— 例如 `hermes chat --model anthropic/claude-sonnet-4`（每次调用的覆盖）
2. **`~/.hermes/config.yaml`** —— 所有非机密设置的主要配置文件
3. **`~/.hermes/.env`** —— 环境变量的后备；**必需**用于机密（API 密钥、令牌、密码）
4. **内置默认值** —— 当未设置其他任何内容时，使用硬编码的安全默认值

:::info 经验法则
机密（API 密钥、机器人令牌、密码）放在 `.env` 中。其他所有内容（模型、终端后端、压缩设置、内存限制、工具集）放在 `config.yaml` 中。当两者都设置时，`config.yaml` 对非机密设置具有优先权。
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

单个值中的多个引用有效：`url: "${HOST}:${PORT}"`。如果引用的变量未设置，占位符将保持原样（`${UNDEFINED_VAR}` 保持不变）。仅支持 `${VAR}` 语法 —— 裸 `$VAR` 不会展开。

有关 AI 提供商设置（OpenRouter、Anthropic、Copilot、自定义端点、自托管 LLM、后备模型等），请参阅 [AI 提供商](/docs/integrations/providers)。

### 提供商超时

您可以为提供商设置 `providers.<id>.request_timeout_seconds` 以设置提供商范围的请求超时，以及为模型设置 `providers.<id>.models.<model>.timeout_seconds` 以进行模型特定的覆盖。适用于每次传输（OpenAI-wire、原生 Anthropic、Anthropic 兼容）上的主轮询客户端、后备链、凭据轮换后的重建，以及（对于 OpenAI-wire）每次请求的超时关键字参数 —— 因此配置的值会覆盖传统的 `HERMES_API_TIMEOUT` 环境变量。

您还可以为非流式陈旧调用检测器设置 `providers.<id>.stale_timeout_seconds`，以及为模型设置 `providers.<id>.models.<model>.stale_timeout_seconds` 以进行模型特定的覆盖。这会覆盖传统的 `HERMES_API_CALL_STALE_TIMEOUT` 环境变量。

保持这些未设置会保留传统默认值（`HERMES_API_TIMEOUT=1800` 秒，`HERMES_API_CALL_STALE_TIMEOUT=300` 秒，原生 Anthropic 900 秒）。目前未连接到 AWS Bedrock（`bedrock_converse` 和 AnthropicBedrock SDK 路径都使用 boto3 及其自己的超时配置）。请参阅 [`cli-config.yaml.example`](https://github.com/NousResearch/hermes-agent/blob/main/cli-config.yaml.example) 中的注释示例。

## 终端后端配置

Hermes 支持六种终端后端。每个后端决定智能体的 shell 命令实际执行的位置 —— 您的本地机器、Docker 容器、通过 SSH 的远程服务器、Modal 云沙箱、Daytona 工作区或 Singularity/Apptainer 容器。

```yaml
terminal:
  backend: local    # local | docker | ssh | modal | daytona | singularity
  cwd: "."          # 工作目录（"." = 本地当前目录，"/root" = 容器目录）
  timeout: 180      # 每次命令超时（秒）
  env_passthrough: []  # 要转发到沙箱执行的环境变量名称（终端 + execute_code）
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"  # Singularity 后端的容器镜像
  modal_image: "nikolaik/python-nodejs:python3.11-nodejs20"                 # Modal 后端的容器镜像
  daytona_image: "nikolaik/python-nodejs:python3.11-nodejs20"               # Daytona 后端的容器镜像
```

对于云沙箱（如 Modal 和 Daytona），`container_persistent: true` 表示 Hermes 会尝试在沙箱重新创建时保留文件系统状态。它不保证相同的活动沙箱、PID 空间或后台进程稍后仍在运行。

### 后端概览

| 后端 | 命令运行位置 | 隔离性 | 最适合 |
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
智能体具有与您的用户帐户相同的文件系统访问权限。使用 `hermes tools` 禁用您不想要的工具，或切换到 Docker 进行沙箱化。
:::

### Docker 后端

在具有安全加固（所有功能被删除，无权限提升，PID 限制）的 Docker 容器内运行命令。

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
  container_persistent: true       # 跨会话保留 /workspace 和 /root
```

**要求：** 已安装并运行 Docker Desktop 或 Docker Engine。Hermes 会探测 `$PATH` 以及常见的 macOS 安装位置（`/usr/local/bin/docker`、`/opt/homebrew/bin/docker`、Docker Desktop 应用程序包）。

**容器生命周期：** Hermes 在终端和文件工具调用的整个生命周期内重用单个长期运行的容器（`docker run -d ... sleep 2h`），跨会话、`/new`、`/reset` 和 `delegate_task` 子智能体。命令通过登录 shell 的 `docker exec` 运行，因此工作目录更改、安装的软件包和 `/workspace` 中的文件都会从一个工具调用持续到下一个工具调用。容器在 Hermes 关闭时停止并删除（或当空闲扫描回收它时）。

通过 `delegate_task(tasks=[...])` 生成的并行子智能体共享这一个容器 —— 并发的 `cd`、环境变量更改和对相同路径的写入会发生冲突。如果子智能体需要隔离的沙箱，它必须通过 `register_task_env_overrides()` 注册每个任务的镜像覆盖，RL 和基准环境（TerminalBench2、HermesSweEnv 等）会自动为其每个任务的 Docker 镜像执行此操作。

**安全加固：**
- `--cap-drop ALL`，仅添加回 `DAC_OVERRIDE`、`CHOWN`、`FOWNER`
- `--security-opt no-new-privileges`
- `--pids-limit 256`
- 对 `/tmp`（512MB）、`/var/tmp`（256MB）、`/run`（64MB）进行大小限制的 tmpfs

**凭据转发：** `docker_forward_env` 中列出的环境变量首先从您的 shell 环境解析，然后是 `~/.hermes/.env`。技能还可以声明 `required_environment_variables`，这些变量会自动合并。

### SSH 后端

通过 SSH 在远程服务器上运行命令。使用 ControlMaster 进行连接重用（5 分钟空闲保持活动）。默认情况下启用持久 shell —— 状态（工作目录、环境变量）在命令之间保持不变。

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
| `TERMINAL_SSH_KEY` |（系统默认） | SSH 私钥路径 |
| `TERMINAL_SSH_PERSISTENT` | `true` | 启用持久 shell |

**工作原理：** 在初始化时使用 `BatchMode=yes` 和 `StrictHostKeyChecking=accept-new` 连接。持久 shell 在远程主机上保持单个 `bash -l` 进程活动，通过临时文件进行通信。需要 `stdin_data` 或 `sudo` 的命令会自动回退到一次性模式。

### Modal 后端

在 [Modal](https://modal.com) 云沙箱中运行命令。每个任务都会获得一个具有可配置 CPU、内存和磁盘的隔离 VM。文件系统可以跨会话快照/恢复。

```yaml
terminal:
  backend: modal
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB（5GB）
  container_disk: 51200            # MB（50GB）
  container_persistent: true       # 快照/恢复文件系统
```

**必需：** `MODAL_TOKEN_ID` + `MODAL_TOKEN_SECRET` 环境变量，或 `~/.modal.toml` 配置文件。

**持久性：** 启用时，沙箱文件系统在清理时进行快照，并在下次会话时恢复。快照在 `~/.hermes/modal_snapshots.json` 中跟踪。这会保留文件系统状态，而不是活动进程、PID 空间或后台作业。

**凭据文件：** 自动从 `~/.hermes/`（OAuth 令牌等）挂载，并在每次命令前同步。

### Daytona 后端

在 [Daytona](https://daytona.io) 托管工作区中运行命令。支持停止/恢复以实现持久性。

```yaml
terminal:
  backend: daytona
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB → 转换为 GiB
  container_disk: 10240            # MB → 转换为 GiB（最大 10 GiB）
  container_persistent: true       # 停止/恢复而不是删除
```

**必需：** `DAYTONA_API_KEY` 环境变量。

**持久性：** 启用时，沙箱在清理时停止（而不是删除），并在下次会话时恢复。沙箱名称遵循模式 `hermes-{task_id}`。

**磁盘限制：** Daytona 强制执行 10 GiB 最大值。超过此值的请求会被限制并发出警告。

### Singularity/Apptainer 后端

在 [Singularity/Apptainer](https://apptainer.org) 容器中运行命令。专为 HPC 集群和无法使用 Docker 的共享机器而设计。

```yaml
terminal:
  backend: singularity
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB
  container_persistent: true       # 可写覆盖层跨会话保留
```

**要求：** `$PATH` 中有 `apptainer` 或 `singularity` 二进制文件。

**镜像处理：** Docker URL（`docker://...`）会自动转换为 SIF 文件并缓存。现有的 `.sif` 文件直接使用。

**临时目录：** 按顺序解析：`TERMINAL_SCRATCH_DIR` → `TERMINAL_SANDBOX_DIR/singularity` → `/scratch/$USER/hermes-agent`（HPC 约定）→ `~/.hermes/sandboxes/singularity`。

**隔离：** 使用 `--containall --no-home` 实现完全命名空间隔离，不挂载主机主目录。

### 常见终端后端问题

如果终端命令立即失败或报告终端工具被禁用：

- **本地** —— 无特殊要求。开始时的最安全默认值。
- **Docker** —— 运行 `docker version` 以验证 Docker 是否正常工作。如果失败，请修复 Docker 或 `hermes config set terminal.backend local`。
- **SSH** —— 必须设置 `TERMINAL_SSH_HOST` 和 `TERMINAL_SSH_USER`。如果任一缺失，Hermes 会记录清晰的错误。
- **Modal** —— 需要 `MODAL_TOKEN_ID` 环境变量或 `~/.modal.toml`。运行 `hermes doctor` 进行检查。
- **Daytona** —— 需要 `DAYTONA_API_KEY`。Daytona SDK 处理服务器 URL 配置。
- **Singularity** —— `$PATH` 中需要 `apptainer` 或 `singularity`。在 HPC 集群上很常见。

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

这很有用，例如：
- **向智能体提供文件**（数据集、配置、参考代码）
- **从智能体接收文件**（生成的代码、报告、导出）
- **共享工作区**，您和智能体都可以访问相同的文件

如果您使用消息网关并希望智能体通过 `MEDIA:/...` 发送生成的文件，请优先使用专用的主机可见导出挂载，例如 `/home/user/.hermes/cache/documents:/output`。

- 在 Docker 内将文件写入 `/output/...`
- 在 `MEDIA:` 中发出**主机路径**，例如：`MEDIA:/home/user/.hermes/cache/documents/report.txt`
- **不要**发出 `/workspace/...` 或 `/output/...`，除非该确切路径也存在于主机上的网关进程中

:::warning
YAML 重复键会静默覆盖前面的键。如果您已经有一个 `docker_volumes:` 块，请将新的挂载合并到同一个列表中，而不是在文件中稍后添加另一个 `docker_volumes:` 键。
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

Hermes 首先从您当前的 shell 解析每个列出的变量，如果之前使用 `hermes config set` 保存，则回退到 `~/.hermes/.env`。

:::warning
`docker_forward_env` 中列出的任何内容都会对容器内运行的命令可见。仅转发您愿意暴露给终端会话的凭据。
:::

### 可选：将启动目录挂载到 `/workspace`

Docker 沙箱默认保持隔离。Hermes **不会**将您当前的主机工作目录传递到容器中，除非您明确选择加入。

在 `config.yaml` 中启用它：

```yaml
terminal:
  backend: docker
  docker_mount_cwd_to_workspace: true
```

启用时：
- 如果您从 `~/projects/my-app` 启动 Hermes，该主机目录会绑定挂载到 `/workspace`
- Docker 后端从 `/workspace` 开始
- 文件工具和终端命令都会看到相同的挂载项目

禁用时，除非您通过 `docker_volumes` 明确挂载某些内容，否则 `/workspace` 保持沙箱拥有。

安全权衡：
- `false` 保留沙箱边界
- `true` 让沙箱直接访问您启动 Hermes 的目录

仅当您有意希望容器处理活动主机文件时，才使用选择加入。

### 持久 Shell

默认情况下，每个终端命令都在其自己的子进程中运行 —— 工作目录、环境变量和 shell 变量在命令之间重置。启用**持久 shell** 时，单个长期运行的 bash 进程会在 `execute()` 调用之间保持活动状态，以便状态在命令之间保持不变。

这对于**SSH 后端**最有用，因为它还消除了每次命令的连接开销。**SSH 默认启用持久 shell**，而本地后端则禁用。

```yaml
terminal:
  persistent_shell: true   # 默认 —— 为 SSH 启用持久 shell
```

要禁用：

```bash
hermes config set terminal.persistent_shell false
```

**跨命令保持的内容：**
- 工作目录（`cd /tmp` 对下一个命令有效）
- 导出的环境变量（`export FOO=bar`）
- Shell 变量（`MY_VAR=hello`）

**优先级：**

| 级别 | 变量 | 默认值 |
|-------|----------|---------|
| 配置 | `terminal.persistent_shell` | `true` |
| SSH 覆盖 | `TERMINAL_SSH_PERSISTENT` | 遵循配置 |
| 本地覆盖 | `TERMINAL_LOCAL_PERSISTENT` | `false` |

每个后端的环境变量具有最高优先级。如果您也希望在本地后端使用持久 shell：

```bash
export TERMINAL_LOCAL_PERSISTENT=true
```

:::note
需要 `stdin_data` 或 sudo 的命令会自动回退到一次性模式，因为持久 shell 的 stdin 已被 IPC 协议占用。
:::

有关每个后端的详细信息，请参阅 [代码执行](features/code-execution.md) 和 [README 的终端部分](features/tools.md)。

## 技能设置

技能可以通过其 SKILL.md 前置元数据声明自己的配置设置。这些是非敏感值（路径、首选项、域设置），存储在 `config.yaml` 的 `skills.config` 命名空间下。

```yaml
skills:
  config:
    myplugin:
      path: ~/myplugin-data   # 示例 — 每个技能定义自己的键
```

**技能设置的工作原理：**

- `hermes config migrate` 会扫描所有已启用的技能，查找未配置的设置，并提示您进行配置
- `hermes config show` 会在“技能设置”下列出所有技能设置及其所属技能
- 当技能加载时，其解析后的配置值会自动注入到技能上下文中

**手动设置值：**

```bash
hermes config set skills.config.myplugin.path ~/myplugin-data
```

有关在您自己的技能中声明配置设置的详细信息，请参阅[创建技能 — 配置设置](/docs/developer-guide/creating-skills#config-settings-configyaml)。

## 记忆配置

```yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # 约 800 个词元
  user_char_limit: 1375     # 约 500 个词元
```

## 文件读取安全性

控制单次 `read_file` 调用可返回的内容量。超出限制的读取将被拒绝，并返回错误提示智能体使用 `offset` 和 `limit` 来读取更小的范围。这可防止因读取单个压缩后的 JS 包或大型数据文件而导致上下文窗口被淹没。

```yaml
file_read_max_chars: 100000  # 默认值 — 约 2.5-3.5 万个 token
```

如果您使用的是具有大上下文窗口的模型，并且经常读取大文件，请适当提高此值。对于小上下文窗口的模型，请降低此值以保持读取效率：

```yaml
# 大上下文窗口模型（20 万+）
file_read_max_chars: 200000

# 小型本地模型（1.6 万上下文）
file_read_max_chars: 30000
```

智能体还会自动对文件读取进行去重 — 如果同一文件区域被读取两次且文件未被修改，则返回一个轻量级存根，而不是重新发送内容。在上下文压缩后，此机制会重置，以便智能体在其内容被摘要移除后重新读取文件。

## 工具输出截断限制

三个相关的上限控制工具在 Hermes 截断其输出前可返回的原始输出量：

```yaml
tool_output:
  max_bytes: 50000        # 终端输出上限（字符数）
  max_lines: 2000         # read_file 分页上限
  max_line_length: 2000   # read_file 行号视图中每行上限
```

- **`max_bytes`** — 当 `terminal` 命令产生的标准输出/标准错误字符总数超过此值时，Hermes 会保留前 40% 和后 60%，并在它们之间插入 `[OUTPUT TRUNCATED]` 通知。默认值 `50000`（在典型分词器中约等于 1.2-1.5 万个 token）。
- **`max_lines`** — 单次 `read_file` 调用中 `limit` 参数的上限。超过此值的请求会被限制，以防止单次读取淹没上下文窗口。默认值 `2000`。
- **`max_line_length`** — 当 `read_file` 发出带行号的视图时，应用于每行的上限。超过此长度的行会被截断为此字符数，后跟 `... [truncated]`。默认值 `2000`。

对于具有大上下文窗口且每次调用可承受更多原始输出的模型，请提高这些限制。对于小上下文窗口的模型，请降低它们以保持工具结果紧凑：

```yaml
# 大上下文窗口模型（20 万+）
tool_output:
  max_bytes: 150000
  max_lines: 5000

# 小型本地模型（1.6 万上下文）
tool_output:
  max_bytes: 20000
  max_lines: 500
```

## 全局工具集禁用

若要在 CLI 和每个网关平台中一处禁用特定工具集，请将其名称列在 `agent.disabled_toolsets` 下：

```yaml
agent:
  disabled_toolsets:
    - memory       # 隐藏 memory 工具 + MEMORY_GUIDANCE 注入
    - web          # 任何地方都不使用 web_search / web_extract
```

此配置**在**每个平台的工具配置（由 `hermes tools` 写入的 `platform_toolsets`）**之后**生效，因此此处列出的工具集始终会被移除 — 即使某个平台的已保存配置仍将其列出。当您希望使用单个开关实现“在所有地方关闭 X”，而不是在 `hermes tools` UI 中编辑 15+ 个平台行时，请使用此功能。

将列表留空或省略该键，则不执行任何操作。

## Git 工作树隔离

为在同一仓库上并行运行多个智能体启用隔离的 git 工作树：

```yaml
worktree: true    # 始终创建工作树（等同于 hermes -w）
# worktree: false # 默认值 — 仅在传递 -w 标志时创建
```

启用后，每个 CLI 会话都会在 `.worktrees/` 下创建一个具有其自身分支的全新工作树。智能体可以编辑文件、提交、推送和创建 PR，而不会相互干扰。干净的工作树会在退出时被移除；脏工作树则会保留以供手动恢复。

您还可以通过仓库根目录下的 `.worktreeinclude` 文件列出要复制到工作树中的 git 忽略文件：

```
# .worktreeinclude
.env
.venv/
node_modules/
```

## 上下文压缩

Hermes 会自动压缩长对话，以使其保持在模型上下文窗口范围内。压缩摘要器是一个独立的 LLM 调用 — 您可以将其指向任何提供商或端点。

所有压缩设置都位于 `config.yaml` 中（无环境变量）。

### 完整参考

```yaml
compression:
  enabled: true                                     # 开启/关闭压缩
  threshold: 0.50                                   # 在此百分比达到上下文限制时进行压缩
  target_ratio: 0.20                                # 保留为最近尾部所占阈值的比例
  protect_last_n: 20                                # 最少保留的最近未压缩消息数

# 摘要模型/提供商在 auxiliary 下配置：
auxiliary:
  compression:
    model: "google/gemini-3-flash-preview"          # 用于摘要的模型
    provider: "auto"                                # 提供商："auto"、"openrouter"、"nous"、"codex"、"main" 等。
    base_url: null                                  # 自定义 OpenAI 兼容端点（覆盖提供商）
```

:::info 旧配置迁移
包含 `compression.summary_model`、`compression.summary_provider` 和 `compression.summary_base_url` 的旧配置会在首次加载时自动迁移到 `auxiliary.compression.*`（配置版本 17）。无需手动操作。
:::

### 常见设置

**默认（自动检测）— 无需配置：**
```yaml
compression:
  enabled: true
  threshold: 0.50
```
使用第一个可用的提供商（OpenRouter → Nous → Codex）和 Gemini Flash。

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
指向自定义的 OpenAI 兼容端点。使用 `OPENAI_API_KEY` 进行身份验证。

### 三个参数如何相互作用

| `auxiliary.compression.provider` | `auxiliary.compression.base_url` | 结果 |
|---------------------|---------------------|--------|
| `auto`（默认） | 未设置 | 自动检测最佳可用提供商 |
| `nous` / `openrouter` / 等 | 未设置 | 强制使用该提供商，使用其身份验证 |
| 任意 | 已设置 | 直接使用自定义端点（忽略提供商） |

:::warning 摘要模型上下文长度要求
摘要模型**必须**具有至少与主智能体模型一样大的上下文窗口。压缩器会将对话的中间完整部分发送给摘要模型 — 如果该模型的上下文窗口小于主模型，则摘要调用将因上下文长度错误而失败。发生这种情况时，中间轮次将**被丢弃且无摘要**，从而静默地丢失对话上下文。如果您要覆盖模型，请验证其上下文长度是否达到或超过主模型。
:::

## 上下文引擎

上下文引擎控制在接近模型 token 限制时如何管理对话。内置的 `compressor` 引擎使用有损摘要（参见[上下文压缩](/docs/developer-guide/context-compression-and-caching)）。插件引擎可以用其他策略替换它。

```yaml
context:
  engine: "compressor"    # 默认值 — 内置有损摘要
```

要使用插件引擎（例如，用于无损上下文管理的 LCM）：

```yaml
context:
  engine: "lcm"          # 必须与插件名称匹配
```

插件引擎**永远不会自动激活** — 您必须显式地将 `context.engine` 设置为插件名称。可通过 `hermes plugins` → 提供商插件 → 上下文引擎浏览和选择可用的引擎。

参见[记忆提供商](/docs/user-guide/features/memory-providers)以了解记忆插件的类似单选系统。

## 迭代预算压力

当智能体处理具有许多工具调用的复杂任务时，它可能会在不知不觉中耗尽其迭代预算（默认值：90 轮）。预算压力会在接近限制时自动警告模型：

| 阈值 | 级别 | 模型看到的内容 |
|-----------|-------|---------------------|
| **70%** | 注意 | `[BUDGET: 63/90. 还剩 27 次迭代。开始整合。]` |
| **90%** | 警告 | `[BUDGET WARNING: 81/90. 仅剩 9 次。立即响应。]` |

警告会被注入到最后一个工具结果的 JSON 中（作为一个 `_budget_warning` 字段），而不是作为单独的消息 — 这可保持提示缓存并避免破坏对话结构。

```yaml
agent:
  max_turns: 90                # 每轮对话的最大迭代次数（默认值：90）
```

默认情况下启用预算压力。智能体会自然地看到作为工具结果一部分的警告，这鼓励它在耗尽迭代次数之前整合其工作并交付响应。

当迭代预算完全耗尽时，CLI 会向用户显示通知：`⚠ 迭代预算已达到 (90/90) — 响应可能不完整`。如果预算在主动工作期间耗尽，智能体会在停止之前生成已完成工作的摘要。

### API 超时

Hermes 对流式传输具有单独的超时层，以及对非流式调用具有过时检测器。仅当您将其保留在隐式默认值时，过时检测器才会针对本地提供商自动调整。

| 超时 | 默认值 | 本地提供商 | 配置 / 环境变量 |
|---------|---------|----------------|--------------|
| Socket 读取超时 | 120 秒 | 自动提升至 1800 秒 | `HERMES_STREAM_READ_TIMEOUT` |
| 过时流检测 | 180 秒 | 自动禁用 | `HERMES_STREAM_STALE_TIMEOUT` |
| 过时非流检测 | 300 秒 | 保留隐式时自动禁用 | `providers.<id>.stale_timeout_seconds` 或 `HERMES_API_CALL_STALE_TIMEOUT` |
| API 调用（非流式） | 1800 秒 | 保持不变 | `providers.<id>.request_timeout_seconds` / `timeout_seconds` 或 `HERMES_API_TIMEOUT` |

**Socket 读取超时**控制 httpx 等待来自提供商的下一个数据块的时间。本地 LLM 在大型上下文上进行预填充时，在生成第一个 token 之前可能需要几分钟，因此当 Hermes 检测到本地端点时，会将其提升至 30 分钟。如果您显式设置了 `HERMES_STREAM_READ_TIMEOUT`，则无论端点检测结果如何，始终使用该值。

**过时流检测**会终止接收 SSE 保活 ping 但没有实际内容的连接。对于本地提供商，此功能被完全禁用，因为它们在预填充期间不会发送保活 ping。

**过时非流检测**会终止长时间无响应的非流式调用。默认情况下，Hermes 会在本地端点上禁用此功能，以避免在长预填充期间出现误报。如果您显式设置了 `providers.<id>.stale_timeout_seconds`、`providers.<id>.models.<model>.stale_timeout_seconds` 或 `HERMES_API_CALL_STALE_TIMEOUT`，即使在本地端点上，也会遵守该显式值。

## 上下文压力警告

除了迭代预算压力之外，上下文压力还会跟踪对话接近**压缩阈值**的程度——这是触发上下文压缩以总结较早消息的点。这有助于您和智能体了解对话何时变得冗长。

| 进度 | 级别 | 发生情况 |
|----------|-------|-------------|
| **≥ 60%** 接近阈值 | 信息 | CLI 显示青色进度条；网关发送信息通知 |
| **≥ 85%** 接近阈值 | 警告 | CLI 显示粗体黄色条；网关警告即将进行压缩 |

在 CLI 中，上下文压力以工具输出流中的进度条形式显示：

```
  ◐ 上下文 ████████████░░░░░░░░ 62% 接近压缩  48k 阈值 (50%) · 即将进行压缩
```

在消息传递平台上，会发送纯文本通知：

```
◐ 上下文: ████████████░░░░░░░░ 62% 接近压缩 (阈值: 窗口的 50%)。
```

如果禁用了自动压缩，警告会提示上下文可能会被截断。

上下文压力是自动的——无需配置。它纯粹作为面向用户的通知触发，不会修改消息流或向模型上下文中注入任何内容。

## 凭据池策略

当您拥有同一提供商的多个 API 密钥或 OAuth 令牌时，请配置轮换策略：

```yaml
credential_pool_strategies:
  openrouter: round_robin    # 均匀轮换密钥
  anthropic: least_used      # 始终选择使用最少的密钥
```

选项：`fill_first`（默认）、`round_robin`、`least_used`、`random`。完整文档请参阅[凭据池](/docs/user-guide/features/credential-pools)。

## 辅助模型

Hermes 使用轻量级“辅助”模型来完成图像分析、网页摘要和浏览器截图分析等辅助任务。默认情况下，这些任务通过自动检测使用 **Gemini Flash** —— 您无需进行任何配置。

### 视频教程

<div style={{position: 'relative', width: '100%', aspectRatio: '16 / 9', marginBottom: '1.5rem'}}>
  <iframe
    src="https://www.youtube.com/embed/NoF-YajElIM"
    title="Hermes 智能体 — 辅助模型教程"
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0}}
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

### 通用配置模式

Hermes 中的每个模型槽位 —— 辅助任务、压缩、回退 —— 都使用相同的三个配置项：

| 键名 | 作用 | 默认值 |
|------|------|--------|
| `provider` | 用于认证和路由的提供商 | `"auto"` |
| `model` | 请求的模型 | 提供商默认模型 |
| `base_url` | 自定义 OpenAI 兼容端点（覆盖 provider） | 未设置 |

当设置 `base_url` 时，Hermes 会忽略 provider 并直接调用该端点（使用 `api_key` 或 `OPENAI_API_KEY` 进行认证）。当仅设置 `provider` 时，Hermes 使用该提供商内置的认证和基础 URL。

辅助任务可用的提供商：`auto`、`main`，以及[提供商注册表](/docs/reference/environment-variables)中的任何提供商 —— `openrouter`、`nous`、`openai-codex`、`copilot`、`copilot-acp`、`anthropic`、`gemini`、`google-gemini-cli`、`qwen-oauth`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`deepseek`、`nvidia`、`xai`、`ollama-cloud`、`alibaba`、`bedrock`、`huggingface`、`arcee`、`xiaomi`、`kilocode`、`opencode-zen`、`opencode-go`、`ai-gateway`、`azure-foundry` —— 或来自您的 `custom_providers` 列表中的任何命名自定义提供商（例如 `provider: "beans"`）。

:::warning `"main"` 仅适用于辅助任务
`"main"` 提供商选项表示“使用我的主智能体所使用的任何提供商” —— 它仅在 `auxiliary:`、`compression:` 和 `fallback_model:` 配置中有效。它**不是**顶层 `model.provider` 设置的有效值。如果您使用自定义 OpenAI 兼容端点，请在 `model:` 部分设置 `provider: custom`。有关所有主模型提供商选项，请参阅 [AI 提供商](/docs/integrations/providers)。
:::

### 完整辅助配置参考

```yaml
auxiliary:
  # 图像分析（vision_analyze 工具 + 浏览器截图）
  vision:
    provider: "auto"           # "auto", "openrouter", "nous", "codex", "main" 等
    model: ""                  # 例如 "openai/gpt-4o", "google/gemini-2.5-flash"
    base_url: ""               # 自定义 OpenAI 兼容端点（覆盖 provider）
    api_key: ""                # base_url 的 API 密钥（回退到 OPENAI_API_KEY）
    timeout: 120               # 秒 — LLM API 调用超时；视觉负载需要较长的超时时间
    download_timeout: 30       # 秒 — 图像 HTTP 下载；连接较慢时增加此值

  # 网页摘要 + 浏览器页面文本提取
  web_extract:
    provider: "auto"
    model: ""                  # 例如 "google/gemini-2.5-flash"
    base_url: ""
    api_key: ""
    timeout: 360               # 秒（6 分钟）— 每次尝试的 LLM 摘要

  # 危险命令批准分类器
  approval:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30                # 秒

  # 上下文压缩超时（与 compression.* 配置分开）
  compression:
    timeout: 120               # 秒 — 压缩会对长对话进行摘要，需要更多时间

  # 会话搜索 — 摘要过去匹配的会话
  session_search:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30
    max_concurrency: 3       # 限制并行摘要数量以减少请求突发导致的 429 错误
    extra_body: {}           # 提供商特定的 OpenAI 兼容请求字段

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
```

:::tip
每个辅助任务都有一个可配置的 `timeout`（以秒为单位）。默认值：vision 120 秒，web_extract 360 秒，approval 30 秒，compression 120 秒。如果您对辅助任务使用较慢的本地模型，请增加这些值。Vision 还有一个单独的 `download_timeout`（默认 30 秒）用于 HTTP 图像下载 —— 连接较慢或自托管图像服务器时增加此值。
:::

:::info
上下文压缩有自己的 `compression:` 块用于阈值设置，以及一个 `auxiliary.compression:` 块用于模型/提供商设置 —— 请参阅上面的[上下文压缩](#context-compression)。回退模型使用 `fallback_model:` 块 —— 请参阅[回退模型](/docs/integrations/providers#fallback-model)。三者都遵循相同的 provider/model/base_url 模式。
:::

### 会话搜索调优

如果您对 `auxiliary.session_search` 使用推理密集型模型，Hermes 现在为您提供两个内置控制项：

- `auxiliary.session_search.max_concurrency`：限制 Hermes 一次摘要的匹配会话数量
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

当您的提供商对请求突发进行速率限制，并且您希望 `session_search` 为了稳定性而牺牲一些并行性时，请使用 `max_concurrency`。

仅当您的提供商文档中说明您希望 Hermes 为该任务传递的 OpenAI 兼容请求体字段时，才使用 `extra_body`。Hermes 会原样转发该对象。

:::warning
`extra_body` 仅在您的提供商实际支持您发送的字段时才有效。如果提供商没有公开原生的 OpenAI 兼容推理关闭标志，Hermes 无法代表您合成一个。
:::

### 更改视觉模型

要对图像分析使用 GPT-4o 而不是 Gemini Flash：

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

这些选项适用于**辅助任务配置**（`auxiliary:`、`compression:`、`fallback_model:`），不适用于您的主 `model.provider` 设置。

| 提供商 | 描述 | 要求 |
|--------|------|------|
| `"auto"` | 最佳可用（默认）。视觉尝试 OpenRouter → Nous → Codex。 | — |
| `"openrouter"` | 强制使用 OpenRouter — 路由到任何模型（Gemini、GPT-4o、Claude 等） | `OPENROUTER_API_KEY` |
| `"nous"` | 强制使用 Nous Portal | `hermes auth` |
| `"codex"` | 强制使用 Codex OAuth（ChatGPT 账户）。支持视觉（gpt-5.3-codex）。 | `hermes model` → Codex |
| `"main"` | 使用您当前的自定义/主端点。这可能来自 `OPENAI_BASE_URL` + `OPENAI_API_KEY` 或通过 `hermes model` / `config.yaml` 保存的自定义端点。适用于 OpenAI、本地模型或任何 OpenAI 兼容 API。**仅限辅助任务 —— 对 `model.provider` 无效。** | 自定义端点凭据 + 基础 URL |

当您希望辅助任务绕过默认路由器时，主提供商目录中的直接 API 密钥提供商也在此处有效。一旦配置了 `GMI_API_KEY`，`gmi` 即有效：

```yaml
auxiliary:
  compression:
    provider: "gmi"
    model: "anthropic/claude-opus-4.6"
```

对于 GMI 辅助路由，请使用 GMI 的 `/v1/models` 端点返回的确切模型 ID。

### 常见配置

**使用直接自定义端点**（对于本地/自托管 API 比 `provider: "main"` 更清晰）：
```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 优先于 `provider`，因此这是将辅助任务路由到特定端点最明确的方式。对于直接端点覆盖，Hermes 使用配置的 `api_key` 或回退到 `OPENAI_API_KEY`；它不会为该自定义端点重用 `OPENROUTER_API_KEY`。

**对视觉使用 OpenAI API 密钥：**
```yaml
# 在 ~/.hermes/.env 中：
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_API_KEY=sk-...

auxiliary:
  vision:
    provider: "main"
    model: "gpt-4o"       # 或 "gpt-4o-mini" 以降低成本
```

**对视觉使用 OpenRouter**（路由到任何模型）：
```yaml
auxiliary:
  vision:
    provider: "openrouter"
    model: "openai/gpt-4o"      # 或 "google/gemini-2.5-flash" 等
```

**使用 Codex OAuth**（ChatGPT Pro/Plus 账户 —— 无需 API 密钥）：
```yaml
auxiliary:
  vision:
    provider: "codex"     # 使用您的 ChatGPT OAuth 令牌
    # 模型默认为 gpt-5.3-codex（支持视觉）
```

**使用本地/自托管模型：**
```yaml
auxiliary:
  vision:
    provider: "main"      # 使用您当前的自定义端点
    model: "my-local-model"
```

`provider: "main"` 使用 Hermes 用于普通聊天的任何提供商 —— 无论是命名自定义提供商（例如 `beans`）、内置提供商（如 `openrouter`）还是传统的 `OPENAI_BASE_URL` 端点。

:::tip
如果您将 Codex OAuth 用作主模型提供商，视觉功能会自动工作 —— 无需额外配置。Codex 包含在视觉的自动检测链中。
:::

:::warning
**视觉需要多模态模型。** 如果您设置 `provider: "main"`，请确保您的端点支持多模态/视觉 —— 否则图像分析将失败。
:::

### 环境变量（传统方式）

辅助模型也可以通过环境变量进行配置。但是，`config.yaml` 是首选方法 —— 它更易于管理，并支持所有选项，包括 `base_url` 和 `api_key`。

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

压缩和回退模型设置仅限 config.yaml。

:::tip
运行 `hermes config` 查看您当前的辅助模型设置。仅当覆盖值与默认值不同时才会显示。
:::

## 推理努力程度

控制模型在响应之前进行多少“思考”：

```yaml
智能体:
  reasoning_effort: ""   # 空 = 中等（默认）。选项：none、minimal、low、medium、high、xhigh（最大）
```

当未设置时（默认），推理努力程度默认为“中等”——这是一个平衡的水平，适用于大多数任务。设置一个值将覆盖默认值——更高的推理努力程度会在复杂任务上产生更好的结果，但代价是消耗更多的令牌和延迟。

您还可以使用 `/reasoning` 命令在运行时更改推理努力程度：

```
/reasoning           # 显示当前努力程度并显示状态
/reasoning high      # 将推理努力程度设置为高
/reasoning none      # 禁用推理
/reasoning show      # 在每个响应上方显示模型的思考过程
/reasoning hide      # 隐藏模型的思考过程
```

## 工具使用强制执行

某些模型偶尔会用文本描述预期操作，而不是发出工具调用（例如，“我将运行测试...”而不是实际调用终端）。工具使用强制执行会注入系统提示指导，引导模型实际调用工具。

```yaml
智能体:
  tool_use_enforcement: "auto"   # "auto" | true | false | ["model-substring", ...]
```

| 值 | 行为 |
|-------|----------|
| `"auto"`（默认） | 对匹配以下条件的模型启用：`gpt`、`codex`、`gemini`、`gemma`、`grok`。对所有其他模型（Claude、DeepSeek、Qwen等）禁用。 |
| `true` | 始终启用，无论模型如何。如果您注意到当前模型描述操作而不是执行它们，则此选项很有用。 |
| `false` | 始终禁用，无论模型如何。 |
| `["gpt", "codex", "qwen", "llama"]` | 仅当模型名称包含列出的子字符串之一时（不区分大小写）才启用。 |

### 它注入了什么

启用后，可能会向系统提示添加三层指导：

1. **通用工具使用强制执行**（所有匹配的模型）——指示模型立即发出工具调用，而不是描述意图，继续工作直到任务完成，并且绝不能以承诺未来操作的语句结束一个回合。

2. **OpenAI执行纪律**（仅GPT和Codex模型）——额外的指导，解决GPT特有的故障模式：放弃部分结果的工作、跳过先决条件查找、产生幻觉而不是使用工具，以及未经核实就声明“完成”。

3. **Google操作指导**（仅Gemini和Gemma模型）——简洁性、绝对路径、并行工具调用和“先验证后编辑”模式。

这些对用户是透明的，并且仅影响系统提示。已经可靠使用工具的模型（如Claude）不需要此指导，这就是为什么`"auto"`排除了它们。

### 何时开启

如果您使用的模型不在默认的自动列表中，并且注意到它经常描述它*会*做什么而不是实际去做，请将`tool_use_enforcement`设置为`true`或将模型子字符串添加到列表中：

```yaml
智能体:
  tool_use_enforcement: ["gpt", "codex", "gemini", "grok", "my-custom-model"]
```

## TTS 配置

```yaml
tts:
  provider: "edge"              # "edge" | "elevenlabs" | "openai" | "minimax" | "mistral" | "gemini" | "xai" | "neutts"
  speed: 1.0                    # 全局速度倍率（所有提供者的备选值）
  edge:
    voice: "en-US-AriaNeural"   # 322 个语音，74 种语言
    speed: 1.0                  # 速度倍率（转换为速率百分比，例如 1.5 → +50%）
  elevenlabs:
    voice_id: "pNInz6obpgDQGcFmaJgB"
    model_id: "eleven_multilingual_v2"
  openai:
    model: "gpt-4o-mini-tts"
    voice: "alloy"              # alloy, echo, fable, onyx, nova, shimmer
    speed: 1.0                  # 速度倍率（API 限制在 0.25–4.0 范围内）
    base_url: "https://api.openai.com/v1"  # 用于 OpenAI 兼容 TTS 端点的覆盖地址
  minimax:
    speed: 1.0                  # 语音速度倍率
    # base_url: ""              # 可选：用于 OpenAI 兼容 TTS 端点的覆盖地址
  mistral:
    model: "voxtral-mini-tts-2603"
    voice_id: "c69964a6-ab8b-4f8a-9465-ec0925096ec8"  # Paul - 中性（默认）
  gemini:
    model: "gemini-2.5-flash-preview-tts"   # 或 gemini-2.5-pro-preview-tts
    voice: "Kore"               # 30 个预置语音：Zephyr、Puck、Kore、Enceladus 等
  xai:
    voice_id: "eve"             # xAI TTS 语音
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

此项同时控制 `text_to_speech` 工具以及语音模式下的口语回复（CLI 或消息网关中的 `/voice tts`）。

**速度备选层级：** 特定提供者的速度（例如 `tts.edge.speed`）→ 全局 `tts.speed` → 默认值 `1.0`。设置全局 `tts.speed` 可对所有提供者应用统一速度，或按提供者单独覆盖以实现精细控制。

## 显示设置

```yaml
display:
  tool_progress: all      # off | new | all | verbose
  tool_progress_command: false  # 在消息网关中启用 /verbose 斜杠命令
  tool_progress_overrides: {}  # 按平台覆盖（见下文）
  interim_assistant_messages: true  # 网关：将自然的轮次中途助手更新作为单独消息发送
  skin: default           # 内置或自定义 CLI 皮肤（见 user-guide/features/skins）
  personality: "kawaii"  # 仍会在某些摘要中显示的旧版外观字段
  compact: false          # 紧凑输出模式（减少空白）
  resume_display: full    # full（恢复时显示之前消息）| minimal（仅一行摘要）
  bell_on_complete: false # 智能体完成时播放终端铃声（非常适合长时间任务）
  show_reasoning: false   # 在每个回复上方显示模型推理/思考过程（使用 /reasoning show|hide 切换）
  streaming: false        # 实时将令牌流式传输到终端（实时输出）
  show_cost: false        # 在 CLI 状态栏中显示预估 $ 费用
  tool_preview_length: 0  # 工具调用预览的最大字符数（0 = 无限制，显示完整路径/命令）
```

| 模式 | 显示内容 |
|------|-------------|
| `off` | 静默 — 仅最终回复 |
| `new` | 仅当工具变更时显示工具指示器 |
| `all` | 每次工具调用都带有简短预览（默认） |
| `verbose` | 完整参数、结果和调试日志 |

在 CLI 中，使用 `/verbose` 在这些模式间循环切换。若要在消息平台（Telegram、Discord、Slack 等）中使用 `/verbose`，请在上面的 `display` 部分设置 `tool_progress_command: true`。该命令随后会循环切换模式并保存到配置中。

### 按平台进度覆盖

不同平台对详细程度有不同需求。例如，Signal 无法编辑消息，因此每次进度更新都会变成一条单独的消息 — 造成噪音。使用 `tool_progress_overrides` 设置按平台的模式：

```yaml
display:
  tool_progress: all          # 全局默认
  tool_progress_overrides:
    signal: 'off'             # 在 Signal 上静音进度
    telegram: verbose         # 在 Telegram 上显示详细进度
    slack: 'off'              # 在共享 Slack 工作区保持安静
```

没有覆盖设置的平台将回退到全局 `tool_progress` 值。有效的平台键：`telegram`、`discord`、`slack`、`signal`、`whatsapp`、`matrix`、`mattermost`、`email`、`sms`、`homeassistant`、`dingtalk`、`feishu`、`wecom`、`weixin`、`bluebubbles`、`qqbot`。

`interim_assistant_messages` 仅限网关使用。启用后，Hermes 会将已完成的轮次中途助手更新作为单独的聊天消息发送。此项独立于 `tool_progress`，且不需要网关流式传输。

## 隐私

```yaml
privacy:
  redact_pii: false  # 从 LLM 上下文中去除 PII（仅限网关）
```

当 `redact_pii` 为 `true` 时，网关会在将系统提示发送到 LLM 之前，从系统提示中去除受支持平台上的个人身份信息：

| 字段 | 处理方式 |
|-------|-----------|
| 电话号码（WhatsApp/Signal 上的用户 ID） | 哈希为 `user_<12-char-sha256>` |
| 用户 ID | 哈希为 `user_<12-char-sha256>` |
| 聊天 ID | 数字部分被哈希，平台前缀保留（`telegram:<hash>`） |
| 家庭频道 ID | 数字部分被哈希 |
| 用户姓名 / 用户名 | **不受影响**（用户自选，公开可见） |

**平台支持：** 去除操作适用于 WhatsApp、Signal 和 Telegram。Discord 和 Slack 被排除，因为它们的提及系统（`<@user_id>`）需要在 LLM 上下文中使用真实 ID。

哈希是确定性的 — 同一用户始终映射到相同的哈希，因此模型仍然可以在群聊中区分不同用户。路由和投递在内部使用原始值。

## 语音转文本 (STT)

```yaml
stt:
  provider: "local"            # "local" | "groq" | "openai" | "mistral"
  local:
    model: "base"              # tiny, base, small, medium, large-v3
  openai:
    model: "whisper-1"         # whisper-1 | gpt-4o-mini-transcribe | gpt-4o-transcribe
  # model: "whisper-1"         # 仍受尊重的旧版备选键
```

提供者行为：

- `local` 使用运行在您机器上的 `faster-whisper`。请单独安装：`pip install faster-whisper`。
- `groq` 使用 Groq 的 Whisper 兼容端点，并读取 `GROQ_API_KEY`。
- `openai` 使用 OpenAI 语音 API，并读取 `VOICE_TOOLS_OPENAI_KEY`。

如果请求的提供者不可用，Hermes 将自动按以下顺序回退：`local` → `groq` → `openai`。

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
  record_key: "ctrl+b"         # CLI 内的按住讲话键
  max_recording_seconds: 120    # 长时间录音的强制停止时间
  auto_tts: false               # 启用 /voice on 时自动开启口语回复
  beep_enabled: true            # 在 CLI 语音模式中播放录音开始/停止提示音
  silence_threshold: 200        # 语音检测的 RMS 阈值
  silence_duration: 3.0         # 自动停止前的静音秒数
```

在 CLI 中使用 `/voice on` 启用麦克风模式，使用 `record_key` 开始/停止录音，并使用 `/voice tts` 切换口语回复。有关端到端设置和特定平台行为，请参阅 [语音模式](/docs/user-guide/features/voice-mode)。

## 流式传输

当标记（token）到达时，将其流式传输到终端或消息平台，而不是等待完整响应。

### CLI 流式传输

```yaml
display:
  streaming: true         # 实时将标记流式传输到终端
  show_reasoning: true    # 同时流式传输推理/思考标记（可选）
```

启用后，响应会逐个标记地出现在流式传输框中。工具调用仍会被静默捕获。如果提供商不支持流式传输，则会自动回退到正常显示。

### 网关流式传输（Telegram、Discord、Slack）

```yaml
streaming:
  enabled: true           # 启用渐进式消息编辑
  transport: edit         # "edit"（渐进式消息编辑）或 "off"
  edit_interval: 0.3      # 消息编辑之间的间隔（秒）
  buffer_threshold: 40    # 强制刷新编辑前的字符数
  cursor: " ▉"            # 流式传输期间显示的游标
  fresh_final_after_seconds: 60   # 当预览达到此时间后，发送全新的最终消息（Telegram）；0 = 始终就地编辑
```

启用后，机器人会在第一个标记到达时发送一条消息，然后随着更多标记的到达逐步编辑该消息。不支持消息编辑的平台（如 Signal、Email、Home Assistant）会在首次尝试时自动检测到——流式传输会优雅地对该会话禁用，不会产生消息洪泛。

如果需要在不进行渐进式标记编辑的情况下，单独显示自然的中途智能体更新，请设置 `display.interim_assistant_messages: true`。

**溢出处理：** 如果流式传输的文本超出平台的消息长度限制（约 4096 个字符），当前消息将被最终确定，并自动开始一条新消息。

**全新最终消息（Telegram）：** Telegram 的 `editMessageText` 会保留原始消息的时间戳，因此长时间运行的流式传输回复即使在完成后仍会保留第一个标记的时间戳。当 `fresh_final_after_seconds > 0`（默认值为 `60`）时，已完成的回复将作为一条全新的消息发送（并尽最大努力删除过时的预览），以便 Telegram 的可见时间戳反映完成时间。短预览仍会就地最终确定。设置为 `0` 以始终就地编辑。

:::note
流式传输默认禁用。请在 `~/.hermes/config.yaml` 中启用它以体验流式传输 UX。
:::

## 群聊会话隔离

控制共享聊天是保持每个房间一个会话，还是每个参与者一个会话：

```yaml
group_sessions_per_user: true  # true = 在群组/频道中按用户隔离，false = 每个聊天一个共享会话
```

- `true` 是默认设置且为推荐设置。在 Discord 频道、Telegram 群组、Slack 频道和类似的共享上下文中，当平台提供用户 ID 时，每个发送者都会获得自己的会话。
- `false` 会恢复旧的共享房间行为。如果您明确希望 Hermes 将频道视为一个协作会话，这可能很有用，但也意味着用户会共享上下文、标记成本和打断状态。
- 私信不受影响。Hermes 仍会像往常一样按聊天/私信 ID 对私信进行键控。
- 无论哪种方式，线程都与其父频道保持隔离；使用 `true` 时，每个参与者在线程内也会获得自己的会话。

有关行为详细信息和示例，请参阅 [会话](/docs/user-guide/sessions) 和 [Discord 指南](/docs/user-guide/messaging/discord)。

## 未授权私信行为

控制 Hermes 在收到未知用户发送的私信时的行为：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `pair` 是默认行为。Hermes 拒绝访问，但会在私信中回复一次性配对码。
- `ignore` 静默丢弃未授权的私信。
- 平台配置段会覆盖全局默认设置，因此你可以在全局启用配对功能，同时让某个平台保持安静。

## 快速命令

定义自定义命令，这些命令要么在不调用 LLM 的情况下运行 shell 命令，要么将一个斜杠命令别名为另一个命令。Exec 快速命令是零 token 消耗的，适用于从消息平台（如 Telegram、Discord 等）进行快速服务器检查或实用脚本操作。

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

用法：在 CLI 或任何消息平台中输入 `/status`、`/disk`、`/update`、`/gpu` 或 `/restart`。`exec` 命令在主机本地运行并直接返回输出——不调用 LLM，不消耗 token。`alias` 命令会重写为配置的目标斜杠命令。

- **30 秒超时** —— 长时间运行的命令会被终止并返回错误消息
- **优先级** —— 快速命令在技能命令之前检查，因此你可以覆盖技能名称
- **自动补全** —— 快速命令在调度时解析，不会显示在内置斜杠命令自动补全表中
- **类型** —— 支持的类型有 `exec` 和 `alias`；其他类型会显示错误
- **随处可用** —— CLI、Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant

仅包含字符串的提示快捷方式不是有效的快速命令。对于可重用的提示工作流，请创建一个技能或别名指向现有的斜杠命令。

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
  mode: project                # project (默认) | strict
  timeout: 300                 # 最大执行时间（秒）
  max_tool_calls: 50           # 代码执行期间的最大工具调用次数
```

**`mode`** 控制脚本的工作目录和 Python 解释器：

- **`project`**（默认）—— 脚本在会话的工作目录中使用活动的 virtualenv/conda 环境的 python 运行。项目依赖项（`pandas`、`torch`、项目包）和相对路径（`.env`、`./data.csv`）会自然解析，与 `terminal()` 看到的内容一致。
- **`strict`** —— 脚本在临时暂存目录中使用 `sys.executable`（Hermes 自身的 python）运行。可最大程度保证可重现性，但项目依赖项和相对路径将无法解析。

环境清理（剥离 `*_API_KEY`、`*_TOKEN`、`*_SECRET`、`*_PASSWORD`、`*_CREDENTIAL`、`*_PASSWD`、`*_AUTH`）和工具白名单在两种模式下均适用——切换模式不会改变安全态势。

## 网络搜索后端

`web_search`、`web_extract` 和 `web_crawl` 工具支持四种后端提供商。在 `config.yaml` 中或通过 `hermes tools` 配置后端：

```yaml
web:
  backend: firecrawl    # firecrawl | parallel | tavily | exa
```

| 后端 | 环境变量 | 搜索 | 提取 | 爬取 |
|---------|---------|--------|---------|-------|
| **Firecrawl**（默认） | `FIRECRAWL_API_KEY` | ✔ | ✔ | ✔ |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ | — |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ | ✔ |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ | — |

**后端选择：** 如果未设置 `web.backend`，则后端会根据可用的 API 密钥自动检测。如果只设置了 `EXA_API_KEY`，则使用 Exa。如果只设置了 `TAVILY_API_KEY`，则使用 Tavily。如果只设置了 `PARALLEL_API_KEY`，则使用 Parallel。否则，Firecrawl 是默认后端。

**自托管 Firecrawl：** 设置 `FIRECRAWL_API_URL` 指向你自己的实例。当设置了自定义 URL 时，API 密钥变为可选（在服务器上设置 `USE_DB_AUTHENTICATION=false` 以禁用身份验证）。

**Parallel 搜索模式：** 设置 `PARALLEL_SEARCH_MODE` 以控制搜索行为 —— `fast`、`one-shot` 或 `agentic`（默认：`agentic`）。

**Exa：** 在 `~/.hermes/.env` 中设置 `EXA_API_KEY`。支持 `category` 过滤（`company`、`research paper`、`news`、`people`、`personal site`、`pdf`）以及域名/日期过滤器。

## 浏览器

配置浏览器自动化行为：

```yaml
browser:
  inactivity_timeout: 120        # 空闲会话自动关闭前的秒数
  command_timeout: 30             # 浏览器命令（截图、导航等）的超时时间（秒）
  record_sessions: false         # 自动将浏览器会话录制为 WebM 视频并保存到 ~/.hermes/browser_recordings/
  # 可选的 CDP 覆盖 —— 设置后，Hermes 将直接连接到你的
  # Chrome（通过 /browser connect）而不是启动无头浏览器。
  cdp_url: ""
  # 对话框监督器 —— 控制在附加了 CDP 后端时如何处理原生 JS 对话框（alert / confirm / prompt）
  # （Browserbase、通过 /browser connect 连接的本地 Chrome）。在 Camofox 和默认本地智能体-浏览器模式下忽略。
  dialog_policy: must_respond    # must_respond | auto_dismiss | auto_accept
  dialog_timeout_s: 300          # 在 must_respond 模式下的安全自动关闭时间（秒）
  camofox:
    managed_persistence: false   # 当为 true 时，Camofox 会话在重启之间保留 cookie/登录状态
```

**对话框策略：**

- `must_respond`（默认）—— 捕获对话框，将其显示在 `browser_snapshot.pending_dialogs` 中，并等待智能体调用 `browser_dialog(action=...)`。如果在 `dialog_timeout_s` 秒后没有响应，对话框将自动关闭，以防止页面的 JS 线程无限期阻塞。
- `auto_dismiss` —— 捕获后立即关闭。智能体稍后仍会在 `browser_snapshot.recent_dialogs` 中看到对话框记录，其中 `closed_by="auto_policy"`。
- `auto_accept` —— 捕获后立即接受。适用于具有激进的 `beforeunload` 提示的页面。

请参阅[浏览器功能页面](./features/browser.md#browser_dialog)以了解完整的对话框工作流。

浏览器工具集支持多个提供商。有关 Browserbase、Browser Use 和本地 Chrome CDP 设置的详细信息，请参阅[浏览器功能页面](/docs/user-guide/features/browser)。

## 时区

使用 IANA 时区字符串覆盖服务器本地时区。影响日志中的时间戳、cron 调度和系统提示中的时间注入。

```yaml
timezone: "America/New_York"   # IANA 时区（默认："" = 服务器本地时间）
```

支持的值：任何 IANA 时区标识符（例如 `America/New_York`、`Europe/London`、`Asia/Kolkata`、`UTC`）。留空或省略表示使用服务器本地时间。

## Discord

为消息网关配置特定于 Discord 的行为：

```yaml
discord:
  require_mention: true          # 在服务器频道中需要 @提及 才能响应
  free_response_channels: ""     # 以逗号分隔的频道 ID 列表，机器人在这些频道中无需 @提及 即可响应
  auto_thread: true              # 在频道中 @提及 时自动创建线程
```

- `require_mention` — 当设置为 `true`（默认值）时，机器人仅在服务器频道中被 @BotName 提及时才会响应。私信（DM）始终无需提及即可工作。
- `free_response_channels` — 以逗号分隔的频道 ID 列表，机器人在这些频道中对每条消息都响应，无需提及。
- `auto_thread` — 当设置为 `true`（默认值）时，在频道中的提及会自动为该对话创建一个线程，保持频道整洁（类似于 Slack 的线程功能）。

## 安全

执行前的安全扫描和密钥信息脱敏：

```yaml
security:
  redact_secrets: false          # 在工具输出和日志中脱敏 API 密钥模式（默认关闭）
  tirith_enabled: true           # 为终端命令启用 Tirith 安全扫描
  tirith_path: "tirith"          # tirith 二进制文件的路径（默认：$PATH 中的 "tirith"）
  tirith_timeout: 5              # 等待 tirith 扫描的超时秒数
  tirith_fail_open: true         # 如果 tirith 不可用，允许命令执行
  website_blocklist:             # 参见下面的“网站黑名单”部分
    enabled: false
    domains: []
    shared_files: []
```

- `redact_secrets` — 当设置为 `true` 时，会在工具输出进入对话上下文和日志之前，自动检测并脱敏看起来像 API 密钥、令牌和密码的模式。**默认关闭** — 如果您经常在工具输出中使用真实凭据并希望有一个安全网，请启用此功能。需显式设置为 `true` 才能开启。
- `tirith_enabled` — 当设置为 `true` 时，终端命令在执行前会由 [Tirith](https://github.com/StackGuardian/tirith) 进行扫描，以检测潜在的危险操作。
- `tirith_path` — tirith 二进制文件的路径。如果 tirith 安装在非标准位置，请设置此选项。
- `tirith_timeout` — 等待 tirith 扫描的最大秒数。如果扫描超时，命令将继续执行。
- `tirith_fail_open` — 当设置为 `true`（默认值）时，如果 tirith 不可用或失败，允许命令执行。设置为 `false` 可在 tirith 无法验证命令时阻止其执行。

## 网站屏蔽列表

阻止智能体通过网页和浏览器工具访问特定域名：

```yaml
security:
  website_blocklist:
    enabled: false               # 启用 URL 屏蔽（默认：false）
    domains:                     # 被屏蔽的域名模式列表
      - "*.internal.company.com"
      - "admin.example.com"
      - "*.local"
    shared_files:                # 从外部文件加载额外规则
      - "/etc/hermes/blocked-sites.txt"
```

启用后，任何匹配被屏蔽域名模式的 URL 都会在网页或浏览器工具执行前被拒绝。这适用于 `web_search`、`web_extract`、`browser_navigate` 以及任何访问 URL 的工具。

域名规则支持：
- 精确域名：`admin.example.com`
- 通配符子域名：`*.internal.company.com`（屏蔽所有子域名）
- 顶级域通配符：`*.local`

共享文件每行包含一个域名规则（空行和以 `#` 开头的注释行会被忽略）。缺失或无法读取的文件会记录警告，但不会禁用其他网页工具。

策略缓存 30 秒，因此配置更改无需重启即可快速生效。

## 智能审批

控制 Hermes 如何处理潜在危险命令：

```yaml
approvals:
  mode: manual   # manual | smart | off
```

| 模式 | 行为 |
|------|------|
| `manual`（默认） | 在执行任何被标记的命令前提示用户。在 CLI 中显示交互式审批对话框。在消息传递中，将待审批请求加入队列。 |
| `smart` | 使用辅助 LLM 评估被标记的命令是否真正危险。低风险命令会自动审批并保留会话级持久性。真正有风险的操作会升级给用户处理。 |
| `off` | 跳过所有审批检查。等同于 `HERMES_YOLO_MODE=true`。**请谨慎使用。** |

智能模式对于减少审批疲劳特别有用——它允许智能体在安全操作上更自主地工作，同时仍能捕获真正具有破坏性的命令。

:::warning
设置 `approvals.mode: off` 会禁用终端命令的所有安全检查。仅在受信任的沙箱环境中使用此选项。
:::

## 检查点

在破坏性文件操作前自动创建文件系统快照。详情请参见[检查点与回滚](/docs/user-guide/checkpoints-and-rollback)。

```yaml
checkpoints:
  enabled: true                  # 启用自动检查点（也可通过 hermes --checkpoints 启用）
  max_snapshots: 50              # 每个目录保留的最大检查点数量
```

## 委托

为 delegate 工具配置子智能体行为：

```yaml
delegation:
  # model: "google/gemini-3-flash-preview"  # 覆盖模型（留空 = 继承父级）
  # provider: "openrouter"                  # 覆盖提供商（留空 = 继承父级）
  # base_url: "http://localhost:1234/v1"    # 直接 OpenAI 兼容端点（优先级高于 provider）
  # api_key: "local-key"                    # base_url 的 API 密钥（回退到 OPENAI_API_KEY）
  max_concurrent_children: 3                # 每批次并行子任务数（下限为 1，无上限）。也可通过 DELEGATION_MAX_CONCURRENT_CHILDREN 环境变量设置。
  max_spawn_depth: 1                        # 委托树深度上限（1-3，会被限制在此范围内）。1 = 扁平（默认）：父级生成叶子节点，叶子节点不能继续委托。2 = 协调器子节点可以生成叶子孙节点。3 = 三层结构。
  orchestrator_enabled: true                # 全局开关。当为 false 时，role="orchestrator" 会被忽略，所有子节点都会被强制设为叶子节点，无论 max_spawn_depth 如何设置。
```

**子智能体提供商:模型覆盖：** 默认情况下，子智能体会继承父智能体的提供商和模型。设置 `delegation.provider` 和 `delegation.model` 可以将子智能体路由到不同的提供商:模型组合——例如，对于范围狭窄的子任务使用廉价/快速模型，而主智能体运行昂贵的推理模型。

**直接端点覆盖：** 如果需要明显的自定义端点路径，请设置 `delegation.base_url`、`delegation.api_key` 和 `delegation.model`。这会将子智能体直接发送到该 OpenAI 兼容端点，并优先于 `delegation.provider`。如果省略 `delegation.api_key`，Hermes 仅回退到 `OPENAI_API_KEY`。

委托提供商使用与 CLI/网关启动相同的凭据解析方式。所有已配置的提供商都受支持：`openrouter`、`nous`、`copilot`、`zai`、`kimi-coding`、`minimax`、`minimax-cn`。设置提供商后，系统会自动解析正确的 base URL、API 密钥和 API 模式——无需手动连接凭据。

**优先级：** 配置中的 `delegation.base_url` → 配置中的 `delegation.provider` → 父级提供商（继承）。配置中的 `delegation.model` → 父级模型（继承）。仅设置 `model` 而不设置 `provider` 只会更改模型名称，同时保留父级的凭据（适用于在同一提供商（如 OpenRouter）内切换模型）。

**宽度和深度：** `max_concurrent_children` 限制每批次并行运行的子智能体数量（默认 `3`，下限为 1，无上限）。也可通过 `DELEGATION_MAX_CONCURRENT_CHILDREN` 环境变量设置。当模型提交的 `tasks` 数组长度超过限制时，`delegate_task` 会返回一个工具错误说明限制，而不是静默截断。`max_spawn_depth` 控制委托树的深度（限制在 1-3）。在默认值 `1` 下，委托是扁平的：子节点不能生成孙节点，传递 `role="orchestrator"` 会静默降级为 `leaf`。提升到 `2` 可使协调器子节点生成叶子孙节点；`3` 表示三层树。智能体通过 `role="orchestrator"` 选择加入协调模式；`orchestrator_enabled: false` 会强制所有子节点回到叶子节点。成本呈乘法增长——在 `max_spawn_depth: 3` 且 `max_concurrent_children: 3` 时，树最多可达 3×3×3 = 27 个并发叶子智能体。请参见[子智能体委托 → 深度限制与嵌套协调](features/delegation.md#depth-limit-and-nested-orchestration)了解使用模式。

## 澄清

配置澄清提示行为：

```yaml
clarify:
  timeout: 120                 # 等待用户澄清响应的秒数
```

## 上下文文件 (SOUL.md, AGENTS.md)

Hermes 使用两种不同的上下文范围：

| 文件 | 用途 | 范围 |
|------|------|------|
| `SOUL.md` | **主智能体身份** — 定义智能体是谁（系统提示中的槽位 #1） | `~/.hermes/SOUL.md` 或 `$HERMES_HOME/SOUL.md` |
| `.hermes.md` / `HERMES.md` | 项目特定指令（最高优先级） | 遍历至 git 根目录 |
| `AGENTS.md` | 项目特定指令，编码约定 | 递归目录遍历 |
| `CLAUDE.md` | Claude Code 上下文文件（也会被检测到） | 仅工作目录 |
| `.cursorrules` | Cursor IDE 规则（也会被检测到） | 仅工作目录 |
| `.cursor/rules/*.mdc` | Cursor 规则文件（也会被检测到） | 仅工作目录 |

- **SOUL.md** 是智能体的主要身份。它占据系统提示中的槽位 #1，完全替换内置默认身份。编辑它以完全自定义智能体是谁。
- 如果 SOUL.md 缺失、为空或无法加载，Hermes 会回退到内置默认身份。
- **项目上下文文件使用优先级系统** — 仅加载一种类型（首次匹配获胜）：`.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`。SOUL.md 始终独立加载。
- **AGENTS.md** 是分层的：如果子目录也有 AGENTS.md，所有文件都会被合并。
- 如果尚不存在，Hermes 会自动生成一个默认的 `SOUL.md`。
- 所有加载的上下文文件限制为 20,000 个字符，并进行智能截断。

另请参见：
- [个性与 SOUL.md](/docs/user-guide/features/personality)
- [上下文文件](/docs/user-guide/features/context-files)
## 工作目录

| 上下文 | 默认 |
|---------|------|
| **CLI (`hermes`)** | 运行命令的当前目录 |
| **消息传递网关** | 主目录 `~`（可通过 `MESSAGING_CWD` 覆盖） |
| **Docker / Singularity / Modal / SSH** | 容器或远程机器内的用户主目录 |

覆盖工作目录：
```bash
# 在 ~/.hermes/.env 或 ~/.hermes/config.yaml 中：
MESSAGING_CWD=/home/myuser/projects    # 网关会话
TERMINAL_CWD=/workspace                # 所有终端会话
```