---
sidebar_position: 4
title: "MCP (模型上下文协议)"
description: "通过 MCP 将 Hermes Agent 连接到外部工具服务器，并精确控制 Hermes 加载哪些 MCP 工具"
---

# MCP (模型上下文协议)

MCP 允许 Hermes Agent 连接到外部工具服务器，从而使 Agent 能够使用存在于 Hermes 自身外部的工具——例如 GitHub、数据库、文件系统、浏览器堆栈、内部 API 等。

如果你曾希望 Hermes 使用某个已存在于其他地方的工具，那么使用 MCP 通常是最简洁的方式。

## MCP 为你提供的功能

- 无需首先编写原生 Hermes 工具，即可访问外部工具生态系统
- 在同一配置中支持本地 stdio 服务器和远程 HTTP MCP 服务器
- 启动时自动发现和注册工具
- 当服务器支持时，为 MCP 资源和提示提供实用程序包装器
- 按服务器进行过滤，从而只暴露你确实希望 Hermes 看到的 MCP 工具

## 快速入门

1. 安装 MCP 支持（如果你使用了标准安装脚本，则已包含）：

```bash
cd ~/.hermes/hermes-agent
uv pip install -e ".[mcp]"
```

2. 将 MCP 服务器添加到 `~/.hermes/config.yaml`：

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
```

3. 启动 Hermes：

```bash
hermes chat
```

4. 要求 Hermes 使用 MCP 支持的能力。

例如：

```text
列出 /home/user/projects 中的文件并总结仓库结构。
```

Hermes 将发现 MCP 服务器的工具，并像使用任何其他工具一样使用它们。

## 两种类型的 MCP 服务器

### Stdio 服务器

Stdio 服务器作为本地子进程运行，通过 stdin/stdout 进行通信。

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
```

何时使用 stdio 服务器：
- 服务器已本地安装
- 你需要低延迟地访问本地资源
- 你正在遵循展示了 `command`、`args` 和 `env` 的 MCP 服务器文档

### HTTP 服务器

HTTP MCP 服务器是 Hermes 直接连接的远程端点。

```yaml
mcp_servers:
  remote_api:
    url: "https://mcp.example.com/mcp"
    headers:
      Authorization: "Bearer ***"
```

何时使用 HTTP 服务器：
- MCP 服务器托管在其他地方
- 你的组织暴露了内部 MCP 端点
- 你不希望 Hermes 为该集成启动本地子进程

## 基本配置参考

Hermes 从 `~/.hermes/config.yaml` 的 `mcp_servers` 下读取 MCP 配置。

### 常用键

| Key | Type | Meaning |
|---|---|---|
| `command` | string | stdio MCP 服务器的可执行文件 |
| `args` | list | stdio 服务器的参数 |
| `env` | mapping | 传递给 stdio 服务器的环境变量 |
| `url` | string | HTTP MCP 端点 |
| `headers` | mapping | 远程服务器的 HTTP 头部 |
| `timeout` | number | 工具调用超时时间 |
| `connect_timeout` | number | 初始连接超时时间 |
| `enabled` | bool | 如果为 `false`，Hermes 将完全跳过该服务器 |
| `tools` | mapping | 按服务器过滤和实用程序策略 |

### 最小 stdio 示例

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

## Hermes 如何注册 MCP 工具

Hermes 会为 MCP 工具添加前缀，以防止它们与内置名称冲突：

```text
mcp_<server_name>_<tool_name>
```

示例：

| Server | MCP tool | Registered name |
|---|---|---|
| `filesystem` | `read_file` | `mcp_filesystem_read_file` |
| `github` | `create-issue` | `mcp_github_create_issue` |
| `my-api` | `query.data` | `mcp_my_api_query_data` |

实际上，你通常不需要手动调用带前缀的名称——Hermes 在正常推理过程中会看到工具并选择它。

## MCP 实用程序工具

如果支持，Hermes 还会围绕 MCP 资源和提示注册实用程序工具：

- `list_resources`
- `read_resource`
- `list_prompts`
- `get_prompt`

这些工具会以相同的命名模式，针对每个服务器注册，例如：

- `mcp_github_list_resources`
- `mcp_github_get_prompt`

### 重要提示

这些实用程序工具现在具备能力感知能力：
- 只有当 MCP 会话确实支持资源操作时，Hermes 才会注册资源实用程序
- 只有当 MCP 会话确实支持提示操作时，Hermes 才会注册提示实用程序

因此，一个暴露了可调用工具但没有资源/提示的服务器，不会获得这些额外的包装器。

## 按服务器过滤

你可以控制每个 MCP 服务器向 Hermes 贡献哪些工具，从而实现对工具命名空间的精细管理。

### 完全禁用一个服务器

```yaml
mcp_servers:
  legacy:
    url: "https://mcp.legacy.internal"
    enabled: false
```

如果 `enabled: false`，Hermes 将完全跳过该服务器，甚至不会尝试连接。

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

只有这些 MCP 服务器工具才会被注册。

### 黑名单服务器工具

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    tools:
      exclude: [delete_customer]
```

所有服务器工具都会被注册，除了被排除的工具。

### 优先级规则

如果两者都存在：

```yaml
tools:
  include: [create_issue]
  exclude: [create_issue, delete_issue]
```

`include` 具有更高的优先级。

### 过滤实用程序工具

你也可以单独禁用 Hermes 添加的实用程序包装器：

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: false
      resources: false
```

这意味着：
- `tools.resources: false` 会禁用 `list_resources` 和 `read_resource`
- `tools.prompts: false` 会禁用 `list_prompts` 和 `get_prompt`

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

如果你的配置过滤掉了所有可调用工具，并禁用了或省略了所有支持的实用程序，Hermes 不会为该服务器创建一个空的运行时 MCP 工具集。

这样可以保持工具列表的干净。

## 运行时行为

### 发现时间

Hermes 在启动时发现 MCP 服务器，并将它们的工具注册到正常的工具注册表中。

### 动态工具发现

MCP 服务器可以通过发送 `notifications/tools/list_changed` 通知来通知 Hermes 运行时其可用工具的变化。当 Hermes 收到此通知时，它会自动重新获取服务器的工具列表并更新注册表——无需手动执行 `/reload-mcp`。

这对于能力动态变化的 MCP 服务器非常有用（例如，当加载了新的数据库模式时添加工具，或服务离线时移除工具）。

刷新过程是锁定保护的，以防止来自同一服务器的快速通知引起重叠刷新。提示和资源变化通知（`prompts/list_changed`、`resources/list_changed`）会收到，但尚未执行操作。

### 重新加载

如果你更改了 MCP 配置，请使用：

```text
/reload-mcp
```

这将从配置重新加载 MCP 服务器并刷新可用工具列表。对于服务器自身推送的运行时工具更改，请参阅上方的 [动态工具发现](#dynamic-tool-discovery)。

### 工具集

每个配置的 MCP 服务器在贡献了至少一个已注册工具时，也会创建一个运行时工具集：

```text
mcp-<server>
```

这使得 MCP 服务器在工具集级别上更容易进行推理。

## 安全模型

### Stdio 环境变量过滤

对于 stdio 服务器，Hermes 不会盲目地传递完整的 shell 环境。

只传递明确配置的 `env` 加上一个安全的基线。这减少了意外的密钥泄露。

### 配置级别的暴露控制

新的过滤支持也是一种安全控制：
- 禁用你不想让模型看到的危险工具
- 只暴露敏感服务器的最小白名单
- 当你不希望暴露资源/提示包装器时，禁用它们

## 用例示例

### 带有最小问题管理界面的 GitHub 服务器

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

使用方式：

```text
显示所有标记为 bug 的开放问题，然后为有问题的 MCP 重连行为起草一个新问题。
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

使用方式：

```text
查找最近 10 个失败的支付，并总结常见的失败原因。
```

### 用于单个项目根目录的文件系统服务器

```yaml
mcp_servers:
  project_fs:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/my-project"]
```

使用方式：

```text
检查项目根目录并解释目录布局。
```

## 故障排除

### MCP 服务器无法连接

检查：

```bash
# 验证 MCP 依赖是否已安装（已包含在标准安装中）
cd ~/.hermes/hermes-agent && uv pip install -e ".[mcp]"

node --version
npx --version
```

然后验证你的配置并重启 Hermes。

### 工具未出现

可能的原因：
- 服务器未能连接
- 发现失败
- 你的过滤配置排除了这些工具
- 该服务器没有相应的实用程序能力
- 服务器使用 `enabled: false` 禁用了

如果你是故意进行过滤，这是预期的行为。

### 为什么资源或提示实用程序没有出现？

因为 Hermes 现在只有在以下两个条件都为真时才会注册这些包装器：
1. 你的配置允许它们
2. 服务器会话确实支持该能力

这是故意的，目的是保持工具列表的准确性。

## MCP 采样支持

MCP 服务器可以通过 `sampling/createMessage` 协议向 Hermes 请求 LLM 推理。这允许 MCP 服务器代表自己向 Hermes 请求生成文本——这对于需要 LLM 能力但没有自己模型访问权限的服务器非常有用。

采样功能对所有 MCP 服务器**默认启用**（当 MCP SDK 支持时）。请在 `sampling` 键下按服务器配置：

```yaml
mcp_servers:
  my_server:
    command: "my-mcp-server"
    sampling:
      enabled: true            # 启用采样（默认值：true）
      model: "openai/gpt-4o"  # 覆盖采样请求的模型（可选）
      max_tokens_cap: 4096     # 每个采样响应的最大 token 数（默认值：4096）
      timeout: 30              # 每个请求的超时时间（秒）（默认值：30）
      max_rpm: 10              # 速率限制：每分钟最大请求数（默认值：10）
      max_tool_rounds: 5       # 采样循环中的最大工具使用轮次（默认值：5）
      allowed_models: []       # 服务器可请求的模型名称白名单（空 = 任何）
      log_level: "info"        # 审计日志级别：debug, info, 或 warning（默认值：info）
```

采样处理程序包括滑动窗口速率限制器、每个请求的超时和工具循环深度限制，以防止失控使用。指标（请求计数、错误、使用的 token）是按服务器实例跟踪的。

要禁用特定服务器的采样功能：

```yaml
mcp_servers:
  untrusted_server:
    url: "https://mcp.example.com"
    sampling:
      enabled: false
```

## 将 Hermes 作为 MCP 服务器运行

除了连接**到** MCP 服务器之外，Hermes 本身也可以**成为**一个 MCP 服务器。这允许其他具备 MCP 能力的 Agent（如 Claude Code、Cursor、Codex 或任何 MCP 客户端）使用 Hermes 的消息传递能力——列出对话、读取消息历史记录并在所有连接的平台之间发送消息。

### 何时使用此功能

- 你希望 Claude Code、Cursor 或其他编码 Agent 通过 Hermes 发送和读取 Telegram/Discord/Slack 消息
- 你想要一个单一的 MCP 服务器，能够连接到 Hermes 所有连接的消息平台
- 你已经拥有一个带有连接平台的运行中的 Hermes 网关

### 快速入门

```bash
hermes mcp serve
```

这启动了一个 stdio MCP 服务器。MCP 客户端（而不是你）负责管理进程生命周期。

### MCP 客户端配置

将 Hermes 添加到你的 MCP 客户端配置中。例如，在 Claude Code 的 `~/.claude/claude_desktop_config.json` 中：

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

或者如果你将 Hermes 安装在特定位置：

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

MCP 服务器暴露了 10 个工具，匹配 OpenClaw 的频道桥接表面，外加一个 Hermes 特定的频道浏览器：

| Tool | Description |
|------|-------------|
| `conversations_list` | 列出活动的即时消息对话。可按平台过滤或按名称搜索。 |
| `conversation_get` | 通过会话键获取单个对话的详细信息。 |
| `messages_read` | 读取对话的最近消息历史记录。 |
| `attachments_fetch` | 从特定消息中提取非文本附件（图片、媒体）。 |
| `events_poll` | 自上次游标位置以来轮询新的对话事件。 |
| `events_wait` | 长轮询/阻塞直到到达下一个事件（近实时）。 |
| `messages_send` | 通过平台发送消息（例如 `telegram:123456`，`discord:#general`）。 |
| `channels_list` | 列出所有平台可用的消息目标。 |
| `permissions_list_open` | 列出在此桥接会话期间观察到的待审批请求。 |
| `permissions_respond` | 允许或拒绝待审批请求。 |

### 事件系统

MCP 服务器包含一个实时事件桥，它会轮询 Hermes 的会话数据库以获取新消息。这为 MCP 客户端提供了对传入对话的近实时感知：

```
# 轮询新事件（非阻塞）
events_poll(after_cursor=0)

# 等待下一个事件（阻塞直到超时）
events_wait(after_cursor=42, timeout_ms=30000)
```

事件类型：`message`（消息）、`approval_requested`（请求审批）、`approval_resolved`（审批已解决）

事件队列是内存中的，在桥接连接时开始。旧消息可通过 `messages_read` 访问。

### 选项

```bash
hermes mcp serve              # 正常模式
hermes mcp serve --verbose    # 在 stderr 上进行调试日志记录
```

### 工作原理

MCP 服务器直接从 Hermes 的会话存储（`~/.hermes/sessions/sessions.json` 和 SQLite 数据库）读取对话数据。一个后台线程会轮询数据库以获取新消息，并维护一个内存事件队列。对于发送消息，它使用与 Hermes Agent 本身相同的 `send_message` 基础设施。

网关本身不需要运行才能执行读取操作（列出对话、读取历史记录、轮询事件）。但对于发送操作，它**需要**运行，因为平台适配器需要活动的连接。

### 当前限制

- 仅支持 Stdio 传输（尚未支持 HTTP MCP 传输）
- 通过 mtime 优化的数据库轮询，间隔约为 200ms（文件未更改时跳过工作）
- 尚不支持 `claude/channel` 推送通知协议
- 仅支持文本发送（`messages_send` 不支持媒体/附件发送）

## 相关文档

- [使用 MCP 与 Hermes](/docs/guides/use-mcp-with-hermes)
- [CLI 命令](/docs/reference/cli-commands)
- [斜杠命令](/docs/reference/slash-commands)
- [FAQ](/docs/reference/faq)