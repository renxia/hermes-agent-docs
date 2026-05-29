---
title: "原生 Mcp — MCP 客户端：连接服务器、注册工具（标准输入/输出、HTTP）"
sidebar_label: "原生 Mcp"
description: "MCP 客户端：连接服务器、注册工具（标准输入/输出、HTTP）"
---

{/* 本页面由网站脚本 generate-skill-docs.py 根据技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 原生 Mcp

MCP 客户端：连接服务器、注册工具（标准输入/输出、HTTP）。

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
以下是Hermes加载的完整技能定义，当此技能被触发时生效。这是智能体在技能激活时看到的指令。
:::

# 原生MCP客户端

Hermes智能体内置MCP客户端，在启动时连接MCP服务器，发现其工具，并将其作为智能体可直接调用的一等工具。无需桥接CLI——来自MCP服务器的工具与内置工具（如`terminal`、`read_file`等）并列显示。

## 使用场景

在以下情况下使用此功能：
- 从Hermes智能体内部连接MCP服务器并使用其工具
- 通过MCP添加外部能力（文件系统访问、GitHub、数据库、API）
- 运行基于本地stdio的MCP服务器（npx、uvx或任何命令）
- 连接远程HTTP/StreamableHTTP MCP服务器
- 在每次对话中自动发现并可用MCP工具

如需从终端临时一次性调用MCP工具而无需任何配置，请参见`mcporter`技能。

## 前提条件

- **mcp Python包** —— 可选依赖；使用`pip install mcp`安装。如未安装，MCP支持将被静默禁用。
- **Node.js** —— 运行基于`npx`的MCP服务器（大多数社区服务器）所需
- **uv** —— 运行基于`uvx`的MCP服务器（基于Python的服务器）所需

安装MCP SDK：

```bash
pip install mcp
# 或者，如果使用uv：
uv pip install mcp
```

## 快速开始

在`~/.hermes/config.yaml`的`mcp_servers`键下添加MCP服务器：

```yaml
mcp_servers:
  time:
    command: "uvx"
    args: ["mcp-server-time"]
```

重启Hermes智能体。启动时它将：
1. 连接到服务器
2. 发现可用工具
3. 以`mcp_time_*`前缀注册它们
4. 将它们注入所有平台工具集

然后你可以自然地使用这些工具——只需让智能体获取当前时间。

## 配置参考

`mcp_servers`下的每个条目都是映射到其配置的服务器名称。有两种传输类型：**stdio**（基于命令）和**HTTP**（基于url）。

### Stdio传输（命令+参数）

```yaml
mcp_servers:
  server_name:
    command: "npx"             # （必需）要运行的可执行文件
    args: ["-y", "pkg-name"]   # （可选）命令参数，默认：[]
    env:                       # （可选）子进程的环境变量
      SOME_API_KEY: "value"
    timeout: 120               # （可选）每次工具调用超时时间（秒），默认：120
    connect_timeout: 60        # （可选）初始连接超时时间（秒），默认：60
```

### HTTP传输（url）

```yaml
mcp_servers:
  server_name:
    url: "https://my-server.example.com/mcp"   # （必需）服务器URL
    headers:                                     # （可选）HTTP头
      Authorization: "Bearer sk-..."
    timeout: 180               # （可选）每次工具调用超时时间（秒），默认：120
    connect_timeout: 60        # （可选）初始连接超时时间（秒），默认：60
```

### 所有配置选项

| 选项              | 类型   | 默认值 | 描述                                              |
|-------------------|--------|--------|---------------------------------------------------|
| `command`         | string | --     | 要运行的可执行文件（stdio传输，必需）             |
| `args`            | list   | `[]`   | 传递给命令的参数                                  |
| `env`             | dict   | `{}`   | 子进程的额外环境变量                              |
| `url`             | string | --     | 服务器URL（HTTP传输，必需）                       |
| `headers`         | dict   | `{}`   | 随每个请求发送的HTTP头                            |
| `timeout`         | int    | `120`  | 每次工具调用超时时间（秒）                        |
| `connect_timeout` | int    | `60`   | 初始连接和发现的超时时间（秒）                    |

注意：服务器配置必须包含`command`（stdio）或`url`（HTTP），但不能同时包含两者。

## 工作原理

### 启动发现

当Hermes智能体启动时，在工具初始化期间会调用`discover_mcp_tools()`：

1. 从`~/.hermes/config.yaml`读取`mcp_servers`
2. 对于每个服务器，在专用的后台事件循环中启动连接
3. 初始化MCP会话并调用`list_tools()`以发现可用工具
4. 将每个工具注册到Hermes工具注册表

### 工具命名约定

MCP工具使用以下命名模式注册：

```
mcp_{server_name}_{tool_name}
```

名称中的连字符和点号被替换为下划线，以兼容LLM API。

示例：
- 服务器`filesystem`，工具`read_file` → `mcp_filesystem_read_file`
- 服务器`github`，工具`list-issues` → `mcp_github_list_issues`
- 服务器`my-api`，工具`fetch.data` → `mcp_my_api_fetch_data`

### 自动注入

发现后，MCP工具会自动注入所有`hermes-*`平台工具集（CLI、Discord、Telegram等）。这意味着MCP工具在每次对话中都可用，无需任何额外配置。

### 连接生命周期

- 每个服务器作为长时间运行的asyncio任务在后台守护线程中运行
- 连接在智能体进程的生命周期内持续存在
- 如果连接断开，将启动自动重连，采用指数退避策略（最多5次重试，最大退避60秒）
- 智能体关闭时，所有连接都会被优雅关闭

### 幂等性

`discover_mcp_tools()`是幂等的——多次调用只会连接到尚未连接的服务器。失败的服务器会在后续调用中重试。

## 传输类型

### Stdio传输

最常见的传输方式。Hermes将MCP服务器作为子进程启动，并通过stdin/stdout进行通信。

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
```

子进程继承一个**过滤后的**环境（参见下面的安全部分），加上你在`env`中指定的任何变量。

### HTTP / StreamableHTTP传输

用于远程或共享的MCP服务器。要求`mcp`包包含HTTP客户端支持（`mcp.client.streamable_http`）。

```yaml
mcp_servers:
  remote_api:
    url: "https://mcp.example.com/mcp"
    headers:
      Authorization: "Bearer sk-..."
```

如果你安装的`mcp`版本不支持HTTP，服务器将因ImportError失败，其他服务器将继续正常运行。

## 安全

### 环境变量过滤

对于stdio服务器，Hermes **不会**将完整的shell环境传递给MCP子进程。只继承安全的基线变量：

- `PATH`、`HOME`、`USER`、`LANG`、`LC_ALL`、`TERM`、`SHELL`、`TMPDIR`
- 任何`XDG_*`变量

所有其他环境变量（API密钥、令牌、密钥）都被排除，除非你通过`env`配置键明确添加它们。这可以防止意外将凭据泄漏给不受信任的MCP服务器。

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      # 只有此令牌会被传递给子进程
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."
```

### 错误消息中的凭据剥离

如果MCP工具调用失败，错误消息中任何类似凭据的模式都会在显示给LLM之前被自动编辑。这涵盖：

- GitHub PATs（`ghp_...`）
- OpenAI风格的密钥（`sk-...`）
- Bearer令牌
- 通用的`token=`、`key=`、`API_KEY=`、`password=`、`secret=`模式

## 故障排除

### "MCP SDK不可用 -- 跳过MCP工具发现"

`mcp` Python包未安装。请安装：

```bash
pip install mcp
```

### "没有配置MCP服务器"

`~/.hermes/config.yaml`中没有`mcp_servers`键，或者它是空的。请至少添加一个服务器。

### "连接MCP服务器'X'失败"

常见原因：
- **命令未找到**：`command`二进制文件不在PATH中。确保`npx`、`uvx`或相关命令已安装。
- **包未找到**：对于npx服务器，npm包可能不存在，或者可能需要在args中添加`-y`以自动安装。
- **超时**：服务器启动时间过长。增加`connect_timeout`。
- **端口冲突**：对于HTTP服务器，URL可能不可访问。

### "MCP服务器'X'需要HTTP传输，但mcp.client.streamable_http不可用"

你的`mcp`包版本不包含HTTP客户端支持。请升级：

```bash
pip install --upgrade mcp
```

### 工具未出现

- 检查服务器是否列在`mcp_servers`下（不是`mcp`或`servers`）
- 确保YAML缩进正确
- 查看Hermes智能体启动日志以获取连接消息
- 工具名称以`mcp_{server}_{tool}`为前缀——查找该模式

### 连接持续断开

客户端最多重试5次，采用指数退避策略（1秒、2秒、4秒、8秒、16秒，上限60秒）。如果服务器根本无法访问，它在5次尝试后会放弃。请检查服务器进程和网络连接。

## 示例

### 时间服务器（uvx）

```yaml
mcp_servers:
  time:
    command: "uvx"
    args: ["mcp-server-time"]
```

注册工具如`mcp_time_get_current_time`。

### 文件系统服务器（npx）

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/documents"]
    timeout: 30
```

注册工具如`mcp_filesystem_read_file`、`mcp_filesystem_write_file`、`mcp_filesystem_list_directory`。

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

注册工具如`mcp_github_list_issues`、`mcp_github_create_pull_request`等。

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

所有服务器的所有工具都被注册并同时可用。每个服务器的工具以其名称为前缀以避免冲突。

## 采样（服务器发起的大语言模型请求）

Hermes 支持 MCP 的 `sampling/createMessage` 功能——MCP 服务器可以在工具执行期间通过智能体请求大语言模型补全。这使得智能体可以参与到工作流中（数据分析、内容生成、决策制定）。

**采样默认已启用**。可按服务器进行配置：

```yaml
mcp_servers:
  my_server:
    command: "npx"
    args: ["-y", "my-mcp-server"]
    sampling:
      enabled: true           # 默认值: true
      model: "gemini-3-flash" # 模型覆盖（可选）
      max_tokens_cap: 4096    # 每次请求的最大令牌数
      timeout: 30             # 大语言模型调用超时（秒）
      max_rpm: 10             # 每分钟最大请求数
      allowed_models: []      # 模型白名单（空列表 = 全部允许）
      max_tool_rounds: 5      # 工具循环限制（0 = 禁用）
      log_level: "info"       # 审计日志详细程度
```

服务器还可以在采样请求中包含 `tools`，以实现多轮工具增强工作流。`max_tool_rounds` 配置可防止无限的工具循环。通过 `get_mcp_status()` 可跟踪每个服务器的审计指标（请求数、错误数、令牌数、工具使用次数）。

对于不受信任的服务器，请使用 `sampling: { enabled: false }` 禁用采样。

## 注意事项

- 从智能体的视角来看，MCP 工具是同步调用的，但它们在专用的后台事件循环上异步运行。
- 工具结果以 JSON 形式返回，格式为 `{"result": "..."}` 或 `{"error": "..."}`。
- 原生 MCP 客户端独立于 `mcporter`——你可以同时使用两者。
- 服务器连接是持久化的，并在同一个智能体进程的所有对话间共享。
- 添加或移除服务器需要重启智能体（目前不支持热重载）。