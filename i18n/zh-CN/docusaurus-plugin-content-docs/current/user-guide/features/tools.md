---
sidebar_position: 1
title: "工具与工具集"
description: "Hermes智能体的工具概述——可用工具、工具集工作原理及终端后端"
---

# 工具与工具集

工具是扩展智能体能力的函数。它们被组织成逻辑上的**工具集**，可以根据每个平台启用或禁用。

## 可用工具

Hermes 自带一个广泛的内置工具注册表，涵盖网络搜索、浏览器自动化、终端执行、文件编辑、记忆、委派、强化学习训练、消息传递、家庭助手等功能。

:::note
**Honcho 跨会话记忆** 是作为一个记忆提供者插件（`plugins/memory/honcho/`）提供的，而非内置工具集。请参阅 [插件](./plugins.md) 了解安装方式。
:::

高级分类：

| 类别 | 示例 | 描述 |
|----------|----------|-------------|
| **网络** | `web_search`, `web_extract` | 搜索网络并提取页面内容。 |
| **X 搜索** | `x_search` | 通过 xAI 内置的 `x_search` Responses 工具搜索 X（Twitter）帖子和讨论串 —— 需要 xAI 凭据（SuperGrok OAuth 或 `XAI_API_KEY`）；默认关闭，可通过 `hermes tools` → 🐦 X (Twitter) Search 选择启用。 |
| **终端与文件** | `terminal`, `process`, `read_file`, `patch` | 执行命令和操作文件。 |
| **浏览器** | `browser_navigate`, `browser_snapshot`, `browser_vision` | 交互式浏览器自动化，支持文本和视觉模式。 |
| **媒体** | `vision_analyze`, `image_generate`, `video_generate`, `video_analyze`, `text_to_speech` | 多模态分析与生成。`video_generate` 和 `video_analyze` 是选择性启用的（通过 `hermes tools` 或 `--toolsets` 添加 `video_gen` / `video` 工具集）。 |
| **智能体编排** | `todo`, `clarify`, `execute_code`, `delegate_task` | 规划、澄清、代码执行和子智能体委派。 |
| **记忆与召回** | `memory`, `session_search` | 持久化记忆和会话搜索。 |
| **自动化与交付** | `cronjob`, `send_message` | 带有创建/列出/更新/暂停/恢复/运行/删除操作的定时任务，以及出站消息传递。 |
| **集成** | `ha_*`, MCP 服务器工具, `rl_*` | 家庭助手、MCP、强化学习训练及其他集成。 |

有关权威的代码生成注册表，请参阅 [内置工具参考](/reference/tools-reference) 和 [工具集参考](/reference/toolsets-reference)。

:::tip Nous 工具网关
付费的 [Nous Portal](https://portal.nousresearch.com) 订阅用户可以通过 **[工具网关](tool-gateway.md)** 使用网络搜索、图像生成、TTS 和浏览器自动化 —— 无需单独的 API 密钥。运行 `hermes model` 来启用它，或使用 `hermes tools` 配置单个工具。
:::

## 使用工具集

```bash
# 使用特定的工具集
hermes chat --toolsets "web,terminal"

# 查看所有可用工具
hermes tools

# 按平台配置工具（交互式）
hermes tools
```

常见工具集包括 `web`、`search`、`terminal`、`file`、`browser`、`vision`、`image_gen`、`moa`、`skills`、`tts`、`todo`、`memory`、`session_search`、`cronjob`、`code_execution`、`delegation`、`clarify`、`homeassistant`、`messaging`、`spotify`、`discord`、`discord_admin`、`debugging`、`safe` 和 `rl`。

请参阅 [工具集参考](/reference/toolsets-reference) 了解完整集合，包括平台预设（如 `hermes-cli`、`hermes-telegram`）和动态 MCP 工具集（如 `mcp-<server>`）。

## 终端后端

终端工具可以在不同的环境中执行命令：

| 后端 | 描述 | 用例 |
|---------|-------------|----------|
| `local` | 在您的机器上运行（默认） | 开发，可信任务 |
| `docker` | 隔离的容器 | 安全性，可复现性 |
| `ssh` | 远程服务器 | 沙盒化，让智能体远离自身代码 |
| `singularity` | HPC 容器 | 集群计算，免 root |
| `modal` | 云执行 | 无服务器，可扩展 |
| `daytona` | 云沙盒工作区 | 持久化远程开发环境 |
| `vercel_sandbox` | Vercel Sandbox 云微虚拟机 | 基于快照的文件系统持久化的云执行 |

### 配置

```yaml
# 在 ~/.hermes/config.yaml 中
terminal:
  backend: local    # 或：docker, ssh, singularity, modal, daytona, vercel_sandbox
  cwd: "."          # 工作目录
  timeout: 180      # 命令超时时间（秒）
```

### Docker 后端

```yaml
terminal:
  backend: docker
  docker_image: python:3.11-slim
```

**单个持久化容器，整个进程共享。** Hermes 在首次使用时启动一个长生命周期容器（`docker run -d ... sleep 2h`），并将每个终端、文件和 `execute_code` 调用通过 `docker exec` 路由到同一个容器中。工作目录的更改、安装的软件包、环境调整以及写入 `/workspace` 的文件都会从一次工具调用延续到下一次，跨越 `/new`、`/reset` 和 `delegate_task` 子智能体，在整个 Hermes 进程的生命周期内有效。容器在关闭时停止并删除。

这意味着 Docker 后端的行为像一个持久化的沙盒虚拟机，而不是每个命令一个新容器。如果您执行了一次 `pip install foo`，它会在会话的剩余时间里保留。如果您 `cd /workspace/project`，后续的 `ls` 调用会看到该目录。有关完整的生命周期详情以及控制 `/workspace` 和 `/root` 是否在 Hermes 重启后保留的 `container_persistent` 标志，请参阅 [配置 → Docker 后端](../configuration.md#docker-backend)。

### SSH 后端

推荐用于安全性——智能体无法修改自身代码：

```yaml
terminal:
  backend: ssh
```
```bash
# 在 ~/.hermes/.env 中设置凭据
TERMINAL_SSH_HOST=my-server.example.com
TERMINAL_SSH_USER=myuser
TERMINAL_SSH_KEY=~/.ssh/id_rsa
```

### Singularity/Apptainer

```bash
# 为并行工作者预先构建 SIF
apptainer build ~/python.sif docker://python:3.11-slim

# 配置
hermes config set terminal.backend singularity
hermes config set terminal.singularity_image ~/python.sif
```

### Modal（无服务器云）

```bash
uv pip install modal
modal setup
hermes config set terminal.backend modal
```

### Vercel Sandbox

```bash
pip install 'hermes-agent[vercel]'
hermes config set terminal.backend vercel_sandbox
hermes config set terminal.vercel_runtime node24
```

使用 `VERCEL_TOKEN`、`VERCEL_PROJECT_ID` 和 `VERCEL_TEAM_ID` 这三者进行认证。这种访问令牌设置是部署和在 Render、Railway、Docker 及类似主机上运行正常长时程 Hermes 进程的受支持路径。支持的运行时包括 `node24`、`node22` 和 `python3.13`；Hermes 默认将 `/vercel/sandbox` 作为远程工作区根目录。

对于一次性本地开发，Hermes 也接受短期有效的 Vercel OIDC 令牌：

```bash
VERCEL_OIDC_TOKEN="$(vc project token <project-name>)" hermes chat
```

从已链接的 Vercel 项目目录：

```bash
VERCEL_OIDC_TOKEN="$(vc project token)" hermes chat
```

当 `container_persistent: true` 时，Hermes 使用 Vercel 快照为同一任务跨沙盒重建保留文件系统状态。这可以包括 Hermes 同步的凭据、技能和缓存文件（位于沙盒内）。快照不保留活动进程、PID 空间或同一活动的沙盒身份。

后台终端命令使用 Hermes 的通用非本地进程流：在沙盒存活期间，生成、轮询、等待、日志记录和终止都通过常规进程工具进行，但 Hermes 不提供原生的 Vercel 分离进程恢复功能（在清理或重启后）。

将 `container_disk` 保持未设置或使用共享默认值 `51200`；自定义磁盘大小不支持 Vercel Sandbox，并且诊断/后端创建会失败。

### 容器资源

为所有容器后端配置 CPU、内存、磁盘和持久性：

```yaml
terminal:
  backend: docker  # 或 singularity, modal, daytona, vercel_sandbox
  container_cpu: 1              # CPU 核心数（默认：1）
  container_memory: 5120        # 内存（MB）（默认：5GB）
  container_disk: 51200         # 磁盘（MB）（默认：50GB）
  container_persistent: true    # 跨会话持久化文件系统（默认：true）
```

当 `container_persistent: true` 时，安装的软件包、文件和配置会在会话间保留。

### 容器安全

所有容器后端运行时都带有安全加固：

- 只读根文件系统（Docker）
- 丢弃所有 Linux capabilities
- 无权限提升
- PID 限制（256 个进程）
- 完全的命名空间隔离
- 通过卷实现持久化工作区，而非可写根层

Docker 可以选择性地通过 `terminal.docker_forward_env` 接收显式的环境变量允许列表，但转发的变量对容器内的命令可见，应被视为暴露给该会话。

## 后台进程管理

启动后台进程并进行管理：

```python
terminal(command="pytest -v tests/", background=true)
# 返回：{"session_id": "proc_abc123", "pid": 12345}

# 然后使用 process 工具进行管理：
process(action="list")       # 显示所有运行中的进程
process(action="poll", session_id="proc_abc123")   # 检查状态
process(action="wait", session_id="proc_abc123")   # 阻塞直到完成
process(action="log", session_id="proc_abc123")    # 完整输出
process(action="kill", session_id="proc_abc123")   # 终止
process(action="write", session_id="proc_abc123", data="y")  # 发送输入
```

伪终端模式（`pty=true`）支持像 Codex 和 Claude Code 这样的交互式命令行工具。

## Sudo 支持

如果命令需要 sudo，系统会提示您输入密码（会话内缓存）。或者在 `~/.hermes/.env` 中设置 `SUDO_PASSWORD`。

:::warning
在消息传递平台上，如果 sudo 失败，输出会包含一个提示，建议将 `SUDO_PASSWORD` 添加到 `~/.hermes/.env`。
:::