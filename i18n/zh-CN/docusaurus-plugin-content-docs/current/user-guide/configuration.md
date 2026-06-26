---
sidebar_position: 2
title: "Configuration"
description: "Configure Hermes Agent — config.yaml, providers, models, API keys, and more"
---

# 配置

所有设置都存储在 `~/.hermes/` 目录中，方便访问。

:::tip 获得可用的 `config.yaml` 的最简单方法
运行 `hermes setup --portal` —— 一个 OAuth 即可获得模型提供商和所有四个工具网关（Tool Gateway）工具，而无需手动编辑 YAML。门户订阅者还可以享受令牌计费提供商 10% 的折扣。请参阅 [Nous Portal](/integrations/nous-portal)。
:::

## 目录结构

```text
~/.hermes/
├── config.yaml     # 设置（模型、终端、TTS、压缩等）
├── .env            # API 密钥和秘密信息
├── auth.json       # OAuth 提供商凭证（Nous Portal 等）
├── SOUL.md         # 主要智能体身份（系统提示中的槽位 #1）
├── memories/       # 持久化内存（MEMORY.md, USER.md）
├── skills/         # 智能体创建的技能（通过 skill_manage 工具管理）
├── cron/           # 定时任务
├── sessions/       # 网关会话
└── logs/           # 日志（errors.log, gateway.log — 秘密信息自动脱敏）
```

## 配置管理 (Managing Configuration)

```bash
hermes config              # 查看当前配置
hermes config edit         # 在编辑器中打开 config.yaml
hermes config set KEY VAL  # 设置特定值
hermes config check        # 检查缺失的选项（更新后）
hermes config migrate      # 交互式添加缺失的选项

# 示例:
hermes config set model anthropic/claude-opus-4
hermes config set terminal.backend docker
hermes config set OPENROUTER_API_KEY sk-or-...  # 保存到 .env
```

:::tip
`hermes config set` 命令会自动将值路由到正确的文件——API 密钥保存到 `.env`，其他所有内容保存在 `config.yaml` 中。
:::

## 配置优先级 (Configuration Precedence)

设置的解析顺序如下（从最高优先级开始）：

1. **CLI 参数** — 例如：`hermes chat --model anthropic/claude-sonnet-4`（每次调用覆盖）
2. **`~/.hermes/config.yaml`** — 所有非秘密设置的主要配置文件
3. **`~/.hermes/.env`** — 环境变量的后备；**必需**用于秘密信息（API 密钥、令牌、密码）
4. **内置默认值** — 当未设置任何内容时的硬编码安全默认值

:::info 经验法则 (Rule of Thumb)
秘密信息（API 密钥、机器人令牌、密码）应放在 `.env` 中。其他所有内容（模型、终端后端、压缩设置、内存限制、工具集）应放在 `config.yaml` 中。当两者都设置时，对于非秘密设置，`config.yaml` 具有更高的优先级。
:::

:::tip 组织部署 (Org deployments)
管理员可以通过系统级别的管理目录来固定标准用户无法覆盖的特定配置和秘密值。请参阅 [Managed Scope](/user-guide/managed-scope)。
:::

## 环境变量替换 (Environment Variable Substitution)

您可以使用 `${VAR_NAME}` 语法在 `config.yaml` 中引用环境变量：

```yaml
auxiliary:
  vision:
    api_key: ${GOOGLE_API_KEY}
    base_url: ${CUSTOM_VISION_URL}

delegation:
  api_key: ${DELEGATION_KEY}
```

单个值中可以包含多个引用：`url: "${HOST}:${PORT}"`。如果引用的变量未设置，则保留占位符（`${UNDEFINED_VAR}` 保持不变）。只支持 `${VAR}` 语法——裸露的 `$VAR` 不会被扩展。

有关 AI 提供商的设置（OpenRouter、Anthropic、Copilot、自定义端点、自托管 LLM、回退模型等），请参阅 [AI Providers](/integrations/providers)。

### 提供商超时 (Provider Timeouts)

您可以为提供商级别的请求超时设置 `providers.<id>.request_timeout_seconds`，同时为特定模型的覆盖设置 `providers.<id>.models.<model>.timeout_seconds`。这适用于每个传输（OpenAI-wire、原生 Anthropic、Anthropic 兼容）的主轮次客户端、回退链、凭证轮换后的重建，以及（对于 OpenAI-wire）的每次请求超时关键字——因此配置的值将覆盖旧的 `HERMES_API_TIMEOUT` 环境变量。

您还可以为非流式调用检测器设置 `providers.<id>.stale_timeout_seconds`，同时为特定模型设置 `providers.<id>.models.<model>.stale_timeout_seconds`。这会覆盖旧的 `HERMES_API_CALL_STALE_TIMEOUT` 环境变量。

不设置这些值将保留旧的默认值（`HERMES_API_TIMEOUT=1800`s, `HERMES_API_CALL_STALE_TIMEOUT=90`s, 原生 Anthropic 的 900s）。对于本地端点，未设置时非流式检测器会自动禁用，并且可以针对非常大的上下文进行扩展。目前尚未为 AWS Bedrock 配置（`bedrock_converse` 和 AnthropicBedrock SDK 路径均使用 boto3 及其自己的超时配置）。请参阅 [`cli-config.yaml.example`](https://github.com/NousResearch/hermes-agent/blob/main/cli-config.yaml.example) 中的注释示例。

## 更新行为 (Update Behavior)

`hermes update` 的设置位于 `config.yaml` 中的 `updates` 下：

```yaml
updates:
  pre_update_backup: false       # 在每次更新前创建完整的 HERMES_HOME zip
  backup_keep: 5                 # 保留多少个预更新备份 zip
  non_interactive_local_changes: stash  # stash | discard
```

对于 Git 安装，Hermes 会在检出更新分支或拉取之前自动暂存脏的跟踪文件和未跟踪的文件。交互式终端更新会提示后再恢复该暂存区。非交互式更新（桌面/聊天应用、网关或 `--yes`）使用 `updates.non_interactive_local_changes`：`stash` 在成功拉取后恢复本地源代码编辑，而 `discard` 则在成功拉取后丢弃更新创建的暂存区。仅在本地源代码编辑绝不应持续存在的管理安装上才使用 `discard`。

在此暂存步骤之前，Hermes 还会恢复 npm 安装/构建混乱遗留的跟踪 `package-lock.json` diff。在更新之前，请提交或手动暂存有意的 lockfile 编辑。

## 终端后端配置 (Terminal Backend Configuration)

Hermes 支持六种终端后端。每种都决定了智能体的 shell 命令实际在哪里执行——您的本地机器、Docker 容器、通过 SSH 的远程服务器、Modal 云沙箱（直接或通过 Nous 管理的网关）、Daytona 工作区或 Singularity/Apptainer 容器。

```yaml
terminal:
  backend: local    # local | docker | ssh | modal | daytona | singularity
  cwd: "."          # 网关/cron 工作目录 (CLI 始终使用启动目录)
  timeout: 180      # 每条命令的超时时间（秒）
  home_mode: auto   # auto | real | profile — 子进程 HOME 策略
  env_passthrough: []  # 要转发到沙箱执行的环境变量名称 (terminal + execute_code)
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"  # Singularity 后端的容器镜像
  modal_image: "nikolaik/python-nodejs:python3.11-nodejs20"                 # Modal 后端的容器镜像
  daytona_image: "nikolaik/python-nodejs:python3.11-nodejs20"               # Daytona 后端的容器镜像
```

对于 Modal 和 Daytona 等云沙箱，`container_persistent: true` 意味着 Hermes 会尝试在沙箱重建过程中保留文件系统状态。它不保证相同的实时沙箱、PID 空间或后台进程仍然存在。

### 后端概览 (Backend Overview)

| 后端 | 命令运行位置 | 隔离性 | 最适合 |
|---------|-------------------|-----------|----------|
| **local** | 直接在您的机器上运行 | 无 | 开发、个人使用 |
| **docker** | 单个持久的 Docker 容器（跨会话共享，`/new`，子智能体） | 完全 (命名空间, cap-drop) | 安全沙箱、CI/CD |
| **ssh** | 通过 SSH 在远程服务器上运行 | 网络边界 | 远程开发、高性能硬件 |
| **modal** | Modal 云沙箱 | 完全 (云 VM) | 短暂的云计算、评估 |
| **daytona** | Daytona 工作区 | 完全 (云容器) | 管理的云开发环境 |
| **singularity** | Singularity/Apptainer 容器 | 命名空间 (--containall) | HPC 集群、共享机器 |

### 本地后端 (Local Backend)

默认选项。命令直接在您的机器上运行，没有隔离。无需特殊设置。

```yaml
terminal:
  backend: local
```

默认情况下，本地工具子进程会保留您真实的操作系统用户 `HOME`。这使得外部 CLI（如 `git`, `ssh`, `gh`, `az`, `npm`, Claude Code 和 Codex）能够找到它们在正常 shell 中使用的凭证和配置。Hermes 的状态仍然通过 `HERMES_HOME` 进行配置文件限定；但 `HOME` 属性不是用于选择配置、内存、会话或技能的依据。

Hermes **不会**更改您的系统级 `HOME`、您的 shell 启动文件或操作系统账户主目录。此设置仅控制传递给 Hermes 通过 `terminal`、后台终端进程、`execute_code` 和 ACP 辅助进程启动的子进程的环境变量。

#### `terminal.home_mode`

| 模式 | 主机安装 | 容器 | 权衡 (Tradeoff) |
|---|---|---|---|
| `auto` | 保留真实的操作系统用户 `HOME` | 使用 `{HERMES_HOME}/home` | 推荐默认值。主机 CLI 继续正常工作；容器状态得以保留。 |
| `real` | 强制使用真实的操作系统用户 `HOME` | 如果可见，则强制使用真实的操作系统用户 `HOME` | 如果父进程意外地以 `HOME` 指向配置文件主目录的方式启动，则很有用。 |
| `profile` | 当存在时，使用 `{HERMES_HOME}/home` | 当存在时，使用 `{HERMES_HOME}/home` | 严格的按配置文件隔离 CLI 配置，但正常的 `~/.ssh`, `~/.gitconfig`, `~/.azure`, `~/.config/gh`, Claude/Codex 认证、npm 状态等将不可见，除非您在配置文件主目录内部初始化或链接它们。 |

默认设置的缺点是主机配置文件共享相同的正常用户级别 CLI 凭证/配置（位于 `~` 下）。如果您需要一个具有独立 Git 身份、SSH 密钥、GitHub CLI 登录、npm 配置或云 CLI 登录的配置文件，请使用 `home_mode: profile` 并有意识地在那个配置文件主目录内部初始化这些工具。

如果您有意想要严格的按配置文件工具配置隔离，请设置：

```yaml
terminal:
  home_mode: profile
```

在此模式下，工具子进程使用 `{HERMES_HOME}/home` 作为 `HOME`。Hermes 还会设置 `HERMES_REAL_HOME`，以便脚本可以在需要时找到实际的用户主目录。容器后端在 `auto` 模式下继续使用 `{HERMES_HOME}/home`，因为该目录位于持久的 Hermes 数据卷上。

需要区分配置文件状态和真实用户主目录的脚本应优先使用 `HERMES_HOME` 来指代 Hermes 数据，并使用 `HERMES_REAL_HOME` 来指代账户主目录：

```python
from pathlib import Path
import os

hermes_home = Path(os.environ["HERMES_HOME"])
real_home = Path(os.environ.get("HERMES_REAL_HOME", os.environ["HOME"]))
```

:::warning
智能体拥有与您的用户账户相同的文件系统访问权限。请使用 `hermes tools` 来禁用您不需要的工具，或切换到 Docker 进行沙箱化。
:::

### Docker 后端 (Docker Backend)

在具有安全加固（所有能力均被移除、无特权升级、PID 限制）的 Docker 容器内运行命令。

**单个持久容器，跨 Hermes 进程共享。** Hermes 在首次使用时启动一个长期运行的容器，并通过 `docker exec` 将每一次终端、文件和 `execute_code` 调用路由到同一个容器中——无论是在哪个会话、`/new` 还是 `delegate_task` 子智能体中。工作目录更改、已安装的包、`/workspace` 中的文件以及**后台进程**都会从一个工具调用延续到下一个，从一个 Hermes 进程延续到下一个。当您关闭 TUI 会话、运行 `/quit` 或启动一个新的 `hermes` 调用时，容器会继续运行，下一个 Hermes 进程通过标签查找将其重用。有关精确的终止规则，请参阅下面的**容器生命周期**。

```yaml
terminal:
  backend: docker
  docker_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  docker_mount_cwd_to_workspace: false  # 将启动目录挂载到 /workspace
  docker_run_as_host_user: false   # 参见“以主机用户身份运行容器”
  docker_forward_env:              # 要转发到容器的主机环境变量
    - "GITHUB_TOKEN"
  docker_env:                      # 要注入的字面量环境变量 (KEY=value)
    DEBUG: "1"
    PYTHONUNBUFFERED: "1"
  docker_volumes:                  # 主机目录挂载
    - "/home/user/projects:/workspace/projects"
    - "/home/user/data:/data:ro"   # :ro 表示只读
  docker_extra_args:               # 附加的、逐字追加到 `docker run` 的标志
    - "--gpus=all"
    - "--network=host"

  # 资源限制
  container_cpu: 1                 # CPU 核心数 (0 = 无限制)
  container_memory: 5120           # MB (0 = 无限制)
  container_disk: 51200            # MB (需要 XFS+pquota 的 overlay2)
  container_persistent: true       # 保留 /workspace 和 /root 绑定挂载目录

  # 跨进程容器重用（默认值符合“单个长期运行的、跨会话共享的容器”契约——参见容器生命周期）。
  docker_persist_across_processes: true   # 跨 Hermes 重启重用容器
  docker_orphan_reaper: true              # 在启动时清除废弃的 Exited 容器

  # 跨后端生命周期设置（也适用于 docker）
  timeout: 180                     # 每条命令的超时时间（秒）
  lifetime_seconds: 300            # 空闲清理窗口；也是 orphan-reaper 阈值的 2 倍
```

**`docker_env`** 与 **`docker_forward_env`**：前者注入您在配置中指定的字面量 `KEY=value` 对（这些值存在于您的 `config.yaml` 中或通过 `TERMINAL_DOCKER_ENV='{"DEBUG":"1"}'` 作为 JSON 字典传递）。后者则转发来自您的 shell 或 `~/.hermes/.env` 的值，因此实际的秘密信息永远不会出现在配置文件中。请使用 `docker_forward_env` 来处理令牌，使用 `docker_env` 来处理容器所需的静态开关。

**`terminal.docker_extra_args`**（也可以通过 `TERMINAL_DOCKER_EXTRA_ARGS='["--gpus=all"]'` 覆盖）允许您传递 Hermes 未作为一级键暴露的任意 `docker run` 标志——例如 `--gpus`、`--network`、`--add-host`、替代的 `--security-opt` 覆盖等。每个条目都必须是一个字符串；该列表会被追加到组装好的 `docker run` 调用中，以便它可以在需要时覆盖 Hermes 的默认值。请谨慎使用——与沙箱加固（能力降级、`--user`、工作区绑定挂载）冲突的标志会静默地削弱隔离性。

**要求：** 安装并运行 Docker Desktop 或 Docker Engine。Hermes 会探测 `$PATH` 以及常见的 macOS 安装位置（`/usr/local/bin/docker`, `/opt/homebrew/bin/docker`, Docker Desktop 应用包）。Podman 是开箱支持的：如果两者都已安装，请设置 `HERMES_DOCKER_BINARY=podman`（或完整路径）来强制使用它。

#### 容器生命周期 (Container lifecycle)

每个由 Hermes 管理的容器都会被打上三个标签，以便后续进程（和孤儿清理器）能够识别它：

- `hermes-agent=1` — 标记其为 Hermes 管理
- `hermes-task-id=<sanitized task_id>` — 用于任务级重用探测
- `hermes-profile=<sanitized profile name>` — 将重用和清理限定到活动的 Hermes 配置文件

在启动时，Hermes 会运行 `docker ps --filter label=hermes-task-id=<id> --filter label=hermes-profile=<profile>` 并**附加到现有容器**。如果容器处于 `exited` 状态（例如，Docker daemon 重启后），它会被 `docker start` 并重用——文件系统状态和任何已安装的包都会保留，但容器内的后台进程不会。

当一个 Hermes 进程退出时——`/quit`、关闭 TUI 会话、网关关闭，甚至 SIGKILL——清理路径对于默认模式下的容器来说是**无操作 (no-op)**。容器会继续运行。下一个 Hermes 进程会通过标签探测在毫秒级附加到它上面。这正是“单个长期运行的、跨会话共享的容器”契约所要求的：这是后台进程（npm 监视器、开发服务器、长时间运行的 pytest）能够在不同会话中存活的唯一方法。

**只有在以下情况下，容器才会被终止（停止并 `docker rm -f`）：**

| 触发条件 | 何时发生 |
|---|---|
| `docker_persist_across_processes: false` | 显式的进程级隔离。每次 `cleanup()` 都执行 `stop` + `rm -f`。匹配 pre-issue-#20561 的行为。 |
| 空闲清理器（`lifetime_seconds`，默认 300s） | 仅当 `persist_across_processes=false` 时触发。持久模式的设置是无操作的；容器会存活下来度过空闲扫描。 |
| 下一次启动时的孤儿清理器 | 会扫描比 `2 × lifetime_seconds` 更老的、带有 hermes 标签的 **Exited** 容器（默认 600s = 10 分钟），并限定到当前配置文件。**正在运行的容器永远不会被触及**——防止兄弟进程干扰。设置 `docker_orphan_reaper: false` 可禁用。 |
| 直接用户操作 | `docker rm -f`、`docker system prune`、Docker Desktop 重启。我们没有设置 `--restart=always`，因此主机重启后容器会处于 `Exited` 状态（其CoW层会保留并会在下次启动时被重用，但后台进程已消失）。 |

值得了解的边缘情况：

- **容器内 PID 1 被 OOM 杀死** 会使容器转为 `Exited`。下次重用时它会被 `docker start`；文件系统状态得以保留，但后台进程不会。
- **切换配置文件** 会隔离容器彼此之间——一个标记为 `hermes-profile=work` 的容器对运行在 `hermes-profile=research` 下的 Hermes 进程是不可见的。孤儿清理器也是按配置文件限定的，因此跨配置文件的容器不会被意外清除，但它们也不会自动清理，除非您再次以其原始配置文件启动 Hermes。

通过 `delegate_task(tasks=[...])` 派生的并行子智能体共享这一个容器——并发的 `cd`、环境变量修改和写入同一路径都会发生冲突。如果一个子智能体需要隔离的沙箱，它必须通过 `register_task_env_overrides()` 注册一个按任务划分的镜像覆盖，而 RL 和基准测试环境（TerminalBench2, HermesSweEnv 等）会为其按任务的 Docker 镜像自动完成此操作。

**安全加固：**
- `--cap-drop ALL`，只添加 `DAC_OVERRIDE`, `CHOWN`, `FOWNER`
- `--security-opt no-new-privileges`
- `--pids-limit 256`
- 为 `/tmp` (512MB)、`/var/tmp` (256MB)、`/run` (64MB) 设置大小限制的 tmpfs

**凭证转发：** `docker_forward_env` 中列出的环境变量首先从您的 shell 环境中解析，然后回退到 `~/.hermes/.env`。技能还可以声明 `required_environment_variables`，这些变量会自动合并。

#### 环境变量覆盖 (Environment variable overrides)

`terminal:` 下的每个键都有一个 `TERMINAL_<KEY_UPPERCASE>` 形式的环境变量覆盖。对于 Docker 后端最有用的包括：

| 环境变量 | 映射到 | 说明 |
|---|---|---|
| `TERMINAL_DOCKER_IMAGE` | `docker_image` | 基础镜像 |
| `TERMINAL_DOCKER_FORWARD_ENV` | `docker_forward_env` | JSON 数组: `'["GITHUB_TOKEN","OPENAI_API_KEY"]'` |
| `TERMINAL_DOCKER_ENV` | `docker_env` | JSON 字典: `'{"DEBUG":"1"}'` |
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
| `TERMINAL_LIFETIME_SECONDS` | `lifetime_seconds` | 空闲清理窗口 |
| `TERMINAL_TIMEOUT` | `timeout` | 每条命令的超时时间 |
| `HERMES_DOCKER_BINARY` | _无_ | 强制指定一个 docker/podman 二进制文件的路径 |

### SSH 后端 (SSH Backend)

在远程服务器上运行命令。使用 ControlMaster 进行连接重用（5 分钟的空闲保持活动）。默认启用持久 shell——状态（工作目录、环境变量）得以保留。

```yaml
terminal:
  backend: ssh
  persistent_shell: true           # 保留一个长期运行的 bash 会话 (默认值: true)
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
| `TERMINAL_SSH_KEY` | (系统默认) | SSH 私钥的路径 |
| `TERMINAL_SSH_PERSISTENT` | `true` | 启用持久 shell |

**工作原理：** 使用 `BatchMode=yes` 和 `StrictHostKeyChecking=accept-new` 在初始化时连接。持久 shell 会在远程主机上保持一个单一的 `bash -l` 进程存活，通过临时文件进行通信。需要 `stdin_data` 或 `sudo` 的命令会自动回退到单次执行模式。

### Modal 后端 (Modal Backend)

在 [Modal](https://modal.com) 云沙箱中运行命令。每个任务都会获得一个具有可配置 CPU、内存和磁盘的隔离 VM。文件系统可以在会话之间进行快照/恢复。

```yaml
terminal:
  backend: modal
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB (5GB)
  container_disk: 51200            # MB (50GB)
  container_persistent: true       # 快照/恢复文件系统
```

**必需：** `MODAL_TOKEN_ID` + `MODAL_TOKEN_SECRET` 环境变量，或一个 `~/.modal.toml` 配置文件。

**持久性：** 启用后，沙箱的文件系统将在清理时被快照，并在下次会话中恢复。快照保存在 `~/.hermes/modal_snapshots.json` 中。这保留了文件系统状态，而不是实时进程、PID 空间或后台任务。

**凭证文件：** 从 `~/.hermes/` 自动挂载（OAuth 令牌等），并在每次命令前同步。

### Daytona 后端 (Daytona Backend)

在 [Daytona](https://daytona.io) 管理的工作区中运行命令。支持停止/恢复以实现持久性。

```yaml
terminal:
  backend: daytona
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB → 转换为 GiB
  container_disk: 10240            # MB → 转换为 GiB (最大 10 GiB)
  container_persistent: true       # 停止/恢复而不是删除
```

**必需：** `DAYTONA_API_KEY` 环境变量。

**持久性：** 启用后，沙箱会在清理时被停止（而不是删除），并在下次会话中被恢复。沙箱名称遵循 `hermes-{task_id}` 的模式。

**磁盘限制：** Daytona 强制执行 10 GiB 的最大值。超过此值的请求会发出警告并被限制。

### Singularity/Apptainer 后端 (Singularity/Apptainer Backend)

在 [Singularity/Apptainer](https://apptainer.org) 容器中运行命令。专为 HPC 集群和共享机器设计，这些环境没有 Docker。

```yaml
terminal:
  backend: singularity
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB
  container_persistent: true       # 可写覆盖层在会话之间持久化
```

**要求：** `$PATH` 中有 `apptainer` 或 `singularity` 二进制文件。

**镜像处理：** Docker URL（`docker://...`）会自动转换为 SIF 文件并缓存。现有 `.sif` 文件会被直接使用。

**临时目录 (Scratch directory)：** 按照顺序解析：`TERMINAL_SCRATCH_DIR` → `TERMINAL_SANDBOX_DIR/singularity` → `/scratch/$USER/hermes-agent` (HPC 约定) → `~/.hermes/sandboxes/singularity`。

**隔离性：** 使用 `--containall --no-home` 实现完全的命名空间隔离，而无需挂载主机主目录。

### 通用终端后端问题 (Common Terminal Backend Issues)

如果终端命令立即失败或报告终端工具已禁用：

- **Local** — 无特殊要求。这是开始时的最安全默认选项。
- **Docker** — 运行 `docker version` 以验证 Docker 是否正常工作。如果失败，请修复 Docker 或使用 `hermes config set terminal.backend local`。
- **SSH** — 必须设置 `TERMINAL_SSH_HOST` 和 `TERMINAL_SSH_USER`。如果缺少其中任何一个，Hermes 会记录清晰的错误。
- **Modal** — 需要 `MODAL_TOKEN_ID` 环境变量或 `~/.modal.toml`。运行 `hermes doctor` 进行检查。
- **Daytona** — 需要 `DAYTONA_API_KEY`。Daytona SDK 处理服务器 URL 配置。
- **Singularity** — 需要 `$PATH` 中有 `apptainer` 或 `singularity`。在 HPC 集群上常见。

如有疑问，请将 `terminal.backend` 重新设置为 `local` 并首先验证命令是否在该后端运行。

### 终止时的远程到主机文件同步 (Remote-to-Host File Sync on Teardown)

对于 **SSH**、**Modal** 和 **Daytona** 后端（智能体的工作目录位于不同于运行 Hermes 的主机上的机器上），Hermes 会跟踪智能体在远程沙箱中修改的文件，并在会话终止/沙箱清理时，**将修改后的文件同步回主机**到 `~/.hermes/cache/remote-syncs/<session-id>/`。

- **触发条件：** 会话关闭、`/new`、`/reset`、网关消息超时、当子智能体使用远程后端时的 `delegate_task` 完成。
- **覆盖范围：** 涵盖智能体修改的整个树，而不仅仅是它明确打开的文件。添加、编辑和删除都将被捕获。
- **状态：** 远程沙箱可能在您查看时已被终止；本地 `~/.hermes/cache/remote-syncs/…` 副本是智能体所更改内容的权威记录。
- **大二进制输出：**（模型检查点、原始数据集）受大小限制——同步会跳过超过 `file_sync_max_mb`（默认 `100`）的文件。如果预计有更大的产物返回，请增加此值。

```yaml
terminal:
  file_sync_max_mb: 100     # 默认 — 同步每个不超过 100 MB 的文件
  file_sync_enabled: true   # 默认 — 设置为 false 则完全跳过同步
```

这是从瞬态云沙箱中恢复结果的方法，这些沙箱在会话结束时会被销毁，而无需告诉智能体显式地 `scp` 或 `modal volume put` 每个产物。

### Docker 卷挂载 (Docker Volume Mounts)

在使用 Docker 后端时，`docker_volumes` 允许您将主机目录与容器共享。每个条目都使用标准的 Docker `-v` 语法：`host_path:container_path[:options]`。

```yaml
terminal:
  backend: docker
  docker_volumes:
    - "/home/user/projects:/workspace/projects"   # 可读写 (默认)
    - "/home/user/datasets:/data:ro"              # 只读
    - "/home/user/.hermes/cache/documents:/output" # 网关可见的导出
```

这对于以下情况很有用：
- **向智能体提供文件**（数据集、配置、参考代码）
- **从智能体接收文件**（生成的代码、报告、导出）
- **共享工作区**（您和智能体访问相同的文件）

如果您使用消息网关，并希望智能体通过 `MEDIA:/...` 发送生成的文件，请优先选择一个专用的主机可见导出挂载点，例如 `/home/user/.hermes/cache/documents:/output`。

- 将文件写入 Docker 容器内的 `/output/...`
- 在 `MEDIA:` 中发出**主机路径**，例如：
  `MEDIA:/home/user/.hermes/cache/documents/report.txt`
- **不要**发出 `/workspace/...` 或 `/output/...`，除非该确切的路径也存在于网关进程的主机上。

:::warning
YAML 重复键名会静默地覆盖先前的键名。如果您已经有一个 `docker_volumes:` 块，请将新的挂载项合并到同一列表中，而不是在文件末尾添加另一个 `docker_volumes:` 键。
:::

也可以通过环境变量设置：`TERMINAL_DOCKER_VOLUMES='["/host:/container"]'`（JSON 数组）。

### Docker 凭证转发 (Docker Credential Forwarding)

默认情况下，Docker 终端会话不会继承任意的主机凭证。如果您需要在容器内部使用特定令牌，请将其添加到 `terminal.docker_forward_env`。

```yaml
terminal:
  backend: docker
  docker_forward_env:
    - "GITHUB_TOKEN"
    - "NPM_TOKEN"
```

Hermes 会首先从您当前的 shell 中解析每个列出的变量，然后如果它使用 `hermes config set` 保存了的话，则回退到 `~/.hermes/.env`。

:::warning
任何在 `docker_forward_env` 中列出的内容都会对容器内运行的命令可见。请只转发您愿意暴露给终端会话的凭证。
:::

### 将容器作为您的主机用户运行 (Running the Container as Your Host User)

默认情况下，Docker 容器以 `root`（UID 0）身份运行。在 `/workspace` 或其他绑定挂载中创建的文件最终由主机上的 root 所有，因此在一个会话后您必须使用 `sudo chown` 来更改所有权，然后才能从主机编辑器中编辑它们。`terminal.docker_run_as_host_user` 标志解决了这个问题：

```yaml
terminal:
  backend: docker
  docker_run_as_host_user: true   # 默认值: false
```

启用后，Hermes 会将 `--user $(id -u):$(id -g)` 追加到 `docker run` 命令中，因此写入绑定挂载目录（`/workspace`, `/root`, `docker_volumes` 中的任何内容）的文件将由您的主机用户而不是 root 所有。权衡：容器将无法再使用 `apt install` 或写入像 `/root/.npm` 这样的 root 所有路径——如果您需要两者兼备，请使用其 `HOME` 由非 root 用户拥有的基础镜像（或在镜像构建时添加所需的工具）。

保持此项为 `false`（默认值）以实现向后兼容的行为。当您的工作流程主要是“编辑挂载的主机文件”并且您厌倦了 `sudo chown -R` 时，再将其打开。

### 可选：将启动目录挂载到 `/workspace` (Mount the Launch Directory into `/workspace`)

默认情况下，Docker 沙箱是隔离的。除非您明确选择启用，否则 Hermes **不会**将您当前的宿主机工作目录传递到容器中。

在 `config.yaml` 中启用它：

```yaml
terminal:
  backend: docker
  docker_mount_cwd_to_workspace: true
```

启用后：
- 如果您从 `~/projects/my-app` 启动 Hermes，则该主机目录会被绑定挂载到 `/workspace`
- Docker 后端在 `/workspace` 中启动
- 文件工具和终端命令都看到相同的挂载项目

禁用时，除非您通过 `docker_volumes` 显式地挂载某些内容，否则 `/workspace` 将保持沙箱所有。

安全权衡：
- `false` 保留了沙箱边界
- `true` 使沙箱可以直接访问您启动 Hermes 的目录

仅当您有意希望容器在实时主机文件上工作时才使用此选项。

### 持久化 Shell (Persistent Shell)

默认情况下，每个终端命令都在自己的子进程中运行——工作目录、环境变量和 shell 变量会在命令之间重置。当启用**持久化 Shell**时，一个单一的长期运行 bash 进程会跨 `execute()` 调用保持存活，从而使状态在命令之间得以保留。

这对于 **SSH 后端** 最有用，因为它也消除了每条命令的连接开销。持久化 shell **默认对 SSH 启用**，对本地后端禁用。

```yaml
terminal:
  persistent_shell: true   # 默认值 — 为 SSH 启用持久化 Shell
```

要禁用：

```bash
hermes config set terminal.persistent_shell false
```

**跨命令保留的内容：**
- 工作目录（`cd /tmp` 对下一个命令仍然有效）
- 导出的环境变量（`export FOO=bar`）
- Shell 变量（`MY_VAR=hello`）

**优先级：**

| 级别 | 变量 | 默认值 |
|-------|----------|---------|
| 配置 | `terminal.persistent_shell` | `true` |
| SSH 覆盖 | `TERMINAL_SSH_PERSISTENT` | 遵循配置 |
| 本地覆盖 | `TERMINAL_LOCAL_PERSISTENT` | `false` |

后端环境变量具有最高优先级。如果您也希望本地后端启用持久化 Shell：

```bash
export TERMINAL_LOCAL_PERSISTENT=true
```

:::note
需要 `stdin_data` 或 sudo 的命令会自动回退到单次执行模式，因为持久化 shell 的 stdin 已经被 IPC 协议占用。
:::

有关每个后端的详细信息，请参阅 [Code Execution](features/code-execution.md) 和 [README 中的 Terminal 部分](features/tools.md)。

## 技能设置

技能可以通过其 SKILL.md 前置信息声明自己的配置设置。这些是非秘密的值（路径、偏好设置、域设置），存储在 `config.yaml` 文件中的 `skills.config` 命名空间下。

```yaml
skills:
  config:
    myplugin:
      path: ~/myplugin-data   # Example — each skill defines its own keys
```

**技能设置的工作原理：**

- `hermes config migrate` 会扫描所有启用的技能，查找未配置的设置，并提供提示。
- `hermes config show` 会显示“技能设置”下的所有技能设置及其所属的技能。
- 当一个技能加载时，其解析后的配置值会自动注入到技能上下文中。

**手动设置值：**

```bash
hermes config set skills.config.myplugin.path ~/myplugin-data
```

有关在自己的技能中声明配置设置的详细信息，请参阅 [创建技能 — 配置设置](/developer-guide/creating-skills#config-settings-configyaml)。

### 针对智能体创建的技能写入操作的保护机制

当智能体使用 `skill_manage` 来创建、编辑、补丁或删除一个技能时，Hermes 可以选择性地扫描新/更新的内容中是否存在危险的关键字模式（凭证收集、明显的提示注入、数据外泄指令）。该扫描器**默认是关闭的**——因为真实的智能体工作流程会合法地触及 `~/.ssh/` 或提到 `$OPENAI_API_KEY`，导致启发式判断过于频繁。如果你希望在智能体的技能写入发生之前进行提示，请将其重新开启：

```yaml
skills:
  guard_agent_created: true   # default: false
```

当此功能开启时，任何被标记的 `skill_manage` 写入操作都会以一个带有扫描器理由的批准提示形式显示。接受的写入操作会生效；拒绝的写入操作会向智能体返回一个解释性的错误。

### 技能写入操作的审批流程

除了上述的内容扫描之外，`skills.write_approval` 会对**所有**智能体的技能写入（创建/编辑/补丁/删除/支持文件）进行限制，需要你明确的批准——这与危险命令相同的批准/拒绝机制是一致的：

```yaml
skills:
  write_approval: false   # false = 自由写入 (默认) | true = 将每次写入操作分阶段以供审查
```

当此功能开启时，技能写入操作会被分阶段存储在 `~/.hermes/pending/skills/` 下，并通过 `/skills pending`、`/skills diff <id>`、`/skills approve <id>`、`/skills reject <id>` 等命令（通过 CLI 或任何消息平台）进行审查。可以使用 `/skills approval on|off` 在运行时切换。记忆功能具有相同的限制（见下文 `memory.write_approval`）。完整指南：[对智能体技能写入操作进行限制](/user-guide/features/skills#gating-agent-skill-writes-skillswrite_approval)。

## 记忆配置

```yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # ~800 tokens
  user_char_limit: 1375     # ~500 tokens
  write_approval: false     # true = 在任何记忆写入操作之前需要批准
```

如果设置了 `memory.write_approval: true`，则记忆写入操作在生效前需要你的批准：交互式 CLI 会提示内联；消息会话和后台的自我改进流程会将写入操作分阶段存储起来，等待 `/memory pending` → `/memory approve <id>` / `/memory reject <id>` 的审查。可以使用 `/memory approval on|off` 在运行时切换。请参阅 [控制记忆写入操作](/user-guide/features/memory#controlling-memory-writes-write_approval)。

## 上下文文件截断

控制 Hermes 从每个自动上下文文件中加载多少内容，然后再应用头部/尾部截断。这适用于注入到系统提示中的文件，例如 `SOUL.md`、`.hermes.md`、`AGENTS.md`、`CLAUDE.md` 和 `.cursorrules`。它不影响 `read_file` 工具。

```yaml
context_file_max_chars: 20000  # 默认值
```

当您故意保留较大的身份或项目上下文文件，并使用具有足够上下文窗口的模型运行时，请提高此值：

```yaml
context_file_max_chars: 25000
```

## 文件读取安全

控制单个 `read_file` 调用可以返回多少内容。超出限制的读取请求会被拒绝，并附带一个错误信息，提示智能体使用 `offset` 和 `limit` 来获取更小的范围。这可以防止一次性读取一个精简的 JS 包或大型数据文件而导致上下文窗口被淹没。

```yaml
file_read_max_chars: 100000  # 默认值 — 约 25-35K tokens
```

如果您使用的是具有大上下文窗口的模型，并且经常读取大文件，请提高此值。对于小上下文模型，请降低此值以保持读取效率：

```yaml
# 大上下文模型 (200K+)
file_read_max_chars: 200000

# 小本地模型 (16K 上下文)
file_read_max_chars: 30000
```

该智能体还会自动去重文件读取——如果同一文件区域被读取两次，而文件内容没有改变，则会返回一个轻量级的存根（stub），而不是重新发送内容。这会在上下文压缩时重置，以便智能体可以在文件的内容被总结掉后重新读取文件。

## 工具输出截断限制

三项相关的上限控制着工具在 Hermes 截断之前可以返回多少原始输出：

```yaml
tool_output:
  max_bytes: 50000        # 终端输出上限 (字符)
  max_lines: 2000         # read_file 分页限制
  max_line_length: 2000   # read_file 行号视图中的每行限制
```

- **`max_bytes`** — 当 `terminal` 命令产生超过此数量字符的组合 stdout/stderr 时，Hermes 会保留前 40% 和后 60%，并在两者之间插入一个 `[OUTPUT TRUNCATED]`（输出已截断）通知。默认值为 `50000` (≈12-15K tokens，取决于典型的分词器)。
- **`max_lines`** — 单次 `read_file` 调用 `limit` 参数的上限。高于此值的请求会被限制，以防止单次读取淹没上下文窗口。默认值为 `2000`。
- **`max_line_length`** — 当 `read_file` 发出行号视图时应用的每行上限。超过此长度的行将被截断到指定数量字符，并后跟 `... [truncated]`（已截断）。默认值为 `2000`。

对于能够承受更多原始输出的模型，请提高这些限制。对于小上下文模型，请降低它们以保持工具结果紧凑：

```yaml
# 大上下文模型 (200K+)
tool_output:
  max_bytes: 150000
  max_lines: 5000

# 小本地模型 (16K 上下文)
tool_output:
  max_bytes: 20000
  max_lines: 500
```

## 全局工具集禁用

要在一个地方抑制 CLI 和所有网关平台上的特定工具集，请在 `agent.disabled_toolsets` 下列出它们的名称：

```yaml
agent:
  disabled_toolsets:
    - memory       # 隐藏内存工具 + MEMORY_GUIDANCE 注入
    - web          # 不允许任何 web_search / web_extract
```

这在平台特定的工具配置（由 `hermes tools` 写入）**之后**生效，因此在此列出的工具集总是会被移除——即使平台的保存配置仍然包含它。当您希望有一个“全局关闭 X”的开关，而不是编辑 `hermes tools` UI 中的 15+ 个平台行时，请使用此功能。

保持列表为空或省略该键是无效操作（no-op）。

## Git 工作树隔离

启用隔离的 Git 工作树，以便在同一仓库上并行运行多个智能体：

```yaml
worktree: true    # 始终创建工作树 (与 hermes -w 相同)
# worktree: false # 默认值 — 仅当传递 -w 标志时才创建
```

启用后，每个 CLI 会话都会在 `.worktrees/` 下创建一个新的工作树，并拥有自己的分支。智能体可以编辑文件、提交、推送和创建 PR，而不会相互干扰。退出时会清除干净的工作树；脏的工作树会被保留以供手动恢复使用。

默认情况下，新的工作树分支自**新拉取的远程尖端点**（即当前分支的上游，否则为远程的默认分支）开始，而不是从本地克隆可能陈旧的 `HEAD` 开始。这使得 PR 的差异范围局限于实际更改，而不是继承本地克隆落后多少。如果需要从本地 `HEAD` 分支，请设置 `worktree_sync: false`——这在离线操作或当您故意希望以本地克隆的精确当前状态作为基础时很有用。如果无法访问远程，它会自动回退到本地 `HEAD`。

```yaml
worktree_sync: true    # 默认值 — 从已拉取的远程尖端点分支
# worktree_sync: false # 从本地 HEAD 分支 (离线/固定基础)
```

您还可以通过仓库根目录中的 `.worktreeinclude` 文件列出要复制到工作树的 gitignore 文件：

```
# .worktreeinclude
.env
.venv/
node_modules/
```

## 上下文压缩

Hermes 会自动压缩冗长的对话，以使其保持在您的模型上下文窗口内。压缩总结器是一个单独的 LLM 调用——您可以将其指向任何提供商或端点。

所有压缩设置都保存在 `config.yaml` 中（不使用环境变量）。

### 完整参考

```yaml
compression:
  enabled: true                                     # 开启/关闭压缩
  threshold: 0.50                                   # 在达到此上下文限制百分比时进行压缩
  target_ratio: 0.20                                # 保留作为近期尾部的阈值分数
  protect_last_n: 20                                # 保持不被压缩的最小最近消息数
  protect_first_n: 3                                # 跨压缩固定的非系统头部消息数 (0 = 不固定任何内容)
  hygiene_hard_message_limit: 5000                  # 网关安全阀 — 参见下文

# 总结模型/提供商在 auxiliary 下配置：
auxiliary:
  compression:
    model: ""                                       # 空值 = 使用主聊天模型。可覆盖为例如 "google/gemini-3-flash-preview" 以实现更便宜/更快的压缩。
    provider: "auto"                                # 提供商: "auto", "openrouter", "nous", "codex", "main" 等。
    base_url: null                                  # 自定义 OpenAI 兼容端点 (覆盖 provider)
```

:::info 遗留配置迁移
包含 `compression.summary_model`、`compression.summary_provider` 和 `compression.summary_base_url` 的旧配置将在首次加载时（config 版本 17）自动迁移到 `auxiliary.compression.*`。无需手动操作。
:::

`hygiene_hard_message_limit` 是网关的**预压缩安全阀**。它的存在是为了打破一个死亡螺旋：当 API 调用持续失败（session 过大）时，网关永远不会收到 token 使用量数据，因此基于 token 的阈值无法触发，对话记录就会不断增长，而连接失败会越来越严重。这个基于计数的底线会在消息计数上触发（总是已知的，无论 API 是否失败），从而强制进行压缩并恢复会话。默认值为 `5000`——远高于任何正常会话，包括那些在达到 token 阈值之前就会被压缩的、具有大上下文 (1M+) 的模型所进行的数千轮短对话。对于不寻常的平台，可以进一步提高此值；降低它以强制进行更激进的压缩。在运行中的网关上编辑此值将在下一条消息中生效（参见下文）。

`protect_first_n` 控制着跨每次压缩固定的**非系统**头部消息数量。默认值为 `3`——开场的用户/助手对话会存活下来，以使原始目标保持可见。对于开场对话已不再相关的长期滚动压缩会话，请设置 `protect_first_n: 0` 以不固定任何内容，只保留系统提示 + 总结 + 尾部。无论此设置如何，系统提示本身总是会被保留。

:::tip 网关对压缩和上下文长度的热重载
根据最近的发布版本，在运行中的网关上编辑 `model.context_length` 或 `config.yaml` 中的任何 `compression.*` 键，将在下一条消息中生效——无需重启网关，无需 `/reset`，也无需会话轮换。缓存的智能体签名包含这些键，因此当网关看到变化时，它会透明地重建智能体。API 密钥和工具/技能配置仍然需要常规的重新加载路径。
:::

### 常见设置

**默认（自动检测）— 无需配置：**
```yaml
compression:
  enabled: true
  threshold: 0.50
```
使用您的主提供商和主模型。如果希望在比主聊天模型更便宜的模型上进行压缩，请按任务覆盖（例如 `auxiliary.compression.provider: openrouter` + `model: google/gemini-2.5-flash`）。

**强制特定提供商** (基于 OAuth 或 API 密钥)：
```yaml
auxiliary:
  compression:
    provider: nous
    model: gemini-3-flash
```
可与任何提供商配合使用：`nous`、`openrouter`、`codex`、`anthropic`、`main` 等。

**自定义端点** (自托管、Ollama、zai、DeepSeek 等)：
```yaml
auxiliary:
  compression:
    model: glm-4.7
    base_url: https://api.z.ai/api/coding/paas/v4
```
指向一个自定义的 OpenAI 兼容端点。使用 `OPENAI_API_KEY` 进行身份验证。

### 三个旋钮如何相互作用

| `auxiliary.compression.provider` | `auxiliary.compression.base_url` | 结果 |
|---------------------|---------------------|--------|
| `auto` (默认) | 未设置 | 自动检测最佳可用提供商 |
| `nous` / `openrouter` / 等。 | 未设置 | 强制使用该提供商，使用其身份验证 |
| 任何 | 已设置 | 直接使用自定义端点（忽略提供商） |

:::warning 总结模型上下文长度要求
总结模型**必须**具有至少与主智能体模型一样大的上下文窗口。压缩器会将对话的完整中间部分发送给总结模型——如果该模型的上下文窗口小于主模型，那么总结调用将因上下文长度错误而失败。发生这种情况时，中间轮次将被**丢弃而不进行总结**，从而静默地丢失对话上下文。如果您覆盖了模型，请验证其上下文长度是否达到或超过您的主模型。
:::

## 上下文引擎

上下文引擎控制着在接近模型令牌限制时如何管理对话。内置的 `compressor` 引擎使用有损摘要（参见[上下文压缩](/developer-guide/context-compression-and-caching)）。插件引擎可以用替代策略替换它。

```yaml
context:
  engine: "compressor"    # default — built-in lossy summarization
```

要使用插件引擎（例如，用于无损上下文管理的 LCM）：

```yaml
context:
  engine: "lcm"          # must match the plugin's name
```

插件引擎**绝不会自动激活**——你必须显式地将 `context.engine` 设置为插件名称。可以通过 `hermes plugins` → Provider Plugins → Context Engine 来浏览和选择可用的引擎。

请参阅[内存提供者](/user-guide/features/memory-providers)，了解针对记忆插件的类似单选系统。

## 迭代预算压力

当**智能体**正在处理包含许多工具调用的复杂任务时，它可能会耗尽迭代预算（默认：90 个回合），而没有意识到预算已处于低位。预算压力会在模型接近限制时自动发出警告：

| 阈值 | 等级 | 模型看到的 |
|-----------|-------|---------------------|
| **70%** | Caution | `[BUDGET: 63/90. 27 iterations left. Start consolidating.]` |
| **90%** | Warning | `[BUDGET WARNING: 81/90. Only 9 left. Respond NOW.]` |

这些警告被注入到最后一个工具结果的 JSON 中（作为 `_budget_warning` 字段），而不是作为单独的消息——这保留了提示缓存，并且不会破坏对话结构。

```yaml
agent:
  max_turns: 90                # Max iterations per conversation turn (default: 90)
  api_max_retries: 3           # Retries per provider before fallback engages (default: 3)
```

预算压力默认是启用的。**智能体**会自然地将警告视为工具结果的一部分，从而鼓励它在耗尽迭代次数之前完成工作并给出响应。

当迭代预算完全耗尽时，CLI 会向用户显示通知：`⚠ Iteration budget reached (90/90) — response may be incomplete`。如果预算在活跃工作期间耗尽，**智能体**会在停止之前生成一份已完成工作的摘要。

`智能体.api_max_retries` 控制着 Hermes 在发生瞬态错误（速率限制、连接中断、5xx）**之前**重试提供者 API 调用的次数。默认值为 `3`——总共四次尝试。如果你配置了[故障转移提供者](/user-guide/features/fallback-providers)并希望更快地进行故障转移，可以将此值设置为 `0`，这样主端点上的第一个瞬态错误就可以立即转交给备用端点，而不是继续对不稳定端点进行重试。

### API 超时

Hermes 为流式传输和非流式调用提供了独立的超时层，并提供了一个针对非流式调用的陈旧检测器。只有当你保持这些检测器的隐式默认设置时，它们才会为本地提供者自动调整。

| 超时 | 默认值 | 本地提供者 | 配置/环境变量 |
|---------|---------|----------------|--------------|
| Socket read timeout | 120s | Auto-raised to 1800s | `HERMES_STREAM_READ_TIMEOUT` |
| Stale stream detection | 180s | Auto-disabled | `HERMES_STREAM_STALE_TIMEOUT` |
| Stale non-stream detection | 300s | Auto-disabled when left implicit | `providers.<id>.stale_timeout_seconds` 或 `HERMES_API_CALL_STALE_TIMEOUT` |
| API call (non-streaming) | 1800s | Unchanged | `providers.<id>.request_timeout_seconds` / `timeout_seconds` 或 `HERMES_API_TIMEOUT` |

**Socket read timeout** 控制着 httpx 等待从提供者接收下一个数据块的时长。本地 LLM 在处理大型上下文进行预填充之前可能需要几分钟才能生成第一个 token，因此当 Hermes 检测到本地端点时，会将其提高到 30 分钟。如果你显式设置了 `HERMES_STREAM_READ_TIMEOUT`，则该值总是被使用，无论是否检测到端点。

**Stale stream detection** 会终止接收到 SSE 心跳信号但没有实际内容的连接。这对于本地提供者是完全禁用的，因为它们在预填充期间不会发送心跳信号。

**Stale non-stream detection** 会终止那些长时间没有响应的非流式调用。默认情况下，Hermes 在本地端点上禁用此功能，以避免在长时间预填充过程中出现误报。如果你显式设置了 `providers.<id>.stale_timeout_seconds`、`providers.<id>.models.<model>.stale_timeout_seconds` 或 `HERMES_API_CALL_STALE_TIMEOUT`，则即使在本地端点上也会遵守该显式值。

## 上下文压力警告 (Context Pressure Warnings)

除了迭代预算压力外，上下文压力还追踪对话距离**压缩阈值**有多近——即系统会触发上下文压缩来总结旧消息的点。这有助于你和智能体了解对话是否变得很长。

| 进度 | 级别 | 会发生什么 |
|----------|-------|-------------|
| 到达阈值的 **≥ 60%** | 信息 (Info) | CLI 显示青色进度条；网关发送一条信息通知 |
| 到达阈值的 **≥ 85%** | 警告 (Warning) | CLI 显示一个醒目的黄色条；网关发出即将压缩的警告 |

在 CLI 中，上下文压力显示为工具输出流中的一个进度条：

```
  ◐ context ████████████░░░░░░░░ 62% to compaction  48k threshold (50%) · approaching compaction
```

在消息平台中，会发送一条纯文本通知：

```
◐ Context: ████████████░░░░░░░░ 62% to compaction (threshold: 50% of window).
```

如果禁用了自动压缩，警告将告知用户上下文可能会被截断。

上下文压力是自动的——无需配置。它纯粹作为面向用户的通知触发，不会修改消息流或向模型注入任何内容。

## 凭证池策略 (Credential Pool Strategies)

当你为同一个提供商拥有多个 API 密钥或 OAuth 令牌时，请配置轮换策略：

```yaml
credential_pool_strategies:
  openrouter: round_robin    # 平均地循环使用密钥
  anthropic: least_used      # 始终选择使用最少的密钥
```

选项包括：`fill_first`（默认）、`round_robin`、`least_used`、`random`。请参阅 [凭证池](/user-guide/features/credential-pools) 获取完整文档。

## 提示缓存 (Prompt caching)

Hermes 会自动开启跨会话的提示缓存功能，前提是活动的提供商支持该功能——无需用户配置。

对于在**原生 Anthropic**、**OpenRouter** 和 **Nous Portal** 上运行 Claude 的情况，Hermes 会在系统提示和技能块上附加 `cache_control` 断点，TTL 为 1 小时（`ttl: "1h"`）。在一个新的小时内进行的首次发送将支付完整的输入费率；同一小时内跨任何会话进行的后续发送将从缓存中拉取，享受折扣的缓存读取费率。这意味着系统提示、已加载的技能内容以及任何长上下文的早期部分都会在 `hermes` 会话和子智能体分叉（forked subagents）之间共享使用，持续一小时。

Qwen Cloud (Alibaba DashScope) 上游将缓存 TTL 限制为 5 分钟，因此 Hermes 在那里使用的是 5 分钟的断点 TTL。其他通过第三方路径访问 Claude 的方式（AWS Bedrock, Azure Foundry）则回退到提供商自身的缓存默认设置。xAI Grok 使用独立的会话固定对话 ID 机制——请参阅 [xAI 提示缓存](/integrations/providers#xai-grok--responses-api--prompt-caching)。

没有开关可以禁用此功能——缓存始终开启，即使在单轮对话中也能省钱，因为系统提示本身就占输入令牌数的很大一部分。

## 辅助模型 (Auxiliary Models)

Hermes 使用“辅助”模型来执行图像分析、网页摘要、浏览器截图分析、会话标题生成和上下文压缩等侧任务。默认情况下（`auxiliary.*.provider: "auto"`），Hermes 会将每个辅助任务路由到你的**主聊天模型**——即你在 `hermes model` 中选择的同一个提供商/模型。你无需配置任何内容即可开始使用，但请注意，对于昂贵的推理模型（Opus, MiniMax M2.7 等），辅助任务会增加可观的成本。如果你想让侧任务保持廉价和快速，而不受主模型的限制，请显式设置 `auxiliary.<task>.provider` 和 `auxiliary.<task>.model`（例如，对于视觉和网页提取使用 OpenRouter 上的 Gemini Flash）。

:::note “auto”为何使用你的主模型
早期的版本将聚合器用户（OpenRouter, Nous Portal）分配给一个廉价的提供商端默认设置。这令人惊讶——那些为聚合器订阅付费的用户会看到不同的模型处理他们的辅助流量。现在 `auto` 会对所有人使用主模型，而 `config.yaml` 中的任务级覆盖仍然有效（参见下方的 [完整辅助配置参考](#full-auxiliary-config-reference)）。
:::

### 交互式配置辅助模型 (Configuring auxiliary models interactively)

与其手动编辑 YAML，不如运行 `hermes model` 并从菜单中选择**“配置辅助模型”**。你将获得一个交互式的任务选择器：

```
$ hermes model
→ Configure auxiliary models

[ ] vision               当前: auto / 主模型
[ ] web_extract          当前: auto / 主模型
[ ] title_generation     当前: openrouter / google/gemini-3-flash-preview
[ ] tts_audio_tags       当前: auto / 主模型
[ ] compression          当前: auto / 主模型
[ ] approval             当前: auto / 主模型
[ ] triage_specifier     当前: auto / 主模型
[ ] kanban_decomposer    当前: auto / 主模型
[ ] profile_describer    当前: auto / 主模型
```

选择一个任务，选择一个提供商（OAuth 流程会打开浏览器；API 密钥提供商会提示），然后选择一个模型。更改将持久化到 `config.yaml` 中的 `auxiliary.<task>.*`。与主模型选择器相同的机制——无需学习额外的语法。

### 视频教程 (Video Tutorial)

<div style={{position: 'relative', width: '100%', aspectRatio: '16 / 9', marginBottom: '1.5rem'}}>
  <iframe
    src="https://www.youtube.com/embed/NoF-YajElIM"
    title="Hermes Agent — Auxiliary Models Tutorial"
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0}}
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

### 通用配置模式 (The universal config pattern)

Hermes 中的每个模型槽位——辅助任务、压缩、回退——都使用相同的三个旋钮：

| Key | 功能描述 | 默认值 |
|-----|-------------|---------|
| `provider` | 用于身份验证和路由的提供商 | `"auto"` |
| `model` | 要请求的模型 | 提供商的默认值 |
| `base_url` | 自定义兼容 OpenAI 的端点（覆盖提供商） | 未设置 |

当设置了 `base_url` 时，Hermes 会忽略提供商并直接调用该端点（使用 `api_key` 或 `OPENAI_API_KEY` 进行身份验证）。当只设置了 `provider` 时，Hermes 使用该提供商内置的身份验证和基础 URL。

可用于辅助任务的可用提供商包括：`auto`、`main`，以及 [提供商注册表](/reference/environment-variables) 中的任何提供商——`openrouter`、`nous`、`openai-codex`、`copilot`、`copilot-acp`、`anthropic`、`gemini`、`qwen-oauth`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`minimax-oauth`、`deepseek`、`nvidia`、`xai`、`xai-oauth`、`ollama-cloud`、`alibaba`、`bedrock`、`huggingface`、`arcee`、`xiaomi`、`kilocode`、`opencode-zen`、`opencode-go`、`azure-foundry`——或你 `custom_providers` 列表中任何命名的自定义提供商（例如，`provider: "beans"`）。

:::tip MiniMax OAuth
`minimax-oauth` 通过浏览器 OAuth 进行登录（无需 API 密钥）。运行 `hermes model` 并选择**MiniMax (OAuth)**进行身份验证。辅助任务会自动使用 `MiniMax-M2.7-highspeed`。请参阅 [MiniMax OAuth 指南](../guides/minimax-oauth.md)。
:::

:::tip xAI Grok OAuth
`xai-oauth` 通过浏览器 OAuth 为 SuperGrok 和 X Premium+ 订阅者进行登录（无需 API 密钥）。运行 `hermes model` 并选择**xAI Grok OAuth (SuperGrok / Premium+)**进行身份验证。相同的 OAuth 令牌可用于所有直接到 xAI 的界面（聊天、辅助任务、TTS、图像生成、视频生成、转录）。请参阅 [xAI Grok OAuth 指南](../guides/xai-grok-oauth.md)，如果 Hermes 在远程主机上运行，请参见 [SSH/远程主机的 OAuth](../guides/oauth-over-ssh.md)。
:::

:::warning “main”仅用于辅助任务
`"main"` 提供商选项意味着“使用我的主智能体所使用的任何提供商”——它**只**在 `auxiliary:`、`compression:` 和主要回退条目（`fallback_providers:` 或旧版 `fallback_model:`）内部有效。它**不是**你顶层 `model.provider` 设置的有效值。如果你使用自定义兼容 OpenAI 的端点，请在 `model:` 部分设置 `provider: custom`。有关所有主模型提供商选项，请参阅 [AI 提供商](/integrations/providers)。
:::

### 完整辅助配置参考 (Full auxiliary config reference)

```yaml
auxiliary:
  # 图像分析（vision_analyze 工具 + 浏览器截图）
  vision:
    provider: "auto"           # "auto", "openrouter", "nous", "codex", "main" 等。
    model: ""                  # 例如："openai/gpt-4o", "google/gemini-2.5-flash"
    base_url: ""               # 自定义兼容 OpenAI 的端点（覆盖提供商）
    api_key: ""                # base_url 的 API 密钥（回退到 OPENAI_API_KEY）
    timeout: 120               # 秒——LLM API 调用超时；视觉负载需要充足的超时时间
    download_timeout: 30       # 秒——图像 HTTP 下载；对于慢速连接请增加此值

  # 网页摘要 + 浏览器页面文本提取
  web_extract:
    provider: "auto"
    model: ""                  # 例如："google/gemini-2.5-flash"
    base_url: ""
    api_key: ""
    timeout: 360               # 秒（6分钟）——每次尝试的 LLM 摘要时间

  # 危险命令审批分类器
  approval:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30                # 秒

  # Gemini 3.1 TTS 隐藏音频标签插入
  tts_audio_tags:
    provider: "auto"
    model: ""                  # 空值 = 主聊天模型
    base_url: ""
    api_key: ""
    timeout: 30

  # 上下文压缩超时（与 compression.* 配置分开）
  compression:
    timeout: 120               # 秒——压缩总结长对话，需要更多时间
    # fallback_chain:           # 可选 — 在限速/连接失败时尝试的提供商
    #   - provider: nous
    #     model: deepseek/deepseek-chat
    #   - provider: openrouter
    #     model: google/gemini-2.5-flash
    #     base_url: ""
    #     api_key: ""

  # 自动生成的会话标题。空值表示遵循对话；设置例如 "English" 或 "Japanese" 以将标题固定在一种语言上。
  title_generation:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30
    language: ""

  # 技能中心——技能匹配和搜索
  skills_hub:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

  # MCP 工具分派
  mcp:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

  # Kanban 分类指定器 — `hermes kanban specify <id>` (或仪表板上的 Triage-column 卡片上的 ✨ Specify 按钮) 使用此槽位将一行文本扩展为具体的规范并提升任务到 `todo`。廉价快速的模型在此表现良好；规范扩展是简短的，不需要推理深度。
  triage_specifier:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 120
```

:::tip
每个辅助任务都有一个可配置的 `timeout`（以秒为单位）。默认值：vision 120s，web_extract 360s，approval 30s，compression 120s。如果使用慢速本地模型进行辅助任务，请增加这些值。Vision 还有一个单独的 `download_timeout`（默认为 30s），用于 HTTP 图像下载——对于慢速连接或自托管图像服务器，请增加此值。
:::

:::info
上下文压缩有自己的 `compression:` 块来处理阈值，还有一个 `auxiliary.compression:` 块用于模型/提供商设置——参见上方的 [上下文压缩](#context-compression)。主回退链使用顶级的 `fallback_providers:` 列表——参见 [回退提供商](/integrations/providers#fallback-providers)。这三者都遵循相同的提供商/模型/base_url 模式。
:::

### 辅助任务的回退链 (Per-task fallback chain for auxiliary tasks)

每个辅助任务都可以选择性地定义一个 `fallback_chain`——当主要的辅助提供商因限速、连接问题或付款限制而失败时，Hermes 会尝试的一系列提供商/模型条目：

```yaml
auxiliary:
  compression:
    provider: openrouter
    model: openai/gpt-4o-mini
    fallback_chain:
      - provider: nous
        model: deepseek/deepseek-chat
      - provider: openrouter
        model: google/gemini-2.5-flash
```

当主要的辅助提供商（`openrouter` / `openai/gpt-4o-mini`）返回限速、连接超时或需要付费的错误时，Hermes 会按顺序遍历 `fallback_chain`。它会跳过与已失败提供商匹配的条目，并尝试每个剩余的条目，直到有一个成功或链被耗尽。如果所有回退都失败，Hermes 将回退到主智能体模型作为最终的安全网。

每个条目都支持与任何辅助任务配置相同的三个旋钮：

| Key | 描述 |
|-----|-------------|
| `provider` | 提供商名称（`nous`、`openrouter`、`anthropic`、`gemini`、`main` 等） |
| `model` | 该提供商的模型名称 |
| `base_url` | (可选) 自定义兼容 OpenAI 的端点 |

`fallback_chain` 可用于任何辅助任务——`compression`、`vision`、`web_extract`、`approval`、`skills_hub`、`mcp` 等。

### OpenRouter 路由和 Pareto Code（帕累托代码）用于辅助任务 (OpenRouter routing & Pareto Code for auxiliary tasks)

当一个辅助任务解析到 OpenRouter 时（无论是显式指定还是通过 `provider: "main"` 而你的主智能体在 OpenRouter 上运行时），主智能体的 `provider_routing` 和 `openrouter.min_coding_score` 设置**不会传播**——这是设计使然，每个辅助任务都是独立的。要设置 OpenRouter 提供商偏好或使用 [Pareto Code 路由器](/integrations/providers#openrouter-pareto-code-router) 来为特定的辅助任务进行路由，请通过 `extra_body` 进行任务级设置：

```yaml
auxiliary:
  compression:
    provider: openrouter
    model: openrouter/pareto-code         # 对此任务使用 Pareto Code 路由器
    extra_body:
      provider:                            # OpenRouter 提供商路由偏好
        order: [anthropic, google]         # 按顺序尝试这些提供商
        sort: throughput                   # 或 "price" | "latency"
        # only: [anthropic]                # 限制为特定的提供商
        # ignore: [deepinfra]              # 排除特定的提供商
      plugins:                             # OpenRouter Pareto Code 路由器旋钮
        - id: pareto-router
          min_coding_score: 0.5            # 0.0–1.0；越高 = 代码能力越强
```

其结构反映了 OpenRouter 在聊天完成请求体中所接受的内容。Hermes 会逐字转发整个 `extra_body`，因此任何在 [openrouter.ai/docs](https://openrouter.ai/docs) 上记录的 OpenRouter 请求体字段都可以以相同的方式工作。

### 更改视觉模型 (Changing the Vision Model)

要使用 GPT-4o 而不是 Gemini Flash 进行图像分析：

```yaml
auxiliary:
  vision:
    model: "openai/gpt-4o"
```

或者通过环境变量（在 `~/.hermes/.env` 中）：

```bash
AUXILIARY_VISION_MODEL=openai/gpt-4o
```

### 提供商选项 (Provider Options)

这些选项适用于**辅助任务配置**（`auxiliary:`、`compression:`）和主要回退条目（`fallback_providers:` 或旧版 `fallback_model:`），而不适用于你的主 `model.provider` 设置。

| Provider | 描述 | 要求 |
|----------|-------------|-------------|
| `"auto"` | 可用最佳（默认）。Vision 会尝试 OpenRouter → Nous → Codex。 | — |
| `"openrouter"` | 强制使用 OpenRouter——路由到任何模型（Gemini、GPT-4o、Claude 等）。 | `OPENROUTER_API_KEY` |
| `"nous"` | 强制使用 Nous Portal | `hermes auth` |
| `"codex"` | 强制使用 Codex OAuth（ChatGPT 账户）。支持 vision (gpt-5.3-codex)。 | `hermes model` → Codex |
| `"minimax-oauth"` | 强制使用 MiniMax OAuth（浏览器登录，无需 API 密钥）。辅助任务使用 MiniMax-M2.7-highspeed。 | `hermes model` → MiniMax (OAuth) |
| `"xai-oauth"` | 强制使用 xAI Grok OAuth（浏览器登录 SuperGrok 或 X Premium+ 订阅者，无需 API 密钥）。相同的 OAuth 令牌可用于聊天、TTS、图像、视频和转录。 | `hermes model` → xAI Grok OAuth (SuperGrok / Premium+) |
| `"main"` | 使用你活动的自定义/主端点。这可以来自 `OPENAI_BASE_URL` + `OPENAI_API_KEY` 或通过 `hermes model` / `config.yaml` 保存的自定义端点。可与 OpenAI、本地模型或任何兼容 OpenAI 的 API 配合使用。**仅限辅助任务——不适用于 `model.provider`。** | 自定义端点凭证 + base URL |

主提供商目录中的直接 API 密钥提供商也在此处有效，当你希望侧任务绕过默认路由器时。一旦配置了 `GMI_API_KEY`，`gmi` 即可用：

```yaml
auxiliary:
  compression:
    provider: "gmi"
    model: "anthropic/claude-opus-4.6"
```

对于 GMI 辅助路由，请使用 GMI 的 `/v1/models` 端点返回的精确模型 ID。

### 常见配置 (Common Setups)

**使用直接自定义端点**（比 `provider: "main"` 更清晰地用于本地/自托管 API）：
```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 具有最高优先级，因此这是将辅助任务路由到特定端点的最明确方式。对于直接端点覆盖，Hermes 使用配置的 `api_key` 或回退到 `OPENAI_API_KEY`；它不会为该自定义端点重用 `OPENROUTER_API_KEY`。

**使用 OpenAI API 密钥进行视觉分析：**
```yaml
# 在 ~/.hermes/.env 中:
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_API_KEY=sk-...

auxiliary:
  vision:
    provider: "main"
    model: "gpt-4o"       # 或更便宜的 "gpt-4o-mini"
```

**使用 OpenRouter 进行视觉分析**（路由到任何模型）：
```yaml
auxiliary:
  vision:
    provider: "openrouter"
    model: "openai/gpt-4o"      # 或 "google/gemini-2.5-flash" 等。
```

**使用 Codex OAuth**（ChatGPT Pro/Plus 账户——无需 API 密钥）：
```yaml
auxiliary:
  vision:
    provider: "codex"     # 使用你的 ChatGPT OAuth 令牌
    # model 默认设置为 gpt-5.3-codex (支持 vision)
```

**使用 MiniMax OAuth**（浏览器登录，无需 API 密钥）：
```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-oauth
  base_url: https://api.minimax.io/anthropic
```
运行 `hermes model` 并选择**MiniMax (OAuth)**进行登录并自动设置。对于中国地区，基础 URL 将是 `https://api.minimaxi.com/anthropic`。请参阅 [MiniMax OAuth 指南](../guides/minimax-oauth.md) 获取完整的操作指南。

**使用本地/自托管模型：**
```yaml
auxiliary:
  vision:
    provider: "main"      # 使用你活动的自定义端点
    model: "my-local-model"
```

`provider: "main"` 使用 Hermes 用于正常聊天的任何提供商——无论是命名的自定义提供商（例如 `beans`）、内置提供商（如 `openrouter`），还是旧版的 `OPENAI_BASE_URL` 端点。

:::tip
如果你使用 Codex OAuth 作为主模型提供商，视觉分析将自动工作——无需额外配置。Codex 已包含在视觉分析的自动检测链中。
:::

:::warning
**Vision 需要多模态模型。** 如果你设置了 `provider: "main"`，请确保你的端点支持多模态/视觉——否则图像分析将会失败。
:::

### 环境变量（遗留）(Environment Variables (legacy))

辅助模型也可以通过环境变量进行配置。然而，`config.yaml` 是首选方法——它更容易管理并支持所有选项，包括 `base_url` 和 `api_key`。

| 设置 | 环境变量 |
|---------|---------------------|
| Vision provider | `AUXILIARY_VISION_PROVIDER` |
| Vision model | `AUXILIARY_VISION_MODEL` |
| Vision endpoint | `AUXILIARY_VISION_BASE_URL` |
| Vision API key | `AUXILIARY_VISION_API_KEY` |
| Web extract provider | `AUXILIARY_WEB_EXTRACT_PROVIDER` |
| Web extract model | `AUXILIARY_WEB_EXTRACT_MODEL` |
| Web extract endpoint | `AUXILIARY_WEB_EXTRACT_BASE_URL` |
| Web extract API key | `AUXILIARY_WEB_EXTRACT_API_KEY` |

压缩和回退模型设置仅限 `config.yaml`。

:::tip
运行 `hermes config` 查看你当前的辅助模型设置。覆盖项只在它们与默认值不同时才会显示。
:::

## 思考投入 (Reasoning Effort)

控制模型在响应之前进行多少“思考”：

```yaml
agent:
  reasoning_effort: ""   # 空值 = 中等（默认）。选项：none, minimal, low, medium, high, xhigh (最大)
```

当未设置时（默认），思考投入默认为“中等”——这是一个适用于大多数任务的平衡水平。设置一个值会覆盖它——更高的思考投入可以在更复杂的任务上获得更好的结果，但代价是更多的令牌和延迟。

:::note 适应性思考模型 (Adaptive-thinking models) (Claude 4.6+、Fable/Mythos级) 与 OpenRouter 的区别
这些模型使用*自适应*思考，不接受常规的 `reasoning.effort` 字段——OpenRouter 会忽略它。Hermes 会透明地将您的 `reasoning_effort` 路由到 OpenRouter 的 `verbosity` 参数（该参数映射到 Anthropic 的 `output_config.effort`），因此相同的 `low`/`medium`/`high`/`xhigh` 开关仍然有效——无需额外的配置。`none`（或未设置）将模型保留在其自身的自适应默认状态上。（`max` 在底层是可接受的，但它不是一个可选的 `reasoning_effort` 值；`xhigh` 是可配置的上限。）原生的 Anthropic 提供商已经直接控制了投入度，因此不受影响。
:::

您也可以使用 `/reasoning` 命令在运行时更改思考投入：

```
/reasoning           # 显示当前的投入水平和状态
/reasoning high      # 将思考投入设置为高
/reasoning none      # 禁用思考
/reasoning show      # 在每个响应上方显示模型的思考过程
/reasoning hide      # 隐藏模型的思考过程
```

## 工具使用强制执行 (Tool-Use Enforcement)

有些模型偶尔会将预期的操作描述为文本，而不是实际调用工具（例如，不是真正调用终端而是说“我将运行测试……”）。工具使用强制执行会注入系统提示指导，引导模型回到实际调用工具。

```yaml
agent:
  tool_use_enforcement: "auto"   # "auto" | true | false | ["model-substring", ...]
```

| 值 | 行为 |
|-------|----------|
| `"auto"` (默认) | 对匹配的模型启用：`gpt`, `codex`, `gemini`, `gemma`, `grok`。对所有其他模型（Claude, DeepSeek, Qwen 等）禁用。 |
| `true` | 始终启用，无论模型如何。如果注意到当前模型描述操作而不是执行操作，则很有用。 |
| `false` | 始终禁用，无论模型如何。 |
| `["gpt", "codex", "qwen", "llama"]` | 仅当模型名称包含列出的任一子字符串时才启用（不区分大小写）。 |

### 它注入了什么

当启用时，可能会添加三层指导：

1. **通用工具使用强制执行** (所有匹配的模型) — 指导模型立即进行工具调用，而不是描述意图；保持工作直到任务完成，并且绝不在一个回合中以未来行动的承诺结束。
2. **OpenAI 执行纪律** (仅限 GPT 和 Codex 模型) — 额外的指导，解决了 GPT 特定的故障模式：在部分结果上放弃工作、跳过先决条件查找、幻觉而不是使用工具，以及在没有验证的情况下声明“完成”。
3. **Google 操作指南** (仅限 Gemini 和 Gemma 模型) — 简洁性、绝对路径、并行工具调用和先编辑前验证的模式。

这些内容对用户是透明的，只影响系统提示。那些已经可靠使用工具的模型（如 Claude）不需要此指导，这就是为什么 `"auto"` 会排除它们的原因。

### 何时开启它

如果您使用的是不在默认自动列表中的模型，并且注意到它经常描述它*将要*做什么而不是实际去做，请设置 `tool_use_enforcement: true` 或将模型子字符串添加到列表中：

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
    voice: "en-US-AriaNeural"   # 322种声音，74种语言
    speed: 1.0                  # 速度乘数（转换为速率百分比，例如 1.5 → +50%）
  elevenlabs:
    voice_id: "pNInz6obpgDQGcFmaJgB"
    model_id: "eleven_multilingual_v2"
  openai:
    model: "gpt-4o-mini-tts"
    voice: "alloy"              # alloy, echo, fable, onyx, nova, shimmer
    speed: 1.0                  # 速度乘数（由 API 限制在 0.25–4.0 之间）
    base_url: "https://api.openai.com/v1"  # OpenAI 兼容 TTS 端点的覆盖设置
  minimax:
    speed: 1.0                  # 语音速度乘数
    # base_url: ""              # 可选：OpenAI 兼容 TTS 端点的覆盖设置
  mistral:
    model: "voxtral-mini-tts-2603"
    voice_id: "c69964a6-ab8b-4f8a-9465-ec0925096ec8"  # Paul - Neutral (默认)
  gemini:
    model: "gemini-2.5-flash-preview-tts"   # 或 gemini-3.1-flash-tts-preview
    voice: "Kore"               # 30种预构建声音：Zephyr, Puck, Kore, Enceladus 等。
    audio_tags: false           # Gemini 3.1 TTS 音频标签插入（隐藏）
    persona_prompt_file: ""      # 可选的包含 Gemini 声音指导的 Markdown/文本文件
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

这控制着 `text_to_speech` 工具和语音模式下的回复（CLI 中的 `/voice tts` 或消息网关）。

**速度回退层级：** 提供商特定的速度（例如 `tts.edge.speed`）→ 全局 `tts.speed` → `1.0` 默认值。设置全局 `tts.speed` 以在所有提供商之间应用统一的速度，或者为精细控制而覆盖每个提供商的设置。

## 显示设置

```yaml
display:
  tool_progress: all      # off | new | all | verbose
  tool_progress_command: false  # 在消息网关中启用 /verbose 斜杠命令
  platforms: {}           # 每个平台的显示覆盖设置（见下文）
  tool_progress_overrides: {}  # 已弃用 — 请使用 display.platforms
  interim_assistant_messages: true  # 网关：将自然的中途助手更新作为单独的消息发送
  skin: default           # 内置或自定义 CLI 皮肤（见用户指南/功能/皮肤）
  personality: "kawaii"  # 仍然显示在某些摘要中的旧式美学字段
  compact: false          # 紧凑输出模式（更少的空白）
  resume_display: full    # full (恢复时显示以前的消息) | minimal (仅单行)
  bell_on_complete: false # 当智能体完成任务时播放终端铃声（对于长时间任务非常有用）
  show_reasoning: false   # 在每个回复上方显示模型的推理/思考过程（使用 /reasoning show|hide 切换）
  streaming: false        # 实时输出，将令牌流式传输到终端
  show_cost: false        # 在 CLI 状态栏中显示估计的 $ 成本
  timestamps: false       # 如果为 true，则在 CLI/TUI 文本记录中用 [HH:MM] 时间戳为用户和助手的标签添加前缀
  tool_preview_length: 0  # 工具调用预览的最大字符数（0 = 无限制，显示完整的路径/命令）
  runtime_footer:         # 网关：向最终回复附加运行时上下文页脚
    enabled: false
    fields: ["model", "context_pct", "cwd"]
  file_mutation_verifier: true    # 当 write_file/patch 调用失败时，附加一个警告性页脚（该调用未被对同一路径的成功写入所取代）
  credits_notices: true   # Nous 信用状态栏通知（使用量、已授予额度、耗尽）。false = 静音；/usage 仍然有效
  language: en            # 用于静态消息（批准提示、某些网关回复）的 UI 语言。en | zh | zh-hant | ja | de | es | fr | tr | uk | af | ko | it | ga | pt | ru | hu
```

### 文件变更验证器 (File-mutation verifier)

当 `display.file_mutation_verifier` 为 `true`（默认）时，如果一个 `write_file` 或 `patch` 调用在当前轮次中失败，并且从未被对同一路径的成功写入所取代，Hermes 就会向助手的最终回复附加一行警告。这可以捕获“批量并行补丁，一半静默失败，模型总结成功”这一类过度声明的情况，而无需您在每次编辑后手动运行 `git status`。

示例页脚：

```
⚠️ 文件变更验证器：尽管上方可能有其他措辞，但本轮次仍有 3 个文件未被修改。请运行 `git status` 或 `read_file` 进行确认。
  • concepts/automatic-organization.md — [patch] 未找到 old_string 的匹配项
  • concepts/lora.md — [patch] 未找到 old_string 的匹配项
  • concepts/rag-pipeline.md — [patch] 未找到 old_string 的匹配项
```

设置 `file_mutation_verifier: false`（或 `HERMES_FILE_MUTATION_VERIFIER=0`）以抑制此页脚。该验证器仅在轮次结束时仍有实际失败时才会触发——一个重试了失败补丁并在同一轮次中成功的模型不会对其文件触发它。

### 静态消息的 UI 语言 (UI language for static messages)

`display.language` 设置翻译一小部分静态的用户界面消息——CLI 的批准提示、少数网关斜杠命令回复（例如重启-排水通知、“批准已过期”、“目标已清除”）。它**不**翻译智能体的回复、日志行、工具输出、错误回溯或斜杠命令描述——这些内容仍保持英文。如果您希望智能体本身以另一种语言回复，只需在提示或系统消息中告诉它即可。

支持的值：`en`（默认）、`zh`（简体中文）、`zh-hant`（繁体中文）、`ja`（日语）、`de`（德语）、`es`（西班牙语）、`fr`（法语）、`tr`（土耳其语）、`uk`（乌克兰语）、`af`（阿非利卡语）、`ko`（韩语）、`it`（意大利语）、`ga`（爱尔兰语）、`pt`（葡萄牙语）、`ru`（俄语）、`hu`（匈牙利语）。未知值将回退到英文。

您也可以使用 `HERMES_LANGUAGE` 环境变量在每个会话中设置此项，它会覆盖配置值。

```yaml
display:
  language: zh   # CLI 批准提示以中文显示
```

| 模式 | 您看到的内容 |
|------|-------------|
| `off` | 静音——只有最终回复 |
| `new` | 仅在工具发生变化时才显示工具指示器 |
| `all` | 所有工具调用及其简短预览（默认） |
| `verbose` | 完整的参数、结果和调试日志 |

在 CLI 中，使用 `/verbose` 循环切换这些模式。要在消息平台（Telegram、Discord、Slack 等）中使用 `/verbose`，请在上面的 `display` 部分中设置 `tool_progress_command: true`。该命令将循环切换模式并保存到配置中。

工具进度需要一个能够安全显示进度更新的网关适配器。没有消息编辑支持的平台（包括 Signal）即使 `/verbose` 保存了非 `off` 模式，也会抑制工具进度气泡。

### 运行时元数据页脚（仅限网关）(Runtime-metadata footer (gateway only))

当 `display.runtime_footer.enabled: true` 时，Hermes 会向每个网关轮次的**最终**消息附加一个小的运行时上下文页脚。当前的页脚可以显示模型、上下文窗口百分比和当前工作目录。默认禁用；如果您的团队希望每次回复都包含此来源信息，则选择启用。

```yaml
display:
  runtime_footer:
    enabled: true
    fields: ["model", "context_pct", "cwd"]   # 支持的字段：model, context_pct, cwd
```

`/footer` 斜杠命令可以在任何会话中运行时切换此功能。

附加到 Telegram/Discord/Slack 回复函中的示例页脚：

```
— claude-opus-4.7 · 12 次工具调用 · 2m 14s · $0.042
```

只有轮次的**最终**消息会带有此页脚；中间更新保持干净。

### 每个平台的进度覆盖设置 (Per-platform progress overrides)

不同的平台有不同的详细程度需求。使用 `display.platforms` 来设置每个平台的模式：

```yaml
display:
  tool_progress: all          # 全局默认值
  platforms:
    signal:
      tool_progress: 'off'    # Signal 目前无法显示工具进度气泡
    telegram:
      tool_progress: verbose  # Telegram 上的详细进度
    slack:
      tool_progress: 'off'    # 在共享的 Slack 工作区中保持安静
```

没有覆盖设置的平台将回退到全局 `tool_progress` 值。有效的平台键包括：`telegram`, `discord`, `slack`, `signal`, `whatsapp`, `matrix`, `mattermost`, `email`, `sms`, `homeassistant`, `dingtalk`, `feishu`, `wecom`, `weixin`, `bluebubbles`, `qqbot`。旧的 `display.tool_progress_overrides` 键仍然用于向后兼容，但已被弃用并迁移到 `display.platforms` 中。

Signal 被列为有效的平台键，因为该设置可以按平台保存，但当前的 Signal 适配器无法编辑已发送消息且不会渲染工具进度气泡。请将 Signal 的 `tool_progress` 设置为 `off`；如果您需要实时查看每个工具调用，请使用 CLI 或具有编辑功能的消息平台。

`interim_assistant_messages` 是网关独有的功能。启用后，Hermes 会将完成的中途助手更新作为单独的聊天消息发送。这独立于 `tool_progress` 并且不需要网关流式传输。

## 隐私

```yaml
privacy:
  redact_pii: false  # Strip PII from LLM context (gateway only)
```

当 `redact_pii` 为 `true` 时，网关会在将提示发送到支持的LLM之前，从系统提示中剥离个人身份信息：

| 字段 | 处理方式 |
|-------|-----------|
| 电话号码（WhatsApp/Signal上的用户ID） | 哈希处理为 `user_<12-char-sha256>` |
| 用户ID | 哈希处理为 `user_<12-char-sha256>` |
| 聊天ID | 数字部分哈希，保留平台前缀 (`telegram:<hash>`) |
| 家庭频道ID | 数字部分哈希 |
| 用户名/昵称 | **不受影响** (由用户选择，公开可见) |

**平台支持：** 红审适用于WhatsApp、Signal和Telegram。Discord和Slack被排除在外，因为它们的提及系统（`<@user_id>`）要求在LLM上下文中保留真实ID。

哈希是确定性的——同一个用户总是映射到相同的哈希，因此模型仍可以在群聊中区分不同的用户。路由和交付在内部使用原始值。

## 语音转文本 (STT)

```yaml
stt:
  provider: "local"            # "local" | "groq" | "openai" | "mistral"
  local:
    model: "base"              # tiny, base, small, medium, large-v3
  openai:
    model: "whisper-1"         # whisper-1 | gpt-4o-mini-transcribe | gpt-4o-transcribe
  # model: "whisper-1"         # Legacy fallback key still respected
```

提供商行为：

- `local` 使用在您的机器上运行的 `faster-whisper`。请单独使用 `pip install faster-whisper` 进行安装。
- `groq` 使用 Groq 的 Whisper 兼容端点，并读取 `GROQ_API_KEY`。
- `openai` 使用 OpenAI 语音 API 并读取 `VOICE_TOOLS_OPENAI_KEY`。

如果请求的提供商不可用，Hermes 将按以下顺序自动回退：`local` → `groq` → `openai`。

Groq 和 OpenAI 的模型覆盖是基于环境变量的：

```bash
STT_GROQ_MODEL=whisper-large-v3-turbo
STT_OPENAI_MODEL=whisper-1
GROQ_BASE_URL=https://api.groq.com/openai/v1
STT_OPENAI_BASE_URL=https://api.openai.com/v1
```

## Voice Mode (CLI)

```yaml
voice:
  record_key: "ctrl+b"         # Push-to-talk key inside the CLI
  max_recording_seconds: 120    # Hard stop for long recordings
  auto_tts: false               # Enable spoken replies automatically when /voice on
  beep_enabled: true            # Play record start/stop beeps in CLI voice mode
  silence_threshold: 200        # RMS threshold for speech detection
  silence_duration: 3.0         # Seconds of silence before auto-stop
```

在 CLI 中使用 `/voice on` 来启用麦克风模式，使用 `record_key` 来开始/停止录音，并使用 `/voice tts` 来切换语音回复。有关端到端的设置和特定平台的行为，请参阅 [Voice Mode](/user-guide/features/voice-mode)。

## Streaming

将流式令牌发送到终端或消息平台，而不是等待完整的响应。

### CLI Streaming

```yaml
display:
  streaming: true         # Stream tokens to terminal in real-time
  show_reasoning: true    # Also stream reasoning/thinking tokens (optional)
```

启用后，响应会以令牌为单位显示在一个流式框中。工具调用仍然是静默捕获的。如果提供者不支持流式传输，它会自动回退到正常的显示模式。

### Gateway Streaming (Telegram, Discord, Slack)

```yaml
streaming:
  enabled: true           # Enable progressive message editing
  transport: edit         # "edit" (progressive message editing) or "off"
  edit_interval: 0.3      # Seconds between message edits
  buffer_threshold: 40    # Characters before forcing an edit flush
  cursor: " ▉"            # Cursor shown during streaming
  fresh_final_after_seconds: 0    # Opt in to fresh final (Telegram) when preview is this old
```

启用后，机器人会在第一个令牌时发送一条消息，然后随着更多令牌的到达而逐步编辑它。不支持消息编辑的平台（Signal、Email、Home Assistant）将在首次尝试时自动检测到——对于该会话，流式传输会被优雅地禁用，不会产生大量消息。

如果需要单独的自然中途助手更新（而不是进行渐进式令牌编辑），请设置 `display.interim_assistant_messages: true`。

**溢出处理：** 如果流式传输的文本超过平台的消息长度限制（~4096 字符），则当前消息被最终确定，并自动开始一条新消息。

**Fresh final (Telegram)：** Telegram 的 `editMessageText` 保留原始消息的时间戳，因此一个长时间运行的流式回复即使在完成之后也会保留第一个令牌的时间戳。设置 `fresh_final_after_seconds > 0` 可以选择接收旧预览作为全新的最终消息，并进行最佳努力的预览删除。默认值是 `0`，它始终在原地最终确定流式回复，避免了客户端显示这两种操作时出现的短暂重复消息/删除序列。

:::note Per-platform streaming defaults
主开关 `streaming.enabled` 默认为 `false` — 直到你将其翻转，没有任何内容会流式传输。一旦启用，流式传输是**按平台划分的**：Telegram 默认带有 `display.platforms.telegram.streaming: true`（支持流式传输），而 Discord 带有 `display.platforms.discord.streaming: false`（不支持）。因此，在启用流式传输后，Telegram 开箱即用；而 Discord 则保持全消息回复，直到你更改其开关。你可以从仪表板的**Channels**开关或直接在 `~/.hermes/config.yaml` 中调整这些平台特定的开关。
:::

## Group Chat Session Isolation

限制 CLI、TUI/dashboard 和消息网关之间可以同时打开多少个聊天会话：

```yaml
max_concurrent_sessions: null  # null/0 = unlimited; positive integer = active session cap
```

当达到上限时，Hermes 会为新会话返回一个直接的限制消息。
现有的活动会话保持正常行为。

规范的键是顶层的 `max_concurrent_sessions`。Hermes 也接受 `gateway.max_concurrent_sessions` 作为备用选项，但如果两者都设置了，则以顶层键为准。

该上限是通过本地运行时租约文件强制执行的，属于最佳努力：如果注册表无法读取或锁定，Hermes 会“失败开放”（fail open），以确保用户不会被困住。它旨在用于单个主机/配置文件运行时，而不是跨多台机器挂载共享的 `$HERMES_HOME`。

控制共享聊天是保持每个房间一个对话还是保持每个参与者一个对话：

```yaml
group_sessions_per_user: true  # true = groups/channels 中的用户隔离, false = 每个聊天一个共享会话
```

- `true` 是默认且推荐的设置。在 Discord 频道、Telegram 群组、Slack 频道和类似的共享上下文中，当平台提供用户 ID 时，每个发送者都会获得自己的会话。
- `false` 回退到旧的共享房间行为。如果你明确希望 Hermes 将一个频道视为一次协作对话，这可能是有用的，但这同时也意味着用户共享上下文、令牌成本和中断状态。
- 私聊（Direct Messages）不受影响。Hermes 仍然按聊天/DM ID 来键控私聊，如常。
- 无论如何，线程都与其父频道保持隔离；如果设置为 `true`，每个参与者在线程内也会获得自己的会话。

有关行为细节和示例，请参阅 [Sessions](/user-guide/sessions) 和 [Discord guide](/user-guide/messaging/discord)。

## Unauthorized DM Behavior

控制当未知用户发送私信时，Hermes 的行为：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `pair` 是聊天式 DM 平台的默认设置。Hermes 会拒绝访问，但会在 DM 中回复一个一次性配对代码。
- `ignore` 会静默丢弃未经授权的 DM。
- Email 默认为 `ignore`，除非设置了 `platforms.email.unauthorized_dm_behavior: pair`，因为收件箱可能包含不相关的未读邮件。
- 平台部分会覆盖全局默认值，因此你可以保持广泛启用配对功能，同时让某个特定平台更安静一些。

## Quick Commands

定义自定义命令，这些命令要么在不调用 LLM 的情况下运行 Shell 命令，要么将一个斜杠命令别名到另一个命令。执行快速命令是零令牌的，对于来自消息平台（Telegram、Discord 等）进行快速服务器检查或实用脚本非常有用。

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

使用方法：在 CLI 或任何消息平台中输入 `/status`、`/disk`、`/update`、`/gpu` 或 `/restart`。`exec` 命令在主机上本地运行并直接返回输出——不调用 LLM，不消耗令牌。`alias` 命令重写到配置的斜杠命令目标。

- **30 秒超时** — 长时间运行的命令会被错误消息杀死
- **优先级** — 快速命令会在技能命令之前被检查，因此你可以覆盖技能名称
- **自动补全** — 快速命令在分派时解析，不会显示在内置的斜杠命令自动补全表中
- **类型** — 支持的类型是 `exec` 和 `alias`；其他类型会显示错误
- **处处可用** — CLI, Telegram, Discord, Slack, WhatsApp, Signal, Email, Home Assistant

仅包含字符串的提示快捷方式不是有效的快速命令。对于可重用的提示工作流程，请创建一个技能或别名到现有斜杠命令。

## Human Delay

在消息平台中模拟类人的响应节奏：

```yaml
human_delay:
  mode: "off"                  # off | natural | custom
  min_ms: 800                  # Minimum delay (custom mode)
  max_ms: 2500                 # Maximum delay (custom mode)
```

## Code Execution

配置 `execute_code` 工具：

```yaml
code_execution:
  mode: project                # project (default) | strict
  timeout: 300                 # Max execution time in seconds
  max_tool_calls: 50           # Max tool calls within code execution
```

**`mode`** 控制脚本的工作目录和 Python 解释器：

- **`project`** (默认) — 脚本在会话的工作目录中运行，使用活动虚拟环境/conda 环境的 python。项目依赖（`pandas`、`torch`、项目包）和相对路径（`.env`、`./data.csv`）自然解析，与 `terminal()` 所看到的保持一致。
- **`strict`** — 脚本在临时暂存目录中运行，使用 `sys.executable` (Hermes 自身的 python)。最大限度地保证可复现性，但项目依赖和相对路径将无法解析。

环境清理（去除 `*_API_KEY`、`*_TOKEN`、`*_SECRET`、`*_PASSWORD`、`*_CREDENTIAL`、`*_PASSWD`、`*_AUTH`）和工具白名单在两种模式下都相同地适用——切换模式不会改变安全态势。

## Web Search Backends

`web_search` 和 `web_extract` 工具支持五个后端提供者。请在 `config.yaml` 或通过 `hermes tools` 配置后端：

```yaml
web:
  backend: firecrawl    # firecrawl | searxng | parallel | tavily | exa

  # Or use per-capability keys to mix providers (e.g. free search + paid extract):
  search_backend: "searxng"
  extract_backend: "firecrawl"
```

| Backend | Env Var | Search | Extract |
|---------|---------|--------|---------|
| **Firecrawl** (default) | `FIRECRAWL_API_KEY` | ✔ | ✔ |
| **SearXNG** | `SEARXNG_URL` | ✔ | — |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ |

**后端选择：** 如果未设置 `web.backend`，则会根据可用的 API 密钥自动检测后端。如果只设置了 `SEARXNG_URL`，则使用 SearXNG。如果只设置了 `EXA_API_KEY`，则使用 Exa。如果只设置了 `TAVILY_API_KEY`，则使用 Tavily。如果只设置了 `PARALLEL_API_KEY`，则使用 Parallel。否则 Firecrawl 为默认选项。

**SearXNG** 是一个免费、自托管、尊重隐私的元搜索引擎，可以查询 70+ 个搜索引擎。无需 API 密钥——只需将 `SEARXNG_URL` 设置为你的实例（例如 `http://localhost:8080`）。SearXNG 仅用于搜索；`web_extract` 需要一个单独的提取提供者（设置 `web.extract_backend`）。有关 Docker 设置说明，请参阅 [Web Search setup guide](/user-guide/features/web-search)。

**自托管 Firecrawl：** 将 `FIRECRAWL_API_URL` 设置为指向你自己的实例。当设置了自定义 URL 时，API 密钥变为可选（在服务器上设置 `USE_DB_AUTHENTICATION=***` 可禁用身份验证）。

**Parallel 搜索模式：** 设置 `PARALLEL_SEARCH_MODE` 来控制搜索行为——`fast`、`one-shot` 或 `agentic`（默认值：`agentic`）。

**Exa：** 在 `~/.hermes/.env` 中设置 `EXA_API_KEY`。支持 `category` 过滤（`company`、`research paper`、`news`、`people`、`personal site`、`pdf`）和域名/日期过滤器。

## 浏览器

配置浏览器自动化行为：

```yaml
browser:
  inactivity_timeout: 120        # 秒，在闲置会话自动关闭之前的时间
  command_timeout: 30             # 用于浏览器命令（截图、导航等）的超时时间（秒）
  record_sessions: false         # 是否将浏览器会话作为 WebM 视频自动录制到 ~/.hermes/browser_recordings/
  # 可选的 CDP 覆盖设置 — 设置后，Hermes 会直接附加到您自己的
  # Chromium 系列浏览器（通过 /browser connect），而不是启动一个无头浏览器。
  cdp_url: ""
  # 对话框监督者 — 控制当连接了 CDP 后端（Browserbase、本地 Chromium 系列
  # 浏览器通过 /browser connect）时，原生 JS 对话框（alert / confirm / prompt）如何处理。在 Camofox 和默认的本地智能体浏览器模式下被忽略。
  dialog_policy: must_respond    # must_respond | auto_dismiss | auto_accept
  dialog_timeout_s: 300          # 在必须响应模式下的安全自动关闭时间（秒）
  camofox:
    managed_persistence: false   # 如果为 true，Camofox 会话将跨重启保留 cookies/登录信息
    user_id: ""                  # 可选的外部管理的 Camofox userId
    session_key: ""              # Hermes 创建标签页时发送的可选会话密钥
    adopt_existing_tab: false    # 在创建新标签页之前，是否重用现有标签页
```

**对话框策略：**

- `must_respond` (默认) — 捕获对话框，将其显示在 `browser_snapshot.pending_dialogs` 中，并等待智能体调用 `browser_dialog(action=...)`。如果在 `dialog_timeout_s` 秒内没有响应，对话框将被自动关闭，以防止页面的 JS 线程永远卡住。
- `auto_dismiss` — 捕获后立即关闭。之后，智能体仍可在 `browser_snapshot.recent_dialogs` 中看到带有 `closed_by="auto_policy"` 的对话框记录。
- `auto_accept` — 捕获后立即接受。对于具有激进 `beforeunload` 提示的页面特别有用。

请参阅 [浏览器功能页面](./features/browser.md#browser_dialog) 以了解完整的对话框工作流程。

浏览器工具集支持多个提供者。有关 Browserbase、浏览器使用和本地 Chromium 系列 CDP 设置的详细信息，请参阅 [浏览器功能页面](/user-guide/features/browser)。

## 时区

使用 IANA 时区字符串覆盖服务器本地时区。这会影响日志中的时间戳、cron 调度以及系统提示时间注入。

```yaml
timezone: "America/New_York"   # IANA 时区（默认："" = 服务器本地时间）
```

支持的值：任何 IANA 时区标识符（例如 `America/New_York`、`Europe/London`、`Asia/Kolkata`、`UTC`）。留空或省略则使用服务器本地时间。

## Discord

为消息网关配置特定于 Discord 的行为：

```yaml
discord:
  require_mention: true          # Require @mention to respond in server channels
  free_response_channels: ""     # Comma-separated channel IDs where bot responds without @mention
  auto_thread: true              # Auto-create threads on @mention in channels
```

- `require_mention` — 当设置为 `true` (默认)，机器人仅在被 `@BotName` 提及的服务器频道中响应。私信（DMs）始终无需提及即可工作。
- `free_response_channels` — 机器人对所有消息进行回复，而无需要求提及的频道 ID 逗号分隔列表。
- `auto_thread` — 当设置为 `true` (默认)，频道中的提及会自动创建一个线程用于对话，保持频道整洁（类似于 Slack 的线程功能）。

## Security

执行前的安全扫描和秘密信息脱敏：

```yaml
security:
  redact_secrets: true           # Redact API key patterns in tool output and logs (on by default)
  tirith_enabled: true           # Enable Tirith security scanning for terminal commands
  tirith_path: "tirith"          # Path to tirith binary (default: "tirith" in $PATH)
  tirith_timeout: 5              # Seconds to wait for tirith scan before timing out
  tirith_fail_open: true         # Allow command execution if tirith is unavailable
  website_blocklist:             # See Website Blocklist section below
    enabled: false
    domains: []
    shared_files: []
```

- `redact_secrets` — 当设置为 `true` 时，会在工具输出和日志中自动检测并脱敏看起来像 API 密钥、令牌和密码的模式。**默认开启**。仅在需要原始凭证字符串进行调试或脱敏器开发时才显式设置为 `false`。
- `tirith_enabled` — 当设置为 `true` 时，终端命令会在执行前被 [Tirith](https://github.com/sheeki03/tirith) 扫描，以检测潜在的危险操作。
- `tirith_path` — Tirith 二进制文件的路径。如果 Tirith 安装在非标准位置，请设置此项。
- `tirith_timeout` — 等待 Tirith 扫描的最大秒数。如果扫描超时，命令仍会继续执行。
- `tirith_fail_open` — 当设置为 `true` (默认) 时，即使 Tirith 不可用或失败，也会允许命令执行。将其设置为 `false` 可在 Tirith 无法验证命令时阻止命令执行。

## Website Blocklist

阻止智能体（agent）的网页和浏览器工具访问特定域名：

```yaml
security:
  website_blocklist:
    enabled: false               # Enable URL blocking (default: false)
    domains:                     # List of blocked domain patterns
      - "*.internal.company.com"
      - "admin.example.com"
      - "*.local"
    shared_files:                # Load additional rules from external files
      - "/etc/hermes/blocked-sites.txt"
```

启用后，任何匹配被阻止域名模式的 URL 在网页或浏览器工具执行之前都会被拒绝。这适用于 `web_search`、`web_extract`、`browser_navigate` 和任何访问 URL 的工具。

域名规则支持：
- 精确域名：`admin.example.com`
- 通配符子域名：`*.internal.company.com`（阻止所有子域名）
- TLD 通配符：`*.local`

共享文件包含每行一个域名规则（空白行和 `#` 注释会被忽略）。缺失或无法读取的文件会记录警告，但不会禁用其他网页工具。

该策略的缓存时间为 30 秒，因此配置更改可以快速生效，无需重启。

## Smart Approvals (智能审批)

控制 Hermes 处理潜在危险命令的方式：

```yaml
approvals:
  mode: manual   # manual | smart | off
```

| 模式 | 行为 |
|------|----------|
| `manual` (手动) | 在执行任何被标记的命令之前提示用户。在 CLI 中显示交互式审批对话框。在消息中，它会排队一个待定的审批请求。 |
| `smart` | 使用辅助 LLM 来评估一个被标记的命令是否真正危险。低风险命令会被自动批准，并具有会话级别的持久性。真正有风险的命令将被升级给用户。 |
| `off` | 跳过所有审批检查。等同于 `HERMES_YOLO_MODE=true`。**请谨慎使用。** |

智能模式对于减少审批疲劳特别有用——它允许智能体在安全操作上更自主地工作，同时仍然能够捕获真正具有破坏性的命令。

:::warning
设置 `approvals.mode: off` 会禁用终端命令的所有安全检查。仅应在受信任、沙箱化的环境中进行使用。
:::

## Checkpoints (检查点)

执行有破坏性的文件操作前的自动文件系统快照。详情请参阅 [Checkpoints & Rollback](/user-guide/checkpoints-and-rollback)。

```yaml
checkpoints:
  enabled: false                 # Enable automatic checkpoints (also: hermes chat --checkpoints). Default: false (opt-in).
  max_snapshots: 20              # Max checkpoints to keep per directory (default: 20)
```

## Delegation (委托)

为委托工具配置子智能体（subagent）的行为：

```yaml
delegation:
  # model: "google/gemini-3-flash-preview"  # Override model (empty = inherit parent)
  # provider: "openrouter"                  # Override provider (empty = inherit parent)
  # base_url: "http://localhost:1234/v1"    # Direct OpenAI-compatible endpoint (takes precedence over provider)
  # api_key: "local-key"                    # API key for base_url (falls back to OPENAI_API_KEY)
  # api_mode: ""                            # Wire protocol for base_url: "chat_completions", "codex_responses", or "anthropic_messages". Empty = auto-detect from URL (e.g. /anthropic suffix → anthropic_messages). Set explicitly for non-standard endpoints the heuristic can't detect.
  max_concurrent_children: 3                # Parallel children per batch (floor 1, no ceiling). Also via DELEGATION_MAX_CONCURRENT_CHILDREN env var.
  max_spawn_depth: 1                        # Delegation tree depth cap (1-3, clamped). 1 = flat (default): parent spawns leaves that cannot delegate. 2 = orchestrator children can spawn leaf grandchildren. 3 = three levels.
  orchestrator_enabled: true                # Global kill switch. When false, role="orchestrator" is ignored and every child is forced to leaf regardless of max_spawn_depth.
```

**子智能体（Subagent）提供者：模型覆盖：** 默认情况下，子智能体会继承父智能体的提供者和模型。设置 `delegation.provider` 和 `delegation.model` 可以将子智能体路由到不同的提供者:模型对——例如，使用廉价/快速的模型来处理范围狭窄的子任务，而主智能体运行昂贵的推理模型。

**直接端点覆盖：** 如果您需要一个明显的自定义端点路径，请设置 `delegation.base_url`、`delegation.api_key` 和 `delegation.model`。这会将子智能体直接发送到该 OpenAI 兼容的端点，并优先于 `delegation.provider`。如果省略 `delegation.api_key`，Hermes 将回退到 `OPENAI_API_KEY`。

**线协议（Wire protocol, `api_mode`）：** Hermes 会从 `delegation.base_url` 自动检测线协议（例如，以 `/anthropic` 结尾的路径 → `anthropic_messages`；Codex / 原生 Anthropic / Kimi-coding 主机名保持其现有检测）。对于启发式方法无法分类的端点——例如 Azure AI Foundry、MiniMax、Zhipu GLM 或提供 Anthropic 形状后端的 LiteLLM 代理——请显式设置 `delegation.api_mode` 为 `chat_completions`、`codex_responses` 或 `anthropic_messages` 中的一个。保持为空（默认）以保留自动检测功能。

委托提供者使用与 CLI/网关启动相同的凭证解析。所有配置的提供者均受支持：`openrouter`、`nous`、`copilot`、`zai`、`kimi-coding`、`minimax`、`minimax-cn`。当设置了提供者后，系统会自动解析正确的基 URL、API 密钥和 API 模式——无需手动配置凭证。

**优先级：** 配置中的 `delegation.base_url` → 配置中的 `delegation.provider` → 父级提供者（继承）。配置中的 `delegation.model` → 父模型（继承）。仅设置 `model` 而不设置 `provider`，只会更改模型名称，同时保留父级的凭证（这对于在同一提供者内切换模型（如 OpenRouter）非常有用）。

**宽度和深度：** `max_concurrent_children` 限制每个批次中并行运行的子智能体数量（默认 `3`，下限为 1，无上限）。也可以通过 `DELEGATION_MAX_CONCURRENT_CHILDREN` 环境变量设置。当模型提交一个比限制更长的 `tasks` 数组时，`delegate_task` 会返回一个解释限制的工具错误，而不是静默截断。`max_spawn_depth` 控制委托树的深度（限制在 1-3）。在默认的 `1` 中，委托是扁平的：子智能体不能生成孙辈智能体，并且传递 `role="orchestrator"` 会默默地降级为 `leaf`。提升到 `2`，则协调者（orchestrator）子智能体可以生成叶子孙辈智能体；提升到 `3`，则是三层树。智能体通过 `role="orchestrator"` 选项参与调用时的编排；而 `orchestrator_enabled: false` 会强制所有子智能体无论如何都退回到叶子节点。成本是乘性缩放的——在 `max_spawn_depth: 3` 和 `max_concurrent_children: 3` 的情况下，树可以达到 3×3×3 = 27 个并发的叶子智能体。有关使用模式，请参阅 [Subagent Delegation → Depth Limit and Nested Orchestration](features/delegation.md#depth-limit-and-nested-orchestration)。

## Clarify (澄清)

配置澄清提示（clarification prompt）的行为：

```yaml
clarify:
  timeout: 120                 # Seconds to wait for user clarification response
```

## Context Files (上下文文件 - SOUL.md, AGENTS.md)

Hermes 使用两种不同的上下文范围：

| 文件 | 用途 | 范围 |
|------|---------|-------|
| `SOUL.md` | **主智能体身份** — 定义智能体的身份（系统提示中的第 #1 个槽位） | `~/.hermes/SOUL.md` 或 `$HERMES_HOME/SOUL.md` |
| `.hermes.md` / `HERMES.md` | 项目特定的指令（最高优先级） | 遍历 Git 根目录 |
| `AGENTS.md` | 项目特定的指令、编码约定 | 递归目录遍历 |
| `CLAUDE.md` | Claude 代码上下文文件（也会被检测到） | 工作目录 |
| `.cursorrules` | Cursor IDE 规则（也会被检测到） | 工作目录 |
| `.cursor/rules/*.mdc` | Cursor 规则文件（也会被检测到） | 工作目录 |

- **SOUL.md** 是智能体的主要身份。它占据系统提示中的第 #1 个槽位，完全取代内置的默认身份。编辑它以完全定制智能体是谁。
- 如果 SOUL.md 缺失、为空或无法加载，Hermes 将回退到内置的默认身份。
- **项目上下文文件使用优先级系统** — 只会加载一种类型（第一个匹配项获胜）：`.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`。SOUL.md 总是独立加载。
- **AGENTS.md** 是分层的：如果子目录中也包含 AGENTS.md，则它们都会被组合起来。
- Hermes 会自动为不存在的 SOUL.md 播种一个默认值。
- 所有加载的上下文文件都限制在 `context_file_max_chars` 个字符以内（默认 20,000），并进行智能截断。

另请参阅：
- [Personality & SOUL.md](/user-guide/features/personality)
- [Context Files](/user-guide/features/context-files)

## Working Directory (工作目录)

| 上下文 | 默认值 |
|---------|---------|
| **CLI (`hermes`)** | 您运行命令的当前目录 |
| **消息网关** | 来自 `~/.hermes/config.yaml` 的 `terminal.cwd`；如果未设置，则为家目录 `~` |
| **Docker / Singularity / Modal / SSH** | 容器内或远程机器上的用户家目录 |

覆盖工作目录：
```yaml
# 在 ~/.hermes/config.yaml 中:
terminal:
  cwd: /home/myuser/projects
```

`MESSAGING_CWD` 和 `~/.hermes/.env` 中的直接 `TERMINAL_CWD` 条目是遗留兼容性回退。新的配置应使用 `terminal.cwd`。