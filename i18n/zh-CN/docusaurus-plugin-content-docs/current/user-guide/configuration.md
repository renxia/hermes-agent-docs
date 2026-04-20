---
sidebar_position: 2
title: "配置"
description: "配置 Hermes Agent — config.yaml、提供商、模型、API 密钥等"
---

# 配置

所有设置都存储在 `~/.hermes/` 目录中，便于访问。

## 目录结构

```text
~/.hermes/
├── config.yaml     # 设置（模型、终端、TTS、压缩等）
├── .env            # API 密钥和机密信息
├── auth.json       # OAuth 提供商凭据（Nous Portal 等）
├── SOUL.md         # 主要代理身份（系统提示中的插槽 #1）
├── memories/       # 持久化记忆（MEMORY.md, USER.md）
├── skills/         # 代理创建的技能（通过 skill_manage 工具管理）
├── cron/           # 计划任务
├── sessions/       # Gateway 会话
└── logs/           # 日志（errors.log, gateway.log — 自动脱敏机密信息）
```

## 管理配置

```bash
hermes config              # 查看当前配置
hermes config edit         # 用编辑器打开 config.yaml
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

按以下顺序解析设置（优先级从高到低）：

1. **CLI 参数** — 例如 `hermes chat --model anthropic/claude-sonnet-4`（每次调用的覆盖）
2. **`~/.hermes/config.yaml`** — 所有非机密设置的主要配置文件
3. **`~/.hermes/.env`** — 环境变量的备用位置；**必需**用于机密信息（API 密钥、令牌、密码）
4. **内置默认值** — 当未设置其他内容时的硬编码安全默认值

:::info 经验法则
机密信息（API 密钥、机器人令牌、密码）放在 `.env` 中。其他所有内容（模型、终端后端、压缩设置、内存限制、工具集）放在 `config.yaml` 中。当两者都设置时，`config.yaml` 对非机密设置优先。
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

单个值中可以包含多个引用：`url: "${HOST}:${PORT}"`。如果引用的变量未设置，占位符将保持原样（`${UNDEFINED_VAR}` 保持不变）。仅支持 `${VAR}` 语法 — `$VAR` 不会被展开。

有关 AI 提供商的设置（OpenRouter、Anthropic、Copilot、自定义端点、自托管 LLM、回退模型等），请参见 [AI 提供商](/docs/integrations/providers)。

### 提供商请求超时

你可以为提供商设置 `providers.<id>.request_timeout_seconds`，并为模型设置 `providers.<id>.models.<model>.timeout_seconds` 以进行模型特定的覆盖。这适用于每个传输上的主要回合客户端（OpenAI-wire、原生 Anthropic、Anthropic-compatible）、回退链、凭据轮换后的重建，以及（对于 OpenAI-wire）每个请求的超时关键字参数 — 因此配置的值会覆盖旧的 `HERMES_API_TIMEOUT` 环境变量。留空则保留旧默认值（`HERMES_API_TIMEOUT=1800`s，原生 Anthropic 900s）。目前 AWS Bedrock（`bedrock_converse` 和 AnthropicBedrock SDK 路径）未连接。参见 [`cli-config.yaml.example`](https://github.com/NousResearch/hermes-agent/blob/main/cli-config.yaml.example) 中的注释示例。

## 终端后端配置

Hermes 支持六种终端后端。每种后端决定了代理的 shell 命令实际执行的位置 — 你的本地机器、Docker 容器、通过 SSH 的远程服务器、Modal 云沙箱、Daytona 工作区或 Singularity/Apptainer 容器。

```yaml
terminal:
  backend: local    # local | docker | ssh | modal | daytona | singularity
  cwd: "."          # 工作目录 ("." = 本地当前目录，容器为 "/root")
  timeout: 180      # 每命令超时（秒）
  env_passthrough: []  # 要转发到沙盒执行的 env var 名称（终端 + execute_code）
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"  # Singularity 后端的容器镜像
  modal_image: "nikolaik/python-nodejs:python3.11-nodejs20"                 # Modal 后端的容器镜像
  daytona_image: "nikolaik/python-nodejs:python3.11-nodejs20"               # Daytona 后端的容器镜像
```

对于 Modal 和 Daytona 等云沙箱，`container_persistent: true` 表示 Hermes 会尝试在沙箱重建时保留文件系统状态。它不保证相同的活动沙箱、PID 空间或后台进程将继续运行。

### 后端概览

| 后端 | 命令运行位置 | 隔离性 | 最适合 |
|---------|-------------------|-----------|----------|
| **local** | 直接在你的机器上 | 无 | 开发、个人使用 |
| **docker** | Docker 容器 | 完全（命名空间、cap-drop） | 安全的沙盒、CI/CD |
| **ssh** | 通过 SSH 的远程服务器 | 网络边界 | 远程开发、强大硬件 |
| **modal** | Modal 云沙箱 | 完全（云 VM） | 临时云计算、评估 |
| **daytona** | Daytona 工作区 | 完全（云容器） | 托管云开发环境 |
| **singularity** | Singularity/Apptainer 容器 | 命名空间（--containall） | HPC 集群、共享机器 |

### 本地后端

默认值。命令直接在您的机器上运行，没有隔离。不需要特殊设置。

```yaml
terminal:
  backend: local
```

:::warning
代理与您的用户账户具有相同的文件系统访问权限。使用 `hermes tools` 禁用您不想要的工具，或使用 Docker 进行沙盒处理。
:::

### Docker 后端

在带有安全加固的 Docker 容器中运行命令（所有能力被丢弃，无特权升级，PID 限制）。

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
  container_disk: 51200            # MB（需要 overlay2 on XFS+pquota）
  container_persistent: true       # 跨会话持久化 /workspace 和 /root
```

**要求：** 安装并运行 Docker Desktop 或 Docker Engine。Hermes 会探测 `$PATH` 加上常见的 macOS 安装位置（`/usr/local/bin/docker`、`/opt/homebrew/bin/docker`、Docker Desktop 应用包）。

**容器生命周期：** 每个会话启动一个长期运行的容器（`docker run -d ... sleep 2h`）。命令通过 `docker exec` 使用登录 shell 运行。清理时，容器被停止并删除。

**安全加固：**
- `--cap-drop ALL` 仅添加 `DAC_OVERRIDE`、`CHOWN`、`FOWNER`
- `--security-opt no-new-privileges`
- `--pids-limit 256`
- 大小限制的 tmpfs 用于 `/tmp`（512MB）、`/var/tmp`（256MB）、`/run`（64MB）

**凭据转发：** 列在 `docker_forward_env` 中的环境变量首先从您的 shell 环境中解析，然后从 `~/.hermes/.env` 获取。技能还可以声明 `required_environment_variables`，这些变量会自动合并。

### SSH 后端

通过 SSH 在远程服务器上运行命令。使用 ControlMaster 实现连接重用（5 分钟空闲保持活动）。默认启用持久 shell — 状态（cwd、环境变量）在命令间保持。

```yaml
terminal:
  backend: ssh
  persistent_shell: true           # 保持长寿命 bash 会话（默认：true）
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
| `TERMINAL_SSH_PERSISTENT` | `true` | 启用持久 shell |

**工作原理：** 在初始化时使用 `BatchMode=yes` 和 `StrictHostKeyChecking=accept-new` 连接。持久 shell 在远程主机上保持单个 `bash -l` 进程活动，通过临时文件通信。需要 `stdin_data` 或 `sudo` 的命令会自动回退到一次性模式。

### Modal 后端

在 [Modal](https://modal.com) 云沙箱中运行命令。每个任务获得一个带有可配置 CPU、内存和磁盘的隔离 VM。文件系统可以在会话间快照/恢复。

```yaml
terminal:
  backend: modal
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB（5GB）
  container_disk: 51200            # MB（50GB）
  container_persistent: true       # 文件系统快照/恢复
```

**必需：** `MODAL_TOKEN_ID` + `MODAL_TOKEN_SECRET` 环境变量，或 `~/.modal.toml` 配置文件。

**持久性：** 启用时，沙箱文件系统会在清理时快照并在下次会话时恢复。快照跟踪记录在 `~/.hermes/modal_snapshots.json` 中。这会保留文件系统状态，而不是活动进程、PID 空间或后台作业。

**凭据文件：** 自动从 `~/.hermes/` 挂载（OAuth 令牌等）并在每个命令前同步。

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

**持久性：** 启用时，沙箱会在清理时停止（而不是删除）并在下次会话时恢复。沙箱名称遵循 `hermes-{task_id}` 模式。

**磁盘限制：** Daytona 强制执行 10 GiB 最大值。超过此值的请求会被截断并显示警告。

### Singularity/Apptainer 后端

在 [Singularity/Apptainer](https://apptainer.org) 容器中运行命令。专为 Docker 不可用的 HPC 集群和共享机器设计。

```yaml
terminal:
  backend: singularity
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB
  container_persistent: true       # 可写叠加层在会话间持久化
```

**要求：** `$PATH` 中包含 `apptainer` 或 `singularity` 二进制文件。

**镜像处理：** Docker URL（`docker://...`）会自动转换为 SIF 文件并缓存。现有的 `.sif` 文件直接使用。

**Scratch 目录：** 按顺序解析：`TERMINAL_SCRATCH_DIR` → `TERMINAL_SANDBOX_DIR/singularity` → `/scratch/$USER/hermes-agent`（HPC 约定）→ `~/.hermes/sandboxes/singularity`。

**隔离：** 使用 `--containall --no-home` 实现完全命名空间隔离，不挂载主机 home 目录。

### 常见终端后端问题

如果终端命令立即失败或报告终端工具被禁用：

- **本地** — 无特殊要求。开始时的最安全默认值。
- **Docker** — 运行 `docker version` 验证 Docker 是否正常工作。如果失败，修复 Docker 或 `hermes config set terminal.backend local`。
- **SSH** — 必须设置 `TERMINAL_SSH_HOST` 和 `TERMINAL_SSH_USER`。如果任一缺失，Hermes 会记录清晰错误。
- **Modal** — 需要 `MODAL_TOKEN_ID` 环境变量或 `~/.modal.toml`。运行 `hermes doctor` 检查。
- **Daytona** — 需要 `DAYTONA_API_KEY`。Daytona SDK 处理服务器 URL 配置。
- **Singularity** — 需要在 `$PATH` 中有 `apptainer` 或 `singularity`。HPC 集群常见。

如有疑问，将 `terminal.backend` 设回 `local` 并首先验证命令在那里是否运行。

### Docker 卷挂载

使用 Docker 后端时，`docker_volumes` 允许您将主机目录与容器共享。每个条目使用标准的 Docker `-v` 语法：`host_path:container_path[:options]`。

```yaml
terminal:
  backend: docker
  docker_volumes:
    - "/home/user/projects:/workspace/projects"   # 读写（默认）
    - "/home/user/datasets:/data:ro"              # 只读
    - "/home/user/.hermes/cache/documents:/output" # Gateway-可见导出
```

这很有用：
- **向代理提供文件**（数据集、配置、参考代码）
- **从代理接收文件**（生成的代码、报告、导出）
- **共享工作区**，您和代理都可以访问相同文件

如果您使用消息网关并希望代理通过 `MEDIA:/...` 发送生成的文件，请优先选择专用的主机可见导出挂载，如 `/home/user/.hermes/cache/documents:/output`。

- 在 Docker 内写入文件到 `/output/...`
- 在 `MEDIA:` 中输出**主机路径**，例如：
  `MEDIA:/home/user/.hermes/cache/documents/report.txt`
- 除非该确切路径也存在于主机上的网关进程中，否则不要输出 `/workspace/...` 或 `/output/...`

:::warning
YAML 重复键会静默覆盖前面的键。如果已有 `docker_volumes:` 块，请将新挂载合并到同一列表中，而不是在文件后面添加另一个 `docker_volumes:` 键。
:::

也可以通过环境变量设置：`TERMINAL_DOCKER_VOLUMES='["/host:/container"]'`（JSON 数组）。

### Docker 凭据转发

默认情况下，Docker 终端会话不会继承任意主机凭据。如果需要容器内的特定令牌，请将其添加到 `terminal.docker_forward_env`。

```yaml
terminal:
  backend: docker
  docker_forward_env:
    - "GITHUB_TOKEN"
    - "NPM_TOKEN"
```

Hermes 首先从当前 shell 解析每个列出的变量，如果未找到则回退到 `~/.hermes/.env`（如果通过 `hermes config set` 保存）。

:::warning
列在 `docker_forward_env` 中的任何内容都会对容器内运行的命令可见。只转发您愿意暴露在终端会话中的凭据。
:::

### 可选：将启动目录挂载到 `/workspace`

Docker 沙箱默认保持隔离。Hermes **不会** 除非您明确选择，否则将当前主机工作目录传递到容器中。

在 `config.yaml` 中启用：

```yaml
terminal:
  backend: docker
  docker_mount_cwd_to_workspace: true
```

启用后：
- 如果您从 `~/projects/my-app` 启动 Hermes，该主机目录会绑定挂载到 `/workspace`
- Docker 后端在 `/workspace` 启动
- 文件工具和终端命令都能看到相同的挂载项目

禁用时，`/workspace` 保持为沙箱所有，除非您通过 `docker_volumes` 显式挂载某些内容。

安全权衡：
- `false` 保持沙箱边界
- `true` 给沙箱对您启动 Hermes 的目录的直接访问权限

仅在您有意让容器处理活动主机文件时才使用此选择。

### 持久 Shell

默认情况下，每个终端命令都在自己的子进程中运行 — 工作目录、环境变量和 shell 变量在命令间重置。启用**持久 shell**时，单个长寿命 bash 进程会在 `execute()` 调用间保持活动状态，使状态在命令间持续存在。

这对 **SSH 后端** 最有用，因为它还消除了每命令连接开销。持久 shell 对 SSH 默认启用，对本地后端禁用。

```yaml
terminal:
  persistent_shell: true   # 默认 — 为 SSH 启用持久 shell
```

要禁用：

```bash
hermes config set terminal.persistent_shell false
```

**跨命令持续存在的内容：**
- 工作目录（`cd /tmp` 对下一个命令有效）
- 导出的环境变量（`export FOO=bar`）
- Shell 变量（`MY_VAR=hello`）

**优先级：**

| 级别 | 变量 | 默认值 |
|-------|----------|---------|
| 配置 | `terminal.persistent_shell` | `true` |
| SSH 覆盖 | `TERMINAL_SSH_PERSISTENT` | 遵循配置 |
| 本地覆盖 | `TERMINAL_LOCAL_PERSISTENT` | `false` |

每后端环境变量具有最高优先级。如果您也想在本地后端启用持久 shell：

```bash
export TERMINAL_LOCAL_PERSISTENT=true
```

:::note
需要 `stdin_data` 或 sudo 的命令会自动回退到一次性模式，因为持久 shell 的 stdin 已被 IPC 协议占用。
:::

有关每个后端的详细信息，请参见 [Code Execution](features/code-execution.md) 和 [README 的 Terminal 部分](features/tools.md)。

## 技能设置

技能可以通过其 SKILL.md frontmatter 声明自己的配置设置。这些是非机密值（路径、偏好、域设置），存储在 `config.yaml` 的 `skills.config` 命名空间中。

```yaml
skills:
  config:
    myplugin:
      path: ~/myplugin-data   # 示例 — 每个技能定义自己的键
```

**技能设置如何工作：**

- `hermes config migrate` 扫描所有启用的技能，查找未配置的设置，并提示您
- `hermes config show` 在“技能设置”下显示所有技能设置及其所属技能
- 当加载技能时，其解析的配置值会自动注入到技能上下文中

**手动设置值：**

```bash
hermes config set skills.config.myplugin.path ~/myplugin-data
```

有关在您的技能中声明配置设置的详细信息，请参见 [Creating Skills — Config Settings](/docs/developer-guide/creating-skills#config-settings-configyaml)。

## 内存配置

```yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # ~800 tokens
  user_char_limit: 1375     # ~500 tokens
```

## 文件读取安全

控制单个 `read_file` 调用可以返回多少内容。超过限制的读取会被拒绝，并显示错误告诉代理使用 `offset` 和 `limit` 获取较小范围。这防止单个 JS 捆绑包或大数据文件的读取淹没上下文窗口。

```yaml
file_read_max_chars: 100000  # 默认 — ~25-35K tokens
```

如果您使用的是大上下文窗口模型并经常读取大文件，请提高此值。对于小上下文模型，降低它以保持读取效率：

```yaml
# 大上下文模型（200K+）
file_read_max_chars: 200000

# 小本地模型（16K 上下文）
file_read_max_chars: 30000
```

代理还会自动去重文件读取 — 如果同一文件区域被读取两次且文件未更改，则返回轻量级存根而不是重新发送内容。这在上下文压缩时重置，因此代理可以在内容被总结后重新读取文件。

## Git Worktree 隔离

为在同一仓库中并行运行多个代理启用隔离 git worktrees：

```yaml
worktree: true    # 始终创建工作树（等同于 hermes -w）
# worktree: false # 默认 — 仅在传递 -w 标志时
```

启用时，每个 CLI 会话在 `.worktrees/` 下创建带有自己分支的新鲜 worktree。代理可以编辑文件、提交、推送和创建 PR，而不会相互干扰。退出时干净的工作树被删除；脏的保留供手动恢复。

您还可以通过仓库根部的 `.worktreeinclude` 列出要复制到 worktrees 的 gitignored 文件：

```
# .worktreeinclude
.env
.venv/
node_modules/
```

## 上下文压缩

Hermes 会自动压缩长对话以保持在其模型的上下文窗口内。压缩摘要器是单独的 LLM 调用 — 您可以将其指向任何提供商或端点。

所有压缩设置都在 `config.yaml` 中（无环境变量）。

### 完整参考

```yaml
compression:
  enabled: true                                     # 切换压缩开/关
  threshold: 0.50                                   # 在此 % 的上下文限制时压缩
  target_ratio: 0.20                                # 阈值保留为最近尾部的分数
  protect_last_n: 20                                # 最小未压缩最近消息数

# 摘要模型/提供商在 auxiliary 下配置：
auxiliary:
  compression:
    model: "google/gemini-3-flash-preview"          # 摘要模型
    provider: "auto"                                # 提供商："auto"、"openrouter"、"nous"、"codex"、"main" 等
    base_url: null                                  # 自定义 OpenAI-compatible 端点（覆盖提供商）
```

:::info 旧版配置迁移
带有 `compression.summary_model`、`compression.summary_provider` 和 `compression.summary_base_url` 的旧配置会在首次加载时自动迁移到 `auxiliary.compression.*`（配置版本 17）。无需手动操作。
:::

### 常见设置

**默认（自动检测）— 无需配置：**
```yaml
compression:
  enabled: true
  threshold: 0.50
```
使用第一个可用提供商（OpenRouter → Nous → Codex）配合 Gemini Flash。

**强制特定提供商**（基于 OAuth 或 API-key）：
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
指向自定义 OpenAI-compatible 端点。使用 `OPENAI_API_KEY` 认证。

### 三个旋钮如何交互

| `auxiliary.compression.provider` | `auxiliary.compression.base_url` | 结果 |
|---------------------|---------------------|--------|
| `auto`（默认） | 未设置 | 自动检测最佳可用提供商 |
| `nous` / `openrouter` / 等 | 未设置 | 强制该提供商，使用其认证 |
| 任意 | 设置 | 直接使用自定义端点（忽略提供商） |

:::warning 摘要模型上下文长度要求
摘要模型**必须**具有至少与您主要代理模型一样大的上下文窗口。压缩器将对话的完整中间部分发送给摘要模型 — 如果该模型的上下文窗口小于主模型，摘要调用将因上下文长度错误而失败。发生这种情况时，中间回合**会被静默丢弃而没有摘要**，丢失对话上下文。如果覆盖模型，请验证其上下文长度满足或超过您的主模型。
:::

## 上下文引擎

上下文引擎控制当接近模型的 token 限制时如何管理对话。内置的 `compressor` 引擎使用有损摘要（参见 [Context Compression](/docs/developer-guide/context-compression-and-caching)）。插件引擎可以用替代策略替换它。

```yaml
context:
  engine: "compressor"    # 默认 — 内置有损摘要
```

要使用插件引擎（例如 LCM 进行无损上下文管理）：

```yaml
context:
  engine: "lcm"          # 必须匹配插件名称
```

插件引擎**永远不会自动激活** — 您必须显式将 `context.engine` 设置为插件名称。可通过 `hermes plugins` → Provider Plugins → Context Engine 浏览和选择可用引擎。

有关内存插件的类似单选系统，请参见 [Memory Providers](/docs/user-guide/features/memory-providers)。

## 迭代预算压力

当代理在处理涉及许多工具调用的复杂任务时，可能会在不意识到自己接近限制的情况下耗尽其迭代预算（默认：90 回合）。预算压力会在接近限制时自动警告模型：

| 阈值 | 级别 | 模型看到的内容 |
|-----------|-------|---------------------|
| **70%** | 注意 | `[BUDGET: 63/90. 27 次迭代剩余。开始整合。]` |
| **90%** | 警告 | `[BUDGET WARNING: 81/90. 只剩 9 个。现在响应！]` |

警告作为最后一个工具结果的 JSON 中的 `_budget_warning` 字段注入（而不是单独的消息）— 这保留了提示缓存且不破坏对话结构。

```yaml
agent:
  max_turns: 90                # 每次对话回合的最大迭代次数（默认：90）
```

预算压力默认启用。代理自然地将警告作为工具结果的一部分看到，鼓励其在耗尽迭代次数前整合工作并交付响应。

当迭代预算完全耗尽时，CLI 向用户显示通知：`⚠ 迭代预算已耗尽（90/90）— 响应可能不完整`。如果预算在工作期间耗尽，代理会生成已完成工作的摘要然后停止。

### 流式传输超时

LLM 流式传输连接有两个超时层。两者都针对本地提供商（localhost、LAN IP）自动调整 — 大多数设置无需配置。

| 超时 | 默认值 | 本地提供商 | 环境变量 |
|---------|---------|----------------|---------|
| Socket 读取超时 | 120s | 自动提高到 1800s | `HERMES_STREAM_READ_TIMEOUT` |
| 陈旧流检测 | 180s | 自动禁用 | `HERMES_STREAM_STALE_TIMEOUT` |
| API 调用（非流式） | 1800s | 不变 | `HERMES_API_TIMEOUT` |

**Socket 读取超时**控制 httpx 等待提供商的下一个数据块的秒数。本地 LLM 在大上下文的预填充上可能需要几分钟才能产生第一个 token，因此 Hermes 在检测到本地端点时会将此提高到 30 分钟。如果您显式设置 `HERMES_STREAM_READ_TIMEOUT`，无论端点检测如何，都将使用该值。

**陈旧流检测**会终止接收到 SSE keep-alive ping 但没有实际内容的连接。这对于本地提供商完全禁用，因为它们不会在预填充期间发送 keep-alive ping。

## 上下文压力警告

与迭代预算压力分开，上下文压力跟踪对话距离**压缩阈值**有多近 — 这是触发摘要以总结旧消息的点。这帮助您和代理了解对话何时变长。

| 进度 | 级别 | 结果 |
|----------|-------|-------------|
| **≥ 60%** 到阈值 | 信息 | CLI 显示青色进度条；网关发送信息通知 |
| **≥ 85%** 到阈值 | 警告 | CLI 显示粗黄色条；网关警告压缩即将发生 |

在 CLI 中，上下文压力显示为工具输出 feed 中的进度条：

```
  ◐ context ████████████░░░░░░░░ 62% to compaction  48k threshold (50%) · approaching compaction
```

在消息平台上，发送纯文本通知：

```
◐ Context: ████████████░░░░░░░░ 62% to compaction (threshold: 50% of window).
```

如果自动压缩被禁用，警告会告诉您上下文可能被截断。

上下文压力是自动的 — 无需配置。它纯粹作为面向用户的通知触发，不会修改消息流或在模型的上下文中注入任何内容。

## 凭据池策略

当您有同一提供商的多個 API 密钥或 OAuth 令牌时，配置轮换策略：

```yaml
credential_pool_strategies:
  openrouter: round_robin    # 均匀循环遍历密钥
  anthropic: least_used      # 总是选择使用最少的密钥
```

选项：`fill_first`（默认）、`round_robin`、`least_used`、`random`。完整的文档请参见 [Credential Pools](/docs/user-guide/features/credential-pools)。

## 辅助模型

Hermes 使用轻量级的"辅助"模型进行图像分析、网页摘要和浏览器屏幕截图分析等侧边任务。默认情况下，这些使用 **Gemini Flash** 通过自动检测 — 您无需配置任何内容。

### 通用配置模式

Hermes 中的每个模型槽位 — 辅助任务、压缩、回退 — 都使用相同的三个旋钮：

| 键 | 作用 | 默认值 |
|-----|-------------|---------|
| `provider` | 使用哪个提供商进行认证和路由 | `"auto"` |
| `model` | 请求哪个模型 | 提供商的默认值 |
| `base_url` | 自定义 OpenAI-compatible 端点（覆盖提供商） | 未设置 |

当设置 `base_url` 时，Hermes 忽略提供商并直接调用该端点（使用 `api_key` 或 `OPENAI_API_KEY` 认证）。当仅设置 `provider` 时，Hermes 使用该提供商的内置认证和基础 URL。

辅助任务的可用提供商：`auto`、`main`，加上 [provider registry](/docs/reference/environment-variables) 中的任何提供商 — `openrouter`、`nous`、`openai-codex`、`copilot`、`copilot-acp`、`anthropic`、`gemini`、`google-gemini-cli`、`qwen-oauth`、`zai`、`kimi-coding`、`kimi-coding-cn`、`minimax`、`minimax-cn`、`deepseek`、`nvidia`、`xai`、`ollama-cloud`、`alibaba`、`bedrock`、`huggingface`、`arcee`、`xiaomi`、`kilocode`、`opencode-zen`、`opencode-go`、`ai-gateway` — 或来自您的 `custom_providers` 列表的任何命名的自定义提供商（例如 `provider: "beans"`）。

:::warning `"main"` 仅用于辅助任务
`"main"` 提供商选项表示"使用我的主代理使用的提供商" — 它仅在 `auxiliary:`、`compression:` 和 `fallback_model:` 配置中有效。对于主模型的顶级 `model.provider` 设置**无效**。如果您使用自定义 OpenAI-compatible 端点，请在您的 `model:` 部分设置 `provider: custom`。有关所有主模型提供商选项，请参见 [AI Providers](/docs/integrations/providers)。
:::

### 完整的辅助配置参考

```yaml
auxiliary:
  # 图像分析（vision_analyze 工具 + 浏览器屏幕截图）
  vision:
    provider: "auto"           # "auto"、"openrouter"、"nous"、"codex"、"main" 等
    model: ""                  # 例如 "openai/gpt-4o"、"google/gemini-2.5-flash"
    base_url: ""               # 自定义 OpenAI-compatible 端点（覆盖提供商）
    api_key: ""                # base_url 的 API 密钥（回退到 OPENAI_API_KEY）
    timeout: 120               # 秒 — LLM API 调用超时；图像载荷需要 generous timeout
    download_timeout: 30       # 秒 — 图像 HTTP 下载；慢连接增加此值

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
    timeout: 120               # 秒 — 压缩总结长对话，需要更多时间

  # 会话搜索 — 总结过去会话匹配项
  session_search:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

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

  # 内存刷新 — 总结对话以用于持久内存
  flush_memories:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30
```

:::tip
每个辅助任务都有可配置的 `timeout`（秒）。默认值：vision 120s，web_extract 360s，approval 30s，compression 120s。如果使用慢速本地模型进行辅助任务，请增加这些值。Vision 还有单独的 `download_timeout`（默认 30s）用于 HTTP 图像下载 — 慢连接或自托管图像服务器增加此值。
:::

:::info
上下文压缩有自己的 `compression:` 块用于阈值，以及 `auxiliary.compression:` 块用于模型/提供商设置 — 参见上面的 [Context Compression](#context-compression)。回退模型使用 `fallback_model:` 块 — 参见 [Fallback Model](/docs/integrations/providers#fallback-model)。三者都遵循相同的 provider/model/base_url 模式。
:::

### 更改 Vision 模型

要为图像分析使用 GPT-4o 而不是 Gemini Flash：

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
|----------|-------------|-------------|
| `"auto"` | 最佳可用（默认）。Vision 尝试 OpenRouter → Nous → Codex。 | — |
| `"openrouter"` | 强制 OpenRouter — 路由到任何模型（Gemini、GPT-4o、Claude 等） | `OPENROUTER_API_KEY` |
| `"nous"` | 强制 Nous Portal | `hermes auth` |
| `"codex"` | 强制 Codex OAuth（ChatGPT 账户）。支持 vision（gpt-5.3-codex）。 | `hermes model` → Codex |
| `"main"` | 使用您的活动自定义/主端点。这可以来自 `OPENAI_BASE_URL` + `OPENAI_API_KEY` 或从 `hermes model` / `config.yaml` 保存的自定义端点。适用于 OpenAI、本地模型或任何 OpenAI-compatible API。**仅辅助任务 — 不适用于 `model.provider`。** | 自定义端点凭据 + 基础 URL |

### 常见设置

**使用直接自定义端点**（比 `provider: "main"` 更清晰用于本地/自托管 API）：
```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 优先于 `provider`，因此这是将辅助任务路由到特定端点的最明确方式。对于直接端点覆盖，Hermes 使用配置的 `api_key` 或回退到 `OPENAI_API_KEY`；它不会为那个自定义端点重用 `OPENROUTER_API_KEY`。

**使用 OpenAI API 密钥进行 vision：**
```yaml
# 在 ~/.hermes/.env 中：
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_API_KEY=sk-...

auxiliary:
  vision:
    provider: "main"
    model: "gpt-4o"       # 或 "gpt-4o-mini" 更便宜
```

**使用 OpenRouter 进行 vision**（路由到任何模型）：
```yaml
auxiliary:
  vision:
    provider: "openrouter"
    model: "openai/gpt-4o"      # 或 "google/gemini-2.5-flash" 等
```

**使用 Codex OAuth**（ChatGPT Pro/Plus 账户 — 无需 API 密钥）：
```yaml
auxiliary:
  vision:
    provider: "codex"     # 使用您的 ChatGPT OAuth 令牌
    # 默认模型为 gpt-5.3-codex（支持 vision）
```

**使用本地/自托管模型：**
```yaml
auxiliary:
  vision:
    provider: "main"      # 使用您的活动自定义端点
    model: "my-local-model"
```

`provider: "main"` 使用 Hermes 用于普通聊天的相同提供商 — 无论是命名自定义提供商（例如 `beans`）、内置提供商如 `openrouter`，还是旧的 `OPENAI_BASE_URL` 端点。

:::tip
如果您将 Codex OAuth 用作主模型提供商，vision 会自动工作 — 无需额外配置。Codex 包含在 vision 的自动检测链中。
:::

:::warning
**Vision 需要多模态模型。** 如果您设置 `provider: "main"`，请确保您的端点支持多模态/vision — 否则图像分析将失败。
:::

### 环境变量（旧版）

辅助模型也可以通过环境变量配置。但是，`config.yaml` 是首选方法 — 它更容易管理和支持所有选项，包括 `base_url` 和 `api_key`。

| 设置 | 环境变量 |
|---------|---------------------|
| Vision 提供商 | `AUXILIARY_VISION_PROVIDER` |
| Vision 模型 | `AUXILIARY_VISION_MODEL` |
| Vision 端点 | `AUXILIARY_VISION_BASE_URL` |
| Vision API 密钥 | `AUXILIARY_VISION_API_KEY` |
| Web extract 提供商 | `AUXILIARY_WEB_EXTRACT_PROVIDER` |
| Web extract 模型 | `AUXILIARY_WEB_EXTRACT_MODEL` |
| Web extract 端点 | `AUXILIARY_WEB_EXTRACT_BASE_URL` |
| Web extract API 密钥 | `AUXILIARY_WEB_EXTRACT_API_KEY` |

压缩和回退模型设置仅在 config.yaml 中。

:::tip
运行 `hermes config` 查看当前的辅助模型设置。仅当它们与默认值不同时才会显示覆盖。
:::

## 推理努力

控制模型在响应前进行多少"思考"：

```yaml
agent:
  reasoning_effort: ""   # 空 = 中等（默认）。选项：none、minimal、low、medium、high、xhigh（最大）
```

未设置时（默认），推理努力默认为"中等" — 平衡水平适用于大多数任务。设置值会覆盖它 — 更高的推理努力在复杂任务上给出更好结果，但代价是更多 token 和延迟。

您还可以在运行时使用 `/reasoning` 命令更改推理努力：

```
/reasoning           # 显示当前努力级别和显示状态
/reasoning high      # 将推理努力设置为高
/reasoning none      # 禁用推理
/reasoning show      # 在每个响应上方显示模型思考
/reasoning hide      # 隐藏模型思考
```

## 工具使用强制

某些模型偶尔会将预期操作描述为文本而不是制作工具调用（"我会运行测试..." 而不是实际调用终端）。工具使用强制注入系统提示指导，将模型引导回实际调用工具。

```yaml
agent:
  tool_use_enforcement: "auto"   # "auto" | true | false | ["model-substring", ...]
```

| 值 | 行为 |
|-------|----------|
| `"auto"`（默认） | 为匹配的模型启用：`gpt`、`codex`、`gemini`、`gemma`、`grok`。对所有其他模型禁用（Claude、DeepSeek、Qwen 等）。 |
| `true` | 始终启用，无论模型如何。如果您注意到当前模型描述动作而不是执行它们，这很有用。 |
| `false` | 始终禁用，无论模型如何。 |
| `["gpt", "codex", "qwen", "llama"]` | 仅当模型名称包含列表中的一个子字符串时启用（不区分大小写）。 |

### 它注入了什么

启用时，可能会向系统提示添加三层指导：

1. **通用工具使用强制**（所有匹配的模型） — 指示模型立即制作工具调用而不是描述意图，继续工作直到任务完成，并且永远不要在回合结束时承诺未来行动。

2. **OpenAI 执行纪律**（仅 GPT 和 Codex 模型） — 额外的指导解决 GPT 特有的故障模式：放弃部分结果的工作，跳过先决条件查找，虚构而不是使用工具，以及在没有验证的情况下声明"完成"。

3. **Google 操作指导**（仅 Gemini 和 Gemma 模型） — 简洁性、绝对路径、并行工具调用以及编辑前验证模式。

这些对用户透明，仅影响系统提示。已经可靠使用工具的模型（如 Claude）不需要此指导，这就是为什么 `"auto"` 将它们排除在外。

### 何时开启

如果您使用的是默认自动列表之外的模型，并注意到它频繁描述它将做什么而不是执行它，请设置 `tool_use_enforcement: true` 或将模型子字符串添加到列表中：

```yaml
agent:
  tool_use_enforcement: ["gpt", "codex", "gemini", "grok", "my-custom-model"]
```

## TTS 配置

```yaml
tts:
  provider: "edge"              # "edge" | "elevenlabs" | "openai" | "minimax" | "mistral" | "gemini" | "xai" | "neutts"
  speed: 1.0                    # 全局速度乘数（所有提供商的回退）
  edge:
    voice: "en-US-AriaNeural"   # 322 个声音，74 种语言
    speed: 1.0                  # 速度乘数（转换为速率百分比，例如 1.5 → +50%）
  elevenlabs:
    voice_id: "pNInz6obpgDQGcFmaJgB"
    model_id: "eleven_multilingual_v2"
  openai:
    model: "gpt-4o-mini-tts"
    voice: "alloy"              # alloy、echo、fable、onyx、nova、shimmer
    speed: 1.0                  # 速度乘数（由 API 钳制到 0.25–4.0）
    base_url: "https://api.openai.com/v1"  # 覆盖 OpenAI-compatible TTS 端点
  minimax:
    speed: 1.0                  # 语音速度乘数
    # base_url: ""              # 可选：覆盖 OpenAI-compatible TTS 端点
  mistral:
    model: "voxtral-mini-tts-2603"
    voice_id: "c69964a6-ab8b-4f8a-9465-ec0925096ec8"  # Paul - Neutral（默认）
  gemini:
    model: "gemini-2.5-flash-preview-tts"   # 或 gemini-2.5-pro-preview-tts
    voice: "Kore"               # 30 个预制声音：Zephyr、Puck、Kore、Enceladus 等
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

这控制 `text_to_speech` 工具和语音模式中的语音回复（CLI 中的 `/voice tts` 或消息网关）。

**速度回退层次结构：** 特定提供商的 speed（例如 `tts.edge.speed`）→ 全局 `tts.speed` → `1.0` 默认值。设置全局 `tts.speed` 对所有提供商应用统一速度，或为精细控制覆盖每个提供商。

## 显示设置

```yaml
display:
  tool_progress: all      # off | new | all | verbose
  tool_progress_command: false  # 在消息网关中启用 /verbose 斜杠命令
  tool_progress_overrides: {}  # 每平台覆盖（见下文）
  interim_assistant_messages: true  # Gateway：发送自然的中途助手更新作为单独消息
  skin: default           # 内置或自定义 CLI 皮肤（参见 user-guide/features/skins）
  personality: "kawaii"  # 遗留装饰字段仍出现在某些摘要中
  compact: false          # 紧凑输出模式（较少空白）
  resume_display: full    # full（恢复时显示先前消息）| minimal（仅单行）
  bell_on_complete: false # 代理完成时播放终端铃声（长任务很好）
  show_reasoning: false   # 在每个响应上方显示模型推理/思考（使用 /reasoning show|hide 切换）
  streaming: false        # 实时流式传输 token 到终端（实时输出）
  show_cost: false        # 在 CLI 状态栏中显示估计 $ 成本
  tool_preview_length: 0  # 工具调用预览的最大字符数（0 = 无限制，显示完整路径/命令）
```

| 模式 | 您看到的内容 |
|------|-------------|
| `off` | 静音 — 仅最终响应 |
| `new` | 仅当工具更改时显示工具指示器 |
| `all` | 每次工具调用带简短预览（默认） |
| `verbose` | 完整参数、结果和调试日志 |

在 CLI 中，使用 `/verbose` 在这些模式间循环。要在消息平台（Telegram、Discord、Slack 等）中使用 `/verbose`，请在上述 `display` 部分设置 `tool_progress_command: true`。然后该命令会循环模式并保存到配置。

### 每平台进度覆盖

不同平台有不同的详细程度需求。例如，Signal 无法编辑消息，因此每个进度更新都成为单独的消息 — 嘈杂。使用 `tool_progress_overrides` 设置每平台模式：

```yaml
display:
  tool_progress: all          # 全局默认
  tool_progress_overrides:
    signal: 'off'             # Signal 上静音进度
    telegram: verbose         # Telegram 上详细进度
    slack: 'off'              # 共享 Slack 工作区安静
```

没有覆盖的平台回退到全局 `tool_progress` 值。有效平台键：`telegram`、`discord`、`slack`、`signal`、`whatsapp`、`matrix`、`mattermost`、`email`、`sms`、`homeassistant`、`dingtalk`、`feishu`、`wecom`、`weixin`、`bluebubbles`、`qqbot`。

`interim_assistant_messages` 仅限网关。启用时，Hermes 将完成的 midway 助手更新作为单独的聊天消息发送。这与 `tool_progress` 独立，不需要网关流式传输。

## 隐私

```yaml
privacy:
  redact_pii: false  # 从 LLM 上下文（仅限网关）中剥离 PII
```

当 `redact_pii` 为 `true` 时，网关会对支持的平台上发送到 LLM 的系统提示中的个人身份信息进行脱敏：

| 字段 | 处理方式 |
|-------|-----------|
| 电话号码（WhatsApp/Signal 的用户 ID） | 哈希到 `user_<12-char-sha256>` |
| 用户 ID | 哈希到 `user_<12-char-sha256>` |
| 聊天 ID | 数字部分哈希，平台前缀保留（`telegram:<hash>`） |
| 主页频道 ID | 数字部分哈希 |
| 用户名 / 用户名 | **不受影响**（用户选择的公开可见） |

**平台支持：** 脱敏适用于 WhatsApp、Signal 和 Telegram。Discord 和 Slack 被排除，因为其提及系统（`<@user_id>`）需要在 LLM 上下文中的真实 ID。

哈希是确定性的 — 同一用户始终映射到同一哈希，因此模型仍可区分群聊中的用户。路由和交付使用原始值内部处理。

## 语音转文本（STT）

```yaml
stt:
  provider: "local"            # "local" | "groq" | "openai" | "mistral"
  local:
    model: "base"              # tiny、base、small、medium、large-v3
  openai:
    model: "whisper-1"         # whisper-1 | gpt-4o-mini-transcribe | gpt-4o-transcribe
  # model: "whisper-1"         # 仍尊重旧的回退键
```

提供商行为：

- `local` 使用机器上的 `faster-whisper`。使用 `pip install faster-whisper` 单独安装。
- `groq` 使用 Groq 的 Whisper-compatible 端点并读取 `GROQ_API_KEY`。
- `openai` 使用 OpenAI 语音 API 并读取 `VOICE_TOOLS_OPENAI_KEY`。

如果请求的提供商不可用，Hermes 会自动按此顺序回退：`local` → `groq` → `openai`。

Groq 和 OpenAI 模型覆盖是环境驱动的：

```bash
STT_GROQ_MODEL=whisper-large-v3-turbo
STT_OPENAI_MODEL=whisper-1
GROQ_BASE_URL=https://api.groq.com/openai/v1
STT_OPENAI_BASE_URL=https://api.openai.com/v1
```

## 语音模式（CLI）

```yaml
voice:
  record_key: "ctrl+b"         # CLI 内的按住说话键
  max_recording_seconds: 120    # 长录音硬性停止
  auto_tts: false               # 启用 /voice on 时自动语音回复
  silence_threshold: 200        # 语音检测的 RMS 阈值
  silence_duration: 3.0         # 静默前的秒数后自动停止
```

在 CLI 中使用 `/voice on` 启用麦克风模式，`record_key` 开始/停止录音，`/voice tts` 切换语音回复。有关端到端设置和平台特定行为的详细信息，请参见 [Voice Mode](/docs/user-guide/features/voice-mode)。

## 流式传输

将 token 流式传输到终端或消息平台，而不是等待完整响应。

### CLI 流式传输

```yaml
display:
  streaming: true         # 实时流式传输 token 到终端
  show_reasoning: true    # 也流式传输推理/思考 token（可选）
```

启用时，响应逐 token 显示在流式框中。工具调用仍被静默捕获。如果提供商不支持流式传输，它会自动回退到正常显示。

### 网关流式传输（Telegram、Discord、Slack）

```yaml
streaming:
  enabled: true           # 启用渐进式消息编辑
  transport: edit         # "edit"（渐进式消息编辑）或 "off"
  edit_interval: 0.3      # 消息编辑间的秒数
  buffer_threshold: 40    # 强制编辑刷新的字符数
  cursor: " ▉"            # 流式传输期间的游标
```

启用时，机器人发送第一个 token 的消息，然后随着更多 token 到达而逐步编辑它。不支持消息编辑的平台（Signal、Email、Home Assistant）会在第一次尝试时自动检测 — 为该会话优雅地禁用流式传输，而不会发送洪水般的信息。

对于没有渐进式 token 编辑的自然中途助手更新，设置 `display.interim_assistant_messages: true`。

**溢出处理：** 如果流式文本超过平台的消息长度限制（~4096 字符），当前消息会完成并开始新消息。

:::note
流式传输默认禁用。在 `~/.hermes/config.yaml` 中启用它以尝试流式传输 UX。
:::

## 群聊会话隔离

控制在共享聊天中是保持每个房间一个对话还是每个参与者一个对话：

```yaml
group_sessions_per_user: true  # true = 群聊/频道中的每用户隔离，false = 每个聊天一个共享会话
```

- `true` 是默认推荐设置。在 Discord 频道、Telegram 群组、Slack 频道等共享上下文中，当平台提供用户 ID 时，每个发件人都有自己的会话。
- `false` 回退到旧的共享房间行为。这可能有用，如果您明确希望 Hermes 将频道视为一个协作对话，但这也会意味着用户共享上下文、token 成本和中断状态。
- 直接消息不受影响。Hermes 仍按常规使用聊天/DM ID 对 DMs 进行索引。
- 无论哪种情况，线程都与其父频道隔离；使用 `true` 时，线程内的每个参与者也有自己的会话。

有关行为细节和示例，请参见 [Sessions](/docs/user-guide/sessions) 和 [Discord 指南](/docs/user-guide/messaging/discord)。

## 未授权 DM 行为

控制在未知用户发送直接消息时 Hermes 的行为：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `pair` 是默认值。Hermes 拒绝访问，但在 DM 中回复一次性配对码。
- `ignore` 静默丢弃未授权的 DM。
- 平台部分覆盖全局默认值，因此您可以在广泛启用配对的同时让一个平台更安静。

## 快速命令

定义自定义命令，无需调用 LLM 即可运行 shell 命令 — 零 token 使用，即时执行。特别适用于从消息平台（Telegram、Discord 等）快速服务器检查或实用脚本。

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
```

用法：在任何 CLI 或消息平台中输入 `/status`、`/disk`、`/update` 或 `/gpu`。命令在主机上本地运行并直接返回输出 — 无 LLM 调用，无 token 消耗。

- **30 秒超时** — 长时间运行的命令会被杀死并显示错误消息
- **优先级** — 快速命令在技能命令前检查，因此您可以覆盖技能名称
- **自动补全** — 快速命令在分派时被解析，不出现在内置斜杠命令自动补全表中
- **类型** — 仅支持 `exec`（运行 shell 命令）；其他类型显示错误
- **随处可用** — CLI、Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant

## 人类延迟

在消息平台中模拟类人响应节奏：

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
  max_tool_calls: 50           # 代码执行内的最大工具调用数
```

**`mode`** 控制脚本的工作目录和 Python 解释器：

- **`project`**（默认） — 脚本在会话的工作目录中运行，使用活动的虚拟环境/conda 环境的 python。项目依赖（`pandas`、`torch`、项目包）和相对路径（`.env`、`./data.csv`）自然地解析，与 `terminal()` 所见匹配。
- **`strict`** — 脚本在临时 staging 目录中运行，使用 `sys.executable`（Hermes 自己的 python）。最大可重现性，但项目依赖和相对路径不会解析。

环境清理（剥离 `*_API_KEY`、`*_TOKEN`、`*_SECRET`、`*_PASSWORD`、`*_CREDENTIAL`、`*_PASSWD`、`*_AUTH`）和应用相同的工具白名单在两种模式下都适用 — 切换模式不会改变安全态势。

## 网络搜索后端

`web_search`、`web_extract` 和 `web_crawl` 工具支持四个后端提供商。在 `config.yaml` 或 `hermes tools` 中配置后端：

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

**后端选择：** 如果未设置 `web.backend`，则根据可用的 API 密钥自动检测后端。如果仅设置了 `EXA_API_KEY`，则使用 Exa。如果仅设置了 `TAVILY_API_KEY`，则使用 Tavily。如果仅设置了 `PARALLEL_API_KEY`，则使用 Parallel。否则 Firecrawl 是默认值。

**自托管 Firecrawl：** 设置 `FIRECRAWL_API_URL` 指向您自己的实例。设置自定义 URL 时，API 密钥变为可选（在服务器上设置 `USE_DB_AUTHENTICATION=false` 以禁用认证）。

**Parallel 搜索模式：** 设置 `PARALLEL_SEARCH_MODE` 控制搜索行为 — `fast`、`one-shot` 或 `agentic`（默认：`agentic`）。

## 浏览器

配置浏览器自动化行为：

```yaml
browser:
  inactivity_timeout: 120        # 空闲前的秒数后自动关闭会话
  command_timeout: 30             # 浏览器命令的超时（秒）（屏幕截图、导航等）
  record_sessions: false         # 自动录制浏览器会话为 WebM 视频到 ~/.hermes/browser_recordings/
  camofox:
    managed_persistence: false   # 启用时，Camofox 会话在重启间持久化 cookie/登录
```

浏览器工具集支持多个提供商。有关 Browserbase、Browser Use 和本地 Chrome CDP 设置的详细信息，请参见 [Browser feature page](/docs/user-guide/features/browser)。

## 时区

使用 IANA 时区字符串覆盖服务器本地时区。影响日志中的时间戳、cron 调度和系统提示时间注入。

```yaml
timezone: "America/New_York"   # IANA 时区（默认："" = 服务器本地时间）
```

支持值：任何 IANA 时区标识符（例如 `America/New_York`、`Europe/London`、`Asia/Kolkata`、`UTC`）。留空或省略以使用服务器本地时间。

## Discord

为消息网关配置 Discord 特定行为：

```yaml
discord:
  require_mention: true          # 在服务器频道中需要 @mention 才能响应
  free_response_channels: ""     # 无需 @mention 即可响应的逗号分隔频道 ID
  auto_thread: true              # 在频道中 @mention 时自动创建线程
```

- `require_mention` — 当 `true`（默认）时，机器人在服务器频道中仅在用 `@BotName` 提及时才响应。DM 无需提及即可工作。
- `free_response_channels` — 逗号分隔的频道 ID 列表，机器人在其中响应每条消息而无需提及。
- `auto_thread` — 当 `true`（默认）时，频道中的提及会自动创建用于对话的线程，保持频道整洁（类似于 Slack 线程）。

## 安全

预执行安全扫描和机密信息脱敏：

```yaml
security:
  redact_secrets: true           # 在工具输出和日志中脱敏 API 密钥模式
  tirith_enabled: true           # 为终端命令启用 Tirith 安全扫描
  tirith_path: "tirith"          # Tirith 二进制文件的路径（默认：$PATH 中的 "tirith"）
  tirith_timeout: 5              # 等待 tirith 扫描的超时（秒）
  tirith_fail_open: true         # 如果 tirith 不可用则允许命令执行
  website_blocklist:             # 见下方网站黑名单部分
    enabled: false
    domains: []
    shared_files: []
```

- `redact_secrets` — 自动检测并在进入对话上下文和日志之前检测和脱敏看起来像 API 密钥、令牌和密码的模式。
- `tirith_enabled` — 当 `true` 时，终端命令在执行前由 [Tirith](https://github.com/StackGuardian/tirith) 扫描以检测潜在的危险操作。
- `tirith_path` — Tirith 二进制文件的路径。如果 tirith 安装在非标准位置，请设置此值。
- `tirith_timeout` — 等待 tirith 扫描的最大秒数。如果扫描超时，命令会继续执行。
- `tirith_fail_open` — 当 `true`（默认）时，如果 tirith 不可用或失败，命令仍会执行。设置为 `false` 以在 tirith 无法验证时阻止命令。

## 网站黑名单

阻止代理的网络和浏览器工具访问特定域名：

```yaml
security:
  website_blocklist:
    enabled: false               # 启用 URL 阻止（默认：false）
    domains:                     # 被阻止的域名模式列表
      - "*.internal.company.com"
      - "admin.example.com"
      - "*.local"
    shared_files:                # 从外部文件加载附加规则
      - "/etc/hermes/blocked-sites.txt"
```

启用时，任何匹配被阻止域名模式的 URL 都会被网络和浏览器工具执行前拒绝。这适用于 `web_search`、`web_extract`、`browser_navigate` 以及任何访问 URL 的工具。

域名规则支持：
- 精确域名：`admin.example.com`
- 通配符子域：`*.internal.company.com`（阻塞所有子域）
- TLD 通配符：`*.local`

共享文件包含每行一个域名规则（空白行和 `#` 注释被忽略）。缺失或不可读的文件记录警告但不会禁用其他网络工具。

策略缓存 30 秒，因此配置更改会快速生效而无需重启。

## 智能批准

控制 Hermes 如何处理潜在危险的命令：

```yaml
approvals:
  mode: manual   # manual | smart | off
```

| 模式 | 行为 |
|------|----------|
| `manual`（默认） | 在执行任何标记命令前提示用户。在 CLI 中显示交互式批准对话框。在消息中排队待处理的批准请求。 |
| `smart` | 使用辅助 LLM 评估标记命令是否确实危险。低风险命令被自动批准并具有会话级持久性。真正有风险的命令会升级给用户。 |
| `off` | 跳过所有批准检查。等同于 `HERMES_YOLO_MODE=true`。**谨慎使用。** |

智能模式特别有用减少批准疲劳 — 它让代理在安全操作上更自主工作，同时仍能捕获真正的破坏性命令。

:::warning
设置 `approvals.mode: off` 会禁用终端命令的所有安全检查。仅在受信任的沙盒环境中使用。
:::

## 检查点

破坏性文件操作前的自动文件系统快照。有关详细信息，请参见 [Checkpoints & Rollback](/docs/user-guide/checkpoints-and-rollback)。

```yaml
checkpoints:
  enabled: true                  # 启用自动检查点（也：hermes --checkpoints）
  max_snapshots: 50              # 每个目录保留的最大检查点数
```

## 委托

配置委托工具的子代理行为：

```yaml
delegation:
  # model: "google/gemini-3-flash-preview"  # 覆盖模型（空 = 继承父级）
  # provider: "openrouter"                  # 覆盖提供商（空 = 继承父级）
  # base_url: "http://localhost:1234/v1"    # 直接 OpenAI-compatible 端点（优先于提供商）
  # api_key: "local-key"                    # base_url 的 API 密钥（回退到 OPENAI_API_KEY）
```

**子代理 provider:model 覆盖：** 默认情况下，子代理继承父代理的提供商和模型。设置 `delegation.provider` 和 `delegation.model` 可将子代理路由到不同的 provider:model 对 — 例如，对窄范围子任务使用便宜/快速模型，而您的主代理运行昂贵的推理模型。

**直接端点覆盖：** 如果您想要明显的自定义端点路径，请设置 `delegation.base_url`、`delegation.api_key` 和 `delegation.model`。这将子代理直接发送到该 OpenAI-compatible 端点，并优先于 `delegation.provider`。如果省略 `delegation.api_key`，Hermes 仅回退到 `OPENAI_API_KEY`。

委托提供商使用与 CLI/网关启动相同的凭据解析。支持所有配置的提供商：`openrouter`、`nous`、`copilot`、`zai`、`kimi-coding`、`minimax`、`minimax-cn`。设置提供商时，系统会自动解析正确的 base URL、API 密钥和 API 模式 — 无需手动凭据接线。

**优先级：** `delegation.base_url` 在配置中 → `delegation.provider` 在配置中 → 父提供商（继承）。`delegation.model` 在配置中 → 父模型（继承）。仅设置 `model` 而不设置 `provider` 会更改模型名称而保持父凭据（在同一提供商内切换模型的有用方式，如 OpenRouter）。

## 澄清

配置澄清提示行为：

```yaml
clarify:
  timeout: 120                 # 等待用户澄清响应的秒数
```

## 上下文文件（SOUL.md, AGENTS.md）

Hermes 使用两个不同的上下文范围：

| 文件 | 目的 | 范围 |
|------|---------|-------|
| `SOUL.md` | **主要代理身份** — 定义代理是谁（系统提示中的插槽 #1） | `~/.hermes/SOUL.md` 或 `$HERMES_HOME/SOUL.md` |
| `.hermes.md` / `HERMES.md` | 项目特定说明（最高优先级） | 走向 git 根 |
| `AGENTS.md` | 项目特定说明、编码约定 | 递归目录遍历 |
| `CLAUDE.md` | Claude Code 上下文文件（也被检测） | 仅工作目录 |
| `.cursorrules` | Cursor IDE 规则（也被检测） | 仅工作目录 |
| `.cursor/rules/*.mdc` | Cursor 规则文件（也被检测） | 仅工作目录 |

- **SOUL.md** 是代理的主要身份。它占据系统提示中的插槽 #1，完全替换内置默认身份。编辑它以完全自定义代理是谁。
- 如果 SOUL.md 缺失、为空或无法加载，Hermes 会回退到内置默认身份。
- **项目上下文文件使用优先级系统** — 仅加载一种类型（第一个匹配获胜）：`.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`。SOUL.md 总是独立加载。
- **AGENTS.md** 是分层的：如果子目录也有 AGENTS.md，则全部组合。
- Hermes 会在不存在时自动播种默认 `SOUL.md`。
- 所有加载的上下文文件限制为 20,000 字符的智能截断。

另请参见：
- [Personality & SOUL.md](/docs/user-guide/features/personality)
- [Context Files](/docs/user-guide/features/context-files)

## 工作目录

| 上下文 | 默认值 |
|---------|---------|
| **CLI (`hermes`)** | 您运行命令的当前目录 |
| **消息网关** | 主目录 `~`（使用 `MESSAGING_CWD` 覆盖） |
| **Docker / Singularity / Modal / SSH** | 容器或远程机器中的用户主目录 |

覆盖工作目录：
```bash
# 在 ~/.hermes/.env 或 ~/.hermes/config.yaml 中：
MESSAGING_CWD=/home/myuser/projects    # Gateway 会话
TERMINAL_CWD=/workspace                # 所有终端会话
```