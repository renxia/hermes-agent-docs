---
sidebar_position: 1
title: "工具和工具集"
description: "Hermes 智能体的工具概览——可用功能、工具集的工作方式以及终端后端。"
---

# 工具和工具集

工具是扩展智能体能力的函数。它们被组织成逻辑性的**工具集**，可以针对不同平台启用或禁用。

## 可用工具

Hermes 内置了广泛的工具注册表，涵盖网页搜索、浏览器自动化、终端执行、文件编辑、内存管理、委托、RL 训练、消息传递、Home Assistant 等功能。

:::note
**Honcho 会话间记忆**以内存提供者插件（`plugins/memory/honcho/`）的形式可用，而不是内置工具集。请参阅 [Plugins](./plugins.md) 以进行安装。
:::

高级类别：

| 类别 | 示例 | 描述 |
|----------|----------|-------------|
| **Web** | `web_search`, `web_extract` | 搜索网页并提取页面内容。 |
| **X Search** | `x_search` | 通过 xAI 内置的 `x_search` Responses 工具搜索 X（Twitter）帖子和线程——受限于 xAI 凭证（SuperGrok OAuth 或 `XAI_API_KEY`）；默认禁用，可通过 `hermes tools` → 🐦 X (Twitter) 搜索启用。 |
| **Terminal & Files** | `terminal`, `process`, `read_file`, `patch` | 执行命令和操作文件。 |
| **Browser** | `browser_navigate`, `browser_snapshot`, `browser_vision` | 支持文本和视觉的交互式浏览器自动化。 |
| **Media** | `vision_analyze`, `image_generate`, `text_to_speech` | 多模态分析和生成。 |
| **Agent orchestration** | `todo`, `clarify`, `execute_code`, `delegate_task` | 规划、澄清、代码执行和子智能体委托。 |
| **Memory & recall** | `memory`, `session_search` | 持久化内存和会话搜索。 |
| **Automation & delivery** | `cronjob`, `send_message` | 定时任务，具有创建/列表/更新/暂停/恢复/运行/移除等操作，以及消息传出。 |
| **Integrations** | `ha_*`, MCP server tools | Home Assistant、MCP 和其他集成。 |

有关权威的代码衍生注册表，请参阅 [Built-in Tools Reference](/reference/tools-reference) 和 [Toolsets Reference](/reference/toolsets-reference)。

:::tip Nous Tool Gateway
付费的 [Nous Portal](https://portal.nousresearch.com) 订阅用户可以通过**[工具网关](tool-gateway.md)**使用网页搜索、图像生成、TTS 和浏览器自动化——无需单独的 API 密钥。运行 `hermes model` 即可启用，或通过 `hermes tools` 配置单个工具。
:::

## 使用工具集

```bash
# 使用特定的工具集
hermes chat --toolsets "web,terminal"

# 查看所有可用的工具
hermes tools

# 交互式地配置平台工具
hermes tools
```

常见的工具集包括 `web`、`search`、`terminal`、`file`、`browser`、`vision`、`image_gen`、`skills`、`tts`、`todo`、`memory`、`session_search`、`cronjob`、`code_execution`、`delegation`、`clarify`、`homeassistant`、`messaging`、`spotify`、`discord`、`discord_admin`、`debugging` 和 `safe`。

有关完整的工具集列表，包括 `hermes-cli`、`hermes-telegram` 等平台预设和动态 MCP 工具集如 `mcp-<server>`，请参阅 [Toolsets Reference](/reference/toolsets-reference)。

## 终端后端

终端工具可以在不同的环境中执行命令：

| 后端 | 描述 | 用例 |
|---------|-------------|----------|
| `local` | 在您的机器上运行（默认） | 开发、可信任务 |
| `docker` | 隔离容器 | 安全性、可复现性 |
| `ssh` | 远程服务器 | 沙箱化，使智能体远离自己的代码 |
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

**一个持久的容器，在整个过程中共享。** Hermes 在首次使用时会启动一个长期运行的容器（`docker run -d ... sleep 2h`），并将每一次终端、文件和 `execute_code` 调用通过 `docker exec` 路由到同一个容器中。工作目录更改、已安装的软件包、环境调整以及写入 `/workspace` 的文件都会从一次工具调用延续到下一次，跨越 `/new`、`/reset` 和 `delegate_task` 子智能体，直到 Hermes 进程终止。容器在关闭时会被停止和移除。

这意味着 Docker 后端表现为一个持久的沙箱虚拟机，而不仅仅是每个命令的一次性容器。如果你运行一次 `pip install foo`，它就会保留到会话结束。如果你运行 `cd /workspace/project`，后续的 `ls` 调用就能看到那个目录。有关完整的生命周期细节以及控制 `/workspace` 和 `/root` 是否跨 Hermes 重启生存的 `container_persistent` 标志，请参阅 [Configuration → Docker Backend](../configuration.md#docker-backend)。

### SSH 后端

推荐用于安全——智能体无法修改自己的代码：

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
# 预构建 SIF 以供并行工作者使用
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
  container_cpu: 1              # CPU 核数（默认值：1）
  container_memory: 5120        # 内存（MB，默认值：5GB）
  container_disk: 51200         # 磁盘空间（MB，默认值：50GB）
  container_persistent: true    # 是否跨会话持久化文件系统（默认值：true）
```

当 `container_persistent: true` 时，已安装的软件包、文件和配置都会在会话之间保持不变。

### 容器安全

所有容器后端都进行了安全加固：

- 只读根文件系统（Docker）
- 所有 Linux 能力均被剥离
- 不允许权限提升
- PID 限制（256 个进程）
- 完全的命名空间隔离
- 通过卷而非可写根层实现的持久化工作区

Docker 可选择通过 `terminal.docker_forward_env` 接收显式的环境变量白名单，但转发的变量对容器内的命令是可见的，应将其视为对该会话暴露。

## 后台进程管理

启动后台进程并进行管理：

```python
terminal(command="pytest -v tests/", background=true)
# 返回: {"session_id": "proc_abc123", "pid": 12345}

# 然后使用 process 工具进行管理：
process(action="list")       # 显示所有正在运行的进程
process(action="poll", session_id="proc_abc123")   # 检查状态
process(action="wait", session_id="proc_abc123")   # 阻塞直到完成
process(action="log", session_id="proc_abc123")    # 获取完整输出
process(action="kill", session_id="proc_abc123")   # 终止进程
process(action="write", session_id="proc_abc123", data="y")  # 发送输入
```

PTY 模式（`pty=true`）支持 Codex 和 Claude Code 等交互式 CLI 工具。

## Sudo 支持

如果某个命令需要 sudo，系统会提示您输入密码（该密码会在会话中缓存）。或者在 `~/.hermes/.env` 中设置 `SUDO_PASSWORD`。

:::warning
在消息平台中，如果 sudo 失败，输出会包含一个提示，说明需要将 `SUDO_PASSWORD` 添加到 `~/.hermes/.env` 中。
:::