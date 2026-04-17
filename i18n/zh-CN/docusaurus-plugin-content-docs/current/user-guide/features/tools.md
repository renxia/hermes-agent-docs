---
sidebar_position: 1
title: "工具与工具集"
description: "概览 Hermes Agent 的工具——可用的工具、工具集的工作原理以及终端后端"
---

# 工具与工具集

工具是扩展 Agent 能力的函数。它们被组织成逻辑性的**工具集**，这些工具集可以针对不同的平台启用或禁用。

## 可用工具

Hermes 内置了广泛的工具注册表，涵盖了网络搜索、浏览器自动化、终端执行、文件编辑、内存、任务委托、RL 训练、消息传递、Home Assistant 等功能。

:::note
**Honcho 跨会话内存**作为内存提供程序插件（`plugins/memory/honcho/`）可用，而非内置工具集。有关安装，请参阅 [插件](./plugins.md)。
:::

高层类别：

| 类别 | 示例 | 描述 |
|----------|----------|-------------|
| **网络** | `web_search`, `web_extract` | 搜索网络并提取页面内容。 |
| **终端与文件** | `terminal`, `process`, `read_file`, `patch` | 执行命令和操作文件。 |
| **浏览器** | `browser_navigate`, `browser_snapshot`, `browser_vision` | 支持文本和视觉的交互式浏览器自动化。 |
| **媒体** | `vision_analyze`, `image_generate`, `text_to_speech` | 多模态分析和生成。 |
| **Agent 编排** | `todo`, `clarify`, `execute_code`, `delegate_task` | 规划、澄清、代码执行和子 Agent 委托。 |
| **内存与召回** | `memory`, `session_search` | 持久化内存和会话搜索。 |
| **自动化与交付** | `cronjob`, `send_message` | 定时任务（具有创建/列出/更新/暂停/恢复/运行/移除操作），以及出站消息传递。 |
| **集成** | `ha_*`, MCP 服务器工具, `rl_*` | Home Assistant、MCP、RL 训练和其他集成。 |

有关权威的代码派生注册表，请参阅 [内置工具参考](/docs/reference/tools-reference) 和 [工具集参考](/docs/reference/toolsets-reference)。

:::tip Nous 工具网关
付费 [Nous Portal](https://portal.nousresearch.com) 订阅用户可以通过 **[工具网关](tool-gateway.md)** 使用网络搜索、图像生成、TTS 和浏览器自动化——无需单独的 API 密钥。运行 `hermes model` 即可启用它，或使用 `hermes tools` 配置单个工具。
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

常见的工具集包括 `web`、`terminal`、`file`、`browser`、`vision`、`image_gen`、`moa`、`skills`、`tts`、`todo`、`memory`、`session_search`、`cronjob`、`code_execution`、`delegation`、`clarify`、`homeassistant` 和 `rl`。

有关完整集合，包括 `hermes-cli`、`hermes-telegram` 等平台预设以及 `mcp-<server>` 等动态 MCP 工具集，请参阅 [工具集参考](/docs/reference/toolsets-reference)。

## 终端后端

终端工具可以在不同的环境中执行命令：

| 后端 | 描述 | 用例 |
|---------|-------------|----------|
| `local` | 在您的机器上运行（默认） | 开发、可信任务 |
| `docker` | 隔离容器 | 安全性、可复现性 |
| `ssh` | 远程服务器 | 沙箱化、使 Agent 远离自身代码 |
| `singularity` | HPC 容器 | 集群计算、无根权限 |
| `modal` | 云执行 | 无服务器、扩展性 |
| `daytona` | 云沙箱工作区 | 持久化的远程开发环境 |

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

### SSH 后端

推荐用于安全目的——Agent 无法修改自身代码：

```yaml
terminal:
  backend: ssh
```
```bash
# 在 ~/.hermes/.env 中设置凭证
TERMINAL_SSH_HOST=my-server.example.com
TERMINAL_SSH_USER=myuser
TERMINAL_SSH_KEY=~/.ssh/id_rsa
```

### Singularity/Apptainer

```bash
# 为并行工作进程预构建 SIF
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

配置所有容器后端的 CPU、内存、磁盘和持久性：

```yaml
terminal:
  backend: docker  # 或 singularity, modal, daytona
  container_cpu: 1              # CPU 核心数（默认：1）
  container_memory: 5120        # 内存（MB）（默认：5GB）
  container_disk: 51200         # 磁盘（MB）（默认：50GB）
  container_persistent: true    # 是否跨会话持久化文件系统（默认：true）
```

当 `container_persistent: true` 时，安装的包、文件和配置会在会话间保留。

### 容器安全

所有容器后端都运行着安全加固措施：

- 只读根文件系统（Docker）
- 移除所有 Linux 能力
- 不允许权限提升
- PID 限制（256 个进程）
- 完全命名空间隔离
- 通过卷实现持久化工作区，而非可写根层

Docker 可通过 `terminal.docker_forward_env` 可选地接收明确的环境变量白名单，但转发的变量对容器内的命令可见，应将其视为对该会话暴露。

## 后台进程管理

启动后台进程并进行管理：

```python
terminal(command="pytest -v tests/", background=true)
# 返回：{"session_id": "proc_abc123", "pid": 12345}

# 然后使用 process 工具进行管理：
process(action="list")       # 显示所有运行进程
process(action="poll", session_id="proc_abc123")   # 检查状态
process(action="wait", session_id="proc_abc123")   # 阻塞直到完成
process(action="log", session_id="proc_abc123")    # 完整输出
process(action="kill", session_id="proc_abc123")   # 终止
process(action="write", session_id="proc_abc123", data="y")  # 发送输入
```

PTY 模式（`pty=true`）启用了 Codex 和 Claude Code 等交互式 CLI 工具。

## Sudo 支持

如果某个命令需要 sudo，系统会提示您输入密码（并在会话中缓存）。或者在 `~/.hermes/.env` 中设置 `SUDO_PASSWORD`。

:::warning
在消息平台，如果 sudo 失败，输出中会包含添加 `SUDO_PASSWORD` 到 `~/.hermes/.env` 的提示。
:::