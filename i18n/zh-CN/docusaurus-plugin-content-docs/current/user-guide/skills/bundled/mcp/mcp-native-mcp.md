---
title: "原生 Mcp — MCP 客户端：连接服务器、注册工具 (stdio/HTTP)"
sidebar_label: "Native Mcp"
description: "MCP 客户端：连接服务器、注册工具 (stdio/HTTP)"
---

{/* 本页面由网站脚本/scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源 SKILL.md 文件，而非本页面。 */}

# 原生 Mcp

MCP 客户端：连接服务器、注册工具 (stdio/HTTP)。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/mcp/native-mcp` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `MCP`, `工具`, `集成` |
| 相关技能 | [`mcporter`](/user-guide/skills/optional/mcp/mcp-mcporter) |

:::info
以下是当触发此技能时，Hermes 加载的完整技能定义。这是当技能处于活动状态时，智能体所看到的指令。
:::

# 原生 MCP 客户端

Hermes Agent 内置了一个 MCP 客户端，它在启动时连接到 MCP 服务器，发现其工具，并使这些工具成为智能体可以直接调用的一等工具。无需中间桥接 CLI —— 来自 MCP 服务器的工具会与内置工具（如 `terminal`、`read_file` 等）一同出现。

## 何时使用

在以下情况下使用此功能：
- 连接 MCP 服务器并在 Hermes Agent 内使用其工具
- 通过 MCP 添加外部功能（文件系统访问、GitHub、数据库、API）
- 运行本地基于 stdio 的 MCP 服务器（npx、uvx 或任何命令）
- 连接到远程 HTTP/StreamableHTTP MCP 服务器
- 让 MCP 工具在每次对话中被自动发现和可用

若需从终端进行临时、一次性的 MCP 工具调用且无需任何配置，请参阅 `mcporter` 技能。

## 前提条件

- **mcp Python 包** -- 可选依赖项；通过 `pip install mcp` 安装。如果未安装，MCP 支持将被静默禁用。
- **Node.js** -- 运行 `npx` 类型的 MCP 服务器（大多数社区服务器）所需。
- **uv** -- 运行 `uvx` 类型的 MCP 服务器（基于 Python 的服务器）所需。

安装 MCP SDK：

```bash
pip install mcp
# 或者，如果使用 uv：
uv pip install mcp
```

## 快速开始

在 `~/.hermes/config.yaml` 的 `mcp_servers` 键下添加 MCP 服务器配置：

```yaml
mcp_servers:
  time:
    command: "uvx"
    args: ["mcp-server-time"]
```

重启 Hermes Agent。启动时它将：
1. 连接到服务器
2. 发现可用工具
3. 以 `mcp_time_*` 为前缀注册它们
4. 将它们注入到所有平台工具集中

然后你可以自然地使用这些工具 —— 直接让智能体获取当前时间。

## 配置参考

`mcp_servers` 下的每个条目是服务器名称映射到其配置。有两种传输类型：**stdio**（基于命令）和 **HTTP**（基于 URL）。

### Stdio 传输 (command + args)

```yaml
mcp_servers:
  server_name:
    command: "npx"             # （必需）要运行的可执行文件
    args: ["-y", "pkg-name"]   # （可选）命令参数，默认值：[]
    env:                       # （可选）子进程的环境变量
      SOME_API_KEY: "value"
    timeout: 120               # （可选）每次工具调用的超时时间（秒），默认值：120
    connect_timeout: 60        # （可选）初始连接超时时间（秒），默认值：60
```

### HTTP 传输 (url)

```yaml
mcp_servers:
  server_name:
    url: "https://my-server.example.com/mcp"   # （必需）服务器 URL
    headers:                                     # （可选）HTTP 请求头
      Authorization: "Bearer sk-..."
    timeout: 180               # （可选）每次工具调用的超时时间（秒），默认值：120
    connect_timeout: 60        # （可选）初始连接超时时间（秒），默认值：60
```

### 所有配置选项

| 选项              | 类型   | 默认值 | 描述                                             |
|-------------------|--------|--------|--------------------------------------------------|
| `command`         | 字符串 | --     | 要运行的可执行文件（stdio 传输，必需）           |
| `args`            | 列表   | `[]`   | 传递给命令的参数                                 |
| `env`             | 字典   | `{}`   | 子进程的额外环境变量                             |
| `url`             | 字符串 | --     | 服务器 URL（HTTP 传输，必需）                    |
| `headers`         | 字典   | `{}`   | 随每个请求发送的 HTTP 请求头                     |
| `timeout`         | 整数   | `120`  | 每次工具调用的超时时间（秒）                     |
| `connect_timeout` | 整数   | `60`   | 初始连接和发现的超时时间（秒）                   |

注意：服务器配置必须有 `command`（stdio）或 `url`（HTTP），但不能同时拥有两者。

## 工作原理

### 启动时发现

当 Hermes Agent 启动时，`discover_mcp_tools()` 在工具初始化期间被调用：

1. 从 `~/.hermes/config.yaml` 读取 `mcp_servers`
2. 对于每个服务器，在一个专用的后台事件循环中启动连接
3. 初始化 MCP 会话并调用 `list_tools()` 以发现可用工具
4. 将每个工具注册到 Hermes 工具注册表中

### 工具命名约定

MCP 工具使用以下命名模式注册：

```
mcp_{server_name}_{tool_name}
```

名称中的连字符和点号会替换为下划线，以确保与 LLM API 的兼容性。

示例：
- 服务器 `filesystem`，工具 `read_file` → `mcp_filesystem_read_file`
- 服务器 `github`，工具 `list-issues` → `mcp_github_list_issues`
- 服务器 `my-api`，工具 `fetch.data` → `mcp_my_api_fetch_data`

### 自动注入

发现完成后，MCP 工具会自动注入到所有 `hermes-*` 平台工具集（CLI、Discord、Telegram 等）。这意味着 MCP 工具在每次对话中都可用，无需任何额外配置。

### 连接生命周期

- 每个服务器作为一个长期运行的异步任务，在后台守护线程中运行
- 连接在智能体进程的生命周期内持续存在
- 如果连接断开，将启动具有指数退避的自动重连机制（最多重试 5 次，最大退避时间为 60 秒）
- 在智能体关闭时，所有连接将被优雅地关闭

### 幂等性

`discover_mcp_tools()` 是幂等的 —— 多次调用它只会连接到尚未连接的服务器。失败的服务器将在后续调用中重试。

## 传输类型

### Stdio 传输

最常见的传输方式。Hermes 将 MCP 服务器作为子进程启动，并通过 stdin/stdout 进行通信。

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
```

子进程继承一个**经过过滤**的环境（见下方安全部分）以及您在 `env` 中指定的任何变量。

### HTTP / StreamableHTTP 传输

用于远程或共享的 MCP 服务器。需要 `mcp` 包包含 HTTP 客户端支持（`mcp.client.streamable_http`）。

```yaml
mcp_servers:
  remote_api:
    url: "https://mcp.example.com/mcp"
    headers:
      Authorization: "Bearer sk-..."
```

如果您安装的 `mcp` 版本不支持 HTTP，服务器将因 ImportError 而失败，其他服务器将继续正常运行。

## 安全

### 环境变量过滤

对于 stdio 服务器，Hermes 不会将您完整的 shell 环境传递给 MCP 子进程。仅继承安全的基本变量：

- `PATH`、`HOME`、`USER`、`LANG`、`LC_ALL`、`TERM`、`SHELL`、`TMPDIR`
- 任何 `XDG_*` 变量

所有其他环境变量（API 密钥、令牌、密钥）都会被排除，除非您通过 `env` 配置键明确添加它们。这可防止意外地将凭据泄露给不受信任的 MCP 服务器。

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      # 只有此令牌会传递给子进程
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."
```

### 错误消息中的凭据剥离

如果 MCP 工具调用失败，错误消息中任何类似凭据的模式都会在显示给 LLM 之前被自动编辑。这包括：

- GitHub PATs (`ghp_...`)
- OpenAI 风格的密钥 (`sk-...`)
- Bearer 令牌
- 通用的 `token=`、`key=`、`API_KEY=`、`password=`、`secret=` 模式

## 故障排除

### "MCP SDK not available -- skipping MCP tool discovery"

`mcp` Python 包未安装。安装它：

```bash
pip install mcp
```

### "No MCP servers configured"

`~/.hermes/config.yaml` 中没有 `mcp_servers` 键，或者它是空的。添加至少一个服务器。

### "Failed to connect to MCP server 'X'"

常见原因：
- **Command not found**：`command` 可执行文件不在 PATH 中。确保 `npx`、`uvx` 或相关命令已安装。
- **Package not found**：对于 npx 服务器，npm 包可能不存在，或者可能需要在 args 中添加 `-y` 以进行自动安装。
- **Timeout**：服务器启动时间过长。增加 `connect_timeout`。
- **Port conflict**：对于 HTTP 服务器，URL 可能无法访问。

### "MCP server 'X' requires HTTP transport but mcp.client.streamable_http is not available"

您的 `mcp` 包版本不包含 HTTP 客户端支持。升级：

```bash
pip install --upgrade mcp
```

### 工具未出现

- 检查服务器是否列在 `mcp_servers` 下（而不是 `mcp` 或 `servers`）
- 确保 YAML 缩进正确
- 查看 Hermes Agent 启动日志中的连接消息
- 工具名称带有 `mcp_{server}_{tool}` 前缀 —— 寻找该模式

### 连接持续断开

客户端最多重试 5 次，采用指数退避（1 秒、2 秒、4 秒、8 秒、16 秒，上限为 60 秒）。如果服务器根本无法访问，它会在 5 次尝试后放弃。检查服务器进程和网络连接。

## 示例

### 时间服务器 (uvx)

```yaml
mcp_servers:
  time:
    command: "uvx"
    args: ["mcp-server-time"]
```

注册诸如 `mcp_time_get_current_time` 之类的工具。

### 文件系统服务器 (npx)

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/documents"]
    timeout: 30
```

注册诸如 `mcp_filesystem_read_file`、`mcp_filesystem_write_file`、`mcp_filesystem_list_directory` 之类的工具。

### 带身份验证的 GitHub 服务器

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxxxxxxxxxxxxxxxxxxx"
    timeout: 60
```

注册诸如 `mcp_github_list_issues`、`mcp_github_create_pull_request` 等工具。

### 远程 HTTP 服务器

```yaml
mcp_servers:
  company_api:
    url: "https://mcp.mycompany.com/v1/mcp"
    headers:
      Authorization: "Bearer sk-xxxxxxxxxxxxxxxxxxxx"
      X-Team-Id: "engineering"
    timeout: 180
    connect_timeout: 30
```

### 多服务器

```yaml
mcp_servers:
  time:
    command: "uvx"
    args: ["mcp-server-time"]

  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]

  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxxxxxxxxxxxxxxxxxxx"

  company_api:
    url: "https://mcp.internal.company.com/mcp"
    headers:
      Authorization: "Bearer sk-xxxxxxxxxxxxxxxxxxxx"
    timeout: 300
```

所有服务器的所有工具都会被同时注册和可用。每个服务器的工具都以其名称为前缀，以避免冲突。

## 采样（服务端发起的 LLM 请求）

Hermes 支持 MCP 的 `sampling/createMessage` 功能——MCP 服务器可以在工具执行期间通过智能体请求 LLM 完成。这实现了智能体参与的工作流（数据分析、内容生成、决策制定）。

采样功能**默认启用**。可按服务器配置：

```yaml
mcp_servers:
  my_server:
    command: "npx"
    args: ["-y", "my-mcp-server"]
    sampling:
      enabled: true           # 默认值: true
      model: "gemini-3-flash" # 模型覆盖（可选）
      max_tokens_cap: 4096    # 每次请求的最大令牌数
      timeout: 30             # LLM 调用超时时间（秒）
      max_rpm: 10             # 每分钟最大请求数
      allowed_models: []      # 模型白名单（空列表表示允许所有）
      max_tool_rounds: 5      # 工具循环限制（0 表示禁用）
      log_level: "info"       # 审计详细级别
```

服务器也可以在采样请求中包含 `tools`，以实现多轮工具增强的工作流。`max_tool_rounds` 配置可防止无限工具循环。通过 `get_mcp_status()` 跟踪每个服务器的审计指标（请求数、错误数、令牌数、工具使用次数）。

对于不受信任的服务器，可通过 `sampling: { enabled: false }` 禁用采样。

## 注意事项

- 从智能体的角度看，MCP 工具是同步调用的，但在专用的后台事件循环上异步运行
- 工具结果以 JSON 格式返回，格式为 `{"result": "..."}` 或 `{"error": "..."}`
- 原生 MCP 客户端独立于 `mcporter`——你可以同时使用两者
- 服务器连接是持久化的，并在同一智能体进程的所有对话中共享
- 添加或删除服务器需要重启智能体（目前不支持热重载）