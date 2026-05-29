---
sidebar_position: 1
title: "工具与工具集"
description: "Hermes Agent 工具概览 — 可用工具、工具集工作原理及终端后端"
---

# 工具与工具集

工具是扩展智能体能力的函数。它们被组织成逻辑性的**工具集**，可以根据平台启用或禁用。

## 可用工具

Hermes 附带了一个广泛的内置工具注册表，涵盖网络搜索、浏览器自动化、终端执行、文件编辑、记忆、委派、RL 训练、消息传递、家庭助手等。

:::note
**Honcho 跨会话记忆** 可作为内存提供者插件使用 (`plugins/memory/honcho/`)，而非内置工具集。请参阅 [插件](./plugins.md) 进行安装。
:::

高级分类：

| 类别 | 示例 | 描述 |
|----------|----------|-------------|
| **网络** | `web_search`, `web_extract` | 搜索网络并提取页面内容。 |
| **X 搜索** | `x_search` | 通过 xAI 内置的 `x_search` 响应工具搜索 X (Twitter) 帖子和话题串 — 需要 xAI 凭据（SuperGrok OAuth 或 `XAI_API_KEY`）；默认关闭，可通过 `hermes tools` → 🐦 X (Twitter) Search 启用。 |
| **终端与文件** | `terminal`, `process`, `read_file`, `patch` | 执行命令并操作文件。 |
| **浏览器** | `browser_navigate`, `browser_snapshot`, `browser_vision` | 支持文本和视觉的交互式浏览器自动化。 |
| **媒体** | `vision_analyze`, `image_generate`, `video_generate`, `video_analyze`, `text_to_speech` | 多模态分析与生成。`video_generate` 和 `video_analyze` 需要通过 `hermes tools` 或 `--toolsets` 添加 `video_gen` / `video` 工具集来启用。 |
| **智能体编排** | `todo`, `clarify`, `execute_code`, `delegate_task` | 计划、澄清、代码执行和子智能体委派。 |
| **记忆与召回** | `memory`, `session_search` | 持久记忆和会话搜索。 |
| **自动化与交付** | `cronjob`, `send_message` | 支持创建/列出/更新/暂停/恢复/运行/移除操作的计划任务，以及出站消息传递。 |
| **集成** | `ha_*`, MCP 服务器工具, `rl_*` | 家庭助手、MCP、RL 训练和其他集成。 |

有关权威的、源自代码的注册表，请参阅 [内置工具参考](/reference/tools-reference) 和 [工具集参考](/reference/toolsets-reference)。

:::tip Nous 工具网关
付费 [Nous Portal](https://portal.nousresearch.com) 订阅者可以通过 **[工具网关](tool-gateway.md)** 使用网络搜索、图像生成、TTS 和浏览器自动化 — 无需单独的 API 密钥。运行 `hermes model` 以启用它，或使用 `hermes tools` 配置单独工具。
:::

## 使用工具集

```bash
# 使用特定工具集
hermes chat --toolsets "web,terminal"

# 查看所有可用工具
hermes tools

# 按平台配置工具（交互式）
hermes tools
```

常见工具集包括 `web`, `search`, `terminal`, `file`, `browser`, `vision`, `image_gen`, `moa`, `skills`, `tts`, `todo`, `memory`, `session_search`, `cronjob`, `code_execution`, `delegation`, `clarify`, `homeassistant`, `messaging`, `spotify`, `discord`, `discord_admin`, `debugging`, `safe` 和 `rl`。

请参阅 [工具集参考](/reference/toolsets-reference) 了解完整集合，包括平台预设如 `hermes-cli`、`hermes-telegram`，以及动态 MCP 工具集如 `mcp-<server>`。

## 终端后端

终端工具可以在不同环境中执行命令：

| 后端 | 描述 | 用例 |
|---------|-------------|----------|
| `local` | 在您的机器上运行（默认） | 开发、受信任任务 |
| `docker` | 隔离容器 | 安全性、可重现性 |
| `ssh` | 远程服务器 | 沙箱化，使智能体远离其自身代码 |
| `singularity` | HPC 容器 | 集群计算、无根权限 |
| `modal` | 云执行 | 无服务器、可扩展 |
| `daytona` | 云沙箱工作区 | 持久化远程开发环境 |

### 配置

```yaml
# 在 ~/.hermes/config.yaml 中
terminal:
  backend: local    # 或：docker, ssh, singularity, modal, daytona
  cwd: "."          # 工作目录
  timeout: 180      # 命令超时时间（秒）
```

### Docker 后端

```yaml
terminal:
  backend: docker
  docker_image: python:3.11-slim
```

**一个持久容器，在整个进程内共享。** Hermes 在首次使用时启动一个长生命周期的容器 (`docker run -d ... sleep 2h`)，并将所有终端、文件和 `execute_code` 调用通过 `docker exec` 路由到同一个容器。工作目录的更改、安装的软件包、环境调整以及写入 `/workspace` 的文件，在整个 Hermes 进程的生命周期内，会从一个工具调用持续到下一个，跨越 `/new`、`/reset` 和 `delegate_task` 子智能体。容器在关闭时停止并移除。

这意味着 Docker 后端的行为类似于一个持久的沙箱虚拟机，而不是每个命令一个新容器。如果您 `pip install foo` 一次，它将在会话剩余时间内可用。如果您 `cd /workspace/project`，后续的 `ls` 调用会看到该目录。有关完整生命周期详细信息以及控制 `/workspace` 和 `/root` 是否在 Hermes 重启后持久存在的 `container_persistent` 标志，请参阅 [配置 → Docker 后端](../configuration.md#docker-backend)。

### SSH 后端

出于安全考虑推荐 — 智能体无法修改其自身代码：

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
# 为并行工作者预构建 SIF
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

### 容器资源

为所有容器后端配置 CPU、内存、磁盘和持久性：

```yaml
terminal:
  backend: docker  # 或 singularity, modal, daytona
  container_cpu: 1              # CPU 核心数（默认：1）
  container_memory: 5120        # 内存（MB）（默认：5GB）
  container_disk: 51200         # 磁盘（MB）（默认：50GB）
  container_persistent: true    # 跨会话持久化文件系统（默认：true）
```

当 `container_persistent: true` 时，安装的软件包、文件和配置将在会话之间保留。

### 容器安全性

所有容器后端都运行时带有安全加固：

- 只读根文件系统（Docker）
- 丢弃所有 Linux 能力
- 无特权提升
- PID 限制（256 个进程）
- 完全命名空间隔离
- 通过卷实现持久化工作空间，而非可写根层

Docker 可以选择通过 `terminal.docker_forward_env` 接收显式的环境变量允许列表，但转发的变量对容器内的命令可见，应视为对该会话暴露。

## 后台进程管理

启动后台进程并管理它们：

```python
terminal(command="pytest -v tests/", background=true)
# 返回: {"session_id": "proc_abc123", "pid": 12345}

# 然后使用 process 工具进行管理：
process(action="list")       # 显示所有运行中的进程
process(action="poll", session_id="proc_abc123")   # 检查状态
process(action="wait", session_id="proc_abc123")   # 阻塞直到完成
process(action="log", session_id="proc_abc123")    # 完整输出
process(action="kill", session_id="proc_abc123")   # 终止
process(action="write", session_id="proc_abc123", data="y")  # 发送输入
```

PTY 模式 (`pty=true`) 启用 Codex 和 Claude Code 等交互式命令行工具。

## Sudo 支持

如果命令需要 sudo，系统将提示您输入密码（在会话内缓存）。或者，在 `~/.hermes/.env` 中设置 `SUDO_PASSWORD`。

:::warning
在消息传递平台上，如果 sudo 失败，输出将包含在 `~/.hermes/.env` 中添加 `SUDO_PASSWORD` 的提示。
:::