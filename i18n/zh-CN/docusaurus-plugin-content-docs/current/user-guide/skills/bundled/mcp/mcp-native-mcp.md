---
title: "原生 Mcp — MCP 客户端：连接服务器，注册工具（stdio/HTTP）"
sidebar_label: "原生 Mcp"
description: "MCP 客户端：连接服务器，注册工具（stdio/HTTP）"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 从该技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# 原生 Mcp

MCP 客户端：连接服务器，注册工具（stdio/HTTP）。

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
| 相关技能 | [`mcporter`](/docs/user-guide/skills/optional/mcp/mcp-mcporter) |

:::info
以下是Hermes在此技能激活时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 原生MCP客户端

Hermes智能体内置了一个MCP客户端，它在启动时连接到MCP服务器，发现它们的工具，并将它们作为智能体可以直接调用的一等工具。无需任何桥接CLI工具——来自MCP服务器的工具会与`terminal`、`read_file`等内置工具一同出现。

## 适用场景

在以下情况下使用此功能：
- 连接MCP服务器并在Hermes智能体中使用它们的工具
- 通过MCP添加外部能力（文件系统访问、GitHub、数据库、API）
- 运行本地基于stdio的MCP服务器（npx、uvx或任何命令）
- 连接远程HTTP/StreamableHTTP MCP服务器
- 让MCP工具被自动发现并在每次对话中可用

如果需要从终端临时、一次性调用MCP工具而无需配置任何东西，请参阅`mcporter`技能。

## 前提条件

- **mcp Python包** —— 可选依赖；通过`pip install mcp`安装。如果未安装，MCP支持将被静默禁用。
- **Node.js** —— 基于`npx`的MCP服务器（大多数社区服务器）所需
- **uv** —— 基于`uvx`的MCP服务器（基于Python的服务器）所需

安装MCP SDK：

```bash
pip install mcp
# 或者，如果使用uv：
uv pip install mcp
```

## 快速入门

在`~/.hermes/config.yaml`的`mcp_servers`键下添加MCP服务器：

```yaml
mcp_servers:
  time:
    command: "uvx"
    args: ["mcp-server-time"]
```

重启Hermes智能体。启动时它将会：
1.  连接到服务器
2.  发现可用的工具
3.  使用前缀`mcp_time_*`注册它们
4.  将它们注入所有平台工具集中

然后你就可以自然地使用这些工具——直接让智能体获取当前时间即可。

## 配置参考

`mcp_servers`下的每个条目是一个服务器名称映射到其配置。有两种传输类型：**stdio**（基于命令）和**HTTP**（基于URL）。

### Stdio传输（命令+参数）

```yaml
mcp_servers:
  server_name:
    command: "npx"             # （必需）要运行的可执行文件
    args: ["-y", "pkg-name"]   # （可选）命令参数，默认: []
    env:                       # （可选）子进程的环境变量
      SOME_API_KEY: "value"
    timeout: 120               # （可选）每次工具调用的超时时间（秒），默认: 120
    connect_timeout: 60        # （可选）初始连接超时时间（秒），默认: 60
```

### HTTP传输（URL）

```yaml
mcp_servers:
  server_name:
    url: "https://my-server.example.com/mcp"   # （必需）服务器URL
    headers:                                     # （可选）HTTP头
      Authorization: "Bearer sk-..."
    timeout: 180               # （可选）每次工具调用的超时时间（秒），默认: 120
    connect_timeout: 60        # （可选）初始连接超时时间（秒），默认: 60
```

### 所有配置选项

| 选项            | 类型   | 默认值 | 描述                                             |
|----------------|--------|---------|------------------------------------------------|
| `command`      | string | --      | 要运行的可执行文件（stdio传输，必需）         |
| `args`         | list   | `[]`    | 传递给命令的参数                              |
| `env`          | dict   | `{}`    | 子进程的额外环境变量                          |
| `url`          | string | --      | 服务器URL（HTTP传输，必需）                   |
| `headers`      | dict   | `{}`    | 随每个请求发送的HTTP头                        |
| `timeout`      | int    | `120`   | 每次工具调用的超时时间（秒）                  |
| `connect_timeout` | int  | `60`    | 初始连接和发现的超时时间                      |

注意：服务器配置必须包含`command`（stdio）或`url`（HTTP）之一，但不能同时包含两者。

## 工作原理

### 启动时发现

当Hermes智能体启动时，`discover_mcp_tools()`会在工具初始化期间被调用：

1.  从`~/.hermes/config.yaml`读取`mcp_servers`
2.  对于每个服务器，在专用的后台事件循环中生成一个连接
3.  初始化MCP会话并调用`list_tools()`以发现可用工具
4.  在Hermes工具注册表中注册每个工具

### 工具命名约定

MCP工具的注册命名模式为：

```
mcp_{服务器名}_{工具名}
```

名称中的连字符和点号会被替换为下划线，以确保与LLM API的兼容性。

示例：
- 服务器`filesystem`，工具`read_file` → `mcp_filesystem_read_file`
- 服务器`github`，工具`list-issues` → `mcp_github_list_issues`
- 服务器`my-api`，工具`fetch.data` → `mcp_my_api_fetch_data`

### 自动注入

发现完成后，MCP工具会自动注入到所有`hermes-*`平台工具集（CLI、Discord、Telegram等）。这意味着MCP工具在每次对话中都可用，无需任何额外配置。

### 连接生命周期

- 每个服务器作为长期运行的asyncio任务在后台守护线程中运行
- 连接在智能体进程的生命周期内持续存在
- 如果连接断开，自动重连机制将启动（使用指数退避，最多重试5次，最大退避时间60秒）
- 智能体关闭时，所有连接将被优雅地关闭

### 幂等性

`discover_mcp_tools()`是幂等的——多次调用只会连接到尚未连接的服务器。失败的服务器将在后续调用中被重试。

## 传输类型

### Stdio传输

最常见的传输方式。Hermes将MCP服务器作为子进程启动，并通过stdin/stdout进行通信。

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
```

子进程继承**经过过滤的**环境（参见下面的安全部分），外加你在`env`中指定的任何变量。

### HTTP / StreamableHTTP传输

用于远程或共享的MCP服务器。需要`mcp`包包含HTTP客户端支持（`mcp.client.streamable_http`）。

```yaml
mcp_servers:
  remote_api:
    url: "https://mcp.example.com/mcp"
    headers:
      Authorization: "Bearer sk-..."
```

如果你安装的`mcp`版本不包含HTTP支持，服务器将以ImportError失败，其他服务器将继续正常运行。

## 安全

### 环境变量过滤

对于stdio服务器，Hermes**不会**将完整的shell环境传递给MCP子进程。只有安全的基线变量会被继承：

- `PATH`、`HOME`、`USER`、`LANG`、`LC_ALL`、`TERM`、`SHELL`、`TMPDIR`
- 任何`XDG_*`变量

所有其他环境变量（API密钥、令牌、密钥）都会被排除，除非你通过`env`配置键显式添加它们。这可以防止意外地将凭据泄漏给不受信任的MCP服务器。

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      # 只有这个令牌会传递给子进程
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."
```

### 错误消息中的凭据剥离

如果MCP工具调用失败，错误消息中任何类似凭据的模式都会在显示给LLM之前被自动编辑。这包括：

- GitHub PAT（`ghp_...`）
- OpenAI风格的密钥（`sk-...`）
- Bearer令牌
- 通用的`token=`、`key=`、`API_KEY=`、`password=`、`secret=`模式

## 故障排除

### “MCP SDK不可用 -- 跳过MCP工具发现”

`mcp` Python包未安装。请安装它：

```bash
pip install mcp
```

### “没有配置MCP服务器”

`~/.hermes/config.yaml`中没有`mcp_servers`键，或者它是空的。请至少添加一个服务器。

### “连接MCP服务器‘X’失败”

常见原因：
- **命令未找到**：`command`可执行文件不在PATH中。确保`npx`、`uvx`或相关命令已安装。
- **包未找到**：对于npx服务器，npm包可能不存在，或者可能需要在args中添加`-y`以自动安装。
- **超时**：服务器启动耗时过长。增加`connect_timeout`。
- **端口冲突**：对于HTTP服务器，URL可能无法访问。

### “MCP服务器‘X’需要HTTP传输，但mcp.client.streamable_http不可用”

你安装的`mcp`包版本不包含HTTP客户端支持。请升级：

```bash
pip install --upgrade mcp
```

### 工具未出现

- 检查服务器是否列在`mcp_servers`下（而不是`mcp`或`servers`）
- 确保YAML缩进正确
- 查看Hermes智能体启动日志中的连接消息
- 工具名称以`mcp_{服务器}_{工具}`为前缀——查找该模式

### 连接持续断开

客户端最多重试5次，使用指数退避（1秒、2秒、4秒、8秒、16秒，上限为60秒）。如果服务器根本无法访问，它将在5次尝试后放弃。请检查服务器进程和网络连接。

## 示例

### 时间服务器 (uvx)

```yaml
mcp_servers:
  time:
    command: "uvx"
    args: ["mcp-server-time"]
```

注册如`mcp_time_get_current_time`之类的工具。

### 文件系统服务器 (npx)

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/documents"]
    timeout: 30
```

注册如`mcp_filesystem_read_file`、`mcp_filesystem_write_file`、`mcp_filesystem_list_directory`之类的工具。

### 带认证的GitHub服务器

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxxxxxxxxxxxxxxxxxxx"
    timeout: 60
```

注册如`mcp_github_list_issues`、`mcp_github_create_pull_request`等工具。

### 远程HTTP服务器

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

### 多个服务器

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

所有服务器的所有工具都会被注册并同时可用。每个服务器的工具都以其名称为前缀，以避免冲突。

## 采样（服务器发起的LLM请求）

Hermes 支持 MCP 的 `sampling/createMessage` 能力 — MCP 服务器可以在工具执行期间通过智能体请求 LLM 补全。这使得智能体能够参与工作流程（数据分析、内容生成、决策制定）。

采样功能**默认启用**。可针对每个服务器进行配置：

```yaml
mcp_servers:
  my_server:
    command: "npx"
    args: ["-y", "my-mcp-server"]
    sampling:
      enabled: true           # 默认值：true
      model: "gemini-3-flash" # 模型覆盖（可选）
      max_tokens_cap: 4096    # 每次请求的最大 token 数
      timeout: 30             # LLM 调用超时时间（秒）
      max_rpm: 10             # 每分钟最大请求数
      allowed_models: []      # 模型白名单（空列表表示允许所有）
      max_tool_rounds: 5      # 工具循环限制（0 表示禁用）
      log_level: "info"       # 审计详细程度
```

服务器还可以在采样请求中包含 `tools`，以实现多轮工具增强的工作流程。`max_tool_rounds` 配置可防止无限的工具循环。通过 `get_mcp_status()` 跟踪每个服务器的审计指标（请求数、错误数、token 使用量、工具调用次数）。

对于不受信任的服务器，可通过 `sampling: { enabled: false }` 禁用采样功能。

## 注意事项

- 从智能体的视角来看，MCP 工具是同步调用的，但它们在专用的后台事件循环上异步运行
- 工具结果以 JSON 格式返回，格式为 `{"result": "..."}` 或 `{"error": "..."}`
- 原生 MCP 客户端与 `mcporter` 独立 — 两者可以同时使用
- 服务器连接是持久化的，并在同一智能体进程的所有对话间共享
- 添加或删除服务器需要重启智能体（目前不支持热重载）