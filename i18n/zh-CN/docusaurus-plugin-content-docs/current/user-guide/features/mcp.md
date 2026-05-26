---
sidebar_position: 4
title: "MCP (模型上下文协议)"
description: "通过MCP将Hermes智能体连接至外部工具服务器——并精确控制Hermes加载哪些MCP工具"
---

# MCP (模型上下文协议)

MCP使得Hermes智能体能够连接到外部工具服务器，从而让智能体可以使用那些不属于Hermes自身的工具——例如GitHub、数据库、文件系统、浏览器栈、内部API等。

如果您曾希望Hermes使用某个已存在于别处的工具，MCP通常是最简洁的实现方式。

## MCP带来的优势

- 无需先编写原生Hermes工具即可访问外部工具生态系统
- 在同一配置中同时支持本地stdio服务器和远程HTTP MCP服务器
- 启动时自动发现并注册工具
- 当服务器支持时，为MCP资源和提示提供实用封装
- 按服务器过滤功能，确保仅向Hermes暴露您实际需要的MCP工具

## 快速开始

1.  安装 MCP 支持（如果使用标准安装脚本，此项已包含）：

```bash
cd ~/.hermes/hermes-agent
uv pip install -e ".[mcp]"
```

2.  在 `~/.hermes/config.yaml` 中添加一个 MCP 服务器：

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
```

3.  启动 Hermes：

```bash
hermes chat
```

4.  请 Hermes 使用 MCP 支持的功能。

例如：

```text
列出 /home/user/projects 中的文件并总结该代码仓库的结构。
```

Hermes 将会发现 MCP 服务器的工具，并像使用其他工具一样使用它们。

## 两种 MCP 服务器

### 标准输入/输出服务器

标准输入/输出服务器作为本地子进程运行，并通过标准输入/输出进行通信。

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
```

在以下情况使用标准输入/输出服务器：
-   服务器安装在本地
-   需要低延迟访问本地资源
-   遵循的 MCP 服务器文档中展示了 `command`、`args` 和 `env` 配置

### HTTP 服务器

HTTP MCP 服务器是 Hermes 直接连接的远程端点。

```yaml
mcp_servers:
  remote_api:
    url: "https://mcp.example.com/mcp"
    headers:
      Authorization: "Bearer ***"
```

在以下情况使用 HTTP 服务器：
-   MCP 服务器托管在其他地方
-   您的组织暴露了内部 MCP 端点
-   不希望 Hermes 为该集成启动本地子进程

### 经过 OAuth 认证的 HTTP 服务器

大多数托管的 MCP 服务器（Linear, Sentry, Atlassian, Asana, Figma, Stripe 等）需要 OAuth 2.1 而非静态的 Bearer 令牌。设置 `auth: oauth`，Hermes 将通过 MCP Python SDK 处理发现、动态客户端注册、PKCE、令牌交换、刷新和升级认证。

```yaml
mcp_servers:
  linear:
    url: "https://mcp.linear.app/mcp"
    auth: oauth
```

首次连接时，Hermes 会打印一个授权 URL，如果可能，会打开您的浏览器，并在本地回环端口上等待 OAuth 回调。令牌缓存在 `~/.hermes/mcp-tokens/<server>.json`，权限为 0o600；后续运行会静默重用这些令牌，直到刷新失败。

**远程/无头主机。** 当 Hermes 运行在与您浏览器不同的机器上时，回环回调无法连接到您的笔记本电脑。有两种方法可以完成认证流程：

-   **粘贴回调（无需设置）：** 在交互式终端中，Hermes 会在授权 URL 旁打印“Or paste the redirect URL here…”。在浏览器中打开该 URL，进行批准，复制浏览器最终到达的完整 URL（重定向会显示连接错误——这是预期的），然后粘贴到提示处。直接粘贴 `?code=…&state=…` 查询字符串也可以。
-   **SSH 端口转发：** 在单独的终端中执行 `ssh -N -L <port>:127.0.0.1:<port> user@host`，然后让重定向正常进行。

有关完整演练，包括无 DCR 的服务器（例如 Slack）、预注册的 `client_id`/`client_secret`、作用域自定义以及通过 `hermes mcp login <server>` 重新认证，请参阅 [通过 SSH/远程主机进行 OAuth](../../guides/oauth-over-ssh.md#mcp-servers)。

**陷阱 — 配置自动重载竞争。** 当您在正在运行的 Hermes 会话中编辑 `~/.hermes/config.yaml` 时，CLI 会在 30 秒超时内自动重载 MCP 连接。这对于交互式 OAuth 流程来说时间不够。请添加条目，然后从一个全新的终端运行 `hermes mcp login <server>`——它会等待完整的 5 分钟让您完成认证。

## 基本配置参考

Hermes 从 `~/.hermes/config.yaml` 的 `mcp_servers` 部分读取 MCP 配置。

### 常用键

| 键                          | 类型   | 含义                                       |
| :-------------------------- | :----- | :----------------------------------------- |
| `command`                   | 字符串 | 用于标准输入/输出 MCP 服务器的可执行程序    |
| `args`                      | 列表   | 标准输入/输出服务器的参数                   |
| `env`                       | 映射   | 传递给标准输入/输出服务器的环境变量         |
| `url`                       | 字符串 | HTTP MCP 端点                              |
| `headers`                   | 映射   | 远程服务器的 HTTP 头                       |
| `timeout`                   | 数字   | 工具调用超时时间                           |
| `connect_timeout`           | 数字   | 初始连接超时时间                           |
| `enabled`                   | 布尔值 | 如果为 `false`，Hermes 将完全跳过该服务器   |
| `supports_parallel_tool_calls` | 布尔值 | 如果为 `true`，来自此服务器的工具可以并发运行 |
| `tools`                     | 映射   | 每个服务器的工具过滤和实用工具策略         |

### 最小标准输入/输出示例

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
```

### 最小 HTTP 示例

```yaml
mcp_servers:
  company_api:
    url: "https://mcp.internal.example.com"
    headers:
      Authorization: "Bearer ***"
```

## 内置预设

对于知名的 MCP 服务器，`hermes mcp add` 接受 `--preset` 标志，该标志会自动填充传输详细信息，这样您就无需查找命令和参数。预设仅提供默认值——您在同一命令行上传递的其他任何内容（环境变量、头信息、过滤）仍然优先。

| 预设    | 功能                                     |
| :------ | :--------------------------------------- |
| `codex` | Codex CLI 的 MCP 服务器（通过标准输入/输出运行 `codex mcp-server`）。要求 PATH 中有 `codex` CLI。 |

```bash
# 一行命令将 Codex CLI 添加为 MCP 服务器
hermes mcp add codex --preset codex
```

这将写入等效于以下内容的配置：

```yaml
mcp_servers:
  codex:
    command: "codex"
    args: ["mcp-server"]
```

您可以选择任意本地名称（`hermes mcp add my-codex --preset codex` 是可以的）；预设仅提供 `command`/`args` 的默认值。

## Hermes 如何注册 MCP 工具

Hermes 为 MCP 工具添加前缀，以避免与内置名称冲突：

```text
mcp_<server_name>_<tool_name>
```

示例：

| 服务器       | MCP 工具        | 注册的名称               |
| :----------- | :-------------- | :----------------------- |
| `filesystem` | `read_file`     | `mcp_filesystem_read_file` |
| `github`     | `create-issue`  | `mcp_github_create_issue`  |
| `my-api`     | `query.data`    | `mcp_my_api_query_data`    |

实际上，通常您不需要手动调用带前缀的名称——Hermes 会看到该工具，并在正常推理过程中选择它。

## MCP 实用工具

在支持的情况下，Hermes 还会围绕 MCP 资源和提示注册实用工具：

-   `list_resources`
-   `read_resource`
-   `list_prompts`
-   `get_prompt`

这些是按服务器注册的，遵循相同的前缀模式，例如：

-   `mcp_github_list_resources`
-   `mcp_github_get_prompt`

### 重要提示

这些实用工具现在具有能力感知：
-   仅当 MCP 会话实际支持资源操作时，Hermes 才会注册资源实用工具
-   仅当 MCP 会话实际支持提示操作时，Hermes 才会注册提示实用工具

因此，一个只暴露可调用工具但不支持资源/提示的服务器不会获得这些额外的包装器。

## 按服务器过滤

您可以控制每个 MCP 服务器向 Hermes 贡献哪些工具，从而实现对工具命名空间的精细管理。

### 完全禁用服务器

```yaml
mcp_servers:
  legacy:
    url: "https://mcp.legacy.internal"
    enabled: false
```

如果 `enabled: false`，Hermes 会完全跳过该服务器，甚至不会尝试连接。

### 白名单服务器工具

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [create_issue, list_issues]
```

只有列出的这些 MCP 服务器工具会被注册。

### 黑名单服务器工具

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    tools:
      exclude: [delete_customer]
```

除被排除的工具外，所有服务器工具都会被注册。

### 优先级规则

如果两者同时存在：

```yaml
tools:
  include: [create_issue]
  exclude: [create_issue, delete_issue]
```

`include` 优先。

### 同样过滤实用工具

您也可以单独禁用 Hermes 添加的实用工具包装器：

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: false
      resources: false
```

这意味着：
-   `tools.resources: false` 禁用 `list_resources` 和 `read_resource`
-   `tools.prompts: false` 禁用 `list_prompts` 和 `get_prompt`

### 完整示例

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [create_issue, list_issues, search_code]
      prompts: false

  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer]
      resources: false

  legacy:
    url: "https://mcp.legacy.internal"
    enabled: false
```

## 如果所有工具都被过滤掉了会怎样？

如果您的配置过滤掉了所有可调用工具，并且禁用或忽略了所有支持的实用工具，Hermes 将不会为该服务器创建空的运行时 MCP 工具集。

这有助于保持工具列表的整洁。

## 运行时行为

### 发现时间

Hermes 在启动时发现 MCP 服务器，并将其工具注册到正常的工具注册表中。

### 动态工具发现

MCP 服务器可以通过发送 `notifications/tools/list_changed` 通知，在运行时通知 Hermes 其可用工具已更改。当 Hermes 收到此通知时，它会自动重新获取服务器的工具列表并更新注册表——无需手动执行 `/reload-mcp`。

这对于功能动态变化的 MCP 服务器非常有用（例如，当加载新的数据库架构时添加工具，或当服务离线时移除工具）。

刷新操作是锁保护的，因此来自同一服务器的快速连续通知不会导致重叠刷新。提示和资源更改通知（`prompts/list_changed`、`resources/list_changed`）会被接收，但目前尚未处理。

### 重新加载

如果您更改了 MCP 配置，请使用：

```text
/reload-mcp
```

这将从配置重新加载 MCP 服务器并刷新可用工具列表。有关由服务器本身推送的运行时工具更改，请参阅上面的[动态工具发现](#动态工具发现)。

### 工具集

每个配置的 MCP 服务器在贡献至少一个已注册工具时，也会创建一个运行时工具集：

```text
mcp-<server>
```

这使得 MCP 服务器在工具集层面更易于理解。

## 安全模型

### 标准输入/输出环境过滤

对于标准输入/输出服务器，Hermes 不会盲目传递您完整的 shell 环境。

只有显式配置的 `env` 加上一个安全基线才会被传递。这减少了意外泄露秘密的风险。

### 配置级暴露控制

新的过滤支持也是一种安全控制：
- 禁用您不希望模型看到的危险工具
- 对敏感服务器仅暴露最小的白名单
- 当您不希望暴露该接口时，禁用资源/提示包装器

## 示例用例

### 仅具有最小问题管理接口的 GitHub 服务器

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, update_issue]
      prompts: false
      resources: false
```

像这样使用：

```text
给我看看标有 bug 的已开启问题，然后为那个不稳定的 MCP 重连行为起草一个新问题。
```

### 移除了危险操作的 Stripe 服务器

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer, refund_payment]
```

像这样使用：

```text
查找最近 10 笔失败的支付，并总结常见的失败原因。
```

### 用于单个项目根目录的文件系统服务器

```yaml
mcp_servers:
  project_fs:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/my-project"]
```

像这样使用：

```text
检查项目根目录并解释目录布局。
```

## 故障排除

### MCP 服务器未连接

检查：

```bash
# 验证 MCP 依赖项已安装（标准安装中已包含）
cd ~/.hermes/hermes-agent && uv pip install -e ".[mcp]"

node --version
npx --version
```

然后验证您的配置并重启 Hermes。

### 工具未出现

可能的原因：
- 服务器连接失败
- 发现失败
- 您的过滤配置排除了这些工具
- 该服务器上不存在该实用能力
- 服务器被 `enabled: false` 禁用

如果您是在有意进行过滤，这是预期的行为。

### 为什么没有出现资源或提示实用程序？

因为 Hermes 现在只在以下两个条件同时满足时才注册这些包装器：
1. 您的配置允许它们
2. 服务器会话实际上支持该能力

这是有意为之，旨在保持工具列表的真实性。

## 并行工具调用

默认情况下，MCP 工具按顺序运行 — 一次一个。如果您的 MCP 服务器暴露了可以安全并发运行的工具（例如只读查询、独立的 API 调用），您可以选择启用并行执行：

```yaml
mcp_servers:
  docs:
    command: "docs-server"
    supports_parallel_tool_calls: true
```

当 `supports_parallel_tool_calls` 为 `true` 时，Hermes 可以在一次工具调用批处理中同时执行来自该服务器的多个工具，就像它对内置只读工具（web_search、read_file 等）所做的那样。

:::caution
仅为那些工具可以安全同时运行的 MCP 服务器启用并行调用。如果工具会读写共享状态、文件、数据库或外部资源，请在启用此设置前审查读/写竞态条件。
:::

## MCP 采样支持

MCP 服务器可以通过 `sampling/createMessage` 协议请求 Hermes 进行 LLM 推理。这允许 MCP 服务器代表自身请求 Hermes 生成文本 — 适用于需要 LLM 能力但没有自己模型访问权限的服务器。

默认情况下，所有 MCP 服务器（当 MCP SDK 支持时）都**启用采样**。在 `sampling` 键下按服务器进行配置：

```yaml
mcp_servers:
  my_server:
    command: "my-mcp-server"
    sampling:
      enabled: true            # 启用采样（默认：true）
      model: "openai/gpt-4o"  # 覆盖采样请求的模型（可选）
      max_tokens_cap: 4096     # 每次采样响应的最大 token 数（默认：4096）
      timeout: 30              # 每次请求的超时时间（秒）（默认：30）
      max_rpm: 10              # 速率限制：每分钟最大请求数（默认：10）
      max_tool_rounds: 5       # 采样循环中的最大工具使用轮次（默认：5）
      allowed_models: []       # 允许服务器请求的模型名称白名单（空=任何）
      log_level: "info"        # 审计日志级别：debug、info 或 warning（默认：info）
```

采样处理程序包括滑动窗口速率限制器、每请求超时和工具循环深度限制，以防止失控使用。指标（请求计数、错误、使用的 token）按服务器实例进行跟踪。

要为特定服务器禁用采样：

```yaml
mcp_servers:
  untrusted_server:
    url: "https://mcp.example.com"
    sampling:
      enabled: false
```

## 将 Hermes 作为 MCP 服务器运行

除了**连接到** MCP 服务器，Hermes 还可以**充当** MCP 服务器。这允许其他支持 MCP 的智能体（Claude Code、Cursor、Codex 或任何 MCP 客户端）使用 Hermes 的消息传递功能 — 列出对话、读取消息历史记录，并在您所有连接的平台上发送消息。

### 何时使用此功能

- 您希望 Claude Code、Cursor 或其他编码智能体通过 Hermes 发送和读取 Telegram/Discord/Slack 消息
- 您想要一个单一的 MCP 服务器，它能够同时桥接到 Hermes 连接的所有消息传递平台
- 您已经拥有一个运行中的、连接了平台的 Hermes 网关

### 快速开始

```bash
hermes mcp serve
```

这将启动一个标准输入/输出的 MCP 服务器。MCP 客户端（而不是您）管理进程的生命周期。

### MCP 客户端配置

将 Hermes 添加到您的 MCP 客户端配置中。例如，在 Claude Code 的 `~/.claude/claude_desktop_config.json` 中：

```json
{
  "mcpServers": {
    "hermes": {
      "command": "hermes",
      "args": ["mcp", "serve"]
    }
  }
}
```

或者，如果您将 Hermes 安装在特定位置：

```json
{
  "mcpServers": {
    "hermes": {
      "command": "/home/user/.hermes/hermes-agent/venv/bin/hermes",
      "args": ["mcp", "serve"]
    }
  }
}
```

### 可用工具

该 MCP 服务器暴露了 10 个工具，与 OpenClaw 的通道桥接接口以及一个 Hermes 特有的通道浏览器相匹配：

| 工具 | 描述 |
|------|-------------|
| `conversations_list` | 列出活跃的消息对话。按平台过滤或按名称搜索。 |
| `conversation_get` | 通过会话键获取一个对话的详细信息。 |
| `messages_read` | 读取一个对话的最近消息历史记录。 |
| `attachments_fetch` | 从特定消息中提取非文本附件（图像、媒体）。 |
| `events_poll` | 从游标位置开始轮询新的对话事件。 |
| `events_wait` | 长轮询/阻塞，直到下一个事件到达（接近实时）。 |
| `messages_send` | 通过平台发送消息（例如 `telegram:123456`、`discord:#general`）。 |
| `channels_list` | 列出所有平台上可用的消息传递目标。 |
| `permissions_list_open` | 列出此桥接会话期间观察到的待处理批准请求。 |
| `permissions_respond` | 允许或拒绝一个待处理的批准请求。 |

### 事件系统

该 MCP 服务器包含一个实时事件桥接器，它会轮询 Hermes 的会话数据库以获取新消息。这使 MCP 客户端能够近乎实时地感知传入的对话：

```
# 轮询新事件（非阻塞）
events_poll(after_cursor=0)

# 等待下一个事件（阻塞直到超时）
events_wait(after_cursor=42, timeout_ms=30000)
```

事件类型：`message`、`approval_requested`、`approval_resolved`

事件队列是内存中的，从桥接器连接时开始。旧消息可以通过 `messages_read` 获取。

### 选项

```bash
hermes mcp serve              # 正常模式
hermes mcp serve --verbose    # 在标准错误输出上启用调试日志
```

### 工作原理

该 MCP 服务器直接从 Hermes 的会话存储（`~/.hermes/sessions/sessions.json` 和 SQLite 数据库）读取对话数据。一个后台线程轮询数据库以获取新消息，并维护一个内存中的事件队列。对于发送消息，它使用与 Hermes 智能体本身相同的 `send_message` 基础设施。

对于读取操作（列出对话、读取历史记录、轮询事件），网关**不需要**运行。对于发送操作，它**需要**运行，因为平台适配器需要活动连接。

### 当前限制

- 嵌入的 `hermes mcp serve` 目前仅暴露一个**纯标准输入/输出**的 MCP 服务器。如果您需要 HTTP MCP 服务器，请运行单独的适配器 — 或者，更常见的是，使用 Hermes 的 MCP **客户端**端，它已经支持标准输入/输出和 HTTP（在 `mcp_servers.yaml` / `config.yaml` 中使用 `url` + `headers`；参见上方的 [HTTP 服务器](#http-servers)）。
- 事件轮询间隔约为 200 毫秒，通过 mtime 优化的数据库轮询实现（当文件未更改时跳过工作）
- 目前尚无 `claude/channel` 推送通知协议
- 仅支持文本发送（无法通过 `messages_send` 发送媒体/附件）

## 相关文档

- [与 Hermes 一起使用 MCP](/guides/use-mcp-with-hermes)
- [CLI 命令](/reference/cli-commands)
- [斜杠命令](/reference/slash-commands)
- [常见问题解答](/reference/faq)