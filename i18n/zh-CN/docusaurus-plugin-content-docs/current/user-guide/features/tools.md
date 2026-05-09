---
sidebar_position: 1
title: "工具与工具集"
description: "Hermes 智能体工具概览 —— 可用工具、工具集工作原理以及终端后端"
---

# 工具与工具集

工具是扩展智能体能力的函数。它们被组织成逻辑上的**工具集**，可按平台启用或禁用。

## 可用工具

Hermes 内置了广泛的工具注册表，涵盖网页搜索、浏览器自动化、终端执行、文件编辑、记忆、委派、强化学习训练、消息传递、Home Assistant 等。

:::note
**Honcho 跨会话记忆** 作为记忆提供程序插件（`plugins/memory/honcho/`）提供，而非内置工具集。请参见 [插件](./plugins.md) 了解安装方法。
:::

高级别分类：

| 分类 | 示例 | 描述 |
|----------|----------|-------------|
| **网页** | `web_search`、`web_extract` | 搜索网页并提取页面内容。 |
| **终端与文件** | `terminal`、`process`、`read_file`、`patch` | 执行命令并操作文件。 |
| **浏览器** | `browser_navigate`、`browser_snapshot`、`browser_vision` | 支持文本和视觉的交互式浏览器自动化。 |
| **媒体** | `vision_analyze`、`image_generate`、`text_to_speech` | 多模态分析与生成。 |
| **智能体编排** | `todo`、`clarify`、`execute_code`、`delegate_task` | 规划、澄清、代码执行以及子智能体委派。 |
| **记忆与召回** | `memory`、`session_search` | 持久化记忆与会话搜索。 |
| **自动化与传递** | `cronjob`、`send_message` | 支持创建/列出/更新/暂停/恢复/运行/删除操作的定时任务，以及出站消息传递。 |
| **集成** | `ha_*`、MCP 服务器工具、`rl_*` | Home Assistant、MCP、强化学习训练及其他集成。 |

有关权威代码派生的注册表，请参见 [内置工具参考](/docs/reference/tools-reference) 和 [工具集参考](/docs/reference/toolsets-reference)。

:::tip Nous 工具网关
付费 [Nous Portal](https://portal.nousresearch.com) 订阅者可通过 **[工具网关](tool-gateway.md)** 使用网页搜索、图像生成、TTS 和浏览器自动化 —— 无需单独的 API 密钥。运行 `hermes model` 以启用它，或使用 `hermes tools` 配置单个工具。
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

常见工具集包括 `web`、`search`、`terminal`、`file`、`browser`、`vision`、`image_gen`、`moa`、`skills`、`tts`、`todo`、`memory`、`session_search`、`cronjob`、`code_execution`、`delegation`、`clarify`、`homeassistant`、`messaging`、`spotify`、`discord`、`discord_admin`、`debugging`、`safe` 和 `rl`。

完整工具集（包括 `hermes-cli`、`hermes-telegram` 等平台预设以及 `mcp-<server>` 等动态 MCP 工具集）请参见 [工具集参考](/docs/reference/toolsets-reference)。

## 终端后端

终端工具可在不同环境中执行命令：

| 后端 | 描述 | 使用场景 |
|---------|-------------|----------|
| `local` | 在本地机器上运行（默认） | 开发、可信任务 |
| `docker` | 隔离容器 | 安全性、可重现性 |
| `ssh` | 远程服务器 | 沙箱化、防止智能体修改自身代码 |
| `singularity` | HPC 容器 | 集群计算、无 root 权限 |
| `modal` | 云端执行 | 无服务器、可扩展 |
| `daytona` | 云端沙箱工作区 | 持久化远程开发环境 |
| `vercel_sandbox` | Vercel Sandbox 云端微虚拟机 | 支持快照备份文件系统持久化的云端执行 |

### 配置

```yaml
# 在 ~/.hermes/config.yaml 中
terminal:
  backend: local    # 或: docker, ssh, singularity, modal, daytona, vercel_sandbox
  cwd: "."          # 工作目录
  timeout: 180      # 命令超时时间（秒）
```

### Docker 后端

```yaml
terminal:
  backend: docker
  docker_image: python:3.11-slim
```

**一个持久化容器，在整个进程中共享。** Hermes 首次使用时启动一个长期运行的容器（`docker run -d ... sleep 2h`），并通过 `docker exec` 将所有终端、文件和 `execute_code` 调用路由到同一容器中。工作目录变更、已安装包、环境调整以及写入 `/workspace` 的文件，都会在一次工具调用到下一次调用之间保留，跨越 `/new`、`/reset` 和 `delegate_task` 子智能体，直至 Hermes 进程结束。容器在关闭时停止并移除。

这意味着 Docker 后端的行为类似于持久化沙箱虚拟机，而非每个命令都使用新容器。如果您执行一次 `pip install foo`，它将在整个会话期间保留。如果您执行 `cd /workspace/project`，后续的 `ls` 调用将看到该目录。有关完整生命周期详情以及控制 `/workspace` 和 `/root` 是否在 Hermes 重启后保留的 `container_persistent` 标志，请参见 [配置 → Docker 后端](../configuration.md#docker-backend)。

### SSH 后端

推荐用于安全性 —— 智能体无法修改其自身代码：

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
# 为并行工作线程预构建 SIF
apptainer build ~/python.sif docker://python:3.11-slim

# 配置
hermes config set terminal.backend singularity
hermes config set terminal.singularity_image ~/python.sif
```

### Modal（无服务器云端）

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

使用 `VERCEL_TOKEN`、`VERCEL_PROJECT_ID` 和 `VERCEL_TEAM_ID` 三者进行身份验证。此访问令牌设置是 Render、Railway、Docker 及类似主机上部署和正常运行长期运行 Hermes 进程的受支持路径。支持的运行时包括 `node24`、`node22` 和 `python3.13`；Hermes 默认将 `/vercel/sandbox` 作为远程工作区根目录。

对于一次性本地开发，Hermes 也接受短期 Vercel OIDC 令牌：

```bash
VERCEL_OIDC_TOKEN="$(vc project token <project-name>)" hermes chat
```

从已关联的 Vercel 项目目录中：

```bash
VERCEL_OIDC_TOKEN="$(vc project token)" hermes chat
```

当 `container_persistent: true` 时，Hermes 使用 Vercel 快照来保留同一任务跨沙箱重建的文件系统状态。这可能包括沙箱内 Hermes 同步的凭据、技能和缓存文件。快照不保留实时进程、PID 空间或相同的实时沙箱身份。

后台终端命令使用 Hermes 通用非本地流程：在沙箱存活期间，spawn、poll、wait、log 和 kill 通过正常的进程工具工作，但 Hermes 在清理或重启后不提供原生的 Vercel 分离进程恢复功能。

保持 `container_disk` 未设置或设为共享默认值 `51200`；Vercel Sandbox 不支持自定义磁盘大小，否则将导致诊断/后端创建失败。

### 容器资源

为所有容器后端配置 CPU、内存、磁盘和持久化：

```yaml
terminal:
  backend: docker  # 或 singularity, modal, daytona, vercel_sandbox
  container_cpu: 1              # CPU 核心数（默认：1）
  container_memory: 5120        # 内存（MB）（默认：5GB）
  container_disk: 51200         # 磁盘（MB）（默认：50GB）
  container_persistent: true    # 跨会话持久化文件系统（默认：true）
```

当 `container_persistent: true` 时，已安装包、文件和配置将在会话之间保留。

### 容器安全

所有容器后端均以安全加固方式运行：

- 只读根文件系统（Docker）
- 所有 Linux 能力已丢弃
- 无权限提升
- PID 限制（256 个进程）
- 完整命名空间隔离
- 通过卷实现持久化工作区，而非可写根层

Docker 可通过 `terminal.docker_forward_env` 选择接收显式环境变量白名单，但转发的变量对容器内的命令可见，应视为对该会话暴露。

## 后台进程管理

启动后台进程并管理它们：

```python
terminal(command="pytest -v tests/", background=true)
# 返回: {"session_id": "proc_abc123", "pid": 12345}

# 然后使用 process 工具管理：
process(action="list")       # 显示所有运行中的进程
process(action="poll", session_id="proc_abc123")   # 检查状态
process(action="wait", session_id="proc_abc123")   # 阻塞直至完成
process(action="log", session_id="proc_abc123")    # 完整输出
process(action="kill", session_id="proc_abc123")   # 终止
process(action="write", session_id="proc_abc123", data="y")  # 发送输入
```

PTY 模式（`pty=true`）启用 Codex 和 Claude Code 等交互式 CLI 工具。

## Sudo 支持

如果命令需要 sudo，系统将提示您输入密码（会话期间缓存）。或在 `~/.hermes/.env` 中设置 `SUDO_PASSWORD`。

:::warning
在消息传递平台上，如果 sudo 失败，输出将包含提示，建议将 `SUDO_PASSWORD` 添加到 `~/.hermes/.env`。
:::